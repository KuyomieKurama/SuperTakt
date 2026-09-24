Aufgabe: T-065 — Der Themenschalter in der Kopfleiste verschwindet.

Status: fertig

---

Artefakte:

Neu: keine Datei.

Geändert:

```
apps/web/src/app/App.tsx                         329  Farbmodus-Auswahlfeld, `THEME_OPTIONS`,
                                                      `usePreferences` im `Workspace` und die
                                                      Importe `Select`/`THEME_LABEL`/
                                                      `ThemePreference` entfernt; der Timer steht
                                                      jetzt in `.app__header-timer`
apps/web/src/styles/app.css                     3291  `.app__header-actions` entfernt,
                                                      `.app__header-timer` neu; zwei Token auf
                                                      `.app` (`--app-header-timer-width`,
                                                      `--app-header-timer-min-width`);
                                                      `.gsearch` bekommt eine Untergrenze;
                                                      `.timerbar` darf schrumpfen; Regel für den
                                                      52rem-Umbruch
apps/web/src/screens/SettingsScreen.tsx          777  Hinweis unter „Farbmodus" zeigte auf die
                                                      Kopfleiste — ersetzt; Kopfkommentar von
                                                      `DisplaySettings` nachgezogen
apps/web/src/app/PreferencesContext.tsx          115  nur Kommentar: warum der Zusammenhang
                                                      **bleibt**, obwohl das Bedienelement geht
apps/web/design/DESIGNSYSTEM.md                  752  Abschnitt „Was T-065 geändert hat"; neue
                                                      Regeln 11 und 12; Stand und die veraltete
                                                      Angabe „194 Paare" berichtigt
```

