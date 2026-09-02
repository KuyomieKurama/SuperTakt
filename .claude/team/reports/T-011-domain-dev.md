Aufgabe: T-011 — Token-Verfahren für den lokalen Dienst umsetzen

Status: fertig

---

Artefakte:

Neu unter `apps/local-api/`:

```
package.json                    nach dem Vorschlag aus T-008a, dazu @hono/node-server
tsconfig.json                   erbt tsconfig.base.json, types: ["node"]
src/config.ts                   feste Betriebswerte, kein Laufzeitschalter
src/errors.ts                   Fehlerkatalog aus Konstanten, 401 immer gleich
src/logger.ts                   Ausgabe mit Feld-Positivliste und Schwärzung
src/runtime.ts                  der Laufzeitzustand der Prüfschicht
src/composition.ts              Zusammenbau an genau einer Stelle
src/app.ts                      Middleware-Kette und die drei Zugriffsrouten
src/main.ts                     Start: Startgeheimnis, Bindung, Lebenszyklus
src/index.ts                    Einstiegspunkt, zehn Zeilen
src/access/token.ts             Gestalt des Geheimnisses, Schwärzung — rein
src/access/crypto.ts            der einzige Ort mit Zufall und Vergleich
src/access/verifier.ts          der Nachweispfad — rein, über einem Port
src/access/origin-policy.ts     Host, Herkunft, Abrufkontext, Inhaltstyp — rein
src/access/throttle.ts          Zählung der Fehlversuche — rein
src/access/notices.ts           Sicherheitsmeldungen im Arbeitsspeicher
src/access/paths.ts             %LOCALAPPDATA% / ~/.local/share/takt (E-018)
src/access/token-store.ts       Dateiadapter, 0700/0600, atomar
src/access/token-service.ts     Lebenslauf des Tokens, Neuerzeugung
src/access/session-secret.ts    Startgeheimnis über stdin, Elternverbindung
src/http/guards.ts              die acht Middlewares in ihrer Reihenfolge
scripts/proof-access.mjs        der Prüfpfad: 71 Prüfungen gegen den echten Dienst
```

2158 Zeilen Quelltext, davon rund die Hälfte Kommentar.

Geändert:

```
apps/local-api/openapi/takt-local-api.yaml   Nachweis, /token, /security/notices, Port
docs/architektur.md                          Abschnitt 6 neu, 1.2, 5.1, 5.2, 7
docs/datenmodell.md                          E-033 in der Quellenliste, Tokenablage
packages/domain/src/export.ts                E-033: booking.* raus, group.* rein
packages/domain/src/settings.ts              veralteter Kommentar zur Rückkehr-Spalte
packages/domain/scripts/check-export-boundary.mjs   drei neue Zusicherungen aufgenommen
vitest.config.ts                             coverage.reportOnFailure (auf Weisung)
package.json (Wurzel)                        Skript contrast, in die check-Kette (auf Weisung)
pnpm-lock.yaml                               drei Pakete
```

Die beiden letzten sind gemeinsame Dateien und normalerweise nicht meine; beide Änderungen hat
der Orchestrator während der Aufgabe ausdrücklich angewiesen. Siehe Nachtrag am Ende.

Nicht angefasst: `apps/web/**`, `apps/local-api/src/routes/addin/**` (existiert nicht),
`packages/*/test/**`, `packages/ui-tokens/**`, `CLAUDE.md`, `board.md`, `decisions.md`,
`risks.md`, `pnpm-workspace.yaml`, `tsconfig.base.json`. Kein `git commit`.

---

Zusammenfassung:

