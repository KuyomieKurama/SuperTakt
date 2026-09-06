# T-228 — Eine Nummer freigeräumt, ein Kanal nachgezogen, eine Begründung zurückgenommen, ein doppelter Satz entschieden

**Rolle:** ux-designer **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Aufträge:** **O-JY** (vier Auflagen aus T-221) und **O-KD** (beide Hälften)

**Gelesen:** `docs/design/textbestand.md` (eigenes Papier, vollständig in den berührten
Abschnitten), `.claude/team/decisions.md` (E-078, E-087, E-092, E-093), `.claude/team/board.md`
(O-JY, O-KD, O-KC, O-KE), Berichte **T-220** (frontend-dev) und **T-221** (spec-ux-reviewer); am
laufenden Baum: `apps/web/src/screens/PoolRenameDialog.tsx`, `components/FormDialog.tsx`,
`lib/submitAttempt.ts`, `components/Select.tsx`, `components/ExportDirectoryField.tsx`,
`screens/TemplatesScreen.tsx`, `api/client.ts`, dazu `apps/local-api/src/**`,
`apps/outlook-addin/src/**`, `tests/e2e/**` und die drei `.gitignore`.

**Zur Form (E-087 Punkt 4).** Keine Zeilennummern für fremde Dateien; belegt wird mit Datei und
**Zitat**. **Kein Produktivcode angefaßt.** Geschriebene Dateien: `docs/design/textbestand.md`
(eigene Hoheit) und dieser Bericht.

---

## Kurzfassung

```
Aufgabe: T-228 — O-JY (Regelnummer, Kanal, Zeichengrenze, zwei falsche Begründungen)
         und O-KD (der doppelte Satz und der zweite Sperrgrund)
Status: fertig — alle vier Auflagen aus T-221 erledigt, beide Hälften von O-KD
        entschieden; zwei neue Wortlautfragen entstehen NICHT (kein Satz erfunden)
```

| Gegenstand | Ergebnis |
|---|---|
| **Z-72** freie Regelnummer | **S-12a**, gebunden an S-12 (Dialoge … **Absage** …). Die vertragliche S-15 behält ihre Nummer. Die eine Ansteckung (Grundlagenzeile Abschnitt 14) ist berichtigt |
| **Z-73** Kanal | **nachgezogen an den Bau.** Statusfläche, kein `aria-invalid`. AK 4 und AK 5 sind **gegenstandslos** und ersetzt, nicht „unerfüllt" |
| **Z-76** Zeichengrenze | **entschieden:** P-1 gilt der **Feldmeldung**. Die Länge dieser Absage ist keine neue Zahl, sondern **gerechnet**: ein Satz nach S-07 plus ein Hinweis nach S-05 (28 + 73 = 102) |
| **Z-77** „Bitte" | **zurückgenommen, in beiden Papierstellen.** Gemessen **17** Stellen im Oberflächentext (4 Produkt, 11 Dienst, 2 Add-in). **Beide Urteile tragen ohne die Begründung** — 13.3 auf einem Ablaufgrund, 14.4 auf zwei unberührten Gründen |
| **O-KD** erste Hälfte | **Der Hinweis weicht, die Absage bleibt zeichengleich.** Fünf Gründe, drei verworfene Auflösungen, Zustandstabelle, und eine gemessene Warnung: es ist **nicht** eine Zeile an der Aufrufstelle |
| **O-KD** zweite Hälfte | **Der leere Name bekommt eine Antwort — im Feldkanal**, mit „Name fehlt.". Kein neuer Wortlaut (steht dreimal im Produkt), keine Vorlage nach E-078 Punkt 3 nötig |
| **Papier gegen den Baum** | **drei Befunde**, einer davon widerlegt eine Zahl von heute morgen aus diesem Papier |

---

## 1. O-JY, Punkt 1 — die Regelnummer (Z-72)

**S-12a.** Die Bindung an die Textsorte ist die Bauart, die S-13a (T-211) und S-15a (T-222)
vorgemacht haben, und S-12 führt „Absage" bereits im eigenen Titel.

