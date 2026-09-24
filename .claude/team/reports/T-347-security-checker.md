# T-347 — Sicherheitsfreigabe über T-341 und T-342

**Rolle:** security-checker. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Vorlagen:** `.claude/team/reports/T-341-frontend-dev.md`, `T-342-domain-dev.md`,
`T-337-security-checker.md`, `T-336-code-reviewer.md`; `decisions.md` E-113, E-115, **E-116**;
`risks.md` **R-30**, **R-32**, **R-33**; `docs/spec.md` Abschnitt 25 (**A-25.5**, **A-25.6**);
`docs/bedrohungsmodell.md` 43.

**Geänderte Dateien — zwei, beide in eigener Hoheit:**

| Datei | Was |
|---|---|
| `docs/bedrohungsmodell.md` | neuer Abschnitt **44** samt Auflagen **A-A-112 bis A-A-118** |
| `.claude/team/reports/T-347-security-checker.md` | dieser Bericht |

`apps/**`, `packages/**`, `tests/**`, `risks.md`, `board.md`, `decisions.md` sind **nicht**
angefaßt. Nachgeprüft: `git status` zeigt in `apps/` und `packages/` genau die Dateien, die vor
Beginn dieser Aufgabe geändert waren; `diff -rq` zwischen `apps/web/src` und meiner Meßkopie ist
leer, und die drei Dateien der Versionsprüfung sind byteweise gleich (`cmp -s`).

---

## 0 Meßaufbau — und die Gegenprobe darüber, bevor irgendein Urteil fällt

**Kein Port gebunden, kein fremder Prozeß beendet.** `verify:bundle` und `test:e2e` sind
**nicht gefahren** — T-345 hält die Ports, `verify:bundle` bindet 17844.

Weil `apps/**` in dieser Welle stillstehen soll, liegt **keine** Gestalt im Arbeitsbaum. Zwei
Meßkopien im sitzungseigenen Kratzbereich, beide nach dem Lauf wieder abgeräumt:

| Kopie | Inhalt | Nullpunkt |
|---|---|---|
| `mess/` (3,3 MB) | `apps/web/{src,scripts,*.html,tsconfig}`, `scripts/source-anchors.mjs`, `apps/outlook-addin/scripts/proof-addin.mjs`, `node_modules` verwiesen | `proof:surface` **34/0**, `tsc` **Exit 0** |
| `baum/` (503 MB) | der Arbeitsbaum ohne `.git`, `target`, `playwright-report*`, `test-results*`, `coverage`; `node_modules` **kopiert**, die Arbeitsbereichsverweise sind relativ und lösen deshalb **innerhalb** der Kopie auf | `proof:release-safety` **145/0**, `tsc` local-api **Exit 0**, `tsc` domain **Exit 0** |

**Die Gegenprobe über den Meßort selbst** — die Warnung aus T-342, daß ein `tsc` in einer kaputten
Kopie „Exit 0" sagen kann: Ein absichtlicher Typfehler (`const pruef: number = "keine Zahl";` in
`latest()`) macht `tsc` in `baum/` **Exit 2** mit `TS2322` an der richtigen Zeile. Die Kopie sieht
also, was sie sehen soll. Ohne diesen Lauf wäre jedes „Exit 0" unten eine Aussage über die Kopie.

---

## 1 Teil 1 — Regel G, und die fünfte bis achte Gestalt

Regel G (`apps/web/scripts/proof-surface.mjs`, Abschnitt 7) verlangt: jedes JSX-Element, dessen
**Klassenliste** den Namen `scrim` enthält, steht lexikalisch im gezeichneten Argument eines
`createPortal(…, document.body)`. Die vier Gestalten aus R-32 habe ich **nicht** nachgefahren —
T-341 hat sie beidseitig gemessen, und ihre Zahlen sind in sich schlüssig.

Gebaut habe ich vier neue Klassen von Gestalten, dazu zwei Fragen an die Gattung der Regel.
**Alle acht kommen durch.**

| | Gestalt | `tsc` | `proof:surface` | Ernte des Laufs |
|---|---|---|---|---|
| Nullpunkt | — | Exit 0 | **34 / 0** | 1, davon 1 verankert |
| **G-1** | Klassenliste in einem Schablonenliteral mit Einsetzung | Exit 0 | **34 / 0 grün** | **1** |
| **G-2** | Klasse aus einem Bezeichner (`const ABDUNKLUNG = "scrim"`) | Exit 0 | **34 / 0 grün** | **1** |
| **G-3** | `createElement("div", { className: "scrim" }, …)` — kein JSX | Exit 0 | **34 / 0 grün** | **1** |
| **G-4** | ein **eigener** Name `createPortal`, der nichts portaliert | Exit 0 | **34 / 0 grün** | **2, davon 2 verankert** |
| **G-5** | dieselbe Abdunklung unter dem Namen `rueckfrage-flaeche`, samt `position: fixed; inset: 0` | Exit 0 | **34 / 0 grün** | **1** |
| **G-6** | `onDismiss` ruft `onConfirm` — Escape ist Zustimmung | Exit 0 | **34 / 0 grün** | 1 / 1 |
| **G-7** | derselbe eigene `createPortal` gegen **Regel F** | Exit 0 | **34 / 0 grün** | `.app`: **7 Kinder, 4 „durch ein Portal"** |
| **G-8** | `.scrim { position: static }` — Portal bleibt, Eigenschaft fällt | Exit 0 | **34 / 0 grün** | 1 / 1 |

