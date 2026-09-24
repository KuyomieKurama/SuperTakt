# T-230 — security-checker

**Aufgabe:** T-230 (Welle AI) — A-A-60 an vier Läufen, die diesen Maßstab noch nicht gesehen haben
(`proof:tags`, `proof:conflicts`, `proof:callers`, `proof:db-permissions`), und die Entscheidung
über den Rest, den domain-dev zu A-A-56 benannt hat.

**Status:** fertig — **Nacharbeit**

---

## Artefakte

| Datei | Änderung |
|---|---|
| `docs/bedrohungsmodell.md` | Abschnitt **30** neu (30.0 bis 30.10): sechs Befunde, eine Feststellung, fünf neue Auflagen (A-A-61 bis A-A-65), sechs nicht bestätigte Erwartungen, drei portbedingte Vorhersagen, die Entscheidung zum Rest von A-A-56 |
| `.claude/team/reports/T-230-security-checker.md` | dieser Bericht |

**Kein Produktivcode berührt, kein Nachweispfad geändert.** Alle Kunstquellen und Verstümmelungen
sind ausschließlich im Spiegel unter `/tmp/t230` entstanden und mit ihm gelöscht. Der versionierte
Bestand führt weder `Zweitweg` noch `teil1` noch `t230`.

---

## Zusammenfassung

**Die Antwort ist zum achten Mal ja, und diesmal in vier Läufen von vier.** `proof:callers` sagt
`ok  \`fetch\` steht nur in api/client.ts (0 Dateien durchgesehen)` und bleibt bei **45/0, Code 0**,
wenn sein Sammler nichts mehr einsammelt — und seine sechs Gegenproben aus A-A-40 können das
strukturell nicht sehen, weil `proveFetchGuard` die eingesetzte Datei der **Liste** hinzufügt statt
der Platte und damit das Sieb prüft, nie die Ernte. Derselbe Lauf trägt in seiner Zwillingszeile
unverändert den Ausdruck, den er zwanzig Zeilen darüber als blind ausweist: eine Ansicht, die
`client.request(…)` über den Namensraum ruft, ist für beide Wächter unsichtbar (**45/0**), während
die benannte Einfuhr rot wird (**44/1**) — ein zweiter Weg zum Dienst an Abschnitt 2 bis 5 vorbei.
`proof:tags` Abschnitt 1 sagt „die Migration errechnet für alle **30** Namen denselben Schlüssel",
wenn er **null** Zeilen verglichen hat (**16/0, Code 0**), und `proof:conflicts` läßt den Block
`ux_tag_name` grün durchgehen, während SQLite `index 'ux_tag_name_key'` meldet — zwei der vierzehn
Blöcke messen denselben Index, einer gar keinen, und der Lauf sagt **61/0**. **Der Rest von A-A-56
trägt**, und die Begründung dafür, warum die Durchgriffsprobe keine Bedingung wird, steht
ausgeschrieben in 30.7: Sie ist gemessen falsch negativ, und sie zur Bedingung zu machen wäre
selbst ein Verstoß gegen A-A-60.

---

## Wie gemessen wurde

Am Verhalten, außerhalb des Bestands, wie in T-176, T-183, T-189, T-206 und T-223. Der Spiegel
unter `/tmp/t230/root` trägt die Gestalt des Arbeitsbereichs; anders als in T-223 ist **`packages`
eine Kopie und kein Verweis**, weil die Messung an `proof:db-permissions` eine Verstümmelung in
`packages/storage/src/sqlite/database.ts` verlangt und die den echten Baum nicht berühren durfte.

