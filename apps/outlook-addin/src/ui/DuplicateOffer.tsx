/**
 * SuperTakt — Angebot bei bereits vorhandener Call-Nummer.
 *
 * Ein Treffer führt nicht mehr in eine Zeitbuchung. Stattdessen kann die
 * aktuell geöffnete E-Mail als Outlook-Verweis an das bestehende Todo gehängt
 * werden. Ein neues Todo bleibt weiterhin eine bewusste Alternative.
 */

import type { OfferDescription } from '../duplicate/rule.ts';
import { Button, Callout, Foreign } from './Primitives.tsx';

interface DuplicateOfferProps {
  readonly offers: readonly OfferDescription[];
  readonly onChoose: (offer: OfferDescription) => void;
  readonly busyTodoId: string | null;
  readonly canAttach: boolean;
}

export function DuplicateOffer({ offers, onChoose, busyTodoId, canAttach }: DuplicateOfferProps) {
  if (offers.length === 0) return null;

  const first = offers[0];
  const heading =
    offers.length === 1 && first !== undefined
      ? `Zu Call ${first.callNumber} gibt es bereits ein Todo.`
      : `Zu dieser Call-Nummer gibt es bereits ${String(offers.length)} Todos.`;

  return (
    <div className="offer">
      <Callout tone="warning" title={heading}>
        Hängen Sie diese E-Mail an das passende Todo oder legen Sie darunter bewusst ein neues an.
        Dabei wird auf dem vorhandenen Todo keine Zeit erfasst.
        Ein erledigtes Todo bleibt erledigt.
      </Callout>

      {!canAttach ? (
        <Callout tone="info">
          Outlook hat für diese Nachricht keinen Web-Verweis bereitgestellt. Das vorhandene Todo
          bleibt unverändert; ein neues Todo kann weiterhin angelegt werden.
        </Callout>
      ) : null}

      <ul className="offer__list">
        {offers.map((offer) => (
          <li key={offer.todoId} className="offer__item">
            <div className="offer__head">
              <Foreign className="offer__title" value={offer.title} />
              <span className="badge badge--call mono">{offer.callNumber}</span>
            </div>

            <p className="offer__meta">{offer.summary}</p>

            <Button
              variant="secondary"
              full
              loading={busyTodoId === offer.todoId}
              disabled={!canAttach}
              onClick={() => {
                onChoose(offer);
              }}
            >
              E-Mail an dieses Todo anhängen
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
