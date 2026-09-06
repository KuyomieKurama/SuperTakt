/**
 * Takt — `apps/web/src/components/Primitives.tsx` und
 * `apps/web/src/app/ToastContext.tsx`, die Schließen-Schaltfläche (O-FW,
 * T-181 ST-09, Auftrag T-185 Punkt 2).
 *
 * ---------------------------------------------------------------------------
 * Was hier gemessen wird, und warum auf zwei verschiedene Arten
 * ---------------------------------------------------------------------------
 *
 * T-181 hat die Beschriftung von „Meldung schliessen" (ohne ß) auf „Meldung
 * schließen" berichtigt — an ZWEI Stellen: der Schließen-Schaltfläche von
 * `InlineMessage` (Seitenfluss) und der von `ToastItem` (Meldungsstapel,
 * `ToastContext.tsx`). Beide Stellen haben denselben zugänglichen Namen und
 * denselben Text; keine hatte danach einen Prüffall (T-184, O-FW) — eine
 * stille Rücknahme an einer der beiden Stellen wäre niemandem aufgefallen.
 *
 * `apps/web/test/**` hat heute keine Rendering-Umgebung (kein jsdom, kein
 * Testing-Library-Aufbau, `environment: 'node'` in der Wurzel-Vitest-Config)
 * — dieselbe Lage, die T-184 Abschnitt 3 für O-EY (`Card`-Titel
 * „Arbeitsplatz") ausdrücklich gemessen und für DIESE eine Zeichenkette als
 * unverhältnismäßig gegenüber einer neuen Rendering-Kette bewertet hat. Für
 * O-EY folgt daraus e2e (eigene Reihe, andere Hoheit). Für O-FW liegt der
 * Fall günstiger, weil sich die beiden Fundstellen technisch unterscheiden:
 *
 * 1. **`InlineMessage`** zieht keinen Haken (`useEffect`, `useState`, …) —
 *    ein Blick über die ganze Datei bestätigt das. Eine Funktionskomponente
 *    ohne Haken ist eine gewöhnliche Funktion: Der Aufruf `InlineMessage(...)`
 *    braucht keinen Renderer, kein DOM und keinen `act()`-Aufruf — er liefert
 *    denselben Elementbaum zurück, den JSX an dieser Stelle bauen würde
 *    (`{ type: IconButton, props: { label: "Meldung schließen", ... } }`).
 *    Der erste Fall unten ruft die ECHTE Produktivfunktion auf und liest die
 *    ECHTEN Werte, die sie an `IconButton` reicht — keine Zeichenkette, die
 *    nur behauptet, dieselbe Datei zu betreffen.
 *
 * 2. **`ToastItem`** (in `ToastContext.tsx`) zieht `useEffect` — ein Aufruf
 *    außerhalb eines echten Renderers schlägt mit „Invalid hook call" fehl,
 *    weil React ohne aktiven Dispatcher läuft. Für diese Stelle bleibt nur
 *    ein schwächerer, aber ehrlicher Wächter: der Quelltext der Datei wird
 *    gelesen und gegen die Aufrufstelle geprüft — kein Aussagen über das
 *    gerenderte Ergebnis, nur darüber, WELCHE Zeichenkette an dieser Stelle
 *    im Quelltext steht. Das ist bewusst schwächer als Fall 1 und wird hier
 *    so benannt, nicht als gleichwertig ausgegeben.
 *
 * Eine vollständige, DOM-gestützte Zugänglichkeits-Prüfung für BEIDE Stellen
 * gehört, sollte sie gewünscht sein, in eine e2e-Reihe (`tests/e2e/`) — mit
 * derselben Begründung wie bei O-EY. Diese Datei schließt nur die Lücke
 * „kein Fall merkt es", nicht mehr.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { IconButton, InlineMessage } from "../../src/components/Primitives";

function isReactElement(node: ReactNode): node is ReactElement<Record<string, unknown>> {
  return typeof node === "object" && node !== null && "type" in node && "props" in node;
}

/** Sucht im Elementbaum einer AUFGERUFENEN Funktionskomponente (kein Renderer, kein DOM) nach dem ersten Element eines bestimmten Typs. */
function findElementByType(node: ReactNode, type: unknown): ReactElement<Record<string, unknown>> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElementByType(child as ReactNode, type);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (!isReactElement(node)) return undefined;
  if (node.type === type) return node;
  return findElementByType(node.props.children as ReactNode, type);
}

function sourceOf(relativeToPackageRoot: string): string {
  const url = new URL(`../../${relativeToPackageRoot}`, import.meta.url);
  return readFileSync(fileURLToPath(url), "utf-8");
}

describe("InlineMessage (Primitives.tsx) — die Schließen-Schaltfläche trägt „Meldung schließen“ (O-FW)", () => {
  it('reicht IconButton wörtlich label="Meldung schließen" — die echte Aufrufstelle, kein Renderer nötig', () => {
    const tree = InlineMessage({
      tone: "info",
      title: "Titel einer Beispielmeldung",
      onDismiss: () => {},
    });

    const closeButton = findElementByType(tree, IconButton);

    expect(closeButton).toBeDefined();
    expect(closeButton?.props.label).toBe("Meldung schließen");
  });

  it('ohne onDismiss entsteht GAR KEINE Schließen-Schaltfläche (Gegenprobe: der Fall oben prüft wirklich diesen Zweig)', () => {
    const tree = InlineMessage({
      tone: "info",
      title: "Titel einer Beispielmeldung",
    });

    expect(findElementByType(tree, IconButton)).toBeUndefined();
  });
});

describe("ToastItem (ToastContext.tsx) — dieselbe Beschriftung, am Quelltext gemessen (O-FW, schwächerer Wächter — s. Dateikopf)", () => {
  it('die Aufrufstelle der Schließen-Schaltfläche im Meldungsstapel trägt label="Meldung schließen"', () => {
    const source = sourceOf("src/app/ToastContext.tsx");
    expect(source).toMatch(/<IconButton\s+label="Meldung schließen"/);
  });
});
