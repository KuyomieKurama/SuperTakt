/**
 * Takt — T-069, `boardAppearances` (E-054, T-066).
 *
 * `packages/domain/src/board.ts` lag laut T-066-Bericht (Abschnitt 5, Risiko
 * "R-neu") bei 10 % Abdeckung: Die Funktion wurde über `proof:openapi`
 * (Abschnitt 11, fester Bestand von vier Spalten und zwei Karten) gefahren,
 * hatte aber keinen eigenen Prüffall in `packages/domain/test/**`. Diese Datei
 * schließt genau diese Lücke — die vier Fälle aus der "Offenen Frage 1" des
 * T-066-Berichts, dazu die leere Regel und die Übereinstimmung mit
 * `matchesPool` als eigenständiger Nachweis.
 *
 * Der Fall, der zählt und der vorher nicht geben konnte: Bei `todo_status`
 * stand eine Karte in genau einer Spalte, weil `status_id` ein einzelner Wert
 * war. Eine Spalte ist jetzt eine Regel über Tags — mehrere Regeln können
 * gleichzeitig zutreffen, und `boardAppearances` ist die einzige Stelle, die
 * das für die Oberfläche zusammenzieht. Eine falsche Umsetzung zeigt hier eine
 * von zwei Arten von Fehlern: Sie zählt zutreffende Regel-**Terme** statt
 * zutreffende **Spalten** und listet dieselbe Spalte mehrfach, sobald eine
 * Karte über mehr als ein Tag derselben Regel hineinpasst.
 *
 * ROT ZUERST, nachgewiesen als Diskriminierungsfähigkeit statt als fehlende
 * Funktion: `boardAppearances` existiert bereits vollständig seit T-066 (sie
 * ist rein und war nie ein Funktionstyp-Stub wie z. B. `matchesPool` in
 * T-010). Ein literales "Cannot find module" wäre hier keine ehrliche
 * Rot-Phase. Der Rot-Nachweis läuft stattdessen über eine absichtlich falsche
 * Vergleichsimplementierung (`boardAppearancesCountingRuleTerms`, unten,
 * ausschließlich in dieser Testdatei — keine Zeile in `src/`): Sie bildet
 * exakt den im T-069-Auftrag beschriebenen Fehler nach und wurde zuerst gegen
 * `expect(...).toEqual(expected)` laufen gelassen. Der Lauf schlug fehl (siehe
 * Bericht T-069-unit-tester, Abschnitt "Rot vor Grün" für die mitgeschnittene
 * Fehlermeldung); die hier stehende Fassung vergleicht deshalb ausdrücklich
 * gegen die falsche Form UND gegen die echte `boardAppearances`, damit der
 * Beweis dauerhaft im grünen Lauf sichtbar bleibt, statt als einmaliger
 * Fehlschlag wieder zu verschwinden.
 */
import { describe, expect, it } from 'vitest';
import { boardAppearances } from '../src/board.js';
import type { BoardAppearance, BoardCard, BoardColumnRule } from '../src/board.js';
import type { PoolId, TagId, TodoId } from '../src/kernel.js';

const tagId = (value: string) => value as unknown as TagId;
const poolId = (value: string) => value as unknown as PoolId;
const todoId = (value: string) => value as unknown as TodoId;

// ---------------------------------------------------------------------------
// Fall 1 — eine Karte in mehreren Spalten (der Fall, den es bei Status nicht
// geben konnte).
// ---------------------------------------------------------------------------

