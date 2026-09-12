# T-314 — Der Lauf, der löscht: A-A-98 gebaut, A-A-100 entschieden

**Aufgabe:** T-314 — A-A-98 (Eigentümer an der Datei statt an der Herkunft, Widerspruchsriegel von
der anderen Seite) mit den drei Gegenproben aus Bedrohungsmodell 40.1 gemessen; A-A-100 im selben
Auftrag (`total_too_large` unerreichbar); `sweepOrphanedImages` auf dieselbe Bauart **prüfen und
melden**, nicht ändern.

**Status:** fertig — braucht Review (security-checker, code-reviewer, unit-tester).

---

## Artefakte

**Geändert:**

- `C:\Users\kyk\Documents\Repo\SuperTakt\packages\domain\src\attachment.ts` — neu:
  `attachmentTargetNamesFile`, `attachmentTargetFileName`, `asciiLower` (privat). Die Regel, die
  über eine Löschung entscheidet, liegt jetzt **einmal** und in der Domäne.
- `C:\Users\kyk\Documents\Repo\SuperTakt\packages\storage\src\ports.ts` —
  `knownEmailFileTargets` → `attachmentsNamingFiles`; neu `attachmentNamesUnder`;
  `emailFileCount` bleibt mit **neu begründeter** Rolle; `AttachmentBlobPort.emailFileFolder`.
- `C:\Users\kyk\Documents\Repo\SuperTakt\packages\storage\src\sqlite\repo-attachments.ts` —
  Umsetzung, `escapeLike`/`LIKE_ESCAPE`/`NAME_LIKE_CHUNK`. **Der falsche Kommentar ist fort**, und
  an seiner Stelle steht die Richtung ausgeschrieben.
- `C:\Users\kyk\Documents\Repo\SuperTakt\packages\storage\migrations\0023_attachment_origin.down.sql`
  — der Satz „das Aufräumen verliert seine Bedingung, bevor es die Dateien verliert" berichtigt,
  mit der Messung und dem Datum daneben. Nur Kommentar; der Rückweg ist unverändert, und
  `schema_migration.checksum` hängt ohnehin nur an der **Hin**richtung.
- `C:\Users\kyk\Documents\Repo\SuperTakt\packages\storage\src\sqlite\migrations.embedded.ts` —
  neu erzeugt (`migrations:embed`), `migrations:embed:check` grün.
- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\src\features\todos\email-file-sweep.ts` —
  neu geschrieben.
- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\src\access\attachment-store.ts` —
  `emailFileFolder()`.
- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\src\main.ts` — Verdrahtung.
- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\src\config.ts` — A-A-100:
  `ADDIN_ATTACHMENT_BODY_HEADROOM_BYTES` neu, `ADDIN_ATTACHMENT_MAX_BODY_BYTES` **gerechnet**.
- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\scripts\proof-route-policy.mjs` —
  Abschnitt 8, der Festpunkt aus A-A-100.
- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\openapi\takt-local-api.yaml` — die
  Rumpfgrenze dieser einen Route (64 MB → 72 MiB) samt Begründung.
- `C:\Users\kyk\Documents\Repo\SuperTakt\docs\architektur.md`,
  `C:\Users\kyk\Documents\Repo\SuperTakt\docs\datenmodell.md`.

**Nicht angefaßt:** `docs/bedrohungsmodell.md`, `docs/spec.md`, `tests/**`, `apps/*/test/**`,
`packages/export/**`, `apps/web/**`, `apps/desktop/**`, `apps/outlook-addin/**`,
`apps/local-api/src/routes/addin/**`, `package.json`, jede `tsconfig*.json`.

**Meßskript:** `apps/local-api/scripts/t314-sweep.mjs`, angelegt und **im selben Befehl wieder
entfernt** (nur dort lösen `@takt/*` auf). `git status` danach: kein `t314`-Rest, geprüft.

---

