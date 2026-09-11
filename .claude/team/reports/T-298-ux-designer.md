# T-298 — ux-designer

**Aufgabe:** T-298 — Der Fluß für die Anhangsübernahme im Outlook-Aufgabenbereich
**Status:** fertig — braucht Review (spec-ux-reviewer; dazu security-checker wegen zweier
Befunde, die vor dem Bau gehören)

## Artefakte

- `docs/design/addin-anhangsuebernahme-fluss.md` (neu, 13 Abschnitte, mein eigenes
  Artefakt — `textbestand-aufgabenbereich.md` und alles unter `apps/**` unberührt)
- `.claude/team/reports/T-298-ux-designer.md` (dieser Bericht)

## Nachtrag — `proof:codepoints` war rot, und der Fehler war meiner

Ich hatte den Rechts-nach-links-Angriff beschrieben und das Zeichen dabei **roh** in beide
Dateien geschrieben: zwei U+202E in `addin-anhangsuebernahme-fluss.md` (Abschnitt 9.1) und
zwei in diesem Bericht. Der Wächter kann nicht unterscheiden, ob ein solches Zeichen einen
Angriff ausführt oder ihn erklärt — und er soll es nicht können. Beide Stellen nennen das
Zeichen jetzt als **Bezeichner**: `Rechnung<U+202E>fdp.exe`, dazu der ausgeschriebene Name
(RIGHT-TO-LEFT OVERRIDE, ZERO WIDTH SPACE) und ein Satz, wie sich der Name auf dem
Bildschirm zeigt. Der Befund ist vollständig erhalten; die Waffe liegt nicht mehr in der
Dokumentation. Im Papier steht der Grund für diese Schreibweise als eigener Absatz dabei,
damit ihn der nächste Durchgang nicht „lesbarer" macht.

**Gemessen:** Eine Suche über beide Dateien nach dem gesamten Bereich U+200B–U+200F,
U+202A–U+202E, U+2066–U+2069, U+00AD und U+FEFF findet **0 Treffer** — die Menge ist
absichtlich weiter gespannt als die beiden gemeldeten Zeichen. **`pnpm proof:codepoints`
selbst konnte ich nicht fahren: dieser Agent hat keine Shell**, nur Lesen, Schreiben und
Suchen. Die Zahl aus dem Lauf muß deshalb der Orchestrator nennen; meine Zahl ist die aus
der Suche und ich gebe sie ausdrücklich als das aus, was sie ist.

## Zusammenfassung

Der Fluß hat sieben Zustände (Formular, Übernahme läuft, Anlegen läuft, vollständig,
unvollständig, fehlgeschlagen, abgebrochen) und einen achten, der das erweiterte
Postfachrecht einmalig benennt. Tragende Entscheidung ist die **Reihenfolge**: erst alle
Anhänge einsammeln, dann das Todo anlegen — nur so hinterlässt „Abbrechen" nichts, und nur
so ist die Liste der Fehlgründe vollständig, bevor das Todo existiert. Weil Office.js
Namen, Größen, Art und die Fähigkeit des Clients **synchron und ohne Netzanfrage**
hergibt, steht die Liste dessen, was mitwandert, schon **vor** dem Klick da; „zu groß" und
„Outlook zu alt" werden vorher angekündigt und hinterher noch einmal genannt, weil
A-19.29/30 die Nennung im Ergebnis verlangen. Jeder Satz ist ausgeschrieben, einschließlich
der acht zulässigen Fehlgründe, der drei Sonderfassungen des Teilerfolgs und der beiden
Texte zum Postfachrecht. Das Häkchen der Bridge entfällt (der Auftraggeber hat automatisch
bestellt), die stille Degradierung der Bridge ist an drei Stellen ausdrücklich ersetzt.

## Die sechs Fragen der Aufgabenstellung, beantwortet

1. **Während der Übernahme:** Fortschritt **je Anhang**, kein Kreisel — er ist hier nicht
   teuer, weil die Liste schon vor dem Klick feststeht und nur ihre Zeilenzustände
   wechseln. Keine Prozentzahl (wäre erfunden). Fläche binnen 100 ms, ein Zustandswechsel
   je Datei, 60 Sekunden Deckel je Datei. **Abbrechbar bis zum Anlegeruf**, danach nicht
   mehr — ein Knopf, der nichts mehr aufhält, ist eine Lüge über einen Zustand.
