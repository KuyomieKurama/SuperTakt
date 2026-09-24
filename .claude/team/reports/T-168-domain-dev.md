# T-168 — O-DU, O-DR, O-DS, O-DE

**Rolle:** domain-dev **Datum:** 2026-09-05 **Zweig:** `versionspruefung-gegen-github`

---

## Kurzfassung

```
Aufgabe: T-168 — Beschriftung (O-DU), Protokollbegründung (O-DR),
         Anfragetext im Protokoll (O-DS), Aufräumen beim Start (O-DE)
Status: braucht Review
```

Alle vier Punkte gebaut. Zwei Dinge, die vor der Freigabe gelesen gehören: Ich weiche in **einem**
Punkt von der Auflage aus T-165 X-04 ab (`http://` bleibt in der Beschriftung stehen), und ich
mache **den Dateifall länger**, was niemand verlangt hat. Beides steht unten mit Begründung.
Zwei Prüffälle in `packages/domain/test/` sind dadurch rot; ich habe sie **nicht** geheilt.

---

## Artefakte

| Datei | Was |
|---|---|
| `packages/domain/src/attachment.ts` | `attachmentLabel` neu (O-DU); `ParsedUrl` um vier Felder erweitert; Kopfkommentar berichtigt (X-07) |
| `packages/storage/src/ports.ts` | `AttachmentPort.knownImageTargets`, `AttachmentBlobPort.listImages` (O-DE) |
| `packages/storage/src/sqlite/repo-attachments.ts` | `knownImageTargets` über den Teilindex aus 0015 |
| `apps/local-api/src/access/attachment-store.ts` | `listImages`; Begründung der Protokollzeile umgestellt (O-DR) |
| `apps/local-api/src/usecases/image-sweep.ts` | **neu** — der Lauf selbst, ohne Dienst prüfbar |
| `apps/local-api/src/main.ts` | Aufruf im Startpfad, vor dem ersten Zuhören |
| `apps/local-api/src/app.ts` | `routePath(c, -1)` statt `c.req.path` in beiden Zeilen (O-DS) |
| `apps/local-api/src/usecases/attachments.ts` | ein Satz: die Ersatzbeschriftung ist nicht mehr „Wirtsname statt Adresse" |
| `docs/architektur.md` | neuer Abschnitt **5.6a**: was der Start aufräumt und was er nie anfasst |
| `.claude/team/reports/T-168-domain-dev.md` | diese Datei |

Keine Migration, kein Schemawechsel, keine neue Route, keine neue Adresse. Die OpenAPI-Beschreibung
ist unverändert richtig: Ein `label`-Feld gab es nie, und es kommt keines dazu.

---

## Zusammenfassung

`attachmentLabel` liefert ohne Titel jetzt den **ganzen** Wert und lässt nur weg, was an jedem
Anhang derselben Art gleich lautet — beim Verweis das `https://`, sonst nichts; beim Verweis
kommen Pfad, Abfrage, Fragment und der **Port** dazu, bei der Datei der Ordner hinter den
Dateinamen. Damit können zwei verschiedene Anhänge keine gleiche Ersatzbeschriftung mehr tragen,
und der zugängliche Name des Entfernen-Knopfes zeigt wieder auf genau eine Datei. Die Begründung
der Protokollzeile in `attachment-store.ts` steht jetzt auf `pathOf`/`GENERATED_NAME_SHAPE` statt
auf der Herkunft des Namens, und beide Fehlerzeilen in `app.ts` tragen den **gemusterten** Pfad
aus dem Erzeugnis statt des angefragten. Neu ist ein Lauf beim Start, der Bildkopien ohne Anhang
entfernt: still, wenn nichts liegt, mit einer Zahl, wenn etwas fort ist, und mit drei Riegeln
davor, von denen jeder einzelne eine Datei verschont.

---

## 1. O-DU — die Beschriftung

### 1.1 Die Regel, in einer Zeile

