import { countPoolRuleConditions } from "@takt/domain";
import { useState } from "react";
import { errorMessage } from "../../api/client";
import { updatePool } from "../../api/endpoints";
import type { Id, Pool } from "../../api/types";
import { useRefresh } from "../../app/RefreshContext";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { FormDialog } from "../../shared/ui/FormDialog";
import { Button, EmptyState, IconButton, InlineMessage, LoadingBlock } from "../../shared/ui/Primitives";
import { quotedName } from "../../lib/foreign";
import { plural } from "../../lib/format";
import { POOL_PLACEMENT_SHORT, RULE_IS_A_RULE } from "../../lib/labels";
import {
  axesOf,
  describeRule,
  describeRuleReach,
  emptyFolderNames,
  type RuleLookup,
} from "../../lib/poolRule";
import { Foreign } from "../../shared/ui/Foreign";
import { Icon } from "../../shared/ui/Icon";
import type { BoardColumnView } from "./api";

/**
 * Takt — „Spalten verwalten" (S-11 auf der Board-Seite).
 *
 * Die zweite der beiden Stellen, an denen SuperTakt überhaupt sagt, daß eine
 * Spalte eine **Regel** ist und kein Ablageort: `RULE_IS_A_RULE` steht als
 * Beschreibung dieses Dialogs (Auflage Z-07 Punkt 1). Er ist damit kein
 * Nebenweg, sondern der Ort, an dem die Definition auf die Liste trifft, die
 * Spalten und Pools nebeneinander führt.
 *
 * **Er schreibt genau eine Sache selbst**: die Reihenfolge, über zwei `PATCH`
 * in einem Zug. Alles andere gibt er nach oben zurück, weil es Dialoge
 * öffnet, die dem Bildschirm gehören — und weil ein Dialog, der einen
 * zweiten öffnet, ohne sich zu schließen, seinen Rückweg außerhalb der
 * Tabulatorschleife ablegt (W-6 aus R-2a).
 *
 * Vorgeschichte: `docs/decisions/board.md`.
 */

