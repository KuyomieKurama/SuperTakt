import { useState } from "react";
import { errorMessage, isServiceError } from "../../api/client";
import { deletePool, swapPoolOrder, updatePool } from "../structure/api";
import type { Pool, PoolPlacement } from "../../api/types";
import { useRefresh } from "../../app/RefreshContext";
import { navigate } from "../../app/router";
import { useRuleLookup, useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Foreign } from "../../shared/ui/Foreign";
import { Icon } from "../../shared/ui/Icon";
import { Button, Card, EmptyState, IconButton } from "../../shared/ui/Primitives";
import { RuleSummary } from "../structure/RuleSummary";
import { quotedName } from "../../lib/foreign";
import { useReorderFocus } from "../../lib/focus";
import { labels, poolPlacementMessage } from "../../lib/labels";
import { tagTexts } from "./texts";
import { axesOf, describeRule, describeStoredRuleReach } from "../../lib/poolRule";
import { PoolFormDialog } from "../structure/PoolFormDialog";
import { PoolRenameDialog } from "../structure/PoolRenameDialog";

/**
 * Die Regelverwaltung der Tag-Ansicht — S-11, I-13.
 *
 * ## Pools sind Regeln, keine Zuordnungen (A-3.4)
 *
 * Ein Pool speichert nie, welche Todos in ihm liegen. Er speichert eine Regel
 * — seit E-055 über fünf Achsen: erforderliche Tags, ausgeschlossene Tags,
 * Status, „Erledigt“ und Exportstatus —, und die Zugehörigkeit wird bei jeder
 * Abfrage neu bestimmt. Genau deshalb funktioniert A-2.5 ohne Zusatzschritt:
 * Ein Todo kehrt in seine Pools zurück, weil es das nie verlassen hat — es war
 * nur ausgeblendet.
 *
 * Drei der fünf Achsen ändern sich, ohne dass jemand ein Tag anfasst; „eine
 * Regel über Tags und Ordner“ wäre deshalb die halbe Wahrheit.
 *
 * Vorgeschichte: `docs/decisions/tags.md`.
 */
