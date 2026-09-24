# T-134 — O-AS und der Add-in-Anteil von O-AR

```
Aufgabe: T-134 — O-AS und der Add-in-Anteil von O-AR
Status: fertig
```

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (**E-063**, alle sechs Punkte; Punkt 5 ist der
Auftrag), `docs/spec.md` (A-7.1 bis A-7.4, A-10.5), `docs/bedrohungsmodell.md` (B-12.3),
`.claude/team/reports/T-128-domain-dev.md` (1.2, 1.3, offene Fragen 2 und 5),
`T-131-unit-tester.md` (die Bewegung von der Randtabelle zur Gleichheitsprüfung),
`T-123-integration-dev.md` (Abschnitt 16 und 17, das Muster mit der Gegenprobe),
`board.md` „Welle vom 2026-09-04, Welle O".

Stand vor der Arbeit: `0635aea`, `proof:addin` **165**, `proof:openapi` **110**,
`proof:addin-wiring` **32**.

---

## 1. O-AS — die Zahl kommt aus einer Quelle, und der Nachweis fragt danach

### 1.1 Schritt eins: das Add-in liest, statt zu führen

`apps/outlook-addin/src/office/mail.ts` trug `MAX_TITLE_CHARACTERS = 500`. Sie steht jetzt genau
einmal im Baum, in `packages/domain/src/text-length.ts` (T-128), und das Add-in holt sie dort —
dieselbe Bewegung wie `../text/hidden.ts` bei der Zeichenklasse:

```ts
import { MAX_TITLE_CHARACTERS } from '@takt/domain';
…
export { MAX_TITLE_CHARACTERS };
```

Die Ausfuhr unter demselben Namen bleibt, damit die Aufrufstellen und `proof-addin.mjs` den Deckel
weiterhin dort finden, wo sie ihn suchen. Der Kommentar, der bis heute erklärte, warum die Zahl
zweimal dastehen *muss*, ist durch den ersetzt, der sagt, warum sie es nicht mehr tut.

### 1.2 Schritt zwei — und der ist der eigentliche

Abschnitt 16 hielt bis heute `MAX_TITLE_CHARACTERS` des Add-ins gegen das Schema des Dienstes. Das
ist die Prüfung, die den Schaden bewacht und nicht die Ursache: Führen beide Seiten dieselbe
falsche Zahl, bleibt sie grün. Sie ist ersetzt durch die Frage **„kommt der Wert an dieser Stelle
aus `@takt/domain`?"**.

**Und hier liegt der Unterschied zu T-123 und T-131, der die Arbeit ausgemacht hat.** Für die
Zeichenklasse genügt `assert.equal(dropHidden, dropHiddenCharacters)`: Zwei Funktionen sind genau
dann dieselbe Sache, wenn sie dasselbe Objekt sind. **Eine Zahl hat keine Kennung.** `500 === 500`
ist wahr, gleichgültig, wo die beiden Fünfhundert herkommen — die Herkunftsfrage lässt sich an
einem Zahlenwert zur Laufzeit überhaupt nicht stellen. Die Denkweise aus T-131 ist übernommen, die
Zeilen konnten es nicht sein.

Gestellt wird sie deshalb am **Quelltext**, in drei Teilen, die einzeln nichts und zusammen alles
sagen:

| Teil | Was er prüft | Was er allein bemerkt |
|---|---|---|
| 1 | Keine `.ts`/`.tsx` des Aufgabenbereichs (ohne Kommentare) trägt die Zahl | eine **daneben angelegte Kopie** |
| 2 | `mail.ts` holt den Namen aus `@takt/domain` und erklärt ihn nicht selbst | eine **Umleitung** |
| 3 | Der Wert, den der Aufgabenbereich herausgibt, ist der der Domäne | eine **Verwechslung** (`MAX_NAME_LENGTH as MAX_TITLE_CHARACTERS`) |

**Das Muster für Teil 1 wird aus der Domäne erzeugt, nicht hingeschrieben:**

```js
const zahl = new RegExp(`(?<![\\d_])${String(DOMAENE_MAX_TITEL)}(?![\\d_])`);
```

Änderte die Domäne ihren Wert, suchte derselbe Lauf im selben Durchgang nach dem neuen. Ein
Wächter, der seine eigene Zahl abschriebe, wäre wieder genau das Muster, gegen das er steht
(E-063 Punkt 4).

