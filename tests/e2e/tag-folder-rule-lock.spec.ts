/**
 * Ein Tag, ein Ordner oder ein Status, den eine Regel nennt, ist nicht
 * löschbar (R-1 Befund 1, T-089, Migration 0012, T-096, T-097, T-099).
 *
 * ## Hintergrund
 *
 * Bis T-089 stand `pool_rule.folder_id` auf `ON DELETE CASCADE`. Das Löschen
 * eines **leeren** Ordners, der als erforderlicher Term in einer Regel
 * stand, entkernte die Regel still: „Ordner Ost **und** Status offen" wurde
 * zu „Status offen" — die Regel traf danach **mehr**, als der Benutzer
 * gesagt hatte (`decisions.md`, E-057). Seit T-089 stehen `tag_id`,
 * `folder_id` und `status_id` in `pool_rule` auf `RESTRICT`, und die
 * jeweiligen Ports weisen mit dem fachlichen Schlüssel `tag_in_use`
 * (Tag oder Ordner) bzw. `status_in_use` (Status) ab, bevor die Datenbank es
 * müsste — mit `details`, die je betroffener Regel ihre Kennung und ihren
 * Namen tragen (`packages/storage/src/sqlite/mappers.ts#poolReference`).
 *
 * Ein Tag, ein Ordner oder ein Status **ohne** Regelbezug bleiben löschbar —
 * das ist die Gegenprobe im ersten Fall, ohne die dieser Test auch von einer
 * Fassung bestünde, die jeden Ordner sperrt.
 *
 * ## Was sich mit T-097/T-099 geändert hat — und was T-101/T-102 nachgezogen haben
 *
 * `apps/web/src/lib/errorText.ts` (`errorMessageWithRules`) liest seit T-097
 * `TaktApiError.details` und hängt die Regelnamen **wörtlich** an die
 * Dienstmeldung: „… Betroffen ist Regel „Ost“." bzw. „… Betroffen sind Regel
 * „Ost“, Regel „Nord“ und Regel „Abrechnung“." — vorher zeigte die
 * Oberfläche nur den allgemeinen Satz ohne Namen (siehe die ursprüngliche
 * Fassung dieser Datei, T-096). Alle drei Löschdialoge (Ordner, Tag, Status)
 * rufen dieselbe Funktion. Bis T-099/T-100 lieferten nur zwei der drei
 * Dienstantworten überhaupt `details`: Ordner und Status nannten die Regel,
 * **Tag nicht** — ein echter Fund in
 * `packages/storage/src/sqlite/repo-tags.ts` (`createTagPort().remove()`),
 * die beim Grund „Regel" nur die Trefferzahl zählte statt `pool_id`/`name`
 * mitzufragen. **T-101 hat das behoben:** `TagPort.remove` liefert `details`
 * jetzt wie Ordner und Status (R-1a Befund 1). Der Tag-Fall unten prüft
 * seitdem dieselbe Zusicherung wie die anderen beiden — die Testdatei nennt
 * ihn weiterhin einzeln, weil die Einzelbegründung dokumentiert, **warum**
 * das früher fehlte und wodurch es behoben wurde, nicht weil er sich noch
 * unterscheidet.
 *
 * ## Robuster Dialog-Selektor (T-099, offene Frage aus T-097) — und der
 * Knopfwechsel, den T-102 nachgezogen hat
 *
 * Bis T-102 wechselten der Ordner- und der Tag-Löschdialog nach einer Absage
 * weder Titel noch Knopfbeschriftung — anders als der Status-Dialog
 * (`StatusSettings.tsx`), der schon seit T-097 zu „Der Status wurde nicht
 * gelöscht"/„Erneut versuchen"/„Schließen" wechselt. Diese Datei griff den
 * Ordnerdialog bis T-096 über den Titel `'Ordner löschen?'` — das versteckte
 * die Ungleichheit zufällig, weil der Titel eben nicht wechselte. Der
 * Selektor ist seit T-099 die **Rolle** (`alertdialog`, ohne Namen:
 * `ConfirmDialog` ist zu jedem Zeitpunkt genau einmal offen), unabhängig vom
 * Wortlaut davor oder danach. **T-102 hat die Ungleichheit selbst behoben:**
 * `TagsScreen.tsx` wechselt Titel („Der Ordner“/„Das Tag wurde nicht
 * gelöscht"), Beschreibung und beide Knöpfe („Löschen" → „Erneut versuchen",
 * „Abbrechen" → „Schließen") jetzt genauso wie `StatusSettings` — die beiden
 * Fälle unten schließen den Dialog seitdem über „Schließen", nicht mehr über
 * „Abbrechen".
 */
