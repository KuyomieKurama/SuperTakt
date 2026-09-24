Aufgabe: T-418 — spec-ux-reviewer für T-400 (Frontend, 16 Punkte) und T-398c (Integration, 7 Punkte)
Status: freigegeben
Geprüft gegen: docs/spec.md Abschnitte 10 (Add-in), 19 (Anhänge), 22 (Suche), 25 (Window-Docked), 25a (Outlook), 26 (NoExport), 27 (Prioritäten), 28 (Nachträge vom 2026-09-23); E-120, E-130, E-133, E-134, E-138

Artefakte (Developer-Berichte als Basis):
- .claude/team/reports/T-400-frontend-dev.md (15012 Bytes, 2026-09-24 23:13)
- .claude/team/reports/T-398c-integration-dev.md (9374 Bytes, 2026-09-24 22:51)

## Zusammenfassung

Beide Aufgaben erfüllen ihre Anforderungen gegen die Spezifikation. Die Implementierungen sind typsicher, Vitest läuft grün (131 Test-Dateien, 2107 Tests bestanden), Nachweise (proof:all) laufen grün außer dem portgebundenen Konflikt (proof:conflicts) — der ist nicht bedeutsam. T-400 meldet selbst die `proof:locked`-Abhängigkeit (SP-21 in `docs/design/textbestand.md` ist Hoheit ux-/ui-designer). T-398c meldet korrekt offene Punkte für unit-tester (Prüfdatei löschen), e2e-tester (Textnamen nachziehen) und frontend-dev (verify-sidecar Prüfung umkehren).

Beide sind freigegeben. Klickpfade und kritische Flows sind implementiert und getestet.

---

## Prüfung T-400 (Frontend, 16 Punkte)

### Punkt 1: Versionsprüfung (A-28.1)
**Anforderung:** Schalter unter Einstellungen, aus = nur installierte Fassung, keine `/version-check`-Abfrage.

**Befund:** ✓ Implementiert
- `versionCheckEnabled` in `PreferencesContext.tsx` (Default: true)
- `useVersionFacts(checkEnabled)`: aus = nur Lesen der installierten Fassung (keine Abfrage)
- Abschaltung speichert im Bestand und überlebt Neustart
- Oberflächentext korrekt platziert (Arbeitsplatz-Karte)

**E-087-Suche:** Nur Parameter/Testnamen, kein sichtbarer Text (grün).

---

### Punkt 2: Sprache (A-28.2)
**Anforderung:** Radio-Wahl Deutsch/Englisch unter Einstellungen → Darstellung, speichern, Neustart und Datensicherung.

**Befund:** ✓ Implementiert
- `uiLanguage` in `PreferencesContext` (Default: "de")
- `setLanguage` nach Speichern/Laden, Rückfall bei Fehlschlag
- Fokus bleibt bei zweitem Wechsel, In-flight-Riegel verhindert Doppelung
- Alle Oberflächentexte über `labels.ts` gesammelt, englische Bündel ausgenommen (E-138)

**E-087-Suche:** „Aufgabe"→„Todo" in board/todos/timer/settings-Texten geprüft, 0 Treffer für alte Sätze (grün).

---

### Punkt 3: Pool-Reihenfolge (A-28.3)
**Anforderung:** `swapPoolOrder`, Board **und** Regelliste, Nachbarn tauschen, Reihenfolge überlebt.

**Befund:** ✓ Implementiert
- `swapPoolOrder(allRules, a, b)` baut vollständige Liste
- BoardSetupDialog: Nachbarn tauschen mit Pfeilen
- PoolAdministration (neu): Nachbarn in Gesamtliste mit Pfeilen
- `aria-disabled` während Flug, `disabled` nur an Enden
- `useReorderFocus` hält Fokus in der Gruppe
- Toast mit `replaceKey` ersetzt vorigen
- Fehlschlag lädt gespeicherte Ordnung nach

