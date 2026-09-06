# T-234 — drei Vorhersagen am freien Port, die fehlende Gegenprobe, zwei Bestätigungen

Aufgabe: T-234 (Welle AK) — V-1 bis V-3 aus Bedrohungsmodell 30.6 fahren, die zweite Gegenprobe zu
T-223-5 nachholen, O-KK und O-KL bestätigen, die vier Läufe aus T-231 nachfahren
Status: **fertig**
Rolle: security-checker
Datum: 2026-09-06

---

## Artefakte

| Datei | Was |
|---|---|
| `docs/bedrohungsmodell.md` | **Abschnitt 31** neu (31.0 bis 31.10): Werkzeugstand, die zweite Gegenprobe zu T-223-5, V-1 bis V-3, O-KK, O-KL, die vier Nachfahrungen, acht Befunde, drei neue Auflagen und eine Berichtigung an A-A-64 |
| `.claude/team/reports/T-234-security-checker.md` | dieser Bericht |

**Kein Produktivcode, kein Prüfpfad, keine fremde Datei geändert.** Alle Verstümmelungen — auch die
drei in Produktivcode und die eine neue Datei — sind ausschließlich im Spiegel `/tmp/t234/root`
entstanden und mit ihm gelöscht. `diff -rq` über `apps/local-api/src`, `apps/local-api/scripts`,
`packages`, `apps/web/src` und `apps/outlook-addin/src` nach der letzten Messung: **ohne
Unterschied**.

---

## Zusammenfassung

Der Port war frei, und damit ließ sich alles fahren, was zwei Wellen lang als Vorhersage dastand.
**V-1 und V-2 sind bestätigt und beide härter als vorhergesagt**: In `proof:tags` Abschnitt 9 darf
die bewachte Produktivregel **fehlen** (Takt nimmt 51 Tagnamen mit 201 an), und in Abschnitt 5 darf
die **gemeinsame Transaktion gebrochen** sein (ein Tag überlebt den Fehlschlag seines Todos, die
achte Stelle aus T-047) — der Lauf sagt in beiden Fällen **43/0, Code 0**, sobald der Fehlschlag
aus einem anderen Grund eintritt. **V-3 ist widerlegt**: Der Satz im Kommentar von
`proof:db-permissions` Abschnitt 4 stimmt, mit belegtem Port läuft er in 0,68 s auf 18/0 durch, weil
der Dienst Verzeichnis und Bestand **vor** dem Binden anlegt und danach mit `port_in_use` und
Exitcode 74 abbricht. **Die zweite Gegenprobe zu T-223-5 ist nachgeholt** und trägt in beide
Richtungen: Die Aufspaltung von `verifier.ts` wird von der gebauten Fassung mit Datei und Zeile
gemeldet (105/1, Code 1) und war für die Fassung von T-223 unsichtbar (106/0) — und die erste,
nicht verhaltensneutrale Fassung derselben Umgliederung war ein **echter Umgehungsweg** (ohne
eingerichtetes Add-in-Token authentifiziert eine Anfrage ohne jeden Nachweis). **O-KK und O-KL sind
bestätigt**; bei O-KK gegen meine eigene Auflage: A-A-64 wörtlich gebaut ergibt **sieben
Fehlalarme** auf dem gesunden Baum und läßt den gemeldeten Fall **grün**.

---

## 1. Die vier Läufe aus T-231, eigenständig nachgefahren

| Lauf | T-231 sagt | gemessen | Code | Prüfsumme vorher = nachher |
|---|---|---|---|---|
| `proof:callers` | 45/0 → **56/0** | **56/0** | 0 | `1597254575` |
| `proof:tags` | 42/0 → **43/0** | **43/0** | 0 | `689993371` |
| `proof:conflicts` | 149/0 → **154/0** | **154/0** | 0 | `2545999469` |
| `proof:db-permissions` | 17/0 → **18/0** | **18/0** | 0 | `197552816` |
| `proof:access` (für 31.1) | 106/0 | **106/0** | 0 | `3048530334` |

`proof:callers` zusätzlich **im Bestand selbst**: 56/0, Code 0. `proof:all` nicht gefahren.

**Die vier Gegenproben, die domain-dev selbst als die entscheidenden nennt — alle vier zeichengenau
bestätigt:**

