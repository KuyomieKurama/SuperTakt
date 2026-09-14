# T-305 — Die eine Zahl und die Lücke daneben

Aufgabe: T-305 — `data-transfer.test.ts:295` auf Fassung 6 heben und die von T-301/T-299
gemessenen, aber ungeprüften Fälle um A-19.34 (Bytes reisen mit) nachziehen.

Status: **fertig** (in meiner Hoheit), mit einer benannten Blockade außerhalb meiner Hoheit für
den vollständigen `pnpm check`-Lauf.

## Artefakte

- `apps/local-api/test/usecases/data-transfer.test.ts` — geändert (314 Zeilen dazu, 3 geändert)

Keine anderen Dateien angefasst.

## Zusammenfassung

Die eine Zeile war wie gemeldet rot (`toBe(5)` gegen tatsächlich `6`) und ist jetzt `toBe(6)`.
Daneben standen fünf von domain-dev gemessene, aber ungeprüfte Fälle zu A-19.34 — ich habe
nachgesehen, was davon existierte (nichts) und die fehlenden Prüffälle geschrieben: die alte
Richtung (`idle_keep_timer_running` wird bei einer Fassung-6-Sicherung nicht überschrieben), der
Pfad reist nicht mit (mit und ohne Bytes, über zwei echte Anwendungsdatenverzeichnisse), die
Warnung ist laut auf einem fremden Rechner und still auf demselben, die neun Abweisungen aus dem
Bericht, und der Rundlauf von `display_name`/`rebuilt`/`origin`/`originSender`. Vollständiger
`pnpm check` bricht an einer fremden Stelle ab (`apps/local-api/src/routes/addin/**`,
integration-dev), bevor er meine Tests überhaupt erreicht — das ist nicht meine Datei und nicht
mein Fund, siehe unten.

## Roter Test vor grünem — der Nachweis

Vor der Änderung war `data-transfer.test.ts:295` (jetzt Zeile 344) tatsächlich rot. Ich habe das
verifiziert, indem ich die Zeile testweise zurück auf `toBe(5)` gesetzt und den Lauf wiederholt
habe:

```
AssertionError: expected 6 to be 5 // Object.is equality
 ❯ apps/local-api/test/usecases/data-transfer.test.ts:344:35
 Test Files  1 failed (1)
      Tests  1 failed | 36 passed (37)
```

Danach wieder auf `toBe(6)` gesetzt — grün. Für die neuen Prüffälle gilt: Sie prüfen bereits
umgesetztes, von domain-dev berichtetes Verhalten (Fassung 6 ist im Code seit T-301 fertig); ein
echtes Rot-vor-Grün im Sinne von "Feature fehlt noch" gab es dafür nicht — wohl aber im Sinne von
"kein Prüffall existierte": Vor meiner Änderung lieferte eine Suche über `apps/*/test/**` und
`packages/*/test/**` nach `data.files`, `ArchivedFile`, `todo_attachment`, `display_name`,
`rebuilt`, `emailFilePathOf`, `restoreEmailFile`, `readEmailFile` **null Treffer** außerhalb der
einen jetzt korrigierten Zeile. Die Abwesenheit selbst war der Befund, den domain-dev in T-301
Abschnitt 7.3 benannt hat, und ich habe sie nachgemessen, bevor ich etwas schrieb.

## Was ich geschrieben habe, den fünf Punkten aus dem Auftrag entlang

1. **Die alte Richtung** — `describe('T-301/T-305 — die alte Richtung: …')`: Ein Archiv der
   Fassung 6 mit `idleKeepTimerRunning: false` wird exportiert, der Bestand danach auf `true`
   geändert (genau die Reihenfolge, in der `schemaVersion !== 5` zuschlagen würde — 6 ist nicht 5,
   also wahr, also würde die Zeile überschrieben), dann eingespielt. Erwartung: `false` bleibt
   `false`. Mit dem alten `!== 5`-Vergleich wäre dieser Test rot gewesen.
2. **Der Pfad reist nicht mit** — drei Tests in `describe('A-19.34 — …')`, über echte
   `AttachmentBlobPort`-Instanzen auf echten temporären Anwendungsdatenverzeichnissen
   (`createAttachmentBlobPort` + `mkdtempSync`, nicht gemockt):
   - Rundlauf **mit** Bytes über zwei Verzeichnisse: `target` zeigt nach dem Einspielen ins zweite
     Verzeichnis, nicht mehr ins erste; die zurückgeschriebene Datei ist byteidentisch
     (`readFileSync` gegen die Originalbytes).
   - Rundlauf **ohne** Bytes (Fassung-5-Archiv, `data.files: []`) auf einem **fremden** Verzeichnis:
     `target` zeigt trotzdem lokal, nie ins Ursprungsverzeichnis.
   - Dieselbe Fassung-5-Sicherung auf **demselben** Verzeichnis: keine Verlustwarnung, weil die
     Datei dort noch liegt (Gegenprobe zu A-19.15).
