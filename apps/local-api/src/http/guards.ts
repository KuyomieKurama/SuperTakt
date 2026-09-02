/**
 * Takt — die Prüfschicht des lokalen Dienstes (T-011).
 *
 * Reihenfolge ist hier Inhalt, nicht Geschmack:
 *
 * ```
 *  1  securityHeaders    immer, auch auf jeder Abweisung
 *  2  requestLog         misst und protokolliert, ohne Werte aus der Anfrage
 *  3  hostGuard          B-1.3  DNS-Rebinding        ── gegen A-02
 *  4  originGuard        B-1.2, B-1.4  fremde Seite  ── gegen A-02
 *  5  urlSecretGuard     B-2.4  Token in der Adresse
 *  6  contentTypeGuard   B-1.2  erzwingt Vorabanfrage ── gegen A-02
 *  7  bodyLimit          B-1.7
 *  8  authGuard          B-1.1, B-2.5, B-2.6         ── gegen A-03
 *  9  credentialPolicy   B-2.10  welcher der beiden Nachweise ── gegen RR-1
 * ```
 *
 * Glied 9 ist die Umkehr der Vorgabe aus T-034: `authGuard` klärt, **ob** ein
 * gültiger Nachweis vorliegt, `credentialPolicy` klärt, **welcher** — und
 * verlangt für alles außerhalb von `/api/v1/addin` das Sitzungsgeheimnis.
 *
 * Die Herkunftsprüfungen (3, 4, 6) stehen **vor** dem Nachweis (8). Zwei
 * Gründe: Ein Angreifer, der über die Herkunft schon abgewiesen wird, kann am
 * Token nicht einmal einen Zeitunterschied beobachten (B-1.3 Punkt 2). Und die
 * Wirkung einer zustandsändernden Anfrage tritt nicht ein, bevor die Herkunft
 * geklärt ist.
 *
 * Die Kette hängt als **eine** Middleware vor **allen** Routen, nicht je Route.
 * Sonst ist die nächste neue Route die vergessene (B-1.1 Punkt 1).
 */

import type { Context, MiddlewareHandler } from 'hono';

import {
  ALLOWED_ORIGINS,
  AUTH_FAILURE_MAX_DELAY_MS,
  AUTH_FAILURE_THRESHOLD,
  AUTH_FAILURE_WINDOW_MS,
  TOKEN_HEADER,
  allowedHosts,
} from '../config.ts';
import { checkContentType, checkHost, checkOrigin, urlCarriesSecret } from '../access/origin-policy.ts';
import { recordFailure, recordSuccess } from '../access/throttle.ts';
import { SECRET_SHAPE } from '../access/token.ts';
import type { CredentialKind } from '../access/token.ts';
import { requiredCredentialForPath } from '../access/route-policy.ts';
import { satisfiesRequirement, verifyCredential, type RequiredCredential } from '../access/verifier.ts';
import { errorEnvelope, errorStatus, type AccessErrorCode } from '../errors.ts';
import type { AccessRuntime } from '../runtime.ts';

export interface TaktEnv {
  Variables: {
    /** Womit sich der Aufrufer ausgewiesen hat. Erst nach `authGuard` gesetzt. */
    credential: CredentialKind;
    /** Für die Protokollzeile. Ein Schlüssel, nie ein Wert aus der Anfrage. */
    outcome: string;
  };
}

type Ctx = Context<TaktEnv>;

function reject(c: Ctx, code: AccessErrorCode): Response {
  c.set('outcome', code);
  return c.json(errorEnvelope(code), errorStatus(code));
}

/**
 * Kopfzeilen, die auf **jeder** Antwort stehen, auch auf jeder Abweisung.
 *
 * `no-store` hält Antworten aus Zwischenspeichern; `nosniff` verhindert, dass
 * ein Browser eine JSON-Antwort als etwas anderes deutet; die eng gesetzte CSP
 * und `frame-ancestors 'none'` sorgen dafür, dass der Dienst weder als Seite
 * noch in einem Rahmen etwas ausführen kann.
 */
export function securityHeaders(): MiddlewareHandler<TaktEnv> {
  return async (c, next) => {
    await next();
    c.header('Cache-Control', 'no-store');
    c.header('Pragma', 'no-cache');
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('X-Frame-Options', 'DENY');
    c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; sandbox");
  };
}

export function requestLog(runtime: AccessRuntime): MiddlewareHandler<TaktEnv> {
  return async (c, next) => {
    const started = performance.now();
    c.set('outcome', 'ok');
    await next();
    runtime.logger.request({
      method: c.req.method,
      // `c.req.path` ist der Pfad ohne Abfrageparameter. Das ist Absicht: eine
      // Adresse mit `?token=…` darf nicht ins Protokoll (B-2.4).
      path: c.req.path,
      status: c.res.status,
      durationMs: performance.now() - started,
      outcome: c.get('outcome') ?? 'ok',
    });
  };
}