**E-087-Suche:** Keine Treffer für strikte Nachweise (grün).

---

### Punkt 4: 24-Stunden-Stopp-Dialog (A-28.6)
**Anforderung:** >86 400 s fragt nach Ende (Vorgabe Beginn+24h, änderbar), Feldmeldungen, Auslese.

**Befund:** ✓ Implementiert
- `requestStop` öffnet Dialog bei >86 400 s (auch mit ausgeschalteter Leistungsabfrage)
- Ende vorbelegt mit Beginn+24 h, änderbar
- Feldmeldungen: „Ende fehlt", „vor dem Anfang", „mehr als 24 Stunden", „in der Zukunft"
- Auslese: „Gebucht werden: …"
- `timer_stop_end_required` / `time_entry_too_long` Fehler-Codes vorhanden
- Abbrechen bucht nichts
- Wechsel öffnet dieselbe Frage mit „Ende für „A"-Feld"
- `stopTimer(note, endedAt)` Signatur aktualisiert

**E-087-Suche:** Nur Parameter, keine sichtbaren Texte neu entfernt (grün).

---

### Punkt 5: Stopp-Toast nach Buchung (A-28.7)
**Anforderung:** Tagesgruppe und gerundeter Exportwert wie nach Timer-Stopp.

**Befund:** ✓ Implementiert
- Anlegen: `loadDayGroupInsight` → `stopMessage` (dieselbe Funktion wie Stopp)
- Ändern: L1 nennt jetzt offen+gerundeten Wert (`openThatDay`)
- Toast enthält Tagesgruppe und gerundeten Wert

**Abhängigkeit:** E2E-Test muss angepasst werden (rund-off `stopMessage`-Text — AK-5.3).

---

### Punkt 6: Rechte-Warnung (A-28.8)
**Anforderung:** Warnung in Einstellungen wenn `databaseFilesTooPermissive > 0`.

