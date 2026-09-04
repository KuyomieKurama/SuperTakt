/**
 * Toast-Stapel: eine Meldung mit Rückweg wird nicht verdrängt (W-10 aus R-2a,
 * T-108, `apps/web/src/app/ToastContext.tsx`, `evict()`,
 * `docs/testplan.md` Abschnitt 20, Auftrag T-113 Punkt 2).
 *
 * ## Ausgangslage
 *
 * `ToastProvider` hält höchstens `MAX_TOASTS = 4` Meldungen gleichzeitig
 * (`ToastContext.tsx`). Bis T-108 warf die fünfte Meldung schlicht die
 * älteste hinaus (`previous.slice(-3)`), **gleich welche** — und seit E-059
 * bietet „Vom Board nehmen" keinen Bestätigungsdialog mehr, sondern
 * „Rückgängig" im Toast selbst an. Eine Meldung mit Rückweg ist damit der
 * **einzige** Weg zurück; verdrängt sie eine fremde Meldung, verschwindet der
 * Rückweg, ohne dass der Benutzer etwas gelesen oder getan hätte (SC 2.2.1).
 * Seit T-108 überspringt `evict()` jede Meldung mit `action` und wirft
 * stattdessen die **älteste ohne** Aktion hinaus.
 *
 * ## Aufbau dieses Falls
 *
 * Eine Meldung mit Rückweg entsteht über „Vom Board nehmen" auf einer
 * eigenen, leeren Spalte (`BoardScreen.tsx`, `setPlacement` — `toasts.show`
 * mit `action: { label: 'Rückgängig', … }`, weil `previous !== placement` und
 * `restoring` nicht gesetzt ist).
 *
 * Vier Meldungen ohne Aktion entstehen über das Kontrollkästchen der
 * Todo-Liste (`TodoListScreen.tsx`, `toggleDone`, Zweig `wasDone`) — vier
 * zuvor per API erledigte Todos werden dort wieder geöffnet. Die
 * Gegenrichtung („wieder offen") trägt bewusst keinen Rückweg: „Sie ist
 * selbst schon die Rücknahme" (Kopfkommentar von `toggleDone`).
 *
 * **Warum nicht „Als erledigt markieren" auf einer zweiten Board-Spalte
 * (Befund dieser Aufgabe, T-120).** So war dieser Fall ursprünglich gebaut
 * (T-113). Bis T-118 trug **keine** der beiden Richtungen ein `action`-Feld
 * auf dem Board; seit B-7 aus T-118
 * (`reports/T-118-frontend-dev.md`, Abschnitt 4: „derselbe Rückweg auf Board
 * und Detailansicht") bietet das Board beim **Setzen** von „Erledigt"
 * ebenfalls „Rückgängig" an — genau die Stelle, deretwegen dieser Fall
 * ursprünglich vier *aktionslose* Meldungen brauchte, trägt jetzt selbst eine
 * Aktion. Gemessen: Mit der alten Fassung (vier „Als erledigt markieren" auf
 * dem Board) trugen **alle fünf** ausgelösten Meldungen ein `action`-Feld,
 * `evict()` fand keine ohne und verdrängte gar nichts — der Stapel wuchs auf
 * fünf statt auf vier (`Received: 5`). Die geprüfte Sache selbst (W-10) ist
 * davon nicht berührt, nur dieser eine Fixture-Baustein.
 *
 * **Warum die Todo-Liste und nicht eine zweite Board-Spalte mit „Erledigt
 * zurücknehmen" (zweiter Befund dieser Aufgabe, T-120).** Naheliegender
 * Ersatz wäre gewesen, die vier Karten vorab per API zu erledigen und auf dem
 * Board über ihr Kartenmenü „Erledigt zurücknehmen" zu wählen — das trägt
 * laut Quelltext ebenfalls kein `action`-Feld. **Unter der angehaltenen Uhr
 * (siehe unten) ist das aber nicht verlässlich bedienbar**, gemessen: Jedes
 * Kartenmenü ist ein eigenes Ark-UI-Popover mit eigener Schließ-Animation;
 * deren Aufräumen hängt an einem `setTimeout`, das unter einer angehaltenen
 * Uhr **nie** feuert. Ein zweites, neu geöffnetes Kartenmenü traf dadurch
 * zuverlässig auf das noch nicht entfernte erste („`<span
 * class="menu__item-label">Als erledigt markieren</span> … subtree
 * intercepts pointer events`", 60 Sekunden Klick-Zeitüberschreitung). Das
 * Kontrollkästchen der Todo-Liste ist dagegen ein natives `<input
 * type="checkbox">` ohne Popover und ohne Zeitgeber-Abhängigkeit — mehrfach
 * hintereinander bedienbar, auch mit angehaltener Uhr. Die **eine** Board-
 * Menü-Bedienung dieses Falls („Vom Board nehmen") bleibt unverändert: Sie
 * öffnet genau ein Popover, und die anschließende Navigation zur Todo-Liste
 * entfernt es beim Verlassen des Bildschirms vollständig, unabhängig davon,
 * ob seine eigene Schließanimation je feuert.
 *
 * Fünf Meldungen insgesamt, eine mehr als `MAX_TOASTS`: Genau eine Verdrängung
 * findet statt, und sie trifft die älteste **ohne** Aktion — das erste der
 * vier Todos. Die Meldung mit Rückweg bleibt stehen, ihr Knopf bedienbar, bis
 * „Schließen" sie entfernt.
 *
 * ## Die Uhr steht still (T-120)
 *
 * Bis T-118 hing die Achtsekundenfrist (`AUTO_DISMISS_MS`, `ToastContext.tsx`,
 * `ToastItem`) an einer bei **jeder Zeichnung neuen** Abschlussfunktion: Eine
 * neue Meldung zeichnete den Anbieter neu, damit wechselte die Kennung von
 * `onDismiss`, damit lief der Zeitgeber jeder stehenden Meldung von vorn.
 * Dieser Fall ging bis dahin nur **wegen** dieses Fehlers auf — zwischen der
 * zweiten Zusicherung (erste „ist wieder offen“-Meldung) und der letzten
 * (`Schließen`-Klick) liegen mehrere Bedienschritte, mehrere `toBeVisible()`
 * und mehrere `expect`, und ohne den Fehler hätte das auf einer langsamen
 * Maschine mehr als acht Sekunden dauern und die zweite oder dritte Meldung
 * hätte von selbst verschwinden können (gemessen in
 * `reports/T-118-frontend-dev.md`, Abschnitt 6: alt „acht Sekunden nach der
 * letzten Änderung am Stapel“, neu „acht Sekunden ab der eigenen
 * Entstehung“). Die geprüfte Sache selbst — W-10, eine Meldung mit Rückweg
 * wird von `evict()` nicht verdrängt — ist davon unberührt und bleibt richtig;
 * nur durfte die Uhr diesen Fall nicht länger entscheiden.
 *
 * **Entscheidung: `page.clock.install()` vor `gotoBoard`, danach
 * `pauseAt(...)`** (Vorschlag 1 aus dem genannten Bericht), nicht die
 * Ersatzlösung „alle vier Meldungen ohne Zwischenwarten auslösen“. Mit
 * angehaltener Uhr feuert `setTimeout` in `ToastItem` überhaupt nicht, solange
 * niemand `fastForward`/`runFor`/`resume` aufruft — das tut dieser Fall
 * nirgends. Der Fall prüft damit ausschließlich die Verdrängung durch
 * `evict()`, unabhängig davon, wie lange der tatsächliche Testlauf braucht
 * (langsame Maschine, mehrere Agenten parallel, siehe `playwright.config.ts`-
 * Kopf). Die Ersatzlösung wäre billiger, gäbe aber die feste Reihenfolge im
 * Stapel auf, die der Kommentar oben ausdrücklich haben will („nacheinander …
 * damit die Reihenfolge im Stapel feststeht“) — mit der Uhr bleibt diese
 * Reihenfolge erhalten, ohne dass die Zeit mehr mitspielt. Der Preis dieser
 * Entscheidung ist der oben gemessene Ausschluss jeder **weiteren**
 * Menü-Bedienung während die Uhr steht — deshalb die Todo-Liste statt einer
 * zweiten Board-Spalte.
 *
 * `page.clock.install({ time: … })` läuft vor der Navigation (empfohlene
 * Reihenfolge der Playwright-Dokumentation, damit der Seitenaufbau selbst
 * noch mit echt laufenden Zeitgebern geschieht). `pauseAt(...)` danach
 * braucht einen Zeitpunkt, der aus Sicht der bis dahin normal mitlaufenden
 * gefälschten Uhr (`ClockController._syncRealTime`) nicht in der
 * Vergangenheit liegt — ein knapper Sicherheitsabstand
 * (`Date.now() + 2000`) fängt die Laufzeit zwischen dem Node-seitigen
 * `new Date()` und der tatsächlichen Ausführung im Browser ab; ohne ihn
 * scheiterte `pauseAt` hier reproduzierbar mit `Cannot fast-forward to the
 * past`. Auf welchen genauen Zeitpunkt pausiert wird, liest kein Fall dieser
 * Datei — entscheidend ist nur, dass die Uhr danach stillsteht, weit vor den
 * acht Sekunden aus `AUTO_DISMISS_MS`.
 */
