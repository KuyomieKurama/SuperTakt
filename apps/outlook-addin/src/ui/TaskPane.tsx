/**
 * SuperTakt — Aufgabenbereich des Outlook-Add-ins.
 *
 * Wird zu einer erkannten Call-Nummer bereits ein Todo gefunden, **meldet** der
 * Aufgabenbereich das und handelt nicht daran: keine Zeitbuchung, kein Anhang,
 * kein Wiederöffnen eines erledigten Todos (Entscheidung zu F-21, T-247). Die
 * einzige Handlung dieser Fläche ist das bewusste Anlegen eines neuen Todos.
 */

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';

import { CALL_NUMBER_INPUT_MESSAGE } from '@takt/domain';

import {
  CALL_NUMBER_BY_HAND,
  NO_CALL_NUMBER_FOUND,
  REJECTION_LABEL,
} from '../callnumber/labels.ts';
import type { Detection } from '../callnumber/detect.ts';
import { collectAttachments, type EntryProgress } from '../attachments/collect.ts';
import type { AttachmentPayload, MissingAttachment, TakeoverLimits } from '../attachments/model.ts';
import { TAKEOVER_LIMITS } from '../attachments/model.ts';
import { OUTLOOK_REQUIREMENT_HINT } from '../attachments/reasons.ts';
import { planTakeover } from '../attachments/plan.ts';
import { reconcileAttachments } from '../attachments/reconcile.ts';
import { decideLookup, describeOffers, type OfferDescription } from '../duplicate/rule.ts';
import { dueDateForRequest, readDueDate } from '../duedate/entry.ts';
import { prepareNote, suggestTitle, type MailFacts } from '../office/mail.ts';
import type { MailAttachmentAccess } from '../office/host.ts';
import { ATTACHMENTS_TRAVEL_WITH_CREATE, type ApiClient, type ApiFailure } from '../api/client.ts';
import type { AddinContextDto, CreatedAttachmentsDto } from '../api/types.ts';
import { cutToCharacterBoundary } from '../text/cut.ts';
import { createTodoGate } from './create-gate.ts';
import {
  AttachedList,
  AttachmentPreview,
  AttachmentProgress,
  MissingList,
  progressStatusLine,
  spokenSkips,
  type AttachedEntry,
} from './Attachments.tsx';
import { Button, Callout, Field, Foreign, Section, Skeleton } from './Primitives.tsx';
import { DuplicateOffer } from './DuplicateOffer.tsx';
import { TagPicker } from './TagPicker.tsx';

export interface TaskPaneProps {
  readonly mail: MailFacts;
  readonly detection: Detection | null;
  readonly api: ApiClient;
  readonly hasToken: boolean;
  /**
   * Die Anhänge der geöffneten Nachricht — `null` außerhalb von Outlook.
   *
   * `null` heißt nicht „keine Anhänge", sondern „hier ist kein Outlook". Der
   * Unterschied steht nirgends auf dem Bildschirm, weil ohne Outlook auch
   * keine E-Mail dasteht, aus der etwas übernommen würde.
   */
  readonly attachments: MailAttachmentAccess | null;
  readonly onOpenSettings: () => void;
  readonly onConnected: () => void;
}

/**
 * Der Deckel je Anhang (Entwurf 6.1, D-04).
 *
 * Ohne ihn ist ein hängender Abruf eine Sackgasse, aus der nur „Abbrechen"
 * führt — und den findet nicht jeder. Nach Ablauf gilt der Anhang als
 * gescheitert, Grund „Zeitüberschreitung", und der Lauf geht weiter.
 */
const ATTACHMENT_TIMEOUT_MS = 60_000;

/** Z6 — abgebrochen (Entwurf 6.6). */
const CANCELLED_NOTE = 'Abgebrochen. Es ist kein Todo entstanden. Die Eingaben bleiben stehen.';

/** Z6 — Outlook hat die geöffnete Nachricht gewechselt (Entwurf 6.6, D-06). */
const MAIL_SWITCHED_NOTE =
  'Die geöffnete E-Mail hat gewechselt. Die Übernahme wurde abgebrochen, es ist kein Todo entstanden.';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly context: AddinContextDto }
  | { readonly kind: 'failed'; readonly failure: ApiFailure };

/**
 * Was aus der Übernahme geworden ist — die Grundlage von Z3 und Z4.
 *
 * ---------------------------------------------------------------------------
 * Die Zahl und die Namen kommen aus **zwei** Quellen, und das ist Absicht
 * ---------------------------------------------------------------------------
 *
 * {@link stored} kommt aus der Antwort des Dienstes und wird nirgends
 * nachgerechnet: „3 Anhänge hängen daran" ist eine Aussage über den Bestand,
 * und über den Bestand weiß der Dienst Bescheid. {@link attached} ist der
 * Abgleich der eigenen Nutzlast gegen die Abweisungsliste — er beantwortet
 * die andere Frage, **welche** Anhänge das sind, und steht in
 * `attachments/reconcile.ts`.
 *
 * Bis T-310 stand hier ein Kommentar, der `stored` beschrieb, und ein Feld,
 * das es nicht gab; gezählt wurde die eigene Liste. Ein Satz im Quelltext, der
 * eine Zusage gibt, die der Nachbar bricht, ist schlimmer als kein Satz.
 *
 * {@link missing} kennt zwei Herkünfte in einer Liste: was es nicht bis zum
 * Anlegeruf geschafft hat (das weiß nur der Aufgabenbereich) und was der
 * Dienst abgewiesen hat. Für den Benutzer ist „fehlt" dasselbe; der Grund
 * unterscheidet sich, und den nennt die Zeile.
 */
interface DoneAttachments {
  /** Wie viele Anhänge am Todo hängen — **aus der Antwort des Dienstes**. */
  readonly stored: number;
  readonly attached: readonly AttachedEntry[];
  readonly missing: readonly MissingAttachment[];
  readonly limits: TakeoverLimits;
  /**
   * Ist die E-Mail **als Nachbau** angekommen? (Z3a, A-19.22a/b, A-A-97.)
   *
   * Ein eigenes Feld und kein Vergleich eines Anzeigenamens: Die Eigenschaft
   * gehört der Datei, nicht ihrem Namen — ein Name läßt sich umbenennen. Der
   * Wert ist `true` nur dann, wenn die Nachricht **angekommen** ist und
   * nachgebaut war; ist sie gar nicht angekommen, ist er `false` und der Fall
   * gehört nach Z4.
   */
  readonly rebuiltMessage: boolean;
}

interface Done {
  readonly kind: 'created';
  readonly title: string;
  readonly addedDefaults: number;
  readonly createdTagNames: readonly string[];
  /** `null`, wenn in diesem Lauf keine Anhänge übernommen wurden. */
  readonly attachments: DoneAttachments | null;
}

/**
 * Der Fluß über die sieben Zustände des Entwurfs — **erst sammeln, dann
 * anlegen** (Entwurf 5.3).
 *
 * Der tragende Grund steht in `attachments/collect.ts`: Nur so ist
 * „Abbrechen" harmlos. Bis zum Anlegeruf existiert nichts, und der Abbruch
 * hinterlässt nichts.
 */
