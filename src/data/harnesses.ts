import { z } from "zod";

/**
 * Structured research data on the AI agent harnesses Cloudflare Dev School
 * supports. Feeds the homepage harness cards and the per-harness lesson
 * content (Models, Instructions, CLI, Skills, Tools).
 *
 * This is a MANUALLY maintained, living data source, not an automated or
 * scheduled system (see plan.agent.md's "AI tools research" section). Prices,
 * billing policy, and CLI flags shift often. Each harness carries its own
 * `lastVerified` date and a `sources` list; re-verify and bump the date by
 * hand when a lesson touches this data, don't trust it blindly past a few
 * months old. See AGENTS.md for the freshness process.
 */

const modelSchema = z.object({
  name: z.string(),
  contextWindowTokens: z.number().int().positive(),
  vision: z.boolean(),
  toolUse: z.boolean(),
  /** USD per million input/output tokens, API pay-per-token rate. */
  apiPricePerMTok: z
    .object({
      input: z.number().nonnegative(),
      output: z.number().nonnegative(),
    })
    .optional(),
  notes: z.string().optional(),
});

const sourceSchema = z.object({
  url: z.string().url(),
  note: z.string().optional(),
});

export const harnessProfileSchema = z.object({
  id: z.enum(["claude-code", "codex", "opencode", "pi", "cursor", "copilot", "generic"]),
  name: z.string(),
  /** One-line, homepage-card-friendly description. Keep the deeper detail in subscriptionBilling.summary. */
  tagline: z.string(),
  /** Logo, borrowed from developers.cloudflare.com/agent-setup/. Not every harness has one there. */
  icon: z
    .object({
      light: z.string(),
      dark: z.string(),
    })
    .optional(),
  cliCommand: z.string(),
  /** Default global instructions file name/location for this harness. */
  instructionsFile: z.object({
    path: z.string(),
    notes: z.string().optional(),
  }),
  /** Global config file location (MCP config, provider settings, etc.). */
  globalConfigFile: z.string().optional(),
  mcpConfigPath: z.string().optional(),
  /** How to connect a remote (HTTP) MCP server such as https://mcp.cloudflare.com/mcp. */
  mcp: z
    .object({
      /** False when the harness ships without MCP support and needs an extension (none today; Pi gained built-in MCP in 0.99). */
      nativeSupport: z.boolean(),
      /** Command or config edit that adds a remote HTTP server named "cloudflare-api". */
      addRemoteServer: z.string(),
      /** How to complete the OAuth login after adding it. */
      oauthLogin: z.string(),
      /** Whether adding/authenticating needs a restart or reload before the tools show up. */
      restartBehavior: z.string(),
    })
    .optional(),
  skills: z.object({
    supported: z.boolean(),
    globalInstallPath: z.string().optional(),
    /** Whether picking up newly installed global skills needs a full quit/restart or just a reload/new session. */
    restartBehavior: z.string(),
    /** How a user invokes a skill explicitly by name, rather than letting the model pick it from its description. */
    explicitInvocation: z.string().optional(),
  }),
  subscriptionBilling: z.object({
    /** Does this harness support signing in with a subscription plan (vs. only pay-per-token API keys)? */
    supportsSubscriptionLogin: z.boolean(),
    /** Does that subscription login count against plan limits when driven from THIS harness specifically (as opposed to the vendor's own first-party client)? */
    thirdPartyRoutingHonorsPlanLimits: z.boolean().nullable(),
    summary: z.string(),
  }),
  models: z.array(modelSchema),
  lastVerified: z.string().date(),
  sources: z.array(sourceSchema),
});

export type HarnessProfile = z.infer<typeof harnessProfileSchema>;

