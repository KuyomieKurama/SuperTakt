Aufgabe: T-035 — Die Oberfläche auf die zwei neuen Routen ziehen (E-049, E-051), der
vierte Anzeigezustand (E-050) und der Auswahlfehler im Tag-Baum (Befund aus T-012)

Status: fertig

---

Artefakte:

```
apps/web/src/lib/exportTemplateModel.ts    497 (vorher 553) — oberer Teil ersatzlos gestrichen,
                                           `readSourceCatalog` an seine Stelle
apps/web/src/api/types.ts                  `ExportSourceCatalog` und seine vier Teiltypen;
                                           `ExportPreview.templateSource`, `templateId`/
                                           `templateName` nullable
apps/web/src/api/endpoints.ts              `getExportSources()`, `previewExportDraft()`
apps/web/src/screens/TemplateFields.tsx    657 — Quellen, Transformationen, Vergleiche und der
                                           Grenzsatz kommen als Prop herein; `SourceOptions` neu
apps/web/src/screens/TemplatePreview.tsx   650 — schickt den Entwurf statt einer Kennung,
                                           entprellt, mit eigenem Lade-, Leer- und Fehlerzustand
apps/web/src/screens/TemplatesScreen.tsx   942 — lädt Vorlagen und Liste in einem Zug, reicht
                                           sie durch, meldet einen Notizpfad in der Antwort
apps/web/src/components/ExportStatus.tsx   227 — vierter Anzeigezustand `not_billed`
apps/web/src/components/Icon.tsx           `slash-circle`
apps/web/src/components/BookingTable.tsx   Zeilenklasse über `slug`, eigener Etikettzusatz
apps/web/src/components/Kanban.tsx         vierte Zahl in der Zusammenfassung
apps/web/src/app/exportSummary.ts          vierter Zähler
apps/web/src/app/GlobalSearch.tsx          Markertyp statt Zeichenkettenaufzählung
apps/web/src/screens/BookingsScreen.tsx    Sortierung nach Anzeigezustand, zustandsgenaue
                                           Sperrbegründungen, Symbol „Nicht abrechnen"
apps/web/src/screens/TodoDetailScreen.tsx  dieselben beiden Punkte
apps/web/src/screens/TodoListScreen.tsx    Summentyp statt Zeichenkettenaufzählung
apps/web/src/styles/components.css         `.badge--not-billed`, `.status-marker--not-billed`,
                                           `.table__row--not-billed` — kein roher Farbwert
apps/web/scripts/contrast-check.mjs        fünf neue Paare (× 2 Modi)
apps/web/src/showcase/*                    vierter Zustand in Musterseite, Merkmalstabelle,
                                           Inventar, Farbtafel; neue Karte `#nicht-abgerechnet`;
                                           Tag-Baum-Verhalten beschrieben
apps/web/src/components/TagTree.tsx        Auswählen und Aufklappen getrennt (Befund aus T-012)
```

`packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `tests/e2e/**` und `apps/web/test/**`
**unangetastet**. `apps/desktop/**` ebenfalls — es war nichts zu tun. Keine neue Abhängigkeit,
`pnpm-lock.yaml` unverändert, kein `any`, keine Typzusicherung mit `as` auf einen Fachwert.
`SettingsScreen.tsx:150` (Exportordner als Freitextfeld) **nicht angefasst**, wie angewiesen.

---

Zusammenfassung:

**E-049 — die fünfte Doppelung ist weg.** `lib/exportTemplateModel.ts` kennt keine einzige
Feldquelle mehr beim Namen. Gestrichen sind `ExportSourcePath` als Vereinigung, `SOURCE_INFO`,
`SOURCE_GROUPS`, `SOURCE_PATHS`, `TRANSFORMATION_INFO`, `TRANSFORMATIONS`,
`CONDITION_OPERATOR_LABEL`, `CONDITION_OPERATORS`, `NOTE_BOUNDARY_HINT` und `isExportSourcePath` —
zwölf Beschriftungen, zwölf Beschreibungen, drei Gruppenerklärungen, drei Transformationstexte,
zwei Vergleiche und der Satz zur Notiz-Grenze. An ihre Stelle tritt `readSourceCatalog`, das die
Antwort von `GET /export/sources` entgegennimmt und daraus Nachschlagetabellen macht.

