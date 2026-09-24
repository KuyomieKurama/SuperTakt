import { useState } from 'react';
import { listPriorities, savePriority, deletePriority, type TodoPriority } from './api';
import { useAsync, useMutation } from '../../app/useAsync';
import { useRefresh } from '../../app/RefreshContext';
import { Card, Button } from '../../shared/ui/Primitives';
import { FormDialog, TextField } from '../../shared/ui/FormDialog';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { AsyncBoundary } from '../../shared/ui/AsyncBoundary';
import { Foreign } from '../../shared/ui/Foreign';
import { quotedName } from '../../lib/foreign';
import { ServiceText } from '../../shared/ui/ServiceText';
import { settingsTexts } from './texts';

const MAX_NAME_LENGTH = 120;

export function PrioritySettings() {
  const { version, bump } = useRefresh();
  const priorities = useAsync(listPriorities, [], [version]);
  const mutation = useMutation();
  const [editing, setEditing] = useState<TodoPriority | null | undefined>(undefined);
  const [removing, setRemoving] = useState<TodoPriority | null>(null);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('0');
  // Messages appear after a submit attempt; the button is never locked for a fixable input (E-093).
  const [attempted, setAttempted] = useState(false);
  const text = settingsTexts();

  const edit = (priority: TodoPriority | null) => {
    setName(priority?.name ?? '');
    setWeight(String(priority?.weight ?? 0));
    setAttempted(false);
    mutation.clearError();
    setEditing(priority);
  };

  const trimmedName = name.trim();
  const nameProblem = trimmedName.length === 0
    ? text.priorityNameMissing
    : trimmedName.length > MAX_NAME_LENGTH ? text.priorityNameTooLong : null;
  const weightProblem = weight.trim() !== '' && Number.isSafeInteger(Number(weight)) ? null : text.priorityWeightInvalid;

  const submit = () => {
    setAttempted(true);
    if (nameProblem !== null || weightProblem !== null) return;
    void mutation.run(async () => {
      await savePriority(editing?.id ?? null, trimmedName, Number(weight));
      setEditing(undefined);
      bump();
    });
  };

  return <Card title={text.prioritiesTitle} description={text.prioritiesLead}
    actions={<Button iconStart="plus" onClick={() => edit(null)}>{text.addPriority}</Button>}>
    <AsyncBoundary state={priorities.state} onRetry={priorities.reload} label={text.prioritiesLoading}>
      {items => items.length === 0 ? <p className="muted">{text.noPriorities}</p> : <ul className="priority-settings">
        {items.map(priority => <li key={priority.id}><span className="grow"><Foreign value={priority.name} /></span><span className="tabular">{text.weightOf(priority.weight)}</span>
          <Button size="sm" variant="secondary" aria-label={text.editNamed(quotedName(priority.name))} onClick={() => edit(priority)}>{text.edit}</Button>
          <Button size="sm" variant="ghost" aria-label={text.deleteNamed(quotedName(priority.name))} onClick={() => { mutation.clearError(); setRemoving(priority); }}>{text.delete}</Button></li>)}
      </ul>}
    </AsyncBoundary>
    <FormDialog open={editing !== undefined} title={editing ? text.editPriority : text.createPriority} submitLabel={text.save} busy={mutation.busy} error={mutation.error} errorFromService={mutation.errorFromService}
      onCancel={() => setEditing(undefined)} onSubmit={submit}>
      <TextField label={text.name} value={name} onChange={setName} required
        {...(attempted && nameProblem !== null ? { error: nameProblem } : {})} />
      <TextField label={text.weight} type="number" value={weight} onChange={setWeight} required hint={text.weightHint}
        {...(attempted && weightProblem !== null ? { error: weightProblem } : {})} />
    </FormDialog>
    {/* The service refusal stands inside the dialog, in its always-present live region (SP-06). */}
    <ConfirmDialog open={removing !== null} title={text.deletePriorityTitle} description={removing ? text.willBeRemoved(quotedName(removing.name)) : ''}
      consequence={text.deletePriorityConsequence} confirmLabel={text.delete} tone="danger" busy={mutation.busy}
      {...(mutation.error === null ? {} : { refusal: <ServiceText text={mutation.error} fromService={mutation.errorFromService} /> })}
      onCancel={() => setRemoving(null)} onConfirm={() => { if (!removing) return; void mutation.run(async () => { await deletePriority(removing.id); setRemoving(null); bump(); }); }} />
  </Card>;
}
