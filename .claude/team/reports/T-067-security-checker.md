# T-067 — Prüfung vor der Veröffentlichung

Rolle: security-checker. Datum: 2026-09-02.
Geänderte Dateien: `.gitignore`, `docs/bedrohungsmodell.md` (Abschnitte 0, 5.11, 11, neu 13),
dieser Bericht. Sonst nichts. Nicht committet, nicht gepusht, kein Remote.

---

## Urteil

**Nacharbeit** — mit **einem** offenen Punkt, der beim Auftraggeber liegt.

*Nachtrag vom Nachmittag des 2026-09-02, zweimal nachgezogen:* Von den ursprünglich drei
Blockern sind **zwei behoben und von mir im Code nachgesehen** — `Math.random` (T-066) und die
Lizenzangabe in `Cargo.toml`. **Es bleibt einer**, und er liegt nicht bei einem Programmierer,
sondern beim Auftraggeber: die absoluten Pfade in `.claude/settings.json` (V-3). Der
ursprüngliche Wortlaut steht durchgestrichen daneben, wo er für das Verständnis zählt.

**Damit lautet das Urteil: ein offener Blocker, und er ist eine Entscheidung, keine Arbeit.**

Die vertraulichkeitsrelevante Frage — *steht im Baum etwas, das nicht öffentlich werden darf?* —
ist mit **nein** beantwortet. Über alle 473 Dateien: keine Zugangsdaten, kein Schlüsselmaterial,
keine Kundendaten, keine echte Call-Nummer, keine echte E-Mail-Adresse, keine Adresse ausserhalb
des Loopback, kein fremder Urheberrechtshinweis. Wäre nur das die Frage, hiesse das Urteil
**veröffentlichungsreif**.

Die ursprünglich drei blockierenden Punkte waren nicht Vertraulichkeit, sondern Richtigkeit —
zwei davon entstanden erst durch die MIT-Lizenz und die Veröffentlichung. **Zwei sind am
2026-09-02 behoben und von mir im Code nachgesehen; einer ist offen:**

| Rang | Befund | Datei | Wer |
|---|---|---|---|
| ~~1~~ | ~~Widersprüchliche Lizenzangabe: `UNLICENSED` gegen MIT~~ — **behoben (2026-09-02), nachgesehen:** `license = "MIT"`, mit Begründung im Kommentar, dass `publish = false` daran nichts ändert. | `apps/desktop/src-tauri/Cargo.toml` | erledigt |
| 2 | Zwölf absolute `/home/kerem`-Pfade — beim Klon greift keine Regel, auch keine `deny`-Regel | `.claude/settings.json` | Auftraggeber |
| ~~3~~ | ~~`Math.random` für einen Zertifikatswert~~ — **behoben (T-066), nachgesehen.** `const serial = randomBytes(16);`, `randomBytes` in der `node:crypto`-Einfuhr, oberstes Bit fällt weiterhin (RFC 5280). | `apps/local-api/src/taskpane/certificate.ts` | erledigt |

Keiner davon ist meine Datei — deshalb sind sie als Befunde formuliert und nicht als
Änderungen. Der verbliebene Punkt 2 ist vor dem ersten Commit zu **entscheiden**, nicht zu
arbeiten: Er liegt beim Auftraggeber, weil der Klassifizierer `.claude/settings.json` gegen
Schreibzugriff sperrt, seit die Datei ein Berechtigungsschema führt. Das ist die richtige
Sperre; sie verlagert den Befund nur, statt ihn zu lösen.

---

## Was tatsächlich gelaufen ist

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI, `p/secrets p/security-audit p/typescript p/owasp-top-ten` | **ja** | 12 442 Ziele, **4 Befunde**, keiner hoher Schwere, alle vier nach Prüfung unecht. Aus `p/secrets` **null** Treffer. |
| Semgrep Guardian (SAST / Geheimnisse / Lieferkette) | **nein** | `Not logged into Semgrep Guardian.` Erneut versucht, erneut abgewiesen. Unverändert seit T-003. |
| 42Crunch-Audit / -Scan | **nein** | `42c-ast` nicht installiert, `~/.42crunch` existiert nicht, keine Zugangsberechtigung. Die OpenAPI liegt vor (188 KB, 44 Pfade) — es fehlt allein das Werkzeug. **Es gibt keinen Auditwert.** |
| `gitleaks` / `trufflehog` | **nein** | Nicht auf dem Rechner. Ersetzt durch Mustersuchen von Hand über alle 473 Dateien. |
| Playwright-Berichte entpackt und gelesen | **ja** | Eingebettete ZIP ausgepackt, 15 JSON-Dateien durchgesehen. |
| Lizenzabgleich über den aufgelösten pnpm-Speicher | **ja** | 210 Pakete. |
| Nachprüfung der vier T-023-Blocker im Code | **ja** | Alle vier behoben. |

Drei der vier vorgesehenen Werkzeuge dieser Rolle haben in diesem Projekt nie ein Ergebnis
geliefert. Das steht seit T-003 im Bedrohungsmodell und wird hier wiederholt, weil ein nicht
gelaufenes Werkzeug sonst mit der Zeit als bestandene Prüfung gelesen wird.

