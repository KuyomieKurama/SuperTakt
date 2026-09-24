Aufgabe: T-390 — Oberfläche, unabhängige Reste (Welle 18a)
Status: braucht Review (ein neuer Gleichlauflauf ist absichtlich rot, siehe Risiken)

Artefakte:
- apps/web/src/shared/ui/Select.tsx, apps/web/src/shared/ui/Menu.tsx (O-CH: `stopClosingKeys` gestrichen; Vorgabe „Nichts gewählt“)
- apps/web/src/features/todos/AttachmentOpenDialog.tsx (O-CT-Rest: auf `DialogSurface`, kein handgeschriebenes Escape/Tab mehr)
- apps/web/src/showcase/InventorySection.tsx (O-CH: Eintrag „Dialoggrundlage“ / `DialogSurface.tsx`)
- apps/web/src/api/types.ts (O-CM-Rest: falscher A-7.1-Satz berichtigt)
- apps/web/src/features/todos/attachmentLabel.ts (O-FM: `hasPathStreamSeparator` aus `@takt/domain`)
- apps/web/src/features/structure/PoolRenameDialog.tsx, apps/web/src/lib/submitAttempt.ts, apps/web/src/shared/ui/FormDialog.tsx (O-KH, textbestand 13.7 und 13.8)
- apps/web/src/features/tags/TagAdministration.tsx, apps/web/src/features/settings/StatusFormDialog.tsx, apps/web/src/features/structure/PoolFormDialog.tsx („Name fehlt.“ aus einer Konstante)
- apps/web/src/features/export/ExportScreen.tsx, apps/web/src/features/settings/ExportSettings.tsx (O-KY, Regel G-1)
- apps/web/src/features/timer/useReactivation.ts, apps/web/src/features/todos/undoDone.ts (O-AC)
- apps/web/src/styles/app.css (Ü-2)
- apps/web/src/app/dayGroup.ts, apps/web/src/features/bookings/BookingDialogs.tsx, apps/web/src/features/timer/stopMessage.ts (O-II, O-JT)
- apps/web/src/lib/labels.ts (neue Textbausteine: NAME_MISSING, NOTHING_SELECTED, BUILTIN_TEMPLATE_OPTION, DAY_GROUP_*)
- apps/web/scripts/proof-foreign.mjs (O-BR)
- apps/desktop/scripts/proof-shell-surface.mjs (Nachweis favicon-32)
- apps/desktop/scripts/proof-shell-parity.mjs (neu: O-FL und O-GA)
- apps/web/src/shared/ui/TableShell.tsx (neu), apps/web/src/features/bookings/BookingTable.tsx, BookingsScreen.tsx, apps/web/src/features/todos/TodoListScreen.tsx, apps/web/src/showcase/DataSection.tsx (10.4)
- apps/web/src/app/ShellStatus.tsx (A-28.5)

Zusammenfassung:
Die dreizehn Punkte sind umgesetzt. Der Öffnen-Dialog läuft jetzt über dieselbe Dialog-Zustandsmaschine wie alle anderen Dialoge. Im Umbenennen-Dialog trägt jetzt jeder der beiden Sperrgründe seinen eigenen Kanal. Die Buchungsänderung meldet vier Lagen statt eines immer gleichen Erfolgs. Zwei neue Gleichlaufläufe fahren jeden Fall der Falltafel durch die Domäne und durch den übersetzten Rust-Code der Hülle. Dabei wurde ein echter Befund in der Domäne gefunden.

