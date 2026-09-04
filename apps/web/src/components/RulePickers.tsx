import { useId, useMemo, useState, type ReactNode } from "react";
import type { Id } from "../api/types";
import { cx } from "../lib/cx";
import { plural } from "../lib/format";
import { Icon } from "./Icon";
import { Button, InlineMessage, Spinner } from "./Primitives";
import { Foreign } from "./Foreign";

/**
 * Takt — die beiden Chip-Auswahlen des Regelformulars (S-11, A-4.4, E-055).
 *
 * ## Warum sie hier stehen und nicht mehr im Dialog
 *
 * Zwei Gründe, und der zweite wiegt schwerer.
 *
 * **1. Drei Zustände statt einem** (B-5 aus R-2, Abschnitt 15). Ordner und
 * Statuswerte kommen aus derselben Quelle wie die Tags — dem
 * `StructureContext`. Solange sie lädt und wenn sie fehlgeschlagen ist, sind
 * beide Listen leer, und bis T-091 schrieb das Formular dann hin: „Es gibt noch
 * keinen Ordner." Das ist eine Behauptung über den Bestand, und sie war in
 * genau dem Moment unbelegt, in dem sie erschien. Der Benutzer hat Ordner; er
 * legt daraufhin eine Regel ohne an. Nebenan stand die ganze Zeit ein
 * `TagInput`, das dieselbe Quelle richtig in drei Ausgänge trennt — der Maßstab
 * steht in seinem Kopf ausgeschrieben: „eine Fehlermeldung ohne
 * Wiederholungsknopf ist eine Sackgasse."
 *
 * **2. Sichtbar ohne laufenden Dienst.** Ein Baustein, dessen Zustände man nur
 * in der laufenden Anwendung sieht, wird nicht abgenommen, sondern geglaubt.
 * Beide nehmen ihre Daten deshalb als {@link PickerSource} entgegen und holen
 * sie sich nirgends selbst; die Musterseite stellt lädt, Fehler, leer und
 * gefüllt nebeneinander.
 *
 * ## Suche statt Wolke (A-4.4)
 *
 * A-4.3 erlaubt beliebig tiefe Ordnerbäume, A-4.4 verlangt, dass Navigation und
 * Verwaltung trotzdem übersichtlich bleiben. Eine flache Wolke aller Ordner mit
 * vollem Pfad ist bei dreißig Ordnern länger als der Dialog — und E-022 hat die
 * Größenordnung gemessen, gegen die gebaut werden muss: Tiefe 4 bis 10, bis
 * 19 530 Ordner.
 *
 * Ab {@link SEARCH_FROM} Ordnern steht deshalb ein Suchfeld darüber, das über
 * den **ganzen Pfad** filtert („kunden ost" findet „Kunden / Ost"). Zwei
 * Regeln halten es ehrlich:
 *
 *  - **Gewähltes verschwindet nie.** Ein Ordner, der in der Regel steht, wird
 *    immer gezeigt, auch wenn die Suche ihn nicht trifft. Sonst sähe der
 *    Benutzer eine Regel ohne die Bedingung, die er gerade gesetzt hat.
 *  - **Die Kürzung wird ausgesprochen.** Mehr als {@link MAX_CHIPS} Chips
 *    zeichnet niemand; darunter steht dann, wie viele fehlen und was zu tun
 *    ist. Eine stille Kürzung behauptet Vollständigkeit, die sie nicht hat.
 *
 * Die volle Bauform — eine Kombobox mit Baumpfad wie {@link TagInput} — bleibt
 * die richtige Antwort auf A-4.4 und ist als eigene Aufgabe gemeldet. Was hier
 * steht, ist die Hälfte davon, die ohne neue Bauform auskommt.
 */

/** Ab so vielen Einträgen bekommt die Ordnerauswahl ein Suchfeld. */
const SEARCH_FROM = 8;

/** Mehr Chips liest niemand; die Zahl der übrigen steht darunter. */
const MAX_CHIPS = 60;

/**
 * Die drei Zustände einer geladenen Liste — dieselben wie bei `TagInput`.
 *
 * `error` trägt die Meldung des Dienstes und keinen eigenen Satz: Was
 * schiefging, weiß der Aufrufer, und ein hier erfundener Text wäre die zweite
 * Fassung derselben Auskunft.
 */
