Aufgabe: T-398b — Das Add-in liest die Grenzen aus der Domäne (Welle 18c, O-LE)
Status: braucht Review

Artefakte:
- apps/local-api/src/routes/addin/schema.ts
- apps/outlook-addin/src/office/mail.ts
- apps/outlook-addin/src/office/save-mail.ts
- apps/outlook-addin/scripts/proof-addin.mjs

Zusammenfassung: Die Add-in-Tür und der Aufgabenbereich führen keine eigenen Grenzwerte für Mailtext und Tag-Listen mehr. `ADDIN_NOTE_MAX_LENGTH`, `ADDIN_TAG_IDS_MAX`, `ADDIN_TAG_NAMES_MAX` und `MAX_TAKEOVER_CHARACTERS` sind samt ihren langen Begründungsblöcken gestrichen. Beide Seiten lesen jetzt `MAIL_*_MAX_LENGTH` und `TODO_TAG_*_MAX` aus `@takt/domain`. `proof:addin` hat einen neuen Herkunftswächter (O-LE), der über den Namen misst und nicht über die Zahl, dazu eine Gegenprobe.

Bedeutung vor dem Zusammenlegen geprüft:
- `MAX_TAKEOVER_CHARACTERS` (Add-in) und `ADDIN_NOTE_MAX_LENGTH` (Tür) bedeuten dasselbe: `prepareNote` füllt das Feld `note`, und die Tür muss es annehmen. `note` an `POST /addin/todos` landet je nach Ausgang im Todo-Vermerk oder, beim Ergänzen, als `personalNote` am Maileintrag (`mail-assignment.ts:103`). `MAIL_NOTE_MAX_LENGTH` sagt laut Domäne ausdrücklich „the add-in door caps its `note` field with it“. Deshalb gleicher Änderungsgrund, zusammengelegt.
- `excerpt: .max(4000)` wird zu `MAIL_EXCERPT_MAX_LENGTH`. Das ist dieselbe Grenze, die `isMailMetadata` beim Archivimport durchsetzt.
- `identity`/`subject` (4096) und `sender`/`internetMessageId` (2048) im `mailMetadataSchema` werden zu den gleichnamigen Domänenkonstanten. Dieselben Zahlen standen als `.slice(0, 4096|2048)` auch in `save-mail.ts`. Sie haben denselben Grund („muss durch die Tür passen“) und lesen jetzt ebenfalls die Namen.
- `ADDIN_TAG_IDS_MAX`/`ADDIN_TAG_NAMES_MAX` werden zu `TODO_TAG_IDS_MAX`/`TODO_TAG_NAMES_MAX`. Die Haupttür (`features/todos/routes.ts`) liest diese Namen bereits.
- **Nicht** zusammengelegt: `ADDIN_ATTACHMENT_SENDER_MAX_LENGTH = 2048`. Der Wert ist gleich, der Grund aber ein anderer. Es ist der Transportdeckel über der Fachkürzung auf 640 Zeichen beim Absender der Anhänge (A-A-84), keine Grenze für die Mail-Metadaten.
- Auszug in `save-mail.ts`: Dort wurde auf 2000 **Codepunkte** gekürzt. Ein Codepunkt hat höchstens zwei UTF-16-Einheiten, die Tür zählt Einheiten, also passen 2000 Codepunkte genau unter 4000. Das ist dieselbe Grenze in anderer Zähleinheit, keine eigene Wahl. Der Wert steht jetzt als `Math.floor(MAIL_EXCERPT_MAX_LENGTH / 2)` da und zieht mit, das Verhalten ist unverändert.

Herkunftswächter (proof-addin.mjs, Abschnitt 16, vor „beide Türen wenden den Deckel wirklich an“):
- „O-LE: die Grenzen der Add-in-Tür …“: In `mailMetadataSchema`, `appendMailSchema` und `createTodoSchema` muss `.max(…)` für jedes aufgeführte Feld genau den Domänennamen tragen. Der Name muss unverändert (ohne `as`) aus `@takt/domain` kommen und darf nicht selbst erklärt sein. Die Datei wird über `FREMDE_ORTE.addinTuer` aufgelöst (neuer Eintrag, Suche per Merkmal).
- „O-LE: die Haupttür …“: Dieselbe Messung für `tagIds`/`tagNames` in `features/todos/routes.ts`, nur lesend (`FREMDE_ORTE.hauptTuer`).
- „O-LE: der Aufgabenbereich kürzt mit den Namen der Domäne“: `mail.ts` und `save-mail.ts` importieren die Namen und benutzen sie. Keine Datei unter `src/` erklärt einen der Namen selbst.
- Verhalten: `mailMetadata` mit überlangen Feldern und einem Rumpf nur aus Emoji. Alle Längen liegen in den Domänengrenzen, der Auszug schöpft genau `MAIL_EXCERPT_MAX_LENGTH` aus, und die Tür nimmt das Ergebnis an. Ein Auszug mit Deckel + 1 wird abgewiesen.
- Gegenprobe: Rot werden eine Zahl statt des Namens, eine eigene Erklärung, ein umbenannter fremder Wert (`MAIL_SENDER_MAX_LENGTH as MAIL_EXCERPT_MAX_LENGTH`), ein fehlender Deckel und ein fehlendes Schema. Die richtige Bauart ist grün.
- Nach O-AY wird bewusst **nicht** nach freistehenden 4000/2048/200 gesucht, weil diese Zahlen anderswo andere Bedeutungen haben.
- Die bestehende O-AR-Prüfung (Grenze N nimmt an, N+1 nicht, an beiden Türen) liest jetzt `TODO_TAG_*_MAX`. Ihr Kommentar „es gibt keine gemeinsame Quelle“ ist entfallen, weil er nicht mehr stimmt.