export function PoolAdministration({ rules }: { readonly rules: readonly Pool[] }) {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();

  const [form, setForm] = useState<{ readonly pool?: Pool } | null>(null);
  /**
   * Die Regel, die gerade umbenannt wird (O-A).
   *
   * Sie steht hier aus demselben Grund wie auf dem Board: Dieselbe Handlung
   * heißt an beiden Flächen gleich und tut an beiden dasselbe. Eine Fläche mit
   * „Umbenennen" und eine ohne wäre wieder das Paar aus E-059 — zwei
   * Schutzniveaus beziehungsweise zwei Bedienniveaus für eine Sache, und eines
   * davon lehrt, dass es das andere nicht ernst meint.
   */
  const [renaming, setRenaming] = useState<Pool | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pool | null>(null);

  const lookup = useRuleLookup();

  /*
    A-28.3: `rules` is the complete list sorted by position, so swapping with the neighbour here
    changes no third rule's relative order. Board columns are the board-placed rules in the
    same order; the toast says whether the board changed too (welle-18-fluss.md 3.2, 3.3).
  */
  const [reordering, setReordering] = useState(false);
  const rememberMoved = useReorderFocus(rules);
  const moveRule = (index: number, offset: -1 | 1): void => {
    const current = rules[index];
    const target = rules[index + offset];
    if (current === undefined || target === undefined || reordering) return;
    const onBoard = (pool: Pool) => pool.placement !== "pool";
    const boardChanged = onBoard(current) && onBoard(target);

    setReordering(true);
    rememberMoved(current.id);
    void swapPoolOrder(rules, current.id, target.id)
      .then(() => {
        bump();
        const moved = tagTexts().orderMoved(quotedName(current.name), offset < 0);
        toasts.show({
          tone: "success",
          title: tagTexts().orderChanged,
          body: boardChanged ? `${moved} ${tagTexts().orderMovedOnBoard(offset < 0)}` : moved,
          replaceKey: "pool-order",
        });
      })
      .catch((cause: unknown) =>
        toasts.failure(tagTexts().orderFailed, errorMessage(cause), isServiceError(cause)),
      )
      .finally(() => {
        // Success and failure both reload: the list shows the stored order either way.
        structure.reload();
        setReordering(false);
      });
  };

  /**
   * Den Anzeigeort einer Regel ändern — mit demselben Rückweg wie auf dem
   * Board (S-5 aus R-2).
   *
   * Zwei Schutzniveaus für dieselbe Handlung lehren, dass eines davon
   * bedeutungslos ist. Beide Flächen haben deshalb denselben Rückweg: ein
   * Toast, der sagt, dass nichts verlorengeht, und einen Knopf, mit dem man es
   * ausprobieren kann.
   *
   * **Und denselben Wortlaut** (W-14 aus R-2a). Titel und Zeile kommen aus
   * `poolPlacementMessage` (`lib/labels.ts`), aus **einem** Aufruf, damit das
   * Paar nicht wieder auseinanderläuft: Zwei Fassungen desselben Satzes ließen
   * den Rückweg mit dem Titel der Handlung selbst quittieren, und wer
   * „Rückgängig" drückt, läse denselben Satz wie zuvor.
   *
   * Vorgeschichte: `docs/decisions/tags.md`.
   */
  const setPlacement = (pool: Pool, placement: PoolPlacement, restoring = false): void => {
    const previous = pool.placement;
    void updatePool(pool.id, { placement })
      .then(() => {
        structure.reload();
        bump();
        toasts.show({
          tone: "success",
          ...poolPlacementMessage(pool.name, placement, restoring),
          ...(!restoring && previous !== placement
            ? {
                action: {
                  label: tagTexts().undo,
                  onSelect: () => setPlacement({ ...pool, placement }, previous, true),
                },
              }
            : {}),
        });
      })
      .catch((cause: unknown) =>
        toasts.failure(tagTexts().placementFailed, errorMessage(cause), isServiceError(cause)),
      );
  };

  const text = tagTexts();

  return (
    <>
      {/*
        Von vier Saetzen auf zwei (T-181, ST-05, dazu ST-03 fuer die
        Kennung). Die Aufzaehlung der fuenf Achsen steht **je Zeile** in
        `.pool-row__rule` — dieselbe `RuleSummary` wie am Board, spezifisch
        statt allgemein. Der Anzeigeort steht als Marke neben jedem Namen.
      */}
      <Card
        title={text.rulesTitle}
        description={text.rulesLead}
        actions={
          <Button size="sm" variant="primary" iconStart="plus" onClick={() => setForm({})}>
            {text.newRule}
          </Button>
        }
      >
        {rules.length === 0 ? (
          <EmptyState
            compact
            icon="filter"
            title={text.noRuleTitle}
            /*
              Das **Beispiel** bleibt, die Definition faellt (T-181, ST-05).
              Ein Leerzustand zeigt den naechsten Schritt, er klaert keinen
              Begriff (Regel S-08).
            */
            description={text.noRuleBody}
            action={
              <Button variant="primary" iconStart="plus" onClick={() => setForm({})}>
                {text.firstRule}
              </Button>
            }
          />
        ) : (
          <ul className="pool-list">
            {rules.map((pool, index) => {
              const poolDescription = describeRule(axesOf(pool), lookup);

              return (
              <li key={pool.id} className="pool-row">
                <div className="grow">
                  <p className="pool-row__name">
                    <Foreign value={pool.name} />
                    <span className={`placement-badge placement-badge--${pool.placement}`}>
                      <Icon name={pool.placement === "pool" ? "filter" : "square"} size={11} />
                      {labels().poolPlacementShort[pool.placement]}
                    </span>
                  </p>
                  {/*
                    Dieselbe Zusammenfassung wie unter jedem Spaltenkopf des
                    Boards, und keine zweite Fassung daneben: Eine, die nur die
                    Tagliste kennt, behauptet bei fuenf Achsen eine Regel, die
                    es nicht gibt.

                    Und derselbe Befund: Ein erforderlicher Ordner ohne Tag ist
                    ein Einrichtungsfehler und keine Regel ohne Treffer
                    (E-057, T-083). Er gehoert auf jede Flaeche, die eine Regel
                    zeigt, nicht nur auf das Board. `reach` kommt aus derselben
                    Beschreibung, die die Chips zeichnet — der Ordner, den die
                    Warnung nennt, ist der markierte Chip darueber.
                  */}
                  <RuleSummary
                    className="pool-row__rule"
                    description={poolDescription}
                    reach={describeStoredRuleReach(poolDescription, pool.resolved)}
                    emptyText={text.poolEmpty}
                  />
                </div>
                {/* Same controls as the board columns (A-28.3); no motion (welle-18.md 0). */}
                <div
                  className="board-order"
                  role="group"
                  aria-label={text.orderOf(quotedName(pool.name))}
                  data-order-group={pool.id}
                >
                  <IconButton
                    label={text.moveUp(quotedName(pool.name))}
                    icon="arrow-up"
                    size="sm"
                    disabled={index === 0}
                    aria-disabled={reordering}
                    onClick={() => moveRule(index, -1)}
                  />
                  <IconButton
                    label={text.moveDown(quotedName(pool.name))}
                    icon="arrow-down"
                    size="sm"
                    disabled={index === rules.length - 1}
                    aria-disabled={reordering}
                    onClick={() => moveRule(index, 1)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  iconStart="filter"
                  onClick={() => navigate("todos", undefined, { pool: pool.id })}
                >
                  {text.showTodos}
                </Button>
                {/*
                  Der Anzeigeort ist der einzige Unterschied zwischen Pool und
                  Spalte (E-054) — deshalb steht er als ein Griff hier und
                  nicht nur im Formular. „Nur auf dem Board" bleibt dem Dialog
                  vorbehalten: Wer eine Regel aus seinen Pools nehmen will,
                  soll dabei lesen, was das bedeutet.
                */}
                <Button
                  size="sm"
                  variant="ghost"
                  iconStart={pool.placement === "pool" ? "plus" : "x"}
                  onClick={() => setPlacement(pool, pool.placement === "pool" ? "both" : "pool")}
                >
                  {pool.placement === "pool" ? text.addAsColumn : text.removeFromBoard}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  iconStart="pencil"
                  onClick={() => setRenaming(pool)}
                >
                  {text.rename}
                </Button>
                <Button size="sm" variant="ghost" iconStart="filter" onClick={() => setForm({ pool })}>
                  {text.editRule}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  iconStart="trash"
                  onClick={() => setPendingDelete(pool)}
                >
                  {text.delete}
                </Button>
              </li>
              );
            })}
          </ul>
        )}
      </Card>

      <PoolFormDialog
        open={form !== null}
        {...(form?.pool === undefined ? {} : { pool: form.pool })}
        defaultPlacement="pool"
        onClose={() => setForm(null)}
      />

      {/*
        `rules` ist hier bereits die vollständige Liste beider Flächen — die
        Verwaltung in S-11 zeigt jede Regel. Damit ist die Vorabprüfung auf
        einen vergebenen Namen genau so weit wie der eindeutige Index
        `ux_pool_name`, der über die ganze Tabelle gilt.
      */}
      <PoolRenameDialog
        open={renaming !== null}
        pool={renaming}
        existing={rules}
        existingKnown
        onClose={() => setRenaming(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title={text.deleteRuleTitle}
        description={pendingDelete === null ? "" : text.deleteRuleLead(quotedName(pendingDelete.name))}
        consequence={
          pendingDelete !== null && pendingDelete.placement !== "pool"
            ? text.deleteColumnConsequence
            : text.deletePoolConsequence
        }
        confirmLabel={text.delete}
        onConfirm={() => {
          const pool = pendingDelete;
          if (pool === null) return;
          void deletePool(pool.id)
            .then(() => {
              setPendingDelete(null);
              structure.reload();
              bump();
              toasts.success(tagTexts().ruleDeleted);
            })
            .catch((cause: unknown) =>
              toasts.failure(tagTexts().ruleDeleteFailed, errorMessage(cause), isServiceError(cause)),
            );
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
