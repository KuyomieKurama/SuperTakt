/**
 * Bewegungssatz der Hauptanwendung an einem Trigger, den keine andere Datei
 * abdeckt: der Timerstart auf einem erledigten Todo mit einer reinen
 * Board-Spalte (T-096) sowie das Verlassen einer „Nur erledigt"-Spalte.
 *
 * ## Was hier nicht mehr steht, und warum (E-120, E-125, T-399)
 *
 * Bis zum Add-in-Rückbau verglich diese Datei den Bewegungssatz **zwischen**
 * Hauptanwendung und Aufgabenbereich: Dieselbe Handlung — ein erledigtes Todo
 * wird durch eine Buchung wieder offen — sollte an beiden Flächen denselben
 * Satz ergeben. Das ist mit E-120 strukturell hinfällig geworden, nicht nur
 * überflüssig:
 *
 * - Der Aufgabenbereich **bucht nicht mehr** (A-10.16); `POST
 *   /addin/todos/:todoId/time-entries` ist mit T-389 vollständig aus dem
 *   Router gefallen, nicht nur ohne Aufrufer im Aufgabenbereich.
 * - `GET /addin/todo-matches` liefert seit T-397/T-398 **kein `poolMovement`
 *   mehr** (E-125 Punkt 1): „Ein Feld ohne Leser ist eine Zusage ohne
 *   Gegenstand" — der Aufgabenbereich zeigte den Wert nur an, um eine
 *   bevorstehende Buchung anzukündigen, und kündigt seit E-100/E-120 keine
 *   Handlung mehr an.
 *
 * Damit gibt es auf der Add-in-Seite **keine** Vorschau- und **keine**
 * Nachher-Fassung des Bewegungssatzes mehr, gegen die sich irgendetwas
 * vergleichen ließe — nicht „anders erreichbar", sondern nicht mehr
 * vorhanden. Zwei der vier ursprünglichen Fälle maßen ausschließlich diese
 * entfallene Fläche und sind ersatzlos gestrichen (Einzelbegründung an der
 * jeweiligen Stelle unten, statt hier gesammelt, nach demselben Vorbild wie
 * der Nachtrag in `docs/testplan.md` Abschnitt 25). Die zwei verbliebenen
 * Fälle brauchten den Aufgabenbereich nie oder nur für einen inzwischen
 * gestrichenen Nebenteil; sie prüfen ausschließlich die Hauptanwendung und
 * sind unverändert gültig.
 *
 * ## Was hier weiterhin geprüft wird
 *
 * `packages/domain/src/pool-movement.ts` rechnet die Bewegung, `poolMovementSentence`
 * formuliert den Satz — beide reine Fachlogik, ohne Laufzeitabhängigkeit
 * (siehe deren Kopf: „Diese Datei importiert nichts"). Die Erwartung wird
 * bewusst **aus der Domänenfunktion gezogen**, nicht als Literal geschrieben:
 * Ein Literal würde nur den heutigen Wortlaut ablichten; die Funktion zu
 * rufen prüft, dass die Oberfläche sie **tatsächlich** mit denselben drei
 * Listen und demselben Anlass aufruft.
 *
 * Der relative Import unten ist unbedenklich, obwohl `tests/e2e` kein
 * Arbeitsbereichspaket ist (`pnpm-workspace.yaml` schließt `tests/**`
 * ausdrücklich aus) — es gibt keine zweite Fassung, nur einen zweiten Pfad zu
 * derselben Datei.
 *
 * ## Der reine Board-Spalten-Fall (T-096, „in Welle C zurückgestellt")
 *
 * Die Spalte im Fall unten hat `placement: 'board'` — eine reine
 * Kanban-Spalte, kein Pool. Der Bewegungssatz rechnet über `list('all')` und
 * nennt sie trotzdem. Genau das ist der Fall, für den E-058 überhaupt
 * geschrieben wurde.
 */
import { test, expect } from '@playwright/test';

import { poolMovementSentence, type PoolMovement } from '../../packages/domain/src/pool-movement.ts';
import { createPool, createTag, createTodo, deletePoolByName, deleteTag, deleteTodo, markTodoDone, stopTimer } from './support/api';
import { gotoTodo } from './support/nav';

