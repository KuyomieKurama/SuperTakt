# T-162 — O-CY-2 im Browser gemessen, die Meldefläche des Formulars, der eingefrorene Tag, der Wächter mit falschem Anlaß

**Aufgabe:** T-162 (Welle X)
**Rolle:** frontend-dev
**Status:** braucht Review
**Datum:** 2026-09-05

---

## Befundtafel

| Befund | Ergebnis | Womit gemessen |
|---|---|---|
| **O-CY-2** Fokus kehrt nach Escape nicht zum Zeilenmenü zurück | **behoben** | Playwright gegen die laufende Oberfläche, `document.activeElement` bei t+0/100/300/600/1000 ms, sieben Fälle, zwei vollständige Läufe (Protokoll unten) |
| **O-CY-3** (neu, in derselben Fläche gefunden) Menüeintrag **ohne** Dialog verliert den Fokus an `<body>` | **behoben** | dieselbe Messung, Fall F; Vorherzustand ausdrücklich gegengemessen, auch ohne die T-157-Zeile |
| **O-DA** `TextField` ohne Live-Region | **behoben** | Browsermessung: Knotenidentität der Region über drei Zustände, `aria-invalid`/`aria-describedby`/Dialoghöhe vorher und nachher |
| **O-DG** `TimeScreen.tsx:66` eingefrorenes `useMemo` | **behoben** | `useToday()` wie in T-157; Sichtprobe der Ansicht |
| **O-DK** Wächterkommentar nennt einen Anlaß, den es nicht mehr gibt | **berichtigt, und der heutige Anlaß ist gemessen** | Fall H der Browsermessung; Quelltextbeleg `BoardScreen.tsx` (T-102) |

