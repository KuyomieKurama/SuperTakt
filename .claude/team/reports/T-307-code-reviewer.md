# T-307 — Freigabeprüfung der Anhangsfläche aus dem Outlook-Add-in

Aufgabe: T-307 — Code-Review der Fläche aus T-299 bis T-306 (E-108, E-109, spec 19.5)
Rolle: code-reviewer · Stand: 2026-09-12

## Ausgangszustand — gemessen, nicht angenommen

| Sache | Befund |
|---|---|
| `git status --porcelain` | leer, der Baum ist sauber |
| Zweig / Spitze | `feature/outlook-anhaenge-und-versionspruefung`, `be87109` über `222b531` über `f6f4d6d` |
| `pnpm run typecheck` | **Ausstieg 0**, alle Projekte, `src` und `test` — gefahren, nicht gelesen |
| `.claude/team/reports/T-304-*.md` | **existiert nicht** (Befund 15) |

Nicht gefahren: `proof:all`, `test:coverage`, `test:rust`, `build`, `audit`, `test:e2e`. Die
Aussage „`pnpm check` vollständig grün" aus dem Auftrag ist von mir **nicht** nachgemessen; ich
habe den Quelltext gelesen und den Übersetzer gefragt.

## Befunde

```
apps/local-api/src/features/todos/email-attachments.ts:489   hoch    Die Anhangszeilen laufen in einer zweiten Transaktion, nach dem bereits festgeschriebenen Todo, und der Aufruf ist ungefangen. Ein Wurf aus `inTransaction` (nicht der behandelte `Result`-Fehlschlag: SQLITE_BUSY, ein Fehler in der `SELECT MAX(position)`-Zeile, ein Abbruch) verlässt `attachEmailToNewTodo`: die Dateien aus `written` bleiben ohne Eigentümer im Anwendungsdatenverzeichnis liegen, das Todo steht, und die Route antwortet 500. A-A-83 ist nur für den Wertfehlschlag erfüllt; ein Aufräumlauf für verwaiste Dateien existiert nicht (`listEmailFiles` ruft nur die Datensicherung). Fix: `inTransaction` in `try/catch` fassen, im `catch` jede Zeile aus `written` über `removeEmailFile` entfernen und erst danach weiterwerfen — dieselbe Schleife steht zwölf Zeilen tiefer schon da.
apps/outlook-addin/src/ui/TaskPane.tsx:794                   hoch    `attachedEntries` und `messageArrivedRebuilt` gleichen Nutzlast und Abweisungsliste über `displayName` ab. Der Dienst kürzt den Anzeigenamen auf 255 Zeichen (`shortenEmailDisplayName`, email-attachments.ts:352), das Routenschema lässt 1020 durch: Bei einem längeren Namen trifft `refused.has(...)` nie, die abgewiesene Datei steht in `attached` UND in `missing`, und Z3/Z4 melden „3 von 4 Anhängen hängen daran" für eine E-Mail mit drei Anhängen. Zweiter Fall ohne Überlänge: zwei Anhänge gleichen Namens, einer abgewiesen — beide verschwinden aus `attached`. Fix: der Dienst gibt in `CreatedAttachmentsDto.rejected` den Index aus `attachments.items` zurück (er führt ihn in `pending`/`written` bereits), und der Aufgabenbereich gleicht über den Index ab statt über einen fremden, gekürzten, nicht eindeutigen Text.
apps/outlook-addin/src/ui/TaskPane.tsx:93                    hoch    Der Kommentar sagt „`stored` kommt aus der Antwort des Dienstes und nicht aus der eigenen Zählung"; `DoneAttachments` führt kein Feld `stored`, und die Zahl in `attachedLine` ist `attached.length`, also genau die eigene Zählung aus Befund 2. `result.value.attachments.stored` — die einzige Zahl, die eine Aussage über den Bestand ist — wird nirgends gelesen. Ein Satz, der das Gegenteil des Bestands behauptet, an der Stelle, an der A-19.29 die Zahl verlangt. Fix: `stored` in `DoneAttachments` aufnehmen, `attachedLine` daraus rechnen, und bei `stored !== attached.length` den Unterschied anzeigen statt ihn zu verrechnen.
apps/outlook-addin/src/office/host.ts:76                     hoch    `readBody` liefert bei jedem Fehlschlag `''` — Ausnahme wie abgelehntes `AsyncResult`. Der Wert geht über `rebuildFields().body` in den Nachbau, dessen Vorspann wörtlich behauptet: „Sie enthält Absender, Empfänger, Betreff, Versanddatum und Nachrichtentext." Eine nicht lesbare Nachricht ergibt damit eine `.eml` ohne Text, die sagt, sie habe welchen, wird als übernommen gemeldet und geht weiter an die Buchhaltung. A-19.22 verlangt den Inhalt, A-19.31 schliesst den stillen Ausfall aus. Fix: `readBody` auf `string | null`, `RebuildFields.body: string | null`, `buildRebuiltEml` lehnt bei `null` ab — `rebuild_rejected` gibt es seit T-301 genau dafür.
apps/outlook-addin/src/attachments/base64.ts:45              mittel  `BASE64_SHAPE` und `base64ByteLength` sind eine zweite Umsetzung von `decodedBase64ByteLength` aus packages/domain/src/email-attachment.ts:398/433 — zeichengleicher Ausdruck, dieselbe Rechnung. Der Aufgabenbereich führt `@takt/domain` bereits als Abhängigkeit (er liest von dort `MAX_EMAIL_ATTACHMENT_*` und `normalizeAttachmentLink`). CLAUDE.md nennt die Base64-Kodierung namentlich als Fachlogik, die genau einmal existiert; die Begründung im Dateikopf trägt für `btoa`/`TextEncoder`, nicht für Form und Länge. Fix: `normalizeBase64` behält nur das Entfernen des Leerraums und gibt Form- und Längenprüfung an `decodedBase64ByteLength` ab; `base64ByteLength` entfällt.
apps/outlook-addin/src/attachments/eml.ts:268                mittel  `From:`, `To:` und `Cc:` werden als eine physische Zeile geschrieben, ohne Faltung (`toStructured.join(', ')`, bei langem Anzeigenamen auch `words.join(' ')`). Nur `Subject` läuft über `headerLines`. Zwanzig Empfänger oder ein Anzeigename aus 400 Zeichen sprengen die 998-Zeichen-Grenze aus RFC 5322 2.1.1; `PRINTABLE_ASCII_LINE` misst die Länge nicht. Eine Einschleusung entsteht dadurch nicht (die Kodierung trägt), wohl aber eine Datei, die ein strenger Leser abweist — an dem Anhang, der der Beleg sein soll. Fix: `headerLines` auch für `From`/`To`/`Cc` benutzen und nach jeder Adresse falten dürfen.
apps/web/scripts/proof-clamp.mjs:296                         mittel  Die Menge der Stilblätter ist `readdirSync(apps/web/src/styles)` — an einem Ort aufgespannt statt an der Anforderung (E-099 Punkt 3, derselbe Fehler, den `proof:addin` Abschnitt 18 gerade abgelegt hat). Eine neue `features/todos/todos.css` oder ein CSS-Modul liegt ausserhalb, deckelt trotzdem, und der Lauf bleibt grün. Fix: rekursiv über `apps/web/src/**/*.css` lesen, oder daneben zusichern, dass es ausserhalb von `styles/` keine `.css` gibt — die zweite Form ist billiger und wird rot, statt still zu werden.
apps/web/scripts/proof-clamp.mjs:206                         mittel  `overflow-y` fehlt in `CAPPING`, `overflow` und `overflow-x` stehen darin. Seit T-302 deckelt die Anhangsliste nicht mehr, sondern bricht um (`overflow-wrap: anywhere`): Der Name steht in drei Zeilen, und die Endung steht in der letzten. Ein `overflow-y: hidden` mit fester Höhe an einem Elternelement nimmt genau diese Zeile — die Wirkung, gegen die A-A-93 geschrieben ist, auf der Achse, die der Lauf nicht liest. Dass es solche Regeln im Bestand gibt, steht im Dateikopf des Laufs selbst (`.screen > .board { overflow-y: hidden }`). Fix: `{ property: "overflow-y", value: /\b(hidden|clip)\b/u }` aufnehmen, mit Gegenprobe.
apps/web/scripts/proof-clamp.mjs:757                         mittel  Ein unlesbares `className` ist ein Befund (`unreadable`), ein unlesbares `style` ist Schweigen: `styleAttributeOf` liest den Rohtext des Attributs, und `style={karteStile.name}` enthält kein `overflow`. Der Deckel im `style`-Attribut ist damit genau so weit gemessen, wie er ausgeschrieben dasteht; die Gegenprobe in Zeile 1011 setzt ihn ausgeschrieben ein und bestätigt nur diesen Fall. Fix: ein `style`-Attribut, dessen Initialisierer kein Objektliteral ist, in `unreadable` melden — gleiche Behandlung wie bei der Klassenangabe.
apps/outlook-addin/scripts/proof-addin.mjs:9511               mittel  Der A-A-93-Wächter des Aufgabenbereichs misst Regeln, deren Wähler mit `.attachments` beginnt, über `regel.includes('text-overflow')`. Er sieht keine Elternelemente (`addin.css:164`, `.pane-section { overflow: hidden }`, steht über der Anhangsliste), kein `white-space: nowrap`, und er verfehlt `overflow:hidden` ohne Leerzeichen. Dieselbe Zusage, die `proof:clamp` im Web rechnet, steht hier als Namensprüfung — und der Aufgabenbereich zeigt dieselben fremden Anzeigenamen. Fix: `white-space` und `overflow-y` in die Liste, Vergleich auf Eigenschaft/Wert statt Teilzeichenkette, und die Vorfahren der Anhangsliste in die geprüfte Menge.
packages/domain/src/email-attachment.ts:291                  mittel  `emailFileExtension` liefert `null` für zwei verschiedene Tatsachen: „dieser Name hat keine Endung" und „diese Endung ist unbrauchbar" (nicht `[a-z0-9]`, oder länger als 16). `nameEmailFile` macht daraus beide Male `{ ok: true, extension: null }`; die Datei landet ohne Endung auf der Platte und wird als übernommen gemeldet — ein Anhang, den die Hülle nie mit der richtigen Anwendung öffnet. Dasselbe Ehrlichkeitsproblem, wegen dessen `.lnk` abgewiesen wird (39.4.2), nur in die andere Richtung; A-19.23a verlangt die Endung ausdrücklich. Fix: zwei Ergebnisse unterscheiden — kein Punkt im Namen ⇒ `extension: null`, annehmen; Punkt vorhanden und Endung unbrauchbar ⇒ `{ ok: false, reason: 'rejected' }`, damit der Benutzer es nach A-19.29 erfährt.
apps/outlook-addin/src/attachments/plan.ts:157               niedrig `taken >= limits.maxCount` zählt nur Dateianhänge. Die Nachricht (Eintrag 0) und die Cloud-Verweise zählen nicht mit; im Dienst zählt jeder angenommene Anhang gegen `MAX_EMAIL_ATTACHMENT_COUNT` (email-attachments.ts:437). Eine E-Mail mit 25 Dateien und zwei Cloud-Anhängen zeigt in der Vorschau 28 zu übernehmende Anhänge, der Dienst nimmt 25 und meldet drei `rejected`. Kein Verlust, aber die Vorschau irrt an einer Zahl, die vorher feststand. Fix: `taken` mit 1 für die Nachricht beginnen und die Cloud-Einträge mitzählen.
apps/local-api/src/access/attachment-store.ts:720            niedrig Der Fangzweig um das Schreiben verwirft den Fehler vollständig und liefert `write_failed`; `ensureEmailDirectory` zehn Zeilen darüber und `removeEmailFile` zwanzig Zeilen darunter protokollieren beide. Voller Datenträger, gesperrtes Verzeichnis, Virenscanner: Der Benutzer liest „SuperTakt hat die Datei nicht angenommen", und im Protokoll steht nichts. Fix: `logger.lifecycle('warn', …, 'attachment_email_write_failed')` mit dem erzeugten Namen — nie dem Anzeigenamen — wie im Löschzweig.
apps/outlook-addin/src/office/host.ts:124                    niedrig `promised` wirft für jeden Fehlschlag denselben Satz und lässt `result.error` fallen; `settle` macht daraus `failed`, `takeFile` daraus `not_released`. Acht Gründe im Bestand, und der häufigste Weg dorthin trägt keine Diagnose — der Punkt, wegen dessen PR #13 entstanden ist, an neuer Stelle. Fix: `result.error.code`/`.message` in die geworfene Meldung aufnehmen; sie wird nicht angezeigt, steht aber in der Konsole des Aufgabenbereichs.
docs/spec.md:418                                             mittel  A-19.23 sagt „sämtliche Dateianhänge". `nameEmailFile` weist die fünf Umleitungsendungen ab (T-299 Annahme 2, dort ausdrücklich als „gehört geprüft" gemeldet). Die Auslegung ist sachlich richtig und nach A-19.29 nicht still — aber sie steht in keiner Entscheidung, und `decisions.md` kennt den Fall nicht. Kein Code-Fix: als Entscheidung eintragen oder A-19.23 um den Satz ergänzen. Gehört Orchestrator und Spezifikationsreviewer.
.claude/team/reports/T-304-integration-dev.md                mittel  Fehlt. T-304 hat die Naht geschlossen, `createTodoSchema` um `attachments` erweitert und `proof:addin` Abschnitt 18 von Namen auf Wirkung umgebaut — die schwerste Einzeländerung dieser Welle. Annahmen, Risiken und offene Fragen sind nur aus Quelltextkommentaren zu erschliessen. Fix: nachreichen lassen, bevor der security-checker anfängt; er braucht dieselbe Auskunft.
```

