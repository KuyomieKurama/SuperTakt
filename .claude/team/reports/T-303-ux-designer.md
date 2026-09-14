# T-303 — Der Anhangsfluß, nachgezogen auf E-109

**Aufgabe:** T-303 — Entwurf aus T-298 an E-109 anpassen
**Rolle:** ux-designer · **Stand:** 2026-09-11

## Status

**fertig** — das Papier steht in zweiter Fassung. Kein Produktivcode angefasst, keine fremde
Datei angefasst.

## Artefakte

- `docs/design/addin-anhangsuebernahme-fluss.md` — zweite Fassung
- `.claude/team/reports/T-303-ux-designer.md` — dieser Bericht

## Was ich gestrichen habe — zuerst, weil Streichungen hier am leichtesten untergehen

Das Papier trägt die Liste jetzt selbst, als **Abschnitt 0**. Sie steht dort und nicht nur in
diesem Bericht, weil ein Bericht in drei Wochen niemand mehr liest und das Papier schon.

| Gestrichen | Wo es stand | Ersatz |
|---|---|---|
| **Z7** „Das Add-in darf jetzt mehr" | Zustand vor Z0, Abschnitt 8.1, Zeile in der Zustandstabelle, Knopf „Weiter" im Fokusfluß | **keiner** |
| **Abschnitt 8.2** „Zugriff auf das Postfach (`ReadWriteMailbox`)" | dauerhafter Abschnitt in `SettingsView` | **keiner** |
| **Abschnitt 4.6 (b)** „Kein EWS-Weg — `ewsUrl` fehlt" | Vorabhinweis in der Vorschau | **keiner** — der Fall wird zum Nachbau |
| **D-05** (kein Tokenabruf zur Vorschau) | Abschnitt 4.6 | entfällt mit dem Abruf |
| **D-07** in seiner alten Fassung („zwei Orte") | Abschnitt 8 | neu gefaßt: **kein** Ort |
| Fehlgrund **`mailbox_closed`** | Gründeliste 6.2 | **`rebuild_rejected`** |
| Z4-Sonderfall **„Todo angelegt — ohne Anhänge"** | Abschnitt 6.4 | ersetzt durch „2 Anhänge fehlen" mit der E-Mail als Nachbau |
| Satz „Titel, Frist, Tags, Vermerk und Call-Nummer sind übernommen." | Abschnitt 6.4 | fällt mit dem Fall, den er trug |
| **SP-A-31** (Sperrlistenkandidat) | Abschnitt 11 | zurückgezogen, **Nummer bleibt unbesetzt** |
| **AK-15, AK-16, AK-18** in ihrer alten Fassung | Abschnitt 12 | neu gefaßt unter denselben Nummern |
| **R-c** in seiner alten Fassung | Abschnitt 13 | zurückgezogen, an seiner Stelle **R-c′** |
| **F-01** und **F-03** | Abschnitt 13 | beantwortet, nicht gestrichen: 25 MB / 48 MB / 25 Dateien |

**Drei Sätze sind mit ihren Flächen gefallen** und stehen nirgends mehr: „Outlook kennt für
diesen Zugriff keine engere Stufe.", „Zurücknehmen lässt sich das Recht nur, indem Sie das
Add-in in Outlook entfernen." und „SuperTakt liest damit ausschließlich die Nachricht, die
gerade offen ist. Es durchsucht das Postfach nicht …". Der dritte war **wahr** und fällt
trotzdem: Eine Zusage, ein Recht nicht auszunutzen, das man nicht hat, erzeugt beim Leser
erst die Vorstellung des Rechts. Begründung ausgeschrieben in 8.1.

Die Sätze sind **nie gebaut worden** — sie standen nur in meinem Entwurf. Eine Suche nach dem
Wortlaut in `tests/**` nach E-087 war deshalb nicht nötig; integration-dev hat in T-300
gemessen, daß `ReadWriteMailbox` nirgends im Baum steht.

## Was neu dazugekommen ist

**1. Z3a — der dritte Zustand** (Abschnitt 6.3a). Weder „geklappt" noch „etwas fehlt": Die
Datei ist da, sie ist nach A-19.22 vollständig, und sie ist nicht das Original. Meine Antwort
auf die zwei Auflagen der Aufgabe:

- **Nicht wie ein Fehlschlag:** Überschrift bleibt „Todo angelegt", Ton bleibt Erfolg, kein
  Warnzeichen, keine Warnfarbe, **kein** Ratschlag zur Handarbeit. Wer den Warnton hier
  ausleiht, hat ihn in Z4 verbraucht — und der Benutzer mit alter Outlook-Fassung sähe ihn
  bei jedem Todo, bis er ihn nicht mehr sieht.
- **Nicht verharmlost:** Die Kennzeichnung hängt an der **Zeile** (`– die E-Mail
  (nachgebaut)`, dieselbe Form wie `(als Verweis)`), und der Absatz darunter nennt die Folge
  statt des Fachworts: „Die technischen Kopfzeilen der ursprünglichen Nachricht stehen nicht
  darin — und mit ihnen nicht der Nachweis, welchen Weg sie genommen hat."

Der Zustand ist **kein eigener Zweig der Maschine**, sondern eine Ausprägung von Z3. Ein
eigener Zweig hieße, der Nachbau sei ein anderer Ausgang als der Erfolg; was ihn
unterscheidet, ist eine Eigenschaft der **Datei**.

**2. `rebuild_rejected`** (6.2 und 6.4 Fall 2). Der heikelste Wortlaut des Papiers, weil der
Benutzer nichts falsch gemacht hat und trotzdem etwas fehlt. Der tragende Satz:

> Das liegt an dieser Nachricht, nicht an Ihren Eingaben, und ein zweiter Versuch ändert
> daran nichts.

Der zweite Halbsatz ist keine Beruhigung, sondern eine **Ersparnis**: Ohne ihn löscht der
Benutzer das Todo und legt es noch einmal an, mit demselben Ergebnis. Ausdrücklich **nicht**
darin: Fehlernummer, Auszug aus der Formprüfung, Name der Angabe, an der es lag — letzteres
wegen AB-3, sonst wäre die Fläche, die vor fremdem Text warnt, die erste, die ihn zeigt.

**3. A-19.34 geprüft.** Kein Satz des Papiers behauptete etwas über die Dauerhaftigkeit der
Anhänge. In Fassung 2 tut es **einer**, und er ist Absicht: „Die Datei ist in SuperTakt
dauerhaft als Nachbau gekennzeichnet." Er behauptet nichts über die Sicherung der Bytes,
sondern über den Halt der **Kennzeichnung** — und er hängt an AK-27.

## Was ich für integration-dev entschieden habe

Er hatte in T-300 zwei Fragen an mich gerichtet.

**`too_many` und `total_too_large` bleiben.** Beide Fälle stehen vor dem Klick fest, und in
der Vorschau ist noch nichts gesendet — ein `rejected` („SuperTakt hat die Datei nicht
angenommen") wäre dort schlicht unwahr. Die Sätze sind neu gefaßt, damit sie parallel zu
`too_large` laufen: erst der Zustand, dann die Regel. Die Kurzformen der laufenden Liste
heißen jetzt „Gesamtgrenze, übersprungen" und „Anzahlgrenze, übersprungen" statt zweimal
„übersprungen" — wer die laufende Liste liest, liest sie, weil er wissen will, **welche**.

**Die Regel dahinter, und sie ist die eigentliche Antwort:** Die Liste über die Leitung darf
gröber sein als die Liste auf dem Bildschirm. Verlangt ist nur, daß jede Kennung der Leitung
auf **genau einen** Satz fällt und keine auf zwei. Damit kann domain-devs Liste gewinnen,
ohne daß die Oberfläche Auskunft verliert.

## Annahmen

1. **Z3a bekommt keine Fassungsnummer.** In 4.6 steht „Nötig ist Outlook mit
   Mailbox-Anforderungssatz 1.8.", weil dort Dateien fehlen und die Nummer die Bedingung
   ihres Kommens ist. In Z3a fehlt nichts; eine Nummer machte aus einer Auskunft eine
   Aufforderung zum Aufrüsten an einer Stelle, an der alles gutgegangen ist.
2. **Die Vorschau sagt nichts, wenn Mailbox 1.14 da ist.** Kein „wird als Originalnachricht
   übernommen" — ein Satz, der den Normalfall bestätigt, macht aus seinem Ausbleiben eine
   Aussage, die niemand liest. Als F-07 vorgelegt.
3. **Die Vorschau darf sich irren, aber nur in die sichere Richtung.** Mit 1.14 kündigt sie
   das Original an; fällt der Abruf in den Nachbau, sagt es das Ergebnis. Umgekehrt — Nachbau
   ankündigen und Original liefern — gäbe es nicht, und ein Original ankündigen und
   stillschweigend einen Nachbau liefern wäre der stille Ausfall aus A-19.31. Als R-e
   benannt.
4. **Das Wort ist festgelegt:** „Nachbau" / „nachgebaut", nie „Kopie", nie „Ersatz", nie
   „rekonstruiert", nie „vereinfachte Fassung". An allen vier Stellen gleich, einschließlich
   der Flächen in SuperTakt, die ich nicht entwerfe (F-06).
5. **Die Zeile „dieses Outlook gibt Anhänge nicht heraus" wandert aus dem Warnblock in die
   Liste.** Sie ist dasselbe wie „zu groß": eine Datei, die nicht mitkommt, mit Grund
   dahinter. Zwei Darstellungsformen für dieselbe Sache wären eine Erklärung dafür, daß es
   zwei Sachen sind.

## Risiken

- **R-c′ (neu, an der Stelle des zurückgezogenen R-c):** Die Kennzeichnung des Nachbaus liegt
  heute nur im Add-in — Nutzlast, Kopfzeile, Vorspann. Am Todo, in der Rückfrage vor dem
  Öffnen und nach einer Wiedereinspielung trägt sie sie **nicht**. Wer die Datei drei Wochen
  später öffnet, sieht eine E-Mail und hat keinen Grund, an ihr zu zweifeln. **A-19.22b ist
  damit zur Hälfte erfüllt, und die fehlende Hälfte ist die, auf die es ankommt.**
- **Daraus eine Auflage, die ich ausdrücklich stelle (AK-27):** Der Satz „Die Datei ist in
  SuperTakt dauerhaft als Nachbau gekennzeichnet." darf **nicht** auf dem Bildschirm stehen,
  bevor die Kennzeichnung im Bestand liegt. Sonst ist er genau die Lüge, gegen die der ganze
  Abschnitt gerichtet ist. Dasselbe gilt für den Sperrlistenkandidaten SP-A-34.
- **R-d (neu):** Die Ablehnung des Nachbaus ist deterministisch. Von einem Absender, dessen
  Nachrichten die Formprüfung reißen, kommt die E-Mail nie als Datei ins Todo. Häuft sich
  das, ist es ein Befund über die Formprüfung (R-28) und keiner für einen Satz der
  Oberfläche.
- **R-a bleibt unverändert:** `isInline` ist nicht bei jedem Absender gesetzt; ein
  Signaturbild kann als Dateianhang durchgehen. Die Vorschau vor dem Klick ist die einzige
  Gegenmaßnahme.

## Offene Fragen

1. **F-04** (unverändert): eigener Hinweis bei ausführbaren Endungen in der Vorschau? Mein
   Vorschlag bleibt **nein**. → security-checker.
2. **F-05** (erweitert): Die Sperrlistenkandidaten sind jetzt **sechs** statt vier —
   SP-A-31 zurückgezogen, SP-A-33 bis SP-A-35 neu. Wer trägt sie in
   `textbestand-aufgabenbereich.md` ein? SP-A-34 erst mit AK-27. → Orchestrator.
3. **F-06 (neu):** Wo und wie steht „(nachgebaut)" in SuperTakt selbst — an der Anhangsliste
   und in der Rückfrage vor dem Öffnen? Den Wortlaut dort entwerfe ich nicht; die Flächen
   gehören dem Hauptfenster. Verlangt ist nur die **Wortgleichheit**. → Orchestrator,
   ui-designer.
4. **F-07 (neu):** Bestätigung, daß die Vorschau im Normalfall schweigt (Annahme 2).
5. **Nicht meine Frage, aber sie hängt an meinem Papier:** `proof:addin` Abschnitt 18 mißt
   weiterhin die Abwesenheit **jeder** Anhangstür unter `/addin`. Er muß mit der Route auf
   die Abwesenheit der Tür am **vorhandenen** Todo umgestellt werden, sonst behauptet ein
   Wächter das Gegenteil des Bestands — derselbe Fall wie am 2026-09-10.

## Nächster Schritt

Die Kennzeichnung des Nachbaus in Bestand, Anhangsliste und Rückfrage bauen (domain-dev,
frontend-dev, AK-27) — sie ist die einzige offene Hälfte von A-19.22b und zugleich die
Bedingung dafür, daß der letzte Satz von Z3a überhaupt erscheinen darf. Parallel: die sechs
Sperrlistenkandidaten dem Halter von `textbestand-aufgabenbereich.md` vorlegen, und
integration-dev die Antwort auf seine Frage 3 mitgeben (Gründeliste: Leitung darf gröber
sein als Bildschirm, eine Kennung auf genau einen Satz).
