/**
 * Takt — die Anwendungsfälle des Add-ins (A-9.5, A-10.4, A-10.5, A-10.9, R-15).
 *
 * Kein HTTP, kein Hono, kein `Request`. Alles hier nimmt Werte entgegen und
 * gibt Werte zurück; der Router daneben übersetzt nur zwischen JSON und diesen
 * Aufrufen. Damit ist jeder Anwendungsfall ohne laufenden Dienst prüfbar —
 * `apps/outlook-addin/scripts/proof-addin.mjs` ruft sie über den Router auf,
 * könnte sie aber ebenso gut unmittelbar aufrufen.
 */

import type {
  CalendarDay,
  CallNumberRejection,
  DefaultTag,
  EmailAttachmentFailureReason,
  Pool,
  Result,
  StatusId,
  Tag,
  TagId,
  TagTree,
  TaktError,
  Timestamp,
  Todo,
  TodoId,
  TodoStatus,
} from '@takt/domain';
import { applyDefaultTags, checkCallNumber, checkTagNames, err, ok } from '@takt/domain';

// The add-in service evaluates no pool rule and computes no pool movement:
// the add-in books nothing (E-120), so a match carries no movement (E-125 point 1).
import { AbortTodoCreate, resolveTagNames } from '../../tag-names.ts';
/*
 * Die **Gestalten** der Anhangsübernahme, nicht ihre Umsetzung.
 *
 * Nur Typen: Diese Datei ruft die Fähigkeit über `deps.emailAttachments` und
 * nicht über einen Import. Das ist derselbe Grundsatz wie bei jedem Port —
 * wer wissen will, was diese Routen ansprechen, liest ihre Abhängigkeiten und
 * nicht einen Dienstsucher.
 */
import type {
  EmailIntake,
  IncomingEmailFile,
  IncomingEmailLink,
  IncomingEmailMessage,
} from '../../features/todos/email-attachments.ts';

import type { AddinDeps } from './ports.ts';

// A-10.4 — alles, was der Aufgabenbereich beim Öffnen braucht, in einem Zug

/**
 * Der Startzustand des Aufgabenbereichs.
 *
 * Ein Aufruf statt vier. Nicht aus Sparsamkeit: Ein Aufgabenbereich in Outlook
 * wird bei **jeder** geöffneten E-Mail neu aufgebaut, und vier nacheinander
 * laufende Anfragen über eine gerade erst aufgebaute Verbindung sind der
 * Unterschied zwischen „ist schon da" und „lädt schon wieder".
 *
 * `defaultTagIds` steht getrennt neben dem Baum, weil S-12 die Standard-Tags
 * **als solche gekennzeichnet** zeigen muss (A-9.3, A-9.5). Ohne die Trennung
 * sähe der Benutzer drei Chips und wüsste nicht, welche davon er selbst gewählt
 * hat.
 */
export interface AddinContext {
  readonly mailAssignment: { readonly accepted: boolean };
  readonly tagTree: TagTree;
  readonly pools: readonly Pool[];
  readonly statuses: readonly TodoStatus[];
  readonly defaultStatusId: StatusId;
  readonly defaultTagIds: readonly TagId[];
  /**
   * **Daß** dieser Dienst Anhänge aus einer E-Mail annimmt (A-19.22, E-108).
   *
   * ---------------------------------------------------------------------------
   * Warum hier keine Zahlen stehen — und warum der Block trotzdem steht
   * ---------------------------------------------------------------------------
   *
   * Die drei Grenzen (25 MB je Datei, 48 MB in der Summe, 25 Stück) sind eine
   * **Fachregel** und stehen in `packages/domain` als
   * `MAX_EMAIL_ATTACHMENT_BYTES`, `…_TOTAL_BYTES` und `…_COUNT`. Der
   * Aufgabenbereich liest sie von dort — er führt `@takt/domain` ohnehin, und
   * dieselbe Zahl über zwei Wege zu verteilen ist die Bauart, aus der die
   * Titellänge vor T-114 auseinandergelaufen ist.
   *
   * Was er **nicht** aus einem Paket lesen kann, ist diese Auskunft hier:
   * Add-in und Dienst werden getrennt installiert und können auseinanderlaufen.
   * Ein neuer Aufgabenbereich an einem älteren Dienst würde sonst Anhänge
   * einsammeln, die dessen Tür nicht liest — und still verlieren (A-19.31).
   * Fehlt dieses Feld, bietet der Aufgabenbereich die Übernahme gar nicht an,
   * und es gibt keinen Satz darüber (E-100 Punkt 3).
   *
   * Deshalb genau ein Feld und kein zweites: `accepted`. Es ist heute immer
   * `true` — der Dienst, der diese Zeile ausliefert, ist derselbe, der die Tür
   * führt. Ein `false` wäre eine Behauptung über eine Fläche, die es in
   * demselben Erzeugnis gibt.
   */
  readonly emailAttachments: AddinEmailAttachmentSupport;
}

