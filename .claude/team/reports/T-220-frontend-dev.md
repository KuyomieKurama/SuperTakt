# T-220 — Neun Dialoge, eine Bauart, und die Eingabetaste kommt an

**Rolle:** frontend-dev **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`

```
Aufgabe: T-220 — E-093: alle neun Formulardialoge mit gesperrtem Absendeknopf von
         `disabled` auf `aria-disabled` umbauen; der Riegel zentral in `FormDialog.tsx`;
         P-8/P-9 einhalten; der freigegebene Satz aus T-211 Abschnitt 13.3 eingesetzt,
         und zwar in den Statuskanal statt in den Fehlerkanal (E-093 Punkt 5).
Status: fertig — mit einer offenen Textfrage, die ich nicht selbst entschieden habe
```

| Gegenstand | Ergebnis |
|---|---|
| `disabled` → `aria-disabled` am Absendeknopf | gebaut, **einmal**, in `FormDialog.tsx` |
| Der Riegel zählt den Versuch und bricht **danach** ab (E-093 Punkt 5, erster Anstrich) | gebaut **und gemessen** — beide Hälften, an vier Produktdialogen |
| Berührung der Felder beim Versuch | über einen **Zähler im Zusammenhang**, den `TextField` liest — **null** Änderungen je Dialog |
| `busy` | bleibt **hart** gesperrt, gemessen |
| Der Satz für „unverändert" | **eingesetzt, zeichengleich**, im **Statuskanal** ohne `aria-invalid` — gemessen |
| Der Hinweis als benannte Konstante (T-221 Z-74) | gebaut: `UNCHANGED_HINT` |
| Nachweise | typecheck 0, 77 Dateien / 1464 grün, Build grün, contrast 0/518, surface 20/0, foreign 20/0, codepoints 45/0 |
| Offen, nicht von mir entschieden | **der Satz steht jetzt zweimal gleichzeitig auf dem Bild** — Abschnitt 7.1 |

**Nicht gefahren** (E-083 Punkt 3): `pnpm run proof:all`, `pnpm test:e2e`.

---

## 1. Was gebaut ist

### 1.1 `apps/web/src/lib/submitAttempt.ts` (neu) — der Zähler statt der Rückrufe

Ein Zusammenhang mit einer Zahl und ein Lesehaken:

```ts
export const SubmitAttemptContext = createContext(0);
export function useSubmitAttempt(): number { … }
```

`FormDialog` legt ihn um seine Kinder, `TextField` liest ihn und ruft bei jeder Erhöhung
`onTouched?.()`. Das ist wörtlich der zweite Umsetzungssatz von **P-8** („Ein Absendeversuch setzt
`touched` weiterhin **immer**"), und er war bis heute unerreichbar: Der hart gesperrte Knopf ließ
das Ereignis nie entstehen.

**Warum ein Zähler und nicht acht `onBlockedSubmit`:** Das ist die Messung aus T-207, und ich habe
meinen eigenen Weg genommen. Der Zähler kostet an den neun Aufrufstellen **null** Zeilen; acht
Rückrufe hätten genau die Abhängigkeit von einer fernen Stelle wieder aufgebaut, die O-HY an
`touchedOnBlur` beseitigt hat.

**Warum eine Zahl und kein `boolean`:** Ein zweiter Versuch ohne Änderung dazwischen soll wieder
wirken. Ein Schalter, der schon `true` ist, ändert sich nicht mehr. **Gemessen** (Abschnitt 3.4).

**Der Rückruf steht in einer Referenz, nicht in der Abhängigkeitsliste.** `onTouched` ist an jeder
Aufrufstelle eine an Ort und Stelle geschriebene Pfeilfunktion und wechselt bei jedem Zeichnen ihre
Kennung; in der Liste liefe der Effekt bei jedem Zeichnen und meldete eine Berührung, die niemand
ausgelöst hat.

### 1.2 `FormDialog.tsx` — der Riegel, dreistufig

```ts
event.preventDefault();
if (busy) return;                     // hart, ohne jede Buchführung
setSubmitAttempt((count) => count + 1);
setQuiet(true);                       // gezählt und stillgestellt — auch der abgewiesene Versuch
if (submitDisabled) return;           // weich: die Handlung läuft nicht
onSubmit();
```

**Das ist E-093 Punkt 5, erster Anstrich, und er ist der Kern.** Stünde der Riegel weiter vor dem
Zählen, wäre der Knopf klickbar **und stumm** — und alle Prüffälle der Sorte „es wird nichts
geschickt" wären grün. Ich habe deshalb **beide** Hälften gemessen und nicht nur die ausbleibende
Handlung (Abschnitt 3).

Am Knopf: `ariaDisabled={submitDisabled}` statt `disabled={submitDisabled}`; `loading={busy}` bleibt
und trägt weiterhin das **harte** `disabled`. Dieselbe Aufteilung wie am Bestätigungsknopf des
`ConfirmDialog` seit T-186.

### 1.3 Der Weg zur Absage läuft jetzt in **zwei** Durchläufen

Der Grund ist eine Reihenfolge, die man beim Bauen übersieht: Beim abgewiesenen Versuch ist das
Pflichtfeld im Augenblick des Klicks noch **gar nicht ungültig**. Es wird es erst dadurch, dass
`TextField` den Zähler liest und `onTouched` ruft — und der Zustand dahinter liegt in der
**aufrufenden Ansicht**, deren Neuzeichnung einen Durchlauf später landet. Effekte der Kinder laufen
vor denen des Elternteils; ein einziger Durchlauf sucht also zu früh und findet nichts.

Deshalb: erster Durchlauf sofort; findet er nichts, vermerkt er die **Nummer** seines Versuchs, und
der zweite sieht denselben Rumpf noch einmal. Zwei und nicht mehr.

**Ein Fehler, den ich dabei selbst gefunden und behoben habe:** Der zweite Durchlauf hing zuerst
zusätzlich an einem abgeleiteten Wert (`refusalShown`). Der ändert sich beim **ersten getippten
Zeichen** — der Effekt wäre also mitten im Tippen gelaufen und hätte über
`revealFirstInvalidWithin` den Fokus wegnehmen können. Er hängt jetzt an **einer** Größe: der Nummer
des Durchlaufs.

### 1.4 Die Absage für den Versuch, den kein Feld beantwortet (E-093 Punkt 5, zweiter Anstrich)

Neue Eigenschaft `FormDialogProps.submitRefusal`. Sie geht **nicht** durch `TextField.error`:

| Am Feld, wäre es der Fehlerkanal | Wert |
|---|---|
| `aria-invalid` | `true` — die maschinell gelesene Aussage *dieser Wert ist ungültig* |
| Klassenname | `field__input--invalid` → `border-color: var(--danger-text)` |

Am unveränderten Namen ist nichts ungültig; er ist der **gespeicherte**. Die Absage liegt deshalb in
einer Statusfläche, gebaut **zeichengleich** zum Vorbild, das die Entscheidung benennt:

```jsx
<div className={cx("dialog__refusal", refusalShown && "dialog__refusal--shown")} role="status">
  {refusalShown ? (
    <p className="dialog__consequence">
      <Icon name="alert-triangle" size={14} />
      <span>{submitRefusal}</span>
    </p>
  ) : null}