---

## 1. Der Umfang, gemessen

`git status --porcelain -uall`: **476 Einträge** vor der Ergänzung der `.gitignore`, **473**
danach. Die Differenz sind exakt die sechs Berichtsordner (minus, `LICENSE` kam dazu). Keine
legitime Datei ist mitverschwunden — nachgesehen mit `diff` über beide Listen.

*Der Zählstand ist eine Momentaufnahme vom 2026-09-02 gegen 10 Uhr.* Der domain-dev arbeitet
parallel; bei der letzten Gegenprobe standen 474 Einträge, weil dort eine Datei hinzugekommen
ist. Alle Aussagen dieses Berichts beziehen sich auf die geprüften 473. Wer zwischen dieser
Prüfung und dem ersten Commit noch Dateien hinzufügt, muss die Mustersuche aus Abschnitt 3
über die neuen Dateien wiederholen — das ist der Preis dafür, dass der erste Commit die
Veröffentlichung ist.

Verteilung: `apps/` 240, `packages/` 105, `.claude/` 80, `tests/` 27, `docs/` 8, Rest an der
Wurzel. Dateiarten: 191 `.ts`, 94 `.md`, 73 `.tsx`, 31 `.mjs`, 24 `.json`, 18 `.sql`, 16 `.png`,
7 `.rs`, 6 `.html`, 6 `.css`.

---

## 2. Die sechs Berichtsordner — angesehen, dann ignoriert

**Befund V-1, behoben.** `playwright-report-e2e/`, `-web-build/`, `-outlook-build/` und die drei
`test-results-*` fielen durch die Regeln `playwright-report/` und `test-results/`, weil sie ein
Suffix tragen. Die vier Playwright-Konfigurationen unter `tests/e2e/` erzeugen sie so.

**Vor dem Ausschluss ausgepackt und gelesen.** Jede der vier `index.html` trägt ein
`data:application/zip;base64`-Anhängsel mit 1 bis 11 JSON-Dateien.

Deine Beschreibung stimmt an diesem Punkt **nicht** — und das ist die gute Nachricht:

| Erwartet | Tatsächlich |
|---|---|
| Bildschirmfotos | **keine.** In keiner der 15 JSON-Dateien ist ein `attachments`-Feld belegt. |
| Ablaufaufzeichnungen | keine |
| Antwortkörper aus Testläufen | keine |
| Pfade mit Benutzernamen | keine (`/home/`, `C:\Users` — null Treffer) |
| E-Mail-Adressen, Call-Nummern | keine |

Das eine eingebettete PNG je Bericht ist in allen vier **byteweise identisch**
(SHA-256 `9390701c…`, 68 036 Bytes) — der Werbe-Bildschirmschuss des Playwright-Trace-Viewers,
ein Bestandteil des Berichterstatters. Angesehen: er zeigt eine Playwright-Oberfläche mit einer
GitHub-Suche, kein Takt.

Was drinsteht: deutsche Testtitel, Dateinamen und Zeilennummern der Spezifikationen, Laufzeiten,
Quelltextausschnitte aus eben diesen Spezifikationen — die ohnehin mitveröffentlicht werden.

**Also kein Befund über die Testdaten.** Der Ausschluss bleibt trotzdem richtig, aus einem
Grund, der mit diesem Lauf nichts zu tun hat: Ein Bericht ist ein Abbild seines Laufs. Läuft die
Reihe einmal gegen einen echten Bestand, oder schlägt ein Fall fehl und Playwright hängt
Bildschirmfoto und Aufzeichnung an, steht im selben Ordner etwas völlig anderes. Die Regel muss
vor diesem Lauf stehen.

### Was ich an der `.gitignore` geändert habe

Ergänzt am Ende, mit Begründung im Kommentar:

```
playwright-report*/
test-results*/
blob-report*/
coverage*/
/Export/
/export/
```

`coverage*/` und `blob-report*/` sind Vorsorge gegen dieselbe Sorte Lücke, die noch nicht
eingetreten ist. Die allgemeine Lehre gehört ins Bedrohungsmodell und steht dort (B-11.4
Punkt 2): **Eine Ignorierregel, die einen exakten Namen nennt, ist eine Vermutung über die
Werkzeugkette. Werkzeuge hängen Suffixe an.**

`/Export/` ist ein zweiter Fund derselben Art und der unangenehmere: Der Ordner `Export/` mit
grossem E fällt durch die Regel `exports/`. In ihm liegt eine **echte** Exportdatei aus einem
Handlauf:

```json
[{ "Call": null, "Zeit": 0.25,
   "Notiz": "T2xsYW1hIHd1cmRlIGRlaW5zdGFsbGllcnQ=",
   "WindowsUser": "kerem" }]
```

