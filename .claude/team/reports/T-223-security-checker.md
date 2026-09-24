# T-223 — security-checker

**Aufgabe:** T-223 (Welle AH) — Abnahme von A-A-51 bis A-A-55, Entscheidung über den offenen Rest,
Berichtigung einer Zahl in 28.2.2, und die Weigerungsregel an `proof:export`, `proof:export-api`
und `proof:access`.

**Status:** fertig — **Abnahme freigegeben, Prüfung insgesamt Nacharbeit**

---

## Artefakte

| Datei | Änderung |
|---|---|
| `docs/bedrohungsmodell.md` | Abschnitt **29** neu (29.0 bis 29.7): Abnahme, Entscheidung zum Rest, Berichtigung von 28.2.2 und 28.1.1, vier neue Befunde, fünf neue Auflagen |
| `.claude/team/reports/T-223-security-checker.md` | dieser Bericht |

**Kein Produktivcode berührt, kein Nachweispfad geändert.** Alle Kunstquellen und Verstümmelungen
sind ausschließlich im Spiegel unter `/tmp/t223` entstanden und mit ihm gelöscht.

---

## Zusammenfassung

**A-A-51 bis A-A-55 sind erfüllt** — alle zehn Gegenproben des Erbauers eigenständig nachgefahren,
dazu der Befund selbst nachgestellt: `api.all('/addin/leak', …)` antwortet dem Add-in-Token mit
200 samt Rumpf, dem Sitzungsgeheimnis mit 200, ohne Nachweis mit 401, und beide Wächter sind
jetzt rot mit Code 1 und nennen den Pfad. Zahlen bestätigt: 41/0, 112/0, 30/0. **Der offene Rest
reicht nicht und bekommt A-A-56**: Ich habe ihn in **drei** statt einer Form gemessen — alle
erreichbar, beide Läufe voll grün, zwei davon auf der Fläche des Add-in-Tokens — und die vom
Erbauer als einzige Alternative gedachte gepflegte Aufstellung durch **eine benannte Zahl** ersetzt,
die auf allen fünf Kunstquellen rot und auf dem unveränderten Baum grün ist. **Die Zwei stimmte:**
Von den drei `INTERNAL_NOTE`-Stellen sind zwei tragend, die dritte schreibt über die Add-in-Route
und erscheint in keiner Antwort; berichtigt mit Marke. **Auf O-JV ist die Antwort erneut ja, und
sie ist teurer als in T-206**: Drei der vier neuen Befunde liegen an der Notiz-Grenze und an B-2.4
— `proof:export` und `proof:export-api` sagen beide, der interne Vermerk stehe nirgends, und beide
sagen es genauso, wenn es ihn gar nicht gibt.

---

## Wie gemessen wurde

Am Verhalten, außerhalb des Bestands, wie in T-176, T-183, T-189 und T-206. Der Spiegel unter
`/tmp/t223/root/apps/local-api` trägt **die Gestalt des Arbeitsbereichs**, nicht nur die des
Pakets — `packages` und `node_modules` als Verweise auf die echten —, sonst löst keine relative
pnpm-Verknüpfung auf und kein Nachweispfad läuft.

Zeichengleichheit doppelt belegt: `diff -rq` über `src`, `scripts`, `openapi` ohne Unterschied, und
eine Prüfsumme aller `ok`/`FEHL`-Zeilen vor der ersten und nach der letzten Messung — identisch:
`route-policy f0030ef14f0f9722`, `openapi f8e9e839d7906fe9`, `template-fields 96f7112191785dcb`.

**Nicht gefahren:** `proof:all` (E-083 Punkt 3). **Nicht versucht:** Guardian und 42Crunch (E-079
Punkt 3) — **zwölftes** Mal ohne Werkzeug.

