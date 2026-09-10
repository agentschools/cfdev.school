import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import { harnesses } from "../data/harnesses";
import Index from "./index.astro";

describe("homepage", () => {
  it("renders the prerequisite statement, enroll CTA, and every harness card", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toContain(
      "All you need to get started is a working AI coding agent on your computer. We'll walk you through setting up Cloudflare.",
    );
    expect(html).toContain('id="harnesses"');
    expect(html).toContain('id="enroll"');
    expect(html).toContain("Enroll in Cloudflare Dev School");
    expect(html).toContain("Free forever. No account required. No personal data collected.");

    for (const harness of harnesses) {
      expect(html).toContain(harness.name);
      if (harness.icon) {
        expect(html).toContain(harness.icon.light);
        expect(html).toContain(harness.icon.dark);
      }
    }
  });
});
