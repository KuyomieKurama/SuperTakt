# T-267 — Drei gesperrte Oberflächensätze wiederhergestellt, Wächter gebaut

**Aufgabe:** T-267 — Drei gesperrte Oberflächensätze wiederherstellen, und den Wächter bauen,
der sie hält
**Status:** braucht Review
**Rolle:** frontend-dev
**Datum:** 2026-09-10

## Artefakte

| Datei | Was |
|---|---|
| `apps/web/scripts/proof-locked-text.mjs` | **neu** — der Wächter über die Sperrliste der Hauptanwendung |
| `apps/web/package.json` | **neu**: `"proof:locked": "node scripts/proof-locked-text.mjs"` |
| `apps/web/src/features/todos/TodoListFilters.tsx` | SP-03 wiederhergestellt |
| `apps/web/src/features/todos/TodoDetailAside.tsx` | SP-05, beide Hälften wiederhergestellt |
| `apps/web/src/features/todos/TodoDoneSwitch.tsx` | SP-16, zweite Hälfte wiederhergestellt |
| `apps/web/src/styles/app.css` | zwei Regeln: eigene Zeile für den Ordnungshinweis und für den Kennzeichensatz |

## Teil 1 — die drei Sätze

**SP-03**, `features/todos/TodoListFilters.tsx`. An seiner Stelle stand die Kurzfassung
„Bei Fristsortierung stehen Todos ohne Frist am Ende." Ersetzt durch den gesperrten Wortlaut:
„Ein Todo ohne Frist steht in beiden Richtungen am Ende. Es hat keinen Wert, keinen frühesten und
keinen spätesten." Träger bleibt `<p className="todo-list__sort-hint">` — die Klasse hält
`tests/e2e/todo-filter-layout.spec.ts` fest (E-087: vor der Änderung in `git grep` **und** über
den Arbeitsbaum gesucht; zwei Treffer, beide in `tests/e2e/todo-filter-layout.spec.ts`, beide
messen die **Klasse**, nicht den Wortlaut, und bleiben grün).

**SP-05**, `features/todos/TodoDetailAside.tsx`. Beide Hälften:

- die Beschreibung der Fristkarte — „Ein Tag, keine Uhrzeit. Sie ändert nichts an Pools, Spalten,
  Buchungen oder Export — und sie steht in keinem Export."
- der Absatz ohne Frist — „Keine Frist gesetzt. Dieses Todo ist deshalb weder überfällig noch heute
  fällig — es hat schlicht keinen dieser Zustände."

Der erste Satz steht in der Sperrliste nur als Endstück („… sie steht in keinem Export."). Ein
Endstück allein hinzuschreiben wäre ein neuer Wortlaut gewesen; genommen ist deshalb die
**vollständige Fassung vor PR #8** (`git show 5922361^:apps/web/src/screens/TodoDetailScreen.tsx`,
Zeile 421). Nichts daran ist umformuliert.

**SP-16**, `features/todos/TodoDoneSwitch.tsx`. Der Satz stand vor PR #8 im `done-switch__hint` der
Detailansicht und war im Baum **nirgends** mehr. Wiederhergestellt als eigener Absatz unter dem
Schalter, sichtbar genau im Anzeigezustand „Erledigt aufgehoben". Die erste Hälfte
(`reactivationTitle`) war intakt und ist unberührt.

**Eine Abweichung, und sie braucht eine Freigabe:** Der Satz lautet jetzt „… — **SuperTakt** hat
das getan, nicht Sie", die Sperrliste schreibt „Takt". Begründung und Messung stehen unten unter
„Annahmen"; ich habe nicht umformuliert, sondern nur die Marke nach A-21 gesetzt, so wie sie an
sieben weiteren gesperrten Sätzen bereits steht.

## Teil 2 — der Wächter

`apps/web/scripts/proof-locked-text.mjs`, Vorbild `proof:addin` Abschnitt 20. Fünf Abschnitte,
neun Prüfsätze, davon sechs Gegenproben.

- **Die Menge kommt aus der Anforderung** (E-102, E-103): Der Lauf liest die Tabelle in
  `docs/design/textbestand.md` Abschnitt 5 Zeile für Zeile — Nummer, Ortsspalte, Wortlautspalte.
  Keine zweite Liste im Skript. Der Schnitt an der Überschrift ist nötig: Weiter unten steht die
  **Kürzungsliste**, deren erste Zeile ebenfalls mit „SP-09" beginnt.
