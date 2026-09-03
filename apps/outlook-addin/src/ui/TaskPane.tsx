/**
 * Takt — S-12, der Aufgabenbereich (A-10.1 bis A-10.9, A-2.6, A-9.3, A-9.5, I-01).
 *
 * Der Ablauf von oben nach unten ist die Reihenfolge, in der ein Mensch die
 * Entscheidungen trifft:
 *
 * ```
 *   E-Mail          Betreff und Absender, damit klar ist, worauf sich alles bezieht
 *   Call-Nummer     erkannt oder nicht, mit Herkunft — und immer änderbar (B-4.3 Punkt 5)
 *   Angebot         nur bei plausibler Nummer und nur als Angebot (A-10.9, R-15)
 *   Titel           Vorschlag aus dem Betreff
 *   Tags            über die API, mit Suche über vier und mehr Ebenen (A-10.4)
 *   Vermerk         intern, ausdrücklich beschriftet (A-7.2, B-12.3)
 *   Anlegen         die Hauptaktion
 * ```
 *
 * Die Beschriftung der beiden Notizfelder ist dieselbe wie in der
 * Hauptanwendung (E-016, R-08): **Vermerk** bleibt intern, **Leistung** geht in
 * die Abrechnung. Im Add-in ist das besonders wichtig, weil hier Text aus einer
 * fremden E-Mail einfließt (B-12.3).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { DURATION_PRESETS_MINUTES, MAX_DURATION_MINUTES } from '../config.ts';
import { INPUT_REJECTION_LABEL, REJECTION_LABEL } from '../callnumber/labels.ts';
import type { Detection } from '../callnumber/detect.ts';
import {
  decideLookup,
  describeOffers,
  offerMovement,
  type OfferDescription,
} from '../duplicate/rule.ts';
import {
  bookingOutcome,
  bookingPoolSentence,
  reopenOutcome,
  reopenPreview,
  type PoolMovement,
  type ReopenNotice,
} from '../duplicate/reopen.ts';
import { prepareNote, suggestTitle, type MailFacts } from '../office/mail.ts';
import type { ApiClient, ApiFailure } from '../api/client.ts';
import type { AddinContextDto } from '../api/types.ts';
import { Button, Callout, Field, Section, Skeleton } from './Primitives.tsx';
import { DuplicateOffer } from './DuplicateOffer.tsx';
import { TagPicker } from './TagPicker.tsx';

export interface TaskPaneProps {
  readonly mail: MailFacts;
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
      /**
       * Namen der Tags, die durch dieses Anlegen **neu entstanden** sind
       * (T-061) — in der Schreibweise, die der Dienst vergeben hat, nicht in
       * der des Eingabefelds.
       *
       * Ein Tag anzulegen wirkt über dieses Todo hinaus; es steht danach in der
       * Hauptanwendung, in jeder Tagliste und möglicherweise in einer
       * Pool-Regel. Wer es ausgelöst hat, soll es nicht erst dort entdecken.
       */
      readonly createdTagNames: readonly string[];
    }
  | {
      readonly kind: 'booked';
      readonly title: string;
      readonly minutes: number;
      /**
       * War das Todo erledigt und ist es durch diese Buchung wieder offen?
       *
       * Ein Wert, nicht zwei: Seit T-038 fallen „war erledigt" und „ist wieder
       * offen" zusammen (A-2.5). Zwei Felder hier wären die Behauptung, es
       * gäbe wieder einen Fall dazwischen.
       */
      readonly reopened: boolean;
      /**
       * Wohin sich das Todo durch die Buchung bewegt — aus dem Dienst
       * (E-056, T-084).
       *
       * Ein Wert und keine drei Listen nebeneinander: `appears`, `enters` und
       * `leaves` sind gleich getippt, und vertauscht ergäben sie einen Satz,
       * der sich richtig liest und das Gegenteil behauptet.
       *
       * Steht unabhängig von `reopened` da, weil beide Fälle daraus einen Satz
       * bauen — der erledigte den über die Rückkehr, der offene den über die
       * Bewegung.
       */
      readonly movement: PoolMovement;
    };

