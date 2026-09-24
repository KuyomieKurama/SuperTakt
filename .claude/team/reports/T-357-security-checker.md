# T-357 — Sicherheitsfreigabe über T-348, T-349 und T-350

**Rolle:** security-checker. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie (in ihr stehen
die unveröffentlichten Stände der parallelen Wellen).
**Vorlagen:** `.claude/team/reports/T-348-frontend-dev.md`, `T-349-domain-dev.md`,
`T-350-domain-dev.md`, `T-347-security-checker.md`, `T-337-security-checker.md`;
`docs/spec.md` A-25.6, A-18.11/A-18.12, A-20; `.claude/team/risks.md` R-30 bis R-34;
`docs/bedrohungsmodell.md` 43 und 44.

**Geänderte Dateien — zwei, beide in eigener Hoheit:**

| Datei | Was |
|---|---|
| `docs/bedrohungsmodell.md` | **Abschnitt 45** neu: 45.1 bis 45.6, Auflagen A-A-119 bis A-A-127, Urteil je Teil |
| `.claude/team/reports/T-357-security-checker.md` | dieser Bericht |

`apps/**`, `packages/**`, `tests/**`, `docs/**` außer dem Bedrohungsmodell, `risks.md`,
`board.md`, `decisions.md` sind **nicht** angefaßt. Jede Gestalt lief einzeln im Arbeitsbaum und
ist aus einer Sicherung zurückgeschrieben; jede berührte Datei ist danach byteweise gleich
(`md5` je Gestalt, und `git status` über `apps/web/src/styles/components.css`,
`theme-palettes.css`, `apps/web/src/features/todos/Attachments.tsx`,
`apps/local-api/src/features/version/version.ts` leer beziehungsweise unverändert gegenüber dem
Stand vor meinem Lauf).

**Ports.** `verify:bundle` und `test:e2e` **nicht gefahren**. Die Browsermessung läuft über
`page.setContent` — kein Port. Die eine Netzmessung bindet einen **flüchtigen** Port auf
`127.0.0.1` (40707 im Lauf) und schließt ihn; 17843, 17844 und 5173 waren vor und nach jedem Lauf
frei (`ss -ltn`). Meßkopien im Kratzbereich: sieben Meßskripte und eine Sicherung von
`proof-surface.mjs`, zusammen rund 130 KB; **keine Baumkopie angelegt**. Die rund 620 MB
fremder Kopien und `~/.cache/t332*` sind **nicht** angefaßt.

---

## 1 Teil 1 — die neunte Gestalt, und es sind elf geworden

Nullpunkt `proof:surface`: **45 bestanden, 0 fehlgeschlagen**; Ernte „Fensterfeste Klassen aus den
Stilblättern: `.scrim`. Flächen darunter: 1, davon 1 in einem `createPortal(…, document.body)`",
„Absagewege: 91". Endpunkt nach allen Gestalten wieder 45/0.

Angesetzt habe ich, wie beauftragt, an der **neuen** Menge.

| | Gestalt | `tsc` | `proof:surface` |
|---|---|---|---|
| **N-1** | zweite Vollfläche mit `position: fixed !important; inset: 0 !important` | Exit 0 | **45/0 grün** |
| **N-2** | `position: var(--feste-lage)` mit `--feste-lage: fixed` | Exit 0 | **45/0 grün** |
| **N-3** | `position: fixed` und `inset: 0` in **zwei** Regeln desselben Selektors | Exit 0 | **45/0 grün** |
| **N-4** | volle Ausdehnung über `top/left/width/height` | Exit 0 | **45/0 grün** |
| **N-5** | `style={{ position: "fixed", inset: 0 }}` — Ausdehnung erst zur Laufzeit | Exit 0 | **45/0 grün** |
| **N-6** | Palette: `.scrim { position: absolute }` | — | **45/0 grün** |
| **N-6b** | Palette: `.scrim { position: static }` | — | **45/0 grün** |
| **N-7** | Palette: `backdrop-filter` auf dem Dokumentkörper | — | **45/0 grün** |
| **H-1** | `if (e.key !== "Escape") return;` → `confirmOpen()` | Exit 0 | **45/0 grün** |
| **H-2** | `switch (e.key) { case "Escape": confirmOpen() }` | Exit 0 | **45/0 grün** |
| **H-3** | Absageweg heißt `onRequestClose` | (Attrappe) | **45/0 grün**, 92 Wege |
| **H-4** | `["Escape","Esc"].includes(e.key)` → `confirmOpen()` | Exit 0 | **45/0 grün** |