- **Untergrenze vor dem Urteil:** mindestens 10 Einträge, mindestens 60 Quelldateien, mehr als
  200 000 Zeichen gelesener Quelltext, und höchstens die Hälfte der Einträge ohne jeden Anker.
  Dazu eine eigene Gegenprobe: über einen **leeren** Bestand muß der Sucher jeden Eintrag melden.
- **Beide Richtungen:** ein fehlender **Satz** wird rot, ein fehlender **Fundort** ebenso.
  Aufgelöst wird über den **Dateinamen**, nicht über den Pfad — sonst mäße der Lauf Ordnernamen
  statt Zusagen. Zeilennummern werden ausdrücklich **nicht** gemessen (sie wandern bei jeder
  Einfügung; ein Lauf, der daran rot wird, wird abgeschaltet).
- **Gegenprobe je Eintrag:** In eine Kopie des Bestands wird an genau einem Satz eine plausible
  Kürzung (vordere Hälfte) eingesetzt; gefunden werden muß **genau dieser** Eintrag und kein
  zweiter. 19 Einträge, 19 Gegenproben.
- **Zwei Nachsichten, benannt statt versteckt:** die Marke („SuperTakt" → „Takt", A-21) und die
  Sorte Anführungszeichen (das Papier setzt gerade Schlußzeichen, die Oberfläche typographische).
  Ohne die erste wären sieben Einträge rot — für eine Umbenennung, die die Spezifikation verlangt.
  Wortlaut, Wortstellung, Satzzeichen und Länge sind **keine** Nachsicht.
- **Ein Muster statt des Wortlauts** nur dort, wo das Zitat einen Platzhalter enthält (SP-16:
  „Timer gestartet. „X" ist wieder offen." gegen `${quotedName(todoTitle)}`). Die Entscheidung
  wörtlich/Muster fällt **einmal** gegen den wirklichen Bestand und gilt danach auch in den
  Gegenproben — sonst rutschte ein gekürzter Satz in die weichere Prüfung und bliebe unbemerkt
  (an SP-18 gemessen und behoben).
- **Fremde Hoheit:** SP-22 liegt in `docs/benutzerhandbuch.md`. Gemessen wird, **daß** es die
  Datei gibt, und sonst nichts.

**Die Probe aufs Exempel.** Ich habe die drei Kürzungen aus PR #8 zeitweilig wieder eingesetzt und
den Lauf gefahren. Er meldet genau die drei Befunde, die der spec-ux-reviewer von Hand gefunden
hat, und nennt jeden:

```
+   'SP-03: „Ein Todo ohne Frist steht in beiden Richtungen am Ende. …"',
+   'SP-05: „Keine Frist gesetzt. Dieses Todo ist deshalb weder überfällig …"',
+   'SP-16: „Der Timerstart hat das Kennzeichen aufgehoben — Takt hat das getan, nicht Sie."'
```

Danach zurückgesetzt; der Baum steht auf der wiederhergestellten Fassung.

### Was der Lauf ausgibt (Abschnitt 5, nicht rot, aber laut)

Für ui-designer/ux-designer nachzuziehen — ich trage in `docs/design/**` nichts ein:

| Eintrag | Papier | Baum |
|---|---|---|
| SP-03 | `TodoListScreen.tsx:504` | `features/todos/TodoListFilters.tsx` |
| SP-05 | `TodoDetailScreen.tsx:421, :429-432` | `features/todos/TodoDetailAside.tsx` |
| SP-10 | `SettingsScreen.tsx:524, 527` | `features/settings/ExportSettings.tsx` (und `showcase/ExportDirectorySection.tsx`) |
| SP-16 | `labels.ts:278-280`, `TodoDetailScreen.tsx:401` | erste Hälfte in `lib/labels.ts`, zweite in `features/todos/TodoDoneSwitch.tsx` |
| SP-19 | `StatusSettings.tsx:519-531, :568-596`, `status-admin__blocked` | `features/settings/StatusRow.tsx` (und `styles/app.css`) |
| SP-06 | kein Zitat in der Wortlautspalte | wird nur am Ort gemessen |
| SP-16 | Zitat mit Platzhalter „X" | nur über Muster auflösbar |
| Marke | SP-01, SP-09, SP-12, SP-13, SP-14, SP-16, SP-20 schreiben „Takt" | die Oberfläche schreibt seit A-21 „SuperTakt" |

## Gemessen

Alle Läufe auf diesem Rechner, heute, nacheinander.

