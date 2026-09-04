import type { Id } from "../api/types";
import { cx } from "../lib/cx";
import {
  emptyFolderNames,
  type RuleAxis,
  type RuleChip,
  type RuleDescription,
  type RuleReach,
} from "../lib/poolRule";
import { Icon, type IconName } from "./Icon";
import { TagChip } from "./Tag";

/**
 * Takt — die Regel einer Spalte oder eines Pools in Worten (T-076, T-079).
 *
 * ## Eine Zusammenfassung, drei Flächen
 *
 * Sie steht unter jedem Spaltenkopf des Boards, in jeder Zeile der
 * Regelverwaltung und als Vorschau im Formular. Bis T-079 war sie an zwei
 * dieser Stellen getippt und an der dritten gar nicht — und die beiden
 * Fassungen kannten nur die Tagliste. Seit die Regel fünf Achsen hat, wäre das
 * nicht mehr bloß uneinheitlich, sondern **falsch**: Eine Spalte, die
 * ausgeschlossene Tags nennt und davon nichts zeigt, behauptet eine Regel, die
 * sie nicht hat.
 *
 * ## Was nicht dasteht, schränkt nicht ein
 *
 * Eine Achse auf ihrem Neutralwert erscheint hier **nicht**. Das ist die
 * Leseregel dieser Fläche und der Grund, warum sie kurz bleibt: Was hier steht,
 * engt ein; was fehlt, lässt alles durch. Im Formular steht daneben, welche
 * Achsen fehlen (`showNeutral`) — dort wird gewählt, und dort muss der
 * Unterschied zwischen „Alle" und „trifft alles" ausgesprochen werden.
 *
 * ## Wie sich die Achsen unterscheiden — ohne Farbe
 *
 * | Achse | Symbol | Wort |
 * |---|---|---|
 * | erforderliche Tags | Etikett | „Mindestens eines von" / „Alle von" |
 * | ausgeschlossene Tags | durchgestrichener Kreis | „Ohne" |
 * | Status | Quadrat | „Status" |
 * | Erledigt | Haken / Kreis | „Nur erledigte" / „Nur unerledigte" |
 * | Exportstatus | Pfeil nach unten | „Noch nicht abgerechnet" / „Abgerechnet" |
 *
 * Symbol **und** Wort, nie nur die Farbe (SC 1.4.1).
 *
 * ## Warum die Exportachse seit T-094 kein Buchungsetikett mehr trägt (E-059)
 *
 * Bis T-094 borgte sich diese Achse `ExportStatusBadge` — dasselbe Etikett,
 * das an jeder Buchung steht. Die Absicht war richtig: Der Exportstatus ist
 * die Unterscheidung, um die sich Takt dreht, und zwei Aussehen dafür wären
 * zwei Sprachen.
 *
 * Das Etikett brachte aber sein **Wort** mit, und das Wort gehört der Buchung:
 * „Offen". Im Regelformular stand damit drei Zeilen unter dem Optionsknopf
 * „Noch nicht abgerechnet" eine Vorschau, die „Offen" sagte — dieselbe Wahl,
 * zwei Wörter. E-059 hat genau das abgeschafft, und zwar zugunsten des
 * Formularworts.
 *
 * Eine Regel ist auch keine Buchung: Sie **fragt** nach dem Exportstatus ihrer
 * Buchungen. Ein Etikett „Exportiert" am Spaltenkopf ließ sich lesen als „diese
 * Spalte ist exportiert". Die Achse zeichnet deshalb wie jede andere Textachse
 * — Symbol der Achse plus ihr Wort. Das Buchungsetikett bleibt, wo Buchungen
 * stehen.
 *
 * ## Der leere Ordner steht am Ordner (E-057, T-083, T-087)
 *
 * Nennt eine Regel Ordner, in denen kein einziges Tag liegt, ist das kein
 * „trifft gerade nichts", sondern eine Einschränkung, die niemand erfüllen
 * kann — ein Einrichtungsfehler. Er wird hier **am betroffenen Chip** gezeigt
 * und nicht bloß als Satz darunter: Die Frage des Benutzers lautet „welcher
 * Ordner", und ein Satz, der sie nicht beantwortet, schickt ihn suchen.
 *
 * **Am betroffenen Chip, nicht an der Achse (T-087).** Bis T-087 trug jeder
 * Ordnerchip der erforderlichen Achse die Markierung, sobald irgendeiner leer
 * war — bei „Ordner Nord **oder** Ordner Ost" zeigte die Oberfläche auf beide
 * und damit auf den falschen. Markiert wird jetzt, wessen Kennung in
 * `resolved.emptyRuleFolderIds` steht, und der Satz darunter nennt genau diese
 * Ordner beim Namen, in der Reihenfolge der Regel.
 *
 * Die Auskunft dazu (`reach`) ist freiwillig. Wo sie fehlt — auf der
 * Musterseite, im Formularentwurf, den noch keine Route gesehen hat —, zeichnet
 * diese Fläche wie bisher. Sie **rät nicht**: Wie viele Tags in einem Ordner
 * liegen, weiß allein der Dienst.
 *
 * ## Der Hilfssatz an der Exportachse (W-7 aus R-2a, T-102)
 *
 * Eine Spalte „Abgerechnet" enthält Todos, an deren Buchungen „Nicht
 * abgerechnet" stehen kann (E-047, E-050) — zwei fast gleiche Wörter mit
 * entgegengesetzter Wirkung. Ausgesprochen wurde das bis T-102 nur im
 * Regelformular, also dort, wo **gewählt** wird. Wer eine so benannte Spalte
 * erbt oder nur ansieht, kam an der Stelle nie vorbei. Der Satz steht deshalb
 * jetzt auch hier, wo **gelesen** wird; er kommt als `note` an der Achse aus
 * `describeRule` und wird hier nicht formuliert.
 *
 * Im Formular selbst bleibt er weg (`showAxisNotes={false}`): Dort steht die
 * ausführliche Fassung drei Zeilen darüber am Optionsknopf, und zweimal
 * dasselbe in zwei Wortlauten ist genau der Fehler, den E-059 abgeschafft hat.
 */

