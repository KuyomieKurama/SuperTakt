# T-336 — Freigaberunde über T-334 (Oberfläche) und T-335 (Wächter)

**Rolle:** code-reviewer. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Gemessen, nicht gelesen:** node 22.23.2, pnpm 11.3.0, Chromium aus `~/.cache/ms-playwright`.
**Keine Datei außerhalb dieses Berichts angefaßt.** Alle Messungen laufen gegen Kopien im
Kratzbereich (`scratchpad/tree0`, `scratchpad/repo/apps/web`, `scratchpad/t336`).

---

## 0 Aufbau der Messung

- **Strang B** gegen eine vollständige, in sich schlüssige Kopie des Baums
  (`scratchpad/tree0`). Die `node_modules` der Pakete sind **kopiert und nicht verlinkt**, damit
  die relativen Arbeitsbereichsverweise (`apps/desktop/node_modules/@takt/local-api ->
  ../../../local-api`) **in der Kopie** auflösen. Mit einem Verweis auf den echten Baum meldet der
  Lauf `4 eigene Datei(en) im Programm, verlangt sind mindestens 60` — der Nullpunkt wäre dann
  nicht gemessen, sondern nur rot. Nullpunkt in der Kopie: **130/0**, derselbe Wert wie im echten
  Baum.
- **Strang A**, Wächterteil, gegen eine Kopie von `apps/web` in einer nachgebauten
  Wurzelstruktur. Nullpunkt **28/0**, derselbe Wert wie im echten Baum.
- **Strang A**, Gestaltungsteil, im Browser gegen ein Gerüst, das die **echten** Stilblätter lädt
  (`tokens.css`, `base.css`, `components.css`, `app.css`, `viewport-layout.css`) und die Hülle
  nachbaut. Eigener Port **18936**, vorher mit `ss -ltn` als frei geprüft, nachher beendet und
  nachgeprüft. **17843/17844/5173 habe ich nicht gebunden**, außer durch `pnpm verify:bundle`
  (siehe Abschnitt 4) — beide waren vorher frei und sind nachher frei.
- Kein fremder Prozeß beendet. Keine Waisen: `pgrep` nach dem Lauf zeigt nichts von mir.

---

## 1 Befunde Strang A (T-334)