| Lauf | vorher | nachher |
|---|---|---|
| `proof:locked` (neu) | — | **9 bestanden, 0 fehlgeschlagen**; 22 Einträge, 19 am Wortlaut gemessen, 27 Satzteile, 26 Fundorte, 8 Bezeichner gegen 176 Quelldateien (1 808 171 Zeichen), 19 Gegenproben |
| `proof:surface` | 27/0; 169 Quelldateien, 29 Live-Regionen, 2 geduldete Sätze | **unverändert** 27/0, dieselben Zahlen |
| `proof:foreign` | 21/0; 169 Quelldateien, 174 Übergaben, 29 Eingabefelder, 8 Reihen | **unverändert** 21/0, dieselben Zahlen |
| `contrast` | 522 Paare, 0 durchgefallen, 11/11 Gegenproben | **unverändert** |
| `proof:codepoints` | 46/0 | **unverändert** 46/0 |
| `vitest apps/web/test` | — | 14 Dateien, **149 Tests grün** |
| `@takt/web typecheck` + `build` | — | fehlerfrei, Bündel gebaut |
| E2E `todo-filter-layout`, `deadline-lifecycle` | — | **4 von 4 grün** |

**Die Erwartung, `proof:foreign` und `proof:surface` würden Zahlen bewegen, hat sich nicht
bestätigt, und das ist gerechnet und nicht gehofft:** Beide zählen Quelldateien, Übergaben,
Eingabefelder und Live-Regionen — keine Sätze. Ich habe keine Datei angelegt, keine Übergabe
fremden Textes gebaut und keine Meldefläche; drei Sätze mehr in bestehenden Knoten ändern an
keiner dieser Mengen etwas. Beide Läufe stehen vorher und nachher zeichengleich auf denselben
Zahlen.

## Sichtprüfung

Gegen die **laufende** Oberfläche (echter lokaler Dienst, echtes Vite, Chromium 1440×900 und
900×900), Bildschirmfotos im Arbeitsverzeichnis dieser Sitzung:

- **SP-03** steht unter „Ordnung" und „Erledigte einblenden" in eigener Zeile, linksbündig, in
  beiden Breiten vollständig lesbar. Der Hinweis stand vorher rechtsbündig am Zeilenende
  (`margin-inline-start: auto`); als zwei Sätze wirkte er dort wie eine Fußnote des Schalters
  daneben. Deshalb `flex-basis: 100%` in jeder Breite — die Geometriezusage von
  `todo-filter-layout.spec.ts` (Select und Schalter in derselben Reihe, Hinweis darunter) gilt
  unverändert und ist nachgemessen grün.
- **SP-05** steht in der Fristkarte der Detailansicht: Beschreibung im Kartenkopf, der Absatz
  darunter im Zustand „ohne Frist".
- **SP-16** steht unter dem Schalter „Erledigt aufgehoben", zusammen mit dem Kennzeichen und —
  im selben Augenblick — der Meldung `reactivationTitle` im Toast. Beide Hälften der Sperre sind
  gleichzeitig sichtbar.

Zustände: Empty (Liste ohne Todos, Fristkarte ohne Wert), Loading (`AsyncBoundary` unberührt),
Hover/Focus/Active (kein Bedienelement geändert), Error (unberührt), Confirmation (unberührt).
Tastaturbedienung und Fokusreihenfolge sind unverändert — es kam kein fokussierbares Element
hinzu, nur Fließtext.

`visual-qa` hat **nicht** geprüft; ich habe die Sichtprüfung selbst gefahren und die Bildschirmfotos
liegen bereit. Eine unabhängige Abnahme steht aus.

## Annahmen

1. **Die Marke in SP-16.** Ich habe „SuperTakt hat das getan, nicht Sie" geschrieben, nicht „Takt".
   Gemessen: In `apps/web/src` steht „Takt" in **keinem** sichtbaren Fließtext mehr — nur in
   Pfaden (`C:\Takt\Export`), in Kommentaren und in technischen Schlüsseln (`X-Takt-Token`). Die
   Geschwistersätze derselben Sperrliste lauten heute „SuperTakt öffnet nur „http"…" (SP-13),
   „SuperTakt lädt nichts herunter…" (SP-12), „SuperTakt übergibt diese Datei…" (SP-01). Ein
   einzelnes „Takt" in dieser Fläche wäre die einzige Stelle des Produkts, die die alte Marke
   spricht. Das ist eine Umbenennung nach A-21, keine Umformulierung — aber es ist eine Abweichung
   vom Wortlaut der Sperrliste, und nach E-078 Punkt 3 entscheidet darüber der Prüfer, der den
   Satz verlangt hat, nicht ich.