Einzelheiten je Punkt:
1. O-CH/O-CT: Zag hört auf Escape per `document`-Listener in der Capture-Phase (`@zag-js/dismissable/escape-keydown.mjs`); eine `stopPropagation` in Reacts Bubble-Phase erreicht die Dialoge also nicht. Der letzte React-Vorfahr mit eigener Escape/Tab-Behandlung war `AttachmentOpenDialog`. Er läuft jetzt über `DialogSurface`: Rolle `alertdialog`, `closeOnEscape={!busy}`, Anfangsfokus auf dem Kasten selbst (Eigenschaft 4). Die Rückholung bei gesperrten Knöpfen übernimmt `DialogSurface`. Ebenfalls weg: der eigene `busy`-Effekt, `keepTabInside` und `focusableWithin`. Rolle, Name, Klassen und Texte bleiben zeichengleich (E-076 Punkt 3). Die Sperrfläche in `ShellStatus` bleibt von Hand (E-076 Punkt 2); `lib/focus.ts` hat dort weiter einen Träger.
2. Der Kommentar sagt jetzt, was stimmt: Der Vermerk wird heute nicht durchsucht. Das verbietet aber keine Regel, denn A-7.2 sperrt ihn nur für den Export (E-075 Punkt 2, C-22 offen).
3. `hasStreamSeparator` gestrichen. `ForeignText` bleibt an den Signaturen stehen.
4. O-KH: `FormDialog` reicht `refusalShown` als `SubmitRefusalShownContext` an seine Kinder weiter. Hinweis und Absage hängen damit an einer Bedingung statt an zwei. Das Namensfeld ist ein Kind (`RenameNameField`). Der Hinweis „unverändert“ weicht nur, solange die Absage steht (13.7, AK 1–5). Ein leeres Feld meldet nach dem Absendeversuch oder nach dem Verlassen „Name fehlt.“ im Fehlerkanal; der Hinweis weicht dieser Meldung (13.8). Die Texte des Dialogs stehen gebündelt in `NAME_TEXT`.
5. O-KY: Die Vorgabe heißt jetzt „Nichts gewählt“. `ExportScreen` hat die benannte Option „Mitgelieferte Standardvorlage“. Der Zustand unterscheidet dabei „folgt der Einstellung“ (`null`) von „ausdrücklich die mitgelieferte Vorlage“ (`""`). Ohne diese Trennung fiele die benannte Option bei einer eingestellten eigenen Vorlage auf diese Vorlage zurück.
6. O-AC: Die Meldung nennt den gescheiterten Schritt (anhalten, verwerfen, „Erledigt“ setzen) und den Zustand, der danach gilt. Die Ansicht lädt in jedem Fehlerfall neu. Der Titel bleibt `UNDO_FAILED_TITLE` (jetzt exportiert, derselbe Wortlaut wie in `undoDone.ts`).
7. Ü-2: Der Selektor `:nth-child(even)` ist aufgezählt. Der Kommentar begründet jetzt die Aufzählung.
8. O-II/O-JT: `DayGroupInsight.previewProblemCode` und `OpenPreviewOutcome.code` tragen den Schlüssel des Dienstes. Der Kommentar in `dayGroup.ts` ist berichtigt: Ohne gewählte Vorlage nimmt die Vorschau die gespeicherte oder die mitgelieferte Vorlage, und der Exportordner spielt keine Rolle. Die Buchungsänderung schließt zuerst den Dialog und fragt danach mit dem neuen Anfang (12.8 AK 1 und 6). Geprüft wird `previewProblem` vor `blockedReason`. Die Lagen L1 bis L4 folgen 12.3. Die Lagebausteine stehen einmal in `labels.ts` und werden von `stopMessage.ts` und `BookingDialogs.tsx` gemeinsam gelesen (AK 7/7a). Der Wortlaut des Stopps ist zeichengleich geblieben.
9. O-BR: `proof-foreign` erkennt jetzt auch `==`/`!=` und `<T>x`, sowohl in Abschnitt 6 (aus `unknown`) als auch in Abschnitt 7 (aus fremdem Wert). Abschnitt 6 ist dafür eine Funktion über ein beliebiges Programm geworden (`scanRawFromUnknown`). Drei neue Gegenproben sind dazugekommen, insgesamt sind es jetzt sechs.
10. `proof-shell-surface` prüft jetzt `favicon-32.png` Byte für Byte gegen `src-tauri/icons/32x32.png`. Eine Gegenprobe mit einem geänderten Byte ist dabei.
11. `proof-shell-parity.mjs` schneidet `check_file` samt Helfern und `is_release_version` samt Schranken aus `attachment.rs` bzw. `release.rs` heraus. Der Lauf übersetzt sie mit `rustc` zu einem Prüfrahmen und fährt jede Zeichenkette der eigenen Falltafel durch beide Seiten (E-086 Punkt 1). Die Schranke 94 wird mitgemessen (E-086 Punkt 4). Ohne `rustc` verweigert der Lauf das Urteil und endet rot (E-121 Punkt 10). Es gibt vier Gegenproben: für jede Regel eine Abweichung auf der Domänenseite und eine im Rust-Quelltext.
12. `TableShell` liegt jetzt in `shared/ui/TableShell.tsx`. Drei Bereiche lesen ihn: bookings, todos und showcase.
13. A-28.5: Anstelle des Satzes über die Systembetreuung stehen jetzt drei Schritte: Datensicherung anlegen, Ordner von der Synchronisierung ausnehmen oder LOCALAPPDATA bzw. XDG_DATA_HOME umstellen, neu starten und bei Bedarf die Sicherung einspielen. Die Angaben sind an `appdata.rs::resolve` geprüft. Die Beschriftung „Für die Systembetreuung“ mit dem technischen Zusatz bleibt stehen.

