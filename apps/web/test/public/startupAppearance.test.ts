/**
 * Der Hochlauf (`apps/web/public/startup-appearance.js`) läuft vor dem ersten
 * Bild und ohne Bündler. Er kann `THEME_PRESETS` nicht importieren und führt
 * die Gestaltungen deshalb als Abschrift.
 *
 * Diese Datei ist der Preis dafür, und sie misst zweierlei — beides an der
 * **Wirkung**, nicht an der Regel (T-284):
 *
 *  1. **Die Abschrift läuft nicht ab.** Für jeden Wert aus `DESIGN_THEMES`
 *     (Domäne) und jeden aus `THEME_PRESETS` (Oberfläche) wird der Hochlauf
 *     einmal ausgeführt. Eine Gestaltung, die dort hinzukommt und hier fehlt,
 *     landet auf `classic` statt auf sich selbst — und dieser Lauf wird rot.
 *     Ein Prüffall, der die Liste im Quelltext **sucht**, wäre beim nächsten
 *     Umbau grün über einem Hochlauf, der wieder alles durchlässt.
 *  2. **`clear` trägt die klassischen Maße.** Die Zusage aus A-21 („die alte
 *     Auswahl `clear` wird klassisch dargestellt") wird nicht gegen den
 *     geschriebenen Attributwert gemessen, sondern gegen `tokens.css`: aus dem
 *     Attribut, das der Hochlauf setzt, werden `--sidebar-width` und
 *     `--text-2xs` aufgelöst, wie der Browser sie auflösen würde. Solange
 *     `:root[data-design-theme="clear"]` dort eigene Maße führt, ist das die
 *     einzige Messung, die den Fehler überhaupt sieht.
 */

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { DESIGN_THEMES } from '@takt/domain';
import { THEME_PRESETS } from '../../src/features/settings/themePresets';

const bootstrap = readFileSync(new URL('../../public/startup-appearance.js', import.meta.url), 'utf8');

function restore(value: unknown, blocked = false): Record<string, string> {
  const dataset: Record<string, string> = {};
  runInNewContext(bootstrap, {
    localStorage: { getItem: () => { if (blocked) throw new Error('blocked'); return typeof value === 'string' ? value : JSON.stringify(value); } },
    document: { documentElement: { dataset } },
  });
  return dataset;
}

const appearance = { version: 1, theme: 'system', designTheme: 'catppuccin-macchiato', mode: 'dark', density: 'compact' };

describe('appearance before the application loads', () => {
  it('restores the fixed dark palette even when Windows uses light mode', () => {
    expect(restore(appearance)).toEqual({ startupTheme: 'system', designTheme: 'catppuccin-macchiato', theme: 'dark', density: 'compact' });
  });
  it('leaves an automatic palette following the OS', () => {
    expect(restore({ ...appearance, designTheme: 'classic', mode: 'auto' })).not.toHaveProperty('theme');
  });
  it('restores an explicit preference for an automatic palette', () => {
    expect(restore({ ...appearance, designTheme: 'classic', mode: 'auto', theme: 'light' }).theme).toBe('light');
  });
  it.each([null, '{broken', { ...appearance, version: 2 }, { ...appearance, theme: 'unknown' }, { ...appearance, mode: 'unknown' }, { ...appearance, density: 'unknown' }])('ignores missing or invalid cache %j', value => {
    expect(restore(value)).toEqual({});
  });
  it('survives disabled web storage', () => expect(restore(appearance, true)).toEqual({}));
});

