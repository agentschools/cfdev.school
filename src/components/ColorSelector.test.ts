import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import ColorSelector from "./ColorSelector.astro";
import ThemePalette from "./ThemePalette.astro";
import { themeColors } from "../lib/theme";

describe("color selector", () => {
  it("groups all named swatches as native radios, with no school-default control or borders", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ColorSelector);
    expect(html).toContain("<fieldset");
    expect(html).toContain("Choose your color</legend>");
    expect(html.match(/type="radio"/g)).toHaveLength(18);
    expect(html.match(/ checked/g)).toBeNull();
    // No separate "use school orange" reset and no description copy.
    expect(html).not.toContain("data-default-color");
    expect(html).not.toContain("Use school orange");
    expect(html).not.toContain("whole school");
    for (const theme of themeColors) {
      expect(html).toContain(`aria-label="${theme.label}"`);
      expect(html).toContain(`value="${theme.name}"`);
    }
    expect(html).not.toContain("<summary");
  });

  it("applies valid saved colors before paint, falling back safely with unavailable or invalid storage", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ThemePalette);
    const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)![1];
    for (const value of [...themeColors.map((theme) => theme.name), null, "invalid", "__proto__", "constructor", "blocked"]) {
      const dataset: Record<string, string> = {};
      runInNewContext(script, {
        document: { documentElement: { dataset } },
        localStorage: {
          getItem: () => {
            if (value === "blocked") throw new Error("Storage blocked");
            return value;
          },
        },
      });
      expect(dataset.themeColor).toBe(themeColors.some((theme) => theme.name === value) ? value : "default");
    }
  });
});
