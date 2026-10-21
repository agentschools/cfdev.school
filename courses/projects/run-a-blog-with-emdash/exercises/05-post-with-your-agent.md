---
description: "Connect your AI agent to your blog, let it draft a post, then review and publish it yourself."
agent-instructions: |
  Every EmDash site has a built-in MCP server at /_emdash/api/mcp
  (https://docs.emdashcms.com/guides/ai-tools/). It accepts OAuth or a
  personal access token; an admin browser session alone doesn't work.

  1. Explain what this gives them: their agent can draft, edit, search, and
     schedule posts on their live blog. EmDash limits it to the permissions
     the student approves during OAuth and their EmDash role.
  2. Fetch the harness profile (GET /api/harnesses/{yourHarnessId}). If it
     has an `mcp` field, adapt its add-server and OAuth instructions to the
     blog's live /_emdash/api/mcp URL, preferring user or global scope when
     the harness supports one. Check every command against the CLI's help.
     If the generic profile has no `mcp` field, check the harness's current
     docs or CLI help for remote HTTP MCP support instead of inventing a
     command. If it has none, explain that this exercise needs that feature
     and let the student choose an MCP-capable agent for this exercise.
     For Claude Code:

       claude mcp add --transport http --scope user <blog-name> https://<live-url>/_emdash/api/mcp

     Have the student complete the browser OAuth flow (in Claude Code:
     /mcp, then Authenticate). On the consent screen, keep only the scopes
     this exercise needs: content read, content write, and schema read. The
     student does the browser part.
  3. Ask the student for a post idea. Wait for their reply. Draft it
     through the MCP server as a DRAFT, never published.
  4. Have the student read the draft in the admin and change at least one
     thing in their own words. Explain why: the agent drafts, the person
     decides what goes out under their name.
  5. When the student says it's ready, publish it (through the MCP server
     or in the admin, their choice).
  6. Verify before completing: fetch the new post's live URL and confirm
     a 200 with its title. Completion waits on this.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt
     describes. Tell the student their blog is live and theirs to keep,
     and offer the Build a guestbook course if they want visitors to
     leave notes.
---

# Post with your agent

Your blog has its own built-in connection for AI agents. In this exercise you'll connect your agent to it, ask it to draft a post, then read it, change it, and publish it yourself.

## How it works

EmDash includes an MCP server: a standard way for AI agents to use a website's tools. Once your agent signs in to your blog, it can write drafts, edit posts, and search your content within the permissions you approve.

## You stay the editor

Your agent writes drafts, never final posts. You read every draft, change it in your own words, and decide when it's published. Your name is on it, so you have the final say.