## Zusammenfassung

Die drei gemessenen Löschwege sind zu, und sie sind an **einer** Stelle zu: Die Frage nach dem
Eigentümer einer liegenden Datei ist jetzt die weiteste, die einen finden kann. Der
Widerspruchsriegel hängt nicht mehr an `known.size === 0` und stellt zwei Gegenfragen auf zwei
verschiedenen Achsen — am Anfang des Pfades und ganz ohne Pfad. Alle drei Gegenproben aus 40.1 sind
gefahren und grün, die Gegenprobe nach oben (eine echte Waise fällt) ebenfalls; der Riegel feuert
nachweislich auch bei **nicht leerer** Eigentümermenge. A-A-100 ist entschieden: Die Rumpfgrenze
wandert (64 → 72 MiB, aus der Fachgrenze gerechnet), die Summengrenze bleibt; `total_too_large`
wird damit **erreichbar** und nicht abgeschafft. `sweepOrphanedImages` ist gemessen und **nicht**
geändert: zwei der drei Wege tragen dort, einer nicht, und es gibt einen vierten, der über die
gewöhnliche Tür erreichbar ist.

---

## 1 — A-A-98: was gebaut ist

### 1.1 Die Eigentümerfrage (die löschende Richtung)

`attachmentTargetNamesFile(target, fileName)` in `@takt/domain`. Rein, ohne Dateisystem, ohne SQL,
ohne laufenden Dienst prüfbar. **Ohne `origin`, ohne `kind`, ohne Rücksicht auf die Schreibweise
des Pfades davor** — verglichen wird der Name, ASCII-gefaltet, und ein Pfad, der auf den Namen
**endet**, nennt ihn ebenfalls.

Im Quelltext steht die Richtung jetzt ausdrücklich da, dreimal (Domäne, Port, Aufräumlauf), und in
der Form, in der sie im Auftrag steht:

> Ein falsches `true` läßt eine Datei liegen, die niemandem mehr gehört — ein Schönheitsfehler in
> einem Ordner. Ein falsches `false` entfernt eine Rechnung aus der E-Mail eines Kunden, ohne
> Rückfrage, ohne Papierkorb und ohne Spur außer einer Zahl im Protokoll.

**Der berichtigte Kommentar.** Der alte an `knownEmailFileTargets` sagte, ohne `origin` würde „eine
fremde gelöscht". Er ist mit der Methode fort; an seiner Stelle steht, daß **ohne** `origin` die
Eigentümermenge **größer** ist und deshalb **weniger** gelöscht wird — und daß die Bedingung, die
dort Sicherheit schaffen sollte, die löschende war. Derselbe Satz steht im Port und im Kopf des
Aufräumlaufs, weil er dort gelesen wird, wo jemand die Bedingung wieder enger machen will.

**ASCII-Faltung und nicht `toLowerCase()`.** `toLowerCase()` faltet nach Unicode und ist nicht
längentreu (`İ` → zwei Zeichen). SQLite faltet in `LIKE` ASCII. Zwei verschiedene Faltungen wären
zwei Antworten auf dieselbe Frage — genau die Bauart von T-313-1. Jetzt ist es eine.

**Die Vorauswahl im Adapter ist absichtlich weiter als die Entscheidung.** SQL filtert mit
`LIKE '%name%'` (enthält), entschieden wird mit der Domänenregel (endet auf / letzter
Pfadbestandteil). Eine Vorauswahl, die **enger** wäre als die Entscheidung, hielte Zeilen zurück,
die der Entscheider als Eigentümer erkannt hätte — und jede zurückgehaltene Zeile ist eine gelöschte
Datei. Der Satz steht als Warnung über der Anweisung.

### 1.2 Der Riegel, von der anderen Seite

Er hängt **nicht mehr** an `known.size === 0` und wird gestellt, sobald überhaupt etwas fallen
würde. Zwei Gegenfragen auf zwei Achsen, und keine ist der Riegel allein:

| Frage | Achse | trägt den Fall |
|---|---|---|
| `attachmentsNamingFiles(namen)` | **Ende** des Pfades, ohne `origin`/`kind` | die Entscheidung selbst |
| `attachmentNamesUnder(ordner)` | **Anfang** des Pfades, ohne `origin`/`kind` | der Bestand nennt eine Datei in diesem Ordner, die dort nicht liegt |
| `emailFileCount()` | **gar nicht** am Pfad (`origin='email' AND kind='file'`) | `target` hat die Gestalt gewechselt — weder Name noch Ordner findet etwas wieder |

Verweigert wird, sobald eine Datei ohne Eigentümer daliegt **und** (a) der Bestand einen Namen in
diesem Ordner erwartet, der dort nicht liegt, **oder** (b) er übernommene Dateien führt, aber weder
am Namen noch am Ordner eine einzige wiederfindet.

**Warum `emailFileCount` mit seiner engen Bedingung bleibt:** Ihre Enge ist hier die Eigenschaft,
nicht der Fehler. Sie ist die einzige der drei, die gar nicht am `target` hängt. Der Fehler aus
T-313-2 war nicht ihre Enge, sondern daß die **Abfrage** dieselbe Enge hatte.

---

## 2 — Die Messung (alle Zahlen gefahren, Windows 11, Node 22.23.2)

Echter `createAttachmentBlobPort` auf frischem Anwendungsdatenverzeichnis, echte SQLite mit
`migrateToLatest`, echte Dateien über `storeEmailFile`, echte Zeilen in `todo_attachment`, echter
Lauf mit der Verdrahtung aus `main.ts`.

| Fall | heute | T-313 |
|---|---|---|
| **(1)** zwei Dateien, eine Zeile zeichengleich, eine mit `c:` + Schrägstrichen | `{read:2, owned:2, removed:0}` — **beide da** | `{read:2, owned:1, removed:1}` |
| **(2)** zwei Dateien, beide Zeilen `origin='user'`, `kind='file'` | `{read:2, owned:2, removed:0}` — **beide da** | `{read:2, owned:0, removed:2}` |
| **(3)** Migration 0023 zurück (auf 22) und wieder vor; danach `origin` **aller** Zeilen `user` | `{read:2, owned:2, removed:0}` — **beide da** | `{read:2, owned:0, removed:2}` |
| **Gegenprobe nach oben:** 3 Dateien, 2 Zeilen | `{read:3, owned:2, removed:1}` — **die Waise fällt** | gleich |
| fremder Name `rechnung.pdf` im Ordner | unsichtbar, überlebt | gleich |
| vierte Anhangsart | `refused:'unknown_kinds'`, `removed:0` | gleich |
| werfendes `emailFileCount` | `refused:'unavailable'`, `removed:0`, Waise liegt noch | gleich |
| **neu:** `target` trägt `email:<id>` statt eines Pfades | `{read:2, owned:0, removed:0, refused:'contradiction'}` | — |
| **neu:** Zeile nennt eine Datei im Ordner, die fehlt, **dazu** eine Waise | `{read:2, owned:1, removed:0, refused:'contradiction'}` | — |
| **neu:** dieselbe fehlende Zeile **ohne** Waise | `{read:1, owned:1, removed:0, refused:null}` — still | — |

**Der vorletzte Fall ist der Nachweis für die Auflage selbst:** `owned: 1`, nicht `0` — der Riegel
feuert bei **nicht leerer** Eigentümermenge. Genau das konnte die alte Fassung nicht.

Der letzte Fall ist die Gegenprobe dazu: Eine unvollständige Zuordnung allein verweigert nicht. Nur
zusammen mit einer Datei, die fallen würde, wird sie zum Widerspruch.

**20 Zusicherungen, 0 rot.**

---

