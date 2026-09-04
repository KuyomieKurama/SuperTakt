import { useMemo, useState, type KeyboardEvent } from "react";
import { Combobox as Ark, createListCollection } from "@ark-ui/react/combobox";
import { Portal } from "@ark-ui/react/portal";
import { normalizeTagName, tagNameKey } from "@takt/domain";
import type { Id } from "../api/types";
import { useStructure, type TagInfo } from "../app/StructureContext";
import { href } from "../app/router";
import { cx } from "../lib/cx";
import { Icon } from "./Icon";
import { Button, InlineMessage, Spinner, type ControlSize } from "./Primitives";
import { TagChip } from "./Tag";
import { quotedName } from "../lib/foreign";
import { Foreign } from "./Foreign";

/**
 * Takt — **die** Tag-Eingabe (A-4.1, A-4.4, I-06, E-052, T-059).
 *
 * ## Eine Eingabe, überall dieselbe
 *
 * Vor T-059 gab es an vier Stellen vier Arten, ein Tag zu wählen: ein
 * Suchfeld mit einer Chip-Wand darunter im Todo-Dialog, eine ungefilterte
 * Chip-Wand in den Standard-Tags, eine auf vierzig Stück gekappte Chip-Wand in
 * der Regel eines Pools, und in der Todo-Liste **gar keine** — der Tag-Filter ließ
 * sich nur über einen Klick auf ein fremdes Chip setzen. Wer vierzig Tags hat,
 * für den war jede dieser Stellen eine andere Aufgabe.
 *
 * Jetzt ist es eine. Was hier steht, gilt an allen Stellen: dieselbe
 * Vorschlagsliste, dieselbe Tastaturbedienung, dieselbe Anzeige des
 * Ordnerpfades, dieselbe Art, ein Tag wieder loszuwerden.
 *
 * ## Vorschläge folgen der Regel des Dienstes, nicht einer eigenen
 *
 * Verglichen wird über `tagNameKey` aus `packages/domain` — dieselbe Funktion,
 * die der Dienst benutzt und die als `tag.name_key` in der Datenbank steht.
 * Das ist keine Bequemlichkeit: Mit einem eigenen `toLowerCase()` zeigte die
 * Liste „kein Treffer" für einen Namen, den der Dienst unmittelbar darauf als
 * vorhanden erkennt — und der Benutzer bekäme für eine richtige Eingabe die
 * Meldung „Name bereits vergeben". `Backend` = `backend` = `„ Backend "`,
 * `Änderung` = `änderung`, aber `Straße` ≠ `Strasse`.
 *
 * ## Vorhanden und neu sind auseinanderzuhalten (Punkt 4 des Auftraggebers)
 *
 * Ein Vorschlag, der aussieht wie ein vorhandenes Tag und in Wahrheit ein
 * neues anlegt, ist die schlechteste Variante. Deshalb:
 *
 *  - Vorhandene Tags stehen unter der Überschrift „Vorhandene Tags", mit
 *    Punkt, Ordnerpfad und Namen — genau so, wie sie danach am Todo hängen.
 *  - Das Anlegen steht **darunter, abgetrennt**, unter „Neu anlegen", mit
 *    Plus-Zeichen statt Punkt, und der Eintrag sagt in eigenen Worten, was
 *    geschieht und wo das Tag entsteht.
 *  - Ein noch nicht angelegtes Tag trägt als Chip eine gestrichelte Kontur und
 *    das Wort „neu". Zwei Merkmale, keines davon nur Farbe (SC 1.4.1).
 *
 * ## Angelegt wird erst beim Speichern
 *
 * Dieser Baustein schreibt **nichts**. Er meldet dem Aufrufer, welche Namen
 * noch kein Tag haben; angelegt werden sie dort, wo auch das Übrige gespeichert
 * wird. Beim Anlegen eines Todos geschieht das in **einer** Transaktion
 * (`tagNames`, T-058) — wer den Dialog abbricht, hinterlässt kein verwaistes
 * Tag.
 */

