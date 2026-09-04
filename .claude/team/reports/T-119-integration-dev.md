# T-119 — Der rohe Betreff im Aufgabenbereich, Schnitt auf Codepunkte

Aufgabe: T-119 — Der rohe Betreff im Aufgabenbereich, Schnitt auf Codepunkte
Auftrag: die beiden Punkte aus „Risiken" und „Nächster Schritt" in
`.claude/team/reports/T-114-integration-dev.md`
Stand vor der Arbeit: Branch `status-als-regelterm`, Commit `121bf05`
Datum: 2026-09-04. Verantwortlich: integration-dev.

---

## 1. Der Befund, der nicht im Auftrag stand

Bevor ich etwas geändert habe, habe ich die Tür gefragt, welche Zeichen sie heute abweist —
alle 65 536 Zeichen der BMP, eines nach dem anderen, gegen `createTodoSchema`:

```
abgewiesene Zeichen in der BMP: 77
U+0-U+1f, U+7f-U+9f, U+61c, U+200e-U+200f, U+202a-U+202e, U+2066-U+2069
Vorschläge, die die Tür abweist: U+61c, U+200e, U+200f
```

**Die letzte Zeile ist eine offene Regression.** `T-117` hat die Zeichenklasse in
`http/input.ts` um die drei Richtungsmarken erweitert (ALM, LRM, RLM). `suggestTitle` im Add-in
bekam es nicht mit — seine Klasse stand als eigener Ausdruck in `office/mail.ts`. Damit war
genau die Sackgasse wieder offen, die T-114 geschlossen hatte: Eine E-Mail mit einem `U+200E` im
Betreff belegt das Titelfeld mit einem Vorschlag, den der Dienst mit 422 abweist — an einem Feld,
an dem nichts Falsches zu sehen ist.

**Und Abschnitt 16 des Nachweispfads hat es nicht bemerkt**, obwohl er genau dafür gebaut wurde.
Er prüft gegen eine **abgeschriebene Liste** von 20 Zeichen. Die Liste war bei der Erweiterung
nicht dabei, also blieb der Lauf grün. Das ist derselbe Fehler eine Ebene höher: T-114 hat die
Abschrift des Schemas beseitigt und dabei eine Abschrift der Zeichenmenge in den Nachweis
geschrieben.

Deshalb tut Abschnitt 17 es anders: **Er fragt die Tür, statt sie abzuschreiben.** Die Menge, gegen
die geprüft wird, entsteht bei jedem Lauf aus `createTodoSchema` selbst. Eine Erweiterung wie die
aus T-117 wird damit rot, ohne dass jemand daran denken muss.

---

## 2. Die Berichtigung meines eigenen Vorschlags aus T-114

T-114 hat als Gegenmittel „eine CSS-Zeile (`unicode-bidi: isolate`) oder `<bdi>`" genannt. **Das
ist nur die halbe Antwort, und die Hälfte, die nicht die eigentliche Frage beantwortet.**

Eine Isolierung trennt den Block von seiner **Umgebung**. Sie nimmt dem Inhalt die
Formatierungszeichen nicht weg: Der Bidi-Algorithmus verarbeitet den Inhalt des Elements
weiterhin, ein `U+202E` dreht die Anzeige **innerhalb** des isolierten Blocks weiter um. Auch
`bidi-override` hilft nicht — eine geschachtelte Überschreibung öffnet nach UBA X2–X5 eine neue
Ebene. Keine CSS-Eigenschaft entfernt Zeichen aus dem Text.

Der Betreff `Rechnung<RLO>gnp.exe` stünde also auch mit `unicode-bidi: isolate` weiterhin als
„Rechnung exe.png" im Aufgabenbereich. Es gehören zwei Dinge zusammen, und beide sind in diesem
Diff:

| Hälfte | Was sie leistet | Wo |
|---|---|---|
| `<bdi>` + `unicode-bidi: isolate` | Der fremde Text ordnet **die Umgebung** nicht um — den deutschen Satz, in dem er steht | `Foreign` in `Primitives.tsx`, `bdi`-Regel in `addin.css` |
| `visibleText` | Der fremde Text ordnet **sich selbst** nicht um; die unsichtbaren Zeichen werden zu einer sichtbaren Marke | `src/text/hidden.ts` |

