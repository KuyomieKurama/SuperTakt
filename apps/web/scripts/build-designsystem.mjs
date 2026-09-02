/**
 * Takt — baut die Anwendung **und** die Musterseite des Designsystems (T-057).
 *
 * `pnpm --filter @takt/web build` baut ausschliesslich die Anwendung. Das ist
 * die Auslieferung, und in ihr hat die Musterseite nichts verloren: Der
 * Auftraggeber hat verlangt, dass sie ueber die normale Oberflaeche nicht mehr
 * erreichbar ist, und eine Datei, die im Buendel liegt, ist erreichbar — auch
 * ohne Navigationspunkt.
 *
 * Dieses Skript ist der zweite Weg, fuer Abnahme und Pruefung. Es setzt
 * `TAKT_DESIGNSYSTEM=1` und ruft denselben Bau auf; `vite.config.ts` nimmt die
 * zweite Eingabe genau dann auf.
 *
 * **Warum ein Node-Skript und nicht `TAKT_DESIGNSYSTEM=1 vite build` im
 * `scripts`-Block.** Diese Schreibweise ist Bourne-Shell-Syntax. Takt wird auf
 * Windows entwickelt und ausgeliefert (E-001, B-8.1); dort startet pnpm die
 * Skripte ueber `cmd`, und `cmd` liest `TAKT_DESIGNSYSTEM=1 vite` als Namen
 * eines Programms. Ein Skript, das auf der Zielplattform nicht laeuft, ist
 * kein Skript.
 *
 * **Warum keine `--mode`-Variante.** `vite build --mode designsystem` waere
 * plattformunabhaengig, wuerde aber `NODE_ENV` offen lassen und damit
 * `import.meta.env.DEV` auf `true` ziehen. In diesem Lauf entsteht auch die
 * Anwendung — mit `DEV === true` bliebe der Entwicklungsrueckfall aus
 * `app/connection.ts` im Buendel stehen, also ein Weg, dem Dienst einen
 * Nachweis aus einer Umgebungsvariablen unterzuschieben. Eine Abnahmeseite ist
 * diesen Preis nicht wert.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const webRoot = fileURLToPath(new URL("../", import.meta.url));
const viteBin = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));

const result = spawnSync(process.execPath, [viteBin, "build"], {
  cwd: webRoot,
  env: { ...process.env, TAKT_DESIGNSYSTEM: "1", NODE_ENV: "production" },
  stdio: "inherit",
});

if (result.error !== undefined && result.error !== null) {
  console.error(`Der Bau der Musterseite kam nicht zustande: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
