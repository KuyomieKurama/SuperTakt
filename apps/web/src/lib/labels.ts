/**
 * Wert zu Beschriftung — die eine Stelle, an der aus einem Datenwert ein
 * Oberflaechentext wird.
 *
 * Datenbank, Domaene und API fuehren ausschliesslich den englischen Wert
 * (E-015). Auf dem Bildschirm steht die deutsche Beschriftung (`CLAUDE.md`).
 * Damit dieselbe Zuordnung nicht in vierzehn Ansichten neu getippt wird,
 * steht sie hier genau einmal.
 *
 * Belege: `docs/glossar.md`, Abschnitt "Wert zu Beschriftung", ergaenzt um die
 * beiden Zuordnungen aus E-041, die dort offen geblieben waren.
 *
 * Regel fuer alle Eintraege: Der Schluessel ist der Wert aus dem Datenmodell,
 * niemals ein hier erfundener. Wer eine Beschriftung braucht, deren Wert es im
 * Datenmodell nicht gibt, hat einen Modellfehler und keine Uebersetzungsluecke.
 */

/* ==================================================================== */
/* Zeitbuchung — Herkunft (`time_entry.source`, E-041)                  */
/* ==================================================================== */

/** Wie eine Zeitbuchung entstanden ist. Spalte `time_entry.source`. */
export type TimeEntrySource = "timer" | "manual";

export const TIME_ENTRY_SOURCE_LABEL: Readonly<Record<TimeEntrySource, string>> = {
  timer: "Timer",
  manual: "Von Hand",
};

/* ==================================================================== */
/* Darstellung (`app_setting.theme`, E-041)                             */
/* ==================================================================== */

/** Farbmodus der Anwendung. Spalte `app_setting.theme`. */
export type ThemeSetting = "system" | "light" | "dark";

export const THEME_LABEL: Readonly<Record<ThemeSetting, string>> = {
  system: "Systemvorgabe",
  light: "Hell",
  dark: "Dunkel",
};

/* ==================================================================== */
/* Rundung (`app_setting.rounding_mode`, `export_run.rounding_mode`)    */
/* ==================================================================== */

/** Rundungsverfahren vor dem Export. Bestaetigt ist `up` (E-008). */
export type RoundingMode = "up" | "nearest";

export const ROUNDING_MODE_LABEL: Readonly<Record<RoundingMode, string>> = {
  up: "aufwärts",
  nearest: "kaufmännisch",
};

/* ==================================================================== */
/* Exportprotokoll (`export_audit.event`)                               */
/* ==================================================================== */

/**
 * Ereignis im Exportprotokoll.
 *
 * `not_billed` ist seit E-047 der dritte Wert: Die Buchung wurde ausgebucht,
 * ohne dass eine Datei entstand. Er heisst in der Oberflaeche „nicht
 * abgerechnet" und nirgends „als exportiert markiert" — exportiert wurde diese
 * Zeit nie.
 */
export type ExportAuditEvent = "exported" | "reset" | "not_billed";

export const EXPORT_AUDIT_EVENT_LABEL: Readonly<Record<ExportAuditEvent, string>> = {
  exported: "exportiert",
  reset: "zurückgesetzt",
  not_billed: "nicht abgerechnet",
};

/* ==================================================================== */
/* Anzeigeort einer Regel (`pool.placement`, E-054)                     */
/* ==================================================================== */

/**
 * Wo eine Regel erscheint. Spalte `pool.placement`.
 *
 * Seit E-054 ist eine Kanban-Spalte dieselbe Entitaet wie ein Pool; der
 * Anzeigeort ist der einzige Unterschied. Die Beschriftungen sagen deshalb
 * **Flaechen** und nicht Typen: Es gibt nicht „Pool" und „Spalte", es gibt eine
 * Regel, die im Pool-Bereich steht, auf dem Board oder an beiden Stellen.
 */
export type PoolPlacement = "pool" | "board" | "both";

export const POOL_PLACEMENT_LABEL: Readonly<Record<PoolPlacement, string>> = {
  pool: "Nur in den Pools",
  board: "Nur auf dem Board",
  both: "In den Pools und auf dem Board",
};

/** Kurzform fuer Etiketten in Listen, wo der Zusammenhang schon klar ist. */
export const POOL_PLACEMENT_SHORT: Readonly<Record<PoolPlacement, string>> = {
  pool: "Pool",
  board: "Board-Spalte",
  both: "Pool und Board",
};

/* ==================================================================== */
/* Erledigt-Kennzeichen — die drei Anzeigezustaende (A-2.5, E-023)      */
/* ==================================================================== */

/**
 * Was am Todo ueber „Erledigt" steht.
 *
 * Zwei der drei Werte stehen im Datenmodell (`todo.completed_at` gesetzt oder
 * nicht). Der dritte, `reopened`, steht **nirgends** und ist trotzdem noetig:
 * Hebt ein Timerstart das Kennzeichen auf (A-2.5, I-05), sieht die Zeile ohne
 * ihn hinterher aus, als waere sie nie erledigt gewesen — der Wechsel bliebe
 * unerklaert (T-005n, Abschnitt 1, Regel 1). Er lebt in der Sitzung
 * (`TimerContext.reactivated`) und endet, sobald der Benutzer das Kennzeichen
 * selbst anfasst.
 *
 * Die Regel aus dem Datenmodell gilt hier nicht — `reopened` ist kein
 * erfundener Datenwert, sondern ein Anzeigezustand, und er ist als solcher
 * benannt.
 */
export type DoneFlagState = "open" | "done" | "reopened";

/**
 * Die drei Beschriftungen, an genau einer Stelle.
 *
 * Bis T-045 standen sie dreimal getippt in `Kanban.tsx`, `DashboardScreen.tsx`
 * und `TimeScreen.tsx` — und in S-02 und S-03 gar nicht (Befund C-23).
 * Uneinheitlichkeit wiegt hier schwerer als durchgaengiges Fehlen: Wer den
 * Timer aus der Todo-Liste startet und auf dem Dashboard ein Etikett sieht,
 * das neben der Liste fehlt, haelt den Unterschied fuer eine Bedeutung.
 */
export const DONE_FLAG_LABEL: Readonly<Record<DoneFlagState, string>> = {
  open: "Offen",
  done: "Erledigt",
  reopened: "Erledigt aufgehoben",
};

/** Aus den beiden Wahrheiten der Anzeigezustand. `done` schlaegt `reopened`. */
export function doneFlagState(done: boolean, reactivated: boolean): DoneFlagState {
  if (done) return "done";
  return reactivated ? "reopened" : "open";
}

/**
 * Was beim Aufheben des Kennzeichens **nicht** geschieht (E-023).
 *
 * Zeichengleich mit `CARD_STAYS` aus `apps/outlook-addin/src/duplicate/reopen.ts`.
 * Die Fassung des Add-ins gewinnt: Der Halbsatz zur Spalte macht E-023
 * aussprechbar, statt vorauszusetzen, dass der Benutzer weiss, was „die Karte"
 * mit „der Spalte" zu tun hat (Befund C-24). Wer den Satz hier aendert, muss
 * ihn dort mitaendern — sonst behaupten zwei Stellen dasselbe verschieden.
 */
export const CARD_STAYS = "Die Karte bleibt, wo sie ist — die Spalte ändert sich dadurch nicht.";
