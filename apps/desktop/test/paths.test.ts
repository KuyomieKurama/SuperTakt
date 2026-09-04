/**
 * Takt — `apps/desktop/scripts/paths.mjs`, `isInside(folder, file, path)`
 * (T-100, Auftrag aus T-098 „Offene Fragen" 1).
 *
 * Die zwölf Fälle sind wörtlich die aus dem Nachweislauf, den T-098 im
 * Bericht dokumentiert hat (`reports/T-098-frontend-dev.md`, Abschnitt
 * „Nachweis ohne Windows-Rechner", identisch mit dem Kratzverzeichnis-Skript
 * `proof-isinside.mjs`): der Fall aus dem Auslieferungslauf, der
 * Laufwerksbuchstabe klein statt groß, der Nachbarordner mit gleichem Anfang
 * (`local-api` gegen `local-api-alt`), ein anderes Paket, ein anderes
 * Laufwerk, ein Ordner mit Schlusstrenner und der Ordner selbst — je einmal
 * gegen `path.win32` und, wo es einen Sinn ergibt (kein Laufwerksbuchstabe,
 * keine Groß-/Kleinschreibungsfrage), gegen `path.posix`.
 *
 * ---------------------------------------------------------------------------
 * Zur Typprüfung — bewusst NICHT hergestellt
 * ---------------------------------------------------------------------------
 *
 * `apps/desktop` hat bisher kein `test/`-Verzeichnis und keine
 * `tsconfig.test.json`; `tsconfig.json` schließt `scripts/` ausdrücklich aus
 * (Kommentar dort: „.mjs-Bauskripte ohne Typen"). Eine `tsconfig.test.json`
 * anzulegen ist eine gemeinsame Datei (Hoheit Orchestrator laut CLAUDE.md,
 * „alle tsconfig*.json der Pakete") und wird hier deshalb **nicht** angelegt.
 * `pnpm run typecheck:test` deckt diese Datei folglich nicht ab — der Import
 * einer `.mjs`-Datei mit JSDoc aus einer `.ts`-Testdatei läuft unter Vitest
 * trotzdem beanstandungsfrei: Vite/esbuild transpiliert nur, es prüft keine
 * Typen, und zur Laufzeit importiert Node die `.mjs`-Datei unverändert. Siehe
 * Bericht T-100 für den Vorschlag an den Orchestrator.
 *
 * Die Zweigabdeckung von `apps/desktop/scripts` fließt nicht in die Schwelle
 * ein (`vitest.config.ts`, `coverage.include` nennt nur die drei Fachpakete)
 * — diese Datei ist trotzdem kein Zierstück, siehe Bericht.
 */
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- .mjs ohne Deklaration; siehe Kopfkommentar. Läuft unter
// Vitest ohne Typprüfung; ein `tsconfig.test.json` für apps/desktop existiert
// nicht (Hoheit Orchestrator).
import { isInside } from "../scripts/paths.mjs";

describe("isInside — path.win32 (T-098, Fund im Auslieferungslauf)", () => {
  it("Fall 1 — der Fall aus dem Auslieferungslauf: Quelldatei unterhalb des Arbeitsbereichspakets", () => {
    expect(
      isInside(
        "D:\\a\\SuperTakt\\SuperTakt\\apps\\local-api",
        "D:\\a\\SuperTakt\\SuperTakt\\apps\\local-api\\src\\entry.ts",
        path.win32,
      ),
    ).toBe(true);
  });

  it("Fall 2 — Laufwerksbuchstabe klein statt groß: `relative` vergleicht ohne Rücksicht auf Groß-/Kleinschreibung", () => {
    expect(
      isInside(
        "D:\\a\\SuperTakt\\SuperTakt\\apps\\local-api",
        "d:\\a\\SuperTakt\\SuperTakt\\apps\\local-api\\src\\entry.ts",
        path.win32,
      ),
    ).toBe(true);
  });

  it("Fall 3 — Nachbarordner mit gleichem Anfang (`local-api` gegen `local-api-alt`) zählt NICHT als innerhalb", () => {
    expect(
      isInside(
        "D:\\a\\SuperTakt\\SuperTakt\\apps\\local-api",
        "D:\\a\\SuperTakt\\SuperTakt\\apps\\local-api-alt\\x.ts",
        path.win32,
      ),
    ).toBe(false);
  });

  it("Fall 4 — anderes Paket im selben Arbeitsbereich zählt nicht als innerhalb", () => {
    expect(
      isInside(
        "D:\\a\\SuperTakt\\SuperTakt\\apps\\local-api",
        "D:\\a\\SuperTakt\\SuperTakt\\packages\\domain\\src\\x.ts",
        path.win32,
      ),
    ).toBe(false);
  });

  it("Fall 5 — anderes Laufwerk: `path.relative` liefert einen absoluten Pfad, kein Weg führt hinein", () => {
    expect(
      isInside("D:\\a\\apps\\local-api", "C:\\a\\apps\\local-api\\x.ts", path.win32),
    ).toBe(false);
  });

  it("Fall 6 — Ordner mit Schlusstrenner: derselbe Befund wie ohne Trenner", () => {
    expect(
      isInside("D:\\a\\apps\\local-api\\", "D:\\a\\apps\\local-api\\src\\x.ts", path.win32),
    ).toBe(true);
  });

  it("Fall 7 — der Ordner selbst gilt NICHT als innerhalb: `relative` liefert die leere Zeichenkette", () => {
    expect(isInside("D:\\a\\apps\\local-api", "D:\\a\\apps\\local-api", path.win32)).toBe(
      false,
    );
  });
});

