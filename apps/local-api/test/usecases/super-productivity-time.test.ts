import { describe, expect, it } from 'vitest';
import { ownTaskTimeByDay } from '../../src/features/data-transfer/super-productivity-time.ts';

describe('Eigene Tageszeit beim Super-Productivity-Import', () => {
  it('zieht Kinderzeiten vor der Umrechnung in Sekunden ab', () => {
    const tasks = new Map([
      ['child', { timeSpentOnDay: { '2026-08-12': 1600 } }],
    ]);
    expect(ownTaskTimeByDay('parent', { '2026-08-12': 3100 }, ['child'], tasks))
      .toEqual({ secondsByDay: { '2026-08-12': 1 }, parentDays: 1, shortDays: 0 });
  });

  it('meldet Reste unter einer Sekunde und erzeugt keine negativen Zeiten', () => {
    const tasks = new Map([
      ['child', { timeSpentOnDay: { '2026-08-12': 1500, '2026-08-13': 3000 } }],
    ]);
    expect(ownTaskTimeByDay('parent', { '2026-08-12': 2000, '2026-08-13': 1000 }, ['child'], tasks))
      .toEqual({ secondsByDay: {}, parentDays: 2, shortDays: 1 });
  });

  it('ignoriert Selbstverweise, fehlende Kinder und ungültige Kinderzeiten', () => {
    const tasks = new Map([
      ['parent', { timeSpentOnDay: { '2026-08-12': 2000 } }],
      ['child', { timeSpentOnDay: { '2026-08-12': -1000, 'kein-tag': 5000 } }],
    ]);
    expect(ownTaskTimeByDay('parent', { '2026-08-12': 2000 }, ['parent', 'missing', 'child'], tasks))
      .toEqual({ secondsByDay: { '2026-08-12': 2 }, parentDays: 0, shortDays: 0 });
  });
});
