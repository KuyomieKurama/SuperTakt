/**
 * Takt — der Zugang zum lokalen Dienst (A-10.3, E-009, R-09, B-2.4).
 *
 * ## Vier Regeln, die diese Datei einhält
 *
 * 1. **Das Token steht in der Kopfzeile `X-Takt-Token`** — nicht in einem
 *    Cookie, nicht im `Authorization`-Kopf, nie in der Adresse. Der Dienst
 *    weist eine Adresse mit einem Token in Gestalt eines Takt-Geheimnisses mit
 *    400 ab und merkt es sich als Vorfall (B-2.4 Punkt 1). Diese Datei baut
 *    deshalb Abfrageparameter über `URL`/`URLSearchParams` und nie durch
 *    Zeichenkettenverkettung.
 * 2. **Das Token erscheint in keiner Fehlermeldung und in keiner
 *    Protokollausgabe.** Es gibt in diesem Paket kein `console.log` auf einem
 *    Wert aus dieser Datei; der Nachweispfad prüft das.
 * 3. **Ein 401 ist immer derselbe Fall.** Der Dienst antwortet auf ein
 *    fehlendes, ein leeres und ein falsches Token zeichengleich (B-2.4 Punkt 3).
 *    Der Client tut es ihm gleich und leitet daraus **eine** Meldung ab, die
 *    nach S-13 führt — er rät nicht, woran es lag.
 * 4. **`fetch` ist ein Port.** Sonst wäre nichts hiervon ohne Browser prüfbar.
 *    Der Port bleibt **Pflicht** — {@link createApiClient} nimmt keine
 *    Abholfunktion aus der Umgebung, wenn der Aufrufer keine nennt. Wer das
 *    globale `fetch` will, sagt es mit {@link createBrowserApiClient}, und
 *    diese eine Zeile steht am Ende dieser Datei (T-190).
 */

import type {
  AddinContextDto,
  BookResponseDto,
  CreateTodoResponseDto,
  MatchResponseDto,
} from './types.ts';

/** Name der Kopfzeile aus `apps/local-api/src/config.ts`. */
const TOKEN_HEADER = 'X-Takt-Token';

export type ApiFailureKind =
  /** Der Dienst antwortet nicht. Meist: Takt läuft nicht (S-12, Fehlerzustand). */
  | 'unreachable'
  /** 401. Token fehlt, ist falsch oder wurde neu erzeugt (E-009, B-2.7). */
  | 'unauthorized'
  /** 403. Die Herkunft des Add-ins steht nicht auf der Positivliste (B-1.4). */
  | 'origin_rejected'
  /** 404. Die Add-in-Routen sind nicht eingehängt. */
  | 'not_found'
  /** 422 mit Feldangaben. */
  | 'invalid_input'
  /** Alles Übrige, einschließlich 500. */
  | 'failed';

export interface ApiFailure {
  readonly ok: false;
  readonly kind: ApiFailureKind;
  /** Englischer technischer Schlüssel aus der Hülle des Dienstes, falls vorhanden. */
  readonly code: string | null;
  /** Deutscher Anzeigetext. Enthält nie das Token und nie einen Pfad. */
  readonly message: string;
  readonly details?: readonly { field: string; message: string; code: string }[];
}

