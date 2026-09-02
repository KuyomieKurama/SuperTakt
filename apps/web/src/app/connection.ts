/**
 * Takt — der Weg von der Hülle zum lokalen Dienst.
 *
 * Die Oberfläche kennt weder Portnummer noch Nachweis. Beides kommt aus
 * `serviceHandshake()` der Tauri-Hülle und geht unverändert in den
 * API-Zugang (`api/client.ts`). Es wird nirgends gespeichert.
 *
 * ## Warum die Hülle erst zur Laufzeit geladen wird
 *
 * `@takt/desktop/shell` zieht `@tauri-apps/api` nach sich. Bis T-020 stand hier
 * ein reiner Typimport, damit die Musterseite im Browser lief. Jetzt werden die
 * Befehle wirklich gebraucht — also wird das Modul **dynamisch** geladen. Vite
 * legt es in ein eigenes Stück, das ein Browser ohne Hülle nie anfordert, und
 * `isShellAvailable()` bleibt die eine Stelle, die den Unterschied feststellt.
 *
 * ## Ohne Hülle
 *
 * Dann gibt es kein Sitzungsgeheimnis, und ohne Nachweis antwortet der Dienst
 * auf jede Route mit 401 — auch auf `/health`, und das ist Absicht (T-011).
 * Die Anwendung sagt das dann und rät nicht: `kind: "no_shell"`.
 *
 * Für den Entwicklungsbetrieb gibt es eine eng gefasste Ausnahme, siehe
 * `developmentFallback()`.
 */

import type { DirectoryChoice } from "@takt/desktop/shell";
import { setConnection, type Connection } from "../api/client";
import type { ShellStateSnapshot } from "../components/ShellStatus";

/**
 * Das Ergebnis des Ordnerauswahldialogs, unter dem Namen der Hülle.
 *
 * Alias und keine eigene Schnittstelle — dieselbe Begründung wie bei
 * `ShellStateSnapshot`: Ein zweiter Name für dieselbe Sache lädt dazu ein, ihn
 * irgendwann anders zu füllen.
 */
export type ExportDirectoryChoice = DirectoryChoice;

export type ConnectionState =
  | { readonly kind: "connecting" }
  | { readonly kind: "ready"; readonly shell: ShellStateSnapshot | null }
  | { readonly kind: "no_shell" }
  | { readonly kind: "failed"; readonly message: string };

interface ShellModule {
  isShellAvailable(): boolean;
  serviceHandshake(): Promise<Connection>;
  shellState(): Promise<ShellStateSnapshot>;
  quit(): Promise<void>;
  chooseExportDirectory(current: string | null): Promise<ExportDirectoryChoice>;
}

let shellModule: ShellModule | null = null;

async function loadShell(): Promise<ShellModule | null> {
  if (shellModule !== null) return shellModule;
  try {
    const loaded = (await import("@takt/desktop/shell")) as unknown as ShellModule;
    shellModule = loaded;
    return loaded;
  } catch {
    return null;
  }
}

/**
 * Nur im Entwicklungsbetrieb: Grundadresse und Nachweis aus der Umgebung.
 *
 * `import.meta.env.DEV` wird beim Bauen durch `false` ersetzt, der ganze Zweig
 * fällt im Auslieferungsbündel weg. Ein Nachweis, der über eine
 * Umgebungsvariable hereinkommt, hat in einer ausgelieferten Anwendung nichts
 * zu suchen — er ist hier ausschließlich dafür da, dass Prüfläufe die
 * Oberfläche ohne Tauri gegen einen laufenden Dienst fahren können.
 */
function developmentFallback(): Connection | null {
  if (!import.meta.env.DEV) return null;
  const baseUrl = import.meta.env["VITE_TAKT_BASE_URL"];
  const secret = import.meta.env["VITE_TAKT_TOKEN"];
  if (typeof baseUrl !== "string" || typeof secret !== "string") return null;
  if (baseUrl.length === 0 || secret.length === 0) return null;
  return { baseUrl, headerName: "X-Takt-Token", secret };
}

/** Stellt die Verbindung her und meldet, was dabei herauskam. */
export async function connect(): Promise<ConnectionState> {
  const shell = await loadShell();

  if (shell === null || !shell.isShellAvailable()) {
    const fallback = developmentFallback();
    if (fallback !== null) {
      setConnection(fallback);
      return { kind: "ready", shell: null };
    }
    return { kind: "no_shell" };
  }

  try {
    setConnection(await shell.serviceHandshake());
  } catch (cause) {
    return {
      kind: "failed",
      message:
        cause instanceof Error
          ? cause.message
          : "Die Verbindung zum lokalen Dienst kam nicht zustande.",
    };
  }

  return { kind: "ready", shell: await readShellState() };
}

/** Den Zustand der Hülle nachlesen. `null`, wenn es keine Hülle gibt. */
export async function readShellState(): Promise<ShellStateSnapshot | null> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) return null;
  try {
    return await shell.shellState();
  } catch {
    return null;
  }
}

/**
 * Beendet Takt über die Hülle.
 *
 * Nur aus der Sperrmeldung heraus aufgerufen: Steht `serviceExit`, gibt es
 * keinen laufenden Timer mehr, den E-036 klären müsste — der Dienst, der ihn
 * geführt hätte, ist weg.
 */
export async function quitApplication(): Promise<void> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) return;
  await shell.quit();
}

/**
 * Läuft die Oberfläche in der Hülle?
 *
 * Asynchron, weil die Antwort im dynamisch geladenen Hüllenmodul steht — nicht,
 * weil die Frage schwer wäre. Die Oberfläche entscheidet daran, ob sie den
 * Ordner anzeigt oder ein Eingabefeld dafür stellt.
 */
export async function isShellPresent(): Promise<boolean> {
  const shell = await loadShell();
  return shell !== null && shell.isShellAvailable();
}

/**
 * Der Ordnerauswahldialog des Betriebssystems (Befund S-04, B-5.1 Punkt 1).
 *
 * Ohne Hülle gibt es ihn nicht, und das ist kein Fehler: Die Oberfläche fällt
 * dann auf das Textfeld zurück. Der Rückgabewert sagt es, statt zu werfen —
 * ein `try`/`catch` an der Aufrufstelle hätte den Unterschied zwischen
 * „abgebrochen" und „nicht vorhanden" wieder verwischt.
 */
export async function chooseExportDirectory(
  current: string | null,
): Promise<ExportDirectoryChoice> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) {
    return {
      outcome: "unavailable",
      reason:
        "Der Ordnerauswahldialog gehört zur Takt-Anwendung. Im Browser allein gibt es ihn nicht.",
    };
  }
  return shell.chooseExportDirectory(current);
}
