import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_BASE_URL, SESSION_SECRET, WEB_BASE_URL } from './support/session';
import { deleteTodo } from './support/api';
import { gotoTodo } from './support/nav';

// Real local API, SQLite and main application; no Outlook client is involved.
test('A-10.14 — mail history and planning survive storage and main-app editing', async ({ page }) => {
  const response = await fetch(`${API_BASE_URL}/addin/todos`, {
    method: 'POST', headers: { Origin: WEB_BASE_URL, 'X-Takt-Token': SESSION_SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: randomUUID(), mode: 'new', title: 'Mailintegration prüfen', callNumber: '24470',
      note: 'Eigener Vermerk bleibt bestehen', statusId: null, tagIds: [], tagNames: [],
      dueDate: '2026-10-25', dueTime: '02:30', estimateMinutes: 45,
      mail: { identity: randomUUID(), subject: 'AW: CALL24470 Testnachricht', sender: 'test@example.invalid', receivedAt: '2026-09-15T12:00:00Z',
        internetMessageId: '<mail-detail@example.invalid>', outlookLink: null, excerpt: 'Separater Auszug der Nachricht' }, attachments: null }),
  });
  expect(response.ok, await response.clone().text()).toBe(true);
  const body = await response.json() as { data: { todo: { id: string } } };
  const id = body.data.todo.id;
  try {
    await gotoTodo(page, id);
    await expect(page.getByText('AW: CALL24470 Testnachricht', { exact: true })).toBeVisible();
    await expect(page.getByText('Separater Auszug der Nachricht', { exact: true })).toBeVisible();
    await expect(page.getByText('Eigener Vermerk bleibt bestehen', { exact: true })).toBeVisible();
    await expect(page.getByText('Fällig um 02:30 Uhr (Ortszeit)', { exact: true })).toBeVisible();
    await expect(page.getByText('45 Minuten', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
    await expect(page.getByLabel('Frist', { exact: true })).toHaveValue('2026-10-25');
    await expect(page.getByLabel('Fälligkeitsuhrzeit', { exact: true })).toHaveValue('02:30');
    await page.getByLabel('Zeitschätzung in Minuten').fill('60');
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(page.getByText('60 Minuten', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('60 Minuten', { exact: true })).toBeVisible();
    await expect(page.getByText('Fällig um 02:30 Uhr (Ortszeit)', { exact: true })).toBeVisible();
    await expect(page.getByText('Separater Auszug der Nachricht', { exact: true })).toBeVisible();
  } finally { await deleteTodo(id); }
});
