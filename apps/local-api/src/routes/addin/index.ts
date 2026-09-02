/**
 * Takt — die Routen des Outlook-Add-ins (A-9.5, A-10.4, A-10.5, A-10.9, R-15).
 *
 * ## Einhängen
 *
 * Dieser Router bringt **keine** eigene Prüfschicht mit. Er wird in `app.ts`
 * **hinter** die Kette aus `http/guards.ts` gehängt, wie jeder andere Router
 * auch:
 *
 * ```ts
 * import { createAddinRoutes } from './routes/addin/index.ts';
 * // …
 * api.route('/addin', createAddinRoutes(addinDeps));
 * app.route(API_BASE_PATH, api);
 * ```
 *
 * Die Kette ist die einzige Stelle, an der geprüft wird; eine Route, die daran
 * vorbeigeht, ist offen (B-1.1 Punkt 1). `app.ts` gehört domain-dev — das
 * Einhängen ist deshalb der eine Handgriff, den T-019 nicht selbst ausführt.
 * Bis er geschehen ist, antwortet der Dienst auf `/api/v1/addin/*` mit 404,
 * und das ist der richtige Zustand: eine unverdrahtete Route ist keine offene
 * Route.
 *
 * ## Warum diese Routen und nicht die allgemeinen
 *
 * Siehe den Kopf von `ports.ts`. Kurz: Das Add-in weist sich mit dem
 * dauerhaften Token aus, sein Inhalt wird zum Teil von einem Absender bestimmt,
 * und ein entwendetes Token kommt genau so weit, wie diese Fläche reicht.
 *
 * ## Fehlerhülle
 *
 * Gestalt wie in `errors.ts` und in der OpenAPI-Beschreibung:
 * `{ "error": { "code", "message", "details"? } }`. `code` ist der englische
 * technische Schlüssel, `message` deutscher Anzeigetext. Kein Pfad, keine
 * SQL-Meldung, kein Token (B-2.4) — die Texte sind Konstanten.
 */

import { Hono } from 'hono';

import type {
  CallNumberRejection,
  StatusId,
  TagId,
  TaktError,
  TimeEntryId,
  Timestamp,
  TodoId,
} from '@takt/domain';
import {
  CALL_NUMBER_MAX_LENGTH,
  CALL_NUMBER_MIN_LENGTH,
  checkCallNumber,
  normalizeCallNumber,
} from '@takt/domain';

/*
 * Der **einzige** Import aus dem übrigen Dienst, und er holt genau eine Zahl:
 * den Statuscode zu einem fachlichen Fehlerschlüssel (T-061).
 *
 * Er steht hier, damit ein `name_conflict` über `POST /addin/todos` denselben
 * Code bekommt wie über `POST /todos` — 409 und nicht 422, weil diese Route
 * ihre eigene Zuordnung führte. Eine eigene Zuordnung wäre die Art Unterschied,
 * die C-03 gekostet hat: dieselbe Handlung, zwei Antworten, je nachdem wo sie
 * geschieht. Texte kommen weiterhin nicht von dort; die Hülle unten bleibt die
 * dieser Datei.
 */
import { statusFor } from '../../http/problem.ts';

import { bookOnTodo, createTodo, findMatches, loadContext } from './service.ts';
import type { AddinDeps } from './ports.ts';
import { bookSchema, createTodoSchema, toFieldIssues, type FieldIssue } from './schema.ts';

/*
 * Hier stand bis T-046 zusätzlich `call_number_not_usable`.
 *
 * Der Schlüssel ist nie als Fehlerschlüssel hinausgegangen — er wurde
 * ausschließlich als **Ersatztext** benutzt, falls `REJECTION_TEXT` zu einem
 * Ablehnungsgrund nichts zu sagen hatte. Seit dieselbe Liste über
 * `Record<CallNumberRejection, string>` am Übersetzer hängt, kann sie das nicht
 * mehr: Ein neuer Grund in der Domäne bricht `tsc`, statt still in einen
 * allgemeinen Satz zu fallen. Damit war der Schlüssel eine Fehlerhülle für
 * einen Fall, den es nicht gibt.
 */
