Aufgabe: T-398c (echter Neustart) — Add-in-Nacharbeit aus T-409c, E-130, E-133, E-134, E-138
Status: braucht Review
Artefakte:
- apps/outlook-addin/src/ui/texts.ts (neue Bündelschlüssel)
- apps/outlook-addin/src/ui/TaskPane.tsx
- apps/outlook-addin/src/ui/DuplicateOffer.tsx
- apps/outlook-addin/src/ui/create-gate.ts
- apps/outlook-addin/src/ui/SettingsView.tsx
- apps/outlook-addin/src/ui/TagPicker.tsx
- apps/outlook-addin/src/ui/Primitives.tsx (nur Kommentar)
- apps/outlook-addin/src/duplicate/rule.ts
- apps/outlook-addin/src/office/save-mail.ts (nur Kommentar)
- apps/outlook-addin/src/styles/addin.css
- apps/outlook-addin/manifest.xml, apps/outlook-addin/vite.config.ts, apps/outlook-addin/README.md
- gelöscht: apps/outlook-addin/src/quick-command.ts, apps/outlook-addin/src/commands.ts, apps/outlook-addin/commands.html
- apps/outlook-addin/scripts/proof-addin.mjs (Abschnitte 5, 5b, 18-Kopf, 18e, 18f, 19f, 20)

Zusammenfassung:
Fehlschlag und Abbruch sagen jetzt, ob die E-Mail angehängt wurde. Das gilt fürs Ergänzen und fürs Anlegen, und ein möglicherweise schon gespeicherter Stand wird als offen benannt. Bei mehreren Treffern läuft die Sperre über `createTodoGate`, nennt ihren Grund, und der Knopf heißt „E-Mail an Todo anhängen“. Der tote Schnellbefehl ist vollständig entfernt. Die Uhrzeit steht als „Uhrzeit der Frist (optional)“ direkt unter „Frist“. Der Leitbegriff ist „Todo“. `proof:addin` 18 beschreibt die neue Grenze und prüft `/mails` mit fremder Call-Nummer samt Gegenprobe. 18e misst nach E-130 sichtbare Werte statt Bezeichner.