describe('boardAppearances — eine Karte kann in mehreren Spalten gleichzeitig stehen (E-054)', () => {
  it('eine Karte, die zwei Spaltenregeln erfüllt, erscheint mit beiden Kennungen in Spaltenreihenfolge', () => {
    // Angelehnt an die Tabelle aus dem T-066-Bericht (Abschnitt 5): eine Spalte
    // über ein Tag, eine über einen Ordner (hier: bereits aufgelöst zu Tags —
    // das Auflösen ist Aufgabe des Ports, nicht dieser Domänenfunktion), eine
    // über zwei Tags im Modus "any", und eine ohne Regel.
    const columnBeratung: BoardColumnRule = {
      columnId: poolId('col-beratung'),
      ruleTagIds: [tagId('beratung')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const columnMandant: BoardColumnRule = {
      columnId: poolId('col-mandant'),
      ruleTagIds: [tagId('mandant-a'), tagId('mandant-b')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const columnRueckfrage: BoardColumnRule = {
      columnId: poolId('col-rueckfrage'),
      ruleTagIds: [tagId('rueckfrage')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const columns = [columnBeratung, columnMandant, columnRueckfrage];

    const card: BoardCard = {
      todoId: todoId('todo-1'),
      // Trifft Spalte 1 (Beratung) und Spalte 3 (Rückfrage), nicht Spalte 2.
      tagIds: [tagId('beratung'), tagId('rueckfrage')],
    };

    const result = boardAppearances(columns, [card]);

    expect(result).toEqual<readonly BoardAppearance[]>([
      { todoId: todoId('todo-1'), columnIds: [poolId('col-beratung'), poolId('col-rueckfrage')] },
    ]);
  });

  it('eine Karte, die genau eine Spaltenregel erfüllt, erscheint NICHT in der Liste — die Liste führt nur Mehrfache', () => {
    const columnBeratung: BoardColumnRule = {
      columnId: poolId('col-beratung'),
      ruleTagIds: [tagId('beratung')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const columnRueckfrage: BoardColumnRule = {
      columnId: poolId('col-rueckfrage'),
      ruleTagIds: [tagId('rueckfrage')],
      matchMode: 'any',
      unresolvedRequired: false,
    };

    const card: BoardCard = { todoId: todoId('todo-2'), tagIds: [tagId('beratung')] };

    const result = boardAppearances([columnBeratung, columnRueckfrage], [card]);

    // Nicht "leere columnIds", sondern gar kein Eintrag für diese Karte.
    expect(result).toEqual([]);
  });

  it('von drei eingerichteten Spalten stehen die Kennungen in Spaltenreihenfolge, nicht in der Reihenfolge des Fundes', () => {
    // Die Karte trifft zuerst (im Array) die letzte Spalte über ihre Tags nicht
    // eindeutig vor der ersten — die Prüfung stellt sicher, dass die
    // Ausgabereihenfolge an der Spaltenliste hängt, nicht an einer zufälligen
    // internen Reihenfolge der zutreffenden Tags.
    const first: BoardColumnRule = {
      columnId: poolId('col-a'),
      ruleTagIds: [tagId('x')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const second: BoardColumnRule = {
      columnId: poolId('col-b'),
      ruleTagIds: [tagId('y')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const third: BoardColumnRule = {
      columnId: poolId('col-c'),
      ruleTagIds: [tagId('z')],
      matchMode: 'any',
      unresolvedRequired: false,
    };

    const card: BoardCard = { todoId: todoId('todo-3'), tagIds: [tagId('z'), tagId('x'), tagId('y')] };

    const result = boardAppearances([first, second, third], [card]);

    expect(result).toEqual([
      { todoId: todoId('todo-3'), columnIds: [poolId('col-a'), poolId('col-b'), poolId('col-c')] },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Fall 2 — leere Regel trifft nichts, auch im Modus "all".
// ---------------------------------------------------------------------------

describe('boardAppearances — eine Spalte ohne Regel zeigt nichts, nicht alles (T-009, A-3.4)', () => {
  it('eine leere Regel im Modus "any" trifft keine Karte', () => {
    const emptyColumn: BoardColumnRule = { columnId: poolId('col-leer'), ruleTagIds: [], matchMode: 'any', unresolvedRequired: false };
    const otherColumn: BoardColumnRule = {
      columnId: poolId('col-andere'),
      ruleTagIds: [tagId('t')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const card: BoardCard = { todoId: todoId('todo-4'), tagIds: [tagId('t')] };

    // Die Karte trifft "otherColumn" allein — ein einzelner Treffer erscheint
    // nicht in der Liste (Fall 1). Die leere Regel darf daran nichts ändern.
    expect(boardAppearances([emptyColumn, otherColumn], [card])).toEqual([]);
  });

  it('eine leere Regel im Modus "all" trifft ebenfalls keine Karte — nicht "jede von null Bedingungen ist erfüllt"', () => {
    // Der naheliegende, falsche Kurzschluss bei "all" wäre: eine leere Menge
    // von Bedingungen ist per Definition immer erfüllt (vacuous truth). Genau
    // das verbietet matchesPool ausdrücklich (tag.ts: "if (ruleTagIds.length
    // === 0) return false" — vor der any/all-Verzweigung).
    const emptyAllColumn: BoardColumnRule = { columnId: poolId('col-leer-all'), ruleTagIds: [], matchMode: 'all', unresolvedRequired: false };
    const otherColumn: BoardColumnRule = {
      columnId: poolId('col-andere'),
      ruleTagIds: [tagId('t')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const card: BoardCard = { todoId: todoId('todo-5'), tagIds: [tagId('t'), tagId('irgendwas-anderes')] };

    expect(boardAppearances([emptyAllColumn, otherColumn], [card])).toEqual([]);
  });

  it('zwei Spalten ohne Regel liefern für keine Karte eine Mehrfachnennung, auch wenn die Karte viele Tags trägt', () => {
    const emptyOne: BoardColumnRule = { columnId: poolId('col-1'), ruleTagIds: [], matchMode: 'any', unresolvedRequired: false };
    const emptyTwo: BoardColumnRule = { columnId: poolId('col-2'), ruleTagIds: [], matchMode: 'all', unresolvedRequired: false };
    const card: BoardCard = {
      todoId: todoId('todo-6'),
      tagIds: [tagId('a'), tagId('b'), tagId('c')],
    };

    expect(boardAppearances([emptyOne, emptyTwo], [card])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Fall 3 — mehrere zutreffende Regelterme derselben Spalte ergeben eine
// Nennung, nicht mehrere. Das ist der Fall, an dem eine falsche Umsetzung
// dieselbe Karte doppelt zeigt.
// ---------------------------------------------------------------------------

describe('boardAppearances — mehrere zutreffende Regelterme EINER Spalte zählen als EINE Nennung', () => {
  it('Modus "any" mit fünf Regel-Tags: eine Karte mit dreien davon erscheint einmal, nicht dreimal', () => {
    const wideColumn: BoardColumnRule = {
      columnId: poolId('col-weit'),
      ruleTagIds: [tagId('t1'), tagId('t2'), tagId('t3'), tagId('t4'), tagId('t5')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    // Eine zweite Spalte, damit die Karte überhaupt als Mehrfachnennung
    // qualifiziert (Fall 1: ein einzelner Treffer erscheint nicht).
    const otherColumn: BoardColumnRule = {
      columnId: poolId('col-andere'),
      ruleTagIds: [tagId('other')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const card: BoardCard = {
      todoId: todoId('todo-7'),
      // Trifft drei der fünf Regel-Tags von "wideColumn" — drei zutreffende
      // Terme derselben Spalte.
      tagIds: [tagId('t1'), tagId('t3'), tagId('t5'), tagId('other')],
    };

    const result = boardAppearances([wideColumn, otherColumn], [card]);

    expect(result).toHaveLength(1);
    const appearance = result[0];
    expect(appearance?.columnIds).toEqual([poolId('col-weit'), poolId('col-andere')]);
    // Die entscheidende Zeile: "col-weit" steht genau einmal in der Liste,
    // nicht dreimal (einmal je zutreffendem Regel-Tag).
    expect(appearance?.columnIds.filter((id) => id === poolId('col-weit'))).toHaveLength(1);
  });

  it('Modus "all" mit drei Regel-Tags, alle drei zutreffend: ebenfalls eine Nennung, nicht drei', () => {
    const allColumn: BoardColumnRule = {
      columnId: poolId('col-all'),
      ruleTagIds: [tagId('a'), tagId('b'), tagId('c')],
      matchMode: 'all',
      unresolvedRequired: false,
    };
    const otherColumn: BoardColumnRule = {
      columnId: poolId('col-andere'),
      ruleTagIds: [tagId('other')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const card: BoardCard = {
      todoId: todoId('todo-8'),
      tagIds: [tagId('a'), tagId('b'), tagId('c'), tagId('other')],
    };

    const result = boardAppearances([allColumn, otherColumn], [card]);

    expect(result).toEqual([
      { todoId: todoId('todo-8'), columnIds: [poolId('col-all'), poolId('col-andere')] },
    ]);
  });

  // -------------------------------------------------------------------------
  // Rot vor Grün: eine Vergleichsimplementierung, die exakt den beschriebenen
  // Fehler begeht — sie zählt zutreffende Regel-Tags statt zutreffende
  // Spalten und hängt die Spaltenkennung für jeden Treffer erneut an. Diese
  // Funktion steht ausschließlich hier, in der Testdatei; sie ist keine
  // Kopie von etwas in `src/` und wird nirgends importiert.
  //
  // Zuerst lief `expect(boardAppearancesCountingRuleTerms(...)).toEqual(expected)`
  // — das schlug fehl (siehe Bericht, Abschnitt "Rot vor Grün", für die
  // mitgeschnittene Fehlermeldung). Die jetzige, dauerhaft grüne Fassung hält
  // beide Ergebnisse ausdrücklich auseinander, damit der Unterschied im
  // Prüflauf sichtbar bleibt statt nach der Korrektur zu verschwinden.
  // -------------------------------------------------------------------------
  function boardAppearancesCountingRuleTerms(
    columns: readonly BoardColumnRule[],
    cards: readonly BoardCard[],
  ): readonly BoardAppearance[] {
    const appearances: BoardAppearance[] = [];
    for (const card of cards) {
      const columnIds: PoolId[] = [];
      const onCard = new Set(card.tagIds);
      for (const column of columns) {
        // Der Fehler: einmal je zutreffendem Regel-Tag statt einmal je Spalte.
        for (const ruleTagId of column.ruleTagIds) {
          if (onCard.has(ruleTagId)) columnIds.push(column.columnId);
        }
      }
      if (columnIds.length > 1) appearances.push({ todoId: card.todoId, columnIds });
    }
    return appearances;
  }

  it('Nachweis: die falsche Vergleichsimplementierung zeigt dieselbe Spalte mehrfach — die echte Funktion nicht', () => {
    const wideColumn: BoardColumnRule = {
      columnId: poolId('col-weit'),
      ruleTagIds: [tagId('t1'), tagId('t2'), tagId('t3')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const card: BoardCard = {
      todoId: todoId('todo-9'),
      // Trifft ZWEI der drei Regel-Tags — ein und derselben, einzigen Spalte.
      tagIds: [tagId('t1'), tagId('t2')],
    };

    const buggy = boardAppearancesCountingRuleTerms([wideColumn], [card]);
    const correct = boardAppearances([wideColumn], [card]);

    // Die echte Funktion: ein Treffer in genau einer Spalte ist kein
    // Mehrfach-Treffer und erscheint deshalb gar nicht (Fall 1).
    expect(correct).toEqual([]);

    // Die falsche Vergleichsimplementierung hält denselben Fall für eine
    // Mehrfachnennung, weil sie zwei zutreffende Regel-Tags als zwei
    // "Spalten" zählt — hier zeigt sich der Fehler bereits ohne eine zweite
    // Spalte im Bestand.
    expect(buggy).toEqual([
      { todoId: todoId('todo-9'), columnIds: [poolId('col-weit'), poolId('col-weit')] },
    ]);
    expect(buggy).not.toEqual(correct);

    // Mit einer zweiten Spalte wird aus dem Fehler der aus dem Auftrag
    // beschriebene Fall: dieselbe Karte, dieselbe Spalte doppelt gelistet,
    // obwohl sie insgesamt nur in zwei Spalten steht.
    const secondColumn: BoardColumnRule = {
      columnId: poolId('col-zweite'),
      ruleTagIds: [tagId('andere-marke')],
      matchMode: 'any',
      unresolvedRequired: false,
    };
    const cardInBeiden: BoardCard = {
      todoId: todoId('todo-10'),
      tagIds: [tagId('t1'), tagId('t2'), tagId('andere-marke')],
    };

    const buggyWithTwoColumns = boardAppearancesCountingRuleTerms([wideColumn, secondColumn], [cardInBeiden]);
    const correctWithTwoColumns = boardAppearances([wideColumn, secondColumn], [cardInBeiden]);

    // Richtig: zwei Spalten, zwei Kennungen.
    expect(correctWithTwoColumns).toEqual([
      { todoId: todoId('todo-10'), columnIds: [poolId('col-weit'), poolId('col-zweite')] },
    ]);
    // Falsch: drei Einträge, "col-weit" doppelt — die Karte scheint in drei
    // Spalten zu stehen, obwohl es nur zwei sind.
    expect(buggyWithTwoColumns).toEqual([
      {
        todoId: todoId('todo-10'),
        columnIds: [poolId('col-weit'), poolId('col-weit'), poolId('col-zweite')],
      },
    ]);
    expect(buggyWithTwoColumns[0]?.columnIds).not.toEqual(correctWithTwoColumns[0]?.columnIds);
  });
});

// ---------------------------------------------------------------------------
// Fall 4 — die Übereinstimmung zwischen SQL-Abfrage und Domänenregel.
//
// `packages/domain` kennt kein SQL (E-001) — die Abfrageseite selbst lässt
// sich hier nicht gegenprüfen (das bleibt proof:openapi Abschnitt 11 am
// laufenden Dienst). Was sich hier prüfen lässt und laut T-066-Bericht
// (Abschnitt 5) die Domänenseite dieser Übereinstimmung ist: `boardAppearances`
// entscheidet Mitgliedschaft NICHT mit einer eigenen, parallelen Logik,
// sondern ausschließlich über `matchesPool` — dieselbe Funktion, die
// `repo-todos.ts` in SQL nachbildet und die `routes/addin/service.ts` für die
// Pool-Namen eines Todos aufruft. Der Test baut das Ergebnis unabhängig aus
// `matchesPool` nach und vergleicht es gegen `boardAppearances` — laufen sie
// auseinander, hat `boardAppearances` entweder eine eigene Regel erfunden
// oder falsch angewendet.
// ---------------------------------------------------------------------------

describe('boardAppearances — Übereinstimmung mit matchesPool (derselben Regel wie die SQL-Mitgliederabfrage)', () => {
  it('die Menge der Mehrfachnennungen entspricht exakt dem, was matchesPool je Spalte und Karte unabhängig ermittelt', async () => {
    const { matchesPool } = await import('../src/tag.js');

    const columns: readonly BoardColumnRule[] = [
      { columnId: poolId('c1'), ruleTagIds: [tagId('a')], matchMode: 'any', unresolvedRequired: false },
      { columnId: poolId('c2'), ruleTagIds: [tagId('b'), tagId('c')], matchMode: 'all', unresolvedRequired: false },
      { columnId: poolId('c3'), ruleTagIds: [], matchMode: 'any', unresolvedRequired: false },
      { columnId: poolId('c4'), ruleTagIds: [tagId('a'), tagId('d')], matchMode: 'any', unresolvedRequired: false },
    ];
    const cards: readonly BoardCard[] = [
      { todoId: todoId('t1'), tagIds: [tagId('a')] }, // c1, c4 → Mehrfach
      { todoId: todoId('t2'), tagIds: [tagId('b'), tagId('c')] }, // nur c2 → keine Nennung
      { todoId: todoId('t3'), tagIds: [tagId('d')] }, // nur c4 → keine Nennung
      { todoId: todoId('t4'), tagIds: [tagId('a'), tagId('b'), tagId('c')] }, // c1, c2, c4 → Mehrfach
      { todoId: todoId('t5'), tagIds: [] }, // trifft nichts, auch nicht c3
    ];

    // Unabhängig nachgebaut: für jede Karte, für jede Spalte, matchesPool
    // direkt aufgerufen — keine Wiederverwendung von boardAppearances selbst.
    const expected: BoardAppearance[] = [];
    for (const card of cards) {
      const columnIds = columns
        .filter((column) =>
          matchesPool({ todoTagIds: card.tagIds, ruleTagIds: column.ruleTagIds, matchMode: column.matchMode, unresolvedRequired: column.unresolvedRequired }),
        )
        .map((column) => column.columnId);
      if (columnIds.length > 1) expected.push({ todoId: card.todoId, columnIds });
    }

    const actual = boardAppearances(columns, cards);

    expect(actual).toEqual(expected);
    // Gegenprobe, dass der Fixturen-Aufbau selbst nicht zufällig trivial grün
    // ist: Es muss mindestens eine echte Mehrfachnennung geben.
    expect(actual.length).toBeGreaterThan(0);
    expect(actual).toEqual([
      { todoId: todoId('t1'), columnIds: [poolId('c1'), poolId('c4')] },
      { todoId: todoId('t4'), columnIds: [poolId('c1'), poolId('c2'), poolId('c4')] },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Randfälle: keine Spalten, keine Karten.
// ---------------------------------------------------------------------------

describe('boardAppearances — Randfälle', () => {
  it('keine Spalten ergibt keine Mehrfachnennung, ganz gleich wie viele Karten', () => {
    const card: BoardCard = { todoId: todoId('todo-11'), tagIds: [tagId('t')] };
    expect(boardAppearances([], [card])).toEqual([]);
  });

  it('keine Karten ergibt keine Mehrfachnennung, ganz gleich wie viele Spalten', () => {
    const column: BoardColumnRule = { columnId: poolId('c'), ruleTagIds: [tagId('t')], matchMode: 'any', unresolvedRequired: false };
    expect(boardAppearances([column], [])).toEqual([]);
  });
});
