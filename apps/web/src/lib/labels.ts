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
 *
 * ## Der Wertebereich kommt aus der Domaene, nicht von hier (R-1, T-091)
 *
 * Wo `@takt/domain` eine Aufzaehlung bereits als benannten Typ fuehrt, wird er
 * hier **importiert und weitergereicht** — nicht ein zweites Mal getippt. Der
 * Grund ist die Richtung, die weh tut: Eine hier abgeschriebene Fassung bliebe
 * bei einem vierten Domaenenwert stillschweigend **enger**, jede Zuweisung
 * bliebe gueltig, nichts wuerde rot — und die `Record`-Tabelle darunter liefe
 * fuer den neuen Wert auf `undefined`, wo ihr Typ `string` verspricht. Mit dem
 * Import wird stattdessen genau die Tabelle rot, der eine Beschriftung fehlt.
 *
 * **Sechs** Aufzaehlungen liegen deshalb in der Domaene und werden hier nur
 * beschriftet: {@link TimeEntrySource}, {@link RoundingMode},
 * {@link ExportAuditEvent}, {@link PoolPlacement}, {@link PoolCompletionFilter}
 * und {@link PoolExportFilter}.
 *
 * **Drei** bleiben hier definiert, jede aus einem genannten Grund:
 *
 *  - {@link DoneFlagState} ist ein **Anzeige**zustand ohne Entsprechung im
 *    Datenmodell — `reopened` steht in keiner Spalte.
 *  - {@link ThemeSetting} und {@link PoolMatchMode} fuehrt die Domaene bis
 *    heute nur als Inline-Vereinigung an ihrem Feld (`settings.ts:37`,
 *    `tag.ts:283`); es gibt dort keinen Namen zum Importieren. Sobald sie einen
 *    bekommen, gehoeren beide in die Liste darueber. Gemeldet an den
 *    domain-dev, T-091.
 */

import type {
  ExportAuditEvent,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolPlacement,
  RoundingMode,
  TimeEntrySource,
} from "@takt/domain";

export type {
  ExportAuditEvent,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolPlacement,
  RoundingMode,
  TimeEntrySource,
};

/* ==================================================================== */
/* Zeitbuchung — Herkunft (`time_entry.source`, E-041)                  */
/* ==================================================================== */

/**
 * Wie eine Zeitbuchung entstanden ist. Spalte `time_entry.source`.
 * Der Wertebereich steht in `@takt/domain` (`time-entry.ts`).
 */
export const TIME_ENTRY_SOURCE_LABEL: Readonly<Record<TimeEntrySource, string>> = {
  timer: "Timer",
  manual: "Von Hand",
};

/* ==================================================================== */
/* Darstellung (`app_setting.theme`, E-041)                             */
/* ==================================================================== */

/**
 * Farbmodus der Anwendung. Spalte `app_setting.theme`.
 *
 * Zweite Fassung: Die Domaene schreibt denselben Wertebereich inline an
 * `AppSettings.theme` (`packages/domain/src/settings.ts:37`) und gibt ihm
 * keinen Namen. Sobald sie einen vergibt, wird dieser Typ dagegen getauscht —
 * siehe den Kopf dieser Datei.
 */
export type ThemeSetting = "system" | "light" | "dark";

export const THEME_LABEL: Readonly<Record<ThemeSetting, string>> = {
  system: "Systemvorgabe",
  light: "Hell",
  dark: "Dunkel",
};

/* ==================================================================== */
/* Rundung (`app_setting.rounding_mode`, `export_run.rounding_mode`)    */
/* ==================================================================== */

/**
 * Rundungsverfahren vor dem Export. Bestaetigt ist `up` (E-008).
 * Der Wertebereich steht in `@takt/domain` (`rounding.ts`).
 */
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

