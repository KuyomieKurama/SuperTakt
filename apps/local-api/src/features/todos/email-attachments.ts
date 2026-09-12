/**
 * Takt — die Aufnahme von Anhängen aus einer E-Mail (A-19.22 bis A-19.33,
 * E-108, E-109, A-A-78 bis A-A-84, A-A-88, A-A-96, A-A-97).
 *
 * ===========================================================================
 * Dies ist die **Naht**. Die Tür steht woanders.
 * ===========================================================================
 *
 * Die Route unter `/api/v1/addin` gehört nicht in diese Datei und nicht in
 * dieses Verzeichnis; sie liest die Anfrage, prüft ihre Gestalt und ruft
 * {@link attachEmailToNewTodo}. Was hier steht, ist alles, was **nach** der
 * Gestaltprüfung geschieht: zählen, benennen, ablegen, eintragen, aufräumen,
 * berichten.
 *
 * Die Trennung ist nicht Ordnung, sondern die Bedingung aus A-A-82 und
 * A-A-21′: **Es gibt keinen Aufruf, der eine Todo-Kennung entgegennimmt und
 * einen Anhang erzeugt.** Diese Datei kann es gar nicht — sie bekommt keine
 * Kennung, sie bekommt eine **Funktion, die eine erzeugt**, und hängt die
 * Anhänge an das, was diese Funktion zurückgegeben hat. Der Unterschied steht
 * im Typ und nicht in einem Satz: Suchen Sie in dieser Datei nach einem
 * Parameter vom Typ `TodoId`. Es gibt keinen.
 *
 * ===========================================================================
 * Was hier ausdrücklich **nicht** geschieht
 * ===========================================================================
 *
 *  - **Es wird keine `.eml` gebaut und keine gelesen** (A-A-88, A-A-96). Die
 *    Nachricht kommt als Bytefeld herein und geht als Bytefeld auf die Platte.
 *    Kein MIME-Zerleger, kein Kopfteil, kein HTML, keine Vorschau. Der Nachbau
 *    aus A-19.22a entsteht im Aufgabenbereich aus Office.js-Feldern und ist
 *    dort zu kodieren, nicht zusammenzukleben; hier ist er nur noch **eine
 *    Eigenschaft der Datei** ({@link IncomingEmailMessage.rebuilt}).
 *  - **Es wird nichts geöffnet** (A-19.18). Diese Datei schreibt Bytes und
 *    Zeilen. Der Öffnen-Befehl steht in der Hülle, hinter einer Formprüfung,
 *    die bei **jedem** Aufruf neu läuft (E-072 Punkt 2).
 *  - **Es geht nichts in einen Export** (A-19.17). Der Exportmotor bekommt
 *    `ExportGroup`-Werte und keine Ports; `ExportSourcePath` bleibt bei zwölf
 *    Werten. Es gibt keine Leitung von hier dorthin — nicht eine, die
 *    abgeschaltet ist, sondern keine.
 *  - **Es wird kein fremder Name zum Pfad** (A-A-78). Siehe unten.
 *
 * ===========================================================================
 * Die Reihenfolge, und jeder Schritt hat seinen Grund
 * ===========================================================================
 *
 *  1. **Das Todo entsteht.** Zuerst, und nicht zuletzt. Scheitert es, ist
 *     **kein Byte** geschrieben worden — A-A-83 („kein verwaistes Byte") gilt
 *     damit nicht durch eine Aufräumroutine, sondern weil es nichts
 *     aufzuräumen gibt. Eine Zusage am Aufrufstapel ist stärker als eine an
 *     einem Zeitgeber (Bedrohungsmodell 39.4.5).
 *  2. **Jede Datei wird gemessen, benannt und geschrieben.** Gemessen an drei
 *     Grenzen (A-19.30a), benannt nach A-19.23a und A-19.23c. In dieser
 *     Reihenfolge und je Datei einzeln: Ein Fehlschlag ist ein **Ergebnis**
 *     und kein Abbruch (A-19.29). Was nicht durchkommt, kommt namentlich in
 *     die Liste.
 *  3. **Die Zeilen entstehen in einer Transaktion.** Erst danach steht fest,
 *     welche Datei einen Eigentümer hat.
 *  4. **Was keinen bekam, wird entfernt.** Scheitert die Transaktion ganz,
 *     gehen alle Dateien dieses Laufs; scheitert eine Zeile, geht ihre Datei.
 *     Das ist die zweite Hälfte von A-A-83, und sie ist die, die man messen
 *     kann: Der Ordner zählt danach **null** zusätzliche Dateien.
 *
 *     **„Ganz" heißt seit T-309 auch „mit einem Wurf".** Bis dahin galt Punkt 4
 *     nur für den Fehlschlag als **Wert**; ein geworfener Fehler verließ die
 *     Naht und ließ die Bytes liegen (T-307 Befund 1). Die Klammer dafür steht
 *     unten am Ruf, mitsamt der Begründung, warum sie dort genügt und was sie
 *     nicht kann.
 *
 * ===========================================================================
 * Der fremde Name: Anzeigename im Bestand, nie ein Pfadbestandteil
 * ===========================================================================
 *
 * Der security-checker hat die Vorlage nicht gelesen, sondern **gefahren**
 * (T-297, 39.4.1): 25 Angriffsnamen gegen ihren `sanitizeFileName`, echte
 * Dateien, Windows 11 — **25 hinein, 25 auf der Platte, null Ablehnungen**.
 * `NUL`, `COM1`, `CON.txt` und `prn.pdf` landeten als Datei, die Windows
 * anschließend nicht sieht: Der Dienst meldete „übernommen", der Öffnen-Befehl
 * fand nie etwas, und eine Datei blieb liegen, die der Benutzer mit dem
 * Dateimanager nicht löschen kann.
 *
 * Diese Datei baut deshalb **keinen zweiten Namensfilter**. Sie übernimmt aus
 * dem fremden Namen genau eine Angabe — die Endung, eng gefaßt in
 * `nameEmailFile` der Domäne — und läßt den Namen selbst als **Anzeigename**
 * in `todo_attachment` stehen, wo er fremder Text ist und bleibt. Der Name auf
 * der Platte ist erzeugt. Damit ist die ganze Fehlerklasse nicht abgewehrt,
 * sondern **unmöglich**, und das ist der Unterschied, auf den es ankommt.
 */