## Die sechs Punkte des Auftrags, einzeln beantwortet

**1. Die Naht trägt.** `EmailAttachmentIntake` und `attachEmailToNewTodo` führen keinen Parameter
vom Typ `TodoId` — gemessen am Typ (`typecheck` grün) und am Quelltext (`proof-addin.mjs:5893`,
mit einer Verstümmelung, die den Ausdruck vorführt). Es gibt genau **eine** Aufrufstelle im
Erzeugnis (`routes/addin/service.ts:598`), und dort stellt der Dienst die Anlegefunktion, nicht
der Aufrufer. Der Rückgabewert reicht `created.value.value` durch und keine Kennung; `toEmailIntake`
kann keine Kennung tragen, der Umschlag hat kein Feld dafür, und mitgeschickte `todoId`-Schreibweisen
streicht zod weg (in 18d gemessen). **Kein Befund.** Der einzige verbleibende Weg ist eine
Anlegefunktion, die nichts anlegt; sie steht als Gegenprobe im Nachweislauf und kostet einen
Entschluss im Quelltext.

**2. Die Reihenfolge der Grenzen stimmt, die Abwesenheit der Bytes nicht ganz.** `take` misst in
der Reihenfolge Form der Zeichenkette → Anzahl → Grösse je Datei → Summe (`admitEmailAttachment`,
Anzahl vor Grösse) → Form des Namens → Ablage. Gemessen wird am Dekodierten: die Rechnung aus der
Base64-Länge ist exakt, weil die Form vorher geprüft ist, und `storeEmailFile` misst
`data.byteLength` ein zweites Mal als Boden des Ports. Reisst eine Grenze, wird kein Byte
geschrieben; scheitert `create`, ist weder etwas geschrieben noch eine Transaktion geöffnet (der
Prüffall benutzt werfende Attrappen als Stolperdraht und trägt). **Der Riss ist Befund 1:** Der
Wertfehlschlag einer Zeile räumt auf, der Wurf nicht — und nirgends steht, warum.

