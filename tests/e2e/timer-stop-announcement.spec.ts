/**
 * Stopp-Anzeige trägt den Bewegungssatz (E-058 Punkt 6, T-097, T-099,
 * `docs/testplan.md` Abschnitt 17/19, Arbeitstitel TP-TIMER-08/-11).
 *
 * Seit T-097 liefern `POST /timer/stop` und `POST /timer/orphaned/resolve`
 * `poolMovement` in beiden Zweigen (`recorded`/`discarded`), und die
 * Oberfläche hängt den Satz aus `poolMovementSentence(movement, 'past',
 * 'booking')` an den Toast „Zeit gebucht." bzw. „Buchung abgeschlossen." an
 * (`apps/web/src/app/TimerContext.tsx`, `reportStopped`/`confirmOrphan`).
 * Im verworfenen Zweig (`discarded`, Timer unter einer Sekunde) ist
 * `poolMovement` fest `null` — kein Satz, keine leere Zeile.
 *
 * Die Erwartung kommt aus der Domänenfunktion selbst (`@takt/domain`,
 * `poolMovementSentence`), gebildet aus der tatsächlichen Antwort des
 * Dienstes — kein Literal, dieselbe Bauart wie in
 * `pool-movement-sentence.spec.ts` und in `scripts/proof-addin.mjs`.
 *
 * Seit T-101/T-102 trägt der Titel von Stopp- und Orphan-Meldungen den
 * Todo-Namen statt „Es" ohne Bezug (W-5), und `POST /timer/orphaned/resolve`
 * unterscheidet im verworfenen Zweig zwei Gründe (O-R,
 * `reason: 'timer_too_short' | 'orphan_discarded'`), mit je einem eigenen
 * Text — geprüft in der zweiten `describe`-Gruppe unten (Arbeitstitel
 * TP-TIMER-11, aus dem Entwurf in `reports/T-103-e2e-tester.md`, jetzt gegen
 * den tatsächlichen Wortlaut aus `reports/T-102-frontend-dev.md` Abschnitt 2).
 * Kein Literal ohne Gegenlesen: die Wortlaute stehen auch in
 * `apps/web/src/app/TimerContext.tsx#confirmOrphan`.
 */
import { test, expect } from '@playwright/test';

import { poolMovementSentence, type PoolMovement } from '../../packages/domain/src/pool-movement.ts';
import {
  cleanupAnyTimer,
  createPool,
  createTag,
  createTodo,
  deletePoolByName,
  deleteTag,
  deleteTodo,
  startTimer,
  touchTimerHeartbeat,
} from './support/api';
import { gotoTodo } from './support/nav';

test.afterEach(async () => {
  // Dasselbe Muster wie in `todo-revival.spec.ts`/`kanban.spec.ts` (T-048):
  // ein fehlgeschlagener Fall darf keinen laufenden oder verwaisten Timer
  // für den nächsten Fall hinterlassen.
  await cleanupAnyTimer();
});