describe('design themes the bootstrap does not know', () => {
  it.each(['clear', 'zzz-unknown', '<script>', '', 'CLASSIC', 'a'.repeat(80)])('falls back to the classic look for %j', designTheme => {
    expect(restore({ ...appearance, designTheme, mode: 'auto' }).designTheme).toBe('classic');
  });

  it.each([null, 42, { value: 'dracula' }, ['dracula']])('falls back for the non-string %j', designTheme => {
    expect(restore({ ...appearance, designTheme, mode: 'auto' }).designTheme).toBe('classic');
  });

  it('keeps colour mode and density instead of dropping the whole cache', () => {
    expect(restore({ version: 1, theme: 'dark', designTheme: 'clear', mode: 'auto', density: 'compact' }))
      .toEqual({ startupTheme: 'dark', designTheme: 'classic', density: 'compact', theme: 'dark' });
  });

  it('drops the forced colour mode with the design theme it belonged to', () => {
    // `mode` ist die Betriebsart der zwischengespeicherten Gestaltung. Fällt
    // die Gestaltung auf `classic` zurück, fällt die Betriebsart mit ihr auf
    // `auto` — sonst malt der Hochlauf das Dunkel einer Gestaltung, die gleich
    // gar nicht mehr gilt, und das Bild kippt beim ersten Bündelbild zurück.
    expect(restore({ version: 1, theme: 'system', designTheme: 'zzz-retired', mode: 'dark', density: 'comfortable' }))
      .not.toHaveProperty('theme');
  });
});

describe('the transcribed list stays in step with its source', () => {
  it.each(THEME_PRESETS.map(preset => preset.value))('restores the selectable design theme %s unchanged', value => {
    expect(restore({ ...appearance, designTheme: value, mode: 'auto' }).designTheme).toBe(value);
  });

  it.each(DESIGN_THEMES.filter(value => value !== 'clear'))('restores the stored design theme %s unchanged', value => {
    expect(restore({ ...appearance, designTheme: value, mode: 'auto' }).designTheme).toBe(value);
  });
});

/* ---------------------------------------------------------------------- */
/* Die Maße, nicht die Regel                                               */
/* ---------------------------------------------------------------------- */

const tokens = readFileSync(new URL('../../../../packages/ui-tokens/tokens.css', import.meta.url), 'utf8');

/**
 * Löst eine Eigenschaft so auf, wie der Browser sie für ein Wurzelelement mit
 * genau diesem `data-design-theme` auflösen würde: Grundblock `:root`, danach
 * der Gestaltungsblock, letzte Angabe gewinnt. Es wird bewusst nichts
 * Allgemeines nachgebaut — nur die beiden Selektorformen, um die es hier geht.
 */
function rootCustomProperty(designTheme: string, property: string): string | undefined {
  const withoutComments = tokens.replace(/\/\*[\s\S]*?\*\//g, '');
  let resolved: string | undefined;
  for (const [, selector, body] of withoutComments.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const trimmed = (selector ?? '').trim();
    if (trimmed !== ':root' && trimmed !== `:root[data-design-theme="${designTheme}"]`) continue;
    const declaration = [...(body ?? '').matchAll(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'g'))].at(-1);
    if (declaration?.[1]) resolved = declaration[1].trim();
  }
  return resolved;
}

describe('a cached `clear` renders in classic measurements', () => {
  it('confirms the fixture: `clear` still carries its own measurements in tokens.css', () => {
    // Ohne diese Zeile wäre der Prüffall darunter auch dann grün, wenn es gar
    // nichts mehr zu verwechseln gäbe — und damit wertlos als Gegenprobe.
    expect(rootCustomProperty('clear', '--sidebar-width')).toBe('13.5rem');
    expect(rootCustomProperty('clear', '--text-2xs')).toBe('0.75rem');
  });

  it.each(['--sidebar-width', '--text-2xs'])('resolves %s to the classic value after startup', property => {
    const attribute = restore({ ...appearance, designTheme: 'clear', mode: 'auto' }).designTheme ?? '';
    expect(rootCustomProperty(attribute, property)).toBe(rootCustomProperty('classic', property));
  });

  it('resolves an unknown design theme to the classic measurements as well', () => {
    const attribute = restore({ ...appearance, designTheme: 'zzz-retired', mode: 'auto' }).designTheme ?? '';
    expect(rootCustomProperty(attribute, '--sidebar-width')).toBe('15rem');
  });
});
