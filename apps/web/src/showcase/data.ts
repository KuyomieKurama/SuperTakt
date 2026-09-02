import type { ExportAuditRowModel } from "../app/exportAudit";
import type { BookingRowData } from "../components/BookingTable";
import type { ExportGroupData } from "../components/ExportGroups";
import type { KanbanCardData } from "../components/Kanban";
import type { TagTreeNode } from "../components/TagTree";

/**
 * Beispieldaten der Musterseite.
 *
 * Alles frei erfunden: keine echten Call-Nummern, keine echten Kundennamen,
 * keine echten Notizen. Alle Zeiten und Zahlen sind bereits als Text
 * formatiert, weil die Oberflaeche nach den Projektregeln nicht rechnet und
 * nicht rundet — das gehoert nach `packages/domain`.
 */

export const BOOKING_ROWS: readonly BookingRowData[] = [
  {
    id: "b-1",
    exportStatus: "open",
    exportCount: 0,
    source: "timer",
    callNumber: "CALL-2026-0417",
    todoTitle: "Musterkunde Nord — Rechnungslauf prüfen",
    period: "31.08.2026, 09:12–10:19",
    duration: "1:07 h",
    note: "Fehleranalyse im Rechnungslauf, Zuordnung der Positionen korrigiert.",
  },
  {
    id: "b-2",
    exportStatus: "exported",
    exportCount: 1,
    source: "timer",
    callNumber: "CALL-2026-0417",
    todoTitle: "Musterkunde Nord — Rechnungslauf prüfen",
    period: "30.08.2026, 14:03–14:48",
    duration: "0:45 h",
    note: "Rückfrage zur Buchungsperiode telefonisch geklärt.",
    exportedAt: "30.08.2026",
  },
  {
    /* Zurueckgesetzt (E-012): fachlich offen, exportCount 1. Die Anzeige
       sagt "Erneut offen", der Filter "Nur offen" findet sie trotzdem —
       genau das verlangt E-032. */
    id: "b-3",
    exportStatus: "open",
    exportCount: 1,
    source: "timer",
    callNumber: "CALL-2026-0392",
    todoTitle: "Beispiel GmbH — Schnittstelle neu aufsetzen",
    period: "29.08.2026, 08:30–11:06",
    duration: "2:36 h",
    note: "Schnittstelle neu aufgesetzt, Übertragung mit Testdaten geprüft.",
    exportedAt: "29.08.2026",
  },
  {
    id: "b-4",
    exportStatus: "open",
    exportCount: 0,
    source: "manual",
    callNumber: null,
    todoTitle: "Interne Abstimmung Betriebshandbuch",
    period: "29.08.2026, 13:00–13:07",
    duration: "0:07 h",
    note: "",
  },
  {
    id: "b-5",
    exportStatus: "exported",
    exportCount: 1,
    source: "manual",
    callNumber: "CALL-2026-0388",
    todoTitle: "Musterwerk AG — Sammelrechnung aufteilen",
    period: "28.08.2026, 16:20–17:05",
    duration: "0:45 h",
    note: "Sammelrechnung nach Kostenstellen aufgeteilt und abgestimmt.",
    exportedAt: "28.08.2026",
  },
];

/**
 * Eine Spalte des Boards — seit E-054 eine **Regel ueber Tags**, dieselbe
 * Entitaet wie ein Pool. `rule` steht hier als Text, weil die Musterseite
 * keine Regelaufloesung braucht: Welche Karte eine Regel trifft, entscheidet
 * der Dienst, und fuer die Darstellung genuegt die feste Zuordnung unten.
 */
export interface BoardColumn {
  readonly id: string;
  readonly title: string;
  readonly rule: string;
}

/**
 * Fuenf Spalten, und keine davon ist ein Status.
 *
 * "Eskalation" bleibt leer: Eine Regel, die derzeit nichts trifft, ist der
 * haeufigste Zustand einer frisch eingerichteten Spalte und braucht deshalb
 * einen eigenen Leerzustand.
 */
export const BOARD_COLUMNS: readonly BoardColumn[] = [
  { id: "kunden-nord", title: "Kunden Nord", rule: "Ordner „Kunden / Nord“, mit Unterordnern" },
  { id: "support", title: "Support", rule: "Tag „Support“" },
  { id: "wartet", title: "Wartet auf Rückmeldung", rule: "Tag „Wartet“" },
  { id: "intern", title: "Intern", rule: "Tag „Intern“" },
  { id: "eskalation", title: "Eskalation", rule: "Tag „Eskalation“" },
];

