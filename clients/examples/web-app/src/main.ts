import "./style.css";
import { JsonSchemaApiClient } from "json-schema-store-client";
import type { Schema, UiSchema } from "json-schema-store-client";

const defaultBase = "https://deno-api-zk.deno.dev";

const baseInput = document.querySelector<HTMLInputElement>("#api-base")!;
const fetchButton = document.querySelector<HTMLButtonElement>("#fetch")!;
const applyButton = document.querySelector<HTMLButtonElement>("#apply")!;
const statusEl = document.querySelector<HTMLSpanElement>("#status")!;
const searchInput = document.querySelector<HTMLInputElement>("#search")!;
const namespaceSelect = document.querySelector<HTMLSelectElement>("#namespace")!;
const tagInput = document.querySelector<HTMLInputElement>("#tag")!;
const grid = document.querySelector<HTMLDivElement>("#schema-grid")!;
const schemaCount = document.querySelector<HTMLParagraphElement>("#schema-count")!;
const activeFilter = document.querySelector<HTMLDivElement>("#active-filter")!;
const detailName = document.querySelector<HTMLHeadingElement>("#detail-name")!;
const detailNamespace = document.querySelector<HTMLParagraphElement>("#detail-namespace")!;
const detailMeta = document.querySelector<HTMLDivElement>("#detail-meta")!;
const uiMeta = document.querySelector<HTMLDivElement>("#ui-meta")!;
const uiSelect = document.querySelector<HTMLSelectElement>("#ui-schema")!;
const fragmentNote = document.querySelector<HTMLParagraphElement>("#fragment-note")!;
const formRoot = document.querySelector<HTMLDivElement>("#form-root")!;
const dataView = document.querySelector<HTMLPreElement>("#data-view")!;

let client = new JsonSchemaApiClient({ BASE: defaultBase });
let schemas: Schema[] = [];
let currentSchema: Schema | null = null;
let currentUiSchemas: UiSchema[] = [];
let currentData: Record<string, unknown> = {};
let namespacesLoaded = false;
let savedNamespace = "";
let savedTag = "";
let savedSearch = "";

init();

function init() {
  const savedBase = localStorage.getItem("apiBase") || defaultBase;
  baseInput.value = savedBase;
  loadFilterState();
  client = new JsonSchemaApiClient({ BASE: savedBase });
  fetchButton.addEventListener("click", () => reload({ refreshNamespaces: true }));
  applyButton.addEventListener("click", () => {
    saveFilterState();
    reload({ refreshNamespaces: false });
  });
  uiSelect.addEventListener("change", () => selectUiSchema(uiSelect.value));
  reload();
}

async function reload(opts: { refreshNamespaces?: boolean } = {}) {
  const { refreshNamespaces = true } = opts;
  const baseUrl = baseInput.value.trim() || defaultBase;
  localStorage.setItem("apiBase", baseUrl);
  client = new JsonSchemaApiClient({ BASE: baseUrl });
  setStatus("Loading schemas...");
  if (refreshNamespaces || !namespacesLoaded) {
    await loadNamespaces();
  }
  await loadSchemas();
}

async function loadNamespaces() {
  try {
    const current = namespaceSelect.value;
    const { items } = await client.default.getNamespaces();
    namespaceSelect.innerHTML = "<option value=''>All</option>" + items.map((ns) => `<option value="${ns}">${ns}</option>`).join("");
    const options = new Set(["", ...items]);
    const target = options.has(current) ? current : (options.has(savedNamespace) ? savedNamespace : "");
    namespaceSelect.value = target;
    namespacesLoaded = true;
  } catch (err) {
    console.error(err);
  }
}