describe("isInside — path.posix (dieselben Fälle unter POSIX, soweit sie dort einen Sinn ergeben)", () => {
  it("Fall 8 — derselbe Fall wie unter win32: Quelldatei unterhalb des Arbeitsbereichspakets", () => {
    expect(
      isInside(
        "/home/kerem/Projects/SuperTakt/apps/local-api",
        "/home/kerem/Projects/SuperTakt/apps/local-api/src/entry.ts",
        path.posix,
      ),
    ).toBe(true);
  });

  it("Fall 9 — Nachbarordner mit gleichem Anfang zählt auch unter POSIX nicht als innerhalb", () => {
    expect(
      isInside(
        "/home/kerem/Projects/SuperTakt/apps/local-api",
        "/home/kerem/Projects/SuperTakt/apps/local-api-alt/x.ts",
        path.posix,
      ),
    ).toBe(false);
  });

  it("Fall 10 — anderes Paket zählt auch unter POSIX nicht als innerhalb", () => {
    expect(
      isInside(
        "/home/kerem/Projects/SuperTakt/apps/local-api",
        "/home/kerem/Projects/SuperTakt/packages/domain/src/x.ts",
        path.posix,
      ),
    ).toBe(false);
  });

  it("Fall 11 — Ordner mit Schlusstrenner unter POSIX: derselbe Befund wie ohne Trenner", () => {
    expect(isInside("/a/apps/local-api/", "/a/apps/local-api/src/x.ts", path.posix)).toBe(
      true,
    );
  });

  it("Fall 12 — der Ordner selbst gilt auch unter POSIX NICHT als innerhalb", () => {
    expect(isInside("/a/apps/local-api", "/a/apps/local-api", path.posix)).toBe(false);
  });
});

describe("isInside — Gegenprobe: die alte Form (`startsWith(folder + '/')`) hätte den Windows-Befund nicht gefunden", () => {
  // Dieselbe Vergleichsfunktion wie im Nachweislauf des T-098-Berichts — sie
  // steht hier nicht, um Produktivcode zu duplizieren, sondern um zu zeigen,
  // WARUM `isInside` existiert: Sie belegt, dass ein reiner
  // Zeichenkettenvergleich unter Windows in jedem der Fälle 1, 2 und 6
  // fälschlich `false` liefert.
  const alt = (folder: string, file: string): boolean => file.startsWith(`${folder}/`);

  it("Fall 1 (Auslieferungslauf) — die alte Form liefert fälschlich false, weil Windows-Pfade Rückstriche tragen", () => {
    const folder = "D:\\a\\SuperTakt\\SuperTakt\\apps\\local-api";
    const file = "D:\\a\\SuperTakt\\SuperTakt\\apps\\local-api\\src\\entry.ts";
    expect(alt(folder, file)).toBe(false);
    expect(isInside(folder, file, path.win32)).toBe(true);
  });

  it("Fall 2 (Laufwerksbuchstabe) — die alte Form kennt keine Groß-/Kleinschreibung und liefert ebenfalls false", () => {
    const folder = "D:\\a\\SuperTakt\\SuperTakt\\apps\\local-api";
    const file = "d:\\a\\SuperTakt\\SuperTakt\\apps\\local-api\\src\\entry.ts";
    expect(alt(folder, file)).toBe(false);
    expect(isInside(folder, file, path.win32)).toBe(true);
  });
});