test.describe('Bewegungssatz — Hauptanwendung, zwei Trigger ohne Bezug zum Aufgabenbereich', () => {
  test('Nur `appears`, reine Board-Spalte: Timerstart öffnet ein erledigtes Todo wieder', async ({ page }) => {
    const run = Date.now();
    const columnName = `E2E-Bewegungssatz-Spalte-${run}`;
    const tag = await createTag(`E2E-Bewegungssatz-Erscheint-${run}`);
    await createPool({ name: columnName, placement: 'board', requiredTagIds: [tag.id] });

    const uiTodo = await createTodo({ title: `E2E-BEWEGUNG-UI-${run}`, tagIds: [tag.id] });

    try {
      await markTodoDone(uiTodo.id);

      // --- Timerstart auf der Detailansicht (S-03) --------------------------
      await gotoTodo(page, uiTodo.id);
      await expect(page.locator('.done-switch strong')).toHaveText('Erledigt');
      // Geltungsbereich `.screen` statt `#inhalt` (T-330, E-114): Die Marke
      // sitzt seit T-326 auf dem Laufbereich (`ScreenBody`), nicht mehr auf
      // dem Rahmen der Ansicht — ein Knopf im `.screen__header` läge damit
      // außerhalb. `.screen` ist die Ansicht selbst (Kopf **und**
      // Laufbereich, genau ein Treffer je Route) und trifft dieselbe Menge
      // wie zuvor `#inhalt` auf `.app__main`.
      const main = page.locator('.screen');
      const [startResponse] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes('/timer/start') && response.request().method() === 'POST',
        ),
        main.getByRole('button', { name: 'Timer starten' }).first().click(),
      ]);
      const startBody = (await startResponse.json()) as {
        data: { doneCleared: boolean; poolMovement: PoolMovement | null };
      };
      expect(startBody.data.doneCleared).toBe(true);
      const uiMovement = startBody.data.poolMovement;
      expect(uiMovement).not.toBeNull();
      // Der Punkt aus T-096: eine reine Board-Spalte steht im Bewegungssatz.
      expect(uiMovement?.appears).toContain(columnName);

      const expectedUiSentence = poolMovementSentence(uiMovement as PoolMovement, 'past', 'reopen');
      await expect(page.locator('.toast__title')).toContainText('ist wieder offen');
      // `announceStart` (`TimerContext.tsx`) setzt den Toast-Rumpf im
      // Wiederöffnen-Fall exakt auf den Satz aus `poolMovementSentence` —
      // keine weitere Umformulierung, kein Zusatztext.
      await expect(page.locator('.toast__body')).toHaveText(expectedUiSentence);
      expect(expectedUiSentence).toContain(columnName);

      // Aufräumen: den gerade gestarteten Timer sofort stoppen. Die
      // Stopp-Anzeige selbst ist Gegenstand von `timer-stop-announcement.spec.ts`.
      await stopTimer('E2E-Bewegungssatz-Aufräumung');
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(uiTodo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });

  test('Nur `leaves`: die Karte verlässt eine „Nur erledigt“-Spalte (Hauptanwendung)', async ({ page }) => {
    const run = Date.now();
    const columnName = `E2E-Bewegungssatz-NurErledigt-${run}`;
    const tag = await createTag(`E2E-Bewegungssatz-Leaves-${run}`);
    await createPool({
      name: columnName,
      placement: 'board',
      requiredTagIds: [tag.id],
      completion: 'done',
    });
    const todo = await createTodo({ title: `E2E-BEWEGUNG-LEAVES-${run}`, tagIds: [tag.id] });

    try {
      await markTodoDone(todo.id);

      await gotoTodo(page, todo.id);
      await expect(page.locator('.done-switch strong')).toHaveText('Erledigt');
      // `.screen` statt `#inhalt`, siehe Anmerkung im ersten Fall dieser Datei.
      const main = page.locator('.screen');
      const [startResponse] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes('/timer/start') && response.request().method() === 'POST',
        ),
        main.getByRole('button', { name: 'Timer starten' }).first().click(),
      ]);
      const startBody = (await startResponse.json()) as { data: { poolMovement: PoolMovement | null } };
      const movement = startBody.data.poolMovement;
      expect(movement).not.toBeNull();
      // Die Spalte trifft nur Erledigte — nach dem Aufheben verlässt die Karte
      // sie, und sonst erscheint sie in nichts (E-056).
      expect(movement).toEqual({ appears: [], enters: [], leaves: [columnName] });

      const expected = poolMovementSentence(movement as PoolMovement, 'past', 'reopen');
      expect(expected).toBe(`Es ist aus „${columnName}“ verschwunden und erscheint sonst nirgends.`);
      await expect(page.locator('.toast__body')).toHaveText(expected);

      await stopTimer('E2E-Bewegungssatz-Aufräumung');
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });
});

/*
 * Gestrichen (T-399, E-125), mit Begründung statt Ersatz:
 *
 * 1. „Kein Treffer: … in keinem Pool und in keiner Spalte" (Aufgabenbereich).
 *    Der Fall bildete ausschließlich die Add-in-Vorschau (`future`, aus
 *    `addinTodoMatches().poolMovement`) und die Add-in-Nachher-Fassung
 *    (`past`, aus `addinBookOnTodo().poolMovement`) — beide Datenquellen
 *    sind gefallen (E-125, E-120). Es gibt keine „gleiche Handlung, anderer
 *    Weg" mehr zu bauen: Der Aufgabenbereich berechnet und zeigt seit dem
 *    Rückbau keinen Bewegungssatz mehr, weder in die Zukunft noch danach.
 *    Eine Buchung über die Hauptanwendungs-API hätte nichts mit dem
 *    ursprünglichen Fall gemein — der prüfte ausdrücklich die
 *    Add-in-Berechnung, nicht die der Hauptanwendung, die bereits in den
 *    beiden Fällen oben und in `manual-booking-movement.spec.ts` steht.
 *
 * 2. „Vorschau auf offenem Todo mit bereits offener Buchung: `poolMovement:
 *    null` (Dienstprüfung, T-104)". Prüfte, dass `addinTodoMatches` für ein
 *    Todo mit bereits offener Buchung `poolMovement: null` liefert, um die
 *    Auflösung beliebig tiefer Ordnerbäume für eine Vorschau zu vermeiden,
 *    die ohnehin nichts mehr ändern würde. Das Feld, dessen Wert hier
 *    geprüft wurde, existiert nicht mehr (E-125) — und dieselbe fachliche
 *    Regel für die Hauptanwendung (`movementOfBooking` liefert `null`, wenn
 *    ein Todo bereits eine offene Buchung hat) ist bereits durch
 *    `manual-booking-movement.spec.ts` gedeckt („Gegenprobe — Todo mit
 *    bereits offener Buchung"), dort über die echte Buchungsoberfläche.
 */
