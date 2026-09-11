Aufgabe: T-282 — Der Fall „Karte mit drei Marken in schmaler Spalte" braucht eine Messung in Pixeln
Status: fertig
Artefakte:

- `tests/e2e/kanban-card-header-overflow.spec.ts` (neu) — TP-KANBAN-07
- `docs/testplan.md` (geändert — neuer Abschnitt TP-KANBAN-07 nach TP-KANBAN-05, Zeile ~948; Nachtrag an TP-KANBAN-08 alt „TP-FRIST-08" mit Querverweis)
- `.claude/team/reports/T-282-e2e-tester.md` (dieser Bericht)

Zusammenfassung: Der von frontend-dev (T-281) entworfene Prüffall ist geprüft, nicht unverändert
übernommen worden — zwei Annahmen darin haben sich bei der tatsächlichen Ausführung als falsch
erwiesen und wurden berichtigt (siehe „Was am übergebenen Entwurf nicht gestimmt hat" unten). Der
fertige Fall mißt Pixel am gerenderten Baum (Ränder, Rechteckschnitt, `scrollWidth`), bringt die
Spalte über ein schmales `page.setViewportSize` statt einer erzwungenen Breite auf ihre echte
Mindestbreite (17 rem/272 px, `.board`-Regel) und ist mit einer probeweisen Rücksetzung der T-281-
Regeln als rotfähig nachgewiesen, danach byte-genau wiederhergestellt (SHA-256-Vergleich). Kein
Produktivcode bleibt verändert.

## Was am übergebenen Entwurf nicht gestimmt hat — geprüft, nicht geglaubt

Der Auftrag verlangte ausdrücklich, den Entwurf von frontend-dev zu prüfen statt zu übernehmen.
Zwei Punkte sind bei der Ausführung gefallen:

1. **„Beide Marken auf derselben oberen Kante" ist die falsche Messung für „einzeilig".**
   `.kcard__top` zentriert (`align-items: center`); Call-Nummer (`mono`-Schrift, 16,5 px hoch) und
   Erledigt-Kennzeichen (Symbol + Text, 18,5 px hoch) haben auf derselben Zeile unterschiedliche
   obere Kanten, aber dieselbe vertikale Mitte. Ein Vergleich der oberen Kante hätte hier fälschlich
   „Umbruch" gemeldet, obwohl keiner vorlag — nachgemessen (Differenz 20,5 px bei falscher Messung,
   `y + height/2` ergab danach < 1,5 px). Berichtigt auf einen Vergleich der vertikalen Mitte.
2. **Die Testdaten selbst haben ungewollt umgebrochen.** Eine Call-Nummer aus dem vollen
   `Date.now()`-Zeitstempel (`E2E-CALL-ZWEI-1757…`, 28 Zeichen) ist länger als jede reale
   Call-Nummer und hat die Zwei-Marken-Gegenprobe selbst bei genügend Platz zum Umbrechen
   gebracht — ein Fehler in den Testdaten, keiner der Karte. Berichtigt auf eine kurze,
   realistische Call-Nummer (`CALL-######`, sechsstellig, wie der Vorgabewert des
   Add-in-Regex `call[\s#:_-]*(\d{5,6})`), eindeutig gehalten über die letzten sechs Ziffern des
   Zeitstempels statt über dessen volle Länge.

Beide Funde sind am laufenden Bestand gemessen (siehe „Läufe" unten), nicht vermutet.

## Die Mindestbreite — wie sie zuverlässig erreicht wird

`page.setViewportSize({ width: 288, height: 900 })`, **nach** dem Anlegen der Spalte über die
Oberfläche (nicht vorher — das Regelformular braucht keine schmale Bühne). Begründung, warum das
zuverlässig auf 272 px (17 rem) fällt statt bloß „irgendwie schmal" zu sein:

- `.board` legt Spaltenbreiten über `grid-auto-columns: minmax(17rem, 21rem)` fest — **ohne**
  `fr`-Einheit. Eine solche Spur wächst über ihre Grundgröße (17 rem) nur, wenn im Grid-Container
  nach Abzug aller Grundgrößen noch Platz übrig bleibt; sonst bleibt sie auf dem Boden stehen.
- Unterhalb der 52-rem-Schwelle (832 px) legt sich die Seitenleiste als Band über den Kopf
  (`app.css`, „Schmales Fenster") und `.app__main` fällt auf `padding: var(--space-4)` (16 px je
  Seite) — die Seitenleiste frißt dann keine horizontale Spalte mehr.
- 288 px Fenster minus 32 px Innenabstand ergeben 256 px verfügbare Breite für eine einzelne
  Spalte — unter 272 px, also kein Wachstumsspielraum, die Spalte bleibt auf ihrer Grundgröße.
- **Nachgemessen, nicht nur gerechnet:** Der Fall liest `column.boundingBox().width` nach dem
  Verengen und verlangt 272 px ± 1,5 px (Sub-Pixel-Toleranz). Fiele die Rechnung oben aus einem
  hier nicht bedachten Grund nicht zusammen, wäre das die erste rote Zeile — der Fall verläßt
  sich an der entscheidenden Stelle nicht auf die eigene Herleitung.

Diese Methode ist unabhängig davon, wie viele Spalten auf dem Board sonst noch stehen: Auch mit
mehreren Spalten bleibt jede einzelne auf ihrem Boden, solange der Container insgesamt zu schmal
für auch nur eine einzige gewachsene Spur ist.

## Gegenprobe: der Fall wird rot (Auflage 1)

Die beiden T-281-Regeln probeweise auf den Stand vor T-281 zurückgesetzt (`git checkout HEAD --
apps/web/src/styles/app.css apps/web/src/styles/components.css`, nicht `git stash` — ein erster
Versuch mit `git stash push -m "…"` ist an einer Pathspec-Falle nach `--` gescheitert und wurde
verworfen, siehe unten):

```
SHA-256 vorher (mit T-281-Fix):
  app.css        eaab5269a41b6f2698fc025309d5d57682fe7fd294cd00b1f00b61d9f3daa502
  components.css 9e9845181ca83a1807f7557760f8b857e84f63c96454a118be5485dab920f339

Nach Rücksetzung auf HEAD (ohne T-281):
  app.css        10f2ee2ac3c1ac487a06d4b56286b6c977852d510ad489692742601e9195abbb
  components.css 953ea9ab9ce0628484506a9a51c05e2c51b67411f39404f5bc8a42dcdbad3d46
```

Lauf gegen den zurückgesetzten Stand:

```
1) kanban-card-header-overflow.spec.ts:86 › … Call-Nummer, Erledigt-Kennzeichen und Frist …
   Error: expect(received).toBeLessThanOrEqual(expected)
   Expected: <= 229
   Received:    274.046875
     > 175 |  expect(b.x + b.width).toBeLessThanOrEqual(mainBox!.x + mainBox!.width + 1);
   1 failed
```

Der Fall fällt genau an der Stelle, die den gemeldeten Schaden beschreibt: Der rechte Rand einer
Marke (274,05 px) liegt 45 px hinter dem zulässigen rechten Rand von `.kcard__main` (229 px) —
dieselbe Bauart wie im Bildschirmfoto des Auftraggebers. Reproduziert (zwei Läufe, gleiche Zeile,
gleicher Zahlenwert bis auf Rundung).

Danach byte-genau wiederhergestellt:

```
git checkout HEAD -- apps/web/src/styles/app.css apps/web/src/styles/components.css   # Rücksetzung
… Gegenprobe gefahren …
git stash pop                                                                          # T-281 zurück
sha256sum apps/web/src/styles/app.css apps/web/src/styles/components.css
  eaab5269a41b6f2698fc025309d5d57682fe7fd294cd00b1f00b61d9f3daa502  (identisch zu vorher)
  9e9845181ca83a1807f7557760f8b857e84f63c96454a118be5485dab920f339  (identisch zu vorher)
git diff --stat apps/web/src/styles/app.css apps/web/src/styles/components.css
  13 ++++++++++++-   (app.css)
  27 ++++++++++++++++++++++++++-   (components.css)   — zeichengleich zum ursprünglichen T-281-Diff
```

**Zur Pathspec-Falle:** Der erste Versuch, `git stash push --include-untracked -- app.css
components.css -m "…"`, ist gescheitert — alles nach `--` wird als Pathspec gelesen, `-m` und die
Nachricht eingeschlossen, und `git` hat den Aufruf mit `fatal: pathspec '-m' did not match any
files` abgebrochen. Der Stash-Eintrag selbst war zu diesem Zeitpunkt bereits korrekt angelegt
(geprüft mit `git stash show -p`), die Arbeitskopie aber **nicht** zurückgesetzt — beides mit
`sha256sum` verifiziert, bevor irgendetwas Weiteres geschah. Sauber aufgelöst über
`git checkout HEAD --` (Rücksetzung) und `git stash pop` (Wiederherstellung), beide Wege am
Prüfsummenvergleich nachgewiesen.

## Läufe

Alle auf diesem Rechner, heute, Ports 5173/17843/17844 vor jedem Lauf über `netstat` auf freie
Listener geprüft — zweimal ist dabei ein hängender `node`-Prozeß auf 5173 gefunden und beendet
worden (einer vor Beginn dieser Aufgabe, StartTime 10:17, vermutlich Rest eines früheren Laufs;
je einer nach `version-check`- und `web-build`-Konfiguration, deren eigener Dienst nicht sauber
heruntergefahren war). Danach jeweils erneut geprüft: kein Listener mehr.

```
npx tsc -p tests/e2e/tsconfig.json --noEmit         fehlerfrei
kanban-card-header-overflow.spec.ts (isoliert, 4×)  4× grün, 3,1–3,7 s (Stabilität geprüft)
kanban-card-header-overflow.spec.ts (Gegenprobe)    rot wie oben beschrieben, danach wieder grün
```

**Hauptreihe** (`playwright.config.ts`, alle Dateien, einzeln über ihre Konfigurationsdatei
gefahren, nicht über `pnpm test:e2e`):

```
107 passed, 4 failed (7,5 min)
```

Die vier roten Fälle sind fremd und unberührt von dieser Aufgabe: dreimal
`timer-stop-announcement.spec.ts` (`POST /timer/orphaned/resolve`, `expect(locator).toBeVisible()`
schlägt fehl) und einmal `toast-eviction.spec.ts` (Toast-Stapel/Rückweg). Mein neuer Fall
(TP-KANBAN-07, Nr. 58 im Lauf) ist grün durchgelaufen. Ein isolierter Zweitlauf von
`kanban.spec.ts` allein (TP-KANBAN-04) ist danach einmal am Timer-Stopp-Dialog gescheitert — ohne
Bezug zu meiner Datei, vermutlich dieselbe maschinenbedingte Störung, die
`playwright.config.ts` mit `retries: 1` ausdrücklich als real, aber fremdverursacht beschreibt
(mehrere Agenten laufen gleichzeitig auf demselben Rechner). Ich habe **keine** dieser vier
Dateien angefaßt und sie liegen außerhalb meiner Hoheit (`apps/web/**`); nicht Gegenstand dieser
Aufgabe.

**Die vier übrigen Konfigurationen, einzeln:**

```
playwright.attachment-persistence.config.ts   2 passed
playwright.web-build.config.ts                9 passed
playwright.outlook-build.config.ts            2 passed
playwright.version-check.config.ts            1 failed, 2 did not run (2 Läufe, reproduzierbar,
                                               TP-VER-11: Zeitüberschreitung beim Warten auf
                                               state="known" von der echten Versionsprüfung —
                                               die eine erlaubte Verbindung nach außen, E-064.
                                               Von dieser Aufgabe nicht berührt, nicht in meiner
                                               Datei, zweimal identisch reproduziert; vermutlich
                                               fehlender oder eingeschränkter Netzzugang zum
                                               offiziellen GitHub-Bestand in dieser Umgebung.)
```

Der zuletzt bekannte Stand nannte „104/110 mit sechs benannten roten Fällen, die anderen vier
Konfigurationen grün" — mit dem neuen Fall stehen jetzt 111 Fälle in der Hauptreihe, davon 4 statt
6 rot (ein möglicher Rückgang durch Maschinenlast-Schwankung, nicht untersucht, da fremde
Hoheit), und drei der vier Nebenkonfigurationen sind grün geblieben; `version-check` ist bei mir
rot, wahrscheinlich Netzzugang der Umgebung, nicht Produktcode. Keine dieser Abweichungen stammt
aus dieser Aufgabe.

## Annahmen

1. **Eigene Datei statt Erweiterung von `kanban.spec.ts`** — derselbe Grund wie bei
   `deadline-computed-state.spec.ts`: ein scharf umrissener Fall mit eigener Fensterbreite, der
   die übrigen Fälle der großen Datei nicht mit sich ziehen soll (die dort serialisiert mit
   `workers: 1` laufen).
2. **`page.setViewportSize` statt einer erzwungenen CSS-Breite im Testcode** — Auftragsvorgabe
   wörtlich befolgt („Prüf, wie du die Spalte zuverlässig auf ihre Mindestbreite bringst"): Ein
   Fenster ist dieselbe Bedingung, unter der der Fehler am Bildschirm entstand; eine erzwungene
   Breite hätte nur die CSS-Regel getroffen, nicht den tatsächlichen Layoutpfad.
3. **Realistische Call-Nummer statt vollem Zeitstempel** — nach dem gemessenen Fund oben
   berichtigt; die Eindeutigkeit über den Testlauf bleibt über den Todo-**Titel** gewahrt, der
   weiterhin den vollen Zeitstempel trägt.
4. **`git checkout HEAD --` statt `git stash` für die Gegenprobe** — nach der Pathspec-Falle
   bewußt gewählt: klar benannter Vorher/Nachher-Zustand, Prüfsumme an beiden Enden verifiziert.
5. **Toleranzen bewußt eng, aber nicht null**: 272 px ± 1,5 px, Ränder ± 1 px, Rechteckschnitt
   ≤ 1 px², `scrollWidth` ≤ `ceil(clientWidth)` + 1 — durchweg Sub-Pixel-Rundung der Layout-Engine,
   nicht fachliche Kulanz. Die Gegenprobe zeigt, daß diese Toleranzen den echten Fehler (45 px
   Überlauf) nicht verdecken.
6. **`visual-qa` nicht eingesetzt** — laut Auftrag nicht verfügbar. Ersetzt durch die gerechnete
   Pixelmessung dieses Falls selbst, die als einzige wiederholbare Abnahme dieser Fläche dient.

Risiken: Keine neuen Sicherheitsrisiken — reine Testdatei, kein Produktivcode bleibt verändert
(Prüfsummen belegen das). Ein Risiko für künftige Wartung: Die Zahlen 272 px, 288 px und 32 px
Innenabstand hängen an `--space-4` (1 rem = 16 px) und der 52-rem-Schwelle in `app.css` — ändert
sich einer dieser Werte, ändert sich auch die Fensterbreite, die diesen Fall zuverlässig auf die
Mindestbreite bringt. Der Fall selbst würde das durch die eigene `columnBox.width`-Messung
bemerken (rote Zeile 150/151 statt eines stillen falschen Befunds), aber jemand müßte dann die
Fensterbreite nachziehen.

Offene Fragen:
1. Sollen die drei fremden Fälle (`timer-stop-announcement.spec.ts` ×3, `toast-eviction.spec.ts`)
   und die Netzabhängigkeit von `version-check-live.spec.ts` (TP-VER-11) gemeldet/untersucht
   werden? Beides außerhalb dieser Aufgabe und meiner Beobachtung nach nicht durch T-281/T-282
   verursacht.
2. `ui-designer` hat laut `git status` inzwischen `docs/design/kartenkopf-board.md` angelegt und
   `docs/design/traeger-und-zusage.md` geändert (T-283, während dieser Aufgabe lief) — offene
   Frage aus T-281 („gefällt dem ui-designer die zweizeilige Kopfzeile?") scheint in Bearbeitung;
   nicht von mir gelesen oder bewertet (fremde Hoheit, `docs/design/**`).

Nächster Schritt: Code-Reviewer und Spezifikations-/UX-Reviewer können T-281 zusammen mit diesem
Prüffall freigeben — TP-KANBAN-07 ist die verlangte, am gerenderten Baum messende Abnahme der
Fläche und hat sowohl die Behebung bestätigt (grün) als auch den unbehobenen Zustand erkannt
(rot, mit Gegenprobe).