**Nicht fahrbar:** die schärfere zweite Gegenprobe zu `proof:access` Abschnitt 13 (Aufspaltung von
`verifier.ts`). Fünf Anläufe, fünfmal `Auf 127.0.0.1:17843 lauscht bereits etwas`. Das ist
**E-083 Punkt 2**: In dieser Welle laufen portgebundene Nachweispfade neben dem e2e-Lauf. Der
Befund T-223-5 steht ohne sie, weil die erste Fassung ihn trägt.

---

## Messungen

### Abnahme — jede Zahl des Erbauers eigenständig nachgefahren

| Auflage | Gegenprobe | mein Ergebnis |
|---|---|---|
| A-A-51 | `api.all('/addin/leak', …)` | `route-policy` **40/1 Code 1**, `openapi` **111/1 Code 1**, beide nennen `/api/v1/addin/leak` |
| A-A-52 | Stelle 1 / Stelle 2 / alle drei | **111/1** mit `1: putTodoNote` / `1: getTodoNote` / `0: ` |
| A-A-53 | `enum` aus der Beschreibung | **111/1**, „wird erzwungen, aber nicht beschrieben" |
| A-A-53 | `z.enum` → `z.string()` im Dienst | **111/1**, „ist beschrieben, aber wird nicht erzwungen" |
| A-A-53 | Leser läßt jeden `enum` fallen | **111/1**, **fünf** Fundstellen über fünf Rumpfschemata |
| A-A-54 | ohne den `INSERT` | **25/5 Code 1**, die drei bisher stillen Zeilen sind die roten |
| A-A-54 | unverdächtige Definition | **22/8 Code 1** |
| — | unveränderter Baum | **41/0**, **112/0**, **30/0**, alle Code 0 |

### Der offene Rest — drei Formen, alle erreichbar, beide Wächter grün

| Kunstquelle | Add-in-Token | `route-policy` | `openapi` |
|---|---|---|---|
| `api.all('/addin/leak/:id', …)` | **200** samt Rumpf | 41/0 Code 0 | 112/0 Code 0 |
| `api.all('/addin/*', …)` | **200** samt Rumpf | 41/0 Code 0 | 112/0 Code 0 |
| `api.all('/*', …)` | 401 (Sitzung: **200**) | 41/0 Code 0 | 112/0 Code 0 |

Stelligkeit nachgemessen: zehn Kettenglieder **2**, eingesetzter Endpunkt **1** — die Angabe des
Erbauers stimmt, sein Urteil über ihre Untauglichkeit auch.

### Drei Regeln gegen fünf Kunstquellen

| Kunstquelle | R1 „Platzhalter genügt" (gebaut) | R2 „Pfad ist genau `/*`" | R3 „Anzahl ist 10" |
|---|---|---|---|
| *unveränderter Baum* | grün | grün | grün |
| `api.all('/addin/leak', …)` | rot | rot | rot |
| `api.all('/addin/leak/:id', …)` | **grün** | rot | rot |
| `api.all('/addin/*', …)` | **grün** | rot | rot |
| `api.all('/*', …)` | **grün** | rot | rot |
| `app.all('/*', …)` Wurzel-App | **grün** | **grün** | rot |

### Die Durchgriffsprobe — gemessen, wirksam, nicht ausreichend

Jeder `ALL`-Eintrag in einen nirgends registrierten Pfad übersetzt und mit gültigem Nachweis
aufgerufen: die zehn Kettenglieder **404** (durchgereicht), drei der vier Endpunkt-Formen **200**
(gefangen). **Nicht gefangen:** ein Endpunkt, dessen Handler einen Datensatz nachschlägt und für
eine erfundene Kennung 404 antwortet — gemessen, obwohl er mit dem Add-in-Token 200 samt Rumpf
liefert. Deshalb Hilfe, nicht Bedingung.

### O-JV — die vier neuen Befunde

