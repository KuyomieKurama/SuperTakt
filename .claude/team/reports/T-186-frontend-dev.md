# T-186 — Eine stumme Meldefläche, ein Tadel vor dem ersten Zeichen, ein Kommentar der etwas anderes beschreibt, und ein Wächter der mehr versprach als er maß

**Rolle:** frontend-dev **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `.claude/team/reports/T-184-spec-ux-reviewer.md` (P-8, P-9, Z-19a/b, Z-20, Z-31),
`docs/bedrohungsmodell.md` Abschnitt 24 (A-A-39, T-183-3, T-183-4), `.claude/team/decisions.md`
(E-063, E-083, E-084, E-087), `CLAUDE.md` Abschnitt „Text streichen und umbenennen",
`.claude/team/reports/T-175-frontend-dev.md` (Meßverfahren im Browser),
`apps/outlook-addin/src/ui/field.ts` und `apps/web/src/components/FormDialog.tsx#TextField`
(die richtige Bauart der Meldefläche).

---

## Kurzfassung

```
Aufgabe: T-186 — O-FX, O-FY, O-GI, O-GN
Status: fertig (mit einem offenen Punkt, den ich nicht selbst entscheiden darf: Abschnitt 7.1)
```

Alle vier Befunde sind behoben und gemessen. **Ein Ergebnis der Messung wiegt schwer genug, um
oben zu stehen:** P-8, wörtlich umgesetzt, nimmt dem Bestätigungsdialog mit Pflichtbegründung den
Weg zurück, den Z-16 für ihn erkämpft hat. Wer den Dialog öffnet und sofort auf den gesperrten
„Bestätigen"-Knopf drückt, sieht wieder einen toten Knopf ohne Satz. Das ist die von P-9
vorgesehene Folge — P-9 verlangt an dieser Stelle einen **Hinweis** statt einer Meldung, und
T-184 verlangt diesen Hinweis in dieser Welle ausdrücklich **nicht**. Ich habe die Regel gebaut,
wie sie dasteht, und den Preis gemessen statt ihn zu verschweigen.

---

## 1. O-FX — die Meldefläche des Notizfeldes (blockierend, behoben)

### Was falsch war

`NoteField.tsx` baute sein `role="alert"` **zusammen** mit dem Inhalt:

```tsx
{error !== undefined ? (
  <p className="note__error" id={errorId} role="alert"> … </p>
) : null}
```

Das ist O-DA/B-5, dreimal im Bestand behoben und begründet (`TextField` T-162, `ConfirmDialog`
T-118 und T-175, Add-in T-158). `NoteField` war der eine Baustein, den T-162 nicht erreicht hat —
und er steht an **jeder** Fläche, an der der Leistungstext entsteht, der in die Abrechnung geht.

### Was jetzt dasteht

Dieselben vier Zeilen wie in `ConfirmDialog.tsx:230` und `FormDialog.tsx:369`: ein `div` mit
`role="alert"`, das **immer** im Baum steht, mit dem `<p>` darin als Inhalt. Kein neuer Text,
keine neue Klasse am Meldeabsatz, kein neuer zugänglicher Name. Der Wortlaut jeder Meldung ist
zeichengleich geblieben.

`components.css` bekommt **keine** Regel für den Behälter, sondern einen Kommentar, der sagt,
warum er keine braucht: `.note__frame` ist ein gewöhnlicher Block ohne `gap`, der leere Behälter
hat die Höhe null, und der Abstand hängt an `.note__error` selbst. Der Kommentar sagt außerdem,
was man ihm **nicht** geben darf (`display: none`) — das ist der Fehler, den `.field__live:empty`
in `app.css` an derselben Stelle abfängt.

### „Zieh beide nach" — die Musterseite

Die Musterseite hat **keine** eigene Bauart: `NotesSection.tsx:129-136` zeichnet den
Fehlerzustand über denselben `NoteField`. Mit der Behebung am Baustein führt sie ab sofort die
richtige Bauart vor. Gemessen habe ich das nicht am Quelltext, sondern im Browser (Abschnitt 6.3):
ein Knoten, leer, Höhe 0 px, und **derselbe** Knoten trägt danach den Text.

**Nicht angefaßt: `NoteField.required`** (Z-19a). Sie zu entfernen nähme der Musterseite den
sichtbaren Stern und den verborgenen Zusatz „ (Pflichtfeld)" — also einen zugänglichen Namen, und
damit fällt sie unter E-087 und unter die Vorlagepflicht bei spec-ux-reviewer **und**
security-checker (E-034/SP-08 berühren die Abrechnungsseite). Der Auftrag sagt für diese Welle
„keinen weiteren Oberflächentext streichen". Die E-087-Messung dazu steht in Abschnitt 5, damit
der nächste Auftrag sie nicht neu erheben muß.

### Die Frage aus dem Auftrag: läßt sich dieser Defekt messbar machen?

Ja, und zwar auf demselben Weg, den `tests/e2e/field-live-region-announcement.spec.ts` für
`TextField` schon geht — der Prüffall dort ist der Bauplan:

1. **Zustand vorher messen, nicht nur nachher.** `toHaveCount(1)` **und** `toBeEmpty()` auf
   `[role="alert"]`, bevor irgendetwas geschieht. Genau diese zwei Zeilen unterscheiden „die
   Fläche steht da" von „die Fläche entsteht".
2. **Den Knoten markieren** (`setAttribute('data-e2e-marker', …)`) und nach dem Fehler
   **denselben** Knoten wiederfinden. Ohne die Marke ist „irgendwo ist ein `role=alert` mit dem
   Text" nicht von „derselbe Knoten hat jetzt einen Text" zu unterscheiden — und nur das zweite
   wird angesagt.

Das ist heute e2e-Arbeit und nicht Einheitsarbeit: `jsdom` bildet die Baumidentität ab, aber die
Aussage „eine Vorlesehilfe kennt diese Region schon" ist eine über den Browser.

**Ein billigerer Weg daneben, und er würde die Klasse treffen statt des Einzelfalls:** ein
Wächter über den Quelltext, wie es `proof:foreign` für die Herkunft tut. Die Regel ließe sich
ohne Namensliste formulieren — *ein JSX-Element mit `role="alert"` oder `role="status"` darf
nicht innerhalb eines Bedingungsausdrucks stehen, dessen Zweig es erzeugt*. Am heutigen Baum
fände so ein Lauf vier Stellen: die drei aus Abschnitt 7.3 und — vor dieser Aufgabe —
`NoteField`. Ein Prüffall je Baustein findet den Baustein; ein solcher Lauf fände den **nächsten**
Baustein, den jemand baut. Ich habe ihn nicht gebaut (Umfang, und die Entscheidung über die
Ausnahmen gehört nicht mir), aber er ist die Antwort auf „fünf Prüfläufe sehen diesen Defekt
nicht".

---

## 2. O-FY — die Auslösung nach P-8 (blockierend, behoben)

### Die Regel steht an einem Ort

Neu: **`apps/web/src/lib/touched.ts`**, eine Funktion ohne JSX.

```ts
export function touchedOnBlur(value: DraftText, valueAtOpen: DraftText): boolean {
  return value !== valueAtOpen || value.length > 0;
}
```

