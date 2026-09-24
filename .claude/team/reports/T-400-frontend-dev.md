Aufgabe: T-400 (echter Neustart) — Oberfläche Welle 18, inkl. Nachtrag verify-sidecar
Status: braucht Review (ein Nachweislauf rot aus fremder Hoheit: proof:locked, siehe Offene Fragen 1)

Artefakte:
- apps/web/src/api/types.ts — AppSettings/AppSettingsUpdate `versionCheckEnabled`, `uiLanguage`; SettingsView `databaseFilesTooPermissive`; Pool/PoolWrite `requiredTags` (statt `rule`); TimeEntry `todoNoExport`; TimeEntryFilter `tagIds`/`poolIds`/`hasNote`; `TodoSearchHit` mit `origins`
- apps/web/src/lib/language.ts (Kommentar), lib/bookingEnd.ts (neu), lib/focus.ts (`useReorderFocus`), lib/labels.ts (`bookingEndProblem`), lib/poolRule.ts (`describeStoredRuleReach`)
- apps/web/src/app/App.tsx, connection.ts, serviceStartup.ts (`ServiceNotReadyError`), GlobalSearch.tsx, StructureContext.tsx, ToastContext.tsx (`replaceKey`), texts.ts
- apps/web/src/features/settings/: SettingsScreen.tsx, PreferencesContext.tsx, useVersionFacts.ts, useUpdateNotice.ts, WorkstationFacts.tsx, PrioritySettings.tsx, DataTransferSettings.tsx, OutlookSetup.tsx, api.ts, texts.ts
- apps/web/src/features/board/: BoardSetupDialog.tsx, BoardColumn.tsx, BoardScreen.tsx, Kanban.tsx, texts.ts
- apps/web/src/features/tags/: PoolAdministration.tsx, texts.ts
- apps/web/src/features/structure/: api.ts (`swapPoolOrder`), PoolFormDialog.tsx
- apps/web/src/features/timer/: TimerContext.tsx, TimeScreen.tsx, api.ts, texts.ts
- apps/web/src/features/bookings/: BookingDialogs.tsx, BookingsScreen.tsx, api.ts, texts.ts
- apps/web/src/features/export/: ExportScreen.tsx, texts.ts
- apps/web/src/features/todos/: TodoDetailScreen.tsx, TodoDetailAside.tsx, AttachmentOpenDialog.tsx, Attachments.tsx, attachmentChronology.ts, texts.ts
- apps/web/src/styles/components.css (drei Töne `.dialog__consequence`, `.dialog__icon--statement`), styles/app.css (Suchgruppen)
- apps/web/scripts/proof-surface.mjs (englische Bündel ausgenommen + Gegenprobe)
- apps/local-api/scripts/request-scan.mjs, apps/local-api/scripts/proof-callers.mjs (fremde Hoheit, im Auftrag benannt — siehe Offene Fragen 2)
- apps/desktop/scripts/verify-sidecar.mjs (Nachtrag: `/commands.html` muss 404 liefern)

Zusammenfassung:
Alle 16 benannten Punkte gebaut: Schalter Versionsprüfung (Abfrage pausiert, Hinweis verschwindet sofort), Sprache aus dem Bestand, Pool-Reihenfolge über `PUT /pools/order` am Board **und** in der Regelliste (A-28.3), Ende-Frage beim Stopp und beim Wechsel nach >24 h, Stopp-Toast nach Buchung von Hand, Rechte-Warnung am Ablageort, alle neuen Dienstfelder verdrahtet, gruppierte Suche nach Herkunft, wahrer Leerzustand unter Prioritätsfilter, NoExport ohne „Nicht abrechnen", Prioritäten-Dialog, Textschlüssel für `MailEntry.kind`, `lang="de"` an eingebetteten Dienstsätzen, Wortwächter nur auf deutsche Werte, ruhiger dritter Zustand im Öffnen-Dialog, Startfehler-Titel nach Ursache.