export function TaskPane({
  mail,
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
  /** Tagnamen, die es in Takt noch nicht gibt (T-061). Gehen als `tagNames` mit. */
  const [newTagNames, setNewTagNames] = useState<readonly string[]>([]);
  const [note, setNote] = useState('');
  const [offers, setOffers] = useState<readonly OfferDescription[]>([]);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [booking, setBooking] = useState<OfferDescription | null>(null);
  const [minutes, setMinutes] = useState(15);
  const [service, setService] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  /** Übernimmt den erkannten Wert — sichtbar, nicht still (B-4.3 Punkt 5). */
  useEffect(() => {
    if (detection?.kind === 'match') {
      setCallNumber(detection.value);
    }
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

  /**
   * Den Baum erneut holen, nachdem ein Tag entstanden ist (T-061).
   *
   * **Ein Fehlschlag bleibt hier folgenlos.** Der Anlegevorgang ist zu diesem
   * Zeitpunkt abgeschlossen; das Todo ist da, das Tag ist da. Aus einer
   * missglückten Auffrischung eine Fehlermeldung zu machen hieße, eine
   * gelungene Handlung als gescheitert darzustellen. Der Baum ist dann eben so
   * alt wie vorher, und die nächste geöffnete E-Mail holt ihn ohnehin neu.
   */
  const refreshContext = useCallback(async (): Promise<void> => {
    const result = await api.loadContext();
    if (result.ok) setLoad({ kind: 'ready', context: result.value });
  }, [api]);

  /**
   * A-10.9 — die Duplikatabfrage.
   *
   * Sie läuft **nur**, wenn `decideLookup` es zulässt. Ein leerer oder
   * unplausibler Wert erzeugt keine Anfrage; das ist der Riegel aus R-15 und
   * nicht bloß eine Einsparung.
   */
  const lookup = useCallback(
    async (value: string): Promise<void> => {
      const decision = decideLookup(value);
      if (decision.kind === 'skip') {
        setOffers([]);
        setBooking(null);
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

  /**
   * Steht im Feld etwas, das als Call-Nummer nicht taugt? (T-041, T-046, R-15)
   *
   * **Leer ist kein Problem** (A-2.6): Ein Todo ohne Call-Nummer ist der
   * Normalfall, und `decideLookup` würde `empty` melden. Gefragt wird nur nach
   * einem Wert, der *da* ist und trotzdem nicht taugt.
   *
   * Der Dienst weist einen solchen Wert seit T-046 ohnehin ab. Diese Zeile
   * ersetzt das nicht — sie steht davor, damit der Benutzer nicht erst nach dem
   * Anlegen erfährt, dass sein Todo nicht entstanden ist. Die Grenze liegt beim
   * Dienst, der Hinweis beim Benutzer.
   */
  const callNumberProblem = useMemo((): string | null => {
    if (callNumber.trim().length === 0) return null;
    const decision = decideLookup(callNumber);
    return decision.kind === 'lookup' ? null : INPUT_REJECTION_LABEL[decision.reason];
  }, [callNumber]);

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
          Takt und das Add-in kennen sich noch nicht. Das Token findest du in Takt unter
          Einstellungen; von dort wird es einmalig hier eingetragen.
        </Callout>
      </Section>
    );
  }

  if (done !== null) {
    return <DoneView done={done} onAgain={() => { setDone(null); }} />;
  }

  const submitCreate = async (): Promise<void> => {
    setBusy(true);
    setFailure(null);

    const result = await api.createTodo({
      title: title.trim(),
      callNumber: callNumber.trim().length === 0 ? null : callNumber.trim(),
      statusId: null,
      tagIds: selectedTags,
      // Namen statt Kennungen (T-061). Das Add-in entscheidet nicht, ob daraus
      // ein neues oder ein vorhandenes Tag wird — das tut der Dienst in
      // derselben Transaktion, in der das Todo entsteht.
      tagNames: newTagNames,
      note,
    });

    setBusy(false);

    if (!result.ok) {
      // Die Eingaben bleiben stehen (S-12, Fehlerzustand). Ein Formular, das
      // sich bei einem Fehlschlag leert, ist die zweite Enttäuschung nach der
      // ersten. Das gilt seit T-061 auch für die vorgemerkten Tagnamen: Ein
      // mehrdeutiger Name (`tag_name_ambiguous`) will berichtigt und nicht neu
      // getippt werden.
      setFailure(result);
      return;
    }

    /*
     * Die vorgemerkten Namen sind jetzt Tags. Drei Handgriffe, und alle drei
     * gehören zusammen (T-061):
     *
     *  1. Die Liste der neuen Namen wird leer. Ein Chip „neu" wäre nach dem
     *     Anlegen eine Unwahrheit.
     *  2. Die neu entstandenen Tags rücken in die **Auswahl**. Wer „Noch etwas
     *     aus dieser E-Mail" drückt, hat dann dieselben Tags gewählt wie eben
     *     — nur eben als vorhandene und nicht als neue.
     *  3. Der Baum wird neu geholt. Das Add-in hält keine eigene Kopie
     *     (A-10.4); ohne diesen Schritt stünde das gerade angelegte Tag in
     *     keiner Liste, obwohl es gewählt ist.
     */
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
      // Die Schreibweise kommt aus der Antwort und nicht aus dem Eingabefeld:
      // Wer „Backend“ tippt und damit ein vorhandenes „backend“ trifft, bekommt
      // „backend“ — und dann steht dieses Tag gar nicht erst in `createdTags`.
      createdTagNames: result.value.createdTags.map((tag) => tag.name),
    });
  };

  const submitBooking = async (offer: OfferDescription): Promise<void> => {
    setBusy(true);
    setFailure(null);

    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - minutes * 60_000);

    const result = await api.book({
      todoId: offer.todoId,
      startedAt: toTimestamp(startedAt),
      endedAt: toTimestamp(endedAt),
      note: service,
    });

    setBusy(false);

    if (!result.ok) {
      setFailure(result);
      return;
    }

    // Was geschehen ist, sagt der Dienst und nicht der Aufgabenbereich. Das
    // Add-in weiß vorher, dass das Todo erledigt war; ob das Kennzeichen
    // tatsächlich gefallen ist, weiß nur die Transaktion.
    setDone({
      kind: 'booked',
      title: offer.title,
      minutes,
      reopened: result.value.doneCleared,
      movement: {
        appears: result.value.poolNames,
        enters: result.value.enteringPoolNames,
        leaves: result.value.leavingPoolNames,
      },
    });
  };

  return (
    <div className="pane">
      <Section title="Aus dieser E-Mail">
        <dl className="mailfacts">
          <dt>Betreff</dt>
          <dd>{mail.subject.length > 0 ? mail.subject : <em>ohne Betreff</em>}</dd>
          <dt>Von</dt>
          <dd>
            {mail.senderName.length > 0 ? mail.senderName : <em>unbekannt</em>}
            {mail.senderAddress.length > 0 ? (
              <span className="mailfacts__address"> &lt;{mail.senderAddress}&gt;</span>
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
          <input
            id="call"
            className="input mono"
            value={callNumber}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => {
              setCallNumber(event.target.value);
            }}
          />
        </Field>
        {lookupNote !== null ? (
          <Callout tone="info">{lookupNote}</Callout>
        ) : null}
      </Section>

      {booking === null ? (
        <>
          <DuplicateOffer
            offers={offers}
            busyTodoId={null}
            onChoose={(offer) => {
              setBooking(offer);
              setService('');
            }}
          />

          <Section title="Neues Todo">
            <Field label="Titel" htmlFor="title">
              <input
                id="title"
                className="input"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
              />
            </Field>

            <Field
              label="Tags"
              htmlFor="tags"
              hint="Die Standard-Tags aus den Einstellungen kommen beim Anlegen automatisch dazu. Ein Name, den es noch nicht gibt, wird zusammen mit dem Todo angelegt."
            >
              {load.kind === 'loading' ? (
                <>
                  <p className="pane-loading">Tags werden geladen …</p>
                  <Skeleton lines={4} />
                </>
              ) : null}
              {load.kind === 'failed' ? (
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
              ) : null}
              {load.kind === 'ready' ? (
                <TagPicker
                  tree={load.context.tagTree}
                  selected={selectedTags}
                  defaultTagIds={defaultTagIds}
                  onChange={setSelectedTags}
                  newNames={newTagNames}
                  onNewNamesChange={setNewTagNames}
                />
              ) : null}
            </Field>

            <Field
              label="Vermerk (bleibt in Takt)"
              htmlFor="note"
              hint="Interner Vermerk des Todos. Er geht nicht in die Abrechnung."
            >
              <textarea
                id="note"
                className="input textarea"
                rows={5}
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                }}
              />
            </Field>

            <Button
              variant="ghost"
              onClick={() => {
                setNote(prepareNote(mail));
              }}
            >
              Inhalt der E-Mail übernehmen
            </Button>
          </Section>

          {failure !== null ? <Failure failure={failure} onOpenSettings={onOpenSettings} /> : null}

          <div className="pane-actions">
            <Button
              variant="primary"
              full
              loading={busy}
              // Ein Todo mit unbrauchbarer Call-Nummer entsteht gar nicht erst
              // (T-041, R-15). Der Dienst weist es ebenfalls ab — hier wird nur
              // der Weg dorthin gespart, nicht die Prüfung ersetzt.
              disabled={
                title.trim().length === 0 || load.kind !== 'ready' || callNumberProblem !== null
              }
              onClick={() => {
                void submitCreate();
              }}
            >
              Todo anlegen
            </Button>
          </div>
        </>
      ) : (
        <Section
          title="Auf vorhandenes Todo buchen"
          actions={
            <Button
              variant="ghost"
              onClick={() => {
                setBooking(null);
              }}
            >
              Abbrechen
            </Button>
          }
        >
          {/* R-15: Titel und Call-Nummer stehen unmittelbar über der Schaltfläche. */}
          <div className="offer__confirm">
            <span className="offer__title">{booking.title}</span>
            <span className="badge badge--call mono">{booking.callNumber}</span>
            <p className="offer__meta">{booking.summary}</p>
          </div>

          <Field label="Dauer" htmlFor="minutes" hint="Gerundet wird erst beim Export, auf die Tagessumme.">
            <div className="duration">
              {DURATION_PRESETS_MINUTES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={preset === minutes ? 'duration__chip duration__chip--on' : 'duration__chip'}
                  onClick={() => {
                    setMinutes(preset);
                  }}
                >
                  {preset} min
                </button>
              ))}
              <input
                id="minutes"
                className="input input--minutes"
                type="number"
                min={1}
                max={MAX_DURATION_MINUTES}
                value={minutes}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  setMinutes(Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), MAX_DURATION_MINUTES) : 1);
                }}
              />
            </div>
          </Field>

          <Field
            label="Leistung (geht in die Abrechnung)"
            htmlFor="service"
            hint="Dieser Text wird exportiert. Text aus der E-Mail gehört in den Vermerk, nicht hierher."
          >
            <textarea
              id="service"
              className="input textarea"
              rows={3}
              value={service}
              onChange={(event) => {
                setService(event.target.value);
              }}
            />
          </Field>

          {/*
            A-2.5, I-05, Befund C-03: Hier stand ein Kästchen mit der
            Voreinstellung „aus". Es ist ersatzlos weg — die Aufhebung
            geschieht automatisch, wie in der Hauptanwendung. Geblieben ist die
            Auskunft darüber, und sie steht **über** der Schaltfläche, nicht
            hinter ihr.
          */}
          {booking.isDone ? (
            <ReopenAnnouncement
              notice={reopenPreview(minutes, offerMovement(booking))}
              tone="warning"
            />
          ) : (
            /*
              T-084: Auch ohne Aufhebung kann eine Buchung das Todo bewegen —
              die erste hebt es in jede Spalte, die nach offener, noch nicht
              abgerechneter Zeit fragt. Der Hinweis steht an derselben Stelle
              wie der andere, unmittelbar über der Schaltfläche, und er
              erscheint nur, wenn es etwas zu berichten gibt: `MovementNote`
              gibt sonst nichts zurück.
            */
            <MovementNote movement={offerMovement(booking)} />
          )}

          {failure !== null ? <Failure failure={failure} onOpenSettings={onOpenSettings} /> : null}

          <div className="pane-actions">
            <Button
              variant="primary"
              full
              loading={busy}
              onClick={() => {
                void submitBooking(booking);
              }}
            >
              {/*
                Die Beschriftung nennt bei einem erledigten Todo beide
                Wirkungen. Der Knopf ist das Letzte, was gelesen wird — was er
                auslöst, gehört auf ihn und nicht nur darüber.
              */}
              {String(minutes)} Minuten auf „{booking.title}“ buchen
              {booking.isDone ? ' und es wieder öffnen' : ''}
            </Button>
          </div>
        </Section>
      )}
    </div>
  );
}

