# T-128 — Die letzte doppelte Zahl, ein Wächter gegen unsichtbare Zeichen, eine Frist im Betrieb

```
Aufgabe: T-128 — Die letzte doppelte Zahl, ein Wächter gegen unsichtbare Zeichen,
         eine Frist im Betrieb
Status: fertig
```

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (E-063, alle fünf Punkte), `docs/spec.md`,
`T-123-integration-dev.md` (Frage 1), der eigene `T-126-domain-dev.md` (Fragen 1 und 2),
`T-127-unit-tester.md` (Risiko 1, die fünf Totzweige).

---

## 1. O-AL — die letzte doppelte Zahl, und die beiden daneben

### 1.1 Was bewegt wurde

`packages/domain/src/text-length.ts` ist neu und trägt `MAX_TITLE_CHARACTERS = 500`. Die Datei
sagt, warum die Zahl in der Domäne liegen darf (dieselbe Begründung wie bei der Zeichenklasse: Sie
ist weder HTTP noch SQL, sondern die Antwort auf „wie lang darf ein Titel sein"), was sie kostet
(die Tür zählt UTF-16-Einheiten, der Vorschlag zählt Zeichen — die vorsichtigere von beiden
Zählweisen weist zu viel ab, nie zu wenig) und was ausdrücklich **nicht** darin steht.

Beim Nachsehen fielen zwei weitere Zahlen derselben Klasse an, beide in meinen Dateien, beide
bisher unbemerkt:

| Zahl | Wo sie stand | Wo sie jetzt herkommt |
|---|---|---|
| **500** Titel | `titleSchema` als `.max(500)`, dazu `MAX_TITLE_CHARACTERS` im Add-in | `MAX_TITLE_CHARACTERS` in `@takt/domain` |
| **200** Name | `nameSchema` als `.max(200)` — und `MAX_NAME_LENGTH` in `packages/domain/src/tag-name.ts` trug seit jeher den Kommentar „dieselbe Zahl wie `nameSchema` im Dienst" | `MAX_NAME_LENGTH` in `@takt/domain` |
| **200** Seitengröße | `paginationSchema` als `.max(200)` — und `MAX_PAGE_SIZE` in `packages/storage/src/sqlite/paging.ts` | `MAX_PAGE_SIZE` aus `@takt/storage` |

Die zweite ist die lehrreichste: Dort stand die Verabredung sogar **im Kommentar der maßgeblichen
Stelle**, und niemand erzwang sie. Das ist E-063 Punkt 5 in seiner mildesten Form — nicht einmal
ein Ergebnisvergleich, nur ein Satz, der es hoffte. Die dritte hätte im Auseinanderlaufen einen
stillen Fehler ergeben: Nähme die Tür mehr an, als `pageSize()` liefert, bekäme der Aufrufer
klaglos weniger Zeilen, als er erbeten hat.

### 1.2 Der Vertrag für integration-dev (das Add-in zieht nach)

Das Add-in-Bündel darf `@takt/local-api` nicht führen, `@takt/domain` aber schon — genau so liest
`apps/outlook-addin/src/text/hidden.ts` seit T-123 die Zeichenklasse. Dieselbe Bewegung, zwei
Zeilen:

```ts
// apps/outlook-addin/src/office/mail.ts — die Definition entfällt,
// die Ausfuhr unter demselben Namen bleibt, damit proof-addin.mjs
// (das sie aus mail.ts importiert) unverändert läuft.
export { MAX_TITLE_CHARACTERS } from '@takt/domain';
```

Danach kann `proof:addin` Abschnitt 16 den Zahlenvergleich „Add-in gegen `titleSchema`" durch die
Frage nach der **Herkunft** ersetzen, so wie T-123 es für die Zeichenklasse getan hat: nicht „ist
es dieselbe Zahl?", sondern „ist es dasselbe Objekt?". Solange die Zahl im Add-in noch selbst
dasteht, ist der bestehende Vergleich richtig und soll bleiben.

### 1.3 Die anderen Zahlen — geprüft, mit Ergebnis

| Zahl | Befund | Bewegt? |
|---|---|---|
| **4000**, der Vermerk | **Dreimal**, nicht zweimal: `MAX_TAKEOVER_CHARACTERS` (`apps/outlook-addin/src/office/mail.ts:14`), `ADDIN_NOTE_MAX_LENGTH` (`apps/local-api/src/routes/addin/schema.ts:47`) — und `note: z.string().max(4000)` in **derselben Datei** auf Zeile 213, die die zwei Zeilen darüber definierte Konstante nicht liest. Die dritte ist die ärgerlichste: eine Doppelung innerhalb einer Datei. | Nein. Alle drei Stellen gehören integration-dev (E-053). **Empfehlung:** Konstante nach `text-length.ts`, alle drei lesen sie; die Zeile 213 ist auch ohne Umzug schon eine Nacharbeit. |
| **40**, die Kurzfassung | `apps/outlook-addin/src/ui/TaskPane.tsx:1019`, zweimal in **einem** Ausdruck (`value.length <= 40 ? value : cutToCharacterBoundary(value, 40)`). Keine zweite Datei, keine zweite Fläche. | Nein, und nach meiner Einschätzung auch nicht nötig: Das ist eine Anzeigeentscheidung genau einer Ansicht, keine Regel, die anderswo gleich gelten muss. Ein lokaler Name wäre trotzdem lesbarer — integration-dev. |
| **20** aus H-3 | `RULE_REFERENCE_LIMIT` in `packages/storage/src/sqlite/mappers.ts:279`, dazu `RULE_REFERENCE_PROBE = RULE_REFERENCE_LIMIT + 1` daneben. Gelesen von `repo-tags.ts` (zweimal) und `repo-statuses.ts`. Die 21 in einer Testbeschreibung ist Prosa eines Tests, kein zweiter Träger. | **Nichts zu tun** — schon heute eine Quelle, und die abgeleitete Zahl ist abgeleitet statt hingeschrieben. |
| **200**, die Ordnerterme | `poolTagListSchema … .max(200)` (`structure.ts:91`) und `poolStatusListSchema` (`:141`). Eine Datei, zwei benachbarte Listen derselben Regel. **Nicht** dieselbe Wahrheit wie die 200 der Namenslänge — die eine ist eine Zeichenzahl, die andere eine Anzahl von Termen. | Nein. Ein gemeinsamer Name wäre hier eine Gleichsetzung, die es fachlich nicht gibt. |
| **200**, die Tags eines Todos | **Neu gefunden:** `tagIds: z.array(idSchema).max(200)` in `routes/todos.ts:54` und `:75` **und** in `routes/addin/schema.ts:139`. Das ist dieselbe Wahrheit an zwei Türen — genau die Bauart von `MAX_TITLE_CHARACTERS`. | Nein. Eine der drei Stellen gehört integration-dev, und eine halb umgestellte Zahl ist schlechter als eine ganz doppelte: Sie sieht aus wie erledigt. **Vorschlag: eine Aufgabe, die beide Türen zugleich umstellt.** |
| **512**, die Fortsetzungsmarke | Einmal (`input.ts`). Die 512 in `routes/time.ts` ist die Länge eines Grundes, ein anderer Sachverhalt. | Nichts zu tun; der Grund steht jetzt an der Stelle. |

**Und die OpenAPI-Beschreibung?** Sie trägt 27-mal `maxLength: 500` oder `maxLength: 200`. Das ist
**keine** freie Abschrift: `proof:openapi` hält die Facetten (`maxLength`, `minLength`, `maxItems`,
`minItems`) jeder Rumpfroute gegen das zod-Schema des Dienstes. Eine Beschreibung, die gegen die
Quelle gemessen wird, ist der ausdrücklich vorgesehene Fall — anders als eine Beschreibung, die
eine Klasse **aufzählt** (E-063 Punkt 5), denn diese Zahlen kann der Lauf vergleichen.

---

## 2. O-AP — der Wächter. Der eigentliche Grund dieser Aufgabe

### 2.1 Was gebaut wurde

`apps/local-api/scripts/proof-codepoints.mjs`, **45 Prüfungen**, Laufzeit gut eine Sekunde.

```
Skriptname:  apps/local-api/scripts/proof-codepoints.mjs
Vorschlag Paketeintrag (apps/local-api/package.json):
  "proof:codepoints": "node scripts/proof-codepoints.mjs"
Vorschlag Wurzeleintrag (package.json):
  "proof:codepoints": "pnpm --filter @takt/local-api proof:codepoints"
Vorschlag proof:all: als ERSTES Glied der Kette
  "proof:all": "pnpm run proof:codepoints && pnpm run proof:migrations && …"
```

**Als erstes Glied**, weil er eine Sekunde braucht und weil ein Baum, den ein Mensch nicht lesen
kann, vor allem anderen zu melden ist. Der Eintrag ist Sache des Orchestrators; bis dahin läuft er
mit `node scripts/proof-codepoints.mjs` aus `apps/local-api`.

### 2.2 Woher die Klasse kommt — gerechnet, nicht abgeschrieben

```
  FORBIDDEN_NAME_CHARACTERS   (aus @takt/domain gelesen)
− GERÜST                      (Tabulator, Zeilenumbruch)
+ UNSICHTBARE_NACHBARN        (U+200B–U+200D, U+FEFF)
= die Klasse dieses Laufs
```

Der Wagenrücklauf ist ein eigener Fall: erlaubt **unmittelbar vor** einem Zeilenumbruch (die
Hälfte einer Windows-Zeilenende-Folge), beanstandet, wenn er allein steht — ein einzelner CR setzt
beim Anzeigen den Cursor zurück und überschreibt, was davor stand. Heute trägt der Baum keinen
einzigen, weder allein noch als Paar; die Regel ist für den Tag da, an dem jemand auf Windows eine
Datei anlegt.

Drei Selbstprüfungen halten die Rechnung ehrlich, statt sie zuzusichern:

1. **Das Gerüst muss in `CONTROL_WHITESPACE` der Domäne stehen.** Verschiebt sich dort etwas, wird
   es hier bemerkt.
2. **Der Zusatz darf sich mit der Domänenklasse nicht überschneiden.** Trüge die Domäne eines Tages
   `U+200B` selbst ein, stünde die Zahl hier ein zweites Mal — und der Lauf wird rot. Das ist E-063
   Punkt 4 auf den Kopf gestellt: Nicht die Abschrift wird verboten, ihre Entstehung wird gemessen.
3. **Die Namenstabelle darf nur Zeichen der Klasse benennen.** Sie ist Ausgabe, nicht Quelle; eine
   Lücke darin ist erlaubt, ein Zuviel nicht.

Dazu je fünf Anforderungen in beide Richtungen — `U+0000`, `U+202E`, `U+061C`, `U+FEFF`, `U+200B`
**müssen** beanstandet werden (jedes davon hat in Takt schon einmal Arbeit gemacht), Tabulator,
Zeilenumbruch, Leerzeichen, „ä" und ein Emoji außerhalb der BMP **dürfen** es nicht.

### 2.3 Welche Dateien legitim solche Zeichen tragen dürfen, ohne Schlupfloch

**Bilddateien** (`png`, `ico`, `icns`) werden übersprungen — und zweimal nachgeprüft: Jede
übersprungene Datei **muss** binär sein (Nullbyte in den ersten 8000), sonst wäre die Endung ein
Versteck; und jede eingetragene Endung **muss** im Baum vorkommen, sonst ist der Eintrag ein Rest.
Alles andere wird gelesen, auch eine Endung, die es heute noch nicht gibt: Unbekanntes wird geprüft
und fällt notfalls auf, statt still zu verschwinden.

**Testdaten und Prüfmuster** bekommen `AUSNAHMEN`. Eine Ausnahme nennt **Pfad, Codepunkt, Anzahl
und Grund**. Sie erlaubt nicht „in dieser Datei alles", sondern „in dieser Datei genau dreimal
genau dieses Zeichen, und zwar deshalb". Drei Regeln machen daraus eine Messung statt einer
Erlaubnis:

- Ein Vorkommen mehr oder weniger als eingetragen: **rot**, und die Fundstellen bleiben offen.
- Eine Ausnahme, die gar nichts mehr trifft: **rot**. Die Liste kann nicht verrotten.
- Kein Muster, kein Verzeichnis, kein Sternchen — und ausdrücklich **keine Marke im Quelltext**
  („guard-ignore"). Eine solche Marke wäre eine Erlaubnis, die derselbe Griff erteilt, mit dem man
  den Fehler macht; bei einem unsichtbaren Zeichen merkt niemand, dass sie gesetzt wurde.

**Die Liste ist leer**, und das ist die stärkste Aussage, die sie treffen kann: Kein Text in Takt
braucht ein rohes solches Zeichen. Dass der Mechanismus trotzdem trägt, messen fünf Prüfungen an
einem erfundenen Beispiel im Arbeitsspeicher (richtige Zahl deckt; eine zu wenig lässt offen und
wird ungültig; eine ins Leere greifende wird rot; eine Ausnahme deckt nur ihren Codepunkt; eine
Ausnahme deckt nur ihre Datei).

### 2.4 Versioniert — und was gerade erst angelegt wurde

Der Lauf fragt `git ls-files` **und** `git ls-files --others --exclude-standard`. Der zweite Aufruf
ist nicht Beiwerk, sondern der Unterschied zwischen einem Wächter und einem Nachruf, und er ist aus
einem Fehlschlag entstanden: Beim Bau stand mein Prüfzeichen zuerst in einer **neu angelegten**
Datei, `git ls-files` kannte sie nicht, und der Lauf blieb grün. Genau so entsteht der Fund, den er
verhindern soll — geschrieben, nicht bemerkt, danach eingecheckt. Was in `.gitignore` steht, bleibt
draußen: Abhängigkeiten, Bauergebnisse und Testberichte kommen in kein Review. Gemessen: 613
versioniert plus 8 neue, davon 603 Textdateien gelesen und 18 Binärdateien übersprungen.

### 2.5 Der Lauf hat als Erstes seinen eigenen Autor erwischt

Beim ersten Durchgang über den echten Baum wurde er rot — **an sich selbst**:

```
apps/local-api/scripts/proof-codepoints.mjs:378:38  U+0000  NUL
      const schluessel = `${fund.datei}<U+0000>${fund.code}`;
apps/local-api/scripts/proof-codepoints.mjs:385:42  U+0000  NUL
apps/local-api/scripts/proof-codepoints.mjs:394:67  U+0000  NUL
```

Drei rohe Nullzeichen als Trenner zwischen Pfad und Codepunkt, hineingeraten unmittelbar nachdem
ich den Trenner aus `packages/storage/src/sqlite/paging.ts` gelesen hatte — in der Datei, die genau
das abstellen soll, und in keiner Ausgabe zu sehen. Behoben mit `JSON.stringify([datei, code])`:
Ein Schlüssel, der kein Trennzeichen braucht, hat auch keine Stelle, an der eines stehen könnte.

Zwei weitere Vorfälle in derselben Aufgabe, beide protokolliert:

- Mein erster Befehl für die Gegenprobe enthielt das rohe `U+202E` und das rohe `U+0000`,
  abgeschrieben statt gebaut. Das Werkzeug hat ihn abgewiesen:
  `command contains control characters that would be hidden in the approval dialog`. Der zweite
  Anlauf hat beide Zeichen mit `chr(0)` und `chr(0x202e)` **gebaut**.
- Das ist derselbe Satz wie E-063 Punkt 4 an einer neuen Stelle, und er gilt für Zeichen genauso
  wie für Listen: Wer abschreibt, merkt bei einem unsichtbaren Zeichen nicht einmal, dass er es tut.

**Die Zählung steht damit bei sieben Vorfällen in fünf Aufgaben** (T-119, T-125 zweimal, T-126
dreimal, T-127 achtzehnmal im Berichtsentwurf, jetzt T-128 dreimal im Quelltext des Wächters und
einmal in einem Befehl). Sechs davon haben Menschen oder Werkzeuge gefunden, nachdem sie schon da
waren. Der siebte ist der erste, den eine **Messung** gefunden hat, bevor er in einen Commit kam —
und zwar ohne dass jemand danach gesucht hätte.

### 2.6 Die verlangte Gegenprobe, auf der Platte

Zwei Zeichen in eine echte, versionierte Datei gesetzt (`apps/local-api/src/http/input.ts`, gebaut
mit `chr(...)`, nicht abgeschrieben), Lauf gefahren, Datei zurückgesetzt:

| Schritt | Ergebnis | Endstatus |
|---|---|---|
| eingesetzt: `U+202E` in einen Kommentar, `U+0000` in eine Anweisung | `44 bestanden, 1 fehlgeschlagen` — beide Fundstellen mit Datei, Zeile, Spalte, Codepunkt und Namen, die Zeile im Ausschnitt lesbar gemacht | **1** |
| zurückgesetzt | `sha256sum -c` → `apps/local-api/src/http/input.ts: OK` | — |
| danach | `45 bestanden, 0 fehlgeschlagen` | **0** |

Der Ausschnitt gibt das gefundene Zeichen **nicht** wieder, sondern setzt `<U+202E>` an seine
Stelle — dieselbe Begründung wie bei `FORBIDDEN_NAME_CHARACTER_MESSAGE`: Ein roter Lauf, der das
eigene Terminal umdreht, wäre eine Pointe zu viel. Eine eigene Prüfung misst das nach.

Dazu die Probe **im** Lauf (Abschnitt 5): ein `U+202E` in eine echte Datei des Baums eingesetzt,
aber nur im Arbeitsspeicher, gefunden — und die Datei selbst danach nachweislich sauber. Ohne sie
bliebe offen, ob der Weg von `git ls-files` bis zur Beanstandung überhaupt zusammenhängt.

---

## 3. O-AQ — `headersTimeout`. Heruntergesetzt, und nicht allein

### 3.1 Die Entscheidung: heruntersetzen, aber zu dritt

`headersTimeout` allein wäre eine halbe Antwort gewesen, und zwar gleich zweimal:

1. **Der Rumpf.** Wer eine Verbindung halten will, schickt einen vollständigen Kopf mit
   `Content-Length` und tröpfelt dann den Rumpf. Dann greift nicht `headersTimeout`, sondern
   `requestTimeout` — Vorgabe **fünf Minuten**. Nur den Kopf zu decken hieße, das Fenster zu
   verschieben statt es zu schließen.
2. **Die Granularität.** Node sieht beide Fristen nicht laufend nach, sondern in einem Takt:
   `connectionsCheckingInterval`, Vorgabe **30 Sekunden** (nachgesehen in der Node-Beschreibung zu
   `http.createServer(options)`, nicht aus dem Gedächtnis). Ein `headersTimeout` von fünf Sekunden
   ohne diesen dritten Wert wäre eine Zahl, die im schlechtesten Fall erst nach fünfunddreißig
   greift. Sie stünde im Quelltext und wäre trotzdem nicht wahr — die schlechteste Sorte
   Einstellung.

| Konstante (`apps/local-api/src/config.ts`) | Wert | Vorgabe von Node |
|---|---|---|
| `HEADERS_TIMEOUT_MS` | 5 000 | 60 000 |
| `REQUEST_RECEIVE_TIMEOUT_MS` | 10 000 | 300 000 |
| `CONNECTION_CHECK_INTERVAL_MS` | 5 000 | 30 000 |

Gesetzt über `serverOptions` von `createAdaptorServer` und nicht als drei Zuweisungen an den
fertigen Server: `connectionsCheckingInterval` wird beim **Anlegen** eingerichtet, eine spätere
Zuweisung an die Eigenschaft käme zu spät und sähe trotzdem so aus, als wirke sie. Der Rückgabetyp
bleibt `Server` aus `node:http` (ohne eigenes `createServer` nimmt der Adapter genau den) —
`closeAllConnections` aus T-126 bleibt also, wo es ist.

**Warum das nichts kostet.** Jeder Aufrufer ist ein Prozess auf demselben Rechner: die eigene
Oberfläche, der Aufgabenbereich des Add-ins, ein Testlauf. Über die Rückschleife ist ein
Anfragekopf in Bruchteilen einer Millisekunde da; es gibt keine langsame Verbindung, die fünf
Sekunden brauchen könnte. Der Wert trennt nichts, was jemals ankommen wollte. Und Node empfiehlt
für einen Dienst **ohne** Gegenlager im Netz ausdrücklich einen eigenen Wert — Takt ist selbst das
Erste, was die Verbindung sieht.

**Was `headersTimeout` nicht ersetzt.** Die Frist aus T-126 beim Anhalten bleibt. Die beiden
antworten auf verschiedene Fragen: Im Betrieb ist eine Verbindung, die gerade sendet, keine, die
man abweisen will; beim Anhalten ist sie genau das — der Bestand ist zu, die Anfrage kann nicht
mehr gelingen, und der Zeitpunkt gehört nicht dem Absender. Der Kommentar in `main.ts`, der bis
heute „warum nicht stattdessen `headersTimeout` heruntersetzen" begründete, sagt das jetzt so.

### 3.2 Gemessen: `proof:access` Abschnitt 0f, fünf neue Prüfungen

```
0f. Dieselbe halbe Anfrage im laufenden Betrieb (B-1.7, T-125-4 R2, T-128)
  ok    Die Fristen stehen unter den Vorgaben von Node (60 s Kopf, 300 s Anfrage)
  ok    Ein fremder Prozess hält eine Verbindung mit halbem Anfragekopf
  ok    Der Dienst trennt sie binnen 15000 ms — der fremde Prozess bestimmt nicht, wie lange
        getrennt nach 9982 ms
  ok    Und zwar über die Frist: Node antwortet mit 408
  ok    Der Dienst selbst läuft weiter — getrennt wird die Verbindung, nicht der Dienst
```

Die dritte Prüfung allein wäre zu wenig: Auch ein abgestürzter Dienst schließt Verbindungen. Die
**408** ist der Beleg, dass es die Frist war und nicht ein Unfall; die letzte, dass der Dienst
danach noch da ist. Die Erwartungen kommen aus `config.ts` und stehen nicht als Zahlen im Nachweis
— ein Nachweis, der seine Erwartung abschreibt, misst seine eigene Abschrift.

**Gegenprobe** (verlangt sich hier von selbst, weil eine Einstellung, die nicht ankommt, genauso
aussieht wie eine, die wirkt): `serverOptions` stillgelegt, Konstanten unverändert stehen gelassen.

| Stand | Ergebnis | Endstatus |
|---|---|---|
| **ohne `serverOptions`** | `getrennt nach gar nicht` — nach 22 Sekunden noch verbunden, keine 408. Zwei Prüfungen rot. Die erste blieb grün: Die Konstanten waren ja richtig. Genau das ist der Fund, den diese Gegenprobe sichtbar macht. | 1 |
| **vollständig** | `getrennt nach 9982 ms`, 408, Dienst antwortet weiter | 0 (97 bestanden) |

`main.ts` ist danach über `sha256sum -c` bytegleich zurückgesetzt.

Die 9982 ms liegen an der Summe der beiden Fristen (5 000 + 5 000) und nicht an der Luft der
Grenze; die fünf Sekunden Zuschlag sind für den Takt und einen ausgelasteten Rechner. Was die
Prüfung ausschließen soll, ist die Vorgabe von Node, und die schließt sie um den Faktor vier aus.

---

## 4. Die fünf defensiven Totzweige aus T-127 — bewertet und aufgelöst

**Die Bewertung zuerst:** Sie sind weder „richtig als Gürtel" noch „tot und gehören weg". Sie sind
etwas Drittes, und das ist der Grund, warum sie so schwer einzuordnen waren: **Sie sind der Preis
dafür, kein `!` zu schreiben.** `codePointAt(0)` ist mit `number | undefined` angegeben, weil eine
leere Zeichenkette keinen Codepunkt hat; aus `for...of` über eine Zeichenkette kommt aber nie ein
leeres Segment. Ohne die Prüfung übersetzt es nicht, mit `!` steht eine Behauptung im Baum, die
nichts prüft — und dieser Baum führt Behauptungen nur, wo er sie nicht vermeiden kann (T-126
Annahme 5, `patchOf` in `input.ts`).

Der Fehler war deshalb nicht, dass es die Prüfung gab, sondern dass es sie **viermal** gab, in drei
verschiedenen Schreibweisen. Das ist dieselbe Klasse wie alles andere in dieser Aufgabe: eine
Aussage, die an vier Stellen steht.

| Stelle | Vorher | Jetzt |
|---|---|---|
| `characters.ts:221` `hasForbiddenNameCharacter` | `code !== undefined && …` | `isForbiddenNameCharacter(codePointOf(character))` |
| `characters.ts:242` `hasHiddenCharacter` | `if (code === undefined) continue;` | entfällt |
| `characters.ts:264` `dropHiddenCharacters` | `code !== undefined && …` | entfällt |
| `characters.ts:297` `visibleText` | `code === undefined \|\| …` | entfällt |
| **neu** `codePointOf` | — | `character.codePointAt(0) ?? NO_CODE_POINT` — einmal, mit dem Grund dabei |
| `enumeration.ts:53` `enumerateGerman` | `parts[parts.length - 1] ?? ''` | `parts.slice(-1).join('')` — kein Zweig mehr |

`NO_CODE_POINT = -1`, weil Codepunkte nicht negativ sind: dauerhaft außerhalb jeder Klasse, die
man je eintragen könnte — anders als `0`, das mitten in C0 liegt und ein unbekanntes Segment
stillschweigend zu einem Steuerzeichen machte.

**Das Verhalten ist unverändert, und zwar auch für den konstruierten Eingang**, mit dem T-127 die
Zweige theoretisch erreichen könnte. Vorher übersprang jede der vier Stellen ein Segment ohne
Codepunkt und ließ es unverändert durch; jetzt liefert `codePointOf` dafür `-1`, das in keinem
Bereich liegt, und jede der vier Stellen lässt es unverändert durch. Dieselbe Ausgabe, ein Zweig
statt vier.

Bei `enumerateGerman` ist die Umformung nachweisbar wortgleich: Für `parts.length > 1` hat
`slice(-1)` genau einen Eintrag, und `join('')` gibt ihn heraus. **`poolMovementSentence` ist nicht
angefasst** (O-AN), und an den vierzehn zeichengenau geprüften Sätzen ändert sich nichts — 1001
Prüfungen grün, darunter die 154 aus T-127.

**Gemessen** (`pnpm test:coverage`):

| Datei | vor T-128 | nach T-128 |
|---|---|---|
| `characters.ts` | 97,22 / 96 / 100 / 100 — offene Zeile 242 | **100 / 95 / 100 / 100** — offene Zeile 236 |
| `enumeration.ts` | 100 / 83,33 / 100 / 100 — offene Zeile 53 | **100 / 100 / 100 / 100** |

`enumeration.ts` ist zu. Bei `characters.ts` sind die Anweisungen jetzt vollständig gedeckt (der
eigenständige `continue`-Zweig ist weg), und von den Zweigen bleibt **einer** offen: die rechte
Seite des `??` in `codePointOf`. Die Zweigquote sinkt nominell von 96 auf 95 Prozent, weil auch
die Gesamtzahl der Zweige gesunken ist — ein unerreichbarer von zwanzig statt vier von hundert.
Diesen einen wegzubekommen ginge nur mit `!`, und das wäre ein schlechterer Tausch: eine
Behauptung gegen eine Kennzahl.

---

## 5. Nachweis

Jeder Befehl einzeln, Ausgabe in eine Datei umgeleitet, Endstatus unmittelbar danach gelesen —
keine Pipe (zsh `pipestatus`). Alle Läufe **nach** der letzten Änderung.

| Befehl | Endstatus | Ergebnis | Marke nach Welle M |
|---|---|---|---|
| `pnpm typecheck` | **0** | 8 Pakete, 7 Test-Konfigurationen, `tests/e2e` | — |
| `pnpm test` | **0** | 58 Dateien, **1001/1001** | 991 — die 10 Zusätzlichen sind **fremd** (unit-tester, T-131, parallel) |
| `pnpm test:coverage` | **0** | 1001; `characters.ts` 100/95/100/100, `enumeration.ts` 100/100/100/100, `text-length.ts` 100/100/100/100; alle drei 80-Prozent-Schwellen gehalten | — |
| `pnpm proof:all` | **0** | 13 Ketten, **891** Prüfungen | 886 — **+5 durch Abschnitt 0f**, sonst unverändert |
| `pnpm proof:access` | **0** | **97** | 92 — **+5** |
| `pnpm proof:openapi` | **0** | 110 | 110 — unverändert, keine Route und kein Schemawert geändert |
| `pnpm boundaries` | **0** | 333 Dateien, „Notiz-Trennung: alle Schichten unverletzt" | — |
| `node scripts/proof-codepoints.mjs` | **0** | **45**, davon 613 versionierte und 8 neue Dateien | neu |

Dazu die drei Gegenproben (Endstatus je **1**, jede an genau der vorgesehenen Stelle rot) und die
beiden bytegleichen Wiederherstellungen über `sha256sum -c`.

**Zur DoD-Zeile Migration:** kein Schemawechsel; `proof:migrations` läuft in `proof:all` mit.
**Zur DoD-Zeile OpenAPI:** Diese Aufgabe ändert keine Route, kein Schema und keinen Statuscode; die
Werte hinter `titleSchema`, `nameSchema` und `paginationSchema` sind dieselben, sie kommen nur von
woanders her. `proof:openapi` steht unverändert bei 110. Den Add-in-Abschnitt habe ich nicht
angefasst (E-053).

**Zwei Läufe mussten wiederholt werden, und beide Male lag es nicht am Gegenstand:**

1. Der erste `pnpm proof:access` lief gegen einen **fremden** Dienst auf 17843 — e2e-tester fährt
   parallel Playwright, das denselben Port belegt. Symptom: 0f meldet „getrennt", aber keine 408,
   und danach `ECONNREFUSED`. Nachgesehen (`ss -ltnp`, `ps`), gewartet, wiederholt. Das ist genau
   der Zustand, vor dem `waitForPortFree` im Nachweis warnt.
2. Ein `pnpm proof:all` fiel in `proof:access` Abschnitt 13 aus (zeitkonstanter Vergleich, Streuung
   1,97 statt unter 1,25). Eine Zeitmessung auf einem Rechner, der gleichzeitig einen
   Playwright-Lauf trägt. Der Wiederholungslauf ist grün. **Kein Zusammenhang mit dieser Aufgabe**,
   aber ein Hinweis für den Orchestrator (siehe Risiken).

Kein fremder Prozess beendet, kein `git commit`, kein `stash`, kein `checkout`. Ports 17843/17844
nach dem letzten Lauf frei, kein verwaister Sidecar (nachgesehen).

---

## 6. Artefakte

| Datei | Was |
|---|---|
| `packages/domain/src/text-length.ts` | **neu** — `MAX_TITLE_CHARACTERS = 500` mit Begründung und der ausdrücklichen Liste dessen, was hier *nicht* steht |
| `packages/domain/src/index.ts` | die neue Datei ausgeführt |
| `packages/domain/src/characters.ts` | `codePointOf` und `NO_CODE_POINT`; die vier defensiven Zweige zu einem zusammengelegt |
| `packages/domain/src/enumeration.ts` | `enumerateGerman` ohne den unerreichbaren `?? ''`, mit dem Grund dabei |
| `apps/local-api/src/http/input.ts` | `titleSchema`, `nameSchema` und `paginationSchema` lesen die Zahlen, statt sie zu tragen; die Begründung dazu |
| `apps/local-api/src/config.ts` | `HEADERS_TIMEOUT_MS`, `REQUEST_RECEIVE_TIMEOUT_MS`, `CONNECTION_CHECK_INTERVAL_MS` mit der vollständigen Begründung, warum es drei sind |
| `apps/local-api/src/main.ts` | `serverOptions` am `createAdaptorServer`; der T-126-Kommentar „warum nicht `headersTimeout`" auf den neuen Stand gebracht |
| `apps/local-api/scripts/proof-codepoints.mjs` | **neu** — der Wächter, 45 Prüfungen |
| `apps/local-api/scripts/proof-access.mjs` | Abschnitt 0f (5 Prüfungen), Erwartungen aus `config.ts` gelesen |
| `docs/architektur.md` | neuer Abschnitt 5.0b (der Wächter); 6.5 Punkt 6 (die drei Fristen des Betriebs) |
| `.claude/team/reports/T-128-domain-dev.md` | dieser Bericht |

**Nicht angefasst:** `apps/local-api/src/routes/addin/**` und der Add-in-Abschnitt der OpenAPI
(E-053), `apps/outlook-addin/**`, `packages/export/**`, `apps/web/**`, `apps/desktop/**`, alle
Testordner, `docs/bedrohungsmodell.md`, `docs/datenmodell.md`, `docs/testplan.md`,
`poolMovementSentence` (O-AN) und jede gemeinsame Datei.

---

## 7. Annahmen

1. **`MAX_TITLE_CHARACTERS` in eine eigene Datei und nicht zu `MAX_NAME_LENGTH` in `tag-name.ts`.**
   Ein Titel ist kein Name; `tag-name.ts` handelt vom Vergleichsschlüssel und der Faltung, mit der
   die 200 zusammenhängt. `MAX_NAME_LENGTH` habe ich deshalb **nicht** umgezogen — der Umzug
   brächte einen zweiten Namen für dieselbe Zahl, und das ist die Krankheit, nicht die Kur.
2. **Zwei weitere Zahlen mitgenommen** (`MAX_NAME_LENGTH`, `MAX_PAGE_SIZE`), weil sie dieselbe
   Klasse sind, beide in meinen Dateien liegen und die erste sogar einen Kommentar hatte, der die
   Verabredung aussprach. Die vierte (`tagIds`, 200) habe ich **nicht** angefasst: Eine ihrer drei
   Stellen gehört integration-dev, und eine halb umgestellte Zahl sieht aus wie erledigt.
3. **Der Tabulator bleibt erlaubt**, überall. Er ist sichtbar, macht keine Datei binär und dreht
   keine Zeile um; ein Makefile besteht ohne ihn nicht. Der Baum trägt heute in keiner Textdatei
   einen einzigen — gemessen. Als benannter blinder Fleck im Kopf der Datei.
4. **`U+200B`–`U+200D` und `U+FEFF` werden beanstandet, obwohl die Domäne sie in einem *Namen*
   erlaubt.** In einem Namen hält das ZWJ ein Familien-Emoji zusammen; in einer Datei ist es ein
   unsichtbares Zeichen zwischen zwei Buchstaben, und es gibt eine Escape-Folge dafür. Braucht eine
   Testdatei doch einmal das rohe Zeichen, ist genau das der Fall für eine Ausnahme mit Zahl.
5. **Der Wagenrücklauf ist nur vor einem Zeilenumbruch erlaubt.** Heute ohne Wirkung (null CR im
   Baum), für den Windows-Tag gedacht.
6. **Ein einzelner Codepunkt-Lauf für den ganzen Baum, kein Vorlauf je Paket.** Er braucht eine
   Sekunde; ihn aufzuteilen brächte Verwaltung und keinen Nutzen.
7. **`requestTimeout` mitgesetzt**, obwohl der Auftrag nur `headersTimeout` nannte. Begründung in
   3.1: Ohne ihn verschiebt man das Fenster von 60 auf 300 Sekunden, statt es zu schließen.
8. **`CONNECTION_CHECK_INTERVAL_MS = 5 000`** ist der Tausch zwischen Genauigkeit der Frist und
   einem Weckruf alle fünf Sekunden. Bei 1 000 wäre die Frist genauer und der Prozess unruhiger;
   bei der Vorgabe 30 000 wären die fünf Sekunden der Kopf-Frist eine Angabe ohne Wirkung.
9. **Der Aufgabenbereich auf 17844 hat die Fristen nicht bekommen.** Er liegt in meiner Hoheit, und
   dieselbe Überlegung gälte — aber er liefert nur statische Dateien, und der Auftrag nannte den
   Dienst. Als offene Frage geführt statt still miterledigt.
10. **`docs/architektur.md` nachgezogen, `docs/bedrohungsmodell.md` nicht.** Das Modell gehört dem
    security-checker; R2 aus T-126 ist mit dieser Aufgabe geschlossen und will von ihm nachgemessen
    werden, nicht von mir umgeschrieben.

---

## 8. Risiken

**R1 — Der Wächter läuft in keiner Kette.** Bis der Orchestrator den Eintrag setzt, ist er ein
Skript, das jemand von Hand aufrufen muss — also genau die Sorte Prüfung, die den Fund nicht
verhindert hätte. Das ist das wichtigste offene Stück dieser Aufgabe. Vorschlag in 2.1.

**R2 — Der Wächter sieht nur Zeichen, keine Homoglyphen.** Ein kyrillisches „а" in einem Bezeichner
sieht aus wie ein lateinisches und ist keins. Andere Klasse, andere Prüfung, im Kopf der Datei als
blinder Fleck benannt. Sicherheitlich ist das der nächstgrößere Rest derselben Familie.

**R3 — Es gibt kein `.gitattributes`.** Die CR-Regel des Wächters wäre wirksamer, wenn Git die
Zeilenenden selbst normalisierte (`* text=auto eol=lf`). Ohne das kann ein Windows-Beitrag eine
Datei mit CRLF anlegen; der Wächter lässt sie durch (CRLF ist erlaubt), aber der Baum wird
uneinheitlich. `.gitattributes` ist keine Datei, die in meiner Hoheit steht — offene Frage 3.

**R4 — Sicherheit, behoben und benennenswert:** Bis zu dieser Aufgabe konnte jeder Prozess auf dem
Rechner eine Verbindung des Dienstes **eine Minute** lang mit einem halben Anfragekopf binden und
mit einem tröpfelnden Rumpf **fünf Minuten** — ohne ein Geheimnis zu kennen, beliebig oft
nebeneinander. Das ist keine Lebensdauerfrage mehr (T-126), aber eine Betriebsmittelfrage: Genug
davon, und die eigene Oberfläche bekommt keine Verbindung mehr. Gemessen und auf zehn Sekunden
gebracht. Der Rest — dass ein lokaler Prozess überhaupt verbinden darf — ist VG-1 und bleibt.

**R5 — Eine Zeitmessung im Nachweis ist von der Last des Rechners abhängig.** `proof:access`
Abschnitt 13 (zeitkonstanter Vergleich) fiel einmal aus, während parallel ein Playwright-Lauf lief,
und war im Wiederholungslauf grün. Das ist keine Regression, aber eine Prüfung, die in einer
parallelen Welle gelegentlich rot wird und dann Zeit kostet. Nicht meine Datei zum Ändern in dieser
Aufgabe, aber ein Hinweis wert.

**R6 — Zwei Agenten teilen sich Port 17843.** `proof:access` und der e2e-Lauf können nicht
gleichzeitig fahren; der Nachweis merkt es zwar (`waitForPortFree`), aber erst in der Mitte. In
dieser Welle hat mich das zwei Läufe gekostet. Eine Wellenplanung, die beide nicht nebeneinander
stellt, wäre billiger als jede technische Behebung.

**R7 — `characters.ts` und `enumeration.ts` sind Dateien mit 154 fremden Tests darauf** (T-127).
Meine Änderung ist verhaltensgleich und gemessen grün, aber sie ist eine Umformung an einer Stelle,
die gerade erst zeichengenau vermessen wurde. Der unit-tester sollte wissen, dass die Zeilennummern
aus seinem Bericht sich verschoben haben.

---

## 9. Offene Fragen

1. **Den Eintrag für `proof:codepoints` setzen** (Skriptname und beide Zeilen in 2.1). Ohne ihn ist
   der Wächter ein Skript und kein Wächter.
2. **`ADDIN_NOTE_MAX_LENGTH` (4000) und `MAX_TAKEOVER_CHARACTERS` (4000)** sind dieselbe Zahl an
   zwei Flächen, und in `routes/addin/schema.ts` liest die Zeile 213 die zwei Zeilen darüber
   definierte Konstante nicht einmal. Alle drei Stellen gehören integration-dev. Vorschlag: eine
   Aufgabe, die die Zahl nach `packages/domain/src/text-length.ts` legt und alle drei Stellen
   umstellt — zusammen mit dem Nachziehen von `MAX_TITLE_CHARACTERS` im Add-in (1.2).
3. **Soll es ein `.gitattributes` mit `* text=auto eol=lf` geben?** (R3) Gemeinsame Datei, deshalb
   nur der Vorschlag.
4. **Bekommt der Aufgabenbereich auf 17844 dieselben drei Fristen?** (Annahme 9) Er liegt in meiner
   Hoheit, aber es ist eine eigene Entscheidung: Er liefert statische Dateien, hat aber dieselbe
   Vertrauensgrenze.
5. **`tagIds: max(200)` an zwei Türen** (1.3, letzte Zeile) — eine kleine Aufgabe, die beide
   zugleich umstellt, oder bewusst so lassen?
6. **Vergleichsmarken neu setzen:** `test` 1001, `proof:all` 891, `proof:access` 97, dazu
   `proof:codepoints` 45. Von den +10 bei `test` sind null meine, von den +5 bei `proof:all` alle.

---

## 10. Nächster Schritt

1. **Orchestrator: `proof:codepoints` in `proof:all` aufnehmen** (2.1), als erstes Glied.
2. **integration-dev: `MAX_TITLE_CHARACTERS` im Add-in nachziehen** (1.2, zwei Zeilen) und danach
   `proof:addin` Abschnitt 16 vom Zahlenvergleich auf die Herkunftsfrage umstellen — dieselbe
   Bewegung wie bei der Zeichenklasse in T-123. Im selben Zug die drei 4000er (offene Frage 2).
3. **security-checker: T-126 R2 nachmessen.** Die drei Fristen stehen, Abschnitt 0f misst sie, die
   Gegenprobe ohne `serverOptions` liegt vor (22 Sekunden noch verbunden). Danach ist von dieser
   Familie nichts mehr offen außer den Homoglyphen (R2).
4. **unit-tester: Zeilennummern.** Die fünf gemeldeten Totzweige sind vier weniger geworden; der
   verbliebene steht in `codePointOf` (`characters.ts`, eine Zeile). `enumeration.ts` ist bei 100
   Prozent Zweigabdeckung.