type Flow =
  | { readonly kind: 'form' }
  | { readonly kind: 'collecting'; readonly progress: readonly EntryProgress[] }
  | { readonly kind: 'creating'; readonly progress: readonly EntryProgress[] };

export function TaskPane({
  mail,
  detection,
  api,
  hasToken,
  attachments,
  onOpenSettings,
  onConnected,
}: TaskPaneProps) {
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
  const [title, setTitle] = useState(() => suggestTitle(mail.subject));
  const [callNumber, setCallNumber] = useState('');
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([]);
  const [newTagNames, setNewTagNames] = useState<readonly string[]>([]);
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [offers, setOffers] = useState<readonly OfferDescription[]>([]);
  /**
   * Die Call-Nummer, mit der zuletzt **tatsächlich** gesucht wurde — oder
   * `null`, wenn keine Abfrage gestellt wurde.
   *
   * Ohne diesen Zustand ist „gesucht und nichts gefunden" von „gar nicht
   * gesucht" nicht zu unterscheiden: Beides ist eine leere Trefferliste. Für
   * eine Vorlesehilfe ist der Unterschied der ganze Punkt (Befund Y-04).
   */
  const [checkedCallNumber, setCheckedCallNumber] = useState<string | null>(null);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [flow, setFlow] = useState<Flow>({ kind: 'form' });
  const [cancelNote, setCancelNote] = useState<string | null>(null);

  /**
   * Der laufende Sammellauf — als Ref und nicht als Zustand.
   *
   * Er wird nicht gezeichnet, sondern abgebrochen, und ein Abbruch muß auch
   * aus einem Effekt heraus gehen, der nicht neu gerendert hat.
   */
  const runRef = useRef<AbortController | null>(null);
  /** Warum abgebrochen wurde — gesetzt **vor** dem Abbruch, gelesen danach. */
  const cancelReasonRef = useRef<string>(CANCELLED_NOTE);

  useEffect(() => {
    if (detection?.kind === 'match') setCallNumber(detection.value);
  }, [detection]);

  /**
   * Outlook hat die geöffnete Nachricht gewechselt (Entwurf 6.6, D-06, AK-09).
   *
   * **Kein Randfall.** Ohne diese Regel liefe eine begonnene Übernahme auf der
   * alten Nachricht weiter, während das Formular schon die neue zeigt — und es
   * entstünde ein Todo, dessen Titel aus der einen und dessen Anhänge aus der
   * anderen E-Mail stammen. Das ist erst in SuperTakt sichtbar und dort nicht
   * mehr erklärbar.
   *
   * Der erste Durchlauf ist kein Wechsel: `mailRef` hält die Nachricht, mit
   * der dieser Bereich aufgemacht wurde.
   */
  const mailRef = useRef<MailFacts>(mail);
  useEffect(() => {
    if (mailRef.current === mail) return;
    mailRef.current = mail;

    if (runRef.current !== null) {
      cancelReasonRef.current = MAIL_SWITCHED_NOTE;
      runRef.current.abort();
    }

    setTitle(suggestTitle(mail.subject));
    setNote('');
    setDueDate('');
    setSelectedTags([]);
    setNewTagNames([]);
    setFailure(null);
    setDone(null);
  }, [mail]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await api.loadContext();
      if (cancelled) return;
      if (result.ok) {
        setLoad({ kind: 'ready', context: result.value });
        onConnected();
      } else {
        setLoad({ kind: 'failed', failure: result });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, onConnected]);

  const refreshContext = useCallback(async (): Promise<void> => {
    const result = await api.loadContext();
    if (result.ok) setLoad({ kind: 'ready', context: result.value });
  }, [api]);

  const lookup = useCallback(
    async (value: string): Promise<void> => {
      const decision = decideLookup(value);
      if (decision.kind === 'skip') {
        setOffers([]);
        setCheckedCallNumber(null);
        setLookupNote(
          decision.reason === 'empty'
            ? null
            : 'Zu diesem Wert wurde nicht nach einem vorhandenen Todo gesucht — er sieht nicht wie eine Call-Nummer aus.',
        );
        return;
      }

      const result = await api.findMatches(decision.callNumber);
      if (!result.ok) {
        setOffers([]);
        setCheckedCallNumber(null);
        setLookupNote(null);
        return;
      }
      if (!result.value.searched) {
        setOffers([]);
        setCheckedCallNumber(null);
        setLookupNote(result.value.message);
        return;
      }

      setLookupNote(null);
      setCheckedCallNumber(decision.callNumber);
      setOffers(describeOffers(result.value.matches));
    },
    [api],
  );

  useEffect(() => {
    if (load.kind !== 'ready') return;
    void lookup(callNumber);
  }, [callNumber, load.kind, lookup]);

  const defaultTagIds = load.kind === 'ready' ? load.context.defaultTagIds : [];
  const detectionLine = useMemo(() => describeDetection(detection), [detection]);

  const callNumberProblem = useMemo((): string | null => {
    if (callNumber.trim().length === 0) return null;
    const decision = decideLookup(callNumber);
    return decision.kind === 'lookup' ? null : CALL_NUMBER_INPUT_MESSAGE[decision.reason];
  }, [callNumber]);

  const dueEntry = useMemo(() => readDueDate(dueDate), [dueDate]);

  /**
   * Die Grenzen der Übernahme — **aus `@takt/domain`**, und die Erlaubnis dazu
   * vom Dienst (A-A-81, T-304).
   *
   * Zwei Bedingungen, und sie beantworten zwei verschiedene Fragen:
   *
   *  - {@link ATTACHMENTS_TRAVEL_WITH_CREATE} — trägt **dieser Bau** die
   *    Anhänge im Anlegeruf mit? Das ist eine Aussage über den Quelltext.
   *  - `context.emailAttachments.accepted` — nimmt **dieser laufende Dienst**
   *    sie an? Das ist eine Aussage über die Gegenseite, und sie kann aus
   *    keinem Paket kommen: Add-in und Dienst werden getrennt installiert.
   *
   * Fehlt eine von beiden, gibt es keinen Abschnitt „Anhänge aus dieser
   * E-Mail", keine Zahl und keinen Satz darüber — ein Text, der eine Handlung
   * nennt, die es nicht gibt, ist derselbe Fehler wie ein fehlender Satz
   * (E-100 Punkt 3).
   *
   * Die **Zahlen** stehen dabei in keiner der beiden Bedingungen: Sie sind eine
   * Fachregel und kommen aus {@link TAKEOVER_LIMITS}.
   */
  const limits =
    ATTACHMENTS_TRAVEL_WITH_CREATE &&
    load.kind === 'ready' &&
    load.context.emailAttachments?.accepted === true
      ? TAKEOVER_LIMITS
      : null;

  const plan = useMemo(
    () =>
      attachments === null || limits === null
        ? null
        : planTakeover(attachments.facts, limits, attachments.capabilities),
    [attachments, limits],
  );

  /**
   * Der Abbruchhinweis verschwindet, sobald der Benutzer **selbst** ein Feld
   * ändert (Entwurf 6.6). Er ist eine Auskunft über das, was gerade nicht
   * geschehen ist, und keine Meldung, die stehen bleibt, bis jemand sie
   * wegklickt — es gibt nichts wegzuklicken.
   *
   * Bewusst an den Bedienelementen und nicht als Effekt über den Feldwerten:
   * Beim Wechsel der geöffneten Nachricht setzt der Aufgabenbereich dieselben
   * Felder **selbst** zurück und stellt im selben Atemzug den Hinweis auf —
   * ein Effekt über den Werten löschte ihn in derselben Runde wieder.
   */
  const edited = useCallback((): void => {
    setCancelNote(null);
  }, []);

  const gate = useMemo(
    () =>
      createTodoGate({
        title,
        connection: load.kind,
        callNumberProblem,
        dueDateInvalid: dueEntry.kind === 'invalid',
      }),
    [title, load.kind, callNumberProblem, dueEntry.kind],
  );

  /*
   * Die vier Fokusziele aus Abschnitt 10.1 des Entwurfs.
   *
   * Bis T-310 gab es im ganzen Aufgabenbereich kein `tabIndex` und kein
   * `.focus()`: Beim Übergang Z0 → Z1 verschwand der Knopf unter dem Fokus,
   * und der Fokus fiel auf `<body>`. Wer nicht sieht, wusste danach nicht
   * mehr, wo er ist.
   */
  const progressHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const doneHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const callNumberRef = useRef<HTMLInputElement | null>(null);
  /** Wurde das Ergebnis **vom Benutzer** verlassen? Siehe den Effekt darunter. */
  const leftDoneRef = useRef(false);

  useEffect(() => {
    if (flow.kind === 'collecting') progressHeadingRef.current?.focus();
  }, [flow.kind]);

  useEffect(() => {
    if (done !== null) {
      doneHeadingRef.current?.focus();
      return;
    }
    /*
     * Zurück ins Formular — **nur auf eine Handlung hin** (3.2.1, 3.2.2).
     * `done` wird auch beim Wechsel der geöffneten Nachricht auf `null`
     * gesetzt; dort hat der Benutzer nichts gedrückt, und ein springender
     * Fokus wäre eine Bewegung ohne Ereignis.
     */
    if (!leftDoneRef.current) return;
    leftDoneRef.current = false;
    callNumberRef.current?.focus();
  }, [done]);

  useEffect(() => {
    // Z5 und Z6 — dorthin, wo der nächste Versuch beginnt.
    if (failure !== null || cancelNote !== null) submitRef.current?.focus();
  }, [failure, cancelNote]);

  /**
   * Der ganze Vorgang: **erst sammeln, dann anlegen** (Entwurf 5.3).
   *
   * Die drei Ausgänge sind getrennt und heißen verschieden:
   *
   *  - **Z6 abgebrochen** — kein Anlegeruf, kein Todo, die Eingaben stehen.
   *  - **Z5 fehlgeschlagen** — der Anlegeruf hat abgelehnt, es ist kein Todo
   *    entstanden.
   *  - **Z3/Z4 angelegt** — das Todo steht; ob vollständig, sagt die Liste.
   */
  const submitCreate = async (): Promise<void> => {
    setFailure(null);
    setCancelNote(null);

    let payload: readonly AttachmentPayload[] | null = null;
    let missing: readonly MissingAttachment[] = [];

    if (plan !== null && limits !== null && attachments !== null) {
      const controller = new AbortController();
      runRef.current = controller;
      cancelReasonRef.current = CANCELLED_NOTE;

      const collected = await collectAttachments(plan, limits, attachments.ports, {
        signal: controller.signal,
        timeoutMs: ATTACHMENT_TIMEOUT_MS,
        onProgress: (progress) => {
          setFlow({ kind: 'collecting', progress });
        },
      });

      runRef.current = null;

      if (collected.cancelled) {
        setFlow({ kind: 'form' });
        setCancelNote(cancelReasonRef.current);
        return;
      }

      payload = collected.payload;
      missing = collected.missing;
      setFlow((current) =>
        current.kind === 'collecting' ? { kind: 'creating', progress: current.progress } : current,
      );
    } else {
      setBusy(true);
    }

    const result = await api.createTodo({
      title: title.trim(),
      callNumber: callNumber.trim().length === 0 ? null : callNumber.trim(),
      statusId: null,
      tagIds: selectedTags,
      tagNames: newTagNames,
      note,
      dueDate: dueDateForRequest(dueEntry),
      /*
       * Die Anhänge, als Teil des Anlegens (A-19.22 bis A-19.33, E-108).
       *
       * `null`, wenn der Sammellauf gar nicht angelaufen ist — dann bietet
       * dieser Bau oder dieser Dienst die Übernahme nicht an, und es ist auch
       * nichts eingesammelt worden. Was hier steht, ist genau das, was der
       * Sammellauf zurückgegeben hat; es wird zwischen Sammeln und Senden
       * nichts umsortiert, gefiltert oder ergänzt.
       *
       * Der **Absender** steht am Umschlag, weil er der Nachricht gehört und
       * nicht einer einzelnen Datei. Er ist fremder Text (A-A-84) und geht im
       * Dienst als Eigenschaft an jeden Anhang dieses Laufs — die Rückfrage vor
       * dem Öffnen braucht ihn Wochen später (A-A-85).
       */
      attachments: payload === null ? null : { sender: senderForIntake(mail), items: payload },
    });

    setBusy(false);
    setFlow({ kind: 'form' });
    if (!result.ok) {
      setFailure(result);
      return;
    }

    setNewTagNames([]);
    if (result.value.createdTags.length > 0) {
      const fresh = result.value.createdTags.map((tag) => tag.id);
      setSelectedTags((current) => [...current, ...fresh.filter((id) => !current.includes(id))]);
      void refreshContext();
    }

    setDone({
      kind: 'created',
      title: result.value.todo.title,
      addedDefaults: result.value.addedDefaultTagIds.length,
      createdTagNames: result.value.createdTags.map((tag) => tag.name),
      attachments:
        payload === null || limits === null
          ? null
          : describeTakeover(payload, missing, limits, result.value.attachments ?? null),
    });
  };

  const cancelRun = (): void => {
    cancelReasonRef.current = CANCELLED_NOTE;
    runRef.current?.abort();
  };

  /**
   * Das Formular — **als Wert und nicht als vorzeitiges `return`** (T-310).
   *
   * Der Grund ist Y-04 und steht an {@link Announcements}: Die Live-Bereiche
   * müssen über allen Zuständen stehen und dürfen nicht zusammen mit der
   * Fläche entstehen, über die sie sprechen. Dafür muss dieser Baustein in
   * **jedem** Zustand dieselbe Wurzel liefern, und die Zustände werden
   * darunter ausgewählt statt hier verlassen.
   */
  const form = (
    <div className="pane">
      <Section title="Aus dieser E-Mail">
        <dl className="mailfacts">
          <dt>Betreff</dt>
          <dd>{mail.subject.length > 0 ? <Foreign value={mail.subject} /> : <em>ohne Betreff</em>}</dd>
          <dt>Von</dt>
          <dd>
            {mail.senderName.length > 0 ? <Foreign value={mail.senderName} /> : <em>unbekannt</em>}
            {mail.senderAddress.length > 0 ? (
              <span className="mailfacts__address">
                {' '}&lt;<Foreign value={mail.senderAddress} />&gt;
              </span>
            ) : null}
          </dd>
        </dl>
      </Section>

      <Section title="Call-Nummer" description={detectionLine.help}>
        {detectionLine.callout}
        <Field
          label="Call-Nummer"
          htmlFor="call"
          hint="Sie ist die Standardquelle für das Exportfeld „Call“ und darf leer bleiben."
          error={callNumberProblem ?? undefined}
        >
          {(aria) => (
            <input
              {...aria}
              ref={callNumberRef}
              className="input mono"
              value={callNumber}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => {
                edited();
                setCallNumber(event.target.value);
              }}
            />
          )}
        </Field>
        {lookupNote !== null ? <Callout tone="info">{lookupNote}</Callout> : null}
      </Section>

      <DuplicateOffer offers={offers} checkedCallNumber={checkedCallNumber} />

      {failure !== null ? <Failure failure={failure} onOpenSettings={onOpenSettings} /> : null}

      <Section title="Neues Todo">
        <Field label="Titel" htmlFor="title">
          {(aria) => (
            <input
              {...aria}
              className="input"
              value={title}
              onChange={(event) => {
                edited();
                setTitle(event.target.value);
              }}
            />
          )}
        </Field>

        <Field
          label="Frist"
          htmlFor="due"
          hint="SuperTakt sucht in der E-Mail nicht nach einer Frist — Sie tragen sie selbst ein. Ein Tag, keine Uhrzeit; leer lassen heißt: keine Frist."
          error={dueEntry.kind === 'invalid' ? dueEntry.message : undefined}
        >
          {(aria) => (
            <input
              {...aria}
              className="input"
              type="date"
              value={dueDate}
              onChange={(event) => {
                edited();
                setDueDate(event.target.value);
              }}
            />
          )}
        </Field>

        {load.kind === 'ready' ? (
          <Field
            label="Tags"
            htmlFor="tags"
            hint="Standard-Tags kommen automatisch dazu. Sie können vorhandene Tags suchen oder einen neuen Namen vormerken."
          >
            {(aria) => (
              <TagPicker
                aria={aria}
                tree={load.context.tagTree}
                selected={selectedTags}
                defaultTagIds={defaultTagIds}
                onChange={(next) => {
                  edited();
                  setSelectedTags(next);
                }}
                newNames={newTagNames}
                onNewNamesChange={(next) => {
                  edited();
                  setNewTagNames(next);
                }}
              />
            )}
          </Field>
        ) : (
          <div className="field">
            <p className="field__heading">Tags</p>
            {load.kind === 'loading' ? (
              <>
                <p className="pane-loading">Tags werden geladen …</p>
                <Skeleton lines={4} />
              </>
            ) : (
              <Callout
                tone="danger"
                title={load.failure.message}
                action={
                  load.failure.kind === 'unauthorized' || load.failure.kind === 'origin_rejected' ? (
                    <Button variant="secondary" onClick={onOpenSettings}>
                      Einstellungen öffnen
                    </Button>
                  ) : null
                }
              >
                Ohne Verbindung lassen sich keine Tags wählen. Ein Todo entsteht so nicht.
              </Callout>
            )}
          </div>
        )}

        <Field
          label="Vermerk (bleibt in SuperTakt)"
          htmlFor="note"
          hint="Er geht nicht in die Abrechnung."
        >
          {(aria) => (
            <textarea
              {...aria}
              className="input textarea"
              rows={5}
              value={note}
              onChange={(event) => {
                edited();
                setNote(event.target.value);
              }}
            />
          )}
        </Field>

        <Button
          variant="ghost"
          onClick={() => {
            edited();
            setNote(prepareNote(mail));
          }}
        >
          Inhalt der E-Mail übernehmen
        </Button>
      </Section>

      {plan !== null && limits !== null && attachments !== null ? (
        <AttachmentPreview
          plan={plan}
          limits={limits}
          outlookTooOld={!attachments.capabilities.canReadAttachments}
        />
      ) : null}

      <div className="pane-actions">
        {cancelNote !== null ? <p className="pane-note">{cancelNote}</p> : null}
        {gate.reason !== null ? <p className="pane-note">{gate.reason}</p> : null}
        <Button
          ref={submitRef}
          variant="primary"
          full
          loading={busy}
          disabled={gate.blocked}
          onClick={() => {
            void submitCreate();
          }}
        >
          Neue Aufgabe anlegen
        </Button>
      </div>
    </div>
  );

  /** Welche der vier Flächen gerade dasteht — Z0, Z1/Z2, Z3/Z4 oder „kein Token". */
  const surface = !hasToken ? (
    <Section title="Noch nicht verbunden">
      <Callout
        tone="info"
        title="Das Token fehlt."
        action={
          <Button variant="primary" onClick={onOpenSettings}>
            Zu den Einstellungen
          </Button>
        }
      >
        Das Token finden Sie in SuperTakt unter Einstellungen; von dort wird es einmalig hier
        eingetragen.
      </Callout>
    </Section>
  ) : done !== null ? (
    <DoneView
      done={done}
      headingRef={doneHeadingRef}
      onAgain={() => {
        leftDoneRef.current = true;
        setDone(null);
      }}
    />
  ) : plan !== null && flow.kind !== 'form' ? (
    <AttachmentProgress
      plan={plan}
      progress={flow.progress}
      creating={flow.kind === 'creating'}
      onCancel={cancelRun}
      headingRef={progressHeadingRef}
    />
  ) : (
    form
  );

  const running = plan !== null && flow.kind !== 'form';

  return (
    <>
      <Announcements
        status={
          done !== null
            ? spokenResult(done)
            : running
              ? progressStatusLine(plan, flow.progress, flow.kind === 'creating')
              : ''
        }
        skipped={running ? spokenSkips(plan, flow.progress) : ''}
      />
      {surface}
    </>
  );
}