/**
 * Feldnamen des Dienstes in die Beschriftung, die im Formular darüber steht.
 *
 * `details[].field` ist ein technischer Schlüssel — die einzige Größe, gegen
 * die ein Aufrufer verzweigen darf, und deshalb englisch (`errors.ts`). Ihn
 * ungefiltert anzuzeigen hieße, dem Benutzer „tagNames" hinzuschreiben und ihn
 * raten zu lassen, welches Feld gemeint ist. Ein unbekannter Schlüssel wird
 * weiterhin roh gezeigt: Lieber ein technischer Name als eine falsche
 * Zuordnung.
 */
const FIELD_LABEL: Readonly<Record<string, string>> = Object.freeze({
  title: 'Titel',
  callNumber: 'Call-Nummer',
  statusId: 'Spalte',
  tagIds: 'Tags',
  tagNames: 'Neue Tags',
  note: 'Vermerk',
  startedAt: 'Beginn',
  endedAt: 'Ende',
  body: 'Eingabe',
});

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
              {FIELD_LABEL[detail.field] ?? detail.field}: {detail.message}
            </li>
          ))}
        </ul>
      ) : (
        'Die Eingaben bleiben stehen. Du kannst es erneut versuchen.'
      )}
    </Callout>
  );
}

/**
 * Der Satz über die Pools, wenn nichts aufgehoben wird (T-084).
 *
 * Gibt **nichts** zurück, wenn die Buchung das Todo in keinen Pool hinein und
 * aus keinem herausbewegt. Das ist der häufigere Fall — jede zweite und jede
 * weitere Buchung auf demselben Todo —, und dann bleibt die Fläche ganz weg:
 * keine leere Hinweisfläche, kein Halbsatz, kein Abstand, der eine fehlende
 * Zeile andeutet.
 */