**Die Marke statt des stillen Streichens** ist eine Entscheidung: Ein ersatzlos entferntes Zeichen
ergäbe eine Anzeige, die harmlos aussieht und es nicht ist. `U+FFFD` an der Stelle sagt: Hier
steht etwas, das sich nicht zeigen lässt. Es geht dabei kein Schriftbild verloren — die Zeichen
sind unsichtbar.

**Rechtsläufige Schrift bleibt unangetastet.** Arabisch und Hebräisch sind kein Angriff, sondern
Text; sie zu entfernen oder zu markieren wäre eine Anzeige, die einen Teil ihrer Benutzer nicht
mehr lesen kann. Dass sie den deutschen Satz daneben nicht umordnet, besorgt die Isolierung — das
ist der Fall, für den `<bdi>` gemacht ist. Im Nachweis steht das als eigene Prüfung.

---

## 3. Eine Zeichenklasse, drei Behandlungen

Die Klasse liegt jetzt einmal im Add-in (`src/text/hidden.ts`) und wird an drei Stellen
verschieden behandelt — nach einer Regel und nicht nach drei:

| Wo | Was geschieht | Warum |
|---|---|---|
| Tür des Dienstes | **abweisen**, mit deutschem Satz am Feld | Ein Wert, den der Benutzer eingegeben hat, wird nicht heimlich bereinigt |
| Titelvorschlag (`dropHidden`) | **fallen lassen** | Ein Vorschlag aus fremder Quelle ist keine Eingabe — und ein Vorschlag, den die Tür abweist, ist eine Sackgasse |
| Anzeige (`visibleText`) | **sichtbar machen** | Eine Anzeige darf nichts wegnehmen; sie darf nur kein Zeichen wirken lassen, das niemand sieht |

Dass die Fassung im Add-in der an der Tür gleicht, steht **nicht** als Zusicherung im Kommentar,
sondern wird bei jedem Lauf gemessen (Abschnitt 17).

---

## 4. Auftragspunkt 1 — jede Stelle, an der fremder Text in die Anzeige geht

Vollständig durchgesehen, mit Ergebnis auch dort, wo nichts geändert ist.

### Isoliert und bereinigt

| Stelle | Wert | Herkunft |
|---|---|---|
| `TaskPane.tsx` „Aus dieser E-Mail" | `mail.subject` | **unmittelbar aus der E-Mail** (der Befund aus dem Auftrag) |
| dieselbe Fläche | `mail.senderName`, `mail.senderAddress` | unmittelbar aus der E-Mail |
| `TaskPane.tsx`, „Gefunden, aber nicht übernommen" | `clip(detection.raw)` | Ausschnitt aus Betreff oder Text — er ist gerade deshalb da, weil er **keine** Call-Nummer ist |
| Bestätigungsfläche und Schaltfläche | `booking.title` | Bestand; kann ein Betreff von vor T-114 sein |
| `DuplicateOffer.tsx` | `offer.title` | dieselbe Herkunft, und hier fällt die Entscheidung, auf **welches** Todo gebucht wird |
| `TaskPane.tsx`, nach dem Anlegen | `done.title`, `done.createdTagNames[]` | Antwort des Dienstes |
| `Primitives.tsx` `Chip` | Tagname und Ordnerpfad | Bestand oder Suchfeld — ein Chip ist Anzeige, kein Eingabefeld |
| `TagPicker.tsx` | `tag.name`, `tag.folderLabel`, `offer.tag.name`, `offer.name` | Bestand und Suchfeld |
| `SettingsView.tsx` | `result.value`, `result.raw` | Ausschnitt aus dem Beispieltext — und dieses Feld füllt man, indem man eine echte E-Mail hineinkopiert |

Wo ein Element möglich ist, steht `<Foreign>` (`<bdi>` + Bereinigung). Wo nur eine Zeichenkette
möglich ist — `title`, `aria-label`, ein Satz, der als Zeichenkette entsteht —, steht `visibleText`
allein; dann fehlt die Isolierung, und das ist an Ort und Stelle ausgeschrieben.

