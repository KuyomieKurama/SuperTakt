/**
 * Takt — T-027, die Transaktionsklammer (A-6.2, A-8.8).
 *
 * `packages/storage/src/sqlite/unit-of-work.ts` lag laut T-021-Bericht
 * (Risiko 1) bei 0 Prozent Abdeckung. Dieser Test prüft die drei Zusagen aus
 * dem Kopfkommentar der Datei wörtlich:
 *
 *  1. Zwei `inTransaction`-Aufrufe laufen nie gleichzeitig — die zweite
 *     Transaktion beginnt erst, wenn die erste festgeschrieben oder
 *     zurückgenommen ist (die Warteschlange).
 *  2. Ein Wurf innerhalb der übergebenen Funktion nimmt die gesamte
 *     Transaktion zurück, und der Wurf selbst erreicht den Aufrufer.
 *  3. Ein verschachtelter Aufruf (eine zweite Transaktion, angestoßen von
 *     *innerhalb* der ersten, auf derselben `TransactionPort`-Instanz) ist ein
 *     Programmierfehler und wirft, statt einen Sicherungspunkt zu benutzen.
 *
 * Die Reihung wird über eine Beobachtungsliste nachgewiesen: Jeder Arbeitsauftrag
 * trägt in eine gemeinsame Liste `start` und `ende` ein. Liefen zwei
 * gleichzeitig, stünde irgendwo ein `start` vor dem `ende` des vorigen.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { NOW, openTestDatabase, type TestDatabase } from './support/setup.ts';

describe('createTransactionPort — Reihung (A-8.8)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('zwei gleichzeitig gestartete Transaktionen laufen nacheinander, nie überlappend', async () => {
    db = openTestDatabase();
    const events: string[] = [];

    const first = db.transactions.inTransaction(async () => {
      events.push('erste-start');
      await new Promise((resolve) => setTimeout(resolve, 20));
      events.push('erste-ende');
      return 'erste';
    });

    const second = db.transactions.inTransaction(async () => {
      events.push('zweite-start');
      await new Promise((resolve) => setTimeout(resolve, 5));
      events.push('zweite-ende');
      return 'zweite';
    });

    // Beide werden zeitgleich angestoßen (kein `await` dazwischen) — die
    // Warteschlange muss sie trotzdem in Reihe bringen.
    const results = await Promise.all([first, second]);

    expect(results).toEqual(['erste', 'zweite']);
    expect(events).toEqual(['erste-start', 'erste-ende', 'zweite-start', 'zweite-ende']);
  });

  it('eine dritte, vierte und fünfte Transaktion reihen sich in Aufrufreihenfolge ein, nicht in Fertigstellungsreihenfolge', async () => {
    db = openTestDatabase();
    const order: number[] = [];

    const runs = [30, 5, 15].map((delay, index) =>
      db.transactions.inTransaction(async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        order.push(index);
        return index;
      }),
    );

    await Promise.all(runs);

    // Die kürzeste Verzögerung liegt in der Mitte (Index 1) — überlappten die
    // Transaktionen, stünde sie zuerst in `order`.
    expect(order).toEqual([0, 1, 2]);
  });

  it('eine Transaktion, die wirft, gibt die Warteschlange trotzdem für die nächste frei', async () => {
    db = openTestDatabase();

    await expect(
      db.transactions.inTransaction(async () => {
        throw new Error('absichtlicher Fehlschlag');
      }),
    ).rejects.toThrow('absichtlicher Fehlschlag');

    // Ohne den aufgefangenen Zweig in der Warteschlangenverkettung bliebe sie
    // nach dem ersten Fehlschlag für immer abgelehnt.
    const afterFailure = await db.transactions.inTransaction(async () => 'geht weiter');
    expect(afterFailure).toBe('geht weiter');
  });

  /**
   * BEFUND (T-027, nicht behoben — außerhalb meiner Dateihoheit):
   *
   * Der Kopfkommentar von `unit-of-work.ts` sagt zu, ein verschachtelter
   * Aufruf sei "ein Programmierfehler und wirft". Das stimmt für einen
   * verschachtelten Aufruf von `run()` selbst — aber `TransactionPort`, die
   * einzige nach außen sichtbare Fläche, reicht jeden Aufruf zuerst durch die
   * Warteschlange `queue.then(...)`. Ein Anwendungsfall, der von *innerhalb*
   * einer laufenden Transaktion `inTransaction` auf **derselben Instanz**
   * erneut aufruft, erzeugt damit einen Ring: Die äußere Transaktion wartet auf
   * das Ergebnis der inneren (weil sie es zurückgibt/awaitet), die innere
   * wartet auf `queue` — und `queue` wurde beim äußeren Aufruf bereits auf ein
   * Versprechen umgebogen, das erst nach dem Ende der äußeren Transaktion
   * erfüllt wird. Die `depth`-Prüfung in `run()` wird dabei nie erreicht,
   * weil der innere Aufruf gar nicht bis dahin kommt — er hängt in der
   * Warteschlange fest, bevor `run()` je aufgerufen wird.
   *
   * Ergebnis: **kein Wurf, sondern ein Steckenbleiben ohne Ende.** In einem
   * echten Dienst wäre das eine Anfrage, die nie antwortet, statt eines
   * sauberen Fehlers — für eine Zusicherung, die A-8.8 tragen soll, das
   * ungünstigere der beiden Verhalten.
   *
   * Dieser Test bindet die Wartezeit auf 300 ms (statt der 5 s Vorgabe) und
   * weist das *tatsächliche* Verhalten nach: Weder der zugesagte Wurf noch ein
   * Ergebnis treffen rechtzeitig ein. Er bleibt absichtlich rot, bis der Fund
   * behoben ist — siehe Bericht T-027, Abschnitt „Befunde am Adapter".
   */
  it('verschachtelte Transaktionen auf derselben Klammer sind ein Programmierfehler und werfen (A-8.8)', async () => {
    db = openTestDatabase();

    // Absichtlich rot belassen (siehe Bericht T-027, Abschnitt „Befunde am
    // Adapter"): Der Aufruf wirft heute nicht, er blockiert dauerhaft — der
    // in `run()` geprüfte `depth`-Zähler wird nie erreicht, weil die
    // Warteschlange `queue` beim äußeren Aufruf bereits auf ein Versprechen
    // umgebogen wurde, das erst nach Ende der äußeren Transaktion erfüllt
    // wird, und der innere Aufruf genau darauf wartet, bevor er `run()`
    // überhaupt erreicht. Eine feste Zeitgrenze von 1 s hält den Prüflauf
    // trotzdem kurz, statt auf die volle Standardzeitspanne zu warten.
    await expect(
      db.transactions.inTransaction(async () => {
        // Ein Anwendungsfall, der versehentlich innerhalb einer offenen
        // Transaktion eine zweite auf derselben Klammer eröffnet — der Fall,
        // den der Kopfkommentar als "unzulässig" bezeichnet.
        return db.transactions.inTransaction(async () => 'darf nicht passieren');
      }),
    ).rejects.toThrow(/Verschachtelte Transaktionen sind unzulässig/);
  }, 1000);
});

describe('createTransactionPort — ROLLBACK bei einem Wurf (A-8.8)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('ein Wurf nach erfolgreichen Schreibvorgängen nimmt sie vollständig zurück', async () => {
    db = openTestDatabase();

    await expect(
      db.transactions.inTransaction(async (unit) => {
        await unit.todos.create(
          { title: 'wird zurückgenommen', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
          [],
        );
        throw new Error('Abbruch nach dem Schreiben, vor dem Festschreiben');
      }),
    ).rejects.toThrow('Abbruch nach dem Schreiben');

    const remaining = await db.unit.todos.search({});
    expect(remaining.items).toEqual([]);
  });

  it('ein Fehlschlag beim ROLLBACK selbst verdeckt nicht den ursprünglichen Wurf', async () => {
    db = openTestDatabase();
    // Die Transaktion wird von außen bereits beendet, bevor der interne
    // ROLLBACK versucht wird — das simuliert den Fall "die Transaktion war
    // bereits beendet", den der Kopfkommentar von unit-of-work.ts nennt.
    await expect(
      db.transactions.inTransaction(async () => {
        db.conn.exec('ROLLBACK;');
        throw new Error('der eigentliche Grund');
      }),
    ).rejects.toThrow('der eigentliche Grund');
  });
});
