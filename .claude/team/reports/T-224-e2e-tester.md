# T-224 — e2e-tester: ein Prüffall mit zwei Messungen (O-JP), ein Zitat vor der Titeländerung bewahrt (O-IW)

**Rolle:** e2e-tester **Zweig:** `versionspruefung-gegen-github`
**Dateihoheit:** `tests/e2e/**`, `tests/fixtures/**`, `docs/testplan.md`

Über den Wortlaut gesucht, nach E-087 in der berichtigten Fassung über **beides**: `git grep`
(versionierte Dateien) und den echten Arbeitsbaum (`grep -rn`), nicht nur eines von beiden.

---

## 1. O-JP — `tests/e2e/focus-return-after-dialog.spec.ts`, neuer Fall TP-FOCUS-07

**Der Fall.** Neben O-DY (Menüfokus, sechs vorhandene Fälle) jetzt ein zweiter Wettlauf derselben
Klasse (T-218, ui-designer, `docs/design/traeger-und-zusage.md` Abschnitt 11): Im Export, in einer
aufgeklappten Tagesgruppe, wechselt der Knopf hinter einer Buchung ohne Leistung
(`ExportGroups.tsx:303-319`) zwischen einem `Button` ("Leistung nachtragen") und einem `IconButton`
("Leistung der Buchung … bearbeiten"), gesteuert von `entry.note` — demselben Wert, den der Dialog
dieses Knopfes ändert. `BookingDialogs.tsx` schließt den Dialog, **bevor** die durch `bump()`
ausgelöste Auffrischung zurück sein kann: Der Fokus kommt beim Schließen korrekt an und wird erst
von der **eintreffenden** Antwort weggenommen.

**Zwei Messungen — und ein Meßproblem, live gefunden.** Ein erster Versuch, beide Messungen direkt
nach `await expect(dialog).toBeHidden()` zu setzen, zeigte auf dieser Maschine **bei beiden**
Messungen bereits den ausgehängten Knoten (`element(s) not found` schon bei Messung 1) — die
Anfrage aus `bump()` läuft gegen den lokalen Dienst so schnell, dass sie regelmäßig vor der ersten
Messung zurück ist; Playwright sitzt als externer Prozeß über CDP mit eigener Rundlaufzeit davor.
Ein fester Zeitwert hätte dieses Wettrennen nicht entschieden, nur seine Wahrscheinlichkeit
verschoben (dieselbe Lehre wie T-187 — „ein Fall, der auch vorher grün gewesen wäre, mißt nichts" —
und T-205 — ein Klick statt der echten Tabulatortaste hätte denselben Fall unabhängig von der
Behebung immer bestehen lassen).

**Woran das Eintreffen der Auffrischung festgemacht wird.** Nicht an einer Wartezeit, sondern an
zwei realen, im Test kontrollierten Signalen:

1. Ein `page.route`-Zügel auf genau der einen GET-Anfrage, die `bump()` erneut auslöst
   (`ExportScreen.tsx:278-289`, Filter `method === 'GET' && pathname.endsWith('/time-entries') &&
   exportStatus === 'open'` — nicht die `PATCH` der Änderung, nicht die ursprüngliche Ladeanfrage).
   Die Anfrage wartet auf ein selbst gesetztes `refreshGate`, bis Messung 1 steht; erst danach wird
   sie freigegeben. Damit ist „t+0" ein vom Test gewählter Augenblick an einer echten Anfrage, kein
   Zufallstreffer der Maschine.
2. Nach der Freigabe: das **sichtbare** Ergebnis der Auffrischung, `expect(row.locator(
   '.eentry__note')).toContainText(newNote)` — Playwrights selbst nachziehende Zusicherung statt
   einer eigenen Wartezeit.

**Was gemessen wird, und warum nicht der künftige Wortlaut.** Die Behebung aus T-218 Abschnitt 11.4
(ein Baustein, zwei Beschriftungen, mit verborgenem Zeilenbezug) ist eine **separate**, noch nicht
gebaute Änderung mit einer offenen Wortlautfrage an ux-designer (F-10). Eine Prüfung auf den
künftigen Wortlaut hätte diesen Fall an eine fremde Entscheidung gekoppelt und wäre außerdem heute
schon am ersten Schritt gescheitert (der heutige Knopf trägt den Zeilenbezug noch nicht). Gemessen
wird deshalb die Eigenschaft, um die es beim Fehler tatsächlich geht: **Ist es nach der Auffrischung
noch derselbe Knoten**, auf den der Fokus unmittelbar nach dem Schließen gefallen ist? Referenz über
`page.evaluateHandle(() => document.activeElement)`, verglichen gegen `document.activeElement` zum
späteren Zeitpunkt. Ergänzend dieselbe Namensprobe wie bei O-DY: nach der Auffrischung nie `<body>`.

