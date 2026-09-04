/**
 * Bewegungssatz: Hauptanwendung gegen Aufgabenbereich (E-056, E-058, T-093,
 * `docs/testplan.md` Abschnitt 17 — in T-096 für Welle C zurückgestellt).
 *
 * ## Worum es geht
 *
 * Seit E-058 rechnet **ein** Anwendungsfall (`apps/local-api/src/usecases/
 * pool-movement.ts`) die Bewegung eines Todos durch die Pools, und **eine**
 * reine Funktion (`poolMovementSentence` aus `@takt/domain`) formuliert den
 * Satz darüber — die Hauptanwendung ruft sie am Timerstart
 * (`apps/web/src/app/TimerContext.tsx`), der Aufgabenbereich des Add-ins am
 * Fund und an der Buchung (`apps/outlook-addin/src/duplicate/reopen.ts`,
 * fremde Hoheit, hier nur gelesen). Dieselbe Handlung — ein erledigtes Todo
 * wird durch eine Buchung wieder offen — muss an beiden Flächen densel­ben
 * Satz ergeben.
 *
 * Die Erwartung wird bewusst **aus der Domänenfunktion gezogen**, nicht als
 * Literal in diesen Testfall geschrieben — genau wie
 * `apps/outlook-addin/scripts/proof-addin.mjs` es für den Aufgabenbereich
 * bereits tut. Ein Literal hier würde nur den heutigen Wortlaut ablichten;
 * die Funktion zu rufen prüft, dass beide Flächen sie **tatsächlich** rufen,
 * mit denselben drei Listen und demselben Anlass.
 *
 * `packages/domain/src/pool-movement.ts` hat keine Laufzeitabhängigkeit
 * (siehe deren Kopf: „Diese Datei importiert nichts"). Der relative Import
 * unten ist deshalb unbedenklich, obwohl `tests/e2e` kein Arbeitsbereichs­paket
 * ist (`pnpm-workspace.yaml` schließt `tests/**` ausdrücklich aus) — es gibt
 * keine zweite Fassung, nur einen zweiten Pfad zu derselben Datei.
 *
 * ## Der reine Board-Spalten-Fall (T-096, „in Welle C zurückgestellt")
 *
 * Die Spalte in Fall 1 unten hat `placement: 'board'` — eine reine
 * Kanban-Spalte, kein Pool. `GET /addin/context` würde sie nie nennen
 * (E-058 Punkt 7: die Route bleibt bei `list()`), aber der Bewegungssatz
 * rechnet über `list('all')` und nennt sie trotzdem. Genau das ist der Fall,
 * für den E-058 überhaupt geschrieben wurde — vorher kannte der
 * Aufgabenbereich nur Pools.
 */
import { test, expect } from '@playwright/test';

import { poolMovementSentence, type PoolMovement } from '../../packages/domain/src/pool-movement.ts';
import {
  addinBookOnTodo,
  addinTodoMatches,
  createPool,
  createTag,
  createTodo,
  deletePoolByName,
  deleteTag,
  deleteTodo,
  markTodoDone,
  stopTimer,
} from './support/api';
import { gotoTodo } from './support/nav';

/** `YYYY-MM-DDTHH:MM:SSZ` — Sekundengenauigkeit, wie es die Add-in-Routen verlangen. */
function isoSecond(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}

/** Ein Zeitraum von 15 Minuten, endend jetzt — beliebig, nur plausibel und > 0. */
function fifteenMinutesUntilNow(): { readonly startedAt: string; readonly endedAt: string } {
  const endedAt = new Date();
  const startedAt = new Date(endedAt.getTime() - 15 * 60 * 1000);
  return { startedAt: isoSecond(startedAt), endedAt: isoSecond(endedAt) };
}

