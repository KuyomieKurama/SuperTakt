# T-147 — Frist und Anhänge in Oberfläche und Hülle; fünf Befunde aus dem Tor

**Aufgabe:** T-147
**Status:** braucht Review
**Rolle:** frontend-dev
**Hoheit:** `apps/web/**`, `apps/desktop/**`

---

## 0. Die drei Sätze vorweg

1. **Der Öffnen-Befehl steht, und er ist gegen alle 28 gemessenen Zeichenketten aus
   Bedrohungsmodell 20.2 gefahren** — nicht behauptet, sondern in einem Wegwerf-Programm gegen
   dasselbe `url 2.5.8` ausprobiert, das die Hülle einbindet. Jede Zeile der Tabelle verhält sich
   so, wie 20.2 sie vorhersagt, und die Festpunkttabelle ist über alle zehn Zeilen idempotent.
2. **`proof:shell-surface` zählt nicht mehr, es benennt.** Drei Aufruforte mit Datei, Funktion und
   Prüffunktion; für jeden wird gemessen, daß die Prüfung im selben Rumpf steht und das Öffnen von
   ihrem Ergebnis abhängt. Dazu liest der Lauf jetzt rekursiv und alle drei Endungen — und der
   **Leser selbst** wird gegen einen echten Baum gemessen, nicht gegen eine Liste.
3. **Die Naht zu T-146 habe ich nachgezogen, nicht erfunden.** Der Dienst nennt das Feld `dueDate`
   und den Zustand `DueState`; meine erste Fassung hieß `deadline`. Ich habe die Oberfläche auf
   den Vertrag des Dienstes umgestellt und `dueState` aus `@takt/domain` **weitergereicht**, statt
   den Tagesvergleich ein zweites Mal zu schreiben.

---

## 1. Artefakte

### Neu

| Datei | Was |
|---|---|
| `apps/desktop/src-tauri/src/attachment.rs` | Die beiden Öffnen-Befehle und die ganze Kontrolle (A-A-1 bis A-A-8) |
| `apps/web/src/lib/deadline.ts` | Übergang zur Domäne: `dueState`, `toCalendarDay`, `calendarDayBounds` |
| `apps/web/src/app/useToday.ts` | Der heutige Tag, der von selbst aktuell bleibt (E-073 Punkt 2) |
| `apps/web/src/components/DeadlineFlag.tsx` | Die dritte Sorte Marke am Todo |
| `apps/web/src/components/Attachments.tsx` | Flächen A bis E |
| `apps/web/src/components/AttachmentOpenDialog.tsx` | Die Rückfrage (A-A-6) |
| `apps/web/src/lib/attachmentLabel.ts` | Ersatzbezeichnung (A-19.12) und die Wörter der Rückfrage |
| `apps/web/src/showcase/DeadlineSection.tsx` | Abschnitt 13 der Musterseite |

### Geändert

`apps/desktop/src-tauri/{Cargo.toml,Cargo.lock,src/lib.rs}` ·
`apps/desktop/scripts/{proof-shell-surface.mjs,build-app.mjs}` · `apps/desktop/src/shell.ts` ·
`apps/web/scripts/{proof-foreign.mjs,contrast-check.mjs}` ·
`apps/web/src/api/{types.ts,endpoints.ts}` ·
`apps/web/src/app/{connection.ts,UpdateNotice.tsx,useUpdateNotice.ts}` ·
`apps/web/src/components/{Icon.tsx,Kanban.tsx,ExportDirectoryField.tsx}` ·
`apps/web/src/lib/format.ts` ·
`apps/web/src/screens/{TodoListScreen,TodoDetailScreen,TodoFormDialog,BoardScreen,DashboardScreen,parts}.tsx` ·
`apps/web/src/showcase/{Showcase,BoardSection,data}.*` · `apps/web/src/styles/{app,showcase}.css`

`Cargo.lock` wächst um **eine Zeile** (`url` bei `takt-desktop`). Die Kiste lag bereits transitiv
über `tauri` im Baum — kein Zuwachs in der Lieferkette (T-145-12, VG-7).

---

## 2. Auflage für Auflage — Bedrohungsmodell Abschnitt 20.7

### An frontend-dev: die Hülle (VG-11)

Drei Urteile, und sie sind nicht dasselbe: **erfüllt** heißt gemessen; **abweichend erfüllt** heißt
gebaut, aber anders als die Auflage es wörtlich sagt, mit Begründung; **halb** heißt, daß ein Teil
außerhalb meiner Hoheit liegt.

