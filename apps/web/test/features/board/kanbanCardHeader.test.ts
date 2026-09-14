import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * T-281 — die Kopfzeile der Kanban-Karte mit drei Marken.
 *
 * Der Fall: Traegt eine Karte Call-Nummer, Erledigt-Kennzeichen **und** Frist
 * (A-19.4), passen die drei Marken nicht nebeneinander in eine Spalte von
 * 17rem bis 21rem. Bis T-281 lief die Frist deshalb aus `.kcard__main` heraus
 * und legte sich ueber den Timerknopf in `.kcard__actions`.
 *
 * Gemessen wurde der Bruch im Browser (Chromium, Spalte 272 px, 80
 * Kombinationen aus Gestaltung, Farbmodus und Dichte: 80 mit Befund, danach 0).
 * Diese Datei kann das nicht: Ohne Layoutmaschine gibt es keine Kastengroesse.
 * Sie haelt deshalb die **Regeln** fest, aus denen die Messung folgt — und
 * jede Zusage hat eine Gegenprobe, damit nicht eine Pruefung gruen bleibt, die
 * nichts mehr misst.
 */

const styles = (name: string): string =>
  readFileSync(new URL(`../../../src/styles/${name}`, import.meta.url), 'utf8');

const COMPONENTS = styles('components.css');
const APP = styles('app.css');

/** Der Rumpf genau einer Regel, ohne Kommentare. Die Selektoren sind eindeutig. */
function block(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...css.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g'))];
  expect(matches, `Regel ${selector} steht genau einmal`).toHaveLength(1);
  return matches[0]?.[1] ?? '';
}

/** Die Deklarationen einer Regel als Tabelle. */
function declarations(css: string, selector: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block(css, selector).split(';')) {
    const at = line.indexOf(':');
    if (at < 0) continue;
    out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return out;
}

/** Aendert genau eine Regel — die Gegenprobe darf nicht die Nachbarn treffen. */
function mutateBlock(css: string, selector: string, change: (body: string) => string): string {
  const body = block(css, selector);
  const changed = css.replace(body, change(body));
  expect(changed, `Gegenprobe an ${selector} veraendert den Bestand`).not.toBe(css);
  return changed;
}

/**
 * Regeln an den drei Marken der Kopfzeile, die Text kuerzen statt umbrechen
 * zu lassen. Eine Frist, die als „Ueberfael…" endet, sieht richtig aus und ist
 * es nicht — deshalb ist Kuerzen hier keine zulaessige Loesung.
 */
function clippingRules(sheets: readonly string[]): readonly string[] {
  const marks = ['kcard__top', 'kcard__call', 'kcard__flag', 'kcard__deadline', 'deadline'];
  const offenders: string[] = [];
  for (const css of sheets) {
    for (const rule of css.matchAll(/(?:^|\n)([^\n{}]+)\{([^}]*)\}/g)) {
      const selector = rule[1] ?? '';
      const body = rule[2] ?? '';
      if (!marks.some((mark) => selector.includes(mark))) continue;
      if (/text-overflow\s*:|line-clamp\s*:|overflow\s*:\s*hidden/.test(body)) {
        offenders.push(selector.trim());
      }
    }
  }
  return offenders;
}

/** Der Schrumpffaktor aus `flex` — `none` ist 0, die Kurzform sonst zweistellig. */
function shrinkFactor(value: string): number {
  if (value === 'none') return 0;
  if (value === 'auto' || value === 'initial') return 1;
  const parts = value.split(/\s+/);
  const second = parts[1];
  if (second === undefined) return Number(parts[0]) === 0 ? 0 : 1;
  return Number.isNaN(Number(second)) ? 1 : Number(second);
}

describe('Kanban-Karte: die Kopfzeile mit drei Marken', () => {
  it('laesst die Kopfzeile umbrechen, statt die dritte Marke herauslaufen zu lassen', () => {
    const top = declarations(COMPONENTS, '.kcard__top');
    expect(top['display']).toBe('flex');
    expect(top['flex-wrap']).toBe('wrap');
  });

  it('haelt die umgebrochene Zeile mit einem Zeilenabstand zusammen', () => {
    const top = declarations(COMPONENTS, '.kcard__top');
    expect(top['row-gap'] ?? top['gap']).toBeDefined();
    // Die zweite Zeile gehoert zum selben Block: nicht weiter auseinander als
    // die Marken nebeneinander.
    if (top['row-gap'] !== undefined && top['gap'] === undefined) {
      expect(top['row-gap']).toBe('var(--space-1)');
      expect(top['column-gap']).toBe('var(--space-2)');
    }
  });

  it('macht die Frist auf der Karte schrumpffaehig — die Marke selbst steht auf `flex: none`', () => {
    expect(shrinkFactor(declarations(APP, '.deadline')['flex'] ?? '')).toBe(0);
    const onCard = declarations(APP, '.kcard__deadline');
    expect(shrinkFactor(onCard['flex'] ?? '')).toBeGreaterThan(0);
    expect(onCard['flex-wrap']).toBe('wrap');
    expect(onCard['max-width']).toBe('100%');
  });

  it('stellt die Kartenregel hinter die allgemeine — gleiche Spezifitaet, die spaetere gewinnt', () => {
    expect(APP.indexOf('\n.kcard__deadline')).toBeGreaterThan(APP.indexOf('\n.deadline {'));
  });

  it('schneidet keine der drei Marken ab — kein Kuerzen, kein Zeilendeckel', () => {
    expect(clippingRules([COMPONENTS, APP])).toEqual([]);
  });

  describe('Gegenproben — jede Zusage wird an einem verletzten Bestand rot', () => {
    it('meldet eine Kopfzeile ohne Umbruch', () => {
      const broken = mutateBlock(COMPONENTS, '.kcard__top', (body) =>
        body.replace('flex-wrap: wrap;', ''),
      );
      expect(declarations(broken, '.kcard__top')['flex-wrap']).toBeUndefined();
    });

    it('meldet eine Kopfzeile, die den Umbruch ausdruecklich abschaltet', () => {
      const broken = mutateBlock(COMPONENTS, '.kcard__top', (body) =>
        body.replace('flex-wrap: wrap;', 'flex-wrap: nowrap;'),
      );
      expect(declarations(broken, '.kcard__top')['flex-wrap']).not.toBe('wrap');
    });

    it('meldet eine Frist, die auf der Karte nicht schrumpfen darf', () => {
      const broken = mutateBlock(APP, '.kcard__deadline', (body) =>
        body.replace('flex: 0 1 auto;', 'flex: none;'),
      );
      expect(shrinkFactor(declarations(broken, '.kcard__deadline')['flex'] ?? '')).toBe(0);
    });

    it('meldet eine gekuerzte Marke', () => {
      const broken = mutateBlock(APP, '.kcard__deadline', (body) => `  text-overflow: ellipsis;${body}`);
      expect(clippingRules([broken])).toEqual(['.kcard__deadline']);
    });
  });
});