export interface BoardCard extends KanbanCardData {
  /**
   * In welchen Spalten diese Karte steht — **mehrere sind der Normalfall**
   * (E-054). Vor E-054 war das ausgeschlossen, weil eine Karte genau eine
   * Statusspalte hatte.
   */
  readonly columnIds: readonly string[];
}

export const BOARD_CARDS: readonly BoardCard[] = [
  {
    id: "t-1",
    columnIds: ["support"],
    title: "Musterwerk AG — Exportvorlage für Sammelrechnung anlegen",
    callNumber: "CALL-2026-0388",
    tags: [
      { label: "Musterwerk AG", path: ["Kunden", "Süd"] },
      { label: "Support" },
    ],
    trackedDisplay: "0:45 h",
    exportSummary: { open: 0, exported: 1, reopened: 0, not_billed: 0 },
    timerRunning: false,
    statusName: "Backlog",
    done: false,
  },
  {
    /* Die Karte, die zweimal dasteht: Ihre Tags treffen zwei Regeln. */
    id: "t-2",
    columnIds: ["kunden-nord", "support"],
    title: "Musterkunde Nord — Rechnungslauf prüfen",
    callNumber: "CALL-2026-0417",
    tags: [
      { label: "Musterkunde Nord", path: ["Kunden", "Nord"] },
      { label: "Support" },
    ],
    trackedDisplay: "1:52 h",
    exportSummary: { open: 1, exported: 1, reopened: 0, not_billed: 1 },
    timerRunning: true,
    statusName: "In Progress",
    done: false,
  },
  {
    /* Erledigt und trotzdem in einer Spalte: Das Kennzeichen haengt am Todo,
       die Spalte an seinen Tags. Beide wissen nichts voneinander. */
    id: "t-3",
    columnIds: ["wartet"],
    title: "Beispiel GmbH — Schnittstelle neu aufsetzen",
    callNumber: "CALL-2026-0392",
    tags: [{ label: "Beispiel GmbH", path: ["Kunden", "West"] }, { label: "Wartet" }],
    trackedDisplay: "2:36 h",
    exportSummary: { open: 0, exported: 0, reopened: 1, not_billed: 0 },
    timerRunning: false,
    statusName: "In Progress",
    done: true,
  },
  {
    id: "t-4",
    columnIds: ["intern", "wartet"],
    title: "Rückmeldung zur Testumgebung abwarten",
    callNumber: null,
    tags: [{ label: "Intern" }, { label: "Wartet" }],
    trackedDisplay: "0:07 h",
    exportSummary: { open: 1, exported: 0, reopened: 0, not_billed: 0 },
    timerRunning: false,
    statusName: "Waiting",
    done: false,
  },
  {
    id: "t-5",
    columnIds: ["intern"],
    title: "Betriebshandbuch Kapitel 3 abgeschlossen",
    callNumber: null,
    tags: [{ label: "Intern" }],
    trackedDisplay: "3:15 h",
    exportSummary: { open: 0, exported: 2, reopened: 0, not_billed: 0 },
    timerRunning: false,
    statusName: "Done",
    done: true,
  },
];

/**
 * Tag-Ordner in sieben Ebenen. Der tiefe Zweig ist Absicht: A-4.3 erlaubt
 * beliebige Verschachtelung, A-4.4 verlangt trotzdem Uebersicht.
 */
