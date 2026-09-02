import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Takt — Bau des Outlook-Aufgabenbereichs (S-12, S-13).
 *
 * Drei Dinge sind hier keine Geschmacksfrage:
 *
 * 1. **`base: './'`.** Der Aufgabenbereich wird über eine `SourceLocation` aus
 *    dem Manifest geladen. Absolute Pfade in `index.html` würden gegen die
 *    Wurzel des ausliefernden Servers aufgelöst und nicht gegen das Verzeichnis
 *    des Add-ins; relative Pfade halten das Bündel verschiebbar.
 *
 * 2. **Kein `assetsInlineLimit: 0` und keine externe Herkunft.** Das Add-in
 *    lädt außer `office.js` nichts von außen: keine Schriftart aus einem CDN,
 *    kein Symbolpaket, keine Messbibliothek (B-10.6). Was gebraucht wird, liegt
 *    im Bündel.
 *
 * 3. **`sourcemap: true`.** Der Aufgabenbereich läuft in einem Steuerelement,
 *    an das kein Debugger von außen kommt. Ohne Quellzuordnung ist ein Fehler
 *    im Feld eine Zeilennummer in einer verkürzten Datei.
 *
 * Der Entwicklungsserver bindet auf die Loopback-Adresse (E-001) und benutzt
 * denselben Port, unter dem das Add-in später ausgeliefert wird — siehe
 * `src/config.ts`. Office verlangt HTTPS; das Zertifikat wird nicht hier
 * erzeugt, sondern von dem, der das Add-in ausliefert (siehe README).
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 17844,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 17844,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
  worker: {
    // Der Worker der Call-Nummer-Erkennung wird als Modul geladen. Das
    // Steuerelement von Outlook unter Windows ist WebView2 und damit
    // Chromium — Modul-Worker sind dort vorhanden.
    format: 'es',
  },
});
