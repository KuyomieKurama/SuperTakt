# T-334 — Nacharbeit an den fensterfesten Ansichten

**Rolle:** frontend-dev. **Stand:** 2026-09-13. **Zweig:** `feature/outlook-anhaenge-und-versionspruefung`,
Spitze `311b26e` plus Arbeitskopie (T-326 liegt dort unversioniert).
**Vorlagen:** `.claude/team/reports/T-331-code-reviewer.md`, `T-329-visual-qa.md`, `T-332-security-checker.md`.

**Status:** fertig — vier Punkte behoben, jeder mit Vorher/Nachher gemessen. Vier Fragen an den
Orchestrator, drei davon Gestaltungsentscheidungen, die ich getroffen habe und die ui-designer
bestätigen oder zurücknehmen muß.

---

## 0 Aufbau der Messung

Eigenes Wegwerfverzeichnis `t334-frontend/` im Kratzbereich (die Auflage aus T-331: Meßhilfen mit
der Aufgabennummer, nicht flach). Attrappe des Dienstes aus T-326 übernommen und um zwei Anhänge
erweitert (eine Datei, ein Verweis — sonst gibt es die Rückfrage aus A-19 nicht zu sehen),
**eigener Token**, eigene Ports:

- Attrappe `127.0.0.1:18912`, Entwicklungsserver `127.0.0.1:5312`.
- **`17843`, `17844` und `5173` habe ich nicht gebunden.** Vor dem Lauf mit `ss -ltn` geprüft: auf
  `5173` lief zu Beginn ein fremder `vite` (T-330), auf `17843/17844` nichts. Beide eigenen Ports
  sind am Ende beendet, nachgeprüft mit `ss -ltn`; `5173` ist unberührt geblieben.
  **Eine Ausnahme, die ich melde:** `pnpm verify:bundle` startet selbst einen Dienst auf
  `17844` — das habe ich erst an seiner Ausgabe gesehen. Die Ports waren vorher und nachher frei,
  der Lauf ist grün (20/0), aber er gehört zu den portgebundenen und hätte gefragt werden müssen.
- Chromium über `playwright-core`, 1440 × 900, 1280 × 820, 1024 × 640, 960 × 640, dazu
  1000 × 700 / 900 × 700 / 700 × 700 für die Zeiterfassung und elf Breiten für den Kanban-Kopf.
  Jede Messung sichert `getComputedStyle(.app).display === "grid"` ab.
- Keine Datei unter `tests/**` angefaßt.

---

## 1 Hoch — die Karten schrumpfen, statt daß der Laufbereich läuft

### Behebung

`apps/web/src/styles/viewport-layout.css`, neue Sammelregel neben `.screen > *`:

```css
.screen > .screen__body:not(.screen__body--frame) > *,
.runarea > *,
.screen__body--frame .kcolumn__body > * {
  flex: none;
}
```

`.kcolumn__body > *` ist über den Vorschlag hinaus dazugekommen: Die Kanban-Spalte ist derselbe
Kasten mit demselben Vertrag, heute nur ohne schrumpfendes Kind. Gemessen kostet sie nichts — die
Kartenhöhen sind vorher und nachher identisch (`h=135 sH=133 cH=133`).

### Gemessen, 1280 × 820, `Höhe / scrollHeight / clientHeight`

| Fall | vorher | nachher |
|---|---|---|
| Dashboard, Karte „Timer" | **2 / 168 / 0** — unsichtbar | 170 / 168 / 168 |
| Export, „Vorlage und Rundung" (mit `Base64Notice`) | **67 / 350 / 65** — 285 px weg | 352 / 350 / 350 |
| Export, Karte des Laufergebnisses | **84 / 437 / 82** — 355 px weg | 439 / 437 / 437 |
| Export, `.table-wrap` der Gruppenliste | **237 / 1267 / 237** — zweiter Laufbereich in einem | 1267 / 1267 / 1267 |
| Exportprotokoll, Legendenkarte | **2 / 178 / 0** — unsichtbar | 180 / 178 / 178 |
| Einstellungen „Daten", drei Karten | 149/174/147, 149/174/147, **341/400/339** | 176/174/174, 176/174/174, 402/400/400 |

