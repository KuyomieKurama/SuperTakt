import { localDayFromToday } from './support/local-time';
import { test, expect, type Locator, type Page } from '@playwright/test';

import { createBoardColumn } from './support/actions';
import { createTag, createTodo, deletePoolByName, deleteTag, deleteTodo } from './support/api';
import { gotoBoard } from './support/nav';

function boardColumn(page: Page, name: string): Locator {
  return page.locator('.kcolumn').filter({ has: page.locator('.kcolumn__title', { hasText: name }) });
}

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function overlapArea(a: Box, b: Box): number {
  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return overlapX * overlapY;
}

test.describe('TP-KANBAN-07 — Kartenmetadaten unter dem Titel in schmaler Spalte', () => {
  test('Call und Frist stehen unter dem Titel, bleiben in der Karte und eine Karte ohne Call beginnt gleich hoch', async ({ page }) => {
    const run = Date.now();
    const columnName = `E2E-Metazeile-${run}`;
    const tag = await createTag(`E2E-Metazeile-${run}`);
    const callSuffix = String(run).slice(-6);
    const overdue = localDayFromToday(-5);
    const withCall = await createTodo({
      title: `E2E-META-MIT-CALL-${run}`,
      callNumber: `CALL-${callSuffix}`,
      dueDate: overdue,
      tagIds: [tag.id],
    });
    const withoutCall = await createTodo({
      title: `E2E-META-OHNE-CALL-${run}`,
      tagIds: [tag.id],
    });

    try {
      await gotoBoard(page);
      await createBoardColumn(page, columnName, { requiredTagNames: [tag.name] });

      const column = boardColumn(page, columnName);
      const cardWithCall = column.locator('.kcard', { hasText: withCall.title });
      const cardWithoutCall = column.locator('.kcard', { hasText: withoutCall.title });
      await expect(cardWithCall).toBeVisible();
      await expect(cardWithoutCall).toBeVisible();
      await expect(cardWithCall.locator('.kcard__top')).toHaveCount(0);
      await expect(cardWithCall.locator('.kcard__deadline')).toHaveAttribute(
        'aria-label',
        /^Überfällig — Frist: \d{2}\.\d{2}\.\d{4}$/,
      );
      await expect(cardWithoutCall.locator('.kcard__call')).toHaveCount(0);

      await page.setViewportSize({ width: 314, height: 900 });
      const columnBox = await column.boundingBox();
      expect(columnBox).not.toBeNull();
      expect(columnBox!.width).toBeGreaterThanOrEqual(270.5);
      expect(columnBox!.width).toBeLessThanOrEqual(273.5);

      const main = cardWithCall.locator('.kcard__main');
      const actions = cardWithCall.locator('.kcard__actions');
      const title = cardWithCall.locator('.kcard__title');
      const call = cardWithCall.locator('.kcard__call');
      const deadline = cardWithCall.locator('.kcard__deadline');
      const metadata = cardWithCall.locator('.kcard__title + .kcard__tags');
      await expect(metadata).toBeVisible();

      const [mainBox, actionsBox, titleBox, callBox, deadlineBox, withoutCallCardBox, withoutCallTitleBox] = await Promise.all([
        main.boundingBox(),
        actions.boundingBox(),
        title.boundingBox(),
        call.boundingBox(),
        deadline.boundingBox(),
        cardWithoutCall.boundingBox(),
        cardWithoutCall.locator('.kcard__title').boundingBox(),
      ]);
      expect(mainBox).not.toBeNull();
      expect(actionsBox).not.toBeNull();
      expect(titleBox).not.toBeNull();
      expect(callBox).not.toBeNull();
      expect(deadlineBox).not.toBeNull();
      expect(withoutCallCardBox).not.toBeNull();
      expect(withoutCallTitleBox).not.toBeNull();

      for (const mark of [callBox, deadlineBox] as Box[]) {
        expect(mark.x + mark.width).toBeLessThanOrEqual(mainBox!.x + mainBox!.width + 1);
        expect(overlapArea(mark, actionsBox as Box)).toBeLessThanOrEqual(1);
      }
      expect(callBox!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height - 1);
      expect(deadlineBox!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height - 1);

      const withCallTop = titleBox!.y - (await cardWithCall.boundingBox())!.y;
      const withoutCallTop = withoutCallTitleBox!.y - withoutCallCardBox!.y;
      expect(Math.abs(withCallTop - withoutCallTop)).toBeLessThanOrEqual(1);
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(withCall.id).catch(() => undefined);
      await deleteTodo(withoutCall.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });
});
