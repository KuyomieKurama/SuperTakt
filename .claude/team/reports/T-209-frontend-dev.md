# T-209 — Die Karte fällt, und vierzehn Farben bekommen einen Wächter

**Aufgabe:** T-209, Welle AF. **Verfasser:** frontend-dev.
**Grundlage:** `docs/design/textbestand.md` (UM-08, SP-22, Abschnitt 5.2),
`docs/design/traeger-und-zusage.md` Abschnitt 9 (T-204), A-A-45 aus
`.claude/team/reports/T-189-security-checker.md` (Befund T-189-7), T-200 Z-54, T-201, E-081
Punkt 4, E-087.

**Nicht angefaßt:** der `MessageSlot` aus O-IQ — visual-qa mißt in dieser Welle Fokusringe und
Rasterzellen. `pnpm run proof:all` und `pnpm test:e2e` nicht gefahren (E-083 Punkt 3).

---

## 1. Die Karte „Was sich geändert hat" ist gefallen

Gestrichen in `apps/web/src/screens/BoardScreen.tsx`: die Karte mit vier Aufzählungspunkten und
zwei Knöpfen unter dem Board-Leerzustand, dazu ihre drei CSS-Klassen in `app.css`.

**Gesucht wurde über den vollen Wortlaut, nicht über Zeilen** — und über **beide** Wege (E-087
Zusatz vom 2026-09-06): `git grep -F` je Satz **und** ein `grep -rn` über `apps/`, `packages/`,
`tests/` vom Dateisystem. Beide Läufe nennen dieselbe einzige Fundstelle je Satz:
`BoardScreen.tsx`. **Kein Treffer in `tests/**`** — die Messung aus UM-08 bestätigt sich. Der
Satzanfang „Der Status bleibt" wurde ausdrücklich **nicht** als Suchmuster benutzt: Er trifft in
`tests/e2e/done-movement-announcement.spec.ts:62`, `TodoListScreen.tsx:300` und
`TodoDetailScreen.tsx:173` einen **anderen** Satz („Der Status bleibt unverändert — Erledigt und
Status sind zwei getrennte Größen."). Gesucht wurde nach `Der Status bleibt.` mit Punkt, und der
kommt nur in der Karte vor.

**Der Ausgleich stand vorher und ist nachgemessen, nicht angenommen** (E-081 Punkt 4):

| Punkt der Karte | Träger nach dem Fall | belegt |
|---|---|---|
| „Nichts wird mehr gezogen." | `RULE_WHAT_MOVES_A_CARD` im `lead` der Ansicht | `BoardScreen.tsx:386` |
| „Keine automatische Übersetzung." | „Takt erfindet keine." im Leerzustand | `BoardScreen.tsx` `description` |
| „Ihre Todos sind vollzählig da." | `docs/benutzerhandbuch.md` › „Herkunft der Spalten" | T-201, freigegeben T-200 Z-54 |
| „Der Status bleibt." — Aussageteil | dasselbe Handbuch | dito |
| „Der Status bleibt." — **Verweisteil** | `TodoFormDialog.tsx:250`, `hint` am Statusfeld: „Die Werte stehen in den Einstellungen unter „Status"." | steht seit T-181 (ST-05) |

Der Verweisteil, den documenter in T-201 ausdrücklich liegengelassen hat, **war bereits gebaut**.
Ich habe ihn gemessen und nicht ein zweites Mal hingeschrieben — eine zweite Fassung hätte genau
die Doppelung wiederhergestellt, die ST-05 aufgelöst hat.

**Die zwei Knöpfe fallen mit.** „Erste Spalte einrichten" stand wortgleich drei Zeilen darüber als
Aktion des Leerzustands (D), „Zur Todo-Liste" ist ein Navigationsknopf in einem Erklärkasten
(Regel S-11). Damit hat der Leerzustand jetzt **eine** primäre Aktion statt dreier Knöpfe — die
Tab-Reihenfolge dieser Fläche schrumpft von drei auf einen, und der doppelt vergebene zugängliche
Name „Erste Spalte einrichten" ist weg.

**An der Stelle steht ein Kommentar, kein Loch.** Er nennt die Bedingung, warum sie nie wahr ist,
alle vier Träger und den Umstand, daß der Handbuchabsatz seither **Alleinträger** und als SP-22
gesperrt ist. Der JSDoc über `BoardEmptyState` beschrieb bis heute die gefallene Karte („Deshalb
steht hier, was geschehen ist, wo seine Todos geblieben sind") — er ist auf den tatsächlichen
Zustand berichtigt.

### Die Auflage aus SP-22 — nachgetragen

`docs/design/textbestand.md` Abschnitt 5.2 verlangt als Pflichtangabe 2 „die gefallene Fläche
**und das Datum ihres Falls**"; ohne sie ist der Eintrag „eine Behauptung". Die Zeile SP-22 nannte
bisher nur das Datum ihrer **Aufnahme**.

**Ich habe die Angabe gesetzt** — die einzige Zeile in fremder Hoheit, die dieser Auftrag anfaßt,
und ausdrücklich Teil des Auftrags (E-081 Punkt 4):

> **Die Karte ist am 2026-09-06 mit T-209 gefallen** — Pflichtangabe 2 aus 5.2, nachgetragen von
> frontend-dev im selben Auftrag wie die Streichung (E-081 Punkt 4).

`docs/design/textbestand.md:742`. Nichts anderes an dieser Datei geändert.

## 2. A-A-45 — der Vollständigkeitswächter und die vierzehn Zeilen

Die Zeilen aus `traeger-und-zusage.md` 9.6 sind zeichengleich übernommen und je Gruppe an die
Stelle gesetzt, an der ihr Nachbarpaar schon stand — vier echte Paare, sieben Ausnahmezeilen
(`--timer-idle-border` zweimal), vier Einträge in der neuen Liste `noContrastQuestion`.

**Der Fokusring: ich habe mich an die Vorgabe gehalten.** Das Paar mißt
`--focus-ring-contrast` gegen `--focus-ring-color` (min 3, gemessen 5,99 hell / 9,14 dunkel) —
die Nachbarschaft, die `.on-solid:focus-visible` wirklich zeichnet. Es mißt **nicht**, ob der
Fokus auf der Fläche darunter sichtbar ist; T-204 Befund B-11 (gerechnet 1,00:1 am Primärknopf im
hellen Thema) steht als Kommentar unmittelbar am Paar, mit dem Grund, warum er dort nicht
hineingehört. Kein Paar gegen `--bg-surface`, kein roter Lauf in der Welle, die den Wächter
einführt.

**Der Wächter selbst** (`apps/web/scripts/contrast-check.mjs`, neuer Abschnitt
„Vollständigkeit — A-A-45"):

* Er liest den Quellbaum **vom Dateisystem** (`apps/web/src`, 120 Dateien: 116 Quelldateien plus
  4 Stilblätter), nicht aus der Versionsverwaltung — E-087, aus meiner eigenen Messung in T-207:
  zehn Quelldateien sind unversioniert, `git grep` allein ist hier blind.
* „Farbtragend" wird am **aufgelösten** Wert entschieden, in beiden Themen. Das ist der
  Unterschied zwischen `--shadow-xs` (trägt eine Farbe, `parseColor` kann sie trotzdem nicht
  lesen) und `--row-padding-x: var(--space-3)` (enthält ein `var()`, aber keine Farbe). Ohne diese
  Auflösung meldete ein erster Entwurf `--row-padding-x` als fünfzehnten Fund — der Fehler ist
  gemessen und behoben, nicht umgangen.
* **Drei Richtungen**, jede mit eigener Gegenprobe: gezeichnet ohne Nachweis; ein Paar auf eine
  Farbe, die keine Klasse mehr zeichnet (die Richtung, auf die sich `traeger-und-zusage.md` 2.3
  beim Streichen von `--note-billing-rail-stripe` beruft); eine Ausnahme, deren Gegenstand fehlt
  oder die zugleich von einem Paar gemessen wird.
* Die **Grenze** steht im Kopf des Laufs, wie A-A-45 es verlangt: tokengenau, nicht flächengenau;
  nur Token aus `tokens.css`; Dateisystem statt Versionsverwaltung.

**Gemessen, nicht behauptet:** Ich habe eine echte Zeile entfernt
(`--text-on-solid` / `--danger-bg-active`) und den Lauf gefahren — **Exitcode 1**, Befund
wortgenau gemeldet; nach dem Zurücklegen wieder Exitcode 0.

## 3. Nachweis

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** — alle acht Projekte, dazu `typecheck:test` und `typecheck:e2e` |
| `pnpm test` | **77 Dateien, 1464 Tests grün** |
| `pnpm --filter @takt/web build` | grün, 2,00 s |
| `pnpm run contrast` | **253 Paare / 506 Messungen / 0 durchgefallen**, dazu **9 Gegenproben** und **83 gezeichnete Farbtoken, 0 ohne Nachweis** (vorher 242 / 484 / 6) |
| `pnpm run proof:surface` | **20 / 0**, 12 Gegenproben |
| `pnpm run proof:foreign` | **20 / 0**, 3 Gegenproben |
| `pnpm run proof:codepoints` | **45 / 0** |

Die 83 teilen sich in 79 von Paaren gemessene und 4 namentlich ohne Kontrastfrage
(`--shadow-xs`, `--shadow-sm`, `--shadow-lg`, `--bg-scrim`).

## Artefakte

* `apps/web/src/screens/BoardScreen.tsx` — Karte gestrichen, Kommentar an ihrer Stelle, JSDoc des
  Leerzustands berichtigt
* `apps/web/src/styles/app.css` — `.board-setup__points`, `… strong`, `.board-setup__actions`
  gestrichen
* `apps/web/src/showcase/BoardSection.tsx` — Schalterbeschriftung „Leeres Board nach der
  Umstellung" auf „Board ohne Spalten" (Musterseite nachgezogen, `textbestand.md` Welle X+1
  Punkt 4)
* `apps/web/scripts/contrast-check.mjs` — 11 Zeilen aus T-204 9.6, Liste `noContrastQuestion`,
  Vollständigkeitsprüfung in drei Richtungen, 3 neue Gegenproben, Grenze im Kopf des Laufs
* `apps/web/design/DESIGNSYSTEM.md` — Stand auf 253/506/9 und den Wächter berichtigt; die veraltete
  Zahl „376 Paare" in der Befehlsübersicht ersatzlos entfernt statt erneuert
* `apps/web/README.md` — Regel 4 sagt jetzt, daß der Lauf sie erzwingt
* `docs/design/textbestand.md` — **eine Zeile in fremder Hoheit**: Falldatum an SP-22
* `.claude/team/reports/T-209-frontend-dev.md`

## Annahmen

1. **Das Falldatum ist der 2026-09-06**, der Tag dieser Aufgabe. SP-22 verlangt das Datum des
   Falls, nicht das der Freigabe (T-200) oder des Handbuchabsatzes (T-201).
2. **Der Verweisteil aus UM-08 war zu messen, nicht zu bauen.** `TodoFormDialog.tsx:250` trägt ihn
   seit T-181. Eine zweite Fassung hätte die Doppelung wiederhergestellt.
3. **Die Schalterbeschriftung der Musterseite ist mitgezogen.** „nach der Umstellung" ist dieselbe
   zeitgebundene Formulierung, die T-181 aus dem Leerzustand entfernt hat; sie beschrieb einen
   Zustand, dessen Erklärkarte heute fällt. Der Fließtext des Abschnitts (`lead`) blieb — er
   begründet E-054 und ist Gestaltungsdoku, kein Produkttext.
4. **Die dritte Richtung des Wächters** (Ausnahme ohne Gegenstand, Token zugleich gemessen und
   ausgenommen) steht über A-A-45 hinaus. Sie kostet nichts, ist heute grün und hält die
   Ausnahmeliste davon ab, „zur Ablage für alles zu werden, was rot war" (T-204 9.5).
5. **`noContrastQuestion` ist bewußt kein `exempt`-Paar.** Ein Paar auf `--shadow-xs` würde den
   Lauf an `parseColor` **abbrechen**, nicht lockern.

## Risiken

* **B-11 ist gerechnet und weiterhin ungemessen.** Am Primärknopf im hellen Thema tragen innerer
  Ring und Füllung nach Rechnung dieselbe Farbe; vom Fokusring bliebe dort ein Knopf, der um 2 px
  wächst. Das neue Paar deckt das **nicht** ab und behauptet es auch nicht. visual-qa mißt es in
  dieser Welle. Fällt die Messung wie gerechnet aus, ist das SC 2.4.7 und SC 1.4.11 und braucht
  einen eigenen Auftrag.
* **Der Wächter ist tokengenau.** Er findet ein Token ohne Paar. Er findet nicht, daß ein Paar die
  falsche Fläche mißt — der Fall, den T-204 9.3 gerade an `--focus-ring-contrast` gezeigt hat.
  Wer die Zahl „0 ohne Nachweis" für „alle Flächen gemessen" liest, liest zu viel; deshalb steht
  der Satz im Kopf des Laufs.
* **SP-22 hängt an einer Datei, die kein Textdurchgang liest.** Der Eintrag steht jetzt vollständig,
  aber ein Handbuchdurchgang sieht `textbestand.md` nicht. Das ist die Schwäche der Sorte selbst
  (5.2 Pflichtangabe 1), nicht dieser Umsetzung.

## Offene Fragen

1. **`--shadow-md` und `--shadow-drag` sind deklariert und werden nirgends gezeichnet** — gemessen
   beim Bau des Wächters. `DESIGNSYSTEM.md:531` sagt das für `--shadow-drag` selbst („von keiner
   Fläche belegt"), für `--shadow-md` sagt es niemand. Der Wächter meldet sie nicht, weil er nur
   **gezeichnete** Token fordert. Soll die erste Richtung auf „deklariert und nirgends gezeichnet"
   ausgeweitet werden? Das wäre eine Entscheidung über tote Token, keine über Kontrast — ich habe
   sie nicht getroffen.
2. **T-204 Befund B-12** (`--danger-bg-subtle` gegen `--warning-bg`, Kachel gegen Nachbarkachel)
   ist ausdrücklich kein Auftrag aus T-204 und war keiner aus T-209. Er bleibt offen; der neue
   Wächter findet ihn **nicht**, weil beide Token Paare haben — nur nicht gegeneinander. Das ist
   dieselbe Bauart wie T-189-5/-6.
3. **`tests/e2e/board-empty-state-rule-chain.spec.ts:44` braucht `.first()` nicht mehr.** Der
   doppelte zugängliche Name ist mit der Karte gefallen. Der Test läuft weiter (`.first()` von
   einem Treffer ist derselbe Treffer); die Vereinfachung gehört e2e-tester, nicht mir.

## Nächster Schritt

1. **visual-qa** mißt in dieser Welle den Fokusring am Primärknopf im hellen Thema (B-11) und
   nimmt den Board-Leerzustand in beiden Themen mit — er hat jetzt eine Aktion statt dreier.
2. **security-checker** kann A-A-45 gegen den gebauten Stand gegenprüfen; die drei Richtungen und
   ihre drei Gegenproben stehen im Lauf, die Grenze im Kopf.
3. **Orchestrator:** Offene Frage 1 entscheiden (tote Schattentoken) und B-12 einplanen, wenn das
   nächste Mal jemand in `app.css` greift (O-GK).