3. **Nicht still** — in denselben zwei Tests: Der fremde Fall prüft wörtlich auf
   `„1 der 1 aus E-Mails übernommenen Dateien fehlt in dieser Sicherung und liegt auch nicht auf
   diesem Rechner."`; der lokale Fall prüft die **Abwesenheit** jeder Zeile mit `fehl` oder
   `nicht auf diesem Rechner` in den Warnungen — beide Richtungen der Zusicherung, nicht nur eine.
4. **Die neun Abweisungen** — `describe('parseArchive — die neun Abweisungen …')`, `it.each` über
   eine benannte Fallliste: Fassung 7, Fassung 0, Fassung als Zeichenkette `"6"`, Fassung 5 **mit**
   `data.files`, Dateiname `../../takt.db`, Dateiname `C:/Windows/x.dll`, Base64 mit Leerraum,
   leerer Inhalt, doppelter Name. Jeder Fall prüft **beides**: `ok === false` **und** daß ein vorher
   angelegtes Todo den fehlgeschlagenen Import überlebt (derselbe atomare-Ablehnung-Beweis wie beim
   bereits vorhandenen Bildkopie-Test). Dazu eine eigene Untergrenze
   (`expect(CASES.length).toBeGreaterThanOrEqual(9)`), damit ein künftig verkürztes Array nicht
   stillschweigend als "geprüft" durchgeht — genau die vom Auftrag verlangte Menge-braucht-eine-
   Untergrenze-Regel.
5. **Die Kennzeichnung überlebt** — im ersten A-19.34-Test: `displayName`, `rebuilt` und
   `originSender` werden vor dem Export gesetzt (`'Rechnung Müller.pdf'`, `true`,
   `'kunde@beispiel.test'`) und nach Export+Import auf dem zweiten Verzeichnis unverändert
   zurückgelesen — der Nachweis für A-19.22b, den der Bericht als "sonst eine Behauptung" markiert
   hatte.

## Was ich NICHT übernommen habe, mit Begründung

T-299s "Offene Fragen 5" nennt eine deutlich größere Liste (die 25 Namen gegen `nameEmailFile`,
`admitEmailAttachment` an allen drei Grenzen, `shortenEmailDisplayName`,
`decodedBase64ByteLength` gegen Leerraum/URL-sicheres Alphabet direkt, `attachEmailToNewTodo`,
ein baumelnder Symlink). Das ist eine eigene, deutlich größere Fläche in
`packages/domain/src/email-attachment.ts` und `apps/local-api/src/features/todos/email-attachments.ts`
— **beide Dateien haben nach meiner Suche null Prüffälle**, und `email-attachment.ts` steht bei
35,71 % Anweisungen / 19,04 % Zweigen / 16,66 % Funktionen (gemessen, siehe unten). T-305 nennt
diese Liste nicht; er zitiert nur die fünf A-19.34-Punkte aus T-301 Abschnitt 4. Ich habe mich
daran gehalten und melde die größere Lücke hier, statt sie stillschweigend mit zu übernehmen oder
stillschweigend zu ignorieren.

## Gemessen, nicht übernommen — wo meine Zahl von der des Berichts abweicht

T-301 Abschnitt 4 sagt "die neun Abweisungen, die er gefahren hat" und zählt sie in Prosa auf.
Ich habe nachgezählt: Es sind tatsächlich neun unterscheidbare Fälle, und meine `CASES`-Liste
bildet sie eins zu eins ab (mit einer Untergrenzenprüfung, damit das messbar bleibt und nicht nur
behauptet). Keine Abweichung hier — anders als beim allgemeinen Rat aus CLAUDE.md, Zahlen aus
Berichten nachzumessen, hatte ich hier nichts zu korrigieren.

## Was ich gemessen habe

- **Der gezielte rote Test** (siehe oben) — echt reproduziert, nicht nur zitiert.
- **Die neue Datei allein**: `npx vitest run apps/local-api/test/usecases/data-transfer.test.ts` →
  **37 bestanden, 0 rot**.