/*
 * Hier stand bis T-094 `CARD_STAYS`:
 *
 *     „Die Karte bleibt, wo sie ist — die Spalte ändert sich dadurch nicht."
 *
 * Der Satz ist **ersatzlos** entfallen (E-058 Absatz 2), und diese Notiz steht
 * an seiner Stelle, damit ihn niemand aus bester Absicht neu erfindet.
 *
 * Er war falsch. Er stammte aus der Zeit, in der eine Spalte nur an Tags hing;
 * seit E-055 fragt eine Regel auch nach „Erledigt" und nach dem Exportstatus,
 * und **beides** ändert ein Timerstart — das Kennzeichen fällt (A-2.5), die
 * erste abgeschlossene Buchung setzt „hat offene Buchungen". Die Karte bleibt
 * also gerade nicht zwingend, wo sie ist.
 *
 * Ersetzt wird er nicht durch einen zweiten Kartensatz, sondern durch eine
 * **Auskunft**: `POST /timer/start` liefert `poolMovement`, und
 * `poolMovementSentence` aus `@takt/domain` macht daraus den Satz — denselben,
 * den der Aufgabenbereich des Add-ins zeigt. Bewegt sich nichts, steht dort
 * nichts; eine Fläche ohne Inhalt wird weggelassen und nicht mit einer
 * Beruhigung gefüllt.
 *
 * Keine Beschriftung für diesen Satz in dieser Datei: Was aus der Domäne
 * kommt, wird hier nicht noch einmal getippt.
 */

/* ==================================================================== */
/* Die Achsen einer Regel (T-076, T-079)                                */
/* ==================================================================== */

/**
 * Wie viele der **erforderlichen** Tags zutreffen muessen (`pool.match_mode`).
 *
 * Der Wert gilt ausschliesslich fuer die erforderlichen Tags. Ausgeschlossene
 * Tags sind immer „keines davon", Status ist immer „einer von diesen" — beides
 * folgt aus dem Feld und ist keine Einstellung (T-076, Abschnitt 2).
 *
 * **Die Vorgabe ist `any` und bleibt es.** Jede Regel, die es heute gibt,
 * bedeutet „mindestens eines davon"; `pool.match_mode` haelt das seit Migration
 * 0001 je Regel einzeln fest. Wer die Vorgabe hier auf `all` stellt, deutet
 * keinen Bestand um — aber er legt neue Regeln anders an, als der Benutzer es
 * aus dem Bestand kennt.
 *
 * Zweite Fassung wie {@link ThemeSetting}: Die Domaene fuehrt denselben
 * Wertebereich inline an `Pool.matchMode` (`packages/domain/src/tag.ts:283`)
 * und gibt ihm keinen Namen. Sobald sie einen vergibt, wird dieser Typ dagegen
 * getauscht — siehe den Kopf dieser Datei.
 */
export type PoolMatchMode = "any" | "all";

/**
 * **„Alle" ist hier kein Wort mehr** (R-2, Sprache 2).
 *
 * Bis T-091 hiess der strengste Modus „Alle davon" — drei Zeilen unter einem
 * Neutralwert, der ebenfalls „Alle" heisst und das **Gegenteil** bedeutet:
 * „schraenkt nicht ein". Dasselbe Wort fuer „engt am meisten ein" und „engt gar
 * nicht ein", untereinander im selben Formular. Der Modus heisst deshalb
 * „Jedes der genannten"; der Neutralwert behaelt „Alle", weil er der Wert des
 * Vorbilds ist und an drei Achsen gleich lautet.
 */
export const POOL_MATCH_MODE_LABEL: Readonly<Record<PoolMatchMode, string>> = {
  any: "Mindestens eines davon",
  all: "Jedes der genannten",
};

/** Dieselbe Aussage als Satzanfang vor der Tagliste einer Regelzusammenfassung. */
export const POOL_MATCH_MODE_PREFIX: Readonly<Record<PoolMatchMode, string>> = {
  any: "Mindestens eines von",
  all: "Jedes von",
};

export const POOL_MATCH_MODE_HINT: Readonly<Record<PoolMatchMode, string>> = {
  any: "Ein Todo genügt schon mit einem der genannten Tags.",
  all: "Ein Todo muss jeden genannten Tag tragen. Das trifft weniger als „mindestens eines davon“.",
};