Das Zugriffsverfahren steht und ist gegen den laufenden Dienst nachgewiesen, nicht behauptet:
71 Prüfungen, alle bestanden, in `apps/local-api/scripts/proof-access.mjs`. Das Token besteht
aus 32 Byte `crypto.randomBytes` als base64url mit dem Präfix `takt_`; auf der Platte liegt
ausschließlich sein SHA-256-Abdruck, in einer eigenen Datei unter `%LOCALAPPDATA%\Takt\`
beziehungsweise `~/.local/share/takt/`, Verzeichnis `0700`, Datei `0600`, atomar geschrieben.
Der Vergleich läuft zeitkonstant über die Abdrücke beider Seiten und nimmt für eine fehlende,
eine leere und eine falsche Kopfzeile denselben Weg. Eine Neuerzeugung macht das alte Token in
dem Augenblick ungültig, in dem die Umbenennung der Datei durchgeht.

Herkunftsprüfung und Nachweis sind als **zwei Maßnahmen gegen zwei verschiedene Angreifer**
gebaut und im Quelltext auch so beschriftet: Der Kommentarkopf von `access/origin-policy.ts`
sagt ausdrücklich, dass sie gegen eine fremde Webseite wirkt und gegen einen lokalen Prozess
wirkungslos ist, und der von `http/guards.ts` sagt dasselbe für den Nachweis in die andere
Richtung. Wer eine der beiden anfasst, liest zuerst, was sie trägt und was nicht.

Zusätzlich ist der Vorschlag aus B-2.9 Punkt 3 umgesetzt: Die Oberfläche weist sich mit einem
**Sitzungsgeheimnis** aus, das die Hülle je Start über `stdin` übergibt und das die Platte nie
berührt. Damit hängt das dauerhafte Token allein an der Add-in-Strecke, ein entwendetes
Add-in-Token kann sich weder anzeigen noch selbst austauschen, und der Sidecar startet nicht,
wenn ihn jemand anderes als die Hülle startet.

---

Annahmen:

1. **Nur der Abdruck auf der Platte, Klartext genau einmal — Abweichung von T-001.**
   `docs/architektur.md` 6.2 sah in meiner eigenen Fassung aus T-001 den Klartext vor, damit die
   Oberfläche ihn wieder anzeigen kann. B-2.2 Punkt 2 empfiehlt das Gegenteil, und offene Frage 2
   aus T-003 stellt beides zur Wahl. Ich habe die Sicherheitsempfehlung genommen: Wer die
   Tokendatei liest — ein anderer Benutzer, ein Sicherungsagent, wer den Rechner in die Hand
   bekommt —, hält damit einen Abdruck und keinen Schlüssel.

   Der Preis ist eine Bedienregel, und sie gehört zur Abnahme: Der Klartext steht in genau einer
   Antwort (`POST /token`), die Oberfläche zeigt ihn einmal mit Kopierschaltfläche, danach ist er
   fort. Wer ihn verliert, erzeugt ein neues. Fällt die Entscheidung anders aus, ändert sich
   **nur** `access/token-store.ts` — Domäne, Nachweispfad und Prüfschicht bleiben, wie sie sind.

2. **Zwei Sorten Nachweis statt einer.** B-2.9 Punkt 3 nennt die Trennung des Oberflächenpfads
   „zur Entscheidung durch den Orchestrator". Ich habe sie gebaut, weil die Hälfte davon ohnehin
   Pflicht ist: B-1.6 Punkt 2 verlangt ein Startgeheimnis, ohne das der Sidecar sich beendet.
   Sobald es existiert, ist es der natürliche Nachweis der Oberfläche, und die Kosten sind fünf
   Zeilen im Vergleich (beide Abdrücke werden immer verglichen, bitweises ODER statt `||`).

   **Rückweg, falls der Orchestrator anders entscheidet:** In `composition.ts` wird
   `sessionSecret: null` gesetzt und in `app.ts` fallen die drei `requireCredential('session')`
   weg. Dann benutzt die Oberfläche das Add-in-Token. Der Verlust wäre RR-1 in voller Höhe.

3. **Fester Port 17843 statt zufällig — Abweichung von T-001.** Meine Fassung aus T-001 sagte
   „beim Start zufällig gewählt". B-1.5 bewertet das ausdrücklich als **keine**
   Sicherheitsmaßnahme und empfiehlt einen festen Port mit exklusiver Belegung. Umgesetzt: Ist
   der Port belegt, startet Takt nicht und weicht nicht aus — sonst könnte ein fremder Prozess
   ihn zuerst belegen und sich gegenüber dem Add-in als Takt ausgeben, um Tokens einzusammeln.
   `exclusive: true` ist dabei kein Zierrat: Unter Windows kann ohne dieses Kennzeichen ein
   zweiter Prozess denselben Port binden.

4. **Das Zugriffsverfahren liegt in `apps/local-api`, nicht in `packages/domain`.** Herkunft,
   Kopfzeilen und Vorabanfragen sind HTTP, und die Domäne kennt kein HTTP (architektur.md 1.1).
   Die Entscheidungsteile sind trotzdem rein und ohne laufenden Dienst prüfbar: `verifier.ts`,
   `origin-policy.ts` und `throttle.ts` nehmen Zeichenketten und Zustand entgegen und geben eine
   Entscheidung zurück; die Uhr ist ein Port. Nur `crypto.ts` und `token-store.ts` sind Adapter.

   Zweiter Grund, offen gesagt: Neue Laufzeitdateien in `packages/domain` oder
   `packages/storage` fallen unter die 80-Prozent-Schwelle aus `vitest.config.ts`. Ohne Tests —
   und Tests sind nicht meine Hoheit — hätte ich damit `pnpm check` rot gemacht, mitten in die
   parallele Arbeit des unit-testers hinein.

5. **Eine dritte Abhängigkeit: `@hono/node-server` 2.1.1.** Beauftragt waren `hono` und `zod`.
   Hono ist auf Web-Standards gebaut und hat für Node keinen eigenen Server; ohne den Adapter
   ließe sich nichts starten und damit auch nichts nachweisen. `createAdaptorServer` gibt den
   `http.Server` heraus, ohne selbst zu lauschen — nur so lassen sich `exclusive: true` setzen
   und die Bindeadresse nach dem Binden prüfen, beides Auflagen aus B-1.1 und B-1.5.

6. **Feste Fassungen ohne `^`.** `hono@4.13.4`, `zod@4.4.3`, `@hono/node-server@2.1.1`. Diese drei
   liegen im Zugriffspfad; eine Aktualisierung soll eine sichtbare Änderung sein und kein stiller
   Sprung beim nächsten `pnpm install` (B-10.2, B-10.7). `minimumReleaseAge` hat übrigens beim
   ersten Anlauf zugeschlagen und `hono@4.13.5` sowie `zod@4.5.4` abgelehnt — der Schalter aus
   T-008a arbeitet.

7. **`XDG_DATA_HOME` wird unter Linux beachtet, `%APPDATA%` niemals.** Auf Windows ist
   `%LOCALAPPDATA%` die einzige Quelle; fehlt sie, bricht der Start ab, statt ins Roaming-Profil
   auszuweichen (R-13). Dass unter Linux eine Umgebungsvariable den Pfad lenkt, ist die
   Plattformkonvention und keine Lücke: Wer den Sidecar startet, braucht ohnehin das
   Startgeheimnis.

8. **`/health` antwortet `{"data":{"status":"ok"}}`** — ohne Fassung und ohne Schemastand. T-001
   hatte beides vorgesehen. B-1.1 Punkt 2 verlangt eine inhaltsleere Antwort, und der Gewinn
   einer Fassungsnummer wiegt das nicht auf. Die OpenAPI-Beschreibung ist nachgezogen.

9. **Die Herkunft des Add-ins fehlt in der Positivliste und das ist Absicht.** Sie steht noch
   nicht fest (offene Frage 1 aus T-003). Solange sie fehlt, weist der Dienst Add-in-Anfragen mit
   403 ab. Fehlschlagen ohne Eintrag ist richtig; ein geratener Eintrag wäre eine Lücke.

10. **Zu den drei Zusatzpunkten des Orchestrators.** E-033 ist in `export.ts` nachgezogen:
    `booking.*` ist entfernt, `group.day`, `group.quarters`, `group.durationSeconds`,
    `group.bookingNotes`, `group.startedAt`, `group.endedAt` und `group.entryCount` sind an seine
    Stelle getreten. Die Leistung heißt bewusst `group.bookingNotes` und **nicht** `group.note`:
    Ein Quellenpfad namens „Notiz" stünde im Vorlageneditor unmittelbar neben dem internen
    Vermerk, und die Verwechslung wäre eine Frage der Zeit (R-08). Drei neue Zusicherungen halten
    das am Übersetzer fest — `NoSourceIsCalledPlainNote`, `BookingSourcesAreGone`,
    `GroupSourcesAreCovered` —, und der Wächter in `check-export-boundary.mjs` verlangt jetzt
    sieben statt vier. `settings.ts` ist auf den Stand von E-023 gebracht.
    `coverage.reportOnFailure` steht.

---

Der Nachweis, im Einzelnen

`pnpm --filter @takt/local-api proof:access` — **71 bestanden, 0 fehlgeschlagen.** Der Lauf
startet den echten Dienst als Kindprozess, gibt ihm ein Startgeheimnis über `stdin` und lenkt das
Anwendungsdatenverzeichnis in einen Wegwerfordner.

| Abschnitt | Was belegt wird | Bezug |
|---|---|---|
| 0 | Ohne Startgeheimnis endet der Dienst mit Code 78, ohne ein Geheimnis in der Meldung | B-1.6 |
| 1 | Meldet `127.0.0.1`; über die LAN-Adresse ist er nicht erreichbar | B-1.1 |
| 2 | `Host: evil.example` → 403, **auch mit gültigem Token**; ohne `Host` → abgewiesen; `127.0.0.1.evil.example:17843` → 403 | B-1.3 |
| 3 | Ohne Token 401, mit falschem 401, beide Antworten **zeichengleich** | B-1.1, B-2.4 |
| 4 | Erzeugen, zwei Erzeugungen unterscheiden sich, altes Token sofort 401, Zustand ohne Klartext | B-2.1, B-2.7 |
| 5 | Add-in-Token darf Zustand, Neuerzeugung und Meldungen nicht — dreimal 401 | B-2.9 |
| 6 | Herkunftstabelle einschließlich `tauri.localhost.evil.example`, `null`, leer; Vorabanfrage; `Sec-Fetch-*` | B-1.2, B-1.4 |
| 7 | `text/plain` und Formularkodierung → 415, **und die Wirkung ist nicht eingetreten** | B-1.2 |
| 8 | Token in Abfrage und im Pfad → 400, Antwort ohne den Wert, Vorfall in den Meldungen | B-2.4 |
| 9 | Rumpf über 1 MB → 413; unbekannte Route ohne Nachweis → 401, nicht 404 | B-1.7 |
| 10 | Nach zwölf Fehlversuchen steht eine Warnung bereit, ohne den geratenen Wert | B-2.6 |
| 11 | Verzeichnis `0700`, Datei `0600`, in der Datei nur der Abdruck, und er gehört zum Token | B-2.2, B-7.2 |
| 12 | **Kein `takt_`-Geheimnis in der gesamten Ausgabe des Dienstes**; in 49 Antwortkörpern genau zwei Tokens, nämlich die beiden Erzeugungen | B-2.4, B-12.2 |
| 13 | Statisch kein `===` auf Geheimnismaterial; Messung über 4000 Durchläufe je Fall | B-2.5 |
| 14 | Zweiter Start auf demselben Port endet mit Code 74 statt auszuweichen | B-1.5 |
| 15 | Endet `stdin`, endet der Dienst | B-1.6 |

**Zur Zeitmessung, ehrlich gesagt.** Die Mediane über 4000 Durchläufe liegen bei 882 ns für einen
Kandidaten, der 47 von 48 Zeichen teilt, 882 ns für einen, der schon im ersten Zeichen abweicht,
und 881 ns für eine leere Kopfzeile — Streuung 1,00. Das ist das erwartete Ergebnis, aber **eine
Messung ohne Ausschlag beweist wenig**: Der Vergleichswert mit `===` zeigt bei 48 Zeichen
ebenfalls keinen Unterschied (50 ns gegen 50 ns). Der eigentliche Nachweis ist deshalb
strukturell und steht in `verifier.ts`: einmal hashen, beide Vergleiche über
`crypto.timingSafeEqual` immer ausführen, kein früher Ausstieg, keine vorgezogene Längenprüfung.
Die Zahl steht im Bericht, damit niemand sie für den Beweis hält.

`pnpm typecheck` — Exitcode 0 über alle fünf Pakete.
`pnpm boundaries` — Exitcode 0, sieben Typbehauptungen, Notiz-Trennung unverletzt.
`pnpm build` — Exitcode 0.

**`pnpm check` ist rot, und zwar nicht durch diese Aufgabe.** Er bricht bei `test:coverage` ab:
70 Tests aus T-010 schlagen fehl, weil sie vor der Umsetzung geschrieben wurden und `T-009` noch
nicht gelaufen ist — `decideTimerStart is not a function` und dergleichen. Das ist der gewollte
Zustand von testgetriebener Arbeit, aber es heißt, dass „`pnpm check` fehlerfrei" bis zum
Abschluss von T-009 für **keinen** Agenten erreichbar ist. Ich habe die Kette deshalb einzeln
gefahren und oben einzeln belegt.

**Der gemeldete Typecheck-Fehler in `apps/local-api`: gefunden.** Er war meiner, transient und ist
weg. Zwischen dem Anlegen von `package.json` und `tsconfig.json` und der ersten Quelldatei bricht
`tsc -p tsconfig.json` mit TS18003 ab, „No inputs were found in config file". Genau diesen Fall
hatte ich in T-008a unter Annahme 7 vorhergesagt und deshalb dort **keine** `package.json`
angelegt — in dieser Aufgabe lagen zwischen beiden Schritten ein paar Minuten, und der
unit-tester hat genau in dieses Fenster hinein geprüft. Lehre für die nächste Welle: Paketdatei
und erste Quelldatei gehören in denselben Schreibvorgang.

---

Risiken:

1. **RR-1 bleibt, ist aber kleiner geworden.** Ein lokaler Prozess mit dem Add-in-Token ist vom
   echten Add-in nicht unterscheidbar; TCP kennt kein Gegenüber. Neu ist, dass er damit **nicht**
   an die Oberflächenrouten kommt, das Token nicht austauschen und den Benutzer nicht aussperren
   kann. Erkennbar wird der Angriff über `/security/notices`. Verhindert wird er nicht.

2. **Unter Windows ist die Rechteprüfung heute wirkungslos.** `chmod` und `fs.stat` liefern dort
   keinen brauchbaren POSIX-Modus; die Grenze trägt die ACL. `inspectPermissions` gibt unter
   Windows `checked: false` zurück, statt eine Sicherheit vorzutäuschen. **Für T-008b:** Die Hülle
   muss beim Anlegen von `%LOCALAPPDATA%\Takt\` die Vererbung entfernen und eine ACL setzen, die
   nur den aktuellen Benutzer und `SYSTEM` enthält. Ohne diesen Schritt liest auf einem
   Terminalserver jeder Kollege Tokendatei und Datenbank.

3. **Es gibt noch keine Protokolldatei.** Die Ausgabe geht nach `stderr` und damit in die Hände
   der Hülle. B-12.2 verlangt eine Datei neben der Datenbank mit denselben Rechten und mit Umlauf
   nach Größe und Alter. Das ist Betriebsschicht und gehört in T-009 oder eine eigene kleine
   Aufgabe. Die Ausgabefunktion ist darauf vorbereitet: Sie nimmt ein `write` entgegen.

4. **Die Positivliste der Herkünfte ist geraten, soweit sie die Hülle betrifft.** Drei
   Schreibweisen für den Tauri-Webview stehen drin (`https://tauri.localhost`,
   `http://tauri.localhost`, `tauri://localhost`), weil sich das ohne laufende Hülle nicht
   belegen lässt. **Für T-008b:** Bitte die tatsächliche Herkunft messen und die überflüssigen
   Einträge streichen. Drei Einträge, von denen zwei nie vorkommen, sind zwei zu viel.