Nachweislauf: `pnpm typecheck` (0) · `pnpm test` (1371 in 71 Dateien, alle grün) ·
`pnpm --filter @takt/web build` · `pnpm run contrast` (0 von 474 durchgefallen) ·
`pnpm run proof:foreign` (14/0) · `pnpm run proof:codepoints` (45/0) · `pnpm run boundaries` —
alles grün. Keine rote Ausgabe zu berichten.

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/web/src/components/DialogSurface.tsx` | Der Dialog hält seinen Auslöser fest (`useLayoutEffect` + `finalFocusEl`); Kopfabschnitt O-CY-2 neu; Kopfabschnitt der Rückholung auf die zwei heute tragenden Fälle berichtigt (O-DK) |
| `apps/web/src/components/Menu.tsx` | Rückholung des Auslösers, wenn der Fokus beim Schließen ins Nichts fällt (O-CY-3); Kommentar an `focusTriggerFirst` auf den gemessenen Stand gebracht |
| `apps/web/src/components/FormDialog.tsx` | `TextField`: dauerhafte `role="alert"`-Fläche um den Fehlertext (O-DA) |
| `apps/web/src/styles/app.css` | `.field__live:empty` — die leere Fläche nimmt keinen Platz |
| `apps/web/src/screens/TimeScreen.tsx` | `useToday()` statt `useMemo(() => todayCalendarDay(), [])` (O-DG) |

Nichts außerhalb von `apps/web/**`. `apps/desktop/**` und `packages/ui-tokens/**` sind unberührt —
insbesondere `apps/desktop/src-tauri/src/attachment.rs`, weder Produktiv- noch `#[cfg(test)]`-Teil.
Keine Datei von domain-dev, integration-dev, unit-tester oder e2e-tester angefasst.

**E-076 Punkt 3 eingehalten:** Keine Rolle, kein zugänglicher Name, kein Klassenname und kein
Datenattribut hat sich geändert. Neu ist ausschließlich ein zusätzlicher Knoten
(`div.field__live[role="alert"]`) innerhalb von `.field`. Die einzige Prüfreihe, die `[role="alert"]`
**zählt**, ist `tests/e2e/export-audit-and-locks.spec.ts:151`, und sie zählt innerhalb des Dialogs
„Verlauf dieser Buchung" — ein `InfoDialog` ohne `TextField`. Gelesen, nicht angefasst.

---

## 1 — O-CY-2: der Dialog hält seinen Auslöser fest

### Die Ursache, mit Beleg

T-161 hat richtig gesehen, dass die T-157-Behebung **zunächst greift** und danach überholt wird.
Wer sie überholt, war offen. Ich habe `HTMLElement.prototype.focus` im laufenden Browser
umgehängt und die Aufrufer mitgeschrieben; damit ist es keine Vermutung mehr:

Der Übeltäter ist `focusMenu` aus `@zag-js/menu`. Die Aktion steht an **jeder** Pfeiltaste
(`ARROW_DOWN`/`ARROW_UP`) und an **jeder** Zeigerbewegung über einem Eintrag
(`ITEM_POINTERMOVE`), und sie läuft in einem `requestAnimationFrame`:

```js
focusMenu({ scope }) {
  raf(() => {
    const contentEl = dom.getContentEl(scope);
    const initialFocusEl = getInitialFocus({
      root: contentEl,
      enabled: !contains(contentEl, scope.getActiveElement()),
      ...
```

`enabled` ist genau dann wahr, wenn der Fokus **außerhalb** des Menükastens steht. Solange niemand
den Fokus vorzeitig herauszieht, ist der vorgemerkte Rahmen folgenlos. Zieht ihn jemand heraus —
und das tut sowohl die T-157-Zeile als auch `focusTrigger` von Ark selbst —, holt der Rahmen ihn auf
den Menükasten zurück. Der Kasten verschwindet gleich darauf, der Fokus fällt auf `<body>`, und
**erst danach** stellt die Fokusfalle des Dialogs scharf und merkt sich `<body>` als Rückkehrziel.

Das erklärt auch, warum der Fehler mal auftrat und mal nicht. Mit 250 ms Vorlauf zwischen
Zeigerbewegung und Klick war der Rahmen längst abgearbeitet, und die T-157-Behebung hielt. Mit
Pfeiltaste und Eingabe im selben Bild — bei der Tastatur der Regelfall — hielt sie nicht. Beides
ist unten gemessen (A gegen A2 im Vorherzustand).

### Die Behebung, und warum dieser Weg

Der Auftrag stellte zwei Wege zur Wahl. Der zweite — „das Menü macht seinen Fokuswechsel gar nicht
mehr" — ist nicht ehrlich zu haben: `focusMenu` ist eine innere Aktion der Zustandsmaschine, es gibt
keine Eigenschaft, die sie abschaltet, und die einzige Stellschraube wäre, dem Menükasten die
Fokussierbarkeit zu nehmen — womit die ganze Tastaturbedienung des Menüs fiele.

Also der erste Weg, wörtlich: **Der Dialog hält den Auslöser fest, statt zu lesen, was gerade den
Fokus hat.** In `DialogSurface`:

```tsx
const openerRef = useRef<HTMLElement | null>(null);
useLayoutEffect(() => {
  if (!open) return;
  const active = document.activeElement;
  openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
}, [open]);
```

und an `Dialog.Root`:

```tsx
finalFocusEl={() => {
  const opener = openerRef.current;
  return opener !== null && opener.isConnected ? opener : null;
}}
```

Drei Punkte, die den Ausschlag geben:

1. **`useLayoutEffect`, nicht `useEffect`.** Der Layout-Effekt läuft synchron im Commit und damit
   vor jedem `requestAnimationFrame`. Genau in dieser Lücke greift der Menürahmen. Ein passiver
   Effekt liegt in einer eigenen Runde des Planers und könnte den Zugriff schon gesehen haben.
2. **`finalFocusEl` hat Vorrang.** `@zag-js/dialog`, `setReturnFocus`, liest es zuerst und fällt
   erst dann auf `nodeFocusedBeforeActivation` zurück. Wer den Fokus nach dem Öffnen noch
   verschiebt, verschiebt das Ziel nicht mit.
3. **Die T-157-Zeile bleibt** — nicht als Behebung, sondern als Übergabe. Sie sorgt dafür, dass im
   Augenblick des Öffnens tatsächlich der Auslöser den Fokus trägt und der Halter also den richtigen
   Knoten bekommt. Ihr Kommentar sagt jetzt ausdrücklich, dass sie allein nicht trägt, und warum.

Für einen Dialog an einem gewöhnlichen Knopf ändert sich nichts: Dort ist der gemerkte Knoten
derselbe, den die Fokusfalle ohnehin genommen hätte (Fall E, unverändert). Ist der Knoten beim
Schließen fort — die Zeile, deren Todo gerade gelöscht wurde —, gibt `finalFocusEl` `null` zurück,
und die Falle fällt auf ihren eigenen Stand zurück. `null` ist dabei sicher: Ark prüft den Wert mit
`if (finalFocusEl)` und wirft nicht.

### O-CY-3 — was dabei aufgefallen ist

Beim Messen habe ich den Nachbarfall mitgenommen, den T-161 ausdrücklich nicht geprüft hat: ein
Menüeintrag **ohne** Dialogfolge, dessen Zeile stehen bleibt („Status: In Progress"). Er ist
ebenfalls kaputt — der Fokus steht 100 ms später auf `<body>`.

**Es ist keine Folge von T-157.** Ich habe die T-157-Zeile für die Messung ausgebaut und denselben
Fall noch einmal gefahren: `t+0ms: BODY` bis `t+1000ms: BODY`, also derselbe Befund. Der Grund ist
derselbe Rahmen, nur ohne Dialog, der ihn danach auffängt.

Behoben in `Menu`, mit derselben Regel und derselben Bauart wie die Rückholung in `DialogSurface`:
Fällt der Fokus beim Schließen des Menüs ins Nichts (`focusout` mit `relatedTarget === null`), holt
der Auslöser ihn zurück — nur aus `null` oder `<body>`, nur bei `document.hasFocus()`, und nur, wenn
es den Auslöser noch gibt.

Zwei Einzelheiten daran sind gemessen und stehen deshalb im Quelltext:

- **`onBlur` trägt nicht.** Das `focusout`, auf das es ankommt, entsteht dadurch, dass React den
  Menükasten ausbaut; die synthetische Fassung kommt dann nicht mehr an. Gemessen: der Zuhörer am
  Dokument sieht `focusout .menu → null`, mit `onBlur` bleibt die Rückholung aus.
- **Ein Abräumer über den React-19-Rückgabewert des Ref-Rückrufs räumt zu früh ab.** React löst die
  Halter, bevor es den Knoten aus dem Baum nimmt. Mit Abräumer landet der Fokus wieder auf `<body>`
  — auch das gemessen. Ohne Abräumer bleibt nichts offen: Der Zuhörer hängt an einem Knoten, den
  React wegwirft.

Das `ContextMenu` bekommt die Rückholung **nicht**: Es hat keinen Auslöser.

### Messprotokoll

**Umgebung.** Lokaler Dienst aus dem Quelltext (`node apps/local-api/src/index.ts`, Startgeheimnis
über `stdin`, `XDG_DATA_HOME` auf ein Wegwerfverzeichnis), Oberfläche über `pnpm exec vite --host
127.0.0.1 --port 5173 --strictPort` mit `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN` — derselbe Weg wie
`tests/e2e/support/services.ts`. Chromium über das im Baum vorhandene `@playwright/test`, 1400x900.
Die Skripte lagen außerhalb des Bestands (`/tmp/t162-qa/`), es wurde keine Datei unter `tests/`
angelegt. Testdaten erfunden, Präfix „QA".

Gemessen wurde `document.activeElement` bei t+0, +100, +300, +600 und +1000 ms nach dem Escape —
nicht nur unmittelbar danach.

**Vorher (Stand vor T-162):**

```
A)  Bearbeiten, Maus ohne Vorlauf, nach Escape      BODY BODY BODY BODY BODY
A2) Bearbeiten, Maus mit 250 ms Vorlauf             BODY .menu__trigger (ab t+100)
B)  Löschen, Maus ohne Vorlauf                      BODY BODY BODY BODY BODY
C)  Bearbeiten, Tastatur ohne Pause                 BODY BODY BODY BODY BODY
C2) Löschen, Tastatur ohne Pause                    .menu__trigger durchgehend
F)  "Status: In Progress" (kein Dialog)             .menu__trigger, ab t+100 BODY
E)  Gegenprobe Dashboard "Neues Todo"               .btn--primary durchgehend
G)  Bearbeiten, Schluss über "Abbrechen"            BODY BODY BODY BODY BODY
```

**Nachher (Endstand, zwei vollständige Läufe, gleiches Ergebnis):**

```
A)  Bearbeiten, Maus ohne Vorlauf, nach Escape      .menu__trigger durchgehend
A2) Bearbeiten, Maus mit 250 ms Vorlauf             .menu__trigger durchgehend
B)  Löschen, Maus ohne Vorlauf                      .menu__trigger (ab t+100)
C)  Bearbeiten, Tastatur ohne Pause                 .menu__trigger durchgehend
C2) Löschen, Tastatur ohne Pause                    .menu__trigger durchgehend
F)  "Status: In Progress" (kein Dialog)             .menu__trigger durchgehend
E)  Gegenprobe Dashboard "Neues Todo"               .btn--primary (ab t+100)
G)  Bearbeiten, Schluss über "Abbrechen"            .menu__trigger durchgehend
H)  FormDialog, Absenden per Tastatur, "busy"       BODY, ab t+100 .field__input
```

Der Auslöser trägt in jedem der Fälle den vollen zugänglichen Namen
`Menü für „QA Fokus Todo T-162“` — es ist also nachweislich der Knopf der richtigen Zeile und nicht
irgendein Knopf. Wo t+0 noch `BODY` zeigt, ist das die Verzögerung, mit der die Fokusfalle den Fokus
zurückgibt (`delay()` in `@zag-js/focus-trap`); ab t+100 ms steht er, und er bleibt.

**Gegenprobe zu T-161 Punkt 1** (die Rückholung darf nicht kaputtgehen): Bearbeiten-Dialog, letzten
Tag-Chip mit der Tastatur entfernen.

```
vor dem Entfernen:                      BUTTON.chip__remove [Tag QA-Tag-Eins entfernen]
nach dem Entfernen des letzten Chips:   INPUT.field__input        (erstes Feld, wie zugesagt)
nach Escape:                            BUTTON.menu__trigger      (vorher: BODY)
```

**Ereignisspur** aus dem Vorherzustand, Tastaturweg, zur Einordnung der Ursache:

```
2363.5 focusin  DIV.menu                       Menue oeffnet
2371.9 focusout DIV.menu -> BUTTON.menu__trigger    T-157 greift
2403.8 focusout BUTTON.menu__trigger -> DIV.menu    vorgemerkter focusMenu holt zurueck
2406.0 focusout DIV.menu -> null                    Menuekasten verschwindet
2406.6 focusin  INPUT.field__input                  Dialog stellt erst jetzt scharf
2417.5 focusout INPUT.field__input -> null          Escape: niemand uebernimmt
```

---

## 2 — O-DA: die Meldefläche steht jetzt immer da

Übernommen aus `apps/outlook-addin/src/ui/Primitives.tsx` (T-158) und dort aus dem
Bestätigungsdialog (B-5 aus T-116, gebaut in T-118) — nicht neu erfunden. Die Fläche liegt
**dauerhaft** im Baum und wird nur befüllt:

```tsx
<div className="field__live" role="alert">
  {error === undefined ? null : <p className="field__error" id={errorId}>{error}</p>}
</div>
```

`aria-describedby`, `aria-invalid`, `field__input--invalid`, `field__hint` und `field__error` sind
zeichengleich geblieben. Das CSS ist dieselbe Zeile wie im Add-in, mit demselben Grund im Kommentar:
`.field__live:empty` nimmt den `gap` der Feldspalte zurück, damit die leere Fläche keinen Platz
belegt. Ausgeblendet werden darf sie nicht — `display: none` nähme sie aus dem Baum und damit die
ganze Wirkung.

**Gemessen im Browser**, Dialog „Neues Todo", Titel aus lauter Leerzeichen und dann „Anlegen"
(der Weg, auf dem eine Meldung im **stehenden** Dialog entsteht):

```
1) Dialog offen, keine Meldung
   Regionen: 3, Rolle je "alert", Inhalt leer, Hoehe 0 px
   Knoten:   a9ee43 / ivq0ci / jdqqni
   aria-invalid: null   aria-describedby: null

2) Meldung entstanden
   Regionen: 3, Knoten: a9ee43 / ivq0ci / jdqqni   (dieselben Knoten)
   Inhalt der ersten: "Ohne Titel laesst sich ein Todo nicht wiederfinden."   Hoehe 20 px
   aria-invalid: "true"   aria-describedby: "_r_5_-error"   Klasse: field__input--invalid

3) Meldung zurueckgenommen
   Regionen: 3, Knoten: a9ee43 / ivq0ci / jdqqni   Inhalt leer, Hoehe 0 px
   Dialoghoehe ohne Meldung vorher 668 px, nachher 668 px
```

Die gleiche Knotenkennung über alle drei Zustände ist der eigentliche Nachweis: Die Region ist
**dieselbe**, sie entsteht nicht mit ihrem Inhalt — genau die Eigenschaft, an der die Ansage hängt.

Kein neuer Oberflächentext (E-078): Die Fläche ist leer, solange nichts zu melden ist, und der
Meldungstext ist der bestehende.

---

## 3 — O-DG: der Tag der Zeiterfassung wechselt um Mitternacht mit

`TimeScreen.tsx` benutzte `useMemo(() => todayCalendarDay(), [])`. Der Wert geht in genau eine Frage
an den Dienst: `listTimeEntries({ fromDay: today, toDay: today })`, und daraus wiederum in die
Kachel „Erfasst" und in die Liste „Buchungen von heute". Ein über Nacht offenes Takt zeigte am
Morgen unter „Heute" die Buchungen von gestern.

Jetzt `useToday()` — dieselbe Bauart wie in `DashboardScreen` und `TodoListScreen` nach T-157, mit
demselben Kommentarmuster. Der Import von `todayCalendarDay` und der von `useMemo` sind entfallen;
`todayCalendarDay` hat weiterhin andere Aufrufer und bleibt in `lib/format.ts` stehen.

Die von T-157 geäußerte Sorge, hier hänge ein Filtervorschlag daran, der unter dem Blick des
Benutzers wegrutschen könnte, ist gegenstandslos: In dieser Ansicht gibt es keinen Zeitraumfilter.
Die Auswahl „letzte 7 Tage" (`shiftCalendarDay`) sitzt in S-06, nicht hier.

---

## 4 — O-DK: der Wächter nennt jetzt den Anlaß, der ihn trägt

Der alte Kopftext nannte als Anlaßfall „Als Spalte aufnehmen" aus T-072. Nachgeprüft, nicht
vermutet: `BoardScreen.tsx` schließt seit T-102 bei `onAdopt` **und** `onRemove` den Dialog **vor**
der Wirkung, ausdrücklich damit „Rückgängig" im Toast für Tastatur und Vorlesehilfe erreichbar
bleibt; der Kommentar dort sagt es selbst. T-161 hat es im Browser bestätigt. Der Fall ist fort.

Der Kopf nennt jetzt die zwei Anlässe, die heute tragen, und trennt sie sauber:

- **`MutationObserver`** — `PoolFormDialog`, letzter Tag-Chip. Der Knopf verschwindet als
  **Nachfahre**, deshalb greift die Rückholung der Fokusfalle nicht. Gemessen von T-161 (Punkt 1)
  und in dieser Aufgabe an derselben Mechanik im Bearbeiten-Dialog gegengemessen.
- **`focusout` an der Abdunklung** — der Knopf sperrt sich durch seine **eigene Wirkung**.
  `FormDialog` setzt `loading={busy}` an „Anlegen"/„Speichern", und `Button` macht daraus
  `disabled` (`Primitives.tsx:51`). Wer mit der Tastatur abschickt, steht genau auf diesem Knopf.
  Entfernt wird dabei **nichts**, der Beobachter sieht also nichts.

Der zweite Anlaß ist in dieser Aufgabe erstmals gemessen (Fall H): Vor dem Absenden steht der Fokus
auf `.btn--primary`, unmittelbar danach auf `BODY`, und 100 ms später auf `.field__input` — das
erste Feld des Dialogs, also genau das Ziel, das die Rückholung wählt. Ohne sie bliebe er auf
`<body>`.

---

## Annahmen

1. **Die T-157-Zeile bleibt stehen, obwohl sie nicht die Behebung ist.** Sie ist der Weg, auf dem
   der richtige Knoten in den Halter kommt. Ohne sie stünde beim Öffnen der Menükasten im Halter —
   ein Knoten, der gleich darauf verschwindet.
2. **O-CY-3 habe ich behoben und nicht nur gemeldet.** Er stand nicht im Auftrag. Er ist dieselbe
   Klasse, dieselbe Datei, dieselbe Regel, und die Behebung ist gemessen; ihn liegen zu lassen
   hieße, dieselbe Fläche in der nächsten Welle noch einmal aufzumachen. Ich nenne ihn ausdrücklich,
   damit die Freigabe ihn sieht.
3. **Der Zuhörer am Menükasten wird nicht abgeräumt.** Begründet und gemessen (Abschnitt 1). Die
   Alternative wäre ein Zuhörer am Dokument samt eigenem Offen-Zustand im Baustein — mehr Maschine
   für dieselbe Wirkung.
4. **`finalFocusEl` wird immer gereicht, nicht nur im Menüfall.** Eine Fallunterscheidung wäre eine
   zweite Regel; für den gewöhnlichen Knopf ist der gemerkte Knoten ohnehin derselbe.
5. **Beim Schließen wird der Halter nicht geleert.** `finalFocusEl` wird erst beim Abschalten der
   Fokusfalle gelesen, und die läuft nach den Effekten dieses Bausteins. Ein Leeren beim Schließen
   wäre ein Rennen, das ich nicht gewinnen muss.
6. **Kein neuer Oberflächentext** (E-078). In dieser Aufgabe fiel keiner an, und ich habe keinen
   bestehenden gestrichen — die Bestandsaufnahme läuft als T-163.

---

## Risiken

1. **`pnpm test:e2e` habe ich nicht gefahren.** Der lokale Dienst hört auf einem fest verdrahteten
   Port (17843), e2e-tester läuft in dieser Welle parallel, und zwei Läufe darauf sind ein
   Fehlstart, kein Testfall. Der Nachweislauf des Auftrags verlangt ihn nicht; meine eigenen
   Browsermessungen liefen mit demselben Aufbau, aber gezielt und kurz. **Vor der Freigabe sollte
   der volle e2e-Lauf einmal grün gewesen sein**, wegen der 222 `getByRole`-Zugriffe.
2. **Die Rückholung im `Menu` kann in einem sehr engen Fenster mit einem gerade öffnenden Dialog
   zusammentreffen.** Sie greift nur, wenn der Fokus auf `null` oder `<body>` steht — also
   ausschließlich, solange der Dialog seinen Fokus noch nicht gesetzt hat. Setzt er ihn danach,
   gewinnt er; gemessen in allen sieben Fällen. Sie kann den Fokus **nicht** aus einem stehenden
   Dialog herausziehen.
3. **Ein Zuhörer je geöffnetem Menü, ohne Abräumer.** Er hängt am Menükasten und geht mit ihm; kein
   Zeitgeber im Leerlauf, kein Verweis, der den Knoten am Leben hält. Der Zeitgeber der Rückholung
   wird beim Ausbau des Bausteins gelöscht.
4. **`role="alert"` liegt jetzt in jedem `TextField`, auch leer.** Eine leere Live-Region sagt
   nichts an; das ist gerade ihr Zweck. Sie taucht aber in einer Abfrage nach `[role="alert"]` auf.
   Die einzige zählende Prüfreihe ist gegen einen Dialog ohne `TextField` gerichtet (oben belegt).
5. **Die Zeiterfassung stellt jetzt um Mitternacht eine neue Abfrage.** Gewollt, aber ein Lauf, den
   es vorher nicht gab — derselbe Satz wie in T-157 für Dashboard und Todo-Liste.
6. Keine neue Netzadresse, keine Änderung an CSP, Exportformat oder Fachlogik. Nichts gerechnet,
   nichts gerundet, nichts kodiert.

---

## Offene Fragen

1. **An den Orchestrator:** O-CY-3 als eigener Befund ins Board, oder mit O-CY-2 zusammen abnehmen?
   Er ist behoben und gemessen, stand aber nicht im Auftrag.
2. **An spec-ux-reviewer (Nebenfund, nicht behoben):** In `Attachments.tsx` wird `touched` nur vom
   Dateiwähler gesetzt (`setTouched(true)` im Zweig `chosen`). Für die Art **Verweis** gibt es
   keinen Wähler — `valueError` („Ohne Adresse lässt sich der Anhang nicht öffnen.") ist dort also
   unerreichbar, obwohl das Feld `required` trägt und die Meldung dafür gebaut ist. Gemessen: Feld
   befüllen und wieder leeren erzeugt keine Meldung. Ich habe es **nicht** angefasst, weil es eine
   Zustandsfrage der Fläche B ist und keine des Bausteins.
3. **An unit-tester:** Für O-CY-2 gibt es keine Einheitenprüfung, die trägt — die Ursache liegt in
   der Taktung zweier Bibliotheken und ist nur im echten Browser sichtbar. Der richtige Ort ist eine
   e2e-Reihe: Zeilenmenü → „Bearbeiten" → Escape → `document.activeElement` ist der Auslöser,
   dieselbe Reihe für „Löschen" und für einen Eintrag ohne Dialog. Vorschlag an e2e-tester, nicht an
   die Einheitenprüfung.

---

## Nächster Schritt

**visual-qa** mit drei benannten Messpunkten statt einer Durchsicht:

1. Todo-Liste, Zeilenmenü „Bearbeiten" und „Löschen", je einmal mit der Maus und einmal mit
   Pfeiltaste und Eingabe **ohne Pause dazwischen** (das ist der Fall, der vorher fiel) → nach
   Escape muss `document.activeElement` der Menü-Auslöser sein, auch 300 ms später.
2. Derselbe Weg mit einem Eintrag **ohne** Dialog („Status: …") → der Auslöser muss den Fokus
   behalten (O-CY-3).
3. „Neues Todo", Titel aus lauter Leerzeichen, „Anlegen" → die Meldung erscheint, das Feld bekommt
   `aria-invalid`, und die Fläche darüber war schon vorher im Baum (O-DA). Wenn eine Vorlesehilfe
   zur Hand ist: Wird die Meldung **angesagt**, nicht nur beschrieben?

Parallel **e2e-tester**: den vollen Lauf einmal grün sehen (Risiko 1) und die Reihe aus offener
Frage 3 aufnehmen.
