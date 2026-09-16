import { saveMail } from '../office/save-mail.ts';
import { DEFAULT_TARGET, type AddinDefaults } from '../settings/store.ts';
import { validDefaults, tagIdsInTree } from '../settings/target.ts';


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
import { suggestTitle, type MailFacts } from '../office/mail.ts';
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
  readonly defaults?: AddinDefaults;
  readonly mail: MailFacts;
  readonly detection: Detection | null;
  readonly api: ApiClient;
  readonly hasToken: boolean;

  readonly attachments: MailAttachmentAccess | null;
  readonly onOpenSettings: () => void;
  readonly onConnected: () => void;
}


const ATTACHMENT_TIMEOUT_MS = 60_000;


const CANCELLED_NOTE = 'Abgebrochen. Es ist kein Todo entstanden. Die Eingaben bleiben stehen.';


const MAIL_SWITCHED_NOTE =
  'Die geöffnete E-Mail hat gewechselt. Das Sammeln wurde abgebrochen. Bereits gesendete Anfragen können gespeichert sein.';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly context: AddinContextDto }
  | { readonly kind: 'failed'; readonly failure: ApiFailure };


interface DoneAttachments {

  readonly stored: number;
  readonly attached: readonly AttachedEntry[];
  readonly missing: readonly MissingAttachment[];
  readonly limits: TakeoverLimits;

  readonly rebuiltMessage: boolean;
}

interface Done {
  readonly kind: 'created' | 'appended' | 'already_present';
  readonly title: string;
  readonly addedDefaults: number;
  readonly createdTagNames: readonly string[];

  readonly attachments: DoneAttachments | null;
}


type Flow =
  | { readonly kind: 'form' }
  | { readonly kind: 'collecting'; readonly progress: readonly EntryProgress[] }
  | { readonly kind: 'creating'; readonly progress: readonly EntryProgress[] };

