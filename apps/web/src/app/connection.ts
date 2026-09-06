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
 *
 * ## Was diese Datei an Text trägt — und warum er nicht zählt
 *
 * Sechs Sätze stehen hier, alle über dasselbe: was **ohne Anwendungshülle**
 * nicht geht. Fünf hängen an `shell === null || !shell.isShellAvailable()` —
 * Beenden, Release-Seite, Ordnerauswahl, Anhänge, Dateiauswahl; der sechste
 * ist der Rückfalltext von `kind: "failed"`.
 *
 * **Keiner dieser sechs Sätze darf je als Träger einer Aussage gezählt
 * werden** (Auflage aus T-195, Z-38 und Z-29). Der Grund ist gemessen und
 * nicht übernommen: Liegt keine Hülle vor, ersetzt `App.tsx` mit
 * `NoShellNotice` bereits die **ganze** Fläche (SP-20) — an einen Knopf, der
 * einen der fünf auslösen könnte, kommt dort niemand. Und der Zweig, über den
 * die Oberfläche ohne Hülle überhaupt weiterläuft, fällt im
 * Auslieferungsbündel mit `import.meta.env.DEV` weg.
 *
 * **Eine Einschränkung, hier nachgemessen:** Der Rückfalltext von
 * `kind: "failed"` ist der einzige, den ein ausgeliefertes Bündel zeigen kann
 * — `App.tsx` gibt `state.message` aus, und dieser Zweig läuft auch **mit**
 * Hülle. Er erscheint allerdings nur, wenn `serviceHandshake()` etwas wirft,
 * das kein `Error` ist; sonst steht dort die Meldung der Hülle. Auch er zählt
 * nicht als Träger — er sagt nichts, was die Fläche um ihn herum nicht schon
 * sagt.
 *
 * Wer hier einen Satz streicht oder hinzufügt, ändert deshalb keinen
 * Textbestand. Er ändert eine Notlage.
 */

import type {
  AttachmentOpenResult,
  DirectoryChoice,
  OsUser,
  ReleasePageResult,
} from "@takt/desktop/shell";
import { hasForbiddenNameCharacter } from "@takt/domain";
import type { ForeignText } from "../api/types";
import { setConnection, type Connection } from "../api/client";
import type { ShellStateSnapshot, UserNameFinding } from "../components/ShellStatus";

/**
 * Das Ergebnis des Ordnerauswahldialogs, unter dem Namen der Hülle.
 *
 * Alias und keine eigene Schnittstelle — dieselbe Begründung wie bei
 * `ShellStateSnapshot`: Ein zweiter Name für dieselbe Sache lädt dazu ein, ihn
 * irgendwann anders zu füllen.
 */
export type ExportDirectoryChoice = DirectoryChoice;

/**
 * Das Ergebnis eines Öffnen-Versuchs, unter dem Namen der Hülle (Abschnitt 19).
 *
 * Aus demselben Grund ein Alias: Ein zweiter Name für dieselbe Sache lädt dazu
 * ein, ihn irgendwann anders zu füllen.
 */
export type AttachmentOpen = AttachmentOpenResult;

export type ConnectionState =
  | { readonly kind: "connecting" }
  | {
      readonly kind: "ready";
      readonly shell: ShellStateSnapshot | null;
      /** Siehe {@link readUserNameFinding}. Ohne Huelle `"unknown"`. */
      readonly userName: UserNameFinding;
    }
  | { readonly kind: "no_shell" }
  | { readonly kind: "failed"; readonly message: string };

interface ShellModule {
  isShellAvailable(): boolean;
  serviceHandshake(): Promise<Connection>;
  shellState(): Promise<ShellStateSnapshot>;
  osUser(): Promise<OsUser>;
  quit(): Promise<void>;
  chooseExportDirectory(current: string | null): Promise<ExportDirectoryChoice>;
  installedVersion(): Promise<string>;
  openReleasePage(version: string): Promise<ReleasePageResult>;
  /*
    **Fremder Text bis zur Hülle.** Adresse und Pfad kommen aus dem Bestand und
    behalten ihre Herkunft bis an die Grenze; erst dahinter, in
    `src-tauri/src/attachment.rs`, wird über sie geurteilt. Die Marke hier ist
    keine Zierde: `proof:foreign` misst an ihr, dass niemand unterwegs einen
    gewöhnlichen `string` daraus macht und die Herkunft damit verliert.

    Behandelt wird der Wert auf diesem Weg **nicht** — `visibleText` verändert
    Zeichen, und was hier durchgeht, muss zeichengleich das sein, was geprüft
    und geöffnet wird (Auflage A-A-3, der Festpunkt).
  */
  openAttachmentLink(url: ForeignText): Promise<AttachmentOpenResult>;
  openAttachmentFile(path: ForeignText): Promise<AttachmentOpenResult>;
  chooseAttachmentFile(kind: "file" | "image"): Promise<DirectoryChoice>;
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
      return { kind: "ready", shell: null, userName: "unknown" };
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

