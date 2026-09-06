# T-222 — Zwei Beschriftungen für einen Knopf (F-10), und die Regel für den Fokus

**Rolle:** ux-designer. **Welle:** AH. **Datum:** 2026-09-06.

```
Aufgabe: T-222 — F-10: die zwei Wortlaute für den Knopf aus T-218, der beim
         Gelingen seine Beschriftung wechselt; dazu die Regel, wohin der Fokus
         gehört, wenn ein Rückkehrziel legitim verschwindet
Status: fertig
```

## Artefakte

| Datei | Was |
|---|---|
| `docs/design/textbestand.md` | **Abschnitt 15** (neu) — die zwei Beschriftungen, der verborgene Zusatz, der volle Name je Zustand, sechs verworfene Fassungen, die vier Flächen, der Fluß am Knopf, **N-1 bis N-4**, acht Akzeptanzkriterien |
| `docs/design/textbestand.md` | **Regel S-15a** (neu, in Abschnitt 4 unter S-15) — wo ein Zeilenbezug im zugänglichen Namen steht: vorn mit Doppelpunkt ohne sichtbaren Text, hinten mit Komma mit sichtbarem Text |
| `docs/design/textbestand.md` | **Nachtrag T-222** im Kopf des Papiers, drei Zeilen, mit der Messungsangabe nach E-087 |
| `.claude/team/reports/T-222-ux-designer.md` | dieser Bericht |

**Kein Produktivcode angefaßt.** `traeger-und-zusage.md` und `textabbau-gestalt.md` (ui-designer)
sind gelesen, nicht geschrieben.

## Zusammenfassung

Ich nehme ui-designers zwei Fassungen — **„Leistung nachtragen"** und **„Leistung bearbeiten"** —,
aber erst nach der Prüfung gegen S-07, E-078, E-080 Punkt 4 und E-034, und mit sechs verworfenen
Gegenvorschlägen daneben, damit sie nicht in zwei Wellen neu erfunden werden. Der verborgene Zusatz
lautet `, Buchung <Zeitraum der Zeile>` und schreibt die sichtbare Zeichenkette **zeichengleich**
ab; die vollen Namen sind „Leistung nachtragen, Buchung 09:00–10:20" und „Leistung bearbeiten,
Buchung 09:00–10:20". Beim Nachmessen der Flächen sind zwei Befunde herausgefallen: Die Übergabe in
11.8 nennt **drei** Knöpfe, es sind **vier** — der Gruppenknopf in der Sperrmeldung von
`TemplatePreview.tsx` fehlt, und ohne ihn steht die Verwechslung, die der Zusatz beseitigen soll,
eine Ebene höher wieder da. Und der Dichte-Rechenweg in 11.7 geht von einer gemeinsamen
Spaltenachse aus, die die Kaskade nicht hat (`.eentries` ist ein Flex-Stapel, jede `.eentry` ihr
eigenes Raster) — der Preis fällt je Zeile an und ist höher als dort veranschlagt. Die zweite Frage
ist mit einem Satz und vier Stufen beantwortet: Der Fokus folgt der Arbeit, nicht dem Baum; N-3
setzt an die Stelle des leeren Behälters die **eine Aktion des Leerzustands**.

## Annahmen

1. **Ich habe ui-designers Fassungen genommen und nicht ersetzt.** Beides war laut Auftrag eine
   Antwort. Der Ausschlag: Beide bestehen jede Prüfung, „nachtragen" trägt E-034 wörtlich, und
   „bearbeiten" ist das Wort, das der Dialog dahinter selbst führt („Buchung bearbeiten").
2. **Abschnitt 15 ist keine Vorlage nach E-078 Punkt 3** und geht deshalb nicht als dritte an
   spec-ux-reviewer. Begründung im Nachtragskopf: „Leistung nachtragen" bleibt zeichengleich,
   „Leistung bearbeiten" tritt an die Stelle von „Bearbeiten" und einer Namensform, die **derselbe**
   Prüfer in T-200 Z-59 als Befund benannt hat. Wer das anders sieht, sagt es in dieser Welle.
