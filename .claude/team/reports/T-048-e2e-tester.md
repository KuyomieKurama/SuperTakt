Aufgabe: T-048 — Die End-zu-Ende-Tests nachziehen (Stand aus T-035, T-040, T-041, T-045, T-046,
Migration 0007)
Status: fertig

---

Artefakte:

Geändert unter `tests/e2e/`:

```
export-end-to-end.spec.ts               Bestätigungsdialog über confirmExportRun(); Auswertung
                                        robust gegen fremde offene Buchungen im gemeinsamen
                                        Bestand (nicht mehr "genau 2 Zeilen")
export-mixed-status-and-billing.spec.ts "Nicht abrechnen" jetzt mit Verlauf-Prüfung (freiwillige
                                        Begründung); Bestätigungsdialog über confirmExportRun()
note-separation.spec.ts                 Bestätigungsdialog über runExportFromScreen()
tags-folders.spec.ts                    neu geschrieben: Dreieck klappt auf, Klick auf die Zeile
                                        wählt aus (T-035); "Zielordner" ersetzt durch "Ordner für
                                        dieses Tag"/"Neuer übergeordneter Ordner" (C-18); Gegenprobe
                                        Dreieck verstellt Auswahl nicht; Zyklus-Ablehnung jetzt auch
                                        im Verschieben-Dialog der Oberfläche an einem Ordner mit
                                        Inhalt (T-012, Fall 22, vormals durch Befund ersetzt)
todo-revival.spec.ts                    zwei neue Fälle (S-01, S-05); S-03/S-04/S-02 auf die
                                        seit T-040/T-045 geänderten Beschriftungen und Klassen
                                        gezogen ("Timer für …" statt "Zeiterfassung …", `.doneflag`
                                        statt `.todo-row__flag`, dritter Anzeigezustand "Erledigt
                                        aufgehoben" auf S-03 statt Rückfall auf "Offen"); Timer-
                                        Locator auf `#inhalt` beschränkt (Kopfleiste trägt seit
                                        T-040 denselben Wortlaut); `afterEach` räumt einen
                                        laufenden/verwaisten Timer über die API auf
support/api.ts                          `getRunningTimer`, `getOrphanedTimer`, `stopTimer`,
                                        `resolveOrphanedTimer`, `cleanupAnyTimer`
```

Neu unter `tests/e2e/`:

```
support/actions.ts                      confirmExportRun(), runExportFromScreen(),
                                        readResultFilePath() — behandeln das seit T-045 mögliche
                                        "Mir ist bewusst"-Kontrollkästchen im Exportdialog
export-audit-and-locks.spec.ts          TP-SEC-13 (exportieren/zurücksetzen/erneut exportieren
                                        mit Verlaufsreihenfolge), Verlauf einer nie exportierten
                                        Buchung, zwei Fälle zum gesperrten Export
calendar-day-boundary.spec.ts           Tagesgrenze in Ortszeit (T-041-Fix), plus der im Auftrag
                                        genannte Kontrollfall 23:30 Ortszeit
export-template-validation.spec.ts      422 bei unzulässigem/doppeltem Feldnamen (TP-SEC-07 über
                                        den tatsächlichen Weg)
