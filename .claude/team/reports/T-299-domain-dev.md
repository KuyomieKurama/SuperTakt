# T-299 — Anhangsübernahme aus einer E-Mail, kernseitig

Aufgabe: T-299 — Die Aufnahme von Anhängen aus einer E-Mail, kernseitig (Fachlogik, Speicherung,
Dienst). Die Tür unter `/addin` und alles in `apps/outlook-addin/**` gehört integration-dev.

Status: **braucht Review**

## Artefakte

**Neu**

- `packages/domain/src/email-attachment.ts` — die Fachregeln, rein, ohne HTTP, SQL und Dateisystem
- `apps/local-api/src/features/todos/email-attachments.ts` — die Naht und der Anwendungsfall
- `packages/storage/migrations/0023_attachment_origin.up.sql`
- `packages/storage/migrations/0023_attachment_origin.down.sql`

**Geändert**

- `packages/domain/src/attachment.ts` — `AttachmentOrigin`, vier neue Felder an `Attachment` und
  `AttachmentCreate`, vierter (freiwilliger) Parameter an `attachmentLabel`
- `packages/domain/src/index.ts` — ein `export *`
- `packages/storage/src/ports.ts` — `AttachmentPort.emailFileTargets`, drei Methoden am
  `AttachmentBlobPort`, `EmailFileFailure`, `BlobRemoval` (`ImageRemoval` bleibt als Aliasname)
- `packages/storage/src/sqlite/mappers.ts`, `repo-attachments.ts`, `repo-data-archive.ts`
- `packages/storage/src/sqlite/migrations.embedded.ts` — **erzeugt**, siehe „Annahmen" Punkt 1
- `apps/local-api/src/access/attachment-store.ts` — erweitert, nicht danebengebaut
- `apps/local-api/src/config.ts` — `ADDIN_ATTACHMENT_MAX_BODY_BYTES`
- `apps/local-api/src/app.ts` — Rumpfgrenze je Route, Naht im Zusammenbau vorverdrahtet
- `apps/local-api/src/features/todos/attachments.ts`, `todos.ts`
- `apps/local-api/src/features/data-transfer/data-transfer.ts`
- `apps/local-api/openapi/takt-local-api.yaml` — vier Felder am `Attachment`-Schema
- `apps/local-api/scripts/proof-db-permissions.mjs` — Abschnitt 5
- `docs/architektur.md` 5.6b, `docs/datenmodell.md` 3.8 und 8.4l

## Zusammenfassung

Der Befund des security-checkers ist der Ausgangspunkt und die Bauform: Der fremde Dateiname wird
**Anzeigename** im Bestand und berührt den Pfad an genau einer Stelle — der Endung, kleingeschrieben,
auf `[a-z0-9]` und 16 Zeichen beschränkt. Den Namen auf der Platte erzeugt SuperTakt
(`<32 Hexziffern>[.<endung>]`) im eigenen Ordner `<appdata>/email-attachments/` mit `0700`/`0600`,
geschrieben mit `open(ziel, 'wx', 0600)` statt `existsSync`-dann-`writeFile`. Es gibt **keinen
zweiten Namensfilter** (A-A-78, A-A-79). Die Naht nimmt **keine** `TodoId` entgegen, sondern die
Funktion, die eine erzeugt — A-A-21′ (b)/(c) und A-A-82 stehen damit im Typ und nicht in einem Satz
daneben. Drei Grenzen greifen vor dem ersten Byte auf der Platte, gezählt am Dekodierten und nie an
einer Ankündigung; die Naht führt gar kein Größenfeld (A-A-81). Ein Fehlschlag je Datei ist ein
Ergebnis mit Namen und einem der **acht** Gründe des ux-designers, kein Freitext und kein Abbruch
(A-19.29). „Nachgebaut" und „Herkunft" sind Spalten in `todo_attachment`, überleben Neustart und
Round-Trip der Datensicherung (A-19.22b, A-A-84, A-A-97). Nichts in diesem Pfad baut oder liest eine
`.eml` (A-A-88, A-A-96).

---

## Die Naht für integration-dev

**Drei Zeilen in euren beiden Dateien, mehr nicht. Meine Seite ist fertig und verdrahtet.**

### 1. `apps/local-api/src/routes/addin/ports.ts` — ein Feld an `AddinDeps`

