# T-221 — Zwei Wortlaute freigegeben, zwei Berichtigungen bestätigt, und ein B, das als Fehler zugestellt wird

**Rolle:** spec-ux-reviewer **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`

**Gelesen:** `docs/spec.md` (Abschnitte 3, 5, 7, 8, 13), `docs/design/textbestand.md` (S-07, S-15,
12.9, 12.10, Abschnitt 13 und 14 vollständig), `docs/design/textabbau-gestalt.md` (9.1, 9.8, 9.10,
9.11), `.claude/team/decisions.md` (E-034, E-078, E-081, E-087, E-092, E-093), Berichte **T-177**
(P-1 bis P-7), **T-207**, **T-211**, **T-212** (eigener), **T-213**, **T-217**, **T-218**, **T-219**,
dazu am laufenden Baum: `apps/web/src/screens/PoolRenameDialog.tsx`,
`apps/web/src/components/FormDialog.tsx`, `NoteField.tsx`, `ConfirmDialog.tsx`,
`apps/web/src/lib/fieldMessages.ts`, `lib/focus.ts`, `apps/web/src/app/TimerContext.tsx`,
`app/dayGroup.ts`, `apps/web/src/showcase/NotesSection.tsx`, `showcase/InventorySection.tsx`,
`apps/web/src/screens/SettingsScreen.tsx`, `apps/web/src/api/client.ts`,
`apps/web/src/styles/app.css`, `styles/components.css`, `apps/local-api/src/http/input.ts`,
`apps/local-api/src/usecases/export.ts`, `tests/e2e/timer-stop-announcement.spec.ts`.

**Zur Form (E-087 Punkt 4).** Keine Zeilennummern für fremde Dateien. Belegt wird mit Datei und
**Zitat**. **Kein Produktivcode angefaßt.** Einzige geschriebene Datei: dieser Bericht.

---

## Kurzfassung

```
Aufgabe: T-221 — Genehmigung 13.3/S-15 (T-211), Genehmigung 14.3/14.5 (T-219),
         Bestätigung zweier Berichtigungen (12.10 und die Angleichungsrichtung),
         Nachschau auf O-IR nach der Selbstberichtigung des ui-designer
Status: braucht Review — beide Wortlaute FREIGEGEBEN, vier Auflagen blockierend
        für ihren jeweiligen Auftrag, keine für die Welle
```

| Gegenstand | Urteil |
|---|---|
| **13.3** der Satz für „unverändert" | **freigegeben, zeichengleich** — Z-71 |
| **S-15** als Regelnummer | **abgelehnt — nicht die Regel, die Nummer.** Sie ist im selben Papier bereits vergeben — Z-72, **blockierend für ux-designer** |
| **13.5** AK 3/4/5 — der Weg des Satzes | **Nacharbeit, blockierend.** Das Papier nennt den Satz ein **B** und stellt ihn dann durch den **Fehlerkanal** zu: `aria-invalid`, roter Rand, `--danger-text` — Z-73 |
| **13.5** AK 1 — „bleibt ein Baustein" | **er ist heute keiner** — Z-74, blockierend und klein |
| **13.5** AK 7 gegen AK 4 | **AK 7, wie sie dasteht, hebt AK 4 auf** — Z-75, blockierend für die Wirkung |
| **13.3** Länge gegen P-1 | **nicht entschieden, und das muß entschieden werden** — Z-76 |
| **14.3** der Fehlertext des Musterblocks | **freigegeben, zeichengleich** — Z-78 |
| **14.5** drei Angaben, zwei Nicht-Änderungen | **freigegeben**, mit zwei Auflagen in denselben Auftrag — Z-79 |
| **12.10** die eigene Zahl für nicht belegt erklärt | **trägt — nachgemessen und bestätigt.** Meine Freigabe aus Z-57 Auflage 2 bleibt und steht ab jetzt auf drei Gründen statt auf vier — Z-80 |
| **T-211** die Angleichungsrichtung | **trägt** — mit einer Einordnung, damit Grund 3 kein Freibrief wird — Z-81 |
| **O-IR / Z-65** | **erfüllt.** `polite` mit einem Satz Grund — Z-82 |
| **O-IR / Z-66** | **in der Sache erfüllt, im Ort nicht.** Der verbindliche Satz steht im Nachtrag; 9.1 und 9.8 sagen weiter das Alte — Z-83, und es ist E-092 ein Papier weiter |
| „**Bitte** steht nirgends in Takt" (13.3 **und** 14.4) | **falsch, gemessen** — Z-77. Das Urteil über die verworfenen Fassungen ändert sich nicht, die Begründung schon |

---

## 1. Der Satz für den unveränderten Namen (T-211, Abschnitt 13.3)

### 1.1 Was ich nachgemessen habe, bevor ich urteile

| Behauptung des Papiers | Nachmessung |
|---|---|
| Der Hinweis steht heute so in `PoolRenameDialog` | **zeichengleich bestätigt:** *„Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den Dialog."* — derselbe Gedankenstrich, dieselben Satzzeichen |
| Der Zustand hat im ganzen Produkt keinen Satz | **bestätigt.** `blocked = trimmed.length === 0 \|\| unchanged \|\| taken`, und `fieldError` ist **allein** für `taken` gesetzt. Für `unchanged` gibt es einen **Hinweis** und keine Absage |
| Satz 1 nimmt das Wort des Knopfes | **bestätigt:** `submitLabel="Speichern"` |
| Der Dialog hat den Grund selbst aufgeschrieben | **bestätigt**, im Kopfkommentar: *„Ein `PATCH`, der nichts ändert, wäre eine Meldung ohne Ereignis."* |
| Ein nativ `disabled` Knopf ist stumm, Enter läuft leer | **gemessen von visual-qa in T-217**, mit Gegenprobe: *„Netzwerkaufrufe an 127.0.0.1:17843 nach Enter: [] (keiner)"*, *„`role="alert"`-Text im Dialog nach Enter: "" (leer)"* — und dieselbe Taste greift nach dem Ausfüllen sofort |

**Damit ist die Voraussetzung des Abschnitts gemessen und nicht mehr gerechnet.** Meine eigene
Säule (b) aus Z-61 steht; E-093 Punkt 2 hat sie zu Recht als Entscheidungsgrund geführt.

### 1.2 Z-71 — der Wortlaut ist freigegeben

> **Es gibt nichts zu speichern. Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den
> Dialog.**

**Freigegeben, zeichengleich.** Vier Gründe, in dieser Rangfolge:

1. **Er trifft den Zustand und keinen Nachbarzustand.** Der Wert ist da, er ist gültig, er ist der
   gespeicherte. Der Satz sagt nichts anderes.
2. **Er nennt, was der Druck bewirkt hat.** Das ist die Lücke, die T-207 gemeldet hat, und keine
   der sieben verworfenen Fassungen schließt sie. Die letzte Zeile der Tabelle — der Hinweis
   **allein** — ist die einzige, die überhaupt in Frage kam, und ihre Begründung ist die richtige:
   *„Der Benutzer drückt und liest denselben Satz wie vorher."*
3. **Er baut keine zweite Fassung.** Ein Baustein plus ein vorangestellter Satz. Das ist dieselbe
   Disziplin, die ich mit Z-58 für den Stopprumpf verlangt habe, und sie ist hier von selbst
   angewandt worden.
4. **Er nennt beide Ausgänge**, und der zweite („schließen") ist der, den eine Absage sonst
   verschweigt.

**Die sieben Verwerfungen halten**, jede aus dem angegebenen Grund. Eine Begründung ist falsch —
siehe Z-77 —, das Urteil über die Fassung ändert sich dadurch nicht.

### 1.3 Z-72 — **blockierend:** die Regelnummer S-15 ist vergeben

**`docs/design/textbestand.md` führt bereits eine Regel S-15**, im Bestandsteil, Abschnitt 4:

> **### S-15 Zugängliche Namen (`aria-label`, `visually-hidden`)** … **Regel S-15.**
> - **Handlung + Gegenstand.** Nie der Elementtyp …

und 13.3 legt daneben:

> **Regel S-15 — die Absage einer Handlung ohne Gegenstand.**

**Zwei verschiedene verbindliche Regeln unter einer Nummer, im selben Dokument.** Das ist nicht
Formalismus: Die erste ist ausdrücklich **vertraglich** (*„286 `getByRole`-Zugriffe. Jede Änderung
hier ist eine Änderung an Prüffällen"*). Wer künftig „nach S-15" schreibt, meint eines von beiden,
und niemand kann es entscheiden. **Die Ansteckung hat bereits stattgefunden:** T-219 nennt in seiner
Grundlagenzeile *„Regel **S-15**"* — ein Papier weiter, eine Welle später.

Das ist E-092 in seiner zweiten Gestalt. E-092 sagt: eine Regel, die niemand **findet**, ist keine
Regel. Eine Regel, die man findet und dabei die falsche erwischt, ist schlechter.

**Vorschlag:** Die neue Regel bekommt eine freie Nummer, gebunden an ihre Textsorte — das ist die
Bauart, die S-13a in derselben Runde vorgemacht hat. Eine Absage in einem Dialog gehört zu **S-12**
(*„Dialoge: Titel, Beschreibung, Folge, Absage, Bestätigungshaken"*), also läge **S-12a** nahe. Die
Nummer wählt ux-designer, nicht ich; verlangt ist allein, daß sie frei ist. **Vor der Vergabe
zitiert niemand diese Regel** — auch T-219s Grundlagenzeile nicht.

### 1.4 Z-73 — **blockierend:** das Papier nennt den Satz ein **B** und stellt ihn als Fehler zu

**Das ist der eigentliche Befund dieser Prüfung, und er sitzt nicht im Wortlaut, sondern im Weg.**

13.1 legt sich ausdrücklich fest:

> Nach dem Raster in Abschnitt 2 ist das ein **B** — eine Absage mit Begründung —, und ausdrücklich
> **keine** Fehlermeldung. Der Unterschied ist nicht Höflichkeit: Eine Fehlermeldung behauptet, an
> der Eingabe sei etwas falsch. Hier ist nichts falsch.

13.5 schickt ihn dann durch den Kanal, der genau das behauptet:

- **AK 5:** *„Die Ansage kommt aus der vorhandenen Meldefläche des Feldes … Der Wirt ist der, den
  `TextField` ohnehin führt."* — Diese Fläche ist `.field__live`, und sie wird **allein** aus
  `shownError` gefüllt.
- **AK 4:** *„Der Fokus geht in das Feld … (`revealFirstInvalidWithin` ist gebaut)"* — und diese
  Funktion sucht, wie ihr eigener Kopf sagt, *„`aria-invalid=\"true\"` und nichts anderes"*.

