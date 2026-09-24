Aufgabe: T-406a — Sicherheitsfreigabe Dienst- und Add-in-Teil von Welle 18 (T-388, T-389, T-397, T-397a, T-397b, T-398, T-398b, T-401, T-401c)
Status: fertig (Urteil: Nacharbeit, zwei Punkte)
Artefakte:
- docs/bedrohungsmodell.md — neuer Nachtrag „Prüfung T-406a“ am Dateiende (hinter T-409b); im Nachtrag Outlook-Mail-Zuordnung „fünf Add-in-Routen“ datiert auf vier berichtigt
- .claude/team/reports/T-406a-security-checker.md — dieser Bericht

Zusammenfassung: Geldpfad, onError, C-22, Add-in-Rückbau, Weigerungsregel und Aufgabenbereich sind freigegeben; R-34, R-35, R-36 und R-37 dürfen aus Sicherheitssicht geschlossen werden. Nacharbeit an zwei Stellen: Ein eingespieltes Archiv schaltet die Versionsprüfung ohne jede Warnung ab (N-5, mittel), und die Namensprüfung im Archiv prüft den getrimmten Wert, übernimmt aber den ungetrimmten (N-2, niedrig).

Urteile je Punkt:
1. Geldpfad — freigegeben. R-34/R-35/R-36 schließbar. Rest N-3 (niedrig): `timestampSchema` prüft nur die Form; `2026-01-32T00:00:00Z` führt bei POST/PATCH `/time-entries` zu 500 statt 422 (nichts gebucht), `2026-02-31T00:00:00Z` wird als nicht kanonischer Text gespeichert. Gegenmittel: `isExactTimestamp` in `timestampSchema`; CHECK `ended_at IS NULL OR duration_seconds IS NOT NULL`. E-127 hinnehmbar.
2. Archiv — Nacharbeit. Namensverzeichnis vollständig (11 Spalten), U+202E → 422. N-2: `isValidArchivedName` trimmt vor Länge und Zeichenprüfung; gemessen gelangen `U+FEFFKunde`, `Kunde\n\n\t`, `U+2028Kunde` und 5 000 führende Leerzeichen mit 200 und ohne Warnung unverändert in `tag.name`. Gegenmittel: auf dem ungetrimmten Wert prüfen und `value !== value.trim()` abweisen (verlustfrei für eigene Archive). Dazu: Die Abweisungsmeldung in `data-transfer.ts:278` nennt noch „Fassung 1 bis 10“. N-1 freigegeben (Form vor Dateisystem, auch `\\?\UNC\`); Rest niedrig: `sync_folder`/`system_dir` werden übernommen.
3. `app.onError` — freigegeben, genau nach der Bedingung aus T-394; Nachweis `proof:route-policy` Abschnitt 9 und `on-error-message-scrub.test.ts`.
4. A-28.1 — Nacharbeit. Schalter selbst freigegeben (vor jedem Durchgang gefragt, auch beim Start; werfend oder fehlend = aus; `source.latest` nur hinter dem Tor). Mit Sitzungsgeheimnis umschaltbar: keine neue Fähigkeit. N-5 (mittel): Archiv mit `version_check_enabled = 0` → 200, `warnings: []`, danach `versionCheckEnabled: false`, `/version-check` `unknown`. Das ist die Bauart aus R-30. Gegenmittel, verträglich mit A-28.1: Warnung in der Importzusammenfassung, wenn das Archiv die hier eingeschaltete Prüfung ausschaltet.
5. C-22 — freigegeben. Nur Kennzeichen aus SQL, Vermerkstext nicht im JSON (gemessen), reine Sitzungsroute. Ein Treffer „im Vermerk“ ist ein Teilzeichenketten-Orakel, aber derselbe Aufrufer liest den Vermerk ohnehin über `GET /todos/{id}/note`.
6. Add-in-Rückbau — freigegeben. `AddinUnit` ohne `clearDone`, `timeEntries.create`, `resolveAxes`; `poolMovement` weg. Die Mail-Zuordnung nutzt den vollen `UnitOfWork` (Enge nur im Quelltext), berührt aber keine Zeit, keinen Timer, kein Erledigt; getragen durch die Rundfahrt in `proof:addin`. A-A-71 nachgezogen: es sind **vier** Routen (context, todo-matches, todos, todos/:todoId/mails), nicht drei wie im Auftrag. Von den vier Pfaden aus A-A-71 bleiben drei, die Mail-Route kam mit A-10.11 dazu.
7. Weigerungsregel — freigegeben. W-1…W-14 an Quelltext und Ausgabe nachgelesen; kein Nachweisskript startet mehr `src/index.ts`, keine GitHub-Anfrage aus Prüfläufen; `TAKT_PROOF_PORT` nur unter `scripts/`.
8. Aufgabenbereich 17844 — freigegeben. Fristen wie 17843, `.map` → 403 (Groß-/Kleinschreibung egal), `build-taskpane.mjs` filtert `.map`.

Prüfung:
- Mit `TAKT_PROOF_PORT=20843`, alle Exit 0: proof-access 123/0, proof-export 100/0, proof-export-api 75/0, proof-taskpane 33/0, proof-route-policy 59/0, proof-release-safety 158/0, proof-layers 58/0.
- vitest über 11 Dateien (24h, idle-recovery-window, name-directory, export-directory-n1, on-error, checker, taskpane-map, search, addin/service, data-transfer, domain timer): 137/138 grün. Der eine Fehlschlag (`checker.test.ts`, T-279 „werfende Zufallsquelle“) trat nur unter Parallellast auf; dreimal einzeln 31/31 grün. Zeitabhängig und unbeständig, kein Sicherheitsbefund; an unit-tester zur Kenntnis.
- Meßsonden am echten Zusammenbau (`compose()` + `app.request()`, Kritzelverzeichnis `t406a/`): 24-h-Grenze, unlesbare und Überlauf-Zeitstempel, PATCH, Suche, Schalter per PATCH und per Archiv, vier Namensformen im Archiv.
- Gleichlauf `Date.parse` ↔ SQLite `unixepoch` an zehn Grenzformen: identisch.
- Semgrep (p/default, p/typescript, p/nodejs, p/secrets; WARNING+ERROR) über 81 geänderte/neue Quelldateien: 0 ERROR, 9 WARNING `detect-non-literal-regexp`, alle in Nachweisskripten mit festen Mustern — kein Befund.
- Neue Prüfdateien auf Call-Nummern, Adressen, Geheimnisse gesucht: kein Treffer.
- Nicht geprüft: `proof:addin` (nach E-130 rot bis T-398c/T-400a, dort nicht gefahren); Windows und macOS (N-1 unter Windows, W-10/W-14 dort) nur gelesen; 42Crunch nach E-120 (T-B06) geschlossen; Oberfläche (T-406b).

Annahmen:
- „Von vier auf drei Routen“ im Auftrag lese ich als „die Buchungsroute fällt aus der Menge von A-A-71“. Gemessen sind es vier Routen, und so steht es im Bedrohungsmodell.
- Die Nachträge schreibe ich deutsch (E-124 Punkt 10).
- Den parallelen Nachtrag T-409b am Dateiende habe ich nicht angefaßt und meinen dahinter gesetzt.

Risiken:
- N-5 (mittel): Bis zur Nacharbeit kann ein präpariertes oder fremdes Archiv Hinweise auf Sicherheitsbehebungen dauerhaft unterdrücken, ohne daß das Einspielen es sagt.
- N-2 (niedrig): Umbrüche, BOM und überlange Leerraumränder in Namen aus dem Archiv; Export ist JSON und maskiert, Wirkung klein.
- N-3 (niedrig): 500 statt 422 bei unmöglichen Kalenderdaten; nicht kanonische Zeitstempel im Bestand.

Offene Fragen:
1. Vorschlag für `risks.md` (Orchestrator): R-34, R-35, R-36, R-37 schließen (Sicherheitssicht; übrige Freigaben laut Qualitätstor). Neu: R-38 „Ein Archiv schaltet die Versionsprüfung still ab“ (N-5, mittel, domain-dev) oder als Nachtrag an R-30. N-2 und N-3 als niedrige Einträge oder direkt als Auftrag.
2. Soll N-1 auch `sync_folder`/`system_dir` verwerfen? E-124 Punkt 9 nennt nur UNC/Netz.

Nächster Schritt: domain-dev (Folgeauftrag): N-5 Warnung beim Einspielen, N-2 Prüfung auf dem ungetrimmten Wert, Meldung „1 bis 11“, N-3 `isExactTimestamp` an `timestampSchema`; unit-tester je ein Prüffall (Archiv mit `version_check_enabled = 0` trägt die Warnung; vier Namensformen → 422; `2026-01-32` → 422). Danach Wiedervorlage bei mir. T-406b prüft, ob die Einstellungen „Versionsprüfung ausgeschaltet“ sichtbar machen.

Nachtrag zu T-412 (auf Auftrag des Orchestrators):
- Fehlende `app_setting`-Zeile gilt als „an“: **bestätigt** gegen R-30 und A-28.1. Das ist eine Verbesserung. Gemessen ist der Fall erreichbar: Ein Archiv mit `app_setting: []` wird mit 200 und ohne Warnung eingespielt. Vor T-412 war das ein zweiter stiller Ausschalter über das Archiv; jetzt fragt der Dienst weiter.
- **N-6 (mittel, neu):** Nach diesem Import antwortet `GET /settings` mit 500, die Einstellungen sind unbenutzbar. Gegenmittel: `parseArchive` verlangt genau eine `app_setting`-Zeile mit `id = 1`. Zuständig domain-dev.
- `takt_fold`: **freigegeben.**
  - `directOnly` hält Trigger, Sichten und Indizes fern.
  - Die Funktion wirft nicht und kommt weder an Dateisystem noch Netz.
  - Erst falten, dann maskieren; gemessen: Umlaute groß und klein sowie in zerlegter Form werden gefunden, `%` trifft nur wörtlich, `_` und `\` treffen nichts.
  - Die Funktion steht in keinem Index, eine andere ICU-Fassung kann also keinen Bestand verderben.
  - Rest, niedrig: Kosten je Zeile nicht gemessen. `engines.node >=22.5` ist zu niedrig für `DatabaseSync.function` (ab 22.13); Anheben ist Sache des Orchestrators.
- Urteil Punkt 4 bleibt **Nacharbeit**: N-5 wie oben, dazu N-6.
