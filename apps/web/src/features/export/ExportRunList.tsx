import { navigate } from "../../app/router";
import { Button, Card, EmptyState } from "../../shared/ui/Primitives";
import {
  formatBytes,
  formatDateTime,
  formatQuarters,
  plural,
} from "../../lib/format";
import type { ExportRun } from "./api";
import { exportTexts } from "./texts";

/**
 * Takt — die letzten Exportläufe in S-07: was wann geschrieben wurde.
 *
 * Der Block stand bis T-254 am Fuß von `ExportScreen.tsx` und ist der
 * einzige Teil dieser Ansicht, der nicht vom **bevorstehenden** Lauf handelt.
 * Er nimmt genau einen Wert entgegen und ruft keine Route an.
 */

export interface ExportRunListProps {
  /** Die zuletzt geladenen Läufe, neueste zuerst. Fünf, nicht alle. */
  readonly runs: readonly ExportRun[];
}

export function ExportRunList({ runs }: ExportRunListProps) {
  const text = exportTexts();
  return (
    <Card
      title={text.recentRuns}
      description={text.recentRunsLead}
      actions={
        <Button
          size="sm"
          variant="secondary"
          iconStart="clock"
          onClick={() => navigate("exportAudit")}
        >
          {text.openLog}
        </Button>
      }
      flush
    >
      {runs.length === 0 ? (
        <EmptyState
          compact
          icon="download"
          title={text.noExportTitle}
          description={text.noExportBody}
        />
      ) : (
        <ul className="run-list">
          {runs.map((run) => (
            <li key={run.id} className="run-row">
              <span className="run-row__date">{formatDateTime(run.createdAt)}</span>
              <span className="run-row__path mono truncate" title={run.filePath}>
                {run.filePath}
              </span>
              <span className="run-row__meta">
                {plural(run.entryCount, text.booking, text.bookings)} ·{" "}
                {formatQuarters(run.totalQuarters)} h · {formatBytes(run.bytes)}
              </span>
              {/*
                Welche Buchungen in diesem Lauf waren, liefert
                `GET /export/runs/{id}` nicht mit (nachgemessen: die
                Antwort trägt keine Gruppen). Die Auskunft steht
                stattdessen im Protokoll, wo jede Zeile ihren Lauf
                nennt — dieselbe Frage, beantwortet aus der Quelle,
                die sie tatsächlich beantworten kann (R-10).
              */}
              {/*
                C-26: Der Filter im Protokoll wirkt heute über die
                geladenen Zeilen, nicht über die Route. Ein Lauf mit
                mehr Buchungen, als eine Seite fasst, schiebt jeden
                älteren von der ersten Seite — der Knopf landet dann
                auf einem Leerzustand. Bis `GET /export/audit` den
                Lauf als Abfrageparameter kennt, sagt der Knopf, was
                er leisten kann; die Ansicht dahinter sagt es
                ebenfalls und bietet „Weitere laden" an.
              */}
              <Button
                size="sm"
                variant="ghost"
                iconStart="arrow-up-right"
                title={text.runFilterHint}
                onClick={() => navigate("exportAudit", undefined, { lauf: run.id })}
              >
                {text.runBookings}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
