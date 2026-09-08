# T-139 — Versionsprüfung: Fassung, Öffnen-Befehl, Dialog

Aufgabe: T-139 — Versionsprüfung: die Fassung, der Öffnen-Befehl, der Dialog
Status: fertig

## Artefakte

**Neu**

| Datei | Was darin steht |
|---|---|
| `apps/desktop/src-tauri/src/release.rs` | `takt_installed_version`, `takt_open_release`, die Formprüfung `is_release_version`, die feste Adresse, vier `#[cfg(test)]`-Prüffälle mit der Ausbruchsliste aus 18.3 |
| `apps/desktop/scripts/proof-shell-surface.mjs` | Vier Wächter mit zehn Gegenproben (A-V-16 bis A-V-18, T-136-2, E-065) |
| `apps/web/src/lib/releasePage.ts` | Die Adresse **zum Lesen**, eine Stelle, Gleichlauf mit Rust gemessen |
| `apps/web/src/app/useUpdateNotice.ts` | Drei Quellen zusammenführen, Antworten ausführen, stiller Fehlschlag |
| `apps/web/src/app/UpdateNotice.tsx` | Die Verdrahtung; gibt `null` zurück, wenn nichts zu melden ist |
| `apps/web/src/components/UpdateDialog.tsx` | Der Dialog ohne Vorauswahl |
| `apps/web/src/showcase/UpdateNoticeSection.tsx` | Abschnitt 12 der Musterseite |

**Geändert**

`apps/desktop/src-tauri/src/lib.rs` (Modul + zwei Befehle in `generate_handler!`),
`apps/desktop/src/shell.ts` (`installedVersion`, `openReleasePage`, `ReleasePageResult`),
`apps/desktop/package.json` (`proof:shell-surface`),
`apps/web/src/api/types.ts` (`AppSettings.skippedVersion`, `AppSettingsUpdate.skippedVersion`, `VersionCheckView`),
`apps/web/src/api/endpoints.ts` (`getVersionCheck`),
`apps/web/src/app/connection.ts` (`readInstalledVersion`, `openReleasePage`),
`apps/web/src/app/App.tsx` (Einhängepunkt), `apps/web/src/showcase/Showcase.tsx` (Abschnitt 12),
`apps/web/design/DESIGNSYSTEM.md` (Änderungsblock, Regel 14 berichtigt, neue Regel 15, Abschnitt 12).

Die übrigen Änderungen im Arbeitsbaum unter `apps/web` stammen aus T-133 und sind nicht Teil
dieser Aufgabe.

## Zusammenfassung

Die Hülle nennt die installierte Fassung aus den einkompilierten Angaben und öffnet die
Release-Seite über einen Befehl, der **keine Adresse** entgegennimmt, sondern die
Fassungsbezeichnung gegen `^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$` prüft
und in eine im Erzeugnis feste Adresse einsetzt; nach Befund T-136-1 ist diese Prüfung die
einzige Kontrolle zwischen GitHubs Antwort und `xdg-open`/`ShellExecuteW`, und sie steht mit
ihren zehn Ausbruchsversuchen unmittelbar neben dem Befehl. In `capabilities/**` steht keine
Shell-Zeile; vier Wächter messen das, dazu die CSP zeichengleich, den einen Aufrufort für `open`
und den Gleichlauf der angezeigten mit der geöffneten Adresse — jeder mit einer eingesetzten
Verletzung als Gegenprobe. Die Oberfläche zeigt einen Dialog mit installierter Fassung,
verfügbarer Fassung und dem Verweis; beide Antworten tragen dieselbe Gestalt, der Fokus liegt
beim Öffnen auf dem Dialog und nicht auf einem Knopf, „Installieren" öffnet nur, und
„Überspringen" legt genau diese Fassung über `PATCH /settings` im Bestand ab. Liegt nichts vor —
aktuell, übersprungen, noch nicht geprüft, unerreichbar, unbrauchbare Antwort, keine Hülle —,
entsteht kein Element; die Entscheidung darüber trifft `decideUpdateNotice` aus
`packages/domain`, diese Oberfläche vergleicht keine Fassungen selbst.

## Auflage für Auflage (18.9), und woran es gemessen ist

