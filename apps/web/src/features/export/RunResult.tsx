import { navigate } from "../../app/router";
import type { SkippedExportGroup } from "../../api/types";
import { Button, Card, InlineMessage } from "../../shared/ui/Primitives";
import {
  formatBytes,
  formatDayLabel,
  formatDuration,
  formatQuarters,
  plural,
} from "../../lib/format";
import type { ExportRunResult } from "./api";
import { exportTexts } from "./texts";

/**
 * Takt — Ergebnis eines Laufs, einschließlich der ausgelassenen Gruppen
 * (A-8.1, A-8.8, E-034).
 */

export function RunResult({
  result,
  rowCount,
  onDismiss,
}: {
  readonly result: ExportRunResult;
  readonly rowCount: number;
  readonly onDismiss: () => void;
}) {
  const text = exportTexts();
  return (
    /*
      Die vollstaendige Fassung steht als **Folge** im Bestaetigungsdialog
      davor (SP-17) — dort, wo sie noch etwas aendern kann. Danach ist sie
      eine Feststellung, und die kommt mit vier Woertern aus (T-181, ST-07).
    */
    <Card
      title={text.runDone}
      description={text.runDoneLead}
      actions={
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {text.hide}
        </Button>
      }
    >
      <dl className="facts">
        <dt>{text.file}</dt>
        <dd className="mono">{result.run.filePath}</dd>
        <dt>{text.scope}</dt>
        <dd>
          {text.runScope(
            plural(result.run.entryCount, text.booking, text.bookings),
            plural(rowCount, text.exportRow, text.exportRows),
            formatQuarters(result.run.totalQuarters),
            formatBytes(result.run.bytes),
          )}
        </dd>
        <dt>{text.checksum}</dt>
        <dd className="mono truncate">{result.run.fileSha256}</dd>
      </dl>

      {result.skipped.length === 0 ? null : (
        <InlineMessage
          tone="warning"
          title={text.skippedTitle(plural(result.skipped.length, text.groupSkipped, text.groupsSkipped))}
        >
          <p>
            {text.skippedBefore}
            <strong>{text.skippedStrong}</strong>
            {text.skippedAfter}
          </p>
          <ul className="skipped-list">
            {result.skipped.map((skipped) => (
              <SkippedRow key={`${skipped.group.todoId}-${skipped.group.day}`} skipped={skipped} />
            ))}
          </ul>
        </InlineMessage>
      )}
    </Card>
  );
}

function SkippedRow({ skipped }: { readonly skipped: SkippedExportGroup }) {
  /*
    Zeichengleich dieselbe Zeichenkette, die die Zeile links sichtbar zeigt —
    einmal gerechnet, zweimal benutzt. Eine zweite Formatierung desselben
    Tages wäre die Abschrift, die still auseinanderläuft (T-222 Abschnitt
    15.4).
  */
  const day = formatDayLabel(skipped.group.day);
  const text = exportTexts();
  return (
    <li className="skipped-row">
      <span className="skipped-row__day">{day}</span>
      <span className="skipped-row__meta">
        {plural(skipped.group.entryCount, text.booking, text.bookings)} ·{" "}
        {formatDuration(skipped.group.seconds)}
      </span>
      {/*
        Der Zusatz nennt den **Tag** und keine Buchung: Dieser Knopf springt
        auf das Todo und erreicht gar keine Buchung (T-222 Abschnitt 15.5,
        Zeile 4). Ohne ihn heißt jede ausgelassene Gruppe dieser Liste
        gleich. Verborgener Zusatz im Knopf und kein `aria-label` — der Grund
        steht im Kopfkommentar von `ExportGroups.tsx`.
      */}
      <Button
        size="sm"
        variant="secondary"
        iconStart="pencil"
        onClick={() => navigate("todo", skipped.group.todoId)}
      >
        {text.addNote}
        <span className="visually-hidden">, {day}</span>
      </Button>
    </li>
  );
}
