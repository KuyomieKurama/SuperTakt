# T-170 — Die Reihe, die den Fokusfall selbst misst (O-DY)

**Rolle:** e2e-tester **Datum:** 2026-09-05
**Gegenstand:** O-DY (Auflage aus T-162: eigene Prüfreihe für O-CY-2/O-CY-3, vollständiger
`test:e2e`-Lauf über die Fokusarbeit), Nebenbefund zur Live-Region eines `TextField` (O-DA-Lücke).

---

## Status: fertig

---

## Artefakte

Neu:
- `tests/e2e/focus-return-after-dialog.spec.ts` — TP-FOCUS-01 bis -06.
- `tests/e2e/field-live-region-announcement.spec.ts` — die Messlücke aus O-DY (role="alert" in
  einem `TextField`, bislang ungemessen).

Geändert:
- `docs/testplan.md` — neuer Abschnitt 26 mit beiden Reihen, Ergebnissen und dem Nebenbefund zur
  nativen Formularprüfung.

Nicht angefasst: alles unter `apps/**`, `packages/**` — reine Prüfarbeit.

---

## Zusammenfassung

Beide neuen Reihen sind im echten Chromium gelaufen, nicht nur geschrieben: 7 neue Fälle, alle
grün, im vollen `pnpm run test:e2e` **99/99** (93 Hauptreihe, 5 Versionsprüfung, 1 Neustart). Die
Fokusreihe deckt sechs der acht im Auftrag genannten Fälle direkt ab (Maus, Tastatur ohne Pause,
Rückfragedialog, „Abbrechen“, Eintrag ohne Dialog, Gegenprobe); zwei Fälle — „Löschen“ und der
Statuswechsel über die Tastatur — sind bewusst nicht gebaut und im Testplan als Grenze benannt,
nicht stillschweigend ausgelassen. Beim Bau der Reihe kamen zwei eigene Fehlversuche zutage, die
ich vor dem grünen Endstand korrigiert habe: eine falsche Fokusprobe an einem zusammengesetzten
Menü-Widget (virtueller statt echter DOM-Fokus) und ein Testaufbau, der Chromiums eigene
Formularprüfung nicht berücksichtigt hatte. Der zweite Fehlversuch deckte einen echten, vom
Auftrag benannten Befund auf: `role="alert"` in einem `TextField` war bislang tatsächlich
ungemessen, und der naheliegendste Weg dorthin (ein wirklich leeres Pflichtfeld) erreicht die
deutsche Fehlermeldung der Anwendung gar nicht — das ist jetzt als eigener Befund im Testplan und
hier im Bericht festgehalten.

---

## Messprotokoll

### 1. Die Fokusreihe (TP-FOCUS-01 bis -06)

Gebaut in `tests/e2e/focus-return-after-dialog.spec.ts`. Gemessen wird `document.activeElement`
bei t+0/100/300/600 ms nach dem Schließen (dieselben Meßpunkte wie in der T-162-Messung, vier statt
fünf, siehe Dateikopf) — sowohl über `expect(trigger).toBeFocused()` als auch über eine eigene
`focusedAccessibleName()`-Hilfsfunktion, die `aria-label` zuerst und sonst den sichtbaren Text
liest und `<body>` als eigene, benannte Zeichenkette zurückgibt (nicht `null` oder leer) — genau
der Fall, auf den T-161 gefallen war.

Abgedeckt:

| ID | Fall |
|---|---|
| TP-FOCUS-01 | Zeilenmenü mit der Maus → „Bearbeiten“ → Escape |
| TP-FOCUS-02 | Auslöser fokussieren, Eingabe öffnet das Menü, **Pfeil ab unmittelbar gefolgt von Eingabe ohne Pause** → „Bearbeiten“ → Escape |
| TP-FOCUS-03 | Zeilenmenü mit der Maus → „Löschen“ (Rückfragedialog, `role="alertdialog"`) → Escape |
| TP-FOCUS-04 | Zeilenmenü mit der Maus → „Bearbeiten“ → Abschluss über „Abbrechen“ statt Escape |
| TP-FOCUS-05 | Zeilenmenü mit der Maus → Statuswechsel (Eintrag **ohne** Dialog, O-CY-3) |
| TP-FOCUS-06 | Gegenprobe: Dashboard „Neues Todo“, kein Menü davor |

