/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $UiSchema = {
  properties: {
    id: {
      type: 'string',
      isRequired: true,
    },
    schemaId: {
      type: 'string',
      isRequired: true,
    },
    name: {
      type: 'string',
      isRequired: true,
    },
    description: {
      type: 'string',
    },
    fragment: {
      type: 'string',
    },
    namespace: {
      type: 'string',
    },
    tags: {
      type: 'array',
      contains: {
        type: 'string',
      },
    },
    primary: {
      type: 'boolean',
    },
    uiSchema: {
      type: 'dictionary',
      contains: {
        properties: {
        },
      },
      isRequired: true,
    },
    createdAt: {
      type: 'string',
      isRequired: true,
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      isRequired: true,
      format: 'date-time',
    },
  },
} as const;