| Gegenprobe | T-231 | gemessen | Meldung |
|---|---|---|---|
| Sammler leer | 54/2 | **54/2, Code 1** | „der Sammler hat mindestens 100 Dateien eingesammelt (**0**) — der Sammler greift ins Leere" |
| Sammler überspringt `api/` | 55/1 | **55/1, Code 1** | „mindestens 100 (**114**)" **grün**, „`api/client.ts` und `api/endpoints.ts` sind darunter" **rot** |
| Kunstquelle aus 30.3 | 150/1 | **150/1, Code 1** | „`index 'ux_tag_name_key'` → **ux_tag_name_key**, erwartet war **ux_tag_name**" |
| Zuordner als Teilzeichenkettensuche | 149/2 | **149/2, Code 1** | „ux_tag_name statt ux_tag_name_key" |

**A-A-59 und A-A-61 bis A-A-65: erfüllt** (T-234-0).

---

## 2. Die zweite Gegenprobe zu T-223-5 — nachgeholt

Sie fehlte seit zwei Wellen, und die vollständigen grünen Läufe ersetzen sie nicht: *das ist eine
Gegenprobe und kein grüner Lauf.*

| Zustand | Lauf | Code | Zeile |
|---|---|---|---|
| Bestand | 106/0 | 0 | `ok Kein === auf Tokenmaterial im Nachweispfad` |
| Aufspaltung, Vergleich verhaltensneutral in `verifier-match.ts` | **105/1** | **1** | `FEHL … — src/access/verifier-match.ts:28: const gleich = presented === secret;` |
| dieselbe Aufspaltung gegen die **Fassung von T-223** (vier Dateien als Aufstellung) | 106/0 | 0 | grün — **unsichtbar** |

**Nebenbefund.** Die erste Fassung derselben Umgliederung enthielt die naheliegende Bequemlichkeit
`if (presented === secret) return { addin: 1, session: 0 };` und war damit ein Umgehungsweg:
`verifyCredential(null, { addin: null, session: null })` → `{"ok":true,"kind":"addin"}`. Ohne
eingerichtetes Add-in-Token — der Zustand jeder frischen Installation — authentifiziert eine
Anfrage **ohne jeden Nachweis**. `proof:access` fängt sie dreifach (103/3, Code 1). Die verbotene
Zeile und der Umgehungsweg sind dieselbe Zeile; B-2.5 ist keine Stilregel.

**Neuer Rest aus derselben Messung (T-234-3, soll):** Die Untergrenze von Abschnitt 13 ist
`scanned.length >= TRAGENDE_DATEIEN.length`, also **vier** — die Zahl der Dateien, die ohnehin
einzeln geprüft werden. Gemessen mit derselben verbotenen Zeile in `src/access/unter/…`: mit
`recursive: true` **105/1, Code 1**; **ein Wort entfernt** → **106/0, Code 0**, und die Zeile sagt
„**vollständig** durchsucht — 16 Dateien". Auflage **A-A-68**.

---

## 3. V-1 bis V-3

**V-1 — bestätigt, Stufe muß (T-234-1).** `proof:tags` Abschnitt 9.

| Zustand | Lauf | Code | Abschnitt 9 |
|---|---|---|---|
| Bestand | 43/0 | 0 | beide grün |
| Kunstquelle: Titel mit 600 Zeichen (Grenze 500) | **43/0** | **0** | **beide grün** |
| **Produktivregel entfernt** (`.max(50)` → `.max(500)`) **und** Kunstquelle | **43/0** | **0** | **beide grün** |
| Produktivregel entfernt, Lauf unverändert | 42/1 | 1 | `FEHL … abgewiesen — Status 201` |

**V-2 — bestätigt, Stufe muß (T-234-2).** `proof:tags` Abschnitt 5.

| Zustand | Lauf | Code | Abschnitt 5 |
|---|---|---|---|
| Kunstquelle: Fehlschlag **vor** der Tag-Anlage | **43/0** | **0** | drei Zeilen grün |
| Transaktion gebrochen, Lauf unverändert | 41/2 | 1 | `["backend","rücklauf"]`, `1 vorher, 2 nachher` |
| **Transaktion gebrochen und Kunstquelle** | **43/0** | **0** | **drei Zeilen grün** |

