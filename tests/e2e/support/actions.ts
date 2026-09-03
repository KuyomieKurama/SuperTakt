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
   * Ordnerpfade für "Erforderliche Ordner" (E-057, T-096) — volle
   * Pfadsegmente, so wie `FolderPicker` sie als Chipbeschriftung anzeigt
   * (`folder.path.join(" / ")`). Für einen Wurzelordner genügt `[name]`.
   */
  readonly requiredFolderPaths?: readonly (readonly string[])[];
  /** Namen für die Achse "Status" (`RulePickers.tsx`, `StatusPicker`). */
  readonly statusNames?: readonly string[];
  /**
   * Die Achse "Erledigt" (E-055). Ohne Angabe bleibt sie auf ihrem
   * Neutralwert "Alle" — sie schränkt dann nicht ein, siehe
   * `POOL_AXIS_NEUTRAL_HINT` in `apps/web/src/lib/labels.ts`.
   */
  readonly completion?: 'done' | 'open';
}

/**
 * Wählt einen Ordner in einer der beiden Ordnerauswahlen des Regelformulars
 * (`RulePickers.tsx`, `FolderPicker`) — unterschieden über die Beschriftung
 * ihrer Gruppe ("Erforderliche Ordner" gegen "Ausgeschlossene Ordner").
 *
 * Ab acht Ordnern zeigt `FolderPicker` ein Suchfeld (A-4.4, T-091); über
 * einen ganzen `pnpm test:e2e`-Lauf sammeln sich Ordner aus mehreren
 * Spezifikationsdateien in derselben Datenbank an (`support/services.ts`
 * setzt sie nur je Lauf zurück, nicht je Datei). Es wird deshalb immer
 * gesucht, sobald ein Suchfeld da ist, statt sich auf eine Chipzahl zu
 * verlassen, die von der Ausführungsreihenfolge anderer Dateien abhinge.
 */
async function pickFolder(
  dialog: Locator,
  groupLabel: string,
  folderPath: readonly string[],
): Promise<void> {
  const group = dialog.getByRole('group', { name: groupLabel, exact: true });
  /*
   * Das Suchfeld (falls ab acht Ordnern vorhanden, `RulePickers.tsx`,
   * `SEARCH_FROM`) steht im selben `.field`-Container als Geschwister der
   * Gruppe, nicht darin. Gefunden über den gemeinsamen Vorfahren
   * (XPath-Achse `ancestor`) statt über `Locator.filter({ has })`: Ein
   * `has`-Filter mit einer schon an `dialog` gebundenen Gruppe kombinierte
   * hier zusätzlich das Dialogpräfix und traf dadurch nichts — gemessen an
   * einem hängenden Klick (T-096).
   */
  const search = group.locator(
    'xpath=./ancestor::div[contains(concat(" ", normalize-space(@class), " "), " field ")][1]//input[@type="search"]',
  );
  if ((await search.count()) > 0) {
    await search.fill(folderPath[folderPath.length - 1] ?? '');
  }
  await group.getByRole('button', { name: folderPath.join(' / '), exact: true }).click();
}

/** Wählt einen Status in der Achse "Status" (`RulePickers.tsx`, `StatusPicker`). */
async function pickStatus(dialog: Locator, statusName: string): Promise<void> {
  await dialog
    .getByRole('group', { name: 'Status', exact: true })
    .getByRole('button', { name: statusName, exact: true })
    .click();
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

  for (const folderPath of rule.requiredFolderPaths ?? []) {
    await pickFolder(ruleDialog, 'Erforderliche Ordner', folderPath);
  }

  for (const statusName of rule.statusNames ?? []) {
    await pickStatus(ruleDialog, statusName);
  }

  // Seit T-091 trägt die Optionszeile "Erledigt" den erklärenden Hinweistext
  // nicht mehr **im** `<label>` (`RadioRow.tsx`) — er hängt jetzt als
  // Geschwister der Optionsliste über `aria-describedby` an jedem Knopf. Der
  // zugängliche Name ist deshalb wieder schlicht "Erledigt" bzw.
  // "Unerledigt", nicht mehr "Erledigt Nur erledigte Todos. …". Das am
  // Anfang verankerte Muster bleibt trotzdem stehen: Es traf schon vor T-091
  // genau einen Knopf, weil "Unerledigt" nicht mit "Erledigt" **beginnt**
  // (sondern nur damit endet), und tut das unverändert (an der laufenden
  // Oberfläche nachgesehen, T-096).
  if (rule.completion === 'done') {
    await ruleDialog.getByRole('radio', { name: /^Erledigt\b/ }).check();
  } else if (rule.completion === 'open') {
    await ruleDialog.getByRole('radio', { name: /^Unerledigt\b/ }).check();
  }

  await ruleDialog.getByRole('button', { name: 'Anlegen' }).click();
  await expect(ruleDialog).toBeHidden();
}
