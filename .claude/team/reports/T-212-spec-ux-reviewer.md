# T-212 — Drei Urteile vor der ersten Zeile Code, und eines davon gegen eine Regel, die ich selbst geschrieben habe

**Rolle:** spec-ux-reviewer **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`

**Gelesen:** `docs/spec.md` (Abschnitte 7, 8, 11, 13, 15, 16), `docs/design/textabbau-gestalt.md`
(Abschnitt 9 vollständig), `docs/design/traeger-und-zusage.md` (Abschnitt 9 in Auszügen),
`.claude/team/decisions.md` (E-034, E-076, E-078, E-081, E-087), Berichte **T-184** (P-8/P-9),
**T-200** (eigener), **T-204**, **T-207**, **T-208**, dazu der laufende Baum:
`apps/web/src/components/FormDialog.tsx`, `Primitives.tsx`, `NoteField.tsx`, `Attachments.tsx`,
`apps/web/src/lib/touched.ts`, `lib/focus.ts`, `apps/web/src/screens/TagsScreen.tsx`,
`PoolRenameDialog.tsx`, `PoolFormDialog.tsx`, `StatusSettings.tsx`, `TemplatesScreen.tsx`,
`SettingsScreen.tsx`, `TodoDetailScreen.tsx`, `ExportScreen.tsx`,
`apps/web/src/showcase/NotesSection.tsx`, `apps/web/src/styles/app.css`,
`apps/web/scripts/proof-surface.mjs`, `apps/web/test/lib/touched.test.ts`,
`tests/e2e/export-audit-and-locks.spec.ts`.

**Zur Form (E-087 Punkt 4).** Dieser Bericht nennt für fremde Dateien **keine Zeilennummern**.
Belegt wird mit Datei und Zitat. Wo eine fremde Zeilenangabe erscheint, steht sie **innerhalb**
eines Zitats aus einem anderen Papier und ist als dessen Angabe zu lesen, nicht als meine.

**Kein Produktivcode angefaßt.** Einzige geschriebene Datei: dieser Bericht.

---

## Kurzfassung

```
Aufgabe: T-212 — O-IM (die drei Sorten der neun gesperrten Absendeknöpfe),
         O-IR (Dringlichkeit am Wirt statt Tonfall am Baustein),
         O-HL zweite Hälfte (Zuschnitt und der fallende zugängliche Name),
         O-IN (das veraltete Zitat im Prüffall)
