Aufgabe: T-247 — Code-Review des Rückbaus der Anhäng-Fläche im Outlook-Add-in
Status: braucht Review — **Nacharbeit**

Artefakte: `.claude/team/reports/T-247-code-reviewer.md` (nur diese Datei geschrieben)

## Selbst gemessen (Windows 11, Node 22.23.2, pnpm 11.3.0)

- `pnpm typecheck` (Wurzel, 8 Projekte + `typecheck:test` + `typecheck:e2e`) — **grün**
- `pnpm boundaries` — **grün**
- `pnpm --filter @takt/outlook-addin proof:addin` — **228 / 0**
- `pnpm --filter @takt/local-api proof:route-policy` — **44 / 0** (nachgezogen, grün)
- `pnpm --filter @takt/local-api proof:callers` — **56 / 0**
- `pnpm --filter @takt/local-api proof:openapi` — **113 / 1**, einziger Befund das
  CRLF-Artefakt (T-248, nicht diese Welle)
- `npx vitest run apps/outlook-addin/test` — 18 / 18
- `pnpm --filter @takt/local-api proof:addin-wiring` — **27 / 5**, *nicht* 32 / 0 wie im
  Auftrag angegeben. Ursache gemessen, siehe Befund `hoch` unten. Keiner der fünf
  Fehlschläge kommt aus dem Rückbau.

Zusätzlich zwei eigene Messungen im Kritzelverzeichnis (keine Projektdatei berührt):

1. **Aufstellung des zusammengesetzten Dienstes** — unter `/addin` stehen genau vier
   Pfade, ohne Middleware-Platzhalter: `GET /api/v1/addin/context`,
   `GET …/todo-matches`, `POST …/todos`, `POST …/todos/:todoId/time-entries`.
2. **Rot-Probe für 18f** — dieselbe Klammer, die Route zur Laufzeit wieder eingehängt:
   der Versuch antwortet **201**, `assert.equal(…, 404)` schlägt fehl, und die
   Pfadaufstellung schlägt getrennt ebenfalls fehl. **Beide Beine von 18f können rot
   werden.**
3. **Statuscodes des entfernten Pfades**, gemessen: ohne Token `401`, mit Add-in-Token
   `404`, mit Sitzungsgeheimnis `404`.

## Befunde

