import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const entry = '/@fs/' + fileURLToPath(new URL('./support/unified-export.html', import.meta.url)).replaceAll('\\', '/').replace(/^\//, '');

test('one export page exposes booking actions and never previews exported entries; calendar overlays the table', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => { errors.push(error.message); console.log('PAGE ERROR', error.message); });
  const previews: string[][] = [];
  const resetIds: string[] = [];
  const base = { todoId: 'task', startedAt: '2026-09-16T08:00:00Z', endedAt: '2026-09-16T09:00:00Z', durationSeconds: 3600, note: 'Arbeit', source: 'manual', createdAt: '2026-09-16T08:00:00Z', updatedAt: '2026-09-16T09:00:00Z' };
  const entries = [{ ...base, id: 'open', exportStatus: 'open', exportCount: 0 }, { ...base, id: 'exported', exportStatus: 'exported', exportCount: 1 }];
  await page.route('**/export-fixture/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/export-fixture', '');
    let data: unknown = [];
    if (path === '/settings') data = { settings: { exportDirectory: '/tmp/export', activeExportTemplateId: null, roundingMode: 'up' }, exportDirectoryState: 'ok', defaultTags: [], windowsUser: 'Test' };
    else if (path === '/tag-tree') data = { rootFolders: [], rootTags: [] };
    else if (path === '/todos') data = { items: [{ id: 'task', title: 'Testaufgabe', callNumber: '123' }], nextCursor: null, total: 1 };
    else if (path === '/time-entries/exported/export-status' && route.request().method() === 'PUT') { resetIds.push('exported'); entries[1]!.exportStatus = 'open'; data = entries[1]; }
    else if (path === '/time-entries') { const status = url.searchParams.get('exportStatus'); const items = entries.filter(item => !status || item.exportStatus === status); data = { items, nextCursor: null, total: items.length }; }
    else if (path === '/export/runs') data = { items: [], nextCursor: null, total: 0 };
    else if (path === '/export/sources') data = { sources: [], groups: [], transformations: [], conditionOperators: [] };
    else if (path === '/export/preview') {
      const ids = route.request().postDataJSON().timeEntryIds as string[];
      previews.push(ids);
      data = { rows: [{}], groups: [{ todoId: 'task', day: '2026-09-16', seconds: 3600, quarters: 4, entryCount: ids.length, timeEntryIds: ids, previouslyExported: false }], skipped: [], totalQuarters: 4, previouslyExportedCount: 0, roundingMode: 'up', templateSource: 'stored', templateId: null, templateName: null };
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto(entry);
  const tabs = page.getByRole('navigation', { name: 'Bereiche des Exports' });
  await expect(tabs.getByRole('link', { name: 'Buchungen' })).toHaveCount(0);
  const table = page.locator('.export-todo-table');
  await expect(table.locator('.export-todo__head').getByText('Testaufgabe', { exact: true })).toBeVisible();
  await table.getByRole('button', { name: /klappen/ }).click();
  await table.getByRole('button', { name: /Buchungen auf- oder einklappen/ }).click();
  await table.getByRole('button', { name: 'Aktionen für die Buchung Testaufgabe' }).click();
  for (const name of ['Bearbeiten', 'Verlauf dieser Buchung', 'Nicht abrechnen', 'Exportstatus zurücksetzen']) await expect(page.getByRole('menuitem', { name: new RegExp('^' + name) })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Exportstatus', exact: true }).click();
  await page.getByRole('option', { name: 'Alle', exact: true }).click();
  await expect(table.locator('.export-todo__head').getByText('Testaufgabe', { exact: true })).toHaveCount(1);
  expect(new URL(page.url()).hash).toBe('');
  await expect(table.getByRole('button', { name: /Tage auf- oder einklappen/ })).toHaveAttribute('aria-expanded', 'true');
  await table.getByRole('button', { name: /Buchungen auf- oder einklappen/ }).last().click();
  await table.getByRole('button', { name: 'Aktionen für die Buchung Testaufgabe' }).last().click();
  await expect(page.getByRole('menuitem', { name: /^Bearbeiten/ })).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('menuitem', { name: /^Exportstatus zurücksetzen/ })).not.toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Ab Tag: Kalender öffnen', exact: true }).click();
  const calendar = page.getByRole('application', { name: 'Ab Tag: Datum wählen', exact: true });
  await expect(calendar).toBeVisible();
  const day = calendar.locator('[data-part="table-cell-trigger"]').nth(10);
  await expect(day).toBeVisible();
  expect(await day.evaluate(element => { const box = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)); })).toBe(true);
  expect(await calendar.evaluate(element => Number(getComputedStyle(element).zIndex))).toBeGreaterThan(10);
  await page.screenshot({ path: '/tmp/unified-export-calendar.png' });
  await page.keyboard.press('Escape');
  expect(previews.length).toBeGreaterThan(0);
  expect(previews.flat()).not.toContain('exported');
  await table.getByRole('button', { name: 'Aktionen für die Buchung Testaufgabe' }).last().click();
  await page.getByRole('menuitem', { name: /^Exportstatus zurücksetzen/ }).click();
  const reset = page.getByRole('alertdialog', { name: 'Exportstatus zurücksetzen?' });
  await expect(reset).toBeVisible();
  await reset.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect(reset).toBeHidden();
  expect(resetIds).toEqual([]);
  expect(errors).toEqual([]);
});
