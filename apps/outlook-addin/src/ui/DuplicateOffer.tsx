import type { OfferDescription } from '../duplicate/rule.ts';
import { duplicateNotice } from '../duplicate/notice.ts';
import { Button, Foreign } from './Primitives.tsx';
import { TEXTS } from './texts.ts';

interface DuplicateOfferProps {
  readonly offers: readonly OfferDescription[];
  readonly checkedCallNumber: string | null;
  readonly target: 'auto' | 'new' | { todoId: string };
  readonly onTarget: (target: 'new' | { todoId: string }) => void;
}

export function DuplicateOffer({ offers, checkedCallNumber, target, onTarget }: DuplicateOfferProps) {
  const notice = duplicateNotice(offers, checkedCallNumber);
  // The live region holds only the status sentence and stays in the tree, so screen readers announce changes (Y-04).
  const status = <p className="offer__status" role="status">
    {notice.kind === 'none' ? <>{TEXTS.offerNoneBefore}<Foreign value={notice.callNumber} />{TEXTS.offerNoneAfter}</> : null}
    {notice.kind === 'found' && notice.callNumber !== null ? <>{TEXTS.offerFoundOneBefore}<Foreign value={notice.callNumber} />{TEXTS.offerFoundOneAfter}</> : null}
    {notice.kind === 'found' && notice.callNumber === null ? TEXTS.offerFoundMany : null}
  </p>;

  return <>
    {status}
    {notice.kind === 'found' ? <fieldset className="offer">
      <legend>{notice.count === 1 ? TEXTS.offerOneLegend : TEXTS.offerManyLegend}</legend>
      {target !== 'new' ? <p>{TEXTS.offerAppendNote}</p> : null}
      {offers.map(offer => <label className="mail-option" key={offer.todoId}>
        <input type="radio" name="mail-target" checked={typeof target === 'object' && target.todoId === offer.todoId} onChange={() => onTarget({ todoId: offer.todoId })} />
        <span>{TEXTS.offerOptionPrefix} <Foreign value={offer.title} /> · {TEXTS.offerOptionCall} <Foreign value={offer.callNumber} />{offer.isDone ? ` · ${TEXTS.offerOptionDone}` : ''}</span>
      </label>)}
      <Button variant="ghost" onClick={() => onTarget('new')} disabled={target === 'new'}>{TEXTS.offerCreateInstead}</Button>
    </fieldset> : null}
  </>;
}
