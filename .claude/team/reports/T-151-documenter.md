# T-151 — Das Glossar steht auf einem alten Stand

```
Aufgabe: T-151 — Das Glossar steht auf einem alten Stand
Status: fertig
Artefakte: docs/glossar.md, .claude/team/reports/T-151-documenter.md
```

## Zusammenfassung

`docs/glossar.md` ist auf den Stand vom 2026-09-05 gezogen. Die Einträge „Status, Statusspalte"
und „Pool, Todo-Pool" waren tatsächlich auf dem Stand vor E-054/E-055, wie O-BG und T-144 U-03
gemeldet hatten; dazu fehlten der Leitbegriff „Regel" und der Anzeigeort „Board-Spalte" komplett,
und Abschnitt 18 (Versionsprüfung) und Abschnitt 19 (Frist, Anhänge) hatten überhaupt keine
Einträge. Ich habe eine neue Übersichtssektion „Eine Regel, zwei Anzeigeorte" ergänzt, vier
Begriffszeilen (Regel, Status, Pool, Board-Spalte) neu gefasst, zwei neue Sektionen für Frist und
Anhang samt Begriffszeilen angelegt, vier neue Zeilen für Fassung und Versionsprüfung ergänzt,
einen vierten Fall in „Geklärte Doppelbenennungen" nachgetragen und den Abschnitt
„Code-Bezeichner: aktueller Stand" um die seit T-076 bis T-146 dazugekommenen Typen und Tabellen
erweitert. Jede neue oder geänderte Aussage ist gegen Code (`packages/domain/src/{tag,board,
version,due-date,attachment}.ts`, Migrationen 0014/0015), `docs/spec.md` Abschnitte 18/19 und
`.claude/team/decisions.md` (E-054 bis E-076) geprüft, nicht gegen mein eigenes Verständnis der
Anwendung. `docs/glossar.md:116` („Suche und Filter") und `docs/benutzerhandbuch.md:378` habe ich
wie angewiesen unangetastet gelassen — E-038 gilt weiter, es ist an domain-dev, die Suche zu
bauen.

## Liste: Begriff, alter Stand, neuer Stand, Quelle

| Begriff | Alter Stand | Neuer Stand | Quelle |
|---|---|---|---|
| Kopfzeile „Stand" | „2026-09-01, nach Abschluss aller Aufgaben" — falsch, das Projekt läuft weiter (Board zeigt Wellen bis U) | „2026-09-05" plus ein Satz, der offen sagt, dass die Anwendung nicht fertig ist und das Glossar bei jeder Modelländerung nachzieht statt am Ende in einem Zug | board.md Wellen S bis U |
| Status, Statusspalte | „Die Spalte des Kanban-Boards, in der ein Todo gerade steht" — das Modell vor E-054 | Eigene Eigenschaft des Todos, unabhängig von der Kanban-Spalte; seit E-054 nur noch eine von fünf Regelachsen | E-054, E-055, T-144 U-03/O-BG |
| Pool, Todo-Pool | „definiert über eine Tag-Regel" — ohne die fünf Achsen aus E-055 | Anzeigeort einer Regel (`pool.placement = 'pool'` oder `'both'`), verweist auf den neuen Eintrag „Regel" | E-054, E-055, T-144 U-03/O-BG |
| Regel | fehlte ganz | Neuer Leitbegriff: Struktur aus fünf Achsen (erforderliche Tags, ausgeschlossene Tags, Status, Erledigt, Exportstatus), Zugehörigkeit wird berechnet, nicht gespeichert | E-054, E-055, E-057, T-144 U-03 |
| Board-Spalte | fehlte ganz | Neuer Eintrag: der zweite Anzeigeort derselben Regel (`pool.placement = 'board'` oder `'both'`), kein eigener Datensatz, kein Ziehen mehr | E-054, E-058, T-144 U-03 |
| Erledigt | „Die Kanban-Spalte ändert sich dabei nicht" — nach E-058 missverständlich, weil eine Board-Spalte sich über die Regel doch bewegen kann | Klargestellt: Der Status ändert sich nicht; ob das Todo in Board-Spalten erscheint, folgt aus deren Regeln (E-058) | E-054, E-058 |
| Frist | fehlte ganz | Neue Sektion plus Begriffszeile: Kalendertag ohne Uhrzeit, vier Zustände als reine Funktion, keine Achse, sortier- und filterbar, vom Add-in setzbar | A-19.1 bis A-19.7, A-19.20, A-19.21, E-070, E-073, E-074, `packages/domain/src/due-date.ts` |
| Anhang | fehlte ganz | Neue Sektion plus Begriffszeile: drei Arten (Verweis, Bild, Datei), was gespeichert wird und was nur angezeigt, kein Export, kein Add-in-Zugang | A-19.8 bis A-19.19, E-071, E-072, `packages/domain/src/attachment.ts` |
| Fassung | fehlte ganz | Neuer Eintrag: Versionsnummer nach SemVer-Vorrang, Quelle der installierten Fassung (kompiliert bzw. Etikett), „übersprungen" als Einstellung im Bestand | A-18.1, A-18.3, A-18.4, A-18.10, E-064, E-065 |
| Versionsprüfung | fehlte ganz | Neuer Eintrag: Ablauf, Route, „Installieren"/„Überspringen", stiller Fehlschlag | A-18.1 bis A-18.12, E-064, E-065, E-069 |
| Dashboard | ohne Erwähnung der Kachel „Überfällig" | Ergänzt um die Kachel „Überfällig" (nur bei einer Zahl größer als null) | T-144 Abschnitt 8.1, T-147 AN-04 |
| Geklärte Doppelbenennungen | drei Fälle | Vierter Fall „Status und Kanban-Spalte" ergänzt | E-054 |
| Code-Bezeichner: aktueller Stand | 17 Tabellen, Typliste ohne alles seit T-076 | 19 Tabellen (`todo_attachment`, `todo_attachment_kind` ergänzt), neue Typen `Pool`, `PoolPlacement`, `PoolMatchMode`, `PoolCompletionFilter`, `PoolExportFilter`, `BoardColumn`, `BoardColumnRule`, `VersionCheck`, `UpdateNotice`, `DueState`, `Attachment`, `AttachmentKind` genannt | T-076, T-089, T-136 ff., T-146 |

## Annahmen

1. **Board-Spalte als eigener Eintrag statt Zusammenlegung mit „Pool".** Der Code selbst führt zwei
   Wörter für die zwei Anzeigeorte (`POOL_PLACEMENT_SHORT`: „Pool" / „Board-Spalte" / „Pool und
   Board" in `apps/web/src/lib/labels.ts`), und beide werden auf dem Bildschirm tatsächlich
   verwendet. Das ist kein Verstoß gegen „ein Ding, ein Name": Es ist eine Sache (die Regel) an
   zwei benannten Orten, wie das Glossar es jetzt auch für „Vermerk"/„Leistung" bei den zwei
   Notizfeldern hält.
2. **Die Dashboard-Zeile habe ich um die „Überfällig"-Kachel ergänzt**, obwohl das nicht wörtlich
   in der Aufgabenstellung stand. Sie ist eine belegte, direkte Folge aus Abschnitt 19 (T-144
   Abschnitt 8.1, T-147 Annahme AN-04) und stand dem Frist-Eintrag sonst unverbunden gegenüber.
3. **Den vierten Fall in „Geklärte Doppelbenennungen" habe ich selbst ergänzt.** Er folgt exakt dem
   Muster der drei bestehenden Fälle (eine Namensfrage, deren Antwort das Domänenmodell verändert
   hat) und gehört inhaltlich zusammen mit der Status/Pool-Korrektur, die die Aufgabe verlangt.
4. **„Code-Bezeichner: aktueller Stand" zitiert jetzt die Migrationsdateien statt
   `docs/datenmodell.md`** für die Tabellenzahl, mit einem ausdrücklichen Satz, dass
   `docs/datenmodell.md` die beiden neuen Tabellen und `todo.due_date` noch nicht führt. Das ist
   eine Feststellung, keine Behauptung über eine fremde Datei, und die Hoheit bleibt bei
   domain-dev.
5. **`docs/glossar.md:116` und `docs/benutzerhandbuch.md:378` unangetastet gelassen**, wie
   angewiesen: E-075 Punkt 2 sagt, E-038 gilt und die Suche wird gebaut, nicht gestrichen. Ich habe
   an keiner der beiden Stellen auch nur die Sprache geändert, weil beide bereits mit dem
   Auftragswortlaut übereinstimmen.
6. **`docs/benutzerhandbuch.md` insgesamt nicht angefasst.** Die Aufgabe war ausdrücklich das
   Glossar; das Handbuch hat für Frist, Anhang, Regel/Board-Spalte und Versionsprüfung noch gar
   keine Abschnitte, und das ist mehr als eine Sprachkorrektur.

## Risiken

- **Kein Sicherheitsrisiko** — reine Dokumentationsänderung, keine Zugangsdaten, keine echten
  Call-Nummern.
- **`docs/datenmodell.md` und `docs/glossar.md` laufen auseinander**, bis domain-dev die beiden
  neuen Tabellen und die neue Spalte dort nachträgt. Im Glossar selbst benannt (Abschnitt
  „Code-Bezeichner: aktueller Stand"), nicht verschwiegen.
- **T-146 und T-147 stehen im Board als „Fertig, braucht Review"**, nicht als vollständig durchs
  Qualitätstor gegangen (code-reviewer und security-checker stehen für Welle U noch aus). Sollte
  die Wiedervorlage Feldnamen, Routenpfade oder Werte ändern (zum Beispiel die Bildgrenze, die T-146
  selbst als offene Frage 4 zwischen 5 MiB und 8 MiB benennt), müssen die neuen Glossareinträge
  „Frist" und „Anhang" entsprechend nachgezogen werden. Ich habe ausschließlich die bereits
  gemessenen, im Code stehenden Werte übernommen (8 MiB, `MAX_ATTACHMENT_IMAGE_BYTES`), nicht die
  ältere Zahl aus E-073.
- **`pnpm run proof:codepoints` konnte ich nicht selbst ausführen** — diese Sitzung hatte keinen
  Zugriff auf ein Shell-Werkzeug. Als Ersatz habe ich `docs/glossar.md` mit einer Grep-Regex gegen
  die Unicode-Kategorien `\p{Cf}` (Formatzeichen wie Nullbreite, BOM, Bidi-Override) und `\p{Cc}`
  (Steuerzeichen) durchsucht: keine Treffer. Das ist nicht dieselbe Prüfung wie das
  Originalskript und ersetzt sie nicht vollständig.

## Offene Fragen

1. **Soll ich als Nächstes das Benutzerhandbuch um Frist, Anhang, Regeln/Board-Spalten und die
   Versionsprüfung ergänzen?** Dort fehlen diese Abschnitte komplett; T-146 hat das im eigenen
   Bericht („Nächster Schritt" Punkt 5) bereits an den documenter weitergereicht. Das ist eine
   eigene, größere Aufgabe und kein Rest von T-151.
2. **`pnpm run proof:codepoints` bitte einmal real laufen lassen** und mir oder dem Orchestrator
   das Ergebnis zurückmelden — ich konnte es in dieser Sitzung nicht selbst prüfen (siehe Risiken).
3. **`docs/datenmodell.md` hinkt Migration 0014/0015 hinterher** (domain-dev-Hoheit). Ich melde es
   hier, weil ich es beim Prüfen der Tabellenzahl für das Glossar gefunden habe, ändere die Datei
   aber nicht.

## Nächster Schritt

Board-Einträge O-BG und O-BL als erledigt vermerken (Orchestrator). Danach, falls gewünscht,
T-151 wie in offener Frage 1 auf das Benutzerhandbuch erweitern — nach Rücksprache, nicht
automatisch, weil das über den Auftrag von T-151 hinausgeht.
