/**
 * Takt — Einstiegspunkt des **gebündelten** Sidecars (E-004, T-008b).
 *
 * ## Warum es diese Datei gibt und nicht `apps/local-api/src/index.ts` gebündelt wird
 *
 * Node kann eine Einzeldatei-Anwendung (SEA) nur aus einem **CommonJS**-Modul
 * bauen. `index.ts` des Dienstes benutzt aber `await main()` auf oberster
 * Ebene, und ein Top-Level-`await` lässt sich nicht nach CommonJS übersetzen —
 * esbuild bricht dort mit einem Fehler ab, statt still etwas Falsches zu
 * erzeugen.
 *
 * Diese Datei ruft dieselbe Funktion ohne Top-Level-`await` auf. Sie ist die
 * einzige Zeile Unterschied zwischen dem Dienst, der im Entwicklungsbetrieb
 * über `node apps/local-api/src/index.ts` läuft, und dem, der in der Hülle
 * läuft. Fachlogik steht hier keine.
 *
 * ## Warum der Import auf eine `.ts`-Datei zeigt
 *
 * `@takt/local-api` hat keine `exports`-Tabelle und liefert kein `dist/`. Das
 * gilt genauso für `@takt/domain` und `@takt/storage` — beide zeigen in ihren
 * `exports` auf Quelltext. Der Bündler übersetzt sie deshalb mit und führt sie
 * **nicht** als „external"; `scripts/build-sidecar.mjs` prüft das nach dem
 * Bündeln und bricht ab, wenn doch etwas außerhalb von `node:*` extern bleibt.
 * Das ist die Stelle, an der R-04 zuschlägt, wenn es niemand nachprüft.
 */

import { main } from '@takt/local-api/src/main.ts';

/** Beendigungscode für „gestartet, aber nicht hochgekommen". */
const EXIT_STARTUP = 70;

main().catch((error: unknown) => {
  // Kein Aufrufstapel und kein Wert aus einer Anfrage — nur die Meldung. Der
  // Text geht nach `stderr` und damit in die Hände der Hülle, nicht an einen
  // HTTP-Client (B-2.4).
  const detail = error instanceof Error ? error.message : 'Unbekannter Fehler';
  process.stderr.write(`Der lokale Dienst konnte nicht starten: ${detail}\n`);
  process.exit(EXIT_STARTUP);
});
