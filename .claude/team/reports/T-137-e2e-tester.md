# T-137 — Testplan für die Versionsprüfung

**Status:** fertig (als Plan — kein Testfall ist oder konnte ausgeführt werden, siehe unten)

**Artefakte:**
- `docs/testplan.md`, neuer Abschnitt „24. Versionsprüfung — Plan vor dem Bau (T-137, Welle P)"
  (Zeilen 3111–3492), 26 Testfälle `TP-VER-01` bis `TP-VER-26`
- Dieser Bericht

Keine `.spec.ts`, keine Fixture-Dateien angelegt — wie in der Aufgabenstellung verlangt.
`pnpm test:e2e` und `pnpm desktop` habe ich nicht gestartet.

## Zusammenfassung

Ich habe `docs/spec.md` Abschnitt 18 (A-18.1–A-18.12), `decisions.md` E-064/E-065, `risks.md`
R-19/R-20, `CLAUDE.md` Abschnitt „Versionsprüfung" und `board.md` Welle P gelesen und daraus 26
Testfälle abgeleitet, gruppiert in: eine Fehlschlag-Familie (still, mit Grund im Protokoll,
`TP-VER-01`–`07`), Stille bei Gleichstand bzw. lokal neuerer Fassung (`TP-VER-08`/`09`), den
Dialog bei einer echten neueren Fassung (`TP-VER-10`), Überspringen über einen echten Neustart
hinweg mit geleertem Browserspeicher (`TP-VER-11`/`12`), „Installieren" ohne jeden Download
(`TP-VER-13`), eine dreiteilige Gegenprobe zu A-18.9 nach dem Vorbild der bestehenden `proof:*`-
Nachweispfade (`TP-VER-14a`–`c`), die Ordnung der Fassungen als parametrisierte Unit-Tabelle mit
acht Fällen plus einem Ablehnungsfall (`TP-VER-15`–`23`), und drei ergänzende Fälle, die A-18.1,
A-18.3 und A-18.12 abdecken, welche in den zehn Mindestfällen der Aufgabenstellung nicht explizit
genannt waren (`TP-VER-24`–`26`). Jeder Fall trägt Anforderungs-ID(s), Ebene, Vorbedingung,
Schritte und Erwartung, wie im übrigen Dokument üblich.

