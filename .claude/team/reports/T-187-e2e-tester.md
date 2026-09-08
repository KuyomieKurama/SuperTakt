# T-187 — e2e-tester

Aufgabe: T-187 — Ein Prüffall, der seinen Fall nicht erreichen kann, und zwei Ketten ohne Wächter
Status: braucht Review

## Zusammenfassung

O-FI behoben und mit Gegenprobe belegt: `tests/e2e/support/version-check-entry.ts` baut keinen
zweiten Dienststart mehr nach, sondern fährt `main({ releaseSource })` aus
`apps/local-api/src/main.ts` — dieselbe Naht, die `proof-access-entry.ts` seit T-146 benutzt (Antwort
auf O-FJ: ja). Ein neuer Fall (TP-ANH-21, `attachment-persistence-live.spec.ts`) legt eine verwaiste
Bildkopie an und beweist per Gegenprobe (einmal absichtlich gegen die alte Fassung gefahren, rot;
gegen die behobene, grün), dass er den Aufräumlauf jetzt wirklich sieht. O-ER ist als feste Reihe
`tests/e2e/midnight-redraw.spec.ts` eingecheckt (TP-FRIST-11 bis -13, 3/3 grün) und misst zusätzlich
die Grenze aus T-172 Fall M3 (serverseitige `dueStates` folgen der echten Dienstuhr) im selben Fall
mit. O-GJ: nur der Prüffall geändert, kein Oberflächentext angefasst — der Vergleich endet jetzt vor
`(E-047)` und hält sowohl den heutigen als auch den geplanten Wortlaut. **O-FV** ist gebaut, live
gemessen und **rot**: Die in T-181 behauptete Kette Board-Leerzustand → „Erste Spalte einrichten" →
Dialog mit `RULE_IS_A_RULE` besteht heute nicht — der Knopf öffnet nachweislich `PoolFormDialog`
(„Neue Board-Spalte anlegen"), nicht `BoardSetupDialog` („Spalten des Boards", trägt
`RULE_IS_A_RULE`). Das ist ein echter, neuer Fund und kein Fremdbefund aus der laufenden Welle.

`pnpm test:e2e` (drei Konfigurationen): **104 Fälle, 103 grün, 1 rot** — der neue, oben erklärte
Fund (`board-empty-state-rule-chain.spec.ts`). Keine roten Fälle aus paralleler Arbeit von
frontend-dev/unit-tester beobachtet; zusätzlich `playwright.web-build.config.ts` (5/5) gegen die
geänderte gemeinsame Infrastruktur nachgefahren, weil dieselbe `version-check-entry.ts` dort auch
läuft.

## Artefakte

- `tests/e2e/support/version-check-entry.ts` — neu geschrieben: delegiert an `main({ releaseSource })`
  statt eines eigenen Nachbaus (O-FI/O-FJ). Äußerer Vertrag unverändert.
- `tests/e2e/support/db.ts` — `deleteAttachmentRowDirectly` neu (stellt eine Bildkopie ohne
  Anhangszeile her, an der Tür vorbei).
- `tests/e2e/attachment-persistence-live.spec.ts` — neuer Fall TP-ANH-21 (O-FI), mit Gegenprobe
  gefahren (Ergebnis unten).
- `tests/e2e/board-empty-state-rule-chain.spec.ts` — neu, TP-KANBAN-08 (O-FV). **Rot**, echter Fund.
- `tests/e2e/midnight-redraw.spec.ts` — neu, TP-FRIST-11 bis -13 (O-ER), 3/3 grün.
- `tests/e2e/export-mixed-status-and-billing.spec.ts` — Zeile 128/134: Vergleich hängt nicht mehr an
  `(E-047)` (O-GJ). Kein Oberflächentext geändert.
- `docs/testplan.md` — neuer Abschnitt 27 (Nachtrag T-187) mit allen vier Punkten, inklusive dem
  TP-KANBAN-08-Befund im Klartext.

## Die vier Punkte im Einzelnen

### 1. O-FI/O-FJ — der Prüffall erreicht den Aufräumlauf jetzt wirklich

**Befund bestätigt.** `tests/e2e/support/version-check-entry.ts` baute bis dahin einen eigenen,
handgeschriebenen Dienststart nach (eigene `http`-Brücke auf `app.fetch`, eigener Zusammenbau) und
ließ dabei `sweepOrphanedImages` (`usecases/image-sweep.ts`, A-A-18) aus. `services.ts#spawnLocalApi`
— die einzige Startfunktion für die Hauptreihe **und** für `attachment-persistence-live.spec.ts`
(über `startLocalApi`/`restartLocalApi`) **und** für `version-check-services.ts` (TP-VER-10 bis -13)
— startet ausschließlich diese Datei. Ein Neustart mit Bildanhang konnte den Aufräumlauf also nie
beobachten.