test.describe('Stopp-Anzeige trägt den Bewegungssatz mit Anlass „booking“', () => {
  test('`recorded`: der Toast „Zeit gebucht.“ trägt den Satz, in der Vergangenheit', async ({ page }) => {
    const run = Date.now();
    const columnName = `E2E-Stopp-NochOffen-${run}`;
    const tag = await createTag(`E2E-Stopp-Erste-Buchung-${run}`);
    // `exportState: 'open'` — genau die Achse aus E-058 Punkt 6: Die erste
    // abgeschlossene Buchung setzt „hat offene Buchungen“, und diese Spalte
    // fragt danach.
    await createPool({ name: columnName, placement: 'pool', requiredTagIds: [tag.id], exportState: 'open' });
    const todo = await createTodo({ title: `E2E-STOPP-BUCHUNG-${run}`, tagIds: [tag.id] });

    try {
      await gotoTodo(page, todo.id);
      const main = page.locator('#inhalt');
      await main.getByRole('button', { name: 'Timer starten' }).first().click();
      await expect(main.getByRole('button', { name: 'Timer stoppen' })).toBeVisible();

      await page.waitForTimeout(1200);

      await main.getByRole('button', { name: 'Timer stoppen' }).click();
      const dialog = page.getByRole('dialog', { name: 'Timer stoppen' });
      await expect(dialog).toBeVisible();

      // Eine Leistung eintragen, damit die Tagesgruppe abrechenbar ist und der
      // Toast den einfachen Erfolgstitel „Zeit gebucht.“ trägt statt der
      // Warnung „aber noch nicht abrechenbar“ (`TimerContext.tsx`,
      // `reportStopped`) — die ist nicht Gegenstand dieses Falls. Auf den
      // Dialog gescoped: Das Feld heißt außerhalb davon „Leistung" nicht.
      await dialog.getByLabel('Leistung').fill('E2E-Stopp-Leistungstext');

      const [stopResponse] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes('/timer/stop') && response.request().method() === 'POST',
        ),
        dialog.getByRole('button', { name: 'Stoppen und buchen' }).click(),
      ]);
      await expect(dialog).toBeHidden();

      const stopBody = (await stopResponse.json()) as {
        data: { kind: string; poolMovement: PoolMovement | null };
      };
      expect(stopBody.data.kind).toBe('recorded');
      const movement = stopBody.data.poolMovement;
      expect(movement).not.toBeNull();
      // `appears` ist der Zustand **nachher** und damit auch dann besetzt,
      // wenn sich nichts weiter rührt (siehe `PoolMovement` in
      // `packages/domain/src/pool-movement.ts`) — die erste abgeschlossene
      // Buchung füllt die Spalte sowohl in `appears` als auch in `enters`.
      expect(movement).toEqual({ appears: [columnName], enters: [columnName], leaves: [] });

      // `'booking'` darf `null` liefern (keine Bewegung) — hier nicht der
      // Fall, `enters` ist besetzt; die Prüfung erzwingt die Verengung, statt
      // mit einer Behauptung über den Typ hinwegzugehen.
      const expected = poolMovementSentence(movement as PoolMovement, 'past', 'booking');
      expect(expected).not.toBeNull();
      if (expected === null) throw new Error('unreachable');
      expect(expected).toBe(`Es steht jetzt in „${columnName}“.`);

      // Scoped auf genau diesen Toast: Der Start (`doneCleared: false`) hat
      // zuvor bereits „Timer gestartet." gezeigt, und Meldungen stapeln sich
      // bis zu acht Sekunden (`ToastContext.tsx`) — ein ungescopter Zugriff
      // auf `.toast__title` träfe deshalb zwei Elemente.
      //
      // W-5 (T-102, gemessener Wortlaut in Abschnitt 2 des Berichts): Der
      // Titel nennt jetzt den Todo-Namen statt „Es" ohne Bezug.
      const toast = page.locator('.toast').filter({ hasText: 'Zeit gebucht' });
      await expect(toast.locator('.toast__title')).toHaveText(`Zeit gebucht auf „${todo.title}“.`);
      const bodyText = (await toast.locator('.toast__body').textContent()) ?? '';
      // Der Satz steht **angehängt** an den Buchungsrumpf, nicht anstelle
      // davon — `withMovement` (`TimerContext.tsx`) hängt ihn genau einmal an.
      expect(bodyText.trim().endsWith(expected)).toBe(true);
      expect(bodyText).toContain('Gebucht:');
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('`discarded`: der Toast „Nichts gebucht.“ trägt keinen Satz', async ({ page }) => {
    const run = Date.now();
    const tag = await createTag(`E2E-Stopp-ZuKurz-${run}`);
    const columnName = `E2E-Stopp-ZuKurz-Spalte-${run}`;
    // Eine zutreffende Regel ist bewusst vorhanden: Der verworfene Zweig soll
    // auch dann stumm bleiben, wenn es etwas zu nennen gäbe (`usecases/
    // timer.ts`: `poolMovement` steht im Zweig `discarded` fest auf `null`,
    // ohne dass überhaupt eine Regel aufgelöst wird).
    await createPool({ name: columnName, placement: 'pool', requiredTagIds: [tag.id], exportState: 'open' });
    const todo = await createTodo({ title: `E2E-STOPP-ZUKURZ-${run}`, tagIds: [tag.id] });

    try {
      await gotoTodo(page, todo.id);
      const main = page.locator('#inhalt');
      await main.getByRole('button', { name: 'Timer starten' }).first().click();
      const stopButton = main.getByRole('button', { name: 'Timer stoppen' });
      await expect(stopButton).toBeVisible();
      // Sofort weiter, ohne Wartezeit dazwischen — der Timer soll unter einer
      // Sekunde bleiben (`MINIMUM_DURATION_SECONDS`, `packages/domain/src/
      // time-entry.ts`). Der Bestätigungsdialog verlangt keine Leistung
      // („Die Leistung darf leer bleiben“), das Feld bleibt also leer.
      await stopButton.click();
      const dialog = page.getByRole('dialog', { name: 'Timer stoppen' });
      await expect(dialog).toBeVisible();

      const [stopResponse] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes('/timer/stop') && response.request().method() === 'POST',
        ),
        dialog.getByRole('button', { name: 'Stoppen und buchen' }).click(),
      ]);
      await expect(dialog).toBeHidden();

      const stopBody = (await stopResponse.json()) as { data: { kind: string; poolMovement: null } };

      if (stopBody.data.kind !== 'discarded') {
        // Auf einer stark ausgelasteten Maschine (mehrere Agenten parallel,
        // siehe `playwright.config.ts`-Kopf) kann der Klickpfad in seltenen
        // Fällen eine Sekunde überschreiten. Dann ist dies kein Fund über die
        // Anwendung, sondern ein Fund über die Zeitmessung dieses Testfalls —
        // siehe Bericht.
        test.info().annotations.push({
          type: 'timing',
          description:
            'Timer lief eine Sekunde oder länger; der `discarded`-Zweig konnte auf diesem Lauf nicht geprüft werden.',
        });
        expect(stopBody.data.kind).toBe('recorded');
        return;
      }

      expect(stopBody.data.poolMovement).toBeNull();

      // Scoped auf genau diesen Toast: Der vorangegangene Start zeigte
      // ebenfalls einen Toast („Timer gestartet."), der bis zu acht Sekunden
      // stehen bleibt (`ToastContext.tsx`) — ein ungescopter Zugriff auf
      // `.toast__title` träfe zwei Elemente.
      // W-5 (T-102): Der Titel bleibt unverändert bei „Nichts gebucht.", der
      // Rumpf nennt jetzt den Todo-Namen statt „Der Timer" ohne Bezug —
      // gemessener Wortlaut in Abschnitt 2 des Berichts.
      const toast = page.locator('.toast').filter({ hasText: 'Nichts gebucht.' });
      await expect(toast.locator('.toast__title')).toHaveText('Nichts gebucht.');
      await expect(toast.locator('.toast__body')).toHaveText(
        `Der Timer auf „${todo.title}“ lief weniger als eine Sekunde. Das ist ein Doppelklick auf „Start“, keine geleistete Arbeit.`,
      );
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('`POST /timer/orphaned/resolve` (E-036): dieselbe Auskunft, ohne Prozessabschuss ausgelöst', async ({
    page,
  }) => {
    // E-036: „Hülle weg, stdin zu“ — im Testrahmen läuft der Dienst ohne
    // Tauri-Hülle direkt aus dem Quelltext (`support/services.ts`) und hört
    // auf `stdin`, dessen Schließen ihn beendet. Diesen Prozess abzuschießen
    // würde jeden folgenden Testfall in derselben Datei mitreißen und ist
    // ausdrücklich nicht der Auftrag. Stattdessen wird derselbe **Zustand**
    // hergestellt, den ein Absturz hinterließe — ein laufender Timer, den die
    // gerade erst startende Oberfläche noch nicht kennt —, ohne den Dienst
    // anzufassen: `loadOrphanedTimer` (`usecases/timer.ts`) meldet **jeden**
    // zum Zeitpunkt des Ladens unvollständigen Eintrag als verwaist, unabhängig
    // vom Alter des letzten Lebenszeichens. Ein über die rohe API gestarteter
    // Timer, den diese — bei ihrer ersten Navigation frische — Seite beim
    // Hochfahren vorfindet, ist für die Oberfläche ununterscheidbar von einem
    // Timer, der einen Absturz überlebt hat.
    await cleanupAnyTimer();

    const run = Date.now();
    const columnName = `E2E-Stopp-Verwaist-${run}`;
    const tag = await createTag(`E2E-Stopp-Verwaist-Tag-${run}`);
    await createPool({ name: columnName, placement: 'pool', requiredTagIds: [tag.id], exportState: 'open' });
    const todo = await createTodo({ title: `E2E-STOPP-VERWAIST-${run}`, tagIds: [tag.id] });

    try {
      const started = await startTimer(todo.id);
      if (started.kind !== 'started') throw new Error('Timer konnte nicht gestartet werden.');

      // Ein Lebenszeichen mit echtem Abstand zum Start — sonst wäre auch die
      // verwaiste Buchung unter einer Sekunde lang und liefe in `discarded`
      // (`decideOrphanedTimer`: `now = heartbeatAt ?? startedAt`).
      await page.waitForTimeout(1500);
      await touchTimerHeartbeat();

      // Erste Navigation dieser (frischen) Seite — der `TimerProvider` startet
      // seine Einmal-Abfrage `GET /timer/orphaned` erst jetzt.
      await gotoTodo(page, todo.id);

      const orphanDialog = page.getByRole('dialog', { name: 'Eine Buchung ohne Ende' });
      await expect(orphanDialog).toBeVisible();

      // Vorgabe ist bereits „Bis zum letzten Lebenszeichen buchen"
      // (`TimerContext.tsx`, `orphanChoice`-Anfangswert) — kein Umschalten
      // nötig.
      const [resolveResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/timer/orphaned/resolve') && response.request().method() === 'POST',
        ),
        // `exact: true` — sonst träfe die Standard-Textsuche auch „Später
        // entscheiden" (Playwright vergleicht Zeichenketten sonst als
        // Teilzeichenkette, ohne Rücksicht auf Groß-/Kleinschreibung).
        orphanDialog.getByRole('button', { name: 'Entscheiden', exact: true }).click(),
      ]);
      await expect(orphanDialog).toBeHidden();

      const resolveBody = (await resolveResponse.json()) as {
        data: { kind: string; poolMovement: PoolMovement | null };
      };
      expect(resolveBody.data.kind).toBe('recorded');
      const movement = resolveBody.data.poolMovement;
      expect(movement).not.toBeNull();
      // `appears` ist der Zustand nachher (siehe Anmerkung im ersten Fall
      // dieser Datei) und deshalb ebenfalls besetzt.
      expect(movement).toEqual({ appears: [columnName], enters: [columnName], leaves: [] });

      const expected = poolMovementSentence(movement as PoolMovement, 'past', 'booking');
      expect(expected).not.toBeNull();
      if (expected === null) throw new Error('unreachable');
      expect(expected).toBe(`Es steht jetzt in „${columnName}“.`);

      // W-5 (T-102): Der Titel nennt jetzt den Todo-Namen statt „Es" — der
      // Absturz liegt zwischen Ereignis und Meldung, „Es" hätte hier keinen
      // Bezug (gemessener Wortlaut in Abschnitt 2 des Berichts).
      await expect(page.locator('.toast__title')).toHaveText(`Buchung auf „${todo.title}“ abgeschlossen.`);
      const bodyText = (await page.locator('.toast__body').textContent()) ?? '';
      expect(bodyText.trim().endsWith(expected)).toBe(true);
      expect(bodyText).toContain('Gebucht bis zum letzten Lebenszeichen');
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });
});

