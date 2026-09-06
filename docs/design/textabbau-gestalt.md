# Was der Textabbau für die Gestalt bedeutet — Hierarchie, Dichte, Sinnbilder

**Aufgabe:** T-171, Welle Y. **Verfasser:** ui-designer.
**Grundlage:** `docs/design/textbestand.md` (T-163, fremde Hoheit, hier nur gelesen), E-078 samt
Nachtrag Punkte 6 bis 8, E-076 Punkte 2, 3 und 5, E-080, E-054/E-055, `packages/ui-tokens/tokens.css`,
`apps/web/scripts/contrast-check.mjs`, sowie Abschnitt 4 aus `.claude/team/reports/T-165-spec-ux-reviewer.md`.

**Was dieses Papier ist.** E-078 Punkt 4 legt die Reihenfolge fest: ux-designer nimmt auf,
ui-designer sagt, was das für Hierarchie und Dichte bedeutet, erst dann ändert frontend-dev Text.
Dies ist der mittlere Schritt. Es entscheidet **keinen Wortlaut** — die Wortlaute stehen in T-163
und sind, wo sie einen Prüfer betreffen, in T-165 Abschnitt 4 satzweise gesperrt oder freigegeben.
Es entscheidet, **was an die Stelle des gestrichenen Textes tritt**, und in den Fällen, in denen die
richtige Antwort „nichts" lautet, sagt es den Grund dazu.

**Was dieses Papier nicht ist.** Kein Neuentwurf. Kein neues Token. Keine neue Farbe. Jede Angabe
unten benutzt Werte, die in `packages/ui-tokens/tokens.css` bereits stehen; jedes Farbpaar unten
ist entweder in `contrast-check.mjs` bereits gemessen oder ausdrücklich als **nachzumessen**
gekennzeichnet.

---

## 0. Der Leitsatz

> Wo heute ein Absatz erklärt, was eine Fläche tut, muss morgen die Fläche selbst es sagen. Sie tut
> es nicht durch Dekoration, sondern durch **Rangfolge, Gruppierung, Abstand, Reihenfolge und
> Beschriftung** — fünf Mittel, die alle bereits im Bestand stehen.

Zwei Abgrenzungen, damit dieser Satz nicht falsch gelesen wird.

**Erstens: das sind keine vierten Träger.** E-078 Nachtrag Punkt 6 nennt drei erlaubte Träger der
Enthüllung — Zustandsbindung, Handlungsbindung, Handbuch — und verbietet einen vierten. Diese Liste
beantwortet die Frage **wann eine Auskunft erscheint**. Rangfolge, Gruppierung, Abstand,
Reihenfolge und Beschriftung beantworten eine andere Frage: **wodurch eine Fläche ohne Satz
verständlich ist**. Ein Abstand trägt keine Auskunft, er ordnet sie. Wer aus einem Abstand einen
Träger machen will — eine Sprechblase, ein Aufklapper, eine Zweitfläche —, braucht die Entscheidung
aus Nachtrag Punkt 6 und bekommt sie in diesem Papier nicht.

**Zweitens: weniger Text ist nicht mehr Luft.** Der Bestand ist eine dichte Desktop-Anwendung
(Basisgröße 14 px, Abschnitt 17 der Spezifikation). Fällt eine Textebene weg, wird der Abstand
**nicht** vergrößert. Was gewonnen wird, ist Weglänge für das Auge, nicht Weißraum. An genau einer
Stelle in diesem Papier fällt eine Trennlinie weg (Abschnitt 3.2), und dort wird sie durch **engere
Zusammengehörigkeit** ersetzt, nicht durch Platz.

**Die Prüffrage an jede Streichung.** Nicht „ist es kürzer", sondern: *Beantwortet die Fläche die
Frage, die der Satz beantwortet hat, ohne ihn?* Drei mögliche Antworten:

| Antwort | Folge |
|---|---|
| Ja, durch Titel, Beschriftung, Nachbarschaft oder Zustand | streichen, **nichts** tritt an die Stelle |
| Ja, aber nur wenn die Fläche eine Rangstufe wechselt | streichen **und** die benannte Änderung machen |
| Nein | nicht streichen. Meldung an den Orchestrator, nicht Erfindung eines Trägers |

Unten steht je Stelle, welche der drei zutrifft.

---

## 1. ST-04 — die dreifache Bereichsauskunft der Einstellungen

**Der Befund von T-163 ist gestalterisch schärfer als er dort steht.** Es ist nicht nur eine
Verdopplung, es ist ein **Rangfehler**: Der Ansichtskopf trägt den Titel „Einstellungen" und
darunter einen `lead`, der nicht diesen Titel erläutert, sondern den **gewählten Bereich**
(`SettingsScreen.tsx:203-207`, `AREA_LEAD` bei `:173-180`). Ein `lead` unter einer Überschrift
gehört zu dieser Überschrift. Hier gehört er zu etwas, das erst 20 px weiter unten links in der
Schiene steht. Das ist der Grund, aus dem der Satz nie richtig sitzen konnte, und deshalb ist seine
Streichung eine Berichtigung und keine bloße Kürzung.

### 1.1 Was an die Stelle von `AREA_LEAD` tritt

**Nichts. Der Bereich ist nach der Streichung dreimal benannt statt viermal.**

| Stufe | Fläche | Träger heute | nach ST-04 |
|---|---|---|---|
| 1 | Ansichtskopf | „Einstellungen" (`--text-2xl`) | unverändert |
| 2 | Schiene, aktueller Eintrag | Beschriftung `--weight-medium`, Fläche `--accent-bg-subtle`, Kontur `--accent-border-subtle`, Farbe `--accent-text`, `aria-current="page"` | unverändert, siehe 1.2 |
| 3 | Kartentitel | „Darstellung", „Export", „Status", … (`--text-md`, `--weight-semibold`) | unverändert, **wird zur Bereichsüberschrift** |
| 4 | `AREA_LEAD` | ein Satz im Kopf | **entfällt** |
| 4 | Kartenbeschreibung | ein Satz, meist derselbe | **entfällt oder wird zur Tatsache** |

Der Bereichsname steht nach der Streichung an drei Stellen im selben Blickfeld, dazu in der Adresse
(`?bereich=…`). Das ist reichlich. Nichts tritt an die Stelle des Satzes.

**Eine Änderung ist trotzdem nötig, und sie ist nicht optisch, sondern strukturell:** Nach der
Streichung ist der **Kartentitel** die Überschrift des Bereichs. Damit trägt er eine Last, die er
vorher nicht trug. Zwei Folgen:

1. **Ein Bereich, dessen Panel aus zwei Karten besteht, braucht eine erkennbare erste.** Betroffen
   ist allein `arbeitsplatz` (`SettingsScreen.tsx:264-269`: `WorkstationFacts` + `SecurityNotices`).
   Die Reihenfolge stimmt bereits — „Dieser Arbeitsplatz" steht vor „Sicherheitsmeldungen" —, und
   die Schiene sagt „Arbeitsplatz". **Nichts zu tun.**
2. **Der Kartentitel darf nicht vom Schienenwort abweichen, wo beide dieselbe Sache meinen.**
   Heute heißt die Schiene „Arbeitsplatz" und die Karte „Dieser Arbeitsplatz". Das ist ein
   Deiktikum in einer Überschrift und im Kopf des Lesers ein zweiter Gegenstand. Vorschlag an
   ux-designer: **eine** Fassung, und zwar das kürzere Wort. Der Kartentitel ist vertraglich
   (`Card.title`, E-076 Punkt 3) — die Änderung geht nur mit unit-tester und e2e-tester und ist
   deshalb ausdrücklich als **Vorschlag**, nicht als Vorgabe markiert.

### 1.2 Die Schiene trägt nach der Streichung mehr — und braucht ein Merkmal mehr

Bisher sagte der Ansichtskopf, in welchem Bereich man ist. Fällt er weg, ist die Schiene die
**einzige Fläche, die den gewählten Bereich zeigt, bevor man den Kartentitel liest**. Der aktuelle
Eintrag unterscheidet sich heute an drei Merkmalen, und alle drei sind Farbe
(`app.css:3906-3910`: Fläche, Kontur, Textfarbe). Die Kontur trägt `--accent-border-subtle`, den
schwächsten Akzentwert der Palette.

**Vorgabe.** Die Kontur des aktuellen Eintrags wechselt von `--accent-border-subtle` auf
`--border-accent`. Ein Wert, eine Zeile, keine neue Klasse, kein neues Token.

```
.settings-rail__item--current { border-color: var(--border-accent); }   /* statt --accent-border-subtle */
```

* **Warum kein Balken links, keine Verschiebung, kein Symbolwechsel.** Bei 60 rem und schmaler
  kippt die Schiene in eine umbrechende Zeile (`app.css:3949-3966`); ein Balken an der Startkante
  wäre dort falsch orientiert. Eine Kontur trägt in beiden Ausrichtungen.
* **Kontrast.** `--border-accent` gegen `--accent-bg-subtle`, Mindestwert **3:1** (SC 1.4.11, die
  Kontur kennzeichnet einen Zustand). Beide Werte sind in beiden Themen zeichengleich mit
  `--accent-bg`, für das dieses Verhältnis bereits gemessen wird
  (`contrast-check.mjs:289`). Das Paar muss trotzdem **unter seinem eigenen Namen** in
  `contrast-check.mjs` stehen — eine Zusage, die aus der Gleichheit zweier Tokenwerte folgt, hält
  nur so lange, wie die Gleichheit hält. Siehe Abschnitt 6.

### 1.3 Die sechs Schienenzusätze — was sie leisten müssen und was nicht

T-163 kappt sie auf fünf Wörter. Gestalterisch richtig, mit einer Einschränkung, die dort nicht
stehen konnte: **`.settings-rail__hint` ist bei `max-width: 60rem` ausgeblendet**
(`app.css:3963-3965`). Der Zusatz ist damit ein **Unterscheidungsmittel für die sechsgliedrige
senkrechte Schiene** und kein Auskunftsträger. Daraus folgt eine Regel, die ab jetzt gilt:

> **In einem Schienenzusatz steht keine Aussage, die nur dort steht.** Er unterscheidet sechs
> Geschwister voneinander, mehr nicht. Was in einem Fenster unter 60 rem verschwindet, ist keine
> Auskunft.

Das trifft genau einen der sechs Vorschläge aus T-163: `status` sollte laut ST-04 zu „Statuswerte
eines Todos" werden und den Zusatz „nicht die Spalten des Boards" nach ST-05 abgeben — wo er
ersatzlos fällt. Meine Antwort dazu steht in Abschnitt 3.4; sie lautet, dass die Verneinung bleibt,
aber nicht in der Schiene.

### 1.4 Die Kartenbeschreibungen — was von ihnen übrig bleiben darf

