/**
 * TP-ANH-05, TP-ANH-06, TP-ANH-14, TP-ANH-19 (docs/testplan.md, Abschnitt
 * 25.2/25.3) — T-150.
 *
 * Der Öffnen-Befehl der Hülle ist von Linux aus ohne echten Tauri-Prozess
 * nicht messbar (T-B08) — gemessen wird deshalb dieselbe Naht wie bei
 * `TP-VER-13`: eine konfigurierbare Nachbildung der Hülle
 * (`support/shell-shim.ts`, seit T-150 um `takt_open_attachment_link`/
 * `takt_open_attachment_file` erweitert), die jeden Aufruf aufzeichnet, statt
 * ihn zu beurteilen. Was hier zählt, ist **nicht**, ob das Betriebssystem die
 * Datei tatsächlich öffnet (das prüft ein Rust-Einheitentest neben dem
 * Befehl, Hoheit unit-tester), sondern: löst die Oberfläche den Befehl mit
 * genau dem richtigen Wert aus, genau dann, und nicht öfter als das.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createAttachment, createTodo, deleteTodo } from './support/api';
import { gotoTodo, gotoTodos } from './support/nav';
import { API_BASE_URL, SESSION_SECRET, TOKEN_HEADER } from './support/session';
import { installShellShim, type ShellShimArgs } from './support/shell-shim';

const SHIM_ARGS: ShellShimArgs = {
  baseUrl: API_BASE_URL,
  headerName: TOKEN_HEADER,
  secret: SESSION_SECRET,
  osUser: { name: 'e2e.anhang', qualified_name: null, source: 'e2e-fixture', trusted: false },
  shellState: { directory: null, problems: [], service_exit: null },
  quit: 'resolve',
  // Kein `installedVersion` mehr nötig (E-077, T-166): Die Vorgabe von
  // `installShellShim` ist umgedreht (siehe `shell-shim.ts`) und löst ohne
  // ausdrückliche, niedrigere Angabe nie mehr den Versionsdialog aus — der
  // frühere Fehlschlag hier ("scrim intercepts pointer events", T-150) kam
  // von der alten Vorgabe "0.0.0", nicht von dieser Datei.
};

function attachmentsCardOn(page: import('@playwright/test').Page) {
  return page.locator('.card').filter({ has: page.locator('.card__title', { hasText: 'Anhänge' }) });
}

test.describe('TP-ANH-05 — Öffnen eines Verweises, ohne Rückfrage (A-19.9, A-A-7)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(installShellShim, SHIM_ARGS);
  });

  test('der Öffnen-Befehl wird genau einmal mit genau dieser Adresse aufgerufen', async ({ page, context }) => {
    const address = 'https://beispiel.example/tp-anh-05';
    const todo = await createTodo({ title: `E2E-ANH-LINK-${Date.now()}` });
    await createAttachment(todo.id, { kind: 'link', url: address });

    const downloads: string[] = [];
    page.on('download', (download) => downloads.push(download.url()));
    const newPages: string[] = [];
    context.on('page', (p) => newPages.push(p.url()));

    await gotoTodo(page, todo.id);
    const row = attachmentsCardOn(page).locator('.attachment').first();
    await row.getByRole('button', { name: /Verweis öffnen/ }).click();

    await expect
      .poll(() => page.evaluate(() => window.__taktOpenAttachmentLinkCalls__?.length ?? 0))
      .toBe(1);
    const calls = await page.evaluate(() => window.__taktOpenAttachmentLinkCalls__ ?? []);
    expect(calls).toEqual([{ url: address }]);

    // Kein Öffnen-Dialog bei einem Verweis (Auflage A-A-7) — kein
    // "alertdialog" mit einer der beiden Öffnen-Dialog-Überschriften.
    await expect(page.getByRole('alertdialog', { name: /Diese Datei wird/ })).toHaveCount(0);
    expect(downloads).toEqual([]);
    expect(newPages).toEqual([]);

    await deleteTodo(todo.id);
  });
});

test.describe('TP-ANH-06 — Öffnen einer Datei fragt zuerst, mit vollem Pfad (A-19.11, E-072 Punkt 3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(installShellShim, SHIM_ARGS);
  });

  test('die Rückfrage nennt den vollständigen Pfad, geöffnet wird erst nach Bestätigung', async ({ page }) => {
    const workDir = await mkdtemp(join(tmpdir(), 'takt-e2e-anh-open-'));
    const filePath = join(workDir, 'tp-anh-06-bericht.txt');
    await writeFile(filePath, 'E2E-Testinhalt, keine echten Kundendaten.\n', 'utf8');

    const todo = await createTodo({ title: `E2E-ANH-FILE-${Date.now()}` });
    await createAttachment(todo.id, { kind: 'file', path: filePath });

    await gotoTodo(page, todo.id);
    const row = attachmentsCardOn(page).locator('.attachment').first();
    await row.getByRole('button', { name: /Datei öffnen/ }).click();

    const dialog = page.getByRole('alertdialog', { name: 'Diese Datei wird geöffnet' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(filePath);
    await expect(dialog).toContainText('tp-anh-06-bericht.txt');

    // Vor der Bestätigung ist noch kein Öffnen-Befehl gelaufen.
    expect(await page.evaluate(() => window.__taktOpenAttachmentFileCalls__?.length ?? 0)).toBe(0);

    await dialog.getByRole('button', { name: 'Öffnen' }).click();
    await expect(dialog).toBeHidden();

    await expect
      .poll(() => page.evaluate(() => window.__taktOpenAttachmentFileCalls__?.length ?? 0))
      .toBe(1);
    const calls = await page.evaluate(() => window.__taktOpenAttachmentFileCalls__ ?? []);
    expect(calls).toEqual([{ path: filePath }]);

    await deleteTodo(todo.id);
    await rm(workDir, { recursive: true, force: true });
  });
});

test.describe('TP-ANH-19 — eine .bat-Datei: dieselbe Rückfrage, aber "wird ausgeführt" (R-21, E-072 Punkt 3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(installShellShim, SHIM_ARGS);
  });

  test('die Rückfrage warnt vor der Ausführung und trägt den Knopf "Ausführen"', async ({ page }) => {
    const workDir = await mkdtemp(join(tmpdir(), 'takt-e2e-anh-bat-'));
    const batPath = join(workDir, 'tp-anh-19-starte.bat');
    await writeFile(batPath, 'REM E2E-Testdatei, keine echte Wirkung\n', 'utf8');

    const todo = await createTodo({ title: `E2E-ANH-BAT-${Date.now()}` });
    await createAttachment(todo.id, { kind: 'file', path: batPath });

    await gotoTodo(page, todo.id);
    const row = attachmentsCardOn(page).locator('.attachment').first();
    await row.getByRole('button', { name: /Datei öffnen/ }).click();

    const dialog = page.getByRole('alertdialog', { name: 'Diese Datei wird ausgeführt' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(batPath);
    await expect(dialog).toContainText('wird dabei ausgeführt');
    const runButton = dialog.getByRole('button', { name: 'Ausführen' });
    await expect(runButton).toBeVisible();

    // Kein Aufruf, solange nicht bestätigt wurde.
    expect(await page.evaluate(() => window.__taktOpenAttachmentFileCalls__?.length ?? 0)).toBe(0);

    await runButton.click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => window.__taktOpenAttachmentFileCalls__?.length ?? 0))
      .toBe(1);
    const calls = await page.evaluate(() => window.__taktOpenAttachmentFileCalls__ ?? []);
    expect(calls).toEqual([{ path: batPath }]);

    await deleteTodo(todo.id);
    await rm(workDir, { recursive: true, force: true });
  });
});

test.describe('TP-ANH-14 — Nichts öffnet sich von selbst (A-19.18, Auflage A-A-24)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(installShellShim, SHIM_ARGS);
  });

  test('Liste laden, Todo öffnen und wieder öffnen, neu laden — kein einziger Öffnen-Aufruf ohne Klick', async ({
    page,
    context,
  }) => {
    const workDir = await mkdtemp(join(tmpdir(), 'takt-e2e-anh-passiv-'));
    const filePath = join(workDir, 'tp-anh-14-datei.txt');
    await writeFile(filePath, 'E2E-Testinhalt.\n', 'utf8');

    const todo = await createTodo({ title: `E2E-ANH-PASSIV-${Date.now()}` });
    await createAttachment(todo.id, { kind: 'link', url: 'https://beispiel.example/tp-anh-14' });
    await createAttachment(todo.id, { kind: 'file', path: filePath });

    const downloads: string[] = [];
    const newPages: string[] = [];
    context.on('page', (p) => newPages.push(p.url()));
    page.on('download', (download) => downloads.push(download.url()));

    const callCount = () =>
      page.evaluate(() => {
        const link = window.__taktOpenAttachmentLinkCalls__?.length ?? 0;
        const file = window.__taktOpenAttachmentFileCalls__?.length ?? 0;
        return link + file;
      });

    // Die Todo-Liste laden — ohne auf irgendeinen Anhang zu klicken.
    await gotoTodos(page, { q: todo.title });
    await expect(page.locator('.todo-row', { hasText: todo.title })).toBeVisible();
    expect(await callCount()).toBe(0);

    // Das Todo öffnen, die Anhangsliste sehen.
    await gotoTodo(page, todo.id);
    await expect(attachmentsCardOn(page).locator('.attachment')).toHaveCount(2);
    expect(await callCount()).toBe(0);

    // Schließen (zur Liste) und erneut öffnen.
    await gotoTodos(page, { q: todo.title });
    await gotoTodo(page, todo.id);
    expect(await callCount()).toBe(0);

    // Neu laden.
    await page.reload();
    await expect(attachmentsCardOn(page).locator('.attachment')).toHaveCount(2);
    expect(await callCount()).toBe(0);
    expect(downloads).toEqual([]);
    expect(newPages).toEqual([]);

    await deleteTodo(todo.id);
    await rm(workDir, { recursive: true, force: true });
  });
});
