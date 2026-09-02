Aufgabe: T-019 — Das Outlook-Add-in bauen

Status: fertig

---

Artefakte:

Neu unter `apps/outlook-addin/`:

```
package.json                     react, react-dom, @takt/ui-tokens; keine Office-Typen
tsconfig.json                    erbt tsconfig.base.json, dazu DOM und WebWorker
vite.config.ts                   base './', Modul-Worker, Loopback, Port 17844
index.html                       CSP, office.js, Wurzelknoten
manifest.xml                     MailApp, ReadItem, enge AppDomains, SupportsPinning
README.md                        Aufbau, Befehle, was zum Betrieb noch fehlt
src/config.ts                    Add-in-Herkunft, Dauervorgaben
src/office/office-js.d.ts        die benutzte Office-Fläche, handgeschrieben
src/office/host.ts               die einzige Datei, die `Office.*` anfasst
src/office/mail.ts               MailFacts, Titelvorschlag, Textübernahme (B-12.3)
src/callnumber/pattern.ts        Musterprüfung + Begründung der Erkennungsstrategie
src/callnumber/protocol.ts       Nachrichten über die Worker-Grenze
src/callnumber/run.ts            die einzige Stelle, an der ein Benutzerausdruck läuft
src/callnumber/worker.ts         der Web Worker
src/callnumber/browser-channel.ts  `new Worker(...)`, sonst nichts
src/callnumber/evaluate.ts       harte Zeitgrenze und terminate() — transportfrei
src/callnumber/detect.ts         Muster → Betreff → Text → Plausibilisierung
src/callnumber/plausibility.ts   B-4.3 Punkt 3 (Zweitschrift, siehe Annahme 3)
src/callnumber/catalog.ts        fünf erprobte Muster, Beispiele erfunden
src/duplicate/rule.ts            A-10.9 und R-15
src/settings/store.ts            Token und Muster im localStorage (E-019)
src/api/client.ts                X-Takt-Token, Fehlerabbildung, fetch als Port
src/api/types.ts                 eigene DTOs, kein Import aus @takt/domain
src/tags/tree.ts                 Baum abflachen und durchsuchen, vier Ebenen und mehr
src/ui/Primitives.tsx            Knopf, Feld, Hinweisfläche, Chip, Platzhalter
src/ui/TagPicker.tsx             Tagauswahl mit Suche über den Pfad
src/ui/DuplicateOffer.tsx        das Duplikatangebot (A-10.9)
src/ui/TaskPane.tsx              S-12
src/ui/SettingsView.tsx          S-13
src/ui/App.tsx                   Zusammenbau an genau einer Stelle
src/main.tsx                     Einstiegspunkt, Token aus @takt/ui-tokens
src/styles/addin.css             kein einziger roher Farbwert
scripts/proof-addin.mjs          der ausführbare Nachweis, 73 Prüfungen
scripts/fixtures.mjs             Attrappen und erfundene Prüfdaten
scripts/regex-worker.mjs         Node-Gegenstück zum Web Worker
scripts/register-ts-resolve.mjs  Anmeldung des Auflösungshakens
scripts/ts-extension-resolve.mjs `./x.js` → `./x.ts` für den Nachweispfad
```

Neu unter `apps/local-api/src/routes/addin/`:

```
call-number.ts   Plausibilisierung, Dienstseite — die Vertrauensgrenze aus R-15
ports.ts         AddinUnit / AddinDeps als Pick<> auf den echten Ports
service.ts       die vier Anwendungsfälle, rein, ohne HTTP
schema.ts        Eingabeprüfung mit zod, Grenzen wie in der OpenAPI-Beschreibung
index.ts         der Hono-Router und `mountAddinRoutes`
```

Rund 3400 Zeilen, davon etwa 40 Prozent Kommentar.

Geändert: nichts außerhalb meiner Hoheit. `pnpm-lock.yaml` ist unverändert —
alle Abhängigkeiten des Add-ins lagen bereits durch `apps/web` im Arbeitsbereich.

Nicht angefasst: `packages/domain/**`, `packages/storage/**`, `packages/*/test/**`,
`apps/web/**`, `apps/desktop/**`, `apps/local-api/**` außer `src/routes/addin/`,
`docs/**`, die Wurzeldateien. Kein `git commit`. `packages/export/src/**` liegt
zwar in meiner Hoheit, ist in dieser Aufgabe aber **nicht** verändert worden
(letzte Änderung 04:00:27, vor Beginn dieser Aufgabe) — siehe Risiko 5.

---

Zusammenfassung:

Das Add-in steht: Aufgabenbereich (S-12) und Einstellungen (S-13) in React über
den Design-Token aus `packages/ui-tokens`, Office-Manifest mit `ReadItem`, und
darunter fünf Module, die ohne Outlook prüfbar sind. Die Call-Nummer wird über
den in den Einstellungen hinterlegten Ausdruck erkannt — in einem Web Worker
mit harter Zeitgrenze von 100 Millisekunden, weil ein laufender regulärer
Ausdruck in JavaScript nicht unterbrechbar ist. Das Duplikatangebot aus A-10.9
ist an eine Plausibilisierung gekettet, die an **zwei** Stellen wirkt: im
Add-in als Bedienung und im Dienst als Vertrauensgrenze; eine leere oder
unplausible Nummer führt nie zu einer Abfrage, und vor dem Buchen stehen Titel,
Call-Nummer und die Aufteilung offen/exportiert des gefundenen Todos auf dem
Bildschirm. Das Token liegt im `localStorage` der Add-in-Herkunft; in diesem
Paket gibt es keinen einzigen Aufruf von `roamingSettings`, und der Nachweis
prüft das über den ganzen Quelltext.

Nachgewiesen wird das nicht behauptet, sondern ausgeführt:
`pnpm --filter @takt/outlook-addin proof:addin` — **73 Prüfungen, 0
fehlgeschlagen**, Laufzeit rund 1,6 Sekunden, zehnmal hintereinander gleich. Was ohne Outlook nicht prüfbar ist,
steht unten unter „Was ungeprüft bleibt" — vollständig und ohne Beschönigung.

---

Die Erkennungsstrategie, begründet (`ecc:regex-vs-llm-structured-text`)

Die Fertigkeit gibt einen Entscheidungsbaum vor: wiederholt sich das Format zu
über 90 Prozent, beginnt man mit einem Ausdruck; die Restfälle bekommen eine
zweite, teurere Instanz. Angewandt auf die Call-Nummer:

1. **Das Format wiederholt sich.** Eine Call-Nummer ist eine Kennung aus einem
   Ticketsystem — `TCK-000042`, `C123456`, `2026/0815`. Fester Aufbau,
   wiederkehrend, ohne Bedeutungsspielraum. Nach dem Entscheidungsbaum ist die
   Sache damit entschieden: Regex.

2. **Die zweite Instanz ist hier der Mensch, kein Modell.** Der Rahmen sieht für
   Treffer mit niedriger Vertrauensbewertung eine Nachprüfung vor. In Takt ist
   die Vertrauensbewertung `plausibility.ts` — sie entscheidet, ob ein Treffer
   überhaupt als Treffer gilt —, und die Nachprüfung ist die Anzeige in S-12,
   die der Benutzer ändern kann, bevor irgendetwas entsteht. Das ist genau die
   Architektur des Rahmens, nur mit einem Menschen an der Stelle des Modells.

3. **Ein Sprachmodell ist ausgeschlossen, nicht bloß unnötig.** E-001 verbietet
   jede Cloudanbindung; ein Modell im Add-in hieße, den Text fremder E-Mails an
   einen Dienst zu schicken. Das wäre nicht eine teurere Lösung desselben
   Problems, sondern ein anderes Produkt. Ein lokales Modell wäre ein Vielfaches
   der ganzen Anwendung, um eine Zeichenkette mit fester Gestalt zu finden.

4. **Nichtbestimmtheit ist hier ein Schaden.** Der Rahmen warnt vor Regex bei
   frei geformtem Text; umgekehrt gilt: Bei einem Wert, der in eine Rechnung
   geht, ist ein Verfahren, das bei gleicher Eingabe zweimal Verschiedenes
   liefern kann, nicht prüfbar. Die Fälletabelle im Nachweispfad ist der Beleg,
   dass es hier bestimmt zugeht.

Der Preis des Ausdrucks steht in B-4.1 bis B-4.4, und er ist bezahlt:

| Bedrohung | Gegenmittel im Quelltext | Prüfung im Nachweis |
|---|---|---|
| B-4.1 katastrophales Backtracking | Auswertung nur im Worker, 100 ms, dann `terminate()`; Eingabe auf 20 000 Zeichen; statische Heuristik auf verschachtelte Quantoren und Alternativen mit gleichem Präfix; angebotener Vorrat vor dem Freitextfeld | Abschnitt 1 und 4, darunter ein echter Abbruch von `(a+)+$` |
| B-4.2 ungültiger Ausdruck | Prüfung beim Speichern **und** bei jeder Verwendung; der zuletzt gültige Ausdruck bleibt in Kraft; das Feld bleibt von Hand füllbar | TP-ADDIN-03 mit allen fünf Eingaben |
| B-4.3 zu weiter Ausdruck | Erfassungsgruppe erzwungen, Gruppe 1 statt Gesamttreffer; Muster, die auf `""` passen, abgelehnt; Plausibilisierung 3–64 Zeichen und `[A-Za-z0-9._/-]`; leere Nummer nie ein Übereinstimmungskriterium; Anzeige vor der Entscheidung | Abschnitte 1, 2, 3, 5 und 9 |
| B-4.4 Zustand am Ausdruck | kein `g`, je Aufruf neu übersetzt; Formelzeichen am Anfang abgewiesen | zehn Läufe mit gleichem Ergebnis, Fälletabelle |

---

Der Nachweis, im Einzelnen

`pnpm --filter @takt/outlook-addin proof:addin` — **73 bestanden, 0
fehlgeschlagen**, Exitcode 0.

| Abschnitt | Was belegt wird | Bezug |
|---|---|---|
| 0 | Kein Zugriff auf `roamingSettings`; kein `innerHTML`/`eval`/`new Function`; `run.ts` nur aus dem Worker importiert; kein `console.*`; kein roher Farbwert in `addin.css`; alle Prüfdaten erfunden, alle Adressen unter `example.*` | B-2.8, B-12.1, B-4.1, B-2.4, E-024, B-11.1 |
| 1 | Fünf ungültige Ausdrücke abgelehnt; ohne Erfassungsgruppe abgelehnt; `(.*)`, `(\s*)`, `(a?)`, `(^)` abgelehnt; vier verschachtelte Quantoren abgelehnt; Rückverweis und Rückschau abgelehnt; Vorausschau zugelassen; alle fünf Vorratsmuster bestehen | A-10.8, B-4.1, B-4.2, B-4.3 |
| 2 | 22 Grenzfälle; **dieselbe Tabelle** gegen die Dienstfassung; zusätzlich 5000 erzeugte Werte, bei denen beide Fassungen zeichengleich urteilen müssen | B-4.3, B-4.4 |
| 3 | TP-ADDIN-01; Treffer nur im Text mit Herkunftsangabe; keine Nummer → kein Fehler; TP-ADDIN-10 (`.*` erzeugt nie einen Treffer); `(.+)` scheitert an der Plausibilisierung; ungültiges Muster bei der Verwendung abgefangen; zehn Läufe gleich | TP-ADDIN-01, -10, B-4.2, B-4.4 |
| 4 | `(a+)+$` auf 40 `a` und `!` wird **tatsächlich abgebrochen** und kehrt zurück; ein gutartiges Muster über 20 000 Zeichen läuft nie in die Grenze; der Auswerter kürzt nachweislich auf 20 000; die Zeitgrenze beginnt erst bei der Bereitschaft des Workers; Gruppe 1 statt Gesamttreffer, und der Vorrat klammert die vollständige Kennung | B-4.1, B-4.3 |
| 5 | TP-ADDIN-11 (leere Nummer nie ein Kriterium); unplausible Nummer nie ein Kriterium; das Angebot trägt Titel, Nummer, offene **und** exportierte Zeit; ein Treffer ohne Nummer wird gar nicht angeboten; erledigtes Todo wird ausgewiesen | A-10.9, R-15, B-4.3 |
| 6 | Token nur im `localStorage`, in genau einem Schlüssel; `read()` enthält den Klartext nicht; `describeToken` zeigt vier Zeichen; leeres Token wird entfernt; fremde Grundadresse wird verworfen; Muster steht in der Einstellung | E-009, E-019, R-09, R-12, B-2.3, A-10.8 |
| 7 | TP-ADDIN-05: vierstufiger Baum in einem Aufruf, Pfad vollständig; Standard-Tags gekennzeichnet; Suche trifft über den Pfad und über Groß-/Kleinschreibung hinweg; kein Tag doppelt | A-4.3, A-4.4, A-10.4, A-9.5 |
| 8 | Token in `X-Takt-Token`, nie in der Adresse; ohne Token wird gar nicht angefragt; TP-ADDIN-06 (401 einheitlich, ohne den Wert); 403 als Herkunftsproblem benannt; Netzfehler → „nicht erreichbar" statt Absturz | E-009, B-2.4, B-1.4 |
| 9 | TP-ADDIN-02 und -04 gegen den **echten Router**; leere und unplausible Nummer dienstseitig nicht gesucht (200, nicht 4xx); A-9.5 im Dienst ergänzt; E-Mail-Text landet im Vermerk und in keiner Buchungsnotiz; kein Duplikat nach dem Buchen; A-2.5 nur auf ausdrücklichen Wunsch; 404 und 422 sauber | A-9.5, A-10.9, A-2.5, B-12.3, R-15 |
| 10 | Base64 hin und zurück mit `äöüÄÖÜß`, `€`, `✅`, `➜` und über 14 000 Zeichen; Standardvorlage erzeugt `Call`/`Zeit`/`Notiz`(base64)/`WindowsUser` mit 16 min → 0,50; abweichende Vorlage mit vier anderen Feldern in anderer Reihenfolge; Vermerk als Quelle abgewiesen; tolerante Schreibweise abgewiesen | A-8.2 bis A-8.5, A-8.7, E-017, R-06 |

