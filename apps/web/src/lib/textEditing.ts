type TextControl = HTMLInputElement | HTMLTextAreaElement;
type Snapshot = { value: string; start: number | null; end: number | null };
type History = { entries: Snapshot[]; index: number };

function control(target: EventTarget | null): TextControl | null {
  if (target instanceof HTMLTextAreaElement) return target;
  if (target instanceof HTMLInputElement && ['text', 'search', 'email', 'url', 'tel', 'number'].includes(target.type)) return target;
  return null;
}
const snapshot = (field: TextControl): Snapshot => ({
  value: field.value, start: field.selectionStart, end: field.selectionEnd,
});

/** A field-local undo history also works when React/WebViews replace input values.
 * Clipboard, selection, word navigation and contenteditable keep native behavior.
 */
export function installTextEditing(): () => void {
  const histories = new WeakMap<TextControl, History>();
  let restoring = false;
  const current = (field: TextControl) => {
    let history = histories.get(field);
    if (!history || history.entries[history.index]?.value !== field.value) {
      history = { entries: [snapshot(field)], index: 0 };
      histories.set(field, history);
    }
    return history;
  };
  const remember = (event: Event) => {
    const field = control(event.target);
    if (!field || field.readOnly || field.disabled || restoring) return;
    const history = current(field);
    history.entries[history.index] = snapshot(field);
  };
  const changed = (event: Event) => {
    const field = control(event.target);
    if (!field || field.readOnly || field.disabled || restoring) return;
    const history = histories.get(field);
    if (!history) { current(field); return; }
    if (history.entries[history.index]?.value === field.value) return;
    history.entries = [...history.entries.slice(0, history.index + 1), snapshot(field)].slice(-100);
    history.index = history.entries.length - 1;
    // Keep accepted/normalized values, including controlled React inputs.
    queueMicrotask(() => {
      if (field.isConnected && histories.get(field) === history) history.entries[history.index] = snapshot(field);
    });
  };
  const keydown = (event: KeyboardEvent) => {
    const field = control(event.target);
    if (!field || field.readOnly || field.disabled || event.isComposing || event.altKey || !(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key !== 'z' && key !== 'y') return;
    const history = current(field);
    const index = history.index + (key === 'z' && !event.shiftKey ? -1 : 1);
    event.preventDefault();
    event.stopPropagation();
    const next = history.entries[index];
    if (!next) return;
    history.index = index;
    restoring = true;
    try {
      // Bypass React's value tracker so its onChange receives the restored value.
      const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(field, next.value);
      field.dispatchEvent(new Event('input', { bubbles: true }));
      if (next.start !== null && next.end !== null) field.setSelectionRange(next.start, next.end);
    } finally { restoring = false; }
  };
  document.addEventListener('focusin', remember, true);
  document.addEventListener('beforeinput', remember, true);
  document.addEventListener('input', changed, true);
  document.addEventListener('keydown', keydown, true);
  return () => {
    document.removeEventListener('focusin', remember, true);
    document.removeEventListener('beforeinput', remember, true);
    document.removeEventListener('input', changed, true);
    document.removeEventListener('keydown', keydown, true);
  };
}
