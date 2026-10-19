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

  it.each(themeColors)("keeps $name fills and links above WCAG AA text contrast", (theme) => {
    // Buttons and badges paint onSolid text on the flat fill.
    expect(contrast(theme.solid, theme.onSolid)).toBeGreaterThanOrEqual(4.5);
    // The ID card gradient runs solid -> hover; its large ID text clears AA Large (3:1).
    expect(contrast(theme.hover, theme.onSolid)).toBeGreaterThanOrEqual(3);
    // Link/eyebrow colors on the light and dark page backgrounds.
    expect(contrast(theme.textLight, "#fcfcfc")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.textDark, "#0b0b0b")).toBeGreaterThanOrEqual(4.5);
  });
});
