import { SchemaInput } from "./types.ts";

export const sampleSchemas: SchemaInput[] = [
  {
    id: "contact-form",
    name: "Contact Form",
    description: "Simple contact form with name, email, and message",
    namespace: "forms",
    tags: ["forms", "contact"],
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        email: { type: "string", format: "email" },
        message: { type: "string", minLength: 5, maxLength: 1000 }
      },
      required: ["name", "email", "message"],
      additionalProperties: false
    }
  },
  {
    id: "product",
    name: "Product",
    description: "Product definition with price and dimensions",
    namespace: "catalog",
    tags: ["product", "catalog"],
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        sku: { type: "string" },
        title: { type: "string" },
        price: { type: "number", minimum: 0 },
        dimensions: {
          type: "object",
          properties: {
            width: { type: "number", minimum: 0 },
            height: { type: "number", minimum: 0 },
            depth: { type: "number", minimum: 0 }
          },
          required: ["width", "height", "depth"],
          additionalProperties: false
        }
      },
      required: ["sku", "title", "price"],
      additionalProperties: false
    }
  },
  {
    id: "todo-item",
    name: "Todo Item",
    description: "Basic todo item schema",
    namespace: "tasks",
    tags: ["todo", "tasks"],
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string", minLength: 1 },
        completed: { type: "boolean", default: false },
        dueDate: { type: "string", format: "date" }
      },
      required: ["id", "title"],
      additionalProperties: false
    }
  }
];