export function TaskPane({
  mail,
  defaults = DEFAULT_TARGET,
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
  const [dueTime, setDueTime] = useState('');
  const [statusId, setStatusId] = useState<string | null>(defaults.statusId);
  const [includeExcerpt, setIncludeExcerpt] = useState(defaults.includeExcerpt);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [target, setTarget] = useState<'auto' | 'new' | { todoId: string }>('auto');
  const [lookupBusy, setLookupBusy] = useState(false);
  const lookupGeneration = useRef(0);
  const submitting = useRef(false);
  const manualCallNumber = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  const appending = typeof target === 'object';

  const [offers, setOffers] = useState<readonly OfferDescription[]>([]);
  const showCreateFields = target === 'new' || (!lookupBusy && offers.length === 0);

  const [checkedCallNumber, setCheckedCallNumber] = useState<string | null>(null);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [flow, setFlow] = useState<Flow>({ kind: 'form' });
  const [cancelNote, setCancelNote] = useState<string | null>(null);


  const runRef = useRef<AbortController | null>(null);
  useEffect(() => () => { runRef.current?.abort(); lookupGeneration.current += 1; }, []);

  const cancelReasonRef = useRef<string>(CANCELLED_NOTE);

  useEffect(() => {
    if (!manualCallNumber.current) setCallNumber(detection?.kind === 'match' ? detection.value : '');
  }, [detection]);


  const mailRef = useRef<MailFacts>(mail);
  useEffect(() => {
    if (mailRef.current === mail) return;
    mailRef.current = mail;

    if (runRef.current !== null) {
      cancelReasonRef.current = MAIL_SWITCHED_NOTE;
      runRef.current.abort();
    }

    lookupGeneration.current += 1;
    setOffers([]);
    setCheckedCallNumber(null);
    manualCallNumber.current = false;
    setCallNumber('');
    setTarget('auto');
    setDueTime('');
    requestId.current = crypto.randomUUID();
    setTitle(suggestTitle(mail.subject));
    setNote('');
    setDueDate('');
    setSelectedTags(defaults.tagIds);
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
        const initial = validDefaults(defaults, result.value);
        setSelectedTags(initial.tagIds);
        setStatusId(initial.statusId);
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
    if (result.ok) {
      setLoad({ kind: 'ready', context: result.value });
      const ids = tagIdsInTree(result.value.tagTree);
      setSelectedTags(current => current.filter(id => ids.has(id)));
      setStatusId(current => result.value.statuses.some(status => status.id === current) ? current : result.value.defaultStatusId);
    } else setFailure(result);
  }, [api]);

  const lookup = useCallback(
    async (value: string): Promise<void> => {
      const generation = ++lookupGeneration.current;
      setLookupBusy(true);
      setOffers([]);
      setTarget(current => current === 'new' ? current : 'auto');
      const decision = decideLookup(value);
      if (decision.kind === 'skip') {
        setLookupBusy(false);
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
      if (generation !== lookupGeneration.current) return;
      setLookupBusy(false);
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
      const next = describeOffers(result.value.matches);
      setOffers(next);
      setTarget(current => current === 'new' ? current : next.length === 1 ? { todoId: next[0]!.todoId } : 'auto');
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
        : planTakeover(includeAttachments ? attachments.facts : [], limits, attachments.capabilities),
    [attachments, limits, includeAttachments],
  );


  const edited = useCallback((): void => {
    setCancelNote(null);
  }, []);

  const gate = useMemo(
    () =>
      createTodoGate({
        title: appending ? 'E-Mail' : title,
        connection: load.kind,
        callNumberProblem,
        dueDateInvalid: !appending && dueEntry.kind === 'invalid',
      }),
    [title, appending, load.kind, callNumberProblem, dueEntry.kind],
  );


  const progressHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const doneHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const callNumberRef = useRef<HTMLInputElement | null>(null);

  const leftDoneRef = useRef(false);

  useEffect(() => {
    if (flow.kind === 'collecting') progressHeadingRef.current?.focus();
  }, [flow.kind]);

  useEffect(() => {
    if (done !== null) {
      doneHeadingRef.current?.focus();
      return;
    }

    if (!leftDoneRef.current) return;
    leftDoneRef.current = false;
    callNumberRef.current?.focus();
  }, [done]);

  useEffect(() => {
    // Z5 und Z6 — dorthin, wo der nächste Versuch beginnt.
    if (failure !== null || cancelNote !== null) submitRef.current?.focus();
  }, [failure, cancelNote]);


  const submitCreate = async (): Promise<void> => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    const submittedMail = mail;
    try {
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

      const result = await saveMail(api, mail, {
        title: title.trim(),
        callNumber: callNumber.trim().length === 0 ? null : callNumber.trim(),
        statusId,
        tagIds: selectedTags,
        tagNames: newTagNames,
        note,
        dueDate: dueDateForRequest(dueEntry),
        dueTime: dueDate ? dueTime || null : null,
        estimateMinutes: null,
        requestId: requestId.current,

        attachments: payload === null ? null : { sender: senderForIntake(mail), items: payload },
      }, target, includeExcerpt);
      if (mailRef.current !== submittedMail) return;

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
        kind: result.value.outcome ?? 'created',
        title: result.value.todo.title,
        addedDefaults: result.value.addedDefaultTagIds.length,
        createdTagNames: result.value.createdTags.map((tag) => tag.name),
        attachments:
          payload === null || limits === null
            ? null
            : describeTakeover(payload, missing, limits, result.value.attachments ?? null),
      });
    } catch {
      setFailure({ ok: false, kind: 'failed', code: null, message: 'Die Übernahme ist fehlgeschlagen. Eine gesendete Anfrage kann bereits gespeichert sein; erneutes Senden verwendet dieselbe Kennung.' });
    } finally {
      submitting.current = false;
      setBusy(false);
      setFlow({ kind: 'form' });
    }
  };

  const cancelRun = (): void => {
    cancelReasonRef.current = CANCELLED_NOTE;
    runRef.current?.abort();
  };


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
        {detection?.kind === 'match' && detection.warning ? <Callout tone="warning">{detection.warning}</Callout> : null}
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
                manualCallNumber.current = true;
                setCallNumber(event.target.value);
              }}
            />
          )}
        </Field>
        {lookupNote !== null ? <Callout tone="info">{lookupNote}</Callout> : null}
      </Section>

      <DuplicateOffer offers={offers} checkedCallNumber={checkedCallNumber} target={target} onTarget={setTarget} />

      {failure !== null ? <Failure failure={failure} onOpenSettings={onOpenSettings} /> : null}

      <Section title={showCreateFields ? 'Neue Aufgabe' : 'E-Mail anhängen'}>
        {appending ? <p>Aufgabenfelder und vorhandene Notizen bleiben erhalten. Eigene Ergänzungen stehen bei dieser E-Mail.</p> : null}
        {showCreateFields ? <fieldset className="mail-create-fields">
        {load.kind === 'ready' ? <Field label="Ablagevorgabe: Status" htmlFor="status">
          {(aria) => <select {...aria} className="input" value={statusId ?? load.context.defaultStatusId} onChange={event => setStatusId(event.target.value)}>
            {load.context.statuses.map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
          </select>}
        </Field> : null}
        <p className="pane-note">Status und Tags bestimmen, in welchen regelbasierten Pools die Aufgabe erscheint.</p>
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
          hint="SuperTakt sucht in der E-Mail nicht nach einer Frist — Sie tragen sie selbst ein. Uhrzeit optional; leer lassen heißt: keine Frist."
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

        <Field label="Fälligkeitsuhrzeit (optional)" htmlFor="due-time">
          {(aria) => <input {...aria} className="input" type="time" disabled={!dueDate} value={dueTime} onChange={event => setDueTime(event.target.value)} />}
        </Field>
        </fieldset> : null}
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

        <label className="mail-option"><input type="checkbox" checked={includeExcerpt} onChange={event => setIncludeExcerpt(event.target.checked)} /> E-Mail-Auszug in die Notizen übernehmen</label>
        <label className="mail-option"><input type="checkbox" checked={includeAttachments} onChange={event => setIncludeAttachments(event.target.checked)} /> Datei-Anhänge übernehmen ({attachments?.facts.filter(entry => !entry.isInline).length ?? 0})</label>

      </Section>

      {plan !== null && limits !== null && attachments !== null ? (
        <AttachmentPreview
          plan={plan}
          limits={limits}
          outlookTooOld={!attachments.capabilities.canReadAttachments}
        />
      ) : null}

      <Button variant="ghost" disabled={busy} onClick={() => { void refreshContext(); }}>Referenzdaten neu laden</Button>
      <div className="pane-actions">
        {cancelNote !== null ? <p className="pane-note">{cancelNote}</p> : null}
        {load.kind === 'ready' && load.context.mailAssignment?.accepted !== true ? <p>Der lokale Dienst unterstützt den Mailverlauf noch nicht. Bitte SuperTakt aktualisieren.</p> : null}
        {gate.reason !== null ? <p className="pane-note">{gate.reason}</p> : null}
        <Button
          ref={submitRef}
          variant="primary"
          full
          loading={busy}
          disabled={gate.blocked || busy || lookupBusy || (detection === null && !manualCallNumber.current) || (load.kind === 'ready' && load.context.mailAssignment?.accepted !== true) || (offers.length > 1 && target === 'auto')}
          onClick={() => {
            void submitCreate();
          }}
        >
          {appending ? 'E-Mail an Aufgabe anhängen' : 'Neue Aufgabe anlegen'}
        </Button>
      </div>
    </div>
  );


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
        setTarget('new');
        requestId.current = crypto.randomUUID();
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