Alle acht sitzen im Rumpf von `features/todos/Attachments.tsx` beziehungsweise in
`shared/ui/ConfirmDialog.tsx`, `app/App.tsx`, `styles/components.css` — den Orten aus R-31/R-32.
Nach jeder Gestalt ist die Kopie aus dem Arbeitsbaum zurückgeschrieben und der Nullpunkt
nachgefahren.

### 1.1 Die vier Klassen — und drei davon sind mehr als ein blinder Fleck

**(a) Die Klasse wird nur als Zeichenkette gelesen** (G-1, G-2). `classTokensOf`
(`proof-surface.mjs:345`) sammelt aus dem `className`-Ausdruck jeden `StringLiteral` und jedes
`NoSubstitutionTemplateLiteral`. Ein `TemplateHead` ist keines von beiden, ein Bezeichner erst
recht nicht. Der Lauf **schweigt** über einen Ausdruck, den er nicht lesen kann. Das ist die
unsichere Richtung — und T-341 hat für die Zwischenstufe (`createPortal(<Innen />, …)`) zwölf
Zeilen weiter oben ausdrücklich die sichere gewählt und meldet dort lieber zuviel. Dieselbe
Entscheidung fehlt an der Klassenliste.

**(b) `createPortal` wird am Namen geglaubt** (G-4, G-7). Beide Regeln entscheiden über
`callee(node) === 'createPortal'` (`:1118` Regel F, `:1339` Regel G) und nie darüber, ob der Name
aus `react-dom` stammt. Vier Zeilen:

```
const createPortal = (knoten: ReactElement, _ziel: unknown): ReactElement => knoten;
```

Danach hängt die Abdunklung wieder an ihrer Karte — und die Schlußzeile des Laufs sagt
`Flächen mit der Klasse scrim: 2, davon 2 in einem createPortal(…, document.body)` und nennt
Datei und Zeile. **Das ist keine Blindheit, sondern eine falsche Zusage.** Dieselben vier Zeilen
nehmen ein beliebiges direktes Kind von `.app` aus Regel F heraus: G-7 fügt ein `.fremdband` ohne
Rasterzuordnung ein, der Lauf bleibt 34/0 und meldet `7 direkte Kinder … 4 durch ein Portal am
Dokumentkörper`. **Eine Zeile behebt beides.**

**(c) Der Klassenname ist nicht die Anforderung** (G-3, G-5). A-25.6 und E-116 sprechen von
**Bestätigungsflächen**, nicht von `.scrim`. G-5 ist zeichengleich dieselbe Abdunklung unter einem
zweiten Namen. Die Menge ist am Stilblatt vollständig aufspannbar: `position: fixed` steht in
`apps/web/src/styles/**` an **genau vier** Stellen — `base.css:299` (`.skip-link`), `app.css:768`
(`.toast-layer`), `app.css:5038` (`.idle-reminder`), `components.css:2436` (`.scrim`). Drei davon
stehen unter keiner Zusage. `.idle-reminder` ist dabei nicht theoretisch: Sie ist die Fläche, über
die A-24 inaktive Zeit zuordnen läßt, und sie steht **heute** richtig — `TimerProvider` in
`App.tsx:217` liegt über `.app`, die Fläche ist Geschwister von `.app` unter `#root`. Gemessen hat
das niemand; es ist eine Eigenschaft der Providerreihenfolge und nicht eine zugesicherte. Damit
ist die offene Frage 3 aus T-341 beantwortet: **ja**, aber nicht über drei weitere Namen, sondern
über die Eigenschaft.