### A-V-15 — Die installierte Fassung aus den eingeprägten Angaben

`release.rs:takt_installed_version` ist **ein** Aufruf: `app.package_info().version.to_string()`.
Kein `read_to_string`, kein `std::env::var`, kein `std::env::args`, kein Rückweg zum Sidecar.

Gemessen: `grep -rn "package_info" apps/desktop/src-tauri/src/*.rs` → zwei Fundstellen, beide in
`release.rs`, davon eine im Modulkommentar. **Ein** Aufruf (`release.rs:158`). Im ganzen Rust-Anteil gibt es keine Datei- oder Umgebungsquelle für eine
Fassung; die Zahl entsteht beim Bauen aus `tauri.conf.json` (E-065), im Auslieferungsbau über die
Überlagerung aus `scripts/build-app.mjs`. Die Oberfläche fragt die Hülle
(`connection.ts:readInstalledVersion`) und speichert den Wert nirgends — kein `localStorage`,
keine Einstellung, kein Zwischenspeicher über den Lauf hinaus.

**Zusatz, den die Auflage nicht verlangt und der trotzdem gilt:** Angezeigt wird nicht der rohe
Wert der Hülle, sondern `normalizeVersion(installed)` aus `packages/domain`. Was im Dialog steht,
hat damit dieselbe Formprüfung durchlaufen wie das, was verglichen wurde.

### A-V-16 — `takt_open_release(version: String)`, ohne Adresse, mit Formprüfung

Signatur: `pub fn takt_open_release(app: tauri::AppHandle, version: String) -> Result<(), String>`.
**Genau ein `String`** aus dem Aufruf; `AppHandle` wird von Tauri aus dem Befehlsumfeld gestellt
und ist über die JavaScript-Nutzlast nicht setzbar. Kein Parameter trägt Schema, Wirt, Pfad oder
Abfrage.

Die Prüfung `is_release_version` ist von Hand geschrieben (kein Prüfausdruck, keine zusätzliche
Kiste in der Lieferkette) und folgt der Tabelle aus 18.3 Zeile für Zeile:

| Frage der Tabelle | Umsetzung |
|---|---|
| Welche Form? | drei Zahlen zu je 1–9 ASCII-Ziffern, wahlweise `-` und Vorabkennung; **ohne** führendes `v` — ein `v` wird abgewiesen, abgeschnitten wird es an der einen Stelle in `packages/domain` (E-066 Punkt 3) |
| Welche Zeichen? | `value.is_ascii()` zuerst, danach `is_ascii_digit` im Kern und `is_ascii_alphanumeric \|\| '.' \|\| '-'` in der Vorabkennung. `/`, `\`, `?`, `#`, `:`, `@`, `%`, Leerzeichen, Zeilenumbruch sind damit unmöglich |
| Welche Länge? | `MAX_VERSION_LEN = 94`, geprüft **vor** jeder Zerlegung; `MAX_NUMBER_LEN = 9`, `MAX_PRERELEASE_LEN = 64` |
| Was bei Nichtbestehen? | `release_url` liefert `None`, der Befehl gibt `Err("version_rejected")` — technischer Schlüssel, **ohne** den abgewiesenen Wert. `shell.ts` übersetzt ihn in `{ outcome: 'rejected' }`; angezeigt wird ein deutscher Satz, nie der Wert |

Gemessen: `cargo test --offline --lib` → **26 bestanden, 0 fehlgeschlagen**, darunter vier neue.
`kein_ausbruchsversuch_erreicht_die_zusammensetzung` fährt die zehn Versuche aus 18.3 wörtlich
(`../../../evil`, `1.2.3/../../evil`, `1.2.3?x=1`, `1.2.3#a`, `1.2.3@evil.example`, `1.2.3\evil`,
`1.2.3%2f..%2f..%2fevil`, `1.2.3 evil`, `1.2.3\n`, `999999999999999999999.0.0`) und erwartet je
`false` **und** `release_url(...) == None`. Dazu `weist_ab_was_keine_fassung_ist` (leer, `v1.2.3`,
`1.2`, `1.2.3.4`, `1.2.3-`, Leerzeichen und Schrägstrich in der Vorabkennung, ein Bidi-Zeichen,
arabisch-indische Ziffern, zehnstellige Zahl, 64 gegen 65 Zeichen Vorabkennung, die Zeichenkette
aus 60 000 Zeichen aus A-V-8) und `laesst_durch_was_eine_fassung_ist`
(`0.0.0`, `1.2.3`, `0.10.0`, `999999999.999999999.999999999`, `1.0.0-rc.1`, `1.0.0-beta.10`,
`1.2.3-alpha-2`).

