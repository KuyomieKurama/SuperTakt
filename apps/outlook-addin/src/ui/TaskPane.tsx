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
import { MESSAGE_DISPLAY_NAME, TAKEOVER_LIMITS } from '../attachments/model.ts';
import { OUTLOOK_REQUIREMENT_HINT } from '../attachments/reasons.ts';
import { planTakeover } from '../attachments/plan.ts';
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
 * `stored` kommt aus der **Antwort des Dienstes** und nicht aus der eigenen
 * Zählung: „3 Anhänge hängen daran" ist eine Aussage über den Bestand. Was der
 * Aufgabenbereich allein weiß, ist `missing` — die Anhänge, die es nicht bis
 * zum Anlegeruf geschafft haben, und die kennt der Dienst nicht.
 */
interface DoneAttachments {
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

  if (!hasToken) {
    return (
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
    );
  }

  if (done !== null) {
    return <DoneView done={done} onAgain={() => setDone(null)} />;
  }

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
          : {
              attached: attachedEntries(payload, result.value.attachments?.rejected ?? []),
              missing: [...missing, ...rejectedAsMissing(result.value.attachments?.rejected ?? [])],
              limits,
              rebuiltMessage: messageArrivedRebuilt(
                payload,
                result.value.attachments?.rejected ?? [],
              ),
            },
    });
  };

  const cancelRun = (): void => {
    cancelReasonRef.current = CANCELLED_NOTE;
    runRef.current?.abort();
  };

  if (plan !== null && flow.kind !== 'form') {
    return (
      <AttachmentProgress
        plan={plan}
        progress={flow.progress}
        creating={flow.kind === 'creating'}
        onCancel={cancelRun}
      />
    );
  }

  return (
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
}

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
 * Was der Dienst abgewiesen hat, in dieselbe Liste wie das, was Outlook nicht
 * hergegeben hat (A-19.29).
 *
 * Zwei Quellen, ein Ergebnis: Für den Benutzer ist „fehlt" dasselbe, gleich an
 * welcher Stelle es gescheitert ist. Der Grund unterscheidet sich, und den
 * nennt die Zeile.
 */
const rejectedAsMissing = (
  rejected: readonly CreatedAttachmentsDto['rejected'][number][],
): readonly MissingAttachment[] =>
  rejected.map((entry) => ({
    displayName: entry.displayName,
    /*
     * **Der Grund kommt vom Dienst und wird nicht hier gesetzt** (T-304).
     *
     * Bis dahin stand hier ein festes `rejected`. Das war die einzige
     * Auskunft, die die Antwort trug — und es war an drei von acht Fällen
     * falsch: Eine zu große Datei ist `too_large` und nennt ihre Größe, ein
     * Cloud-Verweis mit unzulässiger Adresse ist `not_a_web_address`. Der
     * Benutzer las „SuperTakt hat die Datei nicht angenommen", wo die Datei
     * 31,4 MB groß war, und konnte daraus nichts machen.
     */
    reason: entry.reason,
    bytes: entry.bytes,
    isMessage: entry.displayName === MESSAGE_DISPLAY_NAME,
  }));

/** Die Nutzlasten, die der Dienst **nicht** abgewiesen hat. */
const attachedEntries = (
  payload: readonly AttachmentPayload[],
  rejected: readonly { readonly displayName: string }[],
): readonly AttachedEntry[] => {
  const refused = new Set(rejected.map((entry) => entry.displayName));
  return payload
    .filter((entry) => !refused.has(entry.displayName))
    .map(attachedEntry);
};

/**
 * Ist die E-Mail als **Nachbau** am Todo angekommen? (Z3a.)
 *
 * Zwei Bedingungen, und beide müssen erfüllt sein: Die Nachricht war ein
 * Nachbau (`rebuilt`), **und** der Dienst hat sie nicht abgewiesen. Fehlt die
 * zweite, fehlt die Datei — und dann ist es Z4 und nicht Z3a. Ein Satz über
 * eine dauerhafte Kennzeichnung an einer Datei, die es nicht gibt, wäre die
 * Sorte Text, gegen die E-100 Punkt 3 geschrieben ist.
 */
const messageArrivedRebuilt = (
  payload: readonly AttachmentPayload[],
  rejected: readonly { readonly displayName: string }[],
): boolean => {
  const refused = new Set(rejected.map((entry) => entry.displayName));
  return payload.some(
    (entry) => entry.kind === 'message' && entry.rebuilt && !refused.has(entry.displayName),
  );
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

/** „2 von 3 Anhängen hängen daran" bzw. „3 Anhänge hängen daran". */
const attachedLine = (attachments: DoneAttachments): string => {
  const total = attachments.attached.length + attachments.missing.length;
  if (attachments.attached.length === 0) {
    return 'Das Todo ist in SuperTakt angelegt. Kein Anhang aus dieser E-Mail hängt daran:';
  }
  if (attachments.missing.length > 0) {
    return `Das Todo ist in SuperTakt angelegt. ${String(attachments.attached.length)} von ${String(total)} Anhängen hängen daran:`;
  }
  if (attachments.attached.length === 1) {
    /*
     * Der Fall aus A-19.27: eine E-Mail ohne Dateianhänge. Ist sie ein
     * Nachbau, steht **hier schon** das Wort und nicht erst im Absatz darunter
     * (Entwurf 6.3a, „Bei genau einem Anhang"): Die nachgebaute Datei ist dann
     * das einzige, was vom Postfach am Todo hängt.
     */
    return attachments.rebuiltMessage
      ? 'Das Todo ist in SuperTakt angelegt. Die E-Mail hängt als Nachbau daran.'
      : 'Das Todo ist in SuperTakt angelegt. Die E-Mail hängt als Datei daran.';
  }
  return `Das Todo ist in SuperTakt angelegt. ${String(attachments.attached.length)} Anhänge hängen daran:`;
};

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
 */
const CATCH_UP_NOTE =
  'Nachtragen lässt sich das nur in SuperTakt: die Datei in Outlook speichern und am Todo unter „Anhänge“ mit ihrem vollständigen Pfad hinzufügen.';

/** Die Abwesenheitszusage, die die Frage beantwortet, die der Benutzer hier stellt. */
const NO_ATTACHMENT_ON_EXISTING =
  'Über diesen Aufgabenbereich entsteht an einem vorhandenen Todo kein Anhang.';

function DoneView({ done, onAgain }: { readonly done: Done; readonly onAgain: () => void }) {
  const attachments = done.attachments;
  const incomplete = attachments !== null && attachments.missing.length > 0;
  const outlookTooOld =
    attachments?.missing.some((entry) => entry.reason === 'outlook_too_old') === true;

  return (
    <Section title={doneTitle(attachments)}>
      <Callout tone={incomplete ? 'warning' : 'success'} title={<Foreign value={done.title} />}>
        {attachments === null ? 'Das Todo ist in SuperTakt angelegt.' : attachedLine(attachments)}
        {attachments !== null && attachments.attached.length > 0 ? (
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
            <p className="pane-note">{CATCH_UP_NOTE}</p>
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