Einzelpunkte:
1. `Failure` bekommt `appending` und `maybeSaved`. Die Sätze stehen im Bündel: `failureNothingCreated` (SP-A-32 zeichengleich), `failureNothingAppended`, `failureCreateUnknown`, `failureAppendUnknown`, `cancelledCreate`, `cancelledAppend`. „Möglicherweise gespeichert“ gilt bei `unreachable`, `request_timeout` und `transfer_interrupted` sowie im `catch`, also genau dort, wo auch der Client „kann bereits gespeichert sein“ sagt. Vorher stand in diesen Fällen daneben „Es ist kein Todo entstanden.“, ein Widerspruch.
2. `createTodoGate` hat den neuen Eingang `targetChoiceMissing` mit dem Grund „Mehrere Todos passen. Bitte eines auswählen.“. Er steht an zweiter Stelle der Lesereihenfolge, hinter der Call-Nummer. Die Nebenbedingung am Knopf ist entfernt. Die Beschriftung lautet `appending || choosingTarget ? appendButton : createButton`.
3. Abschnitt 18 hat einen neuen Kopf, der A-10.11 bis A-10.13 wörtlich wiedergibt. Neuer Prüffall: `/mails` mit `TCK-000043` gegen das Trägertodo `TCK-000042` ergibt 422 mit der Meldung der Call-Nummer-Regel. `todo_attachment` und `todo_mail` bleiben bei 0. Die Gegenprobe schickt dieselbe Anfrage mit passender Nummer: 200, ein Anhang, ein Mail-Eintrag. Die Gegenprobe benutzt einen Verweis und keine Datei, weil der zusammengesetzte Dienst kein Anhangsverzeichnis hat; Dateien werden dort mit `rejected` abgewiesen, das ist gemessen.
4. 18e liest über die TypeScript-API String-Literale, Template-Teile und JSX-Text (`sichtbareWerteAus`) und nicht mehr den Quelltext ohne Kommentare. Neue Gegenprobe: Bezeichner zählen nicht; „Deadline“ in einem Bündelwert, „Fällig am“ als JSX-Text und „Fälligkeitsdatum“ im Template werden rot. Außerdem gemessen: „Fälligkeit“ steht nirgends sichtbar, und die Uhrzeit steht zwischen Frist und Tags. Die Anrede-Wächter (E-080) lesen weiterhin `sichtbareTexte()` unverändert, weil sie nach ihrem eigenen Kommentar Bezeichner bewusst mitprüfen.
5. Schnellbefehl: drei Dateien gelöscht. `FunctionFile` und `commandsUrl` sind aus dem Manifest entfernt; vor PR #19 kam das Manifest ohne `FunctionFile` aus (geprüft an `f6f4d6d`). `commands.html` ist aus `rollupOptions` entfernt, die README-Zeilen ebenso. Das Manifest spricht in der Beschreibung jetzt von „Todo“.
6. Nichtblocker:
   - Einstellungen: Die Beschreibung trägt nur noch den ersten Satz. Der Hinweis am Eingabefeld sagt jetzt „Übernommen wird der Inhalt der ersten Klammer, ohne Klammer der ganze Treffer.“ (A-10.15).
   - „Standard-Status“ heißt jetzt „Ablagevorgabe: Status“ und „Standard-Tags“ heißt „Ablagevorgabe: Tags“, im Einklang mit dem Aufgabenbereich.
   - `role="status"` sitzt nur noch am Statusabsatz `offer__status`, der immer im Baum steht. `DuplicateOffer` benutzt jetzt `duplicateNotice`, statt die Unterscheidung nachzubauen.
   - Der Anhangssatz wird bei `target === 'new'` ausgeblendet.
   - `summary`, `openSeconds` und `exportedSeconds` sind aus `OfferDescription` entfernt. Die DTO des Dienstes bleibt unverändert.
   - TagPicker: Während der Suche ist die Ordnerzeile ein nicht fokussierbares Etikett ohne `aria-expanded`. Jeder Ordnerblock ist `role="group"` mit dem Pfad als `aria-label`.
   - Überall „Todo“ statt „Aufgabe“.
7. `NO_ATTACHMENT_ON_EXISTING` heißt jetzt `REPEAT_ASSIGNMENT_NO_DUPLICATES`.

Prüfung:
- `pnpm --filter @takt/outlook-addin run typecheck`: fehlerfrei.
- `pnpm --filter @takt/local-api run typecheck`: fehlerfrei.
- `pnpm run proof:addin`: **283 bestanden, 0 fehlgeschlagen** (vorher 279/1).
- Gegenprobe am echten Code, danach zurückgesetzt und per `cmp` bytegleich bestätigt: In `mail-assignment.ts` wurde der Call-Nummern-Vergleich entfernt und in `texts.ts` ein „Deadline“-Wert eingesetzt. Ergebnis 281/2, rot waren genau der neue `/mails`-Fall und A-19.2.
- `pnpm --filter @takt/outlook-addin run build`: grün; `dist/` enthält nur noch `index.html` und `assets/`.
- `vitest run apps/outlook-addin`: **43 Tests grün, 1 Datei rot.** `apps/outlook-addin/test/office/quick-command.test.ts` importiert das gelöschte `src/quick-command.ts`. Die Datei gehört dem unit-tester; ich habe sie nicht angefasst.
- Nicht geprüft: `pnpm test:e2e` (Hoheit e2e-tester, siehe unten), `verify:bundle`/`verify-sidecar` (braucht den Sidecar-Bau), `pnpm check` insgesamt.