Die Prüffälle stehen **neben dem Befehl** in `#[cfg(test)]`, wie T-136-1 es verlangt, und nicht
in einer fernen Testdatei. Sie greifen damit formal in das Gebiet des unit-testers; das ist
Absicht der Auflage. T-140 sollte sie erweitern, nicht verschieben.

### A-V-17 — Keine Shell-Berechtigung in `capabilities/**`

`grep -n "shell:" apps/desktop/src-tauri/capabilities/*.json` → **leer** (Rückgabewert 1).
`capabilities/default.json` trägt unverändert `core:default`,
`core:window:allow-start-dragging`, `dialog:allow-open`. `tauri.conf.json` trägt **keinen**
Abschnitt `plugins`.

Gemessen von `proof:shell-surface` Prüfung 1 — über den rohen Text **und** über die geparste
Liste — mit zwei Gegenproben: eine eingesetzte Zeile `"shell:default"` und eine leere
Berechtigungsliste (die sonst grün wäre, weil dann nichts zu prüfen ist). Beide werden rot.

### A-V-18 — Die CSP bleibt zu, der Verweis ist ein Knopf

`connect-src` in `tauri.conf.json` ist unverändert
`'self' ipc: http://ipc.localhost http://127.0.0.1:17843`. Prüfung 2 vergleicht die Marken
zeichengleich gegen die zugesagte Liste, `devCsp` zusätzlich gegen die beiden
Entwicklungsherkünfte, und weist `api.github.com` in beiden ausdrücklich ab.

**Befund T-136-2 ist damit beantwortet, und zwar auf dem Weg (b):** Der Wächter liest die
Zeichenkette, statt dass ein Satz sie abschreibt. Die Zusage in `CLAUDE.md`/E-064 nennt drei
Marken, die Datei trägt vier; `ALLOWED_CONNECT_SRC` nennt die vier und erklärt an Ort und Stelle,
warum `http://ipc.localhost` dazugehört. Gegenproben: `https://api.github.com` eingesetzt, eine
Marke gestrichen, ein `plugins > shell > scope > open` eingesetzt — alle drei rot.

`grep -rn "href.*github" apps/web/src` → leer. Der Verweis ist ein `<Button>`, der über
`connection.ts:openReleasePage` den Befehl der Hülle ruft. Die Adresse steht als **Text** daneben
(A-18.6 verlangt den Verweis; ein Knopf allein ist eine Zusicherung), und Prüfung 4 hält diesen
Text zeichengleich gegen `RELEASE_TAG_PREFIX` aus `release.rs`. Zusätzlich misst sie, dass
`apps/web/src` **keine** eigene Brücke zur Hülle hat: kein `invoke(`, kein `@tauri-apps/`-Import
außerhalb von Kommentaren. Drei Gegenproben: ein geändertes Zeichen in der angezeigten Adresse,
eine zweite Adresse in der Oberfläche, ein eingesetztes `invoke("plugin:shell|open", …)`.

### Die übrigen Auflagen (A-V-1 bis A-V-14, A-V-19, A-V-20)

Sie gehören T-138. Berührt habe ich davon nichts; die Oberfläche stellt keine Anfrage ins Netz
(die CSP ließe sie auch nicht), liest aus der Antwort des Dienstes **genau ein** Feld und
protokolliert nichts.

## Die Anforderungen aus Abschnitt 18

