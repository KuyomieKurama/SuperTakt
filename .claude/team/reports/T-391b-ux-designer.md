Aufgabe: T-391b — Designpapiere nachziehen (klein)
Status: fertig
Artefakte:
- docs/design/todo-tabelle-fluss.md (6.3, Zeile „abweisbar“)
- docs/design/textbestand.md (Zeile 575, SP-04, SP-21, 11.4 Fristhinweis, Nachtrag am Dateiende)
- docs/design/textbestand-aufgabenbereich.md (Tabelle Zeile 252, SP-A-02, Abschnitt 9 Punkt 1)
- docs/design/welle-18-fluss.md (§14 Antworttabelle; Folgestellen 2.3, 4.1, AK-6.4, AK-8.2, 9.3, 10)
- .claude/team/reports/T-391b-ux-designer.md

Zusammenfassung:
Der Verweis auf `stopClosingKeys` ist ersetzt: Dass `Escape` nur der obersten Fläche gehört, trägt jetzt der Ebenenstapel von Zag (Ark UI `Popover`). Der Verweis nennt T-390 und E-126 Punkt 5 und warnt vor einer neuen `stopPropagation`-Bremse. SP-04, SP-A-02 und 11.4 tragen jetzt den O-GF-Wortlaut aus T-393: gemeinsamer Kern, im Add-in der Vorsatz, in der Hauptanwendung der 00:00-Satz. SP-21 trägt den positiven Umfangssatz aus K-15 samt Begleittexten, darunter die Gruppe „Im Vermerk (intern)“. In welle-18-fluss §14 stehen F-1 bis F-10 als beantwortet, mit Quelle und Folge. Veraltete Verweise auf „open question“ im Rumpf sind nachgezogen.

Prüfung: Nur Dokumente geändert. Die Wortlaute sind zeichengenau gegen T-393 abgeglichen (Kern, Add-in-Vorsatz, 00:00-Satz, K-15). Die Antworten sind gegen E-122 bis E-127 abgeglichen. Kein Lauf nötig. Die E-087-Suche hat T-393 bereits gemessen: Keiner der Wortlaute steht in einem Prüffall. Ich habe sie nicht wiederholt.

Annahmen:
- F-2 ist durch E-123 Punkt 1 (en-GB) beantwortet, obwohl E-123 die Frage als Q-1 aus T-392 führt.
- Die bisherigen Wortlaute von SP-04 und SP-21 bleiben bis zum Bau gesperrt und wahr. Die neuen Fassungen sind als „freigegeben, noch nicht gebaut“ markiert.
- Zeilenangaben mit heutigem Stand (`TodoFormDialog.tsx:254`, `TaskPane.tsx:507`) stehen neben den alten. Die alten sind nicht gelöscht.
- F-1: Schlüsselname und Parameter des Bewegungssatzes lege ich nicht fest. Das macht der umsetzende Auftrag.

Risiken: Keine Sicherheitsfolge. Ohne den Nachweis GF-03 laufen die zwei Kopien des Frist-Kerns wieder auseinander.

Offene Fragen: keine.

Nächster Schritt: O-GF (integration-dev und frontend-dev in einer Welle) und O-CP (frontend-dev) setzen die Wortlaute um. Danach ersetzt die Sperrliste die alten Fassungen endgültig.

---

## Nachtrag 2026-09-25 — zweiter Auftrag unter derselben Nummer

Aufgabe: T-391b (erneut erteilt) — welle-18-fluss.md gegen den Code, E-121-Beschriftungen, §14, `stopClosingKeys`
Status: braucht Review
Artefakte:
- docs/design/welle-18-fluss.md (4.2: Tabelle „When the dialog closes and when it does not“; 4.3: Verweis darauf)
- .claude/team/reports/T-391b-ux-designer.md (dieser Nachtrag; der Bericht oben bleibt unverändert)

