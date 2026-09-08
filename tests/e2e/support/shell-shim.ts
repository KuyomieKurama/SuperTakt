/**
 * Takt — konfigurierbare Nachbildung der Tauri-Hülle für Dienstzustände, die
 * sich nur über sie erreichen lassen (O-AF, O-AJ, T-130).
 *
 * `support/tauri-shim.ts` bildet eine einzige, unauffällige Hüllenantwort für
 * `web-build-smoke.spec.ts` nach (TP-BUILD-02, ein **gebautes** `apps/web`).
 * Diese Datei braucht etwas anderes: verschiedene Zustände derselben Befehle,
 * gegen den echten **Entwicklungsserver** und den echten lokalen Dienst aus
 * `services.ts` — `takt_service_handshake` liefert deshalb hier den echten
 * Sitzungsnachweis dieses Testlaufs (`session.ts`), damit jede sonstige
 * Anfrage (Todos, Zeitbuchungen, …) unverändert gegen den laufenden Dienst
 * geht. Nur `takt_os_user`, `takt_shell_state`, `takt_quit`,
 * `takt_installed_version` und `takt_open_release` bestimmt der jeweilige
 * Testfall.
 *
 * Ohne diesen Baustein bliebe `app/connection.ts#connect()` im
 * Entwicklungsbetrieb immer beim `developmentFallback()` stehen
 * (`isShellAvailable()` liefert ohne `__TAURI_INTERNALS__` `false`) — dann
 * wäre `userName` für jeden Fall `"unknown"` und `ShellStatus` bekäme nie eine
 * `shell`-Momentaufnahme zum Anzeigen. `O-AF` und `O-AJ` sind ohne eine
 * Hüllen-Nachbildung von der Oberfläche aus überhaupt nicht erreichbar.
 *
 * **Seit T-142: `takt_installed_version` und `takt_open_release`**
 * (Spezifikation Abschnitt 18, A-18.1, A-18.8, A-18.9). Bis dahin kannte diese
 * Nachbildung beide Befehle nicht — ein Klick auf „Installieren" wäre an
 * `installShellShim`s eigener Abweisung „kennt den Befehl nicht" gescheitert,
 * still, ohne dass ein Fall das gemessen hätte (T-139, Bericht, Risiko 4). Für
 * `TP-VER-13` zählt nicht nur, **dass** der Befehl aufgelöst wird, sondern
 * **was** er bekommt: Jeder Aufruf von `takt_open_release` wird deshalb auf
 * `window.__taktOpenReleaseCalls__` aufgezeichnet (ein einfaches Feld auf
 * `window`, kein Rückruf — Playwright serialisiert `args` für
 * `addInitScript`, eine Funktion käme dabei nicht mit). Ein Testfall liest die
 * Liste über `page.evaluate(() => window.__taktOpenReleaseCalls__)` und macht
 * damit **beobachtbar**, wenn „Installieren" künftig mehr täte als öffnen —
 * etwa zusätzlich `takt_download_release` oder einen zweiten Aufruf mit einer
 * rohen Adresse riefe (A-18.9): Der Fall wird dann rot, weil die Liste einen
 * unerwarteten Eintrag trägt oder länger als eins ist, nicht weil ihm
 * geglaubt wurde, dass nichts weiter passiert ist.
 *
 * Wie `tauri-shim.ts`: über `page.addInitScript(installShellShim, args)`
 * eingebunden, läuft also im Browser, bevor irgendein Skript der Seite selbst
 * ausgeführt wird — deshalb **innerhalb** dieser Funktion definiert (kein
 * Zugriff auf Werte aus dem Modulbereich dieser Datei, Playwright
 * serialisiert die Funktion für die Seite).
 */

/**
 * Vorgabe für `takt_installed_version`, wenn ein Testfall `installedVersion`
 * nicht angibt (E-077, T-166). Höher als jede reale Fassung von Takt, damit
 * eine tatsächlich durchgelaufene Versionsprüfung ohne ausdrückliche,
 * niedrigere Angabe **nie** einen Aktualisierungsdialog auslöst — dieselbe
 * Zahl, die zuvor als Zeile je betroffener Datei stand (T-150) und jetzt
 * genau einmal hier steht.
 */
