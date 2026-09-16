/**
 * Takt — der Meßsatz für fensterfeste Flächen (`docs/design/fensterfeste-flaechen.md`
 * Abschnitt 9, Auftrag T-330).
 *
 * Die eine Zusage, die dieser Lauf hält: **keine Ansicht macht das Dokument
 * höher oder breiter als das Fenster.** Gemessen an `document.scrollingElement`,
 * nicht an einem Stellvertreter (A1). Dazu neun weitere Zusicherungen aus
 * demselben Abschnitt:
 *
 *  - A2 — der Rahmen `.app__main` hat nichts zu laufen, **ab der getragenen
 *    Größe 960×640** (T-345, Abschnitt 2 des Auftrags, E-115/AK-02). Unterhalb
 *    davon gilt die schwächere Zusage A2b: nichts wird abgeschnitten, nichts
 *    unerreichbar — der Rahmen darf dort laufen (7.2).
 *  - A2a — waagerecht wird **nichts abgeschnitten**, ohne Untergrenze (9.1,
 *    berichtigt T-352, B-19 aus `T-351-spec-ux-reviewer.md`): `.app__main`
 *    `scrollWidth ≤ clientWidth + 1` auf jeder Ansicht und in jeder
 *    Fenstergröße bis 320×256 (AK-02a). `.app__main` trägt `overflow-x:
 *    hidden`, also ist eine Überbreite dort ein **Schnitt**, kein Lauf.
 *  - A3 — genau ein Laufbereich je Ansicht (`.app__main` > `.screen` >
 *    `.screen__body`, jeweils genau eines).
 *  - A4 — der Kopf (`.screen__header`) bleibt stehen, wenn der Laufbereich
 *    ans Ende rollt.
 *  - A5 — der Laufbereich läuft wirklich; ohne diese Messung wären A1/A2
 *    auch dann grün, wenn nichts überliefe (blind).
 *  - A6 — der waagerechte Lauf der Buchungsübersicht erreicht bei 960px
 *    Breite tatsächlich seinen Kasten, bei gleichzeitig grünem A2.
 *  - A7 — die Bildlaufleisten-Rinne verhindert einen Breitensprung zwischen
 *    einer kurzen und einer langen Todo-Liste, **und** (seit T-345, 9.1)
 *    Kopfkante gleich Inhaltskante auf jeder Ansicht bei jeder getragenen
 *    Größe (`.screen__header` rechts = `.screen > .screen__body` rechts).
 *  - A8 — im Laufbereich wird nichts abgeschnitten: je direktem, nicht fest
 *    positioniertem Kind eines Laufbereichs `scrollHeight ≤ clientHeight + 1`
 *    (9.6). Menge, Ausnahme und die zwei Untergrenzen stehen dort und unten
 *    bei `A8_RUN_AREA_SELECTORS`. **Berichtigt T-352:** Der Rahmen
 *    `.screen__body--frame` ist nur **unterhalb** von 960×640 ausgenommen —
 *    im getragenen Bereich wird er mitgemessen (9.6 Punkt 2, T-344).
 *  - A9 — die Sprungmarke landet auf einer Fläche, die läuft, und `Bild ab`
 *    (im Kanban `Pfeil rechts`) bewegt danach meßbar etwas: den Kasten mit
 *    `id="inhalt"` selbst, oder — abschließend aufgezählt für die
 *    Zeiterfassung unterhalb von 68rem — die Bildlaufstelle seines nächsten
 *    laufenden Vorfahren (9.1, 9.7, neu **T-352**, aus A-25.5 und AK-14).
 *
 * ## Woran die Menge der Ansichten aufgespannt wird
 *
 * `ROUTE_NAMES` aus `apps/web/src/app/router.ts` (E-099 Punkt 3, Abschnitt
 * 9.3) — keine Liste, die diese Datei selbst führt. `ROUTE_NAMES` ist
 * vollständig gegen `RouteName` getypt; eine neue Route ohne Eintrag dort ist
 * ein Typfehler in `router.ts`, kein stilles Loch hier.
 *
 * ## Sieben Fenstergrößen (Abschnitt 9.2) — **berichtigt, T-345**
 *
 * Das Standardfenster der Hülle, ihre Untergrenze, ein Pixel unter der
 * Sprungmarke bei 52rem (die Stufe, an der die Kette am ehesten reißt),
 * breit-und-niedrig, der Boden des reinen Browserbetriebs, und — neu in T-339
 * — 1200×820 (Kopf umgebrochen, Zeiterfassung noch zweispaltig) sowie
 * 1024×640. **Berichtigt T-352 (T-351 B-19):** Der Kommentar sprach hier vom
 * „widerlegten" 9.6-Wortlaut — 1024×640 sei die benannte A8-Ausnahme des
 * Rahmens. Das war seit T-344 falsch (1024×640 ist **getragen**, die Ausnahme
 * gilt nur unterhalb von 960×640) und ist seit T-348 zusätzlich behoben: Der
 * Rahmen geht dort von 577/515 auf 515/515, A8 wird an dieser Größe **grün**.
 * Die Größe bleibt in der Liste — sie ist die Gegenprobe zu genau diesem
 * Befund, nicht mehr sein Versteck.
 *
 * **B-03 aus `.claude/team/reports/T-343-spec-ux-reviewer.md` behoben:** Der
 * Satz, der hier bis T-345 stand — „alle sieben liegen im ‚getragenen
 * Bereich' … A2 gilt deshalb bei allen" —, zitierte eine von zwei
 * widersprüchlichen Papierfassungen (T-323 7.1 gegen T-340/E-115) und damit
 * die **falsche**. Entschieden ist inzwischen E-115/AK-02 und A-25.4
 * (`docs/spec.md`): **getragen** heißt ausschließlich Breite **und** Höhe
 * zugleich ≥ 960×640, ohne Hüllenmeldung. Vier der sieben Größen erfüllen
 * das (1280×820, 960×640, 1200×820, 1024×640) — dort gilt A2 stark. Die
 * übrigen drei (831×640, 1280×480, 640×480) liegen darunter; dort mißt die
 * schwächere A2b (7.2: „Laufen lassen — und zwar den Rahmen", `.app__main`
 * bleibt `overflow-y: auto`, nichts wird `hidden`). Bei 831×640 und 640×480
 * sind Verstöße gegen die starke Zusage **unvermeidlich** (`board.md`,
 * Welle 6: die Hülle nimmt dort 225 statt 52px für Kopf und Bandnavigation,
 * 173px davon die Bandnavigation selbst, gegen ein Budget von 175px) — genau
 * der Rückfall, den T-340 als richtig eingestuft hat, nicht ein Fehler, den
 * A2 verdecken dürfte.
 *
 * ## Z6 (`.claude/team/decisions.md`) — was dieser Lauf **nicht** verlangt
 *
 * AK-02 („null innere Laufbereiche im Rückfall") ist zurückgenommen: Im
 * Rückfall läuft der Rahmen, und `.screen__body`/`.screen__body--frame` darf
 * innerhalb seines Bodens von 4rem weiterlaufen — verschachtelt, nicht
 * übereinander. A1 und A3 halten trotzdem uneingeschränkt (7.2: „Das Dokument
 * selbst wird in keinem dieser Bereiche höher oder breiter als das Fenster").
 * A2 (stark) gilt nur an den vier getragenen Größen (siehe oben); an den
 * übrigen drei mißt A2b. Dieser Lauf behauptet an keiner Stelle „genau eine
 * Bildlaufleiste".
 *
 * ## Zwei Zustände aus Abschnitt 9.3 Punkt 4, die hier absichtlich fehlen
 *
 * **„Unbekannte Adresse" ist über `page.goto()` mit dem heutigen Stand nicht
 * erreichbar — eigener Befund.** `parseRoute` (`router.ts`) fällt für *jeden*
 * nicht erkannten Kopf-Abschnitt auf `DEFAULT_ROUTE` (Dashboard) zurück,
 * nicht auf `UnknownScreen`. Dieselbe Falle, die T-326 schon für die
 * Sprungmarke gemessen hat (`board.md`: „parseRoute('#inhalt') kennt die
 * Adresse nicht und fällt auf die Vorgaberoute zurück"). `UnknownScreen`
 * (`App.tsx`, `Screen()`) hängt einzig am `default`-Zweig sowie an
 * `case "todo": route.id === null` — und über `parseRoute` entsteht `id:
 * null` für den Namen `"todo"` nie: Jede Kennung aus `#/todos/<Kennung>` ist
 * nach `decodeSegment` eine nicht-leere Zeichenkette, und ohne Kennung liefert
 * `parseRoute` den Namen `"todos"`, nicht `"todo"`. Ein Prüffall, der trotzdem
 * `#/irgendwas-unbekanntes` ansteuert, würde in Wahrheit das Dashboard messen
 * und sich selbst belügen — deshalb steht hier keiner. Siehe Bericht
 * T-330-e2e-tester, eigener Auftrag.
 *
 * **„Ladeersatz" und „gescheitertes Nachladen" (Suspense-Fallback und
 * `ScreenLoadBoundary`, `App.tsx`) fehlen bewusst.** Beide ließen sich nur
 * über eine Netzabfangregel auf den jeweiligen `lazy(() => import(...))`
 * -Baustein erzwingen — baubar, aber in dieser Aufgabe nicht **gegen einen
 * echten Lauf geprüft** (der Port 5173 dieser Sitzung war beim Bau dieser
 * Datei durch einen eigenen, nicht abräumbaren Prozess belegt, siehe Bericht).
 * Ein ungeprüfter Prüffall ist schlimmer als eine Lücke; Vorschlag an den
 * Orchestrator im Bericht statt eines Blindflugs hier.
 *
 * ## Vorrat (Abschnitt 9.4)
 *
 * `test.beforeAll` legt einmalig echten Überschuss an: eine an keiner Stelle
 * umbrechbare Kennung in der Todo-Liste, mehr Buchungen mit langem
 * Leistungstext und gesetzter (erfundener) Call-Nummer, als die
 * Buchungsübersicht bei 960px Breite fassen kann, sechs Kanban-Spalten (mehr,
 * als bei 960px nebeneinanderpassen) mit einer übervollen, und einen
 * Tag-Baum tiefer und länger als der Rahmen. Erfunden, `E2E-`-gekennzeichnet,
 * keine echten Call-Nummern (CLAUDE.md „Sicherheit").
 */