Status: braucht Review — drei Urteile stehen, zwei davon mit blockierenden Auflagen
```

| Gegenstand | Urteil |
|---|---|
| **O-IM** Sortenaufteilung A/B/C | **taugt als Grundlage** — aber sie schneidet an der falschen Kante. Der Schnitt, der zählt, ist nicht „steht der Grund daneben", sondern **„kann das sperrende Feld außerhalb des Bildes stehen"** — Z-63 |
| **O-IM** Hinweis oder Umbau? | **Der Umbau, für alle neun** — Z-61. **Gegen** die Empfehlung dessen, der gemessen hat, und mit **seinen** Zahlen: zwei seiner drei nicht-in-Zeilen-meßbaren Kosten halten der Nachprüfung nicht stand |
| **O-IM** der eigentliche Fund | **Z-62** — sein Vorschlag *ist* **P-9**, verbindlich seit T-184 (Z-20), von mir geschrieben. Er hat sie wiedererfunden, weil ihr **Wortlaut im ganzen Bestand nicht steht** |
| **O-IM** Auflagen | **Z-64, blockierend für denselben Auftrag** — drei, darunter ein Prüffall auf den Riegel und die Bedingung, daß der Satz aus T-211 vorher da ist |
| **O-IR** `urgency` am Wirt | **die Sache ist richtig, die Voraussetzung ist falsch** — Z-65. „Betroffen ist heute **keine** Stelle" hält nicht: **eine** Stelle ist betroffen, und es ist die folgenreichste aus Bündel 2 |
| **O-IR** die Grenze, die im Papier fehlt | **Z-66** — `MessageHostContext` stellt `InlineMessage` still, aber **nicht** eine von Hand geschriebene Rolle in dessen Kindern. Genau die steht in der betroffenen Meldung |
| **O-IR** `.tags-split__error` | **darf fallen, aber nicht nebenbei** — Z-67. Kein zugänglicher Name fällt mit; dafür bleibt eine **Gegenprobe** stehen, die den Klassennamen nennt und nie rot wird |
| **O-HL** Zuschnitt | **eigener Auftrag**, Z-47 **plus** die Auflage aus Z-48, **ohne** Z-50 — Z-68 |
| **O-HL** fällt ein zugänglicher Name? | **im Produkt nein, auf der Musterseite ja — und ein Prüffall ist die falsche Antwort** — Z-69. Was fehlt, ist etwas anderes: `required` allein zu streichen macht den Musterblock **widersprüchlich** |
| **O-IN** | **ersetzt, nicht gestrichen — und nicht durch ein zweites Zitat** — Z-70 |

---

## 1. O-IM — neun gesperrte Absendeknöpfe

### 1.0 Was ich selbst nachgemessen habe

**Die neun stimmen.** `submitDisabled` steht in `apps/web/src` an neun Aufrufstellen: dreimal
`TagsScreen.tsx`, je einmal `Attachments.tsx`, `PoolFormDialog.tsx`, `StatusSettings.tsx`,
`PoolRenameDialog.tsx`, `TemplatesScreen.tsx` und `showcase/ControlsSection.tsx`. Acht im Produkt,
eine auf der Musterseite — T-207s Zählung ist am Baum bestätigt.

**Der Riegel ist zentral, nicht je Dialog.** `FormDialog.tsx` führt ihn **einmal**, in **einer**
Funktion:

```
event.preventDefault();
if (busy || submitDisabled) return;
```

Alle neun laufen durch diese Zeile. Das ist der Angelpunkt des ganzen Urteils, und er ist unten
zweimal tragend.

**Die Prüfläufe:** In `tests/e2e` stehen drei `toBeDisabled()` — zweimal der Exportknopf in
`export-audit-and-locks.spec.ts`, einmal `input.egroup__check` in
`export-mixed-status-and-billing.spec.ts`. **Keine** gilt einem Absendeknopf eines
Formulardialogs. T-207s Messung ist bestätigt.

### 1.1 Z-62 — der Fund, mit dem alles andere anders aussieht: der Vorschlag ist P-9

**Frontend-devs Vorschlag ist nicht neu. Er ist wörtlich die zweite Hälfte einer verbindlichen
Regel, die ich in T-184 (Z-20) geschrieben habe:**

> **P-9 (neu, verbindlich).** **Der Auslöser folgt dem Knopf.** Läßt sich der Absendeknopf
> drücken, kommt die Meldung beim **Absendeversuch** […]. Ist er von Anfang an gesperrt, kommt sie
> beim **Verlassen nach einer Eingabe** (P-8), **und** der Grund für die Sperre steht von der
> ersten Sekunde an als zustandsgebundener **Hinweis** daneben — nicht als Meldung. Das Vorbild
> ist `PoolRenameDialog.tsx:154-161` (Z-18), nicht die sechs neuen Meldungen.

Dasselbe Vorbild, dieselbe Bauform, dieselbe Begründung. Er hat sie wiedererfunden, ohne sie zu
nennen — und das ist **kein** Vorwurf an ihn, sondern ein Befund über die Regel:

**P-9s Wortlaut steht im ganzen Bestand nicht.** Gemessen über beides (versionierte Dateien
**und** Quellverzeichnisse, nach dem berichtigten E-087-Zusatz): `P-9` kommt außerhalb der
Berichte an genau drei Stellen vor, und **keine** davon trägt den Satz:

- `apps/web/src/components/Primitives.tsx` — *„und genau dort gehoert der Satz hin, der sagt, was
  fehlt (SC 3.3.1, Regel P-9)"*
- `docs/testplan.md` — *„ein Klick sagen kann, was fehlt (P-9)"*
- `.claude/team/board.md` — als Herkunftsangabe an O-FY

**P-8 dagegen steht wörtlich im Bestand**, als Blockzitat im Kopf von `apps/web/src/lib/touched.ts`
(*„Die Regel, wörtlich (T-184 Z-20, verbindlich)"*). Deshalb ist P-8 in dieser Sitzung dreimal
richtig zitiert worden und P-9 einmal wiedererfunden.

**Und die Regel ist im Bestand bereits in zwei Lesarten zerfallen.** Die einzige lesbare Spur von
P-9 im Produktivcode — der Satz in `Primitives.tsx` — steht am Kommentar zu `ariaDisabled` und
liest P-9 als Begründung für den **Umbau**. P-9s zweite Hälfte sagt das Gegenteil. Zwei Fassungen
derselben Zusage, an zwei Orten, ohne daß eine rot werden kann: genau die Klasse, die diese Wellen
viermal gekostet hat. Das ist nicht hypothetisch — es ist der Grund, warum diese Frage überhaupt
zweimal gestellt wurde.

### 1.2 Z-63 — die Sortenaufteilung taugt, schneidet aber an der falschen Kante

**A/B/C ist eine brauchbare Grundlage, und ich übernehme sie als Beschreibung.** Zwei Zeilen habe
ich nachgeprüft und beide halten:

- **Sorte A, `PoolRenameDialog`:** Der Hinweis ist **zustandsgebunden**, und beim Öffnen zeigt er
  nicht den Satz, den frontend-dev als Muster nennt. Gemessen: Der Dialog belegt mit `pool.name`
  vor, also ist `trimmed.length === 0` beim Öffnen **falsch** und `unchanged` **wahr** — es steht
  da: *„Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den Dialog."* Der Satz
  *„Ohne Namen geht es nicht: Er ist das, woran diese Regel auf dem Board und in den Pools
  erkennbar ist."* erscheint **erst, nachdem der Benutzer das Feld geleert hat**.
  **Das Muster ist also reaktiv, nicht dauerhaft-beim-Öffnen** — für den Sorte-C-Fall (blankes
  Pflichtfeld beim Öffnen) hat es im Bestand **kein** Vorbild. Frontend-dev nennt das Vorbild
  richtig und beschreibt falsch, was es an der entscheidenden Stelle tut.
- **Sorte C, die Sperre ohne Satz:** `StatusSettings.tsx` schreibt die Fehlerart selbst auf,
  wörtlich: *„Bei leerem Namen ist die Schaltfläche gesperrt — `onSubmit` läuft also nie, und eine
  Meldung, die dort entstünde, sähe niemand. […] **Ein Pflichtfeld, dessen Grund unerreichbar ist,
  ist ein gesperrter Knopf ohne Erklärung.**"* Die Diagnose ist im Bestand also schon vergeben.

**Aber der Schnitt, an dem sich die Antwort entscheidet, ist ein anderer.** A/B/C fragt: *steht der
Grund daneben?* Die Frage, die zählt, ist: **kann der Benutzer die Stelle, an der der Grund steht,
überhaupt sehen, wenn er den toten Knopf drückt?**

Und die ist **gemessen**, mit Zahlen, von visual-qa, und sie steht im Kopf von
`apps/web/src/lib/focus.ts`:

> Der Rumpf eines Formulardialogs scrollt (`.dialog__body--form`, `max-height: 60vh`). Wer mit der
> Tastatur bis zum Absendeknopf gelaufen ist und dort absendet, steht am unteren Ende dieses
> Ausschnitts. Die Absage entsteht oben am Titelfeld — gemessen bei 143,6px, waehrend der sichtbare
> Rand des gescrollten Bereichs bei 165,8px lag. Fuer einen sehenden Benutzer geschah damit sichtbar
> **nichts**.

T-202 hat dasselbe ein zweites Mal gemessen (*„Titelblock: -31.2..24.6 → GANZ OBERHALB des
Ausschnitts"*, zitiert in T-204). **Die Fußzeile scrollt nicht mit** — `.dialog__footer` steht
außerhalb von `.dialog__body--form`, und der Rumpf trägt den `bodyRef`.

**Damit gilt für `PoolFormDialog` im Anlegen-Fall:** Das Namensfeld ist das **erste** Element des
Rumpfes; darunter folgen Anzeigeort, drei `FormSection` mit `TagInput`, `RadioRow`, zwei
`FolderPicker`, ein Ankreuzfeld, `StatusPicker`, zwei weitere `RadioRow` und eine Vorschau. Wer die
Regel unten zusammenbaut und dann auf „Anlegen" sieht, hat das leere Namensfeld **nicht** vor sich.
Ein Hinweis darunter hilft ihm nicht — er liegt an derselben Stelle wie das Feld. Was hilft, ist
`revealFirstInvalidWithin`, und das ist genau die Funktion, die für diesen gemessenen Fall gebaut
wurde. Sie braucht einen Absendeversuch.

**Das ist die Stelle, an der P-9s zweite Hälfte nicht mehr trägt.** P-9 wurde in T-184 geschrieben;
`revealFirstInvalidWithin` gibt es seit T-202, und die Messung dahinter seit T-198. P-9 setzt
voraus, daß „daneben" heißt „im Bild". Bei einem von fünf Sorte-C-Dialogen ist das falsch, und es
ist der längste und der einzige, in dem jemand fünf Minuten arbeitet, bevor er den Knopf drückt.

### 1.3 Z-61 — Urteil: **der Umbau, für alle neun**

**Und zwar mit frontend-devs eigenen Zahlen. Zwei seiner drei nicht-in-Zeilen-meßbaren Kosten
halten der Nachprüfung nicht stand.**

**(a) „Die Messung aus O-GZ wöge achtmal." — Zweimal falsch.**

*Erstens ist O-GZ nicht offen.* Das Board führt ihn gestrichen: *„~~O-GZ~~ | gemessen in T-192,
beide Hälften — die Meldung **und** das Ausbleiben der Handlung."* Der Fall steht in
`tests/e2e/export-audit-and-locks.spec.ts` als TP-EXPST-15.

*Zweitens wöge er auch offen nicht achtmal.* O-GZ betrifft `ConfirmDialog.tsx#confirmOrExplain` —
einen Torwächter **an der Aufrufstelle**. Hier ist der Riegel **zentral**: eine Zeile, eine
Funktion, `FormDialog.tsx`. Acht Dialoge teilen ihn. Er wiegt **einmal**, und er ist mit **einem**
Prüffall zu messen (Auflage Z-64.1).

**(b) „Die Eingabetaste löst am `aria-disabled`-Knopf weiterhin ein Absenden aus." — Das ist der
Gewinn, nicht die Kosten.**

Heute ist der Absendeknopf `disabled` und zugleich der einzige `type="submit"` im Formular, also
sein Standardknopf. Eine gesperrte Standardschaltfläche nimmt der stillschweigenden Absendung
(*implicit submission*) ihre Wirkung. **Wer im frisch geöffneten Dialog „Neuen Tag anlegen" die
Eingabetaste drückt, löst also nichts aus und hört nichts** — eine bewußte Handlung ohne jede
Rückmeldung, an acht Produktdialogen. Nach dem Umbau läuft dieselbe Taste durch **denselben
zentralen Riegel** und löst die Rückführung aus.

*Gerechnet aus der Bauart und aus der Spezifikation von HTML, **nicht** im Browser gemessen* —
hier läuft keiner. Die Messung gehört in denselben Auftrag (Auflage Z-64.2).

**(c) „Playwright hält `aria-disabled='true'` für unbedienbar." — Richtig, real, und bereits im
Bestand behandelt.** `export-audit-and-locks.spec.ts` schreibt die Falle für den nächsten Prüffall
aus, samt der Begründung, warum `{ force: true }` dabei ein echtes Klickereignis bleibt. Das ist
eine bekannte Kosten, keine neue.

**Dazu vier Gründe, die für den Umbau sprechen und in seiner Aufstellung nicht vorkommen:**

