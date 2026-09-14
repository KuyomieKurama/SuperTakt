# T-312 — Die sechs Zusicherungen, der Prüffall aus T-309 Abschnitt 1, und eine Korrektur an der Grundlage

**Aufgabe:** T-312 · **Rolle:** unit-tester · **Stand:** 2026-09-12
**Grundlage:** `.claude/team/reports/T-309-domain-dev.md` — **veraltet an einer entscheidenden
Stelle**, siehe „Ein Befund, den ich melden muss" unten.

**Status: fertig.** `pnpm run test:coverage` läuft grün durch, Exitcode 0.

---

## Artefakte

| Datei | Was |
|---|---|
| `packages/domain/test/email-attachment.test.ts` | Die sechs Zusicherungen auf die neue Regel gezogen: neun Gründe statt acht, `connection` raus, `total_too_large`/`too_many` als eigene Kennungen bei Summe/Anzahl. Die geschlossene Menge bleibt hier als reine Domänen-Prüfung (keine Umgebungstypen — siehe unten, warum die Erzeuger-Messung NICHT hier steht) |
| `apps/local-api/test/usecases/email-attachments.test.ts` | Dieselben zwei Kennungswechsel (26. Verweis → `too_many`), ein neuer Fall für die 26. **Datei** (nicht nur Verweis) mit `too_many`/`bytes:null`, und ein `Logger`-Parameter an allen zwölf Aufrufstellen (Signaturänderung, siehe Befund) |
| `apps/local-api/test/usecases/email-attachments-rollback.test.ts` (neu) | Der Prüffall aus T-309 Abschnitt 1, mit Gegenprobe **und** an die tatsächliche (veränderte) Produktivzusage angepaßt — siehe Befund |
| `apps/local-api/test/email-attachment-reason-producers.test.ts` (neu) | Die „geschlossene Menge MIT Erzeuger" — die eigentliche Regel aus der Aufgabenstellung, gemessen über den Quelltext von vier Bereichen, nicht nur eine Namensliste |

Nicht angefaßt: `apps/local-api/src/**`, `packages/domain/src/**`, `docs/**` — beide `M`-Einträge
in `git status` für Produktivdateien sind **nicht von mir**, siehe Befund.

---

## Der Befund, den ich melden muss: die Grundlage war beim Start bereits veraltet

`.claude/team/reports/T-309-domain-dev.md` beschreibt `attachEmailToNewTodo` mit **drei**
Parametern und der Zusage „Der Wurf bleibt ein Wurf" (Annahme 2). Der tatsächliche Arbeitsbaum
— uneingecheckt, `git status` zeigt `M` ohne mein Zutun — hat diese Datei zwischen dem
Berichtsdatum und meinem Prüflauf **weiterentwickelt** (`git diff --stat`: +195/-Zeilen in
`email-attachments.ts`, +165 in `email-attachment.ts`, dazu die neue, unversionierte
`features/todos/email-file-sweep.ts`):

- `attachEmailToNewTodo(context, intake, create)` hat jetzt einen **vierten Parameter**
  `logger: Logger`. Die Signatur der Fähigkeit (`createEmailAttachmentIntake`) ist mitgezogen,
  und `app.ts` ruft sie bereits mit `runtime.logger` — das ist kein halbes Ende, sondern
  durchgezogen.
- **E-111** (im Kopfkommentar der Datei ausgeschrieben, in `decisions.md` **nicht** gefunden):
  Ein Wurf aus der Anhangstransaktion wird seit dieser Änderung **nicht mehr weitergereicht**.
  Er wird abgefangen, jede geschriebene Datei entfernt, eine `error`-Zeile geschrieben
  (`attachment_email_rows_threw rows=N files=M`), jeder geplante Anhang als `rejected` gemeldet,
  und die Funktion gibt `ok({created, attachments: {attached: [], failed}})` zurück — **kein
  Wurf mehr beim Aufrufer**. Begründung im Quelltext: Eine 500 bei bereits angelegtem Todo hätte
  den Benutzer zu einem zweiten Todo mit derselben Call-Nummer verleitet (A-10.9).
