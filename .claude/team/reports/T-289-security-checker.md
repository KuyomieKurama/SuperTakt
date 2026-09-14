# T-289 — der Wächter zum dritten Mal angegriffen: vier Hälften halten, drei Wege daran vorbei sind gemessen

Aufgabe: T-289 — Abnahme von T-288 (A-V-27), Beurteilung von Hälfte 4 als Grenze, Nachzug
`docs/bedrohungsmodell.md`
Status: **fertig** — Urteil **freigegeben**, mit einem Befund der Stufe „sollte", der die Freigabe
nicht aufhält

## Artefakte

| Datei | Was |
|---|---|
| `docs/bedrohungsmodell.md` **37.8** | **A-V-27 berichtigt**: „Drei Gegenproben" → **vier**, mit Marke, Datum und altem Wortlaut (A-A-70). Dazu die Aussage, die nicht in der Zahl steckt: Die vierte Hälfte hängt an keinem Namen des Werts und ist deshalb eine **andere Art von Zusage** — die drei davor sind an ihrem Gegenstand vollständig, die vierte ist es nicht. Zeiger auf das, was statt ihrer trägt (T-286-Verhaltensprüffall) und auf dessen Grenze |
| `docs/bedrohungsmodell.md` **Abschnitt 38** (neu) | Prüfung T-289: elf Meßdateien, Versuchsliste, drei gemessene Umgehungen, Beurteilung der Ordnergrenze mit zwei gemessenen falschen Rot, Abnahme von T-287-2/-3/-4, fünf Befunde, eine neue Auflage **A-V-28** |

Kein Produktivcode, keine Prüfdatei, kein fremdes Papier angefaßt. `proof-release-safety.mjs`,
`datenmodell.md`, `architektur.md` und die Beistelldatei sind **gelesen und nicht geändert**;
Befunde daran stehen als T-289-1.

## Teil 1 — der Angriff: **ja, ich bin durchgekommen**, dreimal

Elf Meßdateien, jede für die Dauer **eines** Befehls im Baum und im selben Befehl entfernt;
`git status` danach ohne `messung-*`. Windows 11, Node 22.23.2. Ausgangsstand ohne Meßdatei:
**37 / 0** (35 vor T-288 — die Rechnung von domain-dev stimmt).

| Nr | Was | Wo | Ergebnis |
|---|---|---|---|
| V1 | `DataArchivePort.readAll()`, Schlüssel `['last','version','check','at'].join('_')` | Ordner des Prüfers | **grün 37/0** |
| **V1b** | dasselbe, und der Wert **entscheidet**: `jetzt − Date.parse(wert) >= bodenMs` | Ordner des Prüfers | **grün 37/0** |
| V2 | Helfer in `features/settings` mit `SELECT *`, Aufrufer im Ordner | beide | rot — aber am Aufrufer, der `prepare(` in der Typsignatur trug |
| **V2b** | derselbe Helfer, Aufrufer ohne jede Marke | beide | **grün 37/0** |
| **V11** | `SELECT *` in der flachen Datei `apps/local-api/src/…`, Positionszugriff, Saatwert in den Prüfer | flach + Ordner | **grün 37/0** |
| V3 | die Meßdatei aus T-287 wörtlich | Ordner | rot, vier Befunde aus zwei Hälften |
| V4 | `SELECT * FROM app_setting` | Ordner | rot, drei Befunde |
| V5 | nur die Zeichenkette `'last_version_check_at'` | `apps/web/src/lib/` | rot |
| V6 | `await s.lastCheckAt()` | Ordner | rot |
| V7 | Funktion **namens** `prepare(`, ohne Datenbank | Ordner | rot — falsches Rot |
| V8 | `UnitOfWork` als Signaturtyp für `skipped_version` | Ordner | rot — falsches Rot |

**V1b ist der Befund.** Er liegt **innerhalb** des Ordners, den Hälfte 4 bewacht, benutzt einen Port,
den es wirklich gibt, nennt die Spalte nicht, heißt nicht `lastCheckAt`, faßt keine Datenbank
unmittelbar an — und holt genau den Wert. `repo-data-archive.ts` führt `app_setting` mit allen
fünfzehn Spalten einschließlich `last_version_check_at`; das ist die Aufgabe dieses Ports (A-20.4),
keine Schwäche.

**Kein zweiter Wächter sieht ihn:** mit V1b im Baum `proof:layers` 36/0, `proof:callers` 74/0,
`proof:release-safety` 37/0.

