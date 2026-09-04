/**
 * Takt — die Schnittstelle der Hülle zur Oberfläche (E-004, E-010, E-018).
 *
 * Sechs eigene Befehle und ein Systemdialog, mehr gibt die Hülle nicht heraus.
 * Sie liegen hier und nicht in `apps/web`, damit es genau eine Stelle gibt, an
 * der die Namen der Befehle und die Gestalt ihrer Antworten stehen — die
 * Rust-Seite und diese Datei müssen zusammenpassen, `apps/web` soll das nicht
 * wissen müssen.
 *
 * Der siebte, `chooseExportDirectory()`, ist kein `takt_`-Befehl, sondern der
 * Ordnerauswahldialog von `tauri-plugin-dialog` (Befund S-04, B-5.1 Punkt 1).
 * Er steht am Ende dieser Datei und erklärt dort, was die Rust-Seite dafür
 * mitbringen muss.
 *
 * Die beiden jüngsten — `installedVersion()` und `openReleasePage()` — gehören
 * zur Versionsprüfung (Spezifikation Abschnitt 18, E-064, E-067). Sie stehen
 * am Ende dieser Datei, und dort steht auch, warum der zweite **keine** Adresse
 * entgegennimmt.
 *
 * ## Wie sich die Oberfläche gegenüber dem lokalen Dienst ausweist
 *
 * Über das **Sitzungsgeheimnis** aus `serviceHandshake()`, gesetzt in der
 * Kopfzeile `X-Takt-Token`. Ausdrücklich **nicht** über das Add-in-Token: Das
 * gehört allein der Add-in-Strecke, und diese Trennung ist der Grund, warum ein
 * entwendetes Add-in-Token sich weder anzeigen noch selbst austauschen kann
 * (T-011).
 *
 * Das Geheimnis gilt für einen Start, berührt die Platte nie und darf weder in
 * `localStorage` noch in `sessionStorage` noch in eine Adresszeile. Wer es
 * dorthin schreibt, hebt genau das auf, wofür es da ist.
 *
 * ## Läuft die Oberfläche außerhalb der Hülle
 *
 * Im reinen Browserbetrieb — `pnpm dev` ohne Tauri — gibt es die Hülle nicht.
 * `isShellAvailable()` sagt das, und jede Funktion wirft dann einen Fehler mit
 * einem verständlichen deutschen Text, statt `undefined` weiterzureichen.
 *
 * ## Benannte Ausnahme: `style-src 'unsafe-inline'` in der CSP
 *
 * Die Inhaltssicherheitsrichtlinie in `src-tauri/tauri.conf.json` führt
 * `style-src 'self' 'unsafe-inline'`. Der Prüfer (S-10) hat verlangt, dass der
 * Eintrag entweder verschwindet oder **als benannte Ausnahme** geführt wird.
 * Der Orchestrator hat sich in T-040 für das Zweite entschieden. Weil eine
 * JSON-Datei keine Kommentare trägt, steht die Begründung hier — an der
 * einzigen Stelle des Desktop-Pakets, die sie aufnehmen kann.
 *
 * **Warum der Eintrag bleibt.** `apps/web` setzt Stile am Element nur dort, wo
 * der Wert erst zur Laufzeit entsteht und deshalb in keinem Stylesheet stehen
 * kann: die Position eines Kontextmenüs am Zeiger (`Menu.tsx`), die Einrückung
 * einer Zeile nach ihrer Tiefe im Tag-Baum (`TagTree.tsx`), die Kantenlänge von
 * Ladeanzeiger und Platzhalterfläche (`Primitives.tsx`). Eine Klasse je Wert
 * wäre ein erzeugtes Stylesheet mit unbekannt vielen Regeln — dieselbe
 * Angriffsfläche, nur unübersichtlicher. React setzt diese Werte über
 * `element.style`, was `style-src` betrifft, und nicht über `<style>`-Blöcke.
 *
 * **Was die Ausnahme nicht abdeckt.** `script-src` bleibt `'self'` ohne
 * `'unsafe-inline'`; kein Skript wird je aus einer Zeichenkette ausgeführt.
 * `default-src 'none'`, `object-src 'none'`, `base-uri 'none'`,
 * `form-action 'none'` und `frame-ancestors 'none'` bleiben unverändert. Der
 * Rest der Oberfläche wird über Klassen gestaltet; die Musterseite hält die
 * Liste der Bausteine.
 *
 * **Wann sie fällt.** Sobald die drei genannten Stellen über
 * CSS-Eigenschaftsvariablen laufen, die eine Klasse liest. Das ist eine eigene
 * Aufgabe mit eigener Gegenprobe und war ausdrücklich nicht Teil von T-040.
 */

