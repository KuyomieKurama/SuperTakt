/**
 * Fokusrückkehr zum Menü-Auslöser nach dem Schließen eines Dialogs — die
 * Reihe, die den Fokusfall selbst misst (T-170, Auflage O-DY aus T-162).
 *
 * ===========================================================================
 * Warum diese Datei existiert, und warum keine Einheitenprüfung dafür reicht
 * ===========================================================================
 *
 * O-CY-2 stand zweimal auf dem Board, weil zweimal eine Zusage gemacht wurde,
 * die keine Prüfung hielt: T-157 hat `focusTriggerFirst` in `Menu.tsx`
 * eingebaut und als Behebung gemeldet; T-161 hat im Browser gemessen, dass
 * der Fokus nach Escape trotzdem auf `<body>` fiel — für „Bearbeiten" **und**
 * „Löschen", mit der Maus **und** mit der Tastatur, und bei einem
 * Menüeintrag ganz ohne Dialog (O-CY-3). T-162 hat die Ursache geklärt
 * (`focusMenu` aus `@zag-js/menu` holt den Fokus per `requestAnimationFrame`
 * zurück, bevor die Fokusfalle des Dialogs scharfstellt) und mit
 * `finalFocusEl` aus einem `useLayoutEffect` in `DialogSurface.tsx` behoben —
 * Einzelheiten in den Kopfkommentaren von `apps/web/src/components/Menu.tsx`
 * und `apps/web/src/components/DialogSurface.tsx`.
 *
 * Der Fehler ist eine Wettlaufbedingung zwischen einem `requestAnimationFrame`
 * und React-Zustandsänderungen — genau die Art von Fehler, die eine
 * Komponentenprüfung mit gefälschten Zeitgebern nicht sieht (sie sieht nicht
 * *wann* der echte Browser einen Frame malt). Deshalb trägt kein
 * `unit-tester`-Fall diesen Fall; der richtige Ort ist diese Reihe, im echten
 * Chromium.
 *
 * ===========================================================================
 * Was gemessen wird, und warum zu mehreren Zeitpunkten
 * ===========================================================================
 *
 * `document.activeElement` **nach** dem Schließen — nicht nur unmittelbar
 * danach, sondern auch einige hundert Millisekunden später. Genau darin lag
 * der Fehler, den T-157 übersehen und T-161 gefunden hat: Die Rückholung
 * griff zunächst (der Auslöser bekam kurz echt den Fokus), wurde dann aber
 * von `focusMenu` rückgängig gemacht, bevor der Menükasten verschwand. Eine
 * Prüfung, die nur bei t+0 hinsieht, hätte den Fehlschlag verpasst.
 *
 * Geprüft wird der **zugängliche Name** des fokussierten Elements
 * (`focusedAccessibleName` unten), nicht nur „irgendetwas hat den Fokus" —
 * der Fall aus T-161 fiel auf `<body>`, und `<body>` ist auch ein Element.
 * Ein bloßes `expect(locator).toBeFocused()` auf den erwarteten Auslöser
 * deckt denselben Fall zwar ebenfalls ab (es schlägt fehl, wenn `<body>` den
 * Fokus trägt), sagt im Fehlerfall aber nicht, *was* ihn stattdessen trägt —
 * deshalb zusätzlich die explizite Namensprobe.
 *
 * ===========================================================================
 * Was diese Reihe abdeckt, und was nicht
 * ===========================================================================
 *
 * Abgedeckt: „Bearbeiten" mit der Maus und mit der Tastatur (Pfeil ab +
 * Eingabe, ohne Pause dazwischen — mit Pause verdeckte sich der Fehler laut
 * T-161/T-162), „Löschen" (Rückfragedialog statt Formulardialog), Abschluss
 * über „Abbrechen" statt Escape, ein Menüeintrag ohne Dialog (O-CY-3,
 * Statuswechsel im Zeilenmenü) und die Gegenprobe „Neues Todo" auf dem
 * Dashboard, wo kein Menü davorsteht und es immer schon stimmte.
 *
 * Nicht abgedeckt: „Löschen" und der Statuswechsel über die Tastatur — beide
 * ließen sich nur mit einer festen Anzahl `ArrowDown`-Tastendrücke erreichen,
 * und diese Zahl hängt von der Zahl der im gemeinsamen Testbestand bereits
 * vorhandenen Status ab (dieselbe SQLite-Datei über den ganzen `test:e2e`-Lauf,
 * `support/services.ts`). Ein fester Zähler wäre entweder falsch oder ein
 * Zufallstreffer gewesen. Der Tastaturweg selbst ist mit „Bearbeiten"
 * (TP-FOCUS-02) bereits gemessen — der Unterschied zwischen den Einträgen ist
 * für den Fehler ohne Bedeutung, er sitzt in `@zag-js/menu` und kennt keinen
 * Eintragstyp.
 */
