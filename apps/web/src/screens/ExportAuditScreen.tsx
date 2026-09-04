import { useCallback, useMemo, useState } from "react";
import { ExportAuditList } from "../components/ExportAudit";
import { FilterBar, type ActiveFilter } from "../components/FilterBar";
import { Select } from "../components/Select";
import { Icon } from "../components/Icon";
import { Button, Card, EmptyState } from "../components/Primitives";
import {
  AUDIT_EVENT_DESCRIPTION,
  auditEventLabel,
  loadExportAuditPage,
  AUDIT_PAGE_SIZE,
  type ExportAuditRowModel,
} from "../app/exportAudit";
import { useRefresh } from "../app/RefreshContext";
import { navigate } from "../app/router";
import { useAsync } from "../app/useAsync";
import type { ExportAuditEvent } from "../lib/labels";
import { formatCount, plural } from "../lib/format";
import { AsyncBoundary, ExportTabs, RefreshHint, ScreenHeader, StatTile } from "./parts";

/**
 * Takt — S-07, Bereich „Protokoll" (R-10, E-012, E-047, Befund C-01).
 *
 * ## Warum es diesen Ort gibt
 *
 * R-10 nennt die Doppelabrechnung: Wird eine Buchung zurückgesetzt (E-012) und
 * danach erneut exportiert, geht dieselbe Arbeitszeit ein zweites Mal in die
 * Abrechnung. Die Maßnahme dagegen ist kein Verbot — Zurücksetzen muss möglich
 * bleiben —, sondern ein unveränderliches Protokoll, in dem das auffindbar
 * bleibt.
 *
 * Der Dienst schreibt es seit Anfang an. `GET /export/audit` war gebaut,
 * geprüft und hatte bis T-040 **keinen einzigen Aufrufer** in der Oberfläche.
 * Damit war die ganze Sorgfalt daran — der eigene Ereignistyp für „nicht
 * abrechnen" (E-047), die Herkunft ohne Exportlauf, der Trigger, der keinen
 * Exportstatus ohne Herkunft zulässt — für einen Benutzer unsichtbar. Ein
 * Protokoll, das niemand ansehen kann, hält nichts nach.
 *
 * ## Warum der Ereignisfilter kein Statusfilter ist
 *
 * Gefiltert wird über den **Ereignistyp** des Protokolls — exportiert,
 * zurückgesetzt, nicht abgerechnet —, nicht über den Exportstatus einer
 * Buchung. Der Status hat weiterhin genau zwei Werte (E-032), und kein Filter
 * dieser Ansicht hält je eine Buchung aus dem Export: Hier wird gelesen, nicht
 * ausgewählt.
 *
 * Der Filter wirkt über die **geladenen** Zeilen, weil die Route ihn nicht
 * kennt. Das steht in der Ansicht, statt es zu verschweigen — sonst hielte
 * jemand eine kurze Liste für eine vollständige Antwort, und das ist beim
 * Protokoll der teuerste aller Irrtümer.
 */

/** Der Filter über den Lauf: „alle" oder eine Laufkennung aus den Zeilen. */
const ALL = "";

export interface ExportAuditScreenProps {
  /** `?lauf=<Kennung>` — von einem Lauf in S-07 hierher verwiesen. */
  readonly query: Readonly<Record<string, string>>;
}

