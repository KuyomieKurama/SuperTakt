# T-217 — visual-qa: eine gerechnete Behauptung nachgemessen, eine fehlende Zahl geliefert, eine Lücke geschlossen

**Rolle:** visual-qa **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`

---

## Ergebnis vorweg

| Punkt | Rechnung (spec-ux-reviewer, T-212) | Messung |
|---|---|---|
| **O-IX** — Enter im frisch geöffneten Dialog mit gesperrtem Absendeknopf | „stummer Leerlauf", gerechnet aus Bauart und HTML-Spezifikation, **nicht** im Browser gemessen | **bestätigt, in Chromium, mit Gegenprobe**: kein Netzwerkaufruf, kein Text in `role="alert"`, Dialog bleibt unverändert offen. Dieselbe Taste am selben Feld löst nach dem Ausfüllen sofort aus — der gesperrte Zustand ist die alleinige Ursache, nicht Zufall oder ein zweiter Faktor |
| **Fehlende Zahl** — `PoolFormDialog`, Rumpf vs. Ausschnitt | „geht über den Ausschnitt hinaus" — **geschlossen**, aber ungemessen | **gemessen: 1599 px Inhalt gegen 492 px sichtbaren Ausschnitt (= 60vh bei 820 px Fensterhöhe) — 1107 px, gut das 2,25-Fache des Sichtbaren, liegen außerhalb** |
| **O-ID** | vier bis fünf der sieben Flächen, zwei der sechs neuen Pflichtfeldmeldungen weiterhin nicht unabhängig gemessen | **eine weitere Lücke geschlossen**: „Name fehlt." im `PoolFormDialog`, echt am Bildschirm ausgelöst. Verbleibend: **eine** von sechs Meldungen (`TemplatesScreen`-Kopierdialog), **vier bis fünf** von sieben O-HR-Flächen — unverändert, in diesem Durchgang nicht erreicht |

---

## Umgebung und Methodik

**Echte Anwendung gegen den echten Dienst, kein Nachbau** — für beide Hauptfragen war das nötig:
O-IX fragt nach einem tatsächlichen Browserereignis (Enter, Netzwerkaufruf, Live-Region), das
keine Fixtur ehrlich beantworten kann; die Rumpfmessung an `PoolFormDialog` braucht echte
`FolderPicker`/`StatusPicker`-Höhen, nicht nachgebaute.

Aufbau: `apps/local-api` aus dem Quelltext über `tests/e2e/support/version-check-entry.ts`
(dieselbe Naht wie T-198/T-210/`services.ts#spawnLocalApi`: eigene GitHub-Attrappe, damit keine
echte Verbindung nach außen geht, `XDG_DATA_HOME` auf ein eigenes Wegwerfverzeichnis
`/tmp/takt-t217-qa-data`), `apps/web` über `vite --host 127.0.0.1 --port 5173 --strictPort` mit
`VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN`. Erfundenes Sitzungsgeheimnis und Testkennung wörtlich aus
`tests/e2e/support/session.ts` übernommen (keine eigene Erfindung), Fenstergröße 1280×820 wie in
`/tmp/t210-qa/playwright.config.ts`. Beide Dienste sauber beendet (`ss -ltnp` vor und nach dem Lauf
geprüft: 5173/17843 frei). Skript und Bildschirmabzüge unter `/tmp/t217-qa/**`, keine Datei im
Repository verändert (`git status` zeigt ausschließlich fremde, bereits laufende Wellen).