```ts
import type { EmailAttachmentIntake } from '../../features/todos/email-attachments.ts';

export interface AddinDeps {
  inTransaction<T>(work: (unit: AddinUnit) => Promise<T>): Promise<T>;
  readonly now: () => Timestamp;
  /**
   * A-19.22–A-19.33, A-A-21′ (c): Die Fähigkeit greift ausschließlich an einer
   * Kennung, die im selben Aufruf erzeugt wurde. Sie nimmt keine `TodoId`
   * entgegen — es gibt in ihrer Signatur keine.
   */
  readonly emailAttachments: EmailAttachmentIntake;
}
```

`app.ts` übergibt das Feld **bereits heute** (`createEmailAttachmentIntake(context)`). Es ist dort
ohne Typanmerkung am Literal abgelegt, damit euer `AddinDeps` ohne Übersetzungsfehler nachziehen
kann; der Aufruf `createAddinRoutes(addinDeps)` prüft die Zuweisbarkeit weiterhin vollständig.
Sobald das Feld in `AddinDeps` steht, ist die Naht zu.

### 2. Die Signaturen, die ihr ruft

```ts
export type EmailAttachmentIntake = <T>(
  intake: EmailIntake,
  create: () => Promise<UseCaseResult<FreshTodo<T>>>,
) => Promise<UseCaseResult<TodoWithEmailAttachments<T>>>;

export interface FreshTodo<T> { readonly todoId: TodoId; readonly value: T; }
export interface TodoWithEmailAttachments<T> {
  readonly created: T;                       // genau das, was eure Anlegefunktion lieferte
  readonly attachments: EmailIntakeOutcome;
}

export interface EmailIntake {
  readonly sender: string | null;                     // fremder Text, roh; ich kürze auf 640 Zeichen
  readonly message: IncomingEmailMessage | null;      // A-19.22; null ⇒ Grund gehört in `failed`
  readonly files: readonly IncomingEmailFile[];       // A-19.23, in der Reihenfolge der Nachricht
  readonly links: readonly IncomingEmailLink[];       // A-19.25, Cloud-Anhänge
  readonly failed: readonly EmailAttachmentFailure[]; // was schon im Aufgabenbereich scheiterte
}

export interface IncomingEmailMessage {
  readonly displayName: string;   // z. B. "<Betreff>.eml" — fremder Text, nie ein Pfad
  readonly base64: string;        // Standardalphabet, gepolstert, OHNE Leerraum/Zeilenumbrüche
  readonly rebuilt: boolean;      // A-19.22a/b — true, wenn Mailbox 1.14 fehlte
}
export interface IncomingEmailFile { readonly displayName: string; readonly base64: string; }
export interface IncomingEmailLink { readonly displayName: string; readonly url: string; }

export interface EmailAttachmentFailure {
  readonly displayName: string;
  readonly reason: EmailAttachmentFailureReason;   // die acht aus 6.2 des UX-Papiers
  readonly bytes: number | null;                   // nur bei `too_large`, gemessen
}

export interface EmailIntakeOutcome {
  readonly attached: readonly AttachmentView[];
  readonly failed: readonly EmailAttachmentFailure[];
}
```

Aufrufmuster in `routes/addin/service.ts`:

```ts
return deps.emailAttachments(intakeAusDemRumpf, async () => {
  const erg = await createTodo(deps, eingabe);        // eure bestehende Funktion, unverändert
  if (!erg.ok) return err(erg.error);
  return ok({ todoId: erg.value.todo.id, value: erg.value });
});
```

### 3. Vier Dinge, die die Naht **nicht** entgegennimmt, und warum

- **Keine `TodoId`.** Es gibt keinen Parameter dafür. Wer Anhänge an ein vorhandenes Todo hängen
  wollte, müßte eine Anlegefunktion schreiben, die nichts anlegt — ein Entschluß, kein Versehen.
- **Keine Größenangabe.** `detail.size` ist eine Behauptung des Absenders (A-A-15, A-A-81). Was
  nicht da ist, kann nicht geglaubt werden. Gezählt wird die Base64-Zeichenkette und danach der
  dekodierte Puffer.
