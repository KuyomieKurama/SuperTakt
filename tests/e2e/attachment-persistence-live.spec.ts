/**
 * TP-ANH-10, Stufe 2 (docs/testplan.md, Abschnitt 25.2) — T-150. Seit T-187
 * zusätzlich TP-ANH-21 (O-FI) in derselben Datei — dieselbe Bauart, derselbe
 * echte Neustart, dieselbe Ausführungskonfiguration, ein anderer Anlass.
 *
 * Ein echter Prozess-Neustart des lokalen Dienstes, mit demselben Bestand —
 * dieselbe Bauart wie `TP-VER-11`/`-12` für die Versionsprüfung (T-142), hier
 * ohne Attrappe (kein Netzwerk beteiligt): Eine Prüfung, die nur die Seite neu
 * lädt (Stufe 1, `attachment-crud.spec.ts`), unterscheidet Persistenz im
 * Bestand nicht von Persistenz im Arbeitsspeicher des Dienstes. Läuft in einer
 * eigenen Ausführungskonfiguration (`playwright.attachment-persistence
 * .config.ts`) — Begründung dort.
 */
import { test, expect } from '@playwright/test';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createAttachment, createTodo, deleteTodo } from './support/api';
import { deleteAttachmentRowDirectly } from './support/db';
import { gotoTodo } from './support/nav';
import { configureExportDirectory, restartLocalApi, startLocalApi, stopGithubStub } from './support/services';
import { E2E_DATA_DIR } from './support/session';

/** Ein minimales, gültiges 1×1-PNG (rot) — selbst erzeugt, keine echten Bilddaten. */
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

let localApi: ChildProcessWithoutNullStreams;

test.beforeAll(async () => {
  localApi = await startLocalApi();
  await configureExportDirectory();
});

test.afterAll(async () => {
  localApi.kill('SIGTERM');
  // O-CI: `startLocalApi`/`restartLocalApi` starten seit T-166 nebenbei eine
  // lokale GitHub-Attrappe (`services.ts#ensureGithubStub`) statt echt nach
  // außen zu greifen — die räumt hier auf, weil diese Datei `stopServices`
  // bewusst nicht benutzt (Begründung im Kopf dieser Datei).
  await stopGithubStub();
});

