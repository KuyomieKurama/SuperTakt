Aufgabe: T-401b — Verbleibende Prüffälle nach echtem Neustart (motionIntensity, Bidi-Zeichen, Bündelvollständigkeit)
Status: fertig
Artefakte:
- `apps/web/test/public/startupAppearance.test.ts` (geändert — zwei Erwartungsobjekte ergänzt)
- `apps/desktop/src-tauri/src/attachment.rs` (geändert — ein neuer `#[cfg(test)]`-Fall, kein Produktivcode angefasst)
- `apps/web/test/lib/labelsCompleteness.test.ts` (neu)

Zusammenfassung: Die zwei durch E-139 (`motionIntensity`) rot gewordenen Fälle in
`startupAppearance.test.ts` sind repariert, indem die beiden betroffenen Erwartungsobjekte um
`motionIntensity: 'subtle'` ergänzt wurden — das ist genau der Vorgabewert, den
`startup-appearance.js` selbst schreibt (`root.dataset.motionIntensity = value.motionIntensity ?? 'subtle'`),
kein geratener Wert. Für `is_forbidden_path_character`/`check_file` kam ein neuer Rust-Prüffall
dazu, der jetzt U+061C, U+200E, U+200F, je einen Vertreter aus U+202A–U+202E und aus U+2066–U+2069
über `check_file` prüft (vorher deckte der bestehende Fall nur `\n`). Für die Bündelvollständigkeit
von `apps/web/src/lib/labels.ts` gibt es eine neue Prüfdatei, die `de`- und `en`-Bündel rekursiv
durchläuft und jeden leeren oder fehlenden Zeichenkettenwert meldet — mit einer einzigen,
dokumentierten Ausnahme (`en.affected.one`/`en.affected.many`, im Quelltext selbst als
grammatische Absicht kommentiert).

Prüfung:
- `vitest run apps/web/test/public/startupAppearance.test.ts` — vorher (via `git stash`) 2 von 64
  Fällen rot (genau die zwei erwarteten, Fehlermeldung zeigt das fehlende `motionIntensity: "subtle"`),
  danach 64/64 grün.
- `vitest run apps/web` (gesamt) — 247/247 grün, 20 Testdateien.
- `pnpm --filter @takt/web typecheck` — grün, keine Fehler.
- `cargo test --lib attachment::` — vorher 31 Fälle grün (Baseline ohne den neuen Fall), danach
  32/32 grün mit `check_file_rejects_bidi_and_format_control_characters`.
- `cargo test --lib` (ganzes Crate) — 77 bestanden, 1 ignoriert, 0 fehlgeschlagen.
- Rot-vor-Grün für die beiden neuen/inhaltlich neuen Fälle, die gegen bereits korrekten
  Produktivcode laufen (Rust-Zeichenprüfung, Bündelvollständigkeit): da ich Produktivcode nicht
  einmal kurzzeitig ändern darf, habe ich den Nachweis über Wegwerfnachbauten im Scratchpad
  geführt (`/tmp/.../scratchpad/bidi_check_repro.rs` und `.../labels_completeness_repro.mjs`):
  eine nachgebaute "alte" Zeichenprüfung (nur `is_control`) übersieht alle fünf Bidi-/Formatzeichen
  (rot), die aktuelle erkennt sie alle (grün); ein nachgebautes Bündel mit einer unbeabsichtigt
  leeren Zeichenkette wird vom Prüfhelfer gefunden (rot), ein korrektes Bündel bleibt sauber
  (grün). Beide Skripte sind reine Wegwerfdateien außerhalb des Projektbaums, nicht eingecheckt.
- Nicht geprüft: `pnpm check` insgesamt (zu teuer für den Umfang dieser Teilaufgabe; die
  betroffenen Einzelprüfungen oben sind gezielt gelaufen). `test:coverage` für
  `packages/domain`/`packages/export` nicht erneut ausgeführt, da diese Teilaufgabe keine Datei in
  diesen Paketen berührt.

