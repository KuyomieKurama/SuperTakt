import { countPoolRuleConditions } from "@takt/domain";
import type { Pool } from "../../api/types";
import { Button, Card, EmptyState, InlineMessage } from "../../shared/ui/Primitives";
import { plural } from "../../lib/format";
import { axesOf } from "../../lib/poolRule";
import { Foreign } from "../../shared/ui/Foreign";

/**
 * Kein Board heißt hier **nicht** „nichts zu tun".
 *
 * Das Board ist leer, weil Takt keine Spalte von sich aus einrichtet (E-054,
 * E-055) — nicht, weil nichts zu tun wäre, und nicht, weil etwas verlorenging.
 * Ein Leerzustand, der nur „keine Daten" sagt, wäre hier die teuerste Auskunft
 * der Anwendung. Deshalb steht hier die **Abwesenheit**, genau eine primäre
 * Aktion, und ein Weg zur Definition: „Erste Spalte einrichten" führt über den
 * Einrichtungsdialog, in dem `RULE_IS_A_RULE` steht.
 *
 * Darunter stand einmal die Karte „Was sich geändert hat"; sie ist mit UM-08
 * gefallen. **Wohin ihre vier Punkte gegangen sind, steht als Kommentar an der
 * Stelle, an der sie stand** — das ist der Ausgleichsnachweis zu E-081 Punkt 4
 * und keine Fußnote. Vorgeschichte: `docs/decisions/board.md`.
 */
export interface BoardEmptyStateProps {
  /** Vorhandene Pool-Regeln, die sich als Spalte aufnehmen lassen. */
  readonly pools: readonly Pool[];
  /**
   * Ist die Regelliste geladen? (B-5 aus R-2, sinngemäß.)
   *
   * `pools` ist leer, solange der Aufbau lädt und wenn er fehlgeschlagen ist.
   * „Sie haben noch keine Regel" wäre dann eine Behauptung über den Bestand,
   * die niemand belegt hat — und sie stünde ausgerechnet neben der
   * Aufforderung, Tags zu vergeben, die der Benutzer längst hat. Fehlt die
   * Angabe, wird der Satz weggelassen statt geraten.
   */
  readonly poolsKnown?: boolean;
  /**
   * Öffnet den **Einrichtungsdialog** des Boards (`BoardSetupDialog`), nicht
   * unmittelbar das Regelformular (TP-KANBAN-08).
   *
   * Der Umweg ist der Punkt: `RULE_IS_A_RULE` steht im Einrichtungsdialog, und
   * seit ST-05 ist er eine von nur noch **zwei** Stellen, an denen SuperTakt
   * überhaupt sagt, daß eine Spalte eine Regel ist und kein Ablageort. Ein
   * Sprung von hier unmittelbar ins Regelformular ist bequem und kostet genau
   * diese Definition (E-081 Punkt 4).
   *
   * **Der Name sagt, wohin es geht, nicht was am Ende herauskommt.** Ein
   * `onCreate` an dieser Stelle verbirgt, daß der Weg dahin einen Halt hat.
   * Vorgeschichte: `docs/decisions/board.md`.
   */
  readonly onOpenSetup: () => void;
  readonly onAdopt: (pool: Pool) => void;
}

