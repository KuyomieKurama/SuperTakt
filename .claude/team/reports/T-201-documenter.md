# T-201 — documenter

**Aufgabe:** T-201, Welle AD. **Verfasser:** documenter.
**Geändert:** `docs/benutzerhandbuch.md`. Keine weitere Datei.

---

## 1. O-FE — Vorbedingung für den Fall der Karte „Was sich geändert hat"

**Grundlage geprüft:** `docs/design/textbestand.md` (Nachtrag T-180, Abschnitt „UM-08 — Die
letzte zeitgebundene Erklärfläche bekommt ihre Bedingung", Zeilen 1124–1216) und
`.claude/team/reports/T-180-ux-designer.md` (Abschnitt 3, O-EC). Zusätzlich gegen den tatsächlichen
Kartentext in `apps/web/src/screens/BoardScreen.tsx:1021-1054` gelesen (vier Aufzählungspunkte
wörtlich).

Von den vier Punkten der Karte stehen laut Zuordnungstabelle in `textbestand.md` zwei bereits
anderswo in der Oberfläche (bleiben nach ST-05: `RULE_WHAT_MOVES_A_CARD` im `lead` des Boards für
„Nichts wird mehr gezogen", „Takt erfindet keine." im Leerzustand für „Keine automatische
Übersetzung"). Die anderen zwei — „Ihre Todos sind vollzählig da." vollständig, und von „Der Status
bleibt." der Teil ohne den Verweis „Einstellungen › Status" (der bleibt als Verweisteil in
`TodoFormDialog.tsx:235`, fremde Hoheit) — habe ich als neuen Unterabschnitt „Herkunft der Spalten"
am Ende von „Mit dem Kanban-Board arbeiten" eingefügt (`docs/benutzerhandbuch.md:253-262`).

Ich habe den Text bewusst im Konjunktiv gehalten („Falls sie es doch einmal gewesen wäre: … Es
bliebe …"), weil die Bedingung, unter der die Karte je etwas ausgesagt hätte, laut Beleg **nie**
zutrifft (E-054 fiel vor jeder Veröffentlichung, Migration `0010_drop_board_rank` läuft in jeder
frischen Einrichtung mit, `board_rank` wurde nie von einem Aufrufer gesetzt). Eine Formulierung im
Indikativ hätte eine Migration behauptet, die nie stattgefunden hat — das wäre eine unbelegte
Angabe gewesen. Damit ist die Reihenfolge aus E-081 Punkt 4 eingehalten: Der Absatz steht im
Handbuch, bevor die Karte fällt.

## 2. O-CG — Frist im Outlook-Add-in

**Grundlage geprüft:** `apps/outlook-addin/src/ui/TaskPane.tsx:503-569` (Feld „Frist" im Bereich
„Neues Todo", `type="date"`, kein Vorbelegen, keine Erkennung aus der E-Mail) und der zugehörige
Kopfkommentar (Zeilen 517-551, Bezug A-19.21, A-19.2, E-074, V-03/V-04 aus T-154, gebaut in T-158).
Den Hinweistext am Feld habe ich absichtlich **nicht** zitiert, weil integration-dev ihn in dieser
Welle von der letzten Duz-Form auf „Sie" umstellt (E-080) — beim Lesen stand dort bereits „Sie
tragen sie selbst ein", die Umstellung war zum Zeitpunkt meiner Prüfung schon vollzogen oder gerade
im Gang. Der Handbuchtext beschreibt stattdessen, was das Feld tut: Es lässt sich beim Anlegen
eines neuen Todos setzen, Takt sucht nicht selbst nach einer Frist in der E-Mail, sie bleibt leer
bis zur eigenen Eingabe, ist ein Tag ohne Uhrzeit, und ein leeres Feld bedeutet keine Frist.

Zwei Stellen geändert:
- `docs/benutzerhandbuch.md`, Abschnitt „Ein Todo aus einer E-Mail anlegen": neuer Absatz zum
  Fristfeld ergänzt.
- `docs/benutzerhandbuch.md`, Abschnitt „Was Takt (noch) nicht tut": den Satz „Außerdem lässt sich
  über das Add-in noch keine Frist setzen; das geht bislang nur direkt in Takt, beim Anlegen oder
  in der Detailansicht eines Todos." entfernt — er behauptete das Gegenteil des heutigen Zustands.
  Der Rest des Punkts (Vermerk/Leistung optisch nicht klar unterschieden, keine Anhänge über das
  Add-in) bleibt unverändert stehen, weil dafür kein Gegenbeleg vorliegt.

## 3. Humanizer

Beide neuen Textstellen sind vor dem Einsetzen durch `humanizer:humanizer` gelaufen. Befund:
Halbgeviertstriche in beiden Entwürfen entfernt und durch Doppelpunkt/Punkt ersetzt, ein
Kommafehler bei einer Satzreihung korrigiert. Inhaltlich wurde nichts hinzugefügt oder entfernt.
Der dritte, nur zur Kontrolle mitgegebene Text (die gekürzte Restfassung des Add-in-Punkts unter
„Was Takt (noch) nicht tut") blieb nach Entfernen des mittleren Satzes ohne weitere Änderung
flüssig lesbar.

## 4. Nachweis — Codepunkte

Mir stand kein Kommandozeilenwerkzeug zur Verfügung (kein Bash-Tool in dieser Sitzung), daher
konnte ich `pnpm run proof:codepoints` nicht selbst ausführen. Ich habe stattdessen
`apps/local-api/scripts/proof-codepoints.mjs` gelesen, um die genaue Zeichenklasse zu kennen, und
`docs/benutzerhandbuch.md` mit dem Grep-Werkzeug gegen exakt diese Klasse geprüft (Steuerzeichen
`\x00`-`\x08`, `\x0B`, `\x0C`, `\x0E`-`\x1F`, `\x7F`, dazu die Richtungs- und
Unsichtbar-Zeichen `\x{061C}`, `\x{200B}`-`\x{200F}`, `\x{202A}`-`\x{202E}`, `\x{2066}`-`\x{2069}`,
`\x{FEFF}`) sowie separat auf ein alleinstehendes `\x0D`. Beide Suchen ergaben **keinen** Treffer
in der gesamten Datei. Das deckt den für meine Änderung relevanten Teil des Nachweises ab, ersetzt
aber nicht den vollständigen 45-Kontrollen-Lauf über den gesamten Baum — den kann nur jemand mit
Kommandozeilenzugriff bestätigen.

## Annahmen

1. **UM-08, Punkt „Der Status bleibt":** Ich habe nur den Teil ohne Einstellungsverweis ins
   Handbuch gebracht, wie in `textbestand.md` Zeile 1176 vorgegeben, und den Verweisteil
   bewusst nicht dupliziert — er bleibt Sache von frontend-dev in `TodoFormDialog.tsx:235`.
2. **Formulierung im Konjunktiv:** Da die Bedingung nachweislich nie zutrifft, halte ich die
   Aussage im Handbuch für ehrlicher als eine Vergangenheitsform, die eine tatsächlich erlebte
   Migration unterstellen würde. Sollte spec-ux-reviewer eine andere Zeitform verlangen, ist das
   eine reine Formulierungsfrage, keine Faktenfrage.
3. **Ort des Add-in-Absatzes:** Ich habe den Fristabsatz in „Ein Todo aus einer E-Mail anlegen"
   gesetzt, weil das Feld dort im Code genau in diesem Zusammenhang steht (Bereich „Neues Todo").
   Für das Buchen auf ein bestehendes Todo gibt es im Add-in kein Fristfeld — das habe ich geprüft
   (`TaskPane.tsx`, keine zweite `label="Frist"`-Stelle) und deshalb nicht behauptet.
4. Keine Änderung an `docs/glossar.md`: „Frist" ist dort bereits als Begriff geführt, kein neuer
   Name und kein Konflikt zweier Bezeichnungen gefunden.

## Risiken

1. **O-FE hängt an einer noch offenen Frage an spec-ux-reviewer** (aus T-180, Offene Frage 3): Ob
   die Beweisführung zu UM-08 trägt. Ist die Antwort „nein", müsste mein Absatz inhaltlich
   nachgezogen werden, bevor die Karte fällt — die Reihenfolge bliebe aber gewahrt, weil die Karte
   noch nicht gefallen ist.
2. **O-CG-Text beschreibt das Feld, nicht seinen Wortlaut.** Ändert integration-dev in dieser
   Welle mehr als nur die Anrede am Hinweistext — etwa Reihenfolge oder Bedingungen des Feldes —,
   ist mein Absatz nicht mehr gedeckt und müsste erneut geprüft werden.
3. **Codepunkt-Nachweis unvollständig.** Ich habe nur die geänderte Datei manuell geprüft, nicht
   den gesamten Baum und nicht die übrigen 44 Prüfpunkte des Skripts (Ausnahmeliste, Binärdateien,
   Selbsttest). Kein Sicherheitsbezug, aber eine echte Lücke gegenüber dem verlangten
   „45/0"-Nachweis.

## Offene Fragen

1. **An den Orchestrator:** Soll ich, sobald mir ein Kommandozeilenwerkzeug zur Verfügung steht
   oder ein anderer Agent den Lauf für mich bestätigt, den vollständigen `pnpm run
   proof:codepoints`-Nachweis nachreichen?
2. **An frontend-dev, über den Orchestrator:** O-FE ist jetzt erledigt — der Absatz steht im
   Handbuch. Die Karte in `BoardScreen.tsx:1021-1054` kann in der nächsten Welle fallen, inklusive
   der beiden Knöpfe, die laut `textbestand.md` mitfallen.

## Nächster Schritt

Freigabe durch spec-ux-reviewer für beide Stellen einholen (O-FE nach den drei bisherigen
Zurückstellungen, O-CG als Gegenprobe zur V-04-Freigabe). Danach kann frontend-dev die Karte
„Was sich geändert hat" in der nächsten Welle streichen.
