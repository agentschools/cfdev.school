---
description: "Connect your AI agent to your blog, let it draft a post, then review and publish it yourself."
agent-instructions: |
  Every EmDash site has a built-in MCP server at /_emdash/api/mcp
  (https://docs.emdashcms.com/guides/ai-tools/). It accepts OAuth or a
  personal access token; an admin browser session alone doesn't work.

  1. Explain what this gives them: their agent can draft, edit, search, and
     schedule posts on their live blog, with the same permissions as their
     admin login.
  2. Add the server to their agent at user scope, using the live URL
     (their domain or workers.dev) plus /_emdash/api/mcp. Use your harness
     profile's `mcp` field (GET /api/harnesses/{yourHarnessId}) for the
     command, and check it against your CLI's help. For Claude Code:

       claude mcp add --transport http --scope user <blog-name> https://<live-url>/_emdash/api/mcp

     Then have the student sign in through the OAuth flow (in Claude Code:
     /mcp, then Authenticate). The student does the browser part.
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

EmDash includes an MCP server: a standard way for AI agents to use a website's tools. Once your agent signs in to your blog, it can write drafts, edit posts, and search your content, the same things you do in the admin panel.

## You stay the editor

Your agent writes drafts, never final posts. You read every draft, change it in your own words, and decide when it's published. Your name is on it, so you have the final say.