/** Siehe {@link AddinContext.emailAttachments}. */
export interface AddinEmailAttachmentSupport {
  readonly accepted: boolean;
}

export const loadContext = (deps: AddinDeps): Promise<AddinContext> =>
  deps.inTransaction(async (unit) => {
    const [tagTree, pools, statuses, defaultStatus, defaults] = await Promise.all([
      unit.folders.loadTree(),
      unit.pools.list(),
      unit.statuses.list(),
      unit.statuses.defaultStatus(),
      unit.defaultTags.list(),
    ]);

    return {
      tagTree,
      pools,
      statuses,
      defaultStatusId: defaultStatus.id,
      defaultTagIds: orderedDefaultTagIds(defaults),
      /*
       * Eine Konstante und keine Abfrage: Die Tür, die Anhänge annimmt, steht
       * in derselben Datei wie diese Route und wird im selben Erzeugnis
       * ausgeliefert. Was hier nachgesehen werden könnte, gäbe es nicht.
       */
      emailAttachments: { accepted: true },
      mailAssignment: { accepted: deps.assignMail !== undefined },
    };
  });

/** Standard-Tags in ihrer konfigurierten Reihenfolge (A-9.1). */
const orderedDefaultTagIds = (defaults: readonly DefaultTag[]): readonly TagId[] =>
  [...defaults].sort((left, right) => left.position - right.position).map((entry) => entry.tagId);

// A-10.9 / R-15 — das Duplikatangebot

/**
 * Ein gefundenes Todo, so wie es dem Benutzer **vor** der Entscheidung gezeigt
 * wird.
 *
 * Enthält absichtlich mehr als die Kennung: Titel, Call-Nummer, Tags und die
 * Aufteilung der bereits gebuchten Zeit in offen und exportiert. Grund ist
 * R-15 und Punkt 16 aus T-005: Eine anonyme Ja/Nein-Frage („Auf vorhandenes
 * Todo buchen?") beantwortet jeder mit Ja. Titel und Kundentag lassen einen
 * Menschen den falschen Vorgang sofort erkennen, bevor die E-Mail an ihn geht
 * (A-10.11).
 */
export interface AddinTodoMatch {
  readonly id: TodoId;
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: StatusId;
  readonly tagIds: readonly TagId[];
  /** `null` bedeutet aktiv (A-2.4). Ein erledigtes Todo wird gekennzeichnet. */
  readonly completedAt: Timestamp | null;
  readonly openSeconds: number;
  readonly exportedSeconds: number;
}

export type AddinMatchResult =
  /**
   * Es wurde **nicht gesucht**, weil der Wert keine plausible Call-Nummer ist
   * (B-4.3 Punkt 4). Bewusst ein eigener Fall und nicht „keine Treffer": Das
   * Add-in soll sagen können, warum es nichts anbietet.
   *
   * `CallNumberRejection` statt `string` (T-046): Der Grund kommt wörtlich aus
   * `checkCallNumber`, und der Router beschriftet ihn über einen `Record` über
   * denselben Typ. Als `string` konnte der Router nur raten und brauchte einen
   * Ersatztext; jetzt bricht `tsc`, wenn die Domäne einen Grund aufnimmt, für
   * den niemand einen Satz geschrieben hat.
   */
  | { readonly kind: 'not_searched'; readonly reason: CallNumberRejection }
  | { readonly kind: 'searched'; readonly callNumber: string; readonly matches: readonly AddinTodoMatch[] };

