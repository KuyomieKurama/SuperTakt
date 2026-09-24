Aufgabe: T-400a — Grundlage der Sprachumschaltung (A-28.2) und Hüllen-Reste (zweite Runde 2026-09-25: Prüfung des heutigen Stands gegen den Auftrag und T-391b)
Status: braucht Review

Zweite Runde (2026-09-25)
Artefakte:
- `apps/web/src/features/settings/startupAppearance.ts`: `cacheAppearance` schreibt zusätzlich `language`, neue Funktion `startupLanguage()`
- `apps/web/src/main.tsx`: `setLanguage(startupLanguage())` vor dem ersten Zeichnen
- `apps/web/src/features/settings/texts.ts`: `displayLead` de/en nach welle-18-fluss.md 2.1 und §13
- `apps/desktop/scripts/build-taskpane.mjs`: `verifyStage` bricht ab, wenn eine `.map` im bereitgestellten Aufgabenbereich liegt
- dieser Bericht

Zusammenfassung: Die erste Runde, T-400 und die Codex-Arbeit liegen gemeinsam unversioniert im Arbeitsbaum. Ich habe jeden Auftragspunkt am heutigen Stand geprüft, statt neu zu bauen. Zwei Lücken habe ich geschlossen. Die Startbildschirme sprechen jetzt die zuletzt gewählte Sprache (welle-18-fluss.md 2.2 Punkt 7), und die Kartenbeschreibung „Darstellung“ trägt den freigegebenen Satz. Dazu kommt eine Zusicherung im Bau: Keine Quellkarte gelangt in den Aufgabenbereich (A-28.11).

Stand je Auftragspunkt (am Code gelesen, Messungen unter „Prüfung“):
1. Textbündel: `{ de, en }` mit `const en: typeof de` in `lib/labels.ts`, `app/texts.ts` und acht `features/*/texts.ts`. Ein Suchlauf über `apps/web/src` ohne `showcase/` findet deutschen Text außerhalb der Bündel nur noch in Kommentaren, im Markennamen, in Dateinamen (`takt.db`), im erzeugten Gestaltungskatalog und in zwei Sätzen in `serviceStartup.ts`. Den Katalog übersetzt `themeText()` für alle 19 Gestaltungen. Die beiden Sätze erscheinen vor dem Laden der Einstellungen und tragen `lang="de"` über `ServiceText`.
2. Intl: `lib/format.ts` baut jeden Formatierer mit `currentLocale()` (`de-DE`/`en-GB`). Gemessen mit Node: `05.09.2026` und `05/09/2026`, Uhrzeit `07:04` in beiden, Zahl `1,25` und `1.25`. Der Kalender (`DateField`) nimmt `currentLocale()` und `startOfWeek={1}`.
3. `html lang`: `setLanguage` setzt `document.documentElement.lang` im selben Schritt. `index.html` startet mit `lang="de"`, und neu setzt `main.tsx` die zwischengespeicherte Sprache vor dem ersten Zeichnen.
4. Hülle:
   - `attachment.rs` `is_forbidden_path_character` in `check_file`. Die Menge ist gleich `FORBIDDEN_NAME_CHARACTERS` der Domäne: `char::is_control` deckt C0, DEL und C1 ab, dazu U+061C, U+200E–200F, U+202A–202E und U+2066–2069.
   - `.map`: Kopierfilter in `build-taskpane.mjs`, neu mit Abbruch in `verifyStage`.
   - Escape: Die Stopper in `IdleTaskSelect.tsx` und `TagInput.tsx` sind entfernt. Alle `DialogSurface`-, `ConfirmDialog`- und `FormDialog`-Nutzer führen das Schließen auf `onCancel`, `onPostpone` oder ein neutrales Schließen.
5. Einstellung: `uiLanguage` in `PreferencesContext` (optimistisch, Rückfall bei Fehlschlag mit Meldung in der vorigen Sprache), `RadioRow` „Deutsch“/„English“ mit eigenem `lang` als erstes Bedienelement unter Darstellung, Hinweis nach 2.1.

