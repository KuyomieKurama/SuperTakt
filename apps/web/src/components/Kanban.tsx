import type { ReactNode } from "react";
import type { CalendarDay, ForeignText } from "../api/types";
import { cx } from "../lib/cx";
import { DONE_FLAG_LABEL, doneFlagState } from "../lib/labels";
import { DeadlineFlag } from "./DeadlineFlag";
import { ExportStatusMarker, EXPORT_STATE, type ExportDisplayState } from "./ExportStatus";
import { Icon } from "./Icon";
import { Menu, type MenuEntry } from "./Menu";
import { IconButton } from "./Primitives";
import { TagChip } from "./Tag";
import { foreignText, quotedName } from "../lib/foreign";
import { Foreign } from "./Foreign";

/**
 * Kanban-Board — A-5.1, A-5.3 bis A-5.6, E-054.
 *
 * ## Warum hier nichts mehr gezogen wird
 *
 * Bis E-054 war eine Spalte ein Statuswert, und Ziehen setzte diesen Wert. Seit
 * E-054 ist eine Spalte eine **Regel**, seit E-055 eine über fünf Bedingungen:
 * erforderliche Tags, ausgeschlossene Tags, Status, „Erledigt" und
 * Exportstatus. Eine Regel lässt sich nicht durch Verschieben umkehren, ohne
 * Tags zu setzen — und dass Takt von sich aus Tags setzt, hat der Auftraggeber
 * ausgeschlossen. A-5.2 und I-14 sind damit
 * aufgehoben; `draggable`, `DataTransfer` und die Tastaturalternative dazu
 * (SC 2.5.7) stehen deshalb nicht mehr in dieser Datei. Was es nicht gibt,
 * braucht keine Ersatzbedienung.
 *
 * Der **Status** bleibt als Eigenschaft am Todo. Er steht auf der Karte, damit
 * niemand ihn auf dem Board sucht, und geändert wird er dort, wo er hingehört:
 * in der Detailansicht (S-03) und in der Liste (S-02).
 *
 * ## Eine Karte kann in mehreren Spalten stehen
 *
 * Bei Status war das unmöglich, bei Regeln ist es der Normalfall: Zwei
 * zutreffende Regeln treffen beide zu. Wer eine Karte zweimal sieht und nicht
 * weiß warum, hält es für einen Fehler — deshalb trägt jedes Vorkommen ein
 * Etikett, das die anderen Spalten **beim Namen nennt** und sie auf Wunsch
 * hervorhebt.
 */

export interface KanbanTagRef {
  readonly label: ForeignText;
  readonly path?: readonly ForeignText[];
}

/**
 * Zusammenfassung der Exportstaende aller Buchungen eines Todos.
 *
 * Gezaehlt wird nach **Anzeigezustand**, damit "erneut offen" auf der Karte
 * sichtbar bleibt (R-10) und "nicht abgerechnet" nicht als Export durchgeht
 * (E-050). Fachlich sind "offen" und "erneut offen" derselbe Wert, ebenso
 * "exportiert" und "nicht abgerechnet" (E-032); wer aus dieser
 * Zusammenfassung eine Exportauswahl ableitet, muss die jeweils zwei
 * addieren.
 */
export type ExportSummary = Readonly<Record<ExportDisplayState, number>>;

/**
 * Dieselbe Karte in mehreren Spalten (E-054) — aus Sicht **eines** Vorkommens.
 *
 * `otherColumns` sind die übrigen Spalten, in denen dieselbe Karte steht, ohne
 * die eigene. Die Liste kommt aus `GET /board` (`appearances`) und wird nicht
 * aus den geladenen Seiten zusammengezählt: Eine Karte kann in Spalte A auf
 * Seite 1 und in Spalte B auf Seite 2 stehen, und eine Auskunft, die nur die
 * geladene Seite kennt, behauptete dann, sie stünde nur einmal da.
 */