| ID | Urteil | Woran gemessen |
|---|---|---|
| **A-A-1** | **erfüllt** | `takt_open_attachment_link(app, url: String)` und `takt_open_attachment_file(app, path: String)` in `attachment.rs`. Je genau **ein** `String`, kein zweiter Parameter, kein gemeinsamer Befehl mit Typkennzeichen. Ein **Bild** hat gar keinen Befehl. `proof:shell-surface` Prüfung 3 führt beide namentlich. |
| **A-A-2** | **erfüllt** | `check_link`: Positivliste auf `parsed.scheme()` (nicht auf einem Präfix der Rohfassung); `host_str()` vorhanden **und** nicht leer; `username().is_empty() && password().is_none()`; `value.len() > 2_048` vor dem Zerlegen; `chars().any(char::is_control)` **vor** `Url::parse`. Gemessen gegen alle 28 Zeichenketten aus 20.2 (siehe Abschnitt 3). |
| **A-A-3** | **erfüllt** | `if parsed.as_str() != value { return Err(LinkNotNormalized) }`. Es wird **nicht** normalisiert und nicht geöffnet, sondern abgewiesen. Gemessen: alle zehn Zeilen der Festpunkttabelle idempotent, `HTTP://example.org/` und ` https://example.org` und `ht<TAB>tps://…` und `https://exam<ZWSP>ple.org/` und `https://example.org/<RLO>gpj.exe` roh abgewiesen, ihre Normalformen angenommen. |
| **A-A-4** | **erfüllt, eine Hälfte ungemessen** | `check_file`: `is_absolute()` **und** `is_unc()`. Letztere prüft **beide** Schreibweisen (`\\` und `//`, plattformunabhängig) **und** das Präfix (`UNC`, `VerbatimUNC`, `Verbatim`, `DeviceNS`). Der Kommentar sagt ausdrücklich, daß `is_absolute()` allein nicht genügt. Steuerzeichen und ≤ 4 096 Bytes vorher. **Teilweise offen:** Die Präfixfälle laufen auf einem Linux-Läufer nicht durch `Component::Prefix` — die Rohtextprüfung fängt sie dort ab. Prüffälle unter `#[cfg(windows)]` gehören unit-tester (Abschnitt 6). |
| **A-A-5** | **erfüllt** | `INDIRECT_EXTENSIONS = ["lnk","url","pif","scf","desktop"]`, verglichen kleingeschrieben auf dem letzten Punktsegment. `x.exe`, `x.bat`, `x.ps1` werden **nicht** hier abgewiesen. Gemessen: `takt-probe.LNK` → `Indirect`, `takt-probe.exe` → `Ok`. Der Modulkopf sagt in eigenen Worten, warum eine Verbotsliste keine Grenze ist. |
| **A-A-6** | **erfüllt, alle sechs** | `AttachmentOpenDialog.tsx`. (1) Voller Pfad in Festbreitenschrift, `overflow-wrap: anywhere`, **nie** gekürzt; Dateiname abgesetzt darüber. (2) Pfad, Dateiname **und Endung** durch `foreignText`; `proof:foreign` grün mit 164 behandelten Übergaben. (3) „Takt übergibt diese Datei an die Standardanwendung des Systems — dasselbe wie ein Doppelklick im Dateimanager." (4) Beide Knöpfe `variant="secondary"` (bei ausführbarer Endung rechts `danger`), Fokus auf dem **Dialog** (`tabIndex={-1}`), Enter löst nichts aus. (5) **Kein** „nicht mehr fragen" und **kein** Kontrollkästchen — Designsystem 8 behält es dem Zurücksetzen des Exportstatus vor. (6) Kein `window.confirm`. |
| **A-A-7** | **erfüllt** | `Attachments.open()` ruft `openAttachmentLink` unmittelbar; es gibt für `kind === "link"` keinen Dialogzweig. |
| **A-A-8** | **erfüllt** | `enum Rejection` mit 15 Werten und `key()`; die Befehle geben `rejection.key().to_string()`. **Kein** `format!` mit dem Wert. Die deutschen Sätze stehen in `REFUSAL_TEXT` (`Attachments.tsx`) und nennen den abgewiesenen Wert ebenfalls nicht. |
| **A-A-9** | **erfüllt, mit vier Gegenproben** | `OPEN_CALL_SITES` in `proof-shell-surface.mjs`: `release.rs>takt_open_release→release_url`, `attachment.rs>takt_open_attachment_link→check_link`, `attachment.rs>takt_open_attachment_file→check_file`. Gemessen wird je Aufrufort, daß die Prüffunktion **vor** dem `.open(` steht und ihre Anweisung in `?`/`ok_or`/`return Err` endet. Gegenproben: vierter Aufrufort in `hilfe/mod.rs`; Prüfung entfernt; Prüfung da, Ergebnis nicht verwendet; **zusätzlich** ein eingetragener Aufrufort, der verschwindet. Alle vier schlagen an. |
| **A-A-10** | **halb** | `cargo test` steht in `pnpm check` (`test:rust`, vom Orchestrator schon eingerichtet — die Vorbedingung T-145-8 ist damit erfüllt). Die **Windows-Läufer-Hälfte** liegt in `.github/workflows/**` und gehört nicht mir. Siehe offene Frage 1. |
| **A-A-11** | **erfüllt** | `capabilities/default.json` unverändert: `core:default`, `core:window:allow-start-dragging`, `dialog:allow-open`. Kein `shell:`, kein `dialog:allow-save`, kein `fs:*`. `chooseAttachmentFile()` benutzt denselben `plugin:dialog|open` mit `directory: false`. `proof:shell-surface` Prüfung 1 mit vier Gegenproben grün. |
| **A-A-12** | **erfüllt, neu gemessen** | `checkContentSecurityPolicy` prüft jetzt zusätzlich `img-src` gegen `'self' data:` (`devCsp` zusätzlich `http://localhost:5173`). Gegenprobe „`http://127.0.0.1:17843` in img-src" schlägt an. `tauri.conf.json` ist **unverändert**. |

### An domain-dev und integration-dev (A-A-13 bis A-A-23)

**Nicht meine Hoheit.** Gebaut hat sie T-146 in derselben Welle. Ich führe sie hier trotzdem
einzeln auf, weil die Aufgabe „Auflage für Auflage" verlangt — und weil an jeder von ihnen hängt,
ob **meine** Fläche trägt. Die Spalte sagt, was ich aus meiner Seite dazu beitrage und was ich
gelesen, nicht angenommen habe.