**Die Folge ist im Browser gemessen** (1280 × 820, Palette `glass`, echte Stilblätter):

| Fläche | Kasten | Knopf „Öffnen" |
|---|---|---|
| Abdunklung am Dokumentkörper (heute) | 1280 × 820 bei (0, 0) | y = 415, **im Fenster** |
| dieselbe Fläche **in einer Karte** (N-1 bis N-5) | 980 × 11 998 bei (265, −523) | y = 5481, **außerhalb** |
| Palette `position: static` (N-6b) | **1280 × 98 bei (0, 820)** | y = 874, **außerhalb** |
| Palette `position: absolute` (N-6), `backdrop-filter`/`transform` am Körper (N-7) | 1280 × 820 bei (0, 0) | **unverändert** |

Drei Sätze dazu, und der zweite ist der schwere:

1. **Die Menge ist eine über eine Schreibweise.** `!important`, eine Variable, zwei Regeln statt
   einer, `width/height` statt vier Kanten — vier gewöhnliche Stilblattschreibweisen, alle
   außerhalb der Grenze, die T-348 in den Kopf der Regel geschrieben hat. In `glass` und
   `liquid-glass` trägt `.card` ein `backdrop-filter` (`theme-palettes.css:453`), also ist **jede**
   feste Fläche in einer Karte dort an der Karte verankert. Das ist R-31, und der Lauf sieht sie
   nur bei passender Schreibweise.
2. **N-6b ist wieder eine falsche Zusage.** Eine Palettenregel nimmt `.scrim` die Fensterfestigkeit;
   die Klasse bleibt in der Menge, weil die Grundregel in `components.css` weiter gilt, und der
   Lauf meldet „1, davon 1 verankert", während die Fläche gemessen **unter** dem Fenster liegt.
   Dieselbe Gattung wie G-8, die T-348 geschlossen hat — nur unter einem Palettenselektor.
3. **N-7 ist die gute Nachricht, und sie ist gemessen:** Der von T-348 als „mittelbar" bezeichnete
   Weg (umschließender Block am Körper) ist heute wirkungslos, weil der Körperkasten das Fenster
   **ist**. Er wird wirksam, sobald der Körper selbst läuft.

### Die Selbstbeschränkung, in beide Richtungen geprüft

| Teilsatz A-25.6 | Auskunft T-348 | mein Befund |
|---|---|---|
| 1. hängt am Fenster, **in jeder Gestaltung** | ja | **zu weit** — N-1 bis N-5 und N-6b |
| 2. vollständig sichtbar | nein | richtig |
| 3. rollt nicht weg | mittelbar | richtig; Grenze schärfer als vermutet (N-6b statt N-7) |
| 4. fängt den Tastaturfokus | nein | richtig |
| 5. Abbrechen ist nie Zustimmung | ja, Grenze „fremde Datei" | **zu weit** — H-1, H-2, H-4 stehen in **derselben** Datei |

**Zu eng ist die Auskunft nirgends.** Der Lauf beansprucht an keiner Stelle weniger, als er kann;
die beiden „nein" sind richtig, und es gibt keinen Satz in `proof-surface.mjs`, der Teilsatz 2
oder 4 nebenbei doch trüge. Die Fehlrichtung ist einseitig: zweimal **mehr** zugesagt als
gemessen.

**Nit ohne Schwere:** `heading('H …')` steht zweimal — einmal für Regel H, einmal für den Block
der Gegenproben.

