/**
 * Takt — der Zugang zum lokalen Dienst (A-10.3, E-009, R-09, B-2.4).
 *
 * ## Vier Regeln, die diese Datei einhält
 *
 * 1. **Das Token steht in der Kopfzeile `X-Takt-Token`** — nicht in einem
 *    Cookie, nicht im `Authorization`-Kopf, nie in der Adresse.
 * 2. **Das Token erscheint in keiner Fehlermeldung und in keiner
 *    Protokollausgabe.**
 * 3. **Ein 401 ist immer derselbe Fall.** Der Client rät nicht, woran es lag.
 * 4. **`fetch` ist ein Port.** {@link createApiClient} nimmt keine
 *    Abholfunktion aus der Umgebung, wenn der Aufrufer keine nennt.
 */

import type { EmailAttachmentEnvelope } from '../attachments/model.ts';

import type {
  AddinContextDto,
  BookResponseDto,
  CreateTodoResponseDto,
  MatchResponseDto,
} from './types.ts';

/** Name der Kopfzeile aus `apps/local-api/src/config.ts`. */
const TOKEN_HEADER = 'X-Takt-Token';

export type ApiFailureKind =
  | 'unreachable'
  | 'unauthorized'
  | 'origin_rejected'
  | 'not_found'
  | 'invalid_input'
  | 'failed';

export interface ApiFailure {
  readonly ok: false;
  readonly kind: ApiFailureKind;
  readonly code: string | null;
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
  /** Liefert das Token **bei jedem Aufruf** neu. */
  readonly token: () => string | null;
  /** Die Abholfunktion — **ohne Ersatzwert**. */
  readonly fetch: typeof globalThis.fetch;
}

export interface CreateTodoRequest {
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: string | null;
  readonly tagIds: readonly string[];
  readonly tagNames: readonly string[];
  /** Der **interne Vermerk** (A-7.2). Nicht die Leistung. */
  readonly note: string;
  /** `null` heißt „ohne Frist". */
  readonly dueDate: string | null;
  /**
   * Die E-Mail und ihre Dateien, als **Teil des Anlegens** (A-19.22 bis
   * A-19.33 in der Fassung von E-108, A-A-82).
   *
   * ---------------------------------------------------------------------------
   * Warum im Rumpf des Anlegens und nicht in einer zweiten Anfrage
   * ---------------------------------------------------------------------------
   *
   * Weil eine zweite Anfrage eine Todo-Kennung tragen müßte. Es gibt keinen
   * Aufruf, der eine Todo-Kennung entgegennimmt und einen Anhang erzeugt — weder
   * hier noch im Dienst, und das steht dort im **Typ** der Fähigkeit und nicht
   * in einem Satz daneben.
   *
   * `null` heißt „ohne Anhänge" und ist der Zustand, solange die Übernahme
   * nicht angeboten wird.
   */
  readonly attachments: EmailAttachmentEnvelope | null;
}

/**
 * Trägt der Anlegeruf die Anhänge mit? (T-300, T-304)
 *
 * `true` ist hier **kein Schalter und keine Voreinstellung**, sondern die
 * Auskunft über einen Tatbestand: `POST /api/v1/addin/todos` liest seit T-304
 * das Feld `attachments`. Stünde hier `false`, während das Feld oben steht,
 * wäre eines von beiden eine Behauptung — `proof:addin` Abschnitt 22 hält
 * beides gegeneinander und wird dann rot.
 *
 * ---------------------------------------------------------------------------
 * Warum diese Konstante überhaupt existiert hat — und warum sie stehenbleibt
 * ---------------------------------------------------------------------------
 *
 * `createTodoSchema` ist ein `z.object`, und ein `z.object` **streicht**
 * unbekannte Felder still, statt sie abzuweisen. Ein mitgeschickter Anhang an
 * einer Tür, die das Feld nicht liest, verschwände also lautlos, während der
 * Aufgabenbereich „3 Anhänge hängen daran" meldete — der stille Ausfall, den
 * A-19.31 ausschließt, in seiner unangenehmsten Form.
 *
 * Die Konstante ist die Stelle, an der dieser Zusammenhang **gemessen** wird
 * statt gehofft. Sie bleibt deshalb stehen: Wer die Tür morgen wieder schließt,
 * ohne den Aufgabenbereich zu ändern, soll rot werden und nicht still verlieren.
 *
 * Ausdrücklich `boolean` und nicht der Literaltyp `true`: Der Übersetzer soll
 * die Zweige für „trägt nicht mit" **nicht** als unerreichbar wegwerfen.
 */
