# sk — SwiftKanban CLI & MCP Server

A command-line interface and [MCP server](https://modelcontextprotocol.io/) for [SwiftKanban](https://www.nimblework.com/products/swiftkanban/). Manage boards, cards, and more from your terminal or through Claude AI.

## Installation

```bash
npm install -g @nimblework/sk-cli
```

Or from source:

```bash
git clone <repo-url> sk-cli
cd sk-cli
npm install && npm run build
npm link
```

## Configuration

### Quick start: Login

The easiest way to get started is to log in with your SwiftKanban credentials:

```bash
sk login --user you@example.com --password yourpassword
```

This authenticates against the SwiftKanban API and stores the JWT token in your config file. Your account must have the **Integration User** role — contact your SwiftKanban admin if login fails with a permissions error.

You can also store credentials in config so `sk login` works without flags:

```bash
sk config set user you@example.com
sk config set password yourpassword
sk login
```

### Manual token setup

If you already have a JWT token:

```bash
sk config set token eyJhbGciOiJIUz...
```

### Server URL

The default server is `https://login.swiftkanban.com`. To use a different instance:

```bash
sk config set server https://your-instance.swiftkanban.com
```

### Environment variables

```bash
export SK_SERVER=https://your-instance.swiftkanban.com
export SK_TOKEN=eyJhbGciOiJIUz...
export SK_BOARD_ID=BOARD-123   # optional default board
export SK_USER=you@example.com
export SK_PASSWORD=yourpassword
```

### CLI flags

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

### Login

```bash
# Login with flags
sk login --user you@example.com --password yourpassword

# Login using stored/env credentials
sk login
```

### Boards

```bash
# List all boards
sk boards list

# Get a specific board
sk boards get BOARD-123
```

### Cards

Card IDs use the `CardCode:numericId` format (e.g., `UserStory:679602`). The `workType` and `id` fields from card list output combine to form this.

```bash
# List cards on a board
sk cards --board-id 1582582 list

# Get card details (CardCode:id format)
sk cards --board-id 1582582 get UserStory:679602

# Create a card
sk cards --board-id 1582582 create --name "Fix login bug" --description "Users can't log in on Safari"

# Create a card with full JSON payload
sk cards --board-id 1582582 create --json '{"name": "New feature", "description": "Add dark mode"}'

# Update a card
sk cards --board-id 1582582 update UserStory:679602 --name "Updated name"

# Update a card with JSON
sk cards --board-id 1582582 update UserStory:679602 --json '{"name": "New name", "description": "New desc"}'

# Delete a card
sk cards --board-id 1582582 delete UserStory:679602
```

**Tip:** Set a default board to avoid passing `--board-id` every time:

```bash
sk config set defaultBoardId 1582582

# Now these work without --board-id
sk cards list
sk cards create --name "Quick card"
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
┌──────────┬─────────────────┬────────┐
│ Board ID │ Name            │ State  │
├──────────┼─────────────────┼────────┤
│ 1570749  │ Engineering     │ Active │
│ 1571422  │ Marketing       │ Active │
└──────────┴─────────────────┴────────┘
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

## MCP Server (Claude AI Integration)

sk-cli includes an MCP server that lets Claude interact with SwiftKanban directly.

### Setup

**1. Install the package:**

```bash
npm install -g @nimblework/sk-cli
```

**2. Get your auth token** by logging in:

```bash
sk login --user you@example.com --password yourpassword
```

The token is saved to `~/.config/sk-cli/config.json`. Copy it for the next step.

**3. Find the full path to `sk-mcp`:**

Claude Desktop does not inherit your shell PATH, so you must use the absolute path to `sk-mcp`.

```bash
which sk-mcp
# e.g., /Users/you/.npm-global/bin/sk-mcp
```

**4. Configure Claude Desktop**

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "swiftkanban": {
      "command": "/full/path/to/sk-mcp",
      "env": {
        "SK_TOKEN": "your-jwt-token",
        "SK_SERVER": "https://login.swiftkanban.com"
      }
    }
  }
}
```

Replace `/full/path/to/sk-mcp` with the output from step 3, and `your-jwt-token` with the token from step 2.

**5. Restart Claude Desktop** to pick up the new config.

### Available MCP Tools

| Tool | Description |
|---|---|
| `login` | Authenticate with email/password, saves token |
| `get_config` | Show current configuration |
| `list_boards` | List all accessible boards |
| `get_board` | Get board details |
| `list_cards` | List cards on a board |
| `get_card` | Get card details (use `CardCode:id` format) |
| `create_card` | Create a new card |
| `update_card` | Update an existing card |
| `delete_card` | Delete a card |

All tools that require `board_id` will fall back to the `SK_BOARD_ID` env var if not provided.

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
├── bin/
│   ├── sk.ts              # CLI entry point
│   └── sk-mcp.ts          # MCP server entry point
├── src/
│   ├── cli/               # Command definitions (Commander.js)
│   ├── services/          # Business logic (shared by CLI + MCP)
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

MIT
