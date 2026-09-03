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
import { expect, type Locator, type Page } from '@playwright/test';

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

/* ==================================================================== */
/* Kanban — eine Spalte über die echte Oberfläche anlegen (T-081, E-054, */
/* E-055)                                                                */
/* ==================================================================== */

/**
 * Wählt ein vorhandenes Tag in einer der beiden Taglisten des Regelformulars
 * (`PoolFormDialog.tsx`). Beide Comboboxen heißen barrierefrei gleich
 * "Tags" (`TagInput label="Tags" hideLabel`) — eindeutig wird die Auswahl
 * erst über den umschließenden Abschnitt (`section`), den der Aufrufer
 * mitgibt.
 *
 * Legt **kein** neues Tag an: Anders als beim Todo bietet die Regel dafür
 * keine Bedienung (`PoolFormDialog.tsx`, kein `allowCreate`) — das Tag muss
 * vorher existieren (`support/api.ts`, `createTag`).
 */
async function pickExistingTag(page: Page, section: Locator, tagName: string): Promise<void> {
  const box = section.getByRole('combobox', { name: 'Tags' });
  await box.click();
  await box.fill(tagName);
  await page.getByRole('option', { name: tagName }).click();
  await box.fill('');
  await page.keyboard.press('Escape');
}

export interface BoardColumnRule {
  /** Tags, die die Spalte als "Erforderliche Tags" verlangt (Modus "mindestens eines davon"). */
  readonly requiredTagNames?: readonly string[];
  readonly excludedTagNames?: readonly string[];
  /**
   * Die Achse "Erledigt" (E-055). Ohne Angabe bleibt sie auf ihrem
   * Neutralwert "Alle" — sie schränkt dann nicht ein, siehe
   * `POOL_AXIS_NEUTRAL_HINT` in `apps/web/src/lib/labels.ts`.
   */
  readonly completion?: 'done' | 'open';
}

/**
 * Legt eine Kanban-Spalte über die echte Bedienung an: "Spalten verwalten" →
 * "Neue Spalte anlegen" → das Regelformular. Seit E-054 ist eine Spalte
 * dieselbe Entität wie ein Pool, mit `placement: "board"` vorbelegt, sobald
 * sie aus diesem Dialog heraus angelegt wird (`BoardScreen.tsx`,
 * `defaultPlacement="board"`).
 *
 * Schreibt absichtlich **nicht** über `POST /pools` — genau das ist die
 * Falle, vor der der T-081-Auftrag warnt ("Ein e2e-Fall lief über die
 * Testhilfe am Code vorbei"): Ein Testaufbau, der Spalten an der Datenbank
 * vorbei anlegt, misst nicht, was der Benutzer erlebt, und hätte einen Fehler
 * in genau diesem Formular nicht gefunden.
 *
 * Voraussetzung: `page` steht bereits auf `#/kanban` (`gotoBoard`). Genannte
 * Tags müssen vorher existieren (`createTag`).
 */
export async function createBoardColumn(
  page: Page,
  name: string,
  rule: BoardColumnRule = {},
): Promise<void> {
  await page.getByRole('button', { name: 'Spalten verwalten' }).click();
  const setupDialog = page.getByRole('dialog', { name: 'Spalten des Boards' });
  await expect(setupDialog).toBeVisible();
  await setupDialog.getByRole('button', { name: 'Neue Spalte anlegen' }).click();

  const ruleDialog = page.getByRole('dialog', { name: 'Neue Board-Spalte anlegen' });
  await expect(ruleDialog).toBeVisible();
  await ruleDialog.getByLabel('Name').fill(name);

  const requiredSection = ruleDialog.locator('.form-section', { hasText: 'Erforderliche Tags' });
  for (const tagName of rule.requiredTagNames ?? []) {
    await pickExistingTag(page, requiredSection, tagName);
  }

  const excludedSection = ruleDialog.locator('.form-section', { hasText: 'Ausgeschlossene Tags' });
  for (const tagName of rule.excludedTagNames ?? []) {
    await pickExistingTag(page, excludedSection, tagName);
  }

  // Die Optionszeile "Erledigt" trägt an jedem Knopf zusätzlich den
  // erklärenden Hinweistext (`RadioRow.tsx`, der Hinweis steht **innerhalb**
  // des <label>, nicht nur als `aria-describedby`) — der zugängliche Name
  // ist deshalb "Erledigt Nur erledigte Todos. …", nicht nur "Erledigt".
  // Ein am Anfang verankertes Muster trifft trotzdem genau einen Knopf, ohne
  // "Unerledigt" (das mit `Erledigt` als Teilzeichenkette endet) versehentlich
  // mitzutreffen (an der laufenden Oberfläche nachgesehen, T-081).
  if (rule.completion === 'done') {
    await ruleDialog.getByRole('radio', { name: /^Erledigt\b/ }).check();
  } else if (rule.completion === 'open') {
    await ruleDialog.getByRole('radio', { name: /^Unerledigt\b/ }).check();
  }

  await ruleDialog.getByRole('button', { name: 'Anlegen' }).click();
  await expect(ruleDialog).toBeHidden();
}
