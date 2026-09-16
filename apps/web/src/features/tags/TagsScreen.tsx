import { SettingsScreen } from "../settings/SettingsScreen";

/** Kompatibilität für ältere direkte Einbindungen der Tags-Ansicht. */
export function TagsScreen() {
  return <SettingsScreen query={{ bereich: "tags" }} />;
}