export const TAG_TREE: readonly TagTreeNode[] = [
  {
    id: "f-kunden",
    label: "Kunden",
    kind: "folder",
    tagCount: 9,
    children: [
      {
        id: "f-kunden-nord",
        label: "Nord",
        kind: "folder",
        tagCount: 4,
        children: [
          {
            id: "f-kunden-nord-vertraege",
            label: "Verträge",
            kind: "folder",
            tagCount: 3,
            children: [
              {
                id: "f-kunden-nord-vertraege-2026",
                label: "Laufzeit 2026",
                kind: "folder",
                tagCount: 2,
                children: [
                  {
                    id: "f-kunden-nord-vertraege-2026-wartung",
                    label: "Wartung",
                    kind: "folder",
                    tagCount: 2,
                    children: [
                      {
                        id: "f-kunden-nord-vertraege-2026-wartung-stufe2",
                        label: "Stufe 2",
                        kind: "folder",
                        tagCount: 1,
                        children: [
                          {
                            id: "t-musterkunde-nord",
                            label: "Musterkunde Nord",
                            kind: "tag",
                            usageCount: 14,
                          },
                        ],
                      },
                      { id: "t-wartung-basis", label: "Wartung Basis", kind: "tag", usageCount: 6 },
                    ],
                  },
                ],
              },
              { id: "t-rahmenvertrag", label: "Rahmenvertrag", kind: "tag", usageCount: 3 },
            ],
          },
          { id: "t-nord-projekte", label: "Projekte Nord", kind: "tag", usageCount: 8 },
        ],
      },
      {
        id: "f-kunden-sued",
        label: "Süd",
        kind: "folder",
        tagCount: 3,
        children: [
          { id: "t-musterwerk", label: "Musterwerk AG", kind: "tag", usageCount: 11 },
          { id: "t-beispiel-sued", label: "Beispiel Süd", kind: "tag", usageCount: 2 },
        ],
      },
      {
        id: "f-kunden-west",
        label: "West",
        kind: "folder",
        tagCount: 2,
        children: [{ id: "t-beispiel-gmbh", label: "Beispiel GmbH", kind: "tag", usageCount: 5 }],
      },
    ],
  },
  {
    id: "f-prioritaet",
    label: "Priorität",
    kind: "folder",
    tagCount: 3,
    children: [
      { id: "t-hoch", label: "Hoch", kind: "tag", usageCount: 4 },
      { id: "t-mittel", label: "Mittel", kind: "tag", usageCount: 12 },
      { id: "t-niedrig", label: "Niedrig", kind: "tag", usageCount: 7 },
    ],
  },
  {
    id: "f-abrechnung",
    label: "Abrechnung",
    kind: "folder",
    tagCount: 2,
    children: [
      { id: "t-intern", label: "Intern", kind: "tag", usageCount: 21 },
      { id: "t-nicht-abgerechnet", label: "Nicht abgerechnet", kind: "tag", usageCount: 19 },
    ],
  },
];

/* ==================================================================== */
/* Tagesgruppen der Exportvorschau — E-020, E-025, E-031, E-034         */
/* ==================================================================== */

/**
 * Beispielgruppen fuer S-07. Eine Gruppe ist ein Todo an einem Kalendertag;
 * maszgeblich ist der Tag des Timerstarts (E-025).
 *
 * Die dritte Gruppe traegt keine Leistung und ist deshalb nicht exportierbar
 * (E-034). Die zweite enthaelt eine zurueckgesetzte Buchung (E-012): Sie ist
 * fachlich offen und gehoert selbstverstaendlich in die Gruppe — "Erneut
 * offen" ist kein dritter Status (E-032).
 */
export const EXPORT_GROUPS: readonly ExportGroupData[] = [
  {
    id: "g-1",
    todoTitle: "Musterkunde Nord — Rechnungslauf prüfen",
    callNumber: "CALL-2026-0417",
    day: "Montag, 31.08.2026",
    entries: [
      {
        id: "g1-e1",
        period: "09:12–09:22 Uhr",
        duration: "0:10 h",
        source: "timer",
        note: "Fehleranalyse im Rechnungslauf",
        exportCount: 0,
      },
      {
        id: "g1-e2",
        period: "11:05–11:25 Uhr",
        duration: "0:20 h",
        source: "timer",
        note: "Zuordnung der Positionen korrigiert",
        exportCount: 0,
      },
      {
        id: "g1-e3",
        period: "15:40–15:45 Uhr",
        duration: "0:05 h",
        source: "manual",
        note: "Rückfrage zur Buchungsperiode telefonisch geklärt",
        exportCount: 0,
      },
    ],
  },
  {
    id: "g-2",
    todoTitle: "Beispiel GmbH — Schnittstelle neu aufsetzen",
    callNumber: "CALL-2026-0392",
    day: "Sonntag, 30.08.2026",
    entries: [
      {
        id: "g2-e1",
        period: "08:30–10:20 Uhr",
        duration: "1:50 h",
        source: "timer",
        note: "Schnittstelle neu aufgesetzt, Übertragung mit Testdaten geprüft",
        exportCount: 1,
      },
      {
        id: "g2-e2",
        period: "14:00–14:46 Uhr",
        duration: "0:46 h",
        source: "manual",
        note: "Fehlerbild dokumentiert und an den Hersteller gemeldet",
        exportCount: 0,
      },
    ],
  },
  {
    id: "g-3",
    todoTitle: "Interne Abstimmung Betriebshandbuch",
    callNumber: null,
    day: "Samstag, 29.08.2026",
    entries: [
      {
        id: "g3-e1",
        period: "13:00–13:07 Uhr",
        duration: "0:07 h",
        source: "manual",
        note: "",
        exportCount: 0,
      },
    ],
  },
];