`pnpm typecheck` — Exitcode 0 über alle acht Pakete.
`pnpm boundaries` — Exitcode 0, Notiz-Trennung unverletzt, 133 Dateien geprüft.
`pnpm build` — Exitcode 0. Das Add-in-Bündel: 230 kB Javascript (73 kB gepackt),
23 kB CSS, der Worker als eigenes Stück von 0,36 kB.

`pnpm test` — unverändert gegenüber dem Zustand vor dieser Aufgabe: 186
bestanden, 10 fehlgeschlagen in vier Dateien, alle in `packages/*/test/**`.
Siehe Risiko 5; keiner davon stammt aus T-019.

---

Was ungeprüft bleibt, und auf welchem Rechner es zu prüfen ist

Nichts davon lässt sich hier ausführen. Alles davon gehört auf einen
Windows-Rechner mit Outlook (Desktop, WebView2) und laufender Takt-Hülle.

1. **Dass Outlook das Manifest annimmt.** `manifest.xml` ist wohlgeformt (mit
   `xml.dom.minidom` geprüft) und folgt der Elementreihenfolge aus der
   Microsoft-Dokumentation. Ob der Validierer von Outlook es annimmt, ob die
   Schaltfläche erscheint und ob `SupportsPinning` greift, ist ungeprüft.
   **Prüfschritt:** Seitenladen über `Get-Add-in` beziehungsweise einen
   Netzwerkfreigabe-Katalog, dann eine gelesene Nachricht öffnen.
2. **Dass `Office.onReady` auslöst und `item.body.getAsync` Text liefert.**
   `src/office/host.ts` ist gegen die Dokumentation geschrieben, nicht gegen
   eine laufende Umgebung. Der Fall „Office antwortet nicht" ist mit einer
   Zeitgrenze von 5 Sekunden abgefangen; ob die Zeitgrenze je greift, ist offen.
3. **Dass WebView2 einen Modul-Worker startet und `terminate()` ihn beendet.**
   Der Abbruchmechanismus ist ausgeführt und bewiesen — aber gegen einen
   `node:worker_threads`-Worker, nicht gegen einen Browser-`Worker`. Beide
   benutzen denselben `createTimedEvaluator`, dieselbe `runPattern` und dieselbe
   Bereitschaftsmeldung; was fehlt, ist die Zusage der Laufzeitumgebung. **Prüfschritt:** Muster
   `((a+)+)$` von Hand in die Einstellung schreiben (der Wächter lehnt es beim
   Speichern ab — also über die Entwicklerkonsole in den `localStorage`), dann
   eine E-Mail mit 40 `a` öffnen. Erwartet: Hinweis „Erkennung abgebrochen",
   Aufgabenbereich weiter bedienbar.
4. **Dass der Aufgabenbereich in 320 Pixeln Breite gut aussieht.** Die
   Gestaltung ist aus dem Designsystem entwickelt und in keinem Browser
   angesehen worden; es gibt keine Bildschirmabnahme. **Prüfschritt:**
   `pnpm --filter @takt/outlook-addin dev`, Fenster auf 320, 350 und 450 Pixel.
5. **Dass gemischte Inhalte nicht blockiert werden.** Die Seite ist `https`,
   der Dienst `http://127.0.0.1:17843`. Chromium behandelt `127.0.0.1` als
   grundsätzlich vertrauenswürdig, blockiert also nicht — das ist Lehrbuchwissen
   und keine Messung. Dazu kommt „Private Network Access": Eine Anfrage von
   einer lokalen Herkunft an eine lokale Adresse ist davon nicht betroffen, aber
   auch das ist ungemessen. **Prüfschritt:** Aufgabenbereich öffnen, Netzwerkbild
   in den Entwicklerwerkzeugen von WebView2 ansehen. Schlägt es fehl, ist das
   Gegenmittel eine TLS-Endstelle des Dienstes, kein Umbau des Add-ins.