**V-3 — widerlegt, Feststellung (T-234-7).** Mit belegtem Port: `proof:db-permissions` **18/0, Code
0** in 0,68 s; der Dienst legt Verzeichnis (0700) und `takt.db`/`-wal` (0600) an und bricht danach
ab: `"Der Port 17843 ist belegt. Takt startet nicht und weicht nicht auf einen anderen Port aus."`,
`reason: port_in_use port=17843`, **Exitcode 74**. Zum Vergleich `proof:tags` mit belegtem Port:
Code 1 mit der Klartextmeldung. Halb widerlegt ist auch meine zweite Hälfte: Würde Abschnitt 4 doch
rot, wäre der **Zeilentitel** falsch, aber der **Beleg** (`stderr.slice(-300)`) trägt den wahren
Grund.

---

## 4. O-KK und O-KL

**O-KK — bestätigt, und der Fund geht gegen meine eigene Auflage (T-234-4).**

| Zustand | Lauf | Code | `ux_tag_name`-Block |
|---|---|---|---|
| **A-A-64 wörtlich** (`raw.includes(indexName)`), gesunder Baum | **126/7** | **1** | grün |
| **A-A-64 wörtlich** + Kunstquelle aus 30.3 | **126/7** | **1** | **vier Zeilen grün** |
| gebaute Fassung (ganzer Name) + Kunstquelle | 150/1 | 1 | **rot**, nennt beide Namen |

Sieben Fehlalarme, weil SQLite in sieben von vierzehn Blöcken die **Spaltenform** meldet
(`UNIQUE constraint failed: todo_status.name`) und den Index gar nicht nennt. Und der gemeldete Fall
bliebe grün. Die Teilzeichenketten-Beziehung mißt der Lauf seit T-231 selbst: „es gibt überhaupt
einen Indexnamen, der in einem anderen steckt (**ux_tag_name**)". **Der Bau löst die Auflage ein
und überschreitet sie nicht; der Wortlaut von A-A-64 wird berichtigt.**

**O-KL — beide Teile bestätigt (T-234-5, T-234-6).** Unter M2 (`secureDatabaseFiles` aus,
`umask 0o077`) am gebauten Stand: **16/2, Code 1**; Abschnitt 1 (5 Zeilen), Abschnitt 3 (4 Zeilen)
**und Abschnitt 4 (6 Zeilen) vollständig grün**, rot allein Abschnitt 0 und Abschnitt 2. **Drei von
vier** messen den Zustand statt der Wirkung. Die gebaute Meldung von Abschnitt 0 nennt Abschnitt 4
bereits mit. — Kein Zwilling im Add-in: `call(`/`call<` in **genau einer** Datei (fünf Stellen, alle
in `createApiClient`, `const call` in Zeile 189), **nicht exportiert**, außerhalb nur Prosa,
`badge--call` und `htmlFor="call"`. Keine zweite Regel nötig, **weil es keinen zweiten Weg gibt**.

---

## Annahmen

1. **Die Kunstquelle für V-1 und V-2 ist der überlange Titel** (600 Zeichen gegen
   `MAX_TITLE_CHARACTERS = 500`). 30.6 nennt ihn als Beispiel; ich habe ihn genommen, weil er
   ausschließlich die Eingabeprüfung betrifft und keine Fachlogik verschiebt.
2. **Ich habe V-1 und V-2 über die Vorhersage hinaus verschärft**, indem ich zusätzlich die
   **bewachte Produktivregel** entfernt beziehungsweise die Transaktion gebrochen habe. Ohne diesen
   Schritt bliebe der Befund die Aussage „die Zusicherung sagt mehr, als sie mißt"; mit ihm ist er
   die Aussage „eine echte Rückentwicklung bleibt unsichtbar". Das ist die Bauart aus 28.1.1.
3. **Die verhaltensneutrale Fassung der Aufspaltung** (31.1) ist die eigentliche Gegenprobe; die
   verhaltenswirksame steht daneben, weil sie zeigt, wofür die statische Zeile da ist.
4. **A-A-64 berichtige ich im Wortlaut, statt eine neue Auflage aufzumachen.** Die Auflage ist
   erfüllt; falsch war der Satz, mit dem ich ihre Behebung vorgeschrieben habe.
5. **Die Zählung „vierzehntes Mal ohne Werkzeug"** setzt 30.0 fort (dort dreizehntes). Der
   Auftragstext dieser Welle nennt „dreizehntes Mal" und meint dieselbe Feststellung.