/**
 * Die beiden Live-Bereiche des Aufgabenbereichs (Entwurf 10.2, AK-21, AK-26,
 * A-19.29, A-19.31).
 *
 * ---------------------------------------------------------------------------
 * Warum sie **hier oben** stehen und nicht in der Fläche, über die sie reden
 * ---------------------------------------------------------------------------
 *
 * **Y-04, die hauseigene Regel:** Ein Live-Bereich, der zusammen mit seinem
 * Inhalt in den Baum kommt, wird von vielen Vorlesehilfen nicht angesagt — sie
 * melden Änderungen an einer Region, die sie bereits kennen, und diese kennen
 * sie in dem Augenblick noch nicht. Bis T-310 standen beide `role="status"` in
 * `AttachmentProgress`, und der ganze Baustein entstand erst beim Klick; das
 * Ergebnis (Z3/Z4) hatte gar keinen. Hier stehen sie vom ersten Bild an da und
 * wechseln nur ihren Inhalt.
 *
 * ---------------------------------------------------------------------------
 * Was gesprochen wird — und was nicht
 * ---------------------------------------------------------------------------
 *
 * Genau dreierlei (Entwurf 10.2, D-08): der **Beginn**, **jeder** nicht
 * übernommene Anhang sofort, und das **Ergebnis**. Gelungene Zwischenschritte
 * sind sichtbar und stumm; die Liste selbst ist **kein** Live-Bereich, denn
 * bei siebzehn Anhängen wären das vierunddreißig Ansagen. Angesagt wird, was
 * man nicht verpassen darf.
 *
 * Der **Nachbau** ist die eine Ausnahme (AK-26): Er ist kein Fehlschlag und
 * fehlt nicht, wird aber mitgesagt. Für einen sehenden Benutzer steht
 * „(nachgebaut)" in der Zeile; wer die Liste nicht sieht, bekäme ohne diesen
 * Zusatz weniger als der Sehende, und zwar genau an der Stelle, an der es auf
 * den Unterschied ankommt.
 *
 * Zwei Bereiche und nicht einer: Ein Fehlschlag darf die Fortschrittsansage
 * nicht überschreiben, und der Fortschritt darf einen Fehlschlag nicht
 * verdrängen. Beide sind `role="status"` (also `aria-live="polite"`) — nichts
 * hiervon unterbricht, was der Benutzer gerade liest.
 *
 * **Ehrlich benannt:** In dieser Umgebung steht kein Vorleseprogramm zur
 * Verfügung. Gemessen sind der Bedienungshilfen-Baum und die Erreichbarkeit
 * über die Tastatur; dass eine bestimmte Hilfe genau diese Sätze genau so
 * vorliest, ist eine Ableitung aus der Bauart und keine Messung.
 */
