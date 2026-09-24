# T-125 — Freigabe Welle J bis L, und die Frage, wie eine Regression fünf Wellen überdauert

Aufgabe: T-125 — Freigabe Welle J bis L, und die Frage, wie eine Regression fünf Wellen überdauert
Prüfumfang: `git diff 71c6695..c96a2b2` — Wellen I (T-113 bis T-116), J (T-117, T-118),
K (T-119 bis T-122). 68 geänderte Dateien, davon 54 übersetzbare Quelldateien.
**Bewerteter Stand: `c96a2b2`.** Datum: 2026-09-04. Verantwortlich: security-checker.
Urteil: **freigegeben.**

---

## 0. Was tatsächlich gelaufen ist

Damit niemand ein Prüfergebnis annimmt, das es nicht gibt.

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI 1.166.0, `p/secrets p/security-audit p/typescript p/owasp-top-ten` über die 54 geänderten Quelldateien | **ja** | 156 Regeln, 54 Ziele, **0 Befunde**, ~99,9 % geparst. Aus `p/secrets` null Treffer. **Keine Teilparser-Meldung mehr** — der Nebeneffekt aus T-112-H2 ist weg. |
| Semgrep Guardian — SAST, Geheimnisse, Lieferkette | **nein** | `Not logged into Semgrep Guardian.` Zum **siebten** Mal, seit T-003 unverändert. Kein Plattformbefund, weder positiv noch negativ. Kein Ersatz vorgetäuscht. |
| 42Crunch-Audit, 42Crunch-Scan | **nein** | `42c-ast` nicht auffindbar, `~/.42crunch` existiert nicht. Die Beschreibung liegt vor (5417 Zeilen); das Hindernis ist ausschließlich das Werkzeug. |
| Eigene Messungen (Abschnitte 1 bis 5) | **ja** | Codepunktsuche über **jede** der 604 versionierten Dateien; Auszählung der Prosafassungen der Zeichenklasse über den YAML-Leser des Projekts; Verhalten von `server.close()` unter einer offenen lokalen Verbindung auf diesem Node; Diff je Pfad; Muster für Zugangsdaten, Call-Nummern und E-Mail-Adressen; Lesen der Wächter und Ausmessen ihrer Reichweite |
| `pnpm proof:access`, `proof:openapi`, `proof:addin`, `pnpm test`, `pnpm test:e2e` | **nein** | Zum Zeitpunkt der Messung arbeiteten integration-dev und frontend-dev parallel in `apps/outlook-addin/**` und `apps/web/**`; `proof:access` Abschnitt 13 misst Zeitverhalten und wird unter fremder Last falsch rot (von T-122 gemessen). **Ich habe die Zahlen der anderen Berichte nicht als eigene ausgegeben.** Statt eines Laufs habe ich den Quelltext der Wächter gelesen und ihre Reichweite ausgemessen — für die Frage dieser Aufgabe ist das ohnehin die schärfere Messung: Ein grüner Lauf sagt nichts darüber, **was** ein Wächter deckt. |