Prüfung:
- `pnpm typecheck` (alle Pakete plus Test- und e2e-Konfigurationen): grün.
- `npx vitest run apps/web`: 20 Dateien, 247 von 247 grün.
- `boundaries`, `proof:surface`, `proof:foreign` (24/0), `proof:callers` (76/0), `proof:locked` (9/0), `proof:shell-parity`, `proof:shell-surface`, `contrast` (0 von 522 Paaren): alle Code 0. `proof:surface` meldet dabei „Absagewege: 89 …, keiner erreicht einen Zustimmungsrückruf“. Das ist die Messung zu „Escape wirkt nicht als Zustimmung“.
- `pnpm test:rust`: 77 grün, 1 übersprungen, darunter `attachment::tests::check_file_rejects_bidi_and_format_control_characters`.
- `.map`: `stageTaskpane({ build: false })` in ein Probeverzeichnis mit Code 0 (9 Dateien, keine `.map`). Gegenprobe mit einer Kopie des Skripts ohne Filter: Code 1 mit beiden Quellkarten namentlich. Probedateien gelöscht. Das Bündel des Add-ins (`apps/outlook-addin/dist/assets/`) enthält zwei `.map` (`sourcemap: 'hidden'`). Der Filter ist also nötig und wirkt.
- E-087-Suche nach dem alten Kartensatz („wirken sofort und bleiben“, „apply at once and are kept“): `git grep` über `tests`, `apps/*/test`, `packages/*/test` und `src`, dazu ein Lauf über den Arbeitsbaum. 0 Treffer außerhalb von `texts.ts`.
- Nicht geprüft:
  - Die Startbildschirme in Englisch im laufenden Programm. Dafür hätte der Dienst starten und dann ausbleiben müssen. `startupLanguage` und der Aufruf in `main.tsx` sind nur gelesen, nicht laufen gesehen.
  - Die gerenderte Oberfläche in beiden Sprachen, 19 Gestaltungen und zwei Modi. Das gehört an visual-qa (T-403).
  - `pnpm check` gesamt und e2e.

Annahmen:
- Der Auftrag nennt `app_setting.locale`. Gebaut ist `app_setting.ui_language` (Migration 0029 von domain-dev). Die Migration hält fest, dass die ältere Spalte `locale` nie gelesen wurde (E-123). Ich habe nichts umgebaut, weil der Speicher nicht in meiner Hoheit liegt und der Wert bereits die Anforderung trägt.
- Der Auftrag stellt A-28.4 zu den Richtungszeichen in `attachment.rs`. A-28.4 betrifft aber `WindowsUser` ohne Domäne. Das ist erfüllt: Die Hülle nutzt `GetUserNameW`, und der Dienst streicht zusätzlich eine Domäne (`userNameWithoutDomain`, `session-secret.ts:231`). Das ist gelesen, nicht gemessen.
- Die Sprache steht im selben Browsercache wie das Erscheinungsbild (`supertakt.appearance.v1`, Feld `language`, Fassung bleibt 1). Das Papier (2.2 Punkt 7) verlangt genau diesen Cache. Das erzeugte Frühskript `public/startup-appearance.js` prüft nur die ihm bekannten Felder und übergeht das neue. Das ist gelesen, nicht gemessen. Sein Kopfsatz „This cache contains appearance only“ stimmt nur noch, wenn man die Sprache zur Darstellung zählt. Er stammt aus `scripts/sync-themes.mjs` und liegt außerhalb meiner Hoheit.
- Der englische Wortlaut der Kartenbeschreibung ist zeichengenau aus dem Textkatalog §13 übernommen.

Risiken:
- Keine neuen Sicherheitsrisiken. Der Cache trägt nur `de` oder `en`. Jeder andere Wert fällt auf Deutsch zurück, ebenso ein fehlender, unlesbarer oder gesperrter Speicher.
- `tests/e2e/startup-appearance.spec.ts` schreibt denselben Schlüssel ohne `language`. Das ergibt Deutsch, das Verhalten dort bleibt also gleich.

