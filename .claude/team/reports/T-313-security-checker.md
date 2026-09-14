# T-313 — Wiedervorlage: die gebaute Anhangsfläche gegen die zwanzig Auflagen aus T-297

**Aufgabe:** T-313 — Sicherheitsprüfung **nach** dem Bau: drei neue Flächen (Aufräumlauf,
schreibendes Token, Speicherspitze), die zwanzig Auflagen A-A-78 bis A-A-97, der Nachbau der
`.eml`, und die überholte Zusage in `docs/bedrohungsmodell.md:9638`.

**Status:** fertig — **Urteil: Nacharbeit.**

**Artefakte:**

- `C:\Users\kyk\Documents\Repo\SuperTakt\docs\bedrohungsmodell.md` — neues **Kapitel 40**
  (40.1 bis 40.9), **8 Befunde T-313-1 bis T-313-8**, **4 neue Auflagen A-A-98 bis A-A-101**,
  Auflagentafel über alle zwanzig aus 39.9. Dazu **33.3 an Ort und Stelle berichtigt** (A-A-70).
- `C:\Users\kyk\Documents\Repo\SuperTakt\.claude\team\reports\T-313-security-checker.md`
- Sonst nichts. Kein `apps/**`, kein `packages/**`, kein `docs/spec.md`, kein `tests/**`,
  kein `risks.md`.

**Meßdateien:** lagen im Sitzungs-Scratchpad; der einzige Ableger im Baum war
`apps/local-api/scripts/t313-server.mjs` (ein HTTP-Aufsatz, damit `@hono/node-server` und
`@takt/*` auflösen). Er wurde in **demselben** Befehl wieder entfernt, in dem er lief; `git status`
danach: **kein `t313`-Rest**, geprüft nach jedem der beiden Läufe.

---

## Zusammenfassung

Die Fläche ist deutlich besser gebaut als die Vorlage, gegen die T-297 geschrieben wurde. Der
Nachbau der `.eml` habe ich mit **20 Angriffen gefahren — 0 Durchbrüche**; der Name auf der Platte
ist über **25 Angriffsnamen durch die echte Route** gemessen und in allen 25 Fällen erzeugt; die
Tür hängt am Anlegen; Herkunft und Nachbau stehen im Bestand, an der Zeile und in der Rückfrage.
**Elf der zwanzig Auflagen sind erfüllt, sechs sind an ihrer Messung offen, eine ist nicht erfüllt
(A-A-92), eine nicht geprüft (A-A-87), zwei gegenstandslos.**

Freigegeben wird trotzdem nicht, und der Grund ist **einer**. Seit E-111 gibt es einen Lauf, der
beim Start ohne Rückfrage Kundendaten löscht. Ich habe drei Wege gemessen, auf denen er Dateien
entfernt, **deren Zeile stehenbleibt** — zwei davon ohne außergewöhnliche Lage. Die vier
Sicherungen und der Widerspruchsriegel tragen genau den Fall, für den sie geschrieben wurden, und
keinen daneben.

Der Satz dazu: **Ich habe in T-297 die Klasse „geprüfter Name ≠ aufgelöster Name" an der
Anlegeseite unmöglich gemacht. Sie ist auf der Löschseite wiedergekommen — in einem Lauf, den es
damals nicht gab und den jemand gebaut hat, um eine meiner Auflagen zu erfüllen.**

---

## Fläche 1 — der Lauf, der löscht (40.1)

Aufbau: echter `createAttachmentBlobPort` auf frischem Anwendungsdatenverzeichnis, echte SQLite
über `openDatabase(':memory:')` mit `migrateToLatest`, echte Dateien über `storeEmailFile`, echte
Zeilen in `todo_attachment`, echter Lauf mit der Verdrahtung aus `main.ts:361-374`.

**Was hält (sieben Fälle):** Grundfall `{read:3, owned:2, removed:1}` · vierte Anhangsart →
`unknown_kinds` · werfendes `emailFileCount` → `unavailable` · **alle** Pfade abweichend →
`contradiction` · fremder Name `rechnung.pdf` → unsichtbar · Unterverzeichnis in erzeugter Form →
unsichtbar · **Hardlink auf ein Benutzerdokument → Link fällt, Opfer überlebt**.

**Was nicht hält — drei Wege, alle gemessen:**