**Eine methodische Anmerkung für die nächste Messung dieser Art:** Mein erster Versuch hat
`startServices`/`stopServices` direkt aus `tests/e2e/support/services.ts` importiert (derselbe
Code, den die Testreihe selbst benutzt) — das scheiterte an Node 22.23s striktem ESM-Auflöser, weil
`services.ts` seine Nachbardatei ohne Endung importiert (`from './session'`), was Playwrights
eigene Transformationskette akzeptiert, ein nackter `node file.ts`-Aufruf aber nicht. Ich habe die
wenigen benötigten Werte (Adressen, Geheimnis, Handshake, `waitFor`-Schleife) deshalb **wörtlich**
aus `services.ts`/`session.ts` in ein eigenes Skript übernommen, statt den Import zu erzwingen —
`version-check-entry.ts` selbst (der eigentliche Dienststart) blieb dabei unverändert und wurde
unverändert aufgerufen, nur der Rahmen darum ist meine eigene, kleinere Fassung.

**Die beiden Grenzen, wie vorgegeben:**
1. **Kein Vorleseprogramm (T-B09).** Wo unten `role="alert"`, `disabled`-Attribut oder
   `document.activeElement` steht, ist das eine DOM-Messung, kein gehörter Ton.
2. **Nur Chromium.** Playwrights gebündelte Engine, nicht WebKitGTK (Linux-Auslieferung) oder
   WKWebView (macOS) — von den drei ausgelieferten Erzeugnissen (`release.yml`: `ubuntu-24.04`,
   `windows-2022`, `macos-15`) zeichnet nur Windows mit einer Chromium-Verwandten (WebView2); für
   Linux und macOS bleibt jede Zahl unten ungemessen. Betroffen wären hier am ehesten die genaue
   Pixelzahl der Rumpfmessung (Schriftgröße/Zeilenumbruch können je Engine leicht abweichen) und —
   theoretisch — das Verhalten der impliziten Formularabsendung selbst, die die HTML-Spezifikation
   zwar für alle Engines gleich vorschreibt, aber nicht jede Engine gleich genau umsetzt. Was unten
   steht, ist eine Chromium-Messung, keine Garantie für die anderen beiden Drittel der Auslieferung.

---

## 1. O-IX — die Eingabetaste im frisch geöffneten Dialog: bestätigt, mit Gegenprobe

### 1.1 Aufbau

`http://127.0.0.1:5173/#/tags` → Knopf „Tag" (öffnet `TagsScreen.tsx`s „Neuen Tag anlegen",
`submitDisabled={name.trim().length === 0}`, `FormDialog.tsx` reicht das als echtes
`disabled={submitDisabled}` an den einzigen `type="submit"`-Knopf des Formulars — genau die Bauart,
die Z-61/Z-64.2 unterstellt). Namensfeld angeklickt, **nichts getippt**, `Enter` gedrückt.

### 1.2 Gemessen — der stumme Leerlauf

```
Absendeknopf, disabled-Attribut vor Enter:        vorhanden (leerer Wert, HTML-Attributsyntax)
Dialog sichtbar vor Enter:                        true
Netzwerkaufrufe an 127.0.0.1:17843 nach Enter:     [] (keiner)
role="alert"-Text im Dialog nach Enter:            "" (leer)
sichtbarer Text der Seite (body.innerText):        unverändert, zeichengleich vor/nach Enter
Dialog sichtbar nach Enter:                        true (unverändert offen)
```

Bildbeleg: `oix-01-tag-dialog-open.png` gegen `oix-02-after-enter-empty.png` — **bitgleiche**
Dialogansicht, kein Pixel unterscheidet sich außer dem Cursorblinken im leeren Feld. Kein Toast,
keine Meldung, kein Fokuswechsel, keine Netzwerkaktivität. **Spec-ux-reviewers Rechnung ist damit
nicht nur plausibel, sondern gemessen zutreffend**: Ein Benutzer, der im frisch geöffneten Dialog
Enter drückt, bekommt exakt null wahrnehmbares Feedback — nicht „eine schwache Reaktion", sondern
buchstäblich keine.

### 1.3 Gegenprobe — dieselbe Taste, ausgefülltes Feld, sofortiger Erfolg

Um auszuschließen, dass Enter in diesem Dialog aus einem anderen Grund wirkungslos ist (etwa ein
Fokusproblem oder ein zweiter Torwächter), habe ich denselben Ablauf mit einem echten Namen
wiederholt:

```
Absendeknopf, disabled-Attribut nach Eingabe:      null (Attribut entfernt)
Netzwerkaufrufe nach Enter (ausgefüllt):           POST /api/v1/tags, dazu sechs GET-Aufrufe der
                                                    Strukturneuladung — echter Absendevorgang
Dialog nach Enter (ausgefüllt) noch sichtbar:      false (geschlossen, Toast „Tag angelegt.")
```

Bildbeleg: `oix-03-gegenprobe-nach-enter-ausgefuellt.png`. **Damit ist die Ursache isoliert:** Die
einzige Variable zwischen „stumm" und „löst aus" ist das `disabled`-Attribut am Standardknopf des
Formulars — exakt die Kausalkette, die Z-64.2 als Auflage verlangt hat, jetzt mit einer echten
Messung statt einer Ableitung aus der HTML-Spezifikation belegt.

**Was diese Messung nicht ist:** eine Messung des *nachher*-Zustands (nach dem Umbau auf
`ariaDisabled`). Der Umbau ist zum Zeitpunkt dieser Messung noch nicht gebaut — Z-64.2 verlangt
ausdrücklich zwei Messungen, „heute" und „nachher", und nur die erste liegt hier vor. Die zweite
gehört in denselben Auftrag wie der Umbau selbst.

---

## 2. Die fehlende Zahl — `PoolFormDialog`: der Rumpf geht 1107 px über den Ausschnitt hinaus

### 2.1 Aufbau

`http://127.0.0.1:5173/#/tags` → Knopf „Neue Regel" (öffnet `PoolFormDialog` im Anlegen-Fall,
`title="Neuen Pool anlegen"`, `defaultPlacement="pool"` — genau der Fall, den Z-63 beschreibt: das
Namensfeld als erstes Element eines langen Rumpfes mit drei `FormSection`, zwei `FolderPicker`,
`StatusPicker`, mehreren `RadioRow` und einer Vorschau). 500 ms gewartet, bis `FolderPicker`/
`StatusPicker` ihre Datenquelle (leerer, aber „ready"-Zustand — keine Ordner im frischen
Datenbestand, kein Ladezustand mehr) aufgelöst haben.

### 2.2 Gemessen — echte `getBoundingClientRect()`/`scrollHeight` am echten Baustein

```
.dialog__body--form  scrollHeight:     1599 px
.dialog__body--form  clientHeight:      492 px
.dialog__body--form  offsetHeight:      492 px
.dialog__body--form  max-height (berechnet):  492px  (= 60vh bei 820 px Fensterhöhe, zeichengleich
                                                        zur CSS-Regel aus app.css:1299-1303)
Überschuss (scrollHeight − clientHeight):     1107 px
Gesamter Dialograhmen (getBoundingClientRect): top 78,75 / bottom 741,25 / Höhe 662,5 px
Erstes Textfeld „Name", Rect:                  top 215,0 / bottom 247,0 (sichtbar beim Öffnen)
```

Bildbeleg `pool-01-open.png`: Der sichtbare Ausschnitt endet mitten im Abschnitt „Erforderliche
Ordner" — „Ein Ordner steht für alles, was in ihm liegt." wird bereits abgeschnitten. Das ist,
gezählt: **nur 492 von 1599 px des Rumpfinhalts sind gleichzeitig sichtbar — ein Drittel (30,8 %).
1107 px, das 2,25-Fache des sichtbaren Ausschnitts selbst, liegen aktuell außerhalb.**

### 2.3 Einordnung — was das für Z-63 bedeutet