import { test, expect } from '@playwright/test';

import { createPool, createTag, createTodo, deletePoolByName, deleteTag, deleteTodo, markTodoDone, type Todo } from './support/api';
import { gotoBoard, gotoTodos } from './support/nav';

test.describe('Toast-Stapel: eine Meldung mit Rückweg wird nicht verdrängt (W-10)', () => {
  test('Meldung mit „Rückgängig“ bleibt; die älteste ohne Aktion verschwindet; „Schließen“ entfernt weiterhin', async ({
    page,
  }) => {
    const run = Date.now();
    const undoColumnName = `E2E-Verdraengung-Rueckweg-${run}`;
    const undoTag = await createTag(`E2E-Verdraengung-RueckwegTag-${run}`);
    await createPool({ name: undoColumnName, placement: 'both', requiredTagIds: [undoTag.id] });

    const todos: Todo[] = [];
    for (let index = 0; index < 4; index += 1) {
      const todo = await createTodo({ title: `E2E-Verdraengung-Todo-${String(index)}-${run}` });
      // Vorbereitung, kein Teil der geprüften Bedienung (siehe Dateikopf,
      // T-120): Die vier aktionslosen Meldungen entstehen über das
      // Zurücknehmen von „Erledigt", das bereits erledigte Todos voraussetzt.
      await markTodoDone(todo.id);
      todos.push(todo);
    }

    try {
      // T-120 — die Uhr steht still, siehe Dateikopf. `run` (oben) bleibt die
      // echte Wanduhrzeit für eindeutige Testdaten; eingefroren wird nur die
      // Uhr der Seite, und erst nachdem sie geladen hat.
      await page.clock.install({ time: new Date() });
      await gotoBoard(page);
      await page.clock.pauseAt(new Date(Date.now() + 2000));

      // Meldung mit Rückweg — „Vom Board nehmen" fragt seit E-059 nicht mehr
      // nach, sondern bietet „Rückgängig" an (`BoardScreen.tsx`, `setPlacement`).
      // Die einzige Menü-Bedienung dieses Falls unter der angehaltenen Uhr
      // (siehe Dateikopf) — der Bildschirm wird danach verlassen.
      await page.getByRole('button', { name: `Spalte ${undoColumnName} verwalten` }).click();
      await page.getByRole('menuitem', { name: 'Vom Board nehmen' }).click();

      const undoToast = page.locator('.toast').filter({ hasText: 'Spalte vom Board genommen.' });
      await expect(undoToast).toBeVisible();
      const undoButton = undoToast.getByRole('button', { name: 'Rückgängig' });
      await expect(undoButton).toBeVisible();

      // Todo-Liste, gefiltert auf die vier eigenen Todos dieses Falls
      // (`q`, siehe `support/nav.ts#gotoTodos`). „Erledigte einblenden": Ohne
      // sie zeigt die Liste keine der vier bereits erledigten Zeilen
      // (`TodoListScreen.tsx`, Vorgabe `showDone = false`).
      await gotoTodos(page, { q: String(run) });
      await page.getByRole('button', { name: 'Erledigte einblenden' }).click();

      // Vier Meldungen ohne Aktion, nacheinander — das Zurücknehmen von
      // „Erledigt" zeigt keinen Rückweg (`toggleDone`, Zweig `wasDone`, kein
      // `action`-Feld im `toasts.show`-Aufruf, siehe Dateikopf, T-120). Jede
      // wird abgewartet, bevor die nächste ausgelöst wird, damit die
      // Reihenfolge im Stapel feststeht. Ein natives Kontrollkästchen statt
      // eines Menüs — kein Popover, keine Zeitgeber-Abhängigkeit (siehe
      // Dateikopf).
      for (const todo of todos) {
        // `.click()`, nicht `.uncheck()`: Das Kästchen ist von React
        // kontrolliert (`checked={done}`, aus Serverdaten) — sein sichtbarer
        // Zustand wechselt erst, nachdem `bump()` neu geladen hat, nicht
        // synchron mit dem Klick. `.uncheck()` prüft den nativen Zustand
        // unmittelbar nach dem Klick und schlägt an einem kontrollierten
        // Element deshalb fehl; die folgende Meldung ist die richtige
        // Erfolgsprobe.
        await page.getByLabel(`„${todo.title}“ als offen markieren`).click();
        await expect(
          page.locator('.toast').filter({ hasText: `„${todo.title}“ ist wieder offen.` }),
        ).toBeVisible();
      }

      // Fünf ausgelöste Meldungen, `MAX_TOASTS = 4`: genau eine Verdrängung.
      await expect(page.locator('.toast')).toHaveCount(4);

      // Die Meldung mit Rückweg steht weiterhin, ihr Knopf ist bedienbar.
      await expect(undoToast).toBeVisible();
      await expect(undoButton).toBeEnabled();

      // Die älteste ohne Aktion — das erste Todo — ist verschwunden.
      const firstTodoToast = page.locator('.toast').filter({ hasText: `„${todos[0]?.title}“ ist wieder offen.` });
      await expect(firstTodoToast).toHaveCount(0);

      // Die drei jüngeren ohne Aktion stehen noch.
      for (const todo of todos.slice(1)) {
        await expect(
          page.locator('.toast').filter({ hasText: `„${todo.title}“ ist wieder offen.` }),
        ).toBeVisible();
      }

      // „Schließen" entfernt eine Meldung mit Rückweg weiterhin — genommen ist
      // ihr allein das Verdrängen durch eine fremde Meldung, nicht der eigene
      // Schließweg (`ToastContext.tsx`, Abschnitt „Was einer Meldung mit
      // Aktion weiterhin passieren kann").
      await undoToast.getByRole('button', { name: 'Meldung schließen' }).click();
      await expect(undoToast).toBeHidden();
    } finally {
      await deletePoolByName(undoColumnName).catch(() => undefined);
      for (const todo of todos) {
        await deleteTodo(todo.id).catch(() => undefined);
      }
      await deleteTag(undoTag.id).catch(() => undefined);
    }
  });
});