export const SAFE_INSTALLED_VERSION = "9999.0.0";

/** Rohantwort von `takt_os_user` — `snake_case`, wie `RawOsUser` in `apps/desktop/src/shell.ts`. */
export interface ShellShimOsUser {
  readonly name: string;
  readonly qualified_name: string | null;
  readonly source: string;
  readonly trusted: boolean;
}

/** Rohantwort für `shellState().directory` — `snake_case`, wie `RawDirectoryReport`. */
export interface ShellShimDirectory {
  readonly path: string;
  readonly permissions_applied: boolean;
  readonly permissions_detail: string;
  readonly sync_warning: string | null;
  readonly sync_detail: string | null;
}

/** Rohantwort für `shellState().serviceExit` — `snake_case`, wie `ServiceExit`. */
export interface ShellShimServiceExit {
  readonly code: number | null;
  readonly message: string;
  readonly detail: string | null;
}

/** Rohantwort von `takt_shell_state` — `snake_case`, wie `RawShellState`. */
export interface ShellShimState {
  readonly directory: ShellShimDirectory | null;
  readonly problems: readonly string[];
  readonly service_exit: ShellShimServiceExit | null;
}

export interface ShellShimArgs {
  readonly baseUrl: string;
  readonly headerName: string;
  readonly secret: string;
  readonly osUser: ShellShimOsUser;
  readonly shellState: ShellShimState;
  /**
   * Wie `takt_quit` sich verhält.
   *
   *   `resolve` — die Hülle beendet sich, `invoke` löst auf. Der Normalfall.
   *   `hang`    — die Zusage kommt nie an: die Nachbildung des Erfolgsfalls
   *               aus O-AF, bei dem `app.exit(0)` den Prozess beendet und
   *               darum nie mehr antwortet. `useQuitAttempt` (T-124) macht
   *               daraus nach `QUIT_GRACE_MS` einen sichtbaren Fehlschlag.
   *   `reject`  — die Hülle weist den Befehl ab (z. B. `channel_closed`).
   */
  readonly quit: "resolve" | "hang" | "reject";
  /**
   * Antwort von `takt_installed_version` (A-18.1). Optional: Testfälle, die
   * die Versionsprüfung nicht berühren, brauchen keinen Wert.
   *
   * **E-077, T-166 — die Vorgabe ist umgedreht.** Bis hierhin stand ohne
   * Angabe `"0.0.0"` — derselbe Platzhalter, den E-065 für eine noch nicht
   * vergebene Fassung nennt. Seit `v0.1.0` wirklich veröffentlicht ist und
   * der lokale Dienst die Versionsprüfung real gegen den Bestand fährt
   * (T-146/T-147), machte dieser Platzhalter jede Prüfdatei, die ihn nicht
   * kannte, zeitabhängig: Lief die Prüfung tatsächlich einmal durch (der
   * Zehn-Sekunden-Takt aus `version/checker.ts` ist unverändert scharf),
   * meldete der Dienst `v0.1.0` als neuer als `0.0.0`, und ein **modaler**
   * Aktualisierungsdialog stellte sich vor jede Oberfläche, ohne dass der
   * jeweilige Testfall danach gefragt hatte — betraf auch bestehende Dateien,
   * die zufällig nicht angeschlagen sind (`shell-quit-failure.spec.ts`,
   * `shell-username-lock.spec.ts`).
   *
   * Ohne Angabe steht jetzt {@link SAFE_INSTALLED_VERSION}, eine Fassung, die
   * höher liegt als jede reale Veröffentlichung von Takt — der Dialog bleibt
   * ohne ausdrückliche, ältere Angabe aus, unabhängig davon, ob und wann eine
   * Versionsprüfung im Hintergrund tatsächlich durchläuft. Wer den Dialog
   * messen will (`version-check-live.spec.ts`), sagt es ausdrücklich mit
   * einer echten, niedrigeren Fassung — das ist der einzige Weg, ihn zu
   * bekommen, seit dieser Umkehr.
   */
  readonly installedVersion?: string;
  /**
   * Ausgang von `takt_open_attachment_link`, je nach der übergebenen Adresse
   * (T-150, A-19.9, E-072). Ohne Eintrag für einen Wert antwortet die
   * Nachbildung mit Erfolg — der Normalfall, und derselbe wie bei
   * `takt_open_release`: Diese Nachbildung prüft nichts selbst (die
   * Formprüfung steht bereits `#[cfg(test)]` neben `check_link` in
   * `attachment.rs`, T-147/T-148); sie liefert ausschließlich, was ein
   * Testfall vorgibt. Der Wert ist einer der fünfzehn Schlüssel aus
   * `attachment.rs::Rejection` (A-A-8) — roh, wie ein `Err(String)` aus einem
   * Tauri-Befehl bei Playwright ankommt (`attachmentOutcome`,
   * `apps/desktop/src/shell.ts`, prüft `typeof cause === 'string'`).
   */
  readonly attachmentLinkRejections?: Readonly<Record<string, string>>;
  /** Wie {@link ShellShimArgs.attachmentLinkRejections}, für `takt_open_attachment_file`. */
  readonly attachmentFileRejections?: Readonly<Record<string, string>>;
}