---

## 2 Teil 2 — A-A-106 mit eigenem Aufbau

Eigener Meßaufbau (nur das Modul, Attrappen für Quelle und Speicher, Takt 10 ms, Fenster 400 ms):

| Lage des Speichers | Anfragen | Zustand | Protokoll | Schreibversuche |
|---|---|---|---|---|
| schreibt sofort | 40 | `known` | 0 | 40 |
| **antwortet nie** (Frist 20 ms) | **40** | `known` | **2** × `…write_timeout` | 2 |
| wirft (Zusage abgelehnt) | 40 | `known` | 1 × `…unwritable` | 1 |
| wirft **synchron** beim Aufruf | 40 | `known` | 1 × `…unwritable` | 1 |
| **langsam** (200 ms), Frist 20 ms | 40 | `known` | **2** × `…write_timeout` | 2 |
| langsam (15 ms), Frist 20 ms | 40 | `known` | 0 | 40 |
| **blockiert synchron** (150 ms) | **3** | `known` | **0** | 3 |

- **Der Hebel trägt.** Schweigen, Wurf und Trödeln halten die ausgehende Anfrage in keiner Lage
  mehr auf. A-A-106 ist eingelöst.
- **„Genau eine Zeile über die ganze Laufzeit" stimmt nicht.** `forgetStore` prüft nicht, ob der
  Speicher schon abgelegt ist; zwei Fristen, die vor der ersten Ablage gestellt wurden, schreiben
  beide. Im Erzeugnis (Abstand ≥ 1 h, Frist 5 s) bleibt es eine Zeile — die Zusage ist aber eine
  über das Modul. **Eine Zeile behebt es** (A-A-123).
- **Der abgelegte Speicher bleibt abgelegt.** Von 40 Anfragen kommen danach **2** Schreibversuche
  zustande. Eine Datensicherung trägt danach einen **veralteten**, nicht einen fehlenden Zeitpunkt
  — und sieht dabei gültig aus (A-A-124).
- **Zwei Schreibvorgänge, zwei Zeitpunkte.** Späte Schreibvorgänge kommen an; der Bestand ist alt,
  nicht falsch.
- **Stille nach A-18.12 hält ausnahmslos.** In jeder Lage geht `current()` den gewöhnlichen Weg
  (`unknown` → `known`); es entsteht keine Fläche, kein Hinweis, keine Fehlerfläche. Einziger
  Ausgang sind `info`-Zeilen mit Schlüsseln aus dem geschlossenen Vorrat.

### Der nächste Ausgang derselben Klasse — gemessen

| Lage der Quelle | Anfragen | Zustand | Protokoll |
|---|---|---|---|
| `latest` antwortet nie, ignoriert das Signal | **1** | `unknown` | **0** |
| `latest` antwortet nie, **hört** auf das Signal | **1** | `unknown` | **0** |

Total und still. Die zweite Zeile ist der Punkt: Eine wohlerzogene Quelle hilft nicht, weil
niemand abbricht — `control` löst nur `stop()` aus.

**Was ihn eng hält, ist nachgemessen statt geglaubt.** Verdacht: `readBounded(response, signal)`
bekommt das Abschaltsignal und nicht das verbundene, die Gesamtfrist träfe also nur die
Kopfzeilen. Gegen einen eigenen Wirt, der 200 schickt und den Rumpf tropfen läßt:
**Ausgang nach 5 002 ms, `{"ok":false,"reason":"timeout"}`**. Die Frist aus A-V-5 trägt den Rumpf;
das zweite Argument dient nur der Einordnung. Die Zusage in `source.ts:169` stimmt.

### Der fünfte Weg — er braucht kein `await`

Gegen `proof:release-safety` (Nullpunkt **154/0**):