6. **Der End-zu-End-Weg über den echten Dienst.** Der Nachweis fährt den echten
   Router, aber gegen eine Attrappe der Speicherung und **ohne** die Prüfschicht
   aus `http/guards.ts` — es gibt keinen SQLite-Adapter (T-009 hat ihn nicht
   geliefert) und die Routen sind nicht eingehängt. Herkunftsprüfung,
   Vorabanfrage und der echte Tokenvergleich sind damit im Zusammenspiel mit dem
   Add-in ungeprüft. **Prüfschritt:** nach Umsetzung der beiden offenen Fragen 1
   und 2 der Ablauf TP-ADDIN-08.

---

Annahmen:

1. **Die Herkunft des Add-ins ist `https://localhost:17844`.** Das ist die
   Antwort auf offene Frage 3 aus T-011, und sie war meine. Begründung: Office
   verlangt HTTPS; Takt liefert lokal aus (E-001); die Portnummer liegt
   unmittelbar neben dem Dienst (17843), damit beide als Paar erkennbar sind und
   nicht mit einem üblichen Entwicklungsport kollidieren. Der Wert steht an
   genau zwei Stellen: `src/config.ts` und `manifest.xml`.

2. **Das Add-in bekommt eine eigene, schmale Fläche statt der 57 Operationen.**
   Vier Routen unter `/api/v1/addin`: Baum und Vorbelegungen lesen, nach einer
   Call-Nummer suchen, ein Todo anlegen, eine Zeit buchen. Kein Löschen, kein
   Export, kein Zugriff auf den Vermerk eines fremden Todos, keine
   Einstellungen. Der Grund ist nicht Sparsamkeit: Das Add-in weist sich mit dem
   **dauerhaften** Token aus, die Oberfläche mit dem Sitzungsgeheimnis
   (B-2.9 Punkt 3). Ein entwendetes Add-in-Token kommt genau so weit, wie diese
   Fläche reicht. Die Ports sind als `Pick<>` auf die echten Ports aus
   `packages/storage` geschrieben; ein echter `UnitOfWork` erfüllt sie
   strukturell, es gibt also keinen Übersetzungsadapter, der etwas verlieren
   könnte.

3. **Die Plausibilisierung existiert zweimal, mit einem Wächter dagegen.**
   Im Add-in ist sie Bedienung, im Dienst Vertrauensgrenze — der Dienst darf
   sich nicht darauf verlassen, dass der Aufrufer das Add-in ist. Ein
   gemeinsames Modul gäbe es nur in `packages/domain`, und das ist nicht meine
   Hoheit; ein Import des Dienstes in das Browserbündel oder umgekehrt wäre
   schlimmer als die Verdopplung. Gegen das Auseinanderlaufen prüft der
   Nachweispfad beide Fassungen gegen dieselbe Tabelle **und** über 5000
   erzeugte Werte. Siehe offene Frage 3.

4. **Kein `roamingSettings`, auch nicht für Nicht-Geheimnisse.** B-2.8 Punkt 2
   erlaubte, den regulären Ausdruck dort abzulegen. Ich habe darauf verzichtet:
   Sobald irgendein Wert über `roamingSettings` läuft, steht der Aufruf im
   Quelltext, und der nächste Wert, der „auch nur eine Einstellung" ist, findet
   den Weg von selbst. Der Preis ist, dass auch das Muster je Rechner
   eingetragen wird. Beim Token ist das ohnehin unvermeidlich.

5. **Keine `@types/office-js`, sondern eine handgeschriebene Deklaration.**
   Sechs Namen werden gebraucht; das Paket beschreibt die gesamte Office-Fläche.
   `src/office/office-js.d.ts` ist zugleich die vollständige Antwort auf „was
   fasst das Add-in in Outlook an?" — was dort nicht steht, kann der Quelltext
   nicht aufrufen, ohne dass `tsc` es meldet. Die Gestalten sind über Context7
   aus der Microsoft-Dokumentation belegt; die Seiten stehen im Kopf der Datei.
   `roamingSettings` ist dort bewusst nicht deklariert: Ein Typ, den es nicht
   gibt, lässt sich nicht versehentlich benutzen.

