import { useEffect, useRef, useState } from 'react';
import { resolveIdleSession, returnFromIdle, type IdleAllocation, type IdleSession } from '../api/idle';
import type { DraftText, ForeignText, Id } from '../api/types';
import { useMutation } from '../app/useAsync';
import { useToasts } from '../app/ToastContext';
import { formatDuration, formatStopwatch, formatTimeRange } from '../lib/format';
import { foreignText } from '../lib/foreign';
import { FormDialog, TextField } from './FormDialog';
import { Button, IconButton } from './Primitives';
import { IdleTaskSelect } from './IdleTaskSelect';
import { Icon } from './Icon';
import { Foreign } from './Foreign';

type Mode = 'break' | 'task' | 'split';
interface Row { key: number; todoId: Id | ''; title: ForeignText; duration: DraftText; note: DraftText }
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

export function IdleRecovery({ session, changed, running, resumeAfter = false }: { readonly session: IdleSession; readonly changed: () => void; readonly running: boolean; readonly resumeAfter?: boolean }) {
  const [open, setOpen] = useState(session.returnedAt !== null);
  const [mode, setMode] = useState<Mode>('break');
  const [rows, setRows] = useState<Row[]>([{ key: 0, todoId: session.todoId, title: session.todoTitle, duration: '', note: session.note }]);
  const sequence = useRef(1);
  const mutation = useMutation();
  const toasts = useToasts();
  const submitting = useRef(false);
  const [validation, setValidation] = useState<string | null>(null);
  useEffect(() => { if (session.returnedAt !== null) setOpen(true); }, [session.returnedAt]);
  const seconds = session.returnedAt === null ? 0 : Math.floor((Date.parse(session.returnedAt) - Date.parse(session.startedAt)) / 1000);
  const assigned = rows.reduce((sum, row) => sum + (parseIdleDuration(row.duration) ?? 0), 0);
  const remaining = seconds - assigned;
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
      const result = await resolveIdleSession(session.id, allocations, resumeAfter);
      setOpen(false);
      changed();
      toasts.show({ tone: 'success', title: 'Inaktive Zeit zugeordnet.', body: result.alreadyResolved ? 'Diese Zeit wurde bereits bearbeitet.' : `${formatDuration(result.recordedSeconds)} gebucht, ${formatDuration(result.breakSeconds)} als Pause ausgelassen.` });
    }).finally(() => { submitting.current = false; });
  };

  return <>
    <aside className="idle-reminder" aria-label="Inaktive Zeit">
      <span>{session.returnedAt === null ? (running ? 'Inaktivität erkannt · Timer läuft weiter.' : 'Inaktivität erkannt · Timer pausiert.') : 'Inaktive Zeit wartet auf Zuordnung.'}</span>
      <Button variant="secondary" disabled={mutation.busy} onClick={() => {
        if (session.returnedAt !== null) { setOpen(true); return; }
        void mutation.run(async () => { await returnFromIdle(session.id); changed(); });
      }}>{session.returnedAt === null ? 'Ich bin wieder da' : 'Zeit zuordnen'}</Button>
      <span role="alert">{!open ? mutation.error : null}</span>
    </aside>
    <FormDialog open={open && session.returnedAt !== null} title="👋 Willkommen zurück" wide={mode === 'split'}
      submitLabel={mode === 'break' ? 'Als Pause übernehmen' : 'Zeit buchen'} cancelLabel="Später" busy={mutation.busy}
      error={validation ?? mutation.error} onSubmit={submit} onCancel={() => setOpen(false)}>
      <div className="idle-summary">
        <span className="muted">Sie waren inaktiv für</span>
        <strong className="idle-summary__duration">{formatStopwatch(seconds)}</strong>
        <span className="muted">{session.returnedAt === null ? '' : formatTimeRange(session.startedAt, session.returnedAt)}</span>
        <span className="idle-summary__task" title={foreignText(session.todoTitle)}><Foreign value={session.todoTitle} /></span>
      </div>
      <fieldset className="idle-mode"><legend>Was haben Sie in dieser Zeit gemacht?</legend>
        {([{ value: 'break', label: 'Pause', emoji: '☕' }, { value: 'task', label: 'Gearbeitet', emoji: '🎯' }, { value: 'split', label: 'Aufteilen', emoji: '🔀' }] as const).map(item =>
          <label className="idle-mode__choice" key={item.value} data-selected={mode === item.value}>
            <input type="radio" name="idle-mode" checked={mode === item.value} disabled={mutation.busy} onChange={() => { setMode(item.value); setValidation(null); }} />
            <span className="idle-mode__emoji" aria-hidden="true">{item.emoji}</span><span>{item.label}</span>
          </label>)}
      </fieldset>
      {mode === 'break' ? <p className="idle-summary__hint">Diese Zeit wird nicht gebucht.</p> : <>
        {(mode === 'task' ? rows.slice(0, 1) : rows).map((row, index) => <fieldset className="idle-allocation" key={row.key} disabled={mutation.busy}>
          {mode === 'split' ? <legend>Abschnitt {index + 1}</legend> : null}
          <div className="idle-allocation__fields">
            <IdleTaskSelect label={mode === 'split' ? 'Aufgabe oder Pause' : 'Aufgabe'} value={row.todoId} title={row.title} allowPause={mode === 'split'} onChange={(todoId, title) => changeRow(row.key, { todoId, title })} disabled={mutation.busy} />
            {mode === 'split' ? <div className="idle-duration"><TextField label="Dauer" value={row.duration} onChange={duration => changeRow(row.key, { duration })} placeholder="Minuten oder h:mm:ss" disabled={mutation.busy} />
              <IconButton icon="clock" label="Rest übernehmen" disabled={mutation.busy || remaining <= 0} onClick={() => changeRow(row.key, { duration: formatStopwatch((parseIdleDuration(row.duration) ?? 0) + remaining) })} />
              {rows.length > 1 ? <IconButton icon="x" label={`Abschnitt ${index + 1} entfernen`} disabled={mutation.busy} onClick={() => setRows(items => items.filter(item => item.key !== row.key))} /> : null}
            </div> : null}
          </div>
          {row.todoId !== '' ? <details className="idle-note"><summary>{row.note ? 'Leistung bearbeiten' : 'Leistung hinzufügen'}</summary>
            <TextField label="Leistung (optional)" value={row.note} onChange={note => changeRow(row.key, { note })} disabled={mutation.busy} />
          </details> : null}
        </fieldset>)}
        {mode === 'split' ? <div className="idle-split-footer">
          <Button variant="ghost" iconStart="plus" disabled={mutation.busy || rows.length >= 50} onClick={() => setRows(items => [...items, { key: sequence.current++, todoId: '', title: 'Pause — nicht buchen', duration: '', note: '' }])}>Abschnitt hinzufügen</Button>
          <span role="status">{remaining === 0 ? 'Alles verteilt' : remaining > 0 ? `${formatStopwatch(remaining)} übrig` : `${formatStopwatch(-remaining)} zu viel`}</span>
        </div> : null}
      </>}
      <p className="idle-continuing"><Icon name={running ? "play" : "pause"} size={14} />{running ? "Der Timer läuft weiter." : resumeAfter ? "Der Timer läuft nach der Zuordnung weiter." : "Der Timer ist gestoppt."}</p>
    </FormDialog>
  </>;
}