```
apps/web/src/styles/viewport-layout.css:221    hoch    `overflow: hidden` an `.screen__header`/`.screen__bar` schneidet den Fokusring ab. Gemessen 1280×820: der erste Knopf in `.screen__actions` sitzt mit seiner Oberkante **genau** auf der Kopfoberkante (Luft 0 px), die letzte Zeile des Kopfes (Reiter, Filterleiste) genau auf der Unterkante (Luft 0 px); der Ring reicht 4 px darüber hinaus (`--focus-ring-width` 2 px + `--focus-ring-offset` 2 px; **5 px** unter `prefers-contrast: more`, `packages/ui-tokens/tokens.css:651`). Bildvergleich mit und ohne die Zeile, Knopf fokussiert (`:focus-visible` bestätigt): **3 427** bzw. **3 100** verschiedene Bildpunkte von 135 200, größter Unterschied **227 von 255** — der obere Ringstrich fehlt ganz, das ist keine Kantenglättung. Die Bildmessung in T-334 Abschnitt 2.1 hat **unfokussierte** Köpfe verglichen und konnte das nicht sehen. Fix: die Rinne behalten, den Ring hereinholen — `.screen__header, .screen__bar { padding-block: calc(var(--focus-ring-width) + var(--focus-ring-offset)); margin-block: calc(-1 * (var(--focus-ring-width) + var(--focus-ring-offset))); }`; in einer Flex-Spalte zieht der negative Rand die Außenkante um genau denselben Betrag zurück, den der Innenabstand hinzufügt, die Inhaltsspalte bleibt zeichengleich. Danach beide Bildvergleiche **mit** Fokus wiederholen.
apps/web/scripts/proof-surface.mjs:1458        hoch    Die Zusage zu A-A-108 ist am Portalfall aufgespannt, den der Autor erreicht hat, nicht an der Anforderung (E-099 Punkt 3). Regel F läuft **nur** die direkten Kinder von `.app` ab und hält an einem HTML-Knoten an (`:1085-1087` — `traeger.push(...); return;`); eine `.scrim`, die tiefer im Baum geschrieben wird, sieht sie nie. Die neue Zeile prüft `rasterErnte.portale > 0` — eine **Untergrenze**, die drei Portale zusammen erfüllen. Zwei eigene Ausschalter, beide **28/0 grün**: (M-A1) `AttachmentOpenDialog.tsx:348` `<Scrim …>` → `<div className="scrim" …>` — genau die Fläche aus A-19.14, genau die Rückkehr, die A-A-108 verbietet; Portalzahl bleibt 3, die Datei war nie erreicht. (M-A2) `ShellStatus.tsx:763` dasselbe — Portalzahl fällt 3 → 1, `.scrim` erscheint als `außerhalb des Flusses` unter den Rasterkindern, `> 0` hält weiter, Lauf bleibt 28/0. Fix: eine **eigene** Regel neben F, an der Anforderung aufgespannt — sammle über `apps/web/src` **jedes** JSX-Element, dessen Klassenliste `scrim` enthält, und verlange für jedes, daß es lexikalisch in einem `createPortal(…, document.body)` steht; Untergrenze „mindestens drei solche Flächen gefunden"; Gegenproben: die beiden Mutationen oben müssen rot werden, ein echtes Portal darf nicht gemeldet werden.
.claude/team/reports/T-334-frontend-dev.md:429  niedrig  Die Risikozahl „unterhalb von etwa 1067 px Fensterbreite" widerspricht der eigenen Meßtafel desselben Berichts. Mit `.screen__actions` = 785,3 px, `flex-basis: 10rem` = 160 px und `gap` = 16 px liegt die Umbruchschwelle bei einer Kopf-Inhaltsbreite von **961,3 px**; die Inhaltsbreite ist `Fensterbreite − 240 (Schiene) − 48 (Einzug) − 10 (Rinne)`, also bricht der Kopf ab **≈1259 px** um. Die Tafel zeigt genau das: 1280 px kein Umbruch (`.grow` 180,7 = 982 − 785,3 − 16), 1200 px umgebrochen (`.grow` 902 = volle Zeile). Auch die eigene Begründung „20,7 px Luft bei 1280" ergibt 1280 − 20,7 ≈ 1259. Fix: die Zahl in Bericht und offener Frage (2) auf ≈1259 px berichtigen, bevor ui-designer (T-339/T-340) und visual-qa (T-338) den falschen Bereich absuchen.
apps/web/src/features/settings/SettingsScreen.tsx:157  niedrig  `?? AREA_LIST[0].label` ist ein stiller Rückfall: Fehlt ein Bereich in `AREA_LIST`, heißt der Laufbereich „Darstellung" statt richtig — und genau das ist die Klasse, die T-334 hier beseitigen wollte. `AREAS` (:69) und `AREA_LIST` (:103) sind weiterhin **zwei** Listen, die dasselbe benennen. Die eine Richtung fängt der Typprüfer (`noImplicitReturns` an `SettingsAreaPanel`, :239), die andere nicht. Fix: eine Liste — `type SettingsArea = (typeof AREA_LIST)[number]["area"]`, `readArea` über `AREA_LIST`, `AREAS` streichen; `panelLabel` ist danach beweisbar total und der Rückfall entfällt.
apps/web/src/styles/viewport-layout.css:186     niedrig  Der Export-`.table-wrap` verliert mit `flex: none` nicht nur seine Laufstrecke, sondern behält seinen **Bildlaufkasten**: `overflow-x: auto` (`components.css:746`) rechnet die andere Achse auf `auto`, der Kasten bleibt Laufkasten ohne Lauf, und `.table thead th { position: sticky; top: 0 }` klebt an einem Kasten, der sich nie bewegt — der klebende Tabellenkopf ist dort **still tot**, nicht nur abgeschaltet. Das ist der Zustand vor T-326 und der Zuweisung aus T-322 4.7 entsprechend ein hingenommener Preis, aber er steht heute nur im Bericht. Fix: den Satz in den Kommentar bei der Sammelregel aufnehmen („in der Export-Ansicht klebt der Tabellenkopf danach nicht mehr — ein Laufbereich, T-322 4.7") und T-338/T-339 ausdrücklich darauf zeigen.
apps/web/src/styles/viewport-layout.css:185     niedrig  `.runarea > *` hat die Spezifität (0,1,0), und `viewport-layout.css` wird als **letztes** Stilblatt geladen (`apps/web/src/main.tsx:5-8`). Jede künftige einfache Klassenregel, die einem direkten Kind eines Laufbereichs das Wachsen erlauben will, verliert damit **lautlos**. Heute trifft das nichts: von den 38 Selektoren in `base.css`/`components.css`/`app.css`, die ein positives `flex-grow` setzen, ist keiner ein direktes Kind von `.screen__body`, `.runarea` oder `.kcolumn__body` (statisch gemessen). Fix: ein Satz im Kommentar, daß die Regel absichtlich gewinnt und ein Kind, das wachsen soll, eine Regel mit `.runarea > .x` (0,2,0) braucht.
```

