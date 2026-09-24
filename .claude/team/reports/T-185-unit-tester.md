Aufgabe: T-185 — zwei rote Fälle aus T-181 nachziehen, O-FW/O-EY (zugängliche
Namen ohne Wächter), O-FS (INDIRECT_EXTENSIONS: die Regel, nicht der heutige
Zustand)

Status: fertig — mit einer bewußten Auslassung (O-EY, begründet unten) und
einer Korrektur der Vorlage aus dem Auftrag (O-FS, ebenfalls unten)

Artefakte:
- `apps/web/test/app/undoDone.test.ts` — zwei Zeilen geändert (die geforderten
  `UNDONE_BODY`-Erwartungen), Rest unangetastet
- `apps/web/test/components/dismissLabel.test.ts` — neu, O-FW
- `packages/domain/test/attachment.test.ts` — zwei neue Fälle ergänzt, O-FS
  (TS-Seite)
- `apps/desktop/src-tauri/src/attachment.rs` — zwei neue Fälle in
  `#[cfg(test)]` ergänzt, O-FS (Rust-Seite, benannte Ausnahme)

---

## 1. Die zwei roten Fälle aus T-181 (`undoDone.test.ts:136`, `:155`)

Beide auf den Wortlaut aus dem Auftrag umgestellt:

- Zeile 136: `"Das Abhaken ist zurückgenommen. Tags und Status ändern sich
  dadurch nicht."` → `"Tags und Status ändern sich dadurch nicht."`
- Zeile 155: dieselbe Kürzung, mit angehängtem `${reopenSentence}`.

**Warum die alte Erwartung falsch geworden ist, nicht nur unbequem (E-087):**
`undoDone.ts:41-44` trägt seit T-181 den Kommentar dazu — der Titel der
Meldung sagt bereits „„X" ist wieder offen.", der Rumpf hat das früher
wiederholt (Regel S-13: der Rumpf wiederholt den Titel nicht). Die alte
Erwartung maß also eine Dopplung, die T-181 gezielt entfernt hat; sie war
nicht "nur anders", sondern der belegte Fehler, den T-181 behoben hat.

**Ausdrücklich geprüft, wie im Auftrag verlangt: `:146-151` (die Gegenprobe zur
Anlaß-Zuordnung) ist unangetastet geblieben.** `git diff` zeigt für die ganze
Datei ausschließlich die zwei `expect(toast.body).toBe(...)`-Zeilen als
geändert — `const reopenSentence = …`, `const bookingSentence = …`, die beiden
`expect(reopenSentence)...`-Zeilen und der Kommentar dazwischen stehen
zeichengleich wie vorher. Ich habe die Datei nach der Änderung erneut gelesen
und die betroffenen Zeilen einzeln mit `git diff` abgeglichen, statt mich auf
eine Suchen-und-Ersetzen-Bewegung zu verlassen, die genau diesen Block mitgefaßt
hätte.

**Rot vor Grün nachgewiesen:** `pnpm exec vitest run
apps/web/test/app/undoDone.test.ts` vor der Änderung — 2 von 8 Fällen rot,
mit exakt den im Auftrag genannten Differenzen (`Expected: "Das Abhaken ist
zurückgenommen. …"`, `Received: "Tags und Status …"`). Nach der Änderung: 8/8
grün.

---

## 2. O-FW und O-EY

### O-EY — bewußt NICHT gebaut, mit Begründung

`spec-ux-reviewer` hat das in `T-184-spec-ux-reviewer.md` Abschnitt 3 bereits
abschließend entschieden: **„e2e, nicht Einheit"** — mit zwei konkreten, nur
im echten DOM meßbaren Bedingungen (`getByRole('heading', { name:
'Arbeitsplatz', exact: true })` UND eine Verneinung, daß NIRGENDS auf der
Seite noch „Dieser Arbeitsplatz" als zugänglicher Name auftaucht — Letzteres
ist der Teil, der eine stille Rücknahme tatsächlich fängt, und er braucht eine
seitenweite DOM-Traversierung, keine Aussage über eine einzelne Datei).
`apps/web/test/**` hat keine Rendering-Umgebung (kein jsdom, kein
Testing-Library-Aufbau — von mir nachgemessen: kein `readFileSync`/Render-Setup
in den sieben vorhandenen Dateien, alle reine Funktionen). Der Ort ist laut
Bericht `tests/e2e/settings-workstation-area.spec.ts`, Hoheit e2e-tester
(+frontend-dev für `:558`, documenter fürs Handbuch) — nicht unit-tester. Ich
habe hier nichts gebaut, wie im Auftrag ausdrücklich vorgesehen
("sag es und bau ihn nicht").