**Ist der Fall heute rot? Ja, geprüft.**

```
Messung 1 (t+0):            besteht — trigger fokussiert, Name ≠ "<body>"
Messung 2 (nach Auffrischung): sameNodeAfterRefresh = false
                                zugänglicher Name = "<body>"  (per Zusatzmessung bestätigt, siehe unten)
```

Zusatzmessung (`console.log`, danach wieder entfernt, kein Artefakt im Diff) bestätigt exakt
ui-designers Vorhersage aus 11.1: Der Knoten von Messung 1 existiert nach der Auffrischung nicht
mehr im Dokument, der Browser hat den Fokus auf `<body>` fallen lassen. Der Fall mißt damit
nachweislich den heutigen Fehler und nicht etwas anderes — würde er grün laufen, hätte ich das hier
vermerkt.

**Artefakt:** `tests/e2e/focus-return-after-dialog.spec.ts` — neuer `describe`-Block mit
ausführlichem Kopfkommentar (Ablauf, Meßproblem, Begründung der Knotengleichheit statt Namensprobe,
Rot-Nachweis) und `TP-FOCUS-07`.

---

## 2. O-IW — Zitat vor der Titeländerung bewahrt (`timer-stop-announcement.spec.ts`)

**Befund.** Der Kopfkommentar vor der letzten `describe`-Gruppe begründete die Wahl der dritten
Meßstelle mit einem im Wortlaut zitierten Dialogtitel: „neben der Titelmeldung des „Neues Todo“-
Dialogs …". Diese Datei prüft diesen Titel an keiner Stelle selbst — die Bindung liegt allein in
`field-live-region-announcement.spec.ts`. Eine künftige Umbenennung dieses Dialogs (oder des
Zurücksetzen-Dialogs, ebenfalls im selben Satz zitiert) hätte den Kommentar **still falsch**
gemacht, nicht rot: dieselbe Klasse Befund, die in dieser Sitzung mehrfach aufgefallen ist — ein
Kommentar, der etwas anderes begründet (hier: eine Auswahl unter drei Meßstellen), als unmittelbar
danebensteht (ein Wortlaut, den kein Prüffall dieser Datei hält).

**Berichtigt, nicht „gebunden".** Ein echtes Anbinden hätte bedeutet, in dieser (Timer-Stopp-)Datei
zusätzlich den „Neues Todo"-Dialog zu öffnen, nur um den Titel zu prüfen — sachfremd für eine Datei,
die vom Timer-Stopp handelt, und eine Dopplung der Prüfung, die in
`field-live-region-announcement.spec.ts` bereits liegt. Stattdessen zitiert der Kommentar jetzt die
**Befundkennungen** (O-DA, O-GZ) und die jeweilige Datei statt des Wortlauts — beide Kennungen
bleiben unabhängig von einer künftigen Titeländerung gültig, und wer nachsehen will, findet über die
Kennung den tatsächlich bindenden Prüffall.