export interface KanbanAppearance {
  /**
   * **Fremder Text, Glied für Glied** (O-AT, T-133): Es sind die Namen von
   * Regeln, und sie stehen auf der Karte. Bis T-133 hieß dieses Feld
   * `readonly string[]` — die Behandlung an der Anzeigestelle war damit
   * freiwillig, und `scripts/proof-foreign.mjs` konnte sie nicht einfordern.
   * Die Marke sitzt am Element und nicht an der Reihe; der Nachweis liest sie
   * dort (`declaresForeign`).
   */
  readonly otherColumns: readonly ForeignText[];
}

export interface KanbanCardData {
  readonly id: string;
  readonly title: ForeignText;
  readonly callNumber: ForeignText | null;
  readonly tags: readonly KanbanTagRef[];
  /** Bereits formatierte Gesamtdauer, zum Beispiel "4:15 h". */
  readonly trackedDisplay: string;
  readonly exportSummary: ExportSummary;
  readonly timerRunning: boolean;
  /**
   * Der Status des Todos (A-5.4) — eine Eigenschaft, **keine** Spalte mehr
   * (E-054). Er steht auf der Karte, weil er sonst auf dem Board nirgends
   * mehr vorkäme und man ihn für abgeschafft hielte.
   */
  readonly statusName: ForeignText;
  /**
   * Erledigt-Kennzeichen des Todos (A-2.4).
   *
   * Es haengt an keiner Spalte — aber eine Spalte darf seit E-055 danach
   * **fragen**. Steht die Erledigt-Bedingung einer Regel neutral, sagt das
   * Kennzeichen nichts ueber die Zugehoerigkeit und nur etwas ueber die
   * Sichtbarkeit; sagt sie etwas, entscheidet es die Zugehoerigkeit mit.
   */
  readonly done: boolean;
  /**
   * "Erledigt" wurde von der Anwendung selbst aufgehoben, weil jemand den
   * Timer gestartet hat (A-2.5). Der Zustand bleibt sichtbar, bis der Benutzer
   * das Kennzeichen selbst wieder setzt — sonst wirkt der Wechsel unerklaert.
   */
  readonly reactivated?: boolean;
  /**
   * Die **Frist** des Todos (A-19.4). `null` heißt: keine — dann steht auf der
   * Karte dazu **nichts** (A-19.5).
   *
   * Eine Karte ist das Todo, ohne es zu öffnen; das ist der Fall, den A-19.4
   * meint. A-5.5 macht die Karte zur Arbeitsfläche, und eine Frist, die man auf
   * dem Board nicht sieht, wird auf dem Board nicht eingehalten.
   */
  readonly dueDate: CalendarDay | null;
  /** Gesetzt, wenn diese Karte in mehr als einer Spalte steht. */
  readonly appearance?: KanbanAppearance;
}

export interface KanbanCardProps {
  readonly card: KanbanCardData;
  readonly entries: readonly MenuEntry[];
  readonly onOpen: () => void;
  readonly onToggleTimer: () => void;
  /**
   * Hebt alle Vorkommen derselben Karte hervor. Nur belegt, wenn die Karte
   * mehrfach vorkommt; ohne Mehrfachvorkommen gibt es nichts zu verbinden.
   */
  readonly onHighlight?: () => void;
  /** Dieses Vorkommen gehoert zur gerade hervorgehobenen Karte. */
  readonly highlighted?: boolean;
  /**
   * Heute, im Tagesbegriff aus E-025 — **einer je Ansicht** und nicht einer je
   * Karte. So wechseln alle Karten des Boards um Mitternacht im selben
   * Augenblick, und es läuft ein Zeitgeber statt einem je Spalte.
   */
  readonly today: CalendarDay;
}

