/**
 * Ein Tag-Ordner, der in der Regel eines Pools oder einer Kanban-Spalte
 * steht, ist nicht löschbar (R-1 Befund 1, T-089, Migration 0012, T-096).
 *
 * ## Hintergrund
 *
 * Bis T-089 stand `pool_rule.folder_id` auf `ON DELETE CASCADE`. Das Löschen
 * eines **leeren** Ordners, der als erforderlicher Term in einer Regel
 * stand, entkernte die Regel still: „Ordner Ost **und** Status offen" wurde
 * zu „Status offen" — die Regel traf danach **mehr**, als der Benutzer
 * gesagt hatte (`decisions.md`, E-057). Seit T-089 steht die Spalte auf
 * `RESTRICT`, und `TagFolderPort.remove` weist mit dem fachlichen Schlüssel
 * `tag_in_use` ab, bevor die Datenbank es müsste — mit `details`, die je
 * betroffener Regel ihre Kennung und ihren Namen tragen
 * (`packages/storage/src/sqlite/mappers.ts#poolReference`).
 *
 * Ein Ordner **ohne** Regelbezug bleibt löschbar — das ist die Gegenprobe,
 * ohne die dieser Test auch von einer Fassung bestünde, die jeden Ordner
 * sperrt.
 *
 * ## Was hier absichtlich nicht behauptet wird
 *
 * Der Auftrag (Board T-096) beschreibt die Erwartung "die Oberfläche zeigt
 * den Regelnamen in der Fehlermeldung (wie bei `status_in_use`)". Nachgesehen
 * im Quelltext: `TaktApiError.details` (`apps/web/src/api/client.ts`) wird
 * im gesamten `apps/web`-Baum an keiner einzigen Stelle gelesen — weder für
 * `tag_in_use` noch für das namensgleiche Vorbild `status_in_use`
 * (`StatusSettings.tsx`, `errorMessage(cause)` gibt nur die **allgemeine**
 * Dienstmeldung zurück, z. B. "Diesen Status benutzt noch die Regel eines
 * Pools oder einer Kanban-Spalte."). Die Oberfläche zeigt heute also denselben
 * generischen Satz wie bei `status_in_use`, aber **nicht** den konkreten
 * Regelnamen aus `details`. Der zweite Testfall unten prüft deshalb genau
 * diesen tatsächlichen, stabilen Stand — die Sperre greift sichtbar, der
 * Ordner bleibt erhalten — und behauptet nicht mehr, als der Quelltext
 * hergibt. Die Lücke zur ursprünglichen Erwartung steht im Bericht zu T-096,
 * nicht als zwangsläufig roter Testfall hier (Auftrag: "nur die stabilen
 * Fälle").
 */
import { test, expect } from '@playwright/test';

import {
  attemptDeleteTagFolder,
  createPool,
  createTagFolder,
  deletePool,
  deleteTagFolder,
} from './support/api';
import { gotoTags } from './support/nav';

test.describe('Ordnersperre — ein Ordner in einer Regel ist nicht löschbar (409 tag_in_use)', () => {
  test('API direkt: 409 mit details[] (Kennung und Name der Regel); ein Ordner ohne Regelbezug bleibt löschbar', async () => {
    const run = Date.now();
    const lockedFolder = await createTagFolder(`E2E-Ordnersperre-API-${run}`);
    const freeFolder = await createTagFolder(`E2E-Ordnerfrei-API-${run}`);
    const pool = await createPool({
      name: `E2E-Ordnersperre-API-Regel-${run}`,
      requiredFolderIds: [lockedFolder.id],
    });

    try {
      const blocked = await attemptDeleteTagFolder(lockedFolder.id);
      expect(blocked.ok).toBe(false);
      if (!blocked.ok) {
        expect(blocked.status).toBe(409);
        expect(blocked.body.error?.code).toBe('tag_in_use');

        const details = blocked.body.error?.details ?? [];
        const entry = details.find((detail) => detail.code === 'pool_rule');
        expect(entry).toBeDefined();
        // Kennung des Pools in `field` (Vertrag aus T-089, kein Eingabefeld
        // im üblichen Sinn: Die Löschanfrage besteht aus einem Pfadbestandteil,
        // `field` ist der einzige Platz für eine maschinenlesbare Angabe).
        expect(entry?.field).toBe(pool.id);
        // Name der Regel in `message`, in Anführungszeichen.
        expect(entry?.message).toContain(pool.name);
      }

      // Gegenprobe: derselbe Ordner bleibt gesperrt, solange die Regel steht —
      // ein zweiter Versuch ohne zwischenzeitliche Änderung antwortet gleich.
      const blockedAgain = await attemptDeleteTagFolder(lockedFolder.id);
      expect(blockedAgain.ok).toBe(false);

      // Ein Ordner ohne jeden Regelbezug bleibt löschbar — sonst wäre diese
      // Prüfung auch von einer Fassung bestanden, die jeden Ordner sperrt.
      const allowed = await attemptDeleteTagFolder(freeFolder.id);
      expect(allowed.ok).toBe(true);
    } finally {
      await deletePool(pool.id).catch(() => undefined);
      await deleteTagFolder(lockedFolder.id).catch(() => undefined);
      // `freeFolder` ist im Erfolgsfall oben schon weg; ein zweiter Versuch
      // schlägt dann lautlos fehl (404) und wird verschluckt.
      await deleteTagFolder(freeFolder.id).catch(() => undefined);
    }
  });

  test('Oberfläche: „Ordner löschen“ wird abgelehnt, der Ordner bleibt erhalten', async ({ page }) => {
    const run = Date.now();
    const lockedFolder = await createTagFolder(`E2E-Ordnersperre-UI-${run}`);
    const pool = await createPool({
      name: `E2E-Ordnersperre-UI-Regel-${run}`,
      requiredFolderIds: [lockedFolder.id],
    });

    try {
      await gotoTags(page);
      const item = page.getByRole('treeitem', { name: new RegExp(lockedFolder.name) });
      await expect(item).toBeVisible();
      await item.click();
      await expect(page.locator('.tags-detail__kind')).toHaveText('Ordner');
      await expect(page.locator('.tags-detail__name')).toHaveText(lockedFolder.name);

      // Scoped auf die Aktionsleiste des Tag-Baums: `PoolAdministration`
      // (S-11) steht auf derselben Seite und hat je Regel einen eigenen
      // "Löschen"-Knopf — ein ungescopter Zugriff wäre mehrdeutig.
      await page.locator('.tags-detail__actions').getByRole('button', { name: 'Löschen' }).click();
      const dialog = page.getByRole('alertdialog', { name: 'Ordner löschen?' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Löschen' }).click();

      // Die Sperre greift: Der Dialog bleibt offen (kein Erfolg, kein
      // stillschweigendes Schließen) und nennt den vom Dienst gelieferten
      // Grund — denselben Satz wie am direkten API-Aufruf oben
      // (`repo-tags.ts`, `remove()`).
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('wird in der Regel eines Pools verwendet');

      await dialog.getByRole('button', { name: 'Abbrechen' }).click();
      await expect(dialog).toBeHidden();

      // Der Ordner ist tatsächlich noch da — nicht nur der Dialog hat sich
      // beschwert, während im Hintergrund doch gelöscht wurde.
      await gotoTags(page);
      await expect(page.getByRole('treeitem', { name: new RegExp(lockedFolder.name) })).toBeVisible();
    } finally {
      await deletePool(pool.id).catch(() => undefined);
      await deleteTagFolder(lockedFolder.id).catch(() => undefined);
    }
  });
});
