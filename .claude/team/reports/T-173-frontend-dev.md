# T-173 — Der Wächter über die Fläche der Hülle mißt das Erzeugnis (E-082)

**Aufgabe:** T-173 (Welle Y, Nachzieher) — `proof:shell-surface` ist rot, und der Befund ist ein
Meßfehler.
**Status:** fertig
**Datei:** `apps/desktop/scripts/proof-shell-surface.mjs` (einzige Änderung dieser Aufgabe)

## Was der Befund war

Der Lauf las `apps/desktop/src-tauri/src/**` als **eine** Zeichenkette und meldete 28 fremde
Adressen in `attachment.rs` — alle aus den `#[cfg(test)]`-Fällen von T-160, also aus genau den
Fällen, die T-154 als V-01 blockierend verlangt hat. Der Produktivteil war und ist sauber.

## Was geändert wurde

**1. Blockgenauer Ausschluß.** Neu ist `stripCfgTestModules(text)` neben den beiden vorhandenen
Werkzeugen `stripRustComments` und `stripRustStrings`. `checkOpenCallSites` legt sie vor die
bisherige Kette:

```js
const withoutComments = stripRustComments(stripCfgTestModules(source.text));
```

Die Grenze wird auf dem **Gerüst** gezogen (Kommentare und Zeichenkettenrümpfe geleert, beide
Schritte längentreu — deshalb sind die Stellen im Gerüst dieselben wie im Urtext):

- Gesucht wird `#[cfg(test)]`; danach dürfen nur Leerraum, weitere Attribute und die Modulzeile
  selbst stehen (`mod name {`, `pub mod name {`, `pub(crate) mod name {`).
- Ab der zugehörigen `{` wird die Tiefe gezählt bis zur Klammer, die sie auf null bringt.
- Der Bereich wird zeichenweise durch Leerzeichen ersetzt, Zeilenumbrüche bleiben — Länge und
  Zeilennummern des Urtextes bleiben erhalten.

**Im Zweifel wird zu viel gemessen, nie zu wenig.** Nicht ausgeschlossen wird: `#[cfg(test)]` vor
einem `use` oder einer einzelnen Funktion, `#[cfg(any(test, …))]`, ein Block ohne schließende
Klammer, `#[cfg(test)] mod tests;` (Modul in eigener Datei) und der Fall, daß die Längentreue der
beiden Werkzeuge nicht mehr gilt. Jeder dieser Fälle bleibt vollständig gemessen.

**2. Der Kommentar sagt, warum.** Über `stripCfgTestModules` steht der Grund in einem Satz:
`#[cfg(test)]` wird nur unter `cargo test` übersetzt und steht in keinem ausgelieferten Erzeugnis;
eine Adresse dort ist eine Prüfeingabe und kein Weg in den Browser des Benutzers. Dazu die Grenze
und der Verweis auf die drei Gegenproben. Ein zweiter, kurzer Hinweis steht an der Aufrufstelle in
`checkOpenCallSites`, ein dritter im Kopfkommentar der Prüfung.

**3. Drei Gegenproben, im vorhandenen Gegenprobenteil** (kein zweiter Lauf, E-082 Punkt 2):

| Gegenprobe | Was eingesetzt wird |
|---|---|
| `E-082: eine fremde Adresse im Produktivteil derselben Datei` | `https://produktiv.example/holen` im Rumpf von `takt_open_attachment_link` |
| `E-082: eine fremde Adresse hinter dem \`#[cfg(test)]\`-Block` | `https://danach.example/holen` hinter der schließenden Klammer von `attachment.rs` |
| `E-082: der Ausschluss endet an der zugehörigen Klammer, nicht an der ersten` | eine Kunstquelle mit `}` in einer Zeichenkette, `}` in einem Kommentar, verschachteltem Block, drei Adressen **im** Block und einer dahinter |

Die ersten beiden filtern auf **ihre** Adresse, gelten also nicht schon dann als bestanden, wenn
irgendein Befund fällt. Die dritte zählt in beide Richtungen: bestanden nur, wenn die Adresse
hinter dem Block gefunden wird **und** keine aus dem Block gemeldet ist.