import { test, expect, type Locator, type Page } from '@playwright/test';

import {
  createStatus,
  createTimeEntry,
  createTodo,
  deleteTodo,
  deleteTodoStatus,
} from './support/api';
import { gotoDashboard, gotoExport, gotoTodos } from './support/nav';

/**
 * Der zugängliche Name des fokussierten Elements: `aria-label` zuerst (die
 * Menü-Auslöser tragen ihn über `triggerLabel`, `Menu.tsx`), sonst der
 * sichtbare Text (der Dashboard-Knopf „Neues Todo" trägt keinen). `<body>`
 * kommt als eigene, benannte Zeichenkette zurück statt als `null` oder leerer
 * Text — sonst sähe der Fehlschlag aus T-161 in einem Testprotokoll wie „kein
 * Text" statt wie das, was er ist: der Fokus liegt auf dem Dokumentkörper.
 */
async function focusedAccessibleName(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (active === null) return null;
    if (active === document.body) return '<body>';
    const ariaLabel = active.getAttribute('aria-label');
    if (ariaLabel !== null && ariaLabel.trim().length > 0) return ariaLabel;
    return active.textContent?.trim() ?? null;
  });
}

/**
 * Prüft `document.activeElement` bei t+0/100/300/600 ms — dieselben
 * Meßpunkte, mit denen T-162 den Fehler und die Behebung belegt hat
 * (`.claude/team/board.md`, T-162: „t+0/100/300/600/1000 ms"). Vier statt
 * fünf Punkte: Ein Unterschied, der sich bis 600 ms nicht zeigt, zeigt sich
 * nach den Messungen aus T-162 auch bis 1000 ms nicht mehr — der Fokus fällt
 * hier, wenn überhaupt, innerhalb der ersten zwei Browser-Frames.
 */
async function expectTriggerHoldsFocus(page: Page, trigger: Locator, name: string): Promise<void> {
  for (const delayMs of [0, 100, 300, 600]) {
    if (delayMs > 0) await page.waitForTimeout(delayMs);
    await expect(trigger, `Fokus auf dem Auslöser, t+${String(delayMs)}ms`).toBeFocused();
    expect(
      await focusedAccessibleName(page),
      `zugänglicher Name des fokussierten Elements, t+${String(delayMs)}ms`,
    ).toBe(name);
  }
}

function todoRow(page: Page, title: string): Locator {
  return page.locator('.todo-row', { hasText: title });
}

/** Der Menü-Auslöser einer Zeile — `triggerLabel` aus `TodoListScreen.tsx`, `TodoRow`. */
function rowMenuTrigger(page: Page, title: string): Locator {
  return todoRow(page, title).getByRole('button', { name: `Menü für „${title}“` });
}

