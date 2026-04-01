---
name: discover-api
description: Probe the SwiftKanban API to discover and document endpoints
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
user-invocable: true
argument-hint: "[endpoint-path]"
---

Probe the SwiftKanban REST API to discover endpoints and document them.

## Setup

Read the token from environment variable `SK_TOKEN` or from `~/.config/sk-cli/config.json`.
Use the base URL from `SK_SERVER` (default: `https://webapi.swiftkanban.com`).

## If an endpoint path is provided ($ARGUMENTS):

1. Probe the specific endpoint with curl:
   ```bash
   curl -s -w "\n%{http_code}" -H "Authorization: Bearer $SK_TOKEN" "$SK_SERVER/api/$ARGUMENTS"
   ```
2. Document the response shape
3. Update `src/api/types.ts` with the discovered types
4. Suggest a service function and CLI command for this endpoint

## If no endpoint path is provided:

1. Try these common REST patterns to discover the API surface:
   - `GET /api/` (root)
   - `GET /api/boards`
   - `GET /api/boardcards`
   - `GET /api/users`
   - `GET /api/projects`
   - `GET /api/lanes`
   - `GET /api/members`
   - `GET /api/metadata`
   - `GET /api/swagger.json`
   - `GET /api/v1/boards`
   - `GET /api/v2/boards`
2. For each endpoint that returns 200, document the response structure
3. Create a summary of all discovered endpoints
4. Update `src/api/types.ts` with discovered types

## Output

Write findings to `docs/api-discovery.md` with:
- Endpoint path, HTTP method
- Response status code
- Response body sample (truncated if large)
- Inferred TypeScript types