export function BoardSetupDialog({
  open,
  boardState,
  onRetry,
  columns,
  pools,
  lookup,
  onClose,
  onCreate,
  onEdit,
  onRename,
  onAdopt,
  onRemove,
}: {
  readonly open: boolean;
  /**
   * Woher die Spaltenliste kommt (B-5 aus R-2, sinngemäß).
   *
   * `columns` ist leer, solange das Board lädt **und** wenn es
   * fehlgeschlagen ist. „Noch keine Spalte" wäre in beiden Fällen eine
   * Behauptung über den Bestand, für die es keinen Beleg gibt — derselbe
   * Fehler, den das Regelformular bei Ordnern und Status gemacht hat.
   */
  readonly boardState: "loading" | "ready" | "error";
  readonly onRetry: () => void;
  readonly columns: readonly BoardColumnView[];
  readonly pools: readonly Pool[];
  readonly lookup: RuleLookup;
  readonly onClose: () => void;
  readonly onCreate: () => void;
  readonly onEdit: (pool: Pool) => void;
  /** Nur den Namen ändern (O-A). Der zweite Weg neben dem Spaltenmenü. */
  readonly onRename: (pool: Pool) => void;
  readonly onAdopt: (pool: Pool) => void;
  readonly onRemove: (pool: Pool) => void;
}) {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();
  const [reordering, setReordering] = useState<Id | null>(null);
  const onBoard = new Set(columns.map((view) => view.column.id));
  const available = pools.filter((pool) => !onBoard.has(pool.id));

  const moveColumn = (index: number, offset: -1 | 1): void => {
    const current = columns[index];
    const target = columns[index + offset];
    if (current === undefined || target === undefined || reordering !== null) return;

    setReordering(current.column.id);
    void Promise.all([
      updatePool(current.column.id, { position: target.column.position }),
      updatePool(target.column.id, { position: current.column.position }),
    ])
      .then(() => {
        structure.reload();
        bump();
        toasts.show({
          tone: "success",
          title: "Reihenfolge geändert.",
          body: `${quotedName(current.column.name)} steht jetzt ${offset < 0 ? "weiter links" : "weiter rechts"}. Die Position gilt auch in der Pool-Liste.`,
        });
      })
      .catch((cause: unknown) =>
        toasts.failure("Die Reihenfolge ließ sich nicht ändern", errorMessage(cause)),
      )
      .finally(() => setReordering(null));
  };

  return (
    <FormDialog
      open={open}
      title="Spalten des Boards"
      /*
        Die **Definition**, und zwar nur sie (T-181, ST-05). Der zweite
        Halbsatz ist gefallen: Dass eine Spalte dieselbe Entitaet ist wie ein
        Pool, zeigt die Liste darunter, die Spalten und Pools nebeneinander
        fuehrt. Dass hier `RULE_IS_A_RULE` steht, ist Bedingung der Freigabe
        von UM-03 (Auflage Z-07 Punkt 1).
      */
      description={RULE_IS_A_RULE}
      submitLabel="Neue Spalte anlegen"
      cancelLabel="Schließen"
      onSubmit={onCreate}
      onCancel={onClose}
    >
      {boardState === "loading" ? (
        <LoadingBlock label="Spalten werden geladen" rows={3} />
      ) : boardState === "error" ? (
        <InlineMessage
          tone="danger"
          title="Die Spalten ließen sich nicht laden"
          action={
            <Button size="sm" variant="secondary" iconStart="rotate-ccw" onClick={onRetry}>
              Erneut versuchen
            </Button>
          }
        >
          Ob dieses Board Spalten hat, ist gerade nicht feststellbar. Angelegt ist deshalb nichts
          verloren — nur ungezeigt.
        </InlineMessage>
      ) : columns.length === 0 ? (
        <EmptyState
          compact
          icon="square"
          title="Noch keine Spalte"
          description="Legen Sie eine an oder nehmen Sie eine vorhandene Regel auf."
        />
      ) : (
        <ul className="rule-list">
          {columns.map((view, index) => {
            /*
             * Derselbe Befund wie im Leerzustand der Spalte, aus derselben
             * Quelle (E-057). Er steht auch hier, weil dieser Dialog die
             * Fläche ist, auf der Spalten verwaltet werden — wer den Fehler
             * nur unter einer Spalte sähe, müsste erst dorthin scrollen.
             */
            const reach = describeRuleReach(
              describeRule(axesOf(view.column), lookup),
              view.column.resolved,
            );

            return (
              <li key={view.column.id} className="rule-row">
                <div className="grow">
                  <p className="rule-row__name">
                    <Foreign value={view.column.name} />
                  </p>
                  <p className="rule-row__meta">
                    {POOL_PLACEMENT_SHORT[view.column.placement]} ·{" "}
                    {plural(countPoolRuleConditions(axesOf(view.column)), "Bedingung", "Bedingungen")}{" "}
                    · {plural(view.total, "Karte", "Karten")}
                  </p>
                  {reach.kind === "empty-folder" ? (
                    <p className="rule-row__fault">
                      <Icon name="alert-triangle" size={11} />
                      Kein Tag in {emptyFolderNames(reach.folders)} — diese Spalte kann nichts
                      treffen.
                    </p>
                  ) : null}
                </div>

                <div
                  className="board-order"
                  role="group"
                  aria-label={`Reihenfolge von ${quotedName(view.column.name)}`}
                >
                  <IconButton
                    label={`${quotedName(view.column.name)} weiter nach links verschieben`}
                    icon="arrow-up"
                    size="sm"
                    disabled={index === 0 || reordering !== null}
                    onClick={() => moveColumn(index, -1)}
                  />
                  <IconButton
                    label={`${quotedName(view.column.name)} weiter nach rechts verschieben`}
                    icon="arrow-down"
                    size="sm"
                    disabled={index === columns.length - 1 || reordering !== null}
                    onClick={() => moveColumn(index, 1)}
                  />
                </div>

                {/*
                  Zwei getrennte Knöpfe, weil es zwei Handlungen sind (O-A):
                  „Umbenennen" schickt `{ name }`, „Regel bearbeiten" schreibt
                  alle fünf Achsen. Die Beschriftung sagt seit T-133, **was**
                  bearbeitet wird — „Bearbeiten" allein ließ offen, ob damit der
                  Name gemeint ist, und genau daran ist das Umbenennen bisher
                  gescheitert.
                */}
                <Button
                  size="sm"
                  variant="secondary"
                  iconStart="pencil"
                  onClick={() => onRename(view.column)}
                >
                  Umbenennen
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  iconStart="filter"
                  onClick={() => onEdit(view.column)}
                >
                  Regel bearbeiten
                </Button>
                <Button size="sm" variant="ghost" iconStart="x" onClick={() => onRemove(view.column)}>
                  Vom Board nehmen
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {available.length === 0 ? null : (
        <div className="field">
          <span className="field__label">Vorhandene Pool-Regeln</span>
          <ul className="rule-list">
            {available.map((pool) => (
              <li key={pool.id} className="rule-row">
                <span className="rule-row__name grow truncate">
                  <Foreign value={pool.name} />
                </span>
                <Button size="sm" variant="ghost" iconStart="plus" onClick={() => onAdopt(pool)}>
                  Als Spalte aufnehmen
                </Button>
              </li>
            ))}
          </ul>
          <p className="field__hint">
            Die Regel erscheint dann an beiden Stellen. Wollen Sie sie nur auf dem Board, stellen
            Sie den Anzeigeort im Bearbeiten-Dialog auf „Nur auf dem Board“.
          </p>
        </div>
      )}

      {columns.length < 2 ? null : (
        <p className="field__hint">
          Mit den Pfeilen ändern Sie die Reihenfolge auf dem Board. Die Position wird mit der
          Pool-Liste geteilt.
        </p>
      )}
    </FormDialog>
  );
}