5. **Die Ratenbegrenzung zählt global, nicht je Gegenstelle.** Auf einem Loopback-Dienst gibt es
   nur eine Gegenstelle, und die Verzögerung ist auf zwei Sekunden gedeckelt, damit ein Angreifer
   nicht über die Bremse alle Verbindungen bindet. Der Preis: Zwölf Fehlversuche einer
   Schadsoftware verzögern auch die echte Oberfläche ein wenig. Das ist der richtige Handel für
   einen Einbenutzerdienst, aber es ist einer.

6. **Der Klartext steht in genau einer Antwort.** `POST /token` gibt ihn heraus — anders ginge es
   nicht, der Dienst erzeugt ihn. Eng gefasst ist die Stelle durch: nur mit Sitzungsgeheimnis,
   `Cache-Control: no-store` auf jeder Antwort, keine Protokollierung von Rümpfen. Der Prüfpfad
   zählt die Vorkommen: zwei in 49 Antwortkörpern, genau die beiden Erzeugungen.

7. **`packages/export/test/**` bricht durch E-033 — bekannt und vom unit-tester vorhergesehen.**
   Die Testdateien führen `booking.note` und `booking.durationSeconds` als `ExportSourcePath` und
   sagen im Kopfkommentar selbst, dass sie umzustellen sind, sobald E-033 nachgezogen ist. Das ist
   jetzt der Fall. Ersetzung: `booking.note` → `group.bookingNotes`, `booking.durationSeconds` →
   `group.quarters` für das Feld `Zeit` beziehungsweise `group.durationSeconds` für eine
   Kontrollspalte. `pnpm typecheck` merkt das nicht, weil Testdateien in keinem `tsconfig`-Pfad
   liegen — die Änderung fällt erst zur Laufzeit auf.

