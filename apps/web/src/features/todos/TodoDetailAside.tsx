import type { CalendarDay, Todo } from "../../api/types";
import { navigate } from "../../app/router";
import { useStructure } from "../../app/StructureContext";
import { formatDateTime, formatDuration, formatQuarters } from "../../lib/format";
import { Button, Card, IconButton } from "../../shared/ui/Primitives";
import { StatTile } from "../../shared/ui/StatTile";
import { DeadlineFlag } from "../../shared/ui/DeadlineFlag";
import { Foreign } from "../../shared/ui/Foreign";
import { Icon } from "../../shared/ui/Icon";
import { TagChip } from "../../shared/ui/Tag";

/**
 * Takt — die Nebenspalte der Todo-Detailansicht (S-03).
 *
 * Vier Karten, die dasselbe tun: Sie **zeigen**, was am Todo steht — Frist,
 * erfaßte Zeit, Tags, Herkunft. Kein eigener Zustand, kein Aufruf an den
 * Dienst, keine Handlung außer dem Weg in den Bearbeitungsdialog und dem
 * Sprung in die nach einem Tag gefilterte Liste. Das ist die Trennlinie, an
 * der diese Datei aus dem Screen herausgeschnitten ist.
 *
 * Der heutige Tag wird **hereingereicht** und nicht hier geholt: So gibt es je
 * Ansicht einen Zeitgeber auf die nächste Mitternacht (`useToday`, E-073
 * Punkt 2) und nicht einen je Karte.
 */
export interface TodoDetailAsideProps {
  readonly todo: Todo;
  readonly today: CalendarDay;
  /** Alle Buchungen, ungerundet. */
  readonly totalSeconds: number;
  /** Noch nicht exportierte Sekunden. */
  readonly openSeconds: number;
  /** Was der Export daraus macht — `null`, solange nichts exportiert wurde. */
  readonly totalQuarters: number | null;
  /** Der Grund, falls die Vorschau über die offenen Buchungen fehlschlug. */
  readonly previewProblem: string | null;
  /** „Bearbeiten" — derselbe Dialog wie in der Kopfzeile. */
  readonly onEdit: () => void;
}

export function TodoDetailAside({
  todo,
  today,
  totalSeconds,
  openSeconds,
  totalQuarters,
  previewProblem,
  onEdit,
}: TodoDetailAsideProps) {
  const structure = useStructure();

  return (
    <aside className="detail__side">
      {/*
        **SP-05** (Sperrliste, Abschnitt 5; A-19.5, A-19.8, E-070 Punkt 4).
        Beide Haelften stehen in dieser Karte und werden nicht gekuerzt: die
        Beschreibung sagt, was die Frist **nicht** tut (und dass sie in keinem
        Export steht), der Absatz darunter sagt woertlich nach A-19.5, was ein
        fehlender Wert bedeutet.
      */}
      <Card
        title="Frist"
        description="Ein Tag, keine Uhrzeit. Sie ändert nichts an Pools, Spalten, Buchungen oder Export — und sie steht in keinem Export."
        className="detail__deadline-card"
        actions={
          <IconButton
            size="sm"
            icon="pencil"
            label={todo.dueDate === null ? "Frist setzen" : "Frist ändern"}
            onClick={() => onEdit()}
          />
        }
      >
        {todo.dueDate === null ? (
          <p className="muted">
            Keine Frist gesetzt. Dieses Todo ist deshalb weder überfällig noch heute fällig — es
            hat schlicht keinen dieser Zustände.
          </p>
        ) : (
          <DeadlineFlag dueDate={todo.dueDate} today={today} className="detail__deadline" />
        )}
      </Card>

      <Card title="Erfasste Zeit">
        <div className="stat-grid stat-grid--tight">
          <StatTile
            label="Gesamt"
            value={formatDuration(totalSeconds)}
            detail="Alle Buchungen, ungerundet."
          />
          <StatTile
            label="Noch offen"
            value={formatDuration(openSeconds)}
            tone="warning"
            detail={
              previewProblem !== null
                ? "Was der Export daraus macht, ist gerade nicht abrufbar."
                : totalQuarters === null
                  ? "Noch nicht exportiert."
                  : `Beim Export ergibt das ${formatQuarters(totalQuarters)} — über alle Tagesgruppen zusammen.`
            }
          />
        </div>
        {/*
          Ohne diesen Satz sähe die Liste darunter aus, als hätte
          jede Tagesgruppe ihre Leistung — die Kennzeichnung aus
          E-034 stammt aus derselben Antwort, die hier gefehlt hat.
        */}
        {previewProblem === null ? null : (
          <p className="daygroup__blocked">
            <Icon name="alert-triangle" size={14} />
            <span>
              Was der Export aus den offenen Buchungen macht, ließ sich nicht
              abrufen: {previewProblem} Solange fehlt auch die Kennzeichnung
              der Tagesgruppen, denen die Leistung fehlt.
            </span>
          </p>
        )}
      </Card>

      <Card
        title="Tags"
        description="Tags sind der häufigste Griff, mit dem eine Karte die Spalte wechselt — aber nicht der einzige: Eine Regel fragt auch nach Status, „Erledigt“ und Exportstatus."
      >
        {todo.tagIds.length === 0 ? (
          <p className="muted">
            Keine Tags. Regeln, die Tags verlangen, treffen dieses Todo damit nicht —
            Regeln über Status, „Erledigt“ oder den Exportstatus schon.
          </p>
        ) : (
          <div className="tag-row">
            {todo.tagIds.map((id) => {
              const info = structure.tagInfo(id);
              if (info === undefined) return null;
              return (
                <TagChip
                  key={id}
                  label={info.tag.name}
                  path={info.path}
                  size="sm"
                  onToggle={() => navigate("todos", undefined, { tag: id })}
                />
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Herkunft">
        <dl className="facts">
          <dt>Angelegt</dt>
          <dd>{formatDateTime(todo.createdAt)}</dd>
          <dt>Zuletzt geändert</dt>
          <dd>{formatDateTime(todo.updatedAt)}</dd>
          {/*
            Der Status ist seit E-054 **keine** Kanban-Spalte mehr;
            ein Verweis von hier auf das Board hat deshalb kein Ziel
            mehr, das ihn zeigte. Geaendert wird er hier — die
            Detailansicht ist neben der Liste der Ort dafuer.
          */}
          <dt>Status</dt>
          <dd className="facts__with-action">
            <span>
              <Foreign value={structure.statusName(todo.statusId)} />
            </span>
            <Button size="sm" variant="ghost" iconStart="pencil" onClick={() => onEdit()}>
              Ändern
            </Button>
          </dd>
        </dl>
      </Card>
    </aside>
  );
}