/**
 * Ein Aufruf von `takt_open_release`, wie ihn `TP-VER-13` beobachtet — die
 * Fassungsbezeichnung, mit der die Oberfläche den Befehl gerufen hat, roh und
 * ungeprüft (die Formprüfung selbst liegt in `release.rs` und läuft hier
 * nicht mit; diese Nachbildung zeichnet nur auf, sie urteilt nicht).
 */
export interface RecordedOpenReleaseCall {
  readonly version: unknown;
}

/**
 * Ein Aufruf von `takt_open_attachment_link` bzw. `takt_open_attachment_file`
 * (T-150, TP-ANH-05/-06/-14). Roh und ungeprüft aufgezeichnet — dieselbe
 * Zusicherung wie bei {@link RecordedOpenReleaseCall}: Diese Nachbildung
 * urteilt nicht, sie zeichnet nur auf.
 */
export interface RecordedOpenAttachmentLinkCall {
  readonly url: unknown;
}

export interface RecordedOpenAttachmentFileCall {
  readonly path: unknown;
}

declare global {
  interface Window {
    /** Von `installShellShim` gesetzt; leer, solange kein Testfall diese Datei einbindet. */
    __taktOpenReleaseCalls__?: RecordedOpenReleaseCall[];
    /** Seit T-150: jeder Aufruf von `takt_open_attachment_link`. */
    __taktOpenAttachmentLinkCalls__?: RecordedOpenAttachmentLinkCall[];
    /** Seit T-150: jeder Aufruf von `takt_open_attachment_file`. */
    __taktOpenAttachmentFileCalls__?: RecordedOpenAttachmentFileCall[];
  }
}

