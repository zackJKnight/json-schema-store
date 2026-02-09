/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NewSchema } from '../models/NewSchema';
import type { NewSchemaRequiredId } from '../models/NewSchemaRequiredId';
import type { NewUiSchema } from '../models/NewUiSchema';
import type { Schema } from '../models/Schema';
import type { Suggestion } from '../models/Suggestion';
import type { UiSchema } from '../models/UiSchema';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DefaultService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Health check
   * @returns any Service is healthy
   * @throws ApiError
   */
  public getHealth(): CancelablePromise<{
    ok: boolean;
    timestamp: string;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/health',
    });
  }
  /**
   * List schemas
   * @returns any List of schemas
   * @throws ApiError
   */
  public getSchemas({
    limit,
    cursor,
    q,
    namespace,
    tag,
    sort,
  }: {
    limit?: number,
    cursor?: number,
    /**
     * Full-text match on name or description
     */
    q?: string,
    namespace?: string,
    tag?: string,
    /**
     * Sort by updatedAt (default) or name
     */
    sort?: 'updatedAt' | 'name',
  }): CancelablePromise<{
    items: Array<Schema>;
    cursor: string | null;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/schemas',
      query: {
        'limit': limit,
        'cursor': cursor,
        'q': q,
        'namespace': namespace,
        'tag': tag,
        'sort': sort,
      },
    });
  }
  /**
   * Create schema
   * @returns Schema Created
   * @throws ApiError
   */
  public postSchemas({
    requestBody,
  }: {
    requestBody: NewSchema,
  }): CancelablePromise<Schema> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/schemas',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Bad request`,
        409: `Conflict`,
      },
    });
  }
  /**
   * Suggest schemas by query
   * @returns any Suggestions
   * @throws ApiError
   */
  public getSchemasSuggest({
    q,
    limit,
  }: {
    q: string,
    limit?: number,
  }): CancelablePromise<{
    items: Array<Suggestion>;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/schemas/suggest',
      query: {
        'q': q,
        'limit': limit,
      },
      errors: {
        400: `Bad request`,
      },
    });
  }
  /**
   * List available namespaces
   * @returns any Namespaces
   * @throws ApiError
   */
  public getNamespaces(): CancelablePromise<{
    items: Array<string>;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/namespaces',
    });
  }
  /**
   * List UI schemas
   * @returns any List of UI schemas
   * @throws ApiError
   */
  public getUiSchemas({
    limit,
    cursor,
    q,
    namespace,
    tag,
    schemaId,
    fragment,
    sort,
  }: {
    limit?: number,
    cursor?: number,
    q?: string,
    namespace?: string,
    tag?: string,
    schemaId?: string,
    fragment?: string,
    sort?: 'updatedAt' | 'name',
  }): CancelablePromise<{
    items: Array<UiSchema>;
    cursor: string | null;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/ui-schemas',
      query: {
        'limit': limit,
        'cursor': cursor,
        'q': q,
        'namespace': namespace,
        'tag': tag,
        'schemaId': schemaId,
        'fragment': fragment,
        'sort': sort,
      },
    });
  }
  /**
   * Create UI schema
   * @returns UiSchema Created
   * @throws ApiError
   */
  public postUiSchemas({
    requestBody,
  }: {
    requestBody: NewUiSchema,
  }): CancelablePromise<UiSchema> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/ui-schemas',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Bad request`,
        404: `Not found`,
      },
    });
  }
  /**
   * Get UI schema
   * @returns UiSchema UI schema
   * @throws ApiError
   */
  public getUiSchemas1({
    id,
  }: {
    id: string,
  }): CancelablePromise<UiSchema> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/ui-schemas/{id}',
      path: {
        'id': id,
      },
      errors: {
        404: `Not found`,
      },
    });
  }
  /**
   * Delete UI schema
   * @returns any Deleted
   * @throws ApiError
   */
  public deleteUiSchemas({
    id,
  }: {
    id: string,
  }): CancelablePromise<{
    deleted: boolean;
  }> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/ui-schemas/{id}',
      path: {
        'id': id,
      },
      errors: {
        404: `Not found`,
      },
    });
  }
  /**
   * Get schema
   * @returns Schema Schema
   * @throws ApiError
   */
  public getSchemas1({
    id,
  }: {
    id: string,
  }): CancelablePromise<Schema> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/schemas/{id}',
      path: {
        'id': id,
      },
      errors: {
        404: `Not found`,
      },
    });
  }
  /**
   * Create or update schema
   * @returns Schema Updated
   * @throws ApiError
   */
  public putSchemas({
    id,
    requestBody,
  }: {
    id: string,
    requestBody: NewSchemaRequiredId,
  }): CancelablePromise<Schema> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/schemas/{id}',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Bad request`,
      },
    });
  }
  /**
   * Patch schema (JSON Merge Patch or JSON Patch)
   * @returns Schema Patched schema
   * @throws ApiError
   */
  public patchSchemas({
    id,
    requestBody,
    ifMatch,
  }: {
    id: string,
    requestBody: Array<Record<string, any>>,
    /**
     * Optional precondition; must match current ETag (updatedAt).
     */
    ifMatch?: string,
  }): CancelablePromise<Schema> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/schemas/{id}',
      path: {
        'id': id,
      },
      headers: {
        'If-Match': ifMatch,
      },
      body: requestBody,
      mediaType: 'application/json-patch+json',
      errors: {
        400: `Bad request`,
        404: `Not found`,
        412: `Precondition failed (ETag mismatch)`,
        415: `Unsupported patch content-type`,
      },
    });
  }
  /**
   * Delete schema
   * @returns any Deleted
   * @throws ApiError
   */
  public deleteSchemas({
    id,
  }: {
    id: string,
  }): CancelablePromise<{
    deleted: boolean;
  }> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/schemas/{id}',
      path: {
        'id': id,
      },
      errors: {
        404: `Not found`,
      },
    });
  }
  /**
   * List UI schemas for a schema
   * @returns any UI schemas
   * @throws ApiError
   */
  public getSchemasUiSchemas({
    id,
    limit,
    cursor,
    fragment,
  }: {
    id: string,
    limit?: number,
    cursor?: number,
    fragment?: string,
  }): CancelablePromise<{
    items: Array<UiSchema>;
    cursor: string | null;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/schemas/{id}/ui-schemas',
      path: {
        'id': id,
      },
      query: {
        'limit': limit,
        'cursor': cursor,
        'fragment': fragment,
      },
      errors: {
        404: `Not found`,
      },
    });
  }
  /**
   * Create UI schema for a schema
   * @returns UiSchema Created
   * @throws ApiError
   */
  public postSchemasUiSchemas({
    id,
    requestBody,
  }: {
    id: string,
    requestBody: NewUiSchema,
  }): CancelablePromise<UiSchema> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/schemas/{id}/ui-schemas',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Bad request`,
        404: `Not found`,
      },
    });
  }
  /**
   * Validate data against a stored schema
   * @returns any Validation result (valid)
   * @throws ApiError
   */
  public postSchemasValidate({
    id,
    requestBody,
  }: {
    id: string,
    requestBody: Record<string, any>,
  }): CancelablePromise<{
    valid: boolean;
    errors?: Array<Record<string, any>>;
  }> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/schemas/{id}/validate',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        404: `Not found`,
        422: `Validation failed`,
      },
    });
  }
  /**
   * Fetch a fragment of a schema by JSON Pointer
   * @returns any Fragment returned
   * @throws ApiError
   */
  public getSchemasFragment({
    id,
    pointer,
  }: {
    id: string,
    /**
     * JSON Pointer to select part of the stored schema (e.g., /properties/title).
     */
    pointer: string,
  }): CancelablePromise<{
    pointer: string;
    value: any;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/schemas/{id}/fragment',
      path: {
        'id': id,
      },
      query: {
        'pointer': pointer,
      },
      errors: {
        400: `Bad request`,
        404: `Not found`,
      },
    });
  }
}
