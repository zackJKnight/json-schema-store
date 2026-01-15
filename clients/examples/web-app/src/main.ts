import "./style.css";
import { JsonSchemaApiClient, SchemasService } from "json-schema-store-client";

const apiBase = localStorage.getItem("apiBase") || "http://localhost:8000";
const client = new JsonSchemaApiClient({ baseUrl: apiBase });

const baseInput = document.querySelector<HTMLInputElement>("#api-base")!;
const listButton = document.querySelector<HTMLButtonElement>("#fetch")!;
const output = document.querySelector<HTMLDivElement>("#output")!;
const statusEl = document.querySelector<HTMLSpanElement>("#status")!;

baseInput.value = apiBase;

listButton.addEventListener("click", async () => {
  const baseUrl = baseInput.value.trim() || "http://localhost:8000";
  localStorage.setItem("apiBase", baseUrl);
  statusEl.textContent = "Loading...";
  output.innerHTML = "";

  try {
    const list = await SchemasService.schemasControllerGetSchemas({ limit: 10 }, { baseUrl });
    statusEl.textContent = `Loaded ${list.items.length} schemas`;
    output.append(...list.items.map(renderCard));
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Request failed";
    output.innerHTML = `<div class="error">${(err as Error).message}</div>`;
  }
});

function renderCard(item: { id: string; name: string; description?: string; namespace?: string; tags?: string[] }) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-header">
      <span class="name">${item.name}</span>
      <span class="meta">${item.namespace ?? "(no namespace)"}</span>
    </div>
    <p class="desc">${item.description ?? "No description"}</p>
    <div class="tags">${(item.tags ?? []).map((t) => `<span>${t}</span>`).join("")}</div>
    <code class="id">${item.id}</code>
  `;
  return card;
}
