# T-337 — Sicherheitsfreigabe über T-334 und T-335

**Rolle:** security-checker. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Vorlagen:** `.claude/team/reports/T-334-frontend-dev.md`, `T-335-domain-dev.md`,
`T-332-security-checker.md`, `T-331-code-reviewer.md`.
**Geänderte Dateien:** `docs/bedrohungsmodell.md` (neuer Abschnitt 43) und diese Datei. Sonst
keine — kein `apps/**`, kein `tests/**`, kein `risks.md`.

---

## 1 Läufe, jeder mit Zahl

| Lauf | Wo | Ergebnis |
|---|---|---|
| `proof:shell-surface` | echter Baum | **7 Prüfungen und 54 Gegenproben bestanden** |
| `proof:surface` | echter Baum | **28 bestanden, 0 fehlgeschlagen** (Zusammenfassung nennt „3 durch ein Portal am Dokumentkörper") |
| `proof:locked` | echter Baum | 9/0 |
| `proof:clamp` | echter Baum | 21/0 |
| `proof:foreign` | echter Baum | 21/0 |
| `proof:release-safety` | **eigene Kopie, Nullpunkt** | **130 bestanden, 0 fehlgeschlagen** |
| `proof:layers` / `route-policy` / `callers` | eigene Kopie, Nullpunkt | 36/0 · 48/0 · 74/0 |
| `tsc -p apps/local-api/tsconfig.json --noEmit` | eigene Kopie | Exit 0 (je Ausschalter einzeln) |
| `tsc -p apps/web/tsconfig.json --noEmit` | eigene Kopie | Exit 0 |
| Browsermessung A-A-108 | eigener Server `127.0.0.1:18937` | **342 Messungen**, 19 Paletten × 2 Modi × 9 Flächen, 0 Seitenfehler |
| Tastaturmessung | ebenda | 12 Fälle mit echter Tastatur + 45 aus dem Hauptlauf, **822 Tabulatorschritte** |
| Wirkungsmessung am zusammengebauten Dienst | eigene Kopie | 6 Läufe (K-4, K-7, je Schalter aus/an) |

**Nicht gefahren, heißt nicht gemessen:** `pnpm check` als Ganzes, `test:coverage`, `test:rust`,
`build`, `verify:bundle` (bindet 17844), `audit`, `proof:engines`, `test:e2e`, und die
portgebundenen Nachweise (`proof:access`, `conflicts`, `tags`, `export-api`, `addin-wiring`).
`proof:locked` lief **nicht** gegen K-8, weil die Meßkopie `docs/` nicht enthält; der Lauf urteilt
über eine Sperrliste, K-8 streicht keinen Satz.

**Ports.** Vor dem Lauf mit `ss -ltn` geprüft: `17843`, `17844`, `5173` und `18937` waren frei.
Gebunden habe ich ausschließlich `18937` (eigener Entwicklungsserver), am Ende selbst beendet und
nachgeprüft. **Kein fremder Prozeß beendet** — beendet habe ich genau einen eigenen Meßlauf, der
gegen eine tote Palette maß (Abschnitt 2.1).

**Kratzbereich abgeräumt, wie aufgetragen.** Die Meßkopie des Baums (287 MB) ist mit
`find … -delete` entfernt; im sitzungseigenen Kratzbereich stehen noch 748 KB Skripte und
Protokolle, die mit der Sitzung verschwinden. Außerhalb des Arbeitsbaums liegt nichts Neues, das
von Hand zu entfernen wäre. Die 320 MB aus T-332 unter `~/.cache/t332*` liegen weiter dort —
**nicht meine Hoheit, nicht angefaßt**; ich schlage vor, daß der Orchestrator sie freigibt.

---

## 2 Teil 1 — A-A-108

### 2.1 Der Meßaufbau, und der Fehler darin, der zuerst zu finden war

Gemessen gegen `/designsystem.html` — sie zeichnet die **echten** Bausteine ohne den lokalen
Dienst. **Der erste Lauf maß nichts:** `designsystem.tsx` lädt `startup.css` nicht und damit keine
`theme-palettes.css`. `data-design-theme="glass"` blieb wirkungslos — **67 Karten, 0 mit
`backdrop-filter`**, `prefers-reduced-transparency` auf `no-preference`. Das ist der Lauf, den ich
beendet habe; seine 342 grünen Zahlen hätten „in `glass` ist alles gut" gesagt, ohne daß `glass`
je an war. Mit eingeschossenem `theme-palettes.css`: **67 von 67** Karten tragen
`blur(16px) saturate(1.15)`. Im Erzeugnis ist die Palette aktiv (`apps/web/index.html:17`).

### 2.2 Die Menge am Quelltext — geschlossen

Drei Stellen im ganzen Bestand zeichnen eine Abdunklung, alle drei durch `Scrim`:
`shared/ui/DialogSurface.tsx:371` (trägt `ConfirmDialog`, `FormDialog`, `InfoDialog`,
`UpdateDialog`, Vorlagenvorschau), `features/todos/AttachmentOpenDialog.tsx:348` (A-19.14),
`app/ShellStatus.tsx:763`. Gesucht über die **Eigenschaft** (`aria-modal`, `role="dialog"`,
`role="alertdialog"`, `<DialogSurface`, `className="dialog`), nicht über den Baustein. Kein
Stilblatt setzt eine der sechs Eigenschaften auf `html` oder `body`.

### 2.3 Die Menge im Browser — 342 Messungen

19 Paletten × 2 Modi × 9 Bestätigungsflächen: **eine einzige Geometrie über alle 342**
(`1280 × 820 bei (0,0)`), **342 × Elternknoten `body`**, **0** Vorfahren mit einer der sechs
Eigenschaften, **0** Verschiebungen nach 600 px Bildlauf, **0** Knöpfe außerhalb des Fensters oder
nicht treffbar.

**Die Gegenprobe feuert:** dieselbe Abdunklung unter `glass` von Hand in eine `.card` gehängt →
**958 × 666 bei (297, −36333)**, deckt nicht, `blur(16px) saturate(1.15)` in der Elternkette,
**beide** Knöpfe unerreichbar. Von vier angesetzten Gegenproben hat **eine** wirklich umgehängt;
das sage ich, statt vier zu behaupten.

### 2.4 Fangend, und Escape ist keine Zustimmung

Echte Tastaturbedienung, `classic`/`glass`/`liquid-glass` × vier Flächen: Fokus beim Öffnen
**12 × innerhalb**; **Shift+Tab als erster Tastendruck** 12 × innerhalb; 16 Tabulatorschritte je
Fall (192) **0 × außerhalb**; Escape schließt 12/12 und gibt den Fokus **12 × auf den Auslöser**
zurück. Dazu 45 Messungen aus dem Hauptlauf mit 630 Schritten: 0 × außerhalb, Escape 45/45.

Am Quelltext über die **ganze Menge** geprüft: `ConfirmDialog` → `onCancel`; `AttachmentOpenDialog`
→ `onCancel`, und nur wenn nicht gearbeitet wird; `FormDialog` → `onCancel` mit
`closeOnEscape={!busy}`; **`UpdateDialog` → `onPostpone`, nicht `onSkip`** — genau die Stelle, an
der Escape sonst eine **gespeicherte** Entscheidung träfe (A-18.10); `postpone` wirkt nur im
Arbeitsspeicher. `ShellStatus` hat **kein** Escape, absichtlich.

### 2.5 Befund A-108-1 (mittel) — der Wächter mißt nicht die Anforderung, die er trägt

A-A-108 schreibt sein Kriterium an der Anforderung auf („kein `.scrim` hat einen Vorfahren mit
…"). Gebaut wurde eine Zusage über **Portale**: Regel F liest bei jedem `createPortal` das Ziel,
verlangt wörtlich `document.body` und zwei Argumente, meldet alles andere, hat drei Gegenproben
und eine Untergrenze. Als Portalregel ist sie gut. Sie sagt nichts über eine Abdunklung, die tief
in einer Karte gezeichnet wird — Regel F läuft die **Kinder** von `.app` ab.

**Gemessen (K-8):** `<div className="scrim">` mit `role="alertdialog"` in den Rumpf von
`features/todos/Attachments.tsx` gesetzt — dorthin, wo der Befund aus 42.8.3 saß:
`tsc` **Exit 0**, `proof:surface` **28/0**, `proof:clamp` 21/0, `proof:foreign` 21/0. Unter `glass`
hängt die Fläche wieder an der Karte, und kein Lauf sagt etwas dazu.

**Gegenmittel A-A-109** (Bedrohungsmodell 43.9): jedes JSX-Element mit `scrim` in der Klassenliste
steht in `Scrim`; es gibt genau eines. Vollständig über den Quelltext entscheidbar.

---

## 3 Teil 2 — T-335, mit eigenen Ausschaltern

Nullpunkt selbst nachgefahren: **130/0**, dazu 36/0, 48/0, 74/0.

| | Gestalt | `tsc` | `release-safety` | Wirkung |
|---|---|---|---|---|
| **K-4** | **Die Meldung, die nie ankommt** — `versionState` liefert über `app_setting.locale` `{ state: 'unknown' }`; die Anfrage geht weiter hinaus | Exit 0 | **130/0 grün** | **1 Anfrage wie immer**, Route `unknown` statt `known/99.0.0` |
| **K-5** | Umhüller vor `createVersionCheckStatePort`, der vor dem Weiterreichen wartet | Exit 0 | **127/3 rot** | — |
| **K-6** | Derselbe Umhüller als `Proxy`, der `recordCheck` nie beim Namen nennt | Exit 0 | **125/5 rot** | — |
| **K-7** | **Der Rumpf des `write`-Literals** wartet vor dem Adapter; der Adapter bleibt zeichengleich | Exit 0 | **130/0 grün** | **0 statt 1** Anfrage |

`layers`, `route-policy` und `callers` bleiben bei allen vier grün.

**K-5 und K-6 sind gute Nachrichten über den Lauf.** 6g leitet den Adapter aus der **Verdrahtung**
her und trägt eine Untergrenze; K-6 fällt über „das Mitglied `recordCheck` steht 0-mal" und „das
festgenagelte Adaptermitglied wird von der Verdrahtung nicht mehr gerufen". Wer den Adapter
austauscht, wird gesehen; wer ihn versteckt, auch. Das ist mehr, als der Zeichenvergleich
verspricht.

**K-7 ist die Lücke.** Festgenagelt sind: `store` ist ein Objektliteral (6b), der Port hat genau
ein Mitglied `write`, die Anweisungen des Adapters **hinter** `write` sind zeichengleich (6g).
Nicht gelesen wird der **Rumpf von `write` selbst** — die eine Stelle, an der die Verdrahtung
zwischen Prüfer und Adapter etwas einschieben kann. Gemessen am zusammengebauten Dienst:

```
Schalter AUS   Anfragen hinaus: 1   Route: {"state":"known","latestVersion":"99.0.0"}
Schalter AN    Anfragen hinaus: 0   Route: {"state":"unknown","latestVersion":null}
```

**K-4 geht über den Wächter hinaus.** K-5 bis K-7 fragen „kommt die Anfrage hinaus"; K-4 fragt,
worum es in A-18 geht: „erfährt der Benutzer davon". Für dieses Schutzziel ist ein Ausschalter an
der **Auskunft** so vollständig wie einer an der **Anfrage** — und billiger: kein Prüfer, kein
Port, keine Naht, kein Wartezeitverhalten. Gestalt 6 ist an „wer kann über die ausgehende Anfrage
entscheiden" aufgespannt; **diese Frage ist eine Zeile zu eng.**

Zwei Wege, die **zu** sind und dazugehören: „Überspringen" vergleicht auf **Gleichheit**
(`packages/domain/src/version.ts:379`) — ein Archiv mit `skipped_version = '999.0.0'` unterdrückt
genau diese eine Fassung. Und `hostGuard` hat beim Bauen der Meßhilfe jede Anfrage mit unpassendem
`Host` mit `403 host_not_allowed` abgewiesen — B-1.3 ist beiläufig gegengemessen.

### 3.1 Die Grenze, die drei Beteiligte ziehen: sie stimmt, ihr Beweis nicht mehr

T-335s Beleg — `async recordCheck(at) { return new Promise<void>(() => undefined); }` — **trägt
heute nicht mehr**: er steht in der Deklaration, die 6g zeichengleich festnagelt, und wäre rot.
Der Satz darüber stimmt trotzdem, und **K-7 ist sein besserer Beleg**: Die Lücke liegt nicht in
der Schreibweise, sondern in der **Stelle**. Der Satz gehört in den Kopf des Laufs und ins
Bedrohungsmodell — mit dem Zusatz, daß zur Aufzählung bei `checkNoStoreReadback` seit heute der
**Rumpf des `write`-Literals** und die **Auskunft an die Oberfläche** gehören.

---

## 4 Teil 3 — die billigen Fragen an T-334

- **Keine neue Adresse, kein neuer Datenweg.** Über alle unversionierten Änderungen an
  `apps/web/**` und `packages/ui-tokens/**` (2 787 hinzugefügte Zeilen) nach 18 Netz- und
  Speichermarken gesucht: **null Treffer**.
- **Keine Erweiterung der CSP.** `apps/desktop/**` ist unberührt, `tauri.conf.json` damit auch;
  `proof:shell-surface` **7 + 54**.
- **Kein Satz verloren.** Nach E-087 über den **Wortlaut** gemessen, über Quellverzeichnisse
  **und** `git`, Bauergebnisse ausgeschlossen: **356** satzartige Zeichenketten in den entfernten
  Zeilen, **317** stehen unverändert wieder da, **39** einzeln nachgesehen und alle erklärt
  (CSS-Selektoren, Bruchstücke aus Schablonenzeichenketten, Kommentarprosa, in einem Fall nur eine
  neue Einrückung). Der Base64-Satz steht in `ExportScreen.tsx:719` im Laufbereich, der
  Ordnerbefund in der festen Leiste.
- **Der geänderte Wächter.** T-334 hat `proof-surface.mjs` erweitert — ein Wächter, angefaßt von
  der Seite, die er mißt. Gelesen: die Erweiterung ist **eng** (wörtlich `document.body`, genau
  zwei Argumente, jedes andere Ziel ein Befund), trägt drei neue Gegenproben und eine Untergrenze.
  Sie ist keine Lockerung. Die Grenze ihrer Aussage steht als A-108-1 oben.

---

## 5 Urteil, je Teil

- **Teil 1, A-A-108 (Verankerung der Rückfrage): freigegeben.** Menge am Quelltext geschlossen,
  342 Messungen über 19 Paletten, feuernde Gegenprobe, fangend, Escape nie Zustimmung.
- **Teil 1, der Wächter darüber: nicht freigegeben** — **A-A-109**. Gebaut ist eine Zusage über
  Portale, aufgeschrieben war eine über Abdunklungen; K-8 kommt durch.
- **Teil 2, die verengte Menge: freigegeben.** Drei von vier eigenen Ausschaltern sind rot, zwei
  davon über Untergrenzen, die T-335 selbst gebaut hat.
- **Teil 2, die Zusage über die Klasse: nicht freigegeben** — **A-A-110** und **A-A-111**. K-4 und
  K-7 kommen durch, beide mit `tsc` Exit 0 und 130/0, beide am Verhalten gegengemessen.
- **Teil 3: freigegeben.** Keine Adresse, kein Datenweg, keine CSP-Erweiterung, kein verlorener
  Satz.

**Dringlichkeit.** Keiner der drei offenen Punkte ist dringend: A-A-110 und A-A-111 verlangen
fremden Code **und** ein präpariertes Archiv, A-A-109 verlangt einen fünften Dialog, den es noch
nicht gibt. Am heutigen Bestand ist nichts abgeschaltet und keine Rückfrage unerreichbar.

---

## 6 Vorschläge für `risks.md` (schließt der Orchestrator)

**R-31 — schließen.**

> **Geschlossen am 2026-09-13 (T-334/T-337).** A-A-108 ist gebaut: Jede Abdunklung hängt über ein
> Portal am Dokumentkörper (`Scrim` in `apps/web/src/shared/ui/DialogSurface.tsx`), und alle drei
> Stellen, die eine zeichnen, gehen durch diesen einen Baustein. Unabhängig nachgemessen in
> T-337: **19 Paletten × 2 Modi × 9 Bestätigungsflächen = 342 Messungen**, darin **eine einzige**
> Geometrie (`1280 × 820 bei (0,0)`), Elternknoten stets `body`, kein Vorfahr mit
> `backdrop-filter`/`filter`/`transform`/`perspective`/`contain`/`will-change`, keine Verschiebung
> nach 600 px Bildlauf, kein Knopf außerhalb des Fensters. Die Gegenprobe — dieselbe Abdunklung
> unter `glass` zurück in eine `.card` gehängt — liefert **958 × 666 bei (297, −36333)** mit
> beiden Knöpfen unerreichbar; das Meßgerät sieht den Fehlerfall. Die Fläche ist **fangend**
> (822 Tabulatorschritte, keiner außerhalb), Escape schließt und gibt den Fokus auf den Auslöser
> zurück, und Escape ist an keiner Stelle Zustimmung — am `UpdateDialog` ausdrücklich
> `onPostpone` und nicht `onSkip`. **Was offen bleibt, ist nicht der Befund, sondern der Wächter
> darüber:** `proof:surface` mißt Portale, nicht Abdunklungen; eine fünfte Fläche mit eigenem
> `.scrim` im Rumpf einer Karte bleibt grün (T-337 K-8). Das steht als **R-32** mit dem
> Gegenmittel **A-A-109**.

**R-30 — offen lassen, Wortlaut von T-335 übernehmen, mit zwei Berichtigungen.**

> Den von T-335 vorgeschlagenen Absatz übernehmen, aber (a) **nicht** „der Rest steht als R-31"
> schreiben — R-31 ist vergeben und wird geschlossen; der Rest gehört unter eine eigene Nummer.
> Und (b) den Beleg berichtigen: T-335s eigenes Gegenbeispiel
> (`return new Promise<void>(() => undefined)`) ist heute **rot**, weil es in der zeichengleich
> festgenagelten Deklaration steht. Der bessere Beleg ist **T-337 K-7**: dieselbe Technik wie
> K-1, vier Zeilen versetzt in den Rumpf des `write`-Literals, `tsc` Exit 0, Lauf **130/0 grün**,
> **0 statt 1** ausgehende Anfrage. R-30 bleibt offen bis A-A-106; A-A-111 kommt dazu.

**R-33 (neu) — die Meldung, die nie ankommt.**

> **Schwere:** mittel. **Betrifft:** security-checker, domain-dev. Neu am 2026-09-13 (T-337 K-4).
> `proof:release-safety` spannt seine Menge an der Frage auf „wer kann über die **ausgehende
> Anfrage** entscheiden". A-18 verlangt aber, daß der Benutzer von einer neueren Fassung
> **erfährt** — bei unsignierten Erzeugnissen der einzige Weg, auf dem eine Sicherheitsbehebung
> ihn erreicht (R-30). Gemessen: ein Leser von `app_setting`, der in `composition.ts:267` die
> Auskunft `versionState` auf `{ state: 'unknown' }` legt, läßt die Anfrage unverändert hinausgehen
> (**1 Anfrage wie immer**), unterdrückt aber die Meldung vollständig — `tsc` Exit 0,
> `release-safety` **130/0**, `layers` 36/0, `route-policy` 48/0, `callers` 74/0. Gegenmittel
> **A-A-110**. Nicht dringend: verlangt fremden Code **und** ein präpariertes Archiv.

---

## 7 Annahmen, Risiken, offene Fragen

**Annahmen.** (1) Die Musterseite ist ein zulässiger Meßort für A-A-108, **weil** sie die echten
Bausteine zeichnet und die Geometrie der Abdunklung nach dem Portal nur noch von `html`/`body`
abhängt — beide sind am Quelltext geprüft. Was sie **nicht** trägt: die Anordnung der echten
Ansichten. Das mißt visual-qa. (2) Ich habe `theme-palettes.css` in die Musterseite eingeschossen,
statt den Dienst zu starten; die Gleichwertigkeit ist an den 67 Karten gemessen. (3) Als
Bestätigungsflächen habe ich die neun Flächen genommen, die die Musterseite anbietet — sie decken
alle drei Abdunklungswurzeln ab, aber nicht jede Aufrufstelle im Erzeugnis.

**Risiken.** A-A-109, A-A-110 und A-A-111 sind offen; keiner ist dringend, und die Begründung
dafür steht in Abschnitt 5. Meine eigene größte Fehlerquelle in dieser Runde war ein Meßgerät, das
nichts messen konnte — beide Male hat erst die Gegenprobe es gezeigt.

**Offene Fragen an den Orchestrator.**
1. **Die Nummernkollision:** T-335 schlägt vor, den offenen Rest von R-30 als „R-31" zu führen.
   R-31 ist die Rückfrage und wird mit dieser Runde geschlossen. Vorschlag: **R-32** für den
   Wächter über die Abdunklungen, **R-33** für die Meldung, die nie ankommt.
2. **`verify:bundle` bindet 17844** (T-334 Frage 4). Aus meiner Sicht gehört es in die Liste der
   portgebundenen Läufe, die ein Agent nicht von sich aus fährt. Ich habe es nicht gefahren.
3. **`~/.cache/t332*` (320 MB)** liegt seit T-332 dort, weil das Löschen abgelehnt wurde. Meine
   eigene Kopie ist weg; für die alte brauche ich eine Freigabe.
4. **A-A-106** bleibt der einzige Hebel, der diese Klasse je am **Verhalten** statt an Zeichen
   mißt. Wer es baut, ändert `CHECKER_AWAITED_BEFORE_REQUEST` — Leser und Bauender in
   aufeinanderfolgende Wellen.

---

## Kurzfassung

```
Aufgabe: T-337 — Sicherheitsfreigabe über T-334 und T-335
Status: braucht Review — drei Teile geprüft, zwei Stränge mit Nacharbeit
Artefakte: docs/bedrohungsmodell.md (neuer Abschnitt 43, Auflagen A-A-109 bis A-A-111),
  .claude/team/reports/T-337-security-checker.md
Zusammenfassung: A-A-108 ist selbst nachgemessen und trägt: Am Quelltext gibt es genau drei
  Stellen, die eine Abdunklung zeichnen, und alle drei gehen durch denselben Baustein `Scrim`;
  im Browser ergeben 19 Paletten × 2 Modi × 9 Bestätigungsflächen = 342 Messungen eine einzige
  Geometrie (1280 × 820 bei (0,0)), Elternknoten stets `body`, keinen Vorfahren mit einer der
  sechs Eigenschaften, keine Verschiebung beim Rollen und keinen Knopf außerhalb des Fensters —
  und die Gegenprobe, dieselbe Fläche unter `glass` zurück in eine Karte gehängt, liefert
  958 × 666 bei (297, −36333) mit beiden Knöpfen unerreichbar. Die Fläche ist fangend (822
  Tabulatorschritte, keiner außerhalb), Escape schließt, gibt den Fokus auf den Auslöser zurück
  und ist an keiner Stelle Zustimmung — am Update-Dialog ausdrücklich `onPostpone` statt `onSkip`.
  Beim Versionswächter habe ich vier eigene Ausschalter gebaut: zwei fallen (Umhüller und
  Proxy-Umhüller, 127/3 und 125/5 — 6g leitet den Adapter aus der Verdrahtung her und trägt eine
  Untergrenze), zwei kommen durch — der Rumpf des `write`-Literals (K-7: 130/0 grün, tsc Exit 0,
  0 statt 1 Anfrage) und die Auskunft an die Oberfläche (K-4: 130/0 grün, Anfrage geht weiter
  hinaus, Meldung nie). Teil 3 ist sauber: null Netzmarken in 2 787 hinzugefügten Zeilen,
  `apps/desktop` unberührt, `proof:shell-surface` 7 + 54, und von 356 satzartigen Zeichenketten
  aus entfernten Zeilen stehen 317 wieder da, die 39 übrigen sind einzeln erklärt.
Annahmen: Die Musterseite ist ein zulässiger Meßort, weil sie die echten Bausteine zeichnet und
  die Geometrie nach dem Portal nur noch an `html`/`body` hängt — beide am Quelltext geprüft.
  Dafür mußte ich `theme-palettes.css` einschießen: `designsystem.tsx` lädt `startup.css` nicht,
  und mein erster Lauf hat deshalb `glass` gemessen, ohne daß `glass` an war (67 Karten, 0 mit
  `backdrop-filter`). Diesen Lauf habe ich beendet und die Messung wiederholt.
Risiken: Drei Auflagen offen, keine dringend — A-A-109 (der Wächter über A-A-108 mißt Portale,
  nicht Abdunklungen; eine fünfte Fläche mit eigenem `.scrim` in einer Karte bleibt grün: tsc
  Exit 0, proof:surface 28/0), A-A-110 (die Entscheidungsfläche endet an der Anfrage statt an der
  Meldung) und A-A-111 (der Rumpf von `store.write` gehört zur gemessenen Menge). Alle drei
  verlangen fremden Code, zwei davon zusätzlich ein präpariertes Archiv; am heutigen Bestand ist
  nichts abgeschaltet und keine Rückfrage unerreichbar. T-335s eigener Beleg für die
  Unschließbarkeit der Klasse trägt nicht mehr — er ist heute rot; K-7 ist der bessere Beleg, und
  der Satz selbst stimmt.
Offene Fragen: (1) Nummernkollision — T-335 will den Rest von R-30 als „R-31" führen, aber R-31
  ist die Rückfrage und wird geschlossen; Vorschlag R-32 und R-33, Wortlaute stehen im Bericht.
  (2) Gehört `verify:bundle` in die Liste der portgebundenen Läufe? Es bindet 17844.
  (3) `~/.cache/t332*` (320 MB) braucht eine Freigabe zum Löschen; meine eigene Kopie ist weg.
  (4) A-A-106 bleibt der einzige Hebel, der diese Klasse am Verhalten statt an Zeichen mißt.
Nächster Schritt: A-A-109 an frontend-dev (kleiner Lauf, vollständig über den Quelltext
  entscheidbar, Gegenprobe K-8 ist im Bedrohungsmodell beziffert); A-A-110 und A-A-111 an
  domain-dev in **derselben** Welle wie A-A-106, weil alle drei `checkNoStoreReadback` anfassen —
  und Leser und Bauender gehören nicht in dieselbe Welle wie ein zweiter Umbau derselben Datei.
  R-31 schließen, R-32 und R-33 aufnehmen.
```
