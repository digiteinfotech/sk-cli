# Testing

## Framework

- **vitest** for all tests
- **msw** (Mock Service Worker) for HTTP mocking in unit tests
- Test files: `test/unit/**/*.test.ts`
- Integration tests: `test/integration/**/*.test.ts` (gated by `SK_INTEGRATION_TEST=1`)

## Fixtures

Store sample API responses in `test/fixtures/` as JSON files:
- `test/fixtures/boards-list.json`
- `test/fixtures/card-detail.json`
- etc.

All mock responses must use the SwiftKanban envelope format:
```json
{ "Response": { "details": { "board": [...] }, "messageView": { "type": "success", "message": ["OK"] } } }
```

## Conventions

- Test file mirrors source: `src/services/boards.ts` → `test/unit/services/boards.test.ts`
- MCP server tests: `test/unit/mcp/server.test.ts`
- Use `describe` blocks grouped by function/method
- Test names: `it('returns boards when API responds with 200')`
- Mock HTTP at the fetch level using msw, not by mocking modules
- Each test should be independent — no shared mutable state

## MCP Server Testing

MCP server tests use the `@modelcontextprotocol/sdk` Client class with custom in-process transports (TransformStream-based). The `InMemoryTransport` was removed from the SDK's public API. See `test/unit/mcp/server.test.ts` for the transport implementation pattern. Tests:
- Set `SK_SERVER` and `SK_TOKEN` env vars in `beforeAll`
- Connect MCP client to server via in-process transport
- Call tools via `client.callTool()` and assert on JSON content

## Running Tests

```bash
npm test                    # All unit tests
npm run test:watch          # Watch mode
npm run test:integration    # Integration tests (needs SK_TOKEN)
```