type ErrorCode = 'validation_error' | 'not_found' | 'time_entry_rejected';

interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: readonly FieldIssue[];
  };
}

const MESSAGES: Readonly<Record<ErrorCode, string>> = Object.freeze({
  validation_error: 'Die Eingabe ist unvollständig oder unzulässig.',
  not_found: 'Nicht vorhanden.',
  time_entry_rejected: 'Die Zeitbuchung wurde nicht angenommen.',
});

const errorBody = (code: ErrorCode, details?: readonly FieldIssue[]): ErrorBody =>
  details === undefined
    ? { error: { code, message: MESSAGES[code] } }
    : { error: { code, message: MESSAGES[code], details } };

/**
 * Ein fachlicher Fehlschlag aus dem Anwendungsfall, unverändert weitergereicht
 * (T-061).
 *
 * Dieselbe Bauart wie die Buchungsroute weiter unten und wie `envelopeFor` auf
 * der Hauptfläche: Schlüssel und Satz kommen aus der Domäne beziehungsweise
 * dem Anwendungsfall, nicht aus einer zweiten Liste hier. Eine zweite Liste
 * hieße, dass ein neuer Fehlschlag an einer Stelle einen Satz hat und an der
 * anderen nicht.
 *
 * **Zum Echo der Eingabe.** `details[].message` nennt bei einem mehrdeutigen
 * Tagnamen den Namen, den der Benutzer getippt hat. Das ist etwas anderes als
 * bei der Call-Nummer weiter oben, wo der Wert bewusst **nicht** vorkommt: Die
 * Call-Nummer stammt aus einer fremden E-Mail (Akteur A-06), der Tagname aus
 * dem Eingabefeld des Benutzers. Ein Echo der eigenen Eingabe gibt niemandem
 * etwas, was er nicht schon hatte; Innenleben, Pfad oder Indexname stehen dort
 * nicht (B-2.4).
 */
const failureBody = (failure: TaktError): ErrorBody =>
  failure.details === undefined
    ? { error: { code: failure.code, message: failure.message } }
    : { error: { code: failure.code, message: failure.message, details: failure.details } };

/**
 * Warum eine Call-Nummer nicht als Suchbegriff taugt — in Worten, die in S-12
 * unmittelbar anzeigbar sind (B-4.3 Punkt 5).
 *
 * Der Schlüssel bleibt englisch, der Satz ist deutsch. Der **Wert** selbst
 * kommt in keinem dieser Sätze vor: Er stammt aus einer fremden E-Mail, und
 * eine Fehlermeldung ist der falsche Ort, um fremden Text weiterzureichen.
 */
const REJECTION_TEXT: Readonly<Record<CallNumberRejection, string>> = Object.freeze({
  empty: 'Es wurde keine Call-Nummer erkannt.',
  too_short: 'Die erkannte Call-Nummer ist zu kurz.',
  too_long: 'Die erkannte Call-Nummer ist zu lang.',
  forbidden_characters: 'Die erkannte Call-Nummer enthält unzulässige Zeichen.',
  formula_start: 'Die erkannte Call-Nummer beginnt mit einem Zeichen, das nicht zulässig ist.',
});

/**
 * Warum eine **eingetragene** Call-Nummer nicht angenommen wird (T-041, T-046).
 *
 * Zweite Liste neben {@link REJECTION_TEXT}, mit Absicht: Dort geht es um einen
 * Wert, den das Add-in aus einer E-Mail **erkannt** hat, hier um einen, den ein
 * Mensch eingetragen hat. „Es wurde keine Call-Nummer erkannt" ist auf ein
 * Eingabefeld bezogen falsch, und derselbe Satz für beide Fälle wäre in einem
 * der beiden eine Unwahrheit.
 *
 * `Record<CallNumberRejection, string>` statt `Record<string, string>`: Nimmt
 * die Domäne einen Ablehnungsgrund auf, fehlt hier ein Schlüssel und `tsc`
 * bricht ab. Sonst fiele der neue Grund in einen Ersatztext, und der Benutzer
 * läse etwas, das nicht zu seiner Eingabe passt.
 */
