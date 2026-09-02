/**
 * Takt — T-010, Tags/Ordner-Zyklen, Pools und Standard-Tags.
 *
 * Testfälle: TP-TAG-02 (Zyklusprüfung), TP-TAG-04 (Pool-Zugehörigkeit folgt
 * Tags, Domänenanteil), TP-DTAG-04 (Standard-Tags, Domänenregel).
 * docs/testplan.md, Abschnitte 6 und 7.
 *
 * TP-TAG-01 (vier Ebenen tief anlegen) ist bewusst NICHT hier: Die Tiefe ist
 * laut `tag.ts` eine Eigenschaft der Adjazenzliste in `packages/storage`
 * (E-022, keine gespeicherte Tiefe, keine künstliche Begrenzung im Typ) und
 * damit ein Speicher-Integrationsfall, keine reine Domänenfunktion — es gibt
 * in `tag.ts` keine Funktion, die "Tiefe" überhaupt entgegennimmt oder
 * validiert. Siehe Bericht T-010-unit-tester für den entsprechenden Hinweis an
 * domain-dev/e2e-tester.
 *
 * ROT ZUERST: `checkFolderMove`, `matchesPool`, `applyDefaultTags` existieren
 * nur als Funktionstypen.
 *
 * NACHTRAG T-010b: alle drei Funktionen existieren seit T-009 unter genau
 * diesen Namen; die beiden `@ts-expect-error`-Kommentare über den Importen
 * sind damit entfernt (siehe rounding.test.ts für dieselbe Begründung).
 */
import { describe, expect, it } from 'vitest';
import { checkFolderMove, matchesPool } from '../src/tag.js';
import { applyDefaultTags } from '../src/tag.js';
import type { TagId, TagFolderId } from '../src/kernel.js';

const folderId = (value: string) => value as unknown as TagFolderId;
const tagId = (value: string) => value as unknown as TagId;