**Naht-Frage O-FJ, beantwortet und gebaut.** Der saubere Schnitt ist genau die Naht, die
`apps/local-api/scripts/proof-access-entry.ts` für `proof:access` seit T-146 schon benutzt:
`main()` nimmt `MainOptions.releaseSource` entgegen, `apps/local-api/src/index.ts` (die echte
Auslieferung) gibt nichts an, und ein Prüflauf setzt im selben Prozess eine andere Abholfunktion
ein. `version-check-entry.ts` ist jetzt fünf Zehntel so lang wie vorher: keine eigene
Handschlagprüfung, keine eigene Migration, keine eigene `http`-Brücke — nur noch die steuerbare
Abholfunktion (`wrappedFetch` gegen `github-releases-stub.ts`) und ein Aufruf von
`main({ releaseSource })`. Migration, Rechteprüfung, das Aufräumen liegengebliebener Exportdateien,
der Aufgabenbereich des Add-ins auf 17844 und der Bild-Aufräumlauf laufen jetzt mit, weil es
derselbe Start ist. Der äußere Vertrag (Aufruf, `XDG_DATA_HOME`/`TAKT_E2E_GITHUB_STUB_URL`,
`stdin`-Handschlag, Port 17843) ist unverändert geblieben — weder `services.ts` noch
`version-check-services.ts` mussten angefasst werden.

