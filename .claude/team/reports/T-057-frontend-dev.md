Aufgabe: T-057 — Layout stabilisieren, Einstellungen strukturieren, Musterseite aus der Navigation nehmen.

Status: fertig

---

Artefakte:

Neu:

```
apps/web/designsystem.html                        28  Einstiegspunkt der Musterseite
apps/web/src/designsystem.tsx                     59  hängt `Showcase` an `#root`; hier steht die
                                                      Begründung, warum ein eigener Einstieg und
                                                      keine Route
apps/web/scripts/build-designsystem.mjs           47  baut Anwendung **und** Musterseite; setzt
                                                      `TAKT_DESIGNSYSTEM=1` plattformunabhängig
apps/web/src/app/PreferencesContext.tsx          104  Farbmodus und Zeilendichte an einer Stelle,
                                                      für Kopfleiste und Einstellungen
```

Geändert:

```
apps/web/src/styles/base.css                     283  `html, body, #root { height: 100% }` statt
                                                      `min-height: 100dvh` auf `body`;
                                                      Sprungmarke auf `position: fixed`
apps/web/src/styles/app.css                     3170  `.app` ist ein Raster über die Fensterhöhe,
                                                      `.app__main` der einzige scrollende Kasten
                                                      mit `scrollbar-gutter: stable`;
                                                      `.screen--wide` entfernt; `.settings-*` neu;
                                                      `.designsystem-frame` und `.nav__foot`
                                                      entfernt; 52rem-Umbruch auf das Raster
                                                      umgeschrieben
apps/web/src/app/App.tsx                         332  Seitenleiste, Kopf und Inhalt sind
                                                      Geschwister im Raster; Marke in die
                                                      Seitenleiste; `designsystem`-Zweig entfernt;
                                                      `PreferencesProvider` eingehängt
apps/web/src/app/Navigation.tsx                  103  Punkt „Designsystem" entfernt
apps/web/src/app/router.ts                       129  Route `designsystem` entfernt
apps/web/src/screens/SettingsScreen.tsx          782  fünf Bereiche mit Leiste und eigener Adresse;
                                                      neuer Bereich „Darstellung"; Farbmodus aus
                                                      der Exportkarte herausgelöst
apps/web/src/screens/BoardScreen.tsx             497  `screen--wide` entfernt
apps/web/src/main.tsx                             29  lädt `showcase.css` nicht mehr
apps/web/src/styles/showcase.css                 417  `.app` → `.showcase` (Namenskollision)
apps/web/src/showcase/Showcase.tsx               152  Wurzelklasse `.showcase`
apps/web/vite.config.ts                           72  zweiter Einstiegspunkt nur bei
                                                      `TAKT_DESIGNSYSTEM=1`
apps/web/package.json                             36  `build:designsystem`; Beschreibung
```

`packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `tests/e2e/**`, `docs/**`,
`apps/web/test/**`, `apps/desktop/**`: unangetastet. `Primitives.tsx` und die Tag-Eingabe:
unangetastet — die Architekturentscheidung zu den Auswahlfeldern steht noch aus, und das Layout hat
sie nicht verlangt.

---

Zusammenfassung:

**1 — Das Springen hatte drei Ursachen. Alle drei sind gemessen, nicht vermutet.**

Zuerst der Nachweis, dass es das Problem gibt. Gefahren wurde die echte Anwendung gegen den echten
Dienst, Chromium mit klassischen Bildlaufleisten (`--hide-scrollbars` ausdrücklich abgeschaltet —
sonst misst man ein Fenster, das der Auftraggeber nie sieht). Bestand: acht Tags, 40 Todos.
Gemessen wurde je Ansicht die Breite des Inhaltsbereichs, seine linke Kante, die Breite der
`.screen`-Fläche und die Bildlaufleiste des Fensters.

*Vorher, 1440 × 820:*