function Announcements({
  status,
  skipped,
}: {
  readonly status: string;
  readonly skipped: string;
}) {
  return (
    <>
      <p className="attachments__spoken" role="status">
        {status}
      </p>
      <p className="attachments__spoken" role="status">
        {skipped}
      </p>
    </>
  );
}

/**
 * Was eine Vorlesehilfe im Ergebnis hört (Entwurf 10.2 Punkt 3, AK-26).
 *
 * „Todo angelegt. 2 von 3 Anhängen hängen daran." — Überschrift und Kern, mit
 * Punkt statt Doppelpunkt, denn in der Ansage folgt keine Liste. Der
 * erklärende Absatz zum Nachbau wird **nicht** mitgesagt; er steht im
 * Fokusziel und wird beim Weiterlesen erreicht.
 */
const spokenResult = (done: Done): string => {
  const attachments = done.attachments;
  if (attachments === null) return `${doneTitle(null)}. ${CREATED_SENTENCE}`;
  const core = attachedCore(attachments);
  /*
   * Der Zusatz entfällt, wo der Kern das Wort schon trägt („Die E-Mail hängt
   * als Nachbau daran") — sonst stünde er zweimal in einem Atemzug. Gemessen
   * am erzeugten Satz und nicht an der Bedingung, unter der er entsteht: Die
   * beiden liefen sonst auseinander, sobald jemand den Kern umschreibt.
   */
  const rebuilt =
    attachments.rebuiltMessage && !core.includes('Nachbau') ? ' Die E-Mail ist ein Nachbau.' : '';
  return `${doneTitle(attachments)}. ${core}.${rebuilt}`;
};