Was das **nicht** ist: eine Aufhebung von T-288. V3 bis V6 sind rot, und V3 ist die Zeile, mit der
ich in T-287 durchgekommen bin. Was es **ist**: eine zu weit geschriebene Zusage. Der Satz „**Der
Prüfer erreicht den Bestand über seinen Port oder gar nicht**" steht dreimal — in der Begründung im
Quelltext, in der ausgegebenen Befundzeile und in `docs/architektur.md`. Gemessen ist „faßt keine
Datenbank **unmittelbar** an". Der Unterschied ist eine Zeile `import`.

## Teil 2 — Hälfte 4 als Grenze: **richtig gezogen, Preis richtig gewählt**

**Falsches Rot ist real, ich habe es zweimal ausgelöst.** V7 (eine Funktion, die `prepare(` heißt)
und V8 (`UnitOfWork` als Signaturtyp). **V8 ist die absehbare Arbeit und keine Erfindung:**
`skipped_version` steht nach A-18.10 im Bestand, gehört fachlich zur Versionsprüfung und liegt heute
nur deshalb woanders, weil sie über `GET`/`PATCH /settings` läuft. Wer sie eines Tages zum Merkmal
zieht, sieht ein Rot, das mit dem Rückweg nichts zu tun hat.

Trotzdem richtig, drei Gründe: (1) Die Asymmetrie stimmt — falsches Rot kostet eine Zeile in der
erlaubten Menge, falsches Grün einen stillen Ausschalter der einzigen Meldung, über die bei einem
unsignierten Erzeugnis eine Sicherheitsbehebung den Benutzer erreicht. (2) Das falsche Rot ist
**laut**: Pfad, Marke, Begründung, beim Bauen, und es erzwingt die Entscheidung dort, wo sie
hingehört (E-103). (3) Der Ordner ist klein und fachlich scharf — vier Dateien, sieben Importzeilen,
keine Fremdkante.

Zwei Einschränkungen, festgehalten, nicht als Auflage: Der Preis ist **nicht dort fällig, wo er
entsteht** — die Bestätigung eines falschen Rot ist eine Änderung in `proof-release-safety.mjs`
(domain-dev), der Anlaß liegt im Merkmal; das sind zwei Hoheiten und braucht eine Welle. Und
`UnitOfWork` altert von den fünf Marken am schlechtesten: Es ist ein **Typname** und trifft auch
Signaturen, die nichts ausführen.

**Was statt des Wächters trägt — und wo auch das aufhört.** Der Verhaltensprüffall aus T-286
(`apps/local-api/test/version/checker.test.ts`, „E-106 — ein Programmstart prüft immer einmal") ist
der bessere Träger, aber **kein vollständiger**: Er verdrahtet `store`. Käme ein Rückweg über eine
**neue, optionale** Naht (`createVersionChecker({ …, archive })`), setzte der Prüffall sie nicht,
der Leser liefe ins Leere, der Fall bliebe grün. Wäre die Naht verpflichtend, würde `typecheck` über
der Prüfdatei rot. Kein Vorwurf an T-286 — ein Prüffall kann nicht prüfen, was es nicht gibt —, aber
der Grund, weshalb mein Gegenmittel an der **Importmenge** ansetzt und nicht an noch einem Prüffall.

## Teil 3 — was im Papier steht

37.8 ist berichtigt (vier statt drei, mit altem Wortlaut daneben) **und um die Aussage ergänzt, die
nicht in der Zahl steckt**: Die ersten drei Gegenproben sagen „dieser Name kommt hier nicht vor" und
sind an ihrem Gegenstand vollständig; die vierte sagt „dieser Ordner faßt keine Datenbank an" und
ist an ihrem Gegenstand unvollständig. Wer sie liest, darf daraus nicht „über seinen Port oder gar
nicht" ableiten. Dazu steht dort, was der Wächter **nicht** fängt (Absicht mit Schreibrecht) und was
statt seiner trägt (T-286, mit dessen Grenze).

Abschnitt 38 trägt die Versuchsliste, die Beurteilung der Grenze, die Abnahme von T-287-2/-3/-4 und
fünf Befunde.

## Abnahme der Antwort T-288

- **T-287-2 erfüllt.** Die Zeile aus T-287 steht wörtlich als Gegenprobe (c) und ist rot.
- **T-287-3 erfüllt**, und genauer formuliert als mein Gegenmittel: nicht „Route ja oder nein",
  sondern „nur im vollständigen Abzug, den der Benutzer auslöst, nie als Auskunft über den Zustand
  der Versionsprüfung".
- **T-287-4 erfüllt.** Die Beistelldatei nennt zusätzlich, was an 0022 **gültig bleibt** — ohne
  diesen Zusatz läse sie sich wie eine Warnung vor der ganzen Migration. Nachgemessen:
  `proof:migrations` grün, 44 Dateien, Prüfsumme von 0022 unberührt.
- **Zahlen nachgerechnet**, alle stimmen: 35 → 37, 44 → 44.

## Befunde

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-289-1** | **sollte** | **Die Zusage von Hälfte 4 ist weiter geschrieben als gemessen.** „Der Prüfer erreicht den Bestand über seinen Port oder gar nicht" (in `proof-release-safety.mjs` als Begründung **und** als ausgegebene Befundzeile, in `docs/architektur.md` im Absatz „Warum vier und nicht zwei"). Gemessen: V1b/V2b/V11 bleiben grün. **Auswirkung:** über ein präpariertes Archiv ein stiller Ausschalter der Versionsprüfung; „sollte" statt „muss", weil die Gestalt Absicht verlangt. **Gegenmittel: A-V-28** — die **Importmenge** des Ordners messen (heute sieben Zeilen aus sechs Quellen, `@takt/storage` kommt nicht vor), beide Richtungen wie bei den vier Spaltendateien; Gegenprobe ist V1b. Dazu den Satz in beiden Dateien auf das Gemessene zurücknehmen | domain-dev |
| T-289-2 | Hinweis | Zwei falsche Rot gemessen (V7, V8). **Kein Handlungsbedarf** — der Preis ist richtig gewählt. Festgehalten, damit der nächste, der eines auslöst, nicht meint, er habe einen Wächterfehler gefunden. Nachsatz: Bestätigung und Anlaß liegen in zwei Hoheiten | Orchestrator (Ablauf) |
| T-289-3 | Hinweis | Der Verhaltensprüffall aus T-286 trägt die Zusage nur über **verdrahtete** Nähte; eine neue optionale Option bliebe grün | security-checker (erledigt, steht in 38.4) |
| T-289-4 | Hinweis, **sechste Meldung** | **R-23 und R-24 weiterhin nie bewertet**, beide „hoch". Empfehlung unverändert: R-23 vorziehen; billigste Frage zuerst — bleibt das Zertifikat nach einer Deinstallation im Wurzelspeicher stehen? | Auftraggeber, Orchestrator |
| T-289-5 | Hinweis | Semgrep und 42Crunch zum **siebten** Mal nicht verfügbar. Für diesen Auftrag ohne Gewicht, für die Lieferkette offen | Auftraggeber, Orchestrator |

