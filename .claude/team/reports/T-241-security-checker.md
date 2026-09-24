# T-241 — security-checker

**Aufgabe:** T-241 (Welle AL) — drei Punkte am eigenen Papier, alle drei statisch, keiner portgebunden.
**Status:** fertig
**Datum:** 2026-09-06

---

## 0. Zuerst: der Stand auf der Platte, in Zahlen statt aus dem Gedächtnis

Der Orchestrator meldete **+405 Zeilen** in `docs/bedrohungsmodell.md` und keinen Bericht.
Nachgemessen, bevor irgendetwas geschrieben wurde:

| Frage | Messung |
|---|---|
| Woher die +405? | `git diff -U0` — **ein** Block, `@@ -8679,0 +8680,405 @@`, also Zeilen **8680–9084** |
| Was steht darin? | **Kapitel 31, „Prüfung T-234"** — beginnt mit `---`, endet mit **31.10 Urteil dieser Prüfung** |
| War das halbfertige Arbeit von mir? | **Nein.** Ein geschlossenes Kapitel der Welle davor, uncommittet stehengeblieben. Es trägt sein eigenes Urteil, seine Befundtafel (T-234-0 bis T-234-8) und seine Auflagentafel (A-A-66 bis A-A-68, A-A-64 berichtigt). |
| Was hatte meine abgebrochene Sitzung geschrieben? | **0 Zeilen.** Die Datei war bei Sitzungsbeginn 9084 Zeilen lang und beim Wiederaufsetzen ebenfalls. |

**Nichts zurückzunehmen.** Es gab keinen halb berichtigten Abschnitt; der Abbruch lag vor dem ersten
Schreibvorgang. Alles, was jetzt in der Datei steht und von mir ist, ist in dieser Sitzung entstanden
und zu Ende geführt.

---

## 1. Die Sperre, und daß sie eingehalten wurde (E-083 Punkt 2, O-KA)

`e2e-tester` hält 5173 und 17843. **Kein portgebundener Lauf.** Nicht gefahren: `proof:access`,
`proof:tags`, `proof:db-permissions`, `proof:taskpane` (bindet 17944 — die Berichtigung des
Orchestrators ist übernommen), `proof:all`.

