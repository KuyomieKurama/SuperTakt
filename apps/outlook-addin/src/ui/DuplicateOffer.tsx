/**
 * Takt — das Duplikatangebot (A-10.9, R-15, B-4.3 Punkt 5 und 6).
 *
 * Der wichtigste Bildschirmausschnitt dieses Add-ins, und der einzige, bei dem
 * ein Fehler beim Kunden ankommt.
 *
 * Was hier **nicht** passiert:
 *
 *  - Kein Vorschlag ist vorausgewählt. Die Hauptaktion des Aufgabenbereichs
 *    bleibt „Neues Todo anlegen"; auf ein vorhandenes zu buchen verlangt einen
 *    eigenen Klick auf genau diese Karte.
 *  - Keine Karte ohne Titel und ohne Call-Nummer. Eine anonyme Ja/Nein-Frage
 *    beantwortet jeder mit Ja; Titel und Tags lassen einen Menschen den
 *    falschen Kunden sofort erkennen.
 *  - Kein „wahrscheinlichster Treffer" und keine Sortierung nach Ähnlichkeit.
 *    Gesucht wurde auf **Gleichheit** der Call-Nummer; alles Weitere wäre
 *    geraten.
 *  - **Keine verschwiegene Folge.** Ist der Treffer erledigt, steht schon hier,
 *    dass eine Buchung darauf das Kennzeichen aufhebt (A-2.5, T-038). Eine
 *    Auskunft nach dem Klick ist eine Überraschung; dieselbe Auskunft davor ist
 *    eine Information.
 */

import type { OfferDescription } from '../duplicate/rule.ts';
import { REOPEN_HINT } from '../duplicate/reopen.ts';
import { Button, Callout } from './Primitives.tsx';

interface DuplicateOfferProps {
  readonly offers: readonly OfferDescription[];
  readonly onChoose: (offer: OfferDescription) => void;
  readonly busyTodoId: string | null;
}

export function DuplicateOffer({ offers, onChoose, busyTodoId }: DuplicateOfferProps) {
  if (offers.length === 0) return null;

  const first = offers[0];
  const heading =
    offers.length === 1 && first !== undefined
      ? `Zu Call ${first.callNumber} gibt es bereits ein Todo.`
      : `Zu dieser Call-Nummer gibt es bereits ${String(offers.length)} Todos.`;

  return (
    <div className="offer">
      <Callout tone="warning" title={heading}>
        Darauf buchen oder trotzdem ein neues Todo anlegen? Takt entscheidet das nicht von selbst.
      </Callout>

      <ul className="offer__list">
        {offers.map((offer) => (
          <li key={offer.todoId} className="offer__item">
            <div className="offer__head">
              <span className="offer__title">{offer.title}</span>
              <span className="badge badge--call mono">{offer.callNumber}</span>
            </div>

            <p className="offer__meta">{offer.summary}</p>

            {offer.exportedSeconds > 0 ? (
              <p className="offer__warn">
                Auf diesem Todo ist bereits Zeit abgerechnet. Weitere Zeit hier zu buchen ist
                möglich, gehört aber gesehen.
              </p>
            ) : null}

            {/*
              A-2.5 seit T-038: Die Aufhebung ist keine Wahl mehr, also steht
              hier keine Bedingung („sofern du …"), sondern die Folge. Der
              vollständige Satz mit den Pools kommt im Bestätigungsschritt —
              hier ist eine Zeile Platz, und diese eine Zeile muss reichen, um
              niemanden zu überraschen.
            */}
            {offer.isDone ? <p className="offer__warn">{REOPEN_HINT}</p> : null}

            <Button
              variant="secondary"
              full
              loading={busyTodoId === offer.todoId}
              onClick={() => {
                onChoose(offer);
              }}
            >
              Auf dieses Todo buchen
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