Offene Fragen:
1. welle-18-fluss.md 2.3 nennt als Tagesbeschriftung „Di, 23.09.“ und „Tue 23 Sep“. Gebaut ist in beiden Sprachen die volle Form mit Jahr: „Mi., 23.09.2026“ und „Wed, 23/09/2026“. Das Beispiel im Papier hat außerdem den falschen Wochentag, denn der 23.09.2026 ist ein Mittwoch. Ich habe nichts geändert, weil die deutsche Form Bestand ist und nur das Englische zu kürzen beide Sprachen ungleich machen würde. Frage an ux-designer: Ist die kurze Form ohne Jahr gewollt, dann für beide Sprachen?
2. welle-18-fluss.md 2.4 verlangt beim Speichern `aria-disabled` an der Sprachzeile. 2.2 Punkt 2 verlangt, dass der Fokus auf der gewählten Option bleibt. `RadioRow` kennt nur `disabled`, und das nähme den Fokus. T-400 hat deshalb einen Riegel gegen gleichzeitige Speicherungen gebaut. Soll `RadioRow` einen eigenen `aria-disabled`-Zustand bekommen, oder gilt 2.4 hier als erfüllt?
3. Offen aus der ersten Runde: Frage 2 ist durch T-400 (C-22) erledigt, Frage 3 durch T-400 (`proof:surface` und `proof:callers` lesen nur Deutsch bzw. Code). Frage 1 hat T-391b erledigt, und `proof:locked` ist grün.

Nächster Schritt:
- unit-tester (T-401b): Fälle für `startupLanguage` (en, fehlend, unlesbar, fremder Wert) und dafür, dass `cacheAppearance` `language` schreibt.
- visual-qa (T-403): Start mit englischem Cache und ausbleibendem Dienst, Startbildschirm und `html lang`.
- ux-designer: Offene Fragen 1 und 2.

Erste Runde (2026-09-24, unverändert)
Artefakte:
- neu: `apps/web/src/lib/language.ts`, `apps/web/src/shared/ui/ServiceText.tsx`,
  `apps/web/src/app/texts.ts`, `apps/web/src/features/{board,bookings,export,settings,structure,tags,timer,todos}/texts.ts`
- umgebaut: `apps/web/src/lib/{labels,format,foreign,errorText,poolRule,movement}.ts`,
  `apps/web/src/api/client.ts`, `apps/web/src/app/*` (App, Navigation, GlobalSearch, DashboardScreen,
  ShellStatus, connection, dayGroup, StructureContext, RefreshContext, ToastContext, useAsync),
  alle Bausteine in `apps/web/src/shared/ui/` mit Text, alle Dateien mit Oberflächentext in den acht
  Merkmalen, die Musterseite unter `showcase/` (nur Importe), `apps/web/src/main.tsx` (Entwicklerfehler englisch),
  `apps/web/src/styles/components.css` (`.dialog__footer` bricht um)
- Hülle: `apps/desktop/src-tauri/src/attachment.rs`, `apps/desktop/src-tauri/src/lib.rs` (Kommentar),
  `apps/desktop/scripts/build-taskpane.mjs`, `apps/desktop/scripts/proof-shell-parity.mjs` (ein Eintrag)

Zusammenfassung:
Alle Oberflächentexte der Hauptanwendung stehen jetzt in Textbündeln `de`/`en` gleicher Gestalt
(`const en: typeof de`, der Typprüfer erzwingt Vollständigkeit). Gewählt wird über `useLanguage()` in
`lib/language.ts` (Vorgabe `de`, nur im Arbeitsspeicher, setzt `html lang`, Formate über `Intl`
`de-DE`/`en-GB`). Meldungen des Dienstes und der Hülle bleiben deutsch und tragen `lang="de"`
(`ServiceText`, `errorFromService`, `bodyFromService`). Die drei Domänensätze aus E-121 Punkt 9 kommen über eigene
Schlüssel. Den Pool-Bewegungssatz setzt die Oberfläche nach E-124 F-1 aus Schlüsseln zusammen; der deutsche
Wortlaut ist zeichengleich mit `poolMovementSentence`. In der Hülle: `attachment.rs` weist
Richtungszeichen im Dateipfad ab, `build-taskpane.mjs` kopiert keine `.map`, und die zwei
wirkungslosen Escape-Stopper sind weg.

