# Oberflächentext des Aufgabenbereichs — Bestandsaufnahme und Urteil

**Aufgabe:** T-182, Welle AA. **Verfasser:** integration-dev.
**Grundlage:** `docs/design/textbestand.md` **Abschnitt 11** (Methode und Urteilsraster für diese
Fläche), dazu dessen Abschnitte 1, 1.1, 1.2 und 2. E-078 (mit Nachtrag Punkt 6 und 7), E-080,
E-081, `docs/spec.md`, `.claude/team/decisions.md`, `.claude/team/risks.md`.

**Gegenstand:** jeder Text, den ein Benutzer im Aufgabenbereich des Add-ins und in dessen
Einstellungen liest oder vorgelesen bekommt — `apps/outlook-addin/**`,
`apps/local-api/src/routes/addin/**` und die Absagen aus `packages/export/**`, soweit sie auf
einem Bildschirm landen.

**Dieses Papier ändert `docs/design/textbestand.md` nicht** (Abschnitt 11 verlangt das
ausdrücklich). Es wendet dessen Raster an; es baut kein zweites. Wo hier ein Buchstabe steht —
**D**, **S**, **V**, **F**, **A**, **B** —, ist er der aus Abschnitt 2 drüben und hat hier keine
andere Bedeutung.

**Was tatsächlich geändert wurde, steht in Abschnitt 8** — 8.1 bis 8.5 aus T-182, 8.6 aus T-196,
8.7 aus T-199.
Alles andere ist Vorlage und wartet auf spec-ux-reviewer.

## Stand der Messung (E-087)

**Jede Zeilenangabe in diesem Papier ist ein Datum und kein Nachweis.**

| Was | Wann | Wogegen |
|---|---|---|
| Aufnahme, Abschnitte 1 bis 7 und 9 | 2026-09-05 (T-182) | Arbeitsbaum jener Aufgabe |
| Nachgemessen und berichtigt: `Primitives.tsx`, `TaskPane.tsx` (Vermerk, Leistung, Sperrlistenträger), `TagPicker.tsx:330`, `SettingsView.tsx:382`/`:403` | **2026-09-06 (T-196)** | Arbeitsbaum auf `versionspruefung-gegen-github`, Vorfahr `d5440b2` |
| T-199: **keine** Zeilenangabe nachgeführt — die Umstellung in `ui/App.tsx`, die Sperrlistenträger und die Chip-Erklärung sind ausschließlich über den **Wortlaut** gesucht und gemessen | **2026-09-06 (T-199)** | Arbeitsbaum auf `versionspruefung-gegen-github` |
| Alle übrigen Zeilenangaben | **2026-09-05, seither nicht nachgemessen** | — |

**Was die Messung am 2026-09-06 ergeben hat, ist kein Streufehler, sondern ein Versatz.** In
`TaskPane.tsx` stand **keine einzige** der hier genannten Zeilen dort, wo dieses Papier sie nennt
— alle in dieselbe Richtung, um acht bis neun Zeilen zu spät:

| Dieses Papier nannte | gemessen am 2026-09-06, **vor** T-196 | Versatz |
|---|---|---|
| `:463` „Sie ist die Standardquelle …" | `:471` | +8 |
| `:547` Fristhinweis (SP-A-02) | `:555` | +8 |
| `:590` Standard-Tags (SP-A-04) | `:598` | +8 |
| `:625` „Ein Todo entsteht so nicht." (SP-A-15) | `:633` | +8 |
| `:632` „(bleibt in Takt)" (SP-A-01) | `:640` | +8 |
| `:634` Vermerkhinweis (ST-A-08) | `:642` | +8 |
| `:745` Rundungsauskunft (ST-A-02) | `:753` | +8 |
| `:782` „(geht in die Abrechnung)" (SP-A-01) | `:790` | +8 |
| `:784` Leistungshinweis (SP-A-05) | `:792` | +8 |
| `:866-881` `FIELD_LABEL` | Beginn `:874` | +8 |
| `:941` „Die Eingaben bleiben stehen." (ST-A-07) | `:949` | +8 |
| `:319` Verbindungszustand (Abschnitt 8.4) | `:328` | +9 |
| `:846` „und es wieder öffnen" (SP-A-11) | `:855` | +9 |

**Keine dieser Abweichungen entstand durch eine Textänderung.** Sie entstand dadurch, dass jemand
oberhalb von `:463` acht Zeilen einfügte — ein Kommentar, kein Satz. Der Wortlaut jedes einzelnen
Eintrags war unverändert; falsch war ausschließlich die Zahl davor.

`Primitives.tsx:230` und `:234`, `TagPicker.tsx:330` und `SettingsView.tsx:382`/`:403` stimmten
dagegen zeichen- und zeilengleich.

**Und der Beleg für die Regel kam noch am selben Tag.** T-195 hat seine Fundstellen ausdrücklich
selbst am Baum gemessen und nennt für die Bindung von ST-A-05
`tests/e2e/outlook-addin-build.spec.ts:108`, für die Duz-Stelle `ui/App.tsx:191` und für ihren
Prüftext `outlook-addin-build.spec.ts:65`. Bei der Messung für T-196, **wenige Stunden später**,
standen sie auf `:118`, `:198` und `:66` — die Zeichenketten unverändert, nur die Zahlen bewegt,
weil in derselben Welle andere Agenten in denselben Dateien arbeiteten. Eine Zeilenangabe altert
nicht in Wochen, sondern in Stunden. **Deshalb nennen die Einträge dieses Papiers ihre fremden
Dateien ab jetzt ohne Zeile.**

Das ist in dieser Runde das **dritte** Mal, dass eine Zahl aus einem Papier die Fehlerquelle war
(T-195 Risiko 2 zählt die beiden davor). Deshalb steht die folgende Regel hier und nicht in einer
Fußnote.

**Daraus die Regel für dieses Papier:** Wer einen Eintrag umsetzt, sucht ihn über den **zitierten
Wortlaut**, nicht über die Zeile. Die Zeile sagt, wo er am genannten Tag stand. Findet die Suche
nach dem Wortlaut nichts, ist das ein Befund und kein Tippfehler — dann hat jemand den Text
geändert, ohne dieses Papier anzufassen.

---

## 1. Was gemessen wurde (Regel M-01)

Regel M-01 aus `textbestand.md` Abschnitt 1.1 verlangt den **Bruch**: gelesene Dateien gegen
Dateien des Bereichs. Er lautet:

| Bereich | Dateien | davon mit JSX | gelesen |
|---|---|---|---|
| `apps/outlook-addin/src` | **32** (25 `.ts`, 7 `.tsx`) | 7 | **32 von 32** |
| `apps/local-api/src/routes/addin` | **4** | 0 | **4 von 4** |
| `packages/export/src` | **8** | 0 | **8 von 8** |
| Beiwerk: `manifest.xml`, `index.html`, `styles/addin.css` | 3 | — | **3 von 3** |

**44 von 44 Quelldateien.** Wer den Durchgang über die Endung `.tsx` geführt hätte, hätte im
Aufgabenbereich **7 von 32** gelesen und in den beiden anderen Bereichen **0 von 12**.

### Was die drei Läufe gefunden haben

| Lauf | Was er nennt | Zahl |
|---|---|---|
| 1 — Dateimenge | jede Quelldatei | 44 |
| 2 — Satzfilter (`textbestand.md` 1.1) | Dateien mit Satzliteralen | 14 von 32 im Add-in, 1 von 4 in den Routen, 2 von 8 im Export |
| 2 — Satzfilter | Satzliterale insgesamt (ohne Kommentare) | **70** + 13 + 10 = **93** |
| 3 — Bauartfilter | `.ts`-Module, die Zeichenketten ausgeben | 19 von 25 |
| — | Textführende Eigenschaften (`label`, `title`, `description`, `hint`, `placeholder`, `removeLabel`, `aria-label`) | **81** in 9 Dateien |

### Der Gegenbeweis zum Zeichenfilter, an dieser Fläche nachgerechnet

`textbestand.md` 1.1 nennt `create-gate.ts` als den Fall, den ein Umlautfilter verliert. Er ist
hier nicht der einzige. Nachgemessen am 2026-09-05 findet der Satzfilter in

- `ui/create-gate.ts` fünf Sätze — **kein Umlaut, kein Eszett, keine deutsche Anführung**,
- `ui/field.ts` keinen Satz, aber die **Regel**, die entscheidet, ob ein Hinweis überhaupt
  erreichbar ist,
- `callnumber/labels.ts` elf Sätze, davon einer neu aus T-182,
- `duplicate/reopen.ts` sechs Sätze, darunter die drei Wirkungen einer Buchung,
- `callnumber/pattern.ts` sieben Absagen an einen regulären Ausdruck,
- `api/client.ts` sechs Fehlersätze,
- `callnumber/catalog.ts` fünf Musterbeschriftungen und fünf **erfundene** Beispieltexte,
- `duedate/entry.ts`, `tags/new-name.ts`, `office/mail.ts` je Text, der aus `@takt/domain`
  **durchgereicht** und nicht hier formuliert wird.

**Neun `.ts`-Dateien tragen Oberflächentext, gegen sieben `.tsx`.** Die Endung ist auf dieser
Fläche nicht nur kein Filter, sie zeigt in die falsche Richtung.

### Der wichtigste Einzelbefund

Von den Sätzen, die dieses Papier zum Streichen vorschlägt, sind **zwei** in fremdem Prüfcode
wörtlich festgenagelt, und beide stehen in `tests/e2e/outlook-addin-build.spec.ts` (Hoheit
e2e-tester). Sie stehen deshalb in Abschnitt 6 mit einer Bedingung und nicht in Abschnitt 8.
Alles Übrige, was hier fällt, ist in keinem Prüfpfad an seinem Wortlaut gemessen — gemessen sind
**Rollen, Kennungen und Rechnungen** (`fieldParts`, `createTodoGate`, `poolMovementSentence`).
Dieselbe Trennlinie wie drüben: **die Prosa ist frei, die Namen und die Rechnungen sind
vertraglich.**

---

## 2. Die vier Gewichte der Fläche — angewandt, nicht wiederholt

`textbestand.md` 11.2 nennt sie. Was sie in dieser Aufnahme konkret bewirkt haben:

**AB-1 (keine zweite Fläche).** Hat **fünf** Sätze vor der Streichliste bewahrt, die nach reiner
Länge Kandidaten gewesen wären: die fünf Sperrgründe aus `create-gate.ts`. In der Hauptanwendung
könnte ein Benutzer vor einem gesperrten Knopf in eine andere Ansicht wechseln; hier nicht.
Umgekehrt hat AB-1 die Streichungen in Abschnitt 8 **verschärft**: In einem 320 bis 450 Pixel
breiten Bereich stehen Überschrift und Fläche darunter immer im selben Blickfeld — was drüben
„zwei Bildschirmseiten auseinander" wäre, ist hier zwei Zeilen.

**AB-2 (nur zwei Träger).** Jeder Eintrag der Umbauliste in Abschnitt 7 nennt **T1
Zustandsbindung** oder **T2 Handlungsbindung**. **T3 Handbuch kommt in dieser Aufnahme kein
einziges Mal vor** — es gibt im Aufgabenbereich keinen Text, der reiner Hintergrund wäre. Ein
vierter Träger wird nicht vorgeschlagen (E-078 Nachtrag Punkt 6).

**AB-3 (fremder E-Mail-Text).** Betrifft `callnumber/labels.ts`, `duedate/entry.ts`,
`routes/addin/index.ts` und die vier `Foreign`-Stellen in `TaskPane.tsx`. **Keine dieser Regeln
ist in dieser Aufnahme berührt worden**; sie sind keine Kürzungsfrage. Ausdrücklich festgehalten,
weil ein späterer Durchgang sonst „der Satz nennt den Wert nicht — dann ist er unbestimmt und
kann weg" schließen könnte. Das Gegenteil ist der Fall.

**AB-4 (die Anrede).** Hat **zwei** Stellen gefunden, die T-169 übersehen hat und die der
Wächter in `scripts/proof-addin.mjs` **nicht sehen kann** — Näheres in Abschnitt 5.

---

## 3. Bestandsaufnahme nach Textsorte

Die Sorten sind dieselben wie drüben, soweit es sie hier gibt. Sorten, die der Aufgabenbereich
nicht kennt (Navigationsbeschriftungen, Kanban-Texte, Dialogtitel, Toasts, Beratungstexte über
Ablageorte, Kennungen im Oberflächentext), fehlen — und dass sie fehlen, ist selbst ein Befund:
**Der Aufgabenbereich hat keine Sorte, die es drüben nicht auch gibt, und fünf weniger.**

### A-01 Bereichsüberschriften (`Section.title`)

Zehn Stück, alle ein bis vier Wörter.

| Ort | Text | Urteil |
|---|---|---|
| `App.tsx:168` | „Wird geladen" | tragend |
| `App.tsx:179` | „Kein Outlook" | tragend |
| `App.tsx:190` | „Keine E-Mail geöffnet" | tragend |
| `TaskPane.tsx:303` | „Noch nicht verbunden" | tragend |
| `TaskPane.tsx:432` | „Aus dieser E-Mail" | tragend |
| `TaskPane.tsx:458` | „Call-Nummer" | tragend |
| `TaskPane.tsx:495` | „Neues Todo" | tragend |
| `TaskPane.tsx:697` | „Auf vorhandenes Todo buchen" | tragend |
| `SettingsView.tsx:171` | „Verbindung zu Takt" | tragend |
| `SettingsView.tsx:306` | „Erkennung der Call-Nummer" | tragend |
| `SettingsView.tsx:409` | „Woher das Token kommt" | siehe ST-A-04 |

**Regel dieser Sorte:** Eine Bereichsüberschrift benennt den Bereich und behauptet nichts über
seinen Zustand. Wo sie einen Zustand benennt (`App.tsx:179`, `:190`, `TaskPane.tsx:303`), darf
die Fläche darunter ihn nicht ein zweites Mal benennen — das ist der Befund ST-A-01.

### A-02 Bereichszeilen (`Section.description`)

Drei Stück, davon eine berechnet.

| Ort | Text | Urteil |
|---|---|---|
| `TaskPane.tsx:458` | `detectionLine.help` — je Erkennungsfall ein Satz | **D in vier von sechs Fällen** — in T-182 behoben, Abschnitt 8 |
| `SettingsView.tsx:172` | „Takt läuft auf diesem Rechner. Das Add-in spricht ausschließlich mit dem lokalen Dienst." | **A** (Abwesenheit: keine Cloud) — E-001, B-1.1. Gesperrt, SP-A-06 |
| `SettingsView.tsx:307` | „Der Ausdruck steht in dieser Einstellung, nicht im Programm. Übernommen wird immer der Inhalt der ersten Klammer." | **A + B** — A-10.8, B-4.3 Punkt 1. Gesperrt, SP-A-07 |

### A-03 Feldbeschriftungen (`Field.label`)

Zwölf Stück; genau die zwölf, die der Wächter in `scripts/proof-addin.mjs` Abschnitt 19c zählt.

„Call-Nummer", „Titel", „Frist", „Tags", „Vermerk (bleibt in Takt)", „Dauer", „Leistung (geht in
die Abrechnung)", „Adresse des lokalen Dienstes", „Zugangstoken", „Erprobte Muster", „Regulärer
Ausdruck (für Fortgeschrittene)", „Beispieltext zum Ausprobieren".

**Alle tragend. Keine fällt.** Zwei tragen einen Klammerzusatz, und beide sind **A**: „bleibt in
Takt" und „geht in die Abrechnung" sagen an der Beschriftung, was mit dem Text geschieht — die
Grenze aus A-7.2/A-7.3, R-08, E-016, B-12.3. Auf einer Fläche, die Text aus einer fremden E-Mail
einsammelt, ist das die wichtigste Beschriftung des ganzen Bereichs. Gesperrt (SP-A-01).

### A-04 Feldhinweise (`Field.hint`)

Neun Stück. Die dichteste Sorte dieser Fläche und die einzige, in der ein Satz über 100 Zeichen
steht.

| Ort | Text (gekürzt) | Zeichen | Urteil |
|---|---|---|---|
| `TaskPane.tsx:463` | „Sie ist die Standardquelle für das Exportfeld „Call" und darf leer bleiben." | 76 | **A** (A-2.6: leer ist erlaubt) + Exportbezug. Gesperrt, SP-A-03 |
| `TaskPane.tsx:547` | „Takt sucht in der E-Mail nicht nach einer Frist — …" | 176 | **A**, **V-04 freigegeben**. Gesperrt, SP-A-02 |
| `TaskPane.tsx:590` | „Die Standard-Tags aus den Einstellungen kommen beim Anlegen automatisch dazu. …" | 168 | **A** (A-9.5, Pflichtflow). Gesperrt, SP-A-04 |
| `TaskPane.tsx:662` (2026-09-06; dieses Papier nannte `:634`, gemessen stand er vor T-196 auf `:642`) | „Er geht nicht in die Abrechnung." | 32 | **A**. Satz 1 („Interner Vermerk des Todos.") ist mit **ST-A-08 in T-196 gefallen**, Abschnitt 8.6. Was bleibt, ist **ab jetzt gesperrt** — SP-A-01. UM-A-01 bleibt offen und bezieht sich jetzt auf den einen Satz |
| `TaskPane.tsx:745` | „Gerundet wird erst beim Export, auf die Tagessumme." | 51 | **A** — steht ein zweites Mal, ST-A-02 |
| `TaskPane.tsx:834` (2026-09-06; dieses Papier nannte `:784`, gemessen stand er vor T-196 auf `:792`) | „Text aus der E-Mail gehört in den Vermerk, nicht hierher." | 57 | **F + B-12.3**. Gesperrt, **SP-A-05 — und zwar dieser Satz und nur er.** Vorangegangen war ihm „Dieser Text wird exportiert."; der ist mit T-196 gefallen. **Berichtigt:** Bis dahin führte diese Zeile die **ganze** `hint` als gesperrt, während SP-A-05 selbst nur den zweiten Satz zitierte. Der Unterschied war kein Schreibfehler — siehe SP-A-05 und Abschnitt 8.6 |
| `SettingsView.tsx:182` | „Vorgabe ist 127.0.0.1:17843. Der Port ist kein Geheimnis." | 57 | **A** (der Port ist ausdrücklich kein Geheimnis, B-1.5). Gesperrt, SP-A-08 |
| `SettingsView.tsx:219` | „Das Token entsteht in Takt unter Einstellungen." | 47 | **war D** — in T-182 behoben, Abschnitt 8 |
| `SettingsView.tsx:309` | „Deckt den Normalfall ab. Alle Beispiele sind erfunden." | 54 | Satz 2 ist **A** und eine Zusage aus `CLAUDE.md` (keine echten Call-Nummern). Gesperrt, SP-A-09 |
| `SettingsView.tsx:337` | „Genau eine Klammer um die Nummer. Rückverweise und Rückschau sind nicht zugelassen." | 83 | **A + B** (B-4.1 Punkt 5, B-4.3 Punkt 1). Gesperrt, SP-A-10 |