import type { AttachmentCreate, EmailAttachmentFailureReason, TodoId } from '@takt/domain';
import {
  MAX_EMAIL_ATTACHMENT_COUNT,
  admitEmailAttachment,
  decodedBase64ByteLength,
  err,
  nameEmailFile,
  normalizeAttachmentLink,
  ok,
  shortenEmailDisplayName,
} from '@takt/domain';

import { type AppContext, type UseCaseResult, now } from '../../context.ts';
import type { Logger } from '../../logger.ts';
import { type AttachmentView, toAttachmentView } from './attachments.ts';

// ---------------------------------------------------------------------------
// Was hereinkommt
// ---------------------------------------------------------------------------

/**
 * Die **Nachricht selbst** als Datei (A-19.22).
 *
 * `rebuilt` steht an **dieser** Gestalt und an keiner anderen, und das ist
 * Absicht (A-19.22b, A-A-97): Ein gewöhnlicher Dateianhang kann gar nicht als
 * Nachbau gekennzeichnet werden, weil sein Typ kein Feld dafür hat. Nachgebaut
 * wird eine **Nachricht**; alles andere kommt, wie es ist.
 *
 * `rebuilt === true` heißt: Outlook gab die ursprüngliche Nachricht nicht her
 * (Mailbox 1.14 fehlt), und der Aufgabenbereich hat sie aus den verfügbaren
 * Angaben zusammengesetzt (A-19.22a). Die Kennzeichnung geht in den Bestand,
 * übersteht den Round-Trip der Datensicherung und steht später an der
 * Anhangszeile **und** in der Rückfrage vor dem Öffnen. Ein Hinweis, der nur
 * beim Anlegen erscheint, ist drei Wochen später nirgends.
 */
export interface IncomingEmailMessage {
  /**
   * Der Anzeigename, den ein Mensch zu sehen bekommt — **fremder Text**.
   * Üblicherweise `<Betreff>.eml`. Er wird nie ein Pfadbestandteil (A-A-78).
   */
  readonly displayName: string;
  /**
   * Der Rumpf, Base64, **ohne Leerraum und ohne Zeilenumbrüche**.
   *
   * **Keine Größenangabe daneben.** `detail.size` ist eine Behauptung des
   * Absenders und keine Grenze (A-A-15, A-A-81); was nicht da ist, kann nicht
   * geglaubt werden. Gezählt wird an der Zeichenkette und danach am
   * dekodierten Puffer.
   */
  readonly base64: string;
  /** Nachbau statt Original (A-19.22a, A-19.22b). */
  readonly rebuilt: boolean;
}

/** Ein **Dateianhang** derselben E-Mail (A-19.23). */
export interface IncomingEmailFile {
  /** Siehe {@link IncomingEmailMessage.displayName}. */
  readonly displayName: string;
  /** Siehe {@link IncomingEmailMessage.base64}. */
  readonly base64: string;
}

/**
 * Ein **Cloud-Anhang** (A-19.25) — ein Verweis, keine Datei.
 *
 * Die Adresse kommt vollständig vom Absender. Sie wird hier gegen A-A-2 und
 * A-A-3 geprüft (`normalizeAttachmentLink`) und **in ihrer Normalform**
 * gespeichert: Was im Bestand steht, ist genau das, was angezeigt und was
 * geöffnet wird.
 *
 * Eine Adresse, die dabei fällt, wird nach A-19.29 gemeldet und nicht
 * gespeichert. Andernfalls entstünde ein Anhang, der von Anfang an tot ist —
 * `check_link` der Hülle weist ihn bei jedem Öffnen ab —, während A-19.29
 * „übernommen" gemeldet hätte. Dieselbe Unehrlichkeit wie bei den Gerätenamen
 * (39.5.4).
 */