Einzelheiten:
1. Sprachquelle: `getLanguage`/`setLanguage`/`useLanguage` (useSyncExternalStore), `pickTexts({de,en})`,
   `currentLocale()`. `App` abonniert die Sprache an der Wurzel (der ganze Baum zeichnet neu); `Workspace`
   stößt bei einem Wechsel `RefreshContext.bump()` an, damit schon geladene und dabei formatierte Daten
   (Protokollzeilen, Datumsangaben) neu geholt werden. Kein Browserspeicher. T-400 hängt die Quelle an die
   Einstellung des Dienstes. Die Auswahl steht vorläufig als RadioRow „Deutsch“/„English“ (je mit eigenem `lang`)
   ganz oben unter Einstellungen → Darstellung.
2. Formate: `lib/format.ts` baut die Formatierer je Aufruf mit `currentLocale()`: 24-Stunden-Uhr
   (`hourCycle: "h23"`), „ Uhr“ nur im Deutschen, gesprochene Dauer je Sprache, neu `formatList` über
   `Intl.ListFormat` (statt `enumerateGerman` in der Oberfläche). `quotedName`: im Deutschen `„…“` aus der Domäne,
   im Englischen `“…”`.
3. `formatQuarters`: alle Aufrufstellen sind **Anzeige**, keine ist Dateiinhalt. Die Exportdatei baut der Dienst
   (`packages/export`); die Oberfläche schreibt keine Datei.
   - `app/DashboardScreen.tsx:209`: Kachel „Noch nicht exportiert“
   - `features/export/PreviewGroupRow.tsx:91`: Stunden der Tagesgruppe in der Vorschau
   - `features/export/RunResult.tsx:52`: Ergebnis eines Laufs
   - `features/timer/TimeScreen.tsx:345`: „ergibt beim Export“
   - `features/timer/stopMessage.ts:88`: Rückmeldung nach dem Stopp
   - `features/export/ExportRunList.tsx:60`: Protokollliste
   - `features/todos/TodoDetailAside.tsx:105`: Summe am Todo
   - `features/bookings/BookingDialogs.tsx:331`: Kontext beim Zurücksetzen
   - `features/export/ExportScreen.tsx:558, 777, 905, 1015`: Erfolgsmeldung, Summenleiste, Einblick, Bestätigungsdialog

   `ExportRowPanes` zeigt die Dateiwerte wörtlich (`String(value)`) und ist von der Sprache unberührt.
4. E-121 Punkt 9: Frist (`isCalendarDay`), Call-Nummer (`checkCallNumber`, Abweisungscode → Schlüssel
   `callNumberRejection`) und Anhangsbezeichnung (leerer Titel → Wort für die Art) prüft bzw. benennt
   `TodoFormDialog`/`attachmentLabel` selbst über Schlüssel. Der Fristfehler steht in einer dauerhaft vorhandenen
   `role="alert"`-Fläche.
5. O-GF: `deadlineHintCore` ist genau ein Literal in genau einer Datei (`features/todos/texts.ts`) und
   zeichengleich mit dem Aufgabenbereich. `deadlineHintDefaultTime: "Ohne eigene Uhrzeit gilt 00:00."` steht nur
   in der Hauptanwendung und ersetzt den alten Hinweis in `TodoFormDialog`.
6. Hülle:
   - `attachment.rs`: `is_forbidden_path_character` (Steuerzeichen, U+061C, U+200E–U+200F, U+202A–U+202E,
     U+2066–U+2069) in `check_file`. Verweise bleiben bei `LinkNotNormalized`, weil ein bestehender Prüffall genau
     das für U+202E erwartet.
   - A-28.4 ist schon erfüllt: `GetUserNameW` liefert den Namen ohne Domäne, der Dienst streicht eine Domäne
     zusätzlich (`userNameWithoutDomain`). Nur der Kommentar in `lib.rs` wurde nachgezogen.
   - `build-taskpane.mjs` kopiert mit einem Filter ohne `.map`.
   - Die Escape-Stopper in `IdleTaskSelect.tsx` und `TagInput.tsx` sind entfernt.

