/**
 * TP-VER-10 bis TP-VER-13 (`docs/testplan.md` Abschnitt 24) — T-142.
 *
 * Was nur im Browser messbar ist: der Dialog selbst (Text, Vorauswahl,
 * Fokus), „Überspringen" über einen echten Neustart des Dienstes hinweg
 * (R-20), und „Installieren" als reines Öffnen ohne jeden zweiten Weg
 * (A-18.8, A-18.9). Die Ordnung der Fassungen (`TP-VER-15` bis `-23`) und die
 * Netzfälle (`TP-VER-01` bis `-07`, `-25`, `-26`) sind Einheiten- und
 * Integrationsprüfungen und liegen in T-140 (`packages/domain/test/version
 * .test.ts`, `apps/local-api/test/version/**`) — hier nicht verdoppelt.
 *
 * Läuft gegen `version-check-entry.ts` (nicht `apps/local-api/src/index.ts`)
 * über eine echte, im Testlauf umkonfigurierbare GitHub-Releases-Attrappe
 * (`support/github-releases-stub.ts`) — die Naht liegt im Zusammenbau
 * (`compose({ releaseSource })`, E-066 Punkt 1), nicht in einer Adresse, die
 * von außen verlegt wird. Eigene Ausführungskonfiguration:
 *
 *   pnpm exec playwright test -c tests/e2e/playwright.version-check.config.ts
 *
 * Alle vier Fälle laufen als **eine** zusammenhängende Erzählung
 * (`test.describe.serial`), weil `TP-VER-11` und `TP-VER-12` genau das von
 * `TP-VER-10` fortsetzen, was dort offen bleibt (die übersprungene Fassung),
 * und `TP-VER-13` die zweite, höhere Fassung aus `TP-VER-12` braucht. Ein
 * einzelner Fall dieser Datei lässt sich deshalb nicht isoliert lesen, ohne
 * die anderen drei — das ist beabsichtigt und keine versteckte Kopplung: Ein
 * Neustart des Dienstes ist teuer (der unveränderte Zehn-Sekunden-Takt aus
 * `version/checker.ts`), und vier unabhängige Neustart-Ketten hätten nur
 * dieselbe Aussage viermal so langsam gemessen.
 *
 * Seit T-166 (E-077) trägt diese Datei zusätzlich einen **fünften**, davon
 * unabhängigen `describe`-Block mit eigenem Dienst und eigener Attrappe: die
 * Gegenprobe, dass `installShellShim` ohne `installedVersion` den Dialog
 * nicht mehr auslöst, obwohl der Dienst tatsächlich eine neuere Fassung
 * kennt. Begründung an Ort und Stelle.
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';

import { installShellShim, type ShellShimArgs } from './support/shell-shim';
import { SESSION_SECRET, TOKEN_HEADER } from './support/session';
import { startGithubReleasesStub, type GithubReleasesStub } from './support/github-releases-stub';
import {
  startVersionCheckService,
  stopVersionCheckService,
  waitForKnownVersionCheckState,
  VERSION_CHECK_API_BASE_URL,
} from './support/version-check-services';

/** Erfundene installierte Fassung — niedriger als jede Attrappen-Antwort unten. */
const INSTALLED_VERSION = '1.0.0';
const FIRST_RELEASE = '9.9.9';
/** Bewusst derselbe Ziffernlängen-Fall wie `TP-VER-15`/`-19`, hier zusätzlich im Browser. */
const SECOND_RELEASE = '9.10.0';
const RELEASE_URL_PREFIX = 'https://github.com/KuyomieKurama/SuperTakt/releases/tag/v';

function shimArgs(): ShellShimArgs {
  return {
    baseUrl: VERSION_CHECK_API_BASE_URL,
    headerName: TOKEN_HEADER,
    secret: SESSION_SECRET,
    // Erfundene Testkennung, dieselbe Konvention wie in den übrigen
    // Hüllen-Nachbildungen dieses Verzeichnisses — keine echte Windows-Kennung.
    osUser: { name: 'e2e.versionscheck', qualified_name: null, source: 'e2e-fixture', trusted: false },
    // `service_exit: null` — sonst blendet `App.tsx` (`shell?.serviceExit == null`)
    // `UpdateNotice` grundsätzlich aus, unabhängig vom hier geprüften Verhalten.
    shellState: { directory: null, problems: [], service_exit: null },
    quit: 'resolve',
    installedVersion: INSTALLED_VERSION,
  };
}