| | Gestalt | `tsc` | Lauf |
|---|---|---|---|
| R-1 | Anfrage in einer örtlichen Hilfsfunktion, davor ein hängendes `await` | Exit 0 | **153/1 rot** |
| R-2 | `await Promise.all([source.latest(…), nie()])` | Exit 0 | **153/1 rot** |
| R-3 | hängendes `await` **hinter** der Anfrage | Exit 0 | **153/1 rot** |
| **R-4** | **kein `await`** — ein synchroner Riegel vor der Anfrage | Exit 0 | **154/0 grün** |

6g-1 hält gegen alles auf einer `await`-Achse, auch gegen zwei Gestalten, die ich für Lücken
hielt. **Seine Achse ist das `await`, und ein Riegel braucht keines.** R-4 in `run()` friert den
Dienst ein und ist laut; die **leise** Fassung ist der synchron blockierende Speicher (40 → 3
Anfragen, Protokoll leer). Der Port sagt den Fall in seinem eigenen Kommentar an, der Lauf nicht.

**Antwort auf die beiden gestellten Fragen:**

- **Der Satz „ein fünfter Weg ist nicht ausgeschlossen" ist richtig** — und jetzt belegt.
- **R-30 ist damit noch nicht richtig beschrieben:** Der Eintrag führt die Klasse als „ein fremdes
  Versprechen auf dem Weg hängt". Die zweite Achse fehlt: „ein fremder Aufruf kehrt **synchron**
  nicht zurück".
- **Die schwächere Reihenfolgezusage ist folgenlos** — für A-20, weil ein veralteter oder
  fehlender `last_version_check_at` höchstens **eine zusätzliche Anfrage je Programmstart** kostet
  (der Boden hängt innerhalb eines Laufs am Arbeitsspeicher, und die erste Prüfung geht seit T-285
  ohnehin hinaus); für den **übersprungenen Fassungswert** vollständig, weil er über die
  Einstellungen läuft (`settings/routes.ts:47`) und diesen Speicher nie berührt.

---

## 3 Teil 3 — R-34, bewertet

Gemessen über die Anwendungsfälle, ohne HTTP, mit der Standardvorlage:

| Fall | Start im Archiv | verwaist? | gebuchte Dauer | Exportzeile |
|---|---|---|---|---|
| 1a | 11 h vor jetzt, Lebenszeichen +20 min | **nein** | **39 600 s** | `{"Call":"999001","Zeit":11,…}` |
| 1b | 1970-01-01 | **nein** | 1 789 300 800 s | `"Zeit": 497 028` |
| 1c | 1000-01-01 | **nein** | 32 399 524 800 s | `"Zeit": 8 999 868` |
| 1d | 2030 (Zukunft) | nein | — | **verworfen**, `timer_too_short` |
| 1e | keine Zeitangabe | — | — | Einspielen **wirft** (CHECK), Bestand unverändert |
| 2a | abgeschlossene Buchung 1000 → 2026 | — | aus dem Archiv | `"Zeit": 8 999 840` |

**Reicht ein präpariertes Archiv für eine beliebige Dauer? Ja — und der schwerste Fall braucht
gar kein präpariertes Archiv.** Für 1a genügt eine **ehrliche** Datensicherung, die bei laufendem
Timer gezogen wurde (T-350 hat genau das über den echten Weg gemessen). Vier Wochen später
eingespielt, läuft der Timer seit vier Wochen, und der Stopp bucht vier Wochen.

**Der Unterschied zu 2a ist der Kern der Bewertung.** 2a ist die Datensicherung, wie sie gemeint
ist: Eine abgeschlossene Buchung trägt ihre Spanne mit, sonst gäbe es den Round-Trip aus A-20.4
nicht — wer die Datei ändert, ändert seine eigenen Abrechnungsdaten (dieselbe Grenze wie die
SQLite-Datei, VG-3). 1a bis 1c sind etwas anderes: **Der Wert steht nicht in der Datei.** In der
Datei steht ein Anfangszeitpunkt; die Dauer rechnet der **empfangende** Rechner aus, aus seiner
eigenen Uhr, jetzt — und schreibt sie als frisch gemessene Arbeitszeit. Sie ist von einer echten
Messung nicht zu unterscheiden, weil sie eine ist; nur nicht von Arbeit. Der eine Wert, der sie
deckeln würde, reist mit und wird ignoriert: das Lebenszeichen.

