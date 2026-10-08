import { describe, expect, it } from "vitest";
import { canonicalRedirect } from "./canonical-host";

describe("canonicalRedirect", () => {
  it("redirects the old production host with a 308, keeping path and query", () => {
    const response = canonicalRedirect(
      new Request("https://cloudflare-dev-school.ziki.workers.dev/api/progress/x?a=1", { method: "PUT" }),
    );
    expect(response?.status).toBe(308);
    expect(response?.headers.get("Location")).toBe("https://cfdev.school/api/progress/x?a=1");
  });

  it("leaves the canonical domain, previews, and local dev alone", () => {
    for (const url of [
      "https://cfdev.school/",
      "https://cloudflare-dev-school-pr-12.ziki.workers.dev/",
      "http://localhost:4321/",
    ]) {
      expect(canonicalRedirect(new Request(url))).toBeNull();
    }
  });
});
