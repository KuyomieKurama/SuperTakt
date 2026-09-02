import { useCallback, useMemo, useState } from "react";
import {
  BookingTable,
  TableShell,
  type BookingRowData,
  type SortColumn,
  type SortDirection,
} from "../components/BookingTable";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EXPORT_STATUS_LABEL, type ExportStatus } from "../components/ExportStatus";
import { FilterBar, SearchField, type ActiveFilter } from "../components/FilterBar";
import { Select } from "../components/Select";
import { ContextMenu, type ContextMenuState, type MenuEntry } from "../components/Menu";
import {
  Button,
  Card,
  EmptyState,
  InlineMessage,
  LoadingBlock,
} from "../components/Primitives";
import { BOOKING_ROWS } from "./data";
import { Section } from "./Section";

type ViewState = "ready" | "loading" | "empty" | "error";

/**
 * Der Filter kennt genau zwei Werte plus "alle" — E-032, A-6.9.
 *
 * "Erneut offen" steht hier bewusst **nicht**. Es ist kein dritter Status,
 * sondern die Anzeige einer offenen Buchung, die schon einmal exportiert war.
 * Waere es hier eine eigene Zeile, fiele eine zurueckgesetzte Buchung unter
 * "Nur offen" heraus und damit aus dem naechsten Export — R-10 stuende auf dem
 * Kopf.
 */
const STATUS_OPTIONS: ReadonlyArray<{
  readonly value: "all" | ExportStatus;
  readonly label: string;
}> = [
  { value: "all", label: "Alle Exportstände" },
  { value: "open", label: `Nur ${EXPORT_STATUS_LABEL.open.toLocaleLowerCase("de-DE")}` },
  { value: "exported", label: `Nur ${EXPORT_STATUS_LABEL.exported.toLocaleLowerCase("de-DE")}` },
];

const VIEW_OPTIONS: ReadonlyArray<{ readonly value: ViewState; readonly label: string }> = [
  { value: "ready", label: "Daten vorhanden" },
  { value: "loading", label: "lädt" },
  { value: "empty", label: "leer" },
  { value: "error", label: "Fehler" },
];

