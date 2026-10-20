import harnessData from "./harnesses.json";
import { z } from "zod";

/**
 * Structured research data on the AI agent harnesses Cloudflare Dev School
 * supports. Feeds the homepage "Works with" grid and GET /api/harnesses/{id},
 * which agents fetch for harness-specific facts while teaching exercises.
 *
 * A living data source, re-verified daily by
 * .github/workflows/refresh-harnesses.yml (which opens a PR for review) and by
 * hand when an exercise touches it. Prices, billing policy, and CLI flags shift
 * often. Each harness carries its own `lastVerified` date and a `sources`
 * list. See AGENTS.md for the freshness process.
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
  /** One line on when to pick this model over the others in the same harness, from the vendor's own description. Used by the Models exercise. */
  bestFor: z.string().optional(),
  notes: z.string().optional(),
});

/** A subscription plan a harness can sign in with, so compatibility can be compared across harnesses. */
const subscriptionPlanSchema = z.object({
  /** e.g. "Claude Pro or Max", "ChatGPT Plus or Pro". */
  plan: z.string(),
  /** Whether this harness can sign in with the plan at all (and the vendor allows it). */
  signIn: z.boolean(),
  /** Whether usage from this harness draws on the plan's included limits. False means it bills separately (e.g. pay-per-token extra usage); null means not verified. */
  countsAgainstPlan: z.boolean().nullable(),
  notes: z.string().optional(),
});

const sourceSchema = z.object({
  url: z.string().url(),
  note: z.string().optional(),
});

export const harnessProfileSchema = z.object({
  id: z.enum(["claude-code", "codex", "opencode", "pi", "cursor", "copilot", "generic"]),
  name: z.string(),
  /** One line on what the harness is, shown on /agents. How you pay for it goes in subscriptionBilling.headline, not here. */
  tagline: z.string(),
  /** Logo, borrowed from developers.cloudflare.com/agent-setup/. Not every harness has one there. */
  icon: z
    .object({
      light: z.string(),
      dark: z.string(),
      /** Single-color silhouette (alpha only), tinted with CSS mask on the homepage's "Works with" grid. Derived from the light logo, not borrowed. */
      mono: z.string(),
    })
    .optional(),
  /** The harness's own product page, linked from /agents. */
  homepage: z.string().url().optional(),
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
      /** Command or config edit that adds a remote HTTP server named "cloudflare". */
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
    /** One short sentence on how you pay, for /agents' list. Keep the detail in `summary`. */
    headline: z.string(),
    /** Every subscription plan this harness can sign in with, or that students commonly try and can't. Empty when it only takes API keys or it varies (generic). */
    plans: z.array(subscriptionPlanSchema),
    summary: z.string(),
  }),
  models: z.array(modelSchema),
  lastVerified: z.string().date(),
  sources: z.array(sourceSchema),
});

export type HarnessProfile = z.infer<typeof harnessProfileSchema>;

export const harnesses: HarnessProfile[] = harnessData.map((profile) => harnessProfileSchema.parse(profile));

export function getHarness(id: HarnessProfile["id"]): HarnessProfile {
  const harness = harnesses.find((h) => h.id === id);
  if (!harness) throw new Error(`Unknown harness id: ${id}`);
  return harness;
}
