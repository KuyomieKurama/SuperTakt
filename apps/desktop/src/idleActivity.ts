export interface IdlePeriod { readonly startedAtMs: number; readonly endedAtMs: number }
export interface IdleActivity {
  readonly supported: boolean;
  readonly sampledAtMs: number;
  readonly lastInputAtMs: number;
  readonly periods: readonly IdlePeriod[];
}

export function parseIdleActivity(value: unknown): IdleActivity {
  if (typeof value !== 'object' || value === null) throw new Error('Ungültige Antwort der Inaktivitätserkennung.');
  const item = value as Record<string, unknown>;
  const instant = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
  if (typeof item['supported'] !== 'boolean' || !instant(item['sampledAtMs']) || !instant(item['lastInputAtMs']) ||
      item['lastInputAtMs'] > item['sampledAtMs'] || !Array.isArray(item['periods']) || item['periods'].length > 32) {
    throw new Error('Ungültige Antwort der Inaktivitätserkennung.');
  }
  const periods = item['periods'].map((raw: unknown) => {
    if (typeof raw !== 'object' || raw === null) throw new Error('Ungültiger Inaktivitätszeitraum.');
    const p = raw as Record<string, unknown>;
    if (!instant(p['startedAtMs']) || !instant(p['endedAtMs']) || p['startedAtMs'] >= p['endedAtMs'] || p['endedAtMs'] > (item['sampledAtMs'] as number)) throw new Error('Ungültiger Inaktivitätszeitraum.');
    return { startedAtMs: p['startedAtMs'], endedAtMs: p['endedAtMs'] };
  });
  return { supported: item['supported'], sampledAtMs: item['sampledAtMs'], lastInputAtMs: item['lastInputAtMs'], periods };
}
