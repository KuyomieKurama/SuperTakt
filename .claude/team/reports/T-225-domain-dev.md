# T-225 — domain-dev

Aufgabe: T-225 — A-A-56 bis A-A-59: der offene Rest von A-A-51, die Notiz-Grenze in den
beiden Exportläufen, die Ausgabe des Dienstes und die Aufstellung in `proof:access`
Status: teilweise

## Artefakte

| Datei | Auflage |
|---|---|
| `apps/local-api/scripts/proof-route-policy.mjs` | A-A-56 |
| `apps/local-api/scripts/proof-openapi.mjs` | A-A-56 |
| `apps/local-api/scripts/proof-export.mjs` | A-A-57 (erste Hälfte) |
| `apps/local-api/scripts/proof-export-api.mjs` | A-A-57 (zweite Hälfte), A-A-58 |
| `apps/local-api/scripts/proof-access.mjs` | A-A-59 |

Kein Eingriff in `src/**`. Die drei Kunstquellen in `src/access/**` waren Messungen und sind
zurückgenommen; `git status` führt ausschließlich die fünf Prüfpfade. Alle Spiegel sind
gelöscht (`ls scripts | grep spiegel` → 0).

## Zusammenfassung

A-A-56 ist gebaut und in beide Richtungen gemessen: Beide Wächter urteilen erst über die
Routenliste, nachdem sie **Form** (`jeder ALL-Eintrag trägt den Pfad /*`) und **Zahl** (`die
Kettenglieder sind die benannten 10`) geprüft haben — keine Aufstellung von Pfaden, eine
Zeichenkette und eine ganze Zahl. Der Befund wurde vorher nachgestellt (`/addin/leak/:id` mit
Add-in-Token **200 samt Rumpf**, beide Läufe **41/0** und **112/0**, Code 0), danach sind alle
fünf Formen in beiden Läufen **rot mit Code 1**. A-A-57 ist in `proof:export` gebaut und
gemessen: Der Vermerk wird über `loadTodoNote` zurückgelesen und muß im Bestand **stehen**,
bevor irgendeine Zeile urteilt, daß er in der Datei fehlt; gesucht wird eine **Ableitung**
desselben Literals statt eines zweitgeschriebenen Präfixes. A-A-57 (zweite Hälfte), A-A-58 und
A-A-59 sind gebaut; ihre neuen Zusicherungen sind je in beide Richtungen gemessen, aber **nicht
im vollen Lauf** — `proof:export-api` und `proof:access` starten den Dienst auf 17843 und waren
in dieser Welle neben dem e2e-Lauf nicht fahrbar (E-083 Punkt 2). Gemessen wurde stattdessen der
**aus der Datei geschnittene** Block mit gestellten Umgebungen.

## Messungen

### Nachstellung des Befunds T-223-1 (vor dem Bau)

Nicht in `src/app.ts`, sondern im Spiegel: `probe.app.all(<Pfad>, …)` unmittelbar nach `compose`
erzeugt denselben Eintrag in `app.routes` wie `api.all(…)` in `app.ts` — und läßt `app.ts` für
den gleichzeitig laufenden e2e-Lauf unberührt.

| Kunstquelle | Add-in-Token | Sitzung | ohne Nachweis | `route-policy` | `openapi` |
|---|---|---|---|---|---|
| `/api/v1/addin/leak/:id` | **200 samt Rumpf** | 200 samt Rumpf | 401 | **41/0, Code 0** | **112/0, Code 0** |
| `/api/v1/addin/*` | **200 samt Rumpf** | 200 samt Rumpf | 401 | 41/0, Code 0 | 112/0, Code 0 |
| `/api/v1/*` | 401 | **200 samt Rumpf** | 401 | 41/0, Code 0 | 112/0, Code 0 |
| `/*` (Wurzel-App) | 401 | **200 samt Rumpf** | 401 | 41/0, Code 0 | 112/0, Code 0 |

Die Tabelle aus 29.2.1 ist damit unabhängig bestätigt, einschließlich der vierten Form.