| ID | Wo | Anmerkung |
|---|---|---|
| A-18.1 | `release.rs:takt_installed_version` | eine Quelle, siehe A-V-15 |
| A-18.2 | Dienst (T-138) + `useUpdateNotice` | Die Oberfläche liest beim Start und danach alle 6 h beim **Dienst** nach (kein Netzaufruf, A-V-10). Ohne dieses Nachsehen erführe ein tagelang laufendes Takt nichts von einer neuen Fassung |
| A-18.3 | `RELEASE_TAG_PREFIX` | eine Konstante, gemessen von Prüfung 3 und 4 |
| A-18.4 | `packages/domain` | `decideUpdateNotice`; diese Oberfläche vergleicht nichts |
| A-18.5 | `app/UpdateNotice.tsx` | `return null` — kein Element, kein leerer Behälter, kein Abzeichen |
| A-18.6 | `components/UpdateDialog.tsx` | installierte Fassung, verfügbare Fassung, Release-Seite als lesbarer Text |
| A-18.7 | ebenda | beide Knöpfe `secondary`, Fokus auf dem Dialog, keine Vorauswahl |
| A-18.8 | `useUpdateNotice:install` | ruft ausschließlich `openReleasePage(version)` |
| A-18.9 | überall | kein `fetch` auf eine Datei, kein `download`-Attribut, kein `execute`/`spawn`. Der Dialog sagt im Vorspann ausdrücklich, dass nichts geladen und nichts installiert wird |
| A-18.10 | `useUpdateNotice:skip` | `PATCH /settings { skippedVersion }` — im Bestand, nicht im Browserspeicher; die Regel „gleich, nicht kleiner-gleich" liegt in der Domäne |
| A-18.11 | `useUpdateNotice` | jeder Fehlschlag endet in `kind: "silent"`; der Ladevorgang fängt selbst ab, damit `useAsync` gar keinen Fehlerzustand bekommt |
| A-18.12 | — | Die Oberfläche stellt keine Anfrage nach außen |

## Zustände (Abschnitt 15/16)

| Zustand | Umsetzung |
|---|---|
| Leer | Der Normalfall: nichts erscheint. Auf der Musterseite als Satz benannt, weil es kein Bild dafür gibt |
| Laden | Während der Prüfung erscheint **nichts** — ein Ladeanzeiger für eine Prüfung, die unsichtbar bleiben soll, wäre der Fehler. Sichtbar ist nur der Ladezustand von „Überspringen" (`Button loading`) |
| Zeiger/Aktiv/Fokus | aus den vorhandenen Knopfklassen; kein neues CSS, keine neue Farbe |
| Fehler | Im Dialog, in einer von Beginn an stehenden `role="status"`-Fläche: Bezeichnung abgewiesen, kein Browser, keine Hülle, Überspringen gescheitert |
| Bestätigung | Meldung nach dem Öffnen der Seite und nach dem Überspringen (mit Fassungsnummer) |

Tastatur: Der Dialog ist vollständig bedienbar. Fokus beim Öffnen auf dem Dialog (`tabIndex={-1}`,
Titel und Beschreibung hängen an ihm), Tabulatorschleife auch aus dem Dialogkörper heraus
geschlossen (`keepTabInside` kennt den Behälter nicht — der erste Shift+Tab wäre sonst aus dem
Dialog herausgelaufen), Escape stellt zurück, der Fokus kehrt beim Schließen zum Auslöser
zurück. Sperrt sich während „Überspringen" jeder Knopf, geht der Fokus auf den Dialog statt an
den Dokumentkörper.

## Messungen

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | 0 — alle acht Pakete, `typecheck:test`, `typecheck:e2e`. Kein `any`, kein `as` auf einen Texttyp |
| `pnpm run proof:foreign` | 14 bestanden, 0 fehlgeschlagen; 106 Quelldateien, 1 Übergangsstelle mit 5 Aufrufen (vorher 4) |
| `pnpm --filter @takt/web contrast` | 0 von 432 Paaren durchgefallen (keine neue Farbe, keine neue Klasse) |
| `pnpm --filter @takt/desktop proof:shell-surface` | 4 Prüfungen, 10 Gegenproben, 0 rot |
| `cargo test --offline --lib` (in `apps/desktop/src-tauri`) | 26 bestanden, 0 fehlgeschlagen |
| `cargo fmt -- --check` | sauber |
| `pnpm test` | **1027 von 1028**. Der eine rote Fall ist fremd: `packages/storage/test/migration-0012-pool-rule-restrict.test.ts:63` erwartet `version: 12`, T-138 hat währenddessen `0013_skipped_version` gelegt. Kein Bezug zu dieser Aufgabe |
| `npx vitest run apps/web apps/desktop` | 85 bestanden, 0 fehlgeschlagen |

