/**
 * Drei weitere Kernfälle aus dem Auftrag T-012, nachgezogen für T-048:
 *
 * 1. Gemischter Exportstatus in einer Tagesgruppe: Ist eine von drei
 *    Buchungen exportiert, wird ohne sie summiert (Abschnitt 9a, E-020).
 * 2. „Nicht abrechnen" (E-047): Status danach `exported`, Zähler bleibt 0,
 *    die Buchung verschwindet aus der Exportauswahl, eigener Ereignistyp,
 *    und der Verlauf sagt ausdrücklich, dass die Begründung freiwillig war
 *    (T-040, bei mir angemeldeter Fall 2).
 * 3. Gesperrte Tagesgruppe (E-034): Fehlt die Leistung, ist die Gruppe nicht
 *    exportierbar, der übrige Export läuft trotzdem, die Gruppe bleibt offen.
 *
 * Der Export-Bestätigungsdialog läuft seit T-045 über `confirmExportRun`
 * (siehe `support/actions.ts`) — das seit T-045 mögliche „Mir ist
 * bewusst"-Kontrollkästchen erscheint nur beim ersten Lauf in einen Ordner
 * und wird dort mitbehandelt.
 */
import { test, expect } from '@playwright/test';

import { createTimeEntry, createTodo, deleteTimeEntry, listTimeEntriesByTodo } from './support/api';
import { runExportFromScreen } from './support/actions';
import { gotoExport, gotoTodo } from './support/nav';