const CALL_NUMBER_INPUT_TEXT: Readonly<Record<CallNumberRejection, string>> = Object.freeze({
  empty: 'Die Call-Nummer ist leer. Lassen Sie das Feld frei, wenn es keine gibt.',
  too_short: `Eine Call-Nummer braucht mindestens ${String(CALL_NUMBER_MIN_LENGTH)} Zeichen.`,
  too_long: `Eine Call-Nummer darf höchstens ${String(CALL_NUMBER_MAX_LENGTH)} Zeichen haben.`,
  forbidden_characters:
    'Erlaubt sind Buchstaben, Ziffern, Punkt, Schrägstrich, Bindestrich und Unterstrich — keine Leerzeichen.',
  formula_start: 'Eine Call-Nummer darf nicht mit =, +, - oder @ beginnen.',
});

export function createAddinRoutes(deps: AddinDeps): Hono {
  const routes = new Hono();

  /**
   * A-10.4, A-10.5 — Tag- und Ordnerbaum, Pools, Spalten, Standard-Tags.
   *
   * Der Baum kommt vollständig und beliebig tief in einer Antwort (A-4.3). Das
   * Add-in hält **keine** eigene Kopie: Wer Tags in der Hauptanwendung
   * umsortiert, sieht das beim nächsten Öffnen einer E-Mail, ohne irgendetwas
   * abzugleichen.
   */
  routes.get('/context', async (c) => {
    const context = await loadContext(deps);
    return c.json({ data: context });
  });

  /**
   * A-10.9, R-15 — gibt es schon ein Todo mit dieser Call-Nummer?
   *
   * Die Antwort unterscheidet **nicht gesucht** von **nichts gefunden**. Das
   * ist der Kern der Gegenmaßnahme aus B-4.3 Punkt 4: Ein leerer oder
   * unplausibler Wert erzeugt kein Übereinstimmungskriterium, und das Add-in
   * kann sagen, warum es nichts anbietet, statt stumm zu bleiben.
   *
   * Der Statuscode für „nicht gesucht" ist **200**, nicht 4xx: Es ist kein
   * Fehler des Aufrufers, sondern der Normalfall einer E-Mail ohne Vorgang.
   * Ein 4xx hier würde in jeder Fehleranzeige des Add-ins auflaufen und den
   * Benutzer an eine Störung glauben lassen, wo keine ist.
   */
  routes.get('/todo-matches', async (c) => {
    const result = await findMatches(deps, c.req.query('callNumber') ?? null);

    if (result.kind === 'not_searched') {
      return c.json({
        data: {
          searched: false,
          reason: result.reason,
          // Ohne Ersatztext: `REJECTION_TEXT` ist über
          // `Record<CallNumberRejection, string>` vollständig, und ein Grund
          // ohne Satz bricht die Übersetzung statt hier aufzulaufen.
          message: REJECTION_TEXT[result.reason],
          matches: [] as const,
        },
      });
    }

    return c.json({
      data: {
        searched: true,
        callNumber: result.callNumber,
        matches: result.matches,
      },
    });
  });

  /**
   * A-2.1, A-9.5, A-10.5 — ein Todo aus der E-Mail anlegen.
   *
   * Auf eine bereits vergebene Call-Nummer wird hier **nicht** geprüft.
   * A-10.9 verlangt, dass der Benutzer entscheidet; das Add-in fragt vorher
   * über `/todo-matches` und legt danach bewusst an. Eine Prüfung an dieser
   * Stelle würde die Entscheidung dem Dienst zuschieben und wäre genau das
   * „stillschweigende Zusammenlegen", das A-10.9 ausschließt.
   *
   * **Auf die Plausibilität wird seit T-046 geprüft** (T-041, E-045, R-15).
   * Das ist etwas anderes als eine Duplikatprüfung und darf damit nicht
   * verwechselt werden: Hier wird nicht gefragt, ob es diese Nummer schon
   * gibt, sondern ob der Wert überhaupt eine Call-Nummer sein kann.
   *
   * Bis dahin nahm diese Route bis zu 128 Zeichen an, während `checkCallNumber`
   * ab 65 nicht mehr sucht. Ein Todo mit einer 70-stelligen Nummer war damit
   * angelegt und für die Duplikatsuche **unauffindbar**: Beim nächsten Mal
   * wurde nichts angeboten, der Benutzer legte ein zweites Todo an, und die
   * Zeit eines Kundenvorgangs stand auf zwei Vorgängen. Das ist derselbe
   * Schaden wie in R-15, nur über die Länge statt über ein zu weites Muster.
   *
   * Die Hauptanwendung weist einen solchen Wert seit E-045 ab
   * (`usecases/todos.ts`). Dass das Add-in ihn annahm, war die Art Unterschied,
   * die C-03 schon einmal gekostet hat: dieselbe Handlung, zwei Ergebnisse, je
   * nachdem wo sie geschieht.
   *
   * Leer bleiben darf die Nummer weiterhin (A-2.6). `null` ist keine
   * unplausible Nummer, sondern gar keine.
   *
   * **Seit T-061 nimmt diese Route `tagNames` entgegen** — Tags über ihren
   * Namen statt über eine Kennung, genau wie `POST /todos` seit T-058. Wer aus
   * Outlook ein Todo anlegt und einen Tag tippt, den es noch nicht gibt, wird
   * damit nicht anders behandelt als in der Hauptanwendung; das ist die
   * Anwendung desselben Arguments, aus dem A-9.5 die Standard-Tags auf jedem
   * Weg verlangt. Zwei Ausgänge kommen dabei neu hinzu:
   *
   *  - **422 `validation_error` mit `details[].code = "tag_name_ambiguous"`** —
   *    der Name gibt es in mehreren Ordnern (A-4.2). Der Aufgabenbereich muss
   *    den Benutzer das gemeinte Tag wählen lassen; geraten wird nicht.
   *  - **409 `name_conflict`** — der eindeutige Index hat abgewiesen. Im
   *    Betrieb unerreichbar, solange nur ein Prozess die Datei geöffnet hat;
   *    beschrieben, weil er sonst als 500 erschiene.
   *
   * In beiden Fällen ist **nichts** angelegt worden, auch kein Tag.
   */
  routes.post('/todos', async (c) => {
    const body = await readJson(c.req.raw);
    const parsed = createTodoSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(errorBody('validation_error', toFieldIssues(parsed.error)), 422);
    }

    const callNumber = normalizeCallNumber(parsed.data.callNumber);

    if (callNumber !== null) {
      // Geprüft wird der **beschnittene** Wert, also genau der, der gespeichert
      // würde. Über die Rohfassung zu urteilen und die beschnittene zu
      // schreiben hieße, etwas anderes zu prüfen als abzulegen.
      const checked = checkCallNumber(callNumber);
      if (!checked.ok) {
        return c.json(
          errorBody('validation_error', [
            {
              field: 'callNumber',
              message: CALL_NUMBER_INPUT_TEXT[checked.reason],
              // Der Schlüssel der Domäne, nicht ein Zod-Code: Das Add-in soll
              // gegen denselben Grund verzweigen können, den es beim Erkennen
              // schon kennt.
              code: checked.reason,
            },
          ]),
          422,
        );
      }
    }

    const result = await createTodo(deps, {
      title: parsed.data.title,
      callNumber,
      statusId: parsed.data.statusId as StatusId | null,
      tagIds: parsed.data.tagIds as readonly string[] as readonly TagId[],
      tagNames: parsed.data.tagNames,
      note: parsed.data.note,
    });

    if (!result.ok) {
      // Der Statuscode kommt aus derselben Zuordnung wie auf der Hauptfläche:
      // `validation_error` → 422, `name_conflict` → 409. Nichts ist angelegt
      // worden — die Transaktion hat zurückgenommen, auch ein Tag, das vor dem
      // Abbruch schon entstanden war (T-047).
      return c.json(failureBody(result.error), statusFor(result.error.code));
    }

    c.header('Location', `/api/v1/todos/${result.value.todo.id}`);
    return c.json({ data: result.value }, 201);
  });

  /**
   * A-6.1, A-10.9 — Zeit auf ein vorhandenes Todo buchen.
   *
   * Die Buchung entsteht mit Start und Ende, nicht mit einer Dauer: `TimeEntry`
   * führt beide, und die Dauer wird daraus berechnet. Wer eine Dauer schickte,
   * müsste sich auf eine Zeitzone einigen — und die Tagesgruppe des Exports
   * hängt am Kalendertag des Starts (E-025).
   *
   * **War das Todo erledigt, ist es danach offen** (A-2.5, seit T-038). Das ist
   * keine Option der Anfrage, sondern die Wirkung der Handlung — dieselbe wie
   * beim Timerstart in der Hauptanwendung (I-05). Die Antwort sagt beides:
   * `doneCleared`, ob das Kennzeichen gefallen ist, und `poolNames`, in
   * welchen Pools das Todo damit wieder steht. Beides steht in der Antwort,
   * weil der Aufrufer es **anzeigen** soll und nicht, weil er daraus etwas
   * ableiten müsste.
   */
  routes.post('/todos/:todoId/time-entries', async (c) => {
    const todoId = c.req.param('todoId');
    const body = await readJson(c.req.raw);
    const parsed = bookSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(errorBody('validation_error', toFieldIssues(parsed.error)), 422);
    }

    const result = await bookOnTodo(deps, {
      todoId: todoId as TodoId,
      startedAt: parsed.data.startedAt as Timestamp,
      endedAt: parsed.data.endedAt as Timestamp,
      note: parsed.data.note,
    });

    if (result.kind === 'not_found') {
      return c.json(errorBody('not_found'), 404);
    }
    if (result.kind === 'rejected') {
      // Der Schlüssel der Domäne wird durchgereicht — `time_entry_locked`,
      // `timer_too_short`, `validation_error`. Er ist die einzige Größe, gegen
      // die das Add-in verzweigt; der deutsche Satz kommt ebenfalls aus der
      // Domäne und enthält weder Pfad noch SQL.
      return c.json({ error: { code: result.code, message: result.message } }, 422);
    }

    return c.json(
      {
        data: {
          timeEntry: result.timeEntry satisfies { readonly id: TimeEntryId },
          todoWasDone: result.todoWasDone,
          doneCleared: result.doneCleared,
          poolNames: result.poolNames,
        },
      },
      201,
    );
  });

  return routes;
}