> Die Ersatzbeschriftung ist der **gespeicherte Wert**. Weggelassen wird nur, was an jedem Anhang
> derselben Art gleich lautet; das Unterscheidende steht vorn, wo es beim Abschneiden stehen
> bleibt.

Gemessen (aus dem laufenden Code, nicht abgeschrieben):

| Art | Wert | vorher | jetzt |
|---|---|---|---|
| Verweis | `https://beispiel.example/` | `beispiel.example` | `beispiel.example` |
| Verweis | `https://beispiel.example/tickets/4711` | `beispiel.example` | `beispiel.example/tickets/4711` |
| Verweis | `https://beispiel.example/s?call=4711` | `beispiel.example` | `beispiel.example/s?call=4711` |
| Verweis | `https://beispiel.example:8443/tickets/4711` | `beispiel.example` | `beispiel.example:8443/tickets/4711` |
| Verweis | `http://beispiel.example/tickets/4711` | `beispiel.example` | `http://beispiel.example/tickets/4711` |
| Verweis | `kein-gueltiges-ziel` | `kein-gueltiges-ziel` | `kein-gueltiges-ziel` |
| Verweis | `` (leer) | `Verweis` | `Verweis` |
| Datei | `/home/nutzer/bericht.pdf` | `bericht.pdf` | `bericht.pdf (/home/nutzer/)` |
| Datei | `C:\Kunden\Meier\rechnung.pdf` | `rechnung.pdf` | `rechnung.pdf (C:\Kunden\Meier\)` |
| Datei | `C:\rechnung.pdf` | `rechnung.pdf` | `rechnung.pdf (C:\)` |
| Datei | `bericht.pdf` (ohne Trenner) | `bericht.pdf` | `bericht.pdf` |
| Datei | `/home/nutzer/` | `/home/nutzer/` | `/home/nutzer/` |
| Datei | `` (leer) | `Datei` | `Datei` |
| Bild | erzeugter Name | derselbe | derselbe |
| jede | Titel gesetzt | der Titel | der Titel |

### 1.2 Die Zusage und ihre Grenze

Die Zusage lautet: **Für Werte, die durch die Tür gekommen sind, ist die Abbildung umkehrbar.**
Aus der Beschriftung lässt sich der Wert zurückrechnen, also können zwei Werte nicht dieselbe
Beschriftung ergeben. Begründung je Art:

* **Verweis:** Ein Wirt enthält weder `/` noch — außer vor dem Port — `:`. Eine Beschriftung, die
  mit `http://` beginnt, gehört deshalb genau zu einer `http`-Adresse; alles Übrige ist die
  Serialisierung selbst. Der Sonderfall „nur der Wirt" ist die einzige Beschriftung ohne `/` und
  kann mit keiner anderen zusammenfallen.