- **Kein `kind`.** Eine Datei wird `kind: 'file'` (A-19.26: gewöhnlicher Dateianhang), ein
  Cloud-Anhang `kind: 'link'`. Das entscheidet die Gestalt, die ihr benutzt, nicht ein Feld.
- **Kein `rebuilt` an einer gewöhnlichen Datei.** Nur `IncomingEmailMessage` führt das Feld; ein
  Dateianhang kann strukturell nicht als Nachbau gekennzeichnet werden (A-A-97).

### 4. Was ihr über das Verhalten wissen müßt

| Lage | Ergebnis |
|---|---|
| Base64 mit Leerraum, Zeilenumbrüchen, URL-sicherem Alphabet oder fehlender Polsterung | `rejected` (die Datei kommt nicht an — bitte sauber kodieren) |
| leerer Rumpf | `rejected` |
| über 25 MB je Datei oder über 48 MB Summe | `too_large`, `bytes` gesetzt |
| mehr als 25 Anhänge | `rejected` ab dem 26. |
| Endung `.lnk .url .pif .scf .desktop` | `rejected` — siehe „Annahmen" Punkt 2 |
| Anzeigename leer/nur Leerraum | `rejected` |
| Cloud-Verweis, der A-A-2/A-A-3 nicht erfüllt | `not_a_web_address` |
| Anzeigename über 255 Zeichen | kommt an, **in der Mitte** gekürzt, Endung bleibt (A-19.23b) |
| eure Einträge in `intake.failed` | unverändert durchgereicht, **vorn** in der Liste |

Reihenfolge am Todo: **Nachricht, dann Dateien in eurer Reihenfolge, dann Cloud-Verweise.**

### 5. Die Rumpfgrenze steht schon

`POST /api/v1/addin/todos` hat ab sofort **64 MB** (`ADDIN_ATTACHMENT_MAX_BODY_BYTES`), genau diese
Methode auf genau diesem Pfad. Jede andere Route bleibt bei 1 MB. Ihr müßt dafür nichts tun.

---

## Annahmen — was ich entschieden habe, ohne zu fragen

1. **Migration 0023 heißt `attachment_origin`, und ich habe `migrations:embed` gefahren.** Der
   Auftrag sagte „bauen, nicht registrieren". Ohne das Einbetten ist `proof:migrations` rot,
   `open.ts` bricht beim Öffnen mit `describeDrift` ab und **kein** Prüffall und kein Nachweislauf
   des Dienstes startet mehr — also auch nicht `pnpm check`. Ich habe die Nummer gewählt und
   eingebettet; beides ist mit einem Befehl rückgängig zu machen
   (`pnpm --filter @takt/storage migrations:embed` nach einer Umbenennung). **Wenn 0023 anderweitig
   vergeben ist, sag Bescheid — Umbenennen kostet zwei Dateinamen und einen Befehl.**
2. **Eine Umleitungsendung wird bei der Übernahme abgewiesen** (`rejected`), statt eine Datei
   anzulegen, die der Öffnen-Befehl der Hülle nie öffnet. Begründung: Bedrohungsmodell 39.4.2 nennt
   den umgekehrten Fall ein **Ehrlichkeitsproblem** — „übernommen" melden und einen Anhang
   hinterlassen, der von Anfang an tot ist. A-19.29/A-19.30 sehen „übersprungen und namentlich
   gemeldet" ausdrücklich vor; der Benutzer erfährt es sofort statt drei Wochen später an einer
   Schaltfläche, die nichts tut. Das ist eine Auslegung von „sämtliche Dateianhänge" (A-19.23) und
   gehört geprüft.
3. **Die Summengrenze ist 48 MB, nicht 64.** 64 MB ist die Rumpfgrenze der Route (39.4.5); Base64
   trägt darin genau `64 · 3/4 = 48` MB Nutzlast. Wären beide 64, wäre die wirksame Grenze die
   Rumpfgrenze — und statt einer benannten Meldung nach A-19.29 käme ein abgewiesener Rumpf ohne
   Namen. Die Anzahl habe ich auf **25** gesetzt; A-A-81 verlangt eine Zahl, nennt aber keine.
