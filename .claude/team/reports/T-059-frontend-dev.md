Aufgabe: T-059 — Ark UI einführen; Tag-Eingabe mit Auto-Vervollständigung; drei Befunde aus T-058.

Status: fertig

---

Artefakte:

Neu:

```
apps/web/src/components/Select.tsx               228  Auswahlfeld auf Ark UI. `Select` und
                                                      `SelectField` sind zu **einem** Baustein
                                                      zusammengefallen; Optionen kommen als Daten,
                                                      Gruppen ersetzen `<optgroup>`
apps/web/src/components/TagInput.tsx             495  **die** Tag-Eingabe. `TagCombobox` ohne
                                                      Anbindung (für die Musterseite),
                                                      `TagInput` mit `StructureContext`
```

Geändert:

```
apps/web/src/components/Menu.tsx                 258  Menü und Kontextmenü auf Ark UI, gleiche
                                                      Schnittstelle; Anschreiben mit der Tastatur
                                                      kommt dazu; Kontextmenü über `reposition`
apps/web/src/components/Primitives.tsx           334  `Select` entfernt (76 Zeilen)
apps/web/src/components/FilterBar.tsx            199  `SelectField` entfernt
apps/web/src/components/Tag.tsx                  170  `isNew` — Chip für ein Tag, das es noch
                                                      nicht gibt: gestrichelt, Plus, Wort „neu"
apps/web/src/components/FormDialog.tsx           251  Escape, den eine Liste schon behandelt hat,
apps/web/src/components/ConfirmDialog.tsx        187  schließt nicht zusätzlich den Dialog
apps/web/src/components/InfoDialog.tsx           117
apps/web/src/screens/TodoFormDialog.tsx          229  Chip-Wand raus, Tag-Eingabe rein; neue Tags
                                                      als `tagNames` (eine Transaktion, T-058)
apps/web/src/screens/TodoListScreen.tsx          569  Tag-Filter bekommt endlich ein
                                                      Bedienelement; mehrere Tags statt einem
apps/web/src/screens/SettingsScreen.tsx          770  Standard-Tags über die Tag-Eingabe
apps/web/src/screens/TagsScreen.tsx              799  Poolregel über die Tag-Eingabe (die
                                                      40-Tag-Kappung fällt weg)
apps/web/src/screens/TemplateFields.tsx          611  vier `<Select>` auf Daten umgestellt;
                                                      `SourceOptions` → `sourceOptions`
apps/web/src/app/App.tsx                         332  `SelectField` → `Select` (Farbmodus)
apps/web/src/screens/ExportScreen.tsx           1303  dito
apps/web/src/screens/ExportAuditScreen.tsx       334  dito
apps/web/src/screens/BookingsScreen.tsx          593  dito
apps/web/src/lib/format.ts                       300  **Befund 1+2**: Sekunden unter einer Minute;
                                                      volle Stunde ohne „und 0 Minuten"
apps/web/src/api/types.ts                        715  `TodoCreate.tagNames`,
                                                      `TodoCreated.createdTags`
apps/web/src/styles/components.css              3804  Auswahlfeld neu, Aufklappliste, Tag-Eingabe,
                                                      Menü ohne die alten Anker-Klassen;
                                                      Kartenkopf bricht um
apps/web/src/styles/app.css                     3193  **Befund 3**: Buchungszeile bricht um
apps/web/src/styles/base.css                     301  `[hidden] { display: none !important }`
apps/web/scripts/contrast-check.mjs              512  neun Paare für die Aufklappliste
packages/ui-tokens/tokens.css                    636  `--z-popover: 320`
apps/web/src/showcase/TagsSection.tsx            226  Tag-Eingabe in fünf Zuständen
apps/web/src/showcase/ControlsSection.tsx        358  Auswahlfeld mit Gruppen, fehlerhaft, leer
apps/web/src/showcase/DataSection.tsx            375  Umbenennung
apps/web/src/showcase/ShellStateSection.tsx      281  Umbenennung
apps/web/package.json                             33  `@ark-ui/react@^5.39.0`, `@takt/domain`
pnpm-lock.yaml                                        +89 Pakete
```

`apps/local-api/**`, `packages/**` außer `ui-tokens/tokens.css`, `apps/outlook-addin/**`,
`tests/e2e/**`, `docs/**`, `apps/web/test/**`, `apps/desktop/**`, `pnpm-workspace.yaml`:
unangetastet.