Die portgebundenen Teile sind nicht abgeschaltet, sondern **abgeschnitten** — dieselbe Bauart, die
domain-dev in T-225 benutzt hat. `tags-teil1.mjs` ist zeichengleich Zeile 1–410 von
`proof-tags.mjs`, `conflicts-teil1.mjs` Zeile 1–532 von `proof-conflicts.mjs`,
`dbperm-teil13.mjs` Zeile 1–206 und 269–Ende von `proof-db-permissions.mjs`, je mit der
unveränderten Schlußauswertung. Keiner der drei Schnitte enthält `spawn(process.execPath` oder
`waitForPortFree(PORT)` — nachgezählt, je **0**.

Zeichengleichheit doppelt belegt: `diff -rq` über `apps/web/src`, `apps/outlook-addin/src`,
`apps/local-api/scripts` und die verstümmelte Speicherdatei ohne Unterschied, und eine Prüfsumme
aller `ok`/`FEHL`-Zeilen vor der ersten und nach der letzten Messung:

| Lauf | vorher | nachher | Zahlen |
|---|---|---|---|
| `proof:callers` | `3479464283` | `3479464283` | **45/0** |
| `proof:tags` Abschnitte 1–3 | `181362322` | `181362322` | **16/0** |
| `proof:conflicts` Abschnitt 1 | `2453847206` | `2453847206` | **61/0** |
| `proof:db-permissions` Abschnitte 1–3 | `3239101755` | `3239101755` | **11/0** |

`proof:callers` ist zusätzlich **im Bestand selbst** gefahren (portfrei) und ergibt dieselbe
Prüfsumme `3479464283` — der Spiegel bildet nicht nur sich selbst ab.

**Nicht gefahren:** `proof:all` (E-083 Punkt 3), kein portgebundener Lauf (E-083 Punkt 2).
**Nicht versucht:** Guardian und 42Crunch (E-079 Punkt 3) — **dreizehntes** Mal ohne Werkzeug, und
zum ersten Mal als **Zustand**: Der Auftraggeber hat bestätigt, daß es keinen Zugang gibt.

---

## Messungen

### `proof:callers` — drei Befunde an einer Zusage

| Kunstquelle / Verstümmelung | Lauf | Code | Zeile |
|---|---|---|---|
| *unverändert* | **45/0** | 0 | `ok … (117 Dateien durchgesehen)` |
| Sammler `walk` verstümmelt (Dateien bleiben liegen) | **45/0** | **0** | `ok \`fetch\` steht nur in api/client.ts (**0 Dateien durchgesehen**)`, alle sechs Selbstproben grün |
| Sammler `walkAddin` verstümmelt | **45/0** | **0** | `ok \`fetch\` steht im Add-in nur in api/client.ts (**0**)`, alle sechs grün |
| `import * as client …; client.request('/todos/…', …)` | **45/0** | **0** | beide Zeilen grün, Zahl steigt klaglos auf 118 |
| `import { request } …; request('/todos/…', …)` | 44/1 | 1 | `FEHL \`request(\` steht nur in api/endpoints.ts — app/Zweitweg.tsx` |

Endungen, dieselbe Kunstquelle (nacktes `fetch(` auf den Dienst), sonst zeichengleich:

| `.tsx` | `.ts` | `.jsx` | `.js` | `.mts` | `.cts` | `.mjs` |
|---|---|---|---|---|---|---|
| 44/1 rot | 44/1 rot | **45/0** | **45/0** | **45/0** | **45/0** | **45/0** |

Bei den fünf grünen bleibt die Zahl im Text bei **117** stehen — der Lauf bemerkt die 118. Datei
nicht.

### `proof:tags` Abschnitt 1

