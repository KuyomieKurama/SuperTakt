Aufgabe: T-260 — `apps/web/test/` an die neue Struktur angleichen
Status: fertig

Artefakte:
- Verschoben (Importe/Pfade nachgezogen):
  - `apps/web/test/lib/exportTemplateModel.test.ts` → `apps/web/test/features/export/exportTemplateModel.test.ts`
  - `apps/web/test/screens/templatesScreenBeginCopy.test.ts` → `apps/web/test/features/export/templatesScreenBeginCopy.test.ts`
  - `apps/web/test/idle.test.ts` → `apps/web/test/features/timer/idle.test.ts`
  - `apps/web/test/app/undoDone.test.ts` → `apps/web/test/features/todos/undoDone.test.ts`
  - `apps/web/test/lib/startupAppearance.test.ts` → `apps/web/test/public/startupAppearance.test.ts`
  - `apps/web/test/components/dismissLabel.test.ts` → `apps/web/test/shared/ui/dismissLabel.test.ts`
  - `apps/web/test/components/touchedCallSiteNeutrality.test.ts` → `apps/web/test/shared/ui/touchedCallSiteNeutrality.test.ts`
  - `apps/web/test/components/liveRegionsAlwaysRendered.test.ts` → `apps/web/test/liveRegionsAlwaysRendered.test.ts` (Wurzel — Begründung unten)
  - Leere Ordner `apps/web/test/screens/`, `apps/web/test/components/`, `apps/web/test/app/` entfernt.
- Wortlaut in Prüffalltiteln nachgezogen (E-087 vorab geprüft, s. u.):
  - `apps/web/test/liveRegionsAlwaysRendered.test.ts:118` — `"SettingsScreen.tsx — …"` → `"ExportSettings.tsx — …"`
  - `apps/web/test/liveRegionsAlwaysRendered.test.ts:142` — `"TemplateFields.tsx — …"` → `"TemplateFieldRow.tsx — …"` (der von frontend-dev gemeldete Fall)
- Stale Pfadangaben in Kopf-/Inline-Kommentaren korrigiert (Gegenwartsaussagen über den aktuellen Ort einer Datei, keine Historie — Details unten):
  - `apps/web/test/lib/errorText.test.ts` (2 Stellen: `apps/local-api/src/usecases/tag-names.ts` → `apps/local-api/src/tag-names.ts`)
  - `apps/local-api/test/usecases/time-entry-movement.test.ts` (`apps/local-api/src/usecases/timer.ts` → `apps/local-api/src/features/timer/bookings.ts`)
  - `apps/local-api/test/usecases/timer-orphan-resolution.test.ts` (`usecases/timer.ts` → `features/timer/timer.ts`)
  - `apps/local-api/test/usecases/pool-movement.test.ts` (Kopfzeile: `usecases/pool-movement.ts` → `pool-movement.ts`)
  - `packages/domain/test/timer.test.ts` (`usecases/pool-movement.ts` → `pool-movement.ts`)
  - `packages/storage/test/repo-export.test.ts` (`usecases/export.ts` → `features/export/export.ts`)
- Läufe: `pnpm test:coverage` (88 Dateien, 1570 bestanden, 3 übersprungen — zeichengleich zum Ausgangswert, zweimal gemessen: vor und nach den Kommentarkorrekturen), `pnpm typecheck` (Exit 0, alle Pakete inkl. `apps/web/tsconfig.test.json` und `apps/local-api/tsconfig.test.json`).

Zusammenfassung:
`apps/web/test/` trägt jetzt dieselbe Gliederung wie `apps/web/src/`: `features/{export,timer,todos}/`, `shared/ui/`, `lib/`, `public/`, plus die eine bewusste Ausnahme `liveRegionsAlwaysRendered.test.ts`, die an der Wurzel bleibt, weil ihr Gegenstand über vier Dateien aus drei verschiedenen Verzeichnissen streut (`features/settings`, `showcase`, `features/export` — zweimal) und keine einzelne Unterordner-Zuordnung ehrlicher wäre als die bisherige falsche. Bei jeder Verschiebung wurden ausschließlich Importpfade, `path.resolve(__dirname, …)`-Aufrufe und `new URL(…)`-Basen an die neue Verzeichnistiefe angepasst — keine Zusicherung, kein Prüffall gestrichen oder hinzugefügt. Zwei Prüffalltitel benannten ihren Gegenstand beim alten Dateinamen (`SettingsScreen.tsx` statt `ExportSettings.tsx`, `TemplateFields.tsx` statt `TemplateFieldRow.tsx`) und wurden nachgezogen, nachdem ich am Quelltext bestätigt habe, dass die `role="status"`/`role="alert"`-Stelle tatsächlich in der neu benannten Datei liegt und nicht mehr in der alten. Im zweiten Teil der Aufgabe (Hoheit `packages/*/test/**`, `apps/*/test/**`) habe ich sechs weitere, echte Gegenwartsaussagen über nicht mehr existierende `usecases/`-Pfade gefunden und korrigiert — diese unterscheiden sich klar von den vier historischen Kommentaren, die domain-dev bewusst stehen ließ.

