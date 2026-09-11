/**
 * SuperTakt — Warnung bei bereits vorhandener Call-Nummer.
 *
 * Seit der Entscheidung zu F-21 (T-247) handelt diese Fläche **nicht** mehr am
 * gefundenen Todo. Sie meldet den Treffer und sonst nichts: keine Zeitbuchung,
 * kein Anhang, kein Zusammenführen. Der einzige Weg, der von hier weiterführt,
 * ist der Abschnitt „Neues Todo" darunter — und den geht der Benutzer bewusst.
 *
 * A-19.19 bleibt damit auch strukturell wahr: Über das Add-in entsteht kein
 * Anhang, weil es dafür weder eine Fläche noch eine Route gibt.
 *
 * **Zwei Dinge sind in T-247-3 dazugekommen, und sie gehören zusammen:**
 *
 *  1. Die Warnung **nennt die Treffer** wieder — Titel und, falls erledigt,
 *     die Wortmarke „Erledigt", als Aufzählung ohne jedes Bedienelement
 *     (Y-03). Verboten ist nach A-10.9 eine **Handlung** am gefundenen Todo,
 *     nicht eine **Angabe** darüber; und der Satz darüber schickt den Benutzer
 *     nach SuperTakt, wo er wissen muss, wonach er sucht. Eine anonyme Warnung
 *     überliest jeder — dann entsteht das Duplikat unbemerkt, also genau der
 *     Schaden aus R-15.
 *  2. Die Region **steht immer da**, auch leer (Y-04). Ein `role="status"`,
 *     das erst zusammen mit seinem Inhalt in den Baum kommt, wird von vielen
 *     Vorlesehilfen nicht angesagt: Sie melden Änderungen an einer Region, die
 *     sie kennen, und diese kennen sie in dem Augenblick noch nicht. Dieselbe
 *     Bauart und derselbe Grund wie bei `Field` (T-158) und im
 *     Bestätigungsdialog der Hauptanwendung (T-118). Bis T-247-3 gab diese
 *     Datei `null` zurück, solange kein Treffer vorlag — die Warnung war für
 *     eine Vorlesehilfe damit stumm, und vorher trug den Fall allein der
 *     Zufall: Mit der Warnung erschienen Schaltflächen, und die fand ein
 *     Tastaturbenutzer beim Weitergehen.
 *
 * Punkt 2 ohne Punkt 1 sagte die falsche Sache an, deshalb sind beide in
 * einem Auftrag gebaut.
 *
 * Welcher der drei Fälle vorliegt, rechnet `duplicate/notice.ts` aus — eine
 * reine Funktion, die der Nachweislauf ausführen kann. Hier steht nur noch,
 * wie er aussieht.
 */

import { duplicateNotice } from '../duplicate/notice.ts';
import type { OfferDescription } from '../duplicate/rule.ts';
import { Callout, Foreign } from './Primitives.tsx';

interface DuplicateOfferProps {
  readonly offers: readonly OfferDescription[];
  /**
   * Die Call-Nummer, mit der tatsächlich gesucht wurde — oder `null`.
   *
   * Ohne sie wäre „gesucht und nichts gefunden" von „gar nicht gesucht" nicht
   * zu unterscheiden; beides sieht von hier aus wie eine leere Trefferliste
   * aus.
   */
  readonly checkedCallNumber: string | null;
}

export function DuplicateOffer({ offers, checkedCallNumber }: DuplicateOfferProps) {
  const notice = duplicateNotice(offers, checkedCallNumber);

  return (
    <div className="offer" role="status">
      {notice.kind === 'found' ? (
        <Callout
          tone="warning"
          role="none"
          title={
            notice.callNumber !== null ? (
              <>
                Zu Call <Foreign className="mono" value={notice.callNumber} /> gibt es bereits ein
                Todo.
              </>
            ) : (
              `Zu dieser Call-Nummer gibt es bereits ${String(notice.count)} Todos.`
            )
          }
        >
          <p className="offer__text">
            Bearbeiten Sie das vorhandene Todo in SuperTakt oder legen Sie darunter bewusst ein
            neues an. Ein neues Todo erfasst dabei keine Zeit auf dem vorhandenen und lässt dessen
            Erledigt-Kennzeichen unberührt.
          </p>
          <ul className="offer__list">
            {notice.items.map((item) => (
              <li key={item.todoId} className="offer__item">
                <span className="offer__title">
                  <Foreign value={item.title} />
                </span>
                {item.isDone ? <span className="offer__done">Erledigt</span> : null}
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}
      {notice.kind === 'none' ? (
        <p className="offer__none">
          Zu Call <Foreign className="mono" value={notice.callNumber} /> gibt es noch kein Todo.
        </p>
      ) : null}
    </div>
  );
}
