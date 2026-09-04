# Takt — Architektur

Stand: 2026-08-31, Aufgabe T-001. Verbindlich für `packages/domain`, `packages/storage` und
`apps/local-api`.

Grundlage: `docs/spec.md`, `.claude/team/decisions.md` (E-001 bis E-014), `.claude/team/risks.md`.
Das Datenmodell steht in `docs/datenmodell.md`, die Schnittstellenbeschreibung des lokalen
Dienstes in `apps/local-api/openapi/takt-local-api.yaml`.

---

## 1. Der Schnitt

E-001 sagt: alles lokal, „zumindest derzeit". Dieses Zusatz wird architektonisch ernst genommen.
Ports und Adapter (hexagonal) sind hier kein Selbstzweck, sondern die einzige Art, den Zusatz
einzulösen, ohne die Fachlogik später umzubauen.

```
   ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐
   │ apps/web    │   │ apps/outlook-    │   │ apps/desktop    │
   │ React       │   │ addin, Office.js │   │ Tauri, Rust     │
   └──────┬──────┘   └────────┬─────────┘   └────────┬────────┘
          │  HTTP             │  HTTP                │  Prozess, Benutzername
          └───────────┬───────┘                      │
                      ▼                              │
        ┌─────────────────────────────────┐          │
        │ apps/local-api  ►  Node-Sidecar │◄─────────┘
        │ EINGEHENDER ADAPTER             │
        │ HTTP, Token, Herkunft, JSON     │
        └───────────────┬─────────────────┘
                        │ ruft Anwendungsfälle mit einfachen Werten
                        ▼
        ┌─────────────────────────────────┐
        │ Anwendungsfälle                 │  Ablauf, Transaktionsgrenze
        │ apps/local-api/src/anwendung/   │
        └───┬─────────────────────────┬───┘
            │ nutzt Ports             │ nutzt Regeln
            ▼                         ▼
   ┌────────────────────┐   ┌────────────────────────┐
   │ packages/storage   │   │ packages/domain        │
   │ PORTS              │   │ KERN                   │
   │ + SQLite-Adapter   │──►│ Typen, reine Regeln    │
   │ AUSGEHEND          │   │ Rundung, Timer, Status │
   └─────────┬──────────┘   └───────────▲────────────┘
             ▼                          │ nur ExportGroup
        ┌─────────┐          ┌──────────┴───────────┐
        │ SQLite  │          │ packages/export      │
        │ Datei   │          │ Vorlagen-Motor       │
        └─────────┘          │ rein, ohne Ports     │
                             └──────────────────────┘
```

Abhängigkeiten zeigen ausschließlich nach innen. `packages/domain` importiert nichts —
keine Fremdbibliothek, kein Node-Modul, kein `packages/storage`.

### 1.1 Wer wen kennen darf

| Paket | Darf importieren | Darf ausdrücklich nicht |
|---|---|---|
| `packages/domain` | nichts | alles andere. Kein `node:*`, kein SQL, kein HTTP, keine Fremdbibliothek |
| `packages/storage` | `@takt/domain`, SQLite-Anbindung, `node:*` | `apps/*`, HTTP-Bibliotheken |
| `packages/export` | **nur** `@takt/domain/export` | `@takt/domain` als Ganzes, `@takt/storage`, `node:fs` |
| `apps/local-api` | alle `packages/*`, HTTP-Bibliothek | direkter SQL-Zugriff am Port vorbei |
| `apps/web`, `apps/outlook-addin` | Typen aus `@takt/domain`, HTTP | `@takt/storage`, `packages/export` |

Die dritte Zeile trägt R-06 und ist die wichtigste. Sie ist mit `dependencies` in den
`package.json`-Dateien durchsetzbar: Wenn `packages/export` `@takt/storage` gar nicht als
Abhängigkeit führt, hat der Vorlagen-Motor keinen Weg zur Datenbank — er kann den internen
Vermerk des Todos nicht lesen, weil er nichts lesen kann. Eintrag beim Orchestrator angemeldet, siehe
Bericht.

### 1.2 Was in welcher Schicht liegt

**`packages/domain` — Kern.** Entitätstypen, Fehlerkatalog, und die Regeln, an denen Geld hängt:
die Rundung (`rounding.ts`), der Exportstatuswechsel und die Timer-Regeln (`time-entry.ts`), die
Zyklusprüfung, die Pool-Ableitung und die Sichtbarkeitsregel (`tag.ts`), die Tagesgruppierung
(`export.ts`). Alle rein: gleiche Eingabe, gleiche Ausgabe, kein Zugriff auf Uhr, Dateisystem,
Netz oder Datenbank. Ohne laufenden Dienst prüfbar, wie es die Definition of Done verlangt.

Seit T-009 steht dort Laufzeitcode und nicht mehr nur der Vertrag. Wo eine Regel wohnt, ist
damit keine Absichtserklärung mehr, sondern nachprüfbar:

| Regel | Ort | Entscheidung |
|---|---|---|
| Aufrunden auf Viertelstunden, Minimum 0,25 | `rounding.ts` → `roundToQuarterHours` | E-008 |
| Viertelstunden → Zahlwert des Feldes `Zeit` | `rounding.ts` → `quarterHoursToExportNumber` | A-8.3 |
| Tagesgruppe je Todo, Tag aus der Startzeit | `export.ts` → `groupExportCandidates` | E-020, E-025 |
| Kalendertag in Ortszeit | `kernel.ts` → `toCalendarDay` | E-025 |
| Exportstatuswechsel, zweiwertig | `time-entry.ts` → `checkExportStatusTransition` | A-6.9, E-012, E-032 |
| Sperre einer exportierten Buchung | `time-entry.ts` → `isLocked` | A-6.9 |
| Höchstens ein Timer, Rückfrage vor dem Stoppen | `time-entry.ts` → `decideTimerStart` | A-6.8 |
| Stopp, Mindestdauer | `time-entry.ts` → `decideTimerStop` | A-6.2, A-6.4 |
| Erledigt aufheben beim Start | `time-entry.ts` → `determineReopen` | A-2.5, E-023 |
| Verwaiste Buchung | `time-entry.ts` → `decideOrphanedTimer` | E-036 |
| Zyklusprüfung beim Verschieben | `tag.ts` → `checkFolderMove` | A-4.6, E-022 |
| Pool-Zugehörigkeit: fünf Achsen, mit „und" verbunden | `tag.ts` → `matchesPool` | A-3.2, A-3.4, T-076 |
| Nennt eine Regel überhaupt eine Bedingung? | `tag.ts` → `poolRuleIsEmpty` | A-3.4, E-055, T-080 |
| Trifft eine Regel von vornherein nichts? | `tag.ts` → `poolRuleMatchesNothing` | A-3.4, E-057, T-082 |
| Zeigt eine Tagachse nach dem Auflösen ins Leere? | `tag.ts` → `tagAxisIsUnresolved` | E-057, T-082 |
| Was eine Regel nach dem Auflösen ergibt | `tag.ts` → `resolvePool` | T-080, E-057 |
| Dieselbe Karte in mehreren Kanban-Spalten | `board.ts` → `boardAppearances` | E-054 |
| Sichtbarkeit erledigter Todos in Pools | `tag.ts` → `isVisibleInPool` | A-2.5, E-039 |
| Standard-Tags beim Anlegen | `tag.ts` → `applyDefaultTags` | A-9.1, A-9.5 |
| Plausibilisierung der Call-Nummer | `call-number.ts` → `checkCallNumber` | E-045, B-4.3, R-15 |
| Der Satz über die Bewegung durch die Pools | `pool-movement.ts` → `poolMovementSentence` | E-056, E-058 |
| Welche Zeichen in einem Namen nichts zu suchen haben | `characters.ts` → `hasForbiddenNameCharacter` | R-3a H-2, E-063 |
| Fremden Text bereinigen und anzeigen | `characters.ts` → `dropHiddenCharacters`, `visibleText` | E-063 |
| Namen deutsch aufzählen: „A“, „A und B“, „A, B und C“ | `enumeration.ts` → `enumerateNames` | E-058 Punkt 4 |

Die Zeile zum Bewegungssatz ist mit T-089 dazugekommen, und sie war die erste der Tabelle, die
keine Fachregel enthält, sondern einen **Text**. Sie steht trotzdem hier und aus demselben Grund wie
alles andere: Der Satz muss an zwei Flächen zeichengleich sein — in der Hauptanwendung und im
Aufgabenbereich des Add-ins —, und er war es auf die schlechte Weise. „Die Karte bleibt, wo sie
ist" stand als Abschrift in beiden und war seit E-055 falsch: Eine Kanban-Spalte ist eine Regel
und entscheidet auch über „Erledigt" und über den Exportstatus, und beides ändert ein Timerstart.
Ein Text, den zwei Flächen gleich sagen müssen, hat genau eine Quelle (E-058).

Die Rechnung dazu — welche Pools ein Todo betritt und verlässt — ist **keine** Domänenfunktion,
sondern ein Anwendungsfall (`apps/local-api/src/usecases/pool-movement.ts`): Sie braucht die
aufgelösten Regeln und damit den Port. Die Entscheidung selbst fällt trotzdem in `matchesPool`;
der Anwendungsfall hält sie nur zweimal gegen dasselbe Todo, einmal für den Zustand davor und
einmal für den danach.

**Der Satz nennt Namen und kein Gattungswort** (E-058 Punkt 4, T-093): „Es erscheint dann wieder
in „Ost“.", nicht „in dem Pool „Ost“". Die drei Listen tragen Namen, aber keine Fläche — und seit
E-054 kann derselbe Name eine Kanban-Spalte bezeichnen, einen Pool oder bei `placement: both`
beides. Eine Funktion, die das Gattungswort setzt, rät. Der Satz ohne jeden Treffer nennt
folgerichtig **beide** Flächen: „… es erscheint danach in keinem Pool und in keiner Spalte."

**Die Bewegung liefert nicht ein Vorgang, sondern jeder, der eine der fünf Achsen einer Regel
umlegt** — die vollzogene Handlung ebenso wie die angekündigte im Aufgabenbereich des Add-ins
(E-058 Punkt 6, E-060, E-061, T-093), jeweils als `poolMovement` oder `null`. Eine benannte
Ausnahme gibt es, und sie steht weiter unten in diesem Abschnitt: `PATCH /time-entries/{id}`.

**Eine Zahl steht hier bewusst nicht**, und auch keine Aufzählung: An dieser Stelle stand erst
„drei", und sie wäre jetzt „acht" — zweimal ist ein Vorgang dazugekommen und hat die Zahl
stehenlassen, wo sie war (B-9 aus T-116). Vollständig geführt wird die Aufzählung an **genau
einer** Stelle, am Bauteil `PoolMovement` in `apps/local-api/openapi/takt-local-api.yaml`; wer
einen Vorgang hinzufügt, hängt dort eine Zeile an. Diese Beschreibung nennt das Kriterium und
zählt nicht mit.

Zwei Wege führen zur ersten abgeschlossenen Buchung, und sie sind ungleich wichtig: Der Timerstart
ist der Sonderweg — er lässt sie nur entstehen, wenn er einen Timer desselben Todos verdrängt. Der
Regelweg ist der Stopp, und dort setzt die erste Buchung „hat offene Buchungen" von falsch auf
wahr; jede Spalte mit `exportState: open` nimmt das Todo damit auf. Wer am Start eine Auskunft
gibt und am Stopp schweigt, sagt die halbe Wahrheit. Gerechnet wird nur, wenn sich etwas bewegt
haben **kann**: Sonst steht `null` da, und keine Ordnerauflösung läuft.

Die Zeile davor ist mit T-021 dazugekommen und hat dieselbe Begründung wie die erste: Die Regel
entscheidet mit, ob das Duplikatangebot aus A-10.9 auf den **richtigen Kundenvorgang** zeigt.
Trifft sie falsch, wird Arbeitszeit auf ein fremdes Todo gebucht und landet auf einer fremden
Rechnung (R-15). Eine Regel, die über Geld entscheidet, existiert einmal und wird aufgerufen,
statt nachgebaut zu werden. Bis T-019 stand sie zweimal — im Add-in als Bedienhilfe, im Dienst
als Vertrauensgrenze — mit einem Wächter dagegen; E-045 hat das aufgelöst.

**Die zweite und dritte Zeile sind mit T-080 dazugekommen, und der Grund ist derselbe.** „Ist
diese Regel leer?" stand zu diesem Zeitpunkt dreimal da: in `matchesPool`, in der Übersetzung
nach SQL (`repo-todos.ts`) und in `apps/web/src/lib/poolRule.ts`, wo der frontend-dev sie
nachbilden musste, weil die Antwort über keine Route kam. Alle drei Fassungen waren richtig, und
genau das war das Gefährliche: Solange sie übereinstimmen, merkt niemand, dass es drei sind.

Jetzt stellt die Frage jeder an derselben Stelle. Die Oberfläche ruft `poolRuleIsEmpty`
unmittelbar auf — auch für den **Entwurf** im Formular, den noch keine Route gesehen hat, und
genau deshalb ist die Antwort **keine** Auskunft des Dienstes geworden: Ein Feld an der Antwort
hätte den gespeicherten Pool beantwortet und den Entwurf nicht, und die Oberfläche hätte für den
Entwurf doch wieder selbst gerechnet.

Was der Aufrufer **nicht** selbst wissen kann, ist die Auflösung der Ordner. Sie steht deshalb
als `resolved` an jeder ausgelieferten Regel (`PoolWithResolution`): zwei Zahlen und vier
Wahrheitswerte. Ohne sie sieht ein Ordner ohne Tags aus wie eine Regel, auf die im Augenblick
nichts passt — und nur der erste Fall ist ein Einrichtungsfehler, der von selbst nie vergeht.

**Die vierte und fünfte Zeile sind mit T-082 dazugekommen, und sie beheben den Befund aus T-080.**
Eine leere Tagmenge galt als Neutralwert der Achse. Ein Ordnerterm über einen leeren Ordner löste
auf die leere Menge auf und **verschwand damit aus der Regel**: „Tags aus Ordner X **und** Status
offen" wurde zu „Status offen", in `matchesPool` wie in der Übersetzung nach SQL. Die Regel traf
mehr, als der Benutzer gesagt hatte — die Richtung, die niemandem auffällt.