/**
 * Sucht Todos mit derselben Call-Nummer (A-10.9).
 *
 * Der erste Schritt ist die Plausibilisierung, und er ist der wichtige: Ein
 * leerer, ein nur aus Leerzeichen bestehender und ein unplausibler Wert führen
 * **nie** zu einer Abfrage. Genau hier bricht die Kette aus R-15 — ein zu
 * weiter regulärer Ausdruck kann noch so viel „erkennen", es entsteht kein
 * Übereinstimmungskriterium daraus.
 */
export const findMatches = async (
  deps: AddinDeps,
  rawCallNumber: unknown,
): Promise<AddinMatchResult> => {
  const checked = checkCallNumber(rawCallNumber);
  if (!checked.ok) {
    return { kind: 'not_searched', reason: checked.reason };
  }

  const callNumber = checked.value;

  return deps.inTransaction(async (unit) => {
    const found = await unit.todos.findByCallNumber(callNumber);

    const matches = await Promise.all(
      found.map(async (todo): Promise<AddinTodoMatch> => {
        const [openSeconds, exportedSeconds] = await Promise.all([
          unit.timeEntries.sumSeconds({ todoId: todo.id, exportStatus: 'open' }),
          unit.timeEntries.sumSeconds({ todoId: todo.id, exportStatus: 'exported' }),
        ]);

        return {
          id: todo.id,
          title: todo.title,
          callNumber: todo.callNumber,
          statusId: todo.statusId,
          tagIds: todo.tagIds,
          completedAt: todo.completedAt,
          openSeconds,
          exportedSeconds,
        };
      }),
    );

    return { kind: 'searched', callNumber, matches };
  });
};

// A-10.5 / A-9.5 — ein Todo aus der E-Mail anlegen

export interface AddinCreateTodoInput {
  readonly title: string;
  /** Bereits geprüft; `null` heißt „keine erkannt und keine eingetragen". */
  readonly callNumber: string | null;
  readonly statusId: StatusId | null;
  /** Die vom Benutzer ausdrücklich gewählten Tags. Ohne die Standard-Tags. */
  readonly tagIds: readonly TagId[];
  /**
   * Tags, die über ihren **Namen** benannt werden statt über eine Kennung
   * (T-058, T-061).
   *
   * Gibt es den Namen schon, wird das vorhandene Tag verwendet; gibt es ihn
   * nicht, entsteht eines — in **derselben** Transaktion wie das Todo. Wortlaut
   * und Wirkung sind dieselben wie bei `CreateTodoInput.tagNames` in
   * `features/todos/todos.ts`; das ist keine Ähnlichkeit, sondern die Bedingung
   * dafür, dass A-9.5 und T-058 auf beiden Wegen dasselbe bedeuten.
   *
   * Freiwillig, damit ein Aufrufer, der nur Kennungen benennt, nichts
   * hinschreiben muss. Die Route setzt über ihr Schema ohnehin `[]` ein.
   */
  readonly tagNames?: readonly string[];
  /** Der **interne Vermerk** (A-7.1, A-7.2). Nicht die Leistung. */
  readonly note: string;
  /**
   * Die **Frist** (A-19.21, E-074, T-149). Bereits geprüft; `null` heißt
   * „ohne Frist" und ist der Regelfall.
   *
   * Kein `?`: An dieser Tür gibt es nur zwei Zustände, und der Aufrufer soll
   * sie benennen. Beim **Ändern** wären „fehlt" und `null` zwei verschiedene
   * Anweisungen (A-19.3) — diese Tür ändert nichts, sie legt an, und ein
   * freiwilliges Feld würde die Unterscheidung nur nachbilden, ohne sie zu
   * haben. `tagNames` darüber ist freiwillig aus dem umgekehrten Grund: Dort
   * ist die Abwesenheit eine leere Liste und keine Aussage.
   */
  readonly dueTime?: string | null;
  readonly estimateMinutes?: number | null;
  readonly dueDate: CalendarDay | null;
  /**
   * Die Anhänge aus der geöffneten E-Mail (A-19.22 bis A-19.33, E-108).
   *
   * `null` heißt „ohne Anhänge" und ist der Zustand jedes Aufrufers, der die
   * Übernahme nicht benutzt. Die Gestalt ist dieselbe wie {@link EmailIntake}
   * in `features/todos/email-attachments.ts`, abzüglich des Feldes `failed`:
   * **Was der Aufgabenbereich selbst nicht übernehmen konnte, reist nicht über
   * die Leitung.** Er zeigt es an derselben Stelle wie die Erfolge, und er hat
   * dafür feinere Gründe (`too_many`, `total_too_large`) als der Dienst; sie
   * hier durch die gröbere Liste der Domäne zu schicken und zurückzuholen
   * nähme ihm die Auskunft, ohne irgendetwas zu gewinnen.
   *
   * **Keine Todo-Kennung, in keinem Feld.** Siehe `AddinDeps.emailAttachments`.
   */
  readonly attachments: AddinEmailAttachments | null;
}

