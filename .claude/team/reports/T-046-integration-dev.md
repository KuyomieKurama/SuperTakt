Aufgabe: T-046 — Nachprüfung der fremden Änderung im Vorlagen-Motor (T-034), drei
Nacharbeiten daran und der Call-Nummer-Punkt aus T-041

Status: fertig

---

Artefakte:

Geändert unter `packages/export/src/`:

```
template.ts  KNOWN_OPERATORS aus Record<ExportConditionOperator, true> abgeleitet,
             EXPORT_CONDITION_OPERATORS neu und ausgeführt; der falsche Satz über
             FIELD_NAME_PATTERN durch die Messung ersetzt; Meldung zum unbekannten
             Vergleich nennt jetzt die wählbaren Werte
index.ts     EXPORT_CONDITION_OPERATORS ausgeführt
render.ts    Kommentar an Object.create(null): benennt, dass hier die Wege
             zusammenlaufen und warum die Zeile nicht in die Prüfung gehört
```

Geändert unter `apps/local-api/src/routes/addin/`:

```
index.ts     POST /todos prüft die Call-Nummer mit checkCallNumber (422 mit
             details.field=callNumber, details.code = Grund der Domäne);
             CALL_NUMBER_INPUT_TEXT neu; REJECTION_TEXT als
             Record<CallNumberRejection, string>; Ersatztext und der nie
             benutzte Schlüssel call_number_not_usable entfernt
schema.ts    ADDIN_CALL_NUMBER_MAX_LENGTH benannt und als Transportdeckel
             begründet — nicht als Fachregel
service.ts   AddinMatchResult.reason ist CallNumberRejection statt string
```

Geändert unter `apps/outlook-addin/`:

```
src/callnumber/labels.ts   INPUT_REJECTION_LABEL neu (eingetragener Wert, nicht
                           erkannter Wert)
src/ui/TaskPane.tsx        callNumberProblem; Fehlertext am Feld; „Todo anlegen"
                           ist gesperrt, solange die Nummer nicht taugt
scripts/proof-addin.mjs    sechs neue Prüfungen (drei zur Call-Nummer, drei zum
                           Vorlagen-Motor)
```

Nicht angefasst: `packages/domain/**`, `packages/storage/**`, `apps/web/**`,
`apps/local-api/**` außer den Add-in-Routen, `packages/*/test/**`,
`tests/e2e/**`, `docs/**`, die Wurzeldateien. Kein `git commit`.

**`apps/local-api/src/usecases/export.ts:328` (Punkt 4 des Auftrags) habe ich
nicht angefasst.** Die Datei gehört domain-dev. Der fertige Änderungsvorschlag
steht unter „Offene Fragen 1". Genau darum geht es in dieser Aufgabe: Ich soll
prüfen, was jemand in meinen Dateien getan hat — dann schreibe ich nicht in
seine.

---

Zusammenfassung:

**Die fremde Änderung sitzt richtig und gehört nicht verschoben.** Beide Stellen
bleiben, wo sie sind. Die Begründung im Einzelnen:

`packages/export/src/template.ts` prüft den Feldnamen **beim Speichern**, also
vor dem Rendern, und das ist die einzige Stelle, an der ein Mensch hinschaut.
Nur diese Schicht kann einem Benutzer sagen, warum sein Feld nicht geht;
`render.ts` kann das nicht und soll es nicht.

`packages/export/src/render.ts:146` baut die Zeile über `Object.create(null)`
und sitzt damit an der Stelle, an der die Wege wirklich zusammenlaufen.
Nachgezählt: `planExportRun` wird in `apps/local-api/src/usecases/export.ts` an
zwei Stellen gerufen — Zeile 234 (Vorschau) und Zeile 340 (Lauf) —, beide über
`renderExportGroup`. Es gibt keinen dritten Aufrufer und keinen Weg von
`apps/web` in den Motor (`apps/web` bindet `@takt/export` nicht ein, `pnpm
boundaries` prüft das). Die Prüfung lässt sich umgehen, dieser Aufruf nicht.