## 3 — A-A-100: entschieden, und zwar für die Erreichbarkeit

**Die Grenze wird erreichbar gemacht, nicht abgeschafft.** `MAX_EMAIL_ATTACHMENT_TOTAL_BYTES`
bleibt bei 48 MiB und bleibt fachlich wirksam. Bewegt wird die Rumpfgrenze:

```
ADDIN_ATTACHMENT_MAX_BODY_BYTES
  = Math.ceil(MAX_EMAIL_ATTACHMENT_TOTAL_BYTES / 3) * 4 + ADDIN_ATTACHMENT_BODY_HEADROOM_BYTES
  = 64 MiB + 8 MiB = 72 MiB
```

**Begründung der Wahl zwischen den beiden Wegen.** Die Summengrenze zu senken (48 → 40 MB) kostet
**dem Benutzer Anhänge** — Material aus einer fremden E-Mail, das er nicht ausgesucht hat und für
dessen Größe er nichts kann. Die Rumpfgrenze zu heben kostet **flüchtigen Speicher** auf einer
Route, die ohnehin ein Token verlangt: nach der gemessenen Spanne (Faktor ≈ 3,3 auf den
zugelassenen Rumpf) rund 26 MB mehr an der Spitze, einmalig je Anfrage. Von den beiden Preisen zahlt
den einen der Rechner und den anderen der Benutzer.

**Das Fenster, in dem `total_too_large` feuert**, ist der Spielraum geteilt durch 4/3 — rund 6 MiB
Überschuß über der Summengrenze. Darüber bleibt es bei `413`, und das ist richtig: Ab irgendeiner
Größe ist eine Anfrage kein Postfachinhalt mehr. Die Gegenprobe nach oben steht als Zusicherung im
Festpunkt.

**Warum 8 MiB Spielraum und nicht 800 KiB.** Die aufgezählten Felder (JSON-Gerüst, bis 100 Namen à
1020 Zeichen, Betreff, Absender, Rumpf, base64-Aufrundung je Datei) summieren sich auf deutlich
weniger; der Festpunkt rechnet das aus und hält es dagegen. Großzügig ist die Zahl, weil ihr
**Fehlbetrag** ein stiller Ausfall wäre (413 statt einer namentlichen Meldung) und ihr Überschuß nur
flüchtiger Speicher — dieselbe Richtung wie im Aufräumlauf, an anderer Stelle.

**Der Festpunkt** steht als Abschnitt 8 in `proof:route-policy` (läuft in `proof:all`, **kein** neuer
Eintrag in `package.json` nötig). Vier Zusicherungen; und er ist **kein** tautologisches Grün — mit
der alten Zahl `64 * 1024 * 1024` an derselben Stelle wird er rot, gegengeprüft:

```
FEHL  eine Rohsumme 1 MiB ueber der Fachgrenze passt als Rumpf noch durch
      — base64(51380224) = 68506968 >= 67108864
46 bestanden, 2 fehlgeschlagen
```

Er mißt die **Zusage**, nicht die Leitung. Eine 70-MiB-Anfrage im Tor kostete eine Minute und einen
Viertel-Gigabyte je Lauf; die Leitung hat der security-checker gemessen, und der Prüffall dafür
gehört dem unit-tester (Naht unten).

`ADDIN_ATTACHMENT_BASE64_MAX_LENGTH` in `routes/addin/schema.ts` ist aus der **Fachgrenze**
gerechnet, die unverändert bleibt — an integration-devs Fläche ändert sich dadurch nichts, und an
`apps/outlook-addin/src/attachments/model.ts` ebenfalls nichts.

---

## 4 — `sweepOrphanedImages`: gemessen, nicht geändert (offener Punkt aus dem Auftrag)

Dieselben drei Wege, gegen den **ungeänderten** Lauf gefahren:

| Weg | trägt dort? | Messung |
|---|---|---|
| **T-313-1** — eine passende Zeile entwaffnet den Riegel für alle anderen | **ja, strukturell** — der Riegel hängt dort weiterhin an `known.size === 0` | zwei Bilder, eine Zeile passend, eine mit Groß-/Kleinabweichung: **entfernt = 1**, Datei fort, Zeile steht |
| dasselbe als **Schreibweise** | **abgeschwächt** — `target` trägt dort einen **Namen**, keinen Pfad; bleibt die Groß-/Kleinschreibung | siehe oben, dieselbe Messung |
| **T-313-2** — die enge Bedingung kostet die Datei | **ja** — dort ist es `kind = 'image'` statt `origin` | zwei Bilder, beide Zeilen `kind='file'`: **entfernt = 2**, beide Dateien fort, beide Zeilen stehen |
| **T-313-3** — Migration 0023 zurück und vor | **nein** | der Lauf hängt nicht an `origin`: **entfernt = 0** |

**Und ein vierter, den T-313 nicht genannt hat und der der erreichbarste von allen ist.** Der
Bildlauf fragt mit **bloßen Namen** (`target IN (namen)`); eine Zeile, die dieselbe Datei mit ihrem
**vollen Pfad** nennt, ist für ihn unsichtbar. Ein solcher Pfad kommt durch die gewöhnliche Tür:
absolut, vorhanden, Endung `.png` — also genau das, was `checkAttachmentPath` durchläßt. Gemessen:
Bildkopie + eine `kind='file'`-Zeile mit dem vollen Pfad derselben Datei →
**entfernt = 1, Dateien = 0, Zeilen = 1**. Die Datei des Benutzers ist fort, sein Anhang steht.

**Einordnung, ehrlich:** Die Reichweite ist bei den `kind`-Fällen kleiner als bei T-313-2, weil
`kind` keinen `DEFAULT` hat und über keine Route geändert wird (VG-3 oder eine künftige Migration).
Der vierte Fall braucht **keinen** VG-3: Er entsteht, wenn ein Benutzer eine Bildkopie zusätzlich
als Dateianhang einträgt. Die Klasse ist in allen vier Fällen dieselbe wie in 40.1, und das
Gegenmittel wäre wörtlich dasselbe: `attachmentTargetNamesFile` statt `IN (namen)`, plus ein Riegel,
der nicht an `known.size === 0` hängt.

**Geändert habe ich dort nichts** — der Auftrag sagt melden, nicht beheben. Der Umbau kostet nach
meiner Schätzung eine halbe Welle: Portmethode tauschen, Riegel aus dem `if` holen, Verdrahtung in
`main.ts`, dieselben vier Messungen. Ich empfehle ihn in der nächsten Welle und nicht später — der
vierte Fall braucht kein Werkzeug und keinen Fehler, nur einen Benutzer.

---

## 5 — Annahmen (entschieden, ohne zu fragen)