/**
 * Was der Aufgabenbereich an Anhängen mitschickt — der geprüfte Wert.
 *
 * Der **Absender** steht am Umschlag und nicht am einzelnen Anhang: Er gehört
 * der Nachricht. Am Eintrag stünde er zweimal, und zwei Anhänge derselben
 * Anfrage könnten zwei verschiedene Herkünfte behaupten — die Rückfrage vor
 * dem Öffnen läse dann eine davon vor (A-A-85).
 */
export interface AddinEmailAttachments {
  readonly sender: string | null;
  readonly items: readonly AddinEmailAttachmentItem[];
}

/** Die drei Gestalten aus `emailAttachmentItemSchema`. */
export type AddinEmailAttachmentItem =
  | {
      readonly kind: 'message';
      readonly displayName: string;
      readonly contentBase64: string;
      readonly rebuilt: boolean;
    }
  | { readonly kind: 'file'; readonly displayName: string; readonly contentBase64: string }
  | { readonly kind: 'link'; readonly displayName: string; readonly url: string };

/**
 * Was der Dienst von den mitgeschickten Anhängen **wirklich** abgelegt hat
 * (A-19.29, A-19.33).
 *
 * ---------------------------------------------------------------------------
 * Was hier ausdrücklich **nicht** steht: der Pfad
 * ---------------------------------------------------------------------------
 *
 * `AttachmentView` führt `target`, und das ist bei einer übernommenen Datei der
 * **volle Pfad im Anwendungsdatenverzeichnis dieses Rechners** (Befund T-301).
 * Ein Pfad ist eine Ortsangabe über **einen** Rechner; er gehört in die
 * Hauptanwendung, die ihn vor dem Öffnen nennen muß, und nicht in ein
 * Browsersteuerelement innerhalb von Outlook.
 *
 * Der Aufgabenbereich braucht ihn auch nicht: Er braucht eine **Zahl** für
 * „3 Anhänge hängen daran" (A-19.33) und die **Namen** derer, die es nicht
 * geworden sind (A-19.29). Beides steht hier, und mehr nicht.
 */
export interface AddinCreatedAttachments {
  /** Wie viele Anhänge am neuen Todo hängen. */
  readonly stored: number;
  /** Was der Dienst nicht angenommen hat — mit Namen, Grund und Größe. */
  readonly rejected: readonly {
    readonly displayName: string;
    readonly reason: EmailAttachmentFailureReason;
    readonly bytes: number | null;
  }[];
}