### Was ich in Strang A **bestätigt** habe

- **Die Sammelregel trifft nicht zuwenig.** Jeder `<ScreenBody>`/`<ScreenFrame>` ist ein
  **direktes** Kind von `<section className="screen">` — auch die aus `AsyncBoundary`, weil
  `AsyncBoundary.tsx:50,54,72` in ein Fragment zurückgibt und keinen Umschlag zeichnet, und auch
  die Buchungstabelle, die ihren Laufbereich selbst ist
  (`BookingsScreen.tsx:468` `className="screen__body"`). `.screen > .screen__body:not(--frame) > *`
  erreicht damit alle acht Regelansichten.
- **Sie trifft nicht zuviel.** `.screen > .screen__body.table-wrap` steht auf `display: block`
  (`viewport-layout.css:408`), dort sind die Kinder keine Flex-Elemente; `.screen__body > .empty
  / .table-shell / .board-setup` behalten `margin-block: auto` und zentrieren unverändert;
  absolut und fest positionierte Kinder sind keine Flex-Elemente. Die statische Messung der 38
  wachstumsfähigen Selektoren (oben) findet keine Kollision.
- **Die Einzelbehebung an `.time-layout__* > .card` ist nicht tot.** Am Quelltext nachgefahren:
  `TimeScreen.tsx:171` `<ScreenFrame className="screen__body--split">` → `:172` `.time-layout` →
  `:173` `.time-layout__main` / `:323` `.time-layout__side` → darin die `.card`. Die Karten sind
  Kinder von `.time-layout__*`, und das ist weder `.screen__body` noch `.runarea` noch
  `.kcolumn__body`. Die Zeilen `:495-497` bleiben nötig; die Begründung steht jetzt daneben und
  stimmt.
- **Alle drei Abdunklungen hängen am Portal, nicht nur die aus dem Befund.** Über
  `apps/web/src`, `apps/outlook-addin/src` und `apps/desktop/src` gibt es genau drei JSX-Stellen
  mit `.scrim`: `DialogSurface.tsx:371`, `ShellStatus.tsx:763`, `AttachmentOpenDialog.tsx:348` —
  alle drei nehmen `<Scrim>`, und `Scrim` (`:452`) ist die einzige Stelle, an der die Klasse
  entsteht.
- **Beim Schließen wird aufgeräumt.** Alle drei stehen unter einer Bedingung
  (`DialogSurface.tsx:365` `{open ? … : null}`, `AttachmentOpenDialog.tsx:307` `if (!open) return
  null`, `ShellStatus` hängt am Zustand der Hülle); React baut den Portalknoten mit dem Baustein
  ab. Keine eigene DOM-Arbeit, kein angemeldeter Zuhörer am Dokument, der bliebe. Die
  Aufräumfunktion in `AttachmentOpenDialog.tsx:258` wird nur angemeldet, solange `open` gilt, und
  die beiden Haken stehen **über** dem `return null` — die Hakenreihenfolge bleibt stabil.