**3. Der Nachbau schliesst R-28 strukturell.** Die vier genannten Wege durchgerechnet: `CR`/`LF`
im Betreff kann nicht entstehen (RFC-2047-`B`, Ausgabealphabet `[A-Za-z0-9+/=]`); eine Adresse mit
Sonderzeichen fällt an `ADDR_SPEC` heraus und steht kodiert im Rumpf statt in einer strukturierten
Kopfzeile (`$` ist in JavaScript ohne `m`-Marke echtes Ende der Eingabe — die
Zeilenumbruch-Falle aus anderen Sprachen greift hier nicht); ein leerer Betreff ergibt **keine**
`Subject`-Zeile statt einer leeren, das ist zulässig; ein Nachrichtentext, der wie eine Kopfzeile
aussieht, wird base64 und trägt keine Struktur. Ein zweiter Teil kann nicht entstehen, weil es
keine Trennmarke und kein `multipart` gibt — die Verschärfung gegenüber der Auflage trägt, und
`PRINTABLE_ASCII_LINE` ist ein Festpunkt über dem eigenen Erzeugnis und keine Suche. **Offen
bleiben die Faltung (Befund 6) und der leere Rumpf (Befund 4)**; der zweite ist der schwerere,
weil er nicht die Struktur aushebelt, sondern den Inhalt, und von aussen auslösbar ist.