T-163 lässt sechs Kurzsätze stehen („Wirkt sofort. Nichts zu speichern.", „Vor jedem Lauf erneut
geprüft." und so weiter). Gestalterisch ist daran wichtig, was sie **nicht mehr** sind: Sie sind
keine Einleitung mehr, sondern eine **Randbedingung**. Der Rang stimmt bereits —
`.card__description` ist `--text-sm` in `--text-muted` unter einem `--text-md`-Titel
(`components.css:291-301`). **Nichts zu ändern.**

Ein Fund, der auffällt, sobald die Sätze kurz sind: `.card__header` trägt eine Trennlinie
(`components.css:285`). Bei einem Titel plus Halbsatz ergibt das ein Band von rund 60 px, das den
Bereich sauber vom Inhalt trennt. Bei einem Titel **ohne** Beschreibung schrumpft es auf rund 54 px
und bleibt richtig. **Die Trennlinie bleibt in beiden Fällen** — sie ist genau das Mittel, das die
gestrichene Beschreibung ersetzt: Gruppierung statt Satz. Wer sie beim Aufräumen mitnimmt, nimmt
die Ersatzleistung mit.

### 1.5 Zustände in den Einstellungen nach ST-04

| Zustand | Was sich ändert |
|---|---|
| Laden | nichts. `AsyncBoundary` mit `rows={4}` zeichnet Skelettzeilen im Panel; der Kopf war nie Teil davon |
| Leer | nichts. `SettingsScreen.tsx:612` (kein Tag) bleibt; er sagt den nächsten Schritt |
| Zeiger, Fokus, aktiv | nichts. `.settings-rail__item:hover/:active` unverändert, Fokusring aus `--focus-ring-*` unverändert |
| Fehler | nichts. Die Fehlerbänder der Karten (`:509`, `:636`) sind zustandsgebunden und stehen unter dem Kartenkopf, nicht darin |
| Rückfrage | nichts. `SettingsScreen.tsx:524-527` ist gesperrt (SP-10, B-5.2) |

---

## 2. ST-10 — trägt der Ansichtstitel allein?

T-163 stellt die Frage und überlässt sie ausdrücklich mir. **Antwort: ja, in beiden Fällen. Beide
`lead`-Sätze fallen ersatzlos.** Begründung je Ansicht, weil sie verschieden ist.

### 2.1 Dashboard — der `lead` steht der Primäraktion im Weg

`DashboardScreen.tsx:140`: „Was läuft, was heute erfasst wurde, was noch nicht abgerechnet ist."
Drei Glieder, und jedes ist ein beschriftetes Element im selben Blickfeld:

| Glied des Satzes | Was es sichtbar benennt |
|---|---|
| „Was läuft" | `Card title="Timer"` (`:154`) |
| „was heute erfasst wurde" | `StatTile label="Heute erfasst"` (`:187`) |
| „was noch nicht abgerechnet ist" | `StatTile label="Noch nicht exportiert"` (`:192`) |

Das ist eine Inhaltsangabe des Bildschirms, den man ansieht — **S** in T-163s Raster, im reinsten
Fall. Sie fällt.

**Was dadurch gewonnen wird, ist mehr als Platz.** Der Kopf trägt zwei Aktionen, „Neues Todo"
(primär) und „Zeiterfassung" (sekundär, `:142-151`). Heute liegen sie rechts neben einem
68-Zeichen-Absatz; die Primäraktion des Bildschirms steht optisch neben einer Erklärung. Ohne den
`lead` steht sie neben dem Titel. **Die Primäraktion des Dashboards wird durch die Streichung
eindeutig, nicht trotz ihr.**

**Eine Anpassung ist dafür nötig.** `.screen__headline` setzt `align-items: flex-start`
(`app.css:838-842`). Das ist richtig, solange ein zweizeiliger `lead` darunter hängt — die Knöpfe
dürfen dann nicht gegen die Mitte eines Absatzes ausgerichtet werden. Ohne `lead` steht eine
36-px-Aktion an der Oberkante einer 29-px-Titelzeile und sitzt sichtbar zu hoch.

**Vorgabe.** `ScreenHeader` setzt eine Zustandsklasse, wenn kein `lead` übergeben wird, und diese
Klasse zentriert die Kopfzeile senkrecht:

```
.screen__headline--bare { align-items: center; }
```

* **Neuer Klassenname**, keine bestehende Klasse geändert. Er trägt keine Farbe, also kein neues
  Kontrastpaar. Er ändert **keine Rolle und keinen zugänglichen Namen**: `ScreenHeader` zeichnet
  weiterhin `<header class="screen__header">` mit `<h1 class="screen__title">`, und
  `getByRole("heading", …)` bleibt zeichengleich (`parts.tsx:50-64`).
* **Nicht unbedingt zentrieren.** Mit `lead` bleibt `flex-start` — sonst wandern die Knöpfe bei
  einem zweizeiligen `lead` in dessen Mitte und lösen sich vom Titel.

### 2.2 Zeiterfassung — der `lead` schiebt die Primäraktion nach unten

`TimeScreen.tsx:122`: „Timer starten und stoppen, heutige Buchungen ansehen, Zeit von Hand
nachtragen." Drei Glieder, zwei davon Kartentitel („Timer" `:138`, „Buchungen von heute" `:335`),
das dritte ein Knopf in jeder Zeile der Auswahlliste („Von Hand", `:276`). Ebenfalls **S**.

Hier ist der Gewinn ein anderer: Der Kopf dieser Ansicht hat **keine** Aktionen. Fällt der `lead`,
rückt die Karte „Timer" um rund 28 px nach oben, und die Primäraktion des Bildschirms — Start und
Stopp — steht unmittelbar unter dem Titel. Das ist die richtige Reihenfolge für eine Ansicht, deren
einzige Aufgabe das Laufenlassen einer Uhr ist.

**`.screen__headline--bare` gilt hier ebenso**, obwohl keine Aktion danebensteht: Die Klasse hängt
am fehlenden `lead`, nicht an der Aktion, und `RefreshHint` steht mit `align-self: center` ohnehin
schon mittig (`app.css:875-879`).

**Was bleibt und nicht angefasst wird:** `Card title="Timer" description="Es läuft höchstens
einer."` (`:138`) — eine **Abwesenheit** (es gibt nie einen zweiten Timer), ein Satz von 22 Zeichen.
Er ist kürzer als jede Alternative und bleibt.

### 2.3 Wo ein `lead` bleibt, und warum das kein Widerspruch ist

Nach ST-10 tragen neun der elf Ansichten weiterhin einen `lead`. Das ist beabsichtigt und ergibt
die Leseregel für alle künftigen Ansichten:

> Ein `lead` steht, wenn der Ansichtstitel eine **Frage offen lässt**, die der erste Blick nicht
> beantwortet — „Protokoll" wovon, „Vorlagen" wofür. Er fällt, wenn er die beschrifteten Flächen
> darunter aufzählt.

Der `lead` von `BoardScreen` (Abschnitt 3) fällt unter die erste Hälfte dieser Regel und bleibt
deshalb, gekürzt.

---

## 3. ST-05 — die Kernfrage: wie bleibt eine Spalte eine Regel, ohne dass es elfmal dasteht

Das ist der größte Posten und der einzige, an dem eine Streichung fachlich schaden kann. Die Frage
lautet nicht „wie kürzen wir den Satz", sondern:

> **Woran erkennt jemand, der die Erklärung nie gelesen hat, dass eine Spalte eine Regel ist und
> kein Ablageort?**

### 3.1 Der Befund: die Antwort steht bereits N-mal auf dem Board — nur nicht als Satz

Unter **jedem** Spaltenkopf steht `RuleSummary` (`BoardScreen.tsx:677-683`, gezeichnet in
`Kanban.tsx:390`, `RuleSummary.tsx:213-275`). Sie zeigt die Regel **dieser** Spalte in ihren Achsen:
Symbol plus Versalienwort plus Chips — ERFORDERLICH, OHNE, STATUS, ERLEDIGT, EXPORTSTATUS.

Das ist der entscheidende Punkt dieser Aufgabe: **Der allgemeine Satz ist eine Bildunterschrift zu
etwas, das die Fläche bereits spezifisch zeichnet.** „Eine Spalte ist eine Regel über Tags, Status,
Erledigt und den Exportstatus" ist die schwächere Fassung von „ERFORDERLICH: Kunden/Ost · OHNE:
Wartet · STATUS: In Arbeit", die genau darüber steht. Elf allgemeine Sätze gegen eine spezifische
Zeile je Spalte — die spezifische gewinnt, weil sie zugleich die Frage beantwortet, die der
Benutzer wirklich hat: nicht „was ist eine Spalte", sondern „warum steht **diese** Karte **hier**".

**Bedingung, und sie ist der eigentliche Auftrag dieses Abschnitts:** Diese Zeile muss als die
**Definition der Spalte** gelesen werden, nicht als Fußnote über sie. Heute wird sie als Fußnote
gezeichnet. Das ändert sich mit zwei Eingriffen, die beide innerhalb bestehender Klassen bleiben.

### 3.2 Eingriff 1 — die Regel gehört zum Spaltenkopf, nicht darunter

Heute stapeln sich zwei Trennlinien innerhalb von rund 60 px:

```
.kcolumn__head  { … border-bottom: 1px solid var(--border-subtle); }   components.css:881-887
.kcolumn__rule  { … border-bottom: 1px solid var(--border-subtle); }   components.css:934-937
```

Der Kopf ist dadurch in drei Bänder zerlegt: Name/Zahl, Regel, Karten. Zwei gleich starke Linien in
einer Spalte von 17 rem lehren, dass die Regel eine eigene, abtrennbare Sache ist — genau die
Lesart, gegen die die elf Sätze anschreiben.

**Vorgabe.** Die Linie zwischen Kopf und Regel entfällt. Die Linie unter der Regel bleibt.

```
.kcolumn__head { border-bottom: none; }
/* .kcolumn__rule behält seine border-bottom */
```

Ergebnis: **Name, Zahl und Regel bilden einen Block — die Identität der Spalte.** Die verbleibende
Linie trennt Identität von Inhalt. Das ist Gruppierung statt Satz, und es ist die wirksamste
einzelne Maßnahme dieses Papiers.

* Kein Abstand wird vergrößert. `.kcolumn__head` behält `padding: var(--space-2) … var(--space-3)`,
  `.kcolumn__rule` behält `padding: var(--space-2) var(--space-3)`.
* Keine Klasse umbenannt, keine Rolle berührt. `aria-label` der Spalte bleibt zeichengleich
  (`Kanban.tsx:349-358`), also bleiben die `getByRole("region"/"heading", …)`-Zugriffe grün.

### 3.3 Eingriff 2 — die Regelzeile ist Inhalt, nicht Nebentext

`.rule-summary` setzt `color: var(--text-muted)` (`components.css:3920-3927`). Das ist die Farbe des
Hilfetextes. Eine Zeile, die sagt, **warum diese Karten hier stehen**, ist kein Hilfetext.

**Vorgabe.** `.rule-summary { color: var(--text-secondary); }`

* **Größe bleibt bei `--text-2xs`** (11 px) in der Spalte und `--text-xs` (12 px) in der
  `--md`-Ausprägung. Eine Spalte ist 17 bis 21 rem breit (`app.css:3544-3553`); fünf Achsen mit
  Chips brauchen jedes Zeichen dieser Breite. Größer machen heißt hier: umbrechen.
* **Die Versalien der Achsenbeschriftung bleiben unverändert** (`components.css:3976-3982`:
  `text-transform: uppercase`, `--tracking-wide`). Das ist bereits das Mittel, das „dies ist ein
  Feldname und kein Kommentar" sagt. **Nichts zu tun** — und ausdrücklich nichts wegnehmen.
* **Kontrast:** `--text-secondary` auf `--bg-subtle` ist gemessen (`contrast-check.mjs:254`,
  4,5:1); auf `--bg-surface` ebenso (`:156`). Die Regelzusammenfassung erscheint auf genau diesen
  beiden Flächen (Spaltenkopf, Regelliste und Formularvorschau). **Kein neues Paar.**
* Die Wirkung reicht über das Board hinaus: dieselbe Komponente trägt die Regelzeile in der
  Regelverwaltung (`.pool-row__rule`) und die Vorschau im Formular. In beiden ist sie ebenso die
  Antwort und nicht die Randnotiz.

### 3.4 Eingriff 3 — was in Worten bleibt: genau zwei Stellen, zwei verschiedene Aufgaben

T-163 schlägt zwei Stellen vor. Ich bestätige beide und benenne, warum es zwei sein müssen und
nicht eine:

| Stelle | Satz | Aufgabe | Warum dort |
|---|---|---|---|
| `BoardScreen.tsx:372` (`lead`) | `RULE_WHAT_MOVES_A_CARD` | **Verhalten** — warum lässt sich nichts ziehen, warum ist die Karte weg | Das Board ist die einzige Fläche, auf der dieses Verhalten beobachtet wird. Ein Verhaltenssatz gehört an den Ort der Beobachtung |
| `BoardScreen.tsx:1090` (Einrichtungsdialog) | `RULE_IS_A_RULE` | **Definition** — was lege ich hier an | Der Dialog ist die einzige Fläche, auf der eine Spalte entsteht. Eine Definition gehört an den Ort der Erzeugung |

Eine dritte Stelle gäbe es nur, wenn eine dritte Aufgabe existierte. Sie existiert nicht.

**`RULE_NOT_A_PLACE` fällt** — vom Orchestrator bereits als O-DM entschieden, kein Aufrufer mehr.
Damit gibt es nach ST-05 **keine Kurzfassung** des Satzes. Das ist richtig und muss so bleiben: Eine
Kurzfassung ist die Einladung, ihn wieder überall hinzuschreiben, wo der Platz für die lange fehlt.
Wo der Platz fehlt, steht die Regelzeile.

### 3.5 Was an den neun übrigen Stellen an die Stelle des Satzes tritt

| Stelle | Tritt an die Stelle | Träger nach Nachtrag 6 |
|---|---|---|
| `StatusSettings.tsx:283-305` (Kasten mit zwei Absätzen und zwei Navigationsknöpfen) | **Nichts in den Einstellungen.** Siehe 3.6 | — |
| `StatusSettings.tsx:372-385` („Zwei Dinge …", fällt mit ST-08/UM-04) | Der sichtbare Sperrgrund in jeder betroffenen Zeile (`StatusSettings.tsx:568-596`) — **er steht bereits da**, siehe 4.4 | T1 |
| `TodoFormDialog.tsx:235` (Statushinweis) | Ein einzeiliger Verweis auf den Ort der Verwaltung. Siehe 3.7 | — |
| `TagsScreen.tsx:612` (Regelliste) | Die `RuleSummary` **je Zeile** (`.pool-row__rule`) — dieselbe Fläche wie am Board, dieselbe Leseregel | T1 |
| `TagsScreen.tsx:624` (Leerzustand) | Das **Beispiel** bleibt, die Definition fällt. Ein Leerzustand soll den nächsten Schritt zeigen, nicht einen Begriff klären | — |
| `TagsScreen.tsx:79` | Nur die Kennung „(E-054)" fällt (ST-03). Kein Gestaltungsbedarf | — |
| `PoolFormDialog.tsx:790-795` (Kasten „Nichts wird gespeichert außer der Regel") | Der Abschnitt **„Diese Regel trifft"** mit der lebenden Vorschau (`:743-777`). Siehe 3.8 | T1 |
| `BoardScreen.tsx:967` (Board-Leerzustand) | Der verbleibende Satz plus die Karte „Was sich geändert hat" darunter. Siehe 3.9 und Befund B-3 | — |
| `BoardScreen.tsx:1090` zweiter Halbsatz | Nichts. Die Liste im Dialog zeigt Spalten und Pools nebeneinander; dass es dieselbe Sache ist, sieht man an der Liste | — |

### 3.6 Die Einstellungen schweigen — mit einer Ausnahme von 30 Zeichen

`StatusSettings.tsx:283-305` fällt vollständig, samt der beiden Navigationsknöpfe. Das ist richtig,
und zwar aus einem Grund, den T-163 in seiner eigenen Regel S-11 bereits aufgeschrieben hat: Ein
Erklärkasten enthält keine Navigationsknöpfe in andere Ansichten. Ein Bedienweg gehört an die
Bedienstelle. Das Board ist ein Punkt der Hauptnavigation und immer sichtbar; ein zweiter Weg
dorthin, versteckt in einer Erklärung, ist kein Weg, sondern eine Wiederholung.

**Aber:** „Status" ist das einzige Wort in dieser Anwendung, das mit einem anderen Begriff
kollidiert, den derselbe Benutzer im selben Kopf trägt. Wer die Statusspalten des Boards sucht,
sucht sie hier. Eine **Abwesenheit** — es gibt sie hier nicht — sieht man nicht; T-163s eigenes
Raster (Buchstabe **A**) sagt, dass ein solcher Satz nicht fällt.

**Vorgabe.** Die Kartenbeschreibung von `StatusSettings` (`:276`) entfällt **nicht ersatzlos**, wie
ST-04 vorschlägt, sondern schrumpft auf die Verneinung:

> `description="Nicht die Spalten des Boards."`

* 30 Zeichen statt 100. Eine Aussage statt einer Aufzählung dessen, was die Liste darunter zeigt.
* **Warum in der Karte und nicht in der Schiene:** Der Schienenzusatz ist unter 60 rem ausgeblendet
  (1.3). Eine Verneinung, die vom Fensterformat abhängt, ist keine.
* Der Schienenzusatz bleibt dann positiv und kurz: „Statuswerte eines Todos". Klare Arbeitsteilung
  — die Schiene unterscheidet, die Karte verneint, und zwar genau einmal.
* **Braucht spec-ux-reviewer**, weil der Satz an E-054, A-5.4 und S-2 aus R-2 hängt. Vorzulegen ist
  dieser Wortlaut, nicht die Absicht.

### 3.7 Der Statushinweis im Todo-Dialog wird ein Wegweiser

`TodoFormDialog.tsx:235` trägt heute zwei Sätze über den Unterschied zwischen Status und
Kanban-Spalte — bei **jedem** Öffnen des Anlegen-Dialogs, also an der Stelle, an der niemand diese
Frage hat. T-163 kürzt auf einen Wegweiser. Gestalterisch dazu drei Festlegungen:

1. **Es bleibt ein `hint`, kein Verweis.** `.field__hint` (`app.css:1020-1025`) ist die richtige
   Rangstufe. Ein anklickbarer Verweis im Formular führte aus einem Dialog mit ungesicherten
   Eingaben heraus — ein Bedienweg, den es hier nicht geben darf.
2. **Eine Zeile.** Bei 34 rem Dialogbreite (`app.css:1246-1248`) trägt `--text-xs` rund 90 Zeichen
   je Zeile. Der Wegweiser muss darunter bleiben, sonst ist er wieder ein Absatz.
3. **Kein Pfadzeichen, das sonst nirgends vorkommt.** T-163 schlägt „Einstellungen › Status" vor.
   Das Zeichen `›` steht in keinem einzigen Oberflächentext von `apps/web`; ein Sonderzeichen, das
   nur an einer Stelle vorkommt, ist eine eigene kleine Sprache. Vorschlag an ux-designer: die
   Anführungsform, die das Produkt überall benutzt, etwa `Einstellungen, Bereich „Status"`. Der
   Wortlaut gehört ux-designer, die Bedingung gehört hierher.

### 3.8 Das Regelformular endet mit seiner Vorschau

Fällt `PoolFormDialog.tsx:790-795`, wird der Abschnitt **„Diese Regel trifft"** (`:743-777`) das
letzte Element vor der Fußzeile. Das ist die stärkste Position im Formular und die richtige: Der
Kasten sagte in vier Sätzen, dass nichts gespeichert wird außer der Regel — die Vorschau **zeigt**
die Regel und zeigt sonst nichts. Reihenfolge statt Satz.

**Nichts zu ändern.** Zwei Warnbänder (`:715-741`) und der Leerhinweis (`:779-788`) stehen weiterhin
davor; alle drei sind zustandsgebunden und erscheinen nur bei ihrem Befund. Nach dem Wegfall des
letzten dauerhaften Kastens ist `PoolFormDialog` durchgehend zustandsgebunden — das erste Formular
im Bestand, für das das gilt, und damit die Vorlage für die übrigen.

### 3.9 Der Board-Leerzustand — und ein Befund, der über ST-05 hinausgeht

`BoardScreen.tsx:967` verliert „Seit der Umstellung …". Richtig: eine Formulierung, die an ein
Ereignis gebunden ist, altert. Was T-163 nicht sagen konnte, weil es außerhalb seiner Liste liegt:

**Unmittelbar darunter steht die Karte „Was sich geändert hat" (`:975-1008`) mit vier
Aufzählungspunkten, und sie ist von derselben Sorte — sie spricht zu einem Benutzer, der vor E-054
ein Statusboard hatte.** Für eine frische Einrichtung ist sie sinnlos: Da hat sich nichts geändert.
Sie enthält zugleich die vierte Wiederholung des Satzes („Nichts wird mehr gezogen", `:993-998`).

Ich streiche sie nicht — sie liegt nicht in der ST-Liste, und ihre Punkte 1 und 3 („Ihre Todos sind
vollzählig da", „Keine automatische Übersetzung") sind **Abwesenheiten** im Sinn von E-078 Punkt 1.
**Befund B-3** an den Orchestrator (Abschnitt 8): Diese Karte braucht eine Bedingung, unter der sie
erscheint, oder ein Ablaufdatum. Sie ist die letzte zeitgebundene Erklärfläche des Produkts.

### 3.10 Was bei ST-05 nicht angefasst werden darf

Vier Dinge, die eine Kürzung aus Versehen mitnimmt:

1. **Die Regelzeile wird nie beschnitten.** Kein `line-clamp`, kein `text-overflow`, kein „ab drei
   Achsen einklappen". Eine gekürzte Regel ist eine falsche Regel. Eine Spalte mit fünf Achsen wird
   hoch — das ist die richtige Antwort und nicht das Problem.
2. **Der leere Ordner bleibt am Chip.** `.rule-summary__folder--empty` trägt Warndreieck, Kontur,
   Fläche und das Wort „kein Tag darin" (`components.css:4018-4033`, `RuleSummary.tsx:159-176`).
   Vier Merkmale, keines allein Farbe (SC 1.4.1). Unverändert.
3. **Der `aria-label` der Spalte bekommt die Regel nicht dazu.** Er lautet heute „Spalte X, N
   Karten, davon M erledigt" (`Kanban.tsx:349-355`). Die Regel steht als **sichtbarer Text im
   Bereich** und ist damit für Vorlesehilfen erreichbar. Sie zusätzlich in den Namen zu ziehen,
   machte ihn unbrauchbar lang und bräche 286 `getByRole`-Zugriffe. **Sicht und Gehör bekommen
   dieselbe Menge — beide über denselben Text.** (E-078 Nachtrag Punkt 8, gemessen und erfüllt.)
4. **Kein Greifzeiger, kein Griffsymbol, keine Ziehschatten.** `components.css:947-949` hält
   ausdrücklich fest, warum. Wer die Erklärung kürzt, darf nicht gleichzeitig eine Affordanz
   zurückholen, die die Erklärung widerlegt.

---

## 4. Die Umbauliste — wo eine Auskunft erscheint, wie sie auftritt, und warum die Fläche nicht springt

### 4.1 Die drei Bauformen, in dieser Rangfolge

Für jeden Eintrag der Umbauliste gilt eine dieser drei Bauformen. Alle drei stehen bereits im
Bestand; keine ist neu.

| # | Bauform | Was sie tut | Vorbild im Bestand |
|---|---|---|---|
| **B1** | **Ersetzen im festen Fach** | Ein Fach existiert dauerhaft; nur sein Inhalt wechselt. Die Höhe ändert sich nur um die Differenz zweier Texte | `RadioRow.tsx:145-154` — ein Hinweisfach zeigt den Satz der gewählten Option; `ConfirmDialog.refusal` tritt an die Stelle der Vorwarnung |
| **B2** | **Reserviertes Fach** | Das Fach steht dauerhaft im Baum und ist leer, wenn es nichts zu sagen gibt | `Attachments.tsx:466` (`role="status"`, immer da); die leere Live-Region aus SP-06 / G-10 |
| **B3** | **Anhängen unterhalb** | Der Text erscheint **unter** allem, womit der Benutzer gerade umgeht | `PoolFormDialog.tsx:568-574`, `:715-741` — Bänder unter dem Feld, das sie betreffen |

**Regel U-1 — Reihenfolge der Wahl.** B1 vor B2 vor B3. B3 nur, wenn der Text nicht in ein
bestehendes Fach passt.

**Regel U-2 — nie oberhalb des bedienten Elements.** Ein Text, der über dem Bedienelement
erscheint, verschiebt genau das, was der Benutzer gerade ansieht. Unterhalb verschiebt er nur, was
noch nicht dran ist.

**Regel U-3 — keine Höhenanimation.** Ein Fach wechselt seinen Inhalt ohne Übergang oder mit
`opacity` über `--motion-fast` (140 ms) und `--ease-out`. **Nie** `height`, `max-height` oder
`transform: translateY` auf einem Textblock mit automatischer Höhe: Das ist der Ruck, den U-1 und
U-2 gerade vermeiden. `base.css:209-218` setzt bei `prefers-reduced-motion` ohnehin jede Dauer auf
null — eine Bewegung, die dort verschwinden darf, war keine, die getragen hat.

**Regel U-4 — die gemessene Grenze im Dialog.** `.dialog__body--form` hat
`max-height: 60vh; overflow-y: auto` (`app.css:1265-1271`), und `.scrim` zentriert den Dialog
senkrecht (`components.css:2300-2310`). Daraus folgt genau:

* Ist der Formularkörper **kürzer** als 60 vh, wächst der Dialog mit dem eingefügten Text, und die
  senkrechte Zentrierung verschiebt ihn um die **halbe** Zuwachshöhe nach oben — ein Ruck am
  fokussierten Feld.
* Ist er **an** 60 vh, schluckt der Bildlauf den Zuwachs, und nichts springt.

**Vorgabe an frontend-dev:** Vor jedem Umbau in einem Dialog wird gemessen, ob der Formularkörper
bei 1280x720 und bei 1024x640 bereits scrollt. Tut er es nicht, ist B1 die einzige zulässige
Bauform. Das ist eine Messung, keine Schätzung.

### 4.2 UM-01 — lange Feldhinweise werden zustandsgebunden

**Gestalt.** Zwei Klassen von Hinweisen, aber **nicht zwei Aussehen.** Beide bleiben
`.field__hint` (`--text-xs`, `--text-muted`, `--leading-snug`, `max-width: --measure-prose`). Ein
Hinweis, der nur manchmal da ist, sieht nicht anders aus als einer, der immer da ist — sonst lernt
der Benutzer, dass es zwei Sorten Hinweis gibt, und das ist eine Auskunft, die niemand braucht.

**Bauform:** B1, wo das Bedienelement bereits ein Hinweisfach hat. Der Bestand macht das schon an
zwei Stellen vorbildlich und ohne dass jemand es UM-01 genannt hätte:

* `PoolFormDialog.tsx:534` — `hint={PLACEMENT_HINT[placement]}` an einem `Select`: derselbe Platz,
  wechselnder Inhalt.
* `PoolFormDialog.tsx:646-650` — `StatusPicker`, Hinweis wechselt mit der Zahl der gewählten Werte.

**Die Symmetrie ist bei `Select` und `TextField` bauartbedingt erfüllt.** `Select.tsx:201` und
`:233-237` hängen **beide** an `hint === undefined`: Fällt der sichtbare Absatz, fällt
`aria-describedby` im selben Ausdruck. Es gibt keinen Weg, das eine ohne das andere zu tun — außer
über CSS. **Deshalb die Vorgabe:** Ein zustandsgebundener Hinweis wird über `hint={undefined}`
weggelassen, **nie** über `display: none`, `visibility: hidden` oder `opacity: 0`. Eine über CSS
versteckte Beschreibung bleibt im Zugänglichkeitsbaum und ist genau der Fehler aus E-078 Nachtrag
Punkt 8.

**Und die eine Ausnahme, die benannt werden muss, sonst wird sie „harmonisiert":**

> **`RadioRow` ist bewusst asymmetrisch, und diese Asymmetrie ist geprüft.** Sichtbar steht nur der
> Hinweis der **gewählten** Option (`RadioRow.tsx:145-154`, `aria-hidden`). Für Hilfsmittel steht
> der Hinweis **jeder** Option als `visually-hidden`-Beschreibung im Baum (`:138-144`), damit
> jemand, der mit den Pfeiltasten durch die Gruppe geht, hört, wohin die nächste Wahl führt. Die
> Begründung steht bei `:44-56` und `:125-137` und geht auf S-6 aus R-2 zurück.
>
> Das ist die einzige Stelle, an der Gehör mehr bekommt als Sicht, und sie hat eine Freigabe.
> **Sie wird nicht angeglichen** — weder durch Entfernen der verborgenen Sätze noch durch
> Sichtbarmachen aller drei. Und sie wird **nicht ausgeweitet**: Ein neues Bedienelement, das
> dieselbe Bauart will, braucht dieselbe Prüfung.

**Folge für UM-01.** T-163 nennt `POOL_MATCH_MODE_HINT` als betroffen, weil beide Fassungen sichtbar
seien. **Gemessen: sie sind es nicht** (`RadioRow.tsx:145`, `PoolFormDialog.tsx:558-566`). An
`RadioRow` ist UM-01 bereits gebaut. Betroffen bleibt, was an `Select`, `TextField` und
`FolderPicker` hängt — dort ist UM-01 eine echte Änderung, dort greift auch Regel U-4.

### 4.3 UM-02 — der Exportachsen-Satz

**Befund: nichts zu bauen. Die Prämisse trifft die verborgene, nicht die sichtbare Hälfte.**

`POOL_EXPORT_NOT_BILLED_HINT` hängt als `hint` an der Option „Abgerechnet"
(`PoolFormDialog.tsx:695-701`). `RadioRow` zeichnet den Hinweis der **gewählten** Option
(`:145-154`). Wer „Abgerechnet" nicht wählt, sieht den Satz heute schon nicht. **Der Umbau, den
UM-02 verlangt, steht seit T-091 in der Komponente.**

Was dauerhaft im Baum steht, ist die verborgene Beschreibung an allen drei Optionsknöpfen — und die
ist die Ausnahme aus 4.2, die bleibt.

**Vorgabe an frontend-dev.** UM-02 wird **nicht** umgesetzt. Umgesetzt wird an dieser Stelle allein
ST-03: die Klammer „(E-047)" fällt aus dem Satz. Alles Weitere wäre eine Rücknahme von S-6 aus R-2,
und zwar eine, die sichtbar nichts bewirkt. Als **Befund B-1** an den Orchestrator gemeldet.

### 4.4 UM-04 — die Statusregeln stehen bereits an ihrem Bedienelement, und sie stehen sichtbar

T-163 formuliert als offene Frage 3, ob ein gesperrter Knopf seinen `disabledReason` überhaupt an
eine Vorlesehilfe abgibt, und O-DN führt die Messung als eigene Aufgabe (T-172, visual-qa).

**Gestalterisch ist die Lage besser als die Frage vermuten lässt, und das gehört hier festgehalten:**
Der Sperrgrund steht in `StatusSettings` **nicht** am Knopf, sondern als sichtbarer Block **in der
Zeile** (`:568-596`), mit Schlosssymbol, mit allen Gründen statt nur dem ersten, mit dem Ausweg als
Knopf daneben — und der Knopf verweist zusätzlich über `aria-describedby` darauf (`:489-493`). Sicht
und Gehör bekommen denselben Text an derselben Stelle.

**Damit trägt UM-04 auch dann, wenn O-DN ergibt, dass ein gesperrter Knopf seine Beschreibung nicht
abgibt** — der Text hängt nicht am Knopf, er steht in der Zeile.

**Gestaltvorgabe:** unverändert lassen. Ausdrücklich auch die ruhige Ausprägung (kein Warnband,
Begründung bei `:553-567`): Ein Status mit Todos ist der Normalfall, und ein Bereich aus lauter
gelben Bändern lehrt, gelbe Bänder zu übersehen.

### 4.5 UM-05 — der Entwurfshinweis

**Gestalt:** B3, ein zweiter Satz, der unter den ersten tritt, im selben `InlineMessage`-Rumpf
(`ExportScreen.tsx:683-686`). Kein zweites Band. Zwei Bänder untereinander für eine Sache sind eine
Verdopplung mit Rahmen.

**Sprungfreiheit:** Der Kasten steht in einer Seite, nicht in einem Dialog; ein zweiter Satz schiebt
nur, was darunter liegt. U-2 ist erfüllt.

**Die Einschränkung von T-163 gilt und ist gestalterisch zu unterschreiben:** Weiß der
Exportbildschirm nicht, ob ein Entwurf offen ist, bleibt der Satz stehen. Ein dauerhafter Satz ist
billiger als eine unbemerkte Abweichung im Abrechnungsbetrag.

### 4.6 UM-06 — der Anhangssatz

**Gestalt.** Die Aussage steht heute viermal in derselben Ansicht. Nach dem Umbau einmal, und zwar
im **Leerzustand** (`Attachments.tsx:609`) — der einzigen Fläche, auf der die Frage „was ist das
hier" tatsächlich gestellt wird, und der einzigen, die mit ihrer Antwort verschwindet.

Vier Festlegungen zur Dichte der Detailansicht (Umsetzungsreihenfolge, Schritt 7):

1. **Die Kartenbeschreibung `TodoDetailScreen.tsx:447` behält ihren Folgeteil** („Geöffnet wird nur
   auf Ihren Klick.") und verliert die Aufzählung der drei Arten. Die Aufzählung steht in der Liste
   darunter — das ist **S**.
2. **Die drei Optionshinweise im Anlegen-Dialog** (`Attachments.tsx:420-422`) werden kurz. Zu
   beachten: Es ist immer nur **einer** sichtbar (B1, `RadioRow`), und die vollständige Aussage
   steht 8 px darunter im Feldhinweis (`:434`, `:446-450`) — dort zustandsgebunden mit dem
   gewählten Wert. Die heutige Verdopplung ist der wörtliche Anfang zweier Sätze untereinander
   („Takt legt eine Kopie neben seinen Daten ab …" zweimal). Das ist die Verdopplung, die fällt,
   und sie fällt **oben**, nicht unten: Der Feldhinweis ist die genauere Auskunft.
3. **`Attachments.tsx:397` (Dialogbeschreibung) fällt.** Sie steht als `.dialog__lead` über einer
   Optionszeile, deren drei Beschriftungen dieselben drei Wörter sind. Der Dialog beginnt danach
   mit seiner ersten Frage statt mit einer Inhaltsangabe.
4. **G-7 aus T-165 ist zu beachten:** Der Leerzustandssatz („Takt kopiert nur Bilder; Verweise und
   Dateien merkt es sich als Adresse beziehungsweise Pfad.") ist **gesperrt**. UM-06 macht ihn zur
   einzigen Fassung — das ist genau das, was G-7 verlangt, und keine Kürzung.

### 4.7 UM-07 — der Toast-Rumpf

**Gestalt.** Ein Meldungsrumpf ist eine Fläche mit **zwei** Sätzen Platz, nicht drei
(`TodoListScreen.tsx:299-318`). Die Regel dahinter ist eine Rangregel, keine Zeichenregel: Der
Bewegungssatz aus der Domäne nennt Pools und Spalten **beim Namen**; unsere pauschale Fassung sagt
dasselbe ungenauer. Das Genauere verdrängt das Ungenauere, es steht nicht daneben.

**Und der Rückweg schlägt beide.** `EmptyState` und `Toast` haben je **eine** Hauptaktion; wo eine
`action` steht, fällt der erklärende Satz. Ein Knopf, der die Handlung zurücknimmt, erklärt sie
besser als jeder Satz.

**Sprungfreiheit:** Der Meldungsstapel liegt auf `--z-toast` und schiebt nichts. U-1 bis U-4 sind
hier gegenstandslos.

### 4.8 UM-03 — die Kanban-Abgrenzung wandert an den Board-Leerzustand

Gestalt in 3.6 und 3.9 behandelt. Ergänzend eine Bedingung, die T-163 richtig benennt und die hier
ihre gestalterische Fassung bekommt: **Die Einstellungen bekommen keinen Ersatzkasten.** Weder
kleiner noch schmaler noch anders getönt. Ein Kasten, der um zwei Drittel kürzer ist, ist immer noch
ein Kasten auf Vorrat, und der nächste Durchgang findet ihn wieder.

---

## 5. Sinnbilder — welche eine Beschriftung wirklich ersetzen

E-078 Punkt 5: Ein Sinnbild mit Erklärungstext daneben ist keine Kürzung, sondern eine Verdopplung.
T-163 Abschnitt 6.2 nennt sechs mit gelernter Bedeutung und die Bedingung (zugänglicher Name,
28x28 — `Primitives.tsx:83-86`).

**Vorweg eine Unterscheidung, ohne die die Frage nicht zu beantworten ist:** Ein `aria-label` an
einem Symbolknopf ist **kein Erklärtext**. Er ist der **Name** des Bedienelements und nach SC 4.1.2
Pflicht. Verdoppelung ist erst dann gegeben, wenn neben dem Symbol **sichtbarer** Text dieselbe
Sache sagt.

### 5.1 Das Urteil je Symbol

| Symbol | Ersetzt eine Beschriftung? | Bedingung / Begründung |
|---|---|---|
| `x` | **Ja** | Schließen und Entfernen sind dieselbe Geste in jeder Anwendung; der Gegenstand ist immer das umgebende Element. Bereits so gebaut |
| `more-horizontal` | **Ja** | Ein Menü hat keinen anderen Namen als „mehr". Bereits so gebaut (`Kanban.tsx:382-388`) |
| `pencil` | **Ja, in einer Zeile oder an einer Karte** | Der Gegenstand ist die Zeile. **Nein** als einzige Aktion eines leeren Bildschirms — dort fehlt der Gegenstand |
| `trash` | **Ja, in einer Zeile** | dito. **Nie** als Primäraktion eines Dialogs: Eine nicht umkehrbare Handlung schreibt sich aus („Endgültig löschen") |
| `play` / `pause` | **Ja** | Die stärkste gelernte Bedeutung im Bestand, und die einzige mit einer eigenen Farbe (`--timer-running-*`). Der laufende Zustand trägt außerdem Farbe, Rahmen und Puls — nie Farbe allein |
| `plus` | **Nur im Behälter, der den Gegenstand nennt** | Das `+` im Spaltenkopf trägt „Todo in „X" anlegen — mit den Tags dieser Regel" (`BoardScreen.tsx:689`): Der Behälter ist der Gegenstand. **Nein** als Primäraktion eines Bildschirms — „Neues Todo", „Status anlegen", „Erste Spalte einrichten" bleiben beschriftet. Die Primäraktion eines Bildschirms ist die eine Stelle, an der ein nacktes Symbol am teuersten ist |

### 5.2 Kein siebtes Symbol in dieser Runde

T-163 Abschnitt 10 Punkt 2 stellt die Frage. **Antwort: nein.** Keine Stelle der Streich- oder
Umbauliste kürzt eine **Beschriftung**; sie alle kürzen **Prosa**. Prosa lässt sich nicht durch ein
Bild ersetzen — ein Bild kann eine Handlung benennen, aber keine Folge, keine Abwesenheit und keine
Absage aussprechen, und genau das sind die Sätze, die stehen bleiben.

### 5.3 Die eine Stelle, an der ST-09 eine Lücke aufreißt — und wie sie geschlossen wird

`Tag.tsx:114-119`. Die Standard-Tag-Marke zeigt sichtbar den Buchstaben **„S"**, dazu
`visually-hidden` „Standard-Tag" und `title="Standard-Tag"`. ST-09 streicht das `title`.

**Das ist ohne Ersatz ein Fehler nach E-078 Nachtrag Punkt 8, und zwar in der selten geprüften
Richtung:** Danach hört eine Vorlesehilfe „Standard-Tag", und ein Sehender sieht ein „S", das
nirgends aufgelöst wird. Ein `visually-hidden`-Text ist für ihn nicht erreichbar; das `title` war
seine einzige — schlechte — Auflösung.

Und: **„S" ist kein Sinnbild.** Es hat keine gelernte Bedeutung, es steht in keiner der sechs
Reihen, es ist eine erfundene Abkürzung. Die Regel aus 6.2 gilt für sie nicht, weil sie nie unter
sie fiel.

**Vorgabe.** Die Marke trägt das **Wort** „Standard" statt des Buchstabens; der
`visually-hidden`-Text entfällt damit (er wäre dann die Verdopplung), das `title` entfällt wie in
ST-09 vorgesehen. Ein Text, drei Kanäle einig.

* **Gestalt:** dieselbe Bauform wie die bereits vorhandene Wortmarke „neu" —
  `.chip__badge--new` setzt `width: auto`, `padding: 0 var(--space-1)`, Versalien, `--tracking-wide`
  (`components.css:620-625`). Es braucht **eine** zusätzliche Modifikatorklasse in derselben Zeile,
  keine neue Farbe, keine neue Größe.
* **Kontrast:** `--accent-text` auf `--accent-bg-subtle`, 4,5:1 — **bereits gemessen**
  (`contrast-check.mjs:434`, wörtlich „Wortmarke „neu" am Chip"). Kein neues Paar.
* **Vertraglich, ausdrücklich:** Ist der Chip anklickbar (`Tag.tsx:123-129`), gehört der
  Markentext zum **zugänglichen Namen** des Knopfes. Der Name wechselt damit von „… Standard-Tag"
  auf „… Standard". **Das ist eine Änderung an einem zugänglichen Namen im Sinn von E-076 Punkt 3
  und geht nur zusammen mit unit-tester und e2e-tester.**
* **Platz:** Die Marke wächst von 14 px auf rund 60 px. Sie steht in Chip-Wänden (Standard-Tags in
  den Einstellungen, `TagInput`). Zu messen bei 1280x720 in `SettingsScreen` Bereich
  „standardtags" und im Regelformular. Ergibt die Messung, dass die Chipwand dadurch umbricht, ist
  der Rückfall: `title` bleibt an dieser einen Marke stehen, und ST-09 Zeile 5 wird **nicht**
  umgesetzt. Ein schlechter sichtbarer Auflöser ist besser als keiner.

**Die zweite Marke ist unkritisch.** `Tag.tsx:108-113` zeigt sichtbar „neu" und hört
„wird neu angelegt" — der Name enthält den sichtbaren Text wörtlich (SC 2.5.3). Das `title`
(„Dieses Tag wird beim Speichern angelegt") ist der dritte Wortlaut derselben Sache und fällt
ersatzlos. **Nichts tritt an seine Stelle.**

---

## 6. Vertrag, Kontrast und Nachweise

### 6.1 Was dieses Papier am Vertrag berührt (E-076 Punkt 3)

| Änderung | Rolle | Zugänglicher Name | Klassenname | Datenmerkmal |
|---|---|---|---|---|
| 1.2 Kontur des aktuellen Schieneneintrags | — | — | `.settings-rail__item--current`, **bestehend** | — |
| 2.1 `.screen__headline--bare` | — | — | **neu**, keine bestehende geändert | — |
| 3.2 Trennlinie `.kcolumn__head` | — | — | bestehend | — |
| 3.3 Farbe `.rule-summary` | — | — | bestehend | — |
| 3.6 `StatusSettings` Kartenbeschreibung | — | — | — | — (`Card.description`, frei nach T-163 Abschnitt 6.1) |
| 5.3 Wortmarke „Standard" | — | **ja, geändert** | **neu** (Modifikator neben `--new`) | — |
| 1.1 Punkt 2 Kartentitel „Dieser Arbeitsplatz" | — | **ja, geändert** — nur als Vorschlag | — | — |

**Genau zwei Einträge berühren einen zugänglichen Namen**, beide oben markiert, beide gehen nur
zusammen mit unit-tester und e2e-tester. Alles Übrige ist Farbe, Linie und Abstand.

### 6.2 Kontrastpaare

| Paar | Mindestwert | Anlass | Stand |
|---|---|---|---|
| `--text-secondary` / `--bg-subtle` | 4,5 | Regelzeile im Spaltenkopf (3.3) | **gemessen**, `contrast-check.mjs:254` |
| `--text-secondary` / `--bg-surface` | 4,5 | Regelzeile in Regelliste und Formular (3.3) | **gemessen**, `:156` |
| `--accent-text` / `--accent-bg-subtle` | 4,5 | Wortmarke „Standard" (5.3) | **gemessen**, `:434` |
| `--border-accent` / `--accent-bg-subtle` | **3** | Kontur des aktuellen Schieneneintrags (1.2) | **nachzutragen** in `contrast-check.mjs` |

Der letzte ist der einzige Zusatz dieses Papiers. Er ist in beiden Themen zeichengleich mit einem
bereits geprüften Paar; eingetragen wird er trotzdem, weil eine Zusage, die aus der Gleichheit
zweier Tokenwerte folgt, nur so lange hält wie die Gleichheit. `pnpm run contrast` muss ihn
ausweisen.

**Kein Token wird geändert, keines hinzugefügt.** Die Skala aus `packages/ui-tokens/tokens.css`
bleibt zeichengleich.

### 6.3 Responsives Verhalten

Es werden **keine neuen Umbruchpunkte eingeführt.** Der Bestand kennt 92, 68, 60, 52 und 40 rem;
dieses Papier bleibt darin.

| Umbruchpunkt | Was hier zu beachten ist |
|---|---|
| ab 60 rem abwärts | `.settings-rail` wird zur umbrechenden Zeile, `.settings-rail__hint` verschwindet. Deshalb steht die Verneinung aus 3.6 in der **Karte**, nicht in der Schiene |
| ab 68 rem abwärts | `.detail`, `.time-layout`, `.tags-split` werden einspaltig. Nach ST-10 beginnt die Zeiterfassung dort unmittelbar mit dem Timer — der Gewinn ist auf schmalen Fenstern am größten |
| Board, jede Breite | `.board` scrollt waagerecht bei 17 bis 21 rem je Spalte. Die Regelzeile darf deshalb nie beschnitten werden (3.10 Punkt 1); sie wächst in die Höhe, und das ist die einzige Richtung, in der Platz ist |
| ab 52 rem abwärts | Die Hülle wird einspaltig. `.screen__headline--bare` bleibt richtig: Titel und Aktionen brechen dann untereinander, und `align-items` wirkt auf die verbleibende Zeile |
| ab 40 rem abwärts | `.attachment-pick` wird einspaltig. UM-06 ändert daran nichts |

### 6.4 Zustände nach dem Umbau — was zu prüfen ist

| Zustand | Prüfpunkt |
|---|---|
| Leer | Board ohne Spalte (3.9), Spalte ohne Bedingung, Spalte mit leerem Ordner, Spalte ohne Treffer — **drei verschiedene Leerzustände, und sie bleiben drei** (`BoardScreen.tsx:775-845`). Keiner wird bei der Textkürzung mit einem anderen zusammengelegt |
| Laden | unverändert. `LoadingBlock` trägt seinen Satz als `visually-hidden`; sichtbar ist das Skelett (T-163 Regel S-09) |
| Zeiger | `.settings-rail__item:hover`, `.kcolumn` — unverändert |
| Aktiv | unverändert |
| Fokus | unverändert. `--focus-ring-*`, `--focus-ring-width: 2px`, bei `prefers-contrast: more` 3 px |
| Fehler | unverändert. `AsyncBoundary` behält Titel, Dienstsatz und genau einen Wiederherstellungsweg (`parts.tsx:137-152`) |
| Rückfrage | unverändert. Kein Bestätigungstext dieses Papiers wird angefasst; die gesperrten stehen in T-163 Abschnitt 5 und T-165 Abschnitt 4.1 |

### 6.5 Bewegung

Es kommt **keine neue Animation** hinzu. Was benutzt wird, steht schon da: `--motion-fast` (140 ms)
für Farbwechsel an der Schiene und am Spaltenkopf, `--ease-out`, und Regel U-3 verbietet
Höhenanimationen an Textblöcken. `base.css:209-218` neutralisiert alles bei
`prefers-reduced-motion`.

---

## 7. Übergabe an frontend-dev

Gegliedert nach der Umsetzungsreihenfolge aus T-163 Abschnitt 9. Jede Zeile ist entweder „nur Text"
(dann steht hier nichts weiter zu tun) oder trägt eine benannte Gestaltänderung.

### Welle X+1 — ohne Vorlage bei einem Prüfer

| Eintrag | Gestaltänderung |
|---|---|
| ST-01, ST-02 (Sprechblasen in Navigation und Exportbereichen) | **keine.** Die Beschriftungen bleiben zeichengleich, nur `title` und das Feld `hint` entfallen |
| ST-03 (Kennungen) | **keine**, außer bei `ExportAuditScreen.tsx:173`: Dort fällt eine ganze Karte; die Legende (`:176-190`) rückt in die Ansicht. Sie ist damit erste Fläche unter dem Kopf — Reihenfolge prüfen, nicht Abstand |
| ST-07, ST-09 Zeilen 1, 2, 4 | **keine.** ST-09 Zeile 1 ist zugleich E-080 (Takt siezt) |
| ST-09 Zeile 3 (`Primitives.tsx:322`) | **keine**, aber zugänglicher Name: mit unit-tester und e2e-tester |
| ST-09 Zeile 5 (`Tag.tsx:115`) | **Abschnitt 5.3.** Wortmarke, Modifikatorklasse, Messung der Chipwand, zugänglicher Name |
| Musterseite nachziehen | `showcase/BoardSection.tsx` zeigt den Spaltenkopf. Die Änderungen aus 3.2 und 3.3 wirken über die gemeinsamen Klassen automatisch; der **Text** ist dort Prüfdokumentation und wird nachgezogen, nicht gekürzt |

### Welle X+2 — nach diesem Papier

| Eintrag | Gestaltänderung |
|---|---|
| ST-04 (Einstellungen) | `AREA_LEAD` entfällt vollständig (1.1). Kontur des aktuellen Schieneneintrags auf `--border-accent`, Paar in `contrast-check.mjs` nachtragen (1.2). Trennlinie des Kartenkopfes **bleibt** (1.4) |
| ST-08 Teil `StatusSettings` / UM-04 | Kasten `:372-385` entfällt. **Nichts tritt an die Stelle** — der Sperrgrund steht sichtbar in der Zeile (4.4). Ausprägung der Zeile unverändert |
| ST-10 (Dashboard, Zeiterfassung) | Beide `lead` entfallen (2.1, 2.2). `ScreenHeader` setzt `screen__headline--bare` bei fehlendem `lead`; `.screen__headline--bare { align-items: center }` |
| UM-06, ST-08 Teil `Attachments` | 4.6. Dialogbeschreibung fällt, Optionshinweise kurz, Feldhinweis trägt die Aussage, Leerzustand behält die gesperrte Fassung (G-7) |

### Welle X+3 — nur nach Vorlage bei spec-ux-reviewer

| Eintrag | Gestaltänderung |
|---|---|
| **ST-05** | 3.2 (Trennlinie im Spaltenkopf), 3.3 (Farbe der Regelzeile), 3.6 (Kartenbeschreibung `StatusSettings` schrumpft auf die Verneinung statt zu entfallen), 3.7 (Wegweiser einzeilig, kein Verweis, kein neues Zeichen), 3.10 (vier Dinge, die nicht mitgenommen werden) |
| **UM-01** | 4.1 und 4.2. Bauform B1, `hint={undefined}` statt CSS, Ausnahme `RadioRow` **nicht** angleichen, Regel U-4 messen |
| **UM-02** | **nicht umsetzen** (4.3). Nur ST-03 an dieser Stelle |
| **UM-03** | 4.8. Kein Ersatzkasten in den Einstellungen |
| **UM-05** | 4.5. Zweiter Satz im selben Rumpf, kein zweites Band |
| **UM-07** | 4.7. Zwei Sätze, Rückweg schlägt Erklärung |
| **ST-06** Zeilen `TodoFormDialog` und `TodoListScreen` | **keine Gestaltänderung.** Der Dialog behält seine Feldfolge; die Hinweise werden kürzer, nicht anders gezeichnet |

### Was in keiner Welle angefasst wird

Unverändert wie T-163 Abschnitt 9: `ShellStatus.tsx`, `lib/exportDirectoryAdvice.ts`,
`lib/databaseLocationAdvice.ts`, `AttachmentOpenDialog.tsx`, `Attachments.tsx:109-140`,
`UpdateDialog.tsx`, die `consequence`- und `acknowledgeLabel`-Texte. Dazu aus T-165 Abschnitt 4.1
die zehn gesperrten Sätze G-1 bis G-10, darunter ausdrücklich **G-10, die leere Meldefläche im
Baum** — sie sieht wie ein überflüssiges Hinweisfeld aus und ist die Bedingung dafür, dass eine
Meldung überhaupt angesagt wird (Bauform B2).

---

## 8. Befunde und offene Fragen an den Orchestrator

**B-1 — UM-02 ist bereits gebaut; die Prämisse trifft die verborgene Hälfte.**
`RadioRow.tsx:145-154` zeichnet allein den Hinweis der gewählten Option; sichtbar erscheint
`POOL_EXPORT_NOT_BILLED_HINT` heute schon nur bei gewähltem „Abgerechnet". Dauerhaft im Baum steht
die `visually-hidden`-Beschreibung **jeder** Option (`:138-144`), und die ist Absicht (S-6 aus R-2,
Begründung bei `:44-56` und `:125-137`). Eine Umsetzung von UM-02 im Wortsinn würde sichtbar nichts
ändern und S-6 still zurücknehmen. **Vorschlag: UM-02 aus der Umbauliste streichen, ST-03 an dieser
Stelle einzeln fahren.** Dasselbe gilt sinngemäß für `POOL_MATCH_MODE_HINT` (T-163, S-05, UM-01
„heute beide sichtbar") und für die drei Optionshinweise in `Attachments.tsx:420-422`.

**B-2 — die eine geprüfte Asymmetrie zwischen Sicht und Gehör braucht einen Eintrag, sonst wird sie
weggeräumt.** E-078 Nachtrag Punkt 8 verlangt Symmetrie und verlangt, sie zu **messen**. Gemessen:
`Select` und `TextField` sind symmetrisch bauartbedingt (`Select.tsx:201` und `:233` hängen am
selben Ausdruck). `RadioRow` ist es nicht, mit Freigabe. **Vorschlag: als benannte Ausnahme in
`decisions.md` festhalten**, damit weder das Entfernen der verborgenen Sätze noch das Sichtbarmachen
aller Optionshinweise als „Aufräumen" durchgeht.

**B-3 — die letzte zeitgebundene Erklärfläche.** Die Karte „Was sich geändert hat"
(`BoardScreen.tsx:975-1008`) spricht zu jemandem, der vor E-054 ein Statusboard hatte. Für eine
frische Einrichtung ist sie gegenstandslos, und sie trägt zugleich eine vierte Fassung des
Kanban-Satzes. Sie liegt außerhalb der ST-Liste; ich streiche sie nicht. **Sie braucht eine
Bedingung, unter der sie erscheint, oder ein Ablaufdatum.**

**B-4 — ein Deiktikum in einer Überschrift.** Schiene „Arbeitsplatz", Karte „Dieser Arbeitsplatz"
(`SettingsScreen.tsx:558`). Sobald der Kartentitel die Bereichsüberschrift ist (ST-04), sind das
zwei Namen für eine Sache. `Card.title` ist vertraglich; die Änderung geht nur mit unit-tester und
e2e-tester. **Vorschlag, keine Vorgabe.**

**F-1 — offen: verträgt die Chipwand eine Wortmarke?** Abschnitt 5.3. Zu messen in
`SettingsScreen` Bereich „standardtags" und im Regelformular bei 1280x720. Bricht die Wand um,
bleibt `title` an dieser einen Marke stehen und ST-09 Zeile 5 entfällt. Die Messung gehört zur
Umsetzung, nicht zu diesem Papier.

**F-2 — offen: welches Trennzeichen für einen Pfad in einem Hinweis?** Abschnitt 3.7. `›` kommt in
keinem Oberflächentext von `apps/web` vor. Der Wortlaut gehört ux-designer; die Bedingung („kein
Zeichen, das sonst nirgends steht") gehört hierher.

**F-3 — offen, an ux-designer: X-06 aus T-165.** Die Aussage „Sie ändert nichts an Pools, Spalten,
Buchungen oder Export" steht in `TodoFormDialog.tsx:227` und `TodoDetailScreen.tsx:421` und ist auf
einem von drei Wegen gleichzeitig sichtbar. spec-ux-reviewer lässt zwei Auflösungen zu und
überlässt die Wahl ux-designer. **Meine gestalterische Empfehlung, falls sie erbeten wird:** Der
Satz bleibt im **Dialog**, die Karte behält allein die Exportaussage (A-19.17). Grund aus der
Rangfolge, nicht aus der Zeichenzahl: Die Karte ist eine **Lese**fläche, der Dialog eine
**Schreib**fläche; eine Regel darüber, was ein Wert bewirkt, gehört dorthin, wo der Wert gesetzt
wird.

---

# 9. Nachtrag T-204 (Welle AE) — der `MessageSlot`

**Vorlage:** O-HZ (Board), Z-53 und **Z-53a blockierend** aus `.claude/team/reports/T-200-spec-ux-reviewer.md`
Abschnitt 3, die Messung aus `.claude/team/reports/T-191-frontend-dev.md` 2.3 bis 2.5 (42 **bedingt
gezeichnete Meldebausteine**, nicht Aufrufstellen — berichtigt T-236),
die Browsermessung aus `.claude/team/reports/T-202-frontend-dev.md` 1.2 und 1.3, B-5, SC 4.1.3,
E-076 Punkt 3, E-078 Nachtrag Punkt 8, E-087.

**Warum dieser Abschnitt hier steht und nicht in einem neuen Papier.** Abschnitt 4.1 dieses Papiers
hat drei Bauformen benannt und **B2 — reserviertes Fach** die schwächste Begründung mitgegeben
(„steht dauerhaft im Baum und ist leer, wenn es nichts zu sagen gibt"). T-191 hat B2 danach an zehn
Stellen gebaut, T-200 hat die 42 bedingt gezeichneten sortiert. Was fehlt, ist die **Gestalt** von B2: wo das Fach
sitzt, wie hoch es leer ist, und was beim Füllen nicht springen darf. Das ist die Fortschreibung von
4.1 und keine neue Sache. Die Regeln U-1 bis U-4 gelten unverändert weiter; W-1 bis W-6 unten sind
ihre Anwendung auf den einen Behälter, den es dafür braucht.

---

## 9.1 Der Bau — was `MessageSlot` ist, und die drei Dinge, die er nicht ist

**Entscheidung: ja, ein gemeinsamer dauerhafter Wirt.** Er heißt `MessageSlot`, er zeichnet genau
das, was `.live-region` seit T-191 ist — einen Kasten ohne Rand, ohne Füllung, ohne Abstand — und er
trägt die **Rolle**. Der Baustein darin zeichnet sie dann nicht mehr.

```
<MessageSlot urgency="assertive">        →  <div class="live-region" role="alert">
  {error === null ? null : (                 {error === null ? null : (
    <InlineMessage tone="danger" …/>           <div class="message message--danger"> … </div>
  )}                                         )}
</MessageSlot>                              </div>
```

**Wie `InlineMessage` erfährt, dass es schweigen soll: über einen Zusammenhang, nicht über eine
Eigenschaft am Aufruf.** `MessageSlot` legt `MessageHostContext` über seinen Teilbaum;
`InlineMessage` liest ihn und lässt `role` und `aria-live` weg, wenn er gesetzt ist. Damit bleiben
**alle Aufrufstellen zeichengleich** — **77** in `apps/web/src`, davon 31 auf der Musterseite
(gemessen 2026-09-06 über den Wortlaut `<InlineMessage` im Arbeitsbaum, T-236; T-204 nannte hier 76,
Stand jener Welle) —, und die Verschachtelung **Wirt über Meldebaustein** ist nicht mehr eine Frage
der Sorgfalt, sondern baulich ausgeschlossen.

> **Diese Zahl und die 42 in 9.2 zählen nicht dasselbe, und das stand hier bis T-236 nirgends.**
> **77** sind **alle** Aufrufstellen von `InlineMessage`. **42** sind die **bedingt gezeichneten
> Meldebausteine** aus T-191 2.5 — 37 `InlineMessage`, 4 `LoadingBlock`, 1 `UpdateNotice`. Beide
> Sätze waren richtig; keiner sagte, worüber er zählt. Der Satz dieses Abschnitts hängt an keiner
> von beiden — er gilt für *alle*, gleich wie viele es sind. Genau deshalb ist die Zahl gefährlich:
> Sie trägt nichts und wird trotzdem als Beleg weitergereicht (E-087 Punkt 2).

> **Und weiter reicht der Ausschluss nicht — das ist seit T-213 gemessen und gehört hierher, nicht
> ans Ende des Papiers (Regel T-7).** `MessageSlot` stellt `InlineMessage` still. Er stellt **keine
> von Hand geschriebene Rolle in einem Kind der Meldung** still. Genau die steht heute im Bestand:
> Die Kopier-Rückmeldung der Tokenmeldung in `SettingsScreen` trägt ein eigenes `role="status"` an
> einem `span` **innerhalb** der `InlineMessage`. Dort ist also **heute schon** eine Live-Region in
> einer Live-Region, und ein Wirt darüber verschärft sie, statt sie zu beseitigen. Herleitung und
> Folgen: 9.11.

**Die Bauart des Wirts** steht bereits im Bestand: `FieldMessageQuietContext` (T-202) macht dasselbe
für die Feldflächen eines Formulars — ein Wirt legt eine Eigenschaft über seinen Teilbaum, statt sie
an jedem Kind zu wiederholen. Und sie hat dieselbe Reichweite: über den Teilbaum der Bausteine, die
den Zusammenhang **lesen**, nicht über jeden Knoten darin.

**Die Dringlichkeit gehört dem Platz, nicht der Meldung.** `MessageSlot` bekommt
`urgency: "polite" | "assertive"`, Vorgabe `"polite"`; `InlineMessage` behält `tone` für das
Aussehen. Das ist kein Schönheitsentscheid: Eine Rolle, die mit dem Inhalt wechselt, ist wieder eine
Rolle, die kommt und geht — genau der Fehler, den T-162 behoben hat. Eine Fläche, auf der eine
Absage erscheinen **kann**, ist eine dringliche Fläche, auch in den Minuten, in denen nichts
dasteht. `.field__live` führt seit T-162 aus demselben Grund ein dauerhaftes `role="alert"`.

**Was er nicht ist:**

1. **Kein Aussehen.** `.live-region` hat bis heute **keine einzige eigene CSS-Regel** — nur
   `:empty`-Korrekturen an den Behältern, in denen er steht. Das bleibt so. Die Klasse ist ein
   Merkzeichen für den Wächter und für den Leser, kein Bauteil mit Erscheinung. Wer ihr eine
   Mindesthöhe, einen Rahmen, eine Tönung oder ein „alles in Ordnung" gibt, baut das Loch, das
   dieser Abschnitt vermeiden soll.
2. **Kein zweiter Meldebaustein — und keine zweite Rolle in einem Kind.** `InlineMessage` bleibt der
   einzige Meldebaustein; der Wirt umschließt ihn, er ersetzt ihn nicht. **Und in seinem Inneren
   steht keine zweite Live-Region** (T-213, verbindlich seit dort): Wer in einem Meldebaustein eine
   Rückmeldung ansagen will, benutzt die Fläche, die der Wirt ohnehin trägt — nicht ein eigenes
   `role="status"` daneben. Der Wirt reicht nicht bis in die Kinder; was dort steht, steht dort
   gegen ihn.
3. **Kein Ersatz für den Blick.** Der Wirt sorgt dafür, dass eine Meldung **angesagt** wird. Dass
   sie auch **gesehen** wird, ist eine zweite Sache und hängt am Bildlauf. Siehe 9.5.

---

## 9.2 Wo der Wirt sitzt — drei Plätze, eine Regel

> **Regel W-1.** Der Wirt sitzt genau dort, wo die Meldung heute schon steht. Er ist ein Rahmen um
> eine bestehende Stelle, kein neuer Ort.

Das ist die wichtigste Zeile dieses Abschnitts, und sie ist zugleich die Antwort auf die Frage nach
den Kosten: An der wichtigsten der **42 bedingt gezeichneten Meldebausteine** (Stand T-191 2.5:
37 `InlineMessage`, 4 `LoadingBlock`, 1 `UpdateNotice` — **nicht** dieselbe Menge wie die 77
Aufrufstellen in 9.1) kostet der Wirt **keinen einzigen Knoten**, weil dort bereits ein Behälter
steht (9.5).

| Platz | Wann | Beispiele |
|---|---|---|
| **P1 — der Wirt ist das Fach, in dem die Meldung heute steht** | Die Meldung hat einen festen Ort auf einer stehenden Fläche | `FormDialog`, `TagsScreen`, `SettingsScreen`, `TodoDetailScreen`, `ExportScreen` |
| **P2 — der Wirt steht über der Verzweigung, nicht in einem ihrer Zweige** | Laden, Fehler und Ergebnis tauschen ganze Teilbäume | `AsyncBoundary`, die Kartenrümpfe mit `nodes.length === 0 ? … : …` |
| **P3 — der Wirt ist eine eigene Zeile der Hülle** | Die Meldung gehört der Anwendung, nicht einer Ansicht | Sitzungsleiste der Versionsprüfung (9.6) |

> **Regel W-2 (P2 ausgeschrieben).** Steht der Wirt in einem Zweig einer Bedingung, die einen
> ganzen Teilbaum tauscht, dann entsteht er mit diesem Zweig — und die Behebung ist keine. Das ist
> dieselbe Grenze, an der die Abbruchbedingung von `proof:surface` Regel A endet (T-191:
> „steht eine Bedingung darüber, **bevor** ein JSX-Element kommt"). Konkret für `TagsScreen`: Der
> Wirt ist ein Kind der Karte **vor** dem Ternär `nodes.length === 0 ? EmptyState : .tags-split`,
> nicht ein Kind von `.tags-split`. Er kostet dort im Leerzustand nichts, weil er nichts ist.

---

## 9.3 Die leere Fläche — Höhe **null**, und warum der Bildschirm davon kein Loch bekommt

**Antwort auf die gestellte Frage: null. Immer null. Es wird nie Platz reserviert.**

Ein leerer Wirt ist ein Block ohne Höhe; seine Ränder und die seines Kindes fallen durch ihn
hindurch, und im Seitenfluss steht danach genau das, was ohne ihn dort stünde. Das ist keine
Behauptung, sondern die Bauform, die seit T-191 an drei Stellen läuft.

**Ein reserviertes Fach wäre das Loch.** Eine dauerhaft sichtbare, dauerhaft leere Fläche unter
jedem Formular lehrt in zwei Tagen, dass dort nichts steht — und wird danach übersehen, wenn doch
etwas darin steht. Ein Fach mit Mindesthöhe ist außerdem die Einladung, es zu füllen („dann können
wir da auch gleich den Hinweis hinschreiben"), und damit die Rückkehr genau der Textmenge, die
E-078 abgebaut hat.

**Das Loch entsteht nicht am Wirt, sondern am Abstandsmechanismus seines Behälters.** Ein leerer
Knoten zählt in vielen Behältern als Kind. Drei Mechanismen, drei Antworten — und die dritte ist die
Falle:

| Behälter | Mechanismus | Antwort im Leerzustand |
|---|---|---|
| **Fluss oder Flex mit `gap`** | Der leere Wirt zählt als Kind und bekommt eine Lücke | negativer Rand am `:empty`-Wirt, wie `.attachment__main` (−2px) und `.tag-picker` (−`--space-1`) seit T-191 |
| **Geschwisterregel `X + Y`** (`.card__body`) | Der Knoten **hinter** dem Wirt verlöre seinen Abstand | `.live-region` steht in der **linken** `:where`-Liste — steht seit T-191 dort, **nichts zu tun** |
| **Raster mit `gap`** | Die Rasterzeile des leeren Wirts wird null hoch, **die Lücke zwischen den Zeilen bleibt aber stehen**. Ein negativer Rand nimmt sie hier **nicht** zurück: `gap` liegt zwischen den Spuren und nicht am Element | Der Wirt steht **nicht im Raster**, sondern als Geschwister davor (P2 löst das bei `.tags-split` ohnehin mit) — oder das Raster hat gar kein `gap` (so bei `.app`, 9.6) |

**Die dritte Zeile ist gerechnet, nicht am Bildschirm gemessen** (E-087). Sie folgt aus der
Spurberechnung des Rasters und betrifft im Bestand genau einen Behälter, `.tags-split`
(`app.css:3737-3748`, zwei Spalten, `gap: var(--space-4)`). Weil die Antwort dort ohnehin P2 heißt,
hängt keine Entscheidung dieses Abschnitts an ihr — sie steht hier, damit niemand den negativen Rand
aus Zeile 1 in ein Raster kopiert und sich über 16 px wundert, die nicht weggehen.

> **Regel W-3.** Zu jedem neuen Wirt gehört die Nennung des Abstandsmechanismus seines Behälters
> und, wenn nötig, dessen Rücknahme im Leerzustand — in derselben Änderung. Ein Wirt ohne diese
> Zeile ist ein Loch mit Rolle.

---

## 9.4 Was beim Erscheinen der Meldung nicht springen darf

T-202 hat den Fall im Browser gemessen, um den es hier geht (Bericht 1.3, Fenster 1000×150,
Formulardialog der Musterseite):

```
nach 8 Tabulatorschritten (Fokus auf „Anlegen")
  Rumpf: scrollTop=67 von 74 moeglich, sichtbar 35.8..125.8
  Titelblock: -31.2..24.6  → GANZ OBERHALB des Ausschnitts
```

Das ist die Lehre in einer Zeile: **In einem Rumpf, der scrollt, kann eine Fläche vollständig
außerhalb des Sichtbereichs liegen, während der Benutzer auf den Knopf drückt, der sie erzeugt.**
Der Wirt ändert daran nichts — er macht die Meldung hörbar, nicht sichtbar. Beides ist nötig, und
beides hat einen eigenen Mechanismus. Daraus die drei Sprungregeln:

> **Regel W-4 — was stehen bleiben muss.** Das Bedienelement, das der Benutzer gerade betätigt hat,
> darf sich nicht unter dem Zeiger wegbewegen; und keine **andere** Schaltfläche darf an seine
> Stelle rutschen. Bewegt es sich doch, dann nur **von** der Zeigerstelle weg, nie eine zweite
> Schaltfläche darunter.
>
> **Regel W-5 — nie oberhalb.** Der Wirt steht unterhalb dessen, womit der Benutzer gerade umgeht
> (U-2 aus 4.1, unverändert). Eine Ausnahme hat nur P3: Die Meldung der Hülle gehört nicht zu einer
> Bedienung, sondern zur Anwendung, und sie steht seit je oben (9.6).
>
> **Regel W-6 — keine Bewegung.** Kein Auf- und Zuklappen, keine Höhenanimation, keine Einblendung
> (U-3 aus 4.1). Eine Absage ist da, sobald sie da ist. 140 ms Blende gewinnen nichts und kosten
> den ersten Blick; bei `prefers-reduced-motion` verschwände sie ohnehin (`base.css:209-218`), und
> eine Bewegung, die dort wegfallen darf, hat nie getragen.

**Wann kein Sprung entsteht, und wann doch — die zwei Fälle aus U-4, jetzt mit dem Wirt gelesen:**

* **Der Behälter scrollt bereits.** Der Zuwachs verschwindet im Bildlauf. Nichts außerhalb des
  Behälters bewegt sich: Dialograhmen, Fußzeile und Absendeknopf stehen still. **Der gute Fall, und
  im Formulardialog der häufige** — die betroffenen Dialoge sind die langen.
* **Der Behälter scrollt noch nicht.** Er wächst um die Höhe der Meldung. Im Dialog verschiebt die
  senkrechte Zentrierung von `.scrim` alles um die **halbe** Zuwachshöhe nach oben, die Fußzeile um
  dieselbe Hälfte nach unten. Gemessen an W-4 ist das zulässig: Unter der Fußzeile liegt der
  Dialogrand und keine zweite Schaltfläche; der Zeiger steht danach über der Meldung oder über dem
  letzten Feld, nie über einem anderen Knopf. **Vertretbar, benannt, nicht schön.** Wer es besser
  will, baut das Höhenmodell des Dialogs um (Deckel am `.dialog`, Rumpf als flexibler Teil) — das
  ist ein eigener Auftrag mit einer eigenen Messung und **nicht** Teil dieser Sortierung.

---

## 9.5 Der Formulardialog — die erste Stelle, und sie kostet keinen Knoten

`FormDialog.tsx:255-261` sieht heute so aus:

```tsx
{error === null ? null : (
  <div ref={errorRef}>
    <InlineMessage tone="danger" title="Das hat nicht geklappt">{error}</InlineMessage>
  </div>
)}
```

**Der Behälter steht bereits da; er steht nur auf der falschen Seite der Bedingung.** Die Behebung
schiebt die Bedingung nach innen:

```tsx
<MessageSlot urgency="assertive" ref={errorRef}>
  {error === null ? null : (
    <InlineMessage tone="danger" title="Das hat nicht geklappt">{error}</InlineMessage>
  )}
</MessageSlot>
```

* **Ein Knoten mehr im Baum: null.** Aus dem namenlosen `<div ref>` wird der Wirt. Das ist die
  Antwort auf R-2 aus T-191 („42 leere Knoten") an der Stelle, an der sie am meisten wiegt: ein
  Wirt, sechzehn Formulardialoge, vier Pflichtklickpfade.
* **Ort:** letztes Kind von `.dialog__body--form`, unverändert. Unterhalb der Felder (W-5), oberhalb
  der Fußzeile mit dem Knopf, der gerade gedrückt wurde.
* **Abstand:** `.dialog__body--form` ist eine Flex-Spalte mit `gap: var(--space-4)`
  (`app.css:1273-1279`). Der leere Wirt zählt dort als Kind. Also Zeile 1 aus 9.3:

  ```css
  /* Der leere Wirt zaehlt in der Flex-Spalte als Kind. Dieselbe Ruecknahme wie
     bei `.attachment__main` und `.tag-picker` (T-191). Wer den `gap` oben
     aendert, aendert ihn hier mit. */
  .dialog__body--form > .live-region:empty {
    margin-block-start: calc(-1 * var(--space-4));
  }
  ```
* **`errorRef` und `scrollIntoView` bleiben, und das ist keine Nachlässigkeit.** Der Wirt macht die
  Meldung hörbar; `errorRef.current?.scrollIntoView({ block: "nearest" })` macht sie sichtbar. Das
  sind zwei Zusagen an zwei verschiedene Benutzer, und keine ersetzt die andere. **Ausdrücklich an
  frontend-dev:** Wer beim Umbau den Effekt für überflüssig hält, nimmt den Fund aus T-072 zurück
  („der Text lag zwei Bildschirmhöhen tiefer"). Der Ref hängt danach am dauerhaften Knoten und ist
  nie mehr `null` — der Effekt wird dadurch **zuverlässiger**, nicht überflüssig.
* **Die Rückführung aus T-202 bleibt unberührt.** Sie betrifft die **Feld**meldungen
  (`aria-invalid`, `.field__live`, `FieldMessageQuietContext`); die Dienstmeldung stand schon dort
  ausdrücklich außerhalb des Schalters. Der Wirt ändert daran nichts. Beide Wege dürfen nicht in
  einem Auftrag vermischt werden.

---

## 9.6 Die Sitzungsleiste der Versionsprüfung — P3, und ein Verdacht dazu

**Der Widerspruch, den T-200 gemeldet hat, wird zugunsten der Ansage aufgelöst, und zwar eng.** Der
Dateikopf von `UpdateNotice.tsx` sagt: „Ist nichts zu melden, entsteht kein Element." Der Satz
bleibt richtig für **die Leiste**. Er wird falsch, wenn man ihn auf **den Wirt** anwendet: Die
Sitzungsleiste ist die einzige Fläche des Produkts, auf der eine Meldung **ohne jede Handlung des
Benutzers** erscheint (A-18.2). Wer nicht hinsieht, erfährt sonst nichts.

**Gestalt:** Der Wirt ist eine eigene, benannte Zeile des Hüllenrasters — nicht ein Kind der
Leiste, nicht ein Geschwister ohne Platz.

```css
.app {
  grid-template-rows: auto auto auto minmax(0, 1fr);
  grid-template-areas:
    "notice notice"
    "update update"
    "side   head"
    "side   main";
}
.app > .live-region { grid-area: update; }
```

* **Leer kostet die Zeile null.** `.app` hat **kein** `gap` (`app.css:81-90`); eine `auto`-Zeile mit
  einem 0 px hohen Kind ist 0 px hoch. Die Falle aus 9.3 Zeile 3 greift hier nicht.
* **Warum eine eigene Zeile und nicht `notice`.** In `notice` sitzt `.shellnotes`. Zwei Kinder in
  derselben Rasterfläche liegen übereinander. Die Meldungen der Hülle und der Versionshinweis sind
  zwei Sachen und stehen untereinander — die Hülle zuerst, weil sie die dringendere ist
  (`App.tsx:302-307` zeigt den Versionshinweis ohnehin nicht, solange die Sperrmeldung steht).
* **Der Ruck bleibt zulässig und ist bereits entschieden.** `app.css:1806-1809`: „Sie steht im Fluss
  über dem Inhalt und schiebt ihn nach unten, statt ihn zu verdecken … Ein Ruck im Layout ist der
  kleinere Schaden als ein verdecktes Feld." Das ist die eine benannte Ausnahme von W-5, und sie
  gilt weiter. W-4 ist erfüllt: Der Inhalt wandert nach unten, unter dem Zeiger steht danach kein
  anderer Knopf, sondern dasselbe, was vorher darüber stand.

**B-9 — Verdacht, aus der Kaskade gerechnet, nicht gemessen: die Leiste könnte heute in der
falschen Rasterzelle stehen.** `.updatebar` ist ein Kind von `.app` **ohne** `grid-area` und ohne
`grid-column` (`app.css:1811-1820`, sonst nirgends). `.skip-link` ist `position: fixed`
(`base.css:255`) und nimmt an der Platzierung nicht teil; `.shellnotes`, `.app__sidebar`,
`.app__header` und `.app__main` sind über `grid-area` gesetzt. Damit ist `.updatebar` das einzige
selbstplatzierte Kind. Steht keine Hüllenmeldung, ist die Fläche `notice` frei, und die
Selbstplatzierung setzt die Leiste in **Zeile 1, Spalte 1** — also in die Spaltenbreite der
Seitenleiste (`--sidebar-width`) statt über beide Spalten. Steht eine Hüllenmeldung, entsteht statt
dessen eine **implizite vierte Zeile unter dem Inhalt**.

Das ist derselbe Verdachtstyp wie B-6 in `traeger-und-zusage.md` (dort hat visual-qa ihn auf drei
Wegen bestätigt), und er hat denselben Grund, aus dem er nie auffiel: Die Sitzungsleiste erscheint
erst, wenn eine **zweite** Antwort der Versionsprüfung während der Arbeit eine neuere Fassung meldet
(`useUpdateNotice.ts:198-208`) — im Entwicklungsbau praktisch nie. **Meine Entscheidung hängt nicht
davon ab:** Die benannte Zeile oben ist so oder so richtig und behebt den Fall mit. **Ich kann es
nicht messen** — hier läuft kein Browser. Zu prüfen von visual-qa, in beiden Themen, mit und ohne
Hüllenmeldung.

---

## 9.7 Reihenfolge und Bündel — und wie die halb umgesetzte Sortierung verhindert wird

spec-ux-reviewers Warnung ist die schärfste Auflage dieser Aufgabe: *„Eine halb umgesetzte
Sortierung ist schlechter als keine."* Sie wird **nicht** durch Disziplin beantwortet, sondern
durch zwei bauliche Vorkehrungen.

**Erstens: die Sortierung wird eine Liste im Lauf, kein Absatz in einem Papier.** Zur ersten Welle
gehört, dass `proof:surface` eine **Regel E** bekommt: Ein bedingt gerenderter `InlineMessage` mit
`tone="danger"` oder `"warning"`, dessen nächster umschließender Baustein kein `MessageSlot` ist,
ist rot — es sei denn, seine Datei steht in einer **benannten Liste der Sorte 2**, je Eintrag mit
einem Satz Grund. Damit ist der Zwischenstand jederzeit lesbar: Was einen Wirt hat, hat einen; was
keinen hat, steht mit Grund in der Liste; alles Dritte bricht den Lauf. Zwanzig zu zweiundzwanzig
kann es dann nicht mehr geben, weil der Rest nicht mehr schweigt. *(Die Bauart der Regel ist
frontend-devs Handwerk — dass es sie geben muss, ist die Bedingung dieser Gestaltentscheidung.)*

**Zweitens: ein Bündel ist eine Fläche, nie eine Anzahl.** Eine halb umgebaute **Datei** ist der
Zustand, in dem niemand mehr weiß, was gilt. Eine ganz umgebaute Datei neben einer unberührten ist
lesbar, solange die Liste sie nennt.

| # | Bündel | Warum genau so geschnitten |
|---|---|---|
| **0** | **Der Bau selbst plus die erste Stelle plus Regel E — ein Auftrag** | `MessageSlot`, `MessageHostContext`, die Rücknahme der Rolle in `InlineMessage`, die `:empty`-Zeile für `.dialog__body--form`, `FormDialog` als erste Stelle, Regel E mit zwei Gegenproben. **Ein Wirt ohne ersten Benutzer ist ungeprüft; ein erster Benutzer ohne Wirt ist die zweite Fassung.** Das ist Z-53a, erledigt |
| **1** | `TagsScreen` — die Absage des Ziehens | Der einzige Rückweg ohne Dialog, dazu die Selbstverschiebung (Pflichtklickpfad). Bringt P2 als Muster mit: Wirt **vor** dem Ternär, im Kartenrumpf |
| **2** | `SettingsScreen` — die drei Stellen | Eine Datei, ein Agent (dieselbe Begründung wie 6.5 in `traeger-und-zusage.md`). Darunter die einmalige Tokenmeldung, die folgenreichste des Bereichs. **Zwei verbindliche Zusätze aus T-213, hierher gezogen:** (a) Der Wirt **und** das Entfernen des inneren `role="status"` der Kopier-Rückmeldung sind **eine** Änderung — wer nur den Wirt setzt, verschärft die Verschachtelung (9.8 Punkt 2). (b) Diese eine Fläche bekommt `urgency="polite"`, **nicht** `assertive`: Das Token steht einmalig da und muss **gelesen** werden; eine dringliche Ansage unterbricht genau den Vorgang, um den es geht (abschreiben, kopieren). Dieser Platz ist eine Auskunft, keine Absage |
| **3** | `TodoDetailScreen` — „Der Vermerk wurde nicht gespeichert" | Der einzige Rückweg eines gescheiterten Speicherns am internen Vermerk. **O-AX wird hier nicht mitgenommen** — eine Längengrenze ist keine Meldefläche |
| **4** | `UpdateNotice` — die Sitzungsleiste | Berührt `.app` und damit das Hüllenraster (9.6). Getrennt, weil dort eine Rasterzeile entsteht und ein Verdacht zu messen ist |
| **5** | `ExportScreen` — die zwei Vorschaufehler | Sie sind die sichtbare Begründung der gesperrten Exportschaltfläche. Zuletzt, weil hier zusätzlich zu entscheiden ist, was der Toast bereits ansagt |

**Nachrangig und ausdrücklich mit Grund, damit es nicht als Lücke gelesen wird:** die vier
`LoadingBlock` und der Ladezweig von `AsyncBoundary` (der Wirt gehört ans Ergebnis, nicht ans
Warten), die 30 Vorkommen der Musterseite (kein Produktweg — und der Formulardialog der Musterseite
bekommt den Wirt ohnehin geschenkt, weil er den echten `FormDialog` benutzt), und alles, was der
Toast bereits ansagt (`ToastContext` hat den dauerhaften Wirt seit je).

---

## 9.8 Was der Wirt **nicht** leistet — vier Grenzen, damit niemand mehr erwartet

1. **Er sagt eine Meldung an, wenn sie erscheint. Er sagt sie nicht erneut an, wenn sie unverändert
   stehen bleibt.** Das ist der Kern von Z-49 aus T-200: „da sich ihr Text nicht ändert, wird sie
   auch nicht erneut angesagt". Wer will, dass eine unveränderte Absage nach einer neuen Handlung
   wieder gehört wird, braucht dafür etwas anderes — und zwar eine Entscheidung, nicht einen Wirt.
2. **Er reicht nicht bis in die Kinder.** Er stellt `InlineMessage` still, nicht eine von Hand
   geschriebene Rolle **innerhalb** einer Meldung. Steht dort ein eigenes `role="status"` oder
   `aria-live`, so ist die Verschachtelung nicht beseitigt, sondern verschärft: eine dringliche
   äußere und eine höfliche innere Region ineinander. Der Bestand hat genau einen solchen Fall
   (Kopier-Rückmeldung der Tokenmeldung in `SettingsScreen`); er wird **mit** dem Wirt entfernt und
   nicht danach — beides ist **eine** Änderung. Herleitung: 9.11, Punkte 1 und 2. Vierte Grenze seit
   T-213, hierher gezogen in T-229.
3. **Er ersetzt keinen Bildlauf und keinen Fokus.** 9.5, zweitletzter Punkt.
4. **Er ist nicht gemessen, sondern abgeleitet.** In dieser Umgebung läuft kein Vorleseprogramm
   (T-B09). Was gemessen werden kann, ist die **Bauart** — dass die Region beim Aufbau der Fläche
   im Baum steht und nicht mit ihrem Inhalt entsteht. Das misst `proof:surface`. Was ein Hörender
   hört, bleibt eine Ableitung, und sie steht so auch im Kopf des Laufs.

---

## 9.9 Vertrag (E-076 Punkt 3)

| Änderung | Rolle | Zugänglicher Name | Klassenname | Token |
|---|---|---|---|---|
| `MessageSlot` als Wirt | **umgezogen**, nicht geändert: `alert`/`status` stehen danach am Wirt statt am Baustein — dieselbe Bewegung wie an den zehn Stellen aus T-191 | — | `.live-region`, **bestehend** | — |
| `InlineMessage` lässt Rolle und `aria-live` weg, **wenn** ein Wirt darüber steht | — (die Rolle steht dann eine Ebene höher) | — | `.message`, `.message--*` unverändert | — |
| `.dialog__body--form > .live-region:empty` | — | — | bestehend | — |
| `.app` bekommt die Rasterzeile `update` | — | — | bestehend, ein Flächenname kommt hinzu | — |
| `.tags-split` — Wirt wandert vor das Ternär | — | — | **`.tags-split__error` wird gegenstandslos**: Ihre einzige Zeile ist `grid-column: 1 / -1` (`app.css:3744-3748`), und außerhalb des Rasters wirkt sie nicht. Sie fällt mit dem Umzug, samt ihrem Kommentar | — |

**Kein zugänglicher Name ändert sich, kein Token, kein Oberflächentext** (E-078: es kommt nichts
hinzu). Die einzige Rollenbewegung ist die, die T-191 bereits zehnmal gefahren hat.

---

## 9.10 Befunde und offene Fragen aus 9

**B-9** — die Sitzungsleiste steht möglicherweise in der falschen Rasterzelle. Abschnitt 9.6,
gerechnet, nicht gemessen. An visual-qa.

**B-10 — die Falle im Raster.** 9.3, dritte Zeile: Der negative Rand, mit dem T-191 den leeren Wirt
in Flex-Behältern unsichtbar macht, wirkt in einem Raster **nicht**. Der Bestand hat genau einen
betroffenen Behälter, und dort löst P2 es mit. Der Satz steht trotzdem hier, weil die nächste
Meldefläche in einem Raster sonst mit einer 16-px-Lücke endet, die niemand erklären kann.

**F-6 — an den Orchestrator:** Regel E in `proof:surface` (9.7) ist die Bedingung dafür, dass die
Sortierung einen Zwischenstand überlebt. Sie ist Aufwand in derselben Welle wie der Bau. Wird sie
nicht gebaut, ist die Reihenfolge in 9.7 nur ein Vorsatz, und die Warnung aus Z-53 steht wieder
unbeantwortet da.

**F-7 — an spec-ux-reviewer, klein:** `urgency` am Wirt statt `tone` am Baustein bedeutet, dass eine
Fläche mit `urgency="assertive"` auch eine `tone="warning"`-Meldung dringlich ansagt. Das halte ich
für richtig (die Dringlichkeit gehört dem Platz, 9.1), es ist aber eine Änderung gegenüber heute,
wo allein `tone="danger"` `alert` erzeugt. ~~Betroffen ist im Bestand keine Stelle: Die Bündel 0 bis
5 tragen ausschließlich `danger`.~~ **Der zweite Satz ist falsch, berichtigt in 9.11.**

---

## 9.11 Nachtrag T-213 (Welle AF) — F-7 ist beantwortet, und meine Voraussetzung war falsch

**Vorlage:** `.claude/team/reports/T-212-spec-ux-reviewer.md`, Urteile Z-65 und Z-66; E-087.

> **Eingezogen in T-229 (O-JZ). Dieser Abschnitt ist ab hier die Herleitung, nicht der Ort.** Die
> drei verbindlichen Sätze unten stehen seither dort, wo sie gelesen werden: Satz 1 in **9.1
> Punkt 2** und als **9.8 Punkt 2** (der Wirt reicht nicht bis in die Kinder), Sätze 2 und 3 in der
> **Bündelzeile 2 von 9.7** (eine Änderung, nicht zwei; `polite` und nicht `assertive`). Wer nur
> 9.1 oder nur 9.7 liest, hat sie trotzdem. Der Grund für dieses Verfahren steht als **Regel T-7**
> in `docs/design/traeger-und-zusage.md` Abschnitt 0: Ein Nachtrag am Papierende wird beim nächsten
> Lesen überlesen — und genau das ist hier über drei Wellen hinweg (AF bis AI) geschehen, bis
> spec-ux-reviewer es in T-221 gefunden hat.

**Zur Sache: bestätigt.** Die Dringlichkeit gehört dem Platz und nicht der Meldung; Z-65 nimmt die
Begründung aus 9.1 wörtlich an. Daran ändert sich nichts.

**Zur Voraussetzung: widerlegt, und zwar an der folgenreichsten Stelle von Bündel 2.** Mein Satz
*„Betroffen ist im Bestand keine Stelle: Die Bündel 0 bis 5 tragen ausschließlich `danger`"* hält der
Nachmessung nicht stand. In `SettingsScreen` steht die Tokenmeldung — *„Dieses Token steht genau
jetzt hier — und nie wieder"* — als `InlineMessage` mit **`tone="warning"`**, bedingt gezeichnet,
unmittelbar nach einer Handlung, auf stehender Fläche. Das ist Sorte 1, also ein Wirt, also von
Regel E erfasst. Sie sagt sich heute `polite` an; unter `urgency` am Wirt sagt sie sich an, was der
Wirt sagt.

**Wie der Fehler entstanden ist, gehört dazu (E-087).** Ich habe über die **Tonart** gezählt und
dabei die Bündelliste aus T-200 gelesen, statt den Bestand nach `tone=` durchzugehen. Eine Zählung
über eine fremde Liste ist keine Messung. Genau dieselbe Lehre wie in `traeger-und-zusage.md` 10.9:
Was zu prüfen ist, ist der **Wortlaut im Bestand**, und geprüft wird über beides — versionierte
Dateien und Quellverzeichnisse.

**Z-66 ist der schwerere Teil, und er ist eine Grenze meines Bauplans.** `MessageSlot` stellt
`InlineMessage` still. Er stellt **nicht** eine von Hand geschriebene Rolle in dessen **Kindern**
still — und genau die steht in dieser Meldung: die Kopier-Rückmeldung („Kopiert." beziehungsweise
der Fehlsatz) trägt ein eigenes `role="status"` an einem `span` **innerhalb** der `InlineMessage`.
Damit steht dort **heute schon** eine Live-Region in einer Live-Region, also genau der Zustand, den
Abschnitt 9.1 baulich ausschließen wollte. Unter `urgency="assertive"` am Wirt würde daraus eine
dringliche äußere und eine höfliche innere Region ineinander.

**Was daraus für 9.1 und 9.7 folgt — drei Sätze, verbindlich:**

1. **Der Wirt reicht nicht bis in die Kinder, und dieser Satz gehört in 9.1 Punkt 2.** Dort steht
   heute *„Kein zweiter Meldebaustein. `InlineMessage` bleibt der einzige."* Er ist zu ergänzen:
   **Auch keine zweite Rolle in einem Kind.** Wer in einem Meldebaustein eine Rückmeldung ansagen
   will, benutzt die Fläche, die der Wirt trägt — nicht ein eigenes `role="status"` daneben.
2. **Bündel 2 bekommt diese Stelle als benannten Bestandteil**, nicht als Nebenwirkung: Der Umbau
   der Tokenmeldung auf `MessageSlot` und das **Entfernen** der inneren Rolle sind **eine**
   Änderung. Wer nur den Wirt setzt, hat die Verschachtelung nicht beseitigt, sondern verschärft.
3. **Die Dringlichkeit dieser einen Fläche ist `polite` und nicht `assertive`.** Der Grund ist der
   Inhalt: Das Token steht einmalig da und muss **gelesen** werden; eine dringliche Ansage
   unterbricht dabei genau den Vorgang, um den es geht (abschreiben oder kopieren). `urgency` ist
   eine Eigenschaft des Platzes — und dieser Platz ist eine Auskunft, keine Absage.

**F-7 ist damit geschlossen.** Was offen bleibt, ist keine Frage an mich: ob die innere Rolle nach
dem Umbau ersatzlos fällt oder ob die Kopier-Rückmeldung eine eigene, dauerhafte Fläche außerhalb
der Meldung bekommt, ist ein Zuschnitt für den Auftrag von Bündel 2 — beide Wege erfüllen Punkt 1,
und der Wortlaut gehört ux-designer.

---

# 10. Nachtrag T-218 (Welle AG) — Regel U-5: ein Bedienelement ist auch ein Fach

**Vorlage:** Board O-IH; die Entscheidung selbst steht in `docs/design/traeger-und-zusage.md`
Abschnitt 11 und wird hier **nicht** wiederholt. Was hierher gehört, ist die eine Zeile, um die
Abschnitt 4.1 dieses Papiers dadurch wächst.

**Der Anlass in drei Sätzen.** In `ExportGroups.tsx` stehen an einer Stelle zwei verschiedene
Bausteine, umgeschaltet von dem Wert, den der Dialog einträgt, den dieser Knopf öffnet. Beim
Gelingen wird der auslösende Knopf deshalb nicht umbeschriftet, sondern **ersetzt** — und der
Fokusrückweg des Dialogs zielt auf einen Knoten, den es nicht mehr gibt. Entschieden ist: ein
Baustein mit zwei Beschriftungen.

**Warum das hier steht und nicht nur dort.** Abschnitt 4.1 nennt drei Bauformen — B1 Ersetzen im
festen Fach, B2 reserviertes Fach, B3 Anhängen unterhalb — und Regel U-1 stellt sie in die
Rangfolge B1 vor B2 vor B3. Diese Regeln sind für **Text** geschrieben worden: für die Frage, wo
eine Auskunft erscheint, ohne dass die Fläche springt. Der Fall aus O-IH zeigt, dass sie eine Stufe
weiter tragen, und dass die fehlende Stufe etwas gekostet hat.

> **Regel U-5 — ein Bedienelement ist auch ein Fach.** Wechselt an einer Stelle nicht der Text,
> sondern die Beschriftung eines Knopfes, so gilt B1 unverändert: **ein** Baustein, dessen
> Beschriftung, Sinnbild und Ausprägung sich mit dem Zustand ändern dürfen — nicht zwei Bausteine,
> zwischen denen umgeschaltet wird. Der Grund ist bei Text die ruhige Fläche; bei einem
> Bedienelement kommt ein zweiter dazu, und er wiegt schwerer: **Ein Knopf ist das Rückkehrziel des
> Dialogs, den er öffnet.** Ein ausgetauschter Baustein ist ein neuer Knoten, und ein Fokus auf
> einen alten Knoten ist gar keiner.

**Drei Erläuterungen, damit die Regel nicht zu weit gelesen wird.**

1. **Sie verbietet keine Bedingung im Bau.** Verdächtig ist erst die Verbindung dreier Merkmale:
   zwei **verschiedene** Bausteinarten an einer Stelle, eine Bedingung, die sich ändert, **während
   die Fläche steht**, und ein Zweig, der einen Dialog oder ein Menü öffnet. Fehlt eines, ist die
   Form harmlos — die Prüftabelle über die drei Stellen im Bestand steht in
   `traeger-und-zusage.md` 11.6, Regel R-6.
2. **Der Baustein bleibt, die Eigenschaften dürfen wechseln.** `Timer.tsx:124-131` zeigt die Form
   seit langem richtig: ein Knoten, an dem `icon` und `variant` mit dem laufenden Zustand wechseln.
   Wer aus „ein Baustein" ableitet, dass auch das Aussehen unverändert bleiben müsse, hat die Regel
   umgedreht.
3. **Sie kennt einen Ausgang, und zwar genau einen.** Verschwindet das Bedienelement zu Recht — die
   Zeile wird entfernt —, greift nicht U-5, sondern die Ersatzkette R-2 aus `traeger-und-zusage.md`
   11.6, und der Ersatz wird an der **aufrufenden** Fläche benannt. Was es nicht gibt, ist der
   stille dritte Weg: austauschen und niemanden benennen.

**Was das an Abschnitt 4.1 ändert.** Nichts an B1 bis B3 und nichts an U-1 bis U-4 — U-5 tritt
daneben und macht denselben Gedanken für Bedienelemente gültig. **Regel U-3** („keine
Höhenanimation") bekommt dabei einen Satz dazu, der aus demselben Fall stammt: **Auch die
Beschriftung eines Knopfes wird nicht übergeblendet.** Ein Text, der verblasst, ist unlesbar in
genau dem Augenblick, in dem er gelesen wird — und beim Wechsel einer Knopfbeschriftung steht dort
zusätzlich der Fokusring eines Benutzers, der gerade zurückgekehrt ist.

---

# 11. Nachtrag T-236 (Welle AL) — was eine Auswahl zeigt, die keinen Wert hat

**Vorlage:** Board O-KI, erste Hälfte, vom Orchestrator entschieden; `.claude/team/reports/T-228-ux-designer.md`
Frage 3; `docs/design/textbestand.md` S-06 samt Nachtrag T-228 (fremde Hoheit, hier nur gelesen);
E-078.

**Die Frage, wie sie gestellt war:** `Select.tsx` trägt als **Vorgabewert** den Platzhalter
„Bitte wählen". Das ist nach S-06 eine **Anweisung** und damit weder Beispiel noch Form. Weil es
ein Vorgabewert ist, steht der Satz an **jeder** Auswahl ohne eigenen Platzhalter — nicht nur an
der einen, an der er aufgefallen ist. Der Ersatz ist eine Gestaltfrage.

## 11.1 Zuerst gezählt, dann entschieden (E-087)

Gemessen 2026-09-06 über den Wortlaut `<Select` im Arbeitsbaum, `.gitignore` beachtet — also über
versionierte **und** unversionierte Quelldateien, Bauergebnisse ausgeschlossen. Dieselbe Grenze wie
in `traeger-und-zusage.md` 14.1: die **Vereinigung** ist gemessen, die Differenz der beiden Wege
nicht, weil in dieser Sitzung keine Schale zur Verfügung stand.

| | Zahl |
|---|---:|
| Aufrufstellen von `Select` in `apps/web/src` | **31** |
| davon in Ansichten und Bausteinen | 19 |
| davon auf der Musterseite (`showcase/`) | 12 |
| **mit dem Vorgabewert „Bitte wählen"** | **30** |
| mit eigenem Platzhalter | **1** — `showcase/ControlsSection.tsx:206`, „Nichts zur Auswahl" |
| gleichartige Bausteine im Add-in oder in der Hülle | **0** — es gibt `Select` nur einmal |

**Und eine zweite Zählung, die wichtiger ist als die erste: an wie vielen Stellen ist der Satz
überhaupt _zu sehen_?** Er erscheint nur, wenn der gesetzte Wert in der Liste **nicht vorkommt**.
Die meisten Auswahlflächen führen dafür eine eigene Option — `{ value: "", label: "Alle Pools" }`,
„Jeder Status", „Jede Frist", „Wurzelebene", „Alle Läufe". Dort ist er unerreichbar. Gelesen habe
ich alle 31 Aufrufstellen; **erreichbar ist er an vieren**, und die zwei wichtigsten sind keine
Ladezustände:

| Stelle | Wann sichtbar | Art |
|---|---|---|
| `ExportScreen.tsx:670` „Exportvorlage" | `activeTemplateId` ist `null` — der Zustand **frisch installiert**, in dem die mitgelieferte Standardvorlage gilt. Die Liste führt dafür **keine** Option | **dauerhaft** |
| `TodoFormDialog.tsx:247` „Status" | `statusId` ist `""`; die Liste führt nur die vorhandenen Status. Der Zustand ist speicherbar (`statusId: null`, `:103`) und über die Auswahl **nicht wieder erreichbar** | **dauerhaft** |
| `SettingsScreen.tsx:449` „Aktive Exportvorlage" | solange die Vorlagenliste lädt und die gespeicherte Kennung noch nicht darin steht | vorübergehend |
| `TemplateFields.tsx:374, 389, 586, 594` | solange der Katalog nicht geladen ist | vorübergehend |

*Diese zweite Tabelle ist am Quelltext **gelesen**, nicht im Browser gemessen — sie folgt aus dem
Verhältnis zwischen `value` und `options` an jeder Stelle. Was ein Ladezustand tatsächlich wie lange
zeigt, ist damit nicht gemessen.*

**Die dritte Zählung, weil hier ein Oberflächentext gestrichen wird (E-087):** Der Wortlaut
„Bitte wählen" kommt in `tests/**` und `apps/*/test/**` **null** mal als Platzhalter der Auswahl
vor. Drei Treffer gibt es, alle drei in `apps/web/test/lib/errorText.test.ts:137, 218, 330`, und
alle drei gehören zu einem **anderen** Satz: „Dieser Tagname kommt in mehreren Ordnern vor. Bitte
wählen Sie das gemeinte Tag ausdrücklich aus." — eine Absage des Dienstes aus
`apps/local-api/src/usecases/tag-names.ts:176`, von dieser Entscheidung **nicht** berührt. Wer nach
dem Wortlaut sucht, findet also drei Stellen, von denen keine gemeint ist; das gehört in den
Auftrag, damit niemand sie mitändert.

## 11.2 Die Entscheidung — ein Ersatz für alle, und er ist kein Platzhalter

> **Es ist gar kein Platzhalter, und daran hängt der Ersatz.** Ein Platzhalter im Sinn von S-06
> steht in einem Feld, in das getippt wird, und gibt ein **Beispiel** für das, was dort hingehört.
> Eine Auswahl hat nichts zu tippen. Der Text steht im **Auslöser** und ist das einzige Sichtbare
> einer Auswahl ohne Wert — er ist eine **Zustandsanzeige**, die nur zufällig über eine Eigenschaft
> namens `placeholder` hineinkommt. Deshalb ist er nicht nach der Platzhalterregel zu beurteilen,
> sondern nach der Regel für Leerzustände: **den Zustand benennen, nicht zum Handeln auffordern.**

> **Wortlaut: „Nichts gewählt". Einer für alle.**

**Fünf Gründe, in Rangfolge:**

1. **Er ist kein neuer Text.** Das Produkt schreibt „Nichts gewählt" schon dreimal, und zwar für
   genau diesen Zustand: `showcase/RuleSection.tsx:495` und `:510` und
   `screens/PoolFormDialog.tsx:664` („Nichts gewählt heißt „Alle" — schränkt nicht ein"), dazu der
   Kommentar in `components/RulePickers.tsx:308`. Ein vorhandenes Wort zu nehmen ist nach E-078
   besser, als ein gleichbedeutendes danebenzustellen.
2. **Er sagt, was ist, statt zu verlangen, was sein soll.** „Bitte wählen" behauptet eine Pflicht,
   die an mindestens zwei der vier Stellen gar nicht besteht — der leere Status ist speicherbar, die
   leere Vorlage ist die gültige Voreinstellung.
3. **Die Gestalt trägt den Rest schon.** `.select__trigger[data-placeholder-shown] .select__value`
   setzt `--text-muted` (`components.css:1705-1709`), und der Kommentar dort sagt es wörtlich: „der
   liest sich wie einer, nicht wie ein Wert". Der Text muß also **nicht** zusätzlich signalisieren,
   daß er kein Wert ist. Er muß nur den Zustand benennen. Das ist der Grund, aus dem eine Alternative
   wie „—" ausscheidet: Sie verläßt sich auf die Farbe allein und sagt in der Ansage gar nichts.
4. **Er ist auch angesagt richtig.** Der zugängliche Name kommt von `Ark.Label` und ist Pflicht
   (`Select.tsx:185-187`); der Auslöser sagt danach seinen Inhalt. „Status, Nichts gewählt" ist eine
   Zustandsauskunft. „Status, Bitte wählen" ist eine Aufforderung an der Stelle, an der ein Wert
   erwartet wird.
5. **Er hält S-06 ein, auch wenn er nicht darunter fällt:** keine Anweisung, keine Anrede, keine
   Wiederholung der Beschriftung, 14 Zeichen von höchstens 40.

**Verworfen, mit Grund:**

| Fassung | Warum nicht |
|---|---|
| „Keine Auswahl" | Zweideutig — es kann heißen „nichts gewählt" oder „es steht nichts zur Wahl". Der zweite Fall hat in `ControlsSection.tsx:206` bereits einen eigenen Text |
| „—" oder leer | Verläßt sich auf `--text-muted` allein, sagt in der Ansage nichts, und ein leerer Auslöser liest sich als kaputtes Bedienelement |
| je Fläche ein eigener Text | Siehe 11.3: Wo die Fläche wirklich etwas Eigenes zu sagen hat, ist der Platzhalter das falsche Mittel |

## 11.3 Die Regel dahinter — und warum es trotzdem nur **einen** Text gibt

> **Regel G-1.** Der Vorgabetext einer Auswahl ohne Wert **benennt den Zustand** („Nichts gewählt").
> Hat der leere Wert an einer Fläche eine **Bedeutung**, bekommt er dort keinen eigenen Text im
> Auslöser, sondern eine **eigene Option mit Namen**. Ein Text, der einen benannten Wert vertritt,
> ist eine Lücke im Vorrat und keine Gestaltfrage. Steht überhaupt nichts zur Wahl, ist das ein
> dritter Zustand mit eigenem Text an der Fläche.

Drei Fälle, ein Rangordnung, und alle drei kommen im Bestand vor:

1. **Der leere Wert ist wirklich leer** → Vorgabetext „Nichts gewählt". `TodoFormDialog.tsx:247`
   ist heute dieser Fall.
2. **Der leere Wert hat einen Namen** → er gehört als Option in die Liste, und der Vorgabetext wird
   dort nie sichtbar. `SettingsScreen.tsx:451` macht es richtig vor:
   `{ value: "", label: "Mitgelieferte Standardvorlage" }`. **`ExportScreen.tsx:672-681` macht es
   nicht** — dieselbe Wahl, dieselbe Bedeutung, eine Ansicht weiter, und dort steht im Zustand
   „frisch installiert" heute eine Aufforderung, wo eine Ansicht daneben einen Namen dafür hat.
   Das ist der eine Punkt dieser Aufgabe, der nicht nur ein Wort ist.
3. **Es steht nichts zur Wahl** → eigener Text an der Fläche, wie `ControlsSection.tsx:206`
   („Nichts zur Auswahl"). Der Unterschied zu (1) ist nicht Feinheit: Im einen Fall kann der
   Benutzer wählen und hat es nicht getan, im anderen kann er nicht.

**Was ich ausdrücklich nicht entschieden habe.** Ob `TodoFormDialog` den Zustand „kein Status"
überhaupt anbieten soll — heute ist er speicherbar, aber über die Auswahl nicht wiederherstellbar.
Das ist eine **fachliche** Frage an die Spezifikation, keine gestalterische, und sie wird durch den
neuen Text weder besser noch schlechter. Sie steht als offene Frage im Bericht, nicht als
stillschweigende Annahme hier.
