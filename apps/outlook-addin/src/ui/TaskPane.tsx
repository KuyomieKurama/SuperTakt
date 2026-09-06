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
 *   Frist           eingetragen, nie erkannt (A-19.21, E-074 Punkt 4)
 *   Tags            über die API, mit Suche über vier und mehr Ebenen (A-10.4)
 *   Vermerk         intern, ausdrücklich beschriftet (A-7.2, B-12.3)
 *   Anlegen         die Hauptaktion
 * ```
 *
 * Die **Frist** ist seit T-149 dabei und ist das einzige Feld dieser Liste,
 * das weder vorbelegt noch aus der E-Mail gelesen wird. Sie steht damit auf
 * der anderen Seite derselben Grenze wie ein **Anhang**, den es hier
 * ausdrücklich nicht gibt (A-19.19): Ein Tag wird angezeigt, eine Adresse wird
 * geöffnet (E-074 Punkt 3, R-21, R-22).
 *
 * Die Beschriftung der beiden Notizfelder ist dieselbe wie in der
 * Hauptanwendung (E-016, R-08): **Vermerk** bleibt intern, **Leistung** geht in
 * die Abrechnung. Im Add-in ist das besonders wichtig, weil hier Text aus einer
 * fremden E-Mail einfließt (B-12.3).
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

/*
 * Zwei Sätze aus der Domäne, und beide aus demselben Grund dort.
 *
 * Der Satz über die Bewegung kommt seit T-092 von dort und nicht mehr aus dem
 * Add-in (E-058 Absatz 2). `PoolMovement` ist derselbe Typ, den der Dienst
 * ausrechnet und den `poolMovementSentence` liest — eine Zweitschrift im
 * Aufgabenbereich wäre der Anfang zweier verschiedener Sätze für dieselbe
 * Handlung.
 *
 * `CALL_NUMBER_INPUT_MESSAGE` kommt seit T-190 von dort (O-GC). Er stand
 * zweimal — hier als `INPUT_REJECTION_LABEL` und an der Tür des Dienstes als
 * `CALL_NUMBER_INPUT_TEXT` —, und zwei der fünf Fassungen waren bereits
 * auseinandergelaufen. Dieselbe Aussage über dieselbe Eingabe kommt aus
 * derselben Quelle; welche der beiden Fassungen gilt, steht in
 * `packages/domain/src/call-number.ts`.
 */
import { CALL_NUMBER_INPUT_MESSAGE, poolMovementSentence, type PoolMovement } from '@takt/domain';

import { DURATION_PRESETS_MINUTES, MAX_DURATION_MINUTES } from '../config.ts';
import {
  CALL_NUMBER_BY_HAND,
  NO_CALL_NUMBER_FOUND,
  REJECTION_LABEL,
} from '../callnumber/labels.ts';
import type { Detection } from '../callnumber/detect.ts';
import { decideLookup, describeOffers, type OfferDescription } from '../duplicate/rule.ts';
import { dueDateForRequest, readDueDate } from '../duedate/entry.ts';
import {
  bookingOutcome,
  reopenOutcome,
  reopenPreview,
  type ReopenNotice,
} from '../duplicate/reopen.ts';
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
       * der sich richtig liest und das Gegenteil behauptet. Seit E-061 Punkt 3
       * liefert der Dienst ihn bereits so; hier wird nichts zusammengesetzt.
       *
       * Steht unabhängig von `reopened` da, weil beide Fälle daraus einen Satz
       * bauen — der erledigte den über die Rückkehr, der offene den über die
       * Bewegung.
       *
       * `null` heißt: Die Buchung hat nichts bewegt. Dann bleibt die Zeile weg.
       */
      readonly movement: PoolMovement | null;
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
  /**
   * Die **Frist** (A-19.21, E-074, T-149).
   *
   * Beginnt leer und bleibt es, solange der Benutzer nichts einträgt. Es gibt
   * hier — anders als bei `title` und `callNumber` — **keinen** Vorschlag aus
   * der E-Mail und kein `useEffect`, das etwas übernähme (E-074 Punkt 4).
   */
  const [dueDate, setDueDate] = useState('');
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
    return decision.kind === 'lookup' ? null : CALL_NUMBER_INPUT_MESSAGE[decision.reason];
  }, [callNumber]);

  /**
   * Steht im Fristfeld ein Tag, den es gibt? (A-19.21, E-074 Punkt 4)
   *
   * Derselbe Aufbau wie bei {@link callNumberProblem} eine Zeile darüber und
   * aus demselben Grund: **Leer ist kein Problem** — ein Todo ohne Frist ist
   * der Regelfall (A-19.1). Gefragt wird nur nach einem Wert, der da ist und
   * trotzdem kein Tag ist.
   *
   * Die Entscheidung fällt in `duedate/entry.ts` gegen `isCalendarDay` aus
   * `@takt/domain`, also gegen dieselbe Regel, die an der Tür des Dienstes
   * steht. Der Hinweis ersetzt die Prüfung dort nicht; er steht davor, damit
   * der Benutzer nicht erst nach dem Anlegen erfährt, dass sein Todo nicht
   * entstanden ist.
   */
  const dueEntry = useMemo(() => readDueDate(dueDate), [dueDate]);

  /**
   * Warum „Todo anlegen" gesperrt ist — und ob es das überhaupt ist (V-11).
   *
   * Bis T-169 stand hier ein `disabled`-Ausdruck mit vier Bedingungen und
   * darunter kein Wort dazu. Beides kommt jetzt aus **einem** Aufruf: Ein
   * gesperrter Knopf ohne Grund und ein Grund ohne Sperre lassen sich so nicht
   * mehr getrennt bauen. Die Begründung steht in `create-gate.ts`.
   */
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
          {/*
            T-182, E-078 Punkt 1: Hier stand davor „Takt und das Add-in kennen
            sich noch nicht." — dieselbe Aussage wie die Überschrift des
            Bereichs zwei Zeilen darüber („Noch nicht verbunden") und wie die
            Überschrift dieser Fläche („Das Token fehlt."). Dreimal derselbe
            Zustand, bevor der erste Satz sagt, was zu tun ist.
          */}
          Das Token finden Sie in Takt unter Einstellungen; von dort wird es einmalig hier
          eingetragen.
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
      // A-19.21: der Tag aus dem Feld, geprüft und sonst nichts. Kein Wert
      // aus dem Betreff, kein aus einer Nachricht gerechnetes Datum
      // (E-074 Punkt 4). Ein unbrauchbarer Wert kommt hier nicht an — der
      // Knopf ist dann gesperrt.
      dueDate: dueDateForRequest(dueEntry),
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
      // Unverändert durchgereicht: Der Dienst rechnet die Bewegung, das Add-in
      // sagt sie (E-058 Absatz 1, E-061 Punkt 3).
      movement: result.value.poolMovement,
    });
  };

  return (
    <div className="pane">
      <Section title="Aus dieser E-Mail">
        {/*
          T-119: Diese drei Werte sind der fremdeste Text im ganzen Add-in — sie
          stammen unmittelbar aus einer E-Mail, die jemand geschickt hat (A-06),
          und sie gehen durch keine Tür, bevor sie hier stehen. Bis T-119 standen
          sie roh im Bereich: Ein `U+202E` im Betreff drehte die Anzeige um, und
          „Rechnung<RLO>gnp.exe" las sich als „Rechnung exe.png".
        */}
        <dl className="mailfacts">
          <dt>Betreff</dt>
          <dd>{mail.subject.length > 0 ? <Foreign value={mail.subject} /> : <em>ohne Betreff</em>}</dd>
          <dt>Von</dt>
          <dd>
            {mail.senderName.length > 0 ? <Foreign value={mail.senderName} /> : <em>unbekannt</em>}
            {mail.senderAddress.length > 0 ? (
              <span className="mailfacts__address">
                {' '}
                &lt;
                <Foreign value={mail.senderAddress} />
                &gt;
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
                setCallNumber(event.target.value);
              }}
            />
          )}
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
              {(aria) => (
                <input
                  {...aria}
                  className="input"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                  }}
                />
              )}
            </Field>

            {/*
              Die **Frist** (A-19.21, A-19.2, E-074). Sie heißt hier
              ausschließlich so — nicht „Fälligkeitsdatum", nicht „fällig am",
              nicht „Deadline". Derselbe Wortlaut wie im Änderungsdialog der
              Hauptanwendung (`TodoFormDialog.tsx`), weil es dasselbe Feld ist.

              `type="date"` und nicht `datetime-local`: Die Frist ist ein Tag,
              keine Uhrzeit (E-070 Punkt 1). Das Feld liefert von sich aus
              `JJJJ-MM-TT` — das ist Bedienkomfort und **keine** Kontrolle.
              Geprüft wird der Wert von `readDueDate` gegen `@takt/domain` und
              danach noch einmal an der Tür des Dienstes (A-A-19).

              Sie steht **unter** dem Titel und **über** den Tags: Titel und
              Frist sind Angaben über das Todo, Tags und Vermerk ordnen es ein.
              Vorbelegt ist sie nicht, und erkannt wird sie nicht — als
              einziges Feld dieses Bereichs (E-074 Punkt 4).

              Und weil sie das einzige ist, muss der Hinweis es **sagen**
              (V-03/V-04 aus T-154, gebaut in T-158). Alle drei Felder darüber
              sind gefüllt, wenn der Bereich aufgeht: Call-Nummer erkannt,
              Titel vorgeschlagen, Angebot angeboten. Ein leeres Feld am Ende
              einer Kette gefüllter Felder liest sich als „nichts gefunden" —
              hier heißt es „wurde nicht gesucht". Der Riegel aus E-074 Punkt 4
              ist eine Abwesenheit, und eine Abwesenheit, die niemand
              ausspricht, ist für den Benutzer keine.

              Deshalb steht diese Aussage **zuerst** und nicht an dritter von
              vier Stellen, und deshalb ist der Satz „ändert nichts an Pools,
              Spalten, Buchungen oder Export" hier gestrichen: Er stammt aus
              `TodoFormDialog.tsx` der Hauptanwendung, wo es Pools, Spalten und
              eine Exportansicht **gibt**. In einem Aufgabenbereich ohne all
              das beantwortet er keine Sorge — er schiebt nur den tragenden
              Satz in die Mitte. „Wie in der Hauptanwendung" war an dieser
              Stelle das falsche Maß.
            */}
            <Field
              label="Frist"
              htmlFor="due"
              hint="Takt sucht in der E-Mail nicht nach einer Frist — Sie tragen sie selbst ein. Ein Tag, keine Uhrzeit; leer lassen heißt: keine Frist."
              error={dueEntry.kind === 'invalid' ? dueEntry.message : undefined}
            >
              {(aria) => (
                <input
                  {...aria}
                  className="input"
                  type="date"
                  value={dueDate}
                  onChange={(event) => {
                    setDueDate(event.target.value);
                  }}
                />
              )}
            </Field>

            {/*
              **Ein Feld ohne Feld ist kein Feld** (X-02 aus T-165).

              Bis T-169 stand hier in allen drei Zuständen ein `Field`. In
              „lädt" und „nicht verbunden" zeichnete es damit eine Beschriftung
              mit `htmlFor="tags"` und einen Hinweis mit `id="tags-hint"` —
              und es gab kein Bedienelement, das `id="tags"` getragen oder auf
              den Hinweis verwiesen hätte. Kein Verstoß gegen ein
              Erfolgskriterium (es gibt nichts, was einen Namen bräuchte), aber
              genau die Bauart, aus der V-03 entstanden ist: eine Beschriftung,
              die niemanden beschriftet.

              Deshalb trägt nur der Zustand `ready` ein `Field`. Die beiden
              anderen tragen eine **Überschrift** in derselben Gestalt und
              darunter das, was es dort zu sehen gibt. Eine Überschrift und
              kein `<h3>`: Die Fläche wechselt in denselben Kasten zurück,
              sobald der Baum da ist, und eine Gliederungsebene, die es in zwei
              von drei Zuständen gibt, wäre die nächste Ungleichheit.

              T-158 bleibt unangetastet: Das Bedienelement dieses Feldes ist
              das Suchfeld **im** Tag-Auswähler, und beide Kennungen kommen
              weiterhin von `Field` und gehen bis an das Suchfeld durch.
            */}
            {load.kind === 'ready' ? (
              <Field
                label="Tags"
                htmlFor="tags"
                hint="Die Standard-Tags aus den Einstellungen kommen beim Anlegen automatisch dazu. Ein Name, den es noch nicht gibt, wird zusammen mit dem Todo angelegt."
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
                      load.failure.kind === 'unauthorized' ||
                      load.failure.kind === 'origin_rejected' ? (
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

            {/*
              ST-A-08 (Z-45 aus T-195) — und dieselbe Freigabe ist F-2 aus
              T-165, seit damals unumgesetzt. Gefallen ist „Interner Vermerk des
              Todos.": reine Verdopplung der Beschriftung darüber, die dasselbe
              Wort und denselben Ort schon sagt.

              Der Hinweis beginnt danach mit „Er". Der Bezug ist die
              Beschriftung „Vermerk (bleibt in Takt)" — `fieldParts` gibt sie als
              **Namen** und den Hinweis als **Beschreibung** aus, in dieser
              Reihenfolge, sichtbar wie vorgelesen. Kein Bruch.

              Der bleibende Satz ist ab jetzt **gesperrt** (SP-A-01): „bleibt in
              Takt" nennt den Ort, „geht nicht in die Abrechnung" nennt das Ziel,
              das der Text **nicht** erreicht — und das ist die Aussage, um
              derentwillen A-7.2 und R-08 bestehen. Fällt auch er, steht die
              Grenze nur noch in einem Klammerzusatz.

              Sein Zwilling ist der Hinweis am Feld „Leistung" weiter unten. Die
              beiden gehören zusammen; warum, steht dort.
            */}
            <Field
              label="Vermerk (bleibt in Takt)"
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
                    setNote(event.target.value);
                  }}
                />
              )}
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
            {/*
              V-11 aus T-154: Der Knopf hatte vier Sperrgründe und nannte
              keinen. Der Satz steht **über** ihm und nicht an ihm: Ein
              gesperrter Knopf lässt sich nicht anklicken und mit der Tastatur
              nicht ansteuern — was ihn hält, muss auf dem Weg dorthin gelesen
              werden. Eine Meldefläche ist er nicht: Der Satz erscheint,
              solange der Grund besteht, und geht mit ihm weg (E-078 Punkt 6,
              Zustandsbindung).
            */}
            {gate.reason !== null ? <p className="pane-note">{gate.reason}</p> : null}
            <Button
              variant="primary"
              full
              loading={busy}
              // Ein Todo mit unbrauchbarer Call-Nummer entsteht gar nicht erst
              // (T-041, R-15). Der Dienst weist es ebenfalls ab — hier wird nur
              // der Weg dorthin gespart, nicht die Prüfung ersetzt.
              // Eine unbrauchbare Frist sperrt ebenso (A-19.21, T-149). Sie
              // stillschweigend wegzulassen wäre der teurere Ausgang: Der
              // Benutzer hat sie eingetragen, und ein Todo, das ohne sie
              // entsteht, sieht nach Erfolg aus.
              // Welche Gründe das im Einzelnen sind, steht seit T-169 in
              // `create-gate.ts` — zusammen mit dem Satz darüber, damit nicht
              // eines von beidem ohne das andere geändert wird.
              disabled={gate.blocked}
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
          {/*
            R-15: Titel und Call-Nummer stehen unmittelbar über der Schaltfläche.

            Der Titel kommt aus dem Bestand und ist damit fremder Text (T-119).
            Die Call-Nummer nicht: Sie hat `checkCallNumber` passiert, und deren
            Vorrat (`A-Z a-z 0-9 . _ / -`) ist geschlossen — ein Richtungszeichen
            kann darin nicht vorkommen. Die `summary` daneben schreibt der
            Aufgabenbereich selbst aus Zahlen.
          */}
          <div className="offer__confirm">
            <Foreign className="offer__title" value={booking.title} />
            <span className="badge badge--call mono">{booking.callNumber}</span>
            <p className="offer__meta">{booking.summary}</p>
          </div>

          {/*
            V-08 aus T-154: Wer eine Frist eingetragen hat und danach auf ein
            vorhandenes Todo wechselt, verliert die Anlegen-Fläche und mit ihr
            das Fristfeld. Sachlich ist das richtig — A-19.21 nennt das
            **Anlegen**, und ein fremdes Todo behält seine eigene Frist —, aber
            es ist eine bewusste Eingabe, die ohne ein Wort verfiele.

            Nur die Auskunft: kein zweites Feld, kein Übertragen, keine
            Rückfrage. Der Wert bleibt im Zustand stehen und ist nach
            „Abbrechen" wieder da; nur gebucht wird er nicht.

            Sie erscheint ausschließlich, wenn wirklich etwas im Feld steht
            (E-078 Punkt 6) — auch bei einer unbrauchbaren Eingabe, denn auch
            die ist eingetragen worden.
          */}
          {dueEntry.kind !== 'none' ? (
            <p className="pane-note">
              Die eingetragene Frist gilt nur für ein neues Todo. Dieses Todo behält seine eigene.
            </p>
          ) : null}

          <Field label="Dauer" htmlFor="minutes" hint="Gerundet wird erst beim Export, auf die Tagessumme.">
            {(aria) => (
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
                {/*
                  Die Attribute gehen an das Eingabefeld und nicht an die
                  Knopfreihe davor: Die Voreinstellungen sind Abkürzungen auf
                  denselben Wert, das Feld ist das Bedienelement dieses Feldes.
                */}
                <input
                  {...aria}
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
            )}
          </Field>

          {/*
            Der Zwilling zu ST-A-08, und er fällt **in demselben Handgriff**.

            T-165 hat in einer Tabelle zwei Sätze freigegeben: F-2 am Vermerk
            („Interner Vermerk des Todos.") und F-3 hier („Dieser Text wird
            exportiert."). Beide sind dieselbe Verdopplung — der Hinweis
            wiederholt die Klammer der Beschriftung darüber, hier „(geht in die
            Abrechnung)". Nur F-2 ist später in eine Streichliste geraten; F-3
            wurde in `textbestand-aufgabenbereich.md` als Teil einer gesperrten
            Zeile geführt. **Diese Halbierung ist der Grund, aus dem beide hier
            zusammen fallen** (Z-45 aus T-195, Auflage 1): Eine Freigabe zur
            Hälfte auszuführen und die andere Hälfte in eine Sperre
            umzuschreiben, steht nirgends als Rücknahme — es sieht danach nur so
            aus, als wäre beides in Ordnung.

            **Was hier nicht fällt:** „Text aus der E-Mail gehört in den Vermerk,
            nicht hierher." Das ist **SP-A-05** (B-12.3, R-08) und bleibt
            zeichengleich — der Satz ist die einzige Stelle im Aufgabenbereich,
            die verhindert, dass Text aus einer fremden E-Mail in eine Rechnung
            wandert. Er trägt nach der Kürzung allein; „exportiert" steht
            sichtbar in der Beschriftung darüber.
          */}
          <Field
            label="Leistung (geht in die Abrechnung)"
            htmlFor="service"
            hint="Text aus der E-Mail gehört in den Vermerk, nicht hierher."
          >
            {(aria) => (
              <textarea
                {...aria}
                className="input textarea"
                rows={3}
                value={service}
                onChange={(event) => {
                  setService(event.target.value);
                }}
              />
            )}
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
              notice={reopenPreview(minutes, booking.poolMovement)}
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
            <MovementNote movement={booking.poolMovement} />
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
              {/*
                T-119: Der Titel steht **in** dieser Beschriftung, und das ist
                die Stelle, an der die Isolierung mehr ist als Sorgfalt. Ohne
                sie ordnet ein Titel aus rechtsläufiger Schrift den Rest des
                Satzes um — „und es wieder öffnen" landete vor dem Titel, und
                der Knopf verspräche etwas anderes, als er tut.
              */}
              {String(minutes)} Minuten auf „<Foreign value={booking.title} />“ buchen
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
  // „Status" und nicht „Spalte" (E-054, R-2 S-4). Bis T-090 stand hier
  // „Spalte", und das war einmal richtig: Der Status **war** die Spalte des
  // Boards. Seit E-054 ist eine Spalte eine Regel und der Status eine
  // Eigenschaft am Todo — wer nach einer abgewiesenen Eingabe „Spalte: …" liest,
  // sucht auf dem Board nach einem Feld, das in diesem Formular steht.
  statusId: 'Status',
  tagIds: 'Tags',
  tagNames: 'Neue Tags',
  note: 'Vermerk',
  startedAt: 'Beginn',
  endedAt: 'Ende',
  body: 'Eingabe',
});

/**
 * Dieselbe Zuordnung, aber auch für einen Befund an **einem Eintrag einer
 * Liste** (T-114).
 *
 * `toFieldIssues` bildet den Pfad mit `path.join('.')`; ein abgewiesener
 * Tagname heißt deshalb `tagNames.0` und nicht `tagNames`. Die Tabelle darüber
 * trifft das nicht, und der Benutzer las bis T-114 „tagNames.0" — einen
 * technischen Schlüssel und dazu eine von null an gezählte Stelle.
 *
 * Der Anlass ist die Zeichenprüfung aus T-114: Vorher konnte ein Eintrag nur
 * an seiner Länge scheitern, was im Aufgabenbereich kaum vorkommt; jetzt kann
 * ein eingefügter Name daran scheitern, dass ein unsichtbares Zeichen daran
 * hängt. Gezählt wird ab eins, weil die Zahl für einen Menschen ist.
 *
 * Ein unbekannter Schlüssel bleibt roh stehen — dieselbe Regel wie oben:
 * lieber ein technischer Name als eine falsche Zuordnung.
 */
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

/**
 * Der Satz über die Pools, wenn nichts aufgehoben wird (T-084).
 *
 * Gibt **nichts** zurück, wenn die Buchung das Todo in keinen Pool hinein und
 * aus keinem herausbewegt. Das ist der häufigere Fall — jede zweite und jede
 * weitere Buchung auf demselben Todo —, und dann bleibt die Fläche ganz weg:
 * keine leere Hinweisfläche, kein Halbsatz, kein Abstand, der eine fehlende
 * Zeile andeutet.
 */
function MovementNote({ movement }: { readonly movement: PoolMovement | null }) {
  /*
   * Anlass `'booking'` und nicht `'reopen'`: Hier wird nichts aufgehoben. Die
   * Überladung gibt dafür `string | null` zurück — und dieses `null` ist die
   * Auskunft, nicht ihr Fehlen.
   *
   * Zwei Wege führen hierher, und beide bedeuten dasselbe: Der Dienst hat
   * nichts gerechnet (`movement === null`, weil sich nichts bewegen kann), oder
   * er hat gerechnet und nichts gefunden. In beiden Fällen bleibt die Fläche
   * ganz weg (E-061 Punkt 3).
   */
  const sentence = movement === null ? null : poolMovementSentence(movement, 'future', 'booking');
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
  readonly movement: PoolMovement | null;
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
 * Die drei Wirkungen einer Buchung auf ein erledigtes Todo (A-2.5, I-05).
 *
 * **Eine** Darstellung für vorher und nachher. Der Aufgabenbereich ist schmal;
 * eine Aufzählung von drei kurzen Zeilen ist darin lesbarer als ein Absatz und
 * lässt vor allem sehen, dass es **drei** sind.
 *
 * Unter der Aufzählung stand bis T-092 eine vierte Zeile über das, was sich
 * **nicht** ändert („Die Karte bleibt, wo sie ist"). Sie ist ersatzlos weg
 * (E-058 Absatz 2): Der dritte Punkt sagt vollständig, was sich bewegt, und
 * eine Zeile daneben, die das Gegenteil behauptete, war seit E-055 schlicht
 * falsch.
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
            /*
              T-119: `reopenOutcome` setzt den Titel in einen Satz („Gebucht.
              „X" ist wieder offen."). Ein Satz ist eine Zeichenkette, und in
              eine Zeichenkette lässt sich kein `<bdi>` legen — hier bleibt das
              Bereinigen. Es nimmt dem Titel die Zeichen, die den Satz umdrehen
              könnten; die Stellung rechtsläufiger Schrift im Satz bleibt dem
              Bidi-Algorithmus überlassen.
            */
            notice={reopenOutcome(visibleText(done.title), done.minutes, done.movement)}
            tone="success"
          />
          <p className="pane-note">Gerundet wird beim Export, auf die Tagessumme.</p>
        </>
      ) : (
        <Callout tone="success" title={<Foreign value={done.title} />}>
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
                  {/*
                    T-119: je Name ein eigener isolierter Knoten. Als
                    zusammengefügte Zeichenkette (`join(', ')`) konnte ein Name
                    die Aufzählung umordnen — und in einer Liste von Namen ist
                    „welcher gehört zu welchem Komma" genau die Frage, die
                    niemand nachprüft.
                  */}
                  {done.createdTagNames.map((name, index) => (
                    <Fragment key={name}>
                      {index > 0 ? ', ' : ''}„<Foreign value={name} />“
                    </Fragment>
                  ))}{' '}
                  — ab jetzt auch in Takt auswählbar.
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
  /**
   * Die Zeile unter der Überschrift „Call-Nummer" — oder **nichts** (T-182).
   *
   * `undefined`, sobald unmittelbar darunter eine Hinweisfläche steht. Bis
   * T-182 trug diese Zeile in **vier von sechs** Fällen dieselbe Aussage wie
   * die Fläche zwei Zeilen tiefer, zweimal davon nahezu Wort für Wort („Die
   * Erkennung wurde abgebrochen." über „Erkennung abgebrochen") und einmal
   * zeichengleich (`REJECTION_LABEL[reason]` stand als Zeile **und** im
   * Rumpf der Fläche). Das ist der Fall D aus `docs/design/textbestand.md`
   * Abschnitt 2, den E-078 Punkt 1 ohne Rückfrage zum Streichen freigibt —
   * und in einem 320 bis 450 Pixel breiten Bereich stehen beide immer im
   * selben Blickfeld (AB-1).
   *
   * Gefallen ist die **Kopie**, nicht das Original: Die Fläche darunter ist
   * die reichere Auskunft — sie trägt den Rohwert, die Meldung der
   * Laufzeitumgebung und den Ausweg. Wo **keine** Fläche steht (erkannt,
   * nichts gefunden, wird gesucht), trägt diese Zeile die Auskunft allein und
   * bleibt.
   */
  readonly help: string | undefined;
  readonly callout: React.ReactNode;
}

/**
 * Sagt **einmal**, was mit der Erkennung passiert ist (A-10.8).
 *
 * Jeder Fall bekommt einen eigenen Text, und jeder Fall sagt ihn an genau
 * einer Stelle: entweder als Zeile unter der Überschrift oder als Fläche
 * darunter, nie als beides. „Nicht erkannt" ist dabei **kein** Fehler,
 * sondern der Normalfall bei einer E-Mail ohne Vorgang — deshalb steht dort
 * keine Fehlerfläche, sondern nur die Zeile.
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
      /*
       * Derselbe Satz wie `REJECTION_LABEL.empty`, und seit T-169 auch
       * dieselbe Zeichenkette (E-078 Punkt 1). Er stand zweimal wörtlich
       * gleich da — zwei Fassungen einer Aussage, die beim nächsten
       * Textdurchgang auseinandergelaufen wären.
       */
      return { help: NO_CALL_NUMBER_FOUND, callout: null };
    case 'implausible':
      return {
        /*
         * T-182: Hier stand `REJECTION_LABEL[detection.reason]` — **derselbe
         * Ausdruck**, der zwei Zeilen tiefer den Rumpf der Fläche beschließt.
         * Der Ablehnungsgrund stand damit zeichengleich zweimal übereinander.
         * Er bleibt dort, wo er zusammen mit dem Rohwert steht: „Der Ausdruck
         * hat X geliefert. <Grund>" ist ein Satz, „<Grund>" allein darüber war
         * seine Hälfte.
         */
        help: undefined,
        callout: (
          <Callout tone="warning" title="Gefunden, aber nicht übernommen">
            {/*
              T-119: `detection.raw` ist ein Stück aus dem Betreff oder dem Text
              der E-Mail — fremder Text, unmittelbar und ungeprüft, denn er ist
              gerade deshalb hier, weil er **keine** Call-Nummer ist. Er steht
              mitten in einem deutschen Satz; ohne Isolierung zöge er den Rest
              des Satzes mit.
            */}
            Der Ausdruck hat <Foreign className="mono" value={clip(detection.raw)} /> geliefert.{' '}
            {REJECTION_LABEL[detection.reason]}
          </Callout>
        ),
      };
    case 'pattern_invalid':
      return {
        /*
         * T-182: Die Zeile lautete „Der Ausdruck in den Einstellungen ist
         * nicht verwendbar." und die Überschrift der Fläche „Der Ausdruck
         * lässt sich nicht verwenden" — dieselbe Aussage in zwei Fassungen,
         * übereinander. Der **Ort** („in den Einstellungen") stand nur in der
         * Zeile und ist die einzige Auskunft, die der Rumpf nicht trägt; er
         * ist deshalb in die Überschrift gewandert und nicht mitgestrichen.
         */
        help: undefined,
        callout: (
          <Callout tone="warning" title="Der Ausdruck in den Einstellungen lässt sich nicht verwenden">
            {detection.message} {CALL_NUMBER_BY_HAND}
          </Callout>
        ),
      };
    case 'timeout':
      return {
        /* T-182: „Die Erkennung wurde abgebrochen." über „Erkennung abgebrochen". */
        help: undefined,
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
        /* T-182: „Automatische Erkennung steht hier nicht zur Verfügung." über „Keine automatische Erkennung". */
        help: undefined,
        callout: (
          <Callout tone="info" title="Keine automatische Erkennung">
            Die Auswertung läuft aus Sicherheitsgründen in einem eigenen Faden, und der steht in
            dieser Umgebung nicht zur Verfügung. {CALL_NUMBER_BY_HAND}
          </Callout>
        ),
      };
    default:
      /*
       * `undefined` und nicht `''` (T-182): Ein leerer Text ist für `Section`
       * ein Text, und sie baute ihm einen leeren Absatz mit dem Abstand einer
       * Zeile. Dieselbe Unterscheidung, die `fieldParts` seit T-158 trifft.
       */
      return { help: undefined, callout: null };
  }
}

/**
 * Zeigt höchstens 40 Zeichen eines Rohwerts aus einer fremden E-Mail.
 *
 * Der Schnitt läuft seit T-119 über `cutToCharacterBoundary` und nicht mehr
 * über `slice`: Derselbe Fehler wie im Titelvorschlag, nur eine Stelle weiter —
 * ein Emoji an Position 40 wurde halbiert, und die stehengebliebene Hälfte
 * zeigte der Bereich als `U+FFFD`. Hier ginge davon nichts verloren, aber die
 * Anzeige behauptete ein Zeichen, das der Ausdruck nie geliefert hat.
 */
const clip = (value: string): string =>
  value.length <= 40 ? value : `${cutToCharacterBoundary(value, 40)}…`;

/** `YYYY-MM-DDTHH:MM:SSZ` — die Form, die die Domäne führt. */
const toTimestamp = (date: Date): string => `${date.toISOString().slice(0, 19)}Z`;