Prüfung:
- `pnpm --filter @takt/web typecheck`, `pnpm --filter @takt/desktop typecheck`, `tsc -p apps/web/tsconfig.test.json`: fehlerfrei.
- `pnpm typecheck` (Wurzel): rot, aber nur in `apps/local-api/test/routes/addin/service.test.ts` (`bookOnTodo` fehlt). Das kommt aus dem parallelen T-389, nicht aus diesem Auftrag.
- `vitest run apps/web`: 19 Dateien, 243 Fälle grün.
- `pnpm run contrast`: 0 von 522 Paaren durchgefallen, 11/11 Gegenproben.
- `proof:foreign`: 24 bestanden, darunter 6 Gegenproben. Blindprobe: Mit der alten Erkennung werden die drei neuen Gegenproben rot („FEHL“), sie beißen also.
- `proof:shell-surface`: 8 Prüfungen, 55 Gegenproben bestanden.
- `proof:clamp`, `proof:surface`, `proof:locked`: grün. `boundaries`: grün. `pnpm --filter @takt/web build`: grün.
- `proof:callers`: 3 rot, alle aus den parallelen Aufträgen: `stopTimer.endedAt` und `resolveOrphanedTimer.endedAt` aus T-388, `POST /addin/todos/{}/time-entries` aus dem laufenden Rückbau T-389.
- `node apps/desktop/scripts/proof-shell-parity.mjs`: Fassung 32/32 gleich, Schranke gleich, 4/4 Gegenproben beißen. Anhänge: 1 Fehler (siehe Risiken) und 2 Hinweise.
- E-087-Suche (git grep und Arbeitsbaum): „Bitte wählen“ in keinem Prüffall. „Mitgelieferte Standardvorlage“ nur im Produkt. Der Satz über die Systembetreuung steht in keinem Prüffall; `shell-username-lock.spec.ts:135` prüft nur das Wort „Systembetreuung“ im Benutzernamen-Dialog, und der bleibt unberührt. „Das Zurücknehmen hat nicht geklappt“ ist in `undoDone.test.ts` zugesichert und bleibt zeichengleich.
- Nicht geprüft: visual-qa, e2e und Rust-Tests. Einen Agenten kann ich aus dieser Rolle nicht starten, und eine Browsersitzung gab es nicht. Für visual-qa sind folgende Bilder offen: Öffnen-Dialog (Musterseite Abschnitt Frist/Anhänge, alle drei Zustände), Pool-Umbenennen („unverändert“ und leer, jeweils vor und nach dem Druck), Exportansicht mit der Auswahl der Vorlage (frisch und mit eigener Vorlage), laufender Timer auf einer Zeile mit gerader Ordnungszahl in der Todo-Liste, Sync-Hinweis in der Musterseite (ShellStateSection), jeweils in hell und dunkel. Das Layout ist nicht verändert; responsiv ist nur der längere Satz im Sync-Hinweis betroffen, und der steht in `.shellnote__body` mit `max-width: var(--measure-prose)`.

Annahmen:
- E-085 Punkt 2 ist in sich widersprüchlich (siehe Offene Fragen). Gebaut ist die Lesart der Erläuterung, die auch zum Anlaß T-179 paßt: Nimmt die Domäne an und weist die Hülle ab, ist das ein Fehler; der umgekehrte Fall und abweichende Schlüssel sind Hinweise.
- Pfadfälle hängen am Wirt: Die Hülle urteilt mit dem `std::path` des Wirts. Posix-Formen werden nur auf Posix verglichen, Laufwerksformen nur unter Windows; die Zahl der übersprungenen Fälle steht in der Ausgabe.
- `path_missing` der Hülle gilt als „Form angenommen“, weil die Domäne diese Frage nicht stellen kann.
- Der Parity-Lauf importiert `packages/domain/src/index.ts` über einen relativen Pfad (Node 22 streift die Typen ab), weil `apps/desktop/package.json` keine Abhängigkeit auf `@takt/domain` führt. E-075 Punkt 3 erlaubt die Kante.
- „Name fehlt.“ steht an drei weiteren Stellen, die ich nur auf die gemeinsame Konstante umgestellt habe. Am Wortlaut hat sich nichts geändert.
- `bookingChangedMessage` ist exportiert, damit T-401 es ohne React prüfen kann (wie `stopMessage`).