export function installShellShim(args: ShellShimArgs): void {
  const openReleaseCalls: RecordedOpenReleaseCall[] = [];
  (globalThis as Record<string, unknown>)["__taktOpenReleaseCalls__"] = openReleaseCalls;

  const openAttachmentLinkCalls: RecordedOpenAttachmentLinkCall[] = [];
  (globalThis as Record<string, unknown>)["__taktOpenAttachmentLinkCalls__"] = openAttachmentLinkCalls;

  const openAttachmentFileCalls: RecordedOpenAttachmentFileCall[] = [];
  (globalThis as Record<string, unknown>)["__taktOpenAttachmentFileCalls__"] = openAttachmentFileCalls;

  const commands: Record<string, (invokeArgs: Record<string, unknown>) => unknown> = {
    takt_service_handshake: () => ({
      base_url: args.baseUrl,
      header_name: args.headerName,
      secret: args.secret,
    }),
    takt_os_user: () => args.osUser,
    takt_shell_state: () => args.shellState,
    takt_quit: () => {
      if (args.quit === "resolve") return null;
      if (args.quit === "reject") {
        throw new Error('E2E-Testfall: Die Nachbildung der Hülle weist „Takt beenden" ab.');
      }
      // 'hang': Genau der Fall, den O-AF behandelt — eine Zusage, die nie
      // ankommt, weil der Erfolgsfall der Tod des eigenen Prozesses ist.
      return new Promise<null>(() => {
        /* löst absichtlich nie auf */
      });
    },
    // A-18.1: Die installierte Fassung kommt aus den eingeprägten Angaben des
    // Erzeugnisses. Diese Nachbildung liefert schlicht den konfigurierten
    // Wert — `release.rs#takt_installed_version` selbst ist bereits durch
    // `cargo test` neben dem Befehl geprüft (T-139), hier zählt nur, dass die
    // Oberfläche den herausgereichten Wert unverändert weiterverarbeitet.
    //
    // E-077, T-166: Vorgabe ohne Angabe ist hier als **Literal** wiederholt
    // (nicht `SAFE_INSTALLED_VERSION` aus dem Modulbereich) — Playwright
    // serialisiert `installShellShim` für `page.addInitScript` über
    // `Function.prototype.toString()` und wertet nur den Funktionskörper
    // erneut aus; ein Verweis auf eine Modulvariable wäre im Browser ein
    // `ReferenceError`, kein Bezug auf denselben Wert (Kopfkommentar dieser
    // Datei: „kein Zugriff auf Werte aus dem Modulbereich"). Beide Stellen
    // müssen deshalb von Hand gleich gehalten werden — genau deshalb bleibt
    // `SAFE_INSTALLED_VERSION` unten als einzige weitere Fundstelle für
    // Testfälle, die denselben Wert kennen müssen, ohne ihn selbst zu raten.
    takt_installed_version: () => args.installedVersion ?? "9999.0.0",
    // A-18.8, A-18.9: „Installieren" öffnet die Release-Seite, **mehr nicht**.
    // Diese Nachbildung tut buchstäblich nichts außer aufzuzeichnen und
    // aufzulösen — sie lädt nichts herunter, öffnet kein Fenster, startet
    // keinen zweiten Befehl. Genau das macht den Fall messbar: Bestünde ein
    // Weg zu einem Download, müsste er über einen **zweiten** Aufruf dieser
    // oder einer anderen Nachbildung laufen, und `window.__taktOpenReleaseCalls__`
    // würde ihn zeigen.
    takt_open_release: (invokeArgs) => {
      openReleaseCalls.push({ version: invokeArgs["version"] });
      return null;
    },
    // A-19.9, A-A-7: ein Verweis öffnet ohne Rückfrage der Oberfläche.
    // Rückfrage und Formprüfung sind hier bewusst nicht nachgebildet (siehe
    // Kommentar an `attachmentLinkRejections` oben) — diese Nachbildung
    // zeichnet nur auf und antwortet mit dem konfigurierten Ausgang.
    takt_open_attachment_link: (invokeArgs) => {
      const url = invokeArgs["url"];
      openAttachmentLinkCalls.push({ url });
      const rejection =
        typeof url === "string" ? args.attachmentLinkRejections?.[url] : undefined;
      if (rejection !== undefined) throw rejection;
      return null;
    },
    // A-19.9, E-072 Punkt 3: Die Rückfrage selbst steht **vor** diesem Aufruf,
    // in der Oberfläche (`AttachmentOpenDialog`) — hier kommt nur an, was nach
    // einer Bestätigung tatsächlich an die Hülle ginge.
    takt_open_attachment_file: (invokeArgs) => {
      const path = invokeArgs["path"];
      openAttachmentFileCalls.push({ path });
      const rejection =
        typeof path === "string" ? args.attachmentFileRejections?.[path] : undefined;
      if (rejection !== undefined) throw rejection;
      return null;
    },
  };

  (globalThis as Record<string, unknown>)["__TAURI_INTERNALS__"] = {
    invoke: async (cmd: string, invokeArgs?: Record<string, unknown>) => {
      const handler = commands[cmd];
      if (handler === undefined) {
        throw new Error(`Diese Nachbildung der Hülle kennt den Befehl „${cmd}" nicht.`);
      }
      return handler(invokeArgs ?? {});
    },
    // `transformCallback` wird von `@tauri-apps/api/core`s `Channel`-Klasse
    // gebraucht; keiner der oben genutzten Befehle sendet einen Kanal.
    transformCallback: () => {
      throw new Error("Diese Nachbildung der Hülle unterstützt keine Kanäle (Channel).");
    },
  };
}