Prüfung:
- `pnpm --filter @takt/web typecheck`: grün. `pnpm --filter @takt/desktop typecheck`: grün.
  `tsc -p apps/web/tsconfig.test.json`, `apps/desktop/tsconfig.test.json` und `tests/e2e/tsconfig.json`: grün.
- `vitest run apps/web`: 240 grün, **3 rot**. Alle drei sind Quelltextwächter, die ein Literal an der
  alten Stelle suchen:
  - `test/shared/ui/dismissLabel.test.ts:106` sucht `label="Meldung schließen"` in `ToastContext.tsx`.
    Der Text steht jetzt unter `labels().dismissMessage`.
  - `test/features/export/templatesScreenBeginCopy.test.ts` hat zwei Fälle, die `Kopie von ${dropHiddenCharacters`
    in `TemplatesScreen.tsx` suchen. Der Text steht jetzt als `exportTexts().copyOf`.

  Die Dateien gehören dem unit-tester und sind nicht angefasst (T-401b).
- `vitest run test/lib/movement.test.ts test/features/todos/undoDone.test.ts`: 23 grün. Der deutsche
  Bewegungssatz aus Schlüsseln ist zeichengleich mit `poolMovementSentence`.
- `pnpm run contrast`: 0 von 522 Paaren durchgefallen.
- `proof:surface`: 54/0. Zwischendurch rot, weil der deutsche Imperativwächter das englische Wort „lies“
  als „Lies!“ las. Die englischen Sätze sind umformuliert.
- `proof:foreign`: 24/0.
- `proof:callers`: grün, nachdem die englischen Sätze mit dem Wort „request“ umformuliert waren. Der Wächter
  sucht den Bezeichner `request` als Wort.
- `proof:shell-surface` und `proof:shell-parity`: grün.
- `proof:locked`: 7/2. Die Grundlinie vor der Arbeit war 6/3. Übrig bleiben SP-04 und SP-21 (siehe Offene
  Fragen); die Gegenprobe zu SP-01 ist jetzt grün.
- `proof:addin` (ohne Portbindung, `app.request`): 279/1. **O-GF/GF-03 grün.** Rot ist A-19.2 „Deadline“ in
  `apps/outlook-addin/src/ui/{TaskPane.tsx,texts.ts}`. Das ist fremde Hoheit und nicht aus diesem Auftrag.
- `boundaries`, `proof:clamp`, `proof:layers`, `proof:export`, `proof:conflicts`, `proof:template-fields`,
  `proof:tags`, `proof:addin-wiring`: grün.
- `proof:codepoints` ist rot, mit Fundstellen nur in fremden Berichten und in
  `apps/local-api/test/…name-directory.test.ts`, nicht aus diesem Auftrag.
- `cargo test --lib`: 76 grün, 1 übersprungen, darunter 31 in `attachment`. Kein Dienst gestartet.
- Längen: Die kurzen Beschriftungen (bis 24 Zeichen) aller Bündel wurden maschinell gegen R-L1 (+30 % bzw. +4)
  gemessen. Übrig bleiben 10 Überschreitungen:
  - vom Glossar aus `welle-18.md` 2.4 so vorgegeben: „Vermerk“ → „Internal note“, „Ohne Leistung“ →
    „No work done“
  - Feldfehler, die umbrechen dürfen: „Name is missing.“, „Start is missing.“, „End is missing.“,
    „Name of the copy is missing.“
  - der Fließtext „If that does not help:“

  Am Board-Kopf fiel nichts auf.
- **Nicht geprüft:**
  - Die gerenderte Oberfläche bei 960×640 in allen neunzehn Gestaltungen und beiden Farbmodi. Dafür
    müsste die Anwendung laufen, und der Dienst auf 17843 war ausgeschlossen. Das gehört an visual-qa (T-403).
  - `pnpm check` gesamt.
  - `proof:access` bindet einen Port und blieb deshalb aus.

