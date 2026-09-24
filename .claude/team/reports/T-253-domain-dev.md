# T-253-2 — Zwei Befunde aus Welle 4, beide vor Welle 5 fällig

Aufgabe: T-253-2 — `REGRESSIONS` an der Anforderung aufspannen, `NOT_CALLED_BY_UI` von
Leichen befreien
Status: fertig
Artefakte: `apps/local-api/scripts/proof-callers.mjs` (einzige geänderte Datei), dieser Bericht

## Zusammenfassung

Die Selbstprobe in Abschnitt 6 verlangte **genau eine** Trägerdatei je Regression und maß damit
die Aufteilung der Merkmalsordner statt der Blindheit des Lesers. Sie verlangt jetzt eine
**Untergrenze** (mindestens eine Trägerin, sonst rot) und prüft **jede** tragende Datei einzeln;
zwei Trägerinnen sind damit zwei Proben statt eines Fehlschlags. In `NOT_CALLED_BY_UI` sind
`getBoard` und `getVersionCheck` gestrichen — beide Übergaben sind eingelöst und die Absätze
daneben behaupteten seit Wellen einen Bauzustand, den es nicht mehr gab. Damit das nicht wieder
am Lesen hängt, messen sich beide Ausnahmelisten dieses Laufs jetzt selbst: ein Eintrag, der
**doch angerufen** wird, und ein Eintrag, den die Beschreibung **nicht mehr führt**, machen den
Lauf rot. Dieser neue Wächter hat sofort eine **dritte** Leiche gefunden, die niemand gemeldet
hatte: `NEVER_SENT.createTodo: ['tagNames']` (T-058) — die Oberfläche sendet `tagNames` seit
`features/todos/TodoFormDialog.tsx:113`. Auch sie ist gestrichen.

`pnpm --filter @takt/local-api proof:callers`: **74 bestanden, 0 fehlgeschlagen** (vorher 61/0),
sechs Aufrufdateien, 75 Aufrufe, 149 durchgesehene Dateien — die Ernte ist unverändert, die
dreizehn zusätzlichen Prüfsätze sind alle neu und alle gemessen.

---

## 1 `REGRESSIONS` — was die Selbstprobe zusichern soll

### Der alte Satz war nicht nur zu eng, er war falsch

Im Quelltext stand als Begründung für „genau eine Trägerin":

> Zwei heißt: Der Zuwachs unten wäre zwei, und die Probe verlangt eins — sie stünde dann falsch
> da, ohne daß jemand es merkt.

Das stimmt nicht. Verdorben wird **eine** Datei, mit `String.replace` ohne `g` an genau **einer**
Stelle; der Zuwachs ist eins, gleichgültig wie viele andere Dateien dieselbe Stelle auch tragen.
Die Zahl hat nie gemessen, was sie zu messen vorgab. Gemessen hat sie die **Aufteilung des
Ordners** — und genau daran ist Welle 4 kurzzeitig zerbrochen und danach zufällig wieder heil
geworden.

### Was jetzt zugesichert wird

> **Der Leser ist nicht blind. Setzt man einen der vier Fehler aus T-050 in eine Aufrufdatei
> zurück, beanstandet er ihn — in jeder Datei, die die Stelle trägt, und in wenigstens einer.**

Diese Zusage kennt keine Dateizahl. Daraus folgen zwei Prüfsätze je Probe:

1. **Untergrenze.** Mindestens eine Trägerin, mit Namen in der Ausgabe. Keine heißt: Die Stelle
   ist umgeschrieben worden, die Probe greift ins Leere und darf nicht als bestanden durchgehen —
   der Unterschied zwischen „nichts gefunden" und „nichts angesehen".
2. **Je Trägerin ein Zuwachs.** Jede tragende Datei wird einzeln verdorben und muß genau eine
   Beanstandung der erwarteten Art mehr ergeben.

Dazu eine Gegenprobe, die **die Regel** prüft und nicht den Bestand: Eine erfundene Stelle hat
keine Trägerin, und ein Wort, das aus der ersten Aufrufdatei selbst genommen ist, hat eine. Ohne
die erste Hälfte wäre eine Suche, die jede Datei für eine Trägerin hält, von einer richtigen
nicht zu unterscheiden; ohne die zweite wäre eine Suche, die nie etwas findet, in jedem Baum
grün — und jede Probe darüber in Wahrheit übersprungen.

Die Ausgabe nennt jetzt Zahl und Namen:

```
ok  die Probe „`nurOffene` statt `includeCompleted` (still wirkungslos)" hat eine Trägerin (1 von 6: features/board/api.ts)
ok  `nurOffene` statt `includeCompleted` (still wirkungslos) wird in features/board/api.ts gefunden
        → features/board/api.ts getBoard (Zeile 86) → getBoard: sendet „?nurOffene", beschrieben sind limit/includeCompleted
ok  Gegenprobe: eine erfundene Stelle hat keine Trägerin, „Dienstes" aus api/endpoints.ts hat eine (6 Aufrufdateien abgesucht)
```

### Gegengemessen an einer Mutantenkopie

Der Umbau ist nicht nur grün, er ist **gemessen falsifizierbar**. Eine Arbeitskopie des Laufs
(`tmp-probe.mjs`, danach gelöscht, nie versioniert) bekam fünf Mutationen:

| Mutation | Erwartung | Ergebnis |
|---|---|---|
| A: Regression mit `method: "POST"` — steht in **fünf** Aufrufdateien | fünf Proben, alle grün | fünf grüne Proben, Untergrenze grün, Lauf **nicht** rot |
| B: Regression mit einem Muster, das nirgends steht | Untergrenze rot | `FEHL … hat eine Trägerin (0 von 6: —)` |
| C: `getBoard` zurück in `NOT_CALLED_BY_UI` | „wird doch angerufen" rot | `FEHL … getBoard — die Übergabe ist eingelöst` |
| D: erfundene Kennung in `NOT_CALLED_BY_UI` | „ist eine Operation, die es gibt" rot | `FEHL … die Beschreibung führt diese Kennung nicht` |
| E: erfundenes Feld in `NEVER_SENT` | „liest die Route wirklich" rot | `FEHL … createTodo.mutantF — die Route liest diesen Namen nicht` |

**A ist der Punkt.** Genau dieser Fall — dieselbe Stelle in fünf Merkmalsordnern — war vor
T-253-2 ein roter Lauf ohne jeden Befund über den Bestand. Welle 5 kann `features/export`
aufteilen, wie es fachlich richtig ist.

---

## 2 `NOT_CALLED_BY_UI` — die zwei gemeldeten Leichen, und eine dritte

### Gestrichen

- **`getBoard`** (T-066). Der Absatz behauptete: „bis dahin gruppiert `BoardScreen.tsx`
  weiterhin selbst nach Status und ruft diese Route nicht an." Gemessen:
  `apps/web/src/features/board/api.ts:86` ruft `request<BoardView>("/board", …)`,
  `apps/web/src/features/board/BoardScreen.tsx:159` ruft `getBoard({ … })`.
- **`getVersionCheck`** (T-138). Gemessen: `apps/web/src/api/endpoints.ts:416` ruft
  `/version-check`, `apps/web/src/app/useUpdateNotice.ts:145` ruft `getVersionCheck()`.

Beide Schlüssel liegen in `result.covered`; der Prüfsatz „jede Operation außerhalb von /addin hat
einen Aufrufer" ist von 72 auf **74** gestiegen und blieb grün.

### Die dritte, die niemand gemeldet hatte

`NEVER_SENT` ist dieselbe Bauart und hat dieselben zwei stillen Zustände. Der neue Wächter fand
beim ersten Lauf:

```
FEHL  kein Zusatz in der Liste, den die Oberfläche inzwischen doch sendet (2 geprüft)
      — createTodo.tagNames — der Zusatz ist eingelöst, die Zeile gehört gestrichen
```