const FIELD_LABEL: Readonly<Record<string, string>> = Object.freeze({
  title: 'Titel',
  callNumber: 'Call-Nummer',
  statusId: 'Status',
  tagIds: 'Tags',
  tagNames: 'Neue Tags',
  note: 'Vermerk',
  body: 'Eingabe',
});

const fieldLabel = (field: string): string => {
  const known = FIELD_LABEL[field];
  if (known !== undefined) return known;
  const indexed = /^(.+)\.(\d+)$/.exec(field);
  if (indexed === null) return field;
  const base = FIELD_LABEL[indexed[1] ?? ''];
  return base === undefined ? field : `${base}, Eintrag ${String(Number(indexed[2]) + 1)}`;
};

function Failure({
  failure,
  onOpenSettings,
}: {
  readonly failure: ApiFailure;
  readonly onOpenSettings: () => void;
}) {
  const needsSettings = failure.kind === 'unauthorized' || failure.kind === 'origin_rejected';

  return (
    <Callout
      tone="danger"
      title={failure.message}
      action={
        needsSettings ? (
          <Button variant="secondary" onClick={onOpenSettings}>
            Einstellungen öffnen
          </Button>
        ) : null
      }
    >
      {/*
        Der Unterschied zwischen Z5 und Z4 in einem Satz (Entwurf 6.5): Dort
        steht ein Todo, hier nicht. Ohne ihn muß der Benutzer in SuperTakt
        nachsehen, ob eine halbe Sache entstanden ist — und das ist eine
        Sackgasse mit Umweg.
      */}
      <p className="pane-note">Es ist kein Todo entstanden.</p>
      {failure.details !== undefined && failure.details.length > 0 ? (
        <ul className="callout__list">
          {failure.details.map((detail) => (
            <li key={`${detail.field}-${detail.code}`}>
              {fieldLabel(detail.field)}: {detail.message}
            </li>
          ))}
        </ul>
      ) : (
        'Die Eingaben bleiben stehen. Ein neuer Versuch ist möglich.'
      )}
    </Callout>
  );
}

/**
 * Der Eintrag der Ergebnisliste zu einer Nutzlast.
 *
 * Die E-Mail heißt hier „die E-Mail" und nicht `Nachricht.eml`: Der Benutzer
 * hat keinen Dateinamen gewählt, und der Satz darüber spricht von der E-Mail.
 * Ist sie ein **Nachbau**, steht das dabei — nicht als Beruhigung, sondern
 * weil eine Datei, die für die ursprüngliche Nachricht gehalten werden kann,
 * ohne es zu sein, in einem Vorgang, aus dem eine Rechnung wird, eine falsche
 * Auskunft über ein Beweisstück ist (A-19.22b).
 */
const attachedEntry = (entry: AttachmentPayload): AttachedEntry => {
  switch (entry.kind) {
    case 'message':
      return { name: 'die E-Mail', suffix: entry.rebuilt ? '(nachgebaut)' : null };
    case 'link':
      return { name: entry.displayName, suffix: '(als Verweis)' };
    default:
      return { name: entry.displayName, suffix: null };
  }
};

/**
 * Nutzlast, eigene Fehlschläge und die Antwort des Dienstes zu **einem**
 * Ergebnis (A-19.29, A-19.33, T-310).
 *
 * Drei Auskünfte, und jede kommt von der Stelle, die sie kennt:
 *
 *  - die **Zahl** aus `report.stored` — der Bestand,
 *  - die **Namen** aus dem Abgleich in `reconcileAttachments` — die Nutzlast,
 *  - die **Fehlschläge vor dem Anlegeruf** aus dem Sammellauf; die kennt der
 *    Dienst nicht, denn sie sind nie bei ihm angekommen.
 *
 * Die eigenen Fehlschläge stehen **vorn**: Sie betreffen Anhänge, die vor
 * allen anderen an der Reihe waren, und der Benutzer liest sie in der
 * Reihenfolge, in der sie entstanden sind — dieselbe Ordnung wie im Dienst.
 *
 * `report === null` heißt „der Dienst hat über Anhänge nichts gesagt"; was
 * daraus folgt, steht in `reconcileAttachments`.
 */
