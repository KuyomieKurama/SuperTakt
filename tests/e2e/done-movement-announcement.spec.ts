/**
 * Toast nach „Erledigt"/„Wieder offen" trägt den Bewegungssatz (E-060 Punkt 4,
 * T-101, T-102, `docs/testplan.md` Abschnitt 19, Arbeitstitel TP-EXPST-13).
 *
 * Bis T-101/T-102 lieferten `PUT`/`DELETE /todos/{id}/done` kein `poolMovement`
 * — der Toast nach dem Setzen oder Aufheben von Hand schwieg deshalb über
 * Pools und Spalten, während derselbe Übergang über einen Timerstart
 * angesagt wurde (Befund O-U, `decisions.md` E-060). Seit T-101 rechnet
 * derselbe Anwendungsfall (`apps/local-api/src/usecases/pool-movement.ts`,
 * `switchTodoDone`) auch hier die Bewegung, mit `list('all')`; seit T-102
 * hängt `apps/web/src/screens/TodoDetailScreen.tsx` den Satz aus
 * `doneMovementSentence`/`withMovement` (`apps/web/src/lib/movement.ts`) an
 * den Toast an — genau wie am Stopp (E-058 Punkt 6).
 *
 * Zwei Anlässe (E-060 Punkt 2): `PUT` (Setzen) ist `'booking'` — die neutrale
 * Form, kein Wort von Buchung, kein „wieder". `DELETE` (Aufheben) ist
 * `'reopen'` — das Todo kehrt zurück, „wieder" stimmt. Die Erwartung kommt
 * aus der Domänenfunktion selbst (`@takt/domain`, `poolMovementSentence`),
 * gebildet aus der tatsächlichen Antwort des Dienstes — kein Literal,
 * dieselbe Bauart wie in `pool-movement-sentence.spec.ts` und
 * `timer-stop-announcement.spec.ts`.
 *
 * Aus dem Entwurf in `reports/T-103-e2e-tester.md` (Entwurf A), jetzt gegen
 * den tatsächlich ausgelieferten Quelltext geschrieben: Der Titel trägt den
 * Todo-Namen (`„<Titel>“ ist erledigt."`/`„<Titel>“ ist wieder offen."`,
 * `TodoDetailScreen.tsx`) — der T-103-Entwurf hatte hier noch offengelassen,
 * ob das eine bewusste Erweiterung oder ein Zwischenstand war; T-102 hat es
 * so ausgeliefert (Abschnitt 2 des Berichts) und dabei belassen. Der Rumpf
 * beginnt mit dem festen Satz „Der Status bleibt unverändert — Erledigt und
 * Status sind zwei getrennte Größen." und trägt den Bewegungssatz danach,
 * durch ein Leerzeichen getrennt — oder gar nichts, wenn `poolMovement` bzw.
 * der daraus gebildete Satz `null` ist.
 *
 * **Bedienung über `.click()`, nicht über `.check()`/`.uncheck()`.** Die
 * Checkbox ist serverbestätigt, nicht optimistisch: `checked={done}`
 * (`TodoDetailScreen.tsx`) hängt am Zustand aus `useAsync`, der erst
 * nach dem `PUT`/`DELETE`-Umlauf neu ankommt. `locator.check()`/`.uncheck()`
 * prüfen den Haken **unmittelbar** nach dem Klick und werfen „did not change
 * its state", weil React die Checkbox in genau diesem Zwischenschritt auf
 * ihrem alten Wert hält — unabhängig davon, ob die Anfrage im Hintergrund
 * längst mit dem richtigen Ergebnis geantwortet hat (belegt: derselbe Ablauf
 * über `.click()` plus anschließendes, selbst wartendes `expect(...)
 * .toBeChecked()` läuft ohne diesen Fehlschlag durch). Kein anderer Testfall
 * in `tests/e2e/**` benutzt `.check()`/`.uncheck()` — `.click()` ist hier die
 * durchgehende Bauart, auch für Kontrollkästchen.
 */
import { test, expect } from '@playwright/test';

import { poolMovementSentence, type PoolMovement } from '../../packages/domain/src/pool-movement.ts';
import {
  cleanupAnyTimer,
  createPool,
  createTag,
  createTodo,
  deletePoolByName,
  deleteTag,
  deleteTodo,
  markTodoDone,
} from './support/api';
import { gotoTodo } from './support/nav';

const UNCHANGED = 'Der Status bleibt unverändert — Erledigt und Status sind zwei getrennte Größen.';

test.afterEach(async () => {
  // Dasselbe Muster wie in `todo-revival.spec.ts`/`kanban.spec.ts` (T-048):
  // ein fehlgeschlagener Fall darf keinen laufenden oder verwaisten Timer
  // für den nächsten Fall hinterlassen (die Detailansicht fragt beim Laden
  // danach).
  await cleanupAnyTimer();
});