- **T-313-1 (muß) — eine passende Zeile entwaffnet den Riegel für alle anderen.** Der
  Widerspruchsriegel steht hinter `if (known.size === 0)`. Zwei Dateien, zwei Zeilen, eine davon
  mit abweichender Pfadschreibweise: `{ read: 2, owned: 1, removed: 1 }` — Datei B **fort**,
  Zeile B steht. Dasselbe mit Schrägstrich statt Rückstrich. Der Vergleich ist ein zeichengleicher
  `IN` über einen Pfad auf einem Dateisystem, das Pfade nicht zeichengleich vergleicht. Solange
  **alle** abweichen, hält der Riegel; sobald **eine** paßt, fallen alle übrigen.
- **T-313-2 (muß) — `origin='user'` auf einer Zeile in diesem Ordner kostet die Datei.**
  `{ read: 2, owned: 0, removed: 2 }`, beide Dateien fort, beide Zeilen stehen.
  `knownEmailFileTargets` **und** `emailFileCount` fragen mit denselben zwei Bedingungen — deshalb
  kann der Riegel diesen Fall nicht sehen: Verliert eine Zeile `origin='email'`, verschwindet sie
  aus beiden zugleich, und null gegen null ist kein Widerspruch.
  Der Quelltextkommentar hat die Richtung **falsch herum** entschieden: *„in der anderen Richtung
  ohne `origin` … eine fremde löschte"* — ohne `origin` ist die Eigentümermenge **größer**, also
  wird **weniger** gelöscht. Die Bedingung, die Sicherheit schaffen sollte, ist die, die löscht.
  Erreichbar über `ON DELETE CASCADE`: zweiter, selbst eingetragener Dateianhang auf dieselbe
  Datei, Trägertodo gelöscht.
- **T-313-3 (sollte) — Migration 0023 zurück und wieder vor.** 2 Zeilen, 2 Dateien →
  `{read:2, owned:0, removed:2}` → 2 Zeilen, 0 Dateien. Der Rückweg sagt über sich selbst „das
  Aufräumen verliert seine Bedingung" — er verliert sie nicht, er behält sie und beantwortet sie
  mit „niemandem". `migrateDownTo` ruft im Erzeugnis **keine** Stelle (gemessen; nur zwei
  Prüfskripte, beide auf `mkdtemp`), deshalb **sollte** und nicht **muß**.

**Gegenmittel für alle drei: A-A-98** — den Eigentümer an der **Datei** fragen, nicht an ihrer
Herkunft: weiteste Bedingung, kein `origin`, kein `kind`, unempfindlich gegen die Schreibweise des
Pfades; und der Riegel darf nicht an `known.size === 0` hängen.

---

## Fläche 2 — das Token, das schreiben darf (40.2)

| Messung | Wert |
|---|---|
| Ein Ruf, 25 Dateien à 1,99 MB | **201**, 25 Dateien, 47,4 MB, **183 ms** |
| Zehn Rufe hintereinander | **453 MB in 2,8 s = 162 MB/s** |
| Hochgerechnet auf eine Stunde | **≈ 570 GB**, ≈ 18 000 Dateien, ≈ 720 Todos |

Keine Drosselung an dieser Route, keine Gesamtmenge, keine Zahl im Bestand. **Der Aufräumlauf
hilft hier ausdrücklich nicht:** Jede dieser Dateien hat eine Zeile, also einen Eigentümer, also
ist sie unantastbar — richtig so, und genau deshalb kein Ersatz für eine Grenze.

**Meine Beurteilung, ausdrücklich, mit beiden Hälften.** Wer das Token hat, ist ein Prozeß unter
demselben Benutzerkonto (VG-1) — und ein solcher Prozeß kann die Platte auch ohne Takt
vollschreiben. Was Takt hinzufügt, ist nicht die Fähigkeit, sondern die **Zurechnung**: Die Bytes
liegen unter dem Namen von SuperTakt, im Anwendungsdatenverzeichnis von SuperTakt, als Anhänge an
Todos von SuperTakt, und sie reisen in jeder Datensicherung nach A-20 mit. Dazu die unangenehme
Nebenwirkung: `takt.db`, `-wal` und `-shm` liegen im selben Verzeichnisbaum. **T-313-4, Schwere
„sollte", Gegenmittel A-A-99.**

**T-313-5 (muß) — die mittlere der drei Grenzen kann nicht feuern.** 48 MB Summengrenze gegen
64 MiB Rumpfgrenze, Base64 bläht um genau 4/3 auf. Fünf Anläufe über der Summengrenze, **alle
413**; ein Anlauf knapp darunter (47,7 MiB roh) → 201 mit 25 Dateien. `total_too_large` ist über
die Leitung **unerreichbar**. Zum Vergleich gemessen: `too_many` feuert (26 → eins, 30 → fünf),
`too_large` feuert (26-MiB-Datei → Todo entsteht, Datei nicht).