### Gesehen und bewusst nicht isoliert

| Stelle | Warum nicht |
|---|---|
| **Das Titelfeld und das Vermerkfeld** (`input`, `textarea`) | Der Inhalt eines Eingabefeldes ist der Stand der Bearbeitung. Ihn zu verändern hieße, die Eingabe des Benutzers zu ändern, ohne es zu sagen — genau das, was `http/input.ts` an seinem eigenen Eingang ablehnt. Der Vermerk trägt den übernommenen E-Mail-Text (`prepareNote`) und damit den Betreff wörtlich; er geht in die Datenbank, nicht in den Export (A-7.2). **Das ist die größte offene Fläche dieser Aufgabe** und steht unten als Risiko. |
| `poolMovementSentence` — die Sätze über die Pools (`MovementNote`, `ReopenAnnouncement`, `bookingOutcome`) | Sie tragen **Poolnamen**, aber nicht als Wert, sondern eingebaut in einen Satz, den `@takt/domain` zusammensetzt (nicht meine Hoheit). Die Namen kommen aus der Hauptanwendung und passieren dort `nameSchema`; aus einer E-Mail kann kein Poolname entstehen. Einen fertigen Satz zu bereinigen wäre eine Behandlung des Ergebnisses statt der Ursache. |
| `detail.message` in der Fehlerliste | Der Dienst nennt bei einem mehrdeutigen Tagnamen den getippten Namen (`routes/addin/index.ts:122`). Die Zeichenklasse kann darin nicht mehr vorkommen — derselbe Rumpf ist vorher daran geprüft worden. Bleibt die Stellung rechtsläufiger Schrift im deutschen Satz: kosmetisch, und es ist die eigene Eingabe. |
| `detail.field` bei unbekanntem Schlüssel | Technischer Schlüssel aus unserem eigenen Dienst, kein fremder Text. |
| `booking.callNumber`, `offer.callNumber`, die Überschrift „Zu Call … gibt es bereits ein Todo." | `checkCallNumber` lässt nur `A-Z a-z 0-9 . _ / -` durch — ein geschlossener Vorrat schließt jedes Richtungszeichen mit ein. |
| `offer.summary`, `lookupNote`, `REJECTION_LABEL[…]` | Schreibt der Aufgabenbereich beziehungsweise der Dienst selbst; die Sätze geben den Eingabewert ausdrücklich **nicht** wieder (`REJECTION_TEXT`, `routes/addin/index.ts:143`). |
| `App.tsx` | Zeigt keinen fremden Wert an. |

---

## 5. Auftragspunkt 2 — der Schnitt trifft ganze Zeichen

`suggestTitle` schnitt mit `slice(0, 500)`. Gemessen, bevor ich etwas geändert habe:

```
Länge 500, letzte Einheit 0xd83d, wohlgeformt: false, Tür: true
Base64 hin und zurück gleich: false, letzte Einheit zurück: 0xfffd
```

**Das ist mehr als ein halbiertes Emoji.** Eine einzelne hohe Ersatzstelle ist kein wohlgeformter
Unicode-Text; für sie gibt es keine UTF-8-Folge. Der Wert kommt aus dem Export-Motor
(`fromBase64(toBase64(t))`) **verändert** zurück — der Hin- und Rückweg, den die Aufgabenstellung
des Motors ausdrücklich verlangt, ist an diesem Wert gebrochen. Dieselbe Ersetzung geschieht beim
Schreiben in SQLite. Und die Tür fängt es nicht ab: `z.string().max(500)` zählt UTF-16-Einheiten
und sieht eine halbe Ersatzstelle nicht an.

**Codepunkte, nicht Graphemcluster.** Der Auftrag stellt beides zur Wahl; ich habe Codepunkte
genommen:

- Der Unterschied ist der zwischen einem **Datenfehler** und einem **Schönheitsfehler**. Eine
  halbe Ersatzstelle wird auf dem Weg durch UTF-8 ersetzt. Ein zerschnittener Graphemcluster ist
  wohlgeformter Text: Er sieht an einer Stelle anders aus als gemeint, wird aber nicht verändert
  gespeichert und nicht anders exportiert.
