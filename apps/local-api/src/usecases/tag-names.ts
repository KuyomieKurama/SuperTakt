/**
 * Takt — aus geprüften Tagnamen Tags machen (T-058, T-061, T-062).
 *
 * ---------------------------------------------------------------------------
 * Warum das ein eigenes Modul ist und keine Zeile in `todos.ts`
 * ---------------------------------------------------------------------------
 *
 * Bis T-062 stand diese Auflösung zweimal im Baum: einmal hier — damals als
 * nicht exportierte Funktion in `usecases/todos.ts` —, einmal als
 * abgeschriebene Fassung in `routes/addin/service.ts`. Nicht aus Nachlässigkeit:
 * `usecases/` gehört nicht zur Dateihoheit des Add-ins, und was nicht exportiert
 * ist, lässt sich nicht importieren. Die Gleichheitsregel selbst (`tag-name.ts`
 * in der Domäne) war **nie** gedoppelt; gedoppelt war die Auflösung drumherum.
 *
 * Der `export` allein hätte gereicht, um die zweite Fassung zu löschen. Ein
 * eigenes Modul ist trotzdem der bessere Ort, aus demselben Grund, aus dem
 * `@takt/domain/export` ein schmaler Einstiegspunkt neben `@takt/domain` ist:
 * Wer nur diese eine Regel braucht, soll nicht das Modul mit `createTodo`,
 * `searchEverything` und `setDefaultTags` einbinden müssen. Ein Import sagt
 * dann auch, was geholt wurde.
 *
 * ---------------------------------------------------------------------------
 * Aufzurufen ausschließlich **innerhalb** einer Transaktion
 * ---------------------------------------------------------------------------
 *
 * Der Parameter ist eine Arbeitseinheit und kein `AppContext`. Eine
 * Arbeitseinheit gibt es nur aus `inTransaction` heraus — die Signatur sagt
 * also, wo diese Funktion stehen darf.
 *
 * Der Abbruch ist ein **Wurf** und kein Rückgabewert. Das ist keine
 * Geschmacksfrage: Die Transaktionsklammer nimmt nur bei einem Wurf zurück; ein
 * Fehlschlag als Wert ist für sie ein gelungener Durchlauf, und sie schreibt
 * fest (T-047). Siehe `AbortTodoCreate`.
 */

import type { Tag, TagNameCandidate, TaktError, Timestamp } from '@takt/domain';
import type { TagPort } from '@takt/storage';

/**
 * Was diese Auflösung von der Speicherung braucht — **zwei** Züge, nicht
 * dreizehn (T-062).
 *
 * Vorher stand hier `unit: UnitOfWork`. Das war bequem und falsch: Es gab der
 * Funktion Zugriff auf Todos, Vermerke, Timer und den Export, um zwei
 * Tag-Operationen auszuführen, und es machte sie für jeden Aufrufer
 * unbenutzbar, der weniger als die volle Arbeitseinheit hat.
 *
 * **Warum nicht `Pick<UnitOfWork, 'tags'>`.** Das wäre `{ tags: TagPort }` —
 * der volle Tag-Port mit `rename`, `move`, `remove`, `setOnTodo`. Die
 * Arbeitseinheit des Add-ins führt unter `tags` bereits selbst ein
 * `Pick<TagPort, 'findByKey' | 'create'>` (siehe `routes/addin/ports.ts`, wo
 * ausgeschrieben steht, warum genau diese zwei). Ein Parameter, der den vollen
 * Port verlangt, nähme sie **nicht** an, und der Aufrufer stünde vor der Wahl,
 * seine Fläche zu verbreitern oder abzuschreiben. Beides ist die falsche
 * Antwort.
 *
 * Deshalb eine Ebene enger als der Vorschlag: genau `findByKey` und `create`.
 * `UnitOfWork` erfüllt diesen Typ strukturell, `AddinUnit` ebenfalls, und
 * keiner von beiden musste dafür angefasst werden.
 */
export interface TagNameUnit {
  readonly tags: Pick<TagPort, 'findByKey' | 'create'>;
}

/** Was aus den Namen geworden ist: alle Tags, und davon die neu entstandenen. */
export interface ResolvedTagNames {
  /** Jeder genannte Name als Tag — gefunden oder eben angelegt, in Eingabereihenfolge. */
  readonly all: readonly Tag[];
  /** Nur die, die es vorher nicht gab. Leer, wenn jeder Name schon ein Tag hatte. */
  readonly fresh: readonly Tag[];
}

/**
 * Ein fachlicher Fehlschlag, der die Transaktion **mitnehmen** soll (T-058).
 *
 * Dieselbe Bauart wie `AbortExport` in `export.ts`, aus demselben Grund. Die
 * Transaktionsklammer nimmt nur bei einem **Wurf** zurück; ein Fehlschlag als
 * Rückgabewert ist für sie ein gelungener Durchlauf, und sie schreibt fest.
 * Genau daran hingen die sieben Stellen aus T-047.
 *
 * Hier ist der Fall besonders unangenehm, weil er sichtbaren Müll hinterließe:
 * Wer ein Todo mit drei neuen Tagnamen anlegt und am dritten scheitert, bekäme
 * eine Fehlermeldung **und** zwei Tags, die er nie bestellt hat — und beim
 * nächsten Versuch wären sie „schon vorhanden".
 *
 * Ein Sicherungspunkt (`atomic.ts`) wäre das falsche Werkzeug: Er nimmt nur
 * einen Ausschnitt zurück und lässt die Klammer weiterlaufen. Hier soll die
 * **ganze** Klammer fallen — es gibt kein Todo, also soll es auch nichts
 * geben, was für dieses Todo entstanden ist.
 *
 * Eine eigene Klasse und keine allgemeine `Error`: Die Klammer außen
 * unterscheidet damit „geplanter Abbruch" von „etwas ist kaputtgegangen".
 * Beim zweiten bleibt der Wurf ein Wurf und endet als 500 im Protokoll.
 *
 * **Exportiert seit T-062**, damit jeder Aufrufer von `resolveTagNames` ihn
 * fangen kann. Ohne den Export blieb einem zweiten Aufrufer nur eine eigene
 * Abbruchklasse — und mit ihr eine eigene Fassung der ganzen Funktion. Der Name
 * bleibt `AbortTodoCreate` und wird nicht zu `AbortTagResolution`
 * verallgemeinert: Der Abbruch **nimmt das Anlegen des Todos mit**, und genau
 * das soll an der `catch`-Zeile stehen.
 */