Zur Frage nach dem `INSERT`-Weg: **Die Prüfung greift dort, und zwar an der
teuren Stelle rechtzeitig.** Der Lauf löst die Vorlage in Zeile 325 auf, prüft
sie in Zeile 328 und bricht in Zeile 330 ab — alles innerhalb der Transaktion
und **vor** `openGroups`, vor `planExportRun` und vor dem Dateischreiben in
Zeile 367. Es gibt zu diesem Zeitpunkt nichts zurückzunehmen. Gemessen habe ich
das nicht durch Lesen: `apps/local-api/scripts/proof-template-fields.mjs`
schmuggelt eine Vorlage per `INSERT` an Route und Oberfläche vorbei und weist
danach nach, dass der Lauf abbricht, **keine Datei** im Ordner liegt und
**keine Buchung** als exportiert markiert ist (28/0, unverändert grün).

Was ich als Autor des Motors hinzuzufügen habe: Die beiden Schichten sind nicht
zwei Fassungen derselben Sache, und die Reihenfolge ist keine Höflichkeit. Die
Prüfung hält die **Eingabe** auf und redet mit dem Benutzer; `Object.create(null)`
hält die **Wirkung** auf und redet mit niemandem. Der Typ
`ExportFieldDefinition` sagt nichts darüber, ob eine Prüfung stattgefunden hat —
er lässt sich von Hand bauen, und die Nachweispfade tun genau das. Deshalb ist
die Zeile in `render.ts` tragend und nicht schmückend; ich habe sie mit einer
eigenen Prüfung in `proof:addin` belegt, die den Renderer mit einem
**ungeprüften** `__proto__`-Feld füttert.

**Der falsche Kommentar (`template.ts:84`) ist der eigentliche Fund.** Er ist
nachgemessen falsch: `/^[A-Za-z0-9_-]{1,64}$/` trifft auf `__proto__`,
`constructor` und `prototype` zu — alle drei bestehen ausschließlich aus
Buchstaben und Unterstrichen. `RESERVED_FIELD_NAMES` ist damit die **einzige**
Schicht gegen diese Namen, nicht die zweite. Der Kommentar sagt das jetzt in
dieser Deutlichkeit, samt der Messreihe und samt dem Satz, dass die Liste nicht
gestrichen werden darf. Belegt wird es ohne eine zweite Fassung des Musters:
Zu jedem gesperrten Namen steht ein gleich geformter daneben (`__proto_x`,
`constructoR`, `prototypeX`), der denselben Zeichenvorrat benutzt und
angenommen wird. Kommt der eine durch und der andere nicht, kann der Unterschied
nicht vom Zeichenvorrat kommen. Das ist die Prüfung, die einen künftigen
Aufräumer aufhält.

`KNOWN_OPERATORS` ist nachgezogen (Punkt 3): `EXPORT_CONDITION_OPERATORS`
entsteht aus `Record<ExportConditionOperator, true>` und die Prüfliste daraus.
Damit hängt die letzte der drei Auswahllisten des Motors am Übersetzer —
Quellen (`SOURCE_PRESENCE`), Transformationen (`TRANSFORMATION_PRESENCE`) und
jetzt Vergleiche. Die ausdrückliche Bitte in
`apps/local-api/src/usecases/export-catalog.ts:253` ist damit erfüllt; der
Nachzug dort gehört domain-dev (Offene Fragen 2).

