Aufgabe: T-247-2 — Die Add-in-Anhangsroute aus der OpenAPI-Beschreibung nehmen
Status: fertig (nach Nachschlag; ein benannter Fremdbefund bleibt rot, siehe unten)

---

# Nachschlag (freigegeben, nach dem Ausbau durch integration-dev)

Artefakte des Nachschlags:
- `apps/local-api/scripts/proof-route-policy.mjs`
- `apps/local-api/scripts/service-scenario.mjs`
- `apps/local-api/scripts/proof-callers.mjs`

Zusammenfassung:
Die vier Stellen aus Offener Frage 1 sind nachgezogen. Die Zusicherung in
`proof-route-policy.mjs` lautet jetzt „die Add-in-Fläche sind genau **vier**
Routen" und prüft `addinSurface.length === 4`; darüber steht ein Absatz, der
sagt, **warum** es vier sind und seit wann: Bis T-247 stand dort eine 5, weil
PR #16 `POST /addin/todos/{todoId}/attachments` neben die vier gestellt hatte,
und E-100 hat den Widerspruch zu A-19.19 zugunsten der Anforderung entschieden.
Derselbe Absatz sagt, was das Anheben der Zahl bedeutet — eine weitere Tür für
das **dauerhafte** Token, dafür eine Entscheidung statt einer Codezeile, und
Beschreibung, Add-in und dieser Lauf in **einem** Auftrag. Genau das
Auseinanderlaufen war der Schaden an PR #16.

