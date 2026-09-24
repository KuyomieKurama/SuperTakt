# T-207 — O-HY (die Regel sagt, was sie meint), dazu O-IF und O-IG (zweite Hälfte)

```
Aufgabe: T-207 — O-HY bauende Hälfte: `touchedOnBlur` auf `edited || value.trim().length > 0`
         berichtigen, den Grund in den Dateikopf, den alten Einwand gegen `trim()` ersetzen
         statt ergänzen. Dazu O-IF (welche neun Dialoge sperren, was ein Umbau kostete) und
         O-IG zweite Hälfte (WebKitGTK ohne Tauri-Bau prüfbar?).
Status: fertig
```

| Gegenstand | Ergebnis |
|---|---|
| O-HY, die Zeile | gebaut: `return edited || value.trim().length > 0;` |
| O-HY, der Kopf | Abschnitt „Die Berichtigung" neu; der Einwand gegen `trim()` **ersetzt**, nicht ergänzt |
| Verhaltensneutral? | **ja, gemessen** — an keiner der neun Auslösestellen ist der Unterscheidungsfall erreichbar. Auf Funktionsebene ist sie **nicht** neutral, und genau das hat der bestehende Prüffall sofort rot gemacht |
| O-IF | **9 Sperrstellen gezählt: 8 im Produkt, 1 auf der Musterseite.** Sie zerfallen in drei Sorten, nicht in eine |
| O-IG zweite Hälfte | **nein, nicht ohne Bau** — und die Lage ist ernster als „Entwicklungsengine": **zwei von drei** ausgelieferten Erzeugnissen zeichnen mit WebKit |

---

## 1. O-HY — was geändert ist

`apps/web/src/lib/touched.ts`, eine Zeile Sachverhalt und ein Abschnitt Begründung:

- **Die Regel:** `return edited || value.trim().length > 0;`
- **Der Kopf** trägt einen neuen Abschnitt „Die Berichtigung: „nicht leer" heißt **beschnitten**
  nicht leer (T-207)" mit dem Satz, um den es geht — *eine Regel darf für ihr Schweigen nicht auf
  eine ferne Aufrufstelle angewiesen sein* —, mit der Messung dazu (Abschnitt 2 hier) und mit der
  ausdrücklichen Warnung, daß eine Zeile, die heute nichts ändert, die Sorte ist, die später
  herausfällt.
- **Der alte Einwand gegen `trim()` steht nicht mehr da.** Er ist im Kopf **wiedergegeben und als
  entfallen bezeichnet** — mit dem Grund (seit T-186 trägt die erste Hälfte den Fall: wer tippt,
  setzt `edited`) und mit dem Grund für das Ersetzen statt Ergänzen (zwei einander
  widersprechende Begründungen nebeneinander sind schlechter als eine falsche).
- **Kein Kommentar neben der Abhängigkeit.** Die Abhängigkeit ist weg; der Kommentar im
  Funktionsrumpf beschreibt nur noch, was die zwei Hälften tun.
- Mitaufgenommen, damit sie nicht als Einfall wiederkommt: die Alternative `return edited` und
  warum sie abgelehnt ist (die zweite Hälfte ist die Tür für eine Meldung an einem vorbelegten,
  **nicht** leeren Feld — und ihr Streichen änderte P-8s Wortlaut, der nicht dieser Datei gehört).

**P-8 ist nicht angefaßt.** Das Zitat im Kopf steht zeichengleich wie vorher.

---

## 2. Ist die Änderung wirklich verhaltensneutral? — gemessen, mit dem Fall, an dem es sich entscheidet

**Die Frage ist zweigeteilt, und die zwei Hälften haben verschiedene Antworten.**

**Auf Funktionsebene: nein.** Die beiden Fassungen gehen bei genau einer Eingabeklasse auseinander
— `value` besteht aus lauter Leerraum **und** `edited === false`. Beleg ist kein Argument, sondern
ein Lauf: der bestehende Prüffall „ein Leerzeichen ist eine Eingabe …" (`(" ", false) → true`)
wurde durch die Änderung **sofort rot** (`expected false to be true`, 1 von 1456). Das ist genau
der Fall, den spec-ux-reviewer in Z-52 als falsch beschriftet erkannt hat; unit-tester hat ihn in
derselben Welle in zwei Fälle geteilt, und der Lauf steht wieder grün (jetzt 1464).