**T-041, die Call-Nummer.** `POST /addin/todos` nahm bis zu 128 Zeichen an,
`checkCallNumber` sucht ab 65 nicht mehr. Dazwischen entstand ein Todo, das die
Duplikatsuche nie wieder fand. Die Route prüft jetzt mit derselben Funktion,
mit der auch gesucht wird, und weist mit 422 ab — Feldangabe `callNumber`,
`code` ist der Grund der Domäne (`too_long`, `forbidden_characters`,
`formula_start`, `too_short`), nicht ein Zod-Schlüssel. Leer bleiben darf die
Nummer weiterhin (A-2.6); `null` ist keine unplausible Nummer, sondern gar
keine. Damit macht das Add-in dasselbe wie die Hauptanwendung, die einen solchen
Wert seit E-045 in `usecases/todos.ts:59` abweist — der Unterschied war dieselbe
Klasse wie C-03: dieselbe Handlung, zwei Ergebnisse, je nachdem wo sie geschieht.

Die entscheidende neue Prüfung ist nicht die Längengrenze, sondern die Deckung:
Für sechs erfundene Nummern wird jeweils angelegt **und** gesucht und verlangt,
dass beide Wege dasselbe sagen. „Angenommen und unauffindbar" gibt es nicht mehr,
und die Prüfung fängt auch die umgekehrte Abweichung.

Im Aufgabenbereich steht der Grund jetzt **vor** dem Druck auf „Todo anlegen":
Das Feld trägt den Fehlertext, die Schaltfläche ist gesperrt. Der Dienst bleibt
die Grenze — die Oberfläche spart nur den Weg dorthin, sie ersetzt nichts.

`pnpm check` steht auf **Exitcode 0** (typecheck, boundaries, contrast,
34 Testdateien / 556 Tests, build). `pnpm --filter @takt/outlook-addin
proof:addin` steht auf **86 bestanden, 0 fehlgeschlagen** (vorher 80/0). Die
neun Nachweispfade unter `apps/local-api/scripts/` laufen unverändert grün
(access 75, export 82, export-api 69, taskpane 25, addin-wiring 32,
route-policy 40, template-fields 28, db-permissions 17, openapi 45).

---

Annahmen:

1. **Die Abweisung einer unplausiblen Call-Nummer ist eine Abweisung und kein
   Hinweis.** Die Alternative — annehmen und warnen — hätte den Befund nur
   verschoben: Das Todo wäre entstanden und unauffindbar geblieben. Die
   Hauptanwendung weist ab; zwei verschiedene Antworten auf dieselbe Eingabe
   sind die Ursache dieser Aufgabe und nicht ihre Lösung.
2. **Der Transportdeckel bleibt bei 128 und wandert nicht auf 64.** Läge er auf
   der Fachregel, bekäme ein Benutzer mit 70 Zeichen eine englische
   Schemameldung mit dem Code `too_big` statt des Satzes der Domäne. Der Deckel
   fängt nur unbegrenzte Eingabe ab, bevor sie in die Prüfung läuft; er steht
   jetzt unter diesem Namen und mit dieser Begründung da.
3. **Zwei Textlisten für dieselben Ablehnungsgründe.** `REJECTION_TEXT` /
   `REJECTION_LABEL` sprechen über einen Wert, den das Add-in im E-Mail-Text
   **erkannt und nicht übernommen** hat; `CALL_NUMBER_INPUT_TEXT` /
   `INPUT_REJECTION_LABEL` über einen, den ein Mensch **eingetragen** hat. „Der
   gefundene Wert wurde nicht übernommen" ist an einem Eingabefeld eine
   Unwahrheit. Beide Listen sind `Record<CallNumberRejection, string>` und
   brechen die Übersetzung, wenn die Domäne einen Grund aufnimmt.
4. **`call_number_not_usable` ist entfernt.** Der Schlüssel stand in der
   `ErrorCode`-Union, ist aber nie als Fehlerschlüssel hinausgegangen — er war
   ausschließlich Ersatztext für einen Ablehnungsgrund ohne Satz. Seit
   `REJECTION_TEXT` über den Typ vollständig ist, kann dieser Fall nicht mehr
   eintreten. Er steht in keiner OpenAPI-Beschreibung und in keinem
   Nachweispfad; ich habe beides geprüft.
