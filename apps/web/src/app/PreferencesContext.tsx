import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { errorMessage } from "../api/client";
import { updateSettings } from "../api/endpoints";
import { useDensity, useThemePreference, type Density, type ThemePreference } from "../lib/theme";
import { useStructure } from "./StructureContext";
import { useToasts } from "./ToastContext";

/**
 * Takt — die Einstellungen der Darstellung, an einer Stelle (T-057, Punkt 2).
 *
 * ## Warum es diesen Zusammenhang gibt
 *
 * Farbmodus und Zeilendichte werden in einem Bereich eingestellt
 * („Darstellung“ in den Einstellungen) und wirken auf das **ganze** Fenster.
 * Zwischen diesen beiden Punkten liegt der Zusammenhang: Er nimmt die
 * gespeicherte Wahl entgegen, schreibt sie an das Wurzelelement und macht sie
 * damit fuer jede Ansicht gueltig — unabhaengig davon, wo sie gesetzt wurde.
 *
 * ## Warum er nicht mit dem Schalter in der Kopfleiste entfallen ist (T-065)
 *
 * Bis T-057 gab es zwei voneinander unabhaengige Zustaende: Die Kopfleiste
 * hielt ihren eigenen `useThemePreference`, die Einstellungen ihren eigenen.
 * Wer oben umschaltete, sah unten den alten Wert stehen, und beim naechsten
 * Start war die Wahl wieder weg, weil die Kopfleiste nie gespeichert hat.
 * T-057 hat beide auf diesen einen Zusammenhang gelegt.
 *
 * T-065 hat das Bedienelement in der Kopfleiste entfernt — den zweiten
 * Bedienweg, nicht die Quelle. Dieser Zusammenhang bleibt, und er muss
 * bleiben: Ohne ihn wuerde die gespeicherte Wahl beim Start nirgends
 * angewandt, und Takt stuende nach jedem Neustart wieder auf Systemvorgabe.
 * Der `useEffect` weiter unten ist genau diese Stelle.
 *
 * ## Was dauerhaft ist und was nicht
 *
 * **Der Farbmodus ist dauerhaft.** Er liegt in `app_setting.theme` (E-041) und
 * wird bei jeder Aenderung sofort geschrieben — ohne Speichern-Knopf. Eine
 * Darstellungseinstellung, die man erst bestaetigen muss, obwohl man das
 * Ergebnis schon sieht, ist ein Knopf ohne Frage.
 *
 * **Die Zeilendichte ist es nicht.** Das Datenmodell fuehrt keine Spalte dafuer
 * (`AppSettings`: `exportDirectory`, `activeExportTemplateId`, `roundingMode`,
 * `locale`, `theme`). Sie gilt deshalb bis zum Beenden von Takt, und die
 * Oberflaeche sagt das an der Stelle, an der sie eingestellt wird, statt es zu
 * verschweigen. Im Browser wird nichts abgelegt — Takt speichert dort nichts,
 * auch keine Vorliebe. Als offene Frage an die Domaene vermerkt (T-057).
 */

export interface PreferencesApi {
  readonly theme: ThemePreference;
  /** Setzt den Farbmodus und schreibt ihn in die Einstellungen. */
  readonly setTheme: (next: ThemePreference) => void;
  /** Laeuft gerade ein Schreibvorgang fuer den Farbmodus? */
  readonly themeSaving: boolean;
  readonly density: Density;
  /** Setzt die Zeilendichte. Gilt bis zum Beenden, siehe oben. */
  readonly setDensity: (next: Density) => void;
}

const PreferencesContext = createContext<PreferencesApi | null>(null);

export function PreferencesProvider({ children }: { readonly children: ReactNode }) {
  const structure = useStructure();
  const toasts = useToasts();
  const [theme, setThemeLocal] = useThemePreference("system");
  const [density, setDensity] = useDensity("comfortable");
  const [themeSaving, setThemeSaving] = useState(false);

  const settingsTheme =
    structure.state.status === "ready" ? structure.state.value.settings.theme : null;

  /*
   * Die dauerhafte Wahl liegt beim Dienst (`app_setting.theme`, E-041). Diese
   * Wirkung zieht sie nach, sobald die Einstellungen da sind oder sich
   * geaendert haben — auch dann, wenn jemand sie anderswo gesetzt hat.
   */
  useEffect(() => {
    if (settingsTheme !== null) setThemeLocal(settingsTheme);
  }, [settingsTheme, setThemeLocal]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      const previous = theme;
      // Zuerst anwenden, dann schreiben: Der Farbmodus ist das eine
      // Bedienelement, dessen Ergebnis man sieht, bevor der Dienst antwortet.
      setThemeLocal(next);
      setThemeSaving(true);
      void updateSettings({ theme: next })
        .then(() => {
          structure.reload();
        })
        .catch((cause: unknown) => {
          setThemeLocal(previous);
          toasts.failure("Der Farbmodus wurde nicht gespeichert", errorMessage(cause));
        })
        .finally(() => setThemeSaving(false));
    },
    [structure, theme, setThemeLocal, toasts],
  );

  const api = useMemo<PreferencesApi>(
    () => ({ theme, setTheme, themeSaving, density, setDensity }),
    [theme, setTheme, themeSaving, density, setDensity],
  );

  return <PreferencesContext.Provider value={api}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesApi {
  const value = useContext(PreferencesContext);
  if (value === null) {
    throw new Error("usePreferences ausserhalb von PreferencesProvider benutzt.");
  }
  return value;
}