import { invoke } from '@tauri-apps/api/core';

/** Womit sich die Oberfläche beim lokalen Dienst ausweist. */
export interface ServiceHandshake {
  /** Grundadresse aller Routen, etwa `http://127.0.0.1:17843/api/v1`. */
  readonly baseUrl: string;
  /** Name der Kopfzeile, in der der Nachweis steht. */
  readonly headerName: string;
  /** Das Sitzungsgeheimnis dieses Starts. Nie speichern, nie protokollieren. */
  readonly secret: string;
}

/**
 * Der Anmeldename vom Betriebssystem (E-010, A-8.5).
 *
 * Keine Benutzereingabe und keine Einstellung: Der Wert geht in den Export und
 * entscheidet dort mit darüber, wem Arbeitszeit zugerechnet wird. Es gibt
 * bewusst keine Gegenfunktion, die ihn setzt.
 *
 * Denselben Namen bekommt der lokale Dienst beim Start als zweite `stdin`-Zeile
 * (E-042) — er ist dort Pflicht, ohne ihn startet der Dienst nicht. Diese
 * Funktion ist also **nicht** der Weg, auf dem der Wert in den Export gelangt,
 * sondern der Weg, auf dem die Oberfläche ihn anzeigen kann.
 */
export interface OsUser {
  /** Der nackte Anmeldename, etwa `mmueller`. */
  readonly name: string;
  /** Derselbe Name mit Domäne, etwa `KONTOSO\\mmueller`, oder `null`. */
  readonly qualifiedName: string | null;
  /** Der Betriebssystemaufruf, aus dem der Wert stammt. */
  readonly source: string;
  /**
   * Ist der Wert ein Abrechnungswert?
   *
   * Unter Windows ja. Unter Linux und macOS steht hier `false`, weil es dort
   * kein `WindowsUser` gibt und der Wert nur der Entwicklung dient. Die
   * Oberfläche soll ihn dann nicht wie einen Abrechnungswert behandeln.
   */
  readonly trusted: boolean;
}

/** Ablageort der Anwendungsdaten und seine Rechte (E-018, B-7.2). */
export interface DirectoryReport {
  readonly path: string;
  readonly permissionsApplied: boolean;
  readonly permissionsDetail: string;
  /**
   * Netzlaufwerk oder Synchronisierungsordner — sonst `null` (B-7.1, R-13).
   *
   * Klartext: **was** gefunden wurde, mit dem Ordner im Satz. Was der Befund
   * bedeutet und was zu tun ist, ergänzt die Oberfläche.
   */
  readonly syncWarning: string | null;
  /**
   * Der technische Zusatz zum selben Befund (T-020b).
   *
   * Das, was man an die Systembetreuung weitergibt. Steht in der Oberfläche
   * **neben** der Warnung, nie an ihrer Stelle. Immer gesetzt, wenn
   * `syncWarning` gesetzt ist.
   */
  readonly syncDetail: string | null;
}

/**
 * Warum der lokale Dienst nicht mehr läuft.
 *
 * **Die Hülle meldet diesen Fall von sich aus** (T-020b). `sidecar.rs` schreibt
 * den Grund bei `CommandEvent::Terminated` in den Zustand und sendet danach
 * `SHELL_EVENTS.serviceExited` mit genau diesem Inhalt als Nutzlast. Wer darauf
 * hört, braucht keinen regelmäßigen Abruf — und die Sperrmeldung erscheint in
 * dem Moment, in dem sie gilt, statt beim nächsten Abruf.
 *
 * Die Reihenfolge auf der Rust-Seite ist zugesichert: erst `note_exit()`, dann
 * das Ereignis. Ein Empfänger, der daraufhin `shellState()` abruft, findet den
 * Grund dort bereits vor.
 */