- Graphemcluster kosten `Intl.Segmenter` — eine Umgebungsannahme mehr im Aufgabenbereich, und ein
  Rückfallweg für ihr Fehlen wären zwei Verhalten für eine Regel. Segmentierung ist außerdem
  Tabellenwissen und ändert sich mit der Unicode-Fassung; zwei Rechner könnten verschieden kürzen.
- **Was das offenlässt, steht im Quelltext und nicht nur hier:** Am Schnitt kann ein `U+200D` oder
  ein kombinierender Akzent ohne Grundbuchstaben zurückbleiben.

**Gezählt wird weiter in UTF-16-Einheiten**, und das ist kein Versehen: Die Tür zählt so. Ein
Vorschlag aus 500 **Codepunkten** Emoji wäre 1000 Einheiten lang und liefe in genau das 422, das
T-114 geschlossen hat. Geschnitten wird an einer Zeichengrenze; das kostet höchstens eine Einheit.

**Zwei weitere Stellen mit demselben Schnitt, ungefragt mitgenommen** (Annahme 3):
`prepareNote` (Deckel 4000 — gemessen: einzelne Ersatzstelle am Ende) und `clip` in `TaskPane.tsx`
(40 Zeichen für die Anzeige eines Rohwerts).

---

## 6. Der Nachweis (Auftragspunkt 3)

Abschnitt 16 bleibt, wie er ist — er misst die **Gleichheit der beiden Türen**, und das ist eine
andere Frage. Neu ist **Abschnitt 17** in `apps/outlook-addin/scripts/proof-addin.mjs`,
16 Prüfungen; `proof:addin` wächst von 148 auf **164**:

```
17  Fremder Text in der Anzeige und der Schnitt auf ganze Zeichen (T-119)
  ok  die Tür weist in der BMP 77 Zeichen ab — gefragt, nicht abgeschrieben
  ok  kein Titelvorschlag läuft in die Abweisung — für jedes Zeichen der Tür
  ok  Gegenprobe: die Fassung vor T-119 wäre an drei Zeichen gescheitert
  ok  die Anzeige trägt kein Zeichen mehr, das sie umordnen kann
  ok  der Trick, um den es geht: „Rechnung<RLO>gnp.exe" ist als solcher zu sehen
  ok  die Marke ist eine Marke: sichtbar, stabil, nicht selbst betroffen
  ok  harmloser Text bleibt harmloser Text — auch rechtsläufiger
  ok  Anzeige und Vorschlag behandeln dieselbe Klasse verschieden — und beide vollständig
  ok  kein fremder Wert steht mehr roh im JSX
  ok  jede Fläche, die fremden Text zeigt, benutzt den Baustein dafür
  ok  die Isolierung steht in der Gestaltung und nicht nur im Bericht
  ok  ein Betreff aus lauter Emoji wird an einer Zeichengrenze gekürzt
  ok  derselbe Titel kommt aus Base64 zurück, wie er hineinging (A-8.4)
  ok  Gegenprobe: der Schnitt vor T-119 hinterließ eine halbe Ersatzstelle
  ok  der Vermerk wird ebenso an einer Zeichengrenze gekürzt
  ok  cutToCharacterBoundary kostet höchstens eine Einheit und nur, wenn es muss
```

**Drei Gegenmessungen, damit „grün" etwas heißt:**

1. Die Klasse aus T-114 nachgebaut und gegen die gemessene Türklasse gefahren: **genau drei
   Abweichungen**, `U+061C`, `U+200E`, `U+200F` — die Zeichen aus T-117. Der Abschnitt wäre vor
   dieser Aufgabe rot gewesen, Abschnitt 16 war es nicht.
2. Der alte Schnitt (`slice(0, 500)`) auf denselben Betreff: hinterlässt eine halbe Ersatzstelle,
   ist nicht wohlgeformt, überlebt den Base64-Weg nicht — und die Tür hätte ihn angenommen.
