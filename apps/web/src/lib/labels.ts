/**
 * Shared UI texts: value-to-label maps and the sentences that more than one
 * feature or a shared component (`shared/ui`, `lib`) needs.
 *
 * Database, domain and API carry only the English value (E-015); the screen
 * shows the label from here. Where `@takt/domain` names an enumeration, it is
 * imported (R-1, T-091) so a new domain value turns the missing label red here.
 *
 * Two languages (A-28.2): `de` is binding, `en` has the same shape and is typed
 * as `typeof de`, so a missing key is a type error. `labels()` returns the one
 * for the current language. Feature texts live in `features/<feature>/texts.ts`.
 */

import type { ForeignText } from "../api/types";
import type {
  ExportAuditEvent,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolMatchMode,
  PoolPlacement,
  RoundingMode,
  Theme as ThemeSetting,
  TimeEntrySource,
} from "@takt/domain";
import { formatDuration } from "./format";
import { quotedName } from "./foreign";
import { pickTexts } from "./language";
import type { BookingEndProblem } from "./bookingEnd";

export type {
  ExportAuditEvent,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolMatchMode,
  PoolPlacement,
  RoundingMode,
  ThemeSetting,
  TimeEntrySource,
};

/**
 * What the todo shows about "Erledigt" (A-2.5, E-023). `reopened` is a display
 * state without a column: the timer start lifted "Erledigt" (I-05).
 */
export type DoneFlagState = "open" | "done" | "reopened";

/** The export display state of a booking; `reopened` and `not_billed` are display states (E-050). */
type ExportDisplayStateKey = "open" | "exported" | "reopened" | "not_billed";

type IncompleteInputType = "time" | "number" | "date" | "datetime-local";