export interface IncomingEmailLink {
  /** Siehe {@link IncomingEmailMessage.displayName}. */
  readonly displayName: string;
  /** Der Ablageort, roh wie in der Nachricht. */
  readonly url: string;
}

/** Eine Datei, die nicht angekommen ist — mit Namen und Grund (A-19.29). */
export interface EmailAttachmentFailure {
  /** Der Name aus der E-Mail, **fremder Text**. Bereits auf 255 Zeichen gekürzt. */
  readonly displayName: string;
  /** Einer der acht Gründe aus `docs/design/addin-anhangsuebernahme-fluss.md` 6.2. */
  readonly reason: EmailAttachmentFailureReason;
  /**
   * Die **gemessene** Größe in Bytes — nur bei `too_large`, sonst `null`.
   *
   * Sie steht hier, weil der Satz des ux-designers sie nennt („zu groß
   * («Größe»). Die Grenze liegt bei 25 MB je Datei."). Gemessen, nicht
   * angekündigt: Es ist die Zahl, die aus der Base64-Zeichenkette folgt, und
   * nicht die, die jemand daneben geschrieben hat.
   */
  readonly bytes: number | null;
}

/**
 * Was aus der E-Mail übernommen werden soll.
 *
 * **Keine Todo-Kennung.** Sie steht nicht hier, sie steht in keinem Feld
 * dieser Gestalt und sie steht in keiner Signatur dieser Datei (A-A-21′ (b),
 * A-A-82). Wer sie ergänzt, hebt E-108 auf und nicht eine Zeile Code.
 */
export interface EmailIntake {
  /**
   * Der Absender, **fremder Text** (A-A-84, A-A-85). `null`, wenn die
   * Nachricht keinen hergab.
   *
   * Er geht als Eigenschaft an **jeden** Anhang dieses Laufs, nicht in eine
   * Meldung: Die Rückfrage vor dem Öffnen braucht ihn Wochen später
   * („Diese Datei stammt aus einer E-Mail von …"), und ein Wert, der nur im
   * Augenblick des Anlegens existiert, ist dann nicht mehr da.
   */
  readonly sender: string | null;
  /**
   * Die Nachricht selbst (A-19.22). `null` heißt: Der Aufgabenbereich hat sie
   * nicht bekommen — dann steht der Grund in {@link failed}, und zwar
   * **immer** (A-19.31: ein stiller Ausfall ist ausgeschlossen).
   */
  readonly message: IncomingEmailMessage | null;
  /** Ihre Dateianhänge (A-19.23), in der Reihenfolge der Nachricht. */
  readonly files: readonly IncomingEmailFile[];
  /** Ihre Cloud-Anhänge (A-19.25). */
  readonly links: readonly IncomingEmailLink[];
  /**
   * Was **vor** diesem Aufruf schon nicht geklappt hat (A-19.29, A-19.31).
   *
   * `not_released`, `timeout`, `rebuild_rejected` und `outlook_too_old`
   * entstehen im Aufgabenbereich, bevor ein Byte den Dienst erreicht. Sie kommen trotzdem hierher und erscheinen in **demselben**
   * Ergebnis wie die übrigen: Der Benutzer soll eine Liste lesen und nicht
   * zwei, und er soll sie an derselben Stelle lesen wie die Erfolge.
   *
   * Der Dienst prüft diese Einträge auf ihre Gestalt und reicht sie weiter. Er
   * urteilt nicht über sie — er war nicht dabei.
   */
  readonly failed: readonly EmailAttachmentFailure[];
}

/**
 * Was dabei herausgekommen ist (A-19.29, A-19.33).
 *
 * Beide Listen, immer, auch wenn eine leer ist: „3 übernommen, 0 nicht" ist
 * eine Auskunft, „3 übernommen" ist eine halbe. A-19.29 verlangt, daß ein
 * Todo, das mit weniger Anhängen entsteht als die E-Mail trägt, das **sagt** —
 * und das kann nur, wer beide Zahlen führt.
 */
export interface EmailIntakeOutcome {
  /** Die entstandenen Anhänge, in ihrer Reihenfolge am Todo. */
  readonly attached: readonly AttachmentView[];
  /** Die nicht entstandenen, mit Namen und Grund. */
  readonly failed: readonly EmailAttachmentFailure[];
}

/** Das Todo und seine Anhänge — das Ergebnis von {@link attachEmailToNewTodo}. */
export interface TodoWithEmailAttachments<T> {
  /** Was die übergebene Anlegefunktion zurückgegeben hat, unverändert. */
  readonly created: T;
  readonly attachments: EmailIntakeOutcome;
}

/**
 * Was eine Anlegefunktion zurückgeben muß, damit an ihr Ergebnis Anhänge
 * gehängt werden können.
 *
 * `todoId` ist die Kennung, die **in diesem Aufruf** entstanden ist. Sie kommt
 * aus der Funktion und nicht aus einer Anfrage — das ist A-A-21′ (b), und es
 * ist der einzige Weg, auf dem diese Datei je eine Kennung sieht.
 */