Gemessen, was dabei entsteht (`FormDialog.tsx`, `app.css`):

| Am Feld | Wert |
|---|---|
| `aria-invalid` | `shownError === undefined ? undefined : true` → **`true`** |
| Klassenname am Eingabefeld | `field__input--invalid` |
| `.field__input--invalid` | `border-color: var(--danger-text)` |
| `.field__error` | `color: var(--danger-text)` |

**Also:** ein rot umrandetes Feld, ein roter Satz darunter, und für jede Vorlesehilfe die maschinell
gelesene Aussage *dieser Wert ist ungültig* — an einem Wert, von dem dasselbe Papier zwei Seiten
vorher sagt, er sei *„gültig; er ist der gespeicherte"*, und dessen Gegenteil zu behaupten es unter
„Ungültiger Name." mit der Begründung verwirft, *„eine Anwendung, die den eigenen Bestand für
ungültig erklärt, ist an dieser Stelle nicht mehr glaubwürdig"*.

**Die Unterscheidung aus 13.1 stirbt damit in der Zustellung.** Sie ist im Wortlaut sorgfältig
gezogen und in der Bauart wieder aufgehoben — und die Bauart ist die Hälfte, die der Benutzer sieht
und die Vorlesehilfe sagt.

**Und das Papier kennt den richtigen Kanal, es zitiert ihn selbst.** 13.2 nennt als Vorbild
`ConfirmDialog.refusal`: *„dieselbe Bewegung, die `ConfirmDialog.refusal` seit T-118 macht (die
Absage tritt an die Stelle der Vorwarnung, S-12)"*. Nachgemessen, wie diese Bewegung dort gebaut
ist:

```
<div role="status">
  {refusal === undefined ? null : (
    <p className="dialog__consequence">
```

**`role="status"`, `.dialog__consequence`, kein `aria-invalid` — die Gefahrenfarbe trägt es dagegen
sehr wohl** (`components.css`, Regel `.dialog__consequence`): `color: var(--danger-text)`,
`background-color: var(--danger-bg-subtle)`, `border-inline-start: 3px solid var(--danger-bg)`. Das
genau zitierte Vorbild ist ein **nicht**-Fehlerkanal **im maschinell Gelesenen**, nicht im
Augenschein — und **das** ist der Unterschied, auf den es ankommt. 13.5 folgt ihm im Satzbau und
verläßt ihn dort, wo es zählt: bei `aria-invalid`.

> **Berichtigt am 2026-09-06 (T-237, O-KE) — und es ist eine Berichtigung der Begründung, keine
> Rücknahme des Urteils.**
>
> Hier stand bis eben *„`role=\"status\"`, `.dialog__consequence`, kein `aria-invalid`, **keine
> Gefahrenfarbe**"*. Der vierte Punkt hält der Messung nicht stand. frontend-dev hat ihn in T-220
> Abschnitt 7.3 am gezeichneten Baum widerlegt, T-237 hat ihn an der Quelle nachgemessen: Die Fläche
> trägt die Gefahrenfarbe **dreifach** — als Text (`--danger-text`), als getönten Grund
> (`--danger-bg-subtle`) und als Schiene. **Die Schiene kommt aus `--danger-bg`, nicht aus
> `--danger-text`.** Am Bild ist das im hellen Schema dasselbe `#ac2a22`, an der **Marke** nicht:
> Wer sie ändern will, trifft über `--danger-bg` jeden gefüllten Gefahrenknopf mit.
>
> **Das Urteil steht auf demselben Bein.** Z-73 hatte nie vier Beine, sondern **eines und drei
> Merkmale.** Der tragende Satz dieses Abschnitts ist der über die maschinell gelesene Aussage
> *dieser Wert ist ungültig* an einem gültigen, gespeicherten Wert — und **E-093 Punkt 5 hat genau
> dieses eine verbindlich gemacht**: *„Es ist der einzige Befund dieser Runde, der einer Vorlesehilfe
> etwas **Falsches sagt**."* Die Gefahrenfarbe sagt nichts Falsches; sie sagt „hier ist eine Wand",
> und da ist eine. `aria-invalid="true"` behauptet etwas über den **Bestand des Benutzers**, und das
> ist falsch. Gefallen ist damit eine **Zierde**, kein Bein — anders als in T-228, wo bei 13.3 ein
> Bein wegbrach und ux-designer ein neues finden mußte.
>
> **Der Satz unter 1. bleibt unberührt und ist unverändert richtig.** Der **Feldkanal** trägt die
> Gefahrenfarbe tatsächlich (`.field__input--invalid` → `border-color: var(--danger-text)`,
> `.field__error` → `color: var(--danger-text)`). Wer diese Stelle berichtigt, nimmt jene **nicht**
> mit.
>
> **Was sich sonst ändert, und nur das:** Der unter 2. beschriebene Ausgang existiert im Bestand
> nicht so, wie er dort beschrieben war. Gebaut ist deshalb ein **drittes** Ding, das niemand
> benannt hatte — Statusfläche, **kein** `aria-invalid`, **mit** Gefahrenfarbe. Es ist von E-093
> Punkt 5 gedeckt (dort steht allein `aria-invalid` als Zusage), es ist die richtige Wahl, und
> frontend-dev ist zu Recht dem **Vorbild** und nicht dem **Nebensatz** gefolgt (T-220 Annahme 1).
> `docs/design/textbestand.md` 13.4 schreibt es seit T-228 von sich aus richtig: *„ohne
> `aria-invalid`, **ohne Fehlerfarbe am Feld**"* — der Zusatz **„am Feld"** ist genau die
> Unterscheidung, die diesem Absatz gefehlt hat.

**Vorschlag — eine Entscheidung, zwei zulässige Ausgänge, beide im Papier zu benennen:**

1. **Der Kanal bleibt `error`, und das Papier schreibt hin, daß dieses B mit `aria-invalid` und in
   Gefahrenfarbe erscheint, und warum das hinnehmbar ist.** Das ist vertretbar — die Rückführung
   hängt daran —, aber es ist eine Entscheidung gegen den eigenen Satz aus 13.1 und darf nicht
   stillschweigend fallen. Dann gehört in 13.1 ein Satz: *das B trägt hier die Gestalt eines
   Fehlers, weil die Rückführung an `aria-invalid` hängt.*
2. **Der Kanal ist der aus dem eigenen Vorbild** — eine Fläche mit `role="status"` an derselben
   Stelle, ohne `aria-invalid`, **in der Gestalt des Vorbilds, also mit dessen Gefahrenfarbe auf
   getöntem Grund** (berichtigt am 2026-09-06, T-237/O-KE; hier stand *„ohne Gefahrenfarbe"* —
   siehe den Kasten oben). Dann trägt AK 4 **nicht** mehr, weil `revealFirstInvalidWithin` nichts
   findet, und der Fokus muß von der Aufrufstelle gesetzt werden. Das ist mehr Arbeit und die
   ehrlichere Fläche.

