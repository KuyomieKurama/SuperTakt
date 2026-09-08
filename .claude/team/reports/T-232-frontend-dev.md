# T-232 — Der Engine-Vergleich wird ein Nachweispfad

```
Aufgabe: T-232 — die Messung aus dem Wegwerfverzeichnis als wiederholbaren Lauf in
         apps/web/scripts/ bauen: Vorrichtung, Lauf, Auswertung; beide Engines gegen
         dieselbe Vorrichtung; Gegenprobe in beide Richtungen; die Grenzen in den Kopf.
Status: fertig
```

| Gegenstand | Ergebnis |
|---|---|
| Neuer Lauf | `pnpm --filter @takt/web proof:engines` — **23 bestanden, 0 fehlgeschlagen**, 18 s |
| Engines | WebKitGTK **2.52.6** (System, `WebKit2 4.1`, unter `xvfb-run`) und Chromium **151.0.7922.34** (Playwright) |
| Bandfolge, beide Engines | `ring x2  gegenband x2  fuellung x10` — zeichengleich, und zeichengleich mit der Messung des Orchestrators |
| Gegenprobe, eingesetzt in die Deklaration | rot in **beiden** Engines |
| Gegenprobe, eingesetzt in `base.css` und `components.css` selbst | rot in **beiden** Engines, Code 1, 9 von 23 Regeln — Dateien danach byte-gleich wiederhergestellt |
| Übersprungen ohne `xvfb-run` | Chromium läuft weiter, 13/0, Code 0, mit benanntem Rest |
| Übersprungen ohne Pillow | „UEBERSPRUNGEN — dieser Lauf hat nichts gemessen", Code 0, **kein** „bestanden" |
| Gehört in `proof:all`? | **Nein.** Begründung in Abschnitt 6 |

---

## 1. Die drei Teile

| Datei | Rolle |
|---|---|
| `apps/web/scripts/engine-parity/fixture.mjs` | **Vorrichtung.** Schneidet Tokens und Deklarationen aus den echten Stilblättern und baut zwei freistehende HTML-Seiten |
| `apps/web/scripts/engine-parity/shoot-webkitgtk.py` | **Lauf, Engine 1.** `python3-gi`, `Gtk.Window`, `WebKit2.WebView`, `get_snapshot(FULL_DOCUMENT)` |
| `apps/web/scripts/engine-parity/measure-bands.py` | **Auswertung.** Waagerechter Schnitt, senkrechter Schnitt, Farbfelder — Zahlen, kein Urteil |
| `apps/web/scripts/proof-engine-parity.mjs` | **Der Lauf.** Chromium über Playwright, Urteil, Gegenproben, Ausgabe |

**Zeichengleich ist keine Zusage, sondern Bauart.** Die Vorrichtung schreibt die Deklarationen
nicht ab, sie **schneidet sie aus** — `:focus-visible` und `.on-solid:focus-visible` aus `base.css`,
`.note`, `.note--billing`, `.note--internal`, `.btn`, `.btn--danger` und der helle `:root` aus
`tokens.css`. Wer die Regel in der Quelle ändert, ändert die Vorrichtung mit; niemand muss daran
denken. Der Ausschnitt hat dafür seine eigene Gegenprobe (Verankerung am Zeilenanfang, damit
`:focus-visible` nicht aus `.skip-link:focus-visible` gefischt wird; Klammer im Kommentar).

**Der Fokus wird nicht über `:focus-visible` ausgelöst.** Die Rümpfe liegen auf gewöhnlichen
Klassen. Gemessen wird die **Malreihenfolge**, nicht die **Auslösung** — das steht so im Kopf beider
Dateien.

## 2. Die Grenzen — sie stehen im Kopf des Laufs, nicht hier

Fünf, wörtlich im Dateikopf von `proof-engine-parity.mjs`, und die Schlusszeile jedes Laufs
wiederholt drei davon:

1. Gemessen wird die **Engine-Familie**, nicht die gebaute Binärdatei. Die Bibliothek ist dieselbe;
   der Wirt ist ein Python-Prozess und nicht Takt. CSP, Webview-Einstellungen und Fenster der Hülle
   bleiben ungemessen.
2. **macOS/WKWebView bleibt ungemessen.** Die Lücke aus T-207 schrumpft von zwei ungemessenen
   Erzeugnissen auf eines. Sie schließt sich nicht.
