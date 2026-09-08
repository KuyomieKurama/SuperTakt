# T-151-2 — Benutzerhandbuch nachziehen

```
Aufgabe: T-151-2 — Benutzerhandbuch nachziehen (Folgeauftrag zu T-151)
Status: fertig
Artefakte: docs/benutzerhandbuch.md, .claude/team/reports/T-151-2-documenter.md
```

## Zusammenfassung

`docs/benutzerhandbuch.md` ist um das nachgezogen, was seit T-076 dazugekommen ist: eine neue
Frist am Todo, Anhänge in drei Arten, das Regel-Modell hinter Pools und Kanban-Spalten (E-054,
E-055) und die Versionsprüfung (Abschnitt 18). Der veraltete Abschnitt „Todos zwischen Spalten
verschieben" (Drag & Drop) ist entfernt und durch eine Beschreibung des heutigen, regelbasierten
Verhaltens ersetzt; der ebenso veraltete Satz „Die Karte bleibt, wo sie ist — die Spalte ändert
sich dadurch nicht." ist aus dem Abschnitt zum Timerstart auf einem erledigten Todo entfernt, weil
er seit E-058 nicht mehr zutrifft und im Code selbst ersatzlos gestrichen wurde. Jede neue oder
geänderte Aussage ist gegen den tatsächlich gebauten Bildschirmtext geprüft (u. a.
`TodoFormDialog.tsx`, `TodoDetailScreen.tsx`, `TodoListScreen.tsx`, `BoardScreen.tsx`,
`Attachments.tsx`, `AttachmentOpenDialog.tsx`, `UpdateDialog.tsx`, `UpdateNotice.tsx`,
`DeadlineFlag.tsx`), gegen `docs/spec.md` Abschnitte 18 und 19 sowie gegen
`.claude/team/decisions.md` (E-054 bis E-074) — keine Zahl, kein Feldname und kein Wortlaut ist
erfunden; wo ich eine Beispielmeldung zitiere, steht sie zeichengleich im Quelltext.

Wie angewiesen **nicht** beschrieben: dass das Outlook-Add-in eine Frist setzen kann (A-19.21 wird
in T-149 gerade erst gebaut). Stattdessen steht unter „Was Takt (noch) nicht tut" nur die
Feststellung, dass das heute noch nicht geht — ohne eine Ankündigung, wann sich das ändert.
`benutzerhandbuch.md:378` (die Suche findet auch den Vermerk) ist unangetastet geblieben, ebenso
wie in T-151 verlangt.

## Liste: Abschnitt, neu oder geändert, Quelle

| Abschnitt | Neu oder geändert | Quelle |
|---|---|---|
| „Das Dashboard" | geändert — Kachel „Überfällig" (nur bei mindestens einem betroffenen Todo, mit Knopf zur gefilterten Todo-Liste) ergänzt | `DashboardScreen.tsx`, T-144 Abschnitt 8.1, T-147 Annahme AN-04 |
| „Ein neues Todo anlegen" | geändert — ein Satz, der auf den neuen Abschnitt „Eine Frist setzen" verweist | `TodoFormDialog.tsx` (Feld „Frist" auch im Anlageformular) |
| „Ein Todo als erledigt markieren" | geändert — „Kanban-Spalte" durch „Status"/„Board-Spalte" ersetzt, dritter Absatz zur Meldung nach manuellem Setzen/Aufheben ergänzt | E-054, E-058, E-060; `TodoDetailScreen.tsx`, `TodoListScreen.tsx`, `BoardScreen.tsx` |
| „Eine Frist setzen" | **neu** | A-19.1 bis A-19.7, A-19.20, E-070, E-073, E-074; `packages/domain/src/due-date.ts`, `TodoFormDialog.tsx`, `TodoDetailScreen.tsx`, `TodoListScreen.tsx`, `DeadlineFlag.tsx` |
| „Anhänge an ein Todo hängen" | **neu** | A-19.8 bis A-19.19, E-071, E-072; `packages/domain/src/attachment.ts`, `Attachments.tsx`, `AttachmentOpenDialog.tsx` |
| „Todo-Pools einrichten" | geändert — von „Tags und Ordner, Mindestens einer/Alle" auf die fünf Achsen einer Regel umgeschrieben, Querverweis auf die Kanban-Spalten ergänzt | E-054, E-055; `PoolFormDialog.tsx` |
| „Wie eine Karte auf eine Spalte kommt" (vormals „Todos zwischen Spalten verschieben") | geändert — Drag & Drop entfernt, Regel-Modell und Mehrfachzugehörigkeit beschrieben | E-054, E-058; `BoardScreen.tsx` |
| „Eine Spalte anlegen, umbenennen oder ändern" | **neu** — „Spalten des Boards", „Als Spalte aufnehmen", „Vom Board nehmen", „Umbenennen" gegen „Regel bearbeiten" | E-054, E-059, T-133; `BoardScreen.tsx` |
| „Was passiert, wenn der Timer auf einem erledigten Todo startet" | geändert — veralteter Satz „Die Karte bleibt, wo sie ist …" entfernt, aktuelle Meldung („Timer gestartet. „…" ist wieder offen." plus Bewegungssatz) beschrieben | E-058; `TimerContext.tsx`, `apps/web/src/lib/labels.ts` (`reactivationTitle`) |
| „Nach neuen Fassungen von Takt suchen" | **neu** | A-18.1 bis A-18.12, E-064, E-065, E-069; `UpdateDialog.tsx`, `UpdateNotice.tsx` |
| „Was Takt (noch) nicht tut" | geändert — ein Satz zur Frist im Add-in ergänzt (nicht gebaut), ein Satz zu Anhängen präzisiert (soll auch nicht gebaut werden) | E-074 Punkt 3/4 (A-19.21 in Arbeit, hier nicht beschrieben), A-19.19 |