export interface FreshTodo<T> {
  readonly todoId: TodoId;
  readonly value: T;
}

// ---------------------------------------------------------------------------
// Die Naht
// ---------------------------------------------------------------------------

/**
 * Legt ein Todo an und hängt die Anhänge aus der E-Mail daran (A-19.22 bis
 * A-19.33).
 *
 * ---------------------------------------------------------------------------
 * Warum eine Funktion als Parameter und nicht eine Kennung
 * ---------------------------------------------------------------------------
 *
 * Weil A-A-21′ (c) verlangt, daß die Fähigkeit „nur an einer frisch erzeugten
 * Kennung greift, **und das steht im Typ**". Eine Signatur
 * `(context, todoId, intake)` wäre dieselbe Fähigkeit mit einer Zusage
 * daneben, und eine Zusage daneben ist das, was am 2026-09-10 sechsmal das
 * Gegenteil des Bestands behauptet hat.
 *
 * Hier ist es keine Zusage: Der einzige Weg, an eine Kennung zu kommen, führt
 * durch `create`, und `create` ist der Anlegevorgang. Wer diese Funktion mit
 * einer **fremden** Kennung aufrufen will, müßte eine Anlegefunktion
 * schreiben, die nichts anlegt und eine fremde Kennung zurückgibt — das ist
 * kein Versehen mehr, das ist ein Entschluß, und er steht im Quelltext.
 *
 * ---------------------------------------------------------------------------
 * Warum erst das Todo und dann die Bytes
 * ---------------------------------------------------------------------------
 *
 * A-A-83 verlangt: „Scheitert das Anlegen des Todos, werden alle in diesem
 * Lauf geschriebenen Dateien entfernt." Die billigste Art, das zu erfüllen,
 * ist, in diesem Fall gar nichts geschrieben zu haben. Scheitert `create`,
 * kehrt diese Funktion zurück, **bevor** ein Byte entsteht; die Messung dazu
 * zählt den Ordner und findet null, ohne daß eine Aufräumroutine gelaufen ist.
 *
 * Der umgekehrte Halbzustand bleibt und wird behandelt: Das Todo steht, eine
 * Datei liegt, ihre Zeile scheiterte. Dann geht die Datei (unten), und der
 * Anhang erscheint mit Namen und Grund in {@link EmailIntakeOutcome.failed}.
 * Von den beiden möglichen Halbzuständen ist „Todo ohne diesen Anhang, und es
 * steht dabei" der behebbare.
 *
 * ---------------------------------------------------------------------------
 * Warum ein `Logger` in der Signatur steht
 * ---------------------------------------------------------------------------
 *
 * Weil genau **ein** Zustand dieser Funktion kein Ergebnis ist, sondern ein
 * Defekt: eine geworfene Anhangstransaktion. Er wird seit E-111 nicht mehr
 * weitergeworfen — sonst entstünde aus einer 500 ein zweites Todo mit
 * derselben Call-Nummer —, und was nicht geworfen wird, muß geschrieben
 * werden, sonst ist es verschwunden.
 *
 * Der `Logger` steht deshalb **in der Signatur** und nicht im `AppContext`:
 * `AppContext` trägt Ports, also Dinge, die diese Funktion **benutzt**, um ihre
 * Arbeit zu tun. Das Protokoll gehört nicht zur Arbeit; es ist die
 * Betriebsschicht des Dienstes. Wer die Signatur liest, sieht beides getrennt —
 * und sieht zugleich, daß diese Funktion überhaupt etwas zu protokollieren
 * hat, was für keine ihrer Nachbarinnen gilt.
 */