Die Definition of Done ist an einem Punkt erfüllt („Semgrep ohne Befunde hoher Schwere") und an
einem unverändert **nicht erfüllbar** („42Crunch über der Schwelle"). Das steht seit T-023 und ist
eine Beschaffungsentscheidung, kein Befund dieses Branches.

**Zum Stand:** Der Arbeitsbaum war bei meiner Messung sauber bis auf `board.md`. Während der
Prüfung haben integration-dev und frontend-dev abgelegt und dabei drei meiner Befunde geschlossen.
Das ist in Abschnitt 6 **gemessen** festgehalten und gehört formal in die nächste Runde; bewertet
ist `c96a2b2`.

---

## 1. Trägt die geteilte Fassung die Antwort? (Auftragspunkt 1)

### 1.1 Für den ausführbaren Teil: ja, und gut gebaut

`packages/domain/src/characters.ts` führt die Klasse als **Codepunktbereiche**. Vier Stellen lesen
sie, statt sie zu kopieren — nachgesehen, nicht abgeschrieben:

```
apps/local-api/src/http/input.ts:15-17,140      hasForbiddenNameCharacter, FORBIDDEN_NAME_CHARACTER_MESSAGE
apps/local-api/src/access/session-secret.ts     isPlausibleUserName über dieselbe Funktion (T-122)
apps/local-api/src/routes/addin/schema.ts:128   title: titleSchema
apps/local-api/src/routes/addin/schema.ts:168   tagNames: z.array(nameSchema).max(ADDIN_TAG_NAMES_MAX)
```

Dazu zwei **abgeleitete** Wächter, die eine Abweichung rot machen, ohne dass jemand daran denken
muss: `proof:openapi` Abschnitt 16 hält `titleSchema` über `0x0000`–`0x20FF` gegen
`isForbiddenNameCharacter`; `proof:addin` Abschnitt 17 sammelt aus der Add-in-Tür über die ganze
BMP, was sie abweist, und hält `dropHidden` und `visibleText` dagegen. Beide **fragen**.

Die drei Begründungen in `characters.ts` für Zahlen statt eines `RegExp` sind die tragenden, nicht
Geschmack: `lastIndex` bei `g` macht ein geteiltes Objekt unbrauchbar für `test`; Escape-Folgen sind
die zweitbeste Fassung (T-112-H2); und eine Liste von Bereichen lässt sich **lesen** — von einem
Nachweis, von einer Beschreibung. „Ein Ausdruck lässt sich nur ausführen oder abschreiben, und
Abschreiben ist der Fehler, gegen den diese Datei geschrieben ist." Das ist genau richtig, und
`proof:openapi` Abschnitt 16 macht davon Gebrauch.

### 1.2 Für den nicht ausführbaren Teil: an `c96a2b2` nein

Vollständige Bilanz aller Träger des bewerteten Standes, mit der Frage, ob ein Wächter darüber
läuft:

| Träger | Art | Wächter |
|---|---|---|
| `packages/domain/src/characters.ts` | **maßgeblich** | — |
| `http/input.ts`, `access/session-secret.ts`, `routes/addin/schema.ts` | liest | `proof:openapi` 16, `proof:access` 0b/0c, `proof:addin` 16/17 |
| `apps/outlook-addin/src/text/hidden.ts:83` | **zweite Fassung** (`HIDDEN_SOURCE`) | `proof:addin` 17 — misst, greift |
| `proof-addin.mjs:3359-3380` (`ABGEWIESENE_ZEICHEN`) | 20 abgeschriebene Codepunkte | nur **Teilmengenprüfung** — kann unvollständig werden, nicht falsch |
| `proof-addin.mjs`, `istLeerraum` | Abschrift von `CONTROL_WHITESPACE` | keiner, fällt aber laut aus |
| OpenAPI `UnprocessableEntity.description` | Prosa | `proof:openapi` 16 |
| OpenAPI `/addin/todos` → `title.description` | **Prosa** | **keiner** |
| OpenAPI `/addin/todos` → `tagNames.description` | **Prosa** | **keiner** |
| `routes/addin/schema.ts:88-91` (Kommentar) | Prosa, unvollständig | keiner |
| `input.test.ts`, `hidden.test.ts` | Randfälle | prüfen Ränder, nicht die Klasse — und sollen es auch nicht |
| `docs/bedrohungsmodell.md` 15, 16.4 (zweimal) | Prosa, unvollständig | keiner — mit dieser Prüfung nachgezogen |

Die Prosafassungen habe ich über den **YAML-Leser des Projekts** ausgezählt, damit es dieselbe Sicht
ist wie die des Wächters, und gegen die elf Grenzen aus `FORBIDDEN_NAME_CHARACTERS` gehalten:

```
Grenzen: U+0000, U+001F, U+007F, U+009F, U+061C, U+200E, U+200F, U+202A, U+202E, U+2066, U+2069
Prosafassungen an c96a2b2: 3 — alle drei zu diesem Zeitpunkt vollständig
vom Wächter gelesen:       components.responses.UnprocessableEntity.description   (1 von 3)
```

**Warum das kein Formalismus ist.** Die beiden ungewachten waren genau die beiden, die schon einmal
auseinandergelaufen sind: T-119 musste dort die drei Marken aus T-117 von Hand nachtragen — „hier
mit T-119 nachgetragen" stand wörtlich in beiden. **Der Wächter deckte die eine Fassung, die nie
abgewichen ist, und keine der beiden, die es getan hatten.** Das war Befund T-125-2.

**Und eine Zusicherung war unwahr.** `UnprocessableEntity.description` sagte an `c96a2b2`: „das
Add-in liest dieselbe Fassung, statt sie abzuschreiben." `apps/outlook-addin/src/text/hidden.ts`
hatte zu diesem Zeitpunkt **keine einzige `import`-Zeile**. Der Grund, der dort für die Doppelung
stand — der Aufgabenbereich dürfe `@takt/local-api` nicht führen —, galt seit T-122 nicht mehr: Die
Klasse liegt nicht mehr dort, und `@takt/domain` steht in der Abhängigkeitsliste des Add-ins. Das
war Befund T-125-1, und es ist dieselbe Klasse wie der Kommentar aus T-112-1: **eine zugesicherte
Gleichheit, die es nicht gibt, sagt dem nächsten Leser ausdrücklich, er brauche nicht nachzusehen.**

### 1.3 Fünf Wellen — die eigentliche Antwort auf die Frage des Auftrags

Die Regression hat nicht überdauert, weil niemand hingesehen hätte. Sie hat überdauert, weil an
jeder Stelle **etwas** hingesehen hat: Abschnitt 16 des Nachweispfads war grün, der Kommentar sagte
„dasselbe Schema", die Beschreibung nannte die Klasse. Drei Zeugen — und alle drei sagten dasselbe
aus derselben Quelle, einer Abschrift. Ein Zeuge, der eine Abschrift befragt, sagt nichts über die
Wirklichkeit aus; drei davon sagen dreimal nichts, und der Eindruck von Deckung wächst mit ihrer
Zahl.

Erst T-119 hat einen Zeugen gebaut, der die Tür selbst fragt. **Die Bedingung dafür, dass sich das
nicht wiederholt, ist deshalb nicht mehr Wachsamkeit, sondern ein Zustand: Jeder Träger liest oder
wird gemessen.** Eine Beschreibung kann nicht importieren — also muss sie gemessen werden. An
`c96a2b2` wurde eine von drei gemessen, und die zwei ungemessenen waren die, die schon einmal
gewandert waren. Das ist der Grund, warum ich die beiden als „sollte" und nicht als Hinweis geführt
habe: Die Bauart, die die Regression getragen hat, stand an derselben Stelle noch einmal.

---

## 2. Der verwaiste Sidecar (Auftragspunkt 2, erster Teil)

### 2.1 Was ein Dienst, der die Hülle überlebt, für die Vertrauensgrenze bedeutet

Die Reihenfolge in `main.ts` ist der Kern: `server.listen` steht bei `:217`, `watchParentLink` bei
`:283`. **Der Dienst hört auf `127.0.0.1:17843`, bevor der Wächter über die Elternverbindung
angemeldet ist.** Dazwischen liegen Migration, Bestandssicherung und das Zertifikat des
Aufgabenbereichs — Sekunden. Ein Dienst, der den Elternprozess überlebt, ist deshalb nicht bloß ein
hängender Prozess:

- Er ist **für jeden Prozess auf dem Rechner erreichbar** (VG-1) und hält den Datenbestand offen,
  ohne dass ein Fenster ihn zeigt. Die einzige Anzeige, an der ein Benutzer bemerken könnte, dass
  Takt noch läuft, ist weg.
- Er hält **den Port**. Takt weicht bewusst nicht auf einen anderen aus (`sidecar.rs:312`, B-1.5),
  weil sich sonst ein fremdes Programm als Takt ausgeben könnte — ein verwaister Sidecar macht damit
  jeden weiteren Start unmöglich, und der Benutzer liest „Der Port 17843 ist belegt", ohne dass ein
  Fenster offen wäre, das er schließen könnte.
- Er hat das **Sitzungsgeheimnis** der beendeten Sitzung noch im Speicher, und der Add-in-Weg
  (17844) steht ebenfalls weiter.

Deshalb ist B-1.6 Punkt 3 keine Aufräumfrage, sondern die Bedingung dafür, dass „lokal" überhaupt
eine Grenze beschreibt: **Die Lebensdauer des Dienstes ist die Lebensdauer der Sitzung**, und alles
andere in diesem Modell hängt daran. Dass der Fund an einem Prozess gemacht wurde, der den Port
hielt, ist kein Zufall — das ist die Stelle, an der man es merkt.

### 2.2 Die Behebung ist richtig, und sie sitzt an der Ursache

`input.pause()` im Handschlag lässt das Dateiende ungelesen liegen, bis `watchParentLink` es mit
seinem `resume()` abholt; und wer sich an einem bereits beendeten Strom anmeldet
(`readableEnded || destroyed`), bekommt die Meldung sofort. Zwei unabhängige Zeilen für einen Fall,
und das ist hier angemessen, weil die eine über Zeitverhalten urteilt: Die erste verhindert den
Verlust, die zweite fängt ihn ab.

### 2.3 Ist `proof:access` Abschnitt 0d der richtige Wächter? Fast

Er ist deutlich besser als sein Vorgänger: Er schließt die Röhre **unmittelbar nach dem
Handschlag**, ohne auf `/health` zu warten, hängt damit nicht am Zeitverhalten des Rechners, und die
Gegenprobe ist gefahren („ohne Behebung rot"). Mit 0c und 15 sind drei Punkte des Lebenslaufs
abgedeckt. Zwei Dinge sieht er nicht:

1. **Er misst einen Zeitpunkt, nicht das Fenster.** Der Fehler lag zwischen `finish()` und
   `watchParentLink`; 0d trifft dieses Fenster sicher, aber nur an seinem Anfang. Verzeihlich — der
   Anfang ist die schärfste Stelle — und der Grund, warum die Behebung an der Ursache mehr wert ist
   als der Nachweis.
2. **Er misst mit einer stillen Leitung.** Kein Abschnitt schließt die Röhre, während eine
   Verbindung auf 17843 offen ist. Genau dann hält `shutdown()` nicht Wort — Befund T-125-4.

### 2.4 Befund T-125-4 — `shutdown()` hat keine Frist

`main.ts:275-281` ruft `taskpane?.close()`, `database?.close()` und dann
`server.close(() => process.exit(0))`. Der **einzige** Weg zu `process.exit(0)` führt durch diesen
Rückruf, und `server.close()` wartet auf die offenen Verbindungen. Gemessen auf dem Node dieses
Rechners (v22.23.2, eigener Server auf einem flüchtigen Port, damit 17843 unbelegt bleibt):

```
keepAliveTimeout 5000   headersTimeout 60000   requestTimeout 300000
ein lokaler Prozess verbindet sich und schickt einen unvollständigen Kopf
→ close() hat nach 8000 ms nicht zurückgerufen; der Prozess läuft weiter
→ Schranke: headersTimeout (60 s), bei stockendem Rumpf requestTimeout (300 s)
```

**Was das entschärft, ebenfalls gemessen:** Der Lauscher ist sofort weg — ein zweiter Server bindet
denselben Port unmittelbar nach `close()` wieder. `database.close()` und `taskpane.close()` sind
vorher gelaufen. Der überlebende Prozess hält **weder den Port noch einen offenen Datenbestand**;
die schweren Folgen aus 2.1 treten nicht ein. Genau deshalb ist es ein Hinweis und kein „sollte" —
ich hatte es zuerst höher eingestuft und nach der Messung heruntergesetzt.

**Was bleibt:** B-1.6 Punkt 3 sagt „der Sidecar überlebt die Hülle nicht". Der Satz gilt heute mit
einer Fußnote — *es sei denn, ein lokaler Prozess entscheidet anders* —, und ein lokaler Prozess ist
genau der Akteur, gegen den dieses Modell geschrieben ist. Er kann das Ende um bis zu fünf Minuten
verzögern, ohne ein Geheimnis zu kennen; eine TCP-Verbindung und ein halber Kopf genügen.
**Gegenmittel:** `server.closeAllConnections()` vor `server.close(…)` und ein
`setTimeout(() => process.exit(0), …).unref()` als Boden. **Nachweis:** ein Abschnitt 0e, der die
Röhre mit **einer offenen Verbindung** schließt. **Zuständig: domain-dev.**

### 2.5 Der Beendigungscode 1 — behoben, und mehr als Kosmetik

`end` und `close` feuerten beide auf derselben Röhre, `onLost` lief zweimal, das zweite
`database.close()` warf `ERR_INVALID_STATE`, und ein Wurf aus einem Ereignisbehandler endet mit
Code 1. Die Hülle liest diesen Code, um den Grund zu **unterscheiden** (74 Port, 78 Konfiguration,
sonst „unerwartet beendet", `sidecar.rs:304-333`). Eine 1 für ein ordentliches Anhalten ist damit
keine falsche Zahl, sondern eine **falsche Diagnose an den Benutzer** — und sie trat nicht bei jedem
Lauf auf, also genau die Sorte Meldung, der man beim nächsten Mal nicht glaubt. Zwei Sperren
(`reported`, `stopping`) machen das Anhalten idempotent, statt den Wurf zu fangen. Das ist die
richtige Bauart.

---

## 3. `WindowsUser` (Auftragspunkt 3)

### 3.1 Die Vorfrage ist gut beantwortet

`apps/desktop/src-tauri/src/identity.rs` holt den Wert unter Windows aus `GetUserNameW` und
`GetUserNameExW(NameSamCompatible)` — **nicht** aus `USERNAME`, **nicht** aus `USERPROFILE`,
**nicht** über einen Unterprozess `whoami`, und ohne Rückfall auf eine dieser Quellen, wenn der
Systemaufruf scheitert („Ein Wert, der von jedem setzbar ist, wäre schlechter als gar keiner: Er
sähe richtig aus."). Unter Unix `getpwuid(geteuid())` mit `trusted: false`. Damit ist die Frage aus
CLAUDE.md — Betriebssystem oder Benutzereingabe — eindeutig beantwortet: **kein vom Benutzer
setzbares Feld.** Das ist die eigentliche Antwort auf B-8.1.

### 3.2 Die Entscheidung „abweisen" ist richtig — aber nicht aus dem naheliegenden Grund

- **Bereinigen** hieße, unter einem Namen abzurechnen, den es nicht gibt. **Markieren** hieße,
  `U+FFFD` in die Abrechnungsdatei zu schreiben. Beides ergibt still eine Rechnung mit falschem
  Urheber; beides ist schlechter als ein lauter Nichtstart. So weit die Begründung aus T-122, und
  sie stimmt.
- **Der tragende Grund liegt daneben:** Auf Windows kann dieser Fall aus der genannten Quelle
  **nicht** entstehen — ein SAM-Konto verbietet Steuerzeichen. Greift `user_invalid` je, hat nicht
  der Benutzer einen ungewöhnlichen Namen, sondern **etwas hat in die Röhre geschrieben, was dort
  nicht hingehört.** `user_invalid` ist kein Namensprüfer, sondern ein **Manipulationssignal** — und
  ein Manipulationssignal beantwortet man nicht mit Weiterlaufen. Das macht die harte Variante zur
  einzig richtigen.
- **Was die Prüfung nicht leistet**, damit niemand mehr von ihr erwartet: Wer in die Röhre schreiben
  kann, schreibt `kollege.mueller` und keine Richtungsmarke. Gegen die Namensvertauschung aus B-8.1
  hilft sie nicht — dagegen hilft 3.1. Sie deckt die **Anzeige- und Kodierungsfolgen** eines Namens
  mit Richtungszeichen ab; der Wert geht unverändert in die Exportdatei (A-8.5) und steht in
  `GET /settings`.
- **Kein neuer Verweigerungsweg:** Die Röhre beschreiben kann allein die Hülle. Wer den Nichtstart
  auslösen kann, kann Takt ohnehin nicht starten lassen.
- **Der Wert steht in keiner Meldung** — richtig, er trägt genau die Zeichen, um die es geht
  (B-2.4, B-4.3 Punkt 5).

### 3.3 Die Folge, und wo sie an `c96a2b2` nicht ankam

Die Folge „der Benutzer kann seinen Windows-Namen nicht ändern" ist real, aber die betroffene Menge
ist auf Windows praktisch leer. Auf einer Unix-Entwicklungsmaschine ist sie es nicht — dort wäre ein
Konto mit einem C1-Zeichen konstruierbar, und Takt startete nicht. Entwicklungsfall, kein
Auslieferungsfall.

**Befund T-125-5.** Der ganze Grund für zwei getrennte Gründe war, dass der Benutzer an
verschiedenen Stellen sucht (T-122). `explain_exit` (`apps/desktop/src-tauri/src/sidecar.rs:318-327`)
hat **einen** Text für Code 78: „Der Dienst hat Startgeheimnis oder Windows-Benutzernamen **nicht
erhalten**". Für `user_invalid` ist das die falsche Auskunft — der Name ist angekommen und wurde
**zurückgewiesen**. Der Benutzer wird an die Stelle geschickt, an der nichts fehlt, und ein
Manipulationssignal verschwindet in einem Satz über etwas Fehlendes. Zu T-124 siehe Abschnitt 6:
frontend-dev hat den Fall von der anderen Seite gelöst, und besser als mit einem eigenen Code.

---

## 4. Bedrohungsmodell nachgezogen (Auftragspunkt 4)

`docs/bedrohungsmodell.md`, vier Änderungen, 383 Zeilen mehr.

| Stelle | Was |
|---|---|
| **15** (Zeile ~2726) | Nachtrag: Die Aufzählung ist der Stand von R-3a und unvollständig — es fehlen `U+061C`, `U+200E`, `U+200F` aus T-117. Verweis auf den einen Ort. Dazu: Der Satz „session-secret.ts trägt die passende Prüfung bereits ausgeschrieben" ist überholt, und zwar in der guten Richtung — die Datei trägt sie nicht mehr, sie liest sie. |
| **16.4** (Zeile ~2965) | Nachtrag zur zweiten unvollständigen Aufzählung, mit den geprüften Zeilennummern von `input.ts`. |
| **16.4** (Zeile ~3007) | Nachtrag: Der Befund ist geschlossen, **und das Gegenmittel war an zwei Stellen falsch** — `withoutControlCharacters` war nicht exportiert, und `readJson` ist in `routes/addin/index.ts` lokal definiert statt importiert. Beides steht dort, damit die nächste Prüfung es nicht abschreibt. |
| **neu: Abschnitt 17** | Die vollständige Prüfung dieser Welle, 17.0 bis 17.9, einschließlich der Nachmessung dessen, was während der Prüfung zugefallen ist. |

**Warum wieder Nachträge und keine Überschreibungen.** 15 und 16.4 sind Protokolle zweier Prüfungen
zu zwei Ständen. Wer sie umschreibt, macht aus einem Protokoll eine Behauptung über die Gegenwart
und verliert die Spur, an der man sieht, **wann** die Klasse gewachsen ist. Genau diese Spur ist der
Gegenstand dieser Aufgabe.

**Die Berichtigung aus E-063 steht jetzt im Modell** (17.5): `unicode-bidi: isolate` allein reicht
nicht — es trennt den Block von seiner Umgebung, aber innerhalb des isolierten Blocks wirkt ein
`U+202E` weiter (UBA X2–X5), und `bidi-override` öffnet nach denselben Regeln eine neue Ebene.
**Keine CSS-Eigenschaft nimmt einem Text ein Zeichen weg.** Es gehören zwei Hälften zusammen:
`<bdi>` schützt die **Umgebung**, `visibleText` nimmt dem **Inhalt** die Zeichen und setzt `U+FFFD`
an ihre Stelle. Das ist die Berichtigung meines eigenen Vorschlags aus T-114, und sie ist als solche
gekennzeichnet.

Zwei Flächen, die die Anzeigeseite bewusst nicht deckt, ebenfalls im Modell und **ohne Befund**:
`apps/web` hat kein `<bdi>` und kein `visibleText` (über den ganzen Baum gemessen: null Treffer) —
die eine fremde Fläche dort ist der interne Vermerk, den das Add-in mit E-Mail-Text vorbelegt und
der die Zeichenprüfung bewusst nicht trägt; er steht ausschließlich in einer `textarea`, also genau
an der Stelle, die E-063 Punkt 1 unangetastet lässt. Und der Altbestand: Die Prüfung sitzt am
Eingang, nicht am Bestand.

---

## 5. Geheimnisse und Kundendaten (Auftragspunkt 5)

- **Zugangsdaten.** Muster aus Schlüsselwort, Zuweisung und mindestens 16 Zeichen Ausweis über den
  Diff `71c6695..c96a2b2`: **null** Treffer. Semgrep `p/secrets`: null.
- **Call-Nummern.** Im Diff nur `TCK-000042` und `TCK-0000…` — erfunden, als Zählwert erkennbar.
- **E-Mail-Adressen.** Eine: `a.beispiel@beispiel.invalid`. `.invalid` ist die von RFC 2606 für
  genau diesen Zweck reservierte Endung. Richtig gewählt.
- **Lieferkette.** `pnpm-lock.yaml` im gesamten Diff **unverändert**. `package.json` ändert eine
  Zeile: `typecheck:test` nimmt `apps/outlook-addin/tsconfig.test.json` mit auf. Kein neues Paket.
- **Unsichtbare Zeichen (Trojan Source).** Codepunktsuche über jede der 604 versionierten Dateien.
  Neben den Symboldateien (Bilddateien, erwartet) drei Textstellen:

| Stelle | Bewertung |
|---|---|
| `packages/storage/src/sqlite/paging.ts:40` | **Befund T-125-6.** `const SEPARATOR` mit einem **rohen `U+0000`**. Git sieht die Datei als **Binärdatei** — sie fehlt in `git grep -I`, und ein `git diff` über sie zeigt keine Zeilen. Sie steht so seit dem allerersten Commit (`d9555d0`) und ist seither nie geändert worden: **kein Code-Review hat sie je lesen können.** Die Klasse aus T-112-H2, diesmal in Produktivcode. Fachlich harmlos — der Trenner fügt Zeitstempel und Kennung zu einer Blättermarke, keiner der beiden kann ein NUL tragen. Gegenmittel: Escape-Folge, und das Zeichen im Kommentar beim Namen nennen. **Zuständig: domain-dev.** |
| `.claude/team/reports/T-111-unit-tester.md:115` | **Hinweis T-125-H7**, rohes `U+0000`. Bericht, kein Code. |
| `.claude/team/reports/T-121-unit-tester.md:64, 221, 288` | **Hinweis T-125-H7**, rohe `U+200D`, `U+202E`, `U+061C`. Der Bericht sagt an `:288` selbst, ein Codepunktscan finde „keine rohen Exemplare" — richtig für die Testdatei, nicht für den Bericht. **Zuständig: unit-tester.** |

**T-112-H2 ist erledigt:** `input.test.ts` trägt kein rohes Zeichen mehr, und Semgrep parst die
Datei jetzt vollständig. Beides nachgemessen.

**Eigenprobe, die das Gewicht von T-125-6 besser belegt als jedes Argument.** Beim Schreiben dieser
Prüfung ist das rohe `U+0000` aus `paging.ts:40` **zweimal** in meine eigene Arbeit geraten: einmal
in einen Shell-Befehl, der deshalb abgewiesen wurde, und einmal in den Fließtext des
Bedrohungsmodells, wo es erst die Gegenmessung gefunden hat. Beide Male stammte es aus einer
Ausgabe, in der es wie ein Leerzeichen aussah. **Genau das ist der Schaden: Ein rohes Steuerzeichen
verbreitet sich beim Zitieren weiter, und niemand sieht dabei etwas.** Beide Dateien sind
anschließend über eine Codepunktsuche als frei nachgewiesen.

---

## 6. Nachmessung — was während dieser Prüfung zugefallen ist

integration-dev und frontend-dev haben während der Prüfung abgelegt. Der Arbeitsbaum ist **nicht**
der bewertete Stand; die Zahlen sind trotzdem gemessen, weil sie genau die Befunde betreffen, die
oben stehen. Sie gehören formal in die nächste Runde.

| Befund | Stand `c96a2b2` | Arbeitsbaum, gemessen |
|---|---|---|
| **T-125-1** | `hidden.ts` ohne jede `import`-Zeile, die Beschreibung sagt das Gegenteil | **geschlossen.** `hidden.ts` ist eine reine Wiederausfuhr: `export { HIDDEN_MARKER, dropHiddenCharacters as dropHidden, hasHiddenCharacter as hasHidden, visibleText } from '@takt/domain'`. Der Satz in `UnprocessableEntity.description` ist damit wahr. |
| **T-125-2** | 3 Prosafassungen, 1 gewacht | **geschlossen, auf dem zweiten der beiden vorgeschlagenen Wege.** Erneute Auszählung über den YAML-Leser: **1 Prosafassung**, und es ist genau die, die Abschnitt 16 liest. Der stehengebliebene Kommentar in `routes/addin/schema.ts:88-91` ist ebenfalls weg. |
| **T-125-3** | `ABGEWIESENE_ZEICHEN`, 20 abgeschriebene Codepunkte | **geschlossen.** `proof-addin.mjs` führt `FORBIDDEN_NAME_CHARACTERS` aus `@takt/domain` ein (`:162`) und rollt die Bereiche aus (`:3401-3406`). `istLeerraum` (`:3411`) bleibt als Abschrift von `CONTROL_WHITESPACE` — sie fällt bei einer Änderung laut aus und ist kein Befund. |
| **T-125-5** | `explain_exit` sagt „nicht erhalten" | **von der anderen Seite beantwortet, und besser.** `apps/desktop/src-tauri/**` ist unverändert. T-124 hat den Fall in der Oberfläche gelöst: `readUserNameFinding` (`apps/web/src/app/connection.ts`) fragt die Hülle nach dem Betriebssystembenutzer und wertet ihn mit **`hasForbiddenNameCharacter` aus `@takt/domain`** aus — keine zweite Fassung, ausdrücklich mit Verweis auf diese Regression. Der Name wird nicht behalten und steht in keiner Meldung (B-8.2 Punkt 1, B-4.3 Punkt 5); `"unknown"` statt `"ok"`, wenn die Frage nicht beantwortet werden kann. Das ist die bessere Antwort als ein eigener Beendigungscode: Sie **erklärt** den Fehlschlag, statt ihn zu kodieren. **Rest:** Der Satz in `explain_exit` bleibt für `user_invalid` sachlich falsch; ob er neben der neuen Fläche noch erscheint, ist eine Frage an spec-ux-reviewer und keine der Sicherheit. |

**Die Bilanz aus 1.2 im Arbeitsbaum:** Jeder Träger der Zeichenklasse liest jetzt entweder
(`input.ts`, `session-secret.ts`, `addin/schema.ts`, `hidden.ts`, `proof-addin.mjs`,
`connection.ts`) oder wird gemessen (`UnprocessableEntity.description` durch `proof:openapi` 16; die
Tür durch den BMP-Scan in `proof:addin` 17). Übrig bleiben die beiden Testdateien, die Ränder prüfen
und sollen, und `istLeerraum`, das laut ausfällt. **Damit trägt die geteilte Fassung die Antwort —
im Arbeitsbaum, nicht schon an `c96a2b2`.**

---

## 7. Befunde

| Kennung | Schwere | Ort | Zuständig | Stand |
|---|---|---|---|---|
| **T-125-1** | sollte | OpenAPI sichert zu, das Add-in lese die gemeinsame Fassung; `hidden.ts` schrieb an `c96a2b2` ab | integration-dev | **geschlossen** (6) |
| **T-125-2** | sollte | `proof-openapi.mjs` Abschnitt 16 las 1 von 3 Prosafassungen; ungewacht waren genau die beiden, die T-119 von Hand nachtragen musste | domain-dev, integration-dev | **geschlossen** (6) |
| **T-125-3** | Hinweis | `proof-addin.mjs` Abschnitt 16 war tautologisch und trug eine Abschrift, die nur unvollständig werden konnte | integration-dev | **geschlossen** (6) |
| **T-125-4** | Hinweis | `main.ts:275-281` — `shutdown()` ohne Frist; `server.close()` wartet auf offene Verbindungen (gemessen: >8 s, Schranke 60 s bzw. 300 s). Port und Datenbank sind frei, die schweren Folgen treten nicht ein. Gegenmittel: `closeAllConnections()` + `setTimeout(…).unref()`, Nachweis `proof:access` 0e mit offener Verbindung | domain-dev | **offen** |
| **T-125-5** | Hinweis | `sidecar.rs:318-327` — ein Text für Code 78, „nicht erhalten"; für `user_invalid` falsch | frontend-dev | **im Kern beantwortet** (6) |
| **T-125-6** | Hinweis | `packages/storage/src/sqlite/paging.ts:40` — rohes `U+0000` macht eine Produktivdatei für Git zur Binärdatei; seit `d9555d0` nie im Review lesbar | domain-dev | **offen** |
| **T-125-H7** | Hinweis | rohe unsichtbare Zeichen in `T-111-unit-tester.md` und `T-121-unit-tester.md` | unit-tester | **offen** |
| T-112-H1 | Hinweis | `usecases/pool-movement.ts` — ein `resolveAxes` je Regel, keine Obergrenze. In diesem Diff nicht verschlechtert | Auftraggeber, Orchestrator | unverändert offen |
| T-112-H3 | Hinweis | `apps/web/src/lib/errorText.ts` — Namen in **einem** Satz statt als eigene Knoten | frontend-dev | halb offen |
| S-1 (R-3a) | sollte, vor dem Push | Zweig `backup/status-als-regelterm-vor-filter`. Nur benannte Zweige pushen, nie `--all`, nie `--mirror` | Orchestrator | unverändert offen |

**Erledigt und nachgemessen:** T-112-1, T-112-H2, B-1.6 Punkt 3 im Startfenster, der
Beendigungscode 1 beim ordentlichen Anhalten.

---

## 8. Urteil

**Freigegeben für die Wellen J bis L.**

Die Wellen verkleinern die Angriffsfläche deutlich: eine Zeichenklasse an einem Ort statt an zweien,
vier Stellen, die lesen statt abzuschreiben, zwei abgeleitete Wächter, die eine Abweichung rot
machen, der Windows-Benutzername unter derselben Klasse mit eigenem Grund, die Anzeigeseite nach
E-063 vollständig gebaut, und ein verwaister Sidecar aus der Welt — an der Ursache. Kein neuer
Zugriffsweg, keine neue Route, keine neue Abhängigkeit, keine Lieferkettenänderung. Semgrep meldet
über 54 geänderte Quelldateien null Befunde.

Die beiden Auflagen der Stufe „sollte" waren T-125-1 und T-125-2 — derselbe Satz zweimal: Die Lehre
aus E-063 Punkt 4 war im Quelltext angekommen und in der Beschreibung noch nicht. Beide sind
während dieser Prüfung geschlossen worden; die Freigabe steht damit **ohne Auflage**. Was offen
bleibt, sind vier Hinweise, von denen keiner eine Vertrauensgrenze berührt.

Das Tor aus Abschnitt 8 des Modells bleibt an zwei Stellen uneinlösbar: kein 42Crunch-Auditwert, und
Semgrep Guardian zum **siebten** Mal nicht erreichbar. Beides ist eine Beschaffungsentscheidung und
kein Befund dieses Branches.

---

## 9. Kurzfassung

```
Aufgabe: T-125 — Freigabe Welle J bis L, und die Frage, wie eine Regression fünf Wellen überdauert
Status: fertig — freigegeben

Artefakte: docs/bedrohungsmodell.md (neuer Abschnitt 17.0–17.9; Nachträge in 15 und zweimal
           in 16.4; +383 Zeilen), .claude/team/reports/T-125-security-checker.md

Zusammenfassung: Die geteilte Fassung aus T-122 trägt die Antwort für den ausführbaren Teil —
vier Stellen lesen characters.ts, und zwei abgeleitete Wächter fragen die Tür, statt sie
abzuschreiben. Für den nicht ausführbaren Teil trug sie sie an c96a2b2 nicht: Die Klasse stand
noch in drei Prosafassungen der OpenAPI, von denen der Wächter genau eine las — und die beiden
ungewachten waren die, die T-119 nach der Regression von Hand nachtragen musste; dazu sicherte
die Beschreibung zu, das Add-in lese die gemeinsame Fassung, während hidden.ts keine einzige
import-Zeile hatte. Der verwaiste Sidecar ist an der Ursache behoben, und die Bewertung dazu
gehört ins Modell: server.listen steht bei main.ts:217, watchParentLink bei :283 — der Dienst
hört auf 127.0.0.1, bevor der Wächter angemeldet ist, und ein Dienst ohne Fenster hält Port,
Datenbestand und Sitzungsgeheimnis. Die Entscheidung zum Windows-Benutzernamen ist richtig, aber
aus einem anderen Grund als dem genannten: Der Wert kommt aus GetUserNameW, ein solcher Name
kann von dort nicht kommen, also ist user_invalid kein Namensprüfer, sondern ein
Manipulationssignal — und das beantwortet man nicht mit Weiterlaufen. Während der Prüfung haben
integration-dev und frontend-dev drei der Befunde geschlossen; das ist gemessen in Abschnitt 6
und gehört in die nächste Runde.

Befunde:
  sollte (beide während der Prüfung geschlossen, gemessen in Abschnitt 6)
    T-125-1  OpenAPI sichert zu, das Add-in lese die gemeinsame Fassung; hidden.ts schrieb an
             c96a2b2 ab. Dieselbe Klasse wie der Kommentar aus T-112-1. (integration-dev)
    T-125-2  proof-openapi.mjs Abschnitt 16 las 1 von 3 Prosafassungen der Zeichenklasse; die
             beiden ungewachten waren genau die, die schon einmal abgewichen sind.
             (domain-dev, integration-dev)
  Hinweis
    T-125-4  main.ts:275-281 — shutdown() ohne Frist. server.close() wartet auf offene
             Verbindungen; gemessen auf Node v22.23.2: ein lokaler Prozess mit halbem
             Anfragekopf verhindert den Rückruf über 8 s hinaus, Schranke 60 s bzw. 300 s.
             Port und Datenbank sind zu diesem Zeitpunkt frei — B-1.6 Punkt 3 gilt mit der
             Fußnote „es sei denn, ein lokaler Prozess entscheidet anders". Gegenmittel:
             closeAllConnections() + setTimeout(…).unref(); Nachweis: proof:access 0e mit
             einer offenen Verbindung. OFFEN. (domain-dev)
    T-125-6  packages/storage/src/sqlite/paging.ts:40 — rohes U+0000 macht eine Produktivdatei
             für Git zur Binärdatei; seit dem ersten Commit nie im Review lesbar. Fachlich
             harmlos, Gegenmittel eine Escape-Folge. OFFEN. (domain-dev)
    T-125-5  sidecar.rs:318-327 — ein Text für Code 78 („nicht erhalten"); für user_invalid
             falsch. T-124 hat den Kern von der anderen Seite gelöst. (frontend-dev)
    T-125-H7 rohe unsichtbare Zeichen in T-111- und T-121-unit-tester.md. OFFEN. (unit-tester)
  unverändert offen
    T-112-H1, T-112-H3, S-1 (Sicherungszweig — nur benannte Zweige pushen)

Annahmen:
  1. Bewertet ist c96a2b2. Was integration-dev und frontend-dev während der Prüfung abgelegt
     haben, ist gemessen und als nächste Runde ausgewiesen, nicht in die Bewertung gezogen.
  2. Die portgebundenen Nachweispfade nicht gefahren, obwohl 17843/17844 frei waren: Zwei
     Agenten arbeiteten parallel, und proof:access Abschnitt 13 misst Zeitverhalten. Für die
     Frage dieser Aufgabe ist das Lesen der Wächter ohnehin die schärfere Messung — ein grüner
     Lauf sagt nichts darüber, was ein Wächter deckt.
  3. T-125-4 zuerst als „sollte" eingestuft und nach der Messung auf „Hinweis" gesetzt: Der
     Lauscher ist nach close() sofort weg, die Datenbank vorher geschlossen.
  4. Die drei alten Stellen im Modell als Nachtrag richtiggestellt statt überschrieben — sie
     sind Protokoll, und die Spur, wann die Klasse gewachsen ist, ist der Gegenstand.

Risiken:
  - Die Wächter decken jetzt jeden Träger, aber sie decken keine Stelle, die es noch nicht
    gibt. Wer eine vierte Fläche für fremden Text baut, ist wieder allein verantwortlich.
    Die billige Vorsorge: jede neue Prosafassung der Klasse verweist auf den einen Ort, statt
    die Liste zu wiederholen.
  - apps/web hat kein <bdi> und kein visibleText. Heute richtig — die eine fremde Fläche dort
    ist der interne Vermerk, und der steht in einer textarea. Wird er je als Absatz angezeigt,
    ist das die Stelle, an der visibleText gebraucht wird.
  - Der Altbestand: Die Zeichenprüfung sitzt am Eingang, nicht am Bestand. Titel von vor T-114
    können die Klasse tragen. Auf dieser Maschine nicht bekannt, die Anwendung ist nicht
    ausgeliefert — vor der ersten Auslieferung ist das keine Frage mehr, danach schon.
  - Semgrep Guardian zum siebten Mal nicht erreichbar, 42Crunch weiter ohne Werkzeug. Das
    Sicherheitstor aus Abschnitt 8 des Modells ist damit seit T-023 nicht vollständig
    einlösbar, und das ist keine Feststellung, die durch Wiederholung besser wird.

Offene Fragen:
  1. T-125-4 und T-125-6 gehören beide domain-dev und sind beide klein. In dieselbe Aufgabe
     oder getrennt? Sie haben nichts miteinander zu tun außer dem Zuständigen.
  2. Soll explain_exit in sidecar.rs für user_invalid einen eigenen Satz bekommen, oder ist
     der Fall mit der Fläche aus T-124 abschließend beantwortet? Das ist eine UX-Frage
     geworden, keine Sicherheitsfrage — spec-ux-reviewer wäre der richtige Adressat.
  3. Guardian und 42Crunch: Beschaffung oder ausdrücklicher Verzicht? Solange beides offen
     steht, trägt jeder Sicherheitsbericht eine Zeile, die nie grün wird.

Nächster Schritt: T-125-4 und T-125-6 an domain-dev — zwei kleine Änderungen mit je einem
Nachweis (proof:access Abschnitt 0e mit offener Verbindung; Escape-Folge in paging.ts, danach
ist die Datei für Git wieder Text und im Review lesbar). Danach ist von dieser Prüfung nichts
mehr offen, was Code betrifft.
```
