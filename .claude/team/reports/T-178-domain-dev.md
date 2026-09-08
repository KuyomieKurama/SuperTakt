# T-178 — O-DX, A-A-36 und die Nacharbeit aus T-179

**Rolle:** domain-dev **Datum:** 2026-09-05 **Zweig:** `versionspruefung-gegen-github`

---

## Kurzfassung

```
Aufgabe: T-178 — O-DX: addAttachment weist einen Doppelpunkt im Dateinamen
         auch an der Tür ab (A-A-28), als zweiter Riegel, nicht als Ersatz;
         A-A-36 beide Hälften am Aufräumlauf aus T-168;
         dazu die zwei blockierenden Befunde aus T-179 (code-reviewer)
Status: fertig — mit einer Folge in fremder Hoheit (Prüffälle, unit-tester)
```

**O-DX:** `checkAttachmentPath` fragt jetzt nach dem Doppelpunkt — **nach** der Absolutheitsprüfung
und **vor** der Endungsprüfung, in derselben Folge wie `check_file` in der Hülle, mit eigenem
Grund (`path_stream_separator`) und eigenem Satz. **A-A-36 zweite Hälfte:** Der Aufräumlauf fragt
vor allem anderen, ob der Bestand genau die drei bekannten Arten führt, und räumt bei jeder
Abweichung **gar nicht** auf. **A-A-36 erste Hälfte:** Der Kopf von `image-sweep.ts` benennt jetzt
`tauri_plugin_single_instance` als Träger der Reihenfolge-Zusage und sagt ausdrücklich, daß der
Portanschlag sie **nicht** trägt.

**T-179 B-1, zweiter Weg zur leeren Antwort:** Der Lauf fragt zusätzlich die **Gesamtzahl** der
Bildanhänge und löscht bei `total > 0 && known.size === 0` **nichts**. Beide Riegel sind gebaut,
weil sie verschiedene Fehler fangen. **T-179, die gemessene Abweichung:** Mein Satz „dieselben
Fragen" stimmte **nicht** — die Domäne war die schwächere, und zwar an **sieben** von zehn
gemessenen Namen, nicht an einem. Die Domäne zieht nach; die Hülle bleibt die tragende.

Die neuen Ports sind **Pflicht** und keine freiwilligen Felder. Das kostet Übersetzungsfehler in
`apps/local-api/test/usecases/image-sweep.test.ts` — fremde Hoheit, eine Zeile je Stelle, und
genau das ist der Zweck (dieselbe Entscheidung wie bei `unresolvedRequired` in T-082).

---

## Artefakte

| Datei | Was |
|---|---|
| `packages/domain/src/attachment.ts` | **O-DX:** `path_stream_separator` in `PathRejection`, neu `hasPathStreamSeparator`, gemeinsame Zerlegung `lastNameSegment`, Aufruf in `checkAttachmentPath`. **A-A-36:** neu `isKnownAttachmentKindSet`. **T-179:** neu `effectiveNameSegment`; `fileExtensionOf` mißt am aufgelösten Namen und zählt den führenden Punkt mit |
| `apps/local-api/src/usecases/attachments.ts` | **O-DX:** `STREAM_SEPARATOR_MESSAGE`, `pathMessage(reason)`, der Absatz „zweiter Riegel" im Kopf von `addAttachment` |
| `apps/local-api/openapi/takt-local-api.yaml` | **O-DX:** Formprüfung des Dateifalls, ihre Reihenfolge, A-A-28, A-A-8, derselbe Satz über die zwei Riegel |
| `packages/storage/src/ports.ts` | **A-A-36:** `AttachmentPort.knownKinds()`. **T-179 B-1:** `AttachmentPort.imageCount()` |
| `packages/storage/src/sqlite/repo-attachments.ts` | **A-A-36:** `SELECT kind FROM todo_attachment_kind`, ohne Bedingung, ohne `COUNT`. **T-179 B-1:** `COUNT(*) … WHERE kind = 'image'` über denselben Teilindex |
| `apps/local-api/src/usecases/image-sweep.ts` | **A-A-36:** beide Hälften — Wächter, Tafel `KIND_OWNS_IMAGE_FILE`, Pflicht-Port, zwei Kopfabschnitte. **T-179 B-1:** die Widerspruchsprüfung und ihr Kopfabschnitt |
| `apps/local-api/src/main.ts` | **A-A-36:** Verdrahtung von `attachmentKinds`, der Satz über den Portanschlag. **T-179 B-1:** Verdrahtung von `imageCount` |

Keine Prüfdatei angefaßt. Keine Migration, kein Schemaumbau, keine Route.

---

# Teil 1 — O-DX (A-A-28 an der Tür)

## Gemessen: rot vor grün, und die Gegenprobe

„Vorher" ist der Rumpf von `checkAttachmentPath` vor dieser Aufgabe, aus den öffentlichen
Bausteinen nachgebaut und gegen dieselben Eingaben gefahren:

