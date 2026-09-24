# T-202 — frontend-dev: der Weg zur Absage, und eine Schiene, die es nie gab

**Welle AD (nachgestartet).** Vorlage: O-FR (Fund 4.3 aus T-198), O-HK (fünf Stellen aus T-194),
O-HW (redaktionell). Messungen im Browser: Chromium über `@playwright/test` aus dem
Wurzel-`node_modules`, Musterseite auf **Port 5188** (`vite --host 127.0.0.1 --port 5188
--strictPort`), **kein lokaler Dienst gestartet** — 17843 blieb frei (E-083 Punkt 2). Wegwerfskripte
unter `/tmp/t202-qa/**`, nichts davon im Bestand; Port nach Abschluß geprüft frei.

---

## 1. O-FR 4.3 — die Rückführung zum ungültigen Feld

### 1.1 Was gebaut wurde, und an genau einer Stelle

`apps/web` hat **ein** `<form>` (gemessen: `grep -n "<form" src/` findet
`components/FormDialog.tsx` und sonst nichts). Genau dort sitzt die Rückführung, und damit gilt sie
für **alle 16** Formulardialoge des Produkts, nicht für den Todo-Dialog allein.

Drei Teile:

1. **`lib/focus.ts#revealFirstInvalidWithin`** — sucht im scrollenden Rumpf das erste Element mit
   `aria-invalid="true"`, setzt den Fokus darauf (`preventScroll: true`) und holt seinen **Block**
   ins Bild. Gesucht wird `aria-invalid` und nichts anderes: Was ungültig ist, entscheidet die
   Fachregel an der Aufrufstelle und sagt es bereits im Baum — eine zweite Pflichtfeldliste hier
   wäre die Bauart, die E-086 misst statt zusichert.
