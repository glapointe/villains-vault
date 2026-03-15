# MCP Integration Guide

Villains Vault exposes a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that lets AI assistants query runDisney race data conversationally. Instead of navigating the UI or calling REST endpoints directly, you can ask questions in natural language — _"Who won the 2024 Walt Disney World Marathon?"_ or _"How did Jane Doe do compared to her 2023 race?"_ — and get structured answers powered by the same backend data.

MCP is an open standard created by Anthropic that provides a uniform way for AI tools (Claude, GitHub Copilot in VS Code, Cursor, etc.) to discover and invoke server-side tools. The Villains Vault API implements the **Streamable HTTP** transport, so any MCP-compatible client can connect over a single HTTP endpoint with no additional plugins.

## What Can You Do With It?

- Browse events and races across all runDisney weekends
- Search for any runner by name, bib number, or hometown
- Get detailed placement stats, percentile rankings, and split analysis
- Compare two runners head-to-head within the same race
- Track a runner's results across multiple events and years
- Explore hometown and geographic breakdowns of race participants
- View race-day weather conditions
- See pre-calculated race statistics (age groups, runner types, congestion data)

For a complete list of every available tool with parameters and example prompts, see the [MCP Tools Reference](MCP_TOOLS_REFERENCE.md).

---

## Quick Start

The public Villains Vault instance is available at:

```
https://vault.villains.run/mcp
```

No API keys, authentication, or local setup required — just point your AI editor at the URL above and start asking questions about runDisney race data.

The MCP endpoint is rate-limited to **60 requests per minute** per client.

### Verify the endpoint

The MCP Streamable HTTP transport is session-based. The first request must be an `initialize` call, and subsequent requests must include the session ID returned in the response headers. MCP-compatible editors (Claude, VS Code, etc.) handle this automatically — the curl examples below are just for manual verification.

**Step 1 — Initialize a session:**

```bash
curl -N -i -X POST https://vault.villains.run/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"curl-test","version":"1.0"}}}'
```

Look for the `Mcp-Session-Id` header in the response (the `-i` flag prints headers). Copy its value.

**Step 2 — List available tools:**

```bash
curl -N -X POST https://vault.villains.run/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: <SESSION_ID>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

Replace `<SESSION_ID>` with the value from Step 1. A successful response returns the list of all available tools with their descriptions and parameter schemas.

> **Windows / PowerShell note:** PowerShell aliases `curl` to `Invoke-WebRequest`. Use `curl.exe` explicitly,
> and use `""` for nested quotes:
> ```powershell
> curl.exe -N -i -X POST "https://vault.villains.run/mcp" `
>   -H "Content-Type: application/json" `
>   -H "Accept: application/json, text/event-stream" `
>   -d "{""jsonrpc"":""2.0"",""id"":1,""method"":""initialize"",""params"":{""protocolVersion"":""2025-11-25"",""capabilities"":{},""clientInfo"":{""name"":""curl-test"",""version"":""1.0""}}}"
> ```

---

## Editor Setup

All editors below are configured to use the public instance. If you're running a [local development instance](#local-development) instead, replace the URL with `http://localhost:5000/mcp`.

### Claude Desktop

Add the following to your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "villains-vault": {
      "type": "streamable-http",
      "url": "https://vault.villains.run/mcp"
    }
  }
}
```

Restart Claude Desktop after saving. You should see a hammer (🔨) icon in the chat input indicating MCP tools are available. Claude will automatically discover and use the tools when you ask questions about runDisney race data.

### VS Code (GitHub Copilot)

VS Code supports MCP servers through GitHub Copilot's agent mode. Add the server configuration to your workspace or user settings.

#### Option A: Workspace configuration (recommended)

Create or edit `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "villains-vault": {
      "type": "streamable-http",
      "url": "https://vault.villains.run/mcp"
    }
  }
}
```

#### Option B: User settings

Add to your VS Code `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "villains-vault": {
        "type": "streamable-http",
        "url": "https://vault.villains.run/mcp"
      }
    }
  }
}
```

Once configured, open **Copilot Chat** in **Agent mode** and the Villains Vault tools will be available. You can verify by looking for the tools icon in the chat panel.

### Cursor

Add the MCP server in Cursor's settings:

1. Open **Settings** → **MCP**
2. Click **Add new MCP server**
3. Enter the following:

| Field | Value |
|-------|-------|
| Name | `villains-vault` |
| Type | `streamable-http` |
| URL | `https://vault.villains.run/mcp` |