const describeTakeover = (
  payload: readonly AttachmentPayload[],
  collected: readonly MissingAttachment[],
  limits: TakeoverLimits,
  report: CreatedAttachmentsDto | null,
): DoneAttachments => {
  const reconciled = reconcileAttachments(payload, report === null ? null : report.rejected);

  return {
    stored: report?.stored ?? 0,
    attached: reconciled.attached.map(attachedEntry),
    missing: [...collected, ...reconciled.missing],
    limits,
    /*
     * Z3a — ist die E-Mail als **Nachbau** angekommen?
     *
     * Zwei Bedingungen, und beide müssen erfüllt sein: Die Nachricht war ein
     * Nachbau (`rebuilt`), **und** der Dienst hat sie nicht abgewiesen. Fehlt
     * die zweite, fehlt die Datei — und dann ist es Z4 und nicht Z3a. Ein Satz
     * über eine dauerhafte Kennzeichnung an einer Datei, die es nicht gibt,
     * wäre die Sorte Text, gegen die E-100 Punkt 3 geschrieben ist.
     */
    rebuiltMessage: reconciled.attached.some(
      (entry) => entry.kind === 'message' && entry.rebuilt,
    ),
  };
};

/**
 * Der Absender für den Umschlag — **fremder Text**, unverändert (A-A-84).
 *
 * Name und Adresse in derselben Form, in der Outlook sie zeigt. Nichts wird
 * hier gekürzt oder bereinigt: Der Dienst kürzt auf 640 Zeichen, und ein
 * zweiter Deckel an einer zweiten Stelle wäre die zweite Wahrheit über
 * dieselbe Grenze. Fehlt beides, ist das `null` und nicht `''` — „gibt es
 * nicht" hat einen Wert.
 */
const senderForIntake = (mail: MailFacts): string | null => {
  const name = mail.senderName.trim();
  const address = mail.senderAddress.trim();
  if (name.length > 0 && address.length > 0) return `${name} <${address}>`;
  if (name.length > 0) return name;
  if (address.length > 0) return address;
  return null;
};

/**
 * Die Überschrift von Z3, Z3a bzw. Z4 — sie trägt beides (Entwurf 6.4).
 *
 * **Z3a bekommt keine eigene Überschrift**, und das ist eine Entscheidung des
 * Entwurfs (6.3a Punkt 1): Ein „Todo angelegt — E-Mail nachgebaut" wäre der
 * Bauplan von Z4, und Z4 heißt hier **etwas fehlt**. Bei einem Nachbau fehlt
 * nichts; die Zahl aus A-19.33 stimmt.
 *
 * **Und der Sonderfall „ohne Anhänge" ist gestrichen** (T-303, Abschnitt 0).
 * Er stammte aus dem Entwurf vor E-109 und beschrieb die Lage, in der Outlook
 * die Nachricht nicht hergab und es keinen Nachbau gab. Seit E-109 gibt es
 * ihn nur noch, wenn **alles** scheitert — und dann sagt „2 Anhänge fehlen"
 * genau das, was der Fall ist, statt eine eigene Fläche dafür zu führen.
 */
const doneTitle = (attachments: DoneAttachments | null): string => {
  if (attachments === null || attachments.missing.length === 0) return 'Todo angelegt';
  if (attachments.missing.length === 1 && attachments.missing[0]?.isMessage === true) {
    return 'Todo angelegt — die E-Mail fehlt';
  }
  return attachments.missing.length === 1
    ? 'Todo angelegt — 1 Anhang fehlt'
    : `Todo angelegt — ${String(attachments.missing.length)} Anhänge fehlen`;
};

/** Der eine Satz, der in jeder Fassung von Z3 und Z4 gleich beginnt. */
const CREATED_SENTENCE = 'Das Todo ist in SuperTakt angelegt.';

/**
 * Der Kern der Ergebniszeile, **ohne Satzzeichen am Ende** — „2 von 3
 * Anhängen hängen daran", „3 Anhänge hängen daran" (A-19.29, A-19.33).
 *
 * Die Zahl ist {@link DoneAttachments.stored} und nicht die Länge der eigenen
 * Liste (T-310 Befund 2). Ohne Satzzeichen, weil derselbe Kern zweimal
 * gebraucht wird: sichtbar mit Doppelpunkt, wenn eine Liste folgt, und mit
 * Punkt in der Ansage, in der keine folgt.
 */
const attachedCore = (attachments: DoneAttachments): string => {
  const total = attachments.stored + attachments.missing.length;
  if (attachments.stored === 0) return 'Kein Anhang aus dieser E-Mail hängt daran';
  if (attachments.missing.length > 0) {
    const verb = attachments.stored === 1 ? 'hängt' : 'hängen';
    return `${String(attachments.stored)} von ${String(total)} Anhängen ${verb} daran`;
  }
  if (attachments.stored === 1) {
    /*
     * Der Fall aus A-19.27: eine E-Mail ohne Dateianhänge. Ist sie ein
     * Nachbau, steht **hier schon** das Wort und nicht erst im Absatz darunter
     * (Entwurf 6.3a, „Bei genau einem Anhang"): Die nachgebaute Datei ist dann
     * das einzige, was vom Postfach am Todo hängt.
     */
    return attachments.rebuiltMessage
      ? 'Die E-Mail hängt als Nachbau daran'
      : 'Die E-Mail hängt als Datei daran';
  }
  return `${String(attachments.stored)} Anhänge hängen daran`;
};

/**
 * Folgt dem Satz eine Liste? (T-310 Befund 1, zweite Hälfte.)
 *
 * Zwei Bedingungen, und die zweite ist die neue: Es muss etwas dahängen —
 * **und** die abgeglichene Liste muss so viele Namen tragen, wie der Dienst
 * Anhänge zählt. Laufen die beiden auseinander (ein Eintrag der
 * Abweisungsliste ließ sich keiner Nutzlast zuordnen), gewinnt die **Zahl des
 * Dienstes**, und die Liste entfällt. Lieber eine Zahl ohne Namen als eine
 * Zahl, unter der der Benutzer etwas anderes abzählt.
 */
const showsAttachedList = (attachments: DoneAttachments): boolean =>
  attachments.attached.length > 0 && attachments.attached.length === attachments.stored;

/** „Das Todo ist in SuperTakt angelegt. 2 von 3 Anhängen hängen daran:" */
const attachedLine = (attachments: DoneAttachments): string =>
  `${CREATED_SENTENCE} ${attachedCore(attachments)}${showsAttachedList(attachments) ? ':' : '.'}`;

/**
 * Der Absatz zu Z3a — **die E-Mail ist ein Nachbau** (Entwurf 6.3a, A-19.22b).
 *
 * ---------------------------------------------------------------------------
 * Was drin ist, bevor gesagt wird, was fehlt
 * ---------------------------------------------------------------------------
 *
 * Der Nachbau **erfüllt** A-19.22: Absender, Empfänger, Betreff, Versanddatum
 * und Text stehen in der Datei. Das gehört zuerst gesagt, sonst liest sich die
 * Auskunft wie ein Mangel. Erst danach steht, was nicht darin ist — und der
 * Satz nennt die **Folge** und nicht das Fachwort: „ohne die übrigen
 * Kopfzeilen" ist für einen Benutzer kein Satz.
 *
 * Der Ton bleibt Erfolg: keine Warnfarbe, kein Warnzeichen, kein Ratschlag zur
 * Handarbeit. Hier fehlt nichts. Wer den Warnton an dieser Stelle ausleiht, hat
 * ihn in Z4 verbraucht — und ein Benutzer mit alter Outlook-Fassung sähe ihn
 * bei **jedem** Todo, bis er ihn nicht mehr sieht.
 */