export async function attachEmailToNewTodo<T>(
  context: AppContext,
  intake: EmailIntake,
  create: () => Promise<UseCaseResult<FreshTodo<T>>>,
  logger: Logger,
): Promise<UseCaseResult<TodoWithEmailAttachments<T>>> {
  const created = await create();
  if (!created.ok) {
    // Kein Byte geschrieben, kein Aufräumen nötig (A-A-83). Der Fehler des
    // Anlegevorgangs geht unverändert zurück — diese Datei hat ihm nichts
    // hinzuzufügen.
    return err(created.error);
  }

  const todoId = created.value.todoId;
  const sender = normalizeSender(intake.sender);
  const timestamp = now(context);

  const failed: EmailAttachmentFailure[] = [
    // Die Fehlschläge des Aufgabenbereichs stehen **vorn**: Sie betreffen
    // Dateien, die vor allen anderen an der Reihe waren, und der Benutzer
    // liest sie in der Reihenfolge, in der sie entstanden sind.
    ...intake.failed.map((entry) => ({
      displayName: shortenEmailDisplayName(entry.displayName),
      reason: entry.reason,
      bytes: entry.bytes,
    })),
  ];

  /**
   * Was geschrieben wurde und noch keinen Eigentümer hat.
   *
   * Die Liste ist das Gegenstück zu A-A-83: Was am Ende noch darin steht, wird
   * entfernt. Sie führt den **Pfad** — denselben Wert, der in
   * `todo_attachment.target` ginge —, weil der Blob-Port genau diesen Wert
   * zurückprüft.
   */
  const written: { readonly path: string; readonly index: number }[] = [];
  const pending: (AttachmentCreate & { readonly displayName: string })[] = [];

  let bytesBefore = 0;
  let countBefore = 0;

  /**
   * Eine Datei: messen, benennen, ablegen.
   *
   * Die Reihenfolge der drei Schritte ist Inhalt. Gemessen wird **vor** dem
   * Benennen, damit eine zu große Datei nicht erst einen Namen bekommt;
   * benannt wird **vor** dem Ablegen, damit eine Umleitungsendung nie eine
   * Datei wird (A-19.23c).
   */
  const take = async (
    displayName: string,
    base64: string,
    rebuilt: boolean,
  ): Promise<void> => {
    const shown = shortenEmailDisplayName(displayName);

    /*
     * **Schritt 1: messen** (A-A-81).
     *
     * Zuerst an der Base64-Zeichenkette — das ist keine Ankündigung, sondern
     * eine Rechnung über die Nutzlast selbst, und sie erspart es, 40 MB zu
     * dekodieren, um festzustellen, daß sie zu viel sind. Ist die Zeichenkette
     * keine gültige Base64-Form, ist das `rejected` und kein Größenproblem.
     */
    const announced = decodedBase64ByteLength(base64);
    if (announced === null) {
      failed.push({ displayName: shown, reason: 'rejected', bytes: null });
      return;
    }
    const verdict = admitEmailAttachment({ bytes: announced, bytesBefore, countBefore });
    if (!verdict.ok) {
      /*
       * **Die Zahl steht nur bei `too_large`** (A-19.30b). Sie ist die Größe
       * *dieser* Datei, und nur der Satz zu `too_large` spricht über sie:
       * „zu groß (31,4 MB). Die Grenze liegt bei 25,0 MB je Datei."
       *
       * Bei `total_too_large` und `too_many` wäre dieselbe Zahl kein
       * Näherungswert, sondern eine zweite Aussage neben einem Satz, der von
       * etwas anderem handelt — von der Summe oder von der Anzahl. Genau
       * daraus entstand der Widerspruch, den T-308 F-1 gemeldet hat.
       */
      failed.push({
        displayName: shown,
        reason: verdict.reason,
        bytes: verdict.reason === 'too_large' ? announced : null,
      });
      return;
    }

    /*
     * **Schritt 2: benennen** (A-A-78).
     *
     * `nameEmailFile` liefert die Endung, die an den erzeugten Namen kommt —
     * oder eine Ablehnung. Der fremde Name selbst geht von hier aus **nur** in
     * `displayName` weiter und nie in einen Pfad.
     *
     * Abgelehnt wird nach **A-19.23c**: die fünf Umleitungsarten (`.lnk`,
     * `.url`, `.pif`, `.scf`, `.desktop`), die beim Öffnen nicht sich
     * selbst starten. Bis zum 2026-09-12 stand das auf einer Annahme aus
     * T-299; seither steht es in der Spezifikation, und diese Zeile zeigt
     * auf die Anforderung statt auf einen Entschluß beim Bauen.
     */
    const naming = nameEmailFile(displayName);
    if (!naming.ok) {
      failed.push({ displayName: shown, reason: naming.reason, bytes: null });
      return;
    }

    /*
     * **Schritt 3: ablegen.**
     *
     * Dekodiert wird erst hier, und die Größe wird an den **dekodierten** Bytes
     * ein zweites Mal gemessen — dort, wo sie wirklich geschrieben werden. Die
     * Rechnung aus Schritt 1 ist genau; diese Messung ist der Boden darunter,
     * und sie kostet nichts.
     */
    const data = Buffer.from(base64, 'base64');
    const stored = await context.attachmentBlobs.storeEmailFile(data, naming.extension);
    if (!stored.ok) {
      failed.push({
        displayName: shown,
        reason: stored.reason === 'too_large' ? 'too_large' : 'rejected',
        bytes: stored.reason === 'too_large' ? data.byteLength : null,
      });
      return;
    }

    bytesBefore += stored.bytes;
    countBefore += 1;
    written.push({ path: stored.path, index: pending.length });
    pending.push({
      todoId,
      // Eine übernommene Datei ist ein **gewöhnlicher** Dateianhang (A-19.26).
      // Keine vierte Art: Für sie gilt A-19.18 unverändert, sie öffnet sich nie
      // von selbst, und vor dem Öffnen nennt die Oberfläche den vollen Pfad.
      kind: 'file',
      // `title` bleibt leer: Er ist die Bezeichnung, die der **Benutzer**
      // wählt (A-19.10). Was der Absender die Datei genannt hat, steht in
      // `displayName` — zwei Tatsachen, zwei Felder.
      title: null,
      target: stored.path,
      now: timestamp,
      origin: 'email',
      originSender: sender,
      displayName: shown,
      rebuilt,
    });
  };

  // Die Nachricht zuerst (A-19.22, A-19.33: „die E-Mail als Datei und die
  // beiden ursprünglichen Dateien" — in dieser Reihenfolge).
  if (intake.message !== null) {
    await take(intake.message.displayName, intake.message.base64, intake.message.rebuilt);
  }
  for (const file of intake.files) {
    await take(file.displayName, file.base64, false);
  }

  // Die Cloud-Anhänge zuletzt: Sie sind Verweise und keine Dateien (A-19.25),
  // sie kosten kein Byte und keine Grenze — nur die Anzahl.
  for (const link of intake.links) {
    const shown = shortenEmailDisplayName(link.displayName);
    if (countBefore >= MAX_EMAIL_ATTACHMENT_COUNT) {
      // `too_many` und nicht `rejected` (A-19.30b): Es ist dieselbe Grenze,
      // die eine Datei an dieser Stelle stoppt, also derselbe Grund. Ein
      // Verweis kostet kein Byte, aber er zählt — und was zählt, kann zu viel
      // werden.
      failed.push({ displayName: shown, reason: 'too_many', bytes: null });
      continue;
    }
    /*
     * **Die Positivliste auf dem geparsten Schema, nicht „beginnt mit"**
     * (A-A-2, 39.5.4). `normalizeAttachmentLink` prüft alle fünf Bedingungen —
     * Schema, Wirt vorhanden, keine Zugangsdaten, Länge, keine Steuerzeichen
     * vor dem Zerlegen — und liefert den **Festpunkt der Normalform** (A-A-3).
     *
     * Ein Präfixvergleich wäre derselbe Fehler wie `startsWith` bei der
     * Herkunftsprüfung: `https://evil@…`, `http:/\…` und ein führendes
     * Leerzeichen kommen daran anders heraus als am Parser.
     */
    const normalized = normalizeAttachmentLink(link.url);
    if (!normalized.ok) {
      failed.push({ displayName: shown, reason: 'not_a_web_address', bytes: null });
      continue;
    }
    countBefore += 1;
    pending.push({
      todoId,
      kind: 'link',
      title: null,
      target: normalized.url,
      now: timestamp,
      origin: 'email',
      originSender: sender,
      displayName: shown,
      // Ein Verweis ist nie ein Nachbau: Nachgebaut wird eine Nachricht, und
      // ein Cloud-Anhang ist keine. Der Typ von {@link IncomingEmailLink} führt
      // das Feld deshalb gar nicht.
      rebuilt: false,
    });
  }

  /*
   * Die Zeilen, in **einer** Transaktion.
   *
   * Ein `create` je Zeile und kein Sammel-Insert: `AttachmentPort.create`
   * vergibt die Stelle (`position`) selbst, in derselben Transaktion, und das
   * ist die Zusage aus A-19.8, die eine stabile Reihenfolge trägt.
   *
   * ---------------------------------------------------------------------------
   * Die Klammer darum ist A-A-83 und keine Vorsicht (T-307 Befund 1, T-309)
   * ---------------------------------------------------------------------------
   *
   * Bis T-309 stand dieser Ruf **nackt** da. Ein `Result`-Fehlschlag einer
   * einzelnen Zeile räumte auf; ein **Wurf** aus der Transaktion nicht —
   * `SQLITE_BUSY`, ein Fehler beim Vergeben der Stelle, eine versehentlich
   * verschachtelte Transaktion. Dann verließ der Wurf diese Funktion, und die
   * Dateien aus {@link written} blieben **ohne Eigentümer** im
   * Anwendungsdatenverzeichnis liegen: Kundenmaterial, das keine Zeile mehr
   * nennt und das niemand mehr findet. A-A-83 war damit zur Hälfte erfüllt —
   * der behandelte Fehlschlag räumte auf, der geworfene nicht.
   *
   * **Warum die Klammer genügt und keine zweite Transaktion nötig ist.** Der
   * Transaktionsport nimmt bei einem Wurf aus der Arbeit ein `ROLLBACK` vor,
   * **bevor** er weiterwirft (`packages/storage/src/sqlite/unit-of-work.ts`).
   * Nach einem Wurf steht deshalb fest: Es gibt **keine** Zeile aus diesem Lauf.
   * Genau deshalb darf hier **jede** geschriebene Datei fallen — nicht nur die,
   * von denen wir wissen, daß sie keine Zeile bekamen. Ohne diese Zusage wäre
   * dasselbe Aufräumen das Gegenteil: gelöschtes Kundenmaterial **mit**
   * Eigentümer, und das ist unwiederbringlich (A-A-18).
   *
   * **Was die Klammer nicht kann.** Sie ist eine Zusage am **Aufrufstapel** und
   * reicht so weit wie der Prozeß: Wird der Dienst zwischen dem Schreiben einer
   * Datei und dem `COMMIT` hart beendet — abgeschossen, Stromausfall —, bleibt
   * die Datei liegen. Dagegen steht seit T-309 der Aufräumlauf beim Start
   * ({@link ../../features/todos/email-file-sweep.ts}), gebaut nach dem Vorbild
   * des Laufs für Bildkopien und mit denselben zwei Riegeln.
   *
   * ---------------------------------------------------------------------------
   * Warum der Wurf **nicht** weitergereicht wird (E-111, T-309 Nacharbeit)
   * ---------------------------------------------------------------------------
   *
   * Bis zur zweiten Fassung dieser Klammer wurde der Fehler nach dem Aufräumen
   * weitergeworfen. Die Route antwortete dann 500 — **obwohl das Todo stand**.
   * Der Benutzer las „Fehler", drückte noch einmal und bekam ein zweites Todo
   * mit derselben Call-Nummer: ein Schaden, den er nicht verursacht hat und
   * nicht sehen konnte, und genau der Fall, gegen den A-10.9 und die
   * Duplikatwarnung gebaut sind.
   *
   * **Die Regel, und sie gilt über diesen Fall hinaus: Eine Antwort darf den
   * Aufrufer nicht dazu bringen, etwas zu wiederholen, das bereits geschehen
   * ist.** Was das Todo betrifft, ist der Vorgang gelungen; was die Anhänge
   * betrifft, ist er vollständig fehlgeschlagen — und A-19.29 kennt diesen
   * Zustand bereits: „Ein Todo, das mit weniger Anhängen entsteht als die
   * E-Mail trägt, sagt das." **Null ist weniger.**
   *
   * Der Einwand gegen diese Form ist notiert und nicht unbegründet: Ein Wurf
   * ist ein **unerwarteter** Zustand, und ihn als gewöhnliches Ergebnis
   * auszugeben verwischt das. Deshalb die zweite Hälfte der Auflage: **Der
   * Wurf verschwindet nicht.** Er geht mit `error` ins Protokoll, mit einem
   * eigenen Grund, und er ist die einzige Stelle in dieser Datei, die diese
   * Stufe benutzt.
   *
   * Gemeldet wird je Zeile `rejected` — „SuperTakt hat die Datei nicht
   * angenommen". Das ist dieselbe Kennung, die zwölf Zeilen tiefer eine
   * **einzelne** gescheiterte Zeile bekommt, und sie stimmt aus demselben
   * Grund: Die Bytes waren da, die Zeile nicht. Ein eigener Grund dafür wäre
   * ein zehnter Wert in einer geschlossenen Menge, der dem Benutzer nichts
   * sagt, was er nicht schon läse — er kann in beiden Fällen genau dasselbe
   * tun (A-19.30b gilt für **Grenzen**, nicht für Innenleben).
   */
  let rows: { readonly views: readonly AttachmentView[]; readonly rejected: readonly number[] };
  try {
    rows = await context.transactions.inTransaction(async (unit) => {
      const views: AttachmentView[] = [];
      const rejected: number[] = [];
      for (const [index, input] of pending.entries()) {
        const outcome = await unit.attachments.create(input);
        if (outcome.ok) views.push(toAttachmentView(outcome.value));
        else rejected.push(index);
      }
      return { views, rejected };
    });
  } catch {
    /*
     * Jede Datei einzeln, und ein Fehlschlag beim Entfernen hält die übrigen
     * nicht auf: Der Adapter beantwortet ihn mit `failed` und schreibt seine
     * eigene Protokollzeile (`attachment_email_remove_failed`). Wirft eine
     * fremde Portfassung trotzdem, darf sie die zweite Datei nicht am Leben
     * lassen — dieselbe Bauart wie beim `ROLLBACK` eine Ebene tiefer.
     */
    for (const entry of written) {
      try {
        await context.attachmentBlobs.removeEmailFile(entry.path);
      } catch {
        /* Der Adapter hat dafür seine Zeile. Weiter zählt die Zeile darunter. */
      }
    }

    /*
     * **Die Stufe ist `error` und nicht `warn`**, und das ist der Unterschied
     * zu jedem anderen Fehlschlag in dieser Datei: Ein übersprungener Anhang
     * ist ein Ergebnis, eine geworfene Transaktion ist ein Defekt.
     *
     * **Der Wurf selbst steht nicht in der Zeile**, und das ist keine
     * Nachlässigkeit, sondern B-2.4 und T-132: `Logger` hat keinen Parameter,
     * in den ein Ausnahmeobjekt paßt, `error.message` trägt bei einem
     * Dateisystem- oder SQLite-Fehler regelmäßig einen **Pfad**, und der Grund
     * läuft ohnehin durch einen engen Zeichenvorrat. Was die Zeile trägt, sind
     * Zahlen: wie viele Zeilen entstehen sollten und wie viele Dateien dafür
     * wieder fortgeräumt wurden.
     */
    logger.lifecycle(
      'error',
      'Die Anhänge einer aus Outlook angelegten Aufgabe ließen sich nicht eintragen. Die Aufgabe ist angelegt, ihre Anhänge sind es nicht; die bereits abgelegten Dateien wurden wieder entfernt.',
      `attachment_email_rows_threw rows=${String(pending.length)} files=${String(written.length)}`,
    );

    /*
     * Jede geplante Zeile wird **namentlich** gemeldet (A-19.29). Die
     * Reihenfolge ist die des Rufs, und sie schließt an die Fehlschläge an,
     * die vorher schon dastanden.
     */
    for (const input of pending) {
      failed.push({ displayName: input.displayName, reason: 'rejected', bytes: null });
    }

    return ok({
      created: created.value.value,
      attachments: { attached: [], failed },
    });
  }

  /*
   * A-A-83, zweite Hälfte: Was keine Zeile bekommen hat, bleibt nicht liegen.
   *
   * Gemeldet wird es als `rejected` — SuperTakt hat die Datei nicht
   * angenommen, und das stimmt: Die Bytes waren da, die Zeile nicht.
   */
  const rejectedIndices = new Set(rows.rejected);
  for (const entry of written) {
    if (!rejectedIndices.has(entry.index)) continue;
    const input = pending[entry.index];
    failed.push({
      displayName: input?.displayName ?? '',
      reason: 'rejected',
      bytes: null,
    });
    await context.attachmentBlobs.removeEmailFile(entry.path);
  }

  return ok({
    created: created.value.value,
    attachments: { attached: rows.views, failed },
  });
}