/** B-1.3 — Positivliste für `Host`. Wirkt gegen A-02, nicht gegen A-03. */
export function hostGuard(runtime: AccessRuntime): MiddlewareHandler<TaktEnv> {
  const hosts = allowedHosts(runtime.port);
  return async (c, next) => {
    if (!checkHost(c.req.header('host') ?? null, hosts)) {
      runtime.notices.record('host_rejected', runtime.clock());
      return reject(c, 'host_not_allowed');
    }
    await next();
    return undefined;
  };
}

/**
 * B-1.2, B-1.4 — Herkunft, Abrufkontext und CORS.
 *
 * Beantwortet auch die Vorabanfrage: Ein Browser schickt bei `OPTIONS` **kein**
 * Token mit, also muss die Vorabanfrage vor dem Nachweis erledigt sein. Sie
 * wird nur für gelistete Herkünfte beantwortet.
 *
 * `Access-Control-Allow-Credentials` bleibt aus. Es wird nicht gebraucht, weil
 * der Nachweis in einer eigenen Kopfzeile steht und nicht in einem Cookie —
 * damit gibt es keine Berechtigung, die ein Browser von sich aus mitschickt,
 * und CSRF verliert seine Grundlage.
 */
export function originGuard(runtime: AccessRuntime): MiddlewareHandler<TaktEnv> {
  return async (c, next) => {
    const decision = checkOrigin(
      {
        host: c.req.header('host') ?? null,
        origin: c.req.header('origin') ?? null,
        secFetchSite: c.req.header('sec-fetch-site') ?? null,
        secFetchMode: c.req.header('sec-fetch-mode') ?? null,
      },
      ALLOWED_ORIGINS,
    );

    if (!decision.allowed) {
      runtime.notices.record(
        decision.reason === 'origin_not_allowed' ? 'origin_rejected' : 'host_rejected',
        runtime.clock(),
      );
      return reject(c, decision.reason);
    }

    if (decision.corsOrigin !== null) {
      c.header('Access-Control-Allow-Origin', decision.corsOrigin);
      c.header('Vary', 'Origin');
    }

    if (c.req.method === 'OPTIONS') {
      c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
      c.header('Access-Control-Allow-Headers', `${TOKEN_HEADER}, Content-Type`);
      c.header('Access-Control-Max-Age', '60');
      c.set('outcome', 'preflight');
      return c.body(null, 204);
    }

    await next();
    return undefined;
  };
}

/**
 * B-2.4 Punkt 1 — ein Token in der Adresse.
 *
 * Die Anfrage wird mit 400 abgewiesen, **ohne den Wert zu wiederholen**, und
 * das Token gilt ab da als kompromittiert: Die Meldung fordert zur
 * Neuerzeugung auf, und der Vorfall steht in den Sicherheitsmeldungen.
 */
export function urlSecretGuard(runtime: AccessRuntime): MiddlewareHandler<TaktEnv> {
  return async (c, next) => {
    if (urlCarriesSecret(c.req.url, SECRET_SHAPE)) {
      runtime.notices.record('token_in_url', runtime.clock());
      return reject(c, 'token_in_url');
    }
    await next();
    return undefined;
  };
}

/** B-1.2 Punkt 2 — nur `application/json`, geprüft vor dem Lesen des Rumpfs. */
export function contentTypeGuard(): MiddlewareHandler<TaktEnv> {
  return async (c, next) => {
    const length = c.req.header('content-length');
    const hasBody =
      (length !== undefined && length !== '0') || c.req.header('transfer-encoding') !== undefined;
    if (!checkContentType(c.req.method, c.req.header('content-type') ?? null, hasBody)) {
      return reject(c, 'unsupported_media_type');
    }
    await next();
    return undefined;
  };
}

/**
 * B-1.1, B-2.5, B-2.6 — der Nachweis.
 *
 * **Wogegen:** gegen A-03, jeden lokalen Prozess. Er ist die einzige Maßnahme,
 * die dort überhaupt wirkt — die Herkunftsprüfung ist gegen ihn wirkungslos,
 * weil er alle Kopfzeilen frei setzt (B-2.9).
 *
 * Der Weg ist für jeden Fehlschlag derselbe: hashen, beide Abdrücke vergleichen,
 * antworten. Keine vorgezogene Längenprüfung, kein früher Ausstieg bei fehlender
 * Kopfzeile, immer derselbe Text.
 */
