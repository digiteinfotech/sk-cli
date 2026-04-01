---
name: add-endpoint
description: Scaffold a new API endpoint with service, CLI command, types, and tests
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
user-invocable: true
argument-hint: "<resource> <operation>"
---

Add a new API endpoint to sk-cli following established patterns.

Arguments: `$ARGUMENTS` (e.g., "boards get" or "cards create")

## Steps

1. **Read existing patterns** — look at an existing service (e.g., `src/services/boards.ts`) and CLI command (e.g., `src/cli/boards.ts`) to understand the conventions

2. **Add types** in `src/api/types.ts`:
   - Request type (if POST/PUT)
   - Response type
   - Use zod schemas for validation

3. **Add service function** in `src/services/<resource>.ts`:
   - Call the API client
   - Parse response with zod
   - Return typed data

4. **Add CLI command** in `src/cli/<resource>.ts`:
   - Define commander command with options
   - Call the service function
   - Output via the formatter

5. **Register command** in `src/cli/index.ts` if it's a new resource group

6. **Add test fixture** in `test/fixtures/<resource>-<operation>.json`

7. **Add unit test** in `test/unit/services/<resource>.test.ts`

8. **Verify** by running `npm run build` and `npm test`