6. **React statt reinem DOM.** CLAUDE.md nennt für das Add-in „Office.js +
   TypeScript" und lässt die Oberflächenschicht offen. Der Aufgabenbereich ist
   für seine Größe erstaunlich zustandsbehaftet — Baumsuche über vier Ebenen,
   Chips, Duplikatangebot, Buchungsformular, Einstellungen mit Testbereich —,
   und React 19 liegt durch `apps/web` ohnehin im Arbeitsbereich. Keine neue
   Abhängigkeit, dieselbe Hausstrecke. Das Bündel bleibt bei 73 kB gepackt und
   wird von der Platte geladen.

7. **Buchen aus dem Add-in hebt „Erledigt" nicht von selbst auf.** A-2.5 knüpft
   die automatische Aufhebung an den **Timerstart**; eine von Hand nachgetragene
   Buchung ist etwas anderes. Der Aufgabenbereich zeigt „Dieses Todo ist als
   erledigt gekennzeichnet" und bietet ein ausdrückliches Kästchen an
   (`reopenIfDone`). Beides — Buchung und Aufhebung — liegt in derselben
   Transaktion, sonst gäbe es einen Zustand mit gebuchter Zeit auf einem Todo,
   das in seiner Pool-Ansicht nicht auftaucht (E-039). Falls der Orchestrator
   A-2.5 auch auf manuelle Buchungen ausdehnen will, ist das eine Zeile in
   `service.ts` — es ist aber eine Entscheidung und keine Auslegung.

8. **`TodoPort.create` bekommt die ergänzte Tagliste an beiden Stellen.** Der
   Vertrag führt `tagIds` zweimal — im Eingabewert und als zweites Argument —
   und legt nicht fest, welche der beiden der Adapter liest. Solange der Adapter
   aus T-009 fehlt, beantworte ich das durch Gleichheit: Beide tragen die
   Liste **mit** den Standard-Tags. Ein Unterschied zwischen beiden wäre die Art
   Annahme, die man erst in einer Abrechnung bemerkt. Siehe offene Frage 4.

9. **Ein Auflösungshaken für den Nachweispfad.** `packages/domain` und
   `packages/export` schreiben ihre Importe mit `.js`-Endung; Node löst das
   wörtlich auf und findet nichts. `scripts/ts-extension-resolve.mjs` bildet
   `./x.js` auf `./x.ts` ab, nachdem die gewöhnliche Auflösung fehlgeschlagen
   ist, und nur für relative Angaben. Er gehört zum Nachweis, nicht zum
   Erzeugnis: Im Betrieb lösen Vite und esbuild die Endung von sich aus auf.

11. **Die Zeitgrenze aus B-4.1 misst die Auswertung, nicht den Start des
    Workers.** Der Worker meldet sich mit `{ kind: 'ready' }`; erst danach
    beginnen die 100 Millisekunden. Davor läuft eine getrennte, großzügige
    Frist von 5 Sekunden, die **kein** Gegenmittel ist — ein Worker, der nie
    bereit wird, rechnet auch nichts. Ohne die Trennung liefe die Frist über
    das Laden eines Moduls, und ein ausgelasteter Rechner meldete „Erkennung
    abgebrochen" für ein einwandfreies Muster. Das ist kein theoretischer
    Einwand: Genau dieser Fehlschlag ist im Nachweispfad einmal aufgetreten,
    als vier Prüfketten und ein zweiter Agent gleichzeitig liefen. Die
    Reihenfolge der beiden Fristen ist als eigene Prüfung festgehalten.

10. **Der Vorrat klammert die vollständige Kennung, nicht die Ziffern.**
    `TCK-(\d{6})` lag nahe und wäre falsch gewesen: Es liefert `000042`, und in
    der Rechnung stünde eine Nummer ohne ihr Kürzel. Der Nachweispfad hat genau
    diesen Fehler in meiner ersten Fassung gefunden; die Muster heißen jetzt
    `\b(TCK-\d{6})\b`. Der Fall ist als eigene Prüfung festgehalten.

---

Risiken:

1. **Das Add-in ist bis zu zwei Handgriffen in fremden Dateien nicht
   lauffähig.** `ALLOWED_ORIGINS` in `apps/local-api/src/config.ts` und das
   Einhängen des Routers in `apps/local-api/src/app.ts` gehören domain-dev.
   Beides ist je eine Zeile. Bis dahin antwortet der Dienst auf Add-in-Anfragen
   mit 403 beziehungsweise 404 — fehlschlagen ohne Eintrag ist richtig, aber es
   heißt, dass niemand das Add-in im Zusammenspiel prüfen kann.