`pnpm desktop` und `pnpm test:e2e` sind auftragsgemäß nicht gelaufen.

## Annahmen

1. **Die Naht zu T-138.** Gebaut gegen `GET /version-check` mit dem Feld `latestVersion`.
   `packages/domain/src/version.ts` lag beim Bau bereits vor (`decideUpdateNotice`,
   `normalizeVersion`, `AppSettings.skippedVersion`) und ist unverändert benutzt; die **Route**
   gab es noch nicht. Beide Namen stehen an genau einer Stelle
   (`api/endpoints.ts:getVersionCheck`, `api/types.ts:VersionCheckView`); heißen sie anders, sind
   das zwei Zeilen. **Ein falscher Name kostet nichts weiter:** Die Route antwortet dann mit 404,
   der Fehlschlag ist still, und es erscheint nichts — dasselbe Verhalten wie „GitHub nicht
   erreichbar" (A-18.11). Gelesen wird ausdrücklich nur `latestVersion`; ob die Antwort weitere
   Felder trägt, ist der Oberfläche gleich.
2. **Ob die Route die Bezeichnung roh (`v1.2.3`) oder ohne `v` herausgibt, spielt keine Rolle.**
   `decideUpdateNotice` normalisiert; was in den Öffnen-Befehl geht, ist immer
   `UpdateNotice.version` und damit ohne `v`. Der Rust-Befehl weist ein führendes `v` ab, damit es
   keine zweite Stelle gibt, die es abschneidet.
3. **Escape und Schließknopf stellen zurück, sie überspringen nicht.** Abschnitt 18 kennt zwei
   Antworten; ein Dialog ohne jeden anderen Ausgang wäre aber weder nach ARIA APG noch nach
   SC 2.1.2 vertretbar. Der Ausgang ist deshalb der vorsichtige: nichts wird gespeichert, der
   Hinweis kommt beim nächsten Start wieder. Nur „Überspringen" schreibt.
4. **Nach „Installieren" schließt der Dialog** und meldet, dass die Seite offen ist. Er
   überspringt die Fassung dabei **nicht** — wer die Seite ansieht und sich anders entscheidet,
   findet den Hinweis beim nächsten Start wieder.
5. **Nachsehen alle 6 Stunden.** A-18.2 verlangt „danach regelmäßig"; die Anfrage ins Netz macht
   der Dienst (höchstens alle 24 h). Der lokale Abruf kostet nichts und kann nach A-V-10/E-069
   keine ausgehende Anfrage auslösen.
6. **Kein Hinweis, solange die Sperrmeldung der Hülle steht** (`serviceExit`). Ein Dialog über
   der Meldung, die zum Neustart führt, wäre die falsche Reihenfolge — und „Überspringen" könnte
   ohne Dienst ohnehin nichts ablegen.
7. **`AppSettings.skippedVersion` ist `ForeignText | null`.** Der Wert stammt aus GitHubs Antwort
   und liegt im Bestand, wo jeder Prozess mit dem Sitzungsgeheimnis ihn ändern kann (T-136-4). Er
   wird nirgends **angezeigt**, nur an die Domäne gereicht.
8. **`proof:shell-surface` liegt in `apps/desktop`** (eigene Hoheit) und ist dort als Skript
   eingetragen. Die Wurzel-`package.json` habe ich nicht angefasst.
9. **Kein Abschalter** (E-068). F-18 bleibt offen.

## Risiken

1. **Die Formprüfung steht allein, und sie steht in `release.rs`.** Wer sie lockert — ein
   `.contains()` statt der Zeichenklasse, ein zusätzlich erlaubtes Zeichen, eine zweite
   Aufrufstelle für `open` —, öffnet eine Weiterleitung in den Browser des Benutzers, und kein
   Verhaltenstest bemerkt es. Dagegen stehen Prüfung 3 des Wächters und die zehn Prüffälle neben
   dem Befehl. Beides ist zu erhalten, nicht zu verschieben.
