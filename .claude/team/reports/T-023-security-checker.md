# T-023 — Abschließende Sicherheitsprüfung

Rolle: security-checker. Datum: 2026-09-01, Welle 8.
Geprüfter Stand: acht Pakete, rund 40 000 Zeilen, OpenAPI mit 63 Operationen, laufender Dienst
auf `127.0.0.1:17843` und `127.0.0.1:17844`, gebaute Anwendung.

**Urteil: `Nacharbeit`.** Vier blockierende Punkte, sechs nicht blockierende Befunde.
Begründung und Einordnung unten; die Gegenprobe je Bedrohung steht in
`docs/bedrohungsmodell.md`, Abschnitt 12.

---

## 1. Welche Werkzeuge gelaufen sind — und welche nicht

Zuerst dieser Abschnitt, weil der Rest sonst mehr verspricht, als er hält.

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| **Semgrep CLI**, `p/default p/secrets p/typescript p/javascript p/nodejs p/sql-injection p/xss p/command-injection p/rust` | **ja** | 321 Ziele, 278 Regeln, **15 Befunde — keiner davon nach Prüfung echt.** Aufschlüsselung in Abschnitt 5. |
| **Semgrep CLI** über die Testverzeichnisse (die die Vorgabe-`.semgrepignore` auslässt) | **ja** | 42 Dateien, **0 Befunde** |
| **Semgrep Guardian** (SAST, Geheimnisse, Lieferkette) | **nein** | `Not logged into Semgrep Guardian.` Unverändert seit T-003. Es liegt **kein** Plattformergebnis vor, weder positiv noch negativ. |
| **`pnpm audit`** | **ja** | 182 Abhängigkeiten, **0 Verwundbarkeiten** in allen Schweregraden |
| **`cargo audit` / `cargo deny`** | **nein** | Beide **nicht installiert**. Der Rust-Baum ist **nie** gegen eine Schwachstellendatenbank geprüft worden. Befund S-07. |
| **42Crunch-Audit** | **nein** | `42c-ast` ist **nicht installiert** (`~/.42crunch` existiert nicht) und es liegt **keine Zugangsberechtigung** vor. Die Einrichtung verlangt Download **und** ein Konto bei 42Crunch. **Es existiert kein Auditwert und keine Bewertung gegen ein Security Quality Gate.** |
| **42Crunch-Scan** | **nein** | Hängt an demselben Programm und derselben Berechtigung. |
| `gitleaks`, `trufflehog` | **nein** | Weiterhin nicht auf dem Rechner |
| Ersatzprüfung der OpenAPI-Beschreibung von Hand | ja | 3060 Zeilen, gültiges YAML, 63 Operationen. Ergebnis in Abschnitt 6. **Ausdrücklich kein 42Crunch-Ergebnis.** |
| Angriffsreihe gegen den **laufenden** Dienst | ja | 21 Proben, alle wie entworfen abgewiesen |
| Eigene Angriffe durch den vollständigen HTTP-Stapel | ja | Notiz-Grenze (4 Wege), Nachweistrennung, Vorlagenmotor |
| Prüfpfade des Projekts | ja | 545 Vitest-Prüfungen + 269 Nachweisprüfungen (75 + 73 + 66 + 30 + 25), sämtlich grün |

**Zur Definition of Done, unbeschönigt.**

- „Semgrep ohne offene Befunde hoher Schwere" — **erfüllt**.
- „42Crunch-Audit über der Schwelle des Sicherheitsgates" — **nicht erfüllt und mit den
  vorhandenen Mitteln nicht erfüllbar.** Das ist kein Mangel der OpenAPI-Beschreibung, sondern
  eine Beschaffungsfrage. Der Auftrag zu T-023 sagte, `42crunch-audit` sei jetzt fahrbar; das
  trifft nicht zu, und ich führe es nicht als erfüllt. **Entscheidung des Orchestrators nötig:**
  Zugang beschaffen oder das Tor aus Abschnitt 8 des Bedrohungsmodells durch eine benannte
  Ersatzprüfung ersetzen.

**Zwei Einschränkungen der Semgrep-Aussage**, die dazugehören:
Teilparse-Fehler in vier Dateien (`packages/domain/src/index.ts:34`,
`packages/storage/src/index.ts:14`, `packages/storage/src/sqlite/paging.ts:40`,
`apps/web/src/lib/exportTemplateModel.ts:503`) — Teile davon sind **nicht analysiert** worden und
wurden von Hand gelesen. Und der YAML-Parser scheiterte an der OpenAPI-Datei; die Datei selbst
ist in Ordnung (PyYAML liest sie vollständig).

---

## 2. Befunde

Jeder Befund: Pfad, betroffene Bedrohung, Auswirkung, Gegenmittel, Rolle.

### S-01 — **blockierend, hoch** · Das Add-in-Token erreicht die vollen Fachrouten

**Pfad:** `apps/local-api/src/app.ts` (Zeilen 152–191, die Fachrouten hängen ohne
`requireCredential`), `apps/local-api/src/http/guards.ts:257` (`requireCredential`),
`apps/local-api/src/access/verifier.ts:79` (`RequiredCredential = 'any' | 'session'`).
**Bedrohung:** **B-2.10** (neu), B-2.9 Punkt 3, R-09, RR-1, E-009, E-045.
**Herkunft:** aus T-033 gemeldet, hier bestätigt und gemessen.

**Was gemessen wurde.** Ein echtes, über `tokens.rotate` erzeugtes Add-in-Token, **ohne** jedes
Sitzungsgeheimnis, gegen den zusammengesetzten Dienst:

```
GET   /todos/{id}/note        -> 200   der interne Vermerk im Klartext
PUT   /todos/{id}/note        -> 200   der Vermerk wird überschrieben
PATCH /settings               -> 200   exportDirectory auf einen frei gewählten Ordner gesetzt
POST  /export/runs            -> 201   Datei in genau diesem Ordner geschrieben
        Inhalt: [ { "Call": "TCK-000009", "Zeit": 1, "Notiz": "TGVpc3R1bmc=", "WindowsUser": "p" } ]
GET   /todos, /time-entries, /export/templates, POST /export/preview -> 200
GET   /token, POST /token, GET /security/notices                     -> 401  (diese drei halten)
```

**Auswirkung.** Das Add-in-Token ist das **dauerhafte** Geheimnis; sein Weg zum Benutzer führt
über Zwischenablage und Notizzettel (R-09), und es liegt im `localStorage` einer Herkunft, die in
einem von Microsoft gehosteten Webview lädt. T-019 hat dem Add-in genau deshalb eine schmale
Fläche aus vier Routen gegeben. Diese Trennung besteht heute nur in der Routenliste des Add-ins,
nicht im Dienst. Wer das Token hat, bekommt:

1. **den internen Vermerk** — die härteste Grenze des Projekts, gegen die Exportvorlage
   fünffach gebaut und in dieser Prüfung viermal erfolglos angegriffen (Abschnitt 3), und über
   eine gewöhnliche Leseroute offen;
2. **einen Abfluss sämtlicher offener Buchungen an einen selbst gewählten Ort**, in zwei
   Aufrufen, ohne Datenbankzugriff und ohne Kenntnis des Ablageorts;
3. **eine Abrechnungswirkung** — der Lauf markiert die Buchungen als exportiert, die Arbeit ist
   damit aus der echten Abrechnung heraus; `roundingMode` ist ohnehin frei änderbar.

**Der Kommentar ist mitbetroffen.** `app.ts` sichert im Kopf des Add-in-Blocks zu: „Kein Löschen,
kein Export, kein Zugriff auf den Vermerk eines fremden Todos, keine Einstellungen. … Ein
entwendetes Add-in-Token kommt genau so weit, wie diese Fläche reicht." Das ist falsch, und ein
Kommentar, der eine Sicherheitseigenschaft zusichert, die der Code nicht herstellt, ist ein
eigener Befund: Der nächste Leser prüft sie nicht nach, weil sie dasteht.

**Zu den beiden Fragen des Orchestrators:**

1. *Welche Routen darf ein Add-in-Token erreichen?* Genau den Zuschnitt aus T-019 —
   `/api/v1/addin/*`: Baum und Vorbelegungen lesen, nach einer Call-Nummer suchen, ein Todo
   anlegen, eine Zeit buchen. **Nichts darüber hinaus.** Insbesondere nicht
   `GET`/`PUT /todos/{id}/note`, nicht `/settings`, nicht `/export/*`, kein Löschen.
2. *Ist die Zusage falsch oder die Umsetzung?* **Die Umsetzung.** Der Entwurf ist richtig — er
   ist B-2.9 Punkt 3, und T-019 hat die schmale Fläche eigens dafür gebaut. Der Kommentar bleibt
   stehen, der Code holt ihn ein. Er wird nicht abgeschwächt.

