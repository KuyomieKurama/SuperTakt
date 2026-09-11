import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage } from "../../api/client";
import {
  listTimeEntries,
} from "../../api/endpoints";
import { previewExportDraft } from "./api";
import {
  listTodos,
} from "../todos/api";
import type {
  ExportGroupSummary,
  ExportPreview,
  Id,
  TimeEntry,
  Todo,
} from "../../api/types";
import { PreviewGroupRow, type PreviewGroup } from "./PreviewGroupRow";
import { Icon } from "../../shared/ui/Icon";
import { Button, EmptyState, InlineMessage, Spinner } from "../../shared/ui/Primitives";
import { useRefresh } from "../../app/RefreshContext";
import { navigate } from "../../app/router";
import { useAsync } from "../../app/useAsync";
import {
  toDefinitionBody,
  type ExportFieldDefinition,
  type SourceCatalog,
} from "./exportTemplateModel";
import { plural } from "../../lib/format";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { RefreshHint } from "../../shared/ui/ScreenHeader";
import { BookingFormDialog } from "../bookings/BookingDialogs";
import { quotedName } from "../../lib/foreign";

/**
 * Takt — die Vorschau des Vorlageneditors (S-14, A-8.7, E-005, E-031, E-034).
 *
 * ## Sie benutzt denselben Renderer wie der Export (R-17)
 *
 * Jede gezeigte Zeile kommt aus `POST /export/preview`. Die Vorschau und der
 * Lauf bilden denselben Plan: dieselbe Rundung über die Tagessumme (E-008,
 * E-020), dieselbe Zusammenführung der Leistungstexte (E-026), dieselbe
 * Prüfung auf fehlende Leistung (E-034), dieselbe Base64-Kodierung (A-8.4).
 * Ein zweiter Weg wäre genau an der Stelle blind, für die die Vorschau da ist:
 * Der Benutzer sähe das eine und verschickte das andere.
 *
 * **Diese Datei rechnet deshalb nichts.** Sie kodiert nicht, sie rundet nicht,
 * sie führt keine Texte zusammen. Sie zeigt an, was der Dienst geantwortet hat.
 *
 * ## Gegliedert wird nach Tagesgruppen — und die Gliederung kommt mit (E-031)
 *
 * Die Datei enthält eine Zeile je Todo und Kalendertag, nicht je Buchung. Eine
 * Vorschau, die anders gliedert, zeigt etwas anderes als die Datei. Seit T-030
 * liefert `POST /export/preview` deshalb `groups` parallel zu `rows`: **ein**
 * Aufruf, und die Zuordnung von Zeile zu Gruppe kommt aus derselben Antwort.
 *
 * Vorher hätte die Oberfläche entscheiden müssen, welcher Kalendertag zu einer
 * Buchung gehört — eine Regel der Domäne (E-025: der Tag des Timer**starts**),
 * und eine nachgebaute Regel ist eine zweite Fassung derselben Wahrheit. Sie
 * wäre ausgerechnet an der Grenze falsch gewesen, an der es weh tut: bei einer
 * Buchung um 23:50, die über Mitternacht läuft.
 *
 * Jede Gruppe lässt sich aufklappen; darunter stehen die einzelnen Buchungen
 * mit ihrer ungerundeten Dauer und ihrem eigenen Leistungstext.
 *
 * ## Die Segmente stehen sichtbar getrennt (E-028)
 *
 * Der zusammengeführte Text trennt mit Semikolon. Enthält ein Leistungstext
 * selbst eines, ist die Grenze im Ergebnis nicht mehr erkennbar — Takt kennt
 * sie aber. Deshalb steht unter jeder Gruppe, aus welchen Segmenten ihr Text
 * entstanden ist, jedes mit seiner Buchung. Das ist der Ort, an dem dieses
 * Problem auffällt, und die Stelle, an der es sich beheben lässt.
 *
 * ## Sie zeigt den Stand im Editor, nicht den gespeicherten (E-051)
 *
 * Seit E-051 nimmt die Route `{ definition, timeEntryIds }`, prüft die Definition
 * mit **derselben Funktion** wie das Speichern und schreibt dabei nichts.
 * Diese Vorschau schickt deshalb immer den Entwurf, den der Benutzer gerade
 * vor sich hat — nie eine Kennung. Damit ist A-8.7 erfüllt: Jede Änderung an
 * einem Feld ist eine Zeile später zu sehen, und der Hinweissatz „zeigt den
 * gespeicherten Stand" ist ersatzlos weg.
 *
 * Der Dienst antwortet mit `templateSource: "draft"`; die Vorschau sagt es in
 * ihrem Kopf, statt es den Benutzer raten zu lassen.
 *
 * ## Getaktet, nicht bei jedem Tastenanschlag
 *
 * Der Entwurf wandert **entschleunigt** über die Leitung: Wer einen Feldnamen
 * tippt, löst sonst je Zeichen eine Anfrage aus, und die Antworten treffen in
 * beliebiger Reihenfolge ein. Die Verzögerung ist Anzeigeverhalten, keine
 * Fachregel — gerechnet wird nach wie vor ausschließlich im Dienst.
 *
 * Vorgeschichte: `docs/decisions/export.md`.
 */