import { test, expect, type Page } from '@playwright/test';

import { ROUTE_NAMES, href } from '../../apps/web/src/app/router.ts';
import {
  createPool,
  createTag,
  createTagFolder,
  createTemplate,
  createTimeEntry,
  createTodo,
  deletePoolByName,
  deleteTag,
  deleteTagFolder,
  deleteTimeEntry,
  deleteTodo,
} from './support/api';

/** `YYYY-MM-DDTHH:MM:SSZ` — dieselbe Bauart wie in `manual-booking-movement.spec.ts`. */
function isoNoMillis(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

const RUN = Date.now();
/** Trifft alle 30 Todos aus der Liste (9.4) — für die „lange Liste" in A7. */
const LIST_MARKER = `E2EVPFITLISTE${RUN}`;
/** Trifft garantiert nichts — für die „kurze Liste" in A7. */
const NO_MATCH_MARKER = `E2EVPFITKEINTREFFER${RUN}`;

interface Seed {
  readonly listTodoIds: readonly string[];
  readonly boardTodoIds: readonly string[];
  readonly boardTagIds: readonly string[];
  readonly boardPoolNames: readonly string[];
  /** Wurzel zuerst, tiefster Ordner zuletzt — zum Aufräumen umgekehrt durchlaufen. */
  readonly tagFolderIds: readonly string[];
  readonly deepTagId: string;
  readonly rootTagIds: readonly string[];
  readonly timeEntryIds: readonly string[];
  /** Trägt die Call-Nummer und die Buchungen — dieselbe Kennung für die Route „todo". */
  readonly billedTodoId: string;
  readonly templateId: string;
}

async function seedFixtures(): Promise<Seed> {
  // 1) Todo-Liste: 29 gewöhnliche Einträge plus einer ohne jede Wortgrenze
  //    (`.foreign-name` muss die Breite abfangen, Abschnitt 9.4).
  const listTodoIds: string[] = [];
  for (let index = 0; index < 29; index += 1) {
    const todo = await createTodo({ title: `${LIST_MARKER}-Eintrag-${index}` });
    listTodoIds.push(todo.id);
  }
  const longTitleTodo = await createTodo({ title: `${LIST_MARKER}${'x'.repeat(180)}` });
  listTodoIds.push(longTitleTodo.id);

  // 2) Board: sechs Spalten — mehr, als bei 960px nebeneinanderpassen
  //    (`.board` `grid-auto-columns: minmax(17rem, 21rem)`) — eine davon mit
  //    mehr Karten, als eine Fensterhöhe zeigt.
  const boardTagIds: string[] = [];
  const boardPoolNames: string[] = [];
  const boardTodoIds: string[] = [];
  for (let column = 0; column < 6; column += 1) {
    const tag = await createTag(`E2E-ViewportFit-Board-Tag-${column}-${RUN}`);
    boardTagIds.push(tag.id);
    const poolName = `E2E-ViewportFit-Board-Spalte-${column}-${RUN}`;
    await createPool({ name: poolName, placement: 'board', requiredTagIds: [tag.id] });
    boardPoolNames.push(poolName);
    const cardCount = column === 0 ? 14 : 1;
    for (let card = 0; card < cardCount; card += 1) {
      const todo = await createTodo({
        title: `E2E-ViewportFit-Board-${column}-${card}-${RUN}`,
        tagIds: [tag.id],
      });
      boardTodoIds.push(todo.id);
    }
  }

  // 3) Tag-Baum: zwölf Ebenen tief, dazu acht Wurzel-Tags für die Länge.
  const tagFolderIds: string[] = [];
  let parentId: string | null = null;
  for (let depth = 0; depth < 12; depth += 1) {
    const folder = await createTagFolder(`E2E-ViewportFit-Ordner-${depth}-${RUN}`, parentId);
    tagFolderIds.push(folder.id);
    parentId = folder.id;
  }
  const deepTag = await createTag(`E2E-ViewportFit-Tiefer-Tag-${RUN}`, parentId);
  const rootTagIds: string[] = [];
  for (let index = 0; index < 8; index += 1) {
    const tag = await createTag(`E2E-ViewportFit-Wurzel-Tag-${index}-${RUN}`);
    rootTagIds.push(tag.id);
  }

  // 4) Buchungen: eine (erfundene) Call-Nummer, dreißig lange Leistungstexte —
  //    genug, damit die Tabelle bei 960px Breite über ihren Kasten hinausläuft
  //    (A6) und der Laufbereich überläuft (A4/A5).
  const billedTodo = await createTodo({
    title: `E2E-ViewportFit-Buchungen-${RUN}`,
    callNumber: `E2EVPFIT${RUN}`,
  });
  const timeEntryIds: string[] = [];
  const base = Date.now() - 30 * 20 * 60 * 1000;
  const longNote =
    'E2E-ViewportFit-Leistungstext ohne Bezug zu echten Kunden, absichtlich lang genug, ' +
    'um die Buchungsübersicht bei 960 Pixeln Breite über ihren Kasten hinauswachsen zu lassen. ';
  for (let index = 0; index < 30; index += 1) {
    const start = new Date(base + index * 20 * 60 * 1000);
    const end = new Date(start.getTime() + 12 * 60 * 1000);
    const entry = await createTimeEntry({
      todoId: billedTodo.id,
      startedAt: isoNoMillis(start),
      endedAt: isoNoMillis(end),
      note: `${longNote}Buchung ${index}.`,
    });
    timeEntryIds.push(entry.id);
  }

  // 5) Eine Exportvorlage — die Route „templates" braucht eine Kennung (9.3
  //    Punkt 3). Keine Löschfunktion in `support/api.ts` vorhanden (dieselbe
  //    Lücke wie in `note-separation.spec.ts` und
  //    `attachment-export-and-addin-exclusion.spec.ts`); der eindeutige,
  //    `E2E-`-gekennzeichnete Name verhindert eine Kollision.
  const template = await createTemplate(`E2E-ViewportFit-Vorlage-${RUN}`, {
    version: 1,
    fields: [{ name: 'Call', source: 'todo.callNumber', transformation: 'raw' }],
  });

  return {
    listTodoIds,
    boardTodoIds,
    boardTagIds,
    boardPoolNames,
    tagFolderIds,
    deepTagId: deepTag.id,
    rootTagIds,
    timeEntryIds,
    billedTodoId: billedTodo.id,
    templateId: template.id,
  };
}

async function teardownFixtures(seed: Seed): Promise<void> {
  for (const id of seed.timeEntryIds) await deleteTimeEntry(id).catch(() => undefined);
  for (const id of [...seed.listTodoIds, ...seed.boardTodoIds, seed.billedTodoId]) {
    await deleteTodo(id).catch(() => undefined);
  }
  for (const name of seed.boardPoolNames) await deletePoolByName(name).catch(() => undefined);
  for (const id of seed.boardTagIds) await deleteTag(id).catch(() => undefined);
  await deleteTag(seed.deepTagId).catch(() => undefined);
  for (const id of seed.rootTagIds) await deleteTag(id).catch(() => undefined);
  // Tiefster Ordner zuerst — ein Ordner mit Unterordner ist nicht löschbar.
  for (const id of [...seed.tagFolderIds].reverse()) await deleteTagFolder(id).catch(() => undefined);
}

/* Meßwerkzeug                                                          */

interface WindowSize {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Abschnitt 9.2, berichtigt in T-345: die fünf ursprünglichen plus die zwei
 * aus T-339 (1200×820, 1024×640). Reihenfolge bewusst so belassen — Indizes 0
 * und 1 tragen anderswo in dieser Datei (A4/A5) noch die alte Bedeutung
 * „Standardfenster" / „Untergrenze".
 */
const WINDOW_SIZES: readonly WindowSize[] = [
  { label: '1280×820 (Standardfenster der Hülle)', width: 1280, height: 820 },
  { label: '960×640 (Untergrenze der Hülle)', width: 960, height: 640 },
  { label: '831×640 (ein Pixel unter 52rem)', width: 831, height: 640 },
  { label: '1280×480 (breit und niedrig)', width: 1280, height: 480 },
  { label: '640×480 (Boden des Browserbetriebs)', width: 640, height: 480 },
  { label: '1200×820 (Kopf umgebrochen, Zeiterfassung noch zweispaltig, T-339)', width: 1200, height: 820 },
  { label: '1024×640 (A8-Ausnahme des Rahmens, T-339)', width: 1024, height: 640 },
];

/** Toleranz genau 1px (9.1) — Geräteverhältnisse ungleich 1 erzeugen Teilpixel. */
const TOLERANCE_PX = 1;

function exceeds(scroll: number, client: number): boolean {
  return scroll > client + TOLERANCE_PX;
}

/**
 * „Getragen" heißt seit E-115/AK-02 und A-25.4 (`docs/spec.md`) **ausschließlich**
 * Breite **und** Höhe zugleich ≥ 960×640 — nicht die weitere Lesart aus der
 * inzwischen widerlegten T-323-7.1-Fassung (T-345, Abschnitt 2 des Auftrags,
 * B-03 aus `T-343-spec-ux-reviewer.md`). Trifft auf vier der sieben Größen
 * zu: das Standardfenster, die Untergrenze und die beiden neuen aus T-339.
 */
function isGetragen(size: WindowSize): boolean {
  return size.width >= 960 && size.height >= 640;
}

const GETRAGEN_SIZES: readonly WindowSize[] = WINDOW_SIZES.filter(isGetragen);

/**
 * A8, 9.6 Punkt 1 — die Menge der Laufbereiche. `.screen__body--split` kommt
 * unterhalb von 68rem (die Medienstufe aus `viewport-layout.css:594`) dazu,
 * weil der Rahmen der Zeiterfassung dort selbst zum Laufbereich wird (zwei
 * Spalten fallen untereinander, T-322 R-2). **`.board` steht seit T-348 mit
 * darin (T-352, B-19 aus `T-351-spec-ux-reviewer.md`):** Seit T-344/AK-15 ist
 * das Kanban-Board die waagerechte Laufstrecke der Ansicht, mit Halt, Rolle
 * und Namen — dieselbe Klasse Fläche wie `.runarea`, nur an der anderen
 * Achse. Der frontend-dev hat die Lücke gelesen, nicht gefahren
 * (`T-348-frontend-dev.md` Übergabe Punkt 2); hier ist sie gemessen: je
 * direktem Kind von `.board` (also je `.kcolumn`) `scrollHeight ≤
 * clientHeight + 1` — `.board` trägt `overflow-y: hidden`, eine zu hohe
 * Spalte würde dort sonst abgeschnitten, ohne dass A8 hinsieht.
 */
const A8_RUN_AREA_SELECTORS = [
  '.screen__body:not(.screen__body--frame)',
  '.runarea',
  '.kcolumn__body',
  '.board',
] as const;
const A8_SPLIT_BREAKPOINT_PX = 68 * 16; // 68rem, dieselbe Medienstufe wie viewport-layout.css:594

interface RunAreaChildViolation {
  readonly selector: string;
  readonly tag: string;
  readonly className: string;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

interface A8Measurement {
  /** 9.6, erste Untergrenze — wie viele Laufbereiche der Selektorsatz insgesamt traf. */
  readonly runAreasFound: number;
  /** 9.6, zweite Untergrenze — wie viele davon tatsächlich liefen (`scrollHeight > clientHeight`). */
  readonly runAreasRunning: number;
  readonly violations: readonly RunAreaChildViolation[];
}

/**
 * A8, 9.6 — je gefundenem Laufbereich dessen direkte, nicht fest
 * positionierte Kinder gegen `scrollHeight ≤ clientHeight + 1` (9.6 Punkt 3:
 * `position` weder `fixed` noch `absolute`). `includeSplit` wird aus der
 * tatsächlichen Fensterbreite berechnet, nicht geraten (9.6 Punkt 1).
 *
 * `includeFrame` — **berichtigt T-352 (T-351 B-19):** Bis hierhin nahm diese
 * Funktion `.screen__body--frame` in **jeder** Größe aus, mit dem seit T-344
 * **widerlegten** Wortlaut von 9.6 Punkt 2 als Begründung im Kommentar. Nach
 * T-344 gilt die Ausnahme nur **unterhalb** von 960×640 (dem Rückfall, in dem
 * der Rahmen laufen darf und soll); im getragenen Bereich läuft er nicht und
 * wird **mitgemessen** — genau dort, wo T-334 62 bis 86px Überlauf gemessen
 * hatte (der Bereichsschienen-Befund aus 7.5, behoben in T-348: 577/515 →
 * 515/515 bei 1024×640). Ein Meßsatz, der den Rahmen dort dauerhaft
 * ausnimmt, ist an genau der einen Größe blind, an der ein Rückfall dieses
 * Befundes sichtbar würde. Der Aufrufer reicht `includeFrame = getragen`.
 */
async function measureRunAreaChildren(
  page: Page,
  includeSplit: boolean,
  includeFrame: boolean,
): Promise<A8Measurement> {
  return page.evaluate(
    ({ selectors, includeSplit: withSplit, includeFrame: withFrame }) => {
      const allSelectors = [
        ...selectors,
        ...(withSplit ? ['.screen__body--split'] : []),
        ...(withFrame ? ['.screen__body--frame'] : []),
      ];
      const areas = new Set<Element>();
      for (const selector of allSelectors) {
        document.querySelectorAll(selector).forEach((element) => areas.add(element));
      }
      let runAreasRunning = 0;
      const violations: { selector: string; tag: string; className: string; scrollHeight: number; clientHeight: number }[] = [];
      for (const area of areas) {
        if (area.scrollHeight > area.clientHeight + 1) runAreasRunning += 1;
        const matchedSelector = allSelectors.find((selector) => area.matches(selector)) ?? '(unbekannt)';
        for (const child of Array.from(area.children)) {
          const position = window.getComputedStyle(child).position;
          if (position === 'fixed' || position === 'absolute') continue;
          if (child.scrollHeight > child.clientHeight + 1) {
            violations.push({
              selector: matchedSelector,
              tag: child.tagName.toLowerCase(),
              className: typeof child.className === 'string' ? child.className : '',
              scrollHeight: child.scrollHeight,
              clientHeight: child.clientHeight,
            });
          }
        }
      }
      return { runAreasFound: areas.size, runAreasRunning, violations };
    },
    { selectors: A8_RUN_AREA_SELECTORS, includeSplit, includeFrame },
  );
}

interface Violation {
  readonly ansicht: string;
  readonly groesse: string;
  readonly zusicherung: string;
  readonly detail: string;
}

function reportOf(violations: readonly Violation[]): string {
  if (violations.length === 0) return 'keine Abweichungen';
  return violations.map((v) => `${v.zusicherung} — ${v.ansicht} @ ${v.groesse}: ${v.detail}`).join('\n');
}

/**
 * Wartet, bis eine Ansicht **fertig geladen** ist — kein Ladekreis mehr im
 * Bild (9.1). Reihenfolge ist Absicht: `.screen` zuerst (der React-Baum
 * dieser Route steht), danach `.boot` (Suspense-Fallback des
 * `lazy()`-Bausteins), danach `.loading-block` (`AsyncBoundary`s Skelett).
 * Kein `.catch()` — hängt eine dieser Wartungen, ist das eine echte rote
 * Zeile und keine, die stillschweigend übergangen wird.
 */
async function gotoAndSettle(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.locator('.screen').first().waitFor({ state: 'attached' });
  await page.locator('.boot').first().waitFor({ state: 'detached' });
  await page.locator('.loading-block').first().waitFor({ state: 'detached' });
}

interface BoxMetrics {
  readonly scrollHeight: number;
  readonly clientHeight: number;
  readonly scrollWidth: number;
  readonly clientWidth: number;
}

/** A1 — der Satz selbst, an `document.scrollingElement`, nicht an einem Stellvertreter. */
async function documentMetrics(page: Page): Promise<BoxMetrics> {
  return page.evaluate(() => {
    const element = document.scrollingElement;
    if (element === null) throw new Error('document.scrollingElement ist null');
    return {
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    };
  });
}

async function boxMetricsOf(page: Page, selector: string): Promise<BoxMetrics> {
  return page.locator(selector).first().evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
}

/**
 * A3 — `.app__main` hat genau **ein** Elementkind mit Klasse `.screen`, und
 * darin gibt es genau **ein** `> .screen__body` (auch `.screen__body--frame`
 * trägt diese Klasse zusätzlich, siehe `ScreenBody.tsx#ScreenFrame`).
 */
async function screenStructureCounts(
  page: Page,
): Promise<{ readonly screenCount: number; readonly bodyCount: number }> {
  return page.evaluate(() => {
    const main = document.querySelector('.app__main');
    if (main === null) return { screenCount: 0, bodyCount: 0 };
    const screens = Array.from(main.children).filter((child) => child.classList.contains('screen'));
    if (screens.length !== 1) return { screenCount: screens.length, bodyCount: 0 };
    const screen = screens[0];
    if (screen === undefined) return { screenCount: screens.length, bodyCount: 0 };
    const bodies = Array.from(screen.children).filter((child) => child.classList.contains('screen__body'));
    return { screenCount: screens.length, bodyCount: bodies.length };
  });
}

interface Target {
  readonly label: string;
  readonly url: string;
}

/**
 * Aufgespannt an `ROUTE_NAMES` (9.3), nicht an einer selbst geführten Liste.
 * Zwei Routen brauchen eine Kennung — der Vorrat aus `seedFixtures` stellt
 * je eine bereit (9.3 Punkt 3).
 */
function targetsOf(seed: Seed): readonly Target[] {
  return ROUTE_NAMES.map((name) => {
    if (name === 'todo') return { label: 'todo (Todo-Detailansicht)', url: `/${href('todo', seed.billedTodoId)}` };
    if (name === 'templates') {
      return { label: 'templates (Vorlageneditor)', url: `/${href('templates', seed.templateId)}` };
    }
    return { label: name, url: `/${href(name)}` };
  });
}

/**
 * Dieselbe Menge wie {@link targetsOf}, mit einer Ausnahme für A9: Die
 * Einstellungen öffnen ohne Angabe den Bereich „Darstellung" (`AREA_LIST[0]`,
 * `SettingsScreen.tsx`) — zu kurz, um bei 820px Rahmenhöhe zuverlässig eine
 * eigene Laufstrecke zu erzwingen. Gemessen (nicht geraten, siehe Bericht):
 * `?bereich=standardtags` (`DefaultTagSettings`) trägt nur ein Suchfeld und
 * die aktuell gewählten Tags als Chips — der ganze Tag-Baum aus 9.4 erscheint
 * erst als Vorschlagsliste einer Eingabe, nicht unaufgefordert; gemessen
 * 671/671, keine eigene Laufstrecke. `?bereich=daten` (`DataTransferSettings`)
 * zeigt Datensicherung, Fremdimport und Umzug **unaufgefordert** vollständig
 * und trägt dabei zuverlässig mehr Höhe, als der Rahmen bei 1280×820 hat
 * (gemessen 786/671).
 */
function a9TargetsOf(seed: Seed): readonly Target[] {
  return targetsOf(seed).map((target) =>
    target.label === 'settings'
      ? { label: target.label, url: `/${href('settings', undefined, { bereich: 'daten' })}` }
      : target,
  );
}

type A9Axis = 'vertical' | 'horizontal';

interface A9AnchorState {
  readonly found: boolean;
  readonly tabIndexZero: boolean;
  readonly ownRunning: boolean;
}

/**
 * A9 (a) und (b), 9.7 — Fund, Tabulatorhalt und „eigene Laufstrecke" des
 * Kastens mit `id="inhalt"`. „Eigene Laufstrecke" heißt: `overflow` läßt
 * tatsächlich laufen, **und** der Kasten hat wirklich etwas zu laufen.
 * `scrollHeight > clientHeight` allein genügt nicht — ein Kasten mit
 * `overflow-y: visible` meldet dieselbe Ungleichheit, obwohl `scrollTop` dort
 * für immer 0 bleibt (gemessen, siehe Bericht): Genau das ist der Zustand von
 * Laufbereich A der Zeiterfassung unterhalb von 68rem
 * (`viewport-layout.css:628-633`).
 */
async function anchorRunningState(page: Page, axis: A9Axis): Promise<A9AnchorState> {
  return page.evaluate((axisArg) => {
    const anchor = document.getElementById('inhalt');
    if (anchor === null) return { found: false, tabIndexZero: false, ownRunning: false };
    function isRunningAxis(el: Element, ax: string): boolean {
      const style = window.getComputedStyle(el);
      if (ax === 'horizontal') {
        if (style.overflowX === 'visible') return false;
        return el.scrollWidth > el.clientWidth + 1;
      }
      if (style.overflowY === 'visible') return false;
      return el.scrollHeight > el.clientHeight + 1;
    }
    return {
      found: true,
      tabIndexZero: (anchor as HTMLElement).tabIndex === 0,
      ownRunning: isRunningAxis(anchor, axisArg),
    };
  }, axis);
}

interface A9ScrollState {
  readonly measured: boolean;
  readonly usedAncestor: boolean;
  readonly position: number;
}

/**
 * A9 (c), 9.7 — die Bildlaufstelle des Kastens mit `id="inhalt"` selbst, oder
 * — hat er in dieser Fenstergröße keine eigene Laufstrecke — die seines
 * nächsten laufenden Vorfahren. Beide Zweige laufen über **dieselbe**
 * Auswertung, vor und nach der Taste, damit „vorher"/"nachher" denselben
 * Kasten meinen, auch wenn zwischen den beiden Aufrufen nichts sich ändert
 * außer der Bildlaufstelle selbst.
 */
async function scrollPositionOfAnchorOrAncestor(page: Page, axis: A9Axis): Promise<A9ScrollState> {
  return page.evaluate((axisArg) => {
    function isRunningAxis(el: Element, ax: string): boolean {
      const style = window.getComputedStyle(el);
      if (ax === 'horizontal') {
        if (style.overflowX === 'visible') return false;
        return el.scrollWidth > el.clientWidth + 1;
      }
      if (style.overflowY === 'visible') return false;
      return el.scrollHeight > el.clientHeight + 1;
    }
    const anchor = document.getElementById('inhalt');
    if (anchor === null) return { measured: false, usedAncestor: false, position: 0 };
    let target: Element | null = anchor;
    let usedAncestor = false;
    if (!isRunningAxis(anchor, axisArg)) {
      usedAncestor = true;
      target = anchor.parentElement;
      while (target !== null && !isRunningAxis(target, axisArg)) target = target.parentElement;
    }
    if (target === null) return { measured: false, usedAncestor, position: 0 };
    const element = target as HTMLElement;
    return { measured: true, usedAncestor, position: axisArg === 'horizontal' ? element.scrollLeft : element.scrollTop };
  }, axis);
}

/* Die Läufe                                                            */

test.describe('T-323 Abschnitt 9 — Meßsatz für fensterfeste Flächen (T-330)', () => {
  let seed: Seed;

  test.beforeAll(async () => {
    seed = await seedFixtures();
  });

  test.afterAll(async () => {
    await teardownFixtures(seed);
  });

  test('A1/A2/A2b/A3/A7(Kante)/A8 — jede Ansicht aus ROUTE_NAMES bei jeder Fenstergröße', async ({ page }) => {
    // 11 Routen × 7 Größen, jede mit eigener Navigation, Ladewartung und
    // A8-Kindermessung — deutlich über dem Vorgabezeitlimit von 60s. A7-Kante
    // und A8 laufen in derselben Navigation mit statt in eigenen Läufen: bei
    // 77 Seitenaufrufen ist eine geteilte Navigation kein Feinschliff, sondern
    // die Hälfte oder mehr der Laufzeit.
    test.setTimeout(480_000);

    // Selbstprüfung der Zahl hinter „44 von 44" (T-334): vier getragene
    // Größen. Ändert sich das (eine achte Fenstergröße, eine verschobene
    // Schwelle), soll das hier auffallen und nicht nur in einem Kommentar
    // veralten.
    expect(GETRAGEN_SIZES.length, 'Anzahl der getragenen Größen (E-115/AK-02) hat sich geändert').toBe(4);

    const targets = targetsOf(seed);
    const violations: Violation[] = [];
    // 9.6, die zwei Untergrenzen — global über den ganzen Lauf gezählt und
    // nicht je Ansicht/Größe: Nicht jede der elf Ansichten hat bei jeder der
    // sieben Größen echten Überschuss (9.4 verstärkt gezielt vier Flächen),
    // eine Untergrenze je Zelle wäre an den übrigen blind rot. Über den ganzen
    // Lauf gezählt bleibt die Zusage scharf: Verschwindet der Selektorsatz
    // spurlos (Umbenennung) oder läuft nirgends mehr wirklich etwas, wird
    // **das** hier gemessen, nicht eine leere Menge stillschweigend grün.
    let a8RunAreasFoundTotal = 0;
    let a8RunAreasRunningTotal = 0;

    for (const size of WINDOW_SIZES) {
      await page.setViewportSize({ width: size.width, height: size.height });
      const getragen = isGetragen(size);
      const includeSplit = size.width < A8_SPLIT_BREAKPOINT_PX;

      for (const target of targets) {
        await gotoAndSettle(page, target.url);

        const doc = await documentMetrics(page);
        if (exceeds(doc.scrollHeight, doc.clientHeight)) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A1 (Höhe)',
            detail: `document.scrollingElement: scrollHeight ${doc.scrollHeight} > clientHeight ${doc.clientHeight}`,
          });
        }
        if (exceeds(doc.scrollWidth, doc.clientWidth)) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A1 (Breite)',
            detail: `document.scrollingElement: scrollWidth ${doc.scrollWidth} > clientWidth ${doc.clientWidth}`,
          });
        }

        const main = await boxMetricsOf(page, '.app__main');

        // A2a (9.1, berichtigt T-352, B-19) — waagerecht, **ohne** Untergrenze:
        // Die Breitenhälfte von A2 ist hierher gewandert und gilt an **jeder**
        // der sieben Größen, nicht nur an den vier getragenen. `.app__main`
        // trägt `overflow-x: hidden` (A-25.4) — eine Überbreite ist dort kein
        // Lauf, sondern ein Schnitt, und A-25.4 sichert „abgeschnitten wird
        // nichts" ausdrücklich auch unterhalb der getragenen Größe zu. Der
        // Fall unten 320×256 hat einen eigenen, kleinen Testfall (9.2).
        if (exceeds(main.scrollWidth, main.clientWidth)) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A2a (Breite, ohne Untergrenze)',
            detail: `.app__main: scrollWidth ${main.scrollWidth} > clientWidth ${main.clientWidth}`,
          });
        }

        if (getragen) {
          // A2, stark — nur an den vier getragenen Größen (T-345 Abschnitt 2,
          // E-115/AK-02, A-25.4). Siehe Dateikopf für die Begründung des
          // Geltungsbereichs.
          if (exceeds(main.scrollHeight, main.clientHeight)) {
            violations.push({
              ansicht: target.label,
              groesse: size.label,
              zusicherung: 'A2 (Höhe, getragen)',
              detail: `.app__main: scrollHeight ${main.scrollHeight} > clientHeight ${main.clientHeight}`,
            });
          }
        } else {
          // A2b, schwach — unterhalb der getragenen Größe (7.2: „Laufen
          // lassen — und zwar den Rahmen"). Nichts wird abgeschnitten (A1
          // gilt hier ohnehin uneingeschränkt weiter) und nichts unerreichbar:
          // `.app__main` darf laufen, solange `overflow-y` das auch zulässt.
          const overflowY = await page
            .locator('.app__main')
            .first()
            .evaluate((element) => window.getComputedStyle(element).overflowY);
          if (overflowY === 'hidden') {
            violations.push({
              ansicht: target.label,
              groesse: size.label,
              zusicherung: 'A2b (unerreichbar)',
              detail: `.app__main: overflow-y ist "hidden" unterhalb der getragenen Größe — Inhalt kann unerreichbar werden`,
            });
          }
        }

        const structure = await screenStructureCounts(page);
        if (structure.screenCount !== 1) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A3 (.screen)',
            detail: `${structure.screenCount} Kindelement(e) von .app__main mit Klasse .screen statt 1`,
          });
        } else if (structure.bodyCount !== 1) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A3 (.screen__body)',
            detail: `${structure.bodyCount} direkte Kindelement(e) von .screen mit Klasse .screen__body statt 1`,
          });
        }

        // A7, zweite Hälfte (9.1, seit T-334) — Kopfkante gleich Inhaltskante,
        // nur an den vier getragenen Größen (44 = 11 Ansichten × 4 Größen,
        // dieselbe Zahl wie in T-334 „44 von 44 Fällen auf 0 gebracht").
        if (getragen) {
          const header = page.locator('.screen__header').first();
          const body = page.locator('.screen > .screen__body').first();
          const headerBox = await header.boundingBox();
          const bodyBox = await body.boundingBox();
          if (headerBox === null || bodyBox === null) {
            violations.push({
              ansicht: target.label,
              groesse: size.label,
              zusicherung: 'A7 (Kante)',
              detail: `.screen__header oder .screen > .screen__body nicht meßbar (Kopf ${String(headerBox)}, Inhalt ${String(bodyBox)})`,
            });
          } else {
            const headerRight = headerBox.x + headerBox.width;
            const bodyRight = bodyBox.x + bodyBox.width;
            if (Math.abs(headerRight - bodyRight) > TOLERANCE_PX) {
              violations.push({
                ansicht: target.label,
                groesse: size.label,
                zusicherung: 'A7 (Kante)',
                detail: `rechte Kante: Kopf ${headerRight}, Inhalt ${bodyRight}`,
              });
            }
          }
        }

        // A8 (9.6) — je direktem, nicht fest positioniertem Kind eines
        // Laufbereichs darf nichts abgeschnitten sein. Läuft an jeder Größe,
        // nicht nur im getragenen Bereich (9.1 nennt für A8 keine
        // Geltungsgrenze, anders als A2) — der Rahmen selbst wird nur im
        // getragenen Bereich mitgemessen (9.6 Punkt 2, berichtigt T-344/T-352).
        const a8 = await measureRunAreaChildren(page, includeSplit, getragen);
        a8RunAreasFoundTotal += a8.runAreasFound;
        a8RunAreasRunningTotal += a8.runAreasRunning;
        for (const violation of a8.violations) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A8',
            detail:
              `Laufbereich ${violation.selector}, Kind <${violation.tag} class="${violation.className}">: ` +
              `scrollHeight ${violation.scrollHeight} > clientHeight ${violation.clientHeight}`,
          });
        }
      }
    }

    expect(violations, reportOf(violations)).toEqual([]);
    // 9.6, die zwei Untergrenzen. Getrennt von `violations` geprüft, weil sie
    // eine andere Frage stellen: nicht „ist etwas abgeschnitten", sondern
    // „hat dieser Lauf überhaupt hingesehen" (E-099 Punkt 3, dieselbe Klasse
    // wie der Aufräumlauf aus E-111: „null Waisen" muss von „null gelesene
    // Dateien" unterscheidbar sein).
    expect(
      a8RunAreasFoundTotal,
      'A8, erste Untergrenze: der Selektorsatz hat über den ganzen Lauf keinen einzigen Laufbereich gefunden — ' +
        'A8 wäre blind grün gewesen, nicht geprüft',
    ).toBeGreaterThan(0);
    expect(
      a8RunAreasRunningTotal,
      'A8, zweite Untergrenze: kein gefundener Laufbereich lief über den ganzen Lauf tatsächlich — der Vorrat ' +
        '(9.4) reicht nicht, oder die Menge trifft die falschen Kästen',
    ).toBeGreaterThan(0);
  });

  // 9.2, letzter Satz: „Bei 320×256 wird nur A1 und A2a geprüft — die Zusage
  // dort ist ‚nichts abgeschnitten', nicht ‚fensterfest'." Ein eigener, kleiner
  // Lauf statt einer achten Zeile in `WINDOW_SIZES`: A3/A4/A7(Kante)/A8 gelten
  // dort ausdrücklich nicht, und eine achte Größe im Hauptlauf hätte jede
  // dieser Zusicherungen einzeln ausnehmen müssen, statt die Ausnahme an
  // einer Stelle zu halten.
  test('A1/A2a bei 320×256 — die unterste Grenze aus 9.2, ohne A3/A4/A7/A8', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 320, height: 256 });

    const targets = targetsOf(seed);
    const violations: Violation[] = [];
    const size: WindowSize = { label: '320×256 (Untergrenze aus 9.2, nur A1/A2a)', width: 320, height: 256 };

    for (const target of targets) {
      await gotoAndSettle(page, target.url);

      const doc = await documentMetrics(page);
      if (exceeds(doc.scrollHeight, doc.clientHeight)) {
        violations.push({
          ansicht: target.label,
          groesse: size.label,
          zusicherung: 'A1 (Höhe)',
          detail: `document.scrollingElement: scrollHeight ${doc.scrollHeight} > clientHeight ${doc.clientHeight}`,
        });
      }
      if (exceeds(doc.scrollWidth, doc.clientWidth)) {
        violations.push({
          ansicht: target.label,
          groesse: size.label,
          zusicherung: 'A1 (Breite)',
          detail: `document.scrollingElement: scrollWidth ${doc.scrollWidth} > clientWidth ${doc.clientWidth}`,
        });
      }

      const main = await boxMetricsOf(page, '.app__main');
      if (exceeds(main.scrollWidth, main.clientWidth)) {
        violations.push({
          ansicht: target.label,
          groesse: size.label,
          zusicherung: 'A2a (Breite, ohne Untergrenze)',
          detail: `.app__main: scrollWidth ${main.scrollWidth} > clientWidth ${main.clientWidth}`,
        });
      }
    }

    expect(violations, reportOf(violations)).toEqual([]);
  });

  test('A4/A5 — Kopf bleibt, Laufbereich läuft wirklich: Todos, Buchungen, Tags', async ({ page }) => {
    test.setTimeout(120_000);

    const views: readonly Target[] = [
      { label: 'Todos', url: `/${href('todos')}` },
      { label: 'Buchungen', url: `/${href('bookings')}` },
      { label: 'Tags', url: `/${href('tags')}` },
    ];
    // Nur die getragenen Größen, in denen der Kopf tatsächlich stehen soll —
    // im Rückfall (Abschnitt 7.2/Z6) läuft der Rahmen mit, dort ist "der Kopf
    // bleibt" keine Zusage mehr.
    const sizes = [WINDOW_SIZES[0], WINDOW_SIZES[1]].filter((size): size is WindowSize => size !== undefined);
    const violations: Violation[] = [];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });

      for (const view of views) {
        await gotoAndSettle(page, view.url);

        const body = page.locator('.screen > .screen__body').first();
        const bodyMetrics = await body.evaluate((element) => ({
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        }));

        if (!(bodyMetrics.scrollHeight > bodyMetrics.clientHeight)) {
          violations.push({
            ansicht: view.label,
            groesse: size.label,
            zusicherung: 'A5',
            detail:
              `Laufbereich läuft nicht: scrollHeight ${bodyMetrics.scrollHeight} <= clientHeight ` +
              `${bodyMetrics.clientHeight} — der Vorrat reicht nicht, A1/A2 wären hier blind`,
          });
          continue;
        }

        const header = page.locator('.screen__header').first();
        const before = await header.boundingBox();
        await body.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        const after = await header.boundingBox();

        if (before === null || after === null) {
          violations.push({
            ansicht: view.label,
            groesse: size.label,
            zusicherung: 'A4',
            detail: `.screen__header nicht meßbar (vorher ${String(before)}, nachher ${String(after)})`,
          });
          continue;
        }

        if (Math.abs(before.y - after.y) > TOLERANCE_PX) {
          violations.push({
            ansicht: view.label,
            groesse: size.label,
            zusicherung: 'A4',
            detail: `Kopf bewegt sich: top vorher ${before.y}, nachher ${after.y}`,
          });
        }
      }
    }

    expect(violations, reportOf(violations)).toEqual([]);
  });

  test('A6 — Buchungsübersicht bei 960px Breite: der waagerechte Lauf erreicht seinen Kasten', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 960, height: 640 });
    await gotoAndSettle(page, `/${href('bookings')}`);

    const tableWrap = page.locator('.table-wrap').first();
    const tableMetrics = await tableWrap.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(
      tableMetrics.scrollWidth,
      `.table-wrap: scrollWidth ${tableMetrics.scrollWidth} <= clientWidth ${tableMetrics.clientWidth} ` +
        '— die Tabelle läuft nicht, A6 wäre blind',
    ).toBeGreaterThan(tableMetrics.clientWidth);

    // Das Paar aus 9.1: „läuft" von „abgeschnitten" unterscheiden — der
    // Rahmen bleibt trotz laufender Tabelle bei seiner Breite (A2).
    const main = await boxMetricsOf(page, '.app__main');
    expect(
      main.scrollWidth,
      `.app__main: scrollWidth ${main.scrollWidth} > clientWidth ${main.clientWidth} — der Rahmen ist trotz ` +
        'laufender Tabelle breiter geworden',
    ).toBeLessThanOrEqual(main.clientWidth + TOLERANCE_PX);
  });

  test('A7 (erste Hälfte) — die Rinne verhindert den Sprung: kurze und lange Todo-Liste bleiben gleich breit', async ({
    page,
  }) => {
    // Die zweite Hälfte von A7 (Kopfkante = Inhaltskante, seit T-334) läuft
    // im ersten Testfall dieser Datei mit, an jeder der vier getragenen
    // Größen und allen elf Ansichten — dieselbe Navigation, kein zweiter
    // Durchlauf nur für eine zusätzliche Randmessung.
    await page.setViewportSize({ width: 1280, height: 820 });

    await gotoAndSettle(page, `/${href('todos', undefined, { q: NO_MATCH_MARKER })}`);
    const shortWidth = await page
      .locator('.screen > .screen__body')
      .first()
      .evaluate((element) => element.clientWidth);

    await gotoAndSettle(page, `/${href('todos', undefined, { q: LIST_MARKER })}`);
    const longWidth = await page
      .locator('.screen > .screen__body')
      .first()
      .evaluate((element) => element.clientWidth);

    expect(
      Math.abs(shortWidth - longWidth),
      `kurze Liste ${shortWidth}px, lange Liste ${longWidth}px — die Bildlaufleisten-Rinne hält die Breite nicht`,
    ).toBeLessThanOrEqual(TOLERANCE_PX);
  });

  /**
   * A9 (9.1, 9.7; neu **T-352**, aus A-25.5 und AK-14, berichtigt **T-354**
   * nach `T-351-spec-ux-reviewer.md` B-20). Drei Teile:
   *
   *  - (a) — aggregiert über die vier **getragenen** Größen (nicht in jeder
   *    einzelnen): Der Kasten mit `id="inhalt"` hat in mindestens einer davon
   *    eine eigene Laufstrecke.
   *  - (b) — `#inhalt` ist mit `tabIndex === 0` selbst fokussierbar. Das ist
   *    die strukturelle Fassung von „kein weiterer Tabulatorhalt dazwischen":
   *    Ein fokussierbares Sprungziel wird von jedem Browser ohne
   *    Zwischenschritt direkt fokussiert (HTML-Standard, „scroll to the
   *    fragment"/„focusing steps") — das ist keine Annahme dieses Laufs,
   *    sondern die Eigenschaft, die geprüft wird. Die echte Marke
   *    `<a href="#inhalt">` wird bewußt **nicht** angeklickt: Sie ändert
   *    `location.hash`, und `useRoute` liest daraus über `parseRoute` eine
   *    neue Route — für den Kopf „inhalt" gibt es keinen Fall, also
   *    `DEFAULT_ROUTE` (Dashboard, `router.ts`). Das ist keine neue
   *    Beobachtung dieser Datei: Der Kopfkommentar oben zitiert genau diese
   *    Falle bereits für die Sprungmarke selbst. Ein echter Klick striche
   *    damit die gerade geprüfte Ansicht weg, bevor (c) gemessen ist.
   *  - (c) — je Größe, in zwei Zweigen (9.7): Hat der Kasten eine eigene
   *    Laufstrecke, muß `Bild ab` (Kanban: `Pfeil rechts`) **seine**
   *    Bildlaufstelle bewegen. Hat er keine, gilt das nur für die
   *    **Zeiterfassung unterhalb von 68rem** (960×640, 1024×640, 831×640,
   *    640×480) als der zweite, abschließend aufgezählte Zweig — dort muß
   *    statt dessen die Bildlaufstelle des nächsten laufenden Vorfahren
   *    (des `--split`-Rahmens) sich bewegen. Jedes andere Paar aus Ansicht
   *    und Fenstergröße ohne eigene Laufstrecke ist rot, **auch wenn sich
   *    dort etwas bewegt** — ein offener zweiter Zweig wäre an der
   *    Einstellungs-Bereichsschiene bei 1024×640 grün, obwohl dort genau der
   *    E-115-Verstoß aus 7.5 läuft, gegen den A9 gebaut wurde (T-343 B-07).
   *
   * `Bild ab`/`Pfeil rechts` laufen über echte Tastatur-Ereignisse
   * (`page.keyboard.press`), nicht über eine JS-Zuweisung an `scrollTop` —
   * sonst mäße dieser Lauf einen Bezeichner statt eines Verhaltens (derselbe
   * Fehler, den B-07 möglich gemacht hat). Ein einmaliger `page.mouse.move()`
   * je Navigation ist nötig: Ohne ihn liefert Chromium im **Headless**-Betrieb
   * für `PageDown`/`ArrowRight` keine Bildlaufbewegung — gemessen, nicht
   * vermutet (siehe Bericht) —, mit ihm verhält es sich wie ein sichtbarer
   * Browser.
   *
   * Z0/Z3/Z4 mißt dieser Lauf **nicht** (9.7, letzter Abschnitt): `gotoAndSettle`
   * wartet, bis die Ansicht fertig geladen ist, bevor irgendetwas gemessen wird.
   */
  test('A9 — Sprungmarke: kein Zwischenschritt, Bild-ab/Pfeil-rechts bewegt etwas (9.7)', async ({ page }) => {
    test.setTimeout(180_000);

    const targets = a9TargetsOf(seed);
    const violations: Violation[] = [];
    const ownRunningSeenByView = new Map<string, boolean>(targets.map((target) => [target.label, false]));

    for (const size of WINDOW_SIZES) {
      const getragen = isGetragen(size);
      const narrowForTime = size.width < A8_SPLIT_BREAKPOINT_PX;
      await page.setViewportSize({ width: size.width, height: size.height });

      for (const target of targets) {
        await gotoAndSettle(page, target.url);

        const axis: A9Axis = target.label === 'board' ? 'horizontal' : 'vertical';
        const key = axis === 'horizontal' ? 'ArrowRight' : 'PageDown';
        const state = await anchorRunningState(page, axis);

        if (!state.found) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A9 (a/b)',
            detail: 'kein Kasten mit id="inhalt" gefunden',
          });
          continue;
        }

        // (b) — strukturell: siehe Dateikopf dieses Falls.
        if (!state.tabIndexZero) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A9 (b)',
            detail: '#inhalt ist nicht fokussierbar (tabIndex !== 0) — die Sprungmarke bräuchte einen Zwischenschritt',
          });
        }

        // (a) — nur an den getragenen Größen aggregiert, nicht je Größe (9.7).
        if (getragen && state.ownRunning) ownRunningSeenByView.set(target.label, true);

        // (c) — der zweite Zweig ist abschließend aufgezählt: nur die
        // Zeiterfassung unterhalb von 68rem.
        const secondBranchLegit = target.label === 'time' && narrowForTime;
        if (!state.ownRunning && !secondBranchLegit) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A9 (c)',
            detail:
              'kein eigener Lauf, und der zweite Zweig (nächster laufender Vorfahr) ist an diesem Paar aus ' +
              'Ansicht und Fenstergröße nicht zugelassen (9.7: nur Zeiterfassung unterhalb von 68rem)',
          });
          continue;
        }

        await page.locator('#inhalt').focus();
        const before = await scrollPositionOfAnchorOrAncestor(page, axis);
        if (!before.measured) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A9 (c)',
            detail: 'weder der Kasten noch ein laufender Vorfahre wurde gefunden — nichts zu bewegen',
          });
          continue;
        }

        // Die Maus steht über dem Kasten mit `id="inhalt"`, unmittelbar vor
        // der Taste (Chromium im Headless-Betrieb liefert `PageDown`/
        // `ArrowRight` zuverlässiger aus, wenn eine Zeigerposition über der
        // betroffenen Fläche liegt). **Entscheidend, gemessen und nicht
        // geraten:** Der Bildlauf selbst braucht nach der Taste einen echten
        // Sichtbarkeitswechsel, bevor `scrollTop`/`scrollLeft` den neuen Wert
        // zeigen — eine sofortige Messung direkt nach `keyboard.press()`
        // liest noch den alten Stand und meldet eine Bewegung von 0 als 0,
        // die es nicht war.
        const anchorBox = await page.locator('#inhalt').boundingBox();
        if (anchorBox !== null) {
          await page.mouse.move(anchorBox.x + anchorBox.width / 2, anchorBox.y + anchorBox.height / 2);
        }
        await page.keyboard.press(key);
        await page.waitForTimeout(200);
        const after = await scrollPositionOfAnchorOrAncestor(page, axis);
        if (!(after.position > before.position)) {
          violations.push({
            ansicht: target.label,
            groesse: size.label,
            zusicherung: 'A9 (c)',
            detail:
              `${key === 'ArrowRight' ? 'Pfeil rechts' : 'Bild ab'} bewegt nichts: ${before.position} → ` +
              `${after.position} (Zweig: ${before.usedAncestor ? 'nächster laufender Vorfahr' : 'Kasten selbst'})`,
          });
        }
      }
    }

    for (const target of targets) {
      if (ownRunningSeenByView.get(target.label) !== true) {
        violations.push({
          ansicht: target.label,
          groesse: 'alle getragenen Größen',
          zusicherung: 'A9 (a)',
          detail: 'der Kasten mit id="inhalt" hat in keiner getragenen Fenstergröße eine eigene Laufstrecke',
        });
      }
    }

    expect(violations, reportOf(violations)).toEqual([]);
  });
});

