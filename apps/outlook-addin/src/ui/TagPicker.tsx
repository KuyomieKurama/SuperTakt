import { Fragment, useMemo, useState } from 'react';

import { filterTags, flattenTagTree, indexTags, type FlatTag } from '../tags/tree.ts';
import {
  addPendingTagName,
  describeNewTag,
  removePendingTagName,
  type NewTagOffer,
} from '../tags/new-name.ts';
import type { TagTreeDto, TagFolderNodeDto } from '../api/types.ts';
import { visibleText } from '../text/hidden.ts';
import { withDescription, type FieldAria } from './field.ts';
import { Chip, Foreign } from './Primitives.tsx';

interface TagPickerProps {
  readonly allowNew?: boolean;
  readonly aria: FieldAria;
  readonly tree: TagTreeDto;
  readonly selected: readonly string[];
  readonly defaultTagIds: readonly string[];
  readonly onChange: (next: readonly string[]) => void;
  readonly newNames: readonly string[];
  readonly onNewNamesChange: (next: readonly string[]) => void;
}

interface FolderEntry {
  readonly node: TagFolderNodeDto;
  readonly ancestors: readonly string[];
  readonly path: readonly string[];
}

function folderEntries(tree: TagTreeDto): readonly FolderEntry[] {
  const result: FolderEntry[] = [];
  const stack: FolderEntry[] = [...tree.rootFolders].reverse().map(node => ({ node, ancestors: [], path: [node.folder.name] }));
  while (stack.length > 0) {
    const entry = stack.pop()!;
    result.push(entry);
    for (const node of [...entry.node.subfolders].reverse()) {
      stack.push({ node, ancestors: [...entry.ancestors, entry.node.folder.id], path: [...entry.path, node.folder.name] });
    }
  }
  return result;
}

export function TagPicker({
  allowNew = true,
  aria,
  tree,
  selected,
  defaultTagIds,
  onChange,
  newNames,
  onNewNamesChange,
}: TagPickerProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const countId = `${aria.id}-count`;

  const flat = useMemo(() => flattenTagTree(tree), [tree]);
  const byId = useMemo(() => indexTags(flat), [flat]);
  const filtered = useMemo(() => filterTags(flat, query), [flat, query]);
  const folders = useMemo(() => folderEntries(tree), [tree]);
  const offer = useMemo<NewTagOffer>(() => allowNew ? describeNewTag(query, flat, newNames) : { kind: 'idle' }, [allowNew, query, flat, newNames]);

  const selectedSet = new Set(selected);
  const defaultSet = new Set(defaultTagIds);
  const searching = query.trim().length > 0;
  const matchingIds = new Set(filtered.map(tag => tag.id));
  const matchingFolders = new Set<string>();
  for (const entry of folders) {
    if (entry.node.tags.some(tag => matchingIds.has(tag.id))) {
      matchingFolders.add(entry.node.folder.id);
      entry.ancestors.forEach(id => matchingFolders.add(id));
    }
  }
  const toggleFolder = (id: string): void => setCollapsed(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

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
      <div className="tagpicker__control">
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

      </div>

      <p className="tagpicker__count" id={countId}>
        {flat.length === 0
          ? 'In SuperTakt sind noch keine Tags angelegt.'
          : searching
            ? `${String(filtered.length)} von ${String(flat.length)} Tags`
            : `${String(flat.length)} ${flat.length === 1 ? 'Tag' : 'Tags'}`}
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

      <div className="tagpicker__tree" aria-label="Tag-Ordner">
        {tree.rootTags.some(tag => matchingIds.has(tag.id)) ?
          <ul className="tagpicker__list">{tree.rootTags.filter(tag => matchingIds.has(tag.id)).map(tag => row(byId.get(tag.id)!, false))}</ul> : null}
        {folders.map(({ node, ancestors, path }) => {
          if (searching ? !matchingFolders.has(node.folder.id) : ancestors.some(id => collapsed.has(id))) return null;
          const expanded = searching || !collapsed.has(node.folder.id);
          return <Fragment key={node.folder.id}>
            <button type="button" className="tagpicker__folder" aria-expanded={expanded}
              title={visibleText(path.join(' › '))}
              style={{ paddingInlineStart: `${8 + Math.min(ancestors.length, 4) * 12}px` }}
              onClick={() => { if (!searching) toggleFolder(node.folder.id); }}>
              <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 7V5h7l2 2h9v13H3Z" /></svg>
              <Foreign value={ancestors.length > 4 ? path.join(' › ') : node.folder.name} />
            </button>
            {expanded && node.tags.length > 0 ? <ul className="tagpicker__list" style={{ marginInlineStart: `${Math.min(ancestors.length + 1, 5) * 12}px` }}>
              {node.tags.filter(tag => matchingIds.has(tag.id)).map(tag => row(byId.get(tag.id)!, false))}
            </ul> : null}
          </Fragment>;
        })}
        {filtered.length === 0 ? <p className="tagpicker__none">Kein Tag passt zu dieser Suche.</p> : null}
      </div>
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
