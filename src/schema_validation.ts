import Ajv2020 from "npm:ajv@8.17.1/dist/2020.js";
import addFormats from "npm:ajv-formats@2.1.1";
import $RefParser from "npm:@apidevtools/json-schema-ref-parser@11.7.2";
import { HttpError } from "./http_error.ts";

const ajv = new Ajv2020.default({ allErrors: true, strict: false, allowUnionTypes: true });
addFormats.default(ajv);

export async function ensureValidJsonSchema(schema: Record<string, unknown>): Promise<void> {
  const deref = await dereference(schema);
  const valid = ajv.validateSchema(deref);
  if (!valid) {
    throw new HttpError(400, "Invalid JSON Schema", { errors: ajv.errors });
  }
}

export async function validateDataAgainstSchema(
  schema: Record<string, unknown>,
  data: unknown,
): Promise<{ valid: boolean; errors?: unknown[] }> {
  const deref = await dereference(schema);
  const validate = ajv.compile(deref);
  const valid = validate(data);
  return { valid: Boolean(valid), errors: validate.errors ?? undefined };
}

async function dereference(schema: Record<string, unknown>): Promise<Record<string, unknown>> {
  const deref = await $RefParser.dereference(structuredClone(schema), {
    dereference: { circular: "ignore" },
  });
  return deref as Record<string, unknown>;
}