| ID | Meine Seite |
|---|---|
| **A-A-13** | **Nicht verletzt.** Die Oberfläche normalisiert **nirgends** eine Adresse: Sie schickt den getippten Wert an `POST …/attachments` und zeigt danach den Wert, den der Dienst zurückgibt. `lib/attachmentLabel.ts` zerlegt bewußt nichts (AN-03) — eine zweite Normalisierung in der Anzeige wäre genau die zweite Stelle, die A-A-13 ausschließt. |
| **A-A-14** | **Nicht meine Prüfung.** Die Zeichenklasse (`FORBIDDEN_NAME_CHARACTERS`, dazu `U+200B` und `U+FEFF` für die Adresse) liegt an der Tür des Dienstes. Die Oberfläche prüft sie **nicht** noch einmal: Sie würde damit behaupten, eine Kontrolle zu sein, und der Bestand liegt dazwischen. |
| **A-A-15** | **Nicht meine Zahl.** Die Obergrenze wird beim Lesen gezählt, im Dienst. Die Oberfläche schickt bei `kind: "image"` einen **`sourcePath`** und keine Bytes — der Rumpf einer Anfrage trägt nach B-1.7 ein Megabyte, ein Bild bis zu acht Mebibyte. Überschreitung erscheint als Fehler **am Feld**, mit der Obergrenze im Klartext, sobald der Dienst sie meldet. |
| **A-A-16** | **Nicht meine Positivliste.** Die Kopfsignatur prüft der Dienst. Die Oberfläche schlägt im Systemdialog Bildendungen vor (`png`, `jpg`, `jpeg`, `gif`, `webp`) — und `chooseAttachmentFile` sagt in seinem Kommentar ausdrücklich, daß dieser Vorschlag **eine Bequemlichkeit und keine Prüfung** ist. Ein `.svg` läuft durch den Vorschlag nicht, durch die Endungsprüfung nie und an der Signatur ohnehin auf. |
| **A-A-17** | **Nicht verletzt, und die Anzeige nutzt es.** Der Dateiname der Kopie wird **erzeugt**; die Oberfläche zeigt bei `kind: "image"` deshalb **nicht** `attachment.target`, sondern nur den Titel beziehungsweise das Wort „Bild" (`AttachmentRow`). Ein erzeugter Name sagt niemandem etwas, und ihn anzuzeigen sähe aus wie ein Fehler. |
| **A-A-18** | **Nicht mein Löschweg.** `deleteAttachment` ruft `DELETE …/attachments/{id}`; das Mitgehen der Bildkopie besorgt der Dienst. Der Bestätigungsdialog **sagt es dem Benutzer** — bei einem Bild steht dort: „Die Kopie des Bildes im Datenverzeichnis von Takt wird mit gelöscht. Die Datei, aus der sie stammt, bleibt unberührt." |
| **A-A-19** | **Nicht meine Formprüfung, aber meine Eingabe.** Das Feld ist `type="date"` und kann von sich aus nur `YYYY-MM-DD` liefern; der Hinweistext nennt es als Bedienkomfort, und der Kommentar an `TodoCreate.dueDate` sagt ausdrücklich, daß die Kontrolle an der Tür des Dienstes sitzt. **Der Zustand wird gerechnet und nicht gespeichert:** `deadlineState` reicht `dueState` aus `@takt/domain` durch, `useToday` zieht ihn bei Mitternacht und bei `visibilitychange` neu. Es gibt in der Oberfläche **keinen** zweiten Tagesbegriff. |
| **A-A-20** | **Nicht verletzt, gemessen an der Abwesenheit.** Ich habe `ExportSourcePath`, `ExportCandidate` und `ExportGroup` nicht angefaßt. Weder Frist noch Anhang erscheinen in S-07 oder S-14 — ausdrücklich und mit Begründung (T-144: „nein, und zwar hart"; dieselbe Grenze wie beim Vermerk). |
| **A-A-21** | **Nicht verletzt.** Die Oberfläche ruft die Anhangsrouten unter `/todos/{id}/attachments`, also **außerhalb** von `/addin` und außerhalb von `SHARED_PATHS`. Sie ruft keine Add-in-Route, und `api/types.ts` führt kein Anhangsfeld in einem Add-in-Typ. |
| **A-A-22** | **Nicht mein Prüffall.** Er mißt am Bestand, nicht an der Oberfläche. |
| **A-A-23** | **Nicht verletzt.** Die Oberfläche liest `GET /api/v1/addin/context` nicht und erwartet dort weder Anhangs- noch Fristfeld. |
| **A-A-24** | **erfüllt, aus meiner Seite.** Kein Öffnen-Befehl läuft ohne Klick. Die einzige Anzeige ohne Handlung ist das Vorschaubild (`GET …/image`), und das ist ein Byte-Abruf, kein Öffnen. Kein Vorabholen, keine Lupe beim Überfahren (im CSS ausdrücklich vermerkt). |

---

## 3. Die Messung, auf die A-A-2 und A-A-3 sich stützen

Gefahren in einem Wegwerf-Programm gegen dasselbe `url 2.5.8`, mit **derselben** Funktion, die in
`attachment.rs` steht. Alle 28 Zeichenketten aus 20.2 plus fünf Normalformen:

* Alle sieben gefährlichen Schemata → `Scheme`.
* `\\server\freigabe\datei.txt` und `//server/freigabe` → `Unparsable`;
  `file://server/freigabe/…` → `Scheme`. **Der Typ Verweis braucht keine eigene UNC-Regel**
  (T-145-10, bestätigt).
* `ht<TAB>tps://…`, `java<LF>script:…`, `http<NUL>s://…` → `Ctl` — abgewiesen **vor** dem
  Zerlegen, also bevor der Zerleger sie stillschweigend zusammenzieht.
* `http:/\example.org/`, ` https://…`, `https:///pfad`, Homoglyph, RLO, Nullbreite → `NotNorm`.
* `https://evil.example@gutartig.example/` → `Userinfo` (es ist ein Festpunkt und fiele sonst
  durch).
* Die fünf Normalformen (`http://example.org/`, `…/a%20b`, `…/%E2%80%AEgpj.exe`,
  `xn--exmple-4nf.org`) → **angenommen**.
* Festpunkttabelle: `alle idempotent: true` über alle zehn Zeilen.

Pfade: `.LNK` → `Indirect`, `.desktop` → `Indirect`, `.exe` → durchgelassen (geht durch die
Rückfrage), `\\server\…`, `//server/…`, `\\?\C:\…` → `Unc`, relativ → `NotAbs`, nicht vorhanden
→ `Missing`, `\n` im Pfad → `Ctl`, 5 000 Zeichen → `TooLong`.

---

## 4. Die Frist in der Oberfläche

**Zwei Anzeigestellen, ein Eingabeort, eine Zahl** — genau die Ableitung aus T-144 8.1.

| Ort | Was |
|---|---|
| **S-02** Todo-Liste | `DeadlineFlag` zwischen `DoneFlag` und den Tags |
| **S-04** Kanban-Karte | derselbe Baustein in der Kopfzeile der Karte |
| **S-03** Detailansicht | eigene Karte „Frist" mit Zustand und dem Satz, was sie **nicht** tut |
| **Todo-Formular** | `TextField type="date"`, Beschriftung **„Frist"** |
| **S-01** Dashboard | Kachel „Überfällig" mit einer **Zahl**, und nur wenn sie größer als null ist |
| S-05, S-06, S-07, S-12 | **nichts** — wie T-144 es verlangt |

**Der Name.** In der Oberfläche steht ausschließlich „Frist" (A-19.2). Die Zustandswörter sind
„Überfällig" und „Heute fällig"; „später fällig" ist ein **Begriff** und steht nicht auf dem
Bildschirm — dort steht nur das Datum.

**Die drei Auflagen aus T-144 8.2, alle drei gebaut:** ein Element (kein Baustein je Zustand),
abwesend ohne Frist (`return null` bei `no_due_date`), nur zwei der drei laut.

**Sechs Merkmale, nur eines Farbe:** Wortlaut, absolutes Datum, Symbol, Füllung, Schriftschnitt,
Farbe. Die Konturen liegen in **Textstärke** (`--danger-text`, `--warning-fg`) und nicht in der
zarten Rahmenfarbe — dieselbe Begründung wie bei `.doneflag--done`, und erst so tragen sie die
3:1 aus SC 1.4.11. Gemessen: `pnpm --filter @takt/web contrast`, 0 von 474 durchgefallen (44 Paare
sind neu).

**Der zugängliche Name nennt immer das Datum:** `„Überfällig — Frist: 12.09.2026"`,
`„Frist: 19.09.2026"`. `role="img"` gibt dem Element einen zusammenhängenden Namen.

**Der Zustand bleibt ohne Klick aktuell (E-073 Punkt 2).** `useToday` — `visibilitychange` **und**
ein `setTimeout` auf `calendarDayBounds(heute).endsBefore`, also die nächste Mitternacht der
maßgeblichen Zeitzone. Kein Minutentakt. Die Wartezeit ist auf einen Tag gedeckelt: `setTimeout`
über 2³¹−1 ms feuert sofort, und bei einer weit verstellten Systemuhr wäre das eine Schleife —
dieselbe Falle, die T-143 im Prüftakt der Versionsprüfung gefunden hat. **Ein Haken je Ansicht**,
nicht je Zeile: Bei achtzig Karten hätte das Board sonst achtzig Zeitgeber auf dieselbe Mitternacht.

**Sortieren und Filtern (A-19.20).** Zwei Auswahllisten in der Filterleiste von S-02, dazu je ein
Eintrag in der Leiste der aktiven Filter (auch für die Ordnung — wer eine Liste in ungewohnter
Reihenfolge vorfindet, sucht den Grund zuerst bei den Filtern). Gerechnet wird im **Dienst**:
`?dueState=` und `?sortByDueDate=`. E-074 Punkt 2 ist damit dort umgesetzt, wo er hingehört; die
Oberfläche baut **kein** Platzhalterdatum und der Hinweistext an der Ordnung sagt den Satz
ausdrücklich.

---

## 5. Die Anhänge in der Oberfläche

Fünf Flächen, je fünf Zustände, gebaut nach der Matrix in T-144 8.3.

* **A — Bereich.** Leer (`EmptyState` mit dem zweiten Satz über „Takt kopiert nur Bilder"), lädt
  (`LoadingBlock`, drei Skelettzeilen), Zeiger, Fokus (`:focus-within` am **ganzen**
  Zeilenelement), Fehler (`InlineMessage` mit „Erneut versuchen", Karte **nicht** ausgeblendet).
* **B — Hinzufügen.** Art zuerst (`RadioRow`, Voreinstellung **Verweis**), Feld wechselt mit ihr,
  Beschriftungen wörtlich nach A-19.10 („Adresse", „Bild", „Dateipfad", „Titel"). Auswahlknopf für
  Datei und Bild über denselben Systemdialog; `unavailable` fällt auf das Textfeld zurück und nennt
  den Grund. Bestätigung als Meldung mit dem Hinweis auf den Rückweg (E-059: umkehrbar → Rückweg,
  keine Rückfrage).
* **C — Liste.** Titel, sonst Ersatzbezeichnung, sonst voller Wert — **nie** eine leere Zeile.
  Zugänglicher Name nennt die Art als **Wort** („Verweis öffnen: …"). Der volle Wert steht in einer
  zweiten Zeile; bei einer Datei ist der Pfad die einzige Auskunft darüber, was gleich startet.
* **D — Vorschaubild.** `data:`-Adresse aus `mediaType` und `base64`, die der Dienst liefert. Die
  Fläche steht in ihrer Größe da, **bevor** das Bild kommt. Kein Vergrößern beim Überfahren. Nicht
  lesbar → Feld mit Satz, **kein** kaputtes Bildsymbol.
* **E — nicht öffenbar.** Der Grund steht **in der Zeile**, nicht im Meldungsstapel (der liegt
  hinter der Abdunklung, solange ein Dialog steht). Der Anhang verschwindet nicht. 15 Sätze zu 15
  Schlüsseln, und sie unterscheiden **Beobachtung** („ist an diesem Pfad nicht mehr vorhanden") von
  **Regel** („Takt öffnet nur http und https").

**Fremder Text.** Titel, Ersatzbezeichnung, voller Wert, Pfad, Dateiname **und Endung** gehen durch
`<Foreign>` beziehungsweise `foreignText`. `proof:foreign` hat mich dabei dreimal rot gemacht und
jedes Mal zu Recht: Er hat `fileNameOf`, `extensionOf`, `runsWhenOpened`, `withoutScheme` und die
beiden Öffnen-Funktionen als Senken eingefordert, die ihre Herkunft in der Signatur nennen. Sie tun
es jetzt. Die Musterseite fährt den Fall mit `rechnung\u{202e}fdp.exe` in Liste **und** Rückfrage.

**`EncodedBytes`** ist ein neuer Name im Vokabular von `api/types.ts` (und in `proof-foreign.mjs`).
Begründung steht an beiden Stellen: Die Base64-Bytes eines Vorschaubildes sind kein Anzeigetext —
`ForeignText` forderte an jeder Verwendung eine Behandlung ein, die es für Bytes nicht gibt, und
`string` wäre unsichtbar.

---

## 6. Die fünf Befunde aus dem Tor

**O-BN / T-143 B-1 und B-2 (blockierend) — erledigt.**
`readCapabilityFiles` und `readRustSources` sind durch **einen** rekursiven Leser ersetzt
(`readTree`); Fähigkeitendateien werden mit `.json`, `.json5` **und** `.toml` gelesen, TOML über die
Rohtextprüfung plus eine Prüfung auf `permissions =`. Zwei neue Gegenproben (eine `shell.toml` in
einem Unterordner, eine `.json5` mit Shell-Zeile) und eine für den vierten Aufrufort in
`hilfe/mod.rs`.
**Dazu eine Prüfung, die T-143 verlangt hat und die ich für die wichtigere halte:** Der **Leser
selbst** wird gegen einen echten Baum gemessen — angelegt im Temporärverzeichnis des
Betriebssystems, nicht in `capabilities/` oder `src/`. Eine dort liegengebliebene Fähigkeitendatei
würde von Tauri angewandt; ein Nachweis, der die Lücke aufmacht, die er mißt, wäre der schlechteste
denkbare Umbau.
Nebenbei repariert: `checkOpenCallSites` las bis dahin zeilenweise und übersah Blockkommentare und
Klammern in Zeichenketten. Es gibt jetzt zwei längentreue Textfilter — Kommentare für die
Adreßsuche, Kommentare **und** Zeichenkettenrümpfe für die Struktur.

**O-BV / T-145-7 (Vorbedingung) — erledigt. Was der Lauf jetzt benennt statt zu zählen.**

Vorher stand in `checkOpenCallSites` eine Zahl: *„Es gibt `1` Aufrufort für `open`; erlaubt ist
genau einer."* Mit den Anhängen wären es drei geworden, und die Zahl auf drei zu setzen wäre der
Nachweis, der grün wird, ohne etwas geprüft zu haben.

An ihrer Stelle steht `OPEN_CALL_SITES` — eine **ausgeschriebene Liste mit drei Angaben je
Eintrag**: Datei, Funktion, Prüffunktion.

```
release.rs    > takt_open_release()            →  release_url()
attachment.rs > takt_open_attachment_link()    →  check_link()
attachment.rs > takt_open_attachment_file()    →  check_file()
```

Der Lauf schreibt diese drei Zeilen am Ende **aus** — grün wie rot —, damit niemand die Zusage in
der Quelle suchen muß. Gemessen werden vier Eigenschaften, und keine davon ist eine Zahl:

1. **Jede** Funktion mit einem `.open(` steht in der Liste. Die Funktionsgrenzen kommen aus einer
   Klammerzählung über ein Gerüst, aus dem Kommentare **und** Zeichenkettenrümpfe längentreu
   entfernt sind — sonst zählte ein `format!("… {} …")` in `lib.rs` mit und die Grenzen wären falsch.
2. Für jeden Eintrag steht die zugehörige Prüffunktion **vor** dem `.open(` im selben Rumpf.
3. Ihr Ergebnis **trägt** das Öffnen: Die Anweisung, in der sie steht, endet in `?`, `ok_or` oder
   `return Err`.
4. Jeder eingetragene Aufrufort kommt im Baum auch **vor** — eine Liste, die nur Zuwachs bemerkt,
   verliert ihre Aussage beim ersten Umbau.

**Belegt durch vier Gegenproben**, die im selben Lauf gefahren werden und alle vier anschlagen:

| Gegenprobe | Was eingesetzt wird | Welche Eigenschaft sie belegt |
|---|---|---|
| `T-136-1: ein vierter Aufrufort für \`open\` in einem Untermodul` | `hilfe/mod.rs` mit `app.shell().open(irgendwas, None)` | 1 — und zugleich, daß der Leser Unterordner erreicht (T-143 B-2) |
| `A-A-9: ein eingetragener Aufrufort öffnet ohne seine Prüfung` | `check_link(&url)…?` wird durch `Url::parse(&url)…?` ersetzt | 2 |
| `A-A-9: die Prüfung steht da, ihr Ergebnis trägt das Öffnen aber nicht` | `check_file(&path)…?` wird zu `let _ = check_file(&path);` plus `Path::new(&path)` | 3 |
| `A-A-9: ein eingetragener Aufrufort verschwindet aus dem Baum` | `attachment.rs` wird aus der Quellenliste genommen | 4 |

Die dritte ist die, auf die es ankommt: Sie ist der Fall, in dem eine Prüfung **dasteht** und
trotzdem nichts hält — genau die Bauart, vor der 14.7 warnt.

**O-BO / T-143 S-2 — erledigt, und gemessen statt aufgelöst.** `build-app.mjs` prüft mit
`VERSION_SHAPE` **zeichengleich**; `proof:shell-surface` Prüfung 6 liest `packages/domain/src/version.ts`,
zieht den Ausdruck heraus und verlangt ihn wörtlich im Bauskript. Gegenprobe: der alte, lockere
Ausdruck macht den Lauf rot. Der Ausdruck aus `@takt/domain` einzubinden wäre besser — das Paket
liefert `.ts`, und ein Eintrag in `apps/desktop/package.json` ist eine Entscheidung des
Orchestrators (offene Frage 2 aus T-143). Siehe offene Frage 2.

**O-BJ / T-144 U-01 (blockierend) — erledigt, mit einer dritten Lösung.**
`useUpdateNotice` merkt sich jetzt, ob der Hinweis beim **ersten** Ladevorgang kam (`arrival`).
Beim Start bleibt der modale Dialog, wie er ist. Mitten in der Sitzung erscheint stattdessen eine
**nicht-modale Leiste** über dem Inhalt: `role="status"`, kein Fokuswechsel, kein Scrim, mit beiden
Fassungsnummern im Text (A-18.6 ist damit erfüllt, ohne daß jemand klicken muß), einem Knopf
„Ansehen" und einem Schließknopf.
**Warum nicht die beiden Vorschläge aus T-144.** „Dialog ohne Fokusübernahme" wäre ein zweiter
Fehler statt einer Behebung: `aria-modal="true"` unter einer Abdunklung verbirgt den Rest der
Anwendung vor Hilfsmitteln; bliebe der Fokus draußen, tippte der Benutzer in ein Feld, das für
seine Vorlesehilfe nicht mehr existiert. „Erst beim nächsten Start zeigen" widerspräche A-18.2
(„beim Start **und danach regelmäßig**") — ein Takt, das über Tage läuft, erführe nie etwas. Der
Weg über die Leiste macht den Fokuswechsel zu einer **angeforderten** Änderung (SC 3.2.5).

**O-BM / T-144 U-02 — erledigt.** `loading={picking || shell === null}` am Auswahlknopf, dazu eine
Frist von **2 000 ms** (`SHELL_ANSWER_GRACE_MS`) nach dem Vorbild von `QUIT_GRACE_MS`: Läuft sie ab,
wird `pickerFailure` gesetzt, das Textfeld tritt an die Stelle des Dialogs, und der Grund steht
darunter. Zwei Sekunden und nicht fünf, weil `isShellPresent()` ein Modul lädt und eine Eigenschaft
liest.

**O-BK / T-144 U-04 — Befund für domain-dev, kein Bau von mir.**
Gemessen: `unit.todos.search` in `packages/storage/src/sqlite/repo-todos.ts:90` sucht in
`t.title` und `t.call_number`. `searchEverything` (`apps/local-api/src/usecases/todos.ts:469`)
filtert zusätzlich Buchungen über `entry.note` — also den **Leistungstext**, nicht den Vermerk.
**Der Dienst trifft den Vermerk nicht.** Nach der Entscheidung des Orchestrators (E-038 gilt) ist
das ein Befund für domain-dev; der Text in `GlobalSearch.tsx:225` sagt heute die Wahrheit und bleibt
deshalb stehen. Zwei Dinge kommen mit, sobald der Dienst es tut:
1. Der Satz in `GlobalSearch.tsx` muß umgeschrieben werden (eine Zeile, gehört mir).
2. **C-22 lebt wieder auf** — E-038 verlangt dann die Gruppierung nach Trefferart, weil sichtbar
   sein muß, ob ein Treffer aus einem internen Vermerk stammt oder aus einem Text, der beim Kunden
   gelandet ist. Das ist eine eigene Aufgabe und keine Zeile.

---

## 7. Zustände aus Abschnitt 15 — was neu ist

| Fläche | Leer | Lädt | Zeiger | Aktiv/Fokus | Fehler | Bestätigung |
|---|---|---|---|---|---|---|
| Anhangbereich | `EmptyState` | `LoadingBlock` | Zeile hebt sich | `:focus-within` am Zeilenelement | `InlineMessage` + Rückweg | — |
| Hinzufügen-Dialog | Grund **am Feld**, Knopf gesperrt | Anzeiger am Auswahlknopf | aus `FormDialog` | Fokusfalle, Escape | vier Fälle, drei am Feld | Meldung mit Rückweg |
| Anhangzeile | entfällt | siehe Bereich | Entfernen erscheint | Fokusring, dann Entfernen | in der Zeile, bleibt stehen | — |
| Vorschaubild | entfällt | Fläche in Endgröße | leichte Anhebung, **keine Lupe** | Fokusring | Feld mit Satz | — |
| Rückfrage Datei | entfällt | Anzeiger am Bestätigungsknopf | aus `Button` | Fokus auf dem Dialog | bleibt stehen, nennt den Grund | — |
| Frist (Marke) | **nichts** (A-19.5) | — | — | `role="img"` mit Datum im Namen | — | — |
| Versionsleiste | entfällt | — | aus `Button` | keine Fokusübernahme | — | — |

Tastatur: Jede Fläche ist vollständig erreichbar, der Fokus ist überall sichtbar. Der einzige neue
Fokusgriff steht im Öffnen-Dialog und ist derselbe wie im Versionsdialog (Fokus zurück auf den
Dialog, wenn ein fokussierter Knopf gesperrt wird).

---

## 8. Befehle und ihre Ergebnisse

Ports 17843 und 17844 waren vor **jedem** Lauf frei (geprüft mit `ss -ltnp`).

| Befehl | Ergebnis |
|---|---|
| `pnpm typecheck` | **Quellen aller Pakete grün.** `typecheck:test` bricht in **drei fremden Dateien** ab — siehe unten |
| `pnpm --filter @takt/web contrast` | **0 von 474** durchgefallen (44 Paare neu) |
| `pnpm run proof:foreign` | **14 bestanden, 0 fehlgeschlagen** |
| `pnpm run proof:shell-surface` | **6 Prüfungen und 20 Gegenproben** bestanden (vorher 4 und 10) |
| `pnpm test` | **66 Dateien, 1 171 Prüffälle**, alle grün |
| `pnpm run test:rust` | **31 bestanden** |

`pnpm desktop` und `pnpm test:e2e` habe ich nicht gestartet.

**Die drei roten Dateien in `typecheck:test`:**
`apps/local-api/test/routes/addin/service.test.ts:119`,
`apps/local-api/test/usecases/time-entry-movement.test.ts:167`,
`apps/local-api/test/usecases/todo-done-movement.test.ts:174`.
Alle drei bauen ein `Todo`-Objekt von Hand, und `Todo.dueDate` ist seit T-146 ein Pflichtfeld. Sie
liegen unter `apps/*/test/**` und gehören **unit-tester**; ich habe sie nicht angefaßt. Behebung:
`dueDate: null` in den drei Vorgabeobjekten.

---

## 9. Annahmen

* **AN-01 — der Vertrag zu T-146.** T-146 lief parallel; sein Stand lag vor, als ich die Naht
  gezogen habe. Ich habe mich auf folgende Namen verlassen und sie **gelesen**, nicht geraten:
  `Todo.dueDate: CalendarDay | null`; `TodoCreate.dueDate` und `TodoUpdate.dueDate` als
  `.optional()` mit `null` = entfernen; `?dueState=` als kommagetrennte Liste aus
  `overdue|due_today|due_later|no_due_date`; `?sortByDueDate=asc|desc`;
  `GET/POST/DELETE /todos/{id}/attachments` und `GET …/{attachmentId}/image`;
  `AttachmentView { id, todoId, kind, title, target, position, createdAt }`; der `POST`-Rumpf als
  unterschiedene Vereinigung mit `url`/`path`/`sourcePath`; `AttachmentImage { mediaType, base64 }`.
  **Läuft daran noch etwas nach, bricht `tsc` und nicht die Laufzeit** — alle Felder sind typisiert.
* **AN-02 — „Überfällig seit N Tagen" habe ich nicht gebaut.** T-144 schlägt es vor. Es wäre eine
  **Differenz zweier Kalendertage**, also eine Rechnung über Zeit, und die gehört nach
  `packages/domain`. Stattdessen steht bei „Überfällig" das absolute Datum — das ohnehin verlangt
  ist und ohne jede Rechnung auskommt. Siehe offene Frage 3.
* **AN-03 — die Ersatzbezeichnung zerlegt nichts.** Kein `new URL()` in der Anzeige: Das wäre eine
  dritte Meinung darüber, was eine Adresse ist (neben der Normalisierung in der Domäne und dem
  Festpunkt in der Hülle). Was dasteht, ist Textbehandlung ohne Deutung — Präfix abschneiden,
  hinter dem letzten Trenner schneiden —, und im Zweifel der volle Wert.
* **AN-04 — die Kachel „Überfällig" erscheint nur bei einer Zahl größer als null.** Eine dauerhafte
  „0 überfällig" wäre eine Fläche, die nie etwas meldet und deshalb nicht mehr gelesen wird.
* **AN-05 — die Musterseite rechnet gegen einen festen Tag** (`SHOWCASE_TODAY = "2026-09-05"`).
  Mit der Systemuhr sähe sie an jedem zweiten Tag anders aus, und ein Abgleich gegen den Prototyp
  wäre nicht wiederholbar.
* **AN-06 — Beispieladressen unter `.invalid`.** `proof:shell-surface` Prüfung 4 verlangte bis
  T-147 **genau eine** Adresse in der ganzen Oberfläche. Mit Anhängen stimmt die Prämisse nicht mehr
  (Platzhalter `https://…`, Schemapräfixe, Beispiele auf der Musterseite). Ich habe die Prüfung
  **verschärft statt gelockert**: Die Release-Adresse steht genau einmal; alles andere muß der
  lokale Dienst sein, ein Schemastück **ohne Wirt**, oder eine reservierte Beispieladresse unter
  `.invalid` (RFC 2606) **und dann nur unter `showcase/`**. Drei neue Gegenproben.
* **AN-07 — CSS-Klasse heißt `.deadline`, Daten heißen `dueDate`.** Der Baustein heißt
  `DeadlineFlag`, weil er die **Frist** darstellt; die Felder heißen wie im Dienst. Die Modifikatoren
  tragen die Zustandsnamen der Domäne (`.deadline--due_today`). Wenn das stört, ist es eine
  Umbenennung ohne Verhaltensänderung.

---

## 10. Risiken

* **R-T147-1 (hoch, Sicherheit).** Die Windows-Präfixfälle aus A-A-4 (`Prefix::UNC` und die drei
  Geschwister) **laufen auf diesem Läufer nicht durch ihren Zweig**: Unter Linux erzeugt
  `Path::components()` nie einen `Component::Prefix`. Was ich messen konnte, ist die Rohtextprüfung
  (`\\`, `//`), und sie fängt alle vier Schreibweisen ab. Die Präfixprüfung ist damit heute
  **unbelegter Code**. A-A-10 verlangt dafür einen Windows-Läufer; ohne ihn bleibt eine Zusage
  ungemessen.
* **R-T147-2 (mittel).** Die Endungsliste in `lib/attachmentLabel.ts` entscheidet über **Wörter**
  („Öffnen" oder „Ausführen"). Sie ist keine Grenze, und der Modulkopf sagt das dreimal — aber sie
  sieht aus wie eine. Wer sie später für eine Sicherheitsprüfung hält und die harte Abweisung in
  `attachment.rs` daraufhin für Verdopplung, hat die einzige Kontrolle entfernt.
* **R-T147-3 (mittel).** Die Rückfrage ist die letzte Verteidigung und **ein Mensch**. Alle sechs
  Eigenschaften zusammen machen sie zu einer guten Rückfrage; sie machen sie nicht zu einer
  Kontrolle (Bedrohungsmodell 20.9 Punkt 2). Der Unterschied zu vorher ist, daß Takt diesen Weg
  vorher nicht hatte.
* **R-T147-4 (niedrig).** `useToday` deckelt die Wartezeit auf einen Tag. Bei einer weit in die
  **Vergangenheit** verstellten Uhr rechnet er einmal je Tag neu und zeigt den Tag der Systemuhr —
  richtig, aber nicht den Tag der Wand. Das ist dieselbe Lage wie beim Export (E-025) und kein
  neuer Fall.
* **R-T147-5 (niedrig).** Die nicht-modale Versionsleiste ist wegklickbar. Wer sie wegklickt,
  bekommt den Hinweis beim nächsten Start wieder — nicht in dieser Sitzung. Das ist gewollt
  („Später entscheiden" tut dasselbe), aber es ist ein **dritter** Ausgang neben „Installieren" und
  „Überspringen", und er ist nicht in A-18.7 bedacht.
* **R-T147-6 (niedrig).** Das Vorschaubild liegt als Base64-Zeichenkette im Webview. Bei fünf
  Bildern zu je 8 MiB sind das rund 53 MiB im Arbeitsspeicher — mehr, als E-073 Punkt 3
  veranschlagt hat (dort: 5 MiB je Bild, rund 33 MiB). Der Dienst führt jetzt 8 MiB (A-A-15).
  Die Zahl ist domain-dev's, der Verbrauch meiner.

---

## 11. Offene Fragen an den Orchestrator

1. **Windows-Läufer für die Pfadfälle (A-A-10, zweite Hälfte).** `cargo test` steht in
   `pnpm check`. Der `windows-2022`-Läufer, den A-A-10 nennt, steht in
   `.github/workflows/release.yml` und gehört nicht mir. Wer trägt `cargo test` dort ein?
2. **Darf `apps/desktop/package.json` `@takt/domain` einbinden?** (T-143 offene Frage 2.) Solange
   nicht, mißt `proof:shell-surface` den Gleichlauf zeichengleich — das trägt, ist aber die zweite
   Wahl. Mit der Abhängigkeit fiele die dritte Formprüfung ersatzlos weg.
3. **Gehört „Überfällig seit N Tagen" in die Domäne?** T-144 schlägt den Satz vor; er braucht eine
   Differenz zweier Kalendertage. Ich habe sie nicht in der Oberfläche gebaut (AN-02). Wenn er
   gewollt ist: eine Zeile in `packages/domain/src/due-date.ts`, und `DeadlineFlag` nimmt sie.
4. **E-038 und die Gruppierung nach Trefferart.** Sobald die Suche den Vermerk trifft (O-BK),
   lebt C-22 wieder auf. Als eigene Aufgabe einplanen oder mit dem Suchumbau zusammen?
5. **`EncodedBytes` im Vokabular.** Ich habe einen neunten Namen in `api/types.ts` und in
   `proof-foreign.mjs` eingeführt (Base64 eines Vorschaubildes). Begründung steht an beiden
   Stellen; wenn der Orchestrator das Vokabular geschlossen halten will, ist die Alternative
   `ForeignText` mit einer benannten Ausnahme im Nachweis — schlechter, weil sie gepflegt werden muß.
6. **`.deadline` gegen `dueDate` (AN-07).** Soll der Baustein `DueDateFlag` heißen und die CSS-Klasse
   `.duedate`? Eine reine Umbenennung, aber sie gehört entschieden, bevor drei Agenten beide Wörter
   benutzen.

---

## 12. Was unit-tester und e2e-tester brauchen

Ich habe **keine** Prüffälle angelegt — weder unter `apps/*/test/**` noch in den
`#[cfg(test)]`-Blöcken von `src-tauri/src/**`. Was gebraucht wird:

**In `apps/desktop/src-tauri/src/attachment.rs`, `#[cfg(test)]` neben dem Befehl (unit-tester):**
1. Die **28 Zeichenketten aus 20.2** gegen `check_link`, mit dem dort gemessenen Ergebnis je Zeile.
   Die Werte, die ich gemessen habe, stehen in Abschnitt 3 dieses Berichts.
2. Die **zehn Zeilen der Festpunkttabelle**: Rohfassung abgewiesen, Normalform angenommen, und
   `Url::parse(norm).as_str() == norm` für alle.
3. `https://evil.example@gutartig.example/` → `LinkUserinfo` (der Fall, den der Festpunkt **nicht**
   fängt).
4. Länge: 2 048 Bytes bestehen, 2 049 nicht. Dasselbe für 4 096 beim Pfad.
5. `check_file`: `.lnk`, `.LNK`, `.url`, `.pif`, `.scf`, `.desktop` abgewiesen; `.exe`, `.bat`,
   `.ps1` **nicht** hier abgewiesen. Relativ, nicht vorhanden, Steuerzeichen.
6. **`#[cfg(windows)]`:** `\\server\freigabe\x.exe`, `//server/freigabe/x.exe`, `\\?\C:\x.txt`,
   `\\.\pipe\x`, `\\?\UNC\server\freigabe\x` — alle fünf `PathUnc`. Das ist der Teil, den ich nicht
   messen konnte (R-T147-1).
7. `Rejection::key()` ist über alle 15 Werte eindeutig und enthält nie einen Wert aus der Eingabe.

**Unter `apps/web/test/**` (unit-tester):**
8. `deadlineState` über die Tagesgrenze: `2026-09-04`/`2026-09-05`/`2026-09-06` gegen
   `2026-09-05`, dazu `null`.
9. `attachmentLabel`: Titel gesetzt; Titel leer und nur Leerzeichen; Verweis ohne Titel; Datei ohne
   Titel; Pfad, der auf `/` endet; Wert ohne Trenner. **Nie eine leere Zeichenkette.**
10. `extensionOf` / `runsWhenOpened`: `.gitignore`, `readme`, `x.`, `X.EXE`, `x.tar.gz`.
11. `useToday`: Zeitgeber auf die nächste Mitternacht, `visibilitychange`, und der Deckel bei einer
    weit verstellten Uhr (kein zweiter Aufruf binnen einer Sekunde).
12. **Die drei roten Dateien aus Abschnitt 8** (`dueDate: null` in den Vorgabeobjekten).

**Unter `tests/e2e/**` (e2e-tester):**
13. `Enter` auf dem Öffnen-Dialog öffnet **nichts** (A-A-6 Punkt 4).
14. Ein Verweis öffnet **ohne** Zwischendialog (A-A-7).
15. Eine Liste mit je einem Anhang jeder Art laden und die Aufrufe der Öffnen-Befehle zählen:
    **null** (A-A-24).
16. Ein Anhang mit `rechnung\u{202e}fdp.exe`: Die **angezeigte** Zeichenkette in Liste und
    Rückfrage messen (A-A-6 Punkt 2).
17. Der Versionshinweis mitten in der Sitzung nimmt den Fokus **nicht** aus einem Textfeld (O-BJ).
18. Der Auswahlknopf im Exportordnerfeld ist nach 2 s nicht mehr gesperrt, sondern durch das
    Textfeld ersetzt (O-BM).

---

## 13. Nächster Schritt

1. **Zuerst:** unit-tester mit den Punkten 1 bis 12, und dabei die drei roten Dateien aus
   Abschnitt 8 mitnehmen. Ohne 1 bis 7 ist `attachment.rs` eine Kontrolle ohne Prüffall — genau die
   Lage, die T-145-8 verhindern sollte.
2. **Parallel:** security-checker mit der Wiedervorlage aus 20.10 — jetzt gegen Code statt gegen
   einen Entwurf, Auflage für Auflage mit den Zahlen aus 20.7. Abschnitt 2 und 3 dieses Berichts
   sind dafür gedacht.
3. **Danach:** spec-ux-reviewer über die Screen-Matrix aus T-144 Teil 2 und über die drei
   Abweichungen, die ich begründet habe (AN-02, O-BJ dritte Lösung, AN-06).
4. **Als Entscheidung:** offene Fragen 1, 2 und 6 — alle drei sind billig und alle drei werden
   teurer, sobald jemand daneben baut.
