Aufgabe: T-068 — Lizenzangabe im Rust-Anteil: `UNLICENSED` gegen MIT (V-2 aus T-067)

Status: fertig

Artefakte:
- `apps/desktop/src-tauri/Cargo.toml` — `license = "UNLICENSED"` → `license = "MIT"`, mit Begründung am Feld
- `apps/desktop/src-tauri/tauri.conf.json` — `"copyright": ""` → `"Copyright (c) 2026 KuyomieKurama"`, wortgleich zu `/LICENSE` Zeile 3, mit Anker gegen Auseinanderdriften
- `.claude/team/reports/T-068-frontend-dev.md` — dieser Bericht

Zusammenfassung:
Die zehnte, widersprechende Lizenzangabe ist weg. `apps/desktop/src-tauri/Cargo.toml` trägt jetzt
`MIT` und stimmt damit mit der `LICENSE` an der Wurzel und allen neun `package.json` überein; die
Kennung ist zugleich gültiges SPDX, was `UNLICENSED` als npm-Konvention nicht war. Am Feld steht,
warum: dass `publish = false` daran nichts ändert und dass Werkzeuge die Angabe unabhängig von
crates.io lesen. Die Nachprüfung des Rust-Anteils auf weitere Lizenz- und Urheberangaben ergab
genau einen Fund, und zwar einen leeren: `bundle.copyright` in `tauri.conf.json` war `""`. Tauri
schreibt dieses Feld in die Steuerdatei der `.deb` und in `LegalCopyright` des NSIS-Installers —
leer heißt, das ausgelieferte Paket nennt keinen Rechteinhaber, während die eigene MIT-Lizenz
verlangt, dass Hinweis und Erlaubnistext jede Kopie begleiten. Ich habe es wortgleich zu `/LICENSE`
gefüllt und die Quelle im Kommentar benannt, damit nicht wieder zwei Aussagen entstehen.
`cargo check`, `pnpm typecheck` und `pnpm build` laufen fehlerfrei; der Bauskript-Durchlauf um
10:16:21 belegt, dass `tauri-build` die geänderte `tauri.conf.json` neu geparst und angenommen hat
(JSON5 gültig, schemakonform).

Annahmen:
1. **Der neue Urheberrechtshinweis in `tauri.conf.json` ist eine Entscheidung, keine Vorgabe.**
   Die Auflage lautete, einen im Rust-Anteil hinzukommenden Hinweis zu benennen — hiermit
   geschehen. Er ist der zweite im Baum nach `LICENSE:3` und mit ihm wortgleich. Wer ihn nicht
   will, streicht die Zeile auf `""` zurück; dann liefern `.deb` und Installer wieder ohne
   Rechteinhaber aus. Der Kommentar über der Zeile benennt `/LICENSE` als Quelle und diese Zeile
   als Kopie, damit die Richtung des Abgleichs feststeht.
2. **`MIT` statt `NONE`/`NOASSERTION`.** SPDX kennt für „bewusst keine Lizenz" eigene Kennungen.
   Ich habe sie nicht gewählt, weil der Auftrag `MIT` verlangt und weil alles andere die
   Widersprüchlichkeit nur in gültiger Syntax fortschreiben würde.
3. **Kein `authors`-Feld ergänzt.** Cargo braucht es nicht, `publish = false` erst recht nicht,
   und jede weitere Namensnennung ist eine weitere Stelle, die driften kann.

Risiken:

**R-1 (offen, betrifft die erste Auslieferung, nicht den Commit) — die Erzeugnisse tragen null
Fremdattribution.** Gemessen, nicht vermutet: `grep -cE '@license|@preserve|Copyright'` über
`apps/web/dist/assets/*.js` und `apps/desktop/src-tauri/taskpane/assets/*.js` ergibt **0 Treffer in
allen vier Bündeln**. Vite/esbuild entfernt die Lizenzbanner beim Bauen. In den Bündeln steckt
React, Ark UI, Zod, Hono — 185 MIT-Pakete, deren Lizenz wörtlich verlangt, dass Hinweis und
Erlaubnistext „in all copies or substantial portions" enthalten sind. Das betrifft uns als
Lizenznehmer beim Weitergeben der `.deb`, der `.AppImage` und des NSIS-Pakets. Der Quelltext ist
nicht betroffen, das Erzeugnis schon.

**R-2 (offen, dieselbe Frist) — Apache-2.0 im Rust-Baum, präziser als im Auftrag beschrieben.**
Ich habe den Rust-Abhängigkeitsbaum ausgezählt statt ihn zu übernehmen
(`cargo metadata` geschnitten mit `cargo tree -e normal,no-proc-macro`, Ziel
`x86_64-unknown-linux-gnu`). **209 Kisten gehen tatsächlich in die Binärdatei** — von 498 im
Gesamtgraph; der Rest ist Bauzeit oder fremde Plattform.

| Lizenz | ausgelieferte Kisten |
|---|---|
| `MIT OR Apache-2.0` / `Apache-2.0 OR MIT` / Schrägstrichvarianten (Wahlrecht → MIT) | 117 |
| `MIT` | 59 |
| `Unicode-3.0` | 15 |
| `Unlicense OR MIT` / `Unlicense/MIT` | 5 |
| `BSD-3-Clause` und Kombinationen mit `AND` | 5 |
| **`Apache-2.0` allein** | **1 — `tao` 0.35.3** |
| **`MPL-2.0` allein** | **1 — `option-ext` 0.2.0** |
| sonstige Wahlrechte (`CC0-1.0 OR MIT-0 OR Apache-2.0`, `MIT OR Apache-2.0 OR Zlib`, …) | 6 |

Drei Berichtigungen zur Auftragsbeschreibung, die die Arbeit vor der Auslieferung ändern:

1. **Die „neun Apache-2.0-Abhängigkeiten" sind die npm-Seite, nicht der Rust-Baum.** Auf der
   Rust-Seite ist es genau eine ausgelieferte Kiste unter reinem Apache-2.0: `tao` 0.35.3, die
   Fensterschicht unter `tauri-runtime-wry`. Die übrigen Tauri-Bestandteile führen `MIT OR
   Apache-2.0` — bei einer Doppellizenz wählen wir MIT, und dann greift Apache-2.0 §4 für sie gar
   nicht.
2. **Apache-2.0 §4 verlangt keine `NOTICE`-Datei aus dem Nichts.** §4(d) greift nur, „If the Work
   includes a NOTICE text file". Nachgesehen im entpackten Registrierungsordner: `tao` liefert
   `LICENSE` und `LICENSE.spdx`, **keine** `NOTICE`. Auch die drei ausgelieferten
   Apache-2.0-npm-Pakete (`@internationalized/date`, `@internationalized/number`,
   `@swc/helpers`) liefern nur `LICENSE`, keine `NOTICE`. Die tatsächliche Pflicht ist §4(a): den
   Empfängern **eine Kopie des Lizenztextes** mitgeben, plus §4(b)/(c) für Änderungen — die wir
   nicht vornehmen. Wer eine `NOTICE` schreibt, ohne dass ein Vorlieferant eine mitgibt, erfindet
   Inhalt; wer stattdessen den Lizenztext beilegt, erfüllt die Auflage.