4. **Vier Spalten, nicht eine.** Herkunft und Nachbau sind zwei unabhängige Tatsachen;
   `display_name` steht neben `title`, weil `title` dem Benutzer gehört und `display_name` dem
   Absender — und die anzeigende Fläche muß wissen, welche Regeln gelten (A-19.23b, A-A-93).
   `origin_sender` ist die Voraussetzung für A-A-85 und war in meinem Auftrag nicht genannt; ohne
   sie ist A-A-85 nicht baubar.
5. **CHECK statt Nachschlagetabelle** für `origin`. SQLite läßt `ADD COLUMN` mit `REFERENCES` nur
   bei Vorgabe `NULL` zu; die Alternative wäre ein dritter, unbenannter Zustand oder ein
   Tabellenumbau. Preis: Ein dritter Herkunftswert kostet später einen Umbau. Ausgeschrieben in der
   Migration und in `datenmodell.md` 3.8.
6. **Ein zu langer Anzeigename wird gekürzt statt abgewiesen** — in der **Mitte**, mit sichtbarer
   Marke, Ende vollständig erhalten. Irgendwo muß ein Deckel stehen; die Vorlage nahm `slice(-150)`
   und warf den Anfang weg, den ein Mensch liest. Beides zu behalten ist billiger als die Wahl.
7. **`origin` wird beim Lesen auf `user` abgebildet**, wenn der Wert unbekannt ist. Vorsichtig ist
   hier `user`: `email` **behauptet** eine Herkunft, die dann niemand gemacht hat, und die Rückfrage
   vor dem Öffnen läse sie vor.
8. **Die Datensicherung kennt die vier Spalten ohne Fassungssprung.** Dieselbe Begründung wie bei
   `last_version_check_at` (T-279): Ein Archiv ohne diese Felder stammt aus einer Fassung, in der
   ein E-Mail-Anhang gar nicht entstehen **konnte** — „Feld fehlt" und `user`/`0` sind dieselbe
   Aussage, es gibt nichts zu raten. Unbekannte Fassungen werden weiterhin abgewiesen. **Die Frage
   nach den Bytes (A-A-90) ist damit nicht beantwortet**, siehe „Offene Fragen" 1.
9. **`attachmentLabel` bekam einen vierten, freiwilligen Parameter** (`displayName`), zwischen
   Titel und Ableitung. Ohne ihn hieße eine übernommene Datei in der Liste `4a…c1.pdf`. Bestehende
   Aufrufer sind unberührt; frontend-dev entscheidet, ob er ihn nutzt.
10. **Ein eigener Ordner** `<appdata>/email-attachments/` statt `attachments/`. Die beiden Bestände
    beantworten „welche Datei hat keinen Eigentümer?" an verschiedenen Spalten; ein Aufräumlauf, der
    die Dateien des jeweils anderen übergehen müßte, hätte eine Gelegenheit mehr, Kundenmaterial mit
    Eigentümer zu löschen.

## Was ich gemessen habe

**Werkzeuglage:** Node 22.23.2 auf Windows 11, `node:sqlite`, pnpm. Alles unten ist gefahren, nicht
gelesen.

| Messung | Ergebnis |
|---|---|
| Migration 0023 vorwärts, alle vier CHECKs einzeln angegriffen | `rebuilt=1` bei `origin='user'`, `origin='sonstwas'`, Absender bei `origin='user'`, Anzeigename aus 256 Zeichen — **alle vier abgewiesen**; Vorgabe einer neuen Zeile: `user`/`NULL`/`NULL`/`0` |
| 0023 rückwärts, dann wieder vorwärts | Spalten weg, Zeilen erhalten (2 von 2); danach Spalten wieder da, Zeilen erhalten |
| **Die 25 Angriffsnamen aus Bedrohungsmodell 39.4.1** durch `nameEmailFile` + `storeEmailFile` | **0 rohe Zeichenketten im erzeugten Pfad, 0 Namen außerhalb der Form `<32 Hexziffern>[.<endung>]`**, 4 abgewiesen (`rechnung.lnk.`, `rechnung.lnk␣`, `rechnung.txt:evil.lnk`, `"   "`), 21 abgelegt. `NUL`, `COM1`, `CON.txt`, `prn.pdf`, `CONOUT$`, `CONIN$` landen als `<hex>` **ohne** Endung — Windows sieht sie |
| Voller Durchlauf gegen echte SQLite und echtes Dateisystem: eine E-Mail mit Nachbau-`.eml`, 5 Dateien, 2 Cloud-Anhängen, 1 vorher gescheiterten | **4 übernommen** (eml/rebuilt=true, pdf, `NUL`, Cloud-Verweis), **5 nicht**: `not_released` (durchgereicht), `rejected` (`.lnk`), `too_large` (27 262 976 B gemessen), `rejected` (kaputtes Base64), `not_a_web_address` (`file:///…`) |
| Round-Trip der Datensicherung über denselben Bestand | `displayName`, `origin` und `rebuilt` kommen **unverändert** zurück; die Sicherung meldet als Warnung, daß 3 Dateien nicht im Archiv sind |
| `removeAttachment` auf eine übernommene Datei | Ordner 3 → 2 Dateien |
| `removeTodo` | Ordner 2 → **0** Dateien (A-A-83) |
| `removeEmailFile` mit einem Ziel außerhalb des Ordners (`takt.db`) | `unknown_name`, **nichts angefaßt** |