**Obergrenze: keine für die Dauer.** `time_entry` prüft `duration_seconds >= 1`, die Domäne kennt
nur eine Mindestdauer, E-008 rundet **auf**. Die einzige wirksame Schranke ist die Formprüfung der
Zeitangabe (`GLOB` mit vier Stellen im Jahr) — daraus rund **6,4 × 10¹⁰ s** ≈ 17,8 Mio. Stunden in
**einer** Zeile der Exportdatei. Gemessen: 8 999 868.

**Dieselbe Bauart an anderen Werten — zwei Richtungen, beide nachgemessen:**

- **Der interne Vermerk hält.** `export_template` steht im Archiv; eine eingespielte Vorlage mit
  der Feldquelle `todo.note` wird beim Benutzen abgewiesen (`export_source_forbidden`), als
  Entwurf wie als gespeicherte Vorlage, und `readExportSource` ist ein geschlossener Schalter mit
  `default: null`. Der Preis ist eine Verweigerung, keine Undichtigkeit.
- **`WindowsUser` hält.** Er kommt über die zweite `stdin`-Zeile der Hülle (`runtime.ts:35`) und
  steht in keiner Archivspalte. Von den vier Feldern der Standardvorlage sind drei aus dem Archiv
  setzbar, eines nicht.
- **Am Spaltenschnitt gelesen, nicht gemessen:** `export_status` und `export_count` reisen mit; die
  Schemaregeln erzwingen nur ihre innere Stimmigkeit. Ein Archiv kann eine exportierte Buchung
  wieder als `open` einspielen (zweite Abrechnung) oder eine offene als `exported` (stille
  Auslassung) — und `export_audit` reist in derselben Datei, die Spur kann also nicht widersprechen.
  Dieselbe Klasse wie 2a.

**Wer die Tür öffnet.** `POST /data-transfer/archive` liegt außerhalb von `/addin` und verlangt
den **Sitzungsnachweis** plus zugelassene Herkunft. Eine fremde Seite im Browser erreicht sie
nicht. Der Weg ist der Benutzer mit einer Datei.

**Was hält:** Ein ungültiges Archiv verändert nichts — Transaktion zurückgerollt, Bestand danach
unverändert (gemessen), nach außen `internal_error` ohne Innenleben. Nacharbeit ohne Schwere: Die
inhaltliche Prüfung machen die `CHECK`-Regeln der Datenbank und melden sich als Wurf, also **500
statt 422**.

---

## 4 Läufe, jeder mit Zahl

| Lauf | Ergebnis |
|---|---|
| `proof:surface` Nullpunkt / nach jeder der 12 Gestalten / Endpunkt | **45/0** · 12 × **45/0** · **45/0** |
| `tsc -p apps/web` Nullpunkt und 5 eingesetzte Gestalten | 6 × **Exit 0** |
| Browsergeometrie (Chromium, `setContent`, 5 Lagen × 2 Flächen) | 10 Messungen, Tabelle oben |
| `proof:release-safety` Nullpunkt / R-1 / R-2 / R-3 / R-4 / Endpunkt | **154/0** · 153/1 · 153/1 · 153/1 · **154/0** · **154/0** |
| `tsc -p apps/local-api` je Gestalt | 5 × **Exit 0** |
| Modulmessung `version.ts` | 7 Speicherlagen, 3 Quellenlagen, 1 Reihenfolgemessung, 1 Stillemessung |
| Netzmessung gegen tropfenden Rumpf (flüchtiger Port) | **5 002 ms**, `reason: timeout` |
| Archivmessung (Einspielen → Stopp → Exportvorschau) | 6 Fälle plus Rückrollprobe |
| **nicht gefahren** | `verify:bundle`, `test:e2e` (Ports, T-352), `pnpm check` als Ganzes |

---

## 5 Urteil