export type PickerSource<T> =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready"; readonly items: readonly T[] };

export interface FolderOption {
  readonly id: Id;
  /** Der Pfad von der Wurzel bis zum Ordner, zum Beispiel `["Kunden", "Ost"]`. */
  readonly path: readonly string[];
}

export interface StatusOption {
  readonly id: Id;
  readonly name: string;
}

/* ==================================================================== */
/* Der gemeinsame Rahmen                                                */
/* ==================================================================== */

/**
 * Beschriftung, Zustand, Hilfetext — und dazwischen die Chips.
 *
 * Der Rahmen bleibt in **jedem** Zustand stehen. Ein Feld, das beim Laden
 * verschwindet und danach wieder auftaucht, lässt das Formular springen; wer
 * gerade tippt, verliert dabei den Ort.
 */
function PickerField({
  label,
  labelId,
  hint,
  source,
  onRetry,
  emptyText,
  loadingText,
  errorTitle,
  toolbar,
  children,
}: {
  readonly label: string;
  readonly labelId: string;
  readonly hint?: string;
  readonly source: PickerSource<unknown>;
  readonly onRetry: () => void;
  readonly emptyText: string;
  readonly loadingText: string;
  readonly errorTitle: string;
  /** Steht zwischen Beschriftung und Chips — heute nur das Suchfeld. */
  readonly toolbar?: ReactNode;
  readonly children: ReactNode;
}) {
  const isEmpty = source.status === "ready" && source.items.length === 0;

  return (
    <div className="field">
      <span className="field__label" id={labelId}>
        {label}
      </span>

      {/*
        Das Suchfeld steht **zwischen** Beschriftung und Chips und nicht
        darueber: Sonst waere das erste, was Tabulator und Vorlesehilfe
        erreichen, ein Feld ohne sichtbare Beschriftung, und die Ueberschrift
        „Erforderliche Ordner" kaeme erst danach.
      */}
      {source.status === "ready" ? toolbar : null}

      {source.status === "error" ? (
        <InlineMessage
          tone="danger"
          title={errorTitle}
          action={
            <Button size="sm" iconStart="rotate-ccw" onClick={onRetry}>
              Erneut versuchen
            </Button>
          }
        >
          {source.message} Ohne die Liste lässt sich hier nichts wählen.
        </InlineMessage>
      ) : (
        <div
          className={cx("tag-picker", source.status === "loading" && "tag-picker--busy")}
          role="group"
          aria-labelledby={labelId}
          aria-busy={source.status === "loading"}
        >
          {source.status === "loading" ? (
            /*
              Der Spinner bleibt ohne `label`: Der Satz steht sichtbar
              daneben, und ein zweiter versteckter darueber liesse eine
              Vorlesehilfe „Ordner werden geladen" zweimal sagen. Die
              Ansage uebernimmt die Zeile selbst.
            */
            <p className="tag-picker__waiting" role="status">
              <Spinner size={14} />
              {loadingText}
            </p>
          ) : isEmpty ? (
            <p className="field__hint">{emptyText}</p>
          ) : (
            children
          )}
        </div>
      )}

      {hint === undefined ? null : <p className="field__hint">{hint}</p>}
    </div>
  );
}

/* ==================================================================== */
/* Ordner                                                               */
/* ==================================================================== */

/** Vergleichsform eines Pfades: klein geschrieben, Trenner als Leerzeichen. */
function searchKey(path: readonly string[]): string {
  return path.join(" ").toLocaleLowerCase("de");
}

export interface FolderPickerProps {
  readonly label: string;
  readonly hint: string;
  readonly source: PickerSource<FolderOption>;
  readonly onRetry: () => void;
  /** Kennungen der bereits gewählten Ordner. */
  readonly selected: ReadonlySet<Id>;
  readonly onToggle: (folderId: Id) => void;
}