* **Datei:** Der Name enthält keinen Trenner, der Ordner endet auf einen. Die Zerlegung ist damit
  eindeutig, und beide Teile stehen vollständig da. Der Trenner bleibt am Ordner stehen, weil
  `C:\` die Wurzel ist und `C:` etwas anderes — und weil `a/` und `a\` zwei Ordner sind.
* **Bild:** Der erzeugte Name ist je Kopie einmalig (A-A-17).

**Zwei Fälle schließt die Zusage ausdrücklich nicht ein**, und das gehört gesagt, weil „nie
dieselbe Beschriftung" sonst mehr verspricht, als eine reine Funktion halten kann:

1. **Der Titel.** Nennt der Benutzer zwei Anhänge gleich, heißen sie gleich. Das ist seine Wahl;
   Takt denkt sich nichts daneben aus und ändert seinen Text nicht.
2. **Die Rückfallzweige** für einen leeren oder nicht zerlegbaren Wert. Solche Werte entstehen
   nicht an der Tür, sondern nur, wenn jemand an ihr vorbei in `todo_attachment` schreibt (VG-1,
   VG-3). Dann steht der rohe Wert da — die richtige Antwort, denn sie zeigt, was dasteht.

### 1.3 Was ich bewusst länger mache: **den Dateifall**

T-165 nennt die Wahl bei der Datei ausdrücklich richtig („das letzte Stück ist das
unterscheidende"). Für **eine** Datei stimmt das, für eine **Liste** nicht: Zwei Kundenordner,
in jedem eine `rechnung.pdf`, ergeben zwei Knöpfe „Datei entfernen: „rechnung.pdf"" — derselbe
Befund wie beim Wirt, nur unauffälliger, und in diesem Erzeugnis der wahrscheinlichere von
beiden. Ein Auftrag, dessen Bedingung „zwei verschiedene Anhänge nie dieselbe Beschriftung"
lautet, kann diesen Fall nicht auslassen.

Der Preis ist die Länge, und er wird an der richtigen Stelle gezahlt:

* Der **Name steht vorn.** `truncate` schneidet hinten ab, eine Vorlesehilfe liest vorn zuerst.
  Wer den vollen Pfad in die Beschriftung setzte, verlöre beim Abschneiden genau das
  Unterscheidende — dieselbe Falle, die T-165 der Verweiszeile vorwirft.
* Der Ordner steht **in Klammern dahinter** und ist damit als Ortsangabe lesbar, nicht als Teil
  des Namens.
* Neue Auskunft entsteht dadurch nicht: Der volle Pfad steht ohnehin in der zweiten Zeile der
  Anhangkarte und in der Rückfrage vor dem Öffnen (A-A-6).

### 1.4 Wo ich von der Auflage abweiche: `http://` bleibt stehen

T-165 X-04, Auflage 1: „Das Schema fällt weg, der Rest nicht. `https://` sagt dem Benutzer nichts
… es gibt ohnehin nur `http` und `https`." Ich lasse `https://` weg und `http://` stehen. Zwei
Gründe, beide gemessen:

1. **Sonst ist die Kürzung nicht umkehrbar.** `http://a/b` und `https://a/b` sind zwei
   verschiedene Anhänge und bekämen dieselbe Beschriftung — genau der Fall, den X-04 schließen
   soll, nur eine Ebene tiefer.
2. **Es ist die einzige Stelle vor dem Klick, an der eine Herabstufung zu sehen ist.** Bei einem
   Verweis fragt Takt nicht zurück (A-A-7); die Liste ist die ganze Anzeige. Das
   Bedrohungsmodell führt das als Hinweis **T-156-8** und nennt die Verkürzung dort ausdrücklich
   als das, was „genau das Stück wegnimmt, an dem man eine Herabstufung sähe".

Der Regelfall bleibt kurz: `https` ist das häufige Schema und verschwindet. Sichtbar wird das
Schema nur dort, wo es etwas bedeutet.

### 1.5 X-07 — der Kopfkommentar

Der Satz „Der Aufgabenbereich des Add-ins zeigt Todos" ist ersetzt. Der Ort der Funktion wird
jetzt mit dem Grund begründet, der trägt (es gab zwei Fassungen, und sie antworteten verschieden,
O-CR), und der Kommentar sagt ausdrücklich, dass der Aufgabenbereich **keine** Anhänge zeigt —
A-19.19 und E-072 Punkt 1 schließen sie strukturell aus.

### 1.6 Welche Prüffälle ich breche — und welche nicht

**Ich breche zwei, beide in `packages/domain/test/attachment.test.ts`.** Sie gehören unit-tester;
ich habe sie nicht angefasst:

| Zeile | Fall | erwartet | jetzt |
|---|---|---|---|
| `:527-529` | „Verweis ohne Titel: der Wirtsname aus der Normalform" | `beispiel.example` | `http://beispiel.example/Seite` |
| `:539-541` | „Datei ohne Titel: der Dateiname, nie der volle Pfad" | `bericht.pdf` | `bericht.pdf (/home/nutzer/)` |

Der ganze übrige Baum bleibt grün: **1369 von 1371** Prüffällen bestehen, und die zwei roten sind
genau diese. Insbesondere unberührt:

* `:512-556` die übrigen zehn Fälle derselben Beschreibung (leerer Wert, Titel aus Leerzeichen,
  Pfad ohne Namen, nicht zerlegbarer Verweis) — sie messen die Rückfälle, und die sind unverändert.
* **Die E2E-Fälle.** `attachment-crud.spec.ts:139` und `:109`, `attachment-persistence-live.spec.ts:82`
  messen mit `toContainText`/`allInnerTexts` über die **ganze** Anhangzeile, und der volle Wert
  steht weiterhin in der zweiten. `labels[2]` sucht `e2e-anhang-bericht.txt` — der Dateiname
  steht jetzt sogar zweimal darin.
* Die Musterseite (`showcase/DeadlineSection.tsx`) ruft dieselbe Funktion; sie zeigt danach
  längere Beschriftungen und bleibt richtig.

**Vorschlag für die neuen Fälle** (unit-tester, keine Vorschrift): die zwei umgeschriebenen, dazu
Port, `http`-Sichtbarkeit, Wurzelordner (`C:\`), Pfad ohne Trenner — und ein Fall, der die
**Unterscheidbarkeit** misst statt der Zeichenkette: drei Verweise auf denselben Wirt und zwei
gleichnamige Dateien in zwei Ordnern ergeben fünf **verschiedene** Beschriftungen. Der ist der
eigentliche Inhalt von X-04; die Zeichenkettenfälle sind seine Buchführung.

---

## 2. O-DR — die Begründung der Protokollzeile

Umgestellt (`attachment-store.ts`, im `catch` von `removeImage`). Der Kommentar sagt jetzt:

* Die alte Begründung („nach A-A-17 erzeugt") trägt **nicht** — der Name kommt aus
  `todo_attachment.target`, und dorthin kann an diesem Adapter vorbei geschrieben werden
  (VG-1, VG-3). Er benennt das als das, was es war.
* Tragend ist `pathOf` gegen `GENERATED_NAME_SHAPE`: Die Methode ist mit `unknown_name`
  zurückgekehrt, bevor diese Zeile erreichbar wird. **Die Zeile ist für jeden Namen unerreichbar,
  der nicht aus 32 Hexziffern und einer der vier Endungen besteht** — auch dann, wenn jemand
  einen Kundennamen in die Spalte schreibt.

Der Befund ist damit als Hinweis erledigt; die Bewertung selbst (unbedenklich) war schon
bestätigt.

---

## 3. O-DS — kein Anfragetext mehr in `message`

Beide Einsetzstellen in `apps/local-api/src/app.ts` bilden ihren Ort jetzt aus **einem** Ausdruck:

```
const where = `${c.req.method} ${routePath(c, -1) || '?'}`;
```

**`routePath` aus `hono/route`, nicht `c.req.routePath`.** Der Getter ist in Hono 4.13.4
`@deprecated` und greift ungeprüft in die Trefferliste (`…[this.routeIndex].path`); ohne Treffer
wirft er — in einem Fehlerbehandler der falsche Ort für einen zweiten Wurf. Der Helfer nimmt
`.at()` und liefert eine leere Zeichenkette.

**`-1` und nicht der laufende Eintrag.** Die Kette hängt an `app.use('*', …)`; ein Wurf aus einem
der Wächter ergäbe sonst `*`. Der letzte getroffene Eintrag ist der Routeneintrag selbst.

**Was dadurch nicht mehr im Protokoll steht** — und das ist der Preis, nicht ein Nebeneffekt:

| vorher | jetzt |
|---|---|
| `Unerwarteter Fehler in GET /api/todos/01J8…` | `Unerwarteter Fehler in GET /todos/:id` |
| `Regel der Speicherung in POST /api/pools: unique_violation` | `Regel der Speicherung in POST /pools: unique_violation` |

* **Der konkrete Wert im Pfad ist weg.** Aus dem Protokoll ist nicht mehr abzulesen, **welches**
  Todo, welcher Pool, welche Buchung den Wurf ausgelöst hat. Wer eine Störung nachstellt, hat die
  Route und die Uhrzeit und muss den Datensatz über die Zeit suchen.
* **Der Präfix `/api` fällt weg**, weil der gemusterte Pfad der der Unteranwendung ist.
* **Ein Weg ohne Treffer heißt `?`.** Erreichbar ist das praktisch nicht (ohne Treffer antwortet
  `notFound`, nicht `onError`), aber die Zeile kann keine leere Stelle tragen.

Der Zugewinn: Die Zeile **kann** keinen fremden Wert mehr tragen, statt keinen zu tragen, weil
bisher keiner vorbeikam. Das ist der Unterschied zwischen einer Zusage und einer Beobachtung —
und der Riegel des Protokollierers greift für `message` weiterhin nicht.

---

## 4. O-DE — Aufräumen beim Start

Neu: `apps/local-api/src/usecases/image-sweep.ts`, aufgerufen in `main.ts` **nach** der Migration
und **vor** dem ersten Zuhören. Dazu zwei Portmethoden, beide schmal:

* `AttachmentBlobPort.listImages()` — die Namen im Bildverzeichnis, **nur** solche in der Form
  eines erzeugten Namens und nur Dateien. Kein Verzeichnis oder nicht lesbar: leere Liste.
* `AttachmentPort.knownImageTargets(names)` — welche dieser Namen noch zu einem Anhang gehören.
  In Blöcken über `ix_todo_attachment_image`, den Teilindex aus Migration 0015, der genau für
  diese Frage angelegt wurde.

### 4.1 Die drei Bedingungen, einzeln belegt

**1. Nur, was nachweislich zu keinem Bestand gehört.** Drei Riegel, jeder einzelne verschont eine
Datei: die Form in `listImages` (ein Unterordner, eine fremde Datei, eine halbe Kopie sind für
den Lauf unsichtbar), die **Antwort** des Bestands (bleibt sie aus, wird gar nichts entfernt),
und `pathOf` in `removeImage`, das die Form ein zweites Mal misst.

Dazu die **Reihenfolge**: erst das Verzeichnis lesen, dann den Bestand fragen. Eine Kopie, die
zwischen beiden Schritten entsteht, steht in der Antwort und überlebt. Umgekehrt fiele genau die
frische Kopie dem Aufräumen zum Opfer, deren Zeile eine Sekunde später geschrieben wird. Aus
demselben Grund läuft der Schritt **vollständig, bevor der Dienst zuhört**, und nicht nebenher:
Solange keine Route erreichbar ist, gibt es dieses Rennen nicht.

Gemessen an einem Wegwerfverzeichnis mit vier Einträgen — eine zugeordnete Kopie, eine verwaiste,
eine fremd benannte Datei (`urlaub-2026.png`) und ein Unterordner mit einem gültig aussehenden
Namen: **entfernt wird genau die verwaiste**, die anderen drei liegen danach unverändert da.

**2. Still, wenn nichts liegt.** Kein Verzeichnis, keine Datei, keine Waise: keine Zeile. Zwei
Zeilen gibt es überhaupt, beide kurz:

| Fall | Text | Schlüssel |
|---|---|---|
| etwas entfernt | `N Bildkopie(n) ohne zugehörigen Anhang entfernt.` | `attachment_image_orphans_removed files=N` |
| abgebrochen | `Das Aufräumen liegengebliebener Bildkopien brach ab. Was nicht entfernt wurde, bleibt liegen.` | `attachment_image_sweep_unavailable` |

Beide Schlüssel passen in `REASON_SHAPE` (nachgerechnet, 32 beziehungsweise 34 Zeichen). Kein
Pfad, kein Dateiname, keine Meldung des Betriebssystems (B-2.4). Ein Fehlschlag beim **Entfernen**
behält seine eigene Zeile aus T-159.

**3. Er verzögert den Start nicht spürbar.** Ein `readdir` über 5 000 Dateien: **3,9 ms**
(gemessen auf diesem Läufer). Dazu eine Abfrage je 500 Namen über den Teilindex. Bei einer
frischen Einrichtung ist es ein fehlgeschlagenes `readdir` und sonst nichts.

**Der Startabbruch bleibt unberührt.** Der Lauf liegt hinter der Migration, sein Rückgabewert wird
von niemandem gelesen, und er hat keinen Ausgang, der den Dienst anhielte. Damit das eine Zusage
und keine Beobachtung ist, liegt eine Klammer um den ganzen Lauf: Keiner der drei Schritte **soll**
werfen, aber ein Wurf von hier landete sonst im Auffangnetz des gebündelten Sidecars, das
`error.message` nach `stderr` schreibt — ausgerechnet dort kann ein Pfad stehen (dieselbe Falle
wie in T-132). Verschluckt wird nichts: Der Abbruch bekommt seine Zeile, und die Zahl darunter
sagt, wie weit es gekommen war.

---

## Annahmen

1. **Die Zusage „nie dieselbe Beschriftung" gilt für die Ersatzbeschriftung**, nicht für den
   Titel. Anders ist sie nicht zu halten: Zwei Anhänge mit demselben Titel sind die Entscheidung
   des Benutzers, und eine Funktion, die daran etwas ändert, änderte seinen Text.
2. **`http://` bleibt sichtbar** (1.4). Abweichung von T-165 X-04 Auflage 1, bewusst und
   begründet.
3. **Der Dateifall wird länger** (1.3). Nicht verlangt, aber ohne ihn ist die Bedingung des
   Auftrags nicht erfüllt.
4. **Der Ordner trägt seinen Trenner am Ende** (`C:\Kunden\Meier\`). Ohne ihn wären `a/` und `a\`
   zwei Ordner mit einer Beschriftung, und `C:` läse sich als etwas anderes als `C:\`.
5. **`routePath(c, -1)`**: der zuletzt getroffene Eintrag. Damit steht auch bei einem Wurf aus
   einem Wächter die Route da und nicht `*`.
6. **Der Aufräumlauf gehört in den Vordergrund des Starts**, nicht in den Hintergrund. Er wäre
   nebenher unmerklich schneller und hätte ein Rennen mehr, als seine erste Bedingung verträgt.
7. **Ein unlesbares Bildverzeichnis ist keine Meldung wert.** Der Regelfall ist die frische
   Einrichtung. Wo nichts liegt, ist nichts verwaist; wo etwas liegt und nicht gelesen werden
   kann, wird auch nichts angefasst.

---

## Risiken

1. **Die Beschriftung ist jetzt länger, und die Anzeige schneidet weiter ab.** `.attachment__label`
   trägt `truncate`. Für die Vorlesehilfe ist der Befund behoben (der zugängliche Name wird nicht
   gekürzt), für das Auge nur beim Dateifall (der Name steht vorn) und beim Verweis **nicht**: Zwei
   lange Ticketadressen desselben Wirts sehen visuell weiterhin gleich aus. Das ist eine Frage der
   Darstellung und liegt bei frontend-dev/ui-designer, nicht in der Domäne.
2. **Zwei rote Prüffälle** bis unit-tester nachzieht. Sie sind kein Fehler, sondern das Ergebnis;
   wer sie „repariert", indem er die alte Erwartung wiederherstellt, nimmt X-04 zurück.
3. **Das Protokoll beantwortet die Frage „welcher Datensatz?" nicht mehr** (3.). Bei einer
   Störungssuche ist das ein Verlust, und er ist bewusst.
4. **Der Aufräumlauf löscht.** Er ist der einzige Ort im Erzeugnis, der Kundenmaterial ohne einen
   Klick des Benutzers entfernt. Drei Riegel und die Reihenfolge stehen davor; ein vierter Blick
   von security-checker auf genau diese Stelle wäre mir lieb.
5. **`proof:all` ist unvollständig gelaufen** — fünf Pfade brauchen `127.0.0.1:17843`, und dort
   lauscht der Lauf des e2e-testers. Siehe „Nachweis".

---

## Nachweis

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0 Fehler** (auch `typecheck:test` und `typecheck:e2e`) |
| `pnpm test` | **1369 bestanden, 2 rot** — genau die zwei aus 1.6 |
| `pnpm run boundaries` | grün, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm run proof:codepoints` | **45/0**, nach dem Schreiben dieser Datei erneut |
| `proof:migrations`, `openapi`, `callers`, `export`, `taskpane`, `foreign`, `route-policy`, `release-safety`, `template-fields`, `db-permissions`, `addin` | **grün** |
| `proof:shell-surface` | **rot, nicht von mir.** `checkOpenCallSites` beanstandet sechs fremde Adressen in `apps/desktop/src-tauri/src/attachment.rs` — Prüfdaten im `#[cfg(test)]`-Block. Ich habe keine Rust-Datei angefasst |
| `proof:conflicts`, `tags`, `access`, `export-api`, `addin-wiring` | **nicht gelaufen.** „Auf 127.0.0.1:17843 lauscht bereits etwas" — der Port des e2e-testers; über die Welle viermal versucht, zuletzt unmittelbar vor dieser Meldung |
| `pnpm test:e2e` | **nicht gefahren**, wie beauftragt |

Die fünf ausgefallenen Pfade fahren den Dienst wirklich an, und zwei meiner Änderungen liegen im
Dienst (`app.ts`, `main.ts`). Sie gehören nachgeholt, bevor die Welle geschlossen wird.

---

## Offene Fragen

1. **spec-ux-reviewer: trägt die Abweichung in 1.4?** `http://` bleibt in der Beschriftung stehen,
   entgegen Auflage 1 zu X-04. Wenn nein, fällt mit ihr die Umkehrbarkeit — dann braucht es eine
   andere Antwort auf `http://a/b` gegen `https://a/b`, und ich habe keine, die kürzer wäre.
2. **spec-ux-reviewer: trägt 1.3?** Der Dateifall ist länger geworden, obwohl T-165 die alte Wahl
   richtig nennt. Ich halte die Liste für den maßgeblichen Fall und nicht die einzelne Datei.
3. **unit-tester: die zwei Prüffälle** aus 1.6, dazu die neuen Portmethoden
   (`listImages`, `knownImageTargets`) und der Aufräumlauf, der ohne Dienst und ohne Dateisystem
   prüfbar gebaut ist (drei Funktionen als Eingang). Der Fall, der zählt, ist der über die
   **Unterscheidbarkeit**, nicht der über die Zeichenkette.
4. **Orchestrator: `proof:shell-surface` ist rot**, und zwar an Prüfdaten in einem
   `#[cfg(test)]`-Block. Entweder darf der Wächter den Prüfblock auslassen, oder die Prüfdaten
   dürfen keine Adressen sein. Das ist eine Entscheidung über die benannte Ausnahme aus
   `CLAUDE.md` und keine Zeile Code.
5. **Orchestrator: der feste Port** macht `proof:all` und `test:e2e` in derselben Welle
   unverträglich. Solange beides fest auf 17843 liegt, kann ein paralleler Agent seinen Nachweis
   nicht führen.
6. **security-checker: der Aufräumlauf** (Risiko 4) und die Frage, ob `attachment_image_orphans_removed
   files=N` als Zahl im Protokoll etwas preisgibt. Ich halte N für unbedenklich — wer das
   Protokoll liest, kann das Verzeichnis ohnehin auflisten (VG-3).

---

## Nächster Schritt

1. **unit-tester**, sobald diese Welle geschlossen ist: die zwei Fälle umschreiben, den
   Unterscheidbarkeitsfall dazu, und die drei neuen Bausteine messen.
2. **Orchestrator:** `pnpm run proof:all` einmal nachholen, wenn der Port frei ist.
3. **spec-ux-reviewer:** 1.3 und 1.4 abnehmen oder zurückweisen; beides sind Wortlaut- und keine
   Bauentscheidungen.
4. **frontend-dev/ui-designer** (kein Auftrag, ein Hinweis): Wenn `.attachment__label` künftig
   umbricht statt abzuschneiden, ist Risiko 1 auch fürs Auge zu.
