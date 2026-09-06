/**
 * TP-BUILD-01/02/05 (docs/testplan.md, Abschnitt 15) — T-055, T-060.
 *
 * Miss, ob die aus T-053 bekannte Lücke ("jeder Nachweis läuft aus dem
 * Quelltext") auch für `apps/web` klafft. Läuft — anders als jede andere
 * Datei in diesem Ordner — nicht gegen `tests/e2e/playwright.config.ts`,
 * sondern gegen `tests/e2e/playwright.web-build.config.ts`: `vite build` statt
 * `vite`, `vite preview` statt Entwicklungsserver.
 *
 * Drei Fälle:
 *
 *  - TP-BUILD-01: ohne Hülle — das ist der Fall, den jeder Browser sieht, der
 *    diese Adresse ohne Tauri öffnet. `import.meta.env.DEV` ist im Bündel auf
 *    `false` festgeschrieben (`connection.ts#developmentFallback`), der
 *    Umweg über `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN`, den der
 *    Entwicklungsserver-Lauf benutzt, wirkt hier nicht mehr. Die Frage ist
 *    nicht "verbindet es sich", sondern "stürzt es ab oder erklärt es sich" —
 *    siehe Auftrag: "Wenn nichts bricht, ist das ein wertvolles Ergebnis."
 *  - TP-BUILD-02: mit einer nachgebildeten Hülle (`support/tauri-shim.ts`) —
 *    derselbe Ablauf wie `todo-revival.spec.ts`, Startpunkt S-03, diesmal
 *    gegen das tatsächliche `vite build`-Ergebnis statt gegen den
 *    Entwicklungsserver. Das ist der im Auftrag verlangte "Teil deiner
 *    Fälle", nicht ein neuer Ablauf.
 *  - TP-BUILD-05 (neu, T-060): die Musterseite des Designsystems ist im
 *    ausgelieferten Bündel nicht erreichbar. Siehe unten für die Begründung —
 *    das ist der eigentliche Fund dieser Aufgabe, nicht TP-BUILD-01/02.
 *
 * Alle drei Fälle laufen gegen denselben echten lokalen Dienst aus dem
 * Quelltext wie jede andere Datei hier — der Dienst ist nicht der
 * Prüfgegenstand dieser Datei (das war T-053), das Bündel ist es.
 *
 * ---
 *
 * **T-060 — warum TP-BUILD-01 sich geändert hat, und warum das nicht
 * derselbe Fund wie unten ist.**
 *
 * Bis T-057 stand hier ein Klick auf „Designsystem ansehen" in
 * `NoShellNotice` und eine Erwartung von `.designsystem-frame`. T-057 hat
 * genau diesen Weg auf Auftrag des Auftraggebers geschlossen: kein
 * Navigationspunkt, keine Route, kein Knopf mehr — die Musterseite hat einen
 * eigenen Einstiegspunkt (`src/designsystem.tsx`), der im ausgelieferten
 * Bündel gar nicht erst entsteht. Ein Test, der genau diesen Weg noch
 * anspricht, hätte den Fall nie wieder bestehen können, ohne dass das etwas
 * über das Bündel aussagt — er wäre am Fehlen eines abgeschafften Knopfs
 * gescheitert, nicht an einem gebrochenen Bau. Der Knopf war hier ohnehin nie
 * das Ziel: TP-BUILD-01 sollte belegen, dass das Bündel lädt und läuft, statt
 * abzustürzen oder leer zu bleiben — die Musterseite war nur der bequeme,
 * jederzeit klickbare Griff dafür, bevor es einen anderen gab.
 *
 * Ersetzt durch zwei von der Musterseite unabhängige Belege (Vorschlag aus
 * `.claude/team/reports/T-057-frontend-dev.md`, Abweichung 1, hier
 * übernommen):
 *
 *  1. `.boot` trägt tatsächlich `display: flex` — eine Behauptung über die
 *     geladenen Stile. Ein Bündel, dessen CSS nicht geladen hätte, zeigte
 *     hier den Browser-Vorgabewert `block`.
 *  2. Ein Wechsel auf eine unbekannte Adresse (`#/kaputte-adresse`) bricht
 *     nichts. `router.ts#parseRoute` fängt einen unbekannten `head` mit
 *     einem Rückfall auf die Startroute ab (`default: return {
 *     ...DEFAULT_ROUTE }`); das ist genau der Code, der bricht, wenn eine
 *     Minimierung ihn falsch wegkürzt. Sichtbar wird das nicht am Inhalt
 *     (`NoShellNotice` ignoriert die Route ohnehin — siehe `App.tsx`), aber
 *     sehr wohl daran, ob die Seite überhaupt noch antwortet: kein
 *     `pageerror`, keine leere Seite, dieselbe Überschrift wie zuvor.
 *
 * Das ist **derselbe Prüfgegenstand** wie vorher (lädt das Bündel, funktioniert
 * das Routing im minimierten Code), nur ohne einen Weg zu benutzen, der laut
 * Auftrag nicht mehr existieren soll.
 *
 * ---
 *
 * **T-060 — TP-BUILD-05: die eigentliche Anforderung, bisher ungeprüft.**
 *
 * Der Auftraggeber wollte nicht nur einen Klick weniger — er wollte, dass die
 * Musterseite über die normale Anwendung **nicht erreichbar** ist. Das ist
 * das Gegenteil von TP-BUILD-01s altem Weg (der bewies, dass man *hinkommt*)
 * und stand bisher in keinem Testfall. `apps/web/vite.config.ts` behauptet,
 * `designsystem.html` entstehe im Bau nur mit `TAKT_DESIGNSYSTEM=1` gesetzt —
 * eine Behauptung aus dem Quelltext, keine Messung am Bauergebnis. Gemessen,
 * nicht geglaubt (Beleg unten bei den Testfällen):
 *
 *  - `vite preview` antwortet auf **jede** unbekannte Adresse mit `200` und
 *    dem Inhalt von `index.html` — auch auf `/designsystem.html`, auch auf
 *    Pfade mit `.js`-Endung. Sirvs SPA-Rückfall wertet die Dateiendung nicht
 *    aus (selbst nachgemessen: `GET /keine-solche-datei.js` → `200`,
 *    `text/html`, Inhalt von `index.html`). Ein Test, der hier nur den
 *    Statuscode prüft, hätte nichts bewiesen — er wäre immer grün, ob die
 *    Musterseite existiert oder nicht.
 *  - Deshalb prüft der Fall unten den tatsächlichen **Inhalt**: Im Browser
 *    geöffnet zeigt `/designsystem.html` dieselbe `NoShellNotice` wie `/`,
 *    nicht die Musterseite; über `request` verglichen sind beide Antworten
 *    byteidentisch; im Bauergebnis selbst fehlt sowohl die Datei als auch
 *    jede Zeichenkette aus dem Showcase-Code.
 *  - Und die Gegenprobe, die die eigentliche Ursache statt eines Zufalls
 *    belegt: derselbe Bau mit `TAKT_DESIGNSYSTEM=1` erzeugt die Datei
 *    tatsächlich (`pnpm --filter @takt/web build:designsystem`, die
 *    dokumentierte Abnahme-Variante aus T-057) — und der nächste gewöhnliche
 *    Bau lässt sie danach wieder verschwinden.
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { cleanupAnyTimer, createTodo } from './support/api';
import { gotoTodo } from './support/nav';
import { WEB_APP_DIST_DIR } from './support/build-check-session';
import { installTauriShim } from './support/tauri-shim';
import { buildWeb, buildWebWithDesignsystem, distContainsText, distHasFile } from './support/web-build-services';

/**
 * Wie `distContainsText` (`web-build-services.ts`), aber ohne
 * Quellkarten (`.map`) — für T-150s Feldbezeichnungs-Mikrofall (A-19.2).
 *
 * Eine Quellkarte trägt zwangsläufig den **Originalquelltext samt
 * Kommentaren** (`sourcesContent`), und genau ein Kommentar zitiert die
 * verbotenen Wörter als Gegenbeispiel — wörtlich, in
 * `TodoFormDialog.tsx`: "Sie heißt in der Oberfläche ausschließlich so —
 * nicht „Fälligkeitsdatum“, nicht „fällig am“, nicht „Deadline“." Ein Treffer
 * dort wäre ein Fund über die eigene Dokumentation dieser Regel, nicht über
 * einen Bruch der Regel selbst — gemessen (nicht vermutet): Ohne diesen
 * Ausschluss schlägt der Fall unten tatsächlich fehl, obwohl die Oberfläche
 * die drei Wörter an keiner sichtbaren Stelle zeigt.
 */
