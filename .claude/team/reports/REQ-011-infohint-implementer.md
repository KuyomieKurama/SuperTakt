Aufgabe: REQ-011 W1 — InfoHint nach shared/ui heben
Status: fertig
Artefakte: apps/web/src/shared/ui/InfoHint.tsx; apps/web/src/features/export/ExportScreen.tsx; .claude/team/reports/REQ-011-infohint-implementer.md
Zusammenfassung: InfoHint wurde unverändert von features/export nach shared/ui verschoben. ExportScreen importiert den Baustein nun aus shared/ui; die neutralen CSS-Klassennamen info-hint__trigger und info-hint__content blieben unverändert, da sie nicht exportspezifisch sind.
Prüfung: pnpm typecheck erfolgreich. pnpm boundaries erfolgreich. pnpm --filter @takt/web contrast erfolgreich (0 von 522 Kontrastpaaren durchgefallen; 11 von 11 Gegenproben). pnpm test erfolgreich (132 Testdateien bestanden, 1 übersprungen; 2112 Tests bestanden, 2 übersprungen). pnpm proof:foreign erfolgreich (24 bestanden). pnpm proof:locked erfolgreich (9 bestanden). pnpm proof:all lief bis proof:callers; codepoints, migrations und openapi waren erfolgreich, danach erwarteter vorbestehender Fehlschlag wegen createTodo.noEvidence und updateTodo.noEvidence ohne Web-Aufrufer. Dies gehört zum nachfolgenden UI-Auftrag und wurde nicht verändert.
Annahmen: Die neutralen Klassennamen dürfen an ihrer bestehenden Stelle in app.css bleiben; der Auftrag verlangt nur bei exportspezifischer Benennung eine Umbenennung.
Risiken: Keine Verhaltensänderung. Weitere Merkmale können InfoHint jetzt direkt aus shared/ui importieren; es gibt weiterhin nur die vier bisherigen Export-Nutzungen.
Offene Fragen: Keine.
Nächster Schritt: Den nachfolgenden UI-Auftrag freigeben; er ergänzt die erwarteten noEvidence-Web-Aufrufer und beseitigt damit den vorbestehenden proof:callers-Befund.