3. Die beiden statischen Prüfungen gegen den Stand `121bf05` gefahren: **12 rohe Anzeigestellen**,
   darunter `TaskPane.tsx: ? mail.subject :` — die Fundstelle aus dem Auftrag. Dazu fehlten dort
   die `bdi`-Regel und der Baustein.

**Was der Nachweis nicht kann, und warum:** Ein Aufgabenbereich in `.tsx` lässt sich in Node nicht
rendern — die Typentfernung kennt kein JSX, und ein Renderer wäre eine Abhängigkeit des
Nachweises, nicht des Erzeugnisses. Die Verhaltensprüfungen laufen deshalb gegen
`src/text/hidden.ts` und `src/text/cut.ts`; für die Anzeige selbst stehen zwei **statische**
Prüfungen (kein roher Wert im JSX, `<bdi>` im Baustein, `unicode-bidi: isolate` in `addin.css`).
Die Liste der Werte darin ist die Aufzählung aus Abschnitt 4 in ausführbarer Form; sie hält die
Stellen zu, die es gab, und ist **kein** Vollständigkeitsbeweis für Stellen, die es noch nicht
gibt. Das steht auch im Quelltext.

---

## 7. Was geändert ist

| Datei | Was |
|---|---|
| `apps/outlook-addin/src/text/hidden.ts` | **neu.** Die Zeichenklasse einmal im Add-in, `dropHidden` (fallen lassen), `visibleText` (sichtbar machen), `hasHidden` |
| `apps/outlook-addin/src/text/cut.ts` | **neu.** `cutToCharacterBoundary` samt Begründung für Codepunkte statt Graphemcluster |
| `apps/outlook-addin/src/office/mail.ts` | `DROPPED_FROM_SUBJECT` entfällt zugunsten von `dropHidden` (schließt die T-117-Lücke); `suggestTitle` und `prepareNote` schneiden an einer Zeichengrenze |
| `apps/outlook-addin/src/ui/Primitives.tsx` | Baustein `Foreign` (`<bdi>` + Bereinigung); `Chip` bereinigt Name, Pfad und `aria-label`; `Callout.title` nimmt einen Knoten statt einer Zeichenkette |
| `apps/outlook-addin/src/ui/TaskPane.tsx` | Betreff, Absender, Rohwert der Erkennung, Titel in Fläche und Schaltfläche, Titel und neue Tagnamen nach dem Anlegen; `clip` schneidet an einer Zeichengrenze |
| `apps/outlook-addin/src/ui/DuplicateOffer.tsx` | Titel des Angebots |
| `apps/outlook-addin/src/ui/TagPicker.tsx` | Tagnamen, Ordnerpfade, angebotener neuer Name |
| `apps/outlook-addin/src/ui/SettingsView.tsx` | Treffer und Rohwert aus dem Beispieltext |
| `apps/outlook-addin/src/styles/addin.css` | `bdi { unicode-bidi: isolate }` mit der Begründung, was die Regel **nicht** kann |
| `apps/outlook-addin/scripts/proof-addin.mjs` | **Abschnitt 17**, 16 Prüfungen |
| `apps/local-api/openapi/takt-local-api.yaml` (**nur** Add-in-Abschnitt, E-053) | `POST /addin/todos`: Die Beschreibung der Zeichenregel an `title` und `tagNames` nannte die drei Marken aus T-117 nicht. Der Hauptabschnitt (`UnprocessableEntity`, `:3593`) nennt sie; der Add-in-Abschnitt war stehengeblieben |
| `.claude/team/reports/T-119-integration-dev.md` | dieser Bericht |

**Keine fremde Datei angefasst.** `packages/domain/**`, `packages/storage/**`, `apps/web/**`,
`apps/local-api/src/**`, `apps/*/test/**`, `tests/e2e/**` sind unberührt; am Hauptabschnitt der
OpenAPI (an dem domain-dev gerade arbeitet — sieben eigene Hunks) habe ich nichts geändert, meine
beiden Hunks liegen unter `/addin/todos`. Kein `git commit`, kein `stash`, kein `checkout`, kein
fremder Prozess beendet. Ports 17843/17844 nicht belegt.