Die Notiz lautet im Klartext „Ollama wurde deinstalliert" — die gelebte Bestätigung von B-6.1,
dass Base64 nichts verbirgt. Die Datei war allein durch das Dateinamensmuster
`takt-export*.json` gedeckt, also durch **eine** Regel. Ein Ordner, in dem Kundendaten liegen,
soll nicht von einem Dateinamen abhängen. Jetzt greifen zwei.

Gegengeprüft mit `git check-ignore -v` gegen jede Datei in jedem der sechs Ordner und gegen die
Exportdatei: alle sieben treffen.

---

## 3. Geheimnisse, Kundendaten, Identifizierendes

### Semgrep — die vier Befunde

Alle vier in `apps/desktop/scripts/verify-sidecar.mjs`, einem Nachweisskript, das nicht
ausgeliefert wird. Keiner hoher Schwere, keiner echt:

- `unknown-value-with-script-tag` (LOW, Z. 184) — das Skript schreibt eine Prüfseite mit
  `<script src>`; die eingesetzte Zeichenkette ist ein selbst berechneter Pfad im eigenen
  Arbeitsverzeichnis, keine Eingabe.
- `react-insecure-request` (MEDIUM, 3×, Z. 437/442/457) — `http://127.0.0.1` gegen den eigenen
  Sidecar. Genau die Adresse, die E-004 vorschreibt.

Aus `p/secrets` kam **kein einziger** Treffer. Zwei Zeichenketten, die eine Handsuche
hochspült, sind nachgesehen:

- `verify-sidecar.mjs:193` schreibt `-----BEGIN PRIVATE KEY-----\n` in eine Datei
  `nicht-ausliefern.pem`. Kein Schlüsselmaterial — eine Attrappe für den Nachweis, dass die
  Endungs-Positivliste des Aufgabenbereich-Ports diese Datei **nicht** herausgibt. Der Nachweis
  lautet nicht „gibt es nicht", sondern „gibt es, wird nicht ausgeliefert". Das ist die bessere
  Form, und sie kostet einen Semgrep-Treffer, den jemand künftig wieder prüfen wird. Ein
  Kommentar an der Zeile wäre die Mühe wert.
- `proof-addin.mjs` enthält neun Token `takt_AAAA…`, `takt_BBBB…` — erkennbar konstruiert.

### Mustersuche über alle 473 Dateien

| Gesucht | Gefunden |
|---|---|
| `ghp_`, `sk-`, `xox…`, `AKIA…`, JWT, `BEGIN … PRIVATE KEY`/`CERTIFICATE` | nur die zwei Attrappen oben |
| `password`/`secret`/`api_key` mit Literal | nur Entwurfstoken der Oberfläche (`--bg-canvas`, `--text-lg`) — „Token" in seiner anderen Bedeutung |
| E-Mail-Adressen | **zwei**, `a.beispiel@example.org` und `b.muster@example.com`, beide nur im Bedrohungsmodell. Nach RFC 2606 für genau diesen Zweck reserviert. **Keine** Adresse aus einer echten Domäne — insbesondere nicht die aus der Git-Identität. |
| IP-Adressen | **ausschliesslich** `127.0.0.1`. Keine einzige aus einem fremden Netz. |
| Hostnamen | `localhost`, `tauri.localhost`, `ipc.localhost`, `www.w3.org`, Microsoft-Endpunkte des Add-ins, `react.dev`, `nodejs.org`, dazu die Testdomänen `evil.example`, `boese.example`, `fremde.example`. Kein interner Rechnername. |
| Call-Nummern | `TCK-000042`, `TCK-000815`, `TCK-999999`, `TCK-0000420`, `INC0004711`, `SVC-4711`, `CALL-2026-03xx/04xx` — sämtlich als erfunden erkennbar (4711, 000815, 999999). |
| Kundennamen | „Musterkunde Nord", „Musterwerk AG", „Beispiel GmbH", „Musterfirma" |
| 16 PNG + `.ico` + `.icns` | sämtlich Anwendungssymbole. Quellsymbol angesehen: ein blaues „T". Kein Bildschirmfoto. |
| `manifest.xml` | erfundene GUID, im Kommentar ausdrücklich als solche beschriftet; `ReadItem` als schwächste ausreichende Stufe; nur `localhost:17844`; keine Mandantenkennung. Kein Befund. |

### V-5 (niedrig) — Benutzername in einem Bericht

`.claude/team/reports/T-008b-frontend-dev.md`, sieben eingefügte Werkzeugausgaben:

```
drwx------ 2 kerem kerem 4096  1. Sep 02:55 /home/kerem/.local/share/takt
Built application at: /home/kerem/Projects/SuperTakt/apps/desktop/src-tauri/target/release/takt-desktop
```

Dazu `kerem` als Testbenutzername in `apps/local-api/scripts/proof-access.mjs:80` und in
`.claude/team/reports/T-029-domain-dev.md:184`.

**Warum es geringfügig ist:** Derselbe Name stand bis heute in `user.name` und steht weiterhin
in `.claude/settings.json`. Die Veröffentlichung fügt nichts hinzu, was nicht ohnehin
dastünde — solange V-3 nicht behoben wird. Wird V-3 behoben und `.claude/settings.json` auf
relative Pfade umgestellt, ist dieser Bericht die letzte Stelle mit dem Namen und dann die
Entscheidung wert. **Zu entscheiden, nicht zu beheben.**

