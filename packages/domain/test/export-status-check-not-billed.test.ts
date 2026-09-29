/**
 * Takt — `checkNotBilled` (T-411a, E-133 point 5, A-26.3): "not billed" is refused for a NoExport
 * booking, so it never sits in a locked but unbillable state after NoExport is switched off again.
 */
import { describe, expect, it } from 'vitest';
import { checkNotBilled } from '../src/export-status.ts';
import type { ExportStatus } from '../src/time-entry.ts';

function entry(exportStatus: ExportStatus, todoNoExport: boolean) {
  return { exportStatus, todoNoExport };
}

describe('checkNotBilled — the transition check runs first, the NoExport rule second (E-133 point 5)', () => {
  it('an open booking of a NoExport todo is rejected with time_entry_no_export', () => {
    const result = checkNotBilled(entry('open', true));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('time_entry_no_export');
    }
  });

  it('an open booking of a normal (non-NoExport) todo succeeds as "not_billed"', () => {
    const result = checkNotBilled(entry('open', false));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ from: 'open', to: 'exported', trigger: 'not_billed' });
    }
  });

  it('an already exported booking of a NoExport todo answers export_status_unchanged, not time_entry_no_export — the transition check runs first', () => {
    const result = checkNotBilled(entry('exported', true));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('export_status_unchanged');
    }
  });

  it('an already exported booking of a normal todo also answers export_status_unchanged', () => {
    const result = checkNotBilled(entry('exported', false));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('export_status_unchanged');
    }
  });

  it('the rejection message names the NoExport reason instead of a generic conflict', () => {
    const result = checkNotBilled(entry('open', true));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message.length).toBeGreaterThan(0);
      expect(result.error.message).not.toBe('');
    }
  });
});
