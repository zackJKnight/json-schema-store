export interface NewSchemaPayload {
  id?: string;
  name: string;
  description?: string;
  namespace?: string;
  tags?: string[];
  schema: Record<string, unknown>;
}

export interface SchemaInput extends NewSchemaPayload {
  id: string;
}

export interface SchemaRecord extends SchemaInput {
  createdAt: string;
  updatedAt: string;
}

export interface NewUiSchemaPayload {
  id?: string;
  schemaId: string;
  name: string;
  description?: string;
  fragment?: string;
  namespace?: string;
  tags?: string[];
  primary?: boolean;
  uiSchema: Record<string, unknown>;
}

export interface UiSchemaInput extends NewUiSchemaPayload {
  id: string;
}

export interface UiSchemaRecord extends UiSchemaInput {
  createdAt: string;
  updatedAt: string;
}