- **Der ganze Arbeitsbereich per `vitest run`** (ohne `tsc`, siehe „Blockade" unten):
  **90 Testdateien, 1710 bestanden, 3 übersprungen, 0 rot** — einschließlich der Add-in-Routen-Tests,
  die zur Laufzeit grün sind, obwohl ihr Typcheck rot ist (esbuild transpiliert, `tsc` prüft nicht
  mit).
- **`npx tsc -p apps/local-api/tsconfig.test.json --noEmit`**: vier Fehler, alle in
  `apps/local-api/src/routes/addin/index.ts`, `apps/local-api/src/routes/addin/service.ts` und
  `apps/local-api/test/routes/addin/service.test.ts` — keiner in einer von mir geänderten Datei.
- **`pnpm run test:coverage`**: Exitcode 0. `packages/domain/src` 89,79 % Anweisungen /
  87,31 % Zweige, `packages/export/src` 97,95 % / 92,85 %, `packages/storage/src` (aggregiert)
  gemessen — alle über der 80-Prozent-Schwelle aus `vitest.config.ts`. Die Schwelle ist
  **paketweit aggregiert**, nicht je Datei (kein `perFile: true` in der Konfiguration) — deshalb
  besteht das Tor trotz `email-attachment.ts` bei 35,71 % / 19,04 % / 16,66 % und `todo.ts` bei
  0 % (letzteres ohne ausführbaren Code, siehe Kommentar in `vitest.config.ts` zu E-048).
- **`pnpm run boundaries`**: grün, 488 Dateien außerhalb der Domäne geprüft, Notiz-Trennung
  unverletzt.
- **`pnpm check` vollständig**: **bricht am ersten Schritt (`typecheck`)** ab, an
  `apps/local-api/src/routes/addin/**` — außerhalb meiner Hoheit. Details unter „Blockade".

## Blockade — nicht meine Datei, gemeldet statt behoben

`pnpm check` scheitert am `typecheck`-Schritt für `apps/local-api`, mit drei Fehlern:

```
apps/local-api/src/routes/addin/index.ts(328,43): error TS2345:
  Property 'attachments' is missing in type '{...}' but required in type 'AddinCreateTodoInput'.
apps/local-api/src/routes/addin/service.ts(440,22): error TS2304:
  Cannot find name 'EmailAttachmentFailureReason'.
apps/local-api/src/routes/addin/service.ts(524,5): error TS2322:
  Property 'attachments' is missing in type '{...}' but required in type 'AddinCreateTodoResult'.
```

Dazu, beim direkten Lauf von `tsc -p apps/local-api/tsconfig.test.json`, ein vierter, in einer
Testdatei, aber ebenfalls nicht meiner Fläche zuzurechnen (`routes/addin/**` gehört laut
CLAUDE.md-Hoheitstabelle integration-dev, nicht mir):

```
apps/local-api/test/routes/addin/service.test.ts(166,3): error TS2741:
  Property 'emailAttachments' is missing in type '{...}' but required in type 'AddinDeps'.
```

Das deckt sich zeichengleich mit T-299s Risiko 1 ("`apps/outlook-addin` übersetzt nicht … beide
Befunde stammen nicht aus meinen Dateien") und T-301s Auftragslage ("integration-dev, nächste
Welle, wie entschieden"). Ich habe an keiner dieser drei Dateien etwas verändert — sie liegen
außerhalb von `apps/*/test/**` (die ersten beiden) bzw. betreffen eine Testdatei, die zu einer
laufenden, mir nicht zugewiesenen Welle gehört (die Attrappe müsste um `emailAttachments`
ergänzt werden, was die Naht aus `routes/addin/ports.ts` voraussetzt — nicht meine Datei).

Weil `pnpm check` mit `&&` verkettet ist, bricht der gesamte Lauf hier ab, bevor `test:coverage`
erreicht wird. Ich habe deshalb `boundaries`, `vitest run` und `vitest run --coverage` einzeln
gefahren (siehe oben), um zu zeigen, dass mein Teil des Tors für sich grün ist.

## Annahmen — was ich entschieden habe, ohne zu fragen

1. **Kein neuer `AppContext`-Typ, sondern derselbe `as unknown as AppContext`-Zuschnitt wie im
   Rest der Datei.** `setupWithFiles()` und `withOtherAppDataDir()` bauen ein Objekt mit genau den
   Feldern, die `exportDataArchive`/`importDataArchive` tatsächlich anfassen
   (`transactions`, `clock`, `system`, `attachmentBlobs`) — mehr hätte nur Schein-Vollständigkeit
   vorgetäuscht, ohne dass sie geprüft würde.
2. **Echte `AttachmentBlobPort`-Instanzen statt Attrappen.** `createAttachmentBlobPort` mit
   `mkdtempSync`-Verzeichnissen ist der einzige Weg, den eigentlichen Inhalt von A-19.34 (der Pfad
   wird beim Lesen zurückgeprüft, `wx` beim Schreiben, `.tmp`+`rename` beim Zurückschreiben)
   wirklich zu durchlaufen, statt ihn mit einer Attrappe zu unterstellen.
3. **`createLogger(() => undefined)`** als stiller Sammler — dieselbe Bauart wie in
   `attachment-store.test.ts`, nur ohne die Zeilen aufzuzeichnen, weil kein Test hier eine
   Protokollzeile prüft.
4. **Zwei bzw. drei temporäre Verzeichnisse pro Test, aber eine gemeinsame Datenbank.** Zwei
   getrennte SQLite-Bestände hätten "zwei Rechner" realistischer nachgebildet, aber die geprüfte
   Zusage (Pfadumschreibung, Warnungslautstärke) hängt ausschließlich an `attachmentBlobs`, nicht
   an der Datenbank — ein zweiter Bestand hätte nur Aufwand ohne zusätzliche Aussagekraft
   bedeutet. Alle Verzeichnisse werden in `afterEach` mit `rmSync({recursive:true,force:true})`
   aufgeräumt.
5. **Kein Prüffall für den `foreignPaths`-Zweig** (ein `target`, dessen letzter Namensbestandteil
   nicht der A-A-78-Form entspricht). Der Auftrag nennt ihn nicht ausdrücklich, und ich habe die
   fünf benannten Punkte priorisiert; das ist eine Lücke, die ich hier ausdrücklich vermerke statt
   sie durch stillschweigendes Weglassen zu verstecken.
6. **`email-attachment.ts`/`email-attachments.ts` bleiben ungeprüft**, siehe „Was ich NICHT
   übernommen habe". T-305 zitiert davon nichts; ich habe mich an den Auftragstext gehalten und
   die größere Lücke gemeldet statt sie ungefragt aufzugreifen.

## Risiken

1. **`pnpm check` ist für den Gesamtbestand heute nicht grün zu bekommen** — nicht wegen etwas,
   das ich geändert habe, sondern wegen der laufenden Add-in-Welle. Wer das Tor als Ganzes
   braucht, muss auf `routes/addin/**` (integration-dev) warten.
2. **`packages/domain/src/email-attachment.ts` und
   `apps/local-api/src/features/todos/email-attachments.ts` haben weiterhin keinen einzigen
   direkten Prüffall.** Die Paket-Schwelle besteht nur, weil andere Dateien im selben Paket sehr
   hoch abgedeckt sind — das ist eine Lücke, die bei der nächsten Änderung an diesen beiden Dateien
   unbemerkt bleiben kann, weil `pnpm check` insgesamt trotzdem grün würde.
3. **Sicherheitsrelevant, zur Kenntnis:** Keiner meiner neuen Tests deckt VG-1/VG-3 an
   `readEmailFile`/`restoreEmailFile` direkt ab (ein `target`, das auf `takt.db` oder eine
   Tokendatei zeigt). Das ist in `attachment-store.ts` bereits durch `emailPathFromTarget`
   gesichert und dokumentiert, aber ungeprüft — ebenfalls Teil der in Annahme 6 benannten Lücke.

## Offene Fragen an den Orchestrator

1. **Wer bekommt die Domänenlücke aus T-299 „Offene Fragen 5"?** Sie ist deutlich größer als
   T-305 und braucht vermutlich einen eigenen Auftrag (`packages/domain/test/email-attachment.test.ts`
   existiert nicht, `apps/local-api/test/usecases/email-attachments.test.ts` auch nicht).
2. **Wann ist `routes/addin/**` wieder grün?** Bis dahin ist `pnpm check` als Ganzes nicht
   erreichbar — auch nicht für andere, unabhängige Aufgaben, die danach freigeben wollen.

## Nächster Schritt

Aus meiner Sicht ist T-305 selbst erledigt und einzeln nachgewiesen (37/37 in der Datei,
1710/1710 im Gesamtlauf, `test:coverage` grün, `boundaries` grün). Vorschlag: Freigabe für T-305
unabhängig vom noch offenen `routes/addin`-Typfehler erteilen, und die Domänenlücke
(`email-attachment.ts`, `email-attachments.ts`) als eigenen Auftrag ins Board aufnehmen.