/* Gegenprobe — "Rot zuerst" für A8 (T-345, Auftrag Abschnitt 1)         */

/**
 * Weist nach, daß die A8-Meßfunktion oben (`measureRunAreaChildren`s
 * Kernlogik, hier gegen eine eigene, minimale Seite statt gegen die
 * Anwendung gefahren) genau den Fehler gefangen hätte, den T-334 vor seiner
 * Behebung gemessen hat: sieben abgeschnittene Kinder, 27 bis 1030px, bei
 * **grünem** A1 bis A7 (`docs/design/fensterfeste-flaechen.md` 9.6).
 *
 * Braucht **keinen** laufenden lokalen Dienst und keine Oberfläche — nur
 * einen echten Browser mit `page.setContent()`. Das ist bewusst so gewählt
 * (T-345, Regel „die Ports gehören in dieser Welle dir, auf 17843/17844
 * nichts anfassen" traf hier auf einen bereits laufenden, aktiven
 * Arbeitsplatz-Vorgang auf genau diesen Ports und auf 5173 — `ss -ltn` und
 * `lsof` zeigten einen WebKitGTK-Prozeßbaum mit offener Verbindung, siehe
 * Bericht). Diese eine Gegenprobe läuft trotzdem echt, weil sie beweist, was
 * `measureRunAreaChildren` mißt, unabhängig davon, ob die Anwendung selbst
 * gerade erreichbar ist.
 *
 * Die Ursache, mechanisch nachgebaut statt am historischen DOM abgelesen
 * (`viewport-layout.css:169-188`, Kommentar dort): Ein Flex-Kind mit
 * `overflow != visible` hat nach CSS Flexbox §4.5 eine automatische
 * Mindesthöhe von **0**. Ohne `flex: none` an den direkten Kindern eines
 * Laufbereichs darf ein solches Kind unter seine Inhaltshöhe schrumpfen, und
 * `overflow: hidden` schneidet den Rest ab, statt ihn laufen zu lassen.
 */