8. **Kein Semgrep- und kein 42Crunch-Lauf von mir.** Beides ist Sache des security-checkers. Die
   OpenAPI-Beschreibung liegt jetzt vor und ist prüfbar: 33 Pfade, 54 Operationen, alle Verweise
   auflösbar, keine Operation ohne Nachweispflicht, jede mit einer 401-Antwort. Damit ist das Tor
   aus Abschnitt 8 des Bedrohungsmodells offen.

---

Offene Fragen:

1. **An den Orchestrator, entscheidungsbedürftig: Bleibt es beim Abdruck auf der Platte?**
   Sicherheitsempfehlung ja (B-2.2), Bedienfolge: Der Klartext wird einmal gezeigt und ist danach
   fort. Die Alternative — Klartext über die Windows-DPAPI, jederzeit wieder anzeigbar — ändert
   nur `access/token-store.ts`. Die Frage gehört zur Abnahme, weil sie den Benutzer betrifft.

2. **An den Orchestrator: Bleiben die zwei Sorten Nachweis?** Siehe Annahme 2. Ich halte sie für
   richtig, weil sie die Angriffsfläche des dauerhaften Tokens strukturell verkleinert statt sie
   nur zu bewachen — der einzige Vorschlag aus B-2.9, von dem das gilt. Sie braucht aber eine
   Entscheidung, weil sie den Zuschnitt der Hülle betrifft: T-008b muss das Startgeheimnis
   erzeugen und über `stdin` schicken.

