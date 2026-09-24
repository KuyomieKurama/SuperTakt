Aufgabe: T-061 — Das Add-in legt neue Tags an wie die Hauptanwendung

Status: fertig

---

Artefakte:

Neu:

```
apps/outlook-addin/src/tags/new-name.ts   NEU (131) — was mit dem getippten Namen zu tun ist:
                                           `describeNewTag` (idle/invalid/exists/pending/offer),
                                           `addPendingTagName`, `removePendingTagName`. Rein,
                                           ohne React. Die Gleichheitsregel wird **aufgerufen**
                                           (`checkTagName`, `tagNameKey`), nicht geführt
```

Geändert unter `apps/local-api/src/routes/addin/`:

```
ports.ts     `AddinUnit.tags: Pick<TagPort, 'findByKey' | 'create'>` — mit ausgeschriebener
             Begründung, **warum genau diese zwei** und warum nicht `rename`, `move`, `remove`,
             `load`, `listInFolder`, `setOnTodo`
schema.ts    `tagNames` im Anlegeschema, zeichengleich zu `nameSchema` aus `routes/todos.ts`
             (1–200, getrimmt), Obergrenze 50 als `ADDIN_TAG_NAMES_MAX`; `MAX_TAG_NAME_LENGTH`
             aus der Domäne statt einer Zahl
service.ts   `createTodo` liefert jetzt ein `Result`; `tagNames` und `createdTags`;
             `AbortAddinTodoCreate` (Wurf statt Rückgabewert, T-047); `resolveTagNames`
             innerhalb der Transaktion
index.ts     `tagNames` durchgereicht; `failureBody`; `statusFor` aus `http/problem.ts`, damit
             `name_conflict` hier 409 ist wie auf der Hauptfläche; die neuen Ausgänge in der
             Routenbeschreibung
```

Geändert unter `apps/outlook-addin/`:

```
src/api/types.ts        `CreateTodoResponseDto.createdTags`
src/api/client.ts       `CreateTodoRequest.tagNames`
src/ui/TagPicker.tsx    Suchen und Anlegen sind **ein** Feld; Chips „neu"; die Zeile
                        „Gibt es schon: …" mit dem vorhandenen Tag als Knopf; Eingabetaste als
                        Abkürzung; der leere Bestand ist kein Sonderfall mehr
src/ui/Primitives.tsx   `Chip tone="new-tag"`, Wortmarke und Erklärung in einem `Record`
src/ui/TaskPane.tsx     `newTagNames`; `tagNames` im Aufruf; nach dem Anlegen rücken die neuen
                        Tags in die Auswahl und der Baum wird neu geholt; die Erfolgsmeldung
                        nennt sie **beim Namen**; `FIELD_LABEL` für `details[].field`
src/styles/addin.css    `.chip--new`, `.tagpicker__hint`, `.tagpicker__link`,
                        `.tagpicker__create*`; `.pane-empty` entfernt (mit Vermerk, warum)
scripts/fixtures.mjs    `tags`-Port in der Attrappe; `loadTree` aus dem Bestand statt aus einer
                        Konstanten; **reihende und zurücknehmende** Transaktionsklammer;
                        eindeutiger Tagname; beide Ebenen einzeln abschaltbar
scripts/proof-addin.mjs Abschnitt 11 — 14 neue Prüfungen, darunter acht **gleichzeitige**
                        Anfragen gegen eine echte SQLite-Datenbank
README.md               Aufbau nachgezogen; neuer Abschnitt „Warum das Add-in Tagnamen schickt
                        und keine Tags anlegt"
```

Geändert außerhalb der Dateihoheit — **eine Datei, siehe „Abweichungen":**

```
apps/local-api/openapi/takt-local-api.yaml   `tagNames` an `POST /addin/todos`, `409` in der
                                              Antwortliste, `AddinTodoCreated.createdTags`
```

Nicht angefasst: `packages/domain/**`, `packages/storage/**`, `packages/export/**`,
`apps/web/**`, `apps/local-api/**` außer den Add-in-Routen und der einen YAML-Zeile,
`tests/e2e/**`, `docs/**`, die Wurzeldateien. Kein `git commit`.