const REBUILT_MESSAGE_NOTE =
  'Die E-Mail ist ein Nachbau: Outlook hat die ursprüngliche Nachricht nicht als Datei ' +
  'hergegeben. Absender, Empfänger, Betreff, Versanddatum und Text stehen in der Datei. ' +
  'Die technischen Kopfzeilen der ursprünglichen Nachricht stehen nicht darin — und mit ' +
  'ihnen nicht der Nachweis, welchen Weg sie genommen hat.';

/**
 * Der Satz, der den Fall über diese Sekunde hinausträgt (Entwurf 6.3a, AK-27).
 *
 * ---------------------------------------------------------------------------
 * Er durfte bis T-302 **nicht** erscheinen, und warum er es jetzt darf
 * ---------------------------------------------------------------------------
 *
 * Er ist keine Beruhigung, sondern eine **Zusage über fremde Flächen**: daß
 * die Kennzeichnung an der Datei hängt, an der Anhangszeile sichtbar ist, in
 * der Rückfrage vor dem Öffnen steht und die Datensicherung übersteht. Der
 * ux-designer hat ihn in T-303 ausdrücklich unter Auflage gestellt (AK-27):
 * Wird er gesprochen, bevor die Kennzeichnung im Bestand liegt, ist er die
 * Lüge, gegen die der ganze Abschnitt gerichtet ist.
 *
 * **Nachgesehen, nicht angenommen** (T-304), an allen drei Stellen:
 *
 *  - **Im Bestand:** `todo_attachment.rebuilt`, Migration 0023 (T-299), und
 *    im Datenarchiv ab Fassung 6 (T-301) — der Round-Trip ist dort gemessen.
 *  - **In der Anhangsliste:** `apps/web/src/features/todos/AttachmentRow.tsx`
 *    zeigt `(nachgebaut)` in einem **eigenen** Element neben dem Anzeigenamen.
 *    Das ist der Punkt: Ein Absender, der seine Datei `Nachtrag.eml
 *    (nachgebaut)` nennt, kann die Kennzeichnung damit nicht erfinden.
 *  - **In der Rückfrage vor dem Öffnen:**
 *    `apps/web/src/features/todos/AttachmentOpenDialog.tsx` nennt sie noch
 *    einmal, mit demselben Wortlaut wie {@link REBUILT_MESSAGE_NOTE}.
 */
const REBUILT_MESSAGE_PERSISTENCE =
  'Die Datei ist in SuperTakt dauerhaft als Nachbau gekennzeichnet.';

/**
 * Der Weg, der wirklich existiert — und der Satz darüber, warum es keinen
 * kürzeren gibt (Entwurf 6.4).
 *
 * **Es gibt hier keinen Knopf „Erneut versuchen", und es darf keinen geben.**
 * Das Todo existiert in der Sekunde, in der der Anlegeruf zurückkam; jeder
 * Anhang daran wäre ein Anhang an einem **vorhandenen** Todo — genau die Tür,
 * die A-19.19 und E-108 zuhalten. Ein Knopf, der das täte, wäre nicht eine
 * Bequemlichkeit zuviel, sondern die Aufhebung einer Entscheidung durch eine
 * Schaltfläche.
 *
 * Der genannte Weg ist zweimal geprüft: Outlook legt Anhänge über „Speichern
 * unter" ab, und SuperTakt hat am Todo den Bereich „Anhänge" mit „Anhang
 * hinzufügen", Art „Datei", Feld „Vollständiger Pfad zur Datei".
 *
 * **Zwei Fassungen seit T-310**, und der Unterschied ist ein Wort: Wo die
 * E-Mail selbst fehlt, speichert der Benutzer in Outlook keine Datei, sondern
 * die **Nachricht** (Entwurf 6.4 Fall 2). Welche Fassung gilt, entscheidet
 * {@link catchUpSubject}.
 */
const catchUpNote = (what: 'Datei' | 'Nachricht'): string =>
  `Nachtragen lässt sich das nur in SuperTakt: die ${what} in Outlook speichern und am Todo unter „Anhänge“ mit ihrem vollständigen Pfad hinzufügen.`;

/**
 * Welches Wort in {@link catchUpNote} steht (Entwurf 6.4, Fall 2).
 *
 * **„die Nachricht", wenn ausschließlich die E-Mail fehlt** — dann gibt es
 * keine Datei, die der Benutzer in Outlook speichern könnte, und der Satz
 * schickte ihn zu etwas, das es in diesem Fall nicht gibt. Sonst „die Datei":
 * Fehlt beides, ist der Weg für die Dateien derselbe, und zwei Sätze
 * untereinander, die sich nur in einem Wort unterscheiden, sind schwerer zu
 * lesen als einer.
 */
const catchUpSubject = (missing: readonly MissingAttachment[]): 'Datei' | 'Nachricht' =>
  missing.length > 0 && missing.every((entry) => entry.isMessage) ? 'Nachricht' : 'Datei';

/**
 * Der Erklärabsatz zu `rebuild_rejected` (Entwurf 6.4 Fall 2, A-19.22c,
 * AK-28) — **der heikelste Zustand des ganzen Entwurfs**.
 *
 * Er ist heikel, weil der Benutzer nichts falsch gemacht hat und trotzdem
 * etwas fehlt, und weil er der einzige Fall ist, in dem SuperTakt aus eigenem
 * Entschluss etwas **nicht** tut, was es könnte.
 *
 * Der Wortlaut stammt zeichengleich aus dem Entwurf; jedes Stück ist dort
 * begründet:
 *
 *  - **„an einer Angabe dieser Nachricht"** — nicht „an einem ungültigen
 *    Zeichen", nicht „an einem Angriffsversuch". Der Benutzer kann die Angabe
 *    nicht sehen und nicht ändern; ihm nahezulegen, wer ihm geschrieben hat,
 *    sei verdächtig, wäre eine Behauptung ohne Grundlage.
 *  - **„Sie würde in der Datei nicht als Text stehen, sondern deren Aufbau
 *    verändern."** Das ist R-28 in einem Satz und ohne Fachwort.
 *  - **„statt eine Datei zu erzeugen, die mehr enthält als die Nachricht."**
 *    Die Gefahr in der einen Form, in der sie den Benutzer betrifft.
 *
 * **Was hier ausdrücklich nicht steht** (AK-28): kein Knopf „Erneut
 * versuchen", keine Fehlernummer, kein Auszug aus der Formprüfung und kein
 * Name der Angabe, an der es lag. Das Letzte wegen AB-3 — der Name einer
 * Kopfzeile aus fremder Hand wäre fremder Text in einer Fläche, die vor
 * fremdem Text warnt.
 */