export function FolderPicker({
  label,
  hint,
  source,
  onRetry,
  selected,
  onToggle,
}: FolderPickerProps) {
  const labelId = useId();
  const searchId = useId();
  const [query, setQuery] = useState("");

  const all = source.status === "ready" ? source.items : [];
  const needle = query.trim().toLocaleLowerCase("de");

  /*
   * Gefiltert wird über den ganzen Pfad und nicht über den letzten Namen:
   * „Nord" gibt es unter „Kunden" und unter „Lieferanten", und wer den einen
   * meint, tippt ihn mit seinem Ordner. Gewähltes bleibt immer dabei — siehe
   * den Kopf dieser Datei.
   */
  const { shown, hidden } = useMemo(() => {
    const matching =
      needle.length === 0
        ? all
        : all.filter((folder) => selected.has(folder.id) || searchKey(folder.path).includes(needle));
    return { shown: matching.slice(0, MAX_CHIPS), hidden: Math.max(0, matching.length - MAX_CHIPS) };
  }, [all, needle, selected]);

  const withSearch = source.status === "ready" && all.length >= SEARCH_FROM;

  const search = withSearch ? (
    <div className="picker-search">
      <label className="visually-hidden" htmlFor={searchId}>
        {label} durchsuchen
      </label>
      <span className="picker-search__icon" aria-hidden>
        <Icon name="search" size={14} />
      </span>
      <input
        id={searchId}
        type="search"
        className="field__input"
        value={query}
        placeholder="Ordner oder Pfad suchen …"
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
      />
    </div>
  ) : null;

  return (
    <>
      <PickerField
        label={label}
        labelId={labelId}
        hint={hint}
        source={source}
        onRetry={onRetry}
        loadingText="Ordner werden geladen …"
        errorTitle="Die Ordner ließen sich nicht laden"
        emptyText="Es gibt noch keinen Ordner."
        {...(search === null ? {} : { toolbar: search })}
      >
        {shown.length === 0 ? (
          <p className="field__hint">Kein Ordner passt zu „{query.trim()}“.</p>
        ) : (
          shown.map((folder) => {
            const active = selected.has(folder.id);
            return (
              <button
                key={folder.id}
                type="button"
                className={cx("folder-chip", active && "folder-chip--on")}
                aria-pressed={active}
                onClick={() => onToggle(folder.id)}
              >
                <Icon name="folder" size={12} />
                {folder.path.join(" / ")}
              </button>
            );
          })
        )}
      </PickerField>

      {hidden > 0 ? (
        <p className="field__hint">
          {plural(hidden, "Weiterer Ordner passt", "Weitere Ordner passen")} ebenfalls. Tippen Sie
          genauer.
        </p>
      ) : null}
    </>
  );
}

/* ==================================================================== */
/* Status                                                               */
/* ==================================================================== */

/**
 * Die Status einer Regel — mehrere möglich, nichts gewählt heißt „Alle".
 *
 * Keine Optionszeile wie bei Erledigt und Exportstatus: Dort gibt es drei feste
 * Werte und genau einen davon, hier eine Menge, die der Benutzer selbst
 * verwaltet. Und keine Mehrfachauswahlliste: Bei einer Handvoll Status ist eine
 * aufklappbare Liste ein zusätzlicher Klick vor einer Antwort, die ohnehin
 * hinpasst.
 *
 * Umschaltknöpfe mit `aria-pressed` und nicht Ankreuzfelder, weil sie dieselbe
 * Bauform wie die Ordnerauswahl darüber haben — dieselbe Frage soll nicht
 * zweimal anders aussehen.
 */
export interface StatusPickerProps {
  readonly source: PickerSource<StatusOption>;
  readonly onRetry: () => void;
  readonly value: readonly Id[];
  readonly onChange: (next: readonly Id[]) => void;
  /** Der Satz unter dem Feld. Er hängt am gewählten Umfang, nicht am Zustand. */
  readonly hint: string;
}

export function StatusPicker({ source, onRetry, value, onChange, hint }: StatusPickerProps) {
  const labelId = useId();

  return (
    <PickerField
      label="Status"
      labelId={labelId}
      hint={hint}
      source={source}
      onRetry={onRetry}
      loadingText="Statuswerte werden geladen …"
      errorTitle="Die Statuswerte ließen sich nicht laden"
      emptyText="Es gibt noch keinen Statuswert."
    >
      {(source.status === "ready" ? source.items : []).map((status) => {
        const active = value.includes(status.id);
        return (
          <button
            key={status.id}
            type="button"
            className={cx("folder-chip", active && "folder-chip--on")}
            aria-pressed={active}
            onClick={() =>
              onChange(active ? value.filter((id) => id !== status.id) : [...value, status.id])
            }
          >
            <Icon name="square" size={12} />
            <Foreign value={status.name} />
          </button>
        );
      })}
    </PickerField>
  );
}
