Aufgabe: T-034 — Drei blockierende Sicherheitsbefunde aus T-023 (S-01, S-02, S-03)

Status: fertig

---

Artefakte:

```
apps/local-api/src/access/route-policy.ts        NEU (144) — S-01. Die umgedrehte Vorgabe als
                                                 reine Funktion: Pfad herein, Anforderung heraus.
                                                 Ohne HTTP, ohne laufenden Dienst prüfbar
apps/local-api/src/http/guards.ts                `credentialPolicy()` als neuntes Kettenglied;
                                                 `requireCredential` bleibt als zweite Sperre;
                                                 gemeinsame Abweisung in `denyCredential`
apps/local-api/src/app.ts                        `credentialPolicy()` in die Kette; der Kommentar
                                                 am Add-in-Block sagt jetzt, wodurch er trägt
apps/local-api/src/main.ts                       S-03. `process.umask(0o077)` als erste Handlung;
                                                 nach der Migration Rechte setzen, messen und bei
                                                 Bedarf sichtbar warnen
apps/local-api/openapi/takt-local-api.yaml       Abschnitt „Welches der beiden Geheimnisse eine
                                                 Operation verlangt" im Nachweisschema
packages/export/src/template.ts                  S-02. Zeichenvorrat und Länge des Feldnamens,
                                                 Sperrliste, Abgleich auf doppelte Namen
packages/export/src/render.ts                    S-02. Die Zeile über `Object.create(null)`
packages/storage/src/sqlite/database.ts          S-03. `secureDatabaseFiles`,
                                                 `inspectDatabasePermissions`,
                                                 `DATABASE_FILE_MODE`; `PRAGMA trusted_schema=OFF`
packages/storage/src/sqlite/migration-runner.ts  S-03. Die `VACUUM INTO`-Sicherung bekommt 0600
packages/storage/src/index.ts                    die drei neuen Ausfuhren
apps/local-api/scripts/proof-route-policy.mjs    NEU (570) — 40 Prüfungen, darunter Prüfung 24
apps/local-api/scripts/proof-template-fields.mjs NEU (489) — 28 Prüfungen, Prüfung 25
apps/local-api/scripts/proof-db-permissions.mjs  NEU (280) — 17 Prüfungen, Prüfung 26
apps/local-api/scripts/proof-export-api.mjs      nachgezogen: Feldnamen aus Quellenpfaden
apps/local-api/package.json                      drei Skripteinträge (siehe Annahme 5)
docs/architektur.md                              neuer Abschnitt 6.7, 6.3 und 5.1 nachgezogen
docs/datenmodell.md                              neuer Abschnitt 2.5, 3.6 und 8 nachgezogen
```

`apps/web/**`, `tests/e2e/**`, `packages/*/test/**`, `apps/local-api/src/routes/addin/**`,
`docs/bedrohungsmodell.md` und die Wurzeldateien **unangetastet**. Keine neue Abhängigkeit,
`pnpm-lock.yaml` unverändert, keine Migration — S-03 ändert Dateirechte, nicht das Schema.

---

Zusammenfassung:

**S-01 — die Vorgabe ist umgedreht, und die Zusage in `app.ts` ist eingeholt.**

`credentialPolicy()` hängt als neuntes Glied in der Kette, direkt hinter `authGuard`. `authGuard`
klärt, **ob** ein gültiger Nachweis vorliegt; das neue Glied klärt, **welcher**. Verlangt wird
`session` für jeden Pfad; abgesenkt wird an genau zwei ausgeschriebenen Stellen: dem Teilbaum
`/api/v1/addin` und `GET /api/v1/health`. Ein unbekannter Pfad fällt in den `session`-Zweig und
ergibt 401 statt 404 — die Routenliste bleibt verdeckt.

Entscheidend ist, dass nirgends etwas aufgezählt wird. Die Anforderung fällt am Pfad, nicht an
einer gepflegten Liste. Eine künftig hinzugefügte Fachroute ist von selbst geschlossen; wer sie
öffnen will, muss `route-policy.ts` anfassen.

