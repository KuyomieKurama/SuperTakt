# T-215 — domain-dev

**Aufgabe:** T-215 (Welle AG) — Eine Route, die mit dem Add-in-Token erreichbar ist, und zwei
Wächter, die das Gegenteil behaupten. Umsetzung von A-A-51 bis A-A-55 aus
`docs/bedrohungsmodell.md` Abschnitt 28.

**Status:** fertig

---

## Artefakte

| Datei | Änderung |
|---|---|
| `apps/local-api/scripts/proof-route-policy.mjs` | A-A-51 (Weigerung über die Routenliste), A-A-55 (die Regel, einmal ausgeschrieben) |
| `apps/local-api/scripts/proof-openapi.mjs` | A-A-51 (dieselbe Weigerung), A-A-52 (Untergrenze der Vermerksmessung), A-A-53 (einseitige Aufzählung), Verweis auf A-A-55 |
| `apps/local-api/scripts/proof-template-fields.mjs` | A-A-54 (der Angriff wird zurückgelesen; `validation_error` statt `>= 400`), Verweis auf A-A-55 |

Kein Produktivcode berührt. Keine Route, kein Schema, keine Migration, kein Domänentyp geändert.
`apps/local-api/src/routes/addin/**` nicht angefaßt.

---

## Zusammenfassung

Der Befund T-206-1 ist vor der Behebung nachgestellt und bestätigt worden: eine Zeile
`api.all('/addin/leak', …)` im Spiegel ist mit dem Add-in-Token **200** samt Rumpf, mit dem
Sitzungsgeheimnis 200, ohne Nachweis 401 — und `proof:route-policy` blieb dabei bei **40/0, Code
0**, `proof:openapi` bei **110/0, Code 0**. Beide Läufe weigern sich jetzt, über die Routenliste
zu urteilen, solange ein `ALL`-Eintrag ohne Platzhalter darunter liegt; die Weigerung steht **vor**
den vier Zusicherungen, die sie schützt. Dazu sind die drei Zusicherungen behoben, die ihre eigene
Vorbedingung nicht prüften: die Vermerksmessung in `proof:openapi` bestand über der leeren Menge
(A-A-52), die Aufzählung wurde nur verglichen, wenn beide Seiten eine hatten (A-A-53), und
Abschnitt 5 von `proof:template-fields` bestand auch dann, wenn der eingeschmuggelte Datensatz nie
ankam (A-A-54). Jede der vier Behebungen ist in **beide** Richtungen gemessen: sauberer Baum grün
ohne falschen Alarm, eingesetzte Verletzung rot mit Beendigungscode 1 und mit der Meldung, die die
Auflage vorhersagt.

---

## Messungen

### Wie gemessen wurde

Wie in T-176, T-183, T-189 und T-206: am Verhalten, außerhalb des Bestands. Ein Spiegel unter
`/tmp/t215-spiegel` mit dem vollständigen Baum von `apps/local-api`, ein Symlink auf den echten
Modulbestand (`node_modules`), Kunstquellen und Verstümmelungen **nur** im Spiegel. Nach jeder
Messung ist der Spiegel zurückgesetzt und gegen die Ausgangszahlen nachgefahren worden. Der
Spiegel ist am Ende gelöscht.

**Die Prüfzeilen des Spiegels sind zeichengleich mit denen des Bestands** — gemessen über eine
Prüfsumme aller `ok`/`FEHL`-Zeilen, nach der Behebung:

| Lauf | Spiegel | Bestand |
|---|---|---|
| `proof:route-policy` | `663e9e2e70fe9327` | `663e9e2e70fe9327` |
| `proof:openapi` | `19614ce4761849ee` | `19614ce4761849ee` |
| `proof:template-fields` | `70d427f0a1422da1` | `70d427f0a1422da1` |

`proof:all` **nicht** gefahren (E-083 Punkt 3), einzelne Pfade schon.

### Der Befund, nachgestellt (T-206-1)

Kunstquelle im Spiegel, eine Zeile in `src/app.ts` unmittelbar vor `app.route(API_BASE_PATH, api)`:
`api.all('/addin/leak', (c) => c.json({ data: { leak: 'GEHEIMER-INTERNER-VERMERK' } }));`

| Aufruf | gemessen |
|---|---|
| `GET /api/v1/addin/leak` mit **Add-in-Token** | **200**, `{"data":{"leak":"GEHEIMER-INTERNER-VERMERK"}}` |
| dasselbe mit Sitzungsgeheimnis | 200 |
| dasselbe ohne gültigen Nachweis | 401 |
| `proof:route-policy` dabei | **40 bestanden, 0 fehlgeschlagen, Code 0** |
| `proof:openapi` dabei | **110 bestanden, 0 fehlgeschlagen, Code 0** |