function MovementNote({ movement }: { readonly movement: PoolMovement }) {
  const sentence = bookingPoolSentence(movement, 'future');
  if (sentence === null) return null;

  /*
    Die Überschrift ist Rahmen und keine zweite Behauptung: Sie sagt, wovon
    der Satz handelt, und nennt selbst weder Pool noch Wirkung. Ohne sie
    begänne die Fläche mit „Es" — und zwischen dem Titel des Todos und dieser
    Stelle liegen zwei Eingabefelder.
  */
  return (
    <Callout tone="info" title="Was sich dadurch ändert">
      {sentence}
    </Callout>
  );
}

/**
 * Die Bestätigung nach einer Buchung, die nichts aufgehoben hat (T-084).
 *
 * Zwei Zeilen oder eine. Der Satz über die Pools steht als eigener Absatz
 * darunter und nicht im selben: Er redet über etwas anderes als die gebuchte
 * Zeit, und ein angehängter Nebensatz wäre die Art Zeile, die man zu
 * überfliegen lernt.
 */
function BookedOutcome({
  minutes,
  movement,
}: {
  readonly minutes: number;
  readonly movement: PoolMovement;
}) {
  const notice = bookingOutcome(minutes, movement);

  return (
    <>
      {notice.booked}
      {notice.pools !== null ? <p className="pane-note">{notice.pools}</p> : null}
    </>
  );
}