**Wer weicht, und warum nicht die andere.** Die vertragliche S-15 (Zugängliche Namen) ist die
ältere, steht im Bestandsteil und ist diejenige, an der eine Verwechslung **Prüffälle** kostet.
Sie behält ihre Nummer; die neue weicht.

**Die Ansteckung ist behoben und war genau eine Stelle.** T-221 nennt die Grundlagenzeile von
Abschnitt 14 als Beispiel dafür, daß die Nummer schon weiterwandert. Ich habe sie nachgelesen und
komme zu einem anderen Ergebnis als der Prüfer: Dort war die **vertragliche** S-15 gemeint — der
Beleg steht im selben Abschnitt, in **AK 6** (*„Im Produkt fällt kein zugänglicher Name."*).
Deshalb ist sie nicht umgenannt, sondern **eindeutig gemacht**: „Regel S-15 (Zugängliche Namen)",
mit dem Grund daneben. Eine Zeile, die man in beide Richtungen lesen kann, ist auch dann ein
Befund, wenn sie zufällig richtig gemeint war.

**Beim Umhängen kam der größere Befund heraus, und er stand nicht im Auftrag.** Die Kurzfassung der
Regel lag seit T-211 bereits in Abschnitt 4 — **mitten zwischen dem Befund und der Regel von
S-10**, also in einer fremden Textsorte (Fehlermeldungen im Seitenfluß statt Dialogabsagen). Das
ist schlimmer als die falsche Nummer: **Eine Regel, die den Befund einer anderen Regel von deren
Regel trennt, wird beim Lesen der einen mitgelesen und beim Suchen der anderen nicht gefunden.**
Sie ist entfernt und steht jetzt bei S-12; an ihrer alten Stelle steht, was dort stand und warum
es weg ist (benennen, nicht überschreiben).

**Die Regel steht ab sofort an zwei Orten** — voll in 13.3 (Herleitung) und als Kurzfassung in
Abschnitt 4 unter S-12. Das ist E-092 in der Anwendung auf das eigene Papier: T-221 Z-83 hat
denselben Fehler bei ui-designer benannt (der verbindliche Satz stand im Nachtrag, nicht am Ort,
an dem gelesen wird), und ich hätte ihn hier gerade wiederholt.

## 2. O-JY, Punkt 2 — der Kanal ist entschieden und gebaut (Z-73)

**Nachgezogen sind 13.4 (Fluß) und 13.5 (Akzeptanzkriterien).** Die Kriterien sind nicht abgehakt,
sondern **berichtigt**, und die alte Fassung bleibt lesbar:

- **AK 4** („der Fokus geht in das Feld") ist **gegenstandslos** — kein Feld ist ungültig, die
  Rückführung findet zu Recht nichts. Ersetzt: Der Fokus **bleibt am Absendeknopf**, die Absage
  steht daneben und sagt sich selbst an.
- **AK 5** („die Ansage kommt aus der Meldefläche des Feldes") ist **gegenstandslos**. Ersetzt:
  Statusfläche des Dialogs, `role="status"`, immer im Baum, auch leer.
- **AK 7** ist nach **Z-75** neu gefaßt: *der Riegel hält die Handlung auf, nicht den Versuch.*
- **AK 1** trägt jetzt die Bedingung aus **Z-74** (benannte Konstante) ausdrücklich.
- **AK 3** bleibt **wörtlich gültig** und ist damit der Auftrag aus O-KD — siehe unten.

**Warum berichtigt und nicht gelöscht.** Eine AK-Liste, die nach dem Bau das Gegenteil des Gebauten
verlangt, ist die Falle aus E-092: Der nächste, der sie liest, baut den Rückschritt und hält ihn
für die Auflage.

## 3. O-JY, Punkt 3 — die Zeichengrenze (Z-76)

**Entschieden, nicht überschwiegen:**

1. **P-1 gilt der Feldmeldung** — sie ist als *„Form der Pflichtfeldmeldung"* verfaßt und regelt
   den Kanal, in dem eine Meldung **an einem Feld** über **dessen Wert** steht. Die Absage nach
   S-12a steht seit E-093 Punkt 5 nicht dort.
2. **Trotzdem ist die Länge nicht frei — und sie braucht keine neue Zahl.** Der Satz ist
   **gebaut**: ein eigener Satz im Wort des Knopfes (28 Zeichen) plus der vorhandene Hinweis, der
   schon unter der 80-Zeichen-Grenze aus **S-05** steht (73). Obergrenze also **80 plus ein Satz**,
   hergeleitet aus zwei geltenden Regeln.
3. **Wird sie gerissen, fällt der Hinweis und nicht die Absage** — er ist der Teil, für den eine
   Grenze gilt, und er wird an beiden Stellen gelesen.

Damit wird die nächste Absage dieser Bauart nicht mit 102 Zeichen gebaut, „weil diese es durfte",
sondern mit der Länge ihres eigenen Hinweises.

## 4. O-JY, Punkt 4 — die zurückgenommene Begründung (Z-77). **Trägt das Urteil ohne sie? Ja.**

**Gemessen am 2026-09-06 über die Quellverzeichnisse — 17 Stellen im Oberflächentext**, nicht
sieben:

| Bereich | Zahl | Träger |
|---|---|---|
| **Produkt** `apps/web/src` | **4** | `api/client.ts` (Rückfallsatz), `app/TimerContext.tsx`, `components/Select.tsx` (**Vorgabeplatzhalter**), `screens/TemplatesScreen.tsx` |
| **Lokaler Dienst** | **11** | `startup.ts` (5), `errors.ts` (2), `usecases/export.ts` (2), `main.ts`, `usecases/tag-names.ts` |
| **Add-in** | **2** | `ui/TagPicker.tsx`, `ui/TaskPane.tsx` |
| *Musterseite* | *3* | *`showcase/IntroSection.tsx` — Anweisungen an den Prüfer, Prüfdokumentation* |

**Die unangenehmste Zeile ist die erste**, und der Auftrag nennt sie zu Recht: `api/client.ts`
trägt den **Rückfallsatz** von `errorMessage` — und **12.10 meines eigenen Papiers** verlangt, den
Satz des Dienstes *„immer, wörtlich und ungekürzt"* durchzureichen. Dieselbe Kollision hätte
**SP-11** getroffen (die Sätze der Hülle kommen fertig aus `problems` und werden unverändert
durchgereicht; elf davon führen „Bitte").

**Was richtig ist, in der engen Fassung** — und beides steht jetzt so im Papier:

- **S-07 sagt es richtig und handelt von Knopftexten.** Nachgemessen und bestätigt: kein Knopftext
  führt „OK", „Ja" oder „Bitte".
- **P-1 sagt es richtig und handelt von der Feldmeldung.**
- **Ein fremder Satz, den wir zitieren, fällt unter keine der beiden Regeln.** Eine Regel über
  unsere Wortwahl kann nicht über Text herrschen, den wir wörtlich weitergeben — sonst kürzten wir
  den Grund des Dienstes, um eine Hausregel zu retten.

**Trägt das Urteil ohne die Begründung?**

| Verworfene Fassung | Nach der Rücknahme |
|---|---|
| **13.3** „Bitte ändern Sie den Namen." | **trägt — auf einem Grund, der besser ist als der gefallene.** Sie macht aus einer Absage eine **Aufforderung** und nennt nur **einen** der beiden Ausgänge. Das ist derselbe Maßstab, mit dem Z-71 die freigegebene Fassung genommen hat (vierter Grund: „Er nennt beide Ausgänge"). **Achtung:** Der von spec-ux-reviewer als tragend genannte Grund („P-1 verbietet »Bitte« in einer Feldmeldung") trägt hier **nicht mehr** — der Satz hat den Feldkanal mit E-093 Punkt 5 verlassen. Das Urteil steht trotzdem, aber auf dem anderen Bein |
| **14.4** „… — bitte kürzen." | **trägt auf zwei unberührten Gründen:** **P-1** gilt hier weiterhin (der Satz steht am **Feld**), und der zweite Halbsatz nennt die **Handlung**, während **P-4** ihn nur für die **Folge** zuläßt |

**Und die Messung hat zwei Befunde eingebracht, die die Aufnahme nicht hatte** (beide aufgenommen,
keiner beauftragt): der **Vorgabeplatzhalter „Bitte wählen"** in `Select.tsx` (Verstoß gegen S-06,
und der schwerste der Sorte, weil er ein Vorgabewert ist) und `api/client.ts` als **sechster
entgangener Textträger**, der zudem außerhalb der Aufzählung des Geltungsbereichs lag.

## 5. O-KD, erste Hälfte — welcher der beiden Sätze weicht

> **Entscheidung: Der Hinweis unter dem Feld weicht, solange die Absage steht. Die Absage bleibt
> zeichengleich.**

**Fünf Gründe, in Rangfolge:**

1. **Es ist keine neue Entscheidung.** **AK 3 sagt es seit T-211 wörtlich** (*„Sie tritt an die
   Stelle des Hinweises, nicht daneben"*). Der Kanalwechsel hat nicht die Absicht geändert, nur den
   Mechanismus: Was im Feldkanal von selbst geschah, muß in der Statusfläche gebaut werden.
2. **Der freigegebene Wortlaut bleibt unangetastet** (Z-71, zeichengleich). Die Gegenlösung —
   Absage kürzen — nähme ihm den vierten Grund seiner Freigabe.
3. **Die Antwort gehört dorthin, wo gedrückt wurde.** Im **gescrollten** Dialog (Z-63: 1599 px
   Inhalt in 492 px Ausschnitt) kann der Hinweis außerhalb des Bildes stehen, während die Absage
   sichtbar ist. Eine gekürzte Absage wäre dort eine Sackgasse.
4. **Es fällt eine Anzeige, kein Satz.** Der Wortlaut steht einmal im Bestand (`UNCHANGED_HINT`);
   beide Stellen lesen daraus. Was weicht, ist die zweite gleichzeitige **Anzeige**.
5. **Der Hinweis verliert seine Aufgabe für die Dauer der Absage, nicht seinen Platz.**

**Drei Auflösungen verworfen, je mit Grund** (Absage kürzen · Hinweis ganz streichen — was **P-9**
nach dem Umbau sogar zuließe · beides stehen lassen).

**Ein gemessener Einwand gegen die geplante Behebung, und er gehört in den Auftrag.**
frontend-dev beschreibt sie als *„eine Zeile (`fieldHint` unterdrücken, solange die Absage
steht)"*. **Am Baum trägt das so nicht:** Die Bedingung der Absage besteht aus der Sperre **und**
dem Versuchszähler; der Zähler steht über einen Zusammenhang den **Kindern** des Formulardialogs
zur Verfügung, nicht seinem **Aufrufer** — und der Hinweis wird im Aufrufer gesetzt. Wer die Zeile
dort schreibt, hat nur die Sperre zur Hand und unterdrückte den Hinweis **von der ersten Sekunde
an**, also genau die Auskunft, die vor dem Druck die einzige ist (P-9). **Das ist der Rückschritt,
der wie die Behebung aussieht.** Die Bauart entscheidet frontend-dev (E-078 Punkt 4); das
Kriterium verlangt **dieselbe** Bedingung wie die Absage, nicht eine zweite.

**Ein Zustand ist benannt statt verschwiegen:** Tippt der Benutzer zurück auf den alten Namen,
erscheint die Absage **wieder, ohne neuen Druck** (`refusalShown` hängt an Sperre und Versuch,
nicht an der letzten Eingabe). Sie ist in diesem Zustand wahr; sie zu beseitigen hieße, den Versuch
zu vergessen — und dann wäre ein zweiter Druck ohne Änderung wieder stumm. Der teurere Tausch,
deshalb bleibt es, und deshalb steht es im Papier statt beim nächsten Prüfer.

## 6. O-KD, zweite Hälfte — der leere Name

> **Entscheidung: Er bekommt eine Antwort auf den Druck, aber im Feldkanal — „Name fehlt.". Die
> Absage nach S-12a wird dort nicht verwendet.**

**Vier Gründe:**

1. **Hier ist der Fehlerkanal die Wahrheit und nicht die Behauptung.** Der ganze Grund für den
   Kanalwechsel bei „unverändert" ist, daß `aria-invalid` über einen **gültigen, gespeicherten**
   Wert falsch ist. Bei einem leeren Pflichtfeld ist dieselbe Aussage **richtig**. **Zwei
   Sperrgründe, zwei Kanäle — das ist die Unterscheidung, für die die Kanäle da sind**, kein Bruch.
2. **Der Fokus muß hier ans Feld** und kann es nur so: Erklärt sich das Feld für ungültig, führt
   die vorhandene Rückführung von selbst dorthin.
3. **P-9 erste Hälfte** ist seit dem Umbau die einschlägige (*„läßt sich der Absendeknopf drücken,
   kommt die Meldung beim Absendeversuch"*), **P-8** setzt `touched` beim Versuch ohnehin. **Drei**
   Geschwisterfelder im Produkt machen es genau so.
4. **Die Absage nach S-12a wäre auch der Form nach falsch:** zusammengesetzt **130 Zeichen** und
   damit über der Grenze, die dieser Nachtrag gerade hergeleitet hat.

**Kein neuer Wortlaut.** „Name fehlt." steht zeichengleich in `PoolFormDialog.tsx`,
`TagsScreen.tsx` und `StatusSettings.tsx`, und `FormDialog.tsx` nennt ihn im eigenen Kopfkommentar
als **das** Beispiel für diesen Weg. Es ist die **Anwendung** eines vorhandenen Wortlauts auf eine
vierte Stelle derselben Sorte — dieselbe Einordnung wie in 15.2 für „Leistung nachtragen" —, also
**keine Vorlage nach E-078 Punkt 3**. Fünf Fassungen sind mit Grund verworfen, darunter „Der Name
fehlt." (P-2) und „Bitte geben Sie einen Namen ein." (P-1, und hier trägt der Grund).

**Trägt der dauerhafte Hinweis? Nein — aber er wird nicht gelöscht.** Er reicht für die
**Auskunft** und nicht für die **Antwort**. Er weicht der Meldung, solange sie steht — dieselbe
Verdrängung, die dieser Dialog für „vergeben" schon macht —, und ist mit dem ersten getippten
Zeichen wieder da.

**Nebenbefund, mit erledigt:** 13.6 empfahl für „Sorte C" einen dauerhaften Hinweis als
ausreichenden Weg. E-093 hat **alle neun** umgebaut; die Lage gibt es nicht mehr. Der Absatz ist
berichtigt — der Träger bleibt richtig, der Schluß „damit ist der Druck beantwortet" fällt.

## 7. Das Papier gegen den Baum (dritter Auftragspunkt)

**Drei Befunde, einer davon gegen eine Zahl aus diesem Papier vom selben Tag:**

| Aussage | Papier | Gemessen 2026-09-06 | Urteil |
|---|---|---|---|
| `getByRole` in `tests/e2e` | 315 in 32 Dateien | **319 in 31 Dateien** | verschoben **innerhalb desselben Tages**. Dazu ein Meßvorbehalt, der bisher fehlte: gezählt werden **Zeilen mit Treffer**, nicht Aufrufe — die Zahl ist eine **Untergrenze** |
| Kennungen im Oberflächentext (S-19) | **null im Produkt** | **mindestens drei** | **falsch.** `ExportDirectoryField.tsx` zweimal („(A-8.8)", „(A-8.9)" in `TRAIT_TEXT`), `TemplatesScreen.tsx` einmal („(A-7.2)") |
| Geltungsbereich Abschnitt 1 | vier Verzeichnisse | **fünf** | `api/**` fehlte — dort liegt der Rückfallsatz jeder Absage |

**Der Befund über die Messung ist der wichtigere.** Die „null" entstand, weil über die
**bekannten** Kennungen gesucht wurde (E-054, E-055, E-047, R-10) statt über die **Form** einer
Kennung. Das ist derselbe Fehler wie der Zeichenfilter aus 1.1: Ein Filter, der nur findet, was man
schon kennt, bestätigt die eigene Liste. **M-01 gilt damit auch für Nachmessungen:** Wer eine Zahl
auf null berichtigt, nennt, wonach er gesucht hat.

## 8. Zur Meßhälfte, die wieder fehlt — diesmal eingegrenzt

Gesucht wurde über den **Wortlaut** und über die **Quellverzeichnisse** (ripgrep, `.gitignore`
geachtet). `git grep` über die versionierten Dateien war **auch in diesem Durchgang nicht
möglich** — dieser Lauf hatte keine Schale. Neu ist die **Eingrenzung** statt der bloßen Benennung:

- Der Baum führt **drei** Ausschlußlisten (`/.gitignore`, `apps/web/.gitignore`,
  `apps/desktop/.gitignore`). Sie nennen ausschließlich Abhängigkeiten, Bauergebnisse, erzeugte
  Bündel, lokale Daten, Geheimnisse, Prüfartefakte und Werkzeugstände — darunter
  `apps/desktop/src-tauri/taskpane/`, also genau die veralteten Zweitkopien, die `CLAUDE.md` vom
  Lauf über den Arbeitsbaum **ausgeschlossen** haben will. Der Lauf hat sie ausgeschlossen.
- Was die fehlende Hälfte allein zeigen könnte, ist damit **eine** Klasse: eine **versionierte
  Quelldatei, die unter einem dieser Namen liegt**. Ob es eine gibt, ist ohne Schale nicht
  entscheidbar — **eine Schranke, kein Beweis.**

## 9. Pflichtklickpfade, soweit dieser Nachtrag sie berührt

| Pfad | Stand |
|---|---|
| **Timer auf erledigtem Todo** | unberührt |
| **Kanban Drag & Drop** | unberührt |
| **Export samt Statuswechsel** | unberührt. Der berührte Dialog schickt `{ name }` und sonst nichts |
| **Tiefe Tag-Ordner, Selbstverschiebung** | berührt: „Neuen Ordner anlegen" ist einer der neun aus E-093. AK 7 in der berichtigten Fassung gilt dort mit — bleibt der Riegel vor dem Zähler, bleibt auch dieser Dialog stumm |
| **Standard-Tags** | unberührt (`TodoFormDialog` führt kein `submitDisabled`) |
| **Exportvorlagen** | mittelbar: `TemplatesScreen.tsx` trägt eine der drei Kennungen (S-19, aufgenommen, nicht beauftragt) |
| **Outlook-Add-in mit vorhandenem Call** | unberührt; zwei „Bitte"-Stellen sind dort nur **gezählt**, nicht beurteilt (fremde Hoheit) |

## Annahmen

1. **Die Grundlagenzeile von Abschnitt 14 meinte die vertragliche S-15.** Beleg: AK 6 desselben
   Abschnitts. Ich habe sie deshalb eindeutig gemacht statt umbenannt. Wer es anders liest, sagt es
   in dieser Welle — die Zeile ist danach in beiden Lesarten unmißverständlich.
2. **P-1 ist eine Formregel des Kanals, nicht des Anlasses.** Dieselbe Annahme, die
   spec-ux-reviewer in T-221 als Annahme 1 offengelegt hat; ich entscheide sie in diese Richtung
   und schreibe den Grund hin, statt sie offen zu lassen (das war Z-76s Bedingung).
3. **„Name fehlt." ist kein neuer Wortlaut.** Drei zeichengleiche Stellen plus die Nennung im
   Kopfkommentar des Bausteins. Sieht spec-ux-reviewer das anders, ist es eine Vorlage nach E-078
   Punkt 3 und **eine** Genehmigung, kein Umbau.
4. **Am Code gelesen, nicht laufen gesehen:** die Bedingung der Absagefläche, die Verdrängung des
   Hinweises durch die Feldmeldung, die Reihenfolge, in der ein Versuch `touched` setzt. Alle drei
   sind so gefaßt, daß ein Lauf sie widerlegen kann.
5. **Was ein Hörender hört, ist abgeleitet** (T-B09). Betroffen ist genau ein Satz in 13.7 (was
   nach der Änderung beim Gang ins Feld angesagt wird); er ist dort als abgeleitet gekennzeichnet.

## Risiken

1. **Die Behebung von O-KD sieht billiger aus, als sie ist.** Wird sie als „eine Zeile im
   Aufrufer" gebaut, verschwindet der Hinweis **vor** dem ersten Druck — ein Verstoß gegen P-9, der
   wie die Erledigung aussieht und den kein heutiger Prüffall sieht. Deshalb steht die Warnung im
   Papier und nicht nur hier.
2. **Zwei Kanäle in einem Dialog sind erklärungsbedürftig.** Ein Prüfer, der 13.7 und 13.8
   nacheinander liest, sieht zwei Sperrgründe mit zwei Bauarten und könnte es für eine
   Uneinheitlichkeit halten. Die Begründung steht in 13.8 Punkt 1; wer sie gleichmacht, hebt E-093
   Punkt 5 wieder auf.
3. **Die drei S-19-Stellen sind aufgenommen, nicht beauftragt.** Zwei davon sind Geschwistertexte
   zu S-18 und tragen Anforderungen von security-checker — wer sie „aufräumt", faßt einen
   Beratungstext an. Ein Auftrag dazu mißt vorher den heutigen Wortlaut in `tests/**`.
4. **Sicherheit: nichts berührt.** Kein Export, kein Anhang, keine Adresse, keine Versionsprüfung,
   kein Produktivcode. Kein Wortlaut dieses Nachtrags trägt Kundendaten, Pfade oder Call-Nummern.
5. **Meine eigene Fehlerquelle in dieser Runde war eine Zahl, die ich am selben Tag gemessen
   hatte.** Das ist die zweite Papierzahl aus diesem Papier, die kippt. Die Regel dagegen steht in
   1.3 und ist um den Satz erweitert, der gefehlt hat: **wer auf null berichtigt, nennt seinen
   Filter.**

## Offene Fragen

1. **An spec-ux-reviewer:** Trägt „Name fehlt." an der vierten Stelle als **Anwendung** eines
   vorhandenen Wortlauts (meine Annahme 3), oder verlangt E-078 Punkt 3 auch dafür eine Vorlage?
   Eine Zeile Antwort entscheidet, ob 13.8 sofort baubar ist.
2. **An spec-ux-reviewer:** Die Rücknahme aus Z-77 nimmt der Verwerfung in 13.3 **den** Grund, den
   Sie als tragend benannt haben (P-1). Ich halte den verbliebenen Ablaufgrund für stärker —
   bestätigen Sie das bitte ausdrücklich, damit es nicht als stille Änderung durchgeht.
3. **An den Orchestrator:** `Select.tsx` „Bitte wählen" ist ein **Vorgabewert** und betrifft jede
   Auswahl ohne eigenen Platzhalter. Ein Ersatz ist eine Frage an ui-designer (was zeigt eine
   Auswahl ohne Wert?) und nicht nur an mich. Board-würdig?
4. **An den Orchestrator:** Der Rückfallsatz aus `api/client.ts` steht durch 12.10 in der
   häufigsten L3-Meldung. Er ist **unser** Text, kein fremder — gehört er in den nächsten
   Sprachdurchgang, oder bleibt er, solange O-JS nicht beantwortet ist?

## Nächster Schritt

1. **frontend-dev baut 13.7 und 13.8 in einem Stück** — beides ist derselbe Dialog, und die zwei
   Kanäle sind nur zusammen prüfbar. Die AK-Listen liegen fertig vor; die Warnung aus 13.7 („nicht
   eine Zeile im Aufrufer") gehört in den Auftragstext, nicht in eine Fußnote.
2. **e2e-tester mißt beide Richtungen** — nach dem Druck steht der Satz **einmal** auf dem Bild,
   nach dem ersten geänderten Zeichen steht der Hinweis wieder. Das paßt zu **O-KC** (der Riegel
   ist ungesichert) und gehört in denselben Lauf: `{ force: true }` ist an diesen Knöpfen Pflicht.
3. **spec-ux-reviewer:** die zwei Fragen oben, beide klein.
4. **Beim nächsten Anfassen von Abschnitt 4:** die drei S-19-Stellen beurteilen. Nicht jetzt — in
   dieser Welle wächst keine Liste.