const REBUILD_REJECTED_NOTE =
  'Die ursprüngliche Nachricht war nicht zu bekommen, und der Nachbau ist an einer Angabe ' +
  'dieser Nachricht gescheitert: Sie würde in der Datei nicht als Text stehen, sondern deren ' +
  'Aufbau verändern. SuperTakt bricht dann ab, statt eine Datei zu erzeugen, die mehr enthält ' +
  'als die Nachricht.';

/**
 * Der Satz, der die Schleife beendet (Entwurf 6.4 Fall 2, Sperrkandidat
 * SP-A-35).
 *
 * Zwei Auskünfte, und die zweite ist die wichtigere. Sie ist **keine
 * Beruhigung, sondern eine Ersparnis**: Ohne sie löscht der Benutzer das Todo
 * und legt es noch einmal an — mit demselben Ergebnis, denn die Ablehnung ist
 * deterministisch. Die erste Hälfte steht davor, weil ein Mensch, dem etwas
 * fehlt, zuerst bei sich sucht.
 */
const REBUILD_REJECTED_NOT_YOUR_FAULT =
  'Das liegt an dieser Nachricht, nicht an Ihren Eingaben, und ein zweiter Versuch ändert daran nichts.';

/** Die Abwesenheitszusage, die die Frage beantwortet, die der Benutzer hier stellt. */
const NO_ATTACHMENT_ON_EXISTING =
  'Über diesen Aufgabenbereich entsteht an einem vorhandenen Todo kein Anhang.';

function DoneView({
  done,
  onAgain,
  headingRef,
}: {
  readonly done: Done;
  readonly onAgain: () => void;
  readonly headingRef: Ref<HTMLHeadingElement>;
}) {
  const attachments = done.attachments;
  const incomplete = attachments !== null && attachments.missing.length > 0;
  const outlookTooOld =
    attachments?.missing.some((entry) => entry.reason === 'outlook_too_old') === true;
  const rebuildRejected =
    attachments?.missing.some((entry) => entry.reason === 'rebuild_rejected') === true;

  return (
    <Section title={doneTitle(attachments)} headingRef={headingRef}>
      <Callout tone={incomplete ? 'warning' : 'success'} title={<Foreign value={done.title} />}>
        {attachments === null ? CREATED_SENTENCE : attachedLine(attachments)}
        {attachments !== null && showsAttachedList(attachments) ? (
          <AttachedList entries={attachments.attached} />
        ) : null}
        {/*
          Z3a (Entwurf 6.3a). Er steht **unter** der Liste, in der die Zeile
          bereits `– die E-Mail (nachgebaut)` trägt: Die Kennzeichnung hängt an
          der Zeile, der Absatz erklärt sie. Wer die Zeile versteht, muß ihn nie
          wieder lesen.

          Er erscheint **auch dann**, wenn daneben etwas fehlt (Z4). Die beiden
          Zustände schließen einander nicht aus — eine E-Mail kann nachgebaut
          angekommen sein, während eine Datei zu groß war —, und der Absatz
          spricht über die Datei, die **da** ist.
        */}
        {attachments?.rebuiltMessage === true ? (
          <>
            <p className="pane-note">{REBUILT_MESSAGE_NOTE}</p>
            <p className="pane-note">{REBUILT_MESSAGE_PERSISTENCE}</p>
          </>
        ) : null}
        {incomplete ? (
          <>
            <p className="pane-note">Nicht übernommen:</p>
            <MissingList missing={attachments.missing} limits={attachments.limits} />
            {outlookTooOld ? <p className="pane-note">{OUTLOOK_REQUIREMENT_HINT}</p> : null}
            {/*
              Der Erklärabsatz zu Z4 Sonderfall 2 (Entwurf 6.4, AK-28). Er
              steht **unter** der Fehlliste, in der die Zeile bereits „— sie
              ließ sich nicht als Datei nachbauen." trägt: Die Zeile nennt den
              Grund, der Absatz erklärt ihn — dieselbe Ordnung wie beim
              Nachbau darüber.
            */}
            {rebuildRejected ? (
              <>
                <p className="pane-note">{REBUILD_REJECTED_NOTE}</p>
                <p className="pane-note">{REBUILD_REJECTED_NOT_YOUR_FAULT}</p>
              </>
            ) : null}
            <p className="pane-note">{catchUpNote(catchUpSubject(attachments.missing))}</p>
            <p className="pane-note">{NO_ATTACHMENT_ON_EXISTING}</p>
          </>
        ) : null}
        {done.addedDefaults > 0
          ? ` ${String(done.addedDefaults)} Standard-Tag(s) wurden automatisch gesetzt.`
          : ''}
        {done.createdTagNames.length > 0 ? (
          <p className="pane-note">
            {done.createdTagNames.length === 1 ? 'Neues Tag: ' : 'Neue Tags: '}
            {done.createdTagNames.map((name, index) => (
              <Fragment key={name}>
                {index > 0 ? ', ' : ''}„<Foreign value={name} />“
              </Fragment>
            ))}{' '}
            — ab jetzt auch in SuperTakt auswählbar.
          </p>
        ) : null}
      </Callout>
      <div className="pane-actions">
        <Button variant="secondary" full onClick={onAgain}>
          Noch etwas aus dieser E-Mail
        </Button>
      </div>
    </Section>
  );
}

interface DetectionLine {
  readonly help: string | undefined;
  readonly callout: ReactNode;
}

function describeDetection(detection: Detection | null): DetectionLine {
  if (detection === null) return { help: 'Wird gesucht …', callout: null };

  switch (detection.kind) {
    case 'match':
      return {
        help:
          detection.origin === 'subject'
            ? 'Aus dem Betreff erkannt.'
            : 'Aus dem Text der E-Mail erkannt.',
        callout: null,
      };
    case 'no_match':
      return { help: NO_CALL_NUMBER_FOUND, callout: null };
    case 'implausible':
      return {
        help: undefined,
        callout: (
          <Callout tone="warning" title="Gefunden, aber nicht übernommen">
            Der Ausdruck hat <Foreign className="mono" value={clip(detection.raw)} /> geliefert.{' '}
            {REJECTION_LABEL[detection.reason]}
          </Callout>
        ),
      };
    case 'pattern_invalid':
      return {
        help: undefined,
        callout: (
          <Callout tone="warning" title="Der Ausdruck in den Einstellungen lässt sich nicht verwenden">
            {detection.message} {CALL_NUMBER_BY_HAND}
          </Callout>
        ),
      };
    case 'timeout':
      return {
        help: undefined,
        callout: (
          <Callout tone="warning" title="Erkennung abgebrochen">
            Der eingestellte Ausdruck hat für diese E-Mail zu lange gerechnet und wurde nach 100
            Millisekunden beendet. Bitte den Ausdruck in den Einstellungen vereinfachen.
          </Callout>
        ),
      };
    case 'unavailable':
      return {
        help: undefined,
        callout: (
          <Callout tone="info" title="Keine automatische Erkennung">
            Die Auswertung läuft in einem eigenen Faden, der in dieser Umgebung nicht zur Verfügung
            steht. {CALL_NUMBER_BY_HAND}
          </Callout>
        ),
      };
    default:
      return { help: undefined, callout: null };
  }
}

const clip = (value: string): string =>
  value.length <= 40 ? value : `${cutToCharacterBoundary(value, 40)}…`;