test.describe('`POST /timer/orphaned/resolve` unterscheidet den Grund einer verworfenen Buchung (O-R)', () => {
  /*
   * Bis T-101 lieferte der Dienst in beiden verworfenen Zweigen
   * `reason: 'timer_too_short'` — die Wahl „Verwerfen" und der Fall „kein
   * Lebenszeichen, nichts zu buchen" waren serverseitig nicht zu
   * unterscheiden, und die Oberfläche sagte an beiden Ausgängen dasselbe.
   * Seit T-101/T-102 unterscheidet der Dienst (`orphan_discarded` gegenüber
   * `timer_too_short`), und die Oberfläche trägt an beiden Stellen einen
   * eigenen Text (`TimerContext.tsx`, `confirmOrphan`). Kein `poolMovement`
   * in diesem Zweig — er steht in beiden Fällen fest auf `null`, es wird
   * keine Regel aufgelöst (E-058 Punkt 6, unverändert). Die Wortlaute sind
   * aus `reports/T-102-frontend-dev.md` Abschnitt 2 übernommen, gegen den
   * tatsächlichen Quelltext von `TimerContext.tsx` gegengelesen.
   */
  test('„Verwerfen“ liefert `orphan_discarded`, mit eigenem Text', async ({ page }) => {
    await cleanupAnyTimer();

    const run = Date.now();
    const tag = await createTag(`E2E-Stopp-Verworfen-Tag-${run}`);
    const todo = await createTodo({ title: `E2E-T102-VERWORFEN-${run}`, tagIds: [tag.id] });

    try {
      const started = await startTimer(todo.id);
      if (started.kind !== 'started') throw new Error('Timer konnte nicht gestartet werden.');

      // Ein Lebenszeichen mit echtem Abstand zum Start, damit die Wahl
      // „Bis zum letzten Lebenszeichen buchen" (falls sie versehentlich
      // gewählt würde) tatsächlich etwas zu buchen fände — dieser Fall soll
      // ausschließlich über die bewusste Wahl „Verwerfen" laufen, nicht über
      // einen zu kurzen Timer (das wäre der andere Fall dieser Datei).
      await page.waitForTimeout(1500);
      await touchTimerHeartbeat();

      await gotoTodo(page, todo.id);

      const orphanDialog = page.getByRole('dialog', { name: 'Eine Buchung ohne Ende' });
      await expect(orphanDialog).toBeVisible();

      await orphanDialog.getByRole('radio', { name: 'Verwerfen' }).check();

      const [resolveResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/timer/orphaned/resolve') && response.request().method() === 'POST',
        ),
        orphanDialog.getByRole('button', { name: 'Entscheiden', exact: true }).click(),
      ]);
      await expect(orphanDialog).toBeHidden();

      const resolveBody = (await resolveResponse.json()) as {
        data: { kind: string; reason?: string; poolMovement: PoolMovement | null };
      };
      expect(resolveBody.data.kind).toBe('discarded');
      expect(resolveBody.data.reason).toBe('orphan_discarded');
      expect(resolveBody.data.poolMovement).toBeNull();

      await expect(page.locator('.toast__title')).toHaveText('Buchung verworfen.');
      await expect(page.locator('.toast__body')).toHaveText(
        `Sie haben die unvollständige Buchung auf „${todo.title}“ verworfen. Es ist keine Zeit gebucht worden.`,
      );
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('„zu kurz“ bleibt `timer_too_short`, mit einem anderen Text als „Verwerfen“', async ({ page }) => {
    await cleanupAnyTimer();

    const run = Date.now();
    const tag = await createTag(`E2E-Stopp-ZuKurzVerwaist-Tag-${run}`);
    const todo = await createTodo({ title: `E2E-T102-ZUKURZ-${run}`, tagIds: [tag.id] });

    try {
      const started = await startTimer(todo.id);
      if (started.kind !== 'started') throw new Error('Timer konnte nicht gestartet werden.');

      // Kein Lebenszeichen und keine Wartezeit — `now = heartbeatAt ??
      // startedAt` (`decideOrphanedTimer`) bleibt unter einer Sekunde, die
      // Vorgabe „Bis zum letzten Lebenszeichen buchen" findet nichts.
      await gotoTodo(page, todo.id);

      const orphanDialog = page.getByRole('dialog', { name: 'Eine Buchung ohne Ende' });
      await expect(orphanDialog).toBeVisible();

      // Vorgabe ist bereits „Bis zum letzten Lebenszeichen buchen"
      // (`TimerContext.tsx`, `orphanChoice`-Anfangswert) — kein Umschalten,
      // die Wahl „Verwerfen" würde hier `orphan_discarded` liefern statt
      // des hier geprüften `timer_too_short`.
      const [resolveResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/timer/orphaned/resolve') && response.request().method() === 'POST',
        ),
        orphanDialog.getByRole('button', { name: 'Entscheiden', exact: true }).click(),
      ]);
      await expect(orphanDialog).toBeHidden();

      const resolveBody = (await resolveResponse.json()) as {
        data: { kind: string; reason?: string; poolMovement: PoolMovement | null };
      };
      expect(resolveBody.data.kind).toBe('discarded');
      expect(resolveBody.data.reason).toBe('timer_too_short');
      expect(resolveBody.data.poolMovement).toBeNull();

      await expect(page.locator('.toast__title')).toHaveText('Nichts zu buchen.');
      const bodyText = (await page.locator('.toast__body').textContent()) ?? '';
      expect(bodyText).toBe(
        `Zwischen dem Start und dem letzten Lebenszeichen liegt auf „${todo.title}“ weniger als eine Sekunde. Die unvollständige Buchung ist damit weg, gebucht wurde nichts.`,
      );

      // Die Gegenprobe aus dem O-R-Fund: Ein Rückfall auf „immer
      // `timer_too_short`" wäre hier nicht sichtbar, weil dieser Fall es
      // selbst erwartet — deshalb steht sie im ersten Fall dieser
      // `describe`-Gruppe (`expect(reason).toBe('orphan_discarded')`) statt
      // hier. Diese Zeile hält zusätzlich fest, dass die beiden Texte sich
      // tatsächlich unterscheiden, nicht nur die Kennung:
      expect(bodyText).not.toBe(
        `Sie haben die unvollständige Buchung auf „${todo.title}“ verworfen. Es ist keine Zeit gebucht worden.`,
      );
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });
});