  // Beide Fragen an die Huelle, nebeneinander: Sie haengen nicht voneinander
  // ab, und der Start soll nicht zweimal auf denselben Kanal warten.
  const [shellSnapshot, userName] = await Promise.all([
    readShellState(),
    readUserNameFinding(),
  ]);
  return { kind: "ready", shell: shellSnapshot, userName };
}

/**
 * Traegt der Windows-Benutzername dieses Rechners ein Zeichen, das der lokale
 * Dienst abweist? (O-AJ, T-124.)
 *
 * ---------------------------------------------------------------------------
 * Warum die Oberflaeche diese Frage ueberhaupt stellt
 * ---------------------------------------------------------------------------
 *
 * Nicht, um zu entscheiden — entschieden hat der Dienst, und zwar schon: Seit
 * T-122 startet er nicht, wenn der Name aus der zweiten `stdin`-Zeile ein
 * Steuer- oder Richtungszeichen traegt (Grund `user_invalid`, Code 78). Diese
 * Funktion **erklaert** einen Fehlschlag, der bereits stattgefunden hat.
 *
 * Sie muss ihn erklaeren, weil aus dem Fehlschlag allein nicht hervorgeht,
 * woran er lag: Der Beendigungscode 78 steht auch fuer ein fehlendes
 * Startgeheimnis und fuer ein fehlendes Datenverzeichnis, und die Huelle faengt
 * einen Teil der Faelle sogar vor dem Start ab — dann gibt es gar keinen Code,
 * sondern nur einen Satz in `problems`. Ohne diese Frage steht der Benutzer
 * vor einer stummen Tuer.
 *
 * ---------------------------------------------------------------------------
 * Zwei Dinge, die hier nicht geschehen
 * ---------------------------------------------------------------------------
 *
 * **Es wird nichts nachgerechnet.** Die Zeichenklasse kommt aus
 * `packages/domain/src/characters.ts` — dieselbe Funktion, die der Dienst an
 * seiner Tuer und am Handschlag ruft (T-122, E-063 Punkt 4). Eine zweite
 * Fassung in der Oberflaeche koennte anderer Meinung sein als die Tuer, und
 * genau diese Bauart hat in T-119 fuenf Wellen lang eine Regression getragen.
 *
 * **Der Name wird nicht behalten.** Er lebt in einer oertlichen Bindung, so
 * lange die Frage dauert, und geht danach mit ihr. Heraus kommt der Befund,
 * nicht der Wert: B-8.2 Punkt 1 verlangt, dass der Name zum Zeitpunkt des
 * Exports gefragt wird und nirgends im Anwendungszustand liegt — und eine
 * Meldung, die ihn wiedergaebe, richtete genau den Schaden an, den sie meldet
 * (B-4.3 Punkt 5).
 *
 * Ohne Huelle und bei einem Fehlschlag der Abfrage kommt `"unknown"` zurueck
 * und nicht `"ok"`: Eine unbeantwortete Frage ist keine Unbedenklichkeit.
 */
export async function readUserNameFinding(): Promise<UserNameFinding> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) return "unknown";
  try {
    const user = await shell.osUser();
    return hasForbiddenNameCharacter(user.name) ? "forbidden_characters" : "ok";
  } catch {
    return "unknown";
  }
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
 * Nur aus den Sperrmeldungen und aus der Startmeldung heraus aufgerufen: Steht
 * `serviceExit`, gibt es keinen laufenden Timer mehr, den E-036 klären müsste
 * — der Dienst, der ihn geführt hätte, ist weg.
 *
 * **Seit T-124 schweigt sie nicht mehr** (O-AF). Bis dahin kehrte sie ohne
 * Hülle wortlos zurück, und ein abgewiesenes `quit()` fiel durch ein `void`
 * ins Leere. Beides sah an der Schaltfläche gleich aus: Es geschah nichts.
 * „Takt beenden" ist nach E-036 aber der **einzige** Ausgang aus der
 * Sperrmeldung, und ein Ausgang, der stumm nicht funktioniert, ist eine Tür
 * ohne Klinke.
 *
 * Der Fall „keine Hülle" ist hier ein Fehlschlag und kein Normalfall: Der
 * Knopf steht nur da, wenn die Hülle einen Zustand gemeldet hat. Wer ihn
 * drückt und keine Hülle vorfindet, hat einen Widerspruch vor sich und soll
 * ihn lesen können.
 *
 * Der **Erfolg** dieser Funktion ist nicht sichtbar: `takt_quit` ruft
 * `app.exit(0)`, der Prozess endet, und die Zusage kommt nie zurück. Wer auf
 * sie wartet, wartet deshalb mit einer Frist — siehe `useQuitAttempt` in
 * `components/ShellStatus.tsx`.
 */
export async function quitApplication(): Promise<void> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) {
    throw new Error(
      "Takt läuft hier ohne seine Anwendungshülle. Den Befehl zum Beenden gibt es nur in der Takt-Anwendung.",
    );
  }
  await shell.quit();
}

/* ==================================================================== */
/* Versionsprüfung (Abschnitt 18)                                       */
/* ==================================================================== */