- **Der Fokusfang trägt über das Portal.** `DialogSurface` läßt die Fokusfalle von Ark UI am
  Kasten arbeiten, nicht an seinem Ort im Baum. `AttachmentOpenDialog` und `BlockingDialog`
  fangen über `onKeyDown` an der Abdunklung; der Dialog ist ein DOM-Nachfahre des Portalknotens,
  also steigt das Ereignis auch nativ dorthin auf, und React reicht es zusätzlich durch den
  Portalknoten an den Baum, in dem `<Scrim>` steht. Kein Bruch.
- **Die Stapelreihenfolge ändert sich nicht.** `.app` (`app.css:108`) trägt `position: relative`
  ohne `z-index`, erzeugt also keinen Stapelkontext; `.scrim` lag auch vorher gegen `--z-scrim:
  300` an. `.toast-layer` (400) bleibt darüber, `.idle-reminder` (30) darunter.
- **Drei weitere feste Flächen sind heute nicht betroffen**, aber auch nicht gemessen:
  `.skip-link` (`App.tsx:299`, Kind von `.app`), `.toast-layer` (`ToastContext.tsx:204`) und
  `.idle-reminder` (`IdleRecovery.tsx:67`, `TimerContext.tsx:592`) hängen alle auf Anbieter- oder
  Hüllenebene und haben keinen `.card`-Vorfahren. Wer den Wächter aus Befund 2 baut, sollte die
  Frage gleich für sie mitstellen — es ist dieselbe.
- **Die drei selbst getroffenen Gestaltungsentscheidungen** sind im Quelltext begründet und
  gemessen. `.screen__body--frame { scrollbar-gutter: stable }` (`:454`) melde ich
  auftragsgemäß **nicht** als Widerspruch; der ui-designer klärt es. `flex-basis: 10rem`
  (`app.css:973`) rechnet sich an der eigenen Tafel nach (982 − 785,3 − 16 = 180,7). Der
  `flex-shrink: 1` an `.screen__actions` (`app.css:990`) ist ein eigener Befund, richtig erkannt
  und richtig eng gefaßt (nur im Kopf, nicht am Umschalter).

---

## 2 Befunde Strang B (T-335)