test.describe('Detailansicht: Bewegungssatz nach „Erledigt“/„Wieder offen“ (E-060 Punkt 4)', () => {
  test('Setzen (`PUT`, Anlass „booking“): der Toast trägt den Satz aus `poolMovementSentence`', async ({
    page,
  }) => {
    const run = Date.now();
    const columnName = `E2E-Done-NurErledigt-${run}`;
    const tag = await createTag(`E2E-Done-Setzen-${run}`);
    // `completion: 'done'` — eine Spalte, die ausschließlich erledigte Todos
    // aufnimmt. Das Todo unten ist noch nicht erledigt, steht also vor der
    // Handlung in keinem Pool.
    await createPool({ name: columnName, placement: 'both', requiredTagIds: [tag.id], completion: 'done' });
    const todo = await createTodo({ title: `E2E-DONE-SETZEN-${run}`, tagIds: [tag.id] });

    try {
      await gotoTodo(page, todo.id);
      const checkbox = page.locator('.done-switch input[type="checkbox"]');
      await expect(checkbox).not.toBeChecked();

      const [doneResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes(`/todos/${todo.id}/done`) && response.request().method() === 'PUT',
        ),
        checkbox.click(),
      ]);
      await expect(checkbox).toBeChecked();

      const doneBody = (await doneResponse.json()) as { data: { poolMovement: PoolMovement | null } };
      const movement = doneBody.data.poolMovement;
      expect(movement).not.toBeNull();
      // `appears` ist der Zustand nachher — die Erledigt-Spalte nimmt das
      // Todo jetzt zum ersten Mal auf.
      expect(movement).toEqual({ appears: [columnName], enters: [columnName], leaves: [] });

      const expected = poolMovementSentence(movement as PoolMovement, 'past', 'booking');
      expect(expected).not.toBeNull();
      if (expected === null) throw new Error('unreachable');
      expect(expected).toBe(`Es steht jetzt in „${columnName}“.`);

      const toast = page.locator('.toast').filter({ hasText: 'ist erledigt.' });
      await expect(toast.locator('.toast__title')).toHaveText(`„${todo.title}“ ist erledigt.`);
      await expect(toast.locator('.toast__body')).toHaveText(`${UNCHANGED} ${expected}`);
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('Aufheben (`DELETE`, Anlass „reopen“): „wieder" stimmt, der Satz kommt aus derselben Funktion', async ({
    page,
  }) => {
    const run = Date.now();
    const columnName = `E2E-Done-Wiederoffen-${run}`;
    const tag = await createTag(`E2E-Done-Aufheben-${run}`);
    await createPool({ name: columnName, placement: 'both', requiredTagIds: [tag.id], completion: 'done' });
    const todo = await createTodo({ title: `E2E-DONE-AUFHEBEN-${run}`, tagIds: [tag.id] });

    try {
      // Vorbedingung „bereits erledigt, steht in der Spalte" wird über die
      // rohe API hergestellt — die geprüfte Bedienung ist ausschließlich das
      // Aufheben über die Oberfläche gleich danach. Kein Toast entsteht
      // hierdurch: `markTodoDone` läuft an `toggleDone` (`TodoDetailScreen.tsx`)
      // vorbei.
      await markTodoDone(todo.id);

      await gotoTodo(page, todo.id);
      const checkbox = page.locator('.done-switch input[type="checkbox"]');
      await expect(checkbox).toBeChecked();

      const [doneResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes(`/todos/${todo.id}/done`) && response.request().method() === 'DELETE',
        ),
        checkbox.click(),
      ]);
      await expect(checkbox).not.toBeChecked();

      const doneBody = (await doneResponse.json()) as { data: { poolMovement: PoolMovement | null } };
      const movement = doneBody.data.poolMovement;
      expect(movement).not.toBeNull();
      // `leaves` ist der einzige besetzte Eintrag — die Spalte trifft nur
      // Erledigte, das Todo verlässt sie und erscheint sonst nirgends.
      expect(movement).toEqual({ appears: [], enters: [], leaves: [columnName] });

      const expected = poolMovementSentence(movement as PoolMovement, 'past', 'reopen');
      expect(expected).toBe(`Es ist aus „${columnName}“ verschwunden und erscheint sonst nirgends.`);

      const toast = page.locator('.toast').filter({ hasText: 'ist wieder offen.' });
      await expect(toast.locator('.toast__title')).toHaveText(`„${todo.title}“ ist wieder offen.`);
      await expect(toast.locator('.toast__body')).toHaveText(`${UNCHANGED} ${expected}`);
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('Kein Treffer: `poolMovement` bewegt sich, aber keine Regel — kein angehängter Satz', async ({
    page,
  }) => {
    // Kein Tag, keine Regel, die dieses Todo je aufnehmen könnte — anders
    // als am Stopp (`poolMovement: null`, weil dort gar nichts gerechnet
    // wird) ist das Kennzeichen hier die einzige Achse, die sich ändert:
    // Der Dienst liefert das übliche, aber leere Tripel
    // `{ appears: [], enters: [], leaves: [] }` statt `null` (T-101 Annahme
    // 3 — `null` heißt „das Kennzeichen hat sich nicht geändert", nicht
    // „keine Regel trifft"). `poolMovementSentence` mit Anlass `'booking'`
    // gibt für dieses leere Tripel `null` zurück (E-058-Tabelle: „booking,
    // nichts, nichts" → `null`) — und genau das prüft dieser Fall.
    const run = Date.now();
    const todo = await createTodo({ title: `E2E-DONE-KEINTREFFER-${run}` });

    try {
      await gotoTodo(page, todo.id);
      const checkbox = page.locator('.done-switch input[type="checkbox"]');
      await expect(checkbox).not.toBeChecked();

      const [doneResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes(`/todos/${todo.id}/done`) && response.request().method() === 'PUT',
        ),
        checkbox.click(),
      ]);
      await expect(checkbox).toBeChecked();

      const doneBody = (await doneResponse.json()) as { data: { poolMovement: PoolMovement | null } };
      const movement = doneBody.data.poolMovement;
      expect(movement).toEqual({ appears: [], enters: [], leaves: [] });

      const expected = poolMovementSentence(movement as PoolMovement, 'past', 'booking');
      expect(expected).toBeNull();

      const toast = page.locator('.toast').filter({ hasText: 'ist erledigt.' });
      // Genau der feste Satz, kein angehängtes Leerzeichen und kein zweiter
      // Satz — `withMovement` lässt bei `null` unverändert (`movement.ts`).
      await expect(toast.locator('.toast__body')).toHaveText(UNCHANGED);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });
});