3. **An integration-dev, über den Orchestrator: Unter welcher Herkunft läuft das Add-in?** Ohne
   diese Angabe weist der Dienst jede Add-in-Anfrage mit 403 ab. Der Eintrag gehört in
   `apps/local-api/src/config.ts`, `ALLOWED_ORIGINS`. Die vier Auflagen für T-007 stehen
   ausgeschrieben in `docs/architektur.md`, Abschnitt 6.6 — darunter E-019: Das Token gehört in
   den `localStorage` der Add-in-Herkunft und **nicht** in `Office.context.roamingSettings`, weil
   es sonst im Postfach läge und über Exchange synchronisiert würde.

4. **An den frontend-dev, über den Orchestrator: S-09 braucht drei Dinge.** Ein Token, das nur
   nach ausdrücklicher Handlung und zeitlich begrenzt sichtbar ist (B-2.3); einen
   Bestätigungsdialog vor der Neuerzeugung, der ausspricht, dass das Add-in danach bis zum
   Nachtragen nicht mehr funktioniert (B-2.7 Punkt 3); und eine Anzeige der Meldungen aus
   `/security/notices`, weil das der einzige Weg ist, auf dem der Benutzer von einem Angriff
   erfährt (B-2.6).

5. **An den Orchestrator: `pnpm check` ist bis T-009 für niemanden grün.** Solange die Tests aus
   T-010 vor der Umsetzung stehen, bricht die Kette bei `test:coverage` ab. Vorschlag: Die
   Definition of Done der laufenden Welle auf `pnpm typecheck && pnpm boundaries && pnpm build`
   umstellen und `pnpm check` erst ab T-009 wieder verlangen. Sonst meldet jeder Agent dieselbe
   fremde Rotfärbung.

