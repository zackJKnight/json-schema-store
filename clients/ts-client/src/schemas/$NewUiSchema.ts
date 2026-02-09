/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $NewUiSchema = {
  properties: {
    id: {
      type: 'string',
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
  },
} as const;