export interface ServiceExit {
  readonly code: number | null;
  /**
   * Klartext für die Oberfläche. Enthält nie ein Geheimnis.
   *
   * Der Satz, den der Benutzer zuerst liest — in dem Moment, in dem seine
   * Anwendung nichts mehr speichert. Ohne Portnummer, ohne `stdin`, ohne
   * Beendigungscode: Die stehen im Zusatz und im Feld daneben.
   */
  readonly message: string;
  /**
   * Der technische Zusatz — das, was man weitergibt (T-020b). `null`, wenn es
   * nichts weiterzugeben gibt.
   */
  readonly detail: string | null;
}

/**
 * Was beim Start aufgefallen ist. Leer ist der Normalfall.
 *
 * **Wer das anzeigt:** `ShellStatus` aus `apps/web/src/components/ShellStatus.tsx`
 * (T-020). Der Baustein nimmt genau diese Gestalt entgegen, ohne dass
 * `apps/web` von diesem Paket abhängt — die Oberfläche läuft auch im reinen
 * Browser, in dem es die Hülle nicht gibt. Er trennt die drei Zustände nach
 * ihrer Dringlichkeit: `serviceExit` sperrt die Anwendung, `problems` bleibt
 * als Band über der Ansicht stehen, `directory.syncWarning` als ruhiger
 * Dauerhinweis.
 *
 * **Eine Dopplung, die die Oberfläche abfängt:** `lib.rs` legt
 * `directory.sync_warning` zusätzlich in `problems` ab. Das war richtig,
 * solange die Warnung sonst nirgends erschienen wäre; jetzt hat sie einen
 * eigenen Platz. `startupProblems()` filtert sie deshalb aus dieser Liste
 * heraus, damit sie nicht zweimal und nicht unter der zu lauten Überschrift
 * „nicht vollständig gestartet" steht.
 */
export interface ShellState {
  readonly directory: DirectoryReport | null;
  /**
   * Verständliche deutsche Sätze für die Fehleranzeige. Jeder Eintrag ist ein
   * Zustand aus Abschnitt 15 der Spezifikation und gehört sichtbar gemacht —
   * nicht in die Entwicklerkonsole.
   */
  readonly problems: readonly string[];
  readonly serviceExit: ServiceExit | null;
}

/** Gestalt der Rust-Antworten. Serde liefert `snake_case`. */
interface RawHandshake {
  readonly base_url: string;
  readonly header_name: string;
  readonly secret: string;
}

interface RawOsUser {
  readonly name: string;
  readonly qualified_name: string | null;
  readonly source: string;
  readonly trusted: boolean;
}

interface RawDirectoryReport {
  readonly path: string;
  readonly permissions_applied: boolean;
  readonly permissions_detail: string;
  readonly sync_warning: string | null;
  readonly sync_detail: string | null;
}

interface RawShellState {
  readonly directory: RawDirectoryReport | null;
  readonly problems: readonly string[];
  readonly service_exit: ServiceExit | null;
}

/**
 * Läuft die Oberfläche in der Hülle?
 *
 * Die Prüfung geht über das von Tauri gesetzte Merkmal am Fenster und nicht
 * über die Herkunft: Die ist je nach Betriebssystem `tauri://localhost` oder
 * `http://tauri.localhost`, und im Entwicklungsbetrieb ist sie
 * `http://localhost:5173` — dieselbe wie ohne Hülle.
 */
export function isShellAvailable(): boolean {
  return typeof globalThis !== 'undefined' && '__TAURI_INTERNALS__' in globalThis;
}

function requireShell(): void {
  if (!isShellAvailable()) {
    throw new Error(
      'Diese Funktion braucht die Takt-Anwendung. Im Browser allein steht sie nicht zur Verfügung.',
    );
  }
}

/** Adresse und Nachweis des lokalen Dienstes. */
export async function serviceHandshake(): Promise<ServiceHandshake> {
  requireShell();
  const raw = await invoke<RawHandshake>('takt_service_handshake');
  return { baseUrl: raw.base_url, headerName: raw.header_name, secret: raw.secret };
}