**Gegenprobe (Auftrag: „ein Fall, der auch vorher grün gewesen wäre, mißt nichts").** Ich habe den
neuen Fall TP-ANH-21 zweimal gefahren:

1. Gegen die **alte** Fassung von `version-check-entry.ts` (Wortlaut aus dem Bericht restauriert,
   Test ausgeführt, dann zurückgesetzt): **rot** — `expect(existsSync(imageFilePath)).toBe(false)`
   schlägt fehl, die Waise überlebt den Neustart. Genau der Zustand, den O-FI beschrieben hat.
2. Gegen die **behobene** Fassung: **grün**.

`TP-ANH-10 Stufe 2` (Persistenz) blieb in beiden Läufen grün — die Gegenprobe trifft gezielt den
neuen Fall.

Die Waise entsteht dabei **an der Tür vorbei**: ein Bildanhang wird über die Tür angelegt, seine
Zeile dann direkt aus `todo_attachment` gelöscht (`support/db.ts#deleteAttachmentRowDirectly`, neu),
ohne die Datei anzufassen — derselbe Endzustand wie ein gescheitertes Entfernen (T-159) oder eine
zurückgehende Migration. Der reguläre Löschweg (`DELETE .../attachments/:id`) käme dafür nicht in
Frage, weil er die Datei immer mitnimmt.

Zusätzlich zu `pnpm test:e2e:attachment-persistence` (2/2) habe ich auch
`playwright.web-build.config.ts` (5/5) und `playwright.version-check.config.ts` (5/5) gegen die
geänderte Datei gefahren, weil beide sie ebenfalls über `services.ts`/`version-check-services.ts`
starten — keine Regression.

### 2. O-FV — die Kette aus Z-07 Punkt 1 hält heute nicht (echter Fund, kein Fremdbefund)

Gebaut: `tests/e2e/board-empty-state-rule-chain.spec.ts`, TP-KANBAN-08. Zero-Spalten-Zustand über
defensives Aufräumen (`listPools('board')` → `deletePool`), dann echter Klick im Browser auf
„Erste Spalte einrichten" im leeren Board.

**Gemessen statt gelesen: Die Kette ist nicht erfüllt.** Der Knopf ruft in `BoardScreen.tsx`
`onCreate={() => setRuleForm({})}` und öffnet `PoolFormDialog` mit Titel „Neue Board-Spalte
anlegen" und der Beschreibung „Eine Regel nennt Bedingungen. …" — **nicht** `BoardSetupDialog`
(Titel „Spalten des Boards", `description={RULE_IS_A_RULE}`). Diesen zweiten Dialog erreicht im
ganzen Bestand ausschließlich der Kopf-Knopf „Spalten verwalten"
(`support/actions.ts#createBoardColumn`, der Weg, den jeder andere Fall benutzt, der eine Spalte
anlegt). Das widerspricht dem T-181-Bericht wörtlich („dieser Knopf öffnet den Einrichtungsdialog,
dessen `description` `RULE_IS_A_RULE` ist") und damit der Grundlage, auf der Z-07 Punkt 1 als
erfüllt galt.

Ich habe den Prüffall **nicht** auf die tatsächliche Verdrahtung zurechtgeschnitten — er hält die
Anforderung aus Z-07 Punkt 1 wörtlich fest (die Definition wörtlich, ohne Import aus
`apps/web/src/**`, wegen der Dateihoheit-Trennung) und bleibt deshalb **rot**, bis entweder
frontend-dev den Knopf über `BoardSetupDialog` führt oder der Orchestrator Z-07 Punkt 1 neu
entscheidet. Ein grüner Fall an dieser Stelle wäre der zweite „Nachweis über nichts" in dieser
Aufgabe gewesen — genau das, was O-FI schon einmal gefunden hat.

**Das ist mein einziger echter Rotstand in dieser Aufgabe**, und er ist außerhalb meiner Hoheit zu
beheben (`apps/web/**` gehört frontend-dev).

### 3. O-ER — der Mitternachtswechsel als feste Reihe

Neu: `tests/e2e/midnight-redraw.spec.ts`, dieselbe Bauart wie `deadline-computed-state.spec.ts`
(`page.clock.install()` auf 23:59 Ortszeit, `fastForward` über Mitternacht, kein `page.reload()`).
Drei Fälle, mirror von T-172s M1/M2, M4/M5, M6/M7:

| ID | Fläche | Ergebnis |
|---|---|---|
| TP-FRIST-11 | `TodoListScreen.tsx` Zeilen-Marke (`DeadlineFlag`) | „Heute fällig" → „Überfällig", ohne Neuladen |
| TP-FRIST-12 | `TimeScreen.tsx` „Erfasst"/„Buchungen von heute" | Buchung verschwindet, ohne Neuladen |
| TP-FRIST-13 | `DashboardScreen.tsx` „Heute erfasst"/„Buchungen von heute" | Buchung verschwindet; „Noch nicht exportiert" bleibt unverändert |

TP-FRIST-11 misst zusätzlich die Grenze aus T-172 Fall M3 im selben Fall: Nach demselben gefälschten
Übergang bleibt der Fristfilter „Überfällig" (geht als `dueStates` an den Dienst, E-070 Punkt 3)
ohne Treffer — die echte Systemuhr des `local-api`-Prozesses lässt sich mit einer gefälschten
Browser-Uhr nicht überqueren. Damit steht die Grenze eingecheckt und nicht nur in einem Bericht, der
irgendwann verblasst. 3/3 grün, isoliert und in der Hauptreihe.

### 4. O-GJ — der Prüffall hängt nicht mehr an einer Kennung

**Keine Änderung an der Oberfläche** (wie vom Orchestrator zwischenzeitlich klargestellt). Geändert:
`export-mixed-status-and-billing.spec.ts:128`, der Vergleich lautet jetzt
`toContainText('Ohne Begründung ausgebucht. Das Feld ist freiwillig')` statt `… freiwillig
(E-047)`. Als reiner Teilzeichenkettenvergleich steckt der kürzere Text sowohl im **heutigen** Satz
(mit `(E-047)`) als auch im **geplanten** (ohne die Kennung) — der Fall bleibt grün, ganz gleich,
wann frontend-dev die Kennung entfernt.

**Erwarteter Wortlaut nach dem Streichen** (für frontend-dev, `apps/web/src/components
/ExportAudit.tsx:170`): `Ohne Begründung ausgebucht. Das Feld ist freiwillig — protokolliert ist
trotzdem, dass hier jemand Zeit ohne Abrechnung abgehakt hat, und wann.` — wörtlich derselbe Satz,
nur ohne ` (E-047)`. Gemessen (E-087): Kein anderes `(E-0XX)`/`(A-XX.X)`/`(R-XX)`-Muster kommt in
`apps/web/src/**` noch vor — diese Streichung ist die letzte ihrer Art, kein Vorbild einer laufenden
Umbenennung.

## Nachweis — `pnpm test:e2e`, drei Konfigurationen

| Konfiguration | Fälle | Grün | Rot |
|---|---|---|---|
| `playwright.config.ts` (Hauptreihe) | 97 | 96 | 1 (`board-empty-state-rule-chain.spec.ts`, echter Fund, s. o.) |
| `playwright.version-check.config.ts` | 5 | 5 | 0 |
| `playwright.attachment-persistence.config.ts` | 2 | 2 | 0 |
| **Summe** | **104** | **103** | **1** |

Vorher (letzter bekannter Stand): 99/99. Die Differenz (+5) sind meine neuen Fälle: TP-ANH-21 (+1),
TP-KANBAN-08 (+1, rot), TP-FRIST-11 bis -13 (+3).

Zur Sicherheit gegen die geänderte gemeinsame Infrastruktur (`version-check-entry.ts`) zusätzlich
gefahren, außerhalb von `pnpm test:e2e`: `playwright.web-build.config.ts` — **5/5 grün**.
`playwright.outlook-build.config.ts` nicht erneut gefahren — sie startet den lokalen Dienst laut
eigenem Kopfkommentar in dieser Prüfung gar nicht mit (`global-setup-outlook-build.ts`), ist also
von der geänderten Datei nicht berührt.

**Textdurchgang-Gegenprobe:** `grep` über `tests/e2e/**` nach den beiden genannten geänderten
zugänglichen Namen (`Meldung schliessen`, `„Dieser Arbeitsplatz"`) — keine Treffer, nichts zu
ändern. `getByRole`-Aufrufe in `tests/e2e/*.spec.ts`: 291 (287 vor meinen vier neuen Aufrufen in den
beiden neuen Dateien) — kein auffälliger Ausschlag gegenüber der genannten Zahl 286.

**Keine roten Fälle aus paralleler Arbeit** von frontend-dev oder unit-tester beobachtet — die eine
rote Zeile ist mein eigener, neu gebauter und live bestätigter Fund (O-FV), kein Fremdbefund.

## Annahmen

- Die Naht-Frage aus O-FJ war an mich delegiert („sag, was der saubere Schnitt wäre, und bau ihn,
  wenn er in deiner Hoheit liegt") — `version-check-entry.ts` liegt vollständig unter
  `tests/e2e/support/**`, also in meiner Hoheit; gebaut wie oben beschrieben.
- O-GJ: keine Änderung an `apps/web/**` vorgenommen (außerhalb meiner Hoheit und laut
  Zwischennachricht des Orchestrators ausdrücklich nicht mein Zug); nur der Prüffall und der
  erwartete Wortlaut für frontend-dev.
- TP-KANBAN-08 bleibt **rot** eingecheckt statt mit `test.fixme()`/`test.skip()` stillgelegt — der
  Bestand kennt dieses Muster nirgends, und ein stillgelegter Fund wäre wieder ein „Nachweis über
  nichts".
- Zero-Spalten-Vorbedingung für TP-KANBAN-08 über defensives Aufräumen (`listPools('board')`) am
  Fallanfang hergestellt, weil der Bestand über die ganze Hauptreihe gemeinsam ist
  (`workers: 1`) und kein anderer Fall regulär eine Spalte liegen lässt, ein abgebrochener Lauf es
  aber könnte.

## Risiken

- **TP-KANBAN-08 ist ein Sicherheitsnetz mit Loch, keine Behebung.** Solange `BoardScreen.tsx`
  nicht angepasst ist, bestätigt der neue Fall bei jedem Lauf denselben bekannten Fund erneut, statt
  ihn zu beheben — das ist beabsichtigt (e2e-tester behebt keinen Produktivcode), macht die
  Hauptreihe aber dauerhaft rot, bis frontend-dev zieht.
- **`version-check-entry.ts` startet jetzt auch den Aufgabenbereich (Port 17844) für jede Datei der
  Hauptreihe**, nicht nur für `TP-VER`-Fälle. Kein Fall dieser Reihe hat das gemessen — er läuft
  mit, weil er Teil desselben `main()` ist, kostet aber ein selbst erzeugtes Zertifikat je frischem
  `startLocalApi()`-Lauf (einmalig pro `pnpm exec playwright test`-Aufruf, nicht je Testfall). In
  allen vier gefahrenen Konfigurationen unauffällig; auf einer langsameren Maschine könnte das die
  Zeit bis zum ersten `/health`-Erfolg geringfügig verlängern.

## Offene Fragen

1. Z-07 Punkt 1: Soll `BoardEmptyState`s „Erste Spalte einrichten" künftig über `BoardSetupDialog`
   (und damit über `RULE_IS_A_RULE`) laufen, oder wird die Auflage neu gefasst? Das entscheidet, ob
   TP-KANBAN-08 grün werden soll, indem `BoardScreen.tsx` sich ändert, oder ob der Prüffall selbst
   noch einmal überarbeitet gehört.
2. Erwarteter Wortlaut nach O-GJ (oben, Abschnitt 4) — bitte gegenlesen, bevor frontend-dev
   `ExportAudit.tsx:170` ändert.

## Nächster Schritt

Orchestrator entscheidet Frage 1 (Z-07 Punkt 1); danach zieht frontend-dev entweder die Verdrahtung
in `BoardScreen.tsx` oder die Auflage wird neu gefasst — `tests/e2e/board-empty-state-rule-chain
.spec.ts` braucht in keinem der beiden Fälle eine Änderung meinerseits. Parallel: frontend-dev
streicht `(E-047)` aus `ExportAudit.tsx:170` mit dem oben genannten Wortlaut; der bestehende
Prüffall verlangt dafür keine weitere Anpassung.
