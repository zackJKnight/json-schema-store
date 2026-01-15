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
