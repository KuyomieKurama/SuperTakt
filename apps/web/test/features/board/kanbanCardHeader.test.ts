import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (name: string): string =>
  readFileSync(new URL(`../../../src/${name}`, import.meta.url), 'utf8');

const KANBAN = source('features/board/Kanban.tsx');
const COMPONENTS = source('styles/components.css');
const APP = source('styles/app.css');

function block(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...css.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g'))];
  expect(matches, `Regel ${selector} steht genau einmal`).toHaveLength(1);
  return matches[0]?.[1] ?? '';
}

function declarations(css: string, selector: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block(css, selector).split(';')) {
    const at = line.indexOf(':');
    if (at < 0) continue;
    out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return out;
}

function mutateBlock(css: string, selector: string, change: (body: string) => string): string {
  const body = block(css, selector);
  return css.replace(body, change(body));
}

function clippingRules(sheets: readonly string[]): readonly string[] {
  const marks = ['kcard__call', 'kcard__flag', 'kcard__deadline'];
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

describe('Kanban-Karte: Metazeile unter dem Titel', () => {
  it('rendert keine Kopfzeile mehr und stellt den Titel vor die Metazeile', () => {
    expect(KANBAN).not.toContain('kcard__top');
    expect(KANBAN.indexOf('className="kcard__title"')).toBeLessThan(
      KANBAN.indexOf('className="kcard__tags"'),
    );
  });

  it('haelt Call, Zustandsmarke und Frist in der umbrechenden gemeinsamen Metazeile', () => {
    const tags = declarations(COMPONENTS, '.kcard__tags');
    expect(tags.display).toBe('flex');
    expect(tags['flex-wrap']).toBe('wrap');
    expect(KANBAN).toContain('className="kcard__call mono"');
    expect(KANBAN).toContain('"kcard__flag"');
    expect(KANBAN).toContain('className="kcard__deadline"');
  });

  it('schneidet keine Kartenmetadaten ab', () => {
    expect(clippingRules([COMPONENTS, APP])).toEqual([]);
  });

  it('meldet eine Metazeile ohne Umbruch', () => {
    const broken = mutateBlock(COMPONENTS, '.kcard__tags', (body) =>
      body.replace('flex-wrap: wrap;', 'flex-wrap: nowrap;'),
    );
    expect(declarations(broken, '.kcard__tags')['flex-wrap']).toBe('nowrap');
  });
});
