import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Die Design-Token liegen seit T-008a in `packages/ui-tokens` und nicht mehr
 * unter `src/styles/`, weil das Outlook-Add-in dieselben Werte braucht (A-10.6)
 * und zwei Kopien von 606 Zeilen Farbwerten auseinanderlaufen.
 *
 * `src/main.tsx` importiert sie seit T-018 unter ihrem Paketnamen
 * (`@takt/ui-tokens/tokens.css`). Die Zuordnung unter `resolve.alias`, die
 * T-008a als Bruecke gesetzt hatte, ist damit ersatzlos entfallen: Es gibt
 * jetzt genau einen Weg zur Datei, und der laeuft ueber die `exports`-Tabelle
 * des Pakets. `scripts/contrast-check.mjs` liest sie ohne Vite direkt vom
 * Dateisystem — deshalb durfte die Aufloesung nie nur in dieser Datei stehen.
 *
 * `base.css` bleibt bewusst in `apps/web` (E-040): Geteilt werden Werte, nicht
 * Zuruecksetzung und Grundlayout einer eigenstaendigen Anwendung.
 */

/**
 * Die Musterseite des Designsystems ist ein zweiter Einstiegspunkt (T-057).
 *
 * Der Auftraggeber wollte sie aus der Navigation heraus haben, aber nicht
 * verlieren: Sie traegt die Abnahme der gemessenen Kontrastpaare und ist die
 * einzige Stelle, an der alle Zustaende nebeneinander stehen. Ein
 * Navigationspunkt ist der falsche Ort dafuer, ein eigener Einstiegspunkt der
 * richtige.
 *
 * **Im Entwicklungsbetrieb** liefert Vite jede HTML-Datei im Wurzelverzeichnis
 * aus, ohne dass sie hier stehen muss: `pnpm dev` und dann
 * `http://127.0.0.1:5173/designsystem.html`.
 *
 * **Im Bau** entsteht sie nur, wenn `TAKT_DESIGNSYSTEM=1` gesetzt ist. Das ist
 * die eigentliche Zusicherung dieser Datei: Ohne die Variable gibt es
 * `designsystem.html` im `dist` nicht — also auch nicht im Buendel, das die
 * Tauri-Huelle laedt, und damit gibt es im ausgelieferten Takt keine Adresse,
 * unter der die Musterseite antworten koennte.
 *
 * `pnpm --filter @takt/web build:designsystem` setzt die Variable und baut
 * beide Seiten, fuer die Abnahme.
 */
const designsystemRequested = process.env["TAKT_DESIGNSYSTEM"] === "1";

const entry = (name: string): string =>
  fileURLToPath(new URL(`./${name}`, import.meta.url));

// Takt laeuft lokal (E-001). Der Entwicklungsserver bindet deshalb bewusst
// nur auf die Loopback-Adresse und gibt nichts ins Netz frei.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: designsystemRequested
        ? { index: entry("index.html"), designsystem: entry("designsystem.html") }
        : { index: entry("index.html") },
    },
  },
});
