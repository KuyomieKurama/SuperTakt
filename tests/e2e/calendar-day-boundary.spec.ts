/**
 * Die Tagesgrenze in Ortszeit statt UTC (T-041, Code-Review-Befund, T-048).
 *
 * `packages/storage/src/sqlite/repo-time.ts` bestimmte den Kalendertag einer
 * Buchung für den Zeitbuchungs-Filter bis T-041 über `date(started_at)` —
 * eine reine UTC-Auswertung des gespeicherten Zeitstempels — während die
 * Fachlogik (`toCalendarDay`, `packages/domain/src/kernel.ts`) und der Export
 * längst in Ortszeit rechneten. Diese Maschine läuft in `Europe/Berlin`
 * (UTC+2 im Sommer): Eine Buchung, die **kurz nach Mitternacht Ortszeit**
 * beginnt, liegt in UTC noch im **Vortag** — genau das Fenster, das T-024
 * nachgemessen hat („00:00 bis 02:00 Ortszeit"). Der Filter „Ab Tag"/„Bis
 * Tag" in S-06 (`fromDay`/`toDay`, `BookingsScreen.tsx`) ist der einzige Ort
 * der Oberfläche, der diesen Wert überhaupt entgegennimmt — deshalb wird hier
 * geprüft, nicht am Export (der schon vorher richtig rechnete).
 *
 * Eine Buchung um 23:30 Ortszeit — der Auftragswortlaut — liegt bei einem
 * Rechner mit positivem UTC-Versatz (wie diesem) technisch **nicht** in der
 * Fehlerzone: 23:30 CEST ist 21:30 UTC, also derselbe UTC-Kalendertag. Sie
 * ist trotzdem als Kontrollfall unten mit dabei (muss ohnehin bestehen); der
 * eigentliche, unterscheidende Nachweis läuft über eine Buchung kurz nach
 * Mitternacht Ortszeit, wo UTC- und Ortstag tatsächlich auseinanderfallen.
 */
import { test, expect } from '@playwright/test';

import { createTimeEntry, createTodo, deleteTimeEntry, listTimeEntriesByTodo } from './support/api';
/** Ein Zeitpunkt heute, in der Ortszeit dieses Testlaufs. */
function todayAt(hour: number, minute: number): string {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Der Ortstag (YYYY-MM-DD) eines Datums, in derselben Zone wie der Dienst (Systemzone). */
function localCalendarDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

test.describe('Tagesgrenze in Ortszeit (T-041, Nachtrag T-048)', () => {
  test('Buchung kurz nach Mitternacht Ortszeit gehört zum laufenden Ortstag, nicht zum UTC-Vortag', async ({
    page,
  }) => {
    const title = `E2E-MIDNIGHT-${Date.now()}`;
    const todo = await createTodo({ title });
    // 00:30 Ortszeit: in UTC+2 (Sommerzeit) ist das 22:30 UTC des Vortags —
    // `date(started_at)` läse "gestern", `toCalendarDay` in Ortszeit "heute".
    await createTimeEntry({
      todoId: todo.id,
      startedAt: todayAt(0, 30),
      endedAt: todayAt(0, 45),
      note: 'Kurz nach Mitternacht Ortszeit',
    });

    const today = localCalendarDay(new Date());
    const yesterday = localCalendarDay(new Date(Date.now() - 24 * 60 * 60 * 1000));

    // Gefiltert auf "heute" (Ortstag) muss die Buchung erscheinen.
    await page.goto(
      `/#/buchungen?${new URLSearchParams({ von: today, bis: today, todo: todo.id }).toString()}`,
    );
    await expect(page.locator('.table__row', { hasText: title })).toBeVisible();

    // Gefiltert auf "gestern" darf sie nicht erscheinen — der UTC-Bug hätte
    // sie genau dort gezeigt. Über die Felder "Ab Tag"/"Bis Tag" statt eines
    // zweiten `page.goto()`: Ein reiner Hash-Wechsel auf derselben Seite ist
    // eine dokumentbezogene Navigation und lädt `BookingsScreen` nicht neu —
    // `fromDay`/`toDay` sind dort ein `useState`-Anfangswert aus der Adresse
    // und würden bei einem zweiten `goto()` auf denselben Bildschirm stehen
    // bleiben, statt sich zu ändern (in der ersten Fassung dieses Falls dazu
    // fälschlich rot geworden).
    await page.getByLabel('Ab Tag').fill(yesterday);
    await page.getByLabel('Bis Tag').fill(yesterday);
    await expect(page.locator('.table__row', { hasText: title })).toHaveCount(0);

    // Aufräumen: keine offene Buchung im gemeinsamen Bestand zurücklassen
    // (export-end-to-end.spec.ts exportiert sonst "alle offenen Buchungen"
    // und zählt sie mit).
    for (const entry of await listTimeEntriesByTodo(todo.id)) await deleteTimeEntry(entry.id);
  });

  test('Kontrollfall — Buchung um 23:30 Ortszeit gehört zum laufenden Tag (Auftragswortlaut)', async ({
    page,
  }) => {
    const title = `E2E-2330-${Date.now()}`;
    const todo = await createTodo({ title });
    await createTimeEntry({
      todoId: todo.id,
      startedAt: todayAt(23, 30),
      endedAt: todayAt(23, 45),
      note: '23:30 Ortszeit',
    });

    const today = localCalendarDay(new Date());
    await page.goto(
      `/#/buchungen?${new URLSearchParams({ von: today, bis: today, todo: todo.id }).toString()}`,
    );
    await expect(page.locator('.table__row', { hasText: title })).toBeVisible();

    for (const entry of await listTimeEntriesByTodo(todo.id)) await deleteTimeEntry(entry.id);
  });
});
