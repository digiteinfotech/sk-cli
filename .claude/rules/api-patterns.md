# API Patterns

## REST Client

All HTTP calls go through `src/api/client.ts` which handles:
- Auth header injection (`AuthorizationToken: <jwt>` — NOT `Authorization: Bearer`)
- Base URL resolution (default: `https://login.swiftkanban.com`)
- All API paths use `/restapi/` prefix (e.g., `/restapi/board-operations/boards`)
- Error normalization into `ApiError` class
- Retry on 429 (rate limit) and 5xx with exponential backoff (max 3 retries)
- 30-second request timeout

## Authentication

Login is handled by `src/services/auth.ts`, invoked via `sk login`:
- Endpoint: `POST /restapi/secured/auth`
- Content-Type: `text/plain` (unusual — body is JSON-as-plain-text)
- Body: `{"AuthenticationToken":"SwiftKanban <base64(user:password)>"}`
- Response JWT at: `response.Response.details.authDetails.AuthorizationToken`
- Requires "Integration User" role on the SwiftKanban account

## Response Envelope

All SwiftKanban responses are wrapped in `Response.details`. Services unwrap this:

```typescript
const raw = await client.get<SkResponse>('/restapi/...')
const parsed = skResponseSchema.parse(raw)
const data = parsed.Response.details.someKey // boards: "board", cards: "cardDetails"
```

Check `parsed.Response.messageView.type === 'error'` for API-level errors that return HTTP 200.

## Adding a New Endpoint

1. Add request/response types in `src/api/types.ts`
2. Add service function in `src/services/<resource>.ts` (unwrap `Response.details` envelope)
3. Add CLI command in `src/cli/<resource>.ts`
4. Register command in `src/cli/index.ts`
5. Add MCP tool in `bin/sk-mcp.ts` (wrap service call with error handling)
6. Add test fixtures in `test/fixtures/`
7. Add unit tests

## JSON Envelope

All CLI output uses a standard envelope:

```typescript
// Success
{ ok: true, data: T, meta?: { total?: number, limit?: number, offset?: number } }

// Error
{ ok: false, error: { code: string, message: string, status?: number } }
```

## Error Codes

Use UPPER_SNAKE_CASE error codes:
- `AUTH_REQUIRED` — no token configured
- `AUTH_FAILED` — token rejected (401)
- `NOT_FOUND` — resource not found (404)
- `VALIDATION_ERROR` — bad input
- `SERVER_ERROR` — 5xx from API
- `NETWORK_ERROR` — connection failed
- `TIMEOUT` — request timed out
- `CONFIG_ERROR` — missing/invalid configuration

## Exit Codes

- `0` — success
- `1` — client error (bad input, not found, auth failure)
- `2` — server error (5xx, timeout)
- `3` — configuration error
