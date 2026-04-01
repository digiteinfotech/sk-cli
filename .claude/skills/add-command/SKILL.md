---
name: add-command
description: Add a new CLI command following project patterns
allowed-tools: Read, Write, Edit, Grep, Glob
user-invocable: true
argument-hint: "<command-group> <subcommand>"
---

Add a new CLI command to sk-cli.

Arguments: `$ARGUMENTS` (e.g., "cards block" or "lanes list")

## Steps

1. **Read the existing command patterns** — examine `src/cli/boards.ts` or `src/cli/cards.ts` for the pattern

2. **Check if the command group file exists** (`src/cli/<group>.ts`):
   - If yes, add the new subcommand to it
   - If no, create a new command group file

3. **Define the command** with Commander.js:
   - Command name and description
   - Required and optional arguments/options
   - `--board-id` option if the command is board-scoped
   - `--json` option for structured input if it's a create/update command
   - `--format` option inherited from global

4. **Wire to service layer** — the command handler should:
   - Resolve config (merge CLI flags with env/config file)
   - Call the appropriate service function
   - Pass result to output formatter
   - Handle errors with proper exit codes

5. **Register in `src/cli/index.ts`** if it's a new group

6. **Verify** the command appears in `npx tsx bin/sk.ts --help`
