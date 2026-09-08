/**
 * Takt — Tags auswählen im Aufgabenbereich (A-4.3, A-4.4, A-10.4, A-10.5, A-13.3).
 *
 * Der Baum kann vier und mehr Ebenen tief sein (A-4.3) und muss in einem 350
 * Pixel breiten Bereich bedienbar bleiben (A-4.4). Drei Entscheidungen tragen
 * das:
 *
 *  1. **Suche zuerst, Baum darunter.** Das Eingabefeld hat den Fokus, sobald
 *     jemand Tags wählt. Bei vier Ebenen ist Tippen schneller als Klicken, und
 *     die Suche trifft auch den Pfad — „Nord Wartung" findet das Tag, ohne dass
 *     man weiß, wo es hängt.
 *  2. **Pfad statt Einrückung.** Vier Einrückungsstufen à 12 Pixel sind in
 *     dieser Breite die Hälfte des Platzes für den Namen. Jede Zeile trägt
 *     deshalb ihren Pfad als kleine Zeile darüber — der Ort bleibt sichtbar,
 *     der Name lesbar.
 *  3. **Gewählte Tags oben als Chips.** Sie bleiben sichtbar, auch wenn die
 *     Liste gefiltert ist. Ohne das wüsste niemand, was gewählt ist, sobald die
 *     Suche etwas anderes zeigt.
 *
 * ---------------------------------------------------------------------------
 * Ein Tag, das es noch nicht gibt (T-061)
 * ---------------------------------------------------------------------------
 *
 * Dasselbe Feld, das sucht, legt auch an — nicht ein zweites daneben. Bei 350
 * Pixel Breite ist ein zweites Eingabefeld nicht nur eng, es ist auch die
 * falsche Frage: Der Benutzer weiß nicht, ob es „backend“ schon gibt. Er tippt,
 * und die Liste antwortet ihm — mit dem vorhandenen Tag, wenn es eines gibt,
 * und mit einem Angebot, wenn nicht. **Suchen und Anlegen sind dieselbe
 * Handlung, solange man das Ergebnis nicht kennt.**
 *
 * Drei Regeln, die daran hängen:
 *
 *  - **Kein Angebot, wenn es den Namen schon gibt.** Auch dann nicht, wenn er
 *    anders geschrieben ist: „Backend“ trifft „backend“. Wann zwei Namen
 *    derselbe sind, entscheidet `packages/domain/src/tag-name.ts` und nicht
 *    diese Datei (siehe `../tags/new-name.ts`).
 *  - **Angelegt wird beim Anlegen des Todos, nicht beim Klick.** Der Klick
 *    merkt einen Namen vor. Erst `POST /addin/todos` legt an — in einer
 *    Transaktion mit dem Todo. Wer den Aufgabenbereich schließt, hinterlässt
 *    kein Tag.
 *  - **Vorgemerkte Namen sind als solche gekennzeichnet.** Ein Chip mit dem
 *    Wort „neu“ steht neben den gewählten Tags, aus demselben Grund, aus dem
 *    die Standard-Tags gekennzeichnet sind (A-9.3): Eine Wirkung auf den
 *    gemeinsamen Bestand darf nicht wie eine Auswahl aussehen.
 */

import { useMemo, useState } from 'react';

import { filterTags, flattenTagTree, indexTags, type FlatTag } from '../tags/tree.ts';
import {
  addPendingTagName,
  describeNewTag,
  removePendingTagName,
  type NewTagOffer,
} from '../tags/new-name.ts';
import type { TagTreeDto } from '../api/types.ts';
import { visibleText } from '../text/hidden.ts';
import { withDescription, type FieldAria } from './field.ts';
import { Chip, Foreign } from './Primitives.tsx';

interface TagPickerProps {
  /**
   * Kennung und Beschreibungen des umgebenden Feldes (T-158).
   *
   * Bis T-158 erzeugte der Auswähler seine Kennung selbst (`useId`) — die
   * Beschriftung „Tags" verwies damit auf ein Element, das es nicht gab, und
   * der Hinweis des Feldes stand für eine Vorlesehilfe nirgends. Die eigene
   * Zeile mit der Trefferzahl bleibt und tritt **hinter** den Hinweis: erst
   * das Allgemeine des Feldes, dann das Besondere dieses Bausteins.
   */
  readonly aria: FieldAria;
  readonly tree: TagTreeDto;
  /** Vom Benutzer gewählte Tags. Ohne die Standard-Tags. */
  readonly selected: readonly string[];
  /** Standard-Tags aus A-9.1. Sichtbar, aber nicht abwählbar. */
  readonly defaultTagIds: readonly string[];
  readonly onChange: (next: readonly string[]) => void;
  /**
   * Namen, die es in Takt noch nicht gibt und die mit dem Todo entstehen sollen
   * (T-061). Sie gehen als `tagNames` an den Dienst.
   */
  readonly newNames: readonly string[];
  readonly onNewNamesChange: (next: readonly string[]) => void;
}