3. Der Strich**rhythmus** ist engine-abhängig, die Strich**form** nicht. Geprüft wird die Form,
   niemals eine feste Strichzahl, Strichlänge, bemalte Länge oder ein hinterlegtes Bild (P-3).
4. Die **Auslösung** von `:focus-visible` steht nicht zur Debatte.
5. Die Schranke der Form ist eine Hauszahl aus **einem** Messpaar (P-4). Taucht ein zweites auf,
   wird sie in `docs/design/traeger-und-zusage.md` 2.8 neu entschieden, nicht im Lauf.

## 3. E-094 — die zwei Bedingungen

**(a) Nicht grün ohne Messung.** Rot wird der Lauf bei: null Engines; einer Knopfzeile, die nur die
Flächenfarbe trägt; null Bändern; einer Schiene ohne einen einzigen Balken. Zusätzlich prüft er,
dass der gefundene Knopfrand auf der **gerechneten** Koordinate liegt (`x = 96`) und dass in seiner
Zeile genau **ein** Abschnitt steht.

**(b) Gegenprobe in beide Richtungen, durch den ganzen Weg.** Zwei eingesetzte Verletzungen
(Bandtausch, Schienentausch) greifen in die **ausgeschnittenen Deklarationen** — dort, wo T-216 und
T-202 wirklich etwas geändert haben —, werden in **beiden** Engines gerendert und gemessen, und
müssen beide rot machen.

**Beim Bauen ist eine Falle aufgefallen und geschlossen worden.** Wäre die Verletzung bereits *in
der Quelle* begangen, fände der Ersetzer nichts, die Gegenprobe wäre eine Kopie des Sollzustands —
und bestünde genau deshalb. Der Lauf prüft deshalb, dass jede Verletzung wirklich zwei Regeln
trifft. Aufgefallen ist das an einem echten Lauf: beim eingesetzten Tausch in `base.css` blieben die
Gegenproben still, während die Hauptregeln rot wurden.

## 4. Der Nachtrag des Orchestrators — die mehrdeutige Sonde

Der gemeldete Fehler steckte **auch in meiner ersten Fassung**: `--focus-ring-color` und
`--note-billing-rail` sind derselbe Wert (`#2159da`), und beide Schienen standen übereinander, also
in **derselben** Bildspalte. Dazu kommt, dass `--note-internal-rail` (`#7e8a9e`) näher an
`#2159da` liegt als an der Fläche — der Schnitt durch die Leistungsschiene hätte die Vermerkschiene
als zusätzlichen Strich gezählt. Drei Maßnahmen, alle in der Bauart:

1. **Zwei Seiten statt einer.** Knopf und Schienen stehen getrennt; jede gemessene Fläche trägt
   eine im Bild einmalige Farbe.
2. **Die zwei Felder stehen nebeneinander, nicht übereinander.** Jeder senkrechte Schnitt trifft
   nur seine eigene Schiene — und der Lauf prüft das über die Grenzen `oben`/`unten`.
3. **Die Farbfelder werden gezählt.** Für jede gemessene Farbe: an wie vielen Stellen im Bild
   kommt sie vor. Mehr als erwartet ⇒ rot.

**Diese dritte Messung hat sofort einen Fehler in meiner eigenen Erwartung gefunden.** Ich hatte das
Gegenband so breit gerechnet wie den Ring. Gemessen ist es **schmaler** (164 gegen 168 px) — weil die
Umrandung die äußeren 2 px des Schattens überdeckt. Das ist genau die Zusage aus T-216, und sie steht
jetzt als eigene Schranke da: Wäre die Malreihenfolge umgekehrt, wären beide Felder gleich breit.

Ebenfalls gemessen und **nicht** festgenagelt: Die 4 px breite Schiene färbt an ihren zwei Ecken je
einen Punkt der fünften Spalte (Gehrung zwischen 4 px Seitenrand und 1 px Querrand, in **beiden**
Engines, y = 42 und y = 117). Die Breite steht deshalb als Fenster `[4, 5]` und nicht als `= 4`;
tragend ist **ein** Feld, nicht seine Breite.

## 5. P-1 bis P-6 aus `docs/design/traeger-und-zusage.md` 2.8