Vom alten Vergleich bleibt getrennt davon eine Prüfung stehen, die **nicht** tautologisch ist:
dass `zod` den Deckel an beiden Türen tatsächlich anwendet. Sie misst jede Tür einzeln gegen die
Domäne und keine gegen die andere (T-123): Zwei Türen, die einander gleichen, können gemeinsam
falsch liegen; dass sie einander gleichen, folgt jetzt, statt gemessen zu werden.

### 1.3 Die Messung — zwei Gegenproben, und die erste ist die wichtige

Beide in eigener Hoheit (`mail.ts`), Datei vorher gesichert, danach über `sha256sum -c`
**bytegleich** wiederhergestellt. Für die Gegenprobe steht die **alte** Prüfung als eigenes Skript
im Scratch-Verzeichnis, damit „der alte Vergleich bliebe grün" gemessen ist und nicht behauptet.

**Gegenprobe A — eine zweite Fassung mit derselben, richtigen Zahl** (der Zustand vor T-134,
wörtlich: `export const MAX_TITLE_CHARACTERS = 500;` ohne den Import):

| | Ergebnis | Endstatus |
|---|---|---|
| **ALT** (der Zahlenvergleich, wie er bis heute dastand) | `ok  die Länge läuft ebenfalls nicht auseinander [Add-in führt 500]` | **0** |
| **NEU** (`proof:addin`) | **168 bestanden, 1 fehlgeschlagen** — „der Aufgabenbereich führt die Zahl 500 selbst, in: office/mail.ts" | **1** |

**Das ist die Aussage des Auftrags als Zahl.** Die Doppelung ist noch nicht falsch, sie ist nur da
— und der alte Vergleich verträgt sie widerspruchslos. Genau so hat die Zeichenklasse fünf Wellen
überlebt.

**Gegenprobe B — eine bewusst abweichende zweite Zahl** (`= 499`):

| | Ergebnis | Endstatus |
|---|---|---|
| **ALT** | `FEHL  die Add-in-Tür nimmt mehr als ihren Deckel` | 1 |
| **NEU** (`proof:addin`) | **167 bestanden, 2 fehlgeschlagen** — „mail.ts liest die Domäne nicht", dazu ein Folgefehler in Abschnitt 17 | **1** |

Der Vergleich der beiden Zeilen ist der Ertrag: B fangen beide, A nur der neue.

Bemerkenswert an B: `beide Türen wenden den Deckel wirklich an` blieb **grün**. Richtig so — diese
Zeile misst die Bindung der Türen an die Domäne, und die war unverletzt; falsch war die dritte
Stelle. Die beiden Prüfungen sagen Verschiedenes, und man sieht es an ihnen.

---

## 2. Der Add-in-Anteil von O-AR

### 2.1 `tagIds: max(200)` — benannt, gemessen, nicht halb umgestellt

`ADDIN_TAG_IDS_MAX = 200` steht jetzt mit Grund in `routes/addin/schema.ts`; das Schema liest ihn.
Die zweite Tür (`routes/todos.ts`, `createSchema` **und** `updateSchema`) liegt außerhalb dieser
Aufgabe. Sie ist **nicht** angefasst, aus dem Grund, den T-128 selbst genannt hat: Eine halb
umgestellte Zahl ist schlechter als eine ganz doppelte, weil sie aussieht wie erledigt.

