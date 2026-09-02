/**
 * Takt — gemeinsame Bedienschritte für mehrere Spezifikationsdateien (T-048).
 *
 * Der Export-Bestätigungsdialog trägt seit T-045 (B-6.1 Punkt 2) ein
 * optionales Kontrollkästchen „Mir ist bewusst: Die Datei landet in … und
 * enthält lesbare Kundennotizen. …". Es erscheint nur beim **ersten** Lauf in
 * einen Ordner, in den laut den zuletzt geladenen Läufen noch nie exportiert
 * wurde (`firstRunIntoDirectory`, `ExportScreen.tsx`). In einem Testlauf, der
 * mehrere Spezifikationsdateien nacheinander gegen denselben Exportordner
 * fährt, erscheint es deshalb genau einmal — bei der ersten Datei, die
 * tatsächlich exportiert — und bei jeder folgenden nicht mehr. Ohne diese
 * Behandlung bleibt „Exportieren" dauerhaft deaktiviert (`blocked` in
 * `ConfirmDialog.tsx`) und der jeweils erste Testfall läuft in eine
 * Zeitüberschreitung, nicht in einen Fehlschlag mit Ursache — genau das, was
 * den T-012-Bestand bei der Nachziehung für T-048 zunächst rot gemacht hat.
 */
import { expect, type Page } from '@playwright/test';

/** Bestätigt einen bereits offenen "Export ausführen?"-Dialog. */
export async function confirmExportRun(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog', { name: 'Export ausführen?' });
  await expect(dialog).toBeVisible();
  const acknowledge = dialog.locator('.dialog__acknowledge input[type="checkbox"]');
  if ((await acknowledge.count()) > 0) {
    await acknowledge.check();
  }
  await dialog.getByRole('button', { name: 'Exportieren' }).click();
  await expect(dialog).toBeHidden();
}

/** Löst „Export ausführen" auf S-07 aus, bestätigt den Dialog, wartet auf den Erfolg. */
export async function runExportFromScreen(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Export ausführen' }).click();
  await confirmExportRun(page);
  await expect(page.getByText('Export abgeschlossen')).toBeVisible();
}

/** Liest den Pfad der zuletzt geschriebenen Exportdatei aus dem Ergebnisblock. */
export async function readResultFilePath(page: Page): Promise<string> {
  return (await page.locator('dd.mono:not(.truncate)').first().innerText()).trim();
}