/** Wie viele Treffer höchstens gezeigt werden, bevor zum Suchen aufgefordert wird. */
const MAX_VISIBLE = 60;

export function TagPicker({
  aria,
  tree,
  selected,
  defaultTagIds,
  onChange,
  newNames,
  onNewNamesChange,
}: TagPickerProps) {
  const [query, setQuery] = useState('');
  const countId = `${aria.id}-count`;

  const flat = useMemo(() => flattenTagTree(tree), [tree]);
  const byId = useMemo(() => indexTags(flat), [flat]);
  const filtered = useMemo(() => filterTags(flat, query), [flat, query]);
  const visible = filtered.slice(0, MAX_VISIBLE);
  const offer = useMemo(() => describeNewTag(query, flat, newNames), [query, flat, newNames]);

  const selectedSet = new Set(selected);
  const defaultSet = new Set(defaultTagIds);

  const toggle = (tagId: string): void => {
    onChange(selectedSet.has(tagId) ? selected.filter((id) => id !== tagId) : [...selected, tagId]);
  };

  /**
   * Den vorgemerkten Namen aufnehmen und das Suchfeld leeren.
   *
   * Das Leeren ist keine Kosmetik: Bliebe der Text stehen, zeigte die Liste
   * weiterhin „kein Tag passt“ und das Angebot verwandelte sich in „steht schon
   * in der Liste“ — der Benutzer sähe zwei Zustände für eine Handlung, die er
   * gerade abgeschlossen hat.
   */
  const remember = (name: string): void => {
    onNewNamesChange(addPendingTagName(newNames, name));
    setQuery('');
  };

  return (
    <div className="tagpicker">
      <div className="chips" aria-live="polite">
        {defaultTagIds.map((tagId) => {
          const tag = byId.get(tagId);
          return (
            <Chip
              key={`default-${tagId}`}
              label={tag?.name ?? 'Unbekanntes Tag'}
              path={tag?.folderLabel}
              tone="default-tag"
            />
          );
        })}
        {selected
          .filter((tagId) => !defaultSet.has(tagId))
          .map((tagId) => {
            const tag = byId.get(tagId);
            return (
              <Chip
                key={tagId}
                label={tag?.name ?? 'Unbekanntes Tag'}
                path={tag?.folderLabel}
                onRemove={() => {
                  toggle(tagId);
                }}
              />
            );
          })}
        {newNames.map((name) => (
          <Chip
            key={`new-${name}`}
            label={name}
            tone="new-tag"
            // Ein `aria-label` ist ein Attribut: bereinigen, isolieren
            // geht hier nicht (T-119).
            removeLabel={`Neues Tag „${visibleText(name)}“ verwerfen`}
            onRemove={() => {
              onNewNamesChange(removePendingTagName(newNames, name));
            }}
          />
        ))}
        {selected.length === 0 && defaultTagIds.length === 0 && newNames.length === 0 ? (
          <span className="chips__empty">Noch keine Tags gewählt.</span>
        ) : null}
      </div>

      <input
        {...withDescription(aria, countId)}
        className="input input--search"
        type="search"
        placeholder="Tag suchen oder neuen Namen eingeben …"
        value={query}
        spellCheck={false}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        onKeyDown={(event) => {
          // Eingabetaste als Abkürzung für den Knopf darunter. Sie ersetzt ihn
          // nicht: Der Knopf bleibt sichtbar, weil eine Tastenbelegung, die
          // nirgends steht, für die Hälfte der Benutzer nicht existiert.
          if (event.key === 'Enter' && offer.kind === 'offer') {
            event.preventDefault();
            remember(offer.name);
          }
        }}
      />

      <p className="tagpicker__count" id={countId}>
        {flat.length === 0
          ? 'In Takt sind noch keine Tags angelegt.'
          : filtered.length === flat.length
            ? `${String(flat.length)} Tags`
            : `${String(filtered.length)} von ${String(flat.length)} Tags`}
      </p>

      <NewTagLine
        offer={offer}
        // Ein Standard-Tag zählt als gewählt: Es hängt ohnehin am Todo (A-9.5),
        // und ein Knopf „auswählen" daneben wäre eine Handlung ohne Wirkung.
        alreadyChosen={
          offer.kind === 'exists' &&
          (selectedSet.has(offer.tag.id) || defaultSet.has(offer.tag.id))
        }
        onCreate={remember}
        // Auswählen, nicht umschalten. `toggle` würde ein bereits gewähltes Tag
        // **abwählen** — der Satz daneben sagt aber „auswählen", und ein Knopf,
        // der das Gegenteil seiner Beschriftung tut, ist schlimmer als keiner.
        onSelectExisting={(tagId) => {
          if (!selectedSet.has(tagId)) onChange([...selected, tagId]);
        }}
      />

      <ul className="tagpicker__list">
        {visible.map((tag) => (
          <TagRow
            key={tag.id}
            tag={tag}
            checked={selectedSet.has(tag.id) || defaultSet.has(tag.id)}
            locked={defaultSet.has(tag.id)}
            onToggle={() => {
              toggle(tag.id);
            }}
          />
        ))}
        {visible.length === 0 ? (
          <li className="tagpicker__none">
            {flat.length === 0
              ? 'Noch keine Tags in Takt. Das Todo lässt sich trotzdem anlegen — es bekommt dann die Standard-Tags, und ein neuer Name lässt sich oben eingeben.'
              : 'Kein Tag passt zu dieser Suche.'}
          </li>
        ) : null}
        {filtered.length > visible.length ? (
          <li className="tagpicker__none">
            {String(filtered.length - visible.length)} weitere — bitte die Suche schärfen.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/**
 * Die Zeile zwischen Suchfeld und Liste: was mit dem getippten Namen zu machen
 * ist (T-061).
 *
 * Jeder Fall bekommt seinen eigenen Satz. „Gibt es schon“ ist dabei der
 * wichtigste — er ist die Stelle, an der ein zweites „backend“ **nicht**
 * entsteht, und er nennt die vorhandene Schreibweise, damit der Benutzer sieht,
 * warum sein Name nicht angeboten wird.
 */
function NewTagLine({
  offer,
  alreadyChosen,
  onCreate,
  onSelectExisting,
}: {
  readonly offer: NewTagOffer;
  readonly alreadyChosen: boolean;
  readonly onCreate: (name: string) => void;
  readonly onSelectExisting: (tagId: string) => void;
}) {
  switch (offer.kind) {
    case 'idle':
      return null;

    case 'invalid':
      return (
        <p className="tagpicker__hint tagpicker__hint--warn" role="status">
          {offer.message}
        </p>
      );

    case 'pending':
      return (
        <p className="tagpicker__hint" role="status">
          „<Foreign value={offer.name} />“ steht schon oben als neues Tag.
        </p>
      );

    case 'exists': {
      const pfad = offer.tag.folderLabel.length > 0 ? `${visibleText(offer.tag.folderLabel)} › ` : '';

      if (alreadyChosen) {
        return (
          <p className="tagpicker__hint" role="status">
            Gibt es schon und ist gewählt: {pfad}
            <Foreign value={offer.tag.name} />.
          </p>
        );
      }

      return (
        <p className="tagpicker__hint" role="status">
          Gibt es schon:{' '}
          <button
            type="button"
            className="tagpicker__link"
            onClick={() => {
              onSelectExisting(offer.tag.id);
            }}
          >
            {pfad}
            <Foreign value={offer.tag.name} />
          </button>{' '}
          — auswählen statt neu anlegen.
        </p>
      );
    }

    case 'offer':
      return (
        <button
          type="button"
          className="tagpicker__create"
          onClick={() => {
            onCreate(offer.name);
          }}
        >
          <span className="tagpicker__create-plus" aria-hidden="true">
            +
          </span>
          <span className="tagpicker__create-text">
            Neues Tag „<Foreign value={offer.name} />“ — entsteht beim Anlegen des Todos
          </span>
        </button>
      );

    default:
      return null;
  }
}

function TagRow({
  tag,
  checked,
  locked,
  onToggle,
}: {
  readonly tag: FlatTag;
  readonly checked: boolean;
  readonly locked: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <li className={checked ? 'tagrow tagrow--checked' : 'tagrow'}>
      <label className="tagrow__label">
        <input
          type="checkbox"
          className="tagrow__box"
          checked={checked}
          disabled={locked}
          onChange={onToggle}
        />
        <span className="tagrow__text">
          {tag.folderLabel.length > 0 ? (
            /* T-119: Der Kurzhinweis bleibt — er trägt den Pfad, wenn ihn die
               Spalte abschneidet. Ein `title` ist ein Attribut, dort bleibt nur
               das Bereinigen. */
            <span className="tagrow__path" title={visibleText(tag.folderLabel)}>
              <Foreign value={tag.folderLabel} />
            </span>
          ) : null}
          <span className="tagrow__name">
            {tag.color !== null ? (
              <span className="tagrow__dot" style={{ backgroundColor: tag.color }} aria-hidden="true" />
            ) : null}
            <Foreign value={tag.name} />
          </span>
        </span>
        {locked ? <span className="tagrow__lock">Standard</span> : null}
      </label>
    </li>
  );
}