test.describe('O-DY — der Menü-Auslöser hält den Fokus nach dem Schließen eines Dialogs, mit vollem Namen, auch später gemessen', () => {
  test('TP-FOCUS-01 — Maus: Zeilenmenü → „Bearbeiten" → Escape', async ({ page }) => {
    const title = `E2E-FOCUS-MOUSE-${String(Date.now())}`;
    const todo = await createTodo({ title });
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.click();
      await page.getByRole('menuitem', { name: 'Bearbeiten' }).click();

      const dialog = page.getByRole('dialog', { name: 'Todo bearbeiten' });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-02 — Tastatur, ohne Pause: Pfeil ab + Eingabe → „Bearbeiten" → Escape', async ({ page }) => {
    const title = `E2E-FOCUS-KEY-${String(Date.now())}`;
    const todo = await createTodo({ title });
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.focus();

      /*
       * Eingabe auf dem Auslöser öffnet das Menü und markiert den ersten
       * Eintrag ("Öffnen") — `@zag-js/menu`, `menu.machine.mjs`, Übergang
       * `closed --ARROW_DOWN--> open` mit `highlightFirstItem` (die
       * Zustandsmaschine bildet `Enter` auf dasselbe Ereignis ab wie
       * `ArrowDown`, `menu.connect.mjs`). Diese Zwischenprobe liegt bewusst
       * **vor** dem kritischen Schritt, nicht dazwischen.
       *
       * Den echten DOM-Fokus trägt dabei **der Menükasten** (`role="menu"`,
       * `tabIndex: 0`), nicht der einzelne Eintrag — die Markierung läuft
       * über `aria-activedescendant`/`data-highlighted` (`menu.connect.mjs`,
       * `getItemProps`), das klassische Muster für zusammengesetzte Widgets.
       * Ein `toBeFocused()` auf den Eintrag selbst wäre deshalb immer falsch,
       * unabhängig vom hier geprüften Fehler.
       */
      await page.keyboard.press('Enter');
      await expect(page.getByRole('menu')).toBeFocused();
      await expect(page.getByRole('menuitem', { name: 'Öffnen' })).toHaveAttribute('data-highlighted', '');

      /*
       * Der gemessene Fehlerfall (Menu.tsx, Kopfkommentar): "Liegen Pfeiltaste
       * und Eingabe im selben Bild — bei der Tastatur der Regelfall —,
       * überholt dieses Bild die Behebung." Deshalb hier ohne jede eigene
       * Wartezeit zwischen den beiden Tasten — mit einer Pause dazwischen
       * hätte T-157 den Fehler nicht übersehen.
       */
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const dialog = page.getByRole('dialog', { name: 'Todo bearbeiten' });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-03 — Maus: Zeilenmenü → „Löschen" (Rückfragedialog statt Formulardialog) → Escape', async ({
    page,
  }) => {
    const title = `E2E-FOCUS-DELETE-${String(Date.now())}`;
    const todo = await createTodo({ title });
    let deleted = false;
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.click();
      await page.getByRole('menuitem', { name: 'Löschen' }).click();

      // `role="alertdialog"`, nicht `role="dialog"` — der andere der beiden
      // Dialogbausteine, die O-CY-2 betrifft (`ConfirmDialog.tsx`).
      const dialog = page.getByRole('alertdialog', { name: 'Todo löschen?' });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      if (!deleted) await deleteTodo(todo.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-04 — Abschluss über „Abbrechen" statt Escape', async ({ page }) => {
    const title = `E2E-FOCUS-CANCEL-${String(Date.now())}`;
    const todo = await createTodo({ title });
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.click();
      await page.getByRole('menuitem', { name: 'Bearbeiten' }).click();

      const dialog = page.getByRole('dialog', { name: 'Todo bearbeiten' });
      await expect(dialog).toBeVisible();
      // Derselbe Rückweg wie Escape (beide setzen `open` auf `false`), aber
      // über einen Knopfklick statt eine Taste — eine eigene Auslösung von
      // `onDismiss`/`onCancel`, kein bloßer zweiter Weg zu Escape.
      await dialog.getByRole('button', { name: 'Abbrechen' }).click();
      await expect(dialog).toBeHidden();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-05 — Eintrag ohne Dialog: ein Statuswechsel im Zeilenmenü lässt den Fokus nicht ins Nichts fallen (O-CY-3)', async ({
    page,
  }) => {
    const run = Date.now();
    const title = `E2E-FOCUS-NODIALOG-${String(run)}`;
    const statusA = await createStatus(`E2E-Focus-Status-A-${String(run)}`);
    const statusB = await createStatus(`E2E-Focus-Status-B-${String(run)}`);
    const todo = await createTodo({ title, statusId: statusA.id });
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.click();
      // Dieser Eintrag öffnet keinen Dialog — die Zeile bleibt stehen, das
      // Menü schließt sich selbst (`Menu.tsx`, `useSelectHandler`).
      await page.getByRole('menuitem', { name: `Status: ${statusB.name}` }).click();
      await expect(page.getByText(`Status geändert: ${statusB.name}.`)).toBeVisible();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTodoStatus(statusA.id).catch(() => undefined);
      await deleteTodoStatus(statusB.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-06 — Gegenprobe: „Neues Todo" auf dem Dashboard, kein Menü davor, stimmte schon vor T-162', async ({
    page,
  }) => {
    await gotoDashboard(page);
    // `.screen__actions` grenzt gegen den zweiten, gleichnamigen Knopf im
    // Leerzustand der Karte "Zuletzt bearbeitet" ab (`DashboardScreen.tsx`) —
    // der erscheint nur, wenn der gemeinsame Testbestand noch kein Todo
    // kennt, und ist über den ganzen `test:e2e`-Lauf hinweg nicht verlässlich
    // leer oder gefüllt.
    const trigger = page.locator('.screen__actions').getByRole('button', { name: 'Neues Todo' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Neues Todo' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await expectTriggerHoldsFocus(page, trigger, 'Neues Todo');
  });
});

/**
 * ===========================================================================
 * O-JP — der Auslöser kommt an, und die eigene Auffrischung nimmt ihm danach
 * den Fokus wieder weg (T-218, ui-designer, `docs/design/traeger-und-
 * zusage.md` Abschnitt 11)
 * ===========================================================================
 *
 * Andere Klasse als O-DY oben, gleiche Familie: Auch hier überlebt das
 * Rückkehrziel den Weg dorthin nicht — nur ist hier nicht `@zag-js/menu` die
 * Ursache, sondern die eigene Fläche. Im Export, in einer aufgeklappten
 * Tagesgruppe, wechselt der Knopf hinter einer Buchung ohne Leistung
 * (`ExportGroups.tsx:303-319`) zwischen zwei **verschiedenen Bausteinen** —
 * einem beschrifteten `Button` ("Leistung nachtragen"), solange die Leistung
 * fehlt, und einem `IconButton` ("Leistung der Buchung … bearbeiten"), sobald
 * sie da ist. `entry.note` steuert diesen Wechsel, und `entry.note` ist genau
 * der Wert, den der Dialog dieses Knopfes ändert.
 *
 * **Der Ablauf, aus `BookingDialogs.tsx:161-165` (`BookingFormDialog.submit`,
 * Zweig "Ändern"):** `await updateTimeEntry(…)` → Toast → `bump()` →
 * `onClose()`. `bump()` erhöht `version` und stößt darüber eine **neue**
 * Anfrage an (`ExportScreen.tsx:289`, `useAsync` mit `version` in
 * `refreshDeps`) — ein Netzweg, der in der Übergabe von `onClose()` nicht
 * schon zurück sein kann. In dem Bild, in dem der Dialog verschwindet, trägt
 * die Zeile deshalb noch die **alte**, leere Leistung: Der ursprüngliche
 * `Button` steht noch im Baum, `finalFocusEl` (`DialogSurface.tsx:339-342`)
 * findet ihn, und der Fokus **kommt an**. Erst wenn die Antwort der
 * Auffrischung eintrifft, wechselt `entry.note` von leer auf gefüllt, React
 * hängt den `Button` aus und baut den `IconButton` neu auf, und der Browser
 * nimmt dem entfernten Knoten den Fokus — er fällt auf `<body>`.
 *
 * **Deshalb zwei Messungen, nicht eine — und nur die zweite sieht den
 * Fehler.** Eine Prüfung unmittelbar nach dem Schließen (t+0) besteht immer:
 * Der alte Knopf steht in diesem Bild noch. Erst die Messung **nach dem
 * Eintreffen der Auffrischung** kann den ausgehängten Knoten sehen. Das ist
 * dieselbe Lehre wie oben (O-DY), an einer anderen Ursache: Eine Fokusprüfung
 * bei genau einem Zeitpunkt beweist nichts über eine Wettlaufbedingung.
 *
 * **Woran das Eintreffen der Auffrischung festgemacht wird.** Kein fester
 * Zeitwert — das ist nach T-187 und T-205 die schwächste Antwort, die es
 * gibt: Wie lange die zweite Anfrage tatsächlich braucht, hängt von der
 * Maschine ab, auf der der Lauf steht, nicht von einer Konstante im
 * Testcode. Gemessen wird stattdessen dasselbe sichtbare Ereignis, das auch
 * den Fehler auslöst: Die Zeile zeigt danach den **neuen** Leistungstext
 * statt "— keine Leistung erfasst —" (`ExportGroups.tsx`, `.eentry__note`).
 * `expect(...).toContainText(...)` wartet darauf mit Playwrights eigener,
 * selbst nachziehender Zusicherung — keine eigene Wartezeit im Testcode.
 * Erst wenn diese Zusicherung besteht, ist die Auffrischung im DOM
 * angekommen, und erst dann folgt die zweite Fokusmessung.
 *
 * **Was genau geprüft wird, und warum über die Knotengleichheit statt über
 * einen Namen.** Der zugängliche Name des Symbolzweigs ist heute
 * `Leistung der Buchung … bearbeiten`; die Behebung aus T-218 Abschnitt 11
 * (ein Baustein, zwei Beschriftungen, mit einem verborgenen Zeilenbezug,
 * Abschnitt 11.4) ist eine **separate**, noch nicht gebaute Änderung, deren
 * genauer Wortlaut an einer offenen Frage an ux-designer hängt (F-10). Eine
 * Prüfung, die exakt auf den künftigen Wortlaut zielt, koppelte diesen Fall
 * an eine Entscheidung, die nicht seine ist. Gemessen wird deshalb die
 * Eigenschaft, um die es bei O-JP tatsächlich geht: **Ist es nach der
 * Auffrischung noch derselbe Knoten**, auf den der Fokus unmittelbar nach dem
 * Schließen gefallen ist? `page.evaluateHandle` hält eine Referenz auf
 * `document.activeElement` von Messung 1 fest; Messung 2 vergleicht sie
 * gegen `document.activeElement` zum späteren Zeitpunkt. Das ist zugleich
 * die Eigenschaft, die T-218 Abschnitt 11.2 als Entscheidung setzt ("ein
 * Baustein … damit das Rückkehrziel eine Eigenschaft des Knotens ist"), und
 * die einzige, die kein künftiger Bausteinwechsel vortäuschen kann. Ergänzend
 * dieselbe Namensprobe wie in O-DY oben (`focusedAccessibleName`): Sie soll
 * nach der Auffrischung mindestens **nicht** `<body>` lauten — das ist die
 * eine Bedingung, auf die 11.9 sich unabhängig vom Wortlaut festlegt
 * ("Nie `<body>`").
 *
 * **Ist dieser Fall heute rot?** Er muss es sein, sonst mißt er nichts
 * (T-224): Das Produkt ist an dieser Stelle noch nicht umgebaut, der Umbau
 * ist ui-designers Vorgabe für eine spätere Welle (T-218 Abschnitt 11.8).
 * Messung 1 besteht heute (der alte Knopf steht noch); Messung 2 schlägt
 * heute fehl, weil der Knoten inzwischen ausgehängt ist und der Fokus auf
 * `<body>` liegt.
 *
 * **Ein Meßproblem, live gefunden, und wie es hier gelöst ist.** Auf dieser
 * Maschine läuft die Anfrage aus `bump()` so schnell (lokaler Dienst,
 * `127.0.0.1`), dass sie regelmäßig **schon zurück ist**, bevor Playwright
 * — ein externer Prozess, der über CDP mit eigener Rundlaufzeit zusieht —
 * überhaupt das erste Mal hinsehen kann: Ein Lauf ohne Eingriff zeigte den
 * ausgehängten Knoten schon bei der *ersten* Messung, nicht erst bei der
 * zweiten (mit dem Ergebnis, dass beide Messungen denselben, an dieser
 * Stelle nicht aussagekräftigen Fehler gezeigt hätten — der Fall aus 11.1,
 * "eine Messung bei t+0 besteht", wäre dann selbst nicht geprüft gewesen).
 * Ein fester Zeitwert würde dieses Wettrennen nicht zuverlässig entscheiden,
 * er verschöbe nur die Wahrscheinlichkeit (dieselbe Lehre wie in T-187 —
 * "ein Fall, der auch vorher grün gewesen wäre, mißt nichts" — und in T-205
 * — ein Klick statt der echten Tabulatortaste hätte denselben Fall
 * unabhängig von der Behebung immer bestehen lassen). Die genaue,
 * deterministische Lösung hält stattdessen die Auffrischungsanfrage selbst
 * am Zügel: `page.route` fängt exakt die **eine** GET-Anfrage ab, die
 * `bump()` über `collectOpenEntries()`/`listTimeEntries` erneut auslöst
 * (`ExportScreen.tsx:278-289`, Filter `exportStatus=open`; nicht die
 * `PATCH`-Anfrage der Änderung selbst und nicht die erste, ursprüngliche
 * Ladeanfrage vor dem Öffnen des Dialogs), und lässt sie erst durch, wenn
 * Messung 1 steht. Damit ist "t+0" kein Zufallstreffer der Maschine mehr,
 * sondern ein vom Test gewählter Augenblick, an einer echten, im Produkt
 * ablaufenden Anfrage — kein Ersatz irgendeiner Reaktion durch eine
 * Testkonstante.
 */

/** Ein Zeitpunkt heute (Ortszeit des Laufs) — dieselbe Bauart wie in `export-end-to-end.spec.ts`. */
function todayAt(hour: number, minute: number): string {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

test.describe('O-JP — der Fokus überlebt das Schließen des "Leistung nachtragen"-Dialogs, aber nicht die eigene Auffrischung (T-218)', () => {
  test('TP-FOCUS-07 — Leistung nachtragen im Export: Messung bei t+0 besteht, Messung nach der Auffrischung sieht den Fehler', async ({
    page,
  }) => {
    const marker = `E2E-FOCUS-BILLING-${String(Date.now())}`;
    const todo = await createTodo({ title: marker });
    // Leere Leistung — genau der Wert, der den Knopf auf den `Button`-Zweig
    // schaltet ("Leistung nachtragen") und der Dialog dieses Knopfes ändert.
    await createTimeEntry({ todoId: todo.id, startedAt: todayAt(5, 0), endedAt: todayAt(5, 45), note: '' });

    try {
      await gotoExport(page);
      const group = page.locator('.egroup', { hasText: marker });
      await expect(group).toBeVisible();
      await group.getByRole('button', { name: /aufklappen/ }).click();

      const row = group.locator('.eentry');
      await expect(row).toHaveCount(1);
      await expect(row.locator('.eentry__note')).toContainText('keine Leistung erfasst');

      // Heutiger Zweig: `Button` mit sichtbarem Text, ohne Zeilenbezug im
      // Namen (die Lücke aus O-IH/SC 2.4.6 ist ein eigener, hier nicht
      // gemessener Befund). Substring-Vergleich (Playwright-Vorgabe), damit
      // dieselbe Suche auch nach T-218 Abschnitt 11.4 träfe, sollte der
      // verborgene Zeilenbezug dann schon ergänzt sein.
      const trigger = row.getByRole('button', { name: 'Leistung nachtragen' });
      await expect(trigger).toBeVisible();

      /*
       * Das Zügel für die Auffrischung (siehe Kopfkommentar). Nur die
       * GET-Anfrage, die `bump()` erneut auslöst (Filter `exportStatus=open`,
       * `ExportScreen.tsx:278-289`), wartet auf `refreshGate`; die ursprüngliche
       * Ladeanfrage ist zu diesem Zeitpunkt längst beantwortet (die Zeile steht
       * ja schon), und die `PATCH`-Anfrage der Änderung selbst trägt weder
       * dieses Muster noch diese Methode und läuft ungebremst durch.
       */
      let releaseRefresh: () => void = () => undefined;
      const refreshGate = new Promise<void>((resolve) => {
        releaseRefresh = resolve;
      });
      await page.route('**/time-entries**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const isOpenEntriesRefresh =
          request.method() === 'GET' &&
          url.pathname.endsWith('/time-entries') &&
          url.searchParams.get('exportStatus') === 'open';
        if (!isOpenEntriesRefresh) {
          await route.continue();
          return;
        }
        await refreshGate;
        await route.continue();
      });

      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Buchung bearbeiten' });
      await expect(dialog).toBeVisible();

      const newNote = `E2E-Leistung-nachgetragen-${marker}`;
      await dialog.getByLabel('Leistung').fill(newNote);
      await dialog.getByRole('button', { name: 'Speichern' }).click();
      await expect(dialog).toBeHidden();

      /*
       * ==================================================================
       * Messung 1 — unmittelbar nach dem Schließen (t+0)
       * ==================================================================
       * `bump()` hat die neue Anfrage erst gestartet, sie kann hier noch
       * nicht zurück sein (T-218 Abschnitt 11.1). Die Zeile trägt deshalb
       * noch die alte, leere Leistung, der ursprüngliche Knopf existiert
       * unverändert, und `finalFocusEl` findet ihn. Diese Messung muss heute
       * bestehen — sonst wäre der Fehler nie über zwei Wellen unentdeckt
       * geblieben (T-218 Abschnitt 11.1, letzter Absatz).
       */
      await expect(trigger, 'Fokus auf dem Auslöser, unmittelbar nach dem Schließen (t+0)').toBeFocused();
      expect(
        await focusedAccessibleName(page),
        'zugänglicher Name des fokussierten Elements, unmittelbar nach dem Schließen (t+0)',
      ).not.toBe('<body>');

      // Referenz auf den Knoten von Messung 1 — die Grundlage für die
      // Knotengleichheit in Messung 2 (siehe Kopfkommentar dieses Blocks).
      const focusedNodeAtT0 = await page.evaluateHandle(() => document.activeElement);

      /*
       * ==================================================================
       * Das Zügel lösen, das Eintreffen der Auffrischung abwarten
       * ==================================================================
       * Erst jetzt darf die gehaltene Anfrage zurück. Wann genau das im
       * Browser ankommt, bleibt offen — deshalb kein fester Zeitwert danach,
       * sondern dasselbe sichtbare Ereignis, das auch den Fehler auslöst: Die
       * Zeile zeigt die neu eingetragene Leistung. `toContainText` ist
       * Playwrights eigene, selbst nachziehende Zusicherung; sie besteht
       * genau dann, wenn die Antwort verarbeitet und neu gezeichnet ist.
       */
      releaseRefresh();
      await expect(row.locator('.eentry__note')).toContainText(newNote);
      await page.unroute('**/time-entries**');

      /*
       * ==================================================================
       * Messung 2 — nach dem Eintreffen der Auffrischung
       * ==================================================================
       * Die einzige Messung, die den heutigen Fehler sieht (T-218 Abschnitt
       * 11.1): React hat den `Button` inzwischen gegen den `IconButton`
       * getauscht, der Knoten von Messung 1 existiert nicht mehr im
       * Dokument, und der Browser hat ihm den Fokus genommen. Heute, vor der
       * Behebung aus T-218 Abschnitt 11.2, fällt er auf `<body>` — diese
       * Messung schlägt deshalb heute erwartungsgemäß fehl.
       */
      const sameNodeAfterRefresh = await page.evaluate(
        (node) => node !== null && node === document.activeElement,
        focusedNodeAtT0,
      );
      expect(
        sameNodeAfterRefresh,
        'derselbe Knoten hält den Fokus auch nach der Auffrischung (T-218 Abschnitt 11.2)',
      ).toBe(true);
      expect(
        await focusedAccessibleName(page),
        'zugänglicher Name des fokussierten Elements nach der Auffrischung — nie "<body>" (T-218 Abschnitt 11.9)',
      ).not.toBe('<body>');
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });
});