| Pfad | Vorher | Nachher |
|---|---|---|
| `/home/nutzer/rechnung.lnk:harmlos.txt` | **`ok`** | `path_stream_separator` |
| `/home/nutzer/rechnung.lnk::$DATA` | **`ok`** | `path_stream_separator` |
| `/home/nutzer/bericht.txt:evil.lnk` | `path_indirect_extension` | `path_stream_separator` |
| `/home/nutzer/Besprechung 10:30.pdf` | **`ok`** | `path_stream_separator` — **der Preis** |
| `/home/nutzer/bericht.txt` | `ok` | `ok` |
| `/home/nutzer/programm.exe` | `ok` | `ok` |
| `/home/nutzer/rechnung.lnk` | `path_indirect_extension` | `path_indirect_extension` |
| `C:\Users\nutzer\bericht.pdf` | `ok` | `ok` — der Laufwerksbuchstabe fällt **nicht** mit |
| `C:datei.pdf` | `path_not_absolute` | `path_not_absolute` — die Reihenfolge hält |

Die letzten beiden Zeilen sind die Gegenprobe zur Reihenfolge. Und die Meldung an der Tür, gegen
`addAttachment` mit einem Kontext, der nur eine Uhr trägt:

```
/home/nutzer/Besprechung 10:30.pdf
  -> validation_error: Ein Doppelpunkt im Dateinamen ist als Anhang nicht
     zulässig: Unter Windows benennt er einen zweiten Datenstrom derselben
     Datei, und Takt öffnet solche Pfade nicht.
/home/nutzer/rechnung.lnk
  -> validation_error: Verknüpfungen (.lnk, .url, .pif, .scf, .desktop) …
relativ/x.pdf
  -> validation_error: Als Datei ist ein vorhandener absoluter Pfad zulässig. …
```

Drei Gründe, drei Sätze, keiner nennt den abgewiesenen Wert (A-A-8).

## Bedingung 1 — die Kontrolle im Öffnen-Befehl bleibt die tragende

Der Satz steht mit seinem **Grund** an vier Stellen: im Kopf von `hasPathStreamSeparator` (lange
Fassung, VG-1 und VG-3 beim Namen), im Kopf von `checkAttachmentPath` (kurz, mit dem Hinweis, daß
er für jeden Schritt gilt), im Kopf von `addAttachment`, und in der OpenAPI-Beschreibung von
`addTodoAttachment`. Der entscheidende Halbsatz richtet sich gegen **beide** Richtungen des
Aufräumens:

> Keine der beiden ist die Verdopplung der anderen. Wer eine davon streicht, weil sie doppelt
> aussieht, streicht entweder die Kontrolle oder die Auskunft.

Die zwei Prüfungen tun nicht dasselbe: Die Hülle **verhindert**, die Tür **erklärt**. Die Hülle
kann ihren Satz erst nach einem Klick sagen, an einem Anhang, den der Benutzer längst angelegt
hat; die Tür sagt ihn im Augenblick der Eingabe. Umgekehrt sieht die Tür nur, was durch sie kommt
— über VG-1 und VG-3 kommt man an ihr vorbei in den Bestand.

## Bedingung 2 — dieselbe Form, und was bei einer Änderung passiert

**Die Form** ist wortgleich: „enthält der letzte Namensbestandteil ein `:`". Drei Dinge tragen die
Gleichheit über den Wortlaut hinaus:

* **Derselbe Schlüssel.** `path_stream_separator` steht in `PathRejection` (Domäne), in
  `Rejection::key()` (Hülle) und in `ForeseeableRefusal`/`REFUSAL_TEXT` (Oberfläche).
* **Dieselbe Reihenfolge als numerierte Liste.** Der Kopf von `checkAttachmentPath` zählt die fünf
  Schritte auf, sagt bei jedem, **warum** er dort steht, und benennt den sechsten Schritt der
  Hülle (`vorhanden`), der hier fehlt, weil die Domäne kein Dateisystem kennt.
* **Eine Zerlegung, nicht zwei.** `lastNameSegment` liegt einmal da und wird von
  `hasPathStreamSeparator` **und** `fileExtensionOf` gerufen. Vorher hatte die Endungsprüfung ihre
  eigene Zerlegung im Rumpf; jetzt können die beiden nicht mehr über verschiedene Dateien reden —
  genau das war der Kern von T-164.

**Der Unterschied in der Zerlegung.** Die Hülle zerlegt mit `Path::file_name()`, also mit dem
Trenner der **laufenden** Plattform; die Domäne an `/` **und** `\`, auf jeder Plattform — sie muß
über einen Windows-Pfad urteilen, während der Dienst auf Linux läuft, und `node:path` wüßte hier
zu wenig. Wo die beiden auseinandergehen, geht es **gutartig** aus:

| Fall | Domäne | Hülle |
|---|---|---|
| `C:\Users\x\a:b.pdf` unter Windows | `path_stream_separator` | `path_stream_separator` |
| `C:\Users\x\a:b.pdf` unter Linux | `path_stream_separator` | `path_not_absolute` (früher) |
| `C:\Users\x\datei.pdf` unter Linux | `ok` | `path_not_absolute` (schon vor T-178) |
| `/home/x/a:b\c.pdf` (Linux-Name mit `\`) | `ok` | `path_stream_separator` (strenger) |

Kein Fall, in dem die Tür annimmt und die Hülle wegen des Doppelpunkts ablehnen müßte, ohne es zu
tun.

> **Berichtigung nach T-179.** Der Satz, den ich hier ursprünglich geschrieben hatte — beide Ketten
> stellten „dieselben Fragen" — war für die **Endungsprüfung** falsch, und zwar nicht knapp. Was
> davon stimmt und was nicht, steht in Teil 3.

**Wenn eine Seite sich ändert.** Ehrlich: Es gibt **keinen Lauf**, der die zwei Fassungen
gegeneinander mißt — ein Rust- und ein TypeScript-Quelltext sind keine zeichengleiche Zusage wie
die CSP in `proof:shell-surface`. Was heute trägt:

* **Hülle wird schwächer:** Die Tür bleibt stehen, aber über VG-1/VG-3 geht der Wert wieder auf.
  **Das ist der gefährliche Fall**, und ihn fängt heute nur der `#[cfg(test)]`-Block in
  `attachment.rs` (Prüffälle dazu stehen als O-DQ bei unit-tester).