// ---------------------------------------------------------------------------
// Die Fähigkeit, wie das Add-in sie bekommt
// ---------------------------------------------------------------------------

/**
 * Die Anhangsübernahme als **Fähigkeit** — ohne `AppContext` in der Signatur.
 *
 * ---------------------------------------------------------------------------
 * Wofür dieser Typ da ist
 * ---------------------------------------------------------------------------
 *
 * Die Add-in-Routen bekommen nicht den vollen `AppContext`, sondern `AddinDeps`
 * — einen absichtlich schmalen Ausschnitt (`routes/addin/ports.ts`). Der Grund
 * steht dort: Das Add-in weist sich mit dem **dauerhaften** Token aus, und ein
 * entwendetes Token kommt genau so weit, wie diese Fläche reicht.
 *
 * Diese Fähigkeit paßt in diesen Ausschnitt, weil sie nichts von ihm verlangt,
 * was er nicht ohnehin hat: Sie nennt weder `AppContext` noch einen Port noch
 * ein Verzeichnis. Sie ist im Zusammenbau einmal an den Zusammenhang gebunden
 * (`createEmailAttachmentIntake`) und danach eine Funktion wie jede andere.
 *
 * ---------------------------------------------------------------------------
 * Und wofür er **nicht** da ist
 * ---------------------------------------------------------------------------
 *
 * Er ist kein schreibender `AttachmentPort` für ein bestehendes Todo (A-A-21′
 * (c)). Er kann gar keines erreichen: Sein einziger Zugang zu einer Kennung
 * ist die Funktion, die der Aufrufer mitgibt — und die **legt an**. Wer diese
 * Fähigkeit auf ein vorhandenes Todo richten wollte, müßte eine Anlegefunktion
 * schreiben, die nichts anlegt. Das ist kein Versehen, sondern ein Entschluß,
 * und er stünde im Quelltext.
 */