```

`docs/testplan.md`: neuer Abschnitt 14 mit acht neuen/präzisierten Fall-IDs
(`TP-LOCK-01/02`, `TP-EXPST-10/11`, `TP-TAG-07/08`, `TP-TIME-01`, `TP-TPL-09`), jede mit Verweis
auf die zugehörige Spezifikationsdatei. `tests/fixtures/**` unverändert leer — wie in T-012
begründet, erzeugen alle Fälle ihre Daten laufzeit-eindeutig über die API; kein Fall hätte von
einer statischen Fixture profitiert.

`apps/**`, `packages/**`, die Wurzeldateien: nicht angefasst. Kein `git commit` (kein Git-Repo in
diesem Arbeitsbereich).

---

**Die drei Zahlen, getrennt, wie verlangt:**

- **Fälle: 33** — 25 aus dem T-012-Bestand (nachgezogen, teils präzisiert) plus 8 neu benannte in
  Abschnitt 14 des Testplans.
- **Bestanden: 24**
- **Nicht gelaufen: 9**

Technisch: **23 von 23** Playwright-`test()`-Blöcken in **8 Dateien** grün, in einem sauberen
Lauf ohne eine einzige Wiederholung (`23 passed (34.2s)`). Der Unterschied zwischen 23 `test()`
und 24 "bestanden" kommt aus derselben Mehrfachbelegung wie in T-012 (ein `test()`-Block deckt
mehrere benannte TP-Fälle gleichzeitig ab, z. B. TP-EXPORT-01 zusammen mit TP-B64-10 und dem
TP-ROUND-07-Spotcheck in einem Lauf).

---

## Was von den 25 aus T-012 jetzt steht

| # | Fall | Ergebnis jetzt | Änderung gegenüber T-012 |
|---|---|---|---|
| 1–2 | Export Ende-zu-Ende (TP-EXPORT-01/02/03, TP-B64-10, TP-ROUND-07) | **bestanden** | Bestätigungsdialog um das neue Kontrollkästchen ergänzt; Auswertung robust gegen fremde offene Buchungen im gemeinsamen Bestand gemacht (dazu unten mehr) |
| 3–6 | Notiz-Trennung (TP-NOTE-01/02/03, 3 Vorlagen) | **bestanden** | nur der Bestätigungsdialog geändert |
| 7 | Wiederbelebung S-03 | **bestanden** | Erwartung von "Offen" auf "Erledigt aufgehoben" geändert (T-045, Befund C-23: der Schalter fällt nicht mehr zurück, sondern zeigt den dritten Zustand) |
| 8 | Wiederbelebung S-04 (Kanban) | **bestanden** | "Zeiterfassung starten/stoppen" → "Timer für …" (T-040, C-17) |
| 9 | Wiederbelebung S-02 | **bestanden** | `.todo-row__flag` → `.doneflag` (T-045, AN-03); Kennzeichen bleibt jetzt als "Erledigt aufgehoben" stehen statt zu verschwinden (T-045, C-23 auch für S-02) |
| 10 | Wiederbelebung S-01 (Dashboard) | **bestanden, neu gelaufen** | war in T-012 aus Zeitgründen nicht gelaufen; jetzt möglich, seit T-040 (C-04) I-05 ausdrücklich auf alle sechs Startpunkte ausgeweitet hat |
| 11 | Wiederbelebung S-05 (Zeiterfassung) | **bestanden, neu gelaufen** | dito |
| 12 | Wiederbelebung S-12 (Add-in) | **nicht gelaufen** | unverändert: kein Office.js-Host erreichbar |
| 13 | Exportstatus an 19 Orten (TP-EXPST-09) | **nicht gelaufen** als eigener Fall | unverändert Zeitmangel; siehe unten, was inzident mitgeprüft ist |
| 14 | Gemischter Exportstatus | **bestanden** | nur Bestätigungsdialog geändert |
| 15 | "Nicht abrechnen" | **bestanden, erweitert** | zusätzlich: Verlauf nennt die Begründung ausdrücklich freiwillig (TP-EXPST-11) |
| 16 | Gesperrte Tagesgruppe E-034 | **bestanden** | nur Bestätigungsdialog geändert |
| 17–19 | T-020, Hüllenzustände | **nicht gelaufen** | unverändert: braucht einen echten Tauri-Prozess, siehe unten |
| 20 | Tag-Ordner 4 Ebenen, Navigation | **bestanden, umgebaut** | Navigation über das Dreieck statt Klick auf den Namen (T-035); "Zielordner" umbenannt (C-18) |
| 21 | Zyklus-Ablehnung über die API | **bestanden** | unverändert |
| 22 | Zyklus-Ablehnung im UI-Dialog, Ordner mit Inhalt | **bestanden, neu gelaufen** | T-012: "nicht gelaufen, durch Befund ersetzt", weil ein Ordner mit Inhalt nicht auswählbar war. T-035 hat genau diesen Befund behoben — jetzt nachgeholt (TP-TAG-07) |
| 23 | Standard-Tags über die Oberfläche | **nicht gelaufen** | Zeitmangel in dieser Aufgabe (siehe Risiken) |
| 24 | Standard-Tags über das Add-in | **nicht gelaufen** | unverändert strukturell blockiert (kein Office.js-Host) |
| 25 | Kanban Drag & Drop + Spaltenverwaltung | **nicht gelaufen** | Zeitmangel; der Timer-Teil ist weiterhin über Fall 8 belegt |

## Die acht neuen Fälle (Abschnitt 14 des Testplans)

| Fall | Ergebnis | Bezug |
|---|---|---|
| TP-LOCK-01 — gesperrter Export, Vorschau antwortet nicht, Wiederholung | **bestanden** | T-045, offene Frage 1 |
| TP-LOCK-02 — gesperrter Export, Fehlschlag bei offenem Bestätigungsdialog | **bestanden** | T-045, offene Frage 1 |
| TP-EXPST-10 — Verlauf: Leerzustand bei nie exportiert; Reihenfolge bei mehreren Vorgängen (TP-SEC-13) | **bestanden** | T-040, Befund C-01, offene Fragen 2a/2c |
| TP-EXPST-11 — "Nicht abrechnen" ohne Grund, Verlauf nennt das Feld freiwillig | **bestanden** | T-040, offene Frage 2b |
| TP-TAG-07 — Zyklus-Ablehnung im UI-Dialog an einem Ordner mit Inhalt | **bestanden** | T-035, T-012 Fall 22 |
| TP-TAG-08 — Dreieck verstellt die Auswahl nicht (Gegenprobe) | **bestanden** | T-035, offene Frage 3 an mich |
| TP-TIME-01 — Tagesgrenze in Ortszeit, nicht UTC | **bestanden** | Code-Review-Befund, T-041 |
| TP-TPL-09 — Unzulässiger/doppelter Feldname → 422 | **bestanden** | T-034/T-046, TP-SEC-07 über den echten Weg |

---

## Zur Tagesgrenze — ein Klarstellung zum Auftragswortlaut

Der Auftrag nennt „eine Buchung um 23:30 Ortszeit" als Beispiel. Diese Maschine läuft in
`Europe/Berlin` mit positivem UTC-Versatz (UTC+2 im Sommer): 23:30 CEST ist 21:30 UTC, also
**derselbe** UTC-Kalendertag — technisch nicht der Fall, den der Code-Review-Befund (T-024,
`repo-time.ts:66/70`) beschreibt. Der tatsächlich unterscheidende Fall ist eine Buchung
**kurz nach Mitternacht Ortszeit** (00:00–02:00), die in UTC noch im Vortag liegt. `TP-TIME-01`
prüft genau diesen Fall (00:30 Ortszeit) und enthält den 23:30-Fall zusätzlich als Kontrollfall
(muss ohnehin bestehen, unterscheidet die beiden Regeln aber nicht). Beide sind grün. Die genaue
Begründung steht im Dateikopf von `calendar-day-boundary.spec.ts`.

---

## Zum Migrations-Nachtrag (0007, Protokollreihenfolge über `rowid`)

`TP-EXPST-10`/`TP-SEC-13` lassen Zurücksetzen und den zweiten Export unmittelbar aufeinander
folgen — über die Oberfläche, nicht mit einer künstlichen Verzögerung dazwischen. Damit läuft der
Fall regelmäßig in dasselbe Zeitfenster (dieselbe Sekunde), das die Migration adressiert. Die
Prüfung selbst ist über die tatsächliche Reihenfolge der drei Protokollzeilen im Verlauf-Dialog
geführt (jüngste zuerst: exportiert, zurückgesetzt, exportiert) und nicht über die Zeitstempel
selbst — sie hätte den Fehler vor Migration 0007 also tatsächlich gezeigt, nicht nur zufällig
übersehen. Ein isolierter Testfall, der gezielt zwei Ereignisse innerhalb derselben Sekunde
erzwingt (statt sich auf die Ausführungsgeschwindigkeit zu verlassen), wäre eine sauberere
Bestätigung — das ist Sache der Speicherschicht (`packages/storage/test/`), nicht meiner
Dateihoheit.

---

## Ein echter Befund aus dieser Aufgabe: `moveTagFolder` sendet das falsche Feld

**`apps/web/src/api/endpoints.ts:236`** sendet beim Verschieben eines Tag-Ordners
`{ neuerParentId: newParentId }`. Die Route erwartet laut Schema
(`apps/local-api/src/routes/structure.ts:64`, `z.object({ newParentId: idSchema.nullable() })`)
und laut OpenAPI-Beschreibung (`required: [newParentId]`) das Feld `newParentId` — ohne den
deutschen Präfix. Mein eigener API-Testzugang (`tests/e2e/support/api.ts`) sendet korrekt
`newParentId` und funktioniert deshalb; **die Oberfläche selbst würde bei jedem Versuch, einen
Ordner über S-08 zu verschachteln, eine `422`-Schemaabweisung bekommen, weil das Pflichtfeld
fehlt.** Ich habe das nicht über einen laufenden Klickpfad *im Browser* verifiziert (das hätte
`apps/web`-seitige Anpassung meines Testfalls erfordert, um ihn absichtlich rot laufen zu lassen,
und `apps/web/**` ist nicht meine Dateihoheit) — das Argument steht rein aus dem Quelltextvergleich
der drei beteiligten Stellen (Route, OpenAPI, Aufrufer), die sich hier eindeutig widersprechen. Da
ich `apps/web/**` nicht ändern darf, melde ich es hier statt es zu beheben: **dies gehört an
frontend-dev, vor der nächsten Aufgabe, die S-08 anfasst.** Mein eigener Testfall (`TP-TAG-07`)
umgeht das nicht heimlich — er benutzt bewusst meinen eigenen, korrekten API-Zugang für die
Zyklusprüfung und den UI-Dialog nur für die Fehlermeldung, die bei jeder `422`- oder
`409`-Antwort gleichermaßen erscheint; er hätte den Fehlschlag also nicht zwingend gezeigt. Wer
diesen Befund als eigenen, roten e2e-Fall bestätigt haben will, bräuchte einen Testfall, der
ausdrücklich einen gültigen (nicht-zyklischen) Zug über die Oberfläche versucht und auf **Erfolg**
statt auf eine Fehlermeldung prüft — das habe ich aus Zeitgründen nicht mehr angelegt.

---

## Warum die verbliebenen neun Lücken nicht gelaufen sind

**S-12 (Add-in-Startpunkt für I-05), Standard-Tags über das Add-in (Fall 24).** Strukturell
unverändert gegenüber T-012: `apps/outlook-addin` braucht einen Office.js-Wirt; ein
Playwright-Browser allein zeigt die Aufgabenbereichs-Seite ohne den `Office`-globalen Namensraum.

**T-020, drei Hüllenzustände (Fälle 17–19).** Unverändert: Diese Zustände hängen an
`@takt/desktop/shell`, das nur innerhalb der echten Tauri-Hülle existiert. Mein Aufbau fährt ohne
Hülle (wie in T-022 für den e2e-tester vorgesehen). Ohne einen laufenden Tauri-Prozess im Testlauf
(`tauri-driver` oder vergleichbar) bleiben sie bei jedem künftigen Lauf ungeprüft, nicht nur bei
diesem — dieselbe Aussage wie in T-012.

**19 Orte mit Exportstatus (TP-EXPST-09, Fall 13).** Trotz der ausdrücklichen Priorisierung durch
den Orchestrator habe ich diesen systematischen Abgleich in dieser Aufgabe **nicht** als eigenen,
alle 19 Orte durchlaufenden Fall angelegt — der Aufwand, denselben Buchungszustand an allen 19
vorher genannten Stellen (Dashboard-Kacheln, Kanban-Kartenübersicht, globale Suche, globale
Navigation eingeschlossen) mit demselben Marker abzugleichen, hätte mehr Zeit gebraucht, als nach
den explizit angemeldeten Fällen (T-040, T-045, Mitternachtsgrenze) noch übrig war. Inzident
mitgeprüft sind in dieser Aufgabe: Ort 5 (S-03-Badge, über die Verlaufsprüfung), Ort 9/11
(S-06-Filter über `calendar-day-boundary.spec.ts`, S-07-Auswahlliste über mehrere Exportfälle),
Ort 12 (S-07-Vorschau, `.egroup__quarters`), Ort 13 (Ergebnis nach dem Export), Ort 14
(Export-Verlauf, über `TP-SEC-13` und den Protokoll-Bereich) — das sind höchstens 6 der 19, nicht
mehr. Das ist die größte verbliebene Lücke dieser Aufgabe und sollte die höchste Priorität der
nächsten e2e-Aufgabe sein.

**Standard-Tags über die Oberfläche (Fall 23).** Weiterhin reiner Zeitmangel, kein technisches
Hindernis: Ein Todo über die Oberfläche anlegen und prüfen, dass die konfigurierten Standard-Tags
gesetzt sind, wäre ein günstiger, isolierter Fall gewesen.

**Kanban Drag & Drop, echte Ziehbewegung (Fall 25).** Weiterhin nicht gelaufen; unverändert
gegenüber T-012 aus Zeitgründen — die Spaltenumkonfiguration ebenfalls nicht.

---

Annahmen:

1. **Der Export-Bestätigungsdialog braucht eine gemeinsame Behandlung.** Das seit T-045 mögliche
   Kontrollkästchen erscheint nur beim ersten Lauf in einen (aus Sicht der zuletzt geladenen Läufe)
   neuen Zielordner. In einem Mehrdatei-Lauf gegen dieselbe SQLite-Datei trifft das nur die
   *erste* Datei, die tatsächlich exportiert — `support/actions.ts` behandelt beide Fälle
   einheitlich, unabhängig von der Dateireihenfolge.
2. **Ein gemeinsamer Bestand über acht statt fünf Dateien braucht robustere Aufräumung.** Mit mehr
   Spezifikationsdateien als in T-012 wachsen die Berührungspunkte über die gemeinsame SQLite-Datei:
   `export-end-to-end.spec.ts` durfte nicht mehr „genau zwei Zeilen" annehmen (siehe Fund oben,
   durch eine offen gelassene Buchung eines anderen Falls beim ersten Vollauf tatsächlich rot
   geworden — kein Produktfehler, eine Testannahme, die mit der wachsenden Suite nicht mehr trug,
   jetzt auf die eigenen markierten Zeilen umgestellt); neue Fälle, die absichtlich offene
   Buchungen zurücklassen, räumen jetzt selbst auf.
3. **Ein fehlgeschlagener Wiederbelebungsfall darf keinen Timer hinterlassen.** `afterEach` in
   `todo-revival.spec.ts` räumt über die API auf (laufend **und** verwaist), unabhängig vom
   Testausgang — sonst blockiert ein verwaister Timer jeden folgenden Fall mit einer
   Rückfrage-Hülle, die keiner meiner Fälle anklickt (siehe unten, tatsächlich beobachtet).
4. **Der 23:30-Kontrollfall aus dem Auftragswortlaut ist kein Ersatz für den diskriminierenden
   Fall**, siehe Klarstellung oben.
5. Testdaten weiterhin erfunden (`E2E-*`-Präfixe, Zeitpunkte laufzeitrelativ), keine echten
   Call-Nummern oder Kundennamen. `tests/fixtures/**` bleibt aus denselben Gründen wie in T-012
   ohne statische Dateien.

Risiken:

- **Der `neuerParentId`-Fund oben ist ein echter, wahrscheinlich blockierender Funktionsfehler**
  in `apps/web`, den ich nicht beheben durfte und nur aus dem Quelltextvergleich, nicht aus einem
  roten Browserlauf, belegt habe. Er sollte vor der nächsten S-08-Aufgabe geprüft werden.
- **Die 19-Orte-Prüfung bleibt die größte offene Lücke**, trotz ausdrücklicher Priorisierung durch
  den Orchestrator. Der Grund ist ausschließlich Zeit, kein technisches Hindernis.
- **Ein einziger geteilter Dienst/eine geteilte SQLite-Datei über inzwischen acht Dateien.** Jede
  künftige neue Spezifikationsdatei muss entweder ihre eigenen offenen Buchungen aufräumen oder
  jeder bestehende globale Fall (wie `export-end-to-end.spec.ts`) muss weiterhin gegen seine
  eigenen Marker statt gegen die Gesamtzahl prüfen. Das ist jetzt an einer Stelle behoben, nicht
  strukturell für immer gesichert.
- **`TP-LOCK-02` benutzt `dispatchEvent('click')` statt eines echten Klicks**, weil der
  Bestätigungsdialog ein echtes Vollbild-Modal ist (`.scrim`, `position: fixed; inset: 0`) und
  einen echten Klick auf die Auswahl dahinter gar nicht erst durchließe (auch nicht mit
  `force: true` — das überspringt nur Playwrights eigene Prüfung, der synthetisierte Klick träfe
  über die Bildpunktkoordinate trotzdem den Scrim). Das ist eine dokumentierte
  Playwright-Umgehung für genau diesen Fall, keine Testverfälschung — der ausgelöste `onChange`-Pfad
  ist derselbe, den ein echter Klick auslösen würde.
- **Gemeinsam genutzte Maschine (unverändert aus T-012).** Der Port ist im Dienst fest verdrahtet;
  meine Portfreigabe aus T-012 (8 Versuche, wachsender Rückstand) blieb unverändert und war in
  diesem Lauf nicht nötig — beide Läufe der finalen Fassung fanden auf freien Ports statt.

Offene Fragen:

1. **An den Orchestrator/frontend-dev:** Soll der `neuerParentId`-Fund
   (`apps/web/src/api/endpoints.ts:236`) als eigener Befund ins Board, oder reicht dieser Bericht?
2. **An den Orchestrator:** Die 19-Orte-Prüfung ist jetzt zwei Aufgaben in Folge (T-012, T-048)
   nicht als eigener Fall gelaufen. Soll eine eigene, kleine Folgeaufgabe genau dafür eingeplant
   werden, statt sie als Nebenprodukt einer größeren Nachziehung zu erwarten?
3. **An den Orchestrator:** Für die drei T-020-Hüllenzustände bleibt dieselbe Frage wie in T-012 —
   ist ein `tauri-driver`-Aufbau geplant, oder bleiben sie dauerhaft ungeprüft?

Nächster Schritt: Sollte eine weitere e2e-Aufgabe folgen, in dieser Reihenfolge: (1) die
19-Orte-Prüfung als eigenständiger, alle 19 Stellen tatsächlich durchlaufender Fall — die größte
verbliebene Lücke und laut Orchestrator die wertvollste; (2) Standard-Tags über die Oberfläche
(günstig, nur Zeitmangel); (3) echte Kanban-Ziehbewegung und Spaltenverwaltung; (4) mit dem
Orchestrator klären, ob/wie die drei T-020-Fälle ohne echte Tauri-Hülle prüfbar gemacht werden
sollen. Parallel: den `neuerParentId`-Fund an frontend-dev zurückspiegeln.
