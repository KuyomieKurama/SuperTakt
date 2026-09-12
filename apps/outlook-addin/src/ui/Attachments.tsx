/**
 * SuperTakt — die Flächen der Anhangsübernahme im Aufgabenbereich
 * (Entwurf T-298 Abschnitt 4, 6.1, 6.3, 6.4).
 *
 * Drei Flächen, ein Aufbau: die Vorschau vor dem Klick, die laufende Liste
 * während der Übernahme und die Liste im Ergebnis. Sie tragen dieselbe
 * Reihenfolge und dieselben Namen — die E-Mail zuerst, dann die Dateien in der
 * Reihenfolge von Outlook —, damit der Benutzer sie als dieselbe Liste liest
 * und nicht als drei.
 *
 * **Jeder Anzeigename geht durch `Foreign`** und wird nie am Ende gekürzt
 * (A-19.23b, A-A-93): Die Endung ist die eine Stelle des Namens, an der etwas
 * über die Gefährlichkeit der Datei steht. Umbruch innerhalb des Namens ist
 * der einfachere und bessere Weg als jede Kürzung.
 */

import { useState, type Ref } from 'react';

import type { EntryProgress } from '../attachments/collect.ts';
import type { MissingAttachment, TakeoverLimits } from '../attachments/model.ts';
import type { PlannedEntry, TakeoverPlan } from '../attachments/plan.ts';
import { OUTLOOK_REQUIREMENT_HINT, describeMissing, shortReason } from '../attachments/reasons.ts';
import { formatBytes } from '../attachments/size.ts';
import { Button, Foreign, Section } from './Primitives.tsx';

/** Bis hierhin steht die Liste ganz da; darüber wird zusammengefaltet (Entwurf 4.4). */
const FULL_LIST_LIMIT = 6;

/** Wie viele Einträge sichtbar bleiben, wenn zusammengefaltet wird. */
const COLLAPSED_VISIBLE = 5;

/**
 * Welche Einträge sichtbar sind.
 *
 * **Die Ausnahme trägt die Regel:** Ein Eintrag mit einer Abweichung — zu
 * groß, Cloud-Verweis, übersprungen — steht **immer** sichtbar, nie hinter dem
 * Knopf. Verborgen wird nur das Erwartbare. Sonst wäre die Vorschau genau in
 * dem Fall stumm, für den sie gebaut ist.
 */
export const visibleEntries = (
  entries: readonly PlannedEntry[],
  expanded: boolean,
): readonly PlannedEntry[] => {
  if (expanded || entries.length <= FULL_LIST_LIMIT) return entries;
  const notable = (entry: PlannedEntry): boolean =>
    entry.kind === 'skipped' || entry.kind === 'link';
  return entries.filter((entry, index) => index < COLLAPSED_VISIBLE || notable(entry));
};

/** „Daraus entstehen 3 Anhänge am neuen Todo." — Einzahl und Mehrzahl getrennt. */
export const expectedLine = (plan: TakeoverPlan): string => {
  const head =
    plan.expected === 1
      ? 'Daraus entsteht 1 Anhang am neuen Todo.'
      : `Daraus entstehen ${String(plan.expected)} Anhänge am neuen Todo.`;
  if (plan.skipped === 0) return head;
  return plan.skipped === 1
    ? `${head} 1 Datei wird übersprungen.`
    : `${head} ${String(plan.skipped)} Dateien werden übersprungen.`;
};

/** Die Zeile hinter dem Namen in der Vorschau. */
const previewMeta = (entry: PlannedEntry, limits: TakeoverLimits): string | null => {
  switch (entry.kind) {
    /*
     * Die E-Mail steht **ohne Größe** da. Ihre Größe als Datei kennt der
     * Aufgabenbereich vor dem Abruf nicht, und eine geschätzte Zahl wäre eine
     * Behauptung über eine Datei, die es noch nicht gibt.
     */
    case 'message':
      return entry.expectRebuild ? 'wird aus den Angaben der Nachricht nachgebaut' : null;
    case 'file':
      return formatBytes(entry.bytes);
    case 'link':
      return 'Verweis auf den Ablageort';
    case 'skipped':
      return describeMissing(entry, limits);
    default:
      return null;
  }
};

