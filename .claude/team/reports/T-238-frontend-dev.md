# T-238 — Ein Übersprung, der rot wird; und die Fehlerklasse hinter T-214

**Aufgabe:** T-238 (Welle AL) — Teil 1: ein Schalter, der jeden Übersprung von `proof:engines` zu
Code 1 macht (E-095 Punkt 3). Teil 2: O-JH — `proof:surface` prüft, daß jedes direkte Kind von
`.app` eine Rasterzuordnung trägt.
**Status:** fertig
**Rolle:** frontend-dev

## Artefakte

| Datei | Was |
|---|---|
| `apps/web/scripts/proof-engine-parity.mjs` | `--kein-uebersprung`, `VORAUSSETZUNGEN` als Quelle der Proben, Grenze 0 im Kopf; dazu die nachgezogene Grenze 5 (P-4/P-7 nach T-236) |
| `apps/web/scripts/proof-surface.mjs` | Regel F mit Sammler, Durchreichertafel, drei Prüfungen über den Bestand und vier Gegenproben |

Kein Produktivcode angefaßt: `git diff --stat -- apps/web/src apps/desktop packages/ui-tokens` ist
leer. Die für die Nachstellung eingesetzte Verletzung in `apps/web/src/styles/app.css` ist
zurückgenommen — die Datei ist gegen HEAD zeichengleich.

---

## Teil 1 — der Schalter

### Was gebaut ist

`--kein-uebersprung` macht **beide** Übersprungwege zu Code 1:

* den **vollständigen** (Abschnitt 2, `UEBERSPRUNGEN`, vorher `process.exit(0)`),
* den **teilweisen** (Abschnitt 7, „Teilweise uebersprungen") — der, den niemand sieht, weil über
  ihm „13 bestanden, 0 fehlgeschlagen" steht.

Der Schalter steht als **Grenze 0** im Kopf des Laufs, vor den fünf inhaltlichen Grenzen, und nicht
in einer Fußnote. Er ändert an der Ausgabe **genau eine Zeile** — die letzte, die das Urteil nennt
und die fehlenden Voraussetzungen mit ihren Debian-Paketen aufzählt. Der Übersprungtext davor bleibt
zeichengleich. Das ist Absicht: Die Prüfstrecke hängt am **Ausgangscode**, nicht am Wortlaut.

`VORAUSSETZUNGEN` ist dabei **die Quelle der Proben** und keine Liste daneben — `hatPil` und
`hatWebKit` lesen aus ihr. Eine Paketliste, die neben den echten Proben herläuft, wäre binnen einer
Welle veraltet, ohne daß es jemand sähe.

### Die Gegenprobe, mit Zahlen

Je eine Voraussetzung künstlich unerreichbar gemacht, beide Male derselbe Text, nur das Urteil
kommt hinzu.

**Teilweiser Übersprung** — `PATH` ohne `xvfb-run` (Ersatzverzeichnis mit nur `python3` und `sh`),
Chromium vorhanden:

| Lauf | gemessene Prüfungen | Engines | Ausgangscode |
|---|---|---|---|
| ohne Schalter | 13 | 1 (Chromium 151.0.7922.34) | **0** |
| mit `--kein-uebersprung` | 13 | 1 | **1** |

`diff` der beiden Ausgaben: **zwei Zeilen**, eine leere und

```
FEHLGESCHLAGEN (--kein-uebersprung): Ein teilweiser Uebersprung ist dort, wo die Umgebung
feststeht, kein Ergebnis (E-095 Punkt 3). Es fehlen: xvfb-run — der Bildschirm, auf dem
WebKitGTK ueberhaupt malt [xvfb].
```

**Vollständiger Übersprung** — dazu `PLAYWRIGHT_BROWSERS_PATH` auf ein Verzeichnis, das es nicht
gibt:

| Lauf | gemessene Prüfungen | Engines | Ausgangscode |
|---|---|---|---|
| ohne Schalter | 0 | 0 | **0** |
| mit `--kein-uebersprung` | 0 | 0 | **1** |

`diff`: dieselben zwei Zeilen, mit beiden fehlenden Voraussetzungen.

**Und die Gegenrichtung:** vollständige Umgebung mit Schalter → **23 bestanden, 0 fehlgeschlagen,
Code 0**, Ausgabe zeichengleich zum Lauf ohne Schalter. Der Schalter macht nichts rot, was nicht
übersprungen wurde.

### Die genaue Befehlszeile für die Prüfstrecke

```
pnpm --filter @takt/web proof:engines --kein-uebersprung
```

Ein Wurzelbefehl mit `--` durchgereicht ginge auch (`pnpm run proof:engines -- --kein-uebersprung`),
ist aber eine Weiterleitung mehr, an der etwas hängenbleiben kann. Die Zeile oben ist gemessen.

### Die vier Voraussetzungen mit ihren Debian-Paketnamen

| # | Voraussetzung | Probe | Debian |
|---|---|---|---|
| 1 | Pillow — die Auswertung der Bilder | `python3 -c "import PIL"` | `python3-pil` |
| 2 | python3-gi mit GTK 3 und WebKit2 4.1 — die Engine des Linux-Erzeugnisses | `python3 -c 'import gi; gi.require_version("Gtk","3.0"); gi.require_version("WebKit2","4.1")'` | `python3-gi`, `gir1.2-gtk-3.0`, `gir1.2-webkit2-4.1` |
| 3 | xvfb-run — der Bildschirm, auf dem WebKitGTK überhaupt malt | `command -v xvfb-run` | `xvfb` |
| 4 | Playwrights Chromium — die Engine des Windows-Erzeugnisses | `pnpm exec playwright install --with-deps chromium` | **kein Debian-Paket** — Playwrights eigener Ablageort |

In einer Zeile:

```
apt-get install -y xvfb python3-pil python3-gi gir1.2-gtk-3.0 gir1.2-webkit2-4.1
pnpm exec playwright install --with-deps chromium
```

Dieselbe Tafel steht im Lauf selbst (`VORAUSSETZUNGEN`) und wird dort gefahren, nicht nur zitiert.

---

## Teil 2 — Regel F, O-JH

### Erst nachgestellt, dann gebaut

Vor der ersten Zeile Wächter: die Verletzung von T-214 in `app.css` wieder eingesetzt
(`.app > .updatebar { grid-area: update }` entfernt). Der **heutige** `proof:surface` blieb dabei
**20 bestanden, 0 fehlgeschlagen, Code 0**. Die Blindheit ist gemessen, nicht behauptet.

### Was die Regel verlangt

Jedes direkte Kind von `.app` trägt **eine** von zwei Zusagen:

1. eine **Rasterzuordnung** (`grid-area`, `grid-row`, `grid-column`, `-start`/`-end`) in einer Regel,
   die entweder bloß auf der Klasse steht (`.app__sidebar`) oder unter `.app` verankert ist
   (`.app > .updatebar`) — `.woanders .updatebar` zählt ausdrücklich **nicht**;
2. eine **Herausnahme aus dem Fluß** (`position: fixed`/`absolute`) — dann ist der Knoten kein
   Rasterelement. Das ist der Weg von `.skip-link` und jeder Abdunklung.

### Der Sammler geht bis zum Knoten, nicht bis zum Baustein

Das war der Punkt: In T-214 stand die Leiste hinter **einer Bedingung und einem Baustein**. Ein
Sammler, der nur unmittelbare HTML-Kinder ansieht, bliebe hier grün. Deshalb löst er auf —
Bedingung in ihre Zweige, Bruchstück in seine Kinder, Baustein in die Wurzeln seiner
`return`-Ausdrücke, über beliebig viele Ebenen. Die Ernte steht in der Ausgabe:

```
Unter .app: 6 direkte Kinder, aufgelöst zu 9 Knoten
(<a>.skip-link, <div>.shellnotes, <div>.scrim, <div>.scrim, <div>.updatebar,
 <div>.scrim, <aside>.app__sidebar, <header>.app__header, <main>.app__main);
9 Klassen mit Rasterzuordnung, 7 außerhalb des Flusses.
```

Die drei `.scrim` sind der Beleg, daß die Auflösung wirklich läuft: einer über
`ShellStatus → UserNameBlockedOverlay → BlockingDialog`, einer über
`ShellStatus → ServiceStoppedOverlay → BlockingDialog`, einer über
`UpdateNotice → UpdateDialog → DialogSurface → Dialog.Root`.

`Dialog.Root` steht in einer **Durchreichertafel** — fremde Bausteine, die kein eigenes DOM-Element
zeichnen. Die Tafel löst sich selbst auf: Ein Eintrag, den der Sammler nie passiert, macht den Lauf
rot (dieselbe Bauart wie die geduldeten Sätze bei Regel D).

### Was der Sammler nicht darf: schweigen

Ein Baustein, den er in `apps/web/src` nicht findet; zwei Erklärungen desselben Namens; ein
Ausdruck, dessen Bauart er nicht kennt; JSX links von einem `||`; roher Text; ein Kreis — jedes
davon ist ein **Befund**, kein stilles Weiter. Und vor jeder Zusage steht die Ernte: **null** Hüllen,
**null** Kinder, **null** aufgelöste Knoten oder **null** Rasterzuordnungen in den Stilblättern sind
rot, nie `ok` (E-094 Punkt 3).

### Welchen Weg die Selbstprobe ausläßt und wer ihn geht (E-094 Punkt 2)

Steht im Kopf des Laufs, in drei benannten Sätzen:

1. **Den gerenderten.** Der Lauf liest Quelltext. Ob der Browser den Knoten wirklich in die genannte
   Fläche setzt, mißt er nicht. Diesen Weg geht **`visual-qa` am laufenden Fenster** — der hat T-214
   gefunden. Der Lauf ersetzt ihn nicht; er macht ihn für die **Klasse** entbehrlich.
2. **Den zur Laufzeit gebauten Klassennamen.** `cx("shellnotes", className)` wird mit den
   Zeichenketten gelesen, die dastehen. Ein Name aus einer Bindung bleibt ungelesen — er wäre
   allerdings auch für jeden Leser unsichtbar.
3. **Die Kaskade.** Gefragt wird, ob **irgendeine** greifende Regel eine Zuordnung erklärt; keine
   Spezifität, kein späteres `grid-area: auto`. Wer die Kaskade nachbaut, baut einen zweiten Browser.

### Jede neue Prüfung einmal rot gesehen — mit Zahl

Zuerst der echte Fall: mit der wiedereingesetzten Verletzung in `app.css` meldet der neue Lauf
**26 bestanden, 1 fehlgeschlagen, Code 1**, und der Befund nennt den ganzen Weg:

```
app/App.tsx:288 Kind 3 → <UpdateNotice> → <div> — trägt weder eine Rasterzuordnung noch
eine Herausnahme aus dem Fluß (Klassen: updatebar).
```

Danach acht eingesetzte Verletzungen **im Wächter selbst**, jede einzeln gefahren und wieder
zurückgenommen. Alle acht gingen mit **Code 1** hinaus:

| # | eingesetzte Verletzung | rot geworden |
|---|---|---|
| 1 | Bausteine werden stumm übersprungen | Durchreicher-Prüfung; „findet das Kind …"; „schweigt nicht …" |
| 2 | ein unauffindbarer Baustein schweigt | „schweigt nicht über das, was sie nicht lesen kann" |
| 3 | eine Zuordnung unter fremdem Vorfahren zählt mit | „findet das Kind ohne Rasterzuordnung" |
| 4 | die Herausnahme aus dem Fluß wird nicht anerkannt | „kein selbstplatziertes Kind"; „meldet die richtige Bauart nicht" |
| 5 | der Sammler sucht eine Hülle, die es nicht gibt | **alle fünf** Regel-F-Prüfungen |
| 6 | ein Durchreicher steht in der Tafel und wird nie passiert | „jeder Durchreicher wird wirklich passiert" |
| 7 | die Durchreichertafel ist leer | „kein selbstplatziertes Kind"; „meldet die richtige Bauart nicht" |
| 8 | die Stilblattsonde erntet auch ohne Stilblatt | „ist rot, wenn der Sammler nichts erntet" |

Damit ist **jede** der fünf neuen Prüfungen mindestens einmal rot gesehen. Der Wiederherstellung
nachgewiesen: die Treiberdatei vergleicht nach dem letzten Lauf zeichengleich gegen die Urfassung
(`True`), und `git status` zeigt unter meiner Hoheit nur die zwei Wächterdateien.

---

## Nachtrag P-4 / P-7 (T-236) — Kontrolle und Wortlaut

**Der Lauf trägt keine Zahl aus der zurückgenommenen Faustformel.** Geprüft:

* `FORMSCHRANKEN` = WebKitGTK `{3, 2}`, Chromium `{4, 3}`. Das Chromium-`4` ist **kein**
  Formelwert — ⌈73÷12⌉ wäre 7. Es ist der Aufschlag aus P-4 auf eine ungemessene Engine, mit heute
  **3 Strichen Luft** zur Messung. Kein Änderungsbedarf im Code.
* Keine Höhenschranke, kein Verhältnis Balken/Lücke, keine Periode im Lauf. P-3 gilt unverändert:
  gemessen wird die **Form**.

Nachgezogen habe ich drei **Kommentarstellen**. Der neue Wortlaut von **Grenze 5** im Dateikopf:

> **5. Die Chromium-Schranke ist ein Aufschlag auf eine ungemessene Engine, keine Aussage über
> WebKitGTK.** Sie kommt aus P-4 in der Fassung nach T-236: Fährt der Lauf **nur** Chromium, gilt
> dort `>= 4 / >= 3`, weil eine 4 in Chromium eine zu **kurze** Schiene abfängt — mehr ist ein
> reiner Chromium-Lauf nicht imstande zu sehen. Mißt er WebKitGTK unmittelbar, gilt dort die
> Grundschranke aus P-1 (`>= 3 / >= 2`), und der Zuschlag behält seinen Adressaten trotzdem.
>
> **Die alte Begründung — das Verhältnis „3 zu 4" — ist widerlegt**, und zwar von diesem Lauf
> selbst: Er mißt an derselben Fläche **3 gegen 7** (WebKitGTK 3 Striche auf 56 px, Chromium 7 auf
> 73 px, siehe Abschnitt 5 der Ausgabe). Mit ihr ist die Faustformel für die Strichzahl
> zurückgenommen; an ihre Stelle tritt ein **gemessenes Band** von 41 px bis rund 217 px bei 4 px
> Rahmen. Außerhalb dieses Bandes heißt das Ergebnis **„ungemessen", nicht „durchgefallen"** —
> dieselbe Unterscheidung, die Grenze 2 hier für WKWebView schon führt.
>
> Daß WebKitGTK **genau auf** seiner Schranke liegt und keine Luft hat, ist kein Mangel der
> Vorrichtung, sondern P-7: Länge kauft dort keine Striche. Wird der Lauf eines Tages deshalb rot,
> ist die Antwort weder eine höhere Vorrichtung noch eine niedrigere Schranke, sondern ein zweites
> Merkmal an der Fläche — entschieden in `docs/design/traeger-und-zusage.md` 2.8 (P-1 bis P-7) und
> nicht hier.

Dazu zwei kleinere Stellen: die Begründung über `FORMSCHRANKEN` (dort stand „3 gegen 4"; jetzt
„3 gegen 7", mit dem Vermerk, daß die Schranke bleibt und nur ihre Begründung eine andere ist) und
der Kommentar über der Ausgabe „Abstand zur Schranke" (WebKitGTKs 3 an 41 px und an 56 px bestätigt;
der Gegensatz zu Chromium, wo die Zahl mit der Länge wächst, ausdrücklich benannt; Verweis auf P-7).

---

## Nachweis

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | — | **Code 0** |
| `pnpm test` | — | **77 Dateien, 1464 Tests grün** |
| `pnpm run boundaries` | — | **Code 0** |
| `pnpm --filter @takt/web build` | — | **Code 0**, `✓ built in 2.38s` |
| `proof:surface` | **20 / 0** | **27 / 0** (5 neue Prüfungen, davon 4 Gegenproben; 16 Gegenproben gesamt) |
| `proof:engines` | **23 / 0** | **23 / 0** (unverändert; mit `--kein-uebersprung` ebenfalls 23 / 0, Code 0) |

`proof:all` und `test:e2e` nicht gefahren (E-083 Punkt 3, Auftrag). Nichts Portgebundenes gefahren —
weder `proof:surface` noch `proof:engines` binden einen Port; der Bau ist `vite build` ohne Server.

## Annahmen

1. **Der Name des Schalters** ist `--kein-uebersprung`. Frei gewählt, wie erlaubt.
2. **Der Schalter fügt eine Zeile hinzu, statt gar nichts zu ändern.** „Beide Male derselbe Text"
   habe ich als Anforderung an den **Übersprungtext** gelesen, nicht an die Urteilszeile: Ein
   CI-Protokoll, das mit Code 1 endet und nirgends sagt, warum, ist kein Fortschritt. Der `diff`
   beider Läufe ist genau diese eine Zeile — das ist zugleich der Beleg, daß der Ausgangscode am
   Schalter hängt und nicht an einer zweiten, stilleren Änderung.
3. **`VORAUSSETZUNGEN` fährt die Proben**, statt neben ihnen zu stehen. Sonst wäre die Paketliste
   ein Kommentar, der veraltet, ohne rot zu werden.
4. **Regel F zählt `position: absolute` genauso wie `fixed`** als Herausnahme aus dem Fluß. Beides
   nimmt den Knoten aus dem Rasterfluß; im Bestand kommt nur `fixed` vor.
5. **Die Überschrift der Gegenproben heißt jetzt `G` statt `F`.** Vor der Umbenennung über Wortlaut
   gesucht (`git grep` **und** roher Lauf über `apps/*/src`, `packages/*/src`, `tests/`): **kein**
   Treffer außerhalb der Datei selbst.
6. **`ts.isJsxExpressionContainer` gibt es in dieser TypeScript-Fassung nicht** — der Knoten heißt
   `JsxExpression`. Ich prüfe die Art von Hand und habe den Grund danebengeschrieben. Beim ersten
   Lauf hat genau das geworfen; es ist gemessen, nicht vermutet.

## Risiken

1. **Regel F liest den Quelltext, nicht den Bildschirm.** Die drei ausgelassenen Wege stehen im Kopf
   des Laufs und oben in diesem Bericht. Der erste — der gerenderte — gehört weiter `visual-qa`.
2. **Die Fläche fehlt weiter auf der Musterseite.** `designsystem.html` zeigt Bausteine, nie die
   Hülle. Das war der Grund, warum die Klasse zwei Wellen unentdeckt blieb; Regel F fängt die Klasse
   jetzt, macht die Musterseite aber nicht vollständiger. Ob die Hülle dort hingehört, ist eine
   Frage an ui-designer, keine an mich.
3. **Ein zweiter `.app`-Wirt macht den Lauf rot**, auch wenn er berechtigt wäre (etwa eine zweite
   Einstiegsseite). Bewußt so: Der Sammler soll nicht raten, welche Hülle gemeint ist.
4. **Der Durchreicher `Dialog.Root` ist eine Kenntnis über eine fremde Bibliothek.** Ändert Ark UI
   seine Wurzel zu einem echten Element, wird die Tafel falsch — und zwar zu **milde**. Der Lauf
   merkt es nicht; ein Wechsel der Ark-Fassung gehört mit einem Blick auf diese Tafel begleitet.
5. **Sicherheit:** keine. Beide Läufe lesen, schreiben nur nach `/tmp` (nur `proof:engines`, und nur
   mit `--keep=`) und binden keinen Port. Keine neue Abhängigkeit.
6. **Aufräumen:** Die Nachstellhilfen liegen unter `/tmp/takt-t238-*`. Ich durfte sie nicht löschen
   (`rm` wurde von der Rechtevergabe abgelehnt); sie liegen außerhalb des Bestandes und außerhalb
   meiner Hoheit und verschwinden mit dem Rechner.

## Offene Fragen

1. **`--kein-uebersprung` auch für andere überspringbare Läufe?** Heute ist `proof:engines` der
   einzige. Wird ein zweiter gebaut, wäre ein gleichlautender Schalter mehr wert als ein zweiter
   Name — das ist eine Entscheidung, keine Zeile.
2. **Gehört die Hülle auf die Musterseite?** Siehe Risiko 2. Fragt sich an ui-designer, entschieden
   vom Orchestrator.
3. **Soll Regel F über `apps/web` hinausgehen?** Das Add-in hat mit `.taskpane` dieselbe Bauart und
   seinen eigenen Lauf. Ich habe nicht hinübergegriffen — fremde Hoheit.

## Nächster Schritt

1. Orchestrator trägt in die Prüfstrecke ein:
   `pnpm --filter @takt/web proof:engines --kein-uebersprung`, davor die vier Voraussetzungen aus
   der Tabelle oben.
2. `proof:surface` bleibt in `proof:all` — Regel F braucht keine Voraussetzung, sie liest nur.
3. `visual-qa` muß für O-JH **nichts** nachholen: Regel F ist eine Messung am Quelltext, und die
   gerenderte Seite hat T-214 schon gesehen. Ein Bild ist erst wieder fällig, wenn sich an `.app`
   selbst etwas ändert.