**Auf Produktebene: ja — und hier ist die Messung, nicht die Annahme.** Der Unterscheidungsfall
verlangt einen **vorbelegten** Wert aus lauter Leerraum. Ein gesteuertes Feld ändert seinen Wert
sonst nur über sein `onChange`, und das setzt `edited`.

Vorbelegt wird an den neun Auslösestellen mit genau drei Sorten Wert:

| Vorbelegung | Stellen | Kann sie Leerraum sein? |
|---|---|---|
| `""` | TagsScreen (Tag, Ordner), ConfirmDialog-Begründung, Attachments, und alle Anlegen-Fälle | nein — leer, nicht Leerraum; beide Fassungen liefern `false` |
| Name aus dem Bestand (`selected.name`, `pool?.name`, `status?.name`) | TagsScreen (Umbenennen), PoolFormDialog, StatusSettings | **nein** — jede schreibende Tür des Dienstes benutzt `nameSchema` = `z.string().trim().min(1)…` (`apps/local-api/src/http/input.ts`); gemessen für `routes/structure.ts` (Tag, Ordner, Status), `routes/export.ts` (Vorlage) und `routes/addin/schema.ts`. Ein gespeicherter Name ist beschnitten und nicht leer |
| `` `Kopie von ${dropHiddenCharacters(template.name)}` `` | TemplatesScreen | nein — das Präfix trägt Buchstaben |

Dazu der eine **programmatische** Setzer: `Attachments.tsx` setzt den Wert aus dem Dateiwähler
(`setValue(choice.path)`) ohne `onChange` — der Pfad ist nie Leerraum, und die Stelle setzt
`touched` ohnehin selbst.

**Ergebnis: kein Aufrufer, für den `value.length > 0` und `value.trim().length > 0` heute
auseinandergehen.** Kein Verhalten kippt, also ist es kein Befund.

**Was ich dabei nicht behaupte** (und was so auch im Dateikopf steht): „ändert nichts" heißt
„ändert an den heutigen Werten nichts", nicht „kann nichts ändern". Stünde je ein Leerraum-Name im
Bestand — geschrieben an der Tür vorbei, also von einem anderen Prozeß auf demselben Rechner oder
aus einer Zeit vor `nameSchema` —, dann schwiege die berichtigte Regel, wo die alte tadelte. Das
Schweigen ist nach P-8 richtig (der Benutzer hat nichts getan). Daß der Absendeknopf daneben
gesperrt ist und dafür keinen Satz hätte, ist **die Frage aus O-IF** und nicht die dieser Regel.

---

## 3. O-IF — welche neun, und was ein Umbau je Dialog zur Folge hätte

### 3.1 Die Zählung, heute am Baum

