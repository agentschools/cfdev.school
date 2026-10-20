// Colors follow the 18 named families in agentschools/opencode.school.
// Fills are the brightest shade of each hue that still carries white labels at
// WCAG AA in both light and dark mode, so `onSolid` is white everywhere.
// `textLight`/`textDark` are the link colors on the light/dark page
// backgrounds. All verified in theme.test.ts.
export const THEME_STORAGE_KEY = "cfDevSchool.themeColor";
export const DEFAULT_THEME = "default";
export const ON_SOLID = "#ffffff";
export const schoolTheme = {
  name: DEFAULT_THEME,
  label: "School orange",
  solid: "#ff5e1f",
  hover: "#c2410c",
  onSolid: ON_SOLID,
  textLight: "#c2410c",
  textDark: "#fdba74",
} as const;

export const themeColors = [
  { name: "red", label: "Red", solid: "#dc2626", hover: "#b91c1c", onSolid: ON_SOLID, textLight: "#b91c1c", textDark: "#fca5a5" },
  { name: "orange", label: "Orange", solid: "#c2410c", hover: "#9a3412", onSolid: ON_SOLID, textLight: "#c2410c", textDark: "#fdba74" },
  { name: "amber", label: "Amber", solid: "#b45309", hover: "#92400e", onSolid: ON_SOLID, textLight: "#b45309", textDark: "#fcd34d" },
  { name: "yellow", label: "Yellow", solid: "#a16207", hover: "#854d0e", onSolid: ON_SOLID, textLight: "#a16207", textDark: "#fde047" },
  { name: "lime", label: "Lime", solid: "#4d7c0f", hover: "#3f6212", onSolid: ON_SOLID, textLight: "#4d7c0f", textDark: "#bef264" },
  { name: "green", label: "Green", solid: "#15803d", hover: "#166534", onSolid: ON_SOLID, textLight: "#15803d", textDark: "#86efac" },
  { name: "emerald", label: "Emerald", solid: "#047857", hover: "#065f46", onSolid: ON_SOLID, textLight: "#047857", textDark: "#6ee7b7" },
  { name: "teal", label: "Teal", solid: "#0f766e", hover: "#115e59", onSolid: ON_SOLID, textLight: "#0f766e", textDark: "#5eead4" },
  { name: "cyan", label: "Cyan", solid: "#0e7490", hover: "#155e75", onSolid: ON_SOLID, textLight: "#0e7490", textDark: "#67e8f9" },
  { name: "sky", label: "Sky", solid: "#0369a1", hover: "#075985", onSolid: ON_SOLID, textLight: "#0369a1", textDark: "#7dd3fc" },
  { name: "blue", label: "Blue", solid: "#2563eb", hover: "#1d4ed8", onSolid: ON_SOLID, textLight: "#1d4ed8", textDark: "#93c5fd" },
  { name: "indigo", label: "Indigo", solid: "#4f46e5", hover: "#4338ca", onSolid: ON_SOLID, textLight: "#4338ca", textDark: "#a5b4fc" },
  { name: "violet", label: "Violet", solid: "#7c3aed", hover: "#6d28d9", onSolid: ON_SOLID, textLight: "#6d28d9", textDark: "#c4b5fd" },
  { name: "purple", label: "Purple", solid: "#9333ea", hover: "#7e22ce", onSolid: ON_SOLID, textLight: "#7e22ce", textDark: "#d8b4fe" },
  { name: "fuchsia", label: "Fuchsia", solid: "#c026d3", hover: "#a21caf", onSolid: ON_SOLID, textLight: "#a21caf", textDark: "#f0abfc" },
  { name: "pink", label: "Pink", solid: "#db2777", hover: "#be185d", onSolid: ON_SOLID, textLight: "#be185d", textDark: "#f9a8d4" },
  { name: "rose", label: "Rose", solid: "#e11d48", hover: "#be123c", onSolid: ON_SOLID, textLight: "#be123c", textDark: "#fda4af" },
  { name: "slate", label: "Slate", solid: "#64748b", hover: "#475569", onSolid: ON_SOLID, textLight: "#334155", textDark: "#cbd5e1" },
] as const;

export function resolveTheme(value: string | null | undefined) {
  return themeColors.find((theme) => theme.name === value) ?? schoolTheme;
}

// No saved choice uses main's original orange. A saved named orange remains a
// deliberate palette preference; resetting removes the key instead of saving it.
export const schoolThemeStyles = `
  :root, :root[data-theme-color="default"] {
    --brand-cloud-light: #FF9910;
    --brand-cloud-dark: #FF5F08;
    --accent: oklch(0.687 0.208 38.8);
    --accent-hover: #ff5e1f;
    --accent-text: light-dark(#c2410c, #ff8f57);
    --accent-contrast: #171717;
    --button-gradient: linear-gradient(180deg, #ff6b2e, #ff5e1f);
    --card-gradient: linear-gradient(135deg, #ff8f45 0%, #ff5e1f 48%, #b83200 100%);
    --card-text: #fff;
    --card-text-shadow: 0 1px 3px #632000, 0 0 1px #632000;
    --card-glow: rgb(255 110 40 / 0.5);
  }
`;

export const themeStyles = schoolThemeStyles + themeColors.map((theme) => `
  :root[data-theme-color="${theme.name}"] {
    /* Lighter cloud tone, pulled toward the solid so it isn't washed out. */
    --brand-cloud-light: color-mix(in srgb, ${theme.textDark}, ${theme.solid} 45%);
    --brand-cloud-dark: ${theme.solid};
    --accent: ${theme.solid};
    --accent-hover: ${theme.hover};
    --accent-text: light-dark(${theme.textLight}, ${theme.textDark});
    --accent-contrast: ${theme.onSolid};
    --button-gradient: ${theme.solid};
    --card-gradient: linear-gradient(135deg, ${theme.solid}, ${theme.hover});
    --card-text: ${theme.onSolid};
    --card-text-shadow: none;
    --card-glow: color-mix(in srgb, ${theme.solid} 50%, transparent);
  }
`).join("\n");