/**
 * Der Anmeldename vom Betriebssystem.
 *
 * Bei jedem Bedarf neu fragen und **nicht** zwischenspeichern: B-8.2 Punkt 1
 * verlangt eine Abfrage zum Exportzeitpunkt, keinen gehaltenen Wert. Ein
 * zwischengespeicherter Wert ist ab dem Zwischenspeichern Anwendungszustand
 * und damit änderbar.
 */
export async function osUser(): Promise<OsUser> {
  requireShell();
  const raw = await invoke<RawOsUser>('takt_os_user');
  return {
    name: raw.name,
    qualifiedName: raw.qualified_name,
    source: raw.source,
    trusted: raw.trusted,
  };
}

/** Ablageort, Rechte und alles, was beim Start aufgefallen ist. */
export async function shellState(): Promise<ShellState> {
  requireShell();
  const raw = await invoke<RawShellState>('takt_shell_state');
  return {
    directory:
      raw.directory === null
        ? null
        : {
            path: raw.directory.path,
            permissionsApplied: raw.directory.permissions_applied,
            permissionsDetail: raw.directory.permissions_detail,
            syncWarning: raw.directory.sync_warning,
            syncDetail: raw.directory.sync_detail,
          },
    problems: raw.problems,
    serviceExit: raw.service_exit,
  };
}

/**
 * Beendet den lokalen Dienst und danach die Anwendung.
 *
 * Erst rufen, wenn ein laufender Timer geklärt ist (E-036): Die Anwendung fragt
 * beim geordneten Beenden, ob er gestoppt werden soll, und der Benutzer
 * entscheidet. Diese Funktion ist der Schritt **danach**.
 *
 * Eine Ausnahme, und nur eine: Steht `shellState().serviceExit`, gibt es keinen
 * laufenden Timer mehr, den man klären könnte — der Dienst, der ihn geführt
 * hätte, ist weg. Die Sperrmeldung aus T-020 ruft deshalb direkt hierher.
 */
export async function quit(): Promise<void> {
  requireShell();
  await invoke<null>('takt_quit');
}

/**
 * Ergebnis des Ordnerauswahldialogs. Drei Ausgänge, alle drei gehören
 * behandelt (B-5.1 Punkt 1, S-04).
 *
 * `unavailable` ist kein Fehler, sondern eine Umgebung: Die Oberfläche läuft
 * im reinen Browser oder in einer Hülle, deren Fähigkeitenliste `dialog:allow-open`
 * nicht führt. Sie fällt dann auf das Textfeld zurück — mit denselben
 * Prüfungen, nur ohne Systemdialog.
 */
export type DirectoryChoice =
  | { readonly outcome: 'chosen'; readonly path: string }
  | { readonly outcome: 'cancelled' }
  | { readonly outcome: 'unavailable'; readonly reason: string };

/** Was `plugin:dialog|open` entgegennimmt. Nur die Felder, die hier zählen. */
interface OpenDialogOptions {
  readonly title: string;
  readonly directory: true;
  readonly multiple: false;
  readonly recursive: false;
  readonly defaultPath?: string;
}

/**
 * Der Ordnerauswahldialog des Betriebssystems (B-5.1 Punkt 1, Befund S-04).
 *
 * ## Warum überhaupt ein Dialog
 *
 * Der Traversierungsschutz im Dienst hält — das ist gemessen. Der Dialog ist
 * nicht dafür da. Er ist dafür da, dass der Benutzer den Ordner **sieht**,
 * bevor er ihn wählt: Ein getippter Pfad geht an jeder Überlegung vorbei, die
 * E-018 angestellt hat, und die Exportdatei trägt lesbare Kundennotizen
 * (A-8.9, R-05, B-6.1).
 *
 * ## Warum `invoke` und nicht `@tauri-apps/plugin-dialog`
 *
 * Das npm-Paket ist eine dünne Hülle um genau diesen Aufruf. Es hier
 * einzuziehen hieße: eine weitere Abhängigkeit in der Lieferkette, die
 * `minimumReleaseAge`-Regel aus `pnpm-workspace.yaml` erneut wiegen, ein
 * weiterer Eintrag im Sperrbestand — für eine Funktion, die eine Zeile ist.
 * `@tauri-apps/api` liegt ohnehin hier.
 *
 * Die **Rust-Seite** braucht das Gegenstück trotzdem: `tauri-plugin-dialog` in
 * `Cargo.toml`, `.plugin(tauri_plugin_dialog::init())` in `lib.rs` und
 * `dialog:allow-open` — **nur** `open`, kein `save`, kein `message`, kein
 * `ask` — in `capabilities/default.json`. Fehlt eines davon, weist Tauri den
 * Aufruf ab, und diese Funktion meldet `unavailable` statt zu werfen. Die
 * Oberfläche bleibt dann bedienbar; sie sagt nur, dass sie den Dialog nicht
 * hat.
 *
 * @param current Der bisher eingestellte Ordner. Der Dialog startet dort,
 *   damit „gleiche Stelle, anderer Unterordner" ein Klick ist und kein
 *   Suchlauf. `null`, wenn noch keiner gewählt ist.
 */