Prüfport: `proof-addin.mjs` bindet keinen Port. Die Routen laufen über `app.request(...)`, `compose({ port: 17843 })` ist nur ein Konfigurationswert, `openDatabase(':memory:')`. Eine Naht nach T-397a ist deshalb nicht nötig. Der Lauf durfte parallel fahren und ist gefahren.

Prüfung:
- `pnpm --filter @takt/outlook-addin typecheck`: grün.
- `pnpm --filter @takt/local-api typecheck`: grün.
- `pnpm --filter @takt/outlook-addin build`: grün.
- `vitest run apps/outlook-addin`: 6 Dateien, 49/49 grün.
- `vitest run apps/local-api/test/routes`: 18 grün, 6 rot. Alle 6 roten stehen in `test/routes/addin/service.test.ts` (`poolMovement`, `bookOnTodo`) und sind vorbestehend (T-389/T-398, unit-tester T-401), nicht aus diesem Auftrag.
- `pnpm --filter @takt/outlook-addin proof:addin`: 278 bestanden, 2 rot. Alle 5 neuen O-LE-Zeilen sowie O-AR und „Vermerk passt durch die Tür“ sind grün. Die beiden roten Zeilen stammen nicht aus diesem Auftrag:
  1. A-19.2 meldet „Deadline“ in `src/ui/texts.ts` und `TaskPane.tsx`. Getroffen werden die **Schlüsselnamen** `deadlineHintAddinPrefix`/`deadlineHintCore` (aus T-398), kein sichtbarer Text. Der Wächter vergleicht offenbar ohne Rücksicht auf Groß- und Kleinschreibung gegen Quelltext statt gegen Anzeigetext. Das war schon im Bericht T-397 als rot gemeldet.
  2. GF-03: Unter `apps/web/src` findet sich kein `deadlineHintCore:` mehr. frontend-dev baut dort parallel (T-400a). Gegen einen Zwischenstand prüfe ich nicht.
- Nicht geprüft: `pnpm check` als Ganzes, e2e und die übrigen `proof:*`, weil sie nicht verlangt waren und teils portgebunden sind.

Annahmen:
- Die Längen in `save-mail.ts` (Betreff, Absender, Message-ID, Auszug) gehören zu Punkt 1, weil sie dieselben Türgrenzen abschreiben. Wörtlich genannt waren sie im Auftrag nicht.
- Die Namen der Prüfzeilen bleiben deutsch wie der übrige Lauf, damit die Ausgabe einheitlich bleibt. Neue Kommentare sind englisch.
- Alte deutsche Begründungsblöcke habe ich nur dort gestrichen, wo sie die jetzt aufgelöste Doppelung beschrieben. Eine allgemeine Kommentarbereinigung habe ich nicht gemacht.

Risiken:
- Der Herkunftswächter liest Quelltext zeilenweise (`feld: … .max(NAME)`). Verteilt jemand eine Felddefinition über mehrere Zeilen, meldet die Prüfung „kein .max(…) gefunden“. Das ist ein falscher Alarm, aber kein stilles Grün.
- `mailMetadata` kürzt Betreff, Absender und Message-ID mit `.slice` auf UTF-16-Einheiten und kann dabei eine halbe Ersatzstelle hinterlassen. Das war schon vorher so, die Tür nimmt es an. Ob es bereinigt wird (`cutToCharacterBoundary`), ist nicht Teil dieses Auftrags.
- Sicherheit: Die Transportdeckel sind unverändert, dieselben Zahlen, nur benannt. B-1.7 ist nicht berührt.

Offene Fragen:
1. A-19.2-Wächter in `proof-addin.mjs`: Es gibt zwei Wege. Entweder misst er sichtbaren Text statt Bezeichner, oder die Schlüssel `deadlineHint*` werden umbenannt. Das Umbenennen berührt allerdings den Schlüssel, den GF-03 im Bündel der Hauptanwendung sucht (frontend-dev). Welcher Weg, und in welcher Welle?
2. GF-03: Wo steht der Kern des Fristhinweises nach T-400a in `apps/web/src`? Unter welchem Schlüssel? Davon hängt ab, ob der Wächter nachgezogen werden muss.

Nächster Schritt: Den A-19.2-Fehlalarm und GF-03 in 18d gemeinsam mit dem Stand von T-400a klären. Danach `proof:addin` erneut fahren. Der code-reviewer prüft die Streichung der ADDIN-Konstanten gegen `apps/local-api/openapi/takt-local-api.yaml`. Dort sind die maxLength-Werte unverändert und stimmen weiter.