```
apps/local-api/src/app.ts:255                    hoch    Der Kommentar über `addinDeps` sagt weiterhin, der Aufgabenbereich dürfe „einen **http(s)-Verweis** an ein erkanntes Todo hängen", und beschreibt in Zeile 256–257 „die neue Anhangroute". Eine Zeile darunter wird sie nicht mehr eingehängt. Das ist der Befund aus F-21 spiegelverkehrt, und ausgerechnet in der Datei, deren eigener Kopf (Zeile 14) sagt: „Einhängen unten in **einem** Block: Was dort nicht steht, gibt es nicht." Fix: Satz auf vier Fähigkeiten kürzen (lesen, suchen, anlegen, buchen), Halbsatz zum Verweis und die zwei Sätze zur Anhangroute streichen, Wegfall mit T-247/E-100 benennen wie in `routes/addin/ports.ts`. Datei gehört domain-dev bzw. dem Orchestrator, der sie in dieser Welle geändert hat.
apps/local-api/openapi/takt-local-api.yaml:3651  hoch    „Der Pfad ist damit ein unbekannter Pfad und beantwortet sich wie jeder andere mit `401`, nicht mit `404` (B-2.10)." Gemessen antwortet er mit gültigem Add-in-Token **404** — genau das misst `proof:addin` 18f und macht es zur Zusage. Die Beschreibung widerspricht dem eigenen neuen Wächter. Fix: Satz qualifizieren — „ohne gültigen Nachweis `401` (B-2.10, kein Pfad wird verraten); mit gültigem Add-in-Token `404`, und genau das misst `proof:addin` 18f."
apps/local-api/scripts/proof-addin-wiring.mjs:141 hoch   Die Isolierung läuft über `XDG_DATA_HOME`. Auf Windows liest `apps/local-api/src/access/paths.ts:37` `%LOCALAPPDATA%`; die Variable hat keine Wirkung. Gemessen: der Lauf schreibt in `%LOCALAPPDATA%\Takt\takt.db` (Zeitstempel nach dem Lauf), fand fünf Todos mit `TCK-000042` aus früheren Läufen vor und meldet 27/5 statt 32/0. Der Prüflauf verändert die echten Benutzerdaten und ist auf Windows nicht wiederholbar; die im Auftrag genannte Messung „32/0" ist nicht reproduzierbar. Fix: `databaseLocation` bzw. `LOCALAPPDATA` mitsetzen (`env: { ...process.env, XDG_DATA_HOME: dataDir, LOCALAPPDATA: dataDir }`) und den Lauf vor dem ersten Prüffall gegen eine leere Datenbank absichern. Vorbestehend, nicht aus T-247 — blockiert diese Freigabe aber, weil ohne ihn kein grüner Beleg für die Add-in-Verdrahtung existiert.
apps/outlook-addin/scripts/proof-addin.mjs:4552  mittel  `zeigtFremdes` rechnet die Foreign-Pflicht aus `FREMDE_WERTE` (Zeile 4485). `DuplicateOffer.tsx` zeigt nach dem Rückbau `first.callNumber` (Zeile 26) — der Name steht nicht in der Liste, also fällt die Datei aus der Prüfung heraus, und `anzeigende.length >= 3` bleibt grün. Der Umbau macht den Wächter genau an der Datei blind, an der die einzige fremde Angabe übrig ist. Fix: `'first.callNumber'` (oder `'.callNumber'`) in `FREMDE_WERTE` aufnehmen — dann verlangt die Zeile den Baustein von selbst, wie ihr eigener Kommentar verspricht.
apps/outlook-addin/src/ui/DuplicateOffer.tsx:26  niedrig Urteil zur zweiten Frage des Auftrags: Die Begründung **trägt**, aber nur mittelbar. `first.callNumber` kommt aus `checkCallNumber` (`packages/domain/src/call-number.ts:112`), und `ALLOWED_SHAPE = /^[A-Za-z0-9._\/-]+$/` bei 3–64 Zeichen lässt weder Bidi-Steuerzeichen noch Nullbreiten noch RTL zu; `<bdi>` und `visibleText` wären hier wirkungslos, React maskiert ohnehin. Kein Fehler heute. Der Haken ist die Kopplung: Die Sicherheit dieser Zeile liegt in einer Konstante eines fremden Pakets, und nach dem Rückbau misst nichts mehr, dass sie dort liegt. Fix: entweder `<Foreign value={first.callNumber} className="mono" />` in die Überschrift (kostet nichts, gibt der Nummer nebenbei die mit `.badge--call` verlorene Monoschrift zurück), oder ein Prüffall, der die Abhängigkeit von `ALLOWED_SHAPE` festnagelt. Eines von beidem, nicht keines.
apps/outlook-addin/src/duplicate/rule.ts:91      mittel  Urteil zur ersten Frage des Auftrags: **keine saubere Lage.** Produktiv gelesen werden nach dem Rückbau genau `offers.length` und `first.callNumber`. `summary` (Zeile 91), `title`, `todoId`, `isDone`, `openSeconds`, `exportedSeconds`, `poolMovement` und die ganze Zusammensetzung in `describeOffer` (Zeile 110–136) samt `formatDuration` (Zeile 94) haben null Leser im Erzeugnis. Abschnitt 5 von `proof:addin` misst damit nur noch sich selbst — dieselbe Sorte Messung, gegen die 18f gebaut wurde. Fix (nicht in dieser Welle, aber als Aufgabe): entweder Rückbau von `OfferDescription` auf `callNumber` in **einem** Auftrag mit Abschnitt 5, oder ein benannter Vermerk an Ort und Stelle plus Eintrag im Board, warum die Rechnung stehenbleibt. Schweigen ist die eine Option, die nach diesem Befund nicht mehr offen ist.
apps/outlook-addin/src/duplicate/reopen.ts:110   mittel  Dasselbe Muster, eine Stufe größer und **vorbestehend**: Das ganze Modul (`ReopenNotice`, `REOPEN_HINT`, `BookingNotice`, `bookingOutcome`, `reopenPreview`, `reopenOutcome`) hat außerhalb von `proof-addin.mjs:52` keinen Aufrufer — schon vor T-247 nicht, `git grep` gegen HEAD bestätigt es. Fix: mit dem Punkt darüber in **einer** Aufgabe entscheiden; ein Modul, das nur seinen Prüflauf bedient, ist keine Fachlogik.
apps/local-api/scripts/proof-callers.mjs:1093    mittel  „jede Operation unter /addin hat einen Aufrufer im Aufgabenbereich" liest nur `api/client.ts`. `ApiClient.book` (`apps/outlook-addin/src/api/client.ts:211`) hat seit PR #15 keinen Aufrufer im Aufgabenbereich — gemessen, kein einziges `api.book(` in `src/`. Damit gilt `POST /addin/todos/{todoId}/time-entries` als benutzt, obwohl das dauerhafte Token dort eine Schreibtür offenhält, die keine Fläche bedient. Der Kommentar Zeile 1083–1086 verspricht ausdrücklich das Gegenteil („eine Tür, die der Dienst offenhält und die niemand benutzt"). Ausgerechnet diese Route ist die Gegenprobe von 18f. Fix: den Leser über die Oberflächendateien laufen lassen, nicht über den Zugang — oder `book` und die Route in einer Entscheidung klären.
apps/outlook-addin/src/config.ts:44              niedrig `DURATION_PRESETS_MINUTES` (Zeile 53) und `MAX_DURATION_MINUTES` (Zeile 56) haben null Leser; der Kommentar darüber nennt als Zweck „auf vorhandenes Todo buchen (A-10.9)" — eine Handlung, die A-10.9 seit E-100 ausdrücklich ausschließt. Fix: beide Konstanten mit ihrem Kommentar streichen, im selben Auftrag wie `book`.
apps/outlook-addin/src/styles/addin.css:819      niedrig `.effects` und `.effects > li` treffen kein Element mehr (kein `className` mit `effects` in `src/**/*.tsx`). Das ist genau der T-092-Präzedenzfall, mit dem der Kommentar acht Zeilen tiefer (Zeile 838–844) den Wegfall von `.badge` begründet. Der Satz steht über der Regel, die ihn bricht. Fix: mit `duplicate/reopen.ts` zusammen fallen lassen.
apps/outlook-addin/src/styles/addin.css:800      niedrig `.offer` (Rahmen, Polster, Radius, `--bg-surface`) umschließt jetzt genau ein `.callout--warning`, das selbst Rahmen, Polster und Radius trägt (Zeile 479–487). Doppelter Rahmen um einen einzelnen Hinweis. Fix: entweder `.offer` auf `margin`/`display` reduzieren oder das `<div className="offer">` in `DuplicateOffer.tsx:30` ganz fallen lassen. Urteil gehört ui-designer.
apps/outlook-addin/src/ui/TaskPane.tsx:378       niedrig `FIELD_LABEL` kennt `dueDate` nicht (und kannte es nie). Ein 422 des Dienstes mit `details[].field = "dueDate"` — von `routes/addin/index.ts:275` ausdrücklich zugesagt — erscheint in der deutschen Oberfläche als „dueDate: …". Vorbestehend, verschärft dadurch, dass mit `url` gerade der einzige andere Fremdfall aus der Tabelle fiel. Fix: `dueDate: 'Frist'` ergänzen (A-19.2 nennt genau dieses Wort).
docs/design/textbestand-aufgabenbereich.md:3     mittel  Die Gegenrichtung, die der Auftrag ausdrücklich verlangt: Der Nachtrag „PR #15" behauptet weiter eine Fläche, die es nicht mehr gibt — „wird die E-Mail als Outlook-Verweis angehängt" (Zeile 6), „das neue Anhangsangebot" (Zeile 8), „die neue Folgehandlung" (Zeile 14), „SP-A-24 wird durch das ausdrückliche Anhangsangebot ersetzt" (Zeile 15), die Bedeutungsspalten zu SP-A-27/28 (Zeile 21–22), „Abschnitt 21 prüft die Wirkung" (Zeile 25, Abschnitt gestrichen) und „V-08 gilt weiter" (Zeile 26, Prüfung gestrichen). Dazu Zeile 278 und 352 mit der alten Knopfbeschriftung „Todo anlegen". Fix: Nachtrag in **einem** Auftrag an ux-designer/ui-designer nachziehen; Datei liegt in fremder Hoheit, kein Agent dieser Welle durfte sie anfassen.
docs/glossar.md:193                              mittel  „Der Teil von Takt, der … aus einer E-Mail heraus ein Todo anlegt **oder auf ein vorhandenes bucht**." Das ist seit E-100 falsch. Ebenso Zeile 185: „weil der Benutzer selbst entscheiden soll, ob er auf ein vorhandenes Todo bucht oder ein zweites anlegt (A-10.9)". Fix: an den neuen Wortlaut von A-10.9 angleichen — das Add-in **weist hin** und handelt am gefundenen Todo nicht. Hoheit documenter.
docs/testplan.md:1396                            niedrig „Anbieten ‚auf vorhandenes Todo buchen' bestätigen" und Zeile 1538 („auf vorhandenes Todo buchen vs. neu anlegen (TP-ADDIN-02)") beschreiben einen Ablauf, den es nicht mehr gibt. Hoheit e2e-tester.
tests/e2e/attachment-export-and-addin-exclusion.spec.ts:154 niedrig TP-ANH-13 misst weiterhin nur die **Anlegetür** (Zusatzfeld ohne Wirkung). Die schärfere Messung — 404 auf `POST /addin/todos/{id}/attachments` mit gültigem Token, Gegenprobe gegen `…/time-entries` — steht bisher nur in `proof:addin` 18f. Fix: dieselbe Gegenprobe in den E2E-Fall, damit der Befund aus F-21 an beiden Toren gemessen wird. Hoheit e2e-tester.
apps/outlook-addin/src/ui/TaskPane.tsx:371       niedrig Der Knopf heißt jetzt „Neue Aufgabe anlegen". Der Glossar führt „Todo" als Oberflächenwort und hält unter „Geklärte Doppelbenennungen" ausdrücklich fest, dass zwei Wörter für dieselbe Sache Kosten haben; „Aufgabe" ist im Glossar nur die Umschreibung in der Definitionsspalte (`docs/glossar.md:166`). E-087 ist erfüllt — ich habe den alten Wortlaut über `git grep` **und** über `apps/*/src`, `packages/*/src`, `tests/` gesucht: keine Prüfung nagelt „Todo anlegen" fest, nur Kommentare und `docs/design/textbestand-aufgabenbereich.md:278/352`. Trotzdem ist die Umbenennung nicht vom Auftrag gedeckt. Fix: spec-ux-reviewer entscheidet — entweder zurück auf „Todo anlegen" oder Glossar und Textbestand in einem Auftrag nachziehen.
apps/desktop/src-tauri/Cargo.toml                niedrig In `git status` als geändert geführt, `git diff --numstat` zeigt null Zeilen — reines Zeilenende-/stat-Artefakt in der Hoheit von frontend-dev, in dieser Welle lief dort kein Agent. Fix: nicht mit T-247 einchecken.
```

## Ausdrückliches Urteil zu den drei Prüffragen des Auftrags

**1. Der Rückbau selbst.** Vollständig, nicht bloß unsichtbar. Route, Schema,
`REQUEST_SCHEMAS`-Eintrag, `AttachmentPort` in `AddinUnit`, Zugangsmethode,
Anfrage-/Antworttyp, Zustand (`busyTodoId`), Herkunft (`outlookWebLink`,
`HostState.webLink`), der `attached`-Zweig von `DoneView` und der tote Stil sind weg;
`noUnusedLocals`/`noUnusedParameters` decken den Rest, `pnpm typecheck` ist grün.
Verschluckt wurde **kein** Fehlerpfad: `outlook_link_unavailable` und der
`!canAttach`-Hinweis fielen mit ihrer Handlung, und mit `outlookWebLink` verschwindet
sogar ein echtes `catch { return null }`. Übrig bleibt toter Code aus **PR #15**, nicht
aus diesem Rückbau (`reopen.ts`, `book`, `DURATION_PRESETS_MINUTES`, `.effects`) — plus
der durch den Rückbau neu entstandene tote Anteil in `OfferDescription`.

**2a. `describeOffers`.** Kein sauberer Zustand. Abschnitt 5 misst nach dem Rückbau eine
Rechnung, die niemand liest — siehe Befund `rule.ts:91`. Die Entscheidung, sie nicht
anzufassen, war für **diese** Welle richtig (E-078 Punkt 3, fremdes Urteil); sie ohne
Vermerk und ohne Boardeintrag stehen zu lassen, ist es nicht.

**2b. Rohe Call-Nummer in der Überschrift.** Die Begründung trägt sachlich — `ALLOWED_SHAPE`
lässt kein Zeichen zu, gegen das `<Foreign>` schützt. Sie trägt aber nicht als
**Konstruktion**: Nach dem Rückbau misst nichts mehr, dass diese Zeile von jener Konstante
abhängt, und der umgebaute Foreign-Wächter schließt ausgerechnet diese Datei aus. Siehe
`DuplicateOffer.tsx:26` und `proof-addin.mjs:4552`.

**3. Der Wächter.** 18f misst wirklich und **kann rot werden** — beide Beine, von mir
mutierend belegt (Route zur Laufzeit wieder eingehängt: 201 statt 404, Aufstellung
ebenfalls rot). Er ist echt schärfer als der alte Abschnitt 18: zusammengesetzter Dienst
statt Teilbaum, gültiges Add-in-Token statt anonymem 401, Gegenprobe gegen die
Nachbarroute im selben Lauf, Wirkung (`COUNT(*) FROM todo_attachment`) neben dem Status,
Untergrenzen (`>= 4`) gegen die stille leere Messung, und hermetisch über `:memory:`.
Eine Einschränkung: Die Gegenprobe hängt an `…/time-entries`, und genau diese Route hat
im Aufgabenbereich keinen Aufrufer mehr — siehe `proof-callers.mjs:1093`. Das entwertet
18f nicht, aber die Nachbarschaft ist dünner, als sie aussieht.

**4. Sätze über die Fläche.** In der Gegenrichtung sind **fünf** Stellen übrig, die eine
Fläche behaupten, die es nicht mehr gibt: `app.ts:255`, `openapi:3651` (widerspricht dem
eigenen neuen Wächter), `docs/design/textbestand-aufgabenbereich.md:3–26/278/352`,
`docs/glossar.md:185/193`, `docs/testplan.md:1396/1538`. Innerhalb der Hoheit von
integration-dev und domain-dev ist dagegen **nichts** übrig — `routes/addin/index.ts`,
`schema.ts`, `ports.ts`, `proof-callers.mjs`, `proof-route-policy.mjs` und
`service-scenario.mjs` benennen den Wegfall, statt ihn zu verschweigen, und das ist die
richtige Form. Die Zusagen zu A-19.19 in `bedrohungsmodell.md` (A-A-21, A-A-22),
`glossar.md:157/187`, `benutzerhandbuch.md:159/650` und `spec.md:402` sind durch den
Rückbau **wieder wahr** und brauchen keine Änderung.

## Dateihoheit

Kein Verstoß in den Änderungen dieser Welle: integration-dev blieb in
`apps/outlook-addin/**` und `apps/local-api/src/routes/addin/**`, domain-dev in
`apps/local-api/openapi/**` und `apps/local-api/scripts/**`, der Orchestrator in `app.ts`,
`docs/spec.md`, `CLAUDE.md` und den drei Steuerdateien. Einzige Auffälligkeit ist die
inhaltsleere Änderung an `apps/desktop/src-tauri/Cargo.toml`.

## Urteil

**Nacharbeit.**

Blockierend sind die drei Befunde mit Schwere `hoch`:

1. `apps/local-api/src/app.ts:255` — der Kommentar behauptet die Anhangroute genau über
   dem Block, der sie nicht mehr einhängt. Dieser Auftrag ist daran entstanden, dass
   Sätze und Fläche auseinanderliefen; er darf nicht mit demselben Fehler in der
   Gegenrichtung schließen.
2. `apps/local-api/openapi/takt-local-api.yaml:3651` — die Beschreibung sagt `401`, der
   Dienst antwortet `404`, und `proof:addin` 18f misst die `404` als Zusage. Von zwei
   Aussagen über dieselbe Adresse ist eine falsch.
3. `apps/local-api/scripts/proof-addin-wiring.mjs:141` — der Lauf isoliert sich auf
   Windows nicht, schreibt in die echte Benutzerdatenbank und ist bei mir 27/5. Ohne ihn
   fehlt der Freigabe der Beleg, dass die vier verbliebenen Add-in-Routen am echten
   Datenpfad tun, was sie sollen. Der Befund ist vorbestehend; die Freigabe hängt
   trotzdem an ihm.

Nicht blockierend, aber vor dem Abschluss von T-247 einzuplanen:
`proof-addin.mjs:4552` (Foreign-Wächter blind an `DuplicateOffer.tsx`),
`rule.ts:91` (Abschnitt 5 misst sich selbst) und
`docs/design/textbestand-aufgabenbereich.md` / `docs/glossar.md` (fremde Hoheit, gehören
in denselben Auftrag wie die Entscheidung).

Zusammenfassung: Der Rückbau ist handwerklich sauber, der neue Wächter ist echt und rot-fähig, und der Schnitt im Quelltext ist vollständig. Was fehlt, sind fünf Sätze, die die gefallene Fläche noch behaupten — davon zwei in Produktivdateien und einer im Widerspruch zum neuen Wächter — und ein Prüflauf, der sich auf Windows nicht isoliert und deshalb die im Auftrag genannte Messung nicht belegt.

Annahmen: Die zwei Fragen, die integration-dev an den spec-ux-reviewer gerichtet hat, habe ich als Code-Reviewer beantwortet, soweit sie technisch entscheidbar sind, und die Produktentscheidung ausdrücklich dort gelassen, wo sie hingehört.

Risiken: Sicherheitsseitig ist die Fläche des dauerhaften Tokens echt geschrumpft (kein `AttachmentPort` mehr, vier Routen statt fünf, gemessen). Offen bleibt, dass `POST /addin/todos/{todoId}/time-entries` eine Schreibtür ohne Fläche ist und dass `proof:addin-wiring` auf Windows in die echten Benutzerdaten schreibt.

Offene Fragen: Wer zieht `docs/design/textbestand-aufgabenbereich.md` und `docs/glossar.md` nach — und in welchem Auftrag fällt die Entscheidung über `describeOffers`, `reopen.ts`, `book` und `DURATION_PRESETS_MINUTES`?

Nächster Schritt: Die drei `hoch`-Befunde in einer kleinen Welle beheben (app.ts und OpenAPI an domain-dev bzw. Orchestrator, `proof-addin-wiring.mjs` an domain-dev), danach `proof:addin-wiring` und `proof:openapi` als Beleg fahren und diese Prüfung wiederholen. Textbestand und Glossar als eigener Auftrag an ux-designer/ui-designer und documenter.

---

# Runde 2 — Wiedervorlage nach der Nacharbeit (2026-09-10)

Status: **braucht Review — freigegeben**

Artefakte: `.claude/team/reports/T-247-code-reviewer.md` (nur diese Datei geschrieben)

## Selbst gemessen (Windows 11, Node 22.23.2, pnpm 11.3.0)

| Lauf | Runde 1 | jetzt |
|---|---|---|
| `pnpm typecheck` (8 Projekte + Test + E2E) | grün | **grün** |
| `pnpm boundaries` | grün | **grün** |
| `proof:addin` | 228 / 0 | **238 / 0** |
| `proof:addin-wiring` | **27 / 5** | **32 / 0** |
| `proof:route-policy` | 44 / 0 | **44 / 0** |
| `proof:callers` | 56 / 0 | **56 / 0** |
| `proof:openapi` | 113 / **1** (CRLF) | **114 / 0** |
| `proof:access` | — | **109 / 0** (ein sichtbares `--` unter Windows) |
| `proof:foreign` (web) | 13 / 7, **0 Quelldateien** | **21 / 0, 129 Quelldateien** |

Vier eigene Messungen über die Läufe hinaus:

1. **Die Isolierung greift wirklich.** `%LOCALAPPDATA%\Takt` trägt nach dem
   `proof:addin-wiring`-Lauf um 09:56 unverändert die Zeitstempel 01:56/01:57 — weder
   `takt.db` noch `takt.db-wal` noch `addin-token.json` sind angefaßt. Genau das war der
   Schaden aus Befund 3.
2. **Fail-closed selbst ausgelöst,** drei Proben gegen `isolatedAppDataEnv`: echtes
   `%LOCALAPPDATA%` → wirft; ein Pfad unter `$HOME` außerhalb von `tmpdir()` → wirft; ein
   `mkdtemp`-Ordner → beide Variablen gesetzt. Der Riegel ist keine Zusage.
3. **Die Rundfahrt von 18f am laufenden Dienst nachgebaut** (Kritzelverzeichnis, keine
   Projektdatei berührt), mit demselben `PROBE_RUMPF`. Ergebnis siehe Befund
   `proof-addin.mjs:5928` — drei der vier Routen antworten 200/200/201, die vierte **422**.
4. **Der Foreign-Wächter des Aufgabenbereichs gerechnet:** alle vier Flächen aus
   `paneDateien` treffen einen Wert aus `FREMDE_WERTE`, und zwar im **Code**, nicht im
   Kommentar (gegen den ganzen Text und gegen den Text ohne Kommentare gemessen — dieselbe
   Menge).

## Die drei blockierenden Befunde aus Runde 1

**1. `apps/local-api/src/app.ts:255` — erledigt.** Der Kommentar zählt jetzt vier Fähigkeiten
(lesen, suchen, anlegen, buchen), sagt „**Anhängen darf er nicht** — weder einen Verweis noch
eine Datei noch ein Bild", nennt Herkunft (PR #16), Entscheidung (F-21/E-100) und Messung
(`proof:addin` 18f) und schließt mit „A-19.19 ist damit strukturell wahr, nicht zugesagt".
Das ist mehr als die Streichung, die ich verlangt hatte, und es ist die bessere Form: Der
Wegfall steht da, statt spurlos zu sein.

**2. `apps/local-api/openapi/takt-local-api.yaml:3651` — erledigt.** Beide Antworten stehen
mit ihrer Schicht: `401` aus der Prüfschicht **vor** der Wegwahl (sagt nichts über Existenz),
`404` aus der Abwesenheit der Route (sagt etwas darüber), und der Satz „Zugesagt und gemessen
wird deshalb die zweite" bindet die Beschreibung an 18f. Die alte Fassung ist ausdrücklich als
falsch benannt statt stillschweigend ersetzt. `proof:openapi` ist dabei von 113/1 auf **114/0**
gegangen — das CRLF-Artefakt (T-248) ist mitgefallen.

**3. `apps/local-api/scripts/proof-addin-wiring.mjs:141` — erledigt, und breiter als verlangt.**
Ich hatte `LOCALAPPDATA` mitzusetzen vorgeschlagen. Gebaut ist statt dessen ein eigenes Modul
für alle sechs Läufe, mit einem Riegel, den ich nicht verlangt hatte und der mehr wert ist als
mein Vorschlag: `assertIsolatedAppData` prüft **vor** dem Start, ob das Ziel das echte
Anwendungsdatenverzeichnis berührt oder außerhalb von `tmpdir()` liegt, und bricht ab. Der
Realpath über den tiefsten vorhandenen Vorfahren ist der richtige Griff — `RUNNER~1` und
`/var/folders` hätten die Prüfung sonst grundlos ausgelöst. Gemessen: 32/0, echter Bestand
unberührt, Riegel löst in beiden Richtungen aus.

**Alle drei sind erledigt.** Keiner ist durch eine Formulierung erledigt, alle drei durch eine
Änderung, die ich nachgemessen habe.

## Antwort auf die vier Prüffragen dieser Runde

**1. Die Untergrenze des Foreign-Wächters — macht sie einen berechtigten Rückbau rot?**
**Ja, aber die Zahl ist eine Zufallsübereinstimmung.** `paneDateien` (Zeile 4733) hat heute
genau **vier** Einträge, und die Untergrenze steht bei `>= 4`. Sie heißt damit in Wahrheit
„**alle**", nicht „mindestens vier", und niemand hat das aufgeschrieben. Fällt eine Fläche
heraus, wird sie rot und nennt in der Meldung, **welche** — das ist genau das Verlangte.
Kommt aber eine **fünfte** Pane-Datei dazu, die zu Recht keinen fremden Wert zeigt, bleibt
`>= 4` grün, während eine der ursprünglichen vier still herausfällt. Der Wächter hat dann
denselben Fehler wie vorher, nur eine Datei weiter. Siehe Befund `proof-addin.mjs:4845`.

**2. Die rohe Call-Nummer — trägt die gewählte Möglichkeit?** **Ja, und die Begründung ist
richtig.** `<Foreign className="mono" value={notice.callNumber} />` gibt der Nummer die mit
`.badge--call` verlorene Monoschrift zurück, kostet nichts, und `'notice.callNumber'` steht
in `FREMDE_WERTE`, so daß die Zeile den Baustein von selbst verlangt. Der Zusatz `'item.title'`
war nicht verlangt und ist der wichtigere von beiden: Der Titel eines fremden Todos ist der
Wert, der wirklich beliebige Zeichen tragen kann — die Call-Nummer hält `ALLOWED_SHAPE` eng.
Die Kopplung an eine Konstante eines fremden Pakets ist damit gelöst, ohne daß irgendwo eine
Ausnahmeliste entstanden ist.

**3. `duplicate/notice.ts` — saubere Trennung oder Abstraktion für den Nachweis?**
**Saubere Trennung.** Drei Gründe, und sie sind nachprüfbar: (a) Sie hat einen echten
Verbraucher im Erzeugnis — `DuplicateOffer.tsx` ruft sie und rechnet nichts daneben; (b) sie
trägt Wissen, das die Anzeige nicht haben kann — die Unterscheidung „gesucht und nichts
gefunden" gegen „gar nicht gesucht" ist der Befund Y-04 selbst und keine Prüfbequemlichkeit,
und sie ist der Grund, warum `checkedCallNumber` überhaupt hereingereicht wird; (c) sie kennt
den Nachweis nicht — kein Prüfhaken, kein Ausgang, den nur der Lauf benutzt.
Der Gegenbeweis liegt im selben Verzeichnis: `duplicate/reopen.ts` **ist** die Abstraktion,
die nur dem Nachweis dient — sechs Ausfuhren, null Aufrufer im Erzeugnis, und das seit PR #15.
Wer wissen will, wie der Unterschied aussieht, kann die beiden Dateien nebeneinanderlegen.

**4. Abschnitt 5b und das umgebaute 18f.** 18f ist der schärfste Wächter in diesem Bestand.
Er spannt jetzt an der **Anforderung** (`SELECT COUNT(*) FROM todo_attachment` nach jeder
Route) statt am **Namen**, führt die Fläche als ausgeschriebene Menge der vier statt als
Muster, und hat **zwei** Gegenproben, die sich unterscheiden: `…/links` mit Anhangswirkung
wird an der Wirkung rot **und nennt den Pfad**, `…/pings` ohne Wirkung wird an der Menge rot.
Daß die beiden Meldungen unterscheidbar sein müssen, ist ausdrücklich geprüft — das ist die
Sorte Sorgfalt, die sonst niemand aufschreibt. 5b ist gleichwertig gebaut: `duplicateNotice`
läuft wirklich, die Anordnung wird gelesen, und beide gelesenen Zusagen haben eine eingesetzte
Verletzung daneben. **Ein Loch ist trotzdem drin, und es ist heute schon offen** — siehe den
ersten Befund.

## Befunde Runde 2

```
apps/outlook-addin/scripts/proof-addin.mjs:5928  mittel  PROBE_RUMPF schickt startedAt/endedAt als 2026-09-30T08:00:00.000Z; das Add-in-Buchungsschema verlangt /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/ — **ohne** Bruchteile. Selbst am zusammengesetzten Dienst nachgemessen: GET context 200, GET todo-matches 200, POST todos 201, POST todos/:id/time-entries **422 (invalid_format auf beiden Feldern)**. Die Rundfahrt in routenMitAnhangswirkung (Zeile 5947) erreicht den Rumpf der einzigen Schreibroute neben dem Anlegen also nie; sie mißt dort die Eingabeprüfung und nicht den Schreibpfad. Die Zusage darüber lautet „nach dem Ansprechen **jeder** erreichbaren Add-in-Route", und die Untergrenze >= 4 zählt nur die angefahrenen Pfade, nicht die angenommenen Anfragen — die Zeile bleibt grün, ohne es zu sagen. Genau die Fehlerklasse, gegen die 18f gebaut wurde, eine Ebene tiefer. Mit …T08:00:00Z antwortet dieselbe Route **201** (nachgemessen). Fix: die vier Zeichen .000 in PROBE_RUMPF streichen und die Antwortcodes der Rundfahrt sammeln, mit einer Zeile daneben: keine Antwort im Bereich 400–499, sonst mißt die Rundfahrt an dieser Route nichts. Nebenbefund zur Auflage: A-A-71 (docs/bedrohungsmodell.md:9725) schreibt „unabhängig davon, ob die Route 201, 422 oder 404 antwortet" — für die **Behauptung** richtig (die Zahl muß immer null bleiben), deckt aber die **leere Messung** mit ab und gehört im selben Auftrag um einen Halbsatz ergänzt. Hoheit integration-dev; die Auflage security-checker.
apps/outlook-addin/scripts/proof-addin.mjs:4845  mittel  anzeigende.length >= 4 gegen paneDateien mit heute genau vier Einträgen (Zeile 4733). Die Untergrenze heißt damit „alle vier", ist aber als Zahl von Hand geschrieben und nirgends an die Liste gebunden. Eine fünfte Pane-Datei ohne fremden Wert — eine reine Einstellungs- oder Hilfefläche ist der naheliegende Fall — hält die Zahl grün, während eine der vier still herausfällt. Der Kommentar darüber begründet die Vier ausführlich und sagt nirgends, daß sie die Länge der Liste ist. Fix: statt der Zahl die Gegenmenge namentlich leeren — assert.deepEqual(paneDateien.filter((d) => !zeigtFremdes(d)).map(({ name }) => name), [], …). Heute zeichengleich dieselbe Aussage, wächst mit der Liste mit und nennt bei jedem Fehlschlag die Datei statt einer Zahl.
apps/outlook-addin/src/duplicate/rule.ts:91      mittel  **Unverändert offen und nach dieser Runde schärfer als in Runde 1.** summary, openSeconds, exportedSeconds, poolMovement und formatDuration (Zeile 94) haben weiterhin null Leser im Erzeugnis — bestätigt: describeOffers liefert sie, notice.ts nimmt genau todoId, title, isDone. Neu ist, daß ihre **Begründungen** jetzt selbst der Befund sind, gegen den dieser Auftrag angetreten ist: Zeile 91 sagt „ein Satz, der in S-12 unmittelbar über den **Schaltflächen** stehen kann" — die Schaltflächen sind mit E-100 gefallen; Zeile 71–75 begründet poolMovement mit „der Benutzer soll **vor der Entscheidung** wissen, wo es danach steht" — die Entscheidung gibt es nicht mehr; Zeile 102 begründet describeOffer mit „die Angaben, die **vor dem Buchen** zu sehen sein müssen". In Runde 1 habe ich geschrieben, innerhalb der Hoheit von integration-dev sei kein Satz übrig, der die gefallene Fläche behauptet. Das war zu großzügig gemessen — ich hatte auf die Kommentare **über** dem Rückbau gesehen, nicht auf die in der Datei, die den Rückbau überlebt hat. Erschwerend: proof:addin 5b baut in trefferBauen (Zeile 1173) ein summary mit auf und hält daneben in „Y-03: die Angabe bleibt eine Angabe" fest, daß ein Treffer **genau** todoId/title/isDone tragen darf. Der Lauf verbietet den vier Feldern also die Oberfläche und füttert sie zugleich. Fix (eigener Auftrag, nicht diese Welle): OfferDescription auf todoId/title/callNumber/isDone zurückbauen, formatDuration und den summary-Aufbau mit fallen lassen, Abschnitt 5 im selben Auftrag nachziehen — oder, wenn die Felder für eine geplante Fläche stehenbleiben, an Ort und Stelle vermerken, **wofür**, plus Boardeintrag. Schweigen ist nach zwei Runden die eine Option, die nicht mehr offen ist.
apps/local-api/scripts/proof-addin-wiring.mjs:147 mittel  A-A-72 (docs/bedrohungsmodell.md:9726) verlangt zwei Dinge: die Umlenkung **und** „eine Zeile im Lauf selbst, die prüft, daß die Datenbank tatsächlich im Wegwerfordner entstanden ist, und die rot wird, wenn sie woanders liegt". Das erste ist in allen sechs Läufen gebaut. Das zweite trägt assertIsolatedAppData **nicht**: Es prüft **vorher**, wohin geschrieben **würde**, nicht **nachher**, wohin geschrieben **wurde**. Nachgesehen: proof-access.mjs:1000 und proof-db-permissions.mjs fassen tatsächlich in den Wegwerfordner (proof-access hat die Zeile seit dieser Welle ausdrücklich); proof-addin-wiring.mjs:147, proof-conflicts.mjs:670, proof-export-api.mjs:179 und proof-tags.mjs:474 sehen nach dem Lauf nie nach. Der Fall, der dann durchgeht, ist derselbe wie der behobene, nur eine Umgebungsvariable weiter: Liest access/paths.ts eines Tages eine dritte Regel, setzt isolatedAppDataEnv weiterhin brav zwei Variablen, der Riegel prüft ein Ziel, das gar nicht mehr das Ziel ist, und vier Läufe schreiben wieder in den echten Bestand. Fix: in den vier Läufen nach dem Start eine Zeile stat(join(appDataDirIn(dataDir), 'takt.db')) mit check(...); vier Zeilen insgesamt. Hoheit domain-dev.
apps/outlook-addin/manifest.xml:130              mittel  Der Rippenknopf heißt weiterhin „Todo anlegen", der Hauptknopf im Aufgabenbereich seit dieser Welle „Neue Aufgabe anlegen" (TaskPane.tsx:384), und create-gate.ts:2 sowie duedate/entry.ts:12 sind auf den neuen Namen nachgezogen. Zwei Wörter für dieselbe Handlung in **einem** Ablauf, und die Datei mit dem alten Wort ist in derselben Welle angefaßt worden (Zeile 45, Beschreibungstext). Der Glossar führt „Todo" als Oberflächenwort und hält unter „Geklärte Doppelbenennungen" ausdrücklich fest, daß zwei Namen für dieselbe Sache Kosten haben. Das verschärft meinen Runde-1-Befund TaskPane.tsx:371: Die Umbenennung ist nicht bloß ungedeckt, sie ist auch **unvollständig**. Fix: spec-ux-reviewer entscheidet einen Namen, beide Stellen fallen in **einem** Auftrag — zusammen mit docs/design/textbestand-aufgabenbereich.md:278/352, die „Todo anlegen" heute als tragend führen.
apps/outlook-addin/src/ui/Primitives.tsx:199     niedrig role?: 'alert' | 'status' | 'none', wobei 'none' „**keine** Rolle setzen" bedeutet. role="none" ist aber ein echter ARIA-Wert mit anderer Bedeutung (synonym zu presentation: nimmt dem Element seine Semantik). Der Aufrufer schreibt <Callout role="none">, und wer die Zeile liest, ohne Primitives.tsx daneben zu haben, liest das Gegenteil dessen, was geschieht. Heute gehalten von 5b, das die Implementierung zeichengleich mißt (gewaehlt === 'none' ? {} : { role: gewaehlt }) — der Wächter trägt, der Name nicht. Fix: den Sonderwert 'inherit' oder null nennen, dann sagt die Aufrufstelle, was sie tut. Hoheit integration-dev.
apps/local-api/scripts/proof-access.mjs:1030     niedrig Die Messung von 0700/0600 fällt unter Windows weg und wird durch einen `--`-Hinweis ersetzt. Die Begründung trägt (POSIX-Modus ist dort ohne Aussage, proof:db-permissions überspringt aus demselben Grund seinen ganzen Lauf, die neue Ortsprüfung läuft überall), und der Lauf sagt es sichtbar statt still. Bleibt: Die Schlußzeile heißt auf beiden Plattformen „109 bestanden, 0 fehlgeschlagen" — dieselbe Zahl bei ungleicher Abdeckung. Wer den Lauf nur an der Zahl liest, sieht den Unterschied nicht. Fix: die übersprungenen Prüfungen mitzählen und die Schlußzeile um „, N nicht gemessen" ergänzen. Gilt genauso für proof-taskpane.mjs.
tests/e2e/support/app-data-isolation.ts:26       niedrig Die Plattformregel für den Ablageort steht jetzt an **vier** Stellen (access/paths.ts, proof-appdata.mjs, verify-sidecar.mjs, diese Datei). Die Datei sagt das selbst und nennt es „ein bekanntes, aufgeschriebenes Risiko, kein Versehen" — das ist die richtige Form und deutlich besser als eine stille vierte Kopie; die Hoheitsgrenze zwischen tests/e2e/** und apps/local-api/** trägt die Entscheidung gegen den Import. Der Befund ist, daß der aufgeschriebene Satz nirgends **einen Leser** hat: kein Boardeintrag, kein Risiko, kein Wächter, der die vier Fassungen gegeneinanderhält. Fix: entweder ein billiger Vergleich (jede der vier Dateien trägt LOCALAPPDATA/Takt und XDG_DATA_HOME/takt zeichengleich — eine Textprüfung genügt, es sind zwei Paare) oder ein Eintrag in risks.md. Der Satz allein ist eine Zusage ohne Wächter, und dieser Auftrag handelt von nichts anderem.
```

### Unverändert offen aus Runde 1 (nachgemessen, keine ist gefallen)

```
apps/local-api/scripts/proof-callers.mjs:1093    mittel  „jede Operation unter /addin hat einen Aufrufer im Aufgabenbereich" liest weiterhin nur api/client.ts. ApiClient.book (client.ts:211) hat weiterhin **null** Aufrufer in apps/outlook-addin/src — nachgemessen, kein .book( außerhalb der Schnittstelle und der Umsetzung. NOT_CALLED_BY_UI ist von fünf auf vier Einträge gezogen und sauber begründet, die Lücke darunter ist dieselbe geblieben. Ausgerechnet POST /addin/todos/{todoId}/time-entries ist die Gegenprobe von 18f — und die einzige Schreibtür, die das dauerhafte Token noch offenhält, ohne eine Fläche zu bedienen. Fix: den Leser über die Oberflächendateien laufen lassen statt über den Zugang, oder book und die Route in einer Entscheidung klären.
apps/outlook-addin/src/duplicate/reopen.ts:110   mittel  Weiterhin null Aufrufer im Erzeugnis (poolMovementSentence wird nur innerhalb der Datei benutzt, die Ausfuhren nirgends). Das ist die Antwort auf die dritte Frage dieses Auftrags in ihrer klarsten Form: **so** sieht eine Abstraktion aus, die nur ihren Prüflauf bedient. Gehört in denselben Auftrag wie rule.ts:91.
apps/outlook-addin/src/config.ts:53              niedrig DURATION_PRESETS_MINUTES und MAX_DURATION_MINUTES (Zeile 56) weiterhin ohne Leser, Kommentar nennt weiterhin „auf vorhandenes Todo buchen (A-10.9)" als Zweck — eine Handlung, die E-100 ausschließt. Mit book in einem Auftrag streichen.
apps/outlook-addin/src/styles/addin.css:894      niedrig .effects und .effects > li treffen weiterhin kein Element. Der T-092-Präzedenzfall steht dreizehn Zeilen tiefer und begründet dort den Wegfall einer anderen Regel. .offer ist dagegen erledigt — auf display/gap reduziert, der doppelte Rahmen ist weg, und die neuen .offer__*-Regeln haben jede ein Element.
apps/outlook-addin/src/ui/TaskPane.tsx:391       niedrig FIELD_LABEL kennt dueDate weiterhin nicht; ein 422 mit details[].field = "dueDate" erscheint in der deutschen Oberfläche als „dueDate: …". Fix: dueDate: 'Frist' (A-19.2 nennt genau dieses Wort).
docs/design/textbestand-aufgabenbereich.md:3     mittel  Nachtrag „PR #15" behauptet weiterhin die gefallene Fläche (Zeile 6, 8, 14, 15, 21–22, 25, 26) und führt „Todo anlegen" (278, 352) als tragend. Fremde Hoheit, eigener Auftrag.
docs/glossar.md:193                              mittel  „…ein Todo anlegt **oder auf ein vorhandenes bucht**" und Zeile 185 unverändert falsch seit E-100. Hoheit documenter.
docs/testplan.md:1396                            niedrig „Anbieten ‚auf vorhandenes Todo buchen' bestätigen" und Zeile 1538 unverändert. Hoheit e2e-tester.
tests/e2e/attachment-export-and-addin-exclusion.spec.ts:154 niedrig TP-ANH-13 mißt weiterhin nur die Anlegetür; die Gegenprobe aus 18f steht bisher nur dort. Hoheit e2e-tester.
```

`apps/desktop/src-tauri/Cargo.toml` aus Runde 1 ist gefallen — die inhaltsleere Änderung steht
nicht mehr in `git status`.

## Dateihoheit

Kein Verstoß. Nachgehalten über die Artefaktlisten der fünf Berichte gegen `git diff --numstat`:
domain-dev in `apps/local-api/scripts/**` und `apps/local-api/openapi/**` (einschließlich des
neuen `proof-appdata.mjs`), integration-dev in `apps/outlook-addin/**` und
`apps/local-api/src/routes/addin/**` (einschließlich `manifest.xml`), frontend-dev **nur** in
`apps/web/scripts/proof-foreign.mjs`, unit-tester **nur** in
`packages/storage/test/not-billed-audit.test.ts`, e2e-tester in `tests/e2e/**`,
security-checker in `docs/bedrohungsmodell.md`, der Orchestrator in `app.ts`, `docs/spec.md`,
`CLAUDE.md` und den drei Steuerdateien. Die bewußte Kopie in
`tests/e2e/support/app-data-isolation.ts` ist die richtige Antwort auf die Hoheitsgrenze und
ist als Kopie benannt — der Befund dort betrifft den fehlenden Wächter, nicht die Entscheidung.

Die Änderung an den gesperrten Sätzen SP-A-27/SP-A-28 ist nach E-078 Punkt 3 gedeckt: Die
Zustimmung des spec-ux-reviewers steht in `proof-addin.mjs` Abschnitt 20 an Ort und Stelle,
der alte Wortlaut ist als Verbot mitgeführt („die alte Fassung von SP-A-27 steht noch da —
dann sagt die Fläche beides"), und beide Sätze werden nur an **einer** Stelle im Lauf
geschrieben und von der zweiten gelesen.

## Urteil

**Freigegeben.**

Die drei blockierenden Befunde aus Runde 1 sind **alle drei erledigt** und von mir am Baum
nachgemessen, nicht am Bericht gelesen: Der Kommentar in `app.ts` sagt jetzt das Gegenteil
seiner alten Fassung und nennt den Wegfall beim Namen; die OpenAPI-Beschreibung führt beide
Antworten mit ihrer Schicht und bindet die Zusage an den Wächter, der sie mißt; und
`proof:addin-wiring` steht bei 32/0, ohne den Bestand des Benutzers anzufassen, mit einem
Riegel, den ich in beiden Richtungen ausgelöst habe.

Kein Befund dieser Runde blockiert. Der schwerste — `PROBE_RUMPF` mit Bruchteilsekunden — ist
ein Loch in der Schärfe des neuen Wächters und **nicht** in der Aussage: Daß über das
Add-in-Token kein Anhang entsteht, tragen daneben die ausgeschriebene Menge der vier
(`addinFlaeche`, mit Gegenprobe), die Zahl in `proof:route-policy`, `tsc` gegen `AddinUnit`
ohne `AttachmentPort` und die erste Prüfung von 18f, in der die Buchungsroute mit einem
eigenen Rumpf angefahren wird. Die Aussage steht also auf vier Beinen, von denen eines
schmaler ist, als es aussieht. Das ist ein Befund und keine Sperre — und es ist derselbe
Grund, aus dem ich in Runde 1 den Wächter als echt bezeichnet habe: Er wird an der Anforderung
aufgespannt, nicht am Namen, und diese Bauart ist es, die den Fehler findbar gemacht hat.

Vor dem Abschluß von T-247 einzuplanen, in dieser Reihenfolge:

1. `proof-addin.mjs:5928` und `:4845` — zusammen, integration-dev, beides ein Einzeiler.
2. `proof-addin-wiring/conflicts/export-api/tags` — die vier Zeilen für die zweite Hälfte von
   A-A-72, domain-dev.
3. Der Name des Knopfes (`manifest.xml:130` gegen `TaskPane.tsx:384`) — Entscheidung
   spec-ux-reviewer, Umsetzung in **einem** Auftrag mit dem Textbestand.
4. `rule.ts:91`, `reopen.ts:110`, `client.ts:211`/`book`, `config.ts:53`, `addin.css:894` —
   der tote Anteil aus PR #15 und aus dem Rückbau, in **einem** Auftrag mit Abschnitt 5.
5. Textbestand, Glossar, Testplan — fremde Hoheit, eigener Auftrag.

Zusammenfassung: Die Nacharbeit hat mehr getan als verlangt. Zweimal ist statt der von mir
vorgeschlagenen Stelle die **Klasse** behoben worden — ein gemeinsames Modul für sechs Läufe
mit Fail-closed-Riegel statt zweier Umgebungsvariablen, und ein Foreign-Wächter, der die
Pflicht rechnet statt sie aufzuzählen. Der Windows-Pfadfehler in `proof:foreign` ist dabei
nebenbei gefallen und war der schwerste der ganzen Welle: Der Lauf urteilte über null statt
129 Quelldateien und meldete „kein fremder Wert steht roh in der Anzeige", ohne eine Anzeige
gelesen zu haben. Was übrigbleibt, ist zweierlei: eine Rundfahrt, die eine ihrer vier Routen
an der Eingabeprüfung verliert, und der tote Anteil aus PR #15, der nach zwei Runden immer
noch keine Entscheidung hat.

Annahmen: Die drei Fragen des Auftrags habe ich technisch beantwortet und die
Produktentscheidung zum Knopfnamen ausdrücklich beim spec-ux-reviewer gelassen.

Risiken: Die Fläche des dauerhaften Tokens ist echt geschrumpft und jetzt an der Anforderung
gemessen statt am Namen. Offen bleibt die Schreibtür ohne Fläche
(`POST /addin/todos/{todoId}/time-entries`, `proof-callers.mjs:1093`) und die vierfache Kopie
der Plattformregel für den Ablageort ohne Wächter.

Offene Fragen: In welchem Auftrag fällt die Entscheidung über `describeOffers`, `reopen.ts`,
`book` und `DURATION_PRESETS_MINUTES`? Sie steht seit Runde 1 unbeantwortet und ist der
einzige Punkt dieser Prüfung, der sich durch Warten vergrößert.

Nächster Schritt: T-247 schließen, die fünf Punkte oben als eigene Aufgaben ins Board, und
Punkt 1 und 2 in der nächsten Welle mitlaufen lassen — sie kosten zusammen unter zwanzig
Zeilen und sind beide von mir gemessen, nicht vermutet.