Das ist ein Verstoß gegen A-19.29 in genau dem Fall, für den A-19.30a geschrieben wurde: 413 auf
die ganze Anfrage, kein Todo, keine namentliche Meldung. **Gegenmittel A-A-100.**

---

## Fläche 3 — die Speicherspitze (40.3)

Echter HTTP-Dienst im eigenen Prozeß, RSS alle 5 ms abgetastet, Rumpf vom Elternprozeß gestreamt.

| Anfrage | Antwort | RSS-Spitze |
|---|---|---|
| Grundlinie | — | **96 MB** |
| 255 MiB **ohne Nachweis** | 401 | **96 MB** |
| 255 MiB mit **Add-in-Token** | 401 | **96 MB** |
| 300 MiB ohne Nachweis | 413 | **96 MB** |
| 64 MiB mit Sitzungsgeheimnis | 422 | 285 MB |
| **255 MiB mit Sitzungsgeheimnis** | 422 | **856 – 1128 MB** |
| 2 × 255 MiB gleichzeitig | 422 | **1379 MB** |
| 4 × 255 MiB gleichzeitig | 422 | **1818 MB** |

**Die Frage des code-reviewers ist beantwortet, und die Antwort entwarnt.** Daß die Rumpfgrenze
**vor** `authGuard` steht, kostet **keinen Speicher** — ein Rumpf ohne Nachweis wird nicht gelesen.
Was die Reihenfolge kostet, ist **eine Auskunft**: 70 MiB auf `POST /addin/todos` ohne Token → 413,
60 MiB auf dieselbe Route → 401. Ein Orakel über die Grenzklasse einer Route, kein Zugriff.
**T-313-6, Schwere niedrig. Ich empfehle, es so zu lassen** und die Auskunft zu benennen, statt sie
zu tauschen — der Tausch kostete die Zusage, daß ein Riesenrumpf vor jeder Arbeit fällt.

**Die 256 MiB sind mit dem Add-in-Token nicht erreichbar** (gemessen: 401). Sie hängen am
Sitzungsgeheimnis, und das reist über `stdin` zwischen Hülle und Sidecar. Der Satz aus dem Auftrag
— *„der Dienst ist für jeden Prozeß erreichbar"* — gilt für die **Adresse**, nicht für diese Route.

**Die Zahl, die in A-19.34 fehlt, ist nicht 256, sondern 3,3.** Die Spitze ist rund das
3,3-fache des zugelassenen Rumpfes (Bytes, Zeichenkette, JSON-Baum). Die Vorhersage von domain-dev
(934 MB) liegt innerhalb meiner Meßspanne. **T-313-7 (sollte): an der teuersten Route steht keine
Gleichzeitigkeitsgrenze** — vier parallele Einspielungen erreichen 1,8 GB, und eine Einspielung
ist ein Vorgang, den es fachlich nur einmal gibt (`replaceAll`). **Gegenmittel A-A-101.**

---

## Der Nachbau der `.eml` — der code-reviewer hat recht, und jetzt ist es gefahren (40.4)

`buildRebuiltEml` direkt gerufen, Base64 dekodiert, Kopf vom Rumpf getrennt, je Fall gemessen:
Kopfzeilennamen gegen die neun eigenen, `multipart` im Kopf, `boundary` im Kopf, jede Rumpfzeile
gegen das Base64-Alphabet, jede Kopfzeile gegen druckbares ASCII.

**20 Angriffe, 0 Durchbrüche.** Darunter ein Betreff mit vollständigem `multipart/mixed` samt
`Content-Disposition: attachment; filename="pwn.exe"`; `CR` allein; `LF` allein; Anzeigename mit
`CRLF`; Adresse mit `>`, `<`, `,`, `;`; Adresse mit Zeilenvorschub (die `$`-Falle); Rumpf, der wie
Kopfzeilen samt Trennmarke aussieht; Betreff mit rohem `?=` und `=?UTF-8?B?`; 250 Emoji; `NUL`
und `0x7f`. Ein einziger Fall abgelehnt: `body === null` — der gewollte.

