---
name: try
description: Run the sk CLI command for testing
allowed-tools: Bash
user-invocable: true
argument-hint: "<command> [args...]"
---

Run the sk CLI in development mode with the provided arguments:

```bash
npx tsx bin/sk.ts $ARGUMENTS
```

1. Execute the command above
2. Show the output
3. If it fails, analyze the error and suggest fixes
4. If no arguments provided, run `npx tsx bin/sk.ts --help`