```
apps/local-api/scripts/proof-release-safety.mjs:1383  hoch    Die Lückenliste ist an Gestalt 1–5 aufgespannt (Rückweg aus dem Bestand), während der Name der Prüfung seit T-335 zusagt: „die Lücken daneben stehen bei `checkNoStoreReadback`". Die Restlücke von Gestalt 6 — **der Rumpf der beiden Entscheidungsmodule selbst** — steht nicht darin. Zwei eigene Ausschalter, beide `tsc` Exit 0 und beide **130/0 grün**, dazu `proof:layers` 36/0 und `proof:route-policy` 48/0: **Z-2** — `apps/local-api/src/features/version/source.ts:272`, als erste Anweisung von `latest()`: `if (process.env['TAKT_SKIP_UPDATE_CHECK'] === '1') return { ok: false, reason: 'unreachable' };`. Die ausgehende Anfrage findet nicht statt. **Z-3** — `apps/local-api/src/features/version/version.ts:592`, dieselbe Sperre zwischen `await remember(options.now())` und `await source.latest(...)`. Beide widersprechen der Zusage, die der Port selbst führt (`source.ts:214-217`: „keine Route, keine Einstellung, **keine Umgebungsvariable**, kein Argument, keine Datei daneben"). T-335 Abschnitt 6 sagt richtig, daß die Klasse nicht schließbar ist — der Satz, der dabei **falsch** ist, lautet „Was er nicht mißt, steht bei `checkNoStoreReadback` aufgezählt". Fix: einen Absatz in die Aufzählung — „der Rumpf der beiden Entscheidungsmodule. 6a bis 6g messen, **wer** sie baut, **womit**, **wodurch** ein Port hereinkommt, **daß** gestartet wird und **worauf** vor der Anfrage gewartet wird; sie messen nicht, **was die Module tun**. Gemessen am 2026-09-13 (T-336 Z-2/Z-3): ein `process.env`-Riegel in `source.ts` oder in `version.ts` läßt den Lauf bei 130/0." Wer sie schließen will, nagelt den Vorspann von `latest()` so fest wie `ADAPTER_ANWEISUNGEN` `recordCheck` — oder verbietet `process.env` unter `features/version/**`.
apps/local-api/scripts/proof-release-safety.mjs:96    mittel  Der Preis des Zeichenvergleichs ist **richtig beziffert**, steht aber nicht im Kopf des Laufs. Der Kopf (`:1-101`) zählt in fünf Punkten auf, was gemessen wird, und in drei Punkten (a/b/c), was **nicht**; die neue Kopplung an ein fremdes Paket steht 1 900 Zeilen tiefer bei `ADAPTER_ANWEISUNGEN` (`:1913`). Punkt 5 des Kopfes beschreibt Gestalt 6 außerdem noch im Stand von T-327 („Kein Wert aus dem Bestand an der Verdrahtung"), nicht im neuen. Fix: Punkt 5 auf den Satz aus dem Bericht heben („wer den Prüfer und seinen Port baut, womit beide gebaut werden, wodurch ein Port in den Zusammenbau kommt, daß gestartet wird und worauf vor der Anfrage gewartet wird — einschließlich der Anweisungen des einen Adapters") und als **d)** aufnehmen: „Dieser Lauf wird rot, wenn sich die Anweisungen von `recordCheck` in `packages/storage/src/sqlite/repo-version-check.ts` ändern. Das ist gewollt; bestätigt wird bei `ADAPTER_ANWEISUNGEN`."
packages/storage/src/sqlite/repo-version-check.ts:78  mittel  Die Datei, die den Preis **bezahlt**, weiß nichts davon. Ihre Anweisungen sind seit T-335 zeichengleich festgenagelt; im ganzen Kopf (`:1-50`) und am Mitglied selbst steht kein Wort davon (`grep` nach `release-safety`: kein Treffer). Wer hier eine Zeile ändert, bekommt einen roten Nachweis in einem fremden Paket und muß ihn erst suchen. Fix: ein Satz über `recordCheck` — „Die Anweisungen dieses Mitglieds sind in `apps/local-api/scripts/proof-release-safety.mjs` (`ADAPTER_ANWEISUNGEN`) zeichengleich festgenagelt (A-A-105e, T-335). Wer sie ändert, bestätigt sie dort; Prosa ist frei." Gehört domain-dev, in einer **eigenen** Welle (der Stand steht jetzt).
apps/local-api/scripts/proof-release-safety.mjs:2980  niedrig  Die Meldung des Zeichenvergleichs liefert den gemessenen Text mit — gut —, nennt aber nicht den Ort, an dem bestätigt wird. Fix: `… (A-A-105e; zu bestätigen bei \`ADAPTER_ANWEISUNGEN\` in apps/local-api/scripts/proof-release-safety.mjs)`.
```

### Was ich in Strang B **bestätigt** habe

- **Die Zählvorschrift rechnet sich von unten nach.** Der Lauf zählt sie selbst gegen:
  „jede Gegenprobe nagelt fest, woran sie rot wird (**96** Einträge, 96 mit `erwartet`)", Gesamt
  **130**. 130 − 96 = **34**; vorher 106 − 72 = **34**. Es sind also genau +24 Gegenproben und
  **null** neue Zeile in Abschnitt 0 — Umbau und Gegenproben sind getrennt geblieben, wie T-327
  es getan hat. Die Herleitung steht im Quelltext (`:3363-3370`), einschließlich der acht
  Mutationen am Leser selbst (`:3371-3379`).
- **Der Zeichenvergleich verdient seinen Preis.** Eigener Ausschalter, nicht der des Autors:
  `recordCheck` auf `void at; return new Promise<void>(() => undefined);` — **kein** `await`, kein
  `setTimeout`, keine Datenbankmarke. `tsc -p packages/storage/tsconfig.json --noEmit` Exit 0,
  Lauf **129/1**, und der Befundsatz trägt den gemessenen Text mit. Die Behauptung aus T-335
  Abschnitt 6, daß hier keine Regel trägt und nur der Vergleich, ist damit an einer selbst
  gebauten Gestalt bestätigt.
- **Die vierte Gestalt (Deep-Import über den Paketnamen) ist beidseitig gemessen.** Eigene Datei
  `apps/local-api/src/features/settings/t336-quelle.ts` mit `import { createVersionChecker } from
  '@takt/local-api/src/features/version/version.ts'`: **HEAD-Wächter 76/0 grün**, **T-335-Wächter
  129/1 rot** mit `… t336-quelle.ts: führt das Prüfmodul ein und steht nicht unter den 3
  festgenagelten Verbrauchern`. Die Behauptung „`apps/local-api/package.json` hat keine
  `exports`-Tabelle" ist nachgeprüft: kein Treffer in der Datei.
- **Die Behauptung, die Klasse sei über den Quelltext nicht schließbar, bestätige ich** — und
  zwar nicht, weil drei Berichte sie teilen, sondern weil meine beiden eigenen Ausschalter Z-2 und
  Z-3 sie zeigen. Sie liegen **nicht** in der Verdrahtung und tragen keinen der gemessenen Namen;
  jede Erweiterung, die sie fängt, ist wieder eine Liste von Schreibweisen. Der Weg, der sie
  schließt, ist der in T-335 Abschnitt 6 benannte: **A-A-106**, gemessen am Verhalten (ein
  Speicher, dessen `write` nie eintrifft, und die Anfrage geht trotzdem hinaus). Das ist der
  ehrliche Teil des Berichts und er hält.
- **Der Nullpunkt ist reproduziert**, in der Kopie und im echten Baum: 130/0.

---

## 3 Zur Kenntnis, kein Befund

- `.screen__body--frame { scrollbar-gutter: stable }` (`viewport-layout.css:454`) gegen den
  Wortlaut in `docs/design/fensterfeste-flaechen.md` — auftragsgemäß **nicht** als Widerspruch
  gemeldet; klärt der ui-designer.
- `pnpm verify:bundle` **bindet 17844** — hier nachgeprüft: gefahren, 20/0, Port vorher und
  nachher frei. Die offene Frage (4) aus T-334 ist damit bestätigt und gehört in die Liste der
  portgebundenen Läufe.
- `.idle-reminder` (`app.css:5006`) trägt eine rohe `z-index: 30` und rohe Pixelwerte statt
  Token. Vorbestehend, nicht aus T-334, außerhalb dieses Umfangs.

---

## 4 Läufe, jeder mit Zahl

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **Exit 0**, acht Pakete plus Prüf- und E2E-Konfigurationen |
| `pnpm boundaries` | grün, 528 Dateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm contrast` | grün, 261 Paare, 11/11 Gegenproben |
| `pnpm proof:all` (22 Läufe) | **alle grün**, darunter `proof:surface` 28/0, `proof:release-safety` 130/0, `proof:callers` 74/0, `proof:layers` 36/0, `proof:route-policy` 48/0, `proof:clamp` 21/0, `proof:locked` 9/0, `proof:foreign` 21/0, `proof:shell-surface` 7+54 |
| `pnpm verify:bundle` | grün 20/0 — **bindet 17844** |
| `pnpm test:coverage`, `test:rust`, `build`, `audit`, `proof:engines`, `test:e2e` | **nicht gefahren**, also **nicht gemessen** und nicht „grün" |

**Eigene Meßläufe** (Kopien, echter Baum unberührt):

| Gestalt | Baum | HEAD-Wächter | T-335-Wächter | `tsc` |
|---|---|---|---|---|
| Nullpunkt | `tree0` | — | **130/0** | — |
| Eigene K-1-Fassung, `recordCheck` ohne `await`, nie eintreffend | `tree0` | — | **129/1** | Exit 0 |
| Deep-Import über den Paketnamen (`t336-quelle.ts`) | `tree0` | **76/0 grün** | **129/1 rot** | — |
| **Z-2** `process.env`-Riegel in `source.ts` | `tree0` | — | **130/0 grün** | Exit 0 |
| **Z-3** `process.env`-Riegel in `version.ts` | `tree0` | — | **130/0 grün** | Exit 0 |
| **M-A1** `.scrim` ohne Portal in `AttachmentOpenDialog` | `repo/apps/web` | — | `proof:surface` **28/0 grün** | — |
| **M-A2** `.scrim` ohne Portal in `ShellStatus` | `repo/apps/web` | — | `proof:surface` **28/0 grün** | — |

---

## 5 Urteil

**Strang A (T-334): Nacharbeit.** Die vier gemeldeten Punkte sind der Sache nach behoben und
messbar besser; blockierend sind zwei Befunde:

- `apps/web/src/styles/viewport-layout.css:221` — der abgeschnittene Fokusring. Er ist eine
  **neue** Verschlechterung in allen elf Ansichten, und die Zusage des Berichts („daß `overflow:
  hidden` nichts abschneidet, ist im Bild gemessen") ist an der falschen Menge gemessen worden.
- `apps/web/scripts/proof-surface.mjs:1458` — der Wächter, der die Zusage A-A-108 nicht mißt. Die
  Fläche aus A-19.14 kann ihr Portal verlieren, ohne daß der Lauf es merkt; das ist dieselbe
  Klasse, die in diesem Bestand sechsmal etwas gekostet hat, und diesmal mit dem Wächter, der
  eigens dafür angefaßt wurde.

Die vier übrigen Befunde (niedrig) blockieren nicht.

**Strang B (T-335): Nacharbeit.** Die Messung ist die gründlichste in diesem Bestand, die
Zählvorschrift rechnet sich nach, der Zeichenvergleich verdient seinen Preis, und die vierte
Gestalt ist beidseitig belegt. Blockierend ist ein Befund:

- `apps/local-api/scripts/proof-release-safety.mjs:1383` — die Lückenliste. Der Name der Prüfung
  sagt seit T-335 zu, daß die Lücken dort stehen; zwei eigene, bau- und typprüffähige
  Ausschalter im Rumpf der Entscheidungsmodule stehen nicht darin und lassen den Lauf bei 130/0.
  Das ist Prosa, nicht Code — aber bei einem Lauf, dessen ganzer Wert die Ehrlichkeit seiner
  Grenze ist, ist die Prosa der Gegenstand.

`:96` und `repo-version-check.ts:78` (beide mittel) gehören in dieselbe Nacharbeit; sie sind je
ein Satz.

---

## Kurzfassung

```
Aufgabe: T-336 — Freigaberunde über T-334 (Oberfläche) und T-335 (Wächter)
Status: fertig — beide Stränge Nacharbeit
Artefakte: .claude/team/reports/T-336-code-reviewer.md (einzige geschriebene Datei)
Zusammenfassung: Zehn Befunde, jeder gemessen und keiner geraten. Strang A: `overflow: hidden`
  am festen Kopf schneidet den Fokusring ab — der erste Aktionsknopf sitzt mit 0 px Luft an der
  Kopfoberkante, der Ring reicht 4 px (unter `prefers-contrast: more` 5 px) darüber hinaus, und
  der Bildvergleich mit Fokus zeigt 3 427 von 135 200 verschiedenen Bildpunkten bei einem
  größten Unterschied von 227/255; die Bildmessung aus T-334 hat unfokussierte Köpfe verglichen.
  `proof:surface` mißt A-A-108 nicht: Regel F läuft nur die direkten Kinder von `.app` ab und
  hält am ersten HTML-Knoten an, und die neue Zusage ist eine Untergrenze `portale > 0` — beide
  Rückkehrgestalten (`.scrim` ohne Portal in `AttachmentOpenDialog` und in `ShellStatus`) lassen
  den Lauf bei 28/0. Bestätigt: die Sammelregel trifft weder zuviel noch zuwenig, die
  Einzelbehebung an `.time-layout__* > .card` ist nicht tot, alle drei Abdunklungen hängen am
  Portal, der Fokusfang trägt darüber, und beim Schließen bleibt nichts stehen. Strang B: Die
  Zählvorschrift rechnet sich von unten nach (130 − 96 = 34 = 106 − 72, null neue Zeile in
  Abschnitt 0), der Zeichenvergleich fängt meinen eigenen `new Promise(() => undefined)` ohne
  `await` (129/1, `tsc` Exit 0), und der Deep-Import über den Paketnamen ist beidseitig gemessen
  (HEAD 76/0 grün, T-335 129/1 rot). Der Preis der Kopplung an `packages/storage` ist richtig
  beziffert, steht aber 1 900 Zeilen unter dem Kopf des Laufs und gar nicht in der Datei, die ihn
  zahlt. Und die Lückenliste ist noch an Gestalt 1–5 aufgespannt: zwei eigene `process.env`-Riegel
  im Rumpf von `source.ts` und `version.ts` schalten die ausgehende Anfrage ab und lassen den
  Lauf bei 130/0 — beide `tsc` Exit 0, beide auch unter `proof:layers` und `proof:route-policy`
  grün.
Annahmen: (1) Ich habe `proof:all` und `verify:bundle` gefahren; 17843/17844 waren vorher mit
  `ss -ltn` als frei geprüft, sind es nachher wieder, und ich habe keinen fremden Prozeß beendet.
  (2) `.screen__body--frame { scrollbar-gutter: stable }` habe ich auftragsgemäß nicht als
  Widerspruch gemeldet. (3) Die Schwere „hoch" für den Fokusring ist meine Einordnung: WCAG 2.2
  SC 2.4.11 ist gewahrt (die Fläche ist nicht ganz verdeckt), gebrochen sind das eigene
  Designsystem und SC 2.4.13 — ich gewichte, daß es alle elf Ansichten trifft und daß der Bericht
  das Gegenteil zusichert. (4) Für die Kopie des Baums mußte ich die `node_modules` der Pakete
  kopieren statt zu verlinken, sonst löst der Arbeitsbereichsverweis auf den echten Baum auf und
  der Nullpunkt ist ungemessen; das gehört in die Meßvorschrift für den nächsten, der das tut.
Risiken: Der Fokusring ist nicht der einzige Fall von `overflow: hidden` am festen Teil — jede
  künftige Fläche, die über die Kopfkante ragen soll, wird abgeschnitten statt gewarnt; der
  vorgeschlagene Fix (Innenabstand plus negativer Rand in Höhe von Ring + Versatz) macht daraus
  eine benannte Reserve statt einer stillen Grenze. Für Strang B bleibt der eigentliche Hebel
  A-A-106; bis dahin mißt der Lauf die Verdrahtung und nicht das Verhalten, und Z-2/Z-3 sind der
  Beleg, wie weit das trägt. Sicherheitsseitig habe ich nichts Neues gefunden: keine neue
  Adresse, keine neue Route, kein neuer Datenweg; das Portal legt den Dialog außerhalb von `.app`,
  Stapelreihenfolge und Fokusrückgabe sind nachgefahren.
Offene Fragen: (1) Gehört der Wächter aus Befund A-2 in `proof:surface` oder in einen eigenen
  Lauf? Er beantwortet eine andere Frage als Regel F („jede Abdunklung hängt am Dokumentkörper"
  statt „jedes Kind von `.app` hat eine Fläche"), und der Bestand hält es sonst bei „ein Lauf, ein
  Gegenstand". (2) Soll die Frage aus A-A-108 gleich für `.toast-layer` und `.idle-reminder`
  mitgestellt werden? Beide sind heute unauffällig, aber ungemessen. (3) Der Fix an
  `packages/storage/src/sqlite/repo-version-check.ts` gehört domain-dev und einer **eigenen**
  Welle — in dieser steht der Stand. (4) `pnpm verify:bundle` in die Liste der portgebundenen
  Läufe?
Nächster Schritt: (a) T-334 zurück an frontend-dev für die zwei blockierenden Befunde; die
  Bildmessung des Kopfes ist dabei **mit** Fokus zu wiederholen, und die beiden Mutationen M-A1
  und M-A2 sind die Abnahme des neuen Wächters. (b) T-335 zurück an domain-dev für den Absatz in
  der Lückenliste (mit Z-2/Z-3 als benannter Beleg), den Kopf des Laufs und den Satz in
  `repo-version-check.ts`. (c) Die Zahl „~1067 px" berichtigen, bevor T-338/T-339/T-340 darauf
  aufsetzen. (d) A-A-106 als eigener Auftrag in der nächsten Welle, mit dem Prüffall aus T-335
  Abschnitt 6 — Leser und Bauender in aufeinanderfolgenden Wellen.
```