async function loadSchemas() {
  try {
    const q = searchInput.value.trim() || savedSearch || undefined;
    const namespace = namespaceSelect.value || savedNamespace || undefined;
    const tag = tagInput.value.trim() || savedTag || undefined;
    const { items } = await client.default.getSchemas({ limit: 30, q, namespace, tag, sort: "updatedAt" });
    schemas = items;
    renderSchemaGrid(items);
    schemaCount.textContent = `${items.length} loaded`;
    activeFilter.textContent = namespace ? `Namespace: ${namespace}` : "All namespaces";
    setStatus("Ready");
    if (items.length && (!currentSchema || !items.find((i) => i.id === currentSchema?.id))) {
      await selectSchema(items[0].id);
    }
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="error">${(err as Error).message}</div>`;
    setStatus("Request failed");
  }
}

function saveFilterState() {
  savedNamespace = namespaceSelect.value;
  savedTag = tagInput.value.trim();
  savedSearch = searchInput.value.trim();
  localStorage.setItem("filters", JSON.stringify({ namespace: savedNamespace, tag: savedTag, search: savedSearch }));
}

function loadFilterState() {
  const stored = localStorage.getItem("filters");
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored) as { namespace?: string; tag?: string; search?: string };
    savedNamespace = parsed.namespace ?? "";
    savedTag = parsed.tag ?? "";
    savedSearch = parsed.search ?? "";
    namespaceSelect.value = savedNamespace;
    tagInput.value = savedTag;
    searchInput.value = savedSearch;
  } catch {
    /* ignore parse errors */
  }
}

function renderSchemaGrid(items: Schema[]) {
  grid.innerHTML = "";
  if (!items.length) {
    grid.innerHTML = `<p class="subtle">No schemas found for this filter.</p>`;
    return;
  }
  const fragments = document.createDocumentFragment();
  for (const item of items) fragments.append(renderCard(item));
  grid.append(fragments);
}

function renderCard(item: Schema) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-header">
      <p class="name">${item.name}</p>
      <span class="meta-pill">${item.namespace ?? "(no namespace)"}</span>
    </div>
    <p class="desc">${item.description ?? "No description"}</p>
    <div class="tags">${(item.tags ?? []).map((t) => `<span>${t}</span>`).join("")}</div>
    <code class="id">${item.id}</code>
    <div class="actions">
      <button type="button" data-id="${item.id}">Open</button>
    </div>
  `;
  card.querySelector("button")?.addEventListener("click", () => selectSchema(item.id));
  return card;
}

async function selectSchema(id: string) {
  try {
    setStatus("Loading schema detail...");
    const [schema, uiList] = await Promise.all([
      client.default.getSchemas1({ id }),
      client.default.getSchemasUiSchemas({ id, limit: 20 }),
    ]);
    currentSchema = schema;
    currentUiSchemas = uiList.items;
    renderDetail(schema, uiList.items);
    setStatus("Ready");
  } catch (err) {
    console.error(err);
    setStatus("Failed to load detail");
  }
}

function renderDetail(schema: Schema, uiSchemas: UiSchema[]) {
  detailName.textContent = schema.name;
  detailNamespace.textContent = schema.namespace ? `Namespace: ${schema.namespace}` : "No namespace";
  const pills: string[] = [];
  if (schema.tags?.length) pills.push(...schema.tags.map((t) => `<span class="pill">${t}</span>`));
  pills.unshift(`<span class="pill">ID: ${schema.id}</span>`);
  detailMeta.innerHTML = pills.join("");

  uiSelect.innerHTML = "";
  if (!uiSchemas.length) {
    uiSelect.disabled = true;
    uiSelect.innerHTML = `<option>None available</option>`;
    uiMeta.innerHTML = `<span class="pill">No UI schemas yet</span>`;
    formRoot.innerHTML = `<p class="subtle">Add a UI schema to render a form.</p>`;
    dataView.textContent = "{}";
    fragmentNote.textContent = "";
    return;
  }

  uiSelect.disabled = false;
  uiSelect.innerHTML = uiSchemas.map((u) => `<option value="${u.id}">${u.name}</option>`).join("");
  const first = uiSchemas[0];
  uiSelect.value = first.id;
  selectUiSchema(first.id);
}

function selectUiSchema(id: string) {
  const chosen = currentUiSchemas.find((u) => u.id === id);
  if (!currentSchema || !chosen) return;
  const info: string[] = [];
  info.push(`<span class="pill">${chosen.name}</span>`);
  if (chosen.namespace) info.push(`<span class="pill">${chosen.namespace}</span>`);
  if (chosen.fragment) info.push(`<span class="pill">fragment: ${chosen.fragment}</span>`);
  if (chosen.tags?.length) info.push(...chosen.tags.map((t) => `<span class="pill">${t}</span>`));
  uiMeta.innerHTML = info.join("");
  fragmentNote.textContent = chosen.fragment ? `Rendering fragment ${chosen.fragment}` : "Rendering full schema";
  currentData = {};
  renderForm(currentSchema, chosen);
  updateDataView();
}

function renderForm(schema: Schema, ui: UiSchema) {
  formRoot.innerHTML = "";
  const effectiveSchema = ui.fragment ? getByPointer(schema.schema, ui.fragment) : schema.schema;
  if (!isRecord(effectiveSchema)) {
    formRoot.innerHTML = `<div class="error">Fragment is not an object schema.</div>`;
    return;
  }

  const form = document.createElement("form");
  renderLayout(ui.uiSchema, effectiveSchema, form);
  formRoot.append(form);
}

function renderLayout(layout: unknown, schema: Record<string, unknown>, parent: HTMLElement) {
  if (!isRecord(layout) || typeof layout.type !== "string") return;

  const type = layout.type;
  if (type === "VerticalLayout" || type === "HorizontalLayout") {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = type === "VerticalLayout" ? "column" : "row";
    container.style.gap = "10px";
    const elements = Array.isArray(layout.elements) ? layout.elements : [];
    for (const el of elements) renderLayout(el, schema, container);
    parent.append(container);
    return;
  }

  if (type === "Group") {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = typeof layout.label === "string" ? layout.label : "Group";
    fieldset.append(legend);
    const elements = Array.isArray(layout.elements) ? layout.elements : [];
    for (const el of elements) renderLayout(el, schema, fieldset);
    parent.append(fieldset);
    return;
  }

  if (type === "Control" && typeof layout.scope === "string") {
    const path = scopeToDataPath(layout.scope);
    const propertySchema = getByPointer(schema, layout.scope.replace(/^#/, ""));
    parent.append(renderControl(path, propertySchema, layout.label));
  }
}

function renderControl(path: string[], propertySchema: unknown, label?: string) {
  const wrapper = document.createElement("div");
  wrapper.className = "control";

  const title = document.createElement("label");
  title.textContent = label || (isRecord(propertySchema) && typeof propertySchema.title === "string" ? propertySchema.title : path[path.length - 1]);
  wrapper.append(title);

  let input: HTMLInputElement | HTMLSelectElement;
  const schemaRecord = isRecord(propertySchema) ? propertySchema : {};
  const type = typeof schemaRecord.type === "string" ? schemaRecord.type : "string";

  if (Array.isArray(schemaRecord.enum)) {
    const select = document.createElement("select");
    for (const option of schemaRecord.enum) {
      const opt = document.createElement("option");
      opt.value = String(option);
      opt.textContent = String(option);
      select.append(opt);
    }
    input = select;
  } else if (type === "boolean") {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    input = checkbox;
  } else {
    const text = document.createElement("input");
    text.type = type === "number" || type === "integer" ? "number" : "text";
    input = text;
  }

  input.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    let value: unknown = target.value;
    if (input instanceof HTMLInputElement && input.type === "number") {
      value = target.value === "" ? null : Number(target.value);
    }
    if (input instanceof HTMLInputElement && input.type === "checkbox") {
      value = input.checked;
    }
    setData(path, value);
    updateDataView();
  });

  if (isRecord(propertySchema) && typeof propertySchema.description === "string") {
    const help = document.createElement("small");
    help.textContent = propertySchema.description;
    wrapper.append(help);
  }

  wrapper.append(input);
  return wrapper;
}

function setData(path: string[], value: unknown) {
  let cursor: Record<string, unknown> = currentData;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (i === path.length - 1) {
      cursor[key] = value;
    } else {
      const next = cursor[key];
      if (!isRecord(next)) cursor[key] = {};
      cursor = cursor[key] as Record<string, unknown>;
    }
  }
}

function updateDataView() {
  dataView.textContent = JSON.stringify(currentData, null, 2);
}

function scopeToDataPath(scope: string): string[] {
  if (!scope.startsWith("#/")) return [];
  return scope.slice(2).split("/").filter((part) => part !== "properties");
}

function getByPointer(obj: unknown, pointer: string): unknown {
  if (pointer === "" || pointer === "#") return obj;
  const clean = pointer.startsWith("#") ? pointer.slice(1) : pointer;
  if (!clean.startsWith("/")) return undefined;
  const segments = clean.slice(1).split("/").map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
  let current: unknown = obj;
  for (const seg of segments) {
    if (current === null || typeof current !== "object" || Array.isArray(current)) return undefined;
    const rec = current as Record<string, unknown>;
    if (!(seg in rec)) return undefined;
    current = rec[seg];
  }
  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function setStatus(message: string) {
  statusEl.textContent = message;
}