export interface ExportGroupOutcome {
  /** Gerundete Exportzeit als Text, zum Beispiel "0,75". */
  readonly quarters: string;
  /** Zusammengefuehrte Leistung nach E-026 und E-028. */
  readonly mergedNote: string;
  /** Grund einer Sperre nach E-034, sonst `null`. */
  readonly blockedReason: string | null;
}

const NOTHING_SELECTED =
  "Alle Buchungen dieser Tagesgruppe sind ausgeschlossen; es bleibt nichts zu exportieren.";
const NO_SERVICE_TEXT =
  "Keine der enthaltenen Buchungen trägt eine Leistung, und das Abrechnungstool nimmt eine leere Notiz nicht an.";

/**
 * Ergebnis je Tagesgruppe und je Auswahl ihrer Buchungen — **Beispieldaten,
 * keine Rechnung.**
 *
 * Die Musterseite rundet nicht und fuehrt keine Texte zusammen; beides gehoert
 * nach `packages/domain` (E-008, E-020, E-026, E-028). Damit sich die Wirkung
 * eines Ausschlusses trotzdem vorfuehren laesst, steht hier zu jeder moeglichen
 * Auswahl das fertige Ergebnis. Die Werte folgen der bestaetigten Regel:
 * addieren, dann aufwaerts auf die naechste Viertelstunde, mindestens 0,25.
 *
 * Der Schluessel ist die Gruppenkennung, ein Doppelpunkt und die Kennungen der
 * enthaltenen Buchungen in ihrer Reihenfolge, verbunden mit "+".
 */
const EXPORT_GROUP_OUTCOMES: Readonly<Record<string, ExportGroupOutcome>> = {
  // 10 + 20 + 5 = 35 Minuten -> 0,75
  "g-1:g1-e1+g1-e2+g1-e3": {
    quarters: "0,75",
    mergedNote:
      "Fehleranalyse im Rechnungslauf; Zuordnung der Positionen korrigiert; Rückfrage zur Buchungsperiode telefonisch geklärt",
    blockedReason: null,
  },
  // 10 + 20 = 30 Minuten -> 0,50
  "g-1:g1-e1+g1-e2": {
    quarters: "0,50",
    mergedNote: "Fehleranalyse im Rechnungslauf; Zuordnung der Positionen korrigiert",
    blockedReason: null,
  },
  // 10 + 5 = 15 Minuten -> 0,25. Der Fall aus E-031: die mittlere Buchung
  // faellt heraus, und aus 0,75 wird 0,25.
  "g-1:g1-e1+g1-e3": {
    quarters: "0,25",
    mergedNote:
      "Fehleranalyse im Rechnungslauf; Rückfrage zur Buchungsperiode telefonisch geklärt",
    blockedReason: null,
  },
  // 20 + 5 = 25 Minuten -> 0,50
  "g-1:g1-e2+g1-e3": {
    quarters: "0,50",
    mergedNote:
      "Zuordnung der Positionen korrigiert; Rückfrage zur Buchungsperiode telefonisch geklärt",
    blockedReason: null,
  },
  // 10 Minuten -> 0,25
  "g-1:g1-e1": {
    quarters: "0,25",
    mergedNote: "Fehleranalyse im Rechnungslauf",
    blockedReason: null,
  },
  // 20 Minuten -> 0,50
  "g-1:g1-e2": {
    quarters: "0,50",
    mergedNote: "Zuordnung der Positionen korrigiert",
    blockedReason: null,
  },
  // 5 Minuten -> 0,25 (Mindestwert nach E-008)
  "g-1:g1-e3": {
    quarters: "0,25",
    mergedNote: "Rückfrage zur Buchungsperiode telefonisch geklärt",
    blockedReason: null,
  },
  "g-1:": { quarters: "0,00", mergedNote: "", blockedReason: NOTHING_SELECTED },

  // 110 + 46 = 156 Minuten -> 2,75
  "g-2:g2-e1+g2-e2": {
    quarters: "2,75",
    mergedNote:
      "Schnittstelle neu aufgesetzt, Übertragung mit Testdaten geprüft; Fehlerbild dokumentiert und an den Hersteller gemeldet",
    blockedReason: null,
  },
  // 110 Minuten -> 2,00
  "g-2:g2-e1": {
    quarters: "2,00",
    mergedNote: "Schnittstelle neu aufgesetzt, Übertragung mit Testdaten geprüft",
    blockedReason: null,
  },
  // 46 Minuten -> 1,00
  "g-2:g2-e2": {
    quarters: "1,00",
    mergedNote: "Fehlerbild dokumentiert und an den Hersteller gemeldet",
    blockedReason: null,
  },
  "g-2:": { quarters: "0,00", mergedNote: "", blockedReason: NOTHING_SELECTED },

  // 7 Minuten -> 0,25, aber ohne Leistung und damit gesperrt (E-034)
  "g-3:g3-e1": { quarters: "0,25", mergedNote: "", blockedReason: NO_SERVICE_TEXT },
  "g-3:": { quarters: "0,00", mergedNote: "", blockedReason: NOTHING_SELECTED },
};

