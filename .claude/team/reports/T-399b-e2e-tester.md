Aufgabe: T-399b — letzter bekannter e2e-Blocker aus T-400: Toast-Rumpf nach A-28.7 in manual-booking-movement.spec.ts
Status: fertig

Artefakte:
- tests/e2e/manual-booking-movement.spec.ts (Zeilen 149, 211, 277 plus Kopfkommentar und die drei erklärenden Zeilenkommentare direkt davor)

Zusammenfassung:
Die drei Toast-Erwartungen prüften noch den kurzen Rumpf „Gebucht: <Dauer>." exakt; seit A-28.7 (T-400, siehe `.claude/team/reports/T-400-frontend-dev.md` Punkt 5) hängt `stopMessage.ts` — dieselbe Funktion wie beim Timerstopp, jetzt auch von `BookingFormDialog.submit` beim Anlegen aufgerufen — zusätzlich die Zeile der Tagesgruppe mit ihrem gerundeten Exportwert an (`text.openThatDay`), bevor der Bewegungssatz folgt. Die drei Erwartungen sind auf den tatsächlichen, aus dem Code abgelesenen Wortlaut umgestellt; der Kopfkommentar der Datei beschreibt den neuen Aufbau des Rumpfs.

Herleitung je Fall (kein Raten, Quellen: `apps/web/src/features/timer/stopMessage.ts`, `apps/web/src/features/timer/texts.ts`, `apps/web/src/lib/format.ts`, `apps/web/src/app/dayGroup.ts`, `packages/domain/src/rounding.ts`, Standard-Rundungsmodus `up` aus `packages/storage/migrations/0002_seed_defaults.up.sql`):
- Fall 1 (erste Buchung, 45 Min., Leistungstext vorhanden): Tagesgruppe = genau diese eine Buchung, `insight.seconds` = 2700 s → `formatDuration` „0:45 h"; `quarters = ceil(2700/900) = 3` → `formatQuarters(3)` = „0,75". Bewegung ist nicht `null` → Bewegungssatz bleibt am Ende. Neuer Rumpf: `Gebucht: 0:45 h. An diesem Tag sind für dieses Todo 0:45 h offen — das ergibt beim Export 0,75. ${expected}`.
- Fall 2 (Gegenprobe, bereits offene Vorbuchung 20 Min. + neue Buchung 15 Min., beide mit Leistungstext): `insight.seconds` = 1200 + 900 = 2100 s → „0:35 h"; `quarters = ceil(2100/900) = 3` → „0,75". `poolMovement` ist `null` → kein Bewegungssatz. Neuer Rumpf: `Gebucht: 0:15 h. An diesem Tag sind für dieses Todo 0:35 h offen — das ergibt beim Export 0,75.`.
- Fall 3 (erledigtes Todo, 30 Min., Leistungstext vorhanden): `insight.seconds` = 1800 s → „0:30 h"; `quarters = ceil(1800/900) = 2` → „0,50". `poolMovementSentence(..., 'booking')` liefert `null` (nur `appears`, kein `enters`/`leaves`) → kein Bewegungssatz. Neuer Rumpf: `Gebucht: 0:30 h. An diesem Tag sind für dieses Todo 0:30 h offen — das ergibt beim Export 0,50.`.
- `blockedReason` ist in allen drei Fällen `null`: die einzige Sperrursache ist `empty_note` (`apps/web/src/api/types.ts`), und jede Buchung in den drei Gruppen trägt einen Leistungstext.

E-087-Suche (git grep + roher Lauf über tests/, apps/*/test, apps/*/src, packages/*/src; Bauergebnisse ausgeschlossen), Ergebnis: Der alte Rumpf-Wortlaut „Gebucht: " als vollständiger Toast-Body wird ausschließlich in diesen drei Zeilen derselben Datei geprüft. Kein weiterer Fund in versionierten oder unversionierten Quelldateien.

Prüfung:
- `npx tsc -p tests/e2e/tsconfig.json --noEmit` — grün, Exit-Code 0, keine Ausgabe.
- Nicht ausgeführt: `pnpm test:e2e` selbst (kein laufender lokaler Dienst/Vite-Server in dieser Umgebung angefahren, Auftrag verlangte nur die Typprüfung). Die drei betroffenen Fälle sind damit nicht gegen den echten Dienst gelaufen — offen für den nächsten echten e2e-Lauf.

Annahmen:
- Der Standard-Rundungsmodus `up` gilt unverändert für die reale Datenbank, mit der `manual-booking-movement.spec.ts` läuft: kein Test in `tests/e2e/**` setzt `roundingMode` über die echte API um (einzige Fundstelle `unified-export.spec.ts` mockt die Route vollständig und berührt den echten Dienst nicht).
- Die drei Buchungen bleiben, wie im bestehenden Testaufbau, am selben Kalendertag wie „jetzt" (Zeiten nur wenige Stunden zurückgesetzt); daran habe ich nichts geändert.

Risiken: keine neuen. Die Anpassung ist rein erwartungsseitig (Testdatei), keine Änderung an Produktivcode oder Fixtures.

Offene Fragen: keine.

Nächster Schritt: Diese Datei bei nächster Gelegenheit gegen den echten lokalen Dienst laufen lassen (`pnpm test:e2e`), um die abgelesenen Erwartungen auch praktisch zu bestätigen — in dieser Umgebung nicht möglich.