function distContainsRenderedText(needle: string): boolean {
  if (!existsSync(WEB_APP_DIST_DIR)) return false;
  const stack: string[] = [WEB_APP_DIST_DIR];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) continue;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.name.endsWith('.map')) continue;
      if (readFileSync(fullPath, 'utf8').includes(needle)) return true;
    }
  }
  return false;
}

/**
 * Wörtlich aus `apps/web/src/showcase/Showcase.tsx` (`aria-label` der
 * Abschnittsnavigation) — bewusst nicht die ähnliche, aber andere
 * Formulierung „die Musterseite des Designsystems" aus
 * `components/WorkstationFacts.tsx`, die zur eigentlichen Anwendung gehört
 * und im normalen Bündel legitim vorkommt. Eine Suche nach der falschen
 * Zeichenkette hätte hier einen Fehlalarm erzeugt.
 */
const SHOWCASE_MARKER = 'Abschnitte des Designsystems';

const API_BASE_URL = 'http://127.0.0.1:17843/api/v1';
const SESSION_SECRET = 'takt-e2e-erfundenes-sitzungsgeheimnis-2026-08';

test.describe('TP-BUILD-01 — ohne Hülle', () => {
  test('das gebaute Bündel erklärt sich, statt abzustürzen oder leer zu bleiben', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/');

    // Nicht `no_shell` unterstellt — der tatsächliche Text aus
    // `App.tsx#NoShellNotice`, wörtlich. Ein Absturz oder ein leeres
    // Dokument (die T-053-Fehlerklasse: Bündel kommt nicht hoch) zeigte
    // diesen Text nicht.
    await expect(page.getByRole('heading', { name: 'Takt läuft in der Takt-Anwendung' })).toBeVisible();
    await expect(page.getByText('Das ist kein Fehler, sondern die Absicht', { exact: false })).toBeVisible();

    // Beleg 1 (T-060, seit T-057 anstelle des Klicks auf die entfernte
    // Musterseite): Das ausgelieferte CSS ist tatsächlich angewendet, nicht
    // nur mitgeliefert. `.boot` (`styles/app.css`) setzt `display: flex`; der
    // Browser-Vorgabewert für ein `<div>` ist `block` — ein Bündel, dessen
    // Stylesheet nicht geladen hätte, zeigte hier den Vorgabewert.
    await expect(page.locator('.boot')).toHaveCSS('display', 'flex');

    // Beleg 2: ein Wechsel auf eine unbekannte Adresse bricht das Bündel
    // nicht. `router.ts#parseRoute` fällt auf die Startroute zurück
    // (`default: return { ...DEFAULT_ROUTE }`) — das ist der Code, der
    // bräche, würde ihn eine Minimierung falsch wegkürzen. `NoShellNotice`
    // hängt nicht von der Route ab, deshalb bleibt der sichtbare Inhalt
    // gleich; das Ziel ist hier, dass er **überhaupt noch da ist**.
    await page.goto('/#/kaputte-adresse');
    await expect(page.getByRole('heading', { name: 'Takt läuft in der Takt-Anwendung' })).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe('TP-BUILD-05 — Musterseite im Auslieferungsbündel nicht erreichbar (T-060)', () => {
  test('ohne TAKT_DESIGNSYSTEM entsteht keine erreichbare Musterseite', async ({ page, request }) => {
    // Messung 1, am Bauergebnis selbst, ohne Browser: keine Datei, kein
    // Textrest des Showcase-Codes irgendwo im Bündel.
    expect(distHasFile('designsystem.html')).toBe(false);
    expect(distContainsText(SHOWCASE_MARKER)).toBe(false);

    // Messung 2, über HTTP, ohne Browser: `vite preview`s SPA-Rückfall
    // antwortet auf `/designsystem.html` — wie auf jede unbekannte Adresse —
    // mit `200` (nachgemessen, nicht angenommen: die Dateiendung spielt für
    // sirv keine Rolle). Ein bloßer Statuscode bewiese hier nichts; erst der
    // Vergleich mit der echten Startseite zeigt, dass „erreichbar" hier
    // wörtlich „dieselbe Startseite wie überall sonst" bedeutet, nicht die
    // Musterseite.
    const [rootBody, designsystemBody] = await Promise.all([
      request.get('/').then((response) => response.text()),
      request.get('/designsystem.html').then((response) => response.text()),
    ]);
    expect(designsystemBody).toBe(rootBody);
    expect(designsystemBody).not.toContain(SHOWCASE_MARKER);

    // Messung 3, im Browser: Wer die Adresse tatsächlich öffnet, sieht die
    // normale Anwendung (hier: `NoShellNotice`, weil ohne Hülle gestartet),
    // nicht die Musterseite.
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));

    await page.goto('/designsystem.html');
    await expect(page.getByRole('heading', { name: 'Takt läuft in der Takt-Anwendung' })).toBeVisible();
    await expect(page.locator('.showcase')).toHaveCount(0);
    await expect(page.getByLabel(SHOWCASE_MARKER)).toHaveCount(0);

    expect(pageErrors).toEqual([]);
  });

  test('Gegenprobe: mit TAKT_DESIGNSYSTEM=1 entsteht die Datei tatsächlich — und verschwindet mit dem nächsten gewöhnlichen Bau wieder', async () => {
    // Zwei zusätzliche volle Bauläufe (`tsc --noEmit && vite build`, zweimal)
    // — das Standard-Zeitlimit der Datei (60s) reicht dafür nicht.
    test.setTimeout(180_000);

    await buildWebWithDesignsystem();
    try {
      expect(distHasFile('designsystem.html')).toBe(true);
      expect(distContainsText(SHOWCASE_MARKER)).toBe(true);
    } finally {
      // Immer zurück auf den ausgelieferten Zustand, auch wenn die
      // Behauptungen oben scheitern — andere Team-Agenten teilen sich
      // `apps/web/dist`, und die laufende `vite preview` dieser Datei soll
      // danach wieder das Standardbündel ausliefern.
      await buildWeb();
    }
    expect(distHasFile('designsystem.html')).toBe(false);
  });
});

test.describe('Feldbezeichnung "Frist" (A-19.2, Abschnitt 25 Mikrofall, T-150)', () => {
  test('das ausgelieferte Bündel enthält weder "Fälligkeitsdatum" noch "fällig am" noch "Deadline"', () => {
    // Positivliste-Prüfung nach dem Vorbild von `distContainsText` in
    // TP-BUILD-05, hier umgekehrt als Abwesenheitsprüfung: Die Frist heißt in
    // der Oberfläche ausschließlich "Frist" (A-19.2) — nicht
    // "Fälligkeitsdatum", nicht "fällig am", nicht "Deadline". Eine Prüfung
    // im Quelltext genügt nicht, weil ein Bezeichner, eine CSS-Klasse oder ein
    // Kommentar dieselben Wörter tragen könnten, ohne dass sie je auf dem
    // Bildschirm stünden — gemessen wird deshalb am tatsächlich gebauten
    // Bündel, wie bei jedem anderen Fall dieser Datei.
    //
    // Quellkarten (`.map`) sind hier ausdrücklich ausgenommen —
    // {@link distContainsRenderedText}, Begründung dort.
    expect(distContainsRenderedText('Fälligkeitsdatum')).toBe(false);
    expect(distContainsRenderedText('fällig am')).toBe(false);
    expect(distContainsRenderedText('Deadline')).toBe(false);
  });
});

test.describe('TP-BUILD-02 — mit nachgebildeter Hülle', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(installTauriShim, {
      baseUrl: API_BASE_URL,
      headerName: 'X-Takt-Token',
      secret: SESSION_SECRET,
    });
  });

  test.afterEach(async () => {
    await cleanupAnyTimer();
  });

  test('Todo wiederbeleben (Startpunkt S-03) läuft gegen das gebaute Bündel', async ({ page }) => {
    const todo = await createTodo({ title: `E2E-BUILD-REVIVAL-${Date.now()}` });

    const markDone = await fetch(`${API_BASE_URL}/todos/${todo.id}/done`, {
      method: 'PUT',
      headers: { Origin: 'http://127.0.0.1:5173', 'X-Takt-Token': SESSION_SECRET },
    });
    expect(markDone.ok).toBe(true);

    await gotoTodo(page, todo.id);

    // Erreicht diese Zeile, ist die Hülle erkannt worden (sonst stünde hier
    // `NoShellNotice`, nicht die Detailansicht) und `serviceHandshake()` ist
    // über die nachgebildete `invoke`-Funktion tatsächlich durchgelaufen —
    // beides läuft durch denselben, im Bündel minimierten und neu aufgeteilten
    // Code wie im Entwicklungsbetrieb, nur eben nicht mehr im Quelltext.
    await expect(page.locator('.done-switch strong')).toHaveText('Erledigt');

    const main = page.locator('#inhalt');
    await main.getByRole('button', { name: 'Timer starten' }).first().click();
    await expect(main.getByRole('button', { name: 'Timer stoppen' })).toBeVisible();
    await expect(page.locator('.done-switch strong')).toHaveText('Erledigt aufgehoben');

    const afterResponse = await fetch(`${API_BASE_URL}/todos/${todo.id}`, {
      headers: { Origin: 'http://127.0.0.1:5173', 'X-Takt-Token': SESSION_SECRET },
    });
    const envelope = (await afterResponse.json()) as { data: { todo: { completedAt: string | null } } };
    expect(envelope.data.todo.completedAt).toBeNull();

    await main.getByRole('button', { name: 'Timer stoppen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Timer stoppen' });
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.getByRole('button', { name: 'Stoppen und buchen' }).click();
      await expect(dialog).toBeHidden();
    }
  });
});