function todayAt(hour: number, minute: number): string {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

test('gemischter Exportstatus: eine von drei Buchungen exportiert, Rest wird ohne sie summiert', async ({
  page,
}) => {
  const title = `E2E-MIXED-${Date.now()}`;
  const todo = await createTodo({ title });
  // Drei Buchungen von je 6 Minuten (18 Minuten gesamt). E-008 rundet
  // aufwärts auf die nächste Viertelstundengrenze: 18 Minuten liegen über 15,
  // also 30 Minuten = 0,50 h. Lässt man eine Buchung weg, bleiben 12 Minuten
  // — die liegen unter 15 und runden auf 15 Minuten = 0,25 h. Genau dieser
  // Sprung macht die Gruppierung sichtbar (im Unterschied zu z. B. 10+10+10,
  // wo 20 verbleibende Minuten immer noch auf 0,50 h rundeten).
  await createTimeEntry({ todoId: todo.id, startedAt: todayAt(2, 0), endedAt: todayAt(2, 6), note: 'Segment eins' });
  await createTimeEntry({ todoId: todo.id, startedAt: todayAt(3, 0), endedAt: todayAt(3, 6), note: 'Segment zwei' });
  await createTimeEntry({ todoId: todo.id, startedAt: todayAt(4, 0), endedAt: todayAt(4, 6), note: 'Segment drei' });

  await gotoExport(page);
  const group = page.locator('.egroup', { hasText: title });
  await expect(group).toBeVisible();
  await expect(group.locator('.egroup__quarters')).toHaveText(/0,50/);

  // Aufklappen und eine der drei Buchungen aus **diesem** Lauf ausschließen —
  // das exportiert nur die verbleibenden zwei (12 Minuten).
  await group.getByRole('button', { name: /aufklappen/ }).click();
  await expect(group.locator('.egroup__body')).toBeVisible();
  const entries = group.locator('.eentry');
  await expect(entries).toHaveCount(3);
  await entries.nth(0).locator('input.eentry__check').uncheck();

  // Der Gruppenwert rechnet sofort neu, ohne die ausgeschlossene Buchung (E-031).
  await expect(group.locator('.egroup__quarters')).toHaveText(/0,25/);

  await runExportFromScreen(page);

  // Genau zwei der drei Buchungen sind jetzt exportiert.
  const after = await listTimeEntriesByTodo(todo.id);
  expect(after.filter((entry) => entry.exportStatus === 'exported')).toHaveLength(2);
  expect(after.filter((entry) => entry.exportStatus === 'open')).toHaveLength(1);

  // Die verbliebene offene Buchung bildet jetzt allein ihre Tagesgruppe —
  // 6 Minuten runden auf 0,25, nicht mehr auf 0,50 wie zuvor mit dreien.
  await page.reload();
  const groupAfter = page.locator('.egroup', { hasText: title });
  await expect(groupAfter).toBeVisible();
  await expect(groupAfter.locator('.egroup__quarters')).toHaveText(/0,25/);

  // Aufräumen: die bewusst offen gelassene Buchung nicht im Bestand lassen,
  // sonst würde sie in einem späteren Test als zusätzliche, ungeplante
  // Tagesgruppe auftauchen (dieselbe Datenbank läuft über den ganzen Lauf).
  const remainingOpen = (await listTimeEntriesByTodo(todo.id)).find((entry) => entry.exportStatus === 'open');
  if (remainingOpen !== undefined) await deleteTimeEntry(remainingOpen.id);
});

test('E-047 — "Nicht abrechnen" ohne Grund: Status exported, Zähler bleibt 0, Verlauf nennt die Begründung freiwillig', async ({
  page,
}) => {
  const title = `E2E-NOTBILLED-${Date.now()}`;
  const todo = await createTodo({ title });
  await createTimeEntry({
    todoId: todo.id,
    startedAt: todayAt(1, 0),
    endedAt: todayAt(1, 20),
    note: 'Wird nicht abgerechnet',
  });

  await gotoTodo(page, todo.id);
  const entryRow = page.locator('.entry-row');
  await expect(entryRow).toHaveCount(1);
  await entryRow.getByRole('button', { name: 'Menü für diese Buchung' }).click();
  await page.getByRole('menuitem', { name: 'Nicht abrechnen' }).click();

  const dialog = page.getByRole('alertdialog', { name: 'Diese Zeit nicht abrechnen?' });
  await expect(dialog).toBeVisible();
  // Das Begründungsfeld heißt ausdrücklich "Grund (freiwillig)" — hier bewusst
  // ohne Grund abgeschickt, um genau den freiwilligen Weg zu prüfen.
  await expect(dialog.getByLabel(/Grund \(freiwillig\)/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Nicht abrechnen' }).click();
  await expect(dialog).toBeHidden();

  const entries = await listTimeEntriesByTodo(todo.id);
  expect(entries).toHaveLength(1);
  expect(entries[0]?.exportStatus).toBe('exported');
  // Der wichtigste Teil von E-047: der Zähler bleibt 0 — es gab nie einen
  // tatsächlichen Exportlauf für diese Buchung.
  expect(entries[0]?.exportCount).toBe(0);

  // Sie erscheint danach nicht mehr in der Exportauswahl.
  await gotoExport(page);
  await expect(page.locator('.egroup', { hasText: title })).toHaveCount(0);

  // Bei mir angemeldeter Fall (T-040, Offene Frage 2b): "Nicht abrechnen" ohne
  // Grund — im Verlauf dieser Buchung erscheint der Satz, dass das Feld
  // freiwillig war, nicht eine leere Begründungszeile.
  await gotoTodo(page, todo.id);
  await page.locator('.entry-row').getByRole('button', { name: 'Menü für diese Buchung' }).click();
  await page.getByRole('menuitem', { name: 'Verlauf dieser Buchung' }).click();
  const history = page.getByRole('dialog', { name: 'Verlauf dieser Buchung' });
  await expect(history).toBeVisible();
  await expect(history.locator('.auditrow--not_billed .auditrow__reason--absent')).toContainText(
    'Ohne Begründung ausgebucht. Das Feld ist freiwillig (E-047)',
  );
  await history.getByRole('button', { name: 'Schließen', exact: true }).click();
  await expect(history).toBeHidden();

  // Das Protokoll führt den eigenen Ereignistyp `not_billed` (E-047).
  const auditResponse = await fetch(
    `http://127.0.0.1:17843/api/v1/export/audit?timeEntryId=${entries[0]?.id}`,
    {
      headers: {
        Origin: 'http://127.0.0.1:5173',
        'X-Takt-Token': 'takt-e2e-erfundenes-sitzungsgeheimnis-2026-08',
      },
    },
  );
  const auditEnvelope = (await auditResponse.json()) as { data: { items: ReadonlyArray<{ event: string }> } };
  expect(auditEnvelope.data.items.some((item) => item.event === 'not_billed')).toBe(true);
});

test('E-034 — Tagesgruppe ohne Leistung ist gesperrt, der übrige Export läuft trotzdem', async ({ page }) => {
  const run = Date.now();
  const blockedTitle = `E2E-BLOCKED-${run}`;
  const okTitle = `E2E-UNBLOCKED-${run}`;

  const blockedTodo = await createTodo({ title: blockedTitle });
  await createTimeEntry({ todoId: blockedTodo.id, startedAt: todayAt(0, 0), endedAt: todayAt(0, 30), note: '' });

  const okTodo = await createTodo({ title: okTitle });
  await createTimeEntry({
    todoId: okTodo.id,
    startedAt: todayAt(0, 40),
    endedAt: todayAt(1, 10),
    note: 'Hat eine Leistung',
  });

  await gotoExport(page);
  const blockedGroup = page.locator('.egroup', { hasText: blockedTitle });
  const okGroup = page.locator('.egroup', { hasText: okTitle });
  await expect(blockedGroup).toBeVisible();
  await expect(okGroup).toBeVisible();

  await expect(blockedGroup).toHaveClass(/egroup--blocked/);
  await expect(blockedGroup.locator('input.egroup__check')).toBeDisabled();
  await expect(blockedGroup.locator('.egroup__blocked')).toContainText('Nicht exportierbar');

  await runExportFromScreen(page);
  // Die gesperrte Gruppe war nie Teil der Auswahl (ihre Kontrollkästchen sind
  // deaktiviert) — der Lauf umfasst deshalb nur die unbedenkliche Gruppe.
  // "Ausgelassene Tagesgruppen" meldet der Dienst nur für Gruppen, die selbst
  // eingereicht, aber im Lauf abgelehnt wurden; hier greift die striktere
  // Vorstufe: gar nicht erst einreichen.
  await expect(page.locator('dd').getByText('1 Buchung in 1 Exportzeile')).toBeVisible();

  const blockedEntries = await listTimeEntriesByTodo(blockedTodo.id);
  expect(blockedEntries[0]?.exportStatus).toBe('open');
  const okEntries = await listTimeEntriesByTodo(okTodo.id);
  expect(okEntries[0]?.exportStatus).toBe('exported');

  // Die gesperrte Gruppe bleibt sichtbar offen und taucht beim nächsten Mal
  // wieder auf.
  await page.reload();
  await expect(page.locator('.egroup', { hasText: blockedTitle })).toBeVisible();
});