/**
 * Wert des Eintrags „neu anlegen".
 *
 * Muss sich von jeder Tag-Kennung unterscheiden — die kommen aus dem Dienst
 * und sind Kennungen, keine Sätze. Ausgeschrieben und nicht als Sonderzeichen:
 * Ein unsichtbares Steuerzeichen in einer Quelldatei bricht `grep`, `diff` und
 * jedes Werkzeug, das Text erwartet.
 */
const NEW_TAG_VALUE = "__takt_neues_tag__";

/** Mehr Vorschläge liest niemand; die Zahl der übrigen steht darunter. */
const MAX_SUGGESTIONS = 50;

/** Damit die Vorgabe kein neues Set je Durchlauf ist. */
const EMPTY_IDS: ReadonlySet<string> = new Set<string>();

interface Suggestion {
  readonly value: string;
  readonly label: string;
  readonly path: readonly string[];
  readonly isDefault: boolean;
}

interface TagInputBaseProps {
  readonly label: string;
  /** Kennungen der gewählten, bereits vorhandenen Tags. */
  readonly value: readonly Id[];
  readonly onChange: (next: readonly Id[]) => void;
  readonly hideLabel?: boolean;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly size?: ControlSize;
  readonly className?: string;
}

/**
 * Mit `allowCreate` gehören `newNames` und `onNewNamesChange` dazu — sonst
 * hätte der Benutzer einen Namen getippt, den niemand entgegennimmt. Der
 * Übersetzer hält das fest, damit es kein Aufrufer vergessen kann.
 */
export type TagInputProps = TagInputBaseProps &
  (
    | { readonly allowCreate?: false }
    | {
        readonly allowCreate: true;
        /** Getippte Namen, für die es noch kein Tag gibt. */
        readonly newNames: readonly string[];
        readonly onNewNamesChange: (next: readonly string[]) => void;
      }
  );

/**
 * Die Tag-Eingabe **ohne** Anbindung an den Aufbau.
 *
 * Getrennt, damit sie sich zeigen lässt: Die Musterseite des Designsystems
 * hat keinen `StructureProvider` und soll trotzdem alle Zustände dieses
 * Bausteins nebeneinander stellen können — leer, mit Vorschlägen, ohne
 * Treffer, mit einem neuen Tag, gesperrt. Ein Baustein, dessen Zustände man
 * nur in der laufenden Anwendung sieht, wird nicht abgenommen, sondern
 * geglaubt.
 */
export type TagComboboxProps = TagInputProps & {
  /** Alle wählbaren Tags samt Ordnerpfad. */
  readonly tags: readonly TagInfo[];
  /** Kennungen der Standard-Tags (A-9.1). Werden im Vorschlag angesagt. */
  readonly defaultTagIds?: ReadonlySet<string>;
  /** Sperrt die Eingabe und sagt, dass noch geladen wird. */
  readonly loading?: boolean;
};