| Lauf | Verstümmelung | Ergebnis |
|---|---|---|
| `proof:export` | `note: ''` statt des Vermerks | **97/0, Code 0**, „der interne Vermerk steht nirgends in der Datei (A-7.2, R-06)" **grün** |
| `proof:export-api` | `note: 'harmlos, kein Vermerk'` | **69/0, Code 0**, beide Notiz-Zeilen **grün** |
| `proof:export-api` | `stdout`/`stderr` leer | **69/0, Code 0**, „auch nicht in der Ausgabe des Dienstes" und B-2.4 **grün** |
| `proof:access` | `===` auf Geheimnismaterial in `src/access/token-store.ts` | **105/0, Code 0**, „Kein === auf Tokenmaterial im Nachweispfad" **grün** |

### Vier gemessene Fehlschläge

1. `proof:access` **weigert sich bereits**, wenn eine durchsuchte Datei fehlt: harter Abbruch mit
   `ENOENT`, Code 1. Erwartet hatte ich ein stilles Überspringen.
2. Die Auswahlliste in `proof:export-api` ist **sauber verankert** — `paths.length ===
   EXPORT_SOURCE_PATHS.length` und der wörtliche Mengenvergleich stehen über dem `every`.
3. Die `every`-Zusicherungen in `proof:export` sind durch Zählungen daneben verankert
   (`openCandidates === 3`, `auditCount === 3`, `entries.length === 3`, `threw`).
4. `proof:access` Abschnitt 12 trägt die Regel **ausgeschrieben, Wellen vor ihrer Formulierung**:
   „In allen 55 Antwortkörpern stehen genau 2 Tokens — die beiden Erzeugungen". Im selben Lauf, in
   dem Abschnitt 13 sie nicht trägt.

---

## Annahmen

1. **„Abnahmefähig" heißt: jede Zahl des Erbauers eigenständig nachgefahren, nicht gelesen.** Zehn
   Gegenproben plus die Nachstellung des Befunds selbst. Keine Zahl aus dem Bericht übernommen.
2. **Die grün bleibenden Zeilen neben der roten Weigerung sind kein Befund.** Der Erbauer hat den
   harten Abbruch bewußt verworfen; Code 1 und die Zusammenfassung tragen. Bedingung: aus einem
   roten Lauf wird keine grüne Zeile einzeln zitiert.
3. **„Eine benannte Zahl" ist keine „gepflegte Aufstellung" im Sinne von B-2.10.** Begründet und
   gemessen: eine Fachroute wird nie unter `ALL` registriert, und alle zehn Kettenglieder stehen als
   `app.use('*', …)` in einem Block in `app.ts`. Die Zahl ändert sich nur, wenn sich die
   Vertrauensgrenze ändert — und dann soll sie es.
4. **Die Stufe eines Befunds hängt nicht daran, wie teuer seine Behebung ist.** T-223-1 ist
   dieselbe Klasse wie T-206-1 und bekommt dieselbe Stufe.
5. **Das Leeren von `stdout`/`stderr` ist ein zulässiges Modell**, nämlich für „die Ausgabe des
   Kindes ist nicht angekommen" — etwa wenn der Sidecar sein Protokoll künftig in eine Datei
   schreibt. Dieselbe Bauart wie „der Leser läßt jeden Schlüssel `enum` fallen" aus T-206.
6. **A-A-59 legt die Bauart nicht fest.** Zwei tragfähige Formen sind genannt, die Wahl gehört zum
   Bau. Verfassen und genehmigen in einer Hand geht nach E-078 Punkt 3 nicht.

---

## Risiken

1. **Die Notiz-Grenze ist nicht offen, aber sie ist schlechter gemessen, als dieses Papier gesagt
   hat.** 28.1.1 zählte sechs Schichten und wies fünf als gemessen aus; nach T-223-2 und T-223-3
   sind es vier. Die Schichten 1 bis 4 (Domänentyp, Typwächter am Katalog, wörtliche Auswahlliste,
   Renderer) sind strukturell oder gemessen und tragen. **Kein Leck — eine Zusage über eine
   Messung, die es nicht gab.** Berichtigt in 29.4.6.