Damit sind auch die letzten Werte verschwunden, die die Liste noch zitiert hätten: Ein neues Feld
startet mit `catalog.firstSource` und `catalog.firstTransformation` statt mit `"todo.callNumber"`
und `"raw"`, eine neue Bedingung mit `catalog.firstConditionOperator` statt mit `"is_set"`, und
der Rückfall in `defaultTransformationFor` ist die erste Transformation der Antwort statt eines
getippten `"raw"`. `parseTemplateDefinition` prüft gegen die geholte Liste, wörtlich und ohne
Normalisierung.

**Die Zusicherung ist geblieben, hat aber die Ebene gewechselt** — das ist die einzige Abweichung
vom Auftrag, und sie ist erzwungen: `NoteSourceIsAbsent` war eine `Assert<…>`-Konstruktion über
genau die Vereinigung, die jetzt gestrichen ist. Über `string` behauptet sie nichts. Sie hängt
deshalb nicht mehr am Übersetzer, sondern an der **Antwort**: `readSourceCatalog` entfernt jeden
gelieferten Pfad, der auf jeder Ebene nach Vermerk aussieht, aus der Auswahl und legt ihn in
`rejectedNoteSources`; `noteSourceIsAbsent(catalog)` trägt den Namen weiter, und S-14 spricht den
Befund als Fehlermeldung aus, statt still zu filtern. Das ist genau der Fall, den der Auftrag
genannt hat („dass die Antwort je etwas enthält, was sie nicht enthalten darf") — und ein
Typausdruck hätte ihn nie abdecken können. Das Muster prüft den **Anfang eines Segments**, damit
`group.bookingNotes` nicht mitgefangen wird; nachgemessen, siehe unten.

**E-051 — die Vorschau nimmt den Entwurf, der Hinweissatz ist weg.** `TemplatePreview` schickt bei
jeder Änderung `{ definition, timeEntryIds }` — nie eine Kennung, deshalb zwei getrennte
Funktionen `previewExport` und `previewExportDraft` statt eines Parameters, den man falsch füllen
kann. Der Rumpf entsteht aus demselben `toDefinitionBody`, das auch speichert. Die beiden
InlineMessages „Diese Vorschau zeigt den gespeicherten Stand" und „Die Vorschau wartet auf das
erste Speichern" sind **ersatzlos gestrichen**; was bleibt, ist eine Zeile, die sagt, ob der
gezeigte Stand schon gespeichert ist, und ein Satz aus `templateSource`.

Entprellt mit 400 ms, und beim Nachziehen bleibt der alte Stand stehen (`RefreshHint`) — dieselbe
Regel wie in `useAsync`. Eine Vorschau, die bei jedem Tastenanschlag auf eine Ladefläche
zurückfällt, ist genau dann leer, wenn man auf sie schaut. Neu hinzugekommen sind vier Zustände,
die es vorher nicht gab und die A-8.7 erst benutzbar machen: „Noch kein Feld, also keine Zeile"
(der Dienst weist eine leere Feldliste ab — gemessen), „Der Dienst rendert Ihren Stand …", „Diese
Vorlage lässt sich so nicht rendern" mit dem Wortlaut des Dienstes und einem Knopf, der wirklich
noch einmal anfragt, und „Diese Vorlage erzeugt keine Zeile".

**Nachgetragen: der Auswahlfehler im Tag-Baum (Befund des e2e-testers aus T-012).** Klick,
Eingabetaste und Leertaste taten auf einem Knoten **mit Kindern** nur eines — auf- und zuklappen.
Auswählen ließ sich so ein Knoten gar nicht, und weil Umbenennen, Verschieben und Löschen in S-08
an der Auswahl hängen, war jeder nicht leere Ordner über den Baum nicht zu bearbeiten (A-4.2,
A-4.4). Der Umbau blieb klein und lag ganz in `TagTree.tsx` plus zehn Zeilen CSS, deshalb habe ich
ihn mitgenommen statt zurückzumelden:

- Das Dreieck ist jetzt ein **eigener Klickbereich** von 24 × 24 Pixeln (SC 2.5.8), hält den Klick
  bei sich (`stopPropagation`) und klappt auf und zu. Ein Knoten **ohne** Kinder bekommt gar
  keinen Umschalter — sonst wären 24 Pixel jeder Blattzeile eine tote Fläche; dort wählt der Klick
  ganz normal aus.
- Klick auf Namen oder Zeile **wählt aus**, auch bei einem Ordner mit Inhalt.
- `Enter` und `Leertaste` **wählen aus**. Auf- und Zuklappen liegt auf Pfeil rechts und links, wo
  die WAI-ARIA Authoring Practices es hinlegen — das funktionierte schon vorher und ist
  unverändert.
- Das Dreieck bleibt `aria-hidden`: Für Hilfsmittel trägt der Knoten selbst `aria-expanded`, und
  bedient wird das über die Pfeiltasten. Ein zweites fokussierbares Element in einem `treeitem`
  wäre gegen das Muster.

**E-050 — „Nicht abgerechnet" als vierter Anzeigezustand.** Abgeleitet aus `exported` bei
Exportzähler 0, in `exportDisplayState` — der einen Stelle, die aus zwei Werten Darstellungen
macht. `exportStatusOf("not_billed")` gibt `exported` zurück; der Filter in S-06 führt weiterhin
genau zwei Werte, und eine ausgebuchte Buchung liegt dort unter „Exportiert".

Der Zustand trägt **bewusst keine eigene Signalfarbe.** Hier ist kein Geld geflossen, es gibt
nichts zu signalisieren — und eine vierte Farbe neben Bernstein, Grün und Rosé hätte die
Deuteranopie-Lage verschlechtert statt verbessert. Er unterscheidet sich stattdessen in sechs
farbunabhängigen Merkmalen: neutrale Fläche, **gestrichelte** Kontur (die anderen drei sind
durchgezogen), waagerechter Balken statt Ring, Scheibe oder Raute, durchgestrichener Kreis als
Symbol, die Beschriftung „Nicht abgerechnet" und der Zusatz „ausgebucht am …" statt eines
Exportdatums, das es nie gab. Die Zeile bekommt eine neutrale, gestrichelte Randschiene und
**keine** grüne Tönung.

Der Vorgang und sein Ergebnis sehen jetzt gleich aus: Der Menüeintrag „Nicht abrechnen" trug bis
eben den Haken — dasselbe Symbol wie „Exportiert" — und trägt nun denselben durchgestrichenen
Kreis, den die Buchung danach in der Liste trägt. Auch die Sperrbegründungen sind
zustandsgenau: Eine ausgebuchte Buchung meldet „Diese Zeit wurde ausgebucht und ist gesperrt" statt
„bereits exportiert", denn exportiert wurde sie nie.

---

Gemessen, nicht behauptet:

**37 von 37 Prüfungen über HTTP gegen den laufenden Dienst** (Wegwerfskript im Scratchpad, echte
migrierte SQLite in einem Wegwerfordner, volle Kette aus Host-, Herkunfts-, Inhaltstyp- und
Tokenprüfung). Geprüft wurden genau die Rumpfformen, die `endpoints.ts` erzeugt:

- `GET /export/sources`: zwölf Quellen mit `path`/`group`/`label`/`description`, drei
  Transformationen mit `value`/`label`/`effect`, zwei Vergleiche, `noteBoundaryHint` als Satz,
  jede Quelle in einer Gruppe, die auch in `groups` steht. **Kein Notizpfad auf der Liste**, und
  `group.bookingNotes` wird von meinem Muster **nicht** fälschlich gefiltert.
- `POST /export/preview` mit `templateId: null` → `templateSource: 'stored'`, Kennung und Name
  belegt.
- `POST /export/preview` mit `definition` → `templateSource: 'draft'`, `templateId` **und**
  `templateName` beide `null`, `rows[0]` trägt die Felder des Entwurfs, `groups` so lang wie
  `rows`. Eine nicht erfüllte Bedingung **lässt den Schlüssel weg**, statt ihn leer zu setzen.
- Kennung **und** Definition → **422**. Deshalb zwei Funktionen und kein gemeinsamer Parameter.
- Ein Entwurf mit `todo.note` wird von der Vorschau abgewiesen — mit **demselben Schlüssel und
  demselben Satz** wie beim Speichern, an beide Routen geschickt und verglichen. Eine leere
  Feldliste ebenfalls; daher der eigene Leerzustand in der Vorschau.
- Nach allen Vorschauen: gleich viele Vorlagen, kein Exportlauf, Buchung weiterhin `open` mit
  Zähler 0. Die Vorschau schreibt nichts.
- `POST /time-entries/{id}/not-billed` → 200, Status `exported`, **Zähler bleibt 0**, und die
  Buchung erscheint weiterhin im Filter `exportStatus=exported`. Das ist die Ableitung hinter
  E-050, an der Quelle gemessen.

**21 von 21 Prüfungen im echten Chromium zum Tag-Baum.** Gefahren gegen die **gebaute
Musterseite**, statisch ausgeliefert auf einem freien Port — sie braucht keinen Dienst, und ich
komme damit weder Port 17843 noch 5173 des e2e-testers in die Quere. Gemessen: Klick auf den Namen
setzt `aria-selected` und lässt `aria-expanded` in Ruhe; Klick auf das Dreieck kehrt
`aria-expanded` um und lässt die Auswahl in Ruhe; das Dreieck misst mindestens 24 × 24 CSS-Pixel;
Pfeil rechts und links klappen auf und zu; Eingabe- und Leertaste wählen aus, **ohne** umzuklappen;
ein Blatt verhält sich unverändert und sein Dreiecksplatz ist keine tote Fläche; der fokussierte
Knoten trägt bei Tastaturbedienung einen sichtbaren Ring; keine Konsolenmeldung.

**Gegenprobe dazu:** Mit dem alten Verhalten wieder eingesetzt und neu gebaut fallen **acht** dieser
Prüfungen durch — darunter „aria-selected = true", „aria-expanded unverändert" und „Eingabetaste
wählt den Ordner aus". Der Prüfpfad misst also den Fehler und nicht sich selbst. Danach
zurückgesetzt und neu gebaut: wieder 21 von 21.

**15 von 15 Prüfungen im echten Chromium zu E-050**, ebenfalls an der gebauten Musterseite: vier
Etiketten mit vier Beschriftungen; die vier Zustände unterscheiden sich paarweise in Kontur (nur
„nicht abgerechnet" gestrichelt), im **ganzen** Symbol, in der Beschriftung und in der Punktform;
Schraffur nur bei „erneut offen", Balken nur bei „nicht abgerechnet". Mit eingeschalteter
**Graustufenprobe** bleiben alle vier Erscheinungen verschieden — gemessen an Kontur, Symbol,
Beschriftung und Punktform, also an dem, was übrig bleibt, wenn die Farbe wegfällt. Der Zusatz am
Etikett lautet „ausgebucht am …" und enthält nirgends das Wort exportiert. Keine Konsolenmeldung
auf der ganzen Seite.

**Werkzeuge:** `pnpm typecheck` 0, `pnpm boundaries` 0 („Notiz-Trennung: alle Schichten
unverletzt"), `pnpm build` 0, `pnpm test` **545 von 545 in 33 Dateien**, `pnpm contrast` 0.

**Kontrastausgabe, wörtlich — die sechzehn neuen Paare und die Summe:**

```
== Modus hell ==
OK     6.81:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Etikett Nicht abgerechnet
OK     4.58:1 (min 3.0:1)  --border-strong auf --bg-inset  — gestrichelte Kontur Nicht abgerechnet, SC 1.4.11
OK     5.64:1 (min 3.0:1)  --border-strong auf --bg-surface  — Zeilenmarker Nicht abgerechnet auf Karte
OK     5.49:1 (min 3.0:1)  --border-strong auf --bg-surface-alt  — Zeilenmarker Nicht abgerechnet auf Zebrazeile
OK     5.02:1 (min 3.0:1)  --border-strong auf --bg-subtle  — Zeilenmarker Nicht abgerechnet auf Kanban-Spalte
OK    12.79:1 (min 4.5:1)  --text-primary auf --bg-active  — Dreieck unter dem Zeiger
OK     5.64:1 (min 3.0:1)  --text-muted auf --bg-surface  — Dreieck im Ruhezustand, Zustandsanzeige nach SC 1.4.11
OK     5.11:1 (min 3.0:1)  --text-muted auf --bg-selected  — Dreieck in der ausgewaehlten Zeile
== Modus dunkel ==
OK    10.25:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Etikett Nicht abgerechnet
OK     6.17:1 (min 3.0:1)  --border-strong auf --bg-inset  — gestrichelte Kontur Nicht abgerechnet, SC 1.4.11
OK     5.88:1 (min 3.0:1)  --border-strong auf --bg-surface  — Zeilenmarker Nicht abgerechnet auf Karte
OK     5.56:1 (min 3.0:1)  --border-strong auf --bg-surface-alt  — Zeilenmarker Nicht abgerechnet auf Zebrazeile
OK     5.37:1 (min 3.0:1)  --border-strong auf --bg-subtle  — Zeilenmarker Nicht abgerechnet auf Kanban-Spalte
OK    10.65:1 (min 4.5:1)  --text-primary auf --bg-active  — Dreieck unter dem Zeiger
OK     6.74:1 (min 3.0:1)  --text-muted auf --bg-surface  — Dreieck im Ruhezustand, Zustandsanzeige nach SC 1.4.11
OK     5.67:1 (min 3.0:1)  --text-muted auf --bg-selected  — Dreieck in der ausgewaehlten Zeile

0 von 266 Paaren durchgefallen.
```

250 Paare vorher, 266 jetzt, 0 durchgefallen. Acht der neuen Paare gehören zum vierten
Anzeigezustand, sechs zum Dreieck des Tag-Baums, das jetzt ein eigenes Zeigerziel ist.

---

Für den e2e-Tester — was sich am Klickpfad verschiebt:

1. **S-14, Vorschau:** Die beiden Hinweisbänder „Diese Vorschau zeigt den gespeicherten Stand" und
   „Die Vorschau wartet auf das erste Speichern" **gibt es nicht mehr**. Neu sind die Texte „Noch
   kein Feld, also keine Zeile", „Der Dienst rendert Ihren Stand …", „Diese Vorlage lässt sich so
   nicht rendern" und „Diese Vorlage erzeugt keine Zeile". Wer auf die alten Sätze prüft, prüft
   ins Leere. Zwischen einer Änderung im Editor und der neuen Vorschau liegen **400 ms plus
   Anfrage** — ein Test muss auf den neuen Inhalt warten, nicht auf einen festen Takt.
2. **S-14, Laden:** Vorlagenliste und Auswahlliste kommen in **einem** Ladezustand. Es gibt keinen
   Zwischenschritt mehr, in dem der Editor steht und die Felder leer aussehen.
3. **Etikett einer ausgebuchten Buchung:** heißt „Nicht abgerechnet" statt „Exportiert", mit dem
   Zusatz „ausgebucht am …" statt eines Datums. Betrifft S-06, S-03, S-01, S-05, S-12.
4. **Klassen:** `badge--not-billed`, `status-marker--not-billed`, `table__row--not-billed`. Eine
   ausgebuchte Zeile trägt **nicht** mehr `table__row--exported` und ist nicht mehr grün getönt.
5. **Sortierung nach Spalte „Status"** in S-06 ordnet jetzt vierstufig: offen, erneut offen,
   exportiert, nicht abgerechnet. Vorher fielen die letzten beiden zusammen.
6. **Symbol** des Menüeintrags „Nicht abrechnen": `slash-circle` statt `check-circle`. Die
   Beschriftung ist unverändert.
7. **Sperrbegründungen** im Zeilenmenü sind je nach Zustand ein anderer Satz.
8. **Musterseite:** neuer Navigationseintrag „↳ Nicht abgerechnet (E-050)" und eine neue Karte
   `#nicht-abgerechnet`. Die Merkmalstabelle in Abschnitt 2 hat eine fünfte Spalte.
9. Neue Route in Benutzung: `GET /api/v1/export/sources`, beim Öffnen von S-14.
10. **S-08, Tag-Baum:** Ein Klick auf einen Ordner **wählt ihn jetzt aus**, statt ihn auf- oder
    zuzuklappen. Wer aufklappen will, klickt das Dreieck oder drückt Pfeil rechts. Ein Prüfpfad,
    der bisher auf den Ordnernamen geklickt hat, um seine Kinder zu sehen, muss auf
    `.tree__twisty` klicken oder `ArrowRight` drücken. Neue Klasse: `tree__twisty--active`. Die
    Einrückung verschiebt sich um acht Pixel nach rechts, weil das Dreieck von 16 auf 24 Pixel
    gewachsen ist.

---

Annahmen:

1. **Die Vorschau zeigt immer den Stand im Editor, auch wenn nichts geändert wurde.** Damit gibt
   es genau einen Weg statt zweier, und `templateSource` ist dort dann `draft`. Der gespeicherte
   Zweig bleibt in `previewExport` erhalten und wird von S-07 und S-05 benutzt — dort ist die
   **aktive gespeicherte** Vorlage die richtige Auskunft, denn sie ist es, die der Lauf nimmt.
2. **`ExportSourcePath`, `ExportTransformation` und `ExportConditionOperator` sind Aliase auf
   `string`.** Eine Vereinigung wäre die Doppelung gewesen. Der Preis: Der Übersetzer verhindert
   nicht mehr, dass jemand eine Transformation in ein Quellenfeld schreibt. Getragen wird das zur
   Laufzeit — die Auswahllisten bieten nur Werte der Antwort an, `parseTemplateDefinition` weist
   alles andere ab, und der Dienst weist es beim Speichern noch einmal ab. Die Namen bleiben, weil
   sie sagen, **welcher** String gemeint ist.
3. **400 ms Entprellung.** Anzeigeverhalten, keine Fachregel. Lang genug, dass ein getippter
   Feldname eine Anfrage ergibt statt fünfzehn; kurz genug, dass es sich wie eine Rückmeldung
   anfühlt.
4. **`slug` steht in `EXPORT_STATE` ausgeschrieben.** Der Schlüssel folgt dem Ereignisnamen des
   Protokolls (`not_billed`), die CSS-Klasse der Schreibweise des Stylesheets (`not-billed`). Eine
   stille Umwandlung zwischen beiden wäre eine Regel, die man beim Lesen des Markups nicht sieht.
5. **Der Abgleich mit der Standardvorlage benennt die Bedingung jetzt** („steht nur in der Datei,
   wenn Call-Nummer des Todos ist belegt") statt sie nur zu erwähnen. Beide Beschriftungen kommen
   aus derselben Liste, die der Editor anbietet.

---

Risiken:

1. **Der vierte Zustand baut auf keinen eigenen Token, sondern auf `--bg-inset`,
   `--border-strong` und `--text-secondary`.** Der Grund ist meine Dateihoheit:
   `packages/ui-tokens/tokens.css` gehört mir in dieser Aufgabe nicht. Fachlich halte ich das für
   die richtige Wahl — der Zustand *soll* neutral sein —, aber es ist eine Entscheidung, die
   jemand mit Zugriff auf die Tokendatei noch einmal ansehen sollte. Alle fünf Kombinationen sind
   in beiden Modi gemessen und liegen zwischen 4,58:1 und 10,25:1.
2. **Eine gespeicherte Vorlage, die eine Quelle nennt, die der Dienst nicht mehr ausliefert, wird
   unlesbar** und der Editor sagt das. Vorher hing das an der hier aufgeschriebenen Liste, jetzt
   an der Antwort. Das ist strenger — richtig so, weil der Motor sie ebenso abweisen würde —, aber
   es verschiebt die Abhängigkeit: Ein Ausfall von `GET /export/sources` legt S-14 lahm. Der
   Ladefehler wird sauber angezeigt, mit „Erneut versuchen".
3. **Die Notiz-Zusicherung ist zur Laufzeit gewandert.** Sie bricht den Übersetzer nicht mehr. Sie
   greift dafür an einer Stelle, an der ein Typausdruck nie greifen konnte. Beide Enden der Kette
   halten weiterhin am Übersetzer: `NoteBoundaryIsSealed` in der Domäne und
   `NoteSourceIsNotPublished` im Dienst.
4. **Der Prüfpfad, mit dem ich gemessen habe, ist ein Wegwerfskript** im Scratchpad, kein
   Bestandteil von `pnpm check`. Er belegt Port 17843 und teilt ihn sich mit `proof:access`,
   `proof:export-api` und den e2e-Läufen.
5. **S-14 ist nicht im Browser gefahren worden.** Der Tag-Baum und der vierte Anzeigezustand
   schon — sie stehen auf der Musterseite, und die läuft ohne Dienst auf einem freien Port. Der
   Vorlageneditor braucht den Dienst und damit Port 17843 und 5173, und dort arbeitet der
   e2e-Tester. Ich habe einen begonnenen Lauf abgebrochen, als ich seine Spuren im gemeinsamen
   Ablageordner gesehen habe, und alle meine Prozesse beendet — die Ports sind frei. Was damit
   **nicht** belegt ist: dass die Live-Vorschau am Bildschirm flüssig nachzieht und dass die 400 ms
   sich richtig anfühlen. Die Schnittstellenseite dazu ist gemessen (37 von 37), die
   Bildschirmseite nicht.
6. **Der Tag-Baum hat keinen automatischen Prüfpfad.** Mein Chromium-Lauf ist ein Wegwerfskript im
   Scratchpad. Der Fehler war ein halbes Jahr Arbeit lang unentdeckt, weil ihn keine
   Zustandsmatrix findet: Jede einzelne Funktion arbeitete. Er gehört als stehende Prüfung in die
   End-to-End-Fläche, nicht in ein Skript von mir.

---

Offene Fragen:

1. **An den Orchestrator (Token):** Soll „Nicht abgerechnet" eigene Token in
   `packages/ui-tokens/tokens.css` bekommen — etwa `--status-notbilled-*` als Aliase auf die
   heutigen neutralen Werte? Das kostet nichts an Aussehen, macht den Zustand aber in der
   Tokendatei sichtbar und änderbar, ohne drei Komponenten anzufassen. Ich habe es nicht getan,
   weil `packages/**` in T-035 gesperrt war. Eine Zeile im Board für den Eigentümer der Datei.
2. **An den e2e-Tester:** Die neun Punkte oben verschieben Klickpfade. Wenn dort schon
   Prüfungen gegen die alten Texte stehen — besonders gegen „Diese Vorschau zeigt den
   gespeicherten Stand" und gegen „Exportiert" auf einer ausgebuchten Buchung —, dann sind sie
   jetzt falsch und nicht die Oberfläche.
3. **An den e2e-Tester (Tag-Baum):** Der Testfall im Kopf deiner Spezifikationsdatei sollte jetzt
   grün sein. Bitte auch die Gegenrichtung mitnehmen: dass ein Klick auf das Dreieck die Auswahl
   **nicht** verstellt. Ein Baum, in dem Aufklappen nebenbei die Auswahl umsetzt, ist die
   Spiegelung desselben Fehlers, und er wäre genauso schwer zu finden.
4. **An den Orchestrator (Vorschau in S-07):** Die Export-Ansicht fragt weiterhin mit der
   **Kennung** der aktiven Vorlage. Das halte ich für richtig — der Lauf nimmt die gespeicherte
   Vorlage —, aber es heißt, dass ein Benutzer, der in S-14 einen ungespeicherten Entwurf sieht,
   in S-07 etwas anderes sieht. Ausgesprochen wird das dort heute nicht. Soll S-07 sagen, dass es
   die aktive, gespeicherte Vorlage zeigt?

---

Nächster Schritt:

Der Exportordner in `SettingsScreen.tsx` (Sicherheitsbefund, eigene Aufgabe) — Ordnerdialog über
die Hülle, Rückfrage bei Netzlaufwerken, OneDrive-Heuristik. Ich habe ihn wie angewiesen nicht
angefasst. Danach, falls gewollt, Offene Frage 1 als kleine Aufgabe für den Eigentümer der
Tokendatei.
