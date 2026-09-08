# T-169 — Die Add-in-Nachlese: V-08, V-09, V-11, X-02, X-03 und E-080

**Rolle:** integration-dev **Datum:** 2026-09-05 **Welle:** Y
**Gegenstand:** die fünf offenen Befunde der Add-in-Fläche aus T-154 (V-08, V-09, V-11) und
T-165 (X-02, X-03), dazu E-080 („Takt siezt") mit seinem E-078-Anteil.
**Verbindlich:** `.claude/team/decisions.md` E-074, E-078, E-080; `docs/spec.md` A-19.1, A-19.2,
A-19.19, A-19.21, Abschnitt 15; `.claude/team/reports/T-154-spec-ux-reviewer.md`,
`T-165-spec-ux-reviewer.md`.

---

## Aufgabe

T-169 — Add-in-Nachlese (O-DW), in einer Aufgabe statt in fünf.

## Status

**fertig** — mit drei roten Ausgaben, von denen **keine** aus dieser Aufgabe stammt. Alle drei
liegen in `packages/domain`, das in derselben Welle von domain-dev bearbeitet wird, bzw. am
belegten Port 17843 des parallel laufenden e2e-testers. Wortlaut in Abschnitt „Nachweis".

## Artefakte

Geändert:

- `apps/outlook-addin/src/ui/TaskPane.tsx` — V-08, V-11, X-02, drei Anredestellen, ein Satz
- `apps/outlook-addin/src/ui/SettingsView.tsx` — Anrede am Tokenfeld
- `apps/outlook-addin/src/ui/TagPicker.tsx` — Anrede im leeren Tagbestand
- `apps/outlook-addin/src/ui/DuplicateOffer.tsx` — die zitierte Bedingung im Kommentar
- `apps/outlook-addin/src/ui/field.ts` — X-03, zwei Zahlen
- `apps/outlook-addin/src/callnumber/labels.ts` — der eine Satz, ohne Anrede
- `apps/outlook-addin/src/styles/addin.css` — `.field__heading`
- `apps/outlook-addin/scripts/proof-addin.mjs` — Abschnitt 18e und 19e bis 19h, ein
  geschärfter Bestandswächter

Neu:

- `apps/outlook-addin/src/ui/create-gate.ts` — Sperre und Grund des Hauptknopfes als **eine**
  Rechnung
- `.claude/team/reports/T-169-integration-dev.md` — dieser Bericht

**Nicht angefasst:** `apps/local-api/src/routes/addin/**` und `packages/export/**`. Keiner der
sechs Punkte liegt dort; beide Bäume wurden auf die Anrede geprüft und sind sauber. Damit ist
auch keine Route berührt (`proof:openapi` trotzdem gelaufen, siehe unten).

## Zusammenfassung

Die fünf Befunde und E-080 betreffen dieselben vier Dateien und sind in einem Griff erledigt.
Der Hauptknopf „Todo anlegen" nennt jetzt den ersten offenen von vier Sperrgründen, und zwar aus
**einer** Rechnung: `createTodoGate` liefert `blocked` und `reason` zusammen, sodass ein
gesperrter Knopf ohne Grund — der Befund V-11 — nicht mehr baubar ist. Die Tagauswahl trägt in
„lädt" und „nicht verbunden" kein `Field` mehr, sondern eine Überschrift; die Beschriftung, die
dort niemanden beschriftete (X-02), ist weg, ohne dass die aria-Verdrahtung aus T-158 berührt
wurde — der Wächter zählt weiterhin zwölf Felder, die ihre Attribute durchreichen. Wer eine
Frist eingetragen hat und auf ein vorhandenes Todo wechselt, liest jetzt, dass sie nur für ein
neues Todo gilt (V-08); übertragen wird nichts, und dass nichts übertragen wird, ist gemessen.
Die Anrede folgt E-080: sechs Stellen ziehen nach, der Fristsatz aus T-158 nur in der Anrede, und
der doppelte Satz „Keine Call-Nummer im Text gefunden" steht ab jetzt an **einer** Stelle und
ohne Anrede.

---

## 1. Was je Befund gebaut wurde

### V-08 — die eingetragene Frist verfällt nicht mehr stillschweigend

In der Buchungsfläche, unmittelbar unter Titel und Call-Nummer des gewählten Todos:

> Die eingetragene Frist gilt nur für ein neues Todo. Dieses Todo behält seine eigene.

Wörtlich der Vorschlag aus T-154. Er erscheint **nur**, wenn im Fristfeld etwas steht
(`dueEntry.kind !== 'none'`, also auch bei einer unbrauchbaren Eingabe — auch die ist
eingetragen worden). Kein neues Feld, kein Übertragen, keine Rückfrage. Der Wert bleibt im
Zustand stehen: Nach „Abbrechen" steht die Frist wieder im Feld.

Gemessen in **19e**, drei Prüfungen, und die dritte ist die eigentliche: Der Buchungsrumpf
(`api.book({…})`) enthält **kein** `due` — die naheliegende „Verbesserung", die Frist auf das
fremde Todo zu schreiben, wäre eine Änderung an einem Todo, das der Benutzer nicht bearbeitet.

### V-09 — A-19.2 ist für den Aufgabenbereich jetzt gemessen

Neuer Abschnitt **18e**: „Fälligkeitsdatum", „fällig am" und „Deadline" kommen in keinem
sichtbaren Text des Add-ins vor, dazu die Gegenprobe, dass derselbe Sucher „Frist" **findet**
und dass `label="Frist"` im Aufgabenbereich steht. Ohne die zweite Hälfte wäre die Prüfung am
grünsten, wenn es das Feld gar nicht gäbe.

**Eine begründete Abweichung vom Vorschlag, und sie gehört gesehen.** T-154 schlug die Messung
über die **gebaute Datei** vor (`apps/outlook-addin/dist`). Gemessen wird stattdessen der
**Quelltext ohne Kommentare** plus `manifest.xml`. Drei Gründe, alle im Quelltext ausgeschrieben:

1. `pnpm check` ruft `proof:all` **vor** `build`; `dist` muss also nicht existieren. Ein
   Abschnitt, der dann still überspringt, ist ein grüner Lauf, der nichts gesehen hat — dieselbe
   Klasse wie O-BU und O-CI.
2. Ein vorhandenes `dist` kann von gestern sein. Dann misst der Abschnitt gestern.
3. `dist/assets/index-*.js.map` führt **jeden Kommentar wörtlich mit**. Eine Suche über das
   Bündel findet damit ausgerechnet den Gegenbeispiel-Kommentar in `TaskPane.tsx` — nachgesehen,
   nicht vermutet: `grep -o` auf `dist` liefert heute zehn Treffer „Deadline", alle aus der
   Quellzuordnung.

Der Quelltext ohne Kommentare ist genau die Menge, die das Bauen übrig lässt. Das Manifest liegt
daneben, weil sein `DisplayName` in Outlook auf dem Bildschirm steht, ohne je durch ein Bündel zu
laufen. **Wenn spec-ux-reviewer auf der gebauten Datei besteht, ist das eine eigene Aufgabe:**
Sie hieße, `proof:addin` einen Vite-Lauf voranzustellen, und das ist eine Entscheidung über die
Laufzeit des Tors und nicht über diesen Befund.

### V-11 — der gesperrte Knopf nennt seinen Grund

Neu: `apps/outlook-addin/src/ui/create-gate.ts`, ohne JSX, aus demselben Grund wie `field.ts` —
der Nachweispfad kann die Rechnung über alle Fälle laufen lassen, ohne den Aufgabenbereich zu
zeichnen.

```
Call-Nummer stimmt nicht →  „Die Call-Nummer stimmt noch nicht."
Titel leer              →  „Der Titel fehlt."
Frist unbrauchbar       →  „Die Frist stimmt noch nicht."
lädt noch               →  „Die Tags werden noch geladen."
keine Verbindung        →  „Keine Verbindung zu Takt."
```

Vier Eigenschaften, jede einzeln gemessen (**19f**, sechs Prüfungen):

1. **`blocked` ist genau dann wahr, wenn `reason` dasteht** — über alle 24 Möglichkeiten
   durchgerechnet. Das ist der Kern: Zwei Ausdrücke nebeneinander wären die Bauart, aus der der
   Befund entstanden ist, nur mit mehr Zeilen. Der alte vierteilige `disabled`-Ausdruck ist weg,
   und der Wächter verbietet seine Rückkehr namentlich.
2. **Genannt wird der erste Grund in der Lesereihenfolge der Fläche** — Call-Nummer, Titel,
   Frist, danach die Verbindung. Einer und nicht alle vier: Vier Sätze unter einem Knopf sind
   eine Liste, die niemand liest, und der Benutzer räumt sie ohnehin nacheinander weg.
3. **Die Verbindung steht zuletzt**, obwohl ohne sie nichts entsteht. Sie ist der einzige Grund
   mit eigener sichtbarer Fläche (Ladebild bzw. Meldung an der Stelle der Tagauswahl); als
   letzter erscheint der Satz genau dann, wenn er der einzige ist.
4. **Der Satz steht über dem Knopf, nicht an ihm.** Ein `disabled`-Knopf ist weder anklickbar
   noch mit der Tastatur ansteuerbar; ein `aria-describedby` an ihm erreichte niemanden. Was ihn
   hält, muss auf dem Weg dorthin in der Lesereihenfolge stehen.

Die **Sperre selbst bleibt unangetastet** — T-154 Abschnitt 3.3 hat sie als die richtige Härte
bestätigt, und die Tür des Dienstes misst dieselben Werte weiterhin gegen dieselbe Regel aus
`@takt/domain`. Hinzugekommen ist allein die Auskunft. Damit ist zugleich die Bedingung erfüllt,
unter der T-165 den dritten Halbsatz des Fristhinweises („leer lassen heißt: keine Frist") an
V-11 gebunden hat — er steht weiterhin, aber er trägt die Last nicht mehr allein.

### X-02 — ein Feld ohne Feld ist kein Feld

Nur der Zustand `ready` trägt ein `Field` mit `label`/`htmlFor="tags"`. „lädt" und „nicht
verbunden" tragen `<p class="field__heading">Tags</p>` und darunter Ladebild bzw. Meldung.
Gleiche Gestalt (`.field__heading` teilt die Regel mit `.field__label`), andere Bedeutung.

**Eine Überschrift und kein `<h3>`:** Die Fläche wechselt in denselben Kasten zurück, sobald der
Baum da ist. Eine Gliederungsebene, die es in zwei von drei Zuständen gibt, wäre die nächste
Ungleichheit derselben Art.

Gemessen in **19g**: Der Tag-Feldblock enthält den Auswähler und weder `Skeleton` noch
`pane-loading` noch `<Callout`; als Gegenprobe stehen Überschrift, Ladezeile, Meldung und die
CSS-Regel weiterhin da. Der Wächter aus 19c zählt unverändert **zwölf** Felder, die ihre
Attribute durchreichen — die Verdrahtung aus T-158 ist nicht berührt.

Nebenwirkung, bewusst: Der Hinweis des Tag-Feldes („Die Standard-Tags … kommen beim Anlegen
automatisch dazu") steht nur noch im Zustand `ready`. In den beiden anderen gibt es nichts zu
wählen, und E-078 Punkt 6 nennt genau diese Zustandsbindung als den erlaubten Weg zur Kürze.

### X-03 — eine Zahl, zweimal

`field.ts` verwies an **zwei** Stellen auf „`proof:addin`, Abschnitt 20"; die Prüfungen stehen in
Abschnitt 19. T-165 hat eine der beiden gefunden. Beide stehen jetzt auf 19.

### E-080 — Takt siezt, und ein Satz steht an einer Stelle

| Stelle | vorher | jetzt |
|---|---|---|
| `callnumber/labels.ts` (`REJECTION_LABEL.empty`) | „… — du kannst sie eintragen." | „… — sie lässt sich eintragen." (**ohne Anrede**) |
| `TaskPane.tsx` `describeDetection`, `no_match` | derselbe Satz, zweite Fassung | `NO_CALL_NUMBER_FOUND` — **dieselbe Zeichenkette** |
| `TaskPane.tsx:288` (Token fehlt) | „Das Token findest du …" | „Das Token finden Sie …" |
| `TaskPane.tsx` Fristhinweis | „… du trägst sie selbst ein." | „… Sie tragen sie selbst ein." |
| `TaskPane.tsx` `Failure` | „Du kannst es erneut versuchen." | „Ein neuer Versuch ist möglich." (**ohne Anrede**) |
| `SettingsView.tsx:207` | „Das Token erzeugst du …" | „Das Token erzeugen Sie …" |
| `TagPicker.tsx:235` | „… kannst du oben eingeben." | „… lässt sich oben eingeben." (**ohne Anrede**) |
| `DuplicateOffer.tsx:78` (Kommentar) | „sofern du …" | „sofern Sie …" |

**Der Fristsatz ist nur in der Anrede geändert.** V-04 ist von T-165 freigegeben, unverändert;
die kürzere Fassung ist dort ausdrücklich **nicht** freigegeben und steht hier nicht zur Debatte.
`proof:addin` 19d misst ohnehin die **Stellung** der Aussagen und nicht ihren Wortlaut — die
Prüfung ist für diese Änderung nicht angefasst worden, und das ist der Beleg, dass an der
Freigabe nichts still zurückgenommen wurde.

**Vier Stellen kommen ohne Anrede aus** (E-080 Punkt 4). Zwei nicht: „Das Token erzeugen Sie in
Takt unter Einstellungen" und „Das Token finden Sie in Takt unter Einstellungen" nennen eine
Handlung des Benutzers an einem anderen Ort. Ohne Anrede („Das Token steht in Takt unter …")
verlöre der Satz, dass es dort **erzeugt** werden muss und genau einmal sichtbar ist.

Gemessen in **19h**: Kein „du/dir/dich/dein" mehr in sichtbarem Text (mit Gegenprobe, dass der
Wächter eine Anrede überhaupt erkennt und `dueDate` nicht für eine hält), der Satz
„Keine Call-Nummer im Text gefunden" steht in **genau einer** Datei, `REJECTION_LABEL.empty` ist
mit ihm identisch, und der Aufgabenbereich schreibt ihn nicht wieder selbst hin.

Zusätzlich geschärft: Der Bestandswächter über `REOPEN_HINT` verbot bedingte Formulierungen
über `/sofern|wenn du|…/`. Seit E-080 finge „wenn du" die Formulierung nicht mehr; er prüft
jetzt `wenn (?:du|Sie)`.

---

## 2. Nachweis

| Lauf | Ergebnis |
|---|---|
| `pnpm run proof:addin` | **221 bestanden, 0 fehlgeschlagen** (vorher 206; 15 neue Prüfungen) |
| `pnpm run proof:taskpane` | 25 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:codepoints` | 45 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:openapi` | 110 bestanden, 0 fehlgeschlagen (keine Route berührt, trotzdem gelaufen) |
| `pnpm run contrast` | 0 von 474 Paaren durchgefallen |
| `npx tsc -p apps/outlook-addin/tsconfig.json --noEmit` | keine Meldung aus `apps/outlook-addin/**` |
| `npx tsc -p apps/outlook-addin/tsconfig.test.json --noEmit` | dito |
| `pnpm run typecheck` | **rot**, ausschließlich `packages/domain` — Wortlaut unten |
| `pnpm test` | **rot**, 2 von 1371, beide `packages/domain/test/attachment.test.ts` |
| `pnpm run proof:addin-wiring` | **rot**, Port belegt — Wortlaut unten |
| `pnpm test:e2e` | **nicht gefahren**, wie beauftragt (e2e-tester läuft parallel) |

### Die drei roten Ausgaben, wörtlich

**1. `pnpm run typecheck`** — acht Meldungen, alle in einer fremden Datei:

```
packages/domain typecheck: src/attachment.ts(818,26): error TS2339: Property 'pathname' does not exist on type 'ParsedUrl'.
packages/domain typecheck: src/attachment.ts(818,50): error TS2339: Property 'search' does not exist on type 'ParsedUrl'.
packages/domain typecheck: src/attachment.ts(818,71): error TS2339: Property 'hash' does not exist on type 'ParsedUrl'.
packages/domain typecheck: src/attachment.ts(819,33): error TS2339: Property 'host' does not exist on type 'ParsedUrl'.
packages/domain typecheck: src/attachment.ts(819,47): error TS2339: Property 'host' does not exist on type 'ParsedUrl'.
packages/domain typecheck: src/attachment.ts(819,58): error TS2339: Property 'pathname' does not exist on type 'ParsedUrl'.
packages/domain typecheck: src/attachment.ts(819,73): error TS2339: Property 'search' does not exist on type 'ParsedUrl'.
packages/domain typecheck: src/attachment.ts(819,86): error TS2339: Property 'hash' does not exist on type 'ParsedUrl'.
```

Das ist **X-04 im Bau**: `attachmentLabel`, Fall `link`, Wirt **plus** Pfad. Die Datei wurde um
18:50 geschrieben, mein Lauf lief um 18:55. Die Zeilen 818/819 sind genau der Ausdruck, den T-165
verlangt. Fremde Hoheit (`packages/domain` gehört domain-dev), nicht angefasst. Der Wurzellauf
`tsc -p tsconfig.json --noEmit` und beide Add-in-Konfigurationen sind sauber.

**2. `pnpm test`** — zwei Fälle, dieselbe Ursache:

```
FAIL  packages/domain/test/attachment.test.ts > attachmentLabel — nie eine leere Zeile (A-19.12) > Verweis ohne Titel: der Wirtsname aus der Normalform
FAIL  packages/domain/test/attachment.test.ts > attachmentLabel — nie eine leere Zeile (A-19.12) > Datei ohne Titel: der Dateiname, nie der volle Pfad
Expected: "bericht.pdf"
Received: "bericht.pdf (/home/nutzer/)"
Test Files  1 failed | 70 passed (71)
     Tests  2 failed | 1369 passed (1371)
```

Dieselbe halbfertige X-04-Änderung; T-165 hat die mitziehenden Prüffälle ausdrücklich an
unit-tester gegeben. **Hinweis an den Orchestrator, weil er in T-165 nicht steht:** Der zweite
Fall betrifft den **Datei**-Zweig, nicht den Verweis-Zweig. X-04 verlangt eine Änderung am
`link`-Fall; hier ändert sich die Antwort für eine **Datei** (`bericht.pdf` →
`bericht.pdf (/home/nutzer/)`). Das kann Absicht sein, steht aber in keinem Befund, den ich
gelesen habe.

**3. `pnpm run proof:addin-wiring`** — zweimal gelaufen, zweimal dasselbe:

```
FEHLER: Auf 127.0.0.1:17843 lauscht bereits etwas, auch nach 5 s Warten. Läuft Takt oder ein anderer Prüfpfad (proof:access, proof:addin-wiring) noch?
```

Nachgesehen: `ss -ltnp` zeigt `127.0.0.1:17843 users:(("node",pid=3089894))` — der parallel
laufende e2e-tester. Der Lauf misst die **Add-in-Routen des Dienstes**, und an denen habe ich
nichts geändert (`apps/local-api/src/routes/addin/**` unberührt). Er gehört nach dem Ende der
Welle einmal grün gefahren.

### Die neuen Prüfungen können rot werden

Vier Mutationsproben, jede einzeln eingesetzt und wieder zurückgenommen:

| Mutation | Ergebnis |
|---|---|
| `label="Frist"` → `label="Deadline"` | 18e rot (beide Hälften), dazu drei Bestandsprüfungen |
| `dueEntry.kind !== 'none' ?` → `true ?` | „V-08: der Satz hängt an der Eingabe" rot |
| `disabled={gate.blocked}` → alter vierteiliger Ausdruck | „V-11: der Aufgabenbereich benutzt die Rechnung" rot |
| ein „deine" in einen Grund von `create-gate.ts` | „E-080: der Aufgabenbereich duzt niemanden mehr" **und** „V-11: die Sätze sind kurz und ohne Anrede" rot |

---

## 3. Annahmen

1. **`TagPicker.tsx:235` ist mitgezogen, obwohl E-080 Punkt 2 es nicht aufzählt.** X-01 aus T-165
   führt es als eine der fünf Du-Stellen; E-080 nennt stattdessen `DuplicateOffer.tsx:78` und
   `TaskPane.tsx:864` und kommt so auf „sechs". Punkt 1 sagt „überall", und eine Fläche, die als
   einzige duzt, wäre der Zustand von vorher in klein. Es ist die einzige Stelle, die ich ohne
   ausdrückliche Nennung geändert habe.
2. **`DuplicateOffer.tsx:78` ist ein Kommentar**, kein Oberflächentext — er zitiert die
   Formulierung, die dort gerade **nicht** steht. Mitgezogen, weil die zitierte Fassung sonst in
   der alten Anrede stünde und beim nächsten Lesen als Vorlage dient.
3. **Zwei Tokensätze siezen, statt ohne Anrede auszukommen.** Begründung oben; wer „Das Token
   steht in Takt unter Einstellungen" vorzieht, bekommt einen kürzeren Satz und verliert die
   Aussage, dass es dort erzeugt wird und genau einmal sichtbar ist.
4. **Die Reihenfolge der Sperrgründe ist die Lesereihenfolge der Fläche**, nicht ein Rang nach
   Schwere. Sie ist im Quelltext begründet und in 19f gemessen; wer sie anders will, ändert eine
   Zeile und eine Prüfung.
5. **Der Satz zu V-11 steht über dem Knopf und ist keine Meldefläche** (`role="status"`). Eine
   Ansage bei jedem Zustandswechsel wäre beim Tippen des Titels gesprächig; der Satz steht
   sichtbar in der Lesereihenfolge unmittelbar vor dem Knopf.
6. **18e misst den Quelltext ohne Kommentare statt `dist`** — mit den drei Gründen aus
   Abschnitt 1. Das ist die einzige bewusste Abweichung von einem Vorschlag des Prüfers.
7. **Keine echten Call-Nummern, keine Kundennamen, keine Zugangsdaten** angelegt oder verändert.
   Der einzige neue Beispielwert ist der Titel „Rechnung prüfen" in `proof-addin.mjs` — erfunden.

## 4. Risiken

1. **Der Anredewächter (19h) ist scharf und trifft auch Bezeichner.** Ein künftiges `const dir =`
   in `apps/outlook-addin/src/**` macht ihn rot. Das ist gewollt und im Quelltext ausgeschrieben:
   Der Bezeichner gehört umbenannt, nicht die Prüfung gelockert. Es ist aber eine Fußangel für
   den nächsten Agenten, und sie steht hier, damit er sie kennt.
2. **Der Hinweis des Tag-Feldes ist in zwei Zuständen weg** (Nebenwirkung von X-02). Fachlich
   folgenlos — es gibt dort nichts zu wählen —, aber es ist eine Textstelle weniger auf dem
   Bildschirm, und E-078 Punkt 3 verlangt für Prüfersätze eine Zustimmung. Dieser Satz geht auf
   keine Befundnummer zurück (er stammt aus T-019/A-9.3) und ist nicht gestrichen, sondern
   zustandsgebunden.
3. **`create-gate.ts` ist eine dritte Datei mit Oberflächentext im Add-in** (neben
   `callnumber/labels.ts` und `duplicate/reopen.ts`). Das ist die hier übliche Bauart — Text ohne
   JSX, damit der Nachweispfad ihn messen kann —, aber wer im Textdurchgang aus E-078 nur `.tsx`
   liest, findet fünf Sätze nicht.
4. **Sicherheit: keine neue Fläche, keine neue Grenze.** Über das Add-in entstehen weiterhin
   **keine** Anhänge (A-19.19 unverändert, `proof:addin` 18d misst es an der Wirkung), die
   Call-Nummer-Erkennung bleibt konfigurierbar, kein neuer Netzweg, keine neue Eingabe. Der
   einzige neue Text kommt aus dem Add-in selbst; fremder Text geht weiterhin durch `<Foreign>`.
5. **Unsichtbare Zeichen:** `proof:codepoints` lief nach allen Änderungen grün (45/0) und deckt
   auch diesen Bericht ab.

## 5. Offene Fragen an den Orchestrator

1. **Trägt 18e in dieser Form?** Die Messung über den kommentarfreien Quelltext statt über `dist`
   ist eine Abweichung vom Wortlaut des Vorschlags (V-09) bei gleicher Aussage. Wenn
   spec-ux-reviewer die gebaute Datei verlangt, braucht das einen Vite-Lauf **innerhalb** von
   `proof:addin` — eine Entscheidung über die Laufzeit des Tors, keine über diesen Befund.
2. **`pnpm run proof:addin-wiring` konnte nicht laufen** (Port 17843 vom e2e-tester belegt). Er
   ist von dieser Aufgabe inhaltlich nicht berührt, gehört aber nach dem Ende der Welle einmal
   gefahren, bevor jemand die Welle grün nennt.
3. **Der zweite rote Prüffall in `packages/domain/test/attachment.test.ts` betrifft den
   Datei-Zweig** (`bericht.pdf` → `bericht.pdf (/home/nutzer/)`). X-04 verlangt eine Änderung am
   **Verweis**-Zweig. Falls das eine Mitnahme ist, gehört sie benannt — A-19.12 und T-165
   Abschnitt 2.1 begründen für die Datei ausdrücklich das **letzte** Stück des Wertes.
4. **X-01 nennt `apps/web/src/components/NoteField.tsx:59` als siebte Stelle** (frontend-dev).
   Sie liegt nicht in meiner Hoheit und ist von mir nicht angefasst; ohne sie ist E-080 zu sechs
   Siebteln umgesetzt.
5. **Der Fristhinweis darf jetzt kürzer werden — aber nicht von mir.** T-165 Abschnitt 1.4 bindet
   den dritten Halbsatz an den offenen Befund V-11. V-11 ist mit dieser Aufgabe geschlossen; ob
   der Halbsatz damit fällt, entscheidet derselbe Prüfer, nicht der Umsetzende (E-078 Punkt 3).

## 6. Nächster Schritt

1. **spec-ux-reviewer** über die sechs Punkte, mit zwei benannten Fragen: die Messart von 18e
   (offene Frage 1) und der Fristhinweis nach dem Wegfall von V-11 (offene Frage 5).
2. **unit-tester**: `create-gate.ts` hat seine Prüfungen in `proof:addin` 19f; Prüffälle in
   `apps/outlook-addin/test/**` sind dort nicht nötig, aber `text/`-Fälle liegen schon dort — wer
   sie ergänzt, sollte die Rechnung nicht zweimal messen.
3. **Nach dem Ende der Welle** einmal `pnpm run proof:addin-wiring` und `pnpm run typecheck`
   fahren, sobald `packages/domain` steht.
4. **documenter** zuletzt: Die Anrede im Handbuch ist von E-080 Punkt 1 mitgemeint und in dieser
   Aufgabe nicht angefasst.