Annahmen:
- **`liveRegionsAlwaysRendered.test.ts` bleibt ohne Feature-Unterordner.** Sein Gegenstand ist strukturell nicht auf einen Ort reduzierbar (vier AST-Prüfungen gegen `features/settings/ExportSettings.tsx`, `showcase/ExportDirectorySection.tsx`, `features/export/ExportDirectoryField.tsx`, `features/export/TemplateFieldRow.tsx`). Eine erzwungene Einordnung in einen dieser vier Ordner wäre so falsch wie die alte `components/`-Zuordnung. Wurzel-Ebene neben `lib/`, `features/`, `shared/`, `public/` ist die ehrlichste Option.
- **`dismissLabel.test.ts` liegt unter `shared/ui/`, nicht unter `app/`.** Der Dateikopf nennt zwei Gegenstände: `shared/ui/Primitives.tsx` (die stärkere, echte Funktionsaufruf-Prüfung, Fall 1) und `app/ToastContext.tsx` (die schwächere Quelltext-Übereinstimmung, Fall 2, laut Dateikopf ausdrücklich als schwächerer Wächter benannt). Bei geteiltem Gegenstand habe ich mich für den primären/stärkeren Fall entschieden.
- **`exportTemplateModel.test.ts` und `startupAppearance.test.ts`** wurden wie im Auftrag benannt aus `lib/` herausgezogen: ersteres zu `features/export/` (Gegenstand `src/features/export/exportTemplateModel.ts`), zweites zu `public/` (Gegenstand ist `apps/web/public/startup-appearance.js`, nicht irgendeine `src/lib`-Datei — der Import blieb unverändert, weil beide Ordner gleich tief unter `test/` liegen).
- **Kommentar-Wortlaut: historisch vs. Gegenwartsaussage.** Ich habe konsequent unterschieden zwischen Sätzen in Vergangenheitsform, die beschreiben, wo eine Datei zum Zeitpunkt ihrer Entstehung lag oder was dort damals fehlte (`„entstand mit T-168 und hatte …"`, `„hatte keinen einzigen Prüffall"`, `„Bis T-101 überschrieb …"`, `„git show HEAD:apps/web/src/screens/TemplatesScreen.tsx"`) — diese sind Wortlaut über Geschichte und bleiben unangetastet, dieselbe Bauart wie das bereits akzeptierte „Rot vor Grün"-Muster in `templatesScreenBeginCopy.test.ts` — und Sätzen in Gegenwartsform, die einen **aktuellen** Ort behaupten (`„rechnet das über …"`, `„steht dort HINTER …"`, `„stammt aus …"`, `„verwendet sie als …"`, `„ohne den X.ts … zu benötigen"`). Die zweite Gruppe war schlicht falsch (der referenzierte `usecases/`-Pfad existiert nicht mehr) und wurde auf den heutigen Pfad korrigiert. Das sind keine Zusicherungen und keine Prüffalltitel — bloße Modul-Standortangaben in Prosa, dieselbe Kategorie, die frontend-dev bereits in `undoDone.test.ts` Zeile 2 angepasst hat (`apps/web/src/app/undoDone.ts` → `apps/web/src/features/todos/undoDone.ts`, vor meinem Eingriff schon erledigt).
- **Die vier von domain-dev gemeldeten, stehen gelassenen Kommentare** (`attachment-input-validation.test.ts:10`, `image-sweep.test.ts:9`, `pool-movement.test.ts:4`, sinngemäß auch `time-entry-movement.test.ts` vor meiner Korrektur der Gegenwartsaussage) sind — bis auf die eine Gegenwartsaussage in `time-entry-movement.test.ts`, die ich korrigiert habe — durchweg Vergangenheitsform und bleiben unverändert.

Risiken:
- Keine sicherheitsrelevanten Funde. Alle Änderungen sind Kommentartext, Importpfade und Dateiorte; keine Testdaten mit echten Call-Nummern, Kundennamen oder Zugangsdaten berührt.
- `packages/storage/test/not-billed-audit.test.ts` zeigt eine unstaged Änderung, die nicht von mir stammt (Windows-`.pathname`-Falle, `import.meta.dirname` statt `new URL(...).pathname`) — nicht angefasst, nur zur Kenntnis genommen, damit sie nicht fälschlich mir zugeschrieben wird.

Offene Fragen an den Orchestrator:
1. `tests/e2e/pool-movement-sentence.spec.ts:7` trägt dieselbe Art Gegenwartsfehler wie die von mir korrigierten lokalen Dateien: `apps/local-api/src/usecases/pool-movement.ts` (heute `apps/local-api/src/pool-movement.ts`) und `apps/web/src/app/TimerContext.tsx` (heute `apps/web/src/features/timer/TimerContext.tsx`). Das liegt in `tests/e2e/**`, wo laut Auftrag gerade e2e-tester arbeitet — ich habe es **nicht** angefasst und melde es nur.
2. Die „Regel, die über allem steht" (Untergrenze mit Gegenprobe bei Mengen-Urteilen über eine leere Menge) habe ich gegen alle in dieser Aufgabe verschobenen/bearbeiteten Dateien geprüft: Keine davon urteilt über eine ungeprüfte Menge (alle `toHaveLength`-Aufrufe in den AST-Prüffällen nennen exakte, erwartete Zahlen). Die vier im Auftrag erwähnten „still grünen" Wächter über leere Mengen habe ich in den von mir bearbeiteten Dateien nicht gefunden — falls sie andernorts unter meiner Hoheit liegen, brauche ich einen genaueren Hinweis (Dateiname oder Board-Eintrag), um gezielt zu suchen, statt den ganzen Testbaum pauschal zu durchsuchen.

Nächster Schritt: Code-Reviewer und Spec/UX-Reviewer können auf dem jetzigen Stand freigeben; der offene Punkt 1 oben (`tests/e2e/pool-movement-sentence.spec.ts`) sollte an e2e-tester weitergereicht werden, sobald dessen laufende Welle abgeschlossen ist.