test.describe('Gegenprobe (T-334, A8) — Flexbox-Mindesthöhe-Null ohne die Behebung', () => {
  /** Dieselbe Struktur wie `.screen > .screen__body > .card` — ohne Anwendung, ohne Netz. */
  function pageMarkup(withFix: boolean): string {
    return `<!doctype html>
<html><head><style>
  html, body { margin: 0; height: 100%; }
  .screen__body {
    display: flex;
    flex-direction: column;
    /* Erzwingt den Engpass, den T-334 bei geringer Fensterhöhe gemessen hat —
       hier fest verdrahtet, damit die Gegenprobe nicht von der echten
       Fensterhöhe abhängt. */
    block-size: 80px;
    overflow-y: auto;
  }
  .card { overflow: hidden; }
  ${withFix ? '.screen__body > * { flex: none; }' : ''}
</style></head>
<body>
  <div class="screen__body">
    <section class="card">
      <div style="block-size: 200px;">Inhalt, der ohne die Behebung unter seine Hoehe schrumpft und dabei
        abgeschnitten wird, weil das Flex-Kind .card (overflow: hidden) ohne flex: none eine automatische
        Mindesthoehe von 0 hat (CSS Flexbox Paragraph 4.5) und deshalb unter die Hoehe dieses inneren Kastens
        schrumpfen darf.</div>
    </section>
  </div>
</body></html>`;
  }

  test('ohne die T-334-Behebung: A8 findet die Karte als Verstoß (rot zuerst)', async ({ page }) => {
    await page.setContent(pageMarkup(false));
    const measurement = await measureRunAreaChildren(page, false, false);
    expect(measurement.runAreasFound, 'die Gegenprobe selbst hat keinen Laufbereich getroffen').toBe(1);
    expect(
      measurement.violations,
      'ohne `flex: none` an den Kindern des Laufbereichs muß die Karte als Verstoß erscheinen — tut sie das ' +
        'nicht, mißt A8 den historischen Fehler aus T-334 nicht',
    ).not.toEqual([]);
  });

  test('mit der T-334-Behebung: A8 findet keinen Verstoß mehr', async ({ page }) => {
    await page.setContent(pageMarkup(true));
    const measurement = await measureRunAreaChildren(page, false, false);
    expect(measurement.runAreasFound).toBe(1);
    expect(measurement.violations, reportOf(
      measurement.violations.map((v) => ({
        ansicht: 'Gegenprobe',
        groesse: '80×… (fest verdrahtet)',
        zusicherung: 'A8',
        detail: `${v.selector} <${v.tag} class="${v.className}">: scrollHeight ${v.scrollHeight} > clientHeight ${v.clientHeight}`,
      })),
    )).toEqual([]);
  });
});

