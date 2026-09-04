/**
 * Tag-Ordner vier Ebenen tief: Anlegen, navigieren, Tag verschieben, Ordner
 * verschieben, Verschieben in sich selbst (Zyklus) wird abgelehnt.
 *
 * Nachgezogen für T-048 (T-035 hat den Befund aus T-012 behoben):
 *
 * Bis T-035 taten Klick, Eingabetaste und Leertaste auf einem Knoten **mit
 * Kindern** in `TagTree` nur eines — auf- und zuklappen; auswählen ließ sich
 * so ein Knoten gar nicht. Seit T-035 gilt: Klick auf das Dreieck
 * (`.tree__twisty--active`) klappt auf/zu, Klick auf Namen oder Zeile wählt
 * aus — auch bei einem Ordner mit Inhalt. Dieser Testfall navigiert deshalb
 * jetzt über das Dreieck und wählt separat per Klick auf die Zeile, und die
 * Zyklusprüfung wird zusätzlich **im Verschieben-Dialog der Oberfläche** an
 * einem Ordner mit Inhalt geprüft (T-012, dort als „nicht gelaufen, durch
 * Befund ersetzt" vermerkt — jetzt nachgeholt).
 *
 * Nebenbei bereinigt: Das Zielfeld heißt seit T-040 (Befund C-18) nicht mehr
 * „Zielordner", sondern „Ordner für dieses Tag" (Tag) bzw. „Neuer
 * übergeordneter Ordner" (Ordner) — „Zielordner" ist seither dem Exportordner
 * vorbehalten (S-07/S-09).
 *
 * **Nachtrag T-052 — der Befund, den dieser Testfall selbst verdeckt hat.**
 * Bis hierher war der einzige **gelingende** Zug ein Verschieben zweier
 * Ordner über `moveTagFolder` aus `support/api.ts` (Zeile 58 vor diesem
 * Nachtrag) — die Vorbereitung, nicht die Oberfläche. `support/api.ts`
 * sendet `newParentId` selbst richtig; ein am Feldnamen kranker Aufruf aus
 * `apps/web` (wie `neuerParentId`, T-050) wäre dort unsichtbar geblieben.
 * Der einzige Zug **durch die Oberfläche** war der abgelehnte
 * („Zyklus-Ablehnung im Verschieben-Dialog"), und dessen Zusicherung prüfte
 * nur die Überschrift „Das hat nicht geklappt" — die steht bei jedem
 * Fehlschlag, ob 422 (falscher Feldname) oder 409 (`tag_folder_cycle`). Mit
 * dem eingebauten `neuerParentId`-Fehler war dieser Testfall grün (siehe
 * T-050-Bericht, Punkt 5) — ein 422 sieht an dieser Meldung genauso aus wie
 * der erwartete 409. Zwei Korrekturen unten schließen das:
 *
 *   1. Ein neuer, **gelingender** Ordnerzug durch die Oberfläche, mit
 *      Nachschau ausschließlich über den Tag-Baum (nicht am Rückgabewert
 *      des Aufrufs, nicht an einem Toast).
 *   2. Die Zyklus-Ablehnung prüft jetzt den tatsächlichen Meldungstext aus
 *      `.message__body` (`Ein Ordner kann nicht in einen seiner eigenen
 *      Unterordner verschoben werden.`, `packages/domain/src/tag.ts`) statt
 *      nur die Überschrift — dieser Satz unterscheidet sich wörtlich vom
 *      422-Text „Die Eingabe ist unvollständig oder unzulässig."
 *      (`failValidation`, `apps/local-api/src/http/problem.ts`). Ein
 *      künftiger `neuerParentId`-artiger Rückfall würde hier wieder rot,
 *      nicht mehr grün.
 */
import { test, expect } from '@playwright/test';

import { createTag, createTagFolder, moveTagFolder } from './support/api';
import { gotoTags } from './support/nav';

