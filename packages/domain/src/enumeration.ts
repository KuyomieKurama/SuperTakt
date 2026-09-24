import { visibleText } from './characters.ts';

/** Ohne Komma vor „und“. Eine leere Liste ergibt einen leeren Text. */
export function enumerateGerman(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} und ${parts.slice(-1).join('')}`;
}

/**
 * Ein **Name** in deutschen Anführungszeichen.
 *
 * Sie stehen hier und nicht am Aufrufer, damit nicht die eine Fläche „Ost“ und
 * die andere "Ost" schreibt. Ohne sie läse sich „Betroffen sind die Regeln Ost,
 * Nord und Abrechnung.“, und ein Name mit einem Leerzeichen darin wäre nicht
 * mehr abgegrenzt.
 */
export function quoteName(name: string): string {
  // O-AN: a stored name may predate the name check (archive, old add-in); a direction mark
  // inside the quotes would turn the whole sentence around. Clean names stay unchanged.
  return `„${visibleText(name)}“`;
}

/** Kein „Pool“ oder „Spalte“ voranstellen: Die Namen enthalten keine Information über die Fläche. */
export function enumerateNames(names: readonly string[]): string {
  return enumerateGerman(names.map(quoteName));
}