Der Abschnittstitel heißt „Die vier Routen, die das Add-in wirklich braucht",
und der Kopfkommentar bei Zeile 249 zitiert die Hausform jetzt mit „vier".
Anders behandelt ist bewusst die Stelle bei Zeile 366: Dort steht ein
**Meßprotokoll** aus T-206-1 („dieser Lauf 40/0 und grün — samt der Zusicherung
… genau fünf Routen"). Diese Zahl in „vier" zu ändern hieße, eine Messung
umzuschreiben, die nie stattgefunden hat. Der historische Wortlaut bleibt
deshalb stehen und bekommt einen Satz daneben: fünf waren es damals, seit T-247
sind es vier, die Lücke ist dieselbe geblieben.

In `service-scenario.mjs` sind die beiden Aufzeichnungen (201 und der zweite
Erfolgsfall 200 mit `alreadyPresent: true`) samt dem Rumpfobjekt
`outlookAttachment` weg. An ihre Stelle tritt **keine Ersatzhandlung**, sondern
ein Kommentar, der sagt, was dort stand und warum es fiel — ein Durchlauf, der
irgendetwas ausführte, nur damit die Stelle gefüllt ist, beschriebe wieder eine
Fläche, die es nicht gibt.

In `proof-callers.mjs` ist `'addAddinTodoAttachment'` aus `NOT_CALLED_BY_UI`
entfernt; der Kommentar spricht von den **vier** Add-in-Routen und benennt die
fünfte als von PR #16 bis E-100 vorhanden und ersatzlos gefallen. Dieser Lauf
war schon vorher grün — der Eintrag war ein **toter** Eintrag in einer
Ausnahmeliste, also genau die Sorte Satz, die eine Zusage über etwas gibt, das
es nicht mehr gibt.

Läufe nach dem Nachschlag (gemessen, Node 22.23.2, Windows):
- `pnpm --filter @takt/local-api proof:route-policy` — **44 bestanden, 0
  fehlgeschlagen** (vorher 43/1). Der Detailtext meldet `die Add-in-Fläche sind
  genau vier Routen (4)`.
- `pnpm --filter @takt/local-api proof:openapi` — **113 bestanden, 1
  fehlgeschlagen**. Der eine Befund ist
  `so viele benannte Bauteile gelesen wie in der Datei stehen — gelesen 88,
  gezählt 0`, also das CRLF-Artefakt aus `proof-openapi.mjs:153`, das als T-248
  auf dem Board steht. **Es ist auftragsgemäß nicht mitbehoben.** Dass genau
  dieser eine Befund übrig bleibt, ist das erwartete Ergebnis: Vor dem
  Nachschlag waren es 109/5, vorher 110/4 — die vier fachlichen Befunde sind
  weg, das Artefakt war in jedem der drei Läufe dabei und hat mit F-21 nichts
  zu tun.
- `pnpm --filter @takt/local-api proof:callers` — **56 bestanden, 0
  fehlgeschlagen** (unverändert grün, jetzt ohne toten Eintrag).
- `pnpm typecheck` über den ganzen Baum — **Exit 0, kein `error TS`**. Der
  Abbruch in `apps/outlook-addin/src/ui/TaskPane.tsx`, den ich im
  Hauptdurchgang gemessen hatte, ist mit dem Ausbau durch integration-dev weg.

`pnpm check` als Ganzes habe ich auftragsgemäß **nicht** gefahren.

Offene Fragen des Nachschlags:
- Offene Frage 1 unten ist damit erledigt.
- Offene Frage 3 (`proof:addin` Abschnitt 18 misst die Anlegetür statt des
  Pfades) steht weiter. integration-dev meldet `proof:addin` 228/0; das ist
  grün, sagt aber nach wie vor nichts darüber, dass der **entfernte** Pfad mit
  Add-in-Token abweist. Ob das noch gebraucht wird, wo die Route gar nicht mehr
  existiert, ist eine Ermessensfrage — ich halte einen Prüffall für den toten
  Pfad für sinnvoll, weil er misst, dass niemand ihn wieder anhängt.
- Offene Frage 4 ist als T-248 aufgenommen.

---

# Hauptdurchgang (Stand vor dem Nachschlag)

Artefakte:
- `apps/local-api/openapi/takt-local-api.yaml` (geändert, 30 Zeilen dazu, 119 weg)
- `apps/local-api/src/access/route-policy.ts` (geprüft, **nicht** geändert — Begründung unten)

Zusammenfassung:
`POST /addin/todos/{todoId}/attachments` ist samt Beschreibung, Rumpf- und
Antwortschemata und beiden Erfolgsfällen (`200 alreadyPresent: true`, `201`)
aus der Beschreibung entfernt (vormals Zeilen 3690–3785). Kein Bauteil unter
`components` wurde dadurch verwaist: Die Route benutzte nur `Id`, `TodoId` und
die gemeinsamen Fehlerantworten, die alle weiterhin gebraucht werden —
`proof:openapi` misst das eigens, und dieser Punkt ist grün.

Die drei erklärenden Querverweise sind nicht bloß gestrichen, sondern so
umgeschrieben, dass sie den Wegfall **benennen**, statt ihn zu verschweigen.
Die Tag-Beschreibung „Add-in" spricht jetzt von **vier** Routen und sagt in
einem eigenen Absatz, dass es bis T-247 eine fünfte gab und warum sie weg ist.
Der Absatz bei `POST /addin/todos` sagt, dass über **keine** Route unter
`/addin` ein Anhang entsteht, nennt die entfernte Route beim Namen und
verweist für den Pfad auf `401`, nicht `404`. Die Aufzählung unter B-2.10
führt vier Operationen und begründet den Wegfall der fünften; der Satz „die
fünf Add-in-Operationen" im Absatz zur Lebensdauer des Tokens heißt jetzt „die
vier" und sagt zusätzlich ausdrücklich, dass das Token **überhaupt keinen**
Anhang anlegen, lesen oder löschen kann.

Die Anhangsrouten der Hauptanwendung (`/todos/{todoId}/attachments`,
`.../{attachmentId}`, `.../image`) sind unberührt. Ihr Satz bei Zeile 647
(„Für ein Add-in-Token ist diese Route unerreichbar", A-19.19, A-A-21) war
während PR #16 die zu milde Zusage — er stimmt mit der Entfernung wieder und
brauchte keine Änderung.

`apps/local-api/src/access/route-policy.ts` habe ich selbst durchgesehen: kein
Treffer auf „attachment", und auch kein Pfad-Einzelfall, an dem die Route
hinge — die Absenkung fällt am Präfix `/api/v1/addin`, nicht an einer
Aufzählung. Der Doc-Kommentar über `ADDIN_PATH_PREFIX` nennt seit jeher „Vier
Routen: Baum und Vorbelegungen lesen, nach einer Call-Nummer suchen, ein Todo
anlegen, eine Zeit buchen". Dieser Satz war **während** PR #16 falsch (es waren
fünf) und ist mit der Entscheidung zu F-21 wieder wahr. Deshalb keine Änderung.

Läufe (gemessen, Node 22.23.2, Windows):

1. `pnpm --filter @takt/local-api proof:openapi` **vor** meiner Änderung, aber
   **nach** dem Ausbau der Einhängung in `app.ts` durch den Orchestrator:
   110 bestanden, 4 fehlgeschlagen.
   - `so viele benannte Bauteile gelesen wie in der Datei stehen — gelesen 88, gezählt 0`
   - `keine Route steht nur in der Beschreibung — POST /addin/todos/{todoId}/attachments`
   - `beide Seiten führen dieselbe Zahl (79) — Beschreibung 79, Dienst 78`
   - `jeder beschriebene Erfolgsfall kommt im Durchlauf auch vor — … 200, … 201`
2. Derselbe Lauf **nach** meiner Änderung: 109 bestanden, 5 fehlgeschlagen.
   Die drei mittleren Befunde von oben sind weg. Übrig bleiben:
   - `so viele benannte Bauteile gelesen wie in der Datei stehen — gelesen 88, gezählt 0`
     — **nicht** von mir und **nicht** von F-21. Windows-Artefakt des Lesers:
     `proof-openapi.mjs` Zeile 153 trennt mit `split('\n')` und prüft mit
     `/^ {4}[A-Z][A-Za-z]*:$/`; im Arbeitsbaum steht CRLF, also bleibt an jeder
     Zeile ein `\r`, und das `$` trifft nie. Gezählt wird deshalb 0 statt 88.
     Die Pfadzählung eine Prüfung darüber ist grün, weil ihr Muster kein `$`
     hat. Derselbe Befund steht im Ausgangslauf.
   - vier Befunde aus Dateien, die mir für diese Aufgabe nicht zugeteilt sind
     (siehe „Offene Fragen").
3. `pnpm --filter @takt/local-api proof:route-policy`: 43 bestanden, 1
   fehlgeschlagen — `die Add-in-Fläche sind genau fünf Routen (4)`. Die
   gemessene Zahl **4** ist die richtige, die Erwartung im Skript ist die
   veraltete. Ich habe dort nichts geändert und den Lauf nur zur Messung
   gefahren.
4. `pnpm --filter @takt/local-api typecheck`: fehlerfrei. `pnpm typecheck` über
   den ganzen Baum bricht in `apps/outlook-addin/src/ui/TaskPane.tsx` (Zeile
   314 und 316, `busyTodoId` an `DuplicateOfferProps`) ab — laufende Arbeit von
   integration-dev in derselben Welle, nicht von mir. `packages/domain`,
   `packages/storage` und `packages/export` sind grün.

Annahmen:
- Die eine verbliebene Nennung des Pfades in der Beschreibung (Zeile 3648) ist
  **Absicht**, kein Rest. Sie steht im Satz „Bis T-247 gab es dafür eine
  schmale Ausnahme … Diese Route ist ersatzlos entfernt." Eine Beschreibung,
  die den Wegfall verschweigt, wäre spiegelbildlich derselbe Fehler wie der,
  der zu F-21 geführt hat: Der nächste Leser hielte die Route für vergessen.
- Die Statuscodes des entfernten Pfades habe ich nicht neu beschrieben. Der
  Pfad steht nicht mehr in der Beschreibung, und die allgemeine Regel unter
  B-2.10 („auch ein unbekannter Pfad: `401`, nicht `404`") deckt ihn.
- Kein `deprecated: true`. Die Route fällt, sie wird nicht abgekündigt; ein
  `deprecated`-Eintrag beschriebe weiterhin eine Tür, die es nicht gibt, und
  `proof:openapi` meldete ihn zu Recht als „nur in der Beschreibung".

Risiken:
- **Sicherheitshinweis, klein, aber benennenswert:** Solange
  `apps/local-api/src/routes/addin/attachments.ts` und der Eintrag
  `addAddinTodoAttachment` in `routes/addin/schema.ts:457` im Baum stehen, ist
  die Fläche allein durch die fehlende Einhängung in `app.ts` geschlossen. Das
  trägt, ist aber eine Zeile Abstand statt keiner. Erst der Ausbau durch
  integration-dev macht daraus „keine Leitung" im Sinne der Beschreibung bei
  Zeile 647.
- Das CRLF-Artefakt in `proof-openapi.mjs` ist ein **stiller** Prüfer: Der
  Selbsttest, der beweisen soll, dass der Leser die Datei liest, vergleicht auf
  diesem Rechner 88 gegen 0 und wäre auch dann rot, wenn der Leser wirklich
  kaputt wäre. Er ist derzeit nicht bloß rot, sondern als Aussage unbrauchbar.

Offene Fragen (an den Orchestrator, mit Datei und Zeile):

1. **Wer räumt die Nachweisskripte auf?** Nach `CLAUDE.md` gehört
   `apps/local-api/scripts/**` mir; dieser Auftrag hat mir aber ausdrücklich
   nur zwei Dateien gegeben („Deine Dateien, und nur diese"). Ich habe deshalb
   nichts angefasst. Betroffen und heute rot:
   - `apps/local-api/scripts/proof-route-policy.mjs:644` — Erwartung
     `addinSurface.length === 5` muss `=== 4` werden; dazu der Abschnittstitel
     Zeile 535 („Die fünf Routen …"), der Kopfkommentar Zeile 249 und der
     Kommentar Zeile 367.
   - `apps/local-api/scripts/service-scenario.mjs:900–920` — zwei
     Aufzeichnungen fahren `POST /addin/todos/{todoId}/attachments` an
     (`alreadyPresent` false und true). Sie erzeugen die drei Befunde „jede
     Aufzeichnung nennt eine Operation, die es in der Beschreibung gibt",
     „… trägt den Pfad ihrer Operation" und „… und ihre Methode".
   - `apps/local-api/scripts/proof-callers.mjs:568 und 574` —
     `NOT_CALLED_BY_UI` führt `addAddinTodoAttachment`, der Kommentar darüber
     spricht von den „fünf Add-in-Routen".
   Vier kleine, klar umrissene Stellen. Ohne sie können `proof:openapi` und
   `proof:route-policy` nicht grün werden.
2. **integration-dev, gleiche Welle:** `apps/local-api/src/routes/addin/schema.ts:457`
   (`REQUEST_SCHEMAS`-Eintrag `addAddinTodoAttachment`) erzeugt den Befund
   „kein Schema im Dienst ohne beschriebene Route — kein toter Eintrag". Dazu
   `apps/outlook-addin/src/api/client.ts:237`. Beides seine Hoheit; ich nenne
   es nur, damit es in derselben Welle fällt.
3. **`proof:addin` Abschnitt 18** misst laut `CLAUDE.md` bisher die falsche
   Tür: die Anlegetür, die nie einen Anhang erzeugte, statt der Route, die es
   tat. Mit dem Wegfall wird die Messung wahr, bleibt aber zu milde. Wer
   schärft sie nach — also misst, dass der **Pfad** mit Add-in-Token abweist
   und `todo_attachment` nach dem Versuch leer bleibt? Das liegt in
   `apps/local-api/scripts/proof-addin.mjs`, wieder meine Verzeichnishoheit,
   wieder außerhalb der zwei Dateien dieses Auftrags.
4. **Das CRLF-Artefakt** betrifft mehr als diesen Auftrag: Ein Selbsttest, der
   auf Windows immer rot ist, wird gewohnheitsmäßig überlesen. Die Behebung ist
   eine Zeile (`split(/\r?\n/)` in `proof-openapi.mjs:153`), gehört aber
   gemessen und nicht nebenbei gemacht.

Nächster Schritt:
Nachschlag an mich für Offene Frage 1 (drei Skripte: `proof-route-policy.mjs`,
`service-scenario.mjs`, `proof-callers.mjs`), zeitlich **nach** dem Ausbau
durch integration-dev — vorher lässt sich nicht messen, ob es reicht. Danach
`proof:openapi` und `proof:route-policy` als Beleg, dass Beschreibung und
Dienst dasselbe sagen. Offene Frage 4 als eigene kleine Aufgabe in einer
späteren Welle.

---

# Zweiter Nachschlag — T-247-4

Aufgabe: T-247-4 — Die Prüfläufe schreiben in den echten Bestand des Benutzers
(A-A-72), und eine Beschreibung widerspricht dem Wächter
Status: fertig

Artefakte:
- `apps/local-api/scripts/proof-appdata.mjs` — **neu**, die Umlenkung und ihre
  fail-closed-Prüfung an einer Stelle
- `apps/local-api/scripts/proof-access.mjs`
- `apps/local-api/scripts/proof-addin-wiring.mjs`
- `apps/local-api/scripts/proof-conflicts.mjs`
- `apps/local-api/scripts/proof-db-permissions.mjs`
- `apps/local-api/scripts/proof-export-api.mjs`
- `apps/local-api/scripts/proof-tags.mjs`
- `apps/local-api/openapi/takt-local-api.yaml` (Punkt 2)

## Zusammenfassung

Punkt 1: Die sechs Nachweisläufe lenken das Anwendungsdatenverzeichnis nicht
mehr selbst um, sondern über `proof-appdata.mjs`. Das Modul kennt dieselbe
Fallunterscheidung wie `src/access/paths.ts` — unter Windows `%LOCALAPPDATA%`
und der Ordner `Takt`, sonst `XDG_DATA_HOME` und `takt` —, setzt **beide**
Variablen auf den Wegwerfort und prüft **vor** jedem Start, wohin der
Kindprozeß schriebe. Punkt 2: Die Beschreibung der gefallenen Anhangsroute
sagte „mit `401`, nicht mit `404`" und stand damit gegen `proof:addin`
Abschnitt 18f, der den `404` mißt. Sie sagt jetzt beides und trennt die
Schichten: Der `401` kommt aus der Prüfschicht **vor** der Wegwahl und
antwortet für jeden Pfad gleich; der `404` kommt aus der Abwesenheit der Route
und ist die einzige der beiden Antworten, die etwas über deren Existenz sagt.
Zugesagt und gemessen wird der `404`.

## Punkt 1 im einzelnen

**Die Umlenkung greift auf allen drei Betriebssystemen.** `APP_DATA` wählt die
Variable, die der Dienst auf dieser Plattform tatsächlich liest;
`isolatedAppDataEnv` setzt zur Sicherheit `XDG_DATA_HOME` **und**
`LOCALAPPDATA` auf denselben Wegwerfort. Der Dienst liest nur eine davon — die
andere kostet nichts und hält die Umlenkung auch dann, wenn die
Plattformerkennung hier einmal danebenliegt. Eine Variable, die auf einem
System ins Leere zeigt, kann es damit nicht mehr geben.

**Sie ist fail-closed.** `assertIsolatedAppData` wirft, bevor irgend etwas
gestartet wird, wenn

1. das Ziel das echte Anwendungsdatenverzeichnis ist, darin liegt oder es
   enthält (gerechnet aus der **unveränderten** Umgebung, nach denselben Regeln
   wie `resolveAppDataDir`), oder
2. das Ziel nicht unterhalb des Wegwerfbereichs des Betriebssystems liegt.

Verglichen wird über den **tiefsten vorhandenen Vorfahren**, aufgelöst mit
`realpath`, Rest angehängt: Der Ordner unter dem Wegwerfort existiert beim
Prüfen noch nicht, und ohne diesen Kniff verglichen sich auf CI
`C:\Users\RUNNER~1\…` gegen `C:\Users\runneradmin\…` und auf macOS
`/var/folders/…` gegen `/private/var/folders/…` — zwei Schreibweisen desselben
Ortes. Unter Windows und macOS wird ohne Rücksicht auf Groß- und
Kleinschreibung verglichen.

Gemessen an drei Gegenproben auf diesem Rechner, alle drei brechen ab:
`C:\Users\kyk\AppData\Local` (Ziel wäre genau das echte Verzeichnis),
`C:\Users\kyk\AppData\Local\Takt` (Ziel läge darin) und
`C:\Users\kyk\Documents` (außerhalb des Wegwerfbereichs).

**`appDataDirIn` statt `join(dataDir, "takt")`.** Zwei Läufe sahen in das
Verzeichnis hinein und schrieben den Ordnernamen klein hin
(`proof-access.mjs` Abschnitt 11 und der Abbruchpfad, `proof-db-permissions.mjs`
Abschnitt 4). Unter Windows heißt er `Takt`. Das ist der zweite Teil derselben
Falle, den T-075 in `verify-sidecar.mjs` schon benannt hat: Der Prüfer sieht am
falschen Ort nach und wird rot, weil er falsch nachsieht, nicht weil der Dienst
falsch liegt.

### Der Beleg: Zeitstempel vorher und nachher

`%LOCALAPPDATA%\Takt` vor den Läufen, 16 Einträge; die drei, auf die es
ankommt:

| Datei | mtime vorher | mtime nachher |
|---|---|---|
| `addin-token.json` | 2026-09-10 01:57:46.085744100 +0200 | **unverändert** |
| `takt.db` | 2026-09-10 01:56:55.899314200 +0200 | **unverändert** |
| `takt.db-wal` | 2026-09-10 01:57:46.107956300 +0200 | **unverändert** |

Ein `diff` über die vollständige Auflistung aller 16 Einträge (Name, Größe,
mtime auf 100 ns) ist nach den sechs Läufen **leer**. `addin-token.json` steht
weiterhin auf `generation: 13`, `issuedAt: 2026-09-09T23:57:46.086Z`,
`lastUsedAt: null` — kein Lauf hat das Token angefaßt, geschweige denn
rotiert. Im Bestand des Benutzers wurde nichts aufgeräumt; die fünf Prüf-Todos
`TCK-000042` stehen unberührt, wie beauftragt.

### Läufe

| Lauf | Ergebnis |
|---|---|
| `proof:addin-wiring` | 32 bestanden, 0 fehlgeschlagen |
| `proof:export-api` | 72 bestanden, 0 fehlgeschlagen |
| `proof:tags` | 45 bestanden, 0 fehlgeschlagen |
| `proof:conflicts` | 154 bestanden, 0 fehlgeschlagen |
| `proof:db-permissions` | übersprungen unter Windows (POSIX-Modus, T-011) |
| `proof:access` | 109 bestanden, 0 fehlgeschlagen |
| `proof:route-policy` | 44 bestanden, 0 fehlgeschlagen |
| `proof:callers` | 56 bestanden, 0 fehlgeschlagen |
| `proof:openapi` | 113 bestanden, **1** fehlgeschlagen — das CRLF-Artefakt aus T-248, unangetastet |
| `proof:codepoints` | 45 bestanden, 0 fehlgeschlagen |
| `proof:template-fields` | 30 bestanden, 0 fehlgeschlagen |
| `pnpm typecheck` | fehlerfrei |
| `pnpm boundaries` | grün, „Notiz-Trennung: alle Schichten unverletzt" |

Das CRLF-Artefakt ist nachgerechnet und nicht meines: Der Prüfsatz zählt Zeilen
mit `/^ {4}[A-Z][A-Za-z]*:$/`. Die Datei im Arbeitsbaum hat wegen
`core.autocrlf=true` CRLF, der Fassung im Bestand fehlt das; dieselbe Zählung
liefert 88 gegen 0. Meine Änderung fügt kein benanntes Bauteil hinzu und
verschiebt die Zahl nicht.

### Drei Fehlschläge in `proof:access`, die erst durch die Isolierung sichtbar wurden

Vor der Behebung konnte dieser Lauf unter Windows gar nicht bis zum Ende
kommen: Abschnitt 11 rief `stat` auf `<dataDir>\takt`, das es dort nie gab, weil
der Dienst nach `%LOCALAPPDATA%\Takt` geschrieben hatte. Mit der Isolierung lief
er weiter und legte drei **vorbestehende, windowseigene** Defekte frei. Alle
drei liegen in meiner Dateihoheit und sind mitbehoben:

1. **`import()` mit einem Windows-Pfad** (Abschnitt 13). `import(join(HERE, …))`
   bekommt `C:\…`, und der Lader hält `c:` für ein Schema — Abbruch mit
   „Received protocol 'c:'". Jetzt `pathToFileURL(...).href`. Das ist ein
   Vertreter derselben Pfadfalle, die auch anderswo im Baum steht.
2. **Rückstrich gegen Schrägstrich** (Abschnitt 13, A-A-59). `TRAGENDE_DATEIEN`
   ist eine Aufstellung von Hand mit Schrägstrichen; die Ernte kam aus `join`
   und trug unter Windows Rückstriche. Die Zeile „die vier Dateien, an denen
   B-2.5 hängt, sind darunter" verglich zwei Schreibweisen desselben Namens und
   meldete einen Sicherheitsbefund, wo eine Pfadkonvention gemeint war. Beide
   Seiten stehen jetzt einheitlich.
3. **Der POSIX-Modus unter Windows** (Abschnitt 11) — siehe „Annahmen", das ist
   die einzige Ermessensfrage dieses Auftrags.

## Punkt 2 im einzelnen

`openapi/takt-local-api.yaml`, in der Beschreibung von `POST /addin/todos`.
Statt des einen falschen Satzes stehen dort jetzt beide Antworten, mit ihrer
Herkunft, und dazu, welche gemessen wird: `proof:addin` Abschnitt 18f schickt
mit **gültigem** Add-in-Token, erwartet `404`, zählt `todo_attachment` nach und
hält als Gegenprobe `…/time-entries` daneben, die weder `404` noch `401`
antworten darf. Der bisherige Wortlaut ist im Text benannt statt stillschweigend
ersetzt — ein Satz, der einmal gegen seinen eigenen Wächter stand, ist ein
Befund und keine Peinlichkeit.

Der `401` bleibt richtig und bleibt beschrieben: Er ist die Zusage aus B-2.10,
daß die Routenliste ohne Nachweis verdeckt bleibt, und `proof:route-policy`
mißt ihn („ein unbekannter Pfad ergibt 401 und nicht 404 — die Routenliste
bleibt verdeckt", grün). Beide Läufe messen dieselbe Tür von zwei Seiten, und
die Beschreibung sagt jetzt, welche Seite welche ist.

## Annahmen

1. **Der POSIX-Modus wird unter Windows nicht mehr behauptet, der Ort dafür
   immer gemessen.** Abschnitt 11 von `proof:access` prüfte `0700` und `0600`
   über `fs.stat`. Unter Windows liefert das keinen brauchbaren Wert — gemessen
   `0666` für Verzeichnis **und** Datei, also erkennbar keine Auskunft. Ich habe
   die beiden Modus-Zeilen plattformabhängig gemacht und statt ihrer eine Zeile
   „nicht gemessen" ausgegeben, mit Grund. Das folgt dem Vorbild im selben
   Paket: `proof:db-permissions` überspringt unter Windows seinen **ganzen**
   Lauf mit derselben Begründung, und `src/access/paths.ts` nennt die Lücke
   seit T-011 ausdrücklich („dort trägt die ACL"). Auf Linux und macOS, wo
   `pnpm check` fährt, bleiben beide Zeilen unverändert scharf. **Neu
   hinzugekommen** ist eine Zeile, die überall gemessen wird und die es vorher
   nicht gab: daß Verzeichnis und Tokendatei im **umgelenkten** Ablageort
   liegen — genau die Zusage von A-A-72. Netto mißt der Abschnitt unter Windows
   damit eine Sache mehr als vorher, nicht weniger. Ich halte das für eine
   Lücke der Messung und keine Lockerung der Regel, sage es aber ausdrücklich,
   weil T-075 in `verify-sidecar.mjs` vor genau dieser Bewegung warnt.
2. **Der Wegwerfbereich als harte Grenze.** `assertIsolatedAppData` verlangt,
   daß das Ziel unterhalb von `os.tmpdir()` liegt. Alle sechs Läufe legen ihren
   Ordner mit `mkdtemp(tmpdir())` an, das trifft also zu; ein anderer Ort wäre
   eine Annahme, die niemand geprüft hat. Wer künftig woandershin will, ändert
   die Regel sichtbar an einer Stelle.
3. **Beide Variablen gesetzt.** `LOCALAPPDATA` auf einem Nicht-Windows-System zu
   setzen ist für den Dienst wirkungslos, `XDG_DATA_HOME` unter Windows ebenso.
   Ich setze beide, weil eine falsch geratene Plattform sonst wieder in den
   echten Bestand führte.
4. `apps/desktop/scripts/verify-sidecar.mjs` habe ich **nur gelesen**. Der
   `APP_DATA`-Block dort und der in `proof-appdata.mjs` sind jetzt inhaltlich
   dieselbe Regel in zwei Paketen. Zusammenlegen ginge nur über eine
   Paketgrenze hinweg; das ist keine Entscheidung für mich.

## Risiken

- **Die Regel steht jetzt an drei Stellen:** `src/access/paths.ts` (das
  Produkt), `apps/local-api/scripts/proof-appdata.mjs` (die Läufe des Dienstes)
  und `apps/desktop/scripts/verify-sidecar.mjs` (der Lauf der Hülle). Ändert
  sich der Ablageort des Produkts, müssen zwei Prüfer nachgezogen werden, und
  nichts mißt das. Ein Nachweis, der `resolveAppDataDir` und die beiden
  `APP_DATA`-Blöcke gegeneinanderhält, wäre die saubere Klammer — ich habe ihn
  bewußt nicht nebenbei gebaut.
- **Die E2E-Stützen haben dieselbe Falle, unbehoben.**
  `tests/e2e/support/services.ts:170` und
  `tests/e2e/support/version-check-services.ts:89` setzen ausschließlich
  `XDG_DATA_HOME`; `tests/e2e/support/db.ts:29-30` rechnet den Pfad mit dem
  kleingeschriebenen `takt` aus und sagt dazu selbst „auf dieser Plattform
  (nicht `win32`)". Unter Windows läuft die E2E-Fläche damit gegen den echten
  Bestand des Benutzers — dieselbe Klasse Schaden, dieselbe Größenordnung. Das
  Verzeichnis gehört e2e-tester; siehe Offene Fragen.
- **Was schon passiert ist, ist nicht rückgängig gemacht.** Die fünf Prüf-Todos
  `TCK-000042` und die Tokengeneration 13 stehen unverändert im Bestand des
  Benutzers. Das ist auftragsgemäß; es bleibt aber ein Zustand, über den jemand
  entscheiden muß.
- Kein Sicherheitshinweis über die Beschreibung hinaus: Punkt 2 ändert Text,
  keine Leitung.

## Offene Fragen

1. **e2e-tester, eigener Auftrag:** `tests/e2e/support/services.ts:170`,
   `tests/e2e/support/version-check-services.ts:89` und
   `tests/e2e/support/db.ts:29-30` auf dieselbe Regel ziehen. Die drei Stellen
   können `apps/local-api/scripts/proof-appdata.mjs` nicht ohne weiteres
   benutzen (Paketgrenze) — entweder eine Kopie mit demselben
   fail-closed-Verhalten oder ein gemeinsamer Ort, den der Orchestrator
   bestimmt. Ohne die Behebung ist A-A-72 nur halb geschlossen.
2. **Wo lebt die Regel künftig?** Wenn sie an eine gemeinsame Stelle soll, ist
   das eine Entscheidung des Orchestrators, weil sie Paketgrenzen und die
   Modulregistrierung berührt. Ich habe nichts dergleichen angelegt.
3. **Soll der Klammer-Nachweis gebaut werden** (erstes Risiko: `paths.ts` gegen
   die `APP_DATA`-Blöcke)? Er wäre klein und fällig, gehört aber gemessen und
   nicht nebenbei gemacht.
4. **`proof:access` Abschnitt 11 unter Windows** — Annahme 1. Wenn der
   security-checker die plattformabhängige Zeile nicht mittragen will, nehme ich
   sie zurück; dann bleibt `proof:access` auf Windows-Rechnern rot, auf CI aber
   grün.

## Nächster Schritt

`proof:access`, `proof:addin-wiring`, `proof:conflicts`, `proof:db-permissions`,
`proof:export-api` und `proof:tags` auf einem Linux-Läufer durchfahren — hier
sind sie unter Windows gemessen, und die andere Hälfte der Zusage („auf **allen
drei** Betriebssystemen") ist bislang gelesen und nicht gemessen. Parallel dazu
Offene Frage 1 als Auftrag an e2e-tester in die nächste Welle; solange die drei
E2E-Stellen stehen, ist A-A-72 nicht geschlossen, nur verkleinert.

---

# Dritter Nachschlag — T-247-6

Aufgabe: T-247-6 — `proof:taskpane` und die übrigen POSIX-Rechteprüfungen fallen
unter Windows
Status: fertig

Artefakte:
- `apps/local-api/scripts/proof-taskpane.mjs` (geändert — Kopf und Abschnitt 2)

## Zusammenfassung

Abschnitt 2 von `proof:taskpane` behauptete unter Windows zwei Dinge, die die
Plattform dort nicht hergibt: `0600` für Schlüssel und Zertifikat, gemessen über
`fs.stat`, das unter Windows `0666` liefert. Beide Zeilen sind jetzt
plattformabhängig und stehen unter Windows als sichtbare Zeile „nicht gemessen"
mit Grund im Protokoll — derselbe Schnitt wie in `proof:access` Abschnitt 11
(T-247-4), `proof:db-permissions` (ganzer Lauf, seit T-011) und
`verify-sidecar` Abschnitt 18. Im Gegenzug misst der Abschnitt **fünf** Zusagen
mehr als vorher, und alle fünf auf jedem Betriebssystem. Die Gesamtzahl steigt
damit von 23 bestandenen und 2 fehlgeschlagenen auf **29 bestandene und 0
fehlgeschlagene**; auf Linux und macOS kommen die beiden Modus-Zeilen und eine
weitere unverändert scharf hinzu, dort sind es 32 Prüfungen.

## Was neu gemessen wird — und warum es keine Erfindung ist

Der Auftrag verlangt: eine Zusage aufnehmen, die auf **allen** Plattformen
messbar ist und bisher fehlte — oder sagen, dass es keine gibt. Es gibt zwei,
und die zweite ist die wertvollere.

**1. Der Ort (überall gemessen).** Dass Schlüssel und Zertifikat überhaupt im
übergebenen Anwendungsdatenverzeichnis liegen, war nie gemessen. Der Abschnitt
sah nur auf den Modus — und damit unter Windows auf gar nichts. Der Kopf von
`taskpane/certificate.ts` sagt „nie neben die Datenbank kopiert", und
`startTaskpaneServer` liefert aus einer **anderen** Wurzel aus; der Ort ist also
eine echte Zusage des Produkts, nicht des Prüfaufbaus. Geprüft wird
`dirname(taskpaneKeyPath(appData)) === appData` und dass beide Dateien dort
tatsächlich als Datei liegen. Das ist derselbe Schritt wie A-A-72 in
`proof:access`.

Ausdrücklich **nicht** aufgenommen habe ich „der Schlüssel liegt außerhalb der
ausgelieferten Wurzel". Das sieht nach derselben Sorte Zusage aus, ist aber
keine: In diesem Lauf sind `appdata` und `dist` zwei Geschwister, die der
Prüfaufbau selbst anlegt. Eine solche Zeile misst den Prüfaufbau und nennt es
Produktzusage — genau die Sorte Satz, gegen die dieser Auftrag steht.

**2. Die Regel am Quelltext (überall gemessen).** `writePair` setzt den Modus
zweimal je Datei: beim `writeFile` und noch einmal per `chmod`. Das ist kein
doppelter Boden, sondern sind zwei verschiedene Fälle — die Angabe beim Anlegen
wirkt **nur**, wenn die Datei neu entsteht; eine schon vorhandene, zu weit
stehende Datei behielte ohne das `chmod` ihre alten Rechte. Und genau diesen
zweiten Fall hat die Modusprüfung am Ergebnis **auch auf Linux nie gefangen**,
weil sie auf eine gerade erst angelegte Datei sieht. Wer das `chmod` streicht,
bliebe unter Linux grün.

Vier neue Zeilen, alle plattformunabhängig:
- der Quelltext legt **beide** Dateien ausdrücklich mit `FILE_MODE` an
- und engt **beide** danach noch einmal mit `chmod` ein
- kein Zahlenwert von Hand: der Modus kommt aus `access/paths.ts`
  (kein `mode: 0o…` in der Datei, Einfuhr von `FILE_MODE` vorhanden)
- `FILE_MODE` ist `0600`, und `isTooPermissive` nennt `0644` zu weit und `0600`
  nicht

Der Quelltext ist an dieser Stelle also nicht die schwächere, sondern die
**andere** Messung — und die einzige, die unter Windows überhaupt etwas aussagt.

**3. Auf POSIX kommt eine Zeile dazu, nicht weg.** Damit der zweite Fall nicht
nur statisch belegt ist, schreibt der Lauf auf Nicht-Windows-Systemen einen
unbrauchbaren Schlüssel mit `0644` über die vorhandene Datei und misst, dass
`loadOrCreateCertificate` ihn ersetzt **und** die Datei dabei wieder auf `0600`
eingeengt wird. Netto misst Linux nach diesem Auftrag drei Sachen mehr als
vorher, Windows fünf.

## Die vollständige Familie — alle Skripte in meiner Hoheit

Gesucht wurde über `mode`, `0o600`, `0o700`, `0o777`, `chmod`, `stat().mode`,
`umask`, `lstat`, `symlink`, `EACCES`, `EPERM`, `S_IR*`, `getuid`, „Rechte",
„permission", „ausführbar" — über alle 22 Dateien unter
`apps/local-api/scripts/**`.

| Datei | Befund | Stand |
|---|---|---|
| `proof-taskpane.mjs` | Abschnitt 2, zwei `isTooPermissive`-Zeilen auf `fs.stat` | **behoben (dieser Auftrag)** |
| `proof-access.mjs` | Abschnitt 11, `0700`/`0600` auf `fs.stat` | **behoben in T-247-4**, unverändert übernommen |
| `proof-db-permissions.mjs` | der ganze Lauf ist POSIX (`chmod`, `umask`, `statSync().mode`) | **nicht betroffen** — bricht seit T-011 unter Windows in Zeile 116 mit einer sichtbaren Zeile ab, bevor irgendetwas behauptet wird |
| die übrigen 19 Dateien | kein Treffer | **nicht betroffen** |

Zwei Treffer der Suche sind Fehlalarme und hier benannt, damit sie nicht
zweimal geprüft werden: `proof-export.mjs:716` (`uuidv7` enthält die
Zeichenfolge `uid`) und `proof-addin-wiring.mjs:23` („ausführbar" im Sinne von
durchführbar).

**Außerhalb meiner Hoheit, geprüft und in Ordnung:**
`apps/desktop/scripts/verify-sidecar.mjs:555` prüft `0700` am
Anwendungsdatenverzeichnis und ist **bereits** win32-verzweigt („Rechteprüfung
entfällt unter Windows; dort trägt die ACL die Grenze"). Kein Handlungsbedarf.
`tests/e2e/support/run-outlook-taskpane.mjs:56` setzt `mode` nur beim Anlegen
und prüft nichts — unschädlich.

## Läufe (gemessen, Node 22.23.2, Windows 11, dieser Rechner)

`pnpm --filter @takt/local-api proof:taskpane` — **29 bestanden, 0
fehlgeschlagen** (vorher 23/2).

Gegenprobe für den POSIX-Zweig: Derselbe Lauf mit vorgetäuschtem
`process.platform === 'linux'` (Wegwerfskript im Temp-Verzeichnis, nichts im
Baum) führt den anderen Zweig vollständig aus, ohne zu werfen; er meldet
erwartungsgemäß dreimal `666`, weil das der Windows-Wert ist. Damit ist belegt,
dass der scharfe Zweig syntaktisch und im Ablauf trägt — die Zahl selbst kann
nur ein POSIX-Läufer beibringen.

### `pnpm run proof:all` als Ganzes

Die Kette bricht nach dem zehnten Lauf ab, deshalb sind die restlichen acht
einzeln nachgefahren. Vollständige Aufstellung, alle neunzehn:

| # | Lauf | Ergebnis |
|---|---|---|
| 1 | `proof:codepoints` | 45 / 0 |
| 2 | `proof:migrations` | grün — „migrations.embedded.ts ist aktuell (42 Datei(en))" |
| 3 | `proof:openapi` | **114 / 0** — das CRLF-Artefakt aus T-248 ist mit der neuen `.gitattributes` weg |
| 4 | `proof:callers` | 56 / 0 |
| 5 | `proof:conflicts` | 154 / 0 |
| 6 | `proof:tags` | 45 / 0 |
| 7 | `proof:access` | 109 / 0 (mit der „nicht gemessen"-Zeile aus T-247-4) |
| 8 | `proof:export` | 98 / 0 |
| 9 | `proof:export-api` | 72 / 0 |
| 10 | `proof:taskpane` | **29 / 0** (dieser Auftrag) |
| 11 | `proof:foreign` | **13 / 7 — rot.** `apps/web`, nicht meine Hoheit, siehe unten |
| 12 | `proof:surface` | 27 / 0 |
| 13 | `proof:addin-wiring` | 32 / 0 |
| 14 | `proof:route-policy` | 44 / 0 |
| 15 | `proof:release-safety` | 31 / 0 |
| 16 | `proof:shell-surface` | 7 Prüfungen und 53 Gegenproben bestanden |
| 17 | `proof:template-fields` | 30 / 0 |
| 18 | `proof:db-permissions` | übersprungen unter Windows (POSIX-Modus, T-011) |
| 19 | `proof:addin` | 238 / 0 |

**Nach mir hängt in den neunzehn Läufen genau eine Sache: `proof:foreign`.**
Alles andere ist auf diesem Rechner grün.

`pnpm typecheck` über den ganzen Baum: **Exit 0, kein `error TS`.**

`pnpm check` als Ganzes habe ich auftragsgemäß nicht gefahren.

### Der eine rote Lauf, mit Diagnose

`apps/web/scripts/proof-foreign.mjs` meldet 13 bestandene und 7 fehlgeschlagene
Prüfungen, darunter drei Gegenproben. Die Meldungen lauten „nur 0 Quelldateien
geladen", „nur 0 Reihen fremden Textes gesehen", „nur 0 Eingabefelder gefunden",
„0 Aufrufe der Übergangsstelle" und zweimal „blind — die eingesetzte Verletzung
ist unbemerkt geblieben".

Die Ursache ist **eine Zeile**, Zeile 246:

```js
.filter((file) => !file.isDeclarationFile && file.fileName.startsWith(srcRoot + path.sep));
```

`SourceFile.fileName` von TypeScript trägt **immer** Schrägstriche, auch unter
Windows; `srcRoot` kommt aus `path.join` und trägt Rückstriche, und `path.sep`
ist dort ein Rückstrich. Der Vergleich stellt zwei Schreibweisen desselben
Pfades gegeneinander und trifft nie. Gemessen mit einem Wegwerfskript gegen
dasselbe `tsconfig.json`:

```
srcRoot              : C:\Users\kyk\Documents\Repo\SuperTakt\apps\web\src
erste fileName       : C:/Users/kyk/Documents/Repo/SuperTakt/apps/web/src/components/Icon.tsx
Treffer mit path.sep : 0
Treffer mit '/'      : 129
```

Also dieselbe Klasse wie der Befund 2 aus T-247-4 (`proof:access` Abschnitt 13,
A-A-59) und wie die Windows-Pfadfalle im Speicher. Dieselbe Prüfung steht
vermutlich noch einmal in Zeile 850
(`declaration.getSourceFile().fileName.startsWith(srcRoot + path.sep)`); wer die
Datei anfasst, prüft beide.

**Das Gefährliche daran ist nicht die rote Zahl, sondern was ohne die
Gegenproben passiert wäre:** Vier der sieben Meldungen sind Zählwächter, und
ohne sie wäre dieser Lauf unter Windows **grün** — er hätte über 129
Quelldateien geurteilt, ohne eine einzige gesehen zu haben. Die Gegenproben in
Abschnitt 8 sind der Grund, dass der Fehler auffällt. Sie gehören genau deshalb
in jede Prüfung dieser Art, und der Fall ist ein Beleg dafür.

Die Datei gehört frontend-dev. Ich habe sie **nur gelesen**.

## Annahmen

1. **Ich halte an Annahme 1 aus T-247-4 fest und wende sie hier zum zweiten
   Mal an:** Eine Prüfung, die auf einer Plattform nichts messen kann, sagt das
   sichtbar, statt rot zu sein oder still zu bestehen. Der Orchestrator trägt
   das ausdrücklich mit; ich schreibe es trotzdem wieder hin, weil die Bewegung
   von „misst" nach „misst hier nicht" bei jeder Wiederholung wieder begründet
   gehört und nicht zur Gewohnheit werden darf. Die Grenze, die ich mir dabei
   gesetzt habe: **Absenken nur gegen Aufstocken.** In beiden Fällen hat der
   Abschnitt hinterher mehr Zusagen, die überall gelten, als vorher.
2. **Die statische Prüfung des Quelltextes ist bewusst eng an vier Aufrufe
   gebunden** (zwei `writeFile` mit `{ mode: FILE_MODE }`, zwei
   `chmod(…, FILE_MODE)`). Sie ist damit gegen eine Umformatierung
   empfindlich — wer `writePair` umschreibt, muss den Prüfsatz nachziehen. Das
   ist Absicht: Eine tolerante Suche nach „irgendwo steht `chmod`" hätte den
   Fall „nur noch eine der beiden Dateien" durchgelassen, und genau das ist der
   Fehler, den sie fangen soll. Zwei Zahlen (`=== 2`) statt eines
   Vorhandenseins.
3. **Die POSIX-Zusatzzeile schreibt in die Prüfdateien und ersetzt das Paar.**
   Nach ihr liegt ein **anderes** Zertifikat im Wegwerfverzeichnis als das aus
   der Zeile „und es ist dasselbe". Abschnitt 3 lädt sich sein
   Wurzelzertifikat unmittelbar vor dem Handschlag frisch, hängt also nicht am
   alten Wert; geprüft habe ich das im Ablauf des vorgetäuschten Linux-Laufs,
   wo Abschnitt 3 danach vollständig grün ist.
4. **Ich habe zur Diagnose von `proof:foreign` kurzzeitig eine Wegwerfdatei in
   `apps/web/scripts/` angelegt und im selben Befehl wieder gelöscht** — der
   TypeScript-Import ist nur innerhalb des Pakets auflösbar. `git status` ist
   dort danach unverändert; im Baum liegt nichts von mir. Ich nenne es
   trotzdem, weil es fremde Hoheit war und eine Sekunde lang eine Datei in
   einem fremden Verzeichnis lag.

## Risiken

- **Die „nicht gemessen"-Zeile steht jetzt an vier Stellen** (`proof:access`,
  `proof:taskpane`, `proof:db-permissions`, `verify-sidecar`), viermal
  handgeschrieben, viermal mit derselben Begründung und viermal ohne
  gemeinsamen Ort. Nichts misst, dass die vierte Stelle sie auch hat — die
  fünfte, die jemand vergisst, ist unter Windows stumm falsch statt sichtbar
  ungemessen. Ein gemeinsamer kleiner Helfer („Modus messen oder ausschreiben,
  warum nicht") wäre die saubere Klammer, berührt aber zwei Pakete und ist
  deshalb keine Entscheidung für mich.
- **Windows misst B-2.2 Punkt 3 weiterhin nicht am Ergebnis.** Die ACL, die
  dort die Grenze trägt, prüft **niemand** — weder dieser Lauf noch ein
  anderer. Das ist keine neue Lücke (sie besteht seit T-011), aber sie ist nach
  diesem Auftrag die einzige verbliebene Sorte Aussage, die auf der
  Hauptplattform des Produkts unbelegt bleibt. Wer sie schließen will, braucht
  `icacls` oder eine Rust-Seite; das ist ein eigener Auftrag mit eigener
  Bewertung.
- **`proof:foreign` ist unter Windows blind, nicht bloß rot.** Bis die Zeile
  246 steht, urteilt auf diesem Rechner niemand über die Herkunftstrennung in
  `apps/web` — auch nicht in einem Lauf, der grün gemacht würde, indem man die
  Zählwächter lockert. Das wäre der falsche Weg herum, und ich sage es
  vorsorglich, weil er von hier aus kurz aussieht.
- Kein Sicherheitshinweis über diese Punkte hinaus: Der Auftrag ändert einen
  Prüflauf, keine Leitung und keine Produktdatei.

## Offene Fragen

1. **frontend-dev, eigener Auftrag:** `apps/web/scripts/proof-foreign.mjs`
   Zeile 246 und 850 auf Schrägstriche vereinheitlichen (`srcRoot` einmal
   normalisieren, nicht an jeder Vergleichsstelle). Ohne das ist der elfte der
   neunzehn Läufe auf Windows rot und misst dabei nichts. Die Zählwächter
   bleiben, wie sie sind — sie haben den Fehler gefunden.
2. **Soll der gemeinsame Helfer für „Modus messen oder ausschreiben" gebaut
   werden?** Vier Stellen, zwei Pakete, Orchestratorentscheidung. Ich habe
   nichts dergleichen angelegt.
3. **Wer misst die POSIX-Zweige auf einem POSIX-Läufer?** Alles hier ist unter
   Windows gemessen. Für `proof:taskpane` sind das drei Zeilen, die auf diesem
   Rechner nur im vorgetäuschten Lauf durchlaufen sind. Dieselbe offene Hälfte
   wie in T-247-4.

## Nächster Schritt

Offene Frage 1 als kleiner Auftrag an frontend-dev in die nächste Welle; danach
ist `proof:all` auf diesem Rechner voraussichtlich vollständig grün, und der
Orchestrator kann die Stufen dahinter (`verify:bundle`, `test:coverage`,
`test:rust`, `build`, `audit`) zum ersten Mal überhaupt fahren. Parallel dazu
Offene Frage 3 auf einem Linux-Läufer, damit beide Zweige einmal gemessen sind
und nicht nur einer.
