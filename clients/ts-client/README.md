# JSON Schema Store TypeScript Client

Generated fetch-based client for the JSON Schema Store API, suitable for browser apps or bundlers that provide `fetch`.

## Install

```sh
npm install json-schema-store-client
```

## Usage

```ts
import { JsonSchemaApiClient, SchemasService } from "json-schema-store-client";

const client = new JsonSchemaApiClient({ baseUrl: "http://localhost:8000" });
const list = await SchemasService.schemasControllerGetSchemas({ limit: 20 });
console.log(list.items);
```

## Development

- `npm run generate` — regenerate the client from `../openapi.json`
- `npm run build` — regenerate and emit compiled JS/types to `dist`

Generation runs automatically on `npm install`/publish via `prepare`.

If you update the API spec, rerun `npm run generate` (or `npm run build`) before committing. Hook it into your workflow with a git pre-commit hook, for example:

```sh
npx husky add .husky/pre-commit "cd clients/ts-client && npm run build"
```
