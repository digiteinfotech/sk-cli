# SK-CLI — SwiftKanban Command-Line Interface

A TypeScript CLI for interacting with the SwiftKanban REST API, designed for both human and AI (Claude) usage.

## Quick Reference

```bash
npm run build          # Build with tsup
npm test               # Run tests with vitest
npx tsx bin/sk.ts      # Run CLI in development
```

## Tech Stack

- **Language:** TypeScript (strict mode, ESM)
- **Runtime:** Node.js v24
- **CLI Framework:** Commander.js
- **HTTP:** Built-in fetch (Node 24)
- **Validation:** zod
- **Testing:** vitest + msw
- **Build:** tsup (esbuild)

## Architecture

```
CLI Layer (src/cli/)        ← Commander commands, thin wrappers
    ↓
Service Layer (src/services/) ← Business logic, reusable by future MCP server
    ↓
API Client (src/api/)       ← HTTP client, auth, error handling
```

The service layer is intentionally separated so it can be wrapped as an MCP server later without changing business logic.

## API Details

- **Base URL:** `https://webapi.swiftkanban.com/api`
- **Auth:** JWT Bearer token (no expiry)
- **Swagger:** https://login.swiftkanban.com/swift-api-doc/
- **Docs:** https://www.nimblework.com/knowledge-base/swiftkanban/article-category/web-services-api-documentation/

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