## Annahmen

1. **Kein Wort zur Add-in-Frist.** Wie angewiesen erwähnt das Handbuch nirgends, dass das Add-in
   eine Frist setzen könnte — auch nicht als Ankündigung. Der einzige Satz dazu steht unter „Was
   Takt (noch) nicht tut" und beschreibt nur den heutigen, tatsächlichen Zustand.
2. **„Später fällig" wird erklärt, aber nicht als eigenes Bildschirmwort gezeigt.** Auf dem
   Bildschirm steht dafür nur das Datum ohne Zustandswort (`DeadlineFlag.tsx`); ich habe das im
   Fließtext ausgeschrieben, damit klar bleibt, dass es sich um einen von drei benannten Zuständen
   handelt (A-19.5) und nicht um eine Lücke.
3. **Die Beispielmeldung beim Timerstart nennt einen konkreten Titel** („Rechnung prüfen") statt
   eines Platzhalters, damit die verschachtelten deutschen Anführungszeichen lesbar bleiben — genau
   wie das Handbuch es an anderer Stelle für Standard-Tag-Meldungen bereits tut. Der Wortlaut davor
   und danach ist zeichengleich mit `reactivationTitle` in `apps/web/src/lib/labels.ts`.
4. **Ich beschreibe nicht jede der vier Wortlaut-Varianten des Bewegungssatzes** (E-058: nichts
   bewegt sich / nur „erscheint" / nur „verschwindet" / beides). Das Handbuch nennt das Prinzip
   und ein Beispiel, statt eine Tabelle mit vier Sätzen abzudrucken, die für eine Bedienungsanleitung
   zu technisch wäre — die vollständige Tabelle steht in `board.md` und im Glossar für den
   Entwickler-Blick.
5. **„Was Takt (noch) nicht tut" trennt jetzt „noch nicht" von „soll auch nicht".** Der Satz zu
   Anhängen im Add-in stand zunächst in derselben Aufzählung wie die Frist; ich habe ihn
   umformuliert, damit er nicht wie eine weitere temporäre Lücke klingt — A-19.19 ist eine
   dauerhafte, absichtliche Grenze, keine Baustelle.
6. **`docs/benutzerhandbuch.md:378` und die übrige Suche/Filter-Passage sind unverändert.** Ich habe
   dort nicht einmal die Sprache angefasst, weil sie bereits mit E-075 Punkt 2 übereinstimmt.

## Risiken

- **Kein Sicherheitsrisiko** — reine Dokumentationsänderung.
- **T-149 (Add-in-Route für die Frist) läuft noch.** Sobald sie fertig ist, muss der Satz unter
  „Was Takt (noch) nicht tut" gestrichen und stattdessen ein Hinweis im Abschnitt „Ein Todo aus
  einer E-Mail anlegen" ergänzt werden. Das ist bewusst nicht Teil dieser Aufgabe.
- **Die Wortlaute der Bewegungsmeldungen (E-058/E-060) können sich ändern**, falls die
  Wiedervorlage in Welle U daran noch etwas dreht. Ich habe nur den bereits gemessenen,
  gebauten Stand beschrieben (`reactivationTitle`, die Titel „„X“ ist erledigt."/"„X“ ist wieder
  offen." aus `TodoDetailScreen.tsx`/`TodoListScreen.tsx`/`BoardScreen.tsx`), keinen Entwurf.
- Ich habe `docs/benutzerhandbuch.md` mit derselben Ersatzprüfung wie bei T-151 gegen die
  Unicode-Kategorien `\p{Cf}`/`\p{Cc}` durchsucht: keine Treffer. `pnpm run proof:codepoints`
  läuft laut Ansage wieder der Orchestrator selbst.

## Offene Fragen

Keine. Die einzige aus T-151 offene Frage ist mit diesem Auftrag beantwortet.

## Nächster Schritt

Nach Abschluss von T-149 (Add-in setzt die Frist): den Satz unter „Was Takt (noch) nicht tut"
streichen und im Abschnitt „Ein Todo aus einer E-Mail anlegen" einen kurzen Absatz ergänzen. Bis
dahin bleibt T-151-2 abgeschlossen.