---

Zusammenfassung:

**1 — Die Installation ging ohne Lockerung durch. Die Fassung wurde gewählt, nicht die Regel
geändert.**

`@ark-ui/react` steht heute bei 5.39.1, veröffentlicht am 28.08. — fünf Tage alt und damit
innerhalb der sieben Tage von `minimumReleaseAge`. Installiert ist deshalb **5.39.0** vom 22.08.
(elf Tage). Die 89 nachgezogenen Pakete sind `@zag-js/*` in **1.43.3** vom 20.08. (dreizehn Tage) —
Ark UI pinnt sie auf die Ziffer genau, es gab also nichts zu wählen und nichts zu hoffen.
`blockExoticSubdeps`, `strictDepBuilds` und `trustPolicy: no-downgrade` haben nicht angeschlagen;
kein Paket brauchte einen Eintrag in `allowBuilds`, keines einen in `trustPolicyExclude`.

Eingebunden sind **drei Unterpfade**, nicht das Paket: `@ark-ui/react/select`,
`/combobox`, `/menu` und `/portal`. Gemessen (esbuild, minifiziert, React ausgenommen):
**170 kB, gzip 50 kB**. Das Bündel wächst damit von rund 457 kB auf **627 kB (gzip 191 kB)** und
löst Vites Warnschwelle von 500 kB aus. Sie steht im Bericht und nicht in einer erhöhten Schwelle:
Takt lädt sein Bündel von der Platte, nicht über eine Leitung — die Zahl ist eine Auskunft, kein
Befund. Wer sie senken will, teilt in einen eigenen Brocken; das ist eine Entscheidung über
Bauwerkzeug und keine über Verhalten.

**2 — Der sichtbare Anlass: die aufgeklappte Liste sieht jetzt aus wie der Rest.**