/** Wie viele Tagesgruppen die Vorschau höchstens zeigt. */
const PREVIEW_GROUP_LIMIT = 6;
const ENTRY_PAGE_SIZE = 200;

/**
 * Wartezeit, bevor ein geänderter Entwurf zum Dienst geht.
 *
 * Lang genug, dass ein getippter Feldname eine Anfrage ergibt und nicht
 * fünfzehn; kurz genug, dass die Vorschau sich noch wie eine Rückmeldung
 * anfühlt und nicht wie ein Nachladen.
 */
const DRAFT_DEBOUNCE_MS = 400;

/**
 * Woher die Vorschau kommt — **eine** Fassung fuer alle drei Faelle und fuer
 * die Karte darum (T-181, ST-07).
 *
 * Bis dahin standen vier Abschriften desselben Satzes untereinander und
 * nebeneinander. Zwei Abschriften laufen auseinander, sobald eine gepflegt
 * wird; vier laufen schneller auseinander.
 */
const PREVIEW_SOURCE = "Vorschau anhand Ihrer offenen Buchungen.";

export interface TemplatePreviewProps {
  /** Die Felder, die der Benutzer gerade vor sich hat. Sie werden gerendert. */
  readonly fields: readonly ExportFieldDefinition[];
  /** Die Auswahlliste des Dienstes — für die Spalte „Feld für Feld" (E-049). */
  readonly catalog: SourceCatalog;
  /** Der Entwurf weicht vom gespeicherten Stand ab. Nur ein Hinweis. */
  readonly stale: boolean;
  /** Die Vorlage ist noch nie gespeichert worden. Nur ein Hinweis. */
  readonly unsaved: boolean;
}

/** Was der Dienst zum zuletzt geschickten Entwurf gesagt hat. */
type DraftOutcome =
  | { readonly kind: "idle" }
  | { readonly kind: "ready"; readonly preview: ExportPreview }
  | { readonly kind: "failed"; readonly message: string };