```
Dashboard      main.clientW=1190  main.clientH= 922  main.scrollH= 922  docSB=10
Todos          main.clientW=1190  main.clientH=2885  main.scrollH=2885  docSB=10
Kanban         main.clientW=1190  main.clientH=5857  main.scrollH=5857  docSB=10
Zeiterfassung  main.clientW=1190  main.clientH=1984  main.scrollH=1984  docSB=10
Buchungen      main.clientW=1200  main.clientH= 767  main.scrollH= 767  docSB= 0
Export         main.clientW=1190  main.clientH= 940  main.scrollH= 940  docSB=10
Vorlagen       main.clientW=1190  main.clientH=1693  main.scrollH=1693  docSB=10
Protokoll      main.clientW=1190  main.clientH= 924  main.scrollH= 924  docSB=10
Tags           main.clientW=1190  main.clientH=1003  main.scrollH=1003  docSB=10
Einstellungen  main.clientW=1190  main.clientH=2379  main.scrollH=2379  docSB=10

eindeutige main.clientWidth: 1190, 1200
eindeutige .screen-Breite bei 1920px Fensterbreite: 1440, 1622
```

**Ursache 1 — der Rahmen maß sich am Inhalt.** `main.clientHeight` ist auf **jeder** Ansicht gleich
`main.scrollHeight`: Der Kasten war so hoch wie sein Inhalt, auf dem Kanban 5857 Pixel in einem
820 Pixel hohen Fenster. Gescrollt hat also das Dokument, nicht der Inhaltsbereich. Der Grund stand
in zwei Zeilen: `body { min-height: 100dvh }` und `.app { min-height: 100dvh }`. `min-height` ist
eine Untergrenze und keine Größe — der Kasten durfte wachsen, und er tat es.

**Ursache 2 — die Bildlaufleiste des Fensters verschob alles.** `docSB` ist die Breite der
Dokumentbildlaufleiste, 10 Pixel. Sie erscheint genau auf den Ansichten mit langem Inhalt, und
`main.clientWidth` fällt dort von 1200 auf 1190. Das ist der Sprung, den der Auftraggeber sieht:
Er wechselt von „Buchungen" (leer, keine Leiste) auf „Todos" (lang, Leiste) und der Inhalt rückt um
zehn Pixel.

**Ursache 3 — eine Ansicht setzte ihre eigene Breite.** `.screen` hat `max-width: 90rem`, das
Kanban trug `.screen--wide` mit `max-width: none`. Bei 1920 Pixel Fensterbreite: 1440 Pixel auf
acht Ansichten, 1622 auf dem Kanban — 182 Pixel Unterschied allein durch die Wahl des Reiters.

**2 — Was jetzt dasteht.**

Ein Raster, so hoch wie das Fenster, in der Form der Zeichnung:

```
.app  grid-template-areas:  "notice notice"     Meldungen der Hülle, über beide Spalten
                            "side   head"       Seitenleiste über die volle Höhe, Kopf rechts
                            "side   main"       darunter der scrollbare Inhalt
      grid-template-rows:   auto auto minmax(0, 1fr)
      height: 100%          keine Untergrenze — die Fensterhöhe
      overflow: hidden      nichts verlässt die Hülle
```

Die Marke ist damit in die Seitenleiste gewandert; sie steht oben links, wo die Seitenleiste
beginnt, und der Kopf beginnt rechts von ihr. Seitenleiste, Kopf und Inhalt sind **Geschwister** und
liegen nicht mehr ineinander (früher lag `.app__body` um Seitenleiste und Inhalt) — ein Bereich,
der einen anderen umschließt, kann ihn verschieben.

Vier Einzelheiten, die das Raster tragen:

* `minmax(0, 1fr)` in Spalte und Zeile. Eine Rasterspur ist von Haus aus `auto`, und `auto` heißt
  „mindestens so breit wie der Inhalt". Ohne die Null als Untergrenze drückt ein Kanban mit zwölf
  Spalten das Raster auseinander und die Seitenleiste wandert.
* `scrollbar-gutter: stable` auf `.app__main`. Der Platz für die Bildlaufleiste ist immer
  reserviert. Das ist die Behebung von Ursache 2 — und dieselbe Regel steht auf der Seitenleiste,
  weil sie bei niedrigem Fenster genauso schmal würde.
* Feste Kopfhöhe, aus Tokens gerechnet: `calc(var(--control-height-lg) + 2 * var(--space-2))`.
  Sonst wächst der Kopf, sobald der Timer läuft, und der Inhalt springt nach unten.