1. **Er erfüllt P-9, statt sie zu brechen.** P-9s erste Hälfte lautet: *„Läßt sich der Absendeknopf
   drücken, kommt die Meldung beim Absendeversuch."* Der Umbau schiebt alle neun in **diese**
   Hälfte. Die zweite Hälfte verliert danach ihren Gegenstand — und das ist der bessere Zustand,
   denn P-9s eigener Anlaß war, daß es **zwei** Auslöser gab. Ich habe das in T-184 selbst so
   aufgeschrieben: *„Der Bestand trägt seit T-175 **zwei** Auslöser für dieselbe Meldungsklasse […]
   P-9 schreibt das auf, statt es weiter dem Zufall der Aufrufstelle zu überlassen."* **Aufschreiben
   war die schwächere von zwei Antworten; beseitigen ist die stärkere.** Neun in einer Bauart heißt
   hier: ein Auslöser statt zwei.
2. **Der Hinweis wurde nie beauftragt und ist nicht die billigere Antwort.** T-184 sagt wörtlich:
   *„Die zehn Dialoge mit `submitDisabled` nachträglich um einen Hinweis zu ergänzen ist eine
   eigene Aufgabe mit eigener Vorlage bei ui-designer; ich verlange sie hier nicht."* Diese Vorlage
   gibt es bis heute nicht. Der Hinweisweg braucht sie — plus **Text** an drei der fünf
   Sorte-C-Felder, denn dort ist das Hinweisfach **besetzt**: `Attachments.tsx` führt in allen drei
   Zweigen einen Hinweis (*„Nur „http" und „https". Takt speichert die Adresse, nicht die Seite."*
   und zwei weitere), `StatusSettings.tsx` ebenso (*„Der neue Status steht am Ende der Reihenfolge.
   Verschieben lässt er sich danach mit den Pfeilen."*). Ein Hinweis, der einen dieser Sätze
   verdrängt oder verlängert, ist eine Textentscheidung — E-078 Punkt 4: *„erst dann ändert
   frontend-dev Text."* **Der Umbau ist der einzige der beiden Wege, der ohne ux-designer auskommt.**
3. **E-078 Punkt 1 spricht gegen den Hinweis, und zwar an genau dieser Stelle.** *„Gestrichen wird,
   was **doppelt** dasteht, was **erklärt, was man sieht**, und was **auf Vorrat** erklärt."* Ein
   dauerhafter Satz „Ohne Namen geht es nicht" unter einem leeren Feld, das beschriftet ist, einen
   Stern trägt, ein vorgelesenes „(Pflichtfeld)" führt und sichtbar leer ist, ist alle drei
   zugleich. Der Gegensatz, den E-078 selbst zieht, trägt hier nicht: Er gilt einer Abwesenheit,
   *„die man sonst nicht sieht"*. Ein leeres Feld sieht man.
4. **Kein neuer Text.** Beim Umbau sagt die Meldung an Sorte C `„Name fehlt."` — der Satz steht
   schon da und wird heute nur nicht ausgelöst. E-078 ist erfüllt, weil **nichts hinzukommt**.

**Damit: neun Dialoge, eine Bauart, ein Auslöser, kein neuer Satz, keine ux-designer-Vorlage.**
Wenn der Orchestrator anders entscheidet, dann bitte nicht zum Hinweis, sondern zum **Nichtstun**
mit niedergeschriebener Regel (siehe Offene Frage 1) — der Hinweis ist der einzige der drei Wege,
gegen den eine Entscheidung steht.

### 1.4 Z-64 — drei Auflagen, **blockierend für denselben Auftrag**

1. **Der Riegel wird gemessen, bevor `disabled` fällt.** Heute ist `disabled` die **bauliche**
   Sicherung; danach ist es eine Zeile. Ein Prüffall am Formulardialog, **beide Hälften** wie bei
   O-GZ: der Absendeversuch führt zurück (Fokus auf dem ersten ungültigen Feld) **und** die
   Handlung läuft **nicht**. Ein Fall, der nur die Rückführung prüft, mißt die Hälfte — dieselbe
   Begründung, die T-192 für O-GZ ausgeschrieben hat.
2. **Die Eingabetaste bekommt einen eigenen Fall.** Meine Aussage in 1.3 (b) ist **gerechnet**, an
   der Bauart und an der HTML-Spezifikation, **nicht im Browser gemessen**. Sie ist die zweite
   tragende Säule des Urteils und darf nicht als Behauptung stehenbleiben. Zwei Messungen: heute
   („Eingabetaste im gesperrten Dialog löst nichts aus") und nachher („sie führt zurück und speichert
   nicht"). Fällt die erste anders aus, ist Säule (b) hin — das Urteil trägt dann noch auf 1.3 (a),
   Z-63 und den vier Gründen, aber der Orchestrator soll es wissen.
3. **Der Satz aus T-211 steht vorher.** Nach dem Umbau ist `PoolRenameDialog`s „Speichern"
   **anklickbar**, auch wenn der Name unverändert ist — und dafür gibt es heute einen Hinweis, aber
   keinen Satz auf einen Versuch. Ein klickbarer Knopf, der auf einen Klick **gar nichts** tut, ist
   schlechter als ein gesperrter. Ux-designer schreibt diesen Satz gerade (T-211). Der Umbau landet
   **mit ihm oder nach ihm**, nie davor.

**Dazu zwei Bedingungen, die keine Auflagen sind, sondern Ablauf:**

- **`FormDialog.tsx` gehört auch Bündel 0** (O-IQ, `MessageSlot` als erste Stelle). Zwei Aufträge,
  eine Datei — sie laufen **nacheinander**, nie parallel. Vorschlag: Bündel 0 zuerst (es ist ohnehin
  auf T-210 vorgemerkt), der Umbau danach.
- **Die Musterseite geht mit** (`showcase/ControlsSection.tsx`, `form === "blocked"`). E-076
  Punkt 3: Rolle, zugänglicher Name und Klassenname bleiben zeichengleich — der Knopf bleibt
  `button`, sein Name bleibt, und `components.css` faßt nach dem Kommentar an `Button` beide
  Sperrzustände in einem Selektor. Das ist zu **messen**, nicht anzunehmen.

---

## 2. O-IR — Dringlichkeit am Wirt statt Tonfall am Baustein

### 2.1 Z-65 — die Sache ist richtig, die Voraussetzung ist falsch

**Zur Sache: ja.** Die Begründung ist die des Bestands und sie trägt. `docs/design/textabbau-gestalt.md`
sagt:

> Eine Rolle, die mit dem Inhalt wechselt, ist wieder eine Rolle, die kommt und geht — genau der
> Fehler, den T-162 behoben hat. Eine Fläche, auf der eine Absage erscheinen **kann**, ist eine
> dringliche Fläche, auch in den Minuten, in denen nichts dasteht.

Das ist derselbe Satz, den `FormDialog.tsx#TextField` für die Feldfläche schon führt (*„`aria-live`
steht hier und die Rolle bleibt, wo sie ist: Eine Rolle, die kommt und geht, wäre genau der Fehler,
den T-162 behoben hat"*), und `.field__live` lebt seit T-162 danach. Eine zweite Bauart daneben
wäre der Fehler.

**Zur Voraussetzung: nein.** Der Satz *„Betroffen ist im Bestand keine Stelle: Die Bündel 0 bis 5
tragen ausschließlich `danger`"* hält der Messung nicht stand.

**Bündel 2** ist nach ui-designers eigener Liste *„`SettingsScreen` — die drei Stellen, eine Datei,
ein Agent"*. Die drei Stellen sind die aus T-200, und die dritte ist:

```
{issued === null ? null : (
  <InlineMessage tone="warning" title="Dieses Token steht genau jetzt hier — und nie wieder">
```

**`tone="warning"`, bedingt gerendert, unmittelbar nach einer Handlung, auf stehender Fläche** —
also Sorte 1, also ein Wirt, also von Regel E erfaßt (die nach 9.7 ausdrücklich `danger` **oder**
`warning` prüft). Heute sagt sie sich `role="status"` / `aria-live="polite"` an; unter `urgency` am
Wirt sagt sie sich an, was der Wirt sagt.

**Und es ist nicht irgendeine Stelle.** T-200 hat sie so eingeordnet: *„die Tokenmeldung […], die
unmittelbar auf eine Handlung folgt und deren Inhalt **einmalig** ist. Die dritte ist die
folgenreichste des Bereichs."* Der Klartext des Tokens steht dort genau einmal und nie wieder.

**Urteil: angenommen — mit der Berichtigung der Voraussetzung und einer Auflage.** Der billige
Zeitpunkt ist **nicht** „keine Stelle betroffen", sondern „genau eine, und wir wissen welche". Das
ist immer noch billig, aber es ist eine Entscheidung und keine Buchung. **Auflage:** Bündel 2 legt
die `urgency` seines Wirts **ausdrücklich und mit einem Satz Grund** fest, statt sie zu erben. Ich
schreibe den Wert nicht vor (das wäre Verfassen); ich verlange, daß er begründet dasteht. Für die
Abwägung, damit sie nicht bei null anfängt: `assertive` unterbricht, und WCAG rät dazu nur bei
Zeitkritischem — ein Wert, der nach dem Verlassen der Fläche unwiederbringlich weg ist, ist ein
plausibler Kandidat; „nur Warnung, kein Fehler" ist das plausible Gegenargument.

### 2.2 Z-66 — die Grenze, die im Papier fehlt: die Live-Region in der Live-Region kommt zurück

**Und sie kommt genau an der Stelle zurück, die Z-65 gefunden hat.** `MessageHostContext` stellt
`InlineMessage` still — er erreicht aber **nicht**, was in dessen `children` von Hand geschrieben
steht. In der Tokenmeldung steht dort:

```
<span className="token-actions__hint" role="status">
  {copyState === "done" ? "Kopiert." : … }
</span>
```

Also: ein `role="status"`, das seinen Text bei jedem Kopierversuch **ändert**, künftig **innerhalb**
eines Wirts mit `role="alert"` oder `role="status"`. Dazu zwei Schaltflächen und der Tokenwert
selbst. Das ist wörtlich das Problem aus **Z-53a** — nur eine Ebene tiefer, wo die bauliche Lösung
nicht mehr hinreicht.

`textabbau-gestalt.md` Abschnitt 9.8 nennt **drei** Grenzen des Wirts. Diese ist nicht dabei.
**Vorschlag:** als vierte Grenze aufnehmen, mit dem gemessenen Fall daneben — und Bündel 2 bekommt
die Bedingung, daß es die innere Rolle mitentscheidet, statt sie zu erben. Wer nur `MessageSlot`
darüberlegt, hat eine dringliche Fläche gebaut, in der ein zweiter Ansager sitzt.

**Kein neuer Auftrag.** Das gehört in Bündel 2, das es ohnehin geben wird.

### 2.3 Z-67 — `.tags-split__error` darf fallen, aber nicht nebenbei

**Der Klassenname fällt zu Recht, und E-076 Punkt 3 steht dem nicht entgegen.** Gemessen über
beides (versionierte Dateien und Quellverzeichnisse):

- `apps/web/src/screens/TagsScreen.tsx` — der einzige Setzer, an einem `InlineMessage`
- `apps/web/src/styles/app.css` — die einzige Regel, `grid-column: 1 / -1`, mit ihrem Kommentar
- `apps/web/scripts/proof-surface.mjs` — **zweimal**
- `docs/design/textabbau-gestalt.md`, zwei Berichte

**Kein Treffer in `tests/e2e` und keiner in `apps/*/test`.** Es fällt also **kein zugänglicher
Name**, keine Rolle, kein Token, kein Oberflächentext — nur ein Klassenname ohne Prüfer. Der
Vertrag in 9.9 ist an dieser Zeile richtig.

**Aber: der Fall macht eine Gegenprobe zur zweiten O-IN.** `proof-surface.mjs` führt den
Klassennamen an zwei Stellen, und beide sind nach dem Umzug Zitate auf etwas, das es nicht mehr
gibt:

```
['ein Baustein mit eigener Rolle', 'const V = () => <div><InlineMessage className="tags-split__error" /></div>;'],
```

und im Dateikopf zu Regel B: *„Ein `<InlineMessage className="tags-split__error">` trägt seine
Rolle in seiner eigenen Datei"*. Die Gegenprobe prüft eine **selbstgeschriebene Zeichenkette** —
sie wird also **niemals** rot, egal was im Produkt passiert. Genau die Bauart, die in O-IN gerade
als Befund auf dem Board steht, nur in einem Prüflauf statt in einem Prüffall.

**Vorschlag:** Wer `.tags-split__error` streicht, ersetzt in derselben Änderung den Klassennamen in
**beiden** Stellen von `proof-surface.mjs` durch einen, den es dann noch gibt (`.message`,
`.live-region`) — oder durch einen erkennbar erfundenen. Ein Klassenname in einer Gegenprobe ist
Beispielstoff und kein Vertrag; er darf erfunden sein, er darf nur nicht **falsch** sein. **Ein
Zeile, kein Auftrag, aber in demselben.**

---

## 3. O-HL, zweite Hälfte — Zuschnitt und der fallende zugängliche Name

### 3.1 Z-68 — eigener Auftrag, und was hineingehört

**Eigener Auftrag. Nicht angehängt.** Drei Gründe, in dieser Reihenfolge:

1. **Es gibt keinen laufenden Auftrag, an den es paßte.** T-209 (die Karte, A-A-45) läuft **jetzt**
   in frontend-devs Hand und faßt `BoardScreen.tsx`, `contrast-check.mjs` und die Stilblätter an —
   `NoteField.tsx` ist nicht dabei. Etwas an einen **laufenden** Auftrag zu hängen ist genau der
   Mechanismus, aus dem eine halb umgesetzte Sortierung entsteht.
2. **Der Zuschnitt ist nicht „eine Zeile".** Er ist **Z-47 plus die Auflage aus Z-48**, und die zwei
   gehören zusammen, weil sie **eine** Aussage sind: Am selben Baustein fällt die eine Eigenschaft
   und die andere bleibt. Stünde nachher `error` ohne `required` und ohne den Satz, der die
   Asymmetrie erklärt, dann liest der nächste Prüfer `error` als zweites Anzeichen derselben
   Sorte — und das ist wörtlich die Entstehungsgeschichte von O-HL (Z-19a war das erste, T-192s
   Frage 2 das zweite). E-081 Punkt 4: Änderung und ihre Begründung in **einem** Auftrag.
3. **Z-50 gehört nicht hinein.** Er sitzt in `apps/web/src/app/TimerContext.tsx`, und diese Datei
   gehört dem Bau des Nachtragswegs (O-HX, `reportStopped`). Zwei Aufträge, eine Datei — Z-50 geht
   mit O-HX oder danach, nicht hier.

**Also, als ein Auftrag an frontend-dev:**

- `apps/web/src/components/NoteField.tsx`: `required` ersatzlos (Eigenschaft, der
  `*`/`(Pflichtfeld)`-Zweig an der Beschriftung, `required` und `aria-required` am Textfeld);
  an `error` der eine Satz aus der Auflage zu Z-48 — welche Sorte Meldung hierher gehört (eine
  Absage des Dienstes an **diesem** Text) und welche nicht (die Sperre der Tagesgruppe, E-034, die
  eine Ebene höher steht).
- `apps/web/src/showcase/NotesSection.tsx`: der Musterblock, siehe Z-69.
- **Vorbedingung:** ein Satz von ux-designer, siehe Z-69. Ohne ihn ist es kein Ein-Agent-Auftrag.

### 3.2 Z-69 — der zugängliche Name: **im Produkt fällt keiner** — und ein Prüffall ist trotzdem die falsche Antwort

**Gemessen, heute, über beides.** `NoteField` mit `required` kommt im ganzen Baum an **einer**
Stelle vor: `apps/web/src/showcase/NotesSection.tsx`, im Block „Fehlerzustand". Die fünf
Produktaufrufe (zwei in `TimerContext.tsx`, einer in `BookingDialogs.tsx`, je einer in
`TodoFormDialog.tsx` und `TodoDetailScreen.tsx`) reichen weder `required` noch `error` herein —
T-200s Messung ist bestätigt.

**Also:**

| | fällt etwas? |
|---|---|
| **Im Produkt** | **nein.** Kein Aufrufer erzeugt den Zusatz; die Streichung ist dort **zeichenlos**. Die Zeichenkette „(Pflichtfeld)" bleibt im Produkt ohnehin erhalten — `FormDialog.tsx#TextField` führt sie und wird an sieben Stellen mit `required` gerufen |
| **Auf der Musterseite** | **ja.** Der zugängliche Name des Textfeldes verliert das vorgelesene „ (Pflichtfeld)"; der Stern ist `aria-hidden` und zählt nicht mit. Dazu fallen `required` und `aria-required` — ein **Zustand**, kein Name |

**Und deshalb: kein Prüffall auf diesen Namen.** Die Lehre aus O-EY („eine stille Rücknahme fällt
sonst niemandem auf") gilt für **Produktflächen** — dort ging „Dieser Arbeitsplatz" auf
„Arbeitsplatz", und ein Benutzer hörte den Unterschied. Hier ändert sich ein Name, den **kein
Benutzer je hört**. Ein Prüffall darauf hielte eine **Vorführung** fest, und genau daran ist T-192
hängengeblieben: eine Musterseite, die einen Zustand vorführt, den das Produkt nicht haben darf,
wird zum Vertrag. Das wäre die Falle, nicht ihre Vermeidung.

**Was statt dessen gehalten werden muß, und es steht schon:** `NoteField.error` bleibt (Z-48), und
an ihm hängt ein Lauf — `tests/e2e/timer-stop-announcement.spec.ts` mißt
*„`.note__live[role="alert"]` steht von Anfang an im Baum, leer, bevor der Dialog etwas zu melden
hätte"*, und `docs/testplan.md` schreibt denselben Fall aus. **Der Auftrag fährt diesen Fall.** Das
ist die Sicherung, die O-HL braucht, und sie ist gebaut.

**Der eigentliche Fund dieser Hälfte, und er ist der Grund, warum das nicht eine Zeile ist:**

**`required` allein zu streichen macht den Musterblock widersprüchlich.** Der Block setzt heute
**beides**:

```
<NoteField scope="billing" … required
  error="Ohne Eintrag im Feld „Leistung“ lässt sich diese Buchung nicht exportieren." />
```

Fällt nur `required`, steht dort ein Feld **ohne** Stern, **ohne** „(Pflichtfeld)" — und es tadelt
den Benutzer dafür, daß es leer ist. Heute erklärt wenigstens der Stern den Tadel; nachher erklärt
ihn nichts. **Das ist schlechter als der Zustand, den Z-47 behebt.**

Und der Satz selbst ist ohnehin gestrandet. Z-48 hat gemessen, warum: *„Gesperrt ist die
**Tagesgruppe**, nicht die Buchung. Eine einzelne Buchung ohne Leistung ist tadellos, solange eine
andere Buchung derselben Gruppe Text trägt."* Der Musterblock führt also die E-034-Bedingung der
**Gruppe** als Meldung am **Feld** vor — die eine Aussage, von der Z-48 sagt, ein Feld könne sie
*„gar nicht wahrheitsgemäß tragen"*.

**Vorschlag:**

- Der Musterblock **behält `error`** — er ist die **einzige** Stelle im ganzen Baum, an der dieser
  Zweig überhaupt vorgeführt wird. Fiele er mit, wäre `error` ein Zweig ohne jeden Aufrufer, und
  der nächste Prüfer meldet ihn als drittes Anzeichen derselben Sorte. Der Kreis schlösse sich.
- Der Musterblock **verliert `required`** und **bekommt einen anderen Fehlertext** — einen, der
  vorführt, wofür `error` da ist: eine **Absage des Dienstes an diesem Text**. Die Lage ist
  benannt und liegt als **O-AX** auf dem Board (`textSchema` = `z.string().max(20_000)` an der Tür
  gegen `maxLength={65536}` an der Fläche).
- **Der Satz ist ux-designers, nicht frontend-devs** (E-078 Punkt 4). Er ist kurz und er ist der
  einzige Grund, warum dieser Auftrag eine Vorbedingung hat.

---

## 4. O-IN — das veraltete Zitat im Prüffall

### 4.1 Z-70 — **ersetzt, nicht gestrichen. Und nicht durch ein zweites Zitat.**

**Der Befund stimmt.** `apps/web/test/lib/touched.test.ts` führt im vierten Fall
(„vorbelegtes Feld (Bearbeiten), unverändert verlassen → angefaßt, aber stumm") den Beleg:

> `touched.ts` sagt das selbst so („Es gilt als berührt — und bleibt trotzdem stumm, weil die
> Meldung darüber einen leeren Wert verlangt").

Dieser Satz steht in `apps/web/src/lib/touched.ts` **nicht mehr**. Er war die Abhängigkeit, die
O-HY beseitigt hat. Gemessen: die Datei führt heute statt dessen *„Was übrigbleibt, ist die zweite
Hälfte von P-8 — „oder nicht leer ist" —, und sie trägt seither **allein einen einzigen Fall**"*
und, im Abschnitt „Die Berichtigung", *„Ein unberührtes, **leerwirkendes** Feld erzeugt keine
Meldung, gleichgültig wie der Aufrufer seine Bedingung schreibt."*

**Ersetzt, nicht gestrichen — aus einem Grund, der am Prüffall selbst hängt.** Der Fall sichert
`touchedOnBlur("Kunden Nord", false) === true`. Die Behauptung „**aber stumm**" steht **nur im
Titel und im Zitat** — gemessen wird sie nicht. Streicht man das Zitat, bleibt ein Fall, der `true`
erwartet, ohne daß irgendwo stünde, warum `true` hier das Erwünschte ist. Der nächste Leser liest
`true` als „eine Meldung erscheint", und das ist das Gegenteil von P-8.

**Und der Ersatz darf kein zweites Zitat aus derselben fremden Datei sein.** Das ist der
Mechanismus, der gerade versagt hat, und er versagt beim nächsten Kopf-Durchgang wieder. Es ist
dieselbe Bauart, die ich in **Z-55** ausdrücklich als die richtige freigegeben habe, als documenter
einen Wortlaut **beschrieb**, statt ihn abzuschreiben: *„Ein Handbuch, das einen Wortlaut
abschreibt, den ein anderer Agent gerade ändert, ist genau die Abschrift ohne die Möglichkeit, rot
zu werden."* Ein Prüffall ist darin nicht besser gestellt als ein Handbuch — sein Kommentar wird
von keinem Lauf gelesen.

**Was ich vorschlage (die Sache; die Datei ist unit-testers, der Wortlaut auch):**

1. **Die Sache benennen statt zitieren:** Bei einem **nicht leeren** vorbelegten Wert kommt das
   Schweigen **weiterhin** von der Bedingung des Aufrufers — die Berichtigung O-HY hat die
   Abhängigkeit nur für den **leerwirkenden** Fall beseitigt, nicht für diesen. Das ist die
   Unterscheidung, auf die es ankommt, und der heutige Kopf von `touched.ts` trifft sie mit dem
   Wort „leerwirkend".
2. **Wenn zitiert wird, dann die Bedingung des Aufrufers, nicht einen Kommentar** — also
   `nameTouched && name.trim().length === 0` aus `TagsScreen.tsx`. Das ist der Code, auf dem das
   Schweigen wirklich ruht. Ohne Zeilenangabe (E-087 Punkt 4).
3. **Besser als beides, und in der Bauart, die die Datei schon hat:** Sie modelliert drei
   historische Fassungen als benannte Hilfsfunktionen (`wieVorT186`, `ersteT186Fassung`,
   `vorDerBerichtigungOHY`) und **mißt** damit, was sonst Prosa wäre. Eine vierte, die die
   Meldebedingung des Aufrufers abbildet, machte aus „aber stumm" eine **Zusicherung** statt einer
   Behauptung — und der Fall hörte auf, von einem fremden Kommentar abzuhängen. Das ist der
   Vorschlag, den ich empfehle; die anderen beiden sind die billigeren Rückfälle.

**Kein eigener Auftrag.** Eine Zeile in unit-testers Hoheit, an den nächsten Auftrag zu dieser Datei
gehängt.

---

## 5. Die Pflichtklickpfade, soweit dieser Bericht sie berührt

| Pfad | Stand |
|---|---|
| **Timer auf erledigtem Todo** | Unberührt. Z-68 nimmt Z-50 (Wechseldialog) ausdrücklich **nicht** mit — er bleibt bei O-HX. Der Stand aus T-200 gilt unverändert |
| **Exportstatus an jeder Stelle sichtbar** | Berührt von **Z-69**: Der Musterblock führt heute die E-034-Sperre der **Tagesgruppe** als Feldmeldung vor. Das ist eine Musterseite, kein Produktweg — aber es ist dieselbe Ebenenverwechslung, die Z-48 im Produkt verhindert hat. Berührt von **Z-65/Z-66** nur mittelbar (Bündel 2 ist `SettingsScreen`) |
| **Todo-Notiz nie im Export, Buchungsnotiz sichtbar** | Berührt von **Z-68/Z-69**, und die Trennung bleibt **unangetastet**: `scope`, die sechs Unterscheidungsmerkmale, das Banner, die Marke und `help` bleiben zeichengleich. Es fällt eine Pflicht, die kein Produktaufruf setzt. SP-09 steht weiterhin bei security-checker |
| **Vier Ebenen tiefer Ordnerbaum, Selbstverschiebung** | Berührt von **Z-61**: „Neuen Ordner anlegen" ist Sorte C und einer der acht. Nach dem Umbau bekommt der Absendeversuch dort eine Antwort. Berührt von **Z-67**: `.tags-split__error` trägt die Absage des Ziehens, in der auch die Selbstverschiebung landet — der Klassenname fällt, die Meldung nicht |
| **Standard-Tags auf jedem Erstellungsweg** | Unberührt. Kein Erstellungsweg ändert sich; `TodoFormDialog` führt **kein** `submitDisabled` und ist von O-IM nicht betroffen |
| **Vorlageneditor mit Vorschau auf offene Buchungen** | Berührt von **Z-61**: „Vorlage kopieren" (`TemplatesScreen`) ist Sorte B und einer der acht. Der Umbau ändert dort nichts Sichtbares — das Feld ist vorbelegt, also erscheint die Meldung ohnehin schon |

---

## 6. Befunde in Kurzform

```
Z-61  Alle Formulardialoge          Abweichung: Acht Produktdialoge sperren ihren Absendeknopf mit
      A-13.1, A-13.2, Abschnitt 15  `disabled`. Ein Absendeversuch findet nicht statt, also greift
      I-01/I-06/I-12/I-13, SC 3.3.1 weder die Rückführung (`revealFirstInvalidWithin`) noch eine
      P-9, E-078, E-084             Meldung. Die Eingabetaste ist im gesperrten Dialog ein
                                    stummer Leerlauf (gerechnet, nicht gemessen — Auflage 2).
                                    Vorschlag: UMBAU auf `ariaDisabled`, alle neun, ein Auslöser
                                    statt zwei. Der Riegel bleibt und ist ZENTRAL
                                    (`FormDialog.tsx`, `if (busy || submitDisabled) return;`) —
                                    er wiegt einmal, nicht achtmal. Kein neuer Text („Name
                                    fehlt." steht schon). Null Änderungen je Dialog über einen
                                    Zähler im Zusammenhang, den `TextField` liest — die Bauart
                                    von `FieldMessageQuietContext`. Der HINWEIS ist die
                                    schwächere Antwort (Z-63) und braucht als einziger Weg
                                    ux-designer.

Z-62  P-9 selbst                    Abweichung: Frontend-devs Vorschlag IST P-9, verbindlich seit
      P-9, E-087, E-063 Punkt 5     T-184 (Z-20). Er hat sie wiedererfunden, weil ihr WORTLAUT im
                                    ganzen Bestand nicht steht — `P-9` kommt außerhalb der
                                    Berichte nur als bare Verweisung vor (`Primitives.tsx`,
                                    `docs/testplan.md`, Board). P-8 dagegen steht als Blockzitat
                                    im Kopf von `touched.ts`, und P-8 ist in dieser Sitzung
                                    dreimal richtig zitiert worden. Die Regel ist im Bestand
                                    bereits in ZWEI Lesarten zerfallen: die einzige lesbare Spur
                                    (`Primitives.tsx`) liest P-9 als Begründung für den Umbau,
                                    P-9s zweite Hälfte sagt das Gegenteil.
                                    Vorschlag: P-9 kommt wörtlich in den Bestand, dorthin, wo sie
                                    gilt — an `submitDisabled` in `FormDialog.tsx`, in der Form,
                                    die `touched.ts` für P-8 vormacht. Nach dem Umbau als
                                    berichtigte Fassung: die zweite Hälfte hat keinen Gegenstand
                                    mehr, und das gehört dort zu lesen, nicht in einem Bericht.

Z-63  Sorte C, der Schnitt          Abweichung: A/B/C fragt „steht der Grund daneben?". Die Frage,
      A-13.1, SC 2.4.3, SC 3.3.1    die entscheidet, ist „kann der Benutzer die Stelle sehen?" —
                                    und die ist gemessen: `lib/focus.ts` führt visual-qas Zahlen
                                    („Absage bei 143,6px, sichtbarer Rand bei 165,8px"), T-202 hat
                                    es ein zweites Mal gemessen. Bei `PoolFormDialog` (Anlegen)
                                    steht das leere Namensfeld als ERSTES Element eines Rumpfes
                                    mit drei `FormSection`, zwei `FolderPicker`, `StatusPicker`
                                    und Vorschau; die Fußzeile scrollt nicht mit. Ein Hinweis
                                    unter dem Feld liegt dort so weit außerhalb des Bildes wie
                                    das Feld selbst. Dazu: das Muster trägt nicht — bei
                                    `PoolRenameDialog` erscheint „Ohne Namen geht es nicht" ERST,
                                    nachdem der Benutzer geleert hat; beim Öffnen steht dort „Der
                                    Name ist unverändert."
                                    Vorschlag: Der Schnitt gehört in den Auftrag, nicht die
                                    Sortenbeschreibung. Und er ist das Argument dafür, daß nur
                                    der Absendeversuch die eine Stelle erreicht, an der es zählt.

Z-64  Umbau, Auflagen               Abweichung: BLOCKIEREND für denselben Auftrag, drei.
      SC 3.3.1, E-081 Punkt 4       (1) Der Riegel wird gemessen, BEIDE Hälften wie O-GZ:
      E-076 Punkt 3, E-087          Rückführung läuft UND Handlung läuft nicht. Heute ist
                                    `disabled` die bauliche Sicherung, danach eine Zeile.
                                    (2) Die Eingabetaste bekommt zwei Messungen (heute stumm,
                                    nachher führend) — meine Aussage dazu ist GERECHNET, nicht im
                                    Browser gemessen, und sie trägt einen Teil des Urteils.
                                    (3) Der Satz aus T-211 („unverändert") steht vorher: ein
                                    klickbarer Knopf, der gar nichts tut, ist schlechter als ein
                                    gesperrter.
                                    Ablauf, keine Auflage: `FormDialog.tsx` gehört auch Bündel 0
                                    — nacheinander, nie parallel. Musterseite geht mit,
                                    E-076 Punkt 3 gemessen statt angenommen.

Z-65  MessageSlot, urgency          Abweichung: Die SACHE ist richtig (eine Rolle, die mit dem
      A-13.5, SC 4.1.3, E-087       Inhalt wechselt, ist der Fehler aus T-162). Die
                                    VORAUSSETZUNG ist falsch: „Betroffen ist im Bestand keine
                                    Stelle" hält nicht. `SettingsScreen.tsx` führt in Bündel 2
                                    `<InlineMessage tone="warning" title="Dieses Token steht
                                    genau jetzt hier — und nie wieder">`, bedingt gerendert, nach
                                    einer Handlung, auf stehender Fläche — Sorte 1, von Regel E
                                    erfaßt, heute `status`/`polite`. T-200 nennt sie „die
                                    folgenreichste des Bereichs".
                                    Vorschlag: ANGENOMMEN mit berichtigter Voraussetzung. Auflage:
                                    Bündel 2 legt die `urgency` seines Wirts ausdrücklich und mit
                                    einem Satz Grund fest, statt sie zu erben. Den Wert schreibe
                                    ich nicht vor.

Z-66  MessageSlot, vierte Grenze    Abweichung: `MessageHostContext` stellt `InlineMessage` still,
      SC 4.1.3, Z-53a               NICHT eine von Hand geschriebene Rolle in dessen `children`.
                                    In genau der Meldung aus Z-65 steht
                                    `<span className="token-actions__hint" role="status">`, dessen
                                    Text sich bei jedem Kopierversuch ändert — künftig INNERHALB
                                    des Wirts. Das ist Z-53a eine Ebene tiefer, wo die bauliche
                                    Lösung nicht mehr hinreicht. Abschnitt 9.8 nennt drei Grenzen;
                                    diese fehlt.
                                    Vorschlag: als vierte Grenze in 9.8 aufnehmen, mit dem
                                    gemessenen Fall daneben. Bündel 2 entscheidet die innere Rolle
                                    mit. Kein neuer Auftrag.

Z-67  .tags-split__error            Abweichung: Der Klassenname darf fallen — gemessen über
      E-076 Punkt 3, E-087          versionierte Dateien UND Quellverzeichnisse: kein Treffer in
                                    `tests/e2e`, keiner in `apps/*/test`. Kein zugänglicher Name,
                                    keine Rolle, kein Token fällt mit. ABER: `proof-surface.mjs`
                                    nennt ihn zweimal — im Dateikopf zu Regel B und in einer
                                    Gegenprobe, die eine SELBSTGESCHRIEBENE Zeichenkette prüft und
                                    deshalb NIE rot wird. Nach dem Umzug zitieren beide etwas,
                                    das es nicht gibt: dieselbe Bauart wie O-IN, nur in einem
                                    Prüflauf.
                                    Vorschlag: In derselben Änderung beide Stellen auf einen
                                    Klassennamen setzen, den es dann noch gibt (`.message`,
                                    `.live-region`) oder auf einen erkennbar erfundenen. Eine
                                    Zeile, kein Auftrag — aber in DEMSELBEN.

Z-68  NoteField, Zuschnitt          Abweichung: keine. O-HL zweite Hälfte, Zuschnittfrage.
      A-7.1, A-7.3, E-081 Punkt 4   Vorschlag: EIGENER AUFTRAG, nicht angehängt. Inhalt: Z-47
                                    (`required` ersatzlos, samt `aria-required` und dem
                                    Beschriftungszweig) PLUS die Auflage aus Z-48 (der eine Satz
                                    an `error`, welche Sorte Meldung hierher gehört und welche
                                    nicht). Beide zusammen, weil sie eine Aussage sind — sonst
                                    liest der nächste Prüfer `error` als drittes Anzeichen
                                    derselben Sorte, und das ist wörtlich die
                                    Entstehungsgeschichte von O-HL. OHNE Z-50: der sitzt in
                                    `TimerContext.tsx` und gehört zu O-HX. NICHT an T-209 hängen:
                                    der läuft.

Z-69  NoteField, Musterseite        Abweichung: Im PRODUKT fällt kein zugänglicher Name — kein
      A-7.3, E-034, E-076 Punkt 3   Aufrufer setzt `required`, die Streichung ist dort zeichenlos,
      E-078 Punkt 4, O-AX           und „(Pflichtfeld)" bleibt über `FormDialog.tsx#TextField`
                                    ohnehin im Produkt. Auf der MUSTERSEITE fällt einer. Ein
                                    Prüffall darauf ist die falsche Antwort: er hielte eine
                                    Vorführung fest, und genau daran ist T-192 hängengeblieben.
                                    Der eigentliche Fund: `required` ALLEIN zu streichen macht den
                                    Block widersprüchlich — er behielte
                                    `error="Ohne Eintrag im Feld „Leistung“ …"` an einem Feld ohne
                                    Stern und ohne „(Pflichtfeld)", und der Satz führt ohnehin die
                                    E-034-Bedingung der TAGESGRUPPE als Feldmeldung vor, also die
                                    eine Aussage, von der Z-48 sagt, ein Feld könne sie nicht
                                    wahrheitsgemäß tragen.
                                    Vorschlag: Der Block BEHÄLT `error` (er ist der einzige
                                    Ausführer dieses Zweigs im ganzen Baum — fiele er, wäre
                                    `error` zweiggleich tot und der Kreis schlösse sich),
                                    VERLIERT `required` und BEKOMMT einen anderen Fehlertext: eine
                                    Absage des Dienstes an DIESEM Text (O-AX). Der Satz ist
                                    ux-designers (E-078 Punkt 4) und ist die einzige Vorbedingung
                                    des Auftrags. Gehalten wird statt eines neuen Prüffalls der
                                    bestehende: `tests/e2e/timer-stop-announcement.spec.ts` mißt
                                    `.note__live[role="alert"]` — der Auftrag fährt ihn.

Z-70  Prüffall zu P-8               Abweichung: `apps/web/test/lib/touched.test.ts` belegt den
      P-8, E-087 Punkt 4, Z-55      vierten Fall mit „Es gilt als berührt — und bleibt trotzdem
                                    stumm, weil die Meldung darüber einen leeren Wert verlangt" —
                                    dieser Satz steht in `touched.ts` nicht mehr.
                                    Vorschlag: ERSETZT, nicht gestrichen. Gestrichen bliebe ein
                                    Fall, der `true` erwartet, ohne daß irgendwo stünde, warum
                                    `true` hier das Erwünschte ist — der nächste Leser liest das
                                    als „eine Meldung erscheint", das Gegenteil von P-8. UND NICHT
                                    durch ein zweites Zitat aus derselben Datei: das ist der
                                    Mechanismus, der gerade versagt hat, und Z-55 hat das
                                    Beschreiben-statt-Zitieren ausdrücklich als richtige Bauart
                                    freigegeben. Sache: bei einem NICHT leeren vorbelegten Wert
                                    kommt das Schweigen weiterhin vom Aufrufer — O-HY hat die
                                    Abhängigkeit nur für den LEERWIRKENDEN Fall beseitigt. Am
                                    besten in der Bauart, die die Datei schon hat: eine vierte
                                    Hilfsfunktion, die die Meldebedingung des Aufrufers abbildet,
                                    macht aus „aber stumm" eine Zusicherung statt einer
                                    Behauptung. Eine Zeile in unit-testers Hoheit, kein Auftrag.
```

---

## 7. Urteil

**Nacharbeit.** Blockierend sind zwei Auflagen, beide **eng** — blockierend für **ihren** Auftrag,
nicht für die Welle:

- **Z-64** (drei Auflagen an den Umbau: der gemessene Riegel, die gemessene Eingabetaste, der Satz
  aus T-211 vorher). Ohne (1) tauscht der Auftrag eine bauliche Sicherung gegen eine ungemessene
  Zeile; ohne (3) baut er einen Knopf, der klickt und schweigt.
- **Z-69** (der Musterblock: `required` fällt, `error` bleibt, der Fehlertext wird ersetzt). Ohne
  sie ist Z-47 keine Behebung, sondern ein Block, der schlechter dasteht als vorher.

**Freigegeben und ohne Vorbedingung entscheidbar:** **Z-61** (der Umbau, als Entscheidung),
**Z-62** (P-9 in den Bestand — Orchestrator, denn P-9 ist meine Regel und ihr Ort ist eine
Hoheitsfrage), **Z-65** (`urgency` am Wirt, mit berichtigter Voraussetzung), **Z-66** und **Z-67**
(beide gehen in Bündel 2 beziehungsweise Bündel 0/1 mit, kein eigener Auftrag), **Z-68** (der
Zuschnitt), **Z-70** (eine Zeile, angehängt).

**Ausdrücklich abgelehnt:** der **dauerhafte Hinweis** unter dem blanken Pflichtfeld für Sorte C
(Z-63, mit E-078 Punkt 1, mit dem nicht tragenden Muster und mit der Messung aus `focus.ts`). Wenn
der Orchestrator gegen den Umbau entscheidet, dann bitte zum **Nichtstun** mit niedergeschriebener
Regel — nicht zum Hinweis. Der Hinweis ist der einzige der drei Wege, gegen den eine Entscheidung
steht, und der einzige, der ux-designer braucht.

---

## 8. Annahmen, Risiken, offene Fragen

**Annahmen.**

1. **Die Eingabetaste im gesperrten Dialog ist ein stummer Leerlauf** — geschlossen aus der Bauart
   (der Absendeknopf ist der einzige `type="submit"` des Formulars, also sein Standardknopf) und aus
   der Spezifikation von HTML zur stillschweigenden Absendung. **Hier läuft kein Browser.** Das ist
   Säule (b) des Urteils zu Z-61 und steht deshalb als Auflage Z-64.2. Fällt die Messung anders aus,
   trägt das Urteil noch auf Z-63, auf 1.3 (a) und auf den vier Gründen — aber der Orchestrator soll
   die Abhängigkeit kennen.
2. **Die Sortenzuordnung A/B/C übernehme ich als Beschreibung**, nicht als eigene Zählung. Zwei
   Zeilen habe ich nachgeprüft (Sorte A am `PoolRenameDialog`, Sorte C an `StatusSettings`); die
   übrigen sieben nicht.
3. **Daß `PoolFormDialog` im Anlegen-Fall tatsächlich über den Ausschnitt hinausgeht, ist aus der
   Anzahl und Art der Elemente geschlossen**, nicht in Pixeln gemessen. Die Bauform (`max-height:
   60vh`, Fußzeile außerhalb des scrollenden Rumpfes) und die zwei vorliegenden Messungen aus
   T-198 und T-202 tragen den Fall; die Zahl für **diesen** Dialog fehlt. Sie wäre für visual-qa
   billig und würde Z-63 von einer Ableitung zu einer Messung machen.
4. **Für Z-65 habe ich die Tonart der Meldungen in den Bündeln 0 bis 5 gezählt, nicht die 42.**
   Gemessen sind: Bündel 0 (`FormDialog`, `danger`), 1 (`TagsScreen`, `danger`), 2
   (`SettingsScreen`: zweimal `danger`, **einmal `warning`**), 3 (`TodoDetailScreen`, `danger`),
   5 (`ExportScreen`, die zwei Vorschaufehler `danger`). Bündel 4 ist kein `InlineMessage`, sondern
   `<div className="updatebar" role="status">`. Eine Stelle genügt, um die Voraussetzung zu
   berichtigen; ob es bei einer bleibt, sagt der AST-Durchgang, nicht dieser Bericht.
5. **Ich habe P-9 nicht neu beschlossen, sondern ihren Anwendungsfall zurückgezogen.** Der Wortlaut
   der Regel bleibt, wie er in T-184 steht, bis der Orchestrator die berichtigte Fassung aus Z-62
   entscheidet. Bis dahin gilt P-9 unverändert — und wer heute einen **neuen** Dialog schreibt,
   folgt ihr.

**Risiken.**

1. **Z-61 ist ein Urteil gegen den, der gemessen hat, und das ist eine Lage mit Schlagseite.**
   Frontend-dev hat den Umbau gebaut hätte, hat ihn gegen sich selbst vorgelegt und trotzdem
   abgeraten — das ist die redlichste Form, in der eine Frage kommen kann. Ich widerspreche mit
   **seinen** Zahlen plus drei, die er nicht genommen hat (O-GZ ist geschlossen, der Riegel ist
   zentral, die Eingabetaste ist ein Gewinn). Wenn eine dieser drei fällt, fällt das Urteil mit —
   und die Auflage Z-64.2 ist genau dafür da.
2. **Der Umbau nimmt eine bauliche Sicherung weg.** `disabled` kann nicht versagen; ein Riegel kann.
   Das ist der Preis, er ist bekannt (O-GP hat ihn 2026-09-05 schon einmal bezahlt), und Auflage
   Z-64.1 ist die einzige Gegenleistung. Wer sie streicht, hat den Umbau ohne seine Bedingung
   gebaut.
3. **Z-62 ist die Sorte Befund, die man verbucht und nicht ausführt.** „Die Regel gehört in den
   Bestand" liest sich wie Papierarbeit. Sie ist der Grund, warum dieselbe Frage in dieser Sitzung
   zweimal gestellt wurde, und der Grund, warum ihre einzige Spur im Code sie heute falsch herum
   liest.
4. **Z-69 klein, aber es ist der dritte Durchgang derselben Sorte.** Zweimal wurde an `NoteField`
   ein Zweig ohne Aufrufer gefunden (Z-19a, dann T-192 Frage 2). Wer jetzt den Musterblock ganz
   streicht, statt ihn zu berichtigen, erzeugt den dritten — und diesmal an `error`, das ich
   ausdrücklich behalten habe.
5. **Z-65/Z-66 mittel:** Wird `urgency` am Wirt eingeführt und die Tokenmeldung nicht einzeln
   entschieden, ändert sich ihre Ansage stillschweigend, an der Stelle, an der der einmalige
   Klartext eines Tokens steht. Und mit ihr wandert ein zweiter Ansager in die neue Live-Region.

**Offene Fragen.**

1. **An den Orchestrator (Z-61):** Der Umbau ist mein Urteil, und er widerspricht dem Rat des
   Messenden. Wenn dagegen entschieden wird — bitte zum **Nichtstun** mit niedergeschriebener Regel
   und nicht zum Hinweis. Das Nichtstun ist vertretbar (an vier der fünf Sorte-C-Dialoge sieht der
   Benutzer das leere Pflichtfeld vor sich); es kostet nur den einen Fall aus Z-63 und die
   Eingabetaste.
2. **An den Orchestrator (Z-62):** P-9 gehört wörtlich in den Bestand, so wie P-8 in `touched.ts`.
   Wohin genau — `FormDialog.tsx` an `submitDisabled` ist mein Vorschlag —, und in welcher Fassung
   (vor oder nach dem Umbau), ist eine Hoheitsfrage und keine meine.
3. **An visual-qa (Z-63, klein):** Eine Zahl für `PoolFormDialog` im Anlegen-Fall — steht das leere
   Namensfeld außerhalb des Ausschnitts, wenn der Benutzer unten am Vorschaublock ist? Dieselbe
   Messung wie T-198, ein Dialog weiter. Sie macht aus meiner Ableitung eine Messung.
4. **An ux-designer (Z-69):** Ein Fehlertext für den Musterblock „Fehlerzustand" an `NoteField`,
   der zeigt, wofür `error` da ist — eine Absage des Dienstes an **diesem** Text (O-AX). Kurz. Er
   ist die einzige Vorbedingung des O-HL-Auftrags.
5. **An ui-designer (Z-65, Z-66):** Die `urgency` von Bündel 2 mit Grund, und die vierte Grenze in
   9.8. Beides gehört in sein Papier, nicht in ein neues.