---

Zusammenfassung:

`POST /addin/todos` nimmt seit dieser Aufgabe `tagNames` entgegen und antwortet mit
`createdTags` — gestaltgleich mit `POST /todos`. Der Aufgabenbereich hat dafür **kein zweites
Eingabefeld** bekommen: Dasselbe Feld, das im Tagbaum sucht, bietet den getippten Namen als neues
Tag an, sobald es ihn nicht findet. Angelegt wird nichts beim Klick, sondern beim Anlegen des
Todos, in derselben Transaktion. Damit trägt der Wettlaufschutz aus T-058 unverändert; er ist
nicht nachgebaut, sondern benutzt. **Gemessen**: acht gleichzeitige `POST /addin/todos` mit acht
Schreibweisen desselben neuen Namens gegen eine echte, migrierte SQLite-Datenbank ergeben genau
ein Tag, acht Todos, und genau eine Antwort meldet die Neuanlage. Dazu die Gegenprobe, dass diese
Messung rot werden **kann**, und der Vergleich gegen den Weg der Hauptanwendung: derselbe Name
über beide Wege, gegen dieselbe Datenbank, ergibt ein Tag — die Messung gegen C-03. `proof:addin`
steht auf **100 bestanden, 0 fehlgeschlagen** (vorher 86).

---

## 1 — Die Regel wird benutzt, nicht nachgebaut

`packages/domain/src/tag-name.ts` ist an **vier** neuen Stellen aufgerufen und an keiner
abgeschrieben:

| Ort | Aufruf | wofür |
|---|---|---|
| `routes/addin/service.ts` | `checkTagNames` | prüfen, normalisieren, Doppelte **innerhalb einer Anfrage** wegwerfen |
| `routes/addin/schema.ts` | `MAX_TAG_NAME_LENGTH` | die Obergrenze steht neben der Regel, nicht als Zahl im Schema |
| `outlook-addin/src/tags/new-name.ts` | `checkTagName`, `tagNameKey` | „gibt es diesen Namen schon?" im Aufgabenbereich |
| `outlook-addin/scripts/fixtures.mjs` | `normalizeTagName`, `tagNameKey` | die Attrappe erzwingt dieselbe Regel wie `ux_tag_name_key` |

Der Aufgabenbereich ist dabei die Stelle, an der ein zweiter Vergleich am verführerischsten
gewesen wäre — ein `toLowerCase()` im `TagPicker` hätte in neun von zehn Fällen dasselbe getan.
Es ist der zehnte, der zählt: Er träfe „Backend" gegen „backend" und läge erst bei „Straße" gegen
„Strasse", bei „ẞ" oder bei einem geschützten Leerzeichen daneben — also genau dort, wo ein
Doppelgänger entsteht, den der Benutzer für ein Tag hält. Der Grund, aus dem die Faltung
aufgezählt und nicht `toLowerCase()` ist, wäre durch eine zweite Fassung genau aufgehoben.
Gemessen ist das in 11a: `störung`, `STÖRUNG`, ` Störung `, `stÖrung` treffen alle das vorhandene
„Störung"; `Stoerung` trifft es nicht.

---

## 2 — Der Wettlauf, gemessen statt geerbt

Der Auftrag sagt: Der Schutz trägt für mich, **wenn** ich denselben Anwendungsfall benutze. Genau
das ist der Punkt, an dem ein Bericht sonst „trägt auch hier" schriebe. Er trägt hier, weil
`proof:addin` Abschnitt 11c es fährt:

```
11c  Der Wettlauf, gegen eine echte Datenbank
  ok    T-061: acht gleichzeitige Anfragen aus dem Add-in ergeben **ein** Tag
  ok    T-061: ohne die Reihung greift der Index — und ohne beides wären es acht Tags
  ok    C-03: derselbe Name über beide Wege ergibt dasselbe Tag
  ok    T-047: scheitert die Anfrage, bleibt kein Tag zurück — an der echten Datenbank
```

