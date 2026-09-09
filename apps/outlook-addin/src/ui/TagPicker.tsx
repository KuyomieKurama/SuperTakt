/**
 * SuperTakt — Tags im schmalen Outlook-Aufgabenbereich.
 *
 * Ohne Suche werden die  Tags nicht mehr als eine lange, durchgehende Liste
 * dargestellt. Sie sind nach ihrem vollständigen Ordnerpfad in aufklappbare
 * Gruppen gegliedert. Sobald gesucht wird, wechselt die Fläche bewusst zurück
 * in eine flache Trefferliste — dann ist der Pfad Bestandteil des Treffers.
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
  readonly aria: FieldAria;
  readonly tree: TagTreeDto;
  readonly selected: readonly string[];
  readonly defaultTagIds: readonly string[];
  readonly onChange: (next: readonly string[]) => void;
  readonly newNames: readonly string[];
  readonly onNewNamesChange: (next: readonly string[]) => void;
}

const MAX_VISIBLE = 60;

interface TagGroup {
  readonly label: string;
  readonly tags: readonly FlatTag[];
}

function groupByFolder(tags: readonly FlatTag[]): readonly TagGroup[] {
  const grouped = new Map<string, FlatTag[]>();
  for (const tag of tags) {
    const key = tag.folderLabel;
    const current = grouped.get(key);
    if (current === undefined) grouped.set(key, [tag]);
    else current.push(tag);
  }
  return [...grouped.entries()].map(([label, entries]) => ({ label, tags: entries }));
}

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
  const groups = useMemo(() => groupByFolder(flat), [flat]);
  const visible = filtered.slice(0, MAX_VISIBLE);
  const offer = useMemo(() => describeNewTag(query, flat, newNames), [query, flat, newNames]);

  const selectedSet = new Set(selected);
  const defaultSet = new Set(defaultTagIds);
  const searching = query.trim().length > 0;

  const toggle = (tagId: string): void => {
    onChange(selectedSet.has(tagId) ? selected.filter((id) => id !== tagId) : [...selected, tagId]);
  };

  const remember = (name: string): void => {
    onNewNamesChange(addPendingTagName(newNames, name));
    setQuery('');
  };

  const row = (tag: FlatTag, showPath: boolean) => (
    <TagRow
      key={tag.id}
      tag={tag}
      showPath={showPath}
      checked={selectedSet.has(tag.id) || defaultSet.has(tag.id)}
      locked={defaultSet.has(tag.id)}
      onToggle={() => toggle(tag.id)}
    />
  );

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
                onRemove={() => toggle(tagId)}
              />
            );
          })}
        {newNames.map((name) => (
          <Chip
            key={`new-${name}`}
            label={name}
            tone="new-tag"
            removeLabel={`Neues Tag „${visibleText(name)}“ verwerfen`}
            onRemove={() => onNewNamesChange(removePendingTagName(newNames, name))}
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
        placeholder="Tag oder Ordner suchen …"
        value={query}
        spellCheck={false}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && offer.kind === 'offer') {
            event.preventDefault();
            remember(offer.name);
          }
        }}
      />

      <p className="tagpicker__count" id={countId}>
        {flat.length === 0
          ? 'In SuperTakt sind noch keine Tags angelegt.'
          : searching
            ? `${String(filtered.length)} von ${String(flat.length)} Tags`
            : `${String(flat.length)} Tags in ${String(groups.length)} Gruppe(n)`}
      </p>

      <NewTagLine
        offer={offer}
        alreadyChosen={
          offer.kind === 'exists' &&
          (selectedSet.has(offer.tag.id) || defaultSet.has(offer.tag.id))
        }
        onCreate={remember}
        onSelectExisting={(tagId) => {
          if (!selectedSet.has(tagId)) onChange([...selected, tagId]);
        }}
      />

      {searching ? (
        <ul className="tagpicker__list">
          {visible.map((tag) => row(tag, true))}
          {visible.length === 0 ? <li className="tagpicker__none">Kein Tag passt zu dieser Suche.</li> : null}
          {filtered.length > visible.length ? (
            <li className="tagpicker__none">
              {String(filtered.length - visible.length)} weitere — bitte die Suche schärfen.
            </li>
          ) : null}
        </ul>
      ) : (
        <div className="tagpicker__groups">
          {groups.map((group) => {
            const chosen = group.tags.some(
              (tag) => selectedSet.has(tag.id) || defaultSet.has(tag.id),
            );
            return (
              <details
                key={group.label || '__root__'}
                className="tagpicker__group"
                open={group.label.length === 0 || chosen}
              >
                <summary className="tagpicker__group-title">
                  {group.label.length === 0 ? 'Ohne Ordner' : <Foreign value={group.label} />}
                  <span className="tagpicker__group-count"> {String(group.tags.length)}</span>
                </summary>
                <ul className="tagpicker__list">{group.tags.map((tag) => row(tag, false))}</ul>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      return <p className="tagpicker__hint tagpicker__hint--warn" role="status">{offer.message}</p>;
    case 'pending':
      return <p className="tagpicker__hint" role="status">„<Foreign value={offer.name} />“ steht schon oben als neues Tag.</p>;
    case 'exists': {
      const path = offer.tag.folderLabel.length > 0 ? `${visibleText(offer.tag.folderLabel)} › ` : '';
      if (alreadyChosen) {
        return <p className="tagpicker__hint" role="status">Gibt es schon und ist gewählt: {path}<Foreign value={offer.tag.name} />.</p>;
      }
      return (
        <p className="tagpicker__hint" role="status">
          Gibt es schon:{' '}
          <button type="button" className="tagpicker__link" onClick={() => onSelectExisting(offer.tag.id)}>
            {path}<Foreign value={offer.tag.name} />
          </button>{' '}
          — auswählen statt neu anlegen.
        </p>
      );
    }
    case 'offer':
      return (
        <button type="button" className="tagpicker__create" onClick={() => onCreate(offer.name)}>
          <span className="tagpicker__create-plus" aria-hidden="true">+</span>
          <span className="tagpicker__create-text">Neues Tag „<Foreign value={offer.name} />“ — entsteht beim Anlegen des Todos</span>
        </button>
      );
    default:
      return null;
  }
}

function TagRow({
  tag,
  showPath,
  checked,
  locked,
  onToggle,
}: {
  readonly tag: FlatTag;
  readonly showPath: boolean;
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
          {showPath && tag.folderLabel.length > 0 ? (
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