export function BoardEmptyState({
  pools,
  poolsKnown = true,
  onOpenSetup,
  onAdopt,
}: BoardEmptyStateProps) {
  return (
    <div className="board-setup">
      <EmptyState
        icon="square"
        title="Das Board hat noch keine Spalte"
        /*
          „Seit der Umstellung …" ist mit T-181 (ST-05) gefallen: eine
          Formulierung, die an ein Ereignis gebunden ist, altert. Was bleibt,
          ist die **Abwesenheit** — Takt richtet nichts von selbst ein.

          Die Definition ist von hier **einen** Klick entfernt: „Erste Spalte
          einrichten" oeffnet `BoardSetupDialog`, dessen Beschreibung
          `RULE_IS_A_RULE` ist (UM-03, Auflage Z-07 Punkt 1 — diese Kette ist
          Teil der Freigabe des Textdurchgangs).

          **Gemessen** wird sie in `tests/e2e/board-empty-state-rule-chain.spec.ts`
          (TP-KANBAN-08). Bis T-186 stand hier derselbe Satz — und der Knopf
          sprang am Dialog vorbei ins Regelformular. Ein Kommentar, der die
          Erfuellung einer Auflage behauptet, nennt entweder die Stelle, an der
          sie gemessen wird, oder er behauptet sie nicht.
        */
        description="Sie richten die Spalten selbst ein. SuperTakt erfindet keine."
        action={
          <Button variant="primary" iconStart="plus" onClick={onOpenSetup}>
            Erste Spalte einrichten
          </Button>
        }
      />

      {/*
        Hier stand bis T-209 die Karte „Was sich geändert hat" — vier Punkte und
        zwei Knöpfe. Sie sprach zu jemandem, der **vor E-054 ein Statusboard
        hatte**, und ihre Bedingung ist gemessen nie wahr (UM-08 in
        `docs/design/textbestand.md`, Befund B-3 aus T-171): E-054 fiel vor der
        ersten Auslieferung, und `0010_drop_board_rank` läuft in jeder frischen
        Einrichtung mit der Kette 0001 bis 0015 durch. Es gibt keinen Bestand,
        für den sie zutrifft, und es kann keinen mehr geben.

        **Nichts davon ist spurlos verschwunden** — das ist die Bedingung, unter
        der die Karte fallen durfte (E-081 Punkt 4: Streichung und Ausgleich in
        einem Auftrag). Wohin die vier Punkte gegangen sind:

         1. „Nichts wird mehr gezogen." steht als `RULE_WHAT_MOVES_A_CARD` im
            `lead` dieser Ansicht — die Fassung in der Karte war die vierte
            desselben Satzes.
         2. „Keine automatische Übersetzung." steht kurz im Leerzustand
            darüber: „Takt erfindet keine."
         3. „Ihre Todos sind vollzählig da." und der Rest von „Der Status
            bleibt." stehen in `docs/benutzerhandbuch.md` unter „Herkunft der
            Spalten" (T-201, freigegeben in T-200 Z-54). Der Absatz ist seit
            diesem Fall **Alleinträger** und steht als **SP-22** auf der
            Sperrliste: Wer ihn beim nächsten Handbuchdurchgang als
            Geschichtserzählung streicht, nimmt die Auskunft ganz weg.
         4. Der **Verweisteil** von „Der Status bleibt." — wo die Statuswerte
            herkommen — steht im Todo-Dialog am Statusfeld
            (`TodoFormDialog.tsx`, `hint`). Er wurde hier nicht ersatzlos
            gestrichen, sondern ist dort seit T-181 der Träger.

        **Die zwei Knöpfe fallen mit.** „Erste Spalte einrichten" steht
        wortgleich als Aktion des Leerzustands darüber (D — dieselbe Handlung
        zweimal im selben Blickfeld), und „Zur Todo-Liste" ist ein
        Navigationsknopf in einem Erklärkasten: Regel S-11 verbietet ihn, weil
        ein Bedienweg an die Bedienstelle gehört und die Todo-Liste ohnehin in
        der Hauptnavigation steht.
      */}

      {!poolsKnown ? null : pools.length === 0 ? (
        <InlineMessage tone="info" title="Sie haben noch keine Regel">
          Eine Spalte nennt Bedingungen — zum Beispiel „alles unter Kunden“, „Tag Wartet“ oder
          „erledigt und noch nicht abgerechnet“. Wer noch keine Tags vergeben hat, fängt am besten
          damit an; über Status, „Erledigt“ und den Exportstatus kommt man auch ganz ohne Tag zu
          einer Spalte.
        </InlineMessage>
      ) : (
        <Card
          title="Vorhandene Regeln als Spalte aufnehmen"
          description="Diese Regeln gibt es bereits in Ihren Pools. Sie werden dadurch nicht kopiert — dieselbe Regel erscheint zusätzlich auf dem Board."
        >
          <ul className="rule-list">
            {pools.map((pool) => (
              <li key={pool.id} className="rule-row">
                <span className="rule-row__name grow truncate">
                  <Foreign value={pool.name} />
                </span>
                <span className="rule-row__count">
                  {plural(countPoolRuleConditions(axesOf(pool)), "Bedingung", "Bedingungen")}
                </span>
                <Button size="sm" variant="secondary" iconStart="plus" onClick={() => onAdopt(pool)}>
                  Als Spalte aufnehmen
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