Annahmen:
- Die neuen Oberflächentexte stehen in `TEXTS` (E-118). Die Sperrgründe bleiben im lokalen `REASON` von `create-gate.ts`, weil dort alle sechs zusammenstehen.
- SP-A-27 und SP-A-28 sind nach E-133 Punkt 2 und T-391c umformuliert: „am ausgewählten Todo“ und „lässt erledigte Todos erledigt.“. Sie liegen jetzt in `texts.ts`, und Abschnitt 20 misst sie dort. Nach E-078 Punkt 3 braucht das die ausdrückliche Zustimmung des spec-ux-reviewer. Ich lese den Auftrag als diese Deckung, bitte bestätigen.
- Im Zustand „möglicherweise gespeichert“ steht statt SP-A-32 ein eigener Satz. SP-A-32 bleibt für den sicheren Fehlschlag zeichengleich.
- Neuer Statussatz bei Treffern: „Zu dieser Call-Nummer gibt es ein passendes Todo.“ beziehungsweise „… mehrere passende Todos.“. Ohne ihn wäre die Live-Region im Trefferfall stumm.
- `.offer:empty` heißt jetzt `.offer__status:empty`, und die tote Klasse `.offer__none` ist zu `.offer__status` umbenannt. Weitere tote `.offer__*`-Regeln habe ich stehen lassen, weil 5b sie noch zählt.

Risiken:
- **E-087, e2e bricht:** `tests/e2e/outlook-addin-build.spec.ts` benutzt an den Zeilen 187 und 189 `/Zur Aufgabe ergänzen/`, an Zeile 198 „E-Mail an Aufgabe anhängen“, an Zeile 206 „Stattdessen neue Aufgabe erstellen“, an Zeile 209 „Fälligkeitsuhrzeit (optional)“ und an Zeile 226 „Neue Aufgabe anlegen“. Die neuen Namen lauten „Zum Todo ergänzen:“, „E-Mail an Todo anhängen“, „Stattdessen neues Todo anlegen“, „Uhrzeit der Frist (optional)“ und „Neues Todo anlegen“. `tests/e2e/outlook-mail-detail.spec.ts:29` („Fälligkeitsuhrzeit“) betrifft die Hauptanwendung, nicht das Add-in.
- **`apps/desktop/scripts/verify-sidecar.mjs:442-447`** (frontend-dev) verlangt `/commands.html` im gebauten Paket und wird deshalb rot. Die Prüfung muss fallen, idealerweise umgekehrt als „liefert kein `commands.html` aus“.
- Veraltete Texte in fremden Dokumenten: `docs/design/addin-anhangsuebernahme-fluss.md` (AK-22 „Knopfbeschriftung ‚Neue Aufgabe anlegen‘ unverändert“, Z-Tabellen), `docs/outlook-bridge-alignment.md`, `docs/bedrohungsmodell.md` und `docs/spec.md` A-10.11 nennen noch „Schnell in Inbox“ beziehungsweise den Schnellbefehl. A-10.17 sagt bereits, dass er ersetzt ist.
- Sicherheit: Mit dem Schnellbefehl entfällt der letzte Weg, der eine Mail ohne Auswahl des Benutzers ablegte (T-409b-2). Die Tür `/mails` ist unverändert und jetzt mit Gegenprobe gemessen.

Offene Fragen:
1. unit-tester: `apps/outlook-addin/test/office/quick-command.test.ts` löschen (E-134 Punkt 2). Bis dahin ist `vitest run apps/outlook-addin` rot.
2. e2e-tester: die sechs Namen oben nachziehen (E-087).
3. frontend-dev (T-400) oder Orchestrator: Die Prüfung auf `commands.html` in `verify-sidecar.mjs` muss fallen oder sich umkehren.
4. spec-ux-reviewer: Zustimmung zur Neufassung von SP-A-27 und SP-A-28 („Todo“) und zu den neuen Sätzen im Bündel (Statussatz, Fehlschlag- und Abbruchsätze, Sperrgrund).
5. documenter oder Orchestrator: `docs/spec.md` A-10.11 (Satz „Schnell in Inbox“), `docs/outlook-bridge-alignment.md` und die Designpapiere oben nachziehen.

Nächster Schritt: Die Folgeaufgaben für unit-tester (Prüffall löschen), e2e-tester (Namen) und frontend-dev (`verify-sidecar`) in dieselbe nächste Welle legen. Danach das Qualitätstor für die Add-in-Hälfte von PR #19.
