# T-284 — Der Hochlauf prüft die Gestaltung gegen eine Form statt gegen die Liste

Aufgabe: T-284 — Der Hochlauf prüft die Gestaltung gegen eine Form statt gegen die Liste
Status: fertig — braucht Review

## Artefakte

| Datei | Art |
|---|---|
| `apps/web/public/startup-appearance.js` | geändert — Listenprüfung statt Formprüfung, Rückfall auf `classic` |
| `apps/web/test/public/startupAppearance.test.ts` | geändert — 9 → 64 Prüffälle, Wirkung statt Regel gemessen |

Sonst nichts. `apps/web/src/styles/app.css` und `components.css` stehen im Arbeitsbaum geändert —
das ist T-281/T-283, nicht ich.

---

## 1. Der Befund, gemessen

Vor der Behebung, `apps/web/public/startup-appearance.js` mit einem Altwert im Zwischenspeicher
(Node, `vm`, derselbe Rahmen wie der Prüffall):

```
clear                {"startupTheme":"system","designTheme":"clear","density":"comfortable"}
zzz-not-a-theme      {"startupTheme":"system","designTheme":"zzz-not-a-theme","density":"comfortable"}
```

Und im echten Browser (Chromium über `vite preview` auf 4173, `localStorage` vor dem ersten Bild
gesetzt, `getComputedStyle(document.documentElement)`):

```
alter Stand   {"attribute":"clear",   "sidebarWidth":"13.5rem", "text2xs":".75rem"}
mit Fix       {"attribute":"classic", "sidebarWidth":"15rem",   "text2xs":".6875rem"}
```