/**
 * Der Neutralwert der **Status**achse (H-3 aus R-2).
 *
 * Wortgleich mit `POOL_COMPLETION_LABEL.any`, und trotzdem eine eigene
 * Konstante: Bis T-091 holte sich der Hilfssatz der Statusachse sein Wort aus
 * der **Erledigt**-Achse. Wer dort eines Tages „Beliebig" schreibt, aendert
 * stillschweigend eine Achse mit, die er gar nicht angefasst hat. Zwei Achsen,
 * zwei Konstanten — auch wenn heute dasselbe darin steht.
 */
export const POOL_STATUS_LABEL: Readonly<Record<"any", string>> = {
  any: "Alle",
};

/**
 * Die Erledigt-Achse einer Regel (`pool.completion`).
 *
 * Nicht zu verwechseln mit „Erledigte einblenden": Diese Achse entscheidet
 * ueber **Zugehoerigkeit**, jener Schalter ueber **Sichtbarkeit**. Steht die
 * Achse neutral, entscheidet wie bisher der Schalter; sagt sie etwas, hat sie
 * das letzte Wort — sonst waere eine Spalte „Erledigt" dauerhaft leer.
 */
export const POOL_COMPLETION_LABEL: Readonly<Record<PoolCompletionFilter, string>> = {
  any: "Alle",
  done: "Erledigt",
  open: "Unerledigt",
};

/**
 * Der Exportstatus-Achse einer Regel (`pool.export_state`).
 *
 * ## Die Woerter kommen aus E-059, nicht aus dem Datenmodell
 *
 * Der Wert heisst in der Datenbank weiter `open` beziehungsweise `exported`;
 * in der Oberflaeche heisst er **„Noch nicht abgerechnet"** und
 * **„Abgerechnet"**. Der Grund ist kein Geschmack: „Offen" ist auf der Karte
 * bereits das Gegenteil von „Erledigt" ({@link DONE_FLAG_LABEL}), und
 * dasselbe Wort im selben Dialog ein zweites Mal als Gegenteil von
 * „Exportiert" zu verwenden ist ein Fehler, den der Benutzer ausbadet.
 *
 * Verworfen wurden in T-091 zwei naheliegende Ersatzwoerter: „Nicht
 * exportiert" waere **falsch** — die Achse fragt „hat mindestens eine offene
 * Buchung" und nicht „hat keine exportierte" —, und „Mit offener Buchung" war
 * bereits die zweite Fassung derselben Zeichenkette in `lib/poolRule.ts`. Die
 * gibt es seit T-094 nicht mehr: Die Regelvorschau nimmt genau diese
 * Beschriftung.
 *
 * **`exported` heisst „hat mindestens eine exportierte Buchung"** und nicht
 * „vollstaendig abgerechnet" — der Exportstatus gehoert der Buchung, nicht dem
 * Todo (E-032). Ein Todo mit einer offenen und einer exportierten Buchung
 * erfuellt beide Werte und steht in beiden Spalten. Ein Todo ohne jede Buchung
 * erfuellt keinen von beiden.
 *
 * **Und `exported` schliesst die Ausbuchungen nach E-047 mit ein** (S-1 aus
 * R-2). Eine Buchung, die der Benutzer ausdruecklich **nicht** abrechnen
 * wollte, traegt denselben Statuswert `exported` — zweiwertig bleibt
 * zweiwertig (E-032) —, und die Regelachse fragt genau diesen Wert ab. Eine
 * vierte Option waere deshalb falsch; gesagt werden muss es trotzdem, sonst
 * enthaelt eine Spalte „schon abgerechnet" genau die Zeit, die nie abgerechnet
 * wurde. Der Satz dazu steht in {@link POOL_EXPORT_NOT_BILLED_HINT} und an der
 * Stelle, an der gewaehlt wird.
 */
export const POOL_EXPORT_LABEL: Readonly<Record<PoolExportFilter, string>> = {
  any: "Alle",
  open: "Noch nicht abgerechnet",
  exported: "Abgerechnet",
};

