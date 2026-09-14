# T-355 — Prüffälle zu A-A-106, und ein Fall, der aus dem falschen Grund grün war

**Rolle:** unit-tester. **Stand:** 2026-09-13, Zweig `feature/outlook-anhaenge-und-versionspruefung`.
**Vorlage:** `.claude/team/reports/T-349-domain-dev.md` (Abschnitt 8, Offene Fragen 1 und 2).

**Geänderte Datei — eine, in eigener Hoheit:**

| Datei | Was |
|---|---|
| `apps/local-api/test/version/checker.test.ts` | Neuer Prüfblock zu A-A-106 (2 Fälle), der T-279-Fall umbenannt plus ein neuer Gegenfall (1 Fall) |

Kein Produktivcode angefaßt. `apps/local-api/src/features/version/version.ts` wurde für den
Rot-Nachweis kurzzeitig auf den Stand von `HEAD` zurückgesetzt und danach **zeichengleich**
zurückgeschrieben (`md5sum` vorher `c02028884415c6d4c3c8ad4a8ea9efb2`, nachher identisch;
`git diff --stat` davor und danach beide `234 insertions(+), 22 deletions(-)`).

---

## 1 — Der neue Prüfblock zu A-A-106

`describe('A-A-106 — ein Speicher, dessen write() nie eintrifft, hält die Prüfung nicht auf (T-349)', …)`
mit zwei Fällen, aufgebaut nach der Vorgabe aus dem T-349-Bericht
(`storeDeadlineMs` klein, `store.write` löst nie ein):

1. **Hauptfall.** `store: { write: () => new Promise<void>(() => {}) }`, `storeDeadlineMs: 20`,
   `intervalMs: 30`, `minIntervalMs: 10`. Gemessen wird:
   - **Die Prüfung wird nicht aufgehalten** — `waitUntil(() => checker.current().state === 'known')`
     kommt durch, statt in die Zeitüberschreitung zu laufen.
   - **Der Takt bleibt unberührt** — eine zweite Anfrage folgt auf dem gewöhnlichen Intervall
     (`counting.calls() >= 2`), obwohl der Speicher nie geantwortet hat.
   - **Genau eine Protokollzeile**, nicht je Lauf eine neue — nach zwei abgeschlossenen Läufen
     (plus Pufferzeit) wird `lines` gefiltert; `version_check_state_write_timeout` erscheint
     **1**-mal. Das mißt A-18.11 wörtlich übertragen auf das Ablegen des Speichers.
   - **Still nach A-18.12** — `version_check_state_unwritable` erscheint **0**-mal; kein zweiter
     Grund, kein Wurf.
2. **Reine Funktion.** `describeVersionCheckStoreFailure('timeout')` und `('threw')` einzeln
   geprüft: verschiedene Schlüssel, verschiedene, nicht-leere Sätze — dieselbe Bauart wie
   `describeVersionCheckFailure`, ohne laufenden Dienst prüfbar.