Der größte eigenständige Befund dieser Aufgabe: Der Abschnitt braucht **zwei** Dinge, bevor
überhaupt etwas laufen kann, nicht nur eines. Wie überall im Dokument fehlt die Fachlogik selbst
(T-138/T-139). Zusätzlich — und das ist neu gegenüber jedem bisherigen Abschnitt — fehlt eine
Nachbildung der fremden GitHub-Antwort. Der gesamte bisherige Testaufbau (`services.ts`) läuft
ausdrücklich „ohne Attrappen-Server, ohne gestubbtes fetch" gegen echte erste Parteien; A-18.2
führt zum ersten Mal eine echte dritte Partei ein, gegen die dieselbe Linie aus guten Gründen
(Determinismus, Wiederholbarkeit, kein Lebenszeichen an das echte GitHub bei jedem Testlauf,
R-19 Punkt 3) nicht zu halten ist. Ich habe diese Lücke nicht verschwiegen, sondern im Plan
benannt: eine vorgeschlagene lokale HTTP-Attrappe (`tests/e2e/support/github-releases-stub.ts`
für End-to-End, ein einfacherer Testserver in `apps/local-api/test/**` für Integration), plus die
noch offene, nicht in meiner Hoheit liegende Architekturfrage, wie der Dienst im Test auf diese
Attrappe statt auf das echte GitHub zeigt, ohne A-18.3 („nicht einstellbar") im Produktivbetrieb
aufzuweichen — ich schlage eine Portschnittstelle nach dem Vorbild von `packages/storage` vor,
entscheide sie aber nicht.

Für die Gegenprobe zu A-18.9 (Aufgabenpunkt 10) habe ich einen dreiteiligen Nachweis vorgeschlagen
statt eines einzelnen Testfalls: ein statischer `proof:*`-Nachweis nach dem Vorbild von
`proof:route-policy`/`proof:addin` (zählt jede Aufrufstelle des Tauri-`shell`-Plugins im ganzen
Baum, erwartet genau eine), ein dynamischer Aufrufzähler über den gesamten Testlauf (Ebene
Integration, T-140) und eine Download-/Seiten-Ereigniswache über den gesamten End-to-End-Lauf
dieses Abschnitts. Ein Test, der nur den einen bekannten Knopf beobachtet, beweist laut
Aufgabenstellung selbst nicht die Abwesenheit jedes anderen Weges — deshalb die strukturelle
Komponente zusätzlich zur Verhaltensprüfung.

Die einzigen Fälle, die ohne jede Attrappe sofort lauffähig sind, sobald T-138 liefert: die acht
parametrisierten Ordnungsfälle plus der Ablehnungsfall (`TP-VER-15`–`23`, reine Fachlogik in
`packages/domain`, kein HTTP). Sie decken wörtlich die vier von der Aufgabenstellung verlangten
Fälle ab: `0.10.0` über `0.9.0` (und umgekehrt), Vorabfassungen, Gleichstand, führendes `v` —
jeweils so gewählt, dass ein naiver Zeichenkettenvergleich sichtbar scheitern würde.

## Annahmen

- Ich habe für die Fassungsordnung SemVer-artige Vorrangregeln angenommen (eine Vorabfassung gilt
  als älter als die fertige Fassung derselben Kernversion, `TP-VER-20`) — A-18.4 legt das nicht
  wörtlich fest, nur „eine festgelegte Ordnung … nicht dem Zeichenkettenvergleich". Als Testfall
  markiert, nicht als stille Vorgabe behandelt (siehe Tabellenspalte „Warum").
- Ich habe drei zusätzliche Fälle (`TP-VER-24`–`26`) über die zehn Mindestfälle der
  Aufgabenstellung hinaus aufgenommen, damit A-18.1 (eine Quelle für die installierte Fassung),
  A-18.3 (keine Weiterleitung auf einen fremden Wirt) und A-18.12 (Anfrage überträgt nichts) nicht
  ohne jede eigene Prüfung im Dokument stehen — konsistent mit der Projektregel „keine Umsetzung
  ohne Deckung durch eine Anforderungs-ID", angewandt auf den Testplan selbst.
- Ich habe den Abschnitt als eigenständigen, neuen Abschnitt 24 angehängt statt die bestehende
  „Rückverfolgbarkeit"-Tabelle (Zeile ~1718) rückwirkend zu erweitern — das folgt der Praxis der
  Abschnitte 14–23, die dieselbe Tabelle ebenfalls nicht nachträglich angefasst haben. Ebenso habe
  ich weder die „Stand:"-Zeile am Kopf des Dokuments noch das ID-Schema-Absatz (Zeile ~79) um
  „VER" ergänzt, aus demselben Grund: Auch `TP-SHELL-*`/`TP-BIDI-*` aus Abschnitt 23 stehen dort
  nicht.
- Für `TP-VER-06` (keine Veröffentlichung) habe ich zwei mögliche HTTP-Formen offengelassen
  (`404` auf die Einzelabfrage vs. leere Liste auf die Listenabfrage), weil unklar ist, ob T-138
  `/releases/latest` oder `/releases` befragt — als offene Frage markiert, nicht entschieden.

## Risiken

- **Die genannte Attrappen-Lücke ist die größte Gefahr für die nächste Welle:** Ohne eine
  getroffene Entscheidung, wie der Dienst im Test auf eine lokale GitHub-Attrappe zeigt, bleiben
  22 der 26 Fälle (alle außer der reinen Ordnungsfunktion) bis zu dieser Entscheidung unausführbar
  — unabhängig davon, wie vollständig T-138/T-139 sonst geliefert werden. Das ist kein Fehler
  dieses Plans, aber ein Blocker, den T-138 zusätzlich zur eigentlichen Umsetzung lösen muss.
- **Sicherheitsrelevant:** `TP-VER-25` (keine Weiterleitung auf einen fremden Wirt) und `TP-VER-26`
  (keine übertragenen Kennungen) übersetzen R-19 direkt in Testfälle. Ohne sie bliebe der
  gefährlichste Einzelweg aus R-19 Punkt 2 („Eine Adresse aus dieser Antwort kann zum
  Öffnen-Befehl der Hülle wandern") nur durch `TP-VER-14a` (statische Prüfung) abgedeckt, nicht
  durch eine Verhaltensprüfung mit einer tatsächlich bösartigen Antwort.
- Zwei der drei Bausteine für die Gegenprobe zu A-18.9 (`TP-VER-14a`, statischer Nachweis; ein
  Teil von `TP-VER-24`) liegen unter `apps/desktop/**`, also außerhalb meiner Hoheit — ich kann
  sie vorschlagen, aber nicht bauen. Ohne sie bleibt die Gegenprobe unvollständig (nur
  Verhaltensprüfung, keine strukturelle Abwesenheitsprüfung).
- `TP-VER-11`/`12` (Überspringen über einen Neustart) brauchen einen Neustart-Helfer in
  `tests/e2e/support/**`, den es heute nicht gibt (geprüft: kein Treffer auf „restart"/„Neustart"/
  „relaunch" im Bestand). Ohne ihn lässt sich R-20 nur mit dem schwächeren Nachweis „Seite neu
  geladen, Browserspeicher geleert" führen, nicht mit einem echten Prozess-Neustart des Dienstes.

## Offene Fragen

1. **Architekturfrage an domain-dev/Orchestrator (blockiert 22 von 26 Fällen):** Wie zeigt der
   Dienst im Test auf eine lokale GitHub-Attrappe statt auf das echte GitHub, ohne A-18.3 für den
   Produktivbetrieb aufzuweichen? Ich schlage eine Portschnittstelle (Konstruktionsparameter,
   ausschließlich vom Testaufbau nutzbar) vor, entscheide sie aber nicht.
2. Fragt T-138 `/releases/latest` (Einzelabfrage) oder `/releases` (Liste, eigene Ordnung) ab?
   Bestimmt die konkrete HTTP-Form von `TP-VER-06` und die Fixture-Gestalt.
3. Ist die SemVer-artige Vorrangregel für Vorabfassungen (`TP-VER-20`/`21`) tatsächlich gewollt,
   oder ordnet T-138 Vorabfassungen anders (z. B. ignoriert sie ganz, meldet nie eine
   Vorabfassung als „neuer")? Aktuell nur als Annahme markiert.
4. Wer baut `proof:release-safety` (`TP-VER-14a`) — frontend-dev im Zuge von T-139, oder eine
   eigene künftige Aufgabe? Ich kann sie wegen der Dateihoheit (`apps/desktop/**`) nicht selbst
   anlegen.
5. Auf dem aktuellen Board existiert keine eigene künftige Aufgabe, die die in diesem Plan
   beschriebenen `.spec.ts`-Dateien tatsächlich unter `tests/e2e/**` anlegt (wie schon in T-002
   für den Rest des Dokuments festgestellt) — nur T-140 (unit-tester) ist für die nächste Welle
   vorgesehen und deckt laut Wellenbeschreibung Integrations-/Unit-Ebene ab, nicht die
   End-to-End-Fälle dieses Abschnitts (`TP-VER-08`/`09` Spotcheck, `TP-VER-10`–`13`, `TP-VER-14c`,
   `TP-VER-24` Spotcheck). Gehört in die Wellenplanung nach T-138/T-139.

## Nächster Schritt

Vorschlag: Die Architekturfrage 1 vor dem Start von T-138 klären (Portschnittstelle für die
GitHub-Quelle), damit domain-dev sie gleich beim Bau der Route berücksichtigt statt sie
nachträglich einzuziehen. Parallel dazu T-140 (unit-tester) und eine künftige e2e-Aufgabe anhand
der Tabelle „Zusammenfassung: Lauffähigkeit dieses Abschnitts" (`docs/testplan.md`, Ende von
Abschnitt 24) einplanen, damit die Zuständigkeit für jeden der drei fehlenden Bausteine
(GitHub-Attrappe, `shell-shim.ts`-Erweiterung, `proof:release-safety`) von Anfang an klar ist.
