# T-210 — visual-qa: drei gerechnete Befunde gemessen, plus ein Stück O-ID

**Rolle:** visual-qa **Datum:** 2026-09-06, Meßfenster 10:20 bis 11:15 Uhr (UTC) / 12:20 bis
13:15 Uhr (CEST/Europe-Berlin)
**Zweig:** `versionspruefung-gegen-github`

---

## Ergebnis vorweg

| Punkt | Rechnung (ui-designer, T-204) | Messung |
|---|---|---|
| B-11 Fokusring, Primärknopf hell | unsichtbar, „ein Knopf, der um 2 px wächst" | **bestätigt, mit Mechanismus** — echter Fokusring in Chromium unsichtbar, Knopf wirkt lediglich vergrößert |
| B-9 `.updatebar`-Rasterzelle | ohne Hüllenmeldung Zeile 1/Spalte 1, mit Hüllenmeldung implizite Zeile 4 unter dem Inhalt | **bestätigt, und die Messung geht weiter**: in beiden Fällen ist die Fläche nur 240 px breit (Seitenleistenbreite), nie über die volle Breite — und sie **drückt den Inhaltsbereich zusammen**, ohne die gewonnene Zeile sichtbar zu nutzen |
| B-12 Kachel „Überfällig", Fläche | Rahmen scheitert bei 1,66/1,79, Fläche ungemessen | **gemessen: die Fläche scheitert deutlicher als der Rahmen** — 1,01 bis 1,13:1 in Graustufen, je nach Vergleichsfläche und Thema |

Alle drei Rechnungen halten der Messung stand — keine wurde widerlegt. Wo die Messung über die
Rechnung hinausgeht, steht das unten gesondert, nicht als Widerspruch verkleidet.

---

## Umgebung und Methodik

Drei getrennte, minimale Aufbauten, je nach Frage — keiner davon hat eine laufende Instanz eines
anderen Agenten berührt (`ss -ltnp` vor Beginn geprüft: Port 5173/5199/17843 frei).

1. **B-9 und B-11**: eigens gebaute HTML-Meßfixturen unter `/tmp/t210-qa/*-fixture.html`, die
   ausschließlich die **echten, unveränderten** Stylesheets der Anwendung laden
   (`packages/ui-tokens/tokens.css`, `apps/web/src/styles/{base,components,app}.css`, exakt in der
   Reihenfolge aus `apps/web/src/main.tsx`) und darin **wortgleiche** Ausschnitte des echten DOM
   trägt — Tag- und Klassennamen Zeile für Zeile aus `App.tsx` (288–360), `UpdateNotice.tsx`
   (71–93), `Primitives.tsx` (Button, 46–90) übernommen, per `grep` vor dem Schreiben der Fixtur
   geprüft, nicht aus dem Gedächtnis nachgebaut. Kein CSS wurde für die Messung verändert; nur die
   Markup-Hülle ist meine.
   **Warum eine Fixtur statt der laufenden Anwendung für B-9/B-11:** Die Frage ist eine reine
   CSS-Layout- bzw. Kaskadenfrage (wo plaziert das Rastermodul ein Element ohne `grid-area`? welche
   Pixelfarbe zeichnet `:focus-visible`/`.on-solid` tatsächlich?) — vollständig durch Stylesheet und
   DOM-Struktur bestimmt, unabhängig von React-Zustand oder Zeittakt. Diese beiden Größen
   entstammen der echten Anwendung (per Quelltext geprüft, s. u.), nicht meiner Erfindung.
2. **B-12**: dieselbe Bauart, mit der echten `StatTile`-Struktur aus `screens/parts.tsx`
   (175–202) und den fünf Kacheln wortgleich zu `DashboardScreen.tsx` (195–254) nachgebaut.
3. **O-ID (Confirm-Dialog mit Begründung)**: die **echte** Musterseite
   (`pnpm --filter @takt/web exec vite --host 127.0.0.1 --port 5199 --strictPort`,
   `designsystem.html#tabelle`), kein Nachbau — Rechtsklick auf die echte, verdrahtete Zeile,
   echtes Kontextmenü, echter `ConfirmDialog`.

