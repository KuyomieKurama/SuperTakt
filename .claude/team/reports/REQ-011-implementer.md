Aufgabe: REQ-011 W1 — Flag noEvidence: Migration 0031, Domain, Storage, API, Spez. A-26.5ff
Status: fertig
Artefakte: Migration 0031; Domain-, Storage-, API- und OpenAPI-Verträge; Datenarchivfassung 13; Spezifikation und Datenmodell; gezielte Tests
Zusammenfassung: `noEvidence` ist ein unabhängiges Todo-Flag mit SQLite-Default false und TimeEntry-Spiegel `todoNoEvidence`. Das Flag verändert weder Exportfilter noch Zeitbuchungen; Archive vor Fassung 13 erhalten false. OpenAPI und API akzeptieren das Flag beim Anlegen und Ändern.
Prüfung: `pnpm typecheck` erfolgreich. Storage: 31 Dateien/475 Tests erfolgreich. Domain: 22 Dateien/753 Tests erfolgreich. API-Zieltests: 2 Dateien/42 Tests erfolgreich. `pnpm proof:migrations` erfolgreich. `pnpm proof:openapi` erfolgreich (114 bestanden, 0 fehlgeschlagen).
Annahmen: Ungültige Zod-Werte werden projektweit mit HTTP 422 validiert; der neue API-Test misst deshalb 422 statt der im Auftrag genannten 400. Das wurde am bestehenden `validation_error`-Vertrag verifiziert.
Risiken: Die Down-Migration entfernt gesetzte `no_evidence`-Markierungen. Vor einem Downgrade ist eine Sicherung nötig.
Offene Fragen: Keine.
Nächster Schritt: Review-Kindtask t_ef3d4ef0 nach dem Abschluss dieses Tasks ausführen.