export function TagCombobox(props: TagComboboxProps) {
  const {
    label,
    value,
    onChange,
    hideLabel = false,
    hint,
    placeholder = "Tag suchen oder eingeben …",
    disabled = false,
    size = "md",
    className,
    tags: allTags,
    loading = false,
  } = props;

  const allowCreate = props.allowCreate === true;
  const newNames = props.allowCreate === true ? props.newNames : [];

  const [query, setQuery] = useState("");

  const ready = !loading;
  const defaultTagIds = props.defaultTagIds ?? EMPTY_IDS;

  /**
   * Was zur Eingabe passt — und ob der getippte Name bereits ein Tag ist.
   *
   * Beides in einem Durchgang, weil beides dieselbe Frage ist: Der
   * Vergleichsschlüssel entscheidet über den Treffer **und** darüber, ob
   * „neu anlegen" überhaupt angeboten werden darf.
   */
  const { suggestions, hiddenCount, exactMatch } = useMemo(() => {
    const needle = tagNameKey(query);
    let exact: TagInfo | undefined;

    const scored: { readonly info: TagInfo; readonly rank: number }[] = [];
    for (const info of allTags) {
      const key = tagNameKey(info.tag.name);
      if (needle.length > 0 && key === needle) exact = info;

      if (needle.length === 0) {
        scored.push({ info, rank: 2 });
        continue;
      }
      if (key === needle) scored.push({ info, rank: 0 });
      else if (key.startsWith(needle)) scored.push({ info, rank: 1 });
      else if (key.includes(needle)) scored.push({ info, rank: 2 });
      else if (tagNameKey(info.path.join(" ")).includes(needle)) scored.push({ info, rank: 3 });
    }

    scored.sort((a, b) =>
      a.rank === b.rank ? a.info.tag.name.localeCompare(b.info.tag.name, "de") : a.rank - b.rank,
    );

    const visible = scored.slice(0, MAX_SUGGESTIONS);
    return {
      exactMatch: exact,
      hiddenCount: scored.length - visible.length,
      suggestions: visible.map<Suggestion>(({ info }) => ({
        value: info.tag.id,
        label: info.tag.name,
        path: info.path,
        isDefault: defaultTagIds.has(info.tag.id),
      })),
    };
  }, [allTags, query, defaultTagIds]);

  // Der getippte Name in Anzeigeform — dieselbe Normalisierung, die der Dienst
  // beim Anlegen anwendet. Was der Benutzer im Eintrag liest, ist damit genau
  // der Name, der entsteht.
  const pendingName = normalizeTagName(query);
  const alreadyPending = newNames.some((name) => tagNameKey(name) === tagNameKey(pendingName));
  const canCreate =
    allowCreate && pendingName.length > 0 && exactMatch === undefined && !alreadyPending;

  const createItem = useMemo<Suggestion>(
    () => ({ value: NEW_TAG_VALUE, label: pendingName, path: [], isDefault: false }),
    [pendingName],
  );

  const collection = useMemo(
    () =>
      createListCollection<Suggestion>({
        items: canCreate ? [...suggestions, createItem] : suggestions,
        itemToValue: (item) => item.value,
        itemToString: (item) => item.label,
      }),
    [suggestions, canCreate, createItem],
  );

  const addNewName = (name: string): void => {
    if (props.allowCreate !== true) return;
    if (name.length === 0) return;
    const key = tagNameKey(name);
    if (props.newNames.some((existing) => tagNameKey(existing) === key)) return;
    props.onNewNamesChange([...props.newNames, name]);
  };

  const removeNewName = (name: string): void => {
    if (props.allowCreate !== true) return;
    props.onNewNamesChange(props.newNames.filter((existing) => existing !== name));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    // Escape gehört der offenen Liste; ohne diese Bremse schlösse es
    // zusätzlich den Dialog dahinter.
    if (event.key === "Escape") event.stopPropagation();

    // Rücktaste im leeren Feld nimmt das zuletzt gewählte Tag zurück. Der
    // gewohnte Griff bei einer Chip-Eingabe — und er ersetzt keinen der
    // Entfernen-Knöpfe, er kommt dazu.
    if (event.key !== "Backspace" || query.length > 0) return;
    const lastNew = newNames[newNames.length - 1];
    if (lastNew !== undefined) {
      event.preventDefault();
      removeNewName(lastNew);
      return;
    }
    const lastTag = value[value.length - 1];
    if (lastTag !== undefined) {
      event.preventDefault();
      onChange(value.filter((id) => id !== lastTag));
    }
  };

  const chips = (
    <>
      {value.map((id) => {
        const info = allTags.find((candidate) => candidate.tag.id === id);
        return (
          <li key={id}>
            <TagChip
              label={info?.tag.name ?? "Unbekanntes Tag"}
              {...(info === undefined ? {} : { path: info.path })}
              size="sm"
              isDefault={defaultTagIds.has(id)}
              disabled={disabled}
              onRemove={() => onChange(value.filter((other) => other !== id))}
            />
          </li>
        );
      })}
      {newNames.map((name) => (
        <li key={`neu-${name}`}>
          <TagChip
            label={name}
            size="sm"
            isNew
            disabled={disabled}
            onRemove={() => removeNewName(name)}
          />
        </li>
      ))}
    </>
  );

  const hasChips = value.length > 0 || newNames.length > 0;

  return (
    <Ark.Root
      collection={collection}
      multiple
      closeOnSelect={false}
      openOnClick
      disabled={disabled || !ready}
      inputValue={query}
      value={[...value]}
      /*
       * `autohighlight`: Der erste Treffer ist beim Tippen hervorgehoben, die
       * Eingabetaste nimmt ihn.
       *
       * Ohne das täte die Eingabetaste **nichts**, solange der Benutzer nicht
       * vorher mit der Pfeiltaste in die Liste gegangen ist — und wer einen
       * neuen Tagnamen tippt und dann Eingabe drückt, erwartet zu Recht, dass
       * er angelegt wird. Was die Taste tut, ist dabei sichtbar: Die
       * hervorgehobene Zeile steht unter dem Feld, und das Anlegen steht dort
       * mit eigener Überschrift.
       */
      inputBehavior="autohighlight"
      onInputValueChange={(details) => setQuery(details.inputValue)}
      onValueChange={(details) => {
        if (details.value.includes(NEW_TAG_VALUE)) {
          addNewName(pendingName);
          setQuery("");
          return;
        }
        onChange(details.value);
      }}
      className={cx("field", "taginput", `taginput--${size}`, className)}
    >
      <Ark.Label className={cx("field__label", hideLabel && "visually-hidden")}>
        {label}
      </Ark.Label>

      {hasChips ? (
        <ul className="taginput__chips" aria-label={`Gewählt: ${label}`}>
          {chips}
        </ul>
      ) : null}

      <Ark.Control className="taginput__control">
        <span className="taginput__icon" aria-hidden>
          <Icon name="tag" size={15} />
        </span>
        <Ark.Input
          className="taginput__input"
          placeholder={ready ? placeholder : "Tags werden geladen …"}
          autoComplete="off"
          onKeyDown={onKeyDown}
        />
        {ready ? (
          <Ark.Trigger className="taginput__toggle" aria-label="Alle Tags zeigen">
            <Icon name="chevron-down" size={14} />
          </Ark.Trigger>
        ) : (
          <Spinner size={14} label="Tags werden geladen" />
        )}
      </Ark.Control>

      <Portal>
        <Ark.Positioner className="popover-layer">
          <Ark.Content className="combobox__content">
            <Ark.List>
              {suggestions.length > 0 ? (
                <Ark.ItemGroup>
                  <Ark.ItemGroupLabel className="combobox__group-label">
                    Vorhandene Tags
                  </Ark.ItemGroupLabel>
                  {suggestions.map((item) => (
                    <Ark.Item key={item.value} item={item} className="combobox__option">
                      <span className="combobox__option-dot" aria-hidden />
                      <span className="combobox__option-text">
                        <Ark.ItemText className="combobox__option-label">
                          {item.path.length > 0 ? (
                            <span className="combobox__option-path">
                              <Foreign value={item.path.join(" / ")} />
                              {" / "}
                            </span>
                          ) : null}
                          <Foreign value={item.label} />
                        </Ark.ItemText>
                        {item.isDefault ? (
                          <span className="combobox__option-hint">
                            Standard-Tag — hängt ohnehin an jedem neuen Todo.
                          </span>
                        ) : null}
                      </span>
                      <Ark.ItemIndicator className="combobox__option-check">
                        <Icon name="check" size={14} />
                      </Ark.ItemIndicator>
                    </Ark.Item>
                  ))}
                </Ark.ItemGroup>
              ) : null}

              {hiddenCount > 0 ? (
                <p className="combobox__more">
                  Weitere {hiddenCount} Tags passen ebenfalls. Tippen Sie genauer.
                </p>
              ) : null}

              {canCreate ? (
                <Ark.ItemGroup className="combobox__group--new">
                  <Ark.ItemGroupLabel className="combobox__group-label">
                    Neu anlegen
                  </Ark.ItemGroupLabel>
                  <Ark.Item item={createItem} className="combobox__option combobox__option--new">
                    <span className="combobox__option-plus" aria-hidden>
                      <Icon name="plus" size={13} />
                    </span>
                    <span className="combobox__option-text">
                      <Ark.ItemText className="combobox__option-label">
                        {quotedName(pendingName)} als neues Tag anlegen
                      </Ark.ItemText>
                      <span className="combobox__option-hint">
                        Dieses Tag gibt es noch nicht. Es entsteht auf der Wurzelebene, sobald
                        Sie speichern; verschieben lässt es sich danach unter Tags.
                      </span>
                    </span>
                  </Ark.Item>
                </Ark.ItemGroup>
              ) : null}

              {suggestions.length === 0 && !canCreate ? (
                <p className="combobox__empty">
                  {allTags.length === 0
                    ? "Noch kein Tag angelegt."
                    : `Kein Tag passt zu ${quotedName(pendingName)}.`}{" "}
                  {allowCreate ? (
                    "Tippen Sie einen Namen — Takt bietet Ihnen dann an, ihn anzulegen."
                  ) : (
                    <>
                      Neue Tags legen Sie unter <a href={href("tags")}>Tags</a> an.
                    </>
                  )}
                </p>
              ) : null}
            </Ark.List>
          </Ark.Content>
        </Ark.Positioner>
      </Portal>

      {hint === undefined ? null : <p className="field__hint">{hint}</p>}
    </Ark.Root>
  );
}