* **Tür wird schwächer:** Sicherheit unverändert, Auskunft weg — der Wert landet im Bestand, und
  erst der Klick sagt dem Benutzer, daß Takt ihn nicht öffnet.
* **Eine Seite ändert die Bedeutung** (etwa nur `::` statt jedes `:`): fällt an keiner Stelle
  automatisch auf. Vorschlag für einen Nachweispfad steht unter „Offene Fragen", Punkt 1.

## Bedingung 3 — der Preis ist benannt

`Besprechung 10:30.pdf` läßt sich unter Linux und macOS nach T-167 nicht mehr **öffnen** und nach
T-178 nicht mehr **eintragen**. Abgewogen in Bedrohungsmodell 22.1.1; unter Windows kostenlos,
weil dort kein gültiger Dateiname einen Doppelpunkt trägt. Die Meldung nennt den **Grund** (den
Doppelpunkt — sonst wüßte der Betroffene nicht, was an seinem Pfad falsch ist), die **Folge**
(Takt öffnet ihn nicht, der Anhang nützt also nichts) und dazwischen einen Nebensatz, warum eine
Windows-Anwendung sich um seinen Linux-Namen kümmert. Keine vierte Aussage, kein Rat, keine
Bedrohungslage. Ohne Anrede (E-080 Punkt 4: die beste Anrede ist keine); die Länge deckt E-078
Punkt 1, weil der Satz eine **Absage** begründet. Ein eigener Satz und nicht `PATH_MESSAGE`:
„Netzwerkpfade sind es nicht" wäre für diesen Benutzer eine falsche Fährte — sein Pfad ist
absolut, vorhanden und kein Netzwerkpfad.

---

# Teil 2 — A-A-36 (Auflage aus T-176, security-checker)

## Erste Hälfte — der Kommentar bekommt den richtigen Träger

Zwei neue Abschnitte im Kopf von `image-sweep.ts`, und derselbe Satz an der Aufrufstelle in
`main.ts`. Sie sagen drei Dinge, die vorher nicht dastanden:

1. Die Zusage „solange keine Route zuhört, kann kein Anhang entstehen" gilt für **diesen Prozeß**.
   Ein zweiter Prozeß auf derselben Bestandsdatei läge genau im Zeitfenster zwischen Kopie und
   Zeile.
2. Getragen wird die Einzigkeit von `tauri_plugin_single_instance` in
   `apps/desktop/src-tauri/src/lib.rs` — **einer Zeile in einer anderen Sprache in einem anderen
   Verzeichnis**, registriert als erstes Plugin und damit vor dem `setup`, in dem der Sidecar
   entsteht.
3. **Der Portanschlag trägt sie nicht.** Das `EADDRINUSE` in `main.ts` greift erst beim Lauschen,
   also nach diesem Lauf; wer ihn für den Träger hält, hält einen Riegel für gesetzt, der zu
   dieser Zeit noch offen ist. Und im Entwicklungsbetrieb ohne Hülle gibt es die Einzigkeit gar
   nicht — das Fenster ist schmal, die Folge wäre eine verlorene Bildkopie und kein Datenabfluß,
   und es steht trotzdem im Satz und nicht in einer Fußnote.

## Zweite Hälfte — der vierte Riegel

`OrphanedImageSweep` bekommt `attachmentKinds()`, `AttachmentPort` bekommt `knownKinds()`, und
`sweepOrphanedImages` fragt **vor allem anderen**, ob der Bestand genau die bekannten Arten führt.
Die Regel selbst liegt als `isKnownAttachmentKindSet` in `packages/domain` — rein, ohne Bestand,
ohne Dienst prüfbar.

**Mengengleichheit in beide Richtungen**, nicht Teilmenge. Zu viel heißt: dieses Erzeugnis kennt
eine Art nicht und darf über sie nicht rechnen. Zu wenig heißt: der Bestand ist älter oder eine
Zeile fehlt — auch das ist kein Zustand, in dem jemand etwas löschen soll.

**Der Wächter steht vor `listImages`**, obwohl er teurer ist als ein `readdir`, das meistens nichts
findet. Nicht wegen der Zeit: Ein Lauf, der erst das Verzeichnis liest und dann feststellt, daß er
nicht urteilen darf, hat schon eine halbe Entscheidung getroffen.

**Die Protokollzeile nennt den Grund und keine Art beim Namen** — was dort stünde, käme aus dem
Bestand, und das Protokoll ist kein Ort für Werte daraus (B-2.4). Schlüssel:
`attachment_image_sweep_unknown_kinds kinds=<n> expected=3`.