Das sind zeichengleich die beiden Werte, die der ui-designer genannt hat. Die Zusage aus A-21
(„die alte Auswahl `clear` wird klassisch dargestellt") war für die Dauer des Hochlaufs gebrochen,
und zwar an den Maßen, nicht nur am Attribut.

Wer den Wert setzt, sind genau zwei Stellen im ganzen Bestand:

- `apps/web/src/features/settings/theme.ts:78` — `themePreset(designTheme).value`, bildet seit je
  jeden unbekannten Wert auf `classic` ab.
- `apps/web/public/startup-appearance.js` — bildete gar nichts ab.

Die Oberfläche hielt die Zusage also bereits; nur der Hochlauf lief daran vorbei.

## 2. Woher die Liste kommt — und warum es doch eine Abschrift ist

**Es ist eine Abschrift, und ich sage es hin.** Die Datei liegt in `apps/web/public/`, wird von
Vite zeichengleich kopiert (nachgemessen: `diff dist/startup-appearance.js public/…` ist leer) und
läuft vor dem ersten Bild ohne Bündler (A-21.4, T-060). Sie kann `THEME_PRESETS` nicht importieren.

Die drei Wege, die Liste ohne Abschrift dorthin zu bringen, habe ich verworfen:

1. **Erzeugen beim Bau** (Vite-Plugin, das die Datei aus `DESIGN_THEMES` schreibt). Das zieht den
   Bündler in genau den Pfad, dessen Zusage lautet, ohne Bündler zu laufen — und es macht die
   einzige Datei, die man im Auslieferungsbündel noch mit einem Texteditor prüfen kann, zu einem
   Erzeugnis. Der Preis ist höher als der Nutzen.
2. **Den aufgelösten Wert im Zwischenspeicher ablegen.** `cacheAppearance` tut das bereits
   (`designTheme: preset.value`) — löst aber nichts: Der Angriffs- und Alterungsfall ist gerade
   der Eintrag, der *nicht* von dieser Funktion stammt.
3. **Gar nicht prüfen und auf die Oberfläche warten.** Das ist der heutige Fehler.

Gewählt: **Abschrift, aber eine, die nicht still altern kann.** Die Liste steht ausgeschrieben in
der Datei, mit Verweis auf ihre führende Quelle, und `startupAppearance.test.ts` führt den Hochlauf
**einmal je Eintrag** aus `THEME_PRESETS` **und** einmal je Eintrag aus `DESIGN_THEMES` aus. Eine
Gestaltung, die dort hinzukommt und hier fehlt, landet auf `classic` statt auf sich selbst — und
der Lauf wird rot. Gegenprobe gemacht (Abschnitt 5).

Das ist bewusst **kein** Prüffall, der die Liste im Quelltext sucht. Er führt die Datei aus.

## 3. Was mit einem unbekannten Wert geschieht — und warum nicht wie bei den Nachbarn

**Entschieden: abbilden auf `classic`, nicht fallen lassen. Für jeden unbekannten Wert, nicht nur
für `clear`.** Drei Gründe, der dritte ist der tragende:

1. Die Oberfläche tut es bereits — `themePreset(value) ?? THEME_PRESETS[0]` und
   `startupAppearance()` (`THEME_PRESETS.find(…)?.value ?? 'classic'`). Der Hochlauf malt damit
   das, was das Bündel einen Augenblick später malt. Fallenlassen hieße: Hochlauf malt Vorgabe,
   Bündel malt Vorgabe — dasselbe Bild, aber auf dem Weg dorthin ginge Farbmodus und Zeilendichte
   verloren, denn das heutige `return` wirft **den ganzen** Zwischenspeicher weg. Ein veralteter
   Gestaltungsname hätte also ein Hell-Dunkel-Zucken zur Folge gehabt.
2. `clear` ist keine Verfälschung, sondern ein gültiger, zurückgezogener Wert. Ihn wie einen
   Zerstörungsschaden zu behandeln wäre falsch.
3. Die drei Nachbarn haben keinen benannten Rückfall — die Spezifikation nennt für `theme`,
   `mode` und `density` keinen. Für die Gestaltung nennt sie einen, und zwar namentlich. Deshalb
   ist die Ungleichbehandlung kein Bruch der Symmetrie, sondern ihr Grund.

**Mitgezogen:** Fällt die Gestaltung zurück, fällt der Farbmodus mit ihr auf `auto`. `mode` ist im
Zwischenspeicher die Betriebsart *der gespeicherten Gestaltung* (`cacheAppearance` schreibt
`preset.mode`); bliebe sie stehen, malte der Hochlauf das erzwungene Dunkel einer Gestaltung, die
gleich nicht mehr gilt — und das Bild kippte beim ersten Bündelbild zurück. `classic` ist `auto`.

Ein Nichtzeichenketten-Wert (`null`, `42`, ein Objekt) fällt über dieselbe Prüfung; die frühere
`typeof`-Zeile ist damit entbehrlich geworden. **Sicherheitlich ist die neue Form enger als die
alte:** in `data-design-theme` landet nur noch einer von 19 festen Werten, nie mehr eine Zeichenkette
aus fremder Hand.

## 4. Prüffälle — die Wirkung, nicht die Regel

64 Fälle in `apps/web/test/public/startupAppearance.test.ts`, drei Gruppen:

- **Rückfall** — `clear`, unbekannt, leer, versal, zu lang, und vier Nichtzeichenketten; dazu
  ausdrücklich, daß Farbmodus und Zeilendichte *erhalten* bleiben und der erzwungene Modus mitfällt.
- **Abschrift im Gleichschritt** — je ein Lauf pro `THEME_PRESETS`- und pro `DESIGN_THEMES`-Eintrag.
- **Die Maße** — aus dem Attribut, das der Hochlauf setzt, werden `--sidebar-width` und `--text-2xs`
  aus dem echten `packages/ui-tokens/tokens.css` aufgelöst (Grundblock `:root`, dann der
  Gestaltungsblock, letzte Angabe gewinnt) und gegen die Werte von `classic` geprüft. Davor steht
  ein Fixture-Prüffall, der bestätigt, daß `:root[data-design-theme="clear"]` dort **noch** eigene
  Maße führt — ohne ihn wäre die Messung darunter auch dann grün, wenn es gar nichts mehr zu
  verwechseln gäbe.

## 5. Gegenproben

| Versuch | Ergebnis |
|---|---|
| Alten Hochlauf zurückgelegt (`git stash`), Lauf wiederholt | **14 von 64 rot**, darunter beide Maß-Prüffälle |
| Einen Eintrag (`velvet`) aus der Abschrift entfernt | **2 rot** — je einmal aus `THEME_PRESETS` und aus `DESIGN_THEMES` |
| Browser, alter Stand, Altwert `clear` | `13.5rem` / `.75rem` — der Fehler, sichtbar |
| Browser, neuer Stand, Altwert `clear` | `15rem` / `.6875rem` — klassisch |

Der Baum steht danach wieder auf dem behobenen Stand (`diff` gegen die Sicherungskopie leer).

## 6. Tore

| Lauf | Ergebnis | gegen die Vorgabe |
|---|---|---|
| `pnpm typecheck` | grün | — |
| `pnpm contrast` | grün, **522 Paare**, 11/11 Gegenproben | unverändert |
| `proof:foreign` | 21/0, 3 Gegenproben | unverändert |
| `proof:surface` | 27/0, 16 Gegenproben | unverändert |
| `proof:locked` | 9/0, 19 Gegenproben | unverändert |
| `test:coverage` | **90 Dateien / 1696 / 3 übersprungen** | Vorgabe 90 / 1641 / 3 |
| `pnpm --filter @takt/web build` | grün, `dist` == `public` zeichengleich | — |

**Die bewegte Zahl, vorgerechnet:** 1641 → 1696, also **+55**. Die Datei hatte 9 Fälle (3 einzelne,
ein `it.each` mit 5, einer für gesperrten Speicher) und hat jetzt 64. 64 − 9 = 55. Keine andere
Datei hat sich bewegt, die Dateizahl bleibt 90, die 3 übersprungenen sind dieselben.

`proof:startup` gibt es nicht. `proof:engines` braucht WebKitGTK und läuft auf diesem Rechner nicht.

**Ein Hinweis zur Meßhygiene:** Ein Lauf von `test:coverage` schlug einmal mit
`EADDRINUSE 127.0.0.1:17844` in `outlook-certificate.windows.test.ts` fehl — ein Nachläufer meines
eigenen vorigen Laufs, kein Prüffehler. Der saubere Wiederholungslauf ist oben eingetragen. Der
`vite preview` auf 4173 ist beendet, kein Prozess hört mehr auf 4173/5173/17843/17844.

## 7. Annahmen

1. Unbekannt → `classic` gilt für **jeden** unbekannten Wert, nicht nur für `clear` (Begründung
   oben). Ob das eine Entscheidungsnummer verdient, gehört dem Orchestrator.
2. Der erzwungene Farbmodus fällt mit der Gestaltung zurück. Das war nicht beauftragt, ist aber
   derselbe Fehler an derselben Stelle.
3. Ich habe `apps/web/test/public/startupAppearance.test.ts` geschrieben, obwohl `apps/*/test/**`
   laut `CLAUDE.md` unit-tester gehört. Der Auftrag verlangt unter Punkt 3 und 4 ausdrücklich
   Prüffall und Gegenprobe von mir. **Bitte gegenzeichnen lassen oder die Hoheit klären** — mir
   war kein gleichzeitiger Lauf in dieser Datei bekannt.

## 8. Risiken und Befunde für andere

**B-1 — Nach dieser Behebung ist die `clear`-Gestaltung toter Quelltext, und sie widerspricht der
Zusage weiter, solange sie steht.** Es gibt im ganzen Bestand nur zwei Schreiber von
`data-design-theme`, und beide bilden `clear` jetzt auf `classic` ab. Damit ist unerreichbar:

- `apps/web/src/styles/app.css:4631–4733` — rund 100 Zeilen `:root[data-design-theme="clear"]`
- `packages/ui-tokens/tokens.css:655–659` — `--sidebar-width: 13.5rem`, `--text-2xs: 0.75rem`

Ich habe **nichts davon gestrichen**, aus drei Gründen: `packages/ui-tokens` liegt außerhalb der
Grenzen dieses Auftrags (die Hoheit habe ich, die Erlaubnis nicht), eine Hälfte zu streichen und die
andere stehenzulassen wäre schlimmer als beides stehenzulassen, und e2e-tester baut gerade einen
Pixelprüffall über `app.css`. **Vorschlag: ein eigener Auftrag, beide Dateien in einem Zug** — und
dann fällt auch der Fixture-Prüffall in Abschnitt 4 mit, der genau diese Zeilen als „noch
vorhanden" festhält. Er ist so geschrieben, daß er in dem Moment rot wird und die Aufmerksamkeit
auf sich zieht, statt still zu verschwinden.

**B-2 — Die 308-gegen-324-px-Spur aus T-281.** `apps/web/src/styles/components.css:1109` erklärt die
zweite Schwelle heute mit „Gestaltungen mit größeren Marken (`--text-2xs: 0.75rem`)". Die einzige
Gestaltung mit diesem Wert ist `clear`. Ist B-1 erledigt, ist diese Begründung gegenstandslos und
der Satz gehört mit. Ich habe ihn nicht angefaßt, weil die Datei gerade in T-281 in Arbeit ist.

**B-3 — `CLAUDE.md` ist nicht berührt.** Die Zusage „die alte Auswahl `clear` wird klassisch
dargestellt" stimmt nach dieser Behebung erstmals auch für den Hochlauf. Kein Satz dort muß sich
ändern. Sollte Annahme 1 eine Entscheidungsnummer bekommen, ist das dein Eintrag, nicht meiner.

## 9. Offene Fragen

1. Hoheit an `apps/web/test/**` für diesen Fall (Annahme 3) — gegenzeichnen oder abnehmen lassen?
2. B-1: eigener Auftrag zum Streichen der toten `clear`-Gestaltung, über `apps/web` **und**
   `packages/ui-tokens` in einem Zug?
3. Verdient „unbekannt → klassisch" eine Entscheidung (E-xxx), oder trägt A-21 das schon?

## 10. Nächster Schritt

`visual-qa` über den Hochlauf mit Altwert: `localStorage.setItem('supertakt.appearance.v1',
'{"version":1,"theme":"system","designTheme":"clear","mode":"auto","density":"comfortable"}')` vor
dem ersten Bild, dann Seitenleiste und Versalien-Etiketten gegen die klassische Gestaltung. Die
Zahlen, gegen die geprüft wird, stehen in Abschnitt 1. Danach B-1 als eigener Auftrag.
