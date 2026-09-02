// Takt — Einheiten- und Integrationstests (T-008a).
//
// Eine Konfiguration für den ganzen Arbeitsbereich. Die Testpfade folgen der
// Hoheitstabelle aus CLAUDE.md: Tests liegen in `test/` neben dem Paket, das
// sie prüfen, und gehören unit-tester. End-zu-Ende-Tests liegen unter
// `tests/e2e/` und laufen mit Playwright, nicht hier.
import { defineConfig } from 'vitest/config';

/**
 * Abdeckungsschwelle für die drei Pakete, in denen Geld entsteht.
 *
 * Rundung, Exportstatus und der Vorlagen-Motor bestimmen, was auf einer
 * Kundenrechnung steht. Ein Fehler dort fällt nicht beim Bedienen auf, sondern
 * beim Abrechnen. Die Oberfläche ist bewusst nicht mit einer Schwelle belegt:
 * dort deckt Playwright ab, und eine erzwungene Zahl würde nur zu Tests
 * führen, die Bausteine rendern, ohne Verhalten zu prüfen.
 *
 * Glob-Schwellen erben in Vitest 4 nichts von der obersten Ebene — jede Zahl
 * steht deshalb ausgeschrieben da.
 */
const achtzigProzent = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

export default defineConfig({
  test: {
    include: [
      'packages/*/test/**/*.{test,spec}.{ts,tsx,mts}',
      'apps/*/test/**/*.{test,spec}.{ts,tsx,mts}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],

    // Voreinstellung ist Node. Ein Test, der das DOM braucht, sagt das in der
    // Datei selbst über `// @vitest-environment jsdom` — so bleibt sichtbar,
    // welcher Test warum eine Browserumgebung aufmacht.
    environment: 'node',
    globals: false,
    restoreMocks: true,

    // Takt läuft mit fester Sprache und Zeitzone (S-13, E-025). Die Tagesgruppe
    // im Export hängt am Kalendertag der Startzeit — läuft ein Test in einer
    // anderen Zeitzone als die Anwendung, prüft er etwas anderes als das
    // Produkt tut.
    env: {
      TZ: 'Europe/Berlin',
      LANG: 'de_DE.UTF-8',
    },

    coverage: {
      provider: 'v8',

      // `['text', { skipFull: false }]` statt der bloßen Zeichenkette `'text'`
      // (E-048, gemeldet aus T-027): Vitest 4 erkennt über `std-env#isAgent`,
      // ob es unter einem Agenten läuft (u. a. an der Umgebungsvariable
      // `CLAUDECODE`/`CLAUDE_CODE` — genau die Umgebung, in der dieses Team
      // arbeitet) und erzwingt dann selbsttätig `skipFull: true` auf dem
      // `text`-Reporter (`resolveConfig`, Zweig `if (isAgent) { text[1] =
      // { skipFull: true, ...text[1] } }`). `skipFull` blendet jede Datei UND
      // — das ist der gefährliche Teil — jedes Verzeichnis aus, dessen
      // Aggregat 100 % auf Anweisungen, Zweigen und Funktionen erreicht.
      // `packages/domain/src` lag zum Zeitpunkt von E-048 genau dort (die
      // beiden Dateien ohne ausführbaren Code, `settings.ts` und `todo.ts`,
      // verschieben die Quote nicht) und verschwand deshalb spurlos aus der
      // gedruckten Tabelle — nicht nur die Zusammenfassungszeile, sondern
      // auch jede Einzeldatei darunter, obwohl `coverage-final.json` und die
      // Schwellenprüfung selbst die Datei die ganze Zeit korrekt sahen.
      // Der Objekt-Spread in Vitests Zusammenführung wertet zuletzt genannte
      // Schlüssel aus: Ein bereits gesetztes `skipFull: false` in der eigenen
      // Konfiguration gewinnt deshalb gegen das erzwungene `true`. Diese
      // Zeile ist die Gegenprobe UND die Behebung in einem — ohne sie fehlt
      // jedes vollständig abgedeckte Paket lautlos aus der Tabelle, an der
      // `pnpm check` hängt.
      reporter: [['text', { skipFull: false }], 'html', 'lcov'],
      reportsDirectory: 'coverage',

      // Ohne diese Option druckt Vitest überhaupt keine Abdeckungstabelle,
      // sobald ein Test rot ist — also genau in der Phase, in der man sie
      // braucht (R-19, gemeldet aus T-010). Der Bericht entsteht auch bei
      // fehlgeschlagenem Lauf; der Exitcode bleibt davon unberührt.
      reportOnFailure: true,
      include: [
        'packages/domain/src/**/*.ts',
        'packages/storage/src/**/*.ts',
        'packages/export/src/**/*.ts',
      ],
      exclude: ['**/*.d.ts', '**/index.ts'],
      thresholds: {
        'packages/domain/src/**': achtzigProzent,
        'packages/storage/src/**': achtzigProzent,
        // packages/export entsteht in T-007. Die Schwelle steht hier schon,
        // damit sie nicht nachträglich verhandelt wird, wenn der Motor fertig
        // ist und die Zahl unbequem wird.
        'packages/export/src/**': achtzigProzent,
      },
    },
  },
});