Der Eintrag stammt aus T-058 und sagte: „Die Fachlogik steht, die Bedienmöglichkeit fehlt." Sie
fehlt nicht mehr — `apps/web/src/features/todos/TodoFormDialog.tsx:113` schickt `tagNames`,
`apps/web/src/features/tags/TagInput.tsx` ist die Bedienmöglichkeit dazu. Gestrichen. Sein
eigener Kommentar hatte übrigens nur **eine** Richtung verlangt („Wer die Zeile entfernt, ohne
dass die Oberfläche `tagNames` sendet, bekommt den Befund zurück"); die Gegenrichtung stand
nirgends und wird jetzt gemessen.

`createTodoStatus: ['position']` ist **keine** Leiche: gemessen nicht gesendet, Feld existiert.
Die vier Add-in-Kennungen sind keine Leichen: anderer Aufrufer, Abschnitt 7 weist ihn nach.

### Die vier neuen Wächter über die Listen

| Prüfsatz | Was rot wird |
|---|---|
| kein Eintrag der Ausnahmeliste wird inzwischen doch angerufen (4 geprüft gegen 74 angerufene Operationen) | eine eingelöste Übergabe |
| jeder Eintrag der Ausnahmeliste ist eine Operation, die es gibt (4 gegen 78) | ein Eintrag, den die Beschreibung nicht führt — das wäre `addAddinTodoAttachment` nach E-100 gewesen |
| kein Zusatz in der Liste, den die Oberfläche inzwischen doch sendet (1 geprüft) | ein eingelöster Zusatz in `NEVER_SENT` |
| jeder Zusatz in der Liste ist ein Feld, das die Route wirklich liest (1 geprüft) | ein Zusatz auf ein Feld, das kein Schema mehr führt |

Dazu vier Gegenproben, die den Regeln je eine künstliche Menge hinhalten (eine gemessen
angerufene Kennung, eine erfundene; ein gemessen gesendetes Feld, ein erfundenes) — die echten
Listen werden dabei nicht verbogen.

**Der Grundsatz dahinter, und er gilt über diesen Lauf hinaus:** Ein Eintrag zuviel in einer
Ausnahmeliste macht keinen Lauf rot. Er macht ihn **unwahr**, und das ist teurer — es ist
dieselbe Bauart wie der Widerspruch an A-19.19, wo der Bestand die Abwesenheit einer Fläche
behauptet, die es gibt.

---

## Läufe und Zahlen

| Lauf | Ergebnis |
|---|---|
| `pnpm --filter @takt/local-api proof:callers` | **74 bestanden, 0 fehlgeschlagen** (vorher 61/0; +13) |
| — davon Ernte | 6 Aufrufdateien, 75 Aufrufe, 149 durchgesehene Dateien, 92 Typen aus 7 Dateien — unverändert |
| — davon Abschnitt 2 | 74 Operationen mit Aufrufer (vorher 72), 4 Ausnahmen von 78 Operationen |
| `pnpm run proof:all` | **18 von 19 Läufen grün**, einer rot: `proof:foreign` — **Zeitpunktfehler**, siehe unten |
| — codepoints/migrations/openapi/callers/conflicts/tags/access/export/export-api/taskpane | 46, 115, 74, 154, 45, 109, 98, 72, 29 … alle 0 fehlgeschlagen |
| — surface / addin-wiring / route-policy / release-safety | 27/0, 32/0, 44/0, 32/0 (einzeln nachgefahren) |
| — shell-surface / template-fields / db-permissions / addin | 61 ok / 0, 30/0, übersprungen (Windows, POSIX-Modus sagt nichts), 248/0 |
| `pnpm typecheck` (Wurzel) | rot **allein** in `apps/web/src/features/export/**` und dessen Abhängigen |
| `pnpm --filter @takt/local-api typecheck` | fehlerfrei |
| `pnpm --filter @takt/domain --filter @takt/storage typecheck` | fehlerfrei |

### Der rote Lauf ist ein Zeitpunktfehler, kein Befund

`proof:foreign` beanstandet nicht seine eigene Sache, sondern bricht an seinem Vorbehalt ab:

```
FEHL  und das Programm, über das hier geurteilt wird, übersetzt fehlerfrei
      Der Übersetzer meldet 4 Befund(e).
      src/features/export/ExportScreen.tsx:20  TS6196: 'ForeignText' is declared but never used.
      src/features/export/ExportScreen.tsx:22  TS6196: 'SkippedExportGroup' is declared but never used.
      src/features/export/ExportScreen.tsx:37  TS6133: 'ExportRowPanes' is declared but its value is never read.
      src/features/export/ExportScreen.tsx:51  TS6133: 'ExportFieldDefinition' is declared but its value is never read.
```

Alle vier stehen in `apps/web/src/features/export/**`, also in Welle 5, die währenddessen läuft.
`proof:all` hält dort an; die acht Läufe danach sind deshalb einzeln nachgefahren und stehen oben.
Meine Änderung fasst `apps/web` nicht an — die einzige geänderte Datei ist
`apps/local-api/scripts/proof-callers.mjs`.

## Annahmen

1. **Die Zusage von Abschnitt 6 ist die Nicht-Blindheit des Lesers, nicht der Aufbewahrungsort
   eines Aufrufs.** Wo ein Aufruf stehen darf, misst Abschnitt 1 (`WEB_REQUEST_HOME`), und dort
   gehört es hin. Abschnitt 6 doppelt das nicht.
2. **Mehr Trägerinnen sind mehr Messung, nicht weniger.** Ich habe die Probe je Trägerin
   wiederholt, statt eine auszuwählen. Der Lauf wächst dadurch mit der Aufteilung — bei acht
   Merkmalsordnern in Welle 8 sind das im schlimmsten Fall einige Prüfsätze mehr, jeder mit
   eigenem `inspectAll` über sechs bis acht Dateien. Gemessene Laufzeit heute unauffällig.
3. **`NEVER_SENT` mitgenommen.** Der Auftrag nannte `NOT_CALLED_BY_UI`. `NEVER_SENT` ist
   dieselbe Bauart im selben Lauf, und die Aufforderung „prüf, ob die Liste noch weitere solche
   Leichen trägt" wäre halb erfüllt, wenn ich die Nachbarliste ausgelassen hätte. Sie trug eine.
4. **Die Mutantenkopie ist gelöscht.** `apps/local-api/scripts/tmp-probe.mjs` hat nie einen
   Commit gesehen; `git status` unter `apps/local-api/scripts/` führt sie nicht mehr.

## Risiken

- **R-a (klein, sicherheitsnah: nein).** Die Untergrenze „mindestens eine Trägerin" hängt weiter
  an vier fest hinterlegten Mustern. Schreibt jemand `body: { newParentId }` zu
  `body: {\n  newParentId,\n}` um, wird die Probe rot — richtig so, aber es ist eine
  Formabhängigkeit, keine Bedeutungsabhängigkeit. Sie war vorher schon da und ist unverändert.
- **R-b.** `sentKeys` zählt einen Schlüssel als „gesendet", wenn der Rumpftyp der Aufrufdatei ihn
  führt, nicht erst, wenn eine Ansicht ihn belegt. Für `createTodo.tagNames` fällt das zusammen
  (`TodoFormDialog.tsx:113` belegt ihn tatsächlich), im allgemeinen Fall könnte der neue Wächter
  einen Zusatz für eingelöst halten, den nur der **Typ** kennt. Das ist dieselbe Auflösung, mit
  der Abschnitt 3 seit T-051 arbeitet; eine Verschärfung wäre ein eigener Auftrag.
- **R-c.** Zwei Prüfsätze führen jetzt Zahlen im Namen (`4 geprüft gegen 74 angerufene
  Operationen`). Wer Prüfsatznamen anderswo zeichengleich vergleicht, bekommt Bewegung. Mir ist
  keine solche Stelle bekannt: `grep` nach `proof-callers`/`proof:callers` in `apps/*/test`,
  `packages/*/test` und `tests/` findet **nichts**.

## Offene Fragen

1. **`board.md:92` gehört nachgezogen** (Orchestratordatei, ich fasse sie nicht an). Dort steht:
   „Sobald die Oberfläche `GET /board` anruft, gehört `getBoard` aus `NOT_CALLED_BY_UI` — und
   …". Das ist erledigt; die Zeile behauptet sonst ab jetzt selbst einen Bauzustand, den es nicht
   mehr gibt — genau der Fehler, den dieser Auftrag abgestellt hat.
2. **Dieselbe Frage eine Ebene höher.** Dies war der dritte Fall in Folge (F-22/E-102, T-251-2,
   jetzt T-253-2), in dem eine Zusage an der Ordnerstruktur statt an der Anforderung aufgespannt
   war, und der zweite, in dem eine **Ausnahmeliste** still veraltet ist. Vorschlag für eine
   Entscheidung: *Jede Ausnahme- oder Übergabeliste in einem Nachweislauf trägt einen Wächter,
   der ihre Einträge gegen die Wirklichkeit hält — eingelöst und ins Leere zeigend.* Andere Läufe
   führen vergleichbare Listen (`proof:openapi`, `proof:route-policy`, `proof:addin`); ich habe
   sie in diesem Auftrag nicht angesehen, weil er sie nicht nannte.
3. **`pnpm check` als Ganzes ist heute nicht fahrbar**, solange Welle 5 läuft — `typecheck`,
   `proof:all` (über `proof:foreign`) und `test:coverage` hängen an `apps/web`. Wer das Tor
   messen will, misst es nach Welle 5.

## Nächster Schritt

`proof:callers` ist für Welle 5 vorbereitet: `features/export/api.ts` wird von selbst
eingesammelt, und die Aufteilung der Exportrouten über einen oder mehrere Ordner macht Abschnitt
6 weder rot noch zufällig grün. Vorschlag: T-253-2 an Code-Review und Security-Checker geben —
Security sieht dabei bitte den Grundsatz aus Punkt 2 der offenen Fragen an, weil dieselbe Bauart
im Bedrohungsmodell unter A-A-21 schon einmal teuer war —, und den Wächtervorschlag als
Entscheidungsvorlage aufnehmen.