- Ein neuer, unversionierter Aufräumlauf beim Start existiert bereits
  (`features/todos/email-file-sweep.ts`) — die „offene Frage 1" aus dem T-309-Bericht ist damit
  ebenfalls beantwortet, ohne daß ein neuer Bericht das dokumentiert.

Ich habe daraufhin **gegen den tatsächlichen Stand getestet, nicht gegen den Bericht** — ein
Prüffall, der eine überholte Zusage mißt, ist so viel wert wie keiner. Mein erster Testentwurf
(Annahme: der Wurf kommt beim Aufrufer an) lief prompt auf einen `TypeError: Cannot read
properties of undefined (reading 'lifecycle')`, weil ich noch keinen vierten Parameter übergab —
das war das erste Signal, daß die Grundlage nicht mehr stimmte. `email-attachments-rollback.test.ts`
und die zwölf Aufrufstellen in `email-attachments.test.ts` sind entsprechend angepaßt.

**Das ist eine Meldung, kein Vorwurf.** Ich habe weder `email-attachments.ts` noch
`email-attachment.ts` noch die neue `email-file-sweep.ts` angefaßt — das ist Produktivcode und
gehört domain-dev. Der Orchestrator sollte wissen: **Der T-309-Bericht ist an zwei Stellen
überholt** (Signatur, Annahme 2 „der Wurf bleibt ein Wurf"), bevor er als Grundlage für Review
oder Freigabe herangezogen wird. `email-file-sweep.ts` hat außerdem noch **keinen** eigenen
Prüffall — das ist der augenfälligste Deckungsrand nach diesem Auftrag (siehe „Offene Fragen").

---

## 1. Die sechs Zusicherungen

Alle sechs aus dem T-309-Bericht gezogen:

| Datei:Zeile (alt) | Alt | Neu |
|---|---|---|
| `email-attachment.test.ts:85-98` „genau acht Gründe" | 8, inkl. `connection` | 9, `connection` raus, `total_too_large`/`too_many` rein |
| `email-attachment.test.ts:101-113` „'connection' erreichbar" | `it.each` mit `connection` | Eintrag gestrichen, eigener `it.each(['connection', 'mailbox_closed'])`-Block für **beide** unerreichbaren Gründe |
| `email-attachment.test.ts:120-125` „too_many/total_too_large fremd" | `isEmailAttachmentFailureReason(...)` → `false` | Aus der „unbekannt"-Liste entfernt (sie sind jetzt gültig); `connection`/`mailbox_closed`/`totally_too_large` als neue Unbekannte |
| `email-attachment.test.ts:~171` Summengrenze | `expect(verdict.reason).toBe('too_large')` | `.toBe('total_too_large')`, Testname korrigiert (A-19.30b: der Satz darf keine Zahl über die einzelne Datei nennen) |
| `email-attachment.test.ts:~183` 26. Datei | `.toBe('rejected')` | `.toBe('too_many')` |
| `email-attachments.test.ts:488` 26. Verweis | `.toEqual([{..., reason: 'rejected', ...}])` | `.toEqual([{..., reason: 'too_many', ...}])`, dazu ein neuer Fall für die 26. **Datei** (derselbe Zweig, andere Eingabe) |

Zusätzlich (Gelegenheit, nicht verlangt, aber nötig für Zweigabdeckung): Ein neuer Fall in
`email-attachments.test.ts` schickt 26 **Dateien** (nicht Verweise) und prüft, daß die 26. als
`too_many`/`bytes: null` gemeldet wird und `storeEmailFile` für sie nie gerufen wird — der
Zweig `verdict.reason === 'too_large' ? announced : null` in `email-attachments.ts` hatte sonst
seine falsche Seite (`too_many`/`total_too_large`) nur über den **Verweis**-Zweig erreicht, der
denselben Code gar nicht durchläuft.

## 2. Die geschlossene Menge — als Regel, nicht als Liste, UND mit Erzeuger

Die Aufgabe verlangte ausdrücklich, den T-306-Prüffall so umzubauen, daß er **die Regel** mißt
(„jeder Grund hat einen Erzeuger, ein gestrichener keinen mehr") statt nur eine Namensliste
abzugleichen. Das geht **nicht** vollständig in `packages/domain/test/`: Die Domäne bekommt
ausdrücklich keine Umgebungstypen (`packages/domain/tsconfig.json`: `"types": []"`), und ein
Prüflauf, der den Quelltext von `apps/outlook-addin`, `apps/local-api` und `apps/web` lesen muß,
braucht `node:fs` — genau das E-001 dort unbenennbar macht. Mein erster Entwurf hat das übersehen
und den vollständigen `pnpm run typecheck` mit drei `TS2307`-Fehlern rot gemacht; das war die
zweite rote Stelle, die ich vor dem grünen Endstand gesehen habe.

Aufgeteilt:

- `packages/domain/test/email-attachment.test.ts` prüft die geschlossene Menge **rein**: neun
  Gründe, `connection` **und** `mailbox_closed` beide ausdrücklich unerreichbar (`it.each`, nicht
  zwei einzelne Fälle), unbekannte Zeichenketten fallen durch.
- `apps/local-api/test/email-attachment-reason-producers.test.ts` (neu) trägt die eigentliche,
  schärfere Regel: Für **jeden** Wert aus `EMAIL_ATTACHMENT_FAILURE_REASONS` (importiert aus
  `@takt/domain`, keine hartkodierte Liste) wird der Quelltext unter `apps/outlook-addin/src`,
  `apps/local-api/src`, `packages/domain/src` und `apps/web/src` nach `reason: '<wert>'`
  durchsucht — der Bauart, in der ein Grund tatsächlich **erzeugt** wird, nicht nur als Schlüssel
  einer Aufzählung genannt (`too_large: true` in `EMAIL_ATTACHMENT_FAILURE_PRESENCE` zählt bewußt
  **nicht** mit, sonst wäre die Domäne ihr eigener Erzeuger). `connection` und `mailbox_closed`
  werden gegengeprüft: keine Fundstelle, in keinem der vier Bereiche. Eine „die Messung findet
  überhaupt etwas"-Gegenprobe steht davor, damit die Nullmessung bei `connection` nicht aus einem
  kaputten Suchpfad kommt.

Dieser Prüffall wird rot, wenn morgen ein zehnter Grund in die Domäne kommt, ohne daß ihn eine
Stelle zurückgibt — oder wenn `connection`/`mailbox_closed` irgendwo (auch außerhalb der Domäne)
wieder als `reason: '...'` auftaucht.

## 3. Der Prüffall aus T-309 Abschnitt 1 — mit Gegenprobe UND ROLLBACK-Nachweis

`apps/local-api/test/usecases/email-attachments-rollback.test.ts` (neu), zwei Fälle:

1. **Ein echter Wurf, ausgelöst NACH abgeschlossener Arbeit**, über eine echte
   (In-Memory-)SQLite-Transaktion (kein `reject()` ohne Arbeit — die drei Zeilen entstehen
   tatsächlich, bevor der Wurf sie zurücknimmt) und einen echten `AttachmentBlobPort`
   (`createAttachmentBlobPort`) auf einem frischen Anwendungsdatenverzeichnis. Zugesichert:
   - Das Ergebnis ist `ok()` mit `attached: []` und allen drei Dateien als `rejected` in
     `failed` — **angepaßt an E-111**, nicht mehr „der Wurf kommt beim Aufrufer an".
   - `listEmailFiles()` ist danach leer (kein verwaistes Byte).
   - Eine `error`-Protokollzeile mit `reason: 'attachment_email_rows_threw rows=3 files=3'`
     steht im (aufgefangenen, geparsten) Protokoll.
   - **Die Zusage, auf der das Aufräumen ruht**: `unit.attachments.list(todoId)` liefert nach dem
     Wurf **keine** Zeile — das ist der Nachweis, daß `ROLLBACK` in `unit-of-work.ts` wirklich
     gegriffen hat, und nicht nur eine Annahme darüber. Verlöre `unit-of-work.ts` dieses
     `ROLLBACK`, bliebe die Zeile stehen, während die Datei bereits entfernt wäre — genau der
     „Löschen von Material mit Eigentümer"-Fall, den der Auftrag benannt hat; dieser Test würde
     dann durch die DB-Zusicherung rot, nicht nur durch die leere Verzeichnisliste.
2. **Gegenprobe**: derselbe Lauf ohne Wurf legt genau drei Dateien und drei Zeilen an — ohne sie
   wäre die Null oben die Null einer leeren Messung.

Vor T-309 (mit `git stash` auf den alten Stand geprüft, siehe Dateikopf) hätte der erste Fall
gar nicht abgefangen — der Wurf hätte die Funktion verlassen, ohne daß der `catch`-Zweig
existierte, der aufräumt.

## 4. `DISPLAY_ONLY_SKIP_REASONS` (Punkt 3 der Aufgabe)

Bereits erledigt, **nicht von mir**: Laut Nachtrag im T-309-Bericht hat integration-dev
(T-310) `reasons.ts`/`model.ts` nachgezogen und `proof-addin.mjs` auf die A-19.30b-Aussage
umgestellt, bevor mein Prüflauf begann. Ich habe `apps/outlook-addin/test/**` nach
`connection`/`total_too_large`/`too_many`/`DISPLAY_ONLY_SKIP_REASONS` durchsucht — kein Treffer,
also nichts nachzuziehen. Der volle Aufgabenbaum übersetzt sauber
(`tsc -p apps/outlook-addin/tsconfig.json --noEmit`, Ausstieg 0, Teil des vollständigen
`pnpm run typecheck`-Laufs).

---

## Läufe

| Lauf | Ergebnis |
|---|---|
| `npx vitest run` (ganzer Baum) | **94 Testdateien grün, 1810 Prüffälle grün, 3 übersprungen** |
| `pnpm run test:coverage` | **grün, Exitcode 0** — Anweisungen 91,0 %, Zweige 85,76 %, Funktionen 94,2 %, Zeilen 93,13 %; `packages/domain/src` 95,11/93,38/95,83/95,66, `packages/export/src` 97,95/92,85/100/97,82, `packages/storage/src` 100/100/100/100 — alle drei Schwellen aus `vitest.config.ts` (`achtzigProzent`) klar erfüllt |
| `pnpm run typecheck` (voller Baum, inkl. `tsconfig.test.json` aller Pakete und `tests/e2e`) | **grün** |
| `pnpm run boundaries` | **grün** — „Notiz-Trennung: alle Schichten unverletzt" |

`pnpm check` insgesamt habe ich **nicht** vollständig gefahren (Zeitbudget; `proof:all`,
`verify:bundle`, `build`, `audit` sind schwergewichtig und nicht Teil des expliziten Auftrags).
Laut T-309-Bericht war der Stand vor meiner Arbeit bis `verify:bundle` grün und hing an
`test:coverage` — mit den obigen Läufen ist mein Teil davon jetzt grün. Ich kann nicht
zusichern, daß `proof:all`/`verify:bundle`/`build` es nach den (nicht von mir stammenden)
Produktivänderungen an `email-attachments.ts`/`email-attachment.ts`/`email-file-sweep.ts` auch
noch sind — das ist außerhalb meiner Hoheit und meines Auftrags.

---

## Annahmen

1. **Ich teste gegen den tatsächlichen Arbeitsbaum, nicht gegen den (an zwei Stellen veralteten)
   T-309-Bericht.** Siehe Befund oben. Ohne diese Entscheidung hätte ich einen Prüffall gebaut,
   der die Zusage von vorgestern mißt.
2. **Die Erzeuger-Messung für die geschlossene Menge gehört nach `apps/local-api/test/`, nicht
   nach `packages/domain/test/`.** Begründet durch `"types": []"` in `packages/domain/tsconfig.json`
   — eine architektonische Grenze, keine Vorliebe.
3. **Der neue Fall „26. Datei → too_many" in `email-attachments.test.ts`** ist über die Aufgabe
   hinaus, aber nötig: Ohne ihn hätte der `bytes: verdict.reason === 'too_large' ? announced :
   null`-Zweig in `email-attachments.ts` seine falsche Seite nur über den strukturell anderen
   Verweis-Zweig erreicht (der `admitEmailAttachment` gar nicht ruft).
4. **`testLogger`/`createLogger(() => undefined)`** für alle Aufrufstellen, die den neuen vierten
   Parameter nicht inhaltlich prüfen — der einzige Test, der die Protokollzeile inhaltlich prüft,
   ist der neue Rollback-Fall.

---

## Risiken

- **R-e — Der T-309-Bericht ist als Freigabegrundlage nicht mehr zutreffend.** Signatur (vier statt
  drei Parameter) und die zentrale Annahme 2 („der Wurf bleibt ein Wurf") stimmen nicht mehr mit
  dem Arbeitsbaum überein. Ein Reviewer, der nur den Bericht liest, prüft eine Funktion, die es so
  nicht mehr gibt.
- **R-f — `email-file-sweep.ts` hat keinen eigenen Prüffall.** Die Datei ist neu, unversioniert,
  und adressiert die „offene Frage 1" aus T-309 (Aufräumlauf beim Start gegen harten
  Prozeßabbruch). Ohne Prüffall ist unklar, ob die zwei Riegel gegen das Löschen von Material mit
  Eigentümer (nach dem Vorbild von `image-sweep.ts`) tatsächlich halten.
- **R-g (Sicherheitshinweis, keine neue Fläche)** — unverändert aus T-309: Der harte
  Prozeßabbruch zwischen Schreiben und `COMMIT` bleibt eine offene Lücke; mein Prüffall deckt sie
  nicht ab (das kann kein In-Prozeß-Test), sie ist im T-309-Bericht bereits benannt (R-b dort).

---

## Offene Fragen an den Orchestrator

1. **Soll domain-dev (oder wer die Änderung gefahren hat) einen Nachtragsbericht zu E-111 und
   dem vierten `logger`-Parameter ablegen?** `decisions.md` kennt E-111 nicht; der Orchestrator
   pflegt diese Datei, ich nicht.
2. **Braucht `email-file-sweep.ts` in dieser Welle noch einen Prüffall**, oder ist das eine
   eigene, folgende Aufgabe? Ich habe bewußt nichts dafür gebaut, weil die Datei nicht Teil
   meines Auftrags war und ein Prüffall für einen Aufräumlauf ohne genaue Kenntnis seiner
   endgültigen Zusage (die zwei Riegel, die Abfrage über `ix_todo_attachment_email`) mehr schadet
   als nützt, wenn er an einem noch beweglichen Ziel vorbeimißt.
3. **`pnpm check` vollständig** (`proof:all`, `verify:bundle`, `build`, `audit`) habe ich nicht
   gefahren — außerhalb des expliziten Auftrags („Fahr am Ende `pnpm run test:coverage`") und
   zeitlich nicht mehr vertretbar neben den übrigen Läufen. Empfehlung: vor der nächsten
   Freigabeprüfung einmal vollständig fahren, auch weil parallel an `email-attachments.ts` und
   `email-attachment.ts` gearbeitet wurde.

---

## Nächster Schritt

`pnpm run test:coverage` ist grün, Exitcode 0 — **das Tor läuft an dieser Stelle durch.** Vor
einer Freigabe sollte der Orchestrator klären, ob der T-309-Bericht (Signatur, Annahme 2) durch
einen aktuellen Stand ersetzt wird, und ob `email-file-sweep.ts` noch in dieser Welle einen
eigenen Prüffall bekommt. Danach lohnt ein vollständiger `pnpm check`.
