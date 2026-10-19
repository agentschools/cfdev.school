// Colors follow the 18 named families in agentschools/opencode.school.
// Fills use darker shades so white labels remain readable, including yellow.
export const THEME_STORAGE_KEY = "cfDevSchool.themeColor";
export const DEFAULT_THEME = "orange";

export const themeColors = [
  { name: "red", label: "Red", solid: "#b91c1c", hover: "#991b1b", textDark: "#fca5a5" },
  { name: "orange", label: "Orange", solid: "#c2410c", hover: "#9a3412", textDark: "#fdba74" },
  { name: "amber", label: "Amber", solid: "#92400e", hover: "#78350f", textDark: "#fcd34d" },
  { name: "yellow", label: "Yellow", solid: "#a16207", hover: "#854d0e", textDark: "#fde047" },
  { name: "lime", label: "Lime", solid: "#4d7c0f", hover: "#3f6212", textDark: "#bef264" },
  { name: "green", label: "Green", solid: "#15803d", hover: "#166534", textDark: "#86efac" },
  { name: "emerald", label: "Emerald", solid: "#047857", hover: "#065f46", textDark: "#6ee7b7" },
  { name: "teal", label: "Teal", solid: "#0f766e", hover: "#115e59", textDark: "#5eead4" },
  { name: "cyan", label: "Cyan", solid: "#0e7490", hover: "#155e75", textDark: "#67e8f9" },
  { name: "sky", label: "Sky", solid: "#0369a1", hover: "#075985", textDark: "#7dd3fc" },
  { name: "blue", label: "Blue", solid: "#1d4ed8", hover: "#1e40af", textDark: "#93c5fd" },
  { name: "indigo", label: "Indigo", solid: "#4338ca", hover: "#3730a3", textDark: "#a5b4fc" },
  { name: "violet", label: "Violet", solid: "#6d28d9", hover: "#5b21b6", textDark: "#c4b5fd" },
  { name: "purple", label: "Purple", solid: "#7e22ce", hover: "#6b21a8", textDark: "#d8b4fe" },
  { name: "fuchsia", label: "Fuchsia", solid: "#a21caf", hover: "#86198f", textDark: "#f0abfc" },
  { name: "pink", label: "Pink", solid: "#be185d", hover: "#9d174d", textDark: "#f9a8d4" },
  { name: "rose", label: "Rose", solid: "#be123c", hover: "#9f1239", textDark: "#fda4af" },
  { name: "slate", label: "Slate", solid: "#475569", hover: "#334155", textDark: "#cbd5e1" },
] as const;

export function resolveTheme(value: string | null | undefined) {
  return themeColors.find((theme) => theme.name === value) ?? themeColors.find((theme) => theme.name === DEFAULT_THEME)!;
}

export const themeStyles = themeColors.map((theme) => `
  ${theme.name === DEFAULT_THEME ? ":root," : ""}
  :root[data-theme-color="${theme.name}"] {
    --accent: ${theme.solid};
    --accent-hover: ${theme.hover};
    --accent-text: light-dark(${theme.hover}, ${theme.textDark});
    --accent-contrast: #fff;
  }
`).join("\n");
