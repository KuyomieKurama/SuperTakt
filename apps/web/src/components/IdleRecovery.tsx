import { useEffect, useMemo, useRef, useState } from 'react';
import { listTodos } from '../api/endpoints';
import { resolveIdleSession, returnFromIdle, type IdleAllocation, type IdleSession } from '../api/idle';
import type { DraftText, ForeignText, Id } from '../api/types';
import { useAsync, useMutation } from '../app/useAsync';
import { useToasts } from '../app/ToastContext';
import { formatDateTime, formatDuration, formatStopwatch } from '../lib/format';
import { foreignText, quotedName } from '../lib/foreign';
import { FormDialog, TextField } from './FormDialog';
import { Button, InlineMessage } from './Primitives';
import { Select } from './Select';

type Mode = 'break' | 'task' | 'split';
interface Row { key: number; todoId: Id | ''; duration: DraftText; note: DraftText }
export function parseIdleDuration(value: string): number | null {
  const raw = value.trim().replace(',', '.');
  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const seconds = Number(raw) * 60;
    return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null;
  }
  const match = /^(\d+):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) return null;
  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null;
}

export function IdleRecovery({ session, changed }: { readonly session: IdleSession; readonly changed: () => void }) {
  const [open, setOpen] = useState(session.returnedAt !== null);
  const [mode, setMode] = useState<Mode>('break');
  const [resume, setResume] = useState(true);
  const [rows, setRows] = useState<Row[]>([{ key: 0, todoId: session.todoId, duration: '', note: session.note }]);
  const sequence = useRef(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const mutation = useMutation();
  const toasts = useToasts();
  const submitting = useRef(false);
  const [validation, setValidation] = useState<string | null>(null);
  const [known, setKnown] = useState<ReadonlyMap<Id, ForeignText>>(() => new Map([[session.todoId, session.todoTitle]]));
  const tasks = useAsync(() => listTodos({ search: query }, { limit: 100 }), [query]);
  useEffect(() => { const id = window.setTimeout(() => setQuery(search), 200); return () => window.clearTimeout(id); }, [search]);
  useEffect(() => { if (session.returnedAt !== null) setOpen(true); }, [session.returnedAt]);
  useEffect(() => {
    if (tasks.state.status !== 'ready') return;
    const items = tasks.state.value.items;
    setKnown(previous => new Map([...previous, ...items.map(todo => [todo.id, todo.title] as const)]));
  }, [tasks.state]);
  const seconds = session.returnedAt === null ? 0 : Math.floor((Date.parse(session.returnedAt) - Date.parse(session.startedAt)) / 1000);
  const assigned = rows.reduce((sum, row) => sum + (parseIdleDuration(row.duration) ?? 0), 0);
  const remaining = seconds - assigned;
  const options = useMemo(() => {
    const ids = new Set<Id>([session.todoId, ...rows.flatMap(row => row.todoId === '' ? [] : [row.todoId]),
      ...(tasks.state.status === 'ready' ? tasks.state.value.items.map(todo => todo.id) : [])]);
    return [{ value: '', label: 'Pause — nicht buchen' }, ...Array.from(ids, id => ({ value: id, label: foreignText(known.get(id) ?? 'Aufgabe wird geladen …') }))];
  }, [session.todoId, rows, tasks.state, known]);
  const changeRow = (key: number, patch: Partial<Row>) => { setRows(items => items.map(row => row.key === key ? { ...row, ...patch } : row)); setValidation(null); };
  const submit = () => {
    if (submitting.current || session.returnedAt === null) return;
    let allocations: IdleAllocation[];
    if (mode === 'break') allocations = [{ todoId: null, seconds, note: '' }];
    else if (mode === 'task') {
      const row = rows[0];
      if (!row || !row.todoId) { setValidation('Wählen Sie die Aufgabe aus, auf die die Zeit gebucht werden soll.'); return; }
      allocations = [{ todoId: row.todoId, seconds, note: row.note }];
    } else {
      if (rows.some(row => parseIdleDuration(row.duration) === null) || remaining !== 0) {
        setValidation('Verteilen Sie die gesamte Zeit. Geben Sie Minuten oder eine Dauer als Stunden:Minuten:Sekunden ein.'); return;
      }
      allocations = rows.map(row => ({ todoId: row.todoId || null, seconds: parseIdleDuration(row.duration)!, note: row.note }));
    }
    submitting.current = true;
    setValidation(null);
    void mutation.run(async () => {
      const result = await resolveIdleSession(session.id, allocations, resume);
      setOpen(false);
      changed();
      toasts.show({ tone: 'success', title: 'Inaktive Zeit zugeordnet.', body: result.alreadyResolved ? 'Diese Zeit wurde bereits bearbeitet.' : `${formatDuration(result.recordedSeconds)} gebucht, ${formatDuration(result.breakSeconds)} als Pause ausgelassen.${result.resumed ? ' Der Timer läuft wieder.' : ' Der Timer bleibt gestoppt.'}` });
    }).finally(() => { submitting.current = false; });
  };

  return <>
    <aside className="idle-reminder" aria-label="Inaktive Zeit">
      <span>{session.returnedAt === null ? 'Timer wegen Inaktivität angehalten.' : 'Inaktive Zeit wartet auf Zuordnung.'}</span>
      <Button variant="secondary" disabled={mutation.busy} onClick={() => {
        if (session.returnedAt !== null) { setOpen(true); return; }
        void mutation.run(async () => { await returnFromIdle(session.id); changed(); });
      }}>{session.returnedAt === null ? 'Ich bin wieder da' : 'Zeit zuordnen'}</Button>
      <span role="alert">{!open ? mutation.error : null}</span>
    </aside>
    <FormDialog open={open && session.returnedAt !== null} title="Willkommen zurück" wide
      description={`${formatDuration(seconds)} ohne Eingabe, während der Timer auf ${quotedName(session.todoTitle)} lief. Von ${formatDateTime(session.startedAt)} bis ${session.returnedAt === null ? 'jetzt' : formatDateTime(session.returnedAt)}.`}
      submitLabel="Zuordnung speichern" cancelLabel="Später zuordnen" busy={mutation.busy}
      error={validation ?? mutation.error} onSubmit={submit} onCancel={() => setOpen(false)}>
      <fieldset className="idle-mode"><legend>Wie möchten Sie diese Zeit behandeln?</legend>
        {([{ value: 'break', label: 'Als Pause auslassen' }, { value: 'task', label: 'Auf eine Aufgabe buchen' }, { value: 'split', label: 'Zeit aufteilen' }] as const).map(item =>
          <label className="choice__option" key={item.value}><input type="radio" name="idle-mode" checked={mode === item.value} disabled={mutation.busy} onChange={() => { setMode(item.value); setValidation(null); }} /><span>{item.label}</span></label>)}
      </fieldset>
      {mode === 'break' ? <p>Diese Zeit wird nicht als Leistung gebucht. Die aktive Zeit vor Ihrer Abwesenheit bleibt erhalten.</p> : <>
        <TextField label="Aufgaben suchen" value={search} onChange={setSearch} disabled={mutation.busy} hint="Sucht auch erledigte Aufgaben. Bei mehr als 100 Treffern grenzen Sie die Suche ein." />
        <p role="status">{tasks.state.status === 'loading' ? 'Aufgaben werden geladen …' : tasks.state.status === 'ready' ? `${tasks.state.value.total} Aufgaben gefunden.` : ''}</p>
        {tasks.state.status === 'error' ? <InlineMessage tone="danger" title="Aufgaben konnten nicht geladen werden">{tasks.state.message}<Button onClick={tasks.reload}>Erneut laden</Button></InlineMessage> : null}
        {(mode === 'task' ? rows.slice(0, 1) : rows).map((row, index) => <fieldset className="idle-allocation" key={row.key} disabled={mutation.busy}>
          <legend>{mode === 'split' ? `Abschnitt ${index + 1}` : 'Zuordnung'}</legend>
          <Select label="Aufgabe oder Pause" value={row.todoId} options={options} onChange={todoId => changeRow(row.key, { todoId })} disabled={mutation.busy} />
          {mode === 'split' ? <div className="idle-duration"><TextField label="Dauer" value={row.duration} onChange={duration => changeRow(row.key, { duration })} placeholder="20 oder 0:20:00" hint="Minuten oder Stunden:Minuten:Sekunden" disabled={mutation.busy} />
            <Button variant="secondary" disabled={mutation.busy || remaining <= 0} onClick={() => changeRow(row.key, { duration: formatStopwatch((parseIdleDuration(row.duration) ?? 0) + remaining) })}>Rest übernehmen</Button></div> : null}
          {row.todoId !== '' ? <TextField label="Leistung" value={row.note} onChange={note => changeRow(row.key, { note })} hint="Optional; kann später ergänzt werden." disabled={mutation.busy} /> : null}
          {mode === 'split' && rows.length > 1 ? <Button variant="secondary" onClick={() => setRows(items => items.filter(item => item.key !== row.key))}>Abschnitt entfernen</Button> : null}
        </fieldset>)}
        {mode === 'split' ? <>
          <p role="status">{remaining === 0 ? 'Die gesamte Zeit ist verteilt.' : remaining > 0 ? `Noch zu verteilen: ${formatStopwatch(remaining)}.` : `${formatStopwatch(-remaining)} zu viel verteilt.`}</p>
          <Button variant="secondary" disabled={mutation.busy || rows.length >= 50} onClick={() => setRows(items => [...items, { key: sequence.current++, todoId: '', duration: '', note: '' }])}>Abschnitt hinzufügen</Button>
        </> : null}
      </>}
      <label className="choice__option"><input type="checkbox" checked={resume} disabled={mutation.busy} onChange={event => setResume(event.target.checked)} /><span>Timer danach auf der ursprünglichen Aufgabe fortsetzen</span></label>
      <p className="field__hint">Der Timer startet nach dem Speichern neu. Die Zeit für diese Zuordnung wird nicht gebucht. „Später zuordnen“ bewahrt die offene Zeit und lässt den Timer angehalten.</p>
    </FormDialog>
  </>;
}