import { test, expect } from '@playwright/test';

import {
  attemptDeleteTagFolder,
  createPool,
  createStatus,
  createTag,
  createTagFolder,
  deletePool,
  deletePoolByName,
  deleteTag,
  deleteTagFolder,
  deleteTodoStatus,
} from './support/api';
import { gotoSettings, gotoTags } from './support/nav';

test.describe('Regelsperre — ein Tag, ein Ordner oder ein Status in einer Regel ist nicht löschbar', () => {
  test('Ordner, API direkt: 409 tag_in_use mit details[] (Kennung und Name der Regel); ein Ordner ohne Regelbezug bleibt löschbar', async () => {
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

  test('Ordner, Oberfläche: „Ordner löschen“ wird abgelehnt, nennt die Regel beim Namen, der Ordner bleibt erhalten', async ({
    page,
  }) => {
    const run = Date.now();
    const lockedFolder = await createTagFolder(`E2E-Ordnersperre-UI-${run}`);
    const pool = await createPool({
      name: `E2E-Ordnersperre-UI-Regel-${run}`,
      requiredFolderIds: [lockedFolder.id],
    });

    try {
      await gotoTags(page);
      const item = page.getByRole('treeitem', { name: lockedFolder.name });
      await expect(item).toBeVisible();
      await item.click();
      await expect(page.locator('.tags-detail__kind')).toHaveText('Ordner');
      await expect(page.locator('.tags-detail__name')).toHaveText(lockedFolder.name);

      // Scoped auf die Aktionsleiste des Tag-Baums: `PoolAdministration`
      // (S-11) steht auf derselben Seite und hat je Regel einen eigenen
      // "Löschen"-Knopf — ein ungescopter Zugriff wäre mehrdeutig.
      await page.locator('.tags-detail__actions').getByRole('button', { name: 'Löschen' }).click();

      // Rolle statt Titeltext (siehe Kopf dieser Datei) — `ConfirmDialog`
      // ist zu jedem Zeitpunkt genau einmal offen.
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Löschen' }).click();

      // Die Sperre greift: Der Dialog bleibt offen (kein Erfolg, kein
      // stillschweigendes Schließen), nennt den vom Dienst gelieferten Grund
      // — denselben Satz wie am direkten API-Aufruf oben (`repo-tags.ts`,
      // `remove()`) — und seit T-097 den Namen der betroffenen Regel wörtlich.
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('wird in der Regel eines Pools verwendet');
      await expect(dialog).toContainText(`Betroffen ist Regel „${pool.name}“.`);

      // Seit T-102 wechselt der Dialog nach der Absage Titel, Beschreibung
      // und beide Knöpfe wie `StatusSettings` — der Schließen-Knopf heißt
      // jetzt „Schließen", nicht mehr „Abbrechen" (Kopf dieser Datei).
      await dialog.getByRole('button', { name: 'Schließen' }).click();
      await expect(dialog).toBeHidden();

      // Der Ordner ist tatsächlich noch da — nicht nur der Dialog hat sich
      // beschwert, während im Hintergrund doch gelöscht wurde.
      await gotoTags(page);
      await expect(page.getByRole('treeitem', { name: lockedFolder.name })).toBeVisible();
    } finally {
      await deletePool(pool.id).catch(() => undefined);
      await deleteTagFolder(lockedFolder.id).catch(() => undefined);
    }
  });

  test('Tag, Oberfläche: „Tag löschen“ wird abgelehnt, nennt seit T-101 die Regel beim Namen, das Tag bleibt erhalten', async ({
    page,
  }) => {
    const run = Date.now();
    const lockedTag = await createTag(`E2E-TagSperre-UI-${run}`);
    const pool = await createPool({
      name: `E2E-TagSperre-UI-Regel-${run}`,
      requiredTagIds: [lockedTag.id],
    });

    try {
      await gotoTags(page);
      const item = page.getByRole('treeitem', { name: lockedTag.name });
      await expect(item).toBeVisible();
      await item.click();
      await expect(page.locator('.tags-detail__kind')).toHaveText('Tag');
      await expect(page.locator('.tags-detail__name')).toHaveText(lockedTag.name);

      await page.locator('.tags-detail__actions').getByRole('button', { name: 'Löschen' }).click();

      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Löschen' }).click();

      // Die Sperre greift, mit demselben allgemeinen Satz wie am Ordner —
      // und seit T-101 auch mit demselben Regelnamen.
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('wird in der Regel eines Pools verwendet');

      /*
       * Bis T-099/T-100 fehlte hier der Regelname — ein echter Fund
       * (gemessen, nicht vermutet; siehe Bericht zu T-099):
       * `packages/storage/src/sqlite/repo-tags.ts`, `createTagPort().remove()`
       * zählte beim Grund „Regel" (`usage.rules > 0`) nur die Trefferzahl und
       * gab `taktError('tag_in_use', 'Dieses Tag wird in der Regel eines
       * Pools verwendet.')` **ohne** `details` zurück, während das Gegenstück
       * `createTagFolderPort().remove()` (dieselbe Datei, für den Ordner)
       * `pool_id`/`name` mitfragte und `details: usedIn.map(poolReference)`
       * lieferte — der Vertrag, auf den sich `apps/web/src/lib/errorText.ts`
       * (`ruleReferences`, T-097) verlässt. **T-101 hat `TagPort.remove` auf
       * denselben Vertrag gebracht** (R-1a Befund 1): Die Regel wird jetzt
       * genannt, wörtlich wie bei Ordner und Status.
       */
      await expect(dialog).toContainText(`Betroffen ist Regel „${pool.name}“.`);

      // Seit T-102 wechselt der Dialog nach der Absage Titel, Beschreibung
      // und beide Knöpfe wie `StatusSettings` — der Schließen-Knopf heißt
      // jetzt „Schließen", nicht mehr „Abbrechen" (Kopf dieser Datei).
      await dialog.getByRole('button', { name: 'Schließen' }).click();
      await expect(dialog).toBeHidden();

      await gotoTags(page);
      await expect(page.getByRole('treeitem', { name: lockedTag.name })).toBeVisible();
    } finally {
      await deletePoolByName(`E2E-TagSperre-UI-Regel-${run}`).catch(() => undefined);
      await deleteTag(lockedTag.id).catch(() => undefined);
    }
  });

  test('Status, Oberfläche: „Status löschen“ wird abgelehnt, nennt die Regel beim Namen, der Status bleibt erhalten', async ({
    page,
  }) => {
    const run = Date.now();
    const lockedStatus = await createStatus(`E2E-StatusSperre-UI-${run}`);
    const pool = await createPool({
      name: `E2E-StatusSperre-UI-Regel-${run}`,
      statusIds: [lockedStatus.id],
    });

    try {
      await gotoSettings(page, 'status');
      const deleteButton = page.getByRole('button', { name: `„${lockedStatus.name}“ löschen` });
      await expect(deleteButton).toBeEnabled();
      await deleteButton.click();

      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      // Vor der ersten Absage heißt der Bestätigungsknopf noch „Status
      // löschen" (`StatusSettings.tsx`) — anders als bei Ordner und Tag
      // ändert sich hier Titel **und** Knopf nach dem Fehlschlag, siehe Kopf
      // dieser Datei. Der Selektor über die Rolle bleibt für beide Fassungen
      // gültig.
      await dialog.getByRole('button', { name: 'Status löschen' }).click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Diesen Status benutzt noch die Regel eines Pools');
      await expect(dialog).toContainText(`Betroffen ist Regel „${pool.name}“.`);
      // Der vierte Löschgrund (T-076: Status in einer Regel) ist kein
      // dazugekommenes Todo — der Zusatz „Zwischen dem Zählen und dem
      // Löschen ist offenbar ein Todo dazugekommen" gehört zum anderen Grund
      // und darf hier nicht stehen (T-097, Nebenbefund).
      await expect(dialog).not.toContainText('ist offenbar ein Todo dazugekommen');

      await dialog.getByRole('button', { name: 'Schließen' }).click();
      await expect(dialog).toBeHidden();

      await gotoSettings(page, 'status');
      await expect(page.getByRole('button', { name: `„${lockedStatus.name}“ löschen` })).toBeVisible();
    } finally {
      await deletePool(pool.id).catch(() => undefined);
      await deleteTodoStatus(lockedStatus.id).catch(() => undefined);
    }
  });
});
