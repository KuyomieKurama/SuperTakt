# Oberflächentext von Takt — Bestandsaufnahme und Regel je Textsorte

**Aufgabe:** T-163, Welle X. **Verfasser:** ux-designer. **Grundlage:** E-078 (Entscheidung vom
2026-09-05), `docs/spec.md`, `.claude/team/decisions.md`, `.claude/team/risks.md`.

**Gegenstand:** jeder Text, den ein Benutzer in `apps/web/src` liest oder vorgelesen bekommt —
Beschriftungen, Knopftexte, Überschriften, Hinweise, Platzhalter, Fehlermeldungen, leere
Zustände, Meldungen, Dialogtitel, Folgen- und Absagesätze, zugängliche Namen, Titelattribute.

**Diese Aufgabe ändert keinen einzigen Oberflächentext.** Sie nimmt auf, urteilt und legt die
Reihenfolge fest. Geändert wird ab Welle X+1, in der Reihenfolge aus Abschnitt 9 und erst,
nachdem ui-designer gesagt hat, was das für Hierarchie und Dichte bedeutet (E-078 Punkt 4).

---

## Nachtrag T-180 (Welle Z) — was sich an diesem Papier geändert hat

Drei Nachträge, zwei davon inhaltlich. Sie stehen hier gesammelt, damit niemand die alte Fassung
eines Eintrags umsetzt, weil er den Nachtrag nicht gelesen hat.

| # | Was | Wo in diesem Papier | Anlaß |
|---|---|---|---|
| 1 | **UM-04 hat eine andere Bauart.** Der Sperrgrund an einem nativ gesperrten Knopf ist über Tab **unerreichbar** — gemessen, nicht abgeleitet. Träger ist der **sichtbare Begleittext**. SP-19 nennt jetzt diesen Träger, nicht mehr den Knopf. | Abschnitt 5 (SP-19), Abschnitt 8 (UM-04), Abschnitt 10 Punkt 3 | T-172 Punkt 2 (visual-qa), O-EQ |
| 2 | **Die Aufnahme bekommt eine Methode, Text ohne JSX zu finden.** Eine Sorte Datei war nicht gesehen: Oberflächentext in reinen `.ts`-Funktionen. Dazu das Urteilsraster für den Aufgabenbereich des Add-ins. | Abschnitt 1.1, Abschnitt 1.2, Abschnitt 11 | O-EI, E-078 Nachtrag Punkt 7 |
| 3 | **Die letzte zeitgebundene Erklärfläche bekommt ihre Bedingung.** `BoardScreen.tsx:975-1008` erscheint künftig unter einer Bedingung, die gemessen **nie** zutrifft; der Inhalt geht ins Handbuch, nicht spurlos. | Abschnitt 8 (UM-08) | T-171 Befund B-3 (ui-designer), O-EC |
| 4 | **UM-02 ist gestrichen.** Der Umbau war bereits gebaut; ihn im Wortsinn auszuführen hätte S-6 aus R-2 still zurückgenommen. | Abschnitt 8 (UM-02), Abschnitt 9 | **E-081 Punkt 3** |
| 5 | **286 ist bestätigt.** Die Zahl der `getByRole`-Zugriffe ist gegengemessen; E-076 Punkt 3 (der 222 nannte) ist berichtigt. | Abschnitt 1, 6.1, S-04, S-15 | Orchestrator, T-180 |

**Was sich nicht geändert hat:** Die Streichliste bleibt bei **zehn** Einträgen (ST-01 bis ST-10).
Dieser Nachtrag fügt keinen elften hinzu. UM-08 ist ein **Umbau** mit Träger, keine Streichung —
das ist der Unterschied, den Abschnitt 3 zieht, und er gilt auch hier.

---

## Nachtrag T-203 (Welle AE) — ein Ausgang, ein Alleinträger, eine Kennzeichnung

Drei Nachträge. Der erste ist neuer Oberflächentext und damit der einzige, der eine Vorlage
braucht; der zweite ist ein Sperrlisteneintrag; der dritte ist eine Kennzeichnung an diesem
Papier selbst.

| # | Was | Wo in diesem Papier | Anlaß |
|---|---|---|---|
| 1 | **Der Nachtragsweg bekommt seinen Ausgang.** Wer „Leistung nachtragen" geht und das Feld leer läßt, bekommt heute eine **Erfolgsmeldung für eine Handlung, die ihren Zweck verfehlt hat**. Abschnitt 12 verfaßt den Wortlaut — vier Lagen, drei Fassungen, und die Lage wird an der **Tagesgruppe** erkannt, nicht am Feldwert. | **Abschnitt 12** (neu) | T-200 **Z-49** (blockierend), E-034, E-078 Punkt 3 |
| 2 | **Der Handbuchabsatz „Herkunft der Spalten" kommt auf die Sperrliste** — als **SP-22**, und mit ihm eine neue Sorte: **Alleinträger nach Fall**. Sie hat drei Pflichtangaben, die kein bisheriger Eintrag führt, und sie wird wiederkommen. | Abschnitt 5 (SP-22), **Abschnitt 5.2** (neu) | T-200 **Z-54** und Offene Frage 4, UM-08, T-195, E-081 Punkt 4 |
| 3 | **Die Zahlen und Zeilen dieses Papiers sind gekennzeichnet, nicht nachgezogen.** Zwei sind heute nachgemessen und **beide waren veraltet**; die Zeilenangaben gelten ab sofort als Hinweis, nicht als Anker. | **Abschnitt 1.3** (neu) | **E-087 Punkt 4** (Nachtrag vom 2026-09-06), T-196, T-202 |

**Was sich nicht geändert hat:** Streichliste weiterhin **zehn** Einträge, Umbauliste weiterhin
**acht**. Abschnitt 12 ist **kein** neunter Umbau — er streicht nichts und legt nichts offen,
sondern schließt einen Ausgang, der bisher schwieg. Er steht deshalb als eigener Abschnitt und
nicht in der Umbauliste.

---

## Nachtrag T-211 (Welle AF) — ein Zustand mit einem Namen, ein Satz, den es nicht gab

Abschnitt 12 ist mit T-200 Z-56 bis Z-58 **freigegeben**. Dieser Nachtrag erledigt die beiden
Auflagen dieser Freigabe, zieht eine Berichtigung nach und verfaßt einen Wortlaut, den es im
Produkt bisher an keiner Stelle gibt.

| # | Was | Wo in diesem Papier | Anlaß |
|---|---|---|---|
| 1 | **L3 nimmt die Worte des Stoppdialogs — angeglichen, nicht begründet abweichend.** Der Titel heißt künftig „Buchung geändert — der Exportwert ließ sich nicht abfragen." Dazu die Regel, die die Frage für jede weitere Fläche entscheidet: **S-13a, Anlaß und Lage.** | Abschnitt 12.3 (Tabelle), **12.9** (neu), 12.8 (AK 3, AK 7a), Abschnitt 4 (S-13) | T-200 **Z-57 Auflage 1** |
| 2 | **Der gemeinsame Baustein ist der Lagesatz, nicht der Rumpf.** Der Stopp trägt „Gebucht: …" davor und bei L3 einen Verweissatz dahinter; beides bleibt bei ihm. Die Berichtigung gilt für L2 **und** L3. | Abschnitt 12.4, **12.9** (neu), 12.8 (AK 7) | T-200 **Z-58** |
| 3 | **Der Regelfall ohne eingerichteten Export ist benannt, mit einer Wiedervorlage, die einen Auslöser hat statt eines „später".** Ohne Vorlage oder Exportordner ist L3 nicht die Ausnahme, und die Fassung wird an **fünf** Flächen gelesen statt an einer. | **12.10** (neu) | T-200 **Z-57 Auflage 2** und Risiko |
| 4 | **Der Satz, den es nicht gibt: die Absage bei „unverändert".** Nicht „Pflichtfeld leer" (es ist gefüllt), nicht „ungültig" (er ist gültig) — die Handlung hat keinen Gegenstand. Verfaßt als **Vorlage**, zu genehmigen von spec-ux-reviewer (E-078 Punkt 3). | **Abschnitt 13** (neu) | T-207 **Offene Frage 2** (frontend-dev) |
| 5 | **SP-22 ist vollständig — die Pflichtangabe ist da und ist gegengemessen.** Die Karte „Was sich geändert hat" ist mit **T-209** gefallen; frontend-dev hat das Datum im selben Auftrag nachgetragen, wie Z-60 es verlangt. Dieser Nachtrag hat es **am Baum nachgeprüft**, statt es aus der Zeile zu glauben. | Abschnitt 5 (SP-22) | T-200 **Z-60**, E-081 Punkt 4 |

**Was sich nicht geändert hat:** Streich-, Umbau- und Sperrliste bleiben bei **zehn**, **acht** und
**zweiundzwanzig** Einträgen. Abschnitt 13 ist **kein** dreiundzwanzigster Sperreintrag — der Satz
ist noch nicht gebaut, und ein Sperreintrag für einen Text, den es nicht gibt, sperrt einen
Zustand, den es nicht gibt (dieselbe Begründung wie bei UM-06 in 5.2).

**Zur Messung in diesem Nachtrag (E-087, in der berichtigten Fassung).** Gesucht wurde am
**2026-09-06** mit ripgrep über den Arbeitsbaum, also über die **Quellverzeichnisse**. Ein
`git grep` über die versionierten Dateien war in diesem Durchgang **nicht** möglich — dieser Lauf
hatte keine Schale. Die Messung ist damit die eine Hälfte des heute vorgeschriebenen Werkzeugs;
die andere fehlt, und das steht hier, statt es zu verschweigen. Für den vorliegenden Fall trägt
sie: die betroffenen Dateien (`TimerContext.tsx`, `BookingDialogs.tsx`, `PoolRenameDialog.tsx`,
`BoardScreen.tsx`) liegen alle im Arbeitsbaum, und ripgrep sieht unversionierte Quellen mit —
genau die Hälfte, an der `git grep` in T-207 blind war.

---

## Nachtrag T-219 (Welle AG) — ein Satz für den Musterblock, ein Auslöser für die Wiedervorlage

Drei Nachträge. Der erste ist neuer Text und die Vorbedingung eines Auftrags, der sonst nicht
losfahren kann; der zweite hängt eine Wiedervorlage um, die auf ein Ereignis wartet, das nie
eintritt; der dritte berichtigt eine **Annahme** dieses Papiers, die ich selbst hineingeschrieben
habe und die heute nicht mehr trägt.

| # | Was | Wo in diesem Papier | Anlaß |
|---|---|---|---|
| 1 | **Der Musterblock bekommt den Fehlertext, den der Baustein wirklich trägt.** `required` fällt an `NoteField` ersatzlos; der Satz, der heute danebensteht, tadelt ein Feld für seine Leere und ist damit die **Bedingung der Tagesgruppe an einem Feld**. Der neue Satz führt vor, wofür `error` da ist: die **Absage des Dienstes an diesem Text**. Dazu die drei Angaben am Block, ohne die er nach dem Schnitt wieder widersprüchlich wäre | **Abschnitt 14** (neu) | T-212 **Z-69** (mit Z-47, Z-48), Board **O-IY**, **O-AX**, E-034, SP-08 |
| 2 | **Die Wiedervorlage aus 12.9 hängt neu — an einem Auftrag, der wirklich fährt.** Sie hing an T-200 Offene Frage 5, und die steht nicht auf dem Board. Neuer Anker ist **O-II**, denn wer den Nachtragsweg baut, öffnet `dayGroup.ts` ohnehin. Die Bedingung ist in einem Blick prüfbar | **12.9** (Berichtigung), 14.9 | T-211 Frage 4, Board **O-IV**, E-087 |
| 3 | **Eine Annahme aus 12.10 ist am Code nachgelesen und stimmt so nicht mehr.** Die Vorschau, an der L3 hängt, faßt den **Exportordner nirgends an**; die Unterscheidung, auf die die Wiedervorlage wartet, müßte der Dienst zur kleineren Hälfte gar nicht erfinden — die Oberfläche wirft sie weg | **12.10** (Berichtigung), 12.9 | eigene Messung, E-087 Punkt 1 |

**Was sich nicht geändert hat:** Streich-, Umbau- und Sperrliste bleiben bei **zehn**, **acht** und
**zweiundzwanzig** Einträgen. Abschnitt 14 ist **kein** dreiundzwanzigster Sperreintrag und auch
kein elfter Streicheintrag — er verfaßt einen Text, den es noch nicht gibt, und er ist wie
Abschnitt 13 eine **Vorlage**, die genehmigt und nicht angewendet wird (E-078 Punkt 3).

**Und ausdrücklich kein Eintrag nach T3-A (5.2).** Der naheliegende Reflex nach dem Fall von
`required` wäre ein Sperrlisteneintrag für „(Pflichtfeld)" als Alleinträger. Er wäre falsch: Die
Zeichenkette fällt nicht auf einen Träger zurück, sie fällt an **dieser** Fläche weg und steht im
Produkt unverändert an sieben Stellen über `FormDialog.tsx#TextField` (gemessen in T-212, Z-69).
T3-A greift bei einer **Aussage**, die einen Träger verliert — hier verliert ein **Baustein** eine
Fähigkeit, die er nie hätte haben dürfen.

**Zur Messung in diesem Nachtrag (E-087).** Gesucht wurde am **2026-09-06** mit ripgrep über den
Arbeitsbaum, also über die **Quellverzeichnisse**; ein `git grep` über die versionierten Dateien
war auch in diesem Durchgang **nicht** möglich — dieser Lauf hatte keine Schale. Es ist damit
wieder die eine Hälfte des vorgeschriebenen Werkzeugs, und das steht hier, statt es zu
verschweigen. Zwei Aussagen dieses Nachtrags sind zudem **am Code nachgelesen und nicht laufen
gesehen** (14.2 Zeile 3 und die Berichtigung zu 12.10); beide sind an ihrer Stelle als das
gekennzeichnet und beide sind so gefaßt, daß ein Lauf sie widerlegen kann.

---

## Nachtrag T-222 (Welle AH) — zwei Beschriftungen für einen Knopf, und eine Regel für den Fokus

Drei Nachträge. Der erste ist die Antwort auf **F-10** und damit die Vorbedingung eines Auftrags,
der sonst mit einer Rückfallfassung fährt; der zweite ist eine Regel über die **Stelle** eines
Zeilenbezugs im zugänglichen Namen; der dritte ist die Antwort auf eine Frage, die ui-designer
ausdrücklich als Frage der Informationsarchitektur an mich weitergereicht hat.

| # | Was | Wo in diesem Papier | Anlaß |
|---|---|---|---|
| 1 | **Der Knopf, der beim Gelingen seine Beschriftung wechselt, bekommt seine zwei Sätze.** Ich nehme ui-designers Fassungen — „Leistung nachtragen" und „Leistung bearbeiten" —, aber nicht stillschweigend: Abschnitt 15 prüft sie gegen S-07, E-078, E-080 und die drei Bedingungen aus 11.4, verwirft sechs Gegenvorschläge mit Grund und schreibt den **verborgenen Zusatz** und den **vollen Namen je Zustand** aus | **Abschnitt 15** (neu) | **F-10** aus `traeger-und-zusage.md` 11.11, T-200 Z-59, Board O-IH |
| 2 | **Wo ein Zeilenbezug steht, hängt daran, ob das Bedienelement sichtbaren Text trägt.** Vorn mit Doppelpunkt, hinten mit Komma — und in derselben Buchungszeile stehen beide Formen nebeneinander. Als **Regel S-15a** | Abschnitt 4 (S-15), 15.4 | SC 2.5.3, eigene Messung an `ExportGroups.tsx` |
| 3 | **Die Regel, wohin der Fokus geht, wenn sein Ziel zu Recht verschwindet.** Ein Satz und vier Stufen — **N-1 bis N-4**. Sie folgen der **Arbeit** und nicht dem Baum, und sie berichtigen die Ersatzkette aus 11.6 an zwei Stellen | **15.8** (neu) | ui-designers Frage in `traeger-und-zusage.md` 11.6, F-11 |

**Was sich nicht geändert hat:** Streich-, Umbau- und Sperrliste bleiben bei **zehn**, **acht** und
**zweiundzwanzig** Einträgen. Abschnitt 15 ist **kein** dreiundzwanzigster Sperreintrag und kein
elfter Streicheintrag.

**Und ausdrücklich keine Vorlage nach E-078 Punkt 3.** Die beiden Sätze aus Abschnitt 13 und 14
liegen bei spec-ux-reviewer, weil sie Sätze **ersetzen oder erfinden**, die ein Prüfer verlangt hat.
Abschnitt 15 tut das nicht: „Leistung nachtragen" bleibt zeichengleich stehen, „Leistung bearbeiten"
tritt an die Stelle von „Bearbeiten" und einer Namensform, die **derselbe** Prüfer in **T-200 Z-59**
als Befund benannt hat. Ein Wortlaut, der die Auflage eines Prüfers erfüllt, braucht nicht dessen
Genehmigung gegen sich selbst. Wer das anders sieht, sagt es in dieser Welle und nicht nach dem Bau.

**Zur Messung in diesem Nachtrag (E-087).** Gesucht und gelesen wurde am **2026-09-06** mit ripgrep
über den Arbeitsbaum; ein `git grep` war auch in diesem Durchgang **nicht** möglich — dieser Lauf
hatte keine Schale. Zwei Aussagen sind **aus der Kaskade gelesen und nicht im Browser gemessen**
(15.6 und der Nebensatz zur Namensbildung in 15.4); beide sind an ihrer Stelle gekennzeichnet und
beide sind so gefaßt, daß ein Lauf sie widerlegen kann. Was ein Hörender hört, ist in diesem
Nachtrag durchgehend **abgeleitet** — hier läuft kein Vorleseprogramm (T-B09).

---

## Nachtrag T-228 (Welle AI) — eine freie Nummer, ein entschiedener Kanal, eine zurückgenommene Begründung und ein Satz, der zweimal dasteht

Sechs Nachträge. Die ersten vier erledigen die Auflagen aus **T-221**, die dem Verfasser dieses
Papiers gehören; die letzten zwei entscheiden die Textfrage, die der Bau aufgeworfen hat (**O-KD**).

**Kein freigegebener Wortlaut ändert sich.** Weder 13.3 noch 14.3 verlieren ein Zeichen — T-221 hat
beide zeichengleich freigegeben und ausdrücklich keine neue Fassung verlangt. Was sich ändert, sind
**eine Nummer, ein Kanal, zwei Begründungen, eine Grenzfrage und die Akzeptanzkriterien**.

| # | Was | Wo in diesem Papier | Anlaß |
|---|---|---|---|
| 1 | **Die Regel heißt ab sofort S-12a — und sie stand außerdem am falschen Ort.** „S-15" war im selben Papier vergeben, an die **vertragliche** Regel über zugängliche Namen. Beim Umhängen kam der zweite, größere Befund heraus: Die Kurzfassung lag seit T-211 **mitten zwischen dem Befund und der Regel von S-10** — also in einer fremden Textsorte, wo sie mitgelesen und nicht gefunden wird. Neue Nummer **und** neuer Ort: bei **S-12** (Dialoge: … **Absage** …), dieselbe Bauart wie S-13a und S-15a | **13.3**, Abschnitt 4 (**S-10** und **S-12**), Abschnitt 14 (Grundlagenzeile) | T-221 **Z-72** (blockierend), E-092 |
| 2 | **Der Kanal ist entschieden und gebaut: Statusfläche, kein Fehlerkanal.** Damit fällt AK 4 in der Fassung, in der sie dastand — der Fokus bleibt am Knopf —, und AK 5 nennt einen anderen Wirt. Das Papier wird an den Bau herangezogen, nicht umgekehrt | **13.4**, **13.5** | **E-093 Punkt 5**, T-221 **Z-73**, gebaut in **T-220** |
| 3 | **Die Zeichengrenze ist entschieden, statt sie zu verschweigen.** **P-1 gilt der Feldmeldung**, nicht jeder Absage — und die Länge dieses Satzes ist ohnehin nicht frei, sondern **gebaut**: ein eigener Satz plus ein vorhandener Hinweis, der schon unter S-05 steht | **13.3** (S-12a) | T-221 **Z-76** |
| 4 | **Zwei Begründungen sind zurückgenommen.** „»Bitte« steht nirgends im Produkt" ist falsch: gemessen **17** Stellen im Oberflächentext, davon vier im Produkt und elf im Dienst, den wir selbst wörtlich durchreichen. **Beide Urteile tragen ohne die Begründung** — und die Messung bringt zwei Befunde ein, die die Aufnahme nicht hatte | **13.3**, **14.4**, S-06, S-07 | T-221 **Z-77**, E-087 |
| 5 | **Der Satz steht zweimal auf dem Bild — der Hinweis weicht, die Absage bleibt zeichengleich.** Entschieden, nicht offengelassen: die Absage ist der Satz, der auf den Druck antwortet, und sie steht dort, wo der Benutzer nach dem Druck hinsieht | **13.7** (neu) | **O-KD**, T-220 Abschnitt 7.1, E-078 Punkt 1 und 4 |
| 6 | **Der zweite Sperrgrund desselben Dialogs bekommt seine Antwort — im anderen Kanal.** Das leere Feld ist **ungültig**; dort ist der Fehlerkanal die Wahrheit und nicht die Behauptung. Ein eigener Wortlaut ist dafür nicht zu erfinden: er steht dreimal im Produkt | **13.8** (neu) | **O-KD** zweite Hälfte, T-220 Abschnitt 7.2, P-3, P-8, P-9 |

**Was sich nicht geändert hat:** Streich-, Umbau- und Sperrliste bleiben bei **zehn**, **acht** und
**zweiundzwanzig** Einträgen. **S-12a ist keine neue Textsorte**, sondern eine Unterregel zu S-12 —
dieselbe Bauart wie S-13a (T-211) und S-15a (T-222), und aus demselben Grund: Eine Regel, die für
**eine Lage innerhalb** einer Textsorte gilt, bekommt keine eigene Sorte, sonst wächst die
Bestandsaufnahme um Nummern statt um Erkenntnis.

**Zur Messung in diesem Nachtrag (E-087, in der Fassung, die heute in `CLAUDE.md` steht).** Gesucht
wurde am **2026-09-06** über den **Wortlaut** und über die **Quellverzeichnisse** (ripgrep,
`.gitignore` geachtet). Die zweite vorgeschriebene Hälfte — `git grep` über die versionierten
Dateien — war **auch in diesem Durchgang nicht möglich**; dieser Lauf hatte keine Schale. Neu ist,
daß die Lücke diesmal **eingegrenzt** statt nur benannt wird:

- Der Baum führt **drei** Ausschlußlisten (`/.gitignore`, `apps/web/.gitignore`,
  `apps/desktop/.gitignore`). Sie nennen ausschließlich **Abhängigkeiten, Bauergebnisse, erzeugte
  Bündel, lokale Daten, Geheimnisse, Prüfartefakte und Werkzeugstände** — darunter
  `apps/desktop/src-tauri/taskpane/`, also genau die veralteten Zweitkopien, die `CLAUDE.md` vom
  Lauf über den Arbeitsbaum **ausgeschlossen** haben will. Der Lauf hat sie ausgeschlossen.
- Was die fehlende Hälfte allein zeigen könnte, ist damit **eine** Klasse: eine **versionierte
  Quelldatei, die unter einem dieser Namen liegt** (also mit `-f` hinzugefügt wurde). Ob es eine
  gibt, ist ohne Schale nicht entscheidbar — das ist eine Schranke und kein Beweis, und sie steht
  hier, statt zu fehlen.

**Am Code gelesen und nicht laufen gesehen:** die Bedingung der Absagefläche
(`FormDialog.tsx#refusalShown`), die Verdrängung des Hinweises durch die Feldmeldung an der
Aufrufstelle und die Reihenfolge, in der ein Absendeversuch `touched` setzt. Alle drei sind so
gefaßt, daß ein Lauf sie widerlegen kann. **Was ein Hörender hört, ist wieder abgeleitet** — hier
läuft kein Vorleseprogramm (T-B09).

---

## 1. Was gemessen wurde, und wie groß der Bestand ist

Gezählt in `apps/web/src` **ohne** `showcase/**`:

| Größe | Zahl |
|---|---|
| Textführende Eigenschaften (`label`, `title`, `description`, `hint`, `lead`, `placeholder`, `consequence`, `refusal`, `acknowledgeLabel`, `confirmLabel`, `cancelLabel`, `submitLabel`, `emptyText`, `reasonLabel`) | 436 in 35 Dateien |
| Zeichenketten ab 55 Zeichen, die auf dem Bildschirm landen | rund 240 |
| Dauerhafte Erklärkästen (`InlineMessage` im Seitenfluss, nicht zustandsgebunden) | 7 |
| Native Titelattribute (`title=`) | 26, davon 11 rein zum Sichtbarmachen abgeschnittener Werte |
| `getByRole`-Zugriffe in `tests/e2e` | **286** in 27 Dateien — gegengemessen in T-180, **E-076 Punkt 3 ist auf diese Zahl berichtigt** (er nannte 222; die Zahl ist seither gewachsen) |
| Textvergleiche in `tests/e2e` (`getByText`, `hasText`, `toContainText`, `toHaveText`) | 247 in 32 Dateien |

**Der wichtigste Einzelbefund der Messung:** Von den Sätzen, die in Abschnitt 7 zum Streichen
vorgeschlagen sind, ist **keiner** in `tests/e2e` oder `apps/web/test` durch einen Textvergleich
festgenagelt. Festgenagelt sind Rollen und **zugängliche Namen** — Knopfbeschriftungen,
Überschriften, Dialogtitel, `aria-label`. Das ist die Trennlinie, an der diese Aufgabe entlang
schneidet: **Die lange Prosa ist frei, die kurzen Namen sind vertraglich.**

### Geltungsbereich

- **Produkt:** `apps/web/src/app/**`, `components/**`, `screens/**`, `lib/**` **und `api/**`**.
  Hier gilt E-078. **`api/**` ist mit dem Nachtrag T-228 hinzugekommen** — nicht weil sich der
  Geltungsbereich geändert hätte, sondern weil die Aufzählung ihn nie enthielt und `api/client.ts`
  vier Sätze trägt, die jeder Benutzer liest (1.2, sechster Träger). Eine Aufzählung, die einen
  Textträger nicht nennt, nimmt ihn aus dem Durchgang, ohne daß jemand es beschließt.
- **Musterseite:** `apps/web/src/showcase/**` und `designsystem.html`. Seit T-057 nicht mehr aus
  dem Produkt erreichbar; ihre `lead`-Texte sind **Prüfdokumentation**, nicht Produktoberfläche.
  E-078 gilt dort **nicht** — aber die Musterseite zeigt Produkttexte und muss nachgezogen
  werden, wo einer fällt. Betroffen ist unter anderem `showcase/BoardSection.tsx`.
- **Nicht Gegenstand:** `apps/outlook-addin/**` (fremde Hoheit, integration-dev) und die Sätze
  der Hülle in `apps/desktop/src-tauri` (sie kommen fertig aus `problems` und werden von
  `ShellStatus` unverändert durchgereicht — das ist Absicht, siehe SP-11).
  **Nachtrag T-180:** Der Aufgabenbereich des Add-ins bleibt fremde Hoheit, aber er ist seit
  E-078 Nachtrag Punkt 7 kein anderer **Geltungsbereich**. Die Aufnahme dort führt
  integration-dev; Methode und Urteilsraster stehen in **Abschnitt 11** dieses Papiers.

---

## 1.1 Wie eine Aufnahme ihre Textträger findet (Nachtrag T-180, O-EI)

**Der Befund, der diesen Abschnitt erzwingt.** `apps/outlook-addin/src/ui/create-gate.ts` (neu aus
T-169) trägt **fünf Sätze Oberflächentext** und **kein JSX**. Es ist nicht die erste solche Datei:
`ui/field.ts` hat die Bauart begründet (Entscheidung statt Zeichnung, damit `proof:addin` sie über
alle Fälle rechnen kann), `callnumber/labels.ts` trägt seit T-028 zehn Sätze auf demselben Weg.
**Text wandert in Takt regelmäßig aus JSX in reine Funktionen, und das ist gewollt** — zweimal war
es die Behebung eines Befunds (E-045: Regel und Text trennen; V-11 aus T-154: Sperre und Grund aus
einem Aufruf). Eine Aufnahme, die diese Bewegung nicht mitmacht, verliert genau die Sätze, die
jemand gerade sorgfältig an den richtigen Ort gelegt hat.

**Die Endung ist kein Filter.** Gemessen am 2026-09-05: `apps/outlook-addin/src` hat **32**
Quelldateien, davon **7** mit der Endung `.tsx`. Wer den Textdurchgang über `.tsx` führt, liest
**7 von 32** Dateien und hält das Ergebnis für vollständig.

### Der Durchgang hat drei Läufe, und der erste ist der einzige, der zählt

**Lauf 1 — die Dateimenge.** Der Textdurchgang liest **jede** Quelldatei des Bereichs, `.ts` wie
`.tsx`. Für den Aufgabenbereich sind das 32 Dateien; das liest ein Mensch. Für `apps/web` (über
100) ordnen die beiden folgenden Läufe die Menge, sie begrenzen sie nicht.

**Lauf 2 — der Satzfilter.** Ein Zeichenkettenliteral, das mit einem Großbuchstaben beginnt, einen
Kleinbuchstaben enthält und auf `.`, `?`, `!` oder `…` endet, ist ein Satz und damit ein Kandidat:

```
["'`][A-ZÄÖÜ„][^"'`\n]*[a-zäöüß][^"'`\n]*[.?!…]["'`]
```

**Lauf 3 — die Form des Exports.** Der Satzfilter findet keine Beschriftung: „Anlegen", „Frist",
„Keine Anhänge" enden auf keinen Punkt. Deshalb ein zweiter Durchgang über die **Bauart**: Jedes
Modul, das ein `Record<…, string>`, ein `Object.freeze` aus Zeichenketten oder eine Funktion mit
Rückgabetyp `string` ausgibt, ist Textträger von Bauart wegen und wird gelesen, auch wenn kein
Filter darin anschlägt. Im Aufgabenbereich sind das **19 von 25** `.ts`-Dateien — das ist eine
Liste zum Lesen, kein Urteil.

### Warum der naheliegende Filter falsch ist — gemessen

Der erste Griff wäre ein Filter auf deutsche Zeichen (`ä`, `ö`, `ü`, `ß`, `„`). Er ist verlockend,
weil er in einem englischsprachigen Quelltext trennscharf aussieht. **Er hätte `create-gate.ts`
nicht gefunden.** Die fünf Sätze lauten:

> „Die Call-Nummer stimmt noch nicht." · „Der Titel fehlt." · „Die Frist stimmt noch nicht." ·
> „Die Tags werden noch geladen." · „Keine Verbindung zu Takt."

Kein Umlaut, kein Eszett, keine deutsche Anführung. Nachgemessen: Der Zeichenfilter nennt 13
`.ts`-Dateien des Aufgabenbereichs und **`create-gate.ts` ist keine davon**; der Satzfilter nennt
7 und **findet sie mit genau fünf Treffern**. Ein Filter, der die kürzesten und ruhigsten Sätze
übersieht, übersieht ausgerechnet die, die E-078 erzeugt hat.

**Regel M-01.** Ein Textdurchgang nennt in seinem Bericht die **Zahl der gelesenen Dateien** gegen
die **Zahl der Dateien des Bereichs**. Steht dort kein Bruch, ist die Aufnahme nicht gemessen,
sondern gegriffen.

**Regel M-02.** Wird Text aus JSX in eine reine Funktion gezogen, nennt der Kopfkommentar dieser
Datei den Grund und die Fläche, auf der die Sätze erscheinen. `field.ts`, `callnumber/labels.ts`
und `create-gate.ts` tun das bereits; das ist der Grund, aus dem der Nachtrag hier eine
Berichtigung ist und keine Rüge.

## 1.2 Was dieser Nachtrag in `apps/web` selbst gefunden hat

Derselbe Filter, auf den eigenen Geltungsbereich angewandt — denn eine Methode, die das fremde
Haus prüft und das eigene nicht, ist keine. Die Aufnahme aus Abschnitt 4 lief über die
**Namen der Eigenschaften** (`label`, `title`, `hint`, …) und hat `.ts`-Dateien deshalb dort erfaßt, wo sie
diese Namen benutzen: `lib/labels.ts`, `lib/errorText.ts`, `lib/exportDirectoryAdvice.ts`,
`lib/databaseLocationAdvice.ts`, `app/undoDone.ts`. **Sechs weitere Träger sind ihr entgangen** —
der sechste ist mit dem Nachtrag T-228 dazugekommen, und er ist der schwerste, weil er außerdem
außerhalb der Aufzählung des Geltungsbereichs lag:

| Datei | Was sie trägt | Vorläufiges Urteil |
|---|---|---|
| `app/connection.ts` | sechs Sätze zu dem, was **ohne Anwendungshülle nicht geht** („Anhänge öffnet die Takt-Anwendung. Im Browser allein steht dieser Weg nicht zur Verfügung.") | **A** — Abwesenheit, Geschwistertext zu SP-20. **Vorläufig gesperrt.** |
| `app/useUpdateNotice.ts` | Titel und Rümpfe der Meldungen zur Versionsprüfung, darunter die Absage bei unplausibler Fassungsbezeichnung | **A/B** — hängt an A-18.9 bis A-18.11 und E-064, wie SP-12. **Vorläufig gesperrt.** |
| `lib/exportTemplateModel.ts` | Absagen beim Lesen einer Vorlage und die Abweichungen gegen die Standardvorlage („Das Feld „X" der Standardvorlage fehlt. Das Abrechnungstool erwartet es.") | **B** — Absage mit Begründung, Bezug A-7.x |
| `lib/poolRule.ts` | die Regelzusammenfassung samt Achsenbeschriftungen und den Sätzen „Diese Regel nennt keine Bedingung und trifft nichts." | trägt die **Kompensation** für ST-05 (T-171 Abschnitt 3.5) — **nicht anfassen, solange ST-05 offen ist** |
| `lib/attachmentLabel.ts` | Artbezeichnungen und die Absagegründe in Wortgleichheit mit `attachment.rs` | **B**, Bezug R-22 — Geschwistertext zu SP-13 |
| `api/client.ts` **(sechster Träger, Nachtrag T-228)** | **vier** Sätze, darunter der **Rückfallsatz** jeder Absage ohne eigenen Grund („Unbekannter Fehler. Bitte versuchen Sie es erneut.") und die zwei Sätze zum nicht erreichbaren Dienst | **B** — und der meistgelesene Satz des Produkts, sobald etwas schiefgeht. **Vorläufig gesperrt**, und mit einer offenen Frage: 12.10 reicht ihn wörtlich durch (siehe 13.3a) |

**Ausdrücklich: keiner dieser sechs Einträge ist ein Streichvorschlag.** Sie sind **aufgenommen und
noch nicht beurteilt**. „Vorläufig gesperrt" heißt: bis zum Urteil wird an ihnen nichts gekürzt —
die Sperre ist die vorsichtige Richtung, nicht die bequeme. Das Urteil gehört in den Durchgang,
der noch nicht gelaufen ist; die Liste wächst in dieser Welle nicht.

## 1.3 Die Zahlen und die Zeilen dieses Papiers (Nachtrag T-203, E-087 Punkt 4)

**Fünfmal in dieser Runde war eine Papierzahl die Fehlerquelle, und zweimal war es eine Zahl aus
diesem Papier.** Dieser Abschnitt zieht daraus die Regel für alles, was hier Zahlen führt. Er
zieht **nichts** stillschweigend nach.

### Die Zeilenangaben sind ab sofort Hinweise, nicht Anker

E-087 Punkt 4 sagt es wörtlich: *„ein Zitat ist der Anker, die Zeile höchstens ein Hinweis, und
eine fremde Datei wird **ohne** Zeilenangabe genannt."* Dieses Papier nennt **jede** Datei außer
sich selbst als fremde Datei und führt trotzdem, über die Abschnitte 4 bis 8 verteilt, mehrere
hundert Zeilenangaben. T-196 hat gemessen, was sie wert sind: in einer Datei stand **keine
einzige** von dreizehn richtig, elf davon exakt um acht verschoben, ohne daß ein Wortlaut sich
geändert hätte.

**Daraus folgt dreierlei, und es gilt für jeden, der aus diesem Papier einen Auftrag baut:**

1. **Gesucht wird über den Wortlaut.** Jeder Eintrag der Streich-, Umbau- und Sperrliste nennt
   seinen Satz; der Satz ist der Anker. Wer über eine Zeile sucht, sucht falsch, und wer über den
   **Anfang** eines Satzes sucht, trifft möglicherweise einen anderen (T-200 Z-54, Auflage 2).
2. **Die Sperrliste ist bereits richtig gebaut** und muß nicht umgeschrieben werden: Ihre Spalte
   **„Wortlaut (Anfang)"** ist der Anker, die Zeilenangaben in der Spalte „Ort" sind der Hinweis.
   Sie werden **nicht** nachgeführt — eine stille Aktualisierung erzeugt genau die Zusicherung,
   gegen die E-087 gerichtet ist.
3. **Ein Auftrag mißt selbst.** Vor jedem Streich- oder Umbenennungsauftrag wird der **heutige**
   Wortlaut in `tests/**` und `apps/*/test/**` gesucht, und das Ergebnis steht im Auftrag
   (E-087 Punkt 1). Dieses Papier trägt diese Messung nicht, es hat sie nur einmal getragen.

### Was heute nachgemessen ist — und beide Zahlen waren veraltet

Gemessen am **2026-09-06** über den Arbeitsbaum (ripgrep, `.gitignore` geachtet, Bauergebnisse
damit außen vor). **Kein `git grep`** — dieser Durchgang hatte keine Schale zur Verfügung; der
Unterschied ist genannt, nicht verschwiegen.

| Zahl in diesem Papier | Stand laut Papier | Heute gemessen | Urteil |
|---|---|---|---|
| `getByRole`-Zugriffe in `tests/e2e` (Abschnitte 1, 6.1, S-04, S-15) | **286 in 27 Dateien**, gegengemessen T-180 (2026-09-05) | **315 in 32 Dateien** | **veraltet nach einem Tag.** Die Richtung stimmt, die Zahl nicht. Dieselbe Alterung wie 222 → 286. Der Satz, den sie trägt („jede sichtbare Beschriftung ist ein zugänglicher Name und steht in Prüffällen"), trägt weiter — **die Zahl ist ab hier als Stand vom 2026-09-06 zu lesen und bei der nächsten Verwendung neu zu messen** |
| Kennungen im Oberflächentext (**S-19**, „an fünf Stellen") | **fünf**, gezählt T-163 | **null** im Produkt; die sechste, die T-184 gefunden hat (`ExportAudit.tsx`, „… Das Feld ist freiwillig (E-047)"), ist inzwischen ebenfalls gefallen, und der Prüffall in `tests/e2e/export-mixed-status-and-billing.spec.ts` endet heute **vor** der Kennung | **war falsch und ist erledigt.** Die Zahl war nie richtig (es waren sechs, E-087 nennt genau diesen Fall als Anlaß); ST-03 ist am Baum vollständig ausgeführt. **S-19 bleibt als Regel** — sie gilt für neue Texte |

**Ein Nebenbefund zur zweiten Zeile, damit ihn niemand als Restposten mißversteht.** Die
**Musterseite** trägt weiterhin über ein Dutzend Kennungen in sichtbarem Text
(`showcase/InventorySection.tsx`, `ExportStatusSection.tsx`, `BoardSection.tsx`, `RuleSection.tsx`
und weitere; grob gezählt am 2026-09-06, ohne Trennung von Kommentar und Fläche). **Das ist kein
Verstoß gegen S-19 und wird nicht nachgezogen:** Nach dem Geltungsbereich in Abschnitt 1 sind die
Texte der Musterseite **Prüfdokumentation**, und dort ist die Kennung die Auskunft, um die es
geht. Wer sie in einem späteren Textdurchgang „aufräumt", nimmt der Musterseite ihren Zweck.

### Der zweite Durchgang am selben Tag (Nachtrag T-228) — und er hat eine eigene Zahl widerlegt

**Sechsmal in dieser Sitzung war eine Papierzahl die Fehlerquelle, zweimal eine aus diesem Papier.**
Der Nachtrag T-228 hat deshalb nicht nur seine eigenen Behauptungen gemessen, sondern die drei
Aussagen dieses Abschnitts noch einmal — **am selben Tag**, an dem sie geschrieben wurden. Zwei
davon haben sich verschoben, eine ist falsch.

| Aussage | Stand oben | T-228, 2026-09-06 | Urteil |
|---|---|---|---|
| `getByRole` in `tests/e2e` | **315 in 32 Dateien** | **319 in 31 Dateien** | **verschoben innerhalb desselben Tages.** Vier mehr, eine Datei weniger. Die Richtung ist dieselbe wie 222 → 286 → 315 → 319, und der Satz, den die Zahl trägt, ist von ihr unabhängig. **Dazu ein Meßvorbehalt, der bisher fehlte:** gezählt werden **Zeilen mit Treffer**, nicht Aufrufe — eine Zeile mit zwei `getByRole` zählt einmal. Das Papier nennt sie „Zugriffe"; das ist eine Untergrenze, keine Zahl |
| Kennungen im Oberflächentext (**S-19**) | **null im Produkt** | **mindestens drei** | **falsch, und es ist meine Zahl von heute morgen.** Gefunden: `components/ExportDirectoryField.tsx` zweimal (*„… ohne halbe Datei (A-8.8)."* und *„… lesbare Kundennotizen (A-8.9);"*, beide in `TRAIT_TEXT`, beide sichtbarer Rumpf einer Meldung) und `screens/TemplatesScreen.tsx` einmal (*„… geht in keinen Export (A-7.2). Melden Sie das bitte —"*). **Aufgenommen in S-19; kein Streichauftrag in diesem Nachtrag** |
| Geltungsbereich (Abschnitt 1) | vier Verzeichnisse | **fünf** | **unvollständig.** `api/**` fehlte, und dort liegt der Rückfallsatz jeder Absage. Berichtigt in Abschnitt 1 und 1.2 |

**Warum die zweite Zeile mehr wiegt als ihre Zahl.** Die Messung von heute morgen hat über die
**bekannten** Kennungen gesucht (E-054, E-055, E-047, R-10) und daraus „null" geschlossen. Das ist
derselbe Fehler wie der Zeichenfilter aus 1.1: **ein Filter, der nur findet, was man schon kennt,
bestätigt die eigene Liste.** Gesucht werden muß nach der **Form** einer Kennung, nicht nach ihren
bekannten Werten — und in `apps/web/src` steht sie in JSX-Text und in `Record<…, string>`-Trägern,
also genau in den beiden Bauarten, die 1.1 Lauf 2 und Lauf 3 beschreiben. **Regel M-01 gilt auch
für Nachmessungen:** wer eine Zahl auf null berichtigt, nennt, wonach er gesucht hat.

### Was ausdrücklich **nicht** nachgemessen ist

Die übrigen Zahlen aus Abschnitt 1 (436 textführende Eigenschaften, rund 240 Zeichenketten ab 55
Zeichen, 7 dauerhafte Erklärkästen, 26 Titelattribute davon 11 sinnvoll, 247 Textvergleiche), die
21 Leerzustände aus S-08, die sieben Kästen aus S-11 und die Dateimengen aus 1.1 und 11.3 (32
Quelldateien, davon 7 mit JSX; 19 von 25 `.ts`-Dateien) sind **Stände vom 2026-09-05** und seither
nicht gegengemessen. Zwei Wellen mit Streichungen liegen dazwischen. **Sie sind als Größenordnung
zu lesen und als Nachweis nicht mehr zu benutzen.** Wer eine davon in einem Auftrag braucht, mißt
sie neu und schreibt das Datum daneben (E-087 Punkt 2).

---

## 2. Das Urteilsraster

Aus E-078 Punkt 1, hier als Prüffragen an jeden einzelnen Satz. Der Satz gilt als **schuldig
erst nach** der Prüfung, nicht davor.

**Streichbar, wenn eine dieser drei Fragen mit Ja beantwortet wird:**

- **D — doppelt.** Steht dieselbe Aussage an einer zweiten Stelle, die derselbe Benutzer im
  selben Arbeitsgang liest?
- **S — erklärt das Sichtbare.** Sagt der Satz etwas, das der Benutzer im selben Blickfeld
  ohnehin sieht — den Zustand eines Schalters, den Inhalt einer Liste, die Bedienung eines
  Bedienelements?
- **V — auf Vorrat.** Gilt der Satz nur in einem Zustand, steht aber in allen?

**Nie streichbar, wenn eine dieser drei Fragen mit Ja beantwortet wird:**

- **F — nennt eine Folge.** Was ist danach anders, und lässt es sich zurücknehmen?
- **A — spricht eine Abwesenheit aus.** Sagt der Satz, dass etwas **nicht** geschieht, **nicht**
  gespeichert wird, **nicht** existiert? Eine Abwesenheit sieht man nicht; wer sie streicht,
  streicht die einzige Stelle, an der sie steht.
- **B — begründet eine Absage.** Warum hat Takt etwas nicht getan, und was ist zu tun?

Trifft **F**, **A** oder **B** zu, bleibt der Satz, auch wenn er lang ist. Trifft zugleich **D**
zu, fällt die **Kopie**, nicht das Original.

**Ein vierter Weg, und er ist der bevorzugte (E-078 Punkt 2):** Trifft **V** zu und zugleich
**F**, **A** oder **B**, wird nicht gestrichen, sondern **offengelegt** — der Satz wandert in den
Zustand, in dem er gilt. Siehe Abschnitt 8.

---

## 3. Die drei Träger der progressiven Offenlegung in Takt

Das muss vor der Umbauliste stehen, weil es sie begrenzt.

**E-076 Punkt 2 sagt wörtlich: „Es gibt in Takt keine Reiter und keine Aufklappabschnitte; für
diese beiden Ark-Bausteine wird keine Fläche erfunden."** Progressive Offenlegung darf also
**nicht** über einen Aufklapper gebaut werden. Wer das will, braucht eine Entscheidung, nicht
eine Zeile Code.

Es bleiben genau drei Träger, und alle drei sind im Bestand vorhanden und erprobt:

| Träger | Bauart | Vorbild im Bestand |
|---|---|---|
| **T1 Zustandsbindung** | Der Text erscheint nur, wenn sein Zustand eintritt. | `PoolFormDialog.tsx:568-574` (Warnung nur bei geändertem Modus), `lib/exportDirectoryAdvice.ts` (Befund nur bei Trefferlage), `ShellStatus.tsx:216-242` (Notfallanleitung erst nach Fehlschlag) |
| **T2 Handlungsbindung** | Der Text tritt bei der Handlung auf — im Dialog, im Toast, in der Live-Region. | `AttachmentOpenDialog`, `ConfirmDialog.consequence`, `poolPlacementMessage` |
| **T3 Handbuch** | Der Text steht in `docs/benutzerhandbuch.md`, nicht auf dem Bildschirm. | Fremde Hoheit (documenter); die Oberfläche verweist nicht darauf, sie schweigt schlicht. |

**Regel:** Jeder Eintrag der Umbauliste nennt seinen Träger. Ein Eintrag ohne Träger ist eine
Streichung und gehört in Abschnitt 7.

---

## 4. Bestandsaufnahme nach Textsorte

Je Sorte: Befund, **Regel** (gilt ab sofort für neue Texte und ist der Maßstab der Umsetzung),
und die Einzelurteile mit Datei und Zeile.

### S-01 Navigationsbeschriftungen

**Befund.** Acht Punkte in `app/Navigation.tsx:35-44`, drei Unterbereiche in
`screens/parts.tsx:85-93`, sechs Bereiche in `screens/SettingsScreen.tsx:134-171`. Alle
Beschriftungen sind ein Wort oder zwei — vorbildlich. **Jeder** trägt zusätzlich einen `hint`,
und in Navigation und Unterbereichen wird dieser `hint` als natives Titelattribut ausgegeben.

**Regel S-01.**
- Ein Navigationspunkt trägt **ein Substantiv**, höchstens zwei Wörter, ohne Artikel.
- Ein Navigationspunkt trägt **keinen erklärenden Zusatz**. Wenn die Beschriftung nicht trägt,
  ist die Beschriftung falsch, nicht zu kurz.
- Eine Ausnahme: die **Schiene der Einstellungen**. Dort stehen sechs Bereiche gleichzeitig
  untereinander, ohne Inhalt daneben; der Zusatz unterscheidet sie auf einen Blick und ist
  sichtbarer Text, kein Tooltip. Er bleibt und ist auf **fünf Wörter** begrenzt.

| Ort | Urteil |
|---|---|
| `Navigation.tsx:35-44` acht `hint`-Werte, ausgegeben als `title` in Zeile 80 | **S + D.** Streichen — ST-01 |
| `parts.tsx:86-92` drei `hint`-Werte, ausgegeben als `title` in Zeile 104 | **S + D.** Streichen — ST-02 |
| `SettingsScreen.tsx:139-170` sechs `hint`-Werte, sichtbarer Text in der Schiene | bleibt; einer davon zu lang (`status`, 8 Wörter) — ST-04 |
| `SettingsScreen.tsx:173-180` `AREA_LEAD`, sechs Sätze im Ansichtskopf | **D** zur Schiene und zur Karten-Beschreibung darunter — ST-04 |

### S-02 Ansichtsköpfe (`ScreenHeader.lead`)

**Befund.** Elf Ansichten tragen einen `lead`. Neun davon sind ein Satz und beantworten „wofür
ist diese Ansicht da" — richtig und knapp. Zwei nicht: `TodoListScreen.tsx:426` hängt eine
Bedienauskunft an, `BoardScreen.tsx:372` setzt zwei vollständige Erklärsätze aus `lib/labels.ts`
hintereinander (vier Sätze).

**Regel S-02.**
- **Ein** Satz, höchstens **80 Zeichen**. Er sagt, **wofür** die Ansicht da ist.
- Er sagt **nicht**, wie sie bedient wird, und **nicht**, was ein Begriff bedeutet.
- Er wiederholt **nichts**, was die Filterleiste, die Kartenköpfe oder die Leerzustände darunter
  ohnehin sagen.
- Ansichten, deren Titel trägt, brauchen keinen `lead`. `TimeScreen` und `ExportScreen` sind
  Grenzfälle; siehe ST-10.

| Ort | Urteil |
|---|---|
| `TodoListScreen.tsx:426` „… Erledigte sind ausgeblendet, bis Sie sie einblenden." | **D** zu `FilterToggle.hint:510` und zu `HiddenDoneNotice:650` — ST-06 |
| `BoardScreen.tsx:372` `RULE_IS_A_RULE` + `RULE_WHAT_MOVES_A_CARD` | **D**, vier Sätze — ST-05 |
| `TagsScreen.tsx:79`, `TagsScreen.tsx:612` mit „(E-054)" | Kennung im Oberflächentext — ST-03 |
| `ExportAuditScreen.tsx:127`, `BookingsScreen.tsx:288`, `DashboardScreen.tsx:140`, `TemplatesScreen.tsx:467`, `ExportScreen.tsx:592`, `TimeScreen.tsx:106` | bleiben unverändert |

### S-03 Kartenüberschriften und Kartenbeschreibungen (`Card.title`, `Card.description`)

**Befund.** Die Kartenüberschriften sind durchgängig ein bis zwei Wörter — vorbildlich. Die
Beschreibungen sind die zweitgrößte Textmenge des Produkts und die häufigste Fundstelle für
**D**: In den Einstellungen sagt jede Karte noch einmal, was die Schiene links und der
Ansichtskopf oben schon gesagt haben; in `StatusSettings.tsx:276` ist der Satz sogar
zeichenweise fast identisch mit `AREA_LEAD.status`.

**Regel S-03.**
- Die Beschreibung **entfällt**, wenn Titel und Inhalt der Karte die Frage beantworten. Das ist
  der Regelfall, nicht die Ausnahme.
- Sie steht nur, wenn sie eine Tatsache trägt, die man der Karte **nicht ansieht**: eine Folge
  („wirkt sofort"), eine Abwesenheit („hier nicht änderbar", „steht in keinem Export"), eine
  Absage.
- Höchstens **ein** Satz, höchstens 80 Zeichen.
- Sie ist **nie** derselbe Satz wie der `lead` der Ansicht.

| Ort | Urteil |
|---|---|
| `SettingsScreen.tsx:309, 421, 559, 589, 659, 774` | **D** zu `AREA_LEAD` — ST-04 |
| `StatusSettings.tsx:276` | **D**, nahezu wortgleich mit `AREA_LEAD.status` — ST-04 |
| `TodoDetailScreen.tsx:361` „Ein Kennzeichen am Todo — weder der Status noch eine Kanban-Spalte. Alle drei sind unabhängig." | **A** (Abwesenheit einer Kopplung) — **bleibt**, Kürzung nur mit spec-ux-reviewer |
| `TodoDetailScreen.tsx:421` Frist | **A** — Sperrliste SP-05 |
| `TodoDetailScreen.tsx:447` Anhänge | **F** (was ein Klick auslöst) + **D** zu `Attachments.tsx:609` — Umbau UM-06 |
| `TodoDetailScreen.tsx:454, 580` | 580 trägt „(E-055)" — ST-03; Rest bleibt |
| `ExportAuditScreen.tsx:173-174` „Wozu dieses Protokoll da ist" / „Maßnahme gegen R-10" | **S** + Kennung — ST-03, ST-08 |
| `Attachments.tsx:397` FormDialog-Beschreibung | **D** zu den drei Optionen unmittelbar darunter — ST-08 |
| `TemplatePreview.tsx:597` | **D** zu `TemplatePreview.tsx:303-306` — ST-07 |
| `BookingDialogs.tsx:514` Protokoll-Abgrenzung | **A** (was **nicht** darin steht) — **bleibt** |

### S-04 Feldbeschriftungen (`label`)

**Befund.** Durchgängig ein bis zwei Wörter, deutsch, ohne Artikel: „Titel", „Call-Nummer",
„Frist", „Status", „Tags", „Leistung", „Vermerk". **Diese Sorte ist bereits so kurz, wie sie
sein kann.** Eine Ausnahme: `PoolFormDialog.tsx:559` „Wie viele davon müssen zutreffen?" — eine
Frage als Beschriftung einer Optionszeile. Sie ist gedeckt (S-7 aus R-2 verlangt vier
unterscheidbare Namen für vier Bedienelemente) und bleibt.

**Regel S-04.**
- Substantiv, ein bis zwei Wörter, kein Artikel, kein Doppelpunkt.
- Eine Beschriftung wird **nie** durch einen Platzhalter ersetzt (SC 3.3.2).
- Zwei Bedienelemente im selben Formular tragen **nie** dieselbe Beschriftung; sie tragen aber
  auch nie eine erfundene Unterscheidung, wo das Feld selbst schon unterscheidet.
- **Vertraglich:** Jede sichtbare Beschriftung ist der zugängliche Name ihres Feldes und steht
  in 286 `getByRole`-Zugriffen. Änderungen daran sind nie „nur Text".

### S-05 Feldhinweise (`hint`, `help`)

**Befund — die größte einzelne Textmenge und der größte Hebel.** `Select.tsx:233-237` und die
Textfelder geben `hint` als **dauerhaft sichtbaren Absatz unter dem Feld** aus. Es gibt keinen
Zustand, in dem er verschwindet. Damit steht unter `TodoFormDialog.tsx:235` bei **jedem** Öffnen
des Dialogs ein Zwei-Satz-Vortrag über den Unterschied zwischen Status und Kanban-Spalte, und
unter `TodoListScreen.tsx:504` bei jedem Blick in die Filterleiste ein Zwei-Satz-Vortrag über
Todos ohne Frist.

Zugleich ist genau diese Sorte die Heimat der wichtigsten **A**-Sätze des Produkts: Der
Fristhinweis spricht eine Abwesenheit aus (E-074 Punkt 4), der Leistungshinweis eine Folge
(E-034), der Exportachsen-Hinweis einen Widerspruch, der sonst unerklärt bliebe (S-1 aus R-2).

**Regel S-05.**
- Ein Feldhinweis steht nur, wenn er eine **Regel** nennt, die man dem Feld nicht ansieht:
  **Form** („ein Tag, keine Uhrzeit"), **Grenze**, **Folge**, **Abwesenheit**, **Absage**.
- Er nennt **nie** die Bedienung des Bedienelements. „Tippen Sie einen Namen, dann werden
  Vorschläge angezeigt" beschreibt, was das Bedienelement sichtbar tut.
- **Höchstens 80 Zeichen, solange er dauerhaft sichtbar ist.** Alles darüber ist entweder
  zustandsgebunden (T1) oder es fällt.
- Ein Hinweis, der nur in einem Zustand gilt, steht nur in diesem Zustand — und dann **auch**
  nicht in `aria-describedby`. Sicht und Gehör bekommen dieselbe Menge; ein Hinweis, den nur
  eine Vorlesehilfe hört, wäre eine zweite Anwendung (R-2a, Antwort auf T-097 Frage 3).

| Ort | Urteil |
|---|---|
| `TodoFormDialog.tsx:227` Frist | **A** — Sperrliste SP-04, Kürzung nur mit spec-ux-reviewer |
| `TodoListScreen.tsx:504` Ordnung/Frist | **A** (E-074 Punkt 2) — Sperrliste SP-03 |
| `labels.ts:519` `BILLING_NOTE_MAY_BE_EMPTY` | **F** (E-034, B-4 aus T-116) — Sperrliste SP-08 |
| `labels.ts:438` `POOL_EXPORT_NOT_BILLED_HINT` | **F/A** (S-1 aus R-2). Das **V** war ein Meßfehler: `RadioRow` zeigt sichtbar ohnehin nur den Hinweis der gewählten Option — ~~UM-02~~ entfällt (E-081), es bleibt ST-03 und SP-15 |
| `labels.ts:457` `POOL_EXPORT_EXPORTED_NOTE` | **F/A** (W-7 aus R-2a) — bleibt |
| `NoteField.tsx:50, 58` `help` | **F/A** (E-016, R-06, R-08) — Sperrliste SP-09, Kürzung nur mit spec-ux-reviewer |
| `TodoFormDialog.tsx:235` Status | **S + D** — ST-05 |
| `TodoFormDialog.tsx:247` Tags (Anlegen) | **S**, zweiter Halbsatz ist **F** — ST-06 |
| `TodoListScreen.tsx:510` „Voreingestellt ausgeblendet" | **S** — ST-06 |
| `SettingsScreen.tsx:320` Farbmodus | **S + D** zur Beschriftung „Systemvorgabe" — ST-06 |
| `SettingsScreen.tsx:331` Zeilendichte | **A** („noch keinen Platz in den gespeicherten Einstellungen") — bleibt, kürzbar |
| `SettingsScreen.tsx:627-631` Standard-Tags | **A** im leeren Fall — bleibt |
| `Attachments.tsx:420-422` drei Optionshinweise | **D** zu den Feldhinweisen 434/446-450 — ST-06 |
| `Attachments.tsx:434, 446-450, 475` | **A/F** — bleiben |
| `PoolFormDialog.tsx:555, 578, 596, 601` | **S** (sie erklären die Beschriftung darüber) — ST-08 prüfen |
| `TemplatesScreen.tsx:577` „Nur für Sie. In der Datei steht dieser Name nicht." | **A** — bleibt |
| `BookingsScreen.tsx:320` „Einengung innerhalb des Status, kein eigener Statuswert" | **A** — bleibt |
| `BoardScreen.tsx:379` | **A** (Spalten, die nach „Erledigt" fragen, zeigen trotzdem) — bleibt |

### S-06 Platzhalter (`placeholder`)

**Befund.** Meist Beispiel oder Form — richtig: `"https://…"`, `"Titel oder Call-Nummer …"`,
`"Vollständiger Pfad zur Datei"`. Zwei Ausreißer: `NoteField.tsx:59` redet den Benutzer mit
**„dich"** an, während das ganze übrige Produkt „Sie" sagt — und
`TodoDetailScreen.tsx:613` überschreibt denselben Platzhalter mit einer **„Sie"**-Fassung. Zwei
Anreden für dasselbe Feld.

**Nachtrag T-228: es sind drei, und der dritte ist ein Vorgabewert.** `Select.tsx` trägt als
Vorgabe den Platzhalter **„Bitte wählen"** — eine **Aufforderung**, also weder Beispiel noch Form.
Er ist bei der Aufnahme durchgerutscht, weil die Sorte über die Aufrufstellen gezählt wurde und
dieser hier in der **Voreinstellung des Bausteins** steht. Gefunden hat ihn nicht ein Textdurchgang,
sondern die Messung zu einer ganz anderen Behauptung (13.3a).

**Regel S-06.**
- Beispiel oder Form, **nie** Anweisung, **nie** Anrede, **nie** Wiederholung der Beschriftung.
- Höchstens 40 Zeichen.
- Der Platzhalter ersetzt keine Beschriftung und trägt keine Auskunft, die man beim Tippen
  braucht — er verschwindet dann.

| Ort | Urteil |
|---|---|
| `NoteField.tsx:59` „Nur für dich. …" | **D** zum Banner „Bleibt in Takt" + Bruch der Anrede — ST-09 |
| `TodoDetailScreen.tsx:613` „Notiz für Sie selbst — …" | **D** zum Banner — ST-09 |
| `NoteField.tsx:51`, `TimerContext.tsx:766, 798` „Was wurde geleistet?" | bleibt |
| `Select.tsx` **Vorgabeplatzhalter „Bitte wählen"** (Nachtrag T-228) | **Anweisung statt Beispiel oder Form** — der dritte Ausreißer dieser Sorte, und der schwerste: Er ist der **Vorgabewert** und steht damit an **jeder** Auswahl ohne eigenen Platzhalter. **Aufgenommen, nicht beurteilt** — er ist zugleich der einzige sichtbare Zustand einer Auswahl ohne Wert, und was dort stattdessen steht, ist eine eigene Frage (ui-designer) |

### S-07 Knopftexte

**Befund — die beste Sorte im Bestand.** Fast durchgängig Verb oder Verb + Objekt: „Anlegen",
„Speichern", „Öffnen", „Ausführen", „Entfernen", „Endgültig löschen", „Erneut versuchen",
„Weiterlaufen lassen", „Stoppen und buchen". Nirgends „OK", nirgends „Ja", nirgends „Bitte".
Zwei Knöpfe überschreiten drei Wörter, und beide aus einem Grund:
`TemplatesScreen.tsx:731` „Änderungen verwerfen und wechseln" (**F**) und
`SettingsScreen.tsx:525` „Ordner trotzdem einstellen" mit `cancelLabel` „Anderen Ordner wählen"
(**B**). Beide bleiben.

**Regel S-07.**
- **Höchstens drei Wörter, höchstens 24 Zeichen.** Ausnahme allein: der Knopf einer nicht
  umkehrbaren Handlung darf die Handlung ausschreiben, wenn das Wort sonst zweideutig wäre.
- Der Knopf nennt die **Handlung**, nie die Zustimmung. Nie „OK", „Ja", „Bestätigen",
  „Fortfahren".
- Bei zwei Antworten ohne Vorauswahl tragen **beide** dieselbe Gestalt und beide ein eigenes
  Wort (A-18.7; `UpdateDialog.tsx:176-181`, `AttachmentOpenDialog.tsx:265-276`).
- **Vertraglich.** Jeder Knopftext ist ein zugänglicher Name.

### S-08 Leere Zustände (`EmptyState`)

**Befund.** 21 Leerzustände. Die Titel sind gut („Noch kein Todo", „Keine Anhänge", „Nichts zu
exportieren"). Die Beschreibungen schwanken zwischen einem Satz (richtig) und einem Absatz, der
den Zweck der Fläche erklärt (`BoardScreen.tsx:794, 815, 967`, `TagsScreen.tsx:193, 624`). Der
längste ist `BoardScreen.tsx:815` mit vier Teilsätzen.

**Regel S-08.**
- **Titel:** was fehlt, höchstens fünf Wörter, keine Frage.
- **Beschreibung:** **ein** Satz, und er sagt den **nächsten Schritt** — nicht, wozu die Fläche
  da ist. Höchstens 100 Zeichen.
- **Genau eine** Aktion (`EmptyStateProps.action` ist bereits so gebaut, Kommentar
  `Primitives.tsx:245`).
- Ein leerer Zustand, der eine **Absage** erklärt (die Regel trifft nichts; der Ordner ist leer),
  darf länger sein — er fällt unter **B**. `BoardScreen.tsx:794, 815, 837` sind solche Fälle.

| Ort | Urteil |
|---|---|
| `BoardScreen.tsx:794, 815, 837` | **B** — bleiben |
| `BoardScreen.tsx:967` „Seit der Umstellung …" | **D** + zeitgebundene Formulierung, die altert — ST-05 |
| `TagsScreen.tsx:193, 624` | **D** zu `TagsScreen.tsx:612` — ST-05 |
| `TodoListScreen.tsx:535, 553`, `BookingsScreen.tsx:392-393`, `DashboardScreen.tsx:302, 348`, `ExportScreen.tsx:777` | bleiben |
| `TemplatePreview.tsx:324, 340, 384` | **B** — bleiben |
| `Attachments.tsx:609` | **A** („Takt kopiert nur Bilder") — bleibt, wird nach ST-08 die einzige Fassung |

### S-09 Ladezustände

**Befund.** `LoadingBlock` zeigt Skelette und trägt den Satz als `visually-hidden`. Alle Werte
folgen bereits derselben Form: „Todos werden geladen", „Anhänge werden geladen",
„Tokenzustand wird geladen". `RefreshHint` sagt „Wird aktualisiert …". Nichts zu tun.

**Regel S-09.** „&lt;Gegenstand&gt; wird geladen." Nichts sonst. Kein Trostsatz, keine
Zeitangabe, kein „Bitte warten". Der Satz ist **nur** zugänglicher Name; sichtbar ist das
Skelett.

### S-10 Fehlermeldungen im Seitenfluss (`InlineMessage tone="danger"`)

**Befund.** Durchgängig richtig gebaut: Titel nennt, was nicht ging, Rumpf ist der Satz des
Dienstes **unverändert**, und daneben steht ein Wiederherstellungsweg (`parts.tsx:137-152`,
Abschnitt 15). `ShellStatus.tsx:313-316` hält ausdrücklich fest, warum die Meldung der Hülle
nicht zu „Ein Fehler ist aufgetreten (Code 3)" eingedampft wird. Das ist keine Länge, die man
kürzt.

**Hier stand bis zum 2026-09-06 die Regel über die Absage einer gegenstandslosen Handlung** — unter
der Nummer **S-15** und mitten zwischen dem Befund und der Regel von S-10. Sie steht jetzt als
**S-12a** bei S-12, wohin sie gehört: Sie gilt der **Absage in einem Dialog**, nicht der
Fehlermeldung im Seitenfluß. Der Nachtrag T-228 hat sie dort gefunden, nicht dort gesucht — das
war die eigentliche Ansteckung aus Z-72, und sie war schlimmer als die falsche Nummer: **eine
Regel, die den Befund einer anderen Regel von deren Regel trennt**, wird beim Lesen der einen
mitgelesen und beim Suchen der anderen nicht gefunden (E-092).

**Regel S-10.**
- **Titel:** was nicht ging, ohne das Wort „Fehler", ohne Code, höchstens sechs Wörter.
- **Rumpf:** der Satz des Dienstes, **wörtlich**. Kein zweiter Satz von uns daneben.
- **Genau ein** Wiederherstellungsweg, als Knopf. Eine Fehlermeldung ohne ihn ist eine Sackgasse.
- Kein Trostsatz („Das kann passieren"), keine Entschuldigung.

### S-11 Dauerhafte Erklärkästen (`InlineMessage tone="info" | "warning"` im Seitenfluss)

**Befund — die Textwände.** Sieben Kästen stehen dauerhaft im Fluss, unabhängig vom Zustand:

| Ort | Zeilen | Urteil |
|---|---|---|
| `StatusSettings.tsx:283-305` „Der Status ist nicht die Kanban-Spalte" | zwei Absätze + zwei Navigationsknöpfe | **D + V** — ST-05 |
| `StatusSettings.tsx:372-385` „Zwei Dinge, bevor Sie etwas ändern" | zwei Aufzählungspunkte | **D + V** — ST-08 |
| `StatusSettings.tsx:777` „Das Umbenennen wirkt überall sofort" | ein Satz | **F** — bleibt |
| `PoolFormDialog.tsx:790-795` „Nichts wird gespeichert außer der Regel" | vier Sätze | **D** zu `RULE_WHAT_MOVES_A_CARD` und zu `PoolFormDialog.tsx:437` — ST-05 |
| `SettingsScreen.tsx:495` „Gerundet wird die Tagesgruppe, nicht die einzelne Buchung" | ein Satz | **A** (E-008, E-025) — bleibt |
| `ExportScreen.tsx:683-686` „Gezeigt und geschrieben wird der gespeicherte Stand" | zwei Sätze | zweiter Satz **V** — Umbau UM-05 |
| `BoardScreen.tsx` Musterseiten-Gegenstück `showcase/BoardSection.tsx:294` | — | Musterseite, nicht Produkt |

**Vorbildlich zustandsgebunden und deshalb nicht in dieser Liste:**
`PoolFormDialog.tsx:569` (nur bei geändertem Modus), `:735` (nur bei wirkungslosem Ausschluss),
`:780` (nur ohne Bedingung), `StatusSettings.tsx:312` (nur bei Zählfehler),
`ExportDirectoryField`/`WorkstationFacts` (nur beim jeweiligen Befund).

**Regel S-11.**
- **Ein Erklärkasten steht nie dauerhaft.** Er erscheint in dem Zustand, in dem sein Inhalt
  gilt, und verschwindet mit ihm (T1). Ein Kasten, für den sich kein solcher Zustand angeben
  lässt, hat keinen Anlass und fällt.
- Höchstens **drei Sätze**. Danach ist es Handbuch (T3).
- Ein Erklärkasten enthält **keine Navigationsknöpfe** in andere Ansichten. Ein Bedienweg gehört
  an die Bedienstelle, nicht in eine Erklärung.

### S-12 Dialoge: Titel, Beschreibung, Folge, Absage, Bestätigungshaken

**Befund.** Die durchdachteste Sorte im Bestand. `ConfirmDialog` trennt seit T-118 sauber
zwischen `description` (was der Dialog tut), `consequence` (was danach anders ist, steht beim
Öffnen da) und `refusal` (die Absage des Dienstes, tritt **an die Stelle** der Vorwarnung, in
einer dauerhaft vorhandenen Live-Region — B-5, SC 4.1.3). `acknowledgeLabel` ist nach
Designsystem 8 auf zwei Fälle beschränkt und wird nirgends verwässert.

Die langen Sätze dieser Sorte sind fast ausnahmslos **F**, **A** oder **B**. Sie gehören auf die
Sperrliste, nicht auf die Streichliste.

**Regel S-12.**
- **Titel:** Frage nur, wenn wirklich gefragt wird; sonst Aussage. Höchstens sechs Wörter.
  Wechselt der Dialog nach einer Absage die Rolle, wechselt der Titel mit
  (`StatusSettings.tsx:407` ist das Vorbild).
- **`description`:** was die Bestätigung tut, **ein** Satz, mit dem betroffenen Namen darin.
- **`consequence`:** was danach anders ist und ob es umkehrbar ist. **Keine Längengrenze.**
- **`refusal`:** der Grund des Dienstes, wörtlich, ohne unseren Zusatz.
- **`acknowledgeLabel`:** Satz in der ersten Person, höchstens 100 Zeichen. Nur beim
  Zurücksetzen eines Exportstatus, beim Exportordner mit Befund und beim Tokenwechsel. Ein
  vierter Einsatz entwertet die drei (Designsystem 8, `AttachmentOpenDialog.tsx:55-62`).
- **Nie ein „Nicht mehr fragen".** `AttachmentOpenDialog.tsx:55-62` begründet das für R-21; die
  Begründung gilt allgemein.

**Regel S-12a — die Absage einer Handlung ohne Gegenstand (Nachtrag T-228).** Antwortet ein Dialog
auf einen Absendeversuch, der **nichts zu tun** hat — nicht weil eine Eingabe falsch ist, sondern
weil die Handlung keinen Gegenstand hat —, dann gilt:

- **Form:** `„Es gibt nichts zu 〈Wort des Absendeknopfes〉. " + 〈der vorhandene Hinweis zu dieser
  Sperre〉`. Sie nennt in den Worten des Knopfes, daß nichts geschehen ist, behauptet **keinen**
  Fehler, **keine** Leere und **keinen** Verstoß, tadelt nicht und läßt den Weg hinaus stehen.
- **Kanal:** die **Statusfläche des Dialogs**, nicht der Fehlerkanal des Feldes. Kein
  `aria-invalid`, keine Fehlerfarbe am Feld — der Wert ist gültig (E-093 Punkt 5).
- **Länge:** keine eigene Zahl. Sie ergibt sich: ein Satz nach S-07 plus ein Feldhinweis nach S-05.
  **P-1 gilt ihr nicht** — P-1 ist die Form der **Feldmeldung**.
- **Sie ist ein B** und damit nach E-078 nicht streichbar.
- **Sie gilt nicht** für einen Sperrgrund, bei dem etwas zu tun ist — der gehört in die
  Feldmeldung (P-3, P-8, P-9).

Herleitung, Wortlaut, verworfene Fassungen und die Akzeptanzkriterien stehen in **13.3**, die
Abgrenzung zum leeren Pflichtfeld in **13.8**. **Diese Regel hieß bis zum 2026-09-06 „S-15"** —
eine Nummer, die im Bestandsteil bereits vergeben ist (T-221 Z-72).

### S-13 Meldungen (Toast)

**Befund.** Titel durchgängig gut: „Todo gelöscht.", „Export geschrieben.", „Anhang
hinzugefügt.", `reactivationTitle` „Timer gestartet. „X" ist wieder offen." Die Rümpfe wachsen:
`TodoListScreen.tsx:311-316` setzt bis zu drei Sätze zusammen (Ausblendung + Status + Bewegungssatz
aus der Domäne).

**Regel S-13.**
- **Titel:** die vollzogene Handlung, mit Punkt, höchstens sechs Wörter. Der Rückweg hat ein
  **eigenes** Wort (`POOL_PLACEMENT_RESTORED_TITLE` ist das Vorbild — W-14 aus R-2a).
- **Rumpf: höchstens zwei Sätze.** Kommt ein Bewegungssatz aus der Domäne dazu, ist er der
  zweite; unsere eigene Auskunft schrumpft dann auf einen.
- Ein **Rückweg** ersetzt eine Erklärung. Wo `action` steht, fällt der erklärende Satz.
- Der Rumpf wiederholt den Titel nicht.

**Regel S-13a — Anlaß und Lage (Nachtrag T-211).** Nennt ein Titel neben der Handlung eine
**Lage**, hat er die Form `〈Anlaß〉 — 〈Lage〉.` Der **Anlaß** gehört der Fläche und fällt unter die
sechs Wörter oben. Die **Lage** gehört dem Zustand: Sie heißt an **jeder** Fläche gleich, ist
zitiert statt formuliert und trägt deshalb keine eigene Längengrenze. Gibt es sie im Bestand schon,
weicht die neue Fläche ihr. Eine Verknüpfung („aber") gehört zum Anlaß. Herleitung, Meßstand und
die entsprechende Teilung im **Rumpf** stehen in **12.9**.

### S-14 Sperr- und Startmeldungen der Hülle

**Befund.** `ShellStatus.tsx` trägt die längsten Texte des Produkts: `QuitFailureNotice`
(216-242), `StartupProblemNotice` (318-364), `SyncFolderNotice` (393-435),
`ServiceStoppedPanel` (455-512), `UserNameBlockedPanel` (620-691). Alle fünf sind **B** oder
**A**, alle fünf erscheinen ausschließlich im Fehlerzustand, und in allen fünf ist die Länge
gemessen begründet (O-AF, F-15, O-AJ, B-2.4, B-4.3 Punkt 5, R-13, B-7.1). **Diese Sorte wird
nicht angefasst.**

**Regel S-14.** Unverändert. Der Rahmen ist unser, die Aufzählung kommt aus der Hülle und wird
**nicht** zusammengefasst. Kein „Wenden Sie sich an Ihre Systembetreuung" als **einziger** Weg
(F-15). Der Benutzername steht in keiner dieser Meldungen.

### S-15 Zugängliche Namen (`aria-label`, `visually-hidden`)

**Befund.** Sorgfältig gebaut und durchgängig nach demselben Muster: Handlung + Gegenstand
(„Timer für „X" starten", „Buchung „X" auswählen", „Filter Tag „X" entfernen"). Der Gegenstand
geht durch `foreignText`/`quotedName` (E-063). `DeadlineFlag.tsx:117` nennt Zustand **und**
absolutes Datum, weil „Überfällig" allein zum Planen nicht reicht.

Zwei Punkte:
1. `Primitives.tsx:322` „Meldung **schliessen**" — Rechtschreibfehler in einem zugänglichen
   Namen.
2. `Tag.tsx:109-116` trägt für dieselbe Marke **zwei** Texte: ein `title` und einen
   `visually-hidden`-Text, bei „neu angelegt" mit **verschiedenem Wortlaut**
   („Dieses Tag wird beim Speichern angelegt" gegen „wird neu angelegt").

**Regel S-15.**
- **Handlung + Gegenstand.** Nie der Elementtyp („Knopf", „Schaltfläche") — den liefert die
  Rolle.
- Der zugängliche Name enthält die sichtbare Beschriftung **wörtlich** und am Anfang
  (SC 2.5.3 Label in Name).
- Ein Element trägt **einen** Zusatztext, nicht zwei. `title` **und** `visually-hidden` an
  derselben Marke ist eine Verdopplung mit zwei Wortlauten.
- **Vertraglich (E-076 Punkt 3).** 286 `getByRole`-Zugriffe. Jede Änderung hier ist eine
  Änderung an Prüffällen und geht nur zusammen mit unit-tester und e2e-tester. **Die Zahl altert
  schneller als dieses Papier — Stand und Meßvorbehalt in 1.3; die Aussage trägt unabhängig von
  ihr.**

**Diese Nummer bleibt bei dieser Regel (Nachtrag T-228).** T-211 hat unter „S-15" eine zweite,
gänzlich andere Regel angelegt; sie heißt seit T-228 **S-12a** und steht bei ihrer Textsorte
(S-12). Die vertragliche S-15 ist die ältere und die, an der eine Verwechslung Prüffälle kostet —
deshalb weicht nicht sie, sondern die neue (T-221 **Z-72**).

**Regel S-15a — die Stelle des Zeilenbezugs (Nachtrag T-222).** Steht ein Bedienelement oder ein
Wert in einer **Wiederholung** — einer Liste, einer Tabelle, einer Zeile —, braucht sein
zugänglicher Name den Bezug auf die Zeile. Wo dieser Bezug steht, entscheidet **nicht** der
Geschmack, sondern die sichtbare Beschriftung:

| Fall | Form | Beispiel aus derselben Buchungszeile |
|---|---|---|
| Das Element trägt **keinen** sichtbaren Text (ein Wert, ein Kontrollkästchen, ein Sinnbild) | Bezug **davor**, mit **Doppelpunkt** | „Ungerundete Dauer: 1 h 20 min", „Herkunft: Timer", „In der Tagesgruppe berücksichtigen: 09:00–10:20" |
| Das Element trägt **sichtbaren** Text | Bezug **dahinter**, mit **Komma** | „Leistung nachtragen, Buchung 09:00–10:20" |

**Der Grund für die zweite Zeile ist SC 2.5.3 und nicht Wohlklang.** Ein vorangestellter Bezug
schöbe sich zwischen den Anfang des Namens und die sichtbare Beschriftung; diese Regel verlangt
oben, daß die Beschriftung **wörtlich und am Anfang** steht. Beide Formen stehen heute in derselben
Zeile nebeneinander (`ExportGroups.tsx`), und das ist kein Widerspruch, sondern genau diese
Unterscheidung.

**Und der Bezug wird nicht neu formuliert, sondern abgeschrieben.** Er nennt den Wert, der
**sichtbar in derselben Zeile** steht, zeichengleich und aus derselben Quelle — nicht eine zweite
Formatierung desselben Zeitpunkts. Zwei Formatierungen eines Wertes sind zwei Wahrheiten, sobald
eine von beiden gepflegt wird; das ist derselbe Satz wie in 12.4 über den Stoppdialog, eine Ebene
tiefer.

### S-16 Titelattribute (native Tooltips)

**Befund.** 26 Vorkommen, zwei Sorten:
- **Sinnvoll (11):** ein abgeschnittener Wert wird vollständig sichtbar —
  `BookingTable.tsx:271`, `ExportGroups.tsx:225, 293`, `Attachments.tsx:266`,
  `WorkstationFacts.tsx:225`, `ExportAudit.tsx:159`, `ExportScreen.tsx:700, 719, 980`.
- **Überflüssig (13):** eine Erklärung, die die sichtbare Beschriftung wiederholt —
  `Navigation.tsx:80` (acht Punkte), `parts.tsx:104` (drei Bereiche), `Tag.tsx:109, 115`,
  `ExportScreen.tsx:1009`.

Ein natives Titelattribut ist **nicht** mit der Tastatur erreichbar, **nicht** abweisbar und
**nicht** überfahrbar — es erfüllt SC 1.4.13 nicht und ist auf Berührungsgeräten unsichtbar.
Als Erklärungsträger taugt es nicht.

**Regel S-16.**
- `title` **nur** zum Sichtbarmachen eines abgeschnittenen Wertes. Nie als Erklärung, nie als
  Ersatz für eine Beschriftung, nie als Träger einer Auskunft, die man braucht.
- Wo `title` eine Auskunft trägt, die zählt, gehört sie sichtbar in den Fluss oder sie fällt.

### S-17 Etiketten und Marken

**Befund.** `DONE_FLAG_LABEL` („Offen", „Erledigt", „Erledigt aufgehoben"), `DeadlineFlag`
(„Überfällig", „Heute fällig", nur Datum), `ExportStatus` (vier Ausprägungen),
`POOL_PLACEMENT_SHORT`. Alle ein bis drei Wörter. `DeadlineFlag` lässt für „später fällig"
das Zustandswort bewusst **weg** — vorbildliche Zurückhaltung (A-19.5, T-144 Abschnitt 8.2).

Die **Beschreibungen** dahinter sind länger: `ExportStatus.tsx:128, 136, 144` tragen bis zu drei
Sätze. Sie sind **F/A** (E-032, E-047, E-050) und bleiben; zu prüfen ist nur, **wo** sie
erscheinen.

**Regel S-17.**
- Eine Marke trägt **ein bis drei Wörter**, nie einen Satz.
- Eine Marke erscheint **nicht**, wenn ihr Zustand die Abwesenheit ist. „Ohne Frist" ist keine
  Marke; kein Symbol, kein Wort, kein Platzhalter.
- Fünf von sechs Merkmalen einer Marke tragen ohne Farbe (SC 1.4.1) — Wortlaut, Symbol, Füllung,
  Schnitt, Kontur. Wer den Wortlaut kürzt, nimmt eines davon weg.

### S-18 Beratungstexte über Ablageorte

**Befund.** `lib/exportDirectoryAdvice.ts` und `lib/databaseLocationAdvice.ts` tragen die
längsten Einzelabsätze des Produkts — bis zu 480 Zeichen. Sie sind **B** (sie begründen eine
Warnung oder eine Absage), sie sind **zustandsgebunden** (sie erscheinen nur beim jeweiligen
Befund) und sie tragen Anforderungen von security-checker (B-5.1, B-5.2, B-5.3, R-11, R-13,
E-018).

**Regel S-18.** Unverändert. Der Titel des Befundes ist kurz; der Rumpf darf lang sein, weil er
nur erscheint, wenn er zutrifft. Dies ist das **Muster**, nach dem die Umbauliste arbeitet.

### S-19 Kennungen im Oberflächentext

**Befund — eine Sorte für sich, weil sie quer zu allen anderen liegt.** An fünf Stellen liest
der Benutzer eine interne Kennung:

- `TagsScreen.tsx:79` „… oder beides (E-054)."
- `TagsScreen.tsx:612` „… an beiden Stellen (E-054)."
- `TodoDetailScreen.tsx:580` „… und Exportstatus (E-055)."
- `ExportAuditScreen.tsx:174` „Es ist die Maßnahme gegen R-10 …"
- `labels.ts:438` „… im Anzeigezustand „Nicht abgerechnet" (E-047) …"

**Regel S-19.** In keinem Oberflächentext steht eine Entscheidungs-, Risiko-, Anforderungs- oder
Befundnummer. Sie gehört in den Quelltextkommentar, wo sie bereits steht. Für den Benutzer ist
sie Zeichenrauschen; sie kostet Platz und verspricht eine Nachschlagemöglichkeit, die es nicht
gibt.

**Nachtrag T-228 — die fünf sind erledigt, aber es sind nicht null.** T-203 hat gemessen, daß die
fünf oben genannten Stellen gefallen sind (ST-03 ausgeführt), und daraus „null im Produkt"
geschlossen. **Gemessen am 2026-09-06 stehen mindestens drei weitere:**

| Ort | Wortlaut (Anfang) | Sorte |
|---|---|---|
| `components/ExportDirectoryField.tsx`, `TRAIT_TEXT.unc` | „Der Pfad ist in UNC-Schreibweise geschrieben. … ohne halbe Datei **(A-8.8)**." | sichtbarer Rumpf einer Meldung |
| `components/ExportDirectoryField.tsx`, `TRAIT_TEXT.sync_folder` | „Sein Client meldet ihn selbst so … lesbare Kundennotizen **(A-8.9)**; …" | sichtbarer Rumpf einer Meldung |
| `screens/TemplatesScreen.tsx` | „… Der interne Vermerk eines Todos geht in keinen Export **(A-7.2)**. Melden Sie das bitte — …" | sichtbarer Rumpf einer Meldung |

**Sie sind aufgenommen und nicht beauftragt.** Alle drei sind **B** (sie begründen eine Warnung oder
eine Absage) und stehen zustandsgebunden; **es fällt hier nichts als der Klammerausdruck**, und auch
der erst in einem Auftrag, der den heutigen Wortlaut vorher in `tests/**` sucht (E-087 Punkt 1,
1.3 Punkt 3). Die zwei in `ExportDirectoryField.tsx` sind zudem Geschwistertexte zu **S-18** und
tragen Anforderungen von security-checker — wer sie anfaßt, faßt einen Beratungstext an.

**Und der Befund über die Messung ist der wichtigere:** Diese drei sind der Zählung entgangen, weil
über die **bekannten** Kennungen gesucht wurde statt über die **Form** einer Kennung (1.3). Eine
Regel, die nur ihre eigenen Beispiele prüft, meldet Vollzug, solange niemand ein neues erfindet.

---

## 5. Die Sperrliste

**Kein Satz auf dieser Liste fällt oder wird gekürzt, ohne dass der Prüfer zustimmt, der ihn
verlangt hat** (E-078 Punkt 3). Wer eine neue Fassung will, legt sie **diesem** Prüfer vor.

| Nr. | Ort | Wortlaut (Anfang) | Prüfpunkt | Warum |
|---|---|---|---|---|
| SP-01 | `AttachmentOpenDialog.tsx:211-215` | „Takt übergibt diese Datei an die Standardanwendung des Systems — dasselbe wie ein Doppelklick …" | **R-21**, E-072 Punkt 3, Auflage **A-A-6** Eigenschaft 3, A-19.18 | Nennt die **Wirkung** statt der Handlung. Ein kurzer Satz verschleiert hier einen Programmstart. |
| SP-02 | `AttachmentOpenDialog.tsx:217-241` | „Diese Datei wird dabei ausgeführt." + Dateiname + **vollständiger Pfad** | **R-21**, A-A-6 Eigenschaften 1 und 2 | Der Pfad wird **nie** gekürzt. Beide Teile gehen durch `foreignText` (E-063). |
| SP-03 | `TodoListScreen.tsx:504` | „Ein Todo ohne Frist steht in beiden Richtungen am Ende. Es hat keinen Wert, keinen frühesten und keinen spätesten." | **E-074 Punkt 2**, A-19.20 | **Abwesenheit.** Ohne den Satz hält der Benutzer die Sortierung für kaputt. |
| SP-04 | `TodoFormDialog.tsx:227` | „Ein Tag, keine Uhrzeit. Optional — leer lassen heißt: keine Frist. Sie ändert nichts an Pools, Spalten, Buchungen oder Export." | **V-03/V-04** (T-154, sinngleicher Satz im Add-in), **E-074 Punkt 4**, A-19.1, A-19.7, E-070 Punkt 4 | **Abwesenheit.** E-078 nennt diesen Satz namentlich als Beispiel. |
| SP-05 | `TodoDetailScreen.tsx:421` und `:429-432` | „… sie steht in keinem Export." / „Keine Frist gesetzt. Dieses Todo ist deshalb weder überfällig noch heute fällig — es hat schlicht keinen dieser Zustände." | **A-19.5**, A-19.8, E-070 Punkt 4 | **Abwesenheit**, wörtlich aus A-19.5. |
| SP-06 | `ConfirmDialog.tsx:37-57, 134-158` — die **Bauart** von `refusal` samt dauerhaft leerer Live-Region, und jeder Text, der darin landet | **B-5** (T-116), **SC 4.1.3** | Eine Region, die erst mit ihrem Inhalt in den Baum kommt, wird nicht angesagt. Gilt gleichlautend in `AttachmentOpenDialog.tsx:248`, `UpdateDialog.tsx:155`, `ShellStatus.tsx:271`. |
| SP-07 | `BookingsScreen.tsx:534, 538`; `BookingDialogs.tsx:320, 325` | „Dieselbe Arbeitszeit geht beim nächsten Export erneut in die Abrechnung." + „Mir ist klar, dass diese Zeiten dadurch ein zweites Mal abgerechnet werden können." | **E-012**, **R-10** | **Folge** einer Handlung, aus der eine Doppelabrechnung entstehen kann. Der einzige Ort, an dem sie steht. |
| SP-08 | `labels.ts:519` `BILLING_NOTE_MAY_BE_EMPTY` | „Die Leistung darf leer bleiben. Dann ist die Buchung erfasst, aber die Tagesgruppe dieses Todos geht ohne Text nicht in den Export …" | **B-4** (T-116), **E-034** | **Folge**. Steht an **beiden** Buchungsflächen; die zweite kam erst mit T-118 dazu, weil sie fehlte. |
| SP-09 | `NoteField.tsx:46-59` — Banner, Marke und `help` beider Feldarten | „Verlässt Takt · steht in der Abrechnung" / „Bleibt in Takt. Wird nie exportiert — auch nicht über eine eigene Exportvorlage." | **E-016**, **R-06**, **R-08** | **Abwesenheit** plus der wahrscheinlichste Bedienfehler des Produkts. Banner und Marke sind das Paar Sicht/Gehör und gehören zusammen. |
| SP-10 | `SettingsScreen.tsx:524, 527` | „Die Exportdatei enthält lesbare Kundennotizen. Base64 ist eine Kodierung, keine Verschlüsselung — wer die Datei öffnen kann, kann sie lesen." | **B-5.2**, B-6.1, security-checker | **Folge**, und sie steht so auch in `CLAUDE.md`. |
| SP-11 | `ShellStatus.tsx:216-242, 318-364, 393-435, 455-512, 620-691` | fünf Sperr- und Startmeldungen | **O-AF**, **F-15**, **O-AJ**, **B-2.4**, **B-4.3 Punkt 5**, **R-13**, **B-7.1**, E-036, SC 2.1.2 | **Absage** und **Abwesenheit**. Erscheinen nur im Fehlerzustand. Der Benutzername steht in keiner davon — das ist der Punkt. |
| SP-12 | `UpdateDialog.tsx:129-131` und `:164-167` | „Takt lädt nichts herunter und installiert nichts. „Installieren" öffnet die Release-Seite …" / „„Überspringen" gilt genau dieser Fassung — eine spätere meldet sich wieder." | **A-18.9**, **A-18.10**, **A-18.11**, E-064, **R-20** | **Abwesenheit** gegen die Erwartung, die das Wort „Installieren" in jeder anderen Anwendung weckt. |
| SP-13 | `Attachments.tsx:109-140` — die neun Absagegründe | „Diese Adresse lässt sich nicht öffnen: Takt öffnet nur „http" und „https" …" | **R-22**, A-19.16, A-19.17, E-072 | **Absage mit Begründung.** Jeder Grund nennt, **warum** — sonst steht der Benutzer vor einem Anhang, der nichts tut. |
| SP-14 | `lib/exportDirectoryAdvice.ts`, `lib/databaseLocationAdvice.ts` — alle `body`- und `remedy`-Texte | „Alles, was Takt hier ablegt, wird kurz darauf hochgeladen …" | **B-5.1**, **B-5.2**, **B-5.3**, **R-11**, **R-13**, E-018, security-checker | **Absage/Folge**, zustandsgebunden. Muster für Abschnitt 8. |
| SP-15 | `labels.ts:438` und `:457` | „Ausgebuchte Buchungen zählen mit …" / „„Abgerechnet" meint den Exportstatus der Buchungen …" | **S-1** (R-2), **W-7** (R-2a), E-047, E-050, E-059 | **Folge/Abwesenheit.** Zwei Wörter, die sich zu widersprechen scheinen und beide richtig sind. **Nachtrag T-180:** Ort und Umfang sind **nicht mehr verhandelbar** — UM-02 ist mit E-081 entfallen, die Bauart steht. Es fällt allein die Klammer „(E-047)" nach ST-03. |
| SP-16 | `labels.ts:278-280` `reactivationTitle` und `TodoDetailScreen.tsx:401` | „Timer gestartet. „X" ist wieder offen." / „Der Timerstart hat das Kennzeichen aufgehoben — Takt hat das getan, nicht Sie." | **A-2.5**, **I-05**, T-005n Abschnitt 1 Regel 1 | **Folge** einer Änderung, die die Anwendung ohne Auftrag vorgenommen hat. Pflichtflow „Timer auf erledigtem Todo". |
| SP-17 | `ExportScreen.tsx:1044` | „Die Datei wird geschrieben und jede enthaltene Buchung als exportiert markiert — beides zusammen oder gar nichts. Danach sind diese Buchungen gesperrt …" | **A-8.6**, E-020, E-032 | **Folge.** Pflichtflow „Export einschließlich Statuswechsel". |
| SP-18 | `errorText.ts:166-178` „Betroffen sind die Regeln „Ost", „Nord" …" und `TagsScreen.tsx:496-499` | | **W-11** (R-2a), T-097, T-107, T-110, E-063 | **Absage mit Begründung.** Eine Sperre, aus der man nicht herausfindet, ist nur halb umkehrbar. |
| SP-19 | `StatusSettings.tsx:519-531` (die drei Sätze) **und `:568-596` (die sichtbare Begründungsfläche `status-admin__blocked`, in der sie stehen)** | „Das ist der Standard für neue Todos. Bestimmen Sie zuerst einen anderen …" | **SC 4.1.2**, **SC 1.3.1**, A-5.4, **T-172 Punkt 2** | **Absage mit Begründung.** Träger ist die **sichtbare Fläche**, nicht der gesperrte Knopf — gemessen. Sie zu entfernen nimmt die einzige erreichbare Quelle weg. Berichtigt in T-180, siehe unten. |
| SP-20 | `App.tsx:226-236` `NoShellNotice` | „Diese Seite ist die Oberfläche von Takt. Sie spricht mit einem lokalen Dienst …" | **E-001**, E-036, T-057 | **Abwesenheit.** Erklärt, warum eine sichtbare Anwendung nichts tut. Der Kommentar bei :237-243 hält fest, warum dort auch kein Knopf steht. |
| SP-21 | `GlobalSearch.tsx:244` | „… Gesucht wird in Titeln, Call-Nummern und Leistungstexten — nicht im Vermerk." | **E-075 Punkt 2**, **C-22** (Wiedervorlage), E-038 | **Abwesenheit**, und sie ist derzeit die **einzige wahre** Aussage über den Umfang der Suche. Sie fällt frühestens, wenn die Suche den Vermerk trifft — und dann zusammen mit der Wiedervorlage von C-22. |
| **SP-22** | `docs/benutzerhandbuch.md`, „Mit dem Kanban-Board arbeiten" › Unterabschnitt **„Herkunft der Spalten"** — **fremde Hoheit: documenter** | „Vor der ersten Veröffentlichung wies eine interne Reihenfolge jeder Karte ihren Platz in einer Spalte zu. …" bis „… unabhängig von der Spalte, in der die zugehörige Karte gerade steht." | **UM-08**, **T-200 Z-54**, E-054, A-5.4, **E-081 Punkt 4** | **Alleinträger nach Fall** — neue Sorte, siehe 5.2. Zwei der vier Punkte der Karte „Was sich geändert hat" (`BoardScreen.tsx`) stehen nach ihrem Fall **nur noch hier**: „Ihre Todos sind vollzählig da" und „Der Status bleibt". **Die Karte ist am 2026-09-06 mit T-209 gefallen** — Pflichtangabe 2 aus 5.2, nachgetragen von frontend-dev im selben Auftrag wie die Streichung (E-081 Punkt 4). **Gegengemessen T-211, 2026-09-06:** Am Baum steht die Karte nicht mehr; `BoardScreen.tsx` und `app.css` führen ihren Fall im Kommentar, und `board-setup__actions` ist mit ihr gefallen (Auflage 1 aus Z-54). Damit ist der Eintrag nach seiner eigenen Regel vollständig und keine Behauptung mehr. **Gesperrt ist nach Pflichtangabe 3 die Aussage, nicht der Wortlaut** — der Zitatanfang in der dritten Spalte ist hier Fundhilfe, nicht Anker. Aufgenommen **2026-09-06**. |

### 5.1 Berichtigung zu SP-19 (Nachtrag T-180, O-EQ)

**Was in der ersten Fassung falsch stand.** SP-19 hieß dort „die drei `disabledReason`-Sätze" und
begründete die Sperre mit „Absage mit Begründung **an einem gesperrten Bedienelement**". Beides ist
unpräzise, und die Unpräzision ist die gefährliche Sorte: Sie legt nahe, der Träger der Auskunft
sei der Knopf, und der sichtbare Text daneben sei seine Verdopplung — also ein Kandidat für die
Streichliste. Genau umgekehrt ist es.

**Was gemessen wurde** (T-172 Punkt 2, visual-qa, gegen die laufende Oberfläche):

1. Der Löschknopf trägt echtes, natives `disabled` (`Primitives.tsx:51`), nicht `aria-disabled`.
2. Chromium hält Name **und** Beschreibung im Bedienungshilfen-Baum vor; der Knoten ist nicht
   entfernt. Ein linear ablaufender Durchgang **könnte** sie also erreichen.
3. **Über den Tabulator ist der Knopf nachweislich unerreichbar.** Gemessen: von „Umbenennen"
   springt ein Tab auf „Diese 3 Todos anzeigen" (den Knopf **in** der Begründungsfläche) und der
   zweite bereits in die nächste Zeile. Der gesperrte Knopf kommt in der Reihenfolge nicht vor,
   sein `aria-describedby` wird also nie in dieser Eigenschaft angesagt.
4. Die Begründungsfläche daneben ist gewöhnlicher, sichtbarer Fließtext (`display: flex`, kein
   `aria-hidden`), steht im DOM **vor** dem Knopf und enthält selbst ein per Tab erreichbares
   Element.

**Die Grenze der Messung, und sie gehört dazu.** In dieser Umgebung war **kein Vorleseprogramm**
verfügbar (weder Orca noch NVDA). Gemessen sind der Bedienungshilfen-Baum und die Erreichbarkeit
über die Tastatur — also die zwei Voraussetzungen einer Ansage, **nicht die Aussprache**. Der Satz
„eine Vorlesehilfe erreicht ihn nicht" wäre eine Behauptung; der Satz „ein Tab-navigierender
Benutzer erreicht ihn nicht" ist eine Messung. Dieses Papier stützt sich nur auf den zweiten. Der
Nachweis mit echtem Vorleseprogramm unter Windows steht aus (T-172 Offene Frage 2) und ändert an
der Richtung nichts: Er kann die Sperre bestätigen, nicht aufheben.

**Was daraus folgt, und zwar dauerhaft.**

- Die sichtbare Fläche `status-admin__blocked` (`:568-596`) ist **der** Träger des Sperrgrundes,
  nicht seine Zweitfassung. Sie steht auf der Sperrliste.
- **Verboten ist der Rückbau**, nicht der Bau: den sichtbaren Text zu entfernen und die Auskunft
  allein über `aria-describedby` an einem weiterhin nativ gesperrten Knopf zu führen. Das wäre
  formal ein Name-Rolle-Wert nach SC 4.1.2 und praktisch eine stumme Tür.
- Der `aria-describedby` am Knopf **bleibt trotzdem**. Er ist die Zugabe für den Durchgang, der
  die Seite linear abliest, und E-081 Punkt 2 sagt, wogegen Nachtrag 8 zu E-078 gerichtet ist:
  gegen **Verluste**, nicht gegen **Zugaben**. Er wird nur nicht mehr als der Weg gezählt.
- Der Knopfname trägt die Sperre weiterhin selbst („…löschen — derzeit nicht möglich"). Wer die
  Bedienelemente einer Seite auflistet, liest damit wenigstens **daß** es nicht geht; **warum**,
  sagt die Fläche. Diese Arbeitsteilung ist gemessen tragfähig und bleibt.

### 5.2 Eine neue Sorte auf der Sperrliste: **Alleinträger nach Fall** (Nachtrag T-203, O-IA)

**Der Anlaß.** documenter hat in T-201 den Absatz „Herkunft der Spalten" geschrieben,
spec-ux-reviewer hat ihn in T-200 freigegeben (Z-54), und damit darf die Karte „Was sich geändert
hat" fallen — UM-08 ist erfüllt. **Danach ist das Handbuch der einzige Träger** zweier Auskünfte,
die vorher an zwei Stellen standen. Ohne Eintrag nimmt der nächste Handbuchdurchgang den Absatz
als überflüssige Geschichtserzählung wieder heraus, und zwar **zu Recht** nach dem Raster in
Abschnitt 2 — er sähe aus wie **V** (auf Vorrat) und wie **S** (erklärt, was ohnehin so ist).

**Warum das keine gewöhnliche Sperrlistenzeile ist.** SP-01 bis SP-21 stehen dort, weil **ein
Prüfer den Satz verlangt hat**; ihr Grund steht im Satz selbst oder unmittelbar daneben. SP-22
steht dort aus dem umgekehrten Grund: Der Satz war **streichbar, weil er doppelt stand** — und ist
es in dem Augenblick nicht mehr, in dem die zweite Fassung fällt. **Es ist die Umkehrung von D.**
Diese Bewegung hat T-195 als eigene Fehlerart beschrieben: Eine Welle halbiert eine Freigabe, und
danach sehen beide Listen vollständig aus.

**Die Sorte, als Regel.**

> **T3-A — Alleinträger nach Fall.** Wird eine Aussage von zwei Trägern auf einen zurückgeführt,
> kommt der verbliebene Träger auf die Sperrliste. Der Eintrag entsteht **mit der Freigabe der
> Streichung**, nicht mit ihrem Bau.

**Drei Pflichtangaben, die kein bisheriger Eintrag führt.** Ohne sie ist ein Eintrag dieser Sorte
nicht prüfbar:

1. **Die Hoheit der Datei.** SP-01 bis SP-21 zeigen alle in `apps/web/src`; wer dort einen
   Textdurchgang fährt, liest diese Liste. Ein Handbuchdurchgang liest sie heute **nicht**. Ein
   Eintrag dieser Sorte nennt deshalb den Hoheitsinhaber ausdrücklich, und eine neue Fassung wird
   **zwei** Leuten vorgelegt: dem Prüfer, der den Fall freigegeben hat, **und** dem
   Hoheitsinhaber. Bei SP-22 sind das spec-ux-reviewer (T-200) und documenter (T-201).
2. **Die gefallene Fläche und das Datum ihres Falls.** Bei SP-04 steht die Anforderung im Satz;
   wer ihn liest, sieht, woran er hängt. Bei SP-22 steht **nichts** dabei — der Absatz sieht aus
   wie Geschichte. Erst die Angabe „weil `BoardScreen.tsx` › Karte „Was sich geändert hat" am
   〈Datum〉 gefallen ist" macht ihn prüfbar. **Fehlt sie, ist der Eintrag eine Behauptung.**
3. **Die Aussage, nicht der Wortlaut.** Gesperrt ist bei dieser Sorte, **was** dort steht, nicht
   **wie**. Der Wortlaut des Handbuchs darf sich ändern, gekürzt und umgestellt werden — solange
   die zwei Auskünfte darin bleiben: *kein Todo ging verloren oder wurde verschoben*, und *der
   Status ist eine eigene Eigenschaft, unabhängig von der Spalte*. Das ist der Unterschied zu
   SP-02, wo der volle Pfad zeichengleich stehenbleiben muß.

**Wann ein Eintrag dieser Sorte fällt.** Genau dann, wenn die Aussage wieder an einer zweiten
Stelle steht — nicht, wenn jemand sie für alt hält. Ein Alleinträger wird zur Zweitschrift zurück,
und dann greift wieder **D**.

**Der nächste Fall ist absehbar und wird hier vorgemerkt, nicht eingetragen.** **UM-06** führt den
Anhangssatz auf den Leerzustand (`Attachments.tsx`, „Takt kopiert nur Bilder") zusammen; Abschnitt
8 sagt selbst, er werde „nach ST-08 die einzige Fassung". Das ist derselbe Vorgang. Der Eintrag
entsteht mit der **Freigabe** von UM-06/ST-08 und in **demselben** Auftrag (E-081 Punkt 4) — nicht
heute auf Verdacht, denn ein Sperreintrag für eine Streichung, die noch niemand genehmigt hat,
sperrt einen Zustand, den es nicht gibt.

---

## 6. Zwei Randbedingungen, die für alles gelten

### 6.1 Was vertraglich ist (E-076 Punkt 3)

**Rolle, zugänglicher Name, Klassenname und Datenmerkmal jeder Fläche bleiben, wie sie sind.**
Gemessen: **286** `getByRole`-Zugriffe in `tests/e2e`, `contrast-check.mjs` prüft 332 Farbpaare
gegen die Klassen, `proof-foreign.mjs` liest das JSX.

Daraus folgt für diese Aufgabe:

- **Frei:** `lead`, `description`, `hint`, `consequence`, jeder Fließtext, jeder
  `title`-Tooltip, jeder Rumpf einer `InlineMessage`. Gemessen: keiner der Streichvorschläge aus
  Abschnitt 7 kommt in `tests/**` oder `apps/web/test/**` vor.
- **Vertraglich:** `Card.title`, `EmptyState.title`, `ConfirmDialog.title`,
  `FormDialog.title`, `InlineMessage.title`, jeder Knopftext, jedes `label`, jedes `aria-label`,
  jeder `visually-hidden`-Text, `caption`. Wer einen davon anfasst, sagt es dazu und geht mit
  unit-tester und e2e-tester zusammen.
- **Genau ein** Vorschlag dieser Bestandsaufnahme berührt einen zugänglichen Namen: ST-09
  (`Primitives.tsx:322` „Meldung schliessen" → „Meldung schließen"). Er ist eigens
  gekennzeichnet.

### 6.2 Wann ein Symbol Text ersetzen darf

Aus E-078 Punkt 5 und SC 4.1.2, konkretisiert:

- Ein Symbol steht **ohne** Beschriftung nur, wenn es in Takt bereits eine gelernte Bedeutung
  hat und diese an **jeder** Stelle dieselbe ist. Das trifft heute auf sechs zu:
  `x` (schließen/entfernen), `plus` (anlegen), `trash` (löschen), `pencil` (bearbeiten),
  `play`/`pause` (Timer), `more-horizontal` (Menü).
- Jedes davon trägt einen `aria-label` mit **Handlung und Gegenstand**. Ein Symbol ohne
  zugänglichen Namen ist ein Verstoß gegen SC 4.1.2 und keine Gestaltung.
- Die Klickfläche bleibt bei mindestens 28×28 Pixel (SC 2.5.8 verlangt 24×24;
  `Primitives.tsx:83-86` hält das fest).
- **Ein Symbol mit Erklärungstext daneben ist keine Kürzung, sondern eine Verdopplung**
  (E-078 Punkt 5). Betroffen: `Tag.tsx:109-116` — siehe ST-09.
- **Kein neues Symbol** ersetzt in dieser Runde einen Text. Die Streichlisten kürzen Prosa, sie
  ersetzen sie nicht durch Bilder.

---

## 7. Die Streichliste

Sortiert nach Wirkung: was am meisten Text spart, ohne etwas zu verlieren, steht oben. Je
Eintrag der **vorgeschlagene neue Wortlaut**.

---

### ST-01 — Acht Tooltips in der Hauptnavigation

**Ort:** `app/Navigation.tsx:35-44` (Feld `hint` in `ITEMS`), ausgegeben in `:80` als `title`.

**Urteil:** **S + D.** „Dashboard — Überblick und schnelle Aktionen", „Todos — Liste aller Todos
mit Filtern", „Tags — Tags, Ordner und Pools": Jeder Zusatz sagt, was die Beschriftung sagt.
Dazu SC 1.4.13: ein natives Titelattribut ist nicht mit der Tastatur erreichbar, nicht abweisbar,
nicht überfahrbar.

**Neuer Wortlaut:** keiner. Das Feld `hint` und das Attribut `title` entfallen ersatzlos. Die
acht Beschriftungen bleiben zeichengleich.

**Wirkung:** 8 Texte, 8 Tooltips, 1 Regelverstoß gegen SC 1.4.13.

**Vertrag:** unberührt. Der zugängliche Name eines `<a>` mit Textinhalt ist der Textinhalt;
`title` liefert höchstens die *Beschreibung*. `getByRole("link", { name: "Todos" })` bleibt grün.

---

### ST-02 — Drei Tooltips an den Bereichen des Exports

**Ort:** `screens/parts.tsx:86-92` (Feld `hint`), ausgegeben in `:104` als `title`.

**Urteil:** **S.** „Export — Auswahl, Vorschau und Lauf", „Vorlagen — Welche Felder in die Datei
gehen", „Protokoll — Wann welche Buchung exportiert, zurückgesetzt oder nicht abgerechnet wurde".
Der dritte ist zugleich die längste Fassung eines Satzes, der als `lead` des Protokolls noch
einmal steht (`ExportAuditScreen.tsx:127`).

**Neuer Wortlaut:** keiner. `hint` und `title` entfallen.

**Wirkung:** 3 Texte, 3 Tooltips.

**Vertrag:** unberührt (wie ST-01).

---

### ST-03 — Fünf interne Kennungen im Oberflächentext

**Ort und neuer Wortlaut:**

| Ort | Heute | Neu |
|---|---|---|
| `TagsScreen.tsx:79` | „… eine Spalte des Kanban-Boards oder beides (E-054)." | „… eine Spalte des Kanban-Boards oder beides." |
| `TagsScreen.tsx:612` | „… oder an beiden Stellen (E-054)." | (fällt mit ST-05) |
| `TodoDetailScreen.tsx:580` | „… nach Status, „Erledigt" und Exportstatus (E-055)." | „… nach Status, „Erledigt" und Exportstatus." |
| `ExportAuditScreen.tsx:173-174` | Karte „Wozu dieses Protokoll da ist" / „Es ist die Maßnahme gegen R-10 — nicht das Verbot des Zurücksetzens, sondern seine Nachvollziehbarkeit." | Karte entfällt; die Legende (`:176-190`) bleibt und wird direkt in die Ansicht gesetzt. |
| `labels.ts:438` | „… im Anzeigezustand „Nicht abgerechnet" (E-047) trägt …" | „… im Anzeigezustand „Nicht abgerechnet" trägt …" |

**Urteil:** **S** (Kennung sagt dem Benutzer nichts) und für `ExportAuditScreen` zusätzlich
**S** (die Überschrift erklärt eine Liste, die sichtbar ist).

**Wirkung:** 5 Kennungen, 1 Karte, 1 Überschrift.

**Achtung:** Die Klammer aus `labels.ts:438` fällt, **nicht** der Satz. Der Satz steht auf der
Sperrliste (SP-15). Die Klammerentfernung ist keine Kürzung der Aussage und braucht deshalb
keine erneute Vorlage — sie wird aber in derselben Wiedervorlage mitgenannt (Abschnitt 9).

---

### ST-04 — Die dreifache Bereichsauskunft der Einstellungen

**Ort:** `SettingsScreen.tsx:134-171` (Schiene), `:173-180` (`AREA_LEAD` im Ansichtskopf),
`:309, 421, 559, 589, 659, 774` und `StatusSettings.tsx:276` (Kartenbeschreibungen).

**Urteil:** **D, dreifach.** Beispiel `status`: Schiene „Die Statuswerte eines Todos — nicht die
Spalten des Boards"; Kopf „Welche Statuswerte es gibt, in welcher Reihenfolge und welcher an ein
neues Todo kommt."; Karte „Welche Statuswerte es gibt, in welcher Reihenfolge sie erscheinen und
welcher an ein neues Todo kommt." Kopf und Karte sind derselbe Satz, zweimal getippt.

**Neuer Wortlaut:**

1. `AREA_LEAD` **entfällt vollständig** (sechs Sätze). Der Ansichtskopf trägt nur noch
   „Einstellungen".
2. Die Schiene bleibt und wird auf höchstens fünf Wörter gebracht:
   - `darstellung`: „Farbmodus und Zeilendichte" (statt „… der Oberfläche")
   - `export`: „Zielordner, Vorlage, Rundung"
   - `standardtags`: „Tags für jedes neue Todo"
   - `status`: „Statuswerte eines Todos" (der Zusatz „nicht die Spalten des Boards" wandert nach
     ST-05)
   - `addin`: „Zugang des Add-ins"
   - `arbeitsplatz`: „Abrechnungsname, Ablageort, Meldungen"
3. Die Kartenbeschreibungen bleiben **nur**, wo eine Tatsache dranhängt, die man nicht sieht:
   - `:309` Darstellung → „Wirkt sofort. Nichts zu speichern."
   - `:421` Export → „Vor jedem Lauf erneut geprüft."
   - `:559` Arbeitsplatz → „Meldet der Dienst. Hier nicht änderbar."
   - `:589` Standard-Tags → „Auch aus dem Add-in."
   - `:659` Add-in → „Getrennt vom Zugang dieser Oberfläche."
   - `:774` Sicherheitsmeldungen → „Zählwerte und Zeitpunkte, keine Inhalte." (**A** bleibt)
   - `StatusSettings.tsx:276` → **entfällt**

**Wirkung:** 6 Sätze ersatzlos, 7 Sätze halbiert. Auf der meistbesuchten Einstellungsseite fällt
eine ganze Textebene weg.

**Vertrag:** `Card.title` unberührt. `Card.description` ist nirgends in `tests/**` referenziert.

---

### ST-05 — Der Kanban-Aufklärungstext an elf Stellen

**Ort:** `labels.ts:489-502` (drei Konstanten), `BoardScreen.tsx:372, 967, 1090`,
`StatusSettings.tsx:283-305`, `TodoFormDialog.tsx:235`, `TagsScreen.tsx:79, 612, 624`,
`PoolFormDialog.tsx:790-795`.

**Urteil:** **D, elffach**, und an vier Stellen zugleich **V** (der Benutzer, der die Antwort
braucht, ist der, der zum ersten Mal ein Board sieht — nicht der, der ein Todo anlegt). Der
Kommentar in `labels.ts:473-487` hält selbst fest, dass der Vorgängersatz an **elf** Stellen
stand; die Zahl ist seither nicht kleiner geworden, nur der Wortlaut ist es.

**Neuer Wortlaut:**

| Ort | Heute | Neu |
|---|---|---|
| `BoardScreen.tsx:372` (`lead`) | `RULE_IS_A_RULE` + `RULE_WHAT_MOVES_A_CARD` (vier Sätze) | nur `RULE_WHAT_MOVES_A_CARD`. Das ist die Frage, die am Board tatsächlich gestellt wird: warum lässt sich nichts ziehen und warum ist die Karte weg. |
| `BoardScreen.tsx:1090` (Einrichtungsdialog) | `RULE_IS_A_RULE` + „Dieselbe Entität wie ein Pool — was hier steht, ist eine Regel mit dem Anzeigeort „Board"." | nur `RULE_IS_A_RULE`. Hier wird eine Spalte angelegt; hier gehört die Definition hin. |
| `BoardScreen.tsx:967` (Leerzustand) | „Seit der Umstellung ist eine Spalte eine Regel — dieselbe Art Regel wie ein Pool, über Tags, Status, „Erledigt" und den Exportstatus. Sie richten die Spalten selbst ein; Takt erfindet keine." | „Sie richten die Spalten selbst ein. Takt erfindet keine." (**A** bleibt; „Seit der Umstellung" fällt — eine Formulierung, die an ein Ereignis gebunden ist, altert.) |
| `StatusSettings.tsx:283-305` | zwei Absätze plus zwei Navigationsknöpfe | **entfällt vollständig.** Die Abgrenzung steht künftig einmal, als Zusatz in der Schiene: `status` → „Statuswerte eines Todos" und im Kartentitel bleibt „Status". Wer die Spalten sucht, findet sie am Board. |
| `TodoFormDialog.tsx:235` | „Der Status ist keine Kanban-Spalte — eine Spalte ist eine Regel, und der Status ist eine von fünf Bedingungen, die sie abfragen kann. Welche Statuswerte es gibt, legen Sie in den Einstellungen unter „Status" fest." | „Welche Werte es gibt: Einstellungen › Status." |
| `TagsScreen.tsx:612` | „Eine Regel bündelt Todos — über Tags, Status, „Erledigt" und den Exportstatus. Wo sie erscheint, sagt der Anzeigeort: im Pool-Bereich, als Spalte des Kanban-Boards oder an beiden Stellen (E-054)." | „Eine Regel bündelt Todos. Der Anzeigeort sagt, wo sie erscheint." |
| `TagsScreen.tsx:624` (Leerzustand) | „Eine Regel bündelt Todos — etwa alles unter dem Ordner „Kunden" oder alles Erledigte, das noch nicht abgerechnet ist. Dieselbe Regel kann als Pool und als Kanban-Spalte dienen." | „Etwa alles unter dem Ordner „Kunden" — oder alles Erledigte, das noch offen ist." (das **Beispiel** bleibt, die Definition fällt) |
| `PoolFormDialog.tsx:790-795` | „Nichts wird gespeichert außer der Regel. Eine Regel merkt sich keine Todos …" (vier Sätze) | **entfällt vollständig.** Die Aussage steht wörtlich in `PoolFormDialog.tsx:437` („Was auf „Alle" steht, schränkt nicht ein") und in `RULE_WHAT_MOVES_A_CARD` am Board. |
| `labels.ts:493` `RULE_NOT_A_PLACE` | „Eine Spalte ist eine Regel, kein Ablageort." | **prüfen, ob noch ein Aufrufer da ist.** Ist keiner mehr da, fällt die Konstante ersatzlos (dieselbe Regel wie E-076 Punkt 5 für `lib/focus.ts`). |

**Wirkung:** rund **14 Sätze**, davon zwei ganze Erklärkästen und eine Textwand in den
Einstellungen. Größte Einzelersparnis dieser Liste.

**Achtung — braucht spec-ux-reviewer.** Der Satz stammt aus E-054/E-055 und aus den Befunden
S-2 (R-2) und W-14 (R-2a). Die Aussage bleibt vollständig erhalten, aber sie steht danach an zwei
Stellen statt an elf. Siehe Abschnitt 9.

---

### ST-06 — Hinweise, die das Bedienelement erklären

| Ort | Heute | Neu |
|---|---|---|
| `TodoListScreen.tsx:510` | `hint="Voreingestellt ausgeblendet"` am Schalter „Erledigte einblenden" | **entfällt.** Der Schalter zeigt seinen Zustand über Farbe, Symbol und `aria-pressed` (`FilterBar.tsx:180-207`). |
| `TodoListScreen.tsx:426` (`lead`) | „Alles, wofür Zeit erfasst wird. Erledigte sind ausgeblendet, bis Sie sie einblenden." | „Alles, wofür Zeit erfasst wird." (der zweite Satz steht dreimal: Schalter, `HiddenDoneNotice`, `lead`) |
| `TodoListScreen.tsx:653-654` (`HiddenDoneNotice`) | „… ausgeblendet. Startet der Timer auf einem davon, ist es wieder offen und erscheint hier erneut." | „… ausgeblendet." (**V** — der zweite Satz gilt erst, wenn der Timer startet, und **dann** sagt ihn `reactivationTitle`, SP-16) |
| `TodoFormDialog.tsx:247` (Anlegen) | „Tippen Sie einen Namen: Vorhandene Tags werden vorgeschlagen, ein unbekannter lässt sich als neues Tag anlegen. Die Standard-Tags aus den Einstellungen kommen beim Anlegen von selbst hinzu — sie stehen hier nicht zur Wahl, damit dieselbe Regel nicht zweimal gilt." | „Standard-Tags kommen beim Anlegen von selbst dazu." (**A** bleibt; der Bedienungsteil ist **S** und steht ohnehin als Leerzustand der Liste in `TagInput.tsx:422`) |
| `TodoFormDialog.tsx:248` (Bearbeiten) | „Tippen Sie einen Namen: Vorhandene Tags werden vorgeschlagen, ein unbekannter lässt sich als neues Tag anlegen." | **entfällt.** |
| `Attachments.tsx:420-422` | drei Optionshinweise mit je einem vollen Satz | „Adresse" / „Kopie neben den Daten" / „Pfad". Die vollständige Aussage steht unmittelbar darunter im Feldhinweis (`:434`, `:446-450`) und dort zustandsgebunden. |
| `SettingsScreen.tsx:320` | „„Systemvorgabe" folgt der Einstellung von Windows. Die Wahl gilt sofort und bleibt beim nächsten Start erhalten." | „Bleibt beim nächsten Start erhalten." (erster Satz **S** — „Systemvorgabe" steht als Auswahlwert daneben; „gilt sofort" **D** zur Kartenbeschreibung aus ST-04) |
| `ExportAuditScreen.tsx:218` | „Der Filter wirkt über die geladenen Zeilen. Laden Sie weitere, wenn Sie einen älteren Vorgang suchen — oder setzen Sie den Filter zurück." | „Der Filter wirkt nur über die geladenen Zeilen." (beide Wege stehen als Knöpfe direkt daneben, `:221-227`) |

**Wirkung:** 8 Stellen, rund 10 Sätze.

---

### ST-07 — Sätze, die ihren eigenen Titel wiederholen

| Ort | Heute | Neu |
|---|---|---|
| `app/undoDone.ts:40` | „Das Abhaken ist zurückgenommen. Tags und Status ändern sich dadurch nicht." | „Tags und Status ändern sich dadurch nicht." (erster Satz steht im Titel) |
| `Attachments.tsx:387` | „Anhang hinzugefügt." / „Entfernen lässt er sich jederzeit über das Papierkorbsymbol in der Zeile." | Rumpf → „Entfernen über das Papierkorbsymbol in der Zeile." |
| `TodoListScreen.tsx:314` | „Es verschwindet damit aus dieser Liste, solange erledigte ausgeblendet sind. Der Status bleibt unverändert." | „Aus dieser Liste ausgeblendet. Der Status bleibt unverändert." (Regel S-13: höchstens zwei Sätze, der Bewegungssatz aus der Domäne tritt daneben) |
| `TemplatePreview.tsx:303-306` und `:597` | vier Fassungen von „erzeugt vom selben Renderer, der auch die Datei schreibt" | eine Fassung: „Vom selben Renderer wie die Exportdatei, an Ihren offenen Buchungen." Die Kartenbeschreibung `:597` entfällt. Die Unterscheidung „gespeichert / Entwurf" bleibt als eigener, kurzer Zusatz — sie ist **A**. |
| `ExportScreen.tsx:1176` | „Datei geschrieben und jede enthaltene Buchung markiert — in einer Transaktion." | „In einer Transaktion geschrieben." (die vollständige Fassung steht als Folge im Bestätigungsdialog, SP-17) |
| `ExportScreen.tsx:955` | „Was wann geschrieben wurde. Welche Buchungen darin waren, steht im Protokoll — dort wirkt der Lauffilter über die geladenen Zeilen, ältere Läufe brauchen deshalb ein „Weitere laden"." | „Was wann geschrieben wurde." Der Rest ist **D** zu `ExportScreen.tsx:1009` (Tooltip, fällt mit ST-03/S-16) und zu `ExportAuditScreen.tsx:218`. |

**Wirkung:** 6 Stellen, rund 8 Sätze.

---

### ST-08 — Überflüssige Überschriften und einleitende Beschreibungen

| Ort | Heute | Neu |
|---|---|---|
| `StatusSettings.tsx:372-385` | Kasten „Zwei Dinge, bevor Sie etwas ändern" mit zwei Aufzählungspunkten | **entfällt vollständig.** Beide Punkte stehen bereits zustandsgebunden: der Standard-Punkt als `disabledReason` (`:524`, SP-19), der Todos-Punkt als `consequence` im Löschdialog (`:425`) und als `disabledReason` (`:527`). Das ist **D + V** in Reinform. |
| `Attachments.tsx:397` | `description="Ein Verweis, ein Bild oder eine Datei, die zu diesem Todo gehört."` | **entfällt.** Die drei Optionen stehen unmittelbar darunter mit denselben drei Wörtern als Beschriftung. Dieselbe Aussage steht ein drittes Mal in `Attachments.tsx:609` und ein viertes in `TodoDetailScreen.tsx:447`. |
| `PoolFormDialog.tsx:437` | „Eine Regel nennt Bedingungen. Jede engt weiter ein: Erforderliche Tags müssen da sein, ausgeschlossene dürfen es nicht, und Status, Erledigt und Exportstatus grenzen weiter ab. Was auf „Alle" steht, schränkt nicht ein." | „Jede Bedingung engt weiter ein. Was auf „Alle" steht, schränkt nicht ein." (der aufzählende Mittelteil ist **D** zu den fünf `FormSection`-Titeln direkt darunter; der Schlusssatz ist **A** und bleibt) |
| `PoolFormDialog.tsx:555, 578, 596, 601` | vier Feldhinweise, die die Beschriftung darüber umschreiben („Ein Ordner steht für alles, was in ihm liegt.") | **prüfen.** `:596` und `:601` sind **A** (was ein Ausschluss über einen leeren Ordner tut) und bleiben. `:555` und `:578` sind **S** und fallen, sofern der `lead` der `FormSection` sie trägt — er tut es heute schon: `:539` „Ein genannter Ordner steht für die Tags, die in ihm liegen." |
| `PoolFormDialog.tsx:619` | `FormSection` „Ordnertiefe" mit `lead` „Eine Einstellung für beide Listen — erforderliche wie ausgeschlossene Ordner." | **prüfen**, ob die Beschriftung des Kontrollkästchens darunter trägt. Wenn ja: `lead` entfällt. |
| `ExportAuditScreen.tsx:173` | Karte „Wozu dieses Protokoll da ist" | mit ST-03 |

**Wirkung:** 6 Stellen, rund 9 Sätze, davon ein ganzer Erklärkasten.

---

### ST-09 — Anrede, Rechtschreibung, doppelte Marken

| Ort | Heute | Neu | Anmerkung |
|---|---|---|---|
| `NoteField.tsx:59` | Platzhalter „Nur für dich. Gedanken, Zwischenstände, Ansprechpartner …" | „Gedanken, Zwischenstände, Ansprechpartner …" | Die Anrede fällt: **D** zum Banner „Bleibt in Takt" — und sie ist die **einzige** Duz-Stelle im ganzen Produkt. |
| `TodoDetailScreen.tsx:613` | Platzhalter „Notiz für Sie selbst — Zugangsdaten, Ansprechpartner, Zwischenstand." | **entfällt**; das Feld nimmt den Vorgabewert aus `NoteField`. | Zwei Anreden für dasselbe Feld, an zwei Flächen. |
| `Primitives.tsx:322` | `label="Meldung schliessen"` | `label="Meldung schließen"` | **Berührt einen zugänglichen Namen.** Nicht in `tests/**` referenziert (gemessen), trotzdem geht die Änderung nur zusammen mit unit-tester und e2e-tester (E-076 Punkt 3). |
| `Tag.tsx:109-110` | `title="Dieses Tag wird beim Speichern angelegt"` **und** `visually-hidden` „wird neu angelegt" | `title` entfällt; der `visually-hidden`-Text bleibt zeichengleich. | Zwei Texte, zwei Wortlaute, eine Marke. `title` ist auf einem `<span>` ohnehin nicht zugänglich. |
| `Tag.tsx:115-116` | `title="Standard-Tag"` **und** `visually-hidden` „Standard-Tag" | `title` entfällt. | Wortgleiche Verdopplung. |

**Wirkung:** 5 Stellen. Klein an Zeichen, groß an Einheitlichkeit.

---

### ST-10 — Ansichtsköpfe, deren Titel trägt (zu prüfen, nicht zu entscheiden)

`TimeScreen.tsx:106` „Timer starten und stoppen, heutige Buchungen ansehen, Zeit von Hand
nachtragen." und `DashboardScreen.tsx:140` „Was läuft, was heute erfasst wurde, was noch nicht
abgerechnet ist." zählen auf, was die Karten darunter sichtbar tragen (**S**).

**Kein Streichvorschlag**, sondern eine Frage an ui-designer: Trägt der Ansichtstitel allein,
wenn darunter drei beschriftete Karten stehen? Wenn ja, fallen beide `lead`-Sätze. Wenn nein,
werden sie auf 80 Zeichen gebracht. Das ist eine Frage der Hierarchie und nicht des Wortlauts —
und damit nach E-078 Punkt 4 die Entscheidung des ui-designer, nicht meine.

---

## 8. Die Umbauliste — offenlegen statt löschen

Jeder Eintrag nennt seinen Träger aus Abschnitt 3 und sagt, **wodurch die Information erreichbar
bleibt**.

---

### UM-01 — Lange Feldhinweise werden zustandsgebunden

**Heute:** `Select.tsx:233-237` und die Textfelder geben `hint` als dauerhaft sichtbaren Absatz
aus. Es gibt keinen Zustand, in dem er verschwindet.

**Umbau (Träger T1).** Zwei Klassen von Hinweisen, sichtbar unterschieden:

- **Form- und Grenzangaben** („Ein Tag, keine Uhrzeit", „Nur „http" und „https"", „Max. 200
  Zeichen") stehen **dauerhaft**. Sie werden beim Ausfüllen gebraucht. Sie bleiben in
  `aria-describedby`.
- **Folge-, Abwesenheits- und Widerspruchsangaben** stehen **nur in ihrem Zustand** — also dann,
  wenn der Wert gewählt ist, auf den sie sich beziehen.

**Erreichbarkeit:** Die Information verschwindet nicht, sie wandert an den Punkt der Wahl. Wer
den betreffenden Wert wählt, liest sie; wer ihn nicht wählt, brauchte sie nie.

**Bedingung, die nicht verhandelbar ist:** Verschwindet ein Hinweis aus dem Blickfeld, verschwindet
er **auch** aus `aria-describedby`. Ein Hinweis, den nur eine Vorlesehilfe hört, wäre eine zweite
Anwendung (R-2a, Antwort auf T-097 Frage 3). Sicht und Gehör bekommen dieselbe Menge.

**Betroffen:** `labels.ts:348-351` `POOL_MATCH_MODE_HINT` (zwei Fassungen, heute beide sichtbar —
`RadioRow` zeigt sie an beiden Optionen), `SettingsScreen.tsx:627-631`,
`PoolFormDialog.tsx:646-649`.

**Braucht spec-ux-reviewer** (Auswirkung auf SC 3.3.2 und auf S-8 aus R-2).

---

### UM-02 — gestrichen (E-081 Punkt 3)

**Dieser Eintrag wird nicht umgesetzt.** Er hat sich als Vorschlag erwiesen, der etwas verlangt,
das bereits gebaut ist — und dessen Ausführung im Wortsinn eine Freigabe still zurückgenommen
hätte.

**Was die erste Fassung wollte:** `labels.ts:438` `POOL_EXPORT_NOT_BILLED_HINT` sollte erst bei
gewählter Option „Abgerechnet" erscheinen statt dauerhaft.

**Was gemessen ist (T-171 B-1, entschieden in E-081):** `RadioRow.tsx:145-154` zeigt **sichtbar**
ohnehin nur den Hinweis der **gewählten** Option. Der Umbau änderte sichtbar nichts. Dauerhaft im
Baum steht die verborgene Erläuterung **jeder** Option (`:44-56`, `:114`, `:125-141`) — und das ist
**Absicht seit S-6 aus R-2**: Wer die Auswahl mit der Tastatur durchgeht, hört zu jeder Option, was
sie bedeutet, **bevor** er sie wählt; sehend liest man dieselbe Auskunft erst nach der Wahl. Wer
UM-02 wörtlich ausführte, hätte sehr wahrscheinlich die verborgenen Fassungen mit „aufgeräumt" und
damit S-6 zurückgenommen, ohne daß es jemand als Rücknahme gesehen hätte.

**An dieser Stelle bleibt allein ST-03** (die Klammer „(E-047)" fällt, der Satz nicht). Der Inhalt
steht unverändert unter **SP-15**.

**Sinngemäß dasselbe gilt für `POOL_MATCH_MODE_HINT` und `Attachments.tsx:420-422`** — auch dort
ist sichtbar immer nur einer der Hinweise. Wo **UM-01** diese beiden Stellen als „betroffen"
nennt, ist damit **nicht** das Sichtbarmachen oder Verbergen gemeint, sondern allein die Frage,
ob der Wortlaut Form- oder Folgeangabe ist. UM-01 fährt an diesen zwei Stellen also ohne
Bauartänderung.

**Die Lehre, die über diesen Eintrag hinausgeht** (E-081 Punkt 4): Streichung und Ausgleich
gehören in **einen** Auftrag. Ein Textdurchgang, dessen erste Welle nur streicht, streicht ohne
Ersatz.

---

### UM-03 — Die Kanban-Abgrenzung erscheint, solange keine Spalte eingerichtet ist

**Heute:** `StatusSettings.tsx:283-305` steht dauerhaft, für jeden Benutzer, bei jedem Besuch.

**Umbau (Träger T1 + T3).** ST-05 streicht den Kasten. Was an seine Stelle tritt, ist **nicht**
ein kürzerer Kasten, sondern der bereits vorhandene Leerzustand am Board
(`BoardScreen.tsx:967`): Solange keine Spalte eingerichtet ist, steht die Erklärung dort — an
der Fläche, auf der man sie sucht. Ist eine eingerichtet, ist die Frage beantwortet.

**Erreichbarkeit:** Board-Leerzustand plus `docs/benutzerhandbuch.md`. Die Einstellungen
schweigen dazu.

**Warum kein Aufklapper:** E-076 Punkt 2 untersagt, dafür eine Fläche zu erfinden.

---

### UM-04 — Die Regeln zum Status stehen an der Zeile, die sie sperren

**Neu gefaßt in T-180 nach der Messung aus T-172 (O-EQ).** Die erste Fassung nannte den falschen
Träger. Der Umbau bleibt, die Bauart ändert sich.

**Heute:** zwei Fassungen derselben zwei Regeln.

- `StatusSettings.tsx:372-385` — der Kasten „Zwei Dinge, bevor Sie etwas ändern" nennt sie
  **dauerhaft im Voraus**, für jeden Benutzer, bei jedem Besuch, auch wenn keine Zeile betroffen
  ist. Das ist **D + V** in Reinform.
- `StatusSettings.tsx:519-531`, dargestellt in `:568-596` — dieselben Regeln als **Sperrgrund in
  der betroffenen Zeile**, sichtbar, mit Schloßsymbol, mit dem Ausweg als Knopf daneben („Diese 3
  Todos anzeigen"), und **nur dort, wo sie zutreffen**. Dazu `consequence` im Löschdialog
  (`:425`) für den Fall, daß sie nicht zutreffen.

**Umbau (Träger T1 + T2).** Der Vorratskasten fällt (das ist ST-08, Zeile 1). Die
zustandsgebundenen Fassungen bleiben die einzigen. **Sie stehen bereits so da** — der Umbau
besteht aus einer Streichung und aus einer Zusicherung, nicht aus einem Neubau.

**Die Zusicherung, und sie ist der ganze Nachtrag.** Träger der Sperrbegründung ist die
**sichtbare Fläche** `status-admin__blocked`, nicht der gesperrte Knopf. Gemessen (T-172 Punkt 2,
Einzelheiten in Abschnitt 5.1): Der Knopf trägt echtes `disabled`, kommt in der Reihenfolge des
Tabulators nicht vor, und sein `aria-describedby` wird deshalb nie in dieser Eigenschaft angesagt. Wer
den sichtbaren Text zugunsten einer reinen Knopfbeschreibung entfernte, nähme zusammen mit dem
Vorratskasten **auch** die letzte erreichbare Fassung weg — und zwar ausgerechnet für die
Benutzergruppe, für die dieser Umbau gedacht ist.

**Erreichbarkeit nach dem Umbau:** vollständig, auf drei Wegen, und keiner davon ist der
`disabled`-Knopf allein.

| Weg | Wer ihn geht | Was er liest |
|---|---|---|
| sichtbarer Fließtext in der Zeile | Blick, Vergrößerung, linearer Durchgang mit Vorlesehilfe | den vollständigen Grund, alle Gründe, in der Reihenfolge ihrer Behebbarkeit |
| Tabulator | Tastaturbenutzer | landet **in** der Begründungsfläche, weil „Diese N Todos anzeigen" dort ein echtes Bedienelement ist — und liest den Grund als Absatz davor |
| `aria-describedby` am Knopf | linearer Durchgang, der den Knopf ansteuert | dieselbe Auskunft als Zugabe (E-081 Punkt 2) |

**Akzeptanzkriterien für frontend-dev.** Alle fünf sind Bedingungen der Freigabe, nicht Hinweise.

1. `StatusSettings.tsx:372-385` ist entfernt. Kein Ersatzkasten, keine kürzere Fassung, kein
   Aufklapper (E-076 Punkt 2).
2. `status-admin__blocked` ist **unverändert vorhanden**: sichtbarer Text, alle zutreffenden
   Gründe (nicht nur der erste), Schloßsymbol, der Knopf „Diese N Todos anzeigen" innerhalb der
   Fläche, im DOM **vor** dem Löschknopf.
3. Der Löschknopf behält `disabled` **und** `aria-describedby` auf die Fläche **und** den Namen
   „…löschen — derzeit nicht möglich". Kein Wechsel auf `aria-disabled` als Teil dieser Aufgabe —
   das wäre eine eigene Entscheidung mit eigener Messung.
4. **Gegenprobe, gemessen und nicht zugesichert:** Fokus auf „Umbenennen" einer gesperrten Zeile,
   zweimal Tab. Der erste Tab landet auf „Diese N Todos anzeigen", der zweite in der nächsten
   Zeile. Bleibt das so, ist der Weg über die Fläche intakt; landet der erste Tab woanders, ist
   die Fläche verschoben worden und die Aufgabe ist nicht fertig.
5. Der Sperrgrund erscheint **nur** an gesperrten Zeilen. Eine freie Zeile trägt keine Fläche,
   keinen Platzhalter und keinen leeren Kasten.

**Was diese Aufgabe nicht entscheidet:** ob ein konkretes Vorleseprogramm den Grund *ausspricht*.
Das braucht NVDA oder JAWS unter Windows (T-172 Offene Frage 2). Der Umbau ist so gebaut, daß die
Antwort ihn nicht umwirft: Er verläßt sich auf sichtbaren Text im Lesefluß, nicht auf eine
Eigenschaft eines nicht fokussierbaren Elements.

---

### UM-05 — Der Entwurfshinweis erscheint, wenn ein Entwurf existiert

**Heute:** `ExportScreen.tsx:683-686` „Gezeigt und geschrieben wird der gespeicherte Stand
dieser Vorlage. Ein Entwurf, der im Vorlageneditor noch nicht gespeichert ist, wirkt hier nicht
mit."

**Umbau (Träger T1).** Der erste Satz bleibt dauerhaft (**A**). Der zweite erscheint nur, wenn
im Vorlageneditor tatsächlich ein ungespeicherter Entwurf liegt.

**Erreichbarkeit:** Wer keinen Entwurf hat, kann von einem nicht überrascht werden.

**Einschränkung:** Ob der Exportbildschirm überhaupt weiß, dass ein Entwurf offen ist, ist eine
Frage an frontend-dev. Weiß er es nicht, bleibt der Satz stehen — ein Satz auf Vorrat ist besser
als eine unbemerkte Abweichung im Abrechnungsbetrag.

---

### UM-06 — Der Anhangssatz steht einmal, im Leerzustand

**Heute:** dieselbe Aussage viermal: `TodoDetailScreen.tsx:447` (Kartenbeschreibung),
`Attachments.tsx:397` (Dialogbeschreibung), `:609` (Leerzustand), `:420-422` (Optionshinweise).

**Umbau (Träger T1).** Die vollständige Fassung steht im **Leerzustand** (`:609`) — dort, wo
jemand zum ersten Mal einen Anhang anlegt und die Frage „was ist das hier" tatsächlich hat.
Sobald Anhänge da sind, ist sie beantwortet und verschwindet mit dem Leerzustand.

Die Kartenbeschreibung `TodoDetailScreen.tsx:447` behält **nur** ihren **F**-Teil: „Geöffnet
wird nur auf Ihren Klick." Die Aufzählung der drei Arten fällt (sie steht in der Liste darunter).

**Erreichbarkeit:** Leerzustand plus die drei Optionsbeschriftungen im Anlegen-Dialog.

**Berührt R-22 nicht:** Die Absagegründe (SP-13) und die Rückfrage vor dem Dateiöffnen (SP-01,
SP-02) sind davon ausgenommen und bleiben unverändert.

---

### UM-07 — Der Bewegungssatz verdrängt unsere eigene Auskunft

**Heute:** `TodoListScreen.tsx:299-318` setzt bis zu drei Sätze im Toast-Rumpf zusammen: unsere
Auskunft über diese Liste, unsere Auskunft über den Status, und den Bewegungssatz aus
`@takt/domain`.

**Umbau (Träger T2).** Regel S-13: höchstens zwei Sätze. Liegt ein Bewegungssatz vor, ist er der
zweite; unsere eigene Auskunft schrumpft auf den einen, der **A** ist („Der Status bleibt
unverändert."). Liegt keiner vor, bleibt es bei zwei eigenen Sätzen.

**Erreichbarkeit:** Der Bewegungssatz ist die genauere Auskunft — er nennt Pools und Spalten beim
Namen. Unsere pauschale Fassung tritt hinter ihn zurück, statt neben ihm zu stehen.

**Berührt Pflichtflow „Timer auf erledigtem Todo".** `reactivationTitle` (SP-16) bleibt
unverändert.

---

### UM-08 — Die letzte zeitgebundene Erklärfläche bekommt ihre Bedingung

**Neu in T-180** auf Befund **B-3** aus T-171 (ui-designer, dortiger Abschnitt 3.9). Er lag
außerhalb der ST-Liste und ist deshalb hier ein **Umbau**, kein elfter Streichvorschlag.

**Heute:** `BoardScreen.tsx:975-1008`, die Karte „Was sich geändert hat" mit vier
Aufzählungspunkten und zwei Knöpfen, unmittelbar unter dem Board-Leerzustand. Sie spricht zu
jemandem, der **vor E-054 ein Statusboard hatte** — sie erklärt eine Änderung an einem Bestand.

#### Bedingung oder Ablaufdatum? — Bedingung, und sie hängt am Bestand

Die drei denkbaren Anker, und warum zwei ausscheiden:

- **Ein Ablaufdatum** wäre ein Datum im Quelltext, ab dem die Karte schweigt. Falsch aus zwei
  Gründen. Erstens: Takt lädt und installiert nichts (A-18.9); wer bei der alten Fassung bleibt,
  sieht die Karte weiter, und wer nach dem Stichtag frisch einrichtet, hatte auch davor nichts zu
  migrieren. Zweitens und schwerer: Das Datum beantwortet die falsche Frage. Ob die Karte etwas zu
  sagen hat, hängt daran, **was dieser Bestand erlebt hat**, nicht daran, welchen Tag der Kalender
  zeigt.
- **Eine Fassung** (etwa „nur unter 0.2.0") ist derselbe Fehler in Grün. Die installierte Fassung
  sagt nichts darüber, ob dieser Bestand jemals ein Statusboard hatte.
- **Eine Einstellung** („nicht mehr anzeigen") scheidet aus. S-12 verbietet ein „Nicht mehr
  fragen", und die Begründung trägt hier genauso: Sie verlangt vom Benutzer eine Handlung, um eine
  Erklärung loszuwerden, um die er nicht gebeten hat.

**Also eine Bedingung, und sie lautet: Hat dieser Bestand vor der Umstellung existiert?** Sie ist
die einzige, die die Frage der Karte trifft.

#### Die Bedingung ist beantwortbar, und die Antwort ist immer „nein"

Gemessen, nicht vermutet:

1. **E-054 fiel während der Entwicklung**, lange vor jeder Veröffentlichung. Die erste Auslieferung
   ist **v0.1.0 vom 2026-09-04**; sie hat das regelbasierte Board von Anfang an.
2. **Die Umstellung liegt als Migration im Bestand:** `0010_drop_board_rank`. Sie ist Teil der
   Kette 0001 bis 0015, die eine **frische** Einrichtung in einem Zug durchläuft. „Migration 0010
   ist angewandt" gilt damit für jeden Bestand und unterscheidet nichts.
3. Ihr eigener Kopfkommentar hält fest, daß `board_rank` **nie von einem Aufrufer gesetzt** wurde
   (gemessen in T-066). Die Karte spricht also von einer verlorenen Reihenfolge, die auch vorher
   keine Benutzerreihenfolge war.

**Es gibt keinen Bestand, für den die Bedingung wahr ist, und es kann keinen mehr geben.** Ein
Merkmal, das es nachträglich unterschiede, existiert nicht und ließe sich rückwirkend nicht
ehrlich setzen.

#### Was daraus folgt — kein Verlust, weil zwei der vier Punkte längst anderswo stehen

| Punkt der Karte | Gilt für einen frischen Bestand? | Wohin |
|---|---|---|
| „Nichts wird mehr gezogen." (`:993-998`) | **ja** — das ist die Frage, die am Board tatsächlich gestellt wird | steht bereits als `RULE_WHAT_MOVES_A_CARD` im `lead` des Boards (`:372`, bleibt nach ST-05). Die Fassung in der Karte ist die **vierte** desselben Satzes — **D** |
| „Keine automatische Übersetzung." (`:988-992`) | **ja** — **A**, Takt legt kein Tag an und hängt es an nichts | steht bereits kurz im Leerzustand: „Takt erfindet keine." (`:967`, bleibt nach ST-05) |
| „Ihre Todos sind vollzählig da." (`:977-981`) | **nein** — beruhigt über eine Migration, die nicht stattfand | **T3 Handbuch** |
| „Der Status bleibt." (`:982-987`) | **halb** — der Verweis „Einstellungen › Status" gilt, die Aussage „er ist nur nicht mehr die Spalte" setzt das Vorher voraus | Verweisteil steht nach ST-05 in `TodoFormDialog.tsx:235`; der Rest **T3 Handbuch** |

**Die zwei Knöpfe fallen mit.** „Erste Spalte einrichten" steht wortgleich als Aktion des
Leerzustands drei Zeilen darüber (**D**); „Zur Todo-Liste" ist ein Navigationsknopf in einem
Erklärkasten, und **Regel S-11 verbietet ihn** aus demselben Grund wie in
`StatusSettings.tsx:283-305`: Ein Bedienweg gehört an die Bedienstelle. Die Todo-Liste ist ein
Punkt der Hauptnavigation und immer sichtbar.

#### Verschwinden ohne Spur oder ins Handbuch? — Ins Handbuch

**Nicht spurlos.** Die zwei Punkte, die keinen Adressaten mehr haben, sind trotzdem wahr, und sie
sind die Antwort auf eine Frage, die irgendwann jemand stellt — ein Entwicklungsbestand aus der
Zeit vor T-066, eine Rückfrage in einem Jahr, ein Blick in die Vorgeschichte einer Entscheidung.
Sie gehören nach `docs/benutzerhandbuch.md`, in den Abschnitt über das Board, als kurzer Absatz
zur Herkunft der Spalten. **Fremde Hoheit: documenter.** Die Oberfläche verweist nicht darauf, sie
schweigt schlicht — das ist die Regel für T3 aus Abschnitt 3 und sie gilt unverändert.

**Reihenfolge, und sie ist bindend (E-081 Punkt 4):** Der Absatz steht im Handbuch, **bevor** die
Karte aus `BoardScreen.tsx` verschwindet. Streichung und Ausgleich in einem Auftrag.

#### Der Fluß, den das betrifft: Board zum ersten Mal geöffnet

| Schritt | Was | Was der Benutzer sieht |
|---|---|---|
| Start | Frisch eingerichtetes Takt, Navigationspunkt „Board" | Ansichtskopf plus `RULE_WHAT_MOVES_A_CARD` |
| Zustand A — keine Spalte, Regelliste geladen, **keine** Regel vorhanden | Leerzustand plus Hinweis „Sie haben noch keine Regel" | Titel „Das Board hat noch keine Spalte", ein Satz, **eine** Aktion: „Erste Spalte einrichten" |
| Zustand B — keine Spalte, aber Regeln vorhanden | Leerzustand plus Karte „Vorhandene Regeln als Spalte aufnehmen" | derselbe Leerzustand, darunter die übernehmbaren Regeln |
| Zustand C — Regelliste **unbekannt** (lädt oder fehlgeschlagen) | `poolsKnown` ist falsch | Leerzustand **ohne** Aussage über den Bestand. Diese Bauart steht schon da (`:942-951`) und ist der Maßstab dieses Umbaus |
| Aktion | „Erste Spalte einrichten" | Einrichtungsdialog, `RULE_IS_A_RULE` als Beschreibung (ST-05) |
| Erfolg | Spalte steht | Board mit Spalte; Leerzustand und alles darunter verschwinden zusammen |
| Fehlerpfad | Anlegen abgelehnt | Absage des Dienstes wörtlich in der Fehlerfläche des Dialogs, Dialog bleibt offen, Eingaben bleiben stehen (S-10) |
| Sackgasse | keine | in jedem Zustand steht genau eine primäre Aktion, und in Zustand C wird geschwiegen statt geraten |

**Der Präzedenzfall steht drei Zeilen über der Karte.** `poolsKnown` (`BoardScreen.tsx:942-951`)
löst dieselbe Klasse Problem und begründet sie selbst: „Fehlt die Angabe, wird der Satz
weggelassen statt geraten." Genau das ist die Antwort auf UM-08 — für die Karte fehlt die Angabe
nicht nur, sie ist unbeschaffbar.

**Braucht spec-ux-reviewer** (E-054, A-5.4) **und documenter** (der Handbuchabsatz). Berührt keine
Anforderungs-ID im Wortlaut, keinen zugänglichen Namen und keinen Prüffall mit Textvergleich —
gemessen: keiner der vier Punkte kommt in `tests/**` vor.

---

## 9. Umsetzungsreihenfolge

Gegliedert nach Fläche. Jede Zeile ist eine eigene Aufgabe mit eigener Freigabe. **Keine Fläche
beginnt, bevor ui-designer für sie gesagt hat, was das für Hierarchie und Dichte bedeutet**
(E-078 Punkt 4).

**Nachtrag T-180, und er steht über der ganzen Tabelle (E-081 Punkt 4):** Eine Aufgabe enthält
**Streichung und Ausgleich zusammen**. Keine Zeile dieser Reihenfolge wird so zerlegt, daß eine
Welle nur streicht und die Kompensation in die nächste rutscht — dann ist der Satz gestrichen
**ohne** Ersatz, und niemand sieht es, weil beide Wellen für sich richtig aussehen. Das gilt
namentlich für ST-05 mit der Regelzeile (T-171), für ST-04 mit der Kontur der Schiene, für UM-04
mit der sichtbaren Sperrfläche und für UM-08 mit dem Handbuchabsatz.

**Nachtrag T-203:** **Abschnitt 12 steht außerhalb dieser Reihenfolge.** Er kürzt nichts und legt
nichts offen, sondern schließt einen Ausgang, an dem heute etwas Falsches steht. Er hängt an
keiner Welle und an keiner Vorbedingung außer der Vorlage bei spec-ux-reviewer (E-078 Punkt 3) —
er ist die Nacharbeit zu **T-200 Z-49** und blockiert dort einen Abschluß, nicht hier eine
Streichung. Ebenso außerhalb steht **SP-22**: Er ist ein Sperrlisteneintrag und gehört in
denselben Auftrag wie der Fall der Karte aus **UM-08** (5.2, Pflichtangabe 3).

### Welle X+1 — was ohne Vorlage bei einem Prüfer geht

Reine Streichungen ohne Aussageverlust. Kein Satz mit Anforderungs-ID, kein zugänglicher Name
außer dem einen benannten.

| Reihenfolge | Fläche | Einträge | Wer |
|---|---|---|---|
| 1 | Rahmen (Navigation, Bereiche) | ST-01, ST-02 | frontend-dev |
| 2 | quer über alle Ansichten | ST-03 (Kennungen), ST-09 (Anrede, Rechtschreibung, Marken) | frontend-dev; ST-09 Zeile 3 zusammen mit unit-tester und e2e-tester |
| 3 | Meldungen und Ergebnisflächen | ST-07 | frontend-dev |
| 4 | Musterseite nachziehen | `showcase/**`, wo ein Produkttext gefallen ist | frontend-dev |

### Welle X+2 — nach dem Wort des ui-designer

| Reihenfolge | Fläche | Einträge | Vorbedingung |
|---|---|---|---|
| 5 | Einstellungen (S-11 bis S-16 der Spezifikation) | ST-04, ST-08 (Teil `StatusSettings`), UM-04 | ui-designer: Trägt eine Karte ohne Beschreibung? Trägt ein Kopf ohne `lead`? — **beantwortet** (T-171 Abschnitt 4.4). Dazu **UM-04 Akzeptanzkriterium 4**: die Tabulator-Gegenprobe wird gemessen, bevor die Aufgabe fertig heißt |
| 6 | Dashboard und Zeiterfassung | ST-10 | ui-designer entscheidet, ob der `lead` fällt oder schrumpft |
| 7 | Anhänge und Todo-Detail | UM-06, ST-08 (Teil `Attachments`) | ui-designer: Dichte der Detailansicht |

### Welle X+3 — nur nach Vorlage bei spec-ux-reviewer

**Diese Einträge gehen nicht ohne Zustimmung.** Vorzulegen ist jeweils die **neue Fassung**, nicht
die Absicht.

| Eintrag | Vorzulegen bei | Prüfpunkt, an dem der Satz hängt |
|---|---|---|
| **ST-05** (Kanban-Aufklärung von elf auf zwei Stellen) | spec-ux-reviewer | E-054, E-055, **S-2** aus R-2, **W-14** aus R-2a, A-5.4 |
| **ST-06** Zeilen `TodoFormDialog.tsx:247/248` und `TodoListScreen.tsx:653-654` | spec-ux-reviewer | A-2.5, I-05, E-039, **B-19** |
| **ST-08** Zeile `PoolFormDialog.tsx:437, 555, 578, 619` | spec-ux-reviewer | **S-7** aus R-2, A-3.1, A-3.4, SC 1.3.1 |
| **UM-01** (Feldhinweise zustandsgebunden) | spec-ux-reviewer, dazu accessibility-Prüfung | SC 3.3.2, SC 1.3.1, **S-8** aus R-2, R-2a Antwort auf T-097 Frage 3 |
| ~~**UM-02**~~ | **entfällt** — E-081 Punkt 3, siehe Abschnitt 8. An der Stelle fährt allein ST-03 | — |
| **UM-03** (Kanban-Abgrenzung nur im Board-Leerzustand) | spec-ux-reviewer | E-054, A-5.4 |
| **UM-05** (Entwurfshinweis zustandsgebunden) | spec-ux-reviewer, dazu frontend-dev zur Machbarkeit | A-8.6, E-020 |
| **UM-07** (Toast-Rumpf auf zwei Sätze) | spec-ux-reviewer | A-2.5, E-060 Punkt 4, **W-14** |
| **UM-08** (Karte „Was sich geändert hat") | spec-ux-reviewer **und** documenter — der Handbuchabsatz steht **zuerst** | E-054, A-5.4 |
| **SP-09 Kürzung** `NoteField.tsx:50` (falls gewollt) | spec-ux-reviewer **und** security-checker | E-016, R-06, R-08 |
| **ST-03** Zeile `labels.ts:438` (nur die Klammer) | spec-ux-reviewer, zur Kenntnis | **S-1** aus R-2 — die Aussage bleibt |

### Was nie an die Reihe kommt

`ShellStatus.tsx` (S-14, SP-11), `lib/exportDirectoryAdvice.ts` und
`lib/databaseLocationAdvice.ts` (S-18, SP-14), `AttachmentOpenDialog.tsx` (SP-01, SP-02),
`Attachments.tsx:109-140` (SP-13), `UpdateDialog.tsx` (SP-12), die `consequence`- und
`acknowledgeLabel`-Texte der drei Bestätigungsdialoge (SP-07, SP-10). Diese Flächen werden in
keiner Welle gekürzt. Sie sind der Grund, aus dem E-078 überhaupt eine Entscheidung ist.

---

## 10. Was diese Bestandsaufnahme nicht beantwortet

1. **Wie lang eine Zeile in der Fläche tatsächlich wird.** Die Zeichengrenzen dieses Papiers
   sind Obergrenzen der Aussage, nicht der Darstellung. Ob 80 Zeichen in der Filterleiste zwei
   Zeilen ergeben, sagt ui-designer.
2. **Ob ein Symbol an einer bestimmten Stelle trägt.** Abschnitt 6.2 nennt die sechs Symbole mit
   gelernter Bedeutung. Ob ein siebtes dazukommt, ist eine Frage der Gestaltung und keine des
   Textes.
3. ~~**Ob ein gesperrter Knopf seinen `disabledReason` überhaupt an eine Vorlesehilfe abgibt.**~~
   **Beantwortet in T-172, nachgetragen in T-180.** Über den Tabulator: nein, gemessen. Träger ist
   der sichtbare Begleittext; siehe Abschnitt 5.1 und UM-04. **Offen bleibt allein die
   Aussprache** durch ein konkretes Vorleseprogramm — dafür braucht es NVDA oder JAWS unter
   Windows, und die Antwort kann UM-04 bestätigen, nicht umwerfen.
4. ~~**Der Aufgabenbereich des Add-ins.**~~ **Teilweise beantwortet in T-180:** Methode und
   Urteilsraster stehen jetzt in **Abschnitt 11**, die Aufnahme selbst führt integration-dev.
   Offen bleibt die **eine Fassung** des Fristhinweises für beide Flächen — V-03/V-04 (T-158,
   Wiedervorlage in T-165) gegen `TodoFormDialog.tsx:227`. Zwei Fassungen desselben Satzes laufen
   auseinander, sobald jemand eine davon ändert.
5. **Wie viele Sätze der Aufgabenbereich tatsächlich trägt.** Abschnitt 11 gibt das Verfahren und
   die Dateimenge (32 Dateien, davon 7 mit JSX), nicht die Zählung. Die gehört in die Aufnahme von
   integration-dev, weil sie dort gemessen wird und nicht hier geschätzt.
6. **Ob die fünf Träger aus Abschnitt 1.2 zu streichen sind.** Sie sind aufgenommen und vorläufig
   gesperrt, nicht beurteilt. Dieses Papier vergrößert seine Streichliste nicht, während sie noch
   unabgearbeitet ist.
7. **Ob der Fokus nach dem Nachtragen wirklich verlorengeht** (12.5). Der Befund ist aus der
   Bauart geschlossen — zwei verschiedene Bausteine an derselben Stelle, umgeschaltet durch den
   soeben eingetragenen Wert —, nicht am laufenden Fenster gemessen. Die Messung gehört zu
   e2e-tester; die Anforderung in 12.5 gilt unabhängig von ihrem Ausgang, die **Bauart** der
   Behebung entscheidet ui-designer.
8. **Ob die gerundete Zeit im `<output>` der Gruppe den Erfolg tatsächlich ansagt** (12.1). Der
   Knoten trägt die Rolle `status` und entsteht bei einem Wertwechsel neu; ob daraus eine Ansage
   wird, ist mit keiner Vorlesehilfe geprüft. Solange das offen ist, trägt der Toast die Auskunft.
9. **Die drei Nachbarbefunde aus 12.6 und 12.8** — der vierte „Leistung nachtragen" mit anderem
   Ziel, der Anlegen-Zweig desselben Dialogs und der Löschweg mit demselben Rumpf. Alle drei sind
   benannt, keiner ist beauftragt, und keiner ist Bedingung dafür, daß Z-49 geschlossen ist.

---

## 11. Der Aufgabenbereich des Add-ins — Methode und Urteilsraster für integration-dev

**Grundlage:** E-078 Nachtrag **Punkt 7** — die Regel ist eine Produktregel, keine Regel einer
Fläche. Daß die Aufnahme aus T-163 nur `apps/web` umfaßt, ist eine Frage der **Hoheit** und nicht
des **Geltungsbereichs**. Dieser Abschnitt ist der Teil, der drüben gilt; er ist so geschrieben,
daß integration-dev ihn anwenden kann, ohne hier nachzufragen.

**Was integration-dev tut:** die Aufnahme für `apps/outlook-addin/**` und
`apps/local-api/src/routes/addin/**` nach demselben Muster wie Abschnitt 4 — Befund, Regel je
Textsorte, Einzelurteile mit Datei und Zeile, eigene Sperrliste, eigene Streichliste, eigene
Umbauliste. **Was integration-dev nicht tut:** dieses Papier ändern. Beide Aufnahmen sind eigene
Artefakte; die zweite verweist auf die erste.

### 11.1 Das Urteilsraster gilt unverändert

Die sechs Buchstaben aus Abschnitt 2 sind unverändert anzuwenden: **D** doppelt, **S** erklärt das
Sichtbare, **V** auf Vorrat gegen **F** Folge, **A** Abwesenheit, **B** begründet eine Absage.
Ebenso der vierte Weg: **V** zusammen mit **F**, **A** oder **B** wird **offengelegt**, nicht
gestrichen.

### 11.2 Vier Unterschiede der Fläche, und sie verschieben das Urteil

Sie sind keine Ausnahmen vom Raster, sondern Gewichte darin. Die Begründungen stehen bereits im
Kopfkommentar von `create-gate.ts`; hier sind sie als Regel formuliert.

**AB-1 — Es gibt keine zweite Fläche. B wiegt schwerer, D wiegt gleich.**
Der Aufgabenbereich lebt in einem Outlook-Fenster an einer bestimmten Nachricht. Wer dort vor
einer Absage steht, kann nicht in eine andere Ansicht wechseln, um die Antwort zu suchen — es gibt
keine. Ein **B**-Satz, der drüben ein Komfort wäre, ist hier der Unterschied zwischen Weitermachen
und Aufgeben. Umgekehrt bleibt **D** genauso streng: Zwei Fassungen einer Aussage in einer schmalen
Spalte stehen fast immer im selben Blickfeld.

**AB-2 — Von den drei Trägern der Offenlegung stehen nur zwei zur Verfügung.**
**T1 Zustandsbindung** und **T2 Handlungsbindung** gelten unverändert. **T3 Handbuch gilt nicht**
für Auskunft, die zur Vollendung der laufenden Handlung gebraucht wird: Der Benutzer ist in
Outlook, nicht in Takt, und ein Verweis aufs Handbuch wäre dort eine Sackgasse mit Anleitung. T3
bleibt zulässig allein für Hintergrund, den niemand braucht, um das Todo anzulegen. **Ein vierter
Träger ist auch hier eine Entscheidung, keine Wahl des Umsetzenden** (E-078 Nachtrag Punkt 6).

**AB-3 — Der Text kommt aus einer fremden E-Mail, und das begrenzt, was ein Satz sagen darf.**
`callnumber/labels.ts` hält die Regel schon fest: Die Sätze nennen den **abgelehnten Wert nicht**
(B-12.1). Er steht sichtbar im Feld daneben und ist dort als Rohwert gekennzeichnet; ihn in eine
Meldung zu heben, ließe ihn wie eine Aussage der Anwendung aussehen. **Diese Regel ist keine
Kürzungsfrage und wird von keinem Textdurchgang berührt.**

**AB-4 — Die Anrede ist entschieden, und die beste ist keine.**
E-080: Takt siezt, auch im Aufgabenbereich; sechs Stellen ziehen nach. E-080 Punkt 4 geht vor:
Wo ein Satz ohne Anrede auskommt, ist das die kürzere und die ruhigere Fassung. „Keine Call-Nummer
im Text gefunden — sie lässt sich eintragen." ist das Vorbild. **Anredefreie Fassungen sind kein
Ausweichen vor E-080, sondern ihr vierter Punkt.**

### 11.3 Die Methode: wie die Aufnahme ihre Dateien findet

Abschnitt 1.1 gilt wörtlich. Konkret für diesen Bereich:

1. **32 Quelldateien, davon 7 mit JSX.** Wer über die Endung `.tsx` geht, liest 7 von 32. Die
   Aufnahme liest alle 32 und **nennt diesen Bruch im Bericht** (Regel M-01).
2. **Satzfilter** (Abschnitt 1.1, Lauf 2) zum Sortieren, nicht zum Begrenzen.
3. **Bauartfilter** (Lauf 3) für Beschriftungen ohne Satzzeichen — im Aufgabenbereich 19 von 25
   `.ts`-Dateien als Kandidatenliste.
4. **Kein Zeichenfilter auf Umlaute.** Er hätte `create-gate.ts` nicht gefunden; die Messung steht
   in Abschnitt 1.1.
5. **Regel M-02** gilt auch drüben: Wandert Text aus JSX in eine reine Funktion, nennt der
   Kopfkommentar den Grund und die Fläche. `field.ts`, `callnumber/labels.ts` und `create-gate.ts`
   tun das; die nächste solche Datei tut es auch.

### 11.4 Was drüben mit hoher Wahrscheinlichkeit auf die Sperrliste gehört

**Kein Urteil — eine Warnliste.** Das Urteil fällt integration-dev in seiner eigenen Aufnahme. Ich
nenne sie, weil ein Textdurchgang, der ohne Vorwarnung startet, genau hier zuerst kürzt.

| Ort | Was er trägt | Buchstabe | Woran er hängt |
|---|---|---|---|
| der Fristhinweis am Fristfeld | „Ein Tag, keine Uhrzeit. … leer lassen heißt: keine Frist." | **A** | **V-03/V-04** (T-158, T-165), E-074 Punkt 4, A-19.1, A-19.7 — und **E-078 nennt diesen Satz namentlich als Beispiel dafür, was nicht fällt**. Sein Geschwister ist SP-04 |
| `create-gate.ts` — die fünf Sperrgründe | „Der Titel fehlt." usw. | **B** | **V-11** aus T-154. Ein gesperrter Hauptknopf ohne Grund ist die Fläche, an der ein Benutzer stehenbleibt |
| `callnumber/labels.ts` — `REJECTION_LABEL` und `INPUT_REJECTION_LABEL` | zehn Absagegründe, je einer pro Ablehnungsgrund | **B** | T-041, T-046, **R-15** (zwei Todos zum selben Kundenvorgang, Zeit auf zwei Vorgängen), E-045 |
| das Angebot bei vorhandenem Call | auf das vorhandene Todo buchen statt ein Duplikat anlegen | **F** | Pflichtflow, `CLAUDE.md`. Der Satz nennt die Folge einer Wahl, die sich in der Abrechnung auswirkt |
| die Sätze zu Standard-Tags bei Anlage aus dem Add-in | daß sie von selbst hinzukommen | **A** | Pflichtflow „Standard-Tags", Geschwister von ST-06 Zeile `TodoFormDialog.tsx:247` |

**Und die Sperre aus E-078 Punkt 3 gilt drüben genauso:** Kein Satz mit Anforderungs-ID oder
Befundnummer fällt ohne Zustimmung des Prüfers, der ihn verlangt hat. Für den Fristhinweis ist das
namentlich **T-165**.

### 11.5 Die eine Stelle, an der beide Aufnahmen sich berühren

Der Fristhinweis steht **zweimal**: hier als SP-04 (`TodoFormDialog.tsx:227`), drüben am Fristfeld
des Aufgabenbereichs. E-078 Nachtrag Punkt 7 verlangt **eine** Fassung für beide Flächen, und
nennt auch den Zeitpunkt: die Wiedervorlage V-03/V-04 in T-165, nicht einen späteren Durchgang.

**Das ist keine Aufgabe, die eine der beiden Seiten allein erledigt.** Wer zuerst kürzt, erzeugt
die Abweichung, die der Punkt verhindern soll. Vorschlag an den Orchestrator: ein Auftrag, zwei
Dateien, eine Fassung — und die Vorlage geht an T-165, wie E-080 Punkt 3 es für die Anrede bereits
festhält.

---

## 12. Der Ausgang des Nachtragswegs — Fluß und Wortlaut (Nachtrag T-203, O-HX)

**Grundlage:** T-200 **Z-49** (blockierend), **E-034**, E-078 Punkt 1 und Punkt 3, Regel **S-13**,
A-8.6, A-13.5.

**Warum dieser Wortlaut hier steht und nicht im Prüfbericht.** E-078 Punkt 3 trennt Verfassen und
Genehmigen. spec-ux-reviewer hat den Befund gemessen und einen Wortlaut **vorgeschlagen**; er kann
ihn nicht zugleich verfassen und freigeben. Dies ist die **Fassung**, die ihm vorgelegt wird. Sein
Vorschlag steht in **12.7** daneben, mit dem einen Punkt, in dem ich von ihm abweiche — und dieser
Punkt ist keine Geschmacksfrage, sondern seine eigene Begründung aus Z-48, eine Ebene weiter
gedacht.

**Was hier nicht gemacht wird.** Kein `error` am Feld (E-034, P-6). Kein Pflichtfeld (Z-47). Kein
neuer Mechanismus, keine neue Fläche, kein neuer Baustein — alles, was dieser Abschnitt verlangt,
ist im Bestand vorhanden und an anderer Stelle bereits gebaut.

### 12.1 Nutzerziel und Erfolgskriterium

**Nutzerziel.** Eine Tagesgruppe, die ohne Leistungstext beim Export stehenbleibt, so weit
bringen, daß sie mitgeht.

**Erfolgskriterium.** Der Benutzer verläßt den Weg **wissend, ob er sein Ziel erreicht hat** — und
zwar über Auge **und** Ohr. Nicht: „gespeichert". Nicht: „Buchung geändert."

**Warum das Kriterium nicht schon erfüllt ist, gemessen an der Fläche:**

- Bleibt die Gruppe gesperrt, steht ihre Sperrmeldung in `ExportGroups.tsx` **unverändert** in
  ihrem dauerhaften Wirt (`<div className="live-region" role="status">`). Eine unveränderte
  Zeichenkette in einer bestehenden Live-Region löst keine Ansage aus. Das ist die Bauart, nicht
  ein Fehler dieser Fläche — die Fläche ist genau richtig gebaut, sie hat nur nichts Neues zu
  sagen.
- Wird die Gruppe frei, **verschwindet** die Meldung. Eine Entfernung wird ebensowenig angesagt.
- Es gibt **einen** Kandidaten für eine schon vorhandene Ansage des Erfolgs: die gerundete Zeit
  steht in `ExportGroups.tsx` in einem `<output>` mit `key={quarters}`, und `<output>` trägt die
  Rolle `status`. Wechselt der Wert von „—" auf „0,75", entsteht der Knoten neu.
  **Nicht gemessen** — weder mit Vorlesehilfe noch im Prüflauf. Bis das gemessen ist, gilt: der
  Toast trägt die Auskunft, nicht die Fläche.

### 12.2 Der Fluß, vollständig

| Schritt | Was | Was der Benutzer sieht und hört | Fehlerpfad |
|---|---|---|---|
| **Start** | Exportvorschau, Gruppe aufgeklappt. Die Zeile ohne Leistung zeigt „— keine Leistung erfasst —", daneben „Leistung nachtragen" | Die Sperrmeldung der Gruppe steht sichtbar darüber, mit Grund | — |
| **Aktion** | „Leistung nachtragen" | `BookingFormDialog` im Änderungsfall öffnet, Fokus hinein, Titel „Buchung bearbeiten" | — |
| **Vorwarnung** | steht bereits im Dialog | `BILLING_NOTE_MAY_BE_EMPTY` unter dem Feld (SP-08) — sie sagt vor dem Absenden, was ein leeres Feld bedeutet | — |
| **Absenden** | „Speichern" | Dialog schließt, Fokus zurück (12.5) | Absage des Dienstes: Dialog bleibt offen, Eingaben stehen, Grund wörtlich in der Fehlerfläche (S-10). **Kein** Toast |
| **Rückmeldung** | Toast nach der Lage (12.3) | Ton, Titel und Rumpf sagen, ob das Ziel erreicht ist | Scheitert die **Auskunft** über die Gruppe, ist die Buchung trotzdem geändert — Lage **L4**, nie eine Fehlermeldung |
| **Erfolg** | Gruppe geht mit | Sperrmeldung verschwunden, Kontrollkästchen wieder bedienbar, gerundeter Wert steht | — |
| **Sackgasse** | keine | In jeder Lage steht der Rückweg an derselben Stelle wie vorher: die Zeile der Buchung mit ihrem Bearbeiten-Griff | — |

**Drei Eingänge, ein Ausgang.** „Leistung nachtragen" steht an **vier** Stellen im Produkt
(gemessen 2026-09-06, `ExportGroups.tsx`, `TemplatePreview.tsx` zweimal, `ExportScreen.tsx`).
Drei davon öffnen `BookingFormDialog`; die vierte — die Liste der ausgelassenen Gruppen im
**Ergebnis** eines Laufs — führt statt dessen über `navigate` zum Todo, wo die Buchung erst
gesucht werden muß. **Derselbe Knopfname, zwei Entfernungen zum Ziel.** Das ist ein eigener
Befund und kein Wortlautproblem; er steht in 12.6.

Weil alle Dialogwege durch **eine** Absendefunktion laufen — `BookingFormDialog` hat fünf
Aufrufstellen (`ExportScreen`, `TemplatePreview`, `TodoDetailScreen`, `TimeScreen`,
`BookingsScreen`) —, wird der Ausgang **einmal** gebaut und wirkt an allen fünf Flächen.

### 12.3 Die Zustandsmaschine: vier Lagen, drei Fassungen

**Ein Satz reicht nicht, und zwei reichen auch nicht.** Der Grund ist nicht Ausführlichkeit,
sondern Wahrheit: Es gibt eine dritte Lage, in der Takt **nicht weiß**, was aus der Gruppe wird,
und sie sieht der ersten zum Verwechseln ähnlich.

**Woran die Anwendung die Lage erkennt.** An **einem** Aufruf, und er ist bereits gebaut und in
derselben Datei bereits importiert: `loadDayGroupInsight(todoId, calendarDayOf(<neuer Anfang>))`
aus `app/dayGroup.ts`. Er fragt die **Vorschau**, also denselben Plan, mit dem der Lauf rechnet
(R-17) — dieselbe Gruppenbildung, dieselbe Rundung, dieselbe Prüfung auf fehlende Leistung.
`TimerContext.tsx` (`reportStopped`) benutzt ihn seit T-045 für genau diese Frage nach dem
Timerstopp. **Der Nachtragsweg bekommt damit keine neue Bauart, sondern die vorhandene.**

| Lage | Erkannt an | Ton | Titel | Rumpf |
|---|---|---|---|---|
| **L1 — die Gruppe trägt Text** | `insight !== null`, `previewProblem === null`, `blockedReason === null` | `success` | „Buchung geändert." | „Die Tagesgruppe dieses Todos ändert sich mit." — **unverändert wie heute** |
| **L2 — die Gruppe bleibt ohne Leistung** | `blockedReason !== null` | `warning` | „Buchung geändert — noch nicht abrechenbar." | „Für diesen Tag steht auf diesem Todo noch keine Leistung. Ohne sie bleibt die Tagesgruppe (1 h 20 min) beim Export stehen." |
| **L3 — Takt weiß es nicht** | `previewProblem !== null` | `warning` | „Buchung geändert — der Exportwert ließ sich nicht abfragen." — **angeglichen an den Stoppdialog, T-211**; die frühere Fassung „… — Exportwert unbekannt." ist zurückgezogen (12.9) | „Was diese Tagesgruppe beim Export ergibt, konnte Takt gerade nicht ermitteln: 〈Satz des Dienstes, wörtlich〉" |
| **L4 — es gibt nichts zu sagen** | `insight === null` **oder** die Abfrage selbst scheitert | `success` | „Buchung geändert." | **kein Rumpf** |

**Die Reihenfolge der Prüfung ist Teil der Fassung: `previewProblem` vor `blockedReason`.** Sie
ist nicht Geschmack, sondern die Stelle, an der derselbe Fehler eine Ebene tiefer entstehen würde:
`dayGroup.ts` liefert im Fehlerfall `blockedReason: null` **und** eine Meldung daneben. Wer nur
`blockedReason !== null` fragt, hält eine nicht beantwortete Frage für ein „alles gut" — und
schreibt wieder eine Erfolgsmeldung über einen Zustand, den die Anwendung nicht kennt. Genau
diesen Fehler hat T-045 in `dayGroup.ts` behoben; sein Kommentar hält ihn wörtlich fest.

**Warum die drei Fassungen in jeder Lage wahr sind:**

- **L1** behauptet nichts über den Export, sondern nennt eine **Folge** (F): Die Rundung hängt an
  der Gruppe, also ändert eine geänderte Buchung die Gruppe mit. Das ist auch dann wahr, wenn die
  Gruppe nie gesperrt war — der Regelfall an den vier anderen Aufrufstellen des Dialogs.
- **L2** spricht eine **Abwesenheit** aus (A) und nennt ihre Folge. Beides kommt aus der Vorschau,
  also aus derselben Rechnung wie der Lauf; es ist keine Ableitung aus dem Feldwert.
- **L3** sagt, was Takt weiß, und hört auf, wo es aufhört. Der Grund des Dienstes steht wörtlich
  (S-10).
- **L4** sagt nur, was geschehen ist. **Eine gescheiterte Auskunft macht aus einer gelungenen
  Speicherung nie eine Fehlermeldung** — die Buchung ist geändert, und das ist die Auskunft, die
  dem Benutzer gehört.

**Und der Fall, um den es E-034 wirklich geht, landet in L1.** Eine Buchung ohne Leistung in einer
Gruppe, die eine **andere** Buchung mit Text trägt, ist kein Fehler — sie ist der ausdrückliche
Sinn von E-034. In dieser Lage wird nichts gemahnt, nichts gewarnt und nichts Falsches gesagt.
Das ist die Probe, an der eine wertgebundene Fassung scheitert (12.7).

### 12.4 Wortlaut: die Entscheidungen im einzelnen

**„noch nicht abrechenbar" und nicht „gesperrt".** „Gesperrt" ist im Produkt bereits vergeben und
meint etwas anderes: Nach einem Export sind die enthaltenen Buchungen gesperrt (SP-17). Dasselbe
Wort für zwei Zustände wäre die Verwechslung, die SP-15 an „abgerechnet" und „nicht abgerechnet"
gerade mühsam auseinanderhält.

**„noch nicht abrechenbar" und nicht „Speichern nicht möglich".** Gespeichert **wurde**. Eine
Fassung, die das bestreitet, ist falsch; eine Fassung, die den Vorgang zur Pflicht erklärt, baut
den Pflichtcharakter wieder ein, den E-034 ausdrücklich nicht will (Z-47, T-200 Risiken). Der Ton
ist `warning`, **nie** `danger`: `toasts.failure` bleibt dem Fall vorbehalten, in dem nichts
geschehen ist.

**Der Rumpf von L2 trägt zeichengleich das Satzpaar des Stoppdialogs — nicht seinen ganzen Rumpf.**
**Berichtigt in T-211 nach T-200 Z-58; die erste Fassung dieses Absatzes sagte „der Rumpf", und das
war zu weit.** Gemessen lautet der Rumpf des Stopps `${booked} Für diesen Tag steht …`, also mit
*„Gebucht: 1 h 20 min."* davor. Was wandert, sind die **zwei Sätze danach**; die Angabe der
gebuchten Dauer bleibt beim Stopp. Die allgemeine Fassung dieser Teilung — sie gilt für L3 ebenso
und dort mit einem Satz mehr — steht in **12.9**.

`TimerContext.tsx` sagt heute
nach dem Timerstopp: *„Für diesen Tag steht auf diesem Todo noch keine Leistung. Ohne sie bleibt
die Tagesgruppe (…) beim Export stehen."* Dieselbe Lage, dieselbe Auskunft, **derselbe Satz** —
nicht eine zweite Fassung mit „weiterhin" statt „noch". Zwei Abschriften eines Hinweises laufen
auseinander, sobald eine von beiden gepflegt wird (Befund C-24, Designsystem Regel 8); genau
deshalb steht `BILLING_NOTE_MAY_BE_EMPTY` in `lib/labels.ts` und nicht zweimal in den Ansichten.
**Daraus folgt eine Auflage an die Umsetzung:** Der Satz wandert nach `lib/labels.ts` als
Textbaustein mit der Sekundenzahl als Parameter, und **beide** Stellen holen ihn dort. Der
Kopfkommentar nennt Grund und Flächen (Regel M-02).

**Der Titel des Stoppdialogs wird dabei nicht angefaßt.** Er lautet „Zeit gebucht auf „X" — aber
noch nicht abrechenbar." und trägt den Namen des Todos davor; der Nachtragsweg hat ihn nicht.

**Präzisiert in T-211:** Die erste Fassung dieses Absatzes sagte, der Titel nenne den **Anlaß** und
der Rumpf die **Lage**. Das stimmt für den Rumpf und ist für den Titel zu grob — er trägt beides,
in der Form `〈Anlaß〉 — 〈Lage〉`. Verschieden sind die **Anlässe** („Zeit gebucht auf „X"" gegen
„Buchung geändert"), gleich ist die **Lage** („noch nicht abrechenbar"). Genau diese Trennung
entscheidet auch L3, und sie steht als Regel **S-13a** in 12.9.

**Kein Rückweg am Toast.** Regel S-13 erlaubt einen, und hier ist er falsch: Der Benutzer steht
auf der Fläche, die den Rückweg trägt — die Zeile der Buchung mit ihrem Bearbeiten-Griff, an allen
fünf Aufrufstellen. Ein zweiter Weg im Toast wäre die Verdopplung, die E-078 Punkt 5 meint.

**Keine Erklärung im Toast, warum die Gruppe zählt und nicht die Buchung.** Sie steht bereits
zweimal auf demselben Weg: als `BILLING_NOTE_MAY_BE_EMPTY` unter dem Feld und in der Beschreibung
des Dialogs („Der gerundete Exportwert hängt an der Tagesgruppe, nicht an dieser Buchung."). Der
Toast sagt die **Lage**, nicht die Regel.

**Der Dialog selbst bekommt keinen zusätzlichen Satz — und das ist eine Entscheidung, keine
Auslassung.** spec-ux-reviewer merkt an, der aus diesem Weg geöffnete Dialog nenne seinen Anlaß
nicht. Richtig, und er soll es auch nicht: Ein Satz über die Sperre der Gruppe wäre an vier der
fünf Aufrufstellen ein Satz **auf Vorrat** (V), und der Dialog trägt die Sache bereits — die
Beschreibung nennt die Tagesgruppe, der Hinweis unter dem Feld nennt die Folge. Wollte man den
Anlaß dennoch nennen, ginge das **nur** zustandsgebunden (T1) mit einem Anlaßvermerk durch alle
fünf Aufrufstellen; das ist eine eigene Aufgabe mit eigener Vorlage und **nicht** Bedingung
dafür, daß Z-49 geschlossen ist.

### 12.5 Tastatur und Fokus — und der Befund, den dieser Weg dabei aufdeckt

**Die Zusage.** `FormDialog` setzt den Fokus beim Öffnen hinein und beim Schließen zurück;
`tests/e2e/focus-return-after-dialog.spec.ts` mißt das.

**Der Befund: dieser Weg zerstört sein eigenes Rückkehrziel.** In `ExportGroups.tsx` steht an der
Buchungszeile

> `entry.note === "" ? <Button …>Leistung nachtragen</Button> : <IconButton … />`

— **zwei verschiedene Bausteine an derselben Stelle**, umgeschaltet durch genau den Wert, den der
Benutzer soeben eingetragen hat. Gelingt das Nachtragen, wird der auslösende Knopf nicht
beschriftet, sondern **ersetzt**; der Knoten, auf den der Fokus zurückkehren soll, ist dann nicht
mehr da. In `TemplatePreview.tsx` liegt derselbe Vorgang milder: dort bleibt der Baustein und nur
seine Beschriftung wechselt von „Leistung nachtragen" auf „Bearbeiten" — der Fokus überlebt, aber
er landet auf einem Bedienelement, das jetzt **anders heißt**, ohne daß das gesagt würde.

**Nicht gemessen.** Beides ist aus der Bauart geschlossen, nicht am laufenden Fenster geprüft.
Der Befund gehört als Meßauftrag an e2e-tester, und die Messung ist billig: nach dem Speichern
`document.activeElement` prüfen — steht er auf `body`, ist der Tastaturbenutzer an den Anfang der
Seite geworfen, und zwar im Pflichtklickpfad „Exportstatus an jeder Stelle sichtbar".

**Die Anforderung, unabhängig vom Ausgang der Messung.** Nach dem Speichern liegt der Fokus auf
einem Element, das den Benutzer **an seiner Buchung stehenläßt** — nie auf `document.body`. Zwei
Wege erfüllen das, und die Wahl zwischen ihnen ist eine Frage der Dichte und damit **ui-designers**
Entscheidung (E-078 Punkt 4):

1. **Ein Baustein, zwei Beschriftungen** — wie in `TemplatePreview.tsx`. Der Knoten überlebt, der
   Namenswechsel bleibt; die Auskunft darüber trägt der Toast.
2. **Zwei Bausteine, aber ein stabiles Rückkehrziel** — der Fokus kehrt auf den Aufklappgriff der
   Gruppe zurück statt auf die Zeile. Kostet eine Ebene Weg, verliert aber nichts.

### 12.6 Zwei Nachbarbefunde, benannt und nicht mitbeauftragt

**(a) Derselbe Knopfname, zwei Entfernungen.** Die drei Knöpfe in der Vorschau öffnen den Dialog
an der Buchung; der vierte, in der Liste der ausgelassenen Gruppen **nach** einem Lauf
(`ExportScreen.tsx`), springt statt dessen auf das Todo. Dort muß der Benutzer die richtige
Buchung des richtigen Tages erst suchen — der Weg endet nicht in einer Sackgasse, aber er hält
nicht, was der Name an den drei anderen Stellen verspricht. **Urteil:** ein Fluß-, kein
Wortlautbefund. Entweder führt auch dieser Knopf an die Buchung, oder er heißt anders. Gehört
gemeinsam mit dem Ergebnisblock entschieden und nicht nebenbei.

**(b) Der Anlegen-Zweig desselben Dialogs schweigt zur selben Lage.** „Zeit von Hand erfassen"
kann ebenso eine Tagesgruppe ohne Leistung erzeugen; der Erfolgstoast sagt dazu nichts. Er sagt
nichts **Falsches** — das ist der Unterschied zu O-HX und der Grund, warum dieser Punkt nicht
blockierend ist —, aber es bleibt dieselbe Handlung mit zwei Antworten: Über den Timerstopp
erfährt der Benutzer die Sperre, über die Buchung von Hand nicht. **Vorschlag:** dieselbe
Zustandsmaschine aus 12.3 auch für den Anlegen-Zweig, mit einer Klammer zu S-13 — kommt in Lage
L2 ein Bewegungssatz aus der Domäne dazu, tritt der Sperrsatz an die Stelle unserer eigenen
Auskunft, und der Bewegungssatz bleibt der letzte. Zwei Sätze, nicht drei.

### 12.7 Der Vorschlag aus T-200 daneben — und der eine Punkt, in dem ich abweiche

**Sein Vorschlag** (Z-49, wörtlich): *„Der Rumpf der Erfolgsmeldung wird an den Wert gebunden.
Bleibt die Leistung leer, sagt er es … „Die Leistung ist weiterhin leer. Die Tagesgruppe geht
damit nicht in den Export.""*

**Was daran trägt, und es ist das meiste:** die Diagnose, die Richtung (der Toast ist der Kanal,
nicht das Feld), der Ton, die Absage an ein `error` am Feld, und die Sorte — **A**, eine
Abwesenheit, und damit ein Satz, der nach E-078 nicht fällt.

**Der Punkt, an dem ich abweiche: die Bindung.** „An den Wert gebunden" heißt, die Meldung hängt
an `note.trim() === ""`. Damit sagt sie den zweiten Satz — *„Die Tagesgruppe geht damit nicht in
den Export"* — auch dann, wenn die Gruppe eine **andere** Buchung mit Text trägt. Dann ist er
**falsch**, und zwar genau in dem Fall, den E-034 schützen will. Es wäre der heutige Fehler im
Spiegel: heute eine Erfolgsmeldung für eine mißlungene Handlung, dann eine Warnung für eine
gelungene.

**Und die Begründung dafür ist seine eigene.** Z-48 sagt: *„Gesperrt ist die **Tagesgruppe**,
nicht die Buchung. Eine einzelne Buchung ohne Leistung ist tadellos, solange eine andere Buchung
derselben Gruppe Text trägt … Ein `NoteField.error` an einer einzelnen Buchung könnte diese
Aussage gar nicht wahrheitsgemäß tragen."* Das gilt für den Toast genauso wie für das Feld. Der
Kanal ist eine Ebene höher, die **Bindung** muß es auch sein.

**Deshalb: an der Gruppe gebunden, nicht am Wert** — und das kostet nichts, was nicht schon da
wäre. Der Aufruf existiert, er ist in `BookingDialogs.tsx` bereits importiert, und die
Zustandsmaschine steht seit T-045 in `TimerContext.tsx`.

### 12.8 Akzeptanzkriterien für frontend-dev

Bedingungen der Freigabe, nicht Hinweise.

1. **Die Lage kommt aus `loadDayGroupInsight`**, gefragt mit dem **neuen** Anfangszeitpunkt
   (`calendarDayOf` des abgesendeten Wertes), nicht mit dem des geöffneten Datensatzes. Wer die
   Buchung auf einen anderen Tag schiebt, bekommt die Auskunft über die Gruppe, in der sie **jetzt**
   liegt.
2. **`previewProblem` wird vor `blockedReason` geprüft.** Ein nicht beantworteter Aufruf ist
   niemals L1.
3. **Vier Lagen, drei Fassungen**, zeichengleich nach der Tabelle in 12.3. L1 bleibt wortgleich
   wie heute. **Der Titel von L3 lautet „Buchung geändert — der Exportwert ließ sich nicht
   abfragen."** — die Lage trägt an beiden Flächen dieselben Worte (S-13a, 12.9). Die frühere
   Fassung „Exportwert unbekannt." wird **nicht** gebaut.
4. **Ton `warning` in L2 und L3, `success` in L1 und L4.** Nirgends `danger`; `toasts.failure`
   bleibt der nicht erfolgten Speicherung vorbehalten.
5. **Scheitert die Auskunft selbst** (der Aufruf wirft), gilt L4. Die Speicherung ist gelungen und
   wird als gelungen gemeldet. Keine Fehlerfläche, kein zweiter Versuch, kein Schweigen.
6. **Der Dialog wartet nicht auf die Auskunft.** Erst schließen und den Fokus zurückgeben, dann
   fragen, dann melden. Der Benutzer steht nie vor einem Dialog, der wegen einer Meldung noch
   offen ist.
7. **Der Lagesatz von L2 steht genau einmal im Bestand**, in `lib/labels.ts`, und wird von
   `TimerContext.tsx` und `BookingDialogs.tsx` gemeinsam benutzt. Der Baustein ist **das Satzpaar**
   („Für diesen Tag steht … beim Export stehen.") mit der Sekundenzahl als Parameter — **nicht** der
   ganze Rumpf des Stopps: *„Gebucht: 1 h 20 min."* bleibt beim Stopp und wandert nicht mit
   (T-200 Z-58). Der Wortlaut des Stoppdialogs ändert sich dabei **nicht** — er ist die Vorlage,
   nicht der Gegenstand.
7a. **Für L3 gilt dasselbe, mit einem Satz mehr auf der Bleibeseite.** Baustein ist der eine
   Lagesatz „Was diese Tagesgruppe beim Export ergibt, konnte Takt gerade nicht ermitteln:
   〈Satz des Dienstes〉". Beim Stopp bleiben **beide** Klammern: *„Gebucht: …"* davor und
   *„Die erfasste Zeit steht fest; der gerundete Wert steht in der Export-Ansicht."* dahinter.
   Der zweite wandert nicht, und der Grund steht in 12.9 — er verwiese an zwei der fünf
   Aufrufstellen auf die Fläche, auf der der Benutzer gerade steht.
8. **Am Feld ändert sich nichts.** Kein `error`, kein `required`, kein Tadel, keine Sperre des
   Absendeknopfes. `BILLING_NOTE_MAY_BE_EMPTY` bleibt zeichengleich stehen (SP-08).
9. **Kein Rückweg und keine Regel im Toast** (12.4).
10. **Der Fokus liegt nach dem Speichern nicht auf `document.body`** (12.5). Ist die Bauart des
    Rückkehrziels dafür zu ändern, geht das nur nach dem Wort des ui-designer.

**Vor dem Auftrag zu messen (E-087 Punkt 1), nicht aus diesem Papier zu übernehmen:** ob
„Buchung geändert." und „Die Tagesgruppe dieses Todos ändert sich mit." in `tests/**` oder
`apps/*/test/**` vorkommen. Stand meiner Messung vom **2026-09-06**: der Titel steht **einmal** im
Produkt und in **keinem** Prüffall; der Rumpf steht **zweimal** im Produkt — in `BookingDialogs.tsx`
(ändern) und in `TodoDetailScreen.tsx` (**löschen**) — und ebenfalls in keinem Prüffall. **Die
zweite Stelle wird von diesem Abschnitt nicht angefaßt**, trägt aber dieselbe Frage: Wer die
einzige Buchung mit Leistung löscht, hinterläßt eine gesperrte Gruppe und liest denselben Satz.
Das ist Nachbarbefund (c) und gehört zusammen mit (b) aus 12.6 entschieden.

### 12.9 Ein Zustand, ein Wortlaut — was wandert und was bleibt (Nachtrag T-211)

**Grundlage:** T-200 **Z-57 Auflage 1** („L3 nimmt die Worte des Stoppdialogs, oder das Papier sagt,
warum nicht") und **Z-58** (die Berichtigung an 12.4). Beide Auflagen sind dieselbe Frage auf zwei
Ebenen — Titel und Rumpf —, und sie bekommen deshalb **eine** Antwort.

#### Die Entscheidung, in einer Zeile

**Angeglichen.** Der Titel von L3 lautet

> **Buchung geändert — der Exportwert ließ sich nicht abfragen.**

Die Fassung „Buchung geändert — Exportwert unbekannt." aus der Vorlage ist **zurückgezogen**.

#### Die Regel dahinter, damit die nächste Fläche sie nicht neu entscheidet

> **Regel S-13a — Anlaß und Lage.** Ein Meldungstitel, der neben der Handlung eine **Lage** nennt,
> hat die Form `〈Anlaß〉 — 〈Lage〉.`
>
> - Der **Anlaß** gehört der Fläche. Er darf sich von Fläche zu Fläche unterscheiden und fällt
>   unter die sechs Wörter aus S-13: „Buchung geändert" sind zwei, „Zeit gebucht auf „X"" sind
>   vier.
> - Die **Lage** gehört dem Zustand, nicht der Fläche. Sie wird überall mit **denselben Worten**
>   benannt. Sie trägt keine eigene Längengrenze, weil sie nicht frei formuliert, sondern
>   **zitiert** ist — entschieden wird sie einmal, danach wird sie übernommen.
> - Gibt es die Lage im Bestand bereits, **weicht die neue Fläche ihr**, nicht umgekehrt.
> - Eine **Verknüpfung** zum Anlaß („aber") gehört zum Anlaß, nicht zur Lage.

Der letzte Punkt ist der, an dem sich sonst ein Streit entzündet hätte: Der Stopp sagt „… — **aber**
noch nicht abrechenbar.", der Nachtragsweg „… — noch nicht abrechenbar." Das ist **kein** zweiter
Wortlaut derselben Lage. Die Lage heißt an beiden Flächen „noch nicht abrechenbar"; das „aber"
setzt sie gegen den Anlaß „Zeit gebucht", den der Nachtragsweg nicht hat. **Die von Z-57
freigegebene Fassung von L2 ändert sich dadurch nicht** — sie steht zeichengleich wie genehmigt.

#### Dieselbe Teilung im Rumpf — das ist Z-58, eine Ebene allgemeiner

| Fläche und Lage | Anlaßsatz (bleibt) | Lagesatz oder -paar (wandert, zeichengleich) | Ortssatz (bleibt) |
|---|---|---|---|
| Stopp, L2 | „Gebucht: 1 h 20 min." | „Für diesen Tag steht auf diesem Todo noch keine Leistung. Ohne sie bleibt die Tagesgruppe (1 h 20 min) beim Export stehen." | — |
| Nachtragsweg, L2 | — | **dasselbe Satzpaar** | — |
| Stopp, L3 | „Gebucht: 1 h 20 min." | „Was diese Tagesgruppe beim Export ergibt, konnte Takt gerade nicht ermitteln: 〈Satz des Dienstes〉" | „Die erfasste Zeit steht fest; der gerundete Wert steht in der Export-Ansicht." |
| Nachtragsweg, L3 | — | **derselbe Satz** | — |

> **Zeichengleich wandert die Lage. Bei ihrer Fläche bleibt, was den Anlaß nennt und was auf einen
> Ort verweist.**

**Warum der Ortssatz nicht mitwandert — und warum das der Angleichung nicht widerspricht.** Er hat
zwei Hälften, und beide bleiben aus je eigenem Grund beim Stopp:

- *„Die erfasste Zeit steht fest"* — die Beruhigung, daß die Buchung selbst in Ordnung ist. Am
  Nachtragsweg sagt das bereits der **Titel** („Buchung geändert."). Sie wäre dort **D**.
- *„der gerundete Wert steht in der Export-Ansicht"* — ein **Verweis auf eine andere Ansicht**, und
  damit ein Rückweg in Worten. Über den ist in **12.4** schon entschieden: **kein Rückweg am
  Toast.** An zwei der fünf Aufrufstellen wäre er obendrein **S** nach Abschnitt 2 — in
  `ExportScreen` steht der Benutzer in eben dieser Ansicht, in `TemplatePreview` vor einer
  Vorschau, die denselben Wert führt.

Der Ortssatz ist damit **keine zweite Benennung der Lage**, sondern eine Aussage über einen Ort und
über eine bereits gesagte Beruhigung. Beides ist an den beiden Flächen verschieden, und die Regel
oben nimmt genau das aus der Angleichung heraus. Dasselbe Argument trägt „Gebucht: …": Der
Nachtragsweg bucht nichts, er ändert.

#### Warum angeglichen und nicht begründet abweichend

Die Auflage ließ beides zu. Drei Gründe für das Angleichen, und der dritte entscheidet:

1. **Es ist derselbe Zustand, erkannt an derselben Bedingung** (`previewProblem !== null`), aus
   demselben Aufruf (`loadDayGroupInsight`). Ein Zustand mit zwei Namen ist die Klasse, die diese
   Wellen viermal gekostet hat — und der Rumpf war ohnehin schon derselbe Satz. Ein gemeinsamer
   Rumpf unter zwei verschiedenen Titeln ist die unangenehmste Hälfte davon.
2. **Der Bestand hat den Wortlaut zuerst.** „Der Exportwert ließ sich nicht abfragen" steht seit
   T-045 im Produkt und ist geprüft. Die neue Fläche ist der Zugang, nicht der Maßstab.
3. **Die Gegenrichtung blockiert, und zwar etwas, das gerade frei ist.** Den Stopp auf die kürzere
   Fassung umzustellen wäre eine Änderung an einer Fläche, die AK 7 ausdrücklich schützt („er ist
   die Vorlage, nicht der Gegenstand"), sie brauchte eine eigene Vorlage und eine eigene Freigabe
   durch spec-ux-reviewer — und Z-49 ist heute **nicht** mehr blockierend. Ich nehme einen
   freigegebenen Auftrag nicht wieder in die Warteschlange, um vier Wörter zu sparen.

**Was die Angleichung kostet, damit es dasteht und nicht später als Entdeckung auftritt.** Der
Titel wächst von vier auf acht Wörter: „Buchung geändert — der Exportwert ließ sich nicht
abfragen." Nach S-13 wäre das zu lang; nach S-13a ist die Lage-Hälfte nicht die Stelle, an der
gekürzt wird, weil sie zitiert ist. **Der Preis ist real, und ich halte ihn für den kleineren:**
Ein Zustand mit zwei Namen kostet dauerhaft mehr als ein Titel mit vier Wörtern mehr.

**E-087, heute gemessen, damit der Auftrag nicht auf dieses Papier vertraut** (ripgrep über den
Arbeitsbaum, 2026-09-06, ohne `git grep` — siehe Nachtragskopf):

| Wortlaut | Im Produkt | In `tests/**` und `apps/*/test/**` |
|---|---|---|
| „der Exportwert ließ sich nicht abfragen" | **einmal**, `TimerContext.tsx` | **keine Zusicherung** |
| „aber noch nicht abrechenbar" | **einmal**, `TimerContext.tsx` | **keine Zusicherung** — aber `tests/e2e/timer-stop-announcement.spec.ts` **zitiert den Wortlaut in einem Kommentar**. Er würde bei einer Änderung still veralten und nicht rot |
| „Was diese Tagesgruppe beim Export ergibt, konnte Takt gerade nicht ermitteln" | **einmal**, `TimerContext.tsx` | keine |
| „Exportwert unbekannt" | **nirgends** | keine |

Die zweite Zeile ist der Beleg zu Grund 3 in Sachform: Eine Änderung am Stopp wäre nicht nur
ungenehmigt, sie wäre auch **stumm** falsch geworden.

#### Wiedervorlage, mit Auslöser statt mit „später"

Sobald die Trennung **„Export nicht eingerichtet"** gegen **„Abfrage fehlgeschlagen"** existiert
(T-200 Offene Frage 5, Aufgabe an domain-dev/local-api), zerfällt L3 in **zwei** Lagen, und damit
werden **beide** Titel ohnehin neu geschrieben. Das ist der Zeitpunkt, an dem „lang oder kurz" für
Stopp und Nachtragsweg **zusammen** zu entscheiden ist — nicht vorher und nicht je Fläche. Bis
dahin gilt die angeglichene Fassung.

##### Berichtigung T-219 — dieser Auslöser löst nichts aus (O-IV)

**Der Fehler, und er ist meiner.** Die Bedingung oben hängt an **T-200 Offene Frage 5**. Das ist
eine Frage an den Orchestrator, sie ist **nicht beantwortet** und sie steht **nicht auf dem
Board**. Damit wartet die Wiedervorlage auf ein Ereignis, das von selbst nie eintritt — genau die
Bauart, die ich in 12.10 an „später" gerügt und hier eine Zeile weiter selbst gebaut habe. Ein
Auslöser, den niemand auslöst, ist kein Auslöser, sondern ein „später" mit einer Fußnote.

**Der neue Anker, und er fährt ohnehin.** Die Wiedervorlage hängt ab sofort an **O-II**
(`dayGroup.ts` liefert im Fehlerfall keinen Grund — frontend-dev, auf dem Board). Der Grund ist
kein Behelf, sondern der Ort selbst: **Wer den Nachtragsweg baut, öffnet `dayGroup.ts`.** L3 wird
an `previewProblem` erkannt, und `previewProblem` entsteht in dieser Datei. Es gibt keinen Weg, die
vier Lagen aus 12.3 zu bauen, ohne diese Datei zu lesen.

**Die Bedingung, in einem Blick prüfbar — und sie ist kleiner, als sie in 12.10 aussah:**

> **Die Wiedervorlage fällt an, sobald `previewProblem` mehr trägt als eine Zeichenkette.**
> Solange dort `errorMessage(cause)` steht und sonst nichts, kann keine Fläche die zwei Lagen
> unterscheiden, und die angeglichene Fassung bleibt richtig. Steht daneben der **Schlüssel** der
> Absage, sind es zwei Lagen, und beide Titel werden zusammen neu geschrieben.

**Warum das kleiner ist als „der Dienst muß es liefern".** In 12.10 Punkt 2 steht, die
Unterscheidung „müßte der Dienst liefern". Am Code nachgelesen (2026-09-06, ripgrep über den
Arbeitsbaum; **gelesen, nicht laufen gesehen**) stimmt das nur zur größeren Hälfte:

- `apps/web/src/api/client.ts` führt neben `errorMessage` bereits **`errorCode`** und nennt ihn im
  Kommentar *„die einzige Größe zum Verzweigen"*.
- `apps/web/src/app/dayGroup.ts` ruft im `catch` **`errorMessage(cause)`** und wirft den Schlüssel
  damit weg. Der Aufrufer bekommt einen Satz, aus dem er den Fall nur **raten** könnte — und genau
  dieses Raten hat T-045 an dieser Stelle beseitigt.

Die Unterscheidung, auf die die Wiedervorlage wartet, ist damit **zur kleineren Hälfte schon da**
und wird in der Oberfläche verworfen. Ob sie **fachlich** reicht — ob die Schlüssel dieses Weges
„nicht eingerichtet" von „fehlgeschlagen" wirklich trennen —, ist eine Frage an den Dienst und
gehört auf das Board; siehe die Berichtigung zu 12.10 unmittelbar darunter und den Vorschlag in
14.9. **Dieser Abschnitt entscheidet nichts über den Dienst.** Er nimmt der Wiedervorlage nur die
Bedingung weg, die niemand erfüllt, und gibt ihr eine, an der jemand vorbeikommt.

### 12.10 Ohne eingerichteten Export ist L3 der Regelfall (Z-57 Auflage 2)

**Der Sachverhalt, am Baum nachgelesen.** `app/dayGroup.ts` fängt den Wurf der Vorschau ab und sagt
im Kommentar, wann er kommt: *„Ohne Vorlage oder ohne Exportordner gibt es keine Vorschau."* Der
`catch`-Zweig liefert dann `quarters: null`, `blockedReason: null` und `previewProblem` gefüllt —
**also L3**, nicht L4. `insight === null` (L4) entsteht allein, wenn es an diesem Tag auf diesem
Todo **nichts Offenes** gibt.

**Was daraus folgt.** In einem frisch eingerichteten Takt ist L3 nicht der Ausnahmefall, sondern
die Antwort auf **jede** Buchungsänderung — bisher nach jedem Timerstopp, nach diesem Abschnitt
zusätzlich an den fünf Aufrufstellen des `BookingFormDialog`. Die Fassung wird also sechsmal so oft
gelesen wie beim Verfassen angenommen.

**Trotzdem wird gebaut wie vorgelegt, und zwar aus drei Gründen:**

1. **Die Fassung sagt Wahres.** Takt weiß den Exportwert nicht, und der Grund steht daneben.
2. **Die saubere Trennung ist kein Wortlautproblem.** `previewProblem` ist eine Zeichenkette; die
   Unterscheidung „nicht eingerichtet" gegen „fehlgeschlagen" müßte der Dienst liefern. Sie hier
   zu erfinden hieße, sie aus dem Fehlertext zu **raten** — das ist genau die Ableitung, die T-045
   in `dayGroup.ts` beseitigt hat.
3. **Gleichlauf mit dem Stopp ist besser als eine zweite Sonderregel.** Eine Fläche, die in
   derselben Lage schweigt, während die andere warnt, ist der Zustand vor dieser Aufgabe.

**Eine Bedingung, die aus dem Regelfall folgt und deshalb hier steht — sie mildert die Gefahr, ohne
eine neue Bauart zu verlangen.**

> **Der Satz des Dienstes steht in L3 immer, wörtlich und ungekürzt.** Er wird nicht abgeschnitten,
> nicht durch einen eigenen Satz ersetzt und nicht weggelassen, wenn er lang ist.

Der Grund: Genau dieser Satz ist im Regelfall die **einzige** brauchbare Auskunft der Meldung. Er
lautet dann nicht „unbekannter Fehler", sondern nennt den fehlenden Exportordner oder die fehlende
Vorlage — und damit die Handlung, die der Benutzer als nächste tun kann. **Eine Warnung, die ihren
Grund mitbringt, wird langsamer zur Tapete als eine, die ihn verschweigt.** Das ist S-10 in Sache
und Form; es ist hier nur nicht der Fehlerfall, sondern der Normalfall.

**Was ausdrücklich nicht getan wird, damit es niemand beim Bauen einfügt:** kein „Nicht mehr
anzeigen", keine Zählung („dieser Hinweis erschien schon dreimal"), keine Unterdrückung nach der
ersten Meldung je Sitzung. Ein „Nicht mehr fragen" ist im Produkt begründet ausgeschlossen (S-12,
`AttachmentOpenDialog`), und eine Unterdrückung, die niemand angeordnet hat, ist ein stiller
Zustandswechsel.

#### Berichtigung T-219 — der Satz, auf dem „Regelfall" steht, ist ein Kommentar, kein Befund

**Was ich in diesem Abschnitt getan habe.** Der erste Absatz sagt „**am Baum nachgelesen**" und
zitiert dann den **Kommentar** in `dayGroup.ts`: *„Ohne Vorlage oder ohne Exportordner gibt es
keine Vorschau."* Ein Kommentar ist ein Beleg dafür, was jemand gedacht hat, nicht dafür, was der
Code tut. Ich habe die Zeile darunter nicht verfolgt, und der ganze Regelfall steht auf ihr.

**Was der Weg tut, heute nachverfolgt** (2026-09-06, ripgrep über den Arbeitsbaum; **am Code
gelesen, nicht laufen gesehen** — der Lauf hatte keine Schale):

| Schritt | Befund |
|---|---|
| `dayGroup.ts` ruft `previewExport(null, ids)` | `templateId: null` (`api/endpoints.ts`) |
| `POST /export/preview` → `previewExport` (`apps/local-api/src/usecases/export.ts`) | löst die Vorlage auf, prüft die Definition, liest die Gruppen, rechnet den Plan |
| **Der Exportordner** | kommt auf diesem Weg **nicht vor**. `export_directory_missing` entsteht in `runExport` und in `usecases/structure.ts`, nicht in der Vorschau |
| **Die Vorlage** | `templateId === null` → `settings.activeExportTemplateId` → ohne Wahl die **mitgelieferte Standardvorlage**, und die ist nach A-8.7 nicht löschbar. Der Kommentar dazu steht in `resolveTemplate`: *„Sie ist nicht löschbar, also gibt es immer eine."* |

**Was daraus folgt, und was ausdrücklich nicht.**

- **Der Regelfall-Satz trägt so nicht.** „In einem frisch eingerichteten Takt ist L3 die Antwort
  auf jede Buchungsänderung" setzt voraus, daß ein fehlender Exportordner die Vorschau scheitern
  läßt. Auf diesem Weg tut er das nicht. Die Zahl „sechsmal so oft gelesen wie beim Verfassen
  angenommen" ist damit **nicht belegt**, und sie wird hier nicht durch eine andere ersetzt.
- **Die drei Gründe darüber ändern sich nicht.** Sie hängen nicht an der Häufigkeit: Die Fassung
  sagt Wahres, die saubere Trennung ist kein Wortlautproblem, und Gleichlauf mit dem Stopp bleibt
  besser als eine zweite Sonderregel. **Gebaut wird wie vorgelegt.**
- **Die Bedingung darunter bleibt, und zwar erst recht.** *„Der Satz des Dienstes steht in L3
  immer, wörtlich und ungekürzt."* Wird L3 seltener, ist er die einzige Auskunft in einem Fall, den
  der Benutzer selten sieht — dann trägt er mehr, nicht weniger.
- **Nicht entschieden ist, wann L3 überhaupt eintritt.** Übrig bleiben auf diesem Weg eine
  eingestellte, aber nicht mehr vorhandene Vorlage (`not_found`, *„Diese Exportvorlage gibt es
  nicht."*), eine unzulässige Definition und der nicht antwortende Dienst. Ob das die zwei Lagen
  sind, nach denen die Wiedervorlage in 12.9 fragt, **entscheidet dieses Papier nicht** — es ist
  eine Frage an domain-dev, und sie ist in 14.9 als Vorschlag für das Board formuliert.

**Warum das hier steht und nicht stillschweigend nachgezogen wird.** Der Abschnitt ist mit Z-57
Auflage 2 **freigegeben**; eine Freigabe wird nicht dadurch gerettet, daß ihre Begründung
unauffällig ausgetauscht wird. E-087 Punkt 4 und die Lehre aus meiner eigenen Nachtragszeile sagen
dasselbe: Eine Zahl oder ein Satz, der einmal falsch dastand, wird **benannt**, nicht überschrieben.

---

## 13. Der Absendeversuch, der nichts zu tun hat — die Absage bei „unverändert" (Nachtrag T-211)

**Grundlage:** **T-207** Abschnitt 3 und Offene Frage 2 (frontend-dev), **T-186** (`ConfirmDialog`
auf `aria-disabled`), Regel **P-8**, E-078 Punkt 1 und Punkt 3, Raster Abschnitt 2, Regeln S-05,
S-07, S-10, S-12, SC 3.3.1, SC 4.1.2.

**Wofür dieser Abschnitt da ist — und wofür nicht.** frontend-dev hat neun Dialoge gezählt, die
ihren Absendeknopf **sperren**, statt beim Absenden zu prüfen, und sie in drei Sorten zerlegt. Für
**eine** Sperrbedingung gibt es im ganzen Produkt keinen Wortlaut: der Name ist **unverändert**.
Dieser Abschnitt verfaßt ihn.

**Er entscheidet nicht, ob umgebaut wird.** Diese Frage liegt bei spec-ux-reviewer (T-207 Offene
Frage 1) und beim Orchestrator. Dieser Abschnitt sorgt dafür, daß die Entscheidung nicht an einem
fehlenden Satz hängt — und daß der Satz nicht beim Bauen erfunden wird. **Er ist eine Vorlage und
wird genehmigt, nicht angewendet** (E-078 Punkt 3).

### 13.1 Der Zustand, und warum keiner der vorhandenen Sätze ihn trägt

| Was eine Sperre sonst meint | Der Satz dazu im Bestand | Trifft er hier? |
|---|---|---|
| Pflichtfeld leer | „Ohne Namen geht es nicht: Er ist das, woran diese Regel auf dem Board und in den Pools erkennbar ist." (`PoolRenameDialog`) | **nein** — das Feld ist gefüllt |
| Wert schon vergeben | „Diesen Namen trägt bereits eine andere Regel. …" (`PoolRenameDialog`) | **nein** — der Name ist gültig; er ist sogar der eigene |
| Bestätigung fehlt | `ConfirmDialog`, `acknowledgeLabel` (S-12) | nein — es wird nichts bestätigt |
| Der Bestand ist nicht bekannt | „Die vorhandenen Namen sind gerade nicht bekannt" (`PoolRenameDialog`) | nein — dieser Fall **erlaubt** das Speichern ausdrücklich |
| **unverändert** | — | **es gibt keinen** |

**Die Lage in einem Satz.** Die Eingabe ist in Ordnung, der Benutzer hat nichts falsch gemacht, und
die Handlung hat trotzdem **keinen Gegenstand**. Nach dem Raster in Abschnitt 2 ist das ein **B** —
eine Absage mit Begründung —, und ausdrücklich **keine** Fehlermeldung. Der Unterschied ist nicht
Höflichkeit: Eine Fehlermeldung behauptet, an der Eingabe sei etwas falsch. Hier ist nichts falsch.

Der Dialog selbst hat den Grund übrigens längst aufgeschrieben — im Kopfkommentar von
`PoolRenameDialog.tsx`: *„Ein `PATCH`, der nichts ändert, wäre eine Meldung ohne Ereignis."* Der
neue Satz sagt dem Benutzer genau das, was der Code sich selbst sagt.

### 13.2 Was heute schon dasteht, und was ein Absendeversuch hinzufügt

`PoolRenameDialog` trägt für diesen Zustand einen **dauerhaften Hinweis** unter dem Feld:

> „Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den Dialog."

**Die Auskunft fehlt also nicht.** Was fehlt, ist die **Antwort auf den Druck**, und daran hängen
zwei gemessene Bauartfragen:

- Eine unveränderte Zeichenkette in einer bereits vorhandenen Meldefläche wird **nicht erneut
  angesagt** — dieselbe Bauart, an der 12.1 den Nachtragsweg gemessen hat.
- Ein nativ `disabled` Knopf ist aus dem Tabulatorlauf **entfernt**. Wer den Dialog mit der Tastatur
  bedient, kommt an ihn gar nicht heran; das ist die Messung aus 5.1 (SP-19), und `ConfirmDialog`
  nennt seit T-186 genau diesen Grund für seinen eigenen Umbau.

**Daraus folgt die Bauform des Satzes, bevor sein Wortlaut dasteht:** Der Absendeversuch fügt
**genau einen Satz** hinzu und ersetzt den Hinweis nicht durch eine zweite Fassung. Der vorhandene
Hinweis bleibt zeichengleich; er wird **Teil** der Absage. Das ist dieselbe Bewegung, die
`ConfirmDialog.refusal` seit T-118 macht (die Absage tritt an die Stelle der Vorwarnung, S-12) —
nur daß hier die Vorwarnung im Satz erhalten bleibt, weil sie den Weg hinaus nennt.

### 13.3 Der Wortlaut

> **Es gibt nichts zu speichern. Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den
> Dialog.**

- **Satz 1 ist neu** und steht nur nach einem Absendeversuch. Er nennt, was **nicht** geschehen
  ist, in dem Wort, das auf dem Knopf steht („Speichern").
- **Satz 2 und 3 sind der heutige Hinweis, zeichengleich.** Es entsteht keine zweite Fassung: Der
  Hinweis liegt als **ein** Baustein im Bestand, und die Absage ist `"Es gibt nichts zu speichern. "`
  **plus** dieser Baustein. Läuft der Hinweis je durch einen Sprachdurchgang, läuft die Absage mit.

**Die Vorlage für den nächsten Fall** — „unverändert" ist keine Eigenheit dieses einen Dialogs, und
Umbenennen gibt es in Takt an Tags, Ordnern, Status, Vorlagen und Regeln:

> **„Es gibt nichts zu 〈Wort des Absendeknopfes〉. " + 〈der vorhandene Hinweis zu dieser Sperre〉**

**Regel S-12a — die Absage einer Handlung ohne Gegenstand.** Sie nennt in den Worten des
Absendeknopfes, daß nichts geschehen ist; sie behauptet **keinen** Fehler, **keine** Leere und
**keinen** Verstoß; sie tadelt den Benutzer nicht; und sie läßt den Weg hinaus stehen. Sie ist ein
**B** und damit nach E-078 nicht streichbar — kürzbar allein um den Teil, den ein zweiter Träger
schon sagt. **Ihr Kanal ist die Statusfläche des Dialogs und nicht der Fehlerkanal des Feldes**
(13.4, E-093 Punkt 5).

**Berichtigung der Nummer (Nachtrag T-228, T-221 Z-72).** Diese Regel hieß bis heute **S-15**, und
diese Nummer war im selben Papier bereits vergeben: **S-15 Zugängliche Namen** in Abschnitt 4 —
ausdrücklich **vertraglich**, weil an ihr die `getByRole`-Zugriffe der Prüfläufe hängen. Zwei
verbindliche Regeln unter einer Nummer sind schlimmer als eine ohne: Wer „nach S-15" schreibt, meint
eines von beidem, und niemand kann entscheiden, welches. **Die vertragliche S-15 behält ihre
Nummer** — sie ist die ältere, sie steht im Bestandsteil, und sie ist diejenige, an der eine
Verwechslung Prüffälle kostet. Die neue Nummer hängt an der Textsorte, in der die Regel greift
(**S-12**, „Dialoge: Titel, Beschreibung, Folge, **Absage**, Bestätigungshaken"); das ist die
Bauart, die S-13a in T-211 und S-15a in T-222 vorgemacht haben. Die Regel steht ab sofort **auch**
in Abschnitt 4 unter S-12, damit sie dort gefunden wird, wo jemand nach ihrer Sorte sucht (E-092).
**Wer „S-15" für diese Regel zitiert findet, liest eine Fassung vor dem 2026-09-06** — es gab genau
eine solche Stelle, die Grundlagenzeile von Abschnitt 14, und sie ist berichtigt.

**Die Länge, und warum sie hier nicht frei ist (Nachtrag T-228, T-221 Z-76).** Der Satz ist **102
Zeichen** und drei Sätze; **P-1** setzt 60 beziehungsweise 80 und verlangt **einen** Satz. Beides
steht nebeneinander, und die Auflösung ist keine Ausnahme, sondern ein Geltungsbereich:

1. **P-1 gilt der Feldmeldung.** Sie ist als *„Form der Pflichtfeldmeldung"* verfaßt (T-177, E-084,
   E-092) und regelt den Kanal, in dem eine Meldung **an einem Feld** über **dessen Wert** steht.
   Die Absage nach S-12a steht seit E-093 Punkt 5 nicht dort, sondern in der **Statusfläche des
   Dialogs** — dem Kanal, für den S-12 die Form setzt und für den `consequence` ausdrücklich
   **keine** Längengrenze trägt.
2. **Trotzdem ist die Länge nicht frei, und sie braucht keine neue Zahl.** Der Satz ist nach S-12a
   **gebaut** und nicht formuliert: ein eigener erster Satz plus der **vorhandene** Hinweis. Der
   erste Satz nimmt das Wort des Absendeknopfes und bleibt damit im Rahmen von S-07 (hier 28
   Zeichen); der zweite Teil ist ein dauerhaft sichtbarer Feldhinweis und steht schon unter der
   **80-Zeichen-Grenze aus S-05** (hier 73). **Die Obergrenze ist damit 80 plus ein Satz** und
   ergibt sich aus zwei Regeln, die bereits gelten — sie ist gerechnet, nicht gesetzt.
3. **Was daraus folgt, wenn jemand die Grenze reißt:** Nicht die Absage wird gekürzt, sondern der
   **Hinweis** — denn er ist der Teil, für den eine Grenze gilt, und er wird an beiden Stellen
   gelesen. Eine Absage, die länger ist als ihr Hinweis plus ein Satz, ist keine Absage nach S-12a
   mehr, sondern eine zweite Fassung.

**Damit ist Z-76 beantwortet und nicht überschwiegen.** Die nächste Absage dieser Bauart wird nicht
mit 102 Zeichen gebaut, „weil diese es durfte", sondern mit der Länge ihres eigenen Hinweises.

**Was der Satz ausdrücklich nicht sagt, mit Begründung je verworfener Fassung:**

| Verworfen | Warum |
|---|---|
| „Name fehlt." / „Pflichtfeld leer" | **falsch.** Das Feld ist gefüllt. Es ist der Satz des Nachbarzustands, und ihn hier zu benutzen hieße, zwei Zustände gleich zu benennen — dieselbe Verwechslung, die 12.4 an „gesperrt" auseinanderhält |
| „Ungültiger Name." | **falsch.** Er ist gültig; er ist der gespeicherte. Eine Anwendung, die den eigenen Bestand für ungültig erklärt, ist an dieser Stelle nicht mehr glaubwürdig |
| „Sie haben nichts geändert." | **Tadel für etwas, das kein Fehler ist.** Die zweite Person im Vorwurf steht in Takt an keiner Stelle, und der Benutzer hat den Dialog vielleicht bewußt geöffnet, um nachzusehen |
| „Bitte ändern Sie den Namen." | **verworfen; die Begründung ist berichtigt (T-228).** ~~„Bitte" steht nirgends im Produkt (S-07 hält das für Knopftexte fest, und für Sätze gilt es genauso).~~ **Das ist gemessen falsch** — siehe unten. Es bleibt der zweite Grund, und er trägt allein: Der Satz macht aus einer **Absage** eine **Aufforderung** und nennt damit nur noch **einen** der beiden Ausgänge. Der Benutzer **darf** auch schließen |
| „Keine Änderung erkannt." | „erkannt" klingt nach einer Messung, die schiefgehen kann, und lädt zum zweiten Versuch ein. Takt vergleicht zwei Zeichenketten; da gibt es nichts zu erkennen |
| „Speichern nicht möglich." | **falsch in der Richtung.** Möglich wäre es; es gibt nur nichts zu speichern. Dieselbe Begründung wie in 12.4 gegen „Speichern nicht möglich" beim Nachtragsweg |
| „Der Name ist unverändert." **allein**, als Meldung | sagt den Zustand, aber nicht, was der Druck bewirkt hat. Der Benutzer drückt und liest **denselben Satz wie vorher** — und kann nicht wissen, ob sein Druck überhaupt angekommen ist. Das ist der stille Zustandswechsel in seiner mildesten und häufigsten Form |

### 13.3a Die zurückgenommene Begründung: „Bitte" steht sehr wohl im Produkt (Nachtrag T-228, Z-77)

**Ich habe zweimal begründet, ein Wort stehe „nirgends im Produkt" — hier und in 14.4. Beide Male
war es falsch, und beide Male hätte ich es messen können, statt es zu behaupten.** Es steht im
Nachtrag und nicht in einer stillen Ersetzung, weil eine Begründung, die verschwindet, dieselbe
Falle ein zweites Mal stellt (E-087 Punkt 4, dieselbe Form wie die Berichtigung an 12.10).

**Gemessen am 2026-09-06 über die Quellverzeichnisse — 17 Stellen im Oberflächentext:**

| Bereich | Zahl | Beispiele |
|---|---|---|
| **Produkt** (`apps/web/src`, Geltungsbereich E-078) | **4** | `api/client.ts` „Unbekannter Fehler. **Bitte** versuchen Sie es erneut." · `app/TimerContext.tsx` „Es läuft weiterhin ein Timer. **Bitte** starten Sie erneut." · `components/Select.tsx` Platzhalter **„Bitte wählen"** (Vorgabewert, gilt an jeder Auswahl ohne eigenen Platzhalter) · `screens/TemplatesScreen.tsx` „Melden Sie das **bitte** — …" |
| **Lokaler Dienst** (`apps/local-api/src`) | **11** | `startup.ts` (5), `errors.ts` (2), `usecases/export.ts` (2), `main.ts`, `usecases/tag-names.ts` |
| **Add-in** (`apps/outlook-addin/src`) | **2** | `ui/TagPicker.tsx`, `ui/TaskPane.tsx` |
| *Musterseite* (Prüfdokumentation, nicht Produkt) | *3* | *`showcase/IntroSection.tsx` — Bedienanweisungen an den Prüfer* |

**Und die unangenehmste Zeile ist die erste.** `api/client.ts` trägt den **Rückfallsatz** von
`errorMessage` — den Satz, den jede Absage des Dienstes ohne eigenen Grund bekommt. **12.10 dieses
Papiers verlangt, den Satz des Dienstes „immer, wörtlich und ungekürzt" durchzureichen.** Eine
Regel „»Bitte« steht nirgends" und eine Regel „reiche wörtlich durch" stehen gegeneinander, sobald
die erste als Regel gelesen wird — und sie war nie eine, sondern nur eine falsche Begründung.
Dieselbe Kollision hätte SP-11 getroffen: Die Sätze der Hülle kommen fertig aus `problems` und
werden **unverändert** durchgereicht, und elf davon führen „Bitte".

**Was richtig ist, in der engen Fassung:**

- **S-07 sagt es richtig** und handelt von **Knopftexten**: *„Nirgends »OK«, nirgends »Ja«, nirgends
  »Bitte«."* **Nachgemessen und bestätigt** — kein Knopftext des Produkts führt eines der drei
  Wörter. Die Verallgemeinerung auf „das Produkt" ist in 13.3 und 14.4 hinzugekommen und fällt.
- **P-1 sagt es richtig** und handelt von der **Feldmeldung**: dort ist „Bitte" ausdrücklich
  verboten. Für 14.4 trägt dieser Grund weiter (dort steht der Satz am Feld); **für 13.3 trägt er
  seit E-093 Punkt 5 nicht mehr**, weil die Absage den Feldkanal verlassen hat. Das ist der Grund,
  aus dem 13.3 seinen zweiten Grund braucht — und ihn hat.
- **Ein fremder Satz, den wir zitieren, fällt unter keine dieser Regeln.** Eine Regel über unsere
  eigene Wortwahl kann nicht über Text herrschen, den wir wörtlich weitergeben; sonst kürzten wir
  den Grund des Dienstes, um unsere Hausregel zu retten (12.10, SP-11).

**Trägt das Urteil ohne die Begründung? Ja — und beide Fassungen stehen danach besser da.**

| Verworfene Fassung | Was nach der Rücknahme trägt |
|---|---|
| **13.3** „Bitte ändern Sie den Namen." | Sie macht aus einer Absage eine **Aufforderung** und nennt nur **einen** der beiden Ausgänge. Das ist ein **Ablaufgrund** am selben Zustand — und es ist genau die Eigenschaft, für die Z-71 die freigegebene Fassung mit ihrem vierten Grund genommen hat („Er nennt beide Ausgänge"). Der Grund ist damit **stärker** als der gefallene, weil er aus dem Fluß kommt und nicht aus einer Zählung |
| **14.4** „Leistung: länger, als der Dienst annimmt — bitte kürzen." | **Zwei** Gründe standen dort, und der zweite ist unberührt: Der Halbsatz nennt die **Handlung**, und **P-4** läßt ihn nur für die **Folge** zu. Dazu gilt **P-1** hier weiterhin, denn dieser Satz steht am **Feld**. Die Verwerfung stand nie auf der falschen Behauptung allein |

**Zwei Befunde, die die Aufnahme nicht hatte — sie sind der Gewinn dieser Messung.** Beide sind
**neu aufgenommen und nicht beurteilt**; keiner ist ein Streichvorschlag (dieselbe Zurückhaltung
wie in 1.2):

1. **`Select.tsx` hat als Vorgabeplatzhalter „Bitte wählen".** Nach **S-06** ist ein Platzhalter
   *„Beispiel oder Form, **nie** Anweisung"* — „Bitte wählen" ist eine Aufforderung und weder das
   eine noch das andere. Die Sorte S-06 nennt heute zwei Ausreißer; dies ist der dritte, und er
   wiegt schwerer als beide, weil er ein **Vorgabewert** ist und damit an jeder Auswahl ohne
   eigenen Platzhalter steht. **Aufgenommen in S-06.**
2. **`api/client.ts` liegt außerhalb des Geltungsbereichs, den Abschnitt 1 aufzählt** — und trägt
   vier Sätze, die jeder Benutzer liest. Siehe 1.2, sechster Träger.

### 13.4 Fluß, Fokus und Ansage

**Berichtigt am 2026-09-06 (Nachtrag T-228).** Der Kanal ist seit **E-093 Punkt 5** entschieden und
seit **T-220** gebaut: Die Absage steht in einer **Statusfläche** zwischen Rumpf und Fußzeile
(`role="status"`, ohne `aria-invalid`, ohne Fehlerfarbe am Feld), nicht in der Meldefläche des
Feldes. Die Tabelle stand vorher auf dem Feldkanal und ist an drei Zeilen unrichtig geworden; sie
steht hier in der Fassung, die dem Bau entspricht. **Was der Kanal ändert, steht in 13.5; was er
für den doppelten Satz bedeutet, in 13.7.**

| Schritt | Was | Was der Benutzer sieht und hört |
|---|---|---|
| **Start** | Dialog „„X" umbenennen" offen, Feld mit dem heutigen Namen vorbelegt | Unter dem Feld steht der Hinweis. Der Absendeknopf sieht gesperrt aus — er ist es **weich** (`aria-disabled`): erreichbar, tabulierbar, drückbar |
| **Aktion** | „Speichern" mit Maus oder Tastatur, oder Eingabetaste im Feld | — |
| **Feedback** | Die Absage erscheint **über den Knöpfen**, dort, wo der Druck stattgefunden hat. **Der Hinweis unter dem Feld weicht, solange sie steht** (13.7). Der Fokus bleibt, wo er ist | Der Satz aus 13.3, sichtbar neben dem Knopf und **angesagt** (Statusfläche, sie steht auch leer im Baum) |
| **Erfolg** | Der Benutzer tippt | Mit dem ersten geänderten Zeichen fällt die Absage; der Hinweis kehrt zurück, jetzt als „Der neue Name erscheint sofort überall, wo diese Regel genannt wird.", der Knopf wird bedienbar |
| **Zweiter Weg hinaus** | „Abbrechen" oder Esc | Der Dialog schließt, der Fokus kehrt auf den Auslöser zurück. **Der Satz nennt diesen Weg selbst** |
| **Fehlerpfad** | keiner. Es wurde nichts gesendet, also kann nichts scheitern | — |
| **Sackgasse** | keine — zwei Ausgänge, beide im Satz genannt und beide sichtbar | — |

**Warum der Fokus jetzt am Knopf bleibt, und warum das kein Verlust ist.** Im Feldkanal holte
`revealFirstInvalidWithin` das beanstandete Feld in den Fokus; in der Statusfläche gibt es kein
beanstandetes Feld, weil nichts ungültig ist — die Funktion findet nichts, und das ist richtig so.
Den Fokus **trotzdem** ins Feld zu schieben hieße, dem Benutzer die Stelle zu nehmen, an der er
gerade steht, ohne ihm eine bessere zu geben: Er steht auf „Speichern", er hat gerade „Speichern"
gedrückt, und die Antwort steht unmittelbar daneben. Eine Statusfläche sagt sich außerdem selbst
an. **Der Weg ins Feld bleibt ein Tabulatorschritt**, und der Satz sagt, wozu (SC 2.4.3 unberührt;
was ein Hörender hört, ist hier abgeleitet — T-B09).

**Was dabei ausdrücklich nicht geschieht:** kein Toast (nichts ist geschehen, und S-13 gilt der
vollzogenen Handlung), keine zweite Meldung im Fehlerbereich des Dialogs (der gehört der Absage des
Dienstes, S-10), **kein `aria-invalid` und keine Fehlerfarbe am Feld** (der Wert ist gültig; er ist
der gespeicherte), kein Schließen, kein Zurücksetzen des Feldes.

### 13.5 Akzeptanzkriterien für frontend-dev — ~~erst gültig, wenn der Umbau beschlossen ist~~ **beschlossen (E-093), gebaut (T-220), hier nachgezogen**

**Warum diese Liste berichtigt und nicht abgehakt wird.** Sie ist am **Feldkanal** geschrieben.
E-093 Punkt 5 hat den Kanal gewechselt, und damit sind zwei Kriterien nicht etwa unerfüllt, sondern
**gegenstandslos** — sie verlangen etwas, das im neuen Kanal falsch wäre. Eine Liste, die nach dem
Bau das Gegenteil des Gebauten verlangt, ist genau die Falle aus E-092: Der nächste, der sie liest,
baut den Rückschritt und hält ihn für die Auflage. **Die alte Fassung bleibt lesbar, damit niemand
sie für nie dagewesen hält.**

| # | Stand | Kriterium in der heute gültigen Fassung |
|---|---|---|
| **1** | **erfüllt** | **Der Hinweis bleibt zeichengleich** und bleibt **ein** Baustein. Die Absage setzt ihren ersten Satz davor; sie schreibt ihn nicht ab. **Ergänzt nach Z-74:** Der Hinweis ist in derselben Änderung eine **benannte Konstante** geworden, aus der beide Fälle lesen — gebaut als `UNCHANGED_HINT`. Zwei Abschriften desselben Satzes laufen beim nächsten Sprachdurchgang auseinander |
| **2** | **erfüllt** | **Die Absage erscheint erst nach einem Absendeversuch**, nie beim Öffnen (Befund O-FY). Gebaut als Bedingung aus drei Teilen: es gibt eine Absage, die Sperre steht **noch**, und es hat einen Versuch gegeben |
| **3** | **berichtigt, offen** | **Sie tritt an die Stelle des Hinweises, nicht daneben.** Im Feldkanal geschah das von selbst; in der Statusfläche **nicht** — der Hinweis steht seit T-220 gleichzeitig darunter. Das Kriterium bleibt **wörtlich gültig** und ist der Auftrag aus **13.7** |
| **4** | ~~**Der Fokus geht in das Feld**, das die Sperre trägt~~ | **gegenstandslos und ersetzt.** Kein Feld ist ungültig, also findet `revealFirstInvalidWithin` nichts — und soll nichts finden. **Neu:** Der Fokus **bleibt am Absendeknopf**; die Absage steht neben ihm und sagt sich selbst an (Begründung in 13.4) |
| **5** | ~~**Die Ansage kommt aus der Meldefläche des Feldes**~~ | **gegenstandslos und ersetzt.** **Neu:** Die Ansage kommt aus der **Statusfläche des Dialogs** — `role="status"`, nicht `alert`; hier ist nichts falsch, die Handlung hat nur nichts zu tun. Die Fläche steht **immer** im Baum, auch leer (O-GQ). Es bleibt bei **einer** Live-Region je Meldung |
| **6** | **erfüllt** | **Der Absendeknopf behält seinen zugänglichen Namen** („Speichern") und seinen Zustand als `aria-disabled`. Der Name trägt die Sperre nicht mit |
| **7** | **berichtigt (Z-75), erfüllt** | ~~Der Riegel im Formular **bleibt**.~~ **Der Riegel hält die Handlung auf, nicht den Versuch.** Ein gesperrter Absendeversuch **zählt weiter**, stellt die Meldeflächen still und löst die Rückführung aus; allein der Aufruf des Dienstes unterbleibt. Wörtlich genommen hätte die alte Fassung dafür gesorgt, daß der freigegebene Satz **nie erscheint** — der Knopf wäre klickbar und stumm. **Gemessen wird beides:** daß die Absage erscheint **und** daß kein `PATCH` läuft |
| **8** | **erfüllt** | **Kein Toast, kein Dialogfehler, kein Schließen.** Und **kein `aria-invalid`** am Feld — das ist seit E-093 Punkt 5 die tragende Zusage dieses Abschnitts |

**Zwei Kriterien kommen hinzu, beide aus O-KD**, und beide stehen ausformuliert in 13.7 und 13.8:

| # | Kriterium |
|---|---|
| **9** | **Der Hinweis unter dem Feld weicht, solange die Absage steht**, und kehrt zurück, sobald sie fällt. Er wird dabei nicht gelöscht, sondern **gelesen** — dieselbe Konstante, ein Ort statt zwei (13.7) |
| **10** | **Der Sperrgrund „leer" antwortet auf den Druck, aber im Feldkanal**, mit dem Wortlaut, der dafür dreimal im Produkt steht. Die Absage nach S-12a wird dort **nicht** verwendet; sie wäre falsch (13.8) |

### 13.6 Was dieser Abschnitt nicht entscheidet — und ein Hinweis, der dazugehört

**Nicht entschieden:** ob die neun Dialoge von `disabled` auf `aria-disabled` umgestellt werden.
Das ist T-207 Offene Frage 1 und liegt bei spec-ux-reviewer.

**Ein Hinweis zur Sortierung, ausdrücklich als Zuarbeit und nicht als Urteil.** frontend-dev
schreibt, für **Sorte A** — der Grund steht ohnehin da, `PoolRenameDialog` ist ihr Beispiel — sei
ein Umbau „kein Gewinn und ein Verlust". Der erste Teil trifft für die **Auskunft** zu; für die
**Erreichbarkeit** nicht. Ein nativ gesperrter Knopf steht nicht im Tabulatorlauf (5.1, gemessen);
wer den Dialog mit der Tastatur bedient, erfährt an ihm weder, daß es einen Absendeknopf gibt, noch
in welchem Zustand er ist. **Der Gewinn bei Sorte A ist also nicht der Satz, sondern der Knopf** —
und der Satz aus 13.3 ist das, was diesen Knopf danach nicht stumm läßt. Ob das den Preis aus
T-207 Abschnitt 3.2 wert ist, entscheidet dieser Abschnitt nicht.

**Und für Sorte C** (die Sperre steht beim Öffnen, das Pflichtfeld ist blank) teile ich
frontend-devs Vorschlag: Ein **dauerhafter Hinweis** unter dem blanken Pflichtfeld nach dem Muster
`PoolRenameDialog` ist der billigere und der bessere Weg. Er fällt unter S-05 als **Form/Grenze**,
er kostet keinen Knopfzustand — und er erzeugt vor allem keine Meldung, die niemand ausgelöst hat.
Ein Wortlaut dafür steht in `PoolRenameDialog` bereits und ist übertragbar; er wäre pro Feld zu
verfassen und ist **nicht** Gegenstand dieses Abschnitts.

**Berichtigung zu diesem Absatz (Nachtrag T-228).** Die Sortierung ist überholt: **E-093 hat alle
neun umgebaut**, nicht fünf, und damit gibt es die Lage „Sorte C, Knopf hart gesperrt, dauerhafter
Hinweis genügt" im Produkt nicht mehr. Was von dem Absatz trägt, ist der Satz über den **Träger**
(ein dauerhafter Hinweis unter dem blanken Pflichtfeld ist richtig und bleibt); was fällt, ist der
Schluß, damit sei der Druck beantwortet. **Er ist es nicht** — und für den einen Sperrgrund dieses
Dialogs, an dem das heute noch offensteht, verfaßt **13.8** die Antwort.

### 13.7 Der Satz steht zweimal auf dem Bild — welcher weicht (Nachtrag T-228, O-KD)

**Der Befund, gemessen von frontend-dev am gebauten Bild (T-220 Abschnitt 7.1).** Nach einem
Absendeversuch im Zustand „unverändert" steht unter dem Feld

> „Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den Dialog."

und darüber, über den Knöpfen,

> „**Es gibt nichts zu speichern.** Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie
> den Dialog."

**Zwei Sätze gleichzeitig, von denen der zweite den ersten vollständig enthält.** Nach dem Raster in
Abschnitt 2 ist das **D** in seiner reinsten Form: dieselbe Aussage, derselbe Benutzer, derselbe
Blick. E-078 Punkt 1 verlangt, daß so etwas fällt. **Welcher von beiden, ist eine Textentscheidung
(E-078 Punkt 4), und sie wird hier getroffen.**

**Entstanden ist es nicht durch einen Fehler, sondern durch den Kanalwechsel.** Im Feldkanal
verdrängte die Meldung den Hinweis von selbst — eine Fläche, zwei Zustände. In der Statusfläche
liegen sie an zwei Orten, und beide Orte sind besetzt. Das ist der Preis der richtigen
Entscheidung, nicht ihr Gegenargument.

#### Die Entscheidung

> **Der Hinweis unter dem Feld weicht, solange die Absage steht. Die Absage bleibt zeichengleich.**

**Fünf Gründe, in dieser Rangfolge:**

1. **Es ist keine neue Entscheidung, sondern dieselbe in einem neuen Kanal.** **AK 3 sagt es seit
   T-211 wörtlich:** *„Sie tritt an die Stelle des Hinweises, nicht daneben. Zwei Sätze
   übereinander, die dasselbe sagen, sind D."* Der Kanalwechsel hat nicht die Absicht geändert,
   sondern nur den Mechanismus: Was vorher von selbst geschah, muß jetzt gebaut werden.
2. **Der freigegebene Wortlaut bleibt unangetastet.** Die Gegenlösung — die Absage auf ihren ersten
   Satz kürzen — änderte einen Satz, den spec-ux-reviewer **zeichengleich** freigegeben hat (Z-71),
   und nähme ihm ausgerechnet den vierten Grund seiner Freigabe: *„Er nennt beide Ausgänge, und der
   zweite („schließen") ist der, den eine Absage sonst verschweigt."* Eine Absage, die den Weg
   hinaus in einen anderen Bildschirmbereich auslagert, ist nach **S-12a** keine mehr.
3. **Die Antwort gehört dorthin, wo gedrückt wurde.** Der Benutzer hat auf „Speichern" gedrückt;
   sein Blick und sein Fokus sind am Knopf. Die Statusfläche liegt zwischen Rumpf und Fußzeile,
   also unmittelbar daneben — und der Hinweis steht am anderen Ende des Rumpfes. In einem
   **gescrollten** Dialog ist dieser Unterschied kein Feinschliff: Dort kann das Feld samt Hinweis
   außerhalb des Bildes stehen, während die Absage sichtbar ist (Z-63, gemessen an einem Dialog mit
   1599 px Inhalt in einem Ausschnitt von 492 px). Ein Satz, der nur die Hälfte der Auskunft trägt,
   wäre genau dort eine Sackgasse.
4. **Es fällt eine Anzeige, kein Satz.** Der Wortlaut existiert genau **einmal** im Bestand, als
   benannte Konstante, und beide Stellen lesen aus ihr. Was hier weicht, ist die **zweite
   gleichzeitige Anzeige** desselben Bausteins — nicht der Baustein. Damit greift auch die Regel
   aus Abschnitt 2 („es fällt die Kopie, nicht das Original") in ihrem Sinn und nicht in ihrem
   Buchstaben: Es gibt keine Kopie, es gibt eine Doppelanzeige.
5. **Der Hinweis verliert seine Aufgabe für die Dauer der Absage, nicht seinen Platz.** Er ist der
   Grund für eine sichtbare Sperre, solange niemand gedrückt hat. Sobald gedrückt wurde, ist die
   Absage der bessere Träger derselben Auskunft — sie sagt zusätzlich, was der Druck bewirkt hat.
   Fällt die Absage, ist der Hinweis wieder der einzige Träger und steht wieder da.

#### Die drei verworfenen Auflösungen, je mit Grund

| Verworfen | Warum |
|---|---|
| **Die Absage auf „Es gibt nichts zu speichern." kürzen, der Hinweis bleibt** | Sie verlöre den **Weg hinaus** an der Stelle, an der die Antwort steht — und im gescrollten Fall ganz. Außerdem ändert sie einen **freigegebenen** Wortlaut und brauchte eine neue Genehmigung für eine Fassung, die schlechter ist als die genehmigte |
| **Den Hinweis für diesen Zustand ganz streichen** | Er ist der Grund einer **sichtbaren** Sperre, und der Grund ist nicht sichtbar. Nach dem Umbau auf einen weich gesperrten Knopf **ließe P-9 es zu** (der Auslöser folgt dem Knopf, und der Knopf läßt sich drücken) — aber der Benutzer müßte dann drücken, um zu erfahren, warum er nicht drücken soll. Dazu käme ein Bruch in der Fläche selbst: Das Feld trägt in seinen drei anderen Zuständen einen Hinweis; ausgerechnet dem mittleren keinen zu geben, sieht aus wie ein Versehen |
| **Beides stehen lassen** | Das ist der heutige Zustand und der Anlaß dieses Abschnitts. Er sagt nichts Falsches — und genau deshalb ist er die Sorte Doppelung, die bleibt, wenn niemand sie entscheidet (E-078 Punkt 1) |

#### Wann genau der Hinweis weicht — und wann er wiederkommt

**Die Bedingung ist die der Absage, und keine zweite.** Der Hinweis zu diesem Zustand steht
**nicht**, solange die Absage steht; sonst steht er. Damit gibt es **einen** Zustand und nicht zwei,
die auseinanderlaufen können.

| Lage | Hinweis unter dem Feld | Absage über den Knöpfen |
|---|---|---|
| Dialog frisch geöffnet, Name unverändert | **steht** | — |
| Nach dem Absendeversuch, Name weiter unverändert | — | **steht** |
| Der Benutzer tippt: Name geändert | **steht** (jetzt „Der neue Name erscheint sofort überall …") | — |
| Der Benutzer tippt zurück auf den alten Namen | — | **steht wieder** |

**Die letzte Zeile ist gemessen und ausdrücklich gewollt** (`refusalShown` hängt an der Sperre und
am Versuch, nicht an der letzten Eingabe). Sie sieht auf den ersten Blick nach einer Absage ohne
Druck aus und ist es nicht: Der Druck **war**, der Zustand ist derselbe wie damals, und der Satz ist
in diesem Zustand wahr. Wollte man sie beseitigen, müßte die Absage vergessen, daß gedrückt wurde —
und dann wäre ein zweiter Druck ohne Änderung dazwischen wieder stumm. **Das wäre der teurere
Tausch**; deshalb bleibt es, wie es ist, und steht hier, statt beim nächsten Prüfer als Befund
aufzutauchen.

#### Eine gemessene Warnung an den Umsetzenden: es ist **nicht** eine Zeile an der Aufrufstelle

frontend-dev hat die Behebung als *„eine Zeile (`fieldHint` unterdrücken, solange die Absage
steht)"* beschrieben. **Am Baum nachgelesen trägt das so nicht:** Die Bedingung der Absage kennt
**nur der Formulardialog** (sie besteht aus der Sperre **und** dem Versuchszähler), und der
Versuchszähler steht den **Kindern** des Dialogs zur Verfügung, nicht seinem Aufrufer. Die
Aufrufstelle, die den Hinweis heute setzt, ist der **Aufrufer**. Wer die Zeile dort schreibt, hat
nur die Sperre zur Hand — und unterdrückte den Hinweis dann **von der ersten Sekunde an**, also
genau die Auskunft, die vor dem Druck die einzige ist (P-9). **Das ist der Rückschritt, der wie die
Behebung aussieht.**

**Wie es stattdessen gebaut wird, entscheidet frontend-dev** (E-078 Punkt 4: der Wortlaut ist
meiner, die Zeile ist seine). Was das Kriterium verlangt, ist eine Bedingung, die **dieselbe** ist
wie die der Absage — nicht eine zweite, die ihr ähnlich sieht. Zwei Bedingungen für einen Zustand
sind die Bauart, an der dieses Papier in dieser Sitzung viermal etwas gelernt hat.

#### Was ein Hörender davon hat — abgeleitet, nicht gemessen

Der Hinweis steht in der Beschreibung des Feldes (`aria-describedby`), die Absage in einer
Statusfläche. **Doppelt angesagt wird heute nichts**, weil der Fokus nach dem Druck am Knopf bleibt
und die Feldbeschreibung dort niemand liest. Wer danach ins Feld geht, hört heute den Hinweis, nach
dieser Änderung nicht mehr — **dieselben Worte hat er dann eine Handlung zuvor aus der Statusfläche
gehört**, und er ist gerade dabei, den Zustand zu verlassen. Das ist der einzige Punkt, an dem diese
Entscheidung etwas kostet, und er ist damit benannt. **Hier läuft kein Vorleseprogramm (T-B09); wer
eines hat, mißt diesen einen Weg und widerlegt oder bestätigt den Absatz.**

#### Akzeptanzkriterien für frontend-dev

1. **Der Hinweis zum Zustand „unverändert" steht nicht, solange die Absage steht**, und steht
   wieder, sobald sie fällt. **Dieselbe** Bedingung wie die Absage, nicht eine zweite.
2. **Vor dem ersten Absendeversuch ändert sich nichts.** Der Hinweis steht von der ersten Sekunde
   an da (P-9, zweite Hälfte). Ein Lauf, der den Dialog nur öffnet, sieht denselben Bildschirm wie
   heute.
3. **Der Wortlaut der Absage bleibt zeichengleich** — beide Anzeigen lesen weiterhin aus der einen
   Konstante. Es entsteht **keine** zweite Fassung und **keine** gekürzte Absage.
4. **Die beiden anderen Hinweise des Feldes bleiben unberührt** („Ohne Namen geht es nicht: …" und
   „Der neue Name erscheint sofort überall, wo diese Regel genannt wird.").
5. **Gemessen wird der Wechsel in beide Richtungen:** nach dem Druck steht der Satz **einmal** auf
   dem Bild, nach dem ersten geänderten Zeichen steht der Hinweis wieder und die Absage ist weg.
   Ein Lauf, der nur die erste Hälfte mißt, übersieht einen Hinweis, der nie zurückkommt.

### 13.8 Der zweite Sperrgrund desselben Dialogs: das leere Feld (Nachtrag T-228, O-KD zweite Hälfte)

**Die Lage.** `PoolRenameDialog` sperrt aus **drei** Gründen: der Name ist **vergeben**, der Name
ist **unverändert**, das Feld ist **leer**. Zwei davon antworten seit T-220 auf einen Druck. Der
dritte nicht: **Wer den Namen löscht und drückt, liest denselben Satz wie vorher** — dieselbe Lücke,
die 13.3 für „unverändert" geschlossen hat, nur an einem Zustand, in dem sehr wohl etwas zu tun ist.

**Und der freigegebene Satz wäre dort falsch.** „Es gibt nichts zu speichern." trifft eine Aussage
über den **Gegenstand** der Handlung: es gibt keinen. Bei einem leeren Feld gibt es einen — er ist
nur **ungültig**. Das ist nicht dieselbe Lage in einer anderen Farbe, sondern die Nachbarlage, die
13.1 ausdrücklich auseinanderhält.

#### Die Entscheidung: eigener Satz, aber im anderen Kanal

> **Der leere Name antwortet auf den Druck mit einer Feldmeldung — nicht mit einer Absage nach
> S-12a. Der Wortlaut ist „Name fehlt.", und er ist nicht zu erfinden: er steht dreimal im
> Produkt.**

**Vier Gründe:**

1. **Hier ist der Fehlerkanal die Wahrheit und nicht die Behauptung.** Der ganze Grund, aus dem die
   Absage bei „unverändert" den Fehlerkanal verlassen hat, ist, daß `aria-invalid="true"` über einen
   **gültigen, gespeicherten** Wert eine falsche Aussage ist (E-093 Punkt 5). Bei einem leeren
   Pflichtfeld ist dieselbe Aussage **richtig**. **Die zwei Sperrgründe eines Dialogs benutzen also
   zwei Kanäle — und das ist kein Bruch, sondern genau die Unterscheidung, für die die Kanäle da
   sind.** Wer sie hier gleichmacht, hebt die Entscheidung von gestern wieder auf.
2. **Der Fokus muß hier ans Feld, und er kann es nur so.** Es gibt etwas zu tun, und zwar an einer
   bestimmten Stelle. Erklärt sich das Feld für ungültig, führt die vorhandene Rückführung von
   selbst dorthin und holt es ins Bild — bei „unverändert" fand sie zu Recht nichts (13.4).
3. **P-9 ist erfüllt, und zwar in seiner ersten Hälfte.** Seit dem Umbau läßt sich der Absendeknopf
   drücken; *„läßt sich der Absendeknopf drücken, kommt die Meldung beim Absendeversuch."* Nach
   **P-8** setzt ein Absendeversuch `touched` ohnehin immer. Beides ist gebaut und kostet an dieser
   Stelle keine neue Bauart — **drei** Geschwisterfelder im Produkt machen es genau so.
4. **Die Absage nach S-12a wäre auch der Form nach falsch.** Zusammengesetzt ergäbe sie „Es gibt
   nichts zu speichern." plus einen Hinweis von 101 Zeichen — **130 Zeichen**, und damit über der
   Grenze, die 13.3 gerade hergeleitet hat. Der Bau nach S-12a scheitert hier an der Regel selbst,
   nicht erst am Inhalt.

#### Der Wortlaut — und warum er keine Vorlage nach E-078 Punkt 3 braucht

> **Name fehlt.**

**Er ist nicht neu.** Er steht **zeichengleich** an drei Stellen im Produkt
(`PoolFormDialog.tsx`, `TagsScreen.tsx`, `StatusSettings.tsx`), und der Formulardialog nennt ihn in
seinem eigenen Kopfkommentar als **das** Beispiel für diesen Weg: *„Das ist der Weg für „Name
fehlt." und seinesgleichen."* Damit ist es die **Anwendung** eines vorhandenen Wortlauts auf eine
vierte Stelle derselben Sorte und nicht die Erfindung eines neuen — dieselbe Einordnung wie in 15.2
für „Leistung nachtragen". **Eine neue Fassung, die ein Prüfer genehmigen müßte, entsteht hier
nicht; entstünde eine, stünde sie hier als Vorlage.**

Form geprüft: **P-3** (die Grundform), **P-1** (ein Satz, mit Punkt, 12 Zeichen, kein „Bitte", kein
„Sie müssen"), **P-2** (das erste Wort ist die Feldbeschriftung — das Feld heißt „Name").

| Verworfen | Warum |
|---|---|
| „Es gibt nichts zu speichern. Ohne Namen geht es nicht: …" | **falsch in der Sache** (es gäbe etwas zu speichern) und **130 Zeichen**. Der Satz nach S-12a gilt der Handlung **ohne Gegenstand**; hier ist der Gegenstand da und untauglich |
| „Ohne Namen geht es nicht: …" als **Meldung** statt als Hinweis | **101 Zeichen in der Feldmeldung** — P-1 setzt 60. Und es wäre derselbe Satz, den der Benutzer schon liest: **D**, und zwar genau die Doppelung, die 13.7 gerade beseitigt |
| „Der Name fehlt." | **P-2.** Das erste Wort ist die Feldbeschriftung, wörtlich und ohne Artikel — so, wie es an den drei Geschwisterstellen steht. Ein vierter, leicht abweichender Wortlaut wäre die zweite Fassung derselben Meldung |
| „Bitte geben Sie einen Namen ein." | **P-1** verbietet „Bitte" in der Feldmeldung — und dieser Grund trägt hier, anders als in 13.3, weil der Satz **am Feld** steht (13.3a) |
| gar nichts, der Hinweis genügt | **Er genügt nicht.** Er sagt, warum ein Name nötig ist; er sagt nicht, daß der Druck angekommen ist. Das ist der stille Zustandswechsel, gegen den dieser ganze Abschnitt geschrieben ist — und seit dem Umbau ist der Knopf drückbar, also fällt auch die alte Entschuldigung weg, er sei ohnehin nicht erreichbar |

#### Trägt der dauerhafte Hinweis? Nein — aber er wird auch nicht gelöscht

**Die Frage aus T-220 lautet, ob der Hinweis reicht. Er reicht für die Auskunft und nicht für die
Antwort.** Er bleibt trotzdem, und zwar unverändert: Er steht, solange keine Meldung steht, und
weicht ihr, solange sie steht — **dieselbe Verdrängung, die dieser Dialog für den Zustand
„vergeben" bereits macht**, und dieselbe Bewegung wie in 13.7, nur im anderen Kanal. Was der
Benutzer dabei verliert, ist die **Begründung** („Er ist das, woran diese Regel … erkennbar ist");
was er gewinnt, ist die Auskunft, daß sein Druck angekommen ist, und der Fokus an der Stelle, an
der er etwas tun kann. **Sobald er ein Zeichen tippt, ist die Begründung wieder da.**

#### Fluß, Fokus und Ansage

| Schritt | Was | Was der Benutzer sieht und hört |
|---|---|---|
| **Start** | Dialog offen, der Benutzer löscht den Namen | Unter dem Feld: „Ohne Namen geht es nicht: …". „Speichern" sieht gesperrt aus und ist weich gesperrt |
| **Aktion** | „Speichern" oder die Eingabetaste | — |
| **Feedback** | Das Feld erklärt sich für ungültig, der Fokus geht **in das Feld** und holt es ins Bild | „Name fehlt." in der Meldefläche des Feldes, **angesagt**; der Hinweis weicht ihr |
| **Erfolg** | Der Benutzer tippt einen Namen | Die Meldung fällt, der Hinweis steht wieder — je nach Wert „Der neue Name erscheint sofort überall …" oder, bei Rückkehr zum alten Namen, die Absage aus 13.7 |
| **Zweiter Weg hinaus** | „Abbrechen" oder Esc | Der Dialog schließt, der Fokus kehrt auf den Auslöser zurück |
| **Fehlerpfad** | keiner. Es wurde nichts gesendet | — |
| **Sackgasse** | keine — tippen oder abbrechen, beides erreichbar und beides sichtbar | — |

#### Akzeptanzkriterien für frontend-dev

1. **Der leere Name erzeugt beim Absendeversuch die Feldmeldung `Name fehlt.`** — zeichengleich zu
   den drei vorhandenen Stellen, **kein** vierter Wortlaut.
2. **Sie erscheint nicht beim Öffnen**, sondern nach dem Absendeversuch oder nach einer Eingabe mit
   anschließendem Verlassen (**P-8**, **P-9** erste Hälfte). Der frisch geöffnete Dialog eines
   Benutzers, der das Feld nur ansieht, tadelt nicht.
3. **Der Fokus geht in das Feld**, über die vorhandene Rückführung. Hier ist etwas ungültig, also
   findet sie etwas — anders als bei „unverändert".
4. **Die Absage nach S-12a wird für diesen Zustand nicht gesetzt.** Es bleibt bei **einer** Antwort
   je Druck: entweder die Feldmeldung oder die Absage, nie beide.
5. **Der Hinweis „Ohne Namen geht es nicht: …" bleibt zeichengleich** und weicht der Meldung,
   solange sie steht.
6. **Gemessen wird, daß der Druck etwas bewirkt:** Meldung sichtbar, Fokus im Feld, **und** kein
   `PATCH`. Dieselbe Doppelmessung wie am Riegel.

---

## 14. Der Musterblock des Leistungsfelds — der Satz, den `error` wirklich trägt (Nachtrag T-219)

**Grundlage:** T-212 **Z-69** samt **Z-47** (`required` fällt ersatzlos) und **Z-48** (`error`
bleibt), Board **O-IY** und **O-AX**, **E-034**, **SP-08**, SP-09, die Feldmeldungsregeln **P-1 bis
P-7** aus T-177 Abschnitt 7.1 (P-1, P-8 und P-9 im Wortlaut in `decisions.md` unter **E-092**),
Regel **S-15 (Zugängliche Namen)**, Raster Abschnitt 2, E-078 Punkt 3 und Punkt 4, **T-186** (was
eine Musterseite anrichtet, wenn sie eine falsche Bauart vorführt).

**Berichtigung dieser Zeile (Nachtrag T-228, T-221 Z-72).** Sie nannte „Regel S-15" ohne Zusatz, zu
einem Zeitpunkt, als diese Nummer im Papier **zweimal** vergeben war. Gemeint war und ist die
**vertragliche** S-15 über zugängliche Namen — der Beleg steht in diesem Abschnitt selbst, in
**AK 6**: *„Im Produkt fällt kein zugänglicher Name."* Die Regel, die T-211 unter derselben Nummer
angelegt hatte, heißt seit heute **S-12a** und wird hier **nicht** gebraucht. Die Zeile sagt es ab
sofort dazu, statt es den Leser raten zu lassen.

**Wofür dieser Abschnitt da ist.** Ein Auftrag an frontend-dev steht bereit und kann nicht fahren,
weil ihm ein Satz fehlt. Dieser Abschnitt verfaßt ihn. Er ist eine **Vorlage** und wird genehmigt,
nicht angewendet (E-078 Punkt 3) — mit der Besonderheit, daß seine Genehmigung die **Vorbedingung**
des Auftrags ist und nicht seine Nachbereitung.

**Was er ausdrücklich nicht tut.** Er entscheidet nicht, ob `required` fällt — das ist Z-47 und
entschieden. Er entscheidet nicht über `maxLength` im Produkt — das ist O-AX und gehört
frontend-dev. Und er erfindet keine Regel für den Dienst.

### 14.1 Die Zange: beide naheliegenden Wege sind falsch

Der Musterblock „Fehlerzustand" in `showcase/NotesSection.tsx` setzt heute **zwei** Dinge
gleichzeitig — den Pflichtzustand und einen Fehlertext, der aus ihm folgt:

> `required` · `error="Ohne Eintrag im Feld „Leistung" lässt sich diese Buchung nicht exportieren."`

| Weg | Was er anrichtet |
|---|---|
| **Nur `required` streichen** | Ein Feld **ohne** Stern und **ohne** „(Pflichtfeld)" tadelt den Benutzer dafür, daß es leer ist. Heute erklärt wenigstens der Stern den Tadel; danach erklärt ihn nichts. **Schlechter als der Zustand, den Z-47 behebt** |
| **Den ganzen Block streichen** | `error` bleibt als Zweig **ohne jeden Ausführer** zurück — und er ist der **einzige Feldkanal für eine Absage des Dienstes**. Der nächste Prüfer meldet ihn als **viertes** Anzeichen derselben Sorte, und der Kreis schließt sich zum vierten Mal |
| **Der dritte Weg — dieser Abschnitt** | `required` fällt, `error` bleibt, **und der Satz wird ersetzt** durch einen, der vorführt, was der Baustein kann statt was er nicht mehr kann |

**Der Satz ist ohnehin gestrandet, unabhängig von `required`.** Z-48 hat gemessen, warum: Gesperrt
ist nach E-034 die **Tagesgruppe**, nicht die Buchung. Eine einzelne Buchung ohne Leistung ist
tadellos, solange eine andere Buchung derselben Gruppe Text trägt. Der Musterblock führt also die
Bedingung der **Gruppe** als Meldung am **Feld** vor — die eine Aussage, von der Z-48 sagt, ein
Feld könne sie *„gar nicht wahrheitsgemäß tragen"*.

**Und er steht auf der Musterseite, wird also abgeschrieben.** T-186 hat gemessen, was das kostet:
Die Musterseite führte eine falsche Bauart als Muster vor, und sie wurde nachgebaut. Was hier steht,
ist deshalb nicht „ein Demotext", sondern die Antwort auf die Frage, die ein Bauender an diesen
Block stellt: **Was gehört in `error`?**

### 14.2 Was `error` an diesem Baustein wirklich tragen kann — gemessen

Gemessen am **2026-09-06**, ripgrep über den Arbeitsbaum (kein `git grep`, siehe Nachtragskopf).

| # | Befund | Beleg |
|---|---|---|
| 1 | **Kein Produktaufrufer reicht `error` an ein `NoteField`.** Fünf Aufrufe: zwei in `TimerContext.tsx`, einer in `BookingDialogs.tsx`, je einer in `TodoFormDialog.tsx` und `TodoDetailScreen.tsx` | bestätigt T-200 und T-212 Z-69 |
| 2 | **Die einzige Regel, die die Tür auf diesen Text anwendet, ist eine Längengrenze.** `textSchema` ist `z.string().max(20_000)` und trägt — anders als `titleSchema` und `nameSchema` — **keine** Zeichenprüfung | `apps/local-api/src/http/input.ts`, Kommentar dort: „Leistung und Vermerk" |
| 3 | **Die Grenze ist an drei Flächen unerreichbar und an zwei vorbereitet.** Leistung: `maxLength={8192}` (zweimal `TimerContext.tsx`, einmal `BookingDialogs.tsx`) — **unter** der Tür. Vermerk: `maxLength={65536}` (`TodoFormDialog.tsx`, `TodoDetailScreen.tsx`) — **über** der Tür. Das ist **O-AX**, und `PoolRenameDialog.tsx` hat den Namen dafür längst aufgeschrieben: *„ein vorbereitetes 422"* | am Code gelesen, nicht laufen gesehen |
| 4 | **Die Absage des Dienstes an einem Feldwert läuft im Produkt heute am Dialog auf, nicht am Feld.** `FormDialog.error` bekommt `mutation.error`; die Feldmeldungen (`nameError`, `startError`, `titleError`) sind **eigene** Sätze der Oberfläche | `screens/**`, durchgängig |

**Was daraus folgt, und es ist der Kern dieses Abschnitts.** `NoteField.error` ist der Kanal für die
Absage **an diesem Text** — nicht für die Lage einer Gruppe, nicht für den Fehlschlag eines
Vorgangs. Die **eine** Regel, die es dafür heute gibt, ist die Längengrenze der Tür. Also führt der
Musterblock genau sie vor.

**Zwei Einwände, vorweggenommen, weil sie kommen werden.**

1. *„Die Leistung kann die Grenze doch gar nicht reißen — 8192 liegt unter 20 000."* Richtig, und
   deshalb steht in 14.5 ausdrücklich, was der Block behaupten darf und was nicht. Die Musterseite
   zeigt den **Baustein**, nicht einen Weg durch das Produkt: `error` gehört `NoteField` und nicht
   einer Feldart. Der Block bleibt trotzdem bei `scope="billing"`, weil die Überschrift darüber
   „Weitere Zustände des **Leistungsfelds**" heißt und der ganze Abschnitt 7 der Musterseite von der
   Unterscheidung der beiden Feldarten handelt. Ein Zustandsblock, der mitten darin die Feldart
   wechselt, kostet mehr, als er einbringt.
2. *„Und wenn O-AX behoben wird, indem alle Deckel auf die Zahl der Tür gehen — führt der Block dann
   einen toten Zustand vor?"* Nein. Die Tür behält ihre Grenze; erreichbar bleibt sie über einen
   Wert, der **nicht durch dieses Feld** hereingekommen ist (ein älterer Bestand, den ein `PATCH`
   unverändert zurückschickt — den Fall beschreibt `http/input.ts` für Namen ausführlich). **Eine
   Absage, die nicht angezeigt werden kann, ist schlimmer als eine, die selten ist.** Der Block darf
   nur nicht behaupten, sie sei häufig — und er behauptet nichts über Häufigkeit.

### 14.3 Der Wortlaut

> **Leistung: länger, als der Dienst annimmt.**

39 Zeichen. Ein Satz, mit Punkt, ohne Ausrufezeichen, ohne „Bitte", ohne „Sie müssen" (**P-1**).
Das erste Wort ist die Beschriftung des Feldes, wörtlich (**P-2**) — auf dem Musterblock ist das
der Vorgabewert „Leistung"; setzt ein Aufrufer `label`, beginnt der Satz mit **dessen** Wort.
Der Wert ist da und stimmt nicht, also die Form aus **P-5**: `„<Feldbeschriftung>: <Regel>."`, und
**eine** verletzte Regel, nicht zwei.

**Warum genau dieser Satz die drei Bedingungen erfüllt, die der Auftrag stellt:**

| Bedingung | Warum sie erfüllt ist |
|---|---|
| **Er zeigt, was der Baustein wirklich kann** | Er ist eine Absage **des Dienstes** an **diesem** Text. Er nennt den Absagenden („der Dienst") und die Regel („nimmt nur so viel an") |
| **Er klingt nicht nach Pflichtfeld** | Er spricht von **zuviel**, nicht von zuwenig. „fehlt", „erforderlich", „Pflichtfeld" kommen nicht vor — und keine Umformulierung dieses Satzes führt dorthin zurück. Das ist der Grund, aus dem ich die Längenregel jeder anderen vorziehe: Die Verwechslung ist hier nicht vermieden, sie ist **ausgeschlossen** |
| **Er ist gefahrlos abzuschreiben** | Er trägt **keine Zahl**. Eine Zahl an dieser Stelle wäre die Abschrift einer Konstanten der Tür — genau die Doppelung, die T-128 an `MAX_TITLE_CHARACTERS` und `MAX_NAME_LENGTH` beseitigt hat und die E-063 Punkt 4 verbietet. Wer die Zahl braucht, holt sie aus `@takt/domain`, nicht aus diesem Satz |

**Und er sagt nichts über den Export.** Das ist keine Auslassung, sondern die Trennung, die Z-48
verlangt: Was mit der **Tagesgruppe** geschieht, sagt `BILLING_NOTE_MAY_BE_EMPTY` (**SP-08**), und
zwar als **Hinweis** unter dem Feld, nicht als Meldung am Feld. Zwei Aussagen, zwei Träger, zwei
Sorten — und keine davon behauptet, das Feld sei Pflicht.

### 14.4 Verworfene Fassungen, je mit Grund

| Verworfen | Warum |
|---|---|
| „Ohne Eintrag im Feld „Leistung" lässt sich diese Buchung nicht exportieren." (heute) | **falsch in der Sache.** Gesperrt ist die Tagesgruppe, nicht die Buchung (E-034, Z-48). Er behauptet eine Pflicht, die es nicht gibt, und er tut es am falschen Gegenstand |
| „Leistung fehlt." | **die Grundform aus P-3 — und hier die schlechteste Wahl.** Sie ist genau der Satz, der das Feld zum Pflichtfeld erklärt. In dieser Sitzung ist an dieser Verwechslung schon ein Wortlaut gescheitert |
| „Leistung: zu lang." | **verschweigt den Absagenden.** Ohne „Dienst" liest es sich wie ein Stilurteil über den geschriebenen Text. Takt beurteilt nicht, wie jemand seine Leistung formuliert |
| „Leistung: mehr als 20 000 Zeichen." | **eine abgeschriebene Konstante der Tür**, auf der Seite, von der abgeschrieben wird (E-063 Punkt 4, T-128). Sie wäre binnen einer Welle die zweite Wahrheit über dieselbe Zahl |
| „Leistung: der Dienst hat diesen Text abgewiesen." | nennt den **Vorgang** statt der Regel — genau der Unterschied, um den es in **P-3** geht („Das Anlegen ist fehlgeschlagen" gegen „Titel fehlt."). Und er sagt nicht, was zu tun ist |
| „Leistung: länger, als der Dienst annimmt — bitte kürzen." | **verworfen; die Begründung ist berichtigt (T-228).** ~~„Bitte" steht im Produkt an keiner Stelle (S-07, P-1).~~ Der erste Teil ist gemessen falsch (13.3a: 17 Stellen). **Was trägt, sind zwei Gründe, und beide sind unberührt:** **P-1** verbietet „Bitte" in der **Feldmeldung** — und dieser Satz steht am Feld, anders als der aus 13.3 —, und der zweite Halbsatz nennt die **Handlung**, während **P-4** ihn nur für die **Folge** zuläßt |
| „Leistung: nicht gespeichert — der Dienst hat nicht geantwortet." | **falscher Träger.** Ein Fehlschlag des Vorgangs gehört an den Dialog (`FormDialog.error`, S-10), nicht an das Feld. Am Feld steht, was mit **diesem Wert** nicht geht |
| „Der Text ist länger, als der Dienst annimmt." | **P-2 verletzt.** Ohne den Feldnamen hat niemand einen Bezug, der die Meldung **hört** statt sie zu sehen — und bei zwei gleichzeitig beanstandeten Feldern auch niemand, der sieht |

### 14.5 Die drei Angaben am Block, ohne die der Satz wieder widersprüchlich wird

Ein Fehlertext über einen zu langen Wert an einem **leeren** Feld mit einem Zähler auf **„0 / 500"**
wäre dieselbe Widersprüchlichkeit eine Ebene tiefer. Der Block ändert sich deshalb an drei
Stellen mit, und alle drei gehören in **denselben** Auftrag (E-081 Punkt 4):

1. **Das Feld ist gefüllt, nicht leer.** Der Zustand „Absage an diesem Wert" braucht einen Wert.
   Vorschlag für den Vorführtext — lang genug, daß er die drei Zeilen füllt, und in derselben
   erfundenen Lage wie die Blöcke darüber:

   > „Fehleranalyse im Rechnungslauf, Abgleich der Positionen mit dem Vormonat, Rücksprache mit der
   > Buchhaltung und ein zweiter Lauf zur Kontrolle. Ergebnis und offene Punkte im Protokoll
   > festgehalten."

   Der Text ist **nicht** 20 000 Zeichen lang, und das ist Absicht. Die Musterseite führt einen
   **Zustand** vor, nicht seine Ursache — genauso, wie der Block daneben ein erfundenes Datum
   („30.08.2026") führt, ohne daß irgendetwas exportiert worden wäre. **Wer das später „richtig
   machen" will, indem er eine 20 001 Zeichen lange Zeichenkette erzeugt, hat den Zweck der Seite
   mißverstanden**; dieser Satz steht hier, damit er es nicht tut.
2. **Der Zähler entfällt in diesem Block** — also kein `maxLength`. Jede Zahl im Zähler wäre
   entweder kleiner als der gezeigte Wert (dann zeigt die Musterseite eine Überschreitung des
   **Deckels**, und das ist ein anderer Zustand, den niemand gezeichnet hat) oder größer (dann
   widerspricht sie dem Satz). Der Zähler ist in den beiden oberen Blöcken bereits zweimal
   vorgeführt (500 und 2000), und der Block „gesperrt" daneben führt ihn ebenfalls nicht — die
   Bauart ist also nicht neu, sondern die vorhandene.
3. **Die Überschrift des Blocks heißt, was der Block zeigt.** Aus „Fehlerzustand" wird
   **„Absage des Dienstes an diesem Text"**. Das ist kein neues Vokabular: `showcase/InventorySection.tsx`
   führt „nach Absage des Dienstes" schon als Zustandsnamen des Dialogs. „Fehlerzustand" ist die
   Einladung, den Kanal für den Tadel an einer Benutzereingabe zu halten — und genau das war er
   bisher.

**Ausdrücklich nicht mit zu ändern:** der Zustandsname **„fehlerhaft"** in der Bausteinliste
(`showcase/InventorySection.tsx`, Zeile „Vermerk- und Leistungsfeld"). Er benennt den **sichtbaren**
Zustand (`note--invalid`, `aria-invalid`) und nicht den Kanal; er trägt auch eine eigene Absage der
Oberfläche, falls einmal eine dazukommt. Ihn auf „Absage des Dienstes" zu verengen würde den
Baustein enger machen, als 14.6 ihn beschreibt.

### 14.6 Der Satz an `error` selbst — die Auflage aus Z-48

Z-48 verlangt am Baustein einen Satz, der die Asymmetrie erklärt: warum die eine Eigenschaft fällt
und die andere bleibt. Ohne ihn liest der nächste Prüfer `error` als das nächste Anzeichen
derselben Sorte — und das ist wörtlich die Entstehungsgeschichte von O-HL. **Der Inhalt ist meiner,
die Zeile ist frontend-devs.** Zwei Aussagen, mehr nicht:

> **`error` trägt die Absage an *diesem Text*** — die des Dienstes, und die eigene, wenn die
> Oberfläche dieselbe Regel vorwegnimmt.
>
> **`error` trägt nicht die Bedingung der Tagesgruppe** (E-034). Sie gilt der **Gruppe**, nicht dem
> Feld, sie steht als Hinweis daneben (`BILLING_NOTE_MAY_BE_EMPTY`, **SP-08**) — und ein Feld kann
> sie gar nicht wahrheitsgemäß tragen: Eine einzelne Buchung ohne Leistung ist tadellos, solange
> eine andere Buchung derselben Gruppe Text trägt.

### 14.7 Fluß, Fokus und Ansage

Der Musterblock hat keinen Fluß — er ist ein stehender Zustand. Der Fluß, den er **vorführt**, ist
der eines Aufrufers, und er gehört dazu, sonst baut ihn jeder Aufrufer neu:

| Schritt | Was | Was der Benutzer sieht und hört |
|---|---|---|
| **Start** | Dialog offen, Leistungsfeld gefüllt | Kopfband, Marke, Fußnote; **keine** Meldung. Die Meldefläche steht leer im Baum (T-186, `note__live`) |
| **Aktion** | Absenden | — |
| **Feedback** | Der Dienst weist den Wert ab. Der Satz aus 14.3 erscheint in der Meldefläche des Feldes, der Fokus geht in das Feld | Der Satz, sichtbar unter dem Feld und **angesagt** — die Fläche stand vorher schon da, deshalb wird die Änderung gemeldet |
| **Erfolg** | Der Benutzer kürzt und sendet erneut | Mit der Änderung fällt die Meldung — über `error={undefined}`, nie über CSS (**P-6**, E-078 Nachtrag 8) |
| **Fehlerpfad** | Der Dienst weist erneut ab | Derselbe Satz. Eine unveränderte Zeichenkette in einer stehenden Meldefläche wird **nicht erneut angesagt** — den zweiten Bescheid trägt hier der Dialog (`FormDialog.error`), nicht das Feld |
| **Zweiter Weg hinaus** | „Abbrechen" oder Esc | Der Dialog schließt, der Fokus kehrt auf den Auslöser zurück |
| **Sackgasse** | keine — kürzen oder abbrechen, beides erreichbar und beides sichtbar | — |

**Was dabei ausdrücklich nicht geschieht:** kein Toast (S-13 gilt der vollzogenen Handlung), kein
Abschneiden des Werts durch die Oberfläche (das wäre die stille Änderung der Benutzereingabe, die
`http/input.ts` an ihrem eigenen Eingang ablehnt), und kein zweiter Satz von uns neben dem des
Dienstes im Dialog (**S-10**).

### 14.8 Akzeptanzkriterien für frontend-dev

Gültig für den Auftrag aus **Z-68/Z-69**; die Punkte 1 bis 6 betreffen `showcase/NotesSection.tsx`,
Punkt 7 und 8 `components/NoteField.tsx`.

1. **`required` fällt ersatzlos** — die Eigenschaft, der `*`/`(Pflichtfeld)`-Zweig an der
   Beschriftung, `required` und `aria-required` am Textfeld. Kein Ersatz, keine Umbenennung.
2. **`error` bleibt** und behält seinen Wirt: die Meldefläche steht **immer** im Baum, auch leer
   (T-186, `note__live`, `role="alert"`). An dieser Bauart wird nichts angefaßt.
3. **Der Fehlertext des Musterblocks lautet zeichengleich:** `Leistung: länger, als der Dienst
   annimmt.`
4. **Der Musterblock zeigt einen gefüllten Wert** (14.5 Punkt 1) und **kein `maxLength`**
   (14.5 Punkt 2). Der Zustandsname des Blocks lautet „Absage des Dienstes an diesem Text".
5. **Der Zustandsname „fehlerhaft" in `showcase/InventorySection.tsx` bleibt unverändert**
   (14.5, letzter Absatz). Wer ihn mit anfaßt, verengt den Baustein.
6. **Im Produkt fällt kein zugänglicher Name.** Kein Aufrufer setzt `required`; die Streichung ist
   dort zeichenlos, und „(Pflichtfeld)" bleibt über `FormDialog.tsx#TextField` erhalten (T-212
   Z-69). **Ein Prüffall auf den Namen des Musterblocks wird nicht gebaut** — er hielte eine
   Vorführung fest.
7. **Der Kommentar an `error` trägt die zwei Aussagen aus 14.6**, in eigenen Worten, aber ohne eine
   davon wegzulassen. Er ist der Grund, aus dem dieser Auftrag nicht eine Zeile ist.
8. **Der bestehende Lauf wird gefahren:** `tests/e2e/timer-stop-announcement.spec.ts` mißt, daß
   `.note__live[role="alert"]` von Anfang an leer im Baum steht. Das ist die Sicherung an diesem
   Baustein, und sie ist gebaut (T-192, Testplan Abschnitt 28).

### 14.9 Was dieser Abschnitt nicht entscheidet — und zwei Sätze für das Board

**Nicht entschieden:** ob und wie **O-AX** behoben wird. Der Satz aus 14.3 setzt nichts darüber
voraus; er wird richtiger, wenn die Deckel eine Zahl aus einer Quelle bekommen, und er wird nicht
falsch, wenn es beim heutigen Zustand bleibt.

**Zwei Vorschläge für das Board, beide aus Messungen dieses Nachtrags, beide fremde Hoheit:**

1. **An domain-dev / local-api — die Frage hinter der Wiedervorlage in 12.9, in beantwortbarer
   Form.** Nicht „soll der Dienst zwei Lagen liefern", sondern: *Welche Absagen kann
   `POST /export/preview` überhaupt geben, wenn `templateId: null` geschickt wird — und ist
   „Export nicht eingerichtet" darunter?* Am Code gelesen (Berichtigung zu 12.10) kommt der
   **Exportordner auf diesem Weg nicht vor**, und die Standardvorlage ist nach A-8.7 nicht
   löschbar. Trifft das zu, ist die Trennung, auf die 12.9 wartet, **eine andere als angenommen**,
   und beide L3-Titel bleiben, wie sie sind.
2. **An frontend-dev, angehängt an O-II** — nicht als neue Aufgabe: `dayGroup.ts` ruft im `catch`
   `errorMessage(cause)` und wirft damit `errorCode(cause)` weg, den `api/client.ts` selbst
   *„die einzige Größe zum Verzweigen"* nennt. Wer O-II baut, entscheidet damit ohnehin, ob der
   Schlüssel mitkommt — und **das** ist der Auslöser der Wiedervorlage aus 12.9.

---

## 15. Ein Knopf, zwei Beschriftungen — und wohin der Fokus geht, wenn sein Ziel zu Recht fällt (Nachtrag T-222)

**Grundlage:** **F-10** aus `docs/design/traeger-und-zusage.md` 11.11 (ui-designer, T-218), dessen
Abschnitte 11.2 bis 11.8 als bindende Vorgabe für alles außer dem Wortlaut; T-200 **Z-59**;
**E-034**, **E-078** Punkt 1 und 5, **E-080** Punkt 4, **E-081** Punkt 2, **E-087**; eigene Regeln
**S-07**, **S-08**, **S-13**, **S-15**, **S-15a**; WCAG 2.2 SC 2.4.3, 2.4.6, 2.5.3, 2.5.8, 3.2.4.
Gelesen am 2026-09-06: `components/ExportGroups.tsx`, `components/Primitives.tsx`,
`components/Icon.tsx`, `screens/TemplatePreview.tsx`, `screens/ExportScreen.tsx`,
`screens/BookingDialogs.tsx`, `styles/components.css`, `styles/app.css`, `lib/format.ts`,
`showcase/ExportPreviewSection.tsx`.

**Was hier entschieden wird.** Der **Wortlaut** der zwei Beschriftungen, der **Wortlaut** des
verborgenen Zusatzes, der **volle zugängliche Name je Zustand** — und die Regel, um die
ui-designer in 11.6 gebeten hat.

**Was hier nicht entschieden wird.** Baustein, Sinnbild, Ausprägung, Größe, Bewegung und Dichte
stehen in 11.3 und 11.7 und sind ui-designers Feder; ich fasse sie nicht an. Eine Ausnahme, und
sie ist eine Berichtigung und keine Übernahme: der **Rechenweg** der Dichte (15.6). Ich nenne den
gemessenen Widerspruch und gebe die Zahl an ihn und an visual-qa zurück, statt eine eigene
Gestaltentscheidung daraus zu machen.

### 15.1 Nutzerziel und Erfolgskriterium

**Nutzerziel.** Eine Tagesgruppe, die ohne Leistungstext beim Export stehenbleibt, soll mitgehen.
Der Benutzer trägt die Leistung an der Buchung nach, an der sie fehlt.

**Erfolgskriterium, dreiteilig — alle drei müssen zutreffen:**

1. Die Leistung steht an der Buchung, und die Fläche zeigt sie.
2. Der Benutzer steht **weiterhin an seiner Buchung** — der Fokus liegt auf demselben
   Bedienelement, von dem aus er losgegangen ist, nie auf `<body>` (11.1).
3. **Was das Auge sieht, sagt das Ohr.** Der Knopf hieß „nachtragen" und heißt danach
   „bearbeiten"; wer die Zeile hört, hört denselben Wechsel wie der, der sie sieht.

Punkt 3 ist der Grund, aus dem der Wortlaut zu dieser Aufgabe gehört und nicht nachgereicht werden
kann: Die Beschriftung **ist** in diesem Fluß die Rückmeldung (11.3), nicht ihre Beschriftung.

### 15.2 Die zwei Beschriftungen: ich nehme ui-designers Fassungen

> **Leistung fehlt:** „Leistung nachtragen"
> **Leistung ist da:** „Leistung bearbeiten"

**Beide je 19 Zeichen, je zwei Wörter, je Verb mit Objekt.** Sie halten S-07 (höchstens drei
Wörter, höchstens 24 Zeichen) mit Abstand, und sie halten die drei Bedingungen, die ui-designer in
11.4 an jeden Gegenvorschlag stellt: gleiches erstes Wort (a), gleiche Länge (b), Zusatz mit Komma
(c). Ich nehme sie nicht aus Bequemlichkeit, sondern weil sie die Prüfung bestehen:

| Prüfung | Ergebnis |
|---|---|
| **S-07** — Handlung, nicht Zustimmung | Verb + Objekt in beiden. Kein „OK", kein „Ändern?", kein Zustand als Knopfname |
| **E-078 Punkt 1** — was steht doppelt? | Nichts. Der Knopf ist kein Satz über die Fläche, er **ist** die Handlung. Das Wort „Leistung" steht im leeren Fall ein zweites Mal in derselben Zeile („— keine Leistung erfasst —"), aber als **Zustand** und nicht als Aussage; ein geteiltes Substantiv ist keine doppelte Auskunft, sondern der gemeinsame Gegenstand |
| **E-080 Punkt 4** — die beste Anrede ist keine | Beide Fassungen kommen ohne Anrede aus, und keine kürzere sagt dasselbe. Der Vorrang der anredefreien Fassung ist hier baulich erfüllt, nicht abgewogen |
| **E-034** — kein Pflichtcharakter | „nachtragen" sagt: es fehlte zu Recht, und es kommt jetzt dazu. Es sagt **nicht** „fehlt", „erforderlich", „Pflichtfeld". Das ist derselbe Maßstab, an dem in 14.4 sechs Fassungen gescheitert sind, und dieser besteht ihn |
| **Hausvokabular** | „Leistung" ist das Wort der Spezifikation für den abrechnungsrelevanten Text der Buchung (A-7.3) und steht so in der Zeile, im Feld und im Hinweis. „bearbeiten" ist das Wort, das der Dialog dahinter selbst führt: sein Titel lautet „Buchung bearbeiten". Der Knopf verspricht damit wörtlich, was er öffnet |
| **SC 2.4.6** in beiden Zweigen | erst mit dem Zusatz aus 15.4. Die sichtbare Beschriftung allein steht in einer Liste von acht Buchungen achtmal gleich da — das ist die Lücke, und sie wird dort geschlossen, nicht hier |

**Der Punkt, an dem die Wahl mehr ist als Geschmack: der Wechsel ist die Rückmeldung.** „nachtragen"
und „bearbeiten" unterscheiden sich in **einem** Wort und stimmen im ersten überein. Wer den Knopf
gesehen hat, erkennt ihn wieder; wer ihn hört, hört genau die eine Silbe, die sich geändert hat.
Zwei Fassungen, die sich vollständig unterscheiden („Leistung nachtragen" gegen „Buchung ändern"),
wären an derselben Stelle zwei Gegenstände — und dann wäre der überlebende Knoten aus 11.2 zwar
gebaut, aber nicht mehr erkennbar.

### 15.3 Verworfene Fassungen, je mit Grund

| Verworfen | Warum |
|---|---|
| „Nachtragen" / „Bearbeiten" | **kürzer, und dafür gegenstandslos.** Der zugängliche Name lautete dann „Nachtragen, Buchung 09:00–10:20" — nachgetragen **was**? In einer Buchungszeile gibt es drei Werte, die man nachtragen könnte. E-078 kürzt die Menge, nicht den Gegenstand. Dazu: „Bearbeiten" ist wörtlich die heutige Fassung in `TemplatePreview.tsx`, und **genau sie** hat T-200 als Befund benannt |
| „Leistung erfassen" / „Leistung bearbeiten" | **„erfassen" ist im Produkt vergeben** und meint das Anlegen einer Buchung („Zeit von Hand erfassen"). Der Knopf legt nichts an — die Buchung besteht, leer ist nur ihr Text (11.3). Dazu bricht das Paar Bedingung (b): acht Buchstaben gegen zehn |
| „Leistung ergänzen" / „Leistung ändern" | **„ergänzen" heißt: zu etwas Vorhandenem hinzu.** Vorhanden ist nichts — die Zeile sagt daneben „— keine Leistung erfasst —". Und „ändern" ist im selben Fluß bereits als **Meldung** vergeben („Buchung geändert.", 12.3); derselbe Stamm für den Knopf und für die Bestätigung seiner Wirkung macht aus zwei Auskünften eine |
| „Leistung nachtragen" in **beiden** Zuständen | **hielte die Spalte vollkommen still und wäre nach dem ersten Gelingen falsch.** Ein Knopf, der nach getaner Arbeit weiter zum Nachtragen auffordert, ist die stille Variante desselben Fehlers, den O-HX behoben hat: eine Aussage, die ihren Gegenstand verloren hat |
| „Leistung fehlt" | **ein Zustand als Knopfname** (S-07) — und er erklärt das Feld zur Pflicht, die E-034 ausdrücklich nicht kennt. Dieselbe Verwechslung ist in 14.4 schon einmal einem Wortlaut zum Verhängnis geworden |
| „Leistung eintragen" / „Leistung bearbeiten" | **nah dran und trotzdem schwächer.** „eintragen" ist der neutrale Vorgang, „nachtragen" die Lage: etwas, das später kommt als der Rest, und zwar erlaubterweise. Genau diese Lage ist E-034. Außerdem stünde „Leistung nachtragen" danach an drei Flächen und „Leistung eintragen" an einer — vier Stellen, zwei Wörter, ein vermeidbarer Unterschied |
| „Leistung der Buchung 09:00–10:20 bearbeiten" als sichtbarer Text | die heutige **Namensform**, sichtbar gemacht: 43 Zeichen, weit über S-07. Sie war nie als Beschriftung gedacht und taugt auch nicht dazu |

### 15.4 Der verborgene Zusatz und der volle Name

**Wortlaut.**

> `, Buchung ` + der Zeitraum der Zeile, **zeichengleich aus derselben Quelle**, aus der die Zeile
> ihn sichtbar zeigt.

In `ExportGroups.tsx` ist das `entry.period`, in `TemplatePreview.tsx`
`formatTimeRange(entry.startedAt, entry.endedAt)` — die Zeichenkette, die 40 px weiter links
ohnehin steht. **Keine zweite Formatierung**, kein „von 09:00 bis 10:20", keine ausgeschriebene
Uhrzeit: Was die Vorlesehilfe aus „09:00–10:20" macht, macht sie an beiden Stellen gleich, und ein
zweiter Wortlaut für denselben Zeitpunkt wäre die Abschrift, die S-15a im letzten Absatz verbietet.

**Die volle Fassung je Zustand:**

| Zustand | sichtbar | verborgen | zugänglicher Name |
|---|---|---|---|
| Leistung fehlt | `Leistung nachtragen` | `, Buchung 09:00–10:20` | **„Leistung nachtragen, Buchung 09:00–10:20"** |
| Leistung ist da | `Leistung bearbeiten` | `, Buchung 09:00–10:20` | **„Leistung bearbeiten, Buchung 09:00–10:20"** |

**Warum hinten und mit Komma:** Regel **S-15a**. Vorn stünde der Bezug zwischen dem Anfang des
Namens und der sichtbaren Beschriftung, und S-15 verlangt sie wörtlich **und am Anfang**
(SC 2.5.3).

**Warum das keine Textzugabe im Sinne von E-078 ist.** Der Zusatz trägt **keine neue Auskunft**. Er
schreibt einen Wert ab, den das Auge aus der Nachbarschaft nimmt und das Ohr in einer Liste von
acht Zeilen nicht. Genau diese Richtung ist in **E-081 Punkt 2** entschieden: Nachtrag 8 zu E-078
gilt gegen **Verluste**, nicht gegen **Zugaben** — das Gehör darf mehr bekommen, wenn die Bauart es
begründet. Hier begründet sie es, und dieselbe Bauart steht in derselben Zeile bereits dreimal
(„In der Tagesgruppe berücksichtigen: ", „Ungerundete Dauer: ", „Herkunft: ").

**Eine Berichtigung an 11.4, die nichts am Ergebnis ändert und trotzdem hingehört.** ui-designer
verwirft `aria-label` mit der Begründung, es verstieße gegen SC 2.5.3. Das trifft auf die **alte**
Namensform zu („Leistung der Buchung 09:00–10:20 bearbeiten" enthält „Leistung bearbeiten" nicht am
Stück) — auf die **neue** nicht: „Leistung bearbeiten, Buchung 09:00–10:20" enthält die sichtbare
Beschriftung wörtlich und am Anfang, als `aria-label` wie als Inhalt. Der Weg über `aria-label`
wäre nach 2.5.3 also erlaubt. **Er bleibt trotzdem verworfen, und der Grund ist ein anderer:** Ein
`aria-label` schreibt die sichtbare Beschriftung ein zweites Mal auf. Wer später „bearbeiten" in
„ändern" ändert und die zweite Stelle übersieht, bricht 2.5.3, **ohne daß irgendetwas rot wird**.
Der verborgene Zusatz kann das nicht: Er enthält die Beschriftung gar nicht, sondern hängt sich an
sie an. Das ist die Bauart, in der die Zusage eine Eigenschaft ist und keine Zusage — dasselbe
Argument, mit dem 11.2 zwischen einem und zwei Bausteinen entschieden hat. **Der richtige Grund
gehört in den Kommentar, nicht der naheliegende**, sonst kommt der Weg beim nächsten Durchgang mit
dem Hinweis zurück, 2.5.3 sei doch erfüllt.

**Ein Nebenwirkung der Bauart, die in die Prüffälle gehört (aus der Namensbildung abgeleitet, nicht
gemessen).** Der Name entsteht hier aus **zwei** Knoten. Namensbildende Verfahren fügen die Teile
mit einem Leerzeichen zusammen; je nach Vorlesehilfe und Browser kann der gemessene Name deshalb
„Leistung nachtragen , Buchung 09:00–10:20" lauten — mit Leerraum vor dem Komma. Das ist für den
Hörenden folgenlos und für einen zeichengleichen Vergleich in einem Prüffall nicht. **Daraus die
Auflage in 15.9 Punkt 7:** Der Prüffall mißt **Enthaltensein** zweier Teile, nicht Gleichheit einer
ganzen Zeichenkette. Ein Vergleich, der an einem Leerzeichen bricht, mißt die Namensbildung des
Browsers und nicht unseren Text.

### 15.5 Es sind vier Stellen, nicht drei — und die vierte kannten wir schon

Die Übergabe in 11.8 nennt drei Flächen. Gemessen am 2026-09-06 trägt „Leistung nachtragen" **vier**
Knöpfe; dieselbe Zahl steht seit T-203 in 12.2 dieses Papiers. Fehlend ist die **Gruppenebene** in
`TemplatePreview.tsx`: der Knopf in der Sperrmeldung, der den Dialog an der **ersten** Buchung der
Gruppe öffnet.

Das ist kein Schönheitsfehler, sondern derselbe Befund eine Ebene höher: Bekommen die Zeilenknöpfe
einen Zeilenbezug und der Gruppenknopf keinen, dann steht in **derselben** aufgeklappten Gruppe ein
Knopf, dessen Name der **Anfang** der Namen aller anderen ist und der etwas anderes tut. Wer eine
Knopfliste durchgeht, hat danach genau die Verwechslung, die der Zusatz beseitigen sollte.

| # | Fläche | sichtbar | verborgener Zusatz | zugänglicher Name | was der Knopf erreicht |
|---|---|---|---|---|---|
| 1 | `ExportGroups.tsx`, Buchungszeile | „Leistung nachtragen" / „Leistung bearbeiten" | `, Buchung <entry.period>` | „… , Buchung 09:00–10:20" | den Dialog **an dieser Buchung** |
| 2 | `TemplatePreview.tsx`, Buchungszeile | dieselben zwei | `, Buchung <formatTimeRange(…)>` | ebenso | den Dialog **an dieser Buchung** |
| 3 | `TemplatePreview.tsx`, **Sperrmeldung der Gruppe** | „Leistung nachtragen", **ein Zustand, kein Wechsel** | `, Tagesgruppe <formatDayLabel(day)>` | „Leistung nachtragen, Tagesgruppe So., 30.08.2026" | den Dialog an der **ersten** Buchung dieser Gruppe |
| 4 | `ExportScreen.tsx`, `SkippedRow` | „Leistung nachtragen", **ein Zustand, kein Wechsel** | `, <formatDayLabel(day)>` | „Leistung nachtragen, So., 30.08.2026" | **das Todo** — nicht die Buchung |

**Zu 3, und warum der Zusatz dort die Gruppe nennt und nicht die Buchung.** Der Knopf steht in der
Meldung „Diese Tagesgruppe ist nicht exportierbar" und gehört zu deren Gegenstand. Daß er den
Dialog an der ersten Buchung öffnet, ist der einzige Weg, an dieser Stelle anzufangen — und
harmlos, weil `blocked` dort heißt, daß **keine** Buchung der Gruppe Text trägt. Ein Zusatz, der
„Buchung 09:00–10:20" sagte, verspräche eine Auswahl, die der Benutzer nicht getroffen hat; ein
Zusatz, der die Gruppe nennt, sagt die Wahrheit über den Gegenstand. **Der Knopf bekommt keine
zweite Beschriftung** — an ihm wechselt nichts, denn mit dem Nachtragen verschwindet die Meldung,
in der er steht.

**Zu 4, und der Befund bleibt der aus 12.6 (a).** Dieser Knopf springt über `navigate` auf das
Todo; dort muß der Benutzer die richtige Buchung des richtigen Tages erst suchen. Der Zusatz macht
das **nicht schlimmer**, aber er macht es **sichtbarer**: Ein Name, der den Tag nennt, verspricht
präziser als vorher, was der Knopf nicht auf demselben Weg einlöst. Ich bleibe bei meinem Urteil
von T-203 — **Fluß-, kein Wortlautbefund**, gehört mit dem Ergebnisblock entschieden und nicht
nebenbei. Bis dahin gilt: der Zusatz nennt den Tag, weil der Tag das ist, was die Zeile sichtbar
zeigt (S-15a).

**Und ein Befund, den ich beim Messen von 4 gefunden habe** (aus dem Quelltext gelesen, nicht am
laufenden Fenster): Die Liste der ausgelassenen Gruppen ist über `${todoId}-${day}` verschlüsselt,
zeigt aber **nur** Tag, Anzahl und Dauer. Zwei ausgelassene Gruppen **verschiedener Todos am selben
Tag** ergeben damit zwei Zeilen mit gleichem sichtbarem Text und — nach dieser Änderung — gleichem
zugänglichem Namen. Der Zusatz kann das nicht heilen, weil er abschreibt, was dasteht.
**Vorschlag, nicht Auflage:** Die Zeile zeigt den Titel des Todos, auf das ihr Knopf springt (durch
`Foreign`, E-063); der Zusatz nimmt ihn dann mit. Das gehört in denselben Auftrag wie 12.6 (a) und
nicht in diesen.

### 15.6 Berichtigung an 11.7: das Raster gilt je Zeile, nicht je Liste

**Der Satz in 11.7 lautet:** *„Rasterspalten gelten für alle Zeilen zugleich: Ein beschrifteter
Knopf verbreitert Spalte 7 für die ganze Liste, nicht je Zeile."* Daraus folgt dort der Schluß, der
Preis sei in jeder Gruppe, die schon heute eine Buchung ohne Leistung enthält, **bereits bezahlt**.

**Gemessen an der Kaskade stimmt das nicht** (`components.css`, gelesen am 2026-09-06):

```css
.eentries { display: flex; flex-direction: column; … }
.eentry   { display: grid; grid-template-columns: auto auto auto auto auto minmax(0, 1fr) auto; … }
```

Die Liste ist ein **Flex-Stapel**, und **jede Zeile ist ihr eigenes Raster**. Kein `subgrid`, keine
gemeinsame Spaltenachse. Dasselbe gilt in der Vorschau: `.tpsegment-list` ist Flex,
`.tpsegment` ist je Zeile ein Raster mit vier Spalten (`app.css`). Daraus folgt dreierlei, und
alles drei geht in die Gegenrichtung des Schlusses in 11.7:

1. **Die Spalten der Zeilen sind schon heute nicht bündig.** Eine Zeile mit `Button` und die
   nächste mit `IconButton` haben verschieden breite letzte Spalten. Was 11.7 als bereits bezahlten
   Preis beschreibt, ist in Wahrheit ein bereits vorhandener **Riß** — und die Vereinheitlichung
   auf **einen** Baustein macht die Liste an dieser Stelle ruhiger, nicht unruhiger.
2. **Der neue Preis fällt je Zeile an, und er fällt in jeder Zeile mit Leistung.** Heute trägt eine
   gefüllte Zeile 28 px Sinnbildknopf, künftig einen beschrifteten. Der Verlust an Leseraum trifft
   damit **alle** gefüllten Zeilen, nicht nur die Gruppen, in denen jede Buchung ihre Leistung hat.
   Das ist mehr als 11.7 veranschlagt, und es ist die Zahl, an der der dort vorab entschiedene
   Rückfall hängt.
3. **Der Wechsel der Beschriftung bewegt nur seine eigene Zeile.** Bedingung (b) aus 11.4 —
   gleiche Länge, damit die Spalte sich nicht bewegt — trägt also weiter, aber aus einem engeren
   Grund: Gleiche Buchstabenzahl ist nicht gleiche Breite; die Differenz zwischen „nachtragen" und
   „bearbeiten" ist in einer proportionalen Schrift nicht null. Sie bewegt aber **eine** Zeile um
   wenige Pixel und nicht die Liste.

**Was ich daraus nicht mache: eine Gestaltentscheidung.** Der Auftrag an visual-qa in 11.7 ist
richtig gestellt und bekommt von mir nur einen Satz mehr: **gemessen wird an einer Gruppe, in der
jede Buchung ihre Leistung trägt** — das ist nach dieser Berichtigung der teure Fall und nicht der
harmlose. Der dort vorab entschiedene Rückfall (Sinnbildknopf in **beiden** Zuständen, `label`
gleich den Namen aus 15.4) bleibt unberührt; er kostet keinen meiner Wortlaute, weil die Namen
zeichengleich bleiben. Das ist der Vorzug daran, den Namen und nicht die Erscheinung festzuschreiben.

**Ein Nebenbefund zugunsten der Entscheidung.** In `TemplatePreview.tsx` wechselt die Beschriftung
heute zwischen „Leistung nachtragen" (19 Zeichen) und „Bearbeiten" (10). Nach dieser Aufgabe
wechselt sie zwischen 19 und 19. Die Zeile wird dort also **ruhiger**, und zwar an der einzigen
Fläche, an der man das heute schon sehen kann.

### 15.7 Der Fluß am Knopf: Start, Aktion, Rückmeldung, Erfolg, Fehlerpfad

Der Fluß des Nachtragswegs steht vollständig in 12.2. Hier steht der Ausschnitt, den **dieser
Knopf** trägt — vollständig, damit frontend-dev nichts ableiten muß.

| Schritt | Was | Was der Benutzer sieht | Was der Benutzer hört |
|---|---|---|---|
| **Start** | Zeile ohne Leistung | „— keine Leistung erfasst —", daneben „Leistung nachtragen" in der festeren Ausprägung (11.3) | „Leistung nachtragen, Buchung 09:00–10:20", Knopf |
| **Aktion** | Klick oder Eingabetaste | Dialog öffnet, Fokus hinein, Titel „Buchung bearbeiten" | Titel und Feld des Dialogs |
| **Wartezeit** | Dialog arbeitet | **an der Zeile ändert sich nichts** — kein Wartezustand, keine Sperre (11.5). Die Arbeit steht am Absendeknopf des Dialogs | nichts aus der Zeile |
| **Rückmeldung** | Dialog schließt | Fokus kehrt auf **denselben** Knopf zurück; Meldung nach der Lage (12.3) | die Meldung |
| **Erfolg** | Auffrischung trifft ein | die Leistung steht in der Zeile; der Knopf heißt „Leistung bearbeiten" und ist leiser geworden; der Fokusring steht unverändert auf ihm | **abgeleitet, nicht gemessen:** der Namenswechsel am fokussierten Knoten wird nicht von jeder Vorlesehilfe von selbst gemeldet. Die verläßliche Ansage ist die Meldung aus 12.3 |
| **Fehlerpfad Dienst** | Absage beim Speichern | Dialog **bleibt offen**, Eingaben stehen, Grund wörtlich in der Fehlerfläche (S-10). Die Zeile ist unberührt, der Knopf heißt weiter „nachtragen" | die Fehlerfläche des Dialogs |
| **Fehlerpfad Auffrischung** | Speichern gelingt, die Liste lädt nicht nach | die Zeile zeigt den alten Stand, der Knopf heißt weiter „nachtragen" — **und das ist richtig**: die Zeile zeigt, was Takt gerade weiß. Die Meldung hat die Buchung bereits als geändert gemeldet (L4, 12.3) | die Meldung |
| **Abbruch** | „Abbrechen" oder Esc | Dialog schließt, Fokus zurück auf denselben Knopf, unverändert | nichts Zusätzliches |
| **Sackgasse** | keine | Der Rückweg steht in jeder Lage an derselben Stelle: der Knopf, auf dem der Fokus liegt | — |

**Tastatur und Fokus.** Die Zeile hat vor und nach der Änderung **dieselben zwei** Haltepunkte im
Tabulatorlauf: das Kontrollkästchen und den Knopf. Aus einem `IconButton` wird ein `Button` — ein
Bedienelement bleibt ein Bedienelement, die Reihenfolge ändert sich nicht, es kommt keiner hinzu
und keiner fällt weg. Die Klickfläche wächst (11.3, SC 2.5.8).

**Was ausdrücklich nicht geschieht:** keine Ansage über eine eigene Live-Region für den
Namenswechsel. Sie wäre die zweite Auskunft über dasselbe Ereignis neben der Meldung aus 12.3 und
damit die Verdopplung, die E-078 Punkt 5 meint. **Die Meldung ist die Ansage** — das ist die
Entscheidung, und sie ist dieselbe wie in 11.4 („dasselbe Ereignis, zwei Kanäle, eine Quelle").

### 15.8 Die Regel, um die ui-designer gebeten hat: wohin der Fokus gehört, wenn das Ziel zu Recht fällt

Die Frage aus 11.6 ist ausdrücklich keine Frage über diesen Knopf — hier fällt nach 11.2 nichts.
Sie ist die allgemeine: **Wohin gehört der Fokus, wenn das Rückkehrziel legitim verschwindet?**
ui-designers Ersatzkette R-2 beantwortet sie als **Weg durch den Baum**: Nachfolger, Behälter,
Bereichsüberschrift, `<h1>`. Das ist als Bauform richtig und als Regel unvollständig, weil ein Baum
nicht weiß, was der Benutzer vorhatte.

> **Der Satz.** Der Fokus folgt der **Arbeit**, nicht dem Baum: Er geht auf das Bedienelement, mit
> dem der Benutzer die begonnene Arbeit **fortsetzt** — und wo es keines mehr gibt, auf die
> kleinste Fläche, die die **Folge** seiner Handlung zeigt. Nie auf `<body>`; `<body>` ist kein
> Ziel, sondern die Meldung, daß keines gewählt wurde.

Vier Stufen, erster Treffer gewinnt. Sie ordnen sich nach der Frage *was ist von der Arbeit übrig*,
nicht nach der Entfernung im Baum:

| # | Lage | Ziel | Warum |
|---|---|---|---|
| **N-1** | Der Gegenstand lebt, nur woanders (die Zeile ist verschoben, umsortiert, in eine andere Spalte gewandert) | **seine neue Darstellung** — dasselbe Bedienelement am selben Gegenstand | Die Arbeit geht weiter, nur an einem anderen Ort. Ein Sprung in die Liste wäre hier ein Verlust und keine Rettung |
| **N-2** | Der Gegenstand ist fort, die Liste bleibt | **der Nachfolger in der sichtbaren Reihenfolge**; war es der letzte, der Vorgänger | Der Benutzer arbeitet eine Liste ab. **„Sichtbar" ist die Verschärfung gegenüber R-2:** gemeint ist die Reihenfolge nach Filter und Sortierung, die er vor sich hat, nicht die der Daten. In Takt ist das der Unterschied zwischen der gefilterten Liste und dem, was der Dienst geliefert hat |
| **N-3** | Der Gegenstand war der letzte — die Liste ist danach leer | **die eine Aktion des Leerzustands** (S-08: „genau eine Aktion"); trägt der Leerzustand keine, sein **Titel** mit `tabindex="-1"` | **Die zweite Verschärfung gegenüber R-2.** Ein leerer Behälter mit `tabindex="-1"` ist eine Sackgasse mit Namen: Der Benutzer landet auf einer Fläche, die nichts kann, und muß den nächsten Schritt suchen. Takt zeichnet diesen Schritt bereits — der Leerzustand trägt ihn als Knopf. Er ist das Ziel |
| **N-4** | Die Fläche selbst ist fort (die Ansicht hat gewechselt, der Bereich ist verschwunden) | **`.screen__title`** der Ansicht, die jetzt steht, `tabindex="-1"` | die Untergrenze. Von hier ist jeder Weg wieder erreichbar. Dieselbe Stufe wie R-2 Nummer 4 |

**Was von ui-designers Regeln unverändert gilt und hier nicht wiederholt, sondern bestätigt wird:**
R-1 (ein Ziel taugt nur, wenn es hängt, nicht gesperrt und nicht verborgen ist), R-3 (eine Stufe
ohne zugänglichen Namen wird übersprungen), R-4 (den Ersatz nennt der Aufrufer, nicht der Dialog),
R-5 (die Frage vor dem Bauen) und R-6 (die drei Merkmale, an denen ein Prüfer den Fall erkennt).
N-1 bis N-4 treten an die Stelle der **Tabelle** in R-2, nicht an die der Regeln daneben.

**Die Ansage.** R-3 sagt, die Kette brauche keine eigene: Die Folge ist ohnehin gemeldet
(„Buchung gelöscht"). Das trägt, und ich ergänze die Bedingung, unter der es trägt: **Die Meldung
muß den Gegenstand nennen**, nicht nur die Handlung. „Gelöscht." erklärt einen Sprung nicht;
„Todo „X" gelöscht." erklärt ihn. Das steht ohnehin in S-13 (Handlung + Gegenstand) — die Kette
verläßt sich darauf und darf es.

**Wo diese Regel hingehört und wo nicht.** Sie ist eine Regel und kein Auftrag. Gebaut wird sie mit
dem Ersatzweg aus **F-11**, und ich teile ui-designers Empfehlung: nicht in dieser Welle, sondern
mit der ersten Fläche, die sie braucht. **Ich habe nicht gemessen**, welche Flächen in Takt heute
diese Gestalt haben; wer den Auftrag schneidet, mißt es (E-087) und nimmt N-1 bis N-4 als Maßstab
mit hinein. Die Regel gehört in `DESIGNSYSTEM.md` neben R-1 bis R-6 (11.8) — an eine Stelle, an der
sie beim Bauen gelesen wird, und nicht nur hierher.

### 15.9 Akzeptanzkriterien für frontend-dev

Gültig für den Auftrag aus **O-IH**. Punkt 1 bis 6 betreffen den Wortlaut, 7 den Prüffall, 8 den
Kommentar. Alles Übrige — Baustein, Ausprägung, Sinnbild, Wartezustand, Reihenfolge der Dateien —
steht in 11.8 und gilt unverändert daneben.

1. **Die zwei sichtbaren Beschriftungen lauten zeichengleich:** `Leistung nachtragen`, solange
   `entry.note` leer ist, und `Leistung bearbeiten`, sobald sie es nicht mehr ist. Kein Punkt, kein
   Ausrufezeichen, keine Anrede.
2. **Der verborgene Zusatz lautet** `, Buchung ` gefolgt von **derselben Zeichenkette**, die die
   Zeile sichtbar als Zeitraum zeigt — `entry.period` in `ExportGroups.tsx`,
   `formatTimeRange(entry.startedAt, entry.endedAt)` in `TemplatePreview.tsx`. **Keine zweite
   Formatierung** desselben Zeitpunkts.
3. **Der Zusatz steht hinter der sichtbaren Beschriftung**, im selben Knopf, als
   `visually-hidden`. **Kein `aria-label`** — der Grund steht in 15.4 und gehört in den Kommentar,
   und zwar der richtige: nicht 2.5.3, sondern die zweite Abschrift, die still auseinanderläuft.
4. **Die Gruppenebene in `TemplatePreview.tsx` wird mitgeändert** (15.5, Zeile 3): Der Knopf in der
   Sperrmeldung behält seine Beschriftung `Leistung nachtragen` und bekommt den Zusatz
   `, Tagesgruppe ` mit dem Tag der Gruppe, wie er darüber sichtbar steht. **Ohne diesen Punkt ist
   der Auftrag unvollständig**, und die Verwechslung, die er beseitigen soll, steht eine Ebene
   höher wieder da.
5. **`SkippedRow` in `ExportScreen.tsx`** behält `Leistung nachtragen` und bekommt den Zusatz `, `
   mit dem Tag der Gruppe (`formatDayLabel(skipped.group.day)`). Der Zusatz nennt dort **keine
   Buchung** — der Knopf erreicht keine.
6. **Kein `title` an diesen Knöpfen** (S-16) und **kein zweiter Zusatztext** neben dem verborgenen
   (S-15).
7. **Der Prüffall mißt Enthaltensein, nicht Gleichheit.** Erwartet wird, daß der zugängliche Name
   `Leistung bearbeiten` **und** `Buchung 09:00–10:20` enthält — nicht, daß er einer festen
   Zeichenkette gleicht. Grund in 15.4, letzter Absatz: Der Name entsteht aus zwei Knoten, und der
   Leerraum an der Naht gehört dem Browser, nicht uns.
8. **Der Kopfkommentar an der Stelle nennt beides:** warum **ein** Baustein steht (11.8) und warum
   der Zeilenbezug **im** Knopf steht und nicht als `aria-label` (15.4). Zwei Sätze, und ohne sie
   ist die nächste Aufräumung die Wiederherstellung des Fehlers.

### 15.10 Was dieser Abschnitt nicht entscheidet — und drei Sätze für das Board

**Nicht entschieden:**

* **Die Erscheinung.** Ob am Ende der beschriftete Knopf oder ui-designers Rückfall (Sinnbildknopf
  in beiden Zuständen) steht, entscheidet die Messung aus 11.7 mit der Berichtigung aus 15.6. Meine
  Wortlaute gelten in beiden Bauformen unverändert — im Rückfall als `label`.
* **Der Fluß von `SkippedRow`** (12.6 (a)). Er bleibt offen, wie er offen war.
* **Ob `fallbackFocus` gebaut wird** (F-11). 15.8 sagt, was die Kette tun soll, wenn sie gebaut
  wird, nicht wann.

**Drei Sätze für das Board:**

1. **An ui-designer, zur Kenntnis und ohne Auftrag:** 11.7 rechnet mit einer gemeinsamen
   Spaltenachse, die es in der Kaskade nicht gibt (15.6). Der Preis ist höher als dort
   veranschlagt, die Entscheidung deswegen nicht falsch — aber der Meßauftrag an visual-qa
   braucht den **teuren** Fall, und der ist die Gruppe, in der **jede** Buchung ihre Leistung hat.
2. **An den Orchestrator:** 11.8 nennt drei Flächen, es sind vier (15.5). Wer den Auftrag
   schneidet, nimmt die vierte mit hinein — ui-designers eigene Begründung für „eine Aufgabe, eine
   Hand" gilt für sie genauso.
3. **An frontend-dev, klein und außerhalb dieses Auftrags:** Die Liste der ausgelassenen Gruppen
   kann zwei Zeilen mit gleichem sichtbarem Text zeigen (15.5, letzter Absatz). Gehört zu 12.6 (a)
   und nicht hierher.
