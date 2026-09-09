/**
 * SuperTakt — Aufgabenbereich des Outlook-Add-ins.
 *
 * Wird zu einer erkannten Call-Nummer bereits ein Todo gefunden, wird die
 * E-Mail nicht mehr als Zeitbuchung behandelt. Der Benutzer kann stattdessen
 * den Outlook-Verweis an genau dieses Todo hängen. Damit entsteht **keine**
 * Zeit, kein Exporttext und kein Wiederöffnen eines erledigten Todos.
 */

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
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
import { decideLookup, describeOffers, type OfferDescription } from '../duplicate/rule.ts';
import { dueDateForRequest, readDueDate } from '../duedate/entry.ts';
import { prepareNote, suggestTitle, type MailFacts } from '../office/mail.ts';
import type { ApiClient, ApiFailure } from '../api/client.ts';
import type { AddinContextDto } from '../api/types.ts';
import { cutToCharacterBoundary } from '../text/cut.ts';
import { visibleText } from '../text/hidden.ts';
import { createTodoGate } from './create-gate.ts';
import { Button, Callout, Field, Foreign, Section, Skeleton } from './Primitives.tsx';
import { DuplicateOffer } from './DuplicateOffer.tsx';
import { TagPicker } from './TagPicker.tsx';

export interface TaskPaneProps {
  readonly mail: MailFacts;
  /** Deep-Link auf genau die aktuell geöffnete Outlook-Nachricht. */
  readonly mailLink: string | null;
  readonly detection: Detection | null;
  readonly api: ApiClient;
  readonly hasToken: boolean;
  readonly onOpenSettings: () => void;
  readonly onConnected: () => void;
}

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly context: AddinContextDto }
  | { readonly kind: 'failed'; readonly failure: ApiFailure };

type Done =
  | {
      readonly kind: 'created';
      readonly title: string;
      readonly addedDefaults: number;
      readonly createdTagNames: readonly string[];
    }
  | {
      readonly kind: 'attached';
      readonly title: string;
      readonly alreadyPresent: boolean;
    };

const mailAttachmentTitle = (mail: MailFacts): string => {
  const subject = visibleText(mail.subject).replace(/\s+/g, ' ').trim();
  const label = subject.length === 0 ? 'Outlook-E-Mail' : `Outlook: ${subject}`;
  return cutToCharacterBoundary(label, 200);
};

export function TaskPane({
  mail,
  mailLink,
  detection,
  api,
  hasToken,
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
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyTodoId, setBusyTodoId] = useState<string | null>(null);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    if (detection?.kind === 'match') setCallNumber(detection.value);
  }, [detection]);

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
        setLookupNote(null);
        return;
      }
      if (!result.value.searched) {
        setOffers([]);
        setLookupNote(result.value.message);
        return;
      }

      setLookupNote(null);
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

  const submitCreate = async (): Promise<void> => {
    setBusy(true);
    setFailure(null);

    const result = await api.createTodo({
      title: title.trim(),
      callNumber: callNumber.trim().length === 0 ? null : callNumber.trim(),
      statusId: null,
      tagIds: selectedTags,
      tagNames: newTagNames,
      note,
      dueDate: dueDateForRequest(dueEntry),
    });

    setBusy(false);
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
    });
  };

  const submitAttachment = async (offer: OfferDescription): Promise<void> => {
    if (mailLink === null) {
      setFailure({
        ok: false,
        kind: 'failed',
        code: 'outlook_link_unavailable',
        message:
          'Outlook konnte für diese Nachricht keinen Web-Verweis bereitstellen. Es wurde nichts am vorhandenen Todo geändert.',
      });
      return;
    }

    setBusyTodoId(offer.todoId);
    setFailure(null);
    const result = await api.addLinkAttachment({
      todoId: offer.todoId,
      url: mailLink,
      title: mailAttachmentTitle(mail),
    });
    setBusyTodoId(null);

    if (!result.ok) {
      setFailure(result);
      return;
    }

    setDone({
      kind: 'attached',
      title: offer.title,
      alreadyPresent: result.value.alreadyPresent,
    });
  };

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
              onChange={(event) => setCallNumber(event.target.value)}
            />
          )}
        </Field>
        {lookupNote !== null ? <Callout tone="info">{lookupNote}</Callout> : null}
      </Section>

      <DuplicateOffer
        offers={offers}
        busyTodoId={busyTodoId}
        canAttach={mailLink !== null}
        onChoose={(offer) => {
          void submitAttachment(offer);
        }}
      />

      {offers.length > 0 && dueEntry.kind !== 'none' ? (
        <p className="pane-note">
          Die eingetragene Frist gilt nur für ein neues Todo. Das vorhandene Todo behält seine eigene Frist.
        </p>
      ) : null}

      {failure !== null ? <Failure failure={failure} onOpenSettings={onOpenSettings} /> : null}

      <Section title="Neues Todo">
        <Field label="Titel" htmlFor="title">
          {(aria) => (
            <input
              {...aria}
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
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
              onChange={(event) => setDueDate(event.target.value)}
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
                onChange={setSelectedTags}
                newNames={newTagNames}
                onNewNamesChange={setNewTagNames}
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
              onChange={(event) => setNote(event.target.value)}
            />
          )}
        </Field>

        <Button variant="ghost" onClick={() => setNote(prepareNote(mail))}>
          Inhalt der E-Mail übernehmen
        </Button>
      </Section>

      <div className="pane-actions">
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
          Todo anlegen
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
  url: 'Outlook-Verweis',
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

function DoneView({ done, onAgain }: { readonly done: Done; readonly onAgain: () => void }) {
  if (done.kind === 'attached') {
    return (
      <Section title="E-Mail angehängt">
        <Callout tone="success" title={<Foreign value={done.title} />}>
          {done.alreadyPresent
            ? 'Der Outlook-Verweis war an diesem Todo bereits vorhanden. Es wurde keine Zeit erfasst.'
            : 'Die E-Mail wurde als Outlook-Verweis an das vorhandene Todo angehängt. Es wurde keine Zeit erfasst.'}
        </Callout>
        <div className="pane-actions">
          <Button variant="secondary" full onClick={onAgain}>
            Noch etwas aus dieser E-Mail
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Todo angelegt">
      <Callout tone="success" title={<Foreign value={done.title} />}>
        Das Todo ist in SuperTakt angelegt.
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