describe('TP-TAG-02 — Zyklusprüfung beim Verschieben von Tag-Ordnern (A-4.6)', () => {
  it('ein Ordner darf nicht unter sich selbst gehängt werden', () => {
    const self = folderId('folder-a');
    const result = checkFolderMove({ folderId: self, newParentId: self, targetAncestors: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('tag_folder_cycle');
    }
  });

  it('ein Ordner darf nicht unter einen seiner eigenen Nachfahren (z. B. Enkelordner) gehängt werden', () => {
    // Vier Ebenen tief, wie in TP-TAG-01 gefordert: Wurzel -> A -> B -> C -> D.
    // Versuch: A unter D hängen (D ist Enkel-Enkel von A). targetAncestors
    // sind laut CheckFolderMove-Vertrag die Vorfahren des Zielordners D, vom
    // Ziel aufwärts bis zur Wurzel — enthält also A.
    const a = folderId('a');
    const b = folderId('b');
    const c = folderId('c');
    const d = folderId('d');
    const result = checkFolderMove({ folderId: a, newParentId: d, targetAncestors: [c, b, a] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('tag_folder_cycle');
    }
  });

  it('ein Ordner darf unter einen völlig unabhängigen Ordner verschoben werden', () => {
    const a = folderId('a');
    const unrelated = folderId('unrelated');
    const result = checkFolderMove({ folderId: a, newParentId: unrelated, targetAncestors: [] });
    expect(result.ok).toBe(true);
  });

  it('ein Ordner darf auf die Wurzelebene verschoben werden (newParentId: null)', () => {
    const a = folderId('a');
    const result = checkFolderMove({ folderId: a, newParentId: null, targetAncestors: [] });
    expect(result.ok).toBe(true);
  });
});

describe('TP-TAG-04 — Pool-Zugehörigkeit folgt Tags (A-3.2, A-3.4), Domänenanteil matchesPool', () => {
  it('matchMode "any": mindestens ein Regel-Tag reicht', () => {
    const result = matchesPool({
      todoTagIds: [tagId('t-support')],
      ruleTagIds: [tagId('t-support'), tagId('t-billing')],
      matchMode: 'any',
    });
    expect(result).toBe(true);
  });

  it('matchMode "any": kein Treffer, wenn kein Regel-Tag am Todo hängt', () => {
    const result = matchesPool({
      todoTagIds: [tagId('t-internal')],
      ruleTagIds: [tagId('t-support'), tagId('t-billing')],
      matchMode: 'any',
    });
    expect(result).toBe(false);
  });

  it('matchMode "all": alle Regel-Tags müssen am Todo hängen', () => {
    const both = matchesPool({
      todoTagIds: [tagId('t-support'), tagId('t-billing')],
      ruleTagIds: [tagId('t-support'), tagId('t-billing')],
      matchMode: 'all',
    });
    expect(both).toBe(true);

    const onlyOne = matchesPool({
      todoTagIds: [tagId('t-support')],
      ruleTagIds: [tagId('t-support'), tagId('t-billing')],
      matchMode: 'all',
    });
    expect(onlyOne).toBe(false);
  });

  it('eine leere Pool-Regel trifft nichts — auch im Modus "all" nicht (Annahme 3, T-009-domain-dev)', () => {
    // Wörtlich aus dem Bericht des domain-dev: "Die mathematisch saubere
    // Lesart 'alle null Bedingungen sind erfüllt' wäre fachlich falsch: Ein
    // Pool, dessen Regel noch nicht fertig eingerichtet ist, hätte
    // schlagartig jedes Todo als Mitglied." Ohne diesen Test bliebe die
    // Kurzschluss-Zeile `if (ruleTagIds.length === 0) return false` in
    // matchesPool ungeprüft — ein `.every(...)` auf einem leeren Array liefert
    // in JavaScript `true`, genau die falsche, aber "mathematisch saubere" Lesart.
    const withTagsOnTodo = matchesPool({ todoTagIds: [tagId('t-support')], ruleTagIds: [], matchMode: 'all' });
    const withoutTagsOnTodo = matchesPool({ todoTagIds: [], ruleTagIds: [], matchMode: 'all' });
    const anyMode = matchesPool({ todoTagIds: [tagId('t-support')], ruleTagIds: [], matchMode: 'any' });

    expect(withTagsOnTodo).toBe(false);
    expect(withoutTagsOnTodo).toBe(false);
    expect(anyMode).toBe(false);
  });

  it('Entfernen des Pool-Tags vom Todo lässt die Zugehörigkeit verschwinden — reine Funktion, kein gespeicherter Zustand', () => {
    // TP-TAG-04, Schritt 2: "Das Tag vom Todo entfernen, Pool-Ansicht erneut
    // prüfen." Auf Domänenebene heißt das: derselbe Aufruf mit einer Tagliste
    // ohne das entfernte Tag liefert sofort false, ohne dass irgendwo eine
    // Mitgliedschaft "aufgeräumt" werden müsste (A-3.4).
    const withTag = matchesPool({ todoTagIds: [tagId('t-support')], ruleTagIds: [tagId('t-support')], matchMode: 'any' });
    const withoutTag = matchesPool({ todoTagIds: [], ruleTagIds: [tagId('t-support')], matchMode: 'any' });
    expect(withTag).toBe(true);
    expect(withoutTag).toBe(false);
  });
});

describe('TP-DTAG-04 — Standard-Tags, Domänenregel (A-9.1, A-9.3, A-9.5)', () => {
  it('vereinigt gewählte und Standard-Tags, Standard-Tags zuerst in konfigurierter Reihenfolge', () => {
    const selected = [tagId('t-manual')];
    const defaults = [
      { tagId: tagId('t-default-1'), position: 0 },
      { tagId: tagId('t-default-2'), position: 1 },
    ];

    const result = applyDefaultTags(selected, defaults);

    expect(result).toEqual([tagId('t-default-1'), tagId('t-default-2'), tagId('t-manual')]);
  });

  it('Duplikate zwischen gewählten und Standard-Tags werden zusammengefasst', () => {
    const selected = [tagId('t-default-1'), tagId('t-manual')];
    const defaults = [{ tagId: tagId('t-default-1'), position: 0 }];

    const result = applyDefaultTags(selected, defaults);

    expect(result).toEqual([tagId('t-default-1'), tagId('t-manual')]);
  });

  it('ohne konfigurierte Standard-Tags bleiben genau die gewählten Tags erhalten', () => {
    const result = applyDefaultTags([tagId('t-manual')], []);
    expect(result).toEqual([tagId('t-manual')]);
  });

  it('dieselbe Funktion liefert für dieselbe Standard-Tag-Konfiguration dasselbe Ergebnis, unabhängig vom Entstehungsweg (A-9.5)', () => {
    // TP-DTAG-04 verlangt ausdrücklich, dass es "nur einen Erzeugungspfad"
    // gibt, den Hauptoberfläche und Add-in beide aufrufen. Auf reiner
    // Funktionsebene heißt das: Aufruf mit denselben Argumenten liefert
    // dasselbe Ergebnis — es gibt keinen versteckten Zustand, der zwischen
    // zwei Aufrufern (Web vs. Add-in) unterschiedlich wäre.
    const defaults = [{ tagId: tagId('t-default-1'), position: 0 }];
    const fromWeb = applyDefaultTags([], defaults);
    const fromAddin = applyDefaultTags([], defaults);
    expect(fromWeb).toEqual(fromAddin);
  });
});