const de = {
  timeEntrySource: { timer: "Timer", manual: "Von Hand" } satisfies Record<TimeEntrySource, string>,
  theme: { system: "Systemvorgabe", light: "Hell", dark: "Dunkel" } satisfies Record<ThemeSetting, string>,
  roundingMode: { up: "aufwärts", nearest: "kaufmännisch" } satisfies Record<RoundingMode, string>,
  // `not_billed` is never "als exportiert markiert": that time was never exported (E-047).
  exportAuditEvent: {
    exported: "exportiert",
    reset: "zurückgesetzt",
    not_billed: "nicht abgerechnet",
  } satisfies Record<ExportAuditEvent, string>,

  // Where a rule appears (E-054): surfaces, not types.
  poolPlacement: {
    pool: "Nur in den Pools",
    board: "Nur auf dem Board",
    both: "In den Pools und auf dem Board",
  } satisfies Record<PoolPlacement, string>,
  poolPlacementShort: {
    pool: "Pool",
    board: "Board-Spalte",
    both: "Pool und Board",
  } satisfies Record<PoolPlacement, string>,
  // One wording for both surfaces (W-14); `board` and `both` share the title.
  poolPlacementTitle: {
    pool: "Spalte vom Board genommen.",
    board: "Regel als Spalte aufgenommen.",
    both: "Regel als Spalte aufgenommen.",
  } satisfies Record<PoolPlacement, string>,
  poolPlacementRestoredTitle: "Anzeigeort wiederhergestellt.",
  poolPlacementBody: (quoted: string, short: string) =>
    `${quoted} — ${short}. Die Regel bleibt vollständig erhalten; gelöscht wird nichts, und an den Todos ändert sich nichts.`,

  doneFlag: {
    open: "Offen",
    done: "Erledigt",
    reopened: "Erledigt aufgehoben",
  } satisfies Record<DoneFlagState, string>,
  // Locked sentence SP-16: what the app did and what follows from it (A-2.5, I-05).
  reactivationTitle: (quoted: string) => `Timer gestartet. ${quoted} ist wieder offen.`,

  // "Alle" is not a word for the strictest mode (R-2, Sprache 2).
  poolMatchMode: {
    any: "Mindestens eines davon",
    all: "Jedes der genannten",
  } satisfies Record<PoolMatchMode, string>,
  poolMatchModePrefix: {
    any: "Mindestens eines von",
    all: "Jedes von",
  } satisfies Record<PoolMatchMode, string>,
  poolMatchModeHint: {
    any: "Ein Todo genügt schon mit einem der genannten Tags.",
    all: "Ein Todo muss jeden genannten Tag tragen. Das trifft weniger als „mindestens eines davon“.",
  } satisfies Record<PoolMatchMode, string>,
  // Its own constant, equal in wording to `poolCompletion.any` (H-3 from R-2).
  poolStatus: { any: "Alle" },
  poolCompletion: {
    any: "Alle",
    done: "Erledigt",
    open: "Unerledigt",
  } satisfies Record<PoolCompletionFilter, string>,
  // Words from E-059, not from the data model: "Offen" already means the opposite of "Erledigt".
  poolExport: {
    any: "Alle",
    open: "Noch nicht abgerechnet",
    exported: "Abgerechnet",
  } satisfies Record<PoolExportFilter, string>,
  // Locked sentences SP-15 (E-047, E-050, E-059).
  poolExportNotBilledHint:
    "Ausgebuchte Buchungen zählen mit: Eine Buchung im Anzeigezustand „Nicht abgerechnet“ trägt denselben Exportstatus wie eine exportierte und steht deshalb in dieser Spalte, obwohl sie nie in einer Datei war.",
  poolExportExportedNote:
    "„Abgerechnet“ meint den Exportstatus der Buchungen: Auch eine ausgebuchte Buchung, an der „Nicht abgerechnet“ steht, trägt ihn und zählt hier mit.",
  poolAxisNeutralHint: "Schränkt nicht ein",

  // Pool movement after a change, past tense (E-124 F-1). The German wording equals
  // `poolMovementSentence(…, "past", …)` in @takt/domain, which the add-in still shows.
  poolMovement: {
    reopenNowhere: "Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool und in keiner Spalte.",
    reopenOnlyLeft: (leaves: string) => `Es ist aus ${leaves} verschwunden und erscheint sonst nirgends.`,
    reopenBack: (appears: string) => `Es ist zurück in ${appears}.`,
    reopenBackAndLeft: (appears: string, leaves: string) =>
      `Es ist zurück in ${appears} und aus ${leaves} verschwunden.`,
    entered: (enters: string) => `Es steht jetzt in ${enters}.`,
    left: (leaves: string) => `Es ist aus ${leaves} verschwunden.`,
    enteredAndLeft: (enters: string, leaves: string) =>
      `Es steht jetzt in ${enters} und ist aus ${leaves} verschwunden.`,
  },

  // The definition (board setup) and the behaviour (board lead), T-181 ST-05.
  ruleIsARule: "Eine Spalte ist eine Regel — über Tags, Status, „Erledigt“ und den Exportstatus.",
  ruleWhatMovesACard:
    "Welche Karte wo steht, entscheidet die Regel — nicht die Maus. Eine Karte wandert, wenn sich am Todo etwas ändert, das die Regel abfragt.",

  // Locked sentence SP-08 (formerly `BILLING_NOTE_MAY_BE_EMPTY`), under the note field of both booking surfaces (E-034).
  // End of a booking (A-28.6, welle-18-fluss.md 4.2); the first word is the field label (T-177 P-2).
  bookingEndProblem: {
    missing: "Ende fehlt.",
    before_start: "Ende liegt vor dem Anfang.",
    over_24h: "Ende liegt mehr als 24 Stunden nach dem Anfang.",
    future: "Ende liegt in der Zukunft.",
  } satisfies Record<BookingEndProblem, string>,
  billingNoteMayBeEmpty:
    "Die Leistung darf leer bleiben. Dann ist die Buchung erfasst, aber die Tagesgruppe dieses Todos geht ohne Text nicht in den Export — die Exportvorschau sagt es und bietet an, den Text nachzutragen.",
  // Four dialogs share it (T-177 P-2/P-3).
  nameMissing: "Name fehlt.",
  // Names the state instead of asking for an action (rule G-1).
  nothingSelected: "Nichts gewählt",
  builtinTemplateOption: "Mitgelieferte Standardvorlage",
  // Situation sentences for a day group, shared by timer stop and booking edit (textbestand.md 12.8).
  dayGroupNotBillable: "noch nicht abrechenbar",
  dayGroupPreviewFailedShort: "der Exportwert ließ sich nicht abfragen",
  dayGroupMissingNote: (duration: string) =>
    `Für diesen Tag steht auf diesem Todo noch keine Leistung. Ohne sie bleibt die Tagesgruppe (${duration}) beim Export stehen.`,
  dayGroupPreviewFailed: (serviceMessage: string) =>
    `Was diese Tagesgruppe beim Export ergibt, konnte SuperTakt gerade nicht ermitteln: ${serviceMessage}`,

  // Shared controls
  cancel: "Abbrechen",
  close: "Schließen",
  requiredField: " (Pflichtfeld)",
  fieldMissing: (label: string) => `${label} fehlt.`,
  loadFailed: "Das ließ sich nicht laden",
  retry: "Erneut versuchen",
  dismissMessage: "Meldung schließen",
  refreshing: "Wird aktualisiert …",
  selectEmpty: "Nichts zur Auswahl.",
  contextMenu: "Kontextmenü",
  dateField: {
    pickDate: (label: string) => `${label}: Datum wählen`,
    closeCalendar: "Kalender schließen",
    openCalendar: (label: string) => `${label}: Kalender öffnen`,
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    clearDate: "Datum löschen",
    placeholder: "TT.MM.JJJJ",
    time: (label: string) => `${label}: Uhrzeit`,
  },
  timeField: {
    pick: (label: string) => `${label} wählen`,
    title: "Uhrzeit",
    hour: "Stunde",
    minute: "Minute",
    apply: "Übernehmen",
  },
  deadline: {
    overdue: "Überfällig",
    dueToday: "Heute fällig",
    name: (date: string) => `Frist: ${date}`,
    nameWithState: (word: string, date: string) => `${word} — Frist: ${date}`,
  },
  exportStatus: { open: "Offen", exported: "Exportiert" },
  exportStatePrefix: "Exportstatus: ",
  exportState: {
    open: { label: "Offen", description: "Noch nicht an das Abrechnungstool uebertragen." },
    exported: {
      label: "Exportiert",
      description:
        "Bereits an das Abrechnungstool uebertragen. Gesperrt, solange der Exportstatus nicht zurueckgesetzt wird.",
    },
    reopened: {
      label: "Erneut offen",
      description:
        "Der Exportstatus wurde zurueckgesetzt. Fachlich ist die Buchung offen; sie war aber schon einmal im Export und geht beim naechsten Export erneut in die Abrechnung.",
    },
    not_billed: {
      label: "Nicht abgerechnet",
      description:
        "Von Hand ausgebucht: Diese Zeit wird nicht abgerechnet. Eine Exportdatei hat sie nie enthalten. Fachlich ist die Buchung abgeschlossen und damit gesperrt; rueckgaengig geht das ueber das Zuruecksetzen des Exportstatus.",
    },
  } satisfies Record<ExportDisplayStateKey, { label: string; description: string }>,
  summaryStrip: {
    empty: "keine Buchung",
    count: (count: number, label: string) => `${String(count)} Buchungen: ${label}`,
  },
  search: {
    placeholder: "Suchen …",
    busy: "Suche läuft",
    clear: "Suche leeren",
  },
  filterBar: {
    viewOptions: "Ansichtsoptionen",
    removeFilter: (field: string, value: string) => `Filter ${field} ${value} entfernen`,
    resetAll: "Alle Filter zurücksetzen",
    noneActive: "Kein Filter aktiv",
  },
  formDialog: {
    close: "Dialog schließen",
    failed: "Das hat nicht geklappt",
    incompleteInput: {
      time: "Stunde und Minute gehören dazu.",
      number: "Eine gültige Zahl ist erforderlich.",
      date: "Tag, Monat und Jahr gehören dazu.",
      "datetime-local": "Datum und Uhrzeit gehören dazu.",
    } satisfies Record<IncompleteInputType, string>,
  },
  // Locked sentences SP-09: banner, mark and help of both note kinds.
  noteField: {
    billing: {
      bannerLabel: "Verlässt SuperTakt · steht in der Abrechnung",
      defaultLabel: "Leistung",
      markLabel: "Wird exportiert",
      help: "Wird beim Export an das Abrechnungstool übertragen und steht dort auf der Rechnung des Kunden. Standardvorlage: Feld „Notiz“.",
      defaultPlaceholder: "Was wurde in diesem Zeitraum für den Kunden geleistet?",
    },
    internal: {
      bannerLabel: "Bleibt in SuperTakt",
      defaultLabel: "Vermerk",
      markLabel: "Wird nicht exportiert",
      help: "Bleibt in SuperTakt. Wird nie exportiert — auch nicht über eine eigene Exportvorlage.",
      // No address (T-181, ST-09): a placeholder carries an example, never an address.
      defaultPlaceholder: "Gedanken, Zwischenstände, Ansprechpartner …",
    },
    locked: "gesperrt",
    characters: "Zeichen: ",
  },
  tagChip: {
    newHidden: "wird neu angelegt",
    newMark: "neu",
    defaultHidden: "Standard-Tag",
    defaultMark: "S",
    remove: (name: string) => `Tag ${name} entfernen`,
    path: "Pfad: ",
  },

  // Failures the UI itself reports about the connection (api/client.ts)
  client: {
    unknownError: "Unbekannter Fehler. Bitte versuchen Sie es erneut.",
    unexpectedResponse: (status: number) => `Der lokale Dienst hat unerwartet geantwortet (${String(status)}).`,
    notConnected: "SuperTakt ist noch nicht mit dem lokalen Dienst verbunden.",
    noAnswer: "Der lokale Dienst antwortet nicht. Läuft SuperTakt noch vollständig?",
  },

  // Rule descriptions (lib/poolRule.ts)
  rule: {
    completionText: { done: "Nur erledigte", open: "Nur unerledigte" },
    unknownTag: "Unbekannter Tag",
    unknownFolder: "Unbekannter Ordner",
    unknownStatus: "Unbekannter Status",
    requiredTags: "Erforderliche Tags",
    excludedTags: "Ausgeschlossene Tags",
    without: "Ohne",
    status: "Status",
    // "Einer von", not "alle von": a todo carries exactly one status (T-076).
    statusOneOf: "Status — einer von",
    completion: "Erledigt",
    exportState: "Exportstatus",
    // Dative, because all sentences using it need one: "ein Tag aus …", "kein Tag in …".
    oneUnknownFolder: "einem unbekannten Ordner",
    manyUnknownFolders: (count: string) => `${count} unbekannten Ordnern`,
    spokenEmptyFolder: (folders: string) => ` Kein Tag in ${folders} — diese Regel trifft deshalb nichts.`,
    spokenNoCondition: (fault: string) => `Diese Regel nennt keine Bedingung und trifft nichts.${fault}`,
    spokenNeutral: (axes: string) => ` Ohne Einschränkung: ${axes}.`,
    spokenMatches: (conditions: string, neutral: string, fault: string) =>
      `Diese Regel trifft: ${conditions}.${neutral}${fault}`,
  },

  // Locked sentence SP-18 (lib/errorText.ts): which rules keep a tag or status in use.
  affected: {
    ruleOne: "ist die Regel",
    ruleMany: "sind die Regeln",
    one: "ist",
    many: "sind",
    sentence: (base: string, subject: string, items: string) => `${base} Betroffen ${subject} ${items}.`,
  },
};