/** Die Vorschau vor dem Klick — Zustand Z0 (Entwurf 4). */
export function AttachmentPreview({
  plan,
  limits,
  outlookTooOld,
}: {
  readonly plan: TakeoverPlan;
  readonly limits: TakeoverLimits;
  /** Ohne `Mailbox 1.8` gibt dieses Outlook keine Datei heraus (A-19.31). */
  readonly outlookTooOld: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = visibleEntries(plan.entries, expanded);

  return (
    <Section title="Anhänge aus dieser E-Mail">
      <p className="pane-note">{expectedLine(plan)}</p>
      {outlookTooOld ? <p className="pane-note">{OUTLOOK_REQUIREMENT_HINT}</p> : null}
      <ul className="attachments">
        {shown.map((entry, index) => (
          <li
            key={`${entry.kind}-${String(index)}-${entry.displayName}`}
            className={
              entry.kind === 'skipped' ? 'attachments__line attachments__line--out' : 'attachments__line'
            }
          >
            <Foreign className="attachments__name" value={entry.displayName} />
            {previewMeta(entry, limits) !== null ? (
              <span className="attachments__meta"> · {previewMeta(entry, limits)}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {!expanded && shown.length < plan.entries.length ? (
        <Button
          variant="ghost"
          onClick={() => {
            setExpanded(true);
          }}
        >
          {`Alle ${String(plan.entries.length)} Anhänge anzeigen`}
        </Button>
      ) : null}
    </Section>
  );
}

/** Die vier Zeilenzustände — jeder mit einem **Wort** und nicht nur einem Zeichen. */
const STATE_MARK: Readonly<Record<EntryProgress['state'], { mark: string; word: string }>> =
  Object.freeze({
    pending: { mark: '·', word: 'steht an' },
    running: { mark: '…', word: 'wird übernommen' },
    taken: { mark: '✓', word: 'übernommen' },
    missing: { mark: '⊘', word: 'übersprungen' },
  });

/**
 * Die Statuszeile von Z1/Z2 — als **Wert** und nicht als Element (T-310).
 *
 * Sie wird an zwei Stellen gebraucht: sichtbar unter der Überschrift und im
 * Live-Bereich, der auf der obersten Ebene des Aufgabenbereichs steht. Der
 * Grund für die Trennung ist Y-04: Ein Live-Bereich, der zusammen mit seinem
 * Inhalt entsteht, wird von vielen Vorlesehilfen nicht angesagt — und dieser
 * Baustein entsteht erst beim Klick.
 */
export const progressStatusLine = (
  plan: TakeoverPlan,
  progress: readonly EntryProgress[],
  creating: boolean,
): string => {
  if (creating) return 'Das Todo wird angelegt …';
  const running = progress.findIndex((entry) => entry.state === 'running');
  return running < 0
    ? `${String(plan.entries.length)} Anhänge werden übernommen.`
    : `Anhang ${String(running + 1)} von ${String(plan.entries.length)} wird übernommen.`;
};

/**
 * Jeder **nicht** übernommene Anhang, sofort und mit Namen (Entwurf 10.2,
 * D-08, AK-21).
 *
 * Angesagt wird, was man nicht verpassen darf; ein gelungener Schritt ist
 * sichtbar und stumm. Auch dieser Text steht im Live-Bereich der obersten
 * Ebene und nicht in diesem Baustein — siehe {@link progressStatusLine}.
 */
export const spokenSkips = (
  plan: TakeoverPlan,
  progress: readonly EntryProgress[],
): string =>
  progress
    .map((entry, index) =>
      entry.state === 'missing' && entry.reason !== null
        ? `${plan.entries[index]?.displayName ?? ''} — ${shortReason(entry.reason)}.`
        : null,
    )
    .filter((line) => line !== null)
    .join(' ');

/**
 * Die laufende Übernahme — Zustände Z1 und Z2 (Entwurf 6.1).
 *
 * **Ein Fortschritt je Datei, kein Kreisel.** Namen, Größen und die
 * Reihenfolge stehen schon vor dem Klick fest; es gibt nichts zu ermitteln,
 * nur einen Zustand je Zeile zu wechseln. Ein Kreisel wäre dieselbe Fläche mit
 * weniger Wahrheit.
 *
 * **Keine Prozentanzeige.** `getAttachmentContentAsync` liefert eine Datei in
 * einem Stück; eine Prozentzahl innerhalb einer Datei wäre erfunden.
 */
export function AttachmentProgress({
  plan,
  progress,
  creating,
  onCancel,
  headingRef,
}: {
  readonly plan: TakeoverPlan;
  readonly progress: readonly EntryProgress[];
  /** Z2: Der Anlegeruf läuft. Ab hier gibt es nichts mehr aufzuhalten. */
  readonly creating: boolean;
  readonly onCancel: () => void;
  /** Das Fokusziel beim Übergang Z0 → Z1 (Entwurf 10.1). */
  readonly headingRef: Ref<HTMLHeadingElement>;
}) {
  return (
    <Section title="Anhänge werden übernommen" headingRef={headingRef}>
      {/*
        **Sichtbar und stumm.** Bis T-310 trug diese Zeile selbst das
        `role="status"` — und war damit ein Live-Bereich, der zusammen mit
        seinem Baustein entsteht (Y-04): Vorlesehilfen melden Änderungen an
        einer Region, die sie schon kennen, und diese kannten sie in dem
        Augenblick nicht. Angesagt wird derselbe Satz jetzt aus dem
        Live-Bereich auf der obersten Ebene des Aufgabenbereichs, der über alle
        Zustände hinweg steht (`progressStatusLine`).
      */}
      <p className="pane-note">{progressStatusLine(plan, progress, creating)}</p>
      <ul className="attachments">
        {plan.entries.map((entry, index) => {
          const state = progress[index]?.state ?? 'pending';
          const reason = progress[index]?.reason ?? null;
          const mark = STATE_MARK[state];
          return (
            <li
              key={`${entry.kind}-${String(index)}-${entry.displayName}`}
              className={
                state === 'missing' ? 'attachments__line attachments__line--out' : 'attachments__line'
              }
            >
              <span className="attachments__mark" aria-hidden="true">
                {mark.mark}
              </span>
              <Foreign className="attachments__name" value={entry.displayName} />
              <span className="attachments__meta">
                {' · '}
                {reason === null ? mark.word : shortReason(reason)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="pane-actions">
        {creating ? null : (
          <Button variant="secondary" full onClick={onCancel}>
            Abbrechen
          </Button>
        )}
        <p className="pane-note">
          Das Todo entsteht erst, wenn alle Anhänge übernommen sind. Abbrechen legt nichts an.
        </p>
      </div>
    </Section>
  );
}

/**
 * Ein Eintrag der Ergebnisliste.
 *
 * Name und Zusatz getrennt, und das ist kein Schnörkel: Ein `(als Verweis)`
 * **innerhalb** derselben Isolierung wie ein von rechts nach links
 * geschriebener Name wanderte an dessen Anfang. Zwei Elemente, zwei
 * Leserichtungen.
 */
export interface AttachedEntry {
  readonly name: string;
  readonly suffix: string | null;
}

/** Die Liste „hängen daran" im Ergebnis (Entwurf 6.3, 6.4). */
export function AttachedList({ entries }: { readonly entries: readonly AttachedEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown =
    expanded || entries.length <= FULL_LIST_LIMIT ? entries : entries.slice(0, COLLAPSED_VISIBLE);

  return (
    <>
      <ul className="attachments">
        {shown.map((entry, index) => (
          <li key={`${String(index)}-${entry.name}`} className="attachments__line">
            <Foreign className="attachments__name" value={entry.name} />
            {entry.suffix === null ? null : (
              <span className="attachments__meta">{entry.suffix}</span>
            )}
          </li>
        ))}
      </ul>
      {shown.length < entries.length ? (
        <Button
          variant="ghost"
          onClick={() => {
            setExpanded(true);
          }}
        >
          {`Alle ${String(entries.length)} Anhänge anzeigen`}
        </Button>
      ) : null}
    </>
  );
}

/** Die Liste „Nicht übernommen" im Ergebnis (A-19.29, A-19.30). */
export function MissingList({
  missing,
  limits,
}: {
  readonly missing: readonly MissingAttachment[];
  readonly limits: TakeoverLimits;
}) {
  return (
    <ul className="attachments">
      {missing.map((entry, index) => (
        <li
          key={`${String(index)}-${entry.displayName}`}
          className="attachments__line attachments__line--out"
        >
          <Foreign className="attachments__name" value={entry.displayName} />
          <span className="attachments__meta"> — {describeMissing(entry, limits)}</span>
        </li>
      ))}
    </ul>
  );
}