Stattdessen ist die Verabredung von einem Kommentar zu einer Messung geworden. Abschnitt 16 hält
für `tagIds` **und** `tagNames` beide Türen an derselben Stelle gegeneinander — Grenze angenommen,
Grenze plus eins abgewiesen, für jede Tür einzeln. Der Satz an `ADDIN_TAG_NAMES_MAX` („dieselbe
Zahl wie in `routes/todos.ts`") war bis heute eine Zusicherung, die niemand ausführt: E-063 Punkt 5
in seiner mildesten Form, dieselbe Bauart, an der T-114 gescheitert ist.

**Im Bericht gesagt und nicht im Quelltext versteckt:** Das ist ein Zahlenvergleich und damit die
schwächere Prüfung — genau die, die eine Seite weiter oben für den Titeldeckel abgelöst wurde. Er
steht hier trotzdem, weil die stärkere Frage noch nicht gestellt werden *kann*: Solange es keine
gemeinsame Quelle gibt, gibt es keine Herkunft zu prüfen. Er ist die Zwischenstufe bis zum Umzug
(offene Frage 2), nicht das Ziel.

### 2.2 Die beiden `4000` — und die eine, die **nicht** dieselbe ist

T-128 hat sie als „eine Doppelung innerhalb derselben Datei" gemeldet. Nachgesehen ist sie **keine**:

| | `ADDIN_NOTE_MAX_LENGTH` | die 4000 in `bookSchema` |
|---|---|---|
| Feld | interner Vermerk des Todos (A-7.1) | Leistung der Buchung (A-7.3) |
| Herkunft des Textes | **vorbelegt aus der E-Mail** (B-12.3) | getippt im Aufgabenbereich |
| Weg nach draußen | keiner — nie im Export (A-7.2) | **in die Abrechnungsdatei** (A-7.4) |
| Grund für die Grenze | B-12.3 Punkt 3: kein Zitatverlauf | keiner, der aufgeschrieben wäre |
| Gegenstück an der Haupttür | `textSchema` | `textSchema` |

Die beiden zusammenzulegen hieße zu behaupten, ein übernommener E-Mail-Kontext und eine
abgerechnete Leistung seien dieselbe Sache und änderten sich gemeinsam. Fiele die Grenze des
Vermerks morgen aus B-12.3-Gründen auf 2000, hätte das mit der Leistung nichts zu tun. Gleiche
Zahl ist nicht gleiche Bedeutung — sie steht deshalb als `ADDIN_BOOKING_NOTE_MAX_LENGTH` mit
eigenem Namen und der Begründung an Ort und Stelle, statt in einer gemeinsamen Konstante zu
verschwinden.

**Ihr wirklicher Namensvetter ist ein anderer, und er sagt etwas anderes.** Dieselbe Spalte wird
über die Hauptanwendung mit `textSchema` gefüllt, und `textSchema` nimmt **mehr** an. Dieselbe
Leistung geht über den einen Weg durch und über den anderen nicht — die Bauart des Befunds C-03.
Eine Sackgasse ist es heute nicht (der Aufgabenbereich belegt dieses Feld nicht vor und bearbeitet
keine bestehende Buchung), aber ob die Türen verschieden bleiben **sollen**, ist eine Entscheidung
und keine Aufräumarbeit: Sie ändert eine Zusage der Schnittstelle und gehört nach `decisions.md`.
**Offene Frage 3.** Gemessen wird solange die Richtung, in der eine Abweichung weh täte: Was die
Add-in-Tür annimmt, nimmt die Haupttür auch an. Diese Zeile bleibt auch dann grün, wenn der
Orchestrator andersherum entscheidet.

**Die dritte 4000** (`MAX_TAKEOVER_CHARACTERS` im Add-in) ist dagegen **dieselbe Wahrheit** wie
`ADDIN_NOTE_MAX_LENGTH` — und aufgelöst werden kann sie nur in `@takt/domain`, weil ein
Browserbündel `@takt/local-api` nicht einbinden darf. Das ist fremde Hoheit; gemeldet als **offene
Frage 1**, mit dem Grund an beiden Stellen im Quelltext. Bis dahin misst Abschnitt 16 beide Seiten
gegeneinander.

---

## 3. Was dabei herausfiel und keine Aufräumarbeit war: ein 422 auf einen Text, den der Benutzer nicht geschrieben hat

Beim Nachmessen der beiden 4000 gegen die Tür statt gegeneinander:

```
Emoji ohne Zeilenumbruch:        Länge 4011 | Deckel 4000/4000 | Tür nimmt an: false
langer Fließtext ohne Umbruch:   Länge 4011 | Deckel 4000/4000 | Tür nimmt an: false
langer Text mit Umbrüchen:       Länge 3999 | Deckel 4000/4000 | Tür nimmt an: true
```

`prepareNote` schnitt auf `MAX_TAKEOVER_CHARACTERS` und hängte den Hinweis „(gekürzt)"
**danach** an — elf Zeichen über den Deckel, den `ADDIN_NOTE_MAX_LENGTH` an derselben Tür
durchsetzt. Und zwar in **jedem** Fall, in dem die zweite Hälfte des Textes keinen Zeilenumbruch
trägt: eine lange Mail ohne Absätze, ein Zitatverlauf aus einer Zeile, ein Textkörper aus Emoji.

Der Benutzer drückt „Inhalt der E-Mail übernehmen", dann „Anlegen" — und bekommt ein 422 auf ein
Feld, dessen Inhalt er nicht geschrieben hat, mit keiner anderen Auflösung als „elf Zeichen von
Hand löschen". Das ist die Sackgasse aus T-114, unverändert, nur elf Zeichen weiter und an der
Notiz statt am Titel (A-10.5, B-12.3 Punkt 3).

**Warum ihn niemand gefunden hat, und das ist der lehrreiche Teil:** Abschnitt 17 prüfte den
Vermerk gegen eine **Rechnung** —

```js
assert.ok(vermerk.length <= MAX_TAKEOVER_CHARACTERS + '\n…(gekürzt)'.length, …);
```

— also gegen genau die Rechnung, die der Fehler anstellt. Eine Erwartung, die den Prüfling
nachbaut, bestätigt ihn. Sie war seit T-119 grün. Das ist E-063 Punkt 5 in einer Form, die dort
noch nicht steht: nicht eine abgeschriebene Liste und nicht eine zweite Fassung, sondern eine
**abgeschriebene Rechnung** im Nachweis.

Behoben (der Schnitt bekommt sein Budget abzüglich des Hinweises, der Hinweis heißt jetzt
`TRUNCATION_HINT`, weil seine Länge in die Rechnung eingeht), und die Erwartung zeigt jetzt auf die
Tür statt auf die Rechnung.

**Gegenprobe C** — die Rechnung von vor T-134 wieder eingesetzt, `proof:addin`:

```
FEHL  der übernommene Vermerk passt durch die Tür, die ihn annehmen soll (B-12.3, T-134)
      ein Textkörper aus Emoji: der Vermerk ist 4011 Zeichen lang, die Tür nimmt 4000
FEHL  der Vermerk wird ebenso an einer Zeichengrenze gekürzt
      Länge 4010 — mehr als der Deckel
167 bestanden, 2 fehlgeschlagen.                                          Endstatus 1
```

`mail.ts` danach über `sha256sum -c` bytegleich zurückgestellt.

---

## 4. Eine Zahl in zwei Beschreibungen, die seit langem falsch war

`routes/addin/schema.ts` und der Add-in-Abschnitt der OpenAPI sagten beide „4000 Zeichen und nicht
**65536** wie über die Hauptanwendung". Die Haupttür nimmt `textSchema`, und das ist weniger. Die
Zahl 65536 kommt sonst nirgends im Dienst vor.

Beide Stellen **zeigen** jetzt auf den Namen, statt eine fremde Zahl abzuschreiben — dieselbe
Bewegung, die T-123 für die Zeichenaufzählung gemacht hat: Eine Beschreibung, die nichts aufzählt,
kann nicht hinterherhinken. Kein `maxLength`, kein `maxItems` und kein Statuscode wurde dabei
geändert; `proof:openapi` steht unverändert bei 110.

**Nicht meine Hoheit, deshalb nur gemeldet:** `apps/web/src/screens/TodoDetailScreen.tsx:559` und
`TodoFormDialog.tsx:227` setzen `maxLength={65536}` an den Notizfeldern, während die Tür weniger
annimmt. Das ist derselbe Befund wie oben, aber mit Wirkung: Ein Benutzer darf im Feld mehr tippen,
als der Dienst annimmt, und erfährt es erst beim Speichern. **Offene Frage 4.**

---

## 5. Nachweis

Jeder Befehl einzeln, Ausgabe in eine eigene Datei
(`/tmp/claude-1000/-home-kerem-Projects-SuperTakt/ccf1123c-…/scratchpad/t134/`), Endstatus
unmittelbar danach gelesen — keine Pipe. Alle Läufe **nach** der letzten Änderung.
`pnpm desktop` und `pnpm test:e2e` **nicht gestartet** (17843/17844 gehören dem Auftraggeber);
Ports vor und nach jedem Lauf nicht belegt worden — keiner meiner Befehle bindet einen.

| Befehl | Endstatus | Ergebnis | Marke nach Welle N |
|---|---|---|---|
| `pnpm typecheck` | **0** | 8 Pakete, 7 Test-Konfigurationen, `tests/e2e` | — |
| `pnpm typecheck:test` | **0** | sieben Konfigurationen | — |
| `pnpm test` | **0** | 59 Dateien, **1010/1010** | 1001 — die +9 und die 59. Datei sind **fremd** (parallele Welle) |
| `pnpm run proof:addin` | **0** | **169** | 165 → **+4** |
| `pnpm run proof:openapi` | **0** | 110 | 110 — unverändert |
| `pnpm run proof:addin-wiring` | **0** | 32 | 32 — unverändert |
| `pnpm run proof:codepoints` | **0** | 45 | 45 — unverändert |
| Gegenprobe A, ALT | 0 | **grün** — der alte Vergleich verträgt die Doppelung | — |
| Gegenprobe A, NEU | **1** | 168 ok, **1 FEHL** an genau der neuen Zeile | — |
| Gegenprobe B, ALT | 1 | rot | — |
| Gegenprobe B, NEU | **1** | 167 ok, **2 FEHL** | — |
| Gegenprobe C (die alte Rechnung in `prepareNote`) | **1** | 167 ok, **2 FEHL** | — |
| `sha256sum -c` nach A/B und nach C | — | `mail.ts: OK` (zweimal) | — |

**Die +4 im Einzelnen:** eine Prüfung entfällt (der Zahlenvergleich), fünf kommen hinzu — die
Herkunftsfrage, die Bindung beider Türen an die Domäne, die Listengrenzen an beiden Türen, der
übernommene Vermerk gegen die Tür, die Leistung in der Richtung, die weh täte.

**Zur DoD-Zeile Base64:** unverändert gedeckt und im Lauf gemessen — Abschnitt 10, „Base64 Hin- und
Rückweg mit Umlauten, Eszett und Emoji", „Die Standardvorlage bildet Call, Zeit, Notiz (Base64) und
WindowsUser ab", „Eine abweichende Vorlage erzeugt andere Felder in anderer Reihenfolge",
„A-7.2/R-06: der interne Vermerk ist als Feldquelle nicht wählbar". `packages/export` ist in dieser
Aufgabe **nicht angefasst**; der geänderte Vermerk läuft in Abschnitt 17 zusätzlich durch
`fromBase64(toBase64(...))`.

**Hygiene:** eigener Codepunkt-Scan über alle vier geänderten Dateien — kein rohes Steuer-,
Richtungs- oder unsichtbares Zeichen; `proof:codepoints` über den ganzen Baum grün. Keine echte
Call-Nummer, kein Kundenname, keine Zugangsdaten: Die Prüfdaten sind „Wartung Nord", „Störung
Lüftung", „Ost 0…", `a.beispiel@example.org` und erfundene UUIDs der Form
`00000000-0000-4000-8000-…`.

**Ein Lauf musste wiederholt werden, und es lag nicht am Gegenstand.** Ein `pnpm typecheck` fiel
mit `apps/web/src/screens/TemplateFields.tsx(106,66): error TS2304: Cannot find name 'ForeignText'`
aus — eine Datei von frontend-dev, die in derselben Welle bearbeitet wird (T-133, `git status`
zeigt sie als geändert). Meine drei Pakete (`@takt/outlook-addin`, `@takt/local-api`,
`@takt/export`) waren im selben Lauf einzeln grün; der Wiederholungslauf Minuten später war
vollständig grün. Gemeldet, nicht gedeutet.

---

## 6. Artefakte

| Datei | Was |
|---|---|
| `apps/outlook-addin/src/office/mail.ts` | `MAX_TITLE_CHARACTERS` aus `@takt/domain` statt eigener Zahl; `TRUNCATION_HINT` und der behobene Schnitt in `prepareNote`; Begründung an `MAX_TAKEOVER_CHARACTERS`, warum sie noch zweimal dasteht |
| `apps/outlook-addin/scripts/proof-addin.mjs` | Abschnitt 16: Zahlenvergleich → Herkunftsfrage (dreiteilig, Muster aus der Domäne erzeugt); Bindung beider Türen gegen die Domäne; Listengrenzen an beiden Türen; der übernommene Vermerk gegen die Tür; die Leistung in der Richtung, die weh täte. Abschnitt 17: die Erwartung, die den Fehler nachrechnete, zeigt jetzt auf den Deckel |
| `apps/local-api/src/routes/addin/schema.ts` | `ADDIN_TAG_IDS_MAX` und `ADDIN_BOOKING_NOTE_MAX_LENGTH` neu, mit Begründung; kein nackter Zahlenwert mehr in einem Schemafeld; die stale „65536" ersetzt |
| `apps/local-api/openapi/takt-local-api.yaml` | nur der Add-in-Abschnitt (E-053), nur Beschreibungen: die stale „65536" ersetzt, der engere Deckel der Leistung begründet. **Keine Facette, kein Statuscode, keine Route geändert** |
| `.claude/team/reports/T-134-integration-dev.md` | dieser Bericht |

**Nicht angefasst:** `packages/domain/**`, `packages/storage/**`, `apps/local-api/**` außer
`src/routes/addin/` und dem Add-in-Abschnitt der OpenAPI, `apps/web/**`, `apps/desktop/**`,
`packages/export/**`, alle Testordner (`apps/*/test/**` gehört unit-tester — **ich habe keinen
Prüffall dort angelegt**; alles Neue steht in `proof-addin.mjs`), `docs/**` und jede gemeinsame
Datei.

---

## 7. Annahmen

1. **Die zweite `4000` bleibt stehen und bekommt einen eigenen Namen**, statt mit
   `ADDIN_NOTE_MAX_LENGTH` zusammengelegt zu werden. Begründung in 2.2: verschiedene Felder,
   verschiedene Herkunft des Textes, verschiedene Ziele, verschiedene Anforderungs-IDs. Der
   Auftrag sieht diesen Ausgang ausdrücklich vor.
2. **Der engere Deckel der Leistung wird nicht auf `textSchema` gezogen.** Das wäre eine Änderung
   an einer Zusage der Schnittstelle und damit eine Entscheidung; sie steht als offene Frage 3.
   Gemessen ist stattdessen die Richtung, in der eine Abweichung Schaden macht.
3. **Der Herkunftswächter scannt nur `apps/outlook-addin/src`, nicht `http/input.ts`.** Die Tür
   gehört domain-dev, und ein Wächter, der eine fremde Datei auf „keine nackte 500" absucht, wird
   bei jeder unbeteiligten Änderung dort spröde. Für die Tür bleibt die **Bindung** gemessen (sie
   nimmt genau den Deckel der Domäne an) — das ist die Aussage, die dem Add-in nützt.
4. **Die Behebung in `prepareNote` habe ich gemacht und nicht nur gemeldet.** Sie liegt in meiner
   Hoheit, ist durch A-10.5 und B-12.3 Punkt 3 gedeckt, und ein bekanntes 422 auf einen Text, den
   der Benutzer nicht geschrieben hat, ist kein Fund für die nächste Welle.
5. **`ADDIN_TAG_NAMES_MAX` (50) ist mitgemessen**, obwohl der Auftrag nur `tagIds` nennt: Es ist
   dieselbe Bauart in derselben Zeile, und der Kommentar daneben sprach die Verabredung sogar aus.
   Umgezogen ist auch sie nicht.
6. **Zwei Zahlen in Prosa bleiben stehen**: „512" in der Geschichte des Titeldeckels und „4011" in
   der Beschreibung des behobenen Fehlers. Beide sind Bericht über einen vergangenen Zustand und
   keine lebende Regel, die veralten könnte.

---

## 8. Risiken

**R1 — Der Herkunftswächter sucht nach einer Zahl und kennt ihre Bedeutung nicht.** Träge der
Aufgabenbereich eines Tages aus einem unbeteiligten Grund eine 500 (ein HTTP-Status in
`api/client.ts` ist der wahrscheinlichste Fall), wird der Lauf rot, ohne dass etwas falsch wäre.
Das ist bewusst so und in der Meldung ausgeschrieben: „kommt sie aus der Domäne, gehört der Name
hin; bedeutet sie etwas anderes, gehört ihr ein eigener Name". Beide Auflösungen sind die
gewünschte. Heute trägt der Aufgabenbereich nach dem Entfernen der Kommentare **keine** 500.

**R2 — Zwei Zahlen sind weiterhin doppelt, und sie sind jetzt gut versteckt.** Der Vermerk (4000)
und die Tag-Grenzen (200/50) stehen an je zwei Türen. Sie sind benannt und gemessen, aber ein
Zahlenvergleich wird erst rot, wenn die Doppelung schon falsch ist — genau der Zustand, den O-AS
für den Titel beendet hat. Die offenen Fragen 1 und 2 sind deshalb keine Kosmetik.

**R3 — Sicherheit, behoben und benennenswert:** Die Ursache des 422 aus Abschnitt 3 war kein
Sicherheitsfehler, aber ihr Muster ist eins aus der Familie „die Anwendung erzeugt selbst eine
Eingabe, die sie ablehnt". Sie war seit T-119 grün geprüft. Neue Angriffsfläche entsteht in dieser
Aufgabe keine: kein neues Feld, kein weiterer Deckel, keine Lockerung — der einzige geänderte
Grenzwert ist ein **engerer** Schnitt im Add-in.

**R4 — Der Add-in-Abschnitt der OpenAPI wurde geändert, während domain-dev in derselben Welle den
Hauptabschnitt liest** (O-M, `proof-callers.mjs`). Meine Hunks liegen ausschließlich unter
`/addin` und ausschließlich in `description`-Blöcken; `proof:openapi` steht unverändert bei 110.
Eine Kollision ist unwahrscheinlich, aber die Datei ist groß und wird von zwei Seiten gelesen.

**R5 — `pnpm test` steht bei 1010 statt 1001, und keine dieser neun Prüfungen ist meine.** Die
neue Testdatei stammt aus der parallelen Welle. Wer die Marke fortschreibt, sollte das wissen.

---

## 9. Offene Fragen

1. **`MAX_TAKEOVER_CHARACTERS` (4000) nach `packages/domain/src/text-length.ts`**, sodass das
   Add-in und `ADDIN_NOTE_MAX_LENGTH` beide lesen. Es ist dieselbe Wahrheit, und
   `text-length.ts` führt sie selbst schon als offene Frage. **domain-dev**; danach stellt
   integration-dev beide Seiten um und ersetzt den Vergleich in Abschnitt 16 durch dieselbe
   dreiteilige Herkunftsfrage wie beim Titel.
2. **`tagIds` (200) und `tagNames` (50) an die zweite Tür nachziehen** — `routes/todos.ts`,
   `createSchema` und `updateSchema`. Ohne einen gemeinsamen Ort bleibt es beim Zahlenvergleich.
   Vorschlag: dieselbe Datei wie oben, damit es ein Umzug ist und nicht drei.
3. **Soll die Add-in-Tür für die Leistung enger bleiben als die Hauptanwendung?** Heute 4000 gegen
   `textSchema`, dieselbe Spalte, zwei Wege. Beides ist vertretbar; die Entscheidung gehört in
   `decisions.md` und nicht in meinen Quelltext. Bleibt sie eng, ist der Grund an der Konstante
   schon aufgeschrieben; wird sie gleichgezogen, bleibt die neue Prüfung grün.
4. **`maxLength={65536}` an den Notizfeldern der Hauptanwendung** (`TodoDetailScreen.tsx:559`,
   `TodoFormDialog.tsx:227`) gegen `textSchema` an der Tür. Der Benutzer darf mehr tippen, als der
   Dienst annimmt. **frontend-dev**, nach T-133.
5. **Vergleichsmarken:** `proof:addin` **169** (vorher 165), `proof:openapi` 110, `proof:addin-wiring`
   32, `proof:codepoints` 45, `test` 1010 (davon 0 meine).

---

## 10. Nächster Schritt

1. **Code-Reviewer:** `mail.ts`, `schema.ts` und Abschnitt 16 zusammen lesen, mit T-123 und T-131
   daneben — die drei Aufgaben sind eine Bewegung in drei Formen (Objektgleichheit, Ableitung zur
   Laufzeit, Herkunft am Quelltext), und die dritte war nötig, weil eine Zahl keine Kennung hat.
2. **Spec-/UX-Reviewer:** der Fund aus Abschnitt 3 — der Vermerk aus „Inhalt der E-Mail übernehmen"
   ergab ein 422. Bitte gegen A-10.5 und B-12.3 Punkt 3 prüfen, ob die Kürzung jetzt das tut, was
   die Anforderung meint.
3. **security-checker:** B-12.3 Punkt 3 ist damit erstmals gemessen erfüllt („Länge begrenzen und
   beim Übernehmen kürzen" — bis heute wurde gekürzt und die Grenze trotzdem überschritten).
   `docs/bedrohungsmodell.md` Zeile 2124 führt B-12.3 als „umgesetzt"; das war es, bis auf elf
   Zeichen.
4. **Orchestrator:** offene Fragen 1 bis 3 als eine kleine Aufgabe für domain-dev bündeln — ein
   Umzug, zwei Türen, danach eine Folgeaufgabe im Add-in. Frage 4 an frontend-dev nach T-133.
