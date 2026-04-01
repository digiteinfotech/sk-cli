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

## Conventions

- Test file mirrors source: `src/services/boards.ts` → `test/unit/services/boards.test.ts`
- Use `describe` blocks grouped by function/method
- Test names: `it('returns boards when API responds with 200')`
- Mock HTTP at the fetch level using msw, not by mocking modules
- Each test should be independent — no shared mutable state

## Running Tests

```bash
npm test                    # All unit tests
npm run test:watch          # Watch mode
npm run test:integration    # Integration tests (needs SK_TOKEN)
```