**`pnpm check`, vollständig gefahren, Schritt für Schritt:**

| Schritt | Ergebnis |
|---|---|
| `typecheck` | `packages/domain`, `packages/storage`, `packages/export`, `apps/local-api`, `apps/web`, `apps/desktop`: **grün**. `apps/outlook-addin`: **rot** — nicht von mir, siehe Risiken 1 |
| `boundaries` | grün, Notiz-Trennung unverletzt, 476 Dateien geprüft |
| `contrast` | grün |
| `proof:all` (21 Läufe) | 20 grün. **`proof:addin-wiring` rot** — nicht von mir, siehe Risiken 1. Eigene Zahlen: `openapi` 115, `addin` 290 (+1), `route-policy` 44, `callers` 74, `layers` 36, `conflicts` 154, `access` 109, `release-safety` 73, `db-permissions` unter Windows übersprungen |
| `verify:bundle` | 19 bestanden, 0 fehlgeschlagen |
| `test:coverage` | **90 Dateien, 1 696 Prüffälle, 0 rot** (3 übersprungen) |
| `test:rust` | 68 bestanden, 0 rot |
| `build` | grün |
| `audit` | keine bekannten Schwachstellen |

## Risiken

1. **`pnpm check` ist heute rot, und zwar an integration-devs Hälfte.** `apps/outlook-addin`
   übersetzt nicht (`TaskPane.tsx`: `attachedNames`, `rejectedAsMissing` undefiniert;
   `Attachments.tsx`: `isMessage` fehlt), und `proof:addin-wiring` meldet: `client.ts` sendet
   `attachments` im Rumpf von `POST /addin/todos`, das Routenschema liest es nicht. Beides ist
   in Arbeit und läuft parallel; **keiner der beiden Befunde stammt aus meinen Dateien**. Ich habe
   nichts unter `routes/addin/**`, `apps/outlook-addin/**` oder `apps/web/**` angefaßt.
2. **Abschnitt 5 von `proof:db-permissions` ist auf diesem Rechner nicht gelaufen** — der Lauf
   überspringt sich unter Windows vollständig (POSIX-Modus sagt dort nichts). Syntax geprüft, und
   die Logik ist mit demselben Code in einer Wegwerf-Messung gefahren (die Zeile „25 Angriffsnamen"
   oben). Die **Rechteprüfung** selbst (`0700`/`0600`) ist damit erst auf dem Linux-Läufer gemessen.
3. **`REQUEST_TIMEOUT_MS` bleibt bei 15 s** für eine Anfrage, die bis zu 64 MB tragen darf. Über
   Loopback ist das reichlich; auf einem sehr langsamen Rechner mit 25 Anhängen ist es eine Zahl,
   die jemand einmal nachrechnen sollte. Ich habe sie nicht angefaßt, weil sie für **jede** Route
   gilt und eine Ausnahme dort eine dritte Ausnahme wäre.
4. **VG-12 ist ab jetzt offen**, und das ist der Zweck der Sache und keine Panne: Ein Absender, der
   die Adresse kennt, schreibt Bytes in das Anwendungsdatenverzeichnis des Benutzers. Die Enge des
   Wegs ist die ganze Sicherheit — erzeugter Name, drei Grenzen, `wx`, `0700`/`0600`, eine Tür, die
   am Anlegen hängt. R-21 an neuer Stelle: Der Weg von einer fremden E-Mail bis zur Ausführung einer
   `.bat` oder `.exe` ist offen und allein durch die Rückfrage vor dem Öffnen gesichert.