**Wogegen gemessen wird.** `openDatabase({ location: ':memory:' })`, `migrateToLatest()` bis 0008,
und derselbe Router, den `app.ts` einhängt. Kein Port, kein Kindprozess — dieser Nachweispfad
läuft weiterhin neben allen anderen. Das ist der Grund, warum die Messung überhaupt etwas sagt:
Reihung der Transaktionen und `ux_tag_name_key` sind Eigenschaften des Betriebs, und eine
Attrappe, die sie nachbildet, könnte sie auch anders nachbilden. Ihre Antwort wäre eine Aussage
über die Attrappe.

**Die acht Schreibweisen** sind so gewählt, dass jede der vier Regeln aus `tag-name.ts` mindestens
einmal greift: `rückruf`, `Rückruf`, `RÜCKRUF` (Ü = U+00DC, also der lateinische
Ergänzungsblock — hier scheitert jedes `lower()` von SQLite), ` rückruf`, `rückruf `,
`  Rückruf  `, `rÜcKrUf`, und einmal zerlegt geschrieben (`u` + Trema, also NFC). Alle acht
zugleich unterwegs, nichts dazwischen abgewartet.

**Die Gegenprobe ist der wichtigere der beiden Prüffälle.** Eine Messung „acht Anfragen, ein Tag"
sieht genauso aus wie eine, die nichts prüft. `createFakeStore` lässt beide Ebenen aus T-058
einzeln weg:

| Aufbau | Ergebnis |
|---|---|
| Reihung **und** Index (der Betrieb) | 8 × 201, ein Tag, eine Meldung der Neuanlage |
| nur Index | ein Tag — aber **sieben** Anfragen scheitern mit 409, statt das vorhandene zu benutzen |
| keins von beiden | **acht** Tags |

Die dritte Zeile ist der Beleg, dass die Zusicherung „genau ein Tag" falsifizierbar ist.

**Der Vergleich gegen den anderen Weg.** „Beschwerde" über `POST /addin/todos`, danach
„BESCHWERDE" über `createTodo` aus `usecases/todos.ts` — gegen **dieselbe** Datenbank. Danach die
Gegenrichtung mit „Nachbestellung". Am Ende gibt es je ein Tag, und beide Todos hängen daran. Das
ist die ausführbare Fassung des Satzes „derselbe Vorgang, ein Ergebnis" und der Grund, warum ich
mit der doppelten `resolveTagNames` (Offene Frage 1) leben kann, ohne es gut zu finden.

**Was die Attrappe seit dieser Aufgabe mehr kann.** Sie reiht (wörtlich die Warteschlange aus
`unit-of-work.ts`, mit beiden Zweigen) und sie **nimmt bei einem Wurf zurück**. Das Zweite war
nicht geplant: Der Prüffall „bleibt kein Tag zurück" war an der echten Datenbank grün und an der
Attrappe rot, weil die Attrappe kein `ROLLBACK` kannte. Eine Attrappe, die den Vertrag ihres
Ports halb erfüllt, ist schlimmer als keine — sie ist grün.

---

## 3 — Wie es sich bedient (S-12)

Die Referenzbilder aus Abschnitt 10 liegen weiterhin nicht vor; gestaltet ist aus dem
Designsystem heraus, mit den Tokens aus `@takt/ui-tokens` und ohne einen einzigen rohen Farbwert.

**Ein Feld, nicht zwei.** Bei 350 Pixel Breite ist ein zweites Eingabefeld nicht nur eng, es
stellt die falsche Frage: Der Benutzer weiß nicht, ob es „backend" schon gibt. Er tippt in das
Suchfeld, und die Liste antwortet ihm — mit dem vorhandenen Tag, wenn es eines gibt, sonst mit
einem Angebot. Suchen und Anlegen sind dieselbe Handlung, solange man das Ergebnis nicht kennt.

Fünf Zustände unter dem Feld, jeder mit eigenem Satz — kein `canCreate: boolean`, weil der die
drei interessanten Fälle in dasselbe stumme „nein" würfe:

