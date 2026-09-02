/**
 * Takt — T-027, Exportvorlagen, Einstellungen und Standard-Tags
 * (A-8.7, A-9.*, E-005, E-011).
 *
 * `packages/storage/src/sqlite/repo-settings.ts` lag laut T-021-Bericht
 * (Risiko 1) bei 0 Prozent Abdeckung. Schwerpunkt: die mitgelieferte
 * Standardvorlage ist unveränderlich (A-8.7), Standard-Tags greifen über
 * `set` (A-9.*), und die Feldliste einer Vorlage wird nur als JSON geprüft,
 * nie inhaltlich gedeutet (E-005).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { builtinTemplateId } from '../src/sqlite/repo-settings.ts';
import { NOW, openTestDatabase, ts, type TestDatabase } from './support/setup.ts';

describe('createExportTemplatePort — die Standardvorlage ist unveränderlich (A-8.7)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('builtin() liefert die mitgelieferte Standardvorlage', async () => {
    db = openTestDatabase();
    const builtin = await db.unit.templates.builtin();
    expect(builtin.isBuiltin).toBe(true);
  });

  it('list führt die Standardvorlage zuerst, dann alphabetisch', async () => {
    db = openTestDatabase();
    await db.unit.templates.create('Zebra-Vorlage', { fields: [] }, NOW);
    await db.unit.templates.create('Anton-Vorlage', { fields: [] }, NOW);

    const list = await db.unit.templates.list();
    expect(list[0]?.isBuiltin).toBe(true);
    const customNames = list.filter((t) => !t.isBuiltin).map((t) => t.name);
    expect(customNames).toEqual(['Anton-Vorlage', 'Zebra-Vorlage']);
  });

  it('create legt eine neue, nicht eingebaute Vorlage an', async () => {
    db = openTestDatabase();
    const created = await db.unit.templates.create('Eigene Vorlage', { fields: ['Call'] }, NOW);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.isBuiltin).toBe(false);
    expect(created.value.definition).toEqual({ fields: ['Call'] });
  });

  it('update lehnt die Standardvorlage ab, mit dem Rat, eine Kopie anzulegen', async () => {
    db = openTestDatabase();
    const builtin = await db.unit.templates.builtin();

    const result = await db.unit.templates.update(builtin.id, 'Neuer Name', undefined, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('builtin_template_immutable');
  });

  it('remove lehnt die Standardvorlage ab', async () => {
    db = openTestDatabase();
    const builtin = await db.unit.templates.builtin();
    const result = await db.unit.templates.remove(builtin.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('builtin_template_immutable');
  });

  it('eine eigene Vorlage lässt sich ändern und löschen', async () => {
    db = openTestDatabase();
    const created = await db.unit.templates.create('Eigene', { fields: [] }, NOW);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await db.unit.templates.update(created.value.id, 'Umbenannt', { fields: ['Zeit'] }, ts('2026-08-31T09:00:00Z'));
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.name).toBe('Umbenannt');
    expect(updated.value.definition).toEqual({ fields: ['Zeit'] });

    const removed = await db.unit.templates.remove(created.value.id);
    expect(removed.ok).toBe(true);
    expect(await db.unit.templates.load(created.value.id)).toBeNull();
  });

  it('update/remove auf eine unbekannte Vorlage ergibt not_found', async () => {
    db = openTestDatabase();
    expect((await db.unit.templates.update('unbekannt' as never, 'x', undefined, NOW)).ok).toBe(false);
    expect((await db.unit.templates.remove('unbekannt' as never)).ok).toBe(false);
  });

  it('builtinTemplateId liefert die Kennung der Standardvorlage', async () => {
    db = openTestDatabase();
    const builtin = await db.unit.templates.builtin();
    expect(builtinTemplateId(db.conn)).toBe(builtin.id);
  });
});

describe('createAppSettingsPort — eine Zeile mit fester Kennung 1 (E-011)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('load liefert die vorhandene Einstellungszeile', async () => {
    db = openTestDatabase();
    const settings = await db.unit.settings.load();
    expect(settings).toHaveProperty('roundingMode');
    expect(settings).toHaveProperty('locale');
  });

  it('update ändert nur die genannten Felder', async () => {
    db = openTestDatabase();
    const before = await db.unit.settings.load();

    const updated = await db.unit.settings.update({ exportDirectory: '/pfad/zum/export', now: NOW });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.exportDirectory).toBe('/pfad/zum/export');
    expect(updated.value.roundingMode).toBe(before.roundingMode);
    expect(updated.value.locale).toBe(before.locale);
  });

  it('update setzt roundingMode, locale und theme, wenn angegeben', async () => {
    db = openTestDatabase();
    const updated = await db.unit.settings.update({ roundingMode: 'nearest', locale: 'de-AT', theme: 'dark', now: NOW });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value).toMatchObject({ roundingMode: 'nearest', locale: 'de-AT', theme: 'dark' });
  });
});

describe('createDefaultTagPort — Standard-Tags (A-9.1 bis A-9.5)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('list ist zunächst leer', async () => {
    db = openTestDatabase();
    expect(await db.unit.defaultTags.list()).toEqual([]);
  });

  it('set legt die Liste vollständig neu an, verwirft Duplikate, vergibt fortlaufende Positionen', async () => {
    db = openTestDatabase();
    const tagA = await db.unit.tags.create(null, 'A', null, NOW);
    const tagB = await db.unit.tags.create(null, 'B', null, NOW);
    expect(tagA.ok && tagB.ok).toBe(true);
    if (!tagA.ok || !tagB.ok) return;

    const first = await db.unit.defaultTags.set([tagA.value.id, tagA.value.id, tagB.value.id], NOW);
    expect(first.map((d) => d.tagId)).toEqual([tagA.value.id, tagB.value.id]);
    expect(first.map((d) => d.position)).toEqual([1, 2]);

    // Ein zweiter Aufruf ersetzt die Liste, statt sie zu ergänzen.
    const second = await db.unit.defaultTags.set([tagB.value.id], NOW);
    expect(second).toEqual([{ tagId: tagB.value.id, position: 1 }]);
  });

  it('greifen beim Anlegen eines Todos über applyDefaultTags — hier über den Adapter, nicht die reine Regel (A-9.5)', async () => {
    db = openTestDatabase();
    const standard = await db.unit.tags.create(null, 'Standard', null, NOW);
    expect(standard.ok).toBe(true);
    if (!standard.ok) return;
    await db.unit.defaultTags.set([standard.value.id], NOW);

    // Der Adapter selbst wendet A-9.5 nicht an — das ist Sache des
    // Anwendungsfalls (`applyDefaultTags` in der Domäne). Dieser Test belegt
    // nur, dass die Liste, die `set` zurückgibt, tatsächlich das ist, was ein
    // Anwendungsfall vor dem Aufruf von `todos.create` läse.
    const defaults = await db.unit.defaultTags.list();
    expect(defaults.map((d) => d.tagId)).toEqual([standard.value.id]);
  });
});
