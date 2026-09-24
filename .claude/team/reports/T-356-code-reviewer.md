# T-356 — Freigaberunde über T-348, T-349 und T-350

**Rolle:** code-reviewer. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Vorlagen:** `.claude/team/reports/T-348-frontend-dev.md`, `T-349-domain-dev.md`,
`T-350-domain-dev.md`; `docs/spec.md` A-18.11/12, A-24.7, A-25.5/6/7; `decisions.md` E-036,
E-094, E-099, E-114, E-116; `risks.md` R-30, R-34.

**Geschrieben:** ausschließlich diese Datei. Kein Produktivcode angefaßt — nachgeprüft
(`md5sum` von `version.ts` und `app.css` vor und nach allen Messungen gleich, `git status`
unverändert). Alle Mutationen liefen in einem **Abzug** des Baums unter dem Kratzverzeichnis
(`rsync` ohne `.git` und `src-tauri/target`), nicht im Arbeitsbaum — `apps/**` und `packages/**`
haben in dieser Runde stillgestanden, auch für mich.

**Ports.** `ss -ltn` vor und nach jedem Lauf: 17843, 17844, 5173 durchgehend frei, nichts
von mir gebunden. `verify:bundle` und `test:e2e` **nicht gefahren, Ports vergeben** (T-352);
aus demselben Grund nicht gefahren: `proof:access`, `proof:conflicts`, `proof:tags`,
`proof:export-api`, `proof:addin-wiring`, `proof:addin`, `proof:export`, `proof:taskpane`.
`test:rust`, `build` und `audit` nicht gefahren — von keinem der drei Stränge berührt.

**Gefahren, mit Zahl:** `typecheck` **Exit 0** (8 Pakete + Prüf- und E2E-Programme) ·
`boundaries` grün, 528 Quelldateien · `contrast` 11/11 · `proof:surface` **45/0** ·
`proof:release-safety` **154/0** · `layers` 36/0 · `callers` grün · `codepoints` 46/0 ·
`migrations` aktuell (46) · `openapi` 115/0 · `db-permissions` 27/0 · `route-policy` 48/0 ·
`template-fields` 30/0 · `locked` grün · `foreign` grün · `clamp` grün · `shell-surface` grün ·
`vitest` über den ganzen Abzug **1887 grün, 2 übersprungen, 0 rot** (darunter
`apps/local-api/test` **349/2**).

---

## Befunde