Seit E-057 ist ein solcher Term eine **Einschränkung ohne Treffer**: Die Regel trifft nichts,
unabhängig vom Modus und von den übrigen Achsen. Entschieden wird das in
`poolRuleMatchesNothing`, und beide Fassungen der Regel rufen es auf — die Domäne und die
Übersetzung nach SQL, die dafür `0 = 1` setzt. Ausgeschlossene Tags über einen leeren Ordner
schließen dagegen nichts aus; „keiner davon" über nichts lässt in Ruhe.

Gefragt wird **termweise**: Ein leerer Ordner **neben** einem Tagterm bleibt eine Einschränkung
ohne Treffer, obwohl die Achsensumme (`resolved.tagCount`) dann positiv ist. Dafür trägt die
rekursive Auflösung die Wurzel mit, von der sie ausgegangen ist, und die Antwort nennt die leeren
erforderlichen Ordner (`resolved.emptyRuleFolderIds`) — damit die Oberfläche **welcher** sagen
kann, ohne die Ordnerrekursion ein zweites Mal zu schreiben.

Die Absicherung dagegen, dass die beiden wieder auseinanderlaufen, ist der Typ:
`ResolvedPoolRuleAxes` verlangt die Angabe `unresolvedRequired` ohne Vorgabewert, und wer eine
aufgelöste Regel beurteilt, muss sie hersagen. `pnpm proof:openapi` Abschnitt 14 mißt die Folge am
laufenden Dienst — eine Spalte „leerer Ordner **und** Status" bleibt leer, die Gegenprobe mit dem
Ausschluß über denselben Ordner nicht.

**Wodurch das rot wird.** `PoolRuleAxes` zählt die Achsen auf, und die Tabelle darüber ist über
diesen Typ abgebildet: Eine sechste Achse lässt `tsc` in der Domäne, in `packages/storage` und im
Dienst fehlschlagen — gemessen, nicht behauptet. `POOL_RULE_AXIS_OF_FIELD` schließt die
Gegenrichtung: Ein neues Feld an der Regelseite von `matchesPool` verlangt die Angabe, zu welcher
Achse es gehört. Und `pnpm proof:openapi` Abschnitt 13 hält die Aufzählung der Domäne gegen die
Beschreibung, gegen die Eingabeprüfung beider Routen und gegen die ausgelieferten Antworten.

**Die drei letzten Zeilen sind mit T-122 dazugekommen, und sie stehen aus derselben Begründung
hier — eine Ebene tiefer.** Es sind eine Zeichenmenge und eine Aufzählungsform, keine Regeln über
Zeit oder Geld. Beide waren mehrfach im Baum, und beide sind auseinandergelaufen:

- **Die Zeichenklasse** stand an der Tür des Dienstes (`http/input.ts`) und als Abschrift im
  Add-in. T-117 hat die eine um drei Richtungsmarken erweitert, die andere nicht — und der
  Nachweis, der genau das verhindern sollte, prüfte gegen eine kopierte Liste und blieb grün
  (E-063 Punkt 4, gefunden in T-119). Sie liegt jetzt in `characters.ts`; Dienst und Add-in lesen
  sie dort. Denselben Ort teilen sich die drei Behandlungen derselben Menge, weil sie **eine**
  Regel sind und nicht drei: Was der Benutzer eingegeben hat, wird abgewiesen; ein Vorschlag aus
  fremder Quelle wird bereinigt; eine Anzeige markiert (E-063).
- **Die Aufzählung** lag privat in `pool-movement.ts`, also unerreichbar, und war in der
  Hauptanwendung zum dritten Mal nachgebaut. Eine frühere Abschrift hatte bei drei Namen „A und B
  und C" ergeben.

Eine Zeichenklasse in der Domäne ist kein Widerspruch zu E-001: Sie kennt weder HTTP noch SQL. Was
**nicht** mitgezogen ist, ist die Bindung an zod — die bleibt im Dienst, weil sie eine Eigenschaft
der Tür ist und keine der Regel. Dieselbe Grenze gilt in die andere Richtung: Der lokale Dienst
prüft seit T-122 auch den Windows-Benutzernamen aus der `stdin`-Zeile der Hülle gegen diese Klasse
(O-AE). Das ist eine andere Grenze — kein `422`, sondern ein Dienst, der nicht startet —, aber
dieselbe Regel; der Name geht unverändert in die Exportdatei (A-8.5).

**Die eine Ausnahme von der Reinheit, und wie sie eingehegt ist.** `toCalendarDay` braucht eine
Zeitzone, denn der Kalendertag einer Buchung ist der Tag an der Wand des Benutzers und nicht der
in UTC (E-025). Am Abend unterscheiden sich beide, und wer den Datumsanteil des Zeitstempels
abschneidet, legt Abendbuchungen auf den Folgetag — mitsamt der Tagessumme, über die gerundet
wird. Die Zone kommt deshalb aus der Laufzeit, ist aber jeder betroffenen Funktion als Argument
überschreibbar. Damit bleibt die Regel prüfbar, ohne die Umgebung zu verstellen, und es gibt
keine zweite, abweichend eingestellte Zone, die von der Uhr des Rechners abweichen könnte.

Auch die Uhr ist ein Port (`ClockPort`), damit ein Anwendungsfall mit fester Zeit prüfbar ist. Eine
Regel, die `Date.now()` selbst aufruft, ist nicht rein und lässt sich nur mit Zeitmanipulation
prüfen.

**`packages/storage` — Ports und Adapter.** Die Ports beschreiben in der Sprache der Domäne, was
die Anwendungsfälle von der Speicherung brauchen. Kein SQL, kein Dateipfad, kein Treibertyp in
einer Signatur. Der SQLite-Adapter setzt sie um; er ist die einzige Stelle im Projekt, an der
SQL steht.

Seit T-021 steht er. Drei Eigenschaften, die man ihm ansehen soll:

* **`node:sqlite` und keine Fremdbibliothek** (E-035). Der Sidecar wird als eigenständige
  Binärdatei gebündelt (E-044); eine Bibliothek mit nativer Erweiterung müsste je Plattform
  mitgebaut werden. `node:sqlite` liegt in der Laufzeit, die ohnehin mitgeliefert wird — ein Teil
  weniger in der Lieferkette einer Anwendung, die Kundendaten hält.