2. **Die angezeigte Adresse steht zweimal im Baum.** Erlaubt nach A-V-18 und E-065, gemessen von
   Prüfung 4. Fällt der Wächter aus `proof:all` heraus oder wird die Prüfung entfernt, kann der
   Dialog eine Adresse zeigen und eine andere öffnen — der Schaden wäre nicht technisch, sondern
   der Vertrauensbruch genau an der Stelle, an der der Benutzer prüft.
3. **`tauri-plugin-shell::Shell::open` ist seit 2.1.0 abgekündigt** (`tauri-plugin-opener`). Der
   Aufruf trägt `#[allow(deprecated)]`. Ein Wechsel ist eine Entscheidung über die Lieferkette,
   keine Aufräumarbeit — und er ändert nichts an der Lage: Der Prüfbereich des Plugins wird auf
   dem Rust-Weg ohnehin nie betreten.
4. **Die Nachbildung der Hülle in `tests/e2e/support/shell-shim.ts` kennt die zwei neuen Befehle
   nicht.** Das ist heute **richtig und ungefährlich**: `invoke` weist unbekannte Befehle ab,
   `readInstalledVersion` fängt das ab, und es erscheint nichts. Kein bestehender
   End-to-End-Fall ändert sein Verhalten. Für `TP-VER-10` bis `TP-VER-13` muss T-142 die Befehle
   ergänzen und die Aufrufe aufzeichnen.
5. **Der Hinweis erscheint sofort, solange `0.0.0` in `tauri.conf.json` steht** (E-065) — sobald
   der Dienst eine Veröffentlichung meldet. Richtig so, aber es wird beim ersten echten Etikett
   auffallen.

## Offene Fragen

1. **An T-138 / den Orchestrator: Wie heißt die Route und ihr Feld?** Ich habe
   `GET /version-check` → `{ latestVersion }` angenommen. Weicht T-138 ab, bitte
   `api/endpoints.ts:getVersionCheck` und `api/types.ts:VersionCheckView` angleichen; sonst
   bleibt die Fläche still, ohne dass jemand rot wird — genau die Sorte grün, die ich sonst
   melde. Eine Gegenprobe dafür kann erst entstehen, wenn der Name feststeht (Vorschlag:
   `proof:openapi` erfasst die Route ohnehin; ein Abgleich der Oberfläche gegen die Beschreibung
   wäre ein eigener, lohnender Nachweis).
2. **An den Orchestrator:** `proof:shell-surface` in die Wurzel-`package.json` und in
   `proof:all` aufnehmen —
   `"proof:shell-surface": "pnpm --filter @takt/desktop proof:shell-surface"`. Ohne diesen
   Eintrag läuft der Wächter nur, wenn ihn jemand von Hand ruft, und dann ist er keiner.
3. **An den Orchestrator:** `CLAUDE.md` Abschnitt „Versionsprüfung" und E-064 Punkt 2 nennen
   weiterhin drei CSP-Einträge, die Datei trägt vier. Der Wächter misst jetzt die vier; der Satz
   sollte trotzdem stimmen (T-136-2, Weg (a) **und** (b) sind zusammen besser als (b) allein).
4. **An den Auftraggeber (F-18, E-068):** Kein Abschalter gebaut. Bleibt offen.
5. **An unit-tester (T-140):** Die vier Rust-Prüffälle stehen in `release.rs` unter
   `#[cfg(test)]`, weil A-V-16 das ausdrücklich verlangt. Bitte erweitern statt verschieben. Für
   `useUpdateNotice` fehlen Prüffälle auf der Ebene der Oberfläche — besonders „übersprungen
   heißt still", „Fehlschlag heißt still" und „nach Überspringen wird `skippedVersion`
   geschrieben, nicht `localStorage`".

## Nächster Schritt

Welle R: T-140 gegen `release.rs` und `useUpdateNotice.ts`, T-142 erweitert
`tests/e2e/support/shell-shim.ts` um `takt_installed_version` und `takt_open_release` und
zeichnet die Nutzlast des Öffnen-Befehls auf (`TP-VER-13`). Davor: die Route benennen (offene
Frage 1) und `proof:shell-surface` in `proof:all` eintragen (offene Frage 2) — beides sind
Einzeiler und beide gehören vor die Prüfwelle, damit dort nicht gegen einen wandernden Baum
gemessen wird.