Einzelheiten je Punkt:
1. A-28.1 — Karte „Versionsprüfung" unter Arbeitsplatz (Wortlaut welle-18-fluss.md 1.2). `useVersionFacts(checkEnabled)`: aus = nur installierte Fassung einmal lesen, keine `/version-check`-Abfrage, kein Takt; Nav-Hinweis und UpdateNotice verschwinden im selben Render (optimistisch über PreferencesContext, Rückfall bei Fehlschlag mit bestehendem Toast).
2. A-28.2 — `uiLanguage` in PreferencesContext; `setLanguage` nach Laden/Speichern, Rückfall bei Fehlschlag. RadioRow ohne `disabled` beim Speichern (Fokus bleibt, zweiter Wechsel wird vom In-flight-Riegel ignoriert).
3. A-28.3 — `swapPoolOrder(allRules, a, b)` baut die vollständige Liste; BoardSetupDialog tauscht Nachbarn auf dem Board, PoolAdministration (neu) Nachbarn der Gesamtliste. `aria-disabled` während des Flugs, `disabled` nur an den Enden, `useReorderFocus` hält den Fokus in der Gruppe der bewegten Zeile. Toast ersetzt den vorigen (`replaceKey`), Board-Satz nur wenn beide Regeln Spalten sind; Fehlschlag lädt die gespeicherte Ordnung.
4. A-28.6 — `requestStop` öffnet den Dialog bei >86 400 s auch mit ausgeschalteter Leistungsabfrage (dann ohne Leistungsfeld); Ende vorbelegt mit Beginn+24 h, Feldmeldungen „Ende fehlt./vor dem Anfang/mehr als 24 Stunden/in der Zukunft", Auslese „Gebucht werden: …"; `timer_stop_end_required`/`time_entry_too_long` bei einem normalen Stopp oder Wechsel öffnen dieselbe Frage (keine Sackgasse). Abbrechen bucht nichts. Wechsel (4.3) mit „Ende für „A""-Feld. `stopTimer(note, endedAt)`.
5. A-28.7 — Anlegen: Dialog schließt, dann `loadDayGroupInsight` → `stopMessage` (dieselbe Funktion wie beim Stopp); ein ganz fehlgeschlagener Abruf wird als „Vorschau fehlgeschlagen" gemeldet. Ändern: L1 nennt jetzt offen+gerundeten Wert (`openThatDay`). Neue Kante bookings→timer mit Begründung am Import.
6. A-28.8 — Warnung als erstes in `.dbconcerns` (Wortlaut 6.2), nur bei `databaseFilesTooPermissive > 0`; die Zeile `file_permissions_wide` fällt aus „Sicherheitsmeldungen"; der falsche Satz „zu dieser Datei tut er das nicht" ist berichtigt („fragt er nur nach den Zugriffsrechten").
7. `requiredTags` gelesen/gesendet; `describeStoredRuleReach` liest `matchesNothingReason` (Board-Spalte, Spaltendialog, Regelliste; Formular bleibt beim Entwurf); `todoNoExport` in TimeScreen (nicht „offen", eigene Marke „Ohne Abrechnung"); C-14-Filter Tag/Pool/Leistung auf der Exportseite mit Chips und URL-Schlüsseln `tag`/`pool`/`leistung`, „nicht mehr vorhanden" für verschwundene Ziele; `rejectedTimeEntries` in der Importzusammenfassung; `time_entry_no_export` beim Ausbuchen abgefangen.
8. C-22 — Gruppen „Todos" / „Im Vermerk (intern)" / „In Leistungen" als `role="group"` in der Listbox, Pfeiltasten linear; Herkunft als Text („Treffer in: Titel, Vermerk", „Treffer im Vermerk"); kein Vermerksauszug, kein Exportstatus in der Vermerkgruppe; SP-21 in der freigegebenen Fassung; Kopfkommentar berichtigt.
9. A-27.3 — `priorityFiltered`/`onClearPriorityFilter` an `BoardColumn`; leere Spalte unter Filter: „Keine Karte passt zum Prioritätsfilter" + „Alle Prioritäten zeigen". Ohne Filter bleibt „Keine Karte trifft diese Regel" (von kanban.spec.ts gepinnt).
10. NoExport — „Nicht abrechnen" wird bei `entry.todoNoExport` ausgeblendet (Todo-Detail und Buchungstabelle); Todo-Auswahl der Buchungsübersicht ohne NoExport-Todos; sichtbar „Ohne Abrechnung" / „No billing" statt „NoExport".
11. Prioritäten — kein `submitDisabled`, Feldmeldungen nach Absendeversuch; Löschfehler als `refusal` im ConfirmDialog; `aria-label` „„X“ bearbeiten" / „„X“ löschen"; Kanban-Pfeil nur bei Gewichtung > 0.
12. `mailKind`-Schlüssel (de wie gespeichert, en Reply/Forward/Email) in Detail und Chronologie; „Aufgabe" → „Todo" in board/todos/timer/settings-Texten (Unteraufgaben im Todoist-Hinweis bleibt, fremder Begriff).
13. `previewProblemLead/Tail` + `<ServiceText>` in TimeScreen und TodoDetailAside; ResetExportDialog-Kontext als ReactNode mit `ServiceText`; `refusal` in Attachments (Entfernen) und OutlookSetup als `ServiceText`. Nebenbei behoben: `refusal={removal.error}` mit `null` blendete die Vorwarnung aus und zeigte eine leere rote Zeile.
14. proof:surface: `visibleTextOf` überspringt `const en`/`*_EN`; Gegenprobe (englisch „Klicke… lies" grün, deutscher Bündelwert rot, JSX rot). request-scan: nur die **Zeichenketteninhalte** englischer Bündel werden geleert (Code darin bleibt sichtbar); proof-callers neue Form „Aufruf versteckt im englischen Bündel" (rot) und Harmlos-Zeile mit englischem „request" (grün). Übergabezeilen (reorderPools, stopTimer.endedAt, updateSettings, requiredTags) gestrichen; `createPool/updatePool: ['rule']` als Alias bis T-411.
16. O-KT — gesperrter Zustand: Kopf `slash-circle` + `.dialog__icon--statement`, Zeile `.dialog__consequence--statement` + `info`. CSS-Tonarten nach welle-18.md 1.2 mit Aliassen, O-LC-Regel im Kommentar.
17. Startfehler: `ServiceNotReadyError`; Titel „Der lokale Dienst ist noch nicht bereit" bzw. „Die Verbindung zum lokalen Dienst ist fehlgeschlagen"; Rückfalltext nennt Selbsthilfe. Zustandsform abwärtskompatibel (`notReady?: true`).
Nachtrag: verify-sidecar sichert zu, dass `/commands.html` 404 liefert und kein Skript enthält; Zählung der entfallenden Prüfungen auf vier berichtigt.

Prüfung:
- `pnpm --filter @takt/web run typecheck` — grün.
- `npx vitest run apps/web` — 20 Dateien, 247 Tests grün.
- `pnpm run contrast` — 0 von 522 Paaren durchgefallen, 11/11 Gegenproben.
- `proof:surface` — 55 bestanden (neue Gegenprobe E-138 Punkt 3 darin).
- `proof:foreign` — 24 bestanden.
- `proof:callers` — 76 bestanden.
- `proof:shell-surface` — 8 Prüfungen, 55 Gegenproben bestanden.
- `proof:locked` — **rot, 2 Befunde, beide SP-21**: der Lauf liest den Wortlaut aus docs/design/textbestand.md, und dort steht noch die alte, jetzt ersetzte Fassung (siehe Offene Fragen 1).
- `pnpm --filter @takt/web run build` — grün.
- `node --check apps/desktop/scripts/verify-sidecar.mjs` — Syntax grün; der Lauf selbst braucht das gebaute Installationsbild, **nicht ausgeführt**.
- Nicht geprüft: gerenderte Oberfläche (visual-qa steht aus), e2e (`tests/e2e/manual-booking-movement.spec.ts:149,211,277` erwarten den kurzen Rumpf „Gebucht: <Dauer>." exakt — der Rumpf wächst nach A-28.7, Anpassung durch e2e-tester, wie in welle-18-fluss.md AK-5.3 vorgesehen).

E-087-Suche (git grep + Arbeitsbaum über tests/, apps/*/test, packages/*/test; Bauergebnisse ausgeschlossen), Ergebnis:
- „Gebucht: " — tests/e2e/manual-booking-movement.spec.ts:149, 211, 277 (siehe oben).
- „Keine Karte trifft diese Regel" — tests/e2e/kanban.spec.ts (5 Stellen) — Satz unverändert.
- „NoExport" — nur Testnamen/Parameter, kein sichtbarer Text.
- Alle übrigen geänderten Sätze (Aufgabe→Todo, Suche, Verbindungstitel, „tut er das nicht", „kam nicht zustande", Buchung geändert) — 0 Treffer.

Liste für visual-qa (DE und EN, hell/dunkel, 960×640 und 1280×820):
1. Einstellungen → Arbeitsplatz: Karte „Versionsprüfung" (an/aus, Fokus bleibt), Rechte-Warnung im Ablageort (braucht Befund > 0), Sicherheitsmeldungen ohne Rechte-Zeile.
2. Einstellungen → Darstellung: Sprachwahl, Umschalten ohne Neuladen, Fokus auf der Option.
3. Einstellungen → Regeln: Hoch/Runter je Zeile, Enden gesperrt, Fokus nach Tausch, Toast ersetzt den vorigen, Zeilenumbruch in EN.
4. Kanban → Spalten verwalten: Tausch ohne 409, Fokus; Board mit Prioritätsfilter und leerer Spalte; Karte mit Priorität Gewichtung ≤ 0 ohne Pfeil.
5. Timer > 24 h: Stoppdialog mit Ende-Feld (mit und ohne Leistungsabfrage), Feldmeldungen, Auslese, Abbrechen; Wechsel-Dialog mit „Ende für …".
6. Zeit von Hand erfassen: Feldmeldung >24 h / vor Anfang; Toast mit Tagesgruppe und Exportwert; Buchung ändern (L1-Rumpf).
7. Export: Filter Tag/Pool/Leistung, Chips, „nicht mehr vorhanden" per Link `?tag=unbekannt`.
8. Globale Suche: drei Gruppen, Herkunftstext, Pfeiltasten über Gruppengrenzen, Leertext.
9. Todo-Detail eines NoExport-Todos: Menü ohne „Nicht abrechnen", Marke „Ohne Abrechnung"; E-Mail-Verlauf mit Art in EN.
10. Zeiterfassung: NoExport-Buchung in „Buchungen von heute".
11. Prioritäten: Anlegen mit leerem Namen (Feldmeldung, Knopf aktiv), Löschfehler im Dialog.
12. Anhang öffnen, gesperrter Zustand (Datei mit Doppelpunkt unter Linux): neutraler Kopf und Zeile, einziges Rot bleibt „ausgeführt".
13. Startfehler (Dienst nicht bereit / Verbindung fehlgeschlagen).

Annahmen:
- A-28.3 in der Regelliste mitgebaut, obwohl der Auftrag nur den Board-Dialog nennt: ohne sie ist A-28.3 („Pool-Liste unter Einstellungen ist sortierbar") nicht erfüllt, und beide nutzen dieselbe neue Funktion. Keine Live-Region-Zeile (welle-18.md 4), weil der Fluss (welle-18-fluss.md 3.3) den Toast vorgibt und der Fluss gewinnt.
- Zugängliche Namen der Pfeile in der Regelliste: „„X“ nach oben verschieben" (welle-18.md 4) statt „„X“ nach oben" (Fluss-Katalog), weil das Verb die Handlung nennt.
- Änderungs-Toast nennt jetzt den gerundeten Wert (Auftrag Punkt 5), obwohl welle-18-fluss.md 5.1 „Edit keeps its current toast" sagt — der Auftrag ist jünger.
- Wortwächter: englische Bündel **ausgenommen** statt „nur de-Objekte lesen" — damit bleibt ein deutscher Verstoß außerhalb eines Bündels (JSX, Literal) ebenfalls rot; die Gegenprobe misst beides.
- Die Tag-Auswahl im Exportfilter ist ein `Select` mit Ordnerpfad, nicht der Baum-Wähler aus A-10.16 (kein neues Bauteil).
- Nicht gebaut, weil nicht im Auftrag: Ende-Feld in der verwaisten Buchung (F-4) und im Rückkehrdialog (F-5); Sprachwahl im Startcache (`startup-appearance.js`, Prüffall liegt bei unit-tester); Ton je Ergebnis beim Öffnen-Absagesatz (welle-18.md 1.4); TimeScreen-Satz zur Leistungsabfrage (F-9); Suche im Tag-Baum (A-4.4); C-16/C-21.

Risiken:
- Die Ende-Validierung vor dem Senden vergleicht Zeitpunkte in `lib/bookingEnd.ts` (Grenze aus `@takt/domain`: `MAX_TIME_ENTRY_SECONDS`, `exceedsMaximumSeconds`); maßgeblich bleibt der Dienst. Die Auslese „Gebucht werden" ist reine Anzeige.
- `datetime-local` bleibt im Stopp- und Buchungsdialog (Q-3 aus welle-18.md 2.6 unentschieden): in englischer Oberfläche zeigt das Feld das Systemformat.
- Import-Zusammenfassung: Der Dienst schreibt für abgewiesene Buchungen zusätzlich eine deutsche Warnung — die Zahl steht damit zweimal (UI-Zeile + Dienstsatz).
- Sicherheit: keine neue Adresse, keine neue Abhängigkeit; der Versionsschalter aus schaltet nur die Oberflächenabfrage ab — dass der Dienst selbst nicht nach außen geht, misst T-397.

Offene Fragen:
1. **proof:locked rot (SP-21):** docs/design/textbestand.md (Hoheit ux-/ui-designer) führt in SP-21 noch den alten Wortlaut. Nach dem Nachtrag in derselben Zeile („Wer den alten Satz streicht, trägt den neuen im selben Auftrag ein") muss die Wortlautspalte auf „Gesucht wird in Titeln, Call-Nummern, Vermerken und Leistungstexten." und „Globale Suche über Todos, Vermerke und Leistungstexte" umgestellt werden. Ich habe die Datei nicht angefasst (fremde Hoheit). Bitte ux-designer beauftragen oder mich ausdrücklich ermächtigen.
2. **Hoheit:** apps/local-api/scripts/request-scan.mjs und proof-callers.mjs gehören domain-dev; E-135 Punkt 2 hatte den Umbau T-411 zugewiesen. Umgesetzt, weil der Auftrag beide Dateien nennt und die Übergabezeilen in proof-callers ausdrücklich auf T-400 warteten. Bitte in T-411 als erledigt führen.
3. Rechte-Warnung: bleibt `file_permissions_wide` als Vorfall im Dienst weiter bestehen, obwohl die Oberfläche ihn nicht mehr listet? (Kein Bau nötig, nur Klarstellung.)

Nächster Schritt: ux-designer zieht SP-21 in textbestand.md nach (proof:locked grün); visual-qa prüft die 13 Flächen oben; e2e-tester passt manual-booking-movement.spec.ts an (AK-5.3) und ergänzt Fälle für Suche (K-17), 24-h-Stopp und Pool-Reihenfolge; unit-tester deckt lib/bookingEnd.ts, describeStoredRuleReach und request-scan (englische Bündel) ab.