export async function chooseExportDirectory(current: string | null): Promise<DirectoryChoice> {
  if (!isShellAvailable()) {
    return {
      outcome: 'unavailable',
      reason: 'Der Ordnerauswahldialog gehört zur Takt-Anwendung. Im Browser allein gibt es ihn nicht.',
    };
  }

  const options: OpenDialogOptions = {
    title: 'Exportordner wählen',
    directory: true,
    multiple: false,
    recursive: false,
    ...(current === null || current.length === 0 ? {} : { defaultPath: current }),
  };

  let selection: unknown;
  try {
    selection = await invoke<unknown>('plugin:dialog|open', { options });
  } catch {
    // Der Grund wird bewusst **nicht** weitergereicht: Er kommt aus der
    // Tauri-Fähigkeitenprüfung, ist englisch und nennt interne Namen. Der
    // Benutzer bekommt den Satz, der ihm weiterhilft — das Textfeld steht
    // daneben und tut es auch.
    return {
      outcome: 'unavailable',
      reason: 'Diese Fassung von Takt kann den Ordnerauswahldialog des Betriebssystems nicht öffnen.',
    };
  }

  // Abgebrochen liefert `null`. Mit `multiple: false` ist alles andere ein
  // einzelner Pfad; die Feldprüfung steht trotzdem, weil ein `unknown` aus der
  // Hülle nicht ungeprüft weitergegeben wird.
  if (typeof selection === 'string' && selection.length > 0) {
    return { outcome: 'chosen', path: selection };
  }
  return { outcome: 'cancelled' };
}

/* ==================================================================== */
/* Versionsprüfung (Spezifikation Abschnitt 18)                         */
/* ==================================================================== */

/**
 * Die installierte Fassung von Takt (A-18.1, Auflage A-V-15).
 *
 * Sie kommt aus den **eingeprägten** Angaben des Erzeugnisses
 * (`app.package_info().version` in `src-tauri/src/release.rs`) und nicht aus
 * einer Datei neben der ausführbaren Datei, nicht aus einer Umgebungsvariablen
 * und nicht vom lokalen Dienst. An ihr hängt, ob ein Hinweis erscheint und
 * welche Adresse geöffnet wird; läge sie daneben, könnte jeder Prozess im
 * Benutzerkonto sie herabsetzen und Takt dauerhaft eine
 * Aktualisierungsaufforderung zeigen lassen (T-136-3).
 *
 * Ohne Hülle gibt es sie nicht — dann wirft diese Funktion wie jede andere hier
 * und die Oberfläche zeigt schlicht nichts (A-18.11).
 */
export async function installedVersion(): Promise<string> {
  requireShell();
  return await invoke<string>('takt_installed_version');
}

/**
 * Was beim Öffnen der Release-Seite herauskam. Vier Ausgänge, alle vier
 * gehören behandelt — wie bei {@link DirectoryChoice} und aus demselben Grund:
 * Ein `try`/`catch` an der Aufrufstelle verwischte den Unterschied zwischen
 * „keine Hülle", „abgewiesen" und „ließ sich nicht öffnen".
 *
 * `rejected` ist der Fall, der zählt: Die Fassungsbezeichnung hat die
 * Formprüfung in `release.rs` nicht bestanden. Der abgewiesene Wert kommt
 * **nicht** mit — er ist fremder Text, und ein abgewiesener Wert in einer
 * Meldung wäre derselbe fremde Text an einer neuen Stelle (B-18.2).
 */