Kein Verhalten in `apps/desktop/**` berührt (dort kommt „theme" nicht vor),
`packages/ui-tokens/tokens.css` unangetastet — es war kein neues Token nötig, die beiden neuen
Werte sind Maße der Hülle und stehen deshalb bei `.app`, wie `--app-header-height`.
`apps/local-api/**`, `packages/**`, `apps/outlook-addin/**`, `tests/e2e/**`, `docs/**`:
unangetastet.

---

Zusammenfassung:

**1 — Weggefallen ist ein Bedienweg, nicht eine Einstellung.**

Aus der Kopfleiste ist das Auswahlfeld „Farbmodus" entfernt. Geblieben und unberührt ist alles,
was die Wahl trägt:

```
apps/web/src/lib/theme.ts            useThemePreference schreibt data-theme an <html>
apps/web/src/app/PreferencesContext   nimmt app_setting.theme entgegen, wendet es an,
                                      schreibt jede Änderung sofort per PATCH /settings
apps/web/src/lib/labels.ts            THEME_LABEL (Systemvorgabe / Hell / Dunkel)
SettingsScreen → DisplaySettings      das eine verbliebene Bedienelement
```

Der `PreferencesProvider` steht weiter in `App.tsx` **außerhalb** von `Workspace`, und das ist
jetzt der einzige Grund, aus dem er dort steht: Er ist die Stelle, die die gespeicherte Wahl beim
Start anwendet. Wäre er mit dem Feld gegangen, stünde Takt nach jedem Neustart wieder auf
Systemvorgabe, gleichgültig was in den Einstellungen steht. Das steht jetzt an drei Stellen als
Kommentar (`App.tsx`, `PreferencesContext.tsx`, `SettingsScreen.tsx`), damit es niemand beim
nächsten Aufräumen für Zubehör hält.

Der Hinweis unter dem Feld in den Einstellungen sagte wörtlich: „Dieselbe Auswahl steht oben
rechts in der Kopfleiste — es ist dieselbe Einstellung." Er wäre ab sofort eine Anweisung ins
Leere gewesen und lautet jetzt: „Die Wahl gilt sofort und bleibt beim nächsten Start erhalten."

**Nachgemessen, gegen den echten Dienst, Chromium, 1280 × 820:**

```
Bereich „Darstellung" → Farbmodus → „Dunkel", nur über die Tastatur
  data-theme am <html>            null → "dark"
  GET /settings → theme           "system" → "dark"
  Auslöser zeigt                  "Dunkel"
Neue Seite, frisch geladen (Neustart)
  data-theme am <html>            "dark"
Zurück auf „Hell"
  data-theme                      "light",  Dienst: "light"
In der Kopfleiste ein Feld „Farbmodus"   0 Treffer
```

**2 — Der frei gewordene Platz geht an den Timer, und zwar vollständig.**

Das entfernte Feld war 150px breit (gemessen, nicht geschätzt). Es einfach wegzunehmen hätte den
Timer 166px weiter nach rechts rutschen lassen und sonst nichts geändert. Stattdessen hat der
Timer jetzt ein eigenes Fach am rechten Rand (`.app__header-timer`) mit **fester** Breite von
35rem.

Der Grund ist ein Fehler, den ich beim Nachmessen des Ausgangszustands gefunden habe und der
vorher nicht benannt war: **Der Start eines Timers zog das Suchfeld um 240 Pixel zusammen.** Der
Timer war ein gewöhnliches Flex-Element; er wächst von 274px (Ruhe) auf 554px (Lauf) und nahm sich
die Differenz vom einzigen Nachbarn, der nachgeben konnte.

Gemessen im Standardfenster (1280 × 820, `tauri.conf.json`), einmal mit dem alten Kopf
nachgestellt, einmal mit dem neuen:

```
                       Suche   Timerleiste   Farbmodus-Feld
ALT   ruhend            512         274             150
ALT   laufend           272         554             150      ← Sprung 240px
NEU   ruhend            432         274               —
NEU   laufend           432         554               —      ← Sprung 0px
```

Das ist nicht nur eine Unruhe im Bild: Die Trefferliste der globalen Suche hängt an der Breite des
Feldes (`.gsearch__panel`, `inset-inline: 0`). Ein Timerstart, ausgelöst aus einer Kanban-Karte
oder per Zeilenaktion, änderte damit mitten im Tippen die Breite der offenen Liste.

Es ist dieselbe Überlegung, die den Kopf seit T-057 eine feste **Höhe** tragen lässt („sonst wächst
der Kopf, sobald der Timer läuft") — nur eine Achse weiter. Sie steht jetzt als Regel 11 im
Designsystem.

**Woher die 35rem kommen.** Die laufende Leiste braucht 554px: 298px für alles außer dem Titel
(Puls, Zeit, „Stoppen", Rahmen, Abstände — gemessen, indem der Titel ausgeblendet wurde) plus die
16rem, auf die `.timerbar__todo` den Titel deckelt. 35rem = 560px decken das mit sechs Pixeln Luft.
Ich hatte zuerst 30rem angesetzt und nachgemessen, dass der Titel dann nach 209 statt 256 Pixeln
endet — die Zahl kommt aus der Messung, nicht aus dem Bauchgefühl.

**Der Preis steht dazu:** Im Standardfenster hat die Suche 432px statt der 512px, die sie im
Ruhezustand hatte. Sie hat sie dafür immer.

**Und ein zweiter Gewinn, der nicht verlangt war:** Der Timer sitzt rechts im Fach. Damit liegt die
rechte Kante der Leiste in beiden Zuständen an derselben Stelle (1264px), und der Knopf, der dort
sitzt, ebenfalls (1255px). „Zeit erfassen" und „Stoppen" lösen einander an derselben Stelle ab,
statt über den halben Kopf zu springen — der Knopf, den man drückt, wandert nicht mehr.

**3 — Was bei schmalen Fenstern passiert.**

Eine feste Breite braucht eine Untergrenze, sonst schiebt sie im kleinsten zugelassenen Fenster
(960px, `tauri.conf.json`) die Suche aus dem Bild. Beide Grenzen sind ausdrücklich **feste Längen**
und nichts Inhaltsabhängiges: Eine inhaltsabhängige Untergrenze hätte die Breite der Suche doch
wieder an den Zustand des Timers gehängt, nur eine Ebene später und schwerer zu finden.

```
--app-header-timer-min-width  19rem = 304px   knapp über den 298px, die Zeit und
                                              „Stoppen" ohne jeden Titel brauchen
.gsearch  min-width           14rem = 224px   rund zwanzig Zeichen
```

Gemessen, laufender Timer, alles ohne Überlauf des Dokuments und mit sichtbarem Stoppknopf:

```
1280px   Suche 432   Fach 560   Leiste 554
 960px   Suche 224   Fach 448   Leiste 448      Suche in beiden Zuständen gleich
 832px   Suche 242   Fach 542   Leiste 542      unterhalb des 52rem-Umbruchs
 800px   Suche 232   Fach 520   Leiste 520
```

Unterhalb von 52rem gibt das Fach seine zugeteilte Breite auf und wird so groß wie sein Inhalt.
Dort legt sich die Seitenleiste ohnehin als Band über den Kopf, beide Elemente stehen am Anschlag,
und eine Zuteilung wäre eine Zuteilung von nichts. Das steht als Regel in der Media-Query.

**4 — Tastatur und Fokus.**

Der Kopf hat einen Bedienpunkt weniger; der Weg dahin ist nachgemessen und vollständig. Ohne
laufenden Timer:

```
1.  Sprungmarke „Zum Inhalt springen"     Fokusring 2px solid
2.  Marke „Takt"                          2px solid
3.–10.  acht Navigationspunkte            2px solid
11. Suchfeld                              eigener :focus-within-Ring am Feldrahmen
12. „Zeit erfassen" in der Timerleiste    2px solid
13. weiter in den Inhalt
```

Mit laufendem Timer stehen zwischen Suche und Inhalt der Verweis auf das laufende Todo und
„Stoppen" — beide erreichbar, beide mit sichtbarem Ring. Der Farbmodus in den Einstellungen ist
rein über die Tastatur bedienbar (Fokus, Enter, Pfeil ab, Enter); genau so ist die Messung in
Punkt 1 entstanden, ohne einen einzigen Klick.

**5 — Zustände, nicht nur der Normalfall.**

Der Kopf zeigt weiterhin alle drei Zustände des Timers: Ladezustand („Timer wird geladen …",
154px), Ruhe (274px), Lauf (554px). Alle drei enden an derselben rechten Kante. Der Fehlerfall des
Farbmodus ist unverändert vorhanden und liegt jetzt nur noch an einer Stelle: Schlägt
`PATCH /settings` fehl, wird die Anzeige auf den vorigen Wert zurückgesetzt und eine Meldung
gezeigt („Der Farbmodus wurde nicht gespeichert"); während des Schreibens ist das Feld gesperrt
(`themeSaving`).

---

Prüfstand:

```
pnpm typecheck                                     fehlerfrei, alle acht Pakete
pnpm contrast                                      0 von 376 Paaren durchgefallen
pnpm build                                         fehlerfrei
playwright -c tests/e2e/playwright.config.ts       33 bestanden
playwright -c tests/e2e/playwright.web-build...    4 bestanden
```

Im Browser nachgesehen, hell und dunkel, in beiden Timerzuständen und bei 1280/960/832/800px.
Kein `any` hinzugekommen — es ist ausschließlich Code entfernt worden.

---

Hinweis für den e2e-tester:

**Es gibt genau eine betroffene Stelle, und sie ist ein Kommentar, kein Locator.**

`tests/e2e/support/nav.ts` spricht den Themenschalter **nicht** an. Ich habe die Datei gelesen: Sie
enthält nur `page.goto()`-Hüllen. `gotoSettings(page, 'darstellung')` bleibt uneingeschränkt gültig
— der Bereich „Darstellung" ist unverändert der erste und trägt weiterhin dieselbe Adresse.

Betroffen ist:

```
tests/e2e/tag-input.spec.ts:310–316   Kommentar in TAGINPUT-05
```

Wörtlich steht dort: *„Die Filterleiste dahinter (S-02, ‚Statusspalte'/‚Pool') und ‚Farbmodus' in
der Kopfleiste sind ebenfalls Auswahlfelder und bleiben hinter dem Dialog im Baum stehen."* Der
zweite Halbsatz stimmt nicht mehr. Die Begründung des Kommentars bleibt trotzdem richtig — die
Filterleiste allein liefert schon mehr als ein `.select__content`, deshalb ist die Eindeutigkeit
über `aria-controls` weiterhin nötig und der Testfall selbst unverändert gültig.

**Der Fall läuft grün, unverändert.** Ich habe ihn nach der Änderung ausgeführt: `tag-input.spec.ts`
5 von 5 bestanden, die gesamte Datei-Reihe 33 von 33, dazu `playwright.web-build.config.ts` 4 von 4.
Es ist also nichts nachzuziehen, was den Lauf grün macht — nur ein Satz, der sonst das nächste Mal
in die Irre führt.

**Was einen neuen Fall lohnen würde** (Vorschlag, `tests/e2e/**` gehört dir): Der Nachweis, dass die
Kopfleiste kein Farbmodus-Feld mehr hat und die Einstellung trotzdem einen Neustart übersteht, ist
in zwei Behauptungen zu haben:

```ts
await gotoDashboard(page);
await expect(page.locator('.app__header').getByRole('combobox', { name: 'Farbmodus' })).toHaveCount(0);

await gotoSettings(page, 'darstellung');
await page.getByRole('combobox', { name: 'Farbmodus' }).click();
await page.getByRole('option', { name: 'Dunkel' }).click();
await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
await page.reload();                                   // steht für den Neustart
await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
```

`getByRole('combobox', { name: 'Farbmodus' })` ist ab jetzt **eindeutig** — vorher hätte es auf der
Einstellungsseite zwei Treffer gegeben und wäre im strengen Modus gescheitert. Am Ende bitte wieder
auf „Systemvorgabe" stellen: Der Wert liegt in `app_setting.theme` und überlebt den Testlauf.

---

Nächster Schritt:

**1 — Die offene Frage 3 aus T-057 ist damit beantwortet.** Sie lautete: „Bleibt der Farbmodus
doppelt bedienbar? … Wer nur den geordneten Ort will, sagt es, dann fällt das Feld aus dem Kopf —
der Platz dort wäre für einen zweiten schnellen Griff frei (naheliegend: der Timer, der ohnehin
schon da ist)." Genau das ist passiert, und der Platz ist dorthin gegangen.

**2 — Die Kopfleiste trägt jetzt zwei Bereiche mit fester Rolle**, Suche links, Timer rechts. Wenn
dort später etwas Drittes hinzukommt (naheliegend wäre ein Konto- oder Hilfebereich), ist die Frage
nicht „wohin damit", sondern „von welchem der beiden Fächer nimmt es seine Breite". Ich würde in
dem Fall zuerst die 32rem-Obergrenze der Suche prüfen; sie ist heute die einzige Zahl im Kopf, die
nicht aus einer Messung stammt.

**3 — Die rechte Kante des Kopfes und die des Inhalts liegen 18px auseinander** (Kopf 1264,
Inhaltsbereich 1246 bei 1280px Fensterbreite). Ursache: Der Kopf hat `padding-inline: --space-4`,
der Inhalt `--space-6` plus die dauerhaft reservierte Rinne der Bildlaufleiste. Das war vorher
genauso — mit dem Farbmodus-Feld als rechtestem Element — und ist mir erst jetzt aufgefallen, weil
die Timerleiste dort eine deutlich sichtbarere Kante bildet. Ich habe es **nicht** geändert: Es
verschiebt auch die linke Kante der Suche und gehört in eine Aufgabe, die den Kopf als Ganzes
ausrichtet, nicht in diese.

---

Offene Fragen:

**1 — Der Prototyp liegt weiterhin nicht vor.** `docs/prototype/takt-ui-konzept.html` gibt es nicht,
`docs/**` gehört mir nicht. Die Struktur des Kopfes samt Maßen und Begründung steht an einer Stelle
(`styles/app.css` bei `.app__header-timer`) und ist von dort in einem Zug gegen den Prototyp
abzugleichen, sobald er da ist. Im Designsystem steht die Kurzfassung als Regel 11.

**2 — Die Zeilendichte ist weiterhin nicht dauerhaft** (offene Frage 2 aus T-057, unverändert). Sie
steht im selben Bereich „Darstellung" direkt unter dem Farbmodus und gilt bis zum Beenden, weil
`AppSettings` keine Spalte dafür führt. Jetzt, wo der Farbmodus dort allein und ohne zweiten
Bedienweg steht, fällt der Unterschied stärker auf: zwei Felder nebeneinander, eines dauerhaft,
eines nicht. Der Hinweistext sagt es weiterhin; eine Spalte `density` in `app_setting` wäre
domain-dev, nicht ich.