**Regel dieser Sorte:** Ein Feldhinweis im Aufgabenbereich sagt, was mit dem Feldinhalt
**geschieht** oder **nicht geschieht** — nicht, wie das Bedienelement zu bedienen ist. Sieben von
neun tun genau das. Der einzige Hinweis, der eine Bedienung erklärt („Ein Tag, keine Uhrzeit"),
steht als Nebensatz **hinter** der tragenden Aussage, und dass er dort steht, ist eine Freigabe
von T-165 (V-04) und keine Nachlässigkeit.

### A-05 Platzhalter

Zwei. `TagPicker.tsx:178` „Tag suchen oder neuen Namen eingeben …" — tragend, er ist die einzige
Stelle, an der steht, dass dasselbe Feld sucht **und** anlegt. `SettingsView.tsx:230`
`describeToken(...)` — ein berechneter Wert, kein Text.

### A-06 Knopftexte

Sechzehn. Elf sind ein bis drei Wörter („Zurück", „Anzeigen"/„Verdecken", „Token übernehmen",
„Verbindung prüfen", „Token entfernen", „Ausdruck speichern", „Auslieferungswert", „Abbrechen",
„Todo anlegen", „Auf dieses Todo buchen", „Zu den Einstellungen"/„Einstellungen öffnen").

Fünf sind länger und drei davon zu Recht:

| Ort | Text | Urteil |
|---|---|---|
| `TaskPane.tsx:655` | „Inhalt der E-Mail übernehmen" | tragend — der Knopf tut genau das |
| `TaskPane.tsx:846` | „{n} Minuten auf „{Titel}" buchen (und es wieder öffnen)" | **F** — nennt beide Wirkungen. Gesperrt, SP-A-11 |
| `TaskPane.tsx:1123` | „Noch etwas aus dieser E-Mail" | tragend |
| `SettingsView.tsx:403` | „Ausdruck auf den Beispieltext anwenden" | siehe ST-A-05 |
| `TagPicker.tsx:330` | „Neues Tag „{Name}" — entsteht beim Anlegen des Todos" | **F** (T-061: ein Tag wirkt über dieses Todo hinaus). Gesperrt, SP-A-12 |

### A-07 Leere und ladende Zustände

| Ort | Text | Urteil |
|---|---|---|
| `TagPicker.tsx:170` | „Noch keine Tags gewählt." | tragend, kurz |
| `TagPicker.tsx:197` | „In Takt sind noch keine Tags angelegt." | tragend |
| `TagPicker.tsx:235` | „Noch keine Tags in Takt. Das Todo lässt sich trotzdem anlegen — …" | **A** (ein Todo ohne Tags ist gültig) + Ausweg. Gesperrt, SP-A-13 |
| `TagPicker.tsx:236` | „Kein Tag passt zu dieser Suche." | tragend |
| `TagPicker.tsx:241` | „{n} weitere — bitte die Suche schärfen." | tragend |
| `TaskPane.tsx:609` | „Tags werden geladen …" | tragend |
| `TaskPane.tsx:442`, `:445` | „ohne Betreff", „unbekannt" | tragend — Abwesenheit eines fremden Werts |

### A-08 Hinweisflächen (`Callout`)

Neunzehn. Die Sorte mit der höchsten Doppelungsquote und der Grund für Abschnitt 8.

| Ort | Überschrift | Urteil |
|---|---|---|
| `App.tsx:180` | „Dieser Bereich läuft außerhalb von Outlook." | **D** gegen `App.tsx:179`. ST-A-01, **e2e-gebunden** |
| `App.tsx`, Hinweisfläche unter „Keine E-Mail geöffnet" | seit T-199 „Öffnen Sie eine E-Mail, um daraus ein Todo anzulegen." | **D** gegen die Bereichsüberschrift darüber; der E-080-Verstoß ist **in T-199 behoben**, Abschnitt 8.7. Der D-Befund bleibt: ST-A-01, **e2e-gebunden** |
| `TaskPane.tsx:306` | „Das Token fehlt." | tragend; der Rumpf darunter war **D** — in T-182 behoben |
| `TaskPane.tsx:480` | `lookupNote` (ohne Überschrift) | **B** — „Zu diesem Wert wurde nicht gesucht …". Gesperrt, SP-A-14 |
| `TaskPane.tsx:613` | `load.failure.message` + „Ohne Verbindung lassen sich keine Tags wählen. Ein Todo entsteht so nicht." | **F + A**. Gesperrt, SP-A-15 |
| `TaskPane.tsx:807`, `:1061` | `ReopenAnnouncement`, drei Wirkungen | **F**, Zahl im Nachweispfad festgehalten. Gesperrt, SP-A-16 |
| `TaskPane.tsx:977` | „Was sich dadurch ändert" | tragend — Rahmen, keine zweite Behauptung |
| `TaskPane.tsx:1197` | „Gefunden, aber nicht übernommen" | tragend; die Zeile darüber war **D** — behoben |
| `TaskPane.tsx:1222` | „Der Ausdruck in den Einstellungen lässt sich nicht verwenden" | tragend (in T-182 um den Ort ergänzt) |
| `TaskPane.tsx:1232` | „Erkennung abgebrochen" | tragend; die Zeile darüber war **D** — behoben |
| `TaskPane.tsx:1244` | „Keine automatische Erkennung" | tragend; die Zeile darüber war **D** — behoben |
| `SettingsView.tsx:251` | „Das sieht nicht nach einem vollständigen Token aus" | **B**, und ausdrücklich **keine** Sperre. Gesperrt, SP-A-17 |
| `SettingsView.tsx:284` | „Verbindung steht" | tragend |
| `SettingsView.tsx:288` | `probe.message` + „Der Grund steht in Worten, nicht als Wert. …" | **A** (B-2.4 Punkt 3: der Dienst sagt bewusst nicht, woran es lag). Gesperrt, SP-A-18 |
| `SettingsView.tsx:377` | „Gespeichert" + „Der Ausdruck gilt ab der nächsten geöffneten E-Mail." | **F** (er gilt **nicht** sofort). Gesperrt, SP-A-19 |
| `SettingsView.tsx:438/444/450/456` | die vier Ergebnisse des Testbereichs | tragend, je ein Fall |

### A-09 Fehler- und Absagesätze aus reinen Modulen

| Ort | Zahl | Urteil |
|---|---|---|
| `callnumber/labels.ts` | 11 Sätze (`NO_CALL_NUMBER_FOUND`, `CALL_NUMBER_BY_HAND`, 2 × 5 Ablehnungsgründe) | **B** durchgängig. Gesperrt, SP-A-20 |
| `callnumber/pattern.ts` | 7 Absagen an einen Ausdruck | **B**. Gesperrt, SP-A-21 |
| `ui/create-gate.ts` | 5 Sperrgründe | **B**, V-11 aus T-154. Gesperrt, SP-A-22 |
| `api/client.ts` | 7 Fehlersätze | **B**. Gesperrt, SP-A-23 |
| `duplicate/reopen.ts` | 6 Sätze (Vorschau und Bestätigung) | **F**. Gesperrt, SP-A-24 |
| `routes/addin/index.ts` | 13 Sätze (3 Hüllen, 2 × 5 Ablehnungsgründe) | **B**. Gesperrt, SP-A-25 |
| `packages/export/template.ts` | 10 Absagen an eine Vorlage | **B**. Gesperrt, SP-A-26 |
| `packages/export/base64.ts` | 1 Wurfmeldung | **B**. Gesperrt, SP-A-26 |

### A-10 Zugängliche Namen und Titelattribute

| Ort | Text | Urteil |
|---|---|---|
| `App.tsx:112` | `aria-label` „Einstellungen öffnen"/„…schließen" | vertraglich (SC 4.1.2) — das Zahnrad hat keinen sichtbaren Namen |
| `Primitives.tsx:287` | `aria-label` „{Tag} entfernen" | vertraglich |
| `TagPicker.tsx:163` | `removeLabel` „Neues Tag „{Name}" verwerfen" | vertraglich — „verwerfen" ≠ „entfernen", und das ist der Unterschied |
| `Primitives.tsx:257` (war `:230`) | `title` „Standard-Tag aus den Einstellungen" | war eine Anforderungs-ID auf dem Bildschirm — **ST-A-03 in T-196 gebaut**, Abschnitt 8.6. Der Träger bleibt ein `title` auf einem `<span>` (S-16); das ist ein eigener, offener Befund |
| `Primitives.tsx:261` (war `:234`) | `title` „Entsteht zusammen mit dem Todo." | war **D** gegen `TagPicker.tsx:330` — **ST-A-06 in T-196 gebaut**, Abschnitt 8.6. **Hängt an SP-A-12**: fällt der, ist die Kürzung zurückgenommen |
| `TagPicker.tsx:366` | `title` = Ordnerpfad | kein Text, sondern ein abgeschnittener Wert sichtbar gemacht |

### A-11 Etiketten und Marken

`App.tsx:105-107` „Takt" / „Todo aus E-Mail"; `manifest.xml:44` „Takt", `:129` „Takt", `:130`
„Todo anlegen"; `index.html:6` „Takt — Todo aus E-Mail". Alle tragend.

**`manifest.xml:45` und `:133` sagen dasselbe** („Aus einer E-Mail heraus ein Todo in Takt
anlegen oder Zeit auf ein vorhandenes buchen." gegen „Aus dieser E-Mail ein Todo in Takt anlegen
oder Zeit auf ein vorhandenes Todo buchen."). Sie stehen in **zwei verschiedenen Flächen von
Outlook** (Add-in-Liste gegen Menübandhinweis), das Manifestschema verlangt beide, und ein
Benutzer sieht sie nie zugleich. **Kein D. Kein Befund.** Notiert, damit der nächste Durchgang
nicht darüber stolpert.

### A-12 Text, der **kein** Oberflächentext ist

Ausdrücklich aufgenommen und ausdrücklich außerhalb des Rasters:

- `office/mail.ts:530-536` — „Aus E-Mail von X <y>" und „Betreff: …" bauen den **Inhalt** eines
  Vermerks, nicht die Oberfläche. Ein Wert, kein Satz.
- `callnumber/catalog.ts` — fünf Musterbeschriftungen und fünf Beispieltexte. Die Texte sind
  **erfunden** (`TCK`, `SVC`, `INC`), und dass sie es sind, sagt `SettingsView.tsx:309`.
- `TaskPane.tsx:866-881` `FIELD_LABEL` — Übersetzung technischer Schlüssel in
  Feldbeschriftungen. Sie **spiegelt** A-03 und darf ihr nie widersprechen; sie ist kein eigener
  Text.

---

## 4. Die Sperrliste

**Ohne Zustimmung des genannten Prüfers fällt hier nichts** (E-078 Punkt 3, drüben Abschnitt 5).

| # | Ort | Was er trägt | Buchstabe | Prüfpunkt |
|---|---|---|---|---|
| **SP-A-01** | `TaskPane.tsx:660`, `:832` — „(bleibt in Takt)", „(geht in die Abrechnung)" — **und seit T-196 dazu `:662` „Er geht nicht in die Abrechnung."** | die Grenze zwischen Vermerk und Leistung | **A** | A-7.2, A-7.3, **R-08**, E-016, B-12.3. Der Zusatz ist die Auflage aus Z-45: Nach ST-A-08 ist `:662` der einzige ganze **Satz** dieser Fläche, der die Grenze noch ausspricht. Fiele auch er, stünde A-7.2 nur noch in einem Klammerzusatz — und ein Klammerzusatz nennt den **Ort**, nicht das Ziel, das der Text nicht erreicht |
| **SP-A-02** | `TaskPane.tsx:547` — der Fristhinweis | die Abwesenheit jeder Fristerkennung | **A** | **V-04 aus T-165, unverändert freigegeben.** E-074 Punkt 4, A-19.1, A-19.7. Die kürzere Fassung liegt vor und ist **nicht** freigegeben. Gemessen von `proof:addin` 19d (Stellung, „leer lassen", kein Fülltext). Sein Geschwister ist SP-04 drüben — **eine** Fassung für beide Flächen, Zeitpunkt V-03/V-04 in T-165 (E-078 Nachtrag Punkt 7) |
| **SP-A-03** | `TaskPane.tsx:463` | „darf leer bleiben" | **A** | A-2.6 |
| **SP-A-04** | `TaskPane.tsx:590` | Standard-Tags kommen von selbst dazu | **A** | A-9.5, Pflichtflow `CLAUDE.md`, `textbestand.md` 11.4 Zeile 5 |
| **SP-A-05** | `TaskPane.tsx:834` | „Text aus der E-Mail gehört in den Vermerk, nicht hierher." — seit T-196 der **ganze** Hinweis, weil der Satz davor gefallen ist | **F** | B-12.3, R-08. **Berichtigt in T-196, und die Berichtigung ist der Befund:** Diese Zeile zitierte den zweiten Satz, Abschnitt A-04 führte die **ganze** `hint` als „Gesperrt, SP-A-05". Der Unterschied war kein Schreibfehler. Der erste Satz war in T-165 als **F-3 freigegeben** — und diese Aufnahme hat die Freigabe nicht ausgeführt, sondern sie in eine Sperre umgeschrieben. Die Auflösung steht in Abschnitt 8.6 |
| **SP-A-06** | `SettingsView.tsx:172` | „spricht ausschließlich mit dem lokalen Dienst" | **A** | E-001, B-1.1 |
| **SP-A-07** | `SettingsView.tsx:307` | „steht in dieser Einstellung, nicht im Programm" | **A + B** | A-10.8, B-4.3 Punkt 1 |
| **SP-A-08** | `SettingsView.tsx:182` | „Der Port ist kein Geheimnis." | **A** | B-1.5, T-011 |
| **SP-A-09** | `SettingsView.tsx:309` | „Alle Beispiele sind erfunden." | **A** | `CLAUDE.md` Sicherheit, B-11.1 |
| **SP-A-10** | `SettingsView.tsx:337` | „Rückverweise und Rückschau sind nicht zugelassen." | **A + B** | B-4.1 Punkt 5 |
| **SP-A-11** | `TaskPane.tsx:846` | „und es wieder öffnen" auf dem Knopf | **F** | A-2.5, I-05, Befund C-03 aus T-025 |
| **SP-A-12** | `TagPicker.tsx:330` | „entsteht beim Anlegen des Todos" | **F** | T-061 |
| **SP-A-13** | `TagPicker.tsx:235` | ein Todo ohne Tags ist gültig | **A** | A-9.5 |
| **SP-A-14** | `TaskPane.tsx:215` (`lookupNote`) | „wurde nicht gesucht — er sieht nicht wie eine Call-Nummer aus" | **B** | **R-15**, B-4.3 Punkt 4. Der Unterschied „nicht gesucht" gegen „nichts gefunden" ist die Gegenmaßnahme selbst |
| **SP-A-15** | `TaskPane.tsx:625` | „Ein Todo entsteht so nicht." | **F + A** | X-02 aus T-165 |
| **SP-A-16** | `duplicate/reopen.ts:196-217` | die **drei** Wirkungen, vorher und nachher | **F** | A-2.5, I-05, E-056, E-058, C-03. Die **Zahl** ist im Nachweispfad festgehalten |
| **SP-A-17** | `SettingsView.tsx:251-254` | „Speichern lässt es sich trotzdem — ob es gilt, entscheidet allein Takt." | **B + A** | B-2.4 Punkt 3 |
| **SP-A-18** | `SettingsView.tsx:288-292` | „Takt nennt bewusst nicht, ob das Token fehlte, falsch war oder inzwischen ersetzt wurde." | **A** | B-2.4 Punkt 3 |
| **SP-A-19** | `SettingsView.tsx:377-379` | „gilt ab der nächsten geöffneten E-Mail" | **F** | B-4.2 Punkt 2 |
| **SP-A-20** | `callnumber/labels.ts` gesamt | zehn Ablehnungsgründe + zwei Auswege | **B** | T-041, T-046, **R-15**, E-045, `textbestand.md` 11.4 Zeile 3 |
| **SP-A-21** | `callnumber/pattern.ts:88-99` | sieben Absagen an einen Ausdruck | **B** | B-4.1, B-4.2, B-4.3 |
| **SP-A-22** | `ui/create-gate.ts:73-79` | die **fünf Sperrgründe** | **B** | **V-11 aus T-154.** Ein gesperrter Hauptknopf ohne Grund war der Befund. `textbestand.md` 11.4 Zeile 2. Gemessen über alle 24 Möglichkeiten |
| **SP-A-23** | `api/client.ts:139-147` | sieben Fehlersätze | **B** | B-2.4, E-009 |
| **SP-A-24** | `DuplicateOffer.tsx:45-47`, `:70-73`, `:83` (`REOPEN_HINT`) | das Angebot, die abgerechnete Zeit, die Folge | **F** | **A-10.9, R-15**, A-6.6, `textbestand.md` 11.4 Zeile 4 |
| **SP-A-25** | `routes/addin/index.ts:101-173` | dreizehn Sätze der Tür | **B** | T-046, R-15, B-2.4 |
| **SP-A-26** | `packages/export/template.ts`, `base64.ts` | elf Absagen an eine Vorlage | **B** | A-7.x, E-063. Sie erscheinen über `apps/web/src/lib/exportTemplateModel.ts`, das `textbestand.md` 1.2 bereits als **B, vorläufig gesperrt** führt |

**Seit T-199 gemessen, und zwar zeichengleich (O-HO):** SP-A-01 mit allen drei Trägern
(„(bleibt in Takt)", „(geht in die Abrechnung)", „Er geht nicht in die Abrechnung."), SP-A-05 und
SP-A-12. `proof:addin` Abschnitt 20 hält jeden dieser Texte Zeichen für Zeichen, verlangt ihn
**genau einmal** und misst dazu die Abhängigkeit **ST-A-06 → SP-A-12** als Folgerung: Die gekürzte
Chip-Erklärung ist nur gedeckt, solange der Tag-Auswähler die Folge ausspricht. Jede Hälfte hat
ihre Gegenprobe — eine eingesetzte Verletzung muss gefunden werden, und zwar einzeln.

**Warum diese drei und nicht die ganze Liste:** Gemessen wird, was **allein** trägt. Nach ST-A-08
und ST-A-06 ist bei SP-A-01 und SP-A-12 kein zweiter Satz mehr da, der dieselbe Aussage
mitträgt; SP-A-05 steht seit T-196 aus demselben Grund allein. Die übrigen Einträge hängen an
Flächen, die andere Abschnitte des Laufs bereits halten, oder sie tragen ihre Aussage nicht
allein. Eine Sperre, die niemand misst, ist eine Behauptung — diese Runde hat das viermal
vorgeführt.

**Zusätzlich gesperrt, ohne Prüfpunkt, aber mit Regel:** alles, was AB-3 betrifft. Kein Satz
dieser Fläche nennt einen abgelehnten Wert aus einer fremden E-Mail, und kein Textdurchgang darf
das ändern.

### 4.1 Was ein Sperrlisteneintrag **nicht** sein darf (Befund aus T-196)

SP-A-05 war zwischen T-182 und T-196 der Beleg für eine Bauart, die schwerer zu sehen ist als die
Fälle, für die E-081 Punkt 4 geschrieben wurde. Sie steht hier, weil sie sonst wiederkommt.

**Die alte Bauart:** zwei Wellen, jede für sich richtig, zusammen falsch. Es gibt zwei Zeitpunkte,
und am zweiten kann jemand stutzen.

**Diese hier:** **eine** Aufnahme halbiert **eine** Freigabe. T-165 hat in einer Tabelle zwei
Sätze mit derselben Begründung freigegeben — F-2 am Vermerkfeld und F-3 am Leistungsfeld, beide
„reine Verdopplung der Beschriftung darüber". Diese Aufnahme hat F-2 als **ST-A-08** in die
Streichliste aufgenommen und F-3 in **SP-A-05** als gesperrt geführt. Danach sahen beide Listen
vollständig aus, es gab keinen zweiten Zeitpunkt, und nirgends stand das Wort **Rücknahme**.

Eine Sperrliste kann eine Freigabe nicht aufheben. Sie kann nur sagen, was ohne einen Prüfer nicht
fällt. Daraus zwei Regeln für dieses Papier:

1. **Ein Sperrlisteneintrag nennt den Umfang zeichengenau** — welchen Satz er sperrt, nicht welche
   Zeile ihn enthält. Wo ein Hinweis aus zwei Sätzen besteht und nur einer gesperrt ist, steht das
   in **beiden** Listen gleichlautend. Zwei Stellen mit zwei Umfängen entscheiden die Frage beim
   nächsten Lesen nach Zufall, und die weiter vorn stehende gewinnt.
2. **Wer einen Satz sperrt, prüft zuerst, ob er schon einmal freigegeben wurde.** Die Suche geht
   über den Wortlaut durch `.claude/team/reports/**`, nicht über die Kennung — Freigaben tragen
   dort Buchstaben wie F-2, V-04 oder X-02 und nicht die Kennungen dieses Papiers.

---

## 5. Die Anrede — zwei Stellen, die T-169 nicht sehen konnte (E-080)

E-080 Punkt 2 nennt **sieben** Stellen: eine drüben, sechs hier. Die sechs sind in T-169
umgestellt. Der Wächter `E-080: der Aufgabenbereich duzt niemanden mehr` in
`scripts/proof-addin.mjs` ist seither grün.

**Er ist grün und er ist unvollständig.** Sein Ausdruck lautet

```
(?<![\wäöüß])(?:du|dir|dich|dein(?:e|em|en|er|es)?)(?![\wäöüß])
```

— er prüft auf **Fürwörter**. Ein deutscher Imperativ im Singular kommt ohne Fürwort aus, und
genau zwei standen noch da:

| Ort | Text | Befund |
|---|---|---|
| `callnumber/pattern.ts:89` | „Der Ausdruck ist leer. **Trage** ein Muster ein oder **wähle** eines aus der Liste." | **in T-182 behoben**, Abschnitt 8 |
| `ui/App.tsx`, Hinweisfläche unter „Keine E-Mail geöffnet" | „**Öffne** eine E-Mail, um daraus ein Todo anzulegen." | **in T-199 behoben**, Abschnitt 8.7 |

Das ist derselbe Fehlerbau wie der Zeichenfilter aus `textbestand.md` 1.1: ein Wächter, der die
naheliegende Form prüft und die ruhigere übersieht. Er gehört um die Imperativform erweitert.

**Warum die Erweiterung in T-182 nicht gebaut ist:** Der Satz steht in
`tests/e2e/outlook-addin-build.spec.ts` **wörtlich** als Suchtext (`getByText`, Hoheit
e2e-tester). Ändere ich den Satz, bricht dort eine Zusicherung, die ich nicht reparieren darf;
erweitere ich den Wächter, ohne den Satz zu ändern, wird `proof:addin` rot. Beides gehört in
**eine** Welle. Vorschlag in Abschnitt 9, offene Frage 1.

**Stand nach T-199: alle drei Schritte sind gegangen, in dieser Folge und über drei Aufgaben
verteilt.** Der Wächter trug die Stelle seit T-190 als benannte Ausnahme `IMPERATIV_AUSNAHME` in
`scripts/proof-addin.mjs`, und die Ausnahme war **selbstauflösend** gebaut: Sie geht rot, sobald
sie nichts mehr trifft.

1. **e2e-tester (T-192)** hat den Wortlaut in `tests/e2e/outlook-addin-build.spec.ts` gelöst — der
   Prüffall hängt seither an dem Teil des Satzes, der ohne Anrede auskommt, und trägt damit beide
   Fassungen.
2. **integration-dev (T-199)** hat den Satz in `ui/App.tsx` umgestellt.
3. **integration-dev (T-199)** hat `IMPERATIV_AUSNAHME` gelöscht; der Wächter prüft seither ohne
   Ausnahme.

**Fehlt ein Schritt, ist der Lauf rot — und das ist gemessen, nicht angenommen.** T-199 hat beide
Hälften gefahren: Schritt 2 ohne Schritt 3 ergibt 223/1 (`O-GE` fällt, weil die Ausnahme nichts
mehr trifft), Schritt 3 ohne Schritt 2 ergibt 226/2 (der Imperativwächter **und** der Nachfolger
des Ausnahmefalls). Beides zusammen: 228/0. Nachweis in Abschnitt 8.7.

---

## 6. Die Streichliste

Jeder Eintrag mit ausformuliertem neuem Wortlaut. **Kein Eintrag dieser Liste ist in T-182
gebaut**; **drei sind in T-196 gebaut** — ST-A-03, ST-A-06 und ST-A-08 samt dem Zwilling aus
`TaskPane.tsx`. Was gebaut ist, steht in Abschnitt 8.

### ST-A-01 — Die beiden Zustandsflächen sagen ihren Zustand zweimal (**e2e-gebunden**)

`App.tsx:179-183` und `:190-194`. Die Bereichsüberschrift nennt den Zustand, die Überschrift der
Fläche darunter nennt ihn noch einmal:

```
Kein Outlook
  ! Dieser Bereich läuft außerhalb von Outlook.
    Betreff und Text einer E-Mail stehen deshalb nicht zur Verfügung. …
```

**Vorschlag:** Die Überschrift der Fläche entfällt in beiden Fällen; der Rumpf bleibt Wort für
Wort. `Callout` kennt eine Fläche ohne Überschrift bereits (`TaskPane.tsx:480`), das Zeichen des
Tons bleibt und trägt WCAG 1.4.1 weiter.

```
Kein Outlook
  ! Betreff und Text einer E-Mail stehen deshalb nicht zur Verfügung.
    Die Einstellungen oben rechts lassen sich trotzdem prüfen und ändern.

Keine E-Mail geöffnet
  ! Der Aufgabenbereich übernimmt Betreff, Absender und den Text der geöffneten E-Mail.
```

Der zweite Fall erledigt zugleich den E-080-Verstoß aus Abschnitt 5 — **durch Streichung**, was
E-080 Punkt 4 ausdrücklich vorzieht. Was verloren ginge („um daraus ein Todo anzulegen"), steht
im Kopf des Bereichs als Wortmarke: „Takt — Todo aus E-Mail" (`App.tsx:107`). Also **S**.

**Bedingung:** `tests/e2e/outlook-addin-build.spec.ts:64-65` sucht beide Sätze wörtlich. Ohne
eine gleichzeitige Anpassung dort ist dieser Eintrag nicht umsetzbar.

### ST-A-02 — Die Rundungsauskunft steht zweimal im selben Arbeitsgang

`TaskPane.tsx:745` (Hinweis am Feld „Dauer") und `duplicate/reopen.ts:176` beziehungsweise
`TaskPane.tsx:1073` (Bestätigung). Jeder Benutzer, der bucht, liest beide — erst beim Einstellen
der Minuten, dann Sekunden später auf der Bestätigung.

**Vorschlag:** Die Kopie fällt, das Original bleibt. Original ist der Hinweis am Feld: Dort
entsteht die Frage („werden aus 15 Minuten 0,25 Stunden?"), dort ist die Auskunft über
`aria-describedby` erreichbar, und nur dort steht das tragende „**erst**".

```
reopen.ts:176   booked: `${minutes} Minuten sind gebucht.`
TaskPane.tsx:1073   entfällt ersatzlos
```

**Warum das trotz eindeutigem D nicht in Abschnitt 8 steht:** T-038 hat diese Zeile spec-ux-reviewer
ausdrücklich vorgelegt („die Zusammenfassung ‚Gerundet wird beim Export‘ steht weiterhin
darunter", T-038 offene Frage 3). Sie ohne dieselbe Rückfrage zu ziehen wäre die stille Rücknahme
einer Freigabe — E-078 Punkt 3. Drei Zusicherungen in `scripts/proof-addin.mjs` (Zeilen 1113,
2894, 2943) sind mit demselben Handgriff nachzuziehen.

### ST-A-03 — Eine Anforderungs-ID steht auf dem Bildschirm — **gebaut in T-196**

`Primitives.tsx:230` (zeilengleich gemessen am 2026-09-06):
`title: 'Standard-Tag aus den Einstellungen (A-9.3)'`.

Das ist das Geschwister von **ST-03** drüben („Fünf interne Kennungen im Oberflächentext"). „A-9.3"
ist eine Kennung aus `docs/spec.md`; für einen Benutzer ist sie Rauschen.

**Gebaut:** `title: 'Standard-Tag aus den Einstellungen'` (heute `:257`). Freigabe **Z-42** aus
T-195, ohne Auflage. E-087 gemessen: kein Treffer in `tests/**`, `apps/*/test/**` oder den
`*.mjs`-Läufen.

**Was offen bleibt und hier ausdrücklich nicht miterledigt ist:** Der Träger ist ein `title` auf
einem `<span class="chip__note">` — auf Berührungsgeräten unsichtbar, über die Tastatur nicht
erreichbar (Regel S-16). Drüben hat ST-09 dieselbe Bauart an `Tag.tsx` aufgelöst und dafür einen
`visually-hidden`-Text behalten; hier gibt es keinen. Das ist ein **eigener** Eintrag für die
nächste Aufnahme, und wer ihn baut, setzt den erreichbaren Text **zuerst**.

### ST-A-04 — „Woher das Token kommt": drei Schritte, von denen zwei woanders stehen

`SettingsView.tsx:409-419`.

| Schritt | Text | Urteil |
|---|---|---|
| 1 | „Takt öffnen, Einstellungen aufrufen." | **D** gegen `SettingsView.tsx:219` |
| 2 | „Ein Token erzeugen. Es wird genau einmal angezeigt." | Satz 1 **D**; Satz 2 ist **A** und die einzige Stelle, an der er nach T-182 noch steht |
| 3 | „Es hier oben eintragen und „Verbindung prüfen" drücken." | **S** — beide Bedienelemente stehen sichtbar darüber |

**Vorschlag:** Die Aufzählung entfällt; ihr **A** wandert an das Feld, an dem es zählt (das ist
zugleich UM-A-02). Der Absatz darunter (`:415-419`, „Ein neu erzeugtes Token macht das alte
sofort ungültig. …") ist **F + A** und bleibt — er braucht dann eine Überschrift, die zu ihm
passt:

```
Section title="Wenn ein Token ersetzt wird"
  Ein neu erzeugtes Token macht das alte sofort ungültig. Bis das neue hier steht,
  funktioniert das Add-in nicht — das ist gewollt und kein Fehler.
```

**Warum nicht in Abschnitt 8:** Das ist ein Umbau einer Bereichsstruktur und keine Streichung
eines Satzes; er hängt an UM-A-02 und gehört dem Prüfer vorgelegt.

### ST-A-05 — Ein Knopf beschreibt seine eigene Umgebung — **liegen gelassen, zwei Vorbedingungen**

`SettingsView.tsx:403` (zeilengleich gemessen am 2026-09-06): „Ausdruck auf den Beispieltext
anwenden". Der Knopf steht unmittelbar unter dem Feld „Beispieltext zum Ausprobieren" (`:382`);
beide Hauptwörter stehen sichtbar darüber.

**Vorschlag:** „Ausprobieren" — **in der Sache freigegeben** (Z-43 aus T-195), **in der Bauform
nicht ausführbar.** Er ist in T-196 ausdrücklich **nicht** gebaut worden, und die zwei Gründe sind
keine Vorsicht, sondern gemessen:

1. **Er hat einen Prüfpunkt und eine fremde Datei.**
   `tests/e2e/outlook-addin-build.spec.ts` sucht den Knopf über
   `getByRole('button', { name: 'Ausdruck auf den Beispieltext anwenden' })`, und
   `docs/testplan.md` schreibt denselben Text aus. Playwright vergleicht ohne `exact` als
   Teilzeichenkette; „Ausprobieren" enthält den gesuchten Text nicht. **TP-BUILD-04 ginge rot** —
   in einem Lauf, dessen Gegenstand der Ladeweg des Worker-Chunks ist und der mit diesem Text
   nichts zu tun hat. Wer ihn rot findet, sucht den Fehler am Worker. Beide Dateien gehören
   e2e-tester; sie ziehen zeichengleich mit oder der Eintrag bleibt liegen.
2. **Er ändert die Größe eines Bedienelements** — 38 Zeichen auf 12, in einer Spalte von 320 bis
   450 Pixeln. Das ist Dichte, und Dichte verlangt ui-designer (E-078 Punkt 4). Die Frage, die ihm
   gehört: ob ein kurzer Sekundärknopf zwischen einem dreizeiligen Textfeld und `SampleOutcome`
   noch als **Auslöser** gelesen wird oder wie eine Beschriftung des Ergebnisses darunter.

Er ist damit der einzige der vier Einträge dieser Runde mit **zwei** Vorbedingungen.

### ST-A-06 — Der Kurzhinweis am „neu"-Chip wiederholt den Knopf, der ihn erzeugt hat — **gebaut in T-196**

`Primitives.tsx:234`: `title: 'Dieses Tag gibt es in Takt noch nicht. Es entsteht zusammen mit dem
Todo.'` — dieselbe Aussage steht als sichtbarer Text auf dem Knopf, mit dem der Chip entsteht
(`TagPicker.tsx:330`, „Neues Tag „X" — entsteht beim Anlegen des Todos"), und sie steht im selben
Arbeitsgang: erst der Knopf, dann der Chip.

**Gebaut:** `title: 'Entsteht zusammen mit dem Todo.'` (heute `:261`). Freigabe **Z-44** aus
T-195, **mit zwei Auflagen**, und beide stehen im Dateikopf von `CHIP_NOTE`:

1. **Die Freigabe hängt an SP-A-12.** Nach dieser Kürzung ist `TagPicker.tsx:330` die einzige
   Stelle, an der ganz ausgesprochen wird, dass es dieses Tag in Takt noch nicht gibt. **Fällt
   SP-A-12, ist ST-A-06 zurückgenommen** — dann muss der Zustand hier wieder stehen.
2. **Das **D** trägt über den Arbeitsgang, nicht über das Blickfeld.** Knopf und Chip stehen
   **nacheinander**: Der Knopf verschwindet, sobald der Chip entsteht. Wer diesen Eintrag später
   als Beleg für „im selben Blickfeld" zitiert, zitiert ihn falsch — und AB-1 ist gerade der
   Grund, aus dem der Unterschied drüben eine Rolle spielt.

Ein Titelattribut ist ohnehin die schwächste Sorte — es erscheint nicht auf Berührung und nicht
über die Tastatur. Der Chip trägt sichtbar das Wort „neu"; das ist die Auskunft, die trägt. E-087
gemessen: kein Treffer im Prüfcode.

### ST-A-07 — Der Fehlerrumpf sagt, was er selbst vorführt

`TaskPane.tsx:941`: „Die Eingaben bleiben stehen. Ein neuer Versuch ist möglich." Beides ist im
selben Blickfeld zu **sehen** — die Felder stehen gefüllt darüber, der Knopf ist bedienbar.
Klassisches **S**.

**Vorschlag:** ersatzlos. Die Fläche trägt dann die Überschrift (`failure.message`) allein, und
das ist der Satz, der die Absage begründet.

**Gegenrede, die der Prüfer wägen muss:** Ein Formular, das sich bei einem Fehlschlag leert, ist
verbreitet genug, dass die Zusage vielleicht trägt. Deshalb steht dieser Eintrag hier und nicht
in Abschnitt 8.

### ST-A-08 — Der Vermerkhinweis wiederholt seine eigene Beschriftung — **gebaut in T-196, zusammen mit seinem Zwilling**

`TaskPane.tsx:634` laut dieser Aufnahme; **gemessen stand er auf `:642`**, heute auf `:662`.
„Interner Vermerk des Todos. Er geht nicht in die Abrechnung." Die Beschriftung darüber lautet
„Vermerk (bleibt in Takt)". Satz 1 ist **D** dagegen.

**Gebaut:** `hint="Er geht nicht in die Abrechnung."` — Satz 2 ist **A**, bleibt unverändert und
ist **ab jetzt selbst gesperrt** (SP-A-01, Auflage aus Z-45). Der Hinweis beginnt danach mit „Er";
der Bezug ist die Beschriftung darüber, und `fieldParts` gibt sie als **Namen** vor der
**Beschreibung** aus — sichtbar wie vorgelesen, kein Bruch. UM-A-01 bleibt offen und bezieht sich
von jetzt an auf den einen Satz.

**Der Zwilling ist mitgefallen, und das ist der eigentliche Gegenstand dieses Eintrags.** Er ist
**F-2 aus T-165**; in derselben Tabelle steht **F-3** — „Dieser Text wird exportiert." am
Leistungsfeld, dieselbe Begründung, dieselbe Bedingung. Diese Aufnahme hat F-2 hierher gestellt und
F-3 in SP-A-05 als gesperrt geführt. Beide fallen deshalb in **einem** Handgriff; die Bauart des
Fehlers steht in Abschnitt 4.1, die Ausführung in Abschnitt 8.6.

E-087 gemessen: weder „Interner Vermerk des Todos" noch „Dieser Text wird exportiert" noch „Er geht
nicht in die Abrechnung" kommt in `tests/**`, `apps/*/test/**` oder den `*.mjs`-Läufen vor.

---

## 7. Die Umbauliste

Jeder Eintrag nennt seinen Träger. **T3 Handbuch kommt nicht vor** (AB-2).

### UM-A-01 — Der Vermerkhinweis erscheint, wenn im Vermerk etwas steht

**Träger: T1 Zustandsbindung.**

`TaskPane.tsx:634`. „Er geht nicht in die Abrechnung." zählt in dem Augenblick, in dem der
Benutzer Text in das Feld bringt — von Hand oder über „Inhalt der E-Mail übernehmen". Solange das
Feld leer ist, erklärt der Satz eine Grenze an einem Feld ohne Inhalt.

```
hint={note.length > 0 ? 'Er geht nicht in die Abrechnung.' : undefined}
```

**Symmetrie (E-078 Nachtrag Punkt 8, zu messen):** `fieldParts` nimmt `hint` als *vorhanden oder
nicht*; fällt der Hinweis, fällt auch der Verweis aus `aria-describedby`, und beide fallen in
derselben Rechnung. Blick und Gehör laufen nicht auseinander. Das ist **zu messen** und nicht
zuzusichern — `proof:addin` Abschnitt 19a kann es über `fieldParts('note', undefined, undefined)`
und `fieldParts('note', '…', undefined)` in zwei Zeilen.

**Gegenrede:** Ein Hinweis, der beim ersten Zeichen erscheint, springt. Der Prüfer entscheidet, ob
das die richtige Bedingung ist oder ob sie an „Inhalt der E-Mail übernehmen" hängen soll (dann
T2).

### UM-A-02 — Die Einmaligkeit des Tokens steht an dem Feld, an dem sie zählt

**Träger: T2 Handlungsbindung.**

Hängt an ST-A-04. Fällt die Aufzählung, wandert ihr **A** („Es wird genau einmal angezeigt.")
dorthin, wo es gebraucht wird: an die Fläche, die nach dem Übernehmen erscheint, oder an den
Hinweis des Feldes. Ohne diesen Umbau ist ST-A-04 eine Streichung eines **A** und damit
unzulässig.

### UM-A-03 — Der Vermerk-Übernahmeknopf sagt, was er anrichtet, wenn er etwas anrichtet

**Träger: T1 Zustandsbindung.**

`TaskPane.tsx:648-656`. „Inhalt der E-Mail übernehmen" **überschreibt** einen bereits getippten
Vermerk kommentarlos — eine **Folge**, die heute nirgends steht. Das ist kein Streichbefund,
sondern die Umkehrung: hier fehlt ein Satz.

```
{note.length > 0 ? <p className="pane-note">Ersetzt den Text im Vermerk.</p> : null}
```

**Zu entscheiden vom Prüfer:** ob das die richtige Antwort ist oder ob der Knopf anhängen statt
ersetzen soll. Ich schlage nichts vor, was das Verhalten ändert — das wäre keine Textaufgabe.

### UM-A-04 — Der Hinweis am Feld „Erprobte Muster" hängt an der Liste, die er beschreibt

**Träger: T1 Zustandsbindung.**

`SettingsView.tsx:309`, „Deckt den Normalfall ab. Alle Beispiele sind erfunden." Satz 2 ist **A**
und gesperrt (SP-A-09). Satz 1 gilt nur, solange ein Muster **aus dem Vorrat** gewählt ist; steht
dort „— eigenes Muster —", ist er falsch.

```
hint={istAusDemVorrat ? 'Deckt den Normalfall ab. Alle Beispiele sind erfunden.'
                      : 'Alle Beispiele sind erfunden.'}
```

---

## 8. Was gebaut ist

**8.1 bis 8.5 sind in T-182 gebaut, 8.6 in T-196.** Für alle gilt dasselbe: Kein Eintrag hat einen
Prüfpunkt, keiner steht in einem Prüfpfad an seinem Wortlaut, keiner verliert eine Auskunft. Für
8.1 bis 8.5 war der Befund nur **D**; 8.6 nimmt zusätzlich zwei **S**-Sätze mit, die eine
Beschriftung wiederholen.

### 8.1 `describeDetection` sagt jeden Fall einmal statt zweimal

`TaskPane.tsx`. Der Bereich „Call-Nummer" trug seine Auskunft **zweimal übereinander**: einmal als
Zeile unter der Überschrift (`Section.description`), einmal als Fläche darunter (`Callout`). In
**vier von sechs** Erkennungsfällen war das dieselbe Aussage, zweimal fast Wort für Wort und
einmal zeichengleich.

| Fall | vorher, Zeile | vorher, Fläche | nachher |
|---|---|---|---|
| `implausible` | `REJECTION_LABEL[reason]` | „Gefunden, aber nicht übernommen" + Rohwert + **`REJECTION_LABEL[reason]`** | Zeile entfällt |
| `pattern_invalid` | „Der Ausdruck in den Einstellungen ist nicht verwendbar." | „Der Ausdruck lässt sich nicht verwenden" | Zeile entfällt; der **Ort** wandert in die Überschrift: „Der Ausdruck **in den Einstellungen** lässt sich nicht verwenden" |
| `timeout` | „Die Erkennung wurde abgebrochen." | „Erkennung abgebrochen" | Zeile entfällt |
| `unavailable` | „Automatische Erkennung steht hier nicht zur Verfügung." | „Keine automatische Erkennung" | Zeile entfällt |
| `match` | „Aus dem Betreff erkannt." | — | bleibt |
| `no_match` | `NO_CALL_NUMBER_FOUND` | — | bleibt |

Gefallen ist die **Kopie**: Die Fläche ist die reichere Auskunft — sie trägt den Rohwert, die
Meldung der Laufzeitumgebung und den Ausweg. Die Zeile war ihre Zusammenfassung.

`DetectionLine.help` ist dafür `string | undefined` geworden und `Section.description`
entsprechend `string | undefined` (`exactOptionalPropertyTypes`). Der Zweig `default` gab bisher
`''` zurück — für `Section` ein Text, dem sie einen leeren Absatz mit dem Abstand einer Zeile
baute. Auch das ist jetzt `undefined`; dieselbe Unterscheidung, die `fieldParts` seit T-158
trifft.

### 8.2 Der Ausweg „von Hand eintragen" steht einmal statt zweimal

Er stand in zwei einander ausschließenden Zweigen von `describeDetection`, einmal mit „hier" und
einmal ohne. Zwei Fassungen einer Aussage laufen auseinander, sobald jemand eine anfasst — der
Befund, den T-169 eine Funktion weiter oben behoben hat.

Neu: `callnumber/labels.ts` → `CALL_NUMBER_BY_HAND = 'Die Call-Nummer lässt sich von Hand
eintragen.'`, gelesen von beiden Zweigen. Derselbe Ort und dieselbe Bauart wie
`NO_CALL_NUMBER_FOUND`; die Datei trägt ihren M-02-Kopfkommentar bereits.

### 8.3 „Es wird genau einmal angezeigt." steht einmal statt zweimal — auf demselben Bildschirm

`SettingsView.tsx:219` gegen `:412`. Beide gleichzeitig sichtbar. Die Kopie am Feld fällt; der
Schritt bleibt, wo die Handlung geschieht.

```
vorher  hint="Das Token erzeugen Sie in Takt unter Einstellungen. Es wird dort genau einmal angezeigt."
nachher hint="Das Token entsteht in Takt unter Einstellungen."
```

Zugleich **anredefrei** (E-080 Punkt 4): „entsteht" sagt dasselbe wie „erzeugen Sie" und ist
kürzer.

### 8.4 Der Verbindungszustand steht zweimal statt dreimal

`TaskPane.tsx:319`. Über dem Satz standen die Bereichsüberschrift „Noch nicht verbunden" und die
Überschrift der Fläche „Das Token fehlt." — dann sagte der Rumpf „Takt und das Add-in kennen sich
noch nicht." und erst danach, was zu tun ist.

```
vorher  Takt und das Add-in kennen sich noch nicht. Das Token finden Sie in Takt unter
        Einstellungen; von dort wird es einmalig hier eingetragen.
nachher Das Token finden Sie in Takt unter Einstellungen; von dort wird es einmalig hier
        eingetragen.
```

### 8.5 E-080: die siebte Stelle

`callnumber/pattern.ts:89`, siehe Abschnitt 5.

```
vorher  Der Ausdruck ist leer. Trage ein Muster ein oder wähle eines aus der Liste.
nachher Der Ausdruck ist leer. Ein Muster steht in der Liste darüber, oder es lässt sich hier
        eintragen.
```

**Ohne Anrede** (E-080 Punkt 4). Der Satz bleibt **B** und fällt nicht.

### 8.6 Drei Streichungen und eine halbierte Freigabe, wieder ganz gemacht (T-196)

Grundlage: **Z-42, Z-44 und Z-45** aus `.claude/team/reports/T-195-spec-ux-reviewer.md`. Drei
Einträge dieses Papiers, dazu ein Satz, der in keinem stand.

| Ort (heute) | vorher | nachher | Eintrag |
|---|---|---|---|
| `Primitives.tsx:257` | `title: 'Standard-Tag aus den Einstellungen (A-9.3)'` | `title: 'Standard-Tag aus den Einstellungen'` | ST-A-03 / Z-42 |
| `Primitives.tsx:261` | `title: 'Dieses Tag gibt es in Takt noch nicht. Es entsteht zusammen mit dem Todo.'` | `title: 'Entsteht zusammen mit dem Todo.'` | ST-A-06 / Z-44 |
| `TaskPane.tsx:662` | `hint="Interner Vermerk des Todos. Er geht nicht in die Abrechnung."` | `hint="Er geht nicht in die Abrechnung."` | ST-A-08 / Z-45, **= F-2 aus T-165** |
| `TaskPane.tsx:834` | `hint="Dieser Text wird exportiert. Text aus der E-Mail gehört in den Vermerk, nicht hierher."` | `hint="Text aus der E-Mail gehört in den Vermerk, nicht hierher."` | **kein Eintrag dieses Papiers — F-3 aus T-165** |

**Die vierte Zeile ist der Grund, aus dem die dritte nicht allein laufen durfte.** F-2 und F-3 sind
**eine** Freigabe aus **einer** Tabelle mit **einer** Begründung. Wäre nur ST-A-08 gefallen,
stünden danach zwei identische Befunde auf zwei verschiedenen Listen — einer ausgeführt, einer
gesperrt —, und nirgends stünde, dass die Hälfte einer Freigabe zurückgenommen wurde. Die Bauart
ist in Abschnitt 4.1 aufgeschrieben, damit sie beim nächsten Mal auffällt.

**Was ausdrücklich stehen bleibt:**

- „**Text aus der E-Mail gehört in den Vermerk, nicht hierher.**" — SP-A-05, B-12.3, R-08. Er ist
  die einzige Stelle dieser Fläche, die verhindert, dass Text aus einer fremden E-Mail in eine
  Rechnung wandert. Er trägt jetzt allein; „exportiert" steht sichtbar in der Beschriftung darüber.
- „**Er geht nicht in die Abrechnung.**" — ab jetzt SP-A-01. „bleibt in Takt" nennt den **Ort**,
  dieser Satz nennt das **Ziel, das der Text nicht erreicht**, und das ist die Aussage aus A-7.2.
- **SP-A-12** (`TagPicker.tsx:330`), an dem ST-A-06 hängt. Zeichengleich gemessen.

**E-087, vor der Änderung gemessen** (2026-09-06, Arbeitsbaum auf `versionspruefung-gegen-github`):
Keine der fünf betroffenen Zeichenketten — „Standard-Tag aus den Einstellungen", „Dieses Tag gibt
es in Takt noch nicht", „Interner Vermerk des Todos", „Dieser Text wird exportiert", „Text aus der
E-Mail gehört in den Vermerk" — steht in `tests/**`, in `apps/*/test/**` oder in einem
`*.mjs`-Lauf. Die einzigen Träger waren die Quelldateien selbst und dieses Papier.

**Nachweis:** `pnpm typecheck` 0; `pnpm test` 1456 grün in 76 Dateien, vorher wie nachher;
`proof:addin` 224/0; `proof:taskpane` 25/0; `proof:codepoints` 45/0 — jeweils vorher und nachher
dieselben Zahlen.

**Nicht gebaut: ST-A-05.** Siehe dort — zwei Vorbedingungen, e2e-tester und ui-designer.

### 8.7 Die letzte Duz-Stelle, und zwei Sätze bekommen einen Wächter (T-199)

Zwei Aufträge, ein Lauf: **O-HM** (die Dreierfolge aus Abschnitt 5) und **O-HO** (die ungemessene
Sperre aus Abschnitt 4).

| Ort | vorher | nachher | Eintrag |
|---|---|---|---|
| `ui/App.tsx`, Hinweisfläche unter „Keine E-Mail geöffnet" | `title="Öffne eine E-Mail, um daraus ein Todo anzulegen."` | `title="Öffnen Sie eine E-Mail, um daraus ein Todo anzulegen."` | O-HM / E-080 Punkt 1 |
| `scripts/proof-addin.mjs` | `IMPERATIV_AUSNAHME` — ein Satz, den der Anredewächter herausrechnet | gelöscht; der Wächter misst den ganzen Bestand | O-HM / O-GE |
| `scripts/proof-addin.mjs` | die Sperrliste stand nur in diesem Papier | Abschnitt 20: SP-A-01, SP-A-05, SP-A-12 zeichengleich, mit Gegenprobe | O-HO |

**Zum Wortlaut: genommen ist die Sie-Form, nicht eine anredefreie Fassung** — und das gegen die
eigene Vorliebe von E-080 Punkt 4, deshalb mit Begründung. Der Prüffall in
`tests/e2e/outlook-addin-build.spec.ts` hängt seit T-192 an dem Teilstring „eine E-Mail, um daraus
ein Todo anzulegen." (Hoheit e2e-tester). Jede Fassung, die diesen Teil aufgibt, macht dort eine
fremde Zusicherung blind, ohne sie rot zu machen — der Fall steht in einer `or`-Verbindung mit dem
Zustand „Kein Outlook" und bliebe grün. Damit bleibt nur der **Satzanfang** verhandelbar, und
ohne Anrede ergeben sich dort ausschließlich Zustandssätze: „Es fehlt …", „Es braucht …", „Noch
fehlt …". Die sind **nicht kürzer** als „Öffnen Sie " (elf Zeichen gegen neun bis elf), und sie
sagen etwas **anderes**: Die Bereichsüberschrift darüber nennt den Zustand bereits („Keine E-Mail
geöffnet"); ein zweiter Zustandssatz an dieser Stelle wäre genau der D-Befund, den ST-A-01 für
diese Fläche ohnehin führt. Eine Aufforderung durch eine Doppelung zu ersetzen ist keine kürzere
Fassung derselben Aussage. **Wer die Anrede hier ganz loswerden will, streicht die Überschrift der
Hinweisfläche — das ist ST-A-01 und braucht spec-ux-reviewer und e2e-tester.**

**Die Selbstauflösung ist gemessen, nicht angenommen.** Der Lauf wurde in drei Zuständen gefahren:

| Zustand | Wächterstand | `proof:addin` |
|---|---|---|
| Satz umgestellt, `IMPERATIV_AUSNAHME` **noch da** (Schritt 3 fehlt) | vor T-199, 224 Fälle | **223 / 1** — „die geduldete Stelle steht noch da" fällt, genau wie T-190 es gebaut hat |
| Ausnahme gelöscht, Satz **noch in der Du-Form** (Schritt 2 fehlt) | nach T-199, 228 Fälle | **226 / 2** — der Imperativwächter **und** sein Nachfolger fallen |
| beide Schritte gegangen | nach T-199, 228 Fälle | **228 / 0** |

Beide roten Läufe sind an der ausgelieferten Datei gefahren und zeichengleich zurückgenommen;
der Vergleich gegen `HEAD` zeigt danach an diesen Stellen keine Abweichung.

An die Stelle des selbstauflösenden Prüffalls tritt ein dauerhafter: Die Du-Fassung darf im ganzen
Bestand nicht mehr vorkommen, die neue Fassung muss **genau einmal** dastehen, und sie muss selbst
weder duzen noch ein Imperativ sein. Ohne die zweite Hälfte wäre der Abschnitt am grünsten, wenn
die Hinweisfläche ganz fehlte.

**O-HO — die Zusage bekommt einen Wächter.** Gemessen wird in `proof:addin` Abschnitt 20:

- **Zeichengleich**, weil eine Umschreibung der Weg ist, auf dem so ein Satz verschwindet. Jeder
  gesperrte Text muss genau **einmal** dastehen; eine zweite Fassung wäre der E-078-Befund.
- **Mit Gegenprobe, und einzeln.** Für jeden Eintrag wird eine plausible Verletzung in eine Kopie
  der Quelle gesetzt — „Er bleibt intern." statt „Er geht nicht in die Abrechnung.", `label="Vermerk"`
  statt `label="Vermerk (bleibt in Takt)"` —, und gefunden werden muss genau dieser Eintrag und
  kein zweiter. Ein Sucher, der bei jeder Änderung alles meldet, wird beim ersten Fehlalarm
  gelockert.
- **Die Abhängigkeit ST-A-06 → SP-A-12 als Rechnung**, nicht als zwei Behauptungen: Die gekürzte
  Chip-Erklärung ist nur gedeckt, solange der Auswähler die Folge ausspricht (Auflage 1 aus Z-44).
  Wird die Kürzung zurückgenommen, darf der Satz drüben fallen — deshalb eine Folgerung und kein
  „beides muss dastehen". Beide Richtungen sind gegengeprobt.

**Am Baum gegengeprobt, nicht nur im Arbeitsspeicher:** Eine echte Änderung an
`TaskPane.tsx` („Er bleibt intern.") ergab 226/2, das Streichen der Folge in `TagPicker.tsx` 224/4
— darunter die Abhängigkeitsrechnung. Beide Änderungen sind zeichengleich zurückgenommen; der
Vergleich gegen `HEAD` zeigt an diesen Stellen keine Abweichung.

**Nachweis:** `pnpm typecheck` 0; `pnpm test` 1456 grün in 76 Dateien; `proof:addin` **228/0**
(vorher 224/0, vier neue Prüffälle); `proof:taskpane` 25/0; `proof:codepoints` 45/0.

**Nicht gebaut: ST-A-05 und ST-A-01.** Beide warten weiter auf ihre Vorbedingungen.

### Was Abschnitt 8 **nicht** angefasst hat

Die aria-Verdrahtung aus T-158. Kein `Field` ist entstanden oder verschwunden; der Wächter zählt
weiterhin zwölf, Hinweis und Fehler bleiben gleichzeitig erreichbar. Der Fristsatz steht
unverändert (**V-04 aus T-165**, SP-A-02). Die fünf Sperrgründe stehen unverändert. Über das
Add-in entstehen weiterhin keine Anhänge, und kein Exportschlüssel hat sich bewegt.

Für T-196 kam eines dazu: **die letzte Duz-Stelle in `ui/App.tsx` war nicht angefasst** (O-GE,
Abschnitt 5), weil sie in `tests/e2e/outlook-addin-build.spec.ts` wörtlich als Suchtext stand und
die Reihenfolge bindend war. **In T-199 ist sie gegangen** — Abschnitt 8.7. Damit ist die Ausnahme
gelöst; was von ihr bleibt, ist der alte Wortlaut als **Gegenprobe** im Wächter, damit er die
eigene Vergangenheit wiederfindet.

Für T-199 kommt dafür anderes dazu: **kein Exportschlüssel, keine Route und kein Feld haben sich
bewegt.** Die aria-Verdrahtung aus T-158 steht, der Wächter zählt weiterhin zwölf Felder; der
Fristsatz ist unverändert (V-04, SP-A-02); über das Add-in entstehen weiterhin keine Anhänge. Die
vier neuen Prüffälle aus Abschnitt 20 lesen ausschließlich Quelltext und rufen keine neue Fläche
auf.

---

## 9. Was diese Aufnahme nicht beantwortet

1. **Der Fristhinweis braucht eine Fassung für zwei Flächen** (E-078 Nachtrag Punkt 7, SP-04
   drüben gegen SP-A-02 hier). Das ist kein Auftrag, den eine Seite allein erledigen kann: Wer
   zuerst kürzt, erzeugt die Abweichung, die der Punkt verhindern soll. Zeitpunkt laut E-078:
   die Wiedervorlage V-03/V-04 in T-165.
2. **Drei Sätze stehen zeichengleich in zwei Häusern.** `callnumber/labels.ts` und
   `routes/addin/index.ts` führen je fünf Ablehnungsgründe für eine **eingetragene** Call-Nummer,
   und drei davon sind Wort für Wort identisch — zwei sind bereits auseinandergelaufen. Der
   richtige Ort für die eine Fassung ist `@takt/domain`, wo `DUE_DATE_MESSAGE` denselben Weg
   schon geht. Das ist domain-devs Hoheit; siehe Abschnitt 10, offene Frage 2.
3. **Ob die Rundungsauskunft auf der Bestätigung fällt** (ST-A-02) — Vorlage bei
   spec-ux-reviewer, weil T-038 sie ihm vorgelegt hat.
4. **Ob die beiden Zustandsflächen ihre Überschrift verlieren** (ST-A-01) — Vorlage bei
   spec-ux-reviewer **und** eine Zeile bei e2e-tester.
5. **Was Hierarchie und Dichte des Aufgabenbereichs dazu sagen.** E-078 Punkt 4 verlangt
   ui-designer vor der Umsetzung. Für `apps/web` liegt das als `textabbau-gestalt.md` vor; für
   diese Fläche liegt es nicht vor. Die Einträge in Abschnitt 6 und 7 sind deshalb Vorlagen und
   keine Aufträge.

   **Nachtrag T-196, mit der Linie aus Z-46:** Ein Wortlaut, der an seiner Stelle und in seiner
   Textsorte kürzer wird, ändert weder Hierarchie noch Dichte und geht ohne ui-designer. Ein
   **zugänglicher Name**, der die Größe eines Bedienelements ändert, ändert beides und geht nicht.
   Danach sind ST-A-03, ST-A-06 und ST-A-08 gebaut und ST-A-05 liegen geblieben. Die Frage, ob
   diese Fläche insgesamt ein eigenes `textabbau-gestalt.md` braucht, bleibt offen — für ST-A-01,
   ST-A-02, ST-A-04 und die vier Umbauten ist sie zu beantworten, für die drei gebauten war sie es
   nicht.

---

## 10. Umsetzungsreihenfolge

| Welle | Was | Voraussetzung |
|---|---|---|
| **AA (T-182)** | Abschnitt 8.1 bis 8.5 — die reinen D-Fälle | keine — erledigt |
| ~~**AA+1**~~ | ~~ST-A-03, ST-A-05, ST-A-06, ST-A-08 — vier Streichungen ohne Prüfpunkt und ohne fremde Datei~~ | **berichtigt, siehe unter der Tabelle** |
| **AC (T-196)** | ST-A-03, ST-A-06, ST-A-08 **und der Zwilling F-3 aus `TaskPane.tsx`** — drei Streichungen ohne Prüfpunkt und ohne fremde Datei, **gemessen** | erledigt, Abschnitt 8.6 (Z-42, Z-44, Z-45 aus T-195) |
| **offen** | **ST-A-05** | **zwei** Vorbedingungen: **ui-designer** (E-078 Punkt 4, ein Knopfname von 38 auf 12 Zeichen ist Dichte) **und e2e-tester** (`tests/e2e/outlook-addin-build.spec.ts` und `docs/testplan.md` führen den heutigen Knopftext) — in **einem** Auftrag mit integration-dev |
| ~~**AA+1**~~ | ~~ST-A-01 + der Wächter aus Abschnitt 5~~ | **halb erledigt, siehe unter der Tabelle** |
| **AC/AD (T-190, T-192, T-199)** | **der Wächter aus Abschnitt 5** — geschärft (T-190), Wortlaut gelöst (T-192), Satz umgestellt und Ausnahme gelöscht (T-199) | erledigt, Abschnitt 8.7 |
| **offen** | **ST-A-01** | Zustimmung von spec-ux-reviewer **und** e2e-tester — die Überschrift der Hinweisfläche zu streichen nimmt dem Prüffall dort seinen Suchtext |
| **AA+2** | ST-A-02 | Zustimmung von spec-ux-reviewer (T-038) |
| **AA+2** | ST-A-04 + UM-A-02 als ein Handgriff | Zustimmung, weil ein **A** wandert |
| **AA+2** | UM-A-01, UM-A-04 | Zustimmung; Symmetrie ist zu **messen** (E-078 Nachtrag Punkt 8) |
| **AA+3** | UM-A-03 | Entscheidung, ob „übernehmen" ersetzt oder anhängt — das ist Verhalten, nicht Text |
| **nie** | ST-A-07 ohne Gegenrede; irgendein Eintrag der Sperrliste ohne seinen Prüfer; ein vierter Träger der Offenlegung | — |

### Berichtigung der zweiten durchgestrichenen Zeile (T-199)

Die Zeile bündelte **zwei** Vorhaben, die nur eine Datei gemeinsam haben: die Streichung der
Überschrift (ST-A-01) und die Schärfung des Anredewächters. Der Wächter brauchte von e2e-tester
**eine** Zeile — den Wortlaut lösen —, ST-A-01 braucht dort eine **Streichung** und dazu die
Zustimmung von spec-ux-reviewer. Das ist nicht dieselbe Vorbedingung, und in einer Zeile sah es so
aus. Sie bleibt aus demselben Grund durchgestrichen stehen wie die erste: **Wer bündelt, misst
jeden Eintrag einzeln.**

### Berichtigung der durchgestrichenen Zeile (T-196)

Die Zeile hat **vier** Einträge als „ohne Prüfpunkt und ohne fremde Datei" angekündigt. **Für drei
stimmt das; für ST-A-05 ist es gemessen falsch.** Sein Knopftext steht in
`tests/e2e/outlook-addin-build.spec.ts` als `getByRole`-Name und in `docs/testplan.md` — beide
fremde Dateien, beide Hoheit e2e-tester, und **TP-BUILD-04 ginge rot**.

Die Zeile bleibt durchgestrichen stehen statt ersetzt zu werden, weil die Berichtigung sonst
unsichtbar wäre: Eine Umsetzungsreihenfolge, die vier Einträge in einer Zeile bündelt, verspricht
ihnen eine gemeinsame Vorbedingung, die sie nicht haben. **Vier Einträge in einer Zeile sind eine
Behauptung über vier Messungen.** Wer bündelt, misst jeden einzeln — sonst erbt der eine, der eine
fremde Datei hat, die Harmlosigkeit der drei anderen.