```
idle      nichts getippt                      → keine Zeile
invalid   zu lang                             → der Satz der Domäne, mit der Grenze darin
exists    „backend“ trifft „Backend“          → „Gibt es schon: Kunden › Nord › Backend“
                                                — anklickbar, wählt es aus
pending   steht schon oben als neues Tag      → Hinweis
offer     neu und zulässig                    → „+ Neues Tag „…“ — entsteht beim Anlegen des Todos“
```

Der `exists`-Fall ist die Stelle, an der ein zweites „backend" **nicht** entsteht, und er ist
kein Verbot, sondern ein Weg: Das vorhandene Tag steht als Knopf da. Ein Satz, der nur „geht
nicht" sagt, ist richtig und eine Sackgasse.

**Ein vorgemerkter Name trägt das Wort „neu"** — dieselbe Bauart wie „Standard" bei den
Standard-Tags (A-9.3) und aus demselben Grund: Ein Tag anzulegen wirkt über dieses Todo hinaus
und darf nicht wie eine Auswahl aussehen. Andere Fläche als das Standard-Tag, weil das eine der
Dienst setzt und das andere der Benutzer.

**Nach dem Anlegen** wird der Name **genannt**, nicht gezählt („Neues Tag: „Rückruf" — ab jetzt
auch in Takt auswählbar"). „1 Tag wurde angelegt" ließe offen, welches — und das Tag steht danach
in der Hauptanwendung, in jeder Tagliste und womöglich in einer Pool-Regel. Die Schreibweise
kommt dabei aus der **Antwort** und nicht aus dem Eingabefeld: Wer „Backend" tippt und ein
vorhandenes „backend" trifft, bekommt „backend" — und dann steht es gar nicht erst in
`createdTags`.

**Drei Handgriffe nach dem Erfolg**, und sie gehören zusammen: die Vormerkliste wird leer (ein
Chip „neu" wäre danach eine Unwahrheit), die neuen Tags rücken in die **Auswahl** (wer „Noch
etwas aus dieser E-Mail" drückt, hat dieselben Tags wie eben), und der Baum wird neu geholt (das
Add-in hält keine eigene Kopie, A-10.4). Scheitert das Nachholen, ist das **folgenlos** — der
Vorgang ist abgeschlossen, und aus einer missglückten Auffrischung eine Fehlermeldung zu machen
hieße, eine gelungene Handlung als gescheitert darzustellen.

**Der leere Bestand ist kein Sonderfall mehr.** Bis jetzt stand dort „In Takt sind noch keine
Tags angelegt" statt der Auswahl — richtig, und eine Sackgasse. Wer Takt frisch eingerichtet hat,
legt sein erstes Tag jetzt aus Outlook heraus an.

---

## 4 — Die Fläche des Add-in-Tokens: zwei Züge mehr, und keiner mehr

`AddinUnit` ist um `tags: Pick<TagPort, 'findByKey' | 'create'>` gewachsen. Das ist die erste
Erweiterung dieser Fläche seit T-038, und sie ist die Stelle, an der ein entwendetes Token
weiterkommt als vorher. Deshalb ausgeschrieben, was **nicht** dazugekommen ist:

| nicht dabei | warum |
|---|---|
| `rename`, `move` | ändern **fremde** Tags; über die Pools änderte sich damit, welche Todos wo auftauchen |
| `remove` | dasselbe, unwiederbringlich |
| `load`, `listInFolder` | der Baum kommt schon vollständig über `folders.loadTree` — Fläche ohne Zuwachs |
| `setOnTodo` | Tags eines **fremden** Todos umhängen ist nicht der Anwendungsfall; das Add-in setzt Tags nur an dem Todo, das es selbst anlegt |

Damit kann ein entwendetes Token Tags **hinzufügen**, aber keines verändern, verschieben oder
löschen. Ein hinzugefügtes Tag ist sichtbar und vom Benutzer zu entfernen; ein umbenanntes fiele
niemandem auf. `app.ts` musste dafür nicht angefasst werden: `AddinUnit` ist ein Ausschnitt des
echten `UnitOfWork`, und der führt `tags` bereits.

---

## 5 — Zwei Ausgänge, die es vorher nicht gab

**422 mit `details[].code = "tag_name_ambiguous"`.** Tagnamen sind nur je Ordner eindeutig
(A-4.2). Gibt es „Abnahme" zweimal, wird gefragt statt geraten — ein Münzwurf zeigte sich später
als falsche Pool-Zugehörigkeit, und niemand wüsste, woher sie kommt. Derselbe Schlüssel und
derselbe Satz wie auf der Hauptfläche.

**409 `name_conflict`.** Der eindeutige Index hat abgewiesen. Im Betrieb unerreichbar, solange
nur ein Prozess die Datei geöffnet hat; beschrieben, damit er nicht als 500 erschiene. Der
Statuscode kommt aus `statusFor` in `http/problem.ts` — dem **einzigen** Import dieser Routen aus
dem übrigen Dienst, und er holt genau eine Zahl. Eine eigene Zuordnung hier hätte `name_conflict`
zu einem 422 gemacht, während `POST /todos` 409 liefert: dieselbe Handlung, zwei Antworten, je
nachdem wo sie geschieht. Texte kommen weiterhin nicht von dort.

In **beiden** Fällen ist nichts angelegt, auch kein Tag. Gemessen an der echten Datenbank:
`tagNames: ['Ersatzteil', 'Abnahme']` — der erste Name hätte ein Tag angelegt, nach dem 422 gibt
es weder das Todo noch „Ersatzteil".

---

Annahmen:

1. **`tagNames` ist im Add-in wortgleich zur Hauptfläche begrenzt** — 1 bis 200 Zeichen je Name,
   höchstens 50 Namen. Nicht enger, obwohl das Add-in sonst engere Deckel führt (der Vermerk hat
   4000 statt 65536 Zeichen, B-12.3). Der Grund ist der Unterschied der beiden Fälle: Der Vermerk
   ist Text **aus einer fremden E-Mail**, ein Tagname wird vom Benutzer getippt. Zwei
   verschiedene Zahlen wären die Art Unterschied, die niemand bemerkt, bis eine Anfrage über den
   einen Weg durchgeht und über den anderen nicht.
2. **Das Add-in legt Tags nicht einzeln an.** Es gibt keine Route „Tag anlegen" auf der
   Add-in-Fläche und keinen Aufruf dafür im Aufgabenbereich. Ein Name entsteht ausschließlich als
   Teil eines Todos. Das ist die Bedingung für „kein Tag ohne sein Todo" und zugleich die
   engstmögliche Fläche.
3. **Ein neues Tag entsteht auf Wurzelebene und farblos** — wie in `usecases/todos.ts`. Ein
   Ordner wäre geraten. Der Benutzer verschiebt es später in der Hauptanwendung (A-4.2).
4. **Der Tagname wird in `details[].message` zurückgegeben, die Call-Nummer nicht.** Das sieht
   nach einer Inkonsequenz aus und ist keine: Die Call-Nummer stammt aus einer fremden E-Mail
   (Akteur A-06), der Tagname aus dem Eingabefeld des Benutzers. Ein Echo der eigenen Eingabe
   gibt niemandem etwas, was er nicht schon hatte.
5. **Ein 409 zeigt der Aufgabenbereich als allgemeinen Fehlschlag** (`kind: 'failed'`, mit dem
   Satz des Dienstes). Kein eigener `ApiFailureKind`: Der Fall ist im Ein-Prozess-Betrieb nicht
   erreichbar, und ein ungeprüfter Zweig für einen unerreichbaren Fall ist schlechter als keiner
   (dieselbe Begründung wie T-058, Risiko 3).
6. **Die Attrappe reiht und nimmt zurück, ab jetzt immer.** Das ändert das Verhalten bestehender
   Prüfungen theoretisch — nachgemessen: alle 86 vorherigen bleiben grün.

---

Abweichungen von der Dateihoheit — **eine:**

`apps/local-api/openapi/takt-local-api.yaml`, drei Stellen, alle innerhalb der Add-in-Fläche:
`tagNames` im Rumpf von `POST /addin/todos`, `409` in dessen Antwortliste, und `createdTags` an
`AddinTodoCreated`.

Sie war **unvermeidbar**: `proof:openapi` hält das zod-Schema der Route gegen die Beschreibung
(Feldnamen, Pflichtfelder, Obergrenzen). Ein `tagNames` im Schema ohne `tagNames` in der
Beschreibung macht `pnpm check` rot, und die Beschreibung dieser drei Stellen ist die
Beschreibung **meiner** Routen — der Text, den T-058 dort hinterlassen hat, sagte ausdrücklich
„ein Eingabefeld für einen neuen Tagnamen gibt es nicht (T-058, offener Punkt an
integration-dev)". Genau dieser Punkt ist erledigt.

Ich habe nichts außerhalb der vier Add-in-Pfade und der beiden Add-in-Bauteile angefasst,
insbesondere nicht `TodoCreate`, `TodoCreated` oder die Beschreibung irgendeiner Route der
Hauptfläche. `AddinTodoCreated` ist **nicht** durch einen Verweis auf `TodoCreated` ersetzt,
obwohl beide jetzt dasselbe sagen: Die Add-in-Fläche wird bewusst getrennt beschrieben, und ein
Verweis machte aus zwei Flächen eine, die sich nur noch gemeinsam ändern lässt. Dass beide
dasselbe sagen, wird gemessen (11c) statt dadurch erzwungen, dass es nur eine Zeile gibt.

`proof:openapi` steht danach unverändert auf 46/0.

---

Risiken:

1. **`resolveTagNames` steht jetzt zweimal im Baum.** Einmal in `usecases/todos.ts` (nicht
   exportiert, fremde Hoheit), einmal in `routes/addin/service.ts`. Das ist die Doppelung, vor
   der die Aufgabenstellung warnt — nur eine Ebene höher als die Gleichheitsregel selbst, die
   **nicht** gedoppelt ist. Ich habe sie nicht wegdiskutiert, sondern unter Messung gestellt: Der
   Prüffall „derselbe Name über beide Wege ergibt dasselbe Tag" wird rot, sobald eine der beiden
   Fassungen abweicht. Das ist schlechter als eine Fassung und besser als zwei unbeobachtete. Die
   Auflösung steht unter „Offene Fragen 1" und kostet zwei Zeilen.
2. **Die Fläche des Add-in-Tokens ist gewachsen.** Zum ersten Mal seit T-038. Ein entwendetes
   Token kann Tags anlegen — sichtbar, entfernbar, und nur zusammen mit einem Todo. Was es
   *nicht* kann, steht in Abschnitt 4 und im Quelltext an der Stelle, an der es dazukäme.
   `proof:route-policy` (40/0) und `proof:taskpane` (25/0) sind unverändert grün.
3. **Der Aufgabenbereich zieht `tag-name.ts` in sein Bündel.** Das Bündel wächst um wenige
   hundert Byte (`dist/assets/index-*.js` 235,77 kB, gzip 74,98 kB). Der Zuwachs ist gewollt: Die
   Alternative wäre eine zweite Fassung der Regel im Add-in, und die ist der Fehler, den diese
   Aufgabe vermeiden soll.
4. **Der Wettlauf ist innerhalb *eines* Prozesses gemessen**, wie in T-058. Öffnete ein zweiter
   Prozess dieselbe Datei — heute tut das keiner —, trüge nur noch `ux_tag_name_key`, und der
   Verlierer bekäme 409 statt des vorhandenen Tags. Kein Wiederholungsversuch gebaut, aus dem
   Grund aus Annahme 5.
5. **`proof:addin` importiert jetzt `packages/storage` und `apps/local-api/src/usecases`** — über
   relative Pfade, nicht über Paketnamen. Das Add-in führt beide weiterhin **nicht** in seiner
   Abhängigkeitsliste; ein Browserbündel, das den Dienst oder die Datenbank importieren *kann*,
   importiert sie irgendwann. Der Nachweispfad ist kein Erzeugnis. Nebenwirkung: Er gibt jetzt
   die `ExperimentalWarning` von `node:sqlite` auf `stderr` aus, wie `proof:tags` auch.
6. **`proof:addin` braucht weiterhin keinen Port.** Die echte Datenbank liegt im Arbeitsspeicher,
   der Router wird über `app.request()` gefahren. Er läuft damit neben `proof:tags`,
   `proof:access` und `proof:addin-wiring`, die alle 17843 belegen.

---

Offene Fragen:

1. **An domain-dev (über den Orchestrator): `resolveTagNames` exportieren — dann fliegt meine
   Fassung raus.** Das ist die Antwort auf seine offene Frage 2 aus T-058, und er hat sie selbst
   vorgezeichnet: „nicht abschreiben … ich exportiere es gern, statt eine zweite Fassung
   entstehen zu lassen."

   Ich konnte sie nicht importieren: `usecases/todos.ts` gehört nicht zu meiner Dateihoheit, und
   die Funktion ist dort nicht exportiert. Beides zusammen ließ mir die Wahl zwischen „blockiert
   wegen eines fehlenden `export`" und „zweite Fassung unter Messung". Ich habe die zweite
   genommen, weil die Aufgabe eine gemessene Zusicherung verlangt und der Prüffall die Gleichheit
   der beiden Fassungen **fährt**.

   Was ich brauche, ist zweierlei — und der Zuschnitt ist wichtiger als der `export`:

   ```ts
   // usecases/todos.ts
   export async function resolveTagNames(
     unit: Pick<UnitOfWork, 'tags'>,          // statt UnitOfWork: dann passt auch AddinUnit
     candidates: readonly TagNameCandidate[],
     timestamp: Timestamp,
   ): Promise<{ all: readonly Tag[]; fresh: readonly Tag[] }>
   ```

   Der `AbortTodoCreate`-Wurf müsste dabei ebenfalls exportiert werden (oder die Funktion einen
   Wurf-Erzeuger entgegennehmen), damit die Add-in-Route ihn fangen kann. Sobald das steht,
   ersetze ich meine Fassung durch einen Import und lösche 60 Zeilen. Der Prüffall „derselbe Name
   über beide Wege" bleibt stehen — er misst dann etwas Triviales, und das ist der richtige
   Zustand.

2. **An den Orchestrator: gehört die Beschreibung der Add-in-Fläche in meine Hoheit?** Es ist das
   dritte Mal (T-046, T-058 als Übergabe, jetzt T-061), dass eine Änderung an
   `routes/addin/**` eine Änderung an genau den Add-in-Abschnitten von
   `apps/local-api/openapi/takt-local-api.yaml` erzwingt, weil `proof:openapi` beide gegeneinander
   hält. Vorschlag: Die vier Pfade `/addin/*` und die zwei Bauteile `AddinTodoCreated` und
   `AddinTodoMatch` gehören zu `routes/addin/**`. Alles andere in der Datei bleibt bei
   domain-dev. Solange das nicht entschieden ist, melde ich es weiter als Abweichung.

3. **An domain-dev, Nebenbefund in seiner Datei:** Die Fußnote am Ende von
   `takt-local-api.yaml` sagt „Der Namensraum /api/v1/addin/** … wird **gesondert** beschrieben"
   und „Nicht in dieser Datei beschrieben". Beides stimmt seit T-019 nicht mehr — die vier Routen
   stehen in derselben Datei. Ich habe sie nicht angefasst; sie gehört ihm, und sie ist nur Text.

4. **An den e2e-tester (über den Orchestrator): ein Ende-zu-Ende-Fall fehlt.** T-058 hat einen für
   die Hauptanwendung vorgeschlagen („Todo anlegen mit Tag ‚backend', Tag existiert nicht"). Der
   Weg durch den Aufgabenbereich lässt sich hier nicht fahren — Outlook fehlt. Was ginge:
   `tests/e2e` gegen den Aufgabenbereich im Browser, mit dem echten Dienst dahinter (der Bereich
   ist eine gewöhnliche Seite, sobald `Office.*` nicht gebraucht wird). Ob das den Aufwand wert
   ist, entscheide ich nicht.

---

An frontend-dev (nur zur Kenntnis, nichts zu tun):

Der Eintrag `createTodo: ['tagNames']` in `NEVER_SENT` (`proof-callers.mjs`) betrifft
`apps/web` und bleibt unverändert stehen — die Add-in-Fläche wird von `proof:callers`
ausdrücklich nicht erfasst (Abschnitt 2: „jede Operation **außerhalb von /addin**"). Meine
Änderung nimmt dir also nichts ab. Falls du für den Anlegedialog eine Vorlage suchst: Die fünf
Zustände unter dem Suchfeld (`idle`/`invalid`/`exists`/`pending`/`offer`) stehen als reine
Funktion in `apps/outlook-addin/src/tags/new-name.ts` und hängen an keinem React. Der
`exists`-Fall ist der, der zählt.

An den unit-tester (Angebot, kein Bedarf):

`apps/outlook-addin/src/tags/new-name.ts` — `describeNewTag`, `addPendingTagName`,
`removePendingTagName`. Rein, ohne Uhr, ohne Netz, ohne React. Die interessanten Fälle sind in
`proof:addin` 11a gefahren; als Einheitsprüffälle wären sie billiger. Bitte **nicht** doppeln:
Der Wettlauf und der Vergleich der beiden Wege gehören in `proof:addin` und nicht in Vitest — sie
brauchen acht gleichzeitige Anfragen und eine echte migrierte Datenbank.

---

Nächster Schritt:

1. domain-dev exportiert `resolveTagNames` mit dem Zuschnitt aus Offene Frage 1; ich ersetze
   meine Fassung durch einen Import (eine Aufgabe von Minuten, danach steht die Regel wieder
   einmal im Baum).
2. Der Orchestrator entscheidet Offene Frage 2 — wem die Add-in-Abschnitte der
   Schnittstellenbeschreibung gehören.
3. documenter: `docs/architektur.md` 3.4 („der vierte Ablauf, an dem etwas kaputtgehen kann")
   beschreibt das Anlegen mit Tagnamen für **einen** Weg. Es sind jetzt zwei, mit demselben
   Schutz und derselben Regel. `docs/` gehört nicht mir.

---

Befehle, die diese Aufgabe belegen:

```
pnpm check                                          exit 0 — typecheck, boundaries, contrast
                                                    (376/376), proof:openapi, proof:callers,
                                                    proof:tags, Abdeckung, alle Bauten
pnpm --filter @takt/outlook-addin proof:addin       100 / 0  (vorher 86 / 0)
pnpm --filter @takt/outlook-addin build             fehlerfrei, 58 Module,
                                                    236,21 kB (gzip 75,12 kB)
pnpm --filter @takt/local-api proof:openapi          46 / 0
pnpm --filter @takt/local-api proof:callers          18 / 0
pnpm --filter @takt/local-api proof:tags             42 / 0
pnpm --filter @takt/local-api proof:addin-wiring     32 / 0
pnpm --filter @takt/local-api proof:access           75 / 0
pnpm --filter @takt/local-api proof:taskpane         25 / 0
pnpm --filter @takt/local-api proof:route-policy     40 / 0
pnpm --filter @takt/local-api proof:export           97 / 0
pnpm --filter @takt/local-api proof:export-api       69 / 0
pnpm --filter @takt/local-api proof:template-fields  30 / 0
pnpm --filter @takt/local-api proof:db-permissions   17 / 0
pnpm verify:bundle                                   20 / 0  (der gebündelte Sidecar startet)
```

**Zur Reihenfolge der Läufe:** `proof:tags`, `proof:access` und `proof:addin-wiring` belegen alle
Port 17843 und liefen deshalb erst, nachdem eine fremde, seit 03:31 laufende Takt-Instanz
(`scratchpad/run-app.mjs`, von einem anderen Agenten gestartet) den Port freigegeben hatte. Ich
habe sie nicht abgeschossen. `proof:addin` ist davon nicht betroffen — er hält keinen Port, auch
nicht für den Abschnitt mit der echten Datenbank.
