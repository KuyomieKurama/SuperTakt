# T-301 — Die Bytes reisen mit, und die Gründeliste wird eine

Aufgabe: T-301 — A-19.34 (Datensicherung trägt die übernommenen Dateien), Archivfassung 5 → 6,
Einspielgrenze messen, Gründeliste zusammenführen, `docs/datenmodell.md` nachziehen.

Status: **braucht Review** — gebaut, gemessen, `pnpm check` bis auf **eine** Zusicherung in einer
fremden Datei grün (siehe „Offene Fragen" 1).

## Artefakte

**Geändert**

- `packages/domain/src/email-attachment.ts` — `rebuild_rejected` aufgenommen, `mailbox_closed`
  gestrichen, die Zusammenführung ausgeschrieben
- `packages/storage/src/ports.ts` — drei Methoden am `AttachmentBlobPort`
  (`readEmailFile`, `restoreEmailFile`, `emailFilePathOf`), neuer Vorrat `EmailFileReadFailure`
- `apps/local-api/src/access/attachment-store.ts` — die drei Methoden umgesetzt
- `apps/local-api/src/features/data-transfer/data-transfer.ts` — Fassung 6, `data.files`,
  Pfadumschreibung beim Einspielen, fünf neue Warnungen, `archiveOversizeWarning`
- `apps/local-api/src/features/data-transfer/foreign.ts` — eine Zeile (`files: 0`)
- `apps/local-api/src/config.ts` — `DATA_ARCHIVE_MAX_BODY_BYTES` = 256 MiB, neu und getrennt
- `apps/local-api/src/app.ts` — die Grenze an `POST /data-transfer/archive` statt am Präfix
- `apps/local-api/src/features/todos/email-attachments.ts` — eine Zeile Prosa (Gründe)
- `apps/local-api/openapi/takt-local-api.yaml` — `ArchivedFile`, `schemaVersion: 6`,
  `data.files`, `DataImportSummary.files`, beide Beschreibungen der Archivroute
- `docs/datenmodell.md` — **neuer Abschnitt 10** „Das Datenarchiv — die Fassungen 1 bis 6"
- `docs/architektur.md` — 5.6b ergänzt, **neuer Abschnitt 5.6c**

## Zusammenfassung

Das Archiv trägt ab Fassung 6 die aus E-Mails übernommenen Dateien **samt Bytes** (`data.files`,
Name und Base64, kein `mediaType` — A-A-88). Der eigentliche Inhalt von A-19.34 steckt aber nicht
in den Bytes, sondern im **Pfad**: `todo_attachment.target` führt für eine solche Datei den vollen
Pfad, im Archiv also den des Quellrechners. Das Einspielen setzt ihn deshalb neu, **vor**
`replaceAll`, aus dem Namen im Archiv und dem hiesigen Ordner — und **auch dann, wenn die Bytes
fehlen**, denn ein fremder Pfad in der Rückfrage vor dem Öffnen wäre eine Ortsangabe über einen
anderen Rechner. Gelesen wird über denselben Rückweg, über den auch gelöscht wird; ohne ihn wäre
die Datensicherung ein Lesewerkzeug für jede Datei, die der Benutzer lesen darf. Die
Einspielgrenze steigt von 64 MB auf 256 MiB, gemessen und nicht geschätzt, und hängt jetzt an
genau einer Methode auf genau einem Pfad statt am Präfix `/data-transfer`. Die Gründeliste der
Domäne hat `rebuild_rejected` aufgenommen und `mailbox_closed` verloren.

---

## 1. Was ein Archiv der Fassungen 1 bis 5 nach dieser Änderung erlebt — je Fassung ein Satz

Ausdrücklich verlangt, und die Antwort steht wörtlich so auch im Code (`parseArchive`) und in
`datenmodell.md` 10.4:

| Fassung | Beim Einspielen |
|---|---|
| **1** | Wird gelesen; Darstellung, Leistungsfrage, Inaktivität und `timer_idle` kommen aus den Vorgaben, und es kann **keine** Zeile geben, der eine Datei fehlt — in dieser Fassung konnte ein E-Mail-Anhang gar nicht entstehen. |
| **2** | Wie 1, nur daß Darstellung und Zeilendichte aus dem Archiv kommen; weiterhin keine Zeile, der eine Datei fehlen könnte. |
| **3** | Wie 2, zusätzlich mit der Leistungsfrage aus dem Archiv; weiterhin keine. |
| **4** | Wie 3, zusätzlich mit der Inaktivitätserkennung aus dem Archiv; `timer_idle` kommt hier zum ersten Mal aus dem Archiv statt aus der Vorgabe; weiterhin keine. |
| **5** | **Die einzige Fassung, bei der etwas fehlen kann**: Sie kann Zeilen mit `origin = 'email'` tragen (die vier Spalten aus 0023 kamen ohne Fassungssprung), aber nie die Bytes — die Anhänge entstehen wieder, ihre Pfade zeigen auf **diesen** Rechner, die Dateien nur, wenn sie ohnehin hier liegen, und was fehlt, steht als Zahl in den Warnungen (A-19.15, nicht still). |

Dazu, weil die Gegenrichtung genauso zählt: Ein Archiv der **Fassung 6** weist eine ältere
Anwendung ab (sie liest 1 bis 5) — und das ist die richtige Richtung, denn sie würde die Dateibytes
wegwerfen und Anhänge ohne sie einspielen.

**Fassung 6 braucht keine Migration, und das ist kein Versehen.** Der Sprung ist eine Änderung am
**Archivformat**, nicht am Schema: Die vier Spalten aus 0023 (`origin`, `origin_sender`,
`display_name`, `rebuilt`) stehen bereits, und `data.files` ist eine Liste im JSON, keine Tabelle.
Es gibt also **nichts vorzuschlagen und nichts zu registrieren**; Migration 0023 bleibt die
höchste. Wäre es andersherum, stünde hier eine Nummer und kein Satz.

**Der Fehler, der beim Heben der Fassungsnummer beinahe stehengeblieben wäre**, liegt genau in der
alten Richtung, vor der die Warnung stand: In `parseArchive` stand
`if (schemaVersion !== 5) idle_keep_timer_running = 1`. Das war richtig, solange 5 die höchste
Fassung war. Mit der 6 hätte es die Einstellung in einem Archiv **überschrieben**, das sie
ordentlich führt — der Benutzer bekäme nach dem Einspielen eine Einstellung zurück, die er nie
gesetzt hat. Jeder Fassungsvergleich in dieser Schleife steht jetzt als `<` oder `<=`, nie als
`!==`, und der Grund steht daneben.

---

## 2. Die Einspielgrenze — gemessen, mit Zahlen

### Was heute wirklich möglich war

`DATA_TRANSFER_MAX_BODY_BYTES` stand auf 64 MB. Mit mitreisenden Dateien ist das **zu klein für
seinen eigenen Gegenstand**, und zwar messbar:

- Eine Datei darf 25 MiB haben (`MAX_EMAIL_ATTACHMENT_BYTES`), base64 also 33,3 MB. **Zwei**
  solche Dateien im ganzen Bestand ergaben ein Archiv, das sich nicht mehr einspielen ließ.
- Das galt **schon vorher** und unabhängig von A-19.34: **sechs** Bildkopien à 8 MiB
  (`MAX_ATTACHMENT_IMAGE_BYTES`) reißen 64 MB. Das Archiv kannte für Bilder nie eine
  Mengengrenze außer 10 000 Einträgen.

Ein Archiv, das die Anwendung selbst erzeugt und danach nicht wieder annimmt, bricht A-20.4.

### Die Messung

Gemessen am 2026-09-11 auf dem Zielsystem (Windows 11, 8 GB, Node 22.23.2) über die Kette, die
eine Anfrage wirklich durchläuft — Rumpf als Buffer, `request.text()`, `JSON.parse`,
`Buffer.from(base64)` je Datei:

| Rumpf | Nutzlast | Spitze RSS | Spitze Halde | Dauer |
|---|---|---|---|---|
| 66,7 MB | 50 MB | 333 MB | 137 MB | 108 ms |
| 133,3 MB | 100 MB | 533 MB | 271 MB | 203 ms |
| **266,7 MB** | **200 MB** | **934 MB** | **537 MB** | **455 ms** |
| 400,0 MB | 300 MB | 1 333 MB | 804 MB | 731 ms |
| 500,0 MB | 375 MB | 1 684 MB | 1 004 MB | 876 ms |

### Der Vorschlag und seine Begründung: **256 MiB**

1. **Die harte Wand liegt bei 512 MiB, und sie gehört nicht uns.** V8 setzt
   `buffer.constants.MAX_STRING_LENGTH` auf **536 870 888** Zeichen (gemessen). Ein Rumpf darüber
   läßt `request.json()` **werfen**; `readJson` fängt den Wurf und macht daraus ein 422 mit dem
   Satz „kein unterstütztes Archiv" — eine Auskunft, die auf die falsche Ursache zeigt. Eine
   Rumpfgrenze **muß** unter dieser Wand liegen, damit statt dessen ein sauberes 413 mit Grund
   kommt. 256 MiB ist genau die Hälfte.
2. **Die Halde trägt es.** V8 gibt diesem 8-GB-Rechner 2 096 MB (gemessen). Bei 266,7 MB Rumpf
   stehen 537 MB darin — Faktor 3,9 Luft. Bei 500 MB sind es 1 004 MB: Es läuft, aber nur, solange
   sonst wenig läuft, und der Dienst liegt neben Outlook auf demselben Rechner. Eine Grenze, deren
   oberes Ende einen leeren Rechner braucht, ist keine.
3. **Die Zeit reicht.** 455 ms für Lesen, Zerlegen und Dekodieren gegen `REQUEST_TIMEOUT_MS` von
   15 s; der Weg über Loopback ist ein Bruchteil davon.

**Was das in der Sache heißt:** rund 192 MiB Nutzlast, also 7 Dateien der vollen Einzelgröße,
24 Bildkopien der vollen Größe oder — realistisch — einige hundert gewöhnliche Anhänge nebst dem
ganzen übrigen Bestand.

### Die Grenze hängt an der Anforderung, nicht am Präfix

`DATA_TRANSFER_MAX_BODY_BYTES` bleibt bei 64 MB und gilt weiter für die **Fremdimporte** (A-20.7,
Text ohne eingebettete Bytes). Neu daneben steht `DATA_ARCHIVE_MAX_BODY_BYTES` = 256 MiB für
**genau** `POST /api/v1/data-transfer/archive`. Das ist dieselbe Begründung, die in `app.ts` schon
für die Add-in-Route ausgeschrieben stand (E-099 Punkt 3): Eine Ausnahme, deren Menge an einem
Präfix aufgespannt ist statt an der Anforderung, wächst mit jeder Nachbarroute mit, ohne daß es
jemand entscheidet. Das `GET` auf denselben Pfad hat gar keinen Rumpf und bekommt sie nicht.

### Eine Zahl löst das nicht, und deshalb hängt eine zweite Maßnahme daran

Ein Bestand, der lange genug wächst, reißt jede feste Grenze. **Die Sicherung sagt es deshalb,
wenn sie größer wird, als das Einspielen annimmt** — mit beiden Zahlen, als Satz in `warnings`
(`archiveOversizeWarning`). Gerechnet wird über die Länge der eingebetteten Base64-Ketten; das ist
eine **untere Schranke** für den Rumpf (Base64 braucht in JSON keine Maskierung), also kann die
Warnung nicht falsch alarmieren. Sie kann schweigen, wo es knapp wird — dann spricht die Tür des
Einspielens mit einem 413. Der schlechteste Zeitpunkt, von einem unbrauchbaren Archiv zu erfahren,
ist der Tag, an dem man es braucht.

---

## 3. Die Gründeliste — meine, mit den zwei entschiedenen Änderungen

`packages/domain/src/email-attachment.ts` ist die einzige Quelle. Acht Werte, unverändert in der
Zahl:

`too_large`, `not_released`, `timeout`, `rejected`, `connection`, `not_a_web_address`,
**`rebuild_rejected`** (neu), `outlook_too_old`. **`mailbox_closed` ist gestrichen.**

Beides steht mit Begründung in der Datei: `rebuild_rejected` ist seit E-109 der einzige Fall, in
dem die E-Mail selbst fehlt (der Nachbau nach A-A-96 kann sich weigern); `mailbox_closed` ist seit
E-109 unerreichbar, und ein Grund, der nicht eintreten kann, ist ein Satz, der das Gegenteil des
Bestands behauptet. `too_many` und `total_too_large` sind **nicht** übernommen, mit Begründung:
Die 26. Datei ist zu **viel**, nicht zu groß, und eine gerissene Summe läßt dem Benutzer dieselbe
Handlung wie eine zu große Einzeldatei.

**Die drei Grenzen sind bereits aus `@takt/domain` erreichbar** und brauchten nichts:
`MAX_EMAIL_ATTACHMENT_BYTES` (25 MiB), `MAX_EMAIL_ATTACHMENT_TOTAL_BYTES` (48 MiB),
`MAX_EMAIL_ATTACHMENT_COUNT` (25) stehen in `packages/domain/src/index.ts` per `export *`, und
`apps/outlook-addin/package.json` führt `@takt/domain` bereits als Abhängigkeit. Nachgesehen, nicht
angenommen.

---

## 4. Was ich gemessen habe

**Von Ende zu Ende, gegen echtes SQLite (`node:sqlite`, Node 22.23.2) und echtes Dateisystem, mit
zwei Anwendungsdatenverzeichnissen als zwei Rechner.** Alles unten ist gefahren, nicht gelesen.

| Fall | Ergebnis |
|---|---|
| Todo aus einer E-Mail: Nachricht (Nachbau), zwei Dateien (3 MiB PDF, PNG), ein Cloud-Verweis | 4 Anhänge, 3 Dateien auf der Platte |
| Sicherung | Fassung **6**, 3 Einträge in `data.files`, **4,00 MB** JSON bei 3 MB Nutzlast (das Verhältnis 4/3, an dem die Warnung rechnet) |
| Einspielen auf dem **zweiten** Rechner | 3 Dateien zurückgeschrieben, 3 auf der Platte, Bytes zeichengleich (3 145 728 B) |
| `target` danach | zeigt auf das **hiesige** Verzeichnis; **kein** Pfad des Quellrechners überlebt |
| `display_name`, `rebuilt` | unverändert (A-19.22b, A-19.23a) |
| dieselbe Sicherung als Fassung 5 (`data.files` entfernt) | gelesen, **0** Dateien geschrieben, Pfade zeigen trotzdem hierher, Warnung „3 der 3 … fehlen in dieser Sicherung und liegen auch nicht auf diesem Rechner" |
| Fassung 7, 0, `"6"` | abgewiesen |
| Fassung 5 **mit** `data.files` | abgewiesen — ein Archiv, das zwei Dinge behauptet, von denen eines nicht stimmt, wird nicht ausgelegt |
| Dateiname `../../takt.db`, `C:/Windows/x.dll` | abgewiesen |
| Base64 mit Leerraum, leerer Rumpf, doppelter Name | abgewiesen |
| Datei im Archiv, die keine Zeile nennt | **nicht** geschrieben (3 statt 4 Dateien), gemeldet |
| `target` von Hand auf eine fremde Datei gebogen, danach gesichert | die fremde Datei wandert **nicht** ins Archiv (`data.files` leer) und bleibt unberührt |
| `archiveOversizeWarning` | `null` bei 200 MiB und bei genau 256 MiB, Satz mit beiden Zahlen bei 300 MiB |

**`pnpm check`, vollständig gefahren:**

| Schritt | Ergebnis |
|---|---|
| `typecheck` | alle sieben Projekte **grün**, dazu `typecheck:test` und `typecheck:e2e` |
| `boundaries` | grün |
| `contrast` | grün |
| `proof:all` (21 Läufe) | **alle grün**, 0 fehlgeschlagen. Eigene Zahlen: `codepoints` 46, `openapi` 115, `callers` 74, `conflicts` 154, `tags` 45, `access` 109, `export` 98, `export-api` 72, `taskpane` 29, `foreign` 21, `surface` 27, `locked` 21, `addin-wiring` 9, `layers` 36, `route-policy` 44, `release-safety` 73, `shell-surface` 30, `template-fields` 32, `addin` 290 |
| `verify:bundle` | 19 bestanden, 0 fehlgeschlagen |
| `test:coverage` | **1 695 bestanden, 1 rot** (3 übersprungen) — die eine Zusicherung, siehe unten |
| `test:rust` | 68 bestanden, 0 rot |
| `build` | grün |
| `audit` | keine bekannten Schwachstellen |

---

## 5. Annahmen — was ich entschieden habe, ohne zu fragen

1. **256 MiB und nicht mehr.** Die Messung trägt bis 500 MB; ich habe die Hälfte der V8-Wand
   genommen, weil oberhalb davon die Halde eines 8-GB-Rechners knapp wird und der Fehlschlag dort
   kein 413 mehr ist, sondern ein irreführendes 422. Begründung ausgeschrieben an der Konstanten
   und in `datenmodell.md` 10.5.
2. **Zwei Konstanten statt einer.** `DATA_TRANSFER_MAX_BODY_BYTES` (64 MB, Fremdimporte) bleibt
   stehen und behält seinen Namen; neu daneben `DATA_ARCHIVE_MAX_BODY_BYTES`. Der Name der alten
   ist damit etwas weiter als ihr Gegenstand — eine Umbenennung hätte `CLAUDE.md` und
   Bedrohungsmodell mitgezogen und gehört nicht mir. **Meldung, kein Alleingang:** In `CLAUDE.md`
   steht „Der Rumpf des Archivs darf 64 MB (`DATA_TRANSFER_MAX_BODY_BYTES`) … die einzige Stelle,
   an der B-1.7 gelockert ist." Dieser Satz ist ab jetzt an zwei Stellen überholt und gehört dem
   Orchestrator — siehe „Offene Fragen" 2.
3. **Der Pfad wird auch ohne Bytes umgeschrieben.** Ein Archiv der Fassung 5 auf einem fremden
   Rechner hinterläßt sonst Anhänge, deren Rückfrage vor dem Öffnen einen Pfad auf **Annas**
   Rechner vorliest. Der hiesige Pfad mit fehlender Datei ist der ehrlichere Zustand und genau
   der, den A-19.15 anzeigt. Ein Name, den dieser Bestand nie erzeugt hätte, bleibt unangetastet
   und wird gezählt gemeldet.
4. **Umgeschrieben wird vor `replaceAll`, zurückgeschrieben danach.** Umgekehrt wäre das
   Umschreiben ein zweiter Schreibvorgang auf denselben Zeilen, und ein Abbruch dazwischen ließe
   einen Bestand zurück, dessen Anhänge auf einen fremden Rechner zeigen.
5. **Zurückgeschrieben wird nur, was eine Zeile nennt** (A-A-83). Ein Archiv mit Dateien ohne
   Anhang legte sonst Bytes im Anwendungsdatenverzeichnis ab, für die es von der ersten Sekunde an
   keinen Eigentümer gibt. „Das Aufräumen holt sie später" ist keine Antwort auf „sie wurden
   geschrieben".
6. **Ein Archiv der Fassungen 1 bis 5 mit `data.files` wird abgewiesen**, nicht stillschweigend
   übergangen. Es behauptet zwei Dinge, von denen eines nicht stimmt. Eine **leere** Liste ist
   zulässig; sie behauptet nichts (und nur deshalb überleben die vorhandenen Prüffälle, die eine
   Fassung 6 auf 4 oder 3 herunterstellen).
7. **`restoreEmailFile` überschreibt** (`.tmp` + `rename`), statt wie `storeEmailFile` mit `wx` zu
   scheitern. Ein Archiv vom selben Rechner nennt Namen, die dort schon liegen; `wx` machte den
   Regelfall zum Fehlschlag. Der Umweg über die Nachbardatei hält die Zusage, die `wx` dort hält:
   Ein Abbruch hinterläßt die **alte** Datei, nie eine halbe unter einem Namen, den eine Zeile
   nennt.
8. **`ArchivedFile` führt keinen `mediaType`.** Bei einem Bild wird die Kopfsignatur gemessen und
   gegen die Endung gehalten; hier gibt es nichts zu messen (A-A-88). Ein Feld, das niemand prüfen
   kann, wäre eine Behauptung über fremde Bytes.
9. **`emailFilePathOf` ist synchron.** Es ist die einzige Methode dieses Ports ohne
   Dateisystemzugriff — eine reine Rechnung von Name zu Pfad. Ein `Promise` hätte Symmetrie
   vorgetäuscht, wo keine Arbeit ist.
10. **`archiveOversizeWarning` ist ausgelagert und ausgeführt.** Sonst wäre die Schwelle nur mit
    einem Prüffall zu erreichen, der wirklich 256 MiB baut — und eine Zusage, deren Prüfung eine
    Viertelstunde kostet, wird nicht geprüft.
11. **`ImportSummary` bekam `files`**, und `foreign.ts` trägt dort `files: 0` mit einer Zeile
    Begründung: Aus einem Fremdbackup entstehen Verweise und Dateipfade (A-20.7), nie eine Datei,
    die SuperTakt selbst ablegt. Das ist eine Null mit Grund und kein „noch nicht gezählt".

---

## 6. Risiken

1. **Die Speicherspitze ist jetzt viermal so hoch, und das ist eine Sicherheitsfrage, keine
   Bequemlichkeit.** Ein lokaler Prozeß mit gültigem Token kann den Dienst mit **einer** Anfrage
   auf rund 934 MB RSS treiben (gemessen), vorher waren es 333 MB. Erfolgreiche Anfragen werden
   **nicht** ratenbegrenzt (`AUTH_FAILURE_*` gilt nur dem fehlgeschlagenen Nachweis), und der
   Speicher wird beim **Lesen des Rumpfs** verbraucht, also bevor irgendein Riegel im
   Anwendungsfall greifen könnte. Zwei bis drei gleichzeitige Anfragen reichen auf einem 8-GB-
   Rechner für einen Fehlschlag der Halde. Der Weg dahin ist VG-1 und damit bekannt; **neu ist
   die Höhe**, nicht die Tür. Ein Riegel „ein Einspielen zur Zeit" hülfe ausdrücklich **nicht** —
   der Rumpf ist gelesen, bevor der Anwendungsfall anläuft. Der strukturelle Ausweg wäre ein
   strömendes Einlesen statt `request.json()`; das ist eine eigene Aufgabe. **Für den
   security-checker.**
2. **Die Datensicherung ist ab jetzt die Fläche mit der größten Datenmenge im ganzen Erzeugnis** —
   und sie enthält Rechnungen, Verträge und ganze E-Mails im Klartext, base64 kodiert. Base64 ist
   keine Verschlüsselung; das stand schon vorher in der Datei und ist ab heute schwerer. Wer eine
   Sicherung auf einen USB-Stick legt, legt damit das Postfachmaterial des Kunden darauf.
3. **Der Weg von einer fremden E-Mail zur Datei auf der Platte hat eine zweite Tür bekommen.**
   Bisher schrieb nur `POST /addin/todos` in `email-attachments/`; jetzt auch
   `POST /data-transfer/archive`. Die Enge ist dieselbe (Name durch `ARCHIVED_FILE_NAME`, danach
   noch einmal durch `emailPathOf`, `0700`/`0600`, nur was eine Zeile nennt) und gemessen — aber
   es sind zwei Türen statt einer, und das gehört genannt.
4. **Die Warnung beim Sichern kann schweigen, wo es knapp wird.** Sie rechnet mit einer unteren
   Schranke (nur die Base64-Ketten, ohne Tabellen und Rahmen). Ein Archiv knapp unter 256 MiB
   Nutzlast, dessen Tabellen den Rumpf darüber schieben, wird beim Einspielen mit 413 abgewiesen,
   ohne daß die Sicherung vorher etwas gesagt hätte. Bewußt so: Ein Fehlalarm wäre schlimmer, und
   das 413 ist laut. Die genaue Zahl wäre nur durch eine zweite vollständige Serialisierung zu
   haben.
5. **`REQUEST_TIMEOUT_MS` bleibt bei 15 s** für eine Anfrage, die bis zu 256 MiB tragen darf.
   Gemessen sind 455 ms bei 266,7 MB für Lesen, Zerlegen und Dekodieren; der Weg über Loopback
   kommt dazu und ist auf einem sehr langsamen Rechner eine Zahl, die jemand einmal nachrechnen
   sollte. Ich habe sie nicht angefaßt, weil sie für **jede** Route gilt.
6. **Ein Archiv der Fassung 6 ist für ältere Anwendungen unlesbar.** Das ist gewollt und die
   richtige Richtung, aber es heißt: Wer eine Sicherung aus der neuen Fassung auf einem Rechner
   mit alter Fassung einspielen will, bekommt eine Abweisung und keinen Teilimport.

---

## 7. Offene Fragen an den Orchestrator

1. **Eine Zusicherung in einer fremden Datei ist rot, und ich darf sie nicht anfassen.**
   `apps/local-api/test/usecases/data-transfer.test.ts:295` lautet
   `expect(archive.schemaVersion).toBe(5);` und muß `toBe(6)` lauten. Eine Zeile, eine Zahl.
   Die Datei gehört unit-tester (`apps/*/test/**`). **Alles andere in `pnpm check` ist grün.**
   Die vier Prüffälle daneben, die eine Fassung 6 auf 4, 3, 2 oder 1 herunterstellen, laufen
   unverändert weiter — dafür ist eine leere `data.files`-Liste in alten Fassungen zulässig.
2. **`CLAUDE.md` ist an zwei Stellen überholt** (gehört dir, nicht mir):
   - „Der Rumpf des Archivs darf 64 MB (`DATA_TRANSFER_MAX_BODY_BYTES`) … die einzige Stelle, an
     der B-1.7 gelockert ist." — Es sind jetzt **drei** Stellen (Archiv 256 MiB, Fremdimporte
     64 MB, Add-in-Anlegen 64 MB), und die Archivgrenze heißt `DATA_ARCHIVE_MAX_BODY_BYTES`.
   - „**Der Code steht auf Fassung 5** (`DATA_ARCHIVE_VERSION`) … liest 1 bis 5 … die
     Spezifikation nennt in A-24.7 die Fassung 4 und kennt die 5 nicht." — Der Code steht jetzt
     auf **6** und liest 1 bis 6. Der Abstand zur Spezifikation ist damit **zwei** Fassungen; er
     war schon vorher offen und ist jetzt größer. Vorschlag: A-24.7 nennt keine Zahl mehr, sondern
     verweist auf `docs/datenmodell.md` Abschnitt 10 — eine Zahl an zwei Orten ist die Bauart, aus
     der dieser Abstand entstanden ist.