Alle sechs bestanden, isoliert (`playwright test … focus-return-after-dialog.spec.ts`, 8 Läufe
inklusive einer Wiederholung, 6 passed / 2.3–2.4s) und im vollen `pnpm run test:e2e`.

**Nicht gebaut, benannt statt weggelassen:** „Löschen“ und der Statuswechsel über die Tastatur.
Beide ließen sich nur mit einer festen Anzahl `ArrowDown`-Tastendrücke erreichen, weil zwischen
„Bearbeiten“ und diesen Einträgen im Zeilenmenü eine wechselnde Zahl von Status-Einträgen liegt —
und diese Zahl hängt von Status ab, die andere Spezifikationsdateien im **selben** `test:e2e`-Lauf
in derselben SQLite-Datei bereits angelegt haben (`support/services.ts`, ein Lauf, eine Datenbank).
Ein fester Zähler wäre also entweder falsch oder ein Zufallstreffer der Ausführungsreihenfolge
gewesen. Der Tastaturweg selbst ist mit TP-FOCUS-02 bereits gemessen — die Ursache sitzt in
`@zag-js/menu` (`focusMenu`, `requestAnimationFrame`) und kennt keinen Unterschied zwischen
Eintragstypen; TP-FOCUS-05 deckt getrennt davon ab, dass ein Eintrag **ohne** Dialog denselben
Rückweg braucht.

**Ein eigener Fehlversuch, korrigiert vor dem ersten grünen Lauf.** Der erste Entwurf von
TP-FOCUS-02 prüfte nach dem Öffnen `await expect(page.getByRole('menuitem', { name: 'Öffnen'
})).toBeFocused()`. Das ist strukturell falsch, unabhängig vom geprüften Fehler: Das Menü ist ein
zusammengesetztes Widget mit virtueller Fokusverwaltung — der echte DOM-Fokus bleibt am Menükasten
(`role="menu"`, `tabIndex: 0`), die Markierung eines Eintrags läuft über
`aria-activedescendant`/`data-highlighted` (`@zag-js/menu`, `menu.connect.mjs`, `getItemProps`,
`menu.machine.mjs`: `closed --ARROW_DOWN--> open` mit `highlightFirstItem`, `Enter` wird auf
dasselbe Ereignis abgebildet). Am Quelltext von `@zag-js/menu` nachgesehen und vor dem ersten Lauf
korrigiert (`expect(page.getByRole('menu')).toBeFocused()` + `toHaveAttribute('data-highlighted',
'')` am markierten Eintrag) — der Fall lief damit auf Anhieb grün.

### 2. Die Messlücke: `role="alert"` in einem `TextField` (O-DA)

Gebaut in `tests/e2e/field-live-region-announcement.spec.ts`. Geprüft wird die DOM-Bauart, nicht
die Ansage selbst (die bräuchte einen echten Screenreader, siehe O-EA bei visual-qa): Die Fläche
mit `role="alert"` existiert im offen bleibenden „Neues Todo“-Dialog bereits **vor** dem Fehler,
leer; nach dem Auslösen der Formularprüfung trägt **derselbe**, über ein `data-e2e-marker`-Attribut
markierte Knoten den Fehlertext.

**Zweiter eigener Fehlversuch, und der Befund, den er freigelegt hat.** Der erste Entwurf ließ das
Titelfeld leer und klickte „Anlegen“ — das lief 2× in eine Zeitüberschreitung, weil `TodoFormDialog
.tsx` nie erreicht wird: Das Titelfeld trägt natives `required`, kein `<form>` der Anwendung setzt
`noValidate` (geprüft: `grep -rn "noValidate" apps/web/src apps/outlook-addin/src` → 0 Treffer), und
Chromiums eigene Formularprüfung fängt den Klick vorher ab — eine unlokalisierte, englische
Sprechblase („Please fill out this field.“, Screenshot im Fehlschlag gesichert) statt der deutschen
`role="alert"`-Meldung. React bekommt das `submit`-Ereignis in diesem Fall gar nicht gemeldet.