**Dazu ein Übersetzungsriegel, den die Auflage nicht verlangt hat.** Der Laufzeitriegel fängt eine
Datenbank, die dieser Fassung **voraus** ist. Er fängt **nicht** den Fall, in dem jemand eine
vierte Art ordentlich einführt — Migration, Domäne, Anzeige — und dabei übersieht, daß
`knownImageTargets` mit `kind = 'image'` fragt: Danach passen die Mengen wieder, und der Riegel
schweigt. Dafür steht `KIND_OWNS_IMAGE_FILE: Readonly<Record<AttachmentKind, boolean>>` im Lauf,
nach dem Vorbild von `ATTACHMENT_KIND_PRESENCE` und `SOURCE_PRESENCE`: Wer `AttachmentKind`
erweitert, bekommt hier einen Übersetzungsfehler und muß sagen, ob die neue Art eine Datei im
Bildverzeichnis hält. Steht dort `true`, hat er gerade gesagt, daß der Bestand auch für sie
befragt werden muß. Siehe „Annahmen", Punkt 5.

## Wie A-A-36 zu messen ist — gemessen, zum Übernehmen

Der Nachweis der Auflage, gefahren gegen `sweepOrphanedImages` mit einem Verzeichnis, in dem
**eine Waise liegt**, und einem Bestand, der sie **nicht kennt** (also: ohne den Wächter würde sie
entfernt):

| `attachmentKinds()` liefert | entfernt | Protokollzeile |
|---|---|---|
| `['link','image','file']` | **1** | `info:attachment_image_orphans_removed` — **unverändertes Verhalten** |
| `['link','image','file','screenshot']` | **0** | `warn:attachment_image_sweep_unknown_kinds` |
| `['link','image']` | 0 | `warn:attachment_image_sweep_unknown_kinds` |
| `['link','image','bild']` | 0 | `warn:attachment_image_sweep_unknown_kinds` |
| `[]` | 0 | `warn:attachment_image_sweep_unknown_kinds` |

Die ersten beiden Zeilen sind wörtlich die zwei Fälle der Auflage. Die reine Regel einzeln:

```
true   ["link","image","file"]
true   ["file","image","link"]      <- Reihenfolge zählt nicht
false  ["link","image","file","x"]
false  ["link","image"]
false  ["link","image","image"]
false  []
```

Und gegen die **echte** Migration 0015 in einer `:memory:`-Datenbank, mit dem echten Adapter:

```
aus 0015          ["file","image","link"]                -> bekannt: true
vierte Art        ["file","image","link","screenshot"]   -> bekannt: false
eine Art fehlt    ["image","link"]                       -> bekannt: false
Tabelle fehlt (Rückweg 0015): entfernt = 0 | warn:attachment_image_sweep_unavailable
```

**Zwei Dinge daran gehören in den Prüffall, weil sie beim Schreiben leicht falsch werden:**

1. `knownKinds()` liefert die Zeilen in Primärschlüsselordnung — `file, image, link`, **nicht**
   `link, image, file`. Ein Prüffall, der Felder vergleicht statt Mengen, wäre rot, ohne daß etwas
   kaputt ist. Deshalb vergleicht `isKnownAttachmentKindSet` Mengen.
2. Fehlt die Tabelle (Rückweg 0015), **wirft** die Abfrage; das äußere `catch` des Laufs fängt
   sie, es wird nichts entfernt, und die Zeile ist die alte `…_sweep_unavailable`. Der neue Riegel
   verschlechtert diesen Fall nicht.

## Was diese Änderung in fremder Hoheit kostet

`attachmentKinds` ist **Pflicht**. Das ergibt in
`apps/local-api/test/usecases/image-sweep.test.ts` **10 Übersetzungsfehler** (TS2741, je einer pro
`const ports: OrphanedImageSweep = { … }`) und **8 rote Prüffälle**. Die anderen zwei laufen weiter
grün, weil dort ohnehin geworfen wird und das `catch` greift.

Die Behebung ist eine Zeile je Stelle, und sie gehört unit-tester:

```ts
attachmentKinds: async () => ['link', 'image', 'file'],
```

**Absichtlich als Literal und nicht über `ATTACHMENT_KINDS` aus der Domäne**: Ein Prüffall, der
seine Erwartung aus derselben Quelle holt wie der Prüfling, mißt nichts. Für die zwei neuen Fälle
der Auflage ist das Literal ohnehin Pflicht (`[…, 'screenshot']`).

Ich habe die Datei **nicht** angefaßt (`apps/*/test/**` ist fremde Hoheit, und unit-tester arbeitet
in derselben Welle darin).

---

# Teil 3 — die zwei blockierenden Befunde aus T-179 (code-reviewer)

## B-1 zweite Hälfte — die Endungsprüfung war die schwächere, an sieben von zehn Namen

**Der Reviewer hat recht, und der Befund ist größer als sein Beispiel.** Er nennt
`checkAttachmentPath('/home/nutzer/.lnk')` → `ok` gegen die Hülle, die abweist. Ich habe die ganze
Familie nachgemessen, statt nur den genannten Fall zu heilen — es waren **drei** Familien:

| Pfad | Tür vorher | Hülle | Tür nachher |
|---|---|---|---|
| `/home/nutzer/.lnk` | **`ok`** | weist ab | `path_indirect_extension` |
| `/home/nutzer/.LNK` | **`ok`** | weist ab | `path_indirect_extension` |
| `/home/nutzer/.desktop` | **`ok`** | weist ab | `path_indirect_extension` |
| `/home/nutzer/rechnung.lnk.` | **`ok`** | weist ab | `path_indirect_extension` |
| `/home/nutzer/rechnung.lnk.. ` | **`ok`** | weist ab | `path_indirect_extension` |
| `/home/nutzer/rechnung.lnk ` | **`ok`** | weist ab | `path_indirect_extension` |
| `C:\Users\n\verweis.URL ` | **`ok`** | weist ab | `path_indirect_extension` |
| `/home/nutzer/rechnung.lnk` | `path_indirect_extension` | weist ab | unverändert |
| `/home/nutzer/bericht.pdf` | `ok` | ok | unverändert |
| `/home/nutzer/.bashrc` | `ok` | ok | unverändert |

**Abweichungen vorher: 7 von 10. Nachher: 0 von 14** (die vier zusätzlichen sind Gegenproben:
`datei.`, `...`, `README`, `archiv.tar.gz` — alle unverändert). Gemessen gegen einen Nachbau der
Hüllenregel (`effective_file_name` + `rsplit_once('.')` + `INDIRECT_EXTENSIONS`).

**Welcher von beiden stimmte nicht: meiner.** Die Hülle war schon vor T-178 richtig — T-156 hat
den nachgestellten Punkt dort gemessen und geschlossen (A-A-5′), und die **Oberfläche** hat beide
Regeln ebenfalls seit T-167 (`effectiveFileNameOf`, `dot === -1`). Die Domäne war die einzige der
drei, die noch die naive Fassung trug, und mein Satz „dieselben Fragen" hat das zugedeckt, statt es
zu finden. Zwei grüne Prüffälle behaupteten beides — der Reviewer nennt
`attachment.rs:763` gegen `attachment.test.ts:421` — und keiner von beiden war rot.

**Die Domäne zieht nach, und die Hülle bleibt trotzdem die tragende.** Das ist kein Widerspruch,
sondern die Arbeitsteilung aus Bedingung 1: Die Tür prüft, was durch sie kommt; die Hülle prüft,
was aufgeht — und zwischen beiden liegt der Bestand (VG-1, VG-3). Ein Wert, der über `sqlite3`
hineingeschrieben wird, sieht die Domäne nie. Die Domäne wird durch das Nachziehen also nicht zur
Grenze; sie hört auf, **schwächer** zu sein als die Grenze, und genau das ist der Unterschied.

Gebaut als `effectiveNameSegment` (schneidet nachgestellte `.` und Leerzeichen ab, zeichengleich
mit `effective_file_name` in Rust und `effectiveFileNameOf` in der Oberfläche) und `dot === -1`
statt `dot <= 0`.

## B-1 erste Hälfte — der zweite Weg zur leeren Antwort

Der Reviewer und der security-checker haben unabhängig denselben Zustand gefunden und **zwei
verschiedene Wege** dorthin beschrieben. Beide Riegel sind gebaut, weil keiner den anderen deckt:

| Riegel | fängt | fängt **nicht** |
|---|---|---|
| Artenprüfung (A-A-36) | ein Bestand mit **anderen Arten** | eine Änderung an `target`/`kind` ohne neue Art |
| Widerspruchsprüfung (T-179 B-1) | `total > 0 && known.size === 0` | eine vierte Bildart mit **einer** zugeordneten Datei |

Die Widerspruchsprüfung schweigt, sobald auch nur eine Datei zugeordnet werden kann; die
Artenprüfung schweigt, sobald die Arten stimmen. Zwei Riegel, nicht einer.

**Gefragt wird erst, wenn die Antwort leer ist.** Solange auch nur ein Name zugeordnet wurde, hat
die Abfrage sich selbst belegt, und eine Zahl daneben kostete eine Abfrage ohne Aussage.

Gemessen, gegen zwei Dateien im Verzeichnis, von denen keine zugeordnet wird:

| Fall | entfernt | Protokollzeile |
|---|---|---|
| Regelfall: eine Waise, eine bekannte | 1 | `info:…orphans_removed` |
| alles verwaist, Bestand führt **0** Bildanhänge | 2 | `info:…orphans_removed` — **legitim, räumt weiter** |
| alles verwaist, Bestand führt **5** | **0** | `warn:…sweep_contradiction` |
| alles verwaist, Bestand führt **1** | **0** | `warn:…sweep_contradiction` |
| vierte Art in der Nachschlagetabelle | 0 | `warn:…sweep_unknown_kinds` |
| nichts im Verzeichnis | 0 | keine |

Die zweite Zeile ist die wichtige Gegenprobe: Ein Bestand **ohne** Bildanhänge ist kein
Widerspruch, sondern der Regelfall nach einem Rückweg — dort wird weiter aufgeräumt.

**Der Preis, ausgeschrieben:** Ein Benutzer, der **alle** seine Bilddateien von Hand aus dem
Verzeichnis gelöscht hat und daneben verwaiste Kopien liegen hat, wird ab jetzt nicht mehr
aufgeräumt — sein Bestand sieht von außen genau wie der Schadensfall aus. Der Tausch geht in die
Richtung, die A-A-18 vorgibt: Liegengebliebenes ist ärgerlich, gelöschtes Kundenmaterial mit
Eigentümer ist unwiederbringlich. Der Satz steht im Kopf der Datei und nicht nur hier.

