Aufgabe: T-418 (Code Review) — T-400 (Frontend 16p.) + T-398c (Add-in 7p.) zusammen prüfen
Status: **braucht Nacharbeit** — 5 blockierende Befunde, 2 bedingt blockierend

## Artefakte geprüft

**T-400:** apps/web/src/api/types.ts, lib/*.ts, features/*/*, styles/*, scripts/proof-*.mjs  
**T-398c:** apps/outlook-addin/src/ui/*.tsx, duplicate/*, office/*, manifest.xml, proof-addin.mjs

## Zusammenfassung

Beide Aufgaben sind **typsicher** (tsc, vitest grün). API-Routen sind richtig verdrahtet. Die Sicherheit der Add-in-Routes ist korrekt (Token-Scope auf `/api/v1/addin`). Datenschutz-Trennung (Todo-Notiz vs. Mail-Notiz, NoExport-Verbergung) ist implementiert. **Jedoch:** Vier Abhängigkeiten sind unbenutzbar, bis andere Agenten ihre Aufgaben abschließen. Ein Nachweis ist rot. Ein Nachweis braucht Überprüfung.

## Befunde

### Blockierend

**T-400-1: proof:locked rot (Hoheit ux-designer)**  
`proof:locked` misst gegen `docs/design/textbestand.md` und findet dort noch den alten Wortlaut für SP-21.  
```
Gesucht wird in Titeln, Call-Nummern, Vermerken und Leistungstexten.
Globale Suche über Todos, Vermerke und Leistungstexte
```
müssen aktualisiert werden. Der T-400-Bericht dokumentiert das; ux-designer trägt die Änderung nach.  
**Freigabe blockiert, bis dieser Lauf grün ist.**

**T-398c-1: vitest rot in Abhängigkeit (Hoheit unit-tester)**  
`apps/outlook-addin/test/office/quick-command.test.ts` importiert das gelöschte `src/quick-command.ts`. Der Code ist korrekt gelöscht; die Test-Datei gehört unit-tester.  
**Muss erledigt sein vor Freigabe.**

**T-398c-2: e2e-Tests warten auf Anpassung (Hoheit e2e-tester)**  
Sechs Stellen in `tests/e2e/outlook-addin-build.spec.ts` nutzen alte Oberflächenbegriffe:
- Zeile 187, 189: `/Zur Aufgabe ergänzen/` → `Zum Todo ergänzen`
- Zeile 198: „E-Mail an Aufgabe anhängen" → „E-Mail an Todo anhängen"
- Zeile 206: „Stattdessen neue Aufgabe erstellen" → „Stattdessen neues Todo anlegen"
- Zeile 209: „Fälligkeitsuhrzeit (optional)" → „Uhrzeit der Frist (optional)"
- Zeile 226: „Neue Aufgabe anlegen" → „Neues Todo anlegen"

Zusätzlich: `tests/e2e/outlook-mail-detail.spec.ts:29` hat „Fälligkeitsuhrzeit" (Hauptanwendung, nicht Add-in, aber von T-400 beeinflusst).  
**Muss erledigt sein vor Freigabe.**

**T-400-2: verify-sidecar.mjs braucht Umkehr (Abhängigkeit frontend-dev oder Orchestrator)**  
`apps/desktop/scripts/verify-sidecar.mjs:442–447` prüft auf Anwesenheit von `/commands.html` in der gebauten Paketei. Mit T-398c ist die Datei aus dem Build entfernt. Die Prüfung muss umgekehrt werden: „liefert kein `/commands.html` aus" (oder gelöscht).  
**Freigabe von T-400 blockiert, bis das behoben ist.**

**T-400-3: e2e Buchungs-Rumpf veraltet (Hoheit e2e-tester)**  
`tests/e2e/manual-booking-movement.spec.ts` Zeilen 149, 211, 277 erwarten den alten Rumpf `Gebucht: <Dauer>.` Der neue Rumpf nach A-28.7 ist breiter (`Gebucht werden: <Dauer> ... <Tagesgruppe>`). Der T-400-Bericht nennt dies (AK-5.3) und weist auf Anpassung durch e2e-tester hin.  
**Freigabe von T-400 blockiert, bis Anpassung erledigt.**

### Überprüfung erforderlich

**T-398c-3: A-19.2 Deadline-Feld rot bei Gegenprobe**  
Der T-398c-Bericht sagt: „Gegenprobe am echten Code, danach zurückgesetzt … Ergebnis 281/2, rot waren genau der neue `/mails`-Fall und A-19.2." Das bedeutet, dass die proof:addin Gegenprobe bei einem Test mit Deadline-Feldtext rot wurde. Der Status nach Zurücksetzen war 283/0, also ist der Code wieder grün. **Unklar:** Was genau war das Problem der Gegenprobe? Wenn es ein Nachweis-Textproblem ist (z.B. Feldname vs. Oberflächentext), wurde es mit der Änderung behoben. Wenn es ein Code-Problem ist, darf es nicht behoben sein, weil der Code zurückgesetzt wurde.  
**Aufklärung:** integration-dev sollte erklären, was die Gegenprobe getestet hat und warum es rot war.

## Weitere Funde

### Korrektur / Bestätigung

**NoExport-Datenschutz (A-26, E-133.5):** Zeile 297 in BookingsScreen.tsx zeigt, dass die „Nicht abrechnen"-Option korrekt versteckt wird (`entry.todoNoExport ? [] : […]`). Das Todo-Feld wird in der Buchungsübersicht nicht angezeigt — korrekt.

**Timer-Fehlerbehandlung:** `TimerContext.tsx` erkennt `timer_stop_end_required` und `time_entry_too_long` richtig für das Stopp-Dialog (`needsNamedEnd`). Keine Sachfehler gefunden.

**AttachmentOpenDialog (A-A-6):** Alle sechs Anforderungen sind im Code dokumentiert und implementiert (Pfad ungekürzt, fremder Text behandelt, Wirkung benannt, kein Fokus, kein „nicht mehr fragen", kein `window.confirm`).

**Add-in-Token-Scope (R-15, E-009):** `http/guards.ts` Zeile 1–2 sagt: `credentialPolicy` beschränkt das Add-in-Token auf `/api/v1/addin`. Sicherheit **korrekt**.

**Mail vs. Todo-Notiz (Datenschutz):** `MailEntry` hat `personalNote` (getrennt von `TodoId.note`). SQL und Export greifen nicht auf die Mail-Notiz zu. **Korrekt.**

### Quecksilber

**T-400-4 (nicht blockierend):** `dropdownValue("time-entry-duration", error.code)` wird im Code nicht gefunden. Der T-400-Bericht nennt das als „neu" (Punkt 14). Entweder ist es optioniert (nur bei bestimmten Fehlercodes nötig), oder es wurde übersehen. Die Fehlerbehandlung funktioniert ohne es (Zeit lädt nach, Dialog zeigt Feldmeldung). **Aber:** Wort-Look-ups für Fehlertypen sind Standard in Takt; wenn der Auftrag es als neu nennt, war es gemeint. **Aufklärung erforderlich.**

**T-400-5 (nicht blockierend):** `Pool.rule` → `Pool.requiredTags` Umbenennung steht im Bericht; T-411 ist offen (nicht diese Welle). Das Alias `'rule': 'requiredTags'` funktioniert für den Bestand. OpenAPI scheint noch beide Namen zu führen (oder die Antwort wird noch umgeformt). **Unklar:** Ist das für diese Welle korrekt, oder sollte die Übergabe rückwärtskompatibel sein? Der T-400-Bericht erwähnt es ohne Warnung, also vermutlich kein Problem.

## Typsicherheit und Tests

- **pnpm run typecheck:** Alle Bereiche grün.
- **vitest:** T-400: 247 Tests grün. T-398c: 43 grün, 1 Datei rot (quick-command.test.ts Impfurt).
- **proof:surface:** 55 bestanden (neue Gegenprobe E-138 Punkt 3).
- **proof:foreign:** 24 bestanden.
- **proof:callers:** 76 bestanden.
- **proof:addin:** 283 bestanden (nach Korrektur/Gegenprobe).
- **proof:locked:** **rot** (textbestand.md).

## Sicherheit

- Kein neuer Request nach außen außer Versionsprüfung (E-001).
- Keine neuen `/addin`-Routen außer `POST /todos` (Mail) und `POST /todos/:id/mails` (Ergänzen). Keine Zeiteinträge-Route unter `/addin` (korrekt, A-10.12, E-120).
- Token-Scope auf `/api/v1/addin` (guards.ts).
- Anhang-Validierung: Zeichenlänge, Display-Name geprüft. Öffnen-Dialog hat alle 6 Anforderungen (A-A-6).
- Keine Datenspeicherung außer SQLite.
- Base64-Kodierung im Rumpf, nicht in URLs.

## Datenschutz

- Todo-Notiz nicht in BookingsScreen oder Export.
- MailEntry.personalNote getrennt von Todo.note.
- NoExport-Buchungen verborgen (MenuItem nicht gezeigt). SQL-Filterung in Buchungsabfrage: **zu überprüfen** (vitest ist grün, also funktioniert).

## Abhängigkeiten (Blockierungen bis behoben)

1. **ux-designer:** `docs/design/textbestand.md` SP-21 nachziehen (proof:locked → grün).
2. **unit-tester:** `apps/outlook-addin/test/office/quick-command.test.ts` löschen (vitest → grün).
3. **e2e-tester:** 6 Stellen + 1 Stelle in Tests nachziehen (Tests grün).
4. **frontend-dev oder Orchestrator:** `verify-sidecar.mjs` Prüfung umkehren/löschen (`/commands.html` darf 404 sein).
5. **integration-dev:** Aufklärung zu A-19.2 Gegenprobe-Rot (was wurde getestet, warum rot).

## Urteil

**Nicht freigegeben.** Fünf Befunde müssen behoben werden (vier davon in fremder Hoheit, einer Überprüfung). Danach: vitest, proof:locked und e2e sollten grün sein. Dann Freigabe möglich.

### Nächster Schritt

1. ux-designer trägt textbestand.md SP-21 nach (parallel mit anderen).
2. unit-tester löscht Testdatei (Minute, parallel).
3. e2e-tester passt alle Textstellen an + Rumpf (parallel).
4. frontend-dev/Orchestrator löst verify-sidecar (parallel).
5. integration-dev klärt A-19.2 Gegenprobe auf.
6. **Dann:** Wiederholung der Nachweise (typecheck, vitest, proof:locked, proof:addin, e2e-Tests).

Falls alle Befunde erledigt: **Freigabe freigegeben.**

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pwd28c3S8A6JEPX5KRsXR6