Behoben, indem der Testfall einen Titel aus lauter Leerzeichen einträgt statt das Feld leer zu
lassen — Chromiums native Prüfung sieht einen nicht leeren Wert, lässt das Absenden zu, und erst
danach entscheidet `trimmedTitle.length === 0`. Genau dieser Weg steht auch im Auftrag zu O-EA
(`.claude/team/board.md`, T-172: „Titel aus lauter Leerzeichen“) — kein Zufall, sondern derselbe
Fund von zwei Seiten.

**Befund, gemeldet statt behoben (außerhalb der eigenen Hoheit — `apps/web/**` gehört
frontend-dev):** Ein **wirklich leeres** Pflichtfeld erreicht die deutsche Fehlermeldung dieses
Formulars nie, nur Chromiums eigene englische Sprechblase. Dieselbe Bauart dürfte an jedem
`required`-Feld der Anwendung gelten, nicht nur am Titel — kein `<form>` im Bestand setzt
`noValidate`. Das ist kein Zeichenfehler wie O-DA, sondern eine strukturelle Frage (welche der
beiden Prüfungen — die native oder die eigene deutsche — den ersten Zugriff bekommen soll), deshalb
an spec-ux-reviewer/frontend-dev und nicht an mich zur Entscheidung.

Ergebnis: 1/1, isoliert und im vollen Lauf.

### 3. Der volle Lauf

```
playwright test -c tests/e2e/playwright.config.ts                        93 passed (2.2m)
playwright test -c tests/e2e/playwright.version-check.config.ts           5 passed (48.1s)
playwright test -c tests/e2e/playwright.attachment-persistence.config.ts  1 passed (2.5s)
──────────────────────────────────────────────────────────────────────────────────────────
Gesamt: 99 Fälle, 99 bestanden, 0 fehlgeschlagen. Exitcode 0.
```

93 = 86 (Stand nach T-166/T-162) + 7 neue Fälle. Kein bestehender Fall ist rot geworden — die von
T-162 benannten Risiken haben sich nicht materialisiert:

- **286 `getByRole`-Zugriffe an Rolle und Namen:** kein einziger ist am geänderten Fokusverhalten
  zerbrochen. Die einzigen zwei fehlerhaften `getByRole`-Erwartungen, die im Lauf dieser Aufgabe
  auftraten, standen in meinen **eigenen, neuen** Fällen (siehe oben) und wurden vor dem ersten
  grünen Lauf korrigiert — kein bestehender Fall war betroffen.
- **`role="alert"` leer in jedem `TextField`:** die einzige zählende Stelle blieb
  `export-audit-and-locks.spec.ts:151` (ein `InfoDialog` ohne `TextField`, unverändert `1 failed →
  0 failed`, weiterhin grün) — die eigentliche Live-Region eines `TextField` war ungemessen. Jetzt
  gemessen, siehe Abschnitt 2 oben, mit einem eigenständigen Befund dazu.

`pnpm run proof:codepoints` (45/45) und `pnpm run typecheck:e2e` (0 Fehler) sind nach jeder Änderung
an `docs/testplan.md` bzw. den beiden neuen Spezifikationsdateien erneut gelaufen und grün.

### 4. Die Naht `version-check-entry.ts`/`services.ts` (O-EB)

Nicht angefasst. Beide Dateien tragen weiterhin die zwei Rollen aus T-166 (eigene
Versionsprüfungsreihe **und** Hauptreihe); der volle Lauf oben misst beide gleichzeitig, ohne dass
ich an der Naht selbst etwas geändert hätte. `ensureGithubStub()`/`stopGithubStub()` unverändert.
O-EB bleibt eine Auflage an code-reviewer, nicht an mich.

