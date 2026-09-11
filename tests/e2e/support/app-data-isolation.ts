/**
 * Takt — Ablageort der Anwendungsdaten für die E2E-Stützen umlenken (A-A-72,
 * T-247-5, zweite Hälfte).
 *
 * ===========================================================================
 * Warum es diese Datei gibt
 * ===========================================================================
 *
 * `services.ts#spawnLocalApi` und `version-check-services.ts
 * #startVersionCheckService` starteten den echten lokalen Dienst als
 * Kindprozess und lenkten seinen Bestand bis hierhin über **nur
 * `XDG_DATA_HOME`** um. `apps/local-api/src/access/paths.ts` kennt aber zwei
 * Regeln, nicht eine:
 *
 *   win32   `%LOCALAPPDATA%\Takt`   — `XDG_DATA_HOME` wird dort **nicht**
 *                                     gelesen, ausdrücklich nicht (R-13)
 *   sonst   `$XDG_DATA_HOME/takt`
 *
 * Unter Windows lief die Umlenkung damit ins Leere, und die Läufe trafen das
 * **echte** `%LOCALAPPDATA%\Takt` des angemeldeten Kontos: dieselbe
 * Datenbank, dieselbe Tokendatei. Gemessene Folgen sind eingetreten — fünf
 * Prüf-Todos im Bestand des Benutzers und eine rotierte Tokengeneration.
 *
 * Dieselbe Regel steht seit T-247-4 bereits einmal für die sechs
 * Nachweisläufe unter `apps/local-api/scripts/` in
 * `apps/local-api/scripts/proof-appdata.mjs` und seit T-075 ein drittes Mal
 * in `apps/desktop/scripts/verify-sidecar.mjs`. Diese Datei ist eine
 * **bewusste Kopie** von `proof-appdata.mjs` für die Testfläche, keine
 * Abhängigkeit auf `apps/local-api/**` — CLAUDE.md weist `tests/e2e/**`
 * dem e2e-tester zu und `apps/local-api/**` dem domain-dev, eine
 * Paketkante zwischen beiden wäre teurer als eine kurze, begründete
 * Wiederholung derselben zwölf Zeilen Fachlogik. **Die Regel steht damit an
 * vier Stellen** (`paths.ts`, `proof-appdata.mjs`, `verify-sidecar.mjs`,
 * diese Datei), und nichts mißt bisher, daß alle vier übereinstimmen — ein
 * bekanntes, aufgeschriebenes Risiko, kein Versehen.
 *
 * ===========================================================================
 * Fail-closed
 * ===========================================================================
 *
 * Eine Umlenkung, die man setzen *kann*, wird irgendwann nicht gesetzt. Darum
 * prüft {@link assertIsolatedAppData} vor jedem Start, wohin der Kindprozess
 * tatsächlich schreiben würde, und **bricht ab**, wenn das Ziel das echte
 * Anwendungsdatenverzeichnis ist, es enthält oder darin liegt — und ebenso,
 * wenn es außerhalb des Wegwerfbereichs des Betriebssystems liegt. Ein
 * E2E-Lauf, der im Zweifel den Bestand des Benutzers anfaßt, ist schlimmer
 * als einer, der nicht läuft.
 */

import { realpathSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

/**
 * Welche Umgebungsvariable der Dienst auf dieser Plattform liest und wie der
 * Ordner heißt, den er darunter anlegt — beides aus `access/paths.ts`.
 */
export const APP_DATA = Object.freeze(
  process.platform === 'win32'
    ? { variable: 'LOCALAPPDATA', folder: 'Takt' }
    : { variable: 'XDG_DATA_HOME', folder: 'takt' },
);

/**
 * Der Ordner, den der Dienst unter einem umgelenkten Ablageort anlegt.
 *
 * Stützen, die in das Verzeichnis hineinsehen — die Datenbankdatei
 * (`db.ts`), die Anhangsdateien (`attachment-persistence-live.spec.ts`), die
 * `timer_idle`-Tabelle (`idle-recovery.spec.ts`) —, müssen denselben Namen
 * benutzen wie der Dienst. Unter Windows ist er groß geschrieben.
 */
export function appDataDirIn(dataHome: string): string {
  return join(dataHome, APP_DATA.folder);
}

/**
 * Pfad in eine vergleichbare Form bringen.
 *
 * Aufgelöst wird der **tiefste vorhandene** Vorfahre; der Rest wird wieder
 * angehängt. Das ist nötig, weil die Pfade, die hier verglichen werden, teils
 * noch nicht existieren — den Ordner unter dem Wegwerfort legt erst der
 * Dienst an. Ein `realpath` allein schlüge dort fehl und ließe eine Kurzform
 * wie `C:\Users\RUNNER~1` oder ein `/var/folders` von macOS unaufgelöst
 * stehen, während die Gegenseite aufgelöst wäre — die Prüfung verglich dann
 * zwei Schreibweisen desselben Ortes und schlüge grundlos an.
 */
function canonical(path: string): string {
  let rest = '';
  let current = resolve(path);
  for (;;) {
    try {
      const real = realpathSync.native(current);
      return rest === '' ? real : join(real, rest);
    } catch {
      const parent = dirname(current);
      if (parent === current) return resolve(path);
      rest = rest === '' ? basename(current) : join(basename(current), rest);
      current = parent;
    }
  }
}

/** Windows und macOS vergleichen Pfade ohne Rücksicht auf Groß-/Kleinschreibung. */
function comparable(path: string): string {
  return process.platform === 'win32' || process.platform === 'darwin'
    ? canonical(path).toLowerCase()
    : canonical(path);
}

function isInside(parent: string, child: string): boolean {
  const step = relative(parent, child);
  return step !== '' && !step.startsWith(`..${sep}`) && step !== '..' && !isAbsolute(step);
}

/**
 * Das echte Anwendungsdatenverzeichnis dieses Kontos — nach denselben Regeln
 * wie `resolveAppDataDir`, aber aus der **unveränderten** Umgebung.
 *
 * `null`, wenn es sich nicht bestimmen läßt. Dann trägt die Prüfung gegen den
 * Wegwerfbereich allein; sie ist die engere von beiden.
 */
export function realAppDataDir(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string | null {
  if (platform === 'win32') {
    const local = env['LOCALAPPDATA'];
    return local === undefined || local.trim() === '' ? null : join(local, 'Takt');
  }
  const xdg = env['XDG_DATA_HOME'];
  if (xdg !== undefined && xdg.trim() !== '') {
    return join(xdg, 'takt');
  }
  const home = homedir();
  return home === null || home.trim() === '' ? null : join(home, '.local', 'share', 'takt');
}

/**
 * Wirft, wenn `dataHome` kein sicherer Wegwerfort ist.
 *
 * Zwei Gründe zum Abbruch, und beide sind Fehler des Laufs, nicht des
 * Produkts:
 *
 *  1. Das Ziel berührt das echte Anwendungsdatenverzeichnis — es ist
 *     dasselbe, liegt darin oder enthält es.
 *  2. Das Ziel liegt außerhalb des Wegwerfbereichs des Betriebssystems. Alle
 *     Läufe legen ihren Ordner unter `os.tmpdir()` an; liegt er woanders,
 *     ist eine Annahme dieses Laufs falsch und Weiterschreiben wäre geraten.
 */
export function assertIsolatedAppData(dataHome: string): void {
  const target = comparable(appDataDirIn(dataHome));
  const real = realAppDataDir();

  if (real !== null) {
    const echt = comparable(real);
    if (target === echt || isInside(echt, target) || isInside(target, echt)) {
      throw new Error(
        `Der E2E-Lauf würde in das echte Anwendungsdatenverzeichnis schreiben (${real}). ` +
          'Abgebrochen, bevor etwas angefaßt wird (A-A-72).',
      );
    }
  }

  const scratch = comparable(tmpdir());
  if (!isInside(scratch, target)) {
    throw new Error(
      `Der Ablageort des E2E-Laufs (${appDataDirIn(dataHome)}) liegt nicht unterhalb von ` +
        `${tmpdir()}. Abgebrochen, bevor etwas angefaßt wird (A-A-72).`,
    );
  }
}

/**
 * Umgebung für den Kindprozess, deren Anwendungsdaten in `dataHome` liegen.
 *
 * Gesetzt werden **beide** Variablen auf denselben Wegwerfort. Der Dienst
 * liest je nach Plattform nur eine davon; die andere kostet nichts und hält
 * die Umlenkung auch dann, wenn die Plattformerkennung hier einmal
 * danebenliegt.
 *
 * Prüft vorher, wohin der Kindprozess schriebe, und wirft bei Zweifel.
 */
export function isolatedAppDataEnv(
  dataHome: string,
  base: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  assertIsolatedAppData(dataHome);
  return { ...base, XDG_DATA_HOME: dataHome, LOCALAPPDATA: dataHome };
}