2. **Der Ort von SP-03.** Träger ist die sichtbare Zeile (`todo-list__sort-hint`) und nicht der
   `hint` des Auswahlfelds, wie vor PR #8. Grund: `tests/e2e/todo-filter-layout.spec.ts` mißt
   genau diesen Knoten; ihn zu entfernen hieße, einen fremden Prüffall zu brechen. Die Sperrliste
   nennt „die Sortierung der Todo-Liste", nicht das Bedienelement.
3. **Die vollständige Fassung von SP-05.** Siehe oben — das Endstück aus der Tabelle allein wäre
   ein neuer Satz gewesen; genommen ist die Fassung aus dem Bestand vor PR #8.
4. **Zeilennummern mißt der Wächter nicht.** Begründet im Kopf der Datei.

## Risiken

- **`pnpm typecheck` ist rot, und nicht durch diese Aufgabe.** 17 Fehler (TS7006, `implicitly any`)
  in `apps/local-api/src/features/todos/todos.ts` — eine Datei, die im Index als **neu hinzugefügt**
  steht und fremder Hoheit (domain-dev) gehört. `@takt/web typecheck` ist fehlerfrei.
- **Der lokale Dienst startet nicht mehr**, seit derselbe Umbau weiterläuft:
  `ERR_MODULE_NOT_FOUND: apps/local-api/src/features/todos/context.ts`. Meine E2E-Läufe waren
  **davor** grün (4 von 4); danach bricht jeder E2E-Lauf schon im `globalSetup`. Das ist keine
  Folge dieser Aufgabe, blockiert aber die restliche E2E-Abnahme.
- **Der Wächter ist noch nicht im Tor.** Bis `proof:locked` in der Wurzel-`package.json` und in
  `proof:all` steht, ist er ein Lauf, den man von Hand ruft — also genau die Sorte Zusage, die er
  sonst mißt.
- **Nachsicht bei der Marke.** Solange die Sperrliste „Takt" schreibt und die Oberfläche
  „SuperTakt", vergleicht der Wächter beide Marken als gleich. Eine Rückbenennung in der
  Oberfläche würde er also **nicht** melden. Sobald die Liste nachgezogen ist, gehört diese
  Nachsicht ersatzlos gestrichen (drei Zeilen in `comparable`).

## Offene Fragen

1. **SP-16, Marke:** Stimmt der spec-ux-reviewer „SuperTakt hat das getan, nicht Sie" zu (E-078
   Punkt 3)? Fällt die Antwort auf „Takt", ändere ich es in einem Zug — dann steht aber die
   einzige „Takt"-Nennung des Produkts in dieser Zeile.
2. **Die Fundorte im Papier** (Tabelle oben): Wer zieht sie nach — ui-designer im eigenen Auftrag?
   Ich habe `docs/design/**` nicht angefaßt.
3. **Zwei Textstellen der Sperrliste stehen doppelt im Baum:** SP-10 auch in
   `showcase/ExportDirectorySection.tsx`, SP-19 auch in `styles/app.css`. Der Wächter duldet das
   heute (er zählt nicht auf „genau einmal", weil SP-07 seinen Satz absichtlich an zwei Flächen
   trägt). Soll er stattdessen je Eintrag eine erwartete Anzahl halten? Das setzte eine Angabe im
   Papier voraus, die es heute nicht gibt.
4. **`proof:engines`** habe ich nicht gefahren (WebKitGTK, hier nicht vorhanden).

## Nächster Schritt

1. Wortlaut für die Wurzel-`package.json` — **deine Datei**, ich habe nichts eingetragen:

   ```json
   "proof:locked": "pnpm --filter @takt/web proof:locked",
   ```

   und in `proof:all` hinter `proof:surface` einfügen:

   ```
   … && pnpm run proof:surface && pnpm run proof:locked && pnpm run proof:addin-wiring && …
   ```

   Damit fährt `proof:all` **einundzwanzig** Läufe.
2. Die Marke in SP-16 dem spec-ux-reviewer vorlegen (offene Frage 1).
3. Die Fundorte der Sperrliste an ui-designer geben (Tabelle oben).
4. `apps/local-api/src/features/todos/**` an domain-dev zurück — Typprüfung und Diensteinstieg
   sind dort gebrochen, und ohne den Dienst läuft kein E2E-Lauf.
5. `visual-qa` auf die drei Flächen ansetzen: Todo-Liste (Filterzeile, breit und schmal),
   Detailansicht (Fristkarte mit und ohne Wert), Detailansicht im Zustand „Erledigt aufgehoben".