export class AbortTodoCreate extends Error {
  /**
   * Ausgeschriebenes Feld statt einer Parametereigenschaft: Node führt
   * TypeScript nur durch Streichen der Typen aus, und eine
   * Parametereigenschaft müsste umgeschrieben werden.
   */
  readonly failure: TaktError;

  constructor(failure: TaktError) {
    super(failure.code);
    this.name = 'AbortTodoCreate';
    this.failure = failure;
  }
}

/**
 * Aus geprüften Tagnamen Tags machen — finden oder anlegen (T-058).
 *
 * ---------------------------------------------------------------------------
 * Die Regel, und warum sie hier steht
 * ---------------------------------------------------------------------------
 *
 * Ein Name wird über seinen Vergleichsschlüssel gesucht, **ordnerübergreifend**:
 *
 *   kein Treffer      → neues Tag auf Wurzelebene
 *   genau ein Treffer → dieses Tag, gleich in welchem Ordner es liegt
 *   mehrere Treffer   → Abbruch; der Benutzer entscheidet
 *
 * Ordnerübergreifend ist eine Entscheidung und keine Bequemlichkeit: Läge
 * „backend“ in einem Ordner und suchte diese Funktion nur auf Wurzelebene,
 * entstünde daneben ein zweites „backend“ — für den Benutzer dasselbe Tag, für
 * jede Pool-Regel ein anderes.
 *
 * Der dritte Fall ist erreichbar, weil Tagnamen nur **je Ordner** eindeutig sind
 * (A-4.2). Ihn stillschweigend auf den ersten Treffer aufzulösen wäre ein
 * Münzwurf, der sich später als falsche Pool-Zugehörigkeit zeigt.
 *
 * **Wann zwei Namen derselbe sind, sagt diese Datei nicht.** Das steht in
 * `packages/domain/src/tag-name.ts` (`checkTagNames`, `tagNameKey`), und der
 * Schlüssel wird hier nur weitergereicht. Der Aufrufer prüft die rohen Namen
 * **vor** der Transaktion mit `checkTagNames` — rein, und deshalb soll eine
 * unzulässige Eingabe gar keine Klammer öffnen.
 *
 * **Warum im Anwendungsfall und nicht im Adapter.** Das hier ist eine Regel über
 * Tagnamen, keine über SQL. Der Adapter liefert zwei Bausteine — `findByKey`
 * fragt, `create` schreibt — und urteilt nicht. Damit gilt die Regel auch für
 * einen anderen Adapter, und sie ist an einer Stelle nachzulesen statt in einer
 * Abfrage versteckt.
 *
 * ---------------------------------------------------------------------------
 * Eine Fassung, zwei Wege
 * ---------------------------------------------------------------------------
 *
 * Aufgerufen von `createTodo` in `usecases/todos.ts` (Hauptanwendung) und von
 * `createTodo` in `routes/addin/service.ts` (Outlook-Add-in). Beide Wege müssen
 * dasselbe Ergebnis haben — der Befund C-03 aus T-025 war genau der Fall, in
 * dem sie es nicht hatten. Seit T-062 ist das keine Zusicherung mehr, die
 * jemand einhalten muss, sondern eine, die es nur einmal zu brechen gibt.
 */
export async function resolveTagNames(
  unit: TagNameUnit,
  candidates: readonly TagNameCandidate[],
  timestamp: Timestamp,
): Promise<ResolvedTagNames> {
  const all: Tag[] = [];
  const fresh: Tag[] = [];

  for (const candidate of candidates) {
    const matches = await unit.tags.findByKey(candidate.key);

    if (matches.length > 1) {
      throw new AbortTodoCreate({
        code: 'validation_error',
        message:
          'Dieser Tagname kommt in mehreren Ordnern vor. Bitte wählen Sie das gemeinte Tag ausdrücklich aus.',
        details: [
          {
            field: 'tagNames',
            code: 'tag_name_ambiguous',
            message: `Den Tagnamen „${candidate.name}“ gibt es ${String(matches.length)}-mal, in verschiedenen Ordnern.`,
          },
        ],
      });
    }

    const found = matches[0];
    if (found !== undefined) {
      all.push(found);
      continue;
    }

    // Neu, und deshalb auf Wurzelebene: Ein Ordner wäre geraten. Der Benutzer
    // verschiebt das Tag später, wenn er einen will (A-4.2). Farblos aus
    // demselben Grund.
    const created = await unit.tags.create(null, candidate.name, null, timestamp);
    if (!created.ok) throw new AbortTodoCreate(created.error);

    all.push(created.value);
    fresh.push(created.value);
  }

  return { all, fresh };
}