| Regel | Umsetzung |
|---|---|
| **P-1** | durchgezogen = genau ein Strich, keine Lücke. unterbrochen = mindestens *n* Striche und *n−1* Lücken |
| **P-2** | Jede Zahl ist ein `≥`. Die Gleichheit bei „durchgezogen" ist eine Formaussage, keine Schranke |
| **P-3** | Nicht geprüft: Strichzahl, Strichlängen, bemalte Länge, Schienenlänge, kein Bildvergleich. Alle vier stehen als **Zahlen** in der Ausgabe |
| **P-4** | **Chromium ≥ 4 Striche / ≥ 3 Lücken, WebKitGTK ≥ 3 / ≥ 2.** Der Zuschlag bleibt für Chromium, weil er dort einen Zuschlag auf eine ungemessene Engine ist; WebKitGTK wird hier unmittelbar gemessen und bekommt deshalb die Grundschranke aus P-1 |
| **P-5** | Mitgeschrieben: Engine und Fassung, Datum, Schienenlänge, Strichzahl, Strichlängen, Lückenzahl, bemalte Länge — **und der Abstand zur Schranke** |
| **P-6** | Grenzen 1 und 2 im Kopf und in der Schlusszeile |

**Gemessen (Stand 2026-09-06), keine dieser Zahlen ist eine Schranke:**

| Engine | Schiene | Länge | Striche | Lücken | bemalt |
|---|---|---|---|---|---|
| WebKitGTK 2.52.6 | Leistung | 73 px | 1 {73} | 0 | 73 px |
| WebKitGTK 2.52.6 | Vermerk | 56 px | **3** {7, 12, 12} | 2 {13, 12} | 31 px |
| Chromium 151.0.7922.34 | Leistung | 73 px | 1 {73} | 0 | 73 px |
| Chromium 151.0.7922.34 | Vermerk | 73 px | **7** {7, 8, 8, 8, 8, 8, 2} | 6 {4×6} | 49 px |

**WebKitGTK liegt mit 3 Strichen genau auf der Schranke, nicht darüber — und das steht so in der
Ausgabe.** Es ist keine Nachlässigkeit der Vorrichtung: WebKitGTKs Striche sind lang, und ihre Zahl
wächst mit der Schienenhöhe kaum, weil die Engine die Periode mitzieht. Dieselbe 3 hat der
Orchestrator an einer 41 px hohen Schiene gemessen. Die Vorrichtung höher zu machen, um Luft zu
gewinnen, hieße die Vorrichtung zu messen — und ließe genau den Fall durch, gegen den T-8
geschrieben ist. Auch die **Schienenlänge** ist engine-abhängig (56 gegen 73 px): WebKitGTKs äußere
Striche reichen nicht in die Ecken. Sie ist deshalb ebenfalls keine Schranke.

## 6. Gehört der Lauf in `proof:all`? — Nein, und zwar aus einem Grund

`proof:all` besteht heute aus Läufen, die **überall** dasselbe messen: reines Node gegen den
Bestand, keine Vorbedingung außer dem Bestand selbst. Dieser Lauf braucht vier Dinge, die keiner der
anderen braucht — `xvfb-run`, `python3-gi` mit `WebKit2 4.1`, Pillow und ein eingerichtetes
Playwright-Chromium — und er ist so gebaut, dass er sich bei ihrem Fehlen **überspringt**.

Ein Lauf, der sich überspringen kann, in einer Menge, deren ganzer Wert darin liegt, dass sie es nie
tut, macht die Menge weicher, ohne dass es jemand sieht: `proof:all` bliebe grün und hieße auf zwei
Rechnern zweierlei. Dazu die Laufzeit — 18 s gegen Millisekunden bei allen anderen.

**Vorschlag:** ein eigener Wurzelbefehl neben `test:e2e`, der ebenfalls einen Browser braucht:

```json
"proof:engines": "pnpm --filter @takt/web proof:engines",
```

und, wenn er ins Tor soll, ausdrücklich in `check` hinter `proof:all` — nicht **in** `proof:all`.
Beides gehört dem Orchestrator; `apps/web/package.json` trägt den Befehl bereits.

## 7. Nachweis

