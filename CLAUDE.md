# SK-CLI — SwiftKanban CLI & MCP Server

**npm:** `@nimblework/sk-cli` — published on npm as a public scoped package.

A TypeScript CLI and MCP server for interacting with the SwiftKanban REST API, designed for both human and AI (Claude) usage.

## Quick Reference

```bash
npm run build          # Build with tsup (both CLI + MCP)
npm test               # Run tests with vitest
npx tsx bin/sk.ts      # Run CLI in development
npx tsx bin/sk-mcp.ts  # Run MCP server in development
npm publish            # Publish to npm (needs granular token with 2FA bypass)
```

## Tech Stack

- **Language:** TypeScript (strict mode, ESM)
- **Runtime:** Node.js v24
- **CLI Framework:** Commander.js
- **MCP:** @modelcontextprotocol/sdk (stdio transport)
- **HTTP:** Built-in fetch (Node 24)
- **Validation:** zod
- **Testing:** vitest + msw
- **Build:** tsup (esbuild, two entry points)

## Architecture

```
CLI Layer (bin/sk.ts → src/cli/)         ← Commander commands, thin wrappers
MCP Layer (bin/sk-mcp.ts)                ← MCP tools, thin wrappers
    ↓                    ↓
Service Layer (src/services/)            ← Business logic, shared by CLI + MCP
    ↓
API Client (src/api/)                    ← HTTP client, auth, error handling
```

The service layer is shared by both the CLI and MCP server — no business logic duplication.

## API Details

- **Default Server:** `https://login.swiftkanban.com` (also works: `https://webapi.swiftkanban.com`)
- **Base Path:** `/restapi/` (NOT `/api/`)
- **Auth Header:** `AuthorizationToken: <jwt>` (NOT `Authorization: Bearer`)
- **Auth Endpoint:** `POST /restapi/secured/auth` (Content-Type: `text/plain`, body: `{"AuthenticationToken":"SwiftKanban <base64(user:pass)>"}`)
- **Token:** JWT with no expiry; requires "Integration User" role on the SwiftKanban account
- **OpenAPI Spec:** `https://login.swiftkanban.com/restapi/openapi.json`
- **Swagger UI:** https://login.swiftkanban.com/swift-api-doc/
- **Docs:** https://www.nimblework.com/knowledge-base/swiftkanban/article-category/web-services-api-documentation/

## API Response Envelope

All SwiftKanban API responses are wrapped in a `Response.details` envelope:

```json
{ "Response": { "details": { ... }, "messageView": { "type": "success|error", "message": ["..."] } } }
```

Key data locations:
- **Boards list:** `Response.details.board` (array)
- **Single board:** `Response.details.boardDetails` (object)
- **Cards list:** `Response.details.cardDetails` (array)
- **Single card:** `Response.details.cardDetails` (object or single-element array)

Services (`src/services/`) handle envelope unwrapping. The `RestClient` returns raw responses.

## API Endpoint Paths

- Boards: `GET /restapi/board-operations/boards`, `GET /restapi/board-operations/boards/{id}`
- Cards: `GET/PUT/POST/DELETE /restapi/card-operations/boards/{boardId}/cards`
- Single card: `GET/DELETE /restapi/card-operations/boards/{boardId}/cards/{CardCode}:{numericId}`
- Card ID format: `{workType}:{id}` (e.g., `UserStory:679602`, `PERS:1859339`)

## Field Naming

SwiftKanban uses different field names than typical APIs:
- Board: `boardId` (not `id`), `projectName` (not `name`)
- Card: `name` (not `title`), `currentQueue` (column), `currentSwimName` (lane), `currentOwner` (assignee), `workType` (card code prefix)

## Output Convention

All commands write **data to stdout** (JSON by default) and **diagnostics to stderr**.

Success envelope:
```json
{ "ok": true, "data": { ... }, "meta": { "total": 42 } }
```

Error envelope:
```json
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "...", "status": 404 } }
```

## Exit Codes

- `0` — success
- `1` — client error (bad input, not found, auth failure)
- `2` — server error (5xx, timeout)
- `3` — configuration error (missing token, bad config)

## Configuration Precedence

1. CLI flags (`--token`, `--server`) — highest
2. Environment variables (`SK_TOKEN`, `SK_SERVER`, `SK_BOARD_ID`)
3. Config file (`~/.config/sk-cli/config.json`) — lowest

## Key Rules

- @.claude/rules/code-style.md
- @.claude/rules/api-patterns.md
- @.claude/rules/testing.md
