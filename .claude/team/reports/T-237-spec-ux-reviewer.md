# T-237 — Drei Urteile: eine Begründung berichtigt, zwei Freigaben nachgemessen

**Rolle:** spec-ux-reviewer **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gegenstand:** **O-KE** (aus T-220 Frage 3), **O-EL** (aus T-167 Frage 3), **O-EP** (aus T-168)

**Verbindlich gelesen:** `docs/spec.md` Abschnitt 19 (A-19.11, A-19.12, A-19.15, A-19.17);
`.claude/team/decisions.md` E-078, E-081, E-087, E-092, E-093; `docs/design/textbestand.md`
(13.4/13.5, Nachtrag T-228), `docs/design/textabbau-gestalt.md`, `docs/design/traeger-und-zusage.md`;
`docs/bedrohungsmodell.md` (T-156-8, A-A-6, A-A-7, A-A-28); WCAG 2.2 SC 1.4.1, 2.4.6, 3.3.1, 4.1.2.
**Berichte:** T-154 (V-07), T-165 (X-04, X-05), T-167, T-168, **T-177 (Z-09, Z-10, Z-11)**,
T-220, T-221 (Z-73), T-228.

**Geschriebene Dateien.** Dieser Bericht — und, nach dem Nachtrag des Orchestrators vom 2026-09-06,
`.claude/team/reports/T-221-spec-ux-reviewer.md`, also die zweite Datei in meiner eigenen Hoheit
(`CLAUDE.md`: `.claude/team/reports/**`, jeder Agent seine eigene Datei). Kein Produktivcode, kein
fremdes Papier, kein fremder Bericht angefaßt.

**Zur Meßform (E-087).** Alle Zahlen und Zeichenketten dieses Berichts sind **in dieser Aufgabe**
am Arbeitsbaum gemessen, nicht aus einem Papier zitiert. Gesucht wurde über den **Wortlaut**, nicht
über die Zeile, und über den **ganzen Arbeitsbaum** (ripgrep) — das deckt beide von `CLAUDE.md`
verlangten Hälften in einem Lauf: versionierte **und** unversionierte Quelldateien, während die
`.gitignore`-Bauergebnisse (`apps/desktop/src-tauri/taskpane/`) ausgeschlossen bleiben. Wo eine
Zahl aus einem fremden Bericht stammt, steht das dabei.

**Zwei Grenzen, ausdrücklich (T-B09).** In dieser Umgebung steht **kein Vorleseprogramm**. Jede
Aussage darüber, **wie** etwas angesagt wird, ist eine **Ableitung** aus dem Baum und aus den
Rollen — sie ist unten so gekennzeichnet. Und ich habe **keinen Browser gefahren**: Farbwerte sind
aus `components.css` und `tokens.css` gelesen, nicht am gezeichneten Baum abgenommen.

---

## Urteil

| Gegenstand | Urteil |
|---|---|
| **O-KE** — „ohne Gefahrenfarbe" | **Die Messung gewinnt, die Begründung wird berichtigt.** Vier Stellen in **einer** Datei, Ersatzwortlaut in 1.3. **Das Urteil steht auf demselben Bein** — dem einzigen, das es je getragen hat (`aria-invalid`). Anders als in T-228: dort wechselte das Bein, hier fällt eine Zierde. **Eingesetzt am 2026-09-06, siehe 1.6** |
| **O-EL** — „Diese Datei wird nicht geöffnet" | **trägt** — **und ist seit T-177 (Z-11) freigegeben.** Ich bestätige die Freigabe gegen den heutigen Baum. Die **Begründung von frontend-dev trägt nicht** (1 Wort, 1 Prüffall, beide falsch gemessen); das Urteil steht auf einem anderen Bein — Z-85 |
| **O-EL, Nachfrage** „Warnung oder Aussage?" | **Aussage.** Und zwar nicht nach Geschmack, sondern nach **A-19.15**. Die **Überschrift** ist richtig; die **Gestalt** darunter ist die einer Warnung — Z-86, Auflage, nicht blockierend |
| **O-EP (a)** `http://` sichtbar | **trägt** — **seit T-177 (Z-09) freigegeben**, bestätigt. Meine Auflage 1 zu X-04 war der Fehler, nicht die Abweichung |
| **O-EP (b)** längerer Dateifall | **trägt** — **seit T-177 (Z-10) freigegeben**, bestätigt. Die Prüffälle sind inzwischen nachgezogen (gemessen) |
| **O-EP, offene Auflage aus Z-09** | **nicht erledigt.** `docs/bedrohungsmodell.md` T-156-8 beschreibt heute den Code **falsch** — Z-87, Wiedervorlage |
| **Board** | **O-EL und O-EP standen seit T-177 doppelt.** Z-88, Verfahrensbefund — **erledigt, beide Zeilen gestrichen; der Fehler steht als O-KU beim Orchestrator** |

**Neue Befunde: Z-85 bis Z-89. Blockierend: keiner.**

**Gesamturteil: freigegeben.** Keine blockierende ID. Fünf Auflagen, alle klein, alle benannt —
**alle fünf sind inzwischen beauftragt oder erledigt; der Stand steht bei jedem Befund in
Abschnitt 5.**

---

## 0. Der Vorbefund, und er gehört an den Anfang: zwei der drei Fragen sind beantwortet

**Gemessen, nicht vermutet.** `.claude/team/reports/T-177-spec-ux-reviewer.md` beantwortet
**O-EL** (Abschnitt 4, Befund **Z-11**) und **O-EP** (Abschnitt 3, Befunde **Z-09** und **Z-10**)
vollständig, mit sechs Auflagen. Die Kurzfassung dort, Zeile 18, sagt es wörtlich:

> „Freigegeben mit Auflagen: ST-05, UM-01, UM-03, **O-EP (beide Abweichungen), O-EL**, O-ED, O-EG."

Trotzdem standen beide bei Beginn dieser Aufgabe noch als offene Fragen an spec-ux-reviewer:
`.claude/team/board.md:1129` (O-EL) und `:1133` (O-EP), **ohne** Durchstreichung — während vier
andere Befunde derselben Aufgabe (O-EW, O-EX, O-EY, O-EZ) sauber durchgestrichen und mit ihrem
Ausgang versehen sind. Die Pflege ist also gelaufen und hat genau diese zwei ausgelassen. Das ist
**Z-88**. **Beide Zeilen sind seit dem 2026-09-06 gestrichen und tragen ihren Ausgang; der Fehler
selbst steht als O-KU beim Orchestrator, mit der Auflage, beim nächsten Abgleich alle Wellen mit
Auflagen gegen ihre Boardzeilen zu prüfen.**

**Was ich daraus gemacht habe — und es ist mehr als ein Verweis auf früher.** Eine Freigabe altert
(E-087). Zwischen T-177 und heute liegen rund sechzig Aufgaben, und in dieser Zeit hat sich an
**beiden** Flächen etwas bewegt: `checkAttachmentPath` weist den Doppelpunkt inzwischen **an der
Tür** ab, die zwei roten Prüffälle sind umgeschrieben, ein Unterscheidbarkeitsfall ist dazugekommen,
und `FormDialog` hat mit T-220 einen **vierten** Träger derselben Gestalt bekommen, um die O-KE
sich dreht. Ich habe deshalb **nicht** auf T-177 verwiesen, sondern die zwei Freigaben **gegen den
heutigen Baum nachgemessen** — und dabei zwei Dinge gefunden, die T-177 nicht finden konnte
(Z-85, Z-87) und eines, das T-177 nicht wissen konnte (Z-86 in seiner heutigen Schärfe).

---

## 1. O-KE — die Messung gegen die Beschreibung

### 1.1 Was gemessen ist

Gelesen in `apps/web/src/styles/components.css`, Regel `.dialog__consequence`, und in
`packages/ui-tokens/tokens.css`:

```
.dialog__consequence {
  border-inline-start: 3px solid var(--danger-bg);      /* #ac2a22 hell, #ee8d87 dunkel */
  background-color:    var(--danger-bg-subtle);         /* #fdf0ef hell, #3a1512 dunkel */
  color:               var(--danger-text);              /* #ac2a22 hell, #ee8d87 dunkel */
}
```

**Die Fläche trägt die Gefahrenfarbe, dreifach: als Text, als Schiene und als getönter Grund.**
Die Beschreibung in T-221 hält der Messung nicht stand. frontend-dev hat richtig gemessen; eine
Kleinigkeit an seiner Zahl korrigiere ich mit, weil sie beim nächsten Umbau zählt: die Schiene
kommt aus `--danger-bg`, nicht aus `--danger-text`. **Am Bild ist das dasselbe** (beide Marken
tragen im hellen Schema `#ac2a22`), **an der Marke nicht** — wer die Schiene ändern will, ändert
`--danger-bg` und **trifft damit jeden gefüllten Gefahrenknopf mit**. Dieser Satz gehört in jeden
künftigen Auftrag an dieser Fläche; der Orchestrator hat ihn so ins Board übernommen.

**Die Kontrastfrage ist bereits versorgt** und darf niemanden aufhalten:
`apps/web/scripts/contrast-check.mjs:286` führt `--danger-text` auf `--danger-bg-subtle` mit
`min: 4.5`.

### 1.2 Und die Messung reicht weiter, als O-KE gefragt hat

T-220 Abschnitt 7.3 spricht von **„alle drei Träger"** von `.dialog__consequence`. Gezählt am
heutigen Baum sind es **neun JSX-Stellen in fünf Bausteinen** (13 Vorkommen in 7 Dateien,
zwei davon die beiden CSS-Dateien, zwei weitere Kommentare):

| Baustein | Stellen | Was dort steht |
|---|---|---|
| `ConfirmDialog.tsx` | 2 | **`consequence`** (Sinnbild `arrow-up-right`) und `refusal` (`alert-triangle`) |
| `AttachmentOpenDialog.tsx` | 3 | die Absage vor dem Klick (V-07), die **Warnung** vor der Ausführung, die Absage der Hülle |
| `ShellStatus.tsx` | 2 | Startabbruch, Steuerzeichen im Windows-Benutzernamen |
| `UpdateDialog.tsx` | 1 | `problem` |
| `FormDialog.tsx` | 1 | `submitRefusal` — der Träger aus T-220 |

**Der Fund steht in der ersten Zeile, und er ist der schwerere:** `ConfirmDialog#consequence` ist
**keine Absage und keine Warnung**, sondern die **Folge** — und sie steht in Gefahrenfarbe auf
getöntem Grund. Gemessen an sieben Aufrufstellen (von insgesamt 22 `consequence=`/`refusal=` in
15 Dateien):

```
BookingsScreen.tsx:534    „Dieselbe Arbeitszeit geht beim nächsten Export erneut in die Abrechnung…"
SettingsScreen.tsx:521    „Die Exportdatei enthält lesbare Kundennotizen. Base64 ist eine Kodierung…"
StatusSettings.tsx:421    „Der Status ist leer: Kein Todo trägt ihn. Vorhandene Todos ändern sich…"
TemplatesScreen.tsx:755   „Die gespeicherte Fassung bleibt unverändert; Export und Vorschau benutzen…"
Attachments.tsx:706-707   „Takt vergisst die Adresse beziehungsweise den Pfad. Die Datei oder die
                           Seite dahinter bleibt unberührt."
```

Die letzten beiden **beruhigen** und stehen in Rot. Damit trägt eine Gestalt heute **drei**
Textsorten: **Folge**, **Warnung**, **Absage**. Das ist kein Fehler von T-220 — der Baustein war
schon vorher so —, aber es ist der wahre Umfang der Frage, die O-KE aufmacht, und es ist der Grund,
warum ich unten **keine** Farbänderung anordne (1.5).

### 1.3 Welcher Satz an welcher Stelle durch welchen ersetzt wird

Gemessen: die unrichtige Aussage steht an **vier** Stellen, **alle in einer einzigen Datei** —
`.claude/team/reports/T-221-spec-ux-reviewer.md`. Sie ist **nirgends** in ein Papier, in Code oder
in einen Prüflauf gewandert (`rg "Gefahrenfarbe"` über den Arbeitsbaum: `contrast-check.mjs:278`
und `traeger-und-zusage.md:933` meinen den **Gefahrenknopf** und sind unberührt; `board.md:246`
und `:1279` zitieren die Frage selbst).

**Und das Papier hat es von sich aus richtig gemacht.** `docs/design/textbestand.md:2517`
(Nachtrag T-228) schreibt: *„(`role=\"status\"`, ohne `aria-invalid`, **ohne Fehlerfarbe am
Feld**)"*. Der Zusatz **„am Feld"** ist genau die Unterscheidung, die T-221 fehlte. **Dieser Satz
bleibt, wie er ist** — er ist zu keiner Zeit falsch gewesen.

| # | Stelle | Heutiger Wortlaut | Ersatz |
|---|---|---|---|
| 1 | `T-221-spec-ux-reviewer.md:161` | „**`role=\"status\"`, `.dialog__consequence`, kein `aria-invalid`, keine Gefahrenfarbe.** Das genau zitierte Vorbild ist ein **nicht**-Fehlerkanal." | „**`role=\"status\"`, `.dialog__consequence`, kein `aria-invalid` — die Gefahrenfarbe trägt es dagegen sehr wohl** (`components.css`: `color: var(--danger-text)`, `background-color: var(--danger-bg-subtle)`, `border-inline-start: 3px solid var(--danger-bg)`). Das genau zitierte Vorbild ist ein **nicht**-Fehlerkanal **im maschinell Gelesenen**, nicht im Augenschein — und **das** ist der Unterschied, auf den es ankommt." |
| 2 | `:173` (Ausgang 2) | „…, ohne `aria-invalid`, ohne Gefahrenfarbe." | „…, ohne `aria-invalid` — **in der Gestalt des Vorbilds, also mit dessen Gefahrenfarbe auf getöntem Grund.**" |
| 3 | `:548-549` (Befundblock Z-73) | „…mit `.dialog__consequence`, ohne `aria-invalid`, ohne Gefahrenfarbe." | „…mit `.dialog__consequence` und **ohne `aria-invalid`**. Die Gefahrenfarbe trägt es; sie ist **nicht** der Unterschied. Der Unterschied ist die maschinell gelesene Aussage." |
| 4 | `:168` (Ausgang 1) | „…daß dieses B mit `aria-invalid` und in Gefahrenfarbe erscheint…" | **unverändert richtig.** Der Feldkanal trägt die Gefahrenfarbe tatsächlich (`.field__input--invalid` → `border-color: var(--danger-text)`; `.field__error` → `color: var(--danger-text)`). Ich nenne die Stelle nur, damit niemand sie beim Berichtigen mitnimmt |

**Ausgeführt am 2026-09-06** — der Verlauf steht in 1.6. **Nicht gelöscht, sondern berichtigt**, an
Ort und Stelle: dieselbe Machart wie O-CQ in T-165 Abschnitt 3, weil der Verlauf einer Prüfung
selbst ein Beleg ist.

### 1.4 Dasselbe Bein oder ein anderes? — **Dasselbe. Und das ist die eigentliche Antwort.**

**Z-73 hatte nie vier Beine, sondern eines und drei Merkmale.** Der Satz in T-221 zählt vier Dinge
über das Vorbild auf; er verlangt aber nur **eines** davon, und er sagt selbst, welches. Der
tragende Satz von Z-73 lautet (`:140-144`):

> „…und für jede Vorlesehilfe die maschinell gelesene Aussage *dieser Wert ist ungültig* — an einem
> Wert, von dem dasselbe Papier zwei Seiten vorher sagt, er sei *gültig; er ist der gespeicherte*."