Die Entscheidung arbeitet auf `c.req.path` — **derselben Zeichenkette**, die Hono zum Routen
benutzt (`dispatch` berechnet sie einmal und reicht sie an `router.match` und an `HonoRequest`).
Das ist die tragende Eigenschaft: Solange Prüfung und Router dieselbe Zeichenkette sehen, kann
keine Anfrage die Prüfung für `/addin` bestehen und danach bei einer Fachroute landen. Eine eigene
Normalisierung steht deshalb ausdrücklich **nicht** dort — das wäre die zweite Meinung, aus der
solche Lücken entstehen. Enthält der Pfad ein Punktsegment (`..`, `%2e%2e`, `.%2e` …), wird gar
nicht erst abgesenkt: Abgelehnt wird die Ausnahme, nicht der Pfad.

Der Kommentar in `app.ts` ist **nicht** abgeschwächt worden. Er steht wörtlich da, wo er stand,
und trägt einen Absatz mehr, der sagt, wodurch er jetzt trägt und was ein Leser prüfen kann.

**Gemessen** — `proof:route-policy`, 40 von 40, gegen einen zusammengesetzten Dienst mit echter
migrierter SQLite, echtem über `tokens.rotate` erzeugtem Add-in-Token und **ohne** jedes
Sitzungsgeheimnis:

| Messung aus T-023 | vorher | jetzt |
|---|---|---|
| `GET /todos/{id}/note` | 200, Vermerk im Klartext | **401**, weder Klartext noch Base64 in der Antwort |
| `PUT /todos/{id}/note` | 200, überschreibbar | **401**, der Vermerk steht unverändert da |
| `PATCH /settings` (`exportDirectory`) | 200, Ordner gesetzt | **401**, der Ordner ist nicht gesetzt |
| `PATCH /settings` (`roundingMode`) | 200 | **401** |
| `POST /export/runs` | 201, Datei im Beuteordner | **401**, der Beuteordner ist leer |
| `POST /export/preview` | 200 | **401** |
| `GET /time-entries` | 200 | **401** |
| `DELETE /todos/{id}` | — | **401**, das Todo ist noch da |

Und darüber hinaus, weil acht nachgefahrene Angriffe genau acht Routen schützen: **Prüfung 24**
läuft über `Hono#routes`, also über die Routenliste des Dienstes selbst. **Alle 59** registrierten
Operationen außerhalb der abgesenkten Fläche ergeben mit dem Add-in-Token 401; dieselben 59 mit
dem Sitzungsgeheimnis **keine einzige**. Die vier Add-in-Routen und `GET /health` sind erreichbar
geblieben, einschließlich Todo anlegen und Zeit buchen. Wer künftig eine Route registriert, ohne
sie unter `/addin` zu hängen, wird hier von selbst mitgemessen — das ist der Teil, der verhindert,
dass der Befund in drei Monaten wiederkommt.

Dazu die Grenze von der Seite: `/addintern` (401), `/addin/../todos` (401), `/addin/%2e%2e/todos`
(401), `/addin%2f../todos` (401), ein unbekannter Pfad (401 statt 404), `/addin/context` ohne
jeden Nachweis (401). Und 18 Fälle gegen die reine Funktion, ohne laufenden Dienst.

**S-02 — Feldnamen werden geprüft, doppelte abgewiesen, die Zeile hat keinen Prototyp.**