---

## 4. `.claude/team/` — 68 Dateien, 65 Berichte, rund 23 900 Zeilen

Du hast recht, dass es bewusst entschieden gehört, und recht, dass es nicht automatisch falsch
ist. Ich halte es für den wertvollsten Teil des Repositorys: die Fehlergeschichte eines
Projekts, das seine Fehler aufgeschrieben hat, statt sie wegzuräumen.

Durchgesucht nach `vertraulich`, `geheim`, `Passwort`, `nicht veröffentlichen`, `Firma`,
`Arbeitgeber`, nach Zitaten und nach Namen: **nichts Vertrauliches.** Die Zitate des
Auftraggebers in `decisions.md` sind fachlich („Das soll alles Lokal sein", „Rundung aufwärts",
„Erledigt ist etwas eigenes") und nennen niemanden. Kein Unternehmen, keine Person, kein System
eines Dritten.

Was jemand anderes dort nicht veröffentlichen würde — damit die Entscheidung bewusst fällt:

1. **Die sieben Werkzeugausgaben mit `/home/kerem` und `kerem kerem`** (V-5, oben).
2. **Der namentliche Zuschnitt, wer welchen Fehler gemacht hat.** Die Berichte sind nach Rollen
   benannt (`T-053-domain-dev`), und die Rollen sind Agenten, keine Menschen — aber der Text
   liest sich stellenweise wie eine Personalakte.
3. **T-053, ausgeschrieben:** Elf grüne Nachweispfade, 556 Testfälle und 28 Ende-zu-Ende-Fälle
   liefen an einer Anwendung vorbei, die nicht startete. Das ist der beste Absatz im ganzen
   Repository und zugleich der, den ein Projekt normalerweise nicht schreibt.
4. **Vier Aufgaben stehen dauerhaft als blockiert**, weil Werkzeuge fehlen: 42Crunch,
   `cargo audit`, ein Windows-Rechner, die Referenzbilder. Ein Leser sieht daran genau, welche
   Prüfungen nie gelaufen sind. Das ist Ehrlichkeit und zugleich eine Landkarte der Blindstellen.

Nichts davon ist ein Sicherheitsbefund. Es ist eine Entscheidung über Aussenwirkung und gehört
dem Auftraggeber. Meine Empfehlung: mitveröffentlichen. Der Nutzen für einen Leser übersteigt
den Preis deutlich, und die Alternative — die Berichte nachträglich glattziehen — kostet genau
die Eigenschaft, die sie wertvoll macht.

---

## 5. `docs/bedrohungsmodell.md` — gibt es einem Angreifer mehr als einem Leser?

Das war die richtige Frage, und sie hätte am 2026-09-01 **ja** gelautet. Abschnitt 11 führte
dort vier blockierende Befunde mit ausgeschriebenem Angriffsweg — darunter „das Add-in-Token
liest und überschreibt den internen Vermerk, setzt den Exportordner und löst einen Exportlauf
aus. Gemessen, nicht vermutet."

Ich habe deshalb je Befund **im Code nachgesehen**, statt dem Dokument zu glauben:

| Aus T-023 | Stand heute | Beleg |
|---|---|---|
| **B-2.10** Add-in-Token erreicht die vollen Fachrouten | **behoben** (T-034). Richtung umgedreht: alles verlangt `session`, abgesenkt nur im Teilbaum `/api/v1/addin` und für `GET /health`. Neue Fachrouten sind von selbst geschlossen. Punktsegmente werden nicht abgesenkt. | `apps/local-api/src/access/route-policy.ts` |
| **B-3.2** `__proto__` in Vorlagenfeldnamen | **behoben.** `RESERVED_FIELD_NAMES` weist `__proto__`, `constructor`, `prototype` ab; die Ergebniszeile ist `Object.create(null)` und hat gar keinen Prototyp. Zwei unabhängige Gründe. | `packages/export/src/template.ts:163`, `packages/export/src/render.ts:155` |
| **B-7.2** Datenbankdateien mit 0644 | **behoben.** `DATABASE_FILE_MODE = 0o600` auf die Hauptdatei **und** `-wal`/`-shm`; Verzeichnisse `0o700`. | `packages/storage/src/sqlite/database.ts:106,143`, `apps/local-api/src/access/paths.ts:97` |
| **B-5.1/5.2** Exportordner als Freitextfeld | **behoben.** Systemdialog, Fähigkeitenliste gibt nur `dialog:allow-open` frei; dienstseitig Merkmalsprüfung auf Systemverzeichnisse, Netzdateisysteme, UNC und Synchronisationsordner; Oberfläche mit `reject`/`confirm`/`warn`. | `apps/local-api/src/access/export-directory.ts`, `apps/web/src/lib/exportDirectoryAdvice.ts`, `apps/desktop/src-tauri/capabilities/default.json` |

Auch `S-05` (`PRAGMA trusted_schema = OFF`) ist behoben. `S-08` ist überholt: Die 44 Pfade
verweisen über gemeinsame Bausteine 65-mal auf `Unauthorized`, `OriginRejected` und
`TokenInUrl`, dazu `NotFound`, `Conflict`, `UnprocessableEntity`, `UnsupportedMediaType`,
`PayloadTooLarge`. `429` fehlt zu Recht — der Dienst sendet diesen Code nirgends. Offen bleiben
`500` und das begründete Fehlen von `additionalProperties: false`.

**Es bleiben zwei Stellen, an denen das Dokument eine unbehobene Schwäche ausschreibt.**
Kriterium, damit die Zählung nachprüfbar ist: *im ausgelieferten Code vorhanden, im Dokument
beim Namen genannt, ohne Gegenmittel an derselben Stelle.*

- **Die fehlende `realpath`-Auflösung im Aufgabenbereich-Port**, benannt in 12.7.
  `apps/local-api/src/taskpane/server.ts:239` prüft das Präfix auf dem **lexikalischen** Pfad
  (`target.startsWith(root + sep)`) und löst erst danach mit `stat` auf — das folgt
  symbolischen Verknüpfungen. Eine Verknüpfung **im** Bündelordner, die nach außen zeigt, wird
  ausgeliefert. Gewicht gering (wer sie anlegen kann, hat Schreibrecht im
  Installationsverzeichnis; die Endungs-Positivliste begrenzt zusätzlich), aber offen.
  Gegenmittel: `realpath` nach der Auflösung, zweite Präfixprüfung.
- **S-07** — `cargo audit` ist nie gelaufen, der Rust-Baum nie gegen eine Schwachstellendatenbank
  geprüft. Kein Ausnutzungsweg, eine Wissenslücke. Ihre offene Benennung nützt mehr, als sie
  schadet, und unter MIT nützt sie besonders: Wer den Baum übernimmt, weiss, was er selbst prüfen
  muss.

**Korrektur an meiner eigenen Zählung — das ist wichtiger als der behobene Befund.** Hier stand
am Vormittag „genau zwei Stellen: V-4 und S-07". Das war schon damals falsch, und **nicht** wegen
V-4: Ich hatte den `realpath`-Punkt aus 12.7 übersehen. Es waren drei. Jetzt sind es wieder zwei,
aber es sind andere zwei. Im Bedrohungsmodell steht die Korrektur mit dem Grund; ich habe sie
nicht weggeschrieben, weil eine Zählung, die man nicht nachrechnen kann, genau die Sorte Aussage
ist, vor der Abschnitt 0 seit T-003 warnt.

Nicht mitgezählt, weil sie das Kriterium nicht erfüllen: die neun Restrisiken RR-1 bis RR-9
(bewusst getragen) und S-09 (`style-src 'unsafe-inline'` — mit vollständigem Gegenargument in
`apps/desktop/src/shell.ts`: `script-src` bleibt `'self'`, kein Skript aus einer Zeichenkette).

Alles Übrige beschreibt **geschlossene Türen und wie sie geschlossen wurden**. Ein
Bedrohungsmodell, das nur die gelösten Fälle nennt, wäre Werbung. Ich habe im Dokument einen
Hinweis direkt unter den Titel gesetzt, damit ein Leser nicht Abschnitt 11 vom 2026-09-01 findet
und ihn für den Stand hält.

### Was ich am Bedrohungsmodell geändert habe

Kopf (Stand T-067 plus der Warnhinweis), Abschnitt 0 (Werkzeugstand vom 2026-09-02), zwei neue
Bedrohungen **B-11.4** (der erste Commit ist die Veröffentlichung) und **B-11.5** (Lizenz und
fremdes Urheberrecht), der neue **Abschnitt 13** mit der vollständigen Prüfung, und das Urteil
in Abschnitt 11. Die Stände T-023 und T-003 stehen unverändert darunter.

---

## 6. Git-Identität

`user.name` = `KuyomieKurama`, `user.email` = `noreply@kyksp.de`. Beide bewusst gewählt.

**Geprüft: Im Baum steht keine andere Adresse.** Die einzigen zwei E-Mail-Adressen in 473 Dateien
sind `a.beispiel@example.org` und `b.muster@example.com` im Bedrohungsmodell, beide aus dem für
Dokumentation reservierten Namensraum. `kyksp.de` kommt ausserhalb der Git-Konfiguration nicht
vor. Keine Commits vorhanden, also auch keine Autorenzeile mit einer anderen Adresse.

Ein Hinweis zur Kombination: Der bisherige `user.name` (`kerem`) steht noch an fünf Stellen im
Baum (V-3, V-5). Der neue Name ist ein Pseudonym; die Stellen mit dem alten Namen verbinden es
mit einem Klarnamen und einer Verzeichnisstruktur. Wenn die Trennung beabsichtigt ist, sind V-3
und V-5 nicht mehr geringfügig, sondern der eigentliche Grund, sie zu beheben. Das ist eine
Frage an den Auftraggeber, keine Feststellung.

---

## 7. Lizenz — nachgeprüft

**`LICENSE` liegt vor** (MIT, „Copyright (c) 2026 KuyomieKurama") und geht mit in die
Veröffentlichung. **Alle neun `package.json` tragen `"license": "MIT"`**, alle neun sind
gültiges JSON. Der Punkt aus meinem Auftrag („es gibt keine LICENSE") ist damit erledigt.

### V-2 (mittel) — eine zehnte Lizenzangabe, die widersprach — **behoben am 2026-09-02**

`apps/desktop/src-tauri/Cargo.toml` stand bei meiner Prüfung auf:

```toml
publish = false
license = "UNLICENSED"
```

Zwei Probleme:

1. **Widerspruch.** Eine MIT-`LICENSE` an der Wurzel und ein Paket im selben Repository, das
   `UNLICENSED` sagt. Ein Leser, der wissen will, ob er den Rust-Anteil benutzen darf, findet
   zwei Antworten und hat damit keine. `publish = false` mildert das nicht — es verhindert nur
   die Veröffentlichung auf crates.io, nicht die Aussage.
2. **`UNLICENSED` ist keine gültige SPDX-Kennung.** Es ist eine npm-Konvention; Cargo erwartet
   SPDX (`NONE`/`NOASSERTION` wären die dortigen Entsprechungen). Die Angabe ist also nicht nur
   widersprüchlich, sondern formal falsch.

**Behoben, nachgesehen:** jetzt `license = "MIT"`, mit einem Kommentar, der ausdrücklich
festhält, dass `publish = false` daran nichts ändert. Damit sagen `LICENSE`, die neun
`package.json` und die `Cargo.toml` dasselbe — elf Angaben, eine Aussage.

**Die Lehre, die ich mitnehme:** Der Abgleich der neun `package.json` war sauber, und genau
deshalb wäre der Befund fast durchgerutscht. Die zehnte Lizenzangabe lag in einem anderen
Ökosystem. *Wer nur ein Paketformat prüft, prüft nicht das Repository.* Das steht jetzt in
B-11.5 des Bedrohungsmodells, damit es die nächste Prüfung nicht neu lernen muss.

### Passt MIT zu den Abhängigkeiten? — Ja

Abgeglichen über den **aufgelösten** pnpm-Speicher (`node_modules/.pnpm`), nicht über die
direkten Angaben in den Paketdateien; die transitive Abhängigkeit ist der Fall, den man
übersieht. **210 Pakete:**

| Lizenz | Anzahl |
|---|---|
| MIT | 185 |
| Apache-2.0 | 9 |
| ISC | 7 |
| BSD-3-Clause | 4 |
| Apache-2.0 OR MIT | 3 |
| 0BSD | 1 |
| CC-BY-4.0 | 1 |

**Keine Copyleft-Lizenz.** Kein GPL, LGPL, AGPL, MPL, EPL, CDDL, SSPL, BUSL, keine
Elastic-Lizenz. **Kein Paket ohne Lizenzangabe.** Alles permissiv und mit MIT verträglich.

Zu den namentlich genannten: **Hono** MIT, **Zod** MIT, **Ark UI** MIT, **Zag.js** MIT, **React**
MIT, **Vite** MIT. **Tauri** und seine Kisten führen `Apache-2.0 OR MIT` — bei einer
Doppellizenz wählt der Nutzer, also MIT, vollständig verträglich. Der Rust-Baum hängt an Tauri
plus `serde`, `serde_json`, `getrandom`, `libc`, die alle derselben Doppellizenz folgen.

**Die eine Auflage, die nicht null ist.** Von den neun Apache-2.0-Paketen sind sechs reine
Bauzeit-Abhängigkeiten (Playwright, TypeScript, `expect-type`, `baseline-browser-mapping`); drei
gehen in die Auslieferung: `@internationalized/date`, `@internationalized/number` (über Ark UI)
und `@swc/helpers`. Apache-2.0 §4 verlangt beim **Weitergeben des Erzeugnisses** Lizenztext und
`NOTICE`. Das betrifft **nicht** die Veröffentlichung des Quelltextes, wohl aber die `.deb`, die
`.AppImage` und den gebündelten Sidecar. Playwright liefert drei `NOTICE`-Dateien mit; die gehen
in kein Erzeugnis ein. **Kein Hindernis für T-067, ein Punkt für die erste Auslieferung.**

`caniuse-lite` unter CC-BY-4.0 ist Bauzeit (browserslist); die Daten gehen nicht ins Bündel.

### Fremdes Urheberrecht — ein Treffer, der eigene

Über alle 473 Dateien gesucht nach `Copyright`, `(c) JJJJ`, `©`, `SPDX-License-Identifier`,
`All rights reserved`, `Alle Rechte`, `adapted from`, `based on https`, `taken from`,
`copied from`, `übernommen aus`, `vendored`:

**Ein einziger Treffer: `LICENSE:3`.** Keine fremden Dateiköpfe, keine kopierten
Beispielausschnitte, keine Fremdsymbole. Die drei Treffer auf „übernommen aus" sind
Querverweise auf eigene Berichte (T-015). Die 16 PNG sind alle aus `apps/desktop/icons/quelle.png`
abgeleitet, einem selbst gezeichneten blauen „T".

Bei rund 40 000 Zeilen ist das bemerkenswert und gehört gesagt.

### Was die MIT-Lizenz an der Bewertung ändert

Du hast gefragt, ob mir etwas auffällt, das unter MIT anders wiegt. **Ja, ein Punkt, und er war
der Grund, warum V-4 in dieser Prüfung überhaupt vorkam.**

An der Vertraulichkeit ändert MIT nichts: Was nicht hinausgehört, gehört unter jeder Lizenz
nicht hinaus. Sie ändert zwei andere Dinge:

1. **Der Code wird abgeleitet, nicht nur gelesen.** Eine Schwäche in einer Kopie lässt sich nicht
   mehr durch einen Commit hier beheben. Das erhöht das Gewicht jeder Stelle, die zum Abschreiben
   einlädt. In `apps/local-api/src/taskpane/certificate.ts` stand bis T-066:

   ```ts
   serial[index] = Math.floor(Math.random() * 256);
   ```

   In Takt war das folgenlos — der Schlüssel kommt aus `generateKeyPairSync`, die Seriennummer
   ist kein Geheimnis, TLS bricht daran nicht, und die Datei sagt selbst, sie sei nur dazu da,
   zwei Zertifikate unterscheidbar zu machen. Aber es war die **einzige** Stelle im ganzen
   Dienst, an der Zufall aus einem Pseudogenerator kam, sie stand in einer Datei namens
   `certificate.ts` neben echter Kryptografie, und die Nachbardatei `access/token.ts` schreibt
   in ihrem Kopf ausdrücklich: „Ausdrücklich nicht: `Math.random`". Wer den Zertifikatsbau
   übernimmt und daraus einen Schlüssel oder ein Token ableitet, hätte eine Zeile übernommen,
   die in seinem Zusammenhang nicht mehr folgenlos ist.

   **Behoben am 2026-09-02 in T-066, nachgesehen:** jetzt `const serial = randomBytes(16);`,
   `randomBytes` in der bestehenden `node:crypto`-Einfuhr, oberstes Bit fällt weiterhin nach
   RFC 5280. Bemerkenswert daran ist die Begründung im Quelltext, die als zweiten Grund
   wörtlich nennt, dass das Repository öffentlich wird. **Damit ist dieses Argument nicht mehr
   Theorie:** Es ist der erste Fall in diesem Projekt, in dem die bevorstehende
   Veröffentlichung eine Bewertung tatsächlich verschoben und eine Änderung ausgelöst hat.

2. **Die Gewährleistung ist ausgeschlossen, die Verantwortung für die Zusage nicht.** MIT
   schliesst Haftung aus, setzt aber voraus, dass man die Rechte hatte, die man vergibt. Deshalb
   steht die Suche nach fremdem Urheberrecht oben und nicht in einer Fussnote. Sie ist sauber.
   Und deshalb wiegt V-2: Eine unwiderrufliche Zusage darf nicht zwei Fassungen haben.

Was MIT **nicht** ändert: die 68 Berichte, das Bedrohungsmodell, die Testdaten. Alles davon ist
unter MIT genauso vertretbar wie unter vollem Urheberrecht.

---

## 8. Weitere Befunde

### V-3 (mittel, blockierend) — `.claude/settings.json` mit absoluten Pfaden

Zwölf Regeln mit `/home/kerem/…`, darunter:

```json
"deny": [ "Read(//home/kerem/.ssh/**)", "Read(//home/kerem/.gnupg/**)",
          "Read(//home/kerem/.aws/**)",
          "Read(//home/kerem/Projects/SuperTakt/**/.env)" ]
```

Zwei Wirkungen, und die zweite wiegt schwerer:

1. **Preisgabe.** Benutzername und Ablagestruktur. Geringfügig, solange derselbe Name ohnehin
   sichtbar ist — siehe aber den Hinweis unter Abschnitt 6 zum Pseudonym.
2. **Funktional wirkungslos beim Klon.** Wer das Repository nach `/home/alice/SuperTakt` klont,
   bekommt eine `settings.json`, in der **keine** dieser Regeln mehr greift. Die `allow`-Regeln
   nicht, und — das ist der Punkt — die `deny`-Regeln auf `~/.ssh`, `~/.aws`, `~/.gnupg` und
   `**/.env` auch nicht. **Eine Schutzregel, die still ins Leere zeigt, ist schlechter als
   keine, weil sie gelesen wird und beruhigt.**

**Gegenmittel:** relative Muster — `Read(./**)`, `Read(~/.ssh/**)`, `Read(./**/.env)`. Löst
beide Wirkungen zugleich. Nicht meine Datei.

Nebenbei bleiben die zwei Anmerkungen aus B-11.3 (T-003) unverändert offen: `*.sqlite*`, der
Exportordner und die Tokendatei fehlen in `deny`, und es gibt keine Sperre auf das Schreiben von
`settings.json` selbst.

### V-6 (niedrig) — kein Lizenzabschnitt im README

`README.md` verweist am Ende auf sieben Dokumente, aber nicht auf `LICENSE`. Auf GitHub fällt
das kaum auf (die Oberfläche zeigt die Lizenz selbst an); in einer Kopie des Verzeichnisses oder
einem Tarball schon. Zwei Zeilen. Nicht meine Datei.

---

## 9. Definition of Done

| Punkt | Stand |
|---|---|
| Semgrep ohne offene Befunde hoher Schwere | **erfüllt.** 12 442 Ziele, 4 Befunde, keiner hoher Schwere, alle vier geprüft und unecht. |
| 42Crunch-Audit über der Schwelle | **nicht erfüllt und nicht erfüllbar.** `42c-ast` nicht installiert, keine Zugangsberechtigung. Die OpenAPI liegt vor — es fehlt allein das Werkzeug. Beschaffungsentscheidung des Auftraggebers. Als erfüllt zu führen wäre die eine Sorte Fehler, die dieses Projekt seit T-003 vermeidet. |
| Jeder Befund mit Pfad, Anforderung, Auswirkung, Gegenmittel | erfüllt — V-1 bis V-6 oben und in Abschnitt 13.4 des Bedrohungsmodells. |
| `docs/bedrohungsmodell.md` gepflegt | erfüllt — Kopf, Abschnitt 0, B-11.4, B-11.5, Abschnitt 11, neuer Abschnitt 13. |
| Urteil | **Nacharbeit** — ein offener Blocker (V-3, beim Auftraggeber). Zwei der drei sind am selben Tag behoben und nachgesehen worden. |

Nicht getan, wie beauftragt: nicht committet, nicht gepusht, kein Remote eingerichtet.

---

## 9a. Ein Nebeneffekt dieses Berichts, der zu nennen ist

Dieser Bericht ist selbst Teil des Baums, der veröffentlicht wird, und er **konzentriert genau
die Zeichenketten, die er beanstandet**: `/home/kerem/…` steht hier vierzehnmal, und
`noreply@kyksp.de` stand vor diesem Bericht **nirgends im Baum** — es stand nur in der
Git-Konfiguration, die nicht mitgeht.

Das ist kein Grund, den Bericht zu entschärfen; ein Sicherheitsbefund, der nicht sagen darf, was
er gefunden hat, ist keiner. Es ist aber ein Grund, es zu wissen:

- Wird V-3 behoben und die Frage aus Abschnitt 6 mit „ja, das Pseudonym soll trennen"
  beantwortet, dann sind **dieser Bericht und T-008b** die letzten beiden Stellen mit dem
  Klarnamen — und dieser hier zusätzlich die einzige mit der E-Mail-Adresse.
- Dann ist zu entscheiden, ob er in dieser Fassung mitgeht. Meine Empfehlung für diesen Fall:
  die Belegzitate in Abschnitt 3, 6 und 8 auf `/home/<benutzer>/…` und `<name>@<domäne>`
  eindampfen. Die Befunde bleiben nachvollziehbar, die Belege verlieren nichts an Beweiskraft,
  weil die Datei, um die es geht, ohnehin danebenliegt.
- Geht die Trennung **nicht** vor, ändert dieser Bericht nichts: Dann steht der Name ohnehin in
  der Autorenzeile jedes Commits.

Ich habe das nicht selbst eingedampft, weil die Entscheidung an F-C hängt und weil ein Bericht,
der seine eigenen Belege vor der Entscheidung unkenntlich macht, dem Auftraggeber die Grundlage
nimmt.

---

## 10. Was der Auftraggeber entscheiden muss

| Nr | Frage |
|---|---|
| F-A | **Vor dem Commit:** `Cargo.toml` auf `license = "MIT"` (V-2, in Arbeit), `.claude/settings.json` auf relative Pfade (V-3, beim Auftraggeber). ~~`Math.random` → `randomBytes(16)` (V-4)~~ — am 2026-09-02 in T-066 erledigt. |
| F-B | Gehen die 68 Dateien unter `.claude/team/` mit? Meine Empfehlung: ja. |
| F-C | Soll das Pseudonym `KuyomieKurama` vom Klarnamen getrennt bleiben? Dann sind V-3 und V-5 nicht geringfügig, sondern der eigentliche Grund für F-A Punkt 2. |
| F-D | `NOTICE` mit den drei Apache-2.0-Paketen vor der ersten Auslieferung eines Bündels — nicht vor dem Commit. |
| F-E | 42Crunch-Zugang beschaffen oder das Tor durch eine benannte Ersatzprüfung ersetzen? Seit T-003 offen, zum dritten Mal gestellt. |
| F-F | `cargo audit` installieren? Unter MIT wiegt es etwas schwerer, weil Dritte den Rust-Baum übernehmen. |