- **Teil 1 (T-348): nicht freigegeben.** Was gebaut ist, ist besser als vorher und schließt alle
  acht Gestalten aus T-347. Aber die neue Menge hängt an einer **Schreibweise**, die Ernte kennt
  keine Stilangabe am Element, Regel H erntet drei Schreibweisen statt eines Weges, und **N-6b
  läßt den Lauf erneut eine Verankerung behaupten, die in einer Gestaltung gemessen nicht
  besteht**. Die Selbstauskunft ist in zwei von fünf Teilsätzen zu weit. Nacharbeit A-A-119 bis
  A-A-122. **Dringend ist keine davon:** Heute zeichnet genau eine Stelle eine Abdunklung, sie
  geht durch das echte Portal, und keine Palette faßt `position` an.
- **Teil 2 (T-349): freigegeben, mit drei Auflagen** (A-A-123, A-A-124, A-A-125). Der Hebel trägt
  in jeder Lage, die Stille nach A-18.12 hält ausnahmslos, der Wächter hält gegen drei
  `await`-Gestalten, und die Frist der gebauten Quelle trägt den Rumpf — gemessen. Die Zusage
  „genau eine Zeile" gilt für die Verdrahtung, nicht für das Modul; der fünfte Weg ist gemessen.
- **Teil 3 (T-350 / R-34): die Verengung freigegeben, das Risiko bestätigt und geschärft.** R-34
  bleibt **hoch** und offen. Gegenmittel A-A-126 (Polarität oder ausdrückliche Behandlung des
  mitgereisten laufenden Eintrags) und A-A-127 (nennbare Obergrenze oder Hinweis vor Buchung und
  Export).

---

## 6 Vorschläge für `risks.md` (nicht von mir geändert)

**R-30 — anzuhängen:**

> **Fortgeschrieben am 2026-09-13 (T-357), weiterhin offen.** A-A-106 ist gebaut und **trägt**:
> Ein Speicher, der schweigt, wirft oder trödelt, hält die ausgehende Anfrage in keiner gemessenen
> Lage mehr auf (eigener Aufbau: 40 Anfragen in 400 ms in jeder dieser Lagen), und `proof:release-safety`
> ist gegen drei `await`-Gestalten rot (153/1 bei `tsc` Exit 0), darunter die Anfrage in einer
> Hilfsfunktion und die Anfrage neben einem fremden Versprechen in `Promise.all`. **Die Klasse hat
> aber eine zweite Achse, und sie ist gemessen:** Ein Riegel auf dem Weg zur Anfrage braucht kein
> `await`. Ein synchron nicht zurückkehrender Aufruf ist bei 154/0 grün und `tsc` Exit 0; in seiner
> leisen Fassung — synchron blockierendes `store.write` — fallen die Anfragen von 40 auf 3, und das
> Protokoll bleibt **leer**. Der Port sagt den Fall in seinem Kommentar an, der Lauf nicht
> (A-A-125). **Ebenfalls offen und eine Naht weiter rechts:** Eine Quelle, deren `latest` nie
> antwortet, ergibt **1** Anfrage, Zustand `unknown`, **0** Protokollzeilen — auch dann, wenn sie
> auf das Signal hört, denn niemand bricht ab. Eng gehalten wird das heute allein von der
> Gesamtfrist der gebauten Quelle, und die ist jetzt **nachgemessen**: gegen einen tropfenden Rumpf
> bricht sie nach 5 002 ms mit `timeout` ab, trägt den Rumpf also mit.

**R-32 — anzuhängen:**

