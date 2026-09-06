/**
 * `role="alert"` im `TextField` — die Meldefläche steht seit T-162 (Befund
 * O-DA) von Anfang an im Baum, auch leer, und bekommt ihren Text erst,
 * während der Dialog schon steht (`apps/web/src/components/FormDialog.tsx`,
 * Kopfkommentar von `TextField`). Der Grund: Ein `role="alert"`, das erst
 * zusammen mit seinem Inhalt entsteht, wird von vielen Vorlesehilfen
 * übergangen, weil sie Änderungen an einer Region melden, die sie in diesem
 * Augenblick noch nicht kennen.
 *
 * ===========================================================================
 * Die Messlücke, die T-170 (O-DY) benannt hat
 * ===========================================================================
 *
 * Bislang misst **keine** Reihe diese Fläche in einem `TextField`.
 * `export-audit-and-locks.spec.ts:151` zählt `[role="alert"]` zwar, aber in
 * einem `InfoDialog` ohne `TextField` — dort geht es um die Abwesenheit einer
 * `InlineMessage` im Fehlerton, nicht um die Live-Region eines Eingabefelds.
 * `role="alert"` liegt seit T-162 in **jedem** `TextField` der
 * Hauptanwendung; ungemessen war, ob die Bauart tatsächlich trägt.
 *
 * Was hier geprüft wird, ist die **DOM-Bauart**, die eine Vorlesehilfe für
 * eine Ansage braucht — nicht die Ansage selbst. Ob eine echte Vorlesehilfe
 * den neuen Text tatsächlich vorliest, kann Playwright nicht messen; dafür
 * bräuchte es einen echten Screenreader (siehe O-EA, dort ausdrücklich
 * visual-qa zugewiesen: „möglichst mit Vorlesehilfe, weil eine Live-Region
 * nur dort etwas beweist"). Gemessen wird stattdessen zweierlei: Die Fläche
 * mit `role="alert"` existiert bereits **vor** dem Fehler, leer — und
 * **derselbe** Knoten trägt danach den Fehlertext, statt dass irgendwo im
 * Dialog ein neues `role="alert"`-Element entstünde, das eine Vorlesehilfe
 * verpassen würde, weil sie nur bereits bekannte Regionen beobachtet.
 *
 * ===========================================================================
 * Warum der Titel aus lauter Leerzeichen besteht, und nicht einfach leer bleibt
 * ===========================================================================
 *
 * Ein erster Versuch dieser Datei ließ das Titelfeld schlicht leer und klickte
 * „Anlegen" — das erreicht `TodoFormDialog.tsx` nie: Das Feld trägt `required`
 * (`TextField`, natives `<input required>`, kein `noValidate` am `<form>` in
 * `FormDialog.tsx`), und Chromiums **eigene** Formularprüfung fängt den Klick
 * vorher ab (`Please fill out this field.`, unlokalisiert englisch, eigene
 * Sprechblase statt der deutschen `role="alert"`-Fläche). React bekommt das
 * `submit`-Ereignis in diesem Fall gar nicht erst gemeldet — `titleTouched`
 * bleibt `false`, die Live-Region bleibt für immer leer, und der Testfall
 * würde in einer Zeitüberschreitung enden, nicht in einem aussagekräftigen
 * Fehlschlag.
 *
 * Ein Titel aus lauter Leerzeichen umgeht das: Chromiums native Prüfung sieht
 * einen nicht leeren Wert und lässt das Absenden zu; erst danach entscheidet
 * `trimmedTitle.length === 0` (`TodoFormDialog.tsx`) — die eigentliche,
 * deutsche Meldung. Genau dieser Weg steht auch im Auftrag zu O-EA
 * (`.claude/team/board.md`, T-172: „‚Neues Todo' mit einem Titel aus lauter
 * Leerzeichen"), nicht zufällig.
 *
 * **Befund, nicht behoben (außerhalb der eigenen Hoheit, `apps/web/**`
 * gehört frontend-dev):** Ein **wirklich** leeres Pflichtfeld erreicht die
 * deutsche Fehlermeldung dieses Formulars nie — nur Chromiums eigene,
 * englische Sprechblase. Dieselbe Bauart dürfte an jedem `required`-Feld der
 * Anwendung gelten (kein `<form>` trägt `noValidate`), nicht nur am Titel.
 * Siehe Bericht.
 */
import { test, expect } from '@playwright/test';

import { gotoDashboard } from './support/nav';

