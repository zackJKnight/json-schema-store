/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $NewSchemaRequiredId = {
  properties: {
    id: {
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
    namespace: {
      type: 'string',
    },
    tags: {
      type: 'array',
      contains: {
        type: 'string',
      },
    },
    schema: {
      type: 'dictionary',
      contains: {
        properties: {
        },
      },
      isRequired: true,
    },
  },
} as const;