/**
 * Was „Abgerechnet" ausserdem mitnimmt (E-047, E-050, S-1 aus R-2).
 *
 * Steht an der Achse und nicht in einer Fussnote: Wer eine Spalte „schon
 * abgerechnet" baut, soll vor dem Speichern lesen, dass die ausgebuchten
 * Buchungen darin stehen — sie sind die einzige Auswertung, fuer die E-047
 * ueberhaupt eingefuehrt wurde.
 *
 * **Seit E-059 muss dieser Satz mehr leisten als vorher.** Solange die Achse
 * „Exportiert" hiess, war der Zusatz eine Praezisierung. Jetzt heisst sie
 * „Abgerechnet", und eine Buchung, die als **„Nicht abgerechnet"** ausgebucht
 * wurde, steht trotzdem darin — zwei Woerter, die sich zu widersprechen
 * scheinen und beide richtig sind, weil das eine den Anzeigezustand einer
 * Buchung meint (E-050) und das andere den Wert `export_state = 'exported'`,
 * den beide teilen (E-032, zweiwertig). Der Satz spricht den Widerspruch
 * deshalb aus, statt ihn zu ueberspielen.
 */
export const POOL_EXPORT_NOT_BILLED_HINT =
  "Ausgebuchte Buchungen zählen mit: Eine Buchung im Anzeigezustand „Nicht abgerechnet“ (E-047) trägt denselben Exportstatus wie eine exportierte und steht deshalb in dieser Spalte, obwohl sie nie in einer Datei war.";

/**
 * Was der Neutralwert bedeutet — der Satz, der ueberall danebensteht.
 *
 * „Alle" ist die haeufigste Fehllesart dieses Formulars: Es heisst **nicht**
 * „trifft alles", sondern „diese Achse laesst alles durch, was die anderen
 * uebrig lassen". Stehen alle Achsen neutral, bleibt nichts uebrig, das eine
 * andere Achse ausgewaehlt haette — und die Regel trifft nichts (A-3.4).
 */
export const POOL_AXIS_NEUTRAL_HINT = "Schränkt nicht ein";

/* ==================================================================== */
/* Was eine Spalte ist — die eine Fassung (S-2 aus R-2, E-054, E-055)   */
/* ==================================================================== */

/**
 * Bis T-091 stand an elf Oberflaechenstellen „eine Regel **ueber Tags**", und
 * an mehreren daneben „welche Karte wo steht, entscheiden die Tags des Todos".
 *
 * Das war die richtige Erklaerung fuer E-054 und mit E-055 zur halben
 * geworden: Eine Regel hat seither **fuenf** Achsen, und drei davon — Status,
 * „Erledigt", Exportstatus — aendern sich, ohne dass jemand ein Tag anfasst.
 * Wer den alten Satz gelesen hat, sucht die nach einem Timerstart verschwundene
 * Karte bei den Tags. Dort ist sie nicht.
 *
 * Deshalb drei Fassungen, je nach Platz, und keine vierte:
 *
 *  - {@link RULE_IS_A_RULE} — der Satz, wo Platz fuer eine Aufzaehlung ist.
 *  - {@link RULE_NOT_A_PLACE} — die Kurzform fuer Kopfzeilen und Menues.
 *  - {@link RULE_WHAT_MOVES_A_CARD} — was eine Karte bewegt, statt „die Tags".
 */
export const RULE_IS_A_RULE =
  "Eine Spalte ist eine Regel — über Tags, Status, „Erledigt“ und den Exportstatus.";

/** Die Kurzform, wo der Platz fuer die Aufzaehlung fehlt. */
export const RULE_NOT_A_PLACE = "Eine Spalte ist eine Regel, kein Ablageort.";

/**
 * Was eine Karte bewegt — die Nachfolge von „das entscheiden die Tags".
 *
 * Sie nennt die Bewegung und ihren Ausloeser, ohne eine der fuenf Achsen
 * hervorzuheben: Was sich am Todo aendert, aendert seine Zugehoerigkeit.
 */
export const RULE_WHAT_MOVES_A_CARD =
  "Welche Karte wo steht, entscheidet die Regel — nicht die Maus. Eine Karte wandert, wenn sich am Todo etwas ändert, das die Regel abfragt.";