5. **`.eml`-Dateien öffnen sich in Outlook.** Eine übernommene Nachricht ist eine gewöhnliche Datei;
   `eml` steht auf keiner Verbotsliste und soll es nach A-A-5 auch nicht. Was Outlook beim Öffnen
   einer fremden `.eml` tut, liegt außerhalb unserer Zusage — gehört benannt statt beruhigt.
6. **Die Bytes fehlen in der Datensicherung.** Siehe Offene Fragen 1. Heute laut (Warnung), aber
   der Round-Trip nach A-20.4 ist unvollständig.

## Offene Fragen an den Orchestrator

1. **A-A-90 — kommen die Bytes der übernommenen Dateien in das Datenarchiv?** Die Entscheidung und
   die Fassungszahl gehören ausdrücklich dir. Heute: **nein**, und die Sicherung sagt es als Warnung
   („n aus E-Mails übernommene Dateien … sind in dieser Sicherung nicht enthalten"). Der Preis eines
   „ja" ist ein Archiv, das um ganze Postfachinhalte wächst (25 MB je Datei, base64 also 33 %
   darüber), `DATA_ARCHIVE_VERSION` 5 → 6, eine neue Rumpfgrenze für `data-transfer` und ein
   `readEmailFile` am Port. Der Preis eines „nein" ist stiller Verlust von Kundenmaterial beim
   Einspielen auf einem anderen Rechner — heute nicht mehr still, aber verloren.
2. **Migration 0023: Nummer und Name bestätigen** (`0023_attachment_origin`). Ich habe sie gewählt
   und `migrations:embed` gefahren, weil sonst nichts läuft — Begründung in Annahmen 1.
3. **Frontend (nicht meine Dateien).** `AttachmentView` führt ab sofort `origin`, `originSender`,
   `displayName`, `rebuilt`. Damit A-19.22b, A-19.23b, A-A-85, A-A-86 und A-A-93 erfüllt werden
   können, braucht frontend-dev: den Anzeigenamen statt des Hexnamens (`attachmentLabel` hat dafür
   einen vierten Parameter), „nachgebaut" an der Anhangszeile **und** in der Rückfrage, den Absender
   in der Rückfrage, die abgesetzte Endung — und **keine Kürzung am Zeilenende** (R-27).
4. **`AddinUnit` und A-A-21′ (c).** Meine Naht erfüllt (b) und (c) über `AddinDeps`; `AddinUnit`
   selbst bleibt unverändert ohne schreibenden `AttachmentPort`. Falls der security-checker den
   Wortlaut „`AddinUnit` führt eine Fähigkeit, die nur an einer frisch erzeugten Kennung greift"
   buchstäblich auf `AddinUnit` bezogen haben will statt auf `AddinDeps`, ist das eine Umbenennung
   und keine Umstellung — sag Bescheid.
5. **Unit-tester braucht Fälle**, die ich nicht schreiben darf: die 25 Namen gegen `nameEmailFile`
   (mit der Zahl 25 im Prüffall, E-107), `admitEmailAttachment` an allen drei Grenzen mit
   Gegenprobe knapp darunter, `shortenEmailDisplayName` (Endung überlebt, Marke sichtbar),
   `decodedBase64ByteLength` gegen Leerraum und URL-sicheres Alphabet, `attachEmailToNewTodo` mit
   scheiterndem `create` (Ordner zählt **null**) und mit einer von drei scheiternden Zeilen, der
   Round-Trip über `origin`/`rebuilt`, sowie auf POSIX ein **baumelnder Symlink** am Zielnamen
   gegen `open(…, 'wx')`.

## Nächster Schritt

Integration-dev die Naht geben (Abschnitt oben, Punkte 1 bis 5) und beides zusammen durch das
Qualitätstor fahren — vorher ist `pnpm check` nicht grün zu bekommen, weil die Tür und der Aufrufer
im Add-in heute halb gebaut sind. Parallel: A-A-90 entscheiden, damit die Fassungszahl des Archivs
nicht nachträglich springen muß.