**(d) Die Gattungsfrage — Verankerung oder Erreichbarkeit?** Weder das eine noch das andere.
Regel G sichert eine **Stelle im Quelltext** zu. Daß daraus eine Verankerung folgt, hängt an zwei
Annahmen, die kein Lauf mißt: daß `createPortal` das echte ist (G-4 bricht sie) und daß `.scrim`
`position: fixed` trägt (G-8 bricht sie — der Lauf bleibt 34/0 und meldet weiter „1 von 1
verankert", während die Fläche gar nicht mehr positioniert ist). Die **zweite Achse aus E-116** —
erreichbar **und** fangend — ist gar nicht berührt: G-6 macht Escape zur Zustimmung, 34/0 grün.
A-25.6 hat fünf Teilsätze („hängt am Fenster", „vollständig sichtbar", „rollt nicht weg", „fängt
den Tastaturfokus", „Abbrechen ist nie Zustimmung"); Regel G trägt den ersten, für eine Teilmenge
der Flächen, unter zwei ungemessenen Annahmen. Das ist keine Schwäche der Regel, sondern die
Grenze ihrer Gattung — sie gehört in ihren Kopf, wo heute zwei andere Grenzen schon stehen.

### 1.2 Was an Regel G **richtig** ist, und es ist nicht wenig

Die Ernte vor dem Urteil zählt die eigene Menge und leiht sich keine fremde; die Untergrenze ist
in einer Gegenprobe gemessen; die Unterscheidung zwischen gezeichnetem Argument und Ziel ist
gebaut und in `scrim--blocking`/`scrimmage`/`unterscrim` am Wortlaut gegengeprobt; die
Falschmeldung bei einer Zwischenstufe steht als bewußte Wahl im Quelltext. Die vier Gestalten aus
R-32 sind rot. Der Fall, um den R-32 geschrieben wurde, ist zu.

---

## 2 Teil 2 — 6h, 6i, 6j, mit zwei eigenen Ausschaltern

Nullpunkt selbst nachgefahren: `proof:release-safety` **145/0** im Arbeitsbaum **und** in der
Meßkopie.

| | Gestalt | `tsc` | `release-safety` | Einheitenprüfungen |
|---|---|---|---|---|
| **K-9a** | `checkVersion` (`packages/domain/src/version.ts`) weist jede Fassung ab | Exit 0 | **145 / 0 grün** | `domain/test/version.test.ts` **31 von 81 rot** |
| **K-9b** | `versionCheckDelayWithJitter` gibt mindestens 2³¹−1 ms zurück | Exit 0 | **145 / 0 grün** | dieselbe Datei **17 von 81 rot** |
| **K-10** | `const { env } = await import('node:process')` in `latest()` | Exit 0 | **144 / 1 rot** | — |
| **K-10b** | dasselbe im Prüfmodul | Exit 2 | **144 / 1 rot** | — |
| **K-10c** | dasselbe, Quellname **gerechnet**: `await import(teile.join(':'))` | Exit 0 | **145 / 0 grün** | `apps/local-api/test/version` **49 / 49 grün** |

### 2.1 Die Zusage, die 6i trägt: es gibt einen dritten Weg

Der Satz bei `MODUL_LAUFZEITNAMEN` lautet: „Ein Modul kann auf genau zwei Wegen an etwas
herankommen, das es nicht selbst erklärt hat — über eine **Einfuhr** oder über einen **freien
Namen** … Zusammen ist das eine **geschlossene** Aussage."

**K-10 zeigt zuerst, wie gut die Tür sitzt.** Die Einfuhrliste (Gestalt 5, T-290) liest auch die
**dynamische** Einfuhr und meldet `node:process` mit Ort und Grund. `import.meta` ist ebenfalls
bedacht — `freieLaufzeitnamen` behandelt `ts.isMetaProperty` ausdrücklich. Beides sind Türen, die
ich zu finden hoffte und geschlossen vorgefunden habe.

**K-10c ist die dritte.** `await import(teile.join(':'))` ist keines von beidem: Der Quellname
steht in keiner Einfuhrliste, weil er zur Übersetzungszeit nicht dasteht; einen freien Namen gibt
es nicht, weil `import` ein Schlüsselwort ist und `teile` wie `env` gebunden sind. Wirkung am
Modul gemessen, mit gestellter Attrappe für `fetch`:

```
Nullpunkt                          Anfragen 1   {"ok":true,"version":"99.0.0"}
K-10c ohne Umgebungsvariable       Anfragen 1   {"ok":true,"version":"99.0.0"}
K-10c mit TAKT_SKIP_UPDATE_CHECK=1 Anfragen 0   {"ok":false,"reason":"no_release"}
```

`no_release` ist der Grund, den A-18 **still** behandelt. Der Ausschalter ist in jedem Lauf grün,
in den 49 Einheitenprüfungen grün und im Betrieb unsichtbar, bis ihn jemand setzt. Das Gegenmittel
ist klein und steht als **A-A-117**: Für die beiden Entscheidungsmodule ist ein `import(…)` mit
einem Argument, das kein Zeichenkettenliteral ist, ein Befund. Bis dahin gehört der Satz im
Quelltext auf das gekürzt, was gemessen ist.

### 2.2 Die Einteilung in vier Arten: die Taxonomie trägt, die Aufzählung darin nicht — und die Naht

**K-9 ist eine fünfte Art von Stelle.** `packages/domain/src/version.ts` liegt im gelesenen Baum
(`SOURCE_ROOTS` führt `@takt/domain`), liegt auf dem Weg und wird über eine **festgenagelte
Einfuhr** erreicht — festgenagelt ist aber der **Name**, nicht der Rumpf dahinter. Die
Zeichenkette `packages/domain` kommt in `proof-release-safety.mjs` **kein einziges Mal** vor. Die
Aufzählung unter Art (III) nennt sechs Stellen und diese nicht; sie ist damit wieder eine Liste
der bekannten Fälle — genau die Bauart, gegen die T-342 eine Ebene höher geschrieben ist.

**Der Preis ist klein, und das gehört dazu:** Die Einheitenprüfungen fangen beide K-9-Gestalten,
31 beziehungsweise 17 rote Fälle. Das ist die richtige Arbeitsteilung. Der Satz, der zu weit ist,
ist nicht „der Lauf mißt zu wenig", sondern „zusammen ist das geschlossen".

**Und die Taxonomie trägt eine Naht.** Die vier Arten trennen **Stellen**; gemessen werden aber
**Eigenschaften von Stellen**. Der Rumpf von `latest()` ist zugleich Art (I) — seine Einfuhren und
seine freien Namen sind festgenagelt — und Art (III) für alles übrige, und genau in diesem Rest
sitzt K-10c. Eine Einteilung, die Vollständigkeit tragen soll, ist an der **Eigenschaft**
aufzuspannen und nicht an der Stelle; sonst ist „alle vier Arten benannt" keine Aussage über
Abdeckung. Das ist dieselbe Bewegung wie die, die T-342 an der Lückenliste gemacht hat — eine
Ebene weiter.

### 2.3 Was an 6h, 6i und 6j **richtig** ist

6h und 6j sind an der Stelle aufgespannt und nicht an einer Schreibweise; die Trennung in „steht
unbedingt" und „ist zeichengleich" gibt zwei unabhängige Zeilen; `verzweigungUeber` neben
`bedingungUeber` ist begründet und im Quelltext unterschieden; jede Meldung nennt ihren
Bestätigungsort; die Zählvorschrift ist offengelegt, einschließlich der einen ausdrücklich
gebrochenen Regel (34 → 35). Der eigene Beleg aus T-335 ist **berichtigt statt stillschweigend
ersetzt** — das ist der Punkt, an dem dieser Lauf sich von den meisten unterscheidet.

### 2.4 Die Abgrenzung zu K-4 und der Weg von R-33 — sie trägt, die Reihenfolge dreht sich

**„Die Stelle ja, die Klasse nein" ist richtig** und an der richtigen Kante gezogen: 6j mißt den
Ausdruck, in dem die Auskunft den Zusammenbau verläßt, und weiter reicht ein Leser dieses Baums
nicht. Zwei Messungen ordnen die beiden vorgeschlagenen Gegenmittel neu:

- **Der zweite, kleine Lauf über den Weg von `versionState` bis zum Dialog würde K-9 nicht
  sehen.** Er begänne bei `versionState`; K-9a sitzt drei Nähte davor, in einem fremden Paket.
  Wer die Klasse „die Meldung kommt nicht an" schließen will, fängt **vor** `current()` an.
- **TP-VER-10 sieht K-10c nicht.** Der Prüffall stellt die Umgebung selbst
  (`tests/e2e/support/services.ts:257`, `version-check-services.ts:102`) und setzt
  `TAKT_SKIP_UPDATE_CHECK` nicht. Ein **bedingter** Ausschalter ist für eine Verhaltensmessung
  unsichtbar, solange sie die Bedingung nicht herstellt.

Daraus: **TP-VER-10 fängt, was unbedingt abschaltet** (K-4, K-9a, K-9b); **die Türanalyse fängt,
was bedingt abschaltet** (K-10, K-10c). Keiner ersetzt den anderen. R-33 ist auf dem richtigen
Weg — der zweite Lauf ist aber nicht der nächste Schritt, sondern der dritte.

Beiläufig gegengeprüft und in Ordnung: `TAKT_E2E_GITHUB_STUB_URL` steht ausschließlich in
`tests/e2e/support/**` und in keiner Datei unter `apps/local-api/src/**` — die Naht der
Prüfattrappe liegt im Prüfeinstieg und nicht im Erzeugnis (A-18.3).

---

## 3 Teil 3 — die billigen Fragen an T-341

- **Keine neue Adresse, kein neuer Datenweg.** In dieser Welle ist **kein einziger Laufzeitpfad**
  geändert: T-341 fasst zwei Stilblätter und einen Prüflauf an, T-342 einen Prüflauf. Die beiden
  Stilblätter tragen kein `url(…)`, kein `@import`, kein `image-set`, keine Adresse (gemessen über
  beide Dateien, null Treffer).
- **Keine Erweiterung der CSP.** `apps/desktop/**` ist unberührt, `tauri.conf.json` damit auch;
  `proof:shell-surface` **7 Prüfungen und 54 Gegenproben**, Exit 0.
- **Ist etwas sichtbar geworden, was verdeckt sein sollte?** **Nein.** Die Reserve
  (`viewport-layout.css:263`) gibt `.screen__header` und `.screen__bar` ein Polster in Ringhöhe
  und denselben Betrag als negativen Rand; die **Klippkante** wandert um 4 px nach außen, 5 px
  unter `prefers-contrast: more`. In diesem Band steht nichts, was verdeckt sein müßte:
  `.visually-hidden` hängt an `clip-path: inset(50%)` bei 1 px Größe und ist von einem Polster des
  Behälters unberührt; `.done-switch input` ist `opacity: 0`; die einzige aufklappende Fläche der
  Hülle (`.gsearch__panel`, `position: absolute`) steht in `.app__header` (`App.tsx:360`) und
  nicht in einem Bildschirmkopf. In `.screen__header` und `.screen__bar` gibt es keinen absolut
  positionierten Nachfahren.
- **Ist etwas verdeckt worden, was sichtbar sein muß?** **Nein.** Der Zwischenraum ist
  `--space-5` = 20 px; bei 4 px Reserve je Kante bleiben 12 bis 16 px, bei 5 px 10 bis 15 px. Die
  Kästen berühren sich nicht — und selbst wenn, malte das spätere Geschwister über den Kopf und
  nicht umgekehrt, denn beide liegen im selben Stapelzusammenhang.
- **A-25.5 und A-25.6** sind gelesen. A-25.6 ist der Wortlaut, an dem Regel G zu messen ist, und
  Abschnitt 1.1 (d) sagt, welchen seiner fünf Teilsätze sie trägt. A-25.5 berührt der Nebenfund
  aus T-341 Abschnitt 6 (`ScreenFrame` mit `tabIndex={0}` auf einem Kasten, der in zehn von elf
  gemessenen Fällen nicht läuft); das ist eine Frage an ux-designer und keine an mich.

---

## 4 Läufe, jeder mit Zahl

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **Exit 0**, acht Pakete plus Prüf- und E2E-Konfigurationen |
| `pnpm boundaries` | **Exit 0**, 528 Quelldateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm audit` | **No known vulnerabilities found** |
| `pnpm proof:surface` | **34 / 0** |
| `pnpm proof:release-safety` | **145 / 0** |
| `pnpm proof:shell-surface` | **7 Prüfungen und 54 Gegenproben**, Exit 0 |
| `pnpm proof:clamp` | 21 / 0 |
| `pnpm proof:locked` | 9 / 0 |
| `pnpm proof:foreign` | 21 / 0 |
| eigene Meßläufe | 8 Gestalten × (`tsc` + `proof:surface`), 6 Gestalten × (2 × `tsc` + `proof:release-safety`), 3 Einheitenläufe (81 / 81 / 49 Fälle), 3 Wirkungsmessungen am Modul |
| **nicht gefahren** | `verify:bundle` und `test:e2e` (**Ports vergeben**, T-345); `test:coverage` als Ganzes, `test:rust`, `build`, `proof:engines`, `proof:all` als Ganzes; die portgebundenen Nachweise (`proof:access`, `conflicts`, `tags`, `export-api`, `addin-wiring`) |
| **Semgrep** (SAST, Geheimnisse, Lieferkette) | **nicht gefahren** — „Not logged into Semgrep Guardian", unverändert seit T-325. Eine Anmeldung nehme ich nicht von mir aus vor |
| **42Crunch-Audit** | **nicht gefahren.** `apps/local-api/openapi/**` ist in dieser Welle unberührt; der letzte Stand ist der aus T-320. **42Crunch-Scan:** nicht gefahren — kein laufender Dienst, und die Ports sind vergeben |

---

## 5 Vorschläge für `risks.md` (einträgt und schließt der Orchestrator)

**R-32 — offen lassen, fortschreiben.**

> **Fortgeschrieben am 2026-09-13 (T-347).** Regel G ist gebaut und fängt die vier Gestalten, um
> die R-32 geschrieben wurde (T-341, beidseitig gemessen). **Geschlossen ist R-32 damit nicht:**
> vier weitere Gestalten derselben Klasse kommen mit `tsc` Exit 0 und `proof:surface` **34/0**
> durch — die Klasse aus einem Schablonenliteral (G-1) oder einem Bezeichner (G-2), eine
> Abdunklung ohne JSX über `createElement` (G-3), dieselbe Abdunklung unter einem zweiten
> Klassennamen samt `position: fixed` im Stilblatt (G-5). **Die schwerste ist G-4:** vier Zeilen
> mit einem **eigenen** Namen `createPortal` lassen den Lauf die Fläche als *verankert* **melden**
> — Ernte „2, davon 2 in einem createPortal(…, document.body)" —, während sie an ihrer Karte
> hängt; dieselben vier Zeilen nehmen ein Kind von `.app` aus Regel F heraus (G-7, Portalzähler
> 3 → 4). Dazu zwei Gattungsgrenzen: `.scrim { position: static }` bleibt grün (G-8), und Escape
> als Zustimmung bleibt grün (G-6) — Regel G sichert eine Stelle im Quelltext zu, nicht die
> Verankerung und nicht die Erreichbarkeit. Gegenmittel **A-A-112 bis A-A-116** (Bedrohungsmodell
> 44.5); A-A-112 kostet eine Zeile und behebt G-4 und G-7 zugleich. **Dringend ist keines:** Heute
> erzeugt genau eine Stelle die Klasse, sie geht durch das echte Portal, und `.idle-reminder`
> hängt über `.app`. R-32 bleibt bis A-A-112 und A-A-113 offen.

**R-30 — offen lassen, um einen Satz ergänzen.**

> **Ergänzt am 2026-09-13 (T-347).** 6i schließt die beiden `process.env`-Gestalten und
> zusätzlich die dynamische Einfuhr mit literalem Quellnamen (T-347 K-10, 144/1 rot). **Die
> Zusage daneben trägt nicht:** „genau zwei Wege … zusammen geschlossen" ist mit **K-10c**
> widerlegt — `await import(teile.join(':'))` steht in keiner Einfuhrliste und ist kein freier
> Name; `tsc` Exit 0, **145/0 grün**, 49 von 49 Einheitenprüfungen grün, am Modul gemessen **0
> statt 1** ausgehende Anfrage. Gegenmittel **A-A-117**. Dazu **A-A-118**: der Rumpf einer
> Funktion aus einem **anderen Paket** hinter einer festgenagelten Einfuhr ist eine fünfte Art von
> Stelle und steht in keiner der vier — `packages/domain` kommt im Lauf nicht vor (K-9a/K-9b:
> `tsc` Exit 0, 145/0 grün; gefangen von den Einheitenprüfungen mit 31 beziehungsweise 17 roten
> Fällen, nicht von diesem Lauf). A-A-106 bleibt unverändert offen.

**R-33 — halbieren wie von T-342 vorgeschlagen, mit einer geänderten Reihenfolge.**

> **Zusatz vom 2026-09-13 (T-347).** Die Abgrenzung „die Stelle ja, die Klasse nein" trägt. Die
> Reihenfolge der beiden Gegenmittel kehrt sich um: **TP-VER-10 zuerst** — er fängt, was
> *unbedingt* abschaltet (K-4, K-9a, K-9b), und T-345 verknüpft ihn gerade. **Die Türanalyse
> zweitens** — sie fängt, was *bedingt* abschaltet, und genau das sieht keine
> Verhaltensmessung: TP-VER-10 stellt die Umgebung selbst und setzt `TAKT_SKIP_UPDATE_CHECK`
> nicht. **Der zweite, kleine Lauf über den Weg von `versionState` bis zum Dialog zuletzt** — er
> begänne hinter der Stelle, an der K-9 sitzt.

---

## 6 Annahmen

1. **Keine Gestalt lag im Arbeitsbaum.** Der Auftrag sagt „`apps/**` steht still", und T-345
   baut in dieser Welle. Deshalb zwei Meßkopien statt der sonst üblichen Mutation im Baum — mit
   dem Preis, daß jede Zahl zuerst am Meßort belegt werden mußte (Abschnitt 0).
2. **Die vier Gestalten aus R-32 habe ich nicht nachgefahren.** T-341 hat sie beidseitig gemessen,
   die Zahlen sind in sich schlüssig, und mein Auftrag war die fünfte. Wer sie unabhängig
   bestätigt haben will, sagt es.
3. **Die Wirkung von G-1 bis G-5 habe ich nicht im Browser gemessen.** G-1 bis G-4 erzeugen im
   Baum zeichengleich denselben Knoten wie T-337 K-8 (`<div class="scrim">` unter `.card`), und
   dessen Wirkung ist über 19 Paletten gemessen; G-5 unterscheidet sich davon nur im Namen und
   trägt dieselben drei Eigenschaften. Das ist eine Herleitung aus einer vorhandenen Messung und
   keine neue Zahl — so gekennzeichnet.
4. **Ob ein gerechneter Quellname den Bündler des Sidecars übersteht, ist nicht gemessen**
   (`verify:bundle`, Ports vergeben). Für die Aussage über den **Wächter** ist das ohne Belang;
   für die Aussage über das Erzeugnis wäre es zu prüfen, bevor jemand K-10c als „im Betrieb
   wirksam" zitiert.
5. **Zu A-A-110/A-A-111** (offene Frage 1 aus T-342): Die Beschriftung im Bedrohungsmodell 43.9 —
   A-A-110 ist die **Auskunft** (K-4), A-A-111 der **Rumpf von `store.write`** (K-7) — ist die
   meine; sie stammt aus meinem eigenen Bericht T-337, und T-342 ist ihr richtig gefolgt.
   Abschnitt 44 führt sie unverändert weiter.

---

## 7 Risiken

- **G-4 ist die einzige der acht Gestalten, die eine falsche Zusage erzeugt statt einer fehlenden.**
  Ein Lauf, der „1 von 1 verankert" meldet, während nichts verankert ist, ist schlimmer als
  Schweigen: Er wird zitiert. Das ist der Grund, warum A-A-112 vor allen anderen steht.
- **Heute ist nichts kaputt.** Genau eine Stelle erzeugt die Klasse `scrim`, sie geht durch das
  echte Portal von `react-dom`; `.idle-reminder`, `.toast-layer` und `.skip-link` hängen an
  Stellen, an denen kein Vorfahr `backdrop-filter` trägt. Der Preis aller sieben Auflagen fällt
  beim nächsten Dialog und bei der nächsten festen Fläche an.
- **K-10c verlangt fremden Code im Bestand und eine gesetzte Umgebungsvariable.** Wie K-4 und K-7
  ist es keine Lücke, die ein Angreifer von außen betritt, sondern eine, durch die eine Änderung
  am Bestand unbemerkt durch das Tor käme. Der Schaden wäre still: keine Versionsprüfung, kein
  Hinweis, kein Protokollhinweis an der Oberfläche — bei unsignierten Erzeugnissen der einzige
  Weg, auf dem eine Sicherheitsbehebung den Benutzer erreicht (R-30).
- **Sicherheitsseitig sonst nichts Neues.** Keine Adresse, keine Route, kein Datenweg, kein
  Laufzeitpfad geändert; Semgrep und 42Crunch stehen unverändert aus.

---

## 8 Offene Fragen an den Orchestrator

1. **A-A-112 in dieselbe Welle wie A-A-113?** Beide liegen in `proof-surface.mjs`, beide gehören
   frontend-dev, und A-A-112 ist eine Zeile. Getrennt gebaut hieße, denselben Wächter zweimal
   anzufassen.
2. **A-A-114 spannt die Menge am Stilblatt auf.** Das zieht `.toast-layer`, `.skip-link` und
   `.idle-reminder` unter eine Zusage, die sie heute nicht tragen. Soll das ein Auftrag an
   frontend-dev sein, oder erst eine Entscheidung darüber, welche dieser drei überhaupt
   Bestätigungsflächen im Sinne von A-25.6 sind? Ich halte `.idle-reminder` für eine.
3. **A-A-116 gehört e2e-tester** und berührt `tests/e2e/**`, wo T-345 gerade arbeitet — also
   nächste Welle.
4. **A-A-117 und A-A-118 gehören domain-dev** und liegen beide in
   `apps/local-api/scripts/proof-release-safety.mjs`. A-A-117 ist klein; A-A-118 ist zuerst eine
   Frage („welche Eigenschaft je Art?") und dann eine Zeile.
5. **`~/.cache/t332*` (320 MB)** liegt weiterhin dort und kann nur der Benutzer löschen (T-337
   Frage 3, T-342 Frage 5). Meine eigenen Meßkopien (506 MB) sind abgeräumt und nachgeprüft.

---

## Kurzfassung

```
Aufgabe: T-347 — Sicherheitsfreigabe über T-341 und T-342
Status: braucht Review — Teil 1 nicht freigegeben, Teil 2 freigegeben mit Nacharbeit, Teil 3
  freigegeben
Artefakte: docs/bedrohungsmodell.md (neuer Abschnitt 44, Auflagen A-A-112 bis A-A-118),
  .claude/team/reports/T-347-security-checker.md
Zusammenfassung: Regel G fängt die vier Gestalten aus R-32 — und acht weitere kommen durch, jede
  mit tsc Exit 0 und proof:surface 34/0: die Klasse aus einem Schablonenliteral (G-1) oder einem
  Bezeichner (G-2), eine Abdunklung ohne JSX über createElement (G-3), dieselbe Abdunklung unter
  einem zweiten Klassennamen samt position: fixed (G-5), Escape als Zustimmung (G-6) und
  `.scrim { position: static }` (G-8). Die schwerste ist G-4: vier Zeilen mit einem eigenen Namen
  `createPortal` lassen den Lauf die Fläche als verankert **melden** — Ernte „2, davon 2 in einem
  createPortal(…, document.body)" —, während sie an ihrer Karte hängt; dieselben vier Zeilen
  nehmen ein Kind von `.app` aus Regel F heraus (G-7, Portalzähler 3 → 4). Ursache ist eine
  Zeile in zwei Regeln: `callee(node) === 'createPortal'` ohne Blick auf die Herkunft des Namens.
  Regel G sichert damit weder Verankerung noch Erreichbarkeit zu, sondern eine Stelle im
  Quelltext unter zwei ungemessenen Annahmen; A-25.6 hat fünf Teilsätze, sie trägt den ersten für
  eine Teilmenge der Flächen. Beim Versionswächter ist 6i besser, als die Frage erwartet hat —
  die dynamische Einfuhr mit literalem Quellnamen ist rot (K-10, 144/1), import.meta ist bedacht.
  Widerlegt ist trotzdem der Satz „genau zwei Wege, zusammen geschlossen": `await
  import(teile.join(':'))` mit gerechnetem Quellnamen ist ein dritter — tsc Exit 0, 145/0 grün,
  49 von 49 Einheitenprüfungen grün, am Modul gemessen 0 statt 1 ausgehende Anfrage. Und eine
  fünfte Art von Stelle fehlt in der Einteilung: der Rumpf einer Funktion aus packages/domain
  hinter einer festgenagelten Einfuhr (K-9a/K-9b, 145/0 grün; gefangen nur von den
  Einheitenprüfungen, 31 beziehungsweise 17 rote Fälle). Teil 3 ist sauber: kein Laufzeitpfad in
  dieser Welle geändert, keine Adresse in den beiden Stilblättern, proof:shell-surface 7 + 54,
  und die Fokusring-Reserve legt genau das Band frei, das der Ring braucht — darin steht nichts,
  was verdeckt sein müßte, und nichts Sichtbares wird verdeckt (12 bis 16 px Zwischenraum
  bleiben).
Annahmen: (1) Keine Gestalt lag im Arbeitsbaum — zwei Meßkopien, beide am Nullpunkt belegt, und
  ein absichtlicher Typfehler beweist, daß tsc in der Kopie Exit 2 sagen kann. (2) Die vier
  Gestalten aus R-32 habe ich nicht nachgefahren; T-341s Zahlen sind in sich schlüssig, mein
  Auftrag war die fünfte. (3) Die Wirkung von G-1 bis G-5 ist aus T-337 K-8 hergeleitet und nicht
  neu im Browser gemessen — so gekennzeichnet. (4) Ob ein gerechneter Quellname den Bündler des
  Sidecars übersteht, ist nicht gemessen (verify:bundle, Ports vergeben).
Risiken: G-4 erzeugt als einzige eine falsche Zusage statt einer fehlenden — ein Lauf, der „1 von
  1 verankert" meldet, während nichts verankert ist, wird zitiert. Heute ist nichts kaputt: genau
  eine Stelle erzeugt die Klasse, sie geht durch das echte Portal, .idle-reminder hängt über
  .app. K-10c verlangt fremden Code und eine gesetzte Umgebungsvariable; der Schaden wäre still.
  Semgrep unverändert nicht angemeldet, 42Crunch nicht gefahren (OpenAPI unberührt, Ports
  vergeben).
Offene Fragen: (1) A-A-112 und A-A-113 in dieselbe Welle? (2) Gilt .idle-reminder als
  Bestätigungsfläche nach A-25.6 — dann zieht A-A-114 sie unter die Zusage. (3) A-A-116 gehört
  e2e-tester und damit in die nächste Welle. (4) A-A-117/A-A-118 gehören domain-dev.
  (5) ~/.cache/t332* (320 MB) kann nur der Benutzer löschen; meine 506 MB sind abgeräumt.
Nächster Schritt: A-A-112 an frontend-dev — eine Zeile, die G-4 und G-7 zugleich behebt, mit
  beiden Gestalten als Gegenproben. Parallel A-A-117 an domain-dev. Danach A-A-113/A-A-114 in
  einem Auftrag (beide betreffen die Menge, die Regel G erntet), A-A-115 daneben, und A-A-116 an
  e2e-tester, sobald tests/e2e frei ist. R-32 bleibt offen, R-30 bekommt einen Satz, R-33 wird
  halbiert — Wortlaute stehen in Abschnitt 5.
```
