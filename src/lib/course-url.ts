/**
 * The ID of a course hosted outside this site (see #73): its URL with a
 * lowercase host, and without credentials, a query, a fragment, ".git", or
 * trailing slashes, so every way of writing the same URL names one course.
 * Null unless the URL is https.
 */
export function normalizeCourseUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const path = url.pathname.replace(/\/+$/, "").replace(/\.git$/, "").replace(/\/+$/, "");
  return `https://${url.host}${path}`;
}