export interface AddinCreateTodoResult {
  readonly todo: Todo;
  /** Welche Tags der Dienst ergänzt hat. Für die Rückmeldung in S-12. */
  readonly addedDefaultTagIds: readonly TagId[];
  /**
   * Welche Tags durch `tagNames` **neu entstanden** sind (T-058, T-061).
   *
   * Vollständige Tags und nicht nur Kennungen — genau wie bei `POST /todos`.
   * Der Aufgabenbereich zeigt den neuen Namen unmittelbar in der
   * Erfolgsmeldung, ohne `GET /addin/context` erneut zu holen; und der
   * Benutzer sieht, **dass** etwas Neues entstanden ist und nicht nur, dass
   * sein Todo angelegt wurde. Leer, wenn jeder genannte Name schon ein Tag
   * hatte.
   */
  readonly createdTags: readonly Tag[];
  /**
   * Was aus den mitgeschickten Anhängen geworden ist — oder `null`, wenn keine
   * mitgeschickt wurden.
   *
   * `null` und `{ stored: 0, rejected: [] }` sind **nicht** dasselbe: Das erste
   * heißt „es war keiner dabei", das zweite „es waren welche dabei, und keiner
   * ist angekommen". Der Aufgabenbereich schreibt daraus zwei verschiedene
   * Sätze (A-19.29, A-19.31).
   */
  readonly attachments: AddinCreatedAttachments | null;
}

/**
 * Legt ein Todo an (A-2.1, A-10.5, A-9.5, T-058).
 *
 * **A-9.5 hängt an diesen Zeilen.** Die Standard-Tags werden hier ergänzt, im
 * Dienst, mit `applyDefaultTags` aus `packages/domain` — derselben Funktion,
 * die auch die Oberfläche benutzt. Es gibt keinen zweiten Erzeugungspfad, der
 * abweichen könnte, und das Add-in schickt die Standard-Tags nicht mit. Ein
 * Aufrufer, der sie vergisst, kann sie damit nicht vergessen.
 *
 * `note` geht in den **internen Vermerk**, nicht in eine Buchungsnotiz
 * (B-12.3 Punkt 1). Aus einer E-Mail übernommener Text ist Kontext und gehört
 * nicht ungefragt an das Abrechnungstool.
 *
 * ---------------------------------------------------------------------------
 * Neue Tags: eine Transaktion, nicht zwei (T-061)
 * ---------------------------------------------------------------------------
 *
 * `tagNames` sind Namen statt Kennungen. Sie werden **innerhalb** derselben
 * Transaktion aufgelöst, in der das Todo entsteht, und zwar durch **dieselbe**
 * Funktion, die auch `createTodo` in `features/todos/todos.ts` benutzt:
 * `resolveTagNames` aus `src/tag-names.ts`. Bis T-062 stand hier eine
 * zweite, abgeschriebene Fassung — nicht aus Nachlässigkeit, sondern weil die
 * erste nicht exportiert war. Seit T-064 gibt es nur noch eine, und damit ist
 * die Gleichheit beider Wege keine Zusicherung mehr, sondern eine Tatsache:
 *
 *  - **Ein Tag, nicht zwei.** Zwei gleichzeitige Anfragen laufen nie
 *    ineinander (`TransactionPort` reiht sie), die zweite sieht das Tag der
 *    ersten und verwendet es. Fiele die Reihung, wiese `ux_tag_name_key` den
 *    zweiten gleichen Schlüssel strukturell ab. Der Schutz sitzt im Dienst und
 *    in der Datenbank, nicht in dieser Datei — deshalb trägt er für den
 *    Add-in-Weg genauso.
 *  - **Kein Tag ohne sein Todo.** Scheitert das Anlegen, ist auch das Tag
 *    wieder weg (`AbortTodoCreate`).
 *
 * Die Prüfung der Namen steht **davor** und ist rein: `checkTagNames` aus der
 * Domäne normalisiert, prüft und wirft Doppelte **innerhalb derselben Anfrage**
 * weg. Ohne diesen Schritt liefen „Backend" und „backend" in einer Anfrage in
 * den eindeutigen Index — für den Benutzer ein Name, für die Datenbank zwei.
 *
 * Der Fehlschlag ist ein **Wert** (`Result`) und kein Wurf: Ein Tagname, den es
 * zweimal gibt, ist eine Eingabe des Benutzers und kein Programmierfehler.
 *
 * ---------------------------------------------------------------------------
 * Die Anhänge: **um** diesen Anwendungsfall herum, nicht in ihm (T-304, E-108)
 * ---------------------------------------------------------------------------
 *
 * Sind Anhänge dabei, läuft nicht dieser Aufruf, sondern
 * `deps.emailAttachments(intake, create)` — und `create` ist genau die Funktion
 * hier darunter, unverändert. Die Verschachtelung ist die Umsetzung von
 * A-A-21′ (b)/(c):
 *
 *  - Die Fähigkeit bekommt **keine Kennung**, sondern die Funktion, die eine
 *    erzeugt. Sie sieht die Kennung erst, nachdem sie selbst das Anlegen
 *    ausgelöst hat.
 *  - Scheitert das Anlegen, ist **kein Byte** geschrieben worden — der Fehler
 *    kommt unverändert zurück, und es gibt nichts aufzuräumen (A-A-83).
 *  - Scheitert ein einzelner Anhang, steht das Todo trotzdem, und der Anhang
 *    erscheint mit Namen und Grund im Ergebnis (A-19.29). Von den beiden
 *    möglichen Halbzuständen ist „Todo ohne diesen Anhang, und es steht dabei"
 *    der behebbare.
 *
 * **Ohne Anhänge wird die Fähigkeit gar nicht gerufen.** Nicht aus
 * Sparsamkeit: Ein Aufruf mit leerem Umschlag legte eine zweite, leere
 * Transaktion um dieselbe Anlage und läse die Uhr ein zweites Mal. Der Weg
 * jedes Aufrufers, der keine Anhänge schickt, bleibt damit zeichengleich der
 * von gestern.
 */