export function TemplatePreview({ catalog, stale, fields, unsaved }: TemplatePreviewProps) {
  const { version, bump } = useRefresh();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);

  /*
   * Ein Aufruf für die offenen Buchungen und die Todos dahinter. Er hängt am
   * Bestand, nicht am Entwurf — sonst würde jede Änderung an einem Feldnamen
   * die ganze Liste neu holen und die Vorschau bei jedem Tastenanschlag
   * flackern.
   */
  const data = useAsync(async () => {
    const [entries, todos] = await Promise.all([
      listTimeEntries({ exportStatus: "open" }, { limit: ENTRY_PAGE_SIZE }),
      listTodos({}, { limit: ENTRY_PAGE_SIZE }),
    ]);
    const titles = new Map<Id, Todo>();
    for (const todo of todos.items) titles.set(todo.id, todo);
    const byId = new Map<Id, TimeEntry>();
    for (const entry of entries.items) byId.set(entry.id, entry);
    return {
      byId,
      titles,
      total: entries.total,
      entryIds: entries.items.map((entry) => entry.id),
    };
  }, [], [version]);

  /*
   * Der Entwurf als Zeichenkette — genau der Rumpf, der über die Leitung geht.
   *
   * Als Abhängigkeit taugt nur er: Ein neues Feld mit demselben Inhalt löste
   * bei jeder Neuzeichnung eine weitere Anfrage aus, und die Antworten träfen
   * in beliebiger Reihenfolge ein.
   */
  const draftBody = useMemo(() => JSON.stringify(toDefinitionBody(fields)), [fields]);
  const entryKey = data.state.status === "ready" ? data.state.value.entryIds.join(",") : "";
  const hasFields = fields.length > 0;

  const [outcome, setOutcome] = useState<DraftOutcome>({ kind: "idle" });
  /**
   * Eine Anfrage ist unterwegs oder wartet noch auf ihren Takt.
   *
   * Getrennt vom Ergebnis, damit beim Nachziehen der **alte Stand stehen
   * bleibt** — dieselbe Regel wie in `useAsync`. Würde die Vorschau bei jedem
   * Tastenanschlag auf eine Ladefläche zurückfallen, wäre sie genau in dem
   * Moment leer, in dem man auf sie schaut.
   */
  const [pending, setPending] = useState(false);
  /**
   * Zaehler fuer „Erneut versuchen".
   *
   * Er steht in den Abhaengigkeiten, weil sonst nichts geschieht: Entwurf und
   * Buchungsauswahl sind nach einem Fehlschlag unveraendert, und ein Effekt,
   * dessen Abhaengigkeiten gleich bleiben, laeuft nicht noch einmal. Ein Knopf,
   * der nichts tut, ist schlimmer als keiner.
   */
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);

  useEffect(() => {
    if (entryKey.length === 0 || !hasFields) {
      setOutcome({ kind: "idle" });
      setPending(false);
      return;
    }
    let live = true;
    setPending(true);
    const timer = window.setTimeout(() => {
      /*
       * Geschickt wird die **Definition**, nie eine Kennung (E-051). Der Dienst
       * prüft sie mit derselben Funktion wie das Speichern und schreibt dabei
       * nichts — keine Vorlage, keinen Lauf, keine Markierung. Ein Rumpf mit
       * beidem ergäbe 422; welche Angabe gewinnt, hat niemand entschieden.
       */
      void previewExportDraft(JSON.parse(draftBody) as unknown, entryKey.split(","))
        .then((preview) => {
          if (live) setOutcome({ kind: "ready", preview });
        })
        .catch((cause: unknown) => {
          if (live) setOutcome({ kind: "failed", message: errorMessage(cause) });
        })
        .finally(() => {
          if (live) setPending(false);
        });
    }, DRAFT_DEBOUNCE_MS);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [draftBody, entryKey, hasFields, attempt]);

  const groups = useMemo<readonly PreviewGroup[]>(() => {
    if (data.state.status !== "ready") return [];
    if (outcome.kind !== "ready") return [];
    const preview = outcome.preview;
    const byId = data.state.value.byId;

    const entriesOf = (group: ExportGroupSummary): readonly TimeEntry[] =>
      group.timeEntryIds
        .map((id) => byId.get(id))
        .filter((entry): entry is TimeEntry => entry !== undefined)
        .sort((left, right) => left.startedAt.localeCompare(right.startedAt));

    const shown: PreviewGroup[] = [];
    // `groups[i]` gehört zu `rows[i]` — das sagt der Vertrag der Antwort.
    for (const [index, group] of preview.groups.entries()) {
      const row = preview.rows[index];
      if (row === undefined) continue;
      shown.push({
        key: `${group.todoId}|${group.day}`,
        group,
        entries: entriesOf(group),
        outcome: { kind: "row", row },
      });
    }
    // Die nicht exportierbaren stehen in einer eigenen Liste (E-034) und
    // gehören trotzdem in die Anzeige — sonst verschwindet Arbeitszeit.
    for (const skipped of preview.skipped) {
      shown.push({
        key: `${skipped.group.todoId}|${skipped.group.day}`,
        group: skipped.group,
        entries: entriesOf(skipped.group),
        outcome: { kind: "blocked", reason: skipped.reason },
      });
    }

    return shown
      .sort((left, right) => right.group.day.localeCompare(left.group.day))
      .slice(0, PREVIEW_GROUP_LIMIT);
  }, [data.state, outcome]);

  const toggle = useCallback((key: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="tpreview">
      <details className="export-legend">
        <summary><Icon name="info" size={14} /><span>Legende</span><Icon name="chevron-down" size={12} /></summary>
        <p><strong>Leistung fehlt:</strong> Leistungstext in einer Buchung ergänzen. Betroffene Tagesgruppen bleiben offen; der übrige Export läuft weiter.</p>
      </details>
      <div className="tpreview__banner">
        {/*
          Seit E-051 zeigt die Vorschau **immer** den Stand im Editor. Der
          frühere Satz „zeigt den gespeicherten Stand" ist damit ersatzlos weg;
          was bleibt, ist die Auskunft, ob dieser Stand schon gespeichert ist.

          Seit T-181 (ST-07) steht die Herkunft in **einer** Fassung statt in
          vier: Der Satz über den Renderer stand dreimal hier und ein viertes
          Mal in der Kartenbeschreibung darum. Was bleibt, ist der Zusatz, der
          die drei Fälle unterscheidet — er ist eine **Abwesenheit** („noch
          nicht gespeichert", „gespeichert wird dabei nichts") und fällt
          deshalb nicht.
        */}
        <p className="tpreview__lead">
          <Icon name={stale || unsaved ? "pencil" : "check-circle"} size={14} />
          <span>
            {unsaved
              ? `Noch nicht gespeicherter Entwurf. ${PREVIEW_SOURCE}`
              : stale
                ? `Geänderter Stand, noch nicht gespeichert — die Vorschau speichert nichts. ${PREVIEW_SOURCE}`
                : PREVIEW_SOURCE}
          </span>
        </p>
      </div>

      <AsyncBoundary
        state={data.state}
        label="Offene Buchungen für die Vorschau werden geladen"
        rows={3}
        onRetry={data.reload}
      >
        {(value) => {
          if (value.entryIds.length === 0) {
            return (
              <EmptyState
                compact
                icon="clock"
                title="Keine offenen Buchungen"
                description="Die Vorschau läuft auf echten Daten und erfindet keine. Sobald eine Zeit erfasst und noch nicht exportiert ist, steht hier, was diese Vorlage daraus macht."
                action={
                  <Button variant="secondary" iconStart="clock" onClick={() => navigate("time")}>
                    Zur Zeiterfassung
                  </Button>
                }
              />
            );
          }

          if (fields.length === 0) {
            return (
              <EmptyState
                compact
                icon="inbox"
                title="Noch kein Feld, also keine Zeile"
                description="Eine Vorlage ohne Feld erzeugt keine Datei — der Dienst nimmt sie nicht an. Fügen Sie links das erste Feld hinzu; die Vorschau zieht sofort nach."
              />
            );
          }

          if (outcome.kind === "failed") {
            return (
              <InlineMessage
                tone="danger"
                title="Diese Vorlage lässt sich so nicht rendern"
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    iconStart="rotate-ccw"
                    loading={pending}
                    onClick={retry}
                  >
                    Erneut versuchen
                  </Button>
                }
              >
                {outcome.message} Geprüft hat das dieselbe Stelle, die auch beim Speichern prüft —
                so wie es hier steht, ließe sich die Vorlage also auch nicht speichern. Geschrieben
                wurde nichts; die gespeicherte Fassung ist unverändert.
              </InlineMessage>
            );
          }

          if (outcome.kind !== "ready") {
            return (
              <p className="tpreview__scope" role="status" aria-live="polite">
                <Spinner size={13} label="Vorschau wird erzeugt" />
                <span>Der Dienst rendert Ihren Stand …</span>
              </p>
            );
          }

          if (groups.length === 0) {
            return (
              <EmptyState
                compact
                icon="inbox"
                title="Diese Vorlage erzeugt keine Zeile"
                description="Der Dienst hat den Entwurf angenommen, aber aus den offenen Buchungen entsteht damit keine Zeile. Prüfen Sie die Bedingungen an den Feldern."
              />
            );
          }

          return (
            <>
              <p className="tpreview__scope" role="status" aria-live="polite">
                {plural(groups.length, "Tagesgruppe", "Tagesgruppen")} aus{" "}
                {plural(value.total, "offenen Buchung", "offenen Buchungen")}
                {value.total > groups.length
                  ? " — neueste zuerst."
                  : "."}{" "}
                {outcome.preview.templateSource === "draft"
                  ? "Aktueller Entwurf."
                  : `Gerendert aus der gespeicherten Vorlage ${quotedName(outcome.preview.templateName ?? "")}.`}
                <RefreshHint active={pending} />
              </p>

              <ul className="tpgroups">
                {groups.map((entry) => (
                  <PreviewGroupRow
                    key={entry.key}
                    group={entry}
                    todo={value.titles.get(entry.group.todoId) ?? null}
                    fields={fields}
                    catalog={catalog}
                    expanded={expanded.has(entry.key)}
                    onToggle={() => toggle(entry.key)}
                    onEditEntry={(booking) => setEditEntry(booking)}
                  />
                ))}
              </ul>
            </>
          );
        }}
      </AsyncBoundary>

      {editEntry === null ? null : (
        <BookingFormDialog
          open
          entry={editEntry}
          todoId={editEntry.todoId}
          todoTitle={
            data.state.status === "ready"
              ? (data.state.value.titles.get(editEntry.todoId)?.title ?? "diesem Todo")
              : "diesem Todo"
          }
          onClose={() => {
            setEditEntry(null);
            bump();
          }}
        />
      )}
    </div>
  );
}