### A-A-56 — beide Richtungen

Unverändert: `route-policy` **41/0 → 43/0**, `openapi` **112/0 → 114/0**, beide Code 0. Kein
falscher Alarm über die zehn Einträge.

| Kunstquelle | `route-policy` | `openapi` | rot geworden ist |
|---|---|---|---|
| `/api/v1/addin/leak` | **40/3, Code 1** | **111/3, Code 1** | A-A-51 **und** Form **und** Zahl |
| `/api/v1/addin/leak/:id` | **41/2, Code 1** | **112/2, Code 1** | Form und Zahl |
| `/api/v1/addin/*` | **41/2, Code 1** | **112/2, Code 1** | Form und Zahl |
| `/api/v1/*` | **41/2, Code 1** | **112/2, Code 1** | Form und Zahl |
| `/*` (Wurzel-App) | **42/1, Code 1** | **113/1, Code 1** | **nur die Zahl** |

Die Meldung nennt den Pfad (`unter ALL registriert, aber nicht /*: /api/v1/addin/*`)
beziehungsweise die geänderte Zahl (`die Kettenglieder sind die benannten 10 — gezählt 11`).
Die letzte Zeile ist der Grund, warum die Zahl gebaut wurde: Sie ist die einzige der drei
Regeln, die alle fünf Formen fängt.

### A-A-57 in `proof:export` — beide Richtungen

Unverändert: **97/0 → 98/0**, Code 0.

| Gegenprobe | Lauf | Code | Meldung |
|---|---|---|---|
| `note: ''` — der Vermerk gelangt nicht in den Bestand | **97/1** | **1** | „der interne Vermerk steht im Bestand … — gelesen: `""` statt `"Interner Vermerk — darf nie in den Export"`" |
| eine Buchungsnotiz trägt den vollen Vermerk (Ausleitung) | **96/2** | **1** | „der interne Vermerk steht nirgends in der Datei" |
| eine Buchungsnotiz trägt den **gekürzten** Vermerk | **96/2** | **1** | dieselbe Zeile |

Die dritte Gegenprobe ist der Grund für die Ableitung `VERMERK_MARKE`: Eine Suche nach dem
vollen Satz — was „dasselbe Literal" wörtlich genommen bedeutet hätte — wäre an einer gekürzten
Ausleitung vorbeigelaufen. Angelegt und gesucht wird dieselbe **eine** Zeichenkette; die Suche
benutzt einen aus ihr abgeleiteten Ausschnitt, der sich mit ihr ändert.

### A-A-59 in `proof:access` Abschnitt 13 — beide Richtungen, ohne Port

Gemessen wurde der **aus `proof-access.mjs` geschnittene** Block, ausgeführt ohne Dienst (der
Spiegel liest die Zeichen zur Laufzeit aus der Datei, kopiert sie also nicht).

| Zustand | Ergebnis |
|---|---|
| unveränderter Baum | **ok**, 16 Dateien durchsucht, Code 0 |
| `===` auf Geheimnismaterial in `src/access/token-store.ts` | **FEHL, Code 1** — `src/access/token-store.ts:195: export const t223Vergleich = …` |
| `verifier.ts` aufgeteilt, Vergleich in `verifier-teil2.ts` | **FEHL, Code 1** — `src/access/verifier-teil2.ts:1: …` |
| `verifier.ts` nicht mehr im Nachweispfad | **FEHL, Code 1** — „nicht angesehen, obwohl B-2.5 daran hängt" |

Die zweite Zeile ist die Gegenprobe, die security-checker nicht fahren konnte (29.4.4).

### A-A-57 (zweite Hälfte) und A-A-58 in `proof:export-api` — ohne Port

Fünf gestellte Welten gegen den aus der Datei geschnittenen Block:

| Welt | Ergebnis |
|---|---|
| A alles da | 5× ok, Code 0 |
| B `seenBodies` leer | **FEHL** „die Menge ist die gefahrene: 0 Antwortkörper …", Code 1 |
| C Ausgabe des Kindes leer | **FEHL** „die Ausgabe des Dienstes ist angekommen — 1 Zeichen, 0 Protokollzeilen zu 5 …", Code 1 |
| D Ausgabe da, weniger Zeilen als Anfragen | **FEHL**, Code 1 |
| E der Vermerk steht doch in einer Antwort | **FEHL** „weder in der Auswahlliste noch in einer Vorschau", Code 1 |

### Nachweis insgesamt

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | 0 | **0** |
| `pnpm test` | 77 Dateien, 1464 | **77 Dateien, 1464 grün** |
| `pnpm run boundaries` | grün | **grün**, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm run proof:route-policy` | 41/0 | **43/0**, Code 0 |
| `pnpm run proof:openapi` | 112/0 | **114/0**, Code 0 |
| `pnpm run proof:export` | 97/0 | **98/0**, Code 0 |
| `pnpm run proof:codepoints` | 45/0 | **45/0**, Code 0 |
| `pnpm run proof:export-api` | 69/0 | **nicht gefahren — portgebunden** |
| `pnpm run proof:access` | 105/0 | **nicht gefahren — portgebunden** |

`proof:all` wurde nicht gefahren (Auftrag, E-083 Punkt 2).

## Annahmen

1. **A-A-59, Bauart: die Aufstellung entfällt.** Beide angebotenen Formen waren zulässig; die
   erste ist gebaut, weil sie gemessen nichts kostet — der vollständige Durchlauf über alle 16
   Dateien in `src/access/**` und `src/http/**` findet **null** Treffer. Die zweite Form hätte
   eine benannte Zahl ausgenommener Dateien verlangt und damit genau die Pflege wieder
   eingeführt, deren Ausbleiben der Befund war. Die **Zahl** der Dateien ist bewußt **nicht**
   festgeschrieben: Anders als die zehn Kettenglieder ist `src/access/` Alltagsbestand und
   wächst mit dem Produkt. Festgeschrieben ist die **Untergrenze** — die Menge ist nicht leer,
   und die vier Dateien, die B-2.5 tragen, sind darin.
2. **A-A-51 bleibt neben A-A-56 stehen.** Die neue Formregel subsumiert sie (jeder Pfad ohne
   Platzhalter ist auch ungleich `/*`), aber A-A-51 ist eine abgenommene Auflage mit eigener
   Meldung, und ihr Wegfall wäre eine stille Absenkung. Kosten: eine Zeile je Lauf.
3. **`VERMERK_MARKE` ist abgeleitet, nicht zweitgeschrieben.** Siehe Messung oben. Ich lese
   A-A-57 („angelegt und gesucht wird dasselbe Literal") als Verbot zweier unabhängiger
   Zeichenketten, nicht als Verbot einer Ableitung — die Ableitung erfüllt den Zweck der
   Auflage strenger als der Wortlaut.
4. **Der Anker in `proof:export-api` wird nicht mitgesammelt.** Die eine Antwort, die den
   Vermerk tragen **soll**, geht mit `sammeln: false` an `seenBodies` vorbei. Stünde sie darin,
   wäre die Menge nicht mehr die, über die Abschnitt 8 etwas behauptet.
5. **Die Untergrenze in A-A-58 ist abgeleitet, nicht geraten.** Statt einer erratenen Mindestzahl
   zählt der Lauf seine **beantworteten** Anfragen und verlangt mindestens ebenso viele
   Protokollzeilen. Damit die Zählung nicht an einer noch unterwegs befindlichen Zeile scheitert,
   wird die Ausgabe vorher eingeholt: eine letzte Anfrage auf `/api/v1/a-a-58-marke`, dann
   gewartet, bis deren Zeile angekommen ist — der Kanal ist der Reihe nach.
6. **Gemessen wurde im Spiegel, nicht in `src/app.ts`.** Ein Eingriff in `app.ts` hätte den
   gleichzeitig laufenden e2e-Lauf treffen können. `probe.app.all(<voller Pfad>, …)` erzeugt
   denselben Eintrag in `app.routes` wie `api.all(<Teilpfad>, …)`; die 200-Messungen oben
   belegen, daß auch das Verhalten dasselbe ist.

## Risiken

1. **`proof:export-api` und `proof:access` sind im vollen Lauf ungemessen.** Das ist die
   Lücke dieser Aufgabe und der Grund für den Status. Erwartet werden **69/0 → 72/0** und
   **105/0 → 106/0**. Wäre eine der neuen Zusicherungen zu streng, zeigt sie sich als falscher
   Alarm im nächsten portfreien Lauf. Die drei riskantesten Annahmen dabei:
   `protokollzeilen.length >= beantworteteAnfragen` (jede beantwortete Anfrage schreibt genau
   eine Zeile — nachgelesen in `requestLog`, `src/http/guards.ts:87`, dort steht die Ausgabe
   **nach** `await next()`), `seenBodies.includes(sources.text)` und die Erreichbarkeit von
   `GET /todos/{id}/note` mit dem Sitzungsgeheimnis (in `proof:route-policy` gemessen).
2. **A-A-56 macht das Ergänzen eines Kettenglieds zu einer Zweizeilenänderung.** Das ist der
   Zweck und trotzdem eine Reibung: Wer in `app.ts` ein `app.use('*', …)` ergänzt, muß
   `MIDDLEWARE_COUNT` in **zwei** Dateien anheben. Die Meldung sagt es beim ersten roten Lauf
   ausdrücklich.
3. **Der Rest, der bleibt.** Ein Kettenglied, das man **entfernt**, und ein Endpunkt, den man im
   selben Zug unter `ALL` auf `/*` legt, ergeben wieder die Zahl 10 und die Form `/*`. Diesen
   Fall fängt nur die Durchgriffsprobe aus 29.2.4, und sie ist als Hilfe genannt, nicht als
   Bedingung — aus dem Grund, den security-checker selbst gemessen hat. Ich melde ihn, statt ihn
   zu verschweigen.
4. **Keine Fachlogik berührt.** Rundung, Exportstatus, Timer-Regel und Migrationen sind
   unverändert; die Änderungen liegen ausschließlich in Prüfpfaden.

## Offene Fragen

1. **An den Orchestrator:** `proof:export-api` und `proof:access` brauchen in einer Welle
   **ohne** e2e-Lauf je einen Durchlauf mit der Zahl vorher/nachher und je einer Gegenprobe
   (`note: 'harmlos, kein Vermerk'` → rot; die beiden Sammler geleert → rot; `===` auf
   Geheimnismaterial in `src/access/token-store.ts` → rot). Erst danach ist T-225 mehr als
   „teilweise". Ich mache das gern selbst, brauche dafür aber den Port.
2. **An den Orchestrator, an security-checker weiterzureichen:** Ist die Ableitung
   `VERMERK_MARKE` (Annahme 3) im Sinne von A-A-57, oder soll dort wörtlich der volle Satz
   gesucht werden? Die Messung „gekürzte Ausleitung" oben zeigt, was der Wortlaut kosten würde.
3. **A-A-50 ist nicht angefaßt** — auftragsgemäß, einschließlich des dritten Satzes in
   `apps/local-api/src/usecases/export-catalog.ts`, der in meiner Fläche liegt. Er ist
   unverändert; der Auftrag über alle drei Sätze gehört als **einer** geschnitten.

## Nächster Schritt

Welle AI ohne e2e-Lauf: `proof:export-api` und `proof:access` vollständig fahren, die vier
Gegenproben aus Offene Frage 1 messen, danach A-A-56 bis A-A-59 zur Abnahme an security-checker.
Parallel möglich, weil portfrei: A-A-60 auf die übrigen Prüfpfade anwenden — `proof:tags`,
`proof:conflicts`, `proof:callers` und `proof:db-permissions` sind nach diesem Maßstab noch
nicht durchgesehen.