Risiken:
- **Echter Befund aus dem neuen Lauf, blockierend für das Einhängen:** `checkAttachmentPath("\\temp\\datei.pdf")` liefert `ok`, `check_file` dagegen `path_not_absolute`, und zwar auf jedem Wirt. Unter Windows ist ein Pfad mit Wurzel, aber ohne Laufwerk, nach `std::path` nicht absolut. Die Tür nimmt also einen Pfad an, den die Hülle nie öffnet; das ist die Klasse aus T-179. Ursache ist `isAbsoluteAttachmentPath` in `packages/domain/src/attachment.ts`, das `value.startsWith('\\')` gelten läßt. Das gehört domain-dev.
- Hinweis aus demselben Lauf: Die Domäne weist Richtungszeichen (U+202E) ab, die Hülle nicht (`char::is_control` kennt nur Cc). Das ist in der Richtung unkritisch, weil die Hülle danach ohnehin die Rückfrage mit `visibleText` stellt; es steht aber als Unterschied da.
- Der Parity-Lauf braucht `rustc` auf dem Läufer. In `pruefung.yml` steht Rust für `test:rust` ohnehin bereit.
- Sicherheit: Der Prüfrahmen übersetzt nur Quelltext aus dem eigenen Bestand in ein temporäres Verzeichnis und löscht es danach wieder. Es entsteht keine Netzverbindung und kein neuer Laufzeitcode. Die Öffnen-Rückfrage behält ihre Eigenschaften 1–6: Anfangsfokus auf dem Kasten, keine Vorauswahl, Escape gesperrt, solange der Befehl läuft.

Offene Fragen:
1. **Widerspruch in E-085 Punkt 2:** Die Überschrift sagt „die Hülle darf strenger sein, die Domäne nie“. Die Erläuterung darunter wertet dagegen „Tür nimmt an, Hülle weist ab“ als den Fall, der den Benutzer etwas kostet. Das ist gerade die strengere Hülle. Welche Richtung ist der Fehler? Gebaut ist die Lesart der Erläuterung.
2. **Wunsch Einhängen:** In der Wurzel-`package.json` `"proof:shell-parity": "pnpm --filter @takt/desktop proof:shell-parity"`, in `apps/desktop/package.json` `"proof:shell-parity": "node scripts/proof-shell-parity.mjs"`, dazu der Eintrag in `proof:all`. Erst einhängen, wenn domain-dev den Befund zu `\temp\…` behoben hat, sonst wird `proof:all` rot. E-085 nennt den Lauf `proof:attachment-parity`; ich habe beide Gleichläufe in einen Lauf gelegt, weil sie denselben Prüfrahmen brauchen. Soll ein Name als Alias dazu?
3. **Regelwiderspruch in CLAUDE.md:** Der Abschnitt „Sprache“ verlangt dort weiterhin englische Oberflächentexte. E-118 hat das ersetzt (Oberfläche bleibt deutsch). Gebaut ist nach E-118. CLAUDE.md nennt außerdem „neunzehn Dateien“ in `shared/ui/`; mit `TableShell.tsx` sind es jetzt zwanzig.
4. `docs/design/todo-tabelle-fluss.md:673` verweist auf `Menu.tsx:76 (stopClosingKeys)`, das es nicht mehr gibt. Die Datei gehört ux-designer.
5. Derselbe wirkungslose Stopper steht noch in `features/timer/IdleTaskSelect.tsx` (Kombobox) und in `features/tags/TagInput.tsx:237`. Beides war nicht im Auftrag, gehört aber zur selben Klasse. Soll er mitfallen?

Nächster Schritt:
- domain-dev: `isAbsoluteAttachmentPath` weist `\x` ohne Laufwerk ab. Danach `proof-shell-parity` einhängen (Orchestrator).
- visual-qa: die oben genannten Flächen am Bild prüfen.
- e2e-tester (T-402): O-KH in beide Richtungen, 13.7 AK 5 und 13.8 AK 6 (Meldung, Fokus im Feld, kein `PATCH`). Dazu die vier Lagen der Buchungsänderung und die Tastaturbedienung des Öffnen-Dialogs (Shift+Tab beim ersten Druck, Escape während `busy`).
- unit-tester (T-401): `bookingChangedMessage` (L1–L4, Reihenfolge `previewProblem` vor `blockedReason`) und die Schrittmeldung in `useReactivation`.
