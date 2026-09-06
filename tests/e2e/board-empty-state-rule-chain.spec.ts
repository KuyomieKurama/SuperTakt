/**
 * TP-KANBAN-08 (docs/testplan.md, Abschnitt 8) — T-187, O-FV.
 *
 * Z-07 Punkt 1 (Auflage aus T-177, Freigabe des Textdurchgangs UM-03) verlangt
 * eine gebaute und geprüfte Kette: Der Board-Leerzustand trägt „Erste Spalte
 * einrichten" als Primäraktion, und dieser Knopf führt zur **Definition**
 * einer Spalte (`RULE_IS_A_RULE`, `apps/web/src/lib/labels.ts`) — „von hier
 * aus einen Klick entfernt", T-181-Bericht Abschnitt „UM-03". Elf Stellen der
 * Kanban-Aufklärung sind seit T-181 auf zwei zusammengezogen; diese Kette ist
 * eine davon, und bis zu diesem Fall hielt sie **nichts**: Fällt ein Glied —
 * der Knopf verschwindet, die Verdrahtung ändert sich, `RULE_IS_A_RULE` fällt
 * aus dem geöffneten Dialog —, wird nichts rot (O-FV, aus T-181 Risiko 3).
 *
 * **Kein zweiter Weg, den Wortlaut zu bestätigen:** `RULE_IS_A_RULE` selbst
 * steht unten wörtlich, nicht aus `apps/web/src/lib/labels.ts` importiert —
 * dieser Testbaum hat keinen Zugriff auf `apps/web/src/**`
 * (Dateihoheit-Trennung, `CLAUDE.md`). Bricht der Wortlaut dort, bricht dieser
 * Fall mit — genau die Eigenschaft, die O-FV verlangt.
 *
 * Zero-Spalten-Zustand: Diese Datei räumt vor dem Fall **alle** Regeln mit
 * Anzeigeort „board"/„both" aus dem (für den ganzen Testlauf gemeinsamen,
 * am Anfang von `services.ts#startLocalApi` geleerten) Bestand — nicht, weil
 * ein anderer Fall dieses Bestands regulär welche liegen ließe (jeder legt
 * seine eigene Spalte an und entfernt sie wieder, `kanban.spec.ts`), sondern
 * als Schutz gegen genau den Fall, den ein liegen gebliebener Rest aus einem
 * abgebrochenen Lauf sonst unbemerkt anrichten würde: ein Leerzustand, der
 * gar nicht mehr leer ist.
 */
import { test, expect } from '@playwright/test';

import { deletePool, listPools } from './support/api';
import { gotoBoard } from './support/nav';

test.beforeEach(async () => {
  const columns = await listPools('board');
  for (const pool of columns) await deletePool(pool.id);
});

test.describe('TP-KANBAN-08 — Board-Leerzustand: „Erste Spalte einrichten" führt zur Definition einer Spalte (Z-07 Punkt 1, O-FV)', () => {
  test('der Knopf öffnet einen Dialog, der die Regel-Definition wörtlich nennt', async ({ page }) => {
    await gotoBoard(page);

    await expect(page.getByText('Das Board hat noch keine Spalte')).toBeVisible();
    const primaryAction = page.getByRole('button', { name: 'Erste Spalte einrichten' }).first();
    await expect(primaryAction).toBeVisible();

    await primaryAction.click();

    // `RULE_IS_A_RULE`, wörtlich aus `apps/web/src/lib/labels.ts` — die
    // **Definition**, nicht das Verhalten (`RULE_WHAT_MOVES_A_CARD`, das am
    // Board als `lead` steht und hier nicht gesucht wird).
    const dialog = page.getByRole('dialog').filter({
      hasText: 'Eine Spalte ist eine Regel — über Tags, Status, „Erledigt“ und den Exportstatus.',
    });
    await expect(dialog).toBeVisible();
  });
});
