/**
 * Buchung von Hand liefert die Poolbewegung (E-061 Nachtrag, O-V, T-107,
 * T-108, `docs/testplan.md` Abschnitt 20, Auftrag T-113 Punkt 1).
 *
 * Bis T-107 lieferte `POST /time-entries` kein `poolMovement`: Eine Buchung
 * von Hand konnte die erste abgeschlossene Buchung eines Todos sein und damit
 * „hat offene Buchungen" von falsch auf wahr setzen — dieselbe Achse, die
 * jede Spalte mit `exportState: 'open'` prüft —, ohne dass der Toast danach
 * etwas davon sagte, während derselbe Übergang am Timerstopp längst
 * angesagt wurde (E-058 Punkt 6). Seit T-107 rechnet die Route mit
 * `closedEntryMovementStates` (`ENTRY_CLOSED_EFFECT`) — **derselben**
 * Rechnung wie `POST /timer/stop`, nicht mit `bookingMovementStates`: Eine
 * Buchung von Hand hebt „Erledigt" nicht auf, das tut nach A-2.5 allein der
 * Timerstart (`decisions.md`, E-061, Nachtrag, „Richtiggestellt nach
 * T-107"). Seit T-108 hängt `apps/web/src/screens/BookingDialogs.tsx`
 * (`BookingFormDialog.submit`) den Satz aus `bookingSentence`
 * (`apps/web/src/lib/movement.ts`, letztlich `poolMovementSentence` aus
 * `@takt/domain`) an den Toast „Zeit gebucht auf „X“." — Titel nennt das
 * Todo, der Rumpf beginnt mit „Gebucht: <Dauer>." und trägt den Bewegungssatz
 * danach, oder gar nichts, wenn `poolMovement` bzw. der daraus gebildete Satz
 * `null` ist.
 *
 * Die Erwartung kommt aus der Domänenfunktion selbst (`@takt/domain`,
 * `poolMovementSentence`), gebildet aus der tatsächlichen Antwort des
 * Dienstes — kein Literal, dieselbe Bauart wie in
 * `timer-stop-announcement.spec.ts` und `done-movement-announcement.spec.ts`.
 *
 * Drei Fälle, wie im Auftrag benannt:
 *
 *  1. Ein offenes Todo ohne jede Buchung — die erste Buchung von Hand bewegt
 *     es in jede Spalte mit `exportState: 'open'`, die auf seine Tags passt.
 *  2. Die Gegenprobe: Das Todo hat bereits eine offene, abgeschlossene
 *     Buchung — `movementOfBooking` liefert `null`
 *     (`apps/local-api/src/usecases/timer.ts`), keine Bewegung möglich, der
 *     Toast bleibt ohne angehängte Zeile.
 *  3. Ein erledigtes Todo — „Erledigt" bleibt gesetzt (A-2.5), und weil
 *     `closedEntryMovementStates` `completedAt` unverändert lässt, meldet die
 *     Bewegung kein Verlassen einer Spalte, die nach `completion: 'done'`
 *     fragt: Das Todo stand dort schon vor der Buchung und steht dort
 *     danach unverändert (`appears`, nicht `leaves`).
 *
 * Alle drei laufen über den echten Dialog „Zeit von Hand erfassen"
 * (`BookingFormDialog`, ausgelöst über den Knopf „Zeit von Hand" auf der
 * Todo-Detailansicht) — kein Aufbau an der Oberfläche vorbei, wie es
 * `kanban.spec.ts` für Spalten verlangt.
 *
 * **Zur Ortszeit der Eingabefelder.** `Anfang`/`Ende` sind
 * `datetime-local`-Felder; `fromLocalInputValue` (`apps/web/src/lib/
 * format.ts`) liest sie in der **Ortszeit des Browsers**. Wie in
 * `calendar-day-boundary.spec.ts` festgehalten, läuft diese Maschine in
 * `Europe/Berlin` — derselben Zone, die `playwright.config.ts`
 * (`timezoneId`) dem Browser vorgibt —, und `localInputValue` unten benutzt
 * deshalb bewusst die lokalen `Date`-Zugriffe (`getHours`, `getMinutes`)
 * statt einer Explizitzone.
 */
import { test, expect } from '@playwright/test';