export function KanbanCard({
  card,
  entries,
  onOpen,
  onToggleTimer,
  onHighlight,
  highlighted = false,
  today,
}: KanbanCardProps) {
  const cardFlagState = doneFlagState(card.done, card.reactivated === true);
  const others = card.appearance?.otherColumns ?? [];

  return (
    <article
      className={cx(
        "kcard",
        card.timerRunning && "kcard--running",
        card.done && "kcard--done",
        card.reactivated === true && "kcard--reactivated",
        highlighted && "kcard--linked",
      )}
    >
      <div className="kcard__main">
        <div className="kcard__top">
          {card.callNumber !== null ? (
            <span className="kcard__call mono">
              <Foreign value={card.callNumber} />
            </span>
          ) : null}
          {/* Das Erledigt-Kennzeichen steht auf jeder Karte, auch wenn es
              "offen" lautet. Waere es nur bei "erledigt" da, muesste man es
              aus der Spalte erschliessen — und das geht nicht: Eine Spalte ist
              eine Regel ueber fuenf Achsen (E-055), und nur **eine** davon
              fragt nach "Erledigt". Ob diese Spalte es tut, steht der Karte
              nicht an; in der weit ueberwiegenden Zahl der Faelle sagt die
              Regel darueber nichts. */}
          <span className={cx("kcard__flag", `kcard__flag--${cardFlagState}`)}>
            <Icon
              name={card.done ? "check" : card.reactivated === true ? "rotate-ccw" : "circle"}
              size={12}
            />
            {/* Die Woerter stehen in `lib/labels.ts`, damit die Karte nicht
                etwas anderes sagt als die Zeile daneben (Befund C-23). */}
            {DONE_FLAG_LABEL[cardFlagState]}
          </span>
          {/*
            Die dritte Marke, und sie ist die einzige, die **fehlen** darf: Ein
            Todo ohne Frist hat keinen dieser Zustände (A-19.5). Damit trägt die
            Mehrzahl der Karten weiterhin zwei Marken und nicht drei — die
            Auflage, unter der T-144 die dritte Sorte überhaupt für tragbar
            hält.
          */}
          <DeadlineFlag dueDate={card.dueDate} today={today} className="kcard__deadline" />
        </div>

        <h4 className="kcard__title">
          <button type="button" className="kcard__open" onClick={onOpen}>
            <Foreign value={card.title} />
          </button>
        </h4>

        {others.length > 0 ? (
          <button
            type="button"
            className={cx("kcard__also", highlighted && "kcard__also--on")}
            aria-pressed={highlighted}
            onClick={onHighlight}
            title={`Dieselbe Karte steht auch in: ${others.map(foreignText).join(", ")}`}
          >
            <Icon name="copy" size={12} />
            <span>
              Steht auch in {others.length === 1 ? "" : `${String(others.length)} Spalten: `}
              {others.map((name) => `${quotedName(name)}`).join(", ")}
            </span>
          </button>
        ) : null}

        {card.tags.length > 0 ? (
          <div className="kcard__tags">
            {card.tags.map((tag) => (
              <TagChip
                key={`${tag.path?.join("/") ?? ""}/${tag.label}`}
                label={tag.label}
                size="sm"
                {...(tag.path === undefined ? {} : { path: tag.path })}
              />
            ))}
          </div>
        ) : null}

        <div className="kcard__foot">
          <ExportSummaryStrip summary={card.exportSummary} />
          <span className="kcard__tracked tabular">
            <Icon name="clock" size={13} />
            {card.trackedDisplay}
          </span>
        </div>

        {/* Der Status, sichtbar und nicht anklickbar: Auf dem Board gibt es
            ihn zu sehen, geaendert wird er in S-02 und S-03. Das Kartenmenue
            fuehrt dorthin. */}
        <p className="kcard__status">
          <span className="kcard__status-label">Status</span>
          <Foreign className="kcard__status-value" value={card.statusName} />
        </p>
      </div>

      <div className="kcard__actions">
        <IconButton
          /* A-5.6 bleibt: Der Timer laesst sich weiterhin von der Karte aus
             starten. E-030, Befund C-17: Der Timer wird gestartet, nicht der
             Bereich. */
          label={
            card.timerRunning
              ? `Timer für ${quotedName(card.title)} stoppen`
              : `Timer für ${quotedName(card.title)} starten`
          }
          icon={card.timerRunning ? "square" : "play"}
          size="sm"
          variant={card.timerRunning ? "danger" : "secondary"}
          onClick={onToggleTimer}
        />
        <Menu
          trigger={<Icon name="more-horizontal" size={16} />}
          triggerLabel={`Aktionen für ${foreignText(card.title)}`}
          triggerClassName="kcard__menu"
          align="end"
          entries={entries}
        />
      </div>
    </article>
  );
}