export type EmailAttachmentIntake = <T>(
  intake: EmailIntake,
  create: () => Promise<UseCaseResult<FreshTodo<T>>>,
) => Promise<UseCaseResult<TodoWithEmailAttachments<T>>>;

/**
 * Bindet {@link attachEmailToNewTodo} einmal an den Zusammenhang.
 *
 * Gerufen im Zusammenbau (`app.ts`) und nirgends sonst — dieselbe Regel wie
 * für jeden Port: Wer wissen will, was eine Route anspricht, liest ihre
 * Abhängigkeiten und nicht einen Dienstsucher.
 */
export function createEmailAttachmentIntake(
  context: AppContext,
  logger: Logger,
): EmailAttachmentIntake {
  return (intake, create) => attachEmailToNewTodo(context, intake, create, logger);
}

// ---------------------------------------------------------------------------
// Der Absender
// ---------------------------------------------------------------------------

/**
 * Die längste Absenderangabe, die in den Bestand geht (Migration 0023).
 *
 * 640 Zeichen: das Doppelte der längsten Adresse nach RFC 5321 (64 + 1 + 255),
 * damit ein Anzeigename davor Platz hat. Was länger ankommt, wird **am Ende**
 * abgeschnitten — und das ist hier richtig, anders als beim Dateinamen: Ein
 * Absender hat keine Endung, an der etwas über Gefährlichkeit stünde. Was er
 * hat, steht vorn.
 */
const MAX_SENDER_CHARACTERS = 640;

/** Leer heißt `null` und nicht `''` — der Bestand kennt für „gibt es nicht" einen Wert. */
function normalizeSender(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const characters = [...trimmed];
  if (characters.length <= MAX_SENDER_CHARACTERS) return trimmed;
  return characters.slice(0, MAX_SENDER_CHARACTERS).join('');
}