## Punkt 4 des Nachtrags — `docs/architektur.md`

Zur Kenntnis genommen, nichts getan: Der Abschnitt 5.6a bleibt stehen, die Hoheitslücke schließt
der Orchestrator. Ich habe die Datei in dieser Aufgabe **nicht** angefaßt.

---

## Nachweis — Zahlen vorher und nachher

| Lauf | Vor T-178 | Nach Teil 1 (O-DX) | Nach Teil 2 (A-A-36) | Nach Teil 3 (T-179) |
|---|---|---|---|---|
| `pnpm typecheck` | 1 fremder Fehlschlag (`apps/web/…/FormDialog.tsx`, 2 × TS6133) | 0 Fehler | 10 Fehler, eine Prüfdatei | **15 Fehler**, dieselbe Prüfdatei, alle TS2741 |
| `pnpm test` | 1369 grün, **2 rot** (O-EM, fremd) | 1385 grün, 0 rot | 1404 grün, 8 rot | **1420 grün, 2 rot** |
| `pnpm run boundaries` | grün, 373 Dateien | grün, 373 | grün, 372 | grün, 372 |
| `pnpm run proof:codepoints` | — | grün, 45 | grün, 45 | grün, 45 |
| `pnpm run proof:openapi` | — | grün, 110 | grün, 110 | grün, 110 |

Die Zahlen der letzten Spalte bewegen sich, während sie gemessen werden: unit-tester arbeitet in
derselben Welle an denselben Prüfdateien. Beim letzten Lauf (Abschluß dieser Aufgabe) war der
Domänenfall zu `.bashrc` bereits umgeschrieben und grün, `attachmentKinds` in allen Vorrichtungen
eingetragen — offen sind noch **15 Übersetzungsfehler** und **2 rote Fälle**, alle in
`apps/local-api/test/usecases/image-sweep.test.ts`, alle wegen des fehlenden `imageCount`.

Meine **Produktivfläche** einzeln, am Ende:

```
tsc -p packages/domain/tsconfig.json      0 Fehler
tsc -p packages/storage/tsconfig.json     0 Fehler
tsc -p apps/local-api/tsconfig.json       0 Fehler
tsc -p packages/domain/tsconfig.test.json 0 Fehler   (fremde Fläche, unberührt)
tsc -p packages/storage/tsconfig.test.json 0 Fehler  (fremde Fläche, unberührt)
```

**Eigene und fremde Fehlschläge, getrennt:**

* **Fremd und unbeteiligt:** die zwei `FormDialog.tsx`-Fehler zu Beginn (frontend-dev, inzwischen
  grün) und die zwei roten Domänenfälle aus O-EM (unit-tester, inzwischen umgeschrieben).
* **Von mir verursacht, in fremder Hoheit zu beheben** — alle drei sind **beabsichtigte Wirkung**
  und keine Panne:
  1. **15 Übersetzungsfehler** in `apps/local-api/test/usecases/image-sweep.test.ts` (TS2741,
     `imageCount` fehlt) und **2 rote Prüffälle** ebenda — **offen**. Behebung: eine Zeile je
     Vorrichtung, `imageCount: async () => 0,` beziehungsweise die Zahl, die der Fall behauptet.
  2. **1 roter Prüffall** in `packages/domain/test/attachment.test.ts`
     („eine versteckte Unix-Datei (führender Punkt) hat KEINE Endung",
     `fileExtensionOf('/home/nutzer/.bashrc')`). Das war **genau der Prüffall, den T-179 als
     falsche Behauptung benennt** — er hielt die Abweichung von der Hülle fest. Neue Erwartung
     `'bashrc'`; unit-tester hat ihn während dieser Aufgabe bereits umgeschrieben, er ist
     **grün**.
* **Eigene Fehlschläge auf eigener Fläche: keine.** Domänen- und Speicherungs-Prüffläche
  übersetzen fehlerfrei; die Produktivfläche ebenfalls.

`proof:all` **nicht gefahren** (E-083 Punkt 3 — fester Port, andere Agenten laufen). Gefahren sind
die portfreien Einzelpfade, die diese Änderungen berühren könnten: `proof:codepoints` und
`proof:openapi`. Der Rückgang der Grenzprüfung von 373 auf 372 Dateien stammt nicht von mir — ich
habe keine Datei angelegt oder entfernt.

---

## Annahmen

1. **`fileExtensionOf` bleibt doppelpunkt-blind — und nur das.** Die Oberfläche läßt ihr
   `extensionOf` für einen Namen mit Doppelpunkt `""` zurückgeben; die Domäne zieht **hier nicht**
   nach, weil sie `has_indirect_extension` in der Hülle spiegelt, und das ist dort ebenfalls
   doppelpunkt-blind — beide sind durch die vorgelagerte Doppelpunktprüfung gedeckt, statt sie
   nachzubauen. In den **zwei anderen** Punkten (nachgestellter Punkt beziehungsweise Leerzeichen,
   führender Punkt) zieht sie nach T-179 sehr wohl nach; siehe Teil 3. Die verbleibende Auslassung
   steht ausdrücklich im Kopf, samt dem Satz, was passiert, wenn jemand die Reihenfolge umdreht.