/** Klappt einen Ordnerknoten über sein Dreieck auf — wählt ihn nicht aus. */
async function expandFolder(page: import('@playwright/test').Page, name: string): Promise<void> {
  const item = page.getByRole('treeitem', { name });
  await expect(item).toBeVisible();
  await item.locator('.tree__twisty--active').click();
}

test.describe('Tag-Ordner, vier Ebenen tief', () => {
  test('anlegen, navigieren, Tag und Ordner verschieben, Zyklus wird abgelehnt', async ({ page }) => {
    const run = Date.now();
    const level1 = await createTagFolder(`E2E-L1-${run}`);
    const level2 = await createTagFolder(`E2E-L2-${run}`, level1.id);
    const level3 = await createTagFolder(`E2E-L3-${run}`, level2.id);
    const level4 = await createTagFolder(`E2E-L4-${run}`, level3.id);
    const leafTag = await createTag(`E2E-Tag-${run}`, level4.id);
    const emptyFolder = await createTagFolder(`E2E-Leer-${run}`);

    // --- Direkte API-Probe: Zyklus wird abgelehnt (A-4.6) -------------------
    // Ebene 1 unter ihren eigenen Enkel (Ebene 3) verschieben — ein Zyklus.
    const cycleAttempt = await moveTagFolder(level1.id, level3.id);
    expect(cycleAttempt.ok).toBe(false);
    if (!cycleAttempt.ok) {
      expect(cycleAttempt.status).toBe(409);
      expect(cycleAttempt.body).toContain('tag_folder_cycle');
    }

    // Ein Ordner darf auch nicht unter sich selbst.
    const selfAttempt = await moveTagFolder(level2.id, level2.id);
    expect(selfAttempt.ok).toBe(false);

    // Ein regulärer Zug (kein Zyklus) gelingt weiterhin.
    const validMove = await moveTagFolder(emptyFolder.id, level1.id);
    expect(validMove.ok).toBe(true);

    // --- Navigation: Dreieck klappt auf, Klick auf die Zeile wählt aus -----
    await gotoTags(page);
    await expandFolder(page, level1.name);

    const l2Item = page.getByRole('treeitem', { name: level2.name });
    await expect(l2Item).toBeVisible();
    await expandFolder(page, level2.name);

    const l3Item = page.getByRole('treeitem', { name: level3.name });
    await expect(l3Item).toBeVisible();
    await expandFolder(page, level3.name);

    const l4Item = page.getByRole('treeitem', { name: level4.name });
    await expect(l4Item).toBeVisible();
    await expect(l4Item).toHaveAttribute('aria-level', '4');
    await expandFolder(page, level4.name);

    const tagItem = page.getByRole('treeitem', { name: leafTag.name });
    await expect(tagItem).toBeVisible();
    await expect(tagItem).toHaveAttribute('aria-level', '5');

    // --- Gegenprobe (T-035, offene Frage 3): das Dreieck verstellt die -----
    // Auswahl nicht. Root ist zu diesem Zeitpunkt noch nichts ausgewählt.
    await expect(page.locator('.tags-detail__kind')).toHaveCount(0);
    await l3Item.locator('.tree__twisty--active').click(); // zuklappen …
    await expect(l4Item).toBeHidden();
    await l3Item.locator('.tree__twisty--active').click(); // … wieder aufklappen
    await expect(l4Item).toBeVisible();
    await expect(page.locator('.tags-detail__kind')).toHaveCount(0);

    // --- Tag auswählen und verschieben über die Oberfläche (I-07) ----------
    // Klick auf die Zeile wählt jetzt aus, auch wenn der Tag selbst keine
    // Kinder hat (er bekommt ohnehin kein Dreieck, siehe TagTree.tsx).
    await tagItem.click();
    await expect(page.locator('.tags-detail__kind')).toHaveText('Tag');
    await page.getByRole('button', { name: 'Verschieben' }).click();
    const moveDialog = page.getByRole('dialog', { name: 'Tag verschieben' });
    await expect(moveDialog).toBeVisible();
    // Befund C-18: nicht mehr "Zielordner".
    //
    // Ark UI (T-059): der Auslöser ist ein `<button role="combobox">`, kein
    // `<select>` mehr — `selectOption()` greift nicht. `getByLabel(...)` wäre
    // hier zusätzlich zweideutig (Strict-Mode-Verstoß): Auslöser und die
    // zugehörige — anfangs verborgene — Listbox tragen dieselbe Beschriftung
    // über `aria-labelledby`. Die Rolle unterscheidet sie eindeutig. Level 1
    // ist ein Wurzelordner; sein Eintrag trägt exakt seinen eigenen Namen als
    // Beschriftung (`folder.path.join(" / ")` aus genau einem Segment) — mit
    // `exact: true`, damit die Suche nicht auch die längeren Pfade trifft,
    // die mit demselben Namen beginnen (Level 2 bis 4 liegen alle darunter).
    await moveDialog.getByRole('combobox', { name: 'Ordner für dieses Tag' }).click();
    await page.getByRole('option', { name: level1.name, exact: true }).click();
    await moveDialog.getByRole('button', { name: 'Verschieben' }).click();
    await expect(moveDialog).toBeHidden();

    // --- Ordner mit Inhalt jetzt auswählbar (Befund aus T-012, behoben) ----
    // Level 2 trägt Level 3 als Kind und ließ sich vor T-035 über den Baum
    // gar nicht auswählen. Klick auf die Zeile (nicht das Dreieck) wählt ihn
    // jetzt trotzdem aus.
    await l2Item.click();
    await expect(page.locator('.tags-detail__kind')).toHaveText('Ordner');
    await expect(page.locator('.tags-detail__name')).toHaveText(level2.name);

    // --- Zyklus-Ablehnung im Verschieben-Dialog der Oberfläche selbst ------
    // (T-012, Fall 22 — damals "nicht gelaufen, durch Befund ersetzt", weil
    // ein Ordner mit Inhalt nicht auswählbar war. Jetzt nachgeholt: Level 2
    // unter seinen eigenen Nachfahren Level 3 zu hängen ist ein Zyklus.)
    await page.getByRole('button', { name: 'Verschieben' }).click();
    const folderMoveDialog = page.getByRole('dialog', { name: 'Ordner verschachteln' });
    await expect(folderMoveDialog).toBeVisible();
    // Ark UI (T-059): Auslöser ist ein `<button role="combobox">`, kein
    // `<select>` mehr; `getByLabel(...)` allein wäre hier zweideutig (Auslöser
    // und die anfangs verborgene Listbox teilen sich dieselbe Beschriftung).
    const targetField = folderMoveDialog.getByRole('combobox', { name: 'Neuer übergeordneter Ordner' });
    await expect(targetField).toBeVisible();
    await targetField.click();

    // Die Beschriftung jedes Eintrags ist der volle Ordnerpfad
    // (`folder.path.join(" / ")`, `TagsScreen.tsx`) — für Level 2 und Level 3
    // unten deshalb vollständig nachgebildet, nicht nur der eigene Name: Der
    // Name von Level 2 ist als Teilzeichenkette auch im Pfad von Level 3
    // enthalten (und umgekehrt der von Level 3 im Pfad von Level 4), ein
    // Vergleich nur über den eigenen Namen wäre deshalb mehrdeutig.
    const level2Path = `${level1.name} / ${level2.name}`;
    const level3Path = `${level1.name} / ${level2.name} / ${level3.name}`;

    // Strukturelle Gegenprobe (T-052): der gerade ausgewählte Ordner (Level 2)
    // selbst steht nicht in seiner eigenen Zielauswahl — der einfachste
    // Zyklus (ein Ordner unter sich selbst) ist über den Dialog gar nicht
    // erst wählbar, siehe `TagsScreen.tsx`, der Filter auf `folder.id !==
    // selected.id`. Der direkte Selbst-Zug bleibt deshalb eine reine
    // API-Probe (oben, `selfAttempt`) — die Oberfläche verhindert ihn schon
    // vor dem Absenden, es gibt hier nichts zusätzlich durch die Oberfläche
    // zu widerlegen.
    await expect(page.getByRole('option', { name: level2Path, exact: true })).toHaveCount(0);

    await page.getByRole('option', { name: level3Path, exact: true }).click();
    await folderMoveDialog.getByRole('button', { name: 'Verschieben' }).click();

    // T-052: nicht nur die Überschrift "Das hat nicht geklappt" (die steht
    // bei jedem Fehlschlag, 422 wie 409, gleich da — genau das hat den
    // eingebauten `neuerParentId`-Fehler aus T-050 hier grün durchgelassen,
    // siehe Dateikopf). Geprüft wird der tatsächliche Meldungstext des
    // Dienstes: die 409-Zyklusmeldung aus `checkFolderMove`
    // (`packages/domain/src/tag.ts`), wörtlich verschieden vom generischen
    // 422-Text „Die Eingabe ist unvollständig oder unzulässig."
    // (`failValidation`). Ein Rückfall auf einen falschen Feldnamen würde
    // hier den zweiten Text zeigen und den Vergleich unten scheitern lassen.
    await expect(folderMoveDialog.locator('.message__title')).toHaveText('Das hat nicht geklappt');
    await expect(folderMoveDialog.locator('.message__body')).toHaveText(
      'Ein Ordner kann nicht in einen seiner eigenen Unterordner verschoben werden.',
    );
    // Der Dialog bleibt offen — der Zug wurde abgelehnt, nicht nur gemeldet.
    await expect(folderMoveDialog).toBeVisible();
    await folderMoveDialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(folderMoveDialog).toBeHidden();
  });

  test('Ordner erfolgreich verschieben über die Oberfläche — Nachschau ausschließlich im Tag-Baum', async ({
    page,
  }) => {
    /*
     * Der Fall, der in T-048/T-050 fehlte (siehe Dateikopf): ein Ordnerzug,
     * der durch die echte Oberfläche geht (S-08, "Verschieben"-Dialog), und
     * dessen Erfolg danach **im Tag-Baum selbst** nachgesehen wird — der Baum
     * kommt nach dem Zug über einen vollständigen Neuladen von `GET
     * /tag-tree` (`StructureContext.reload`), nicht aus dem Rückgabewert des
     * Aufrufs. Ein falsches Feld im Anfragerumpf (wie `neuerParentId` bis
     * T-050) hätte den Dialog gar nicht erst schließen lassen — dieser Fall
     * wäre dann schon am `toBeHidden()`-Schritt rot geworden, nicht erst an
     * der Baum-Nachschau.
     *
     * Der verschobene Ordner trägt einen eigenen Unterordner und ein Tag,
     * damit die Nachschau zusätzlich zeigt: Es ist ein echter Teilbaum-Zug,
     * keine bloße Umbenennung — beide Kinder wandern mit.
     */
    const run = Date.now();
    const origin = await createTagFolder(`E2E-Ursprung-${run}`);
    const target = await createTagFolder(`E2E-Ziel-${run}`);
    const moved = await createTagFolder(`E2E-Verschoben-${run}`, origin.id);
    const grandchildFolder = await createTagFolder(`E2E-Enkel-${run}`, moved.id);
    const leafTag = await createTag(`E2E-Blatt-${run}`, grandchildFolder.id);

    await gotoTags(page);

    // --- Vorher: "moved" liegt sichtbar unter "origin" ----------------------
    await expandFolder(page, origin.name);
    const movedBefore = page.locator(`[data-node-id="${moved.id}"]`);
    await expect(movedBefore).toBeVisible();
    const originLevel = Number(
      await page.locator(`[data-node-id="${origin.id}"]`).getAttribute('aria-level'),
    );
    expect(Number(await movedBefore.getAttribute('aria-level'))).toBe(originLevel + 1);

    await movedBefore.click();
    await expect(page.locator('.tags-detail__kind')).toHaveText('Ordner');
    await expect(page.locator('.tags-detail__name')).toHaveText(moved.name);
    await expect(page.locator('.tags-detail__path')).toContainText(origin.name);

    // --- Verschieben über den echten "Verschieben"-Dialog (S-08) -----------
    await page.getByRole('button', { name: 'Verschieben' }).click();
    const dialog = page.getByRole('dialog', { name: 'Ordner verschachteln' });
    await expect(dialog).toBeVisible();
    // Ark UI (T-059): kein `<select>` mehr, siehe Begründung im ersten
    // Testfall dieser Datei. "target" ist ein Wurzelordner ohne Kinder, seine
    // Beschriftung ist deshalb schlicht sein eigener Name.
    await dialog.getByRole('combobox', { name: 'Neuer übergeordneter Ordner' }).click();
    await page.getByRole('option', { name: target.name, exact: true }).click();
    await dialog.getByRole('button', { name: 'Verschieben' }).click();

    // Schließt nur bei einer erfolgreichen Antwort (200) — bei 422 oder 409
    // bliebe er offen, siehe der Zyklus-Fall oben. Kein Fehlertext hier.
    await expect(dialog).toBeHidden();
    await expect(page.locator('.message--danger')).toHaveCount(0);

    // --- Nachschau ausschließlich über den Tag-Baum, nicht am Rückgabewert -
    //
    // 1. Bevor "target" aufgeklappt wird, taucht "moved" nirgends im Baum
    //    auf: `TagTree.flatten()` nimmt Kinder eines Ordners nur mit, wenn er
    //    aufgeklappt ist. Ein `data-node-id`-Treffer wäre hier ein falscher
    //    Ort im Baum, keine reine Sichtbarkeitsfrage.
    await expect(page.locator(`[data-node-id="${moved.id}"]`)).toHaveCount(0);

    // 2. Die Detailansicht des noch ausgewählten "moved" berechnet ihren Pfad
    //    aus dem frisch geladenen Baum (`pathOf(tree, selected.id)`) — sie
    //    zeigt jetzt "target", nicht mehr "origin".
    await expect(page.locator('.tags-detail__path')).toContainText(target.name);
    await expect(page.locator('.tags-detail__path')).not.toContainText(origin.name);

    // 3. "moved" erscheint als Kind von "target" im Baum, auf der erwarteten
    //    Ebene.
    await expandFolder(page, target.name);
    const movedAfter = page.locator(`[data-node-id="${moved.id}"]`);
    await expect(movedAfter).toBeVisible();
    const targetLevel = Number(
      await page.locator(`[data-node-id="${target.id}"]`).getAttribute('aria-level'),
    );
    expect(Number(await movedAfter.getAttribute('aria-level'))).toBe(targetLevel + 1);

    // 4. Der eigene Unterordner samt Tag ist mitgewandert — ein echter
    //    Teilbaum-Zug, keine Umbenennung.
    await movedAfter.locator('.tree__twisty--active').click();
    const grandchildItem = page.locator(`[data-node-id="${grandchildFolder.id}"]`);
    await expect(grandchildItem).toBeVisible();
    await grandchildItem.locator('.tree__twisty--active').click();
    await expect(page.locator(`[data-node-id="${leafTag.id}"]`)).toBeVisible();

    // 5. "origin" trägt keine Kinder mehr und damit auch kein Dreieck mehr.
    await expect(
      page.locator(`[data-node-id="${origin.id}"]`).locator('.tree__twisty--active'),
    ).toHaveCount(0);
  });
});