test.describe('TextField — role="alert" ist von Anfang an im Baum und wird am selben Knoten gefüllt (O-DA, Messlücke aus O-DY)', () => {
  test('Titel aus lauter Leerzeichen im offen bleibenden „Neues Todo"-Dialog: derselbe Alert-Knoten bekommt den Text', async ({
    page,
  }) => {
    await gotoDashboard(page);
    await page.locator('.screen__actions').getByRole('button', { name: 'Neues Todo' }).click();

    const dialog = page.getByRole('dialog', { name: 'Neues Todo' });
    await expect(dialog).toBeVisible();

    // Das Titelfeld ist das erste Feld des Dialogs (`TodoFormDialog.tsx`).
    const titleField = dialog.locator('.field').first();
    const titleInput = titleField.getByLabel('Titel');
    await expect(titleInput).toBeVisible();

    const alertRegion = titleField.locator('[role="alert"]');
    await expect(alertRegion).toHaveCount(1);
    // Vorher: die Fläche steht schon da, aber leer — kein Fehlertext, kein Kind.
    await expect(alertRegion).toBeEmpty();

    // Markiert den konkreten Knoten, um nach dem Klick zu unterscheiden
    // "derselbe Knoten hat jetzt einen Text" von "irgendwo ist ein neues
    // role=alert aufgetaucht" — Letzteres wäre für eine Vorlesehilfe wertlos.
    await alertRegion.evaluate((element) => element.setAttribute('data-e2e-marker', 'live-region'));

    // Lauter Leerzeichen, keine echte Leere — Begründung im Dateikopf.
    await titleInput.fill('   ');
    await dialog.getByRole('button', { name: 'Anlegen' }).click();

    const markedRegion = dialog.locator('[role="alert"][data-e2e-marker="live-region"]');
    await expect(markedRegion).toHaveCount(1);
    await expect(markedRegion).toContainText('Ohne Titel lässt sich ein Todo nicht wiederfinden.');

    // Der Dialog bleibt offen — kein Absenden ohne Titel (`submit()` in
    // `TodoFormDialog.tsx` bricht vor jedem Netzwerkaufruf ab).
    await expect(dialog).toBeVisible();
  });
});

/**
 * ===========================================================================
 * O-IE — die Rückführung zum ungültigen Feld (T-202, Befund O-FR 4.3)
 * ===========================================================================
 *
 * T-202 hat behoben, was `visual-qa` in T-198 im Browser gemessen hatte: In
 * einem **gescrollten** Formulardialog blieb nach einem gescheiterten
 * Absenden das erste ungültige Feld samt seiner Fehlermeldung außerhalb des
 * Sichtbereichs stehen. Für einen sehenden Tastaturbenutzer, der bis zum
 * Absendeknopf getabbt und dort abgesendet hatte, geschah dadurch scheinbar
 * **nichts**. Die Behebung (`apps/web/src/lib/focus.ts#revealFirstInvalidWithin`,
 * aufgerufen aus einem `useLayoutEffect` in `components/FormDialog.tsx`) holt
 * seither das erste Element mit `aria-invalid="true"` in den Fokus und seinen
 * Block ins Bild. Sie sitzt an der **einen** Stelle, an der `apps/web` ein
 * `<form>` hat, und gilt damit für alle 16 Formulardialoge — hier gemessen am
 * „Neues Todo"-Dialog, wie schon die obige Reihe.
 *
 * Der Fall hatte bislang **keinen** Prüffall (offene Frage aus dem T-202-
 * Bericht). Die obige Reihe öffnet zwar denselben Dialog, klickt „Anlegen"
 * aber über einen Playwright-Locator direkt an — und genau das lässt den
 * Rumpf des Dialogs (`.dialog__body--form`, `max-height: 60vh`) **nie**
 * scrollen: Der Absendeknopf steht im `.dialog__footer`, außerhalb des
 * rollenden Rumpfes, und Playwrights Klick braucht dafür keinen Bildlauf.
 * Gemessen (siehe Kopfkommentar dieser Datei, gleicher Aufbau): Vor **und**
 * nach einem direkten Klick bleibt `scrollTop` bei `0`. Ein Prüffall, der die
 * beiden neuen Messungen unten einfach an die obige Reihe anhängte, wäre
 * deshalb **immer grün** gewesen — ob die Behebung existiert oder nicht — und
 * hätte nichts gemessen. Genau das warnt der Auftrag zu O-IE ausdrücklich an.
 *
 * Diese Reihe erreicht den Absendeknopf deshalb **über die echte
 * Tabulatortaste**, wie ein Tastaturbenutzer es täte (dieselbe Bauart wie in
 * `toast-tab-order-scroll.spec.ts`, SC 2.4.7). Damit wandert der Fokus durch
 * die Felder des Formulars — unter anderem durch den mehrzeiligen Vermerk
 * nahe dem unteren Rand —, und der Browser holt jedes fokussierte Feld selbst
 * in den sichtbaren Ausschnitt des rollenden Rumpfes. Das schiebt den Rumpf
 * tatsächlich nach unten, bevor der Absendeknopf überhaupt erreicht ist.
 *
 * **Gemessen, bevor abgesendet wird (die Vorbedingung, die den Fall erst zu
 * einem echten macht):** `scrollTop=107` (von 107 möglichen), der Titelblock
 * bei `y=42.8`, Höhe `55.8` — sein unterer Rand (`98.6`) liegt **oberhalb**
 * des sichtbaren Rumpfes, der bei `y=149.8` beginnt. Der Titelblock ist damit
 * wirklich außerhalb des Bildes, nicht nur behauptet. Das deckt sich der
 * Größenordnung nach mit den `scrollTop`-Werten aus dem T-202-Bericht
 * (dortiges Beispiel auf der Musterseite: `67` von `74`, Titelblock bei
 * `-31,2..24,6`).
 *
 * **Ob dieser Fall vor T-202 rot gewesen wäre:** Ja — geprüft durch
 * `git show HEAD:apps/web/src/components/FormDialog.tsx` (der Stand vor den
 * unversionierten T-202-Änderungen dieses Laufs): Dort existiert
 * `revealFirstInvalidWithin` nicht, und die einzige `scrollIntoView`/`focus`-
 * Stelle in jener Fassung gilt dem **Server**-Fehler (`errorRef`, gesetzt aus
 * `mutation.error`) und dem ersten Feld beim **Öffnen** des Dialogs — keine
 * von beiden greift bei einem rein clientseitig abgewiesenen, leeren
 * Pflichtfeld wie hier (`TodoFormDialog.tsx` bricht vor jedem Netzwerkaufruf
 * ab, `mutation.error` bleibt `null`). Ohne die Behebung bliebe der Fokus auf
 * dem Absendeknopf stehen und `scrollTop` bei `107` — beide Messungen unten
 * schlügen fehl. Ein Umbau dieser zwei Dateien auf den alten Stand, um das im
 * selben Lauf auch tatsächlich vorzuführen, wurde nicht vorgenommen: Beide
 * gehören der Dateihoheit von `frontend-dev`, nicht von `e2e-tester`.
 */
