# T-122 — Eine Zeichenklasse, ein Ort; und der Windows-Benutzername

```
Aufgabe: T-122 — Eine Zeichenklasse, ein Ort; und der Windows-Benutzername
Status: fertig
```

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (E-042, E-045, E-053, E-058, E-063), die
Berichte T-117 (R2, offene Frage 1) und T-119 (Regression, offene Frage 1), dazu T-110 (offene
Frage 1) und T-118 (Abschnitt „Offene Fragen" 3) für B-11.

---

## 1. O-AI — die Zeichenklasse liegt einmal im Baum

**`packages/domain/src/characters.ts`** ist die maßgebliche Fassung. Sie führt die Zeichen als
**Codepunktbereiche** und nicht als regulären Ausdruck, und daran hängen drei Dinge, die in
diesem Projekt schon Arbeit gekostet haben:

- Ein Ausdruck mit `g` merkt sich `lastIndex`. Ein geteiltes `RegExp`-Objekt gäbe abwechselnd
  `true` und `false` auf denselben Wert — wer die Klasse teilen will, müßte zwei Ausdrücke oder
  eine Fabrik teilen. Zahlen haben das Problem nicht.
- Escape-Folgen in einer Zeichenkette sind die zweitbeste Fassung (T-112-H2). Zahlen sind gar
  keine Zeichen; die Datei enthält kein rohes Steuer- oder Richtungszeichen, gemessen.
- Eine Liste von Bereichen läßt sich **lesen** — von einem Nachweis, von einer Beschreibung. Ein
  Ausdruck läßt sich nur ausführen oder abschreiben, und Abschreiben ist der Fehler, gegen den
  die Datei geschrieben ist.

**Die Fläche, und was sie E-063 zuordnet:**

| Aus `@takt/domain` | Was | E-063 |
|---|---|---|
| `FORBIDDEN_NAME_CHARACTERS` | sechs Bereiche: C0, DEL+C1, ALM, LRM/RLM, Einbettungen, Isolate | — |
| `CONTROL_WHITESPACE` | `U+0009`–`U+000D`, die Teilmenge, die Wörter trennt | — |
| `FORBIDDEN_NAME_CHARACTER_MESSAGE` | „Steuerzeichen und Richtungszeichen sind in einem Namen nicht erlaubt." | Punkt 3 |
| `HIDDEN_MARKER` | `U+FFFD` | Punkt 2 |
| `isForbiddenNameCharacter(codePoint)` | die Frage je Codepunkt, für Nachweise | — |
| `hasForbiddenNameCharacter(value)` | **abweisen** — die Tür | Punkt 3 |
| `hasHiddenCharacter(value)` | dasselbe **ohne** den C0-Leerraum — die Menge, auf der die beiden folgenden wirken | — |
| `dropHiddenCharacters(value)` | **fallen lassen** — der Vorschlag aus fremder Quelle | Punkt 3 |
| `visibleText(value)` | **sichtbar machen** — die Anzeige | Punkte 1 und 2 |

Die drei Behandlungen stehen zusammen an einem Ort, weil sie **eine** Regel sind und nicht drei:
Was der Benutzer geschrieben hat, wird abgewiesen; was er nicht geschrieben hat, darf die
Anwendung glattziehen; eine Anzeige nimmt nichts weg, sie läßt nur nichts wirken. Genau das ist
E-063, und bisher stand diese Regel nur in einem Kommentar im Add-in.

**Gemessen, nicht behauptet.** Über die **ganze BMP** (65 536 Codepunkte, Ersatzstellen
ausgespart) plus drei Codepunkte außerhalb, gegen beide heutigen Fassungen — die Zeichenklasse
aus `http/input.ts` und `HIDDEN_SOURCE`/`HIDDEN_ANY`/`CONTROL_WHITESPACE` aus
`apps/outlook-addin/src/text/hidden.ts`:

```
abgewiesen in der BMP: 77
Abweichung hasForbiddenNameCharacter: []
Abweichung hasHiddenCharacter:        []
Abweichung dropHiddenCharacters:      []
Abweichung visibleText:               []
einzelne Ersatzstelle — neu: false, alt: false
ZWJ-Emoji erlaubt: true, unverändert: true
RLO angezeigt: "Rechnung<U+FFFD>gnp.exe", Länge gleich: true
Tabulator im Vorschlag bleibt: "Störung\tLüftung"
```

77 ist dieselbe Zahl, die T-119 an der Tür gemessen hat. **Keine Verhaltensänderung** an den
Namen und Titeln; das war Bedingung.

### Wer danach liest statt abzuschreiben

| Stelle | Vorher | Jetzt |
|---|---|---|
| `apps/local-api/src/http/input.ts` | eigene `FORBIDDEN_IN_NAMES`, eigene Meldung | `hasForbiddenNameCharacter`, `FORBIDDEN_NAME_CHARACTER_MESSAGE`; nur die zod-Bindung bleibt |
| `apps/local-api/src/access/session-secret.ts` | eigener, **engerer** Ausdruck | `hasForbiddenNameCharacter` (Abschnitt 2) |
| `apps/local-api/src/routes/addin/schema.ts` | benutzt seit T-114 `titleSchema`/`nameSchema` | unverändert — liest jetzt mittelbar mit |
| `apps/local-api/scripts/proof-openapi.mjs` | kannte die Klasse nicht | liest `FORBIDDEN_NAME_CHARACTERS` und mißt die Beschreibung dagegen |
| `apps/outlook-addin/src/text/hidden.ts` | eigene Fassung | **noch nicht umgestellt** — integration-dev, Vertrag unten |

### Der Vertrag für integration-dev (nächste Welle)

`apps/outlook-addin/src/text/hidden.ts` kann zu einer Datei mit Wiederausfuhr werden. Die
Zuordnung ist eins zu eins und **gemessen gleich**, kein Verhalten ändert sich:

| Heute im Add-in | Aus `@takt/domain` |
|---|---|
| `HIDDEN_SOURCE`, `HIDDEN_ALL`, `HIDDEN_ANY`, `CONTROL_WHITESPACE` | entfallen ersatzlos |
| `HIDDEN_MARKER` | `HIDDEN_MARKER` (zeichengleich `�`) |
| `hasHidden(v)` | `hasHiddenCharacter(v)` |
| `dropHidden(v)` | `dropHiddenCharacters(v)` |
| `visibleText(v)` | `visibleText(v)` |

Der Kopfkommentar der Datei („die Klasse steht deshalb zweimal im Baum") wird damit falsch und
gehört mit umgestellt; die Begründung, warum es **drei** Behandlungen gibt, steht jetzt in
`characters.ts` und muß nicht zweimal stehen. Das Add-in führt `@takt/domain` bereits in seiner
Abhängigkeitsliste; `pnpm --filter @takt/outlook-addin build` läuft mit dem heutigen Stand durch
(238,27 kB, Endstatus 0).

### Welche Nachweise dadurch einfacher werden

**`apps/outlook-addin/scripts/proof-addin.mjs` — nicht meine Hoheit, nur benannt:**

- **Abschnitt 16, `ABGEWIESENE_ZEICHEN` (Zeile 3352 ff.):** zwanzig abgeschriebene Codepunkte.
  Genau diese Abschrift hat T-117 verschlafen. Sie kann ersatzlos aus `FORBIDDEN_NAME_CHARACTERS`
  entstehen — dann gibt es keine Liste mehr, die jemand pflegen müßte.
- **Abschnitt 17:** Zwei seiner Prüfungen werden nach dem Umstellen **tautologisch** und sollten
  weg, statt Sicherheit vorzutäuschen — der Vergleich der Add-in-Klasse mit der Türklasse (eine
  Quelle, also immer gleich) und die Gegenprobe „die Fassung vor T-119". **Bleiben soll der
  BMP-Scan gegen die Tür:** Er mißt nicht die Klasse, sondern daß `zod` sie an `title` und
  `tagNames` tatsächlich anwendet — das ist eine andere Frage und weiterhin offen.

**`apps/local-api/scripts/proof-openapi.mjs` — meine Hoheit:** Der wurde **nicht** einfacher,
sondern hat einen Abschnitt bekommen, und das ist die ehrlichere Antwort. Nach dem Umzug ist die
**Beschreibung** die letzte verbliebene Abschrift der Klasse — Prosa läßt sich nicht importieren.
Also wird sie gemessen (Abschnitt 3).

---

## 2. O-AE — der Windows-Benutzername

`apps/local-api/src/access/session-secret.ts` prüfte gegen `/[\u0000-\u001f\u007f]/`: C0 und DEL,
**ohne** C1 und **ohne** die Richtungszeichen. Der Wert geht unverändert als `WindowsUser` in die
Exportdatei (A-8.5, E-010) und steht in `GET /settings`. Jetzt gilt dort dieselbe Funktion wie an
der Haupttür.

**Die Verhaltensänderung, ausgeschrieben.** Ein Name, der die neue Prüfung nicht besteht, läßt den
Dienst **nicht starten**: Beendigungscode 78 wie bisher, aber mit einem eigenen Grund
`user_invalid` neben `user_missing` und einer eigenen Meldung:

> Der lokale Dienst hat einen Windows-Benutzernamen mit Steuer- oder Richtungszeichen empfangen.
> Er startet nicht: Dieser Name ginge unverändert in die Abrechnungsdatei.

Zwei Gründe und nicht einer, weil der Benutzer an verschiedenen Stellen sucht: Eine leere zweite
Zeile ist ein Fehler der Hülle, ein Name mit Steuerzeichen ist da und nicht abrechenbar. Der Wert
steht in **keiner** Meldung — er kann genau die Zeichen tragen, um die es geht (B-2.4, B-4.3
Punkt 5).

**Die Folge für einen bestehenden Namen: Takt startet nicht, und der Benutzer kann seinen
Windows-Namen nicht ändern.** Das ist die harte Variante. Ich habe sie gesetzt, weil der Auftrag
sie verlangt („Übernimm die Klasse"), und lege die Abwägung offen:

- **Windows läßt solche Namen praktisch nicht zu.** Ein SAM-Konto verbietet Steuerzeichen, ein UPN
  ist eine Adresse. Der Fall entsteht eher durch einen Aufrufer, der etwas in die Röhre schreibt,
  als durch einen Benutzer, der so heißt — und **das** ist der Fall, gegen den die Prüfung steht
  (B-8.1).
- **Bereinigen** hieße, unter einem Namen abzurechnen, den es nicht gibt. **Markieren** hieße,
  `U+FFFD` in die Abrechnungsdatei zu schreiben. Beides führte still zu einer Rechnung mit
  falschem Urheber; ein Nichtstart ist laut und fällt dort auf, wo jemand etwas tun kann.

Ob das die richtige Wahl ist, ist eine **Entscheidung** — sie steht unten als offene Frage 1, mit
einem Vorschlag und ohne daß ich sie getroffen hätte. Sie kostet, wenn sie kippt, genau diese eine
Funktion; die Klasse bleibt davon unberührt.

### Der Prüffall in `proof:access`

Drei neue Abschnitte, elf Prüfungen; `proof:access` wächst von **75 auf 86**.

```
0b. Windows-Benutzername mit Steuer- oder Richtungszeichen (O-AE, T-122)
  ok  U+202E (RLO) — dreht die Zeile der Exportdatei um: der Dienst startet nicht (Code 78)
  ok  U+202E: die Meldung nennt den Grund und gibt den Namen nicht wieder
  ok  U+0085 (NEL) — C1, bis T-122 nicht erfasst: der Dienst startet nicht (Code 78)
  ok  U+0085: die Meldung nennt den Grund und gibt den Namen nicht wieder
  ok  U+200F (RLM) — Richtungsmarke, bis T-122 nicht erfasst: der Dienst startet nicht (Code 78)
  ok  U+200F: die Meldung nennt den Grund und gibt den Namen nicht wieder

0c. Ein gewöhnlicher Name bleibt gültig (Gegenprobe zu 0b)
  ok  Ein Name mit Umlaut, Leerzeichen und Punkt lässt den Dienst starten
  ok  Und er ist es auch, der antwortet — der Dienst nennt seine Bindeadresse
  ok  Endet die Röhre unmittelbar nach dem Start, hält der Dienst von selbst an (B-1.6 Punkt 3)

0d. Die Hülle stirbt während des Starts (B-1.6 Punkt 3, T-122)
  ok  Der Sidecar überlebt die Hülle nicht, auch nicht mitten im Start
  ok  Und er sagt, warum er anhält
```

Die beiden gewählten Zeichen sind mit Absicht **die beiden Erweiterungen**, die hier fehlten: C1
(`U+0085`) und eine Richtungsmarke (`U+200F`). Die Gegenprobe 0c ist keine Zierde: Eine Prüfung,
die alles abweist, ist grün und nutzlos.

---

## 3. Was beim Messen aufgefallen ist — B-1.6 Punkt 3 war offen

**Der Befund.** Nach einem Lauf hielt ein **verwaister Sidecar** den Port 17843: `PPID 1162`
(systemd), kein Elternprozess mehr, Datenbankzugriff, kein Fenster. Genau das, was B-1.6 Punkt 3
verhindern soll und wofür `watchParentLink` existiert.

**Die Ursache, in drei gemessenen Schritten.**

1. `readStartupHandshake` liest `stdin` im **fließenden** Zustand und meldet danach nur seine
   Zuhörer ab. Einen `data`-Zuhörer abzumelden hält einen Strom nicht an — er liest weiter.
2. Zwischen dem Handschlag und dem Anmelden von `watchParentLink` liegen Migration,
   Bestandssicherung und das Zertifikat des Aufgabenbereichs. Schließt die Hülle in diesem Fenster
   ihre Seite der Röhre, wird `end` an einen Strom **ohne Zuhörer** ausgeliefert.
3. `watchParentLink` meldet sich danach mit `once('end')` an einem Strom an, der schon zu Ende
   ist. Das Ereignis kommt nie wieder.

Nachgestellt mit einer `PassThrough` (die Semantik) und mit dem **echten Dienst** (die Wirkung):

```
ohne Behebung: Ergebnis: LÄUFT NOCH (15 s), zuletzt „Der Aufgabenbereich … liegt unter https://localhost:17844."
mit  Behebung: Ergebnis: 0,          zuletzt „Die Verbindung zur Anwendung ist beendet. Der lokale Dienst hält an."
```

**Die Behebung, zwei Zeilen, beide in `session-secret.ts`:** `input.pause()` im Handschlag läßt
das Dateiende ungelesen liegen, bis `watchParentLink` es mit seinem `resume()` abholt; und wer
sich an einem bereits beendeten Strom anmeldet (`readableEnded || destroyed`), bekommt die Meldung
sofort statt auf ein Ereignis zu warten, das vorbei ist. Das eine verhindert den Verlust, das
andere fängt ihn ab.

**Ein zweiter Befund derselben Stelle, ebenfalls gemessen.** In einem Lauf endete Abschnitt 15 mit
`Code 1` statt `0`. Die Kette, Schritt für Schritt nachgewiesen:

```
end und close feuern beide auf derselben Röhre  → onLost läuft zweimal
zweites database.close()                        → ERR_INVALID_STATE: database is not open
ein Wurf aus einem Ereignisbehandler            → exit code 1
```

Die Hülle liest diesen Code, um den Grund zu unterscheiden (78 Konfiguration, 74 Port). Eine 1 für
ein ordentliches Anhalten ist eine falsche Auskunft. Behoben mit je einer Sperre in
`watchParentLink` (einmal melden) und an `shutdown` in `main.ts` (einmal anhalten); danach
dreimal hintereinander grün.

Beides ist **nicht** durch T-122 entstanden — es lag vorher da und ist beim Aufräumen dieser
Aufgabe aufgefallen. Abschnitt 0d hält es fest: Er schließt die Röhre **unmittelbar nach dem
Handschlag**, ohne auf `/health` zu warten, und hängt damit nicht am Zeitverhalten des Rechners.
Gegenprobe gefahren: Ohne die Behebung ist er rot („Code läuft weiter").

---

## 4. Abschnitt 16 in `proof:openapi` — die letzte Abschrift wird gemessen

`proof:openapi` wächst von **105 auf 110**.

```
16  Die Zeichenklasse steht in der Domäne, und beide Türen sagen dasselbe (T-122, E-063)
  ok  die Klasse ist nicht leer — sonst prüfte alles Folgende die leere Menge
  ok  jede Grenze der Zeichenklasse steht in der Beschreibung von 422
  ok  und die Beschreibung nennt den einen Ort, an dem die Klasse liegt
  ok  die Tür des Dienstes weist genau die Zeichen ab, die die Domäne nennt (0x0000–0x20FF)
  ok  U+200D (ZWJ) bleibt erlaubt, U+200E (LRM) nicht — die Grenze liegt dazwischen
```

**Gegenprobe gefahren**, weil grün sonst nichts heißt: Ein zusätzlicher Bereich in
`FORBIDDEN_NAME_CHARACTERS` (`U+2028`–`U+2029`), ohne die Beschreibung anzufassen, macht den Lauf
rot — „nicht beschrieben: U+2028, U+2029". Der Bereich ist danach wieder entfernt, die Datei
bytegleich wiederhergestellt.

Der vierte Punkt ist die Bewachung der eigenen Tür: Wer neben der gemeinsamen Funktion einen
zweiten, örtlichen Ausdruck einbaut — die Bauart, aus der die Regression entstand —, fällt hier
auf.

---

## 5. O-AG / B-11 — die Aufzählung hat einen Ort

`listPools` lag privat in `pool-movement.ts` und war deshalb in `apps/web` **dreimal**
nachgebaut. Sie liegt jetzt in **`packages/domain/src/enumeration.ts`**:

| Name | Was | Ersetzt in `apps/web` |
|---|---|---|
| `enumerateGerman(parts)` | „A", „A und B", „A, B und C" — ohne Anführungszeichen | `format.ts:joinGerman`, `errorText.ts:enumerateGerman` |
| `quoteName(name)` | `„name“` | die Anführungszeichen in `errorText.ts` und `TodoFormDialog.tsx` |
| `enumerateNames(names)` | beides zusammen: „Ost“, „Nord“ und „Abrechnung“ | `TodoFormDialog.tsx:quoteList` |

**Sie heißt nicht `listPools`**, und das ist eine Entscheidung: Der Name wäre an zwei Stellen
falsch. Erstens zählt sie keine Pools, sondern Namen — seit E-054 kann derselbe Name eine
Kanban-Spalte bezeichnen, und genau deshalb setzt sie kein Gattungswort (E-058 Punkt 4).
Zweitens **gibt es `listPools` bereits**: als Anwendungsfall in
`apps/local-api/src/usecases/structure.ts` und als Aufruf in `apps/web/src/api/endpoints.ts`, und
beide listen tatsächlich Pools. Zwei Dinge unter einem Namen aus dem Paket, das jeder einbindet,
wäre die nächste Verwechslung.

`poolMovementSentence` ruft `enumerateNames` auf; der Wortlaut aller vierzehn Sätze ist
unverändert (`packages/domain/test/pool-movement.test.ts` mißt zeichengenau und ist grün).

**Für frontend-dev bleibt genau eine Handbewegung:** die drei Fassungen in `apps/web` durch
Importe ersetzen. Ich habe die Dateien nicht angefaßt.

---

## 6. Nachweis

Jeder Befehl einzeln, Ausgabe in eine Datei umgeleitet, Endstatus unmittelbar danach gelesen —
keine Pipe (zsh `pipestatus`). Alle Läufe **nach** der letzten Änderung.

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm typecheck` | **0** | 8 Pakete, 6 Test-Konfigurationen, `tests/e2e` |
| `pnpm test` | **0** | 56 Dateien, **837/837** |
| `pnpm proof:access` | **0** | **86** bestanden (vorher 75) |
| `pnpm proof:openapi` | **0** | **110** bestanden (vorher 105) |
| `pnpm proof:all` | **0** | 13 Ketten, **879** Prüfungen, 0 fehlgeschlagen |
| `pnpm boundaries` | **0** | 327 Dateien auf Tiefenzugriffe, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm --filter @takt/outlook-addin build` | **0** | 238,27 kB (Kontrolle, daß der Umzug fremde Bündel nicht bricht) |

Zusätzlich gemessen und oben belegt: die Gleichheit beider heutigen Fassungen über die ganze BMP,
die Gegenprobe zu `proof:openapi` Abschnitt 16, die Gegenprobe zu `proof:access` Abschnitt 0d, und
die drei Schritte der Exitcode-1-Kette.

**Drei rote Zwischenläufe, keiner davon eine Regression — alle drei gehören hierher, weil sie
sonst jemand anders noch einmal sucht:**

1. **`pnpm test`, 12:32 — fremde Datei, nicht von mir geändert.**
   `apps/outlook-addin/test/text/hidden.test.ts:181` hatte ein **rohes** `U+000A` mitten in einem
   Zeichenkettenliteral (`["\t", "<LF>", …]`), was esbuild als „Unterminated string literal"
   abweist; die Datei trug den Zeitstempel derselben Minute (unit-tester). Die anderen 55 Dateien
   waren grün. Um 12:47 war sie behoben, ich habe sie nicht angefaßt. Der Fall ist derselbe wie
   T-112-H2: rohe Steuerzeichen im Quelltext, diesmal in einem Test.
2. **`pnpm proof:all`, zweimal — der Port war fremd belegt.** Auf `127.0.0.1:17843` lauschte ein
   Dienst, den ich nicht gestartet habe (e2e- oder unit-tester laufen gerade). Einmal brach
   `proof:conflicts` sauber mit der eigenen Meldung ab, einmal lief `proof:access` gegen einen
   fremden Prozess. **Ich habe keinen fremden Prozess beendet**, sondern gewartet, bis der Port
   frei war, und neu gemessen.
3. **`proof:access` Abschnitt 13, einmal — eine Zeitmessung unter Last.** „Streuung 1.71" statt
   unter 1,25 beim zeitkonstanten Vergleich, während ein zweiter Agent den Rechner belegte. In
   allen übrigen Läufen 1,02 bis 1,08. Das ist keine Regression, aber es ist die eine Prüfung im
   Bestand, die von der Auslastung des Rechners abhängt — als Hinweis für den Orchestrator, falls
   sie in einer parallelen Welle wieder aufschlägt.

Ports 17843/17844 habe ich nach jedem Lauf nachgesehen; am Ende frei. Kein `git commit`, kein
`stash`, kein `checkout`, kein fremder Prozess beendet.

---

## 7. Artefakte

| Datei | Was |
|---|---|
| `packages/domain/src/characters.ts` | **neu.** Die Zeichenklasse als Codepunktbereiche, die Meldung, die Marke und die drei Behandlungen aus E-063 |
| `packages/domain/src/enumeration.ts` | **neu.** `enumerateGerman`, `quoteName`, `enumerateNames` |
| `packages/domain/src/index.ts` | zwei Ausfuhrzeilen |
| `packages/domain/src/pool-movement.ts` | privates `listPools` entfällt zugunsten von `enumerateNames`; Kopfkommentar richtiggestellt (die Datei importiert jetzt eines) |
| `apps/local-api/src/http/input.ts` | `FORBIDDEN_IN_NAMES` und die eingebaute Meldung entfallen; liest die Domäne, behält die zod-Bindung samt Begründung |
| `apps/local-api/src/access/session-secret.ts` | `isPlausibleUserName` gegen die gemeinsame Klasse; neuer Grund `user_invalid`; `pause()` im Handschlag; `watchParentLink` meldet einmal und auch an einem beendeten Strom |
| `apps/local-api/src/main.ts` | dritte Meldung für `user_invalid`; `shutdown` läuft genau einmal |
| `apps/local-api/scripts/proof-access.mjs` | Abschnitte 0b, 0c, 0d; `startService` nimmt `user` und `closeAfterHandshake`; `stopService` beendet deterministisch und sieht den Port nach |
| `apps/local-api/scripts/proof-openapi.mjs` | Abschnitt 16 |
| `apps/local-api/openapi/takt-local-api.yaml` | `UnprocessableEntity`: der eine Ort der Klasse; `SystemInfo.windowsUser`: geprüft, und die Folge ist kein 422, sondern ein Nichtstart; `ExportRun.windowsUser`: Verweis |
| `docs/architektur.md` | drei Zeilen in der Domänentabelle mit Begründung; die zweite `stdin`-Zeile im Abschnitt Vertrauensgrenze; eine gezählte Aufzählung entzählt (B-9) |
| `.claude/team/reports/T-122-domain-dev.md` | dieser Bericht |

**Nicht angefaßt:** `apps/local-api/src/routes/addin/**`, der Add-in-Abschnitt der OpenAPI
(E-053), `apps/outlook-addin/**`, `apps/web/**`, `packages/export/**`, alle Testordner,
`docs/datenmodell.md` (am Datenmodell ändert sich nichts) und jede gemeinsame Datei.

---

## 8. Annahmen

1. **Die Klasse zieht die drei Behandlungen mit.** Der Auftrag nennt „eine benannte, ausgeführte
   Fassung … und eine reine Prüffunktion". Ich habe `dropHiddenCharacters` und `visibleText`
   dazugenommen, weil das Add-in sonst weiterhin die Klasse selbst bräuchte (für `replace`) und
   die Doppelung nur ihre Form gewechselt hätte. E-063 macht die drei Behandlungen ohnehin zu
   einer Produktregel; sie stehen jetzt dort, wo die Regel steht.
2. **`hasHiddenCharacter` ist dazugekommen**, weil `hasHidden` im Add-in den C0-Leerraum
   ausnimmt und `hasForbiddenNameCharacter` ihn nicht ausnehmen darf (die Tür weist ihn ab). Ohne
   diese zweite Frage müßte das Add-in beim Umstellen wieder selbst rechnen. Gemessen gleich mit
   `HIDDEN_ANY`.
3. **Die Funktion heißt `enumerateNames` und nicht `listPools`** (Abschnitt 5). Der Board-Eintrag
   nennt `listPools`; ich habe den Namen geändert, weil er im selben Arbeitsbereich bereits
   vergeben ist und weil er falsch beschreibt, was die Funktion tut.
4. **Zwei Gründe am Handschlag statt einem.** `user_invalid` neben `user_missing`. Der Auftrag
   verlangt nur die Klasse; mit einem Grund hieße die Meldung „hat keinen Benutzernamen
   empfangen", obwohl einer da ist — und der Benutzer suchte an der falschen Stelle.
5. **Die beiden Befunde aus Abschnitt 3 habe ich behoben, nicht nur gemeldet.** Beide liegen in
   `session-secret.ts` und `main.ts`, also in meiner Hoheit, beide sind zwei Zeilen, und beide
   berühren genau die Grenze, an der diese Aufgabe ohnehin arbeitet. Der verwaiste Prozess ist
   ein Sicherheitsbefund (B-1.6 Punkt 3) — ihn eine Welle offen zu lassen, während der Nachweis
   dafür in derselben Datei entsteht, wäre schwer zu begründen.
6. **`textSchema` (Vermerk und Leistung) bleibt ungeprüft.** Das ist E-063 Punkt 1: Eingabefelder
   werden nicht angetastet. Keine Änderung, nur der ausdrückliche Hinweis, daß es so bleibt.

---

## 9. Risiken

**R1 — Verhaltensänderung am Start (O-AE).** Ein Windows-Benutzername mit C1 oder einem
Richtungszeichen verhindert den Start. Der Benutzer kann seinen Namen nicht ändern; der Ausweg
wäre ein Konto oder eine Entscheidung (offene Frage 1). Ich halte den Fall auf einem echten
Windows-Konto für praktisch ausgeschlossen und auf einem untergeschobenen `stdin` für genau den
Fall, gegen den B-8.1 steht — aber „praktisch ausgeschlossen" ist keine Messung, und ich habe
keinen Windows-Rechner.

**R2 — Die Hülle sagt dem Benutzer nichts.** Startet der Dienst nicht, sieht der Benutzer heute
die Meldung des Sidecars nur im Protokoll. Bei `user_invalid` ist das besonders unbefriedigend:
Takt startet nicht und niemand erklärt, warum. Das ist `apps/desktop` und nicht meine Hoheit —
offene Frage 2.

**R3 — Drei Ausfuhren der Domäne haben im Baum noch keinen Aufrufer.**
`dropHiddenCharacters`, `visibleText`, `hasHiddenCharacter` werden erst benutzt, wenn
integration-dev umstellt. Sie sind gemessen richtig, aber bis dahin ist die Doppelung **nicht**
beseitigt, sondern nur auflösbar. Solange sie besteht, hängt sie an `proof:addin` Abschnitt 17 —
der ist grün und mißt weiter gegen die Tür.

**R4 — `proof:access` ist empfindlich gegen einen belegten Port.** Zweimal in dieser Aufgabe hat
ein fremder Dienst auf 17843 einen roten Lauf erzeugt, der nichts mit dem Stand zu tun hatte
(Abschnitt 6). Mein neuer `stopService` sieht den Port nach und bricht mit einer Meldung ab,
statt gegen einen fremden Prozess weiterzumessen — die Ursache bleibt aber: Zwei Wellen, die
beide den Dienst starten, vertragen sich nicht. Das ist eine Sache der Wellenplanung.

**R5 — Sicherheit, behoben und benennenswert:** Der verwaiste Sidecar (Abschnitt 3) war ein
Prozess mit Zugriff auf die Kundendatenbank, ohne Fenster, ohne Ende — und er entstand aus einem
Absturz der Hülle im Startfenster, also ohne Zutun eines Angreifers. Für den security-checker ist
das die Ergänzung zu B-1.6 Punkt 3: Das Gegenmittel war vorhanden und griff in einem Zeitfenster
von Sekunden nicht.

**R6 — Kein Risiko aus der Zeichenklasse selbst.** Die Menge ist unverändert (77 Zeichen in der
BMP, gemessen gegen beide Vorfassungen), die Meldung ist wortgleich, `titleSchema` und
`nameSchema` verhalten sich wie vorher. Der Altbestand-Hinweis aus T-117 gilt unverändert weiter
und steht jetzt an der Klasse statt an der Tür.

---

## 10. Offene Fragen

1. **Bleibt es beim Abweisen des Windows-Benutzernamens?** (O-AE.) Mein Vorschlag: **ja, so wie
   jetzt** — aber die Entscheidung gehört nicht mir. Die Abwägung steht in Abschnitt 2 und im
   Quelltext. Eine Zwischenform wäre denkbar und ich halte sie für schlechter: den Namen
   annehmen, in der Anwendung markiert anzeigen (`visibleText`) und **nur** den Export sperren,
   bis jemand einen Ersatznamen einträgt. Sie kostet ein neues Feld, einen neuen Zustand und
   einen Screen — für einen Fall, den Windows kaum zuläßt.
2. **Sagt die Hülle dem Benutzer, warum Takt nicht startet?** (R2.) Der Sidecar unterscheidet
   inzwischen vier Gründe (kein Geheimnis, kein Name, unzulässiger Name, Port belegt) und meldet
   sie im Protokoll. Ob `apps/desktop` daraus ein Fenster macht, ist nicht meine Hoheit — aber
   ohne das ist die Unterscheidung nur für einen Entwickler sichtbar.
3. **E-063 bekommt einen Nachsatz.** Punkt 4 sagt „Wer zwei Stellen zusammenhalten will, fragt die
   maßgebliche ab und schreibt sie nicht ab." Mit T-122 gibt es keine zwei Stellen mehr, sondern
   eine — und für die **Beschreibung**, die zwangsläufig Prosa bleibt, gilt weiterhin „abfragen":
   `proof:openapi` Abschnitt 16. Der Nachsatz gehört in `decisions.md`, die dem Orchestrator
   gehört.
4. **Zwei Umstellungen in fremder Hoheit hängen jetzt an dieser Aufgabe** und sollten in eine
   Welle: integration-dev (`apps/outlook-addin/src/text/hidden.ts` und die beiden Nachweise aus
   Abschnitt 1) und frontend-dev (die drei Aufzählungsfassungen aus Abschnitt 5). Beide sind
   mechanisch; beide werden teurer, je länger die Doppelfassung daneben liegt.
5. **`apps/outlook-addin/test/text/hidden.test.ts` wird beim Umstellen mitwandern.** Die Datei ist
   neu (unit-tester, heute) und prüft `hasHidden`, `dropHidden`, `visibleText` unter ihren
   heutigen Namen. Sie bleibt gültig, wenn das Add-in die Domänenfunktionen unter diesen Namen
   wiederausführt — das ist der Weg, den ich in Abschnitt 1 vorschlage, und der Grund, warum ich
   ihn so vorschlage.

---

## 11. Nächster Schritt

1. **Frage 1 entscheiden** (Abweisen oder Zwischenform). Alles andere an O-AE ist fertig und
   gemessen.
2. **Eine Welle für die beiden Umstellungen** aus offener Frage 4 — integration-dev und
   frontend-dev arbeiten dabei in getrennten Verzeichnissen und können parallel laufen.
3. **Für den security-checker:** Abschnitt 3 dieses Berichts. Der verwaiste Sidecar ist behoben
   und mit `proof:access` 0d festgehalten; das Bedrohungsmodell sollte den Fall bei B-1.6 Punkt 3
   führen, weil er zeigt, daß ein Gegenmittel ein Zeitfenster haben kann. Dazu die Zeile aus
   T-117: `docs/bedrohungsmodell.md` beschreibt die Zeichenklasse noch mit den alten zwei
   Bauarten und nennt jetzt zusätzlich den falschen Ort — sie liegt seit heute in
   `packages/domain/src/characters.ts`.