* `.screen--wide` ist ersatzlos weg. Das Kanban braucht die Ausnahme nicht: `.kboard` scrollt
  waagerecht, sobald mehr Spalten da sind, als hineinpassen.

**3 — Eine vierte Ursache, die erst beim Nachmessen sichtbar wurde.**

Nach dem Umbau scrollte das Dokument auf zwei Ansichten weiter: Todo-Liste (`scrollHeight` 2876 bei
820 Fensterhöhe) und Vorlagen (1116). Das hätte nicht sein dürfen — `.app` hat `overflow: hidden`.
Gesucht, nicht geraten: ein Durchlauf über alle Elemente mit einem Unterrand unterhalb des Fensters
nannte die Schuldigen.

Es war `span.visually-hidden` — die Hilfsklasse für Bildschirmleser. Sie ist `position: absolute`.
Ein absolut positioniertes Element **ohne positionierten Vorfahren** bezieht sich auf den
Anfangsblock, also auf das Fenster. Es liegt damit außerhalb jedes `overflow: hidden` auf dem Weg
dorthin — `.app` konnte es gar nicht beschneiden — und trägt zum Bildlaufbereich des *Dokuments*
bei. Eine Klasse, die dafür da ist, unsichtbar zu sein, erzeugte die Fensterbildlaufleiste.

Behoben mit `position: relative` auf `.app`, `.app__sidebar` und `.app__main`. Damit hat jeder
absolut positionierte Nachfahre wieder einen umschließenden Block innerhalb der Hülle — nicht nur
`.visually-hidden`, sondern jedes künftige `position: absolute` im Inhalt. Feste Positionierung
(`.scrim` der Sperrmeldung, `.toast-layer`, `.menu--context`) bleibt unberührt; nachgemessen: die
Sperrschicht deckt weiterhin 1440 × 820 bei einem Fenster von 1440 × 820.

**4 — Fünf Bereiche statt einer langen Liste.**

Die Einstellungen waren fünf Karten untereinander, 2379 Pixel in einem 820 Pixel hohen Fenster. Wer
den Farbmodus suchte, scrollte an allem vorbei, was er nicht suchte.

```
Darstellung      Farbmodus, Zeilendichte
Export           Zielordner, aktive Vorlage, Rundung
Standard-Tags    die Tags an jedem neuen Todo
Outlook-Add-in   das Token
Arbeitsplatz     Abrechnungsname, Ablageort, Sicherheitsmeldungen
```

„Darstellung" steht vorn, weil der Auftraggeber sie ausdrücklich als eigenen Bereich verlangt hat
und weil sie der einzige Bereich ist, der sofort wirkt. Dann was Geld betrifft, dann was jedes neue
Todo betrifft, dann die Nachbarsysteme, zuletzt die Auskünfte, die man nachsieht statt einzustellen.

Die Leiste ist eine `<nav>` mit Verweisen und keine ARIA-Registerkarte. Jeder Bereich hat eine
eigene Adresse (`#/einstellungen?bereich=darstellung`) — also Zurück, Neuladen an Ort und Stelle und
einen Verweis, den man weitergeben kann. Registerkarten hätten das alles nicht. `aria-current="page"`
sagt, wo man ist; dieselbe Bauweise wie bei den drei Bereichen des Exports. Ein unbekannter Wert in
`bereich` landet auf dem ersten Bereich statt auf einer Fehlerseite.

**Der Farbmodus ist dabei aus der Exportkarte herausgelöst worden**, und das hat einen Fehler
mitgenommen, der vorher niemandem aufgefallen war: Der Schalter in der Kopfleiste hielt seinen
**eigenen** Zustand und schrieb nichts fort. Oben umgestellt, unten in den Einstellungen der alte
Wert, nach dem Neustart alles wieder von vorn. Beide bedienen jetzt dasselbe
(`app/PreferencesContext.tsx`), und der Farbmodus wird sofort geschrieben — ohne Speichern-Knopf,
weil ein Knopf, der bestätigt, was man schon sieht, eine Frage stellt, die nicht mehr offen ist.
Gemessen: in der Kopfleiste auf „Dunkel", Seite neu geladen, `data-theme="dark"`, Feld im Bereich
„Darstellung" auf „dark". Und gegengeprüft, dass ein Speichern im Bereich „Export" den Farbmodus
nicht mehr überschreibt (`PATCH /settings` ohne `theme`).