3. **Ein MPL-2.0-Fund, den die npm-Prüfung nicht sehen konnte.** T-067 hat „keine
   Copyleft-Lizenz" über den pnpm-Speicher festgestellt — das stimmt dort. Im Rust-Baum liegen
   fünf MPL-2.0-Kisten. Vier davon (`cssparser`, `cssparser-macros`, `selectors`, `dtoa-short`)
   hängen ausschließlich unter `dom_query → tauri-utils → tauri-codegen → tauri-macros`, also am
   Prozeduralmakro; mit `-e normal,no-proc-macro` verschwinden sie („nothing to print"). Sie
   laufen zur Bauzeit und werden **nicht** ausgeliefert, also entsteht keine Pflicht.
   **`option-ext` 0.2.0 dagegen hängt über `dirs-sys → dirs → tauri` im Laufzeitpfad und geht
   mit.** MPL-2.0 ist dateiweises Copyleft: §3.3 erlaubt ausdrücklich, das größere Werk unter
   anderen Bedingungen weiterzugeben, aber §3.2 verlangt, den Empfängern mitzuteilen, dass die
   Quelltextform der abgedeckten Dateien unter MPL verfügbar ist. **Kein Hindernis für MIT, aber
   eine Zeile, die in die Beilage gehört.** Ohne diese Auszählung wäre die Aussage „keine
   Copyleft-Lizenz im Projekt" nach der ersten Auslieferung falsch gewesen.

**R-3 (gering) — die Messung ist plattformgebunden.** Gezählt wurde für
`x86_64-unknown-linux-gnu`. Der Windows-Baum weicht in den Systemkisten ab; `tao` und `option-ext`
sind dort ebenfalls enthalten, die Randfälle können sich verschieben. Vor der ersten
Windows-Auslieferung mit `--target x86_64-pc-windows-msvc` nachzählen.

Offene Fragen:
1. **Soll der Urheberrechtshinweis in `tauri.conf.json` bleiben?** Er ist der einzige neben
   `LICENSE:3` und macht die von T-067 festgestellte Eigenschaft „genau ein Treffer im Baum" zu
   „zwei, wortgleich". Ich halte das für richtig, weil ein Paket ohne Rechteinhaber ausgeliefert
   wird, wenn das Feld leer bleibt — aber es ist eine Entscheidung des Auftraggebers, nicht meine.
2. **Wer baut die Lizenzbeilage für die Erzeugnisse?** Sie berührt `scripts/build-app.mjs` und
   `tauri.conf.json` (`resources`/`linux.files`) — beides meine Dateihoheit — braucht aber eine
   Erzeugung der Lizenztexte aus `node_modules/.pnpm` und dem Cargo-Registrierungsordner, und
   dieser Sammelschritt ist Werkzeugbau, keine Oberfläche. Ich kann die Einbindung ins Bündel
   übernehmen, wenn jemand anders den Sammler stellt; ich kann auch beides machen, will es aber
   nicht ungefragt tun.
3. **Wird auch der Sidecar weitergegeben?** `binaries/takt-local-api` bündelt die npm-Seite. Falls
   er je einzeln verteilt wird und nicht nur im Paket, braucht er dieselbe Beilage.

Nächster Schritt:
Eine eigene Aufgabe „Lizenzbeilage für die Erzeugnisse" vor der ersten Auslieferung, nicht vor dem
Commit. Konkret: ein Skript, das aus `node_modules/.pnpm` und dem Cargo-Registrierungsordner eine
`THIRD-PARTY-LICENSES.txt` erzeugt (Name, Version, Lizenzkennung, vollständiger Lizenztext), dazu
eine Kopie von `/LICENSE`; beides über `resources` und die beiden `linux.files`-Einträge in
`tauri.conf.json` in `.deb`, `.AppImage` und NSIS legen — an denselben Ort und aus demselben Grund
wie das Aufgabenbereich-Bündel aus T-054, sonst landet es unter Linux dort, wo niemand nachsieht.
Die drei Sonderfälle, die dabei nicht untergehen dürfen: `tao` (Apache-2.0, Lizenztext beilegen),
`option-ext` (MPL-2.0, Hinweis auf die Quelltextverfügbarkeit) und die 15 Unicode-3.0-Kisten.
Ich kann das übernehmen, sobald die zweite offene Frage entschieden ist.