`validateExportTemplateField` prüft den Namen jetzt gegen `^[A-Za-z0-9_-]{1,64}$` und weist
`__proto__`, `constructor` und `prototype` zusätzlich ausdrücklich ab — sie sind der Grund für die
Grenze, nicht ihr Nebeneffekt, und wer den Zeichenvorrat je erweitert, soll an ihnen vorbei
müssen. `validateExportTemplateDefinition` weist zwei Felder gleichen Namens ab, statt sie still
zusammenzuführen; die Meldung sagt, was sonst geschähe („In der Exportdatei bliebe davon nur der
letzte Wert übrig"). Verglichen wird wörtlich: `Call` und `call` bleiben erlaubt, weil JSON sie
unterscheidet und nichts verloren geht — abgewiesen wird der stille Verlust, nicht die Ähnlichkeit.

`render.ts` baut die Zeile über `Object.create(null)`. Das ist die zweite Schicht: Die erste
verhindert die Eingabe und kann dem Benutzer sagen, warum sein Feld nicht geht; die zweite
verhindert die Wirkung, auch bei einer Vorlage, die nie durch die Prüfung kam.

**Gemessen** — `proof:template-fields`, 28 von 28, auf drei Ebenen:

* Unmittelbar gegen `packages/export`: 12 unzulässige Namen abgewiesen (`__proto__`,
  `constructor`, `prototype`, 65 und 200 Zeichen, `<img src=x onerror=alert(1)>`, Leerzeichen,
  Punkte, Zeilenumbruch, Umlaute, leer, nur Leerraum), 8 zulässige weiterhin angenommen, das
  Duplikat abgewiesen, die Standardvorlage besteht.
* Durch den vollständigen HTTP-Stapel: 6 Angriffsvorlagen über `POST /export/templates`
  abgewiesen und **keine** davon gespeichert; `PATCH` auf eine bestehende Vorlage kommt ebenso
  wenig daran vorbei; `POST /export/preview` mit ungespeicherter Definition (E-051) hält
  gleichermaßen; eine gültige Definition wird weiterhin gespeichert und gerendert.
* An Oberfläche und Route vorbei, per `INSERT` direkt in SQLite und mit neu aufgesetztem Dienst —
  derselbe Weg, mit dem T-023 die Notiz-Grenze angegriffen hat: Vorschau bricht ab, Exportlauf
  bricht ab, **keine Datei** im Exportordner, **keine** Buchung markiert. Gegenprobe: derselbe
  Export läuft mit der Standardvorlage durch und schreibt genau eine Datei.
* Der Renderer selbst, mit einer absichtlich an der Prüfung vorbeigeführten Vorlage: `__proto__`
  steht als gewöhnlicher Schlüssel in der Zeile, das danebenstehende `Call` überlebt (vorher war
  die ganze Zeile leer), beide stehen so auch im serialisierten Ergebnis.

**S-03 — der Bestand liegt mit 0600, und zwar durch zwei Maßnahmen.**

Eine allein reicht nicht, und das ist der Kern des Befunds. `secureDatabaseFiles()` holt eine
Datei ein, die aus einer Fassung vor T-034 mit `0644` daliegt — aber SQLite entfernt `-wal` und
`-shm` im Betrieb und legt sie neu an, ein einmaliges `chmod` erwischt sie dann nicht mehr.
`process.umask(0o077)` als **erste** Handlung des Sidecars wirkt auf jede Datei, die dieser Prozess
je anlegt, einschließlich jeder, an die heute niemand denkt. Dazu die `VACUUM INTO`-Sicherung des
Migrationsläufers — sie heißt `…-vor-migration-…` und sieht aus wie etwas, das man aufhebt und
herauskopiert.

`chmod`-Fehlschläge sind still (ein Dateisystem ohne POSIX-Rechte darf den Start nicht
verhindern). Sichtbar wird ein zu weiter Modus stattdessen: Der Dienst misst nach der Migration
nach und hinterlegt `file_permissions_wide` plus eine Protokollzeile — dieselbe Meldung, die
Tokendatei und Verzeichnis schon nutzen (B-7.2 Punkt 3). Unter Windows geschieht nichts, statt
eine Wirkung vorzutäuschen; dort trägt die ACL, benannte Lücke aus T-011.

**Gemessen** — `proof:db-permissions`, 17 von 17, mit absichtlich **weit** gesetzter eigener
`umask` (`0o000`), damit die Abschnitte 1 und 2 wirklich das `chmod` messen und nicht die `umask`:

| | vorher | jetzt |
|---|---|---|
| `takt.db`, `-wal`, `-shm` frisch angelegt | 0644 | **0600** |
| `takt.db` aus einer früheren Fassung, beim Öffnen | 0644 | **0600** |
| Sicherungskopie des Migrationsläufers | 0644 | **0600** |
| echter Startpfad des Dienstes, Kind erbt `umask 0o000` | — | Verzeichnis **0700**, alle drei Dateien **0600**, keine einzige Datei im Anwendungsdatenverzeichnis für andere lesbar |

Migration vorwärts, rückwärts auf Fassung 1 und wieder vorwärts auf Fassung 6 läuft dabei mit —
die Sicherungskopie entsteht nur beim Migrieren von einer Fassung > 0, also ist der Rückweg Teil
derselben Messung.

**Mitgenommen, weil es dasselbe Tor ist:** `PRAGMA trusted_schema = OFF` (S-06, B-7.4 Punkt 4).
Eine Zeile in einer Datei, die für S-03 ohnehin angefasst wurde, und im Bedrohungsmodell unter
„Nacharbeit zu T-008" neben Prüfung 26 geführt. Gemessen: der Wert ist 0, und das Pragma steht in
`CONNECTION_PRAGMAS`, wird also bei **jedem** Öffnen gesetzt.

**Prüfstand.** `pnpm check` **Exitcode 0** — 33 Testdateien, 545 Tests, alle Abdeckungsschwellen
gehalten, Grenzenprüfung, Kontrastprüfung und Bau grün. Alle acht Nachweispfade grün: `access`
75/75, `export` 66/66, `export-api` 69/69, `taskpane` 25/25, `addin-wiring` 30/30, `route-policy`
40/40, `template-fields` 28/28, `db-permissions` 17/17 — zusammen 350. Dazu `outlook-addin`
`proof:addin` 73/73.

---

Annahmen:

1. **`GET /health` ist die einzige Ausnahme neben `/addin`, und das ist eine Abweichung vom
   Wortlaut des Prüfers.** Er schrieb „genau den Zuschnitt aus T-019 … nichts darüber hinaus".
   `GET /health` ist aber „Verbindung prüfen" in S-13 und wird vom Add-in tatsächlich aufgerufen
   (`apps/outlook-addin/src/api/client.ts:228`, dort so benannt; `app.ts` und `architektur.md` 6.3
   beschreiben es seit T-011). Hätte ich sie geschlossen, wäre der Knopf kaputt, mit dem der
   Benutzer sein gerade eingetragenes Token prüft — er könnte die Einrichtung nur noch bestätigen,
   indem er einen fachlichen Aufruf absetzt und dessen Fehlschlag deutet. Vertretbar, weil sie
   nichts herausgibt (`{"data":{"status":"ok"}}`), nichts ändert und weiterhin hinter dem Nachweis
   liegt (ohne Token 401, gemessen). T-033 hatte in seiner offenen Frage 3 dieselbe Fläche
   vorgeschlagen: „`/addin/*` und `/health`". **Der security-checker möge das ausdrücklich
   bestätigen oder verwerfen** — Offene Frage 1.

2. **Doppelte Feldnamen werden wörtlich verglichen, nicht ohne Rücksicht auf Groß- und
   Kleinschreibung.** `Call` und `call` sind in JSON zwei Schlüssel, beide stehen in der Datei, es
   geht nichts verloren. B-3.2 richtet sich gegen den **stillen Verlust**, nicht gegen
   Ähnlichkeit. Eine strengere Regel würde eine legitime Vorlage abweisen, ohne einen Schaden zu
   verhindern.

3. **Die Feldnamenprüfung bleibt in `packages/export`.** Sie ist eine Eigenschaft der Vorlage,
   und `validateExportTemplateField` ist die eine Stelle, die eine Vorlage prüft — beim Speichern
   **und** bei jedem Lauf. Sie in die Domäne zu heben hätte bedeutet, `packages/domain` einen
   Begriff „Vorlagenfeld" zu geben, den sie heute bewusst nicht hat. Der Eingriff in
   `packages/export/src/**` ist auf das beschränkt, was die Prüfung verlangt: zwei Funktionen in
   `template.ts` und eine Zeile in `render.ts`.

4. **`process.umask(0o077)` statt nur `chmod`.** Der Prüfer hat beides angeboten und die `umask`
   „die robustere Fassung" genannt. Umgesetzt sind beide, weil sie verschiedene Fälle abdecken:
   die `umask` künftige Dateien, das `chmod` vorhandene. Nebenwirkung auf den Export: keine — er
   wird ohnehin ausdrücklich mit `0600` geschrieben (B-5.4).

5. **Drei Skripteinträge in `apps/local-api/package.json`.** Das ist die Paketdatei innerhalb
   meiner Hoheit, nicht die Wurzeldatei, und alle fünf vorhandenen `proof:*`-Einträge sind auf
   demselben Weg entstanden. Wurzel-`package.json`, `pnpm-workspace.yaml` und `pnpm-lock.yaml`
   sind unangetastet.

6. **Der Nachweispfad für S-01 und S-02 fährt über `app.fetch`, nicht über einen eigenen
   Prozess.** Zwei Gründe, beide im Kopf der Datei ausgeschrieben: Erstens ist `app.fetch`
   dieselbe Kette, die der Adaptor-Server je Anfrage aufruft — Host-, Herkunfts-, Adress-,
   Inhaltstyp-, Größen-, Zeit-, Nachweis- und Rechteprüfung laufen vollständig, und der
   security-checker hat B-2.10 auf genau diesem Weg gemessen. Zweitens kennt der Dienst keine
   Angabe für seinen Port (B-1.6 Punkt 1): Ein Prüfpfad, der einen Prozess startet, ist nicht
   neben der laufenden Anwendung und nicht neben den End-zu-End-Tests fahrbar — beim ersten
   Anlauf ist genau das passiert. Der Weg über die echte Verbindung bleibt in
   `proof-addin-wiring.mjs` und in `proof-access.mjs`; `proof:db-permissions` startet den echten
   Sidecar und kommt ohne den Port aus, weil der Bestand vor dem Binden entsteht.

---

Für den e2e-tester und den frontend-dev — was sich an Statuscodes ändert:

* **Nichts, solange mit dem Sitzungsgeheimnis gearbeitet wird.** Gemessen: keine der 59 Routen
  außerhalb der abgesenkten Fläche weist es ab. `tests/e2e/support/session.ts` und
  `tests/e2e/support/api.ts` benutzen das Sitzungsgeheimnis; in keinem `.spec.ts` kommt ein
  Add-in-Token vor. Ich erwarte **keine** Auswirkung auf einen Klickpfad.
* **Neu 401 statt 200/201/404:** jede Route außerhalb von `/api/v1/addin` und `/api/v1/health`,
  wenn ein Aufrufer sich mit dem **Add-in-Token** ausweist. Auch ein unbekannter Pfad ergibt mit
  Add-in-Token 401 statt 404. Wer so etwas prüft, prüfte bisher eine Lücke.
* **Neu 422 statt 201:** eine Exportvorlage mit einem Feldnamen außerhalb von
  `[A-Za-z0-9_-]{1,64}` oder mit zwei Feldern gleichen Namens. Betroffen war im ganzen Baum genau
  eine Stelle, und die war meine: `proof-export-api.mjs` benannte seine Felder nach den
  Quellenpfaden (`todo.callNumber`) — nachgezogen. In `apps/web`, `tests/e2e` und
  `packages/*/test` kam kein Feldname vor, der die neue Regel verletzt (`Call`, `Zeit`, `Notiz`,
  `WindowsUser`, `Dauer`, `Feld`, `Kaputt`, `Leistung`, `Ticket`, `Unbekannt`, `Vermerk`).
* **Für S-14 (frontend-dev):** Die Warnung vor Doppelnamen aus S-14 darf bleiben und ist jetzt
  durch eine Sperre gedeckt. Der Dienst antwortet mit `422 export_template_invalid` und
  `details[0].code = "duplicate"`, `details[0].field = "name"`; bei einem unzulässigen
  Zeichenvorrat mit `422 validation_error`, `field = "name"` und der Meldung „Erlaubt sind 1 bis
  64 Zeichen aus A–Z, a–z, 0–9, Bindestrich und Unterstrich." Beide Meldungen sind so formuliert,
  dass sie unverändert angezeigt werden können.

---

Offene Fragen:

1. **An den security-checker, zur Bestätigung:** `GET /health` bleibt für das Add-in-Token
   erreichbar (Annahme 1). Die saubere Form wäre `GET /addin/health` und ein Add-in, das sie
   benutzt — das berührt `apps/local-api/src/routes/addin/**` (nicht meine Hoheit) und
   `apps/outlook-addin/**` (integration-dev). Bitte entweder bestätigen, dass die Ausnahme trägt,
   oder als kleine Folgeaufgabe für integration-dev einplanen. Bis dahin steht sie ausgeschrieben
   und begründet in `SHARED_PATHS` und in `architektur.md` 6.7, nicht nur im Code.

2. **An den security-checker, zu Prüfung 24:** Sie ist als `proof:route-policy` gebaut und läuft
   über `Hono#routes`. Ob sie zusätzlich als Vitest-Prüfung unter `apps/local-api/test/` liegen
   soll, entscheidet der unit-tester — dieses Verzeichnis existiert noch nicht und gehört ihm. Die
   Fläche dafür ist da: `requiredCredentialForPath` ist rein und ohne Dienst prüfbar, und
   `compose({ databaseLocation: ':memory:' })` liefert die Routenliste in drei Zeilen.

3. **An den integration-dev (`packages/export`):** Ich habe `FIELD_NAME_PATTERN` und
   `RESERVED_FIELD_NAMES` bewusst **nicht** ausgeführt. Sobald die Oberfläche die Regel vor dem
   Absenden anzeigen soll, ist der richtige Weg E-049: `GET /export/sources` liefert ohnehin die
   Auskunft des Dienstes und könnte den Zeichenvorrat als Feld mitliefern (`fieldNamePattern`,
   `fieldNameMaxLength`). Das ist eine Erweiterung der Route und keine Paketabhängigkeit von
   `apps/web` auf `@takt/export`. Ich habe es nicht nebenbei getan, weil es die Antwortform einer
   Route ändert, auf die der frontend-dev gerade zieht.

4. **An den Orchestrator, unverändert offen aus T-023:** S-05 (`Math.random` in der
   Zertifikatserzeugung, `apps/local-api/src/taskpane/certificate.ts:113`) und S-09 (`500` und
   `429` fehlen in der OpenAPI-Beschreibung) liegen beide in meiner Hoheit und sind beide klein.
   Ich habe sie nicht mitgenommen, weil der Auftrag drei Befunde nannte und der Umfang dieser
   Aufgabe schon drei Pakete berührt. `trusted_schema` habe ich mitgenommen, weil es dasselbe
   Tor ist wie S-03 und in derselben Zeile derselben Datei liegt — das ist im Bericht oben
   ausgewiesen. Als eigene kleine Aufgabe jederzeit machbar.

5. **Unbeantwortet, weil außerhalb meiner Hoheit:** S-04 (Exportordner als Freitextfeld) bleibt
   beim frontend-dev. Der Traversierungsschutz in `packages/storage/src/sqlite/file-port.ts` ist
   unangetastet — der Prüfer hat ihn bestätigt, und `checkExportDirectory` um `unc`, `network`,
   `sync_folder` und `system_dir` zu erweitern ist eine eigene Aufgabe mit eigener Rückfragelogik
   in der Oberfläche. Wenn sie kommt, ist die Dienstseite meine.

---

Nächster Schritt:

Der security-checker fährt Prüfung 24, 25 und 26 gegen den neuen Stand nach und entscheidet
Offene Frage 1 (`/health`). Danach lassen sich B-2.10, B-3.2 und B-7.2 in Abschnitt 12.6 des
Bedrohungsmodells von „offen" auf „umgesetzt" ziehen, und die drei Tore aus dem Nachtrag zu
Abschnitt 8 („Nachfolgeaufgabe zu B-2.10", „Nacharbeit zu T-007" für B-3.2, „Nacharbeit zu
T-008") sind einlösbar — mit Ausnahme der Ordnerwahl aus B-5.1 Punkt 1, die beim frontend-dev
liegt, und `cargo audit`, das beim Orchestrator liegt.

Parallel dazu: Offene Frage 3 als Zeile im Board, falls die Oberfläche die Feldnamenregel
anzeigen soll, und Offene Frage 4 als kleine Sammelaufgabe für S-05 und S-09.