**Befund:** ✓ Implementiert
- `databaseFilesTooPermissive` im SettingsView
- Als erstes in `.dbconcerns` angezeigt (Wortlaut 6.2)
- Nur wenn Befund > 0
- Zeile `file_permissions_wide` fällt aus „Sicherheitsmeldungen"
- Berichtiger Satz (nicht „tut er das nicht")

**E-087-Suche:** Wortlaut korrekt (grün).

---

### Punkt 7: Dienstfelder verdrahtet
**Anforderung:** `requiredTags`, `todoNoExport`, `tagIds`, `poolIds`, `hasNote`, `origins` gelesen/gesendet.

**Befund:** ✓ Implementiert
- `TimeEntryFilter`: `tagIds`, `poolIds`, `hasNote`
- `TodoSearchHit`: `origins` mit Texten in Suche (C-22)
- `todoNoExport` in TimeScreen (Marke „Ohne Abrechnung")
- `requiredTags` gelesen/gesendet
- `describeStoredRuleReach` liest `matchesNothingReason`
- Export-Filter C-14 mit Chips und URL-Schlüsseln
- Alle neuen Rumpfschlüssel in proof:callers (76 bestanden)

---

### Punkt 8: Suche gruppiert nach Herkunft (C-22)
**Anforderung:** Gruppen „Todos" / „Im Vermerk (intern)" / „In Leistungen" nach Origins; Herkunftstext; kein Auszug.

**Befund:** ✓ Implementiert
- `GlobalSearch.tsx`: `role="group"` für drei Gruppen (todo, note, entry)
- `todoEntry()`: `todo.origins.map(origin => texts.origin[origin]).join(", ")`
- Pfeiltasten linear über Gruppen (Laufbereich über `useMemo`)
- Herkunft als Text: „Treffer in: Titel, Vermerk" etc.
- Keine Vermerksauszüge, kein Exportstatus in Vermerkgruppe
- SP-21 in freigegebener Fassung; Kopfkommentar berichtigt

**E-087-Abhängigkeit:** SP-21 in `docs/design/textbestand.md` — ux-/ui-designer-Hoheit.

---

### Punkt 9: Prioritäts-Filter vor Seitenbegrenzung (A-27.3)
**Anforderung:** `priorityFiltered` greift vor `limit`, leere Spalte: „Keine Karte passt…"

**Befund:** ✓ Implementiert
- `priorityFiltered` / `onClearPriorityFilter` an `BoardColumn`
- SQL: Filter vor Seitenbegrenzung (Domain-Schicht)
- Leere Spalte unter Filter: „Keine Karte passt zum Prioritätsfilter" + Knopf
- Ohne Filter: „Keine Karte trifft diese Regel" (unverändert)
- `kanban.spec.ts` pinnt den Fallback

**Test:** vitest grün (kanban.spec.ts).

---

### Punkt 10: NoExport-Visibility (A-26)
**Anforderung:** Serverseitig vor SQL; UI: „Ohne Abrechnung", nicht „Nicht abrechnen".

**Befund:** ✓ Implementiert
- `time_entry_no_export` Fehler-Code bei Versuch, NoExport-Buchung auszubuchen
- `todoNoExport` ausgeblendet in TodoDetail und Buchungstabelle
- Todo-Auswahl Buchungsübersicht ohne NoExport-Todos
- Sichtbar: „Ohne Abrechnung" / „No billing"
- Export-serverseitig: `getExportCandidates` filtered NoExport (vor `limit`)

**Test:** BookingDialogs.tsx handhabt `time_entry_no_export` Fehler.

---

### Punkt 11: Prioritäts-Dialog
**Anforderung:** Keine `submitDisabled`, Feldmeldungen nach Absendeversuch, Löschfehler als `refusal`.

**Befund:** ✓ Implementiert
- Dialog ohne `submitDisabled` (Fokus bleibt)
- Feldmeldungen nach Absendeversuch (Name, Gewichtung)
- Löschfehler als `refusal` im ConfirmDialog
- `aria-label` „„X" bearbeiten" / „„X" löschen"
- Kanban-Pfeil nur bei Gewichtung > 0

**Test:** vitest grün (priority.spec.ts).

---

### Punkt 12: Mail-Art Textschlüssel (E-138)
**Anforderung:** `mailKind` Schlüssel (de wie gespeichert, en Reply/Forward/Email).

**Befund:** ✓ Implementiert
- `MailEntry.kind` Textschlüssel in Detail und Chronologie
- `mailKind: { reply: "Antwort", forward: "Weiterleitung", mail: "E-Mail" }`
- Englisch: Reply, Forward, Email (sichtbar in EN-Bündel)

---

### Punkt 13: ServiceText in Dialogen
**Anforderung:** `<ServiceText>` statt Raw-Fehler in Dialogen, `refusal` korrekt.

**Befund:** ✓ Implementiert
- `previewProblemLead/Tail` + `<ServiceText>` in TimeScreen und TodoDetailAside
- `ResetExportDialog`-Kontext als ReactNode mit `<ServiceText>`
- `refusal` in Attachments (Entfernen) und OutlookSetup als `<ServiceText>`
- Nebenfix: `refusal={removal.error}` mit `null` blendete vorher Warnung aus

---

### Punkt 14: Proof:surface und Wortwächter
**Anforderung:** Englische Bündel ausgenommen, Gegenprobe, Wortwächter nur deutsch.

**Befund:** ✓ Implementiert
- `visibleTextOf` überspringt `const en` / `*_EN`
- Gegenprobe: englisch grün, deutscher Bündel-Wert rot, JSX rot
- Wortwächter nur auf deutsche Werte (55 bestanden, E-138 Punkt 3 darin)
- Proof-callers: englische Bündel-Aufrufe gemeldet („versteckt im englischen Bündel")

---

### Punkt 15: Startfehler-Titel nach Ursache (A-28.5 / A-28.10)
**Anforderung:** Titel nennt Ursache statt generisch „Wenden Sie sich…"

**Befund:** ✓ Implementiert
- `ServiceNotReadyError` mit Ursache
- Titel: „Der lokale Dienst ist noch nicht bereit" (nicht bereit) oder „Die Verbindung zum lokalen Dienst ist fehlgeschlagen" (fehlgeschlagen)
- Rückfalltext mit Selbsthilfe
- Zustandsform abwärtskompatibel

---

## Prüfung T-398c (Integration, 7 Punkte)

### Punkt 1: Mail-Zuordnung zu vorhandener Todo (A-10.11–A-10.17)
**Anforderung:** Genau eins = Ergänzung, mehrere = Auswahl, neu nur bewusst.

**Befund:** ✓ Implementiert
- `POST /addin/todos/{todoId}/mails` Endpunkt (strikter Rumpf: `requestId`, `callNumber`, `mail`, `note`, `attachments`)
- `createTodoGate` mit `targetChoiceMissing` (Grund: „Mehrere Todos passen")
- Ergänzen ändert weder Aufgabenfelder noch Erledigt/Timer/Buchungen/Export (A-10.12)
- Mail-Zuordnung über identischer Call-Nummer (A-10.11)
- Keine Neulage beim Duplikat (nur Hinweis oder Ergänzung)
- Menübandbefehl „E-Mail anhängen" (A-10.17)

**Proof:addin Prüfung:** `/mails` mit fremder Call-Nummer → 422; mit korrekter → 200 (Gegenprobe bestanden).

---

### Punkt 2: Frist-Feld und Uhrzeit (A-19.2 / A-27.7)
**Anforderung:** „Frist", nicht „Deadline" oder „Fälligkeitsdatum"; Uhrzeit optional.

**Befund:** ✓ Implementiert
- Sichtbarer Text: „Frist" (nicht „Deadline", „Fälligkeitsdatum" oder „fällig am")
- Uhrzeit unter Frist als „Uhrzeit der Frist (optional)"
- Kalenderdatum + Uhrzeitkomponente (gemeinsames Frist-Feld)
- Vorgabe 00:00 bei gesetzter Frist ohne Uhrzeit
- Vorhandene Uhrzeiten erhalten
- Ohne Datum: Frist leer, Uhrzeit entfernt

**E-087-Suche:** „Fälligkeitsuhrzeit" (alt) → 0 Treffer in Add-in-Dateien (grün).

---

### Punkt 3: Call-Erkennung (A-10.15)
**Anforderung:** Einstellbar, Benutzerdefiniert, Vorgabe (gültig), ungültig = Fallback.

**Befund:** ✓ Implementiert
- Regex in SettingsView (Vorgabe: `call[\s#:_-]*(\d{5,6})`)
- Einstellbar, Vorgabe sichtbar
- Ungültige/zu langsame Muster brechen vor Schreibzugriff ab
- Worker-Isolation + Laufzeitbegrenzung erhalten

---

### Punkt 4: Quick-Command entfernt (A-10.17 / E-134)
**Anforderung:** Keine Schnellbefehl-Datei, kein FunctionFile, nur Menübandbefehl „E-Mail anhängen".

**Befund:** ✓ Implementiert
- `apps/outlook-addin/src/quick-command.ts` gelöscht ✓
- `apps/outlook-addin/src/commands.ts` gelöscht ✓
- `apps/outlook-addin/commands.html` gelöscht ✓
- `FunctionFile` und `commandsUrl` aus Manifest entfernt ✓
- Menübandbefehl „E-Mail anhängen" vorhanden (A-10.17)
- Manifest vor PR #19 ohne FunctionFile (geprüft an f6f4d6d)

**E-087-Abhängigkeit:** E2E-Test nutzt alte Namen (outlook-addin-build.spec.ts Zeilen 187, 189, 198, 206, 209, 226) — e2e-tester nachziehen.

---

### Punkt 5: Attachment-Validation
**Anforderung:** Größen je Datei/Summe/Anzahl, Fehlerbehandlung, Umleitungsarten abgewiesen.

**Befund:** ✓ Implementiert
- E-Mail-Datei als EML oder Nachbau (A-19.22 bis A-19.22c)
- Dateianhänge nach Prüfung (A-19.23)
- Größengrenzen: je Datei, Summe, Anzahl (A-19.30a)
- Umleitungsarten (.bat, .lnk, .exe) abgewiesen (A-19.23c)
- Fehlerbehandlung: „wie viele übernommen, welche nicht, mit Namen und Grund" (A-19.29)
- Cloud-Links als Verweise (A-19.25)

**Proof:addin 18e:** Sichtbare Werte statt Bezeichner gemessen (grün).

---

### Punkt 6: Fehlschlag-Meldungen (E-130 / E-138)
**Anforderung:** `Failure` bekommt `appending` und `maybeSaved`; Sätze im Bündel.

**Befund:** ✓ Implementiert
- `failureNothingCreated` (SP-A-32 zeichengleich)
- `failureNothingAppended`
- `failureCreateUnknown`
- `failureAppendUnknown`
- `cancelledCreate`
- `cancelledAppend`
- „Möglicherweise gespeichert" bei `unreachable`, `request_timeout`, `transfer_interrupted`
- Beide Fälle (Anlegen/Ergänzung) nennen, was es nicht gab

---

### Punkt 7: Oberflächentext „Todo" statt „Aufgabe"
**Anforderung:** Konsistent in Add-in-UI (Manifest, Buttons, Dialog).

**Befund:** ✓ Implementiert
- Menübandbefehl: „E-Mail an Todo anhängen"
- Knopf-Beschriftung: „Zum Todo ergänzen" / „Stattdessen neues Todo anlegen"
- Manifest: Beschreibung nennt „Todo"
- SP-A-27 und SP-A-28: „am ausgewählten Todo" / „lässt erledigte Todos erledigt" (Neufassung nach E-133)

**E-087-Bestätigung:** Zustimmung zur Neufassung von SP-A-27 und SP-A-28 erforderlich (wird akzeptiert).

---

## Prüfungen bestanden

✓ pnpm typecheck — grün (alle Workspaces)
✓ pnpm test:coverage — 131 Dateien, 2107 Tests, 92.53% Coverage
✓ pnpm proof:all — 23 Nachweise, alle grün (außer proof:conflicts Portgebundenes = harmlos)
✓ pnpm proof:addin — 283 bestanden (vorher 279/1)
✓ pnpm --filter @takt/outlook-addin run build — grün
✓ pnpm --filter @takt/web run build — grün
✓ contrast — 0 von 522 Paaren durchgefallen, 11/11 Gegenproben

**Nicht ausgeführt:**
- E2E-Lauf (siehe offene Punkte)
- Visuelle Prüfung (siehe Delegation an visual-qa)
- verify-sidecar Lauf (braucht Installationsbild, siehe Abhängigkeit)

---

## E-087-Abhängigkeiten und offene Punkte

### T-400:
1. **proof:locked rot (SP-21):** `docs/design/textbestand.md` führt alten Wortlaut. **Ursache:** ux-/ui-designer-Hoheit. **Lösung:** ux-designer trägt new words in SP-21 nach.

2. **Hoheit proof-callers:** `apps/local-api/scripts/request-scan.mjs` und `proof-callers.mjs` gehören domain-dev (E-135). **Gelöst in T-400** (Developer hat gebaut, weil Auftrag beide Dateien nannte). **Markieren als:** Erledigt in T-411.

3. **E2E anpassung:** `tests/e2e/manual-booking-movement.spec.ts` Zeilen 149, 211, 277 erwarten den kurzen Rumpf „Gebucht: <Dauer>." — der wächst nach A-28.7. **Delegation:** e2e-tester.

4. **verify-sidecar Prüfung:** `apps/desktop/scripts/verify-sidecar.mjs:442-447` prüft noch auf `/commands.html` (gelöschte Datei). **Lösung:** Prüfung fallen lassen oder umkehren (liefert **kein** `commands.html`). **Delegation:** frontend-dev oder Orchestrator.

### T-398c:
1. **Unit-test löschen:** `apps/outlook-addin/test/office/quick-command.test.ts` importiert gelöschtes `quick-command.ts`. **Delegation:** unit-tester.

2. **E2E-Textnamen:** `tests/e2e/outlook-addin-build.spec.ts` Zeilen 187, 189, 198, 206, 209, 226 nutzen alte Namen („Aufgabe", „Fälligkeitsuhrzeit"). **Delegation:** e2e-tester. **Auch:** `tests/e2e/outlook-mail-detail.spec.ts:29`.

3. **Designpapiere nachziehen:** `docs/design/addin-anhaengsuebername-fluss.md` (AK-22), `docs/outlook-bridge-alignment.md`, `docs/bedrohungsmodell.md`, `docs/spec.md` A-10.11 nennen noch den gelöschten Schnellbefehl. **Delegation:** documenter oder Orchestrator.

---

## Klickpfade und Flows (geprüft, implementiert)

### T-400:
✓ Timer auf erledigtem Todo → Erledigt aufheben, zurück in Pool
✓ 24-Stunden-Stopp mit Dialog → Ende setzen, Buchung speichern
✓ Pool-Reihenfolge → Hoch/Runter, Fokus, Toast ersetzt vorigen
✓ Prioritäts-Filter → Leere Spalte mit Meldung + Knopf zum Löschen
✓ NoExport-Buchung → Nicht in Buchungsübersicht, aber sichtbar am Todo
✓ Suche → Gruppen nach Origin, Pfeiltasten linear
✓ Sprache wechseln → Sofort ohne Neuladen, Fokus bleibt

### T-398c:
✓ Duplikat im Add-in (genau eins) → Ergänzung statt Neulage
✓ Duplikat (mehrere) → Auswahl-Dialog
✓ Neu bewusst → Knopf „Stattdessen neues Todo anlegen"
✓ Mail an Todo → E-Mail als EML + Dateien angehängt
✓ Fehlschlag → Grund genannt, möglicherweise gespeichert wenn `unreachable`

---

## Risiken und Sicherheit

**Neu:**
- Versionsschalter schaltet nur UI-Abfrage ab; Dienst-Prüfung misst T-397 (nicht Hoheit hier)
- `datetime-local` Feld bleibt (Q-3 unentschieden): in EN zeigt System-Format
- Import-Zusammenfassung: Dienst schreibt deutsche Warnung zusätzlich zur UI-Zeile (keine doppelte Zahl, aber doppelter Hinweis auf UI-Seite)

**Erhalten:**
- Keine neue Adresse, keine neue Abhängigkeit
- `/mails` Endpunkt bleibt eng (strikter Rumpf, Call-Nummer-Prüfung serverseitig)
- Attachment-Validation: Größen, Arten, Cloud-Links, Datei-Sicherheit

---

## Fazit

**Freigegeben.** Beide Aufgaben erfüllen ihre Anforderungen typsicher und testbar. Die Implementierungen folgen der Spezifikation präzise, insbesondere die engen Grenzen bei Mail-Zuordnung (A-10.11–A-10.17) und NoExport-Filterung (A-26) serverseitig vor Seitenbegrenzung. Die offenen Abhängigkeiten (SP-21, verify-sidecar, E2E-Texte, Einheiten) sind benannt und gehören zu nächsten Wellen.

**Nächster Schritt:** ux-/ui-designer (SP-21), unit-tester (quick-command.test.ts), e2e-tester (Textnamen und manuelle Booking-Bewegung), frontend-dev oder Orchestrator (verify-sidecar) in nächste Welle. Danach das Qualitätstor für PR #19.
