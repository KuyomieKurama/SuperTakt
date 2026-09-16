import { THEME_PRESETS } from "./themeCatalog.generated";
import type { DesignTheme } from "@takt/domain";

export interface ThemePreset {
  readonly value: Exclude<DesignTheme, "clear">;
  readonly label: string;
  readonly mode: "auto" | "light" | "dark";
  readonly hint: string;
}

/** Farbthemen ändern die Oberflächen; das Layout bleibt klassisch. */
export { THEME_PRESETS } from "./themeCatalog.generated";

/** „Klar“ aus älteren Beständen wird im klassischen Layout dargestellt. */
export function themePreset(value: DesignTheme): ThemePreset {
  return THEME_PRESETS.find(preset => preset.value === value) ?? THEME_PRESETS[0];
}