### 5. Verzögerung durch einen gemeinsamen Prozess

Ein erheblicher Teil der Bearbeitungszeit ging in Wartezeit: `apps/local-api/src/index.ts` und der
Vite-Entwicklungsserver liefen von **18:46** bis **19:07** auf den festen Ports 17843/5173, gestartet
von der parallel laufenden visual-qa-Aufgabe T-172 (`/tmp/t172-qa/start-api.mjs`, gemessen über
`ps`/`ss`) — derselbe feste Port, den `test:e2e` selbst braucht (kein Argument steuert ihn, B-1.6).
Kein Eingriff meinerseits (kein `kill`, keine Portänderung) — nur Warten, bis der Port wieder frei
war, dann sofortiger Lauf. Für künftige Wellen: Zwei gleichzeitig laufende Agenten, die beide einen
echten Dienst auf demselben festen Port brauchen (einer über `test:e2e`, einer über eine manuelle
`pnpm dev`-Sitzung für Bildschirmfotos), schließen sich zeitlich aus — das ist keine neue Information
für den Orchestrator, aber diese Welle hat es konkret gekostet.

---

## Annahmen

- „Löschen“ und der Statuswechsel über die Tastatur bleiben ungebaut, mit Begründung im Dateikopf
  und im Testplan (Abschnitt „Nicht abgedeckt“) — der Auftrag verlangt ausdrücklich, einen nicht
  meßbaren Fall zu benennen statt ihn wegzulassen; ein Fall mit geratener `ArrowDown`-Anzahl wäre
  das Gegenteil von Meßbarkeit.
- Der Nebenfund zur nativen Formularprüfung ist ein **Befund**, keine Änderung: `apps/web/**` liegt
  bei frontend-dev, und ob die Antwort ein `noValidate` mit eigener, deutscher Prüfung ist oder ob
  die native Sprechblase so bleiben soll, ist eine spec-ux-Frage (E-078 gilt: kein neuer
  Oberflächentext von mir).
- Vier statt fünf Meßpunkte (t+0/100/300/600, nicht zusätzlich t+1000) — nach den in T-162
  gemessenen Werten zeigt sich ein Unterschied, wenn überhaupt, innerhalb der ersten zwei
  Browser-Frames; ein fünfter Punkt hätte in keinem der 8 Läufe zusätzliche Information geliefert.

## Risiken

- Keine neuen Sicherheitsbefunde.
- Die Fokusreihe hängt strukturell an der Bauart von `@zag-js/menu`/`@zag-js/dialog`
  (`aria-activedescendant`, `finalFocusEl`, `focusMenu`). Ein künftiger Versionssprung dieser
  Bibliotheken sollte wieder gegen diese Reihe laufen, nicht nur gegen die bestehenden 286
  `getByRole`-Zugriffe — genau der Fall, den O-DY verhindern sollte.
- Der Befund zur nativen Formularprüfung (Abschnitt 2) gilt vermutlich für **jedes** `required`-Feld
  der Anwendung, nicht nur den Titel — ungeprüft, ob das für andere Felder (Call-Nummer ist nicht
  `required`, aber z. B. Namensfelder in `PoolFormDialog`/`StatusSettings`/`TagsScreen`) dieselbe
  Wirkung hat. Nicht nachgemessen, weil außerhalb des Auftrags dieser Welle.

## Offene Fragen

An spec-ux-reviewer/frontend-dev (nicht blockierend für diese Aufgabe): Soll ein `<form
noValidate>` die eigene, deutsche Feldprüfung vor Chromiums native Sprechblase stellen? Betrifft
vermutlich mehr als das Titelfeld.

## Nächster Schritt

Freigabe der Welle. Der von T-162 offen gelassene Nachweis (`pnpm test:e2e`, vollständig, mit der
neuen Fokusreihe) liegt jetzt vor: 99/99. `docs/testplan.md` Abschnitt 26 ist nachgezogen.