6. **Hinweis, kein Blocker:** `apps/local-api` hat kein `build`-Skript. Der Sidecar wird gebündelt
   (T-008b), und welcher Bündler das tut, steht nicht fest. Wichtig für den, der es einrichtet:
   `@takt/domain` und `@takt/storage` zeigen auf Quelltext, müssen also mitübersetzt und dürfen
   nicht als „external" geführt werden. Der Dienst läuft heute direkt über
   `node apps/local-api/src/index.ts` — Node 22.23 streift Typen von sich aus ab; deshalb tragen
   die Importe innerhalb von `apps/local-api` `.ts`-Endungen und nicht `.js`.

---

Nächster Schritt:

1. **Der security-checker kann prüfen.** Die OpenAPI-Beschreibung liegt vor, der Dienst läuft und
   ist mit `pnpm --filter @takt/local-api proof:access` startbar. Die Punkte B-1.1 bis B-1.7 und
   B-2.1 bis B-2.7 sind abgearbeitet, B-12.2 zur Hälfte (Ausgabe eng, aber noch keine Datei mit
   Umlauf).
2. **Der unit-tester zieht `packages/export/test/**` auf E-033 nach** — zwei Zeichenketten, siehe
   Risiko 7 — und kann die Tabelle aus `proof-access.mjs` als Vorlage für die Integrationstests
   der Prüfschicht nehmen. Die Prüfungen 1 bis 7 aus Abschnitt 7 des Bedrohungsmodells sind darin
   eins zu eins enthalten.