```
apps/web/scripts/proof-surface.mjs:1630        mittel   `fensterfesteKlassen` liest je CSS-Block statt je Klasse: `position: fixed` und die volle Ausdehnung müssen in derselben Regel stehen. Gemessen am Abzug mit einer zweiten, nicht portalierten Abdunklung (`.rueckfrage-flaeche`): (a) `position: fixed` in einer Regel, `inset: 0` in einer zweiten — die Bauart, in der eine Palette nachzieht — bleibt 45/0 grün; (b) `inset: 0 !important` grün; (c) `top/left: 0; width: 100vw; height: 100vh` grün. Kontrolle mit beiden Erklärungen in einem Block: 44/1 rot, die Regel trägt also. Fix: die Menge je Klassennamen über **alle** Blöcke vereinigen, `!important` im Wert zulassen und `width/height: 100v*` bei `top/left: 0` als volle Ausdehnung lesen — oder die drei Gestalten in „Was sie ausdrücklich nicht kann" und in die A-25.6-Tabelle schreiben, damit die Zusage nicht weiter ist als die Messung.
apps/web/scripts/proof-surface.mjs:1938        mittel   Regel H liest als Escape-Absageweg nur `x === "Escape"` unter einem `if`/`?:`. Gemessen: `if (event.key !== "Escape") return; onConfirm();` erzeugt **keinen** Absageweg (91 unverändert, 45/0 grün); `switch (event.key) { case "Escape": }` ebensowenig. Der Regelkopf nennt als Grenze nur fremde Datei, Abbildung und Zustandshaken. Fix: den verneinten Wächter (Komplementzweig = Rest des Rumpfes) und `CaseClause` mitlesen — oder beide Gestalten im Regelkopf benennen.
apps/web/scripts/proof-surface.mjs:2300        niedrig  `heading('H  Gegenproben …')` trägt denselben Buchstaben wie `heading('H  Abbrechen ist nie Zustimmung')` (:2251). Zwei Abschnitte „H" in einem Lauf, dessen Zweck es ist, den roten Satz benennbar zu machen. Fix: `I`.
apps/web/src/shared/ui/ScreenBody.tsx:91       mittel   „Genau ein Element im Dokument trägt `id=inhalt`" ist seit T-348 eine Verabredung über fünf Aufrufstellen mit gegenläufigen Vorgaben (`ScreenBody` anchor=true, `RunArea`/`Card` anchor=false) und wird nirgends gemessen — `proof:surface` nicht, e2e seit T-330 nicht mehr (die vier lebenden `#inhalt`-Warten stehen auf einer Regelansicht). Eine neue Rahmenansicht ohne `anchor` hat **null** Marken: die Sprungmarke zeigt ins Leere, Bild-ab tut wieder nichts — genau der Fehler aus T-344 8.5. Fix: Prüfsatz in `proof:surface`, der je Ansichtsmodul genau eine Marke zählt.
apps/web/src/shared/ui/Primitives.tsx:196      niedrig  `anchor` ohne `runArea` ist eine stille Leerhandlung (`runAreaSurface` wird gar nicht gerufen); der Kommentar sagt es, der Typ nicht. Fix: `runArea`/`anchor` als Vereinigungstyp binden (`{ runArea: string; anchor?: boolean } | { runArea?: undefined; anchor?: never }`).
apps/local-api/src/features/version/version.ts:552   niedrig  `forgetStore` schreibt seine Zeile, ohne zu prüfen, ob der Speicher schon abgelegt ist. „Genau eine Zeile über die ganze Laufzeit" hält allein deshalb, weil der Boden (1 h) weit über der Frist (5 s) liegt; die Begründung im Quelltext („danach gibt es keinen Speicher mehr, der ein zweites Mal versagen könnte") gilt für bereits **schwebende** Fristen nicht. Gemessen (`intervalMs: 5`, `minIntervalMs: 0`, `storeDeadlineMs: 120`, `write` antwortet nie): **110** Zeilen `version_check_state_write_timeout`. Fix: `if (store === null) return;` als erste Zeile von `forgetStore`.
apps/local-api/src/features/version/version.ts:509   niedrig  Die `unref()`te Frist überlebt `stop()`. Gemessen: nach `stop()` erscheint noch **eine** `info`-Zeile. Im Betrieb unerreichbar (der gebaute Adapter löst im Aufruf ein) und in T-349 als Annahme 3 benannt — A-V-12 sagt aber „räumt den Zeitgeber weg", und eine Zeile nach dem Abschalten trifft auf eine Senke, die beim Herunterfahren geschlossen sein kann. Fix: schwebende Fristen in einem `Set` halten und in `stop()` abräumen, oder `stopped` im Rückruf prüfen.
apps/local-api/scripts/proof-release-safety.mjs:3263  mittel   6g-1 spannt seine Menge am **Rumpf, der den Aufruf enthält**, auf und nicht am Eintrittspunkt, den der Zeitgeber ruft. Gemessen am Abzug: Anfrage in eine örtliche Hilfsfunktion mit `return await source.latest(control.signal)` verlegt, `await new Promise<void>(() => {})` in `run()` gestellt → `tsc` **Exit 0**, Lauf **154/0 grün** — der Ausschalter aus T-332 K-1, eine Funktion tiefer, mit derselben Wirkung. Fix: festnageln, daß der Rumpf mit der Anfrage der ist, den der Zeitgeber ruft (`run`), oder jedes `await` auf dem Weg vom geplanten Eintritt bis zur Anfrage messen; mindestens als sechste Art in die Lückenliste bei `checkNoStoreReadback`.
.claude/team/risks.md R-34                     mittel   Die Begründung „die Behebung ist ein Polaritätswechsel und faßt context.ts, composition.ts, main.ts, idle.ts und einen fremden Prüffall an" ist nicht die einzige saubere. Gemessen über den echten Weg (`exportDataArchive` → `importDataArchive`, eigener Abzug): heute nach dem Einspielen `loadOrphanedTimer` → `null`; **ein** zusätzlicher `captureTimerRecovery(context)` hinter `replaceAll` (`apps/local-api/src/features/data-transfer/data-transfer.ts:648` — der Anwendungsfall hält den `AppContext` bereits) macht daraus `{ bookableSeconds: 1200 }`, also genau das mitgereiste Lebenszeichen statt der 39 600 s Wanduhr. Fix: R-34 um die kleine Behebung ergänzen und den Folgeauftrag danach schneiden; die Polarität bleibt die allgemeinere Antwort, ist aber nicht die Bedingung dafür, die heute gemessene Lücke zu schließen.
apps/local-api/src/context.ts:63               niedrig  Englischer Kommentar am Feld, um das es geht („Snapshot taken before HTTP starts; timers created in this service run are not orphaned."). T-350 hat den Zwilling in `timer.ts` ersetzt, dieser blieb — und er ist der, den ein Leser von `AppContext` zuerst sieht. Fix: deutsch, mit Verweis auf `foundAtServiceStart`. (In der Hoheit von domain-dev, außerhalb des T-350-Auftrags.)
packages/storage/src/sqlite/repo-time.ts:500   niedrig  `orphaned()` und `TimerHeartbeatPort.orphaned()` in `packages/storage/src/ports.ts` sagen weiterhin „die beim **Start** vorgefundene unvollständige Buchung" zu und liefern jede. Genau dieser Satz steht wörtlich im Prüffall, der drei Wellen lang gegen die falsche Fassung gemessen hat. Fix: Wortlaut wie in T-350 Risiken vorgeschlagen; eigener Auftrag, weil `packages/**` T-350 verwehrt war.
```

---

## Strang A — T-348 (`apps/web/**`, 34/0 → 45/0)

**Urteil: Nacharbeit.** Blockierend ist der Befund zu `proof-surface.mjs:1630`; der zu
`:1938` gehört in dieselbe Nacharbeit, weil es dieselbe Klasse ist. Alles andere trägt.

**1. `portalRufOf` — ja, es ist wirklich dieselbe Auflösung.** Eine Funktion
(`proof-surface.mjs:1214`), zwei Aufrufstellen: der **Abstieg** von Regel F
(`resolveIntoElements`, :1361) und der **Aufstieg** von Regel G (`portalAnkerOf`, :1671). Beide
fragen dasselbe Kriterium in derselben Reihenfolge — örtlicher Name zuerst
(`oertlicheNamenOf`), dann die benannte Einfuhr aus `react-dom`, dann Vorgabe- und
Namensraumträger —, und beide prüfen `echt` **vor** allem anderen. Die Richtungen der beiden
Durchquerungen sind verschieden, die Auflösung nicht. Beide irren in dieselbe, sichere Richtung:
Regel F meldet und bricht ab, Regel G meldet „nicht verankert" und steigt nicht weiter.

**2. Regel G — die neue Menge ist nicht vollständig, und das ist gemessen.** Die Umstellung
selbst trägt: Die Kontrolle (zweite Abdunklung, `position: fixed; inset: 0` in **einem** Block,
JSX ohne Portal) ist **44/1 rot**, mit Datei, Zeile und Satz. Drei Gestalten derselben Fläche
bleiben aber **45/0 grün** — Ausdehnung in einer zweiten Regel, `!important`, `100vw/100vh` —,
und die Schlußzeile behauptet dabei weiterhin „Fensterfeste Klassen aus den Stilblättern:
`.scrim`". Das ist eine Zusage in der teuren Richtung. Die Menge kommt jetzt aus der
Eigenschaft statt aus dem Namen, aber sie kommt aus **einer Schreibweise** der Eigenschaft; das
ist E-099 Punkt 3 eine Ebene tiefer. Die Untergrenze (`scrim` muß in der Menge stehen) schützt
nur `.scrim` selbst, nicht eine zweite Fläche.

**3. Regel H trägt, was ihr Name sagt — für die zwei Gestalten, die sie liest.** Beide
Untergrenzen sind da und messen den Bestand (`wege.length > 0` **und** „es gibt überhaupt
Zustimmungsrückrufe"); das ist mehr, als Regel F und G je hatten, und genau der Satz, den T-349
in derselben Welle für 6g-1 gelernt hat. Der Aufrufgraph meldet zuviel und nie zuwenig. Die
Grenze liegt nicht bei der Erreichbarkeit, sondern bei der **Erkennung des Absagewegs**: der
verneinte Escape-Wächter erzeugt gar keinen Weg (Befund :1938).

**4. A-25.6, in beide Richtungen geprüft.** Zwei von fünf Teilsätzen zugesichert, einer
mittelbar, zwei offen — das stimmt, und der Lauf trägt **nicht** mehr, als er sagt: Für
„vollständig sichtbar" und „fängt den Tastaturfokus" gibt es in den 45 Prüfungen nichts, auch
nicht mittelbar. In die andere Richtung sichert er **doch** etwas mehr zu, als er mißt: Die
Tabelle sagt bei Teilsatz 1 „in jeder Gestaltung — ja" und nennt als Grenze nur die JSX-Seite
(„ein Klassenname, der erst zur Laufzeit entsteht"). Die Stilblattseite hat eine zweite Grenze,
die weder in der Tabelle noch im Regelkopf steht. Das ist der blockierende Befund.

**5. Sprungmarke und Bereichsschiene.** Nachgezählt: je Ansicht genau **eine** Marke —
Einstellungen `RunArea … anchor` (`SettingsScreen.tsx:230`), Zeiterfassung `Card … anchor`
(`TimeScreen.tsx:212`), Kanban `runAreaSurface("Kanban", true)` an `.board`
(`BoardScreen.tsx:466`), die acht Regelansichten über die Vorgabe von `ScreenBody`; die
Ladezweige sind Alternativen und keine Geschwister. `ScreenFrame` ohne Namen gibt Halt, Rolle
und Kennung tatsächlich ab (`runAreaSurface` wird nicht gerufen). `.board` hat mit
`overflow-x: auto` (`app.css:4146`) eine echte Laufstrecke — der neue Halt hat etwas zu tun.
`.board:focus-visible` hängt an der vorhandenen Ringregel (`app.css:395`), die Medienstufe
`max-height: 44rem` steht als eigener Block neben der Breitenregel (`app.css:4629`). Die
A9-Zahlen (0 → 392 px, 0 → 36 px), die 415 px der Schiene und die Rahmenwerte habe ich **nicht**
nachgemessen — das ist ein Browserlauf und gehört zu visual-qa und e2e. Die Aussage zu
`A8_RUN_AREA_SELECTORS` stimmt: `tests/e2e/viewport-fit.spec.ts:317` führt `.board` nicht.
B-06 ist sauber gebaut — `tableSurface` gibt bei `nested` ein leeres Objekt zurück, die
Beschriftung ist einmal getippt und von `<caption>` und `aria-label` geteilt, kein neuer
Oberflächentext.

---

## Strang B — T-349 (`version.ts`, `proof-release-safety.mjs`, 145/0 → 154/0)

**Urteil: freigegeben**, mit drei Auflagen (zwei klein, eine für die nächste Welle). Der
gebaute Weg ist richtig: `remember` ist synchron, im Rumpf von `run()` steht genau ein `await`,
und das ist die Anfrage mit ihrer eigenen Frist.

**1. Die Frist feuert nicht doppelt — je Aufruf.** `settled` deckt den Wettlauf zwischen
Frist und Ausgang sauber ab, `clearTimeout` steht auf dem Ausgangspfad, und der `catch` im
Rumpf der Sofortfunktion fängt auch einen Wurf beim **Aufruf** von `write`; eine unbehandelte
Ablehnung gibt es nicht. Zwei **nebeneinander** schwebende Schreibzugriffe ergeben aber zwei
Fristen und zwei Zeilen (gemessen: 110). Im Betrieb unerreichbar — zwischen zwei `remember` liegt
der Boden von einer Stunde, die Frist sind fünf Sekunden —, aber die Zusage hängt damit an einer
fernen Zahl und nicht an einer Zeile, und die Begründung im Quelltext ist an dieser Stelle
falsch. Eine Zeile behebt es (Befund :552).

**2. `stop()` und die schwebende Frist: die Annahme trägt, der Rest ist benannt.** `unref()`
heißt nicht „feuert nicht" — solange der Dienst noch lauscht, lebt die Ereignisschleife, und die
Frist kommt an. Gemessen: nach `stop()` genau eine weitere `info`-Zeile. Fachlich folgenlos
(kein Zeitgeber, kein Zustand, kein Takt — das steht so im Quelltext und stimmt), aber es ist
eine Wirkung nach dem Abschalten und damit eine Auflage, keine Freigabebedingung.

**3. Der Preis ist richtig beziffert und steht dort, wo der nächste Leser ihn findet.**
Zugesichert ist der Anstoß, nicht der Abschluß — nachgeprüft: `run()` liest den Bestandswert
nirgends (`checkNoStoreReadback` mißt genau das), der Boden hängt allein an `lastRequestAt` im
Arbeitsspeicher, und die erste Prüfung eines Prozeßlaufs geht ohnehin hinaus (T-285). Ein
Absturz zwischen Anstoß und Schreiben kostet also wirklich eine Angabe in einer Datensicherung
und keinen Boden. Der Satz steht an drei Stellen: `version.ts` bei `remember`,
`docs/architektur.md:1712 ff.` und im Bericht. Der Prüffall, der ihn heute noch anders benennt
(„der Zeitpunkt steht bereits IM Speicher, während die Anfrage läuft"), ist richtig an den
unit-tester gemeldet und nicht selbst angefaßt — das ist die richtige Reihenfolge.

**4. 145 → 154 von unten nachgerechnet, und es geht auf.** 6g-1: 4 → 6 Gegenproben
(**+3** neu — der Stand vor A-A-106, ein Warten **hinter** der Anfrage, die Untergrenze; **−1**,
weil die zweite Richtung über eine leere Erlaubnisliste nicht mehr einsetzbar ist) = **+2**.
6i-2: **+6**. Abschnitt 0: **+1** („jedes Entscheidungsmodul hat eine festgenagelte
Zugriffsschlüsselliste"). Summe **+9** → 154, und der Lauf zeigt 154/0 mit „118 Einträge, 118 mit
`erwartet`". **Drei** der beidseitigen Messungen habe ich nachgefahren, jede im echten Baum des
Abzugs: `await remember(…)` wieder eingesetzt → **153/1** mit dem benennenden Satz; die Anfrage
unter `await Promise.resolve(…)` gestellt → **153/1** mit **beiden** Sätzen (Obergrenze und
Untergrenze); `traeger['constructor']` in `version.ts` → **153/1** mit dem A-A-117-Satz. Der
neue Protokollschlüssel bricht keine festgenagelte Liste (er kommt außerhalb von `version.ts`
und den Prüffällen nirgends vor) — auch kein portgebundener Lauf wird davon rot.

**5. Die Klasse ist enger, nicht zu — und sie hat zwei Ausgänge, nicht einen.** Der von T-349
benannte ist gemessen: Eine Quelle, deren `latest` nie antwortet, ergibt **1** Anfrage, danach
nichts, Zustand `unknown`, **0** Protokollzeilen — bei einer Lage, in der Hunderte hinausgegangen
wären. Das ist T-332 K-1 wortwörtlich, eine Naht weiter rechts, und die Zahl gehört in R-30.
Der **zweite** Ausgang stand nicht im Bericht und ist der Befund zu `proof-release-safety.mjs`:
Der Wächter mißt den Rumpf, in dem die Anfrage steht — wer die Anfrage eine Funktion tiefer
schiebt, verschiebt den gemessenen Rumpf mit und stellt sein `await` in `run()`. `tsc` Exit 0,
Lauf 154/0 grün, Versionsprüfung tot.

---

## Strang C — T-350 (`timer.ts`, `docs/datenmodell.md`)

**Urteil: freigegeben**, mit der Auflage, R-34 zu berichtigen, bevor der Folgeauftrag
geschnitten wird.

**1. Die Kette trägt, und die Verengung ist richtig.** Nachgeprüft an der Quelle:
`packages/storage/migrations/0001_initial.up.sql:140` legt
`CREATE UNIQUE INDEX ux_time_entry_running ON time_entry ((1)) WHERE ended_at IS NULL` an, und
`repo-time.ts:500` fragt `WHERE te.ended_at IS NULL LIMIT 1`. Damit liefert `orphaned()`
zwangsläufig **immer genau den laufenden Timer** — die Abfrage beantwortet „ist etwas
abgestürzt?" mit dem Timer, den der Benutzer gerade laufen sieht. Drei Papierstellen sagen
seit jeher „beim Start vorgefunden", gemessen hat es bis zum 2026-09-09 nichts. Das ist keine
nachträgliche Verschärfung von E-036, sondern dessen erste Umsetzung; die drei E2E-Fälle messen
eine Vorrichtung, die es nicht mehr gibt, und weichen zu Recht. A-24.7 ist nicht berührt: Der
Wert ist eine **Beobachtung**, die bei jedem Start aus SQLite neu entsteht, kein Zustand.

**2. Verhaltensgleichheit — nicht nur grün, sondern nachgerechnet.**
`!foundAtServiceStart(c, id)` ist `!(R === undefined || R.entryId === id)` und damit
zeichengenau `R !== undefined && R.entryId !== id`; beide Aufrufstellen stehen an derselben
Stelle derselben Bedingung, gelesen werden nur Felder, keine Nebenwirkung in der Auswertung.
Dazu gemessen: `apps/local-api/test` **349 grün / 2 übersprungen**, der ganze Abzug **1887/2**.

**3. R-34 — der Schaden ist echt, die Begründung ist zu teuer.** Ich habe den zweiten Eingang
über den echten Anwendungsfall nachgestellt: Ein Archiv, das bei laufendem Timer erzeugt wurde
(Lebenszeichen 1 200 s nach dem Start, Wanduhr 39 600 s), gilt nach `importDataArchive`
**nicht** als verwaist — `loadOrphanedTimer` gibt `null`. Genau ein weiterer Aufruf von
`captureTimerRecovery(context)` hinter `replaceAll` macht daraus einen verwaisten Eintrag mit
`bookableSeconds: 1200`. Der Anwendungsfall hält den `AppContext` bereits; es ist eine Zeile in
**einer** Datei, die domain-dev ohnehin gehört. Der Polaritätswechsel bleibt die allgemeinere
Antwort — er hält auch gegen einen dritten Eingang, den noch niemand gebaut hat —, aber er ist
nicht die Bedingung dafür, die gemessene Lücke zu schließen. Diese Unterscheidung gehört in
R-34, weil sie über die Dringlichkeit eines Auftrags mit der Schwere „hoch" entscheidet.

**4. `AppContext.timerRecovery` als optionales Feld ist heute sicher** — und das ist
nachgezählt, nicht geglaubt: genau **ein** `AppContext`-Literal im Erzeugnis
(`composition.ts:172`, mit `timerRecovery: { entryId: null }`), und `main.ts:293` ruft
`captureTimerRecovery`, bevor bedient wird. Die Ausfallrichtung bei fehlendem Feld („alles
verwaist") ist die richtige; ein Pflichtfeld daraus zu machen drehte die von Hand gebauten
Prüfzusammenhänge still um. Die Entscheidung, es so zu lassen und zu benennen, teile ich.

---

```
Aufgabe: T-356 — Freigaberunde über T-348, T-349 und T-350
Status: fertig
Artefakte: .claude/team/reports/T-356-code-reviewer.md
Zusammenfassung: Drei Stränge, drei Urteile — A Nacharbeit, B und C freigegeben. Strang A:
  `portalRufOf` ist wirklich **eine** Auflösung für Regel F und G (örtlicher Name zuerst, dann
  die Einfuhr), Regel H hat als einzige Regel dieses Laufs beide Untergrenzen, und die
  A-25.6-Bilanz „zwei von fünf" stimmt in beide Richtungen — bis auf eine Stelle: Die neue
  Menge von Regel G kommt aus **einer Schreibweise** der Eigenschaft, nicht aus der
  Eigenschaft. Gemessen am Abzug bleiben eine zweite Abdunklung mit `inset: 0` in einer zweiten
  Regel, eine mit `!important` und eine mit `100vw/100vh` **45/0 grün**, während die Kontrolle
  in einem Block 44/1 rot ist; dieselbe Klasse bei Regel H, wo `if (key !== "Escape") return`
  gar keinen Absageweg erzeugt. Strang B: Der Weg ist richtig gebaut, 145 → 154 geht von unten
  auf (+2 6g-1, +6 6i-2, +1 Abschnitt 0), drei beidseitige Messungen nachgefahren (je 153/1 mit
  dem benennenden Satz). Zwei kleine Reste in `version.ts` (110 statt einer Zeile bei
  überlappenden Fristen; eine Zeile nach `stop()`), und ein gemessener Ausgang, der nicht im
  Bericht stand: Anfrage eine Funktion tiefer schieben, `await` in `run()` — tsc Exit 0,
  154/0 grün, Versionsprüfung tot. Die benannte Restklasse ist jetzt beziffert: eine Quelle,
  die nie antwortet, kostet 1 Anfrage und 0 Zeilen. Strang C: Die Kette trägt (Teilindex +
  `WHERE ended_at IS NULL LIMIT 1`), die Verengung ist E-036s erste Umsetzung, die Regel ist
  algebraisch verhaltensgleich. R-34 ist echt — aber ein Aufruf `captureTimerRecovery` hinter
  `replaceAll` bringt gemessen 1 200 s statt 39 600 s; der Polaritätswechsel über fünf Dateien
  ist nicht die Bedingung.
Annahmen: (1) Alle Mutationen liefen in einem Abzug des Baums im Kratzverzeichnis, nicht im
  Arbeitsbaum — `apps/**` und `packages/**` standen still, auch für mich. (2) Portgebundene
  Läufe habe ich nicht gefahren, auch die aus `proof:all` nicht, weil 17843/17844/5173 T-352
  gehören. (3) Die Browserzahlen aus T-348 (392 px, 36 px, 415 px, die Rahmenwerte) habe ich
  nicht nachgemessen; das ist visual-qa und e2e. (4) Die Dateihoheit konnte ich nicht gegen
  einen sauberen Nullpunkt prüfen — der Arbeitsbaum trägt mehrere unveröffentlichte Wellen;
  alle Änderungen der drei Stränge liegen in der jeweils eigenen Hoheit.
Risiken: Der blockierende Befund ist eine **stille grüne** Zusage, und es ist die dritte Runde
  derselben Klasse an derselben Datei — wer sie nur um die drei gemessenen Gestalten erweitert,
  hat die vierte vor sich; die Menge gehört an die Eigenschaft, sonst an die Prosa. Der
  Wächterausgang aus Strang B ist derselbe Fehler in `proof-release-safety.mjs` und heute
  ungemessen. R-34 bleibt offen und geht in die Abrechnung.
Offene Fragen: (1) Soll die Nacharbeit an Regel G die drei Gestalten schließen oder sie
  benennen? Beides ist vertretbar; nichts von beidem zu tun, ist es nicht. (2) Wer bekommt den
  Auflagenblock zu `proof-release-safety.mjs` 6g-1 — derselbe domain-dev in der nächsten Welle
  oder ein eigener Auftrag? (3) R-34 gehört dem Orchestrator: Soll der Folgeauftrag die kleine
  Behebung (eine Zeile in `data-transfer.ts`) oder den Polaritätswechsel schneiden?
Nächster Schritt: (a) frontend-dev in der nächsten Welle mit den vier A-Befunden — sie liegen
  alle in `apps/web` und in einer Datei bis auf zwei Zeilen; (b) domain-dev mit den beiden
  kleinen Resten in `version.ts` und der Auflage zu 6g-1; (c) Orchestrator: R-34 um die
  gemessene kleine Behebung ergänzen und R-30 um die Zahl „1 Anfrage, 0 Zeilen"; (d) Strang B
  und C können unabhängig davon weiterlaufen — security-checker und Dokumentierer sind nicht
  blockiert.
```
