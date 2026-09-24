Aufgabe: T-401 — Prüffälle zu T-388 und T-397 (Welle 18c)
Status: teilweise

Artefakte:
- apps/local-api/test/routes/addin/service.test.ts (komplett neu geschrieben)
- apps/local-api/test/usecases/time-entry-movement.test.ts (`todoNoExport` in der Attrappe ergänzt)
- apps/local-api/test/usecases/data-transfer.test.ts (Archivfassung 11 statt 10 gepinnt; neuer Prüffall Fassung 10/11/12)
- packages/storage/test/mappers.test.ts (`todoNoExport` in `toTimeEntry`)
- packages/domain/test/pool-rule-axes.test.ts (neu — T-090-Wache aus `proof-addin.mjs` verlagert)
- packages/domain/test/timer.test.ts (NaN-Sicherheit `decideOrphanedTimer`/`decideTimerStop`, 24-h-Grenze `exceedsMaximumDuration`)
- packages/domain/test/attachment.test.ts (`isAbsoluteAttachmentPath('\temp\datei.pdf')` ergänzt)
- packages/domain/test/windows-user.test.ts (neu — `userNameWithoutDomain`)
- packages/domain/test/pool-resolution-reason.test.ts (neu — `resolvePool.matchesNothingReason`)

Zusammenfassung: Die vier heute roten Stellen (`service.test.ts` gegen die engere `AddinUnit`
ohne `bookOnTodo`/`poolMovement`, `time-entry-movement.test.ts:134` und `mappers.test.ts` ohne
`todoNoExport`, `data-transfer.test.ts` mit Fassung 10 statt 11) sind behoben und grün, jeweils
mit nachgewiesenem Rot-Zustand vorher. Dazu kommen sieben neue Prüffälle aus den Vorschlägen von
T-388 (NaN-Sicherheit bei `earlierOf`/`decideOrphanedTimer`/`decideTimerStop`, die 24-h-Grenze
`exceedsMaximumDuration`) und T-397 (`isAbsoluteAttachmentPath`, `userNameWithoutDomain`,
`resolvePool.matchesNothingReason`, T-090-Wache verlagert, Archivfassung 10/11/12). Der
allergrößte Teil der in T-388 und T-397 vorgeschlagenen 22 Prüffälle ist **nicht** umgesetzt —
Grund siehe Risiken.

Prüfung:
- Rot vor grün nachgewiesen für alle vier Pflichtfixe: `git stash push` auf die vier Dateien,
  `vitest run` gegen den unveränderten Stand → 11 rot (`service.test.ts`: `bookOnTodo is not a
  function`, `poolMovement` undefined/Rest im Schlüsselvergleich), `git stash pop`, danach mit
  meinen Änderungen grün. `data-transfer.test.ts` und `mappers.test.ts` waren laut den Berichten
  T-397/T-388 bereits als rot benannt (Pins auf Fassung 10, fehlendes `todoNoExport`); nach der
  Korrektur grün.
- `tsc -p packages/domain/tsconfig.test.json`, `tsc -p packages/storage/tsconfig.test.json`,
  `tsc -p apps/local-api/tsconfig.test.json`: alle drei grün.
- `vitest run packages/domain packages/storage apps/local-api`: **1595 grün, 2 übersprungen,
  0 rot** (79 von 80 Dateien liefen, eine übersprungen — vorbestehend, nicht von mir berührt).
- `vitest run apps/outlook-addin`, `tsc -p apps/outlook-addin/tsconfig.test.json`: **nicht
  gefahren** — ich habe dort nichts geändert (Hoheit integration-dev/T-398b für die
  Grenzkonstanten) und wollte angesichts der Kostenlage keinen zusätzlichen Lauf ohne eigene
  Änderung starten.
- Nicht geprüft: `pnpm check` gesamt, `test:coverage` (Prozentzahl), e2e, Rust — nicht in meiner
  Hoheit bzw. nicht angefordert.

Annahmen:
1. **`service.test.ts` komplett neu statt Patch.** Die alte Datei testete ausschließlich
   `bookOnTodo` und `poolMovement` — beide Gegenstände sind gefallen (E-120, E-125 Punkt 1). Ein
   Flicken hätte nur noch Leichen übriggelassen; die neue Datei prüft `findMatches` in der
   heutigen, schmaleren Form und die **Abwesenheit** der gestrichenen Felder/Ports namentlich
   (`not.toHaveProperty('poolMovement')` etc.), wie im Auftrag verlangt.
2. **T-090-Wache verlagert, nicht kopiert.** `packages/domain/test/pool-rule-axes.test.ts` ist
   die neue alleinige Heimat der Prüfung „jede Achse der Domäne hat ein Feld auf der aufgelösten
   Regelseite" (T-398, Offene Frage 1). Ich habe **nicht** den Abschnitt 12 in
   `apps/outlook-addin/scripts/proof-addin.mjs` gestrichen — das ist integration-dev-Hoheit
   (`apps/outlook-addin/scripts/**`); der Kommentar dort verweist bereits auf diese Aufgabe.
3. **Fassung 11 statt 10 in den drei Pins plus die Abweisungstabelle.** `DATA_ARCHIVE_VERSION`
   steht seit T-397 auf 11 (`READABLE_VERSIONS = [1..11]`). Die Abweisungszeile „Fassung 11 — über
   der höchsten lesbaren" testete vor meiner Änderung eine inzwischen lesbare Fassung und wäre
   damit sachlich falsch geblieben, auch ohne dass `tsc`/`vitest` das anzeigen — ich habe sie auf
   12 gehoben.