**Nachbarfund, nicht behoben (außerhalb des Auftrags für Punkt 2):** `export-audit-and-locks.spec.
ts:318` trägt denselben unangebundenen Wortlaut-Verweis auf denselben Dialog („derselben Bauart,
neben der Titelmeldung des „Neues Todo“-Dialogs.") — dieselbe Klasse, andere Datei. Nicht Teil
dieses Auftrags (der nannte ausdrücklich `timer-stop-announcement.spec.ts`); zur Kenntnis für die
nächste Gelegenheit, in der diese Datei ohnehin angefaßt wird.

**Ausgang unverändert.** Reiner Kommentartext, kein Prüffall und kein Ergebnis geändert:
`timer-stop-announcement.spec.ts` bleibt 6/6.

---

## 3. R-6 (T-218) — geprüft, kein Code gebaut

ui-designer hat für die Fehlerklasse „zwei verschiedene Bausteine an einer Stelle, deren Bedingung
sich zur Laufzeit ändert, wobei einer der beiden einen Dialog/ein Menü öffnet" (Regel R-6) den
Bestand bereits durchsucht: **eine** lebende Stelle (der O-JP-Fall oben) und zwei geprüfte,
unbedenkliche Nachbarn (`Timer.tsx:123`, `BookingsScreen.tsx:396`, beide gelesen und bestätigt).

Ich habe geprüft, ob sich daraus ein Prüffall bauen läßt, der die **Klasse** hält statt der einen
Stelle — dieselbe Frage, die bei den Live-Regionen zu `proof:surface` geführt hat. Ergebnis: **nicht
sinnvoll innerhalb meiner Dateihoheit, und mit einer echten Grenze, keiner Ausrede.** R-6 verlangt
drei zusammenwirkende Merkmale; zwei davon (eine zur Laufzeit veränderliche Bedingung; einer der
Zweige öffnet etwas) lassen sich ohne echte Programmablauf-Analyse nicht zuverlässig aus reinem
Quelltext lesen — ein regelbasierter Wächter würde entweder `Timer.tsx:123` fälschlich meldet oder
echte Treffer übersehen, wenn er nur auf „zwei verschiedene JSX-Bausteinnamen in einem Ternär"
prüft. Ein solcher Wächter gehört zudem strukturell neben die übrigen `proof:*`-Läufe unter
`apps/web/scripts/**` (frontend-devs Dateihoheit), nicht unter `tests/e2e/**`.

**Vorschlag im Testplan festgehalten** (Abschnitt 30): ein `proof:dual-widget-swap`-artiger Lauf, der
jeden JSX-Ternär mit zwei verschiedenen Bausteinnamen an derselben Stelle auflistet und mit einer
begründeten, benannten Ausnahmeliste abgleicht — mechanisch wie die Trägerregel T-1 in
`traeger-und-zusage.md` Abschnitt 0, nur für Bausteine statt Farben. Kein Code dafür gebaut, weil
außerhalb meiner Dateihoheit; die Beurteilung selbst steht jetzt in `docs/testplan.md`.

---

## 4. Nachweis: `pnpm test:e2e` vollständig, mit Zahlen

```
$ playwright test -c tests/e2e/playwright.config.ts
  101 Fälle, 100 grün, 1 rot
  rot: focus-return-after-dialog.spec.ts:400 TP-FOCUS-07 (O-JP) — Messung 2
       "derselbe Knoten hält den Fokus auch nach der Auffrischung": Expected true, Received false
       — GEWOLLT rot: das Produkt ist an dieser Stelle noch nicht umgebaut (T-218 Abschnitt 11.2/
       11.8, spätere Welle). Kein Fremdbefund — eigener, neuer Fall dieser Aufgabe.

$ playwright run test:e2e:version-check (playwright.version-check.config.ts)
  5 Fälle, 5 grün, 0 rot

$ playwright run test:e2e:attachment-persistence (playwright.attachment-persistence.config.ts)
  2 Fälle, 2 grün, 0 rot
```

**Gesamt: 108 Fälle, 107 grün, 1 rot — die eine rote Stelle ist der neue, gewollt rote Fall.** Vorher
laut Auftrag 107/107; die Differenz ist genau der eine neue Fall. Kein Fremdbefund aus der
parallelen Arbeit von frontend-dev (Umbau der neun Absendeknöpfe auf `aria-disabled`) beobachtet —
alle 100 vorher schon vorhandenen Fälle der Hauptreihe blieben unverändert grün, einschließlich der
sechs Fälle in `timer-stop-announcement.spec.ts`, deren Kopfkommentar ich geändert habe.

Zusätzlich `pnpm exec tsc -p tests/e2e/tsconfig.json --noEmit`: 0 Fehler.

`pnpm test` und `proof:all` wurden in dieser Aufgabe **nicht** erneut gefahren — außerhalb meiner
Dateihoheit betroffen, und laut Auftrag bereits grün (`test` 77/1464 lt. Auftragstext, vermutlich ein
Schreibfehler für den Pfadanteil, nicht meine Zahl zum Prüfen).

---

## Kurzfassung

```
Aufgabe: T-224 — O-JP (Prüffall mit zwei Messungen, T-218), O-IW (Zitat vor Titeländerung bewahrt)
Status: fertig
```

**Artefakte:**
- `tests/e2e/focus-return-after-dialog.spec.ts` — neuer `describe`-Block, `TP-FOCUS-07` (O-JP)
- `tests/e2e/timer-stop-announcement.spec.ts` — ein Kopfkommentar berichtigt (O-IW), kein Prüffall
  geändert
- `docs/testplan.md` — neuer Abschnitt „30. Nachtrag aus T-224" mit allen drei Punkten

**Zusammenfassung:** Der neue Fall TP-FOCUS-07 mißt den von ui-designer in T-218 beschriebenen
Fokusverlust am „Leistung nachtragen"-Knopf im Export mit zwei Messungen — eine unmittelbar nach dem
Schließen des Dialogs, eine nach dem Eintreffen der durch `bump()` ausgelösten Auffrischung —, wobei
das Eintreffen über einen `page.route`-Zügel auf der betroffenen GET-Anfrage kontrolliert und über
das sichtbare Ergebnis (neuer Leistungstext in der Zeile) statt über eine Wartezeit erkannt wird; ein
naiver erster Versuch ohne diesen Zügel zeigte auf dieser Maschine beide Messungen bereits nach der
Auffrischung, weil die lokale Anfrage schneller zurück ist, als Playwright zusehen kann. Der Fall ist
heute nachweislich rot (Knotenungleichheit, Fokus auf `<body>`, per Zusatzmessung bestätigt) und wird
grün, sobald T-218 Abschnitt 11.2 umgesetzt ist. Ein zweiter, unangebundener Wortlautverweis auf den
„Neues Todo"-Dialogtitel in `timer-stop-announcement.spec.ts` ist auf die Befundkennungen O-DA/O-GZ
umgestellt, damit eine künftige Titeländerung ihn nicht mehr still falsch macht; derselbe Befund
steht unbehoben in `export-audit-and-locks.spec.ts:318` zur Kenntnis. Für Regel R-6 (dieselbe
Fehlerklasse, klassenweit statt punktuell) wurde kein automatisierter Wächter gebaut — er gehört
mangels verläßlicher Quelltext-Erkennbarkeit zweier der drei R-6-Merkmale und mangels Dateihoheit
(`apps/web/scripts/**`) nicht in diese Aufgabe; die Beurteilung und ein konkreter Vorschlag stehen im
Testplan. `pnpm test:e2e` läuft vollständig mit 108 Fällen, 107 grün, 1 gewollt rot.

**Annahmen:**
1. Die Doppelmessung mißt die **Knotengleichheit** (`document.activeElement`-Referenz vorher/nachher),
   nicht den künftigen Wortlaut aus T-218 Abschnitt 11.4 — der hängt an der offenen Frage F-10 an
   ux-designer und ist eine separate, noch nicht gebaute Änderung. Sobald 11.4 gebaut ist, bleibt
   dieser Fall unverändert gültig (er prüft eine Eigenschaft, keinen String); ein zusätzlicher,
   wortlautgenauer Fall wäre dann eine eigene, kleine Ergänzung, kein Ersatz.
2. Der `page.route`-Zügel filtert exakt auf `GET` **und** `pathname.endsWith('/time-entries')`
   **und** `exportStatus=open` — bewußt eng, damit weder die `PATCH`-Anfrage der Änderung noch eine
   künftige, andersartige Anfrage an denselben Pfad versehentlich mitgehalten wird.
3. Für O-IW wurde „berichtigen" statt „binden" gewählt, weil ein echtes Binden in dieser Datei einen
   sachfremden zweiten Dialog hätte öffnen müssen, nur um einen bereits anderswo geprüften Titel zu
   duplizieren.
4. Beim R-6-Vorschlag im Testplan handelt es sich um eine Beurteilung, keinen Auftrag an mich selbst
   — die Umsetzung läge bei frontend-dev (`apps/web/scripts/**`).

**Risiken:** Keine sicherheitsrelevanten. TP-FOCUS-07 hängt an der genauen Netzwerk-Filterlogik des
`page.route`-Zügels; ändert sich der Endpunkt oder die Filterparameter von `collectOpenEntries()`
grundlegend, müßte der Filter im Test mitgezogen werden — das würde den Fall sichtbar als „element
nicht gefunden" oder Timeout zeigen, nicht still grün bleiben.

**Offene Fragen:** Keine an den Orchestrator. F-10 (Wortlaut der zwei Beschriftungen) bleibt bei
ux-designer, wie in T-218 benannt.

**Nächster Schritt:** Sobald frontend-dev T-218 Abschnitt 11.2/11.4/11.8 umsetzt (spätere Welle),
sollte TP-FOCUS-07 automatisch grün laufen; ein Nachlauf zur Bestätigung ist trotzdem sinnvoll. Der
R-6-Vorschlag (`proof:dual-widget-swap`) und der Nachbarfund in `export-audit-and-locks.spec.ts:318`
liegen für eine künftige Welle bereit.