| Lauf | Ergebnis |
|---|---|
| `proof:engines`, beide Engines | **23 bestanden, 0 fehlgeschlagen** |
| Gegenprobe, in die Deklaration eingesetzt | rot in beiden Engines |
| Gegenprobe, in `base.css` + `components.css` eingesetzt | **Code 1**, 14 bestanden / 9 fehlgeschlagen; Dateien danach `sha256sum -c` OK |
| `pnpm typecheck` | 0 |
| `pnpm test` | **1464** in 77 Dateien |
| Bau `@takt/web` | grün |
| `pnpm contrast` | **0 von 518**, 11 von 11 Gegenproben |
| `pnpm run proof:surface` | **20 / 0** |
| `pnpm run proof:codepoints` | **45 / 0** |

Nicht gefahren, wie angewiesen: `pnpm run proof:all`, `pnpm test:e2e`.

## 8. Annahmen

- **Die Schranke für WebKitGTK ist die Grundschranke aus P-1 (≥3/≥2), nicht die 4 aus P-4.** P-4 ist
  für einen Lauf geschrieben, der **nur** Chromium fährt und WebKitGTK schätzen muss. Dieser Lauf
  misst WebKitGTK unmittelbar; der Zuschlag bleibt trotzdem für Chromium stehen. Wäre das falsch
  gelesen, ist es eine Zeile — `FORMSCHRANKEN` im Kopf des Laufs.
- **Die Feldhöhe der Vorrichtung ist 80 px** (gemessene Schienenlänge 73 px). Gewählt, um in der
  Größenordnung der 41/43 px zu bleiben, an denen P-4 hergeleitet ist.
- **Die Bilder liegen in einem Temporärverzeichnis** und werden nach dem Lauf gelöscht;
  `--keep=<Ordner>` behält sie. Damit braucht der Lauf keinen Eintrag in `.gitignore` — die Datei
  gehört dem Orchestrator.

## 9. Risiken

- **R-a — die Schranke ohne Luft.** WebKitGTK liegt mit 3 Strichen exakt auf der Schranke. Eine
  Engine-Fassung, die die Periode um wenige Punkte verlängert, macht den Lauf rot, obwohl die
  Schiene weiter unterbrochen aussieht. Das ist der Preis von P-4 und ausdrücklich in der Ausgabe
  benannt, statt still in Kauf genommen. Tritt es ein, ist die Antwort **nicht**, die Schranke zu
  senken, sondern 2.8 neu zu entscheiden.
- **R-b — die eingesetzte Verletzung ist CSS und keine Engine.** Keine Gegenprobe kann eine Engine
  erzeugen, die den Schatten über die Umrandung malt. Der Lauf zeigt, dass die **Messung** eine
  vertauschte Bandfolge sieht — nicht, dass eine dritte Engine sie erzeugen würde. Steht im Kopf.
- **R-c — WKWebView bleibt ungemessen**, und damit ein Drittel der Auslieferung.
- **R-d — `Gtk.main()` ist in GTK 3 abgekündigt.** Läuft heute; bei einem Umstieg auf `WebKit2 6.0`
  (GTK 4) muss der Schießer nachgezogen werden. Er sagt dann „übersprungen", statt falsch zu messen.

## 10. Offene Fragen an den Orchestrator

1. **Wurzelbefehl und Tor** — soll `proof:engines` in die Wurzel-`package.json` und in `check`
   (Abschnitt 6)? Der Befehl im Paket steht.
2. **Ist P-4 für WebKitGTK richtig gelesen?** (Abschnitt 8, erste Annahme.) Das ist der einzige
   Punkt, an dem ich eine Schranke ausgelegt statt abgeschrieben habe.
3. **Gehören die gemessenen Zahlen nach `docs/design/traeger-und-zusage.md` 2.8?** Die Tabelle dort
   trägt die Messung des Orchestrators an 41/43 px; meine steht an 73 px und mit
   Engine-Fassungsnummern. Das Papier gehört ui-designer, nicht mir.
4. **Sollen die Bilder aufbewahrt werden?** Heute nur mit `--keep`. Ein fester Ordner bräuchte einen
   `.gitignore`-Eintrag.

## 11. Nächster Schritt

`proof:engines` als Wurzelbefehl eintragen und entscheiden, ob er ins Tor kommt. Danach die drei
Zahlenzeilen aus Abschnitt 5 an ui-designer für 2.8 — mit dem Satz, dass WebKitGTK auf der Schranke
liegt und warum die Vorrichtung nicht höher gemacht wird.