/* ==================================================================== */
/* Angebunden an den Aufbau                                             */
/* ==================================================================== */

/**
 * Die Tag-Eingabe, wie die Anwendung sie benutzt.
 *
 * Sie holt die Tags aus dem `StructureContext` — dort liegen sie ohnehin, für
 * acht Ansichten, einmal geladen. Die drei Zustände dieser Quelle bekommen
 * hier jeweils eine Antwort und nicht bloß der eine gute:
 *
 *  - **lädt** — das Feld steht da, ist gesperrt und sagt, worauf es wartet.
 *    Es verschwindet nicht, damit das Formular nicht springt.
 *  - **Fehler** — eine Meldung mit einem Weg zurück (Abschnitt 15: eine
 *    Fehlermeldung ohne Wiederholungsknopf ist eine Sackgasse).
 *  - **bereit** — die Eingabe.
 */
export function TagInput(props: TagInputProps) {
  const structure = useStructure();

  const defaultTagIds = useMemo(() => {
    const ids = new Set<string>();
    if (structure.state.status === "ready") {
      for (const entry of structure.state.value.defaultTags) ids.add(entry.tagId);
    }
    return ids;
  }, [structure.state]);

  if (structure.state.status === "error") {
    return (
      <div className={cx("field", props.className)}>
        <span className={cx("field__label", props.hideLabel === true && "visually-hidden")}>
          {props.label}
        </span>
        <InlineMessage
          tone="danger"
          title="Die Tags ließen sich nicht laden"
          action={
            <Button size="sm" iconStart="rotate-ccw" onClick={structure.reload}>
              Erneut versuchen
            </Button>
          }
        >
          {structure.state.message} Ohne die Liste lässt sich hier kein Tag wählen.
        </InlineMessage>
      </div>
    );
  }

  return (
    <TagCombobox
      {...props}
      tags={structure.allTags}
      defaultTagIds={defaultTagIds}
      loading={structure.state.status === "loading"}
    />
  );
}