export function DataSection() {
  const [view, setView] = useState<ViewState>("ready");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ExportStatus>("all");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: "period",
    direction: "descending",
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [resetTarget, setResetTarget] = useState<BookingRowData | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de-DE");
    const filtered = BOOKING_ROWS.filter((row) => {
      // Gefiltert wird auf den zweiwertigen Status, nie auf den
      // Anzeigezustand: "Nur offen" liefert deshalb auch die zurueckgesetzte
      // Buchung mit (E-032).
      const matchesStatus = status === "all" || row.exportStatus === status;
      const haystack = `${row.todoTitle} ${row.note} ${row.callNumber ?? ""}`.toLocaleLowerCase(
        "de-DE",
      );
      return matchesStatus && (needle === "" || haystack.includes(needle));
    });
    // Nur zur Vorführung: die tatsächliche Sortierung liefert der lokale
    // Dienst, weil dafür die unformatierten Werte gebraucht werden.
    return sort.direction === "descending" ? filtered : [...filtered].reverse();
  }, [query, status, sort.direction]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((previous) =>
      previous.size === rows.length ? new Set() : new Set(rows.map((row) => row.id)),
    );
  }, [rows]);

  const onSort = useCallback((column: SortColumn) => {
    setSort((previous) =>
      previous.column === column
        ? {
            column,
            direction: previous.direction === "ascending" ? "descending" : "ascending",
          }
        : { column, direction: "ascending" },
    );
  }, []);

  const rowMenu = useCallback(
    (row: BookingRowData): readonly MenuEntry[] => {
      const locked = row.exportStatus === "exported";
      return [
        {
          id: "edit",
          label: "Buchung bearbeiten",
          icon: "pencil",
          disabled: locked,
          ...(locked
            ? { disabledReason: "Gesperrt, weil bereits exportiert (A-6.9)" }
            : {}),
          onSelect: () => setLastAction(`Bearbeiten geöffnet: ${row.todoTitle}`),
        },
        {
          id: "mark",
          label: "Als exportiert markieren",
          icon: "check",
          disabled: locked,
          ...(locked ? { disabledReason: "Bereits exportiert" } : {}),
          onSelect: () => setLastAction(`Als exportiert markiert: ${row.todoTitle}`),
        },
        { kind: "separator", id: "sep-1" },
        {
          id: "reset",
          label: "Exportstatus zurücksetzen",
          icon: "rotate-ccw",
          tone: "danger",
          disabled: row.exportStatus === "open",
          ...(row.exportStatus === "open" ? { disabledReason: "Buchung ist noch offen" } : {}),
          onSelect: () => setResetTarget(row),
        },
        {
          id: "delete",
          label: "Buchung löschen",
          icon: "trash",
          tone: "danger",
          disabled: locked,
          ...(locked ? { disabledReason: "Gesperrt, weil bereits exportiert" } : {}),
          onSelect: () => setLastAction(`Löschen angefragt: ${row.todoTitle}`),
        },
      ];
    },
    [],
  );

  const activeFilters: readonly ActiveFilter[] = [
    ...(query.trim() === ""
      ? []
      : [
          {
            id: "query",
            field: "Suche",
            value: query.trim(),
            onRemove: () => setQuery(""),
          },
        ]),
    ...(status === "all"
      ? []
      : [
          {
            id: "status",
            field: "Exportstand",
            value: STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status,
            onRemove: () => setStatus("all"),
          },
        ]),
  ];

  return (
    <Section
      id="tabelle"
      title="3 — Suche, Filter, Tabelle"
      lead="Die Übersicht aller Zeitbuchungen ist der dichteste Screen des Produkts. Sie trägt den Exportstatus dreifach: als Randmarkierung der Zeile, als Zustandspunkt und als Etikett. Rechtsklick oder Umschalt+F10 öffnen das Kontextmenü."
      refs={["S-06", "S-07", "A-6.6", "A-8.6", "A-13.7", "I-09", "I-10"]}
    >
      <div className="demo-row">
        <span className="demo-label">Zustand der Ansicht</span>
        <div className="segmented" role="group" aria-label="Zustand der Tabellenansicht">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="segmented__option"
              aria-pressed={view === option.value}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <FilterBar
        label="Buchungen filtern"
        controls={
          <>
            <SearchField
              value={query}
              onChange={setQuery}
              label="Buchungen durchsuchen"
              placeholder="Titel, Call-Nummer, Vermerk oder Leistung …"
              hint="Escape leert das Suchfeld."
            />
            <Select
              label="Exportstand"
              value={status}
              onChange={setStatus}
              options={[...STATUS_OPTIONS]}
            />
            <Select
              label="Zeitraum"
              value="week"
              onChange={() => undefined}
              options={[
                { value: "week", label: "Diese Woche" },
                { value: "month", label: "Dieser Monat" },
                { value: "all", label: "Alles" },
              ]}
            />
          </>
        }
        activeFilters={activeFilters}
        onResetAll={() => {
          setQuery("");
          setStatus("all");
        }}
        resultLabel={`${rows.length} von ${BOOKING_ROWS.length} Buchungen`}
      />

      {status === "open" ? (
        <InlineMessage tone="info" title="„Erneut offen“ steht bewusst nicht im Filter">
          Der Exportstatus hat genau zwei Werte (A-6.9, E-032). Eine zurückgesetzte Buchung ist
          danach wieder <strong>offen</strong> — sie steht deshalb in diesem Ergebnis, obwohl ihr
          Etikett „Erneut offen“ lautet. Das Etikett hängt an einem eigenen Merkmal, nämlich
          daran, wie oft die Buchung schon in einem Exportlauf war, und nicht am Status. Gäbe es
          hier eine dritte Filterzeile, fiele genau diese Buchung aus dem nächsten Export.
        </InlineMessage>
      ) : null}

      {lastAction !== null ? (
        <InlineMessage tone="success" title="Aktion ausgeführt" onDismiss={() => setLastAction(null)}>
          {lastAction}
        </InlineMessage>
      ) : null}

      <TableShell>
        {view === "loading" ? (
          <LoadingBlock label="Buchungen werden geladen" rows={4} />
        ) : view === "empty" ? (
          <EmptyState
            icon="clock"
            title="Noch keine Zeitbuchung erfasst"
            description="Starten Sie den Timer auf einem Todo, oder legen Sie eine Buchung von Hand an."
            action={
              <Button variant="primary" iconStart="plus">
                Buchung anlegen
              </Button>
            }
          />
        ) : view === "error" ? (
          <div style={{ padding: "var(--space-4)" }}>
            <InlineMessage
              tone="danger"
              title="Buchungen konnten nicht geladen werden"
              action={
                <>
                  <Button variant="secondary" size="sm" iconStart="rotate-ccw">
                    Erneut versuchen
                  </Button>
                  <Button variant="ghost" size="sm">
                    Details anzeigen
                  </Button>
                </>
              }
            >
              Der lokale Dienst antwortet nicht. Prüfen Sie, ob Takt vollständig gestartet ist.
              Ihre Daten sind nicht verloren — sie liegen unverändert in der lokalen Datei.
            </InlineMessage>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="search"
            title="Keine Buchung passt zu den Filtern"
            description="Ändern Sie den Suchbegriff oder entfernen Sie einen Filter."
            compact
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Alle Filter zurücksetzen
              </Button>
            }
          />
        ) : (
          <BookingTable
            caption="Zeitbuchungen mit Exportstand, Call-Nummer, Zeitraum, Dauer und Leistung"
            rows={rows}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            sort={sort}
            onSort={onSort}
            rowMenu={rowMenu}
            onOpenContextMenu={(row, x, y) =>
              setContextMenu({
                x,
                y,
                label: `Kontextmenü für ${row.todoTitle}`,
                entries: rowMenu(row),
              })
            }
          />
        )}
      </TableShell>

      {selectedIds.size > 0 ? (
        <Card
          title={`${selectedIds.size} Buchungen ausgewählt`}
          description="Sammelaktionen wirken auf alle ausgewählten Buchungen."
          actions={
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Auswahl aufheben
            </Button>
          }
        >
          <div className="demo-row">
            <Button variant="primary" iconStart="download">
              Auswahl exportieren
            </Button>
            <Button variant="secondary" iconStart="check">
              Als exportiert markieren
            </Button>
          </div>
        </Card>
      ) : null}

      <ContextMenu state={contextMenu} onClose={() => setContextMenu(null)} />

      <ConfirmDialog
        open={resetTarget !== null}
        tone="danger"
        title="Exportstatus zurücksetzen?"
        description={
          <>
            Die Buchung <strong>{resetTarget?.todoTitle ?? ""}</strong> vom{" "}
            {resetTarget?.period ?? ""} wird wieder als offen geführt.
          </>
        }
        consequence="Diese Zeit war bereits in einer Abrechnung. Beim nächsten Export geht sie erneut an das Abrechnungstool — die Leistung kann dadurch zweimal berechnet werden."
        acknowledgeLabel="Ich weiß, dass diese Zeit dadurch ein zweites Mal abgerechnet werden kann."
        reasonLabel="Begründung — wird protokolliert"
        reasonRequired
        confirmLabel="Zurücksetzen"
        onCancel={() => setResetTarget(null)}
        onConfirm={(reason) => {
          setLastAction(
            `Exportstatus zurückgesetzt: ${resetTarget?.todoTitle ?? ""}. Die Buchung ist jetzt „Erneut offen“. Begründung protokolliert: „${reason}“.`,
          );
          setResetTarget(null);
        }}
      />
    </Section>
  );
}