import { poolMovementSentence, type PoolMovement } from '../../packages/domain/src/pool-movement.ts';
import {
  createPool,
  createTag,
  createTimeEntry,
  createTodo,
  deletePoolByName,
  deleteTag,
  deleteTodo,
  markTodoDone,
  type CreatedTimeEntryResult,
} from './support/api';
import { gotoTodo } from './support/nav';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Wert für ein `datetime-local`-Feld, in der Ortszeit dieses Laufs (Kopf dieser Datei). */
function localInputValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  return `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Zeitstempel für die rohe API — `timestampSchema` verlangt `YYYY-MM-DDTHH:MM:SSZ`, ohne Millisekunden. */
function isoNoMillis(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

test.describe('Buchung von Hand liefert die Poolbewegung (E-061 Nachtrag, O-V)', () => {
  test('Erste Buchung auf ein offenes Todo ohne Buchung: Toast trägt Dauer und Bewegungssatz', async ({
    page,
  }) => {
    const run = Date.now();
    const columnName = `E2E-Handbuchung-NochOffen-${run}`;
    const tag = await createTag(`E2E-Handbuchung-Erste-${run}`);
    // `exportState: 'open'` — genau die Achse aus E-058 Punkt 6/E-061: Die
    // erste abgeschlossene Buchung setzt „hat offene Buchungen", und diese
    // Spalte fragt danach.
    await createPool({ name: columnName, placement: 'pool', requiredTagIds: [tag.id], exportState: 'open' });
    const todo = await createTodo({ title: `E2E-HANDBUCHUNG-ERSTE-${run}`, tagIds: [tag.id] });

    try {
      await gotoTodo(page, todo.id);
      const main = page.locator('#inhalt');
      await main.getByRole('button', { name: 'Zeit von Hand' }).click();

      const dialog = page.getByRole('dialog', { name: 'Zeit von Hand erfassen' });
      await expect(dialog).toBeVisible();

      const start = new Date();
      start.setHours(start.getHours() - 3, 0, 0, 0);
      const end = new Date(start.getTime() + 45 * 60 * 1000);
      await dialog.getByLabel('Anfang').fill(localInputValue(start));
      await dialog.getByLabel('Ende').fill(localInputValue(end));
      await dialog.getByLabel('Leistung').fill('E2E-Handbuchung-Leistungstext');

      const [createResponse] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes('/time-entries') && response.request().method() === 'POST',
        ),
        dialog.getByRole('button', { name: 'Buchen' }).click(),
      ]);
      await expect(dialog).toBeHidden();

      const createdBody = (await createResponse.json()) as { data: CreatedTimeEntryResult };
      const movement = createdBody.data.poolMovement;
      expect(movement).not.toBeNull();
      // `appears` ist der Zustand **nachher** (siehe `PoolMovement` in
      // `packages/domain/src/pool-movement.ts`) — die erste abgeschlossene
      // Buchung füllt die Spalte sowohl in `appears` als auch in `enters`.
      expect(movement).toEqual({ appears: [columnName], enters: [columnName], leaves: [] });

      const expected = poolMovementSentence(movement as PoolMovement, 'past', 'booking');
      expect(expected).not.toBeNull();
      if (expected === null) throw new Error('unreachable');
      expect(expected).toBe(`Es steht jetzt in „${columnName}“.`);

      // Scoped auf genau diesen Toast (`.toast--success` trägt nur einen mit
      // diesem Titel) — dieselbe Bauart wie in `timer-stop-announcement.spec.ts`.
      const toast = page.locator('.toast').filter({ hasText: 'Zeit gebucht' });
      await expect(toast.locator('.toast__title')).toHaveText(`Zeit gebucht auf „${todo.title}“.`);
      // 45 Minuten ohne Sekundenrest — `formatDuration` (`lib/format.ts`)
      // liefert dafür `0:45 h`, kein `?? ''` und keine eigene Rechnung hier.
      await expect(toast.locator('.toast__body')).toHaveText(`Gebucht: 0:45 h. ${expected}`);
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('Gegenprobe — Todo mit bereits offener Buchung: `poolMovement` ist `null`, Toast ohne Bewegungszeile', async ({
    page,
  }) => {
    const run = Date.now();
    const columnName = `E2E-Handbuchung-BereitsOffen-${run}`;
    const tag = await createTag(`E2E-Handbuchung-Zweite-${run}`);
    await createPool({ name: columnName, placement: 'pool', requiredTagIds: [tag.id], exportState: 'open' });
    const todo = await createTodo({ title: `E2E-HANDBUCHUNG-ZWEITE-${run}`, tagIds: [tag.id] });

    // Vorbedingung über die rohe API (reine Vorbereitung, kein Teil der
    // geprüften Bedienung, wie überall in `tests/e2e/**`): Das Todo hat
    // schon eine offene, abgeschlossene Buchung — `presence.hasOpen` ist
    // beim zweiten Anlegen bereits wahr, `movementOfBooking` liefert dann
    // `null` (`usecases/timer.ts`), ohne überhaupt eine Regel aufzulösen.
    const earlier = new Date();
    earlier.setHours(earlier.getHours() - 5, 0, 0, 0);
    await createTimeEntry({
      todoId: todo.id,
      startedAt: isoNoMillis(earlier),
      endedAt: isoNoMillis(new Date(earlier.getTime() + 20 * 60 * 1000)),
      note: 'E2E-Handbuchung-Vorbuchung',
    });

    try {
      await gotoTodo(page, todo.id);
      const main = page.locator('#inhalt');
      await main.getByRole('button', { name: 'Zeit von Hand' }).click();

      const dialog = page.getByRole('dialog', { name: 'Zeit von Hand erfassen' });
      await expect(dialog).toBeVisible();

      const start = new Date();
      start.setHours(start.getHours() - 2, 0, 0, 0);
      const end = new Date(start.getTime() + 15 * 60 * 1000);
      await dialog.getByLabel('Anfang').fill(localInputValue(start));
      await dialog.getByLabel('Ende').fill(localInputValue(end));
      await dialog.getByLabel('Leistung').fill('E2E-Handbuchung-ZweiteLeistung');

      const [createResponse] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes('/time-entries') && response.request().method() === 'POST',
        ),
        dialog.getByRole('button', { name: 'Buchen' }).click(),
      ]);
      await expect(dialog).toBeHidden();

      const createdBody = (await createResponse.json()) as { data: CreatedTimeEntryResult };
      expect(createdBody.data.poolMovement).toBeNull();

      const toast = page.locator('.toast').filter({ hasText: 'Zeit gebucht' });
      await expect(toast.locator('.toast__title')).toHaveText(`Zeit gebucht auf „${todo.title}“.`);
      // Kein angehängter Satz — `withMovement` (`lib/movement.ts`) lässt den
      // Rumpf bei `poolMovement: null` unverändert, kein Leerzeichen am Ende.
      await expect(toast.locator('.toast__body')).toHaveText('Gebucht: 0:15 h.');
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('Erledigtes Todo: „Erledigt“ bleibt gesetzt, keine Verlassen-Meldung für die Erledigt-Spalte', async ({
    page,
  }) => {
    const run = Date.now();
    const columnName = `E2E-Handbuchung-ErledigtSpalte-${run}`;
    const tag = await createTag(`E2E-Handbuchung-Erledigt-${run}`);
    // `completion: 'done'`, ohne Achse zum Exportstatus — die Spalte fragt
    // ausschließlich danach, ob das Todo erledigt ist und das Tag trägt.
    await createPool({ name: columnName, placement: 'pool', requiredTagIds: [tag.id], completion: 'done' });
    const todo = await createTodo({ title: `E2E-HANDBUCHUNG-ERLEDIGT-${run}`, tagIds: [tag.id] });
    await markTodoDone(todo.id);

    try {
      await gotoTodo(page, todo.id);
      const checkbox = page.locator('.done-switch input[type="checkbox"]');
      await expect(checkbox).toBeChecked();

      const main = page.locator('#inhalt');
      await main.getByRole('button', { name: 'Zeit von Hand' }).click();

      const dialog = page.getByRole('dialog', { name: 'Zeit von Hand erfassen' });
      await expect(dialog).toBeVisible();

      const start = new Date();
      start.setHours(start.getHours() - 3, 0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      await dialog.getByLabel('Anfang').fill(localInputValue(start));
      await dialog.getByLabel('Ende').fill(localInputValue(end));
      await dialog.getByLabel('Leistung').fill('E2E-Handbuchung-ErledigtLeistung');

      const [createResponse] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes('/time-entries') && response.request().method() === 'POST',
        ),
        dialog.getByRole('button', { name: 'Buchen' }).click(),
      ]);
      await expect(dialog).toBeHidden();

      const createdBody = (await createResponse.json()) as { data: CreatedTimeEntryResult };
      const movement = createdBody.data.poolMovement;
      expect(movement).not.toBeNull();
      // Die Erledigt-Spalte nahm das Todo schon vor der Buchung auf
      // (`completedAt` bleibt bei `closedEntryMovementStates` unverändert —
      // A-2.5, nur der Timerstart hebt „Erledigt" auf) und bleibt es danach:
      // kein Verlassen (`leaves`), kein neues Betreten (`enters`).
      expect(movement).toEqual({ appears: [columnName], enters: [], leaves: [] });

      // „Erledigt" bleibt gesetzt — anders als am Timerstart hebt die
      // Buchung von Hand das Kennzeichen nicht auf (A-2.5, E-061 Nachtrag).
      await expect(checkbox).toBeChecked();

      const toast = page.locator('.toast').filter({ hasText: 'Zeit gebucht' });
      await expect(toast.locator('.toast__title')).toHaveText(`Zeit gebucht auf „${todo.title}“.`);
      // `poolMovementSentence` mit einem Tripel, in dem `enters` und `leaves`
      // leer sind, liefert `null` für den Anlass `'booking'` (E-058-Tabelle,
      // `appears` zählt dort nicht) — keine angehängte Zeile.
      expect(poolMovementSentence(movement as PoolMovement, 'past', 'booking')).toBeNull();
      await expect(toast.locator('.toast__body')).toHaveText('Gebucht: 0:30 h.');
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });
});
