/**
 * O-AJ (docs/testplan.md, Abschnitt 23) — T-130, Vorlage `reports/T-124-frontend-dev.md` Abschnitt 2.
 *
 * Der Windows-Name, den niemand ändern kann. Trägt er ein bidirektionales
 * Formatierungszeichen (hier: U+200F, RLM — kein echter Benutzername, frei
 * erfunden), kann der lokale Dienst nicht laufen: Der Wert geht unverändert
 * als `WindowsUser` in jede Exportdatei (E-010, A-8.5), und ein
 * Richtungszeichen darin stellt die Zeile um, in der es steht (T-122).
 *
 * `apps/web/src/app/connection.ts#readUserNameFinding()` fragt dazu **eine**
 * eigene Frage an die Hülle (`osUser()`, `takt_os_user`) — unabhängig davon,
 * ob der Sidecar selbst gestartet ist oder nicht. Genau deshalb deckt dieser
 * Befund **beide** Startwege ab, die T-124 (Abschnitt 2) unterscheidet:
 *
 *   Fall 1 — C0/C1-Steuerzeichen: `handshake_line` (`sidecar.rs`) fängt sie
 *            vor dem Start ab, der Sidecar startet gar nicht, `serviceExit`
 *            bleibt leer.
 *   Fall 2 — Richtungszeichen (dieser Fall, U+200F): `char::is_control()`
 *            kennt sie nicht, der Sidecar startet, weist den Namen erst an
 *            seiner eigenen Tür ab (`user_invalid`) und endet mit Code 78 —
 *            `serviceExit` ist danach gesetzt.
 *
 * `ShellStatus.tsx` (Abschnitt „Zusammenstellung") prüft `userName ===
 * "forbidden_characters"` **vor** `state.serviceExit !== null`: Die Meldung
 * zum Benutzernamen ist die Ursache und kein zweiter Zustand daneben, und sie
 * muss deshalb in beiden Fällen gewinnen. Von außen (ohne `apps/desktop`
 * anzufassen, das nicht meine Hoheit ist) heißt das: dieselbe Sperrmeldung bei
 * `service_exit: null` **und** bei `service_exit` gesetzt.
 */
import { test, expect } from '@playwright/test';

import { installShellShim, type ShellShimArgs } from './support/shell-shim';
import { API_BASE_URL, SESSION_SECRET, TOKEN_HEADER } from './support/session';

/**
 * Erfundener Windows-Anmeldename mit eingebettetem RLM (U+200F) — kein echter
 * Benutzername. Als Escape-Folge geschrieben und nicht als rohes Zeichen im
 * Quelltext (`packages/domain/src/characters.ts`, „Warum Codepunkte und kein
 * regulärer Ausdruck", Punkt 2): ein rohes Richtungszeichen im Quelltext
 * würde ausgerechnet die Zeile umdrehen, die es beschreibt.
 */
const RLM = '\u200f';
const FORBIDDEN_USER_NAME = `e2e.te${RLM}st`;
const VISIBLE_IF_LEAKED = 'e2e.test';

function shimArgs(
  serviceExit: ShellShimArgs['shellState']['service_exit'],
): ShellShimArgs {
  return {
    baseUrl: API_BASE_URL,
    headerName: TOKEN_HEADER,
    secret: SESSION_SECRET,
    osUser: {
      name: FORBIDDEN_USER_NAME,
      qualified_name: null,
      source: 'e2e-fixture',
      trusted: true,
    },
    shellState: {
      directory: {
        path: '/e2e/fixture/takt',
        permissions_applied: true,
        permissions_detail: '0700',
        sync_warning: null,
        sync_detail: null,
      },
      problems: [],
      service_exit: serviceExit,
    },
    quit: 'resolve',
    // Kein `installedVersion` mehr nötig (E-077, T-166): siehe Begründung in
    // `shell-quit-failure.spec.ts` — die Vorgabe von `installShellShim` löst
    // ohne ausdrückliche Angabe nie mehr den Versionsdialog aus.
  };
}

const START_PATHS: readonly {
  readonly label: string;
  readonly serviceExit: ShellShimArgs['shellState']['service_exit'];
}[] = [
  {
    label: 'ohne serviceExit (Fall 1: Steuerzeichen fangen die Hülle vor dem Start ab)',
    serviceExit: null,
  },
  {
    label: 'mit serviceExit (Fall 2: der Dienst startet, weist den Namen erst an seiner Tür ab, Code 78)',
    serviceExit: {
      code: 78,
      message: 'E2E-Testfall: Der lokale Dienst hat den Start abgelehnt.',
      detail: 'user_invalid',
    },
  },
];

test.describe('O-AJ — Windows-Benutzername mit Richtungszeichen sperrt Takt', () => {
  for (const { label, serviceExit } of START_PATHS) {
    test(`Sperrmeldung erscheint ${label}`, async ({ page }) => {
      await page.addInitScript(installShellShim, shimArgs(serviceExit));
      await page.goto('/#/');

      const dialog = page.getByRole('alertdialog', {
        name: 'Takt kann unter diesem Windows-Benutzernamen nicht arbeiten',
      });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');

      // Die Sperrmeldung zum Dienstausfall bleibt aus — die Ursache hat
      // Vorrang vor dem zweiten Zustand (`ShellStatus.tsx`, „Zusammenstellung").
      await expect(page.getByRole('alertdialog', { name: 'Takt kann im Moment nichts speichern' })).toHaveCount(
        0,
      );

      // Fokus liegt nach dem Öffnen auf dem einzigen Knopf (`focusFirstWithin`).
      const quitButton = dialog.getByRole('button', { name: 'Takt beenden' });
      await expect(quitButton).toBeFocused();

      // Tab hält den Fokus im Dialog (`keepTabInside`, SC 2.4.3) — mit genau
      // einem Fokusziel bleibt er in beide Richtungen auf sich selbst stehen.
      await page.keyboard.press('Tab');
      await expect(quitButton).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(quitButton).toBeFocused();

      // Kein Element im Dialog trägt den Namen — er wird beschrieben, nicht
      // angezeigt (B-4.3 Punkt 5, Regel 1 im Kopf von `ShellStatus.tsx`).
      const dialogText = await dialog.innerText();
      expect(dialogText).not.toContain(FORBIDDEN_USER_NAME);
      expect(dialogText).not.toContain(VISIBLE_IF_LEAKED);

      // Die Auskunft nennt zwei Wege, die jeder Benutzer gehen kann (F-15) —
      // die Weitergabe an die Systembetreuung steht daneben, nicht an ihrer
      // Stelle.
      await expect(dialog).toContainText('unter einem anderen Windows-Konto');
      await expect(dialog).toContainText('Anmeldenamen dieses Kontos ändern');
      await expect(dialog).toContainText('Systembetreuung');
    });
  }
});