2. **`lib/focus.ts#fieldBlockWithin`** — der Block ist das Kind des scrollenden Rumpfes, in dem das
   Element liegt. **Ohne Klassennamen**, weil ein Klassenname eine Verabredung zwischen zwei
   Dateien wäre, die kein Lauf misst. Ist der Block höher als der Ausschnitt (`Attachments` legt
   sein Feld mit dem Knopf „Auswählen …" in eine eigene Hülle), gilt das Feld selbst.
3. **`components/FormDialog.tsx`** — ein Zähler `submitAttempt` (damit ein **zweiter** Versuch ohne
   Änderung dazwischen den Fokus erneut setzt) und ein `useLayoutEffect`, der vor dem Bild läuft, so
   daß kein Sprung sichtbar wird.

### 1.2 Bedingung (a) — die Live-Region sagt **nicht** doppelt an

Das ist die Stelle, an der eine naive Fassung falsch wird. Bekommt das Feld den Fokus, liest eine
Vorlesehilfe Beschriftung, `aria-invalid` **und** die Beschreibung aus `aria-describedby` — und die
Beschreibung ist genau der Satz, der zugleich in der `role="alert"`-Fläche steht. Ohne Vorkehrung
fällt derselbe Satz zweimal.

**Gebaut:** `lib/fieldMessages.ts` (neu) trägt einen Schalter, den `FormDialog` über den Rumpf legt.
Während eines Absendeversuchs trägt jede Meldefläche **innerhalb desselben Formulars**
`aria-live="off"`; der Satz kommt dann vom Fokus und nur von ihm. Der Schalter fällt zurück, sobald
der Benutzer wieder tippt (`onInput` am Formular, `input` steigt auf) — **nicht** schon im nächsten
Bilddurchlauf, weil eine Vorlesehilfe die Änderung an einer Region nicht zwingend im selben
Augenblick verarbeitet, in dem sie geschieht.

Drei Entscheidungen dazu, jede mit Grund:

* **Die Rolle bleibt, wo sie ist.** Eine Rolle, die kommt und geht, wäre genau der Fehler, den T-162
  behoben hat. Geändert wird `aria-live`, und `proof:surface` Regel A kennt den Fall bereits von
  sich aus („ein `aria-live="off"` zählt nicht, weil es die Region gerade abschaltet").
* **Alle Feldflächen des Formulars, nicht nur die eine.** Werden mehrere Felder auf einmal
  ungültig, wäre ein Schwall von Alerts schlechter als eine Ansage. Heute fällt beides ohnehin
  zusammen: Kein Dialog des Produkts macht bei einem Absendeversuch mehr als **ein** Feld ungültig.
* **Die Meldung des Dienstes (`InlineMessage`) steht außerhalb des Schalters** und sagt weiter an.
  Sie ist keine Feldmeldung, und sie hat kein Feld, das sie beim Fokussieren mitliest.

**Grenze der Aussage (T-B09):** In dieser Umgebung läuft **kein Vorleseprogramm**. Gemessen sind
`aria-live`, `aria-invalid`, `aria-describedby`, `document.activeElement` und die Bildlaufwerte.
Was ein Hörender hört, ist daraus abgeleitet. Das Risiko der Gegenrichtung ist benannt: Sagt eine
Vorlesehilfe die Beschreibung beim Fokussieren **nicht** an, wäre die Meldung für diesen einen
Augenblick still (Risiko 1 unten).

### 1.3 Gemessen im Browser — die Lücke und ihr Verschwinden

Musterseite, `FormDialog`-Vorführung („Bedienbar"), Fenster **1000x150** (damit der Rumpf bei
`max-height: 60vh` wirklich scrollt), Titel geleert, dann acht Tabulatorschritte bis „Anlegen" und
Eingabetaste:

```
nach 8 Tabulatorschritten (Fokus auf „Anlegen")
  Rumpf: scrollTop=67 von 74 moeglich, sichtbar 35.8..125.8
  Titelblock: -31.2..24.6  → GANZ OBERHALB des Ausschnitts
  Fokus: BUTTON "Anlegen"

nach Enter auf „Anlegen", Titel leer
  Rumpf: scrollTop=0 von 98 moeglich, sichtbar 35.8..125.8
  Titelblock: 35.8..115.4  → im Bild
  Meldung: top=95.6  aria-live=off  text="Ein Titel ist Pflicht. …"
  Fokus: INPUT "Titel * (Pflichtfeld)"  aria-invalid=true

nach einem Zeichen
  Meldung: aria-live=(keins)   ← der Schalter faellt von selbst zurueck
  Fokus: INPUT "Titel * (Pflichtfeld)"  aria-invalid=true
```

Bildbelege `/tmp/t202-qa/ofr-10-vor-absenden.png` (sichtbar sind „Feld der Vorlage" und der
Fußbereich — **kein** Titelfeld, **keine** Meldung) gegen `ofr-11-nach-absenden.png` (Titelfeld mit
sichtbarem Fokusring, rote Meldung unmittelbar darunter).

### 1.4 Welche Formulare ich außer dem Todo-Dialog geprüft habe

**Gezählt, nicht geschätzt.** 16 `<FormDialog>`-Aufrufe, alle durch dasselbe `<form>`:

| Dialog | Datei | erreicht die Rückführung heute? |
|---|---|---|
| Neues Todo / Todo bearbeiten | `screens/TodoFormDialog.tsx` | **ja** — `setTitleTouched(true)` im Absenden |
| Anhang hinzufügen | `components/Attachments.tsx` | **ja** — `setTouched(true)` im Absenden; ein nicht leerer, aber unzulässiger Wert (etwa `ftp://…`) |
| Formulardialog der Musterseite | `showcase/ControlsSection.tsx` | **ja** — hier gemessen |
| Neuen Tag / Ordner anlegen, Umbenennen | `screens/TagsScreen.tsx` (4x) | nein: `submitDisabled`, das Absenden läuft gar nicht |
| Neuen Status anlegen / umbenennen | `screens/StatusSettings.tsx` | nein: `submitDisabled` |
| Pool / Spalte anlegen und ändern | `screens/PoolFormDialog.tsx` | nein: `submitDisabled` |
| Pool umbenennen | `screens/PoolRenameDialog.tsx` | nein: `submitDisabled` |
| Vorlage kopieren | `screens/TemplatesScreen.tsx` | nein: `submitDisabled` |
| Zeit von Hand erfassen / Buchung bearbeiten | `screens/BookingDialogs.tsx` | nein: keine Feldprüfung beim Absenden |
| Timer stoppen, „Es läuft bereits ein Timer", „Eine Buchung ohne Ende" | `app/TimerContext.tsx` (3x) | nein: kein Pflichtfeld |
| Spalten des Boards | `screens/BoardScreen.tsx` | nein: kein Eingabefeld |

Neun Dialoge sperren den Absendeknopf, solange das Pflichtfeld leer ist — dort **kann** der von
T-198 gemessene Fall nicht entstehen, weil kein Absendeversuch stattfindet. Die Rückführung steht
trotzdem an der gemeinsamen Stelle: Wer morgen eine Prüfung beim Absenden ergänzt, bekommt sie
geschenkt, statt sie zum zwölften Mal abzuschreiben.

**`ConfirmDialog` ist kein `<form>` und bleibt unberührt — gemessen, nicht angenommen:** sein Rumpf
hat `overflow-y: visible` und `max-height: none` (`{"cls":"dialog__body","overflowY":"visible",
"maxHeight":"none","scrollHeight":110,"clientHeight":110}`). Er scrollt nicht eigenständig; die
Begründungsmeldung steht unmittelbar über dem Knopf, den der Benutzer gerade gedrückt hat. Der
Mechanismus aus 4.3 kann dort nicht greifen. Die Feldfläche des Dialogs bekommt deshalb auch keinen
Schalter — sie liegt außerhalb jedes Formulars.

---

## 2. O-HK — die zwei Randschienen und die Schraffur

### 2.1 Die fünf Stellen der Schienenzusage — und **zwei weitere**, die T-194 nicht gezählt hat

Die fünf aus `docs/design/traeger-und-zusage.md` 2.6:

1. `apps/web/src/styles/components.css` — Kommentar über `.note--billing::before` („gestreift …
   bleibt in Graustufen bestehen")
2. `apps/web/src/components/NoteField.tsx` — Merkmal 1 („gestreift (Leistung) gegen einfarbig
   (Vermerk)")
3. `apps/web/src/components/NoteField.tsx` — „bleiben in Graustufen unterscheidbar (Probe in
   Abschnitt 7 der Musterseite)"
4. `apps/web/src/showcase/NotesSection.tsx` — Merkmalstabelle, Zeile „Randschiene" („4px gestreift"
   / „4px einfarbig")
5. `apps/web/design/DESIGNSYSTEM.md` — Merkmalstabelle **und** der Aufzählungspunkt „Die gestreifte
   Randschiene trägt auch dann, wenn Farbe wegfällt"

**Über den Wortlaut gesucht (E-087 Punkt 4, `grep` nach „gestreift" und „einfarbig"), nicht über die
Zeile — und dabei zwei weitere gefunden:**

6. `apps/web/src/showcase/NotesSection.tsx`, **sichtbarer Text** der Karte „Warum nicht einfach
   längere Namen": „die Gestaltung: die gestreifte Randschiene, das Kopfband …". Das ist die
   widerlegte Zusage auf dem Bildschirm und nicht im Kommentar. Berichtigt zu „die durchgezogene
   Randschiene gegen die unterbrochene des Vermerks".
7. `apps/web/design/DESIGNSYSTEM.md` — der Bestandssatz „Stand 2026-09-01: **124 Paare geprüft**
   … die gestreifte Randschiene des Leistungsfelds". Er nannte ein Paar, das es nicht mehr gibt, und
   eine Zahl, die um 118 Paare veraltet war. Beides berichtigt, die historische Aussage bleibt
   („damals gestreift, seit T-202 durchgezogen").

Dazu, aus derselben Suche nach „Schraffur", eine **achte** Stelle, die zur ersten Zusage gehört:
`components.css` trug oberhalb von `.status-marker` einen verwaisten Kommentar
(„Zusatzkennzeichen ‚schon einmal exportiert' … Trägt Symbol, **Schraffur** und Wortlaut, damit es
ohne Farbe erkennbar bleibt"). Berichtigt.

### 2.2 Was jetzt in den Dateien steht

| Datei | Änderung |
|---|---|
| `apps/web/src/styles/components.css` | Kommentar an `.badge--reopened` durch den Wortlaut aus Artefakt 1.3 ersetzt (Verstärkung, kein Träger; 1,24 / 1,45; Deckel 1,80 / 1,58). **Kein Wert angefaßt.** |
| `apps/web/src/styles/components.css` | verwaister Schraffur-Satz über `.status-marker` berichtigt |
| `apps/web/src/components/ExportStatus.tsx` | Kopf der Merkmalstabelle: die Schraffur zählt in der Aufzählung der farbunabhängigen Träger **nicht** mit (Artefakt 1.4) |
| `apps/web/src/styles/components.css` | `.note--billing::before` samt Verlauf **entfallen**; `.note--internal` trägt `border-inline-start: 4px dashed`; berichtigter Kommentar mit den zwei Zahlen und dem Grund |
| `packages/ui-tokens/tokens.css` | `--note-billing-rail-stripe` in **allen drei** Blöcken entfallen; Grund an der verbliebenen Schiene, Erläuterung „Balken gegen Lücke" an `--note-internal-rail` |
| `apps/web/scripts/contrast-check.mjs` | Streifenpaar entfallen; zwei Notizen berichtigt; ein Paar neu (`--note-billing-rail` gegen `--note-internal-rail`, `exempt`, mit dem Fensterbeweis) |
| `apps/web/src/components/NoteField.tsx` | Merkmal 1 und der Graustufensatz berichtigt, mit Zahl und mit B-5 aus dem Artefakt |
| `apps/web/src/showcase/NotesSection.tsx` | Tabellenzeile und der sichtbare Satz berichtigt |
| `apps/web/design/DESIGNSYSTEM.md` | Tabellenzeile, Aufzählungspunkt und Bestandssatz berichtigt |

### 2.3 Der Kontrastlauf danach

```
0 von 484 Paaren durchgefallen.
242 Paare, davon 1 mit benannter Flaeche (over).
6 von 6 Gegenproben bestanden.
```

**Die Zahl bleibt bei 242**, und das ist kein Zufall: Das Streifenpaar fällt weg, das benannte
Ausnahmepaar der zwei Schienen gegeneinander kommt hinzu (Artefakt 2.5 und 6.2 verlangen es
ausdrücklich, „damit niemand sie ein zweites Mal sucht"). Die gemessenen Werte stimmen mit T-194
überein:

```
--note-billing-rail  auf --bg-surface        5.98 / 5.66  (min 3)   durchgezogene Schiene gegen die Karte
--note-internal-rail auf --bg-surface        3.49 / 4.31  (min 3)   unterbrochene Schiene — zugleich Balken gegen Luecke
--note-billing-rail  auf --note-internal-rail 1.71 / 1.31  (exempt) die beiden Schienen gegeneinander
```

T-194 hatte für die erste Zeile 5,99 gerechnet; der Lauf mißt **5,98**. Ich habe in allen
Kommentaren die Zahl des **Laufes** genommen, nicht die des Papiers.

### 2.4 Gemessen im Browser, echte Pixel — beide Themen

`.note--billing::before` ist weg (`getComputedStyle(el, '::before').content === "none"`), und die
Schienen sehen so aus:

```
hell   Leistung: ein einziger Lauf von 669 Bildpunkten rgb(33,89,218) — durchgezogen
       Vermerk:  19 Balken à 7,7css rgb(126,138,158) und 19 Luecken à 3,7css rgb(255,255,255)
dunkel Leistung: ein einziger Lauf von 669 Bildpunkten rgb(96,145,248)
       Vermerk:  19 Balken à 7,7css rgb(107,128,165) und 19 Luecken à 3,7css rgb(19,27,43)
```

**Die Farbe in der Lücke ist zeichengleich `--bg-surface`** (255,255,255 hell / 19,27,43 dunkel).
Damit ist die tragende Behauptung des Artefakts — „Balken gegen Lücke ist dasselbe Verhältnis wie
Schiene gegen Karte" — nicht abgeleitet, sondern am Bildpunkt gemessen. Das Paar mit 3,49 / 4,31
mißt wirklich die Form.

**Die Auflage aus Artefakt 2.8 ist erfüllt:** verlangt waren *mindestens drei sichtbare
Unterbrechungen auf dem kleinsten vorkommenden Feld*; gemessen sind **19** auf einem 229px hohen
Feld. Die Periode ist 11,4css — drei Lücken brauchen 34px Schiene, und kein `NoteField` des
Produkts ist so niedrig (allein Kopfband und Fußnote überschreiten das).

**Eckverbindung 4px zu 1px bei `--radius-lg`:** Nahaufnahmen `/tmp/t202-qa/ecke-{hell,dunkel}-{billing,internal}.png`
(26x26px bei dreifacher Auflösung). Die Rundung wird sauber gezeichnet, die gestrichelte Schiene
setzt darunter an, kein Versatz und kein Zacken. **Der Rückfall aus Artefakt 2.8 wird nicht
gebraucht.**

**Graustufenprobe mit dem eigenen Werkzeug der Musterseite** (`/tmp/t202-qa/grau-{light,dark}.png`):
Leistung zeigt einen durchgezogenen, Vermerk einen deutlich unterbrochenen Balken — in beiden
Themen. Das ist der erste Zustand, in dem diese Schiene ohne Farbe überhaupt etwas trägt; bis heute
war das Merkmal, wie T-198 gemessen hat, nicht schwach, sondern abwesend.

**Responsiv:** 1280 / 900 / 640 / 360px geprüft, `border-inline-start` bleibt `4px dashed` in jeder
Breite; bei 360px steht das Feld einspaltig und die Form trägt dort mehr, weil kein zweites Feld
daneben steht (`/tmp/t202-qa/schmal-360.png`).

---

## 3. O-HW — `IMPERATIV_AUSNAHME` im Präsens

`apps/web/scripts/proof-surface.mjs`: „dieselbe Bauart wie `IMPERATIV_AUSNAHME` im Add-in" →
„dieselbe Bauart, die das Add-in **bis T-199** unter `IMPERATIV_AUSNAHME` geführt hat; dort ist sie
mit dem umgestellten Satz entfallen". `docs/testplan.md` **nicht angefaßt** (e2e-tester).

---

## 4. Vertrag (E-076 Punkt 3)

| Änderung | Rolle | Zugänglicher Name | Klassenname | Token |
|---|---|---|---|---|
| Rückführung zum ungültigen Feld | — | — | — | — |
| `aria-live` an `.field__live` / `.note__live` | **`role="alert"` unverändert**; `aria-live` nur während eines Absendeversuchs auf `"off"` | — | — | — |
| Schienenform | — | — | `.note--billing::before` **entfällt**; `.note--billing`, `.note--internal`, `.note` unverändert | `--note-billing-rail-stripe` **entfällt** |
| Kommentare und Merkmalstabellen | — | — | — | — |
| sichtbarer Satz in `NotesSection` | — | — | — | — |

Der einzige neue Baustein an der Oberfläche ist ein **Attribut**, das eine Ansage für einen
Augenblick unterdrückt, weil sie an derselben Stelle bereits vom Fokus getragen wird. Kein Text kommt
hinzu (E-078); zwei Sätze werden **berichtigt**, keiner gestrichen.

---

## 5. Nachweise

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | 0 Fehler, alle acht Projekte plus Prüf- und e2e-Konfigurationen |
| `pnpm test` | **76 Dateien, 1456 grün** |
| `pnpm --filter @takt/web build` | erfolgreich |
| `pnpm run contrast` | **0 von 484 durchgefallen, 242 Paare, 6 von 6 Gegenproben** |
| `pnpm run proof:surface` | **20 / 0**, darunter 12 Gegenproben |
| `pnpm run proof:foreign` | **20 / 0**, darunter 3 Gegenproben |
| `pnpm run proof:codepoints` | **45 / 0** |
| `pnpm run proof:all`, `pnpm test:e2e` | **nicht gefahren** (E-083 Punkt 3, Anweisung des Orchestrators) |

---

## Kurzfassung

**Aufgabe:** T-202 — O-FR (Rückführung zum ungültigen Feld nach gescheitertem Absenden), O-HK (die
fünf Stellen der Schienenzusage), O-HW (redaktionell)

**Status:** fertig

**Artefakte:**
- `apps/web/src/lib/fieldMessages.ts` (neu)
- `apps/web/src/lib/focus.ts`, `apps/web/src/components/FormDialog.tsx`,
  `apps/web/src/components/NoteField.tsx`, `apps/web/src/components/ExportStatus.tsx`
- `apps/web/src/styles/components.css`, `apps/web/src/showcase/NotesSection.tsx`,
  `apps/web/design/DESIGNSYSTEM.md`
- `apps/web/scripts/contrast-check.mjs`, `apps/web/scripts/proof-surface.mjs`
- `packages/ui-tokens/tokens.css`
- `.claude/team/reports/T-202-frontend-dev.md` (dieser Bericht)

**Zusammenfassung:** Der Weg zur Absage steht jetzt an der **einen** Stelle, an der `apps/web` ein
`<form>` hat: Schlägt ein Absendeversuch fehl, bekommt das erste Element mit `aria-invalid="true"`
den Fokus, und sein Feldblock wird ins Bild geholt — im Browser gemessen von `scrollTop=67` mit dem
Titelblock bei `-31.2..24.6` (ganz oberhalb des Ausschnitts) auf `scrollTop=0` mit Titelblock und
Meldung im Bild. Damit die Absage nicht doppelt fällt, tragen die Meldeflächen desselben Formulars
für die Dauer des Versuchs `aria-live="off"` — die Rolle bleibt unangetastet, weil eine Rolle, die
kommt und geht, genau der Fehler wäre, den T-162 behoben hat, und der Schalter fällt zurück, sobald
der Benutzer wieder tippt. Bei O-HK ist die Schraffur-Zusage **zurückgenommen** (Wortlaut aus
Artefakt 1.3, kein Wert angefaßt) und die Schienenzusage **als Form berichtigt**:
`.note--billing::before` und `--note-billing-rail-stripe` sind fort, `.note--internal` ist
gestrichelt, und die Bildpunktmessung zeigt 19 Balken zu 19 Lücken mit exakt der Kartenfarbe in der
Lücke — die 3,49 / 4,31 des ohnehin vorhandenen Paares messen also wirklich Balken gegen Lücke. Über
den Wortlaut gesucht waren es **sieben** Stellen der Schienenzusage und nicht fünf; die zwei
zusätzlichen sind sichtbarer Text auf der Musterseite und ein veralteter Bestandssatz im
Designsystem.

**Annahmen:**
1. **Die Ansage gehört in diesem Augenblick dem Fokus, nicht der Region.** Ich habe die
   Doppelansage baulich verhindert, statt sie zu erwähnen — das war die ausdrückliche Bedingung (a).
   Der umgekehrte Fall (eine Vorlesehilfe, die `aria-describedby` beim Fokussieren nicht liest)
   wäre eine für einen Augenblick stille Meldung; ich halte das für das kleinere Übel, weil das
   Feld zusätzlich `aria-invalid="true"` trägt und der Satz sichtbar unter dem Feld steht. **Nicht
   gehört, nur im Baum gemessen (T-B09).**
2. **Der Schalter gilt allen Feldflächen des Formulars, nicht nur der einen, die den Fokus bekommt.**
   Sonst hätte ich im Baum entscheiden müssen, welches Feld das erste ist, bevor es gezeichnet ist.
   Heute macht ohnehin kein Dialog mehr als ein Feld auf einmal ungültig.
3. **Zurückgesetzt wird beim nächsten Tippen** (`onInput` am Formular), nicht im nächsten
   Bilddurchlauf. Ein Rücksetzen im selben Rahmen wäre ein Wettlauf mit der Verarbeitung der
   Vorlesehilfe. Preis: Tippen in einem Auswahlfeld, das in einem Portal liegt, steigt nicht zum
   Formular auf und hebt den Schalter nicht auf.
4. **Ich habe die Zahlen des Laufes genommen, nicht die des Papiers** (5,98 statt der gerechneten
   5,99). E-087 Punkt 2.
5. **`ConfirmDialog` bekommt nichts.** Gemessen: sein Rumpf scrollt nicht eigenständig, der Fall aus
   T-198 kann dort nicht entstehen.

**Risiken:**
1. **Die Doppelansage ist verhindert, aber nicht gehört.** Sollte sich zeigen, daß eine Vorlesehilfe
   die Beschreibung beim programmatischen Fokussieren überspringt, ist die Meldung für einen
   Augenblick still. Ein Prüffall dafür braucht ein Vorleseprogramm, und das gibt es hier nicht.
   **Das Rückgängigmachen ist eine Zeile** (`aria-live` weglassen) — der Schalter ist ausdrücklich so
   gebaut, daß er sich einzeln entfernen läßt.
2. **`--note-billing-rail-stripe` steht noch in einem gebauten Erzeugnis:**
   `apps/desktop/src-tauri/taskpane/assets/index-CRihYo0q.css`. Das ist ein Bauergebnis des
   Aufgabenbereichs und keine Quelle; es verschwindet beim nächsten Bau. Ich habe es **nicht** von
   Hand angefaßt.
3. **Die zweite Engine ist ungeprüft.** Gestrichelt gezeichnet habe ich in Chromium. Takt läuft
   zusätzlich in WebView2 (dieselbe Engine, unkritisch) und in WebKitGTK — dort legt die Engine die
   Länge der Unterbrechungen selbst fest. Die Auflage (mindestens drei Lücken) hat bei 19 gemessenen
   Lücken viel Luft, aber gemessen ist sie in einer Engine.
4. **`fieldBlockWithin` hängt an der Baumform**, nicht an einem Klassennamen — das ist Absicht, aber
   es heißt: Wer einen Dialogrumpf um eine Zwischenhülle erweitert, verändert stillschweigend, was
   „der Block" ist. Die Höhenschranke fängt den schlimmsten Fall ab, ein Lauf mißt es nicht.
5. **Neun Dialoge sperren ihren Absendeknopf**, statt beim Absenden zu prüfen. Dort greift die
   Rückführung nicht, weil es keinen Versuch gibt. Ob ein gesperrter Knopf die bessere Antwort ist
   als eine Absage mit Rückführung, ist eine Produktfrage und keine Umsetzungsfrage — sie steht
   neben O-HB.

**Offene Fragen:**
1. **An unit-tester / e2e-tester:** Die Rückführung hat heute **keinen** Prüffall.
   `tests/e2e/field-live-region-announcement.spec.ts` steht unmittelbar daneben und öffnet bereits
   den richtigen Dialog — was fehlt, sind zwei Messungen: der Rumpf ist nach dem gescheiterten
   Absenden wieder oben, und `document.activeElement` ist das Titelfeld. Ohne sie ist das hier eine
   Zusage ohne Messung, also genau das, was T-202 gerade behoben hat.
2. **An den Orchestrator:** `docs/design/traeger-und-zusage.md` 6.4 (O-HA — der dritte, zeichengleiche
   Primärknopf im Board-Leerzustand) stand **nicht** in meinem Auftrag und ist **nicht** umgesetzt.
   Er ist eine Zeile und hängt an keiner der hiesigen Änderungen.
3. **An den Orchestrator:** Artefakt 6.3 (die dreizehn übrigen Farben, A-A-45) hängt an der Mechanik
   des Laufes und war ebenfalls nicht Teil dieses Auftrags. Der Lauf hat seit T-197 ein Feld `over`
   — die fünf echten Paare und die fünf benannten Ausnahmen ließen sich jetzt ohne Umbau ergänzen.
4. **An visual-qa:** Die zweite Engine (WebKitGTK) für die gestrichelte Schiene, und der
   Rückführungsfall am **echten** `TodoFormDialog` gegen den laufenden Dienst — ich habe den Dienst
   bewußt nicht gestartet, um 17843 nicht zu belegen.

**Nächster Schritt:** `visual-qa` läßt die zwei Flächen am echten Dienst gegenprüfen (gescrollter
`TodoFormDialog`, Anhangdialog mit unzulässigem Verweis) und mißt die Schiene in der zweiten Engine;
parallel schreibt `unit-tester` oder `e2e-tester` den Prüffall aus Frage 1. Danach ist O-HK
geschlossen und O-FR bis auf die Hörseite gemessen.