/**
 * Die drei Wirkungen einer Buchung auf ein erledigtes Todo — und die eine
 * Nicht-Wirkung (A-2.5, I-05, E-023).
 *
 * **Eine** Darstellung für vorher und nachher. Der Aufgabenbereich ist schmal;
 * eine Aufzählung von drei kurzen Zeilen ist darin lesbarer als ein Absatz und
 * lässt vor allem sehen, dass es **drei** sind. Der Satz zur Spalte steht
 * abgesetzt darunter, weil er das Gegenteil sagt: Hier ändert sich nichts.
 */
function ReopenAnnouncement({
  notice,
  tone,
}: {
  readonly notice: ReopenNotice;
  readonly tone: 'warning' | 'success';
}) {
  return (
    <Callout tone={tone} title={notice.title}>
      <ul className="effects">
        {notice.effects.map((effect) => (
          <li key={effect}>{effect}</li>
        ))}
      </ul>
      <p className="effects__aside">{notice.aside}</p>
    </Callout>
  );
}

function DoneView({ done, onAgain }: { readonly done: Done; readonly onAgain: () => void }) {
  return (
    <Section
      title={
        done.kind === 'created'
          ? 'Todo angelegt'
          : done.reopened
            ? 'Zeit gebucht — Todo wieder offen'
            : 'Zeit gebucht'
      }
    >
      {/*
        I-05 im Add-in: War das Todo erledigt, treten die drei Wirkungen an die
        Stelle der einen Zeile „Zeit gebucht" — dieselben drei, die die
        Hauptanwendung nach dem Timerstart nennt, und derselbe Satz darüber,
        was sich **nicht** geändert hat. Nicht zusätzlich, sondern anstelle:
        Zweimal „15 Minuten sind gebucht" wäre Text, den man zu überfliegen
        lernt. Ein Rückgängig gibt es hier nicht; warum, steht in
        `duplicate/reopen.ts`.
      */}
      {done.kind === 'booked' && done.reopened ? (
        <>
          <ReopenAnnouncement
            notice={reopenOutcome(done.title, done.minutes, done.movement)}
            tone="success"
          />
          <p className="pane-note">Gerundet wird beim Export, auf die Tagessumme.</p>
        </>
      ) : (
        <Callout tone="success" title={done.title}>
          {done.kind === 'created' ? (
            <>
              Das Todo ist in Takt angelegt.
              {done.addedDefaults > 0
                ? ` ${String(done.addedDefaults)} Standard-Tag(s) wurden automatisch gesetzt.`
                : ''}
              {/*
                T-061: Ein neu entstandenes Tag wird **beim Namen** genannt und
                nicht gezählt. „1 Tag wurde angelegt" ließe offen, welches — und
                das Tag steht ab jetzt in der Hauptanwendung, in jeder Tagliste
                und womöglich in einer Pool-Regel. Wer es ausgelöst hat, soll es
                nicht dort zum ersten Mal lesen.
              */}
              {done.createdTagNames.length > 0 ? (
                <p className="pane-note">
                  {done.createdTagNames.length === 1 ? 'Neues Tag: ' : 'Neue Tags: '}
                  {done.createdTagNames.map((name) => `„${name}“`).join(', ')} — ab jetzt auch in
                  Takt auswählbar.
                </p>
              ) : null}
            </>
          ) : (
            /*
              T-084: Derselbe Satz wie eben über der Schaltfläche, nur im
              Perfekt — und wieder nur, wenn sich etwas bewegt hat. Der erste
              Satz ist Zeichen für Zeichen der von vorher; er steht jetzt in
              `bookingOutcome` statt hier, damit der Nachweispfad ihn messen
              kann, ohne den Aufgabenbereich zu rendern.
            */
            <BookedOutcome minutes={done.minutes} movement={done.movement} />
          )}
        </Callout>
      )}
      <div className="pane-actions">
        <Button variant="secondary" full onClick={onAgain}>
          Noch etwas aus dieser E-Mail
        </Button>
      </div>
    </Section>
  );
}