test.describe('Bewegungssatz — Hauptanwendung gegen Aufgabenbereich, dieselbe Regel', () => {
  test('Nur `appears`, reine Board-Spalte: zeichengleich bis auf die Zeitform', async ({ page }) => {
    const run = Date.now();
    const columnName = `E2E-Bewegungssatz-Spalte-${run}`;
    const tag = await createTag(`E2E-Bewegungssatz-Erscheint-${run}`);
    await createPool({ name: columnName, placement: 'board', requiredTagIds: [tag.id] });

    const uiTodo = await createTodo({ title: `E2E-BEWEGUNG-UI-${run}`, tagIds: [tag.id] });
    const callNumber = `E2E-BEWEGUNG-ADDIN-${run}`;
    const addinTodo = await createTodo({
      title: `E2E-BEWEGUNG-ADDIN-${run}`,
      tagIds: [tag.id],
      callNumber,
    });

    try {
      await markTodoDone(uiTodo.id);
      await markTodoDone(addinTodo.id);

      // --- Hauptanwendung: Timerstart auf der Detailansicht (S-03) ----------
      await gotoTodo(page, uiTodo.id);
      await expect(page.locator('.done-switch strong')).toHaveText('Erledigt');
      const main = page.locator('#inhalt');
      const [startResponse] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes('/timer/start') && response.request().method() === 'POST',
        ),
        main.getByRole('button', { name: 'Timer starten' }).first().click(),
      ]);
      const startBody = (await startResponse.json()) as {
        data: { doneCleared: boolean; poolMovement: PoolMovement | null };
      };
      expect(startBody.data.doneCleared).toBe(true);
      const uiMovement = startBody.data.poolMovement;
      expect(uiMovement).not.toBeNull();
      // Der Punkt aus T-096: eine reine Board-Spalte steht im Bewegungssatz.
      expect(uiMovement?.appears).toContain(columnName);

      const expectedUiSentence = poolMovementSentence(uiMovement as PoolMovement, 'past', 'reopen');
      await expect(page.locator('.toast__title')).toContainText('ist wieder offen');
      // `announceStart` (`TimerContext.tsx`) setzt den Toast-Rumpf im
      // Wiederöffnen-Fall exakt auf den Satz aus `poolMovementSentence` —
      // keine weitere Umformulierung, kein Zusatztext.
      await expect(page.locator('.toast__body')).toHaveText(expectedUiSentence);

      // Aufräumen: den gerade gestarteten Timer sofort stoppen. Die
      // Stopp-Anzeige selbst ist Gegenstand von `timer-stop-announcement.spec.ts`.
      await stopTimer('E2E-Bewegungssatz-Aufräumung');

      // --- Aufgabenbereich: dieselbe Bewegung über die Add-in-Route ---------
      //
      // `GET /addin/todo-matches` liefert je Treffer dieselbe Rechnung wie der
      // Timerstart — `poolNames`/`enteringPoolNames`/`leavingPoolNames`, das
      // Ergebnis von `poolMovementNamer` (`apps/local-api/src/usecases/
      // pool-movement.ts`). `reopenPreview` (`duplicate/reopen.ts`) baut daraus
      // `{ appears: poolNames, enters: enteringPoolNames, leaves:
      // leavingPoolNames }` und ruft `poolMovementSentence(movement, 'future',
      // 'reopen')` — das wird hier nachgebildet, ohne die Datei selbst zu
      // importieren (fremde Hoheit).
      const before = await addinTodoMatches(callNumber);
      if (!before.searched) {
        throw new Error(`Call-Nummer unerwartet nicht durchsucht: ${before.reason}`);
      }
      const match = before.matches.find((entry) => entry.id === addinTodo.id);
      expect(match).toBeDefined();
      if (match === undefined) throw new Error('unreachable');

      const previewMovement: PoolMovement = {
        appears: match.poolNames,
        enters: match.enteringPoolNames,
        leaves: match.leavingPoolNames,
      };
      const expectedFutureAddin = poolMovementSentence(previewMovement, 'future', 'reopen');

      const booked = await addinBookOnTodo(addinTodo.id, {
        ...fifteenMinutesUntilNow(),
        note: 'E2E-Bewegungssatz-Notiz',
      });
      expect(booked.doneCleared).toBe(true);
      const bookedMovement: PoolMovement = {
        appears: booked.poolNames,
        enters: booked.enteringPoolNames,
        leaves: booked.leavingPoolNames,
      };
      // Ankündigung und Bestätigung reden über dieselbe Bewegung — dieselbe
      // Prüfung, die `proof:addin` seit T-092 Liste für Liste anstellt.
      expect(bookedMovement).toEqual(previewMovement);
      const expectedPastAddin = poolMovementSentence(bookedMovement, 'past', 'reopen');

      // Die eigentliche Erwartung aus dem Auftrag: zeichengleich bis auf die
      // Zeitform. Nach der Buchung (Vergangenheit) sagen beide Flächen exakt
      // denselben Satz — für dieselbe Regel, dieselbe reine Board-Spalte, in
      // derselben Sitzung, einmal aus der Oberfläche und einmal aus dem
      // Aufgabenbereich heraus ausgelöst.
      expect(expectedPastAddin).toBe(expectedUiSentence);
      expect(expectedFutureAddin).not.toBe(expectedPastAddin);
      expect(expectedFutureAddin).toContain(columnName);
      expect(expectedPastAddin).toContain(columnName);
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(uiTodo.id).catch(() => undefined);
      await deleteTodo(addinTodo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('Nur `leaves`: die Karte verlässt eine „Nur erledigt“-Spalte (Hauptanwendung)', async ({ page }) => {
    const run = Date.now();
    const columnName = `E2E-Bewegungssatz-NurErledigt-${run}`;
    const tag = await createTag(`E2E-Bewegungssatz-Leaves-${run}`);
    await createPool({
      name: columnName,
      placement: 'board',
      requiredTagIds: [tag.id],
      completion: 'done',
    });
    const todo = await createTodo({ title: `E2E-BEWEGUNG-LEAVES-${run}`, tagIds: [tag.id] });

    try {
      await markTodoDone(todo.id);

      await gotoTodo(page, todo.id);
      await expect(page.locator('.done-switch strong')).toHaveText('Erledigt');
      const main = page.locator('#inhalt');
      const [startResponse] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes('/timer/start') && response.request().method() === 'POST',
        ),
        main.getByRole('button', { name: 'Timer starten' }).first().click(),
      ]);
      const startBody = (await startResponse.json()) as { data: { poolMovement: PoolMovement | null } };
      const movement = startBody.data.poolMovement;
      expect(movement).not.toBeNull();
      // Die Spalte trifft nur Erledigte — nach dem Aufheben verlässt die Karte
      // sie, und sonst erscheint sie in nichts (E-056).
      expect(movement).toEqual({ appears: [], enters: [], leaves: [columnName] });

      const expected = poolMovementSentence(movement as PoolMovement, 'past', 'reopen');
      expect(expected).toBe(`Es ist aus „${columnName}“ verschwunden und erscheint sonst nirgends.`);
      await expect(page.locator('.toast__body')).toHaveText(expected);

      await stopTimer('E2E-Bewegungssatz-Aufräumung');
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('Kein Treffer: „… in keinem Pool und in keiner Spalte“ (Aufgabenbereich)', async () => {
    const run = Date.now();
    const callNumber = `E2E-BEWEGUNG-LEER-${run}`;
    const todo = await createTodo({ title: `E2E-BEWEGUNG-LEER-${run}`, callNumber });

    try {
      await markTodoDone(todo.id);

      const before = await addinTodoMatches(callNumber);
      if (!before.searched) {
        throw new Error(`Call-Nummer unerwartet nicht durchsucht: ${before.reason}`);
      }
      const match = before.matches.find((entry) => entry.id === todo.id);
      expect(match).toBeDefined();
      if (match === undefined) throw new Error('unreachable');
      expect(match.poolNames).toEqual([]);
      expect(match.enteringPoolNames).toEqual([]);
      expect(match.leavingPoolNames).toEqual([]);

      const nichts: PoolMovement = { appears: [], enters: [], leaves: [] };
      const expectedFuture = poolMovementSentence(nichts, 'future', 'reopen');
      expect(expectedFuture).toBe(
        'Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem Pool und in keiner Spalte.',
      );

      const booked = await addinBookOnTodo(todo.id, fifteenMinutesUntilNow());
      expect(booked.poolNames).toEqual([]);
      expect(booked.enteringPoolNames).toEqual([]);
      expect(booked.leavingPoolNames).toEqual([]);

      const expectedPast = poolMovementSentence(nichts, 'past', 'reopen');
      expect(expectedPast).toBe(
        'Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool und in keiner Spalte.',
      );
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });
});