2. **Alles gelungen:** Er sieht **was**, nicht nur **daß** — „3 Anhänge hängen daran:"
   plus Namen. Bei einem einzigen Anhang ein Satz statt Liste, ab sieben fünf Namen plus
   Aufklappknopf.
3. **Teilweise gelungen:** eigene Überschrift, die beides trägt („Todo angelegt — 1 Anhang
   fehlt"), Warnton, erst was da ist, dann was fehlt, mit Name und Grund. **Nachholen geht
   nur in SuperTakt** (Datei in Outlook speichern, am Todo unter „Anhänge" mit vollem Pfad
   hinzufügen — jedes Hauptwort dieses Satzes steht drüben so auf dem Bildschirm). Der
   Satz „Über diesen Aufgabenbereich entsteht an einem vorhandenen Todo kein Anhang."
   steht ausdrücklich dabei, damit niemand den Knopf sucht, den A-19.19 verbietet.
4. **Zu groß:** **vorher**, mit Größe und Grenze — die Prüfung kostet nichts, weil
   `AttachmentDetails.size` synchron vorliegt. Und hinterher noch einmal, weil A-19.30
   das verlangt.
5. **Der Weg ist zu:** **vorher, soweit es kostenlos feststeht** (Outlook zu alt, kein
   `ewsUrl`), sonst im Ergebnis. Ein Tokenabruf beim Öffnen jeder E-Mail, nur um die
   Vorschau genauer zu machen, verlangsamt den Bereich für jeden — auch für den, der nie
   ein Todo anlegt.
6. **Das erweiterte Recht:** zwei Orte — eine **einmalige** Fläche vor der ersten Nutzung
   („Das Add-in darf jetzt mehr", Knopf „Weiter", nicht „Zustimmen", weil hier nichts
   erlaubt wird) und ein **dauerhafter** Abschnitt in den Add-in-Einstellungen mit dem
   technischen Namen. Quittung im `localStorage`, nicht in `roamingSettings` (E-019).

## Annahmen — entschieden, ohne zu fragen

- **D-01 Erst sammeln, dann anlegen.** Die Alternative (anlegen, dann anhängen) erzeugt
  mit jedem Abbruch genau den Zustand, den der Entwurf minimieren soll.
- **D-02 Fortschritt je Datei**, nicht Kreisel. **D-03** abbrechbar nur bis zum Anlegeruf.
  **D-04** 100 ms bis zur Fläche, 60 s Deckel je Datei.
- **D-05** Kein EWS-Tokenabruf zur Vorschau beim Öffnen jeder E-Mail.
- **D-06** Ein Wechsel der geöffneten Nachricht während der Übernahme bricht ab. Ohne das
  entstünde ein Todo, dessen Felder und Anhänge aus zwei E-Mails stammen — sichtbar erst
  in SuperTakt und dort nicht mehr erklärbar.
- **D-07** Recht wird an zwei Orten benannt, einmalig und dauerhaft.
- **D-08** Die Anhangsliste ist **kein** Live-Bereich; angesagt werden Beginn, **jeder**
  Fehlschlag und das Ergebnis. Siebzehn Anhänge wären sonst vierunddreißig Ansagen.
- Die Knopfbeschriftung **„Neue Aufgabe anlegen" bleibt** (E-100 Punkt 6, vom Auftraggeber
  gesetzt); die Zahl steht eine Zeile darüber.
- Vorschau bis sechs Einträge vollständig, darüber fünf plus Aufklappknopf — Abweichungen
  (zu groß, Cloud-Verweis) stehen **immer** sichtbar.
- Vier neue Sperrlistenkandidaten sind **vorgeschlagen, nicht eingetragen** — das Papier
  `textbestand-aufgabenbereich.md` gehört einem anderen.

## Risiken

- **Sicherheit 1 (neu gefunden):** Ein **Cloud-Anhang ist eine Adresse aus fremder Hand**.
  Wird er nach A-19.25 ungeprüft als Verweis übernommen, ist er der kürzeste Weg, einen
  beliebigen Pfad aus einer fremden E-Mail bis an den Öffnen-Befehl der Hülle zu
  schreiben. Entwurf: Was nicht mit `http`/`https` beginnt, wird nicht übernommen und
  erscheint mit dem Grund „Der Ablageort ist keine Webadresse." (AK-20).
