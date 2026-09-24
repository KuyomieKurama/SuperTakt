Aufgabe: T-385 — `proof:codepoints` trägt die versionierten Design-Skills
Status: braucht Review
Artefakte:
- apps/local-api/scripts/proof-codepoints.mjs

Zusammenfassung: `ttf` steht in `BINAERE_ENDUNGEN`; Abschnitt 3 prüft unverändert, daß jede übersprungene Datei ein Nullbyte in den ersten 8000 trägt und jede Endung im Baum vorkommt. `AUSNAHMEN` trägt einen Eintrag: `.agents/skills/improve-animations/PLAN-TEMPLATE.md`, U+200B, Anzahl 4, Grund (Codezaun-Trenner in einer Fremdvorlage, installiert 2026-09-23, T-385). Zwei Kommentarsätze, die „die Liste ist heute leer" behaupteten, sind durch englische Sätze ersetzt; sonst ist kein deutscher Kommentar umgeschrieben.

Prüfung:
- `pnpm run proof:codepoints`: 46 bestanden, 0 fehlgeschlagen. 1110 Textdateien gelesen, 79 Binärdateien übersprungen (darunter 54 `.ttf`, alle mit Nullbyte), 1 Ausnahme trifft genau.
- Nachweis ±1: Anzahl vorübergehend auf 3 und auf 5 gesetzt. Beide Male rot (Exit 1, 2 FEHL: 4 offene Fundstellen plus „4 statt 3" bzw. „4 statt 5"). Danach auf 4 zurückgesetzt. Die Fremdvorlage selbst wurde nicht angefaßt.
- `.coverage` taucht nicht mehr auf: `git check-ignore` meldet `.gitignore:129:.coverage` für `.agents/skills/ui-styling/scripts/.coverage`.
- `pnpm run proof:all`: Exit 0. Alle 22 mit `&&` verketteten Läufe sind grün, kein einziges FEHL im Protokoll.
- Nicht gefahren: `pnpm check` insgesamt (typecheck, test:coverage, build usw.), weil der Auftrag nur die Nachweisläufe verlangt.

Annahmen:
- Beide Kommentarsätze („Die Liste ist heute leer") wären nach der Änderung falsch gewesen. Sie liegen im geänderten Bereich und sind deshalb knapp auf Englisch ersetzt (E-118, CLAUDE.md: veraltete Kommentare entfernen).

Risiken:
- Blinder Fleck, schon vorher vorhanden und durch T-385 größer: Die 68 Verweise unter `.claude/skills/*` und `.hermes/skills/*` sind symbolische Links auf Verzeichnisse. `readFileSync` scheitert daran, und der Lauf zählt sie als „nicht auf der Platte". Er wird davon nicht rot und prüft auch das Linkziel nicht. Die Inhalte selbst werden unter `.agents/skills/` gelesen und geprüft, also bleibt nichts ungelesen. Ein Link, dessen **Zielpfad** ein verstecktes Zeichen trägt, fiele aber durch. Außerdem geht die Liste „nicht auf der Platte" jetzt in diesen Links unter und fällt als Signal für gelöschte, noch nicht eingetragene Dateien kaum noch auf.
- Die Ausnahme deckt genau 4 × U+200B in einer Datei und nichts anderes. `.agents/` ist nicht pauschal ausgenommen.

Offene Fragen:
- Sollen symbolische Links in `proof:codepoints` eigens behandelt werden? Vorschlag: mit `lstat` erkennen, das Linkziel (`readlink`) als Text auf das Zeichen prüfen und getrennt von „nicht auf der Platte" zählen. Das ist eine eigene Aufgabe und gehört nicht zu T-385.

Nächster Schritt: T-386 (Sicherheitsfreigabe) und T-387 (Review) wie geplant. Dabei die Frage zu den symbolischen Links entscheiden.

## Nachtrag: zurückgenommen

Aufgabe: T-385 (Nachtrag) — die Anpassung an `proof:codepoints` zurücknehmen
Status: fertig
Artefakte:
- apps/local-api/scripts/proof-codepoints.mjs (auf `HEAD` zurückgesetzt)
- .claude/team/reports/T-385-domain-dev.md (dieser Abschnitt)

Zusammenfassung: Der Auftraggeber hat nach T-386 entschieden, daß die Skills nicht versioniert werden, nur `skills-lock.json`. `.agents/`, `.claude/skills/` und `.hermes/` stehen in `.gitignore`. Der `ttf`-Eintrag in `BINAERE_ENDUNGEN` und die Ausnahme für `PLAN-TEMPLATE.md` hätten nichts mehr getroffen und wären nach dem eigenen Mechanismus rot geworden. Beides ist mit `git checkout -- apps/local-api/scripts/proof-codepoints.mjs` zurückgenommen.

Prüfung:
- Vorher `git diff --stat`: 1 Datei, 18 Zeilen dazu, 9 weg. Nachher `git diff --exit-code -- apps/local-api/scripts/proof-codepoints.mjs`: Exit 0, kein Unterschied. Die Datei fehlt in `git status --short`.
- `pnpm run proof:codepoints`: 46 bestanden, 0 fehlgeschlagen. 893 Dateien versioniert, 1 neu und nicht ausgeschlossen (894). 869 Textdateien gelesen, 25 Binärdateien übersprungen. 0 Ausnahmen eingetragen. „Jede eingetragene Endung kommt im Baum vor“ ist grün.
- `skills-lock.json` ist genau die eine neue, nicht ausgeschlossene Datei. Sie wird als UTF-8-Text gelesen und löst nichts aus: keine Beanstandung und keine Binärwertung.
- `pnpm run proof:all`: Exit 0, alle 22 verketteten Läufe sind grün. Zahlen je Lauf: codepoints 46, migrations „aktuell (56 Datei(en))“, openapi 115, callers 74, conflicts 158, tags 45, access 111, export 98, export-api 72, taskpane 33, foreign 21, surface 54, clamp 21, locked 9, addin-wiring 32, layers 52, route-policy 55, release-safety 158, shell-surface „7 Prüfungen und 54 Gegenproben“, template-fields 30, db-permissions 27, addin 307. Jede Zusammenfassung meldet 0 fehlgeschlagen. Die Suche nach „FEHL“ trifft nur „0 fehlgeschlagen“ und Prüftexte wie „Fehlschlag“ oder „Fehlen“, keine Beanstandung.
- Nicht gefahren: `pnpm check` insgesamt, weil der Auftrag nur die Nachweisläufe verlangt.

Annahmen: keine.

Risiken: Die Frage zu den symbolischen Links aus dem ersten Teil ist gegenstandslos, solange `.claude/skills/` und `.hermes/` ignoriert werden. Sie wird wieder aktuell, sobald ein symbolischer Link versioniert wird.

Offene Fragen: keine.

Nächster Schritt: Der Orchestrator nimmt `skills-lock.json` zusammen mit der `.gitignore`-Änderung in einen Commit auf. `proof:codepoints` braucht dafür keine Anpassung.
