Aufgabe: T-041 — Der Abgleich der Antwortgestalten; dazu die Tagesgrenze aus dem Code-Review,
die zwei Punkte aus T-042 und die drei aus T-046

Status: fertig

---

Artefakte:

Neu:

```
apps/local-api/scripts/schema-match.mjs       NEU (200) — hält einen Antwortrumpf gegen sein
                                              Schema. JSON-Schema-Teilmenge, streng, wirft bei
                                              Unbekanntem
apps/local-api/scripts/service-scenario.mjs   NEU (530) — baut den Dienst einmal im
                                              Arbeitsspeicher auf und fährt jede der 64
                                              Operationen an, Erfolg und Abweisung. 94 Aufrufe
packages/storage/test/calendar-day-boundary.test.ts
                                              NEU (190) — die Tagesgrenze in Ortszeit, mit fest
                                              eingesetzter Zone. 11 Prüfungen
```

Geändert:

```
apps/local-api/scripts/proof-openapi.mjs      sechs neue Abschnitte (21 → 45 Prüfungen):
                                              Selbstprobe des Vergleichers, Durchlauf,
                                              Statuscodes, Antwortrümpfe, Fehlerschlüssel,
                                              Beispiele und Fragezeichenparameter
apps/local-api/scripts/proof-export.mjs       Abschnitt 11: „beides oder keines" über 40 Runden,
                                              dazu die Sortierbarkeit der Kennungen (75 → 82)
apps/local-api/scripts/proof-template-fields.mjs
                                              zwei Prüfungen: der Lauf nennt dieselbe
                                              Feldangabe wie die Vorschau (28 → 30)
apps/local-api/openapi/takt-local-api.yaml    16 einzelne Abweichungen und 111 fehlende
                                              Kettenantworten behoben; TodoDetail neu;
                                              exportRunId, windowsUser, databasePath
apps/local-api/src/usecases/structure.ts      SettingsView um windowsUser und databasePath;
                                              listExportAudit nimmt einen Filter
apps/local-api/src/usecases/export.ts         runExport benutzt checkTemplateDefinition und
                                              behält damit die details (T-046 Punkt 1)
apps/local-api/src/usecases/export-catalog.ts die Vergleichsliste kommt aus dem Motor
                                              (EXPORT_CONDITION_OPERATORS, T-046 Punkt 2b)
apps/local-api/src/routes/export.ts           GET /export/audit filtert auf exportRunId
apps/local-api/src/routes/time.ts             fromDay/toDay sind CalendarDay
apps/local-api/src/composition.ts             der Ort des Bestands geht in den SystemPort
packages/domain/src/kernel.ts                 calendarDayBounds — der Ortstag in UTC-Grenzen
packages/storage/src/ports.ts                 ExportAuditFilter; SystemPort.databasePath;
                                              TimeEntryFilter.fromDay/toDay als CalendarDay
packages/storage/src/sqlite/repo-time.ts      date(started_at) raus, calendarDayBounds rein
packages/storage/src/sqlite/repo-export.ts    Sicherungspunkt um resetStatus und markNotBilled;
                                              audit() nimmt einen Filter
packages/storage/src/sqlite/ids.ts            uuidv7 mit Zähler (RFC 9562 6.2)
packages/storage/src/sqlite/clock.ts          createSystemPort nimmt den Datenbankpfad
packages/storage/src/sqlite/unit-of-work.ts   die Zeitzone erreicht den Zeitbuchungsport
package.json                                  proof:openapi in der check-Kette
docs/architektur.md                           Abschnitt 5 über den Antwortabgleich; 3.3a über
                                              den R-10-Befund; die Routentabelle
docs/datenmodell.md                           2.1 (Zähler), 2.2 (Ortstag), 5.5 (keine
                                              Gruppierung in SQL), 6.2 (Filter, Atomarität),
                                              8.4a (keine Migration für alte Vorlagen)
```

Nicht angefasst: `apps/web/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`,
`packages/export/**`, `tests/e2e/**`, `docs/bedrohungsmodell.md`, die Wurzeldateien außer
`package.json` für die `check`-Kette. `packages/*/test/**` mit **einer** Ausnahme, die der
Orchestrator ausdrücklich erteilt hat: die neue Datei `calendar-day-boundary.test.ts`, weil sich
die Tagesgrenze ohne Umstellung nicht prüfen lässt und die Umstellung ohne Prüfung nicht zu
belegen ist. Kein `git commit`.

---

Zusammenfassung:

**Die Zahlen zuerst, weil danach gefragt war.**