</div>
```

Dieselbe Konstruktion steht im Bestand **zweimal**: `ConfirmDialog#refusal` (das von T-221 zitierte
Vorbild) und `UpdateDialog` — Zeichen für Zeichen dieselbe. Es ist keine neue Bauart, sondern die
dritte Anwendung einer vorhandenen.

`status` und nicht `alert`: Hier ist nichts falsch, die Handlung hat nur nichts zu tun. Die Fläche
steht **immer** im Baum, auch leer (T-162/O-GQ: eine Region, die erst mit ihrem Inhalt entsteht,
wird übergangen).

**Sie liegt zwischen Rumpf und Fußzeile, nicht im Rumpf** — und das ist keine Geschmacksfrage,
sondern zweimal gemessen:

1. **Die Sache.** Sie antwortet auf einen Druck auf den Absendeknopf und gehört neben diesen Knopf.
   Im Rumpf stünde sie am Ende eines Ausschnitts von 492 px, der im Pool-Dialog 1599 px Inhalt
   trägt — der Benutzer sähe sie nicht (Z-63, T-217).
2. **Ein stiller Schaden, den ich selbst eingebaut und wieder ausgebaut habe.**
   `.dialog__body--form` ist ein `flex`-Behälter mit `gap`. Eine dauerhaft im Baum stehende Fläche
   ist dort auch **leer** ein Element und kostete an **jedem** der sechzehn Formulardialoge 16 px.
   **Gemessen: `scrollHeight` 1599 → 1615 px, und nach der Verschiebung wieder 1599.**

### 1.5 `PoolRenameDialog.tsx` — der freigegebene Satz, und der Hinweis als Baustein

```ts
const UNCHANGED_HINT = "Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den Dialog.";
…
const submitRefusal = unchanged ? `Es gibt nichts zu speichern. ${UNCHANGED_HINT}` : undefined;
```

