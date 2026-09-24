Aufgabe: T-397a — Weigerungsregel in drei Nachweisläufen und Prüfport aus der Umgebung (zweite Runde 2026-09-25: Check gegen hartkodierten Port)
Status: braucht Review
Artefakte:
Zweite Runde (2026-09-25):
- `apps/local-api/scripts/port-probe.mjs` — neu `findHardcodedPorts(source)` und `checkNoHardcodedPort(check, filePaths)`; das Muster wird aus der einzigen Produktkonstante `PRODUCT_API_PORT` abgeleitet
- `apps/local-api/scripts/proof-access.mjs` — neuer Abschnitt „Port aus TAKT_PROOF_PORT, nicht hartkodiert“ vor dem ersten Dienststart; zwei Kommentare nennen den Port nicht mehr als Zahl
- `apps/local-api/scripts/proof-export-api.mjs` — derselbe Abschnitt vor dem Dienststart
- `apps/local-api/scripts/proof-export.mjs` — Abschnitt „Kein hartkodierter Port“ (der Lauf bindet keinen Port)
- `apps/local-api/scripts/proof-access-entry.ts` — zwei Kommentare nennen den Port nicht mehr als Zahl
- dieser Bericht
Erste Runde (2026-09-24, unverändert, in T-406a Punkt 7 sicherheitlich freigegeben):
- `port-probe.mjs` `proofPort()`, `proof-access-entry.ts` mit `port`/`taskpanePort = port + 1`, W-1…W-14 in den drei Läufen, `src/main.ts` `MainOptions.port`/`taskpanePort` (nachträglich genehmigt, E-128 Punkt 1)

Zusammenfassung: Die Weigerungsregel W-1…W-14 und der Prüfport aus `TAKT_PROOF_PORT` standen seit der ersten Runde und sind in T-406a freigegeben. Neu ist ein Check in allen drei Läufen: Er meldet rot, wenn der Lauf oder sein Prüfeinstieg einen Produktport als Zahl (17843/17844) oder als Konstante (`DEFAULT_PORT`/`TASKPANE_PORT`) nennt. Vorher laufen zwei Anker, damit ein blinder Scanner rot statt grün meldet (E-121 Punkt 10).

Prüfung:
- `TAKT_PROOF_PORT=18843`: `proof:access` 127/0, Exit 0. Die Selbstauskunft des Dienstes nennt `127.0.0.1:18843`. `proof:export-api` 79/0, Exit 0.
- Ohne Variable, also Vorgabe 17843, vorher mit `ss -ltn` als frei gemessen: `proof:access` 127/0 und `proof:export-api` 79/0, beide Exit 0; Selbstauskunft `127.0.0.1:17843`. `proof:export` 103/0, Exit 0.
- Die Zahlen gegenüber der ersten Runde (123/75/100): je Lauf +3 bzw. +4 neue Zeilen (Anker, Gegenprobe, je gescannte Datei).
- Gegenprobe außerhalb des Laufs: eine Kopie von `proof-access-entry.ts` mit `const port: number = 17843;` wurde durch dieselbe Funktion gescannt. Ergebnis: genau eine rote Zeile („104: const port: number = 17843;“). Die Kopie lag unter `/tmp/claude-1000/t397a/`, das Probeskript wurde danach gelöscht.
- Gegenprobe im Lauf selbst: Ein Muster mit vier verbotenen Formen muss genau vier Treffer geben. Dazu kommt eine Negativzeile: `proofPort()` und die längere Zahl `178430` dürfen nicht treffen.
- Anker im Lauf: Die Produktports in `port-probe.mjs` müssen denen in `src/config.ts` gleichen. Sonst würde der Scanner nach der falschen Zahl suchen.
- `TAKT_PROOF_PORT=abc` (export-api) und `=80` (access): beide Exit 1, kein Rückfall auf 17843.
- `pnpm --filter @takt/local-api typecheck` Exit 0; Wurzel-`pnpm typecheck` Exit 0.
- `pnpm boundaries` Exit 0; `proof:release-safety` 158/0.
- Nicht geprüft: macOS und Windows, weil kein Läufer da war. Der neue Check ist reiner Dateiinhalt und hängt nicht von der Plattform ab. Nicht gefahren: `pnpm check` als Ganzes.

Annahmen:
- „Nicht hartkodiert“ messe ich statisch am Quelltext. Zur Laufzeit ist es mit der Vorgabe 17843 nicht unterscheidbar: Eine hartkodierte 17843 bestünde die Selbstauskunft genauso. Mit gesetzter Variable misst die bestehende Selbstauskunftszeile die Laufzeitseite.
- Gescannt werden die drei Läufe und `proof-access-entry.ts`, nicht `port-probe.mjs`. Dort steht die Vorgabe 17843 absichtlich als einzige Stelle.
- Kommentare zählen mit. Vier Kommentarstellen, die den Port als Zahl nannten, sind umformuliert, und zwar nur diese Halbsätze. Die umgebenden deutschen Blöcke habe ich nicht übersetzt, weil die Aufgabe sie sonst nicht berührt.
- `proof:export` bindet keinen Port (am Quelltext gelesen: kein `createServer`, kein `listen`, kein `createConnection`). Es liest deshalb auch kein `TAKT_PROOF_PORT` (E-131 Punkt 2). Der Check hält nur fest, dass dort kein Port auftaucht.
- „Nur für parallele Läufe setzen“ (E-128 Punkt 2) gilt unverändert: Ohne Variable fahren die Läufe auf 17843, und gemessen ist das oben.

Risiken:
- Benannter blinder Fleck: Ein Port in anderer Schreibweise (`0x45f3`, `17_843`, `17842 + 1`, zusammengesetzte Zeichenkette) wird nicht gefunden. Das steht im Docstring von `checkNoHardcodedPort`.
- Andere Portzahlen (etwa 18843 hartkodiert) findet der Scanner nicht. Das misst er aber auch nicht: Die Zusage aus E-121 Punkt 8 betrifft den Produktport.
- `port-probe.mjs` lädt jetzt `src/config.ts` dynamisch. Das braucht Nodes TypeScript-Ausführung, die die Läufe ohnehin nutzen. Ausgeliefert wird die Datei nicht (`scripts/`, außerhalb von `SOURCE_ROOTS`; `proof:release-safety` grün).
- Sicherheit: keine neue Fläche. Nichts bindet, nichts geht nach außen, gelesen werden nur eigene Quelldateien.

Offene Fragen:
1. Sollen die übrigen portgebundenen Läufe aus T-397b (`proof-tags`, `-conflicts`, `-addin-wiring`, `-db-permissions`, `proof-taskpane`) denselben Check bekommen? Die Funktion liegt in `port-probe.mjs` und ist je Lauf ein Aufruf. Das wäre eine eigene kleine Aufgabe.
2. Die erste Runde samt diesem Nachtrag ist noch nicht versioniert (Arbeitsbaum). Der Commit ist Sache des Orchestrators.

Nächster Schritt: security-checker prüft die zweite Runde gegen E-121 Punkt 10, in derselben Art wie T-406a Punkt 7: Anker und Gegenprobe lesen, einmal mit einer hartkodierten Kopie rot sehen. Danach, falls gewünscht, eine Folgeaufgabe für die übrigen portgebundenen Läufe.