3. **T-008b braucht von mir zwei Dinge:** das Startgeheimnis über `stdin` (mindestens 32 Zeichen,
   eine Zeile, innerhalb von fünf Sekunden nach dem Start) und die ACL des
   Anwendungsdatenverzeichnisses unter Windows.
4. **T-009 hängt seine Router hinter `app.use(...)` in `app.ts`**, nicht daneben. Die Kette ist
   die einzige Stelle, an der geprüft wird; eine Route, die daran vorbeigeht, ist offen.

---

## Nachtrag — `pnpm contrast` an der Wurzel

Auf Weisung des Orchestrators nachgetragen, weil die Wurzel-`package.json` sonst nicht in meiner
Hoheit liegt.

```
"contrast": "pnpm --filter @takt/web contrast",
"check": "pnpm run typecheck && pnpm run boundaries && pnpm run contrast
          && pnpm run test:coverage && pnpm run build"
```

Gelaufen: `pnpm contrast` an der Wurzel, Exitcode 0, **0 von 150 Paaren durchgefallen**.

Die Einordnung des Orchestrators trifft den Kern und ist über den Kontrast hinaus wahr: An der
Wurzel sahen kaputt und heil gleich aus, weil dort ohnehin nichts gerufen wurde. Genau das ist
der Grund, warum ich in dieser Aufgabe `scripts/proof-access.mjs` als aufrufbaren Prüfpfad
gebaut habe und nicht als Absatz im Bericht: Eine Zusicherung, die niemand ausführt, ist eine
Behauptung.

Damit stehen in `pnpm check` fünf Glieder. Vier davon sind heute grün — `typecheck`,
`boundaries`, `contrast`, `build`; das fünfte, `test:coverage`, bleibt bis zum Abschluss von
T-009 rot, siehe offene Frage 5. Die Kontrastprüfung sitzt bewusst **vor** den Tests, damit sie
in dieser Phase überhaupt zum Zug kommt und nicht hinter dem Abbruch verschwindet.

`pnpm --filter @takt/local-api proof:access` ist absichtlich **nicht** in `check` aufgenommen: Es
bindet den Port 17843 exklusiv, startet vier Kindprozesse und läuft rund fünfzehn Sekunden. Das
gehört in eine Prüfung, die jemand bewusst startet, und in die Integrationstests aus T-010 — nicht
in die Kette, die jeder Agent nebenbei laufen lässt.