## Annahmen

1. **Die elf Meßdateien lagen in fremder Hoheit**, jede für die Dauer eines Befehls, jede im selben
   Befehl entfernt. Anders ist ein Wächter nicht prüfbar; dieselbe Annahme wie in T-287.
2. **A-V-28 ist eine Auflage und kein Auftrag.** Ich habe sie so geschrieben, daß sie heute
   kostenlos ist (der Ordner importiert bereits nichts aus `@takt/storage`) — der Orchestrator
   entscheidet, ob und wann sie gebaut wird.
3. **Der Kopf des Papiers („Stand: T-156") bleibt unangetastet**, wie in T-287 begründet.
4. Nicht gemessen: `pnpm check` im ganzen (`contrast`, `verify:bundle`, `test:coverage`,
   `test:rust`, `build`, `audit`). Gemessen wurden `proof:release-safety`, `proof:layers`,
   `proof:callers`, `proof:migrations`.

## Risiken

1. **T-289-1 ist der einzige Befund mit Sicherheitsgewicht**, und er ist kleiner als T-287-2: Dort
   reichte eine Zeile aus Bequemlichkeit, hier braucht es Absicht und einen zusammengesetzten
   Schlüssel.
2. **R-23 und R-24 bleiben unbewertet**, beide „hoch". Sechste Meldung.
3. Semgrep und 42Crunch fehlen weiterhin; die Lieferkette ist unbelegt.

## Offene Fragen an den Orchestrator

- **A-V-28 in dieselbe Welle wie die Rücknahme des zu weiten Satzes?** Beides ist derselbe Griff in
  dieselbe Datei und zusammen kleiner als getrennt.
- **Der Satz in `docs/architektur.md`** („über seinen Port oder gar nicht") gehört domain-dev; ich
  habe ihn nicht angefaßt.
- R-23 vorziehen — unverändert seit T-287.

## Nächster Schritt

Ein Auftrag an domain-dev: A-V-28 bauen (fünfte Hälfte an `rueckweg`, Gegenprobe ist V1b aus 38.1)
und in derselben Runde die drei Vorkommen des zu weiten Satzes auf das Gemessene zurücknehmen.
Danach `pnpm check` einmal vollständig über alle neun Stufen.

**Urteil: freigegeben.**
