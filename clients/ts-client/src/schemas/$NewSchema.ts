/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $NewSchema = {
  properties: {
    id: {
      type: 'string',
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
