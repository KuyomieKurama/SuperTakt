import type { DesignTheme } from "@takt/domain";

export interface ThemePreset {
  readonly value: Exclude<DesignTheme, "clear">;
  readonly label: string;
  readonly mode: "auto" | "light" | "dark";
  readonly hint: string;
}

/** Farbthemen ändern die Oberflächen; das Layout bleibt klassisch. */
export const THEME_PRESETS = [
  { value: "classic", label: "Klassisch", mode: "auto", hint: "Standard · das klassische SuperTakt-Design" },
  { value: "arc", label: "Arc", mode: "dark", hint: "Schiefergrau mit blauen Akzenten" },
  { value: "cybr", label: "Cybr", mode: "dark", hint: "Cyberpunk · tiefe Flächen und Neonakzente" },
  { value: "dark-base", label: "Dark-base", mode: "dark", hint: "Neutrales Schwarz mit pinken Akzenten" },
  { value: "dracula", label: "Dracula", mode: "dark", hint: "Violett und Pastell auf Anthrazit" },
  { value: "everfrost", label: "Everfrost", mode: "auto", hint: "Waldgrün und warme Naturtöne · Everforest-Palette" },
  { value: "glass", label: "Glass", mode: "auto", hint: "Dezent durchscheinende Glasflächen" },
  { value: "lines", label: "Lines", mode: "auto", hint: "Klare Konturen und reduzierte Flächen" },
  { value: "liquid-glass", label: "Liquid-Glass", mode: "auto", hint: "Weiche Lichtreflexe auf getöntem Glas" },
  { value: "nord-polar-night", label: "Nord-Polar-Night", mode: "dark", hint: "Kühle Blau- und Grautöne" },
  { value: "nord-snow-storm", label: "Nord-Snow-Storm", mode: "light", hint: "Helles Schneeweiß und arktisches Blau" },
  { value: "plainspace", label: "Plainspace", mode: "auto", hint: "Warme Papierfarben und dezente Akzente" },
  { value: "rainbow", label: "Rainbow", mode: "auto", hint: "Mehrfarbige Akzente und sanfte Verläufe" },
  { value: "zen", label: "Zen", mode: "auto", hint: "Ruhige, reduzierte Oberflächen" },
  { value: "velvet", label: "Velvet", mode: "dark", hint: "Samtiges Dunkel mit weichen Lichtakzenten" },
  { value: "catppuccin-latte", label: "Catppuccin Latte", mode: "light", hint: "Helle Pastellfarben" },
  { value: "catppuccin-frappe", label: "Catppuccin Frappé", mode: "dark", hint: "Sanfte Pastellfarben auf Rauchblau" },
  { value: "catppuccin-macchiato", label: "Catppuccin Macchiato", mode: "dark", hint: "Pastell auf tiefem Blau" },
  { value: "catppuccin-mocha", label: "Catppuccin Mocha", mode: "dark", hint: "Pastell auf dunklem Mauve" },
] as const satisfies readonly ThemePreset[];

/** „Klar“ aus älteren Beständen wird im klassischen Layout dargestellt. */
export function themePreset(value: DesignTheme): ThemePreset {
  return THEME_PRESETS.find(preset => preset.value === value) ?? THEME_PRESETS[0];
}