**E-093 Punkt 5 hat genau das und nichts anderes verbindlich gemacht:**

> „**Der Satz gehört nicht in den Fehlerkanal.** `TextField.error` setzt `aria-invalid=\"true\"` und
> die Fehlerfarbe — das erklärt einen **gültigen, gespeicherten** Wert für ungültig. … Es ist der
> einzige Befund dieser Runde, der einer Vorlesehilfe etwas **Falsches sagt**."

Die Gefahrenfarbe **sagt nichts Falsches**. Sie sagt „hier ist eine Wand" — und da ist eine.
`aria-invalid="true"` sagt „dieser Wert ist ungültig" — und der ist er nicht. Das eine ist eine
Gestaltfrage, das andere eine **Tatsachenbehauptung über den Bestand des Benutzers**. Der Befund
stand auf der Behauptung.

**Der Unterschied zu T-228, und er gehört ausgeschrieben.** Dort ist bei **13.3** ein Bein
weggebrochen — *„P-1 verbietet »Bitte« in einer Feldmeldung"* trug nicht mehr, weil der Satz den
Feldkanal mit E-093 Punkt 5 verlassen hatte —, und ux-designer mußte ein **neues** finden („sie
macht aus einer Absage eine Aufforderung und nennt nur einen der beiden Ausgänge"). **Hier ist
kein Bein weggebrochen.** Es ist eine **Zierde** gefallen: ein viertes Aufzählungsglied, das die
Beweiskraft des Absatzes optisch verstärkte, ohne sie zu tragen.

**Was sich trotzdem ändert, und es gehört aufgeschrieben:** Z-73 bot **zwei** Ausgänge an und
beschrieb Ausgang 2 als „ohne Gefahrenfarbe". Diesen Ausgang **gibt es im Bestand nicht**. Gebaut
ist deshalb ein **drittes** Ding, das niemand benannt hat: Statusfläche, **kein** `aria-invalid`,
**mit** Gefahrenfarbe. Es ist von E-093 Punkt 5 gedeckt (dort steht nur `aria-invalid` als Zusage),
es ist die richtige Wahl, und frontend-dev hat richtig entschieden, dem **Vorbild** und nicht dem
**Nebensatz** zu folgen (T-220 Annahme 1). Aber der nächste Leser darf nicht glauben, Ausgang 2 sei
wie beschrieben gebaut worden. **Der Ersatzwortlaut Nr. 2 in 1.3 schließt genau diese Lücke.**

**Das ist der Satz, den der Orchestrator übernommen hat**, und zu Recht: Eine Beschreibung, die
**zwei** Möglichkeiten aufzählt, während gebaut eine **dritte** ist, ist gefährlicher als eine, die
sich in einem Merkmal irrt — sie schickt den nächsten Leser in eine Wahl, die es nicht gibt.

### 1.5 Bekommt die Absage eine eigene Gestalt? — **Nein, kein Auftrag von mir.**

Vier Gründe, und der letzte trägt allein:

1. **Der Befund ist nicht der Fläche zuzurechnen, sondern dem Baustein.** Nach 1.2 trägt
   `.dialog__consequence` heute drei Textsorten. Eine eigene Gestalt nur für den **einen** neuen
   Träger machte aus einer Unschärfe eine **Unstimmigkeit**.
2. **Zwei Bauarten sind schlechter als eine** — das ist E-093 Punkt 1 wörtlich, und es ist die
   Lehre, gegen die der ganze T-220-Auftrag geschrieben wurde.
3. **Es ist eine Farbentscheidung**, also ui-designer, und keine Reviewfeststellung.
4. **Die Zusage, um die es geht, ist erfüllt.** Kein `aria-invalid`, kein roter Rand am Feld, der
   Wert bleibt gültig. Gemessen von frontend-dev am Bildschirm (T-220 Abschnitt 3.6), von mir am
   Quelltext bestätigt: `FormDialog.tsx:433-438`, `dialog__refusal` mit `role="status"`, und
   `submitRefusal` läuft nicht durch `TextField.error`.

**Meine Auflage, falls jemand es doch anfaßt** (und sie ist die Bedingung, nicht der Auftrag):
für **alle neun Stellen** gleichzeitig, mit einer Kontrastpaarung je neuem Farbpaar in
`contrast-check.mjs` **im selben Auftrag** (E-081 Punkt 4), und die Unterscheidung heißt dann
**Folge / Warnung / Absage** und nicht „Fehler / kein Fehler". Wer nur einen Träger anfaßt, hat die
zweite Bauart gebaut.

### 1.6 Was aus 1.3 wurde — die Berichtigung ist eingesetzt

**Am 2026-09-06, auf Nachtrag des Orchestrators, von mir selbst.** `.claude/team/reports/**` gehört
nach `CLAUDE.md` jedem Agenten seine eigene Datei, und `T-221-spec-ux-reviewer.md` ist meine — die
Ausführung brauchte deshalb keinen zweiten Agenten und keinen eigenen Auftrag. **Kein Nachtrag am
Dateiende:** jede Berichtigung steht an der berichtigten Stelle, weil ein Nachtrag, der die
berichtigte Stelle nicht erreicht, beim nächsten Lesen überlesen wird.

| Stelle (neu / vorher) | Was jetzt dort steht |
|---|---|
| `T-221` **1.4, Zeile 161-166** (vorher `:161-163`) | Der berichtigte Absatz: kein `aria-invalid`, **aber** die drei Farbwerte; „ein **nicht**-Fehlerkanal **im maschinell Gelesenen**, nicht im Augenschein" |
| `T-221` **Zeile 168-201**, neuer Kasten | *„Berichtigt am 2026-09-06 (T-237, O-KE) — und es ist eine Berichtigung der Begründung, keine Rücknahme des Urteils."* Trägt vier Dinge: den alten Wortlaut im Zitat; die Messung (dreifach, **Schiene aus `--danger-bg`**, am Bild dasselbe `#ac2a22`, an der Marke nicht, trifft jeden gefüllten Gefahrenknopf mit); das Bein (**eines und drei Merkmale**, E-093 Punkt 5 hat genau dieses eine verbindlich gemacht, gefallen ist eine **Zierde**); und einen **Schutzsatz für Ausgang 1** — *„Wer diese Stelle berichtigt, nimmt jene **nicht** mit."* Dazu der **dritte Gegenstand**, den niemand benannt hatte |
| `T-221` **Ausgang 2, Zeile 209-214** (vorher `:172-175`) | „…, ohne `aria-invalid`, **in der Gestalt des Vorbilds, also mit dessen Gefahrenfarbe auf getöntem Grund**" — mit dem Verweis auf den Kasten |
| `T-221` **Befundblock Z-73, Zeile 586-603** (vorher `:546-549`) | „…mit `.dialog__consequence` und OHNE `aria-invalid`.", darunter `[BERICHTIGT 2026-09-06, T-237/O-KE.]` mit den drei Farbwerten, der Marke der Schiene und dem Schluß, daß **Ausgang (b) so, wie er dasteht, nicht im Bestand vorhanden** ist |
| `T-221` **Zeile 205** (vorher `:168`) | **unberührt.** Sagt weiter „mit `aria-invalid` und in Gefahrenfarbe" — der Feldkanal trägt sie tatsächlich |

**Zwei Stellen habe ich zusätzlich mitberichtigt**, weil sie sonst als frischer Widerspruch zum
Kasten stehengeblieben wären — beide als benannter Nachtrag, ohne den alten Text zu löschen. Eine
Berichtigung, die einen frischen Widerspruch hinterläßt, ist keine:

1. **`T-221` Annahme 3** (Zeile 800-803). Dort stand die Liste *„am Code gelesen, nicht laufen
   gesehen"* mit drei Einträgen. Ein **vierter** gehörte hinein und stand nicht darin — die
   Behauptung über die **Gestalt** von `.dialog__consequence` war weder gelesen noch laufen gesehen,
   sondern **angenommen**. Der Nachtrag sagt das an Ort und Stelle: *„Genau dafür ist diese
   Annahmeliste da; sie hat den einen Satz nicht gefangen, der sie gebraucht hätte."*
2. **`T-221` Risiko 1** (Zeile 815-818). Dort stand schon vorher *„Die Absage erscheint in Rot statt
   in Grau" liest sich wie Geschmack* — und dann der tragende Satz, der **`aria-invalid`** nennt und
   nicht die Farbe. Der Nachtrag hält fest, daß dieser Risikosatz die genaueste Fassung des Befundes
   im ganzen Bericht ist und daß er die Farbe von Anfang an als die schwache Hälfte benannt hat.

**Integrität nachgezählt:** 809 → 869 Zeilen, alle neun Abschnitte, alle vierzehn Befunde Z-71 bis
Z-84 unverändert vorhanden.

---

## 2. O-EL — trägt „Diese Datei wird nicht geöffnet"?

### 2.1 Die Freigabe hält — und die Begründung dafür ist eine andere als die vorgelegte

**Z-11 aus T-177 bestätige ich gegen den heutigen Baum.** Gemessen an
`apps/web/src/components/AttachmentOpenDialog.tsx:269-274`: die drei Überschriften stehen
unverändert, `blocked` schaltet sie, `blocked = foreseenRefusal !== null`.

**Aber die Begründung, die frontend-dev in T-167 offene Frage 3 gegeben hat, trägt nicht — in
beiden Hälften.** Sie lautet dort:

> „Sie beginnt bewusst mit denselben drei Wörtern wie die beiden anderen Überschriften — **der
> Unterschied steht am Ende des Satzes, wo er gelesen wird**, und
> `getByRole('alertdialog', { name: /Diese Datei wird/ })` in
> `attachment-open-commands.spec.ts:70` **trifft weiterhin alle drei**."

**Erste Hälfte, gemessen:**

```
Zustand 1:  Diese Datei wird geöffnet
Zustand 2:  Diese Datei wird ausgeführt
Zustand 3:  Diese Datei wird nicht geöffnet
```

Zustand 1 und Zustand 3 **enden auf demselben Wort**. Der Unterschied steht **nicht am Ende**,
sondern als eingeschobenes „nicht" an vierter von fünf Stellen. Nur Zustand 2 unterscheidet sich
am Ende. Die Begründung beschreibt also genau den Fall **nicht**, für den sie gegeben wurde.

**Zweite Hälfte, gemessen** (`tests/e2e/attachment-open-commands.spec.ts:68-70`):

```ts
// Kein Öffnen-Dialog bei einem Verweis (Auflage A-A-7) …
await expect(page.getByRole('alertdialog', { name: /Diese Datei wird/ })).toHaveCount(0);
```

Das ist eine **Zusicherung auf null Treffer**, und sie steht im **Verweis**-Fall, in dem gar kein
Dialog aufgeht. Sie kann nicht belegen, daß ein Suchausdruck „alle drei trifft" — sie bliebe grün,
wenn er **keinen** träfe. Ein Prüffall, der bei einer stillen Rücknahme grün bleibt, ist genau die
Klasse, die E-094 Punkt 3 benennt.

**Und daraus folgt der schwerere Teil:** Die zwei Fälle, die die Überschrift wirklich festnageln,
sind `:95` (Zustand 1) und `:134` (Zustand 2). **Für Zustand 3 gibt es keinen.** Gesucht über den
Wortlaut und über beide Hälften: `„Diese Datei wird nicht geöffnet"` kommt in `tests/**` und in
`apps/*/test/**` **kein einziges Mal** vor; `foreseenRefusal` und `foreseeableRefusalOf` ebenfalls
nicht. Das ist **Z-85**.

**Worauf das Urteil statt dessen steht — das andere Bein:** Die Überschrift ist **nicht der
alleinige Träger** des Unterschieds. Drei weitere Träger sagen dasselbe, und alle drei sind gemessen:

| Träger | Zustand 1 | Zustand 3 | Beleg |
|---|---|---|---|
| Sinnbild | `info` | `alert-triangle` | `:265-267` |
| Rumpfsatz | Wirkungssatz („Takt übergibt diese Datei…") | der **Grund**, im Absagefach | `:286-297` |
| Fußzeile | „Abbrechen" **und** „Öffnen" | **nur** „Schließen" | `:364-389` |

Ein Benutzer, der das „nicht" überliest, findet **keinen Öffnen-Knopf** — und das ist die Auskunft,
die nicht zu überlesen ist. Die Überschrift trägt, **weil sie nicht allein trägt.** Das ist die
gestufte Offenlegung aus E-078 Punkt 2, angewandt auf einen Zustandswechsel statt auf einen Satz.
Frontend-devs Wahl war richtig; sein Grund war es nicht.

### 2.2 Warnung oder Aussage? — **Aussage. Nach A-19.15, nicht nach Geschmack.**

Die Frage ist mit einer Anforderungs-ID zu entscheiden, und es ist nicht die, die man erwartet.

- **R-21 und A-A-6** regeln die **Rückfrage vor einem Programmstart**. Ihr Gegenstand ist eine
  **nicht umkehrbare Handlung, die der Benutzer noch auslösen kann**. Das ist Zustand 2. Dort ist
  die Warnung richtig, und sie ist in T-165 als **G-3** gesperrt.
- **A-19.15** lautet: *„Ein Anhang, der sich **nicht öffnen lässt** — Datei verschwunden, Adresse
  unbrauchbar, Bild nicht mehr lesbar —, sagt das **an Ort und Stelle**. Er verschwindet nicht und
  er wirft nicht."* Das ist Zustand 3, wörtlich. V-07 hat nichts anderes getan, als diese Auskunft
  **vor** den Klick zu ziehen statt hinter ihn.

**Damit ist Zustand 3 der Klasse A-19.15 zugeordnet und nicht der Klasse R-21.** Eine Warnung
warnt vor einer Folge, die eintreten **kann**; hier kann keine eintreten, weil Takt den Weg
geschlossen hat und den Knopf nicht anbietet. Der richtige Register ist die **Aussage über einen
Zustand** — und genau die macht die Überschrift.

**Die Überschrift ist damit richtig. Die Gestalt darunter ist es nicht** (**Z-86**):

```
:265-267   dialog__icon--danger + Icon "alert-triangle"      <- Gestalt der Warnung
:287-290   <p className="dialog__consequence">               <- Gefahrenfarbe, getönter Grund
:300-307   dieselbe Klasse trägt zwei Elemente weiter unten die echte Ausführungswarnung
:262       dialog--danger wird NICHT gesetzt (executes ist false)
```

Der **Rahmen** bleibt ruhig, **Sinnbild und Absagefach** warnen — und sie warnen in derselben
Gestalt wie der Satz „Diese Datei wird dabei ausgeführt. … läuft mit Ihren Rechten", der zwei
Elemente tiefer im **anderen** Zustand steht. Zwei Register, eine Gestalt, in **einem** Baustein.

**Das ist heute kein Schaden, und deshalb ist es eine Auflage und keine Blockade.** Wer den dritten
Zustand sieht, hat einen `.lnk`, `.url`, `.pif`, `.scf`, `.desktop` oder einen Doppelpunkt im
Namen — Dinge, bei denen ein warnendes Sinnbild nichts Falsches behauptet.

**Es wird aber teurer, und der Grund ist heute meßbar:** `checkAttachmentPath`
(`packages/domain/src/attachment.ts:826-837`) weist beide Klassen inzwischen **an der Tür** ab —
`path_stream_separator` **und** `path_indirect_extension`. Wer den dritten Zustand heute sieht, hat
folglich einen **Altbestandsanhang**: einen Wert, der angelegt wurde, bevor die Regel stand. Der
häufigste solche Wert ist unter Windows ein `.lnk` — und unter Linux eine harmlose Datei mit einem
Doppelpunkt im Namen, etwa `Besprechung 10:30.pdf` (T-167 Risiko 2 hat genau diesen Preis
angemeldet). **Diesem Benutzer sagt Takt: rotes Warndreieck, Gefahrenfarbe, „Diese Datei wird nicht
geöffnet".** Der Text ist wahr, das Sinnbild ist eine Übertreibung, und das Zusammenspiel liest
sich, als sei die Datei gefährlich. Sie ist es nicht — **Takt** ist streng.

**Meine Empfehlung, ausdrücklich als Empfehlung und nicht als Auftrag** (die Gestalt gehört
ui-designer, der Text ux-designer): Im Zustand 3 das Sinnbild von `alert-triangle` auf `info`
zurücknehmen und das Absagefach in der Gestalt lassen, die 1.5 für alle neun Träger vorsieht. Die
Überschrift **bleibt zeichengleich** — sie ist der Teil, der richtig ist.

### 2.3 Drei Zusagen aus T-177 Z-11, gegen den heutigen Baum nachgeprüft

| Auflage aus Z-11 | Heute |
|---|---|
| Der Titel bleibt **in der Reihe**; „Öffnen nicht möglich" / „Das hat nicht geklappt" bleiben **verboten** | **gehalten.** Drei Titel, eine Satzform (`:269-273`) |
| **„Schließen" statt „Abbrechen"** bleibt | **gehalten** (`:364-367`), mit der Begründung im Kommentar |
| Der Wirkungssatz entfällt **in diesem und keinem anderen** Zustand | **gehalten** (`:286-297`). **SP-01 unangetastet**, wie dort ausdrücklich bestätigt |

**Der Hinweis aus Z-11 an ui-designer gilt weiter und wird durch Z-86 nicht aufgehoben, sondern
verschärft:** dort stand *„Der Rahmen bleibt ruhig, das Symbol warnt."* Ich halte den ersten
Halbsatz aufrecht und ziehe den zweiten zurück: **Der Rahmen bleibt ruhig, und das Symbol soll es
auch.** Das ist eine **Änderung meines eigenen früheren Urteils**, und sie steht hier, damit sie
nicht als Widerspruch zweier Berichte stehenbleibt. Der Grund für die Änderung ist neu und war in
T-177 nicht zu haben: daß die Tür inzwischen zu ist und der Zustand deshalb **nur noch** Altbestand
trifft — also überwiegend harmlosen.

---

## 3. O-EP — die zwei Abweichungen von X-04

**Beide tragen. Beide sind seit T-177 freigegeben (Z-09, Z-10). Ich bestätige gegen den heutigen
Baum und trage nach, was seither dazugekommen ist.**

### 3.1 (a) Das sichtbare `http://` — trägt

Gemessen, `packages/domain/src/attachment.ts:1042-1044`:

```ts
// Weggelassen wird genau ein Schema, und zwar das, das nichts sagt.
// Jedes andere — heute nur `http:` — bleibt sichtbar stehen.
return url.protocol === 'https:' ? rest : `${url.protocol}//${rest}`;
```

**Meine Auflage 1 zu X-04 war der Fehler, nicht die Abweichung.** Ich hatte geschrieben: *„Das
Schema fällt weg … es gibt ohnehin nur `http` und `https`."* Der zweite Halbsatz **widerlegt den
ersten**: Weil es zwei gibt, unterscheidet das Schema — und X-04s eigene Bedingung lautete, daß
zwei verschiedene Anhänge nie dieselbe Beschriftung tragen. Meine Auflage hätte den Befund, zu dem
sie gehört, eine Ebene tiefer wieder aufgemacht, und zwar wieder am zugänglichen Namen des
**Entfernen**-Knopfes (`Attachments.tsx:304`).

**Der Preis, gemessen:** sieben Zeichen, **nur am selteneren Schema**. `https://` fällt weiter weg,
weil es an jedem zweiten Anhang gleich lautet.

**Der zweite Grund von domain-dev trägt eigenständig**, und er ist der, den ich in X-04 nicht
gesehen habe: Bei einem Verweis fragt Takt **nicht** zurück (A-A-7, richtig so). Die Liste ist die
**ganze** Anzeige vor dem Klick. Ein sichtbares `http://` ist damit die einzige Stelle im ganzen
Erzeugnis, an der eine Herabstufung auffällt, bevor der Browser aufgeht. Das ist zugleich das
Verhalten, das der Benutzer aus jedem Browser kennt: `https` verschwindet, `http` wird ausgezeichnet.

**Zur Kostenseite, die der Auftrag ausdrücklich abgewogen haben will (SC 2.4.6, SC 4.1.2):** Der
zugängliche Name **ändert sich** — er tut es aber bereits durch X-04 selbst, und in beide Fälle
hinein zum Besseren. SC 4.1.2 verlangt einen Namen, nicht einen kurzen; SC 2.4.6 verlangt, daß er
den **Zweck beschreibt** — und ein Name, der zwei verschiedene Ziele gleich benennt, tut das nicht.
Die sieben Zeichen kaufen die Erfüllung von SC 2.4.6 an einer Stelle, wo ein Knopf daneben löscht.
**Das ist den Preis wert.**

**Prüffälle, gemessen** (`packages/domain/test/attachment.test.ts`): `:684-686` nagelt
`http://beispiel.example/tickets/4711` zeichengleich fest, `:749-750` mißt `http` gegen `https` als
**Unterscheidbarkeit**. Beide stehen. Die Freigabe ist damit gegen eine stille Rücknahme gesichert.

### 3.2 (b) Der längere Dateifall — trägt

Gemessen, `:1048-1057`: der **Name vorn**, der Ordner **mit seinem Trenner** in Klammern dahinter;
ohne Trenner im Wert steht der Name allein.

**Meine ursprüngliche Aussage war für den Einzelfall richtig und für die Liste falsch.** X-04 sagt:
*„Bei der Datei ist die Wahl richtig: Das letzte Stück ist das unterscheidende."* Das gilt für
**eine** Datei. Der **tragende Grund** von X-04 war aber ein anderer, und ich habe ihn selbst so
benannt: *„Der zugängliche Name wird mehrdeutig, und er hängt an einem zerstörenden Knopf."*
Wendet man **diesen** Grund konsequent an, trifft er zwei Kundenordner mit je einer `rechnung.pdf`
genauso wie drei Ticketverweise auf denselben Wirt. domain-dev hat meinen eigenen tragenden Grund
weiter getragen als ich. **Das ist keine Abweichung, das ist eine Vervollständigung.**

**Die Bauform ist die richtige, und der Grund gehört gemessen:** `truncate` schneidet **hinten** ab,
eine Vorlesehilfe liest **vorn** zuerst (Ableitung aus der Leserichtung, nicht gehört — T-B09). Das
Unterscheidende steht damit in **beiden** Kanälen an erster Stelle. Wäre der Pfad vorangestellt
worden, wäre es genau die Falle, die ich der Verweiszeile vorgeworfen habe.

**Zur Kostenseite (SC 2.4.6, SC 4.1.2), und hier ist der Anker meine eigene Regel:** T-165
Abschnitt 4.0 **Regel 2** lautet: *„Gekürzt wird der sichtbare Text, nie der zugängliche Name."*
Ein längerer Name auf einem Löschknopf ist nach dieser Regel kein Preis, sondern die Vorgabe. Die
Länge steht der **Sache** nach da: `„rechnung.pdf (C:\Kunden\Meier\)"` ist ausführlich und trifft
genau **einen** Anhang.

**Zwei Auswege, die ich geprüft und verworfen habe** — sie kommen sonst in der nächsten Runde
wieder:

1. **Den Ordner nur zeigen, wenn er zur Unterscheidung nötig ist.** Das machte `attachmentLabel`
   **listenabhängig**: Der zugängliche Name eines Knopfes änderte sich, weil eine **andere** Zeile
   dazukam oder wegfiel. Ein Name, der sich durch fremde Ereignisse ändert, ist schlimmer als ein
   langer (SC 4.1.2, und praktisch: jeder Prüffall über den Namen würde von der Nachbarschaft
   abhängen). Zusätzlich wanderte damit Anzeigelogik in die Domäne.
2. **Nur das letzte Ordnerstück** (`bericht.pdf (nutzer)`). Dann kollidieren `/a/kunde/` und
   `/b/kunde/` — derselbe Befund eine Ebene höher.

**Prüffälle, gemessen:** `:690-691` (`bericht.pdf (/home/nutzer/)`), `:696` (Wurzelordner `C:\`),
`:700` (ohne Trenner), `:704` (Pfad ohne Namen), und — das ist der, der wirklich zählt —
`:733-763`, `„attachmentLabel — zwei verschiedene Anhänge tragen nie dieselbe
Ersatzbeschriftung (X-04)"` mit dem Fall zweier gleichnamiger Dateien in zwei Ordnern (`:761-762`).
**Auflage 3 aus Z-10 ist damit erfüllt**, und zwar in der Form, die ich verlangt hatte: der Fall
über die Unterscheidbarkeit, nicht bloß der über die Zeichenkette.

### 3.3 Wenn nur eine trüge — welche?

Der Auftrag verlangt die Antwort auch für den Fall, daß nur eine trägt. **Sie trifft nicht zu**,
aber die Rangfolge gehört benannt, weil sie zeigt, worauf das Urteil ruht:

**(b) wäre die, die stehenbleibt.** Sie folgt unmittelbar aus dem tragenden Grund von X-04 und
schließt einen Weg zum **falschen Löschen**. **(a)** schließt denselben Weg für einen selteneren
Fall (`http` **und** `https` auf demselben Pfad, in derselben Liste, beide ohne Titel) und ist
darüber hinaus eine **Sicherheitssichtbarkeit** — wertvoll, aber nicht der Kern von X-04. Beide
tragen; wäre nur eine zu haben, wäre es (b).

### 3.4 Die eine Auflage aus Z-09, die nicht erledigt ist

T-177 gab security-checker mit auf: `docs/bedrohungsmodell.md` T-156-8 beschreibe einen Zustand,
den es nicht mehr gebe. **Gemessen heute, `docs/bedrohungsmodell.md:5236`:**

> „**Die erste Zeile eines Verweises zeigt das Schema nicht.** `attachmentLabel` schneidet
> `https://` **beziehungsweise `http://`** weg; eine Herabstufung von `https` auf `http` steht damit
> nur in der zweiten, kleineren Zeile."

**Unverändert — und damit beschreibt das Bedrohungsmodell den Code heute falsch.** `http://` wird
nicht mehr weggeschnitten (`attachment.ts:1044`). Das ist schlimmer als ein veralteter Hinweis: Es
ist ein Hinweis, der eine **behobene** Lage als offen führt und zugleich eine **falsche Aussage über
den Bau** trifft — genau die Sorte Satz, die beim nächsten Lesen zur Begründung wird, etwas
zurückzubauen. **Z-87, Wiedervorlage an security-checker**, Ersatzwortlaut unten im Befundblock.

---

## 4. Was ich geprüft und **nicht** beanstandet habe

| Geprüft | Ergebnis |
|---|---|
| **A-19.12** — „nie eine leere Zeile" | **erfüllt** in allen Zweigen: `:1046` (`'Verweis'`), `:1053` (`'Datei'`), `:1060` (`'Bild'`), und jeder Rückfall endet beim vollen Wert |
| **A-19.17** — Frist und Anhang in **keinem** Export | **unberührt.** `attachmentLabel` fließt in Zeile, Vorschau-`alt`, Toast, `ConfirmDialog`. Kein Export, kein Protokoll |
| **Fremder Text** | Beide Beschriftungen bleiben fremder Text: `.attachment__label` über `<Foreign>` (`Attachments.tsx:269, 272`), der Dialog über `foreignText` an **allen** Teilen inkl. des aufgelösten Namens (`AttachmentOpenDialog.tsx:239-251`) |
| **A-A-6 Punkt 1** — voller Pfad ungekürzt | **erfüllt**, auch im dritten Zustand (`:335-338`). Der Zustand nimmt den Öffnen-Knopf weg, **nicht** den Pfad — richtig so: der Benutzer muß wissen, **welche** Datei abgewiesen wurde |
| **E-078** am dritten Zustand | **kein Textstau.** Vier Zeilen: Überschrift, Grund, Namensblock, ein Knopf. Der Wirkungssatz **entfällt**, statt zu einem zweiten Satz zu werden |
| Deutsch, „Frist" | keine Abweichung in den geprüften Flächen |
| **P-1 / P-8 / P-9 (E-092)** | Am `AttachmentOpenDialog` **gegenstandslos** — er trägt kein Pflichtfeld und keine Feldmeldung. P-8 ist an `Attachments`' Hinzufügen-Dialog erfüllt (`onTouched` an beiden Wertfeldern, `Attachments.tsx:467, 480`) |
| **Anrede** | „Ihr System", „mit Ihren Rechten" — durchgehend „Sie" in beiden geprüften Flächen. X-01 bleibt außerhalb dieser Prüfung |

**Nicht geprüft, und das ist eine Grenze dieses Berichts:** die vier Zustände im Browser (kein Lauf
gefahren), der dritte Zustand mit einem Vorleseprogramm (T-B09), und die Darstellung unter WebKit.

---

## 5. Befunde

```
Z-85  A-19.15, E-094 Punkt 3        S-03 Anhang öffnen, dritter Zustand
      SC 4.1.2                      Abweichung: Der dritte Zustand der Rückfrage hat KEINEN
                                    Prüffall. Gemessen über den Wortlaut, über versionierte und
                                    unversionierte Quellen: „Diese Datei wird nicht geöffnet"
                                    kommt in tests/** und apps/*/test/** null mal vor,
                                    `foreseenRefusal` und `foreseeableRefusalOf` ebenfalls null
                                    mal. Zustand 1 (`attachment-open-commands.spec.ts:95`) und
                                    Zustand 2 (`:134`) sind zeichengleich festgenagelt.
                                    `:70` ist als Beleg untauglich: eine `toHaveCount(0)`-
                                    Zusicherung im VERWEIS-Fall, in dem gar kein Dialog aufgeht
                                    — sie bliebe grün, wenn der Suchausdruck keinen einzigen
                                    Titel träfe. Damit ist der einzige Zustand ohne Messung
                                    ausgerechnet der, der einen Öffnen-Knopf WEGNIMMT.
                                    Vorschlag: e2e-tester, ein Fall wie TP-ANH-19, aber mit
                                    einem Altbestandswert, den die Tür heute abweist — über die
                                    Speicherung angelegt oder über die API vor der Regel. Drei
                                    Zusicherungen, alle drei nötig: der Titel zeichengleich, es
                                    gibt KEINEN Knopf „Öffnen"/„Ausführen", und
                                    `__taktOpenAttachmentFileCalls__` bleibt bei 0. Die dritte
                                    ist die eigentliche: die anderen beiden messen die Anzeige,
                                    die dritte die Wirkung.
                                    AUSGANG (2026-09-06): beauftragt als O-KQ an e2e-tester, in
                                    einer Welle OHNE portgebundene Läufe (E-083 Punkt 2). Die
                                    Zusicherung auf die WIRKUNG und der Altbestandswert stehen
                                    im Auftragstext. Der `toHaveCount(0)`-Nebenbefund geht als
                                    O-KR in denselben Auftrag (E-094 Punkt 3).

Z-86  A-19.15 gegen R-21            S-03 Anhang öffnen, dritter Zustand
      SC 1.4.1, E-078 Punkt 2       Abweichung: AUFLAGE, nicht blockierend. Die Überschrift ist
                                    richtig — der Zustand fällt unter A-19.15 („ein Anhang, der
                                    sich nicht öffnen lässt, sagt das an Ort und Stelle") und
                                    nicht unter R-21 (Warnung vor einer Handlung, die der
                                    Benutzer noch auslösen kann). Die GESTALT sagt das
                                    Gegenteil: `dialog__icon--danger` mit `alert-triangle`
                                    (AttachmentOpenDialog.tsx:265-267) und die Absage in
                                    `.dialog__consequence` (:287-290) — dieselbe Gestalt, die
                                    zwei Elemente tiefer die echte Ausführungswarnung trägt
                                    (:300-307). Der Rahmen bleibt ruhig (`dialog--danger` wird
                                    nicht gesetzt), Sinnbild und Fach warnen.
                                    Verschärft seit T-177: `checkAttachmentPath`
                                    (packages/domain/src/attachment.ts:826-837) weist heute
                                    BEIDE Klassen an der Tür ab. Wer den dritten Zustand sieht,
                                    hat folglich einen ALTBESTANDSWERT — unter Linux am ehesten
                                    eine harmlose Datei mit Doppelpunkt im Namen
                                    („Besprechung 10:30.pdf", T-167 Risiko 2). Ihr gilt heute
                                    ein rotes Warndreieck. Der Text ist wahr, das Sinnbild ist
                                    eine Übertreibung, und zusammen lesen sie sich, als sei die
                                    Datei gefährlich. Sie ist es nicht — Takt ist streng.
                                    Vorschlag: ui-designer, im dritten Zustand `info` statt
                                    `alert-triangle`; das Absagefach folgt der Entscheidung aus
                                    Z-89 für alle neun Träger. Die ÜBERSCHRIFT bleibt
                                    zeichengleich — sie ist der Teil, der richtig ist. Damit
                                    ziehe ich den zweiten Halbsatz meines eigenen Hinweises aus
                                    T-177 Z-11 („der Rahmen bleibt ruhig, das Symbol warnt")
                                    zurück; der erste bleibt.
                                    AUSGANG (2026-09-06): geht mit Z-89 als EINE Vorlage an
                                    ui-designer (O-KT), samt der Rücknahme aus T-177 Z-11 — der
                                    Rahmen bleibt ruhig, und das Sinnbild soll es auch.

Z-87  A-19.12, R-22                 docs/bedrohungsmodell.md:5236 (Hinweis T-156-8)
      Wiedervorlage aus T-177 Z-09  Abweichung: Der Hinweis sagt, `attachmentLabel` schneide
                                    „`https://` beziehungsweise `http://`" weg. Gemessen in
                                    packages/domain/src/attachment.ts:1044 trifft das für
                                    `http://` seit T-168 NICHT mehr zu. Der Hinweis beschreibt
                                    damit nicht nur einen behobenen Zustand als offen, sondern
                                    trifft eine falsche Aussage über den heutigen Bau — an der
                                    einen Stelle, an der eine Herabstufung sichtbar wird.
                                    T-177 hat das als Auflage zu Z-09 an security-checker
                                    gegeben; die Zeile ist unverändert.
                                    Vorschlag: security-checker. Entweder schließen, oder auf
                                    den verbleibenden Rest umschreiben, etwa: „Die erste Zeile
                                    eines Verweises zeigt `https://` nicht; `http://` steht seit
                                    T-168 sichtbar da (attachment.ts, Fall `link`). Damit ist
                                    eine Herabstufung vor dem Klick erkennbar. Rest: bei
                                    gesetztem Titel steht das Schema in keiner der beiden
                                    Zeilen — dort trägt der Benutzertitel."
                                    AUSGANG (2026-09-06): beauftragt als O-KS an
                                    security-checker, in seinen nächsten Durchgang.

Z-88  E-087                         .claude/team/board.md:1129 und :1133
                                    Abweichung: Verfahrensbefund. O-EL und O-EP stehen als
                                    offene Fragen an spec-ux-reviewer, obwohl T-177 beide
                                    entschieden hat (Z-11 bzw. Z-09/Z-10, „Freigegeben mit
                                    Auflagen" in der Kurzfassung). Vier weitere Befunde
                                    derselben Aufgabe (O-EW, O-EX, O-EY, O-EZ) sind sauber
                                    durchgestrichen und mit ihrem Ausgang versehen — die Pflege
                                    ist gelaufen und hat genau diese zwei ausgelassen. Folge:
                                    dieselbe Frage ist zweimal beauftragt worden, und die
                                    Auflagen aus T-177 wären beinahe ein zweites Mal vergeben
                                    statt nachgehalten worden (Z-87 zeigt, daß eine davon offen
                                    ist).
                                    Vorschlag: Orchestrator. Beide Zeilen durchstreichen, mit
                                    „entschieden in T-177 (Z-11 bzw. Z-09/Z-10), bestätigt in
                                    T-237" und dem Verweis auf die offene Auflage Z-87. Und die
                                    allgemeine Lehre, eine Zeile wert: Wer eine Frage
                                    beantwortet, streicht die Zeile, aus der sie kam — sonst
                                    kostet dieselbe Antwort zweimal eine Welle.
                                    AUSGANG (2026-09-06): ERLEDIGT. Beide Zeilen sind
                                    gestrichen und tragen ihren Ausgang. Der Fehler steht als
                                    O-KU beim Orchestrator, mit der Auflage, beim nächsten
                                    Abgleich ALLE Wellen mit Auflagen gegen ihre Boardzeilen zu
                                    prüfen.

Z-89  E-093 Punkt 1, E-081 Punkt 4  Alle Dialoge — `.dialog__consequence`
      SC 1.4.1                      Abweichung: HINWEIS mit Bedingung, kein Auftrag. Gemessen:
                                    neun JSX-Stellen in fünf Bausteinen (ConfirmDialog 2,
                                    AttachmentOpenDialog 3, ShellStatus 2, UpdateDialog 1,
                                    FormDialog 1) — nicht „drei Träger", wie T-220 Abschnitt
                                    7.3 annimmt. Sie tragen DREI Textsorten in EINER Gestalt
                                    (Gefahrenfarbe auf getöntem Grund): die FOLGE
                                    (ConfirmDialog#consequence, Sinnbild `arrow-up-right`, 22
                                    Aufrufstellen in 15 Dateien — darunter beruhigende Sätze wie
                                    „Die Datei oder die Seite dahinter bleibt unberührt."), die
                                    WARNUNG (Ausführung) und die ABSAGE (V-07, Hülle,
                                    submitRefusal).
                                    Vorschlag: KEINE Änderung aus dieser Freigabe. Wer sie
                                    dennoch anfaßt, ist an drei Bedingungen gebunden: (1) alle
                                    neun Stellen in EINEM Auftrag — zwei Bauarten sind
                                    schlechter als eine (E-093 Punkt 1); (2) je neuem Farbpaar
                                    eine Paarung in contrast-check.mjs im SELBEN Auftrag
                                    (E-081 Punkt 4); das vorhandene Paar `--danger-text` auf
                                    `--danger-bg-subtle` steht dort bereits mit min 4.5
                                    (`:286`); (3) die Unterscheidung heißt Folge / Warnung /
                                    Absage und nicht „Fehler / kein Fehler". Zur Genauigkeit:
                                    die Schiene kommt aus `--danger-bg`, nicht aus
                                    `--danger-text` (am Bild im hellen Schema dasselbe
                                    #ac2a22, an der Marke nicht) — WER SIE ÄNDERT, TRIFFT JEDEN
                                    GEFÜLLTEN GEFAHRENKNOPF MIT.
                                    AUSGANG (2026-09-06): geht mit Z-86 als EINE Vorlage an
                                    ui-designer (O-KT). Der Satz über die Schiene ist vom
                                    Orchestrator ins Board übernommen und gehört in jeden
                                    künftigen Auftrag an dieser Fläche.
```

---

## 6. Annahmen

1. **Die Nummernreihe Z-85 bis Z-89** setzt Z-01 bis Z-84 fort. Gemessen: Z-84 (T-221) ist die
   höchste bisher vergebene; keine Kollision.
2. **„Auf demselben Bein" heißt: der tragende Grund ist unberührt.** Ich habe das an dem Maßstab
   entschieden, den T-228 aufgestellt hat — nicht daran, wie viele Sätze der Begründung fallen,
   sondern daran, ob der Grund fällt, **auf den sich die verbindliche Entscheidung beruft**. Das ist
   hier E-093 Punkt 5, und der nennt `aria-invalid`.
3. **Zustand 3 fällt unter A-19.15 und nicht unter R-21.** Das ist eine Zuordnung, keine Ableitung
   aus einem Satz der Spezifikation — A-19.15 nennt drei Beispiele („Datei verschwunden, Adresse
   unbrauchbar, Bild nicht mehr lesbar") und nicht „von Takt abgewiesen". Ich lese die Aufzählung
   als Beispiele und nicht als Abschluß, weil der Halbsatz davor die Klasse allgemein benennt
   („der sich nicht öffnen lässt").
4. **Ich habe die Freigaben aus T-177 nachgemessen und nicht zitiert**, und zwar vollständig. Wo
   ich zu demselben Ergebnis komme, steht es als Bestätigung; wo etwas dazugekommen ist (Z-85,
   Z-86, Z-87), steht es als neuer Befund.
5. **Keine Farb- und keine Textentscheidung von mir.** Z-86 und Z-89 sind Auflagen an ui-designer
   beziehungsweise Bedingungen; die Überschrift aus O-EL bleibt zeichengleich, und ich habe keinen
   Satz erfunden.
6. **Ich habe keinen Prüflauf und keinen Browser gestartet.** Farbwerte aus `components.css` und
   `tokens.css`, Zustände aus dem Quelltext, Prüffallbestand aus dem Arbeitsbaum.

---

## 7. Risiken

1. **Der ungemessene dritte Zustand (Z-85) ist das ernsteste dieser Runde.** Er ist der einzige
   Zustand der Rückfrage, in dem der Öffnen-Knopf **verschwindet** — und die einzige Zusicherung,
   die man dafür halten könnte, ist eine `toHaveCount(0)` in einem fremden Fall. Wer den `blocked`-
   Zweig beim nächsten Umbau versehentlich aufhebt, bekommt einen Dialog mit Öffnen-Knopf für einen
   Wert, den die Hülle danach abweist — und **jeder heutige Lauf bliebe grün**. Der Schaden bliebe
   an der Hülle hängen (sie prüft weiter), aber die Reihenfolge der Auskunft wäre wieder verkehrt
   herum, also genau V-07 rückgängig. **Beauftragt als O-KQ.**
2. **Z-87 ist ein Papier, das den Bau falsch beschreibt, im Bedrohungsmodell.** Von allen Orten, an
   denen ein überholter Satz stehen kann, ist das der teuerste: Wer ihn liest, hält eine gebaute
   Sichtbarkeit für fehlend — und könnte sie „herstellen", indem er `http://` doppelt auszeichnet,
   oder sie für unwichtig halten und beim nächsten Aufräumen wegkürzen. **Beauftragt als O-KS.**
3. **Z-89 wird mit jedem neuen Träger teurer.** T-220 hat den vierten Baustein hinzugefügt; jeder
   weitere macht die spätere Trennung von Folge, Warnung und Absage um eine Stelle teurer. Ich
   ordne sie nicht an, aber die Zahl steht jetzt fest (neun) und ist damit nachrechenbar.
4. **Die längeren Beschriftungen fürs Auge** bleiben offen, wie domain-dev (Risiko 1) und T-177
   (Z-10, Auflage 2) es gemeldet haben: `.attachment__label` trägt `truncate`. Für den zugänglichen
   Namen ist der Befund zu, für das Auge beim Verweis nicht. Kein Bauauftrag aus dieser Freigabe.
5. **Keine echten Call-Nummern, keine Kundendaten, keine Zugangsdaten** in diesem Bericht. Alle
   Beispielwerte sind erfunden oder stammen aus vorhandenen Berichten und Prüffällen
   (`beispiel.example`, `rechnung.pdf`, `4711`, `Besprechung 10:30.pdf`).
6. **Unsichtbare Zeichen:** Dieser Bericht und die Berichtigungen in `T-221` führen ausschließlich
   gewöhnliche Leerzeichen, deutsche Anführungszeichen, Gedankenstriche und Auslassungszeichen.
   `proof:codepoints` gehört trotzdem über **beide** Dateien gelaufen, bevor die Welle geschlossen
   wird — ich habe ihn nicht gestartet.

---

## 8. Offene Fragen — alle vier sind beantwortet

Nichts steht mehr offen. Der Stand, damit dieser Abschnitt nicht als offen gelesen wird — das ist
die Lehre aus **O-KU**, und sie gilt für meinen eigenen Bericht genauso wie für das Board:

| Frage aus der ersten Fassung | Ausgang |
|---|---|
| Wer setzt die vier Berichtigungen aus 1.3 in `T-221-spec-ux-reviewer.md` ein? | **Ich, am 2026-09-06.** `.claude/team/reports/**` gehört jedem Agenten seine eigene Datei; `T-221` ist meine. Kein zweiter Agent, kein eigener Auftrag. Der Verlauf steht in **1.6** |
| Geht Z-86 als Gestaltauftrag an ui-designer? | **Ja — zusammen mit Z-89 als EINE Vorlage, O-KT**, samt der Rücknahme aus T-177 Z-11 |
| Z-85 in welche Welle? | **O-KQ an e2e-tester**, in einer Welle **ohne** portgebundene Läufe (E-083 Punkt 2). Der `toHaveCount(0)`-Nebenbefund geht als **O-KR** in denselben Auftrag |
| Läuft Z-87 mit dem nächsten Durchgang von security-checker mit? | **Ja, als O-KS** |

**Und der Verfahrensbefund selbst:** Z-88 ist erledigt, beide Boardzeilen sind gestrichen und
tragen ihren Ausgang; der Fehler steht als **O-KU** beim Orchestrator.

---

## 9. Nächster Schritt

1. **Erledigt:** Z-88 (Boardzeilen gestrichen, O-KU angelegt) und die vier Berichtigungen aus 1.3
   (eingesetzt, Verlauf in 1.6).
2. **Beauftragt und läuft nicht bei mir:** **O-KQ/O-KR** (e2e-tester, der Prüffall für den dritten
   Zustand mit der Zusicherung auf die **Wirkung**), **O-KS** (security-checker, T-156-8),
   **O-KT** (ui-designer, Z-86 und Z-89 als **eine** Vorlage — der dritte Zustand des Öffnen-Dialogs
   und die neun Träger von `.dialog__consequence` sind derselbe Gegenstand von zwei Seiten; sie
   einzeln zu entscheiden hieße, die Gestalt zweimal zu lesen).
3. **Offen bei mir, aber nicht in dieser Aufgabe:** **O-KZ** — was „kein Status" fachlich bedeutet,
   ein Zustand, den Takt kennt, oder das Fehlen einer Angabe. Kommt als eigener Auftrag, und zwar
   **bevor** ui-designers „Nichts gewählt" gebaut wird.
4. **Vor dem Schließen der Welle:** `proof:codepoints` über diesen Bericht **und** über
   `T-221-spec-ux-reviewer.md` (Risiko 6).