Browser: Chromium über `@playwright/test` (Version 1.62.1) aus dem Wurzel-`node_modules`, per
eigenem `chromium.launch()`-Skript unter `/tmp/t210-qa/measure-*.mjs` (keine Playwright-Testdatei
im Repository, keine Änderung an `tests/e2e/**`). Für jede Farbfrage: **echte Pixel aus dem
Bildschirmabzug**, per Canvas/`getImageData` auf ein im selben Browser geladenes PNG zurückgelesen
— dieselbe Methode wie T-198, aus demselben Grund („ein Wert, der behauptet, was der Stil sein
sollte, ist keine Messung dessen, was gezeichnet wurde"). Kontrastverhältnisse mit derselben
WCAG-Formel wie `contrast-check.mjs` (`relativeLuminance`/`contrastRatio`, wortgleich
nachgebaut, an einer Stelle gegen den Rohwert aus den Tokens nachgerechnet, s. B-12). Alle
Wegwerfskripte und Fixturen liegen unter `/tmp/t210-qa/**`, keine davon im Repository verblieben
(`git status` sauber). Bildschirmabzüge und Rohdaten liegen unter
`.claude/team/reports/T-210-screens/`.

**Die Grenze aus T-B09, wie vorgegeben:** In dieser Umgebung läuft **kein** Vorleseprogramm.
Nichts unten behauptet ein Ansage-Erlebnis; wo DOM-Struktur (`role="alert"`, `aria-required`)
gemessen ist, steht das als DOM-Messung, nicht als gehörter Ton.

**Die zweite Grenze, seit T-207 benannt: Engine.** Alles unten ist in **Chromium** gemessen
(Playwrights gebündelte Fassung). Von den drei ausgelieferten Erzeugnissen (`.github/workflows/
release.yml`: `ubuntu-24.04`, `windows-2022`, `macos-15`) zeichnet nur **Windows** mit einer
Chromium-Engine (WebView2); Linux zeichnet mit WebKitGTK, macOS mit WKWebView — für beide bleiben
alle drei Befunde hier **ungemessen**, und selbst ein `playwright install webkit` wäre nach T-207s
Befund nur ein Näherungswert (Playwrights Linux-WebKit ist ein eigener GTK-Port-Oberbau, nicht das
System-`libwebkit2gtk`, das die Hülle über `wry` benutzt). Betroffen wären hier am ehesten B-11
(Box-Shadow-über-Outline-Malreihenfolge ist keine CSS-Vorgabe, sondern Sache der Engine) und B-9
(Grid-Auto-Placement ist spezifiziert und sollte identisch sein, aber ungemessen bleibt ungemessen).
B-12 ist reine Farbrechnung auf deckenden Flächen und dürfte engine-unabhängig sein — auch das ist
eine Erwartung, keine Messung.

---

## 1. B-11 — der Fokusring am Primärknopf, hell: bestätigt, mit Mechanismus

### 1.1 Mechanik aus dem Quelltext (`base.css:173-189`)

```css
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
.on-solid:focus-visible {
  outline-color: var(--focus-ring-contrast);
  box-shadow: 0 0 0 calc(var(--focus-ring-width) + var(--focus-ring-offset)) var(--focus-ring-color);
}
```

Token (`packages/ui-tokens/tokens.css`), hell: `--focus-ring-color: #2159da` = `--accent-bg:
#2159da` (zeichengleich), `--focus-ring-contrast: #ffffff` = `--bg-surface: #ffffff`
(zeichengleich). Dunkel: `--focus-ring-color: #93b4fc`, `--accent-bg: #6091f8` (verschieden);
`--focus-ring-contrast: #06101f`, `--bg-surface: #131b2b` (verschieden). Damit ist T-204s
Tokenvergleich am Quelltext bestätigt, bevor überhaupt ein Pixel gemessen ist.

### 1.2 Messung: Tabulator, keine Maus, echte Pixel

Fixtur mit drei echten Knopfklassen (`btn btn--primary btn--md on-solid`,
`btn btn--danger btn--md on-solid`, `btn btn--secondary btn--md`), Fokus über `page.keyboard.press
('Tab')` mit der jeweils richtigen Schrittzahl (1/2/3 — beim ersten Versuch hatte mein eigenes
Skript einen Fehler: alle drei Läufe fokussierten den ersten Knopf, weil ich testweise einmal
`.focus()` statt gezählter Tab-Schritte benutzt hatte; korrigiert und mit
`document.activeElement.id` gegengeprüft, bevor eine Farbe gezählt wurde). Für jede Kombination:
Bildschirmabzug **vor** und **nach** dem Tab, plus eine Pixelreihe vom Knopfrand 8 px nach außen.

**Licht, Primärknopf** (`b11-01/02-light-primary-*.png`, Rohdaten `b11-results.json`):

```
Abstand vom Rand:  -8  -7  -6  -5  -4  -3  -2  -1   0
unfokussiert:      weiß weiß weiß weiß weiß weiß weiß weiß  Knopf(blau)
fokussiert:        weiß weiß weiß weiß weiß weiß  BLAU BLAU  Knopf(blau)
```

Die sichtbare Änderung ist **ein einziger** harter Übergang, keine zwei Ringbänder. Der Grund:
`--focus-ring-contrast` (weiß, äußeres Band) ist an dieser Stelle dieselbe Farbe wie die Karte
(`--bg-surface`, weiß) — der Übergang Karte→Ring ist unsichtbar. `--focus-ring-color` (blau,
inneres Band) ist dieselbe Farbe wie die Knopffüllung (`--accent-bg`) — der Übergang Ring→Knopf ist
ebenfalls unsichtbar. **Übrig bleibt der einzige Übergang, der zufällig in der Mitte des Rings
liegt: weiß zu blau — und der sieht aus wie die neue Kante eines etwas größeren Knopfes, nicht wie
ein Fokusring.** Bildvergleich `b11-02-light-primary-focused.png`: ein wenig größeres blaues
Rechteck, keine erkennbare Umrandung. Genau die Vorhersage aus T-204 („ein Knopf, der um 2 px
wächst"), nicht als Ableitung, sondern als gemessene Pixelfolge.

Kontrastrechnung auf denselben Pixeln (WCAG-Formel): Ring-außen (weiß) gegen Karte (weiß) =
**1,00:1**; Ring-innen (blau) gegen Knopf (blau) = **1,00:1**. Beide Seiten des „Indikators"
verfehlen die 3:1-Mindestforderung aus SC 1.4.11 (Non-text Contrast) an beiden Kanten — nicht nur
eine Kante wie ein gewöhnlicher schwacher Kontrast, sondern **beide zugleich**, was den Indikator
als Fläche vollständig zum Verschwinden bringt. Das ist der Befund zu SC 2.4.7: Der Fokus **ist da**
(im Bedienungshilfen-Baum, `tabIndex=0`, per Tab erreichbar — nicht am Zustand des Elements
gescheitert), aber **nicht wahrnehmbar als Fokusindikator**, nur als Größenänderung, die von einer
Übergangsanimation nicht zu unterscheiden wäre.

**Danach eine methodische Randnotiz, die für die nächste Messung dieser Art zählt:** Meine
ursprüngliche Erwartung aus reiner CSS-Lektüre war, `outline` läge **über** `box-shadow` und beide
Bänder blieben in beiden Themen als zwei getrennte Farbflächen sichtbar. Im **Dunkelthema** ist das
exakt so — drei Zonen klar unterscheidbar:

```
Abstand:     -4/-3        -2/-1              0
Dunkel:  focus-ring-contrast(#06101f)   focus-ring-color(#93b4fc)   Knopf(#6091f8)
         (dunkel, gegen Karte #131b2b sichtbar)  (hellblau, gegen beide Nachbarn sichtbar)
```

Im **Hellthema** verschwindet diese Dreiteilung **nicht**, weil die Malreihenfolge sich ändert,
sondern weil **beide Grenzfarben zufällig mit ihrer jeweiligen Nachbarfläche zusammenfallen** — die
Dreiteilung ist geometrisch identisch, nur an zwei von drei Nahtstellen unsichtbar gemacht durch die
Tokenwahl. Das ist kein Widerspruch zu T-204, sondern die Pixelbestätigung, **warum** die von
T-204 berechnete 1,00:1-Zahl sich als „Knopf wächst" und nicht als „Ring fehlt ganz" zeigt.

**Gefahrenknopf und Sekundärknopf, hell — bestätigt unbetroffen:**

```
Gefahr, hell, fokussiert:  weiß×6 | BLAU BLAU | rot(Knopf)
```

Blau (`--focus-ring-color`) gegen weiß (Karte) und gegen Rot (`--danger-bg`) sind beides klar
unterscheidbare Farben — sichtbarer Ring, Screenshot `b11-04-light-danger-focused.png`. Sekundär
(kein `.on-solid`, nur die generische `:focus-visible`-Regel, kein Doppelring): blauer Ring klar
gegen Weiß, Screenshot `b11-05-light-secondary-focused.png`. Dunkles Thema an allen drei
Ausprägungen sichtbar (`b11-03`, `b11-06`). **T-204s Einschränkung „Gefahrenknopf und dunkles Thema
sind nach seiner Rechnung nicht betroffen" ist an allen vier restlichen Kombinationen bestätigt.**

---

## 2. B-9 — `.updatebar`: bestätigt, und die Messung zeigt mehr als die Rechnung

### 2.1 Mechanik aus dem Quelltext

`App.tsx` (288–360): `.app` trägt `<a class="skip-link">` (fixed, nimmt nicht am Raster teil),
`<ShellStatus>` (rendert `.shellnotes` nur wenn `hasNotices`, sonst **gar keinen** Knoten — kein
leerer Platzhalter), `<UpdateNotice>` (rendert `.updatebar` nur wenn `arrival === "session"` und
nicht weggeklickt — sonst gar keinen Knoten), `<aside class="app__sidebar">`, `<header
class="app__header">`, `<main class="app__main">`. `app.css:81-88`: `grid-template-areas: "notice
notice" / "side head" / "side main"`. `.shellnotes`, `.app__sidebar`, `.app__header`, `.app__main`
tragen je ein `grid-area`; `.updatebar` (`app.css:1811-1820`) trägt **keins** — bestätigt per
`grep`, keine `grid-column`/`grid-row`/`grid-area`-Regel irgendwo im Stylesheet für diese Klasse.

### 2.2 Messung: echte Fixtur, zwei Szenarien, echte `getBoundingClientRect()`

Fixtur mit exakt dieser DOM-Reihenfolge; Szenario „mit Hüllenmeldung" wie geschrieben, Szenario
„ohne" durch Entfernen des `.shellnotes`-Knotens (kein CSS-Trick — genau der Fall, den
`ShellStatus` selbst erzeugt, wenn `hasNotices === false`). Rohdaten: `b9-rects.json`.

| | ohne Hüllenmeldung | mit Hüllenmeldung |
|---|---|---|
| `.shellnotes` | (kein Knoten) | x=0 y=0 **1280×72** (volle Breite, Zeile „notice") |
| `.updatebar` | x=0 **y=0 240×153,5** | x=0 **y=666,5 240×153,5** |
| `.app__sidebar` | y=153,5 (nach unten verschoben) | y=72 (normal) |
| `.app__main` Höhe | 614,5 | **542,5** (um genau die Höhe von `.updatebar` geschrumpft) |

**Bestätigt, zeichengleich zu T-204:** ohne Hüllenmeldung landet `.updatebar` in Zeile 1/Spalte 1
(240 px, Seitenleistenbreite), oben; mit Hüllenmeldung in einer impliziten vierten Zeile
**unterhalb** von Seitenleiste/Kopf/Inhalt (y beginnt bei 666,5 — exakt dort, wo `.app__main`
endet).

**Was die Messung zusätzlich zeigt, und die reine Rechnung nicht ausgesprochen hatte:** In
**beiden** Fällen ist `.updatebar` nur **240 px breit**, nicht die volle Breite von 1280 px — das
Rasterelement bekommt beim Auto-Placement die Standardspanne von einer Spalte, keine automatische
Vollbreite. Der Kommentar über der Klasse (`app.css:1801-1810`, „Sie steht im Fluss über dem Inhalt
und schiebt ihn nach unten") beschreibt eine **volle Breite über dem Inhalt** — die tatsächliche
Fläche ist eine schmale, 240 px breite Box am linken Rand, in der „mit Hüllenmeldung"-Lage **unter**
der Seitenleiste hockend, mit 1040 px leerer Hintergrundfläche rechts daneben (Bildschirmabzug
`b9-01-mit-huellenmeldung.png` — die blaue Box sitzt sichtbar wie ein falsch platziertes
Seitenleisten-Element, nicht wie ein Seitenbanner). Zusätzlich **schrumpft** `.app__main` in diesem
Fall um die volle Höhe der Leiste (`minmax(0, 1fr)`-Zeile absorbiert die neue implizite Zeile), ohne
dass die dabei gewonnene Zeile die Breite des Inhaltsbereichs überhaupt nutzt — der Inhaltsbereich
wird kleiner, ohne dass die Meldung ihn sichtbar erreicht.

**Bildbelege:** `b9-01-mit-huellenmeldung.png`, `b9-02-ohne-huellenmeldung.png` (beide mit
1-px-Rahmen um jedes Rasterelement zur Meßhilfe, kein Produktivstil).

---

## 3. B-12 — Kachel „Überfällig": die Fläche ist gemessen, und sie scheitert deutlicher als der Rahmen

### 3.1 Quelltextbehauptung

`app.css:932-939`:
```css
/* ... Beide Merkmale — Rahmen und Flaeche — wechseln, damit die Kachel
   auch in Graustufen die auffaelligste bleibt (SC 1.4.1). */
.stat--danger {
  border-color: var(--danger-border);
  background-color: var(--danger-bg-subtle);
}
```
Bekannt (T-022, `traeger-und-zusage.md:739`): `--danger-border` gegen `--bg-surface` = 1,66:1
(hell) / 1,79:1 (dunkel) — beide unter der 3:1-Mindestforderung für unterscheidbare UI-Flächen.

### 3.2 Messung: echte fünf Kacheln, echtes Graustufenfilter, echte Pixel

Fixtur mit der wortgleichen `StatTile`-Struktur aus `screens/parts.tsx` und denselben fünf Kacheln
wie `DashboardScreen.tsx` (Heute erfasst / Noch nicht exportiert [warning] / Offene Todos [accent] /
Überfällig [danger] / Erledigte Todos), `filter: grayscale(1)` auf den Container (dieselbe Technik
wie die eingebaute Graustufenprobe der Musterseite, hier auf einer eigenen Fixtur mit echtem CSS).
Rohdaten `b12-results.json`, Kontrastformel wortgleich zu `contrast-check.mjs` nachgebaut und
gegen den Rohwert der Tokens nachgerechnet (Licht: `--danger-bg-subtle #fdf0ef` gegen `--bg-surface
#ffffff` von Hand über die WCAG-Formel ergibt 1,111 — die Pixelmessung liefert 1,11; Übereinstimmung
bestätigt die Meßkette von Token bis Bildschirmabzug).

| Vergleich (Graustufe) | hell | dunkel |
|---|---|---|
| Fläche Überfällig vs. Fläche „Noch nicht exportiert" (warning) | 1,03 | 1,07 |
| Fläche Überfällig vs. Fläche „Offene Todos" (accent) | 1,01 | 1,13 |
| Fläche Überfällig vs. schlichte Fläche („Heute erfasst", `--bg-surface`) | **1,11** | **1,03/1,06*** |
| Fläche Überfällig vs. Anwendungshintergrund (`--bg-canvas`) | 1,04 | 1,11 |
| Rahmen Überfällig vs. Rahmen warning (zum Vergleich, dieselbe Meßkette) | 1,03 | 1,07 |

*1,06 von Hand aus den Tokens gerechnet, 1,03 aus dem Bildschirmabzug — die kleine Abweichung liegt
im Rundungsverhalten der PNG-Kodierung, nicht in der Meßmethode; beide liegen um dieselbe
Größenordnung.

**Ergebnis: Die Fläche unterscheidet sich in Graustufen so gut wie gar nicht — weder von den
Nachbarkacheln noch vom Anwendungshintergrund selbst.** 1,01 bis 1,13:1 liegt deutlich unter dem
Bereich, in dem ein menschliches Auge überhaupt einen Unterschied wahrnimmt (üblicherweise werden
Unterschiede unter etwa 1,5:1 als „gleiche Fläche" gelesen), und weit unter der 3:1-Forderung für
unterscheidbare UI-Flächen. **Die Fläche scheitert damit deutlicher als der bereits bekannte Rahmen
(1,66/1,79)** — der Kommentar „Beide Merkmale — Rahmen und Fläche — wechseln, damit die Kachel auch
in Graustufen die auffälligste bleibt" trifft auf **keines** der beiden Merkmale zu, nicht nur auf
das eine, das schon dokumentiert war.

**Bildbeleg, am eindrücklichsten:** `b12-02-light-gray.png` — alle vier sichtbaren Kacheln
(„Heute erfasst", „Noch nicht exportiert", „Offene Todos", „Überfällig") sehen in Graustufen **nahezu
identisch** aus; „Überfällig" ist die Kachel, die laut A-19.4/SC 1.4.1 am lautesten sein soll, und
sie ist in diesem Bild nicht die auffälligste, sondern ununterscheidbar von den anderen. Zum
Vergleich `b12-01-light-color.png` (Farbversion, klar unterscheidbar) und `b12-04-dark-gray.png`
(dasselbe Bild im Dunkelthema).

---

## 4. O-ID — was in T-198 offen blieb: eine Fläche geschlossen, der Rest mit Zahl

T-198 hatte vier bis fünf der sieben O-HR-Flächen und drei der sechs neuen Pflichtfeldmeldungen
nicht unabhängig gemessen (T-198, Abschnitte 2.3 und 4.2/4.4).

### 4.1 Geschlossen: „Begründung fehlt." am echten, verdrahteten `ConfirmDialog`

Wo T-198 abgebrochen hatte („der zufällig erste getroffene Beispieldatensatz war noch nicht
exportiert, sein Menüpunkt entsprechend gesperrt"), habe ich gezielt die zweite Demozeile
(`b-2`, exportStatus „exported", Zeittext „30.08.2026, 14:03–14:48" aus `showcase/data.ts`)
angesteuert: Rechtsklick auf die Zeile in `designsystem.html#tabelle`, Kontextmenüpunkt
„Exportstatus zurücksetzen" (nicht gesperrt, `aria-disabled` fehlt), echter `ConfirmDialog` mit
`reasonRequired`.

Zwei Teilmessungen, beide gemessen, nicht nur eine:

1. **Feld antasten, ohne zu tippen, dann verlassen (P-8-Probe):** keine Meldung —
   `role="alert"`-Text bleibt leer (`oid-01-confirm-beruehrt-leer-still.png`). **Korrektes
   Verhalten, kein Fehlschlag:** `touchedOnBlur("", false)` liefert `false` (dieselbe Regel wie
   T-207/T-198 an anderen Feldern gemessen — bloßes Antasten ohne Eingabe ist keine Eingabe).
2. **Echter Absendeversuch bei leerem Pflichtfeld** (Bestätigungshaken gesetzt, Knopf
   „Zurücksetzen" trägt `aria-disabled="true"`, Klick mit `{ force: true }`, derselbe Weg, den
   T-207/O-IF für genau diese Knopfart beschreibt): **„Begründung für das Protokoll fehlt."**
   erscheint sofort unter dem Feld, Dialog bleibt offen (`oid-02-confirm-begruendung-fehlt.png`).
   Fläche ist **immer im Baum** (leer vorher, Text nachher im selben Knoten — DOM-Messung, nicht
   nur Bildvergleich).

**Damit ist der dritte der drei unter 4.4 in T-198 offen gebliebenen Sätze jetzt unabhängig am
Bildschirm bestätigt** — nicht nur, wie T-198 es tat, aus T-186s eigenem Protokoll übernommen.

### 4.2 Nicht geschlossen, mit Zahl

- **O-FR:** **zwei** der ursprünglich drei offenen Sätze bleiben unabhängig ungemessen —
  `PoolFormDialog` („Name fehlt.") und `TemplatesScreen`-Kopierdialog („Name der Kopie fehlt.").
  Beide brauchen echte Bestandsdaten (einen Pool bzw. eine Vorlage) über den echten Dienst, nicht
  nur die Musterseite — derselbe Aufwand wie der volle Aufbau aus T-198s O-FR-Abschnitt, den ich in
  diesem Durchgang nicht mehr begonnen habe (Kostengrenze dieses Laufs).
- **O-HR:** unverändert **vier bis fünf** der sieben von T-191 genannten Flächen ungemessen
  (Vorlageneditor mit doppeltem Schlüssel/„Ungespeicherte Änderungen", Vorschau einer nicht
  exportierbaren Tagesgruppe, Exportlauf mit gesperrter Gruppe, Anhang mit Fehler in der
  Todo-Ansicht, Tag-Auswahl während des Ladens) — dieselbe Zahl wie in T-198, weil ich in diesem
  Durchgang meine verbleibende Zeit auf die drei namentlich beauftragten Rechnungen (B-9/B-11/B-12)
  konzentriert habe, die den expliziten Kern von T-210 bilden.

---

## Befunde (Format wie vorgegeben)

`apps/web/src/components/Primitives.tsx` / `apps/web/src/styles/base.css:173-189` (`.on-solid:
focus-visible`, Primärknopf, helles Thema) **hoch** — Der Fokusring ist gemessen unsichtbar: beide
Grenzfarben des Doppelrings (`--focus-ring-contrast` gegen `--bg-surface`, `--focus-ring-color`
gegen `--accent-bg`) liegen bei 1,00:1, Pixelmessung zeigt einen einzigen Übergang mitten im Ring
statt eines erkennbaren Rings — sichtbares Ergebnis ist ein Knopf, der beim Tabulieren um wenige
Pixel wächst, kein Fokusindikator (SC 2.4.7, SC 1.4.11). Erwartung: Fokus auf dem Primärknopf im
hellen Thema ist als eigene, von Füllung und Karte unterscheidbare Fläche erkennbar. Fix: eigenes
Farbpaar für `.on-solid`-Ringe im hellen Thema, das nicht mit `--accent-bg`/`--bg-surface`
zusammenfällt — z. B. ein dunklerer Blauton für `--focus-ring-color` oder ein sichtbar vom Weiß
abgesetzter Ton für `--focus-ring-contrast`; danach mit derselben Fixtur-Methode erneut prüfen.
Betrifft nach Messung ausschließlich `primary` im hellen Thema — `danger` (helles Thema) und alle
Ausprägungen im dunklen Thema sind bestätigt unbetroffen.

`apps/web/src/styles/app.css:1811-1820` (`.updatebar` ohne `grid-area`) **hoch** — Gemessen in
beiden Auslösefällen: Ohne Hüllenmeldung landet die Leiste oben links in Seitenleistenbreite
(240×153,5 px bei 1280 px Fensterbreite) und schiebt Seitenleiste/Kopf/Inhalt nach unten. Mit
Hüllenmeldung landet sie in einer impliziten vierten Rasterzeile **unterhalb** des gesamten
Inhaltsbereichs, ebenfalls nur 240 px breit, und verkleinert zusätzlich `.app__main` um ihre eigene
Höhe, ohne die gewonnene Fläche sichtbar zu nutzen. In keinem der beiden Fälle entsteht die im
Quelltextkommentar beschriebene volle Breite über dem Inhalt. Erwartung: Die Leiste erscheint immer
über dem Inhaltsbereich, über die volle Breite. Fix: eigene benannte Rasterzeile (`grid-template-
areas` um eine Zeile „update" ergänzen, `.updatebar { grid-area: update; }`) — T-204 hat diese
Lösung bereits als Vorgabe benannt („Meine Vorgabe [benannte Rasterzeile `update`] behebt es mit,
unabhängig vom Ausgang der Messung"); diese Messung bestätigt, dass sie gebraucht wird.

`apps/web/src/styles/app.css:932-939` (`.stat--danger`, Kachel „Überfällig", Kommentarzeile
932-935) **hoch** — Die im Kommentar behauptete Graustufen-Zusage für die Fläche
(`--danger-bg-subtle`) ist gemessen falsch: Kontrast gegen jede geprüfte Nachbarfläche (warning-,
accent-Kachel, schlichte Kachel, Anwendungshintergrund) liegt zwischen 1,01 und 1,13:1 in beiden
Themen — deutlich schlechter als der bereits dokumentierte Rahmen (1,66/1,79) und weit unter der
3:1-Mindestforderung für unterscheidbare UI-Flächen (SC 1.4.11) bzw. der Grundaussage von SC 1.4.1.
Bildbeleg `b12-02-light-gray.png`: alle vier sichtbaren Kacheln sind in Graustufen praktisch
ununterscheidbar. Erwartung: „Überfällig" bleibt auch ohne Farbwahrnehmung die auffälligste Kachel
der Reihe. Fix: ein drittes, nicht-farbliches Merkmal (z. B. Fettung von `.stat__value`, ein
Symbol neben dem Etikett, oder ein deutlich kräftigerer Flächenwert speziell für `--danger-bg-
subtle`, gemessen gegen `--bg-surface` mit Mindestwert 3) — dieselbe Bauart, die T-194/T-198 für die
Randschiene des Leistungsfelds bereits vorgeschlagen haben (zusätzliches Formmerkmal statt
reiner Farbkorrektur, weil Farbkorrektur allein die 3:1-Hürde für eine so helle/dunkle „subtle"-
Fläche kaum erreichen dürfte, ohne den Gesamtton der Reihe zu sprengen — das ist eine Einschätzung,
keine Messung, und gehört vor der Umsetzung an ui-designer).

`apps/web/src/screens/PoolFormDialog.tsx`, `apps/web/src/screens/TemplatesScreen.tsx`
**niedrig** (Abdeckungslücke, kein Befund) — Zwei der ursprünglich drei in T-198 offen gebliebenen
neuen Pflichtfeldmeldungen („Name fehlt." im Pool-Dialog, „Name der Kopie fehlt." im
Vorlagen-Kopierdialog) sind weiterhin nicht unabhängig am Bildschirm gemessen; beide brauchen
Bestandsdaten über den echten Dienst. Erwartung: eine kurze Folgemessung mit vorbereiteten Daten
(ein Pool, eine Vorlage) schließt beide.

`.claude/team/reports/T-210-visual-qa.md` (dieser Bericht, O-HR) **niedrig** (Abdeckungslücke,
unverändert seit T-198) — Vier bis fünf der sieben von T-191 genannten Flächen (Vorlageneditor mit
doppeltem Schlüssel/„Ungespeicherte Änderungen", Vorschau einer nicht exportierbaren Tagesgruppe,
Exportlauf mit gesperrter Gruppe, Anhang mit Fehler in der Todo-Ansicht, Tag-Auswahl während des
Ladens) sind weiterhin nicht eigenständig gemessen — in diesem Durchgang zugunsten der drei
namentlich beauftragten Rechnungen zurückgestellt. Erwartung: eine eigene Folgeaufgabe mit
vorbereiteten Testdaten (gemischter Exportstatus, künstlich verzögerte Netzwerkantwort) schließt
sie, wie schon in T-198 vorgeschlagen.

`packages/ui-tokens/tokens.css` / `apps/web/scripts/contrast-check.mjs` **mittel** — Sowohl das
Fokusring-Paar (`--focus-ring-contrast`/`--bg-surface`, `--focus-ring-color`/`--accent-bg`, beide
1,00:1 im hellen Thema) als auch das Kachel-Flächenpaar (`--danger-bg-subtle`/`--bg-surface`,
1,01–1,13:1 in beiden Themen) sind bislang **kein** Eintrag in `contrast-check.mjs`, obwohl beide
jetzt gemessen als real gezeichnete, unzureichend unterscheidbare Flächen feststehen. Erwartung: Ein
automatisierter Lauf verhindert, dass beide Befunde nach einer Behebung stillschweigend wieder
einreißen. Fix: nach der jeweiligen Behebung ein Paar mit Mindestwert 3 in `contrast-check.mjs`
aufnehmen (analog zu den bereits laufenden `--danger-border`/`--bg-surface`-Ausnahmen mit Zahl und
Grund, falls eine Behebung diese Hürde bewusst nicht vollständig nimmt).

---

**Nacharbeit.** Alle drei namentlich beauftragten Rechnungen sind bestätigt und tragen jetzt echte
Bildschirmabzüge, Pixelwerte und Kontrastzahlen statt einer Ableitung — B-11 und B-9 sind hoch
eingestuft und sollten vor einer Freigabe der Welle behoben werden (B-11 ist ein SC-2.4.7-Verstoß,
B-9 eine sichtbar falsch plazierte, funktionslos schmale Fläche mit Nebenwirkung auf die
Inhaltshöhe), B-12 ebenso hoch, weil der Kommentar im Quelltext eine Wirkung behauptet, die die
Messung für **beide** genannten Merkmale (nicht nur das Rahmenmerkmal) widerlegt. O-ID ist um eine
Fläche kleiner geworden; die Zahl der verbleibenden Lücken steht oben, nicht verschwiegen.

---

## Annahmen

1. **Fixturen statt laufender Anwendung für B-9, B-11 und B-12.** Die drei Fragen sind reine
   CSS-Layout-/Farbrechnungsfragen, vollständig durch Stylesheet und DOM-Struktur bestimmt; beide
   Größen sind wortgleich aus dem echten Quelltext übernommen (per `grep` geprüft, nicht aus dem
   Gedächtnis). Für O-ID (Confirm-Dialog) lief die Messung dagegen gegen die echte, verdrahtete
   Musterseite, weil dort die React-Zustandslogik (`touchedOnBlur`, `reasonTouched`,
   `submitAttempt`) selbst die Frage ist.
2. **Kein lokaler Dienst für B-9/B-11/B-12 nötig gewesen** — beide Fragen berühren keine Route des
   Dienstes. Für O-ID reichte die Musterseite ohne Dienst (`designsystem.html`), weil
   `ConfirmDialog` dort mit erfundenen Demodaten verdrahtet ist (`showcase/data.ts`).
3. **`{ force: true }`-Klick auf den `aria-disabled`-Absendeknopf des `ConfirmDialog`** — dieselbe,
   von T-207/O-IF bereits benannte Notwendigkeit für diese Knopfart; kein eigener Fund.
4. **Der Umfang von O-ID wurde nach Kosten begrenzt.** Zwei der drei ursprünglich offenen
   O-FR-Sätze und vier bis fünf O-HR-Flächen bleiben ungemessen — als Zahl benannt, nicht als
   Entwarnung, wie im Auftrag verlangt.

## Risiken

1. **B-11 ist ein echter WCAG-2.2-Verstoß (SC 2.4.7, SC 1.4.11) am meistgenutzten Knopftyp der
   Anwendung** (Primärknopf, helles Thema — vermutlich das Standardthema für die meisten
   Benutzer). Jeder Tastaturbenutzer, der im hellen Thema arbeitet, sieht beim Tabulieren durch
   Formulare keinen erkennbaren Fokus auf Primärknöpfen.
2. **B-9 betrifft eine Fläche, die nur sichtbar wird, wenn die Versionsprüfung während der
   Sitzung eine neuere Fassung meldet** — seltener Auslöser, aber wenn er eintritt, ist das
   Ergebnis eine sichtbar fehlplazierte, funktionslos schmale Fläche, die zusätzlich den
   Inhaltsbereich verkleinert.
3. **B-12 schwächt eine Sicherheitszusage aus A-19.4/SC 1.4.1** — die Kachel „Überfällig" ist als
   einzige rot und soll allein dadurch, plus Rahmen und Fläche, ohne Farbwahrnehmung die
   auffälligste bleiben. Nach dieser Messung trägt **keines** der beiden zusätzlichen Merkmale das
   Versprechen.
4. **Kein Vorleseprogramm in dieser Umgebung (T-B09)** — nichts oben behauptet ein Ansage-Erlebnis.
5. **Alle drei Befunde sind ausschließlich in Chromium gemessen** (T-207s Grenze). Windows
   (WebView2) dürfte sich identisch verhalten; Linux (WebKitGTK) und macOS (WKWebView) sind für
   B-11 (Malreihenfolge von `outline`/`box-shadow` ist Sache der Engine) und B-9 (Grid-Auto-
   Placement, spezifiziert, aber ungemessen) ausdrücklich **nicht** geprüft. B-12 ist reine
   Farbrechnung auf deckenden Flächen und dürfte engine-unabhängig sein — Erwartung, keine Messung.

## Offene Fragen

1. **An ui-designer:** Welches dritte, nicht-farbliche Merkmal soll die Kachel „Überfällig" tragen
   (B-12), wenn eine reine Farbkorrektur der `--danger-bg-subtle`-Fläche die 3:1-Hürde gegen
   `--bg-surface` nicht erreicht, ohne den Gesamtton der Kachelreihe zu sprengen?
2. **An ui-designer/frontend-dev:** Welcher konkrete Farbwert soll `--focus-ring-color` bzw.
   `--focus-ring-contrast` im hellen Thema für `.on-solid`-Knöpfe bekommen (B-11), damit beide
   Ringbänder von Füllung **und** Karte unterscheidbar bleiben, ohne die bereits geprüften
   Kombinationen (Gefahrenknopf, dunkles Thema) zu verändern?
3. **An den Orchestrator:** Soll B-9s Fix (`grid-area: update` plus die zugehörige Zeile in
   `grid-template-areas`/`grid-template-rows`) in derselben Welle wie B-11/B-12 gebaut werden, da
   alle drei aus derselben ui-designer-Aufgabe (T-204) stammen?
4. **An den Orchestrator:** Sollen die verbleibenden O-ID-Lücken (zwei O-FR-Sätze, vier bis fünf
   O-HR-Flächen) in einer eigenen, kleineren Folgewelle mit vorbereiteten Testdaten geschlossen
   werden — dieselbe Frage, die T-198 bereits gestellt hatte und die weiterhin offen ist?

## Nächster Schritt

1. **frontend-dev, eine Aufgabe mit drei Teilen (alle aus T-204):** `grid-area: update` für
   `.updatebar` (B-9); neues Farbpaar für `.on-solid`-Fokusringe im hellen Thema (B-11, nach
   ui-designer-Entscheidung zu Frage 2); drittes Formmerkmal für `.stat--danger` (B-12, nach
   ui-designer-Entscheidung zu Frage 1).
2. **visual-qa (ich oder eine Folgeaufgabe):** nach der Behebung dieselben drei Fixturen erneut
   fahren — sie liegen unter `/tmp/t210-qa/*.mjs` und sind in Minuten wiederholbar, sobald ein Ziel
   zum Vergleich feststeht.
3. **visual-qa/e2e-tester:** die verbleibenden O-ID-Lücken (zwei O-FR-Sätze, vier bis fünf
   O-HR-Flächen) in einer eigenen Folgewelle mit vorbereiteten Testdaten schließen.