`<FormDialog` steht **16mal** in `apps/web/src` (das deckt sich mit T-202s „alle 16
Formulardialoge"). Davon reichen **9** ein `submitDisabled` herein — **8 im Produkt, 1 auf der
Musterseite**. Die Sperre ist ein echtes `disabled` am Absendeknopf (`FormDialog.tsx`,
`disabled={submitDisabled}`) **und** ein zweiter Riegel im Formular (`if (busy || submitDisabled)
return;`). Deshalb greift die Rückführung aus T-202 dort nicht: Sie hängt an `submitAttempt`, und
der wird erst nach diesem Riegel erhöht.

| # | Datei / Dialog | Sperrbedingung | Steht der Grund ohne Berühren da? |
|---|---|---|---|
| 1 | `PoolRenameDialog` — „… umbenennen" | leer **oder** unverändert **oder** vergeben | **ja, für alle drei** — dauerhafter Hinweis unter dem Feld, für „vergeben" zusätzlich eine Meldung |
| 2 | `TagsScreen` — „Neuen Tag anlegen" | Name leer | nein |
| 3 | `TagsScreen` — „Neuen Ordner anlegen" | Name leer | nein |
| 4 | `TagsScreen` — „Umbenennen" | Name leer | nein — **aber unerreichbar ohne Eingabe** (vorbelegt) |
| 5 | `TemplatesScreen` — „Vorlage kopieren" | Name leer | nein — **unerreichbar ohne Eingabe** (vorbelegt) |
| 6 | `StatusSettings` — anlegen / umbenennen | leer **oder** doppelt | **teils** — die Doppelmeldung steht bedingungslos; „leer" nur nach Berühren |
| 7 | `PoolFormDialog` — Pool/Spalte anlegen/ändern | Name leer | nein — beim Ändern vorbelegt, also unerreichbar ohne Eingabe |
| 8 | `Attachments` — „Anhang hinzufügen" | Wert leer | nein |
| 9 | `showcase/ControlsSection` — „Neues Todo" | `form === "blocked"` | Musterfall, kein Produktweg |

**Damit zerfallen die neun in drei Sorten, und nur eine davon ist die Frage wert:**

- **Sorte A — der Grund steht ohnehin da** (1, teilweise 6): Ein Absendeversuch brächte nichts
  Neues. `PoolRenameDialog` ist der Gegenbeweis zu „sperren heißt schweigen": Er sperrt und
  erklärt, dauerhaft, für jede seiner drei Bedingungen.
- **Sorte B — die Sperre ist ohne Eingabe gar nicht erreichbar** (4, 5, 7 im Änderungsfall): Das
  Feld ist vorbelegt und nicht leer; wer die Sperre auslöst, hat das Feld geleert, also `edited`
  gesetzt, also erscheint die Meldung. Hier ist heute schon nichts stumm.
- **Sorte C — die Sperre steht beim Öffnen, das Pflichtfeld ist blank** (2, 3, 8 und die
  Anlegen-Fälle von 6 und 7): **nur hier** kann ein Benutzer auf einen toten Knopf sehen, ohne
  einen Satz zu bekommen. Was fehlt, ist allerdings die Auskunft „das Pflichtfeld ist leer" — und
  die sagen die Beschriftung, der Stern und das sichtbar leere Feld bereits.

### 3.2 Was ein Umbau kostete — gemessen, wo es meßbar ist

**Am Baustein (einmalig, nicht je Dialog):**

1. `FormDialog`: `disabled={submitDisabled}` → `ariaDisabled` (die Eigenschaft gibt es seit T-186
   an `Button`, `Primitives.tsx`), und im `submit` beim gesperrten Versuch `submitAttempt` und
   `quiet` setzen, aber `onSubmit` **nicht** rufen. Die Rückführung
   (`revealFirstInvalidWithin`) und die Stillstellung der Meldeflächen sind schon da.
2. Damit die Rückführung etwas **findet**, muß das Feld sich beim Versuch für ungültig erklären.
   Zwei Wege, und sie sind nicht gleichwertig:
   - **je Dialog ein `onBlockedSubmit`** — 8 Aufrufstellen, und es baut genau die Abhängigkeit von
     einer fernen Stelle wieder auf, die O-HY heute beseitigt hat;
   - **ein Zähler im Kontext**, den `TextField` liest (neben dem vorhandenen
     `FieldMessageQuietContext`) und der dort `onTouched()` auslöst — **null** Änderungen je
     Dialog, und es ist wörtlich der zweite Umsetzungssatz von P-8 („Ein Absendeversuch setzt
     `touched` weiterhin immer"). Das ist der Weg, den ich empfehlen würde.
3. Die Musterseite (9) müßte den neuen Zustand zeigen; E-076 Punkt 3 verlangt dabei Rolle,
   zugänglichen Namen und Klassennamen zeichengleich.

**An den Prüfläufen (gemessen, nicht geschätzt):** `apps/web/test` enthält **null** Zusicherungen
auf `disabled`; `tests/e2e` enthält **drei** `toBeDisabled()`, und **keine** davon gilt einem
Absendeknopf eines Formulardialogs (zweimal der Exportknopf, einmal ein Gruppenhäkchen). Ein Umbau
zöge heute also **keine** Anpassung einer Zusicherung nach sich.

**Was er kostete, das nicht in Zeilen zu messen ist:**

- Ein `aria-disabled`-Knopf ist anklickbar; die einzige Sicherung ist der Riegel im `submit`. Das
  ist derselbe unvermessene Punkt, den T-186 als **O-GZ** selbst gemeldet hat — bei acht weiteren
  Dialogen wiegt er achtmal.
- Ein `aria-disabled`-Absendeknopf im `<form>` löst bei **Enter** weiterhin `submit` aus. Der
  Riegel muß also bleiben und gehört gemessen, nicht angenommen.
- Playwright hält `aria-disabled="true"` für unbedienbar; künftige Klicks darauf brauchen
  `{ force: true }` (auch das steht schon in T-186).
- Für Sorte A ist ein Umbau **kein Gewinn und ein Verlust**: `PoolRenameDialog` sperrt unter
  anderem auf „unverändert". Dafür gibt es heute einen Hinweis, aber keinen Tadel — und einen zu
  erfinden („Sie haben nichts geändert") ist eine Textentscheidung von ux-designer, nicht meine.

**Mein Eindruck, ausdrücklich als Zuarbeit und nicht als Urteil:** Die zweite Bauart ist nicht
pauschal falsch. Falsch ist sie dort, wo eine Sperre **beim Öffnen** steht und der Grund **nicht**
danebensteht — das sind fünf Stellen der Sorte C, und der billigste Weg dorthin ist nicht der
Umbau auf `aria-disabled`, sondern ein dauerhafter **Hinweis** unter dem Pflichtfeld nach dem
Muster von `PoolRenameDialog`. Der kostet keinen Knopfzustand, keine Playwright-Regel und keine
Meldung, die niemand ausgelöst hat.

---

## 4. O-IG, zweite Hälfte — WebKitGTK ohne Tauri-Bau

**Nein, für die ausgelieferte Engine nicht. Und die Grenze gehört so benannt, wie sie ist.**

- **Was gemessen werden soll:** die gestrichelte Schiene, `border-inline-start: 4px dashed
  var(--note-internal-rail)` in `components.css` (dieselbe Bauart auch als
  `border-inline-start-style: dashed`). Das Strichmuster einer `dashed`-Kante ist in CSS **nicht**
  festgelegt; Länge, Lücke und Phase rechnet jede Engine selbst aus. T-202s „19 Balken zu 19
  Lücken" ist deshalb eine Aussage über **Chromiums** Rasterung, nicht über die Form.
- **Was hier installiert ist:** unter `~/.cache/ms-playwright` liegen `chromium-*` und
  `chromium_headless_shell-*` — **kein WebKit**. Ohne Netzzugriff ist heute nicht einmal ein
  WebKit-naher Lauf möglich.
- **Und selbst mit `playwright install webkit` bliebe es ein Näherungswert:** Playwrights
  Linux-WebKit ist ein festgeschriebener Oberbau des GTK-Ports mit eigenen Änderungen, nicht das
  System-`libwebkit2gtk`, das die Hülle über wry benutzt. Es beantwortete „zeichnet eine
  WebKit-Engine die Striche überhaupt anders?", nicht „was zeichnet Takt?". T-B08 bleibt
  unberührt: Für Tauris Webview hat Playwright keinen Anknüpfungspunkt.
- **Die Lage ist ernster, als „Entwicklungsengine" klingt** — gemessen an der Baumatrix in
  `.github/workflows/release.yml`: ausgeliefert werden **drei** Erzeugnisse, `ubuntu-24.04`,
  `windows-2022`, `macos-15`. Windows zeichnet mit WebView2 (Chromium) — dafür trägt T-202s
  Messung. Linux zeichnet mit WebKitGTK, macOS mit WKWebView. **Zwei von drei ausgelieferten
  Erzeugnissen zeichnen also mit einer WebKit-Engine, und für beide ist die Zahl ungemessen.**
- **Was die Lücke kosten kann und was nicht:** Betroffen ist die **Geometrie** (wie viele Balken,
  wie lang, wie die Lücken liegen), nicht die **Farbe**. In einer Lücke steht der Untergrund der
  Karte, im Balken die Kantenfarbe — beides unabhängig von der Rasterung. Die Zusage aus T-194
  („Balken gegen Lücke ist dasselbe Verhältnis wie Schiene gegen Karte", 3:1) hält damit in jeder
  Engine; ungemessen ist allein die Aussage „19 zu 19" und die Frage, ob die Schiene in WebKit als
  Strichmuster überhaupt noch als solche **erkennbar** ist.

**Vorschlag, ohne ihn zu bauen:** Die Prüfung gehört an einen Läufer mit WebKitGTK (die
`ubuntu-24.04`-Zeile der Baumatrix hat die Abhängigkeit ohnehin) oder an visual-qa mit einem
WebKit-Aufsatz — und die Zahl „19 zu 19" gehört bis dahin im Papier als **„gemessen in Chromium,
2026-09-05"** gekennzeichnet (E-087 Punkt 2).

---

## 5. Nachweis (alles heute gefahren, nach der Änderung)

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** |
| `pnpm test` | **77 Dateien, 1464 grün** (unit-tester hat in derselben Welle eine Datei und Fälle ergänzt; vor seiner Landung: 76 / 1456 mit **genau einem** Roten — dem Fall aus Z-52) |
| `pnpm --filter @takt/web build` | grün |
| `pnpm run contrast` | **242 Paare, 484 Messungen, 0 durchgefallen, 6/6 Gegenproben** |
| `pnpm run proof:surface` | **20 / 0** (12 Gegenproben, 116 Quelldateien, 28 Live-Regionen) |
| `pnpm run proof:foreign` | **20 / 0** (3 Gegenproben, 165 behandelte Übergaben, 20 Eingabefelder) |
| `pnpm run proof:codepoints` | **45 / 0** |

`proof:all` und `test:e2e` **nicht** gefahren (E-083 Punkt 3).

Nicht gefahren und darum nicht behauptet: eine gerenderte Prüfung. Es hat sich **kein** JSX, kein
Stilblatt, kein Klassenname und kein sichtbarer Satz geändert — die Änderung ist eine Zeile Logik
und ein Kommentar. visual-qa hat an dieser Aufgabe nichts zu sehen; das ist die Angabe, nicht eine
ausgelassene Prüfung.

---

## 6. Nebenbefunde

1. **Ein Zitat in `apps/web/test/lib/touched.test.ts` ist seit dieser Aufgabe veraltet.** Der
   vierte Fall zitiert `touched.ts` mit „Es gilt als berührt — und bleibt trotzdem stumm, weil die
   Meldung darüber einen leeren Wert verlangt". Dieser Satz steht nicht mehr im Kopf — er **war**
   die Abhängigkeit, die O-HY beseitigt hat. Der Prüffall selbst ist grün und richtig; nur seine
   Beleghülle nennt eine Fassung, die es nicht mehr gibt. Datei gehört unit-tester, deshalb hier
   gemeldet statt geändert. (E-087 Punkt 4: das ist ein Wortlaut, keine Zeilennummer.)
2. **`git grep` ist an dieser Fläche derzeit blind.** Der heutige Zusatz in `CLAUDE.md` sagt, eine
   E-087-Suche laufe über die **versionierten** Dateien — richtig gegen die Bauergebnisse im
   Arbeitsbaum, aber unvollständig: In `apps/web/src` und `apps/desktop/src` liegen **10**
   Quelldateien, die noch nicht eingecheckt sind, **darunter `lib/touched.ts` selbst** (dazu
   `Attachments.tsx`, `AttachmentOpenDialog.tsx`, `DialogSurface.tsx`, `DeadlineFlag.tsx`,
   `useToday.ts`, `deadline.ts`, `fieldMessages.ts`, `attachmentLabel.ts`,
   `showcase/DeadlineSection.tsx`). Ein `git grep` nach `onTouched=` fand hier **6** Stellen, ein
   Suchlauf über die Quellverzeichnisse **8**. Das brauchbare Werkzeug ist beides: `git grep`
   **plus** ein Lauf über `apps/*/src`, unter Ausschluß von `dist/` und
   `src-tauri/taskpane/`.
3. **Eine Bearbeitung an `touched.ts` ist mir während der Aufgabe einmal verlorengegangen** (zwei
   Absätze, um 10:58:17 auf den Stand davor zurückgesetzt, danach neu geschrieben und geprüft).
   Ich habe keine zweite Schreibquelle nachweisen können und melde es nur, weil die Datei in
   meiner Hoheit liegt und ein zweiter Schreiber dort gegen die Verzeichnisregel verstieße. Der
   heutige Stand ist der geprüfte: `typecheck` 0, Prüffall 6/6.

---

## Annahmen

1. **Die neun Auslösestellen sind die neun Meldebedingungen**, nicht die neun `onTouched`-Zeilen:
   `Attachments.tsx` reicht `onTouched` zweimal herein (Verweis- und Pfadzweig desselben Feldes),
   dazu kommt das Begründungsfeld in `ConfirmDialog.tsx`, das `touchedOnBlur` direkt ruft. Ich
   habe im Dateikopf „neun" geschrieben, weil T-186 und T-200 dieselbe Zahl führen.
2. Die Formulierung des neuen Abschnitts ist meine; die **Sache** ist Z-51 wörtlich, samt der
   abgelehnten Alternative `return edited`, die ich mit spec-ux-reviewers Begründung aufgenommen
   habe.
3. Für O-IF habe ich **gezählt und beschrieben, nicht gebaut** — auch nicht versuchsweise.

## Risiken

1. **Diese Zeile ist wieder herausnehmbar, und sie wird ohne Prüffall herausgenommen.** Der Kopf
   erklärt das Warum, aber getragen wird sie von `apps/web/test/lib/touched.test.ts` — der Fall
   `(" ", false) → false` ist die einzige Sicherung. Fiele er, fiele die Berichtigung beim
   nächsten „das tut ja nichts" mit.
2. **Sorte C aus Abschnitt 3.1 bleibt offen**, und die Berichtigung macht sie um eine Nuance
   sichtbarer: Ein vorbelegtes Leerraum-Feld — heute unerreichbar — schwiege jetzt auch dann,
   wenn der Knopf gesperrt ist.
3. Die WebKit-Lücke aus Abschnitt 4 betrifft zwei von drei Erzeugnissen. Sie ist eine **Meß**lücke
   und kein bekannter Fehler; sie so zu benennen ist der ganze Punkt.

## Offene Fragen

1. **An spec-ux-reviewer (O-IF):** Reicht die Sortenaufteilung A/B/C als Grundlage? Und ist der
   billigere Weg für Sorte C — ein dauerhafter Hinweis unter dem blanken Pflichtfeld nach dem
   Muster `PoolRenameDialog` — die bessere Antwort als der Umbau auf `aria-disabled`?
2. **An ux-designer:** Falls doch umgebaut wird — welchen Satz bekommt ein Absendeversuch auf
   `PoolRenameDialog`, wenn der Name **unverändert** ist? Heute gibt es dafür einen Hinweis und
   keinen Tadel, und einen zu erfinden ist keine Umsetzungsfrage.
3. **An den Orchestrator (Nebenbefund 2):** Soll der `CLAUDE.md`-Zusatz zu E-087 um den Satz
   ergänzt werden, daß neben `git grep` ein Lauf über die Quellverzeichnisse gehört, solange
   Quellen unversioniert im Baum liegen?

## Nächster Schritt

1. unit-testers geteilter Fall ist da und grün — **T-207 und T-208 können zusammen zum Review**.
2. Nebenbefund 1 (veraltetes Zitat im Prüffall) an unit-tester geben; eine Zeile, kein Auftrag.
3. O-IF an spec-ux-reviewer mit der Tabelle aus 3.1 als Grundlage; erst nach seinem Urteil bauen.
4. O-IG an visual-qa **mit der Angabe, daß es hier ohne WebKit-Aufsatz nicht geht** — und bis
   dahin die „19 zu 19" im Papier als Chromium-Messung kennzeichnen.
