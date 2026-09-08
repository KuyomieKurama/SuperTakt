# T-158 — Der Hinweis am Fristfeld existiert für eine Vorlesehilfe nicht

**Rolle:** integration-dev **Datum:** 2026-09-05
**Deckung:** `docs/spec.md` A-19.21, A-19.1, A-19.7, Abschnitt 15 · E-074 (Punkt 3 und 4),
E-063 · WCAG SC 1.3.1, SC 3.3.1, SC 3.3.2, SC 4.1.3
**Vorlage:** `.claude/team/reports/T-154-spec-ux-reviewer.md` Abschnitt 3.2 — **V-03**
(blockierend) und **V-04** · Bauart der Ansage aus T-116 **B-5** / T-118

---

## Status

**braucht Review**

Alle geforderten Läufe grün. **Eine Ausnahme, und sie ist fremd:** `pnpm typecheck` bricht in
`apps/web/src/lib/attachmentLabel.ts` ab (`TS6133: 'domainAttachmentLabel' is declared but its
value is never read`) — eine **unverfolgte** Datei in `apps/web/**`, also in der Hoheit von
frontend-dev, die in dieser Welle mit T-157 aktiv besetzt ist. Ich habe sie nicht angefasst und
darf sie nicht anfassen. Mein eigenes Paket übersetzt fehlerfrei, einzeln nachgewiesen (unten
unter „Läufe").

---

## Der neue Wortlaut (V-04) — damit er ohne Suchen wiederzufinden ist

`apps/outlook-addin/src/ui/TaskPane.tsx`, Feld „Frist":

> **„Takt sucht in der E-Mail nicht nach einer Frist — du trägst sie selbst ein. Ein Tag, keine
> Uhrzeit; leer lassen heißt: keine Frist."**

Vorher (vier Aussagen, die tragende an dritter Stelle):

> „Ein Tag, keine Uhrzeit. Optional — leer lassen heißt: keine Frist. Sie wird nicht aus der
> E-Mail übernommen und ändert nichts an Pools, Spalten, Buchungen oder Export."

Drei Abweichungen vom Vorschlag des Prüfers, alle drei benannt:

1. **„du" statt „Sie".** Der Aufgabenbereich duzt durchgehend („du kannst sie eintragen",
   „Das Token findest du in Takt", „Du kannst es erneut versuchen"). „Tragen Sie sie selbst
   ein" stünde zwei Felder über einem „du" — siehe Annahme 1.
2. **„Takt sucht in der E-Mail nicht nach einer Frist" statt „Wird nicht aus der E-Mail
   übernommen".** Grund: Unmittelbar über diesem Feld steht im selben Bereich der Warnkasten
   **„Gefunden, aber nicht übernommen"** (`describeDetection`, Fall `implausible`). „Wird nicht
   übernommen" liest sich in dieser Nachbarschaft als *gefunden und verworfen* — also genau als
   das „nichts gefunden", das der Prüfer in Abschnitt 3.1 als die falsche Deutung benennt. Der
   neue Satz sagt „wurde nicht gesucht", und das ist die Aussage aus E-074 Punkt 4.
3. **„Optional" ist gestrichen**, weil „leer lassen heißt: keine Frist" dasselbe sagt und dabei
   die Folge nennt statt einer Eigenschaft. A-19.1 bleibt damit ausgesprochen; eine Prüfung
   misst es (19d, dritte Zeile).

Der gestrichene Satz „ändert nichts an Pools, Spalten, Buchungen oder Export" bleibt dort
stehen, wo er eine reale Sorge beantwortet: `TodoFormDialog.tsx:227` und
`TodoDetailScreen.tsx:421` in der Hauptanwendung. A-19.7 ist davon unberührt — der Satz ist
keine Anforderung an den Aufgabenbereich, sondern eine Auskunft über Flächen, die es dort nicht
gibt.

---

## Wie viele Felder die Behebung trägt

**Zwölf.** Die Zahl ist gemessen und nicht gezählt: `proof:addin` Abschnitt 19c sammelt jeden
`<Field …>…</Field>`-Block der Oberfläche und prüft ihn einzeln.

| Fläche | Felder | Beschriftungen |
|---|---|---|
| S-12 Aufgabenbereich (`TaskPane.tsx`) | 7 | Call-Nummer, Titel, **Frist**, Tags, Vermerk, Dauer, Leistung |
| S-13 Einstellungen (`SettingsView.tsx`) | 5 | Adresse des lokalen Dienstes, Zugangstoken, Erprobte Muster, Regulärer Ausdruck, Beispieltext |

Vorher: **ein** `aria-describedby` im ganzen Add-in, und das gehörte der Trefferzahl im
Tag-Auswähler. Nachher: jedes der zwölf Felder verweist auf seinen Hinweis, jedes mit einer
Meldung zusätzlich auf sie, und jedes mit einer Meldung trägt `aria-invalid`.

---

## Artefakte

### Neu

| Datei | Was |
|---|---|
| `apps/outlook-addin/src/ui/field.ts` | Die Regel: `fieldParts` (Kennungen, `aria-describedby`, `aria-invalid`, Sichtbarkeit von Hinweis und Meldung) und `withDescription`. Ohne JSX, damit der Nachweispfad sie **laden und ausführen** kann |

### Geändert

| Datei | Was |
|---|---|
| `apps/outlook-addin/src/ui/Primitives.tsx` | `Field` ruft `fieldParts`; `children` ist eine Funktion `(aria) => ReactNode`; der Hinweis bleibt neben der Meldung stehen; die Meldefläche `role="alert"` steht dauerhaft im Baum |
| `apps/outlook-addin/src/ui/TaskPane.tsx` | Sieben Aufrufstellen reichen die Attribute an ihr Bedienelement; **neuer Hinweis am Fristfeld** (V-04) samt Begründung im Quelltext |
| `apps/outlook-addin/src/ui/SettingsView.tsx` | Fünf Aufrufstellen, dieselbe Änderung |
| `apps/outlook-addin/src/ui/TagPicker.tsx` | Nimmt `aria` des Feldes entgegen, statt seine Kennung mit `useId` selbst zu erzeugen; die Trefferzahl tritt über `withDescription` **hinter** den Hinweis |
| `apps/outlook-addin/src/styles/addin.css` | `.field__live:empty` — die leere Meldefläche nimmt keinen Platz und wird **nicht** ausgeblendet |
| `apps/outlook-addin/scripts/proof-addin.mjs` | **Abschnitt 19**, 17 neue Prüfungen (19a bis 19d) |

Nicht angefasst: `apps/web/**`, `apps/desktop/**`, `packages/domain/**`,
`apps/local-api/src/**` außerhalb von `routes/addin/`, `apps/*/test/**`, `tests/e2e/**`. Die
Fachlogik der Frist (`duedate/entry.ts`, `isCalendarDay` aus `@takt/domain`) ist unverändert —
diese Aufgabe war Ansprache und Zugänglichkeit, keine zweite Runde an der Prüfung.

---

## Zusammenfassung

Der Befund V-03 ist **einmal** in `Field` behoben und trägt damit alle zwölf Felder des
Add-ins, so wie der Prüfer es vorgeschlagen hat und ausdrücklich nicht als Sonderfall am
Fristfeld. Die Entscheidung, *welche* Kennungen an ein Bedienelement gehen, steht jetzt als
reine Regel in `ui/field.ts` — ohne JSX, damit `proof:addin` sie über alle vier Fälle laden und
ausführen kann statt sie im Bericht zu behaupten. `Field` nimmt sein Kind seit dieser Aufgabe
als Funktion entgegen und reicht ihm `id`, `aria-describedby` und `aria-invalid`; ein
`cloneElement` auf „das erste Kind, das wie ein Feld aussieht" hätte bei drei der zwölf Felder
falsch geraten (Tag-Auswähler mit drei Ladezuständen, Dauerfeld mit Knopfreihe, Tokenfeld mit
Knopf daneben). Der Hinweis verschwindet nicht mehr, sobald eine Meldung danebentritt, und die
Meldefläche steht dauerhaft im Baum — dieselbe Bauart und derselbe Grund wie bei B-5 aus T-116,
gebaut in T-118: Eine Live-Region, die erst mit ihrem Inhalt entsteht, kennt die Vorlesehilfe
im Augenblick der Änderung noch nicht. V-04 ist umgesetzt, mit drei benannten Abweichungen vom
Wortlaut des Prüfers, von denen die zweite die wichtigste ist.

---

## Nachweis

### 1. Die Regel, ausgeführt (`proof:addin` 19a)

Sieben Prüfungen über alle vier Zustände eines Feldes. Der Kern:

```
ok    V-03: beides zugleich — die Meldung tritt neben die Erklärung, nicht an ihre Stelle
      aria-describedby === 'due-hint due-error'   (Hinweis zuerst, wie in der Anzeige)
      aria-invalid === true
      showHint === true                            ← der Befund: vorher false
```

Dazu: leerer Text ist kein Text (kein Verweis auf einen leeren Absatz, keine Beanstandung ohne
Grund), die Kennungen hängen am Feld und nicht an einer zweiten Zählung, und
`withDescription` hängt die Zeile des Tag-Auswählers an, ohne die Kennung zu verlieren.

### 2. Das gezeichnete Ergebnis, nicht die Absicht

`Field` gegen `react-dom/server`, alle vier Fälle (Wegwerf-Bündel **außerhalb** des Bestands, im
Kratzverzeichnis der Sitzung; kein Playwright, kein Entwicklungsserver, keine Datei im
Repository):

```
ohne alles   <input id="due" type="date"/>
             <div class="field__live" role="alert"></div>

nur Hinweis  <input id="due" aria-describedby="due-hint" type="date"/>
             <p class="field__hint" id="due-hint">…</p>

nur Fehler   <input id="due" aria-describedby="due-error" aria-invalid="true" type="date"/>
             <div class="field__live" role="alert"><p class="field__error" id="due-error">…</p></div>

beides       <input id="due" aria-describedby="due-hint due-error" aria-invalid="true" type="date"/>
             <p class="field__hint" id="due-hint">…</p>
             <div class="field__live" role="alert"><p class="field__error" id="due-error">…</p></div>
```

Die vierte Zeile ist der Befund, in Zeichen: Hinweis **und** Fehler stehen beide im Verweis, und
der Hinweis steht weiter da.

### 3. Das Tag-Feld — eine Beschriftung, die vorher niemanden beschriftete

Dieselbe Messung über `Field` + `TagPicker`:

```
<label class="field__label" for="tags">Tags</label>
<input id="tags" aria-describedby="tags-hint tags-count" class="input input--search" …>
<p class="tagpicker__count" id="tags-count">1 Tags</p>
<p class="field__hint" id="tags-hint">…</p>
```

Vorher trug das Suchfeld eine mit `useId` erzeugte Kennung; `<label for="tags">` verwies damit
auf ein Element, **das es nicht gab**, und der Hinweis des Feldes stand für eine Vorlesehilfe
nirgends. Das war derselbe Befund wie am Fristfeld, nur eine Stelle weiter — er ist mit
behoben, weil dieselbe Behebung ihn trägt.

### 4. Gegenprobe: die Prüfungen können rot werden

Vier Rückbauten zugleich (alte Hinweisbedingung, `role="alert"` entfernt, `{...aria}` am
Fristfeld durch `id="due"` ersetzt, alter Wortlaut zurück) — **sechs** Prüfungen wurden rot,
und jede nennt die Stelle:

```
FEHL  V-03: der Hinweis hängt nicht mehr am Fehlen einer Meldung
FEHL  SC 4.1.3: die Meldefläche steht immer im Baum, auch leer
FEHL  V-03: alle 12 Felder des Add-ins reichen ihre Attribute weiter   → ['ui/TaskPane.tsx: Frist']
FEHL  kein Bedienelement führt seine Kennung daneben noch einmal       → ['ui/TaskPane.tsx: Frist']
FEHL  V-04: der Hinweis am Fristfeld nennt die Abwesenheit — und zwar zuerst
FEHL  V-04: der Fülltext der Hauptanwendung steht nicht mehr im Aufgabenbereich
```

Danach zurückgebaut und wieder 204/0.

### Läufe

| Befehl | Ergebnis |
|---|---|
| `pnpm --filter @takt/outlook-addin typecheck` | **grün** |
| `tsc -p apps/outlook-addin/tsconfig.test.json` | **grün** |
| `pnpm typecheck` | **rot in fremder Hoheit** — `apps/web/src/lib/attachmentLabel.ts` TS6133, unverfolgte Datei aus T-157 |
| `pnpm test` | **69 Dateien, 1359 Prüfungen, alle grün** |
| `pnpm run proof:addin` | **204 bestanden, 0 fehlgeschlagen** (vorher 187; +17 in Abschnitt 19) |
| `pnpm run proof:addin-wiring` | 32/0 |
| `pnpm run proof:taskpane` | 25/0 |
| `pnpm run proof:codepoints` | 45/0 |
| `pnpm --filter @takt/outlook-addin build` | **grün**, 70 Module, 240 kB |

Kein Playwright, kein Entwicklungsserver — wie beauftragt.

---

## Annahmen

1. **„du" statt „Sie" im Hinweissatz.** Der Prüfer hat „tragen Sie sie selbst ein"
   vorgeschlagen; der Aufgabenbereich duzt an vier anderen Stellen. Ich habe die Anrede der
   Fläche behalten und die Aussage übernommen. Wenn das falsch ist, ist es eine Zeile.
2. **„Takt sucht … nicht" statt „wird nicht übernommen"** — Begründung oben, Punkt 2. Das ist
   die einzige inhaltliche Abweichung vom Vorschlag, und sie zielt auf dieselbe Aussage.
3. **Render-Funktion statt `cloneElement`.** `Field` verlangt sein Kind jetzt als Funktion. Das
   ist der sichtbarere Eingriff (zwölf Aufrufstellen), aber der ehrlichere: `cloneElement`
   hätte bei drei Feldern das falsche Element getroffen und wäre stillschweigend wirkungslos
   geblieben — genau die Sorte Behebung, die den Befund ein zweites Mal erzeugt.
4. **`role="alert"` und nicht `role="status"`.** T-118 hat für die Absage des Dienstes im
   Bestätigungsdialog `status` gewählt. Eine Feldmeldung ist eine Absage an eine gerade
   getätigte Eingabe; das Add-in trug dort schon vorher `alert`, und ich habe die Stufe nicht
   gesenkt. Übernommen ist die **Bauart** (dauerhafte, anfangs leere Region), nicht die Rolle.
5. **Die Kennung des Tag-Suchfeldes ist jetzt `tags`** und nicht mehr `useId`. Das behebt eine
   dangling `label for`-Beziehung, die niemand als Befund geführt hat, aber dieselbe Klasse ist.
   In den Zuständen „lädt" und „nicht verbunden" gibt es weiterhin kein Bedienelement, auf das
   die Beschriftung zeigen könnte — dort ist das Feld eine Ladefläche, kein Feld.
6. **Der Abstand der leeren Meldefläche** wird über `margin-block-start: calc(-1 * var(--space-1))`
   zurückgenommen und nicht über `display: none`. Letzteres nähme die Region aus dem Baum und
   damit die ganze Wirkung. Gemessen habe ich das nicht im Browser, sondern abgeleitet: `.field`
   ist eine Flexspalte mit `gap: var(--space-1)`, die Meldefläche ist ihr letztes Kind, und leer
   hat sie die Höhe null. Eine Sichtprüfung im Aufgabenbereich gehört zu visual-qa.

---

## Risiken

1. **Kein Sicherheitsrisiko.** Es entstehen keine neuen Datenwege, keine neuen Eingaben, keine
   neue Adresse und kein neues Feld an einer Tür. Der einzige geänderte Text ist ein Hinweis;
   die einzigen neuen Attribute sind `id`, `aria-describedby` und `aria-invalid`.
2. **Der Wortlaut ist eine Produktaussage.** Der Prüfer hat den Satz beanstandet, ich habe ihn
   gesetzt — die dritte Stimme fehlt. Er steht deshalb oben in diesem Bericht ausgeschrieben.
3. **Zwölf Aufrufstellen sind zwölf Gelegenheiten zu vergessen.** Die dreizehnte wird nicht
   vergessen: Der Übersetzer verlangt eine Funktion als Kind, und `proof:addin` 19c prüft je
   Block, dass die Attribute auch **ankommen**. Ein Feld, das sie liegen lässt, wird namentlich
   rot.
4. **Keine echten Call-Nummern, keine Kundennamen, keine Zugangsdaten** in Code, Prüfdaten oder
   diesem Bericht. Die Beispielwerte im neuen Abschnitt sind Feldnamen (`due`, `tags`, `call`)
   und erfundene Sätze.
5. **Ein Rest, den ich nicht messen kann:** dass Outlook/WebView2 die Region tatsächlich ansagt.
   Das ist dieselbe Grenze, die im Kopf von `proof-addin.mjs` schon steht — alles, was Outlook
   selbst tut, gehört auf einen Windows-Rechner mit Outlook und einer Vorlesehilfe.

---

## Offene Fragen an den Orchestrator

1. **`pnpm typecheck` ist wegen einer fremden, unverfolgten Datei rot**
   (`apps/web/src/lib/attachmentLabel.ts`, TS6133). Sie gehört frontend-dev und wird in dieser
   Welle bearbeitet. Ich melde es und fasse es nicht an. Wenn die Freigabe dieser Aufgabe an
   einem grünen Gesamtlauf hängt, muss T-157 zuerst landen.
2. **Trägt die Hauptanwendung dieselbe Behebung?** `FormDialog.tsx#TextField` in `apps/web`
   führt `aria-describedby` und `aria-invalid` bereits richtig (dieselbe Reihenfolge, Hinweis
   bleibt stehen) — die **Ansage** fehlt dort aber: Der Fehlerabsatz trägt keine Live-Region,
   also gilt für ihn genau der Befund aus B-5. Das ist fremde Hoheit und keine Zeile dieser
   Aufgabe; ich lege es vor, statt es zu übergehen.
3. **V-09 (Abwesenheitsnachweis über `apps/outlook-addin/dist`)** liegt in meiner Hoheit und ist
   nicht Teil dieses Auftrags. Ich schlage vor, ihn mit V-08 und V-11 in einer Nachlese zu
   bauen — alle drei sind Add-in und alle drei sind klein.
4. **Der Wortlaut aus V-04** ist oben ausgeschrieben. Wenn spec-ux-reviewer die zweite
   Abweichung („Takt sucht … nicht") nicht mitträgt, ist der Rückweg eine Zeile in
   `TaskPane.tsx` — die Prüfung in 19d misst die **Stellung** der Aussage und nicht ihren
   Wortlaut, bleibt also grün.

---

## Nächster Schritt

**spec-ux-reviewer legt V-03 und V-04 wieder vor**, mit den drei Messungen oben als Vorlage:
die ausgeführte Regel (19a), das gezeichnete Ergebnis in Zeichen, und die Gegenprobe. Danach
V-08, V-09 und V-11 als eine gemeinsame Add-in-Nachlese in meiner Hoheit — es sind drei kleine
Stellen, und der Aufgabenbereich ist damit für Abschnitt 19 vollständig abgeräumt.