export const createTodo = async (
  deps: AddinDeps,
  input: AddinCreateTodoInput,
): Promise<Result<AddinCreateTodoResult, TaktError>> => {
  const envelope = input.attachments;
  if (envelope !== null && envelope.items.length > 0) {
    const outcome = await deps.emailAttachments(toEmailIntake(envelope), async () => {
      const created = await createTodoOnly(deps, input);
      if (!created.ok) return err(created.error);
      return ok({ todoId: created.value.todo.id, value: created.value });
    });
    if (!outcome.ok) return err(outcome.error);
    return ok({
      ...outcome.value.created,
      attachments: {
        stored: outcome.value.attachments.attached.length,
        rejected: outcome.value.attachments.failed.map((entry) => ({
          displayName: entry.displayName,
          reason: entry.reason,
          bytes: entry.bytes,
        })),
      },
    });
  }
  return createTodoOnly(deps, input);
};

/**
 * Der Umschlag der Route in den Eingabewert der Fähigkeit.
 *
 * **Eine Umsortierung und keine Übersetzung.** Die Fähigkeit ordnet nach
 * Wirkung — die Nachricht zuerst, dann Dateien, dann Verweise, und das ist die
 * Reihenfolge am Todo (A-19.33). Der Rumpf ordnet nach der Reihenfolge der
 * Nachricht, weil der Aufgabenbereich sie so einsammelt. Beide Ordnungen sind
 * richtig; hier wird die eine in die andere gebracht, und **die Reihenfolge
 * innerhalb der Dateien bleibt erhalten**.
 *
 * `failed` bleibt leer, und das ist eine Entscheidung mit Grund: Was der
 * Aufgabenbereich selbst nicht übernehmen konnte, zeigt er selbst, mit seinen
 * eigenen — feineren — Gründen. Siehe {@link AddinCreateTodoInput.attachments}.
 */
export const toEmailIntake = (envelope: AddinEmailAttachments): EmailIntake => {
  let message: IncomingEmailMessage | null = null;
  const files: IncomingEmailFile[] = [];
  const links: IncomingEmailLink[] = [];

  for (const item of envelope.items) {
    if (item.kind === 'message') {
      /*
       * **Die erste Nachricht gewinnt, jede weitere wird eine Datei.**
       *
       * A-19.22 kennt genau eine E-Mail je Anlegeruf, und der Aufgabenbereich
       * schickt auch genau eine. Eine zweite fallen zu lassen wäre der stille
       * Ausfall aus A-19.31; sie als Nachricht zu behandeln hieße, `rebuilt`
       * an zwei Dateien zu schreiben. Also kommt sie als gewöhnlicher
       * Dateianhang an — sichtbar, gezählt, und ohne eine Kennzeichnung, die
       * für sie niemand geprüft hat (A-A-97).
       */
      if (message === null) {
        message = {
          displayName: item.displayName,
          base64: item.contentBase64,
          rebuilt: item.rebuilt,
        };
        continue;
      }
      files.push({ displayName: item.displayName, base64: item.contentBase64 });
      continue;
    }
    if (item.kind === 'file') {
      files.push({ displayName: item.displayName, base64: item.contentBase64 });
      continue;
    }
    links.push({ displayName: item.displayName, url: item.url });
  }

  return { sender: envelope.sender, message, files, links, failed: [] };
};

