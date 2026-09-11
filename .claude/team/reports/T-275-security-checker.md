# T-275 — Zwei Auflagen in meinem Papier behaupteten das Gegenteil des Bestands

Aufgabe: T-275 — A-V-11 und die Beurteilung dazu nach der Schärfung von A-18.11 neu fassen
Status: fertig
Urteil: **freigegeben** (T-273er Verhaltensänderung), mit sechs offenen Nachzügen bei anderen Rollen

## Artefakte

* `docs/bedrohungsmodell.md` — sechs Berichtigungen an Ort und Stelle (A-A-70) und der neue
  **Abschnitt 36** (358 Zeilen). Nichts anderes angefaßt; kein Produktivcode.

Berichtigt, jede mit Marke, Datum und altem Wortlaut:

| Stelle | Was dort stand |
|---|---|
| 18.5, Zeile „Häufigkeit" (3894) | Boden „zwischen zwei Anfragen desselben **Laufs**" |
| 18.5, Zeile „Nach einem Fehlschlag" (3895) | „Der Zeitgeber wird … **nicht** neu gestellt … und es ist die Anforderung" |
| 18.9, **A-V-11** (4071) | Auflage **und** Meßvorschrift „bleibt die Zahl bei eins" — neu gefaßt als **A-V-11′** (36.4) |
| 18.10, T-136-5 (4097) | „Ein weiteres Argument … gegen jeden Wiederholungsversuch" |
| 19.1, Urteil zu A-V-11 (4204) | „Nach einem Fehlschlag wird **nicht** neu geplant" — als *erfüllt* abgenommen |
| 19.2 Messung 1 und T-145-3 | „Die Versionsprüfung hörte auf zu arbeiten" / „ohne Wiederholung im selben Lauf" |

Neu: **A-V-11′** (36.4), **A-V-24** (Boden zweifach durchgesetzt), **A-V-25** (geerbte Umgebung
des Sidecars gegen die festgenagelte Node-Fassung messen).

## Zusammenfassung

Der Auftrag nannte zwei Stellen; es waren sechs in meinem Papier und acht draußen. Der Schaden lag
nicht im Wortlaut, sondern in der **Meßvorschrift**: „nach einem erzwungenen Fehlschlag bleibt die
Zahl der ausgehenden Anfragen bei eins" hätte ab heute die Behebung als Verstoß gemeldet —
dieselbe Bauart wie der Wächter unter A-A-21, der die geschlossene Tür maß. A-V-11′ mißt deshalb
gegen die **Uhr** statt gegen eine Zahl, mit zwei Gegenproben: ein Prüfer, der nach einem
Fehlschlag nicht neu plant, muß rot werden, und einer, der sofort neu versucht, ebenfalls. Drei
eigene Messungen gegen den Produktivcode (nicht über die Prüfreihe — die liegt bei T-274): der
Boden hält (305/310/314/313 ms gegen 300), der Zustand bleibt `unknown`, `stop()` plant nichts
nach; eine bei jedem Blick um eine Stunde vorspringende Uhr erhöht die Zahl der Anfragen **nicht**;
`NODE_USE_ENV_PROXY` hat auf Node 22.23.2 keine Wirkung auf `fetch`. Kein Wächter friert das alte
Verhalten ein — außer dem Prüffall, den T-274 ablöst.

## Annahmen

* „Lauf" = Prüflauf, wie vom Auftraggeber entschieden und in `docs/spec.md:346` geschärft.
* Die Zahlen von domain-dev (24 je Kalendertag, 25 im gleitenden Fenster) habe ich übernommen und
  am Code nachvollzogen, nicht über 24 Stunden nachgemessen.
* `NODE_EXTRA_CA_CERTS` habe ich **nicht** gemessen; die Aussage stammt aus der Node-Dokumentation
  und ist als solche gekennzeichnet.

## Risiken und Sicherheitshinweise

* **Der Gewinn ist größer als der Preis, und er liegt woanders als in der Fehlermeldung.** Vor
  T-273 genügte **eine** gestörte Verbindung, um die Aktualisierungsmeldung für die gesamte
  Laufzeit zu unterdrücken. Bei unsignierten Erzeugnissen ist diese Meldung der einzige Weg, auf
  dem eine Sicherheitsbehebung den Benutzer erreicht.
* **Mißbrauch der Wiederholung: Faktor 24, gedeckelt, nicht kumulativ, kein Verstärker.** Der
  billigere Hebel ist älter — ein Neustart des Sidecars umgeht den Boden vollständig
  (rechnerisch 360 Anfragen je Stunde), weil `lastRequestAt` im Arbeitsspeicher liegt (T-275-7).
* **Die geteilte GitHub-Anfragebegrenzung klärt sich nicht mehr von selbst** (T-275-8): ab etwa
  sechzig Installationen hinter einer Quelladresse selbsterhaltend und still.
* **R-19 Punkt 3 bewegt sich, die Schwere nicht.** Der Fehlerfall ist der gesprächigere, und sein
  Zuhörer ist nicht GitHub, sondern wer die Verbindung abfängt. Vorschlag für den Nachsatz in 36.3;
  `risks.md` gehört dem Orchestrator.
* **„Nichts ändern" ist die sichere Wahl.** Eine Schaltfläche „Jetzt prüfen" wäre die von E-069
  ausgeschlossene Route mit einer Hand darauf — und die Hand gehört auf diesem Rechner nicht nur
  dem Benutzer.
* Semgrep (Guardian) und 42Crunch stehen zum wiederholten Mal nicht zur Verfügung (T-275-9).

## Offene Fragen an den Orchestrator

1. Soll der Zeitpunkt der letzten Anfrage in den Bestand (T-275-7)? Schließt zugleich den
   Neustart-Hebel. Entscheidung, keine Codezeile.
2. Rückstufung (1 h → 2 h → 4 h → 8 h → 24 h) oder Streuwert gegen die selbsterhaltende
   Anfragebegrenzung (T-275-8)? Beides nicht verlangt.
3. R-19 Punkt 3 um den Nachsatz ergänzen?

## Nächster Schritt

In derselben Welle oder unmittelbar danach: T-275-2 und T-275-3 (domain-dev, zwei Kommentare im
**Produktivcode**, die eine Zusage geben, die der Nachbar bricht), T-275-5 (e2e-tester,
TP-VER-07 nagelt die alte Zahl fest), T-275-4 (domain-dev, `proof-access-entry.ts`), T-275-6
(documenter, Glossar und Benutzerhandbuch — im Glossar steht zusätzlich ein toter Pfad).