export const ATTACHMENTS_TRAVEL_WITH_CREATE: boolean = true;

export interface BookRequest {
  readonly todoId: string;
  readonly startedAt: string;
  readonly endedAt: string;
  /** Die **Leistung** (A-7.3). Sie geht in die Abrechnung (A-7.4). */
  readonly note: string;
}

export interface ApiClient {
  checkConnection(): Promise<ApiResult<true>>;
  loadContext(): Promise<ApiResult<AddinContextDto>>;
  findMatches(callNumber: string): Promise<ApiResult<MatchResponseDto>>;
  createTodo(input: CreateTodoRequest): Promise<ApiResult<CreateTodoResponseDto>>;
  /**
   * Bucht Zeit auf ein vorhandenes Todo.
   *
   * **Die einzige schreibende Handlung an einem fremden Todo, die dieser
   * Zugang kennt.** An einem **vorhandenen** Todo legt er keinen Anhang an:
   * Es gibt dafür weder eine Methode hier noch eine Route unter `/addin`.
   *
   * **Das gilt unverändert weiter, obwohl seit T-304 über
   * {@link ApiClient.createTodo} Anhänge entstehen.** Sie entstehen
   * ausschließlich **beim Anlegen** und fahren deshalb im Rumpf jenes Aufrufs
   * mit; A-10.9 ändert sich nicht, im Duplikatfall wird weiterhin nur
   * hingewiesen. Diese Methode hier ist die einzige mit einer Todo-Kennung in
   * der Signatur — und sie nimmt keine Datei entgegen. Beides zusammen mit
   * einer Kennung wäre die Tür, die A-A-82 zuhält.
   */
  book(input: BookRequest): Promise<ApiResult<BookResponseDto>>;
}

const MESSAGES: Readonly<Record<ApiFailureKind, string>> = Object.freeze({
  unreachable: 'SuperTakt ist nicht erreichbar. Läuft die Anwendung?',
  unauthorized: 'Das hinterlegte Token wird nicht akzeptiert.',
  origin_rejected:
    'Der lokale Dienst nimmt Anfragen von dieser Herkunft nicht an. Die Herkunft des Add-ins muss in SuperTakt freigeschaltet sein.',
  not_found: 'Diese Funktion ist im laufenden SuperTakt nicht vorhanden.',
  invalid_input: 'Die Eingabe ist unvollständig oder unzulässig.',
  failed: 'Die Anfrage an SuperTakt ist fehlgeschlagen.',
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
        message: 'Es ist kein SuperTakt-Token hinterlegt.',
      };
    }

    const url = new URL(`${base}${path}`);
    if (query !== undefined) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = { [TOKEN_HEADER]: token };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const init: RequestInit = {
      method,
      headers,
      credentials: 'omit',
      cache: 'no-store',
    };
    if (body !== undefined) init.body = JSON.stringify(body);

    let response: Response;
    try {
      response = await options.fetch(url.toString(), init);
    } catch {
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
 * `createApiClient` verlangt `fetch` weiterhin ohne Ersatzwert. Diese Hülle ist
 * die einzige Stelle, an der das Browser-`fetch` eingesetzt wird; dadurch
 * bleiben alle Aufrufe im Nachweispfad ohne Netz reproduzierbar.
 */
export const createBrowserApiClient = (options: BrowserApiClientOptions): ApiClient =>
  createApiClient({ ...options, fetch: globalThis.fetch.bind(globalThis) });
