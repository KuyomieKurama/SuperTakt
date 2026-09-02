/**
 * Takt — eine minimale Nachbildung der Tauri-Hülle für `web-build-smoke.spec.ts` (T-055).
 *
 * `apps/web/src/app/connection.ts#developmentFallback` liest Grundadresse und
 * Sitzungsgeheimnis nur, wenn `import.meta.env.DEV === true` ist. Im Bauergebnis
 * ist das fest auf `false` ersetzt (Vite ersetzt `import.meta.env.DEV` beim
 * `build`) — der ganze Umweg über Umgebungsvariablen, den
 * `tests/e2e/support/services.ts` für den Entwicklungsserver benutzt, existiert
 * im gebauten Bündel nicht mehr. Ein gebautes `apps/web` verlangt stattdessen
 * `isShellAvailable()` (`apps/desktop/src/shell.ts`) — geprüft über
 * `'__TAURI_INTERNALS__' in globalThis` — und ruft darüber `invoke('takt_service_handshake', …)`
 * über `@tauri-apps/api/core`, was intern nichts anderes tut als
 * `window.__TAURI_INTERNALS__.invoke(cmd, args, options)` aufzurufen (geprüft
 * am ausgelieferten `core.js` dieses Pakets, nicht angenommen).
 *
 * Diese Datei bildet genau diese eine Methode nach — keine Attrappe des
 * lokalen Dienstes (der läuft echt, aus dem Quelltext, wie in jedem anderen
 * e2e-Lauf auch), sondern eine Attrappe der **Hülle**, die im
 * Auslieferungsbau ohnehin eine dünne Übergabeschicht ist (`shell.ts`
 * ruft nur `invoke` auf und formt `snake_case` in `camelCase` um).
 *
 * Ohne diese Datei bliebe jedes gebaute `apps/web` bei `no_shell` stehen
 * (siehe TP-BUILD-01) — richtig für „läuft es außerhalb von Tauri", aber es
 * ließe sich dann kein einziger Ablauf mehr **im** Bündel prüfen. Mit ihr
 * lässt sich derselbe Ablauf wie in `todo-revival.spec.ts` gegen das
 * tatsächliche `vite build`-Ergebnis fahren (TP-BUILD-02).
 */

export interface TauriShimArgs {
  readonly baseUrl: string;
  readonly headerName: string;
  readonly secret: string;
}

/**
 * Wird über `page.addInitScript(installTauriShim, args)` eingebunden — läuft
 * also im Browser, bevor irgendein Skript der Seite selbst ausgeführt wird,
 * und wird deshalb **innerhalb** dieser Funktion definiert (kein Zugriff auf
 * Werte aus dem Modulbereich dieser Datei, Playwright serialisiert die
 * Funktion für die Seite).
 */
export function installTauriShim(args: TauriShimArgs): void {
  const commands: Record<string, () => unknown> = {
    takt_service_handshake: () => ({
      base_url: args.baseUrl,
      header_name: args.headerName,
      secret: args.secret,
    }),
    // Leerer, unauffälliger Zustand: keine Warnungen, kein Sync-Hinweis, kein
    // beendeter Dienst. Was diese Werte anzeigen, ist nicht Gegenstand von
    // TP-BUILD-02 — das prüft `tests/e2e/support/services.ts` selbst schon
    // gegen den Entwicklungsserver in anderen Spezifikationsdateien.
    takt_shell_state: () => ({ directory: null, problems: [], service_exit: null }),
    takt_quit: () => null,
  };

  (globalThis as Record<string, unknown>)['__TAURI_INTERNALS__'] = {
    invoke: async (cmd: string) => {
      const handler = commands[cmd];
      if (handler === undefined) {
        throw new Error(`Diese Nachbildung der Hülle kennt den Befehl „${cmd}" nicht.`);
      }
      return handler();
    },
    // `transformCallback` wird von `@tauri-apps/api/core`s `Channel`-Klasse
    // gebraucht; keiner der drei oben genutzten Befehle sendet einen Kanal,
    // aber `core.js` ruft die Funktion beim Modulladen nicht auf — nur bei
    // tatsächlicher Nutzung. Ein Platzhalter reicht, damit ein unerwarteter
    // Aufruf einen lesbaren Fehler wirft statt `undefined is not a function`.
    transformCallback: () => {
      throw new Error('Diese Nachbildung der Hülle unterstützt keine Kanäle (Channel).');
    },
  };
}