**Ich bestätige R-28 als strukturell geschlossen, und ich nehme A-A-96 an einer Stelle zurück.**
A-A-96 verlangte, die Trennmarke zu **erzeugen**. Gebaut ist etwas Stärkeres: **keine**. Eine
Marke, die es nicht gibt, kann nicht erraten werden. Die erzeugte Marke wird erst dann wieder zur
Auflage, wenn jemand einen zweiten Teil einführt.

**T-313-8 (sollte) — die einzige gemessene Schwäche ist keine Einschleusung, sondern eine Zeile.**
`Subject` faltet korrekt (längste physische Zeile **81 Zeichen**, ob der Betreff 50 oder 4000
Zeichen hat). `From`/`To`/`Cc` falten nicht: 400-Zeichen-Name → 667, 800 → 1316, 20 Empfänger →
1212, 200 Empfänger → 12292. Schwelle rund **17 Empfänger** oder **500 Zeichen Anzeigename**,
RFC 5322 setzt 998. Sicherheitlich zählt daran: Eine Zeile über 998 Zeichen ist der klassische
Boden für **Auseinanderlaufen zwischen Lesern**, und das bei einer Datei, die als Beleg
weitergereicht wird.

---

## Die zwanzig Auflagen — kurz (vollständig mit Meßpunkt in 40.5)

| | Auflagen |
|---|---|
| **erfüllt (11)** | A-A-78 (Hauptrichtung), A-A-82, A-A-83, A-A-84, A-A-85, A-A-86, A-A-89′, A-A-90, A-A-91′, A-A-94, A-A-96, A-A-97 |
| **halb — Wirkung da, Messung offen (6)** | A-A-78 (Gegenprobe Anzeigename), A-A-79 (Symlink-Prüffall fehlt), A-A-81 (Summengrenze unerreichbar), A-A-88 (kein eigener Nachweislauf), A-A-93 (Aufgabenbereich unbewacht) |
| **nicht erfüllt (1)** | **A-A-92** — null Deinstallationspfad für `Cert:\CurrentUser\Root`, null Löschen von `taskpane-key.pem`. Zweimal gemessen (T-297, T-313), zweimal null. Termin „vor der Auslieferung" nicht abgelaufen |
| **nicht geprüft (1)** | **A-A-87** — Cloud-Verweis nennt seinen Wirt. Nicht gemessen, Zeit ging in 40.1 |
| **gegenstandslos (2)** | A-A-80 (Ersatz für A-A-78), A-A-95 (Zwischenweg nicht gebaut) |

Keine der sechs halben ist an ihrer **Wirkung** offen — alle sechs an ihrer **Messung**. Das ist
der bessere Zustand und derselbe Fehler, den das Papier seit Kapitel 30 zählt.

---

## `docs/bedrohungsmodell.md:9638` — berichtigt, und der Rest gezählt

Der Absatz behauptete, `docs/glossar.md` und `Attachments.tsx:82` sagten *„weiterhin richtig, daß
über das Add-in keine Anhänge entstehen"*. Beide Hälften sind heute falsch. Nachgemessen:

- `apps/web/src/features/todos/Attachments.tsx:75-80` ist in T-302 **berichtigt** und sagt heute
  das Richtige.
- `docs/glossar.md` trägt die überholte Zusage **weiterhin und an drei Stellen** (Frist, Anhang,
  Begriffstafel). Sie gehört **documenter** und ist nicht meine Datei.

Berichtigt nach A-A-70 an Ort und Stelle, mit Datum und Meßbefehl. Die Regel, die ich daraus in
das Papier geschrieben habe: **Wer in diesem Papier eine Aussage über eine Zeile in einem anderen
Bestand schreibt, schreibt Datum und Meßbefehl daneben, oder er schreibt sie nicht.** Meine war
undatiert und an keine Zahl gebunden — deshalb hat eine Entscheidung sechs Wochen später sie
umgedreht, ohne daß jemand es sah.

---

## Was ich nicht bewerten kann (vollständig in 40.7)

1. **Office.js — unverändert der größte blinde Fleck.** Ob `getAsFileAsync` wirklich EML liefert,
   in welcher Kodierung, ob `isSetSupported('Mailbox','1.14')` auf einem echten Wirt das Erwartete
   sagt, ob `attachments[].size` angekündigt oder wirklich ist, was Outlook beim Öffnen einer
   nachgebauten `.eml` **tatsächlich** anzeigt: alles ungemessen. Es braucht Windows **mit**
   Outlook und einem eingerichteten Aufgabenbereich. **Meine Bewertung des Nachbaus mißt, was wir
   erzeugen — nicht, was Outlook damit tut.** Das ist die größere Hälfte.