**Gefahren, weil sie nichts binden — und das ist nachgelesen, nicht angenommen:**
`proof:openapi` und `proof:route-policy` gehen über `app.fetch`. Die Begründung steht ausgeschrieben
im Kopf von `apps/local-api/scripts/proof-route-policy.mjs` (Abschnitt „Warum über `app.fetch` und
nicht über einen echten Netzanschluss", Punkt 2: *„Ein Prüfpfad, der einen Prozess startet, ist
deshalb nicht zweimal gleichzeitig fahrbar und kollidiert mit einer laufenden Anwendung und mit den
End-zu-End-Tests"*). Zusätzlich geprüft: `compose()` **startet die Versionsprüfung nicht**
(`composition.ts:197` baut den Prüfer, `start()` wird nirgends gerufen) — es geht in dieser Prüfung
also auch keine Verbindung nach außen (R-19).

**Der Spiegel.** Alle Verstümmelungen liefen in `/tmp/t241-spiegel` — eine Kopie von
`apps/local-api` und `packages` mit einem Verweis auf die `node_modules` des Baums. Kein
Produktivstand wurde angefaßt. Der Spiegel ist geeicht: `proof:openapi` liefert dort **114/0,
Code 0**, zeichengleich mit dem Baum.

**Belegt:** `git diff --stat` über `apps/local-api/src/app.ts`,
`apps/local-api/scripts/service-scenario.mjs` und `packages/domain/src/attachment.ts` ist **leer**.
Verändert habe ich genau `docs/bedrohungsmodell.md`.

---

## 2. O-KS — die Zeile, die die Sicherheitseigenschaft wegbeschrieb

**Befund bestätigt, und er ist größer als „falsch". Berichtigt an Ort und Stelle (Zeile 5236).**

`packages/domain/src/attachment.ts:1044` lautet heute:

```ts
return url.protocol === 'https:' ? rest : `${url.protocol}//${rest}`;
```

Nachgemessen am laufenden Erzeugnis, nicht am Kommentar:

| Ziel | Beschriftung ohne Titel |
|---|---|
| `https://beispiel.example/tickets/4711` | `beispiel.example/tickets/4711` |
| `http://beispiel.example/tickets/4711` | **`http://beispiel.example/tickets/4711`** |
| `https://beispiel.example/` | `beispiel.example` |
| `http://beispiel.example/` | **`http://beispiel.example`** |
| `http://beispiel.example:8443/a?b=1#c` | **`http://beispiel.example:8443/a?b=1#c`** |

Die beiden Beschriftungen sind **nicht gleich**, und die `http`-Variante beginnt sichtbar mit
`http://`. Der Satz im Papier („schneidet `https://` beziehungsweise `http://` weg") beschrieb damit
die Eigenschaft weg, die vor dem Klick eine **Herabstufung von `https` auf `http`** zeigt — bei einem
Verweis fragt Takt nicht zurück (A-A-7), die Liste ist die ganze Anzeige.

**Dreifach gegengeprüft, keine der drei Verankerungen ist von mir:**

1. Code, mit ausgeschriebener Begründung (`attachment.ts:1041–1044`), die den Hinweis T-156-8
   namentlich zitiert.
2. Zwei Prüffälle, beide mit dem Wort „Absicht" im Namen:
   `packages/domain/test/attachment.test.ts:679` (*„Verweis ohne Titel: `http://` bleibt SICHTBAR
   stehen — Absicht, nicht vergessen (T-168 1.4)"*) und `:748`.
3. spec-ux-reviewer, T-237 — als bewußte Abweichung von X-04 erneut geprüft und bestätigt.

**Suchregel (`CLAUDE.md`), beide Hälften gefahren:** `git grep` findet die falsche Formulierung an
**einer** Stelle; der rohe Lauf über `apps/*/src`, `packages/*/src`, `tests/`, `docs/` (Bauergebnisse
unter `apps/desktop/src-tauri/taskpane/` ausgeschlossen) findet **dieselbe eine** und sonst nichts.

**Zusätzlich gefunden, ausdrücklich nicht berichtigt:**
`.claude/team/reports/T-156-security-checker.md:231` schreibt „`attachmentLabel` schneidet
`https://` weg" — **ohne** das `http://`. **Der Bericht war richtig, das Papier war falsch.** Die
Abweichung ist beim Übertrag entstanden. Berichte sind Stände ihres Tages und werden nicht
rückwirkend umgeschrieben.

**Erledigt:** Zeile 5236 trägt jetzt die Messung, die Marke, das Datum und den Satz, warum die
Kürzung hier nicht stattfindet. **Der Hinweis T-156-8 ist geschlossen**, nicht offen — was er
verlangte, ist gebaut.

---

## 3. O-JL — der Rest von A-A-51, entschieden mit Zahlen

### Die Zahlen (`probe.app.routes`, heutiger Baum)

| Größe | Zahl |
|---|---|
| Einträge in der Routenliste | **83** |
| Kettenglieder (Methode `ALL`) | **10**, alle mit Pfad `/*` |
| Endpunkte (konkrete Methode) | **73** |
| **Endpunkte auf einem Platzhalter** | **30** (18 verschiedene Pfade) |
| davon mit `*` im Pfad | **0** |
| **Endpunkte, am Pfad ununterscheidbar** | **0** |

Die letzte Zahl ist null, weil Ununterscheidbarkeit die Methode `ALL` voraussetzt und dort heute
kein Endpunkt steht. **Die ununterscheidbare Klasse ist ausschließlich die der zehn Kettenglieder.**

### Warum die Aufstellung nicht teuer, sondern wirkungslos wäre

| Merkmal | verschiedene Werte über die zehn | Unterscheidungskraft |
|---|---|---|
| **Pfad** | **1** (`/*`, zehnmal) | **null** |
| Handlername | 3 (`bodyLimit2`, `timeout2`, **8 × leer**) | null für die acht, die die Grenze tragen |
| Stelligkeit | 1 (alle `(c, next)`) | null |

Eine gepflegte Aufstellung der erlaubten **Pfade** hätte **ein** Element.

### Die vier `ALL`-Formen, im Spiegel gegen die echten Läufe

| Gegenprobe | `proof:openapi` | Code |
|---|---|---|
| unverändert | **114/0** | 0 |
| **R2** `api.all('/*', …)` zusätzlich | **112/2** | 1 |
| **R3** `api.all('/addin/leak/:id', …)` | **112/2** | 1 |
| **R4** `api.all('/addin/leak', …)` | **111/3** | 1 |
| **R1** Glied 6 (`contentTypeGuard`) **ersetzt** | **114/0** | **0** |
| **R1b** Glied 1 (`securityHeaders`) **ersetzt** | **114/0** | **0** |

`proof:route-policy` bleibt bei R1 und R1b ebenfalls **43/0, Code 0**.

### Die Reichweite — hier war 30.7 gemessen zu milde

| Tausch an | ohne Nachweis | fremde Herkunft | fremder `Host` |
|---|---|---|---|
| Stelle 6 (`contentTypeGuard`) | **200** | 403 `origin_not_allowed` | 403 `host_not_allowed` |
| **Stelle 1 (`securityHeaders`)** | **200** | **200** | **200** |
| Vergleich `/api/v1/todos` | 401 | — | — |

**Ein Tausch an Stelle *k* schaltet 11 − *k* Wächter ab**, weil das Glied antwortet statt
durchzureichen. An Stelle 1 ist der getarnte Pfad aus **jeder Webseite im Browser** erreichbar —
genau die Klasse, die `CLAUDE.md` als wahrscheinlichste echte Lücke benennt. 30.7 ist an Ort und
Stelle berichtigt.

### Entscheidung

**Hinnehmen mit benanntem Rest — keine Aufstellung von Pfaden. Der Rest bekommt A-A-69, und die ist
keine Pfadliste.** Der Pfad kann den Rest nicht schließen (1 verschiedener Wert über zehn); die
**Reihenfolge** kann es, und sie ist in `app.ts` bereits als Inhalt bezeichnet, während
`MIDDLEWARE_COUNT = 10` bereits ihre Mächtigkeit führt — der Schritt legt **keinen zweiten
Pflegeort** an.

**Der Preis steht in der Auflage:** A-A-69 liest Quelltext, nicht Verhalten. Ein Umbau der Kette
macht sie rot, ohne daß ein Sicherheitsfehler vorläge.

### Was im Auftrag nicht stand und trotzdem gefunden wurde

**Die Reihenfolge der Kette wird von keinem Lauf gemessen.**

| Gegenprobe | Glieder gezählt | `proof:openapi` | `proof:route-policy` | Code |
|---|---|---|---|---|
| `authGuard` und `hostGuard` **vertauscht** | **10**, andere Reihenfolge | **114/0** | **43/0** | **0** |
| `originGuard` **gestrichen** | 9 | 113/1 | 42/1 | 1 |
| `credentialPolicy` und `authGuard` vertauscht | 10 | **rot** (Durchlauf bekommt 401) | — | 1 |

**Streichen fällt auf, Verschieben nicht — jedenfalls nicht zuverlässig.** Ob eine bestimmte
Vertauschung ein Loch aufreißt, ist hier **nicht** behauptet; daß der Wächter dagegen fehlt, ist
gemessen. A-A-69 deckt beides, weil eine Liste **in Reihenfolge** beides trägt.

**Prototyp gemessen (sieben Läufe):** Am unveränderten Baum zählt er die zehn in ihrer Reihenfolge;
bei beiden Tauschformen und beim gestrichenen Glied **9 statt 10**, und er **nennt den fehlenden
Wächter** — das ist der Zugewinn gegenüber A-A-56, die bei einem gestrichenen Glied zwar rot wird,
aber nur die Zahl nennt.

---

## 4. O-JM — Zahl gegen Zahl, jetzt an der Stelle, an der die Zahl steht

**Befund gibt es heute noch — an anderer Stelle als gemeldet.** 29.3 hat ihn vollständig berichtigt,
aber **hinter** der Tafel und über 4 000 Zeilen entfernt. Wer 28.2.2 liest, liest die falsche Zahl.
Das ist O-JZ in Reinform.

**Nachgemessen, jede Stelle einzeln, im Spiegel, gegen den heutigen Lauf:**

| ersetzt | Antworten mit dem Vermerk | `proof:openapi` | Code |
|---|---|---|---|
| nichts | **2** | **114/0** | 0 |
| Stelle 1 (`service-scenario.mjs:449`) | **1** | **113/1** | **1** |
| Stelle 2 (`:520`) | **1** | **113/1** | **1** |
| **Stelle 3 (`:877`, Add-in-Route)** | **2** | **114/0** | **0** |
| alle drei | **0** | **113/1** | **1** |

**Die Zahl ist zwei.** Und die alte Tafel war nicht nur falsch, sondern **überholt**: „alle drei →
110/0, Code 0" ist seit dem Bau von A-A-52 **113/1, Code 1**. Eine Tafel, die einen behobenen Befund
als offen führt, ist derselbe Schaden wie eine mit falscher Zahl.

**Erledigt:** 28.2.2 trägt jetzt beide Tafeln — die alte durchgestrichen als **Stand mit Datum und
Herkunft** (sie ist die Spur des Befunds), die neue als geltende Messung mit Datum. E-087 Punkt 2.

---

## 5. Vorbereitung der Abnahme T-235 (ausdrücklich **keine** Abnahme)

Statisch gelesen, nicht gemessen:

| Auflage | Gebaut? | Fundstelle |
|---|---|---|
| **A-A-66** | ja | `proof-tags.mjs:789`, `:796` — der **Grund** neben dem Status |
| **A-A-67** | ja | `proof-tags.mjs:645`, `:664` — **beide** Formen gebaut, verlangt war eine |
| **A-A-68** | ja | `proof-access.mjs:1118` `MINDESTENS_DURCHSUCHT = 14`, dazu ein **zweiter Weg** (`vonHand`) mit `scanned.length === vorhanden.length` |

**Eine Zahl ohne Port nachgezählt und sie stimmt:** unter `src/access` und `src/http` liegen heute
**16** `.ts`-Dateien; die Untergrenze 14 läßt zwei verschwinden und liegt mit Faktor dreieinhalb über
den vier tragenden — das Verhältnis, das die Auflage verlangt.

**Offen und in der nächsten Welle zeichengenau gegenzuprüfen** (Erwartung des Erbauers, hier nur
festgehalten): `proof:tags` **45/0**, `proof:access` **108/0** auf unverändertem Baum, **acht**
Gegenproben rot mit Code 1, entscheidend **43/2** und **107/1**.

---

## 6. Ergebnis

**Artefakte:**
- `/home/kerem/Projects/SuperTakt/docs/bedrohungsmodell.md` — drei Berichtigungen **an Ort und
  Stelle** (Zeile 5236 / T-156-8; Abschnitt 28.2.2; Abschnitt 30.7 Punkt zwei und drei) und ein
  neues **Kapitel 32**.
- `/home/kerem/Projects/SuperTakt/.claude/team/reports/T-241-security-checker.md` — dieser Bericht.

**Neue Auflagen:** **A-A-69** (die Reihenfolge der zehn Kettenglieder wird gemessen, ohne Pfadliste;
`apps/local-api/scripts/**`, domain-dev) und **A-A-70** (Berichtigungen stehen an der Stelle, die sie
berichtigen; eine Regel über dieses Papier).

**Urteil: Nacharbeit.** Ein Befund der Stufe **soll** (T-241-3), drei Berichtigungen an meinem
eigenen Papier, vier Feststellungen, ein offener Beschaffungspunkt. **Keine Auflage berührt
Produktivcode.**

**Definition of Done, ehrlich abgehakt:**

| Punkt | Stand |
|---|---|
| Semgrep ohne offene Befunde hoher Schwere | **nicht messbar** — Guardian-Werkzeug steht zum elften Mal nicht zur Verfügung (T-241-7) |
| 42Crunch-Audit über der Schwelle | **nicht messbar** — dasselbe, zehnte Welle |
| Jeder Befund mit Pfad, Anforderung, Auswirkung, Gegenmittel | erfüllt (32.5) |
| `docs/bedrohungsmodell.md` gepflegt | erfüllt |
| Urteil | **Nacharbeit** |