* **Die Ports geben `Promise` zurück, obwohl `node:sqlite` synchron ist.** Das ist kein Versehen:
  Ein späterer Adapter gegen einen Dienst wäre zwangsläufig asynchron, und wäre die Portfläche
  synchron, müsste bei einem Wechsel jeder Aufrufer umgeschrieben werden (E-001, „zumindest
  derzeit"). Die Folge ist, dass zwischen zwei `await` in einer offenen Transaktion eine andere
  Anfrage bedient werden könnte — deshalb **reiht** `createTransactionPort` die Transaktionen.
  Zwei laufen nie gleichzeitig. Für einen Einbenutzerdienst ist das kein Engpass; ohne die Reihung
  läge der Schreibvorgang einer zweiten Anfrage in fremder Klammer und ein `ROLLBACK` nähme ihn
  mit.

  Die Reihung hat eine Kehrseite, die benannt gehört (T-029): Wer aus einer **laufenden**
  Transaktion heraus dieselbe Klammer erneut öffnet, würde sich in die Warteschlange hinter sich
  selbst stellen — ein Ring ohne Ende. Verschachtelte Aufrufe sind deshalb unzulässig, und der
  Wächter dagegen steht **vor** der Warteschlange, nicht dahinter: `inTransaction` fragt den
  asynchronen Aufrufzusammenhang (`AsyncLocalStorage`) und weist den Aufruf mit einem Fehler ab.
  Ein bloßes „läuft gerade eine Transaktion?" genügt dafür nicht — es träfe auch die zweite,
  unabhängige Anfrage, die zulässig ist und nur warten soll. Unterschieden werden muss
  „von innerhalb" von „gleichzeitig, aber von außen"; genau diese Auskunft gibt der
  Aufrufzusammenhang.
* **Jeder Wert geht als Parameter.** Es gibt in dem Paket genau eine Stelle, an der SQL
  zusammengesetzt wird, und zusammengesetzt wird ausschließlich aus Fragezeichen
  (`placeholders()`). Kein Wert aus einer Anfrage berührt je den SQL-Text.

**`apps/local-api` — eingehender Adapter und Anwendungsfälle.** Der HTTP-Teil übersetzt Anfragen
in einfache Werte, prüft das Token und bildet Fehler auf Statuscodes ab. Die Anwendungsfälle
darunter kennen kein `Request` und kein `Response`; sie öffnen die Transaktionsgrenze und
verknüpfen Regeln mit Ports.

Die Trennung ist im Quelltext gehalten und nicht bloß vereinbart: **Kein Modul unter
`src/usecases/` bindet `hono` ein.** Ein Anwendungsfall bekommt Werte und liefert Werte; er kennt
weder Anfrage noch Antwort noch Statuscode. Wer das ändert, sieht es an einem neuen Import in
einem Verzeichnis, in dem sonst keiner steht. Umgekehrt enthält keine Datei unter `src/routes/`
eine Fachregel — sie liest die Anfrage, prüft ihre Gestalt, ruft einen Anwendungsfall und
übersetzt dessen Ergebnis.

Die Anwendungsfälle liegen in der Anwendung und nicht in einem eigenen Paket, weil ein neues
Paket im Arbeitsbereich registriert werden muss und der Dienst der einzige Aufrufer ist. Fällt
das „zumindest derzeit" aus E-001, ist der Umzug eine Verschiebung ohne Umbau: Sie hängen an
Ports, nicht an Adaptern.

Das **Zugriffsverfahren** liegt vollständig hier, in `src/access/` und `src/http/`, und nicht in
`packages/domain`. Begründung: Herkunft, Kopfzeilen und Vorabanfragen sind HTTP, und die Domäne
kennt kein HTTP. Die Entscheidungsteile sind trotzdem rein — `verifier.ts`, `origin-policy.ts`
und `throttle.ts` nehmen Zeichenketten und Zustand entgegen und geben eine Entscheidung zurück,
ohne Uhr, Datei oder Netz. Nur `crypto.ts` (Zufall, SHA-256, zeitkonstanter Vergleich) und
`token-store.ts` (Datei) sind Adapter, und beide hängen an einem Port.

### 1.3 Zusammenbau an genau einer Stelle

Alle Adapter werden in einer einzigen Datei erzeugt und in die Anwendungsfälle gereicht
(`apps/local-api/src/composition.ts`). Kein Dienstsucher, keine versteckten Einzelstücke. Wer
wissen will, was der Dienst wirklich anspricht, liest eine Datei.

Für Tests wird derselbe Zusammenbau mit Attrappen der Ports aufgerufen. Ein Anwendungsfall lässt
sich damit ohne Datenbank prüfen.

---

## 2. Warum die Fachlogik nicht in der Hülle liegt

Tauri hat keinen Node-Prozess (E-004). Zwei Wege wären denkbar gewesen:

1. Fachlogik in Rust, Add-in spricht Rust an. Dann existierten Rundung und Exportformat zweimal
   — einmal in Rust für die Hülle, einmal in TypeScript für Oberfläche und Add-in. Bei einer
   Rundungsregel, an der Geld hängt, ist eine zweite Fassung die schlechteste denkbare
   Verdopplung.
2. Node-Sidecar, den die Hülle startet und beendet. Ein Datenpfad für alle Clients.

Gewählt wurde 2 (E-004). Der Rust-Anteil bleibt dünn: Fenster, Menü, Lebenszyklus des Sidecars,
Windows-Benutzername.

**Preis, benannt:** Ein auf `127.0.0.1` lauschender Dienst ist für jeden Prozess auf dem Rechner
erreichbar (R-02). Das ist die wichtigste Vertrauensgrenze des Produkts und Gegenstand von T-003
und T-011. Siehe Abschnitt 6.

**Wenn die Sidecar-Bündelung scheitert (R-04):** Der Rückweg ist lokaler Dienst plus Browser.
Dann fällt E-010, und der Windows-Benutzername muss aus einer Einstellung kommen — womit er zur
Vertrauensgrenze in Richtung Abrechnung würde. Der hier beschriebene Schnitt ist davon nicht
betroffen: Nur der eingehende Adapter und die Herkunftsprüfung ändern sich, Domäne und Ports
nicht.

---

## 3. Die drei Abläufe, an denen etwas kaputtgehen kann

### 3.1 Timer starten (A-6.2, A-6.8, A-2.5)

Drei Anforderungen greifen ineinander: höchstens ein Timer, Rückfrage vor dem Stoppen, und der
Start auf einem erledigten Todo macht dieses wieder aktiv.

```
  POST /timer/start { todoId }
        │
        ├─ läuft ein Timer und stopRunning ist nicht gesetzt?
        │     └─► 409 timer_already_running, Antwort nennt den laufenden Timer
        │         Es wird nichts geändert. Die Oberfläche fragt nach (A-6.8).
        │
        └─ EINE Transaktion:
             1. laufenden Timer beenden   (falls einer läuft und bestätigt wurde)
             2. Zieltodo erledigt?  ──► completed_at = NULL             (A-2.5)
                                        status_id bleibt unverändert
             3. neue Zeile in time_entry ohne ended_at
           COMMIT
```

Drei Dinge sind hier Absicht:

**Die Rückfrage ist Teil des Vertrags, nicht Höflichkeit der Oberfläche.** Ohne
`stopRunning: true` gibt es keinen Weg, einen laufenden Timer zu beenden. Ein Add-in, das
die Rückfrage nicht stellt, kann sie auch nicht überspringen.

**Eine Transaktion, kein Zwischenzustand.** Es gibt keinen Moment, in dem der alte Timer
gestoppt, der neue aber nicht gestartet ist — und keinen, in dem das Todo aktiv ist, ohne dass
Zeit läuft.

**Erledigt und Status sind zwei getrennte Achsen.** Ein Todo kann in „Done" stehen und
nicht erledigt sein, und es kann erledigt sein und in „In Progress" stehen. Weder das Setzen
noch das Aufheben von Erledigt ändert den Status. Deshalb gibt es keine gemerkte und keine
konfigurierte Rückkehr-Spalte — es gäbe nichts wiederherzustellen, und `todo` führt kein Feld
dafür.

Seit E-054 gilt das für den **Status**: Die Kanban-Spalte ist nicht mehr der Status, sondern eine
Regel — und seit E-055 hat diese Regel fünf Achsen, nicht nur Tags: erforderliche Tags,
ausgeschlossene Tags, Status, Erledigt und Exportstatus. Ein Timerstart schreibt weder Status noch
Tags, und **trotzdem kann die Karte danach in anderen Spalten stehen**: Er hebt „Erledigt" auf
(A-2.5), und stoppt er dabei einen Timer desselben Todos, entsteht die erste offene Buchung. Beides
sind Achsen. Die Karte bleibt also genau so lange, wo sie ist, wie keine Regel nach „Erledigt" oder
nach dem Exportstatus fragt.

**Was daraus folgt, wird berechnet und nicht geraten.** `apps/local-api/src/usecases/pool-movement.ts`
hält jede Regel gegen den Zustand vor und nach der Handlung und liefert `{ appears, enters, leaves }`;
die Routen geben das als `poolMovement` heraus (E-058, E-060), den Satz dazu bildet
`poolMovementSentence` aus der Domäne. Bis T-101 stand an dieser Stelle „die Karte steht danach in
denselben Spalten wie zuvor" — derselbe Irrtum, den :105-113 zweihundert Zeilen weiter oben als
Irrtum beschreibt (R-2a W-4, D-3 aus R-2).

**Die Pool-Zugehörigkeit wird nicht geschrieben.** Sie ist abgeleitet (A-3.4); Schritt 2 ändert
allein `completed_at`. A-2.5 trägt die Sichtbarkeit: Erledigte Todos werden in Pool-Ansichten
ausgeblendet (`isVisibleInPool` in `packages/domain/src/tag.ts`), aktive nicht. Fällt das
Kennzeichen, fällt die Ausblendung, und das Todo erscheint ohne einen einzigen Schreibvorgang
wieder dort, wo seine Regel es hinstellt. Nachgewiesen im Migrationstest: ein Todo bleibt Mitglied
seines Pools, während es erledigt ist, und ist nach dem Timerstart sofort wieder in der
Ergebnisliste.

Das gilt für das Umlegen des Kennzeichens **von Hand** genauso: `PUT` und
`DELETE /todos/{todoId}/done` liefern seit E-060 dasselbe `poolMovement`. Wer an einer Stelle
Auskunft gibt und an der anderen schweigt, sagt die halbe Wahrheit.

Und für die **Buchung von Hand** ebenso: `POST /time-entries` kann die erste abgeschlossene
Buchung eines Todos sein und legt damit die Exportachse um — dieselbe Bewegung, die
`POST /timer/stop` ansagt, nur über einen anderen Knopf ausgelöst (E-061 Nachtrag, O-V). Sie
rechnet deshalb mit demselben Zustandspaar wie der Stopp (`closedEntryMovementStates`) und nicht
mit dem der Add-in-Buchung: Diese Route schreibt `completed_at` nicht, ein erledigtes Todo bleibt
also erledigt.

`PATCH /time-entries/{id}` trägt das Feld **nicht** — die Begründung dafür ist aber nicht, dass die
Route nur „einen Zeitraum oder eine Leistung" ändere. Sie nimmt auch `todoId` entgegen
(`apps/local-api/src/routes/time.ts`) und hängt die Buchung damit um: Verliert das abgebende Todo
seine letzte offene Buchung und bekommt das aufnehmende seine erste, bewegen sich **zwei** Todos,
und zwar in entgegengesetzte Richtungen. Ein Feld für **eine** Bewegung kann das nicht tragen.
Welche Antwort an diese Stelle gehört, ist offen (**O-X**, beim Auftraggeber); bis dahin schweigt
die Route bewusst, statt die halbe Bewegung zu melden.

**Der Timer hinterlässt im Betrieb ein Lebenszeichen** (E-036), mindestens jede Minute, in
`timer_heartbeat` und nicht auf der Buchung selbst. Endet die Anwendung ungeordnet, findet der
nächste Start eine Buchung ohne Ende vor und fragt: bis zum letzten Lebenszeichen buchen oder
verwerfen? Die Entscheidung darüber ist eine reine Regel (`decideOrphanedTimer`), das Schreiben
eine Transaktion. Bis der Benutzer geantwortet hat, bleibt die Buchung unvollständig und geht in
keinen Export — `v_export_candidate` führt ausschließlich abgeschlossene Buchungen. Die Variante
„beim nächsten Start auf jetzt enden" gibt es bewusst nicht: Sie ist der Weg, auf dem ein über
Nacht vergessener Timer vierzehn Stunden in eine Rechnung schreibt.

**Stoppen** schreibt Ende, Dauer und Leistung in einem Zug. Die Dauer entsteht aus einer
monotonen Messung, nicht aus der Differenz zweier Wanduhrzeiten — eine Zeitumstellung während
eines laufenden Timers darf die Abrechnung nicht verändern. Läuft der Timer kürzer als eine
Sekunde, wird nichts gebucht: das ist der Doppelklick auf „Start", nicht geleistete Arbeit. Der
Dienst antwortet mit `200` und `kind: "discarded"`, nicht mit einem Fehler.

### 3.2 Exportieren (A-8.1, A-8.8)

Entweder Datei geschrieben und alle Buchungen markiert, oder nichts.

```
  POST /export/runs { templateId }
        │
        1. Exportordner prüfen — vorhanden, Ordner, beschreibbar   (E-011, R-11)
        │  fehlt oder gesperrt ► 422, verständliche Meldung, kein Absturz
        │
        2. TRANSAKTION öffnen, offene Buchungen sperren
        │  keine offenen ► 409 export_nothing_to_do, keine leere Datei
        │
        3. ExportGroup-Werte aus v_export_candidate lesen          (ohne Vermerk)
        │  je Todo und Kalendertag eine Gruppe aus nur offenen Buchungen
        │  packages/export erzeugt JSON, rein, ohne Dateizugriff
        │
        4. Datei schreiben:  <ordner>/.takt-<zufall>.tmp
        │                    ► rename ► <ordner>/takt-export-<zeit>.json
        │  Umbenennen innerhalb desselben Dateisystems ist unteilbar.
        │
        5. In derselben Transaktion:
        │     export_status = 'exported', export_count + 1
        │     export_run, export_run_group, export_run_entry, export_audit
        │
        6. COMMIT
           scheitert 5 oder 6 ► ROLLBACK und die Datei wieder entfernen
```

Die Reihenfolge ist Absicht. Datei zuerst, Markierung danach:

- Eine geschriebene Datei ohne Markierung führt dazu, dass dieselbe Zeit ein zweites Mal
  exportiert wird. Ärgerlich, aber **auffindbar** — die Datei liegt im Ordner, und der Benutzer
  sieht sie.
- Eine Markierung ohne Datei führt zu **verlorener Abrechnung**. Die Buchungen gelten als
  übertragen, aber niemand hat sie bekommen, und niemand merkt es.

Der zweite Fall ist der schlimmere, deshalb wird er ausgeschlossen. Bricht Schritt 4 ab, wird 5
nie erreicht; es bleibt höchstens eine verwaiste `.tmp`-Datei, die beim nächsten Start entfernt
wird.

`export_run` hält den SHA-256 der Datei und einen Abzug der verwendeten Vorlage. Ohne den Abzug
schriebe eine spätere Vorlagenänderung die Geschichte rückwirkend um.

**Eine Zeile je Todo und Kalendertag.** Gerundet wird nicht die einzelne Buchung, sondern die
Tagessumme: Erst werden alle noch offenen Buchungen eines Todos an einem Kalendertag addiert,
dann wird die Summe nach E-008 aufgerundet. Zehn, zwanzig und fünf Minuten am selben Tag ergeben
0,75 statt dreimal 0,25. Maßgeblich ist der Tag, an dem der Timer **gestartet** wurde; eine
Buchung von 23:40 bis 00:20 zählt vollständig zum Starttag und wird nicht geteilt. Bereits
exportierte Buchungen desselben Tages bleiben außen vor, sonst ginge ihre Zeit ein zweites Mal
in die Abrechnung (R-10). Die Leistungstexte der Gruppe werden nach Startzeit mit Semikolon
verbunden; leere Texte entfallen. Der Typ dafür ist `ExportGroup` in
`packages/domain/src/export.ts`.

**Der Ordner ist Benutzereingabe (E-011, R-11).** Er wird vor *jedem* Lauf erneut geprüft, nicht
nur beim Einstellen — ein Netzlaufwerk kann zwischenzeitlich verschwinden. Der Dateiname wird
vom Dienst gebildet und enthält keine Eingabe des Aufrufers; der aufgelöste Zielpfad wird gegen
den aufgelösten Ordner geprüft, damit `..` nirgends hinausführt.

**Die Prüfung wartet höchstens drei Sekunden (T-039).** Ein `stat` auf eine tote Netzfreigabe
kehrt erst zurück, wenn das Betriebssystem aufgibt — unter Windows nach etwa fünfzehn Sekunden.
So lange hielt `PATCH /settings` die Antwort auf, und wer eine Anwendung fünfzehn Sekunden ohne
Rückmeldung sieht, hält sie für abgestürzt: Er wartet nicht, er klickt. Was nach dem Budget kommt,
heißt `unreachable` und **nicht** `missing` — nicht geantwortet zu haben ist kein Beleg dafür,
nicht da zu sein, und die beiden führen zu verschiedenen Handgriffen. Der Systemaufruf selbst wird
dabei nicht abgebrochen; Node kann das nicht. Das Budget beendet nur das Warten, und der Aufruf
belegt bis zum Aufgeben des Betriebssystems einen der vier Arbeiter des Threadpools. Das ist der
Grund, warum es drei Sekunden sind und nicht dreihundert Millisekunden.

**Drei Stellen sprechen über denselben Ordner, und sie tun Verschiedenes.**

| Wer | Was | Wo |
|---|---|---|
| `exportDirectoryAdvice.ts` | **warnt**, während getippt wird, aus dem Pfad heraus | `apps/web/src/lib/` |
| `checkExportDirectory` | **entscheidet**: vorhanden, Ordner, beschreibbar, erreichbar | `packages/storage/src/sqlite/file-port.ts` |
| `DirectoryInsightPort` | **belegt**, was für ein Ordner das ist | `apps/local-api/src/access/export-directory.ts` |

Die dritte Zeile ist mit T-039 dazugekommen und schließt eine Lücke, die die erste offen lassen
muss: Ob `Z:\` ein Netzlaufwerk ist, steht nicht im Pfad, und ein umbenannter OneDrive-Ordner
heißt nicht „OneDrive". Der Beleg kommt aus der Umgebung des angemeldeten Benutzers
(`%OneDrive%`, `%SystemRoot%`) und aus der Art des Dateisystems (`statfs`) und heißt `unc`,
`network`, `sync_folder` oder `system_dir`. Die Heuristik der Oberfläche bleibt daneben stehen:
Sie greift früher, ohne Anfrage; der Beleg greift genauer, aber erst nach einer.

Zwei Regeln halten das zusammen. **Eine leere Merkmalsliste ist keine Entwarnung, sondern eine
Nichtaussage** — ein zugeordnetes `Z:` bleibt die Lücke, die erst `GetDriveTypeW` in der Hülle
schließt (E-004). Und **die Einordnung hängt nicht am Ausgang der Prüfung**: Ein
Systemverzeichnis bleibt eines, ob dorthin geschrieben werden darf oder nicht. Deshalb sind es
zwei Ports und nicht ein Feld im Prüfergebnis, das je nach Zweig da ist und je nach Zweig fehlt.

Warum der Adapter in `apps/local-api/src/access/` liegt und nicht bei der Prüfung: Er liest
Umgebungsvariablen und Dateisystemarten. Das ist Auskunft über den **Rechner** und nicht über
eine Speicherung — dieselbe Sorte Wissen wie in `paths.ts` (wo liegt das
Anwendungsdatenverzeichnis) und `token-store.ts` (welche Rechte hat diese Datei).

**Base64 ist eine Kodierung, keine Verschlüsselung (A-8.9, R-05).** Die Datei enthält
Kundendaten im Klartextäquivalent. Das gehört in die Benutzerdokumentation und ins
Bedrohungsmodell, nicht in eine Fußnote.

**Wo der Ablauf steht, seit T-021.** `apps/local-api/src/usecases/export.ts` führt die Schritte 1
bis 6; `ExportPort.recordRun` in `packages/storage` schreibt Schritt 5 fest. Der Schnitt ist
Absicht: Die Klammer gehört dorthin, wo die Transaktion ist, und das Rendern dorthin, wo das
Vorlagenformat ist. Läge beides in der Speicherung, trüge ein austauschbarer Adapter (E-001) das
Vorlagenformat mit sich, und ein zweiter Adapter müsste es nachbauen.

**Ein fachlicher Fehlschlag wird im Exportlauf ausdrücklich geworfen.** Die Transaktionsklammer
nimmt nur bei einem **Wurf** zurück; ein `Result` mit `ok: false` ist ein Wert und rollt nichts
zurück. Das ist im Allgemeinen richtig — ein Anwendungsfall darf einen Fehlschlag melden und
trotzdem etwas geschrieben haben wollen. Hier will er das nie. Ohne diesen Kunstgriff wäre genau
der schlimmste Fall möglich: Datei geschrieben, Markierung gescheitert, „Fehler" an den Benutzer
— und die halbe Markierung bliebe festgeschrieben.

**Nachgewiesen, nicht behauptet.** `pnpm --filter @takt/local-api proof:export` löst einen
Abbruch **mitten im Vorgang** aus — einmal nach dem Schreiben der Datei und vor dem Markieren,
einmal nach dem Markieren und vor dem Festschreiben — und zählt danach nach: keine markierte
Buchung, kein erhöhter `export_count`, keine Protokollzeile, kein Exportlauf, keine Datei im
Ordner, auch keine `.tmp`. Anschließend läuft derselbe Bestand ohne Haken vollständig durch. Die
Zusicherung aus A-8.8 ist damit gemessen und nicht erhofft.

### 3.3 Exportstatus zurücksetzen (E-012, R-10)

```
  PUT /time-entries/{id}/export-status  { status: "open", reason: "..." }
        │
        └─ EINE Transaktion:
             export_status = 'open'           (export_count bleibt stehen)
             export_audit: reset, previous/new, Akteur, Grund, Zeit
           COMMIT
```

Es gibt keinen Statuswechsel ohne Protokollzeile — beides oder keines.

Der umgekehrte Weg, `exported` von Hand zu setzen, ist über diese Route nicht vorgesehen und
antwortet mit `409 export_status_not_settable`.

### 3.3a Nicht abrechnen (E-047)

```
  POST /time-entries/{id}/not-billed  { reason: "..." }   ← freiwillig
        │
        └─ EINE Transaktion:
             export_audit: not_billed, open → exported, Akteur, Grund, Zeit
             export_status = 'exported'      (export_count bleibt bei 0)
           COMMIT
```

Der zweite und einzige andere Weg nach `exported` — und ausdrücklich **kein** Export: keine
Datei, kein Lauf, kein Beleg. Der Benutzer rechnet diese Zeit nicht ab. Deshalb steht der Vorgang
als eigene Route und nicht als weiterer erlaubter Wert von `export-status`: Ein
`{"status":"exported"}` legte genau die Gleichsetzung nahe, die E-047 aufhebt.

**Die Reihenfolge der beiden Anweisungen ist erzwungen, nicht gewählt.** Ein Trigger auf
`time_entry` lässt den Wechsel auf `exported` ohne mitzählenden Exportlauf nur zu, wenn die
Protokollzeile bereits dasteht (datenmodell.md 4.4). „Beides oder keines" hängt damit nicht mehr
an der Sorgfalt des Adapters, sondern am Schema — dieselbe Zusage wie in 3.3, nur eine Ebene
tiefer verankert.

**Und genau dieser Trigger hat in T-041 versagt, in etwa jedem vierten Fall.** Er sucht die
jüngste Protokollzeile einer Buchung mit `ORDER BY occurred_at DESC, id DESC`. Beide Teile
trugen nicht: `occurred_at` hat **Sekunden**auflösung — `Timestamp` schneidet die Millisekunden
ab —, und `id` war eine UUIDv7, deren zwölf Bit hinter der Version aus `crypto.randomBytes`
kamen. Innerhalb einer Millisekunde war die Reihenfolge zweier Kennungen damit ein Münzwurf,
obwohl der Kopf von `ids.ts` „nach Erzeugungszeit sortierbar" versprach.

Die Folge war schlimmer als ein Fehlschlag: Der Trigger hielt die ältere `reset`-Zeile für die
jüngste und brach das `UPDATE` ab; die bereits eingefügte `not_billed`-Zeile blieb aber stehen,
weil ein fachlicher Fehlschlag im Adapter ein **Wert** und kein Wurf ist und die
Transaktionsklammer nur bei einem Wurf zurücknimmt. Zurück blieb ein Protokoll, das „nicht
abgerechnet" bezeugt, und eine Buchung, die weiter offen ist und in den nächsten Export läuft.
Das ist genau die Doppelabrechnung, die R-10 ausschließen soll — nur mit umgekehrtem Vorzeichen.

Drei Änderungen, und jede ist einzeln nachgewiesen (`proof:export`, Abschnitte 11 bis 13):

* **`uuidv7` bekommt einen Zähler** in den zwölf Bit hinter der Version (RFC 9562, 6.2, Methode
  1). Kennungen steigen jetzt auch innerhalb einer Millisekunde. Das behebt die Ursache statt
  ihrer Wirkung: Die Sortierbarkeit war eine zugesagte Eigenschaft, auf die gebaut wurde, und sie
  ist jetzt wahr — auch für die Anzeigereihenfolge des Protokolls und für jeden künftigen
  Vergleich, der auf `id` als Zweitschlüssel setzt.
* **Ein Sicherungspunkt im Adapter** um die beiden Anweisungen von `resetStatus` und
  `markNotBilled`. Scheitert die zweite, wird die erste zurückgenommen, ohne dass die äußere
  Transaktion endet. Damit hängt „beides oder keines" nicht mehr an einer einzigen Bedingung.
  Dazu prüfen beide Methoden, dass das `UPDATE` genau eine Zeile getroffen hat — ein
  Statuswechsel, der niemanden trifft, darf keine Protokollzeile hinterlassen.
* **Migration 0007 hängt den Trigger an `rowid`** statt an die Kennung (T-047,
  datenmodell.md 3.4 und 8.4b). Der Zähler oben ist richtig und bleibt; er ist nur die falsche
  Stelle, um eine Prüfung der Datenbank aufzuhängen. Wer `IdSource` austauscht, hätte sie sonst
  aufgehoben, ohne davon zu erfahren.

### 3.3b Der Sicherungspunkt ist ein Baustein, keine Stelle (T-047)

Der Wettlauf oben war der auffällige Teil des Befunds. Der Bau darunter ist der allgemeine, und
er hat mit dem Export nichts zu tun:

> Ein fachlicher Fehlschlag ist im Adapter ein **Wert** und kein Wurf. Die Transaktionsklammer
> nimmt nur bei einem **Wurf** zurück. Wer in einer Methode zwei Anweisungen schreibt und den
> Fehlschlag der zweiten als Wert meldet, hinterlässt die erste — festgeschrieben, in einer
> Klammer, die genau das ausschließen sollte.

Beides ist einzeln richtig. Ein Namenskonflikt ist keine Ausnahme, sondern eine Antwort, und eine
Transaktion soll nicht an jedem erwarteten Fehlschlag sterben. Zusammen ergeben sie eine Lücke,
die keiner der beiden Seiten anzusehen ist.

T-047 hat sieben Stellen dieser Bauart gefunden und alle sieben in denselben Sicherungspunkt
gefasst (`packages/storage/src/sqlite/atomic.ts`). Die vier, an denen der Schaden bleibt und
sichtbar ist, sind gemessen — erst mit Sicherungspunkt grün, dann ohne ihn rot (`proof:export`,
Abschnitt 13):

| Stelle | Was ohne Sicherungspunkt stehen bleibt |
|---|---|
| `statuses.update` mit `isDefault` und vergebenem Namen | ein Brett **ohne** Standardspalte; `defaultStatus()` wirft danach bei jedem neuen Todo |
| `statuses.create` mit vergebenem Namen | alle Spalten ab der Zielposition um eins verrutscht |
| `todos.update` mit Spaltenwechsel und unbekanntem Tag | das Todo steht in der neuen Spalte, obwohl die Anfrage abgewiesen wurde |
| `export.recordRun` mit einer doppelten Tagesgruppe | ein Exportlauf **ohne Datei** und eine als `exported` markierte Buchung — abgerechnete Zeit, die nie in einer Rechnung stand |

Die letzte ist die teuerste und die stillste: Die Buchung ist danach gesperrt (A-6.9), sie taucht
in keinem weiteren Export auf, und niemand vermisst sie. Sie ist auch der Grund, warum der
Sicherungspunkt dort steht, obwohl die Klammer des Aufrufers schon offen ist — A-8.8 sagt „Datei
und Markierung, oder nichts", und ohne ihn galt der Satz nur für den Weg, auf dem geworfen wird.

Die drei übrigen Stellen (`statuses.reorder`, `pools.update`, `timer.start`) sind gleich gebaut,
ihr Fehlschlag ist aber nach heutigem Stand nicht auslösbar. Sie sind trotzdem gefasst: Der
Unterschied zwischen „kann nicht eintreten" und „tritt nicht ein" ist eine Zeile Code Abstand,
und `timer.start` versprach in seinem eigenen Kommentar bereits, was es nicht hielt — „ein
Abbruch dazwischen hinterlässt keinen der drei Schritte".

`export_count` bleibt bei 0. Er zählt Exportläufe, und einer hat nicht stattgefunden: Wird die
Buchung später zurückgesetzt, darf die Oberfläche sie nicht als „schon einmal exportiert"
kennzeichnen (R-10).

`export_count` bleibt stehen. Der Zustand `open` bei `export_count > 0` ist genau das, was die
Oberfläche nach R-10 dauerhaft als „schon einmal exportiert" kennzeichnen muss.

### 3.4 Ein Todo mit einem neuen Tag anlegen (A-2.1, A-4.1, T-058, T-061, T-062)

Der vierte Ablauf, an dem etwas kaputtgehen kann, und der erste, bei dem der Schaden zwei
Richtungen hat. Beim Anlegen eines Todos darf ein **Tagname** stehen statt einer Kennung. Gibt es
den Namen noch nicht, entsteht das Tag.

**Zwei Routen, ein Ablauf.** `POST /todos` (Hauptanwendung, T-058) und `POST /addin/todos`
(Outlook, T-061) nehmen beide `tagNames` entgegen. Das Schaubild gilt für beide; wie viele
Fassungen der Auflösung es dabei gibt, steht weiter unten unter „Auch auf dem Add-in-Weg".

```
   Route POST /todos  ·  POST /addin/todos
        │  Gestaltprüfung (zod): bis zu 50 Namen, je 1–200 Zeichen
        ▼
   checkTagNames                  ── rein, ohne Transaktion ──
        │  normalisiert, prüft, wirft Doppelte **innerhalb der Anfrage** weg
        │  („Backend" und „backend" in einem Zug sind ein Tag)
        ▼
   ┌─ inTransaction ────────────────────────────────────────────┐
   │   resolveTagNames  (usecases/tag-names.ts)                 │
   │      je Name: tags.findByKey(schlüssel)                    │
   │        0 Treffer  → tags.create(…), auf Wurzelebene        │
   │        1 Treffer  → verwenden                              │
   │       >1 Treffer  → Wurf `AbortTodoCreate` → 422           │
   │                                                            │
   │   defaultTags.list  +  applyDefaultTags   (A-9.5)          │
   │   todos.create                                             │
   └────────────────────────────────────────────────────────────┘
```

**Zwei Schäden, eine Klammer.** Der eine ist das doppelte Tag: Zwei Fenster legen gleichzeitig ein
Todo mit demselben neuen Namen an, beide finden nichts, beide legen an. Der andere ist das
verwaiste Tag: Das Tag entsteht, das Todo scheitert, und zurück bleibt ein Vokabular, das niemand
bestellt hat — und beim nächsten Versuch ein Treffer, der aus einem Fehlschlag stammt. Beide
verschwinden dadurch, dass Auflösen und Anlegen in **derselben** Transaktion liegen.

**Drei Ebenen, und jede hat ihren Grund.** Sie ersetzen einander nicht:

1. `TransactionPort` reiht Transaktionen (`unit-of-work.ts`). Zwei laufen nie ineinander; die
   zweite Anfrage sieht das Tag der ersten. Das ist die Ebene, die im Betrieb trägt.
2. `ux_tag_name_key` weist den zweiten gleichen Schlüssel strukturell ab — auch dann, wenn Ebene 1
   eines Tages nicht mehr gilt, etwa weil ein zweiter Prozess dieselbe Datei öffnet.
3. Der **Wurf** statt eines Rückgabewerts beim Abbruch. Das ist die achte Stelle jener Bauart aus
   3.3b: `resolveTagNames` legt bei mehreren Namen mehrere Tags an, und ein Fehlschlag als Wert
   ließe die Klammer festschreiben, was bis dahin entstanden ist — eine Fehlermeldung **und** zwei
   Tags, die niemand bestellt hat.

   Hier ist es ausdrücklich ein Wurf und **kein** Sicherungspunkt. Der Sicherungspunkt nimmt einen
   Ausschnitt zurück und lässt die Klammer weiterlaufen; das ist richtig, wenn danach noch etwas
   passieren soll. Hier soll nichts mehr passieren: Es gibt kein Todo, also soll es auch nichts
   geben, was für dieses Todo entstanden ist. Dieselbe Bauart wie `AbortExport` in 3.2.

Gemessen wird das nicht durch Hinsehen. `pnpm --filter @takt/local-api proof:tags` schickt acht
**gleichzeitige** Anfragen mit demselben Namen in acht Schreibweisen und verlangt danach: genau
ein Tag, acht Todos, jedes daran, und genau eine Antwort, die meldet, es angelegt zu haben. Ein
Prüffall, der die Anfragen nacheinander schickte, wäre grün und sagte nichts.

**Wer was beiträgt.** Die **Domäne** sagt, wann zwei Namen derselbe sind (`tagNameKey`, siehe
datenmodell.md 3.3) — eine reine Funktion, ohne Uhr, ohne Datenbank, einzeln prüfbar. Der
**Anwendungsfall** sagt, was aus keinem, einem oder mehreren Treffern folgt. Der **Adapter**
liefert zwei Bausteine und urteilt nicht: `findByKey` fragt, `create` schreibt. Damit gilt die
Regel auch für einen anderen Adapter, und sie steht an einer Stelle statt in einer Abfrage
versteckt. Der Schlüssel ist die einzige Stelle, an der beide Seiten dasselbe
wissen müssen, und genau deshalb steht er auch als Spalte in der Datenbank: Sonst erzwänge das
Schema eine andere Regel, als die Anwendung prüft.

**Auch auf dem Add-in-Weg — und über dieselbe Funktion (T-061, T-062).** Bis T-058 benannte
`POST /addin/todos` Tags ausschließlich über ihre Kennung; hier stand deshalb der Satz „kommt ein
Eingabefeld dazu, läuft es über denselben Anwendungsfall". T-061 hat das Feld gebaut — und den
Anwendungsfall zunächst **abgeschrieben**, weil `resolveTagNames` in `usecases/todos.ts` nicht
exportiert war und `usecases/` nicht zur Dateihoheit der Add-in-Routen gehört. Zwei Fassungen
derselben Regel, unter Messung gestellt statt behauptet, aber eben zwei.

T-062 hat den Zuschnitt nachgeholt, und der Zuschnitt ist der eigentliche Punkt. Die Funktion
liegt seither exportiert in `usecases/tag-names.ts` — einem eigenen, schmalen Modul, aus
demselben Grund, aus dem `@takt/domain/export` neben `@takt/domain` steht — und ihr Parameter ist
nicht mehr die volle Arbeitseinheit, sondern genau das, was sie benutzt:

```ts
interface TagNameUnit { readonly tags: Pick<TagPort, 'findByKey' | 'create'>; }
```

`Pick<UnitOfWork, 'tags'>` hätte **nicht** gereicht: Die Arbeitseinheit des Add-ins führt unter
`tags` selbst nur `findByKey` und `create` (`routes/addin/ports.ts`, RR-1), und ein Parameter,
der den vollen `TagPort` verlangt, nähme sie nicht an. Der Aufrufer stünde wieder vor der Wahl,
seine Angriffsfläche zu verbreitern oder abzuschreiben. Ein Parameter, der zu viel verlangt, ist
also nicht nur unsauber — er erzeugt genau die Doppelung, die er verhindern soll.

**Stand.** Die Hauptanwendung ruft die exportierte Fassung auf. Die Add-in-Route trägt zum
Zeitpunkt dieser Zeile noch ihre eigene — der Austausch gegen den Import ist ein Handgriff in
`routes/addin/service.ts` und liegt in fremder Dateihoheit. Bis dahin bewacht der Prüffall
„derselbe Name über beide Wege ergibt dasselbe Tag" (`proof:addin`, Abschnitt 11c) die Gleichheit
der beiden Fassungen; danach misst er etwas Triviales, und das ist der richtige Zustand: Ein
Prüffall, der eine Doppelung bewacht, ist eine schlechtere Lösung als keine Doppelung.

---

## 4. Die Notiz-Trennung als Struktur, nicht als Vereinbarung

A-7.2 ist eine Datenschutzgrenze. R-06 hält fest, dass sie nur so stark ist wie ihre Prüfung,
sobald der Benutzer Feldquellen frei wählen kann.

Vier voneinander unabhängige Schichten, ausführlich in `docs/datenmodell.md`, Abschnitt 7:

1. **Eigene Tabelle** `todo_note`. Kein `SELECT *` auf `todo` nimmt den Vermerk mit.
2. **Eigene Sicht** `v_export_candidate` ohne die Spalte. Auch eine später von Hand ergänzte
   Abfrage im Exportpfad greift ins Leere. Geprüft.
3. **Eigener, engerer Einstiegspunkt** `@takt/domain/export`. Er gibt weder `Todo` noch
   `TodoNote` heraus; die einzigen Datentypen sind `ExportCandidate` und die Tagesgruppe
   `ExportGroup`, und keiner von beiden hat ein Feld für den Vermerk. `packages/export` bekommt
   zudem gar keine Ports, sondern fertige Werte — es hat keinen Zugang zur Datenbank.
4. **Abschließende Liste erlaubter Quellenpfade und drei Typzusicherungen**, an den Übersetzer
   gebunden. Nimmt jemand `todo.note` in `ExportSourcePath` auf oder hängt ein Feld namens
   `note`, `notiz`, `vermerk`, `todoNote`, `todoNotiz` oder `todoVermerk` an `ExportCandidate`
   oder an `ExportGroup`, bricht `pnpm typecheck` mit
   `TS2344: Type 'false' does not satisfy the constraint 'true'` ab. In T-013 für alle drei
   Zusicherungen einzeln nachgewiesen: `NoteBoundaryIsSealed`,
   `ExportCandidateHasNoTodoNote`, `ExportGroupHasNoTodoNote`.

Keine dieser vier Schichten ist eine Vereinbarung unter Entwicklern. Jede einzelne würde die
Grenze halten; zusammen halten sie sie auch dann, wenn jemand eine davon versehentlich aufweicht.

**Eine eigene Route.** Der interne Vermerk wird über `GET/PUT /todos/{id}/note` geholt, nicht
als Feld am Todo. Das macht jeden Zugriff darauf im Netzverkehr und in den Protokollen sichtbar
und hilft nebenbei gegen R-08 — die Verwechslung der beiden Notizfelder ist der
wahrscheinlichste Bedienfehler dieses Produkts.

---

## 5. Der lokale Dienst

Vollständige Beschreibung: `apps/local-api/openapi/takt-local-api.yaml`. OpenAPI 3.1, 43 Pfade,
64 Operationen.

**Und seit T-039 nachgewiesen statt gepflegt, seit T-041 vollständig und in der `check`-Kette.**
`pnpm run proof:openapi` hält die Beschreibung gegen den zusammengebauten Dienst. Das ist keine Bequemlichkeit, sondern
die Antwort auf eine Wunde, die dreimal aufgegangen ist: T-022 fand vier Abweichungen, T-029
zwölf — darunter den Seitenumschlag, der bei **keiner** Listenroute stimmte —, T-038 das
Rumpffeld `reopenIfDone`, das der Dienst nicht mehr liest. Jedes Mal hatte jemand von Hand
gesucht, und jedes Mal war die Beschreibung vorher plausibel gewesen. Sie wird nicht ausgeführt,
also fällt nichts auf.

Der Lauf vergleicht fünf Dinge und ist über den Rest ausdrücklich stumm:

* **Routen, beide Richtungen.** Die Aufzählung kommt aus `Hono#routes` des über `compose`
  gebauten Dienstes. 64 gegen 64, keine Ausnahme, keine gepflegte Liste.
* **Anfragerümpfe.** Jede Route mit Rumpf prüft ihre Eingabe mit einem zod-Schema;
  `z.toJSONSchema` macht daraus JSON Schema, und Feldnamen, Pflichtfelder, Obergrenzen und
  Aufzählungen werden gegen die Beschreibung gehalten. Die Zuordnung „Route → Schema" steht als
  `REQUEST_SCHEMAS` **in den Routendateien**, nicht im Prüfskript: Wer eine Route hinzufügt, sieht
  sie neben seiner Arbeit. Fehlt der Eintrag, wird der Lauf rot.
* **Antwortgestalten (T-041).** `scripts/service-scenario.mjs` baut den Dienst **einmal** mit
  einem kleinen festen Bestand im Arbeitsspeicher auf und fährt jede der 64 Operationen
  mindestens einmal an — Erfolgsfälle und Abweisungen. `scripts/schema-match.mjs` hält jede
  Antwort gegen ihr Schema: Pflichtfelder vorhanden, kein Feld geliefert, das nicht beschrieben
  ist, Art und feste Werte passend. Eine Operation ohne Aufruf macht den Lauf rot; eine
  Aufzählung „diese lassen wir aus" gibt es nicht.
* **Statuscodes und Kopfzeilen.** Jeder gelieferte Statuscode muss beschrieben sein, und jeder
  beschriebene **Erfolgs**fall muss im Durchlauf vorkommen. Dazu die Antworten der Kette: `400`,
  `401` und `403` stehen an jeder Operation, `413` und `415` an jeder mit Rumpf — sie hängen vor
  allen Routen, also gehören sie an alle. `Location` wird in beide Richtungen geprüft.
* **Den Leser und den Vergleicher selbst.** Abschnitt 0 zählt Obergrenzen und Verweise im Rohtext
  und im gelesenen Baum und vergleicht die Zahlen. Abschnitt 5 hält dem Vergleicher sieben
  bekannte Abweichungen hin — darunter die aus T-022 und T-029 — und verlangt, dass er jede
  findet. Ein Leser oder ein Vergleicher, der etwas verschluckt, wäre der schlimmste Fall: grün,
  weil er nichts findet.

Der Regel dahinter lohnt ein eigener Satz, weil sie die Grenze des Laufs zieht: **Die Beschreibung
darf weniger genau sein als der Dienst, aber ihm nicht widersprechen.** Ein fehlendes `maxLength`
an einer Stelle, die auf ein benanntes Bauteil zeigt, ist Kürze. Ein `maxLength: 512`, wo der
Dienst bei 500 abweist, ist eine Falschaussage — und war eine.

Der erste Lauf gab **dreißig** Befunde an den Anfragerümpfen aus, verteilt über zwölf der
vierundzwanzig Routen mit Rumpf. Darunter zwei **deutsche Feldnamen**, die der Dienst nie gelesen
hat (`neuerParentId` statt `newParentId`, `reihenfolge` statt `order`), ein `color` beim Anlegen
einer Kanban-Spalte, das der Anwendungsfall nicht entgegennimmt, und ein `noteForRunning` beim
Timerstart, das eine Leistung für den verdrängten Timer versprach.

Von Hand kamen die Antworten dazu, die kein Schema abgreifbar macht — und dort lag der teuerste
Fund: `POST /timer/start` antwortete laut Beschreibung auf die Rückfrage aus A-6.8 mit `409` und
`timer_already_running`, tatsächlich mit `200` und `kind: confirmation_required`. Wer gegen die
Beschreibung gebaut hätte, hätte den vorgesehenen ersten Schritt eines zweistufigen Vorgangs als
Störung angezeigt. Ebenso erfunden war das Bauteil `RunningTimer`; der Dienst liefert die laufende
Buchung der Domäne und den Titel **daneben**, nicht in ihr.

**T-041 hat die zweite Hälfte nachgezogen: 16 einzelne Abweichungen und 111 fehlende
Kettenantworten.** Zwei der sechzehn hätten zur Laufzeit `undefined` ergeben: `GET /todos/{todoId}` liefert `TodoDetail` — das Todo
unter `todo` und daneben zwei Summen —, beschrieben war `Todo` selbst; und
`POST /timer/heartbeat` antwortet mit `200` und `{ seenAt }`, beschrieben waren `204` für den
Erfolg und `409 timer_not_running` für den leeren Fall. Beide gab es nie: Läuft kein Timer, ist
das ausdrücklich kein Fehler, sondern `seenAt: null`. Dieselbe Schadensart wie beim Timerstart
vor T-039 — eine Oberfläche, die einen Fehlerfall behandelt, den es nicht gibt, und den echten
nicht.

Dazu sieben Operationen, die eine `Location`-Kopfzeile liefern, ohne sie zu beschreiben, drei
Fehlerschlüssel, die der Dienst liefert und die Beschreibung nirgends nennt (`not_found`,
`tag_in_use`, `unsupported_media_type`), zwei Stellen, an denen `type: object` ohne ein einziges
Feld stand — was von einem vergessenen Feld nicht zu unterscheiden ist und deshalb jetzt
`additionalProperties: true` heißt.

Die Kettenantworten waren der zweite, größere Teil: `400 token_in_url` stand an 4 von 64
Operationen, `413` an 5 und `415` an 1 von 28 mit Rumpf. Sie hängen vor **allen** Routen, also
gehören sie an alle — eine Kettenantwort, die an drei Routen steht und an einundsechzig nicht,
liest sich wie eine Aussage über die drei. `500` steht bewusst nicht dabei: Es ist der einzige
Ausgang, gegen den kein Aufrufer verzweigt, und ein 5xx im Durchlauf soll rot werden statt als
beschrieben durchzugehen.

**Was auch dieser Lauf nicht prüft: ob die Werte stimmen.** Er misst Gestalt, nicht Verhalten:
dass `durationSeconds` da ist und eine Zahl, nicht dass es die richtige Zahl ist. Dafür sind die
Prüfsuite und die übrigen Nachweispfade da. Und er misst nur, was der Durchlauf auslöst — ein
Fehlerfall, den niemand herbeiführt, bleibt ungemessen. Deshalb führt der Durchlauf auch
Abweisungen herbei (404, 409, 422, 401, 403, 400, 415) und nicht nur Erfolgsfälle.

**Ein Nebenbefund, den nur der Durchlauf finden konnte.** Die Probe „kein Aufruf endet mit 5xx"
wurde in drei von vier Läufen grün und im vierten rot: `POST /time-entries/{id}/not-billed`
scheiterte mit 500, wenn zwei Protokollzeilen derselben Buchung in dieselbe Sekunde fielen. Die
Ursache lag zwei Ebenen tiefer und ist in 3.3 beschrieben.

### 5.0a Die dritte Seite des Dreiecks: die Aufrufer (T-051)

`proof:openapi` hält die **Beschreibung** gegen den **Dienst**. Das ist zwei Seiten eines
Dreiecks. Die dritte fehlte bis T-051, und sie hat drei Wochen lang zwei Funktionen der Anwendung
unbenutzbar gemacht, ohne dass irgendetwas rot wurde:

| gesendet | gelesen | Wirkung |
|---|---|---|
| `neuerParentId` | `newParentId` | 422 — S-08 konnte **keinen** Tag-Ordner verschieben |
| `reihenfolge` | `order` | 422 — die Pfeile der Spaltenverwaltung wirkten nie (A-5.4) |
| `nurOffene` | `includeCompleted` | still verworfen; bei der anderen Absicht das Gegenteil |

Der Typecheck sieht so etwas nicht: Ein Rumpf ist ein Objektliteral gegen einen
`unknown`-Parameter, und ein Schlüssel, den niemand liest, ist typkorrekt. Die 556 Prüffälle sehen
es nicht, weil keiner die Oberfläche gegen den echten Dienst fährt. Der End-zu-End-Test war grün,
weil sein gelingender Zug über die Testhilfe lief und am Code der Oberfläche vorbei. Und
`proof:openapi` hat `neuerParentId` sogar **gefunden** — aber als „von keiner Route gelesen"
eingeordnet. Richtig, und unvollständig: Niemand hat gefragt, ob ihn jemand *sendet*.

`pnpm run proof:callers` (`apps/local-api/scripts/proof-callers.mjs`, in der `check`-Kette) liest
`apps/web/src/api/endpoints.ts` mit dem TypeScript-Syntaxbaum und hält jeden Aufruf gegen den
Dienst:

* **Weg.** Methode und Pfad jedes `request(...)` müssen eine Operation treffen. `/todos/${id}`
  und `/todos/{todoId}` treffen sich in `/todos/{}`. Die Gegenrichtung gilt auch: Jede Operation
  außerhalb von `/addin` braucht einen Aufrufer; die Ausnahmen stehen namentlich im Skript — seit
  T-066 auch `getBoard`, mit der Begründung daneben: Die Route steht, die Ansicht dazu kommt in
  einer eigenen Aufgabe, und `apps/web` gehört einem anderen Agenten. Dasselbe gilt für Felder,
  die der Dienst liest und die Oberfläche nie sendet (`NEVER_SENT`, seit T-066 mit `placement`).
  Eine benannte Lücke ist eine Übergabe; eine unbenannte ist ein Rest.
* **Rümpfe gegen `REQUEST_SCHEMAS`.** Dieselbe Quelle wie bei `proof:openapi` — die zod-Schemata
  in den Routendateien, nicht die Beschreibung. Ein gesendeter Schlüssel, den das Schema nicht
  führt, ist ein Befund. Objektliterale werden gelesen, auch unter
  `...(x === undefined ? {} : { a: x })`; ein Bezeichner wird über den Typ seines Parameters
  aufgelöst (`body: TodoCreate` → die Felder von `TodoCreate`).
* **Fragezeichenparameter gegen die Beschreibung.** Sie stehen in keinem zod-Schema. Die
  Beschreibung darf hier Quelle sein, weil `proof:openapi` jeden beschriebenen Parameter im
  Quelltext der Routen nachweist — zusammen ergibt das die Kette Aufrufer → Beschreibung →
  Routenquelle.
* **Dass es keinen zweiten Weg gibt.** Der Lauf liest **eine** Datei, und diese Beschränkung ist
  nur so viel wert wie die Zusicherung, dass keine andere den Dienst anruft. Also wird sie
  gemessen: `fetch` steht nur in `api/client.ts`, `request(` nur in `api/endpoints.ts` — über
  alle 82 Quelldateien der Oberfläche.
* **Sich selbst.** Der Lauf setzt die drei Namen aus T-050 im gelesenen Text wieder ein — im
  Arbeitsspeicher, `apps/web` bleibt unberührt — und verlangt für jeden **genau eine** neue
  Beanstandung, dazu einen erfundenen Pfad. Der Wortlaut jedes Befundes steht in der Ausgabe.
  Ohne diese Selbstprobe wäre der Lauf, was `pnpm contrast` vor T-011 war: grün, weil er nichts
  tut.

**Die blinden Flecken sind gezählt, nicht übergangen.** Was der Leser nicht auflösen kann — ein
berechneter Schlüsselname, eine Verbreitung aus einer Variablen ohne Typangabe, ein Rumpf aus
einem Funktionsaufruf — kommt als *unaufgelöst* heraus und macht den Lauf rot. Nicht, weil der
Aufruf falsch wäre, sondern weil niemand mehr sagen kann, ob er richtig ist. Heute ist die Zahl
null: 61 Aufrufe, 30 Rümpfe, 7 Abfragen, keine Lücke. Was der Lauf nicht misst, sind **Werte** —
dass `stopRunning` da ist, nicht dass ein Wahrheitswert darin steht.

**Der erste Lauf fand einen echten Befund:** `POST /todo-statuses` nahm `color` nicht entgegen,
während die Oberfläche es sendete. Dieselbe Bauart wie `nurOffene`. Die Route liest es jetzt
(T-051); bis dahin entstand jede Spalte farblos, und die Farbe ließ sich nur mit einem zweiten
`PATCH` setzen. Bemerkenswert daran ist das Datum: Genau dieses `color` steht schon im Bericht zu
T-039 — dort als Feld, das die *Beschreibung* führte und der Dienst nicht las. Die Antwort war
damals, es aus der Beschreibung zu streichen. Dass zugleich die *Oberfläche* es sendete, hat
niemand gesehen, weil niemand danach gesehen hat.

### 5.1 Ressourcenschnitt

Grundpfad `/api/v1`. Substantive, Mehrzahl, Bindestrich statt Unterstrich, kein Verb im Pfad.

| Ressource | Anmerkung |
|---|---|
| `/todos`, `/todos/{id}` | Ohne internen Vermerk |
| `/todos/{id}/note` | Eigene Ressource, siehe Abschnitt 4 |
| `/todos/{id}/done` | `PUT` erledigt, `DELETE` hebt auf. Ein Zustand als eigene Ressource, nicht ein Feld — der Vorgang hat eine eigene Bedeutung (A-2.4, I-03) |
| `/tag-tree` | Ganzer Baum in einem Aufruf (A-10.4). Kein Aufruf je Ebene |
| `/tags`, `/tag-folders` | |
| `/tag-folders/{id}/move` | Eigene Route, weil eine fachliche Prüfung daran hängt und der Fehlerfall ein eigener ist (A-4.6) |
| `/pools`, `/pools/{id}/todos` | Mitglieder abgeleitet (A-3.4). Seit E-054 ist eine **Kanban-Spalte dieselbe Entität**: `placement` (`pool`/`board`/`both`) sagt, wo eine Regel erscheint. Wer eine Spalte anlegt, legt hier an; `GET /pools` liefert ohne Angabe die Pool-Liste. Jede ausgelieferte Regel trägt seit T-080 ihre Auflösung (`resolved`) |
| `/board` | Das Kanban-Board, nur lesend (E-054). Die Spalten in ihrer Reihenfolge, je Spalte die erste Seite, und die Karten, die in **mehr als einer** Spalte stehen. Kein `PUT`, das eine Karte verschiebt: Ziehen ist mit E-054 entfallen, weil sich eine Regel nicht durch Verschieben umkehren lässt, ohne Tags zu setzen. Weiter geblättert wird je Spalte über `/pools/{id}/todos` — eine Spalte ist ein Pool |
| `/todo-statuses`, `/todo-statuses/order` | Der **Status** eines Todos, seit E-054 nicht mehr die Kanban-Spalte. Reihenfolge vollständig, nicht in Teilstücken |
| `/time-entries` | |
| `/time-entries/{id}/export-status` | Nur nach `open` setzbar (E-012) |
| `/time-entries/{id}/not-billed` | Ausbuchen ohne Abrechnung (E-047). Eigener Vorgang, eigener Ereignistyp im Protokoll — kein Export |
| `/timer`, `/timer/start`, `/timer/stop`, `/timer/orphaned/resolve` | Siehe unten. Jeder schreibende Vorgang dieser Zeile liefert `poolMovement` (E-058 Punkt 6) — und er ist damit nicht allein: Die vollständige Liste aller Routen, die das Feld tragen, steht am Bauteil `PoolMovement` der Schnittstellenbeschreibung |
| `/export/templates`, `/export/runs` | |
| `/export/audit` | Filter `timeEntryId` **und** `exportRunId` (T-042), einzeln oder zusammen. „Welche Buchungen waren in diesem Lauf?" ist damit vollständig beantwortbar; bis dahin siebte die Oberfläche die geladene Seite, und ein Lauf, der länger als eine Seite ist, verdrängte jeden älteren daraus |
| `/export/sources` | Die geschlossene Auswahlliste als **Auskunft** des Dienstes (E-049). Die Oberfläche fragt, statt zu wissen — sonst stünde die Liste ein zweites Mal in `apps/web`, das `@takt/export` nicht einbinden darf |
| `/export/preview` | Nimmt eine Vorlagenkennung **oder** eine ungespeicherte Definition (E-051). Geprüft wird die Definition mit derselben Funktion wie beim Speichern, geschrieben wird nichts. Ein Exportlauf nimmt umgekehrt keine Definition entgegen |
| `/settings`, `/settings/default-tags` | Das Add-in-Token ist **nicht** Teil der Einstellungen (E-009). `GET /settings` liefert daneben drei Auskünfte, die keine Einstellungen sind: den Zustand des Exportordners samt Merkmalen (R-11, T-039), den **Windows-Benutzernamen** und den **Pfad des Bestands** (T-042). Die beiden letzten standen vorher nur in `ExportRun`, also erst nach dem ersten Export — genau davor will man wissen, unter welchem Namen abgerechnet wird und wo die Datei liegt (E-042, E-018, R-13) |
| `/search` | Trifft Todos **und** Zeitbuchungen (E-038). Zwei Listen, keine gemischte |
| `/addin/*` | Die schmale Fläche des Outlook-Add-ins: vier Routen, kein Löschen, kein Export, kein Vermerk (T-019, RR-1). Seit T-034 ist das auch die **Rechte**grenze und nicht nur die Routenliste des Add-ins — siehe 6.7 |
| `/token` | `GET` Zustand, `POST` neu erzeugen. Nur mit dem Sitzungsgeheimnis, siehe 6.4 |
| `/security/notices` | Fehlversuche und Vorfälle als Zählwerte, ohne einen Wert aus einer Anfrage |
| `/health` | Hinter der Token-Prüfung, siehe 6.3 |

**Warum `/timer/start` und `/timer/stop` statt `POST` und `DELETE` auf `/timer`.** Die
Ressourcenform wäre sauberer, aber beide Vorgänge tragen Fachlogik, die ein Leser der
Schnittstelle sehen soll: Der Start kann eine Rückfrage auslösen und einen Erledigt-Status
aufheben, der Stopp liefert eine erzeugte Buchung oder verwirft sie. Ein `DELETE`, das einen
Datensatz zurückgibt, verschleiert das mehr, als die Form es einbringt. Die Regel „Verben
sparsam" heißt sparsam, nicht nie.

Seit T-093 tragen beide Antworten zusätzlich `poolMovement` — die Auskunft, welche Pools und
Spalten das Todo durch diese Handlung betritt und verlässt. Sie ist kein Ersatz für `doneCleared`:
Das eine sagt, **was geschehen ist**, das andere, **was daraus folgt**.

**Blätterung mit Fortsetzungsmarke, nicht mit Seitenzahl.** Listen verschieben sich unter einem
laufenden Timer. Eine Seitenzahl zeigt dann Einträge doppelt oder gar nicht. Der Aufwand ist
derselbe, der Fehler entfällt.

### 5.2 Statuscodes

| Code | Wann |
|---|---|
| `200` | Erfolgreiches Lesen, Ändern, Timerstopp |
| `201` | Angelegt, mit `Location` |
| `204` | Gelöscht |
| `400` | Kein gültiges JSON, kaputte Anfrage |
| `401` | Token fehlt, ungültig oder ersetzt. Nennt keinen Grund |
| `403` | Token gültig, aber Herkunft, Abrufkontext oder Zielrechner nicht zugelassen |
| `404` | Nicht vorhanden |
| `413` | Anfragerumpf über 1 MB |
| `415` | Kein `application/json` auf einer zustandsändernden Route. Geprüft vor dem Lesen des Rumpfs |
| `409` | Widerspruch zum Zustand: `timer_already_running`, `time_entry_locked`, `tag_folder_cycle`, `tag_folder_not_empty`, `tag_in_use`, `export_status_not_settable`, `export_nothing_to_do`, `status_in_use` |
| `422` | Wohlgeformt, aber fachlich unzulässig: `validation_error`, `export_source_forbidden`, `export_directory_missing` |
| `500` | Unerwartet. Immer derselbe Text, nie Innenleben |

**`400` gegen `422`:** `400` bedeutet, der Dienst konnte die Anfrage nicht lesen; `422`, er hat
sie gelesen und für unzulässig befunden. Die Unterscheidung ist beim Add-in nützlich, weil sie
sagt, ob der Aufruf oder die Eingabe des Benutzers falsch war.

**`401` gegen `403`:** `401` heißt „das Token stimmt nicht", `403` „das Token stimmt, aber du
darfst von dort nicht". Die Trennung hilft dem Benutzer beim Einrichten des Add-ins erheblich —
„falsches Token" und „falscher Browser" sind unterschiedliche Probleme. Sie verrät einem
Angreifer, der ein Token besitzt, dass es gültig ist. Der weiß das ohnehin. **Anmerkung für
T-003:** Falls die Bewertung dort anders ausfällt, lässt sich `403` ohne Änderung an der Domäne
zu `401` zusammenlegen; die Zuordnung steht an genau einer Stelle im HTTP-Adapter.

### 5.3 Fehlerformat

```json
{
  "error": {
    "code": "tag_folder_cycle",
    "message": "Ein Ordner kann nicht unter einen seiner eigenen Unterordner verschoben werden.",
    "details": [{ "field": "newParentId", "message": "…", "code": "cycle" }]
  }
}
```

- `code` ist der englische technische Schlüssel und die einzige Größe, gegen die ein Aufrufer
  verzweigt. `message` ist deutscher Anzeigetext (CLAUDE.md). Beide bleiben getrennt, damit ein
  Text sich ändern lässt, ohne Aufrufer zu brechen.
- `details` trägt die Einzelbefunde: bei einer Eingabeprüfung je beanstandetem Feld einen, bei
  einer **Sperre** je betroffenem Datensatz einen. Der zweite Fall hat kein Eingabefeld, dem
  etwas vorzuwerfen wäre — eine Löschung besteht aus einem Pfadbestandteil —, und trägt deshalb
  in `field` die **Kennung** des betroffenen Datensatzes.
- Ein Befund darf zusätzlich `name` tragen: den bloßen Namen des betroffenen Dings, ohne
  Gattungswort und ohne Anführungszeichen (`Ost`, nicht `Regel „Ost“`). Er steht da, **damit
  niemand den Namen aus `message` herausschneidet** — ein Schnitt im fremden Text ist eine
  ungeschriebene Abmachung über dessen Wortlaut und bricht still, sobald der Dienst seinen Satz
  ändert (W-11 aus R-2a, T-097 Annahme 1). `message` bleibt daneben unverändert stehen; wer
  `name` nicht kennt, verliert nichts. Genutzt wird es heute von den Sperren, die eine Regel
  nennen (`code: "pool_rule"` beim Löschen von Tag, Ordner und Status).
- **Nie enthalten:** Ablaufverfolgung, SQL-Meldung, Dateipfad außerhalb des gewählten
  Exportordners, das Token, Innenleben der Datenbank.
- Ein unerwarteter Fehler wird vollständig ins lokale Protokoll geschrieben und nach außen als
  `{"error":{"code":"internal_error","message":"Ein unerwarteter Fehler ist aufgetreten."}}`
  beantwortet — immer derselbe Text.

### 5.4 Fehler über die Schichtgrenzen

```
   Speicherung             Domäne                 HTTP
   SQLITE_CONSTRAINT   ►   TaktError         ►    Statuscode + Hülle
   'time_entry_locked'     code: 'time_entry_locked'   409
   UNIQUE ux_..._running   'timer_already_running'     409
   CHECK export_status     'validation_error'          422
```

Die Domäne meldet fachliche Fehlschläge als **Wert**, nicht als Wurf:
`Result<T, TaktError>`. Ein Ergebnis, das man auswerten muss, lässt sich nicht übersehen; ein
`catch` schon. Geworfen wird nur bei Fehlern, die kein fachlicher Fall sind — Datei nicht
lesbar, Datenbank beschädigt.

Der Adapter übersetzt SQLite-Meldungen an genau einer Stelle in `TaktError`. Die Trigger tragen
deshalb absichtlich dieselben Zeichenketten wie die Fehlerkennungen der Domäne
(`time_entry_locked`, `append_only`, `builtin_template_immutable`).

#### Wie SQLite seine eindeutigen Indizes benennt (T-074)

Die Zuordnung „Indexverletzung → Fehlerschlüssel" hängt daran, was in der Meldung von SQLite
steht — und das ist **nicht** immer der Indexname. Gemessen mit `node:sqlite`:

| Index | Meldung |
|---|---|
| `ON t (pos)` | `UNIQUE constraint failed: t.pos` |
| `ON t (name COLLATE NOCASE)` | `UNIQUE constraint failed: t.name` |
| `ON t (a, b, c)` | `UNIQUE constraint failed: t.a, t.b, t.c` |
| `ON t (COALESCE(x,'~'), name)` | `UNIQUE constraint failed: index 'ux_…'` |
| `ON t ((1)) WHERE flag = 1` | `UNIQUE constraint failed: index 'ux_…'` |

Nur ein Index über einen **Ausdruck** oder mit **WHERE-Bedingung** trägt seinen Namen; ein Index
über nackte Spalten nennt die Spalten. `COLLATE NOCASE` ist keine Rechnung, sondern eine
Vergleichsvorschrift, und ändert daran nichts.

Bis T-074 suchte `errors.ts` je Eintrag nur nach dem Indexnamen. Sieben von zwölf Einträgen waren
damit unerreichbar — darunter `ux_pool_name` und `ux_todo_status_name`, die beide einen genaueren
Satz trugen, den nie jemand zu sehen bekam. Jeder Eintrag führt seitdem die Suchbegriffe, die für
**seinen** Indextyp auftreten, und `proof:conflicts` löst jeden Index des Schemas einmal aus,
statt die Zuordnung zu behaupten.

#### Das Netz am Rand — und warum es keinen Fehlerzweig ersetzt

Ein Adapter, der eine Regel der Datenbank durchschlagen lässt, war bis T-074 ein `500`:
`POST /pools` mit vergebenem Namen antwortete `internal_error` (gemessen in T-072). Der
Unterschied ist nicht kosmetisch — ein `500` sagt „bei mir ist etwas kaputt", und die Oberfläche
rät daraufhin zum erneuten Versuch, der genauso scheitert.

`app.onError` fragt deshalb zuerst `asStorageFailure(error)`. Ist der Wurf eine SQLite-Störung,
wird er wie jeder fachliche Fehler beantwortet; sonst bleibt er ein `500` ohne Innenleben. Die
Reihenfolge der Ebenen ist damit:

```
   1. Anwendungsfall prüft vorher   → genaue Meldung, nennt den Namen
   2. attempt / attemptAtomically   → Fehlschlag als Wert, Sicherungspunkt zurück
   3. app.onError + asStorageFailure→ das Netz: richtiger Code, allgemeiner Satz
```

Ebene 3 ersetzt Ebene 1 nicht. Sie sagt „ein doppelter Wert", wo der Anwendungsfall sagen könnte,
welcher. `proof:conflicts` misst deshalb beides: dass keine Route mit `500` antwortet **und** dass
die Antwort einen Schlüssel trägt, gegen den eine Oberfläche verzweigen kann.

#### Eine Regel, die nur in der Oberfläche steht, ist keine Regel (T-073, T-074)

Der verwandte Befund, und die vierte Ebene, die es **nicht** gibt: `apps/web` sperrte das Löschen
des Standard-Status und schrieb hin, dass der Standard sich nur weitergeben und nicht abwählen
lässt. Der Dienst kannte beides nicht. Wer die Route unmittelbar aufrief, ließ den Bestand ohne
Standard zurück — und `TodoStatusPort.defaultStatus()` fiel **still** auf den ersten Status nach
Position. Ein neu angelegtes Todo bekam danach einen anderen Status, ohne dass jemand es erfahren
hätte.

Der partielle Index `ux_todo_status_default` konnte das nicht aufhalten: Er sichert „höchstens
ein Standard", nicht „mindestens einer". Die Zusage steht seit T-074 im Adapter, mit einem
eigenen Fehlerschlüssel (`default_status_locked`, 409), den die Oberfläche lesen kann — so wie
`status_in_use`.

Die Prüffrage, die daraus folgt und die in keinen Prüflauf passt, weil sie über Schichten geht:
**Welche Zusicherung steht nur in `apps/web`?** Ein gesperrter Knopf ohne Fehlerschlüssel
dahinter ist eine Vermutung über den Dienst, keine Eigenschaft von ihm.

### 5.5 Was der Dienst zur Laufzeit über sich wissen darf (T-053)

Der Dienst läuft in zwei Gestalten: aus dem Quelltext (Entwicklung, alle Nachweispfade, alle
Tests) und als **eine Binärdatei** (Node-SEA, Auslieferung). Zwischen beiden liegt ein Unterschied,
den man nicht sieht und der deshalb dreimal überlesen wurde:

> **Im Bündel gibt es den Quelltext nicht mehr.** `import.meta.url` ist dort leer, `__dirname`
> zeigt nicht dorthin, wo die Datei einmal lag, und ein Verzeichnis neben der Datei gibt es
> ohnehin nicht. Jede Annahme über den Ort des Quelltextes ist eine Annahme, die genau in der
> ausgelieferten Fassung nicht gilt.

T-053 war der Fall, an dem das aufgeflogen ist: Die Anwendung startete nicht. `openDatabase` suchte
die Migrationsdateien über `new URL('../../migrations/', import.meta.url)`, esbuild hatte
`import.meta` zu einem leeren Objekt gemacht, und der `TypeError: Invalid URL` fiel in `compose()`
— **vor** dem Lauschen. Dieselbe Annahme stand ein zweites Mal in der Wegsuche des
Aufgabenbereichs.

Daraus folgen drei Regeln:

* **Was zur Laufzeit gebraucht wird, geht durch den Bündler oder liegt neben der Binärdatei.**
  Die Migrationen sind seit T-053 in `packages/storage/src/sqlite/migrations.embedded.ts`
  eingebettet — wörtlich, Zeichen für Zeichen, weil `schema_migration.checksum` der SHA-256 über
  den Inhalt der Vorwärtsdatei ist und eine geglättete Kopie jeden bestehenden Bestand als
  „nachträglich verändert" abgewiesen hätte. Das Bündel des Aufgabenbereichs liegt neben der
  Binärdatei und wird über `process.execPath` gefunden — der Wert gilt in beiden Gestalten.
* **Der einzige feste Punkt ist `process.execPath`.** Nicht `process.cwd()`: Das
  Arbeitsverzeichnis setzt der, der den Prozess startet, und die Hülle verspricht darüber nichts.
  Nicht `import.meta.url`. Wer den Ort des Quelltextes trotzdem braucht — für einen
  Entwicklungspfad —, holt ihn über eine Funktion, die im Bündel `null` liefert, und behandelt
  `null` als normalen Zustand. Ein Wurf aus einer Wegsuche nimmt den ganzen Start mit.
* **Eine Kopie braucht einen Abgleich.** Das eingebettete Abbild ist eine Kopie der `.sql`-Dateien
  und liefe sonst auseinander. `openDatabase` liest deshalb, solange das Verzeichnis vorhanden ist
  (also im Quelltextbetrieb und in jedem Test), **beides** und hält es gegeneinander; eine
  Abweichung ist ein Fehler mit dem Befehl, der sie behebt
  (`pnpm --filter @takt/storage migrations:embed`). In der Binärdatei fehlt das Verzeichnis, dort
  gibt es nichts abzugleichen.

**Und der eigentliche Befund von T-053 ist keiner über Pfade.** Elf Nachweispfade, 556 Vitest-Fälle
und 28 End-to-End-Fälle waren grün, während die ausgelieferte Anwendung nicht startete — weil jeder
einzelne aus dem Quelltext lief. Der einzige Lauf, der die Binärdatei ausführt,
`pnpm --filter @takt/desktop sidecar:verify`, hätte den Fehler gefunden und stand in keiner Kette,
die jemand ausführt. Er prüft seit T-053 zwanzig statt zwölf Dinge, startet die Binärdatei aus
einem nachgebauten **Installationsbild** (Binärdatei, daneben das `taskpane`-Bündel) mit einem
leeren Arbeitsverzeichnis und verlangt beide Ports: 17843 mit einer Fachroute, die nur aus einem
migrierten Schema antworten kann, und 17844 mit der `index.html` aus dem Bündel neben der Datei.

---

## 6. Token und Vertrauensgrenze

Umgesetzt in T-011, bewertet in T-003. Der Quelltext liegt in
`apps/local-api/src/access/` und `apps/local-api/src/http/`.

### 6.1 Wozu

Ein Dienst auf `127.0.0.1` nimmt Anfragen von jedem Prozess auf dem Rechner an, auch von einer
beliebigen Webseite im Browser des Benutzers (R-02). Er hält Kundendaten. E-009 setzt dagegen ein
Token, das die Anwendung erzeugt und der Benutzer im Add-in einträgt.

### 6.2 Eigenschaften

| Punkt | Festlegung |
|---|---|
| Erzeugung | `crypto.randomBytes(32)` als base64url, mit dem Präfix `takt_` — 48 Zeichen, 256 Bit. Ausschließlich vom Dienst, nie von der Oberfläche, nie vom Add-in |
| Ablage | **Nur der SHA-256-Abdruck**, in einer eigenen Datei unter `%LOCALAPPDATA%\Takt\` beziehungsweise `~/.local/share/takt/` (E-018). Verzeichnis `0700`, Datei `0600`, atomar geschrieben. **Nicht** in der Datenbank |
| Anzeige | Der Klartext entsteht einmal und wird genau einmal herausgegeben — als Antwort auf `POST /token`. Danach ist er nicht wieder abrufbar. Wer ihn verliert, erzeugt ein neues |
| Übertragung | Eigene Kopfzeile `X-Takt-Token`. Kein Cookie, keine Sitzung, kein `Authorization`. Nie in der Adresse — eine Anfrage mit Token in der Adresse wird mit 400 abgewiesen und das Token gilt als kompromittiert |
| Vergleich | Zeitkonstant über die SHA-256-Abdrücke beider Seiten. Der Umweg über den Abdruck ist nötig, weil ein direkter zeitkonstanter Vergleich bei ungleicher Länge scheitert und damit die Länge verriete. Kein früher Ausstieg: fehlende, leere und falsche Kopfzeile nehmen denselben Weg |
| Neuerzeugung | Genau ein gültiger Abdruck. Die Umbenennung der Datei ist der Umschaltpunkt; ab da schlagen Anfragen mit dem alten Token fehl. Keine Liste, keine Nachfrist |
| Protokoll | Erscheint nie in Protokollausgaben, nie in Fehlermeldungen, nie in einer Antwort außer der einen Erzeugungsantwort |
| Fehlversuche | Werden gezählt. Ab zehn in einer Minute ansteigende Verzögerung, gedeckelt, und eine sichtbare Warnung unter `/security/notices` |

**Warum eine eigene Datei und nicht die Datenbank.** Die Datenbankdatei wird kopiert — für eine
Sicherung, zur Fehlersuche, in einen Ordner, der mit einem Cloud-Dienst abgeglichen wird. Ein
Token darin wandert mit. Getrennt abgelegt bleibt es zurück.

**Warum nur der Abdruck und nicht der Klartext.** T-001 hatte hier den Klartext vorgesehen, damit
die Oberfläche ihn wieder anzeigen kann. Das Bedrohungsmodell empfiehlt in B-2.2 das Gegenteil,
und die Empfehlung ist die bessere: Wer die Datei liest — ein anderer Benutzer des Rechners, ein
Sicherungsagent, wer den Rechner in die Hand bekommt —, hält dann keinen Schlüssel in der Hand,
sondern einen Abdruck. Der Preis ist eine Bedienregel: Der Klartext wird einmal gezeigt, und wer
ihn verliert, erzeugt ein neues. Diese Änderung gegenüber T-001 ist bewusst und im Bericht zu
T-011 als Annahme geführt.

### 6.3 Warum auch `/health` das Token verlangt

Es gibt keine offene Route, auch keine Zustandsabfrage. Eine unauthentifizierte Antwort verriete
jedem lokalen Prozess und jeder Webseite, dass Takt läuft und auf welchem Port. Das Add-in
benutzt `/health` für „Verbindung testen" und schickt dabei das Token mit — die Route ist damit
keine Ausnahme vom Nachweis, sondern der erste Fall, in dem das Token gebraucht wird.

Die Antwort lautet `{"data":{"status":"ok"}}` und sonst nichts. Keine Fassung, kein Pfad, kein
Benutzername, keine Bestandsgröße.

Von der **Rechtevorgabe** aus 6.7 ist sie sehr wohl eine Ausnahme, und zwar die einzige. Sie
steht dort ausgeschrieben.

### 6.4 Zwei Maßnahmen gegen zwei Angreifer — nicht zwei Schichten gegen einen

Das ist der Punkt, an dem eine falsche Vorstellung teuer wird. B-2.9 beantwortet die Frage
ausdrücklich: **Die Herkunftsprüfung fängt einen Tokendiebstahl nicht auf.**

**Der Nachweis** wirkt gegen einen beliebigen lokalen Prozess. Gegen diesen Akteur ist er die
einzige Maßnahme, die überhaupt wirkt.

**Die Herkunftsprüfung** wirkt gegen eine fremde Webseite im Browser des Benutzers, weil ein
Browser sie zu wahrheitsgemäßen Werten zwingt. Gegen einen lokalen Prozess ist sie wirkungslos:
Drei Zeilen Skript setzen `Host: 127.0.0.1:17843` und `Origin: tauri://localhost` von Hand.

Keine ersetzt die andere. Wer die eine für eine Reserve der anderen hält, baut beim nächsten
Umbau die falsche weg. Der Kommentarkopf von `access/origin-policy.ts` sagt das noch einmal
dort, wo es jemand liest, der die Datei ändert.

Im Einzelnen prüft der Dienst, in dieser Reihenfolge:

**Zielrechner.** `Host` muss buchstäblich `127.0.0.1:<port>` oder `localhost:<port>` sein, sonst
403. Kein Platzhalter, kein `startsWith`. Das schließt DNS-Rebinding aus — den Angriff, bei dem
ein Angreifer einen von ihm kontrollierten Namen auf `127.0.0.1` auflösen lässt und damit die
Herkunftsprüfung des Browsers umgeht. Die Prüfung steht **vor** dem Nachweis, damit über sie am
Token nicht einmal ein Zeitunterschied beobachtbar ist.

**Herkunft.** Ist ein `Origin`-Kopf vorhanden, muss er zeichengleich auf der Liste stehen. Eine
vorhandene, aber nicht gelistete Herkunft wird **abgewiesen**, nicht nur ohne CORS-Kopfzeilen
beantwortet — sonst tritt die Wirkung einer zustandsändernden Anfrage ein, obwohl der Browser
die Antwort verwirft.

**Abrufkontext.** `Sec-Fetch-Mode: navigate` wird abgewiesen; `Sec-Fetch-Site` außer `none` und
`same-origin` ohne gelistete Herkunft ebenfalls. Diese Kopfzeilen sind aus Seitenskripten nicht
setzbar.

**Inhaltstyp.** Zustandsändernde Routen nehmen ausschließlich `application/json` an, geprüft vor
dem Lesen des Rumpfs. Zusammen mit der eigenen Kopfzeile erzwingt das eine Vorabanfrage, die ein
Angreifer aus einem fremden Tab nicht besteht.

**Keine Cookies, keine Anmeldedaten.** `Access-Control-Allow-Credentials` bleibt aus, der
Nachweis steht in einer eigenen Kopfzeile. Damit gibt es keine Berechtigung, die ein Browser von
sich aus mitschickt — die CSRF-Klasse hat keine Grundlage mehr.

### 6.5 Zwei Sorten Nachweis, und warum

B-2.9 Punkt 3 schlägt vor, den Oberflächenpfad vom Add-in-Token zu trennen. Umgesetzt:

| Sorte | Herkunft | Lebensdauer | Wofür |
|---|---|---|---|
| Sitzungsgeheimnis | von der Tauri-Hülle über `stdin` an den Sidecar | je Start | die Oberfläche |
| Add-in-Token | in der Anwendung erzeugt, vom Benutzer eingetragen | bis zur Neuerzeugung | das Outlook-Add-in |

Beide gehen durch dieselbe Kopfzeile und denselben zeitkonstanten Vergleich; beide Vergleiche
laufen bei jeder Anfrage, unabhängig vom Ergebnis des ersten.

Das trägt mehreres auf einmal; die Aufzählung darunter ist die vollständige, eine Zahl steht
hier bewußt nicht (B-9, T-117):

1. **Das Sitzungsgeheimnis berührt nie die Platte** und ist beim nächsten Start ein anderes. Ein
   Browser kann es nicht kennen.
2. **`/token` und `/security/notices` verlangen es.** Ein entwendetes Add-in-Token kann sich
   damit weder anzeigen noch selbst austauschen — der Aussperrangriff fällt weg.
3. **Der Sidecar startet ohne es nicht** (B-1.6). Das gebündelte Binärprogramm liegt im
   Installationsverzeichnis und ist ausführbar; ohne diese Hürde startet ein Angreifer es selbst,
   zeigt es auf die echte Datenbank und kennt das Token, weil er es gesetzt hat. Über `stdin` und
   nicht über die Befehlszeile, weil Befehlszeilen für jeden Prozess im System sichtbar sind.
   Endet `stdin`, endet der Dienst — ein verwaister Sidecar mit Datenbankzugriff und ohne Fenster
   ist genau das, was hier verhindert wird.
4. **Die zweite `stdin`-Zeile trägt den Windows-Benutzernamen** (E-042), und er wird geprüft, nicht
   geglaubt. Seit T-122 gegen dieselbe Zeichenklasse wie jeder Name und jeder Titel
   (`characters.ts` in `@takt/domain`, O-AE); bis dahin nur gegen C0 und DEL. Der Grund ist der
   Weg des Wertes: Er geht **unverändert** als `WindowsUser` in die Exportdatei (A-8.5), und ein
   Richtungszeichen darin dreht eine Zeile der Datei, die beim Abrechnungstool landet. Ist der
   Name leer oder trägt er solche Zeichen, startet der Dienst nicht (Beendigungscode 78, Gründe
   `user_missing` und `user_invalid`); die Meldung nennt den Grund und gibt den Wert nicht wieder.
   `pnpm proof:access` misst beides — die drei Bauarten am abgewiesenen Namen und die Gegenprobe,
   daß ein Name mit Umlaut, Leerzeichen und Punkt weiterhin startet.
5. **Das Anhalten hat eine Frist** (T-126, Befund T-125-4). „Endet `stdin`, endet der Dienst"
   galt bis dahin mit einer Fußnote: `server.close()` wartet auf offene Verbindungen, und eine
   Verbindung mit einer **halben** Anfrage räumt Node nicht von selbst ab — sie läuft erst in
   `headersTimeout` (60 s) oder `requestTimeout` (300 s). Ein beliebiger Prozess auf demselben
   Rechner konnte das Ende des Dienstes damit verzögern, ohne ein Geheimnis zu kennen; eine
   TCP-Verbindung und ein halber Anfragekopf genügten. Seit T-126 reißt `shutdown()` die
   Verbindungen mit `closeAllConnections()` ab und hat mit `SHUTDOWN_DEADLINE_MS` einen Boden
   darunter. Gemessen mit `proof:access` Abschnitt 0e: ohne die Behebung nach 20 s noch laufend,
   mit ihr nach 8 ms beendet; legt man nur den Boden, sind es 2010 ms und eine Zeile im Protokoll
   — der Abschnitt prüft ausdrücklich, daß sie im Normalfall nicht erscheint.

   **Die Reihenfolge im Start ist Absicht.** `server.listen` steht vor `watchParentLink`, der
   Dienst hört also auf `127.0.0.1`, bevor der Wächter angemeldet ist. Das ist seit T-122 kein
   Fenster mehr, in dem eine Meldung verlorengeht: Der Handschlag hält `stdin` mit `pause()` an,
   und der Wächter holt ein bereits liegendes Dateiende mit seinem `resume()` ab. Es wird nur
   **später zugestellt** — nämlich dann, wenn der Dienst fertig gebaut ist. Genau darum steht der
   Wächter dort: Ein Anhalten mitten im Start müßte sonst mit halbem Bestand umgehen, ohne
   Datenbank, ohne Server, womöglich mitten in einer Migration. So gibt es einen Weg statt
   mehrerer, und er läuft immer auf demselben vollständigen Zustand.

**Port.** Fest vorgegeben (17843), gebunden ausschließlich auf `127.0.0.1`, exklusiv belegt. Ist
er belegt, startet Takt nicht und weicht nicht aus. Der Port ist ausdrücklich kein Geheimnis: Ein
zufälliger Port kostet Bedienbarkeit und bringt nichts, weil eine Webseite Loopback-Ports in
Sekunden abklopft. Der Dienst prüft nach dem Binden, dass er tatsächlich nur auf Loopback
lauscht, und beendet sich sonst.

### 6.6 Was das Add-in einhalten muss (Auflage für T-007)

1. **Das Token gehört in den `localStorage` der Add-in-Herkunft, nicht in
   `Office.context.roamingSettings`** (E-019, B-2.8, R-12). `roamingSettings` liegt im Postfach
   und wird über Exchange synchronisiert — das Geheimnis, das sämtliche lokalen Kundendaten
   öffnet, verließe damit den Rechner, bei einem Produkt, dessen erste Entscheidung „keine
   Cloudanbindung" lautet. In `roamingSettings` dürfen nur Werte stehen, die keine Geheimnisse
   sind: der reguläre Ausdruck und die Portnummer.
2. **Die Herkunft, unter der das Add-in ausgeliefert wird, muss in
   `apps/local-api/src/config.ts` eingetragen werden.** Sie steht dort noch nicht, weil sie noch
   nicht feststeht. Solange sie fehlt, weist der Dienst Add-in-Anfragen mit 403 ab. Das ist die
   richtige Voreinstellung — ein geratener Eintrag wäre eine Lücke.
3. Das Token geht in die Kopfzeile `X-Takt-Token`, nie in eine Adresse. Der Dienst weist eine
   Anfrage mit Token in der Adresse ab und behandelt das Token danach als kompromittiert.
4. Findet das Add-in kein Token, führt es den Benutzer zu seinen Einstellungen, statt eine
   Fehlermeldung zu zeigen.

---

### 6.7 Welcher der beiden Nachweise für welche Route genügt (B-2.10, T-034)

Bis T-034 klärte die Kette nur, **ob** ein gültiger Nachweis vorlag, nicht **welcher**.
`requireCredential('session')` stand an drei Routen; die übrigen sechzig nahmen beide
Geheimnisse an. Der security-checker hat in T-023 gemessen, was ein Add-in-Token damit erreichte:
den internen Vermerk lesen und überschreiben, den Exportordner auf einen frei gewählten Pfad
setzen und einen Exportlauf dorthin auslösen — zwei Aufrufe von einem dauerhaften Geheimnis zu
ausgeleiteten Kundendaten.

Der Fehler war nicht eine vergessene Route, sondern die **Richtung**. „Alles offen, drei
Ausnahmen" ist eine Positivliste, und eine Positivliste vergisst irgendwann etwas — dasselbe
Argument, mit dem die Kette als **eine** Middleware vor **allen** Routen steht statt als Prüfung
je Route.

**Die Vorgabe ist deshalb umgedreht:**

| Pfad | Verlangt |
|---|---|
| `/api/v1/addin` und alles darunter | `any` — Sitzungsgeheimnis **oder** Add-in-Token |
| `/api/v1/health` | `any` — die einzige benannte Ausnahme, siehe unten |
| **alles andere, auch jede künftige Route** | `session` |
| ein unbekannter Pfad | `session` → 401, nicht 404 |

Die Anforderung fällt am Pfad (`access/route-policy.ts`, rein und ohne laufenden Dienst
prüfbar), nicht an einer gepflegten Aufzählung. Eine neue Fachroute ist damit von selbst
geschlossen; wer sie öffnen will, muss diese eine Datei anfassen.

**Warum `/health` die Ausnahme sein darf.** Sie ist „Verbindung prüfen" in S-13 — der Knopf, mit
dem der Benutzer nachsieht, ob das gerade eingetragene Token stimmt. Sie gibt nichts heraus, sie
ändert nichts, und sie liegt weiterhin hinter dem Nachweis (6.3). Die sauberere Form wäre eine
eigene Route unter `/addin`; das berührt Hoheiten außerhalb von `apps/local-api` und ist als
offene Frage aus T-034 geführt.

**Warum die Entscheidung auf `c.req.path` fällt und nicht auf einer eigenen Normalisierung.**
Hono berechnet den Pfad einmal und benutzt dieselbe Zeichenkette für das Routing **und** für
`c.req.path`. Solange Prüfung und Router auf derselben Zeichenkette arbeiten, kann keine Anfrage
die Prüfung für `/addin` bestehen und danach bei einer Fachroute landen. Eine zweite Meinung über
die Gestalt des Pfades wäre genau die Abweichung, aus der solche Lücken entstehen. Enthält der
Pfad ein Punktsegment, wird die Anforderung gar nicht erst abgesenkt — abgelehnt wird die
Ausnahme, nicht der Pfad.

**Gemessen**, nicht behauptet: `pnpm --filter @takt/local-api proof:route-policy` fährt die vier
Messungen aus T-023 nach und danach **jede** registrierte Route aus der Routenliste des Dienstes
— 59 außerhalb der abgesenkten Fläche ergeben mit dem Add-in-Token 401, dieselben 59 mit dem
Sitzungsgeheimnis nicht. Die Aufzählung kommt aus `Hono#routes` und nicht aus der Prüfdatei;
eine künftig hinzugefügte Route wird von selbst mitgemessen (Bedrohungsmodell Abschnitt 7,
Prüfung 24).

## 7. Was noch folgt

| Aufgabe | Was sie von hier braucht |
|---|---|
| ~~T-009, Fachlogik~~ | **erledigt.** Die reinen Regeln stehen in `packages/domain` (Tabelle in 1.2) |
| ~~T-007, Exportvorlagen~~ | **erledigt.** `packages/export` liest ausschließlich `@takt/domain/export` |
| ~~T-008b, Hülle~~ | **erledigt.** Startgeheimnis und Benutzername über zwei `stdin`-Zeilen (E-042) |
| ~~T-021, Anwendungsfälle und Routen~~ | **erledigt.** SQLite-Adapter, Anwendungsfälle, alle Routen hinter der Kette aus 6.4, Aufgabenbereich über HTTPS (E-046) |
| T-022, Oberfläche | Die Routen aus 5.1 und das Fehlerformat aus 5.3. Der Exportstatus ist zweiwertig (E-032); „schon einmal exportiert" ist `open` mit `exportCount > 0` |
| T-012, End-zu-End | Die drei Prüfpfade unter `apps/local-api/scripts/` decken den Dienstanteil ab. Was fehlt, ist der Oberflächenanteil — insbesondere der DOM-Teil von TP-ADDIN-08 |
| T-023, Sicherheitsprüfung | `apps/local-api/openapi/takt-local-api.yaml`, 43 Pfade und 64 Operationen — seit T-039 maschinell gegen den Dienst gehalten, seit T-041 samt Antwortgestalten, Statuscodes und Kopfzeilen (`proof:openapi`, in der `check`-Kette). Dazu die Prüfpfade, die sich ohne Windows fahren lassen |
| ~~T-051, die dritte Seite~~ | **erledigt.** `proof:callers` hält die Aufrufer der Oberfläche gegen die Routenschemata (5.0a), ebenfalls in der `check`-Kette |

### Bibliotheken

`package.json` ist eine gemeinsame Datei; Einträge werden beim Orchestrator angemeldet. Für
`apps/local-api` sind sie mit T-011 installiert.

| Paket | Stand | Wofür |
|---|---|---|
| `node:sqlite` | eingebaut (E-035) | SQLite-Anbindung ohne natives Modul. Der Zugriff läuft über den Adapter in `packages/storage`; erweist sich das Modul als untragbar, wird der Adapter getauscht, nicht die Fachlogik |
| `hono` 4.13.4 | installiert | HTTP. Klein, ohne native Anteile, was die Sidecar-Bündelung entlastet |
| `@hono/node-server` 2.1.1 | installiert | Node-Adapter für Hono. `createAdaptorServer` gibt den `http.Server` heraus, ohne selbst zu lauschen — nur so lässt sich `exclusive: true` setzen und die Bindeadresse nach dem Binden prüfen |
| `zod` 4.4.3 | installiert | Prüfung am Rand. Nur im eingehenden Adapter, nie in der Domäne. Prüft heute die Tokendatei, künftig die Anfragerümpfe |

Alle drei mit **fester Fassung** ohne `^`, weil sie im Abrechnungs- und Zugriffspfad liegen
(B-10.2, B-10.7). Eine Aktualisierung ist damit eine sichtbare Änderung an der `package.json`
und nicht ein stiller Sprung beim nächsten `pnpm install`.

`@hono/zod-openapi` ist **nicht** installiert. Es würde die Beschreibung aus dem Quelltext
erzeugen, was auf Dauer richtig ist, aber die vorhandene, handgeschriebene Beschreibung mit 54
Operationen wäre dafür neu zu schreiben. Das gehört in eine eigene Aufgabe, sobald die
Fachlogik-Routen stehen, nicht in die Prüfschicht.
