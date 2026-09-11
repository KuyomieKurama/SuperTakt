Aufgabe: T-277 — TP-VER-07 im Prüfplan friert einen behobenen Fehler ein
Status: fertig
Artefakte:

- `docs/testplan.md` (geändert — TP-VER-07, Zeilen ca. 3276-3336, vollständig neu gefaßt)
- `.claude/team/reports/T-277-e2e-tester.md` (dieser Bericht)

Zusammenfassung: TP-VER-07 nagelte mit „genau einen Aufruf für den gesamten Lauf" dieselbe alte
Lesart von A-18.11 fest, die security-checker unter A-V-11 im Bedrohungsmodell berichtigen mußte
(T-275, T-275-5) — eine Meßvorschrift, die die T-273-Behebung ab heute als Verstoß gemeldet hätte.
Der Fall ist jetzt in der von A-V-11′ verlangten Form gegen die Uhr statt gegen eine feste Zahl
gefaßt: Teil a) hält den bisherigen, richtigen Kern fest (innerhalb des Mindestabstands genau ein
Aufruf), Teil b) ist neu und verlangt den zweiten, späteren Aufruf im selben Prüflauf samt dem vom
Auftraggeber gemeldeten Fall (Erfolg nach Fehlschlag ohne Neustart). Beide der von A-V-11′
verlangten Gegenproben sind ausdrücklich benannt (nicht neu plant → Teil b rot; sofort neu
versucht → Teil a rot). Kein Prüffall wurde abgeschwächt — nur die Zahl, die die alte Lesart
festschrieb, ist gefallen.

Geändert wurde ausschließlich `docs/testplan.md`; der beschriebene Fall selbst liegt außerhalb
meiner Hoheit in `apps/local-api/test/version/checker.test.ts` (unit-tester) und ist dort laut
T-274-Bericht bereits umgesetzt und gemessen (13/13 grün gegen den gebauten Stand, 4 von 5 rot
gegen den alten Stand). Der Eintrag hier schreibt jetzt vor, was jener Fall zu treffen hat, statt
ihn zu verdoppeln.

## Nachprüfung TP-VER-10 bis TP-VER-13 (nicht angefaßt, aber wie verlangt selbst gemessen)

`tests/e2e/playwright.version-check.config.ts` einzeln gefahren (nicht über `pnpm test:e2e`),
Ports 5173/17843/17844 vor dem Lauf frei (geprüft über `netstat`), Ergebnis in derselben Runde:

```
Running 5 tests using 1 worker
✓ TP-VER-10 — der Dialog nennt installierte und verfügbare Fassung … (1.9s)
✓ TP-VER-11 — „Überspringen" bleibt stumm über geleerten Browserspeicher und einen echten
  Neustart des Dienstes (13.4s)
✓ TP-VER-12 — eine später erschienene, höhere Fassung meldet sich trotz Überspringens (11.2s)
✓ TP-VER-13 — „Installieren" öffnet die Release-Seite und lädt nichts herunter (1.0s)
✓ E-077 — ohne installedVersion bleibt der Dialog aus, obwohl der Dienst eine neuere Fassung
  kennt (462ms)
5 passed (51.8s)
```

Kein hängender Prozeß danach (`netstat` erneut geprüft, kein Listener mehr auf den drei Ports).
Deckt sich mit dem gemessenen Befund von domain-dev/security-checker: `composition.ts:198` baut
den Prüfer im E2E-Eintritt ohne `minIntervalMs`, also mit 60 Minuten; gegen eine
Einzelfall-Frist von 180 s kann kein Wiederholungsversuch nach Fehlschlag feuern, und keiner der
fünf Fälle behauptet eine Anzahl an Anfragen. Eigene Messung bestätigt die fremde: nichts fällt
um, TP-VER-10 bis -13 sind unberührt.

## Annahmen

1. **Ebene des Falls unverändert Integration, nicht neu auf End-to-End gehoben.** Der Auftrag gibt
   mir nur `docs/testplan.md` und `tests/e2e/**` zur Hoheit, aber TP-VER-07 gehört fachlich seit
   jeher zur T-140-Familie (`apps/local-api/test/version/**`), nicht zu den vier
   Playwright-Fällen in `version-check-live.spec.ts` — deren Datei nennt TP-VER-01 bis -07
   ausdrücklich als „hier nicht verdoppelt" (Dateikopf, Zeile 8-10). Ich habe deshalb keinen
   neuen Playwright-Fall angelegt, sondern die Plan-Beschreibung an den bereits (T-274) gebauten
   Integrationsfall angepaßt.
2. **Wortwahl eng an A-V-11′ und der security-checker-Vorlage (T-275-5) gehalten**, nicht frei
   neu formuliert: „Titel und Ergebnis auf Prüflauf und Mindestabstand umstellen, dazu ein
   zweiter Fall, der über den Mindestabstand hinaus mißt und einen zweiten Aufruf erwartet" —
   das ist Teil a) und b) unten, plus die zwei ausdrücklich verlangten Gegenproben.
3. **Die alte Zahl bleibt sichtbar im Berichtigungsvermerk**, nicht stillschweigend entfernt —
   dieselbe Bauart wie die Berichtigungen in `docs/bedrohungsmodell.md` (Marke, Datum, alter
   Wortlaut), damit niemand denselben Fehler ein zweites Mal einbaut.
4. **`docs/spec.md`, `apps/local-api/test/**`, `docs/bedrohungsmodell.md` nicht angefaßt** — alle
   drei sind laut Auftrag fremde Hoheit und ziehen in derselben Welle nach bzw. sind bereits
   nachgezogen (spec.md:346, bedrohungsmodell.md Abschnitt 36, checker.test.ts durch T-274).

Risiken: keine neuen. Reine Dokumentationsänderung an einer Planbeschreibung; kein Produktivcode,
keine neue Prüfdatei, keine geänderte Ausführungskonfiguration.

Offene Fragen: keine an den Orchestrator direkt — aber ein Hinweis: In
`docs/bedrohungsmodell.md:10881` steht die Fundtabellenzeile zu T-275-5 noch mit Stand „offen".
Das ist security-checkers Datei, nicht meine; nach dieser Berichtigung kann sie auf „erledigt"
gestellt werden.

Nächster Schritt: security-checker kann den Fundeintrag T-275-5 in `docs/bedrohungsmodell.md`
Abschnitt 36.7 als erledigt markieren. Documenter zieht `docs/glossar.md:200` und
`docs/benutzerhandbuch.md:644` in derselben Welle nach (T-275-6, unverändert offen, nicht meine
Hoheit).