Annahmen:
- Das englische Glossar folgt `welle-18.md` 2.4: Frist → „Due date“ (A-19.2 im Englischen sinngemäß,
  nie „Deadline“), Leistung → „Work done“, Vermerk → „Internal note“.
- Die Meldungen aus `serviceStartup.ts` bleiben deutsch („30 Sekunden“, „Startbereitschaft …“). `test/service-startup.test.ts`
  hält sie wörtlich fest, und sie werden im Fehlerbild als `lang="de"` angezeigt, wie Dienst- und Hüllentexte.
  `ConnectionState.failed.message` ist `null`, wenn der Text von der Oberfläche kommen soll.
- Deutsch aus der Hülle (Startprobleme, Synchronisierungswarnung, Dienstende, Beendigungsgrund) trägt
  `lang="de"`.
- Die Gestaltungsnamen kommen im Deutschen aus dem erzeugten Katalog, im Englischen aus einer Tabelle in
  `features/settings/texts.ts` (`themeText`).
- Umbenennungen: `EXPORT_STATUS_LABEL` entfällt. Aus `ALL_EXCLUDED`, `AUDIT_EVENT_DESCRIPTION`,
  `UNDO_FAILED_TITLE`, `ATTACHMENT_KIND_LABEL`/`VALUE_LABEL`, `DEADLINE_FILTER_LABEL`, `TODO_SORT_LABEL` und
  `COLUMNS` in `BookingTable` sind Funktionen geworden, weil ein Modulwert die Sprache beim Laden einfröre.

Risiken:
- Gemischte Sätze bleiben in der englischen Oberfläche teilweise deutsch, dann ohne `lang`-Kennzeichen für das
  Teilstück. Das betrifft UI-Sätze, die eine Dienstmeldung einbetten (`previewProblem` in `TimeScreen` und
  `TodoDetailAside`, `refusal`/`consequence` im `ConfirmDialog`) und Fehlertexte der Hülle in `OutlookSetup`.
  Das ist ein Mangel für SC 3.1.2, keiner für die Sicherheit.
- Die Wächter `proof:surface` (Anrede) und `proof:callers` (`request`) lesen englische Literale mit deutschen bzw.
  Bezeichnerregeln. Jede künftige englische Formulierung mit „lies“, „tu“ oder „request“ macht sie rot.
- `proof:foreign` ist grün. Die englischen Anführungszeichen stammen aus `quotedName`, das `visibleText` anwendet.
  Fremde Namen erreichen die Bündel nur über diese Behandlung.

Offene Fragen:
1. SP-04 (ux-designer, `textbestand.md`): GF-03 verlangt den Kern als eigenes Literal, SP-04 misst den ganzen
   Satz aus Kern und „Ohne eigene Uhrzeit gilt 00:00.“ am Stück. Beides zugleich geht nicht. Vorschlag: Das Papier
   teilt SP-04 in zwei Satzteile (Kern | Zusatz), wie es SP-21 schon tut.
2. SP-21: Der neue Wortlaut („… Call-Nummern, Vermerken und Leistungstexten.“) setzt C-22 in der Oberfläche
   voraus. Das ist hier nicht gebaut; gehört es zu T-400?
3. Sollen `proof:surface` (Abschnitt D) und `proof:callers` nur das `de`-Bündel bzw. nur Code lesen? Heute
   schreiben sie das Englisch mit.
4. `proof:addin` A-19.2 „Deadline“ im Aufgabenbereich: an integration-dev.

Nächster Schritt:
- unit-tester (T-401b) zieht die drei Quelltextwächter nach und prüft Sprachwechsel, `html lang`,
  `formatList`/`quotedName` en und `is_forbidden_path_character`.
- visual-qa (T-403) misst 960×640 in beiden Sprachen, allen Gestaltungen und beiden Modi, vor allem Board-Kopf,
  Dialogfüße und Tabellenköpfe.
- T-400 verbindet `useLanguage` mit der Einstellung des Dienstes und setzt die Kartenbeschreibung „Darstellung“.
