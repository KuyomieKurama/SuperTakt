# T-118 — Auflage 3 und die Befunde der Reviewer in der Oberfläche

Aufgabe: T-118 — Auflage 3 und die Befunde der Reviewer in der Oberfläche
Status: fertig
Rolle: frontend-dev
Stand: Branch `status-als-regelterm`, Basis `121bf05`

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/web/design/DESIGNSYSTEM.md` | **Auflage 3 (B-8)**: Kartenverschieben entfernt, die zwei verbliebenen Ziehflächen benannt; dazu `--shadow-drag`, `--z-drag`, „Statusspalten des Boards“ und die neue Bildschirmgrenze in Abschnitt 5.1 |
| `apps/web/src/app/TimerContext.tsx` | **B-1**: `setConflict(null)` vor den Netzumlauf gezogen; Startfehler geht in eine Meldung. Dazu der Leistungshinweis aus `labels.ts` |
| `apps/web/src/app/ToastContext.tsx` | **B-2** (Rollen ans Ende), **T-115-Risiko** (Frist je Meldung statt je Stapel), Maß des Kommentars an `evict` |
| `apps/web/src/styles/app.css` | **B-2**: `.toast-layer` als Rollfläche mit `max-block-size: 100dvh`, Abstand von außen nach innen |
| `apps/web/src/screens/TodoListScreen.tsx` | **B-6**: Rückweg mit `catch` und Bestätigung, jetzt aus `undoDone.ts` |
| `apps/web/src/app/undoDone.ts` | **neu** — **B-6/B-7**: der Rückweg aus „Erledigt“ in einer Fassung für alle drei Flächen |
| `apps/web/src/screens/BoardScreen.tsx`, `TodoDetailScreen.tsx` | **B-7**: derselbe Rückweg auf Board und Detailansicht |
| `apps/web/src/api/types.ts`, `apps/web/src/lib/movement.ts` | **T-115**: zwei Kommentare, die etwas anderes behaupteten als der Code tut |
| `apps/web/src/app/App.tsx` | B-6-Klasse: `connect()` bekommt seinen `catch`, sonst hängt der Start für immer im Ladebild |
| `apps/web/src/components/ConfirmDialog.tsx` | **B-5**: neue Eigenschaft `refusal` mit dauerhafter, anfangs leerer `role="status"`-Region |
| `apps/web/src/screens/TagsScreen.tsx`, `StatusSettings.tsx` | **B-5**: Absage des Dienstes von `consequence` nach `refusal`; dazu **B-10** („Als Spalte aufnehmen“) |
| `apps/web/src/screens/BookingDialogs.tsx`, `apps/web/src/lib/labels.ts` | **B-4**: der Hinweis „Die Leistung darf leer bleiben …“ auch im Dialog „Zeit von Hand erfassen“, Wortlaut einmal in `labels.ts` |
| `apps/web/src/showcase/FoundationsSection.tsx`, `TagsSection.tsx`, `apps/web/src/components/TagInput.tsx` | B-8 und **B-10**: „Karte am Zeiger“ → „gezogenes Element“, „Poolregel“ → „Regelformular“ / „Regel eines Pools“ |
| `packages/ui-tokens/tokens.css` | Kommentar an `--z-drag` (nur Kommentar, kein Wert) |

Nicht angefasst: `apps/web/test/**`, `tests/e2e/**`, fremde Hoheiten.

---

## Zusammenfassung

Auflage 3 ist erledigt: Das Designsystem beschreibt kein Verschieben von Karten mehr, sondern
die zwei Ziehbewegungen, die es seit E-054 noch gibt (Tag in Ordner, Feld der Exportvorlage),
je mit ihrer Tastaturalternative — und sagt in einem eigenen Absatz, warum es auf dem Board
keine gibt. B-1 ist an der Ursache behoben und im Browser gemessen: Mit der alten Reihenfolge
gab es genau **ein** Bild, in dem die Stopp-Meldung hinter der Abdunklung stand, mit der neuen
keines; ein danach scheiternder Start meldet jetzt „Gebucht, aber der Timer … ließ sich nicht
starten“ statt den Stopp hinter einer Fehlerzeile verschwinden zu lassen. B-2 ist gebaut wie
vorgeschlagen (Punkte 1 und 2, kein `column-reverse`, kein `tabindex`): Der Stapel endet am
Bildschirmrand, rollt nach jeder Meldung ans Ende, und der Fokus auf dem „Rückgängig“ der
ältesten von zehn Meldungen holt sie sichtbar zurück. B-6, B-7, B-5, B-4 und B-10 sind mit
erledigt, ebenso beide Kommentarbefunde aus T-115 und das Risiko an der Achtsekundenfrist —
letzteres mit Messung des Vorher- und des Nachherzustands, damit der e2e-tester weiß, was
nachzuziehen ist.

---

## 1. Auflage 3 — B-8, das Designsystem (`DESIGNSYSTEM.md`)

**Was falsch dastand.** Zeile 603 der Tastaturtabelle: „Kanban | Strg+Pfeil links/rechts
verschiebt die Karte“. Und der Absatz zu SC 2.5.7: „Takt löst das doppelt — über „Verschieben
nach …“ im Kartenmenü und über Strg+Pfeil.“ Beides gibt es seit E-054 nicht (`Kanban.tsx`,
`BoardScreen.tsx` sagen das in ihren Kopfkommentaren ausdrücklich). Doppelt unglücklich, wie
T-116 schreibt: Der Absatz warnte vor SC 2.5.7 an der einen Stelle **ohne** Ziehen und schwieg
über die zwei **mit**.

**Was jetzt dasteht.**

- Die Tastaturtabelle hat statt der einen falschen Kanban-Zeile drei richtige: Kanban (kein
  Verschieben, kein Sondertastenkürzel, Karte über Tabulator, Kartenmenü), Tag-Baum (Ziehen
  oder auswählen + „Verschieben“), Exportvorlage (Ziehen oder Pfeilknöpfe an der Feldzeile).
- Der SC-2.5.7-Absatz ist eine **Tabelle der zwei Ziehbewegungen mit ihrer Alternative**, gefolgt
  von einem Absatz „Auf dem Kanban-Board wird nichts mehr gezogen“ mit der Begründung aus E-054
  und E-055 und dem Hinweis, wo der Status stattdessen geändert wird. Die Schlusszeile „wer eine
  dritte Ziehbewegung einführt, trägt sie in die Tabelle ein“ ersetzt den alten Klammerzusatz,
  der die zwei bestehenden noch als hypothetisch führte.

**Drei weitere Stellen derselben Klasse mitgenommen**, weil der Dokumentierer die Datei ganz
liest:

- Abschnitt 4.3: `--shadow-drag` hieß „Karte am Zeiger“. Der Schatten ist heute **von keiner
  Fläche belegt** (`grep` über `apps/web/src/styles/**`: keine Fundstelle) — das steht jetzt da,
  samt der Auszeichnungen, die die zwei verbliebenen Ziehflächen tatsächlich benutzen
  (`.tree__item--dragging`, `.tfield--dragging`, `.tfield--drop`). Dieselbe Beschriftung in
  `showcase/FoundationsSection.tsx` und der Kommentar an `--z-drag` in `tokens.css` sind
  nachgezogen.
- Abschnitt 3.4: „Die Statusspalten des Boards sind frei definierbar“ → „Die Spalten des Boards
  … seit E-054 als **Regel** über fünf Achsen und nicht mehr als Statuswert“.
- Abschnitt 5.1: die neue Bildschirmgrenze aus B-2, mit der Messtabelle (siehe unten).

---

## 2. B-1 — die Meldung, die hinter der Abdunklung entstand

**Der Befund, nachgerechnet.** In `confirmSwitch` zeigte `performStop` die Meldung „Zeit gebucht
auf „X“.“, danach folgte `await startTimer(...)` — ein Netzumlauf — und erst dessen Antwort rief
`setConflict(null)`. Seit T-110 tritt der Stapel hinter die Abdunklung, solange ein Dialog steht:
Die Meldung entstand also abgedunkelt, mit `pointer-events: none`, außerhalb des
`aria-modal="true"`, und ihre Achtsekundenfrist lief dabei.

**Was gebaut ist.** Drei Schritte statt eines `try`:

1. `await performStop(conflictNote)` — sein Fehler geht weiterhin in `dialogError`. Bis hierher
   hat sich nichts geändert, kein Timer ist beendet, und der Dialog ist die Stelle, an der der
   Benutzer eben „Wechseln“ gedrückt hat.
2. `setConflict(null)` und `setBusy(false)` **unmittelbar danach** — ohne dazwischenliegendes
   `await`.
3. `await startTimer(...)`. Scheitert er, meldet der Stapel: „Gebucht, aber der Timer auf „X“
   ließ sich nicht starten“ mit dem Rumpf „Die Zeit des vorigen Timers ist gebucht — daran ändert
   das nichts. …“. Das ist die ehrlichere Auskunft, und sie steht **zuerst**: Der Stopp ist
   geschehen.

**Gemessen, nicht behauptet** (E-062). Ich habe eine Wegwerf-Seite unter `apps/web` gebaut (nach
der Messung gelöscht), die beide Reihenfolgen mit demselben React 19 aus diesem Arbeitsbereich
fährt und in einem `useEffect` ohne Abhängigkeitsliste **jede Zeichnung** protokolliert:

```
alt  [{scrim:true,toasts:0},{scrim:true,toasts:1},{scrim:false,toasts:1}]
     => Bilder mit Meldung hinter der Abdunklung: 1
neu  [{scrim:true,toasts:0},{scrim:false,toasts:1}]
     => Bilder mit Meldung hinter der Abdunklung: 0
```

Der Grund, dass es keine Zwischenzeichnung mehr gibt, ist nicht Glück: Zwischen `toasts.show`
(im Inneren von `performStop`) und `setConflict(null)` liegen ausschließlich
Mikroaufgaben — die Auflösungen der `await`-Ketten. React plant eine Zeichnung der Vorgabestufe
über den Planer (`MessageChannel`), also als **Makro**aufgabe; die Mikroaufgabenschlange ist da
längst leer. Beide Zustandsänderungen fallen deshalb in dieselbe Zeichnung. Der alte Fall hatte
mit `await startTimer(...)` genau eine Makroaufgabe dazwischen — und darum ein Bild.

---

## 3. B-2 — die Bildschirmgrenze des Meldungsstapels

Gebaut sind **Punkt 1 und 2** aus T-110, Abschnitt 3; Punkt 3 (`column-reverse`) nicht, und
**kein `tabindex`** an der Rollfläche.

**Warum Innenabstand statt Abstand von außen.** Eine Rollfläche schneidet an ihrer Kante ab —
mit `inset-*: var(--space-4)` wäre der Schatten jeder Meldung an allen vier Seiten beschnitten
worden. `.toast-layer` sitzt jetzt mit `inset: 0` in der Ecke und trägt denselben Abstand als
`padding`; `box-sizing: border-box` sorgt dafür, dass `100dvh` die Höhe einschließlich beider
Abstände meint. **Gemessen, dass sich dadurch nichts verschiebt** (Chromium, 1280×720, echte
Stilblätter, drei Meldungen):

| | `left` | `right` | `bottom` | `top` der ältesten | Breite |
|---|---|---|---|---|---|
| alt (vor T-118) | 852 | 1260 | 710 | 244 | 408 |
| neu (T-118) | 852 | 1260 | 710 | 244 | 408 |

**Die Grenze selbst**, dieselbe Messung, 1 bis 10 Meldungen mit Rückweg:

| Meldungen | Stapel | oberer Rand | rollbar | `scrollTop` | unterer Rand der jüngsten |
|---|---|---|---|---|---|
| 4 | 629 px | 59 | nein | 0 | 710 |
| 5 | 789 px | **0** | ja | 101 | 710 |
| 7 | 1107 px | 0 | ja | 419 | 711 |
| 10 | 1585 px | 0 | ja | 897 | 710 |

Vorher verließ ab der siebten Meldung die älteste das Fenster (`top` = −103 bis −876). Jetzt
bleibt der Behälter im Fenster, die **jüngste** ist immer ganz sichtbar (unterer Rand ≤ 720), und
die älteste ist über den Rollweg erreichbar.

**SC 2.4.7, der eigentliche Punkt.** `document.querySelector('[data-undo="1"]').focus()` bei zehn
stehenden Meldungen: Der Browser rollt den Behälter von 897 auf 0 zurück, der Knopf steht danach
bei y = 130…158, vollständig im Fenster, mit sichtbarem Fokusring (Bildschirmfoto abgelegt). Es
braucht dafür kein `tabindex` an der Region — der Schließknopf jeder Meldung ist der Halt, und
ein Halt an einer `aria-live`-Region wäre einer, an dem nichts zu tun ist.

**Rollen ans Ende** steht in `ToastProvider` als `useLayoutEffect` über `[toasts]`
(`element.scrollTop = element.scrollHeight`) — vor der Zeichnung, sonst gäbe es ein Bild ohne die
neue Meldung.

**Der Satz „der einzige Schutz“** in `evict` ist auf sein Maß gebracht: „Erledigt“ ist an drei
Flächen von Hand umkehrbar, und die Gegenhandlung zu „Vom Board nehmen“ steht dauerhaft in der
Regelliste. Der Rückweg im Toast ist die **bequeme** Umkehr; geschützt bleibt er, weil eine
Umkehr, die still verschwindet, während man sie liest, in genau dem Augenblick fehlt, in dem man
sie gehen wollte.

---

## 4. B-6 und B-7 — der Rückweg aus „Erledigt“

`TodoListScreen.tsx:218` war `void clearTodoDone(todo.id).then(bump)`: kein `catch`, keine
Bestätigung. Beides ist behoben, und weil B-7 denselben Rückweg an zwei weiteren Flächen
verlangt, steht er jetzt **einmal** in `apps/web/src/app/undoDone.ts` und wird von der Todo-Liste,
dem Board und der Detailansicht aufgerufen. Titel `„X“ ist wieder offen.`, Rumpf „Das Abhaken ist
zurückgenommen. Tags und Status ändern sich dadurch nicht.“ plus Bewegungssatz mit `cleared: true`
(Anlass `'reopen'`); im Fehlerfall „Das Zurücknehmen hat nicht geklappt“ — derselbe Wortlaut wie
bei `undoReactivation`.

Die **Gegenrichtung** („wieder offen“) bekommt keinen Rückweg: Sie ist selbst schon die Rücknahme.

Was der Rückweg **nicht** sagt: ob das Todo damit wieder in der gerade sichtbaren Liste steht. Das
hängt an „Erledigte einblenden“, und dieser Wert kann zwischen dem Anzeigen der Meldung und dem
Klick ein anderer geworden sein. Lieber eine Auskunft weniger als eine, die zwei Sekunden alt ist.

### Weitere Stellen derselben Klasse — gesucht und benannt

Ich habe alle `void …`-Anweisungen in `apps/web/src` durchgesehen (Skript im Kratzverzeichnis,
Ergebnis von Hand nachgeprüft). `useMutation.run` fängt, `useAsync` benutzt die
zweiargumentige Form von `then`, die Massenrücknahme in `BookingsScreen` fängt je Buchung. Übrig
bleiben vier:

| Stelle | Bewertung | Erledigt |
|---|---|---|
| `TodoListScreen.tsx:218` | der Befund B-6 | **ja** |
| `App.tsx:101` `connect()` | `connect()` fängt heute alles, was es kennt — aber `setState({kind:"connecting"})` steht schon da. Eine ungefangene Absage ließe Takt **für immer** im Ladebild stehen, ohne Meldung und ohne „Erneut versuchen“ | **ja**, `catch` → `kind: "failed"` |
| `App.tsx:250` `void quitApplication()` | „Takt beenden“ ist nach E-036 der **einzige** Ausgang aus der Sperrmeldung. Scheitert der Aufruf, geschieht nichts. Eine Meldung hilft dort nicht: Der Stapel liegt seit T-110 hinter der Abdunklung. Die Auskunft gehört in `ServiceStoppedPanel` selbst und braucht dort einen Zustand | **nein**, siehe Offene Frage 2 |
| `ExportDirectoryField.tsx:281` `isShellPresent()` | scheitert praktisch nicht (`loadShell` fängt); im Fehlerfall fällt das Feld auf die Texteingabe zurück, also der sichere Ausgang | **nein**, nur benannt |

Einen globalen Auffänger (`unhandledrejection`) habe ich **nicht** gebaut — siehe Offene Frage 1.

---

## 5. T-115 — die zwei Kommentare

- **`api/types.ts`** nannte als Rechnung `bookingMovementStates`; benutzt wird
  `closedEntryMovementStates`. Berichtigt, und mit dem Halbsatz aus `usecases/timer.ts` versehen:
  Die Buchung von Hand hebt „Erledigt“ nicht auf (A-2.5 spricht vom **Starten** der
  Zeiterfassung), mit `BOOKING_EFFECT` meldete die Route für ein erledigtes Todo ein Verlassen
  jeder `completion: 'done'`-Spalte, das nicht stattfindet. Dass der Klammerausdruck aus der
  Erstfassung des E-061-Nachtrags stammt und T-107 ihn richtiggestellt hat, steht jetzt dabei.
- **`lib/movement.ts`**: die Zuordnungstabelle hat die fehlende Zeile
  `| POST /time-entries | 'booking' | Die Buchung von Hand kann die erste sein (O-V) |`, und
  „Beide Antworten“ ist „Alle drei Antworten“ mit der Nennung des dritten Aufrufers
  (`screens/BookingDialogs.tsx`). Der Absatz darüber, der die vier Stellen vor T-102 zählt, zählt
  jetzt fünf.

---

## 6. Risiko aus T-115 — die Achtsekundenfrist, und was der e2e-Test braucht

**Gebaut.** `ToastItem` bekommt das stabile `dismiss` und die eigene `id` statt eines bei jeder
Zeichnung neuen Abschlusses; die Abhängigkeiten sind `[hasAction, id, onDismiss]` und stehen für
die Lebensdauer der Meldung fest.

**Gemessen** (im Browser, echte Bausteine bzw. zeichengleiche Nachbildung der alten Verdrahtung;
Meldung A bei t = 0, B bei t = 2 s, C bei t = 4 s, keine mit Rückweg):

| | A steht bei t = 8,4 s | Stapel bei t = 8,4 s | Stapel bei t = 12,6 s |
|---|---|---|---|
| alt | **ja** | 3 | 0 |
| neu | nein | 2 | 0 |

Vorher lief die Frist **aller** stehenden Meldungen bei jeder Änderung am Stapel neu; Regel 1 im
Dateikopf galt in Wahrheit als „acht Sekunden nach der letzten Änderung am Stapel“. Wer im
Sekundentakt arbeitet, sah seine erste Meldung nie verschwinden.

### Was der e2e-Test nachzuziehen hat (`tests/e2e/toast-eviction.spec.ts` — e2e-tester, nicht ich)

Betroffen sind **zwei** Zusicherungen, beide aus demselben Grund:

- `:84` `await expect(page.locator('.toast')).toHaveCount(4)`
- die Schleife darunter, „Die drei jüngeren ohne Aktion stehen noch“ (`todos.slice(1)`)

**Warum.** Der Fall löst eine Meldung mit Rückweg und vier ohne aus und wartet zwischen den vieren
je auf `toBeVisible()`. Die erste „ist erledigt“-Meldung verschwindet weiterhin durch **Verdrängung**
(`evict`, `MAX_TOASTS = 4`) — daran ändert der Fix nichts, der Kern des Falls bleibt gültig. Neu ist
die **Uhr**: Bis T-118 wurde die Frist der zweiten und dritten Meldung bei jeder weiteren Auslösung
zurückgesetzt, also konnte zwischen ihrer Entstehung und der letzten Zusicherung beliebig viel Zeit
vergehen. Jetzt läuft ihre Frist ab ihrer eigenen Entstehung: Braucht der Abschnitt von der Anzeige
der **zweiten** „ist erledigt“-Meldung bis zur letzten Zusicherung mehr als **acht Sekunden**
(zwei Menüklicks, zwei `toBeVisible()`, fünf `expect`, ein Klick auf „Meldung schließen“), fällt
sie von selbst weg und der Zähler steht auf 3.

**Mein Vorschlag, in dieser Reihenfolge:**

1. `await page.clock.install()` vor `gotoBoard`, danach `page.clock.pauseAt(...)`. Dann feuert
   `setTimeout` überhaupt nicht, und der Fall misst ausschließlich die Verdrängung — genau das,
   was er heißt. Das ist die Fassung, die auch bei einem langsamen ersten Lauf trägt.
2. Ersatzweise: die vier Meldungen ohne Zwischenwarten auslösen und erst danach prüfen. Billiger,
   gibt aber die feste Reihenfolge im Stapel auf, die der Kommentar dort ausdrücklich haben will.

Ein **eigener** Fall für die Frist wäre neu und nützlich: eine Meldung ohne Rückweg auslösen,
`page.clock.fastForward('00:09')`, erwarten, dass sie weg ist — und zwischendurch eine zweite
auslösen, die sie nicht verlängert. Der Vorher-Zustand aus der Tabelle oben ist die Vorlage.

---

## 7. B-4, B-7, B-5, B-10 — die Nacharbeit

- **B-4.** Der Hinweis „Die Leistung darf leer bleiben. Dann ist die Buchung erfasst, aber die
  Tagesgruppe dieses Todos geht ohne Text nicht in den Export …“ steht jetzt als
  `BILLING_NOTE_MAY_BE_EMPTY` in `lib/labels.ts` und wird vom Stoppdialog **und** vom Dialog
  „Zeit von Hand erfassen“ benutzt — keine zweite Abschrift (Regel 8 des Designsystems). Er steht
  auch beim **Ändern** einer Buchung: Wer die Leistung dort leert, erzeugt denselben Zustand; ein
  Hinweis nur an einem der beiden Ausgänge wäre derselbe Fehler eine Ebene tiefer. Die Warnung im
  Toast bleibt wie von T-116 vorgesehen an O-Y hängen.
- **B-5.** `ConfirmDialog` hat die neue Eigenschaft `refusal`. Ist sie gesetzt, tritt sie an die
  Stelle der Vorwarnung (zwei Kästen, von denen einer nicht mehr gilt, wären schlechter als
  einer) und steht in einer `role="status"`-Region. **Die Region steht vom Öffnen an da, leer** —
  ein `role="status"`, das erst zusammen mit seinem Inhalt in den Baum kommt, wird von vielen
  Vorlesehilfen nicht angesagt, weil sie die Region in dem Augenblick noch nicht kennen. Die
  Vorwarnung bleibt außerhalb, sonst würde sie beim Öffnen zweimal vorgelesen (die Auflage aus
  B-5: „nicht dauerhaft“). Im Browser nachgemessen: leere Region 0 px hoch, Höhe des
  Dialogkörpers unverändert, genau ein `.dialog__consequence`. Umgestellt sind die zwei
  Aufrufstellen, die eine Absage führen — `TagsScreen` (Tag/Ordner) und `StatusSettings` (Status,
  alle drei Fassungen).
- **B-10.** „Auf das Board“ → „Als Spalte aufnehmen“ (`TagsScreen`), damit beide Flächen dasselbe
  Wort tragen. „Poolregel“ → „Regelformular“ (Musterseite) bzw. „Regel eines Pools“
  (`TagInput`-Kommentar).

---

## Annahmen

1. **B-1: `setConflict(null)` nach dem Stopp, nicht davor.** T-116 schlägt „vor `await
   startTimer`“ vor; ich habe es unmittelbar hinter `await performStop` gesetzt, weil die Meldung
   dort entsteht und nicht erst danach. Der Fehler des **Stopps** bleibt damit im Dialog — das ist
   die Hälfte, die T-116 nicht ausdrücklich verlangt, aber offenlässt, und sie ist die bessere:
   Bis dahin hat sich nichts geändert.
2. **B-5: `refusal` statt `consequenceIsStatus`.** T-116 stellt beides frei. Ein zweites Feld
   sagt, *was* es ist; ein Wahrheitswert sagt nur, wie es angesagt wird. Zusätzlich habe ich die
   Live-Region **dauerhaft** gemacht (leer beim Öffnen) statt sie mit dem Inhalt einzuhängen — das
   ist die Fassung, die bei den meisten Vorlesehilfen tatsächlich ansagt.
3. **B-6/B-7 in einer Datei.** Der Rückweg an drei Flächen aus drei Abschriften wären drei
   Gelegenheiten, die nächste Auflage nur an zweien nachzuziehen. `app/undoDone.ts` gibt das
   `ToastAction`-Objekt zurück; die Ansicht entscheidet weiterhin, ob es eines gibt.
4. **B-8 über die genannten zwei Stellen hinaus.** `--shadow-drag`, `--z-drag` und „Statusspalten
   des Boards“ sind derselbe Fehler an anderer Stelle, und der Dokumentierer liest die Datei ganz.
   Kein Wert geändert, nur Beschriftungen und Kommentare.
5. **B-4 auch im Änderungsfall des Buchungsdialogs**, siehe oben.
6. **B-12 (`inert`) nicht gebaut**, siehe Risiken.

---

## Risiken

1. **B-12 bleibt offen, und ich halte das für richtig.** `inert` auf `.toast-layer` wäre ein
   Riegel statt zweier — es nähme aber auch die **Ansage**: Ein `aria-live` in einem inerten
   Teilbaum meldet nicht mehr. Nach B-1 entsteht zwar keine Meldung mehr hinter einer Abdunklung,
   aber diese Zusicherung hängt dann an einer Eigenschaft, die kein Test bewacht. T-116 nennt B-12
   ausdrücklich „kein Befund“ und „heute trägt die Fassung“; der Auftrag zählt es nicht auf. Ich
   habe es deshalb nicht gebaut, sondern hier notiert.
2. **`100dvh` ohne dynamische Einheit.** `.toast-layer` trägt `max-block-size: 100vh` und darunter
   `100dvh`. Fehlt einem Wirt die dynamische Einheit, gilt die statische — auf dem Schreibtisch
   derselbe Wert.
3. **Schattenbeschnitt an der Rollkante.** Der Innenabstand ist `var(--space-4)` (16 px), der
   weiche Teil von `--shadow-lg` reicht bis 28 px. Am oberen Rand eines übervollen Stapels wird
   er beschnitten — das ist die Kante der Rollfläche und gewollt. Im Bildschirmfoto nicht
   auffällig.
4. **B-5, zweiter identischer Fehlschlag — geprüft, trägt.** Eine Live-Region sagt nur an, wenn
   sich ihr Inhalt ändert; ein zweimal zeichengleicher Absagetext bliebe stumm. Beide
   Aufrufstellen leeren den Fehler vor dem neuen Versuch (`TagsScreen`, `onConfirm`:
   `setDeleteError(null)`; `StatusSettings`, `remove()`: `setRemoveError(null)`), und zwischen
   dem Leeren und dem Füllen liegt der Netzumlauf — also zwei Zeichnungen und zwei Änderungen.
   Wer eine dritte Aufrufstelle mit `refusal` versieht, muss dasselbe tun.
5. **Sicherheit:** keine. Keine neue Netzlast, kein neuer Speicherzugriff, keine Ausgabe von
   Daten, die vorher nicht auf derselben Fläche stand. Die Fehlermeldung nach einem
   fehlgeschlagenen Start trägt `errorMessage(cause)` wie jede andere Meldung dieser Datei.
6. **Fremde Hoheiten unberührt.** Während dieser Aufgabe war `apps/outlook-addin/src/text/hidden.ts`
   zeitweise nicht übersetzbar (integration-dev arbeitet dort); `pnpm typecheck` bricht deshalb im
   Gesamtlauf ab. Ich habe die Teilläufe einzeln gefahren, siehe Nachweise.

---

## Nachweise

Alle Ausgaben in Dateien umgeleitet, Endstatus abgelesen.

| Befehl | Endstatus |
|---|---|
| `npx tsc -p tsconfig.json --noEmit` | **0** |
| `pnpm --filter @takt/web typecheck` | **0** |
| `pnpm --filter @takt/desktop typecheck` | **0** |
| `npx tsc -p apps/web/tsconfig.test.json` | **0** |
| `npx vitest run apps/web/test` | **0** — 4 Dateien, 63 Prüfungen |
| `pnpm --filter @takt/web build` | **0** |
| `pnpm --filter @takt/web build:designsystem` | **0** |
| `pnpm --filter @takt/web contrast` | **0** — 0 von 432 Paaren durchgefallen |

`pnpm typecheck` als Ganzes bricht derzeit in `apps/outlook-addin` ab (fremde Hoheit, siehe
Risiko 6); die vier Teilläufe darüber decken meinen Anteil vollständig ab.

**Browsermessungen** (E-062, Chromium aus `~/.cache/ms-playwright`, echte Stilblätter bzw. echte
Bausteine; Skripte und Bildschirmfotos im Kratzverzeichnis, nichts davon im Arbeitsbereich):

- Ebenen/Zeichnungen zu B-1: siehe Abschnitt 2.
- Geometrie und Rollverhalten zu B-2 sowie Fokus auf der ältesten Meldung: siehe Abschnitt 3.
- Frist der Meldung, alt gegen neu: siehe Abschnitt 6.
- Musterseite nach dem Bau: keine Konsolenfehler; beide Bestätigungsdialoge mit leerer
  Live-Region 0 px, Dialogkörper unverändert.

Die Wegwerf-Messseite (`apps/web/proof-batching.html`, `apps/web/src/proofBatching.tsx`) ist
gelöscht; `git status` zeigt außer den Artefakten oben nichts unter meiner Hoheit. Kein `commit`,
kein `stash`, kein `checkout`. Ports 17843/17844 waren durchgehend von einem fremden Prozess
belegt und wurden nicht angefasst; gemessen wurde über `file://`, den Entwicklungsserver auf 5173
und die Vorschau auf 4173, beide danach beendet.

---

## Offene Fragen

1. **Soll es einen globalen Auffänger für abgewiesene Zusagen geben?** T-116 stellt bei B-6 fest,
   dass es keinen gibt. Ich habe ihn nicht gebaut: Ein `unhandledrejection`, der eine Meldung
   zeigt, doppelt jede Stelle mit eigenem `catch` bei jeder Absage, die durch zwei Wege läuft, und
   er zeigt technische Texte, die für niemanden geschrieben sind. Als **stiller** Auffänger (nur
   in ein Protokoll) wäre er nützlich — dann braucht es aber erst eine Entscheidung, wohin ein
   Protokoll der Oberfläche schreibt. Ohne die rate ich nicht.
2. **„Takt beenden“ ohne Rückmeldung** (`App.tsx:250`, `ServiceStoppedPanel`). Der Knopf ist der
   einzige Ausgang aus der Sperrmeldung, und ein Fehlschlag ist stumm. Eine Meldung hilft dort
   nicht (der Stapel liegt hinter der Abdunklung); die Auskunft müsste ins Feld selbst, mit einem
   Zustand in `ShellStatus` und einem Wortlaut, der sagt, was der Benutzer dann tun soll
   („Fenster schließen“? „Task-Manager“?). Das ist eine eigene kleine Aufgabe, keine Zeile.
3. **B-11 (`listPools` ausführen)** ist von T-116 bejaht, aber nicht beauftragt: Domain-dev
   exportiert, ich räume die drei Fassungen in `apps/web` ab (`format.ts:306`, `errorText.ts:91`,
   `TodoFormDialog.tsx:30`). Ich habe darauf gewartet statt vorzugreifen — die Funktion gibt es in
   `@takt/domain` noch nicht.
4. **B-2 und der Prototyp.** `docs/prototype/takt-ui-konzept.html` liegt weiterhin nicht vor. Die
   Rollfläche und die Messtabelle stehen in Abschnitt 5.1 des Designsystems, damit sie später
   dagegen abgeglichen werden können.

---

## Nächster Schritt

Der **e2e-tester** zieht `tests/e2e/toast-eviction.spec.ts` nach (Abschnitt 6: `page.clock`
anhalten, dazu ein eigener Fall für die Frist) und legt zwei neue Fälle daneben, die die zwei
Befunde dieser Aufgabe an der laufenden Anwendung festhalten:

- **A-6.8:** Timerwechsel bestätigen — während des Wechsels darf es kein Bild geben, in dem
  `.scrim` und `.toast` gleichzeitig stehen; nach dem Wechsel stehen zwei Meldungen, „Zeit gebucht
  auf „A“.“ und die zum Start auf B.
- **SC 2.4.7:** siebenmal „Erledigt“ in der Todo-Liste, dann `Tab` bis auf das „Rückgängig“ der
  ältesten Meldung — der Knopf muss danach im Fenster liegen (`boundingBox().y >= 0`).

Danach ist aus T-116 nur noch B-3 (Frage an den Auftraggeber), B-9 (domain-dev) und B-11 (zwei
Hoheiten) offen; die drei Auflagen aus Abschnitt 8 sind damit vollständig, und der Dokumentierer
kann laufen.
