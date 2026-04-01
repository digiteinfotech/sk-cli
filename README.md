# sk — SwiftKanban CLI

A command-line interface for [SwiftKanban](https://www.nimblework.com/products/swiftkanban/) that lets you manage boards, cards, and more from your terminal. Designed for both human and AI (Claude) usage — all output is structured JSON by default.

## Installation

```bash
# Clone and install
git clone <repo-url> sk-cli
cd sk-cli
npm install

# Build
npm run build

# Link globally (makes `sk` available everywhere)
npm link
```

For development without building:

```bash
npx tsx bin/sk.ts <command>
```

## Configuration

`sk` needs two things to work: your **SwiftKanban server URL** and a **JWT token**.

### 1. Set your server URL

```bash
sk config set server https://your-instance.swiftkanban.com
```

### 2. Set your auth token

```bash
sk config set token eyJhbGciOiJIUz...
```

### Alternative: Environment variables

```bash
export SK_SERVER=https://your-instance.swiftkanban.com
export SK_TOKEN=eyJhbGciOiJIUz...
export SK_BOARD_ID=BOARD-123   # optional default board
```

### Alternative: CLI flags

```bash
sk --server https://your-instance.swiftkanban.com --token eyJ... boards list
```

### Configuration precedence

CLI flags > Environment variables > Config file (`~/.config/sk-cli/config.json`)

### View current config

```bash
sk config show
```

## Usage

### Boards

```bash
# List all boards
sk boards list

# Get a specific board
sk boards get BOARD-123
```

### Cards

```bash
# List cards on a board
sk cards --board-id BOARD-123 list

# Get card details
sk cards --board-id BOARD-123 get CARD-456

# Create a card
sk cards --board-id BOARD-123 create --title "Fix login bug" --description "Users can't log in on Safari"

# Create a card with full JSON payload
sk cards --board-id BOARD-123 create --json '{"title": "New feature", "description": "Add dark mode", "columnId": "TODO"}'

# Update a card
sk cards --board-id BOARD-123 update CARD-456 --title "Updated title"

# Update a card with JSON
sk cards --board-id BOARD-123 update CARD-456 --json '{"title": "New title", "description": "New desc"}'

# Delete a card
sk cards --board-id BOARD-123 delete CARD-456
```

**Tip:** Set a default board to avoid passing `--board-id` every time:

```bash
sk config set defaultBoardId BOARD-123

# Now these work without --board-id
sk cards list
sk cards create --title "Quick card"
```

### Config

```bash
# Set a value
sk config set server https://my-instance.swiftkanban.com

# Get a value
sk config get server

# Show all config (tokens are redacted)
sk config show
```

### Available config keys

| Key | Description |
|---|---|
| `server` | SwiftKanban server URL |
| `token` | JWT auth token |
| `defaultBoardId` | Default board ID |
| `format` | Output format (`json` or `table`) |
| `user` | Username (for JWT generation) |
| `password` | Password (for JWT generation) |

## Output Formats

### JSON (default)

All commands output structured JSON to stdout:

```json
{
  "ok": true,
  "data": [ ... ],
  "meta": { "total": 5 }
}
```

Errors go to stderr:

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Card XYZ-123 was not found",
    "status": 404
  }
}
```

### Table

Use `--format table` for human-readable output:

```bash
sk --format table boards list
```

```
┌──────────┬─────────────────┬─────────────┐
│ ID       │ Name            │ Description │
├──────────┼─────────────────┼─────────────┤
│ BOARD-1  │ Engineering     │ Dev board   │
│ BOARD-2  │ Marketing       │             │
└──────────┴─────────────────┴─────────────┘
```

Set table as default:

```bash
sk config set format table
```

## Global Options

| Option | Description |
|---|---|
| `--format <json\|table>` | Output format (default: `json`) |
| `--server <url>` | Override server URL |
| `--token <token>` | Override auth token |
| `--verbose` | Print debug info to stderr |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Client error (bad input, not found, auth failure) |
| `2` | Server error (5xx, timeout) |
| `3` | Configuration error (missing token, bad config) |

## Using with Claude

`sk` is designed as a tool for Claude (AI agent). Claude can:

```bash
# List boards and pick one
sk boards list

# Create a card from structured data
sk cards --board-id BOARD-1 create --json '{"title": "Implement auth", "description": "Add JWT authentication to the API", "columnId": "BACKLOG"}'

# Check card status
sk cards --board-id BOARD-1 get CARD-789
```

All output is machine-parseable JSON, and errors are structured with codes for programmatic handling.

## Development

```bash
# Run in dev mode (no build needed)
npx tsx bin/sk.ts <command>

# Type check
npm run typecheck

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build

# Lint
npm run lint
```

### Project Structure

```
sk-cli/
├── bin/sk.ts              # Entry point
├── src/
│   ├── cli/               # Command definitions (Commander.js)
│   ├── services/          # Business logic (reusable by future MCP server)
│   ├── api/               # REST client, types, auth
│   ├── config/            # Config loading (CLI > env > file)
│   └── output/            # JSON/table formatting
├── test/
│   ├── unit/              # Unit tests (vitest + msw)
│   ├── integration/       # Integration tests (needs SK_TOKEN)
│   └── fixtures/          # Sample API responses
└── .claude/               # Claude Code config (skills, agents, rules)
```

### Adding new commands

Use the Claude Code skills:

```
/add-endpoint cards move      # Scaffold a full endpoint
/add-command  cards archive   # Add a CLI command
/discover-api lanes           # Probe API for new endpoints
```

## License

UNLICENSED — Internal use only.