export const harnesses: HarnessProfile[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    tagline: "Anthropic's official terminal agent. Included in your Claude Pro or Max plan.",
    icon: { light: "/icons/agents/claude-code/light.svg", dark: "/icons/agents/claude-code/dark.svg" },
    cliCommand: "claude",
    instructionsFile: {
      path: "CLAUDE.md (project root) or ~/.claude/CLAUDE.md (global)",
      notes:
        "As of Claude Code 2.1.277 (2026-09-18), Claude also reads AGENTS.md natively, but only as a fallback: if any CLAUDE.md or CLAUDE.local.md exists in the working directory or a parent, that wins and AGENTS.md is ignored. With no CLAUDE.md on the path, Claude reads AGENTS.md instead, no import or symlink needed. The /config \"Project instructions\" setting can change this (e.g. claude-md-and-agents-md loads both). Not available on Bedrock, Vertex, or Foundry, or in a session with telemetry disabled or on its first run after install/upgrade; use a CLAUDE.md containing @AGENTS.md as a portable fallback for those cases.",
    },
    globalConfigFile: "~/.claude/settings.json",
    mcpConfigPath: "~/.claude.json (user scope) or .mcp.json (project scope)",
    mcp: {
      nativeSupport: true,
      addRemoteServer:
        "claude mcp add --transport http --scope user cloudflare-api https://mcp.cloudflare.com/mcp",
      oauthLogin:
        "Run `/mcp` inside Claude Code and follow the browser steps (or `claude mcp login cloudflare-api` from the shell). `claude mcp list` shows connection status.",
      restartBehavior:
        "Existing sessions may need a restart to see a newly added server; run `/mcp` to check.",
    },
    skills: {
      supported: true,
      globalInstallPath: "~/.claude/skills/",
      restartBehavior:
        "Nothing needed: a file watcher picks up new or changed skills in a running session. If ~/.claude/skills/ didn't exist when the session started, run `/reload-skills`.",
      explicitInvocation: "/skill-name",
    },
    subscriptionBilling: {
      supportsSubscriptionLogin: true,
      thirdPartyRoutingHonorsPlanLimits: true,
      summary:
        "Native first-party harness. Pro ($20/mo), Max 5x ($100/mo) and Max 20x ($200/mo) plans all cover Claude Code directly against the same usage pool as claude.ai. An ANTHROPIC_API_KEY in the environment overrides subscription login and switches to per-token API billing. Anthropic explicitly prohibits OTHER third-party harnesses from routing through a Claude Pro/Max login on Claude Code's behalf; this only applies to Claude Code itself.",
    },
    models: [
      {
        name: "Claude Opus 4.8",
        contextWindowTokens: 200000,
        vision: true,
        toolUse: true,
        apiPricePerMTok: { input: 5, output: 25 },
      },
      {
        name: "Claude Sonnet 5",
        contextWindowTokens: 200000,
        vision: true,
        toolUse: true,
        apiPricePerMTok: { input: 3, output: 15 },
        notes: "Introductory $2/$10 pricing applied through 2026-08-31.",
      },
      {
        name: "Claude Haiku 4.5",
        contextWindowTokens: 200000,
        vision: true,
        toolUse: true,
        apiPricePerMTok: { input: 1, output: 5 },
      },
    ],
    lastVerified: "2026-10-01",
    sources: [
      {
        url: "https://code.claude.com/docs/en/mcp",
        note: "Adding remote HTTP MCP servers, --scope user, /mcp OAuth login, claude mcp list.",
      },
      {
        url: "https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan",
        note: "Pro/Max plan coverage, API key precedence, opting out of API credits.",
      },
      {
        url: "https://claude-code-playbook.pages.dev/en/docs/level-1/api-key-setup",
        note: "Auth precedence order and current per-token API pricing table.",
      },
      {
        url: "https://docs.claude.com/en/docs/claude-code/memory",
        note: "Official docs' AGENTS.md section: fallback precedence rules, the /config Project instructions setting, and the Bedrock/Vertex/Foundry/telemetry-disabled exceptions. Verified live 2026-09-21, the same day as InfoWorld and DevOps.com's coverage of Claude Code 2.1.277.",
      },
      {
        url: "https://code.claude.com/docs/en/skills",
        note: "Skill locations, live change detection and /reload-skills, /skill-name invocation, disable-model-invocation. Verified 2026-09-30.",
      },
    ],
  },
  {
    id: "codex",
    name: "OpenAI Codex",
    tagline: "OpenAI's terminal agent. Works with any ChatGPT plan, including Free.",
    icon: { light: "/icons/agents/codex/light.svg", dark: "/icons/agents/codex/dark.svg" },
    cliCommand: "codex",
    instructionsFile: {
      path: "AGENTS.md (project root) or ~/.codex/AGENTS.md (global)",
    },
    globalConfigFile: "~/.codex/config.toml",
    mcpConfigPath: "~/.codex/config.toml ([mcp_servers.<name>] blocks)",
    mcp: {
      nativeSupport: true,
      addRemoteServer:
        "codex mcp add cloudflare-api --url https://mcp.cloudflare.com/mcp (writes a [mcp_servers.cloudflare-api] block to ~/.codex/config.toml)",
      oauthLogin:
        "codex mcp login cloudflare-api. Codex has gated OAuth login behind an rmcp client feature flag in the past; if login fails, check the current Codex MCP docs for that flag.",
      restartBehavior:
        "Restart Codex after adding the server. Not re-verified against Codex's docs in this pass (developers.openai.com was unreachable); verified from search results and Codex source/PR history only.",
    },
    skills: {
      supported: true,
      globalInstallPath: "~/.agents/skills/ (~/.codex/skills/ is deprecated but still read)",
      restartBehavior:
        "Nothing needed: Codex detects newly installed skills automatically. Restart Codex if a skill doesn't show up.",
      explicitInvocation: "$skill-name",
    },
    subscriptionBilling: {
      supportsSubscriptionLogin: true,
      thirdPartyRoutingHonorsPlanLimits: true,
      summary:
        "codex login opens a ChatGPT browser flow and bills against your ChatGPT plan (Free, Go $8/mo, Plus $20/mo, Pro $200/mo) by default; codex login --with-api-key switches to standard per-token OpenAI API billing. Unlike Anthropic, OpenAI officially endorses third-party harnesses (OpenCode, Pi) authenticating with a ChatGPT Plus/Pro login via the Codex for OSS program.",
    },
    models: [
      {
        name: "GPT-5.3-Codex",
        contextWindowTokens: 400000,
        vision: true,
        toolUse: true,
        notes: "Default Codex CLI model as of this writing; exact API pricing not verified here, check platform.openai.com/pricing.",
      },
    ],
    lastVerified: "2026-09-30",
    sources: [
      {
        url: "https://developers.openai.com/codex/mcp",
        note: "codex mcp add --url / codex mcp login for streamable HTTP + OAuth. Page was unreachable on 2026-10-01; command shapes taken from search results.",
      },
      {
        url: "https://developers.openai.com/codex/auth.md",
        note: "ChatGPT login vs. API key auth paths.",
      },
      {
        url: "https://developers.openai.com/codex/concepts/customization",
        note: "AGENTS.md, skills, MCP, subagents.",
      },
      {
        url: "https://developers.openai.com/community/codex-for-oss",
        note: "OpenAI's official endorsement of third-party harnesses using ChatGPT subscription auth for Codex models.",
      },
      {
        url: "https://learn.chatgpt.com/docs/build-skills",
        note: "Redirect target of developers.openai.com/codex/skills: ~/.agents/skills, automatic detection of new skills, $skill-name invocation. Verified 2026-09-30.",
      },
      {
        url: "https://github.com/openai/codex/blob/main/codex-rs/ext/skills/src/host_roots.rs",
        note: "$CODEX_HOME/skills is a deprecated user skills location kept for backward compatibility; ~/.agents/skills is a user root.",
      },
    ],
  },
  {
    id: "opencode",
    name: "OpenCode",
    tagline: "Open-source, model-agnostic terminal agent with 75+ provider support.",
    icon: { light: "/icons/agents/opencode/light.svg", dark: "/icons/agents/opencode/dark.svg" },
    cliCommand: "opencode",
    instructionsFile: {
      path: "AGENTS.md, discovered by walking up from cwd to the project root, plus ~/.config/opencode/AGENTS.md (global)",
      notes:
        "Falls back to CLAUDE.md / ~/.claude/CLAUDE.md if no AGENTS.md is found; both global and local files are combined, not one-wins.",
    },
    globalConfigFile: "~/.config/opencode/opencode.json",
    mcpConfigPath: "opencode.json (\"mcp\" key), project or global scope",
    mcp: {
      nativeSupport: true,
      addRemoteServer:
        "opencode mcp add (interactive: Type remote, Name cloudflare-api, URL https://mcp.cloudflare.com/mcp), or add { \"mcp\": { \"cloudflare-api\": { \"type\": \"remote\", \"url\": \"https://mcp.cloudflare.com/mcp\" } } } to opencode.json",
      oauthLogin:
        "opencode mcp auth cloudflare-api (OpenCode also starts the OAuth flow itself on a 401, using dynamic client registration).",
      restartBehavior:
        "Restart OpenCode after editing its config.",
    },
    skills: {
      supported: true,
      globalInstallPath:
        "~/.config/opencode/skills/, plus auto-loaded ~/.claude/skills/ and ~/.agents/skills/",
      restartBehavior:
        "Restart OpenCode. Skills are cached per instance with no file watcher (inferred from source, not documented).",
      explicitInvocation: "/skill-name",
    },
    subscriptionBilling: {
      supportsSubscriptionLogin: false,
      thirdPartyRoutingHonorsPlanLimits: false,
      summary:
        "OpenCode's own docs state Anthropic explicitly prohibits driving a Claude Pro/Max subscription from OpenCode; the bundled plugins that did this were removed as of OpenCode 1.3.0. For Claude models, only an Anthropic API key (pay-per-token) or OpenCode's own Zen gateway work. OpenCode does support ChatGPT Plus, GitHub Copilot, and GitLab Duo subscription logins with zero extra setup, since OpenAI/GitHub/GitLab permit third-party routing.",
    },
    models: [],
    lastVerified: "2026-10-01",
    sources: [
      {
        url: "https://opencode.ai/docs/mcp-servers",
        note: "Remote MCP servers (type remote), opencode mcp add/auth, automatic OAuth on 401.",
      },
      {
        url: "https://opencode.ai/docs/rules/",
        note: "AGENTS.md/CLAUDE.md discovery order, global vs. project files.",
      },
      {
        url: "https://opencode.ai/docs/skills/",
        note: "Skill directory search order.",
      },
      {
        url: "https://opencode.ai/docs/config/",
        note: "Config file locations and precedence.",
      },
      {
        url: "https://www.firecrawl.dev/blog/claude-code-vs-opencode",
        note: "OpenCode's documented prohibition on routing Claude Pro/Max through OpenCode, and supported subscriptions (ChatGPT Plus, Copilot, GitLab Duo).",
      },
      {
        url: "https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/skill/index.ts",
        note: "Skills cached per instance with no file watcher, hence restart after installing. Inferred from source 2026-09-30.",
      },
      {
        url: "https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/command/index.ts",
        note: "Each skill is registered as a /skill-name command (not in the docs).",
      },
    ],
  },
  {
    id: "pi",
    name: "Pi",
    tagline: "A minimal, extensible terminal coding harness you adapt to your workflow.",
    icon: { light: "/icons/agents/pi/light.svg", dark: "/icons/agents/pi/dark.svg" },
    cliCommand: "pi",
    instructionsFile: {
      path: "AGENTS.md (or CLAUDE.md) at ~/.pi/agent/AGENTS.md (global), plus parent directories and the current directory (project), all concatenated",
      notes:
        "A directory-level AGENTS.override.md takes the place of that directory's AGENTS.md/CLAUDE.md; other directories' files still load alongside it.",
    },
    globalConfigFile: "~/.pi/agent/",
    mcpConfigPath: "~/.pi/agent/mcp.json (user) or .pi/mcp.json (project, requires project trust; overrides user entries with the same name). Built in since Pi 0.99.",
    mcp: {
      nativeSupport: true,
      addRemoteServer:
        "pi mcp add cloudflare-api --url https://mcp.cloudflare.com/mcp (writes ~/.pi/agent/mcp.json; -l writes the project .pi/mcp.json), or add { \"mcpServers\": { \"cloudflare-api\": { \"url\": \"https://mcp.cloudflare.com/mcp\" } } } to ~/.pi/agent/mcp.json. Requires Pi 0.99 or newer (earlier versions have no MCP).",
      oauthLogin:
        "pi mcp login cloudflare-api, or sign in from the /mcp TUI inside Pi.",
      restartBehavior:
        "Run /reload after editing mcp.json by hand. Servers default to `codemode` exposure: the model reaches their tools by writing JavaScript in Pi's built-in codemode QuickJS sandbox (searchTools()/describeTool()), not as individual tool definitions. Not hands-on verified with the Cloudflare server specifically.",
    },
    skills: {
      supported: true,
      globalInstallPath: "~/.pi/agent/skills/ (also reads ~/.agents/skills/)",
      restartBehavior: "Run `/reload` in a running session, or start a new session.",
      explicitInvocation: "/skill:skill-name",
    },
    subscriptionBilling: {
      supportsSubscriptionLogin: true,
      thirdPartyRoutingHonorsPlanLimits: false,
      summary:
        "pi's /login supports ChatGPT Plus/Pro (Codex), Claude Pro/Max, GitHub Copilot, and xAI subscriptions. As of an April 2026 Anthropic enforcement change, Claude Pro/Max login in pi (and other third-party tools) technically works but draws from Anthropic's separate pay-per-token \"extra usage\" pool, not your Claude plan's included limits, so there's no cost benefit over an API key for Claude models. ChatGPT Plus/Pro login has no such restriction: OpenAI's Codex for OSS program officially endorses third-party harnesses using it, and usage counts against the ChatGPT plan as expected.",
    },
    models: [],
    lastVerified: "2026-10-01",
    sources: [
      {
        url: "https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md",
        note: "Built-in MCP (since 0.99.0, 2026-09-29): mcp.json locations, pi mcp add/login, /mcp, exposure modes (codemode default), /reload.",
      },
      {
        url: "https://github.com/earendil-works/pi/releases",
        note: "0.99.0 release notes: MCP over stdio/streamable HTTP with OAuth, codemode built-in extension. Replaces the earlier third-party pi-mcp-adapter route (https://github.com/nicobailon/pi-mcp-adapter), which is no longer needed.",
      },
      {
        url: "https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md",
        note: "Subscription provider list and the Claude Pro/Max extra-usage caveat.",
      },
      {
        url: "https://github.com/badlogic/pi-mono/issues/3372",
        note: "Report of the April 2026 Anthropic billing change closing the subscription-login cost loophole for third-party tools.",
      },
      {
        url: "https://code.claude.com/docs/en/legal-and-compliance",
        note: "Anthropic's official policy text prohibiting third-party routing of Free/Pro/Max credentials.",
      },
      {
        url: "https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md",
        note: "Context Files section: exact global path (~/.pi/agent/AGENTS.md), directory walk-up, concatenation, and AGENTS.override.md behavior. Verified against the locally installed README 2026-09-21.",
      },
      {
        url: "https://pi.dev/logo.svg",
        note: "Official pi logo, linked from the pi README's badge header. Full-color mark, no separate light/dark variant needed.",
      },
      {
        url: "https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md",
        note: "~/.agents/skills support, /skill:name invocation, /reload after changes. Verified 2026-09-30.",
      },
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    tagline: "Anysphere's editor-first agent, also usable as a standalone terminal CLI.",
    icon: { light: "/icons/agents/cursor/light.svg", dark: "/icons/agents/cursor/dark.svg" },
    cliCommand: "cursor-agent",
    instructionsFile: {
      path: "AGENTS.md (project root, plain-markdown alternative to structured .cursor/rules/*.mdc files) plus user-level ~/.cursor/rules/ or account-synced Cursor Settings rules for global instructions",
      notes:
        "Cursor reads AGENTS.md and .cursor/rules/*.mdc side by side; nested AGENTS.md files in subdirectories combine with parent ones, with the more specific instructions taking precedence. When rule types conflict: Team Rules > Project Rules > User Rules. CLAUDE.md is also read the same way as AGENTS.md, always applied regardless of any alwaysApply frontmatter, for compatibility with Claude Code projects.",
    },
    globalConfigFile: "~/.cursor/cli-config.json",
    mcpConfigPath: ".cursor/mcp.json (project) or ~/.cursor/mcp.json (global); both are merged, project-level wins on name conflicts",
    mcp: {
      nativeSupport: true,
      addRemoteServer:
        "Add { \"mcpServers\": { \"cloudflare-api\": { \"url\": \"https://mcp.cloudflare.com/mcp\" } } } to ~/.cursor/mcp.json (global) or .cursor/mcp.json (project).",
      oauthLogin:
        "Cursor prompts for OAuth in the browser the first time the server connects (Settings, Tools & MCP, then Connect).",
      restartBehavior:
        "Cursor usually picks up mcp.json changes without a restart; run Developer: Reload Window if the server does not appear. Not hands-on verified.",
    },
    skills: {
      supported: true,
      globalInstallPath: "~/.agents/skills/ or ~/.cursor/skills/ (also reads legacy ~/.claude/skills/ and ~/.codex/skills/)",
      restartBehavior:
        "Start a new chat; existing chats keep the skills they started with. If that's not enough, run Developer: Reload Window or restart Cursor. Docs only say skills are discovered when Cursor starts; the new-chat behavior is from the Cursor forum, not docs.",
      explicitInvocation: "/skill-name",
    },
    subscriptionBilling: {
      supportsSubscriptionLogin: true,
      thirdPartyRoutingHonorsPlanLimits: true,
      summary:
        "cursor-agent login signs in with your Cursor account and draws from the same usage pools as the editor: Hobby is free with limited usage, then Pro ($20/mo), Pro+ ($60/mo), and Ultra ($200/mo) each add a Cursor Models pool (Composer, Grok) plus an Other Models pool for third-party frontier models (Claude, GPT, Gemini) at API-equivalent rates. A CURSOR_API_KEY env var switches to standalone per-token billing outside the subscription pools. Native first-party CLI, so there's no third-party-routing restriction to worry about.",
    },
    models: [
      {
        name: "Composer 2.5",
        contextWindowTokens: 200000,
        vision: false,
        toolUse: true,
        notes: "Cursor's own agentic coding model, drawn from the Cursor Models pool rather than billed as a third-party model.",
      },
    ],
    lastVerified: "2026-09-30",
    sources: [
      {
        url: "https://cursor.com/docs/cli/reference/parameters",
        note: "CLI command reference: primary command name, subcommands, --model/--mcp flags.",
      },
      {
        url: "https://cursor.com/install",
        note: "Install script: creates both `agent` (primary) and `cursor-agent` (legacy alias) symlinks pointing at the same executable.",
      },
      {
        url: "https://cursor.com/docs/rules",
        note: "AGENTS.md as a plain-markdown alternative to .cursor/rules/*.mdc, nested AGENTS.md precedence, and Team/Project/User rule precedence order.",
      },
      {
        url: "https://cursor.com/docs/mcp",
        note: "mcp.json field reference and project vs. global config locations/precedence.",
      },
      {
        url: "https://cursor.com/docs/skills",
        note: "Skill directory search order (.cursor/skills/, .agents/skills/, global equivalents).",
      },
      {
        url: "https://cursor.com/help/account-and-billing/pricing",
        note: "Current plan names and prices (Hobby, Pro, Pro+, Ultra, Teams).",
      },
      {
        url: "https://cursor.com/docs/models-and-pricing",
        note: "Cursor Models vs. Other Models usage pools, and which plans include each.",
      },
      {
        url: "https://cursor.com/docs/context/skills",
        note: "Global skill directories including legacy paths, /skill-name invocation, discovery when Cursor starts. Verified 2026-09-30.",
      },
      {
        url: "https://forum.cursor.com/t/newly-added-agent-skills-do-not-appear-in-existing-chats-no-in-chat-skill-reload/165124",
        note: "Forum, not docs: existing chats keep their skill snapshot, start a new chat after installing.",
      },
    ],
  },
  {
    id: "copilot",
    name: "GitHub Copilot CLI",
    tagline: "GitHub's terminal agent, included with every Copilot plan from Free up.",
    icon: { light: "/icons/agents/copilot/light.svg", dark: "/icons/agents/copilot/dark.svg" },
    cliCommand: "copilot",
    instructionsFile: {
      path: "AGENTS.md or .github/copilot-instructions.md (project root) plus ~/.copilot/copilot-instructions.md (global, applies to every session regardless of project)",
      notes:
        "Path-specific instructions also work via .github/instructions/**/*.instructions.md (project) or ~/.copilot/instructions/*.instructions.md (global personal), loaded alongside the main instructions file. Set COPILOT_HOME to relocate the ~/.copilot directory.",
    },
    globalConfigFile: "~/.copilot/settings.json",
    mcpConfigPath:
      "~/.copilot/mcp-config.json (user level, ships with the GitHub MCP server preconfigured) plus .mcp.json or .github/mcp.json (project level, walked from cwd up to the repo root); project-level definitions win on name conflicts",
    mcp: {
      nativeSupport: true,
      addRemoteServer:
        "/mcp add inside Copilot CLI (type HTTP), or add { \"mcpServers\": { \"cloudflare-api\": { \"type\": \"http\", \"url\": \"https://mcp.cloudflare.com/mcp\" } } } to ~/.copilot/mcp-config.json.",
      oauthLogin:
        "Copilot CLI prompts for authorization when the server requires OAuth. Not hands-on verified; fall back to an API token header if it does not.",
      restartBehavior:
        "Restart Copilot CLI after editing mcp-config.json. Not hands-on verified.",
    },
    skills: {
      supported: true,
      globalInstallPath: "~/.copilot/skills/ (also reads ~/.agents/skills/)",
      restartBehavior:
        "Run `/skills reload` in a running session, or start a new session; no full app restart needed.",
      explicitInvocation: "/skill-name",
    },
    subscriptionBilling: {
      supportsSubscriptionLogin: true,
      thirdPartyRoutingHonorsPlanLimits: true,
      summary:
        "Copilot CLI is a core feature of every GitHub Copilot plan (Free, Pro $10/mo, Pro+ $39/mo, Max $100/mo, Business, Enterprise); each prompt draws from that plan's monthly GitHub AI Credits allowance (base credits plus a variable flex allotment), shared across Copilot Chat, the CLI, and cloud agents. Native first-party CLI, so there's no third-party-routing restriction to worry about.",
    },
    models: [
      {
        name: "Claude Sonnet 4.5",
        contextWindowTokens: 200000,
        vision: true,
        toolUse: true,
        notes: "Default Copilot CLI model as of this writing; switch with the /model slash command.",
      },
    ],
    lastVerified: "2026-09-30",
    sources: [
      {
        url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli",
        note: "Install methods and the `copilot` binary name.",
      },
      {
        url: "https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference",
        note: "~/.copilot directory layout: instructions, mcp-config.json, settings.json, skills/, COPILOT_HOME override.",
      },
      {
        url: "https://docs.github.com/copilot/how-tos/copilot-cli/use-copilot-cli/overview",
        note: "Supported instruction file types (.github/copilot-instructions.md, AGENTS.md) and MCP server setup.",
      },
      {
        url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers",
        note: "Project-level MCP config locations (.mcp.json, .github/mcp.json) and precedence vs. user-level config.",
      },
      {
        url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills",
        note: "Skill directory locations, project and personal.",
      },
      {
        url: "https://github.com/features/copilot/plans",
        note: "Current plan names and prices (Free, Pro, Pro+, Max, Business, Enterprise).",
      },
      {
        url: "https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals",
        note: "GitHub AI Credits allowance structure (base credits + flex allotment) per plan.",
      },
      {
        url: "https://cdn.jsdelivr.net/gh/github/copilot-cli@main/README.md",
        note: "Default model (Claude Sonnet 4.5) and the /model slash command.",
      },
      {
        url: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills",
        note: "Personal skill directories and /skills reload. Verified 2026-09-30.",
      },
    ],
  },
  {
    id: "generic",
    name: "Something else",
    tagline: "Using a different agent? You can still take this course.",
    cliCommand: "",
    instructionsFile: {
      path: "AGENTS.md is the closest thing to a cross-tool standard; check your harness's own docs.",
    },
    skills: {
      supported: false,
      restartBehavior:
        "Varies by harness. If your harness supports the Agent Skills standard, check its docs for the install location and whether a restart is needed.",
    },
    subscriptionBilling: {
      supportsSubscriptionLogin: false,
      thirdPartyRoutingHonorsPlanLimits: null,
      summary:
        "Varies by harness and model vendor. As a rule of thumb: check whether the model vendor's own docs list your harness as an officially supported or endorsed third-party client before assuming a subscription login will work as expected.",
    },
    models: [],
    lastVerified: "2026-09-09",
    sources: [],
  },
];

export function getHarness(id: HarnessProfile["id"]): HarnessProfile {
  const harness = harnesses.find((h) => h.id === id);
  if (!harness) throw new Error(`Unknown harness id: ${id}`);
  return harness;
}