test.describe('Rückführung zum ungültigen Feld nach gescrolltem Absendeversuch (O-IE, Behebung aus T-202)', () => {
  test('Tastaturweg bis zum Absendeknopf lässt den Rumpf scrollen; nach dem Fehlschlag steht er wieder oben, und der Fokus liegt auf dem Titelfeld', async ({
    page,
  }) => {
    await gotoDashboard(page);
    await page.locator('.screen__actions').getByRole('button', { name: 'Neues Todo' }).click();

    const dialog = page.getByRole('dialog', { name: 'Neues Todo' });
    await expect(dialog).toBeVisible();

    const titleField = dialog.locator('.field').first();
    const titleInput = titleField.getByLabel('Titel');
    await expect(titleInput).toBeVisible();

    // Lauter Leerzeichen, keine echte Leere — Begründung im Dateikopf oben.
    await titleInput.fill('   ');

    const body = dialog.locator('.dialog__body--form');

    // Über die echte Tabulatortaste bis zum Absendeknopf — nicht per Klick
    // auf den Locator, siehe Reihenkopf. Eine feste Anzahl Tabulatorschritte
    // wäre brüchig gegenüber künftigen Feldern; deshalb wird bis zum
    // erreichten Namen gelaufen, mit einer Obergrenze gegen eine
    // Endlosschleife, falls sich der Knopf einmal nicht mehr per Tab
    // erreichen ließe.
    let reachedSubmitButton = false;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await page.keyboard.press('Tab');
      const focusedName = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
      if (focusedName === 'Anlegen') {
        reachedSubmitButton = true;
        break;
      }
    }
    expect(reachedSubmitButton).toBe(true);

    // Die Vorbedingung, ohne die der Fall nichts mißt (siehe Reihenkopf):
    // Der Rumpf ist wirklich gescrollt, und der Titelblock steht wirklich
    // außerhalb seines sichtbaren Ausschnitts.
    const scrollTopBeforeSubmit = await body.evaluate((element) => element.scrollTop);
    expect(scrollTopBeforeSubmit).toBeGreaterThan(0);

    const bodyBoxBeforeSubmit = await body.boundingBox();
    const titleBoxBeforeSubmit = await titleField.boundingBox();
    expect(bodyBoxBeforeSubmit).not.toBeNull();
    expect(titleBoxBeforeSubmit).not.toBeNull();
    if (bodyBoxBeforeSubmit !== null && titleBoxBeforeSubmit !== null) {
      const titleBottomEdge = titleBoxBeforeSubmit.y + titleBoxBeforeSubmit.height;
      expect(titleBottomEdge).toBeLessThanOrEqual(bodyBoxBeforeSubmit.y);
    }

    // Absenden über die Eingabetaste, wie ein Tastaturbenutzer es täte — der
    // Absendeknopf trägt an dieser Stelle bereits den Fokus.
    await page.keyboard.press('Enter');

    const alertRegion = titleField.locator('[role="alert"]');
    await expect(alertRegion).toContainText('Ohne Titel lässt sich ein Todo nicht wiederfinden.');

    // Messung 1 (O-IE): Der Rumpf steht nach dem gescheiterten Versuch
    // wieder oben — derselbe Wert, den T-202 im Bericht nennt (`scrollTop=0`).
    await expect(body).toHaveJSProperty('scrollTop', 0);

    // Messung 2 (O-IE): `document.activeElement` ist das Titelfeld, nicht
    // mehr der Absendeknopf — und trägt `aria-invalid`, wie T-202 mißt.
    await expect(titleInput).toBeFocused();
    await expect(titleInput).toHaveAttribute('aria-invalid', 'true');

    // Der Dialog bleibt offen — kein Absenden ohne Titel.
    await expect(dialog).toBeVisible();
  });
});
