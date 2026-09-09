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
  id: z.enum(["claude-code", "codex", "opencode", "pi", "generic"]),
  name: z.string(),
  cliCommand: z.string(),
  /** Default global instructions file name/location for this harness. */
  instructionsFile: z.object({
    path: z.string(),
    notes: z.string().optional(),
  }),
  /** Global config file location (MCP config, provider settings, etc.). */
  globalConfigFile: z.string().optional(),
  mcpConfigPath: z.string().optional(),
  skills: z.object({
    supported: z.boolean(),
    globalInstallPath: z.string().optional(),
    /** Whether picking up newly installed global skills needs a full quit/restart or just a reload/new session. */
    restartBehavior: z.string(),
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
    cliCommand: "claude",
    instructionsFile: {
      path: "CLAUDE.md (project root) or ~/.claude/CLAUDE.md (global)",
    },
    globalConfigFile: "~/.claude/settings.json",
    mcpConfigPath: "~/.claude.json (user scope) or .mcp.json (project scope)",
    skills: {
      supported: true,
      globalInstallPath: "~/.claude/skills/",
      restartBehavior:
        "New global skills are picked up in new sessions; no full app restart required, but a running session must be restarted to see a skill installed after it started.",
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
    lastVerified: "2026-09-09",
    sources: [
      {
        url: "https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan",
        note: "Pro/Max plan coverage, API key precedence, opting out of API credits.",
      },
      {
        url: "https://claude-code-playbook.pages.dev/en/docs/level-1/api-key-setup",
        note: "Auth precedence order and current per-token API pricing table.",
      },
    ],
  },
  {
    id: "codex",
    name: "OpenAI Codex",
    cliCommand: "codex",
    instructionsFile: {
      path: "AGENTS.md (project root) or ~/.codex/AGENTS.md (global)",
    },
    globalConfigFile: "~/.codex/config.toml",
    mcpConfigPath: "~/.codex/config.toml ([mcp_servers.<name>] blocks)",
    skills: {
      supported: true,
      globalInstallPath: "~/.codex/skills/",
      restartBehavior:
        "Skills are discovered per-session; a new codex session picks up newly installed global skills without a full app reinstall.",
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
    lastVerified: "2026-09-09",
    sources: [
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
    ],
  },
  {
    id: "opencode",
    name: "OpenCode",
    cliCommand: "opencode",
    instructionsFile: {
      path: "AGENTS.md, discovered by walking up from cwd to the project root, plus ~/.config/opencode/AGENTS.md (global)",
      notes:
        "Falls back to CLAUDE.md / ~/.claude/CLAUDE.md if no AGENTS.md is found; both global and local files are combined, not one-wins.",
    },
    globalConfigFile: "~/.config/opencode/opencode.json",
    mcpConfigPath: "opencode.json (\"mcp\" key), project or global scope",
    skills: {
      supported: true,
      globalInstallPath:
        "~/.config/opencode/skills/, plus auto-loaded ~/.claude/skills/ and ~/.agents/skills/",
      restartBehavior:
        "Skills are loaded on-demand via the native skill tool within a session; a new session picks up newly installed skills without restarting the app.",
    },
    subscriptionBilling: {
      supportsSubscriptionLogin: false,
      thirdPartyRoutingHonorsPlanLimits: false,
      summary:
        "OpenCode's own docs state Anthropic explicitly prohibits driving a Claude Pro/Max subscription from OpenCode; the bundled plugins that did this were removed as of OpenCode 1.3.0. For Claude models, only an Anthropic API key (pay-per-token) or OpenCode's own Zen gateway work. OpenCode does support ChatGPT Plus, GitHub Copilot, and GitLab Duo subscription logins with zero extra setup, since OpenAI/GitHub/GitLab permit third-party routing.",
    },
    models: [],
    lastVerified: "2026-09-09",
    sources: [
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
    ],
  },
  {
    id: "pi",
    name: "Pi",
    cliCommand: "pi",
    instructionsFile: {
      path: "AGENTS.md, discovered per pi's context file resolution; see pi's docs for the current search order",
    },
    globalConfigFile: "~/.pi/agent/",
    mcpConfigPath: "~/.pi/agent/ (MCP server config, see pi docs for exact file)",
    skills: {
      supported: true,
      globalInstallPath: "~/.pi/agent/skills/",
      restartBehavior:
        "Skills are read from disk per session; a new pi session picks up newly installed global skills without restarting.",
    },
    subscriptionBilling: {
      supportsSubscriptionLogin: true,
      thirdPartyRoutingHonorsPlanLimits: false,
      summary:
        "pi's /login supports ChatGPT Plus/Pro (Codex), Claude Pro/Max, GitHub Copilot, and xAI subscriptions. As of an April 2026 Anthropic enforcement change, Claude Pro/Max login in pi (and other third-party tools) technically works but draws from Anthropic's separate pay-per-token \"extra usage\" pool, not your Claude plan's included limits, so there's no cost benefit over an API key for Claude models. ChatGPT Plus/Pro login has no such restriction: OpenAI's Codex for OSS program officially endorses third-party harnesses using it, and usage counts against the ChatGPT plan as expected.",
    },
    models: [],
    lastVerified: "2026-09-09",
    sources: [
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
    ],
  },
  {
    id: "generic",
    name: "Something else",
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