**5 — Die Musterseite: aus der Navigation, aus dem Router, nicht aus dem Bestand.**

Der Zusatz des Auftraggebers — „Der Zugriff soll ausschließlich über die API möglich sein" — ist so
nicht umsetzbar, und das steht als Begründung in `src/designsystem.tsx`: Die Musterseite ist
Oberfläche und kein Datenbestand. Der lokale Dienst kennt Todos, Zeiten und Einstellungen; eine
React-Seite gehört zu keinem dieser Begriffe.

Die **Absicht** dahinter ist erfüllbar und lautet: im Produkt unsichtbar, für Entwicklung und
Abnahme erreichbar. Umgesetzt als zweiter Einstiegspunkt:

* Aus der Anwendung führt kein Weg mehr hierher. Navigationspunkt weg, `RouteName` weg,
  `SEGMENT`-Eintrag weg, `parseRoute`-Zweig weg, der Knopf „Designsystem ansehen" in `NoShellNotice`
  weg. Gemessen: `#/designsystem` landet auf dem Dashboard, die Navigation hat acht Punkte, kein
  Eintrag mit dem Namen.
* Im Entwicklungsbetrieb liegt sie unter `http://127.0.0.1:5173/designsystem.html` (`pnpm dev`).
  Vite liefert jede HTML-Datei im Wurzelverzeichnis aus; dafür braucht es keine Konfiguration.
* **Im ausgelieferten Bündel entsteht sie nicht.** `vite.config.ts` nimmt die zweite Eingabe nur bei
  `TAKT_DESIGNSYSTEM=1` auf. Gemessen: `pnpm --filter @takt/web build` erzeugt `dist/index.html`
  und sonst nichts, und `grep` findet die Musterseite im Anwendungsbündel nicht.
  `pnpm --filter @takt/web build:designsystem` erzeugt beide, für die Abnahme.

Warum überhaupt aufgehoben: Sie trägt die 358 gemessenen Kontrastpaare und ist die einzige Stelle,
an der alle Zustände nebeneinander stehen. Wer eine Farbe ändert, sieht dort in einem Blick, was er
sonst über vierzehn Ansichten verteilt suchen müsste.

Warum das Bauskript ein Node-Skript ist und kein `TAKT_DESIGNSYSTEM=1 vite build` im
`scripts`-Block: Das ist Bourne-Shell-Syntax, und auf Windows startet pnpm über `cmd`. Warum kein
`vite build --mode designsystem`, das plattformunabhängig wäre: Es ließe `NODE_ENV` offen und zöge
`import.meta.env.DEV` auf `true`. In demselben Lauf entsteht die Anwendung — mit `DEV === true`
bliebe der Entwicklungsrückfall aus `app/connection.ts` im Bündel stehen, also ein Weg, dem Dienst
einen Nachweis aus einer Umgebungsvariablen unterzuschieben. Eine Abnahmeseite ist das nicht wert.

**6 — Eine Kollision, die auf dem Weg auffiel.**

`showcase.css` und `app.css` definierten beide die Klasse `.app` — einmal als Raster der
Musterseite, einmal als Hülle der Anwendung. Beide wurden global geladen, gleiche Spezifität,
`app.css` zuletzt: Die Musterseite bekam am Ende das Layout der Anwendung. Ein Name, zwei
Bedeutungen, und wer an der einen arbeitete, verstellte unbemerkt die andere. Die Musterseite heißt
jetzt `.showcase`, und `main.tsx` lädt `showcase.css` gar nicht mehr — es gehört zum anderen
Einstiegspunkt. Nebenwirkung: Das Anwendungsbündel enthält die Musterseite nicht mehr (99 Module
gegenüber 119 im Lauf mit `TAKT_DESIGNSYSTEM=1`, und `grep` findet ihren Text im
Anwendungsbündel nicht).

---

Was ich tatsächlich im Browser gesehen habe:

Gefahren wurde die echte Anwendung gegen den echten Dienst — `apps/local-api/src/index.ts` mit
eigenem `XDG_DATA_HOME`, `vite` mit `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN`, also derselbe Weg, den
`tests/e2e/support/services.ts` benutzt. Kein Attrappen-Server. Chromium mit klassischen
Bildlaufleisten. Bestand: acht Tags, 40 Todos.

*Nachher, alle Reiter, Wechsel per **Klick auf die Navigation** (nicht per Adresse):*

```
Dashboard      main.w=1200  main.clientW=1190  main.x=240
Todos          main.w=1200  main.clientW=1190  main.x=240
Kanban         main.w=1200  main.clientW=1190  main.x=240
Zeiterfassung  main.w=1200  main.clientW=1190  main.x=240
Buchungen      main.w=1200  main.clientW=1190  main.x=240
Export         main.w=1200  main.clientW=1190  main.x=240
Tags           main.w=1200  main.clientW=1190  main.x=240
Einstellungen  main.w=1200  main.clientW=1190  main.x=240

eindeutige clientWidth: 1190 (eine)      eindeutige linke Kante: 240 (eine)
```

*Nachher, 15 Adressen (acht Punkte, Vorlagen, Protokoll, fünf Einstellungsbereiche), zwei
Fenstergrößen:*

```
[1440px] eindeutige main.clientWidth: 1190  (1)      vorher: 1190, 1200
[1440px] eindeutige main.x:            240  (1)
[1440px] eindeutige .screen-Breite:   1142  (1)      vorher: 1142, 1152
[1920px] eindeutige main.clientWidth: 1670  (1)      vorher: 1670, 1680
[1920px] eindeutige main.x:            240  (1)
[1920px] eindeutige .screen-Breite:   1440  (1)      vorher: 1440, 1622
```

`main.clientHeight` ist jetzt auf jeder Ansicht 768 (bei 820 Fensterhöhe) und **nicht mehr** gleich
`main.scrollHeight` — der Rahmen misst sich am Fenster, der Inhalt scrollt darin. `docSB` ist auf
allen 30 Messungen 0: Es gibt keine Fensterbildlaufleiste mehr. Kein waagerechter Dokumentbildlauf.
Dasselbe bei 1280 × 700 und 900 × 760 nachgemessen: je eine einzige Breite.

*Bereichswechsel in den Einstellungen* (Darstellung → Export → Standard-Tags → Add-in → Arbeitsplatz
→ Darstellung): `[1200, 1190, 240]` auf allen sechs Schritten.

*Hell und dunkel:* Dashboard, Todos, Kanban und Einstellungen in beiden Modi angesehen. Die
Seitenleiste läuft über die volle Höhe, die Marke sitzt oben darin, der Kopf beginnt rechts davon,
die einzige Bildlaufleiste steht am rechten Rand des Inhaltsbereichs. Keine Meldung auf der Konsole,
kein Fehler auf der Seite (0 Seitenfehler, 0 Konsolenfehler über alle Läufe).

*Tastatur, Einstellungen:*

```
 1 A.skip-link            "Zum Inhalt springen"   outline=2px solid
 2 A.brand                "Takt"                  outline=2px solid
 3-10 A.nav__item         acht Navigationspunkte  outline=2px solid
11 INPUT.gsearch__input   (Ring liegt auf .gsearch__field:focus-within)
12 BUTTON.btn             "Zeit erfassen"         outline=2px solid
13 SELECT.select__input   Farbmodus               outline=2px solid
14-18 A.settings-rail__item  fünf Bereiche        outline=2px solid
```

Eingabetaste auf „Export" in der Leiste: `hash: #/einstellungen?bereich=export`, aktive Karte
„Export". `aria-current="page"` steht auf genau einem Eintrag. Sprungmarke bei frischem Laden: erstes
Tab trifft sie, Eingabetaste setzt den Fokus auf `main.app__main` mit sichtbarem Ring.

*Zustände aus Abschnitt 15, nachgestellt:*

* **Leer** — Todo-Liste ohne Bestand: „Noch kein Todo", Kanban-Spalten „Keine Karte. Ziehen Sie eine
  hierher oder legen Sie eine an."