interface DetectionLine {
  readonly help: string;
  readonly callout: React.ReactNode;
}

/**
 * Sagt in einem Satz, was mit der Erkennung passiert ist (A-10.8).
 *
 * Jeder Fall bekommt einen eigenen Text. „Nicht erkannt" ist dabei **kein**
 * Fehler, sondern der Normalfall bei einer E-Mail ohne Vorgang — deshalb steht
 * dort keine Fehlerfläche, sondern nur ein Hinweis.
 */
function describeDetection(detection: Detection | null): DetectionLine {
  if (detection === null) {
    return { help: 'Wird gesucht …', callout: null };
  }

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
      return {
        help: 'Keine Call-Nummer im Text gefunden — du kannst sie eintragen.',
        callout: null,
      };
    case 'implausible':
      return {
        help: REJECTION_LABEL[detection.reason],
        callout: (
          <Callout tone="warning" title="Gefunden, aber nicht übernommen">
            Der Ausdruck hat <span className="mono">{clip(detection.raw)}</span> geliefert.{' '}
            {REJECTION_LABEL[detection.reason]}
          </Callout>
        ),
      };
    case 'pattern_invalid':
      return {
        help: 'Der Ausdruck in den Einstellungen ist nicht verwendbar.',
        callout: (
          <Callout tone="warning" title="Der Ausdruck lässt sich nicht verwenden">
            {detection.message} Die Call-Nummer lässt sich hier von Hand eintragen.
          </Callout>
        ),
      };
    case 'timeout':
      return {
        help: 'Die Erkennung wurde abgebrochen.',
        callout: (
          <Callout tone="warning" title="Erkennung abgebrochen">
            Der eingestellte Ausdruck hat für diese E-Mail zu lange gerechnet und wurde nach 100
            Millisekunden beendet. Das Add-in läuft weiter; bitte den Ausdruck in den Einstellungen
            vereinfachen.
          </Callout>
        ),
      };
    case 'unavailable':
      return {
        help: 'Automatische Erkennung steht hier nicht zur Verfügung.',
        callout: (
          <Callout tone="info" title="Keine automatische Erkennung">
            Die Auswertung läuft aus Sicherheitsgründen in einem eigenen Faden, und der steht in
            dieser Umgebung nicht zur Verfügung. Die Call-Nummer lässt sich von Hand eintragen.
          </Callout>
        ),
      };
    default:
      return { help: '', callout: null };
  }
}

/** Zeigt höchstens 40 Zeichen eines Rohwerts aus einer fremden E-Mail. */
const clip = (value: string): string => (value.length <= 40 ? value : `${value.slice(0, 40)}…`);

/** `YYYY-MM-DDTHH:MM:SSZ` — die Form, die die Domäne führt. */
const toTimestamp = (date: Date): string => `${date.toISOString().slice(0, 19)}Z`;