3. **Unit-tester braucht Fälle, die ich nicht schreiben darf.** In Vorschlagsform:
   `archiveOversizeWarning` an der Schwelle und knapp darunter; `parseArchive` gegen Fassung 7, 0,
   `"6"` und gegen Fassung 5 **mit** `data.files`; ein Dateiname `../../takt.db` und
   `C:/Windows/x.dll`; Base64 mit Leerraum; doppelter Name; ein Round-Trip über **zwei**
   Anwendungsdatenverzeichnisse mit Vergleich der Bytes und des umgeschriebenen `target`; ein
   Archiv der Fassung 5 auf **demselben** Rechner (es darf **keine** Warnung geben, weil die
   Dateien noch liegen) und auf einem **anderen** (es muß eine geben); eine Datei im Archiv, die
   keine Zeile nennt; ein `target`, das aus dem Ordner zeigt, gegen `readEmailFile`.
   Mein Meßskript deckt all das ab und liegt unter
   `…/scratchpad/a1934.mjs` — es ist ein Meßgerät und kein Prüffall, aber die Fälle sind daraus
   ablesbar.
4. **Für den security-checker, ausdrücklich:** Risiko 1 (Speicherspitze, kein Riegel möglich) und
   Risiko 3 (zweite Schreibtür in `email-attachments/`). Beides ist neu mit dieser Aufgabe und im
   Bedrohungsmodell noch nicht bewertet. `docs/bedrohungsmodell.md` gehört nicht mir.