Den dritten Vorschlag aus dem T-349-Bericht („ein zweiter Fehlschlag schreibt keine zweite
Zeile") habe ich **nicht** als eigenen dritten Fall gebaut, sondern in den Hauptfall integriert:
Sobald der Speicher einmal abgelegt ist (`store = null`), gibt es strukturell keinen zweiten
Fehlschlag mehr — das ist dieselbe Eigenschaft wie „genau eine Zeile über zwei Läufe hinweg" und
ein eigener Fall hätte nur denselben Mechanismus ein zweites Mal angesteuert.

### Rot zuerst — gegen den Vorzustand aus `HEAD`

`version.ts` aus `HEAD` (vor A-A-106) kurzzeitig eingesetzt, derselbe Prüflauf gefahren:

```
❯ die Anfrage geht dennoch hinaus, der Zustand wird "known" …   → Timeout ("Bedingung wurde nicht
                                                                    rechtzeitig wahr") — run() kam
                                                                    nie an source.latest(), weil
                                                                    `await remember(...)` auf ein
                                                                    Versprechen wartete, das nie
                                                                    einlöst. Exakt der Ausschalter
                                                                    aus T-332 K-1.
❯ describeVersionCheckStoreFailure ist rein …                   → TypeError: describeVersionCheck-
                                                                    StoreFailure is not a function
                                                                    (Export existiert vor T-349
                                                                    nicht)
```

3 von 23 Fällen rot, 20 unverändert grün (`Test Files 1 failed`, `Tests 3 failed | 20 passed`).
Datei danach zeichengleich zurückgeschrieben, alle 23 Fälle wieder grün
(`Test Files 1 passed`, `Tests 23 passed`).

---

## 2 — Der T-279-Fall, der aus dem falschen Grund grün war

`apps/local-api/test/version/checker.test.ts`, Fall „der Zeitpunkt steht bereits im Speicher,
während die Anfrage noch läuft (T-279)": **umbenannt**, nicht nur kosmetisch, sondern mit einem
Absatz im Testkörper, der die Verwechslung explizit macht — und **ergänzt** um einen zweiten
Fall, der die heutige, echte Zusage mißt.

**Warum der alte Name zu viel behauptete:** Der Fall nutzt den echten, migrierten Adapter
(`createVersionCheckStatePort` → `recordCheck`). Dessen `UPDATE` läuft vollständig **synchron**
im Aufruf; die `async`-Funktion drumherum wird erst beim `return` fertig, hat aber vorher keinen
`await`, an dem sie unterbräche. Der geschriebene Wert steht damit bereits fest, **bevor**
`remember()` überhaupt zurückkehrt — unabhängig davon, ob der Prüfer selbst noch wartet oder
nicht. Nach A-A-106 stimmt der Name „während die Anfrage noch läuft, weil der Prüfer wartet"
nicht mehr: Der Prüfer wartet nicht mehr, und der Fall ist trotzdem grün, weil der **Adapter**
synchron ist. Das ist exakt die Klasse aus dem Auftrag: Name sichert eine Prüferzusage zu, der
Rumpf mißt eine Adaptereigenschaft.

**Der neue, zweite Fall** setzt einen Speicher ein, der über ein echtes `setTimeout(…, 80)`
verzögert einlöst (keine Attrappe eines synchronen Bestands), und mißt die tatsächliche,
schwächere Zusage aus T-349, Abschnitt 1.2 des Berichts wörtlich: **Zugesichert ist nur der
Anstoß, nicht der Abschluß.** Beim Abschluß der Anfrage (`checker.current().state === 'known'`)
ist der Schreibzugriff angestoßen (`writeCalled === true`), aber sein Versprechen **noch nicht**
eingelöst (`writeSettled === false`).

### Rot zuerst

Gegen `HEAD` gemessen: Der neue Fall schlägt fehl — nicht per Zeitüberschreitung, sondern per
Zusicherung (`expected true to be false`): Im alten Code wartet `await remember(…)` auf
`store.write(…)`, **bevor** die Anfrage überhaupt losgeht; ein Speicher mit einer echten
80-ms-Verzögerung hat sein Versprechen dann zwangsläufig **vor** dem Abschluß der Anfrage
eingelöst. Der umbenannte, unveränderte erste Fall bleibt unter `HEAD` unverändert grün — er
mißt nach wie vor korrekt die Synchronität des Adapters, die es auch vor T-349 schon gab, nur
hieß sie damals fälschlich „weil der Prüfer wartet".

---

## 3 — Die Suche nach derselben Klasse im Umfeld der Versionsprüfung

Zeilenweise gegen Titel geprüft, jeweils die volle Datei gelesen: `apps/local-api/test/version/
checker.test.ts` (jetzt 26 Fälle), `apps/local-api/test/version/source.test.ts` (22 Fälle),
`apps/local-api/test/routes/version.test.ts` (7 Fälle), `packages/domain/test/version.test.ts`
(alle Fälle zu `checkVersion`, `compareVersions`, `decideUpdateNotice`,
`versionCheckDelayWithJitter`), `packages/storage/test/repo-version-check.test.ts` (13 Fälle).
Kein weiterer Fall dieser Klasse gefunden — jeder Titel behauptet genau das, was der Rumpf
tatsächlich prüft. Zusätzlich einen **lesenden** Durchgang über `tests/e2e/version-check-live.spec.ts`
und seine Stützdateien gemacht (nicht meine Hoheit, keine Änderung): Auf E2E-Ebene wird über
sichtbares Verhalten geprüft (Dialog, Browserspeicher, Neustart), nicht über interne
Zeitpunkt-Reihenfolgen wie beim T-279-Fall — dort ist die konkrete Fehlerklasse aus diesem
Auftrag strukturell nicht in derselben Form anzutreffen, aber der Durchgang war nicht so
erschöpfend wie bei den Dateien in meiner Hoheit.

**Ehrlich zur Frage, wo meine Menge aufgespannt ist:** Sie ist an der Anforderung „im Umfeld der
Versionsprüfung" aufgespannt, nicht an Dateien, die ich zufällig kannte — ich habe die Menge über
`find`/`grep` nach `version` in Testverzeichnissen ermittelt, nicht aus Erinnerung. Ich habe sie
aber **nicht** wie T-321 auf den ganzen Bestand ausgedehnt: Der Auftrag grenzt ausdrücklich auf
„im Umfeld der Versionsprüfung" ein, und eine bestandsweite Suche nach derselben Namensklasse
(die T-321 laut Auftragstext schon einmal gefahren hat) wäre eine andere, eigene Aufgabe. Wer
diese weitere Ausdehnung will, bekommt sie als eigenen Auftrag — hier ist sie nicht enthalten.

---

## 4 — Läufe, jeder mit Zahl

| Lauf | Ergebnis |
|---|---|
| `vitest run apps/local-api/test/version/checker.test.ts` (Arbeitsstand, nach A-A-106) | **23 / 23 grün** |
| dieselbe Datei, `version.ts` auf `HEAD` zurückgesetzt (Rot-Nachweis) | **20 / 23 grün, 3 rot** — genau die drei neuen/geänderten Fälle |
| dieselbe Datei, `version.ts` zeichengleich zurückgeschrieben | **23 / 23 grün** (md5sum vorher/nachher identisch) |
| `vitest run` über `checker.test.ts` + `source.test.ts` + `routes/version.test.ts` + `repo-version-check.test.ts` + `packages/domain/test/version.test.ts` | **160 / 160 grün** |
| `vitest run apps/local-api/test` (ganzes Paket) | **352 / 354 grün, 2 vorbestehend übersprungen** — keine Regression |
| `tsc -p apps/local-api/tsconfig.test.json --noEmit` | **Exit 0** |
| `pnpm --filter @takt/local-api exec tsc --noEmit -p .` | **Exit 0** |
| Deckung `apps/local-api/src/features/version/**` (nur zur eigenen Kontrolle, keine Schwelle geändert) | version.ts 85,45 % Stmts / 88 % Lines (vorher laut T-349-Bericht niedriger, da `describeVersionCheckStoreFailure` und der Zeitüberschreitungszweig jetzt erreicht werden) |

**Nicht gefahren** (Portbindung gehört T-352, laut Auftrag): `pnpm test:e2e`, `verify:bundle`.
**Nicht gefahren** (außerhalb des Auftrags, kein Bezug zur geänderten Datei): `pnpm check` als
Ganzes, `proof:release-safety`, `test:rust`, `build`, `audit`.

---

## 5 Annahmen

1. **`storeDeadlineMs: 20` und `intervalMs: 30`/`minIntervalMs: 10`** im Hauptfall sind bewußt
   klein und eng beieinander gewählt, damit ein zweiter Lauf innerhalb der 3-Sekunden-Grenze von
   `waitUntil` sicher eintrifft, ohne die Frist selbst (20 ms) zu unterschreiten oder den
   zweiten Lauf zu verpassen.
2. **80 ms Verzögerung** im zweiten T-279-Fall ist bewußt deutlich über der üblichen
   Ereignisschleifenrunde, damit `checker.current().state === 'known'` mit Sicherheit **vor**
   dem Einlösen des Speicherversprechens eintritt, ohne auf eine bestimmte Zeitgeberauflösung
   angewiesen zu sein.
3. **Der dritte Vorschlag aus dem T-349-Bericht** („ein zweiter Fehlschlag schreibt keine zweite
   Zeile") ist in den Hauptfall integriert statt als eigener Fall gebaut — Begründung in
   Abschnitt 1.
4. **Keine Abdeckungsschwelle verändert.** Die in Abschnitt 4 genannten Prozentzahlen sind nur
   zur eigenen Kontrolle gemessen, nicht als Vorgabe eingetragen.

## 6 Risiken

- Keine sicherheitsrelevante Änderung — reine Prüffälle, keine neue Einfuhr, keine neue Naht in
  Produktivcode.
- Der kurzzeitige Rücktausch von `version.ts` auf `HEAD` lief, während laut Auftrag `apps/**` und
  `packages/**` stillstehen; dennoch bestand ein kleines Zeitfenster, in dem die Datei nicht dem
  Arbeitsstand von T-349 entsprach. Byte-genau geprüft und sofort zurückgeschrieben.

## 7 Offene Fragen

Keine an den Orchestrator — beide Meßaufträge aus dem T-349-Bericht sind erledigt.

## 8 Nächster Schritt

Code-Reviewer und Security-Checker über `apps/local-api/test/version/checker.test.ts` laufen
lassen; danach `docs/bedrohungsmodell.md` 44.5 (security-checker, laut T-349 Abschnitt 8 Punkt 5)
und R-30 in `risks.md` mit dem von T-349 vorgeschlagenen Wortlaut fortschreiben (Orchestrator-
Hoheit).

---

```
Aufgabe: T-355 — Die Prüffälle zu A-A-106, und ein Fall, der aus dem falschen Grund grün ist
Status: fertig
Artefakte: apps/local-api/test/version/checker.test.ts
Zusammenfassung: Neuer Prüfblock zu A-A-106 (zwei Fälle: der stumme Speicher hält die Prüfung
  nicht auf, schreibt genau eine Zeile und läßt den Takt unberührt; dazu die reine Funktion
  describeVersionCheckStoreFailure). Beide gegen den Vorzustand aus HEAD als rot nachgewiesen
  (Timeout bzw. TypeError), danach am Arbeitsstand grün, version.ts zeichengleich
  zurückgeschrieben (md5sum-Vergleich). Der T-279-Fall „der Zeitpunkt steht bereits im Speicher"
  ist umbenannt — er mißt die Synchronität des eingesetzten Adapters, nicht mehr eine Zusage des
  Prüfers, seit dieser nicht mehr wartet — und um einen neuen Fall mit einem echt verzögerten
  Speicher ergänzt, der die heutige, schwächere Zusage (Anstoß statt Abschluß) mißt und gegen
  HEAD ebenfalls rot ist. Suche nach derselben Klasse im übrigen Umfeld der Versionsprüfung
  (alle Testdateien zu version.ts/source.ts in meiner Hoheit, vollständig gelesen) ergab keinen
  weiteren Fund; ein lesender, nicht erschöpfender Blick auf die E2E-Datei zeigte dort keine
  strukturell gleiche Form. Läufe: 23/23 (Arbeitsstand) → 20/23 (HEAD, 3 rot wie erwartet) →
  23/23 (zurückgeschrieben); 352/354 im ganzen Paket, keine Regression; tsc Exit 0.
Annahmen: Fristen/Intervalle im Hauptfall (storeDeadlineMs 20 ms, intervalMs 30 ms,
  minIntervalMs 10 ms) und Verzögerung (80 ms) im T-279-Gegenfall sind Meßwerte ohne Bezug zu
  Produktivwerten; der dritte Vorschlag aus dem T-349-Bericht ist im Hauptfall integriert statt
  als eigener Fall; keine Abdeckungsschwelle verändert.
Risiken: keine sicherheitsrelevante Änderung; der kurzzeitige Rücktausch von version.ts für den
  Rot-Nachweis lief außerhalb der Momentaufnahme des Arbeitsstands und wurde byte-genau
  rückgängig gemacht.
Offene Fragen: keine.
Nächster Schritt: Code-Review und Security-Check über die geänderte Testdatei; danach
  Bedrohungsmodell 44.5 und R-30 fortschreiben (Orchestrator-Hoheit, Wortlaut liegt im
  T-349-Bericht).
```