2. **T-223-1 ist bis zur Behebung ein offener Weg an einem Sicherheitswächter vorbei.** Heute liegt
   keine solche Route im Bestand (`git grep` und roher Lauf über die Quellverzeichnisse: kein
   `.all(` als Routenregistrierung, nur `Promise.all`). Die Behebung kostet deshalb keinen falschen
   Alarm — und der Weg bleibt offen, bis sie da ist.
3. **B-2.4 ist in `proof:export-api` derzeit eine Zusicherung ohne Untergrenze.** Der Lauf ist nicht
   der einzige Träger — `proof:access` Abschnitt 12 mißt dieselbe Sache mit benannter Zahl. Die
   Doppelung ist der Grund, warum T-223-4 „soll" ist und nicht „muß".
4. **Die zweite Gegenprobe zu T-223-5 fehlt.** Der Befund steht auf einer Messung statt auf zweien.
   Nachzuholen, sobald der Port frei ist — E-083 Punkt 2 gilt für diese Welle nicht.
5. **Die Aussage über die OpenAPI-Beschreibung ruht vollständig auf `proof:openapi`** — auf einem
   Lauf, in dem zwei der vier Befunde von T-206 saßen. Zwölftes Mal ohne 42Crunch. Diese
   Feststellung wird nicht besser dadurch, daß der Lauf inzwischen 112 statt 110 Zeilen fährt.
6. **Kein Sicherheitsrisiko neu entstanden.** Keine zweite Adresse außerhalb `127.0.0.1` (E-001),
   kein Produktivcode berührt. Der versionierte Bestand führt weder `verifier-teil2` noch `t223`;
   `addin/leak` steht dort an genau zwei Stellen, beide Kommentare, die den gemessenen Befund
   festhalten.

---

## Offene Fragen

1. **An den Orchestrator: E-083 Punkt 2 ist in dieser Welle verletzt.** `proof:access` und
   `proof:export-api` sind portgebunden und liefen neben dem e2e-Lauf; eine Gegenprobe ist daran
   fünfmal gescheitert. Punkt 4 derselben Entscheidung nennt die Entzerrung als offene Aufgabe —
   sie ist jetzt zum zweiten Mal fällig geworden.
2. **An den Orchestrator: A-A-56 bis A-A-59 gehören zu domain-dev**, alle vier in
   `apps/local-api/scripts/**`. A-A-60 ist keine Bauarbeit, sondern eine Bedingung der Abnahme und
   gehört in die Abnahmeregeln, nicht in eine Aufgabe.
3. **An den Orchestrator: A-A-50 ist weiterhin offen** und liegt nicht bei mir (T-215, Offene Frage
   3). Die Kürzung von Satz 2 der Fußnote „Leistung" ist erst **nach** A-A-50 gedeckt und nur unter
   B-1 bis B-3 aus 28.1.3.
4. **An mich selbst, für die nächste Welle:** Gilt die Weigerungsregel auch für `proof:foreign`,
   `proof:surface` und `proof:shell-surface`? Für `proof:foreign` und `proof:callers` ist sie in
   T-183 beantwortet; die drei Oberflächenläufe sind noch nicht danach vermessen. Nach sieben
   Runden Ausbeute halte ich das für die lohnendste offene Frage dieser Reihe.

---

## Nächster Schritt

**Vorschlag:** domain-dev baut A-A-56 bis A-A-59 in einer Aufgabe — sie liegen alle vier in
`apps/local-api/scripts/**`, keine berührt Produktivcode, und A-A-57 betrifft zwei Läufe an
derselben Grenze. **A-A-56 zuerst**, weil sie als einzige einen offenen Weg an einem
Sicherheitswächter vorbei schließt.

Danach die zweite Gegenprobe zu T-223-5 nachholen, in einer Welle ohne e2e-Lauf.