const en: typeof de = {
  timeEntrySource: { timer: "Timer", manual: "Manual" },
  theme: { system: "System default", light: "Light", dark: "Dark" },
  roundingMode: { up: "round up", nearest: "round half up" },
  exportAuditEvent: {
    exported: "exported",
    reset: "reset",
    not_billed: "not billed",
  },

  poolPlacement: {
    pool: "Only in the pools",
    board: "Only on the board",
    both: "In the pools and on the board",
  },
  poolPlacementShort: {
    pool: "Pool",
    board: "Board column",
    both: "Pool and board",
  },
  poolPlacementTitle: {
    pool: "Column removed from the board.",
    board: "Rule added as a column.",
    both: "Rule added as a column.",
  },
  poolPlacementRestoredTitle: "Placement restored.",
  poolPlacementBody: (quoted: string, short: string) =>
    `${quoted} — ${short}. The rule stays complete; nothing is deleted, and nothing changes on the todos.`,

  doneFlag: {
    open: "Open",
    done: "Done",
    reopened: "Done lifted",
  },
  reactivationTitle: (quoted: string) => `Timer started. ${quoted} is open again.`,

  poolMatchMode: {
    any: "At least one of them",
    all: "Each of the named",
  },
  poolMatchModePrefix: {
    any: "At least one of",
    all: "Each of",
  },
  poolMatchModeHint: {
    any: "A todo matches with just one of the named tags.",
    all: "A todo must carry every named tag. That matches fewer than “at least one of them”.",
  },
  poolStatus: { any: "All" },
  poolCompletion: {
    any: "All",
    done: "Done",
    open: "Not done",
  },
  poolExport: {
    any: "All",
    open: "Not yet billed",
    exported: "Billed",
  },
  poolExportNotBilledHint:
    "Written-off bookings count too: a booking shown as “Not billed” carries the same export status as an exported one and therefore appears in this column, although it was never in a file.",
  poolExportExportedNote:
    "“Billed” means the export status of the bookings: a written-off booking marked “Not billed” carries it too and counts here.",
  poolAxisNeutralHint: "No restriction",

  poolMovement: {
    reopenNowhere: "No rule currently matches this todo, so it appears in no pool and no column.",
    reopenOnlyLeft: (leaves: string) => `It has left ${leaves} and appears nowhere else.`,
    reopenBack: (appears: string) => `It is back in ${appears}.`,
    reopenBackAndLeft: (appears: string, leaves: string) => `It is back in ${appears} and has left ${leaves}.`,
    entered: (enters: string) => `It is now in ${enters}.`,
    left: (leaves: string) => `It has left ${leaves}.`,
    enteredAndLeft: (enters: string, leaves: string) => `It is now in ${enters} and has left ${leaves}.`,
  },

  ruleIsARule: "A column is a rule — over tags, status, “Done” and the export status.",
  ruleWhatMovesACard:
    "The rule decides which card stands where — not the mouse. A card moves when something changes on the todo that the rule asks about.",

  bookingEndProblem: {
    missing: "End is missing.",
    before_start: "End is before the start.",
    over_24h: "End is more than 24 hours after the start.",
    future: "End is in the future.",
  } satisfies Record<BookingEndProblem, string>,
  billingNoteMayBeEmpty:
    "The work done may stay empty. The booking is then recorded, but this todo's day group does not go into the export without text — the export preview says so and offers to add the text.",
  nameMissing: "Name is missing.",
  nothingSelected: "Nothing selected",
  builtinTemplateOption: "Built-in default template",
  dayGroupNotBillable: "not billable yet",
  dayGroupPreviewFailedShort: "the export value could not be retrieved",
  dayGroupMissingNote: (duration: string) =>
    `There is no work done on this todo for this day yet. Without it the day group (${duration}) stays behind at export.`,
  dayGroupPreviewFailed: (serviceMessage: string) =>
    `SuperTakt could not determine what this day group yields at export: ${serviceMessage}`,

  cancel: "Cancel",
  close: "Close",
  requiredField: " (required)",
  fieldMissing: (label: string) => `${label} is missing.`,
  loadFailed: "This could not be loaded",
  retry: "Try again",
  dismissMessage: "Close message",
  refreshing: "Updating …",
  selectEmpty: "Nothing to choose.",
  contextMenu: "Context menu",
  dateField: {
    pickDate: (label: string) => `${label}: choose date`,
    closeCalendar: "Close calendar",
    openCalendar: (label: string) => `${label}: open calendar`,
    previousMonth: "Previous month",
    nextMonth: "Next month",
    clearDate: "Clear date",
    placeholder: "DD/MM/YYYY",
    time: (label: string) => `${label}: time`,
  },
  timeField: {
    pick: (label: string) => `Choose ${label}`,
    title: "Time",
    hour: "Hour",
    minute: "Minute",
    apply: "Apply",
  },
  deadline: {
    overdue: "Overdue",
    dueToday: "Due today",
    name: (date: string) => `Due date: ${date}`,
    nameWithState: (word: string, date: string) => `${word} — due date: ${date}`,
  },
  exportStatus: { open: "Open", exported: "Exported" },
  exportStatePrefix: "Export status: ",
  exportState: {
    open: { label: "Open", description: "Not yet transferred to the billing tool." },
    exported: {
      label: "Exported",
      description: "Already transferred to the billing tool. Locked until the export status is reset.",
    },
    reopened: {
      label: "Open again",
      description:
        "The export status was reset. The booking is open, but it was in an export before and goes into billing again with the next export.",
    },
    not_billed: {
      label: "Not billed",
      description:
        "Written off by hand: this time is not billed. No export file ever contained it. The booking is closed and therefore locked; resetting the export status undoes this.",
    },
  },
  summaryStrip: {
    empty: "no booking",
    count: (count: number, label: string) => `${String(count)} bookings: ${label}`,
  },
  search: {
    placeholder: "Search …",
    busy: "Searching",
    clear: "Clear search",
  },
  filterBar: {
    viewOptions: "View options",
    removeFilter: (field: string, value: string) => `Remove filter ${field} ${value}`,
    resetAll: "Reset all filters",
    noneActive: "No filter active",
  },
  formDialog: {
    close: "Close dialog",
    failed: "That did not work",
    incompleteInput: {
      time: "Hour and minute are needed.",
      number: "A valid number is required.",
      date: "Day, month and year are needed.",
      "datetime-local": "Date and time are needed.",
    },
  },
  noteField: {
    billing: {
      bannerLabel: "Leaves SuperTakt · appears in billing",
      defaultLabel: "Work done",
      markLabel: "Is exported",
      help: "Transferred to the billing tool at export and shown there on the customer's invoice. Default template: field “Notiz”.",
      defaultPlaceholder: "What was done for the customer in this period?",
    },
    internal: {
      bannerLabel: "Stays in SuperTakt",
      defaultLabel: "Internal note",
      markLabel: "Is not exported",
      help: "Stays in SuperTakt. Never exported — not even through a custom export template.",
      defaultPlaceholder: "Thoughts, interim results, contacts …",
    },
    locked: "locked",
    characters: "Characters: ",
  },
  tagChip: {
    newHidden: "will be created",
    newMark: "new",
    defaultHidden: "Default tag",
    defaultMark: "D",
    remove: (name: string) => `Remove tag ${name}`,
    path: "Path: ",
  },

  client: {
    unknownError: "Unknown error. Please try again.",
    unexpectedResponse: (status: number) => `The local service answered unexpectedly (${String(status)}).`,
    notConnected: "SuperTakt is not yet connected to the local service.",
    noAnswer: "The local service does not answer. Is SuperTakt still fully running?",
  },

  rule: {
    completionText: { done: "Only done", open: "Only not done" },
    unknownTag: "Unknown tag",
    unknownFolder: "Unknown folder",
    unknownStatus: "Unknown status",
    requiredTags: "Required tags",
    excludedTags: "Excluded tags",
    without: "Without",
    status: "Status",
    statusOneOf: "Status — one of",
    completion: "Done",
    exportState: "Export status",
    oneUnknownFolder: "an unknown folder",
    manyUnknownFolders: (count: string) => `${count} unknown folders`,
    spokenEmptyFolder: (folders: string) => ` No tag in ${folders} — so this rule matches nothing.`,
    spokenNoCondition: (fault: string) => `This rule names no condition and matches nothing.${fault}`,
    spokenNeutral: (axes: string) => ` Without restriction: ${axes}.`,
    spokenMatches: (conditions: string, neutral: string, fault: string) =>
      `This rule matches: ${conditions}.${neutral}${fault}`,
  },

  affected: {
    ruleOne: "rule",
    ruleMany: "rules",
    one: "",
    many: "",
    sentence: (base: string, subject: string, items: string) =>
      subject === "" ? `${base} Affected: ${items}.` : `${base} Affected ${subject}: ${items}.`,
  },
};

