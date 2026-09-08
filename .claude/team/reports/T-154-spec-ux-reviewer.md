# T-154 — Spezifikations- und UX-Abgleich über Abschnitt 19 und die Add-in-Fläche

**Rolle:** spec-ux-reviewer **Datum:** 2026-09-05
**Gegenstand:** T-146 (Domäne/Speicherung/Dienst), T-147 (Oberfläche/Hülle), T-149 (Add-in),
T-150 (E2E), dazu O-CJ, die Wiedervorlage von C-22 (E-075 Punkt 2) und die drei Fragen aus T-149.
**Verbindlich:** `docs/spec.md` Abschnitt 19 (A-19.1 bis A-19.21), Abschnitt 12, 13, 15;
E-038, E-070 bis E-077; R-21, R-22; `docs/bedrohungsmodell.md` Abschnitt 20 (A-A-1 bis A-A-24).

**`docs/design/**` liegt nicht vor.** Visuelle Referenz ist damit das Designsystem aus T-006 und
die Musterseite (`apps/web/src/showcase/`), die für Abschnitt 19 eine eigene `DeadlineSection`
führt. Kein Widerspruch zwischen Design und Spezifikation gefunden.

---

## Urteil

**Freigegeben mit Auflagen.** Blockierend: **V-01, V-02, V-03, V-05, V-06.**
Nicht blockierend: V-04, V-07 bis V-11.

Der Bau von Abschnitt 19 ist inhaltlich der beste Stand, den dieses Projekt bisher zu einem
Nachtrag geliefert hat. Die fünf Auflagen sind keine Einwände gegen die Bauart, sondern fünf
Stellen, an denen die Oberfläche etwas **nicht sagt**, was sie sagen muss, und eine Stelle, an
der eine Kontrolle nicht gemessen ist.

---

## 1. O-CJ — die zwei belegten Abweichungen vom Testplan

### 1.1 TP-FRIST-08 — Dashboard zeigt eine Zahl statt einer Frist-Marke

**Plan falsch, Bau richtig.** Ohne Einschränkung.

Gemessen gegen A-19.4: *„Die Frist ist in der Todo-Ansicht sichtbar, ohne dass man das Todo
öffnen muss."* Die Anforderung nennt die **Todo-Ansicht**, nicht das Dashboard. Erfüllt ist sie
dreifach und ohne Lücke:

| Ort | Beleg |
|---|---|
| S-02 Todo-Liste | `TodoListScreen.tsx:722` — `DeadlineFlag` in der Zeile, zwischen `DoneFlag` und den Tags |
| S-04 Kanban-Karte | `Kanban.tsx:195` — `DeadlineFlag` mit `className="kcard__deadline"` |
| S-03 Detailansicht | `TodoDetailScreen.tsx:419-436` — eigene Karte „Frist" |

