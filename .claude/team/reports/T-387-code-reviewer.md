Aufgabe: T-387 — Review über T-385 (`proof:codepoints` trägt die versionierten Design-Skills)
Status: fertig
Artefakte: .claude/team/reports/T-387-code-reviewer.md
Zusammenfassung: Die Ausnahme ist vollständig (Pfad, Codepunkt, Anzahl, Grund) und wird bei jeder Abweichung rot; `ttf` steht in `BINAERE_ENDUNGEN` und wird von Abschnitt 3 weiter nachgeprüft. Die ersetzten Kommentarsätze stimmen und behaupten nicht mehr, als der Code tut. Drei Befunde, keiner blockiert.

Prüfung:
- `pnpm run proof:codepoints`: 46 bestanden, 0 fehlgeschlagen, Exit 0. 1110 Textdateien gelesen, 79 binär übersprungen, 1 Ausnahme trifft genau, 68 „nicht auf der Platte“ (alles symbolische Links, siehe unten).
- Gegenprobe selbst gefahren, ohne die Datei im Bestand anzufassen: Kopien des Skripts im Scratchpad (Imports über Links auf `source-resolve.mjs` und `@takt/*`, gleiches `ROOT`).
  - `anzahl: 3` → Exit 1, 2 FEHL („4 Fundstelle(n)“ und „U+200B: 4 statt 3“).
  - `anzahl: 5` → Exit 1, 2 FEHL („4 statt 5“).
  - `ttf` aus `BINAERE_ENDUNGEN` entfernt → Exit 1, „jede gelesene Datei ist gültiges UTF-8“ rot, alle `.ttf` genannt.
  - Anderer Codepunkt und andere Datei: bereits von Abschnitt 5 gemessen („deckt nur ihren eigenen Codepunkt“ / „nur ihre eigene Datei“), beides grün.
  E-103 ist damit erfüllt: eingelöst, ins Leere zeigend, mit Gegenprobe.
- Inhalt der Ausnahme nachgesehen: `PLAN-TEMPLATE.md` trägt U+200B genau in Zeile 19, 22, 29, 35, jeweils direkt vor einem inneren ``` innerhalb eines äußeren ```markdown-Zauns. Der Grund im Eintrag ist sachlich richtig. „Escape-Folge geht nicht“ trifft zu: Im Codeblock wird eine Zeichenreferenz nicht aufgelöst, und eine Änderung am Fremdbestand bräche den `computedHash` in `skills-lock.json`.
- `pnpm run proof:all`: Exit 0. Alle 22 mit `&&` verketteten Läufe stehen mit „0 fehlgeschlagen“ (bzw. „7 Prüfungen und 54 Gegenproben bestanden“) im Protokoll. Der einzige Treffer auf „FEHL“ ist der Prüfsatz „FEHLT der Schlüssel“ in proof:export-api, also kein Fehlschlag.
- `.gitignore`: `git check-ignore -v` meldet `.gitignore:129:.coverage` für `.agents/skills/ui-styling/scripts/.coverage`. Keine versionierte Datei wird durch das Muster verdeckt (`git ls-files -ci --exclude-standard` ohne Treffer).
- Symbolische Links: alle 68 zeigen auf `../../.agents/skills/<name>`. Die Zielzeichenketten enthalten 0 Nicht-ASCII-Zeichen (gemessen über `readlink`).
- LSP: nicht verfügbar (`typescript-language-server` fehlt in `$PATH`). Die Datei ist `.mjs` und nicht Teil von `typecheck`. Das Skript läuft unter Node fehlerfrei.
- Nicht gefahren: `pnpm check` insgesamt, weil der Auftrag nur Nachweisläufe betrifft.

Befunde:

```
apps/local-api/scripts/proof-codepoints.mjs:97   niedrig  Kopfkommentar nennt als Inhalt von BINAERE_ENDUNGEN nur „Bilddateien und Symbole“, blinder Fleck d) (Z. 150) nur „Bilddateien“; seit T-385 stehen dort auch Schriften. Beide Stellen um Schriften (`ttf`) ergänzen, auf Englisch (E-118, berührter Bereich).
apps/local-api/scripts/proof-codepoints.mjs:583  mittel   Vorbestehend, durch T-385 verschärft: `catch {}` beim Lesen verbucht jeden Fehler (EISDIR, EACCES, ENOENT) als „nicht auf der Platte“. Die 68 Verzeichnislinks landen dort, und die Liste taugt nicht mehr als Signal für gelöschte, nicht eingetragene Dateien; der Kommentar Z. 584 stimmt für sie nicht. Fix als eigene Aufgabe: `lstat` zuerst; Links getrennt zählen und ihr `readlink`-Ziel als Text durch `findeImText` schicken; nur ENOENT als „fehlend“, jeden anderen Fehler rot.
.gitignore:126                                   niedrig  Neuer Kommentar ist deutsch. E-118 verlangt Englisch für neue Kommentare. Auf Englisch fassen, z. B. „Python coverage database (SQLite), arrived with an installed skill on 2026-09-23; a run artefact, not source (T-385).“ Die Datei gehört dem Orchestrator, er ändert sie.
```

Zur offenen Frage aus T-385 (symbolische Links): **blockiert nicht.** Die Inhalte hinter allen 68 Links liegen unter `.agents/skills/` und werden dort vollständig gelesen, was die 1110 gelesenen Dateien und die gefundene Ausnahme belegen. Die Zielzeichenketten sind reines ASCII und zeigen alle in den Baum. Der blinde Fleck (verstecktes Zeichen im Linkziel, Signalverlust bei „nicht auf der Platte“) ist echt, bestand aber schon vorher. Er gehört als eigene Aufgabe an domain-dev, Vorschlag wie im Befund zu Z. 583. Das Tor soll dabei rot werden, wenn ein Link aus dem Baum hinauszeigt.

Dateihoheit: T-385 hat nur `apps/local-api/scripts/proof-codepoints.mjs` geändert (domain-dev, zulässig). Die `.gitignore`-Zeile stammt laut Board vom Orchestrator (gemeinsame Datei, zulässig). Keine Verletzung.

Minimalität: Die Änderung besteht aus einem Listeneintrag, einer Endung und zwei ersetzten Kommentarsätzen. `.agents/` ist nicht pauschal ausgenommen, und es gibt weder Muster noch Sternchen. Andere Läufe sind davon nicht berührt; `proof:all` ist grün.

Annahmen: Die Gegenprobe über Scratchpad-Kopien misst dasselbe wie eine Änderung im Bestand, weil `ROOT` über den aufgelösten Pfad von `source-resolve.mjs` bestimmt wird. Die Ausgabe (1110 gelesen, dieselbe Ausnahme) bestätigt das.
Risiken: Die Fremdvorlage kann bei einem Skill-Update die Zahl der U+200B ändern; der Lauf wird dann rot, was gewollt ist. Bewertet wird das in T-386.
Offene Fragen: keine.
Nächster Schritt: Eigene Aufgabe für domain-dev zur Behandlung symbolischer Links in `proof:codepoints` (Befund Z. 583) und die Kommentarkorrektur Z. 97/150 in derselben Aufgabe. `.gitignore`-Kommentar übersetzt der Orchestrator.

Urteil: **freigegeben**
