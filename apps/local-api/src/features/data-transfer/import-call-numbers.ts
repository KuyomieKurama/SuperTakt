import { runInNewContext } from 'node:vm';
import { checkCallNumber, taktError } from '@takt/domain';
import type { UseCaseResult } from '../../context.ts';

/** Configurable expressions run with a deadline before any import writes. */
export function extractImportCalls(titles: readonly string[], pattern: string): UseCaseResult<readonly (string | null)[]> {
  if (pattern.trim() === '') return { ok: true, value: titles.map(() => null) };
  if (pattern.length > 512) return { ok: false, error: taktError('validation_error', 'Der Call-Regex darf höchstens 512 Zeichen enthalten.') };
  let matches: unknown;
  try {
    matches = runInNewContext(`
      const expression = new RegExp(pattern, 'i');
      titles.map(title => {
        const match = expression.exec(title);
        return match === null ? null : (match[1] ?? match[0]);
      });
    `, { pattern, titles }, { timeout: 250, contextCodeGeneration: { strings: false, wasm: false } });
  } catch (error) {
    const timedOut = typeof error === 'object' && error !== null && 'code' in error && error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT';
    return { ok: false, error: taktError('validation_error', timedOut
      ? 'Der Call-Regex benötigt zu lange. Bitte vereinfachen Sie das Muster.'
      : 'Der Call-Regex ist ungültig. Bitte prüfen Sie das Muster.') };
  }
  if (!Array.isArray(matches)) return { ok: false, error: taktError('validation_error', 'Die Call-Erkennung konnte nicht ausgeführt werden.') };
  const calls: (string | null)[] = [];
  for (const match of matches) {
    if (match === null || match === '') { calls.push(null); continue; }
    const checked = checkCallNumber(match);
    if (!checked.ok) return { ok: false, error: taktError('validation_error', 'Der Call-Regex liefert eine ungültige Call-Nummer. Verwenden Sie die erste Klammergruppe für die Nummer.') };
    calls.push(checked.value);
  }
  return { ok: true, value: calls };
}