Zusammenfassung: Vier der fünf Punkte des Auftrags waren bereits erledigt oder trafen nicht zu. Geändert habe ich nur eines: In 4.2 steht jetzt, wann der Stoppdialog schließt und wann nicht. Im Zustand `saving` sind Escape, „Weiterlaufen lassen“ und das Kreuz gemeinsam gesperrt. Escape gehört nur der obersten Ebene. Die Abdunklung schließt nie. 4.3 verweist darauf.

Prüfung: Nur Dokumente geändert, kein Lauf. Gelesen, nicht ausgeführt: `FormDialog.tsx:355-392` (`closeOnEscape={!busy}`, Kreuz `disabled={busy}`), `DialogSurface.tsx:83-87` und `:199-205` (Ebenenstapel; Abdunklung gehört nicht zu `onDismiss`), `TimerContext.tsx:725-805` (beide Dialoge über `FormDialog`, Abbrechen bucht nichts). `stopClosingKeys` kommt in `apps/web/src` nicht mehr vor (gesucht mit Grep).

Befunde zum Auftrag (bitte vor der nächsten Vergabe beachten):
1. T-391b war schon fertig (Bericht oben, Status „fertig“). Der Board-Eintrag in Zeile 3572 ist nicht als erledigt markiert.
2. `stopClosingKeys` gibt es nicht mehr. Es ist seit T-390 (O-CH) gestrichen, E-126 Punkt 5 bestätigt das. In `welle-18-fluss.md` stand es nie. Der einzige Verweis stand in `todo-tabelle-fluss.md` und ist seit dem ersten T-391b ersetzt. Ich habe deshalb das heutige Verhalten beschrieben (Zag-Ebenenstapel plus `closeOnEscape={!busy}`) und keine Eigenschaft, die es nicht mehr gibt.
3. §14 ist keine Tastaturfrage. Dort stehen F-1 bis F-10, und alle sind mit E-123 und E-124 beantwortet. Ich habe nichts geändert.
4. E-121 enthält keine Beschriftungen. Der einzige Bezug auf Oberflächentexte ist Punkt 9: drei Sätze aus der Domäne (`due-date.ts`, `call-number.ts`, `attachment.ts`) werden zu Schlüsseln. Sie gehören zu A-28.2 allgemein und nicht zu den Flüssen von Welle 18. Im Papier steht Punkt 9 bereits bei F-1. Ohne Auftrag habe ich keine Schlüssel für diese Sätze erfunden.
5. T-391 ist ein Designpapier, kein Code. Abgeglichen habe ich gegen den Bau aus T-400 (Timer-Dialoge, `features/timer/texts.ts`). Die Wortlaute für den 24-h-Stopp stimmen zeichengleich mit §13 überein.

Annahmen:
- Das Verhalten der Abdunklung und der Rücksprung des Fokus stützen sich auf Kommentare und Props in `DialogSurface.tsx`. Im Browser habe ich das nicht gesehen.
- „Erst Escape schließt die Liste, dann den Dialog“ gilt nur, wenn im Stoppdialog eine aufklappbare Auswahl steht. Heute ist „Ende“ ein Datumsfeld. Die Regel steht trotzdem da, weil sie für jeden `FormDialog` gilt.
- Den früheren Bericht habe ich ergänzt und nicht überschrieben, damit der fertige Stand nachvollziehbar bleibt.

Risiken: Keine Sicherheitsfolge. Die Tabelle beschreibt den Code. Ändert jemand `closeOnEscape` oder die Sperre der Knöpfe, stimmt das Papier nicht mehr.

Offene Fragen:
- Soll E-121 Punkt 9 einen eigenen Textauftrag bekommen, mit Schlüsseln für die drei Domänensätze? Falls ja, gehört er zu A-28.2 und nicht zu Welle 18.
- Den Board-Eintrag T-391b auf „fertig“ setzen?

Nächster Schritt: spec-ux-reviewer prüft die neue Tabelle in 4.2 gegen `FormDialog.tsx`. e2e-tester kann AK-4.x um einen Fall ergänzen: Escape während des Speicherns schließt den Dialog nicht.