/** The shared texts in the current UI language. */
export function labels(): typeof de {
  return pickTexts({ de, en });
}

/**
 * Title and line of the message after changing a rule's placement. `restored`
 * is the undo call: own title, same line (what the action does not do, E-059).
 */
export function poolPlacementMessage(
  name: ForeignText,
  placement: PoolPlacement,
  restored: boolean,
): { readonly title: string; readonly body: string } {
  const text = labels();
  return {
    title: restored ? text.poolPlacementRestoredTitle : text.poolPlacementTitle[placement],
    body: text.poolPlacementBody(quotedName(name), text.poolPlacementShort[placement]),
  };
}

/** From the two truths the display state. `done` beats `reopened`. */
export function doneFlagState(done: boolean, reactivated: boolean): DoneFlagState {
  if (done) return "done";
  return reactivated ? "reopened" : "open";
}

/**
 * Locked sentence SP-16. A function because the app (`TimerContext`) and the
 * showcase both need it; a copied wording would only test itself.
 */
export function reactivationTitle(todoTitle: ForeignText): string {
  return labels().reactivationTitle(quotedName(todoTitle));
}

export function dayGroupMissingNote(groupSeconds: number): string {
  return labels().dayGroupMissingNote(formatDuration(groupSeconds));
}

export function dayGroupPreviewFailed(serviceMessage: string): string {
  return labels().dayGroupPreviewFailed(serviceMessage);
}