**Ein rohes Richtungszeichen ist mir dabei in den Nachweispfad gerutscht** — beim Nachbauen der
alten Zeichenklasse. Der Semgrep-Haken hat es gemeldet, es steht jetzt als Escape-Folge da
(T-112-H2). Eigene Gegenmessung über alle zehn geänderten Quelldateien: **kein** rohes Steuer-,
Bidi- oder unsichtbares Zeichen.

---

## 8. Gemessen, nicht angenommen

Jeder Befehl einzeln, Ausgabe in eine Datei umgeleitet, Endstatus unmittelbar danach gelesen —
keine Pipe (zsh `pipestatus`). Alles nach der letzten Änderung noch einmal vollständig gefahren.

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm typecheck` | **0** | grün über alle Konfigurationen einschließlich `typecheck:test` und `typecheck:e2e` |
| `pnpm test` | **0** | 53 Dateien, **787** Tests, 0 fehlgeschlagen |
| `pnpm proof:addin` | **0** | **164** Prüfungen (vorher 148), 0 fehlgeschlagen |
| `pnpm proof:openapi` | **0** | 105 Prüfungen, 0 fehlgeschlagen |
| `pnpm proof:all` | **0** | **863** Prüfungen über 13 Pfade, 0 fehlgeschlagen |
| `pnpm boundaries` | **0** | „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm --filter @takt/outlook-addin build` | **0** | `tsc --noEmit` + `vite build`, 238,22 kB |