| | gefunden | behoben |
|---|---|---|
| Einzelne Abweichungen an der Beschreibung | 16 | 16 |
| Fehlende Kettenantworten (400/413/415) | 111 | 111 |
| Befunde am **Dienst**, nicht an der Beschreibung | 1 | 1 |

Die 111 sind ein Befund in 111 Ausprägungen: `400 token_in_url` stand an 4 von 64 Operationen,
`413` an 5 und `415` an 1 von 28 mit Rumpf. Sie hängen als Kette **vor** allen Routen, nicht an
einzelnen. Eine Kettenantwort, die an drei Routen steht und an einundsechzig nicht, liest sich
wie eine Aussage über die drei; deshalb sind sie systematisch ergänzt, und der Nachweispfad hält
sie ab jetzt an jeder Operation fest, die sie erzeugen kann.

**Die sechzehn einzelnen, und zwei davon hätten `undefined` ergeben.**

1. **`GET /todos/{todoId}` liefert `TodoDetail`, beschrieben war `Todo`.** Der Dienst gibt
   `{ todo, totalSeconds, openSeconds }`; wer `data.title` gelesen hätte, hätte `undefined`
   bekommen und keine Fehlermeldung, sondern eine leere Anzeige. Wörtlich die Schadensart, die
   T-022 an `GET /settings` und `POST /todos` von Hand gefunden hat — an einer dritten Route, die
   seither niemand angesehen hat. `apps/web/src/api/types.ts` führt den Typ `TodoDetail` seit
   T-022 richtig; die Beschreibung war die einzige, die es falsch sagte.
2. **`POST /timer/heartbeat` — zweimal falsch.** Beschrieben waren `204` für den Erfolg und
   `409 timer_not_running` für den Fall ohne laufenden Timer. Der Dienst antwortet mit `200` und
   `{ seenAt }`, und der zweite Fall ist ausdrücklich **kein Fehler**: `seenAt: null`, „nichts zu
   tun". Der Kommentar in `usecases/timer.ts` sagt das seit T-021. Das ist buchstäblich der
   `timer/start`-Fund aus T-039 noch einmal: eine Oberfläche, die gegen die Beschreibung baut,
   behandelt einen Fehlerfall, den es nicht gibt, und den echten nicht. `apps/web` ruft die Route
   mit `request<{ seenAt }>` auf, also gegen den Dienst — ein `204` hätte sie gebrochen.
3.–9. **Sieben Operationen liefern eine `Location`-Kopfzeile, ohne sie zu beschreiben**
   (`createTag`, `createTagFolder`, `createPool`, `createTodoStatus`, `createTimeEntry`,
   `createExportTemplate`, `runExport`). Zwei von neun hatten sie. Bei `runExport` ist der
   Unterschied nicht kosmetisch: Die Adresse zeigt auf den **Lauf**, nicht auf die geschriebene
   Datei; die steht als `filePath` im Rumpf.
10.–13. **Vier Fehlerschlüssel werden geliefert und kommen in der ganzen Datei nicht vor**
   (`not_found`, `tag_in_use`, `unsupported_media_type`, `payload_too_large`). Die Beschreibung
   sagt selbst, `error.code` sei „die einzige Größe, gegen die ein Aufrufer verzweigt" — ein
   Zweig, dessen Name nirgends steht, ist keiner.
14.–15. **Zwei Stellen mit `type: object` ohne ein einziges Feld** (`ExportTemplate.definition`,
   `ExportRun.templateSnapshot` — letzteres sogar ganz ohne `type`). Beides ist absichtlich
   offen, weil das Vorlagenformat dem Motor gehört. Nur: Ein `object` ohne Felder ist von einem
   vergessenen Feld nicht zu unterscheiden, und genau diese Ununterscheidbarkeit ist die Lücke,
   aus der T-022 und dieser Befund entstanden sind. Jetzt steht `additionalProperties: true` da —
   eine Aussage statt einer Auslassung.