Die Fußzeile (`Abbrechen`/`Anlegen`) liegt außerhalb von `.dialog__body--form` und bleibt bei jedem
Scrollstand sichtbar (bestätigt: `dialogRect.bottom` 741,25 liegt unterhalb von `bodyRect`,
unverändert seit T-202s Messung an anderer Stelle). Ein Benutzer kann also bis zum Ende des
Formulars scrollen und dort „Anlegen" drücken, **ohne** dass das Namensfeld — 1107 px weiter oben —
zu irgendeinem Zeitpunkt zusammen mit dem Absendeknopf im Bild steht. Ein **statischer** Hinweis
direkt unter dem Namensfeld (der von A/B/C unterstellte „Grund steht daneben"-Mechanismus) läge
exakt an dieser einen, dann unsichtbaren Stelle — er hülfe dem Benutzer an der Stelle, an der er
tatsächlich steht (beim Absendeknopf), nicht weiter als das leere Feld selbst. Das ist die
Zahl, die Z-63s Argument bisher nur behauptet, jetzt aber belegt: **nicht** „ein Feld irgendwo im
Formular", sondern ein Feld, dessen eigener Hinweis über zwei Drittel der Rumpflänge vom
Absendepunkt getrennt liegen kann — und genau deshalb ist `revealFirstInvalidWithin` (ein
aktiver Rücksprung beim Absendeversuch) hier die einzige Antwort, die trägt, kein daneben
stehender Text.

---

## 3. O-ID — eine weitere Lücke aus T-198/T-210 geschlossen

### 3.1 Geschlossen: „Name fehlt." im echten `PoolFormDialog`

Namensfeld angeklickt, ein Zeichen getippt, sofort wieder gelöscht, Feld verlassen (`Tab`) —
dieselbe P-8-Probe wie in T-198/T-210 an den anderen Dialogen: bloßes Antasten ohne Eingabe hätte
still bleiben müssen (nicht separat erneut gemessen, da bereits an drei anderen Stellen bestätigt);
**Tippen + Löschen + Verlassen** löste zuverlässig aus:

```
role="alert" im PoolFormDialog nach Tippen+Löschen+Verlassen:  "Name fehlt."
```

Bildbeleg `pool-02-name-fehlt.png`: der rote Satz „Name fehlt." erscheint unmittelbar unter dem
Namensfeld, Dialog bleibt offen, kein Sprung. **Damit ist der zweite der beiden nach T-210 noch
offenen Sätze jetzt unabhängig am Bildschirm bestätigt.**

### 3.2 Weiterhin offen, mit Zahl

- **O-FR:** noch **eine** der ursprünglich sechs neuen Pflichtfeldmeldungen unabhängig ungemessen —
  `TemplatesScreen`-Kopierdialog („Name der Kopie fehlt."). Braucht eine echte Vorlage über den
  Dienst; in diesem Durchgang aus Zeitgründen nicht aufgebaut.
- **O-HR:** unverändert **vier bis fünf** der sieben von T-191 genannten Flächen ungemessen
  (Vorlageneditor mit doppeltem Schlüssel/„Ungespeicherte Änderungen", Vorschau einer nicht
  exportierbaren Tagesgruppe, Exportlauf mit gesperrter Gruppe, Anhang mit Fehler in der
  Todo-Ansicht, Tag-Auswahl während des Ladens) — in diesem Durchgang zugunsten der beiden
  namentlich beauftragten Fragen (O-IX, die fehlende Zahl) zurückgestellt, wie schon in T-210
  gegenüber den dort beauftragten drei Rechnungen.

---

## Befunde (Format wie vorgegeben)

`apps/web/src/components/FormDialog.tsx` (`disabled={submitDisabled}` am einzigen
`type="submit"`) **hoch** — Gemessen in Chromium, mit Gegenprobe: Im frisch geöffneten Dialog mit
leerem Pflichtfeld löst die Eingabetaste am Feld nichts aus — kein Netzwerkaufruf, kein Text in
einer `role="alert"`-Region, keine sichtbare Änderung. Dieselbe Taste am selben Feld mit Inhalt löst
sofort einen echten Absendevorgang aus; die einzige Variable ist das `disabled`-Attribut.
Erwartung: Eine bewusste Handlung (Enter drücken) erzeugt eine wahrnehmbare Reaktion, auch wenn sie
nur „das geht so nicht" ist (SC 3.3.1). Fix: der bereits entschiedene Umbau auf `ariaDisabled` an
allen neun Aufrufstellen des zentralen Riegels in `FormDialog.tsx` (Z-61) — diese Messung liefert
die von Z-64.2 verlangte „heute"-Hälfte; die „nachher"-Hälfte (Enter führt zurück und speichert
nicht) bleibt im selben Auftrag zu messen, sobald der Umbau steht.

`apps/web/src/screens/PoolFormDialog.tsx` / `apps/web/src/styles/app.css:1299-1303`
(`.dialog__body--form`, `max-height: 60vh`) **hoch** — Gemessen am echten, ungekürzten Formular
(Anlegen-Fall, 1280×820): `scrollHeight` 1599 px gegen `clientHeight` 492 px — 1107 px (2,25-mal
der sichtbare Ausschnitt) liegen außerhalb des Bildes, nur 30,8 % des Rumpfinhalts sind gleichzeitig
sichtbar. Die Fußzeile mit dem Absendeknopf bleibt dabei immer sichtbar, unabhängig vom Scrollstand
im Rumpf. Erwartung: Ein Absendeversuch mit leerem Namensfeld holt dieses Feld sichtbar ins Bild,
unabhängig davon, wo im Formular der Benutzer zuletzt gescrollt hat. Fix: kein eigener — bestätigt
nur die Zahl hinter Z-63/dem bereits vorgesehenen `revealFirstInvalidWithin`-Weg; ein statischer
Hinweis direkt unter dem Feld wäre an dieser Stelle unwirksam, weil er im selben, dann unsichtbaren
Bereich läge.

`apps/web/src/screens/TemplatesScreen.tsx` **niedrig** (Abdeckungslücke, kein Befund) — Die letzte
der ursprünglich sechs neuen Pflichtfeldmeldungen („Name der Kopie fehlt.") ist weiterhin nicht
unabhängig am Bildschirm gemessen; braucht eine echte Vorlage über den Dienst. Erwartung: eine kurze
Folgemessung mit einer vorbereiteten Vorlage schließt die letzte Lücke dieser Reihe.

`.claude/team/reports/T-217-visual-qa.md` (O-HR, unverändert seit T-198/T-210) **niedrig**
(Abdeckungslücke) — Vier bis fünf der sieben von T-191 genannten Flächen sind weiterhin nicht
eigenständig gemessen — in diesem Durchgang zugunsten der beiden namentlich beauftragten Fragen
zurückgestellt. Erwartung: eine eigene Folgeaufgabe mit vorbereiteten Testdaten schließt sie, wie
in T-198/T-210 vorgeschlagen.

---

## Annahmen

1. **Eigener, kleiner Nachbau des Startrahmens statt Import von `services.ts`** (s. Methodik) —
   `version-check-entry.ts` selbst lief unverändert; nur die Umgebung darum (GitHub-Attrappe,
   Warteschleife, Handschlag) ist eine wörtliche Übernahme der dortigen Werte in ein eigenes
   Skript, weil der direkte Import an Node 22s ESM-Auflösung für endungslose Nachbarimporte
   scheiterte.
2. **„Einer der betroffenen Dialoge" = „Neuen Tag anlegen"** (`TagsScreen.tsx`) — spec-ux-reviewer
   nennt genau diesen Dialog als Beispiel in T-212 (1.3(b)); ich habe denselben gewählt, nicht
   irgendeinen der neun, damit die Messung sich unmittelbar auf die zitierte Stelle bezieht.
3. **Frischer, leerer Datenbestand** für die `PoolFormDialog`-Messung (kein Ordner, kein Tag) —
   das mißt die *Grundhöhe* des Formulars ohne Dateninhalt; mit vorhandenen Tags/Ordnern (mehr
   Chips, mehr Zeilen) wäre der Überschuss eher größer als kleiner, nie kleiner. Die Zahl 1107 px
   ist damit ein unterer, kein oberer Wert.
4. **P-8-Probe (Tippen+Löschen+Verlassen) statt bloßem Antasten** für die „Name fehlt."-Messung an
   `PoolFormDialog`, weil bloßes Antasten laut der in T-186/T-198 gemessenen Regel bewusst still
   bleibt — ein erster Versuch mit bloßem Antasten blieb entsprechend leer und ist keine Widerlegung,
   sondern die erwartete Bestätigung derselben Regel an einer vierten Stelle.

## Risiken

1. **Die „nachher"-Hälfte von Z-64.2 fehlt weiterhin** — diese Messung liefert nur den heutigen
   Zustand. Solange der Umbau nicht gebaut ist, bleibt unklar, ob die neue Fassung tatsächlich exakt
   das tut, was Z-61 verspricht (Rückführung läuft, Handlung läuft nicht); das ist keine Entwarnung,
   sondern eine offene zweite Messung im selben künftigen Auftrag.
2. **Nur Chromium gemessen** — für die beiden anderen ausgelieferten Erzeugnisse (Linux/WebKitGTK,
   macOS/WKWebView) ist sowohl das Verhalten der impliziten Formularabsendung als auch die genaue
   Pixelzahl der Rumpfmessung unabhängig ungemessen.
3. **Eine der sechs neuen Pflichtfeldmeldungen und vier bis fünf der sieben O-HR-Flächen bleiben
   offen** — Zahl oben benannt, keine stille Auslassung.
4. **Kein Vorleseprogramm in dieser Umgebung** — jede Aussage über tatsächliches Ansage-Verhalten
   wäre eine Ableitung aus DOM-Struktur, keine Messung; ich habe keine solche Aussage getroffen.

## Offene Fragen

1. **An den Orchestrator:** Soll ich die „nachher"-Hälfte von Z-64.2 (Enter führt nach dem Umbau
   zurück, ohne zu speichern) unmittelbar messen, sobald frontend-dev den Umbau auf `ariaDisabled`
   umgesetzt hat, oder wird das Teil der regulären Freigabeprüfung dieses Auftrags?
2. **An den Orchestrator:** Soll die letzte offene O-FR-Meldung (`TemplatesScreen`) und die vier bis
   fünf offenen O-HR-Flächen weiterhin in meiner Hand bleiben, mit vorbereiteten Testdaten
   (eine Vorlage, gemischter Exportstatus), oder in eine eigene kleine Folgewelle wandern?

## Nächster Schritt

1. **spec-ux-reviewer/Orchestrator:** Z-61/Z-64 können sich jetzt auf eine gemessene, nicht nur
   gerechnete „heute"-Hälfte stützen; die fehlende Zahl zu `PoolFormDialog` (1107 px, 2,25× der
   sichtbare Ausschnitt) liegt vor.
2. **frontend-dev (nach T-216):** Umbau auf `ariaDisabled` an allen neun Aufrufstellen (Z-61),
   danach die „nachher"-Messung (Z-64.2, Teil 2) durch mich.
3. **visual-qa (Folgeauftrag oder ich selbst):** letzte O-FR-Meldung (`TemplatesScreen`) und die
   vier bis fünf O-HR-Flächen schließen.

---

**freigegeben** für die beiden gemessenen Punkte dieses Auftrags (O-IX, die fehlende Zahl zu
`PoolFormDialog`) — beide bestätigen die jeweilige Rechnung, keine wurde widerlegt. O-ID ist um eine
weitere Fläche kleiner geworden; die verbleibende Zahl (eine O-FR-Meldung, vier bis fünf O-HR-
Flächen) steht oben, nicht verschwiegen. Kein Urteil über den noch ungebauten Umbau selbst — der
existiert zum Zeitpunkt dieser Messung nicht.