const spokenResult = (done: Done): string => {
  const attachments = done.attachments;
  if (done.kind === 'already_present') return 'Bereits vorhanden.';
  if (done.kind === 'appended') return 'E-Mail zur Aufgabe ergänzt.';
  if (attachments === null) return `${doneTitle(null)}. ${CREATED_SENTENCE}`;
  const core = attachedCore(attachments);

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
      {}
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

    rebuiltMessage: reconciled.attached.some(
      (entry) => entry.kind === 'message' && entry.rebuilt,
    ),
  };
};


const senderForIntake = (mail: MailFacts): string | null => {
  const name = mail.senderName.trim();
  const address = mail.senderAddress.trim();
  if (name.length > 0 && address.length > 0) return `${name} <${address}>`;
  if (name.length > 0) return name;
  if (address.length > 0) return address;
  return null;
};


const doneTitle = (attachments: DoneAttachments | null): string => {
  if (attachments === null || attachments.missing.length === 0) return 'Todo angelegt';
  if (attachments.missing.length === 1 && attachments.missing[0]?.isMessage === true) {
    return 'Todo angelegt — die E-Mail fehlt';
  }
  return attachments.missing.length === 1
    ? 'Todo angelegt — 1 Anhang fehlt'
    : `Todo angelegt — ${String(attachments.missing.length)} Anhänge fehlen`;
};