## Nachweis: die Gegenproben wurden gegen vier Verstümmelungen gemessen

Jeweils die eigene Umsetzung absichtlich beschädigt, gemessen, zurückgesetzt:

| Verstümmelung | Ergebnis |
|---|---|
| A — Ausschluß bis Dateiende | 2 Gegenproben blind → rot |
| B — Ende an der ersten schließenden Klammer | 1 Prüfung rot, 1 Gegenprobe blind |
| C — Klammern in Zeichenketten zählen mit | 1 Gegenprobe blind |
| D — Klammern in Kommentaren zählen mit | 1 Prüfung rot, 1 Gegenprobe blind |

Ohne die dritte Gegenprobe blieben C und D unbemerkt; sie ist deshalb nicht Zierat.

## Läufe

| Lauf | Ergebnis |
|---|---|
| `pnpm run proof:shell-surface` | grün — 6 Prüfungen und 23 Gegenproben bestanden, **0 blind** |
| `pnpm run proof:all` | grün, Exit 0 (18 verkettete Pfade) |
| `pnpm typecheck` | grün, Exit 0 |
| `pnpm run proof:codepoints` | grün — 45 bestanden |
| `pnpm check` | **rot, aber fremd** (siehe unten) |

`pnpm check` läuft durch bis `test:coverage`. Grün darin: `typecheck`, `boundaries`, `contrast`,
`proof:all` (mit `proof:shell-surface`: „6 Prüfungen und 23 Gegenproben bestanden"),
`verify:bundle`. Rot ist die laufende Arbeit von domain-dev in `packages/domain`, wörtlich:

```
 FAIL  packages/domain/test/attachment.test.ts > attachmentLabel — nie eine leere Zeile (A-19.12) > Verweis ohne Titel: der Wirtsname aus der Normalform
AssertionError: expected 'http://beispiel.example/Seite' to be 'beispiel.example'

 FAIL  packages/domain/test/attachment.test.ts > attachmentLabel — nie eine leere Zeile (A-19.12) > Datei ohne Titel: der Dateiname, nie der volle Pfad
AssertionError: expected 'bericht.pdf (/home/nutzer/)' to be 'bericht.pdf'

 Test Files  1 failed | 70 passed (71)
      Tests  2 failed | 1369 passed (1371)
```

`packages/domain/src/attachment.ts` ist unversioniert und wurde während dieses Laufs geschrieben
(19:10) — die Prüfdatei stammt von 12:50. Das ist `attachmentLabel` in der Domäne, nicht die Hülle;
**nicht angefaßt**, gemeldet statt geheilt. `test:rust`, `build` und `audit` sind deshalb in
diesem Lauf nicht mehr gestartet.

## Annahmen

1. **Nur die Modulform wird ausgeschlossen.** `#[cfg(test)]` vor `use`, vor einer Funktion oder
   als `#[cfg(any(test, …))]` bleibt gemessen. Kommt eine solche Form später in den Baum, wird der
   Lauf rot und jemand entscheidet — das ist die sichere Richtung.
2. **`stripCfgTestModules` ist nicht exportiert**, wie die anderen Textwerkzeuge dieser Datei
   auch. Gemessen wird sie über die drei Gegenproben.
3. **Die Prüffälle in `attachment.rs` blieben unberührt** (E-082 Punkt 3), ebenso der
   Produktivteil der Datei.

## Risiken

- **R-neu (klein):** Ein `#[cfg(test)] mod tests;` mit dem Modul in einer eigenen Datei unter
  `src/**` würde vollständig gemessen und den Lauf rot machen. Falscher Alarm, keine Lücke — die
  Behebung wäre eine bewußte Erweiterung, kein Schnellschuß.
- **Die Schranke selbst wurde verkleinert**, wenn auch nur um die Fläche, die nicht ausgeliefert
  wird. E-082 Punkt 4 verlangt den Blick von security-checker; der steht noch aus.

## Offene Fragen

Keine.

## Nächster Schritt

security-checker sieht die Änderung nach (E-082 Punkt 4). Danach ist `pnpm check` allein von der
Domänenarbeit in `packages/domain/src/attachment.ts` abhängig.
