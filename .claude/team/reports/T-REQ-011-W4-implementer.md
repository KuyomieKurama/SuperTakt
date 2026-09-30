Aufgabe: REQ-011 W4 — Textabbau Todo/Timer/Export/Einstellungen, ST-11
Status: fertig
Artefakte: apps/web/src/features/{todos,timer,export,settings}/**, apps/web/src/styles/app.css, apps/web/test/features/textBundlesParity.test.ts, docs/design/textbestand.md
Zusammenfassung: Wiederholte Einleitungen und zustandsferne Hinweise wurden in Todo-, Timer-, Export- und Einstellungsflächen entfernt oder gekürzt. Gruppierung sowie Daten- und Timer-Hinweise sind als zugängliche InfoHints erreichbar; Sicherheits-, Folge- und Sperrlistentexte bleiben erhalten. ST-11 dokumentiert die Schlüssel; ein Web-Unit-Test prüft, dass jede Feature-Sprachdatei die englische Fassung als typeof der deutschen Fassung typisiert.
Prüfung:
- E-087 Wortlautsuche vor der Änderung: 24 Kandidaten; git grep in tests/** und apps/*/test/** je Kandidat 0 Treffer, Arbeitsbaum-Suche unter denselben Wurzeln (ohne node_modules, dist, build, taskpane, test-results) je Kandidat 0 Treffer.
- pnpm typecheck: grün.
- pnpm exec vitest run apps/web/test: grün, 22 Dateien und 253 Tests.
- pnpm --filter @takt/web contrast: grün, 0 von 522 Paaren durchgefallen; 11 von 11 Gegenproben bestanden.
- pnpm proof:all: grün; unter anderem proof:locked und proof:addin, zuletzt 283 bestanden, 0 fehlgeschlagen.
- PLAYWRIGHT_BROWSERS_PATH=/work/.ms-playwright pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/timer-prompt-setting.spec.ts tests/e2e/no-evidence.spec.ts tests/e2e/export-end-to-end.spec.ts tests/e2e/attachment-crud.spec.ts: grün, 6 Tests.
- settings-structure.spec.ts wurde zusätzlich versucht und scheitert reproduzierbar außerhalb der Änderung: PoolAdministration.tsx ruft describeRule mit einem unvollständigen Regelwert auf (poolRule.ts:37, undefined.length); erwartete Überschrift Regeln erscheint deshalb nicht.
Annahmen: Der durch TypeScript erzwungene Typ const en: typeof de ist die verlässliche Gleichheitsprüfung der DE-/EN-Schlüsselmengen; der ergänzte Test prüft diese Bauform für alle Feature-texts.ts. Der geschützte Frist-Satz deadlineCardLead blieb unverändert, da Sperrlistentexte ausdrücklich unantastbar sind.
Risiken: Die Daten- und Timer-Erklärungen liegen jetzt hinter bewusst ausgelösten InfoHints. Der nicht von dieser Änderung verursachte E2E-Fehler settings-structure.spec.ts bleibt offen.
Offene Fragen: Der Auftrag verlangt zugleich, Sperrlistentexte nicht anzufassen, und den als SP-05 markierten Frist-Satz zu kürzen. Die Umsetzung hat die stärkere Sperrlistenregel befolgt; falls eine Ausnahme gemeint ist, muss sie explizit freigegeben werden.
Nächster Schritt: Abhängige Gesamtverifikation W5 freigeben.