1. **Der Riegel verweigert nur zusammen mit einer Datei, die fallen würde.** Der Wortlaut von
   A-A-98 („**jede** nicht zuzuordnende Datei ist ein Widerspruch, sobald der Bestand Dateianhänge
   in diesem Ordner führt") hätte auch den Grundfall verweigert — 3 Dateien, 2 Zeilen, eine Waise —
   und damit die Meßvorgabe derselben Auflage („eine echte Waise fällt weiterhin") verletzt. Ich
   habe die **Meßvorgabe** als die genauere Hälfte gelesen und den Riegel an den Widerspruch
   zwischen Bestand und Ordner gehängt, nicht an die bloße Anwesenheit von Zeilen.
2. **Die Ordnerfrage darf unvollständig sein.** `attachmentNamesUnder` vergleicht den Präfix in
   beiden Trennerschreibweisen und ASCII-gefaltet, trifft aber weder Kurznamensform noch
   Verbindungspunkte. Das ist hingenommen: Diese Antwort **bremst** nur. Eine zu kleine Antwort
   kostet eine Bremse, keine Datei — die tragende Sicherung ist die weite Namensfrage.
3. **Der Lauf kann dauerhaft verweigern**, wenn ein Benutzer eine Datei von Hand aus dem Ordner
   löscht, deren Zeile stehenbleibt. Dann räumt er nichts mehr auf, sagt es aber bei jedem Start in
   einer `warn`-Zeile mit Zahlen. Nach der Leitlinie ist das der billige Fehler; behoben wird er,
   indem der Benutzer den Anhang entfernt.
4. **Ein neuer Verweigerungsgrund `no_folder`** statt eines stillen Durchlaufs, wenn der Ordner
   nicht bestimmbar ist. Ein Lauf mit einer Gegenfrage weniger ist ein Lauf, der mehr löscht.
5. **Zwei Zweige in `attachmentsNamingFiles` bewußt weggelassen** (`names.length === 0` und
   `!owned.has(name)`). Beide sparten nur eine Anweisung und kosteten je einen ungeprüften Zweig.
   Siehe Risiko 1 — sie waren zugleich die zwei Zweige, die die Abdeckungsschwelle gerissen haben.
6. **Die Rumpfgrenze wandert, nicht die Summengrenze** (offene Frage 1 aus T-313). Begründung
   oben; der security-checker hat ausdrücklich nicht empfohlen, also habe ich entschieden.
7. **Kein neuer Nachweislauf**, sondern Abschnitt 8 in `proof:route-policy` — damit keine Änderung
   an `package.json` nötig ist.

---

## 6 — Risiken

1. **Die Abdeckungsschwelle steht auf zwei Zweigen.** `packages/storage/src/**` liegt bei
   **80,20 % Zweigen (794/990)** gegen die Schwelle von 80 %. Vor meiner Streichung der zwei
   überflüssigen Zweige waren es 79,88 % und `pnpm check` war **rot**. Der Grund ist strukturell und
   nicht handwerklich: Der neue Adaptercode hat heute **null** Prüffälle, weil `packages/*/test/**`
   dem unit-tester gehört. Der nächste Agent, der eine Zeile mit einem Zweig in `packages/storage`
   ergänzt, macht das Tor wieder rot. **Das ist der wichtigste Punkt dieses Berichts nach den
   Löschwegen.**
2. **Die Eigentümerfrage ist ein vollständiger Tabellenlauf** (`LIKE '%name%'`, kein Index
   benutzbar), einmal beim Start und nur, wenn Dateien im Ordner liegen. Bei einigen hundert
   Anhängen ist das unmeßbar; bei zehntausend Dateien im Ordner **und** zehntausend Zeilen wäre es
   spürbar. Ich halte den Preis für richtig bezahlt — der Index machte die Frage schnell und falsch
   —, aber er ist bezahlt und nicht geschenkt.
3. **`sweepOrphanedImages` löscht heute noch.** Vier gemessene Wege, einer davon ohne VG-3
   erreichbar. Solange er unverändert ist, steht R-29 nur zur Hälfte geschlossen da.
4. **Alles auf Windows 11 gemessen.** Auf POSIX ist die ASCII-Faltung großzügiger als das
   Dateisystem (dort ist `A.eml` ≠ `a.eml`); die Folge ist ein Eigentümer zuviel und damit eine
   Datei, die liegen bleibt. Richtige Richtung, aber ungemessen.
5. **Der Festpunkt mißt die Zusage, nicht die Leitung.** Daß eine 49-MiB-Rohsumme wirklich `201`
   mit `rejected: total_too_large` ergibt, ist **nicht** gefahren — dafür braucht es einen
   Prüffall in fremder Hoheit (Naht unten). Was ich gefahren habe, ist die Arithmetik dahinter.

---

## 7 — Nähte in fremder Hoheit (gebaut habe ich sie nicht)

**unit-tester** (`packages/*/test/**`, `apps/*/test/**`) — in dieser Reihenfolge:

1. `packages/domain/test/attachment.test.ts`: `attachmentTargetNamesFile` — gleicher Name;
   abweichende Groß-/Kleinschreibung; beide Trenner; nachgestellter Punkt; ein Pfad, der auf den
   Namen endet, ohne ihn als letzten Bestandteil zu führen; leerer Name → `false`. **Rein, ohne
   Dienst.**
2. `apps/local-api/test/usecases/email-file-sweep.test.ts` — **existiert heute nicht**, und der
   Lauf hat damit null Prüffälle. Die zehn Fälle aus Abschnitt 2 dieses Berichts sind mit einer
   Attrappe der sieben Portfunktionen ohne Datenbank fahrbar; die drei Gegenproben und die
   Gegenprobe nach oben sind die tragenden.
3. `packages/storage/test/repo-attachments.*`: `attachmentsNamingFiles` und
   `attachmentNamesUnder` gegen eine echte migrierte Datenbank — auch wegen Risiko 1.
4. Ein Prüffall, der die **Leitung** mißt: Rohsumme 49 MiB über
   `POST /api/v1/addin/todos` → `201`, Todo entsteht, `rejected` nennt jede Datei mit
   `reason: 'total_too_large'`; Gegenprobe: Rumpf über 72 MiB → `413`. Er gehört in
   `apps/local-api/test/**` oder zum e2e-tester, nicht in `proof:all` (Laufzeit und Speicher).

**e2e-tester:** nichts Neues nötig; die Zahlen der Anhangsübernahme ändern sich nach außen nicht.

---

## 8 — Offene Fragen an den Orchestrator

1. **Wird `sweepOrphanedImages` in der nächsten Welle umgebaut?** Meine Empfehlung: ja, mit den
   vier Messungen aus Abschnitt 4 als Auftragstext. Der vierte Fall braucht keinen VG-3.
2. **Die Abdeckungsschwelle in `packages/storage`** (Risiko 1) trägt gerade noch. Soll der
   unit-tester in derselben Welle nachziehen, oder wird die Schwelle für eine Welle als
   „gemessen knapp" vermerkt? Ich empfehle das Erste; die Schwelle zu senken wäre die Gewohnheit,
   vor der Kapitel 39 warnt.
3. **`risks.md`:** R-29 („Der Lauf, der löscht") ist für die E-Mail-Dateien geschlossen und für die
   Bildkopien **offen** — mit vier gemessenen Wegen statt der bisher vermuteten drei. Der Eintrag
   gehört dir.
4. **A-A-99 und A-A-101 sind nicht gebaut** (Grenze über die Zeit, eine Einspielung zur Zeit). Beide
   standen ausdrücklich für die nächste Welle; ich nenne sie nur, damit sie nicht durch diesen
   Bericht als erledigt gelesen werden.
5. **Spezifikation:** A-19.30/A-19.34 nennen die Rumpfgrenze dieser Route. Wenn dort eine Zahl
   steht, wandert sie von 64 MB auf 72 MiB — `docs/spec.md` ist deine Datei, ich habe sie nicht
   angefaßt.

---

## 9 — Definition of Done

| Punkt | Stand |
|---|---|
| Migration vorwärts und rückwärts | grün (`proof:migrations`, `proof:db-permissions`; 0023 zurück auf 22 und wieder vor gefahren) |
| Rundung, Exportstatus, Timer-Regel rein in `packages/domain` | unberührt; **neu** dazu die Eigentümerregel, ebenfalls rein |
| Export transaktional | unberührt |
| OpenAPI erzeugt | grün, `proof:openapi` 115/115 |
| `pnpm typecheck` | grün |
| **`pnpm check` vollständig** | **grün, Exitcode 0** — alle neunzehn Nachweisläufe, `test:coverage`, `test:rust`, `build`, `audit` |