> **Fortgeschrieben am 2026-09-13 (T-357), weiterhin offen.** T-348 hat die Menge neu aufgespannt —
> aus den Stilblättern statt aus dem Namen — und alle acht Gestalten aus T-347 rot gemacht (45/0
> statt 34/0). **Elf weitere kommen durch**, alle mit `tsc` Exit 0 und `proof:surface` 45/0:
> `position: fixed !important`, `position: var(--x)`, Lage und Ausdehnung in zwei Regeln, volle
> Ausdehnung über `width`/`height`, die Stilangabe am Element — und drei Schreibweisen desselben
> Escape-Weges **in derselben Datei** (`!==`-Wächterklausel, `switch`, Listenvergleich), die Regel H
> nicht erntet. **Die schwerste ist wieder eine falsche Zusage:** Eine Palettenregel
> `.scrim { position: static }` nimmt der Fläche die Fensterfestigkeit, läßt sie aber in der Menge —
> der Lauf meldet „1, davon 1 verankert", während sie im Browser bei (0, 820) außerhalb des
> Fensters liegt, Knopf y = 874. Die Menge ist damit eine über eine **Schreibweise** und über die
> **Vereinigung** der Blätter, nicht über die Eigenschaft und nicht je Gestaltung (A-A-119 bis
> A-A-122).

**R-34 — anzuhängen:**

> **Bewertet am 2026-09-13 (T-357, Bedrohungsmodell 45.4), bleibt hoch und offen.** Die Dauer hat
> **keine Obergrenze**: gemessen 39 600 s (11 h), 1 789 300 800 s (`"Zeit": 497 028`) und
> 32 399 524 800 s (`"Zeit": 8 999 868`) in **einer** Exportzeile; die einzige wirksame Schranke ist
> die Formprüfung der Zeitangabe (vier Stellen im Jahr), also rund 6,4 × 10¹⁰ s. Ein Start in der
> Zukunft wird verworfen (`timer_too_short`), eine unlesbare Zeitangabe von der Datenbank abgewiesen,
> und ein ungültiges Archiv verändert nichts (Rückrollen nachgemessen). **Der Weg braucht keinen
> Angreifer:** Eine ehrliche Datensicherung, die bei laufendem Timer gezogen wurde, genügt. Der
> entscheidende Unterschied zu einer gefälschten abgeschlossenen Buchung — die der Round-Trip aus
> A-20.4 ohnehin erlaubt — ist, daß der Wert **nicht in der Datei steht**: Er wird vom empfangenden
> Rechner aus dem fremden Anfangszeitpunkt und der eigenen Uhr errechnet und ist deshalb von einer
> echten Messung nicht zu unterscheiden. Dieselbe Bauart trägt auch `export_status`/`export_count`
> (zweite Abrechnung oder stille Auslassung; `export_audit` reist in derselben Datei). **Nicht**
> betroffen: der interne Vermerk (eine eingespielte Vorlage mit `todo.note` wird beim Benutzen
> abgewiesen) und `WindowsUser` (kommt aus der Hülle, nicht aus dem Archiv). Gegenmittel A-A-126
> und A-A-127.

---

## Kurzfassung