/**
 * Schlaegt das hinterlegte Ergebnis zu einer Auswahl nach. Reines Nachschlagen,
 * keine Berechnung — siehe `EXPORT_GROUP_OUTCOMES`.
 */
export function exportGroupOutcome(
  groupId: string,
  includedEntryIds: readonly string[],
): ExportGroupOutcome {
  const key = `${groupId}:${includedEntryIds.join("+")}`;
  const outcome = EXPORT_GROUP_OUTCOMES[key];
  if (outcome === undefined) {
    throw new Error(`Kein hinterlegtes Beispielergebnis für die Auswahl ${key}.`);
  }
  return outcome;
}

/* ==================================================================== */
/* Exportprotokoll (S-07, Bereich „Protokoll") — R-10, Befund C-01      */
/* ==================================================================== */

/**
 * Drei Vorgaenge an **derselben** Buchung, in der Reihenfolge, in der man sie
 * sieht: exportiert, zurueckgesetzt, erneut exportiert.
 *
 * Genau diese Folge ist der Fall aus R-10 — dieselbe Arbeitszeit geht ein
 * zweites Mal in die Abrechnung. Das Beispiel zeigt sie absichtlich, weil die
 * Ansicht nur dann etwas taugt, wenn ein Mensch sie hier auf Anhieb erkennt.
 */
export const AUDIT_ROWS: readonly ExportAuditRowModel[] = [
  {
    id: "a-3",
    event: "exported",
    occurredAt: "09.09.2026, 08:12",
    occurredAtIso: "2026-09-09T08:12:00+02:00",
    transition: "Offen → Exportiert",
    timeEntryId: "t-1",
    booking: {
      todoId: "todo-1",
      todoTitle: "Schnittstelle Warenwirtschaft",
      callNumber: "C-10428",
      period: "03.09.2026, 09:12–10:35",
      duration: "1:23 h",
    },
    run: {
      id: "r-2",
      filePath: "C:\\Takt\\Export\\takt-export-2026-09-09-0812.json",
      fileName: "takt-export-2026-09-09-0812.json",
      writtenAt: "09.09.2026, 08:12",
    },
    reason: "",
    actor: "m.hoffmann",
  },
  {
    id: "a-2",
    event: "reset",
    occurredAt: "07.09.2026, 16:40",
    occurredAtIso: "2026-09-07T16:40:00+02:00",
    transition: "Exportiert → Offen",
    timeEntryId: "t-1",
    booking: {
      todoId: "todo-1",
      todoTitle: "Schnittstelle Warenwirtschaft",
      callNumber: "C-10428",
      period: "03.09.2026, 09:12–10:35",
      duration: "1:23 h",
    },
    run: null,
    reason: "Falscher Call in der Abrechnung. Zeile wird mit korrigierter Call-Nummer neu geschrieben.",
    actor: "m.hoffmann",
  },
  {
    id: "a-1",
    event: "not_billed",
    occurredAt: "05.09.2026, 11:02",
    occurredAtIso: "2026-09-05T11:02:00+02:00",
    transition: "Offen → Exportiert",
    timeEntryId: "t-2",
    booking: {
      todoId: "todo-2",
      todoTitle: "Rückfrage Lizenzmodell",
      callNumber: null,
      period: "05.09.2026, 10:48–11:01",
      duration: "0:13 h",
    },
    run: null,
    reason: "",
    actor: "m.hoffmann",
  },
];
