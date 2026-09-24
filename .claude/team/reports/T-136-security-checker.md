# T-136 — Bedrohungsmodell für den neuen Ausgang ins Netz

**Rolle:** security-checker · **Datum:** 2026-09-04 · **Stand des Bestands:** `d9555d0` plus
Arbeitsbaum der laufenden Welle O (T-132, T-133, T-134 schreiben währenddessen; nichts davon
angefasst).

**Urteil: freigegeben für den Bau — mit zwanzig Auflagen als Bedingung für T-138 und T-139.**

---

## 1. Was gemacht wurde

`docs/bedrohungsmodell.md` fortgeschrieben:

* **Abschnitt 3** — neue Vertrauensgrenze **VG-10** (lokaler Dienst → GitHub). Die erste Grenze,
  an der Takt den Rechner verlässt.
* **Abschnitt 4** — neue Akteure **A-10** (wer die Antwort auf der Strecke bestimmt: übernommenes
  Konto, TLS-abschließender Unternehmens-Proxy, Angreifer im Netzweg) und **A-11** (GitHub als
  Beobachter — eine Senke wie A-09, kein Angreifer).
* **Abschnitt 7** — Nachtrag T-136, Prüfungen **27 bis 34**, vor dem Bau geschrieben.
* **Abschnitt 8** — zwei neue Tore: **T-138** und **T-139**, jeweils mit den Auflagen, ohne die
  es keine Freigabe gibt.
* **Abschnitt 18** (neu, 18.0 bis 18.12) — die Vorabbewertung: sieben Bedrohungen **B-18.1** bis
  **B-18.7**, zwanzig Auflagen **A-V-1** bis **A-V-20**, sechs Befunde **T-136-1** bis
  **T-136-6**, vier Restrisiken, Urteil.

Sieben eigene Messungen gegen Node 22.23.2 und `tauri-plugin-shell 2.3.6`. Drei davon haben eine
Auflage verändert; sie stehen unten.

---

## 2. Die drei Messungen, die den Entwurf verändert haben

### 2.1 `content-length` ist keine Obergrenze — Faktor 1 028

Ein lokaler Prüfserver antwortete mit `content-encoding: gzip` und `content-length: 50989`.
Nach dem automatischen Auspacken durch undici lagen **52 428 800 Bytes** im Speicher.

Folge für **A-V-6**: Die Obergrenze von 65 536 Bytes wird auf dem **entpackten Strom** beim Lesen
gezählt. `response.json()`, `response.text()` und `response.arrayBuffer()` sind damit ausgeschlossen
— sie lesen zuerst vollständig und lassen die Grenze danach greifen, also nie.

### 2.2 Der Netzaufruf darf nicht in einem Anfragebehandler liegen

Kein Messwert, sondern eine Folgerung aus R-02 in Verbindung mit VG-10, und sie fehlte im Entwurf.
Löste die Route den ausgehenden Aufruf aus, könnte jeder lokale Prozess mit dem Sitzungsgeheimnis
Takt in einer Schleife von der Adresse des Benutzers aus an GitHub schicken lassen: Takt wird zum
Anfragegenerator, das Lebenszeichen aus R-19 Punkt 3 wird von einem Dritten getaktet, und die 60
Anfragen je Stunde und Quelladresse sind in Sekunden aufgebraucht.

Folge: **A-V-10** — die Route gibt das zuletzt ermittelte Ergebnis zurück. Prüffall: 100 Aufrufe,
**eine** ausgehende Anfrage.

### 2.3 `tauri-plugin-shell` prüft auf dem Rust-Weg gar nichts — Befund T-136-1

`Shell::open` (`lib.rs:76-78`) ruft `open::open(None, path, with)`. In `open.rs:122-136` steht
wörtlich:

> `// when running directly from Rust code we don't need to validate the path`

Der `OpenScope` mit dem Prüfausdruck (`scope.rs:207-224`) wird ausschließlich betreten, wenn der
Aufruf aus JavaScript kommt. Für den Befehl aus E-064 Punkt 4 heißt das: **Es gibt kein zweites
Netz.** Die Formprüfung, die T-139 schreibt, ist die einzige Kontrolle zwischen der Antwort von
GitHub und `xdg-open` beziehungsweise `ShellExecuteW`. Sie ist die Vertrauensgrenze und nicht ihre
Absicherung — und deshalb gehören die Ausbruchsversuche als Prüffälle **neben** den Befehl.