- **Sicherheit 2 (neu gefunden):** **Dateinamen sind fremder Text.** Ohne `Foreign`
  (`<bdi>` + `visibleText`) liest sich `Rechnung<U+202E>fdp.exe` — an der markierten
  Stelle ein **U+202E (RIGHT-TO-LEFT OVERRIDE)** — auf dem Bildschirm als `Rechnung`
  gefolgt von `exe.pdf`; dieselbe Bauart gibt es mit **U+200B (ZERO WIDTH SPACE)**. Die
  Rückfrage mit vollem Pfad aus Abschnitt 19 trägt nur, wenn der Name in ihr lesbar ist,
  was er ist. Deshalb zusätzlich: **am Ende wird nie gekürzt** (AK-19).
- **Manifest:** `MinVersion` darf **nicht** auf 1.8 angehoben werden. Sonst verweigert
  älteres Outlook die Installation, und A-19.31 („das Todo entsteht trotzdem") ist nicht
  mehr erfüllbar, weil es gar keinen Aufgabenbereich gäbe. Fähigkeit zur Laufzeit prüfen
  (AK-17).
- **`ReadWriteMailbox` trägt ein entwendetes Token weiter** als bisher — lesen **und**
  schreiben im ganzen Postfach. In E-108 genannt, im Bedrohungsmodell noch nicht bewertet.
- **`isInline` ist nicht bei jedem Absender gesetzt**; ein Signaturbild kann als
  Dateianhang durchgehen (A-19.24 verfehlt). Die Vorschau ist die einzige Gegenmaßnahme,
  die der Entwurf hat — ein weiterer Grund für sie.
- **Wartezeit:** Aus einem Ein-Klick-Vorgang wird einer mit Aufenthalt, zwanzigmal am Tag.
  Nicht abwählbar entworfen, weil der Auftraggeber automatisch bestellt hat.

## Offene Fragen

1. **F-02, die schwerste:** Wo liegen die Bytes zwischen Abruf und Anlegen? (a) alles im
   Webview und ein einziger Anlegeruf — bei vier 25-MB-Dateien rund 130 MB Base64 im
   Outlook-Webview plus eine eigene Rumpfgrenze; (b) jede Datei einzeln zum Dienst, der
   Anlegeruf verweist darauf — nie mehr als eine Datei im Speicher, aber ein zweiter Weg
   unter `/addin`, den ein Abbruch aufräumen muß. **Der Fluß trägt beide**; die Wahl ist
   Speicher- und Sicherheitsfrage. An domain-dev, integration-dev, security-checker.
2. Bleibt es bei **25 MB je Datei**? Die Zahl steht in zwei Sätzen ausgeschrieben.
3. Soll eine **Gesamtgrenze** über alle Anhänge gelten? A-19.30 kennt nur die Grenze je
   Datei; zwanzig 24-MB-Dateien sind nach dem Buchstaben vollständig zu übernehmen. Ich
   erfinde keine Grenze, ich nenne den Fall.
4. Eigener Hinweis bei ausführbaren Endungen in der Vorschau? Mein Vorschlag: nein
   (stumpft ab, die Sicherung liegt bei der Rückfrage in SuperTakt) — entscheidet die
   Bewertung.
5. Wer trägt die vier Sperrlistenkandidaten in `textbestand-aufgabenbereich.md` ein?

## Nächster Schritt

Nicht bauen, sondern bewerten: **security-checker** nimmt die drei Wege aus E-108 plus die
beiden neuen Befunde (Cloud-Adresse, Dateiname als fremder Text) ins Bedrohungsmodell —
das ist die Reihenfolge, die E-108 ausdrücklich nicht verhandelbar nennt. Parallel
entscheidet der Orchestrator F-02 mit domain-dev und integration-dev, weil daran die Form
des Anlegerufs hängt. Erst danach ui-designer (Dichte der Vorschau- und Fortschrittsliste
in 320 bis 450 Pixeln) und frontend-dev/integration-dev gegen AK-01 bis AK-23.