- **Der Wortlaut ist zeichengleich der freigegebene** (T-211 Abschnitt 13.3, freigegeben in T-221
  Z-71). Gemessen am Bildschirm, Abschnitt 3.3.
- **Der Hinweis ist jetzt eine benannte Konstante** und keine Zeichenkette in einer Ternärkette.
  Das ist T-221 **Z-74** und die Bedingung von AK 1 („bleibt **ein** Baustein"): Die Absage setzt
  ihren ersten Satz davor und schreibt ihn nicht ab.
- **Die Regelnummer ist nirgends zitiert.** T-221 Z-72 hat gemessen, dass `S-15` doppelt vergeben
  ist; ich nenne sie deshalb weder im Code noch in einem Kommentar.

### 1.6 `ControlsSection.tsx` (Musterseite) und `app.css`

- Der Musterblock „Formulardialog" bekommt einen Satz zur neuen Bauart (weich gegen hart) und einen
  berichtigten Kommentar: Aus „blocked" heraus läuft `onSubmit` seit T-220 **nicht** mehr; der
  Riegel fängt die Handlung ab und führt statt dessen zum beanstandeten Feld zurück.
- `app.css` bekommt `.dialog__refusal` (bündig zum Rumpf) und `.dialog__refusal--shown` (Abstand
  nach unten). **Kein neuer Farbwert** — daher keine neue Kontrastpaarung.
  Der Abstand hängt an einem **Zustandsnamen** und nicht an `:empty` oder `:has()`: Beide
  beantworteten dieselbe Frage über eine Zeichnungsregel der Engine, und zwei von drei
  ausgelieferten Erzeugnissen zeichnen mit WebKit, für das hier nichts gemessen ist.

---

## 2. E-076 Punkt 3 — wo ein `disabled` fällt, ändert sich ein Zustand. Was ich gesucht und gefunden habe

Gesucht nach **E-087**: über den **Wortlaut**, und über **beides** — versionierte Dateien
(`git grep`) **und** Quellverzeichnisse (Lauf über `apps/*/src`, `apps/*/test`, `apps/*/scripts`,
`packages/*/…`, `tests`, ohne `node_modules` und `dist`).

| Suche | `git grep` | Quellverzeichnisse | Deckungsgleich? |
|---|---|---|---|
| `toBeDisabled` | 3 Treffer in 2 Dateien | dieselben 2 Dateien | ja |
| `submitDisabled` | 8 Dateien | dieselben 8 | ja |
| `dialog__consequence` | 6 Dateien | dieselben 6 | ja |

**Gefunden: keine einzige Zusicherung auf den Sperrzustand eines Formulardialog-Absendeknopfes.**
Die drei `toBeDisabled()` gelten zweimal dem **Exportknopf**
(`export-audit-and-locks.spec.ts`) und einmal einem **Gruppenhäkchen**
(`export-mixed-status-and-billing.spec.ts`). Das bestätigt T-207 und T-212 ein drittes Mal, jetzt
mit der doppelten Suche.

**In `apps/web/test` steht null** zu `disabled`. Der einzige Prüffall, der `FormDialog.tsx` als
Syntaxbaum liest (`touchedCallSiteNeutrality.test.ts`), prüft ausschließlich `handleBlur` und
`setEdited` — beide **unverändert**. Er ist grün und bleibt zu Recht grün.

**Der Sperrzustand der Musterseite ist zeichengleich geblieben** (E-076 Punkt 3, gemessen,
Abschnitt 3.5): Rolle `button`, zugänglicher Name `Anlegen`, Klassenname
`btn btn--primary btn--md on-solid`. Gewechselt hat allein das Attribut.

**Was dadurch heute ungemessen ist und morgen wieder herausfallen kann:** Genau der Riegel, der
jetzt die einzige Sicherung ist. Das ist Auflage **Z-64.1**, sie gehört unit-tester/e2e-tester, und
sie steht in Abschnitt 6 als konkreter Vorschlag.

---

## 3. Gemessen im Browser — beide Hälften, nicht eine

**Aufbau** (wörtlich von visual-qa, T-217, damit dieselbe Naht dieselben Zahlen liefert):
`apps/local-api` aus dem Quelltext über `tests/e2e/support/version-check-entry.ts` mit eigener
GitHub-Attrappe und eigenem `XDG_DATA_HOME`, `apps/web` über `vite --host 127.0.0.1 --port 5173
--strictPort`, Chromium 1280×820. Vor jedem Lauf `ss -ltn` geprüft, nach jedem Lauf beide Dienste
beendet. Skripte und Bilder unter `/tmp/t220-fe/`, Bilder zusätzlich unter
`.claude/team/reports/T-220-screens/`. **Keine Datei außerhalb meiner Hoheit angefaßt.**

**Zwei Grenzen, wie immer:** kein Vorleseprogramm (T-B09) — was unten steht, ist eine DOM-Messung —,
und **nur Chromium**, also nicht WebKitGTK (Linux) und nicht WKWebView (macOS).

### 3.1 Der Knopf selbst — „Neuen Tag anlegen", frisch geöffnet

```
disabled-Attribut:        null            (vorher: vorhanden)
aria-disabled:            "true"
Klassenname:              btn btn--primary btn--md on-solid   (unverändert)
Aussehen:                 background rgb(239,242,246) = --bg-disabled,
                          color rgb(126,138,158) = --text-disabled, cursor: not-allowed
Mit dem Tabulator:        nach 2 Schritten erreicht   (vorher: gar nicht)
```

### 3.2 Enter im frisch geöffneten Dialog — **(a) Rückmeldung** und **(b) keine Handlung**

```
(a) role=alert VOR  Enter:   [""]
(a) role=alert NACH Enter:   ["Name fehlt."]
(a) Fokus nach Enter:        INPUT, aria-invalid="true",
                             aria-describedby -> die Meldung, Beschriftung „Name * (Pflichtfeld)"
(a) sichtbarer Text:         verändert

(b) Netzaufrufe an 127.0.0.1:17843:  []   (keiner)
(b) Dialog:                          unverändert offen
(b) Toast:                           0
```

**Das ist die Umkehrung von T-217, Zeile für Zeile.** Dort: kein Netzaufruf, `role="alert"` leer,
bitgleiches Bild. Hier: kein Netzaufruf — **und** eine Meldung, ein Fokuswechsel, ein verändertes
Bild. Bild: `02-tag-nach-enter.png`.

**Klick auf den weich gesperrten Knopf** (`{ force: true }`, weil Playwright `aria-disabled="true"`
für unbedienbar hält): dasselbe Ergebnis — `["Name fehlt."]`, Netzaufrufe `[]`, Dialog offen.

**Gegenprobe, gefülltes Feld, dieselbe Taste:** `POST /api/v1/tags` und sieben Folgeabrufe, Dialog
geschlossen. Die Sperre ist die alleinige Ursache, nicht ein zweiter Faktor.

### 3.3 Der gescrollte Fall — `PoolFormDialog` (das, was Z-63 verlangt hat)

```
Rumpf:                    scrollHeight 1599 px gegen clientHeight 492 px   (= T-217s Zahl)
Absendeknopf per Tab:     nach 13 Schritten erreicht
scrollTop vor Enter:      814      (das Namensfeld steht weit oberhalb des Bildes)
scrollTop nach Enter:     0
Fokus nach Enter:         INPUT, aria-invalid="true", „Name * (Pflichtfeld)"
role=alert nach Enter:    ["Name fehlt."]
Netzaufrufe:              []
```

Das ist genau der Fall, für den `revealFirstInvalidWithin` gebaut wurde und den ein dauerhafter
Hinweis unter dem Feld **nicht** erreicht hätte — Z-63, jetzt gemessen statt argumentiert.

### 3.4 Zweiter Versuch ohne Änderung dazwischen

```
scrollTop vor dem zweiten Klick:  1131
scrollTop danach:                 0
Fokus:                            INPUT, aria-invalid="true"
```

Der Zähler trägt; ein Schalter hätte hier nichts mehr getan.

### 3.5 Die weiteren Produktdialoge — vier von acht am Bildschirm

| Dialog | `disabled` | `aria-disabled` | Meldung nach dem Versuch | Netzaufrufe |
|---|---|---|---|---|
| `TagsScreen` „Neuen Tag anlegen" | `null` | `true` | `["Name fehlt."]` | `[]` |
| `StatusSettings` „Neuen Status anlegen" | `null` | `true` | `["Name fehlt."]` | `[]` |
| `TemplatesScreen` „Vorlage kopieren" | `null` | `true` | `["Name der Kopie fehlt."]` | `[]` |
| `PoolFormDialog` „Neuen Pool anlegen" | `null` | `true` | `["Name fehlt."]` | `[]` |
| `PoolRenameDialog` „… umbenennen" | `null` | `true` | **Statusfläche**, siehe 3.6 | `[]` |
| Musterseite „Pflichtfeld leer" | `null` | `true` | `["Ein Titel ist Pflicht. …"]` | — |
| Musterseite „Wird gespeichert" | **vorhanden** | `null` (`aria-busy="true"`) | — | — |

In jedem Fall stand der Fokus danach auf dem beanstandeten Feld, und in jedem Fall blieb der Dialog
offen. **Die letzte Zeile ist die Zusicherung „`busy` bleibt hart gesperrt":** dort steht das
`disabled`-Attribut, kein `aria-disabled`, und der Knopf ist nicht klickbar.

Nicht einzeln am Bildschirm erreicht: die beiden übrigen `TagsScreen`-Dialoge („Neuen Ordner
anlegen", „Umbenennen") und `Attachments`. Sie laufen durch **denselben** Riegel und dieselbe
Bauart; ihre `onTouched`/`error`-Verdrahtung habe ich am Quelltext geprüft (alle drei führen sie).
Das sage ich als Ableitung, nicht als Messung — und es ist genau die Lücke, die visual-qa schließen
soll (Abschnitt 6).

### 3.6 Der freigegebene Satz, am Bildschirm

```
VOR dem Versuch:    Statusfläche leer ("")
                    aria-invalid am Feld: null
NACH dem Versuch:   "Es gibt nichts zu speichern. Der Name ist unverändert.
                     Ändern Sie ihn — oder schließen Sie den Dialog."
                    aria-invalid am Feld: null      <- die Zusage aus E-093 Punkt 5
                    Klassenname am Feld: "field__input"   (nicht --invalid)
                    Netzaufrufe: []
NACH einer Änderung: Statusfläche wieder leer, Knopf nicht mehr aria-disabled
```

Wortlaut **zeichengleich** zu T-211 Abschnitt 13.3. Bild: `11-poolrename-absage.png` — die Fläche
steht unmittelbar über den Knöpfen, waagerecht bündig zu den Feldern, das Eingabefeld ist **nicht**
rot umrandet und trägt keinen Fehlertext.

---

## 4. Alle neun, und wie jeder von ihnen jetzt antwortet

| # | Datei / Dialog | Sperrgrund | Antwort auf den Versuch |
|---|---|---|---|
| 1 | `TagsScreen` „Neuen Tag anlegen" | Name leer | „Name fehlt." am Feld, Fokus dorthin — **gemessen** |
| 2 | `TagsScreen` „Neuen Ordner anlegen" | Name leer | dieselbe Verdrahtung (`nameError`), abgeleitet |
| 3 | `TagsScreen` „Umbenennen" | Name leer | dieselbe Verdrahtung, abgeleitet |
| 4 | `TemplatesScreen` „Vorlage kopieren" | Name leer | „Name der Kopie fehlt." — **gemessen** |
| 5 | `StatusSettings` anlegen/umbenennen | leer **oder** doppelt | „Name fehlt." bzw. die Doppelmeldung — **gemessen** |
| 6 | `PoolFormDialog` anlegen/ändern | Name leer | „Name fehlt." + Rückführung über 814 px — **gemessen** |
| 7 | `Attachments` „Anhang hinzufügen" | Wert leer | `valueError` je Zweig, abgeleitet |
| 8 | `PoolRenameDialog` | leer / **unverändert** / vergeben | vergeben → Feldmeldung; **unverändert → die Absage** (gemessen); **leer → siehe 7.2** |
| 9 | `showcase/ControlsSection` | Musterfall | Feldmeldung — **gemessen**, Name und Klasse zeichengleich |

---

## 5. Nachweis

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** |
| `pnpm test` | **77 Dateien, 1464 grün** |
| `pnpm --filter @takt/web build` | grün |
| `pnpm run contrast` | **0 von 518**, 259 Paare, **11/11** Gegenproben |
| `pnpm run proof:surface` | **20 / 0** (12 Gegenproben, 117 Quelldateien, **30** benannte Live-Regionen — vorher 28, die zwei neuen sind `dialog__refusal` und `dialog__refusal--shown`) |
| `pnpm run proof:foreign` | **20 / 0** |
| `pnpm run proof:codepoints` | **45 / 0** |
| Browser | Chromium, echte Anwendung gegen den echten Dienst, zwei Skripte, elf Bilder |

Geänderte Dateien — **fünf**, alle in meiner Hoheit:

- `apps/web/src/lib/submitAttempt.ts` (neu)
- `apps/web/src/components/FormDialog.tsx`
- `apps/web/src/screens/PoolRenameDialog.tsx`
- `apps/web/src/showcase/ControlsSection.tsx`
- `apps/web/src/styles/app.css`

---

## 6. Was visual-qa messen soll

Die Zahlen von vorher liegen in `/tmp/t217-qa/`, meine in `/tmp/t220-fe/` und
`.claude/team/reports/T-220-screens/`.

1. **Die vier Dialoge, die ich nur abgeleitet habe** (Abschnitt 3.5): `TagsScreen` „Neuen Ordner
   anlegen" und „Umbenennen", `Attachments` „Anhang hinzufügen" in **allen drei** Zweigen
   (Verweis / Bild / Datei — der Zweigwechsel setzt `touched` zurück, das ist der interessante
   Fall). Je Dialog **beide** Hälften: die Meldung erscheint **und** es geht nichts an den Dienst.
2. **Die Absage im `PoolRenameDialog` mit einem Vorleseprogramm**, wenn irgend möglich. Meine
   Aussage ist eine DOM-Messung: `role="status"`, kein `aria-invalid`. Was ein Hörender hört, ist
   daraus abgeleitet — und der ganze Punkt von E-093 Punkt 5 ist, was die Vorlesehilfe **sagt**.
3. **Die Doppelung aus Abschnitt 7.1** — ob sie am Bild so stört, wie ich sie lese. Ein zweites Auge
   darauf ist mehr wert als mein Urteil.
4. **Der Tabulatorlauf durch einen gesperrten Dialog**, mit sichtbarem Fokus auf dem weich
   gesperrten Knopf (SC 2.4.7): Der Fokusring kommt aus `:focus-visible` und wird von
   `components.css` bewusst nicht zurückgenommen — gemessen ist er von mir **nicht**.
5. **Die 16-px-Frage gegenprüfen** (Abschnitt 1.4): `.dialog__body--form` `scrollHeight` im
   Pool-Dialog. Erwartet **1599**, nicht 1615.

Und an unit-tester/e2e-tester, als Auflage **Z-64.1**: Der Riegel ist ab heute die **einzige**
Sicherung, und kein Lauf sieht ihn. Ein Fall am Formulardialog, **beide** Hälften wie bei O-GZ —
der gesperrte Versuch führt zurück **und** die Handlung läuft nicht. Der Klick braucht
`{ force: true }`; die Falle ist in `export-audit-and-locks.spec.ts` schon ausgeschrieben.

---

## 7. Offene Punkte

### 7.1 **Der freigegebene Satz steht jetzt zweimal gleichzeitig auf dem Bild** — die eine Frage, die ich nicht selbst entschieden habe

Gemessen, Bild `11-poolrename-absage.png`: Unter dem Feld steht der Hinweis *„Der Name ist
unverändert. Ändern Sie ihn — oder schließen Sie den Dialog."*, und darunter, über den Knöpfen, die
Absage *„**Es gibt nichts zu speichern.** Der Name ist unverändert. Ändern Sie ihn — oder schließen
Sie den Dialog."* Zwei Sätze, von denen der zweite den ersten vollständig enthält.

**Das entsteht genau durch den Kanalwechsel aus E-093 Punkt 5, und niemand hat es entschieden.**
T-211s AK 5 wollte die Absage in die **Meldefläche des Feldes** — und dort verdrängt sie den Hinweis
von selbst (`fieldHint` ist `undefined`, sobald `fieldError` steht). Im **Statuskanal** steht der
Hinweis weiter. T-221 Z-73 sagt zu diesem Ausgang selbst: *„Dann trägt AK 4 **nicht** mehr"* — die
Akzeptanzkriterien von 13.5 sind für diesen Kanal also ohnehin nachzuziehen, und dies ist der
zweite Punkt, der dabei anfällt.

**Ich habe es nicht selbst behoben**, obwohl die Behebung eine Zeile wäre (`fieldHint` unterdrücken,
solange die Absage steht). Grund: Was der Benutzer liest, ist eine Textentscheidung (E-078 Punkt 4),
und E-078 Punkt 1 — *„Gestrichen wird, was **doppelt** dasteht"* — gibt zwei zulässige Antworten,
nicht eine: den Hinweis unterdrücken, **oder** die Absage kürzen. Beide ändern, was dasteht.

**Vorschlag zur Entscheidung durch ux-designer/spec-ux-reviewer:** den Hinweis unterdrücken, solange
die Absage steht. Er ist dann nicht weg, sondern **in** ihr — das ist genau die Bewegung, die
T-211 mit *„Die Absage setzt ihren ersten Satz davor"* beschreibt, und sie ist dieselbe, die
`ConfirmDialog` seit T-118 macht (*„die Absage tritt an die Stelle der Vorwarnung"*, S-12). Es ist
eine Zeile in `PoolRenameDialog.tsx`, sobald jemand sie entscheidet.

### 7.2 `PoolRenameDialog`, Sperrgrund **leer**: weiterhin ohne Antwort auf den Druck

Wer den Namen löscht und drückt, bekommt keine neue Auskunft. Der Hinweis *„Ohne Namen geht es
nicht: …"* steht zwar von der ersten Sekunde an da (P-9 zweite Hälfte, zustandsgebunden), aber der
**Druck** bleibt unbeantwortet — dieselbe Lücke, die 13.3 für „unverändert" geschlossen hat.

Zwei Wege, und beide sind Text und damit nicht meine Entscheidung: entweder `error: "Name fehlt."`
wie an den sechs anderen Stellen (dann verdrängt es den ausführlicheren Hinweis), oder eine zweite
Anwendung der Absage-Regel — aber *„Es gibt nichts zu speichern"* ist für einen leeren Namen
**falsch**: Es gäbe etwas zu speichern, es ist nur ungültig. Ich habe deshalb nichts gebaut.

### 7.3 T-221 sagt über das zitierte Vorbild „keine Gefahrenfarbe" — gemessen trifft das nicht zu

Z-73 beschreibt `ConfirmDialog#refusal` als *„`role="status"`, `.dialog__consequence`, kein
`aria-invalid`, **keine Gefahrenfarbe**"*. Die ersten drei stimmen; das vierte nicht. Gemessen am
gezeichneten Baum:

```
.dialog__consequence  color: rgb(172,42,34) = --danger-text
                      background: rgb(253,240,239) = --danger-bg-subtle
                      border-inline-start: --danger-text
```

**Ich bin dem Vorbild gefolgt und nicht dem Nebensatz** — E-093 Punkt 5 nennt als Zusage
ausdrücklich nur `aria-invalid`, und eine zweite Gestalt für dieselbe Meldungsklasse zu erfinden
wäre genau die zweite Bauart, gegen die dieser ganze Auftrag geschrieben ist. Die Fläche sieht damit
heute aus wie eine Absage des Dienstes.

**Wenn das nicht gewollt ist**, ist es eine Farbentscheidung für ui-designer — mit einer
Kontrastpaarung in `contrast-check.mjs` als Bedingung im selben Auftrag, und dann für **alle drei**
Träger von `.dialog__consequence`, nicht für einen.

### 7.4 Die Musterseite zeigt die Absagefläche nicht

`showcase/ControlsSection.tsx` führt vier Zustände des Formulardialogs; ein fünfter („Absage ohne
Feld") würde die neue Fläche vorführen. Ich habe ihn **nicht** gebaut, weil er einen Vorführtext
braucht und Vorführtexte auf der Musterseite mit dem Produkt mitwandern müssen. Das ist ein
Vorschlag, keine Lücke im Auftrag.

### 7.5 Nicht in dieser Aufgabe: T-219 Abschnitt 14.3/14.5

Der zweite freigegebene Wortlaut (*„Leistung: länger, als der Dienst annimmt."*) gehört zum
**Musterblock** in `showcase/NotesSection.tsx` und bringt eine eigene AK-Liste mit (gefüllter Wert,
kein `maxLength`, neuer Zustandsname statt `emptyBilling`, dazu Z-79s zwei Auflagen). Das ist ein
eigenes Bündel und nicht T-220; ich habe es nicht angefaßt, um nicht die Hälfte einer fremden
AK-Liste zu bauen. **Die Datei liegt in meiner Hoheit — ein Wort genügt, und es ist die nächste
Aufgabe.**

---

## 8. Annahmen

1. **Der Kanal ist entschieden, die Akzeptanzkriterien dazu nicht.** Ich habe E-093 Punkt 5 und die
   Nachricht des Orchestrators als Entscheidung für Z-73s zweiten Ausgang gelesen (Statusfläche
   ohne `aria-invalid`) und bin dem im Bestand vorhandenen Vorbild **zeichengleich** gefolgt.
2. **Der Fokus bleibt bei der Absage, wo er ist.** Z-73 sagt für diesen Ausgang, der Fokus müsse
   „von der Aufrufstelle gesetzt werden". Ich habe ihn **nicht** gesetzt: Die Fläche steht außerhalb
   des scrollenden Ausschnitts, unmittelbar über dem gedrückten Knopf, und ein `role="status"` sagt
   sich selbst an. Ihm den Fokus hinterherzuschicken nähme dem Benutzer die Stelle, an der er
   gerade steht, ohne ihm eine bessere zu geben. **Das ist eine Entscheidung von mir; wer sie
   anders will, bekommt sie in einer Zeile.**
3. **Die Regelnummer aus 13.3 zitiere ich nirgends** (Z-72, `S-15` ist doppelt vergeben).
4. **Der zweite Durchlauf der Rückführung ist meine Bauart**, nicht die einer Vorgabe. Die
   Alternative — die Felder aus dem Ereignisbehandler heraus über eine Anmeldeliste berühren — käme
   ohne zweiten Durchlauf aus, brächte aber eine Anmeldung/Abmeldung je Feld. Ich habe den Zähler
   genommen, weil der Auftrag ihn nennt und weil er weniger Bewegliches hat.

## 9. Risiken

1. **Der Riegel ist ab heute die einzige Sicherung, und kein Lauf sieht ihn.** Bis heute war
   `disabled` eine **bauliche** Sperre; jetzt ist es eine Zeile in `submit`. Wer sie umstellt —
   etwa beim gemeinsamen Meldungswirt, Bündel 0, der dieselbe Datei anfaßt —, macht acht Dialoge
   still, und **alle** heutigen Prüffälle blieben grün. Das ist Z-64.1 und der dringlichste
   Folgeauftrag.
2. **Playwright hält `aria-disabled="true"` für unbedienbar.** Jeder künftige Klick auf einen
   Absendeknopf eines gesperrten Formulardialogs braucht `{ force: true }`. Bekannt seit T-186, jetzt
   an acht weiteren Stellen wirksam.
3. **Der Tabulatorlauf jedes gesperrten Dialogs hat einen Halt mehr.** Das ist der Gewinn und
   zugleich eine Änderung an jeder Messung, die Tabulatorschritte zählt. In `tests/e2e` zählt heute
   nur `field-live-region-announcement.spec.ts` Schritte, und zwar an `TodoFormDialog` — der führt
   **kein** `submitDisabled`, ist also nicht betroffen. Gemessen, nicht angenommen.
4. **Alles unten ist Chromium.** Zwei von drei ausgelieferten Erzeugnissen zeichnen mit WebKit. Für
   die neue Fläche betrifft das die Geometrie, nicht die Farben und nicht die Rollen.
5. **Die Doppelung aus 7.1 steht heute im Produkt.** Sie ist keine Fehlfunktion und sagt nichts
   Falsches — aber sie ist sichtbar, und sie ist der Preis dafür, daß ich Text nicht selbst
   entscheide.

## 10. Offene Fragen

1. **An ux-designer und spec-ux-reviewer (7.1):** Wird der Hinweis unterdrückt, solange die Absage
   steht — oder bleibt die Doppelung? Eine Zeile, aber es ist Text.
2. **An ux-designer (7.2):** Bekommt der Sperrgrund **leer** im `PoolRenameDialog` eine Antwort auf
   den Druck, und welchen Satz? „Es gibt nichts zu speichern." ist dort falsch.
3. **An spec-ux-reviewer (7.3):** Die Beschreibung des Vorbilds als „ohne Gefahrenfarbe" hält der
   Messung nicht stand. Soll die Absage weiterhin wie `ConfirmDialog#refusal` aussehen — oder ist
   das eine eigene Aufgabe an ui-designer, dann für **alle drei** Träger?
4. **An den Orchestrator (7.5):** Gehört T-219 Abschnitt 14.3/14.5 (`showcase/NotesSection.tsx`) in
   die nächste Welle zu mir? Der Wortlaut ist freigegeben, die Datei ist meine, die AK-Liste liegt
   vor.
5. **An den Orchestrator (7.4):** Soll die Musterseite einen fünften Zustand für die Absagefläche
   bekommen? Dann braucht sie einen Vorführtext von ux-designer.

## 11. Nächster Schritt

1. **Z-64.1 beauftragen** — der Prüffall auf den Riegel, beide Hälften. Ohne ihn ist der Umbau
   eine Zeile, die niemand bewacht. Er ist der wichtigste Folgeauftrag dieser Aufgabe.
2. **visual-qa** mit der Liste aus Abschnitt 6, insbesondere den vier nicht einzeln gemessenen
   Dialogen und der Absage mit einem Vorleseprogramm.
3. **7.1 entscheiden** — ux-designer/spec-ux-reviewer. Bis dahin steht der Satz zweimal.
4. **Bündel 0 (O-IQ) kann jetzt laufen.** `FormDialog.tsx` ist frei; wer sie anfaßt, muß den Riegel
   aus Abschnitt 1.2 **und** die Absagefläche aus 1.4 kennen — beide sind im Dateikopf begründet.