---

## Risiken

1. **T-234-1 und T-234-2 sind bis zur Behebung zwei blinde Stellen an einer Fachregel**, nicht an
   einer Sicherheitsgrenze: die Obergrenze der Tagnamen (eine Erschöpfungsgrenze, B-1.7-Nachbar)
   und die gemeinsame Transaktion aus T-047. Beide sind heute **intakt** — gemessen, der
   unveränderte Baum ist 43/0 und die Zähne beißen. Offen ist, daß eine Rückentwicklung nicht
   auffiele.
2. **T-234-3 betrifft die einzige statische Zusicherung über B-2.5.** Sie ist heute wirksam (der
   Sammler liest rekursiv); sie verlöre ihre Wirkung durch das Entfernen eines Wortes, und die
   Vorbedingung sagte es nicht.
3. **Kein Sicherheitsrisiko neu entstanden.** Keine zweite Adresse außerhalb `127.0.0.1` (E-001),
   kein Produktivcode im Bestand berührt, keine Fachlogik geändert. Der Umgehungsweg aus 31.1 ist
   im Spiegel entstanden und mit ihm gelöscht; `verifyCredential` im Bestand ist zeichengleich mit
   dem Stand vor dieser Prüfung.
4. **Guardian und 42Crunch sind ein Zustand, keine Warteposition** (E-079 Punkt 3, vierzehntes
   Mal). Die Aussage über die OpenAPI-Beschreibung ruht **dauerhaft** auf `proof:openapi`. A-A-60
   ist damit keine Ordnungsregel, sondern der Ersatz für ein fehlendes Werkzeug — diese Prüfung ist
   seine neunte Anwendung.
5. **`tmp-chrome.mjs` liegt unversioniert im Wurzelverzeichnis und ist nicht ignoriert**
   (T-234-8). Inhalt harmlos, aber ein `git add -A` nähme sie mit.
6. **Die Portbindung hat diese Prüfung zwei Wellen gekostet.** E-083 Punkt 4 (O-KJ) ist zum vierten
   Mal fällig.

---

## Offene Fragen

1. **An den Orchestrator: A-A-66 bis A-A-68 gehören zu domain-dev**, alle drei in
   `apps/local-api/scripts/**`, keine berührt Produktivcode. **A-A-67 zuerst** — sie ist die, deren
   Gegenstand (die gemeinsame Transaktion, A-7, T-047) am schwersten wiegt.
2. **An den Orchestrator: A-A-64 ist im Wortlaut berichtigt** (31.9). Wer die Auflage künftig
   zitiert, zitiert die berichtigte Fassung; die alte steht mit Marke daneben, damit die
   Berichtigung an der berichtigten Stelle steht (die Regel aus T-229/O-JZ).
3. **An mich selbst, für die nächste Welle:** Übrig sind `proof:codepoints`, `proof:migrations`,
   `proof:taskpane`, `proof:addin-wiring`, `proof:foreign`, `proof:surface`, `proof:shell-surface`
   und `proof:addin`. Die drei Oberflächenläufe stehen seit T-223 aus; `proof:foreign` und
   `proof:surface` sind portfrei und auch in einer Welle mit e2e-Lauf messbar.
4. **An den Orchestrator, unverändert seit T-230:** Gehört `proveFetchGuard` als Bauart in A-A-60
   hinein („eine Selbstprobe geht denselben Weg wie der Prüfgegenstand, oder sie sagt, welchen sie
   ausläßt")? domain-dev hat die Auslassung in T-231 im Kommentar benannt; die Regelfrage liegt
   weiter beim Orchestrator (E-078 Punkt 3).

---

## Nächster Schritt

**Vorschlag:** domain-dev baut **A-A-66 bis A-A-68** in einer Aufgabe — drei Auflagen, zwei
Dateien (`proof-tags.mjs`, `proof-access.mjs`), keine berührt Produktivcode. **A-A-67 zuerst.**
Die Gegenproben stehen in 31.2, 31.3 und 31.1.1 mit ihren Verstümmelungen ausgeschrieben und
müssen nicht neu gesucht werden.

**Danach, in einer beliebigen Welle:** `proof:foreign` und `proof:surface` gegen A-A-60 (portfrei),
und in einer portfreien Welle `proof:taskpane` und `proof:addin-wiring`.
