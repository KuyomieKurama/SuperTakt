/**
 * Takt — die Route des Kanban-Boards (A-5.3, A-5.4, E-054).
 *
 * ---------------------------------------------------------------------------
 * Warum es genau eine Route gibt und keine vier
 * ---------------------------------------------------------------------------
 *
 * Eine Spalte **ist** ein Pool (E-054). Alles, was man mit einer Spalte tut,
 * tut man deshalb über die Pool-Routen, die es seit T-021 gibt:
 *
 *   anlegen      `POST /pools`            mit `placement: 'board'`
 *   ändern       `PATCH /pools/{id}`      Name, Regel, Position, Anzeigeort
 *   löschen      `DELETE /pools/{id}`
 *   weiterlesen  `GET /pools/{id}/todos`  die nächste Seite **einer** Spalte
 *
 * Ein zweiter Satz Routen unter `/board/columns` wäre derselbe Satz unter einem
 * zweiten Namen — mit einer eigenen Prüfung, einem eigenen Schema und der
 * Aussicht, dass die beiden Sätze auseinanderlaufen. Was hier fehlt, fehlt
 * absichtlich.
 *
 * Bleibt die eine Frage, die keine Pool-Route beantwortet: **Wie sieht das
 * Board gerade aus?** Sie ist eine Frage nach mehreren Spalten auf einmal, samt
 * der Auskunft, welche Karte in mehr als einer von ihnen steht. Dafür ist diese
 * Route da, und sie liest nur.
 *
 * ---------------------------------------------------------------------------
 * Kein Ziehen, also kein PUT
 * ---------------------------------------------------------------------------
 *
 * E-054 hat A-5.2 aufgehoben: Karten werden nicht mehr zwischen Spalten
 * gezogen. Eine Regel lässt sich nicht durch Verschieben umkehren, ohne Tags zu
 * setzen, und der Auftraggeber hat das ausgeschlossen. Es gibt hier deshalb
 * keine Route, die eine Karte in eine Spalte legt — den Status ändert
 * `PATCH /todos/{id}`, und der Status ist seit E-054 nicht mehr die Spalte.
 */

import { Hono } from 'hono';

import type { AppContext } from '../usecases/context.ts';
import { loadBoard } from '../usecases/board.ts';
import { data } from '../http/problem.ts';
import { readFlag, readPagination } from '../http/input.ts';
import type { TaktEnv } from '../http/guards.ts';

export function createBoardRoutes(context: AppContext): Hono<TaktEnv> {
  const board = new Hono<TaktEnv>();

  /**
   * Das Board in **einem** Aufruf.
   *
   * `limit` gilt je Spalte, nicht für das Board: Zwölf Spalten mit je einer
   * Seite sind zwölf Seiten. Eine Fortsetzungsmarke nimmt diese Route
   * ausdrücklich **nicht** entgegen — eine Marke gehört zu genau einer
   * geordneten Liste, und hier sind es so viele Listen wie Spalten. Weiter
   * blättert man je Spalte über `GET /pools/{id}/todos`, mit der Marke, die
   * dieselbe Spalte hier mitgegeben hat.
   */
  board.get('/', async (c) => {
    const pagination = readPagination(c.req.query());
    return data(
      c,
      await loadBoard(context, {
        includeCompleted: readFlag(c.req.query('includeCompleted')),
        ...(pagination.limit === undefined ? {} : { limit: pagination.limit }),
      }),
    );
  });

  return board;
}