/** Das Anlegen selbst — unverändert seit T-061, und ohne jeden Anhang. */
const createTodoOnly = async (
  deps: AddinDeps,
  input: AddinCreateTodoInput,
): Promise<Result<AddinCreateTodoResult, TaktError>> => {
  // Rein, und deshalb vor der Transaktion: Eine unzulässige Eingabe soll gar
  // keine Klammer öffnen.
  const names = checkTagNames(input.tagNames ?? []);
  if (!names.ok) return err(names.error);

  try {
    return await deps.inTransaction(async (unit) => {
      const now = deps.now();
      const resolved = await resolveTagNames(unit, names.value, now);

      // Erst die ausdrücklich gewählten, dann die über den Namen benannten —
      // dieselbe Reihenfolge wie in `features/todos/todos.ts`. `applyDefaultTags`
      // fasst Doppelte zusammen, ohne die Reihenfolge zu verschieben.
      const selected: readonly TagId[] = [
        ...input.tagIds,
        ...resolved.all.map((tag) => tag.id),
      ];

      const defaults = await unit.defaultTags.list();
      const effectiveTagIds = applyDefaultTags(selected, defaults);

      const statusId = input.statusId ?? (await unit.statuses.defaultStatus()).id;

      const todo = await unit.todos.create(
        {
          title: input.title,
          callNumber: input.callNumber,
          statusId,
          // Beide Stellen tragen dieselbe, bereits ergänzte Liste. Der Vertrag
          // von `TodoPort.create` führt `tagIds` zweimal — einmal im Eingabewert,
          // einmal als zweites Argument — und legt nicht fest, welche der beiden
          // der Adapter liest. Solange der Adapter aus T-009 fehlt, ist das eine
          // offene Frage; sie hier durch Gleichheit zu beantworten kostet nichts
          // und kann A-9.5 nicht brechen. Ein Unterschied zwischen beiden wäre
          // die Art Annahme, die man erst in einer Abrechnung bemerkt.
          tagIds: effectiveTagIds,
          note: input.note,
          // A-19.21: Der Tag geht unverändert an denselben Port, den auch
          // `features/todos/todos.ts` benutzt. Es gibt keine zweite Schreibstelle
          // für die Frist und keine Umrechnung dazwischen — der Adapter
          // schreibt `dueDate ?? null`, und `null` ist hier bereits der Wert
          // und kein fehlendes Feld.
          dueDate: input.dueDate,
          dueTime: input.dueTime ?? null,
          estimateMinutes: input.estimateMinutes ?? null,
          now,
        },
        effectiveTagIds,
      );

      const chosen = new Set<TagId>(selected);

      return ok({
        todo,
        addedDefaultTagIds: effectiveTagIds.filter((tagId) => !chosen.has(tagId)),
        createdTags: resolved.fresh,
        /*
         * `null` und nicht `{ stored: 0, rejected: [] }`: Hier war kein Anhang
         * dabei. Der Unterschied trägt einen Satz im Aufgabenbereich — siehe
         * {@link AddinCreateTodoResult.attachments}.
         */
        attachments: null,
      });
    });
  } catch (error) {
    // Die Klammer hat bereits zurückgenommen — auch die Tags, die vor dem
    // Abbruch entstanden sind. Hier steht nur noch die Antwort.
    if (error instanceof AbortTodoCreate) return err(error.failure);

    // Kein fachlicher Fall. Der Wurf bleibt ein Wurf und endet als 500 mit
    // einem Satz ohne Innenleben (B-2.4).
    throw error;
  }
};

// The add-in booking use case (`bookOnTodo`) fell with E-120 (A-10.12, A-10.16).