* **Fehler** — Dienst nicht erreichbar: „Das ließ sich nicht laden" mit „Erneut versuchen", im Raster
  an derselben Stelle wie der Inhalt, ohne dass der Rahmen sich ändert.
* **Ohne Hülle** — `NoShellNotice` bei 1440 × 400 vollständig sichtbar, kein Bildlauf nötig, nichts
  abgeschnitten.
* **Hülle meldet Probleme** — mit nachgebildeter Hülle (zwei Startprobleme plus
  Synchronisierungswarnung): Das Meldungsband liegt bei `x=0, w=1440` über beide Spalten, die
  Seitenleiste beginnt darunter, `main` behält `x=240` und `clientWidth=1190`. In einem 320 Pixel
  hohen Fenster wird das Band bei 144 Pixeln gedeckelt und bekommt seinen eigenen Bildlauf; der
  Inhaltsbereich behält 124 Pixel. Ohne die Deckelung hätte eine lange Meldung den Inhalt auf null
  gedrückt.
* **Dienst beendet** — die Sperrmeldung deckt weiterhin das ganze Fenster (0, 0, 1440, 820).
* **Aktiv/überfahren** — Bereichsleiste und Navigation mit `--bg-hover`, `--bg-active` und dem
  Akzentzustand für den aktuellen Eintrag; `--text-muted` auf `--accent-bg-subtle` ist ein
  gemessenes Paar der Kontrastprüfung, keine Annahme.

*Musterseite:* `/designsystem.html` lädt mit `.showcase` als Wurzel, 0 Seitenfehler, Titel „Takt —
Designsystem", Farb- und Dichteschalter funktionieren.

*Nachweise:*

```
pnpm typecheck   alle acht Pakete grün
pnpm contrast    0 von 358 Paaren durchgefallen
pnpm build       grün; apps/web erzeugt dist/index.html und sonst nichts
```

---

Abweichungen:

**1 — Ein e2e-Test bricht durch diese Aufgabe und ich darf ihn nicht anfassen.**
`tests/e2e/web-build-smoke.spec.ts`, TP-BUILD-01, klickt „Designsystem ansehen" in `NoShellNotice`
und erwartet danach `.designsystem-frame`. Beides gibt es nicht mehr — das war genau der Weg, den
der Auftraggeber geschlossen haben wollte. `tests/e2e/**` gehört dem e2e-tester. **Vorschlag für den
Ersatz:** Der Test brauchte den Knopf als zweiten, verbindungsunabhängigen Beleg, dass das Bündel
(Skripte, Stile, Routing) fehlerfrei geladen hat. Dasselbe belegt ohne jede Verbindung:
`page.goto('/#/kaputte-adresse')` und dann `expect(page.getByRole('heading', { name: 'Takt läuft in
der Takt-Anwendung' })).toBeVisible()` — der Router hat gearbeitet, die Rückfallroute gegriffen, die
Anwendung neu gezeichnet. Oder, näher am ursprünglichen Zweck, eine Behauptung über die geladenen
Stile, etwa `expect(page.locator('.boot')).toHaveCSS('display', 'flex')`. `gotoSettings` in
`tests/e2e/support/nav.ts` bleibt gültig: `#/einstellungen` ohne `?bereich=` landet auf
„Darstellung".