test.describe('TP-ANH-10 Stufe 2 — Frist und Anhänge überstehen einen echten Dienst-Neustart', () => {
  test('unverändert nach `SIGTERM` und Neustart, mit demselben Datenverzeichnis', async ({ page }) => {
    test.setTimeout(90_000);

    const workDir = await mkdtemp(join(tmpdir(), 'takt-e2e-anh-restart-'));
    const filePath = join(workDir, 'bericht.txt');
    const imagePath = join(workDir, 'bild.png');
    await writeFile(filePath, 'E2E-Testinhalt, keine echten Kundendaten.\n', 'utf8');
    await writeFile(imagePath, Buffer.from(MINIMAL_PNG_BASE64, 'base64'));

    const dueDate = isoDay(21);
    const todo = await createTodo({ title: `E2E-ANH-RESTART-${Date.now()}`, dueDate });
    await createAttachment(todo.id, { kind: 'link', url: 'https://beispiel.example/tp-anh-10' });
    await createAttachment(todo.id, { kind: 'file', path: filePath });
    await createAttachment(todo.id, { kind: 'image', sourcePath: imagePath, title: 'TP-ANH-10 Bild' });

    // --- der eigentliche Prozess-Neustart, derselbe Bestand -----------------
    localApi = await restartLocalApi(localApi);

    await gotoTodo(page, todo.id);

    const deadlineCard = page
      .locator('.card')
      .filter({ has: page.locator('.card__title', { hasText: 'Frist' }) });
    await expect(deadlineCard.locator('.deadline')).toBeVisible();

    const attachmentsCard = page
      .locator('.card')
      .filter({ has: page.locator('.card__title', { hasText: 'Anhänge' }) });
    const rows = attachmentsCard.locator('.attachment');
    await expect(rows).toHaveCount(3);
    await expect(attachmentsCard).toContainText('beispiel.example/tp-anh-10');
    await expect(attachmentsCard).toContainText('bericht.txt');
    await expect(attachmentsCard).toContainText('TP-ANH-10 Bild');

    const imageRow = rows.filter({ hasText: 'TP-ANH-10 Bild' });
    await expect(imageRow.locator('img.attachment__image')).toHaveAttribute('src', /^data:image\//);

    await rm(workDir, { recursive: true, force: true });
  });
});

/**
 * TP-ANH-21 (docs/testplan.md, Abschnitt 25.2) — T-187, O-FI.
 *
 * Der einzige Fall in diesem Bestand, der ein Löschen durch den Aufräumlauf
 * für verwaiste Bildkopien (`usecases/image-sweep.ts`, A-A-18) tatsächlich
 * sehen kann — und damit die Gegenprobe zu O-FI: Bis `version-check-entry.ts`
 * auf `main({ releaseSource })` umgestellt war, lief der Aufräumlauf beim
 * Neustart dieser Datei **nicht**, und dieser Fall hätte, hätte es ihn schon
 * gegeben, ebenso grün gemeldet, wenn die Waise **nie** entfernt worden wäre —
 * ein Fall, der auch vorher grün gewesen wäre, mißt nichts (Auftrag T-187).
 *
 * Die Waise entsteht **an der Tür vorbei** (`support/db.ts
 * #deleteAttachmentRowDirectly`): Die Anhangszeile wird direkt aus dem Bestand
 * entfernt, ohne die Bilddatei anzufassen — derselbe Endzustand, den ein
 * gescheitertes Entfernen (T-159, z. B. `EBUSY` unter Windows) oder eine
 * zurückgehende Migration hinterließe. Der reguläre Lösch-Weg (`DELETE
 * .../attachments/:id`) käme dafür nicht in Frage: Er nimmt die Datei immer
 * mit und könnte die Waise gar nicht erst herstellen.
 */
test.describe('TP-ANH-21 — der Aufräumlauf entfernt eine verwaiste Bildkopie beim echten Neustart (A-A-18, O-FI)', () => {
  test('eine Bildkopie ohne Anhangszeile übersteht den Neustart nicht', async () => {
    test.setTimeout(60_000);

    const workDir = await mkdtemp(join(tmpdir(), 'takt-e2e-anh-orphan-'));
    const imagePath = join(workDir, 'bild.png');
    await writeFile(imagePath, Buffer.from(MINIMAL_PNG_BASE64, 'base64'));

    const todo = await createTodo({ title: `E2E-ANH-ORPHAN-${Date.now()}` });
    const attachment = await createAttachment(todo.id, {
      kind: 'image',
      sourcePath: imagePath,
      title: 'TP-ANH-21 Waise',
    });

    // Die Antwort der Tür trägt `target` bereits (`usecases/attachments.ts`) —
    // kein Umweg über die Datenbank nötig, um den erzeugten Dateinamen zu
    // erfahren.
    const imageFilePath = join(E2E_DATA_DIR, 'takt', 'attachments', attachment.target);
    expect(existsSync(imageFilePath)).toBe(true);

    // Die Zeile verschwindet, die Datei bleibt — die Waise entsteht.
    deleteAttachmentRowDirectly(attachment.id);
    expect(existsSync(imageFilePath)).toBe(true);

    // --- der eigentliche Prozess-Neustart: genau hier läuft `sweepOrphanedImages`,
    // vor dem `server.listen` und damit vollständig, bevor `restartLocalApi`
    // über `/health` zurückkehrt (siehe Kopf von `usecases/image-sweep.ts`). ---
    localApi = await restartLocalApi(localApi);

    expect(existsSync(imageFilePath)).toBe(false);

    await deleteTodo(todo.id);
    await rm(workDir, { recursive: true, force: true });
  });
});