5. **Die Reihenfolge `is_set, is_not_set` ist erhalten.** Sie kommt aus
   `Object.keys` über den `Record` und ist dieselbe, die
   `apps/local-api/scripts/proof-export-api.mjs:282` erwartet.

---

Risiken:

- **Ein Vorlagenbestand von vor T-034 lässt den Export abbrechen — vollständig.**
  Vor T-034 war jeder nicht leere Feldname zulässig; `Zeit (h)` oder
  `Rückmeldung` waren speicherbar. Heute weist `validateExportTemplateDefinition`
  sie ab, und der Lauf bricht ab, nicht nur das eine Feld. Das ist richtig — ein
  still ausgelassenes Feld wäre schlimmer —, aber der Benutzer bekommt derzeit
  auf dem Laufweg eine Meldung ohne `details` (siehe Offene Fragen 1) und keinen
  Hinweis, welche Vorlage gemeint ist. Keine Migration fasst
  `export_template.definition` an; ich habe alle sieben nachgesehen. Ich habe
  bewusst nichts nachgezogen: Ein automatisches Umschreiben von Feldnamen wäre
  eine stille Änderung an dem, was beim Kunden ankommt.
- **Die Zuordnung eines Vorlagenfehlers zur betroffenen Zeile hängt an einem
  deutschen Satz.** `apps/web/src/screens/TemplateFields.tsx:636` liest den
  Präfix `Feld N:` aus der **Meldung**, weil `details` die Feldnummer nicht
  trägt (dort steht `field: "name"`). Wer die Meldung umformuliert, bricht die
  Zuordnung. Ich habe `details` **nicht** umgestellt: Das ist ein Vertrag
  zwischen Motor, Dienst und Oberfläche und gehört abgestimmt, nicht einseitig
  geändert. Vorschlag unter Offene Fragen 3.
- **Die OpenAPI-Beschreibung ist jetzt falsch.**
  `apps/local-api/openapi/takt-local-api.yaml:2480–2487` (fremde Hoheit) sagt
  ausdrücklich, die Route prüfe die Plausibilität „bewusst nicht". Genau das
  war der Befund. Wer gegen die Beschreibung baut statt gegen den Dienst, baut
  ihn nach. Konkreter Textvorschlag unter Offene Fragen 2.
- **Ein Aufrufer von außerhalb des Add-ins kann jetzt ein 422 bekommen, wo
  vorher ein 201 kam.** Das ist die Absicht. Der einzige mir bekannte fremde
  Aufrufer ist `apps/local-api/scripts/proof-addin-wiring.mjs`; er schickt
  `TCK-000042` und läuft unverändert grün (32/0).
- Keine echte Call-Nummer, kein echter Kundenname, kein Zugangsdatum. Die neuen
  Prüfdaten sind `TCK-000777`, `TCK-` mit 70 Nullen, `ABC`, `AB`,
  `TCK.000_042/1-A` und der Satz „Sehr geehrte Damen" als Beispiel eines
  Nicht-Vorgangs. Die statische Prüfung auf Beispieldomänen läuft unverändert
  mit.
- Ungeprüft bleibt wie bisher alles, was Outlook selbst tut. Die Änderung an
  `TaskPane.tsx` betrifft React-Bausteine, die in keiner Outlook-Sitzung
  gelaufen sind; gesperrt wird über `disabled`, kein neues Kästchen, kein
  `innerHTML` — die Hygieneprüfungen in Abschnitt 0 laufen mit.

---

Offene Fragen:

1. **An domain-dev (Dateihoheit `apps/local-api/src/usecases/`) — Punkt 4 des
   Auftrags, von mir nicht ausgeführt.** `export.ts:328` verliert `details`,
   die der Vorschauweg seit T-030 behält. Beide Wege sollen dieselbe Funktion
   rufen, wie es der Kommentar in Zeile 190–193 für den Vorschauweg schon
   beschreibt. Ersetze in `runExport`

   ```ts
   const definition = validateExportTemplateDefinition(template.value.definition);
   if (!definition.ok) {
     throw new AbortExport(taktError(definition.error.code, definition.error.message));
   }
   ```

   durch

   ```ts
   const definition = checkTemplateDefinition(template.value.definition);
   if (!definition.ok) throw new AbortExport(definition.error);
   ```

   und in Zeile 340 `definition.value.fields` durch `definition.value` —
   `checkTemplateDefinition` liefert bereits die Felderliste. Die Typen passen:
   `definition.error` ist derselbe `TaktError`, den Zeile 231 an `err()` gibt,
   und `AbortExport` nimmt genau den. Danach steht auch der Import von
   `validateExportTemplateDefinition` in Zeile 86 zur Disposition. Der Lauf ist
   der teurere der beiden Wege; dass er weniger sagt als die Vorschau, ist
   genau verkehrt herum.
2. **An domain-dev (Dateihoheit `apps/local-api/openapi/` und
   `apps/local-api/src/usecases/`):** (a) In
   `takt-local-api.yaml:2480–2487` die Beschreibung von `callNumber` ersetzen —
   etwa: „Wird getrimmt; eine leere Zeichenkette wird zu `null`. Ein gesetzter
   Wert muss plausibel sein (E-045, B-4.3): 3 bis 64 Zeichen aus Buchstaben,
   Ziffern, Punkt, Schrägstrich, Bindestrich und Unterstrich, nicht mit =, +, -
   oder @ beginnend. Sonst 422 mit `details[].field = "callNumber"` und dem
   Grund der Domäne in `details[].code`. Der Deckel von 128 Zeichen ist ein
   Transportdeckel, keine Fachregel." (b) In `export-catalog.ts:294` die
   Schleife über `EXPORT_CONDITION_OPERATORS` aus `@takt/export` laufen lassen
   statt über `Object.keys(CONDITION_OPERATOR_LABELS)`; die Bitte in Zeile 253
   ist erfüllt, die Reihenfolge bleibt `is_set, is_not_set`. Der `Record` der
   Beschriftungen bleibt, er beschriftet nur.
3. **An domain-dev und frontend-dev gemeinsam:** Soll `details` eines
   Vorlagenfehlers die Feldnummer strukturiert tragen — also
   `field: "fields.2.name"` statt `field: "name"`? Dann könnte
   `TemplateFields.tsx` die Zeile daran erkennen statt am Präfix `Feld N:` der
   deutschen Meldung. Ich kann das im Motor in einem Handgriff nachziehen,
   habe es aber nicht getan: Es ist ein Vertrag über drei Pakete hinweg, und
   heute hängt eine funktionierende Oberfläche an der jetzigen Form. Lohnt sich
   erst nach Offene Frage 1 — vorher trägt der Laufweg gar keine `details`.
4. **An den Orchestrator:** `packages/storage` und die Migrationen haben sich
   während dieser Aufgabe unter mir bewegt (Migration `0007_audit_order_by_rowid`
   kam dazu, `pnpm check` war zwischenzeitlich rot und ist jetzt wieder grün).
   Das ist kein Befund, nur der Hinweis, dass mein Exitcode 0 zu einem Stand
   gehört, an dem parallel gearbeitet wurde.

---

Nächster Schritt:

Offene Frage 1 bei domain-dev — solange der Laufweg `details` verliert, ist der
Abbruch bei einer eingeschmuggelten oder alten Vorlage genau dort am
wortkargsten, wo er am teuersten ist. Danach Offene Frage 2 (a): Die
OpenAPI-Beschreibung beschreibt derzeit den Befund aus T-041 als Absicht, und
sie ist das, wogegen ein zweiter Aufrufer bauen würde. Offene Frage 3 lohnt erst
danach.