export interface RuleSummaryProps {
  readonly description: RuleDescription;
  /** Auch die neutralen Achsen aufzählen. Für das Formular. */
  readonly showNeutral?: boolean;
  /**
   * Was an dieser Fläche steht, wenn die Regel keine Bedingung nennt.
   *
   * Kein Vorgabetext: „Diese Spalte bleibt leer" und „Dieser Pool bleibt leer"
   * sagen dasselbe an verschiedenen Orten, und ein Satz, der beides zugleich
   * sein will, sagt keines von beiden.
   */
  readonly emptyText: string;
  /**
   * Was die Regel nach dem Auflösen ihrer Ordner ergibt — soweit bekannt
   * (E-057). Fehlt sie, bleibt der leere Ordner ungenannt, statt geraten zu
   * werden.
   */
  readonly reach?: RuleReach;
  /**
   * Hilfssätze an einzelnen Achsen mitzeichnen (W-7). Vorgabe: ja.
   *
   * `false` setzt, wer denselben Satz bereits an seiner Bedienfläche zeigt —
   * heute allein das Regelformular.
   */
  readonly showAxisNotes?: boolean;
  readonly size?: "sm" | "md";
  readonly className?: string;
}

const AXIS_ICON: Readonly<Record<RuleAxis["id"], IconName>> = {
  required: "tag",
  excluded: "slash-circle",
  status: "square",
  completion: "check",
  export: "download",
};

function ChipView({
  chip,
  size,
  empty = false,
}: {
  readonly chip: RuleChip;
  readonly size: "sm" | "md";
  /** Dieser Ordner enthält kein Tag (E-057). Nur an erforderlichen Ordnern. */
  readonly empty?: boolean;
}) {
  if (chip.kind === "tag") {
    return <TagChip size={size} label={chip.label} path={chip.path} />;
  }
  if (chip.kind === "status") {
    return (
      <span className="rule-summary__status">
        <Icon name="square" size={11} />
        {chip.label}
      </span>
    );
  }
  return (
    <span className={cx("rule-summary__folder", empty && "rule-summary__folder--empty")}>
      {/*
        Ein anderes Symbol und ein eigener Rand, nicht nur eine andere Farbe
        (SC 1.4.1): Der leere Ordner traegt das Warndreieck, der gefuellte den
        Ordner. Der Zusatz „kein Tag darin" steht als Wort daneben, damit die
        Unterscheidung auch vorgelesen ankommt.
      */}
      <Icon name={empty ? "alert-triangle" : "folder"} size={11} />
      {chip.label}
      {empty ? (
        <span className="rule-summary__folder-note"> — kein Tag darin</span>
      ) : chip.withSubfolders === true ? (
        <span className="rule-summary__folder-note"> mit Unterordnern</span>
      ) : null}
    </span>
  );
}

