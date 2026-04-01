# Code Style

- TypeScript strict mode with ESM modules (`"type": "module"` in package.json)
- 2-space indentation, single quotes, no semicolons (prettier defaults)
- Use `async/await` everywhere — no callbacks, no raw `.then()` chains
- Use `zod` for all input validation and API response parsing
- No `any` types — use `unknown` and narrow with zod or type guards
- Prefer `const` over `let`, never use `var`
- Use named exports, not default exports
- File naming: kebab-case (e.g., `rest-client.ts`, `board-service.ts`)
- One module per file — no barrel files except `src/cli/index.ts`
- Import with `.js` extension for ESM compatibility (e.g., `import { foo } from './bar.js'`)
