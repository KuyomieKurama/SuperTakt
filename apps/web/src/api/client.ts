/**
 * Takt — der Zugang zum lokalen Dienst.
 *
 * Eine Stelle für Grundadresse, Nachweis, Umschlag und Fehlerform. Keine
 * Ansicht ruft `fetch` selbst auf.
 *
 * ## Wie sich die Oberfläche ausweist
 *
 * Über das **Sitzungsgeheimnis** aus `serviceHandshake()` der Hülle, gesetzt in
 * der Kopfzeile, deren Namen dieselbe Antwort nennt. Ausdrücklich nicht über
 * das Add-in-Token: Diese Trennung ist der Grund, warum ein entwendetes
 * Add-in-Token sich weder anzeigen noch austauschen kann (T-011).
 *
 * Das Geheimnis steht ausschließlich im Arbeitsspeicher dieses Moduls. Es geht
 * weder in `localStorage` noch in `sessionStorage` noch in eine Adresszeile —
 * `shell.ts` sagt das, und hier wird es eingehalten. Aus demselben Grund hängt
 * kein Nachweis an einer Abfragezeichenkette: Der Dienst weist eine solche
 * Anfrage mit 400 ab (`token_in_url`), und das ist die richtige Antwort.
 */

import type { ApiError, Envelope, ErrorEnvelope, RunningTimeEntry } from "./types";

/* ==================================================================== */
/* Fehler                                                               */
/* ==================================================================== */

/**
 * Ein Fehler des Dienstes, mit seinem deutschen Text.
 *
 * `message` kommt unverändert vom Dienst. Eine Oberfläche, die daraus
 * „Ein Fehler ist aufgetreten“ macht, nimmt dem Benutzer die einzige Auskunft,
 * die er weitergeben kann.
 */
export class TaktApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: ReadonlyArray<{ field: string; message: string; code: string }>;
  /** Beim Timerstart mit laufendem Timer (A-6.8) gesetzt. */
  readonly running: RunningTimeEntry | null;

  constructor(
    status: number,
    error: ApiError,
    running: RunningTimeEntry | null = null,
  ) {
    super(error.message);
    this.name = "TaktApiError";
    this.code = error.code;
    this.status = status;
    this.details = error.details === undefined ? [] : [...error.details];
    this.running = running;
  }
}

/** Der Dienst war nicht erreichbar. Kein Statuscode, keine Antwort. */
export class TaktTransportError extends Error {
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.name = "TaktTransportError";
  }
}

/** Deutscher Anzeigetext für einen beliebigen Fehlschlag. */
export function errorMessage(cause: unknown): string {
  if (cause instanceof TaktApiError) return cause.message;
  if (cause instanceof TaktTransportError) return cause.message;
  if (cause instanceof Error && cause.message.length > 0) return cause.message;
  return "Unbekannter Fehler. Bitte versuchen Sie es erneut.";
}

/** Technischer Schlüssel, falls vorhanden — die einzige Größe zum Verzweigen. */
export function errorCode(cause: unknown): string | null {
  return cause instanceof TaktApiError ? cause.code : null;
}

/* ==================================================================== */
/* Verbindung                                                           */
/* ==================================================================== */

export interface Connection {
  /** Grundadresse aller Routen, etwa `http://127.0.0.1:17843/api/v1`. */
  readonly baseUrl: string;
  readonly headerName: string;
  readonly secret: string;
}

let connection: Connection | null = null;

export function setConnection(next: Connection): void {
  connection = next;
}

export function hasConnection(): boolean {
  return connection !== null;
}

/* ==================================================================== */
/* Anfragen                                                             */
/* ==================================================================== */

export type QueryValue = string | number | boolean | readonly string[] | undefined;

/**
 * Baut die Abfragezeichenkette. Leere Werte fallen weg, Listen werden mit
 * Komma verbunden — so liest der Dienst sie (`statusId=a,b`).
 */
function queryString(params: Readonly<Record<string, QueryValue>>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      search.set(key, value.join(","));
      continue;
    }
    const single = value as string | number | boolean;
    if (single === "") continue;
    search.set(key, String(single));
  }
  const text = search.toString();
  return text.length === 0 ? "" : `?${text}`;
}

interface RequestOptions {
  readonly method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

async function readErrorEnvelope(response: Response): Promise<TaktApiError> {
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  const envelope = parsed as Partial<ErrorEnvelope> | null;
  const error = envelope?.error;
  if (error === undefined) {
    return new TaktApiError(response.status, {
      code: "unexpected_response",
      message: `Der lokale Dienst hat unerwartet geantwortet (${String(response.status)}).`,
    });
  }
  return new TaktApiError(response.status, error, envelope?.running ?? null);
}

/**
 * Führt eine Anfrage aus und packt `data` aus.
 *
 * `204` liefert `undefined` — Aufrufer typisieren dann auf `void`.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const active = connection;
  if (active === null) {
    throw new TaktTransportError(
      "Takt ist noch nicht mit dem lokalen Dienst verbunden.",
    );
  }

  const method = options.method ?? "GET";
  const headers: Record<string, string> = { [active.headerName]: active.secret };
  let payload: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(
      `${active.baseUrl}${path}${queryString(options.query ?? {})}`,
      {
        method,
        headers,
        cache: "no-store",
        ...(payload === undefined ? {} : { body: payload }),
        ...(options.signal === undefined ? {} : { signal: options.signal }),
      },
    );
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new TaktTransportError(
      "Der lokale Dienst antwortet nicht. Läuft Takt noch vollständig?",
      { cause },
    );
  }

  if (!response.ok) throw await readErrorEnvelope(response);
  if (response.status === 204) return undefined as T;

  const envelope = (await response.json()) as Envelope<T>;
  return envelope.data;
}