2. **Semgrep und 42Crunch — zum vierten Mal nicht verfügbar.** `semgrep` in keinem Pfad, keine
   42Crunch-CLI. Das Sicherheitstor aus Abschnitt 8 ist **nicht** vollständig gefahren; zuletzt
   war es das in T-183. Die OpenAPI-Beschreibung existiert und wäre zum ersten Mal ein lohnendes
   Ziel (336 074 Bytes, Stand heute 01:40). Ersatz waren Mustersuchen von Hand — die finden,
   wonach ich suche, und nichts sonst.
3. **A-A-87** — nicht gemessen.
4. **Der Symlink im E-Mail-Verzeichnis** — auf diesem Rechner nicht fahrbar (`EPERM`, Windows
   verlangt Administrator oder Entwicklermodus). Auf POSIX filtert `entry.isFile()` ihn heraus:
   **gelesen, nicht gemessen**. Der Hardlink ist gemessen und harmlos.
5. **macOS und Linux** — alle Messungen liefen auf Windows 11.
6. **Der volle Datenträger** — 570 GB/h ist eine Hochrechnung aus 2,8 Sekunden. `SQLITE_FULL` im
   `-wal`-Umlauf ist nicht gefahren.
7. **Die Kette unter Last** — fünfzig gleichzeitig offene 255-MiB-Ströme ohne Nachweis: ungemessen.
8. **`sweepOrphanedImages`** — derselbe Bauplan seit T-176. Ob er dieselben drei Löcher hat, habe
   ich **nicht** gemessen. Er fragt an einem Namen statt an einem Pfad, also fällt T-313-1 dort
   vermutlich aus — und „vermutlich" ist genau das Wort, das hier nichts verloren hat. Steht als
   offener Punkt in A-A-98.

---

## Für `risks.md` — zum Eintragen (deine Datei)

1. **R-21 — hoch, Einstufung unverändert, Begründung zu erweitern.** Nachzutragen: Die Bytes einer
   fremden E-Mail liegen jetzt im Anwendungsdatenverzeichnis, mit erzeugtem Namen (gemessen) und
   `0600`/`0700` (gemessen). **Neu:** Aus ihnen wird beim Aufräumen ein **Löschziel**, und ein
   Fehler in dieser Richtung ist nicht wiedergutzumachen (T-313-1 bis T-313-3).
2. **R-23 — hoch, unverschoben, Text heute nachweislich zu optimistisch.** A-A-92 ist **nicht**
   gebaut; zweite Messung am 2026-09-12, Ergebnis identisch zu T-297: null. Nachzutragen: Datum
   der zweiten Messung und der Termin „vor der Auslieferung".
3. **R-24 — hoch, Beschreibung weiter zu eng, plus eine neue Hälfte.** Die drei Unterschiede aus
   T-297 gelten. **Neu:** Die fremde Datei bekommt eine zweite Karriere als Gegenstand eines Laufs,
   der beim Start löscht. R-24 handelte vom Hereinkommen; ab heute auch vom Verschwinden.
4. **R-27 — mittel, der Träger hat gewechselt.** `apps/web` gebaut **und** bewacht
   (`proof:clamp`); Aufgabenbereich gebaut und **nicht** bewacht; die Kürzung im Bestand ist
   gemessen richtig (Mitte, Marke, Endung erhalten). R-27 bleibt offen, steht aber nur noch auf
   einem Bein — das gehört in den Text.