export interface ApiSuccess<T> {
  readonly ok: true;
  readonly value: T;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export interface ApiClientOptions {
  readonly baseUrl: string;
  /**
   * Liefert das Token **bei jedem Aufruf** neu.
   *
   * Keine Kopie im Modul: Wird das Token in S-13 ersetzt, muss der nächste
   * Aufruf das neue benutzen, ohne dass der Aufgabenbereich neu geladen wird.
   * Eine festgehaltene Kopie wäre außerdem ein zweiter Ort, an dem das
   * Geheimnis liegt.
   */
  readonly token: () => string | null;
  /**
   * Die Abholfunktion — **ohne Ersatzwert**.
   *
   * Kein `?`, kein Rückfall auf das globale `fetch`: Ein Ersatzwert machte aus
   * dem Port eine Bequemlichkeit. Ein Prüffall, der die Einspeisung vergisst,
   * liefe dann still gegen das Netz der Umgebung, statt an `tsc` zu scheitern.
   * Die Umgebung kommt über {@link createBrowserApiClient} herein und sonst
   * nirgends.
   */
  readonly fetch: typeof globalThis.fetch;
}

export interface CreateTodoRequest {
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: string | null;
  readonly tagIds: readonly string[];
  /**
   * Tags über ihren **Namen** — für Namen, die es in Takt noch nicht gibt
   * (T-061).
   *
   * Der Dienst legt sie an, wenn es sie nicht gibt, und verwendet das
   * vorhandene Tag, wenn es sie gibt. Beides in derselben Transaktion wie das
   * Todo. Das Add-in entscheidet das **nicht** vor: Es schickt den getippten
   * Namen und liest aus `createdTags`, was daraus geworden ist.
   *
   * Höchstens 50 Namen je Anfrage, je 1 bis 200 Zeichen — dieselbe Grenze wie
   * auf der Hauptfläche.
   */
  readonly tagNames: readonly string[];
  /** Der **interne Vermerk** (A-7.2). Nicht die Leistung. */
  readonly note: string;
  /**
   * Die **Frist** (A-19.21, E-074, T-149). `null` heißt „ohne Frist".
   *
   * Ein Tag der Form `JJJJ-MM-TT`, den der Benutzer im Aufgabenbereich
   * einträgt — **nicht** aus dem Betreff oder dem Text der E-Mail erkannt
   * (E-074 Punkt 4). Kein Feld, sondern der Wert: Was der Aufgabenbereich hier
   * einsetzt, hat `readDueDate` (`duedate/entry.ts`) gegen `isCalendarDay` aus
   * `@takt/domain` gehalten; die Grenze liegt trotzdem an der Tür des
   * Dienstes, die dieselbe Regel führt.
   *
   * **Ein Anhang steht hier nicht** und wird auch nicht nachgereicht
   * (A-19.19). Dieser Client kennt keine Anhangsroute, und die des Dienstes
   * liegt außerhalb von `/addin` — das Add-in-Token kommt dort nicht hin
   * (A-A-21).
   */
  readonly dueDate: string | null;
}

export interface BookRequest {
  readonly todoId: string;
  readonly startedAt: string;
  readonly endedAt: string;
  /** Die **Leistung** (A-7.3). Sie geht in die Abrechnung (A-7.4). */
  readonly note: string;
}
/*
 * Hier stand bis T-038 ein `reopenIfDone: boolean`.
 *
 * Eine Buchung auf ein erledigtes Todo hebt das Kennzeichen automatisch auf
 * (A-2.5) — im Add-in genauso wie in der Hauptanwendung. Der Aufruf hat dazu
 * nichts zu sagen; die Antwort sagt, was geschehen ist.
 */

export interface ApiClient {
  /** `GET /api/v1/health` — „Verbindung prüfen" in S-13. Braucht das Token. */
  checkConnection(): Promise<ApiResult<true>>;
  loadContext(): Promise<ApiResult<AddinContextDto>>;
  findMatches(callNumber: string): Promise<ApiResult<MatchResponseDto>>;
  createTodo(input: CreateTodoRequest): Promise<ApiResult<CreateTodoResponseDto>>;
  book(input: BookRequest): Promise<ApiResult<BookResponseDto>>;
}

const MESSAGES: Readonly<Record<ApiFailureKind, string>> = Object.freeze({
  unreachable: 'Takt ist nicht erreichbar. Läuft die Anwendung?',
  unauthorized: 'Das hinterlegte Token wird nicht akzeptiert.',
  origin_rejected:
    'Der lokale Dienst nimmt Anfragen von dieser Herkunft nicht an. Die Herkunft des Add-ins muss in Takt freigeschaltet sein.',
  not_found: 'Diese Funktion ist im laufenden Takt nicht vorhanden.',
  invalid_input: 'Die Eingabe ist unvollständig oder unzulässig.',
  failed: 'Die Anfrage an Takt ist fehlgeschlagen.',
});

const kindForStatus = (status: number): ApiFailureKind => {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'origin_rejected';
  if (status === 404) return 'not_found';
  if (status === 422 || status === 400) return 'invalid_input';
  return 'failed';
};

interface ErrorShape {
  readonly error?: {
    readonly code?: unknown;
    readonly message?: unknown;
    readonly details?: unknown;
  };
}

const readErrorBody = async (response: Response): Promise<ErrorShape> => {
  try {
    return (await response.json()) as ErrorShape;
  } catch {
    return {};
  }
};

export const createApiClient = (options: ApiClientOptions): ApiClient => {
  const base = options.baseUrl.replace(/\/+$/, '');

  const call = async <T>(
    method: 'GET' | 'POST',
    path: string,
    query?: Readonly<Record<string, string>>,
    body?: unknown,
  ): Promise<ApiResult<T>> => {
    const token = options.token();
    if (token === null) {
      return {
        ok: false,
        kind: 'unauthorized',
        code: null,
        message: 'Es ist kein Takt-Token hinterlegt.',
      };
    }

    // Adresse über `URL` zusammensetzen. Kein `${base}${path}?callNumber=${x}`:
    // Ein Wert aus einer fremden E-Mail gehört kodiert, und ein Wert, der wie
    // ein Token aussieht, darf gar nicht erst in eine Adresse geraten (B-2.4).
    const url = new URL(`${base}${path}`);
    if (query !== undefined) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = { [TOKEN_HEADER]: token };
    if (body !== undefined) {
      // Der Dienst nimmt ausschließlich `application/json` an und erzwingt
      // damit eine Vorabanfrage (B-1.2 Punkt 2).
      headers['Content-Type'] = 'application/json';
    }

    // Keine Anmeldedaten mitschicken: Der Nachweis steht in einer eigenen
    // Kopfzeile, und `Access-Control-Allow-Credentials` ist dienstseitig
    // ausdrücklich aus.
    const init: RequestInit = {
      method,
      headers,
      credentials: 'omit',
      cache: 'no-store',
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await options.fetch(url.toString(), init);
    } catch {
      // Der Grund eines Netzfehlers steht im Browser und nicht in der Antwort.
      // Ihn zu deuten hieße raten; „nicht erreichbar" ist die einzige Aussage,
      // die trägt.
      return { ok: false, kind: 'unreachable', code: null, message: MESSAGES.unreachable };
    }

    if (!response.ok) {
      const kind = kindForStatus(response.status);
      const shape = await readErrorBody(response);
      const code = typeof shape.error?.code === 'string' ? shape.error.code : null;
      const serverMessage =
        typeof shape.error?.message === 'string' ? shape.error.message : MESSAGES[kind];

      const failure: ApiFailure = {
        ok: false,
        kind,
        code,
        // Bei 401 gewinnt der eigene Text: Der des Dienstes ist absichtlich
        // nichtssagend, und S-12 braucht einen Satz, der nach S-13 führt.
        message: kind === 'unauthorized' ? MESSAGES.unauthorized : serverMessage,
      };

      return Array.isArray(shape.error?.details)
        ? { ...failure, details: shape.error.details as NonNullable<ApiFailure['details']> }
        : failure;
    }

    try {
      const payload = (await response.json()) as { readonly data: T };
      return { ok: true, value: payload.data };
    } catch {
      return { ok: false, kind: 'failed', code: null, message: MESSAGES.failed };
    }
  };

  return {
    async checkConnection() {
      const result = await call<{ readonly status: string }>('GET', '/api/v1/health');
      return result.ok ? { ok: true, value: true } : result;
    },
    loadContext() {
      return call<AddinContextDto>('GET', '/api/v1/addin/context');
    },
    findMatches(callNumber: string) {
      return call<MatchResponseDto>('GET', '/api/v1/addin/todo-matches', { callNumber });
    },
    createTodo(input: CreateTodoRequest) {
      return call<CreateTodoResponseDto>('POST', '/api/v1/addin/todos', undefined, input);
    },
    book(input: BookRequest) {
      return call<BookResponseDto>(
        'POST',
        `/api/v1/addin/todos/${encodeURIComponent(input.todoId)}/time-entries`,
        undefined,
        {
          startedAt: input.startedAt,
          endedAt: input.endedAt,
          note: input.note,
        },
      );
    },
  };
};

/** {@link ApiClientOptions} ohne den Port — alles, was der Browser nicht liefert. */
export type BrowserApiClientOptions = Omit<ApiClientOptions, 'fetch'>;

/**
 * Derselbe Zugang, aber mit der Abholfunktion des Browsers (T-190, A-A-40).
 *
 * ---------------------------------------------------------------------------
 * Warum diese drei Zeilen hier stehen und nicht beim Zusammenbau
 * ---------------------------------------------------------------------------
 *
 * Bis T-190 stand `fetch: window.fetch.bind(window)` in `ui/App.tsx`, also
 * dort, wo alles Äußere einmal erzeugt wird. Fachlich war das richtig und ist
 * es geblieben: Es ist **kein zweiter Weg zum Dienst**, sondern die
 * Einspeisung des Ports.
 *
 * Meßtechnisch war es trotzdem ein Fund. `proof:callers` sichert zu: „`fetch`
 * steht im Add-in nur in `api/client.ts`" — und diese Zusage ist der einzige
 * Grund, warum der Lauf **eine** Datei lesen darf und daraus über das ganze
 * Add-in urteilt. Sie stimmte nicht wörtlich; sichtbar wurde das erst, als
 * T-188 den blinden Ausdruck ersetzte, der `window.fetch` nie gesehen hatte.
 *
 * Zwei Wege standen offen. Die Einspeisung als Ausnahme eintragen — dann führt
 * dieselbe Zusage zwei Fassungen, eine im Satz und eine in einer Liste, und
 * genau das ist der Fehlerbau, den E-086 an anderer Stelle gerade aufgelöst
 * hat. Oder die Einspeisung dorthin legen, wo die Zusage sie ohnehin erwartet.
 * Das ist dieser Weg.
 *
 * ---------------------------------------------------------------------------
 * Was dabei **nicht** verlorengeht: die Prüfbarkeit
 * ---------------------------------------------------------------------------
 *
 * Der Grund für die Einspeisung war, daß sich jeder Baustein ohne Browser und
 * ohne laufenden Dienst prüfen läßt. Der Grund trägt weiter, weil der Port
 * bleibt, was er war:
 *
 *  - {@link createApiClient} verlangt `fetch` **weiterhin ohne Ersatzwert**.
 *    Jeder der Prüfläufe in `scripts/proof-addin.mjs` reicht seine eigene
 *    Abholfunktion herein und mißt an ihr Kopfzeilen, Adresse und Rumpf; keiner
 *    von ihnen ändert sich durch T-190.
 *  - Neu ist nur diese Hülle, und sie enthält **keine Entscheidung**: kein
 *    Zweig, keine Umformung, kein zweiter Aufruf. Was sich an ihr prüfen ließe,
 *    ist bereits an {@link createApiClient} geprüft.
 *  - `ui/App.tsx` nennt `fetch` danach nicht mehr — weder als Wert noch als
 *    Feldnamen. Die Zusage des Wächters stimmt damit wörtlich, und er verliert
 *    keine Datei aus dem Blick.
 *
 * Gebunden wird, weil das globale `fetch` seinen Empfänger braucht: `const f =
 * globalThis.fetch; f(...)` wirft in einigen Umgebungen `Illegal invocation`.
 */
export const createBrowserApiClient = (options: BrowserApiClientOptions): ApiClient =>
  createApiClient({ ...options, fetch: globalThis.fetch.bind(globalThis) });
