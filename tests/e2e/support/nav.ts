/**
 * Takt — Navigation über den Anker der Adresse (app/router.ts, T-022 Annahme 6).
 *
 * Kein Klick auf die globale Navigation ist nötig: Die Anwendung liest die
 * Route aus dem URL-Anker, und ein direkter `page.goto()` auf denselben
 * Anker landet auf derselben Ansicht. Das spart in jedem Testfall einen
 * Navigationsschritt, der nichts mit dem eigentlichen Verhalten zu tun hat.
 *
 * Die Segmente sind wörtlich aus `apps/web/src/app/router.ts` übernommen
 * (`SEGMENT`) — nicht geraten.
 */

import type { Page } from '@playwright/test';

export async function gotoTodo(page: Page, todoId: string): Promise<void> {
  await page.goto(`/#/todos/${encodeURIComponent(todoId)}`);
}

export async function gotoTodos(page: Page): Promise<void> {
  await page.goto('/#/todos');
}

export async function gotoBoard(page: Page): Promise<void> {
  await page.goto('/#/kanban');
}

export async function gotoTime(page: Page): Promise<void> {
  await page.goto('/#/zeiterfassung');
}

export async function gotoBookings(page: Page): Promise<void> {
  await page.goto('/#/buchungen');
}

export async function gotoExport(page: Page): Promise<void> {
  await page.goto('/#/export');
}

export async function gotoTemplates(page: Page, templateId?: string): Promise<void> {
  await page.goto(templateId === undefined ? '/#/export/vorlagen' : `/#/export/vorlagen/${encodeURIComponent(templateId)}`);
}

export async function gotoTags(page: Page): Promise<void> {
  await page.goto('/#/tags');
}

/**
 * `bereich` wählt einen der Einstellungs-Reiter (`SettingsScreen.tsx`,
 * `AREA_LIST`) — ohne ihn landet man auf dem ersten Bereich
 * ("darstellung"), nicht notwendigerweise dem gesuchten.
 */
export async function gotoSettings(page: Page, bereich?: string): Promise<void> {
  await page.goto(bereich === undefined ? '/#/einstellungen' : `/#/einstellungen?bereich=${encodeURIComponent(bereich)}`);
}

export async function gotoDashboard(page: Page): Promise<void> {
  await page.goto('/#/');
}