**4. Abschnitt 18 trägt die neue Zusage.** Gemessen wird am Trägertodo statt an der Tabelle
(`zaehleAnhaengeAm`), der Probenrumpf trägt seit T-304 einen echten Anhang, und `mitSchreibpfad`
verlangt, dass genau `POST /addin/todos` einen anlegt — ohne diese Zeile wäre die Null der
Rundfahrt eine leere Messung. Die verlangte Gegenprobe gibt es zweimal: 18d schickt `todoId`,
`todoID`, `targetTodoId` und `existingTodoId` mit und zählt danach null am vorhandenen Todo (wer
einen `todoId`-Parameter nachrüstet, wird hier rot), und daneben steht der Beweis, dass die
Zählung einen Anhang sieht, wenn es einen gibt. Dazu die Quelltextmessung an der Signatur samt
Verstümmelung. **Kein Befund.** Einzige Reichweitengrenze, und sie ist klein: Die Quelltextmessung
liest zwei Signaturen namentlich; eine dritte exportierte Funktion in derselben Datei, die eine
Kennung nähme, sähe sie nicht — die Wirkungsmessung an der Route schon.

**5. `proof:clamp` ist die richtige Bauart mit drei Löchern.** Die Bauart trägt: beide Mengen
entstehen bei jedem Lauf neu, der Fixpunkt über die Aufrufer reicht über Dateigrenzen, die
Untergrenze bei leerer Deckelmenge ist gemessen, und `max-width` bewusst draussen zu lassen ist
richtig — eine Breite ohne Deckel bricht um. Von den drei Fragen des Auftrags: `width` in Pixeln
plus `overflow: hidden` am Elternelement ist gefangen (Vorfahren werden gelesen, `overflow` steht
in der Menge); `text-overflow` über eine Variable ist gefangen (für diese Eigenschaft verlangt die
Regel keinen Wert); der Deckel in der eingebetteten Stilangabe ist gefangen, solange er dasteht
(Befund 10). Ungefangen: die senkrechte Achse (Befund 9), ein Stilblatt ausserhalb von `styles/`
(Befund 8) und der ganze Aufgabenbereich (Befund 11).