/**
 * Liest den Rumpf als JSON, ohne bei kaputtem JSON zu werfen.
 *
 * Ein Wurf landete sonst im allgemeinen Fehlerbehandler und ergäbe 500 —
 * ein Serverfehler für eine fehlerhafte Eingabe. `undefined` läuft in die
 * Schemaprüfung und kommt als 422 mit Feldangaben zurück.
 */
const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};

/**
 * Hängt die Add-in-Routen unter ihren vorgesehenen Grundpfad.
 *
 * Eine Zeile Bequemlichkeit mit einem Zweck: Der Grundpfad `/api/v1/addin`
 * steht damit **einmal** im Quelltext und nicht je Aufrufer. Der Nachweispfad
 * in `apps/outlook-addin/scripts/proof-addin.mjs` benutzt dieselbe Funktion und
 * prüft die Routen deshalb unter genau dem Pfad, unter dem sie im Betrieb
 * hängen — ein Schreibfehler im Präfix fällt dort auf und nicht erst in
 * Outlook.
 *
 * Achtung: Diese Funktion bringt **keine** Prüfschicht mit. Im Dienst wird der
 * Router aus `createAddinRoutes` hinter die Kette aus `http/guards.ts` gehängt
 * (siehe Kopf dieser Datei), nicht über diese Funktion.
 */
export function mountAddinRoutes(deps: AddinDeps, basePath = '/api/v1/addin'): Hono {
  const app = new Hono();
  app.route(basePath, createAddinRoutes(deps));
  return app;
}