Das ist die Umsetzung, die P-8 **wörtlich** vorschreibt („nur, wenn der Wert sich seit dem Öffnen
geändert hat oder nicht leer ist"). Sie steht an einem Ort und nicht neunmal in einem `onBlur`,
aus demselben Grund, aus dem `movement.ts` den Bewegungssatz an einem Ort hält: Neun Abschriften
sind neun Gelegenheiten, die zehnte anders zu schreiben — und die Abweichung wäre **still**, weil
sich beide Fassungen gleich verhalten, solange jemand tippt.

Als Funktion ohne JSX ist die Regel außerdem prüfbar, ohne einen Dialog zu zeichnen. `apps/web/test`
gehört unit-tester; ich habe dort nichts geschrieben. **Vorschlag an ihn:** vier Fälle —
(leer, leer) → false; („ ", leer) → true; („Kunden Nord", „Kunden Nord") → false;
(leer, „Kunden Nord") → true.

`DraftText` und nicht `string`: `proof:foreign` Abschnitt 4 hat die erste Fassung sofort rot
gemacht, und zu Recht — beim Umbenennen kommt der Anfangswert aus dem Bestand. `DraftText` ist der
eine erklärte Ausstieg aus der Herkunft (E-063 Punkt 1), und der Wert **ist** ab hier der Entwurf
des Benutzers im Eingabefeld. Der Ausstieg steht damit im Typ und nicht in einem Kommentar.

### Neun Auslöser, alle nachgezogen

| Datei | Stellen | Wert beim Öffnen |
|---|---|---|
| `TagsScreen.tsx` | 3 (Tag, Ordner, Umbenennen) | neuer Zustand `nameAtOpen`, gesetzt im **einen** Einstieg `beginNaming` |
| `PoolFormDialog.tsx` | 1 | `pool?.name ?? ""` — derselbe Ausdruck, den der Effekt setzt |
| `StatusSettings.tsx` | 1 | `status?.name ?? ""` — ebenso |
| `TemplatesScreen.tsx` | 1 | neuer Zustand `copyNameAtOpen` |
| `Attachments.tsx` | 2 (Verweis, Bild/Datei) | `""` — der Dialog beginnt leer, und der Wechsel der Art leert das Feld |
| `ConfirmDialog.tsx` | 1 | `""` — jede Antwort fängt leer an |

`grep -rn "onBlur=" apps/web/src` zählt zwölf Stellen; die übrigen drei sind die Fokusrückholung in
`DialogSurface`, der Nachlauf der globalen Suche und `badInput` in `TextField` — keine
Pflichtmeldung.

**Wo der Wert beim Öffnen ein reiner Ausdruck aus den Eigenschaften ist, steht kein zweiter
Zustand daneben** (`pool?.name ?? ""`). Zwei Orte für dieselbe Zeichenkette wären zwei Orte, an
denen sie auseinanderlaufen kann — und der zweite wäre der, den beim nächsten Umbau jemand
vergißt.

**Nebenher, weil es beim Nachziehen sonst eine dritte Abschrift geworden wäre:**
`TemplatesScreen` hatte die drei Setzungen für den Kopierdialog zweimal wortgleich nebeneinander,
den Vorschlagstext `Kopie von …` eingeschlossen. Sie laufen jetzt über **einen** Einstieg
`beginCopy`, wie `beginNaming` in `TagsScreen`.

**Ein Absendeversuch setzt `touched` weiterhin unbedingt** — `TodoFormDialog.tsx:95` und
`BookingDialogs.tsx` (`attempted`) sind unverändert. Das ist die zweite Hälfte von P-8, und sie
war schon richtig.

### P-9 ist **nicht** gebaut, und das ist eine Entscheidung des Auftrags, nicht meine

P-9 verlangt bei einem von Anfang an gesperrten Knopf den Grund als zustandsgebundenen **Hinweis**
neben dem Feld. Zehn Dialoge nachträglich damit auszustatten ist laut T-184 „eine eigene Aufgabe
mit eigener Vorlage bei ui-designer; ich verlange sie hier nicht." Ich habe sie nicht gebaut.
**Was das gemessen kostet, steht in Abschnitt 6.2 und als offener Punkt in 7.1.**

---

## 3. O-GI — der Kommentar in `TodoListScreen` (blockierend, behoben)

Der Kommentar behauptete „Zwei Saetze statt drei (T-181, ST-07 und Regel S-13): … unsere eigene
Auskunft schrumpft auf einen." Nachgerechnet an `withMovement` (`lib/movement.ts:101-103`) trifft
das auf **keinen** Zustand zu: `unchanged` steht in beiden Fassungen, es sind zwei eigene Sätze
plus Bewegungssatz — vorher wie nachher. Was ST-07 wirklich getan hat, steht im Diff: aus „Es
verschwindet damit aus dieser Liste, solange erledigte ausgeblendet sind." wurde „Aus dieser Liste
ausgeblendet.", 46 Zeichen kürzer, **ein** Satz weniger nicht.

**Der Kommentar ist ersatzlos entfallen** — der Auftrag nennt das ausdrücklich die bessere Antwort,
und sie ist es hier:

1. Was er sagte, war falsch. Was er hätte sagen sollen („der erste Satz ist seit T-181 kürzer")
   ist Verlaufsgeschichte und steht im Verlauf.
2. Er stand **innerhalb** eines Bedingungsausdrucks und zerriß eine Zeile in fünf.
3. Der Absatz zwölf Zeilen darüber trägt die Begründung des ganzen Zweiges schon: „Meldet er
   keine Bewegung, bleibt es bei der Auskunft über **diese Liste**, denn die hängt an der
   Ansichtseinstellung und nicht an einer Regel."

Der Ausdruck selbst ist **zeichengleich** geblieben; nur der Kommentar fiel, und die drei Zeilen
sind zu einer geworden. **UM-07 bleibt offen und ist von hier aus wieder sichtbar** — kein
Kommentar behauptet mehr, S-13 sei an dieser Stelle erfüllt.

---

## 4. O-GN — `proof:foreign` mißt jetzt, was es versprach (behoben, mit Gegenprobe)

### 4.1 Was A-A-39 verlangt und was gebaut ist

| A-A-39 | Stand |
|---|---|
| Erste Hälfte, Teil 1: eine Zusicherung `as`, die einen fremden Wert auf einen Texttyp **ohne** Marke bringt | **gebaut** — Abschnitt 7, erste Prüfung |
| Erste Hälfte, Teil 2: ein fremder Wert als Argument einer Funktion mit Textparameter ohne Marke, **auch wenn die Funktion nicht die eigene ist** | **teilweise** — die Ablage in eine Reihe ist gebaut, der allgemeine Fall nicht. Begründung mit Zahl unten |
| Zweite Hälfte: der Lauf fragt `ts.getPreEmitDiagnostics` und wird rot, wenn das Programm nicht fehlerfrei übersetzt | **gebaut** — Abschnitt 7, dritte Prüfung |
| Drei Gegenproben, im Arbeitsspeicher, `apps/web/src` unangetastet | **gebaut** — Abschnitt 8, `CompilerHost` mit überlagerter Datei |

Der Lauf steht danach bei **20 bestanden, 0 fehlgeschlagen** (vorher 14/0), davon drei
Gegenproben.

### 4.2 Warum der allgemeine Parameterfall nicht gebaut ist — gemessen, nicht vermutet

Wörtlich gebaut ergibt „fremder Wert an eine fremde Funktion mit Textparameter" am heutigen Baum
**27** Fundstellen. Keine davon ist eine Anzeige:

```
lib/attachmentLabel.ts:239  RUNS_WHEN_OPENED.includes(… extensionOf(path) …)
components/TagInput.tsx:184 a.info.tag.name.localeCompare(… b.info.tag.name …)
lib/exportTemplateModel.ts:492  byName.has(… field.name …)
screens/PoolFormDialog.tsx:308  setName(… pool?.name ?? "" …)
lib/foreign.ts:45           visibleText(… name …)              <- die Behandlung selbst
screens/TemplatesScreen.tsx:504  dropHiddenCharacters(… template.name …)   <- ebenso
```

Ein Wächter, der `visibleText` und `dropHiddenCharacters` als Herkunftsverlust meldet, ist kein
Wächter. Die Frage „legt dieser Aufruf ab oder fragt er nur" beantwortet kein Typ; sie bräuchte
ein Modell der Senken, und das ist der Umbau, den der Auftrag ausgenommen hat („behebe, was ohne
Umbau geht").

Gebaut ist deshalb der Teil, der ohne Modell auskommt und den A-A-39 als Gegenprobe **beim Namen
nennt**: die **Ablage in eine Sammlung**, deren Elementart Text ohne Marke ist —
`teile.push(todo.title)` mit `teile: string[]`. Gefragt wird die Elementart des **Empfängers**,
nicht der Name der Methode (eine Methodenliste wäre die abgeschriebene Aufzählung aus E-063
Punkt 4). Ausgenommen ist, was eine **Frage** stellt statt abzulegen, erkennbar am Wahrheitswert
als Antwort (`includes`, `some`). Das ist eine Heuristik und steht als solche im Quelltext.

**Sammlungen mit Schlüssel (`Map`, `Set`) sind nicht erfaßt.** Dieselbe Prüfung auf sie ausgedehnt
ergibt sechs Treffer, jeder eine eigene Frage (`map.set(status.id, status.name)` —
`Map<Id, ForeignText>` oder `Map<Id, string>`?). Sechs Entscheidungen sind kein Nebenbei; sie
stehen in Abschnitt 7.2 als offener Punkt.

### 4.3 Die Gegenprobe, und daß sie nicht blind ist

Drei Kunstquellen, jede in einem eigenen Programm, jede unter einem Pfad, den es nicht gibt
(`src/lib/eingesetzt.ts`), untergeschoben über einen `CompilerHost` — die Bauart aus
`proof:callers` und `proof-release-safety.mjs`. `apps/web/src` ist dafür nicht angefaßt worden.

Je ein eigenes Programm, weil die dritte Quelle **nicht übersetzt**: In einem gemeinsamen
Programm stünde neben jedem Fund ein Typfehler, und dann wäre nicht mehr zu unterscheiden, ob die
Prüfung den Verstoß gesehen oder ihn geraten hat.

Die Gegenprobe fragt nicht `found.length > 0`, sondern ob der Fund **aus der eingesetzten Quelle**
stammt. Ein Fund aus dem Bestand wäre kein Beleg dafür, daß die Prüfung die Verletzung sieht — er
wäre der Beleg dafür, daß der Bestand rot ist.

**Verstümmelungsprobe, gefahren, jede einzeln:**

| Verstümmelung | Ergebnis |
|---|---|
| `isTextType(to)` in der `as`-Prüfung auf `false` gezwungen | Gegenprobe 1 **blind**, 2 und 3 grün → Lauf rot |
| `isArray` in der Ablageprüfung auf `false` gezwungen | Gegenprobe 2 **blind**, 1 und 3 grün → Lauf rot |
| `getPreEmitDiagnostics` durch eine leere Reihe ersetzt | Gegenprobe 3 **blind**, 1 und 2 grün → Lauf rot |

Jede Verstümmelung trifft **genau ihre** Gegenprobe. Das ist die Aussage, die A-A-39 verlangt.

### 4.4 Ein Umbau am Rande, und warum er nötig war

Die Fragen, die einen Typprüfer brauchen, standen unmittelbar am **einen** Programm des Laufs. Die
Gegenproben brauchen dieselben Fragen an einem **zweiten**. Sie liegen jetzt in `lensFor(program)`
und werden für den Bestand einmal ausgepackt; der Rest der Datei ist unverändert. Die Alternative
wäre eine zweite Abschrift von „kommt aus diesem Ausdruck fremder Text" gewesen — in genau der
Datei, die das Abschreiben von Herkunftswissen für den Ursprung allen Übels hält.

Der Kopf der Datei ist nachgezogen: die neuen Abschnitte stehen unter „Er sieht", der nicht
gebaute Parameterfall unter „Er sieht nicht" — **mit der Zahl 27 daneben**, damit die nächste
Prüfung sie nicht für eine Vermutung hält (E-087 Punkt 2).

---

## 5. E-087 — der heutige Wortlaut in den Prüffällen

Ich habe **keinen** Oberflächentext und **keinen** zugänglichen Namen geändert. Gesucht habe ich
trotzdem, weil E-087 die Messung an den Auftrag bindet und der nächste Auftrag sie sonst neu
erheben muß. Gesucht in `tests/**` und `apps/*/test/**`, heute:

| Zeichenkette | Treffer |
|---|---|
| `Name fehlt.` | **0** |
| `Name der Kopie fehlt.` | **0** |
| `Begründung fehlt.` | **0** |
| `lässt sich der Anhang nicht öffnen` | **0** |
| `Aus dieser Liste ausgeblendet.` | **0** |
| `Der Status bleibt unverändert.` | **0** |
| `note__error`, `note__live`, `field__live` | **0** |
| `Pflichtfeld` (für Z-19a, den **nächsten** Auftrag) | **3**, alle in Kommentaren: `field-live-region-announcement.spec.ts:55`, `attachment-crud.spec.ts:14`, `poolRule.test.ts:37` — kein Textvergleich |
| `NoteField` | **0** |

**Zwei Prüffälle messen `role="alert"`, und beide habe ich gegen die Bauartänderung gehalten:**

- `field-live-region-announcement.spec.ts` — mißt `TextField` im `TodoFormDialog`. Der hat
  **keinen** `onBlur`; seine Meldung kommt beim Absendeversuch, und P-8 rührt sie nicht an. Der
  Prüffall bleibt gültig.
- `export-audit-and-locks.spec.ts:151` — `history.locator('[role="alert"]')` mit
  `toHaveCount(0)`. `history` ist der Dialog „Verlauf dieser Buchung"; er enthält kein
  `NoteField`. Die neue, immer stehende Fläche taucht dort nicht auf. **Fahren konnte ich es
  nicht** (E-083, fester Port) — an e2e-tester als Hinweis, nicht als Auflage.

---

## 6. Meßprotokoll (Chromium, 1280×720, `de-DE`, `Europe/Berlin`)

Gemessen gegen `vite dev` auf **Port 5199** — nicht 5173, nicht 4173, nicht 17843, damit in dieser
Welle niemand über einen Port stolpert (E-083). Der lokale Dienst lief **nicht**. Prüfstand und
Meßskript waren Wegwerfdateien (`apps/web/pruefstand.html`, `src/pruefstand.tsx`,
`scripts/.messung-t186.mjs`); sie sind **gelöscht**, `git status` ist sauber. Der Prüfstand
zeichnete die **echten** Bausteine (`FormDialog` + `TextField`, `ConfirmDialog`, `NoteField`) mit
der **echten** Regel `touchedOnBlur` und der Verdrahtung der Aufrufstellen.

### 6.1 P-8 am Namensfeld

```
== leeres Pflichtfeld, frisch geoeffneter Dialog ==
Fokus beim Oeffnen:                 input (erstes Feld)
role=alert Knoten:                  2        (zwei Felder, zwei Flaechen)
Inhalt vor jeder Handlung:          ""
Inhalt nach einem Tabulator:        ""        <- P-8, der behobene Befund
nach "A" + Tabulator:               ""        (beruehrt, aber nicht leer)
nach Loeschen + Tabulator:          "Name fehlt."
nach " " + Tabulator:               "Name fehlt."
Anlegen gesperrt:                   true

== vorbelegtes Feld (Umbenennen) ==
Wert beim Oeffnen:                  "Kunden Nord"
unveraendert + Tabulator:           ""        <- P-8
geleert + Tabulator:                "Name fehlt."
```

Der Tadel vor dem ersten Zeichen ist weg. Die Meldung ist **erreichbar** geblieben: sobald das
Feld einmal mit Inhalt verlassen wurde, bleibt `touched` stehen, und das spätere Leeren zeigt sie.
Ein Leerzeichen ist eine Eingabe und wird als solche behandelt.

### 6.2 P-8 am Bestätigungsdialog — hier steht der Preis

```
role=alert Knoten:                  1
durchquert + Tabulator:             ""                    <- P-8
Bestaetigen gesperrt:               true
nach Klick auf gesperrt:            ""                    <- der Preis
nach "x" + Loeschen + Tab:          ""                    (kein Verlassen dazwischen)
nach "weil" + Tab:                  ""   Knopf frei:  false
danach geleert + Tab:               "Begründung fehlt."
frisch: "  " + Tab:                 "Begründung fehlt."
```

**Die dritte und die vierte Zeile sind der Befund.** Wer den Dialog öffnet und ohne zu tippen auf
„Bestätigen" drückt, bekommt keinen Satz — der Klick auf den gesperrten Knopf nimmt dem Feld zwar
den Fokus, aber P-8 macht aus diesem `blur` keine Berührung. Das ist genau der Zustand, den Z-16
als „ein toter Knopf ohne Satz, und das in dem einen Fluß, hinter dem Geld liegt" gemeldet hat.

Die Meldung ist nicht unerreichbar — Leerzeichen tippen, oder tippen, verlassen und wieder leeren
—, aber der geradeste Weg dorthin führt jetzt an ihr vorbei. Die Antwort darauf ist P-9, und P-9
ist in dieser Welle ausdrücklich nicht bestellt. Der Quelltext sagt das an Ort und Stelle
(`ConfirmDialog.tsx`, Kopf von `reasonTouched`), damit der nächste Leser es nicht für ein
Versehen hält.

### 6.3 O-FX am Notizfeld

```
role=alert Knoten vorher:           1
Inhalt vorher:                      ""
Hoehe der leeren Flaeche:           0 px
role=alert Knoten nachher:          1        (kein zweiter entsteht)
derselbe markierte Knoten traegt:   "Leistung fehlt."
aria-describedby zeigt darauf:      true
aria-invalid am Feld:               true
```

Ein Knoten, von Anfang an da, ohne Platzbedarf, und die Meldung ist eine **Änderung** an ihm —
nicht sein Entstehen. Das ist die ganze Aussage von O-DA.

---

## 7. Offene Punkte

### 7.1 An spec-ux-reviewer, und er ist der einzige, der drängt

**Der Bestätigungsdialog mit Pflichtbegründung ist nach P-8 wieder „gesperrt und stumm", wenn
niemand tippt** (6.2). P-9 sieht dafür den Hinweis vor; T-184 verlangt ihn nicht in dieser Welle.
Ich brauche eine von zwei Antworten:

1. **So bleiben** bis zur P-9-Aufgabe — dann ist Z-16 für die Dauer dieser Lücke wieder offen und
   gehört als solcher geführt, nicht als erledigt.
2. **Der Bestätigungsdialog bekommt seinen P-9-Hinweis vorgezogen**, allein und ohne die anderen
   neun. Er ist der eine Dialog, hinter dem Geld liegt (E-012, R-10), und der einzige, dessen
   Pflichtfeld gar nicht in einem `<form>` steht. Das wäre ein Satz, eine Vorlage bei ux-designer
   und ui-designer, keine halbe Stunde Arbeit.

Ich habe **nicht** entschieden, weil beides eine Textentscheidung ist und der Auftrag für diese
Welle „keinen weiteren Oberflächentext" sagt.

**Zweitens, kleiner:** P-8s Umsetzung nennt „geändert **oder** nicht leer". Wer tippt und **ohne
zwischenzeitliches Verlassen** wieder löscht, steht danach auf dem Anfangswert und gilt als
unberührt (6.2, Zeile 5). Gemessen ist das ein enger Fall — jedes Verlassen mit Inhalt macht
`touched` dauerhaft wahr. Ich habe die Umsetzung gebaut, wie sie dasteht, statt sie um „ein
`onChange` ist auch eine Eingabe" zu erweitern. Wenn P-8 das mitmeinen soll, ist es eine Zeile in
`lib/touched.ts` und keine an den neun Aufrufstellen.

### 7.2 An den Orchestrator — drei Funde neben der Aufgabe, keiner behoben

**(a) `TagsScreen.tsx:895` `pathOf` verliert die Herkunft, und `proof:foreign` sieht es nicht.**
Beim Bau von Abschnitt 7 habe ich versuchsweise auch **Reihenliterale** geprüft (ein fremder Wert
in einem `[…]`, dessen Zieltyp Text ohne Marke ist). Zwei Treffer, einer davon echt:

```
function pathOf(tree: TagTreeData, id: Id): readonly string[] { … return [rootTag.name]; }
                                            ^^^^^^^^^^^^^^^^^
<TagPath segments={pathOf(tree, selected.id)} />      TagPathProps.segments: readonly ForeignText[]
```

Der Ordnerpfad ist Glied für Glied fremd; `pathOf` gibt ihn als `readonly string[]` zurück, und
weil die Marke freiwillig ist, nimmt `TagPath` ihn wortlos an. **Schaden heute: keiner** —
`TagPath` behandelt jedes Glied mit `<Foreign>`. Der Schaden ist der übliche: Der nächste, der
`pathOf` benutzt, hat keinen Hinweis mehr. Die Behebung ist nicht eine Zeile: `pathOf` →
`readonly ForeignText[]` macht `path.join(" / ")` in `folderName` zu einem fremden Wert, und
`folderName` gibt `string` zurück — eine Kette über drei Funktionen. Das gehört in einen eigenen
Auftrag, zusammen mit der Frage, ob der Reihenliteral-Test dauerhaft in `proof:foreign` gehört
(der zweite Treffer, `BoardScreen.tsx:408`, ist ein Fehlalarm: ein Tupel `[Id, ForeignText]`, bei
dem meine Probe die Elementart des ersten Gliedes gegen alle Glieder hielt).

**(b) Sechs Ablagen in Sammlungen mit Schlüssel, jede eine eigene Frage** (4.2):
`StructureContext.tsx:196/204/250` (`map.set(status.id, status.name)`),
`exportTemplateModel.ts:440/444`, `TagInput.tsx:184`. Ob die Werte dieser Karten `ForeignText`
tragen sollen, ist je eine Entscheidung.

**(c) Drei weitere Live-Regionen der falschen Bauart** — dieselbe Klasse wie O-FX, aber mit
`role="status"` statt `role="alert"`, und deshalb nicht von diesem Auftrag gedeckt:

```
apps/web/src/screens/SettingsScreen.tsx:429       <p className="field__error" role="status"> … bedingt erzeugt
apps/web/src/showcase/ExportDirectorySection.tsx:154   dieselbe Stelle auf der Musterseite
apps/web/src/components/ExportDirectoryField.tsx:451   <p className="field__error"> — gar keine Rolle
```

Dazu `apps/web/src/screens/TemplateFields.tsx:414` (`tfield__error`): ein Fehlertext **ohne jede
Rolle**, nur über `aria-describedby` verknüpft. Er entsteht, während der Vorlageneditor schon
steht — also genau der Fall, für den B-5 die Live-Region verlangt. Ob dort `alert` das richtige
ist (ein Editor kann viele Zeilen haben, und jede eine Meldung) ist eine UX-Frage und keine
Behebung nebenbei. Ich habe alle vier **nicht** angefaßt; der Wächter aus 1.4 fände genau sie.

---

## 8. Nachweise

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** — alle Pakete, `typecheck:test`, `typecheck:e2e` |
| `pnpm test` | **73 Dateien, 1442 Prüffälle, alle grün** (die zwei roten aus `undoDone.test.ts` sind von unit-tester in dieser Welle nachgezogen worden) |
| `pnpm --filter @takt/web build` | **grün**, 2,06 s |
| `pnpm run contrast` | **0 von 480 Paaren durchgefallen** |
| `pnpm run proof:foreign` | **20 bestanden, 0 fehlgeschlagen**, davon 3 Gegenproben (vorher 14/0) |
| `pnpm run proof:codepoints` | **45 bestanden, 0 fehlgeschlagen** |
| Messung im Browser | Chromium, Port 5199, Protokoll in Abschnitt 6 |
| `pnpm run proof:all` | **nicht gefahren** (E-083 Punkt 3) |
| `pnpm test:e2e` | **nicht gefahren** (E-083, fester Port) |

**Nicht gefahren heißt nicht grün.** Beide Läufe gehören nach der Welle dem Orchestrator; die
einzige Stelle, an der meine Änderung einen e2e-Prüffall berühren könnte, ist in Abschnitt 5
benannt und geprüft.

---

## 9. Artefakte

**Geändert:**

```
apps/web/src/components/NoteField.tsx        O-FX — Meldeflaeche steht immer im Baum
apps/web/src/styles/components.css           dazu der Kommentar, warum der Behaelter keine Regel braucht
apps/web/src/components/ConfirmDialog.tsx    P-8 + der Kopfkommentar, der den Preis benennt
apps/web/src/components/Attachments.tsx      P-8, zwei Stellen
apps/web/src/screens/TagsScreen.tsx          P-8, drei Stellen, `nameAtOpen`
apps/web/src/screens/PoolFormDialog.tsx      P-8
apps/web/src/screens/StatusSettings.tsx      P-8
apps/web/src/screens/TemplatesScreen.tsx     P-8 + `beginCopy` als einziger Einstieg
apps/web/src/screens/TodoListScreen.tsx      O-GI — der falsche Kommentar ist entfallen
apps/web/scripts/proof-foreign.mjs           O-GN — Abschnitt 7 und 8, `lensFor`, `buildProgram`
```

**Neu:**

```
apps/web/src/lib/touched.ts                  Regel P-8 an einem Ort, ohne JSX, pruefbar
```

**Nicht angefaßt:** `apps/web/test/**` (unit-tester), `tests/**` (e2e-tester),
`packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `docs/**`.

---

## 10. Annahmen

1. **„Zieh beide nach" bei O-FX heißt: den Baustein beheben, und die Musterseite erbt es.** Die
   Musterseite hat keine eigene Bauart; sie zeichnet `NoteField`. Ich habe das im Browser
   nachgemessen statt es anzunehmen.
2. **`NoteField.required` bleibt stehen** (Z-19a), weil sie zu entfernen einen zugänglichen Namen
   streicht und damit E-087 und zwei Vorlagepflichten auslöst. Die Messung dafür liegt bei.
3. **P-8 wörtlich**, einschließlich der Folge für den Bestätigungsdialog. Die Umsetzungsvorschrift
   in P-8 ist eine Vorschrift und keine Anregung; wo sie mich stört, melde ich statt zu erfinden.
4. **P-9 nicht gebaut** — T-184 verlangt sie ausdrücklich nicht in dieser Welle.
5. **Der Kommentar in `TodoListScreen` fällt ganz**, statt berichtigt zu werden. Der Auftrag nennt
   das die bessere Antwort, wenn er entbehrlich ist; er ist es.
6. **Bei A-A-39 der gebaute Teil statt des wörtlichen.** Der wörtliche Teil 2 der ersten Hälfte
   ergäbe 27 Fehlalarme, darunter die Behandlung selbst. Die Zahl steht im Bericht und im
   Quelltext, nicht als Vermutung.
7. **Der Prüfstand im Browser war eine Wegwerfdatei.** Ihn dauerhaft einzurichten wäre eine
   zweite Musterseite; das gehört entschieden, nicht nebenbei gebaut.

---

## 11. Risiken

1. **Z-16 ist am Bestätigungsdialog wieder offen, solange P-9 fehlt** (6.2, 7.1). Das ist das
   einzige Risiko dieser Aufgabe, das ein Benutzer merken kann.
2. **Die Ausnahme „antwortet mit einem Wahrheitswert" in der neuen Ablageprüfung ist eine
   Heuristik.** `indexOf` fiele darunter, käme es vor; heute kommt es nicht vor. Sie steht als
   Heuristik im Quelltext und nicht als Regel.
3. **`proof:foreign` läuft jetzt ~4× so lange** (vier Programme statt einem, gemessen 4,2 s → rund
   16 s). Für `proof:all` ist das spürbar, aber die Gegenprobe ist der Zweck des Laufs.
4. **Die neue Meldefläche im Notizfeld erscheint in jedem DOM-Vergleich**, der `[role="alert"]`
   zählt. Zwei e2e-Prüffälle tun das; beide sind in Abschnitt 5 geprüft und nicht betroffen.
   Fahren konnte ich sie nicht.
5. **`TemplatesScreen.beginCopy` ist eine Zusammenlegung ohne eigenen Prüffall.** Der Vorschlag
   `Kopie von …` entsteht jetzt an einem Ort statt an zweien; verhaltensgleich, aber ungemessen.

---

## 12. Nächster Schritt

1. **spec-ux-reviewer:** die zwei Fragen aus 7.1 — vor allem, ob der Bestätigungsdialog seinen
   P-9-Hinweis vorgezogen bekommt. Solange die Antwort aussteht, ist Z-16 dort offen.
2. **unit-tester:** vier Fälle für `lib/touched.ts` (Vorschlag in Abschnitt 2). Die Regel ist
   heute an neun Stellen wirksam und an keiner gemessen.
3. **e2e-tester:** der Prüffall für die Meldefläche des **Notizfeldes**, nach dem Bauplan in 1.4 —
   `toHaveCount(1)` **und** `toBeEmpty()` vorher, Marke am Knoten, derselbe Knoten nachher.
   `field-live-region-announcement.spec.ts` ist die Vorlage; der natürliche Ort ist der
   Timer-Stopp, weil dort der Leistungstext entsteht.
4. **Orchestrator:** die drei Funde aus 7.2 einordnen. (a) und (c) sind je ein eigener Auftrag;
   (b) sind sechs Entscheidungen, keine Umsetzung.
5. **visual-qa:** die vier berührten Flächen ansehen — Notizfeld mit und ohne Meldung, die drei
   Namensdialoge im frisch geöffneten Zustand, der Bestätigungsdialog mit Pflichtbegründung, und
   der Kopierdialog der Vorlagen.

---
---

# Nachtrag T-186 — O-GP, die Schärfung von P-8, und die Kette, die der Kommentar behauptete

**Datum:** 2026-09-06, nach drei Entscheidungen des Orchestrators. Alles unten ist **neu gebaut
und neu gemessen**; die Abschnitte 1 bis 12 oben beschreiben den Stand davor. Wo der Nachtrag
widerspricht, gilt der Nachtrag — namentlich bei **Abschnitt 7.1**, dessen beide offene Fragen
hiermit beantwortet und gebaut sind.

```
Nachtrag zu T-186 — O-GP, P-8-Schärfung, TP-KANBAN-08
Status: fertig
```

---

## N1. O-GP — der Bestätigungsknopf ist gesperrt **und** erreichbar

### N1.1 Warum `disabled` das falsche Werkzeug war

Ein `disabled`-Knopf ist aus dem Tabulatorlauf **entfernt**, nimmt keinen Klick entgegen und löst
kein Ereignis aus. Er kann deshalb nicht einmal sagen, warum er nicht geht — und wer mit der
Tastatur arbeitet, findet ihn gar nicht erst.

Solange das Verlassen des Begründungsfeldes bedingungslos `touched` setzte, fiel das nicht auf:
Der Klick auf den gesperrten Knopf nahm dem Feld den Fokus, und die Meldung erschien als
**Nebenwirkung** eines Fokuswechsels. P-8 hat diese Nebenwirkung entfernt — richtigerweise —, und
damit stand der Dialog nackt da. Das war der Ringtausch, den ich in 7.1 gemeldet habe.

### N1.2 Was gebaut ist

**`Primitives.tsx` — eine neue Eigenschaft an `Button`:**

```tsx
readonly ariaDisabled?: boolean;   // aria-disabled statt disabled
```

Sie setzt `aria-disabled="true"` (und **nur** `true` — `aria-disabled="false"` an jedem Knopf wäre
eine Aussage über jeden Knopf zu jedem Zeitpunkt, dieselbe Regel wie an `aria-invalid` im Add-in).
Sie setzt `disabled` **nicht**. Die Dokumentation an Ort und Stelle sagt den Preis dazu: Wer sie
setzt und im `onClick` nichts abfängt, hat einen Knopf gebaut, der aussieht wie gesperrt und
trotzdem handelt.

**`components.css` — ein Aussehen, zwei Wege hinein:**

```css
.btn:disabled,
.btn[aria-disabled="true"] { … }         /* gleiches Aussehen, gleicher cursor */
.btn--primary:hover:not(:disabled, [aria-disabled="true"]) { … }   /* keine Hoverwirkung */
```

18 Hover- und Aktivregeln sind mitgezogen. Der Unterschied zwischen „hart" und „weich gesperrt"
darf den Benutzer nichts angehen — ein drittes Aussehen wäre ein dritter Zustand, den niemand
gelernt hat. **Der Fokusring bleibt**: Er kommt aus `:focus-visible` in `base.css` und ist hier
bewußt nicht zurückgenommen; ein erreichbarer Knopf ohne sichtbaren Fokus wäre erreichbar und
unsichtbar zugleich (SC 2.4.7).

**`ConfirmDialog.tsx` — der Knopf und sein Torwächter:**

```tsx
const confirmOrExplain = (): void => {
  if (blocked) {
    if (reasonRequired) setReasonTouched(true);
    return;
  }
  onConfirm(reason);
};
```

Erst der Riegel, dann die Handlung. `busy` bleibt bei `loading` und damit bei der **harten**
Sperre: Da gibt es nichts zu erklären, und ein zweiter Klick wäre ein zweiter Auftrag an den
Dienst.

**Kein neuer Text.** Die Meldung ist die, die es seit T-177 gibt („Begründung fehlt."), und sie
landet in der Fläche, die seit T-118 dauerhaft im Baum steht — sie wird also **angesagt**.

### N1.3 Die eine Stelle, an der ich bewußt nichts sage

`blocked` hat zwei Ursachen: fehlende Begründung **und** fehlendes Häkchen. Der Klick auf den
gesperrten Knopf setzt nur die **Begründung** auf „berührt". Für das Häkchen gibt es keinen
zweiten Satz, und das ist eine Entscheidung:

Seine Beschriftung steht unmittelbar über dem Knopf und **ist** die Bedingung
(„Mir ist klar, daß diese Zeit dadurch ein zweites Mal abgerechnet werden kann."). Ein Tadel
daneben verdoppelte sie in anderen Worten — genau der Fehler, den E-059 abgeschafft hat, und
genau die Sorte Text, die der Durchgang gerade abgebaut hat. Wer das anders sieht, entscheidet es
als Textfrage; der Quelltext sagt an Ort und Stelle, daß es eine Entscheidung ist und keine Lücke.

### N1.4 E-087 — was heute an einem `disabled` hängt

Gesucht in `tests/**` und `apps/*/test/**` nach `toBeDisabled`, `toBeEnabled`, `isDisabled()` und
`aria-disabled`. **Zehn Treffer, keiner am Bestätigungsknopf eines `ConfirmDialog`:**

| Stelle | Knopf | betroffen? |
|---|---|---|
| `export-audit-and-locks.spec.ts:184/209/221/254/276` | „Export ausführen" (`ExportScreen`) | nein |
| `shell-quit-failure.spec.ts:106` | „Takt beenden" (`ShellStatus`, eigener Baustein) | nein |
| `export-template-validation.spec.ts:116` | „Speichern" (Vorlageneditor) | nein |
| `tag-folder-rule-lock.spec.ts:330` | „…löschen" — der **Auslöser** in der Einstellungsliste, nicht der Dialogknopf | nein |
| `toast-eviction.spec.ts:194` | „Rückgängig" im Toast | nein |
| `export-mixed-status-and-billing.spec.ts:175` | ein `input.egroup__check` | nein |

`export-audit-and-locks.spec.ts:83-87` benutzt den geänderten Dialog — füllt aber erst die
Begründung und klickt dann. Der freigegebene Weg ist unverändert (N1.5, letzte zwei Zeilen).
`aria-disabled` kam in `apps/web/src` bisher **nirgends** vor; es gibt also keinen zweiten Ort,
der jetzt anders aussieht.

**Ein Befund für e2e-tester, gemessen und nicht vermutet:** **Playwright hält
`aria-disabled="true"` für „nicht bedienbar"** und verweigert `click()` mit einem
Zeitüberlauf (`element is not enabled`); `toBeDisabled()` schlägt an. Wer künftig den gesperrten
Knopf anklicken will, braucht `{ force: true }` — im Browser klickt ein Benutzer ihn ohne
weiteres. Das ist eine Aussage über das Werkzeug, nicht über das Produkt, aber sie kostet eine
halbe Stunde, wenn sie niemand aufgeschrieben hat.

---

## N2. Die Schärfung von P-8 — ein `onChange` ist eine Eingabe

### N2.1 Was sich geändert hat

```ts
// vorher
export function touchedOnBlur(value: DraftText, valueAtOpen: DraftText): boolean {
  return value !== valueAtOpen || value.length > 0;
}
// jetzt
export function touchedOnBlur(value: DraftText, edited: boolean): boolean {
  return edited || value.length > 0;
}
```

Gefragt wird nicht mehr, ob der **Wert** sich geändert hat, sondern ob der **Benutzer** etwas
getan hat. Der Vergleich mit dem Anfangswert ist ersatzlos entfallen und wird nicht vermißt: Ein
gesteuertes Feld ändert seinen Wert nur über sein `onChange`. Die zweite Hälfte von P-8 („oder
nicht leer ist") steht unverändert und trägt den Fall, den `edited` nicht sieht — ein vorbelegtes
Feld, das der Benutzer unverändert verläßt.

### N2.2 Wo das Merkmal geführt wird — und warum das **weniger** Code ist

Es wird dort geführt, wo das `onChange` entsteht: in **`FormDialog.tsx#TextField`** und im
Begründungsfeld von **`ConfirmDialog.tsx`**. Zwei Orte, nicht neun.

`TextField` hat dafür `onBlur` durch **`onTouched`** ersetzt:

> `onBlur` feuert bei jedem Verlassen, auch beim bloßen Durchtabben eines Feldes, das niemand
> angefaßt hat. `onTouched` feuert, wenn das Feld nach P-8 als berührt gilt.

Der Name ist die halbe Sache: Ein Baustein, der `onBlur` *manchmal* verschluckt, ist eine Falle;
einer, der `onTouched` heißt, sagt, was er tut. Die acht Aufrufstellen sind dadurch **kürzer**
geworden — sie schreiben wieder `onTouched={() => setNameTouched(true)}` und tragen die Regel
nicht mehr mit sich:

```
entfallen:  TagsScreen.nameAtOpen         (Zustand)   +  touchName
            TemplatesScreen.copyNameAtOpen (Zustand)  +  touchCopyName
            PoolFormDialog.touchName, StatusSettings.touchName, Attachments.touchValue
neu:        TextField.edited (ein useState), ConfirmDialog.reasonEdited (ein useState)
```

`TemplatesScreen.beginCopy` — die Zusammenlegung der doppelt geschriebenen Öffnung — **bleibt**;
sie war unabhängig von `copyNameAtOpen` richtig.

### N2.3 Was sie nicht leistet

Eine **programmatische** Wertänderung löst kein `onChange` aus. Der eine Fall dieser Art im
Bestand ist der Dateiwähler in `Attachments.tsx`; er setzt `touched` an Ort und Stelle selbst und
tut es aus einem anderen Grund — dort **ist** die Auswahl die Eingabe. Das steht im Kopf von
`lib/touched.ts`.

---

## N3. TP-KANBAN-08 — der Leerzustand führt jetzt dorthin, wo die Definition steht

### N3.1 Der Befund, und warum ihn niemand gesehen hat

`BoardScreen.tsx:419` gab dem Leerzustand `onCreate={() => setRuleForm({})}` — ein Sprung
unmittelbar in `PoolFormDialog` („Neue Board-Spalte anlegen"). `RULE_IS_A_RULE` steht aber in
`BoardSetupDialog` („Spalten des Boards"), und seit ST-05 ist das eine von **zwei** Stellen, an
denen Takt überhaupt noch sagt, daß eine Spalte eine Regel ist und kein Ablageort.

**Zwölf Zeilen über dem falschen Aufruf stand die Behauptung, er sei richtig:**

```
„Erste Spalte einrichten" oeffnet den Dialog, in dem `RULE_IS_A_RULE` steht
(UM-03, Auflage Z-07 Punkt 1 — diese Kette ist Teil der Freigabe).
```

Das ist **dieselbe Klasse wie O-GI** — ein Kommentar, der die Erfüllung einer Auflage behauptet,
ohne die Stelle zu nennen, an der sie gemessen wird. Er hat die Prüfung von Z-07 Punkt 1
abgekürzt, genau wie der ST-07-Kommentar beinahe UM-07 abgekürzt hätte. Zwei Funde derselben Art
in einem Auftrag; die Regel aus Z-31 Punkt 3 verdient ihren Platz.

### N3.2 Welcher der beiden Wege, und warum

**Gebaut ist: der Knopf führt in den Dialog, der die Definition trägt.**
`onCreate` heißt jetzt `onOpenSetup` und ruft `setSetupOpen(true)`.

Der Grund ist **E-078**: Dieser Weg erzeugt **keinen einzigen** neuen Satz und ändert keinen
bestehenden. Der andere Weg — die Definition zum Regelformular holen — hätte eines von beidem
gekostet:

- sie **zusätzlich** zur heutigen Beschreibung setzen („Eine Regel nennt Bedingungen. Jede engt
  weiter ein …") → mehr Text, und die dritte angezeigte Fassung der Definition, nachdem ST-05
  gerade von elf auf zwei zurückgebaut hat;
- sie **anstelle** dieser Beschreibung setzen → eine Streichung an einem Satz, der erklärt, was
  das Formular selbst tut, und die nach E-078 Punkt 3 nicht ohne Zustimmung des Prüfers fällt,
  der ihn verlangt hat.

Drei Umstände sprechen zusätzlich dafür, daß der gebaute Weg der ursprünglich gemeinte war:

1. Die Beschriftung paßt schon: „Erste Spalte **einrichten**" → der **Einrichtungs**dialog. Der
   Kopf von `RULE_IS_A_RULE` in `labels.ts` sagt es wörtlich — „im Einrichtungsdialog des Boards".
2. Der Zielzustand ist gebaut und wartet: `BoardSetupDialog` hat einen fertigen Nullspalten-Zweig
   („Noch keine Spalte — Legen Sie eine an oder nehmen Sie eine vorhandene Regel auf.") und
   „Neue Spalte anlegen" als Absendeknopf, der genau in das Formular führt, in das der Knopf
   vorher sprang. Die Kette ist damit einen Klick lang, wie Z-07 Punkt 1 verlangt.
3. Der Weg über den Kopfknopf „Spalten verwalten" tut seit jeher dasselbe. Es gab zwei Türen zu
   einem Raum, und eine davon führte an ihm vorbei.

**Der Name der Eigenschaft ist mitgezogen**, und das ist kein Beiwerk: `onCreate` sagte, was am
Ende herauskommt; deshalb fiel niemandem auf, daß der Weg dahin einen Halt übersprang.
`onOpenSetup` sagt, wohin es geht.

### N3.3 E-087 und der Kommentar

**Kein Wortlaut und kein zugänglicher Name geändert.** Gesucht wurde trotzdem:

| Zeichenkette | Treffer in `tests/**`, `apps/*/test/**` |
|---|---|
| `Erste Spalte einrichten` | 2 — beide in `board-empty-state-rule-chain.spec.ts` (Titel und Locator) |
| `Das Board hat noch keine Spalte` | 1 — derselbe Fall |
| `Eine Spalte ist eine Regel …` | 1 — derselbe Fall, wörtlich statt importiert |
| `Spalten des Boards` | 1 — `support/actions.ts:154` (`createBoardColumn`) |
| `Neue Spalte anlegen` | 1 — `support/actions.ts:156` |
| `Neue Board-Spalte anlegen` | 1 — `support/actions.ts:158` |
| `Noch keine Spalte`, `Eine Regel nennt Bedingungen` | 0 |

Alle sieben bleiben gültig: `createBoardColumn` geht über den Kopfknopf „Spalten verwalten" und
ist von der Umverdrahtung nicht berührt.

Der Kommentar im Leerzustand ist berichtigt und nennt jetzt **die Datei, in der die Kette
gemessen wird**.

---

## N4. Meßprotokoll des Nachtrags (Chromium, 1280×720, `de-DE`, `Europe/Berlin`)

Wie oben: `vite dev` auf **Port 5199**, kein lokaler Dienst, Prüfstand und Meßskript als
Wegwerfdateien, danach gelöscht (`git status` sauber). Gezeichnet wurden die **echten** Bausteine.

### N4.1 P-8, geschärft

```
== leeres Pflichtfeld, frisch geoeffneter Dialog ==
Inhalt vor jeder Handlung:          ""
Inhalt nach einem Tabulator:        ""              <- P-8, der behobene Befund
getippt, geloescht, ohne dazwischen
  das Feld zu verlassen + Tab:      "Name fehlt."   <- die Schaerfung; vorher: ""
nach " " + Tabulator:               "Name fehlt."

== vorbelegtes Feld (Umbenennen) ==
unveraendert + Tabulator:           ""              <- P-8
geleert + Tabulator:                "Name fehlt."
```

Zeile 4 ist der ganze Unterschied zur Fassung von heute morgen.

### N4.2 O-GP, der gesperrte Knopf

```
Knopf: disabled-Attribut:           false
Knopf: aria-disabled:               true
Knopf: Aussehen (Hintergrund):      rgb(239, 242, 246)   (= --bg-disabled, unveraendert)
Knopf: cursor:                      not-allowed
per Tabulator erreichbar:           true (nach 2 Spruengen aus dem Begruendungsfeld)
sichtbarer Fokusring (outline):     2px

vor dem Klick — Meldung:            ""
vor dem Klick — Handlungen:         0
nach Enter auf dem Knopf:           "Begründung fehlt."
   und Handlungen:                  0        <- die Handlung laeuft nicht
nach Mausklick (frischer Dialog):   "Begründung fehlt."
   und Handlungen:                  0        <- auch hier nicht
mit Begruendung — aria-disabled:    null
   und Handlungen:                  1        <- der freigegebene Weg laeuft
```

Alle drei Zusagen des Auftrags sind damit gemessen: die Meldung steht in der Live-Region, der
Tabulator erreicht den Knopf, und die Handlung läuft nicht.

### N4.3 O-FX, unverändert richtig

```
role=alert Knoten vorher:           1
Inhalt vorher:                      ""
Hoehe der leeren Flaeche:           0 px
role=alert Knoten nachher:          1        (kein zweiter entsteht)
derselbe markierte Knoten traegt:   "Leistung fehlt."
```

### N4.4 TP-KANBAN-08 — was ich messen konnte und was nicht

```
Leerzustand sichtbar:               true
Knoepfe „Erste Spalte einrichten":  2        (EmptyState und Karte — beide gleich verdrahtet)
nach Klick auf den ersten:          Einrichtungsdialog geoeffnet: 1
nach Klick auf den zweiten:         Einrichtungsdialog geoeffnet: 2
```

**Das ist die halbe Kette, und ich sage es lieber, als es zu verschweigen.** Gemessen ist, daß der
Leerzustand seine Primäraktion an `onOpenSetup` gibt — beide Knöpfe. Die andere Hälfte
(`onOpenSetup` → `setSetupOpen(true)` → `BoardSetupDialog` mit `description={RULE_IS_A_RULE}`) ist
**gelesen**, nicht gefahren: `BoardSetupDialog` ist nicht ausgeführt exportiert und `BoardScreen`
braucht den laufenden Dienst.

```
BoardScreen.tsx  onOpenSetup={() => setSetupOpen(true)}      (Leerzustand)
BoardScreen.tsx  <BoardSetupDialog open={setupOpen} … />     (unbedingt gezeichnet)
BoardScreen.tsx  description={RULE_IS_A_RULE}                (im Dialog)
```

**Die vollständige Messung ist `tests/e2e/board-empty-state-rule-chain.spec.ts`**, und die konnte
ich nach E-083 nicht fahren. Sie ist der eigentliche Nachweis dieses Punktes; bis sie grün
gelaufen ist, gilt der Befund als behoben, aber nicht als gemessen.

---

## N5. Nachweise des Nachtrags

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** |
| `pnpm test` | **73 Dateien, 1442 Prüffälle, alle grün** |
| `pnpm --filter @takt/web build` | **grün**, 2,22 s |
| `pnpm run contrast` | **0 von 480 Paaren durchgefallen** — der weich gesperrte Knopf benutzt dasselbe Farbpaar wie der harte |
| `pnpm run proof:foreign` | **20 bestanden, 0 fehlgeschlagen**, davon 3 Gegenproben |
| `pnpm run proof:codepoints` | **45 bestanden, 0 fehlgeschlagen** |
| Messung im Browser | Protokoll in N4 |
| `pnpm test:e2e` | **nicht gefahren** (E-083). **TP-KANBAN-08 muß laufen**, bevor N3 als gemessen gilt |
| `pnpm run proof:all` | **nicht gefahren** (E-083 Punkt 3) |

---

## N6. Artefakte des Nachtrags

**Geändert, zusätzlich zu Abschnitt 9:**

```
apps/web/src/components/Primitives.tsx    neue Eigenschaft `Button.ariaDisabled`
apps/web/src/components/ConfirmDialog.tsx `confirmOrExplain`, `reasonEdited`, aria-disabled
apps/web/src/components/FormDialog.tsx    `onBlur` -> `onTouched`, `edited`, P-8 wohnt hier
apps/web/src/styles/components.css        ein Aussehen fuer zwei Wege in die Sperre (19 Regeln)
apps/web/src/lib/touched.ts               `edited` statt `valueAtOpen`
apps/web/src/screens/BoardScreen.tsx      `onCreate` -> `onOpenSetup`, Ziel und Kommentar
apps/web/src/showcase/BoardSection.tsx    dieselbe Eigenschaft
apps/web/src/screens/TagsScreen.tsx       auf `onTouched` umgestellt, `nameAtOpen` entfaellt
apps/web/src/screens/PoolFormDialog.tsx   dito
apps/web/src/screens/StatusSettings.tsx   dito
apps/web/src/screens/TemplatesScreen.tsx  dito, `copyNameAtOpen` entfaellt
apps/web/src/components/Attachments.tsx   dito
```

---

## N7. Annahmen des Nachtrags

1. **Das fehlende Häkchen bekommt keinen eigenen Satz** (N1.3). Seine Beschriftung steht über dem
   Knopf und ist die Bedingung selbst.
2. **`busy` bleibt hart gesperrt.** Ein zweiter Klick während des Dienstaufrufs wäre ein zweiter
   Auftrag, und es gibt dabei nichts zu erklären.
3. **P-8 wohnt in `TextField`, nicht an den Aufrufstellen**, und der Prop-Name ist mitgezogen. Ein
   Baustein, der `onBlur` manchmal verschluckt, wäre eine Falle.
4. **Beim Board der Weg mit null neuem Text** (N3.2), nach E-078.
5. **Die halbe Kette gemessen, die andere Hälfte gelesen** (N4.4) — statt sie als gemessen
   auszugeben.

---

## N8. Risiken des Nachtrags

1. **Ein `aria-disabled`-Knopf ist anklickbar.** Die Sicherung ist der Torwächter im `onClick`
   und nichts sonst. Wer `ariaDisabled` an einem Knopf setzt, dessen `onClick` den Fall nicht
   abfängt, hat einen Knopf gebaut, der aussieht wie gesperrt und handelt. Das steht an der
   Eigenschaft; **gemessen ist es nicht** — ein Wächter dafür ist in N9 vorgeschlagen.
2. **Playwright verweigert den Klick auf `aria-disabled`** (N1.4). Kein Prüffall im Bestand ist
   betroffen; künftige brauchen `{ force: true }`.
3. **Der Leerzustand des Boards hat jetzt zwei Wege zu derselben Fläche** — „Erste Spalte
   einrichten" und der Kopfknopf „Spalten verwalten". Das ist kein Fehler, aber es ist eine
   Doppelung, die ux-designer sehen sollte.
4. **19 CSS-Regeln umgestellt.** Der Kontrastlauf bleibt bei 480/0, und das Aussehen ist
   unverändert — aber gemessen ist es am Bestätigungsknopf, nicht an allen vier Knopfarten.
5. **N3 ist nicht e2e-gemessen** (N4.4).

---

## N9. Nächster Schritt

1. **e2e-tester / Orchestrator: `tests/e2e/board-empty-state-rule-chain.spec.ts` fahren.** Er ist
   der Nachweis von N3 und war absichtlich rot; er müßte jetzt grün sein.
2. **unit-tester:** `lib/touched.ts` hat eine neue Signatur — vier Fälle: (leer, `false`) → false;
   (leer, `true`) → true; („Kunden Nord", `false`) → true; („ ", `false`) → true.
3. **e2e-tester, neu:** ein Fall für O-GP. Der Bestätigungsdialog mit Pflichtbegründung, Klick auf
   den gesperrten Knopf (`{ force: true }`), Meldung in der Live-Region, **und** die Gegenprobe,
   daß die Handlung nicht gelaufen ist. Ohne die zweite Hälfte mißt der Fall die Hälfte.
4. **spec-ux-reviewer:** N1.3 zur Kenntnis — das fehlende Häkchen bleibt ohne eigenen Satz.
5. **Orchestrator:** die vier Live-Regionen aus 7.2 (c) als eigener Auftrag; die Bauartfrage dazu
   beantworte ich in N10.

---

## N10. Die Bauart messbar machen — die Antwort auf die Frage aus Punkt 3

Ja, und zwar mit demselben Griff, den `proof:foreign` benutzt: **nicht die Stelle prüfen, sondern
die Gestalt**. Der Lauf liest ohnehin schon jeden Syntaxbaum unter `apps/web/src`; er bräuchte
einen Abschnitt mit einer einzigen, listenfreien Regel:

> **Ein JSX-Element mit `role="alert"` oder `role="status"` darf nicht in einem Zweig stehen,
> dessen Bedingung darüber entscheidet, ob es überhaupt entsteht.**

Gemessen am Baum: der Knoten trägt das Attribut, und einer seiner Vorfahren bis zum umgebenden
`return` ist ein `ConditionalExpression` oder ein `&&`, in dessen Zweig er liegt. Kein
Komponentenname, keine Klassenliste, keine Aufzählung von Dateien — dieselbe Bauart wie
`isForeignJoin`.

**Was er heute fände:** die drei aus 7.2 (c) und, vor dieser Aufgabe, `NoteField`. Vier Stellen,
die fünf Prüfläufe nicht sehen.

**Die Gegenprobe schreibt sich von selbst** und wäre die eigentliche Zusage: eine überlagerte
Kunstquelle mit `{x ? <p role="alert">…</p> : null}` muß rot werden, und die richtige Bauart
(`<div role="alert">{x ? <p>…</p> : null}</div>`) darf es nicht. Beides im Arbeitsspeicher,
`apps/web/src` unangetastet — der Mechanismus dafür steht seit heute in `proof-foreign.mjs`
(`buildProgram`, Abschnitt 8).

**Zwei Ausnahmen wird er brauchen, und beide gehören ausgesprochen statt erschlichen:** ein
`role="status"`, das absichtlich zusammen mit einer ganzen Fläche kommt und dann *ist* die Fläche
(der Toast — er entsteht als Ereignis und wird nicht befüllt), und der Fall, in dem der Zweig
nicht über das Entstehen, sondern über die ganze Karte entscheidet. Beide lassen sich am Baum
unterscheiden: Im ersten Fall ist die Live-Region die **Wurzel** des bedingten Zweiges, im
zweiten liegt zwischen Bedingung und Region ein Baustein mit eigenem Namen.

Gebaut habe ich ihn nicht — er gehört in denselben Auftrag wie die vier Stellen, die er findet,
damit nicht ein roter Wächter ohne Behebung im Baum steht.