export interface ExportSummaryStripProps {
  readonly summary: ExportSummary;
  readonly className?: string;
}

/**
 * Zeigt auf engem Raum, wie die Buchungen eines Todos beim Export stehen.
 * Form und Zahl tragen die Aussage, die Farbe verstaerkt sie nur.
 */
export function ExportSummaryStrip({ summary, className }: ExportSummaryStripProps) {
  /* Reihenfolge nach Dringlichkeit: was noch Geld bringt zuerst, was
     abgeschlossen ist zuletzt. */
  const order: readonly ExportDisplayState[] = ["open", "reopened", "exported", "not_billed"];
  const present = order.filter((state) => summary[state] > 0);

  if (present.length === 0) {
    return <span className={cx("summary-strip summary-strip--empty", className)}>keine Buchung</span>;
  }

  return (
    <span className={cx("summary-strip", className)}>
      {present.map((state) => (
        <span key={state} className="summary-strip__item">
          <ExportStatusMarker state={state} labelled={false} />
          <span aria-hidden>{summary[state]}</span>
          <span className="visually-hidden">
            {summary[state]} Buchungen: {EXPORT_STATE[state].label}
          </span>
        </span>
      ))}
    </span>
  );
}

export interface KanbanColumnProps {
  readonly title: ForeignText;
  /** Geladene Karten dieser Spalte. */
  readonly count: number;
  /**
   * Alle Mitglieder der Spalte, auch die noch nicht geladenen. Steht die Zahl
   * nicht im Kopf, sieht eine geblaetterte Spalte aus wie eine kurze.
   */
  readonly total?: number;
  /**
   * Wie viele der geladenen Todos erledigt sind. Ob das etwas ueber die Spalte
   * aussagt, haengt an ihrer Regel: Nur wenn deren Erledigt-Bedingung etwas
   * sagt, ist Fertigsein hier eine Bedingung und nicht bloss eine Eigenschaft
   * der Karten (E-055).
   */
  readonly doneCount?: number;
  /** Die Regel in Worten: warum diese Karten hier stehen (E-054). */
  readonly rule?: ReactNode;
  readonly entries: readonly MenuEntry[];
  readonly onAdd?: () => void;
  /** Beschriftung des Pluszeichens, falls "Todo in X anlegen" nicht passt. */
  readonly addLabel?: string;
  readonly children: ReactNode;
}

export function KanbanColumn({
  title,
  count,
  total,
  doneCount = 0,
  rule,
  entries,
  onAdd,
  addLabel,
  children,
}: KanbanColumnProps) {
  const full = total ?? count;
  const partial = full > count;
  const accessibleName = [
    `Spalte ${foreignText(title)}`,
    partial ? `${String(count)} von ${String(full)} Karten geladen` : `${String(full)} Karten`,
    doneCount === 0 ? null : `davon ${String(doneCount)} erledigt`,
  ]
    .filter((part): part is string => part !== null)
    .join(", ");

  return (
    <section className="kcolumn" aria-label={accessibleName}>
      <header className="kcolumn__head">
        <div className="kcolumn__heading">
          <h3 className="kcolumn__title">
            <Foreign value={title} />
          </h3>
          {doneCount > 0 ? (
            <p className="kcolumn__done-count" aria-hidden>
              <Icon name="check" size={11} />
              {doneCount} erledigt
            </p>
          ) : null}
        </div>
        <span className="kcolumn__count" aria-hidden>
          {partial ? `${String(count)}/${String(full)}` : full}
        </span>
        {onAdd !== undefined ? (
          <IconButton
            label={addLabel ?? `Todo in ${foreignText(title)} anlegen`}
            icon="plus"
            size="sm"
            onClick={onAdd}
          />
        ) : null}
        <Menu
          trigger={<Icon name="more-horizontal" size={16} />}
          triggerLabel={`Spalte ${foreignText(title)} verwalten`}
          triggerClassName="kcolumn__menu"
          align="end"
          entries={entries}
        />
      </header>
      {rule === undefined ? null : <div className="kcolumn__rule">{rule}</div>}
      <div className="kcolumn__body">{children}</div>
    </section>
  );
}
