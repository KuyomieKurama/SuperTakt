Aufgabe: T-247-1 — Rückbau der Anhäng-Fläche im Outlook-Add-in (Entscheidung zu F-21)
Status: fertig

Artefakte:
- `apps/outlook-addin/src/ui/DuplicateOffer.tsx` — auf die Warnung zusammengeschnitten
- `apps/outlook-addin/src/ui/TaskPane.tsx` — `submitAttachment`, `busyTodoId`, `mailLink`,
  der V-08-Satz und der `attached`-Zweig von `DoneView` gefallen; Hauptknopf heißt
  „Neue Aufgabe anlegen"
- `apps/outlook-addin/src/ui/App.tsx` — `mailLink={host.webLink}` gefallen
- `apps/outlook-addin/src/office/host.ts` — `outlookWebLink` und `HostState.webLink` gefallen
- `apps/outlook-addin/src/api/client.ts` — `addLinkAttachment` samt Anfrage-/Antworttyp gefallen
- `apps/outlook-addin/src/styles/addin.css` — `.offer__list/__item/__head/__title/__meta`,
  `.offer__confirm`, `.offer__warn`, `.badge`, `.badge--call` gefallen (kein Element mehr)
- `apps/outlook-addin/src/ui/create-gate.ts`, `apps/outlook-addin/src/duedate/entry.ts` —
  nennen den Knopf beim neuen Namen
- `apps/local-api/src/routes/addin/attachments.ts` — **gelöscht**
- `apps/local-api/src/routes/addin/schema.ts` — `addLinkAttachmentSchema`,
  `AddLinkAttachmentBody`, `REQUEST_SCHEMAS.addAddinTodoAttachment` und die beiden
  Einzelimporte gefallen; der Absatz zu A-19.19 geschärft
- `apps/local-api/src/routes/addin/ports.ts` — `AddinUnit.attachments` und der
  `AttachmentPort`-Import gefallen
- `apps/local-api/src/routes/addin/index.ts` — die Zusage zu A-19.19 geschärft
- `apps/outlook-addin/scripts/proof-followup.mjs` — **gelöscht**
- `apps/outlook-addin/scripts/proof-addin.mjs` — Abschnitt 21 und die drei V-08-Prüfungen
  gefallen, **Abschnitt 18f neu**, die OpenAPI-Prüfung und die Foreign-Prüfung umgestellt

Zusammenfassung:
Die zweite Tür ist zu: `POST /api/v1/addin/todos/{todoId}/attachments` gibt es nicht mehr —
weder als Route, noch als Schema, noch als Fähigkeit des Add-in-Ports (`AddinUnit` führt
keinen `AttachmentPort` mehr), noch als Methode im Zugang des Aufgabenbereichs. Der
Duplikatfall zeigt nur noch die Warnung; darunter steht unverändert der Abschnitt „Neues
Todo", dessen Hauptknopf jetzt „Neue Aufgabe anlegen" heißt. Der wichtigere Teil ist der
Ausgleich: Abschnitt 18 des Nachweislaufs maß bisher die **Anlegetür** (null Zeilen in
`todo_attachment`) und blieb damit grün, während nebenan ein Anhang entstand. Der neue
Abschnitt 18f mißt am **zusammengesetzten** Dienst, dass es die andere Tür nicht mehr gibt:
404 mit gültigem Add-in-Token, mit der Nachbarroute `…/time-entries` als Gegenprobe im
selben Lauf (sie antwortet 422, also nicht 404 und nicht 401), und kein Pfad unter `/addin`
mit `attachment` im Namen. Beide Sätze im Quelltext, die die Abwesenheit von Anhängen
behaupteten, stehen weiter da — jetzt gedeckt, und mit dem benannten Grund, dass sie
zwischenzeitlich nur die Tür beschrieben, an der sie standen.