2. **`hasPathStreamSeparator` ist exportiert**, `lastNameSegment` nicht. Das `Path`-Infix trennt es
   vom `hasStreamSeparator` der Oberfläche, das auf `ForeignText` arbeitet.
3. **Der Grund heißt `path_stream_separator`** — buchstabengleich mit `Rejection::key()`.
4. **`knownKinds()` gibt `string[]` zurück und nicht `AttachmentKind[]`.** Gefragt wird gerade
   nach dem, was dieses Erzeugnis **nicht** kennt; ein Typ, der die Antwort auf drei Werte
   einengt, gäbe die Frage auf, bevor sie gestellt ist.
5. **`KIND_OWNS_IMAGE_FILE` ist eine Zugabe.** Die Auflage verlangt sie nicht. Ohne sie wäre der
   Riegel nur ein Laufzeitriegel, der genau dann wieder schweigt, wenn jemand eine vierte Art
   ordentlich einführt — also im wahrscheinlichsten Fall. Sie kostet fünf Zeilen und ist die
   Bauart, die dieses Vorhaben für solche Fälle schon zweimal gewählt hat
   (`ATTACHMENT_KIND_PRESENCE`, `SOURCE_PRESENCE`). Wenn code-reviewer sie für Übergriff hält,
   ist sie in einer Minute entfernt.
