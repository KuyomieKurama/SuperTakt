/**
 * Takt — A-A-50 sentence 3 (O-JN, T-397): `exportSourceCatalog()` names `group.bookingNotes` as
 * the source of the default template's `Notiz` field. The sentence carries its own boundary (it
 * is the CATALOG description, never the internal todo note — see `note-boundary-property.test.ts`
 * in `packages/export` for that separate guarantee), and `catalog.ts`'s own comment on the field
 * asks for exactly this assertion so a rewording cannot drop the statement unnoticed.
 */
import { describe, expect, it } from 'vitest';
import { exportSourceCatalog } from '../../src/features/export/catalog.ts';

describe('A-A-50 sentence 3 — group.bookingNotes names itself as the default template\'s Notiz source', () => {
  it('the description of group.bookingNotes states it is the source for the "Notiz" field of the default template', () => {
    const description = exportSourceCatalog().sources.find((entry) => entry.path === 'group.bookingNotes')?.description ?? '';
    expect(description).toContain('Quelle für das Feld „Notiz“ der Standardvorlage');
  });
});
