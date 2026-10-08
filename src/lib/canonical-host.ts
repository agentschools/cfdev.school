export const CANONICAL_ORIGIN = "https://cfdev.school";

// Production's old workers.dev host. PR previews have their own hosts and aren't redirected.
const LEGACY_HOSTS = new Set(["cloudflare-dev-school.ziki.workers.dev"]);

/**
 * Returns a redirect to the canonical domain for requests to a legacy host,
 * or null. 308 keeps the method and body, so agents that saved the old origin
 * in an instructions file can still PUT progress.
 */
export function canonicalRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (!LEGACY_HOSTS.has(url.hostname)) return null;
  return Response.redirect(`${CANONICAL_ORIGIN}${url.pathname}${url.search}`, 308);
}