export type ReleasePageResult =
  | { readonly outcome: 'opened' }
  | { readonly outcome: 'rejected' }
  | { readonly outcome: 'failed' }
  | { readonly outcome: 'unavailable'; readonly reason: string };

/**
 * Öffnet die Release-Seite einer Fassung im Browser des Benutzers (A-18.8).
 *
 * ## Der Parameter ist **keine** Adresse, und das ist die ganze Absicherung
 *
 * Übergeben wird die Fassungsbezeichnung ohne führendes `v` — kein Schema,
 * kein Wirt, kein Pfad. Die Adresse setzt die Rust-Seite aus einer bei ihr fest
 * hinterlegten Zeichenkette zusammen, nachdem sie die Bezeichnung gegen
 * `^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$` geprüft hat
 * (E-064 Punkt 4, Auflage A-V-16).
 *
 * **Hier wird die Form nicht ein zweites Mal geprüft.** T-136 hat gemessen,
 * dass `tauri-plugin-shell` auf dem Rust-Weg gar nichts prüft; die eine
 * Kontrolle steht deshalb dort, wo die Adresse entsteht, und nicht davor. Eine
 * zweite Fassung derselben Regel in TypeScript wäre eine zweite Meinung
 * darüber, was eine Fassung ist — genau die Bauart, die in T-119 fünf Wellen
 * lang eine Regression getragen hat.
 *
 * ## Was **nicht** geschieht
 *
 * Nichts wird geladen und nichts installiert (A-18.9). `open` startet den
 * eingestellten Browser mit einer Adresse; alles Weitere entscheidet der
 * Benutzer außerhalb von Takt.
 */
export async function openReleasePage(version: string): Promise<ReleasePageResult> {
  if (!isShellAvailable()) {
    return {
      outcome: 'unavailable',
      reason:
        'Die Release-Seite öffnet die Takt-Anwendung. Im Browser allein steht dieser Weg nicht zur Verfügung.',
    };
  }

  try {
    await invoke<null>('takt_open_release', { version });
    return { outcome: 'opened' };
  } catch (cause) {
    // `release.rs` gibt bei Nichtbestehen der Form `Err("version_rejected")`
    // zurück — ein technischer Schlüssel ohne den abgewiesenen Wert. Er wird
    // hier in einen Ausgang übersetzt und nirgends angezeigt; den deutschen
    // Satz dazu schreibt die Oberfläche.
    return cause === 'version_rejected' ? { outcome: 'rejected' } : { outcome: 'failed' };
  }
}

/**
 * Ereignisse, die das Menü der Hülle sendet.
 *
 * Die Oberfläche hört darauf und entscheidet, was geschieht — das Menü selbst
 * beendet nichts und öffnet nichts. Sonst gäbe es zwei Wege zum selben Ziel und
 * einer davon liefe am Bestätigungsdialog vorbei.
 */
export const SHELL_EVENTS = {
  /** „Takt beenden" wurde gewählt. Erst fragen, dann `quit()`. */
  quitRequested: 'takt://beenden-angefordert',
  /** „Einstellungen …" wurde gewählt. */
  openSettings: 'takt://einstellungen-oeffnen',
  /** „Über Takt" wurde gewählt. */
  openAbout: 'takt://ueber-oeffnen',
  /**
   * Der lokale Dienst hat sich beendet (T-020b). Nutzlast: `ServiceExit`.
   *
   * Das einzige Ereignis dieser Liste, das nicht aus dem Menü kommt und nicht
   * vom Benutzer ausgelöst wurde. Wer darauf hört, zeigt die Sperrmeldung —
   * ohne den Dienst schreibt Takt nichts mehr, und jede weitere Eingabe ist
   * verloren.
   *
   * Die Zeichenkette steht ein zweites Mal in `src-tauri/src/sidecar.rs` als
   * `SERVICE_EXITED_EVENT`. Dass beide gleich lauten, prüft der Rust-Test
   * `ereignisname_steht_auch_in_shell_ts` — er liest diese Datei zur
   * Übersetzungszeit ein.
   */
  serviceExited: 'takt://dienst-beendet',
} as const;