```
Aufgabe: T-357 — Sicherheitsfreigabe über T-348, T-349 und T-350
Status: braucht Review — Teil 1 nicht freigegeben, Teil 2 freigegeben mit drei Auflagen,
  Teil 3 Verengung freigegeben und R-34 bestätigt/geschärft
Artefakte: docs/bedrohungsmodell.md (Abschnitt 45, A-A-119 bis A-A-127),
  .claude/team/reports/T-357-security-checker.md
Zusammenfassung: Teil 1 — an der neuen Menge angesetzt und elf Gestalten gefunden, alle bei
  `tsc` Exit 0 und `proof:surface` 45/0: `!important`, `position: var(…)`, Lage und Ausdehnung in
  zwei Regeln, volle Ausdehnung über `width`/`height`, die Stilangabe am Element, drei
  Palettenfälle und vier Absagewege, die Regel H nicht erntet. Zwei davon sind im Browser
  nachgemessen: die feste Fläche in einer Karte hängt in `glass` an der Karte (980 × 11 998 bei
  (265, −523), Knopf außerhalb), und eine Palette, die `.scrim` auf `static` setzt, legt die
  Fläche bei (0, 820) unter das Fenster — während der Lauf weiter „1, davon 1 verankert" meldet.
  Die Selbstauskunft über A-25.6 ist in zwei von fünf Teilsätzen zu weit und nirgends zu eng.
  Teil 2 — A-A-106 trägt in jeder gebauten Lage (Schweigen, Wurf, Trödeln, später Schreibvorgang),
  die Stille nach A-18.12 hält ausnahmslos, 6g-1 ist gegen drei `await`-Gestalten rot (153/1). Drei
  Befunde: „genau eine Zeile" sind gemessen zwei, der abgelegte Speicher hinterläßt einen
  veralteten statt eines fehlenden Wertes, und der fünfte Weg braucht kein `await` — ein
  synchroner Riegel ist 154/0 grün, in seiner leisen Fassung 40 → 3 Anfragen bei leerem Protokoll.
  Die Gesamtfrist der gebauten Quelle trägt den Rumpf (5 002 ms, `timeout`, gegen einen eigenen
  tropfenden Wirt). Teil 3 — R-34 ist bestätigt und schwerer als das gemeldete Beispiel: keine
  Obergrenze (bis `"Zeit": 8 999 868` in einer Exportzeile), kein Angreifer nötig (eine ehrliche
  Sicherung mit laufendem Timer genügt), und der Wert wird vom empfangenden Rechner errechnet und
  ist von einer echten Messung nicht zu unterscheiden. Notizgrenze, `WindowsUser` und das
  Rückrollen eines ungültigen Archivs halten — nachgemessen.
Annahmen: (1) Eine Gestalt zählt erst, wenn sie übersetzt — jede TSX-Gestalt ist mit `tsc` Exit 0
  belegt, H-3 ausdrücklich nicht (Attrappenprop) und deshalb als schwächste geführt.
  (2) Die Bewertung von 2a (abgeschlossene Buchung mit gesetzter Spanne) ist **keine** Auflage: Der
  Round-Trip aus A-20.4 verlangt sie, und die Grenze ist die Datei selbst. (3) Die Gestalten liefen
  im Arbeitsbaum statt in einer Kopie, weil `apps/**` und `packages/**` in dieser Welle stillstehen;
  jede Datei ist byteweise zurückgeschrieben und geprüft. (4) `export_status`/`export_count` sind am
  Spaltenschnitt gelesen und nicht gemessen; das steht so im Papier.
Risiken: R-32 und R-30 bleiben offen und sind um je eine Achse breiter als beschrieben; R-34 bleibt
  hoch. Keine der Nacharbeiten ist dringend im Sinn von „heute kaputt": Es gibt eine Abdunklung,
  sie hängt richtig, keine Palette faßt `position` an, und die Verdrahtung des Prüfers hält die
  Zusage, die sein Quelltext zu weit formuliert. Der einzige Punkt, der **ohne** Zutun eines
  Angreifers Geld bewegt, ist R-34.
Offene Fragen: (1) A-A-120 hat zwei mögliche Formen — ein Satz über spätere `position`-Regeln im
  Lauf, oder die Browsermessung über 19 × 2 wie T-337. Die zweite mißt die Anforderung, die erste
  ist billiger; das ist eine Entscheidung. (2) Soll A-A-127 eine harte Grenze sein oder ein
  Hinweis? Eine harte Grenze in der Domäne bricht den Round-Trip echter Altdaten. (3) Wortlaute für
  R-30, R-32 und R-34 stehen in Abschnitt 6 dieses Berichts.
Nächster Schritt: (a) frontend-dev mit A-A-119 bis A-A-122 in einer Welle, in der niemand sonst
  `apps/web/scripts/proof-surface.mjs` anfaßt; (b) domain-dev mit A-A-126 („Polarität der
  Timer-Aufnahme", T-350 Abschnitt 4 als Gegenprobe) und danach — getrennte Welle — der
  unit-tester; (c) A-A-123 bis A-A-125 sind drei kleine Zeilen und passen in denselben Auftrag wie
  (b) nicht: sie gehören in `features/version/**` und in `proof-release-safety.mjs`.
```