Alternatively, create a `.cursor/mcp.json` file in your project:

```json
{
  "mcpServers": {
    "villains-vault": {
      "type": "streamable-http",
      "url": "https://vault.villains.run/mcp"
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "villains-vault": {
      "type": "streamable-http",
      "url": "https://vault.villains.run/mcp"
    }
  }
}
```

---

## Common Examples

Below are example prompts you can use in any MCP-connected AI assistant. The assistant will automatically invoke the appropriate tools.

### Browsing Events & Races

> _"What runDisney events are available?"_

> _"Show me all the races from 2024."_

> _"What years have race data?"_

> _"Give me details about the Walt Disney World Marathon — how many runners were there?"_

### Looking Up Runners

> _"Find John Smith in the 2024 Walt Disney World Half Marathon."_

> _"Look up bib number 12345 in race 7."_

> _"Search for runners from Orlando, FL in the 2024 marathon."_

### Performance Analysis

> _"How did Jane Doe place overall and in her age group?"_

> _"What percentile was runner 54321 in? Were they in the top 10%?"_

> _"Show me Jane's split times — did she run a negative split?"_

> _"Compare John Smith and Jane Doe in the same race. Who had better splits?"_

### Tracking Across Events

> _"Has Jane Doe run other runDisney races? Show me all her results."_

> _"How has runner 54321 improved across different race years?"_

### Leaderboards & Geography

> _"Who were the top 10 finishers in the 2024 marathon?"_

> _"Show me the top female finishers in race 7."_

> _"Who were the fastest runners from Orlando, FL?"_

> _"What states and countries were represented in the marathon? How many runners from each?"_

> _"What cities in Florida had runners in this race and how many from each?"_

> _"Which state had the most runners? Which city in Florida sent the most?"_

> _"How many hand cycle participants came from each state?"_

> _"Show me the runner type breakdown for cities in New York."_

### Race Insights

> _"What were the weather conditions on race day for the 2024 marathon?"_

> _"Show me race statistics — age group breakdown and runner types."_

> _"What divisions are available for race 7?"_

> _"Who was the balloon lady / last starter in the marathon?"_

### Combining Tools (Multi-step)

> _"Find Jane Doe in the 2024 Half Marathon, show her split analysis, and then compare her with the race winner."_

> _"List all 2024 events, pick the marathon, and show me the top 5 finishers with their percentile rankings."_

---

## Local Development

If you're contributing to the project or want to run your own instance, you can connect to a local MCP server instead.

### Prerequisites

| Requirement | Details |
|-------------|--------|
| **.NET 10 SDK** | Required to build and run the API |
| **API source** | Clone this repository |

### 1. Start the API

```bash
cd src/api/Falchion.Villains.Vault.Api
dotnet run
```

The server starts on `http://localhost:5000` by default (configured in `Properties/launchSettings.json`).

### 2. Verify the local MCP endpoint

The MCP transport is session-based. Initialize a session first, then use the returned `Mcp-Session-Id` header for subsequent calls (the `-i` flag prints response headers, `-N` disables output buffering):

```bash
curl -N -i -X POST http://localhost:5000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"curl-test","version":"1.0"}}}'
```

See the [Quick Start](#verify-the-endpoint) section for the full two-step flow.

### 3. Point your editor at the local instance

Use `http://localhost:5000/mcp` in place of `https://vault.villains.run/mcp` in any of the [editor configurations above](#editor-setup).

---

## Rate Limits

The public MCP endpoint is rate-limited to **60 requests per minute** per client. If you exceed this limit, you'll receive an HTTP 429 response. Most conversational usage is well within this limit.

## Further Reading

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [MCP Tools Reference](MCP_TOOLS_REFERENCE.md) — Complete list of all tools, parameters, and example prompts
- [Villains Vault API README](../src/api/README.md)