export function authGuard(runtime: AccessRuntime): MiddlewareHandler<TaktEnv> {
  return async (c, next) => {
    const presented = c.req.header(TOKEN_HEADER) ?? null;

    const outcome = verifyCredential(
      presented,
      { addin: runtime.tokens.addinFingerprint(), session: runtime.sessionFingerprint },
      runtime.digest,
    );

    if (!outcome.ok) {
      const now = runtime.clock();
      const decision = recordFailure(runtime.throttle, now.getTime(), {
        windowMs: AUTH_FAILURE_WINDOW_MS,
        threshold: AUTH_FAILURE_THRESHOLD,
        maxDelayMs: AUTH_FAILURE_MAX_DELAY_MS,
      });
      runtime.throttle = decision.state;
      if (decision.alarm) {
        // Der einzige Weg, auf dem der Benutzer von einem Angriff nach B-1.1
        // überhaupt erfährt. Festgehalten wird Zeitpunkt und Anzahl — nicht der
        // geratene Wert.
        runtime.notices.record('auth_failure_burst', now);
      }
      if (decision.delayMs > 0) {
        await sleep(decision.delayMs);
      }
      return reject(c, 'unauthorized');
    }

    runtime.throttle = recordSuccess(runtime.throttle);
    c.set('credential', outcome.kind);
    if (outcome.kind === 'addin') {
      // Zeitpunkt der letzten Verwendung fortschreiben (B-2.7 Punkt 4). Ein
      // Fehlschlag dabei darf die Anfrage nicht kippen.
      await runtime.tokens.noteUsed(runtime.clock()).catch(() => undefined);
    }

    await next();
    return undefined;
  };
}

/**
 * B-2.10 — **welcher** der beiden Nachweise vorliegt, für **jede** Route.
 *
 * Die Vorgabe ist umgedreht (T-034): Verlangt wird das Sitzungsgeheimnis, und
 * ausschließlich der Teilbaum `/api/v1/addin` senkt die Anforderung auf `any`.
 * Bis dahin galt die umgekehrte Richtung, und der security-checker hat in T-023
 * gemessen, was ein Add-in-Token damit erreichte: den internen Vermerk lesen
 * und überschreiben, den Exportordner setzen, einen Exportlauf dorthin
 * auslösen.
 *
 * Entscheidend ist, dass hier **nichts aufgezählt** wird. Die Anforderung fällt
 * aus dem Pfad (`access/route-policy.ts`), nicht aus einer Liste — eine neue
 * Fachroute ist deshalb von selbst geschlossen und nicht erst, nachdem jemand
 * an sie gedacht hat. Das ist dieselbe Bauform und dieselbe Begründung wie bei
 * der Kette als Ganzes (B-1.1 Punkt 1).
 *
 * Steht **hinter** `authGuard`: Sie arbeitet nur auf dessen Ergebnis, nicht auf
 * einem Geheimnis, und darf deshalb früh aussteigen.
 */
export function credentialPolicy(): MiddlewareHandler<TaktEnv> {
  return async (c, next) => {
    // `c.req.path` ist exakt die Zeichenkette, mit der Hono auch geroutet hat.
    // Begründung, warum das die tragende Eigenschaft ist, in route-policy.ts.
    const kind = c.get('credential');
    if (kind === undefined || !satisfiesRequirement(kind, requiredCredentialForPath(c.req.path))) {
      return denyCredential(c);
    }
    await next();
    return undefined;
  };
}

/**
 * Verlangt für einzelne Routen das Sitzungsgeheimnis.
 *
 * Seit T-034 ist das die **zweite** Sperre: `credentialPolicy` verlangt
 * `session` ohnehin überall außerhalb von `/addin`. Sie bleibt trotzdem an
 * `GET /token`, `POST /token` und `GET /security/notices` stehen, weil an
 * diesen drei Routen die Begründung eine andere ist als „nicht das Add-in":
 * Ein entwendetes Add-in-Token darf sich weder anzeigen noch austauschen
 * lassen, sonst sperrt ein Angreifer den Benutzer aus seinem eigenen Dienst aus
 * (B-2.9 Punkt 3). Wer den Teilbaum `/addin` je erweitert, soll an diesen drei
 * Stellen auf die Nase fallen und nicht auf eine stillschweigend geerbte
 * Vorgabe treffen.
 *
 * Arbeitet nur auf dem Ergebnis des Nachweises, nicht auf einem Geheimnis — sie
 * darf deshalb früh aussteigen.
 */
export function requireCredential(required: RequiredCredential): MiddlewareHandler<TaktEnv> {
  return async (c, next) => {
    const kind = c.get('credential');
    if (kind === undefined || !satisfiesRequirement(kind, required)) {
      return denyCredential(c);
    }
    await next();
    return undefined;
  };
}

/**
 * Abweisung wegen der **falschen Sorte** Nachweis.
 *
 * Derselbe Schlüssel und derselbe Text wie bei einem fehlenden Token. Ein
 * Aufrufer mit gültigem Add-in-Token erfährt damit nicht, ob es die Route für
 * jemand anderen gibt, ob sie existiert oder wie sie heißt — 401 für „falsche
 * Sorte", 401 für „gibt es nicht" (B-2.4 Punkt 3).
 */
function denyCredential(c: Ctx): Response {
  c.set('outcome', 'unauthorized');
  return c.json(errorEnvelope('unauthorized'), errorStatus('unauthorized'));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
