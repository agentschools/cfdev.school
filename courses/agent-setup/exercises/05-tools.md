---
description: "Connect your agent to the Cloudflare API with the Cloudflare MCP server, which uses Code Mode to stay token-efficient."
agent-instructions: |
  This exercise connects the student's agent to the Cloudflare MCP server
  (https://github.com/cloudflare/mcp), a remote server at
  https://mcp.cloudflare.com/mcp that covers the entire Cloudflare API.
  Adapt depth to the student's interview answers.

  1. Explain MCP and Code Mode. MCP (Model Context Protocol) is how an
     agent gets extra tools from an outside server. Normally every tool's
     name, description, and parameters sit in the model's context window
     the whole time. The Cloudflare API has about 2,500 endpoints, and
     describing them as individual tools would take roughly 244,000
     tokens, more than most models' entire context window. Code Mode
     fixes this: the server exposes just a few tools (`search`,
     `execute`, and a `docs` search) that take JavaScript. The agent
     writes code to `search` the OpenAPI spec for the endpoints it needs,
     then writes code to `execute` calls against them. The definitions
     cost about 1,100 tokens in total, around 0.5% of what individual
     tools would, and the full API is still reachable.

     Distinguish a server and its connection from the individual tools it
     exposes. For Claude app users, explain the "connectors" terminology
     below; don't confuse the app's Connectors settings with the Claude
     Code CLI's MCP commands.

  2. Add the server, named `cloudflare`, using the student's agent.
     Use the OAuth option (the server redirects to Cloudflare to
     authorize and pick permissions), not an API token. Use the steps
     for the agent you are:

     - Claude app (claude.ai or Claude Desktop): follow the linked
       custom-connectors guide below to add the remote server through
       Connectors, then connect with OAuth and enable it for the chat.
       Team/Enterprise users may need an owner to add it first.
     - Claude Code:
         claude mcp add --transport http --scope user cloudflare https://mcp.cloudflare.com/mcp
       then run `/mcp` and follow the browser steps to log in.
     - Codex:
         codex mcp add cloudflare --url https://mcp.cloudflare.com/mcp
         codex mcp login cloudflare
       If login fails, check Codex's current MCP docs for whether an
       rmcp client feature flag is still needed.
     - OpenCode: run `opencode mcp add` (Type: remote, Name:
       cloudflare, URL: https://mcp.cloudflare.com/mcp) or add
       `"mcp": { "cloudflare": { "type": "remote", "url":
       "https://mcp.cloudflare.com/mcp" } }` to opencode.json, then run
       `opencode mcp auth cloudflare`.
     - Pi (0.99 or newer; older versions have no MCP, so check
       `pi --version` and have the student update first):
         pi mcp add cloudflare --url https://mcp.cloudflare.com/mcp
         pi mcp login cloudflare
       Or add `{ "mcpServers": { "cloudflare": { "url":
       "https://mcp.cloudflare.com/mcp" } } }` to ~/.pi/agent/mcp.json and
       run `/reload`. `/mcp` opens a TUI to check the connection. Pi's
       MCP servers default to `codemode` exposure: Pi has its own Code
       Mode, so you reach the server's tools by writing JavaScript that
       calls `searchTools()` / `describeTool()` rather than seeing them
       as individual tools. Cloudflare's server is already Code Mode, so
       this nests one inside the other; it works, but tell the student
       that's why the calls look different from other agents. Don't
       change exposure or add `?codemode=false` unless they ask.
     - Cursor: add the generic config below to ~/.cursor/mcp.json (use
       just `"url"`, no `"type"`), then connect it from Settings, Tools &
       MCP, and complete the OAuth login in the browser.
     - GitHub Copilot CLI: run `/mcp add` (type HTTP) or add the generic
       config below to ~/.copilot/mcp-config.json.
     - Other agents: use the generic config below in the agent's MCP
       config file, or check its docs for how to add a remote HTTP server.

     Generic config:

       { "mcpServers": { "cloudflare": { "type": "http", "url": "https://mcp.cloudflare.com/mcp" } } }

     Prefer the agent's own add command over hand-editing config files.
     When you do edit a file, merge into what's there; don't overwrite
     the student's other servers. Make sure to tell the student that the
     OAuth screen lets them choose which permissions to grant, and that
     they should grant only what they need (read-only is fine to start).
     An API token is a fallback (https://dash.cloudflare.com/profile/api-tokens),
     but tokens with Client IP Address Filtering aren't supported.

  3. Restart or reload as needed. Most agents need a restart (or `/mcp`
     reload) before a newly added server's tools appear. If the student
     needs to restart you, tell them how to get back to this exercise
     afterward (paste the same Dev School prompt again).

  4. Verify before completing: have the student confirm the server shows
     as connected in their agent (e.g. `claude mcp list`, `/mcp`), then
     run one harmless read-only request through it, such as listing the
     Workers or zones on their account, or searching the Cloudflare docs
     with the `docs` tool. Show them that you used `search` first and
     then `execute`, so they see Code Mode working.

  5. Explain when to use `cf` vs. the MCP server: `cf` is for building
     and deploying projects from the terminal; the MCP server is for
     querying and managing account resources through the API, and for
     anything `cf` doesn't cover yet. Both are available to the agent.
     Mention that `execute` can change account resources, so the agent
     should confirm with the student before any write or delete.

  Optional switches (only mention if asked): append `?codemode=false` to
  the server URL to disable Code Mode (for use with another Code Mode
  system), and `?truncateToolResult=false` to disable the default
  6,000-token cap on tool results.

  Out of scope: building your own MCP server, other Cloudflare MCP
  servers (docs, observability, etc.), and writing Workers.

  Only mark this exercise complete once the server is connected and the
  student has seen one real request succeed through it. Use the quiz if
  they opted in, or just confirm conversationally otherwise.

  If this finishes Agent setup, ask the student which way they want to
  go next, as llms.txt's "Courses" section describes.
---

# Tools

MCP (Model Context Protocol) is how an agent gets extra tools from an outside server. Cloudflare's [MCP server](https://github.com/cloudflare/mcp) gives your agent access to the whole Cloudflare API, so it can look things up and manage your account without you copy-pasting from the dashboard.

## Tools, servers, and connectors

A **tool** is an individual action your agent can call, such as `search` or `execute`. An **MCP server** provides those tools. Connecting to one server can make several tools available; the connection and the tools are not the same thing.

In the **Claude app** (claude.ai or Claude Desktop), remote MCP integrations appear as **connectors**. Look under **Customize > Connectors** to manage them or add a custom connector using the server's URL. See [Anthropic's custom-connectors guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) for the current steps and any organization requirements. For direct setup in the **Claude Code terminal CLI**, use its MCP commands shown below.

## Why Code Mode matters

Normally, every tool's name, description, and parameters sit in the model's context window for the entire conversation. The Cloudflare API has around 2,500 endpoints. Describing each as its own tool would take roughly 244,000 tokens, more than most models can even hold.

Cloudflare's server uses **Code Mode** instead. It exposes a few tools that take JavaScript:

- `search`: the agent writes code to query the API's OpenAPI spec and find the endpoints it needs
- `execute`: the agent writes code to call those endpoints
- `docs`: search the Cloudflare developer docs

The whole definition costs about 1,100 tokens, around 0.5% of the alternative, and your agent can still reach every endpoint. The context window stays free for your actual work.

## Add the server

The server lives at `https://mcp.cloudflare.com/mcp` and uses OAuth: your agent sends you to Cloudflare to log in and choose which permissions to grant. Start with read-only if you're not sure.

| Agent              | Add it                                                                                   | Then                                |
| ------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| Claude Code        | `claude mcp add --transport http --scope user cloudflare https://mcp.cloudflare.com/mcp` | Run `/mcp` and log in               |
| Codex              | `codex mcp add cloudflare --url https://mcp.cloudflare.com/mcp`                          | `codex mcp login cloudflare`        |
| OpenCode           | `opencode mcp add` (type `remote`)                                                       | `opencode mcp auth cloudflare`      |
| Cursor             | Add the config below to `~/.cursor/mcp.json`                                             | Connect it in Settings, Tools & MCP |
| GitHub Copilot CLI | `/mcp add` (type HTTP)                                                                   | Authorize in the browser            |
| Pi (0.99+)         | `pi mcp add cloudflare --url https://mcp.cloudflare.com/mcp`                             | `pi mcp login cloudflare`           |

Any other agent that supports remote MCP servers can use this config:

```json
{
  "mcpServers": {
    "cloudflare": {
      "type": "http",
      "url": "https://mcp.cloudflare.com/mcp"
    }
  }
}
```

Restart your agent if the new tools don't show up.

## Try it

Ask your agent something harmless, like "List the Workers on my Cloudflare account" or "How do Durable Objects handle alarms?" You should see it call `search` to find the right endpoint, then `execute` to run it.

## MCP server or `cf`?

Use `cf` (from the CLI exercise) to build and deploy projects from your terminal. Use the MCP server to query and manage account resources through the API, and for anything `cf` doesn't cover yet. Your agent has both. Because `execute` can change real resources, expect your agent to check with you before it writes or deletes anything.

## Where you'll use this

Whenever a later exercise needs to look at your account rather than your project, your agent can use the MCP server alongside `cf`. After [Add a binding](/courses/workers/add-a-binding), for example, you could ask it to show you the KV namespace you created and the keys you stored in it.

## What's next

This is the last exercise in Agent setup. From here there are two directions: projects, where you build something you want and pick up Cloudflare products along the way, and fundamentals, which cover one concept or product at a time. Your agent will ask which you'd like, or you can see what's available on the [courses](/courses) page.