const CREATED_SENTENCE = 'Das Todo ist in SuperTakt angelegt.';


const attachedCore = (attachments: DoneAttachments): string => {
  const total = attachments.stored + attachments.missing.length;
  if (attachments.stored === 0) return 'Kein Anhang aus dieser E-Mail hängt daran';
  if (attachments.missing.length > 0) {
    const verb = attachments.stored === 1 ? 'hängt' : 'hängen';
    return `${String(attachments.stored)} von ${String(total)} Anhängen ${verb} daran`;
  }
  if (attachments.stored === 1) {

    return attachments.rebuiltMessage
      ? 'Die E-Mail hängt als Nachbau daran'
      : 'Die E-Mail hängt als Datei daran';
  }
  return `${String(attachments.stored)} Anhänge hängen daran`;
};


const showsAttachedList = (attachments: DoneAttachments): boolean =>
  attachments.attached.length > 0 && attachments.attached.length === attachments.stored;


const attachedLine = (attachments: DoneAttachments): string =>
  `${CREATED_SENTENCE} ${attachedCore(attachments)}${showsAttachedList(attachments) ? ':' : '.'}`;


const REBUILT_MESSAGE_NOTE =
  'Die E-Mail ist ein Nachbau: Outlook hat die ursprüngliche Nachricht nicht als Datei ' +
  'hergegeben. Absender, Empfänger, Betreff, Versanddatum und Text stehen in der Datei. ' +
  'Die technischen Kopfzeilen der ursprünglichen Nachricht stehen nicht darin — und mit ' +
  'ihnen nicht der Nachweis, welchen Weg sie genommen hat.';


const REBUILT_MESSAGE_PERSISTENCE =
  'Die Datei ist in SuperTakt dauerhaft als Nachbau gekennzeichnet.';


const catchUpNote = (what: 'Datei' | 'Nachricht'): string =>
  `Nachtragen lässt sich das nur in SuperTakt: die ${what} in Outlook speichern und am Todo unter „Anhänge“ mit ihrem vollständigen Pfad hinzufügen.`;


const catchUpSubject = (missing: readonly MissingAttachment[]): 'Datei' | 'Nachricht' =>
  missing.length > 0 && missing.every((entry) => entry.isMessage) ? 'Nachricht' : 'Datei';


const REBUILD_REJECTED_NOTE =
  'Die ursprüngliche Nachricht war nicht zu bekommen, und der Nachbau ist an einer Angabe ' +
  'dieser Nachricht gescheitert: Sie würde in der Datei nicht als Text stehen, sondern deren ' +
  'Aufbau verändern. SuperTakt bricht dann ab, statt eine Datei zu erzeugen, die mehr enthält ' +
  'als die Nachricht.';


const REBUILD_REJECTED_NOT_YOUR_FAULT =
  'Das liegt an dieser Nachricht, nicht an Ihren Eingaben, und ein zweiter Versuch ändert daran nichts.';


const NO_ATTACHMENT_ON_EXISTING =
  'Erneutes Zuordnen derselben E-Mail erzeugt keine doppelten Mail-Einträge oder Anhänge.';

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
    <Section title={done.kind === 'already_present' ? 'Bereits vorhanden' : done.kind === 'appended' ? 'E-Mail ergänzt' : doneTitle(attachments)} headingRef={headingRef}>
      <Callout tone={incomplete ? 'warning' : 'success'} title={<Foreign value={done.title} />}>
        {done.kind === 'already_present' ? `Diese E-Mail ist bereits zugeordnet.${incomplete ? ' Einzelne Anhänge fehlen weiterhin.' : ''}` : done.kind === 'appended' ? `Die E-Mail wurde ergänzt.${incomplete ? ' Einzelne Anhänge fehlen.' : ''}` : attachments === null ? CREATED_SENTENCE : attachedLine(attachments)}
        {attachments !== null && showsAttachedList(attachments) ? (
          <AttachedList entries={attachments.attached} />
        ) : null}
        {}
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
            {}
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