2. **Die Heuristik gegen Backtracking ist eine Heuristik.** Sie erkennt
   verschachtelte Quantoren und Alternativen mit gemeinsamem Präfix — die beiden
   Bauformen, die in der Praxis fast alle Fälle ausmachen. Sie ist kein Beweis,
   und B-4.1 Punkt 3 verlangt auch keinen. Was sie durchlässt, fängt die harte
   Zeitgrenze; was sie fälschlich ablehnt, kostet eine Umformulierung. Diese
   Verteilung ist gewollt: Ein eingefrorener Aufgabenbereich wiegt schwerer als
   eine abgelehnte Schreibweise. Wer sie schärfen will, nimmt `recheck` — das
   wäre eine neue Abhängigkeit im Pfad, der fremden Text verarbeitet, und die
   Entscheidung gehört zum Orchestrator.

3. **Ohne Worker gibt es keine Erkennung — mit Absicht.** Steht `Worker` nicht
   zur Verfügung, wird **nicht** ersatzweise im Hauptfaden gerechnet. Der
   Benutzer sieht „Automatische Erkennung steht hier nicht zur Verfügung" und
   trägt die Nummer von Hand ein. Das ist die richtige Wahl (B-4.1), aber es ist
   ein Funktionsverlust, den jemand in Outlook bemerken könnte, falls WebView2
   Modul-Worker unter einer Unternehmensrichtlinie sperrt.

4. **Die Herkunftsprüfung des Dienstes wirkt gegen eine fremde Webseite, nicht
   gegen einen lokalen Prozess.** Das ist RR-1 und war schon vor dieser Aufgabe
   wahr. Neu ist: Was ein entwendetes Add-in-Token anrichten kann, ist jetzt auf
   die vier Routen aus Annahme 2 begrenzt — Lesen des Tag-Baums, Suche nach
   einer Call-Nummer, Anlegen eines Todos, Buchen einer Zeit. Kein Löschen, kein
   Export, kein Vermerk. Das verhindert nichts, aber es begrenzt.

5. **In `packages/export/test/**` stehen zehn rote Prüfungen, und drei
   Ursachen sind Namensstreit zwischen T-007 und T-010.** Nicht von mir
   verursacht, nicht in meiner Hoheit (`packages/*/test/**` gehört unit-tester),
   und für T-019 ohne Wirkung — mein Nachweispfad fährt dieselben Funktionen
   grün. Der Befund gehört trotzdem berichtet, weil er das Exportfeld `Call`
   betrifft:

   * `packages/export/test/templates.test.ts` schreibt die Transformationen
     deutsch (`'roh'`), `packages/export/src/model.ts` englisch (`'raw'`).
     CLAUDE.md und E-015 sagen: technische Schlüssel englisch. **Die Umsetzung
     hat recht, der Test ist umzustellen** — vier Vorkommen.
   * `packages/storage/test/builtin-template-migration.test.ts` nennt das Feld
     `transform`, die Umsetzung und Abschnitt 8 der Spezifikation nennen es
     `transformation`. **Auch hier hat die Umsetzung recht** — drei Vorkommen.
   * `packages/export/test/base64.test.ts` behauptet über seinen eigenen
     Prüftext `expect(longText.length).toBeGreaterThan(10_000)`, erzeugt aber
     9440 Zeichen. Ein Fehler im Prüfling der Prüfung. Mein Nachweis deckt
     denselben Fall mit 14 400 Zeichen ab und ist grün.

   Zusammen sind das acht der zehn roten Prüfungen. Die beiden übrigen liegen in
   `note-boundary-property.test.ts` und haben dieselbe Wurzel (`'roh'`).

6. **Symbole fehlen.** `manifest.xml` verweist auf `assets/takt-16.png` und drei
   weitere Größen, die es nicht gibt. Outlook zeigt dann ein Ersatzsymbol; das
   Add-in funktioniert. Vier PNG-Dateien, gehört zur Gestaltung.

7. **Es gibt keine Auslieferung über HTTPS.** `vite.config.ts` liefert über HTTP
   auf 127.0.0.1:17844 aus. Für Outlook braucht es ein Zertifikat für
   `localhost` — üblicherweise `office-addin-dev-certs`, was eine weitere
   Abhängigkeit wäre, oder ein selbst erzeugtes Zertifikat aus der Hülle. Ich
   habe keines davon eingerichtet, weil die Entscheidung, wer die Dateien im
   Betrieb ausliefert (Hülle oder ein eigener kleiner Dienst), nicht getroffen
   ist. Siehe offene Frage 5.

---

Offene Fragen:

1. **An domain-dev, über den Orchestrator: `ALLOWED_ORIGINS` ergänzen.** In
   `apps/local-api/src/config.ts` fehlt `'https://localhost:17844'`. Das ist die
   Antwort auf offene Frage 3 aus T-011. Ohne den Eintrag antwortet der Dienst
   auf jede Add-in-Anfrage mit 403. Eine Zeile, in einer Datei, die mir nicht
   gehört.

2. **An domain-dev, über den Orchestrator: den Router einhängen.** In
   `apps/local-api/src/app.ts`, **hinter** `app.use(...)`:

   ```ts
   import { createAddinRoutes } from './routes/addin/index.ts';
   // …
   api.route('/addin', createAddinRoutes(addinDeps));
   ```

   `addinDeps` ist `{ inTransaction, now }`; ein vorhandener `UnitOfWork`
   erfüllt `AddinUnit` strukturell, es ist kein Adapter zu schreiben. Solange
   T-009 keinen Speicheradapter geliefert hat, gibt es nichts zu übergeben —
   dann bleibt die Route besser aus als halb.

3. **An den Orchestrator, entscheidungsbedürftig: Wohin gehört die
   Plausibilisierung der Call-Nummer?** Sie steht heute zweimal (Annahme 3), mit
   einem Wächter dagegen. Sie ist eine Fachregel und gehört nach
   `packages/domain` — B-4.3 weist die Duplikatabfrage domain-dev ohnehin zu.
   Verschiebt jemand sie dorthin, entfallen beide Fassungen und der Wächter;
   der Aufwand ist eine Datei und zwei Importe. Ich habe es nicht getan, weil
   `packages/domain` nicht meine Hoheit ist.

4. **An domain-dev: Welche der beiden `tagIds` liest `TodoPort.create`?** Der
   Vertrag führt sie zweimal (Annahme 8). Ich übergebe beidemal dieselbe,
   bereits ergänzte Liste, damit A-9.5 unabhängig von der Antwort hält. Die
   Frage gehört trotzdem beantwortet, bevor der Adapter entsteht — sonst ist der
   zweite Parameter tote Fläche oder eine Falle.

5. **An den Orchestrator: Wer liefert den Aufgabenbereich über HTTPS aus?** Zwei
   Wege: die Tauri-Hülle bringt einen kleinen statischen Dienst mit Zertifikat
   für `localhost` mit (näher an E-001, mehr Arbeit in T-008b), oder die
   Entwicklung benutzt `office-addin-dev-certs` und der Betrieb einen
   IIS-/Nginx-Eintrag beim Kunden (weniger Arbeit, mehr Fremdteile). Die
   Entscheidung betrifft den Zuschnitt der Hülle und nicht das Add-in.

6. **An den unit-tester, über den Orchestrator: `roh` gegen `raw`, `transform`
   gegen `transformation`.** Siehe Risiko 5. Meine Empfehlung steht dort; die
   Umsetzung folgt E-015 und Abschnitt 8 der Spezifikation, die Tests weichen in
   zwei verschiedene Richtungen davon ab. Acht der zehn roten Prüfungen fallen
   mit dieser einen Entscheidung.

---

Nächster Schritt:

1. **Zwei Zeilen in `apps/local-api`** (offene Fragen 1 und 2). Danach lässt
   sich das Add-in erstmals gegen den echten Dienst mit echter Prüfschicht
   fahren — und TP-ADDIN-08 wird ausführbar.
2. **Der security-checker kann prüfen.** Der Nachweispfad ist startbar und
   deckt B-2.8, B-4.1 bis B-4.4 und B-12.1 mit ausführbaren Zusicherungen ab.
   Offen für ihn: die CSP in `index.html` (frame-ancestors der drei
   Outlook-Herkünfte — habe ich gesetzt, aber nicht gegen eine echte Einbettung
   geprüft) und die Frage, ob `ReadItem` für A-10.5 wirklich genügt.
3. **Der e2e-tester** kann TP-ADDIN-01 bis -11 gegen den Nachweispfad abgleichen;
   acht davon sind dort bereits eins zu eins enthalten. Was Playwright dazu
   beitragen kann, ist die Prüfung 23 aus Abschnitt 7 des Bedrohungsmodells —
   dass der Token-Klartext vor der ausdrücklichen Handlung nicht im DOM steht.
   Die Vorbedingung dafür ist ein laufender Aufgabenbereich, also offene Frage 5.
4. **Der unit-tester** zieht die drei Namensbefunde aus Risiko 5 nach, sobald
   der Orchestrator entschieden hat.
5. **Vier PNG-Symbole** für `manifest.xml`.