**Ich schreibe den Ausgang nicht vor** (E-078 Punkt 4 — der Wortlaut ist ux-designers, die Zeile
frontend-devs). Ich verlange, daß **einer von beiden dasteht**, bevor gebaut wird. Was nicht geht,
ist die heutige Lage: 13.1 sagt „kein Fehler", 13.5 baut einen.

### 1.5 Z-74 — **blockierend, klein:** AK 1 sagt „bleibt ein Baustein"; er ist heute keiner

AK 1: *„Der Hinweis bleibt zeichengleich und bleibt **ein** Baustein. Die Absage setzt ihren ersten
Satz davor; sie schreibt ihn nicht ab."*

**„Bleibt" setzt voraus, daß er einer ist. Er ist keiner.** In `PoolRenameDialog.tsx` steht er als
Zeichenkette **in einer verschachtelten Ternärkette**, zwischen dem Satz für das leere Feld und dem
Satz für den geänderten Namen. Es gibt keinen Namen, unter dem ein zweiter Ort ihn holen könnte.

Damit hat frontend-dev nach AK 1 nur zwei Wege, und einer davon ist verboten: abschreiben (AK 1
untersagt es) oder **eine benannte Konstante herausziehen** — eine Änderung, die keine AK verlangt
und die deshalb beim Bauen als Freiheit erscheint.

**Vorschlag:** AK 1 wird um einen Halbsatz ergänzt: *der Hinweis wird in derselben Änderung zu einer
benannten Konstante, aus der beide Fälle lesen.* Das ist E-081 Punkt 4 (Änderung und ihre Bedingung
in **einem** Auftrag) und kostet eine Zeile.

### 1.6 Z-75 — **blockierend für die Wirkung:** AK 7 hebt AK 4 auf

AK 7: *„Der Riegel im Formular **bleibt**. Ein `aria-disabled`-Knopf ist anklickbar, und die
Eingabetaste im Formular löst `submit` weiterhin aus — es wird **kein** `PATCH` gesendet."*

**Wörtlich genommen ist das gebaut — und der freigegebene Satz erscheint dann nie.** Gemessen in
`FormDialog.tsx`:

```
event.preventDefault();
if (busy || submitDisabled) return;
setSubmitAttempt((count) => count + 1);
setQuiet(true);
onSubmit();
```