**Stand, den ich am Code gemessen habe:** Z-12 IST bereits umgesetzt
(`SettingsScreen.tsx:558` trägt `title="Arbeitsplatz"`, nicht mehr „Dieser
Arbeitsplatz") — der spec-ux-reviewer-Bericht datiert das noch als offen
(Stand 2026-09-05), frontend-dev hat es seither nachgezogen. Der e2e-Fall
bleibt trotzdem offen; ich kann nicht sehen, ob e2e-tester ihn in dieser Welle
bereits angelegt hat.

### O-FW — gebaut, zweigeteilt nach Machbarkeit

`apps/web/test/components/dismissLabel.test.ts`, drei Fälle:

1. **`InlineMessage` (Primitives.tsx) — echter Aufruf, kein Renderer nötig.**
   Die Komponente zieht keinen Haken (`useEffect`/`useState`/… — geprüft über
   die ganze Datei); ein Funktionsaufruf `InlineMessage(props)` liefert
   denselben Elementbaum, den JSX bauen würde, ohne DOM. Der Fall ruft die
   ECHTE Produktivfunktion auf, sucht im zurückgegebenen Baum das
   `IconButton`-Element und prüft `props.label === "Meldung schließen"` —
   das ist der zugängliche Name laut Kommentar an `IconButtonProps.label`
   ("Wird zum zugaenglichen Namen des Knopfes"). Dazu eine Gegenprobe: ohne
   `onDismiss` entsteht gar keine Schaltfläche — sonst prüfte der erste Fall
   nichts, was nicht auch bei einer falschen Verdrahtung träfe.
2. **`ToastItem` (ToastContext.tsx) — schwächerer, ehrlich benannter
   Wächter.** Diese Komponente zieht `useEffect`; ein Aufruf außerhalb eines
   echten Renderers scheitert an „Invalid hook call". Für diese Stelle bleibt
   nur eine Quelltextprüfung (`readFileSync` + Regex gegen die Aufrufstelle)
   — eine Aussage über den Quelltext, keine über das gerenderte Ergebnis. Der
   Dateikopf benennt diesen Unterschied ausdrücklich, damit niemand die beiden
   Fälle für gleichwertig hält.

Eine vollständige, DOM-gestützte Prüfung für beide Stellen wäre — mit
derselben Begründung wie bei O-EY — eine e2e-Reihe; ich habe hier trotzdem
etwas gebaut, weil der erste Fall ohne Rendering-Umgebung ehrlich möglich ist
und die Lücke „kein Fall merkt es" schließt, ohne eine neue Testinfrastruktur
einzuführen.

**Rot vor Grün nachgewiesen:** alle drei Erwartungen einzeln auf einen
Platzhalterwert gesetzt, Lauf gezeigt — 3/3 rot, mit den erwarteten
Fehlermeldungen (`"Meldung schließen"` vs. `"PROOF_OF_RED"` bzw. `toBeDefined`
vs. `toBeUndefined` vertauscht) — dann zurückgesetzt, 3/3 grün.

---

## 3. O-FS — der Wächter gegen eine künftige LANGE Windows-Umleitungsendung

**Ist gebaut**, auf beiden Seiten (TS-Domäne und Rust-Hülle) — mit einer
Korrektur der Prämisse aus dem Auftrag, die ich nicht stillschweigend
übernehmen wollte (E-087: eine unbequeme Feststellung wird gemeldet, nicht
verschwiegen).

**Die Prämisse, die ich nachgemessen und nicht bestätigt gefunden habe:**
Der Auftrag sagt, `a_a_30_laengeninvariante_der_umleitungsliste_…` (Rust,
`attachment.rs:1106`) messe „nur, daß die heutigen [Einträge] kurz sind", und
eine künftige vierzeichige Endung würde „ohne daß etwas rot wird" akzeptiert.
Ich habe das durchgerechnet UND empirisch geprüft (`#[should_panic]`
vorübergehend entfernt, Lauf gezeigt, Attribut zurückgesetzt): Die bestehende
Schleife `for endung in INDIRECT_EXTENSIONS { if endung == "desktop" {
continue }; assert!(endung.len() <= 3, …) }` iteriert über die ECHTE,
aktuelle Liste — ein sechster Eintrag mit vier Zeichen, der NICHT wörtlich
`"desktop"` heißt, träfe dieselbe Schleife und schlüge fehl. Der ursprüngliche
Bericht zu dieser Stelle (T-174, Abschnitt 1.2) sagt das auch ausdrücklich so
("wird rot, sobald jemand einen Windows-Umleiter mit mehr als drei Zeichen
einträgt, ohne an 8.3 zu denken"), und meine Nachrechnung bestätigt das für
den Rust-Fall.

**Was am Befund trotzdem trägt, und was ich gebaut habe:**

1. **Die TS-Domänenseite (`packages/domain/test/attachment.test.ts`) hatte
   VORHER TATSÄCHLICH keinen Prüffall für die Regel** — nur eine
   Listen-Gleichheit gegen fünf feste Namen (`INDIRECT_EXTENSIONS sind genau
   die fünf Umleitungen aus A-A-5`). Diese Gleichheit wird bei JEDER Änderung
   rot, unabhängig davon, ob die 8.3-Regel verletzt ist — ein Entwickler
   zieht beim Hinzufügen einer neuen Endung die erwartete Liste einfach mit
   und muß die 8.3-Frage nie stellen. **Hier war die Lücke real**, und dort
   habe ich zwei neue Fälle ergänzt, die an der REGEL hängen, nicht an der
   heutigen Anzahl der Einträge: „keine Endung außer `desktop` ist länger als
   drei Zeichen" und „genau eine Endung überschreitet drei Zeichen, und es
   ist `desktop`".
2. **Auf der Rust-Seite** habe ich trotzdem zwei Fälle ergänzt, weil die
   bestehende Ausnahme NAMENTLICH an die Zeichenkette `"desktop"` hängt, nicht
   an einer strukturell unabhängigen Zählung — ein Fall bindet dieselbe Regel
   direkt an die echte Liste (`filter(len() > 3).collect() == vec!["desktop"]`,
   zählt statt auszunehmen), der zweite ist eine `#[should_panic]`-Gegenprobe
   gegen eine LOKALE, hypothetische Sechs-Einträge-Fixtur (ein erfundener
   Platzhalter `"conf"`, keine echte Windows-Umleitung) — sie bildet die Regel
   für einen Fall nach, den es heute noch nicht gibt, statt nur den
   bestehenden Bestand zu beschreiben. Das entspricht wörtlich dem Auftrag:
   „Bau den Wächter so, daß er die Regel hält und nicht den heutigen Zustand
   beschreibt."

**Rot vor Grün, Rust:** Das `#[should_panic]`-Attribut vorübergehend entfernt,
Lauf gezeigt — die Fixtur-Prüfung schlägt tatsächlich fehl
(`left: ["desktop", "conf"] right: ["desktop"]`), Attribut zurückgesetzt,
Lauf wieder grün. Kein Produktivcode berührt, auch nicht temporär — nur der
`#[cfg(test)]`-Block.

**Rot vor Grün, TS:** Beide neuen `toEqual`-Erwartungen vorübergehend auf
`['PROOF_OF_RED']` gesetzt, Lauf gezeigt (2/2 rot mit den erwarteten
Differenzen), zurückgesetzt, Lauf wieder grün.

---

## Nachweis — Zahlen vorher/nachher

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm test` | 1435 grün, 2 rot (72 Dateien) | **1442 grün, 0 rot (73 Dateien)** |
| `pnpm typecheck` | 0 Fehler | **0 Fehler** |
| `cargo test --lib` | 60/60 | **62/62** |
| `pnpm run proof:codepoints` | — | **45 bestanden, 0 fehlgeschlagen** |

`pnpm run proof:all` bewußt nicht gefahren (E-083 Punkt 3, fester Port,
parallel laufende Agenten).

1442 = 1435 + 2 (die zwei vorher roten Fälle, jetzt grün) + 3
(`dismissLabel.test.ts`) + 2 (`attachment.test.ts`, O-FS TS-Seite).

---

Zusammenfassung: Die zwei roten `UNDONE_BODY`-Erwartungen aus T-181 sind auf
den neuen, kürzeren Wortlaut umgestellt, die Gegenprobe zur Anlaß-Zuordnung
(`:146-151`) dabei nachweislich unangetastet geblieben. Für O-FW steht ein
echter, hakenfreier Aufruf von `InlineMessage` gegen `IconButton.label` plus
ein schwächerer, offen benannter Quelltext-Wächter für die haken-gebundene
`ToastItem`-Stelle; O-EY bleibt unangetastet, weil spec-ux-reviewer das bereits
verbindlich als e2e-Fall mit einer nur im DOM meßbaren Verneinungsbedingung
entschieden hat. Für O-FS trug die im Auftrag zitierte Prämisse zur
Rust-Seite bei näherer (und empirischer) Prüfung nicht vollständig — die
bestehende Schleife hätte eine künftige lange, nicht „desktop" benannte Endung
bereits gefangen —, wohl aber traf sie exakt auf die TS-Domänenseite zu, die
bislang gar keinen Regel-Fall hatte; beide Seiten tragen jetzt einen an die
Regel gebundenen Wächter statt einer Beschreibung des heutigen Bestands.

Annahmen:
- Die O-FW-Beschriftung "Meldung schließen" gilt an genau den zwei bekannten
  Stellen (`Primitives.tsx`, `ToastContext.tsx`); eine dritte, mir unbekannte
  Aufrufstelle wäre von keinem der beiden Fälle erfaßt.
- Der Quelltext-Wächter für `ToastItem` ist bewußt schwächer als der
  Elementbaum-Fall für `InlineMessage` und wird im Dateikopf ausdrücklich so
  benannt, nicht als gleichwertig verkauft.
- Coverage auf `packages/domain` und `packages/export` habe ich nicht separat
  neu gemessen (nur Tests ergänzt, keine Produktivzeile berührt — kann die
  Schwelle rechnerisch nicht verschlechtern); bei Bedarf hole ich das nach.

Risiken:
- O-EY bleibt bis zur e2e-Umsetzung ohne Wächter — die Karte könnte wieder auf
  „Dieser Arbeitsplatz" zurückfallen, ohne daß `pnpm test` es merkt.
- Der Quelltext-Wächter für `ToastItem` (O-FW, Fall 2) prüft eine Zeichenkette
  im Quelltext, nicht das gerenderte Ergebnis — eine Umformatierung der
  JSX-Zeile (z. B. Zeilenumbruch zwischen `label=` und dem Wert) würde ihn
  fälschlich rot werden lassen, obwohl das Verhalten unverändert wäre.
- Meine Neubewertung von O-FS (Rust-Seite bereits wirksam) widerspricht der
  Prämisse im Auftrag; sollte ich hier etwas übersehen haben (z. B. einen
  Zustand, in dem `INDIRECT_EXTENSIONS` nicht als `[&str; N]`-Literal, sondern
  dynamisch befüllt würde), wäre meine Einschätzung falsch — ich bitte um
  Gegenprüfung, falls das jemand anders sieht.

Offene Fragen:
- Soll O-EY zusätzlich als leichter, im Baum bereits vorbereiteter Hinweis
  (z. B. ein Kommentar in `SettingsScreen.tsx`, der auf die fehlende e2e-Reihe
  verweist) markiert werden, oder reicht der Eintrag in `board.md`?
- Ist die Entscheidung, O-FS auf beiden Seiten (TS und Rust) zu verstärken,
  statt nur die im Auftrag genannte Rust-Datei anzufassen, gedeckt, oder war
  nur die Rust-Seite gemeint?

Nächster Schritt: e2e-tester legt `tests/e2e/settings-workstation-area.spec.ts`
für O-EY an (Design bereits vollständig in `T-184-spec-ux-reviewer.md`
Abschnitt 3); danach kann O-EY im Board geschlossen werden. Für O-FW/O-FS ist
aus meiner Sicht nichts weiter offen, außer der Gegenprüfung meiner O-FS-
Neubewertung durch den Orchestrator oder security-checker.