export function RuleSummary({
  description,
  showNeutral = false,
  emptyText,
  reach,
  showAxisNotes = true,
  size = "sm",
  className,
}: RuleSummaryProps) {
  /*
   * Nur die **erforderlichen** Ordner werden markiert. Ein ausgeschlossener
   * Ordner ohne Tags schliesst nichts aus — er engt nicht ein, sondern laesst
   * in Ruhe, und eine Warnung darueber waere eine Warnung ohne Folge (E-057).
   */
  const emptyFolders = reach?.kind === "empty-folder" ? reach.folders : null;

  if (description.isEmpty) {
    return (
      <p className={cx("rule-summary", `rule-summary--${size}`, "rule-summary--empty", className)}>
        <Icon name="alert-triangle" size={12} />
        {emptyText}
      </p>
    );
  }

  /*
   * Je Chip statt je Achse (T-087): markiert wird, wessen Kennung der Dienst
   * genannt hat. Ein Eintrag ohne Kennung — der Dienst meldet einen
   * unaufgeloesten Term, ohne einen Ordner dazu zu nennen — markiert keinen
   * Chip; der Satz darunter steht trotzdem, denn der Befund gilt.
   */
  const emptyFolderIds = new Set<Id>(
    (emptyFolders ?? []).flatMap((folder) => (folder.id === null ? [] : [folder.id])),
  );

  return (
    <div className={cx("rule-summary", `rule-summary--${size}`, className)}>
      {description.axes.map((axis) => (
        <span key={axis.id} className={cx("rule-summary__axis", `rule-summary__axis--${axis.id}`)}>
          <span className="rule-summary__axis-label">
            <Icon name={AXIS_ICON[axis.id]} size={11} />
            {axis.label}
          </span>
          {axis.text === null ? null : <span className="rule-summary__value">{axis.text}</span>}
          {axis.chips.map((chip, index) => (
            <ChipView
              key={`${chip.kind}-${chip.label}-${String(index)}`}
              chip={chip}
              size={size}
              empty={
                axis.id === "required" &&
                chip.kind === "folder" &&
                chip.folderId !== undefined &&
                emptyFolderIds.has(chip.folderId)
              }
            />
          ))}
        </span>
      ))}

      {/*
        Die Hilfssätze der Achsen, als eigene Zeilen unter der Aufzählung
        (W-7). Sie stehen nicht **in** der Achse: Dort läuft die Zeile aus
        Symbol, Wort und Chips, und ein ganzer Satz darin risse sie
        auseinander. Symbol `info` und nicht `alert-triangle` — das hier ist
        kein Einrichtungsfehler wie der leere Ordner darunter, sondern eine
        Auskunft.
      */}
      {showAxisNotes
        ? description.axes.map((axis) =>
            axis.note === undefined ? null : (
              <p key={`note-${axis.id}`} className="rule-summary__note">
                <Icon name="info" size={11} />
                {axis.note}
              </p>
            ),
          )
        : null}

      {emptyFolders === null ? null : (
        <p className="rule-summary__unreachable">
          <Icon name="alert-triangle" size={11} />
          Kein Tag in {emptyFolderNames(emptyFolders)} —{" "}
          {emptyFolders.length === 1 ? "diese Bedingung kann" : "diese Bedingungen können"} kein
          Todo erfüllen, und die Regel trifft damit nichts.
        </p>
      )}

      {showNeutral && description.neutral.length > 0 ? (
        <p className="rule-summary__neutral">
          <Icon name="info" size={11} />
          Ohne Einschränkung: {description.neutral.map((axis) => axis.label).join(", ")}. Diese
          Bedingungen lassen alles durch, was die übrigen übrig lassen — sie treffen nichts von
          sich aus.
        </p>
      ) : null}
    </div>
  );
}
