import { UiSchemaInput } from "./types.ts";

export const sampleUiSchemas: UiSchemaInput[] = [
  {
    id: "contact-form-default",
    schemaId: "contact-form",
    name: "Contact Form (default)",
    description: "Vertical form for contact submissions",
    namespace: "forms",
    tags: ["default", "contact"],
    primary: true,
    uiSchema: {
      type: "VerticalLayout",
      elements: [
        { type: "Control", label: "Full name", scope: "#/properties/name" },
        { type: "Control", label: "Email", scope: "#/properties/email" },
        { type: "Control", label: "Message", scope: "#/properties/message" },
      ],
    },
  },
  {
    id: "contact-form-inline",
    schemaId: "contact-form",
    name: "Contact Form (two-column)",
    description: "Two-column layout with message full-width",
    namespace: "forms",
    tags: ["contact", "two-column"],
    primary: false,
    uiSchema: {
      type: "VerticalLayout",
      elements: [
        {
          type: "HorizontalLayout",
          elements: [
            { type: "Control", label: "Full name", scope: "#/properties/name" },
            { type: "Control", label: "Email", scope: "#/properties/email" },
          ],
        },
        { type: "Control", label: "Message", scope: "#/properties/message" },
      ],
    },
  },
  {
    id: "product-default",
    schemaId: "product",
    name: "Product (details)",
    description: "Product form with dimensions group",
    namespace: "catalog",
    tags: ["default", "catalog"],
    primary: true,
    uiSchema: {
      type: "Group",
      label: "Product",
      elements: [
        { type: "Control", scope: "#/properties/sku" },
        { type: "Control", scope: "#/properties/title" },
        { type: "Control", scope: "#/properties/price" },
        {
          type: "Group",
          label: "Dimensions",
          elements: [
            { type: "Control", scope: "#/properties/dimensions/properties/width" },
            { type: "Control", scope: "#/properties/dimensions/properties/height" },
            { type: "Control", scope: "#/properties/dimensions/properties/depth" },
          ],
        },
      ],
    },
  },
  {
    id: "product-summary",
    schemaId: "product",
    name: "Product (summary)",
    description: "Compact SKU/title/price header",
    namespace: "catalog",
    tags: ["summary", "compact"],
    primary: false,
    uiSchema: {
      type: "HorizontalLayout",
      elements: [
        { type: "Control", label: "SKU", scope: "#/properties/sku" },
        { type: "Control", label: "Title", scope: "#/properties/title" },
        { type: "Control", label: "Price", scope: "#/properties/price" },
      ],
    },
  },
  {
    id: "product-dimensions-fragment",
    schemaId: "product",
    fragment: "/properties/dimensions",
    name: "Product dimensions section",
    description: "Focused layout for dimensions fragment",
    namespace: "catalog",
    tags: ["fragment", "dimensions"],
    primary: false,
    uiSchema: {
      type: "VerticalLayout",
      elements: [
        { type: "Control", scope: "#/properties/width" },
        { type: "Control", scope: "#/properties/height" },
        { type: "Control", scope: "#/properties/depth" },
      ],
    },
  },
  {
    id: "todo-default",
    schemaId: "todo-item",
    name: "Todo item",
    description: "Simple todo form",
    namespace: "tasks",
    tags: ["default", "tasks"],
    primary: true,
    uiSchema: {
      type: "VerticalLayout",
      elements: [
        { type: "Control", scope: "#/properties/title" },
        { type: "Control", scope: "#/properties/completed" },
        { type: "Control", scope: "#/properties/dueDate" },
      ],
    },
  },
  {
    id: "todo-compact",
    schemaId: "todo-item",
    name: "Todo quick entry",
    description: "Inline title with completed toggle",
    namespace: "tasks",
    tags: ["compact", "inline"],
    primary: false,
    uiSchema: {
      type: "HorizontalLayout",
      elements: [
        { type: "Control", scope: "#/properties/title" },
        { type: "Control", scope: "#/properties/completed" },
        { type: "Control", scope: "#/properties/dueDate" },
      ],
    },
  },
];