**Gegenmittel.**
1. **Die Vorgabe umdrehen.** Die Kette verlangt für **alle** Routen `session`; ausschließlich der
   Teilbaum `/addin` senkt die Anforderung ausdrücklich auf `any`. Die heutige Richtung („alles
   offen, drei Ausnahmen") hat denselben Fehler wie eine Prüfung je Route: Die nächste neue
   Fachroute ist die vergessene — genau das Argument, mit dem B-1.1 Punkt 1 die Kette begründet.
2. Ein Prüfpfad über die **Routenliste des Dienstes**, nicht über eine von Hand gepflegte
   Aufzählung: jede registrierte Route außerhalb von `/addin` ergibt mit Add-in-Token 401,
   mit Sitzungsgeheimnis nicht. (Bedrohungsmodell Abschnitt 7, neue Prüfung 24.)

**Rolle:** domain-dev (`apps/local-api/src/app.ts`, `http/guards.ts`, `access/verifier.ts`),
unit-tester (Prüfung 24). Eigene Aufgabe; der domain-dev hat sie in T-033 richtigerweise nicht
nebenbei repariert.

---

### S-02 — **blockierend, mittel** · Vorlagenfeldnamen werden nicht geprüft (B-3.2)

**Pfad:** `packages/export/src/template.ts:99–101` (`validateExportTemplateField` prüft nur
„nicht leer"), `packages/export/src/template.ts:204–219` (kein Doppelnamenabgleich),
`packages/export/src/render.ts:127` (`const row: Record<string, ExportValue> = {}`).
**Bedrohung:** B-3.2 — Tor aus Abschnitt 8 für T-007. Prüfung 10 aus Abschnitt 7 (`TP-SEC-07`)
**existiert nicht**; die Zeichenkette `TP-SEC-07` kommt im gesamten Prüfbestand nicht vor.

**Was gemessen wurde** (direkt gegen `packages/export`):

```
validate("__proto__")     ok: true      validate("constructor") ok: true
validate("prototype")     ok: true      validate("a"×200)       ok: true
validate("<img src=x onerror=alert(1)>") ok: true
Duplikat zweier Felder namens "Call": angenommen

Feld "__proto__", Quelle mit Wert null  -> Zeile: {"Call":null,"Zeit":0.25}
                                           Prototyp der Zeile: null, Feld fehlt in der Ausgabe
Feld "__proto__", Quelle mit Zeichenkette -> Zeile: {}          (alles verschluckt)
Zwei Felder "Call"                        -> Zeile: {"Call":0.25}
                                           die Call-Nummer wurde still durch die Zeit ersetzt
```

**Auswirkung.** Kein Prototype Pollution im gefährlichen Sinn — das Zeilenobjekt ist lokal und
wird nur serialisiert. Aber: **stiller Feldverlust in der Abrechnungsdatei.** Ein konfiguriertes
Feld erscheint nicht, und im Doppelnamenfall wird die Call-Nummer durch die Zeit ersetzt, ohne
dass irgendwo ein Fehler entsteht. Genau die Wirkung, die B-3.2 vorhergesagt hat („im besten
Fall fehlt das Feld in der Ausgabe"). Mildernd: die Vorschau benutzt denselben Renderer, ein
aufmerksamer Benutzer sähe es. Nicht mildernd: B-3.2 verlangt die Abweisung **beim Speichern**,
und das ist die einzige Stelle, an der es niemandem auffallen muss.

**Gegenmittel.**
1. In `validateExportTemplateField` den Namen gegen `^[A-Za-z0-9_-]{1,64}$` prüfen und
   `__proto__`, `constructor`, `prototype` ausdrücklich abweisen.
2. In `validateExportTemplateDefinition` doppelte Namen über alle `fields` abweisen — nicht still
   zusammenführen.
3. In `render.ts` die Zeile über `Object.create(null)` aufbauen und erst zum Schluss
   serialisieren.
4. Prüfung 25 (Bedrohungsmodell Abschnitt 7) nachziehen.

**Rolle:** integration-dev (`packages/export/**`), unit-tester.

---

### S-03 — **blockierend, mittel** · Die Datenbankdateien liegen mit `0644`

**Pfad:** `apps/local-api/src/main.ts:70` (nur das Verzeichnis wird gesetzt),
`packages/storage/src/sqlite/database.ts:96` (`openConnection` setzt keinen Modus),
`packages/storage/src/sqlite/migration-runner.ts:379` (die `VACUUM INTO`-Sicherung ebenso wenig).
**Bedrohung:** B-7.2 Punkte 1–3 — Tor aus Abschnitt 8 für T-008. Prüfung 18 aus Abschnitt 7
deckt Tokendatei und Verzeichnis ab, die Datenbank **nicht**.

**Was gemessen wurde**, am laufenden Dienst und in einem eigenen Lauf:

```
drwx------  700  <appdata>/takt/            Verzeichnis korrekt
-rw-------  600  taskpane-key.pem           korrekt
-rw-------  600  taskpane-cert.pem          korrekt
-rw-r--r--  644  takt.db                    zu weit
-rw-r--r--  644  takt.db-wal                zu weit
-rw-r--r--  644  takt.db-shm                zu weit
-rw-------  600  takt-export-…json          korrekt (B-5.4 hält)
```

**Auswirkung.** Auf POSIX hält das Verzeichnis mit `0700` die Grenze — ein anderer Benutzer kommt
nicht hinein. Aber **der Modus wandert mit der Datei**: jede Kopie, jede Sicherung, jeder
Umzug in einen weiter gesetzten Ordner ist danach für jeden lesbar, und die Datenbank enthält
mehr als der Export, nämlich auch die internen Vermerke (A-7.2). Die `VACUUM INTO`-Sicherung des
Migrationsläufers erbt dasselbe. Unter Windows ist der POSIX-Modus bedeutungslos und die geerbte
ACL von `%LOCALAPPDATA%` trägt — das ist im Bericht zu T-011 als benannte Lücke geführt und
bleibt es. Verdächtig ist nicht die absolute Höhe des Risikos, sondern die **Ungleichbehandlung**:
Token und Zertifikat werden sorgfältig auf `0600` gesetzt, die Datei mit den Kundendaten nicht.

**Gegenmittel.**
1. Nach `openConnection` auf nicht-`win32` `chmod` auf `FILE_MODE` für die Datenbankdatei und —
   sobald sie entstanden sind — für `-wal` und `-shm`. Alternativ die `umask` des Sidecar-Prozesses
   beim Start auf `0o077` setzen; das erwischt alle drei und jede künftige Nachbardatei in einem
   Zug und ist die robustere Fassung.
2. Die `VACUUM INTO`-Sicherung ebenso.
3. `inspectPermissions` auf die Datenbank ausweiten und beim Start sichtbar warnen (B-7.2 Punkt 3).
4. Prüfung 26 nachziehen.

**Rolle:** domain-dev (`packages/storage/**`, `apps/local-api/src/main.ts`).

---

### S-04 — **blockierend, mittel** · Exportordner als Freitextfeld, ohne jede Rückfrage

**Pfad:** `apps/web/src/screens/SettingsScreen.tsx:149–158` (`TextField label="Exportordner"`),
`apps/local-api/src/routes/export.ts:76` (`exportDirectory: z.string().max(4096).nullish()`),
`packages/storage/src/sqlite/file-port.ts:50–74` (`checkExportDirectory` prüft nur: vorhanden,
Ordner, beschreibbar), `apps/desktop/src-tauri/capabilities/default.json` (kein `dialog`).
**Bedrohung:** B-5.1 Punkt 1, B-5.2 Punkte 1–3, B-5.3 Punkt 3 — Tor aus Abschnitt 8 für T-007.

**Auswirkung.** Der eigentliche Traversierungsschutz **hält** und ist belegt: der Dateiname wird
vom Dienst gebildet (`takt-export-JJJJMMTT-HHMMSS.json`, im Versuch beobachtet), der Zielpfad
wird gegen den aufgelösten Ordner geprüft, geschrieben wird unteilbar mit `0600`. Was fehlt, ist
die ganze **Warnschicht** darüber:

- Kein Ordnerauswahldialog. Der Benutzer tippt den Pfad; der Platzhalter lautet `C:\Takt\Export`.
- **Keine Erkennung von UNC-Pfaden und Netzlaufwerken** und damit keine Rückfrage. Ein
  `\\server\freigabe` wird stillschweigend angenommen — Kundennotizen verlassen den Rechner,
  bei einem Produkt, dessen erste Entscheidung E-001 lautet. B-5.2 Punkt 2 sagt ausdrücklich:
  „Nicht verbieten … aber niemals stillschweigend zulassen."
- **Keine Heuristik auf OneDrive, Dropbox, Google Drive, Nextcloud** (B-5.3 Punkt 3). Die Suche
  nach diesen Zeichenketten liefert im gesamten Baum keinen Treffer.
- **Keine Abweisung von Systemverzeichnissen** (B-5.2 Punkt 1).
- **Keine Erreichbarkeitsprüfung mit Zeitgrenze** (B-5.2 Punkt 3); `stat` und `access` auf einer
  toten Freigabe blockieren bis zur 15-Sekunden-Grenze der Anfrage.
- Keine `realpath`-Auflösung gegen einen Verknüpfungspunkt als Zielordner (B-5.1 Punkt 4).

Zusammen mit **S-01** ergibt das den scharfen Fall: ein Aufrufer mit dem Add-in-Token setzt den
Ordner und löst den Lauf aus. Ohne S-01 bleibt es der stille Fehlgriff des Benutzers, den B-5.2
und B-5.3 verhindern sollten.

**Gegenmittel.**
1. Fähigkeit `dialog:allow-open` in `capabilities/default.json`, Ordnerwahl über den Dialog des
   Betriebssystems, das Feld in S-09 nur noch anzeigend.
2. `checkExportDirectory` um die Einordnung erweitern: `unc`, `network`, `sync_folder`,
   `system_dir` als eigene Rückgaben; S-09 und S-07 verlangen für die ersten drei eine
   ausdrückliche Bestätigung mit dem Satz aus B-5.2 Punkt 2, für die vierte eine Abweisung.
3. Erreichbarkeits- und Schreibprüfung mit Zeitgrenze (Vorschlag 3 s), **bevor** eine Buchung
   angefasst wird.

**Rolle:** frontend-dev (S-09, S-07), domain-dev (`packages/storage/src/sqlite/file-port.ts`),
Orchestrator (Tauri-Fähigkeit).

---

### S-05 — niedrig · `Math.random` in der Zertifikatserzeugung

**Pfad:** `apps/local-api/src/taskpane/certificate.ts:113–117`.
**Bedrohung:** B-2.1 Punkt 1 („Ausdrücklich nicht: `Math.random`"), E-046.

```js
const serial = Buffer.alloc(16);
for (let index = 0; index < serial.byteLength; index += 1) {
  serial[index] = Math.floor(Math.random() * 256);
}
```

**Auswirkung.** Die Seriennummer eines X.509-Zertifikats ist kein Geheimnis, aber sie trägt eine
Sicherheitsaufgabe: Das CA/Browser-Forum verlangt mindestens 64 Bit aus einer kryptographisch
geeigneten Quelle, damit ein Angreifer den signierten Inhalt nicht auf eine Kollision hin
vorbereiten kann. Bei einem selbst signierten SHA-256-Zertifikat für `localhost`, das in keiner
Kette hängt, ist die praktische Auswirkung nahe null. Der Befund steht trotzdem: Es ist die
einzige Stelle im Projekt, an der ein Zertifikat entsteht, und die eigene Regel ist dort gebrochen.
`node:crypto` ist in derselben Datei bereits eingebunden.

**Gegenmittel.** `randomBytes(16)` statt der Schleife; das oberste Bit weiter maskieren.
**Rolle:** domain-dev.

---

### S-06 — niedrig · `PRAGMA trusted_schema = OFF` fehlt

**Pfad:** `packages/storage/src/sqlite/database.ts:80–89` (`CONNECTION_PRAGMAS`).
**Bedrohung:** B-7.4 Punkt 4.

Gesetzt sind `journal_mode=WAL`, `foreign_keys=ON`, `synchronous=FULL`, `busy_timeout`,
`defer_foreign_keys=OFF`. `trusted_schema` fehlt. Erweiterungen sind im Treiber
(`node:sqlite`, `DatabaseSync`) standardmäßig aus, `ATTACH` wird nirgends benutzt, und
doppelte Anführungszeichen als Zeichenketten sind ebenfalls standardmäßig aus — die
Ausnutzbarkeit ist damit sehr gering. Eine Zeile.

**Gegenmittel.** `'PRAGMA trusted_schema = OFF;'` in die Liste.
**Rolle:** domain-dev.

---

### S-07 — niedrig · `cargo audit` / `cargo deny` laufen nicht

**Bedrohung:** B-10.4 Punkt 2.
Weder installiert noch im Prüfablauf. Der Rust-Baum (`tauri 2`, `tauri-plugin-shell`,
`tauri-plugin-single-instance`, `getrandom`, `libc`, `serde`, `serde_json`) ist **nie** gegen eine
Schwachstellendatenbank geprüft worden. Die Fassungen stehen als Bereiche (`"2"`, `"1"`, `"0.3"`)
und sind nur durch das mitversionierte `Cargo.lock` festgenagelt — das trägt, aber es ersetzt
keine Prüfung.

**Gegenmittel.** `cargo install cargo-audit`, Aufruf in `pnpm check` aufnehmen.
**Rolle:** Orchestrator.

---

### S-08 — niedrig · Base64-Hinweis fehlt an der Stelle, an der er zählt

**Bedrohung:** B-6.1 Punkte 1, 2, 4.
Vorhanden: der Satz in der Vorlagen-Vorschau (`apps/web/src/screens/TemplatePreview.tsx:431`) und
ein eigener Abschnitt im Benutzerhandbuch (Zeile 147). Fehlt: der stehende Satz in **S-07 neben
dem Exportziel** (B-6.1 Punkt 1 verlangt ihn ausdrücklich „nicht in einem Hilfetext, sondern in
der Ansicht"), der einmalige Bestätigungsdialog beim ersten Export in einen neu gewählten Ordner
(Punkt 2) und das Aufräumangebot „Exportdateien älter als N Tage löschen" (Punkt 4).
**Rolle:** frontend-dev (S-07), integration-dev (Aufräumfunktion).

---

### S-09 — niedrig · OpenAPI: `500` und `429` fehlen, nichts ist geschlossen

**Pfad:** `apps/local-api/openapi/takt-local-api.yaml`. Zahlen in Abschnitt 6.
Die echte Abweichung ist `500`: `app.onError` liefert `internal_error`, und keine der 63
Operationen beschreibt diese Antwort. Ein Konformitätsscan meldete sie als „nicht im Vertrag".
Alles andere ist Vertragshygiene, weil zod zur Laufzeit strenger ist als die Beschreibung.
**Rolle:** domain-dev.

---

### S-10 — niedrig, Hinweis · CSP `style-src 'unsafe-inline'`

**Pfad:** `apps/desktop/src-tauri/tauri.conf.json`, `app.security.csp`.
**Bedrohung:** B-10.4 Punkt 4 („Kein `unsafe-inline`, kein `unsafe-eval`").
Nicht ausnutzbar: `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`,
`form-action 'none'`, und im gesamten Baum kommt **keine** HTML-Senke vor (nachgesehen:
`dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, `insertAdjacentHTML`,
`eval`, `new Function` — null Treffer in `apps/web`, `apps/outlook-addin`, `packages/**`).
Gebraucht wird es für `style={{…}}` in einer Handvoll Bausteinen.
**Entweder** die verbleibenden Inline-Stile in Klassen überführen und den Eintrag streichen,
**oder** ihn als benannte Ausnahme im Bedrohungsmodell führen. Was nicht geht: ihn stehen lassen,
ohne dass es irgendwo steht.
**Rolle:** frontend-dev, Orchestrator.

---

### Hygienehinweis ohne Befundnummer

Der Prüfaufbau der End-zu-End-Strecke reicht das Startgeheimnis über eine FIFO in `/tmp` mit
Rechten `prw-r--r--` an den Dienst. Auf einem geteilten Rechner könnte ein anderer Benutzer sie
zum Lesen öffnen. Kein Produktivpfad, aber `0600` kostet nichts. **Rolle:** e2e-tester.

---

## 3. Die Notiz-Trennung — vier Angriffe, alle abgewehrt

Das ist die härteste Grenze des Projekts, und sie hat gehalten. So wurde geprüft: ein Todo mit
dem Vermerk `GEHEIMER-INTERNER-VERMERK-Kunde-Meier-Kuendigung`, eine abgeschlossene Buchung mit
dem Leistungstext `abrechenbare Leistung`, und die Angriffe durch den **vollständigen** HTTP-
Stapel über `app.fetch` — dieselbe Kette, die der Adaptor-Server bedient, mit echter SQLite
dahinter.

1. **Vorlage über die Route.** 17 Schreibweisen: `todo.note`, `todo.notiz`, `todo.vermerk`,
   `todo.Note`, `todo.NOTE`, `todo.body`, `todo.noteBody`, `todo['note']`, `todo\u006eote`,
   `note`, `__proto__`, `constructor.prototype.note`, `todo..note`, `" todo.note "`,
   `entries.0.todoNote`, `group.note`, `group.entries.0.bookingNote`.
   **Alle 17: `422 export_source_forbidden`.**
2. **Vorschau mit ungespeicherter Vorlage** (E-051 — der Weg, der die Speicherung umgeht).
   `todo.note` → 422. Gegenprobe `group.bookingNotes` → 200, Vermerk nicht enthalten.
3. **An Oberfläche und Route vorbei direkt in SQLite.** `INSERT INTO export_template` mit
   `{"source":"todo.note","transformation":"base64"}`, danach der Dienst neu aufgesetzt, damit er
   die manipulierte Datei liest. Vorschau **422**, Exportlauf **422**, **keine Datei** im
   Exportordner, **keine** Buchung markiert (`exportStatus` bleibt `open`). Der Lauf bricht ab,
   statt das Feld still auszulassen — genau die Forderung aus B-3.1 Punkt 4.
4. **Über die eingebaute Vorlage und über jede Leseroute.** Vorschau, `GET /todos`,
   `GET /todos/{id}`, `GET /search`, `GET /time-entries`, `GET /addin/context`,
   `GET /addin/todos` — der Vermerk kommt **weder im Klartext noch base64-kodiert** vor. Die
   geschriebene Datei enthält den Leistungstext, nicht den Vermerk.

**Warum sie hält, in fünf voneinander unabhängigen Schichten:** die SQL-Sicht
`v_export_candidate` führt die Spalte nicht (Migration 0001, Zeile 351); `ExportCandidate` und
`ExportGroup` haben kein Feld und keinen Verweis darauf; die Typbehauptungen
`ExportGroupHasNoTodoNote`, `NoSourceIsCalledPlainNote` und `NoteBoundaryIsSealed` binden das an
den Übersetzer; `readExportSource` ist ein `switch` mit zwölf ausgeschriebenen Zweigen und
**keinem** Pfadauflöser; `validateExportTemplateDefinition` gleicht wörtlich gegen die
geschlossene Liste ab, ohne jede Normalisierung, und läuft beim Speichern **und** bei jedem Lauf.
Das ist der Unterschied zwischen „nicht vorgesehen" und „nicht möglich", den B-3.1 verlangt hat.

**Und die Bresche liegt woanders.** Sie führt nicht durch die Vorlage, sondern am ganzen Apparat
vorbei: `GET /todos/{id}/note` gibt den Vermerk einem Add-in-Token heraus (S-01). Fünf Schichten
schützen ihn vor dem Export — und keine vor dem Nachweis. Eine Grenze ist so stark wie ihr
schwächster Zugang, und der lag nicht dort, wo alle hingesehen haben.

---

## 4. Der Prüfpfad des Dienstes — am laufenden Prozess gemessen

21 Proben gegen `127.0.0.1:17843`, im Betrieb, ohne Token. Alle wie entworfen:

| Probe | Gemessen |
|---|---|
| `GET /health` ohne Token | **401** — `/health` liegt hinter dem Nachweis und verrät nicht einmal, dass Takt läuft |
| `GET /todos`, `GET /token`, `POST /token` ohne Token; falsches Token | **401**, gleicher Text |
| `Host: evil.example:17843` · `Host: 127.0.0.1` ohne Port | **403** (B-1.3) |
| `Host: 127.0.0.1:17843.evil.example` | **400** |
| `Origin: https://evil.example` · `http://tauri.localhost.evil.example` · `null` | **403** — die Präfixfalle greift nicht (B-1.4) |
| `POST` `text/plain` mit fremder Herkunft | **403** vor jeder Wirkung (B-1.2) |
| `POST` `x-www-form-urlencoded` ohne Herkunft | **415** |
| `Sec-Fetch-Mode: navigate` · `Sec-Fetch-Site: cross-site` | **403** |
| `GET /health?token=takt_…` | **400** `token_in_url`, Vorfall in den Meldungen, Wert nicht wiederholt |

Die Protokollzeilen des Laufs tragen ausschließlich `ts`, `level`, `method`, `path` (ohne
Abfrageteil), `status`, `durationMs`, `outcome` — kein Kopfzeilenwert, kein Rumpf, kein
`takt_`-Treffer im gesamten Protokoll.

Der Nachweispfad selbst wurde im Code nachgelesen und ist richtig gebaut: beide Seiten über
SHA-256, `timingSafeEqual`, **beide** Vergleiche werden immer ausgeführt (bitweises ODER statt
`||`, damit der Kurzschluss keinen Zeitkanal öffnet), keine vorgezogene Längen- oder Formprüfung,
eine fehlende Kopfzeile nimmt denselben Weg wie eine falsche. Nebenbei belegt: eine
Neuerzeugung machte in einer Prüfreihe das vorher erzeugte Token augenblicklich ungültig — B-2.7
ohne Nachfrist.

**Was das nicht zeigt, und ausdrücklich gesagt gehört:** Diese Reihe wirkt gegen A-02, die fremde
Webseite. Gegen A-03, einen lokalen Prozess, ist sie wirkungslos — B-2.9 sagt es, und
`origin-policy.ts` wiederholt es im Dateikopf. Der einzige Riegel gegen A-03 ist das Token, und
S-01 zeigt, wie weit dieses Token heute trägt.

---

## 5. Semgrep — die 15 Befunde einzeln

| Schwere | Regel | Ort | Einordnung |
|---|---|---|---|
| ERROR ×2 | `react-insecure-request` | `apps/desktop/scripts/verify-sidecar.mjs:228,233` | **Falschmeldung.** `fetch('http://127.0.0.1:17843/health')` in einem Bauprüfskript. HTTP auf Loopback ist E-043 und dort begründet. |
| INFO ×7 | `rust.unsafe-usage` | `src-tauri/src/identity.rs`, `appdata.rs` | **Erwartet.** Die einzigen `unsafe`-Blöcke sind die FFI-Aufrufe `GetUserNameW`, `GetUserNameExW`, `getpwuid` — genau die Betriebssystemschnittstelle, die B-8.1 anstelle der Umgebungsvariablen fordert. Jeder trägt einen `SICHERHEIT:`-Kommentar. |
| WARNING ×4 | `detect-non-literal-regexp` | `outlook-addin/src/callnumber/pattern.ts:121,295,329`, `run.ts:27` | **Das Merkmal, nicht der Fehler.** A-10.8 legt den Ausdruck in die Benutzerhand; B-4.1–4.4 sind dafür da und sind umgesetzt. |
| WARNING ×1 | `detect-non-literal-regexp` | `local-api/src/access/origin-policy.ts:174` | Neuaufbau aus einer **Konstante des Codes**, um `lastIndex` zu vermeiden (B-4.4). Keine fremde Eingabe. |
| WARNING ×1 | `missing-integrity` | `outlook-addin/index.html:49` | `office.js` ohne SRI. **Bekannt und unvermeidbar** — B-10.6 und RR-6 führen es als ausgesprochene Einschränkung von E-001. |

Zusätzlich 42 Testdateien separat gescannt: **0 Befunde**.

---

## 6. OpenAPI — Ersatzprüfung von Hand (kein 42Crunch-Ergebnis)

3060 Zeilen, OpenAPI 3.1.0, gültiges YAML, 63 Operationen.
**Gut:** 0 Operationen ohne `security`, ohne `401`, ohne `403`, ohne irgendeine 4xx-Antwort,
ohne `operationId`. `apiKey` in einer eigenen Kopfzeile, kein `Authorization`, keine Cookies —
mit Begründung in der Beschreibung selbst.

| Punkt | Zahl | Einordnung |
|---|---|---|
| ohne `500`/`default` | 63 | **Echte Abweichung** — `app.onError` liefert 500 `internal_error` |
| ohne `429` | 63 | Der Dienst verzögert statt 429 zu senden (B-2.6). Entweder einführen oder in der Beschreibung nennen |
| Objekte ohne `additionalProperties: false` | 130 | Laufzeit unkritisch (zod verwirft unbekannte Schlüssel), aber `.strict()` kommt in keinem der 30 `z.object(…)` vor |
| Zeichenketten ohne `maxLength` | 30 | Laufzeit begrenzt (500 / 20 000 / 64 / 200 …), Vertrag schweigt |
| Felder ohne `maxItems` | 41 | dito (200 / 20 000 / 100) |
| Zahlen ohne Grenzen | 22 | dito (`limit` 1–200) |

Die **Beschreibung ist nicht der Grund**, warum das 42Crunch-Tor offen bleibt. Das Werkzeug ist es.

---

## 7. Repository-Hygiene

Das Repository ist weiterhin **nie committet** worden. Die `.gitignore` steht damit **vor** dem
ersten Commit — die Reihenfolge aus B-11.2 ist eingehalten, und das war der eigentliche Inhalt
dieses Gegenmittels. Sie deckt `node_modules/`, `dist/`, `target/`, `*.db*`, `*.sqlite*`,
`exports/`, `*.pem`, `*.key`, `token`, `*.token`, `addin-token*`, `*.log`, `coverage/`,
`playwright-report/`, `test-results/`, dazu `*.db.bak` und `takt-export*.json`.
`pnpm-lock.yaml` und `Cargo.lock` sind ausdrücklich nicht ausgenommen. Das gebündelte
Sidecar-Binärprogramm (125 MB) ist über `apps/desktop/.gitignore` ausgenommen.

Gesucht über alle **357** Dateien, die ein `git add -A` aufnähme:

- **Geheimnisse:** zehn `takt_…`-Treffer, sämtlich in `apps/outlook-addin/scripts/proof-addin.mjs`
  und sämtlich erkennbar erfunden (`takt_AAAA…`, `takt_BBBB…`). Richtige Bauform: formgültig,
  damit der Prüfpfad etwas prüft, und auf den ersten Blick als Attrappe erkennbar.
- **E-Mail-Adressen:** zwei, beide auf `example.org` / `example.com`.
- **Call-Nummern:** `TCK-000042`, `TCK-000815`, `TCK-999999`, `INC0004711`, `CALL-2026` —
  erkennbar erfunden. Offene Frage 6 (Nummernraum vom Auftraggeber bestätigen) ist damit
  praktisch entschärft, formal weiter offen.
- **Kundennamen, Schlüsseldateien, `.env`:** keine.

**Urteil: sauber**, und anders als in T-003 ist die Aussage belastbar, weil es Code gibt.

---

## 8. Neu seit T-003, hier zum ersten Mal geprüft

**Das selbst erzeugte X.509-Zertifikat (E-046).** RSA-2048, SHA-256, `basicConstraints` kritisch
und ohne CA-Recht, `keyUsage` kritisch, `extKeyUsage` nur `serverAuth`, `subjectAltName` mit
`localhost` **und** `127.0.0.1`, 825 Tage, Erneuerung 14 Tage vorher, Schlüssel und Zertifikat
**mit 0600 gemessen**, Zugehörigkeit über `checkPrivateKey` geprüft. Ein Mangel: S-05.

**Der Aufgabenbereich-Port 17844.** Nur statische Dateien, gebunden auf `127.0.0.1`,
**Positivliste** der Endungen (eine versehentlich im Bündelordner liegende `.pem` oder `.db`
ginge nicht hinaus), Auflösung gegen die Wurzel mit `root + sep` — die Form des Präfixvergleichs,
die B-5.1 Punkt 3 zulässt und die die `C:\Export-Geheim`-Falle nicht hat. Keine
`realpath`-Auflösung, also folgte eine symbolische Verknüpfung **innerhalb** des Bündelordners
nach außen; geringes Gewicht, weil der Ordner zum Auslieferungsbestand gehört. Der Kommentar über
kodierte Trenner beschreibt mehr, als der Code prüft — die Auflösung trägt es trotzdem, aber der
Kommentar sollte sagen, was der Code tut.

**Migration 0006 und `markNotBilled` (E-047). Kein Befund.** Der Tabellenumbau folgt dem
vorgeschriebenen Weg; die Marke `-- takt: foreign_keys=off` **verschiebt** die
Fremdschlüsselprüfung, statt sie wegzulassen — nach dem letzten Befehl und vor dem Festschreiben
läuft `PRAGMA foreign_key_check` über den ganzen Bestand. Die Anhänge-Trigger auf `export_audit`
werden wortgleich wiederhergestellt, und zwischen `DROP` und `CREATE` liegt keine Zeile
ungeschützt, weil alles in einer Transaktion läuft. Der neue CHECK ist gleich streng wie der alte
und macht `not_billed` an seiner **Belegfreiheit** erkennbar, nicht am Namen — eine Zeile mit
`export_run_id` kann kein `not_billed` sein und umgekehrt. `trg_time_entry_exported_needs_provenance`
verlangt für einen Statuswechsel ohne Lauf die **jüngste** Protokollzeile `not_billed`; `IS NOT`
statt `<>` ist richtig gewählt, weil die Unterabfrage ohne jede Protokollzeile NULL liefert. Die
Sortierung `occurred_at DESC, id DESC` ist eindeutig, weil die Kennungen UUIDv7 aus `node:crypto`
sind und damit zeitgeordnet.

**Die Lieferkettenschalter in `pnpm-workspace.yaml`. Kein Befund.** `minimumReleaseAge: 10080`
(sieben Tage), `trustPolicy: no-downgrade`, `blockExoticSubdeps: true`, `strictDepBuilds: true`,
`allowBuilds` nur `esbuild`. Die beiden `trustPolicyExclude`-Einträge sind begründet und tragen:
`undici-types` und `semver@6.3.1` enthalten kein Lebenszyklus-Skript und können weder zur
Installations- noch zur Laufzeit etwas ausführen.

---

## 9. Was besser gebaut ist, als dieses Bedrohungsmodell verlangt hat

Weil ein Prüfbericht, der nur Mängel nennt, ein falsches Bild vom Zustand gibt:

- **Das Token liegt nur als Abdruck auf der Platte.** B-2.2 hatte den DPAPI-Rückweg als
  verträgliche Alternative angeboten. Er wurde nicht gebraucht: Der Klartext steht genau einmal
  auf dem Bildschirm und ist danach nicht wieder abrufbar. Dienstseitig gibt es kein
  wiederherstellbares Geheimnis.
- **`node:sqlite` statt `better-sqlite3` (E-035).** Das war die längste Lieferkette des Projekts —
  natives Modul, Vorabbau aus einer GitHub-Veröffentlichung, Prüfsumme, Neubau je Node-Fassung.
  Sie ist ersatzlos gestrichen, nicht abgesichert.
- **Im Abrechnungspfad steht kein fremder Code.** `packages/domain` hat **null**
  Laufzeitabhängigkeiten; `packages/export` und `packages/storage` hängen ausschließlich an
  `@takt/domain`. B-10.7 hatte Disziplin verlangt; das hier ist mehr.
- **Die Tauri-Fähigkeiten sind zwei Zeilen.** `core:default` und
  `core:window:allow-start-dragging`. Kein `fs`, kein `shell`, kein `http` für den Webview, kein
  Aktualisierungsdienst, `withGlobalTauri: false`, `assetProtocol.enable: false`.
- **Der reguläre Ausdruck ist so abgesichert, wie es in JavaScript geht.** Ein Worker je
  Auswertung, harte Grenze 100 ms mit `terminate()`, **getrennte** Startfrist (damit die Grenze
  die Auswertung misst und nicht den Worker-Start), 20 000 Zeichen, Erfassungsgruppe erzwungen,
  Leertreffer abgelehnt, Rückverweise und Rückschau abgelehnt. Die Heuristik gegen
  Rückzugsverhalten habe ich mit 14 bekannten bösartigen Mustern beschossen; sie fängt elf und
  lässt drei durch, darunter `(.*a){20}b` mit 3,8 s bei 28 Zeichen. **Das ist der entworfene
  Fall** — die Datei sagt selbst, dass sie eine Heuristik und kein Beweis ist, und die harte
  Zeitgrenze fängt, was sie durchlässt. Kein Befund.

---

## 10. Urteil

**`Nacharbeit`.**

Blockierend:

| | Befund | Bedrohung | Rolle |
|---|---|---|---|
| 1 | **S-01** — das Add-in-Token erreicht die vollen Fachrouten: liest und überschreibt den internen Vermerk, setzt den Exportordner, löst einen Exportlauf aus | B-2.10 (neu), R-09, RR-1 | domain-dev |
| 2 | **S-02** — Vorlagenfeldnamen ungeprüft, stiller Feldverlust in der Abrechnungsdatei | B-3.2 (Tor T-007) | integration-dev, unit-tester |
| 3 | **S-03** — Datenbankdateien mit `0644` | B-7.2 (Tor T-008) | domain-dev |
| 4 | **S-04** — Exportordner als Freitextfeld ohne jede Rückfrage | B-5.1, B-5.2, B-5.3 (Tor T-007) | frontend-dev, domain-dev |

Nicht blockierend: S-05 bis S-10.

**Und ein Punkt, der niemandem im Team gehört:** Das 42Crunch-Tor aus Abschnitt 8 des
Bedrohungsmodells ist **nicht einlösbar**, solange kein Zugang beschafft wird. Es als erfüllt zu
führen wäre die eine Sorte Fehler, die dieses Modell seit seinem Abschnitt 0 zu vermeiden
versucht. Der Orchestrator entscheidet: beschaffen oder ersetzen.

**Gepflegte Dateien:** `docs/bedrohungsmodell.md` (Abschnitt 0 fortgeschrieben, Bedrohung B-2.10
neu, Prüfungen 24–26 in Abschnitt 7, Nachtrag zu Abschnitt 8, Abschnitt 11 neu gefasst,
Abschnitt 12 neu) und dieser Bericht. Sonst nichts — Befunde behebe ich nicht selbst.