6. **Kein neuer Nachweispfad, kein Eintrag in `package.json`.** Beides gehört dem Orchestrator.
7. **Bei T-179 B-1 sind beide Riegel gebaut, nicht der billigere allein.** Der Reviewer nennt seinen
   Vorschlag „enger und billiger" als den aus dem Bedrohungsmodell — er ist beides, aber er ersetzt
   ihn nicht: Die Tafel in Teil 3 zeigt für jeden der zwei Riegel einen Fehler, den der andere
   durchläßt. Der Nachtrag des Orchestrators sagt dasselbe („Bau beides"); ich halte es hier fest,
   damit der nächste Aufräumer nicht einen davon für die Verdopplung des anderen hält.
8. **`imageCount` wird nur bei leerer Antwort gefragt.** Eine Abfrage weniger im Regelfall, und
   die Aussage ist dieselbe: Bei nicht-leerer Antwort hat sich die Abfrage selbst belegt.

---

## Risiken

* **R-A (mittel, benannt).** Die zwei Fassungen der Doppelpunktregel (Domäne, Hülle) können
  auseinanderlaufen, ohne daß ein Lauf es merkt. Richtung und Bewertung stehen in Teil 1.
* **R-B (klein, gewollt).** Ein Linux-Benutzer mit Doppelpunkt im Dateinamen kann den Anhang nicht
  mehr anlegen. Die Meldung sagt ihm, was los ist. Sein Ausweg — die Datei umbenennen — steht
  **nicht** in der Meldung, weil ein Rat in einer Fehlermeldung E-078 Punkt 1 nicht überlebt.
  Falls spec-ux-reviewer das anders sieht: ein Halbsatz, keine Umarbeitung.
* **R-C (klein).** Ein bestehender Anhang mit Doppelpunkt bleibt im Bestand. Diese Änderung wirkt
  nur an der Tür und räumt nichts auf.
* **R-D (neu, klein, gewollt).** Der Aufräumlauf ist ab jetzt **stiller** in einem Fall mehr: Führt
  der Bestand fremde Arten, wird gar nicht aufgeräumt, und verwaistes Material bleibt liegen. Das
  ist die von A-A-36 verlangte Richtung („im Zweifel bleibt es liegen") und der Tausch, den die
  Auflage bewußt macht: liegengebliebenes Material ist schlechter als nichts, gelöschtes Material
  mit Eigentümer ist unwiederbringlich.
* **R-E (klein, in fremder Hoheit).** Bis unit-tester die Stellen in `image-sweep.test.ts` und den
  einen Domänenfall nachzieht, ist `pnpm check` rot. Die Welle sollte nicht abgenommen werden,
  bevor das geschehen ist.
* **R-F (neu, klein, gewollt).** Die Domäne weist ab T-179 Pfade ab, die sie vorher angenommen hat
  — `.lnk`, `rechnung.lnk.`, `rechnung.lnk ` und ihre Verwandten. Für einen Benutzer ändert sich
  praktisch nichts: Die Hülle hat sie schon vorher nicht geöffnet, der Anhang war also von Anfang
  an nutzlos. Neu ist nur, daß er gar nicht erst entsteht und der Grund an der Tür genannt wird.
* **R-G (neu, klein, gewollt).** `fileExtensionOf` ist eine **öffentliche** Funktion der Domäne und
  ändert ihr Verhalten für `.bashrc` (jetzt `'bashrc'`) und für `datei.lnk ` (jetzt `'lnk'`).
  Gemessen: Außerhalb von `checkAttachmentPath` und den Prüffällen ruft sie heute niemand — die
  Oberfläche hat ihr eigenes `extensionOf` mit derselben Regel.
* **Keine Sicherheitsminderung.** Nichts wird gelockert, nichts geöffnet, kein Wert aus Bestand
  oder Eingabe wandert in eine Meldung oder ins Protokoll (A-A-8, B-2.4). Die Domäne bleibt rein.

---

## Offene Fragen

1. **Soll ein Nachweispfad die beiden Fassungen der Doppelpunktregel gegeneinander messen?** Der
   billigste Schnitt: ein Lauf, der `apps/desktop/src-tauri/src/attachment.rs` liest, die
   Reihenfolge in `check_file` und die Schlüssel aus `Rejection::key()` zieht und gegen
   `PathRejection` und die Schrittliste in `checkAttachmentPath` hält — nach dem Vorbild von
   `proof:shell-surface`. Nicht gebaut: Er bräuchte eine neue Datei unter
   `apps/local-api/scripts/` (meine Hoheit) **und** einen Eintrag in `package.json` plus die
   Aufnahme in `proof:all` (Orchestrator). Gewünschter Eintrag, falls beschlossen:
   `"proof:attachment-parity": "pnpm --filter @takt/local-api proof:attachment-parity"`.
2. **Die Oberfläche führt eine dritte Fassung der Doppelpunktregel.**
   `apps/web/src/lib/attachmentLabel.ts` hat ein privates `hasStreamSeparator(path)` über ihr
   eigenes `fileNameOf`. Seit heute gibt es `hasPathStreamSeparator` in `@takt/domain`, und die
   Datei holt sich `INDIRECT_EXTENSIONS` schon von dort — dieselbe Begründung trägt auch hier.
   Für frontend-dev. **Achtung:** Die Oberfläche arbeitet auf `ForeignText`, die Domäne auf
   `string`; die Umstellung darf die Herkunftsmarkierung nicht verlieren.
3. **Prüffälle, zwei Sorten, beide bei unit-tester.**
   (a) Die neue Türregel hat in `packages/domain/test/attachment.test.ts` und
   `apps/local-api/test/usecases/attachment-input-validation.test.ts` heute **keinen** Fall; die
   Tafel aus Teil 1 ist gemessen und unverändert übernehmbar. (b) Die 10 Stellen in
   `image-sweep.test.ts` samt den zwei neuen Fällen der Auflage; Zeile und Tafel stehen in Teil 2.
4. **Ein Fund am Rande, nicht mitgenommen.** `PATH_MESSAGE` sagt „ein **vorhandener** absoluter
   Pfad" — `checkAttachmentPath` prüft die Existenz ausdrücklich **nicht** (sie liegt in der
   Hülle). Der Satz verspricht eine Prüfung, die an dieser Stelle nicht stattfindet. Älter als
   diese Aufgabe, freigegeben, unangetastet; für spec-ux-reviewer.
5. **Warum stand die Abweichung aus T-179 B-1 zehn Wellen lang unbemerkt?** Nicht, weil niemand
   hinsah, sondern weil **beide Seiten eigene Prüffälle hatten und beide grün waren**. Dieselbe
   Klasse wie T-176-6 (`foreseeableRefusalOf` und `check_file` sind „zufällig gleich sortiert") und
   dieselbe Antwort: A-A-35 verlangt dort einen Prüffall über eine **ausgeschriebene Fallliste**,
   in der die Erwartung der anderen Seite steht. Für die Endungs- und Doppelpunktregel zwischen
   **Domäne** und Hülle gibt es das noch nicht — das ist derselbe Vorschlag wie Punkt 1, und
   T-179 B-1 ist der Beleg, daß er sich lohnt. Ich habe ihn zum zweiten Mal nicht gebaut, weil er
   einen Eintrag in `package.json` braucht.
6. **Für security-checker, zur Wiedervorlage von A-A-36:** Der Riegel prüft die Menge der Arten,
   nicht die Frage, ob `knownImageTargets` für jede davon fragt. Der Übersetzungsriegel
   (`KIND_OWNS_IMAGE_FILE`, Annahme 5) schließt die Lücke für den ordentlichen Weg. Ob das genügt
   oder ob `knownImageTargets` selbst eine Art als Parameter bekommen sollte, ist eine Frage an
   den Prüfer und keine, die ich nebenbei entscheide.

---

## Nächster Schritt

Zuerst unit-tester: `imageCount` in die Vorrichtungen von `image-sweep.test.ts` eintragen
(15 Stellen) — solange sie stehen, ist `pnpm check` rot und die Welle nicht abnehmbar. Der
Domänenfall zu `.bashrc` ist schon nachgezogen. Dann die zwei neuen Fälle je Riegel, Tafeln in
Teil 2 und Teil 3.

Parallel die Wiedervorlage bei code-reviewer und security-checker. Der Blick, der zählt, geht auf
drei Stellen: den Absatz „zweiter Riegel" (hält er den nächsten Aufräumer auf?), die Zugabe
`KIND_OWNS_IMAGE_FILE` (richtige Bauart oder Übergriff?) und die Frage, ob die Domäne mit dem
Nachziehen aus Teil 3 nun **zu** streng ist — sie weist jetzt unter Linux Namen ab, die dort
gültig sind, und tut das aus einem Windows-Grund. Ich halte das für richtig (A-A-10: ein Zweig,
den nur ein Betriebssystem betritt, ist unmeßbar), aber es ist eine Produktentscheidung und nicht
meine.

Danach Frage 2 an frontend-dev, Fragen 1 und 5 als eine gemeinsame Aufgabe an den Orchestrator,
Frage 6 an security-checker bei der Wiedervorlage von A-A-36.