Annahmen:
1. **Die Angebotsliste fällt mit den Knöpfen.** Ohne Handlung bleibt nur die Meldung; die
   Aufzählung von Titel, Call-Abzeichen und Zusammenfassung wäre eine Liste, auf der man
   nichts tun kann. Das entspricht dem Auftrag („nur die Meldung").
2. **Der V-08-Satz fällt mit seinem Anlass, nicht nur mit seiner Fläche.** V-08 (T-154) hing
   daran, dass eine eingetragene Frist beim Wechsel auf das Anhängen stillschweigend verfiel.
   Seit F-21 gibt es keinen Wechsel mehr — der Aufgabenbereich handelt am gefundenen Todo
   nicht. Ein Satz über einen Übergang, den es nicht gibt, wäre die nächste ungedeckte
   Zusage. Die Begründung steht als Kommentar an der Stelle, an der 19e stand, damit sie der
   spec-ux-reviewer nach E-078 Punkt 3 nachlesen kann.
3. **Toter Stil fällt mit.** `.offer__*` und `.badge*` trafen nach dem Rückbau kein Element
   mehr; die Datei enthält für genau diesen Fall den Präzedenzfall aus T-092
   („eine Klasse ohne Element ist die Einladung, den Satz wieder darunterzuschreiben").
4. **SP-A-27 und SP-A-28 bleiben zeichengleich stehen.** Ihre beiden Sätze („Dabei wird auf
   dem vorhandenen Todo keine Zeit erfasst.", „Ein erledigtes Todo bleibt erledigt.") tragen
   jetzt mehr als vorher: Sie sind die einzige Stelle, an der der Aufgabenbereich ausspricht,
   was bei einem Treffer **nicht** geschieht. Nur die Begründungen in der Sperrliste sind
   nachgeführt.
5. **`mailLink` hatte nach dem Rückbau keinen Leser mehr**, deshalb ist er samt Herkunft
   (`office/host.ts#outlookWebLink`, `HostState.webLink`) gefallen — geprüft über den ganzen
   Arbeitsbaum, nicht nur über `git grep`.
6. Der erste Satz des Callout-Rumpfs steht im Wortlaut aus dem Nachtrag des Orchestrators
   („Bearbeiten Sie das vorhandene Todo in SuperTakt oder legen Sie darunter bewusst ein
   neues an."). Die Überschrift ist unverändert.

Läufe (Windows 11, Node 22.23.2, pnpm benutzerlokal):
- `pnpm --filter @takt/outlook-addin typecheck` — **grün**
- `pnpm --filter @takt/local-api typecheck` — **grün**
- `pnpm typecheck` (Wurzel, alle acht Projekte plus `typecheck:test` und `typecheck:e2e`) —
  **grün**
- `pnpm --filter @takt/outlook-addin proof:addin` — **228 bestanden, 0 fehlgeschlagen**
  (es fallen die 3 V-08-Prüfungen und die 8 Prüfungen aus `proof-followup.mjs` weg, es
  kommen die 2 Prüfungen aus 18f dazu; der Stand vor dem Rückbau ist nicht gemessen)
- `pnpm --filter @takt/local-api proof:addin-wiring` — **32 bestanden, 0 fehlgeschlagen**
- `pnpm --filter @takt/local-api proof:callers` — **56 bestanden, 0 fehlgeschlagen**
- `pnpm --filter @takt/local-api proof:route-policy` — **43 bestanden, 1 fehlgeschlagen**:
  `die Add-in-Fläche sind genau fünf Routen (4)`. Das ist der **richtige** rote Lauf: Es sind
  jetzt vier. Die Zeile steht in `apps/local-api/scripts/proof-route-policy.mjs:644`
  (dazu der Abschnittstitel Zeile 535 und die Erläuterungen Zeile 249 und 367) und gehört
  domain-dev — ich habe sie nicht angefasst.
- `pnpm --filter @takt/local-api proof:openapi` — **110 bestanden, 4 fehlgeschlagen**, alle
  vier außerhalb meiner Hoheit: dreimal `addAddinTodoAttachment` aus
  `apps/local-api/scripts/service-scenario.mjs:905/914` (der Durchlauf zeichnet eine
  Operation auf, die die Beschreibung nicht mehr führt), einmal
  `so viele benannte Bauteile gelesen wie in der Datei stehen` — laut Bericht von domain-dev
  ein CRLF-Artefakt des Lesers, das schon vor dieser Welle rot war.

Risiken:
- **Sicherheit: die Fläche des Add-in-Tokens ist geschrumpft, nicht nur verriegelt.** Das
  Token kann auf keinem Weg mehr einen Anhang anlegen; die Fähigkeit ist aus dem Port
  entfernt, nicht abgewiesen. R-21 verliert damit den Zweig „Deep-Link aus Outlook"; die
  beiden anderen (Fremdimport, Wurzelspeicher) bleiben unberührt.
- **Zwei rote Läufe bis domain-dev nachzieht** (siehe oben). Beide messen richtig; sie zählen
  nur noch die alte Zahl. Bis dahin ist `pnpm check` rot.
- **Nicht gemessen:** dass Outlook den Aufgabenbereich weiterhin lädt. Der Rückbau berührt
  `office/host.ts`, also die einzige Datei mit `Office.*`. `convertToRestId` und
  `userProfile.accountType` werden nicht mehr gerufen — das kann nichts brechen, ist aber
  auf diesem Rechner nicht in Outlook nachgefahren worden.
- `OfferDescription.title` und `.summary` werden weiterhin berechnet (und in Abschnitt 5 des
  Nachweislaufs gemessen), aber nirgends mehr angezeigt. Kein Fehler, aber toter Text im
  Sinne von E-078.

Offene Fragen:
1. **An domain-dev / Orchestrator:** `proof-route-policy.mjs` muss von fünf auf vier
   Add-in-Routen. Ohne diese Änderung ist das Tor rot; mit ihr ist die Zahl wieder eine
   Messung statt einer Erinnerung.
2. **An domain-dev / Orchestrator:** `service-scenario.mjs` zeichnet `addAddinTodoAttachment`
   noch zweimal auf (Zeilen 905 und 914). Die Route antwortet jetzt 404, die Beschreibung
   kennt sie nicht mehr.
3. **An den Orchestrator:** `CLAUDE.md` nennt `proof:followup` unter „Befehle" als Lauf, den
   `proof:addin` aufruft. Die Datei ist weg; der Satz gehört mit.
4. **An den spec-ux-reviewer:** Soll `describeOffers` die nicht mehr angezeigte
   Zusammenfassung weiter erzeugen? Ich habe sie stehen lassen, weil Abschnitt 5 des
   Nachweislaufs sie ausführlich mißt und ihr Rückbau eine eigene Entscheidung ist.
5. **An den spec-ux-reviewer:** Die Überschrift der Warnung setzt die Call-Nummer weiterhin
   roh in eine Zeichenkette (`Zu Call ${first.callNumber} …`), nicht über `<Foreign>`. Das
   war schon vorher so und ist durch die Prüfung der Call-Nummer gedeckt; nach dem Rückbau
   ist es die **einzige** fremde Angabe in dieser Datei, deshalb hier benannt.

Nächster Schritt:
Die beiden Zahlen in `apps/local-api/scripts/` (Routenzahl, Szenarioaufzeichnung) in **einem**
Auftrag an domain-dev nachziehen und danach `pnpm check` als Ganzes fahren. Danach
Code-Reviewer und security-checker auf diese Fläche ansetzen — mit der ausdrücklichen Bitte,
**beides** zu prüfen: die Abwesenheit der Route und die Sätze, die sie behaupten.

---

# T-247-3 — Nacharbeit aus drei Prüfberichten an der Duplikatwarnung

*Abgelegt vom Orchestrator, nicht von integration-dev: Der Schreibzugriff des Subagenten auf
diese Datei wurde von der Umgebung blockiert. Wortlaut aus seiner Rückgabe, gekürzt auf die
Struktur aus CLAUDE.md.*

Status: braucht Review

**Artefakte:** `manifest.xml` (Y-01) · `src/duplicate/notice.ts` **neu** — die Fallunterscheidung
der Duplikatfläche als reine, ausführbare Funktion (`idle`/`none`/`found`) · `src/ui/DuplicateOffer.tsx`
· `src/ui/TaskPane.tsx` (neuer Zustand `checkedCallNumber`: die Nummer, mit der **tatsächlich**
gesucht wurde) · `src/ui/Primitives.tsx` (`Callout` nimmt `role="none"`) · `src/styles/addin.css`
· `scripts/proof-addin.mjs` (Abschnitt 5b neu, 18f umgebaut).

**Zusammenfassung:** Die Duplikatfläche sagt jetzt, was sie gefunden hat, und sie sagt es auch
dem, der nicht hinsieht. Meldungstext im Wortlaut des Auftraggebers; darunter die Treffer als
Aufzählung — Titel durch `<Foreign>`, bei erledigten Todos die Wortmarke „Erledigt", kein
einziges Bedienelement, damit „keine Handlung am gefundenen Todo" aus A-10.9 unangetastet
bleibt. Die `role="status"`-Region steht **immer** im Baum, auch leer; „geprüft, kein Treffer"
wird einmal bestätigt statt verschwiegen. 18f spannt nicht mehr am Namen `attachment`, sondern
an der Anforderung: die Fläche unter `/addin` gegen die ausgeschriebene Menge der vier, **jede**
gefundene Route mit gültigem Token angefahren, danach `todo_attachment` bei null — mit zwei
Gegenproben. Der Foreign-Wächter war an `DuplicateOffer.tsx` blind geworden und verlangt
Call-Nummer und Titel jetzt von selbst.

**Läufe:** `pnpm typecheck` (Wurzel, 8 Projekte + Test + E2E) grün · `proof:addin` **238/0**
(vorher 228/0: +7 aus 5b, +3 aus 18f) · `proof:callers` 56/0 · vitest 18/18.
Zwischendurch rot gewesen und behoben, beides gemessen: 226/2 (die Sperrliste fing SP-A-27 und
SP-A-28 — genau dafür ist sie da) und 237/1 (die eingehängte Gegenprobe antwortete 422 statt
201, weil der Zeitstempel Bruchteile trug — ein Fund an der Messung, und der Beleg, daß die
Gegenprobe wirklich schreibt). Nicht gefahren, wie angeordnet: `proof:addin-wiring` und die vier
Geschwister (A-A-72), `pnpm check`, `proof:route-policy`, `proof:openapi`, `test:e2e`, `cargo test`.

**Annahmen:** Die Fallunterscheidung wandert aus dem JSX in `duplicate/notice.ts`, weil JSX nicht
durch die Typentfernung von Node geht und eine Verzweigung im JSX niemand ausführt · `Callout`
bekommt `role="none"` als ausdrückliche Ausnahme, weil zwei geschachtelte Live-Regionen keine
doppelte Sicherheit sind · `.offer` verliert Rahmen und Polsterung, zwingend sobald die Fläche
leer dasteht (das Gestaltungsurteil gehört dem ui-designer) · `offer.title` bleibt in
`FREMDE_WERTE`, obwohl es den Namen nicht mehr gibt: Die Liste ist ein Verbot, und ein Name hält
die Stelle zu, an der er wiederkäme.

**Risiken:** Der Nachweis der dauerhaften Region ist **statisch, nicht gerendert** — schärfste in
Node mögliche Form, mit zwei Gegenproben, aber der Beweis am laufenden Aufgabenbereich gehört in
einen Playwright-Fall · Gegenprobe 1 hängt die Route zur Laufzeit an; gemessen ist, daß der
Wächter eine **so** eingehängte Route fängt · `docs/design/textbestand-aufgabenbereich.md` ist
jetzt an drei Stellen überholt (Zeilen 21-22 und 355-356), fremde Hoheit · unverändert offen aus
dem Code-Review: `rule.ts:91`, `duplicate/reopen.ts`, `ApiClient.book` ohne Aufrufer,
`DURATION_PRESETS_MINUTES`, `.effects`.

**Offene Fragen:** 1. ux-designer: `textbestand-aufgabenbereich.md` nachziehen, nicht den
Nachweis zurückdrehen. 2. spec-ux-reviewer: Y-10 ist jetzt entscheidbar — `duplicate/reopen.ts`
beschreibt die Wirkung einer Buchung, die es nicht gibt. 3. Orchestrator: Untergrenze des
Foreign-Wächters bei vier belassen? 4. e2e-tester: der Beweis der leeren Region im Browser
gehört in einen Playwright-Fall.

**Entscheidung des Orchestrators zu Frage 3:** Die Untergrenze bleibt bei vier. Ein Wächter, der
still von vier Flächen auf drei fällt, mißt weniger und sagt es nicht — das war der Befund, nicht
ein Nebeneffekt. Daß der nächste berechtigte Rückbau eine Zeile Begründung kostet, ist der Preis
und zugleich der Zweck.

**Nächster Schritt:** Wiedervorlage bei spec-ux-reviewer (Y-01 bis Y-04), code-reviewer
(Foreign-Wächter, Sperrliste) und security-checker (A-A-71 mit beiden Gegenproben), danach
`pnpm check` als Ganzes.

---

Aufgabe: T-247-9 — Der Security-Checker hat 18f zweimal ausgehebelt; beide Wege schließen
(A-A-73, A-A-74, dazu ein Befund des Code-Reviewers am Foreign-Wächter)
Status: fertig

Artefakte:
- `apps/outlook-addin/scripts/proof-addin.mjs` — einzige geänderte Datei
  - Abschnitt 18f, Kopfkommentar: die beiden neuen Wege benannt, Punkte 5 und 6 der Zusage
    ergänzt
  - `anfrage` in `withComposedService`: `origin` einstellbar (nur für die Gegenproben)
  - `addinFlaeche`: **Rohliste statt `Set`** (A-A-74 Punkt 2), neuer Helfer `doppelt`
  - `PROBE_RUMPF`: Zeitstempel **ohne Bruchteile** (A-A-73 Punkt 1)
  - `rundfahrt` ersetzt `routenMitAnhangswirkung`: gibt jede angefahrene Route **mit
    Statuscode** zurück; dazu `mitWirkung`, `ankunftsMaengel`, `fahrtprotokoll`
  - `durchgriffsPfade` und `durchgriff` — die Durchgriffsprobe (A-A-74 Punkt 1)
  - `kettengliedMitAnhangstuer` — die Verstümmelung aus Kapitel 34.2
  - sechs neue Prüfungen: A-A-73 Gegenproben 1–3, A-A-74 tragend, A-A-74 Gegenproben A und B
  - Foreign-Wächter: `anzeigende.length >= 4` durch die **namentlich geleerte Gegenmenge**
    ersetzt
  - `routenMitAnhangswirkung` gelöscht, nachdem alle Aufrufer auf `rundfahrt` umgestellt waren
    (kein toter Helfer)

Zusammenfassung:
Beide Auflagen sind gebaut, und beide sind in **beide** Richtungen gemessen. A-A-73: Der
Probenrumpf wird jetzt angenommen — `…/time-entries` antwortet 201 statt 422 —, jede Anfrage
der Rundfahrt hält ihren Statuscode fest, jede Antwort ab 400 ist ein Fehlschlag der Messung,
ein nicht ersetzter Platzhalter ebenso, und mindestens eine schreibende Route muß mit 2xx
geantwortet haben. A-A-74: Sechs erfundene Pfade unter `/addin` — die vier aus der Auflage, dazu
`…/mail` und ein je Lauf zufällig erzeugter — werden mit gültigem Add-in-Token angefahren und
müssen 404 antworten; die Fläche kommt aus der Rohliste, damit eine zweite Registrierung auf
demselben Pfad ein Befund ist statt einer Zeile weniger. Der Befund des Code-Reviewers ist wie
vorgeschlagen umgesetzt: Der Foreign-Wächter leert die Gegenmenge namentlich, statt eine Vier zu
zählen, die in Wahrheit „alle" hieß.

**Gemessen, an diesem Baum, heute:**

```
pnpm --filter @takt/outlook-addin proof:addin        244 bestanden, 0 fehlgeschlagen  (vorher 238)
pnpm --filter @takt/outlook-addin typecheck          fehlerfrei
pnpm --filter @takt/local-api proof:route-policy      44 bestanden, 0 fehlgeschlagen
```

Die Ausgangslage aus Kapitel 34 ist vor dem Umbau eigenständig nachgefahren und zeichengleich
bestätigt worden: `GET /addin/context` 200, `GET /addin/todo-matches` 200, `POST /addin/todos`
201, `POST /addin/todos/:id/time-entries` **422** mit `.000Z` und **201** ohne Bruchteile; mit
fremder Herkunft 4 × 403, ohne Token 4 × 401; die zehn `ALL`-Einträge stehen alle auf `/*`; die
Rohliste unter `/addin` hat heute genau vier Einträge und **keine Dopplung** — das Entfernen des
`Set` ändert am unveränderten Baum also keine Zahl.

**Die Gegenproben, jede einzeln gefahren** (Verstümmelung in eine Kopie der Datei, Baum
unverändert, Kopien danach gelöscht):

| Verstümmelung | Wächter | Ergebnis |
|---|---|---|
| Kettenglied auf `'*'`, das `POST /addin/todos/{id}/links` beantwortet und eine Zeile schreibt (Bauplan 34.2) | A-A-74 tragend | **rot**, nennt `POST /addin/todos/<uuid>/links -> 201` |
| `PROBE_RUMPF` zurück auf `.000Z` (Stand von gestern) | A-A-71 Rundfahrt | **rot**: „die Rundfahrt ist nicht angekommen — POST …/time-entries: 422 — die Prüfschicht hat den Probenrumpf abgewiesen", dazu alle vier Statuscodes |
| `rundfahrt` fährt mit `Origin: https://boese.example` | A-A-71 Rundfahrt | **rot**, nennt alle vier Routen mit 403 **und** „keine schreibende Route hat mit 2xx geantwortet" |
| `addinFlaeche` wieder über `Set` entdoppelt, bei zweiter Registrierung auf `…/time-entries` | A-A-74 Gegenprobe B | **rot**: „die zweite Registrierung steht nicht in der Rohliste — dann ist sie wieder entdoppelt" |
| fünfte Route `POST /addin/todos/:id/links` in `ADDIN_FLAECHE` eingetragen (T-247-14: der Platzhalter heißt anders) | A-A-71 Rundfahrt | **rot**: „Platzhalter nicht ersetzt (/addin/todos/:id/links) — als Literal angefahren" |

Die Verstümmelung mit `.000Z` macht nebenbei **vier** Prüfungen rot, nicht eine: auch die
Durchgriffsprobe (ihre Nachbarroute antwortet dann nicht mehr 2xx) und beide Gegenproben zu
A-A-71, die seit heute ebenfalls verlangen, angekommen zu sein. Eine Gegenprobe, die an der
Wächterkette hängenbleibt, meldet sonst ihren eigenen Aufbau statt der Verstümmelung.

Annahmen:
1. **„Angekommen" heißt: keine Antwort ab 400.** Die Auflage nennt 401, 403 und 404 wörtlich;
   die verlangte Gegenprobe „Bruchteile im Zeitstempel machen den Lauf rot" trägt aber nur,
   wenn auch 422 ein Fehlschlag ist — mit `.000Z` steht keine der drei genannten Zahlen da, und
   die Untergrenze „mindestens eine schreibende Route mit 2xx" wäre durch `POST /addin/todos`
   allein erfüllt. Die Meldung unterscheidet die beiden Fälle trotzdem im Wortlaut: „die
   Wächterkette hat abgewiesen, hier mißt der Aufbau" gegen „die Prüfschicht hat den
   Probenrumpf abgewiesen". Preis dieser Schärfe: Eine berechtigte fünfte Route, die
   `PROBE_RUMPF` zurückweist, macht 18f rot. Das ist gewollt — sie kostet dann eine Zeile im
   Probenrumpf und eine Entscheidung, kein stilles Weniger.
2. **Die Durchgriffsprobe fährt sechs Pfade**, nicht fünf: die vier aus der Auflage, dazu
   `…/todos/{id}/mail` (aus den neun Türen in 34.6) und den zufällig erzeugten. Der Zufallspfad
   wird bei **jedem** Aufruf neu erzeugt, damit kein Lauf einen Pfad mißt, den ein Vorlauf
   bekannt gemacht hat.
3. **Die Durchgriffsprobe hat ihren eigenen Ankunftsnachweis**: Vor den sechs Pfaden fährt sie
   die Nachbarroute `…/time-entries` und verlangt 2xx. Ohne ihn wäre ein Lauf, in dem alles 401
   antwortet, still grün — dieselbe Falle eine Ebene tiefer, und A-A-60 gilt auch für neue
   Wächter.
4. **`ADDIN_FLAECHE.length` statt der Zahl 4** in der Untergrenze der Rundfahrt — derselbe
   Grund wie beim Foreign-Wächter: Eine handgeschriebene Zahl, die zufällig die Länge einer
   Liste ist, sagt nicht, dass sie es ist.
5. **`origin` ist im Prüfling einstellbar geworden**, im Erzeugnis nicht. Die Kopfzeile wird
   ausschließlich in `withComposedService` gesetzt; einstellbar ist sie, weil sich sonst der
   Unterschied zwischen „angekommen" und „abgewiesen" nicht vorführen ließe.

Risiken:
- **Die Durchgriffsprobe ist eine Liste erfundener Pfade** und damit kein Vollständigkeitsbeweis.
  Sie fängt eine Tür, die einen dieser sechs Pfade beantwortet; ein Kettenglied, das
  `/addin/todos/{id}/xyzzy` beantwortet, fängt sie nicht. Der zufällige Pfad fängt nur eine Tür,
  die **jeden** unbekannten Pfad beantwortet. Das ist gesagt und nicht behauptet — die
  vollständige Antwort wäre, jede Antwort ungleich 404 auf **jedem** Pfad außerhalb der
  ausgeschriebenen Fläche zu verlangen, und dafür bräuchte es eine Aufzählung des Pfadraums.
- **Ein Kettenglied, das erst bei einem bestimmten Rumpf antwortet**, entkommt weiterhin: Die
  Durchgriffsprobe schickt `PROBE_RUMPF`. Eine Tür, die nur auf ein Feld anspringt, das dort
  nicht steht, bleibt unsichtbar. Der Probenrumpf trägt deshalb die Felder aller vier Routen
  **und** die einer Anhangstür.
- **`proof:route-policy` entdoppelt weiterhin über eine `Map`** (`proof-route-policy.mjs:392`,
  fremde Hoheit). Der Befund T-247-13 ist damit nur auf meiner Seite behoben; eine zweite
  Registrierung fällt heute in 18f auf und in `proof:route-policy` nicht.
- **Nichts in diesem Baum mißt weiterhin, was ein Kettenglied tut, wenn es antwortet, statt
  durchzureichen** — außer jetzt der Durchgriffsprobe, und die mißt sechs Pfade. Die
  strukturelle Antwort läge in `http/guards.ts` und `app.ts`, fremde Hoheit.
- Keine echte Call-Nummer, kein Kundenname, kein Zugangsdatum: `TCK-000042`, `example.org`,
  `boese.example`, `t.beispiel`. Das Token entsteht je Lauf aus `randomBytes`.

Offene Fragen:
1. **security-checker:** Trägt die Auslegung aus Annahme 1 — jede Antwort ab 400 gilt als
   Fehlschlag der Messung, nicht nur 401/403/404? Ohne sie wird die von A-A-73 verlangte dritte
   Gegenprobe (Bruchteile) nicht rot.
2. **domain-dev / Orchestrator:** `proof-route-policy.mjs:392` entdoppelt über eine `Map`.
   Soll die Rohliste auch dort gelten (T-247-13), oder bleibt der Befund allein in 18f behoben?
3. **Orchestrator:** Der Wortlaut von A-A-71 im Bedrohungsmodell („unabhängig davon, ob die
   Route 201, 422 oder 404 antwortet") deckt die leere Messung weiterhin mit ab. Der
   code-reviewer hat den Halbsatz zur Ergänzung vorgeschlagen; das Papier gehört dem
   security-checker.
4. **Orchestrator:** `pnpm check` als Ganzes ist von mir nicht gefahren (angekündigt). Gefahren
   sind `proof:addin`, `typecheck` des Add-ins und `proof:route-policy`.

Nächster Schritt: Wiedervorlage bei security-checker (A-A-73 und A-A-74 mit den fünf
Verstümmelungen oben) und code-reviewer (Foreign-Wächter, `rundfahrt`/`ankunftsMaengel`),
danach `pnpm check` als Ganzes durch den Orchestrator.

---

Aufgabe: T-247-10 — Drei kleine Auflagen aus der Abnahme des security-checkers

Status: fertig

Artefakte: `apps/outlook-addin/scripts/proof-addin.mjs` (Abschnitt 18f — nur Kommentare, die
Verfahrensschleife der Durchgriffsprobe und **eine** neue Gegenprobe).

Zusammenfassung: Alle drei Punkte sitzen in 18f, keine Nacharbeit an der Logik der Wächter.
(1) Die **Reichweite** steht jetzt im Kopf des Abschnitts, mit beiden Hälften: gefangen wird
Irrtum und Bequemlichkeit — die plausibel benannte Fläche (`attachments`, `links`, `files`,
`mail`) mit den Feldern einer Anhangstür, die meistens eine Route ist und schon der Rohliste
auffällt, dazu die beiden unbequemen Bauarten Kettenglied und Doppelregistrierung; **nicht**
gefangen wird Absicht mit Schreibrecht, also der Pfad, den niemand rät, das Verfahren, das
niemand fragt, der Rumpf, den nur der Erbauer kennt. `/addin/xyzzy` ist eine Hintertür, keine
Meßlücke, und dagegen trägt die Änderungsprüfung, nicht dieser Lauf. Begründet mit A-A-55: Ein
Lauf, der seine eigene Grenze verschweigt, ist die Bauart aus R-25.
(2) Die **beiden 404** sind an einer Stelle auseinandergehalten — in der Rundfahrt ein
Fehlschlag der Messung (Pfade, die es geben **muß**), in der Durchgriffsprobe das verlangte
Ergebnis (Pfade, die es **nicht** geben darf); an der Durchgriffsprobe steht ein Rückverweis
auf diesen Absatz.
(3) Die Durchgriffsprobe fährt jeden ihrer sechs erfundenen Pfade jetzt mit `POST`, `PUT` und
`PATCH`. Dazu die **Regel für später** im Kopf von `ADDIN_FLAECHE`, dort, wo sie der nächste
findet, der die Fläche erweitert: Weist eine berechtigte künftige Route den gemeinsamen
`PROBE_RUMPF` zurück, ist der Ausweg ein **eigener Rumpf für diese Route** — eine Zuordnung
Pfad → Rumpf, jeder mit den Feldern einer Anhangstür —, nicht eine Lockerung der Ankunftsregel
und nicht eine Ausnahmeliste von Statuscodes; der Satz des security-checkers steht wörtlich
daneben. Ein Kurzverweis darauf steht am `PROBE_RUMPF` selbst.

Läufe: `proof:addin` **245/0** (vorher 244/0, Code 0) · `pnpm typecheck` (Wurzel, 8 Projekte +
Test + E2E) Code 0. Die Zahl steigt um **eins**, und nur durch die neue Gegenprobe A2, nicht
durch Punkt 3: Die zusätzlichen `PUT`- und `PATCH`-Fahrten liegen innerhalb bestehender
Prüfungen. Gegenmessung zu Punkt 3 gefahren und zurückgenommen: mit
`DURCHGRIFF_VERFAHREN = ['POST']` wird A2 rot (244/1, „eine Tür auf PATCH bleibt unbemerkt: –").

Annahmen:
1. **Die Erweiterung um `PUT`/`PATCH` bekommt eine eigene Gegenprobe** (A-A-74, Gegenprobe A2),
   und deshalb steigt die Zahl auf 245. Ohne sie stünde in der Schleife eine Erweiterung, von
   der niemand weiß, ob sie beißt — genau die Sorte Zusicherung, gegen die A-A-55 und A-A-60
   geschrieben sind. Die Gegenprobe hängt dasselbe Kettenglied wie A ein, nur auf `PATCH`, und
   sie mißt in zwei Zügen: erst, daß dieselbe Tür auf `POST` mit **404** antwortet — die alte
   Fragerichtung fand sie also nicht —, dann, daß die Durchgriffsprobe rot wird und Verfahren
   **und** Pfad nennt.
2. `kettengliedMitAnhangstuer` heißt jetzt `kettengliedAufVerfahren(verfahren)`; Gegenprobe A
   ruft es mit `'POST'` und ist im Verhalten unverändert.
3. Die drei Verfahren stehen als `DURCHGRIFF_VERFAHREN` benannt beieinander, nicht inline —
   damit die Gegenprobe A2 auf dieselbe Stelle zeigt, an der man sie verkürzen würde.
4. Nur schreibende Verfahren. `DELETE` ist nicht dazugekommen: Eine Anhangs**tür** entsteht, sie
   löscht nicht, und der Rumpf paßte nicht dazu.

Risiken:
- Die Reichweitenerklärung ist ein **Satz, keine Messung**. Sie ist damit von derselben Sorte
  wie A-A-55 selbst und altert wie jeder Kommentar: Wer die Fläche später zusperrt, muß den
  Absatz mitziehen, sonst behauptet er zu wenig statt zu viel — die harmlosere Richtung, aber
  trotzdem eine Ungenauigkeit.
- Die Durchgriffsprobe bleibt eine **Liste** erfundener Pfade, jetzt mit drei Verfahren je Pfad:
  18 Anfragen statt 6. Das erweitert die Fläche, macht sie aber nicht vollständig; unverändert
  gilt, was im Bericht zu T-247-9 dazu steht.
- Keine echten Call-Nummern, Kundennamen oder Zugangsdaten: `TCK-000042`, `example.org`,
  `t.beispiel`, Token je Lauf aus `randomBytes`.

Offene Fragen:
1. **security-checker:** Trägt die Reichweitenerklärung in seinem Sinn — insbesondere der Satz,
   daß diese Prüfungen das Lesen einer Änderung nicht ersetzen, sondern nur verhindern, daß eine
   ungelesene Änderung still grün bleibt? Und ist ihm die Zahl **245** statt 244 recht, also die
   Gegenprobe A2 zu der von ihm empfohlenen Erweiterung?
2. **Orchestrator:** Die Regel „eigener Rumpf statt Ausnahme" steht heute nur im Quelltext, wie
   beauftragt. Gehört sie zusätzlich als Auflage ins Bedrohungsmodell (Kapitel 34) oder in die
   Entscheidungen? Das Papier gehört nicht mir.

Nächster Schritt: Abnahme der drei Punkte durch den security-checker, danach `pnpm check` als
Ganzes durch den Orchestrator.