export function ExportAuditScreen({ query }: ExportAuditScreenProps) {
  const { version } = useRefresh();
  const [event, setEvent] = useState<ExportAuditEvent | "">(ALL);
  const [runId, setRunId] = useState<string>(query["lauf"] ?? ALL);
  const [limit, setLimit] = useState(AUDIT_PAGE_SIZE);

  const loadMore = useCallback(() => setLimit((current) => current + AUDIT_PAGE_SIZE), []);

  const data = useAsync(() => loadExportAuditPage({ limit }), [limit], [version]);

  const rows = data.state.status === "ready" ? data.state.value.rows : [];

  const runs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      if (row.run !== null && row.run.filePath.length > 0 && !seen.has(row.run.id)) {
        seen.set(row.run.id, `${row.run.fileName} · ${row.run.writtenAt}`);
      }
    }
    return [...seen].map(([value, label]) => ({ value, label }));
  }, [rows]);

  const visible = useMemo<readonly ExportAuditRowModel[]>(
    () =>
      rows.filter(
        (row) =>
          (event === ALL || row.event === event) &&
          (runId === ALL || row.run?.id === runId),
      ),
    [rows, event, runId],
  );

  const activeFilters = useMemo<readonly ActiveFilter[]>(() => {
    const entries: ActiveFilter[] = [];
    if (event !== ALL) {
      entries.push({
        id: "vorgang",
        field: "Vorgang",
        value: auditEventLabel(event),
        onRemove: () => setEvent(ALL),
      });
    }
    if (runId !== ALL) {
      entries.push({
        id: "lauf",
        field: "Lauf",
        // Der Lauf kann aus der Adresse kommen und noch außerhalb der
        // geladenen Zeilen liegen. Dann steht das da, statt „unbekannt" —
        // der Unterschied ist, ob man weiterladen soll oder nicht.
        value: runs.find((run) => run.value === runId)?.label ?? "noch nicht geladen",
        onRemove: () => setRunId(ALL),
      });
    }
    return entries;
  }, [event, runId, runs]);

  const resetAll = useCallback(() => {
    setEvent(ALL);
    setRunId(ALL);
  }, []);

  return (
    <section className="screen">
      <ScreenHeader
        title="Exportprotokoll"
        lead="Jeder Wechsel eines Exportstatus, mit Zeitpunkt, Buchung, Vorgang und Lauf. Anhängend und unveränderlich."
        actions={
          <Button variant="secondary" iconStart="download" onClick={() => navigate("export")}>
            Zur Export-Ansicht
          </Button>
        }
      >
        <ExportTabs active="exportAudit" />
        <FilterBar
          label="Protokoll filtern"
          resultLabel={
            data.state.status === "ready"
              ? activeFilters.length === 0
                ? `${plural(rows.length, "Vorgang geladen", "Vorgänge geladen")} von ${formatCount(data.state.value.total)}`
                : `${plural(visible.length, "Vorgang", "Vorgänge")} von ${formatCount(rows.length)} geladenen`
              : "wird geladen …"
          }
          activeFilters={activeFilters}
          onResetAll={resetAll}
          controls={
            <>
              <Select
                label="Vorgang"
                value={event}
                onChange={(next) => setEvent(next as ExportAuditEvent | "")}
                options={[
                  { value: ALL, label: "Alle Vorgänge" },
                  ...(["exported", "reset", "not_billed"] as const).map((value) => ({
                    value,
                    label: auditEventLabel(value),
                  })),
                ]}
              />
              <Select
                label="Exportlauf"
                value={runId}
                onChange={setRunId}
                disabled={runs.length === 0}
                options={[{ value: ALL, label: "Alle Läufe" }, ...runs]}
              />
            </>
          }
        />
      </ScreenHeader>

      <Card
        title="Wozu dieses Protokoll da ist"
        description="Es ist die Maßnahme gegen R-10 — nicht das Verbot des Zurücksetzens, sondern seine Nachvollziehbarkeit."
      >
        <dl className="auditlegend">
          {(["exported", "reset", "not_billed"] as const).map((value) => (
            <div className="auditlegend__item" key={value}>
              <dt className="auditlegend__term">{auditEventLabel(value)}</dt>
              <dd className="auditlegend__text">{AUDIT_EVENT_DESCRIPTION[value]}</dd>
            </div>
          ))}
        </dl>
        <p className="auditlegend__note">
          Eine Zeile lässt sich weder ändern noch löschen — es gibt dafür keine Route, und die
          Speicherung verbietet beides zusätzlich. Wer eine Buchung zurücksetzt und erneut
          exportiert, findet beides hier nebeneinander.
        </p>
      </Card>

      <AsyncBoundary
        state={data.state}
        label="Das Exportprotokoll wird geladen"
        rows={6}
        onRetry={data.reload}
      >
        {(value, refreshing) => {
          if (value.rows.length === 0) {
            return (
              <EmptyState
                icon="clock"
                title="Noch kein Vorgang protokolliert"
                description="Sobald der erste Export läuft, eine Buchung zurückgesetzt oder eine Zeit als „nicht abgerechnet“ abgehakt wird, steht es hier — mit Zeitpunkt, Buchung und Lauf."
                action={
                  <Button variant="secondary" iconStart="download" onClick={() => navigate("export")}>
                    Zur Export-Ansicht
                  </Button>
                }
              />
            );
          }

          if (visible.length === 0) {
            return (
              <EmptyState
                icon="search"
                title="Kein Vorgang passt zu diesen Filtern"
                description="Der Filter wirkt über die geladenen Zeilen. Laden Sie weitere, wenn Sie einen älteren Vorgang suchen — oder setzen Sie den Filter zurück."
                action={
                  <>
                    {value.nextCursor === null ? null : (
                      <Button variant="primary" iconStart="arrow-down" onClick={loadMore}>
                        Weitere laden
                      </Button>
                    )}
                    <Button variant="secondary" iconStart="rotate-ccw" onClick={resetAll}>
                      Filter zurücksetzen
                    </Button>
                  </>
                }
              />
            );
          }

          const counts = countByEvent(value.rows);
          /*
            Befund C-25: Eine Kachel mit einer Zahl liest sich als Gesamtzahl,
            besonders in einem Protokoll. Diese drei zaehlen ueber die
            **geladenen** Zeilen, weil die Route keine Zaehlung je Ereignis
            liefert — das stand bis T-045 nur in der Zeile ueber dem Filter und
            nicht an der Zahl selbst. Jetzt sagt jede Kachel ihren Umfang; sind
            alle Vorgaenge geladen, sagt sie auch das.
          */
          const complete = value.rows.length >= value.total;
          const scope = complete
            ? value.total === 1
              ? "Gezählt über den einen Vorgang."
              : `Gezählt über alle ${formatCount(value.total)} Vorgänge.`
            : `Gezählt über ${formatCount(value.rows.length)} von ${formatCount(value.total)} Vorgängen — ohne die noch nicht geladenen.`;

          return (
            <>
              <div className="stat-grid stat-grid--tight">
                <StatTile
                  label={auditEventLabel("exported")}
                  value={formatCount(counts.exported)}
                  detail={`In eine Datei geschrieben. ${scope}`}
                />
                <StatTile
                  label={auditEventLabel("reset")}
                  value={formatCount(counts.reset)}
                  tone="warning"
                  detail={`Danach geht dieselbe Zeit erneut in die Abrechnung. ${scope}`}
                />
                <StatTile
                  label={auditEventLabel("not_billed")}
                  value={formatCount(counts.not_billed)}
                  detail={`Nie exportiert, bewusst nicht abgerechnet. ${scope}`}
                />
              </div>

              {/*
                Der zweite Umfang, der ebenso leicht ueberlesen wird: Die
                Kacheln zaehlen ueber alle geladenen Zeilen und nicht ueber den
                gesetzten Filter. Sonst zeigte die Kachel eines nicht
                gewaehlten Vorgangs eine Zahl, die in der Liste darunter
                nirgends vorkommt.
              */}
              {complete && activeFilters.length === 0 ? null : (
                <p className="auditcount__scope">
                  <Icon name="info" size={14} />
                  <span>
                    {complete
                      ? "Die Kacheln zählen über alle geladenen Vorgänge und nicht über den gesetzten Filter."
                      : activeFilters.length === 0
                        ? "Ältere Vorgänge sind noch nicht geladen. „Weitere laden“ am Ende der Liste erhöht beide Zahlen."
                        : "Die Kacheln zählen über alle geladenen Vorgänge und nicht über den gesetzten Filter. Ältere sind zudem noch nicht geladen."}
                  </span>
                </p>
              )}

              <RefreshHint active={refreshing} />

              <ExportAuditList models={visible} onOpenTodo={(todoId) => navigate("todo", todoId)} />

              {value.nextCursor === null ? (
                <p className="auditlist__end muted">
                  Das ist der Anfang des Protokolls — ältere Vorgänge gibt es nicht.
                </p>
              ) : (
                <div className="list-more">
                  <Button variant="secondary" loading={refreshing} onClick={loadMore}>
                    Weitere laden ({formatCount(Math.max(0, value.total - value.rows.length))} übrig)
                  </Button>
                </div>
              )}
            </>
          );
        }}
      </AsyncBoundary>
    </section>
  );
}

/**
 * Wie oft welcher Vorgang unter den **geladenen** Zeilen vorkommt.
 *
 * Ausdrücklich keine Gesamtauswertung: Die Route liefert keine Zählung je
 * Ereignis, und eine hochgerechnete Zahl wäre in einem Protokoll das Gegenteil
 * dessen, wofür es da ist.
 *
 * Bis T-045 stand dieser Vorbehalt nur hier und in der Zeile über dem Filter.
 * Das genügte nicht (Befund C-25): Eine Kachel mit einer Zahl liest sich als
 * Gesamtzahl, gleich was darüber steht. Jetzt nennt jede Kachel ihren Umfang
 * im Detailtext, und darunter steht, dass der Filter auf sie nicht wirkt.
 * Eine Zahl, die wie eine Auswertung aussieht und eine Teilmenge meint, ist
 * dieselbe Art Falschaussage wie eine Null, die „nicht gefragt" bedeutet.
 */
function countByEvent(
  rows: readonly ExportAuditRowModel[],
): Readonly<Record<ExportAuditEvent, number>> {
  const counts: Record<ExportAuditEvent, number> = { exported: 0, reset: 0, not_billed: 0 };
  for (const row of rows) counts[row.event] += 1;
  return counts;
}