Und die Gegenprobe, ob der Bereich danach wirklich läuft (`Laufbereich scrollHeight/clientHeight`):

| Ansicht | vorher | nachher |
|---|---|---|
| Dashboard | 983 / 692 | 1150 / 692 |
| Export | **613 / 613 — nichts lief** | 2283 / 613 |
| Exportprotokoll | 3395 / 461 | 3572 / 461 |
| Einstellungen „Daten" (`.runarea.settings-panel`) | 685 / 671 (115 px abgeschnitten) | **786 / 671** |

Die 115 px sind die Summe der drei Schnitte (27 + 27 + 61). Das Bild dazu: `shots/vorher-__.png`
gegen `shots/nachher2-__.png` — auf dem Dashboard ist von der Karte „Timer" vorher ein 2 px
breiter Strich unter dem Kopf, nachher steht sie mit Anzeige und „Starten" da.

**Der Export-`.table-wrap` ist der einzige Fall, in dem sich die Bedienung ändert und nicht nur
das Bild:** Er lief bisher als zweite senkrechte Fläche **innerhalb** des Laufbereichs — genau das,
was AK-03 verbietet und was T-322 4.7 der Export-Ansicht nicht zuspricht („Ein Laufbereich. Name:
Export"). Mit `flex: none` nimmt er seine Inhaltshöhe an, und der eine Laufbereich trägt ihn.
Das ist zugleich der Zustand vor T-326.

### Die Einzelbehebung bleibt nötig

`.time-layout__main > .card` / `.time-layout__side > .card` ist **nicht** überflüssig geworden:
Diese Karten sind Kinder von `.time-layout__main`, also eine Ebene unter dem Rahmen und in keinem
`.screen__body` und keiner `.runarea`. Die Sammelregel greift dort nicht. Der Grund steht jetzt im
Kommentar daneben.

### Der Meßsatz, der die Klasse künftig fängt — Vorschrift für den e2e-tester

Der Vorschlag des code-reviewers trägt, aber er braucht **drei** Einschränkungen, sonst ist er
falschrot. Gemessen habe ich ihn in `t334-frontend/pruefen.mjs`; hier die Vorschrift:

1. **Die Menge der Laufbereiche** ist `.screen__body:not(.screen__body--frame)`, `.runarea`,
   `.kcolumn__body` — und unterhalb von 68 rem zusätzlich `.screen__body--split`, das dort selbst
   zum Laufbereich wird.
2. **`.screen__body--frame` gehört nicht dazu.** Ein Rahmen läuft im getragenen Bereich nicht, und
   im Rückfall (T-322 R-3) **soll** sein Kind höher sein als er. Gemessen bei 1024 × 640:
   `div.settings-layout` ragt 86 px über den Rahmen hinaus, und das ist richtig — der Rahmen
   läuft. Ein Meßsatz ohne diese Ausnahme wäre dort rot und würde binnen einer Welle gelockert.
3. **Nur Kinder im Fluß.** `getComputedStyle(kind).position` darf nicht `fixed` oder `absolute`
   sein; `.scrim` und `span.visually-hidden` sind keine Flex-Elemente.

Die Zusicherung je Kind lautet dann `kind.scrollHeight <= kind.clientHeight + 1` (ein Pixel
Rundung). Dazu zwei Untergrenzen in der Bauart von E-094 Punkt 3, sonst mißt der Satz nichts:
**mindestens ein Laufbereich je Ansicht** muß gefunden werden, und **mindestens einer** muß
tatsächlich laufen (`scrollHeight > clientHeight`).

**Die Messung, die heute rot wäre** — dieselbe Vorschrift gegen den Stand vor dieser Nacharbeit,
1280 × 820:

```
Dashboard      section.card               168 px über clientHeight
Export         section.card               285 px    (darin der Base64-Satz)
Export         div.table-wrap           1 030 px
Export         section.card               355 px
Exportprotokoll section.card              178 px
Einstellungen  section.card × 2            27 px
Einstellungen  section.card                61 px
```

Nach der Behebung ist die Menge über alle elf Ansichten und vier Fenstergrößen **leer** (44 von 44
Fällen), mit der einen benannten Ausnahme aus Punkt 2.

Als Gegenprobe schlage ich vor: `flex-shrink: 1` an `.screen__body > .card` eingesetzt muß den
Satz rot machen — das ist der Zustand, den T-326 hatte.

---

## 2 Mittel — Rinnenversatz, `PANEL_LABEL`, `base.css:41`

### 2.1 Die 10 px zwischen festem Kopf und Inhalt

Zwei Zeilen, nicht eine:

- `.screen__header, .screen__bar { overflow: hidden; scrollbar-gutter: stable }` —
  `scrollbar-gutter` wirkt nur an einem Bildlaufkasten. `overflow` auf **beiden** Achsen, weil
  `overflow-y: hidden` die andere auf `auto` rechnet und eine eigene Leiste im festen Teil genau
  das ist, was AK-04 verbietet.
- `.screen__body--frame { scrollbar-gutter: stable }` statt `auto`. **Sonst hätte ich den Versatz
  nur verschoben:** Nach der ersten Hälfte endete der Kopf der drei Rahmenansichten bei 1246 und
  ihr Inhalt weiter bei 1256.

Rechte Inhaltskante bei 1280 × 820, `Kopf / Laufbereich`:

| Ansicht | vor T-326 | nach T-326 | jetzt |
|---|---|---|---|
| Todos, Buchungen, Dashboard | 1246 / 1246 | **1256 / 1246** | 1246 / 1246 |
| Einstellungen (Rahmen) | 1246 / 1246 | 1256 / **1256** | 1246 / 1246 |

Über **alle 44** gemessenen Fälle (elf Ansichten × vier Fenstergrößen) ist die Differenz jetzt
`0`. Das ist zugleich die Kante von vor T-326: Damals reservierte `.app__main` die Rinne für alle
elf.

**Daß `overflow: hidden` nichts abschneidet, ist im Bild gemessen und nicht aus der
Kastenrechnung geschlossen.** Derselbe Kopf zweimal aufgenommen, einmal mit der Zeile und einmal
ohne sie bei **gleicher Inhaltsbreite** (die Rinne durch Innenabstand ersetzt, damit der
Textumbruch zeichengleich bleibt), dann Bildpunkt gegen Bildpunkt:

| Kopf | Größe | verschiedene Bildpunkte | größter Unterschied |
|---|---|---|---|
| Zeiterfassung, Einstellungen | 1040 × 29 | **0** | 0 |
| Todo-Detail | 1040 × 83 | 17 | 2 von 255 |
| Buchungen | 1040 × 255 | 23 | 2 von 255 |
| Kanban | 1040 × 159 | 32 | 2 von 255 |

Kantenglättung in der obersten Zeile, kein Buchstabe. Zusätzlich geprüft an den Leisten, die erst
durch eine Handlung entstehen — Auswahlleiste der Buchungen (`.bulkbar`, nach „alle auswählen"),
Werkzeugzeile des Boards, Filterleiste der Todos, bei 1280 und 960: kein Überhang, kein Nachfahre
außerhalb.

**Nicht gemessen:** die Ordnerwarnung der Export-Ansicht als `.screen__bar` — die Attrappe hat den
Zustand nicht erzeugt (dieselbe Lücke wie bei T-329 Abschnitt 7).

### 2.2 `PANEL_LABEL`

Gestrichen. Der Name des Laufbereichs kommt jetzt aus `AREA_LIST`, also aus der Liste, die die
Schiene beschriftet:

```ts
function panelLabel(area: SettingsArea): string {
  return AREA_LIST.find((item) => item.area === area)?.label ?? AREA_LIST[0].label;
}
```

`AREA_LIST` ist dafür von `: readonly AreaDescriptor[]` auf `as const satisfies readonly
AreaDescriptor[]` umgestellt — mit `noUncheckedIndexedAccess` braucht der Rückfall ein erstes
Element, das der Typprüfer kennt, und geprüft wird trotzdem gegen `AreaDescriptor`.

**Wirkung auf den zugänglichen Namen:** Die Bereiche `addin` und `arbeitsplatz` heißen als
Laufbereich nicht mehr „Einstellungen" (= derselbe Name wie der Rahmen darum), sondern
„Outlook-Add-in" und „Arbeitsplatz". Beide Wörter stehen sichtbar in der Schiene; **kein neuer
Oberflächentext**. Nach E-087 gesucht, über den Wortlaut und über beide Mengen (`git grep` und ein
Lauf über `tests/`, `apps/*/test`, `packages/*/test` im Arbeitsbaum): **kein Prüffall** nagelt
„Einstellungen" als Namen eines Gebiets fest, `getByRole('region', …)` kommt nirgends vor.
`proof:locked` 9/9, `proof:surface` 28/28, `proof:clamp` 21/21, `proof:foreign` 21/21.

### 2.3 `base.css:41`

Berichtigt. Der Satz nennt jetzt den Laufbereich je Ansicht, die Spalten des Boards und die
Tabellenfläche und sagt ausdrücklich, daß `.app__main` **rahmt** und nur im Rückfall läuft. Dazu
ein Satz darüber, daß der alte Wortlaut nach T-326 **falsch** war und nicht bloß unvollständig.

---

## 3 Hoch in der Anschauung (T-329)

### V1 — der Kanban-Kopf

Ursache gemessen: `.screen__actions` steht auf `flex: none` und ist im Kanban **785,3 px** breit
(der Umschalter trägt seinen Erklärsatz bei sich). Reicht die Zeile nicht, gibt als Einziges
`.grow` nach — bis auf null.

Behebung in `app.css`, drei Zeilen, alle im Kopf und keine am Umschalter:

```css
.screen__headline            { flex-wrap: wrap; }
.screen__headline > .grow    { flex-basis: 10rem; }
.screen__headline > .screen__actions { flex-shrink: 1; min-width: 0; }
```

Die dritte Zeile ist über den Vorschlag hinaus nötig und ein **eigener Befund**: Nach dem Umbruch
steht die Aktionsgruppe allein auf ihrer Zeile und war trotzdem breiter als diese. Das Ergebnis
war kein Bildlauf, sondern ein Schnitt — `.app__main` trägt `overflow-x: hidden`. Bei 960 px ragte
sie 89 px hinaus; „Spalten verwalten" war an der **getragenen Mindestbreite** nicht zu sehen, und
das schon vor T-326.

Breite von `.grow` / Höhe von `.screen__header` / Überbreite von `.app__main`:

| Fenster | vorher | nachher |
|---|---|---|
| 1440 | 340,7 / 129,8 / 0 | 340,7 / 129,8 / 0 |
| 1280 | 190,7 / 158,8 / 0 | **180,7** / 158,8 / 0 |
| 1200 | 110,7 / 242,8 / 0 | 902 / 129,8 / 0 |
| 1100 | 10,7 / 536,8 / 0 | 802 / 129,8 / 0 |
| 1087 | **0** / 536,8 / 0 | 789 / 129,8 / 0 |
| 1040 | **0** / 536,8 / **25** | 742 / 129,8 / 0 |
| 1024 | **0** / 536,8 / **41** | 726 / 129,8 / 0 |
| 1000 | **0** / 536,8 / **65** | 702 / 129,8 / 0 |
| 992 | **0** / 536,8 / **73** | 694 / 129,8 / 0 |
| 960 | **0** / 536,8 / **105** | 662 / 129,8 / 0 |
| 900 | **0** / 536,8 / **165** | 602 / 129,8 / 0 |
| 831 | **0** / 536,8 / 0 | 789 / 129,8 / 0 |

Die 10 px bei 1280 sind **nicht** der Umbruch, sondern die Rinne aus Punkt 2.1: Die Inhaltsbreite
des Kopfes fällt von 992 auf 982, und 982 ist die Breite von vor T-326. Bilder:
`shots/vorher-board-1024x640.png` (Titel „K", ein Wort je Zeile, 20 Zeilen) gegen
`shots/nachher-board-1024x640.png`.

**Daß sich bei 1280 und darüber sonst nichts ändert, ist gemessen und nicht geschlossen:** An
allen elf Ansichten bei 1440 und 1280 liegen `.grow` und `.screen__actions` weiter auf **einer**
Zeile (`umbruch=false`). Das Kanban hat dabei 20,7 px Luft (982 − 785,3 − 16 = 180,7 gegen die
Untergrenze 160), jede andere Ansicht mehr. Deshalb `10rem` und nicht `11rem`: 11 rem hätte
dieselben Zahlen ergeben, aber nur 4,7 px Abstand zur Umbruchschwelle.

### V2 — die Zeiterfassung bei ≤ 68 rem

**Der Rückfall greift** — `.screen__body--split` schaltet unterhalb von 68 rem auf
`overflow-y: auto`, und die beiden `.runarea` werden `visible`. Der Fehler lag eine Ebene tiefer:
`.time-layout__main` und `.time-layout__side` tragen `min-block-size: 0`, damit im **breiten**
Fall die Laufspalten Höhe zu teilen haben. Im schmalen Fall nimmt das den beiden Rasterzeilen ihre
inhaltsabhängige Mindesthöhe, und sie teilen sich die Rahmenhöhe zu gleichen Teilen: **je 267,6 px
bei einem Inhalt von 1862 und 3289 px**. Der Überschuß wird nicht abgeschnitten (`overflow:
visible`) — er malt sich über die Spalte darunter.

Behebung im vorhandenen `@media (max-width: 68rem)`-Block:

```css
.screen__body--split > .time-layout { flex: none; }
.screen__body--split .time-layout__main,
.screen__body--split .time-layout__side { min-block-size: auto; }
```

Gemessen bei 1000 × 700 (Kastenlage `y … unten`):

| | vorher | nachher |
|---|---|---|
| `.time-layout__main` | 124,8 … **392,4** bei einem Inhalt bis **1986,5** | 124,8 … 1986,5 |
| `.time-layout__side` | **408,4** … 676 bei einem Inhalt bis 3696,9 | 2002,5 … 5291 |
| Überlappung | **1578 px, sichtbar Text auf Text** | keine |
| Rahmen `scrollHeight / clientHeight` | 3572 / 575 | 5190 / 575 |

Dasselbe bei 900 × 700 und 700 × 700 nachgefahren, gleiches Ergebnis. Bei 1280 × 820 ist alles
unverändert: zwei `.runarea` mit 1469/278 und 5159/204, der Rahmen läuft nicht. Bilder:
`shots/vorher-time-1000x700.png` (Suchfeld, Kacheln und Todo-Zeilen durcheinander) gegen
`shots/nachher-time-1000x700.png`.

---

## 4 A-A-108 — die Rückfrage vor dem Öffnen hängt am Fenster

Umgesetzt wie von T-332 vorgeschlagen, aber an **drei** Stellen statt an einer: `DialogSurface`
deckt `FormDialog`, `ConfirmDialog`, `InfoDialog`, `UpdateDialog` und die Vorschau der Vorlagen ab
— `AttachmentOpenDialog` (**die** Fläche aus A-19.14) und `ShellStatus` zeichnen ihre Abdunklung
selbst. Statt drei Portale zu tippen, steht die Abdunklung jetzt einmal als exportierter Baustein
`Scrim` in `shared/ui/DialogSurface.tsx` (keine neue Datei für eine Sache), und alle drei nehmen
ihn:

```tsx
export function Scrim({ className, onKeyDown, onBlur, children }: ScrimProps) {
  return createPortal(<div className={cx("scrim", className)} …>{children}</div>, document.body);
}
```

`document.body` und nicht `#root`: `#root` liegt in der Höhenkette, `.app` darunter trägt
`overflow: hidden`.

Gemessen, 1280 × 820, Rückfrage vor dem Öffnen einer Datei (`.scrim` als `Breite × Höhe bei (x,y)`):

| Gestaltung | vorher | nach 600 px Bildlauf | nachher | nach 600 px |
|---|---|---|---|---|
| klassisch | 1280 × 820 bei (0,0) | (0,0) | 1280 × 820 bei (0,0) | (0,0) |
| glass | **644 × 298 bei (265,364)** | **(265,152)** — rollt weg | 1280 × 820 bei (0,0) | (0,0) |
| liquid-glass | **644 × 298 bei (265,364)** | **(265,152)** | 1280 × 820 bei (0,0) | (0,0) |

Elternkette der Abdunklung vorher: `section.card` mit `backdropFilter=blur(16px) saturate(1.15)`.
Nachher: `body`, **kein** Vorfahr mit einer solchen Eigenschaft. Bilder: `shots/vorher-dialog-glass.png`
(Titel und beide Knöpfe außerhalb der Abdunklung, „Öffnen" nicht zu sehen) gegen
`shots/nachher2-dialog-glass.png`.

**T-323 Abschnitt 8.3 gilt weiter — nachgemessen, wie verlangt.** Sieben Farbthemen × hell und
dunkel = 14 Läufe über `.app`, `.app__main`, `.screen`, `.screen__body`, `.runarea`,
`.kcolumn__body` und die sechs verbotenen Eigenschaften: **sauber in allen 14**, in `glass` wie in
„Klassisch". Ich habe keine davon gesetzt; das Portal ist die Antwort auf dieselbe Frage von der
anderen Seite.

**Tastatur nach dem Umbau**, in klassisch und glass gleich:

| | Ergebnis |
|---|---|
| Enter auf „Öffnen" | Abdunklung da, Fokus **im** Dialog (auf dem Kasten, Ring 2 px solid) |
| achtmal Tabulator | `Abbrechen → Öffnen → Abbrechen → …`, **nie** außerhalb |
| Escape | schließt, Fokus zurück auf dem auslösenden Knopf „Angebotsdatei" |
| Rückfrage vor dem **Entfernen** (`ConfirmDialog`) | ebenso: `body`, 1280 × 820, Fokus innen |
| `body:has(.scrim) .toast-layer` | greift weiter, `z-index` 299 |
| Bild-ab im Laufbereich | unverändert, `scrollTop` 0 → 353 |

**`proof:surface` ist dabei rot geworden und wieder grün** — und das gehört in den Bericht, weil
ich dafür einen Wächter angefaßt habe (`apps/web/scripts/proof-surface.mjs`, meine Hoheit):
Regel F läuft den JSX-Baum unter `.app` ab und meldete drei Befunde der Form „einen Ausdruck
dieser Bauart (CallExpression) liest der Sammler nicht — `createPortal(…)`". Das war richtig: Der
Sammler darf nicht schweigen über das, was er nicht liest. Ich habe ihm den Fall **beigebracht**
statt ihn stumm zu stellen: `createPortal(x, document.body)` verläßt das Raster, die Frage nach
der Rasterfläche stellt sich nicht mehr; **jedes andere Ziel** und jede andere Argumentzahl
bleiben ein Befund, denn dort kann wieder ein umschließender Block stehen. Dazu drei neue
Gegenproben (ein Portal an den Dokumentkörper darf **nicht** gemeldet werden; eines an
`wirt.current` und eines ohne Ziel **müssen** gemeldet werden) und eine Untergrenze: Findet der
Lauf **kein** Portal mehr, ist er rot — dann wäre die Abdunklung in die Hülle zurückgewandert.
Zahlen: **27/27 vorher → 28/28 jetzt**, und die Zusammenfassung nennt „3 durch ein Portal am
Dokumentkörper".

---

## 5 Läufe

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **grün**, acht Pakete plus Prüf- und E2E-Konfigurationen |
| `pnpm boundaries` | grün, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm contrast` | grün, 0 von 522 Paaren, 11/11 Gegenproben |
| `pnpm build` | grün, alle Pakete, `apps/web` gebündelt |
| `pnpm verify:bundle` | grün 20/0 — **bindet 17844**, siehe Abschnitt 0 |
| `proof:surface` | **28 bestanden, 0 fehlgeschlagen** (vorher 27/27) |
| `proof:locked` | 9/0 |
| `proof:clamp` | 21/0 |
| `proof:foreign` | 21/0 |
| `pnpm check` als Ganzes, `test:coverage`, `test:rust`, `audit`, `proof:all`, `proof:engines`, `test:e2e` | **nicht gefahren** — portgebunden beziehungsweise T-330 arbeitet parallel. Sie heißen damit **nicht gemessen**, nicht grün |

Kein `any`, keine Typzusicherung, kein `@ts-`, kein verschlucktes `catch` in den hinzugefügten
Zeilen. Kein Oberflächentext neu, geändert oder gestrichen.

---

## 6 Was ich **nicht** gemacht habe

- **Die vier niedrigen Befunde aus T-331** standen nicht im Auftrag und sind offen:
  `ScreenBody.tsx:159` (`ScreenFrame` mit `tabIndex={0}` — drei tote Tabulatorhalte),
  `BookingsScreen.tsx:354` (`.screen__bar` als Zusatzklasse statt als Umschlag),
  `ScreenBody.tsx:122` (die Doku nennt `screen__body--center`, das es nicht gibt),
  `router.ts:73` (`ROUTE_NAMES` ohne Leser — der Meßsatz kommt aus T-330).
- **Befund V5 aus T-329** (Einstellungen-Schiene bei 831 × 640 mit hängengebliebenen Trennlinien,
  mittel) stand nicht im Auftrag. Offen.
- **Befund V3/V4** (Sprungmarke tauscht die Ansicht; doppelte `aria-label="Todos"`) stand nicht im
  Auftrag. Offen.
- **`docs/design/**`** nicht angefaßt — nicht meine Hoheit, siehe die offenen Fragen.

---

## Kurzfassung

```
Aufgabe: T-334 — Nacharbeit an den fensterfesten Ansichten
Status: fertig
Artefakte: apps/web/src/styles/viewport-layout.css, apps/web/src/styles/app.css,
  apps/web/src/styles/base.css, apps/web/src/features/settings/SettingsScreen.tsx,
  apps/web/src/shared/ui/DialogSurface.tsx (neuer Baustein `Scrim`),
  apps/web/src/features/todos/AttachmentOpenDialog.tsx, apps/web/src/app/ShellStatus.tsx,
  apps/web/scripts/proof-surface.mjs, .claude/team/reports/T-334-frontend-dev.md
Zusammenfassung: Die vier gemeldeten Punkte sind behoben und jeder mit Vorher/Nachher im Browser
  gemessen. (1) Die Regel „Was stehenbleibt, schrumpft nicht" steht jetzt an der allgemeinen
  Stelle: Die Karte „Timer" wächst von 2 auf 170 px, der Base64-Satz der Export-Ansicht von 67 auf
  352 px, die Legende des Protokolls von 2 auf 180 px, und in den Einstellungen kommen 115
  abgeschnittene Pixel zurück und der Bereich läuft (786/671). (2) Der feste Kopf reserviert
  dieselbe Rinne wie der Laufbereich, und der Rahmen tut es auch — über alle 44 gemessenen Fälle
  ist die Differenz zwischen Kopfkante und Inhaltskante 0 und damit die Kante von vor T-326; daß
  das nötige `overflow: hidden` nichts abschneidet, ist als Bildvergleich gemessen (höchstens 32
  Bildpunkte, größter Unterschied 2 von 255). `PANEL_LABEL` ist gestrichen, der Name kommt aus
  `AREA_LIST`; der Kommentar in `base.css:41` benennt jetzt den richtigen Kasten. (3) Der
  Kanban-Kopf zerfällt nicht mehr: `.grow` fällt zwischen 1087 und 831 px nicht mehr auf 0, der
  Kopf ist 129,8 statt 536,8 px hoch, und die Aktionsgruppe wird bei 960 px nicht mehr um 89 px
  abgeschnitten. Die Zeiterfassung überlagert sich bei ≤ 68 rem nicht mehr — der Rückfall greift,
  aber die beiden Rasterzeilen bekommen ihre Inhaltshöhe zurück (vorher je 267,6 px bei 1862 und
  3289 px Inhalt). (4) Jede Abdunklung hängt über ein Portal am Dokumentkörper: in `glass` und
  `liquid-glass` 1280 × 820 bei (0,0) statt 644 × 298 bei (265,364), sie rollt nicht mehr weg, und
  in keinem der sieben Farbthemen × zwei Modi steht eine der von T-323 verbotenen Eigenschaften an
  Rahmen oder Laufbereich.
Annahmen: Drei Gestaltungsentscheidungen habe ich selbst getroffen, weil der Auftrag „die
  Inhaltsspalte bleibt pixelgleich" sonst nicht einlösbar war: (a) `.screen__body--frame` bekommt
  `scrollbar-gutter: stable` statt `auto` — sonst wäre der Versatz nur von den acht Ansichten zu
  den drei Rahmenansichten gewandert; damit gilt wieder die Kante von vor T-326. (b) Der
  Bildschirmkopf bricht um, wenn die Titelspalte sonst unter `10rem` fiele; der Wert ist an der
  engsten vorhandenen Titelspalte gemessen (Kanban, 180,7 px bei 1280) und läßt jeder Ansicht bei
  1280 und 1440 ihre heutige Zeile. (c) Die Aktionsgruppe darf schrumpfen, wenn sie allein auf
  ihrer Zeile steht. Außerdem habe ich `.kcolumn__body > *` in die Sammelregel aufgenommen, obwohl
  dort heute nichts schrumpft — gemessen kostet es nichts. Und ich habe `proof:surface` um den
  Portalfall erweitert, statt den Befund stehenzulassen; die Alternative wäre ein rotes `pnpm
  check` gewesen.
Risiken: Der Umbruch im Kanban-Kopf ist eine **sichtbare** Layoutänderung unterhalb von etwa
  1067 px Fensterbreite — die Aktionen stehen dort unter dem Titel statt daneben. Sie ist
  gegenüber dem heutigen Zustand (unlesbarer Kopf, abgeschnittener Knopf) eine Verbesserung, aber
  sie ist neu und gehört vor visual-qa. Der Export-`.table-wrap` verliert seine eigene senkrechte
  Bildlaufstelle; der Tabellenkopf der Gruppenliste klebt dort damit nicht mehr — das ist der
  Zustand vor T-326 und die Zuweisung aus T-322 4.7, aber es ist eine Änderung gegenüber gestern.
  `overflow: hidden` am festen Teil ist eine Zusage über die **Zukunft**: Wer künftig etwas in den
  Kopf legt, das über seine Kante ragen soll, wird abgeschnitten statt gewarnt. Sicherheitsseitig:
  keine neue Adresse, kein neuer Datenweg, keine neue Route; `apps/desktop/**` unberührt, also auch
  `tauri.conf.json`. Das Portal legt den Dialog außerhalb von `.app` — die Fokusfalle, die
  Rückgabe des Fokus und Escape sind deshalb einzeln nachgemessen und tragen.
Offene Fragen: (1) `.screen__body--frame { scrollbar-gutter: stable }` widerspricht dem Wortlaut
  in `docs/design/fensterfeste-flaechen.md` („der Rahmen soll keine Rinne reservieren"). Bestätigt
  ui-designer die Änderung, oder gilt der Versatz als gewollt? Die Datei gehört nicht mir.
  (2) `flex-basis: 10rem` an `.screen__headline > .grow` ist eine neue Layoutkonstante im
  Bildschirmkopf — soll sie ein Token bekommen, und bestätigt ui-designer den Umbruch unterhalb
  von etwa 1067 px? (3) Der zugängliche Name des Einstellungs-Laufbereichs heißt in zwei Bereichen
  jetzt „Outlook-Add-in" und „Arbeitsplatz" statt „Einstellungen";
  `docs/design/fensterfeste-flaechen-fluss.md` Abschnitt 4 nennt die alte Zuordnung und gehört
  ux-designer. (4) `pnpm verify:bundle` bindet 17844 — ich habe es gefahren, bevor ich das gesehen
  hatte. Soll es in die Liste der portgebundenen Läufe, die ein Agent nicht von sich aus fährt?
Nächster Schritt: visual-qa über die vier geänderten Flächen (Kanban-Kopf zwischen 960 und
  1100 px, Zeiterfassung bei 1000 × 700, Dashboard/Export/Protokoll/Einstellungen bei 1280, und
  die Rückfrage vor dem Öffnen in `glass` und `liquid-glass`), danach dieselbe Freigaberunde nur
  über die geänderten Zeilen. In derselben Welle der Meßsatz aus Abschnitt 1 an den e2e-tester —
  die Vorschrift samt der drei Einschränkungen steht dort, und die Messung, die vorher rot gewesen
  wäre, ist beziffert.
```