5. **R-28 — herabzustufen, nicht zu schließen.** 20 gefahrene Angriffe, 0 Durchbrüche. Der Kern
   („dieser Bestand erzeugt ein Format, das ein anderes Programm interpretiert") bleibt wahr für
   jede künftige Erweiterung. **Vorschlag: hoch → niedrig**, mit dem Satz daneben, daß die
   Einstufung an **einer** Bauentscheidung hängt (kein `multipart`) und mit ihr zurückkommt.
6. **Eine neue Nummer ist fällig: R-29 — „Der Lauf, der löscht", Einstufung hoch.** Dieser Bestand
   hat einen Weg, der **ohne Klick Kundendaten entfernt**, und er entscheidet das an einer
   Zeichenkette aus dem Bestand. Drei Wege daran vorbei sind gemessen. Kein Fall von R-21 (dort:
   Hereinkommen), keiner von R-24 (dort: die fremde Datei als Quelle). Schaden: Datenverlust ohne
   Wiederherstellung und ohne Spur außer einer Zahl im Protokoll. Gegenmittel A-A-98. **Offener
   Punkt im selben Eintrag:** `sweepOrphanedImages` hat dieselbe Bauart und ist ungemessen.
7. **Keine neue Nummer für die Speicherspitze.** Gemessen, hängt am Sitzungsgeheimnis und nicht am
   Add-in-Token, kostet keinen Datenverlust, Gegenmittel (A-A-101) ist eine Zeile. Ein
   Risikoeintrag dafür wäre eine Gewohnheit im Sinne des Schlußsatzes von Kapitel 39.

---

## Annahmen

- **A-A-96 ist an einer Stelle zurückgenommen** (erzeugte Trennmarke → keine Trennmarke). Das habe
  ich entschieden, ohne zu fragen, weil die gebaute Lösung die strengere ist und die Auflage sonst
  einen Bau verlangte, der die Angriffsfläche vergrößert.
- **Die beiden Abweichungen am Anzeigenamen sind richtig, nicht Befunde.** Die Kürzung auf 255 ist
  in der Mitte, mit Marke, Endung erhalten (gemessen) — das ist A-A-93 korrekt angewandt.
- **T-313-3 ist „sollte" und nicht „muß"**, weil `migrateDownTo` im Erzeugnis von keiner Stelle
  gerufen wird (gemessen). Die Behebung ist dieselbe wie für T-313-2, also kostet die Einstufung
  nichts.
- **Die Reihenfolge Rumpfgrenze vor `authGuard` bleibt.** Ich habe gemessen, daß sie nichts kostet,
  und empfehle ausdrücklich, sie **nicht** zu tauschen.

## Risiken dieser Prüfung selbst

- Alles auf Windows 11, Node 22.23.2, einem Rechner, einer SSD. Die Durchsatzzahl aus 40.2 und die
  Speicherzahlen aus 40.3 sind maschinenabhängig; die **Verhältnisse** (Faktor 3,3, keine
  Gleichzeitigkeitsgrenze) sind es nicht.
- Kein Semgrep, kein 42Crunch. Was ich nicht gesucht habe, habe ich nicht gefunden.
- Der Aufräumlauf ist mit **elf** Fällen angegriffen, nicht mit fünfundzwanzig. Ich halte die
  Klasse für abgedeckt, nicht die Menge.

## Offene Fragen an den Orchestrator

1. **A-A-100: welche der beiden Zahlen wandert?** Rumpfgrenze hoch (64 → 72 MiB) oder Summengrenze
   runter (48 → 40 MB)? Das ist eine Produktfrage — die erste kostet Speicher, die zweite kostet
   Anhänge. Ich lege beides hin und empfehle nicht.
2. **A-A-99: welche Bauart für die Grenze über die Zeit?** Gesamtmenge im Bestand, Drosselung an
   der Route, oder Deckel je Tag. **Daß** es eine gibt, ist keine Frage.
3. **Wird `sweepOrphanedImages` im selben Auftrag mitgemessen?** Ich empfehle ja — es kostet
   dieselben drei Prüffälle in einer zweiten Ausführung, und die Alternative ist, daß ein zweiter
   löschender Lauf ungeprüft bleibt, weil der erste geprüft wurde.
4. **A-A-87 bleibt unbewertet.** Soll es in die nächste Welle, oder trage ich es nach?

## Nächster Schritt

1. **domain-dev: A-A-98**, mit den drei Gegenproben aus 40.1 — jede davon ist heute rot, also ist
   jede davon ein Nachweis und keine Zusicherung. Dazu der berichtigte Satz im Kommentar von
   `knownEmailFileTargets` und im Rückweg von Migration 0023.
2. **Orchestrator/Auftraggeber: A-A-100**, Entscheidung nach offener Frage 1, im selben Auftrag.
3. **Nächste Welle:** A-A-99, A-A-101, die sechs halben Auflagen aus 40.5 mit Termin, A-A-87.
4. **documenter:** die drei Stellen in `docs/glossar.md`.
5. **Orchestrator:** R-21, R-23, R-24, R-27 nachziehen, R-28 herabstufen, **R-29 anlegen**.

---

**Nicht freigegeben — Nacharbeit. Freigegeben, sobald A-A-98 gebaut und mit den drei Gegenproben
aus 40.1 gemessen ist, und A-A-100 im selben Auftrag steht; alles Übrige darf in die nächste
Welle, A-A-92 bleibt auf „vor der Auslieferung".**