Annahmen:
- `motionIntensity: 'subtle'` ist der einzig sinnvolle Ergänzungswert für die zwei betroffenen
  Fälle, weil `startup-appearance.js` selbst genau diesen Vorgabewert schreibt, wenn das
  gespeicherte Objekt kein `motionIntensity`-Feld trägt (beide Testfälle nutzen `appearance` ohne
  dieses Feld). Kein anderer Fall in der Datei war betroffen — alle übrigen prüfen entweder mit
  `not.toHaveProperty('theme')`, `.theme`, `.designTheme` oder erwarten ohnehin `{}` (früher
  Ausstieg vor dem Schreiben von `motionIntensity`).
- Bei der Bündelvollständigkeit gilt eine leere Zeichenkette nur dann als Fehler, wenn sie nicht
  ausdrücklich als Absicht im Quelltext steht. Die einzige gefundene Ausnahme
  (`en.affected.one`/`en.affected.many`) ist im Quelltext selbst begründet (Zeile 532–539:
  die englische Formulierung braucht kein Verb an dieser Stelle, die deutsche "ist"/"sind" schon).
  Ich habe diese Ausnahme im Test dokumentiert statt sie stillschweigend durchzulassen oder zu
  erraten, dass sie ein Fehler wäre.
- Funktionswerte (Satzbausteine wie `poolPlacementBody`) sind vom Vollständigkeitscheck
  ausgenommen — der Typvergleich `en: typeof de` stellt bereits sicher, dass sie existieren, und
  ihr Rückgabewert hängt von Laufzeitargumenten ab, nicht von einer festen Übersetzung.
- Für Punkt 4 des Auftrags: `apps/web/src/lib/language.ts` ist zum Zeitpunkt dieser Arbeit noch
  nicht an den lokalen Dienst angebunden (`currentLanguage` ist ein reiner In-Memory-Zustand,
  Kommentar im Quelltext bestätigt "T-400 connects it to the setting stored in the Bestand"). Ich
  habe deshalb keinen Sprachwechsel-Test geschrieben, der eine Dienstverbindung braucht, sondern
  nur die Bündelvollständigkeit geprüft. Für den Zugriff auf beide Bündel (`de` und `en` sind
  nicht exportiert) nutzt der Test `setLanguage`/`labels()`; da `setLanguage` `document.documentElement.lang`
  schreibt und die Datei unter `environment: 'node'` läuft (kein jsdom im Projekt vorhanden), steht
  im Test ein minimaler `document`-Ersatz nur für diese eine Zuweisung, der in `afterAll` wieder
  entfernt wird — Produktivcode war davon nicht betroffen.

Risiken:
- Keine sicherheitsrelevanten Funde in dieser Teilaufgabe.
- `apps/web/src/lib/format.ts` (Datumsformate, Zahlenformate über `Intl` mit `currentLocale()`) hat
  nach meiner Suche noch **keine** eigene Prüfdatei unter `apps/web/test/lib/`. Das lag außerhalb
  des mir zugewiesenen Umfangs (Punkt 4 nennt "Intl-Formate mit festem Wert" nur als Beispiel für
  das, was ohne Dienstverbindung geht, nicht als eigenen Auftrag) — ich melde es als Lücke für eine
  künftige Welle, statt sie ungefragt selbst zu schließen.

Beobachtung ohne eigenes Zutun: Beim Start dieser Aufgabe waren in `apps/web/test/**` bereits vier
weitere Dateien verändert, die ich nicht angefasst habe (`features/export/templatesScreenBeginCopy.test.ts`,
`lib/poolRule.test.ts`, `lib/touched.test.ts`, `shared/ui/dismissLabel.test.ts`) — vermutlich Rest
aus einer vorherigen Sitzung. Der Gesamtlauf `vitest run apps/web` ist mit ihnen zusammen grün
(247/247); ich habe sie inhaltlich nicht geprüft, da sie nicht in meinem Auftrag standen.

Offene Fragen:
- Keine an den Orchestrator in dieser Teilaufgabe; beide blockierenden Punkte (1 und 2) sind klar
  aus Quelltext und E-139 ableitbar gewesen.

Nächster Schritt: Wenn T-400 `language.ts` an den Dienst anbindet, in einer eigenen Aufgabe den
Sprachwechsel selbst prüfen (inkl. `<html lang>`-Zuweisung mit echtem DOM/E2E statt Stub) sowie bei
Gelegenheit eine erste Prüfdatei für `lib/format.ts` mit festen `Intl`-Werten ergänzen.