async function openApp(page: Page): Promise<void> {
  await page.addInitScript(installShellShim, shimArgs());
  await page.goto('/#/');
  // Wartemarke „Anwendung geladen" — dieselbe wie in `todo-revival.spec.ts`
  // u. a.: Ohne sie könnte eine Abwesenheitsprüfung unten fälschlich bestehen,
  // nur weil die Seite noch lädt und nicht, weil tatsächlich nichts erscheint.
  await expect(page.locator('#inhalt')).toBeVisible();
}

function updateDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Eine neuere Fassung von Takt ist verfügbar' });
}

async function expectDialogFacts(page: Page, available: string): Promise<void> {
  const dialog = updateDialog(page);
  await expect(dialog).toBeVisible();
  const values = dialog.locator('.facts dd');
  await expect(values.nth(0)).toHaveText(INSTALLED_VERSION);
  await expect(values.nth(1)).toHaveText(available);
  await expect(values.nth(2)).toHaveText(`${RELEASE_URL_PREFIX}${available}`);
}

test.describe.serial('TP-VER-10 bis TP-VER-13 — Versionsprüfung im Browser', () => {
  let stub: GithubReleasesStub;
  let service: ChildProcessWithoutNullStreams;

  test.beforeAll(async () => {
    stub = await startGithubReleasesStub();
    stub.setRelease(FIRST_RELEASE);
    service = await startVersionCheckService(stub.url, true);
    await waitForKnownVersionCheckState(25_000);
  });

  test.afterAll(async () => {
    await stopVersionCheckService(service);
    await stub.close();
  });

  test('TP-VER-10 — der Dialog nennt installierte und verfügbare Fassung sowie den Verweis, ohne Vorauswahl (A-18.6, A-18.7)', async ({
    page,
  }) => {
    await openApp(page);
    const dialog = updateDialog(page);
    await expectDialogFacts(page, FIRST_RELEASE);

    // A-18.7 wörtlich: „Es gibt keine Vorauswahl, die eine der beiden
    // Antworten für ihn trifft." Geprüft an zwei unabhängigen Signalen, nicht
    // an einem: derselben Knopfgestalt **und** dem Fokusziel.
    const installButton = dialog.getByRole('button', { name: 'Installieren' });
    const skipButton = dialog.getByRole('button', { name: 'Überspringen' });
    await expect(installButton).toBeVisible();
    await expect(skipButton).toBeVisible();
    const installClass = await installButton.getAttribute('class');
    const skipClass = await skipButton.getAttribute('class');
    expect(installClass).not.toBeNull();
    expect(skipClass).not.toBeNull();
    expect(installClass).not.toMatch(/\bprimary\b/);
    expect(skipClass).not.toMatch(/\bprimary\b/);
    // Kein `Enter` auf einem der beiden Knöpfe ist beim Öffnen bereits „die
    // Antwort" — der Fokus liegt auf dem Dialog selbst (`tabIndex={-1}`).
    await expect(dialog).toBeFocused();
  });

  test('TP-VER-11 — „Überspringen" bleibt stumm über geleerten Browserspeicher und einen echten Neustart des Dienstes (A-18.10, R-20)', async ({
    page,
    context,
  }: {
    page: Page;
    context: BrowserContext;
  }) => {
    await openApp(page);
    const dialog = updateDialog(page);
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Überspringen' }).click();
    await expect(dialog).toBeHidden();

    // Stufe 1 — Mindestnachweis: Browserspeicher vollständig leeren, danach
    // neu laden, ohne den Dienst anzufassen. Erscheint der Dialog jetzt
    // wieder, stand „übersprungen" nur im Browserspeicher.
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await context.clearCookies();
    await page.reload();
    await expect(page.locator('#inhalt')).toBeVisible();
    await expect(dialog).toBeHidden();
    // Zusätzlich zur bloßen Abwesenheit: die Route selbst liefert weiterhin
    // dieselbe Fassung — der Dialog fehlt, weil `decideUpdateNotice`
    // „übersprungen" sagt, nicht weil die Prüfung plötzlich nichts mehr weiß.
    const stillKnown = await waitForKnownVersionCheckState(5_000);
    expect(stillKnown.latestVersion).toBe(FIRST_RELEASE);

    // Stufe 2 — starker Nachweis: der Dienst selbst wird beendet und neu
    // gestartet, mit demselben Datenbestand (`resetData: false`). Stand
    // „übersprungen" nur im Arbeitsspeicher des Dienstes, wäre es jetzt weg.
    await stopVersionCheckService(service);
    service = await startVersionCheckService(stub.url, false);
    await waitForKnownVersionCheckState(25_000);

    await page.reload();
    await expect(page.locator('#inhalt')).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('TP-VER-12 — eine später erschienene, höhere Fassung meldet sich trotz Überspringens (A-18.10)', async ({
    page,
  }) => {
    // „Prüfung erneut auslösen" (Testplan-Wortlaut) heißt hier: ein weiterer
    // Neustart des Dienstes — er ist der einzige Auslöser, den E-069 kennt;
    // ein manueller „Jetzt prüfen"-Weg ist nicht Teil der Spezifikation.
    stub.setRelease(SECOND_RELEASE);
    await stopVersionCheckService(service);
    service = await startVersionCheckService(stub.url, false);
    const known = await waitForKnownVersionCheckState(25_000);
    expect(known.latestVersion).toBe(SECOND_RELEASE);

    await openApp(page);
    await expectDialogFacts(page, SECOND_RELEASE);
  });

  test('TP-VER-13 — „Installieren" öffnet die Release-Seite und lädt nichts herunter (A-18.8, A-18.9)', async ({
    page,
    context,
  }: {
    page: Page;
    context: BrowserContext;
  }) => {
    await openApp(page);
    const dialog = updateDialog(page);
    await expectDialogFacts(page, SECOND_RELEASE);

    // Registriert, **bevor** geklickt wird (Testplan-Vorgabe): Ein
    // `download`-Ereignis oder eine neue Seite über die gesamte Interaktion
    // hinweg wäre der Fund, den A-18.9 ausschließt.
    const downloads: string[] = [];
    const newPages: string[] = [];
    context.on('download', (download) => downloads.push(download.url()));
    context.on('page', (opened) => newPages.push(opened.url()));

    await dialog.getByRole('button', { name: 'Installieren' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Die Release-Seite ist im Browser geöffnet.')).toBeVisible();

    // Der eigentliche Nachweis: die Hüllen-Nachbildung hat den Öffnen-Befehl
    // **genau einmal** mit genau dieser Fassungsbezeichnung bekommen — nicht
    // mehr, nicht mit einer Adresse, nicht mit `html_url` aus der Attrappe.
    const calls = await page.evaluate(() => window.__taktOpenReleaseCalls__ ?? []);
    expect(calls).toEqual([{ version: SECOND_RELEASE }]);

    // Gegenprobe innerhalb des von Playwright kontrollierten Kontexts: Die
    // eigentliche Öffnung geht — korrekt — an der Webview-Ebene vorbei über
    // die Hülle; hier darf innerhalb des Webviews zusätzlich nichts passiert
    // sein.
    expect(downloads).toEqual([]);
    expect(newPages).toEqual([]);
  });
});

/**
 * E-077, T-166 — Gegenprobe in beide Richtungen zur umgedrehten Vorgabe von
 * `installShellShim`s `installedVersion`.
 *
 * Richtung (a), „mit ausdrücklich gesetzter älterer Fassung erscheint der
 * Dialog", ist bereits `TP-VER-10` oben: `INSTALLED_VERSION` (`1.0.0`) ist
 * ausdrücklich niedriger als `FIRST_RELEASE`, und der Dialog erscheint.
 *
 * Richtung (b) steht hier, in einem **eigenen** Zusammenhang mit eigenem
 * Dienst und eigener Attrappe (nicht im `describe.serial` oben, um dessen
 * Fassungskette nicht zu stören) — und mit Absicht **nicht** einfach „ohne
 * Netz, also ohne Dialog": Die Vorbedingung unten lässt den Dienst
 * tatsächlich eine höhere Fassung ermitteln (`waitForKnownVersionCheckState`
 * bestätigt `state: "known"`, nicht nur „unknown"). Vor der Umkehr aus E-077
 * hätte genau dieser bekannte Zustand — verglichen mit der alten Vorgabe
 * `"0.0.0"` — den Dialog ausgelöst; das ist derselbe Mechanismus, an dem
 * `shell-quit-failure.spec.ts` und `shell-username-lock.spec.ts` vor T-166
 * zeitabhängig hätten stolpern können (T-150-Funde, dort per Einzelzeile
 * behoben, hier durch die Vorgabe selbst). Ein Fall, der nur zeigt „kein
 * Dialog, weil der Dienst nichts weiß", würde nichts über die neue Vorgabe
 * aussagen — deshalb die ausdrückliche Prüfung auf `state: "known"` unten,
 * **bevor** die Seite überhaupt geöffnet wird.
 */
test.describe('E-077 — ohne installedVersion bleibt der Dialog aus, obwohl der Dienst tatsächlich eine neuere Fassung kennt', () => {
  let stub: GithubReleasesStub;
  let service: ChildProcessWithoutNullStreams;

  test.beforeAll(async () => {
    stub = await startGithubReleasesStub();
    stub.setRelease(FIRST_RELEASE);
    service = await startVersionCheckService(stub.url, true);
    // Vorbedingung, nicht Nebensache: Ohne diese Bestätigung könnte der Fall
    // unten grün sein, weil die Prüfung noch gar nichts weiß — und genau das
    // würde nichts messen (Aufgabenstellung T-166).
    const known = await waitForKnownVersionCheckState(25_000);
    expect(known.latestVersion).toBe(FIRST_RELEASE);
  });

  test.afterAll(async () => {
    await stopVersionCheckService(service);
    await stub.close();
  });

  test('Gegenprobe: kein `installedVersion` angegeben, der Dienst kennt `9.9.9` — der Dialog bleibt aus', async ({
    page,
  }) => {
    const args: ShellShimArgs = {
      baseUrl: VERSION_CHECK_API_BASE_URL,
      headerName: TOKEN_HEADER,
      secret: SESSION_SECRET,
      osUser: { name: 'e2e.versionscheck.vorgabe', qualified_name: null, source: 'e2e-fixture', trusted: false },
      shellState: { directory: null, problems: [], service_exit: null },
      quit: 'resolve',
      // Bewusst KEINE `installedVersion` — das ist genau die Vorgabe, die
      // E-077 umdreht.
    };
    await page.addInitScript(installShellShim, args);
    // `expect(...).toBeHidden()` kehrt zurück, sobald die Bedingung wahr ist
    // — auch sofort, bevor `useUpdateNotice` überhaupt geladen hat. Ohne
    // Weiteres wäre diese Zeile deshalb **immer** grün, unabhängig von der
    // Vorgabe (genau die Falle aus der Aufgabenstellung: „ein Fall, der nur
    // grün ist, weil er nie hinschaut, misst nichts"). Deshalb wird zuerst
    // auf die tatsächliche Antwort von `GET /version-check` gewartet …
    const versionCheckResponse = page.waitForResponse(
      (response) => response.url().includes('/version-check') && response.request().method() === 'GET',
    );
    await page.goto('/#/');
    await expect(page.locator('#inhalt')).toBeVisible();
    await versionCheckResponse;
    // … und danach auf zwei Bildwechsel, damit Reacts Zustandsaktualisierung
    // aus der aufgelösten Zusage tatsächlich im DOM angekommen ist, bevor
    // geprüft wird. Gemessen (T-166): Ohne diese zwei Schritte bleibt dieser
    // Fall auch mit der **alten** Vorgabe `"0.0.0"` grün — mit ihnen wird er
    // dort rot, wie es die Gegenprobe verlangt.
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    await expect(updateDialog(page)).toBeHidden();
  });
});
