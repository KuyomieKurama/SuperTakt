/** Fortsetzung über Sortierschlüssel statt Seitenzahl: laufende Änderungen verschieben Seiten. */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export function pageSize(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_PAGE_SIZE;
  const rounded = Math.floor(limit);
  if (rounded < 1) return 1;
  return Math.min(rounded, MAX_PAGE_SIZE);
}

/** Die Kennung löst Gleichstände im Sortierwert eindeutig auf. */
export interface Cursor {
  readonly sort: string;
  readonly id: string;
}

// NUL kommt weder in Kennungen noch Zeitstempeln vor und trennt sie eindeutig.
// Als Escape schreiben: ein rohes NUL würde Git die Datei als binär behandeln.
const SEPARATOR = '\u0000';

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(`${cursor.sort}${SEPARATOR}${cursor.id}`, 'utf8').toString('base64url');
}

/** Unlesbare Marken ergeben null: der Aufrufer beginnt wieder auf der ersten Seite. */
export function decodeCursor(raw: string | undefined): Cursor | null {
  if (raw === undefined || raw === '') return null;
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const index = decoded.indexOf(SEPARATOR);
    if (index <= 0) return null;
    return { sort: decoded.slice(0, index), id: decoded.slice(index + 1) };
  } catch {
    return null;
  }
}
