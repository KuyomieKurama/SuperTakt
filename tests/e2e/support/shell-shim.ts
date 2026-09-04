/**
 * Takt — konfigurierbare Nachbildung der Tauri-Hülle für Dienstzustände, die
 * sich nur über sie erreichen lassen (O-AF, O-AJ, T-130).
 *
 * `support/tauri-shim.ts` bildet eine einzige, unauffällige Hüllenantwort für
 * `web-build-smoke.spec.ts` nach (TP-BUILD-02, ein **gebautes** `apps/web`).
 * Diese Datei braucht etwas anderes: verschiedene Zustände derselben drei
 * Befehle, gegen den echten **Entwicklungsserver** und den echten lokalen
 * Dienst aus `services.ts` — `takt_service_handshake` liefert deshalb hier den
 * echten Sitzungsnachweis dieses Testlaufs (`session.ts`), damit jede sonstige
 * Anfrage (Todos, Zeitbuchungen, …) unverändert gegen den laufenden Dienst
 * geht. Nur `takt_os_user`, `takt_shell_state` und `takt_quit` bestimmt der
 * jeweilige Testfall.
 *
 * Ohne diesen Baustein bliebe `app/connection.ts#connect()` im
 * Entwicklungsbetrieb immer beim `developmentFallback()` stehen
 * (`isShellAvailable()` liefert ohne `__TAURI_INTERNALS__` `false`) — dann
 * wäre `userName` für jeden Fall `"unknown"` und `ShellStatus` bekäme nie eine
 * `shell`-Momentaufnahme zum Anzeigen. `O-AF` und `O-AJ` sind ohne eine
 * Hüllen-Nachbildung von der Oberfläche aus überhaupt nicht erreichbar.
 *
 * Wie `tauri-shim.ts`: über `page.addInitScript(installShellShim, args)`
 * eingebunden, läuft also im Browser, bevor irgendein Skript der Seite selbst
 * ausgeführt wird — deshalb **innerhalb** dieser Funktion definiert (kein
 * Zugriff auf Werte aus dem Modulbereich dieser Datei, Playwright
 * serialisiert die Funktion für die Seite).
 */

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
}

export function installShellShim(args: ShellShimArgs): void {
  const commands: Record<string, () => unknown> = {
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
  };

  (globalThis as Record<string, unknown>)["__TAURI_INTERNALS__"] = {
    invoke: async (cmd: string) => {
      const handler = commands[cmd];
      if (handler === undefined) {
        throw new Error(`Diese Nachbildung der Hülle kennt den Befehl „${cmd}" nicht.`);
      }
      return handler();
    },
    // `transformCallback` wird von `@tauri-apps/api/core`s `Channel`-Klasse
    // gebraucht; keiner der vier oben genutzten Befehle sendet einen Kanal.
    transformCallback: () => {
      throw new Error("Diese Nachbildung der Hülle unterstützt keine Kanäle (Channel).");
    },
  };
}