**2 — „Rückkehr-Verhalten" gibt es als Einstellung nicht.** In der Aufzählung des Auftraggebers
steht es zwischen Exportvorlage und Add-in-Token. `AppSettings` führt fünf Werte: `exportDirectory`,
`activeExportTemplateId`, `roundingMode`, `locale`, `theme`. Eine Rückkehr-Spalte ist nach E-023
ausdrücklich **nicht** Teil des Modells (`packages/domain/src/settings.ts`, `docs/datenmodell.md`:
„Eine konfigurierbare Rückkehr-Spalte löst ein Problem, das es nicht gibt."). Ich habe nichts
erfunden. Wahrscheinlich ist „Rundung vor dem Export" gemeint — die steht im Bereich „Export". Siehe
offene Frage 1.

**3 — Die Zeilendichte ist neu in der Oberfläche und noch nicht dauerhaft.** Sie stand bisher nur
auf der Musterseite; in der Anwendung gab es sie nicht, obwohl der Auftraggeber sie als vorhandene
Einstellung aufzählt. Sie ist jetzt im Bereich „Darstellung", wirkt sofort und auf die ganze
Anwendung — aber sie gilt bis zum Beenden. Das Datenmodell hat keine Spalte dafür, und diese
Oberfläche legt nichts im Browser ab. Der Hinweis unter dem Feld sagt das wörtlich, statt es den
Benutzer beim nächsten Start herausfinden zu lassen. Siehe offene Frage 2.

**4 — Die Marke ist aus dem Kopf in die Seitenleiste gewandert.** Das war nicht ausdrücklich
verlangt, folgt aber aus der Zeichnung: Die Seitenleiste läuft dort über die volle Höhe, der Kopf
beginnt rechts von ihr. Eine Marke im Kopf hätte den Kopf über die Seitenleiste hinweg gezogen und
genau die Struktur wieder aufgelöst, um die es ging.

**5 — Aus neun Navigationspunkten sind acht geworden.** Der neunte war „Designsystem". Die
Abnahmemessung deckt deshalb acht Punkte plus Vorlagen, Protokoll und fünf Einstellungsbereiche ab,
also 15 Adressen.

**6 — Das Kanban wird sehr hoch (5857 Pixel bei 40 Karten), und das bleibt so.** Ein Board, dessen
Spalten einzeln scrollen, wäre bequemer — es wäre aber genau die verschachtelte Bildlaufleiste, die
der Auftraggeber ausgeschlossen hat. Es scrollt also der Inhaltsbereich, einmal, wie überall sonst.

---

Offene Fragen:

**1 — Was ist mit „Rückkehr-Verhalten" gemeint?** Wenn „Rundung vor dem Export": erledigt, sie steht
im Bereich „Export". Wenn etwas anderes — etwa das Verhalten beim Wiederaufleben eines erledigten
Todos —, dann ist es heute nicht einstellbar und wäre erst im Datenmodell anzulegen; das gehört dem
domain-dev, nicht mir.

**2 — Soll die Zeilendichte dauerhaft sein?** Dafür bräuchte `app_setting` eine Spalte `density` und
`AppSettings`/`AppSettingsUpdate` ein Feld. Das ist Fachlogik und Speicherung, also domain-dev. So
lange ist sie eine Sitzungseinstellung, und die Oberfläche sagt es. Alternative wäre `localStorage`
— die habe ich verworfen: Takt speichert im Browser nichts, und das steht als Zusage in
`NoShellNotice`.

**3 — Bleibt der Farbmodus doppelt bedienbar?** Er steht in der Kopfleiste **und** im Bereich
„Darstellung". Beide bedienen jetzt nachweislich denselben Zustand, es ist also keine Doppelung im
Datenmodell, sondern ein schneller Griff neben dem geordneten Ort. Wer nur den geordneten Ort will,
sagt es, dann fällt das Feld aus dem Kopf — der Platz dort wäre für einen zweiten schnellen Griff
frei (naheliegend: der Timer, der ohnehin schon da ist).

**4 — Der Prototyp liegt weiterhin nicht vor.** `docs/prototype/takt-ui-konzept.html` gibt es nicht,
`docs/**` gehört mir nicht. Die Struktur der Hülle steht in `styles/app.css` bei `.app` mit
Begründung und Maßen; ein späterer Abgleich gegen den Prototyp findet dort an einer Stelle statt und
nicht über vierzehn Ansichten verteilt.

**5 — Die Musterseite zeigt die alte Hülle.** `showcase/Showcase.tsx` hat ihr eigenes Gerüst
(`.showcase`), das dem der Anwendung nicht folgt und auch nie folgen sollte — sie ist eine
Abnahmeseite und keine Anwendung. Wenn gewünscht ist, dass die Musterseite die neue Hülle **zeigt**
(als Baustein „Anwendungsrahmen"), wäre das eine eigene, kleine Aufgabe. Ich habe sie nicht
angefangen, weil die Aufgabe ausdrücklich das Herausnehmen und nicht das Ausbauen verlangte.