Im Browser nachgesehen, hell und dunkel, gegen den echten Dienst mit echtem Bestand (zehn Tags in
vier Ordnern, davon **zweimal „Nord"** in verschiedenen Ordnern, vier Todos, zwei Buchungen).

Vorher zeichnete das Betriebssystem die Liste eines `<select>`: eigene Schrift, eigene
Zeilenhöhen, eigene Ecken. Jetzt ist es ein Knopf mit `role="combobox"` und eine Liste aus den
Token dieses Projekts — dieselbe Schrift, dieselbe `--radius-lg`, derselbe `--shadow-lg`, dieselbe
Zeilenhöhe wie im Menü daneben. Der Pfeil dreht sich beim Aufklappen (zweites Merkmal neben der
Rahmenfarbe), der gewählte Eintrag trägt einen Haken **und** eine Fläche, der überfahrene und der
mit der Pfeiltaste erreichte sehen gleich aus (`data-highlighted` setzt Ark für beides).

Drei Dinge waren dabei nicht offensichtlich und sind jeweils einmal falsch gewesen, bevor sie
richtig waren:

*Erstens.* Ich hatte dem Auslöser eine eigene `id` gegeben. Die Zustandsmaschine sucht ihn über
**ihre** Kennung, um die Liste daran auszurichten; sie fand nichts, und die Liste blieb bei
`translate3d(0, -100vh, 0)` stehen — oben links, außerhalb des Sichtfelds. Gemessen im Browser,
nicht vermutet: `transform: matrix(1,0,0,1,0,-900)`.

*Zweitens.* Die Ebene gehört an den **Inhalt**, nicht an die Hülle. Ark schreibt beim Aufklappen
`--z-index` auf die Hülle, und zwar aus dem gemessenen `z-index` des Inhalts. Stand dort nichts,
war es `auto` — und die Liste eines Auswahlfelds **im Dialog** lag hinter dem Dialog. Das war
zuerst genau so zu sehen. `--z-popover: 320` liegt bewusst über `--z-dialog: 310` und unter
`--z-toast: 400`.

*Drittens.* `[hidden] { display: none }` steht im Blatt des **Browsers** und liegt damit unter
jeder eigenen Regel. `.select__content { display: flex }` hat es aufgehoben — die zugeklappte
Liste blieb im Baum stehen, unsichtbar geschoben, aber **für Vorlesehilfe und Tabulator
vorhanden**. Der Schaden trifft genau die, die nicht hinsehen. `base.css` hat jetzt die eine
`!important`-Regel dieses Projekts, und sie ist begründet: Ihr Zweck ist, jede Autorenregel zu
schlagen.

**3 — Escape gehört der Liste, nicht dem Dialog dahinter.**

Die Listen hängen im Portal am Dokumentkörper, stehen im React-Baum aber unter ihrem Feld — und
damit unter einem Dialog. Zag behandelt Escape in der Erfassungsphase auf dem Dokument und setzt
`preventDefault`; der Dialog bekam die Taste danach ein zweites Mal und schloss mit. Zwei Riegel,
beide gemessen: die Listen halten Escape und Tabulator im React-Baum an, und die drei Dialoge
prüfen `event.defaultPrevented`. Nachgewiesen im Browser: Auswahlfeld im Dialog offen → Escape →
Liste zu, **Dialog offen**.

**4 — Das Kontextmenü: `anchorPoint` ist eine Eigenschaft, die niemand liest.**

Sie sieht aus wie der Weg, den Punkt hineinzugeben, wird aber nur aus dem Ereignis des
maschineneigenen Kontextmenü-Auslösers gefüllt. Einen solchen Auslöser gibt es hier nicht — die
Tabellenzeile ist einer, und sie meldet den Punkt selbst (rechter Mausklick, Kontextmenü-Taste,
Umschalt+F10). Ohne Auslöser lief die Ausrichtung gegen ein nicht vorhandenes Element, und das
Menü stand unverrückt oben links. Sichtbar auf dem ersten Durchgang. Jetzt geht der Punkt über
`api.reposition({ getAnchorRect })` hinein; das ist der einzige Weg, der Vorrang vor der Maschine
hat. Der Tastaturweg der Aufrufer ist unverändert geblieben.

**5 — Die Tag-Eingabe: eine, überall dieselbe.**

Vorher waren es vier verschiedene Arten, ein Tag zu wählen:

| Stelle | vorher | jetzt |
|---|---|---|
| Todo anlegen/ändern | Suchfeld + Chip-Wand, auf 40 gekappt | Tag-Eingabe, mit Anlegen |
| Standard-Tags (S-10) | **ungefilterte** Chip-Wand über alle Tags | Tag-Eingabe |
| Poolregel (S-11) | Chip-Wand, **hart auf 40 gekappt** | Tag-Eingabe |
| Todo-Filter (S-02) | **gar nichts** — nur über ein fremdes Chip setzbar | Tag-Eingabe, mehrere Tags |

Die Poolregel war der schlimmste Fall: Wer 41 Tags hat, konnte das 41. in keiner Regel nennen und
sah nicht einmal, dass es fehlt. Die Kappung gibt es nicht mehr; die Eingabe sucht.

**6 — Vorschläge folgen der Regel des Dienstes, nicht einer eigenen.**

Verglichen wird über `tagNameKey` aus `packages/domain` — importiert, nicht nachgebaut. Mit einem
eigenen `toLowerCase()` stünde in der Liste „kein Treffer" für ein Tag, das der Dienst gleich
darauf als vorhanden erkennt. Im Browser gegen den echten Bestand nachgewiesen:

```
„backend"    → „Backend" wird vorgeschlagen, kein Angebot zum Anlegen
„  Backend  "→ dasselbe Tag, kein Angebot zum Anlegen
„Strasse"    → Angebot zum Anlegen (denn „Straße" ≠ „Strasse")
„no"         → „Kunden / Nord / Nord" und „Standorte / Nord", am Pfad unterschieden (A-4.4)
```

**7 — Vorhanden und neu sind auseinanderzuhalten (Punkt 4 des Auftraggebers).**

Ein Vorschlag, der aussieht wie ein vorhandenes Tag und in Wahrheit ein neues anlegt, wäre die
schlechteste Variante. Deshalb:

- Vorhandene Tags stehen unter „VORHANDENE TAGS", mit Punkt, Ordnerpfad und Namen — genau so, wie
  sie danach am Todo hängen. Ein Standard-Tag sagt es in einer zweiten Zeile.
- Das Anlegen steht **darunter, abgetrennt**, unter „NEU ANLEGEN", mit Pluszeichen statt Punkt und
  einem Satz: „Dieses Tag gibt es noch nicht. Es entsteht auf der Wurzelebene, sobald Sie
  speichern; verschieben lässt es sich danach unter Tags."
- Das Chip eines noch nicht angelegten Tags trägt **drei** Merkmale: gestrichelte Kontur,
  Pluszeichen statt Punkt, das Wort „neu". Keines davon ist nur Farbe (SC 1.4.1).

**8 — Angelegt wird erst beim Speichern, und beim Anlegen eines Todos in einer Transaktion.**

Die Eingabe schreibt **nichts**. Sie meldet dem Aufrufer, welche Namen noch kein Tag haben. Beim
Anlegen eines Todos gehen sie als `tagNames` mit; der Dienst löst sie in derselben Transaktion auf
(T-058). Wer den Dialog abbricht, hinterlässt kein verwaistes Tag. Im Browser nachgewiesen: „Todo
angelegt. „Eskalation prüfen" ist gespeichert. Neu angelegt wurde das Tag „Eskalation". Als
Standard-Tag kam „Intern" hinzu."

Beim **Ändern** gibt es kein `tagNames` — `PATCH /todos/{id}` nimmt Kennungen. Dort entstehen neue
Tags unmittelbar vor dem Speichern über `POST /tags`. Das steht als eigener Schritt im Quelltext
und ist im Kommentar ausgesprochen: Schlägt das Speichern danach fehl, sind die Tags angelegt.
Vertretbar (der Benutzer hat sie verlangt, sie stehen danach unter Tags), aber nichts, was man
verschweigt. **Offene Frage 1** unten.

**9 — Die drei Befunde aus T-058.**

*Eine Minute als „0:00 h".* `formatDuration` schnitt auf Minuten ab. Null Sekunden bleiben
`0:00 h` — da ist wirklich nichts —, alles darunter bis 59 Sekunden erscheint als `40 s`. Aufrunden
auf `0:01 h` wäre die falsche Rettung: Das wären 60 Sekunden, und so viele sind es nicht. Die
Einheit wechselt sichtbar mit. Im Browser gegen die echte 40-Sekunden-Buchung nachgesehen: „40 s"
in der Buchungstabelle, im Dashboard und in der Zeiterfassung.

*`spokenDuration`.* Dieselbe Genauigkeit, dazu: volle Stunde ohne „und 0 Minuten", Einzahl richtig.

*„Ohne Le…".* Der Text heißt „Ohne Leistung"; abgeschnitten hat ihn nicht der Inhalt, sondern die
Zeile — Zeitraum (8,5rem), Dauer (4rem), Herkunft und die Abstände belegen den Platz, und die
Leistung war das einzige Feld, das nachgeben konnte. Ein Abschneiden ist bei einer langen Leistung
richtig; bei „Ohne Leistung" ist es falsch, denn das ist kein gekürzter Inhalt, sondern die
Auskunft, dass keiner da ist. Die Zeile bricht jetzt um, sobald der Leistung weniger als 9rem
bleibt. Bei 1100 px Fensterbreite nachgesehen: „Ohne Leistung" steht vollständig.

Beim Nachsehen fiel derselbe Fehler im **Kartenkopf** auf: Steht dort ein Suchfeld (das nicht
schmaler wird als 16rem), brach der Kartentitel Wort für Wort untereinander um — „Todo w…" mit
einer Spalte aus einzelnen Wörtern darunter. Gleiche Antwort, gleiche Begründung.

**10 — Zustände aus Abschnitt 15, nicht nur der Normalfall.**

Das Auswahlfeld: Ruhe, Zeiger, Fokus, aufgeklappt, gewählt, gesperrt, fehlerhaft, **leer**
(„Nichts zur Auswahl."). Die Tag-Eingabe: lädt (Feld bleibt stehen und ist gesperrt — verschwände
es, spränge das Formular), **Fehler** (Meldung mit Wiederholungsknopf, keine Sackgasse), leer
(„Noch kein Tag angelegt."), ohne Treffer („Kein Tag passt zu „xy"." plus, wenn nicht angelegt
werden darf, der Verweis auf die Tag-Verwaltung), gewählt, neu, gesperrt. Alle acht stehen
nebeneinander auf der Musterseite — dafür ist `TagCombobox` von der Anbindung getrennt: Ein
Baustein, dessen Zustände man nur in der laufenden Anwendung sieht, wird nicht abgenommen, sondern
geglaubt.

**11 — Tastatur.**

Im Browser nachgewiesen, nicht behauptet: Auswahlfeld mit Eingabetaste öffnen, mit Pfeil ab
wandern, mit Eingabe wählen. Tag-Eingabe: tippen hebt den ersten Treffer hervor
(`autohighlight`), Eingabe nimmt ihn; ist der Name unbekannt, ist das Angebot zum Anlegen der
hervorgehobene Eintrag, und Eingabe legt an. Rücktaste im leeren Feld nimmt das zuletzt gewählte
Tag zurück — zusätzlich zu, nicht anstelle von, den Entfernen-Knöpfen. Sichtbarer Fokus überall:
Der globale `:focus-visible`-Ring greift auf dem Auslöser, dem Umschalter und den Chip-Knöpfen; das
Eingabefeld der Tag-Eingabe gibt seinen Ring an die Hülle ab (`:focus-within`), damit er um das
liegt, was man sieht.

**12 — Nachweise.**

```
pnpm typecheck   8 Projekte, fehlerfrei
pnpm contrast    0 von 376 Paaren durchgefallen (vorher 358; neun Paare für die Aufklappliste,
                 dazu die neun aus T-058, die schon standen)
pnpm build       fehlerfrei; apps/web 627,13 kB (gzip 191,29 kB) + Warnschwelle, siehe Punkt 1
```

Zehn Adressen aufgerufen, hell und dunkel, **keine Meldung in der Konsole**, keine
unbehandelte Ausnahme.

---

Annahmen:

**Das Auswahlfeld führt seine Beschriftung selbst.** `Select` und `SelectField` sind zu einem
Baustein zusammengefallen; `label` ist Pflicht, `hideLabel` versteckt sie optisch. Grund: Ohne
Beschriftung hat der Auslöser keinen zugänglichen Namen (SC 4.1.2), und ein `<label htmlFor>` von
außen kollidiert mit der Kennung, über die die Zustandsmaschine ihre Teile findet — genau der
Fehler aus Punkt 2. 21 Aufrufstellen umbenannt, keine inhaltlich geändert.

**Anlegen nur dort, wo es hingehört.** `allowCreate` hat genau einen Aufrufer: den Todo-Dialog. In
Standard-Tags, Poolregel und Filter wählt man aus dem, was es gibt; findet sich nichts, verweist
die Liste auf die Tag-Verwaltung, statt still leer zu bleiben. Der Übersetzer hält das fest: Mit
`allowCreate` sind `newNames` und `onNewNamesChange` Pflicht — sonst tippte jemand einen Namen, den
niemand entgegennimmt.

**Der Tag-Filter nimmt mehrere Tags.** Die Abfrage konnte das immer (`tagIds` ist eine Liste); es
gab nur kein Bedienelement. Die Adresse bringt weiterhin genau ein Tag mit — mehr hat sie nie
geschrieben.

**Ein neues Tag entsteht auf der Wurzelebene.** Dieselbe Entscheidung, die der Dienst in
`resolveTagNames` trifft, mit derselben Begründung: Ein Ordner wäre geraten. Der Eintrag sagt es
dem Benutzer, bevor er wählt.

**`@takt/domain` steckt jetzt in `apps/web`.** Ausschließlich wegen `tagNameKey` und
`normalizeTagName`. Keine Rechnung, keine Rundung, keine Kodierung — die Oberfläche vergleicht
Namen nach derselben Regel wie der Dienst, und das ist eine Regel und keine Formatierung. Der
Präzedenzfall steht in `apps/outlook-addin`, das `checkCallNumber` genauso importiert.

---

Risiken:

**R-neu-1 — die Angriffsfläche der Lieferkette wächst um 89 Pakete.** Alle aus zwei Quellen
(`@ark-ui`, `@zag-js`) und alle über die Registry mit Prüfsumme im Sperrbestand. Keines hat ein
Lebenszyklus-Skript, sonst hätte `strictDepBuilds` die Installation abgebrochen. Für den
security-checker ist das trotzdem ein Vorgang und keine Formalie: Es sind 89 neue Namen, deren
Konten übernommen werden könnten. `minimumReleaseAge` von sieben Tagen ist genau dagegen gesetzt
und hat hier bereits gegriffen (5.39.1 wurde abgewiesen).

**R-neu-2 — fünf End-zu-End-Prüfungen brechen, und zwar erwartbar.** `selectOption()` gibt es
nicht mehr, weil es kein `<select>` mehr gibt. Betroffen, genau aufgezählt:

```
tests/e2e/note-separation.spec.ts:137   getByLabel('Exportvorlage').selectOption(...)
tests/e2e/note-separation.spec.ts:175   getByLabel('Exportvorlage').selectOption(...)
tests/e2e/tags-folders.spec.ts:126      getByLabel('Ordner für dieses Tag').selectOption(...)
tests/e2e/tags-folders.spec.ts:158      targetField.selectOption(...)
tests/e2e/tags-folders.spec.ts:225      getByLabel('Neuer übergeordneter Ordner').selectOption(...)
```

Der Ersatz ist kurz und stabil: Der Auslöser hat `role="combobox"` und den Namen der Beschriftung,
die Einträge haben `role="option"`. Also

```ts
await dialog.getByRole('combobox', { name: 'Ordner für dieses Tag' }).click();
await page.getByRole('option', { name: 'Kunden / Nord' }).click();
```

Weiter geändert und für Prüfungen wissenswert: Menüeinträge sind kein `<button>` mehr, sondern
`role="menuitem"` mit `data-highlighted` statt `data-active`; die Chip-Wand im Todo-Dialog
(`.tag-picker` mit `aria-labelledby="tagauswahl"`) gibt es nicht mehr — an ihrer Stelle steht
`getByRole('combobox', { name: 'Tags' })` mit den Chips darüber in `.taginput__chips`.

**R-neu-3 — die Dauer unter einer Minute liest sich anders.** Wer eine Prüfung auf „0:00 h" für
eine kurze Buchung hat, bekommt jetzt „40 s". Das war der Zweck; es steht hier, damit niemand es
für einen Rückschritt hält.

**R-neu-4 — Ark UI hält seinen eigenen Zustand.** Auswahlfeld und Kombobox sind kontrolliert
(`value` kommt von außen), aber Offenheit, Hervorhebung und Ausrichtung liegen in der
Zustandsmaschine der Bibliothek. Ein Fehler darin ist keiner, den man in `apps/web` beheben kann.
Die drei Stolpersteine aus Punkt 2 und 4 sind Beispiele dafür, dass die Bibliothek Annahmen hat,
die man erst beim Hinsehen bemerkt — jede davon ist im Quelltext an ihrer Stelle begründet, damit
sie beim nächsten Aktualisieren nicht als überflüssig entfernt wird.

Sicherheitshinweis: Kein neuer Weg für Daten nach außen. Ark UI stellt Verhalten, keine
Netzwerkzugriffe; die Tag-Eingabe ruft ausschließlich Routen an, die es vorher schon gab
(`POST /todos`, `PATCH /todos/{id}`, `POST /tags`).

---

Offene Fragen:

**1 — `tagNames` auch beim Ändern eines Todos?** `POST /todos` nimmt Tagnamen und legt sie in
derselben Transaktion an; `PATCH /todos/{id}` nimmt nur Kennungen. Deshalb entstehen neue Tags im
Änderungsfall vorher über `POST /tags` — und bleiben stehen, wenn das Speichern danach scheitert.
Ein `tagNames` in `updateSchema` würde die beiden Wege gleichziehen und den Rest entfernen. Das ist
`apps/local-api` und damit domain-dev; ich baue es nicht nach.

**2 — Zeilendichte weiterhin ohne Spalte.** Unverändert aus T-057: `app_setting` hat keine Spalte
dafür, die Wahl gilt bis zum Beenden. Sobald die Spalte kommt, ziehe ich nach.

**3 — `docs/prototype/takt-ui-konzept.html` liegt weiterhin nicht vor.** Das Designsystem bleibt
die Referenz. Die neuen Bausteine stehen auf der Musterseite unter „8 — Tags und Ordner"
(Tag-Eingabe in fünf Zuständen) und „9 — Bedienelemente und Zustände" (Auswahlfeld mit Gruppen,
fehlerhaft, gesperrt, leer), damit sie sich später gegen den Prototyp halten lassen.

**4 — Bündelgröße.** 627 kB überschreiten Vites Warnschwelle. Ein eigener Brocken für die
Fremdbibliotheken wäre eine Zeile in `vite.config.ts` und würde die Warnung nehmen; für eine
Anwendung, die ihr Bündel von der Platte lädt, bringt er sonst nichts. Ich habe die Zeile bewusst
**nicht** geschrieben — das ist eine Entscheidung über Bauwerkzeug, und die gehört gefragt.