Dazu die Gegenprobe zur naheliegenden Alternative, ebenfalls gemessen: `shell:default` enthält
laut `permissions/default.toml` `allow-open`, und die Vorgabeprüfung von `open` lautet
`^((mailto:\w+)|(tel:\w+)|(https?://\w+)).+` (`open.rs:107`). Sie prüft das Schema und sonst
nichts. Eine Zeile in `capabilities/default.json` gäbe dem Webview damit die Möglichkeit, **jede**
Adresse im Browser des Benutzers zu öffnen. Wer die naheliegende Form gebaut hätte, hätte eine
offene Weiterleitung in den Browser des Benutzers gebaut und es an keiner Stelle bemerkt.

---

## 3. Die weiteren vier Messungen

| Was | Ergebnis | Wofür |
|---|---|---|
| Ausgehende Kopfzeilen ohne jede Option, Node 22.23.2 | `host`, `connection: keep-alive`, `accept: */*`, `accept-language: *`, `sec-fetch-mode: cors`, `user-agent: node`, `accept-encoding: gzip, deflate` | A-V-13. Guter Befund: **keine** trägt Benutzer, Rechnername, Sprache, Kennung oder Fassung. `accept-language` ist wörtlich `*` und nicht `de-DE`. |
| `AbortSignal.timeout(700)` gegen eine Antwort, die `{"a":` schreibt und schweigt | Abbruch nach **703 ms**, `TimeoutError` | A-V-5. Die Frist greift auch beim Lesen des Rumpfes, nicht nur beim Verbindungsaufbau. |
| `redirect`-Verhalten | Vorgabe `follow` folgt bis 20 Sprüngen stumm; `manual` liefert die 302 samt lesbarer `location`; `error` wirft `TypeError` / `unexpected redirect`, die `location` wird nie gelesen | A-V-3. Nur `error` ist eine Zusage. Daraus folgt auch die Adresse: `github.com/…/releases/latest` antwortet mit 302 und wäre unter `error` nie benutzbar — also `api.github.com/repos/…/releases/latest`, die zudem Entwürfe und Vorabfassungen ausschließt. |
| 500 000 erzeugte Fassungsbezeichnungen aus dem erlaubten Zeichenvorrat, angehängt an die feste Adresse und durch den URL-Parser | **null Ausbrüche**: `origin` immer `https://github.com`, Pfad immer unter `/KuyomieKurama/SuperTakt/releases/tag/v`, `search` und `hash` immer leer. Gegenprobe mit zehn Angriffsformen (`../../../evil`, `1.2.3/../../evil`, `1.2.3?x=1`, `1.2.3#a`, `1.2.3@evil.example`, `1.2.3\evil`, `1.2.3%2f..%2f..%2fevil`, `1.2.3 evil`, `1.2.3\n`, `999999999999999999999.0.0`): jede von der Form abgewiesen | A-V-8, A-V-16. Die Sicherheit der Zusammensetzung liegt im **Zeichenvorrat** (`0-9A-Za-z.-` — kein `/`, `\`, `?`, `#`, `:`, `@`, `%`, kein Leerzeichen), nicht in einer Meinung über die Adresse. |

---

## 4. Die sieben Fragen der Aufgabe, kurz beantwortet

1. **Die fremde Antwort.** E-063 ist die richtige Klasse und deckt die Hälfte: `<Foreign>` und
   `proof:foreign` greifen, **sobald** Text in der Oberfläche steht. Sie greifen **nicht** für die
   Größe, die Frist, die Verschachtelung des JSON, für Adressen (dort ist die Behandlung
   wirkungslos — `U+FFFD` an der Stelle eines Steuerzeichens macht eine Adresse nicht sicher,
   sondern kaputt), für Markdown in der Fassungsbeschreibung und für die Ordnung der Zahlen.
   Antwort: **Aus der Antwort wird ein einziges Feld gelesen** (`tag_name`), gegen eine enge Form
   geprüft; `body`, `name`, `html_url`, `assets` werden nicht gelesen, nicht protokolliert, nicht
   angezeigt. Dann ist der geprüfte Wert kein fremder Text mehr, und E-063 muss ihn nicht tragen.
2. **Der Weg einer Adresse in den Browser.** Siehe 2.3. Die Bauform „Befehl ohne Adressparameter"
   ist nach der Messung nicht die vorsichtigere, sondern die einzige mit einer Kontrolle.
   Prüfung der Fassungsbezeichnung: Form
   `^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$`, Zeichen nur `0-9A-Za-z.-`,
   Länge ≤ 94; bei Nichtbestehen kein Aufruf, kein Öffnen, kein Hinweis, kein zweiter Versuch,
   und ein `Err` mit technischem Schlüssel **ohne** den abgelehnten Wert.
3. **Weiterleitungen.** Zusage: genau **eine** Verbindung, und zwar zu `api.github.com`; eine
   `location` wird nie gelesen. Messbar an `redirect: 'error'` und an einem Prüffall mit zwei
   Hälften — stiller Fehlschlag **und** null Anfragen am Umleitungsziel.
4. **Betriebsmittel.** Frist 5 000 ms über den ganzen Vorgang; Obergrenze 65 536 Bytes des
   entpackten Stroms; eine Antwort, die nie endet, fällt unter die Frist und der gelesene Teil
   wird verworfen; eine Anfrage je Start, danach höchstens eine je 24 h, harter Boden 60 min,
   nach einem Fehlschlag kein zweiter Versuch im selben Lauf; Zeitgeber `unref()`t und laufender
   Aufruf an einem `AbortController`, den `shutdown()` auslöst (sonst ist es der Weg zu 17.2 und
   T-125-4).
5. **Das Lebenszeichen.** Gesetzt werden drei Kopfzeilen: `accept: application/vnd.github+json`,
   `x-github-api-version: 2022-11-28`, `user-agent: Takt` — **ohne Fassungsnummer**, weil der
   Vergleich auf diesem Rechner stattfindet und die Anfrage die Zahl nicht braucht. Ohne Zutun
   steht drin, was in 3. gemessen ist; nichts davon ist ein Merkmal. Nicht wegzuverhandeln
   bleiben Quelladresse, Zeitpunkt, Wiederholungsmuster und der Name `api.github.com` im
   TLS-Handschlag — Restrisiko, gehört ins Benutzerhandbuch.
6. **Die Vertrauensgrenze zum Add-in.** Der Bestand trägt es bereits: `requiredCredentialForPath`
   (`route-policy.ts:111`) gibt `session` für alles zurück, was nicht unter `/api/v1/addin` liegt
   und nicht wörtlich in `SHARED_PATHS` steht. Die neue Route ist damit geschlossen, **ohne dass
   jemand daran denkt**. Sie darf das Add-in nicht sehen: Es braucht sie nicht, und es weist sich
   mit dem dauerhaften Token aus dem `localStorage` aus (R-09). Auflage: an derselben
   Hono-Anwendung registrieren, damit `proof:route-policy` Abschnitt 4 sie von selbst erfasst —
   die Zahl der dort geprüften Routen muss um genau eins steigen.
7. **Zulieferung.** **Keine neue Abhängigkeit, auf beiden Seiten.** Node ≥ 22.5.0
   (ausgeliefert 22.23.2) hat globales `fetch`, `AbortSignal.timeout`, `redirect: 'error'` und
   den Lesestrom; alle vier auf genau dieser Fassung gemessen. Auch **keine** Bibliothek für die
   Ordnung der Fassungen — sie liegt nach E-064 Punkt 3 in `packages/domain`. In Rust reicht
   `tauri-plugin-shell` (steht in `Cargo.toml:37`); `tauri-plugin-opener` wäre ein neuer
   Lieferant für eine Abkündigungswarnung. `Shell::open` ist `#[deprecated]`, der Aufruf braucht
   ein kommentiertes `#[allow(deprecated)]`.

---

## 5. Gegenprobe im Bestand — was passt und was nicht

| Geprüft | Ergebnis |
|---|---|
| CSP in `tauri.conf.json` | `default-src 'none'`, `connect-src 'self' ipc: http://ipc.localhost http://127.0.0.1:17843`. Der Webview kann GitHub nicht fragen. **Aber:** die Zusage in `CLAUDE.md` und E-064 nennt drei Einträge, die Datei trägt vier → **T-136-2**. |
| `ALLOWED_ORIGINS` (`config.ts:76-110`) | Fünf Herkünfte, zeichengleich verglichen, kein `startsWith`. Von der Versionsprüfung **nicht** berührt — der Aufruf ist ausgehend und hat keine Herkunft. Keine Änderung nötig; jede wäre ein Befund. |
| `capabilities/default.json` | Drei Einträge: `core:default`, `core:window:allow-start-dragging`, `dialog:allow-open`. **Kein `shell:`.** Das ist der richtige Zustand und muss es bleiben → A-V-17. `tauri-plugin-shell` ist in `Cargo.toml`, aber nur Rust-seitig für den Sidecar (`sidecar.rs:50`) — das ist etwas anderes als eine freigegebene Fähigkeit, und E-064 Punkt 4 („liegt bereits vor") ließe sich falsch lesen. |
| Nachweisprüfung bestehender Routen | Deny-by-default über `requiredCredentialForPath`; `proof:route-policy` Abschnitt 4 fragt den Dienst nach **seiner eigenen** Routenliste. Trägt die neue Route ohne Zutun. |
| Fassung im Erzeugnis | `tauri.conf.json:version = "0.0.0"`, im Auslieferungsbau überlagert aus `TAKT_RELEASE_VERSION` (`build-app.mjs:153-170`), also aus dem Git-Etikett. E-065s Satz stimmt für den Entwicklungsbau, nicht für das Erzeugnis → **T-136-3**. Sicherheitsrelevant ist daraus A-V-15. |
| Ausgehende Aufrufe heute | `grep` über `apps/**` und `packages/**`: **kein** `fetch(` ins Netz, **kein** `github.com` im Produktivcode, **kein** `NODE_TLS_REJECT_UNAUTHORIZED`, `ProxyAgent`, `NODE_USE_ENV_PROXY`, `https_proxy`. Die Zählung aus A-V-1 beginnt bei null. |
| Protokoll | `logger.lifecycle(level, message, reason)` — der dritte Parameter entsteht gerade in T-132. Das ist der Kanal für A-18.11; er nimmt einen technischen Schlüssel und keinen Inhalt (A-V-20). |
| Repository-Hygiene über die geänderten Dateien | Keine Zugangsdaten, keine Kundendaten, keine echten Call-Nummern. Der einzige Treffer der Mustersuche ist `type: apiKey` in der OpenAPI-Beschreibung — ein Schlüsselwort des Formats. |

---

## 6. Werkzeuge

| Werkzeug | Ergebnis |
|---|---|
| Semgrep, lokal (`p/nodejsscan`, `p/typescript`), 188 Regeln über 193 Dateien | **9 Befunde, kein Befund hoher Schwere.** Alle in den seit T-023 bekannten Falschmeldungsklassen: 3× `regex_dos` an Ausdrücken über eigene Konstanten (`origin-policy.ts:175,182`, `migration-runner.ts:305`), 4× `node_timing_attack` an React-Kontextvergleichen, 1× `node_secret` an `redactSecrets` (die Funktion heißt so), 1× `node_username` in `showcase/ShellStateSection.tsx`. Zwei Parse-Warnungen an `export type *` — TS-5-Syntax, die der Parser nicht kennt. |
| Semgrep Guardian (SAST, Geheimnisse, Lieferkette) | **Nicht erreichbar:** „Not logged into Semgrep Guardian." Zum **achten** Mal. |
| 42Crunch Audit / Scan | **Nicht gelaufen.** Kein `42c-ci-cli`, kein Token, kein `~/.42crunch`. Die OpenAPI-Beschreibung existiert (`apps/local-api/openapi/takt-local-api.yaml`, 5 442 Zeilen) — das Werkzeug nicht. Unverändert die Lücke aus 12.4 bis 17.0. Ersatz für diese Aufgabe: A-V-19 und A-V-20 sagen, was die neue Route in der Beschreibung leisten muss. |

Beides ist eine Beschaffungsentscheidung und kein Befund dieses Zweigs — geführt als **T-136-6**.

---

## 7. Befunde

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-136-1** | **muss** | `tauri-plugin-shell` prüft auf dem Rust-Weg nichts (2.3). Die Formprüfung in A-V-16 ist die Grenze selbst. Gegenmittel: A-V-16 und A-V-17, und die Ausbruchsliste als Prüffälle **neben** dem Befehl. | frontend-dev (T-139), unit-tester (T-140) |
| **T-136-2** | Hinweis | Die CSP-Zusage in `CLAUDE.md` und E-064 nennt drei `connect-src`-Einträge, die Datei trägt vier (`http://ipc.localhost`, die IPC-Herkunft unter Windows — berechtigt). Die Zusage wird ab jetzt bei jeder Freigabe geprüft. Besserer Weg als der Textnachtrag: ein Wächter liest die `csp`-Zeichenkette und prüft, dass `connect-src` genau diese vier Marken trägt und **kein** `api.github.com` (E-063 Punkt 4/5). | Orchestrator (Text), frontend-dev (Wächter) |
| **T-136-3** | Hinweis | E-065 sagt „führende Quelle ist `version` in `tauri.conf.json`". Im Erzeugnis kommt die Zahl aus `TAKT_RELEASE_VERSION`, also dem Git-Etikett. Sicherheitsrelevant daran ist A-V-15: Läse die Hülle die Fassung aus einer Datei neben der ausführbaren Datei, könnte A-03 sie herabsetzen und Takt dauerhaft eine Aktualisierungsaufforderung zeigen lassen — auf einen Knopf, bei dem der Benutzer darauf eingestellt ist, eine **unsignierte** Datei zu holen und auszuführen. | Orchestrator (E-065), frontend-dev (A-V-15) |
| **T-136-4** | Hinweis | Die übersprungene Fassung ist Benutzereingabe (VG-6) und für jeden schreibbar, der das Sitzungsgeheimnis hat. Auflage: beim **Lesen** gegen A-V-8 prüfen; ungültig heißt „nichts übersprungen", führt zu keinem Wurf und geht in keine Adresse. Schaden im schlimmsten Fall: ein unterdrückter Hinweis. | domain-dev (T-138) |
| **T-136-5** | Hinweis | Die Anfragebegrenzung von GitHub (60/h für nicht angemeldete Aufrufer) gilt **je Quelladresse**. Hinter einem NAT teilen sich alle Takt-Installationen eines Hauses das Kontingent → `403` → stiller Fehlschlag. Verhalten richtig, Zuverlässigkeit sinkt mit der Verbreitung. Gehört ins Entwicklerhandbuch. | documenter (T-141) |
| **T-136-6** | Hinweis | Semgrep Guardian achtmal nicht erreichbar, 42Crunch siebenmal ohne Werkzeug. Lieferkette und OpenAPI-Bewertung bleiben ungemessen — bei einem Vorhaben, das erstmals nach außen spricht, ist die Lieferkette die Lücke, die man am wenigsten möchte. | Auftraggeber, Orchestrator |

---

## 8. Restrisiko

1. **Die Anfrage ist das Lebenszeichen.** A-18.12 ist über den *Inhalt* einlösbar und über die
   *Existenz* der Anfrage nicht. Der Satz „alles bleibt auf diesem Rechner" braucht ab jetzt einen
   Nachsatz im Benutzerhandbuch.
2. **Ein TLS-abschließender Unternehmens-Proxy sieht alles.** Takt kann das weder verhindern noch
   bemerken, ohne eine Zertifikatsbindung mitzubringen — eine eigene, größere Entscheidung.
3. **Der Bestand ist die Quelle der Wahrheit, und die Erzeugnisse sind unsigniert.** Wer das
   GitHub-Konto übernimmt, veröffentlicht eine Fassung, auf die Takt zeigt. Die Prüfsummen in der
   Beschreibung stammen aus derselben Quelle. Alle Auflagen schützen den Weg, nicht das Ziel.
4. **Es gibt keinen Schalter, der die Prüfung abstellt.** Siehe offene Frage 1.

---

## 9. Annahmen

1. **Adresse:** `https://api.github.com/repos/KuyomieKurama/SuperTakt/releases/latest`. A-18.3
   sagt „die Releases des Bestands" und legt die Schreibweise nicht fest. Ich habe die
   maschinenlesbare gewählt, weil die HTML-Seite `…/releases/latest` mit `302` antwortet und unter
   der Auflage A-V-3 damit **nie** benutzbar wäre. Sie schließt zudem Entwürfe und Vorabfassungen
   aus, was A-18.2 trifft.
2. **Zahlen:** 5 000 ms, 65 536 Bytes, 24 h, 60 min, 94 Zeichen. Jede ist im Bedrohungsmodell mit
   ihrem Grund hinterlegt. Der Auftraggeber hat keine genannt; ohne Zahl wäre die Auflage keine.
   Die 65 536 hängen an einer Schätzung der echten Antwortgröße (~15 KiB) — T-138 misst sie einmal
   gegen die echte Adresse und schreibt sie in den Bericht.
3. **`user-agent: Takt` ohne Fassungsnummer.** GitHub verlangt eine Kennung; die Adresse nennt den
   Bestand ohnehin. Die Fassungsnummer wäre genau die Angabe aus R-19 Punkt 3 und für die Anfrage
   nicht nötig.
4. **Vorabkennung gilt als kleiner** als dieselbe Fassung ohne (`1.2.3-rc.1 < 1.2.3`). Sonst
   meldete sich `1.2.3` gegenüber einer installierten `1.2.3-rc.1` nicht.
5. **Der Verweis in der Oberfläche ist ein Knopf, kein `<a href>`.** Ein Anker würde den Webview
   selbst zu github.com navigieren; einen `on_navigation`-Wächter gibt es in der Hülle nicht. Die
   Adresse darf als Text danebenstehen — sie ist lokal gebaut.
6. **Ich habe keine Route benannt.** `GET /api/v1/version` steht als Beispiel im Modell, nicht als
   Vorgabe; die Benennung ist Sache von T-138 und dem Orchestrator (Modulregistrierung).

---

## 10. Offene Fragen an den Orchestrator

1. **Soll die Versionsprüfung abschaltbar sein?** A-18 verlangt keinen Schalter, E-064 verbietet
   ein „nie wieder fragen" nur für den **Hinweis**, nicht für die Prüfung. Ein Benutzer ohne
   Internet merkt nichts (der Fehlschlag ist still); ein Benutzer, der aus Datenschutzgründen
   keine ausgehende Verbindung möchte, hat keine Möglichkeit. Das ist eine Produktfrage. Ich
   erfinde keine Anforderung — Entscheidung des Auftraggebers.
2. **T-136-2:** Textnachtrag in `CLAUDE.md`/E-064 oder Wächter über die `csp`-Zeichenkette? Der
   Wächter ist die Antwort, die nicht wieder veraltet, kostet aber eine Aufgabe bei frontend-dev.
3. **T-136-3:** Soll E-065 den Satz über `TAKT_RELEASE_VERSION` bekommen? Sicherheitsrelevant ist
   nur A-V-15; die Entscheidung selbst ist unpräzise, nicht falsch.
4. **Die 42Crunch- und Guardian-Tore** (T-136-6) sind zum achten Mal nicht einlösbar. Abschnitt 8
   führt sie weiterhin als **nicht erfüllt**. Zugang beschaffen oder das Tor durch eine benannte
   Ersatzprüfung ersetzen — als erfüllt geführt werden darf es nicht.

---

## 11. Nächster Schritt

T-138 und T-139 in Welle Q gegen die Auflagen aus Abschnitt 18.9 bauen, T-140 gegen die Prüfungen
27 bis 34 aus Abschnitt 7. Danach **Wiedervorlage dieses Abschnitts**: dann wird gegen Code
gemessen, was hier gegen einen Entwurf gefordert ist — Auflage für Auflage, mit den Zahlen aus
18.9.

Zwei Dinge, die vor dem Bau billig sind und danach teuer:

* **T-136-2** (Wächter über die CSP) — er misst ab dann eine Zusage, die ab jetzt bei jeder
  Freigabe geprüft wird.
* **A-V-17** als Prüfung, nicht als Vorsatz: `grep -n "shell:" apps/desktop/src-tauri/capabilities/*.json`
  bleibt leer. Eine Zeile dort ist der Unterschied zwischen einem Öffnen-Befehl und einer offenen
  Weiterleitung in den Browser des Benutzers.

---

## 12. Benutzte Befehle

```
semgrep --config p/nodejsscan --config p/typescript --metrics=off --error --json \
  -o <bericht>.json apps/local-api/src apps/desktop/src apps/web/src packages
```

Die sieben eigenen Messungen liefen als kurze Node-Skripte im Prüfverzeichnis
(`AbortSignal.timeout`, `redirect: 'error' | 'manual' | 'follow'`, gzip-Bombe, ausgehende
Kopfzeilen, 500 000 URL-Zusammensetzungen, `JSON.parse` mit tiefer Verschachtelung,
`typeof`-Fälle). Sie haben nichts im Arbeitsbaum angefasst.