/* Gegenprobe — "Rot zuerst" für die Rahmen-Ausnahme aus 9.6 Punkt 2     */
/* (T-352, B-19 aus `T-351-spec-ux-reviewer.md`)                        */

/**
 * Weist nach, daß `measureRunAreaChildren` den einzigen heute bekannten
 * E-115-Verstoß (`.screen__body--frame` läuft bei 1024×640 um 62 bis 86px
 * über, `docs/design/fensterfeste-flaechen.md` 9.6 Punkt 2, behoben in
 * T-348) **gefangen hätte**, wäre die Ausnahme so gebaut gewesen, wie sie
 * bis T-352 hier stand: `.screen__body--frame` in **jeder** Größe
 * ausgenommen. Mit `includeFrame = false` (die alte, widerlegte Fassung)
 * bleibt die Karte unentdeckt; mit `includeFrame = true` (die Vorschrift ab
 * T-344, hier nachgezogen) findet der Lauf sie. Das ist die Gegenprobe, die
 * der Auftrag verlangt: „Vorher wäre er rot gewesen."
 *
 * Dieselbe Bauart wie die Flexbox-Gegenprobe oben: eine eigene, minimale
 * Seite über `page.setContent()`, kein Dienst, kein Netz.
 */
test.describe('Gegenprobe (T-352, A8) — der Rahmen wird im getragenen Bereich mitgemessen', () => {
  /**
   * Derselbe Mechanismus wie die Flexbox-Gegenprobe oben, nur an
   * `.screen__body--frame` statt an `.screen__body` gehängt: Das Flex-Kind
   * `.settings-layout` (`overflow: hidden`, keine Mindesthöhe verdrahtet)
   * darf nach CSS Flexbox §4.5 unter seine Inhaltshöhe schrumpfen, weil der
   * Rahmen selbst mit `block-size: 515px` begrenzt ist — genau der
   * Fehlermodus aus T-341/T-344 bei 1024×640 (62 bis 86px Überlauf).
   */
  const FRAME_OVERFLOW_MARKUP = `<!doctype html>
<html><head><style>
  html, body { margin: 0; height: 100%; }
  .screen__body--frame {
    display: flex;
    flex-direction: column;
    block-size: 515px;
    overflow-y: hidden;
  }
  .settings-layout { overflow: hidden; }
</style></head>
<body>
  <div class="screen__body screen__body--frame">
    <section class="settings-layout">
      <div style="block-size: 577px;">62px höher als der Rahmen — derselbe Überlauf wie T-341 bei 1024×640.</div>
    </section>
  </div>
</body></html>`;

  test('mit `includeFrame: false` (die widerlegte Ausnahme) bleibt der Überlauf ungesehen', async ({ page }) => {
    await page.setContent(FRAME_OVERFLOW_MARKUP);
    const measurement = await measureRunAreaChildren(page, false, false);
    expect(measurement.runAreasFound, 'mit ausgenommenem Rahmen darf diese Gegenprobe keinen Laufbereich treffen').toBe(0);
    expect(measurement.violations).toEqual([]);
  });

  test('mit `includeFrame: true` (die Vorschrift seit T-344) meldet A8 den Überlauf', async ({ page }) => {
    await page.setContent(FRAME_OVERFLOW_MARKUP);
    const measurement = await measureRunAreaChildren(page, false, true);
    expect(measurement.runAreasFound, 'der Rahmen selbst muß jetzt als Laufbereich zählen').toBe(1);
    expect(
      measurement.violations,
      'der Rahmen läuft im getragenen Bereich nicht — sein 62px höheres Kind muß als A8-Verstoß erscheinen',
    ).not.toEqual([]);
  });
});