4. **Neuer Archivtest deckt T-397-Vorschlag 7 ab**, aber nur den domänennahen Teil
   (`version_check_enabled`/`ui_language` über die Fassungsgrenze). Den vollen Fall aus dem
   Bericht („Fassung 10 wird mit … gelesen; Rundlauf mit Fassung 11 und false/en bleibt erhalten;
   Fassung 12 wird abgewiesen") habe ich in einem einzigen Testfall zusammengefasst statt in drei,
   weil die Fixtur (Sicherung erzeugen, Feldnamen entfernen, wieder einspielen) für alle drei
   Aussagen identisch ist.
5. Die neu geschriebenen bzw. stark veränderten Dateien sind komplett englisch benannt und
   kommentiert (E-118); an nur leicht berührten Dateien (`data-transfer.test.ts`,
   `time-entry-movement.test.ts`) habe ich die bestehende deutsche Sprache der Datei nicht
   angefasst, nur die neuen Zeilen sind englisch/deutsch gemischt nach demselben Muster wie die
   Datei selbst — die neuen `it`-Titel in `data-transfer.test.ts` sind deutsch, weil die ganze
   Datei durchgängig deutsch benannt ist; `timer.test.ts` und die drei neuen Dateien sind komplett
   englisch, weil ich sie neu geschrieben bzw. mit neuen `describe`-Blöcken versehen habe.

Risiken:
- **Massive Kostenüberschreitung während dieser Aufgabe** (System meldete wiederholt
  Sitzungskosten weit über dem üblichen Rahmen). Ich habe die Aufgabe deshalb nach den vier
  Pflichtfixen und einer kleinen, bewusst ausgewählten Teilmenge der 22 vorgeschlagenen neuen
  Prüffälle (7 von 22, alle reine Domänenfälle ohne Datenbank/HTTP) beendet, statt die volle Liste
  abzuarbeiten. **Nicht umgesetzt aus T-388:** Uhrversatz beim Import (offene Phase vor
  Zieluhr), Zuordnungsfenster 900 s, 24 h an den Speicher-/Dienst-Türen (nur die reine
  Domänenregel ist getestet, nicht `repo-time.ts`/`timer.ts`/`idle.ts` als Anwendungsfälle),
  Verdrängung, Verwaistendialog, `beginIdle`/`resolveIdle` als Anwendungsfälle,
  `rejectedTimeEntries`, U+202E je Namensspalte im Archiv, N-1 (fünf Pfade), `onError` ohne
  Meldungstext. **Nicht umgesetzt aus T-397:** Versionsprüfungsschalter (`isEnabled`), Migration
  0029 vorwärts/rückwärts, `PoolPort.reorder`, `requiredTags`/`rule`-Alias, Suche K-3/C22-03/
  C22-04, C-14-Filter, `EXIT_CODES`/A-28.10, Aufgabenbereich `.map` → 403, `quoteName`/
  `enumerateNames`. Das ist eine echte Lücke gegen den Auftrag, keine verdeckte — sie steht hier
  ausdrücklich, statt eine erfolgreiche Prüfung zu behaupten, die nicht stattgefunden hat.
- **Fund, nicht behoben (fremde Hoheit):** Die Ablehnungsmeldung in
  `apps/local-api/src/features/data-transfer/data-transfer.ts:278` lautet unverändert „Die Datei
  ist kein unterstütztes SuperTakt-Datenarchiv der Fassung 1 bis 10." — `READABLE_VERSIONS` steht
  aber seit T-397 auf `[1..11]`. Die Meldung nennt die falsche Obergrenze. Ich habe das nicht
  korrigiert (Produktivcode, nicht meine Hoheit) und auch keinen Prüffall gegen den Text der
  Meldung geschrieben, um ihn nicht künstlich festzuschreiben.
- Die neue Datei `packages/domain/test/pool-rule-axes.test.ts` und
  `apps/outlook-addin/scripts/proof-addin.mjs` prüfen jetzt denselben Sachverhalt doppelt, bis
  integration-dev Abschnitt 12 dort streicht (T-398 kündigt das bereits an). Kein Widerspruch,
  nur eine Übergangsredundanz.

Offene Fragen:
1. Soll ich in einer weiteren, eigenständigen Welle die restlichen 15 Vorschläge aus T-388/T-397
   nachziehen (insbesondere die Anwendungsfall-Ebene: `repo-time.ts` 24-h-Türen, Uhrversatz-Import,
   U+202E-Archiv, N-1, Versionsprüfungsschalter, Migration 0029, `PoolPort.reorder`, Suche,
   C-14, `EXIT_CODES`, `.map` → 403)? Das wäre der naheliegende nächste Schritt, sprengt aber
   offenbar erneut das Kostenbudget dieser Sitzung.
2. Die stale Fehlermeldung in `data-transfer.ts:278` („Fassung 1 bis 10") — an domain-dev zur
   Korrektur (T-397b oder Folgeauftrag)?
3. `vitest run apps/outlook-addin` habe ich nicht gefahren, weil ich dort nichts geändert habe —
   soll ich das nachholen, sobald T-398b/T-400a dort gelandet sind?

Nächster Schritt:
- Orchestrator entscheidet, ob die verbleibenden 15 T-388/T-397-Prüffallvorschläge in einer
  eigenen, budgetierten Folgewelle laufen (siehe Offene Frage 1).
- domain-dev: stale Fehlermeldung „Fassung 1 bis 10" in `data-transfer.ts:278` prüfen (Offene
  Frage 2).
- integration-dev (T-398b): Abschnitt 12 in `apps/outlook-addin/scripts/proof-addin.mjs`
  streichen, sobald `packages/domain/test/pool-rule-axes.test.ts` als alleinige Heimat der
  T-090-Wache akzeptiert ist.
