import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, resolveTheme, schoolThemeStyles, themeColors } from "./theme";

function luminance(hex: string): number {
  const channels = hex.slice(1).match(/../g)!.map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("student colors", () => {
  it("offers 18 unique named colors and distinguishes the original school default from saved named orange", () => {
    expect(new Set(themeColors.map((theme) => theme.name)).size).toBe(18);
    for (const value of [null, undefined, "", "not-a-color", "__proto__", "constructor"]) {
      expect(resolveTheme(value).name).toBe(DEFAULT_THEME);
    }
    expect(resolveTheme("orange").name).toBe("orange");
    expect(resolveTheme(null).name).toBe("default");
    expect(schoolThemeStyles).toContain("oklch(0.687 0.208 38.8)");
    expect(schoolThemeStyles).toContain("--brand-cloud-light: #FF9910");
    expect(schoolThemeStyles).toContain("--brand-cloud-dark: #FF5F08");
    expect(schoolThemeStyles).toContain("linear-gradient(180deg, #ff6b2e, #ff5e1f)");
    expect(schoolThemeStyles).toContain("linear-gradient(135deg, #ff8f45 0%, #ff5e1f 48%, #b83200 100%)");
    expect(schoolThemeStyles).toContain("rgb(255 110 40 / 0.5)");
    for (const theme of themeColors) expect(resolveTheme(theme.name)).toBe(theme);
  });

  it.each(themeColors)("keeps $name fills and links above WCAG AA text contrast with white labels", (theme) => {
    // Every fill carries white labels in both light and dark mode.
    expect(theme.onSolid).toBe("#ffffff");
    expect(contrast(theme.solid, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.hover, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    // Link/eyebrow colors on the light and dark page backgrounds.
    expect(contrast(theme.textLight, "#fcfcfc")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.textDark, "#0b0b0b")).toBeGreaterThanOrEqual(4.5);
  });
});

// Mirrors the --code-* variables in Layout.astro: keywords are the link color
// mixed 90% with the text color, strings that mixed 40% with muted, on --card-bg.
function mixSrgb(first: string, second: string, weight: number): string {
  const a = first.slice(1).match(/../g)!.map((value) => parseInt(value, 16));
  const b = second.slice(1).match(/../g)!.map((value) => parseInt(value, 16));
  return `#${a.map((value, i) => Math.round(value * weight + b[i] * (1 - weight)).toString(16).padStart(2, "0")).join("")}`;
}

const CODE_MODES = [
  { mode: "light", card: "#f3f3f3", fg: "#181818", muted: "#6b6b6b" },
  { mode: "dark", card: "#1d1c1c", fg: "#f0e3de", muted: "#8f8987" },
] as const;

const codeLinkColors = [
  { name: DEFAULT_THEME, light: "#c2410c", dark: "#ff8f57" },
  ...themeColors.map((theme) => ({ name: theme.name, light: theme.textLight, dark: theme.textDark })),
];

describe("syntax highlighting colors", () => {
  it.each(codeLinkColors)("keeps $name code tokens above WCAG AA on code blocks", (theme) => {
    for (const { mode, card, fg, muted } of CODE_MODES) {
      const keyword = mixSrgb(theme[mode], fg, 0.9);
      for (const color of [fg, muted, keyword, mixSrgb(keyword, muted, 0.4)]) {
        expect(contrast(color, card)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