/**
 * Die installierte Fassung, aus den eingeprägten Angaben des Erzeugnisses
 * (A-18.1, Auflage A-V-15). `null`, wenn es keine Hülle gibt.
 *
 * `null` ist hier keine Notlage, sondern ein vollständiger Zustand: Ohne
 * installierte Fassung gibt es nichts zu vergleichen, und die Oberfläche zeigt
 * nichts (A-18.5, A-18.11). Der Wert wird **nicht** zwischengespeichert und
 * nicht in einer Einstellung abgelegt — er kommt aus der Binärdatei, und das
 * ist die einzige Quelle, an der er etwas bedeutet.
 */
export async function readInstalledVersion(): Promise<string | null> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) return null;
  try {
    return await shell.installedVersion();
  } catch {
    return null;
  }
}

/**
 * Öffnet die Release-Seite einer Fassung (A-18.8).
 *
 * **Weitergereicht wird die Fassungsbezeichnung, nie eine Adresse.** Die
 * Adresse baut die Hülle aus einer bei ihr fest hinterlegten Zeichenkette,
 * nachdem sie die Bezeichnung gegen eine enge Form geprüft hat — nach der
 * Messung aus T-136 ist das die einzige Kontrolle zwischen der Antwort von
 * GitHub und dem Browser des Benutzers (E-064 Punkt 4, B-18.2).
 *
 * Ohne Hülle wird nichts geöffnet und nichts geworfen: Der Rückgabewert sagt
 * es, wie beim Ordnerauswahldialog.
 */
export async function openReleasePage(version: string): Promise<ReleasePageResult> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) {
    return {
      outcome: "unavailable",
      reason:
        "Die Release-Seite öffnet die Takt-Anwendung. Im Browser allein steht dieser Weg nicht zur Verfügung.",
    };
  }
  return shell.openReleasePage(version);
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

/* ==================================================================== */
/* Anhänge (Spezifikation Abschnitt 19, E-072)                          */
/* ==================================================================== */

/**
 * Der Satz für den reinen Browserbetrieb, an **einer** Stelle.
 *
 * Wortgleich zu dem in `@takt/desktop/shell` — die Hülle antwortet ihn, wenn
 * sie geladen ist und `__TAURI_INTERNALS__` fehlt; hier steht er für den Fall,
 * dass das Modul selbst nicht geladen werden konnte. Zwei Lagen, eine Auskunft.
 */
const NO_SHELL_FOR_ATTACHMENTS =
  "Anhänge öffnet die Takt-Anwendung. Im Browser allein steht dieser Weg nicht zur Verfügung.";

/**
 * Öffnet einen Verweis im Browser (A-19.9, A-19.18).
 *
 * **Nur auf ausdrückliche Handlung des Benutzers.** Nichts an diesem Weg wird
 * von einer Liste, einem Ladevorgang oder einer Vorschau ausgelöst
 * (Auflage A-A-24).
 *
 * Geprüft wird die Adresse **nicht hier**, sondern im Öffnen-Befehl der Hülle,
 * bei jedem Aufruf (E-072 Punkt 2). Zwischen dem Eingabefeld und diesem Aufruf
 * liegt der Bestand.
 */
export async function openAttachmentLink(url: ForeignText): Promise<AttachmentOpen> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) {
    return { outcome: "unavailable", reason: NO_SHELL_FOR_ATTACHMENTS };
  }
  return shell.openAttachmentLink(url);
}

/**
 * Öffnet eine Datei mit der Standardanwendung des Systems (A-19.9).
 *
 * **Erst rufen, wenn die Rückfrage beantwortet ist** (E-072 Punkt 3,
 * Auflage A-A-6). Sie steht in `components/AttachmentOpenDialog.tsx`, nennt den
 * vollen Pfad und wählt ihre Wörter nach der Endung.
 */
export async function openAttachmentFile(path: ForeignText): Promise<AttachmentOpen> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) {
    return { outcome: "unavailable", reason: NO_SHELL_FOR_ATTACHMENTS };
  }
  return shell.openAttachmentFile(path);
}

/**
 * Der Dateiauswahldialog des Betriebssystems für einen Anhang (A-19.10).
 *
 * Ohne Hülle gibt es ihn nicht, und die Oberfläche fällt dann auf ein Textfeld
 * zurück — mit denselben Prüfungen, nur ohne Systemdialog. Dieselbe Bauart wie
 * beim Exportordner und aus demselben Grund: Der Dialog ist dafür da, dass der
 * Benutzer die Datei **sieht**, bevor er sie anhängt.
 */
export async function chooseAttachmentFile(
  kind: "file" | "image",
): Promise<ExportDirectoryChoice> {
  const shell = await loadShell();
  if (shell === null || !shell.isShellAvailable()) {
    return {
      outcome: "unavailable",
      reason:
        "Der Dateiauswahldialog gehört zur Takt-Anwendung. Im Browser allein gibt es ihn nicht.",
    };
  }
  return shell.chooseAttachmentFile(kind);
}
