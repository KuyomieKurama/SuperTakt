import { useEffect, useMemo, useRef, useState } from 'react';
import { Combobox as Ark, createListCollection } from '@ark-ui/react/combobox';
import { Portal } from '@ark-ui/react/portal';
import type { ForeignText } from '../../api/types';
import { listTodos } from '../todos/api';
import { useAsync } from '../../app/useAsync';
import { foreignText } from '../../lib/foreign';
import { Foreign } from '../../shared/ui/Foreign';
import { Icon } from '../../shared/ui/Icon';

export function IdleTaskSelect({ label, value, title, allowPause, disabled, onChange }: {
  readonly label: string; readonly value: string; readonly title: ForeignText;
  readonly allowPause: boolean; readonly disabled: boolean;
  readonly onChange: (id: string, title: ForeignText) => void;
}) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [input, setInput] = useState(foreignText(title));
  useEffect(() => { setInput(foreignText(title)); }, [title, value]);
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search), 200);
    return () => window.clearTimeout(timer);
  }, [search]);
  const tasks = useAsync(() => listTodos({ search: query }, { limit: 100 }), [query]);
  const items = useMemo(() => {
    if (search !== query || tasks.state.status !== 'ready') return [{ value, label: title }];
    const found = tasks.state.status === 'ready' ? tasks.state.value.items.map(todo => ({ value: todo.id, label: todo.title })) : [];
    const options: { value: string; label: ForeignText }[] = allowPause && (!query || 'pause'.includes(query.toLocaleLowerCase())) ? [{ value: '', label: 'Pause — nicht buchen' }, ...found] : found;
    if (!options.some(item => item.value === value)) options.unshift({ value, label: title });
    return options;
  }, [tasks.state, allowPause, search, query, value, title]);
  // Closing the popup can reset its search collection before Ark emits the
  // selected value. Retain labels so a valid selection is not silently lost.
  const knownItems = useRef(new Map<string, { value: string; label: ForeignText }>());
  for (const item of items) knownItems.current.set(item.value, item);
  const collection = useMemo(() => createListCollection({
    items, itemToValue: item => item.value, itemToString: item => foreignText(item.label),
  }), [items]);
  return <Ark.Root collection={collection} value={[value]} inputValue={input} disabled={disabled}
    inputBehavior="none" openOnClick positioning={{ sameWidth: true, gutter: 4 }}
    onInputValueChange={details => { if (details.reason === 'input-change') { setInput(details.inputValue); setSearch(details.inputValue); } }}
    onValueChange={details => {
      const selected = details.value[0];
      const item = details.items[0] ?? (selected === undefined ? undefined : knownItems.current.get(selected));
      if (item) { onChange(item.value, item.label); setInput(foreignText(item.label)); setSearch(''); }
    }}
    onOpenChange={details => { if (!details.open) { setInput(foreignText(title)); setSearch(''); } }}
    className="field">
    <Ark.Label className="field__label">{label}</Ark.Label>
    <Ark.Control className="idle-task-select">
      <Ark.Input className="field__input" placeholder="Aufgabe suchen …" onFocus={event => event.currentTarget.select()} />
      <Ark.Trigger aria-label="Aufgaben anzeigen"><Icon name="chevron-down" size={14} /></Ark.Trigger>
    </Ark.Control>
    <Portal><Ark.Positioner className="popover-layer">
      <Ark.Content className="combobox__content" onKeyDown={event => { if (event.key === 'Escape' || event.key === 'Tab') event.stopPropagation(); }}>
        <div role="status">{search !== query || tasks.state.status === 'loading' ? <p className="combobox__empty">Suche …</p> :
          tasks.state.status === 'ready' && items.length === 0 ? <p className="combobox__empty">Keine Aufgaben gefunden.</p> : null}</div>
        <div role="alert">{tasks.state.status === 'error' ? <p className="combobox__empty">Suche fehlgeschlagen. <button type="button" onClick={tasks.reload}>Erneut versuchen</button></p> : null}</div>
        {search === query && tasks.state.status === 'ready' ? items.map(item => <Ark.Item key={item.value} item={item} className="combobox__option">
            <Ark.ItemText className="combobox__option-label"><Foreign value={item.label} /></Ark.ItemText>
            <Ark.ItemIndicator><Icon name="check" size={14} /></Ark.ItemIndicator>
          </Ark.Item>) : null}
        {tasks.state.status === 'ready' && tasks.state.value.total > 100 ? <p className="combobox__more">Weitere Aufgaben: Suche nach Titel oder Call-Nummer eingrenzen.</p> : null}
      </Ark.Content>
    </Ark.Positioner></Portal>
  </Ark.Root>;
}