Der Testplan nannte als dritte Stelle die Dashboard-Kachel „Zuletzt bearbeitet". Dafür gibt es
**keine Deckung**: Abschnitt 12 zählt auf, was auf das Dashboard gehört („zuletzt bearbeitete
Todos"), und verlangt an keiner Stelle, dass diese Zeilen eine Frist tragen. Die Zeile im
Testplan war eine Annahme des Plans über den künftigen Bau — der Plan sagt das über sich selbst
sogar ausdrücklich („Bezeichner, Ort von Feldern und Namen von Funktionen sind **Annahmen dieses
Plans**"). Sie ist mit dem Bau überholt und nicht verletzt.

Der Bau ist dem Plan zusätzlich **überlegen**, und zwar aus einem Grund, der in Abschnitt 12
steht und den der Plan nicht vorwegnahm: *„Wichtige Aktionen sind möglichst direkt vom Dashboard
aus ausführbar."* Die Kachel trägt eine Aktion — `navigate("todos", undefined, { frist: "overdue" })`
(`DashboardScreen.tsx:215`) — und landet in der Todo-Liste mit gesetztem Fristfilter. Eine Marke
an einer „Zuletzt bearbeitet"-Zeile hätte diesen Weg nicht. Der Kommentar an
`DashboardScreen.tsx:84` benennt die Abweichung im Quelltext („es steht hier kein `DeadlineFlag`"),
also ist sie nicht stillschweigend entstanden.

**Empfehlung:** `docs/testplan.md` TP-FRIST-08 auf den gebauten Stand ziehen, der Vermerk allein
genügt nicht dauerhaft — ein Plan, der an zwei Stellen etwas anderes sagt als seine eigenen
Nachträge, wird beim dritten Lesen falsch gelesen. **Kein Befund gegen den Bau.**

Eine Nebenbemerkung ohne Befundnummer: Dass die Kachel bei `0` ganz verschwindet (AN-04) ist
gegen Abschnitt 15 („sinnvolle Empty States") vertretbar — eine Kachel, die immer „0" sagt, ist
keine Auskunft, sondern Fläche. Der Zugang zum Filter besteht unabhängig davon in S-02.

### 1.2 TP-ANH-20 — `.lnk` wird schon beim Anlegen abgewiesen

**Plan überholt, Bau richtig — und beides ist da.** Das ist die Frage, auf die es ankam.

**Erstens, zur Herkunft.** Die Abweisung beim Anlegen ist keine Erfindung von T-146. Sie ist
**A-A-5** aus dem Bedrohungsmodell, geschrieben von T-145 **vor** dem Bau, mit einer Begründung,
die ausdrücklich nicht „ausführbar" lautet: `.lnk`, `.url`, `.pif`, `.scf`, `.desktop` sind
**Umleitungen**, bei denen die Rückfrage nach E-072 Punkt 3 „die Wahrheit über die Datei sagt und
über die Wirkung lügt". Der Testplan schrieb TP-ANH-20 gegen E-072 Punkt 3 und kannte A-A-5 noch
nicht. Der Plan ist also nicht falsch gedacht, sondern **veraltet**.

Der Plan warnte an derselben Stelle vor genau der falschen Version dieser Kontrolle („die
Rückfrage ist die eigentliche Sicherung, nicht ein zusätzlicher Filter nach Endung, der sich
umgehen ließe"). Diese Warnung ist **eingehalten**: Es gibt keine Verbotsliste ausführbarer
Endungen. `.exe`, `.bat`, `.ps1` gehen durch und laufen in die Rückfrage; die fünf Umleitungen
werden aus dem einen benannten Grund abgewiesen. `attachment.ts:452-475` und
`attachment.rs:80-85` schreiben diese Begründung beide aus.

**Zweitens, und wichtiger: Was passiert mit einem Anhang, der schon im Bestand steht?**
E-072 Punkt 2 und `CLAUDE.md` verlangen die Prüfung **bei jedem Aufruf**, weil zwischen Eingabe
und Öffnen der Bestand liegt. Eine Prüfung beim Anlegen ist eine Ergänzung, kein Ersatz. Gemessen:

| Ebene | Vorhanden | Beleg |
|---|---|---|
| Tür des Dienstes, beim Anlegen | **ja** | `checkAttachmentPath` → `INDIRECT_EXTENSIONS`, `packages/domain/src/attachment.ts:552-559` |
| Öffnen-Befehl der Hülle, bei jedem Aufruf | **ja** | `has_indirect_extension` in `check_file`, `apps/desktop/src-tauri/src/attachment.rs:219-225, 294-296` |
| Der Nachweis, dass die Prüfung vor dem Öffnen steht | **ja** | `OPEN_CALL_SITES` in `proof-shell-surface.mjs:133-151` führt beide Aufruforte **namentlich** mit ihrer Wächterfunktion (A-A-9) |
| Der Satz für den Benutzer, wenn die Hülle abweist | **ja** | `path_indirect_extension` → `Attachments.tsx:124-125`, und der Dialog bleibt stehen statt sich zu schließen (`AttachmentOpenDialog.tsx:248-255`) |

**Damit ist beides da, und der Weg für den Altbestand trägt vollständig:** Ein `.lnk` aus einer
früheren Fassung erscheint weiterhin in der Liste (A-19.15: er verschwindet nicht), lässt sich
anklicken, bringt die Rückfrage mit vollem Pfad, wird nach der Bestätigung von der Hülle
abgewiesen, und der Dialog nennt den Grund an Ort und Stelle. Kein Wurf, kein stiller Fehlschlag,
keine verschwundene Zeile.

**Eine Lücke bleibt, und sie ist blockierend — aber sie liegt nicht im Bau, sondern in der
Messung.** `apps/desktop/src-tauri/src/attachment.rs` hat **keinen einzigen** `#[cfg(test)]`-Block.
Von den vier Rust-Dateien mit Prüffällen (`release.rs`, `identity.rs`, `sidecar.rs`, `appdata.rs`)
fehlt ausgerechnet die, die `CLAUDE.md` als Begründung der benannten Hoheitsausnahme beschreibt:
die einzige Kontrolle zwischen einer fremden Zeichenkette und `xdg-open`. A-A-2, A-A-4, A-A-5 und
A-A-10 nennen jeweils „Prüffälle **neben** dem Befehl" als das Messbare. T-148 hat sie nicht
angelegt (sein Bericht führt drei neue Dateien, alle in `packages/**`), T-150 konnte es nicht
(fremde Hoheit) und hat es benannt. Siehe **V-01**; auf dem Board läuft es als O-CK.

**Empfehlung zum Testplan:** TP-ANH-20 nicht als „Rückfrage-Fall" führen, sondern in zwei Fälle
teilen — TP-ANH-20a Türprüfung (läuft, grün) und TP-ANH-20b Öffnen-Befehl mit einem Altbestand,
der an der Tür vorbei entstanden ist. Der zweite ist der Fall, den E-072 Punkt 2 eigentlich
meint, und er läuft heute nirgends.

---

## 2. C-22 — Wiedervorlage nach E-075 Punkt 2

E-075 Punkt 2 macht diese Wiedervorlage zur **Bedingung** für den Bau. Hier ist sie.

### 2.1 Was C-22 behauptete (T-025, 2026)

> `C-22  E-038, A-13.7   Globale Suche`
> „Treffer aus Todos und aus Leistungstexten stehen in einer Liste hintereinander, unterschieden
> nur durch ein Symbol. E-038 verlangt ausdrücklich eine Gruppierung nach Trefferart, ‚damit
> erkennbar bleibt, ob ein Treffer aus einem internen Vermerk oder aus einem Text stammt, der beim
> Kunden gelandet ist'."
> Vorschlag: zwei Abschnitte mit Überschrift im Listenfeld, `role="group"` mit `aria-label`.

### 2.2 Warum er geschlossen wurde (T-116, Abschnitt 5)

T-116 schloss ihn als „in der Sache erledigt" mit **einer** tragenden Begründung:

> „**Die Begründung aus E-038 ist entfallen**: Der Vermerk wird gar nicht durchsucht, also kann
> kein Treffer aus ihm stammen."

Das ist ein Schluss aus dem Ist-Zustand auf die Anforderung. Er ist genau dann gültig, wenn der
Ist-Zustand richtig ist — und E-075 Punkt 2 hat entschieden, dass er es **nicht** ist.

### 2.3 Was heute gemessen gilt (eigene Messung, 2026-09-05)

| Frage | Antwort | Beleg |
|---|---|---|
| Sucht der Dienst im Vermerk? | **nein** | `packages/storage/src/sqlite/repo-todos.ts:138-141` — `WHERE (t.title LIKE ? OR (t.call_number IS NOT NULL AND t.call_number LIKE ?))`. Kein `todo_note`, kein `JOIN`. T-147 hat richtig gemessen. |
| Gruppiert die Oberfläche nach Trefferart? | **nein** | `apps/web/src/app/GlobalSearch.tsx:195-218` — **ein** `<ul role="listbox">`, Todos und Buchungen als gleichrangige `role="option"`, unterschieden durch `Icon` (`inbox` / `clock`) und einen Detailtext. Kein `role="group"`, keine Überschrift. |
| Sagt die Oberfläche dem Benutzer die Wahrheit? | **ja, heute** | `GlobalSearch.tsx:225` — „Gesucht wird in Titeln, Call-Nummern und Leistungstexten — nicht im Vermerk." |
| Sagen Glossar und Handbuch die Wahrheit? | **nein** | `docs/benutzerhandbuch.md:497` verspricht „Todo-Titel, Call-Nummern, den persönlichen Vermerk eines Todos und die Leistungstexte". `docs/glossar.md` folgt E-038. |
| Weiß der Bestand von der Lücke? | **ja** | `docs/benutzerhandbuch.md:606-607` führt sie schon heute als benannte Einschränkung: „Sie liefert Treffer aus Todos und aus Zeitbuchungen gemeinsam, **ohne sie nach Trefferart sichtbar zu gruppieren**." Der documenter hat C-22 also nie als erledigt gelesen. |

**Damit lebt C-22 nicht nur wieder auf — er ist nie tot gewesen.** Die Sachlage, die T-116
beschrieb (zwei Trefferarten, unterschieden durch ein Symbol), ist unverändert; nur die
Begründung für ihre Zulässigkeit fällt weg.

**Und es ist schlimmer als 2026 in T-025.** Damals waren es zwei Trefferarten. Mit dem Vermerk
werden es **drei**, und die dritte ist genau die, für die E-038 die Gruppierung überhaupt
verlangt hat. Ein Todo-Treffer kann dann aus dem Titel, aus der Call-Nummer **oder aus dem
Vermerk** stammen. Zwei Überschriften „Todos" und „Buchungen" würden E-038 dann **wörtlich**
erfüllen und **sachlich** verfehlen: Die Frage, die E-038 stellt — „stammt dieser Treffer aus
einem internen Vermerk oder aus einem Text, der beim Kunden gelandet ist" —, bliebe unbeantwortet,
weil beide Herkünfte in dieselbe Überschrift fielen. **Gruppiert wird nach der Herkunft des
Treffers, nicht nach der Art des Objekts.** Das ist der Punkt, an dem C-22 zweimal falsch
geschlossen worden ist, und der Grund, warum ich ihn nicht ein drittes Mal schließe, bevor er
gebaut ist.

### 2.4 Was die Umsetzung erfüllen muss, damit C-22 diesmal zu Recht geschlossen wird

Sechs Punkte. Sie sind die Abnahmebedingung; wer fünf davon liefert, hat C-22 nicht geschlossen.

1. **Die Suche trifft den Vermerk.** `repo-todos.ts` erweitert die Bedingung um `todo_note.body`.
   Die drei bestehenden Achsen bleiben.
2. **Die Antwort des Dienstes nennt die Herkunft des Treffers.** Ohne dieses Feld kann die
   Oberfläche nicht nach Herkunft gruppieren, und der nächste Agent löst C-22 wieder über die
   Objektart, weil sie das einzige ist, was er hat. Vorschlag für den Vorrat: `title`,
   `call_number`, `note`, `service` — englische Schlüssel, deutsche Wörter erst in der Oberfläche.
   Trifft ein Suchwort mehrere Felder desselben Todos, ist der Treffer **einer** und trägt die
   Herkunft mit der stärksten Aussage (`note` vor `title`/`call_number`), sonst wandert dasselbe
   Todo in zwei Gruppen.
3. **Die Oberfläche gruppiert sichtbar nach Herkunft**, mit Überschrift und mit
   `role="group"` + `aria-labelledby` **innerhalb** des `role="listbox"`. Die Überschriften sind
   keine `option` und dürfen von `aria-activedescendant` nicht angesteuert werden; die
   Pfeiltastennavigation überspringt sie. Mindestens die Gruppe **Vermerk (intern)** ist als
   intern beschriftet — das ist die Aussage, die E-038 verlangt, und ein Symbol ist sie nicht
   (dieselbe Regel, die `Callout` und `DeadlineFlag` in diesem Bestand schon befolgen: Ton nie
   allein über Farbe oder Zeichen, SC 1.4.1).
4. **Der Satz an der Suchfläche wird umgeschrieben** (`GlobalSearch.tsx:225`), und zwar in
   derselben Änderung. Er ist heute wahr und wird mit dem ersten Zeichen des Baus falsch.
5. **Der falsche Satz im Kopf der Datei wird gelöscht, nicht umschifft.** Siehe **V-02** — das ist
   der eigentliche Riegel vor dem Bau.
6. **Ein Vermerkstreffer zeigt fremden Text und muss es sagen.** Erscheint ein Ausschnitt aus dem
   Vermerk in der Trefferzeile, geht er durch `<Foreign>` wie jeder andere Wert dort schon
   (`GlobalSearch.tsx:213-214`), und `proof:foreign` muss ihn am Typ erkennen. Zusätzlich: Der
   Vermerkstext gelangt damit in eine Fläche, die über **jeder** Ansicht liegt und mit `Strg + K`
   von überall aufgeht. Das ist keine Exportgrenze (A-7.2 bleibt gewahrt, siehe V-02), aber es
   ist eine neue Sichtbarkeit, und ich lege sie dem Orchestrator als Frage vor statt sie zu
   entscheiden.

**Zuständigkeit:** Punkt 1 und 2 domain-dev, 3 bis 6 frontend-dev, dazu documenter für
`glossar.md` und `benutzerhandbuch.md:497` sowie die Streichung der Einschränkung in
`benutzerhandbuch.md:606-607`. Punkt 5 gehört an den **Anfang**, nicht ans Ende.

---

## 3. Die drei Fragen aus T-149 zur Add-in-Fläche

Vorweg die Eigenschaft, gegen die ich alle drei gelegt habe: Das Feld „Frist" ist das **einzige**
im Aufgabenbereich, das weder vorbelegt noch aus der E-Mail erkannt wird (E-074 Punkt 4). Der
Riegel ist eine **Abwesenheit**. Die Reihenfolge im Aufgabenbereich lautet: E-Mail →
Call-Nummer (erkannt) → Angebot → Titel (Vorschlag aus dem Betreff) → **Frist** → Tags → Vermerk
(mit Knopf „Inhalt der E-Mail übernehmen") → Anlegen.

### 3.1 Platzierung — **richtig, unverändert lassen**

Die Begründung von T-149 („Titel und Frist sind Angaben **über** das Todo, Tags und Vermerk
ordnen es ein") trägt, und die Abweichung von der Reihenfolge der Hauptanwendung ist sauber
begründet: Dort steht die Frist zwischen Call-Nummer und Status, hier liegt die Call-Nummer weit
oben in ihrem eigenen Bereich. Eine Verschiebung unter die Tags würde die Frist neben den Vermerk
stellen — und der Vermerk hat einen Knopf „Inhalt der E-Mail übernehmen". Das wäre die
schlechtere Nachbarschaft: Genau dort entstünde die Erwartung, die E-074 Punkt 4 verbietet.

**Aber die Platzierung hat einen Preis, und der ist nicht bezahlt.** Alle drei Felder **über** der
Frist sind gefüllt, wenn der Benutzer die Fläche öffnet: Call-Nummer erkannt, Titel
vorgeschlagen, Angebot angeboten. Das Auge liest von oben nach unten drei Vorschläge und danach
ein leeres Feld. Die naheliegendste Deutung eines leeren Feldes am Ende einer Kette gefüllter
Felder ist **„nichts gefunden"**, nicht **„wurde nicht gesucht"**. Das ist derselbe Unterschied,
den `TP-FRIST-07` in der Domäne mit eigener Nummer schützt („keine Angabe" gegen „ein Wert, der
zufällig nichts anzeigt") — nur eine Ebene höher, im Kopf des Benutzers. Die Platzierung bleibt
richtig; sie verlangt aber, dass die Abwesenheit **ausgesprochen** wird. Siehe 3.2 und V-03.

### 3.2 Der ergänzte Hinweissatz — **so nicht. Blockierend (V-03), im Wortlaut zu ändern (V-04)**

Der Hinweis lautet heute (`TaskPane.tsx:493`):

> „Ein Tag, keine Uhrzeit. Optional — leer lassen heißt: keine Frist. Sie wird nicht aus der
> E-Mail übernommen und ändert nichts an Pools, Spalten, Buchungen oder Export."

Vier Aussagen in einem Satzband. Drei Einwände, in aufsteigender Schwere:

1. **Die tragende Aussage steht an dritter von vier Stellen.** „Sie wird nicht aus der E-Mail
   übernommen" ist der einzige Satz auf dieser Fläche, der die Abwesenheit erklärt. Er steht
   zwischen zwei Aussagen, die der Benutzer entweder ohnehin sieht („Optional") oder nicht
   braucht.
2. **Die vierte Aussage gehört nicht in den Aufgabenbereich.** „ändert nichts an Pools, Spalten,
   Buchungen oder Export" ist wörtlich aus `TodoFormDialog.tsx:227` übernommen. In der
   Hauptanwendung sagt sie etwas: Dort **gibt es** Pools, Spalten und eine Exportansicht, und die
   Sorge, eine Frist schiebe eine Karte durchs Board, ist real. Im Aufgabenbereich gibt es keine
   davon. Der Satz ist dort Fülltext und schiebt genau den Satz aus Punkt 1 in die Mitte. Das ist
   der Grund, warum Wortlaut „wie in der Hauptanwendung" hier nicht das richtige Kriterium war.
3. **Der Hinweis verschwindet, sobald ein Fehler ansteht** — `Primitives.tsx:114`:
   `hint !== undefined && error === undefined`. Genau in dem Augenblick, in dem der Benutzer mit
   dem Feld ringt, verliert er den einzigen Satz, der erklärt, warum das Feld leer war. Bei einem
   Hinweis, der nur Bedienkomfort trägt, wäre das gleichgültig; hier trägt er die Erklärung eines
   Sicherheitsverhaltens.

**Und der schwerste Punkt, der die Frage des Auftrags direkt beantwortet — „macht die Oberfläche
das dem Benutzer verständlich, oder schweigt sie?"**

Für einen sehenden Benutzer: Sie sagt es **einmal, an dritter Stelle von vier**.
Für einen Benutzer mit Vorlesehilfe: Sie **schweigt vollständig.**

`Field` erzeugt die Kennungen `${htmlFor}-hint` und `${htmlFor}-error` (`Primitives.tsx:115, 120`),
aber **kein einziges Eingabefeld im Aufgabenbereich verweist darauf**. Eine Suche nach
`aria-describedby` im ganzen Add-in liefert **einen** Treffer, und der gehört der Trefferzahl im
`TagPicker` (`TagPicker.tsx:181`). Beim Fristfeld (`TaskPane.tsx:496-504`) steht weder
`aria-describedby` noch `aria-invalid`. Wer das Feld mit der Tastatur ansteuert, hört „Frist,
Datum, leer" — und nichts darüber, dass es leer ist, **weil Takt bewusst nicht nachgesehen hat**.
Der `role="alert"` am Fehlerabsatz rettet nur den Fehlerfall, nicht den Normalfall, und der
Normalfall ist hier der Fall, der etwas zu sagen hat.

Das ist keine Feinheit am Rand: Die einzige Stelle, an der eine bewusste Abwesenheit erklärt
wird, ist für einen Teil der Benutzer nicht vorhanden. **V-03 ist deshalb blockierend**, und die
Behebung gehört **einmal** in `Primitives.tsx#Field` (alle Felder auf einen Schlag), nicht an
dieses eine Feld.

### 3.3 Die gesperrte Schaltfläche — **richtige Härte, behalten**

**Ja, das ist die richtige Antwort, und sie soll nicht durch „absenden lassen und den Dienst
antworten lassen" ersetzt werden.** Drei Gründe:

1. **Der Weg zurück ist im Add-in teurer als in der Hauptanwendung.** Der Aufgabenbereich lebt in
   einem Outlook-Fenster an einer bestimmten Nachricht. Eine Runde zum Dienst und zurück, um zu
   erfahren, dass ein Zeichen im Datumsfeld nicht stimmt, ist teurer als die Sperre — dieselbe
   Rechnung, die T-041/R-15 bei der Call-Nummer schon gemacht haben.
2. **Der Bau macht den Fehler nicht, vor dem E-072 warnt.** Die Sperre ersetzt keine Prüfung: Die
   Tür prüft dieselbe Eingabe noch einmal mit **derselben** Regel (`dueDateSchema` →
   `isCalendarDay` aus `@takt/domain`), und beide Türen sind einzeln gegen die Domäne gemessen
   (proof:addin 18b). Es gibt keine zweite Fassung der Form im Add-in-Baum.
3. **Die Alternative wäre schlechter als beide.** Ein unbrauchbarer Wert „wie leer" zu behandeln
   und das Todo ohne Frist anzulegen — das ist die naheliegende dritte Antwort, und
   `duedate/entry.ts:60-66` schreibt selbst auf, warum sie falsch ist: Der Benutzer hat die Frist
   eingetragen, ein Todo ohne sie sieht nach Erfolg aus. Der `DueDateEntry` mit drei Ausgängen
   statt `string | null` ist die richtige Bauart.

**Zwei Auflagen daran, beide nicht blockierend:**

- **V-11:** Der Knopf hat inzwischen **vier** Sperrgründe (`TaskPane.tsx:585-590`): leerer Titel,
  Dienst nicht bereit, Call-Nummer unbrauchbar, Frist unbrauchbar. Genannt wird am Knopf **keiner**.
  Zwei der vier haben eine Meldung am Feld, zwei nicht (leerer Titel, Dienst nicht bereit). Ein
  gesperrter Hauptknopf ohne Begründung ist die Fläche, an der ein Benutzer stehenbleibt. Das ist
  ein Bestandsbefund, dem die Frist als vierter Grund beitritt — nicht von T-149 verursacht, aber
  von T-149 verschärft.
- **V-10:** Die Hauptanwendung antwortet auf dieselbe Eingabe **anders**: `TodoFormDialog.tsx:222-228`
  ruft `readDueDate` nicht, zeigt keinen Feldfehler und sperrt nicht — dort geht der Wert an die
  Tür und kommt als 422 zurück. Zwei Flächen, dieselbe Eingabe, zwei Antworten. Das ist die
  C-03-Klasse. Mein Vorschlag ist ausdrücklich **nicht**, die Sperre im Add-in zu lockern, sondern
  `readDueDate` (oder `isCalendarDay` unmittelbar) auch in `TodoFormDialog` zu ziehen — die
  Funktion liegt in `@takt/domain` und ist von beiden Seiten erreichbar.

---

## 4. Was ich außerdem mitgenommen habe

### 4.1 „Überfällig seit N Tagen" — **T-147 bestätigt, die Auslassung ist richtig**

Der Auftrag verlangt Bestätigung oder Bestreitung. Ich **bestätige** AN-02, und zwar aus drei
Gründen, von denen T-147 nur den ersten genannt hat:

1. **Der genannte Grund trägt.** Eine Differenz zweier Kalendertage ist eine Rechnung über Zeit.
   Sie in `DeadlineFlag` zu bauen hieße, den Tagesbegriff aus E-025/E-070 Punkt 2 ein zweites Mal
   anzufassen — an genau der Stelle, an der `useToday` gerade mit einigem Aufwand dafür gesorgt
   hat, dass es nur eine gibt.
2. **Keine Anforderungs-ID verlangt ihn.** A-19.5 verlangt drei **benannte, unterscheidbare**
   Zustände, A-19.6 macht sie zu Tagesvergleichen. „Seit drei Tagen" ist weder ein vierter Zustand
   noch eine Bedingung der drei. T-144 hat den Satz als Gestaltungsvorschlag gemacht, nicht als
   Ableitung — sein eigener Absatz begründet ihn mit Vorlesehilfen, und diese Begründung erfüllt
   der Bau anders und besser (siehe 3).
3. **Das absolute Datum ist die stärkere Auskunft, und es steht schon da.** Der zugängliche Name
   lautet heute `"Überfällig — Frist: 03.09.2026"` (`DeadlineFlag.tsx:117`). Mit „seit 2 Tagen"
   müsste der Benutzer zurückrechnen, um zu erfahren, ob er den Termin am Montag oder am Freitag
   verpasst hat. T-144s eigenes Argument („wer die Karte hört, kann mit ‚überfällig' nicht
   planen") spricht damit **gegen** die relative Angabe, nicht für sie. Dazu kommt die dritte
   Auflage, unter der T-144 die dritte Markenfamilie überhaupt zugelassen hat — sie darf nicht
   laut sein —, und „Überfällig seit 3 Tagen" ist länger und lauter als „Überfällig 03.09.2026".

**Konsequenz:** Die Begriffstabelle in T-144 Abschnitt 8.5 führt „im Satz ‚Überfällig seit N
Tagen'" als **den** Wortlaut. Sie ist damit überholt und darf nicht als Vorlage in den documenter
wandern. Das ist kein Befund gegen Code, sondern eine Warnung an die nächste Welle.

### 4.2 Die Begriffe — A-19.2 gehalten

`Fälligkeitsdatum`, `fällig am` und `Deadline` kommen in `apps/web/src/**` und
`apps/outlook-addin/src/**` **ausschließlich** in Kommentaren vor, und dort als Gegenbeispiel
(`TodoFormDialog.tsx:211`, `TaskPane.tsx:475-476`). Auf dem Bildschirm heißt sie durchgehend
„Frist": Feldbezeichnung, Filterbezeichnung („Jede Frist"), Sortierbezeichnung („Frist, früheste
zuerst"), Filterchip („Frist: Überfällig"), Kartentitel, Knopfbeschriftung („Frist setzen" /
„Frist ändern"), Kacheldetail und zugänglicher Name des Etiketts.

**Der scheinbare Widerspruch A-19.2 gegen A-19.5 ist richtig aufgelöst.** A-19.2 verbietet „fällig
am"; A-19.5 **benennt** den Zustand „heute fällig". Der Bau schreibt das Zustandswort „Heute
fällig" und den Sachnamen „Frist" und mischt sie nie — der zugängliche Name setzt sie sogar
ausdrücklich nebeneinander: `"Heute fällig — Frist: 05.09.2026"`. Kein Befund.

**Eine Lücke im Nachweis, nicht im Text:** Der Mikrofall in `web-build-smoke.spec.ts` misst die
Abwesenheit der drei Wörter im gebauten `apps/web/dist`. Für `apps/outlook-addin/dist` gibt es
nichts Vergleichbares, obwohl A-19.2 „die Oberfläche" sagt und der Aufgabenbereich eine ist.
Siehe **V-09**.

### 4.3 Zustandsabdeckung nach Abschnitt 15 — gut, mit zwei Löchern

| Fläche | Leer | Lädt | Zeiger/Aktiv/Fokus | Fehler | Bestätigung |
|---|---|---|---|---|---|
| Anhangbereich S-03 | `EmptyState` „Keine Anhänge" mit erklärendem zweitem Satz | `LoadingBlock`, 3 Zeilen | ja | `InlineMessage` + „Erneut versuchen"; ausdrücklich **nicht** ausgeblendet | Entfernen mit `ConfirmDialog` und Folgesatz je Art |
| Anhang hinzufügen | Feldfehler am Feld, nicht nach dem Klick | `busy` am Knopf | ja | Rückfallweg bei fehlender Dateiauswahl mit Grund | Rückweg statt Rückfrage (E-059) — richtig, Hinzufügen ist umkehrbar |
| Anhang öffnen (Datei) | — | Anzeiger am Bestätigungsknopf | ja | **bleibt im Dialog stehen** und nennt den Grund | `AttachmentOpenDialog`, sechs Eigenschaften aus A-A-6 einzeln belegt |
| Frist in S-03 | „Keine Frist gesetzt. … es hat schlicht keinen dieser Zustände." | über die Ansicht | — | über die Ansicht | Bearbeiten-Dialog |
| Frist in S-02/S-04 | **nichts** — richtig nach A-19.5 | über die Ansicht | — | — | — |
| Dashboard-Kachel | Kachel entfällt bei 0 | über die Ansicht | Aktion „In der Todo-Liste zeigen" | über die Ansicht | — |
| Fristfilter/Sortierung S-02 | „Jede Frist"; Hinweis zur Ordnung ohne Frist steht am Feld | über die Liste | Chip mit Entfernen | über die Liste | — |

Die zwei Löcher sind **V-05** (Dashboard) und **V-06** (Filterliste) — beide dieselbe Klasse, und
beide genau die Klasse, gegen die `useToday` gebaut wurde.

Der Kontrastnachweis ist vollständig: `contrast-check.mjs:541-563` führt acht Paare für die drei
Fristzustände und die Kachel, mit begründeter Auslassung des Kachelrahmens. `DeadlineFlag` trägt
sechs Unterscheidungsmerkmale, von denen nur eines Farbe ist (SC 1.4.1), und das absolute Datum
steht immer im zugänglichen Namen. Das ist vorbildlich und braucht keine Auflage.

---

## 5. Befunde

```
V-01  A-19.18, E-072 Punkt 2, A-A-2/A-A-4/A-A-5/A-A-10   Hülle, apps/desktop/src-tauri/src/attachment.rs
      BLOCKIEREND
      Abweichung: Die Datei hat keinen einzigen `#[cfg(test)]`-Block. Sie ist die einzige
      Kontrolle zwischen einer Zeichenkette aus dem Bestand und dem Öffnen-Befehl des
      Betriebssystems — genau die Datei, mit der CLAUDE.md die benannte Hoheitsausnahme
      begründet. Vier andere Rust-Dateien haben Prüffälle (`release.rs`, `identity.rs`,
      `sidecar.rs`, `appdata.rs`), diese nicht. A-A-2 verlangt 28 Zeichenketten „neben dem
      Befehl", A-A-4 die UNC-Fälle, A-A-5 die sechs Umleitungsfälle plus die drei Gegenproben
      (`x.exe`, `x.bat`, `x.ps1` gehen durch), A-A-10 zusätzlich einen Windows-Läufer. Nichts
      davon läuft. Damit ist der Bau von TP-ANH-20 zwar zweischichtig (siehe 1.2), aber nur die
      obere Schicht ist gemessen. Der Fall, der E-072 Punkt 2 eigentlich meint — ein Anhang, der
      an der Tür vorbei in den Bestand gelangt ist —, hat heute keinen Prüffall.
      Vorschlag: unit-tester, `#[cfg(test)]` in `attachment.rs` nach A-A-2/A-A-4/A-A-5, mit
      `.lnk`, `.LNK`, `.url`, `.pif`, `.scf`, `.desktop` als Abweisungen und `.exe`, `.bat`,
      `.ps1` als Durchlässe. Auf dem Board liegt es als O-CK; die Wiedervorlage von Abschnitt 19
      hängt daran. Zusätzlich e2e-tester: TP-ANH-20 in 20a (Tür) und 20b (Öffnen-Befehl auf einem
      Altbestand) teilen.

V-02  E-038, A-7.2, A-13.7   Globale Suche, apps/web/src/app/GlobalSearch.tsx:20-24
      BLOCKIEREND — Riegel vor dem Bau aus E-075 Punkt 2
      Abweichung: Der Kopfkommentar behauptet, die Suche treffe den Vermerk nicht „und darf ihn
      nicht treffen (A-7.1) — das ist keine Einschränkung der Suche, sondern die vierte Schicht
      der Notiz-Trennung". Beides ist falsch. A-7.1 lautet vollständig „Jedes Todo besitzt eine
      persönliche Notiz" und sagt über Suche nichts; gemeint sein kann nur A-7.2, und die lautet
      „ausschließlich **innerhalb der Anwendung** sichtbar und wird nicht automatisch an das
      Abrechnungstool übertragen". Eine Suche innerhalb von Takt ist die Anwendung selbst — A-7.2
      verbietet den Export, nicht das Wiederfinden. Der Satz erhebt damit eine Bauentscheidung zu
      einer Datenschutzgrenze, die es nicht gibt, und er steht an der Datei, die der nächste Agent
      als erstes öffnet. Er ist der Grund, aus dem C-22 zum zweiten Mal geschlossen worden wäre.
      Vorschlag: frontend-dev streicht ihn und ersetzt ihn durch E-038 in seiner heutigen Fassung
      und E-075 Punkt 2. Als erster Schritt der Umsetzung, nicht als letzter — solange er
      dasteht, baut ein Agent gegen die eigene Datei.

V-03  A-19.21, E-074 Punkt 4, SC 1.3.1 / 3.3.2   S-12 Aufgabenbereich, TaskPane.tsx:490-505
      BLOCKIEREND
      Abweichung: Die Frist ist das einzige Feld des Aufgabenbereichs, dessen Leere eine Aussage
      ist („wurde nicht gesucht", nicht „nichts gefunden"). Diese Aussage steht ausschließlich im
      Hinweistext — und der erreicht einen Benutzer mit Vorlesehilfe nie: Das `<input>` trägt
      weder `aria-describedby` auf `due-hint`/`due-error` noch `aria-invalid`, obwohl `Field`
      beide Kennungen erzeugt (`Primitives.tsx:115, 120`). Im ganzen Add-in gibt es genau ein
      `aria-describedby`, und das gehört der Trefferzahl im TagPicker. Zusätzlich verschwindet der
      Hinweis vollständig, sobald ein Fehler ansteht (`Primitives.tsx:114`) — der Satz über die
      Abwesenheit fällt also genau dann weg, wenn der Benutzer am Feld hängt. Der Riegel ist eine
      Abwesenheit, und die Oberfläche schweigt über sie für einen Teil ihrer Benutzer.
      Vorschlag: integration-dev, einmal in `Primitives.tsx#Field` für alle Felder: `describedBy`
      berechnen (Hinweis und Fehler, in dieser Reihenfolge, beide wenn beide da sind) und an das
      Kind reichen; `aria-invalid` setzen, wenn `error` steht. Und: den Hinweis **nicht** mehr
      ausblenden, wenn ein Fehler daneben steht — der Fehler sagt, was falsch ist, der Hinweis,
      was das Feld ist.

V-04  A-19.21, A-19.7, E-074 Punkt 4   S-12 Aufgabenbereich, TaskPane.tsx:493
      Abweichung: Der Hinweis trägt vier Aussagen, und die einzige, die auf dieser Fläche etwas
      erklärt, steht an dritter Stelle. Die vierte („ändert nichts an Pools, Spalten, Buchungen
      oder Export") ist wörtlich aus `TodoFormDialog.tsx:227` übernommen, wo sie eine reale Sorge
      beantwortet; im Aufgabenbereich gibt es weder Pools noch Spalten noch eine Exportansicht.
      Sie schiebt den tragenden Satz in die Mitte.
      Vorschlag: die tragende Aussage nach vorn und den Fülltext streichen, etwa:
      „Wird nicht aus der E-Mail übernommen — tragen Sie sie selbst ein. Ein Tag, keine Uhrzeit;
      leer lassen heißt: keine Frist." Drei Aussagen statt vier, die wichtigste zuerst.
      Der Vollständigkeitssatz aus der Hauptanwendung bleibt dort, wo er hingehört.

V-05  A-19.5, A-19.6, E-070 Punkt 3, E-073 Punkt 2   S-01 Dashboard, DashboardScreen.tsx:65, 92
      BLOCKIEREND
      Abweichung: Die Kachel „Überfällig" ruht auf `const today = useMemo(() => todayCalendarDay(), [])`
      — einem beim Betreten eingefrorenen Tag — und die Zählung (`listTodos({ dueStates: ["overdue"] })`)
      steht nicht unter `today`. Bleibt Takt über Mitternacht offen, zeigt das Dashboard die Zahl
      von gestern; war sie null, fehlt die Kachel weiter ganz, obwohl seit Mitternacht Todos
      überfällig sind. In derselben Sitzung zeigt die Todo-Liste, die `useToday()` benutzt, den
      richtigen Zustand. Zwei Flächen, zwei Antworten auf dieselbe Frage. E-073 Punkt 2 hat genau
      dafür entschieden, wann neu gerechnet wird — Mitternachtszeitgeber plus `visibilitychange` —,
      und `useToday` setzt das um; das Dashboard benutzt es als einzige der vier Fristflächen nicht.
      Vorschlag: frontend-dev, `useToday()` statt des eingefrorenen `useMemo`, und `today` in die
      Abhängigkeitsliste des `useAsync`. Das behebt zugleich die seit T-045 bestehende Ungenauigkeit
      bei „heute erfasste Arbeitszeit", die an demselben Wert hängt.

V-06  A-19.5, A-19.20, E-073 Punkt 2   S-02 Todo-Liste, TodoListScreen.tsx:172-181
      BLOCKIEREND
      Abweichung: Die Etiketten rechnen bei Tageswechsel neu (`today` aus `useToday`), die
      **Ergebnismenge** nicht: `useAsync(..., [filter, limit, showDone], [version])` führt `today`
      nicht. Steht der Filter auf „Heute fällig" und die Anwendung über Mitternacht offen, kippen
      alle Etiketten der geladenen Zeilen auf „Überfällig", während der Chip darüber weiter
      „Frist: Heute fällig" sagt — eine Liste, die sich selbst widerspricht. Bei „Überfällig"
      dieselbe Lage in die andere Richtung: Was seit Mitternacht überfällig ist, fehlt in der
      Liste und in keiner Meldung. Das ist die Fehlerklasse aus T-144/F-T144-1, eine Ebene höher.
      Vorschlag: frontend-dev, `today` in die Abhängigkeitsliste des `useAsync` — die Liste lädt
      dann einmal je Tageswechsel neu, also einmal täglich. Ein Fristfilter ist dafür nicht
      Bedingung; ohne ihn ist der zusätzliche Lauf folgenlos.

V-07  A-19.15, E-072 Punkt 3, A-A-5, A-A-6 Punkt 3   S-03 Anhang öffnen, AttachmentOpenDialog + attachmentLabel.ts:61-78
      Abweichung: `RUNS_WHEN_OPENED` führt `.lnk` nicht (richtig — es ist keine Sicherheitsliste,
      sondern eine Wortliste). Folge für einen `.lnk` aus dem Altbestand: Der Dialog zeigt die
      milde Fassung „Diese Datei wird geöffnet" mit `info`-Symbol, also genau bei der Dateiart,
      für die `attachment.ts:456-465` und `attachment.rs:80-85` gleichlautend feststellen, die
      Rückfrage sei „aktiv irreführend". Der Benutzer erfährt erst **nach** der Bestätigung, dass
      Takt sie nicht öffnet. Die Kette hält (V-01 einmal erfüllt), aber die Reihenfolge der
      Auskunft ist verkehrt herum.
      Vorschlag: frontend-dev, der Dialog erkennt die fünf Umleitungsendungen vorab und zeigt
      dann keinen Öffnen-Knopf, sondern den Satz, der heute erst hinterher kommt
      (`Attachments.tsx:124-125`). Ausdrücklich **ohne** die Prüfung in der Hülle anzufassen: Die
      bleibt der Riegel, die Anzeige wird nur ehrlich. Ein Kommentar an der Stelle muss sagen,
      dass diese Liste dieselbe Herkunft hat wie `INDIRECT_EXTENSIONS` in der Domäne und nicht
      abgeschrieben werden darf.

V-08  A-19.21, A-10.9   S-12 Aufgabenbereich, TaskPane.tsx:450, 456
      Abweichung: Trägt der Benutzer eine Frist ein und wechselt danach über ein Angebot auf
      „Auf vorhandenes Todo buchen", verschwindet das Fristfeld mit der ganzen Anlegen-Fläche.
      Die eingetragene Frist wird ohne ein Wort verworfen; das bebuchte Todo behält seine eigene.
      Das ist sachlich richtig (A-19.21 nennt das **Anlegen**), aber es ist eine bewusste Eingabe
      des Benutzers, die stillschweigend verfällt.
      Vorschlag: integration-dev, ein Satz in der Buchungsfläche, wenn `dueDate` nicht leer ist:
      „Die eingetragene Frist gilt nur für ein neues Todo. Dieses Todo behält seine eigene."
      Kein neues Feld, kein Übertragen — nur die Auskunft.

V-09  A-19.2   S-12 Aufgabenbereich, Nachweis
      Abweichung: Die Abwesenheit von „Fälligkeitsdatum", „fällig am" und „Deadline" ist für
      `apps/web/dist` als Build-Nachweis gemessen (`web-build-smoke.spec.ts`, Mikrofall aus
      Testplan 25). Für `apps/outlook-addin/dist` gibt es nichts Vergleichbares, obwohl A-19.2
      „die Oberfläche" sagt und der Aufgabenbereich eine ist. Heute ist der Zustand richtig (die
      drei Wörter stehen nur im Gegenbeispiel-Kommentar `TaskPane.tsx:475-476` und fallen beim
      Bauen weg); gemessen ist er nicht.
      Vorschlag: integration-dev, eine Prüfung in `proof-addin.mjs` Abschnitt 18 nach dem Muster
      von 18a Herkunft — Abwesenheitsprüfung über die gebaute Datei, mit der Gegenprobe, dass
      „Frist" vorkommt. Sonst ist die Prüfung grün, wenn das Feld ganz fehlt.

V-10  A-19.3, C-03-Klasse   S-02/S-03 Bearbeiten-Dialog, TodoFormDialog.tsx:222-228
      Abweichung: Dieselbe Eingabe bekommt an zwei Türen zwei Antworten. Der Aufgabenbereich
      prüft mit `readDueDate` gegen `isCalendarDay` und sperrt den Knopf mit dem Satz der Domäne;
      der Bearbeiten-Dialog der Hauptanwendung ruft nichts, zeigt keinen Feldfehler und schickt
      den Wert an die Tür, die mit 422 antwortet. Bei `type="date"` in einem modernen Webview ist
      das selten erreichbar, aber es ist erreichbar (Rückfall auf ein Textfeld, eingefügter Wert,
      `2026-02-30` aus einem Kalendersteuerelement mit eigener Meinung).
      Vorschlag: frontend-dev zieht `isCalendarDay`/`DUE_DATE_MESSAGE` aus `@takt/domain` auch in
      `TodoFormDialog` — dieselbe Regel, dieselbe Meldung, dieselbe Härte. Ausdrücklich nicht die
      Gegenrichtung: Die Sperre im Add-in bleibt (siehe 3.3).

V-11  Abschnitt 15, SC 3.3.1   S-12 Aufgabenbereich, TaskPane.tsx:585-590
      Abweichung: Der Hauptknopf „Todo anlegen" hat vier Sperrgründe und nennt keinen. Zwei davon
      haben eine Meldung am Feld (Call-Nummer, Frist), zwei haben gar keine (leerer Titel, Dienst
      nicht bereit). Ein gesperrter Hauptknopf ohne Begründung ist die Fläche, an der ein Benutzer
      stehenbleibt. Bestandsbefund, von der Frist als viertem Grund verschärft.
      Vorschlag: integration-dev, ein Satz unter dem Knopf, der den **ersten** offenen Grund
      nennt, oder die bestehende Praxis der Hauptanwendung übernehmen (Feld beim Klick auf
      „berührt" setzen und die Meldung zeigen, statt vorab zu sperren) — eine der beiden, nicht
      beide. Eigene Aufgabe, nicht Teil der Fristfreigabe.
```

---

## 6. Deckung gegen Abschnitt 19, Anforderung für Anforderung

| ID | Stand | Beleg / Bemerkung |
|---|---|---|
| A-19.1 | erfüllt | Feld optional an beiden Türen; `.default(null)` im Add-in, `null` = ohne Frist |
| A-19.2 | erfüllt | „Frist" durchgehend; Nachweis für `apps/web/dist`, für das Add-in offen (V-09) |
| A-19.3 | erfüllt | Setzen/Ändern/Entfernen im Bearbeiten-Dialog; geleertes Feld entfernt (`TodoFormDialog.tsx:161`) |
| A-19.4 | erfüllt | S-02, S-03, S-04 ohne Öffnen; Dashboard als vierte Stelle mit Zahl und Aktion (1.1) |
| A-19.5 | erfüllt, mit V-05/V-06 | drei Zustände benannt und über sechs Merkmale unterschieden; ohne Frist kein Zustand, ausdrücklich auch in S-03 ausgesprochen |
| A-19.6 | erfüllt | `type="date"`, kein `datetime-local`; Tagesbegriff aus E-025 an einer Stelle |
| A-19.7 | erfüllt | keine Achse; Satz an drei Flächen ausgeschrieben |
| A-19.8 bis A-19.14 | erfüllt | fünf Flächen mit je fünf Zuständen; Ersatzbezeichnung nie leer; Vorschaubild als `data:` ohne CSP-Öffnung |
| A-19.15 | erfüllt | Rückweisungsgrund je Schlüssel als deutscher Satz, in der Zeile bzw. im stehenbleibenden Dialog; Ladefehler blendet die Liste **nicht** aus |
| A-19.16 | erfüllt | Vorgabe der Liste bleibt „Zuletzt bearbeitet"; kein Umstellen der bestehenden Ordnung |
| A-19.17 | erfüllt | `proof:export` 97/0, `proof:export-api` 69/0, `proof:template-fields` 30/0 — weder Frist noch Anhang in einer Feldquelle |
| A-19.18 | erfüllt, Messung offen | A-A-24 als E2E gemessen; die Rust-Hälfte fehlt (V-01) |
| A-19.19 | erfüllt, an der **Wirkung** gemessen | `proof:addin` 18d: vier Anhangsschreibweisen, 201, **null** Zeilen in `todo_attachment`, mit Gegenprobe, dass die Zählung rot werden kann |
| A-19.20 | erfüllt, mit V-06 | Filter über vier Zustände plus „Ohne Frist", Sortierung in beide Richtungen, Hinweis zur Ordnung ohne Frist am Feld (E-074 Punkt 2 wörtlich umgesetzt) |
| A-19.21 | erfüllt, mit V-03/V-04/V-08 | Feld „Frist" im Aufgabenbereich, Regel aus `@takt/domain` gerufen, statisch bewacht gegen jede künftige Erkennung |

---

## 7. Annahmen

1. **`docs/design/**` existiert nicht**, also habe ich die Musterseite (`showcase/DeadlineSection.tsx`)
   und das Designsystem aus T-006 als visuelle Referenz genommen. Ein Konflikt Design gegen
   Spezifikation wäre zu melden gewesen; es gibt keinen.
2. **Ich habe keinen Prüflauf gestartet.** Alle Zahlen in diesem Bericht sind entweder aus dem
   Quelltext gelesen oder aus den Berichten T-146 bis T-150 übernommen und dort als solche
   gekennzeichnet. Wo ich selbst gemessen habe (Suchbedingung in `repo-todos.ts`, fehlende
   `#[cfg(test)]` in `attachment.rs`, fehlendes `aria-describedby` im Add-in, `today` nicht in den
   Abhängigkeitslisten), steht die Datei mit Zeilennummer daneben.
3. **V-05 und V-06 habe ich am Code abgeleitet, nicht über Mitternacht beobachtet.** Die
   Abhängigkeitslisten sind eindeutig; ein Prüffall mit `page.clock` — dieselbe Bauart, die T-150
   für TP-FRIST-09 schon gebaut hat — würde es zeigen und gehört zur Behebung.
4. **Die Nummerierung V-01 bis V-11** setzt die Reihen C-xx (T-025), B-x (T-116) und U-xx (T-144)
   fort, ohne mit ihnen zu kollidieren. C-22 behält seine alte Nummer, weil er derselbe Befund ist.
5. **Ich habe die Grenze zwischen „blockierend" und „Auflage" danach gezogen**, ob die Fläche dem
   Benutzer etwas Falsches sagt oder etwas Richtiges nicht sagt, das sie sagen muss. V-07 bis V-11
   sind echte Mängel, aber keiner von ihnen lässt einen Benutzer in einem falschen Zustand zurück.

---

## 8. Risiken

1. **Sicherheit, und es ist das einzige echte Sicherheitsrisiko dieser Runde: V-01.** Die
   Formprüfung in `attachment.rs` ist die letzte Kontrolle vor `open`, und sie hat keinen einzigen
   Prüffall. Sie ist heute richtig — ich habe sie gelesen — aber „heute richtig und nirgends
   gemessen" ist genau der Zustand, den T-136-1 in derselben Datei-Familie zutage gefördert hat.
   Der erste Umbau, der sie anfasst, hat nichts, was ihn aufhält.
2. **Sicherheit, kleiner: V-07.** Der milde Dialogtext bei einer `.lnk` aus dem Altbestand ist
   keine Lücke — die Hülle weist ab —, aber er gewöhnt den Benutzer daran, bei einer Umleitung
   dasselbe zu lesen wie bei einer harmlosen PDF. Die Rückfrage lebt davon, dass ihr Wortlaut
   wechselt.
3. **V-02 ist ein Prozessrisiko mit Sicherheitsanstrich.** Ein Satz im Code, der eine
   Datenschutzgrenze behauptet, die keine ist, wird beim nächsten Lesen zur Begründung, etwas
   nicht zu bauen — oder, schlimmer, zur Begründung, etwas anderes für gleich sicher zu halten.
4. **Kundendaten:** Mit dem Vermerk in der globalen Suche (C-22 Punkt 6) erscheint interner Text
   künftig in einer Fläche, die über jeder Ansicht liegt und mit `Strg + K` von überall aufgeht.
   A-7.2 ist davon nicht berührt (der Export bleibt zu), aber es ist eine neue Sichtbarkeit, und
   sie gehört benannt, bevor sie gebaut wird — siehe offene Frage 2.
5. **Keine echten Call-Nummern, keine Kundendaten, keine Zugangsdaten** in diesem Bericht; alle
   Beispielwerte stammen aus vorhandenen Berichten und aus `example.org`.

---

## 9. Offene Fragen an den Orchestrator

1. **Wird V-01 vor oder mit der Freigabe von Abschnitt 19 erledigt?** Ich halte es für
   blockierend, aber die Aufgabe liegt bei unit-tester (O-CK) und der Windows-Läufer aus A-A-10
   bei niemandem. Wenn Abschnitt 19 vor V-01 freigegeben werden soll, braucht das eine
   Entscheidung und keine Welle.
2. **Soll die globale Suche im Vermerk einen Textausschnitt zeigen oder nur die Herkunft
   nennen?** „Vermerk enthält den Suchbegriff" ohne Ausschnitt ist weniger nützlich und weniger
   sichtbar; ein Ausschnitt ist nützlicher und legt internen Text in eine Fläche über jeder
   Ansicht. Ich neige zum Ausschnitt mit `<Foreign>`, aber das ist eine Produktentscheidung und
   keine Reviewfeststellung.
3. **Nimmt die Add-in-Tür eine Frist in der Vergangenheit an?** T-149 fragt es (offene Frage 2),
   und ich stimme seiner Neigung zu: Eine verstrichene Frist ist eine Tatsache, kein
   Eingabefehler — `dueState` nennt sie „überfällig", und genau dafür gibt es den Zustand. Wenn
   das eine Zusage sein soll, gehört sie nach `decisions.md`; heute steht sie nirgends.
4. **Wandert die Begriffstabelle aus T-144 Abschnitt 8.5 in den documenter?** Falls ja, muss die
   Zeile „im Satz ‚Überfällig seit N Tagen'" vorher gestrichen werden (4.1) — sonst dokumentiert
   der Bestand einen Wortlaut, den er bewusst nicht gebaut hat.
5. **`DeadlineFlag` gegen `dueDate` (T-147 offene Frage 6).** Aus meiner Sicht sprachlich
   folgerichtig wäre `DueDateFlag`/`.duedate`, weil der Bestand sonst zwei Wörter für dieselbe
   Sache führt. Sachlich ist es folgenlos, und ich würde es nicht in diese Welle nehmen — aber
   entschieden gehört es, bevor eine dritte Datei entsteht.

---

## 10. Nächster Schritt

1. **In dieser Welle, blockierend:** V-02 (eine Streichung, frontend-dev, gehört an den Anfang
   des C-22-Baus), V-05 und V-06 (je eine Abhängigkeitsliste, frontend-dev), V-03 (einmal in
   `Primitives.tsx#Field`, integration-dev).
2. **Parallel, blockierend, fremde Welle:** V-01 an unit-tester (O-CK), plus die Teilung von
   TP-ANH-20 an e2e-tester.
3. **C-22 als eigene Aufgabe**, nicht als Zeile in einer anderen: Punkt 1 und 2 der
   Abnahmebedingung sind domain-dev, 3 bis 6 frontend-dev, und ohne Punkt 2 (Herkunft in der
   Antwort) baut die Oberfläche zwangsläufig wieder nach Objektart.
4. **Danach:** V-04, V-07 bis V-11 in einer gemeinsamen Nachlese — es sind wenige genug, dass
   eine Aufgabe sie fasst, und derselbe Rat, den R-2, R-2a und T-116 für die O-Q-Reste gegeben
   haben.
5. **Zuletzt:** documenter über `glossar.md`, `benutzerhandbuch.md:497` und `606-607` sowie
   `docs/testplan.md` TP-FRIST-08 und TP-ANH-20 — erst wenn 1 bis 3 stehen, sonst dokumentiert er
   einen Zwischenstand.
