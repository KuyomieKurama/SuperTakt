import type { OfferDescription } from '../duplicate/rule.ts';
import { Button, Foreign } from './Primitives.tsx';
interface DuplicateOfferProps {
  readonly offers: readonly OfferDescription[];
  readonly checkedCallNumber: string | null;
  readonly target?: 'auto' | 'new' | { todoId: string };
  readonly onTarget?: (target: 'new' | { todoId: string }) => void;
}
export function DuplicateOffer({ offers, checkedCallNumber, target, onTarget }: DuplicateOfferProps) {
  const notice = { kind: offers.length > 0 ? 'found' : 'none' };
  return <div className="offer" role="status">
    {notice.kind === 'none' ? (checkedCallNumber ? <p>Zu Call <Foreign value={checkedCallNumber} /> gibt es noch kein Todo.</p> : null) : <fieldset className="offer">
    <legend>{offers.length === 1 ? 'Passende Aufgabe' : 'Mehrere passende Aufgaben – bitte auswählen'}</legend>
    <p>Die E-Mail wird als Anhang an der ausgewählten Aufgabe gespeichert. Das Ergänzen erfasst keine Zeit und lässt erledigte Aufgaben erledigt.</p>
    {offers.map(offer => <label className="mail-option" key={offer.todoId}>
      <input type="radio" name="mail-target" checked={typeof target === 'object' && target.todoId === offer.todoId} onChange={() => onTarget?.({ todoId: offer.todoId })} />
      <span>Zur Aufgabe ergänzen: <Foreign value={offer.title} /> · Call <Foreign value={offer.callNumber} />{offer.isDone ? ' · Erledigt' : ''}</span>
    </label>)}
    <Button variant="ghost" onClick={() => onTarget?.('new')} disabled={target === 'new'}>Stattdessen neue Aufgabe erstellen</Button>
  </fieldset>}
  </div>;
}
