# T-264 — Code-Review der Umstrukturierung (T-249 bis T-263)

Aufgabe: T-264 — Code-Review der gesamten Umstrukturierung (T-249 bis T-263)
Status: braucht Review — **Nacharbeit**

## Wie gemessen wurde

Der Arbeitsbaum steht 278 geänderte Dateien vor `HEAD` (15bdd97). Weil `git diff` bei einem
Umzug jede Zeile als geändert zeigt, ist die Verhaltensfrage **nicht** am Zeilendiff geprüft,
sondern an einem Mengenvergleich der **Anweisungszeilen**: je Baum alle `.ts`/`.tsx`
aneinandergehängt, Kommentare und Leerzeilen entfernt, Importzeilen und das Schlüsselwort
`export` normalisiert, sortiert, verglichen. Das Werkzeug ist an vier Domänendateien geeicht,
die nachweislich unberührt sind (`rounding.ts`, `export.ts`, `kernel.ts`, `attachment.ts`) —
dort liefert es **null** Abweichung.

**Was dieses Verfahren nicht sieht:** Reihenfolge. Zwei vertauschte Anweisungen bleiben ihm
gleich. Dagegen stehen die 1570 Prüffälle und die E2E-Läufe, nicht dieser Vergleich.

Selbst gefahren: `typecheck` (Rückgabewert 0, alle acht Pakete plus Prüf- und E2E-Projekte),
`test:coverage` (**88 Dateien, 1570 bestanden, 3 übersprungen** — die Zahl der Übergabe ist
bestätigt), `boundaries` (grün, 463 Quelldateien, „Notiz-Trennung: alle Schichten unverletzt"),
`proof:layers` (20/0 mit sechs Gegenproben).

## Was die Stichproben ergeben haben (Punkt 1 des Auftrags)

| Stelle | Ergebnis |
|---|---|
| Rundung auf Viertelstunden | `packages/domain/src/rounding.ts` **unberührt**, null Abweichung. Keine zweite Rundung im Baum. |
| Exportstatus je Buchung | `time-entry.ts` + `export-status.ts` gegen `HEAD:time-entry.ts`: **null** Abweichung außer Importzeilen. |
| Trennung Buchungsnotiz / Todo-Vermerk | `packages/domain/src/export.ts` unberührt; `boundaries` meldet die Trennung unverletzt. |
| „Timerstart hebt Erledigt auf" | `packages/domain/src/todo.ts` nur Importzeilen; `features/timer/*` gegen `HEAD:usecases/timer.ts` + `idle.ts` + `routes/time.ts`: null Abweichung außer `issues()` → `toFieldErrors` (zeichengleiche Abbildung). |
| Zuordnung der Inaktivität | im selben Vergleich enthalten, null Abweichung. |
| Öffnen-Befehl der Hülle | `apps/desktop/src-tauri/**` und `packages/export/**` sind **gar nicht** angefaßt. |
| Transaktionsklammer des Exports | `features/export/export.ts` gegen `HEAD:usecases/export.ts`: null Abweichung. Datei-vor-Commit, `AbortExport`, Aufräumen der Datei bei Rücknahme — unverändert. |

Der einzige nicht durch einen Umzug erklärte Wegfall im Dienst ist
`routes/addin/attachments.ts`. Er ist durch **E-100** gedeckt (T-247), nicht durch diese
Umstrukturierung, und liegt außerhalb dieses Auftrags.

`setExportStatus` und `markNotBilled` lagen bis `HEAD` in `usecases/structure.ts`. Der Umzug
nach `features/export/status.ts` ist die deutlichste Verbesserung des ganzen Umbaus.

Neue `any`, neue Typzusicherungen, geänderte `catch`-Blöcke: **keine**. Im ganzen
`apps/web/src` ist keine einzige Zeile mit `catch` verändert worden.

---

## Befunde

```
packages/domain/src/export-status.ts:208   hoch     Der Doc-Kommentar von checkExportStatusTransition sagt "Es gibt genau zwei erlaubte Übergänge" und zeichnet in 210-211 zwei Pfeile. Der Code darunter hat drei Zweige, und Zeile 57-62 derselben Datei sagt "genau drei" mit drei Pfeilen. Es fehlt open --[ not_billed ]--> exported. Wer nur diesen Block liest, hält den dritten Zweig für überflüssig und entfernt ihn — dann ist "Nicht abrechnen" (E-047) kein Vorgang mehr, sondern ein 409. Fix: 208-211 um den dritten Pfeil ergänzen, oder das zweite Bild streichen und auf Zeile 57 verweisen. Eine Datei, zwei Bilder derselben Regel, ist der Anlaß; ein Bild reicht.
packages/domain/src/export-status.ts:90    mittel   IsLocked (Typ) und isLocked (Wert, Zeile 196) tragen fast denselben Doc-Block, und sie sind schon auseinandergelaufen ("vergißt" gegen "vergisst"). Vor dem Schnitt lagen sie 400 Zeilen auseinander in einer 676-Zeilen-Datei; jetzt stehen sie in einer 254-Zeilen-Datei über einer Regel. Dieselbe Bauart wie der Befund darüber. Fix: einen der beiden Blöcke auf einen Satz kürzen, der auf den anderen zeigt.
apps/web/src/features/tags/PoolAdministration.tsx:17   mittel   features/tags führt drei Dateien aus features/structure ein (Zeilen 13, 17, 18), features/structure/PoolFormDialog.tsx:26 führt ../tags/TagInput zurück. Das ist ein Kreis. T-255 Abschnitt 6 listet beide Kanten in seiner eigenen Tabelle und schließt darunter "Kein neuer Kreis" — die Aussage widerspricht ihren eigenen Daten. Fix am Bericht und an der Übergabe; am Code ist der Kreis erträglich, die Zuordnung nicht: PoolAdministration liegt unter tags, PoolFormDialog und PoolRenameDialog unter structure. Genau das soll ein neuer Entwickler am Ordnernamen erkennen, und hier kann er es nicht.
apps/web/src/features/todos/TodoDoneSwitch.tsx:7       mittel   features/todos führt ../timer/TimerContext ein (auch TodoDetailScreen, TodoListScreen), features/timer/TimeScreen.tsx:7, IdleTaskSelect und useReactivation führen ../todos/api zurück. Zweiter Kreis. Fix: nicht am Code, sondern an der Übergabe. "Die zwei Kreise" stimmt nicht; es sind in der Oberfläche vier (export↔bookings, bookings↔todos, structure↔tags, timer↔todos), gemessen über den Modulgraphen von apps/web/src. Alle vier sind fachlich erklärbar; keiner ist gemessen, weil proof:layers nur den Dienst mißt.
apps/web/src/features/todos/TodoDetailScreen.tsx:40    mittel   Dritter Kreis: todos → bookings/BookingDialogs gegen bookings/BookingsScreen.tsx:7 → todos/api. Siehe Zeile darüber, derselbe Fix.
apps/local-api/src/features/data-transfer/routes.ts:28 mittel   Die Entdopplung von issues() ist auf halbem Weg stehengeblieben: drei Abschriften sind gefallen, zwei stehen noch (hier und routes/addin/schema.ts:465), und beide benennen den Rumpffehler 'body', während http/input.ts:349 ihn '(rumpf)' nennt. Dieselbe Bedingung, zwei Feldnamen in der Antwort, je nach Route. Fix: toFieldErrors aus http/input.ts auch hier verwenden und die Namensänderung body → (rumpf) als Verhaltensänderung benennen — oder, wenn body bleiben soll, input.ts angleichen. Nicht: beides stehen lassen.
apps/desktop/src/shell.ts:179              mittel   "Wer das anzeigt: ShellStatus aus apps/web/src/components/ShellStatus.tsx" — diesen Pfad gibt es nicht mehr (app/ShellStatus.tsx). Gegenwartsaussage, kein Rückblick. Fix: Pfad nachziehen.
packages/domain/src/attachment.ts:665      mittel   "Zeichengleich mit ... effectiveFileNameOf in apps/web/src/lib/attachmentLabel.ts" — Pfad tot (features/todos/attachmentLabel.ts). Ebenso Zeile 769 für extensionOf. Das sind keine Verzierungen: Sie sind der einzige Faden zwischen drei Umsetzungen derselben Regel (Domäne, attachment.rs, Oberfläche). Ein toter Faden ist schlimmer als keiner. Fix: beide Pfade nachziehen.
packages/domain/src/tag-name.ts:24         mittel   "weil die Oberfläche (apps/web/src/components/TagInput.tsx) ... sie unter diesem Namen aufrufen" — Pfad tot (features/tags/TagInput.tsx). Das ist die Begründung dafür, daß zwei Namensfamilien nebeneinander bestehen bleiben. Fix: Pfad nachziehen.
packages/export/src/template.ts:80         mittel   "der Katalog des Dienstes (apps/local-api/src/usecases/export-catalog.ts)" — Pfad tot (features/export/catalog.ts). Fix: nachziehen.
apps/local-api/src/access/export-directory.ts:17  mittel  "Drei Stellen sprechen über denselben Ordner ... 1. apps/web/src/lib/exportDirectoryAdvice.ts" — Pfad tot (features/export/exportDirectoryAdvice.ts). Diese Datei liegt in der Hoheit desselben Agenten, der den Umzug gefahren hat. Fix: nachziehen.
apps/outlook-addin/src/duplicate/reopen.ts:27     mittel  "die Rechnung dahinter in apps/local-api/src/usecases/pool-movement.ts" — Pfad tot (src/pool-movement.ts). Ebenso apps/outlook-addin/scripts/fixtures.mjs:430. Fix: nachziehen.
packages/domain/src/enumeration.ts:15      mittel   Drei Träger aufgezählt, der dritte (apps/web/src/screens/TodoFormDialog.tsx) existiert nicht mehr (features/todos/). Fix: nachziehen.
apps/desktop/scripts/proof-shell-surface.mjs:38   mittel  "dieser Text steht in apps/web/src/lib/releasePage.ts ein zweites Mal" — Pfad tot (features/settings/releasePage.ts). Der Lauf selbst löst den Ort auf und ist grün; nur der Satz daneben ist falsch. Fix: nachziehen.
apps/web/src/api/endpoints.ts:7            mittel   Der Dateikopf verweist zweimal (Zeile 7 und 15) auf apps/local-api/src/routes/** als die Stelle, gegen die Feldnamen abzugleichen sind. Diesen Ordner gibt es bis auf addin/ nicht mehr; die Routen liegen in apps/local-api/src/features/*/routes.ts. Fix: beide Verweise nachziehen. Der erste Satz des Kopfes ("die Routen des lokalen Dienstes, je eine Funktion") stimmt außerdem nur noch für die vierzehn merkmalsübergreifenden Aufrufe, die hier übrig sind — ein Satz dazu gehört an den Anfang.
apps/local-api/test/usecases/              mittel   apps/web/test/ wurde in T-260 an die neue Gliederung gezogen, apps/local-api/test/ nicht: dort stehen weiter usecases/ und routes/ und bilden eine src/-Gliederung ab, die es nicht mehr gibt. Lücke im Zuschnitt von T-260, kein Fehler des Testers. Fix: eigener Auftrag an unit-tester — oder ausdrücklich entscheiden, daß der Prüfbaum die alte Gliederung behält, und das hinschreiben.
apps/web/src/lib/submitAttempt.ts:1        mittel   Ein Leser: shared/ui/FormDialog.tsx:16. lib/touched.ts (zwei Leser, beide shared/ui), lib/fieldMessages.ts (zwei Leser, beide shared/ui) und lib/textEditing.ts (ein Leser: main.tsx) genauso. Das ist genau das Kriterium, an dem lib/ zu messen war, und diese vier bestehen es nicht — sie sind nicht merkmalsübergreifend, sie liegen nur oben. Gemessen: cx 11 Bereiche, foreign 11, format 9, labels 12, poolRule 5, movement 4 — die tragen. Fix: die vier zu ihrem Leser ziehen (shared/ui/ bzw. neben main.tsx). deadline, errorText, pathInspection mit je zwei Bereichen sind Grenzfälle und dürfen bleiben.
apps/web/src/api/endpoints.ts:47           niedrig  checkHealth hat im ganzen Baum keinen Aufrufer — schon vor der Umstrukturierung nicht. Er ist inzwischen zusätzlich das Merkmal, über das proof-callers.mjs:239 die Datei auflöst. Damit hält ein Wächter eine tote Ausfuhr am Leben, und wer sie streicht, macht ihn rot, ohne zu verstehen warum. Fix: Ausfuhr streichen und in proof-callers.mjs ein Merkmal wählen, das einen Leser hat — oder am Merkmal einen Satz dazuschreiben, warum diese Zeile nicht wegdarf.
apps/web/src/features/todos/todoDayGroups.ts:12   niedrig  DayGroup ist ausgeführt und hat keinen Leser außerhalb seiner Datei; ebenso GroupOutcome (features/export/PreviewGroupRow.tsx:36) und StopMessage (features/timer/stopMessage.ts:8). Alle drei sind durch die Teilung entstanden. Als Rückgabetyp einer ausgeführten Funktion vertretbar; als Menge ist es die Sorte Fläche, die beim nächsten Umzug niemand mehr prüft. Fix: entweder export entfernen (über ReturnType<…> bleibt der Typ erreichbar) oder je einen Halbsatz, warum er ausgeführt bleibt.
packages/domain/scripts/check-export-boundary.mjs:37  niedrig  Der Auflöser wird über '../../../scripts/source-anchors.mjs' eingebunden — dieselbe Form, die T-249-1 an drei Stellen ausdrücklich durch Hinauflaufen bis pnpm-workspace.yaml ersetzt hat. Für den Einstieg in den Auflöser selbst ist ein fester Pfad unvermeidbar; er sollte nur so gesagt werden. Fix: ein Satz daneben, daß dies der eine Ort ist, an dem der Pfad fest sein muß, weil er den Auflöser erst holt.
docs/decisions/settings.md:79              niedrig  Verweist auf apps/web/test/components/liveRegionsAlwaysRendered.test.ts; T-260 hat die Datei an die Wurzel von apps/web/test/ gezogen. Ein Papier aus dieser Welle, das eine Bewegung derselben Welle nicht kennt. Ebenso docs/decisions/domain.md:173 (apps/local-api/src/usecases/pool-movement.ts) — ausgerechnet im Abschnitt, der die Regel aufstellt, daß ein Pfad über eine Paketgrenze voll und richtig geschrieben wird. Fix: beide nachziehen.
CLAUDE.md:242                              niedrig  apps/local-api/src/usecases/data-transfer.ts — tot (features/data-transfer/data-transfer.ts). Gehört dem Orchestrator. Ebenso docs/glossar.md:200 (apps/local-api/src/version/checker.ts → features/version/version.ts), das dem Dokumentierer gehört. docs/bedrohungsmodell.md ist an dieser Stelle bereits berichtigt (T-266-3).
apps/outlook-addin/src/                    niedrig  Das Add-in ist nicht mitgezogen worden und gliedert weiter nach Themenordnern, teils mit einer Datei (duedate/, settings/, styles/). Damit stehen im Bestand zwei Ordnungen nebeneinander. Keine Fehlleistung dieser Aufträge — der Zuschnitt nannte das Add-in nicht —, aber es steht der Zusage entgegen, an Ordnern zu erkennen, wo etwas liegt. Fix: entscheiden und hinschreiben, ob das Add-in folgt oder ausdrücklich nicht.
```

---

## Zu den einzelnen Fragen des Auftrags

**2 — Der Widerspruch im Exportstatus.** Bestätigt, und er lag schon in `HEAD`
(`time-entry.ts:177` gegen `:630`, 453 Zeilen auseinander). Der Schnitt hat ihn nicht erzeugt,
er hat ihn **sichtbar** gemacht: Jetzt stehen beide Bilder in einer 254-Zeilen-Datei, 151
Zeilen auseinander, und die Datei handelt von nichts anderem. Falsch ist das zweite Bild; der
Satz zwei Zeilen darunter („ohne einen der **beiden** vorgesehenen Auslöser") ist bereits gegen
das dritte Bild geschrieben und stimmt. Daß der Satz aus einer Prüferrunde stammt, ändert die
Sachlage nicht — er ist keine Auflage, sondern eine Zählung, und die Zählung ist falsch.
Meine Zustimmung zur Änderung liegt hiermit vor (E-078 Punkt 3).

**3 — Flacher oder nur anders sortiert?** Flacher, und die Zusage trägt. Keine Barrel-Datei in
einem Anwendungsbaum (die drei `index.ts` unter `packages/*/src` sind Paketeinstiege und waren
nie gemeint), kein `utils.ts`, kein `helpers.ts`, keine neue Schicht, kein DDD-Vokabular. Die
drei Zwei-Datei-Ordner im Dienst (`features/board`, `features/settings`, `features/structure`)
sind das Minimum, das `proof:layers` Abschnitt 4 verlangt, und keine Ausweichbewegung. Der
Zuschnitt von `app/DashboardScreen.tsx` statt `features/dashboard/` ist in T-256 Abschnitt 5 an
drei Messungen begründet und trägt.

Ein Nachsatz zur Buchführung: „`tag.ts` 1264 → 197 plus `pool.ts`" liest sich stärker als es
ist. `pool.ts` hat 1116 Zeilen. In **Anweisungszeilen** gemessen sind es 75 und 196 gegen
vorher 271 — die Datei ist zu 82 Prozent Kommentar. Der Schnitt ist trotzdem richtig, aber er
hat einen Gegenstand geteilt, nicht einen Klotz zerlegt. Dasselbe gilt für `time-entry.ts`
(158 Anweisungszeilen) und `export-status.ts` (75).

**4 — `shared/` und `lib/`.** `shared/ui/` hält: jede der neunzehn Dateien wird aus mindestens
drei Bereichen gelesen, `Primitives` aus elf Bereichen und 80 Dateien, `Icon` aus elf und 56.
Kein Sammelordner. `lib/` hält **überwiegend**, aber nicht ganz — vier Dateien haben ihre Leser
alle in einem Bereich (Befund oben). Die Messung, die frontend-dev gefahren hat (`labels.ts`
8/30, `format.ts` 7/35), war richtig und traf die stärksten Fälle; sie wurde nicht auf die
schwächsten angewandt.

**5 — Toter Code.** Die drei gemeldeten toten Ausfuhren sind tatsächlich gefallen und waren
tatsächlich tot (`TemplatePreviewCard`, `usePrefersReducedMotion`, `IssuedToken` — alle drei
schon in `HEAD` ohne Leser). Übrig geblieben sind: `checkHealth` (ohne Leser, jetzt an einen
Wächter gebunden) und drei neue Typausfuhren ohne Leser. Die Entdopplung von `issues()` und
`const record` ist teilweise: von fünf `issues()`-Abschriften stehen zwei, mit abweichendem
Feldnamen.

**6 — Die Kreise.** Im **Dienst** trägt es: genau eine merkmalsübergreifende Kante
(`features/timer/routes.ts:73 → features/export/status.ts`) und eine zweite
(`features/board/board.ts:58 → features/structure/structure.ts`), beide gerichtet, kein Kreis
zwischen Merkmalen. Die Route `PATCH /time-entries/{id}/export-status` bei den Buchungen
anzusiedeln und die Regel beim Export ist die richtige Richtung — der Gegenstand ist die
Buchung, die Regel gehört dem Export. Das trägt.

In der **Oberfläche** trägt die Begründung für `export ↔ bookings` (T-254 Abschnitt 12) — sie
ist sauber gemessen und sauber verworfen. Was nicht trägt, ist die **Zahl**. Es sind vier
Kreise, nicht einer, und einer davon (`structure ↔ tags`) steht mit beiden Kanten in einem
Bericht, der darunter „Kein neuer Kreis" schreibt. Das ist genau die Bauart, gegen die E-103
geschrieben ist: eine Aussage über den Bestand, die neben ihren eigenen Meßwerten steht und
ihnen widerspricht. Keiner der vier ist gefährlich; alle vier sind reine Modulkanten in einem
Bündel, das ohnehin zusammen ausgeliefert wird. Aber sie gehören richtig gezählt, bevor die
Zahl in eine Entscheidung wandert.

## Annahmen

1. Der Wegfall von `routes/addin/attachments.ts` ist **nicht** Gegenstand dieses Reviews. Er
   gehört zu T-247 und ist durch E-100 gedeckt.
2. Stale Pfade in Kommentaren habe ich nur dort als Befund geführt, wo der Satz in der
   **Gegenwart** über einen Ort spricht. Rückblicke („Bis E-049 stand …", „Zuletzt nachgezogen
   mit T-257 …") sind Wortlaut über Geschichte und bleiben richtig; das ist dieselbe
   Unterscheidung, die T-260 getroffen hat, und sie ist richtig getroffen.
3. Ich habe keine Datei außer dieser angefaßt.

## Risiken

1. **Der Mengenvergleich ist reihenfolgenblind.** Zwei vertauschte Anweisungen fallen ihm nicht
   auf. Für die Fachlogik ist das durch 1570 Prüffälle abgedeckt; für die Reihenfolge von
   `refresh()` und `bump()` in den React-Kontexten nur so weit, wie die E2E-Läufe reichen.
2. **`proof:layers` mißt nur den Dienst.** Für `apps/web` hängt die Zusage weiter am
   Ordnernamen — genau die Lage, aus der E-103 entstanden ist. Ein Gegenstück für die
   Oberfläche (jedes Merkmal führt genau eine `api.ts`; keine Merkmalskante ohne Begründung)
   wäre der nächste Schritt und gehört in einen eigenen Auftrag.
3. **Kein Sicherheitsbefund.** Keine neue Adresse, kein neuer Netzzugriff, kein geänderter
   `catch`, kein neues `any`, keine Datei unter `apps/desktop/src-tauri/**` und keine unter
   `packages/export/**` angefaßt. Die Vertrauensgrenzen aus dem Bedrohungsmodell sind an keiner
   Stelle verschoben worden.

## Offene Fragen

1. Soll der Kreis `structure ↔ tags` bestehen bleiben, oder zieht `PoolAdministration` zu den
   Pool-Dialogen? Der Kreis stört nicht; die **Auffindbarkeit** stört.
2. Soll `apps/local-api/test/` der neuen Gliederung folgen, oder bleibt der Prüfbaum bewußt bei
   `usecases/`/`routes/`? Beides ist vertretbar, eines muß hingeschrieben werden.
3. Folgt das Add-in dem Merkmalszuschnitt, oder gilt für es ausdrücklich etwas anderes?

## Urteil

**Nacharbeit.**

Blockierend ist **ein** Befund: `packages/domain/src/export-status.ts:208`. Eine Datei, die über
nichts anderes handelt als die Frage, wann eine Buchung als abgerechnet gilt, darf über die Zahl
ihrer eigenen Übergänge nicht zweierlei sagen. Der Fix ist eine Zeile.

Nicht blockierend, aber vor der Freigabe zu **berichtigen**, weil die Zahl sonst in eine
Entscheidung wandert: „die zwei Kreise" ist falsch. Es sind vier in der Oberfläche, und T-255
Abschnitt 6 widerspricht seinen eigenen Meßwerten.

Alles Übrige — die vierzehn toten Pfade, die halbe Entdopplung von `issues()`, die vier Dateien
in `lib/`, `apps/local-api/test/` — ist Nacharbeit in einer nächsten Welle und kein Grund, den
Umbau zurückzuhalten.

**Die Umstrukturierung selbst gebe ich frei.** Das Verhalten ist an den sieben teuersten Stellen
nachgemessen und unverändert; die Fachlogik liegt weiter genau einmal in `packages/domain`; die
Transaktionsklammern von Export und Timerstopp sind zeichengleich; die verbotenen Bauformen sind
nicht eingeschlichen; `shared/` ist kein Sammelordner geworden. Die Freigabe steht unter dem
einen Befund oben.

## Nächster Schritt

Ein Auftrag an domain-dev, klein und einzeln: `export-status.ts:208-211` berichtigen und die
Dopplung bei `IsLocked` auflösen. Danach diese Freigabe ohne Vorbehalt.

Parallel und unabhängig davon ein Sammelauftrag „tote Pfade": die vierzehn Stellen oben, je
Agent in seiner Hoheit — sie fallen sonst in fünf verschiedene Aufträge und werden dreimal
vergessen.