3. **Der Gruppenknopf in `TemplatePreview.tsx` bekommt den Tag und nicht die erste Buchung** in den
   Zusatz. Er steht in der Meldung über die **Tagesgruppe**; ein Zusatz „Buchung 09:00–10:20"
   verspräche eine Auswahl, die der Benutzer nicht getroffen hat.
4. **Der Prüffall mißt Enthaltensein statt Gleichheit.** Der Name entsteht aus zwei Knoten; der
   Leerraum an der Naht gehört der Namensbildung des Browsers. Abgeleitet, nicht gemessen.
5. **N-1 bis N-4 ersetzen nur die Tabelle in R-2**, nicht R-1 und R-3 bis R-6. Die bleiben
   ui-designers und gelten unverändert.

## Risiken

* **Der Dichtepreis ist höher als in 11.7 gerechnet** (15.6). Der vorab entschiedene Rückfall
  (Sinnbildknopf in beiden Zuständen) wird dadurch wahrscheinlicher. Meine Wortlaute überleben ihn
  unverändert — im Rückfall als `label` —, die Entscheidung „ein Baustein" ebenfalls. **Kein
  Sicherheitsrisiko, ein Meßrisiko.** Gegenmittel steht im Auftrag an visual-qa: gemessen wird die
  Gruppe, in der **jede** Buchung ihre Leistung trägt.
* **Wird der vierte Knopf vergessen** (15.5, Zeile 3), ist SC 2.4.6 an der Gruppenebene offen,
  während er an den Zeilen geschlossen ist — ein Befund, der wie eine Erledigung aussieht.
* **Die Liste der ausgelassenen Gruppen kann zwei Zeilen mit gleichem sichtbarem Text zeigen**
  (`${todoId}-${day}` verschlüsselt, sichtbar ist nur der Tag). Der Zusatz heilt das nicht, weil er
  abschreibt, was dasteht. Gehört zu 12.6 (a), nicht in diesen Auftrag.
* **Nichts davon berührt Sicherheit.** Kein fremder Text wandert an eine neue Stelle: `entry.period`
  und `formatDayLabel` sind von Takt erzeugte Formate, keine Benutzereingabe. Der Titel des Todos —
  der einzige fremde Text in der Nähe — kommt in **keinem** meiner Zusätze vor; falls er nach 15.5
  später in die Zeile aufgenommen wird, geht er durch `Foreign` (E-063).

## Offene Fragen

1. **An ui-designer:** Nimmt er die Berichtigung aus 15.6 an, und ändert sie seinen Meßauftrag?
   Ich habe nur den Fall benannt, den visual-qa messen muß — die Gestaltentscheidung fasse ich
   nicht an.
2. **An den Orchestrator:** Der Auftrag zu O-IH umfaßt nach 15.5 **vier** Flächen. Wird er so
   geschnitten, oder bleibt die Gruppenebene liegen?
3. **An den Orchestrator, zur Einordnung:** F-11 (`fallbackFocus`) ist mit 15.8 jetzt fachlich
   beschrieben, aber weiter nicht beauftragt. Ich teile ui-designers Empfehlung: mit der ersten
   Fläche, die sie braucht, nicht davor.

## Nächster Schritt

**Ein** Auftrag an frontend-dev über **vier** Flächen — `ExportGroups.tsx`, `TemplatePreview.tsx`
(Zeile **und** Sperrmeldung), `ExportScreen.tsx#SkippedRow` — nach 11.8 und den acht
Akzeptanzkriterien in 15.9, dazu die Bildunterschrift in `showcase/ExportPreviewSection.tsx` und
die Hausregeln U-5, R-1 bis R-6 **und N-1 bis N-4** in `DESIGNSYSTEM.md`. Parallel der Meßauftrag
an visual-qa nach 11.7 mit der Ergänzung aus 15.6. Der Prüffall aus 11.9 kommt danach, mit der
Auflage aus 15.9 Punkt 7 (Enthaltensein, nicht Gleichheit).