| Verstümmelung | Lauf | Code | Wirkung |
|---|---|---|---|
| *unverändert* | 16/0 | 0 | — |
| `SELECT … WHERE 0` — der Leser sieht keine Zeile | **16/0** | **0** | „für alle 30 Namen …" **grün**, nichts wird rot |
| die Vorlagen gelangen nicht in den Bestand | 15/1 | 1 | Abschnitt 1 **grün**; rot wird Abschnitt 2 mit dem **falschen** Grund („ein zweites Tag … durchgekommen") |

### `proof:conflicts` Abschnitt 1

| Kunstquelle | Lauf | Code | Beleg |
|---|---|---|---|
| *unverändert* | 61/0 | 0 | — |
| `ux_tag_name`-Block bekommt einen kollidierenden Schlüssel | **61/0** | **0** | `ROH ux_tag_name: UNIQUE constraint failed: index 'ux_tag_name_key'` — alle vier Zeilen grün |

### `proof:db-permissions` Abschnitte 1–3

| Verstümmelung | Lauf | Code | Abschnitt 1 | Abschnitt 2 | Abschnitt 3 |
|---|---|---|---|---|---|
| *unverändert* | 11/0 | 0 | grün | grün | grün |
| Maßnahme aus, `umask` weit (`0o000`) | **6/5** | **1** | 3× rot | rot | rot |
| Maßnahme aus, `umask` eng (`0o077`) | 10/1 | 1 | **3× grün** | rot | **grün** |

### Sechs Erwartungen, die sich nicht bestätigt haben

1. `proof:conflicts` Abschnitt 1 trägt A-A-60 in **drei** Formen und im Wortlaut: Untergrenze
   (`inSchema.length > 0`), beide Richtungen, und die Absicherung der eigenen Gegenprobe gegen die
   leere Menge (`nested.length > 0`, „ohne einen solchen Fall sagt die Prüfung darüber nichts").
   Der Erläuterungstext des Auslösers lautet buchstäblich „kein Wurf — **die Vorbedingung stimmt
   nicht**". Wellen vor der Formulierung der Regel.
2. `proof:db-permissions` Abschnitt 2 ist die sauberste Vorbedingungsmessung dieses Baums —
   „Ausgangslage hergestellt: takt.db liegt mit 0644", dann die Wirkung. Gemessen: der einzige
   Abschnitt, der M2 überlebt.
3. `proof:db-permissions` Abschnitt 4 (gelesen, nicht gefahren) fängt seine Blindheit ausdrücklich:
   `check('der Dienst legt seinen Bestand an', appeared, …)` steht **vor** allen Rechteaussagen,
   die Verzeichnisdurchsicht liegt **innerhalb** von `if (appeared)`.
4. `proof:callers` Abschnitt 0 hält: die Zahl auf **zwei** Wegen ermittelt (Syntaxbaum und
   Rohtext), Untergrenze `>= 45`, `unreadable.length === 0`; Abschnitt 5 trägt
   `withBody >= 25 && withQuery >= 5`; Abschnitt 7 hat dieselbe Doppelermittlung. Drei erwartete
   Lücken, keine gefunden.
5. Eine Selbstprobe, die ins Leere greift, wird **rot** gemeldet („die Stelle wurde nicht
   gefunden"), dazu die Prüfung auf Einzeiligkeit. Erwartet hatte ich stilles Überspringen.
6. `proof:tags` Abschnitte 3 bis 8 sind positiv verankert (`after.length === 6`,
   `creators.length === 1`, `… .length === 8`, `theTag !== undefined &&`). Die Blindheit sitzt in
   Abschnitt 1 und **nur** dort.

### Drei Vorhersagen, portbedingt ungemessen (30.6)

- **V-1** `proof:tags` Abschnitt 9: `tooMany.status === 422` und `blank.status === 422` nennen den
  **Grund** nicht. Dieselbe Klasse wie T-230-5; Abschnitt 8 macht es richtig. Erwartung: eine
  Kunstquelle, die aus einem anderen Grund 422 erzeugt, läßt beide Zeilen grün.
- **V-2** `proof:tags` Abschnitt 5: Die Zusage ist die gemeinsame Transaktion (T-047), gemessen
  wird `afterFailure.length === beforeFailure`. Das ist auch wahr, wenn das Tag nie entstanden ist.
  Erwartung: ein Fehlschlag **vor** der Tag-Anlage läßt alle drei Zeilen grün.
- **V-3** `proof:db-permissions` Abschnitt 4 hat als einziger der drei **kein** `waitForPortFree`
  und keine Portmeldung, sondern eine unbelegte Zusage im Kommentar („Verzeichnis, Datenbank und
  Migration entstehen im Start **vor** dem Binden"). Stimmt sie nicht, wird der Lauf bei belegtem
  Port rot mit der falschen Begründung. Zu messen: einmal mit belegtem Port fahren.

---

## Annahmen

1. **„Miß, statt zu lesen" heißt hier: schneiden statt abschalten.** Drei der vier Läufe sind
   portgebunden; ich habe ihre portfreien Teile **zeichengleich** aus der Datei geschnitten statt
   sie nachzubauen. Ein Nachbau wäre grün gewesen und hätte nichts gesagt.
2. **Ein Ausweichport kam nicht in Frage.** `DEFAULT_PORT` ist in `apps/local-api/src/config.ts`
   ausdrücklich nicht einstellbar, weil B-1.1 Punkt 3 das verlangt. Einen Schalter dafür zu bauen,
   um eine Messung zu ermöglichen, hätte das Gegenmittel aufgehoben, das die Messung schützen soll.
3. **T-230-3 ist „soll" und nicht „muß"**, obwohl der Weg derselbe ist wie in T-230-2: Heute liegt
   keine solche Datei im Baum, und die Behebung besteht in einem Zeichen. T-230-1 und T-230-2 sind
   „muß", weil die Zusage dort **schon heute** über einer Menge steht, deren Vollständigkeit
   niemand prüft.
4. **T-230-6 ist „soll"**, weil der Lauf in M2 als Ganzes rot wird. Er wird es nur wegen Abschnitt
   2 und nennt dabei drei grüne Zeilen, die falsch sind — deshalb zusätzlich eine Berichtigung des
   Dateikopfes und nicht nur eine Auflage.
5. **Die Ableitung `VERMERK_MARKE` aus T-225 (dortige Offene Frage 2) ist im Sinne von A-A-57.**
   A-A-57 verbietet zwei unabhängige Zeichenketten, nicht eine Ableitung aus **einer**. Die dritte
   Gegenprobe des Erbauers (gekürzte Ausleitung → rot) zeigt, daß der Wortlaut schwächer gewesen
   wäre als der Zweck. Ich habe das **nicht** nachgemessen — `proof:export` ist portfrei, aber die
   Frage lag außerhalb meines Auftrags; sie ist damit beantwortet, nicht gemessen.
6. **Als Zuständigen für alle sechs Befunde habe ich domain-dev eingetragen**, weil alle fünf
   Auflagen in `apps/local-api/scripts/**` liegen.

---

## Risiken

1. **T-230-2 ist bis zur Behebung ein offener Weg an einem Sicherheitswächter vorbei**, und es ist
   derselbe Weg, den A-A-40 für `fetch` geschlossen hat. Heute liegt keine solche Ansicht im Baum
   (`git grep` über `apps/web/src`: kein `client.request(`), die Behebung kostet also keinen
   falschen Alarm — und der Weg bleibt offen, bis sie da ist.
2. **T-230-1 nimmt `proof:callers` seine Vorbedingung, solange er besteht.** 41 der 45 Zeilen
   ruhen auf „es gibt keinen zweiten Weg als diese Datei". Der Lauf kann heute nicht sagen, ob er
   diese Zusage gemessen oder über der leeren Menge bestanden hat.
3. **Drei Vorhersagen sind ungemessen** (30.6). Sie stehen als Erwartung mit ihrer Verstümmelung
   da, damit die nächste portfreie Welle sie nachfährt statt sie neu zu suchen. Eine Vorhersage
   ist kein Befund.
4. **Die fehlende zweite Gegenprobe zu T-223-5 ist weiterhin offen.** Daß `proof:access` und
   `proof:export-api` inzwischen mit **106/0** und **72/0** vollständig gefahren sind, erledigt sie
   nicht: Sie ist eine **Gegenprobe** (Aufspaltung von `verifier.ts`), kein grüner Lauf. Sie
   braucht weiterhin eine Welle ohne e2e-Lauf.
5. **Die Aussage über die OpenAPI-Beschreibung ruht vollständig auf `proof:openapi`** — und das ist
   seit dieser Welle ein **Zustand**, keine Warteposition. Ein zweites, fremdes Augenpaar wird es
   nicht geben. Der einzige Ersatz ist, die eigenen Läufe regelmäßig gegen Verstümmelungen zu
   fahren; A-A-60 ist damit keine Ordnungsregel mehr, sondern der Ersatz für ein fehlendes
   Werkzeug.
6. **Kein Sicherheitsrisiko neu entstanden.** Keine zweite Adresse außerhalb `127.0.0.1` (E-001),
   kein Produktivcode berührt, keine Fachlogik angefaßt. Die Verstümmelung in `packages/storage`
   ist im Spiegel entstanden und zurückgenommen; `diff` gegen den Bestand ohne Unterschied.

---

## Offene Fragen

1. **An den Orchestrator: E-083 Punkt 2 hat diesmal getragen** — ich habe keinen portgebundenen
   Lauf gefahren und keinen Anlauf verschwendet. Der Preis steht in 30.6: drei Vorhersagen statt
   drei Messungen. Die Entzerrung aus Punkt 4 derselben Entscheidung ist damit zum dritten Mal
   fällig.
2. **An den Orchestrator: A-A-61 bis A-A-65 gehören zu domain-dev**, alle fünf in
   `apps/local-api/scripts/**`, keine berührt Produktivcode. **A-A-62 zuerst**, weil sie als
   einzige einen offenen Weg an einem Sicherheitswächter vorbei schließt.
3. **An den Orchestrator: gehört `proveFetchGuard` als Bauart in A-A-60 hinein?** Die Selbstprobe
   speist ihren Prüfgegenstand an der Sammelstelle vorbei ein. Das ist in T-188 vier echte Lücken
   wert gewesen und ist trotzdem der Grund, warum der Lauf seine eigene Blindheit nicht sieht. Ein
   Satz dazu in A-A-60 („eine Selbstprobe geht denselben Weg wie der Prüfgegenstand, oder sie sagt,
   welchen sie ausläßt") wäre die neunte Anwendung derselben Regel — die Entscheidung liegt nicht
   bei mir (E-078 Punkt 3).
4. **An mich selbst, für die nächste Welle:** Übrig sind nach dieser Prüfung noch
   `proof:codepoints`, `proof:migrations`, `proof:taskpane`, `proof:addin-wiring`,
   `proof:foreign`, `proof:surface`, `proof:shell-surface` und `proof:addin`. Die drei
   Oberflächenläufe stehen seit T-223 Offene Frage 4 aus; `proof:foreign` und `proof:surface` sind
   portfrei und damit auch in einer Welle mit e2e-Lauf messbar.

---

## Nächster Schritt

**Vorschlag:** domain-dev baut A-A-61 bis A-A-65 in **einer** Aufgabe — fünf Auflagen, vier
Dateien, alle in `apps/local-api/scripts/**`, keine berührt Produktivcode. **A-A-62 zuerst**
(offener Weg), dann A-A-61 (die Vorbedingung von 41 Zeilen), dann A-A-63 bis A-A-65, die je eine
Bedingung in einer bestehenden Zeile sind.

**In einer Welle ohne e2e-Lauf, in dieser Reihenfolge:** die zweite Gegenprobe zu T-223-5
nachholen, dann die drei Vorhersagen V-1 bis V-3 aus 30.6 messen, dann A-A-63 und A-A-64 im
**vollen** Lauf von `proof:tags` und `proof:conflicts` abnehmen — die Schnitte tragen den Befund,
nicht die Abnahme.
