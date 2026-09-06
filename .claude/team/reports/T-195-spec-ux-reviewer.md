# T-195 — Drei Reste, fünf Textträger, vier Streichungen drüben

**Rolle:** spec-ux-reviewer **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `docs/spec.md`, `docs/design/textbestand.md` (T-163 mit Nachtrag T-180),
`docs/design/textbestand-aufgabenbereich.md` (T-182), `docs/design/textabbau-gestalt.md` (T-171),
`.claude/team/reports/T-165-spec-ux-reviewer.md`, `T-177-spec-ux-reviewer.md`,
`T-184-spec-ux-reviewer.md`, `T-186-frontend-dev.md`, `T-189-security-checker.md` samt Nachträgen,
`.claude/team/board.md`, `CLAUDE.md` (Abschnitt „Text streichen und umbenennen", E-087).

**Jede Zeilenangabe in diesem Bericht ist am Baum vom 2026-09-06 gemessen**, nicht aus T-163,
T-180, T-182 oder aus meinem eigenen T-184 übernommen. Das ist E-087, auf mich selbst angewandt:
An vier Stellen weicht der heutige Wortlaut oder die heutige Fundstelle von dem ab, was das
vorlegende Papier nennt, und an **einer** davon kippt daran ein Urteil (Z-43).

---

## Kurzfassung

```
Aufgabe: T-195 — O-EZ (die drei nicht beurteilten Reste), O-FG (fünf Textträger),
         O-GG (vier Streichungen im Aufgabenbereich)
Status: braucht Review (sieben Freigaben, drei Ablehnungen, zwei blockierende Auflagen)
```

**Blockierend: Z-43 und Z-45.** Beide sind derselbe Typ: Ein Auftrag, der für sich richtig
aussieht, nimmt entweder einen fremden Prüffall mit ins Rote (Z-43) oder führt die eine Hälfte
einer Freigabe aus und schreibt die andere still in eine Sperre um (Z-45).

**Dreimal „noch nicht":** UM-08 (Z-34), die SP-09-Kürzung (Z-35) und — als Teil von Z-43 —
ST-A-05, solange e2e-tester und ui-designer nicht danebenstehen.

---

## 0. Urteil in einer Tabelle

| Gegenstand | Urteil |
|---|---|
| **O-EZ** UM-08 — Karte „Was sich geändert hat" | **noch nicht** — Z-34. Der Handbuchabsatz steht nach wie vor nicht |
| **O-EZ** SP-09-Kürzung | **noch nicht** — Z-35. Ein Grund ist entfallen, **zwei** stehen |
| **O-EZ** ST-03 sechster Eintrag (`ExportAudit.tsx:170`) | **freigegeben, und die Auflage aus Z-32 ist erledigt** — Z-36 |
| **O-FG** `app/useUpdateNotice.ts` | **B, bleibt — ein Satz fällt** — Z-37, freigegeben |
| **O-FG** `app/connection.ts` | **A/B, bleibt** — Z-38, mit der Auflage aus Z-29 und einer berichtigten Zahl |
| **O-FG** `lib/exportTemplateModel.ts` | **B — Sperrliste, kein Kürzungsspielraum** — Z-39 |
| **O-FG** `lib/attachmentLabel.ts` | **vom Textdurchgang ausgenommen** — Z-40 |
| **O-FG** `lib/poolRule.ts` | **Sperrliste** — Z-41. Der einzige der fünf, den niemand beurteilt hatte |
| **O-GG** ST-A-03 | **freigegeben** — Z-42 |
| **O-GG** ST-A-05 | **in der Sache ja, in der Bauform nein** — **Z-43, blockierend** |
| **O-GG** ST-A-06 | **freigegeben mit einer Auflage** — Z-44 |
| **O-GG** ST-A-08 | **freigegeben — mit einer blockierenden Auflage** — **Z-45** |
| **O-GG** Was ohne ui-designer geht | drei von vieren gehen, ST-A-05 nicht — Z-46 |

---

## 1. O-EZ — die drei Reste, einzeln

T-184 Abschnitt 4.7 hat drei Einträge ausdrücklich nicht beurteilt: **UM-08**, die
**SP-09-Kürzung** und **ST-03 Zeile `labels.ts:438`** (letztere zunächst als „erledigt
nachgemessen" und in 8.2 als „nicht vollständig" berichtigt). Alle drei kommen hier einzeln.

### 1.1 Z-34 — UM-08: **noch nicht**, und der Grund ist unverändert derselbe

**Gemessen, nicht geschlossen.**

| Was | Wo heute | Stand |
|---|---|---|
| Die Karte | `apps/web/src/screens/BoardScreen.tsx:1021-1054` (T-180 nennt `:975-1008`) | steht unverändert |
| Der Handbuchabsatz | `docs/benutzerhandbuch.md` | **steht nicht** |

Der Abschnitt „Mit dem Kanban-Board arbeiten" (`docs/benutzerhandbuch.md:217-252`) trägt heute
„Wie eine Karte auf eine Spalte kommt" (`:219-233`) und „Eine Spalte anlegen, umbenennen oder
ändern" (`:235-246`). Beide erklären den **heutigen** Zustand. Kein Satz spricht die Herkunft der
Spalten aus, und die Suche nach dem tragenden Wort ist leer: `vollzählig` kommt in
`docs/benutzerhandbuch.md` **nicht** vor (Treffer im Repository allein in `docs/design/**` und in
Berichten).

**Damit gilt T-180s eigene Reihenfolge unverändert** (`textbestand.md:1193-1194`, bindend über
E-081 Punkt 4): *„Der Absatz steht im Handbuch, **bevor** die Karte aus `BoardScreen.tsx`
verschwindet."* Eine Freigabe von mir wäre heute die Freigabe einer Streichung, deren Ausgleich
niemand geschrieben hat — genau das, was ich in Z-23b, Z-31 und in diesem Bericht in Z-45 anderen
untersage.

**Was ich statt dessen liefere, damit die nächste Runde ein Schritt ist und nicht zwei.** Drei
Angaben aus T-180, die heute nachzumessen waren, und alle drei haben sich bewegt:

**(a) Der Verweisteil wird getragen — aber nicht mit dem Wortlaut, den T-180 nennt.**
`textbestand.md:1176` sagt: *„Verweisteil steht nach ST-05 in `TodoFormDialog.tsx:235`"*, und
ST-05 hatte dafür „Welche Werte es gibt: Einstellungen › Status." vorgeschlagen
(`textbestand.md:838`). Gesucht: **kein Treffer** in `apps/web/src`. Gebaut ist statt dessen
`apps/web/src/screens/TodoFormDialog.tsx:250`:

```
hint="Die Werte stehen in den Einstellungen unter „Status“."
```

Der Kommentar darüber (`:230-244`) begründet den Unterschied ausdrücklich: die Pfeilschreibweise
ist nicht die Sprache des Produkts, *„Das Produkt schreibt den Weg aus, und zwar so, wie es ihn an
vier Stellen schon schreibt"*. **Das ist besser als der Vorschlag, und es ändert an UM-08 nichts
in der Sache** — der Verweisteil des Punktes „Der Status bleibt." wird getragen. Es ändert aber
den Auftrag: Wer UM-08 baut und dabei nach dem Satz aus `textbestand.md:838` sucht, findet ihn
nicht und hält den Ausgleich für fehlend.

**(b) Der zweite Knopf ist heute wörtlich derselbe Aufruf.** `BoardScreen.tsx:1015` (Aktion des
Leerzustands) und `:1047` (Knopf **in** der Karte) rufen beide `onOpenSetup` und tragen beide
„Erste Spalte einrichten". T-180 nannte das **D**; heute ist es nicht nur dieselbe Aussage,
sondern dieselbe Handlung, drei Zeilen auseinander. Der Befund ist seit T-186 schärfer geworden,
nicht schwächer: T-186 hat `onCreate` zu `onOpenSetup` gemacht und damit die zwei Wege
gleichgezogen.

**(c) E-087, gemessen, mit einer Falle darin.** Keiner der vier Kartenpunkte, weder
„Was sich geändert hat" noch „Zur Todo-Liste", kommt in `tests/**` oder `apps/*/test/**` vor.
**Aber**: die Zeichenkette `Der Status bleibt` hat einen Treffer —
`tests/e2e/done-movement-announcement.spec.ts:29` und `:62` halten

```
'Der Status bleibt unverändert — Erledigt und Status sind zwei getrennte Größen.'
```

Das ist ein **anderer** Satz, aus dem Toast der Todo-Liste, und er hat mit der Karte nichts zu
tun. Wer die Karte mit einer Suchen-und-Ersetzen-Bewegung über „Der Status bleibt" entfernt, faßt
ihn an. Der Auftrag nennt deshalb die vier Punkte über ihre **Zeilen**, nicht über ihre Anfänge.

**Urteil: noch nicht.** Wie in T-184: Ich habe den Eintrag gelesen und sehe keinen Einwand, der
ihn umwerfen würde — **das ist keine Freigabe.** Vorzulegen, sobald der Absatz im Handbuch steht;
dann in einem Auftrag mit frontend-dev (E-081 Punkt 4, O-FE auf dem Board sagt es bereits so).

### 1.2 Z-35 — die SP-09-Kürzung: **noch nicht**, und von zwei Gründen ist einer entfallen

T-184 hat zwei Gründe genannt. Der Auftrag zu dieser Aufgabe sagt, beide seien „teils entfallen".
Gemessen ist das für einen richtig und für den anderen nicht.

**Grund 1 — der Baustein war in Nacharbeit: entfallen, bestätigt.**
`apps/web/src/components/NoteField.tsx:197-204` trägt heute die Bauart aus Z-19b:

```tsx
<div className="note__live" role="alert">
  {error === undefined ? null : (
    <p className="note__error" id={errorId}> … </p>
  )}
</div>
```

Der Kommentar darüber (`:178-196`) nennt T-186 und den Befund O-FX, nennt die drei Vorbilder
(`FormDialog#TextField`, `ConfirmDialog`, `outlook-addin/src/ui/field.ts`) **und** sagt von sich
aus, was noch fehlt: *„gemessen wird sie an `TextField` … für dieses Feld steht die Messung aus"*.
Das ist die Form, die E-087 verlangt — eine Zusicherung, die ihre eigene Lücke benennt, statt sie
zu überspielen. Z-19b ist damit für meine Zwecke geschlossen.

**Grund 2 — security-checker fehlt: nicht entfallen.**
`textbestand.md:1269` schreibt für diesen Eintrag zwei Prüfer vor: *„spec-ux-reviewer **und**
security-checker"*. Ich habe das ganze Repository nach `SP-09` durchsucht. Treffer stehen in
`docs/design/textbestand.md` (drei), in `.claude/team/board.md`, in meinen eigenen Berichten
T-177/T-184 und in T-181. **In keinem Bericht von security-checker steht `SP-09`, `NoteField` oder
die Kürzung.** T-189/3 (`.claude/team/reports/T-189-security-checker.md:481-625`) trägt die
Überschrift „A-A-46, A-A-47, A-A-48 nachgemessen: der Wächter ist zu" und behandelt den
Codepunkt-Wächter in Rust — neunzehn Formen, neun Kunstquellen, keine Zeile zu SP-09. Die Abnahme
ist erteilt, aber sie gilt einem anderen Gegenstand.

Eine Freigabe von mir allein wäre die halbe. SP-09 trägt **E-016, R-06 und R-08** — die Grenze
zwischen dem, was in die Abrechnung geht, und dem, was in Takt bleibt. Über sie zu entscheiden,
ohne daß der Prüfer danebensteht, der sie verlangt hat, ist genau das, was E-078 Punkt 3 verbietet.

**Grund 3 — und der ist meiner und neu: es gibt nichts vorzulegen.**
`textbestand.md:1255-1256` sagt für diese ganze Welle: *„Vorzulegen ist jeweils die **neue
Fassung**, nicht die Absicht."* Der Eintrag selbst lautet „**SP-09 Kürzung** `NoteField.tsx:50`
**(falls gewollt)**". Niemand hat je einen Wortlaut geschrieben. Ich kann einen Text nicht
freigeben, der nicht existiert — und ihn selbst zu verfassen hieße, ihn zu verfassen und zugleich
zu genehmigen (dieselbe Grenze wie in Z-27).

**Damit die nächste Runde ein Schritt ist, hier die Messung und die Bedingung.**

Heute (`NoteField.tsx:50`, Feldart `billing`):

```
Wird beim Export an das Abrechnungstool übertragen und steht dort auf der
Rechnung des Kunden. Standardvorlage: Feld „Notiz“.
```

**131 Zeichen, zwei Sätze, dauerhaft sichtbar.** Regel S-05 setzt für dauerhaft sichtbare Hinweise
**80 Zeichen**. Der Kürzungswunsch hat also einen Grund, und ich sage das ausdrücklich, damit
niemand meine Ablehnung für eine Ablehnung in der Sache hält.

**Drei Bedingungen, unter denen ich zustimmen könnte** — sie sind meine Vorgabe an den, der die
Fassung schreibt, nicht meine Fassung:

1. **`NoteField.tsx:58` bleibt zeichengleich.** Der interne Hinweis („Bleibt in Takt. Wird nie
   exportiert — auch nicht über eine eigene Exportvorlage.") ist **G-8 aus T-165**, dort mit
   Begründung gesperrt: der Nachsatz beantwortet den einzigen echten Zweifel, weil die Vorlagen
   konfigurierbar **sind**. Er ist nicht Gegenstand dieses Eintrags und wird es nicht nebenbei.
2. **Der Empfänger bleibt im Satz.** „steht dort auf der Rechnung des Kunden" ist das sechste der
   sechs Unterscheidungsmerkmale, die der Dateikopf aufzählt (`NoteField.tsx:27`: *„Fußnote —
   nennt Ziel und Empfänger"*). Ein Hinweis, der nur noch „Wird exportiert." sagt, ist mit der
   Marke daneben (`:49` `markLabel: "Wird exportiert"`) wortgleich — dann ist die Kürzung eine
   Verdopplung und kein Gewinn.
3. **„Standardvorlage: Feld „Notiz“."** darf fallen, wenn und nur wenn jemand mißt, daß dieselbe
   Zuordnung im Vorlageneditor sichtbar ist. Sie ist heute die einzige Stelle, an der die
   Oberfläche den Schlüssel des Abrechnungstools an dem Feld nennt, das ihn füllt (A-8.2).

**E-087, schon gemacht:** Weder „auf der Rechnung des Kunden" noch „Standardvorlage: Feld" noch
„auch nicht über eine eigene Exportvorlage" kommt in `tests/**` oder `apps/*/test/**` vor.
Gemessen heute. Das nimmt dem Auftrag eine Sorge, nicht die Vorlage.

### 1.3 Z-36 — ST-03, sechster Eintrag: **freigegeben**, und die Auflage aus Z-32 ist erledigt

**Der Stand von ST-03, heute gemessen** (Suche nach `(E-047)`, `(E-054)`, `(E-055)`, „Maßnahme
gegen R-10" im sichtbaren Text von `apps/web/src`, ohne `showcase/**`):

| Eintrag | Ort | Stand |
|---|---|---|
| `TagsScreen.tsx:79` „(E-054)" | — | **gefallen** |
| `TagsScreen.tsx:612` „(E-054)" | — | **gefallen** (mit ST-05) |
| `TodoDetailScreen.tsx:580` „(E-055)" | — | **gefallen** |
| `ExportAuditScreen.tsx:173-174` Karte / „Maßnahme gegen R-10" | — | **gefallen** |
| `labels.ts:438` „(E-047)" | — | **gefallen**, der Satz steht (SP-15 unberührt) |
| **`ExportAudit.tsx:170` „(E-047)"** | `apps/web/src/components/ExportAudit.tsx:170` | **steht** |

Der sechste, wörtlich:

```
Ohne Begründung ausgebucht. Das Feld ist freiwillig (E-047) — protokolliert ist
trotzdem, dass hier jemand Zeit ohne Abrechnung abgehakt hat, und wann.
```

**Freigegeben: „(E-047)" fällt, der Satz bleibt zeichengleich.** Begründung wie bei den fünf
davor — S-19, die Kennung sagt dem Benutzer nichts, und der Satz selbst ist **A** (er spricht die
Abwesenheit einer Begründung aus) und bleibt deshalb.

**Und die Auflage aus Z-32 ist erledigt, bevor der Auftrag läuft.** T-184 hatte verlangt, dieser
eine Eintrag gehe **zusammen mit e2e-tester**, weil `export-mixed-status-and-billing.spec.ts` ihn
zeichengleich hielt. Gemessen heute (`tests/e2e/export-mixed-status-and-billing.spec.ts:127-134`):

```
// O-GJ (T-187, E-087): Der Substring endet bewusst vor der internen
// Kennung „(E-047)" — sie steht heute noch im Oberflächentext, soll aber
// aus ihm verschwinden (frontend-dev, gleiche Welle). Dieser Vergleich
// erfüllt beides, den heutigen Wortlaut **und** den geplanten ohne
// Kennung, und hängt damit an keiner internen Kennung mehr.
await expect(…).toContainText('Ohne Begründung ausgebucht. Das Feld ist freiwillig');
```

e2e-tester hat den Prüffall so umgestellt, daß er **beide** Wortlaute trägt, und hat den Grund
danebengeschrieben. **Damit geht ST-03 Zeile sechs jetzt bei frontend-dev allein**, und der
gemeinsame Auftrag, den ich in T-184 verlangt habe, ist nicht mehr nötig.

Das ist der erste Fall in diesem Projekt, in dem E-087 vorwärts gewirkt hat statt rückwärts: Der
Prüffall wurde für die Änderung vorbereitet, statt von ihr überrascht zu werden. Ich halte es
fest, weil es die Form ist, die ich mir für die nächsten Streichungen wünsche.

---

## 2. O-FG — die fünf Textträger, jeder mit einem Urteil

Alle fünf sind seit T-180 Abschnitt 1.2 „aufgenommen und **vorläufig gesperrt**". Vier davon hat
T-184 Abschnitt 5 in der Sache bereits beurteilt; hier stehen die Urteile als Urteile, mit heute
gemessenen Fundstellen. Der fünfte — `lib/poolRule.ts` — ist der, den niemand beurteilt hat.

### 2.1 Z-37 — `app/useUpdateNotice.ts`: **B, bleibt. Ein Satz fällt.**

**Heute** (`apps/web/src/app/useUpdateNotice.ts:249-252`, Zweig `rejected`):

```
Die gemeldete Fassungsbezeichnung hat die Prüfung der Anwendung nicht bestanden.
Takt öffnet dafür keine Seite.
Die Release-Seite lässt sich über den angezeigten Verweis von Hand aufrufen.
```

Der dritte Satz **fällt**. Freigegeben; die Begründung steht in T-184 Z-30 und ist unverändert
gültig: Der angezeigte Verweis ist `releasePageUrl(notice.version)` (`:227`) — **dieselbe**
Fassungsbezeichnung, die die Hülle soeben abgewiesen hat, eingesetzt in dieselbe fest hinterlegte
Adresse. Der Satz schickt den Benutzer von Hand an der letzten Kontrolle vorbei, und zwar auf eine
Seite, die es nicht gibt.

**Was T-184 nicht gesagt hat und was dieser Freigabe erst ihre Schärfe gibt: der Nachbarzweig sagt
fast dasselbe und hat recht damit.**

| Zweig | Zeile | Schlußsatz | Trägt er? |
|---|---|---|---|
| `rejected` | `:251` | „Die Release-Seite lässt sich über den angezeigten Verweis von Hand aufrufen." | **nein** — die Formprüfung hat abgewiesen, die Adresse führt ins Leere |
| `failed` | `:256` | „der angezeigte Verweis führt von Hand zum selben Ziel" | **ja** — die Form war in Ordnung, es fehlt nur der Browser |

Zwei Sätze, die sich lesen wie Geschwister, und genau einer von beiden ist wahr. **Deshalb ist
diese Freigabe eng: `:256` bleibt zeichengleich.** Wer den Auftrag als „die Verweisempfehlung
fällt" liest statt als „der dritte Satz aus `:251` fällt", nimmt dem einzigen Zweig, in dem die
Empfehlung stimmt, seinen Ausweg — und `failed` ist der Zweig, der einen Benutzer wirklich
erreichen kann.

**Der Rest der Datei bleibt.** `:245-246` (Toast nach „Installieren", **A** zu A-18.9, Geschwister
von SP-12), `:280-281` (Toast nach „Überspringen", **A** zu A-18.10) und die beiden ersten Sätze
aus `:251` (**B** — sie sind in diesem Zustand die einzige Auskunft). Der angezeigte Verweis
selbst bleibt ebenfalls: A-18.6 verlangt ihn, und er ist Text und kein Knopf.

**E-087:** Weder „von Hand aufzurufen" noch „Prüfung der Anwendung nicht bestanden" kommt in
`tests/**` oder `apps/*/test/**` vor. Gemessen heute. frontend-dev geht allein.

**Und der Grund, aus dem der Zweig trotzdem nicht gleichgültig ist.** Er ist heute unerreichbar,
weil `VERSION_SHAPE` (`packages/domain/src/version.ts:91`) und `is_release_version`
(`apps/desktop/src-tauri/src/release.rs:70-71`) dieselbe Form tragen. **Nichts mißt das.** Ich
habe die Skripte nachgesehen: `package.json:22-40` führt achtzehn `proof:`-Läufe, und **keiner**
davon ist eine Gleichlaufmessung zwischen Hülle und Domäne — weder für die Fassungen (Z-33) noch
für die Anhänge (E-085). Die Aussage, um die in T-184 Abschnitt 8.3 gebeten und die dort gegeben
wurde („**Gleichheit**, jede Abweichung in beide Richtungen ein Fehler"), steht weiterhin ohne
Lauf. Das ist kein Befund dieser Aufgabe, aber es ist die Bedingung, unter der Z-37 harmlos ist:
Solange niemand mißt, ist „unerreichbar" eine Zusicherung.

### 2.2 Z-38 — `app/connection.ts`: **A/B, bleibt** — und meine eigene Zahl war zu klein

**Sechs Sätze, heute gemessen:** `:142`, `:245`, `:293`, `:327`, `:345`, `:397`. Alle sechs sagen,
was **ohne Anwendungshülle nicht geht** (**A**) oder begründen eine Absage (**B**). **Sie
bleiben.** Kein Kürzungsvorschlag.

**Die Auflage aus Z-29 steht und ist unumgesetzt.** Der Kopfkommentar (`connection.ts:1-24`) trägt
heute keine Zeile darüber, daß diese sechs Sätze in der ausgelieferten Fassung keinen Benutzer
erreichen (`App.tsx` ersetzt bei `no_shell` die ganze Fläche, SP-20; der Entwicklungszweig fällt
mit `import.meta.env.DEV` weg). Die Auflage bleibt wörtlich: **keiner dieser sechs Sätze darf je
als Träger einer Aussage gezählt werden**, und das gehört als Zeile in den Kopf der Datei.

**Und jetzt die Berichtigung an mir selbst.** T-184 Z-29 (a) schrieb: „Derselbe Satz steht auch in
`apps/desktop/src/shell.ts` — dreimal zeichengleich (`:379`, `:483`, `:530`) und einmal als fünfte
Fassung (`:239`)". **Heute nachgezählt sind es vier Paare, nicht drei:**

| Paar | `connection.ts` | `shell.ts` | von einer Zusage gedeckt? |
|---|---|---|---|
| Release-Seite | `:293` | `:483` | **nein** |
| Ordnerauswahl | `:327` | `:379` | **nein** |
| Anhänge | `:345` | `:530` | ja — `connection.ts:338-345` |
| **Dateiauswahl** | **`:397`** | **`:623`** | **nein** |
| allgemein (fünfte Fassung) | — | `:239` | — |

`shell.ts:623` hat in meiner Zählung gefehlt. **Von vier zeichengleichen Paaren ist genau eines
von einem Kommentar zusammengehalten, drei von gar nichts** — und der Kommentar, der das eine
deckt, sagt von sich selbst „Zwei Lagen, eine Auskunft", also genau die Zusicherung, gegen die
E-087 gerichtet ist.

Das ist die zweite Zahl, die ich in zwei Aufgaben an mir selbst berichtige (nach den fünf gegen
sechs Kennungen in S-19). Beide Male in dieselbe Richtung: **zu wenig gezählt.** Ich halte das als
Eigenschaft fest, nicht als Zufall — wer eine Liste aus einem Papier übernimmt und nur
stichprobenweise nachmißt, findet die Stellen nicht, die das Papier nie hatte.

### 2.3 Z-39 — `lib/exportTemplateModel.ts`: **B — auf die Sperrliste**

**Sechs Sätze, heute gemessen:** `:449`, `:457`, `:464`, `:475`, `:486`, `:509`. Jeder nennt
**eine** Abweichung der gewählten Vorlage gegen die Standardvorlage, jeder mit Feldnamen, jeder
zustandsgebunden (er erscheint nur bei Abweichung).

```
:449  Das Feld „X“ der Standardvorlage fehlt. Das Abrechnungstool erwartet es.
:475  „X“ steht nur in der Datei, wenn … . Die Standardvorlage gibt das Feld immer aus.
:509  Die Felder stehen in einer anderen Reihenfolge als in der Standardvorlage (…).
```

Sie sind die einzige Stelle, an der ein Benutzer erfährt, daß seine Vorlage eine Datei erzeugt,
die das Abrechnungstool anders liest als erwartet (A-8.2, E-049), und sie tragen den
Pflichtklickpfad **„Vorlageneditor mit Vorschau auf offene Buchungen"**. Der Kommentar bei
`:471-474` begründet die Länge selbst und richtig: *„Die Bedingung wird **benannt**, nicht nur
erwähnt: „steht unter einer Bedingung" läßt offen, unter welcher — und genau das ist die Angabe,
die man braucht."*

**Urteil: kein Kürzungsspielraum. Vorschlag an ux-designer: als eigener Sperrlisteneintrag
aufnehmen, Bezug A-8.2 und E-049.**

**E-087, und das ist neu gegenüber T-184:** `apps/web/test/lib/exportTemplateModel.test.ts` hält
diese Sätze. Eine Kürzung hier ist damit **nicht** nur eine Textfrage — sie geht mit unit-tester
zusammen. Das gehört in den Sperrlisteneintrag, weil es der zweite Riegel ist.

### 2.4 Z-40 — `lib/attachmentLabel.ts`: **vom Textdurchgang ausgenommen**

**Heute gemessen:** `ATTACHMENT_KIND_LABEL` (`:301-305`: „Verweis", „Bild", „Datei" — die Wörter
aus A-19.9) und `ATTACHMENT_VALUE_LABEL` (`:313-317`: „Adresse", „Bild", „Dateipfad"). Je drei
Wörter. Sie sind bereits so kurz, wie sie sein können — und sie sind **vertraglich**:

| Verwendung | Ort | Sorte |
|---|---|---|
| Feldbeschriftung im Anlegen-Dialog | `Attachments.tsx:462`, `:475` | S-04, zugänglicher Name |
| Art des Anhangs in der Zeile | `Attachments.tsx:239` | S-17 Marke |
| im Absagesatz | `Attachments.tsx:371` „Ohne {Adresse\|Bild\|Dateipfad} lässt sich der Anhang nicht öffnen." | S-10 |

Eine Kürzung hier ist keine Textfrage, sondern eine Änderung an einem Prüfvertrag (E-076 Punkt 3).
**Vom Textdurchgang ausgenommen** — das ist kein Sperrlisteneintrag, sondern die Feststellung, daß
der Eintrag in die falsche Liste geraten ist.

### 2.5 Z-41 — `lib/poolRule.ts`: **auf die Sperrliste** — der einzige wirklich unbeurteilte

T-163 Abschnitt 1.2 hielt fest: „**nicht anfassen, solange ST-05 offen ist**". ST-05 ist mit T-181
gebaut. T-184 hat gemeldet, daß die Sperre damit **von selbst abgelaufen** ist, ohne daß jemand
ein Urteil gefällt hätte. Hier ist das Urteil.

**Was die Datei trägt, heute gemessen:**

| Sorte | Ort | Buchstabe |
|---|---|---|
| Achsenbeschriftungen „Erforderliche Tags", „Ausgeschlossene Tags", „Ohne", „Status", „Status — einer von", „Erledigt", „Exportstatus" | `:275-327` | S-04/S-17, ein bis drei Wörter |
| Marken „Nur erledigte" / „Nur unerledigte" | `:210-213` | S-17 |
| Ersatzwörter „Unbekannter Tag", „Unbekannter Ordner", „Unbekannter Status" | `:241`, `:248`, `:305` | **A** |
| „einem unbekannten Ordner" / „N unbekannten Ordnern" | `:530-540` | **A** |
| `ruleSpoken` — der eine lange Satz | `:592-614` | **A/B** |

**Kein einziger Streichkandidat, und drei Gründe, die nicht austauschbar sind:**

1. **Die Ersatzwörter sind Abwesenheiten, und der Dateikopf beweist es an einem Beispiel**
   (`:58-60`): *„die Ordner werden **beim Namen** genannt … „Ein Ordner ist leer" schickt den
   Benutzer suchen, „Kunden / Ost ist leer" nicht."* Und `:373-377` sagt für den Fall ohne Namen:
   *„`null` heißt **nicht** „unbenannt lassen" … Eine nackte Kennung im Fließtext beantwortete die
   Frage des Benutzers nicht, sondern stellte eine neue."* Das ist bereits die Sorgfalt, die ein
   Textdurchgang erzeugen soll; hier ist nichts zu holen.
2. **`ruleSpoken` ist die Kompensation, um derentwillen ST-05 überhaupt freigegeben wurde.** Er
   ist die einzige Fläche, an der die fünf Achsen für jemanden, der die Chipwolke nicht sieht, zu
   **einer** Aussage zusammenkommen (S-8 aus R-2, SC 4.1.3) — und der Dateikopf begründet seine
   Länge und seine Reihenfolge gemessen (`:581-590`: der Grund einer nicht erfüllbaren Regel steht
   **am Ende**, damit wer nach dem dritten Wort weghört, trotzdem gehört hat, was die Regel
   trifft). Er trägt außerdem zwei **B**-Sätze: „Diese Regel nennt keine Bedingung und trifft
   nichts." (A-3.4) und „Kein Tag in … — diese Regel trifft deshalb nichts." (E-057).
3. **Sie ist vertraglich.** `apps/web/test/lib/poolRule.test.ts:99`, `:160`, `:170`, `:173` halten
   „Unbekannter Ordner", „„Kunden / Ost“ und einem unbekannten Ordner" und „2 unbekannten Ordnern"
   **zeichengleich**. E-087, gemessen: hier hängt ein Prüffall.

**Urteil: `lib/poolRule.ts` gehört als eigener Sperrlisteneintrag in `textbestand.md` Abschnitt 5,
Bezug E-054, E-055, A-3.4, **S-8** aus R-2, **W-7** aus R-2a und meine Freigabe Z-03.** Damit ist
T-184s Vorschlag — *„eine Sperre, die an einer Bedingung hängt, wird beim Eintritt der Bedingung
nicht frei, sondern fällig"* — für diesen Fall eingelöst. Er bleibt als Regel richtig, und ich
schlage ihn ux-designer weiterhin für den Kopf des Papiers vor.

---

## 3. O-GG — die vier Streichungen im Aufgabenbereich

**Vorbemerkung zur Grundlage.** `docs/design/textbestand-aufgabenbereich.md:660-661` sagt selbst:
*„Die Einträge in Abschnitt 6 und 7 sind deshalb Vorlagen und keine Aufträge."* Ich beurteile
**vier** Einträge aus Abschnitt 6 — ST-A-03, ST-A-05, ST-A-06, ST-A-08 — und **keinen** aus
Abschnitt 7. ST-A-01, ST-A-02, ST-A-04 und ST-A-07 sind nicht Gegenstand dieser Vorlage; sie
haben eigene Vorbedingungen (e2e-Zeile, T-038, UM-A-02, Gegenrede) und kommen einzeln.

**E-087 auf alle vier angewandt, bevor ich urteile.** Gesucht wurde der **heutige** Wortlaut in
`tests/**`, `apps/*/test/**` und in `apps/outlook-addin/scripts/proof-addin.mjs`:

| Eintrag | Ort heute | Treffer im Prüfcode |
|---|---|---|
| ST-A-03 | `Primitives.tsx:230` | **keiner** |
| **ST-A-05** | `SettingsView.tsx:403` | **`tests/e2e/outlook-addin-build.spec.ts:108`** und `docs/testplan.md:2028` |
| ST-A-06 | `Primitives.tsx:234` | **keiner** |
| ST-A-08 | `TaskPane.tsx:642` (T-182 nennt `:634`) | **keiner** |

**Damit ist die Zeile `textbestand-aufgabenbereich.md:670` gemessen falsch.** Sie kündigt die vier
als *„vier Streichungen **ohne Prüfpunkt und ohne fremde Datei**"* an. Für drei stimmt das. Für
ST-A-05 nicht, und die fremde Datei ist ausgerechnet dieselbe, für die T-182 bei ST-A-01 eine
Bedingung gesetzt hat.

### 3.1 Z-42 — ST-A-03 (`Primitives.tsx:230`): **freigegeben**

**Heute:**

```ts
'default-tag': { label: 'Standard', title: 'Standard-Tag aus den Einstellungen (A-9.3)' },
```

**„(A-9.3)" fällt, der Rest bleibt zeichengleich.** Es ist das Geschwister von ST-03 drüben, es
fällt unter dieselbe Regel S-19, und die Begründung ist dieselbe: Für einen Benutzer ist eine
Kennung aus `docs/spec.md` Zeichenrauschen und verspricht eine Nachschlagemöglichkeit, die es
nicht gibt. Keine Auflage, keine fremde Datei, kein Prüfpunkt.

**Ein Hinweis ohne Auflage, an integration-dev.** Der Träger ist ein `title` auf einem
`<span class="chip__note">` (`Primitives.tsx:276`) — nicht fokussierbar, auf Berührungsgeräten
unsichtbar, nicht abweisbar (Regel S-16). Die sichtbare Wortmarke „Standard" trägt die Aussage,
und deshalb mache ich hier kein zweites Verfahren auf. Aber der Bestand drüben hat für **genau
diese Bauart** ST-09 gebaut: `Tag.tsx` — der `title` fällt, der `visually-hidden`-Text bleibt.
Hier gibt es keinen `visually-hidden`-Text. Wer beide Häuser eines Tages angleicht, gleicht in die
richtige Richtung an, nimmt aber die Erklärung ganz weg, wenn er nicht zugleich einen setzt. Das
ist ein **neuer** Eintrag und gehört in integration-devs Aufnahme, nicht in diese Freigabe.

### 3.2 Z-43 — ST-A-05 (`SettingsView.tsx:403`): **in der Sache ja, in der Bauform nein — blockierend**

**In der Sache: freigegeben.** „Ausdruck auf den Beispieltext anwenden" → **„Ausprobieren"**. Der
Knopf steht unmittelbar unter dem Feld „Beispieltext zum Ausprobieren" (`SettingsView.tsx:382`);
beide Hauptwörter stehen sichtbar darüber, in einer Spalte von 320 bis 450 Pixeln also
unvermeidlich im selben Blickfeld (AB-1). Regel S-07 verlangt die **Handlung**, höchstens drei
Wörter — „Ausprobieren" ist die Handlung und kein Wort zu viel. Kein Namenskonflikt: die zwei
anderen Knöpfe des Bereichs heißen „Ausdruck speichern" und „Auslieferungswert".

**In der Bauform: nein, und das ist blockierend.**

```
tests/e2e/outlook-addin-build.spec.ts:108
  await page.getByRole('button', { name: 'Ausdruck auf den Beispieltext anwenden' }).click();
```

Playwright vergleicht den zugänglichen Namen **ohne** `exact` als Teilzeichenkette. „Ausprobieren"
enthält den gesuchten Text nicht — der Prüffall findet den Knopf nicht mehr und **`TP-BUILD-04`
geht rot**. Und zwar in einem Lauf, dessen Gegenstand der Ladeweg des Worker-Chunks ist und der
mit diesem Text nichts zu tun hat: Der Kommentar bei `:102-107` sagt ausdrücklich, beide Felder
blieben unverändert, *„damit dieser Fall ausschließlich den Ladeweg des Worker-Chunks prüft"*. Wer
den Lauf rot findet, sucht den Fehler am Worker.

Dazu `docs/testplan.md:2028`, das denselben Knopftext ausschreibt (Hoheit e2e-tester).

**Das ist der Fall, für den E-087 gemacht ist**, und er ist in dieser Aufgabe der zweite (nach
Z-36, wo der Prüffall bereits vorbereitet war). **Auflage: ST-A-05 geht nur als ein Auftrag mit
e2e-tester** — `outlook-addin-build.spec.ts:108` und `docs/testplan.md:2028` ziehen zeichengleich
mit. Geteilt erlischt die Freigabe.

**Und ein zweiter Riegel: ST-A-05 wartet auf ui-designer.** Siehe Z-46. Von den vier Einträgen ist
es der einzige, der die **Größe eines Bedienelements** ändert — 38 Zeichen auf 12, in einer Spalte,
in der Breite knapp ist. Das ist Dichte, und Dichte ist nach E-078 Punkt 4 nicht meine Entscheidung.

**Ein Hinweis, den ich dem ui-designer mitgebe, ohne ihm vorzugreifen:** „Ausprobieren" steht dann
als einziges Wort unter einem dreizeiligen Textfeld und über `SampleOutcome`. Ob ein kurzer
Sekundärknopf dort noch als der Auslöser des Testlaufs gelesen wird oder wie eine Beschriftung des
Ergebnisses darunter, ist genau seine Frage.

### 3.3 Z-44 — ST-A-06 (`Primitives.tsx:234`): **freigegeben mit einer Auflage**

**Heute:**

```ts
'new-tag': { label: 'neu', title: 'Dieses Tag gibt es in Takt noch nicht. Es entsteht zusammen mit dem Todo.' }
```

**Neu: `title: 'Entsteht zusammen mit dem Todo.'`** Freigegeben.

**Der D-Bezug steht heute zeichengleich, wie T-182 ihn nennt** (`TagPicker.tsx:330`):

```
Neues Tag „{Name}“ — entsteht beim Anlegen des Todos
```

Der fallende Satz („Dieses Tag gibt es in Takt noch nicht.") ist der **Zustand**, und den trägt
der Chip sichtbar: die Wortmarke „neu" plus die eigene Gestalt `chip--new` (gestrichelter Rahmen,
`addin.css:679`). Reines **S**. Der bleibende Satz ist die **Folge** (**F**) und fällt nach dem
Raster nicht.

**Auflage 1 — und sie ist der eigentliche Punkt.** Nach dieser Kürzung ist `TagPicker.tsx:330` die
**einzige** Stelle, an der ganz ausgesprochen wird, daß es dieses Tag in Takt noch nicht gibt. Der
Satz steht dort auf der Sperrliste (**SP-A-12**, F, T-061). **Fällt SP-A-12 je, ist Z-44
zurückgenommen** — dieselbe Bauart wie meine Auflage zu Z-24.

**Auflage 2 — eine Genauigkeit, damit der nächste Durchgang nicht zu weit greift.** T-182 begründet
das D mit *„sie steht im selben Arbeitsgang: erst der Knopf, dann der Chip"*. Das stimmt, aber es
ist **nicht** dasselbe D wie das der Fläche: Knopf und Chip stehen **nacheinander**, nicht
nebeneinander — der Knopf verschwindet, sobald der Chip entsteht. Das D trägt hier über den
Arbeitsgang, nicht über das Blickfeld. Wer diesen Eintrag später als Beleg für „im selben
Blickfeld" zitiert, zitiert ihn falsch, und AB-1 ist gerade der Grund, aus dem das drüben eine
Rolle spielt.

### 3.4 Z-45 — ST-A-08 (`TaskPane.tsx:642`): **freigegeben, mit einer blockierenden Auflage**

**Heute:**

```tsx
<Field label="Vermerk (bleibt in Takt)" htmlFor="note"
       hint="Interner Vermerk des Todos. Er geht nicht in die Abrechnung." >
```

**Neu: `hint="Er geht nicht in die Abrechnung."`** Freigegeben — und zwar zum **zweiten Mal.** Es
ist **F-2 aus T-165** (`.claude/team/reports/T-165-spec-ux-reviewer.md:496`), wortgleich, mit
derselben Begründung („Reine Verdopplung der Beschriftung darüber") und derselben Bedingung („„Er
geht nicht in die Abrechnung." **bleibt**"). Umgesetzt wurde sie nie; T-165 nannte den Ort noch
`TaskPane.tsx:586`, heute ist es `:642`.

**Die Grammatik trägt.** Nach der Kürzung beginnt der Hinweis mit „Er"; der Bezug ist die
Beschriftung „Vermerk (bleibt in Takt)" darüber. `fieldParts` gibt die Beschriftung als **Namen**
und den Hinweis als **Beschreibung** aus — sie werden in dieser Reihenfolge gelesen, sichtbar wie
vorgelesen. Kein Bruch.

**Auflage, blockierend: der Zwilling geht mit, oder es geht keiner.**

T-165 hat in derselben Tabelle **F-3** freigegeben — „**Dieser Text wird exportiert.**" am
Leistungsfeld, mit exakt derselben Begründung (Verdopplung der Beschriftung „Leistung (geht in die
Abrechnung)") und derselben Bedingung („„Text aus der E-Mail gehört in den Vermerk, nicht hierher."
**bleibt**"). Gemessen heute steht der Satz unverändert:

```
apps/outlook-addin/src/ui/TaskPane.tsx:792
  hint="Dieser Text wird exportiert. Text aus der E-Mail gehört in den Vermerk, nicht hierher."
```

**T-182 führt ihn nicht in der Streichliste.** `textbestand-aufgabenbereich.md:170` nennt die
**ganze** Zeile — beide Sätze — und schreibt daneben „**F + B-12.3**. Gesperrt, SP-A-05". Die
Sperrlistenzeile selbst (`:299`) zitiert dagegen nur den **zweiten** Satz. Die beiden Stellen
widersprechen einander, und die weitere von beiden ist die, die ein Umsetzer zuerst liest.

**Was daraus würde, wenn ST-A-08 allein liefe:** Zwei identische Befunde, aus **einer** Freigabe
entstanden, ständen danach auf zwei verschiedenen Listen — einer ausgeführt, einer gesperrt. Das
ist die Klasse aus E-081 Punkt 4 in ihrer stillen Form. Nicht zwei Wellen, die je für sich richtig
aussehen, sondern **eine Welle, die die Hälfte einer Freigabe ausführt und die andere Hälfte in
eine Sperre umschreibt**, ohne daß es irgendwo als Rücknahme steht.

**Auflage, dreiteilig:**

1. **ST-A-08 und der erste Satz aus `TaskPane.tsx:792` fallen in einem Auftrag.** Beide sind F-2
   und F-3 aus T-165, beide sind seit damals freigegeben, beide sind dieselbe Sorte Fehler.
2. **SP-A-05 gilt für den zweiten Satz** — „Text aus der E-Mail gehört in den Vermerk, nicht
   hierher." —, **genau so, wie die Sperrlistenzeile `:299` ihn zitiert**, und der bleibt
   zeichengleich. Er ist der Satz, der verhindert, daß Kundentext aus einer fremden E-Mail in eine
   Rechnung wandert (B-12.3, R-08); an ihm ändert diese Freigabe nichts.
3. **`textbestand-aufgabenbereich.md:170` wird berichtigt** (integration-dev): Die Zeile darf nicht
   die ganze `hint` als gesperrt führen, wenn die Sperrliste nur ihren zweiten Satz sperrt. Ein
   Papier, das an zwei Stellen zwei Umfänge nennt, entscheidet die Frage beim nächsten Lesen nach
   Zufall.

**Und die eine Sorge, die ich ausdrücklich nicht habe.** Man könnte fragen, ob „Er geht nicht in
die Abrechnung." nach der Kürzung selbst **D** ist gegen den Klammerzusatz „(bleibt in Takt)" der
Beschriftung — beide sagen etwas über den Verbleib. Nein: „bleibt in Takt" nennt den Ort, „geht
nicht in die Abrechnung" nennt das **Ziel, das es nicht erreicht**, und das ist die Aussage, um
derentwillen A-7.2 existiert. Ich schreibe es auf, weil der nächste Durchgang genau hier ansetzen
wird — und dann stünde die Grenze aus A-7.2/R-08 nur noch in einem Klammerzusatz. **Der bleibende
Satz ist ab jetzt gesperrt** und gehört in SP-A-01 hinein, nicht daneben.

### 3.5 Z-46 — Was **ohne** ui-designer geht und was nicht

Die Frage war ausdrücklich gestellt; hier die Antwort mit ihrer Linie.

**Die Linie.** E-078 Punkt 4 verlangt ui-designer für **Hierarchie und Dichte**. Ein Wortlaut, der
an seiner Stelle und in seiner Textsorte kürzer wird, ändert weder das eine noch das andere. Ein
**zugänglicher Name**, der die Größe eines Bedienelements ändert, ändert beides. Diese Linie ist
nicht neu — T-182 Abschnitt 8 hat sechs reine D-Fälle ohne ui-designer gebaut, darunter Kürzungen
von `hint` und `description`, und ich beanstande das rückwirkend nicht.

| Eintrag | Ohne ui-designer? | Warum |
|---|---|---|
| **ST-A-03** | **ja** | `title`-Attribut. Unsichtbar, keine Fläche, keine Höhe, keine Breite |
| **ST-A-06** | **ja** | dito |
| **ST-A-08** (mit dem Zwilling) | **ja** | ein `hint` verliert einen Satz an derselben Stelle. Die Feldhöhe ändert sich um höchstens eine Zeile — das ist der Gegenstand des Textdurchgangs selbst, nicht seine Vorbedingung |
| **ST-A-05** | **nein** | ein Knopfname von 38 auf 12 Zeichen. Das ist die Größe eines Bedienelements in einer 320–450 px breiten Spalte, und dort ist Dichte keine Geschmacksfrage |

**Zusätzlich zu ui-designer braucht ST-A-05 e2e-tester** (Z-43). Es ist damit der einzige der vier,
der **zwei** Vorbedingungen hat, und der einzige, der in dieser Welle nicht laufen kann.

**Was ich hier nicht beantworte:** ob der Aufgabenbereich insgesamt ein eigenes
`textabbau-gestalt.md` braucht, bevor Abschnitt 6 und 7 als Ganzes anlaufen. T-182 Frage 5 stellt
sie, und sie ist richtig gestellt — für die vier Einträge dieser Vorlage brauche ich sie nicht
beantwortet, für ST-A-01, ST-A-02, ST-A-04 und die vier Umbauten sehr wohl.

---

## 4. Die Pflichtklickpfade, soweit die heutigen Urteile sie berühren

| Pfad | Stand nach diesem Bericht |
|---|---|
| **Timer auf erledigtem Todo** | Unberührt. Z-34 (UM-08) berührt die Board-Fläche, nicht den Fluß; SP-16 und `TodoDetailScreen.tsx:399/401` sind unangetastet. **Aber**: Z-34 (c) nennt die Falle — `tests/e2e/done-movement-announcement.spec.ts:62` hält den Satz „Der Status bleibt unverändert — …", der zu **diesem** Fluß gehört und dessen Anfang mit einem Kartenpunkt aus UM-08 übereinstimmt |
| **Exportstatus an jeder Stelle sichtbar** | Berührt von **Z-36**. `ExportAudit.tsx:170` verliert eine Kennung, **nicht** seinen Satz: „Ohne Begründung ausgebucht. Das Feld ist freiwillig …" bleibt vollständig, und der Prüffall mißt ihn weiterhin. Berührt außerdem von **Z-41**: die Exportachse einer Regel („Abgerechnet" gegen den Anzeigezustand „Nicht abgerechnet", W-7 aus R-2a) hängt an `poolRule.ts:328-335` und geht auf die Sperrliste |
| **Todo-Notiz nie im Export, Buchungsnotiz sichtbar** | Berührt von **Z-35** und **Z-45**, in beiden Häusern, und in beiden bleibt die **Trennung** unangetastet. Z-35 lehnt die Kürzung ab, solange security-checker nicht danebensteht; Z-45 gibt in `TaskPane.tsx` genau den Satz frei, der die Beschriftung wiederholt, und sperrt den, der die Grenze trägt. `NoteField.tsx:58` (SP-09/G-8) und `TaskPane.tsx:792` Satz 2 (SP-A-05) bleiben zeichengleich |
| **Vier Ebenen tiefer Ordnerbaum, Selbstverschiebung** | Berührt von **Z-41**, und das ist der Grund für die Sperre: `emptyFolderNames` (`poolRule.ts:530-540`) und die Ersatzwörter sind die einzige Stelle, an der ein Benutzer erfährt, **welcher** Ordner seiner Regel leer ist — bei „Kunden / Ost" in einem vierstufigen Baum ist das der Unterschied zwischen einer Auskunft und einer Suche. Die Absage der Selbstverschiebung (`TagsScreen.tsx`) ist unberührt |
| **Standard-Tags auf jedem Erstellungsweg** | Berührt von **Z-42**. Die Wortmarke „Standard" am Chip bleibt zeichengleich; es fällt allein die Kennung aus einem `title`. SP-A-04 (`TaskPane.tsx:590`, „Die Standard-Tags aus den Einstellungen kommen beim Anlegen automatisch dazu.") ist nicht Gegenstand und bleibt |
| **Vorlageneditor mit Vorschau auf offene Buchungen** | Berührt von **Z-39**, und das ist der Grund für die Sperre: die sechs Abweichungssätze aus `exportTemplateModel.ts` sind die einzige Stelle, an der ein Benutzer vor dem Lauf erfährt, daß seine Vorlage anders liest als die Standardvorlage |

---

## 5. Befunde in Kurzform

```
Z-34  Board / Leerzustand              Abweichung: keine — Ablehnung aus Vorbedingung. Die Karte
      A-5.4, E-054, E-081 Punkt 4      „Was sich geändert hat" steht heute in BoardScreen.tsx:
      UM-08                            1021-1054; der Handbuchabsatz, den textbestand.md:1193
                                       ZUERST verlangt, steht nicht (docs/benutzerhandbuch.md
                                       kennt „vollzählig" nicht).
                                       Vorschlag: NOCH NICHT freigegeben. Drei Messungen für den
                                       Auftrag: (a) der Verweisteil wird getragen, aber als
                                       TodoFormDialog.tsx:250 „Die Werte stehen in den Ein-
                                       stellungen unter „Status“." — nicht als der von ST-05
                                       vorgeschlagene Satz; (b) beide „Erste Spalte einrichten"
                                       rufen heute dasselbe onOpenSetup (:1015 und :1047);
                                       (c) E-087: kein Kartenpunkt in tests/**, ABER „Der Status
                                       bleibt" trifft done-movement-announcement.spec.ts:62, das
                                       einen anderen Satz hält. Über Zeilen streichen, nicht über
                                       Satzanfänge.

Z-35  Todo/Buchung — Leistungsfeld     Abweichung: keine — Ablehnung aus Vorbedingung. Von zwei
      E-016, R-06, R-08, SP-09         Gründen ist einer entfallen: NoteField.tsx:197-204 trägt
                                       seit T-186 die richtige Meldeflächen-Bauart. Zwei stehen:
                                       security-checker hat sich zu SP-09 nie geäußert (Suche
                                       über das ganze Repository), und es gibt keine neue Fassung
                                       — textbestand.md:1269 sagt „(falls gewollt)", :1255
                                       verlangt die Fassung statt der Absicht.
                                       Vorschlag: NOCH NICHT. Gemessen: :50 hat 131 Zeichen bei
                                       80 nach S-05 — der Wunsch hat einen Grund. Drei
                                       Bedingungen für die Zustimmung: :58 bleibt zeichengleich
                                       (G-8 aus T-165), der Empfänger bleibt im Satz (Merkmal 6,
                                       NoteField.tsx:27), und „Standardvorlage: Feld „Notiz“."
                                       fällt nur gegen eine Messung im Vorlageneditor.

Z-36  Export / Protokoll               Abweichung: ExportAudit.tsx:170 trägt als sechste Stelle
      S-19, E-047, ST-03, Z-32         eine interne Kennung, die ST-03 an fünf anderen bereits
                                       gestrichen hat (alle fünf heute nachgemessen: gefallen).
                                       Vorschlag: FREIGEGEBEN — „(E-047)" fällt, der Satz bleibt
                                       zeichengleich. Und die Auflage aus Z-32 ist ERLEDIGT:
                                       export-mixed-status-and-billing.spec.ts:127-134 endet seit
                                       T-187 bewußt vor der Kennung und trägt beide Wortlaute.
                                       frontend-dev geht allein.

Z-37  Versionshinweis / Installieren   Abweichung: useUpdateNotice.ts:251 rät im Zweig `rejected`,
      A-18.6, A-18.8, B-18.2, E-064    „den angezeigten Verweis von Hand aufzurufen" — dieselbe
      Punkt 4                          Bezeichnung, die die Hülle soeben abgewiesen hat, in
                                       derselben festen Adresse.
                                       Vorschlag: FREIGEGEBEN, der dritte Satz fällt. ENG: :256
                                       (`failed`) sagt fast dasselbe und hat recht — dort war die
                                       Form in Ordnung, es fehlt nur der Browser. :256 bleibt
                                       zeichengleich. E-087: kein Treffer im Prüfcode. Neben-
                                       befund: package.json:22-40 führt achtzehn proof-Läufe und
                                       keine einzige Gleichlaufmessung — die Unerreichbarkeit
                                       dieses Zweigs ist weiterhin eine Zusicherung (Z-33).

Z-38  ohne Anwendungshülle             Abweichung: keine — die sechs Sätze bleiben (A/B). Aber
      E-001, E-036, SP-20, E-087       meine eigene Zahl aus Z-29 war zu klein: es sind VIER
                                       zeichengleiche Paare über connection.ts und
                                       desktop/src/shell.ts (:293/:483, :327/:379, :345/:530,
                                       :397/:623), nicht drei. Genau EINES ist von einem
                                       Kommentar gedeckt, drei von gar nichts.
                                       Vorschlag: die Auflage aus Z-29 steht unverändert — keiner
                                       dieser Sätze wird je als Träger einer Aussage gezählt, als
                                       Zeile in den Kopfkommentar. Die Zahl ist hiermit berichtigt.

Z-39  Export / Vorlagenwahl            Abweichung: keine — Sperrvorschlag. Sechs Sätze (:449,
      A-8.2, E-049, Pflichtpfad        :457, :464, :475, :486, :509), jeder nennt eine Abweichung
      „Vorlageneditor"                 gegen die Standardvorlage mit Feldnamen, alle zustands-
                                       gebunden, alle B.
                                       Vorschlag: als eigener Sperrlisteneintrag aufnehmen. Neu
                                       gegenüber T-184: apps/web/test/lib/exportTemplateModel.
                                       test.ts hält sie — eine Kürzung ginge mit unit-tester und
                                       ist damit doppelt verriegelt.

Z-40  Todo-Detail / Anhänge            Abweichung: keine. ATTACHMENT_KIND_LABEL (:301-305) und
      A-19.9, A-19.12, E-076 Punkt 3   ATTACHMENT_VALUE_LABEL (:313-317) sind je drei Wörter und
                                       landen in Feldbeschriftungen (Attachments.tsx:462, :475),
                                       einer Marke (:239) und einem Absagesatz (:371).
                                       Vorschlag: VOM TEXTDURCHGANG AUSGENOMMEN — kein Sperr-
                                       eintrag, sondern die Feststellung, daß der Eintrag in der
                                       falschen Liste steht. Eine Kürzung wäre eine Änderung an
                                       einem Prüfvertrag, nicht an einem Text.

Z-41  Board / Pools / Regelformular    Abweichung: keine — Sperrvorschlag. Der einzige der fünf,
      E-054, E-055, A-3.4, E-057,      den niemand beurteilt hatte; die Sperre aus T-163 ist mit
      S-8 (R-2), W-7 (R-2a), Z-03      ST-05 von selbst abgelaufen. Gemessen: Achsenbeschrif-
                                       tungen ein bis drei Wörter; die Ersatzwörter sind A und im
                                       Dateikopf (:58-60, :373-377) begründet; ruleSpoken
                                       (:592-614) ist die Live-Region-Fassung der ganzen Regel
                                       und trägt zwei B-Sätze.
                                       Vorschlag: als eigener Sperrlisteneintrag aufnehmen.
                                       E-087: poolRule.test.ts:99/160/170/173 hält drei dieser
                                       Zeichenketten zeichengleich.

Z-42  Add-in / Tags am Todo            Abweichung: Primitives.tsx:230 trägt „(A-9.3)" im title
      S-19, A-9.3, ST-03 (Geschwister) einer Chip-Marke — eine Anforderungs-ID auf dem Bildschirm.
                                       Vorschlag: FREIGEGEBEN, „(A-9.3)" fällt, der Rest bleibt.
                                       E-087: kein Treffer in tests/**, apps/*/test/** oder
                                       proof-addin.mjs. Hinweis ohne Auflage: der Träger ist ein
                                       title auf einem <span> (S-16) — drüben hat ST-09 dieselbe
                                       Bauart aufgelöst und einen visually-hidden-Text behalten;
                                       hier gibt es keinen. Eigener Eintrag, nicht dieser.

Z-43  Add-in / Einstellungen S-13      Abweichung: BLOCKIEREND in der Bauform. „Ausdruck auf den
      S-07, E-076 Punkt 3, E-087,      Beispieltext anwenden" → „Ausprobieren" trägt in der Sache
      E-078 Punkt 4                    (Feld „Beispieltext zum Ausprobieren" steht darüber,
                                       SettingsView.tsx:382). ABER: der Knopfname steht in
                                       tests/e2e/outlook-addin-build.spec.ts:108 als getByRole-
                                       Name und in docs/testplan.md:2028. TP-BUILD-04 ginge rot —
                                       in einem Lauf, dessen Gegenstand der Worker-Chunk ist.
                                       textbestand-aufgabenbereich.md:670 nennt die vier
                                       „ohne Prüfpunkt und ohne fremde Datei"; für diesen Eintrag
                                       ist das gemessen falsch.
                                       Vorschlag: nur als EIN Auftrag mit e2e-tester, beide
                                       Dateien zeichengleich mit. Zusätzlich: der einzige der
                                       vier, der die Größe eines Bedienelements ändert — er
                                       wartet auf ui-designer (Z-46).

Z-44  Add-in / Tag-Auswahl             Abweichung: Primitives.tsx:234 wiederholt im title den
      T-061, SP-A-12, AB-1             Zustand, den die sichtbare Marke „neu" und die Gestalt
                                       chip--new tragen (S). Der zweite Satz ist F und bleibt.
                                       Vorschlag: FREIGEGEBEN — title: „Entsteht zusammen mit dem
                                       Todo." Auflage 1: die Freigabe hängt an SP-A-12
                                       (TagPicker.tsx:330, heute zeichengleich gemessen); fällt
                                       der, ist Z-44 zurückgenommen. Auflage 2: das D trägt über
                                       den ARBEITSGANG, nicht über das Blickfeld — Knopf und Chip
                                       stehen nacheinander. Nicht als Blickfeld-D zitieren.

Z-45  Add-in / Neues Todo, Vermerk     Abweichung: BLOCKIEREND. ST-A-08 ist F-2 aus T-165,
      A-7.2, A-7.3, R-08, B-12.3,      wortgleich und seit damals unumgesetzt (heute :642, T-165
      E-081 Punkt 4, T-165 F-2/F-3     nannte :586). Sein Zwilling F-3 („Dieser Text wird
                                       exportiert.", heute TaskPane.tsx:792) ist aus derselben
                                       Freigabe entstanden — steht aber nicht in der Streichliste,
                                       sondern wird in textbestand-aufgabenbereich.md:170 mitsamt
                                       ganzer Zeile als „Gesperrt, SP-A-05" geführt, während die
                                       Sperrlistenzeile :299 nur den zweiten Satz zitiert.
                                       Vorschlag: FREIGEGEBEN mit drei Auflagen. (1) ST-A-08 und
                                       der erste Satz aus :792 fallen in EINEM Auftrag. (2)
                                       SP-A-05 gilt für den zweiten Satz, genau wie :299 ihn
                                       zitiert; er bleibt zeichengleich. (3) :170 wird berichtigt.
                                       Und: „Er geht nicht in die Abrechnung." ist ab jetzt
                                       gesperrt — sonst steht die Grenze aus A-7.2/R-08 nach dem
                                       nächsten Durchgang nur noch in einem Klammerzusatz.

Z-46  Add-in, alle vier Einträge       Abweichung: keine — Antwort auf die gestellte Frage. Die
      E-078 Punkt 4                    Linie: ein Wortlaut, der an seiner Stelle und in seiner
                                       Textsorte kürzer wird, geht ohne ui-designer; ein
                                       zugänglicher Name, der die Größe eines Bedienelements
                                       ändert, nicht.
                                       Vorschlag: ST-A-03, ST-A-06 und ST-A-08 (mit dem Zwilling)
                                       gehen jetzt. ST-A-05 wartet — auf ui-designer UND auf
                                       e2e-tester. Präzedenzfall für die Linie ist T-182
                                       Abschnitt 8, das sechs D-Fälle ohne ui-designer gebaut hat
                                       und das ich rückwirkend nicht beanstande.
```

---

## Urteil

**Nacharbeit.** Blockierende Kennungen: **Z-43** und **Z-45**.

Freigegeben sind **Z-36**, **Z-37**, **Z-42**, **Z-44** und, unter ihren Auflagen, **Z-45**;
**Z-38**, **Z-39**, **Z-40** und **Z-41** sind Sperr- beziehungsweise Ausnahmeurteile ohne Bau.
**Z-34** und **Z-35** sind ausdrücklich **nicht** freigegeben und bleiben Wiedervorlage bei mir.

---

## Annahmen

1. **Ich habe jede Fundstelle heute selbst gemessen**, auch die aus meinen eigenen früheren
   Berichten (E-087). An vier Stellen wich der Baum von der Vorlage ab; an einer davon
   (`tests/e2e/outlook-addin-build.spec.ts:108`, Z-43) kippt daran ein Urteil. Das ist der Grund,
   aus dem E-087 als Schritt im Auftrag steht und nicht als Satz in einem Papier.
2. **„Der Baustein ist zu" habe ich auf `NoteField` bezogen und nicht auf T-189/3.** T-189/3
   behandelt den Codepunkt-Wächter in Rust; zu SP-09 steht dort nichts. Wenn der Orchestrator
   damit eine Abnahme von security-checker für SP-09 gemeint hat, finde ich sie nicht — und dann
   ist Z-35 mit einer Zeile aufzuheben, nicht mit einer Aufgabe.
3. **Ich beurteile aus `textbestand-aufgabenbereich.md` genau vier Einträge**, die vier des
   Auftrags. Abschnitt 7 (UM-A-01 bis UM-A-04) und die vier übrigen ST-A-Einträge sind nicht
   Gegenstand; ich habe sie gelesen und sage zu keinem etwas.
4. **Bei ST-A-08 habe ich F-3 aus T-165 mitgezogen**, obwohl er im Auftrag nicht steht. Begründung:
   Es ist derselbe Befund aus derselben Freigabe, und ihn liegenzulassen hieße, meine eigene
   Freigabe zur Hälfte auszuführen. Das ist eine Erweiterung des Auftrags, und ich nenne sie.
5. **Die Linie in Z-46 ist meine**, nicht die des ui-designer. Sie beschreibt, wofür ich seine
   Zustimmung für nötig halte; ob er sie enger zieht, ist seine Sache. Sie umzuwerfen kostet einen
   Satz von ihm.
6. **Für ST-A-05 habe ich Playwrights Vorgabe zugrunde gelegt**, daß `getByRole(name)` ohne
   `exact` als Teilzeichenkette vergleicht. „Ausprobieren" enthält den gesuchten Text nicht; der
   Lauf geht rot. Das ist abgeleitet, nicht gefahren — wer es widerlegt, hebt Z-43s Bauformteil
   auf, nicht seinen Gestaltteil.

## Risiken

1. **Z-45 ist eine neue Unterart von E-081 Punkt 4, und sie ist schlechter zu sehen als die alte.**
   Bisher hieß der Fall „zwei Wellen, jede für sich richtig". Hier ist es **eine** Welle, die eine
   Freigabe halbiert und die andere Hälfte in eine Sperrliste umschreibt. Es gibt keinen zweiten
   Zeitpunkt, an dem jemand stutzt — die Streichliste und die Sperrliste sehen beide vollständig
   aus.
2. **Die Zahl in einem Papier ist zum dritten Mal die Fehlerquelle** (222→286, fünf→sechs
   Kennungen, jetzt drei→vier Paare in Z-38). Zweimal war es ein fremdes Papier, einmal mein
   eigener Bericht. E-087 fängt den Fall vor einer Streichung; er fängt ihn **nicht**, wenn eine
   Zahl nur zitiert und nichts gestrichen wird.
3. **Z-37 ist ein Satz in einem Zweig, den niemand erreicht, und der Wächter dafür fehlt weiter.**
   `package.json` führt achtzehn `proof:`-Läufe und keinen Gleichlauf zwischen Hülle und Domäne —
   weder für die Fassungen (Z-33) noch für die Anhänge (E-085). Der Satz fällt; die Bedingung, die
   ihn harmlos macht, bleibt ungemessen.
4. **UM-08 ist jetzt seit drei Aufgaben blockiert** (T-180 hat den Eintrag geschrieben, T-184 und
   T-195 haben ihn nicht beurteilt), und der Grund ist jedesmal derselbe fehlende Absatz. Das
   Risiko ist nicht die Karte, sondern die Gewöhnung: Ein Eintrag, der dreimal „noch nicht"
   bekommt, wird beim vierten Mal durchgewinkt.
5. **Z-42 gibt eine Kennung frei und läßt einen unerreichbaren Träger stehen.** Nach der Kürzung
   ist die Erklärung des Standard-Chips ein `title` auf einem `<span>` — für Tastatur und
   Berührung nicht da. Das ist heute schon so; die Freigabe macht es weder besser noch schlechter,
   aber sie sieht danach nach „erledigt" aus.

## Offene Fragen

1. **An den Orchestrator, zu Z-35:** Gibt es eine Abnahme von security-checker zu SP-09, die ich
   nicht finde? Meine Suche über das ganze Repository nennt keinen Bericht von ihm. Wenn nicht:
   soll security-checker den Punkt in der nächsten Welle mitnehmen, oder bleibt der Eintrag
   liegen, bis ihn jemand wirklich will? `textbestand.md:1269` sagt „falls gewollt" — es ist
   möglich, daß ihn niemand will.
2. **An den Orchestrator, zu Z-34:** O-FE auf dem Board sagt bereits „documenter und frontend-dev,
   **ein** Auftrag". Meine drei Messungen (a) bis (c) gehören in diesen Auftrag hinein. Reicht
   dieser Bericht als Quelle, oder soll die Fundstellenliste an anderer Stelle stehen?
3. **An integration-dev, über den Orchestrator:** `textbestand-aufgabenbereich.md:170` und `:299`
   nennen für SP-A-05 zwei verschiedene Umfänge (ganze `hint` gegen zweiten Satz). Zeile `:670`
   nennt vier Einträge „ohne Prüfpunkt und ohne fremde Datei", was für ST-A-05 gemessen falsch
   ist. Beides gehört berichtigt; das Papier ist seine Hoheit, nicht meine.
4. **An ux-designer:** vier Einträge, die ich vorschlage und ausdrücklich nicht selbst verfasse —
   `lib/exportTemplateModel.ts` (Z-39) und `lib/poolRule.ts` (Z-41) als Sperrlisteneinträge, die
   Zeile aus Z-38 für den Kopfkommentar von `connection.ts`, und die Feststellung aus Z-40, daß
   `lib/attachmentLabel.ts` aus der Liste der fünf herausgehört statt gesperrt zu werden.
5. **An mich selbst, Wiedervorlage:** UM-08 (nach dem Handbuchabsatz, Z-34) und die SP-09-Kürzung
   (nach security-checker **und** nach einer geschriebenen Fassung, Z-35). Beide zum dritten Mal.

## Nächster Schritt

1. **integration-dev, ein Auftrag:** Z-42 (ST-A-03), Z-44 (ST-A-06), Z-45 (ST-A-08 **und** der
   erste Satz aus `TaskPane.tsx:792`) sowie die Berichtigung von
   `textbestand-aufgabenbereich.md:170` und `:670`. Alle drei Streichungen gehen ohne ui-designer
   (Z-46); Z-45 geht nur vollständig.
2. **frontend-dev, klein, allein:** Z-36 — „(E-047)" fällt aus `ExportAudit.tsx:170`. Der Prüffall
   ist bereits vorbereitet; e2e-tester wird nicht gebraucht.
3. **frontend-dev, klein:** Z-37 — der dritte Satz aus `useUpdateNotice.ts:251` fällt, `:256`
   bleibt zeichengleich. Dazu Z-38 — eine Zeile in den Kopfkommentar von `connection.ts`.
4. **ui-designer, dann e2e-tester und integration-dev in einem Auftrag:** Z-43 (ST-A-05), mit
   `tests/e2e/outlook-addin-build.spec.ts:108` und `docs/testplan.md:2028`.
5. **ux-designer:** die vier Einträge aus Offene Frage 4.
6. **documenter, vor allem anderen am Board:** der UM-08-Absatz zur Herkunft der Spalten. Erst
   danach kommt Z-34 zurück zu mir.
7. **Orchestrator, eine Zeile:** die Antwort auf Offene Frage 1. Sie entscheidet, ob Z-35 eine
   Aufgabe ist oder ein geschlossener Eintrag.