16. **`POST /addin/todos`, die Call-Nummer.** Die Beschreibung führte den Befund aus T-039 als
   Absicht („die Plausibilität prüft diese Route bewusst nicht"). Der integration-dev hat die
   Prüfung in T-046 eingebaut; die Beschreibung sagte danach das Gegenteil des Verhaltens. Sie
   ist nachgezogen, und der Durchlauf fährt den Fall jetzt an: eine 74-stellige Nummer ergibt
   `422` mit `details[].field = "callNumber"`.

**Wie der Nachweispfad das findet.** `service-scenario.mjs` baut den Dienst **einmal** über
`compose` mit einer Datenbank im Arbeitsspeicher und einer gestellten Uhr auf, legt einen kleinen
festen Bestand an — ein Ordner, ein Tag, ein Pool, drei Todos, ein paar Buchungen, zwei Vorlagen,
drei Exportläufe — und fährt in 94 Aufrufen jede der 64 Operationen mindestens einmal an. Die
Anfragen tragen `Host`, `Origin` und Token, laufen also durch dieselbe Kette wie im Betrieb.

T-039 hatte vorgeschlagen, nur **Leserouten** anzufahren; Schreibrouten bräuchten je Route
gültige Eingaben, also im Kern eine zweite Prüfsuite. Das stimmt für eine Suite, die Verhalten
misst. Hier wird Gestalt gemessen, und dafür genügt ein Bestand, der aufeinander aufbaut. Es war
auch nötig: Zwei der drei bekannten Befunde saßen auf Schreibrouten.

`schema-match.mjs` hält jede Antwort gegen ihr Schema — `$ref`, `allOf` (zusammengezogen, sonst
wäre die Prüfung auf unbeschriebene Felder falsch), `oneOf`/`anyOf`, `type`, `const`, `enum`,
`properties`, `required`, `items`, `additionalProperties`. Drei Regeln: Ein beschriebenes
Pflichtfeld, das fehlt, ist eine Falschaussage; ein geliefertes Feld, das nicht beschrieben ist,
auch; eine Gestalt, die nicht passt, erst recht.

**Abschnitt 5 ist die wichtigste Ergänzung, und sie prüft nichts am Dienst.** Sie hält dem
Vergleicher sieben bekannte Abweichungen hin — den fehlenden Seitenumschlag aus T-029, die Liste
statt der Hülle aus T-022, ein unbeschriebenes Feld tief in einer Liste, ein fehlendes
Pflichtfeld tief in einer Liste, eine falsche Art, einen falschen festen Wert — und verlangt,
dass er jede findet und die gültige Antwort durchlässt. Ohne das wäre ein kaputter Vergleicher
grün, und diese ganze Aufgabe wäre umsonst gewesen. Es ist dieselbe Sorge, aus der T-039
Abschnitt 0 gebaut hat.

**Der Befund am Dienst, den nur der Durchlauf finden konnte.** Die Probe „kein Aufruf endet mit
5xx" wurde in etwa drei von vier Läufen grün und im vierten rot:
`POST /time-entries/{id}/not-billed` antwortete mit `500`. Die Ursache lag zwei Ebenen tiefer und
ist ein Abrechnungsfehler:

`trg_time_entry_exported_needs_provenance` (Migration 0006) sucht die jüngste Protokollzeile einer
Buchung mit `ORDER BY occurred_at DESC, id DESC`. Beide Teile tragen nicht. `occurred_at` hat
**Sekunden**auflösung — `Timestamp` schneidet die Millisekunden ab —, und `id` war eine UUIDv7,
deren zwölf Bit hinter der Version aus `crypto.randomBytes` kamen: Innerhalb einer Millisekunde
war die Reihenfolge zweier Kennungen ein Münzwurf, obwohl der Kopf von `ids.ts` „nach
Erzeugungszeit sortierbar" versprach und der Trigger genau darauf baute.

Die Folge war schlimmer als der Fehlschlag: Der Trigger hielt die ältere `reset`-Zeile für die
jüngste und brach das `UPDATE` ab — die bereits eingefügte `not_billed`-Zeile blieb aber stehen,
weil ein fachlicher Fehlschlag im Adapter ein **Wert** und kein Wurf ist und die
Transaktionsklammer nur bei einem Wurf zurücknimmt. Zurück blieb ein Protokoll, das „nicht
abgerechnet" bezeugt, und eine Buchung, die weiter `open` steht und in den nächsten Export läuft.
Gemessen in vierzig Runden: neunmal.

Zwei Änderungen, beide einzeln nachgewiesen (`proof:export` Abschnitt 11):

* **`uuidv7` bekommt einen Zähler** in den zwölf Bit hinter der Version (RFC 9562, 6.2, Methode 1).
  Das behebt die Ursache statt der Wirkung: Die Sortierbarkeit war eine zugesagte Eigenschaft, auf
  die gebaut wurde, und sie ist jetzt wahr — auch für die Anzeigereihenfolge des Protokolls.
  20.000 Kennungen in Folge, keine kleiner als ihre Vorgängerin.
* **Ein Sicherungspunkt** um die beiden Anweisungen von `resetStatus` und `markNotBilled`, und
  beide prüfen, dass das `UPDATE` genau eine Zeile getroffen hat. Damit hängt „beides oder keines"
  nicht mehr an einer einzigen Bedingung. Ohne die Kennungsänderung allein gemessen: der
  Fehlschlag bleibt, die verwaiste Zeile nicht mehr.

**Die Tagesgrenze (Code-Review, Vorrang vor allem anderen).** `date(started_at)` in SQL liefert
den UTC-Tag, `toCalendarDay` in der Domäne den Ortstag. `date('2026-08-31T22:30:00Z')` ist der
31. August; derselbe Zeitpunkt ist in Europe/Berlin der 1. September, 00:30. Eine Buchung um halb
eins nachts erschien in der Liste unter einem anderen Tag, als der Export sie gruppiert, und weil
je Tagesgruppe aufgerundet wird, bekamen **beide** Tage eine falsche Summe.

Die Tagesgrenze hat jetzt eine eigene Funktion in der Domäne, wie erbeten:
`calendarDayBounds(day, timeZone)` liefert `{ startsAt, endsBefore }` in UTC, halboffen. Der
Adapter vergleicht damit lexikographisch auf `started_at` und rechnet nicht mehr selbst.
`TimeEntryFilter.fromDay/toDay` sind vom Typ `CalendarDay` statt `string` — der Typ sagt jetzt,
welcher Tagesbegriff gemeint ist.

Die Funktion ist gegen acht Zonen und neun Tage geprüft, darunter die Umstellungstage in
Europe/Berlin (23 und 25 Stunden), die Umstellung **um Mitternacht** in America/Santiago,
Australia/Lord_Howe mit halbstündiger Umstellung und Asia/Kathmandu mit +05:45. Der Test setzt
die Zone fest ein: Ein Test, dessen Ergebnis von der Zone des ausführenden Rechners abhängt, misst
den Rechner. Gegen die alte Fassung fallen vier seiner elf Prüfungen um — gemessen, nicht
behauptet.

**T-042 Punkt 1, der Protokollfilter.** `GET /export/audit` nimmt jetzt `timeEntryId` **und**
`exportRunId`, einzeln oder zusammen. Der Port heißt `audit(filter, pagination)`; die erste Stelle
nimmt weiterhin **auch** eine nackte `TimeEntryId` entgegen, weil zehn Aufrufe in
`packages/storage/test/repo-export.test.ts` sie so schreiben und die Datei nicht mir gehört. Der
Union ist ausgeschrieben und begründet; sie darf verschwinden, sobald der unit-tester die Aufrufe
umstellt.

**T-042 Punkt 2, Benutzername und Bestandsort.** `GET /settings` liefert `windowsUser` und
`databasePath`. Beide stehen **neben** `settings` und nicht darin: Es sind keine Einstellungen,
sondern Auskünfte über den Rechner, und über keine Route setzbar. `databasePath` ist `null` bei
einem Bestand im Arbeitsspeicher — ein erfundener Pfad wäre schlimmer als keiner. Der
Sicherheitsteil steht ausgeschrieben in `structure.ts` und in der Beschreibung: B-2.4 verbietet
Pfade in **Fehlermeldungen**, weil die auch an einen Aufrufer gehen, der sie nicht bekommen soll;
hier ist es eine ausdrücklich erfragte Auskunft hinter dem Sitzungsgeheimnis, das Add-in-Token
erreicht `/settings` nicht, und derselbe Rumpf führt mit `settings.exportDirectory` bereits einen
Pfad desselben Rechners.

**T-046 Punkt 1, die `details` des Laufs.** Übernommen wie vorgeschlagen. Der Lauf ist der teurere
der beiden Wege und der einzige, der eine Datei schreibt; dass er weniger sagte als die Vorschau,
war verkehrt herum. Zwei neue Prüfungen in `proof:template-fields` halten fest, dass Lauf und
Vorschau **dieselbe** Feldangabe liefern und dass sie nicht beidseitig leer ist.

**T-046 Punkt 2, die alten Exportvorlagen — hier weiche ich von der Vorgabe ab, und ich sage es
deutlich.** Der Orchestrator wollte lieber eine Migration. Ich habe eine geschrieben und wieder
verworfen; die Begründung steht ausgeschrieben in `datenmodell.md` 8.4a, hier die Kurzfassung:

1. Eine Migration müsste die Feldnamensregel aus `packages/export/src/template.ts` **in SQL
   nachbauen** — die siebte Doppelung einer Regel in einem Bestand, der sechs davon teuer bezahlt
   hat, zuletzt die Tagesgrenze in derselben Aufgabe. Freiwillig eine anzulegen, um ein Risiko
   ohne Betroffene zu schließen, ist der schlechtere Tausch.
2. Eine abbrechende Migration wäre eine **Sackgasse**: Sie liefe vor dem Start, und wer eine
   unzulässige Vorlage hätte, käme nicht mehr in die Anwendung, um sie zu ändern. Eine, die den
   Namen zurechtbiegt, änderte eine abrechnungsrelevante Vorlage ohne Zutun ihres Besitzers.
3. Der Fall ist **schon gemessen**. `proof:template-fields` schmuggelt genau so eine Vorlage an
   allen Prüfungen vorbei in die Datenbank: Vorschau und Lauf brechen ab, keine Datei, keine
   Markierung — und seit T-046 Punkt 1 nennt der Lauf das betroffene Feld.

Dazu die Tatsache, die den Fall heute klein macht: Takt ist nie ausgeliefert worden. Die einzigen
Definitionen, die je eine Migration geschrieben hat, sind die der Standardvorlage, und dass die
besteht, ist nachgewiesen. 8.4a sagt außerdem, was zu tun ist, wenn das „nie ausgeliefert" fällt —
und zwar keine Migration, sondern eine Prüfung **beim Start**, die meldet, ohne den Start zu
verhindern. Das lässt sich beheben, eine abbrechende Migration nicht. Wenn der Orchestrator
trotzdem die Migration will, sage ich Bescheid, was sie kostet: siehe Offene Frage 1.

**T-046 Punkt 3, die Call-Nummer**, ist oben unter Nummer 16 abgehandelt.

`pnpm check` steht auf Exitcode 0, mit `proof:openapi` darin. Alle Nachweispfade grün: addin 86,
access 75, route-policy 40, export **82** (war 75), export-api 69, addin-wiring 32, taskpane 25,
template-fields **30** (war 28), db-permissions 17, openapi **45** (war 21). Prüfsuite 556/556.

---

Annahmen:

1. **Bei jeder Abweichung hat der Dienst recht bekommen — geprüft, nicht gesetzt.** Für die
   beiden teuren Fälle habe ich nachgesehen, wogegen gebaut worden ist: `apps/web/src/api/types.ts`
   führt `TodoDetail` mit `{ todo, totalSeconds, openSeconds }`, und
   `endpoints.ts:397` ruft das Lebenszeichen als `request<{ seenAt }>`. Beide Male ist die
   Oberfläche gegen den Dienst gebaut, und ein `204` hätte sie gebrochen. Der einzige Fall, in dem
   ich den Dienst geändert habe, ist der 500er — und der ist kein Vertrag, sondern ein Fehler.

2. **`type: object` ohne Felder ist ein Befund, obwohl es der Beschreibung nicht widerspricht.**
   Die Regel aus T-039 lautet: Die Beschreibung darf weniger genau sein als der Dienst, ihm aber
   nicht widersprechen. Nach dem Buchstaben wäre `type: object` also in Ordnung. Ich melde es
   trotzdem, weil es von einem **vergessenen** Feld nicht zu unterscheiden ist — und das ist
   dreimal genau der Weg gewesen, auf dem diese Fehlerklasse entstanden ist.
   `additionalProperties: true` kostet eine Zeile und macht aus dem Schweigen eine Aussage.

3. **`500` steht an keiner Operation.** Es ist der einzige Ausgang, gegen den kein Aufrufer
   verzweigt, es trägt an keiner Route eine eigene Bedeutung, und — der eigentliche Grund — ein
   `500` im Durchlauf soll **rot** werden und nicht als beschrieben durchgehen. Genau daran hing
   der Fund des R-10-Befunds. Es wäre 128 Zeilen Beschreibung, die eine Probe stumpf machen.

4. **Der Durchlauf läuft im Prozess, nicht als Kindprozess.** `proof:export-api` startet den echten
   Sidecar, weil es die Kette misst. Hier geht es um die Gestalt hinter der Kette;
   `compose` und `app.request` geben denselben Rumpf ohne belegten Port. Das ist auch die
   Voraussetzung dafür, dass der Lauf in der `check`-Kette stehen kann, ohne mit einem laufenden
   Takt zu kollidieren.

5. **Die Kettenantworten `413`/`415` stehen nur an Operationen mit Rumpf.** Technisch kann ein
   Aufrufer jeder Route einen Rumpf mit falschem Inhaltstyp schicken. Was der Dienst darauf
   antwortet, schuldet die Beschreibung aber niemandem: Ein Rumpf an einer Operation, die keinen
   führt, ist bereits außerhalb dessen, was beschrieben ist. `400`, `401` und `403` stehen dagegen
   überall, weil sie nichts als eine Adresse und eine Kopfzeile brauchen.

6. **Statt einer Migration ein Zähler in `uuidv7`.** Der `rowid`-Weg wäre sauberer — eine
   Integritätsprüfung in der Datenbank sollte nicht am Kennungsgenerator der Anwendung hängen.
   Ich habe die Migration `0007_audit_order_by_rowid` geschrieben, sie läuft vorwärts und rückwärts
   und macht den Prüfpfad grün. Sie bricht aber zwei Zeilen in
   `packages/storage/test/not-billed-audit.test.ts`, die `version: 6` als „höchste Fassung"
   ausschreiben — fremde Hoheit, und `pnpm check` wäre bis zu ihrer Änderung rot. Der Zähler löst
   dieselbe Ursache breiter (auch die Anzeigereihenfolge des Protokolls und jeden künftigen
   Vergleich auf `id` als Zweitschlüssel) und macht eine Zusage wahr, die `ids.ts` ohnehin gab.
   Die Migration liegt bereit; siehe Offene Frage 2.

7. **`ExportPort.audit` nimmt eine Kennung *oder* einen Filter.** Zwei Gestalten an einer Stelle
   sind hässlich, und ich habe es trotzdem so gebaut: Die zehn Aufrufe in
   `packages/storage/test/repo-export.test.ts` schreiben die nackte Kennung, die Datei gehört mir
   nicht, und ein Bruch dort hilft niemandem. Die Union ist im Port begründet und mit einem
   Verfallsdatum versehen.

8. **Der Vergleicher prüft keine Werte.** `maxLength`, `format`, `pattern` und `minimum` werden auf
   der Antwortseite **nicht** geprüft. Sie beschreiben die Anfrage; auf der Antwort wären sie eine
   zweite Wahrheit über Werte, die der Dienst selbst bildet — und der Nachweispfad würde rot, wenn
   ein Titel 501 Zeichen hat, was eine Aussage über den Bestand wäre und nicht über die
   Beschreibung.

9. **Der interne Vermerk wird nebenbei mitgemessen.** Der Durchlauf legt zwei Todos mit einem
   erkennbaren Vermerkstext an, und Abschnitt 6 belegt, dass er in **keiner** der 94 Antworten
   außer denen der Vermerksroute vorkommt. Das kostet nichts, weil ohnehin jede Antwort
   eingesammelt wird, und es misst eine Zusicherung (A-7.2), die sonst nur behauptet wird.

10. **Die Beispiele der Beschreibung werden gegen ihr eigenes Schema geprüft** (13 Stück, alle
    grün). Ein Beispiel ist das, was ein Leser zuerst ansieht und zuletzt prüft; widerspricht es
    dem Schema daneben, hat die Datei zwei Aussagen über dieselbe Antwort, und der Leser glaubt
    der falschen.

---

Risiken:

- **Der Durchlauf misst nur, was er auslöst.** 94 Aufrufe decken jede Operation und
  einundzwanzig Abweisungen ab, aber nicht jeden Fehlerzweig. Ein `409 name_conflict` etwa wird
  nicht herbeigeführt; seine beschriebene Gestalt ist damit ungemessen. Die Grenze ist im Skript
  benannt. Wer einen Zweig für wichtig hält, fügt drei Zeilen im Szenario hinzu — das ist der
  billigste Weg, den es dafür gibt.

- **`uuidv7` hat jetzt Zustand im Modul.** `lastMillis` und `counter` sind zwei Variablen auf
  Modulebene. Das ist gewollt (zwei `IdSource`-Instanzen sollen sich denselben Zähler teilen,
  sonst wäre die Ordnung wieder nur je Instanz garantiert), aber es ist Zustand, wo vorher keiner
  war. Zwei Prozesse teilen ihn nicht — bei einem Einbenutzerdienst mit einer Datenbankdatei ist
  das ohne Folgen, wäre es aber nicht mehr, wenn zwei Prozesse in dieselbe Datei schrieben.

- **Der Überlaufzweig des Zählers ist ungetestet.** Er greift ab 4096 Kennungen in derselben
  Millisekunde; der Prüfpfad erzeugt 20.000 in Folge und trifft ihn dabei nicht zuverlässig.
  `ids.ts` steht deshalb bei 66,7 % Zweigabdeckung. Die Gesamtschwelle hält, aber der Zweig ist
  eine Behauptung. Vorschlag an den unit-tester in Offener Frage 4.

- **`calendarDayBounds` benutzt `Intl` und damit die Zonendatenbank der Laufzeit.** Ein Node ohne
  vollständige ICU kennt nur UTC, und dann wären alle Ortstage UTC-Tage — still und ohne Wurf.
  Node 22 bringt volle ICU mit; der Sidecar wird mit ebendiesem Node gebündelt. Genannt, weil es
  die eine Annahme ist, die diese Funktion trägt.

- **Der Sicherungspunkt setzt voraus, dass eine Transaktion offen ist.** `SAVEPOINT` außerhalb
  einer Transaktion eröffnet in SQLite selbst eine — beide Aufrufer laufen über
  `inTransaction`, aber wer `markNotBilled` künftig direkt aufruft, bekommt ein anderes Verhalten
  als erwartet. Der Port sagt nicht, dass er eine offene Klammer verlangt; er sagt es nirgends,
  auch vorher nicht.

- **`GET /settings` gibt jetzt einen Dateipfad heraus.** Hinter dem Sitzungsgeheimnis, für das
  Add-in-Token unerreichbar, und neben einem Pfad, der ohnehin dort steht. Ich halte es für
  richtig und nenne es trotzdem, weil es eine Fläche vergrößert, die der security-checker
  bewertet hat. `docs/bedrohungsmodell.md` gehört mir nicht; wenn der Eintrag dort nachzuziehen
  ist, ist das Offene Frage 5.

- **`pnpm check` lief mir einmal mit Exitcode 2 durch**, bei einem Lauf, der parallel zu einem
  zweiten `vitest` stand (Abdeckungsbericht in dieselbe Datei). Vier Läufe danach: alle 0. Kein
  Befund, aber der Hinweis an den nächsten, der einen roten Lauf sieht, ohne dass etwas rot ist.

- **Der integration-dev hat in seinem T-046-Bericht vermerkt, dass sich `packages/storage` und
  die Migrationen während seiner Arbeit unter ihm bewegt haben** — das war ich, mit der
  inzwischen wieder zurückgenommenen Migration 0007. Sein Exitcode 0 gehört zu einem Stand, an
  dem parallel gearbeitet wurde; meiner auch.

---

Offene Fragen:

1. **An den Orchestrator: die Migration für alte Exportvorlagen habe ich nicht gebaut, gegen deine
   Vorliebe.** Die Begründung steht oben und ausgeschrieben in `datenmodell.md` 8.4a. Der Kern in
   einem Satz: Eine Migration müsste die Feldnamensregel in SQL nachbauen — die siebte Doppelung
   in einem Bestand, der sechs davon teuer bezahlt hat —, und eine abbrechende Migration sperrt
   den Benutzer aus der Anwendung aus, in der er die Vorlage ändern müsste. Wenn du sie trotzdem
   willst, sag es; dann baue ich sie, und sie kostet zusätzlich einen Nachweispfad, der die
   SQL-Fassung der Regel gegen die TypeScript-Fassung hält, sonst laufen sie auseinander.

2. **An den unit-tester: zwei Zeilen, und dann kann die bessere Lösung des R-10-Befunds nachrücken.**
   `packages/storage/test/not-billed-audit.test.ts:225` und `:285` schreiben `version: 6`
   beziehungsweise `expect(up.to).toBe(6)` aus — „die höchste Fassung" als feste Zahl. Jede neue
   Migration bricht daran, und es ist genau die Brüchigkeit, die `proof:export` Abschnitt 8 für
   sich schon vermieden hat („die erwartete Fassung wird abgeleitet und nicht ausgeschrieben",
   T-029). Vorschlag: die Zahl aus `state()` vor dem Lauf ableiten, wie es Abschnitt 8 tut.
   Danach kann Migration `0007_audit_order_by_rowid` nachrücken — ich habe sie geschrieben, sie
   läuft vorwärts und rückwärts (gemessen: 0 → 7 → 6 → 7) und macht den Trigger unabhängig vom
   Kennungsgenerator. Sie liegt **nicht** im Baum, weil sie dort sofort liefe und `pnpm check`
   rot machte. Der tragende Teil steht hier, damit er nicht verlorengeht:

   ```sql
   -- 0007_audit_order_by_rowid.up.sql
   DROP TRIGGER trg_time_entry_exported_needs_provenance;
   CREATE TRIGGER trg_time_entry_exported_needs_provenance
   BEFORE UPDATE ON time_entry
   WHEN OLD.export_status = 'open' AND NEW.export_status = 'exported'
    AND NEW.export_count = OLD.export_count
    AND (SELECT event FROM export_audit
          WHERE time_entry_id = NEW.id
          ORDER BY occurred_at DESC, rowid DESC   -- rowid statt id
          LIMIT 1) IS NOT 'not_billed'
   BEGIN
     SELECT RAISE(ABORT, 'export_status_not_settable');
   END;
   ```

   Die Rückwärtsdatei ist dieselbe Anweisung mit `id DESC`. Sie ist **verlustfrei**: Es wird
   keine Zeile angefasst und keine Tabelle umgebaut, nur eine Bedingung getauscht.

   Warum `rowid` trägt: `export_audit` ist eine gewöhnliche Rowid-Tabelle und **anhängend** —
   `trg_export_audit_no_update` und `trg_export_audit_no_delete` verbieten Ändern und Löschen.
   Damit ist `rowid` streng aufsteigend in der Einfügereihenfolge und wird nie wiederverwendet.
   Er ist die einzige Größe in dieser Tabelle, die die Reihenfolge **kennt**, statt sie zu
   schätzen.

3. **An den frontend-dev: zwei neue Felder in `GET /settings` und eine Korrektur an zwei Typen.**
   - `windowsUser: string` und `databasePath: string | null` in `SettingsView`
     (`apps/web/src/api/types.ts`). Die Anzeige baust du; der Satz dazu gehört in die
     Einstellungen, nicht in den Export — man will vor dem ersten Export wissen, unter welchem
     Namen abgerechnet wird.
   - **Und eine Warnung**: `GET /todos/{todoId}` liefert `TodoDetail` und nicht `Todo`. Deine
     Typen sagen das seit T-022 richtig; die **Beschreibung** sagte es falsch. Wer als nächster
     gegen die Beschreibung baut statt gegen deinen Typ, baut den Befund nach. Er ist jetzt
     behoben, aber die Reihenfolge lohnt eine Notiz.
   - `GET /export/audit?exportRunId=…` ist da. Der Knopf „Buchungen dieses Laufs" kann damit
     serverseitig filtern statt über die geladene Seite.

4. **An den unit-tester (Angebot, kein Bedarf): drei ungeprüfte Zweige.**
   - `ids.ts`, der Überlaufzweig des Zählers (`counter > 0x0fff`). Prüfbar ohne Datenbank, indem
     man 5000 Kennungen bei angehaltener Uhr erzeugt.
   - `calendarDayBounds` in `packages/domain/src/kernel.ts` — die beiden Begradigungsschleifen für
     ausgefallene und doppelte Mitternacht. Ich habe sie gegen acht Zonen von Hand gemessen; ein
     Test in `packages/domain/test/` wäre der Ort, an den sie gehören. Meine
     `calendar-day-boundary.test.ts` liegt unter `packages/storage/test/`, weil sie den Adapter
     mitprüft; die reine Domänenprüfung darf gern zu dir wandern.
   - `repo-export.ts`, der Zweig „das UPDATE trifft keine Zeile" in `resetStatus` und
     `markNotBilled`. Er ist über den Sicherungspunkt erreichbar, aber nur bei einem Wettlauf.

5. **An den security-checker: eine Fläche ist gewachsen, absichtlich.** `GET /settings` gibt jetzt
   den Pfad der Datenbankdatei und den Windows-Benutzernamen heraus — hinter dem
   Sitzungsgeheimnis, für das Add-in-Token unerreichbar (`access/route-policy.ts`), und im selben
   Rumpf, der `settings.exportDirectory` ohnehin führt. Meine Begründung steht in
   `usecases/structure.ts` und in der OpenAPI. B-2.4 halte ich für nicht berührt, weil es dort um
   Pfade in **Fehlermeldungen** geht. Wenn du das anders siehst, ist es eine Zeile: das Feld
   fliegt, und `windowsUser` bleibt. `docs/bedrohungsmodell.md` habe ich nicht angefasst.

6. **An alle, als Auskunft: `pnpm check` fährt jetzt `proof:openapi` mit.** Der Lauf braucht rund
   drei Sekunden, belegt keinen Port und schreibt nichts außerhalb eines Wegwerfordners. Die
   übrigen neun Nachweispfade stehen **nicht** in der Kette, und drei davon können auch nicht:
   `access`, `export-api` und `template-fields` starten den echten Sidecar auf 17843 und würden
   bei laufendem Takt scheitern. Ob die anderen sechs hineingehören, ist eine Entscheidung, die
   nicht mir gehört — sie kosten zusammen etwa zehn Sekunden.

---

Nächster Schritt:

Offene Frage 2 beim unit-tester: Zwei Zeilen, und danach hängt eine Integritätsprüfung der
Datenbank nicht mehr am Kennungsgenerator der Anwendung. Der Zähler in `uuidv7` behebt den Befund
vollständig und ist die breitere Lösung; die Migration ist die richtigere Verankerung, und beide
zusammen sind die Bauart, die dieses Projekt sonst überall benutzt — die Regel prüft, und die
Datenbank weist ab, was die Regel übersieht.