5. **Für frontend-dev (nicht meine Dateien):** `ImportSummary` führt jetzt `files`, und die
   Sicherung kann bis zu fünf neue Warnsätze tragen. Die Fläche, die eine Sicherung einspielt,
   sollte die Warnungen zeigen — sie sind der einzige Ort, an dem „3 von 3 Dateien fehlen" steht.
   Eine Größenprüfung im Web habe ich gesucht und **keine** gefunden; falls eine entsteht, ist die
   Zahl `DATA_ARCHIVE_MAX_BODY_BYTES` und sie gehört gelesen, nicht abgeschrieben.
6. **Für integration-dev (nächste Welle, wie entschieden):** Die acht Gründe stehen in
   `packages/domain/src/email-attachment.ts`; `mailbox_closed` gibt es dort nicht mehr,
   `rebuild_rejected` neu. `apps/outlook-addin/src/attachments/model.ts` und `reasons.ts` bilden
   darauf ab. Der Kontextblock des Dienstes (`routes/addin/**`, nicht meins) soll nur noch
   „dieser Dienst nimmt Anhänge an" sagen; die drei Zahlen kommen aus `@takt/domain` und sind von
   dort bereits erreichbar (nachgesehen).

---

## 8. Nächster Schritt

Die eine Zusicherung in `data-transfer.test.ts` auf 6 setzen lassen (unit-tester, eine Zeile),
danach ist das Tor grün. Parallel: `CLAUDE.md` und A-24.7 nachziehen (Orchestrator), die neuen
Warnsätze in der Oberfläche anzeigen (frontend-dev), die beiden neuen Risiken bewerten
(security-checker), die Gründeliste im Aufgabenbereich auf die der Domäne abbilden
(integration-dev).