Der Riegel steht **vor** `setSubmitAttempt`. `revealFirstInvalidWithin` hängt an `submitAttempt`.
Bleibt der Riegel, wo er ist, dann führt der gesperrte Versuch **weder** die Rückführung aus
**noch** die Stillstellung der Meldeflächen — und weil die Aufrufstelle ihren `onSubmit` nie
erreicht, setzt sie auch ihren Versuchszustand nicht. **Der Knopf ist dann klickbar und stumm** —
genau der Zustand, den ich mit Z-64.3 als *„schlechter als ein gesperrter"* bezeichnet habe und
gegen den dieser ganze Abschnitt geschrieben wurde. frontend-dev hat es in T-207 richtig geplant
(*„im `submit` beim gesperrten Versuch `submitAttempt` und `quiet` setzen, aber `onSubmit` **nicht**
rufen"*) — aber diese Zeile steht in einem Bericht und nicht in den Akzeptanzkriterien, aus denen
gebaut wird. **Das ist E-092, drei Tage nach E-092.**

**Vorschlag:** AK 7 heißt künftig: *Der Riegel hält die **Handlung** auf, nicht den **Versuch**. Ein
gesperrter Absendeversuch zählt weiter, stellt die Meldeflächen still und löst die Rückführung aus;
allein `onSubmit` unterbleibt. Gemessen wird beides — daß die Absage erscheint **und** daß kein
`PATCH` läuft* (dieselbe Doppelmessung wie Z-64.1 und O-GZ).

### 1.7 Z-76 — die Länge gegen P-1 ist nicht entschieden

Der Satz ist **102 Zeichen und drei Sätze**. P-1 steht seit E-092 im Wortlaut in `decisions.md`:

> Ein Satz, mit Punkt … Die Grundform nach P-3 bleibt bei **60 Zeichen**. Ein Satz mit dem zweiten
> Halbsatz aus P-4 darf **80**.

Nach AK 5 landet er in der Meldefläche des Feldes — also in dem Kanal, für den P-1 die Form setzt.
**Das Papier erwähnt die Grenze mit keinem Wort.** Für 14.3 hat derselbe Verfasser die Rechnung
ausdrücklich geführt (*„39 Zeichen … Länge unter der Grenze aus P-1"*); hier fehlt sie.

**Es ist keine Ablehnung.** Zwei Auflösungen sind vertretbar, und beide muß das Papier aussprechen:
entweder P-1 gilt der **Pflichtfeldmeldung** und nicht dem **B** (dann steht das da, mit dem
Verweis auf das Raster in Abschnitt 2), oder P-1 gilt und dieser Satz nimmt eine benannte Ausnahme
— so, wie S-13a die Sechs-Wörter-Grenze für die **zitierte** Hälfte eines Titels ausgenommen hat.
**Was nicht geht, ist Schweigen:** Die nächste Absage nach diesem Muster wird sonst mit 102 Zeichen
gebaut, weil diese hier es durfte, ohne daß jemand es gesagt hat.

### 1.8 Z-77 — „Bitte steht nirgends in Takt" ist falsch, gemessen

Zweimal begründet, in beiden Papieren, mit demselben Satz:

- 13.3: *„»Bitte« steht nirgends im Produkt (S-07 hält das für Knopftexte fest, und für Sätze gilt
  es genauso)."*
- 14.4: *„»Bitte« steht im Produkt an keiner Stelle (S-07, P-1)."*

**Gemessen (ripgrep über den Arbeitsbaum, 2026-09-06) — es steht an mindestens sieben Stellen im
Oberflächentext:**

| Ort | Wortlaut |
|---|---|
| `apps/web/src/api/client.ts` | „Unbekannter Fehler. **Bitte** versuchen Sie es erneut." |
| `apps/web/src/app/TimerContext.tsx` | „Es läuft weiterhin ein Timer. **Bitte** starten Sie erneut." |
| `apps/web/src/components/Select.tsx` | Platzhalter „**Bitte** wählen" |
| `apps/local-api/src/usecases/export.ts` | „Es ist kein Exportordner eingestellt. **Bitte** in den Einstellungen einen wählen." |
| `apps/local-api/src/startup.ts` | mehrfach, u. a. „**Bitte** die neuere Fassung verwenden." |
| `apps/local-api/src/errors.ts` | „Zugriff nicht möglich. **Bitte** das Takt-Token prüfen." |
| `apps/local-api/src/usecases/tag-names.ts` | „… **Bitte** wählen Sie das gemeinte Tag ausdrücklich aus." |

**S-07 sagt es richtig und enger:** sein Befund lautet *„Nirgends »OK«, nirgends »Ja«, nirgends
»Bitte«"* — und er handelt von **Knopftexten**. Die Verallgemeinerung auf „das Produkt" ist im Papier
hinzugekommen und ist falsch.

**Zwei Folgen, und die zweite ist die unangenehme:**

1. Das **Urteil** über die verworfenen Fassungen bleibt richtig: P-1 verbietet „Bitte" in einer
   Feldmeldung ausdrücklich, und dieser Grund allein trägt. Nur die Begründung „gibt es nirgends"
   fällt.
2. Die erste Zeile der Tabelle ist der Rückfallsatz von `errorMessage`. Und 12.10 verlangt: *„Der
   Satz des Dienstes steht in L3 **immer, wörtlich und ungekürzt**."* **In der häufigsten L3-Meldung
   des Produkts steht damit ein »Bitte«, das wir selbst durchreichen** — die beiden Papierregeln
   stehen gegeneinander, solange die falsche Behauptung als Regel gelesen wird.

**Vorschlag:** Beide Stellen auf den Geltungsbereich zurücknehmen (S-07 = Knopftexte, P-1 =
Feldmeldung). **Nicht** stillschweigend ersetzen — benennen, wie es 12.10 vorgemacht hat.

---

## 2. Der Fehlertext des Musterblocks (T-219, Abschnitt 14.3 und 14.5)

### 2.1 Was ich nachgemessen habe

| Behauptung | Nachmessung |
|---|---|
| `textSchema` ist die einzige Regel der Tür auf diesen Text, ohne Zeichenprüfung | **bestätigt:** `export const textSchema = z.string().max(20_000);` — `titleSchema` und `nameSchema` daneben tragen `withoutControlCharacters(...)`, `textSchema` nicht. Kommentar dort: *„Leistung und Vermerk. 1 MB Rumpfgrenze steht davor (B-1.7)."* |
| Fünf Produktaufrufe, keiner reicht `error` oder `required` | **bestätigt** (2× `TimerContext.tsx`, `BookingDialogs.tsx`, `TodoFormDialog.tsx`, `TodoDetailScreen.tsx`) |
| Leistung 8192 (3×), Vermerk 65536 (2×) | **bestätigt**, Zahl für Zahl |
| Der Musterblock setzt heute `required` **und** den Exportsatz | **bestätigt:** `required`, `maxLength={500}`, `error="Ohne Eintrag im Feld „Leistung“ lässt sich diese Buchung nicht exportieren."` |
| Der Zähler ist zweimal vorgeführt (500/2000), der Block „gesperrt" führt ihn nicht | **bestätigt** |
| „nach Absage des Dienstes" steht bereits in der Bausteinliste | **bestätigt** — dort als Zustand von **`FormDialog`**, nicht von `NoteField` |
| Die Absage des Dienstes läuft heute am Dialog auf | **bestätigt:** `FormDialog.error` zieht `mutation.error` |
| Der bestehende Lauf mißt die leere Meldefläche | **bestätigt**, `tests/e2e/timer-stop-announcement.spec.ts` |

### 2.2 Z-78 — 14.3 ist freigegeben

> **Leistung: länger, als der Dienst annimmt.**

**Freigegeben, zeichengleich.** Die drei Bedingungen, die ich in Z-69 gestellt habe, sind erfüllt,
und zwar in der Reihenfolge, in der sie zählen:

1. **Er führt vor, wofür `error` da ist.** Eine Absage des Dienstes an **diesem** Wert, mit dem
   Absagenden im Satz. Die Regel ist gemessen und nicht erfunden.
2. **Er kann strukturell nicht als Pflichtfeldmeldung gelesen werden.** Er spricht von **zuviel**.
   Das ist der Punkt, den ich in Z-69 nicht selbst gesehen habe: Ich habe verlangt, daß der Satz
   nicht nach Pflicht klingt; er hat eine Regel gesucht, bei der es **nicht möglich** ist. Das ist
   die stärkere Antwort auf dieselbe Frage.
3. **Er trägt keine Zahl.** Auf der Seite, von der abgeschrieben wird, ist das der Unterschied
   zwischen einem Muster und einer zweiten Wahrheit über eine Konstante der Tür (E-063 Punkt 4,
   T-128).

Form geprüft: **P-1** (ein Satz, Punkt, 39 Zeichen ≤ 60, kein „Bitte", kein „Sie müssen"), **P-2**
(erstes Wort ist die Feldbeschriftung), **P-5** (`„<Feldbeschriftung>: <Regel>."`, **eine** Regel).

**Der Einwand, den ich geprüft und verworfen habe.** Die Grenze ist am Leistungsfeld heute nicht
ertippbar (8192 < 20 000). Das Papier beantwortet es zweimal richtig: die Musterseite zeigt den
**Baustein**, und ein Wert kann aus einem älteren Bestand kommen. Der entscheidende Satz ist der
hier, und ich mache ihn mir zu eigen: *„Eine Absage, die nicht angezeigt werden kann, ist schlimmer
als eine, die selten ist."* Der Block behauptet nichts über Häufigkeit, und darin liegt seine
Haltbarkeit gegenüber O-AX.

**Ein Hinweis, ausdrücklich keine Auflage.** „annimmt" trägt zwei Lesarten — *entgegennehmen* (so
gemeint) und *vermuten*. Auf dem Musterblock löst die neue Überschrift es auf; an einer künftigen
echten Aufrufstelle steht der Satz allein. Ich lasse ihn stehen: „zuläßt" wäre nicht besser, nur
anders, und der Wortlaut gehört ux-designer (E-078 Punkt 4). **Für den nächsten Sprachdurchgang
vermerkt, nicht für diesen Auftrag.**

### 2.3 Z-79 — 14.5 ist freigegeben, mit zwei Auflagen in denselben Auftrag

**Alle drei Angaben tragen, und sie sind der Grund, warum das kein Einzeiler ist:**

1. **Gefüllter Wert.** Zwingend — der Satz spricht über einen Wert. Der Vorschlagstext ist
   brauchbar und hat einen Vorzug, den das Papier nicht nennt: Er nimmt die Form des Beispiels aus
   **A-7.3** auf (*„Fehleranalyse im Backend durchgeführt und API-Response angepasst."*), ist aber
   erkennbar erfunden und trägt keine Kundendaten und keine Call-Nummer.
2. **Kein `maxLength`.** Die Begründung ist zwingend und beidseitig geführt (kleiner → zeigt einen
   Zustand, den niemand gezeichnet hat; größer → widerspricht dem Satz). Die Bauart ist die
   vorhandene, der Nachbarblock führt sie vor.
3. **Zustandsname „Absage des Dienstes an diesem Text".** Trägt. Der Zusatz **„an diesem Text"** ist
   dabei nicht Beiwerk, sondern das, was ihn vom gleichlautenden Zustand des `FormDialog` in der
   Bausteinliste unterscheidet (*„nach Absage des Dienstes"*).

**Die zwei Nicht-Änderungen tragen ebenfalls.** „fehlerhaft" in der Bausteinliste benennt den
sichtbaren Zustand (`note--invalid`, `aria-invalid`) und nicht den Kanal — das ist richtig
unterschieden. Und **AK 6** trägt meinen eigenen Z-69-Satz korrekt weiter: *„Ein Prüffall auf den
Namen des Musterblocks wird nicht gebaut — er hielte eine Vorführung fest."* **Bestätigt.**

**Zwei Auflagen, nicht blockierend, aber in denselben Auftrag (E-081 Punkt 4):**

1. **Der Zusatz „an diesem Text" darf beim Bauen nicht wegfallen.** Ohne ihn stünden zwei
   verschiedene Zustände unter einem Namen — die Klasse, die diese Wellen viermal gekostet hat.
2. **Der Zustand des Blocks heißt heute `emptyBilling`.** Bekommt er einen gefüllten Vorführwert,
   ist sein Name die zweite, falsche Wahrheit in derselben Datei — dieselbe Sorte wie ein Kommentar,
   der etwas anderes begründet, als danebensteht. Der Name geht mit. Welcher, entscheidet
   frontend-dev; daß er mitgeht, ist die Auflage.

### 2.4 Z-84 — ein Hinweis zu 14.7, kein Einwand

14.7 beschreibt den Fluß eines **Aufrufers**, den es heute nicht gibt: Kein Produktaufrufer reicht
`error` an ein `NoteField`, und die Absage des Dienstes läuft am **Dialog** auf. Das steht in 14.2
Befund 4 und in der Fehlerpfad-Zeile von 14.7 — aber nicht in der Feedback-Zeile, die ihn behauptet.

**Kein Blocker, weil die Musterseite den Baustein zeigt und nicht das Produkt.** Aber wer 14.7 als
Bauanleitung liest, baut die Absage des Dienstes ans Feld, ohne zu wissen, daß er damit als erster
im Produkt einen Kanal öffnet. **Vorschlag:** ein Halbsatz in der Feedback-Zeile — *heute tut das
kein Aufrufer; wer es baut, muß die Absage des Dienstes einem Feld zuordnen können.*

---

## 3. Die zwei Berichtigungen

### 3.1 Z-80 — die Berichtigung an 12.10 trägt. Nachgemessen, nicht geglaubt

**Ich habe den Weg selbst verfolgt**, weil es ein Abschnitt ist, den ich freigegeben habe:

| Schritt | Was ich am Code gelesen habe |
|---|---|
| `dayGroup.ts` | `const preview = await previewExport(null, ids);` — `templateId: null` |
| `usecases/export.ts#previewExport` | löst die Vorlage auf, prüft die Definition, liest die Gruppen, rechnet den Plan. **Kein Aufruf, der den Exportordner berührt** |
| `export_directory_missing` | entsteht in `directoryError` (aus dem Lauf gerufen) und in `usecases/structure.ts` — **nicht** auf dem Vorschauweg |
| `resolveTemplate(unit, null)` | `return ok(await unit.templates.builtin());`, mit dem Kommentar: *„Ohne Wahl die mitgelieferte Standardvorlage (A-8.7). Sie ist nicht löschbar, also gibt es immer eine."* |

**Damit ist die Berichtigung in der Sache richtig**, und sie ist an der Stelle richtig, an der es
weh tut: Der Satz *„Ohne Vorlage oder ohne Exportordner gibt es keine Vorschau"* ist ein
**Kommentar** in `dayGroup.ts` und beschreibt den Weg nicht. Ein Kommentar über einen fremden
Endpunkt ist ein Beleg für eine Annahme, nicht für ein Verhalten.

**Und die Form ist die richtige.** Benannt statt überschrieben, in dem Abschnitt selbst, mit dem
Grund darunter. Das ist E-087 Punkt 4 angewandt auf die eigene Arbeit, und es ist der Unterschied
zwischen einer berichtigten Freigabe und einer geretteten.

**Was das für meine Freigabe bedeutet, und es gehört ausgesprochen:** Z-57 Auflage 2 verlangte, den
Regelfall zu **benennen** und dann zu entscheiden. Der Regelfall fällt weg; die Entscheidung bleibt,
**weil sie nie auf ihm stand**. Ich bestätige die Prüfung des Verfassers: Die drei Gründe (die
Fassung sagt Wahres, die Trennung ist kein Wortlautproblem, Gleichlauf schlägt eine zweite
Sonderregel) hängen nicht an der Häufigkeit. **Meine Freigabe von 12.10 bleibt und steht ab jetzt
auf drei Gründen statt auf vier.**

**Ein Zusatz, der die Berichtigung wichtiger macht, als sie sich gibt.** Bleibt L3 selten, dann
trägt die Bedingung *„Der Satz des Dienstes steht immer, wörtlich und ungekürzt"* mehr und nicht
weniger — und zugleich ist er dann oft der Rückfallsatz aus `client.ts`: *„Unbekannter Fehler. Bitte
versuchen Sie es erneut."* **Eine Warnung, deren einzige Auskunft „unbekannter Fehler" lautet, ist
die Tapete, gegen die 12.10 argumentiert.** Das ist kein Einwand gegen die Berichtigung, sondern ihr
wichtigstes Ergebnis, und es gehört zu **O-JS** (bereits auf dem Board): Von den Absagen, die der
Vorschauweg überhaupt geben kann, hängt ab, ob L3 einen Grund mitbringt oder ein Achselzucken.

### 3.2 Z-81 — die Angleichungsrichtung trägt, mit einer Einordnung

**Bestätigt.** Ich habe in Z-57 Auflage 1 beides zugelassen, und die gewählte Richtung ist die
richtige. Die zwei Gründe, die sie tragen, sind Sachgründe:

1. **Der Bestand hat den Wortlaut zuerst.** Nachgemessen: *„der Exportwert ließ sich nicht
   abfragen"* steht **einmal** im Produkt (`TimerContext.tsx`), *„Exportwert unbekannt"* steht
   **nirgends**. Eine neue Fläche ist der Zugang, nicht der Maßstab — das ist S-13a und es ist
   richtig.
2. **Die Gegenrichtung wäre stumm falsch geworden.** Nachgemessen:
   `tests/e2e/timer-stop-announcement.spec.ts` zitiert *„aber noch nicht abrechenbar"* in einem
   **Kommentar** (*„statt der Warnung „aber noch nicht abrechenbar" (`TimerContext.tsx`,
   `reportStopped`)"*). Der Beleg ist echt, und er steht als **O-IW** bei e2e-tester.

**Die Einordnung, damit Grund 3 kein Freibrief wird.** Grund 3 lautet: *„Es blockiert etwas, das
gerade frei ist."* Das ist ein **Ablaufgrund**, kein Textgrund, und er ist hier zufällig
gleichgerichtet mit Grund 1. **Wären sie auseinandergelaufen, entschiede Grund 1.** Ich schreibe das
hin, weil „das würde einen Auftrag zurückwerfen" sonst zu einem allgemeinen Argument dafür wird, den
Bestand nie anzufassen — und dann friert der erste Wortlaut jeder Lage dauerhaft ein, unabhängig
davon, ob er der bessere ist. **Der Verfasser hat die Last richtig verteilt** (*„der dritte Grund
ist der, der zählt"* meint die Entscheidungslast, nicht den Vorrang); ich bestätige die Entscheidung
und stelle die Rangfolge klar.

**Zur zweiten Frage aus T-211 (Offene Frage 2): ja, die Naht ist ausreichend begründet.** Daß der
Verweissatz *nicht* mitwandert, während der Lagesatz es tut, trägt aus beiden angegebenen Gründen —
„Die erfasste Zeit steht fest" wäre am Nachtragsweg **D** neben dem Titel, und der Verweis auf die
Export-Ansicht ist ein Rückweg in Worten, über den 12.4 bereits entschieden hat. **Und S-13a trägt
in meinem Sinn**, einschließlich der Einordnung des „aber" als Verknüpfung des Anlasses: Die von
Z-57 freigegebene Fassung von L2 bleibt damit unangetastet, und das war die Bedingung.

---

## 4. Die Reste — steht mein Urteil zu O-IR noch?

**Ja, und es ist an einer Stelle stärker geworden und an einer schwächer.**

### 4.1 Z-82 — Z-65 ist erfüllt

Meine Auflage lautete: *Bündel 2 legt die `urgency` seines Wirts **ausdrücklich und mit einem Satz
Grund** fest, statt sie zu erben.* T-213 liefert genau das, als verbindlichen Folgesatz 3 in 9.11:

> **Die Dringlichkeit dieser einen Fläche ist `polite` und nicht `assertive`.** Der Grund ist der
> Inhalt: Das Token steht einmalig da und muss **gelesen** werden; eine dringliche Ansage
> unterbricht dabei genau den Vorgang, um den es geht.

**Wert genannt, Grund genannt, Abwägung sichtbar.** Auflage erfüllt, kein Nachtrag nötig. Auch die
Herkunft des Fehlers ist aufgeschrieben (*„Ich habe über eine fremde Bündelliste gezählt statt über
den Bestand; eine Zählung über eine Liste ist keine Messung"*) — das ist E-087 in der Anwendung auf
sich selbst und die zweite solche Zeile in dieser Runde.

### 4.2 Z-83 — Z-66 ist in der Sache erfüllt und am Ort nicht. **Und das ist E-092 ein Papier weiter**

**In der Sache:** vollständig. Ich habe die Fläche gegengemessen — `SettingsScreen.tsx` führt
innerhalb der `InlineMessage tone="warning"` (*„Dieses Token steht genau jetzt hier — und nie
wieder"*) ein von Hand geschriebenes `<span className="token-actions__hint" role="status">`, dessen
Text bei jedem Kopierversuch wechselt. **Heute schon eine Live-Region in einer Live-Region.** Und
T-213 zieht die richtige Folge: Wirt setzen und innere Rolle entfernen sind **eine** Änderung, sonst
wird die Verschachtelung nicht beseitigt, sondern verschärft.

**Am Ort: nicht erfüllt, und es ist nicht Formalismus.** Nachgemessen im heutigen Papier:

- **9.1 Punkt 2** sagt unverändert: *„Kein zweiter Meldebaustein. `InlineMessage` bleibt der
  einzige. Der Wirt umschließt ihn, er ersetzt ihn nicht."* — kein Wort über Kinder.
- **9.8** heißt unverändert *„Was der Wirt **nicht** leistet — **drei** Grenzen, damit niemand mehr
  erwartet"*, und die Grenze fehlt in der Aufzählung.
- **9.1 selbst behauptet weiterhin das Gegenteil:** *„eine Live-Region in einer Live-Region ist
  nicht mehr eine Frage der Sorgfalt, sondern **baulich ausgeschlossen**"* — und 9.11 weist nach,
  daß sie es nicht ist.

Der verbindliche Satz steht im **Nachtrag**, und zwar in der Form einer Anweisung an jemanden, ihn
einzutragen (*„dieser Satz gehört in 9.1 Punkt 2"*). Wer Bündel 2 baut, liest 9.1 und 9.8 — das sind
die Abschnitte, die für Bauende geschrieben sind. **Er liest dort, daß der Fall baulich
ausgeschlossen sei, und baut ihn.** Das ist wörtlich der Mechanismus aus E-092, nur mit einem
Nachtrag statt mit einem Bericht als Versteck.

**Vorschlag (ui-designers Papier, eine Zeile je Stelle):** Der Satz wandert **in** 9.1 Punkt 2, 9.8
wird zu **vier** Grenzen, und der Satz *„baulich ausgeschlossen"* in 9.1 bekommt seine Einschränkung
an Ort und Stelle. Der Nachtrag bleibt stehen — benennen, nicht überschreiben —, aber er ist der
**Beleg** und nicht der **Ort**. Kein eigener Auftrag; mitzunehmen, wenn Abschnitt 9 das nächste Mal
angefaßt wird, und **vor** dem Bau von Bündel 2.

**Mein Urteil zu O-IR steht damit unverändert:** Z-65 angenommen mit berichtigter Voraussetzung,
Z-66 angenommen, beide gehen in Bündel 2 mit, kein eigener Auftrag. Neu ist allein Z-83, und es ist
eine Ortsfrage, keine Sachfrage.

---

## 5. Die Pflichtklickpfade, soweit dieser Bericht sie berührt

| Pfad | Stand |
|---|---|
| **Timer auf erledigtem Todo** | Unberührt. Weder Abschnitt 13 noch 14 fassen `TimerContext.tsx` an; Z-50 bleibt bei O-HX |
| **Exportstatus an jeder Stelle sichtbar** | Berührt von **Z-78/Z-79**, und zwar zugunsten des Pfades: Der Musterblock hört auf, die Sperre der **Tagesgruppe** (E-034) als Feldmeldung vorzuführen. Die Bedingung bleibt bei ihrem Träger (`BILLING_NOTE_MAY_BE_EMPTY`, SP-08). Mittelbar berührt von **Z-80**: Was L3 an Auskunft trägt, hängt an O-JS |
| **Todo-Notiz nie im Export, Buchungsnotiz sichtbar** | Berührt von **Z-78/Z-79**, Trennung **unangetastet**: `scope`, die sechs Merkmale, Banner, Marke und `help` bleiben zeichengleich. Der neue Vorführtext ist erfunden, ohne Kundendaten und ohne Call-Nummer; er steht an `scope="billing"` und ist damit korrekt als exportierbar gekennzeichnet |
| **Vier Ebenen tiefer Ordnerbaum, Selbstverschiebung** | Berührt von **Z-75**: „Neuen Ordner anlegen" ist einer der neun aus E-093. Bleibt der Riegel dort, wo er heute steht, bekommt der Absendeversuch auch dort keine Antwort |
| **Standard-Tags auf jedem Erstellungsweg** | Unberührt. `TodoFormDialog` führt kein `submitDisabled` |
| **Vorlageneditor mit Vorschau auf offene Buchungen** | Berührt von **Z-80**: Der Vorschauweg löst ohne Wahl die **nicht löschbare** Standardvorlage auf (A-8.7) — der Editor kann die Vorschau also nicht durch Löschen der letzten Vorlage lahmlegen. Am Code bestätigt |

---

## 6. Befunde in Kurzform

```
Z-71  PoolRenameDialog / 13.3       Abweichung: keine. Der Zustand „unverändert" hat im ganzen
      A-3.3, A-5.4, I-13, SC 3.3.1  Produkt keinen Satz (gemessen: `fieldError` deckt allein
      P-1, E-078 Punkt 3            `taken`), und der Hinweis allein sagt nicht, was der Druck
                                    bewirkt hat.
                                    Vorschlag: FREIGEGEBEN, zeichengleich. Satz 1 neu, Satz 2
                                    und 3 zeichengleich der heutige Hinweis, ein Baustein.

Z-72  textbestand.md, Regelnummer   Abweichung: BLOCKIEREND (ux-designer). „Regel S-15" ist im
      E-092                         SELBEN Papier bereits vergeben — S-15 „Zugängliche Namen",
                                    ausdrücklich VERTRAGLICH („286 `getByRole`-Zugriffe"). Zwei
                                    verbindliche Regeln unter einer Nummer. T-219 zitiert die
                                    Nummer bereits, also ist die Ansteckung erfolgt.
                                    Vorschlag: freie Nummer, gebunden an die Textsorte (S-12a
                                    liegt nahe — S-12 ist „Dialoge: Titel, Beschreibung, Folge,
                                    ABSAGE"). Bis dahin zitiert niemand „S-15" für die neue
                                    Regel.

Z-73  13.5 AK 3/4/5                 Abweichung: BLOCKIEREND. 13.1 nennt den Satz ein B und
      A-13.1, SC 3.3.1, SC 4.1.2    „ausdrücklich KEINE Fehlermeldung"; AK 5 legt ihn in die
      E-078                         Meldefläche des `TextField`, AK 4 verlangt
                                    `revealFirstInvalidWithin`. Gemessen: Diese Fläche wird
                                    allein aus `shownError` gefüllt, `aria-invalid` hängt daran,
                                    `.field__input--invalid` setzt `border-color:
                                    var(--danger-text)`, `.field__error` setzt
                                    `color: var(--danger-text)`, und
                                    `revealFirstInvalidWithin` sucht „aria-invalid=true und
                                    nichts anderes". Das B erscheint also als Fehler und erklärt
                                    einen gültigen, gespeicherten Wert für ungültig — dieselbe
                                    Behauptung, die 13.3 unter „Ungültiger Name." verwirft. Das
                                    eigene Vorbild aus 13.2 macht es anders:
                                    `ConfirmDialog.refusal` steht in `<div role="status">` mit
                                    `.dialog__consequence` und OHNE `aria-invalid`.
                                    [BERICHTIGT 2026-09-06, T-237/O-KE.] Hier stand „ohne
                                    `aria-invalid`, ohne Gefahrenfarbe". Die Gefahrenfarbe
                                    trägt es, und zwar DREIFACH:
                                    `color: var(--danger-text)`,
                                    `background-color: var(--danger-bg-subtle)` und
                                    `border-inline-start: 3px solid var(--danger-bg)` — die
                                    Schiene aus `--danger-bg`, NICHT aus `--danger-text`; am
                                    Bild im hellen Schema dasselbe #ac2a22, an der Marke
                                    nicht. Sie ist NICHT der Unterschied. Der Unterschied ist
                                    die maschinell gelesene Aussage, und auf ihr — und nur auf
                                    ihr — steht dieser Befund: E-093 Punkt 5 hat genau sie
                                    verbindlich gemacht. Das Urteil bleibt auf DEMSELBEN Bein;
                                    gefallen ist eine Zierde, kein Bein. Ausgang (b) unten ist
                                    damit so, wie er dasteht, nicht im Bestand vorhanden —
                                    gebaut und richtig ist: Statusfläche, kein `aria-invalid`,
                                    MIT Gefahrenfarbe.
                                    Vorschlag: EINE von zwei Auflösungen ins Papier — (a) Kanal
                                    bleibt `error`, und 13.1 sagt, daß dieses B die Gestalt
                                    eines Fehlers trägt, weil die Rückführung daran hängt; oder
                                    (b) Kanal nach dem eigenen Vorbild (`role="status"`, kein
                                    `aria-invalid`), dann trägt AK 4 nicht mehr und der Fokus
                                    kommt von der Aufrufstelle. Den Ausgang schreibe ich nicht
                                    vor; daß einer dasteht, verlange ich.

Z-74  13.5 AK 1                     Abweichung: BLOCKIEREND, klein. „Der Hinweis bleibt EIN
      E-081 Punkt 4                 Baustein" — er ist heute keiner: eine Zeichenkette in einer
                                    verschachtelten Ternärkette in `PoolRenameDialog.tsx`, ohne
                                    Namen. Nach AK 1 bleiben nur abschreiben (verboten) oder
                                    eine Konstante herausziehen (von keiner AK verlangt).
                                    Vorschlag: AK 1 um einen Halbsatz ergänzen — der Hinweis
                                    wird in derselben Änderung zu einer benannten Konstante,
                                    aus der beide Fälle lesen.

Z-75  13.5 AK 7 gegen AK 4          Abweichung: BLOCKIEREND für die Wirkung. „Der Riegel BLEIBT"
      A-13.1, SC 3.3.1, E-093       — er steht in `FormDialog.tsx` VOR `setSubmitAttempt` und
      P-9, E-092                    `setQuiet`; die Rückführung hängt an `submitAttempt`. Bleibt
                                    er, wo er ist, erscheint der freigegebene Satz NIE und der
                                    Fokus geht nicht ins Feld: ein klickbarer Knopf, der gar
                                    nichts tut — genau der Zustand aus Z-64.3. frontend-dev hat
                                    es in T-207 richtig geplant („`submitAttempt` und `quiet`
                                    setzen, aber `onSubmit` nicht rufen"), aber diese Zeile
                                    steht in einem Bericht und nicht in den
                                    Akzeptanzkriterien. Das ist E-092, drei Tage nach E-092.
                                    Vorschlag: AK 7 neu — der Riegel hält die HANDLUNG auf,
                                    nicht den VERSUCH. Gemessen wird beides: die Absage
                                    erscheint UND kein `PATCH` läuft (wie Z-64.1 / O-GZ).

Z-76  13.3, Länge                   Abweichung: 102 Zeichen, DREI Sätze, in einem Kanal, für
      P-1 (E-092), S-05             den P-1 „Ein Satz, höchstens 60 (mit P-4-Halbsatz 80)"
                                    setzt. Das Papier erwähnt die Grenze nicht — für 14.3 hat
                                    derselbe Verfasser sie ausdrücklich gerechnet.
                                    Vorschlag: entscheiden und hinschreiben — entweder P-1 gilt
                                    der Pflichtfeldmeldung und nicht dem B (mit Verweis auf das
                                    Raster), oder benannte Ausnahme wie bei S-13a. Schweigen
                                    ist der eine unzulässige Ausgang: die nächste Absage wird
                                    sonst mit 102 Zeichen gebaut, weil diese es durfte.

Z-77  13.3 und 14.4, Begründung     Abweichung: „»Bitte« steht nirgends im Produkt" ist FALSCH,
      S-07, P-1, E-087              gemessen an mindestens sieben Stellen — u. a.
                                    `api/client.ts` („Unbekannter Fehler. Bitte versuchen Sie
                                    es erneut."), `TimerContext.tsx`, `Select.tsx`
                                    („Bitte wählen"), `usecases/export.ts`, `startup.ts`,
                                    `errors.ts`, `tag-names.ts`. S-07 sagt es enger und
                                    richtig: es handelt von KNOPFTEXTEN. Verschärfend: 12.10
                                    verlangt, den Satz des Dienstes „wörtlich und ungekürzt"
                                    durchzureichen — in der häufigsten L3-Meldung steht damit
                                    ein „Bitte", das wir selbst zustellen.
                                    Vorschlag: beide Stellen auf ihren Geltungsbereich
                                    zurücknehmen. Das Urteil über die verworfenen Fassungen
                                    bleibt: P-1 verbietet „Bitte" in der Feldmeldung, und
                                    dieser Grund allein trägt. Benennen, nicht überschreiben.

Z-78  14.3, Musterblock             Abweichung: keine. Form geprüft gegen P-1 (39 Zeichen, ein
      A-7.3, A-7.4, E-034, SP-08    Satz), P-2 (erstes Wort ist die Feldbeschriftung) und P-5
      E-063 Punkt 4, O-AX           (`„<Feldbeschriftung>: <Regel>."`, EINE Regel). Die Regel
                                    ist gemessen: `textSchema = z.string().max(20_000)`, ohne
                                    Zeichenprüfung, die einzige Regel der Tür auf diesen Text.
                                    Keine Zahl im Satz — auf der Seite, von der abgeschrieben
                                    wird, ist das der Unterschied zwischen Muster und zweiter
                                    Wahrheit.
                                    Vorschlag: FREIGEGEBEN, zeichengleich. Er beantwortet Z-69
                                    stärker als Z-69 gefragt hat: die Pflichtfeld-Lesart ist
                                    nicht vermieden, sondern strukturell ausgeschlossen.
                                    Hinweis ohne Auflage: „annimmt" trägt zwei Lesarten; für
                                    den nächsten Sprachdurchgang vermerkt, nicht für diesen
                                    Auftrag.

Z-79  14.5, die drei Angaben        Abweichung: keine. Gefüllter Wert (zwingend, der Satz
      A-7.3, E-076 Punkt 3          spricht über einen Wert; der Vorschlagstext nimmt die Form
      E-081 Punkt 4                 des Beispiels aus A-7.3 auf und trägt keine Kundendaten),
                                    kein `maxLength` (beidseitig begründet, Bauart vorhanden),
                                    Zustandsname „Absage des Dienstes an diesem Text". Die zwei
                                    Nicht-Änderungen tragen; AK 6 führt meinen Z-69-Satz
                                    korrekt weiter (kein Prüffall auf den Namen einer
                                    Vorführung).
                                    Vorschlag: FREIGEGEBEN. Zwei Auflagen in DENSELBEN Auftrag:
                                    (1) der Zusatz „an diesem Text" darf nicht wegfallen — ohne
                                    ihn kollidiert der Name mit dem Zustand „nach Absage des
                                    Dienstes" des `FormDialog` in der Bausteinliste;
                                    (2) `emptyBilling` heißt nach dem Füllen anders — sonst ist
                                    der Name die zweite, falsche Wahrheit in derselben Datei.

Z-80  12.10, Berichtigung           Abweichung: keine — die Berichtigung ist richtig, und ich
      A-8.7, E-087 Punkt 4          habe sie am Code gegengemessen: `previewExport(null, ids)` →
                                    `usecases/export.ts#previewExport` löst Vorlage auf, prüft
                                    Definition, liest Gruppen, rechnet den Plan; der
                                    Exportordner kommt NICHT vor (`export_directory_missing`
                                    entsteht in `directoryError` und `usecases/structure.ts`),
                                    und `resolveTemplate(unit, null)` gibt
                                    `templates.builtin()` zurück: „Sie ist nicht löschbar, also
                                    gibt es immer eine."
                                    Vorschlag: BESTÄTIGT. Meine Freigabe aus Z-57 Auflage 2
                                    bleibt und steht ab jetzt auf drei Gründen statt auf vier —
                                    sie hingen nie an der Häufigkeit. Nachtrag: Wird L3 selten,
                                    ist der durchgereichte Satz des Dienstes oft der Rückfall
                                    „Unbekannter Fehler. Bitte versuchen Sie es erneut." — das
                                    ist das eigentliche Gewicht hinter O-JS.

Z-81  T-211, Richtungswahl          Abweichung: keine. Nachgemessen: „der Exportwert ließ sich
      A-13.5, E-087                 nicht abfragen" steht EINMAL im Produkt, „Exportwert
                                    unbekannt" NIRGENDS; und
                                    `tests/e2e/timer-stop-announcement.spec.ts` zitiert „aber
                                    noch nicht abrechenbar" in einem Kommentar (O-IW).
                                    Vorschlag: BESTÄTIGT, mit einer Einordnung: Grund 3 („es
                                    blockiert etwas, das frei ist") ist ein Ablaufgrund und
                                    hier zufällig gleichgerichtet mit Grund 1. Wären sie
                                    auseinandergelaufen, entschiede Grund 1. Sonst wird
                                    „das würfe einen Auftrag zurück" zum Argument dafür, den
                                    ersten Wortlaut jeder Lage dauerhaft einzufrieren.
                                    Ebenfalls bestätigt: S-13a trägt, einschließlich der
                                    Einordnung des „aber" — L2 bleibt wie freigegeben; und die
                                    Naht am Ortssatz ist ausreichend begründet.

Z-82  O-IR / Z-65                   Abweichung: keine. Die Auflage („`urgency` ausdrücklich und
      A-13.5, SC 4.1.3              mit einem Satz Grund") ist in `textabbau-gestalt.md` 9.11
                                    erfüllt: `polite`, weil das Token gelesen werden muß und
                                    eine dringliche Ansage genau den Vorgang unterbräche.
                                    Vorschlag: ERFÜLLT, kein Nachtrag.

Z-83  O-IR / Z-66, der ORT          Abweichung: In der Sache erfüllt (gegengemessen:
      SC 4.1.3, E-092, E-081        `SettingsScreen.tsx` trägt `<span
                                    className="token-actions__hint" role="status">` INNERHALB
                                    der `InlineMessage tone="warning"`). Am Ort nicht: 9.1
                                    Punkt 2 sagt weiter nur „Kein zweiter Meldebaustein", 9.8
                                    heißt weiter „drei Grenzen", und 9.1 behauptet weiter, eine
                                    Live-Region in einer Live-Region sei „baulich
                                    ausgeschlossen". Der verbindliche Satz steht im Nachtrag —
                                    als Anweisung, ihn einzutragen. Wer Bündel 2 baut, liest
                                    9.1 und 9.8 und findet dort das Gegenteil. Das ist E-092
                                    ein Papier weiter.
                                    Vorschlag: Der Satz wandert IN 9.1 Punkt 2, 9.8 wird zu
                                    VIER Grenzen, und „baulich ausgeschlossen" bekommt seine
                                    Einschränkung an Ort und Stelle. Der Nachtrag bleibt als
                                    Beleg stehen. Eine Zeile je Stelle, kein eigener Auftrag —
                                    aber VOR dem Bau von Bündel 2.

Z-84  14.7, Feedback-Zeile          Abweichung: klein. Die Zeile beschreibt einen Fluß, den
      A-7.3                         heute kein Aufrufer hat: Kein Produktaufrufer reicht
                                    `error` an ein `NoteField`, und die Absage des Dienstes
                                    läuft am Dialog auf (steht in 14.2 Befund 4 und in der
                                    Fehlerpfad-Zeile, nicht in der Feedback-Zeile).
                                    Vorschlag: ein Halbsatz — heute tut das kein Aufrufer; wer
                                    es baut, öffnet als erster diesen Kanal im Produkt.
```

---

## 7. Urteil

**Nacharbeit** — aber die zwei Genehmigungen, an denen Bauaufträge hängen, sind **erteilt**.

**Freigegeben, zeichengleich, ohne Vorbedingung:**

- **13.3** — der Satz für den unveränderten Namen (Z-71).
- **14.3** — der Fehlertext des Musterblocks (Z-78).
- **14.5** — die drei Angaben und die zwei ausdrücklichen Nicht-Änderungen (Z-79, mit zwei Auflagen
  in denselben Auftrag).
- **12.10** — die Berichtigung trägt; meine Freigabe bleibt (Z-80).
- **T-211** — die Angleichungsrichtung trägt (Z-81); S-13a trägt; die Naht am Ortssatz ist
  ausreichend begründet.
- **O-IR** — mein Urteil steht (Z-82, Z-83 in der Sache).

**Blockierend, jeweils für ihren Auftrag und nicht für die Welle:**

| ID | Blockiert | Wen |
|---|---|---|
| **Z-72** | jede weitere Verwendung der Nummer „S-15" für die neue Regel | ux-designer, eine Zeile |
| **Z-73** | den Bau von 13.5 — **nicht** den Wortlaut aus 13.3 | ux-designer entscheidet den Kanal, dann frontend-dev |
| **Z-74** | den Bau von 13.5 | eine Zeile in AK 1 |
| **Z-75** | die **Wirkung** des Umbaus aus E-093 an allen neun | eine Zeile in AK 7, gemessen wie Z-64.1 |

**Was frontend-dev damit heute tun kann.** Die Fläche weiterbauen und den Satz aus **13.3
einsetzen** — er ist freigegeben. Was **nicht** ohne Z-73 und Z-75 fertig wird, ist der **Weg**: in
welchem Kanal der Satz erscheint und ob der gesperrte Absendeversuch ihn überhaupt auslöst. Beides
sind Zeilen, keine Umbauten, und beide gehören in denselben Auftrag wie der Satz.

**Ausdrücklich nicht verlangt:** eine neue Fassung eines der beiden Wortlaute. Keiner meiner
Befunde berührt einen Buchstaben von 13.3 oder 14.3.

---

## 8. Annahmen, Risiken, offene Fragen

**Annahmen.**

1. **Ich habe P-1 als Formregel für den Kanal gelesen, nicht für den Anlaß.** T-177 führt P-1 bis
   P-7 unter *„Form der Pflichtfeldmeldung"* (E-084). Ob ein **B** in derselben Fläche derselben
   Formregel unterliegt, steht nirgends — deshalb ist Z-76 eine Frage und keine Ablehnung.
2. **Alle Messungen dieses Berichts sind mit ripgrep über den Arbeitsbaum gemacht, am 2026-09-06,
   ohne `git grep`.** Dieser Lauf hatte keine Schale. Es ist dieselbe halbe Werkzeugmenge, die
   T-211 und T-219 benennen; für die geprüften Fälle trägt sie, weil alle betroffenen Dateien im
   Arbeitsbaum liegen.
3. **Am Code gelesen, nicht laufen gesehen:** der Vorschauweg (Z-80), die Kaskade zu
   `.field__input--invalid`/`.field__error` (Z-73) und die Reihenfolge im `submit` (Z-75). Hier
   läuft kein Browser. Alle drei sind so gefaßt, daß ein Lauf sie widerlegen kann; Z-75 ist der
   einzige, bei dem eine Widerlegung das Urteil änderte.
   **Nachtrag vom 2026-09-06 (T-237):** Ein vierter Satz gehörte in diese Aufzählung und stand nicht
   darin — die Behauptung über die **Gestalt** von `.dialog__consequence`. Sie war weder gelesen noch
   laufen gesehen, sondern **angenommen**, und sie war falsch (siehe 1.4). Genau dafür ist diese
   Annahmeliste da; sie hat den einen Satz nicht gefangen, der sie gebraucht hätte.
4. **Die 102 Zeichen habe ich gezählt, nicht gemessen** (Z-76). Bei einer Abweichung von ein oder
   zwei Zeichen ändert sich nichts: die Grenze ist 60 beziehungsweise 80.
5. **Ich habe die sieben verworfenen Fassungen aus 13.3 und die acht aus 14.4 nicht gegen den Baum
   gesucht**, sondern nur die eine Behauptung geprüft, die als Messung auftrat („Bitte").

**Risiken.**

1. **Z-73 ist der Befund, den man verbucht und nicht ausführt.** „Die Absage erscheint in Rot statt
   in Grau" liest sich wie Geschmack. Es ist der einzige Befund dieser Prüfung, der einem Benutzer
   etwas Falsches **sagt** — `aria-invalid="true"` über einen Wert, der gültig ist —, und der
   einzige, der eine Vorlesehilfe erreicht.
   **Nachtrag vom 2026-09-06 (T-237):** Dieser Risikosatz ist die genaueste Fassung des Befundes im
   ganzen Bericht, und er ist der Grund, warum die Berichtigung an 1.4 das Urteil nicht anfaßt: Er
   nennt `aria-invalid` und **nicht** die Farbe. „In Rot statt in Grau" war schon hier als das
   benannt, was es ist — die schwache Hälfte.
2. **Z-75 ist die Sorte Fehler, die nach dem Bau wie Absicht aussieht.** Der Knopf ist klickbar, es
   passiert nichts, alle Prüffälle über „es wird kein `PATCH` gesendet" sind grün. Genau deshalb
   verlangt Z-64.1 **beide** Hälften, und deshalb gehört Z-75 in dieselbe Messung.
3. **Z-72 wirkt wie Papierarbeit und ist die billigste Behebung dieser Runde.** Eine Nummer. Wird
   sie nicht vergeben, hat `textbestand.md` zwei S-15, und die eine davon ist vertraglich mit 286
   Prüfzugriffen verbunden.
4. **Ich urteile zum zweiten Mal über einen Satz, dessen Bau ich selbst angeordnet habe** (Z-69 →
   14.3). Die Gefahr ist, daß ich meinen eigenen Auftrag wiedererkenne und nicht prüfe. Gegenmittel
   in diesem Bericht: Ich habe die tragenden Messungen aus 14.2 einzeln nachgemessen, statt sie zu
   übernehmen — sie halten alle.
5. **Sicherheit:** nichts berührt. Kein Export, kein Anhang, keine Adresse, keine Versionsprüfung.
   Der neue Vorführtext ist erfunden und enthält keine Kundendaten und keine Call-Nummer; Fußnote
   und Marke des Leistungsfeldes bleiben zeichengleich, also bleibt die Zusage aus SP-09
   unangetastet. Der Satz aus 14.3 nennt **keine** Zahl der Tür und schreibt damit nichts über die
   Grenze fest, was ein Bauender falsch übernähme.

**Offene Fragen.**

1. **An ux-designer (Z-72), sofort und klein:** eine freie Nummer für die neue Regel. Bis dahin
   zitiert sie niemand — auch T-219s Grundlagenzeile nicht.
2. **An ux-designer (Z-73):** die Entscheidung über den Kanal, in einem Satz im Papier. Ich habe
   beide zulässigen Ausgänge benannt und schreibe keinen vor.
3. **An ux-designer (Z-76):** P-1 und der 102-Zeichen-Satz. Geltungsbereich klären oder benannte
   Ausnahme.
4. **An ux-designer (Z-77):** die zwei falschen „Bitte"-Begründungen benennen und zurücknehmen, in
   der Form, die 12.10 vorgemacht hat.
5. **An den Orchestrator (Z-75):** Die Auflage gehört in **E-093**. Heute steht sie in T-207 und in
   T-212 und in keinem Beschluß — und E-093 führt auch **Z-64.3** („der Satz aus T-211 steht
   vorher") nicht, obwohl sie blockierend war und diese Welle nur deshalb richtig läuft, weil der
   Orchestrator sie im Auftrag mitgeführt hat. **Beides gehört in den Beschluß, sonst scheitert
   E-092 an seinem eigenen Beispiel.**
6. **An ui-designer (Z-83):** der Satz wandert in 9.1 Punkt 2, 9.8 wird zu vier Grenzen, „baulich
   ausgeschlossen" bekommt seine Einschränkung — vor dem Bau von Bündel 2.

---

## 9. Nächster Schritt

1. **frontend-dev fährt fort und setzt den Satz aus 13.3 ein** — er ist freigegeben. Die Fläche
   wird so gebaut, daß der Kanal (Z-73) und die Reihenfolge im `submit` (Z-75) als **letzte** zwei
   Zeilen fallen, nicht als erste.
2. **ux-designer, ein kurzer Nachtrag** mit vier Punkten: die Regelnummer (Z-72), der Kanal (Z-73),
   AK 1 und AK 7 (Z-74, Z-75), die zwei „Bitte"-Begründungen und die P-1-Frage (Z-76, Z-77).
   Zusammen eine halbe Seite; nichts davon berührt einen Wortlaut.
3. **Der Auftrag aus Z-68/Z-69 kann fahren** — 14.3 und 14.5 sind freigegeben, die zwei Auflagen
   aus Z-79 gehen mit, in **einem** Stück, mit dem Lauf aus
   `tests/e2e/timer-stop-announcement.spec.ts` als Sicherung. Er faßt `dayGroup.ts` nicht an.
4. **Der Orchestrator trägt Z-64.3 und Z-75 in E-093 nach.** Zwei Sätze in einem Beschluß, der
   gerade gebaut wird.