**6. Die Prüffälle messen.** Die gesuchte Sorte habe ich nicht gefunden: Die Attrappen sind
Stolperdrähte (`throwingBlobs`, `untouchableTransactions` werfen bei Berührung), die Grössengrenze
wird an einem wirklich allozierten Puffer von 25 MiB gemessen und nicht an der Zeichenkette, der
Round-Trip läuft über zwei echte Anwendungsdatenverzeichnisse, und die Attrappe in
`service.test.ts` sagt in ihrem eigenen Kopf, was sie **nicht** zusichert. Der Fall „acht Gründe
als geschlossene Menge" wird rot, wenn jemand `mailbox_closed` zurückholt, und zwar dreifach: an
`.toBe(8)`, an der sortierten Mengengleichheit und an
`isEmailAttachmentFailureReason('mailbox_closed') === false`. Die eine nicht erzwungene
Zweigabdeckung (`codePointAt(0) ?? 0`) ist benannt und richtig begründet. **Kein Befund.** Was
fehlt, ist kein schlechter Prüffall, sondern ein fehlender: zu Befund 2 gibt es keinen Fall mit
einem Anzeigenamen über 255 Zeichen und keinen mit zwei gleichnamigen Anhängen.

## Was ich nicht geprüft habe

- Die vollständige Torfahrt (`proof:all`, Abdeckung, Rust, Bündel, `audit`, E2E) — nur `typecheck`.
- `AttachmentRow.tsx` und `AttachmentOpenDialog.tsx` habe ich auf Herkunft, Nachbau und abgesetzte
  Endung überflogen, nicht Zeile für Zeile gelesen; die Wortlaute gegen T-303 zu halten gehört
  ohnehin dem UX-Reviewer.
- `docs/bedrohungsmodell.md` (1405 neue Zeilen) und die drei Entwurfspapiere: nicht gelesen,
  gehören security-checker und ux-reviewer.
- Die Rumpfgrenze der Add-in-Route steht in der Kette **vor** `authGuard`; ein nicht
  ausgewiesener lokaler Prozess kann damit 64 MB in den Dienst schieben, bevor abgewiesen wird.
  Das ist die Bauart aus T-301 Risiko 1 an einer zweiten Stelle und gehört dem security-checker.

## Urteil

**Nacharbeit.**

Die Freigabe blockieren die vier `hoch`-Befunde:

1. `apps/local-api/src/features/todos/email-attachments.ts:489` — ein Wurf aus der
   Anhangstransaktion hinterlässt Kundenmaterial ohne Eigentümer und ein Todo, dessen Anlegen als
   gescheitert gemeldet wurde. Transaktionsgrenze und A-A-83.
2. `apps/outlook-addin/src/ui/TaskPane.tsx:794` und `:93` — die Zahl, die A-19.29 verlangt, wird
   über einen fremden, gekürzten, nicht eindeutigen Text gerechnet, während die richtige Zahl
   ungenutzt in der Antwort steht. Beides ist **eine** Nacharbeit.
3. `apps/outlook-addin/src/office/host.ts:76` — ein nicht lesbarer Nachrichtentext wird zu einer
   Datei, die behauptet, ihn zu enthalten. A-19.22 und A-19.31.

Befund 15 (fehlender T-304-Bericht) sollte vor dem security-checker geschlossen werden: Er
braucht dieselbe Auskunft wie ich.