Deckungsgleich mit 28.2.1. Im unveränderten Baum: **10** `ALL`-Einträge, jeder auf `/*`, also
jeder mit Platzhalter — die Behebung kostet heute keinen falschen Alarm.

### Zahlen vorher und nachher

| Lauf | vorher | nachher | Beendigungscode |
|---|---|---|---|
| `pnpm typecheck` | 0 Fehler | **0 Fehler** | 0 |
| `pnpm test` | 77 Dateien, 1464 grün | **77 Dateien, 1464 grün** | 0 |
| `pnpm run boundaries` | sauber | **sauber** („Notiz-Trennung: alle Schichten unverletzt") | 0 |
| `pnpm run proof:route-policy` | 40/0 | **41/0** | 0 |
| `pnpm run proof:openapi` | 110/0 | **112/0** | 0 |
| `pnpm run proof:template-fields` | 30/0 | **30/0** | 0 |
| `pnpm run proof:codepoints` | 45/0 | **45/0** | 0 |

`proof:route-policy` 40 → 41 und `proof:openapi` 110 → 112: je eine Zeile für A-A-51, dazu eine
für A-A-52 in `proof:openapi`. A-A-53 und A-A-54 fügen keine Zeile hinzu, sie verankern
vorhandene. Die von A-A-51 und A-A-52 vorhergesagten Zahlen (41/0 und 111/0 je einzeln gemessen)
addieren sich zu 112/0 — sie stimmen.

### Gegenproben: jede Behebung einmal rot gesehen

| Auflage | eingesetzte Verletzung | Ergebnis | Beendigungscode |
|---|---|---|---|
| **A-A-51** (route-policy) | `api.all('/addin/leak', …)` | **40/1**, `FEHL  kein ALL-Eintrag ohne Platzhalter … — mit ALL registriert und damit aus der Liste gefallen: /api/v1/addin/leak` | **1** |
| **A-A-51** (openapi) | dieselbe Zeile | **111/1**, dieselbe Meldung mit demselben Pfad | **1** |
| **A-A-52** | alle drei `INTERNAL_NOTE` im Durchlauf ersetzt | **111/1**, Meldung `0: ` | **1** |
| **A-A-52** | nur die erste Stelle ersetzt | **111/1**, Meldung `1: putTodoNote` | **1** |
| **A-A-52** | nur die zweite Stelle ersetzt | **111/1**, Meldung `1: getTodoNote` | **1** |
| **A-A-53** | `enum` aus `theme` in der Beschreibung entfernt | **111/1**, `updateSettings.theme: Aufzählung [dark\|light\|system] wird erzwungen, aber nicht beschrieben` | **1** |
| **A-A-53** | `z.enum([...])` → `z.string()` im Dienst | **111/1**, `updateSettings.theme: Aufzählung [dark\|light\|system] ist beschrieben, aber wird nicht erzwungen` | **1** |
| **A-A-53** | YAML-Leser läßt jeden Schlüssel `enum` fallen | **111/1**, **fünf** Fundstellen: `createPool.matchMode`, `updatePool.matchMode`, `resetExportStatus.status`, `resolveOrphanedTimer.resolution`, `updateSettings.theme` | **1** |
| **A-A-54** | der `INSERT` unterbleibt | **25/5** — die drei bisher stillen Zeilen sind jetzt die roten: „keine Zeile", zweimal `Status 404 … not_found` | **1** |
| **A-A-54** | `INSERT` mit unverdächtiger Definition | **22/8**, Meldung `gelesen: {"version":1,"fields":[{"name":"Call",…}]}` | **1** |

Die dritte A-A-53-Gegenprobe ist die aussagekräftigste: derselbe Eingriff, der vor der Behebung
110/0 ergab (28.2.3, Messung 1), findet jetzt fünf verschwiegene Aufzählungen über fünf
verschiedene Rumpfschemata. Der Wächter hängt also nicht an `theme`.

Die drei Stellen der A-A-52-Gegenprobe verhalten sich nicht gleich: Die dritte
(`INTERNAL_NOTE` beim zweiten Todo) trägt zu **keiner** Antwort bei, ihr Wegfall ändert die Zahl
zwei nicht. Das ist kein Loch — die Zusicherung mißt Antworten, nicht Eingaben — aber es
korrigiert die Tabelle in 28.2.2 leicht: Von den drei Stellen sind **zwei** tragend, nicht drei.

---

## Annahmen

1. **„Platzhalter" heißt `*` oder `:name`.** `hasPlaceholder(path)` prüft
   `path.includes('*') || /:[A-Za-z0-9_]/.test(path)`. Beides ist Hono-Schreibweise für ein
   Kettenglied beziehungsweise einen Wegabschnitt; ein genauer Pfad hat keines von beiden. Der
   Bestand führt heute zehn `ALL`-Einträge, alle auf `/*`.
2. **Die Weigerung ist eine rote Prüfzeile, kein Abbruch.** A-A-51 verlangt „rot, Code 1, und die
   Meldung nennt den Pfad" — das leistet die Zeile. Sie steht **vor** den vier Zusicherungen, die
   sie schützt, damit die Ausgabe in der Reihenfolge gelesen werden kann, in der sie gilt. Ein
   harter Abbruch hätte die restliche Messung verschluckt, und damit die Frage „was noch?".
3. **A-A-51 steht in beiden Dateien einzeln, nicht als gemeinsames Modul.** So hat der Prüfer es
   beziffert („dieselbe Änderung in zwei Dateien, je ein Prüfsatz"), und beide Läufe sind
   eigenständig fahrbar. Die Bedingung ist in beiden Dateien zeichengleich formuliert, die
   Prüfzeile trägt in beiden denselben Wortlaut.
4. **Die Ausnahme von A-A-53 hängt an der Beschreibungsseite**, wie bei den Facetten darüber:
   `!isNamed(specSchema.properties[name])`. Sie gilt für **beide** Richtungen der einseitigen
   Aufzählung — A-A-53 sagt „dieselbe Ausnahme", und die Facetten kennen nur diese eine.
   Gemessen: kein falscher Alarm über alle Rumpfschemata.
5. **`validation_error` ist der richtige Schlüssel** für A-A-54. Nicht angenommen, sondern
   gemessen: Mit dem `INSERT` antworten Vorschau und Lauf mit genau diesem Schlüssel (30/0), ohne
   ihn mit `not_found` (25/5).
6. **Der Vergleich in A-A-54 ist zeichengleich** (`String(stored['definition']) === smuggled`),
   nicht semantisch. Eine Definition, die dieselbe Bedeutung anders schreibt, wäre nicht die, die
   eingesetzt wurde — und der Abschnitt urteilt über genau die eingesetzte.
7. **A-A-55 steht im Kopf von `proof-route-policy.mjs`**, wie die Auflage es vorschreibt;
   `proof-openapi.mjs` und `proof-template-fields.mjs` verweisen darauf und nennen je, welche
   ihrer Stellen die Anwendung ist. Keine Messung, ein Satz.

---

## Risiken

1. **Der offene Rest von A-A-51 — ein Endpunkt auf einem Platzhalter.** `api.all('/addin/*', …)`
   ist am Pfad allein von einem Kettenglied **nicht** zu unterscheiden und umgeht diesen Wächter
   weiterhin. Ich habe die naheliegende Verschärfung geprüft und **verworfen**: Kettenglieder
   nehmen `(c, next)` und haben damit Stelligkeit 2, Endpunkte `(c)` und Stelligkeit 1 — gemessen,
   alle zehn Kettenglieder des Bestands haben 2, der eingesetzte Endpunkt 1. Aber die
   Unterscheidung läßt sich durch die Schreibweise des Handlers aushebeln (`api.all('/x', async
   (c, next) => …)`), und eine unsichere Heuristik in einem Wächter, dessen ganzer Zweck
   Sicherheit ist, ist schlechter als ein benannter Rest. Der Rest steht deshalb ausgeschrieben im
   Kommentar von `proof-route-policy.mjs` und hier. **Für security-checker.**
2. **Die Weigerung mißt die Liste, nicht die Fläche.** Sie sagt „diese Liste ist unvollständig",
   nicht „diese Route ist offen". Wer den Wächter rot sieht, muß den genannten Pfad selbst
   bewerten. Das ist Absicht — der Lauf kann eine `ALL`-Route nicht sinnvoll anfahren, ohne über
   ihre Methode zu raten.
3. **A-A-53 ist heute ohne falschen Alarm, aber sie ist eine neue Grenze.** Wer künftig eine
   `z.enum(...)` einführt, ohne sie zu beschreiben, bekommt `proof:openapi` rot. Das ist der
   Zweck; es ist aber eine Zusatzpflicht, die vorher nicht bestand und die niemand kennt, bis sie
   ihn trifft. Sie steht im Kommentar an der Stelle, an der sie greift.
4. **Kein Sicherheitsrisiko neu entstanden.** Keine zweite Adresse außerhalb `127.0.0.1` (E-001),
   kein Produktivcode berührt, keine Route hinzugefügt, keine Vertrauensgrenze verschoben. Die
   Kunstquellen sind ausschließlich im Spiegel entstanden und mit ihm gelöscht; der Bestand führt
   die Zeichenkette `addin/leak` nicht.
5. **Der Bestand führt heute keine `all`-Route.** Gesucht über beides (E-087): `git grep` **und**
   ein roher Lauf über `apps/*/src`, `packages/*/src` — kein einziges `.all(` als
   Routenregistrierung, nur `Promise.all`. Auch nicht in `apps/local-api/src/routes/addin/**`, dem
   Bereich von integration-dev. **Es gibt dort nichts zu melden.**

---

## E-087 — Suche nach dem Wortlaut, vor der Umbenennung

Zwei Prüfzeilen haben ihren Wortlaut geändert:

- „die Vorschau gegen die eingeschmuggelte Vorlage bricht ab" → „… **— mit validation_error**"
- „der Exportlauf bricht ab, statt das Feld still auszulassen (B-3.1 Punkt 4)" → „der Exportlauf
  bricht **mit validation_error** ab, statt …"

Gesucht über den **Wortlaut** und über **beides**, versionierte Dateien (`git grep -F`) und
Quellverzeichnisse (`apps/*/src`, `packages/*/src`, `tests/`, `apps/*/test`, `packages/*/test`,
`docs/`, `.claude/`; Bauergebnisse ausgeschlossen). Ergebnis: **kein Prüffall, kein Nachweispfad
und kein Skript nagelt eine der beiden Zeilen fest.** Die Fundstellen sind ausschließlich
`docs/bedrohungsmodell.md` (Abschnitt 28, wo der Prüfer den **alten** Zustand als Befund zitiert —
das bleibt als Beleg stehen) und zwei ältere Berichte. Dasselbe für „die Vorlage steckt an jeder
Prüfung vorbei", „die Routenliste des Dienstes ist auslesbar" und „der interne Vermerk steht in
keiner Antwort": nur Papier, kein Träger.

---

## Offene Fragen

1. **An security-checker: reicht A-A-51 in der gebauten Fassung, oder braucht der Rest aus Risiko 1
   eine eigene Auflage?** Ein `ALL`-Endpunkt auf einem Platzhalter bleibt unsichtbar. Ich habe die
   Verschärfung über die Stelligkeit gemessen und als unsicher verworfen; die Entscheidung
   darüber gehört nicht zu mir. Eine tragfähige Alternative wäre eine ausdrückliche Aufstellung
   der zehn erlaubten Kettenglieder im Lauf — dann wäre **jeder** neue `ALL`-Eintrag ein Befund,
   auch der mit Platzhalter. Das kostet eine gepflegte Liste, also genau das, wogegen dieser Lauf
   gebaut ist. Deshalb nicht von mir entschieden.
2. **An security-checker: die Tabelle in 28.2.2 zählt drei tragende Stellen, gemessen sind es
   zwei.** Die dritte `INTERNAL_NOTE`-Stelle in `service-scenario.mjs` erscheint in keiner
   Antwort; ihr Wegfall ändert die Zahl zwei nicht. Die Behebung A-A-52 ist davon unberührt, die
   Beschreibung des Befunds leicht. Zur Kenntnis, nicht als Widerspruch.
3. **An den Orchestrator: A-A-50 ist offen und liegt nicht bei mir.** Drei Sätze bekommen je eine
   Zusicherung; zwei davon in `apps/web/src/components/NoteField.tsx` (frontend-dev, unit-tester),
   der dritte — „Die Quelle für das Feld „Notiz" der Standardvorlage." — steht in
   `apps/local-api/src/usecases/export-catalog.ts` und damit **in meiner Hoheit**, der Prüffall
   dazu aber in `apps/local-api/test/**` und damit in der von unit-tester. Der Satz steht heute
   unverändert da; ich habe ihn nicht angetastet. Er ist nach 28.1.3 B-3 die Bedingung dafür, daß
   Satz 2 der Fußnote „Leistung" fallen darf.
4. **An den Orchestrator: keine Änderung an gemeinsamen Dateien nötig.** Kein neuer
   `package.json`-Eintrag, keine Modulregistrierung, keine Migration.

---

## Nächster Schritt

**Vorschlag:** security-checker nimmt A-A-51 bis A-A-55 ab und beantwortet die offenen Fragen 1
und 2. Parallel dazu A-A-50 in einer eigenen Aufgabe an unit-tester (Prüffall für den Satz in
`export-catalog.ts`) und an frontend-dev/unit-tester (die zwei Sätze in `NoteField.tsx`) — mit
dem Hinweis, daß eine Kürzung von Satz 2 der Fußnote „Leistung" erst **nach** A-A-50 gedeckt ist
und nur unter B-1 bis B-3 aus 28.1.3.
