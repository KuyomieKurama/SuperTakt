# T-175 — Die eigene Feldprüfung, und drei Messungen für den Textdurchgang

**Rolle:** frontend-dev. **Welle:** Z. **Grundlagen:** E-084, E-076 Punkt 3, E-078, E-080, E-083,
`docs/design/textabbau-gestalt.md` (T-171), `.claude/team/reports/T-177-spec-ux-reviewer.md`
Abschnitt 7 (P-1 bis P-7, Z-14, Z-15, Z-16).

---

## 1. Die gezählte Liste (E-084 Punkt 2)

Gezählt über `apps/web/src/**`, jedes Vorkommen, das als HTML-Attribut an einem Bedienelement
landet. **21 Vorkommen im Quelltext**, davon **2 in Bausteinen** (Durchreichung), **16 im
Produktcode** und **3 auf der Musterseite**.

### 1.1 Produktcode — die 16 Aufrufstellen

Zeilennummern nach der Änderung.

| # | Ort | Feld | im `<form>`? | Knopf gesperrt? | eigene Meldung **vorher** | eigene Meldung **jetzt** |
|---|---|---|---|---|---|---|
| 1 | `screens/TodoFormDialog.tsx:195` | Titel | ja | nein | ja | ja, unverändert |
| 2 | `screens/BookingDialogs.tsx:190` | Anfang | ja | nein | ja | **neu: „Anfang fehlt."** |
| 3 | `screens/BookingDialogs.tsx:198` | Ende | ja | nein | **nein** (Meldung hing am Feld „Anfang", Z-14) | **neu: „Ende fehlt."** |
| 4 | `screens/StatusSettings.tsx:778` | Name | ja | ja | nur Doppelname | **neu: „Name fehlt."** |
| 5 | `screens/TagsScreen.tsx:391` | Name (neuer Tag) | ja | ja | **nein** | **neu: „Name fehlt."** |
| 6 | `screens/TagsScreen.tsx:421` | Name (neuer Ordner) | ja | ja | **nein** | **neu: „Name fehlt."** |
| 7 | `screens/TagsScreen.tsx:454` | Name (umbenennen) | ja | ja | **nein** | **neu: „Name fehlt."** |
| 8 | `screens/PoolFormDialog.tsx:534` | Name | ja | ja | **nein** | **neu: „Name fehlt."** |
| 9 | `screens/TemplatesScreen.tsx:732` | Name der Kopie | ja | ja | **nein** | **neu: „Name der Kopie fehlt."** |
| 10 | `screens/PoolRenameDialog.tsx:242` | Name | ja | ja | ja (`fieldError`, dazu ein Hinweis für den leeren Fall) | unverändert |
| 11 | `components/Attachments.tsx:466` | Verweis | ja | ja | ja (T-167, `onBlur`) | unverändert |
| 12 | `components/Attachments.tsx:479` | Bild-/Dateipfad | ja | ja | ja (T-167, `onBlur`) | unverändert |
| 13 | `screens/TemplatesScreen.tsx:585` | Name der Vorlage | **nein** (Editorfläche, kein `<form>`) | ja | ja | unverändert |
| 14 | `components/ConfirmDialog.tsx:196` | Begründung | **nein** (kein `<form>`) | ja | **nein, und keine Fläche dafür** (Z-16) | **neu: Meldefläche + „<Beschriftung> fehlt."** |
| 15 | `components/FormDialog.tsx:358` | — Durchreichung `TextField` | — | — | — | — |
| 16 | `components/NoteField.tsx:151` | — Durchreichung `NoteField` | — | — | — | — |

**Musterseite (nicht Produkt):** `showcase/ControlsSection.tsx:224` und `:436`,
`showcase/NotesSection.tsx:133`.

### 1.2 Gegenprüfung gegen die Zählung von T-177

T-177 zählt **15 Vorkommen, 9 ohne eigene Meldung**; meine Zählung kommt auf **16 im Produktcode
plus 3 auf der Musterseite**, davon **8 ohne eigene Meldung**. Die Abweichungen, benannt statt
verrechnet:

1. **`components/NoteField.tsx:151` fehlt in der Tabelle von T-177.** Der Baustein hat eine
   `required`-Eigenschaft und setzt sie an sein `<textarea>`. Sie ist **im ganzen Produktcode nie
   gesetzt** — der einzige Aufrufer mit `required` ist `showcase/NotesSection.tsx:133`. Der Eintrag
   ändert an der Sache nichts, aber er gehört in die Liste: Wer künftig ein Pflicht-Leistungsfeld
   baut, hat dort keine Meldefläche.
2. **Zeile 3 der Tabelle von T-177 („Ende") steht dort als „ja, aber am falschen Feld".** Ich zähle
   sie als **ohne eigene Meldung**: Am Feld „Ende" stand nichts, und eine Meldung unter einem
   anderen Feld ist für dieses Feld keine. Daher 9 gegen 8 — dieselbe Menge, andere Verbuchung.
3. **Zeile 5 („PoolRenameDialog") lasse ich unverändert**, wie T-177 sie einordnet. Genauer: Der
   leere Fall hat dort einen dauerhaften **Hinweis** („Ohne Namen geht es nicht: …"), keinen
   Fehlertext, also steht er sichtbar da, aber **nicht** in der Live-Region. Das ist keine stumme
   Tür und kein Fall von Z-15; ob es einer von P-6 ist, entscheidet spec-ux-reviewer, nicht ich.
   Ich habe den Satz nicht angefaßt (E-078: kein Text in diesem Auftrag).
4. **Zeilenzahlen:** T-177 zählt `Attachments.tsx:466`/`:479` als **eine** Zeile (die beiden Felder
   schließen sich zur Laufzeit aus). Ich zähle zwei Aufrufstellen im Quelltext. Sachlich dasselbe.

### 1.3 Was `noValidate` wirklich weggenommen hat

Von den 13 Feldern im `<form>` erreichte der Absendeversuch bisher nur bei **drei** überhaupt
Chromiums Sprechblase: Titel, Anfang, Ende. Die übrigen zehn sperren den Absendeknopf, und ein
gesperrter Standardknopf hält auch die stillschweigende Absendung per Eingabetaste an — dort nahm
`noValidate` nichts weg, weil dort nie etwas war. Die Meldungen für sie sind deshalb **keine
Ersetzung, sondern die Behebung von Z-15** (sechs stumme Türen).

---

## 2. Was gebaut wurde

### 2.1 `noValidate` und der zweite Verlust

`apps/web/src/components/FormDialog.tsx` — das **einzige** `<form>` in `apps/web` — trägt
`noValidate`. Damit fällt zweierlei weg, nicht eines:

* **`required`** — ersetzt durch die Prüfungen aus Abschnitt 1.
* **`badInput`** — und das ist der stillere Verlust. Ein `type="date"` oder
  `type="datetime-local"`, in das jemand `12` getippt hat, liefert `value === ""`, also **denselben
  Wert wie ein nie berührtes Feld** (gemessen, Abschnitt 3.4). Ohne Ersatz schlösse
  `TodoFormDialog` daraus „keine Frist" und verwürfe stillschweigend, was sichtbar im Feld steht.
  `TextField` prüft deshalb `validity.badInput` bei Eingabe und beim Verlassen und setzt die
  Meldung selbst. Sie hat **Vorrang** vor der Meldung von außen: Die Fachregel sieht eine leere
  Zeichenkette und sagt „fehlt", das Feld weiß, daß etwas dasteht und nur unvollständig ist.
  Form nach P-5: `„<Feldbeschriftung>: <Regel>."` — „Frist: Tag, Monat und Jahr gehören dazu.",
  „Anfang: Datum und Uhrzeit gehören dazu."

`required` bleibt am Element stehen: Es ist zugleich die Zusage an die Vorlesehilfe und muß zum
sichtbaren Stern an der Beschriftung passen. Genommen wird ihm die Sprechblase, nicht die Bedeutung.

### 2.2 Z-16 — die Pflicht-Begründung bekommt eine Meldefläche

`components/ConfirmDialog.tsx`. Bauart und Begründung sind die von `TextField` (T-162, O-DA): eine
`role="alert"`-Fläche, die **immer** im Baum steht, auch leer, dazu `aria-invalid` und
`aria-describedby` am `<textarea>`.

**Wie ich sicherstelle, daß die beiden Live-Regionen sich nicht überschreiben** (die Auflage aus dem
Risikoteil von T-177). Drei Gründe, und der dritte trägt allein:

1. **Zwei verschiedene Knoten, zwei verschiedene Rollen.** Die Absage des Dienstes bleibt in ihrem
   `role="status"` (SP-06, G-10) — ich habe sie nicht angefaßt. Die neue Fläche ist ein eigener
   Knoten mit `role="alert"` und eigener Kennung. Gemessen: im offenen Dialog stehen genau zwei
   Regionen, `status` (leer) und `alert.field__live` (leer).
2. **Zwei verschiedene Quellen.** `refusal` kommt als Eigenschaft von außen, `reasonMissing` aus dem
   Zustand des Bausteins. Keine schreibt in die andere.
3. **Sie schließen einander aus, solange `reasonRequired` gilt.** Eine Absage des Dienstes setzt
   voraus, daß `onConfirm` lief; `onConfirm` hängt am nicht gesperrten Knopf, und der ist gesperrt,
   solange die Begründung fehlt. Wo diese Meldung steht, kann keine Absage angekommen sein — und
   umgekehrt. Gemessen: nach dem Klick trägt `alert` den Satz, `status` bleibt leer; nach der
   Eingabe ist `alert` wieder leer und der Knopf offen.

**Der Auslöser deckt beide von T-177 verlangten Wege ab, ohne den Knopf anzufassen.** Gemessen in
Chromium: Ein Klick auf einen **gesperrten** `<button>` löst dort kein `click` aus — aber er nimmt
dem fokussierten Feld den Fokus, das `blur` feuert (der aktive Knoten wird der Dokumentkörper).
Blur allein genügt also für „Verlassen des Feldes" **und** „Klick auf den gesperrten Knopf". Damit
bleiben `disabled`, Klassennamen und der zugängliche Name des Knopfes zeichengleich (E-076 Punkt 3).

### 2.3 Wortlaute

Alle neuen Sätze folgen P-1 bis P-7: ein Satz, unter 60 Zeichen, mit Punkt, erstes Wort ist die
Feldbeschriftung wörtlich, ohne Anrede, ohne „Bitte", ohne „erforderlich".

| Ort | Satz | Zeichen |
|---|---|---|
| Anfang | `Anfang fehlt.` | 13 |
| Ende | `Ende fehlt.` | 11 |
| Name (Status, Tag, Ordner, Umbenennen, Regel) | `Name fehlt.` | 11 |
| Name der Kopie | `Name der Kopie fehlt.` | 21 |
| Begründung | `Begründung für das Protokoll fehlt.` | 34 |
| Frist / Datum | `Frist: Tag, Monat und Jahr gehören dazu.` | 40 |
| Anfang / Ende, unvollständig | `Anfang: Datum und Uhrzeit gehören dazu.` | 39 |

**Ein Satz ist entfallen und durch zwei ersetzt:** „Anfang und Ende müssen beide gesetzt sein."
(`BookingDialogs.tsx`) wird zu „Anfang fehlt." und „Ende fehlt." Das ist ausdrücklich Z-14 und keine
Textkürzung nach E-078.

**Zeichengleich geblieben:** „Ohne Titel lässt sich ein Todo nicht wiederfinden."
(`TodoFormDialog.tsx:91-92`, festgehalten in `tests/e2e/field-live-region-announcement.spec.ts:96`).
Nach P-2/P-4 müßte der Satz „Titel fehlt — ohne ihn lässt sich das Todo nicht wiederfinden." heißen;
das ist eine Änderung an einem Wortlaut, den eine Prüfreihe zeichengleich mißt, und geht nur
zusammen mit e2e-tester. **Offene Frage 1.**

### 2.4 Musterseite

`showcase/ControlsSection.tsx`: Der Vorführdialog nahm ein leeres Pflichtfeld bisher stumm an —
Chromium hatte ihn vorher davor bewahrt. Sein `onSubmit` schaltet jetzt auf den bereits vorhandenen
Zustand „Pflichtfeld leer" um, statt zu schließen. Kein neuer Text.

`showcase/DataSection.tsx`: `reasonLabel` ist jetzt zeichengleich mit dem Produkt
(„Begründung für das Protokoll" statt „Begründung — wird protokolliert"). Grund: Seit Z-16 setzt die
Meldung die Beschriftung als erstes Wort; eine Musterseite mit erfundener Beschriftung zeigte einen
Satz, den es im Produkt nicht gibt.

---

## 3. Meßprotokoll (Chromium, 1280x720, `de-DE`, `Europe/Berlin`)

Gemessen gegen `vite dev` auf **Port 5199** — nicht 5173 und nicht 17843, damit in dieser Welle
niemand über einen Port stolpert (E-083). Der Dienst lief **nicht**; gemessen wurde auf
`designsystem.html`, das dieselben Bausteine ohne Dienst zeichnet. Das Meßskript war ein
Wegwerfskript und ist gelöscht; `pnpm test:e2e` und `proof:all` habe ich nicht gefahren.

### 3.1 Das Formular trägt `noValidate`, und der Absendeversuch kommt an

```
form.noValidate:                    true
Feldwert:                           ""
input.required:                     true
input.validity.valueMissing:        true
form.checkValidity():               false
Dialog nach dem Klick geschlossen:  true   (der onSubmit lief — React sieht das Ereignis)
```

Das ist der Kern von O-ES: Das Feld ist nach der Formularprüfung ungültig, **und der Absendeversuch
erreicht die Anwendung trotzdem.** Vorher tat er das nicht.

### 3.2 Gegenprobe — derselbe Fall ohne `noValidate` (der Zustand vor T-175)

```
reportValidity():   false
Sprechblase:        "Please fill out this field."
Live-Region dabei:  ""
```

Englisch, in einer Gestalt, die Takt nicht kennt, und die deutsche Fläche bleibt leer. Genau der
Befund aus T-170, jetzt gemessen statt beschrieben.

### 3.3 Die deutsche Meldung landet im **schon vorhandenen** `alert`-Knoten

```
vor dem Fehler:            1 Knoten mit role="alert", Inhalt ""
nach dem Fehler:           1 Knoten mit role="alert"   (kein zweiter entsteht)
Inhalt:                    "Ein Titel ist Pflicht. Ohne ihn lässt sich das Todo nicht wiederfinden."
input aria-invalid:        "true"
input aria-describedby →   derselbe Text
```

Die Zahl bleibt **1** — es entsteht kein neuer `role="alert"`, den eine Vorlesehilfe verpassen
würde, weil sie nur bereits bekannte Regionen beobachtet. Das ist die Bedingung aus T-162.

### 3.4 `badInput` — warum der zweite Ersatz nötig war

```
leeres Datumsfeld:      { value: "", badInput: false, valueMissing: false }
nach der Eingabe „12":  { value: "", badInput: true,  valueMissing: false }
```

Gleicher Wert, verschiedene Lage. Ohne die Prüfung in `TextField` wäre die zweite Zeile für das
Formular „keine Frist".

### 3.5 Z-16 im laufenden Dialog

```
Live-Regionen VOR der Meldung:
  [{role:"status", cls:"",            text:""},
   {role:"alert",  cls:"field__live", text:""}]

Bestätigungsknopf gesperrt bei leerer Begründung:  true
textarea required:                                 true

Nach dem Klick auf den GESPERRTEN Knopf:
  [{role:"status", cls:"",            text:""},
   {role:"alert",  cls:"field__live", text:"Begründung für das Protokoll fehlt."}]
  textarea aria-invalid:      "true"
  textarea aria-describedby:  "…-reason-error"

Nach der Eingabe:
  [{role:"status", text:""}, {role:"alert", text:""}]
  Bestätigungsknopf danach gesperrt:  false
```

Die Region der Dienstabsage bleibt in allen drei Aufnahmen leer und unberührt.

---

## 4. O-EE — die drei Messungen

### 4.1 F-1 — verträgt die Chipwand die Wortmarke „Standard"? **Nein.**

Die Breitenkette bei 1280x720, aus dem Layout gebaut (`app__main` → `screen` → `settings-layout` →
`settings-panel` → `card__body` → `taginput__chips`):

```
app__main 1040 → screen 982 → settings-panel 674 → card__body 672 → taginput__chips 640 px
```

Die Marke wächst von **14 px auf 63 px**; jeder Chip mit Standard-Marke wird damit rund **49 px
breiter**. In der 640 px breiten Wand:

| Zahl der Standard-Tags | mit „S" | mit Wortmarke |
|---|---|---|
| 3 | 1 Zeile | 1 Zeile |
| **4** | **1 Zeile** | **2 Zeilen** |
| 5 | 1 Zeile | 2 Zeilen |
| 6 | 2 Zeilen | 2 Zeilen |
| 8 | 2 Zeilen | 3 Zeilen |

Umbruchschwelle, gemessen an der Breite von `.settings-panel`:

| | „S" | Wortmarke |
|---|---|---|
| 3 Chips | unter 364 px | unter **512 px** |
| 5 Chips | unter 618 px | unter **864 px** |

Die Wortmarke braucht rund **40 % mehr Breite** für dieselbe Zeile. Bei der wirklichen Breite des
Bereichs „standardtags" kippt die Wand **ab dem vierten** Standard-Tag in die zweite Zeile, wo der
Buchstabe fünf trägt. Bei 1280 Fensterbreite ist das kein Randfall: Vier Standard-Tags sind eine
gewöhnliche Einrichtung.

**Folge nach `textabbau-gestalt.md` Abschnitt 5.3, wörtlich:** „Ergibt die Messung, daß die Chipwand
dadurch umbricht, ist der Rückfall: `title` bleibt an dieser einen Marke stehen, und ST-09 Zeile 5
wird **nicht** umgesetzt." Die Messung ergibt das. Ich habe `Tag.tsx` deshalb **nicht angefaßt** —
weder die Marke noch das `title`, weder den zugänglichen Namen noch eine Klasse. Die Entscheidung
gehört ui-designer und dem Orchestrator, nicht mir; ich liefere die Zahl.

**Der zweite Teil von 5.3 ist davon nicht berührt:** Die Marke „neu" (`Tag.tsx:108-113`) trägt ihren
sichtbaren Text im zugänglichen Namen, und ihr `title` ist der dritte Wortlaut derselben Sache. Der
fällt ersatzlos, sobald der Textdurchgang läuft — kein Platzproblem, keine Messung nötig.

### 4.2 F-2 — was heute wirklich als Trennzeichen dasteht

Gezählt über alle `.ts`/`.tsx` unter `apps/web/src`:

| Zeichen | Vorkommen | Bedeutung im Bestand |
|---|---|---|
| `›` U+203A | **0** | — |
| `‹` U+2039 | **0** | — |
| `»` U+00BB / `«` U+00AB | **0** | — |
| `▸` U+25B8 | **0** | — |
| `/` (als `" / "`) | **10** | **Ordnerpfad eines Tags**, ausschließlich: `Tag.tsx` (3×), `TagInput.tsx`, `TagsScreen.tsx` (2×), `RulePickers.tsx`, `poolRule.ts`, `Kanban.tsx` |
| `→` U+2192 | 18 im Quelltext, **in der Oberfläche 1** | **Statuswechsel**, nicht Pfad: `exportAudit.ts:188` „Offen → Exportiert". Dazu ein Tastensinnbild auf der Musterseite |
| `·` U+00B7 | in der Oberfläche 2 | **Aufzählung**, nicht Pfad: `WorkstationFacts.tsx:169`, `showcase/Section.tsx:19` |

**Für einen Weg durch die Anwendung gibt es heute überhaupt kein Zeichen.** Das Produkt schreibt ihn
aus, und zwar in genau einer Form: **Präposition plus Bereichsname in deutschen Anführungszeichen.**
Vier Oberflächenstellen:

* `TodoFormDialog.tsx:235` — „… legen Sie in den Einstellungen unter „Status“ fest."
* `BoardScreen.tsx:985` — „… richten Sie in den Einstellungen unter „Status“ …"
* `StatusSettings.tsx:289` — „… auf dem Board selbst ein, unter „Spalten …"
* `TimeScreen.tsx:73` — „Morgen unter „Heute" die Buchungen von gestern …"

Das deckt sich mit Z-02 aus T-177 („Die Werte stehen in den Einstellungen unter „Status“.") und mit
der Bedingung aus `textabbau-gestalt.md` 3.7 Punkt 3: kein Zeichen, das sonst nirgends steht. `" / "`
wäre **kein** guter Ersatz — es ist im ganzen Produkt für den **Ordnerpfad eines Tags** belegt, und
ein Wegweiser in denselben Zeichen sagte dem Leser, er suche einen Ordner.

**Wortlaut entschieden habe ich nichts** (E-078 Punkt 4: das gehört ux-designer). Ich habe
`TodoFormDialog.tsx:235` nicht angefaßt.

### 4.3 Das Kontrastpaar

`apps/web/scripts/contrast-check.mjs`, neue Gruppe **„Einstellungsschiene"**, ein Paar:

```
--border-accent auf --accent-bg-subtle, min 3:1
"Kontur des aktuellen Schieneneintrags, SC 1.4.11"
```

Es steht unter seinem eigenen Namen, obwohl es in beiden Themen zeichengleich mit einem bereits
geprüften Paar ist — die Begründung aus 6.2 des Artefakts steht als Kommentar daneben.

```
vorher:  0 von 474 Paaren durchgefallen
jetzt:   0 von 476 Paaren durchgefallen
```

**476**, und **0 durchgefallen**. (237 → 238 Einträge, jeder in hell und dunkel gemessen.)

---

## 5. Zustände, Tastatur, Responsives

* **Empty / Loading / Hover / Focus / Active / Error / Confirmation:** unverändert; kein neuer
  Zustand entsteht. Neu ist nur der Zustand **Error an einem Pflichtfeld**, den es an sechs Feldern
  bisher gar nicht gab — er benutzt die bestehende `.field__error`/`.field__live`-Fläche und
  bestehende Farben.
* **Tastatur:** Der einzige neue Auslöser ist `blur`. Er feuert bei Tabulator wie bei Maus; die
  Tabulatorreihenfolge, die Fokusfalle und der Fokusring bleiben unverändert. Kein Element wird
  fokussierbar oder unfokussierbar gemacht.
* **Responsiv:** Keine neue Regel, kein neuer Umbruchpunkt, keine Änderung an
  `.dialog__reason`. Die neue Meldefläche in `ConfirmDialog` benutzt `.field__live`, dessen
  Leerabstand (`margin-block-start: calc(-1 * var(--space-1))`) zum `gap: var(--space-1)` von
  `.dialog__reason` paßt — geprüft, nicht angenommen.
* **E-076 Punkt 3:** Keine Rolle, kein zugänglicher Name, kein Klassenname, kein Datenmerkmal
  geändert. Die einzige neue Klasse ist `field__live`/`field__error` an einer Stelle, an der es sie
  vorher nicht gab; sie ist bestehend und wird nur zusätzlich benutzt. Der `disabled`-Zustand aller
  Knöpfe ist zeichengleich geblieben.

---

## 6. Nachweise

| Lauf | Ergebnis |
|---|---|
| `pnpm --filter @takt/web typecheck` | **0 Fehler** |
| `pnpm --filter @takt/desktop typecheck` | **0 Fehler** |
| `pnpm typecheck` (ganzer Baum) | **1 Fehler, fremd:** `apps/local-api/src/main.ts(318,7)` — `OrphanedImageSweep` fehlt `attachmentKinds`. Laufende Arbeit von domain-dev. |
| `pnpm --filter @takt/web build` | grün |
| `pnpm run contrast` | **0 von 476 Paaren durchgefallen** |
| `pnpm run proof:codepoints` | 45 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:foreign` | 14 bestanden, 0 fehlgeschlagen |
| `pnpm test` | **1414 bestanden, 3 fehlgeschlagen — alle drei fremd:** `apps/local-api/test/usecases/image-sweep.test.ts` (derselbe `attachmentKinds`-Bruch) und `packages/domain/test/attachment.test.ts` (`fileExtensionOf`, führender Punkt). Nichts unter `apps/web`. |
| `pnpm run proof:all` | **nicht gefahren** (E-083 Punkt 3, Anweisung des Orchestrators) |
| `pnpm test:e2e` | **nicht gefahren** (fester Port) |

Der Meßlauf im Browser lief gegen einen eigenen Entwicklungsserver auf Port **5199**; 5173, 4173 und
17843 wurden nicht belegt. Der Server ist beendet, die Wegwerfskripte sind gelöscht.

---

## 7. Annahmen

1. **`blur` genügt als einziger Auslöser.** Statt den gesperrten Knopf klickbar zu machen
   (`aria-disabled`) habe ich gemessen, ob ein Klick auf einen gesperrten `<button>` das Feld
   verläßt — er tut es. Damit bleibt der Knopfvertrag zeichengleich. Der Preis: Wer das Feld nie
   verläßt, sieht die Meldung nicht — aber ohne das Feld zu verlassen kommt niemand zum Knopf.
2. **`submitDisabled` habe ich nirgends entfernt.** P-7 verlangt „nie gesperrt **und** stumm", nicht
   „nie gesperrt". Der Knopf zu öffnen wäre eine sichtbare Verhaltensänderung an zehn Dialogen ohne
   Vorlage von ux-designer.
3. **Die `badInput`-Meldung habe ich ohne ausdrücklichen Auftrag gebaut.** E-084 Punkt 2 spricht von
   `required`; `badInput` ist der zweite Verlust desselben Schalters und wäre sonst stillschweigend
   eingetreten (Abschnitt 3.4). Form nach P-5.
4. **`Tag.tsx` habe ich nicht angefaßt**, weil die Messung den Rückfall aus 5.3 auslöst.
5. **`PoolRenameDialog` habe ich nicht angefaßt**, weil T-177 es als „hat eine eigene Meldung"
   führt. Meine Einschränkung dazu steht in 1.2 Punkt 3.
6. **Der Wortlaut des Titelfeldes bleibt**, weil eine Prüfreihe ihn zeichengleich mißt.

---

## 8. Risiken

1. **P-2 gilt an einem Feld nicht.** Der Satz am Titel beginnt nicht mit „Titel". Solange er so
   steht, ist die Regel im Produkt nicht durchgängig — und ein Benutzer mit Vorlesehilfe hört bei
   zwei gleichzeitig ungültigen Feldern im selben Dialog einen Satz ohne Bezug. Im
   `TodoFormDialog` kann das heute nicht eintreten (nur ein Pflichtfeld). Siehe Offene Frage 1.
2. **Der Fokus fällt beim Klick auf einen gesperrten Knopf auf den Dokumentkörper.** Gemessen, und
   **älter als diese Aufgabe** — die Fokusfalle von `DialogSurface` fängt ihn nicht. Für die
   Tastaturbedienung heißt das: Der nächste Tabulatorschritt beginnt womöglich von vorn. Nicht von
   mir eingeführt, aber von mir gesehen; gehört gemessen, nicht angenommen.
3. **Sechs neue Meldungen erscheinen jetzt beim Verlassen eines leeren Feldes**, auch wenn der
   Benutzer nur schnell zum nächsten Feld wollte. Das ist die Bauart aus T-167, und sie ist
   bewußt — aber sie ist an fünf Dialogen neu, und ihre Wirkung im Betrieb hat noch niemand
   gesehen. `visual-qa` sollte sie ansehen.
4. **`NoteField` hat eine `required`-Eigenschaft ohne Meldefläche.** Niemand setzt sie heute im
   Produkt. Wer sie morgen setzt, baut eine stumme Tür.
5. **Kein `visual-qa`-Durchgang bisher.** Ich habe gegen den Baum gemessen (Abschnitt 3), aber
   niemand hat die Flächen angesehen — insbesondere nicht mit einer Vorlesehilfe, und genau darauf
   zielt O-EA.

---

## 9. Offene Fragen

1. **An spec-ux-reviewer und e2e-tester:** Soll der Satz am Titelfeld auf die Grundform P-2/P-4
   („Titel fehlt — ohne ihn lässt sich das Todo nicht wiederfinden.") wechseln? Das ändert
   `tests/e2e/field-live-region-announcement.spec.ts:96` zeichengleich mit. Ich habe ihn stehen
   lassen, weil der Orchestrator ihn ausdrücklich festgehalten hat.
2. **An ui-designer und den Orchestrator:** F-1 ist gemessen und der Rückfall aus 5.3 greift. Damit
   entfällt ST-09 Zeile 5, und das `title="Standard-Tag"` bleibt. Bestätigt ihr das, oder soll die
   Wortmarke in einer **anderen** Form kommen (etwa nur im Regelformular, wo mehr Platz ist, und in
   den Einstellungen weiter der Buchstabe)? Zwei Formen derselben Marke wären eine eigene
   Entscheidung.
3. **An ux-designer:** F-2 ist beantwortet — es gibt kein Trennzeichen, es gibt eine Satzform
   („in den Einstellungen unter „Status“"), und sie steht bereits an vier Stellen. Übernehmt ihr sie
   als Wortlaut für den Wegweiser, oder soll ein Zeichen eingeführt werden? Ein neues Zeichen
   verletzt 3.7 Punkt 3, `" / "` ist für Ordnerpfade belegt.
4. **An den Orchestrator:** `PoolRenameDialog` erklärt den leeren Fall über einen **Hinweis** statt
   über einen Fehlertext. Sichtbar ist er, angesagt wird er nicht. Fällt er unter P-6, oder ist ein
   dauerhafter Hinweis die bessere Antwort auf einen Zustand, der beim Öffnen noch gar nicht
   eingetreten ist?

---

## 10. Nächster Schritt

1. **`visual-qa`** sieht sich die sechs neuen Feldmeldungen und die Meldefläche in `ConfirmDialog`
   an, möglichst mit Vorlesehilfe (O-EA).
2. **e2e-tester** erweitert `tests/e2e/field-live-region-announcement.spec.ts` um den Fall, den es
   bis heute nicht gab: **wirklich leeres** Titelfeld, Klick auf „Anlegen", deutsche Meldung im
   markierten Knoten. Dazu eine Reihe für Z-16 (leere Begründung, Klick auf den gesperrten Knopf,
   Satz in der `alert`-Region, `status`-Region unberührt). Beide Fälle sind in Abschnitt 3 gemessen
   und damit vorbeschrieben.
3. **Der Orchestrator** fährt `proof:all` und `test:e2e` nach der Welle.
4. Erst danach der **Textdurchgang** (E-078/E-081 Punkt 4) — Streichung und Ausgleich in einem
   Auftrag, mit den Antworten auf die Fragen 2 und 3.