**Nicht gefahren: `pnpm test:e2e`** — steht nicht in der Nachweisliste, und `tests/e2e/**` gehört
dem e2e-tester. Stattdessen nachgesehen, **was dort an meinen Zeilen hängt**:
`apps/outlook-addin` hat keine Einheitentests (`apps/outlook-addin/test/` gibt es nicht), und in
`tests/e2e/outlook-addin-build.spec.ts` sind alle fünf Fundstellen über **Klassen und Texte**
gesucht, nicht über Elementnamen (`.shell__brand`, `.shell__body`, `.callout--success`, `.mono`,
zwei `getByRole('button')`). Die eine Stelle, die ich berühre, ist `.mono` in `SettingsView.tsx`:
Aus `<span class="mono">` wird `<bdi class="mono">`, die Klasse und der Text („TCK-000042",
unverändert durch `visibleText`) bleiben — der Locator trägt weiter. Der **Kommentar** in dieser
Zeile (`:113`, „steht daneben als `<span class="mono">`") nennt jetzt das falsche Element; die
Datei gehört dem e2e-tester, deshalb nur der Hinweis und keine Änderung.

---

## 9. Kurzfassung

```
Aufgabe: T-119 — Der rohe Betreff im Aufgabenbereich, Schnitt auf Codepunkte
Status: fertig

Artefakte:
  apps/outlook-addin/src/text/hidden.ts           (neu: eine Zeichenklasse, drei Behandlungen)
  apps/outlook-addin/src/text/cut.ts              (neu: Schnitt an der Zeichengrenze)
  apps/outlook-addin/src/office/mail.ts           (dropHidden statt eigener Klasse; beide Schnitte)
  apps/outlook-addin/src/ui/Primitives.tsx        (Baustein `Foreign`, Chip, Callout.title)
  apps/outlook-addin/src/ui/TaskPane.tsx          (Betreff, Absender, Rohwert, Titel, Tagnamen)
  apps/outlook-addin/src/ui/DuplicateOffer.tsx    (Titel des Angebots)
  apps/outlook-addin/src/ui/TagPicker.tsx         (Tagnamen, Ordnerpfade)
  apps/outlook-addin/src/ui/SettingsView.tsx      (Treffer aus dem Beispieltext)
  apps/outlook-addin/src/styles/addin.css         (bdi { unicode-bidi: isolate })
  apps/outlook-addin/scripts/proof-addin.mjs      (Abschnitt 17, 16 Prüfungen)
  apps/local-api/openapi/takt-local-api.yaml      (nur Add-in-Abschnitt, E-053)
  .claude/team/reports/T-119-integration-dev.md

Zusammenfassung: Fremder Text geht im Aufgabenbereich nicht mehr roh in die Anzeige — er läuft
über den Baustein `Foreign`, der ihn in ein `<bdi>` setzt und ihm die unsichtbaren Zeichen
nimmt. Beides ist nötig: Die Isolierung aus meinem Vorschlag in T-114 schützt nur die Umgebung,
ein `U+202E` dreht die Anzeige innerhalb des isolierten Blocks weiter um; das ist hiermit
berichtigt und gemessen. Beim Messen fiel eine offene Regression auf: T-117 hatte die
Zeichenklasse an der Tür um U+061C, U+200E und U+200F erweitert, der Titelvorschlag im Add-in
nicht — die Sackgasse aus T-114 war für drei Zeichen wieder offen, und Abschnitt 16 hat es nicht
bemerkt, weil er gegen eine abgeschriebene Liste prüft. Abschnitt 17 fragt deshalb die Tür selbst
ab, über die ganze BMP. `suggestTitle`, `prepareNote` und `clip` schneiden jetzt an einer
Zeichengrenze: Die halbe Ersatzstelle war kein Schönheitsfehler, sondern ein Wert, der den
Base64-Hin- und Rückweg des Exports nachweislich nicht überstand.

Annahmen:
  1. **Die Anzeige markiert, sie streicht nicht.** An der Stelle eines unsichtbaren Zeichens steht
     `U+FFFD`. Ein stilles Entfernen wäre eine Anzeige, die verschweigt, dass etwas da ist —
     ausgerechnet in der Fläche, die den Betreff einer fremden E-Mail zeigt. Umkehrbar in einer
     Zeile (`HIDDEN_MARKER = ''`), falls der Orchestrator es anders will.
  2. **Rechtsläufige Schrift wird nicht angetastet**, nur isoliert. Arabisch und Hebräisch sind
     Text und kein Angriff; die Richtungsmarken LRM/RLM/ALM dagegen markiert die Anzeige, weil
     die Tür sie seit T-117 abweist — Anzeige und Tür reden über dieselbe Menge.
  3. **Zwei Schnitte mehr als beauftragt.** Der Auftrag nennt `suggestTitle`; `prepareNote` (4000)
     und `clip` (40) tragen denselben Fehler in derselben Zeilenform. Gemessen, dass `prepareNote`
     ihn tatsächlich auslöst. Sie im Diff zu lassen hieße, den Befund zu kennen und
     stehenzulassen.
  4. **Der Umfang ist größer als „der Betreff".** Der Auftrag verlangt, die weiteren Stellen zu
     nennen; ich habe die genannt **und** neun davon behoben, weil ein Baustein, den nur eine
     Fläche benutzt, beim nächsten Mal wieder vergessen wird. Nicht behoben und begründet: die
     Eingabefelder, die Poolsätze aus der Domäne, `detail.message` (Abschnitt 4).
  5. **`Callout.title` nimmt jetzt einen `ReactNode`.** Nötig, damit `<Foreign>` in eine
     Überschrift kann; jede vorhandene Aufrufstelle bleibt gültig.
  6. **Die Zeichenklasse steht weiter zweimal im Baum** (Add-in und `http/input.ts`). Der
     Aufgabenbereich ist ein Browserbündel und darf `@takt/local-api` nicht in seiner
     Abhängigkeitsliste führen. Statt es im Kommentar zuzusichern, misst Abschnitt 17 es —
     dieselbe Antwort wie T-114, nur diesmal gegen die Tür statt gegen eine Abschrift.

Risiken:
  - **Sicherheit, behoben:** Ein `U+202E` im Betreff, im Absendernamen, im Rohwert der Erkennung
    oder in einem Titel aus dem Bestand kann die Anzeige des Aufgabenbereichs nicht mehr umdrehen
    — weder den Block noch den deutschen Satz, in dem der Wert steht. Die Beschriftung der
    Buchungsschaltfläche ist dabei die Stelle, an der es am meisten wog: Sie trägt den Titel
    mitten im Satz.
  - **Sicherheit, offen und benannt:** Das **Vermerkfeld** zeigt den übernommenen E-Mail-Text
    (Betreff und Textkörper) unverändert; `textarea` ist ein Eingabefeld, und dessen Inhalt zu
    verändern hieße, die Eingabe zu ändern. Der Text geht von dort in `todo.note` — intern, nie in
    den Export (A-7.2), aber sichtbar in der Hauptanwendung. **Die Anzeige der Notiz in
    `apps/web/**` ist damit dieselbe Frage eine Fläche weiter**, und sie gehört frontend-dev.
    Vorschlag als eigene Aufgabe, siehe offene Frage 2.
  - **Sicherheit, offen:** Poolnamen in den Sätzen aus `@takt/domain` sind nicht isoliert
    (Abschnitt 4). Kein Weg aus einer E-Mail dorthin; die Namen passieren `nameSchema`.
  - **Altbestand:** Vor T-114 über das Add-in angelegte Titel können die Zeichen tragen. Sie
    werden jetzt **angezeigt** wie sie sind — mit Marke, isoliert — und beim nächsten `PATCH` mit
    422 abgewiesen. Das ist derselbe genannte Nebeneffekt wie in T-101 Annahme 6.
  - **Der Schnitt bleibt kosmetisch unvollkommen:** Ein Graphemcluster kann zerteilt werden, ein
    `U+200D` am Ende zurückbleiben. Wohlgeformt ist der Wert; die Begründung steht in `cut.ts`.
  - **Die statischen Prüfungen sind Wortlautprüfungen.** Sie fangen die zwölf Stellen, die es gab,
    und keine neue unter neuem Namen. Der Verhaltensteil (`visibleText`, `dropHidden`,
    `cutToCharacterBoundary`) ist davon unberührt und misst die Regel selbst.
  - **Ein Elementname ändert sich** (`span` → `bdi` an sechs Stellen). Layoutwirkung geprüft: Alle
    betroffenen Elemente sind Kinder eines Flex-Containers (`.chip`, `.offer__head`,
    `.offer__confirm`) und werden dort ohnehin blockiert; `bdi` ist sonst inline wie `span`. Die
    e2e-Fundstellen suchen über Klassen, nicht über Elementnamen (Abschnitt 8).

Offene Fragen:
  1. **T-117 hat eine Zeichenklasse erweitert, ohne dass das Add-in davon erfuhr.** Der Nachweis
     fängt das ab dieser Aufgabe. Wäre es dem Orchestrator lieber, die Klasse läge **einmal** im
     Baum — in `packages/domain` —, ist das ein Auftrag an domain-dev; das Add-in führt
     `@takt/domain` bereits in seiner Abhängigkeitsliste, `@takt/local-api` darf es nicht. Ich
     halte die gemessene Doppelung für tragbar, die geteilte Fassung aber für besser.
  2. **Die Notiz in der Hauptanwendung.** Ein Vermerk aus dem Add-in trägt den Betreff wörtlich,
     einschließlich der Richtungszeichen (`textSchema` prüft sie bewusst nicht). Wie zeigt
     `apps/web/**` ihn an? Das ist frontend-dev — Vorschlag: dieselbe Behandlung, und dafür
     entweder ein Baustein in `apps/web` oder ein geteilter in `packages/ui-tokens`/`@takt/domain`.
  3. **Eine Entscheidung fehlt.** „Fremder Text wird isoliert **und** bereinigt, Eingabefelder
     nicht" ist eine Produktregel und steht bisher nur in `src/text/hidden.ts` und in diesem
     Bericht. Sie gehört in `decisions.md` (E-06x) — die Datei gehört dem Orchestrator, deshalb
     nur der Vorschlag.

Nächster Schritt:
  Zur Freigabe an Code-Reviewer, UX-Reviewer und security-checker. Für den security-checker sind
  zwei Punkte gemacht: die Berichtigung, dass `unicode-bidi: isolate` allein nicht genügt, und
  die T-117-Regression samt der Frage, wie sie fünf Wellen lang unbemerkt bleiben konnte. Danach
  die Anzeige der Notiz in der Hauptanwendung (offene Frage 2) als eigene Aufgabe an frontend-dev.
```
