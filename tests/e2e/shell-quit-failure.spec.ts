/**
 * O-AF (docs/testplan.md, Abschnitt 23) — T-130, Vorlage `reports/T-124-frontend-dev.md` Abschnitt 3.
 *
 * „Takt beenden" scheitert nicht mehr stumm. Der Erfolgsfall dieses Knopfes
 * ist der Tod des eigenen Prozesses: `takt_quit` ruft `app.exit(0)`, und die
 * Zusage aus `invoke` kommt danach nie mehr an — deshalb steht in
 * `useQuitAttempt` (`apps/web/src/components/ShellStatus.tsx`) eine Frist von
 * fünf Sekunden (`QUIT_GRACE_MS`) und kein `catch` allein. Läuft die Frist ab,
 * ohne dass der Prozess geendet hat, zeigt `.quitfail` zwei Handlungsschritte,
 * die **jeder** Benutzer gehen kann — Fenster schließen, sonst Task-Manager —
 * und **nicht** „Systembetreuung" (F-15): Wer allein mit Takt arbeitet, hat
 * keine, und ein Fenster zu schließen ist nichts, wofür man jemanden anrufen
 * müsste.
 *
 * Dieser Fall braucht ein Ereignis (Klick) und eine Zeit (die Frist) und
 * gehört deshalb nach E-062 dem e2e-tester — auf der Musterseite ist er nicht
 * auslösbar (T-124, Abschnitt 5, „Was ich nicht im Browser gemessen habe").
 *
 * Die Sperrmeldung zum Dienstausfall (`ServiceStoppedOverlay`) ist die
 * einfachste der drei Flächen, an denen `QuitButton` steht (Startmeldung,
 * Sperrmeldung, Meldung zum Benutzernamen) — hier reicht eine Hüllen-
 * Nachbildung mit `service_exit` gesetzt, ohne die Zusatzlage des
 * Benutzernamen-Befunds (die deckt `shell-username-lock.spec.ts` ab).
 */
import { test, expect } from '@playwright/test';

import { installShellShim, type ShellShimArgs } from './support/shell-shim';
import { API_BASE_URL, SESSION_SECRET, TOKEN_HEADER } from './support/session';

const SHIM_ARGS: ShellShimArgs = {
  baseUrl: API_BASE_URL,
  headerName: TOKEN_HEADER,
  secret: SESSION_SECRET,
  // Ein unauffälliger Name — dieser Fall prüft O-AF, nicht O-AJ.
  osUser: { name: 'e2e.testkonto', qualified_name: null, source: 'e2e-fixture', trusted: false },
  shellState: {
    directory: null,
    problems: [],
    service_exit: {
      code: 1,
      message: 'E2E-Testfall: Der lokale Dienst wurde absichtlich als beendet gemeldet.',
      detail: null,
    },
  },
  // Die Zusage kommt nie an — genau der Fall, den die Frist behandelt.
  quit: 'hang',
  // Kein `installedVersion` mehr nötig (E-077, T-166): Die Vorgabe von
  // `installShellShim` ist umgedreht und löst ohne ausdrückliche Angabe
  // nie mehr den Versionsdialog aus. Die Zeile, die T-150 hier gegen den
  // damals zeitabhängigen Fehlschlag gesetzt hatte, war der Verband, nicht
  // die Heilung — siehe `shell-shim.ts`, `installedVersion`.
};

test.describe('O-AF — „Takt beenden" scheitert nicht mehr stumm', () => {
  test('fünf Sekunden ohne Rückmeldung zeigen die Ausweichauskunft, ohne auf die Systembetreuung zu verweisen', async ({
    page,
  }) => {
    await page.clock.install();
    await page.addInitScript(installShellShim, SHIM_ARGS);

    await page.goto('/#/');

    const dialog = page.getByRole('alertdialog', { name: 'Takt kann im Moment nichts speichern' });
    await expect(dialog).toBeVisible();

    const quitButton = dialog.getByRole('button', { name: 'Takt beenden' });
    await expect(quitButton).toBeVisible();
    await quitButton.click();

    // Sichtbare Rückmeldung, solange die Zusage aussteht.
    await expect(dialog.getByRole('button', { name: 'Takt wird beendet …' })).toBeVisible();
    await expect(page.locator('.quitfail')).toBeHidden();

    await page.clock.fastForward('00:06');

    const failure = page.locator('.quitfail');
    await expect(failure).toBeVisible();
    await expect(failure.locator('.quitfail__title')).toContainText('Takt ließ sich so nicht beenden');
    // Kein erfundener Grund: `cause` ist `null`, weil nur die Frist ablief,
    // die Zusage selbst wurde nicht abgewiesen.
    await expect(failure.locator('.quitfail__body')).toHaveText(
      'Der Beenden-Befehl hat nicht gewirkt: Das Fenster steht noch.',
    );

    const steps = failure.locator('.quitfail__steps li');
    await expect(steps).toHaveCount(2);
    await expect(steps.nth(0)).toContainText('Kreuz');
    await expect(steps.nth(0)).toContainText('Alt+F4');
    await expect(steps.nth(1)).toContainText('Strg+Umschalt+Esc');
    await expect(steps.nth(1)).toContainText('Task-Manager');

    // Die Live-Region steht dauerhaft da (leer, bis es etwas zu sagen gibt) —
    // hier, nach dem Fehlschlag, füllt sie sich mit genau diesem Inhalt.
    await expect(page.locator('[role="status"].quitfail__region')).toContainText(
      'Takt ließ sich so nicht beenden',
    );

    // F-15: kein Verweis auf eine Systembetreuung, die ein allein arbeitender
    // Benutzer gar nicht hat.
    const failureText = await failure.innerText();
    expect(failureText).not.toContain('Systembetreuung');

    // Der Knopf bleibt bedienbar (nicht dauerhaft gesperrt) — Text und
    // Zustand sind wieder die des Ausgangspunkts.
    await expect(quitButton).toHaveText('Takt beenden');
    await expect(quitButton).toBeEnabled();
  });
});
