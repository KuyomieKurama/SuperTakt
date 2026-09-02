/**
 * Takt — Fehlerformat des lokalen Dienstes (architektur.md 5.3).
 *
 * ```json
 * { "error": { "code": "host_not_allowed", "message": "…" } }
 * ```
 *
 * `code` ist der englische technische Schlüssel und die einzige Größe, gegen
 * die ein Aufrufer verzweigt. `message` ist deutscher Anzeigetext (CLAUDE.md).
 *
 * **Nie enthalten:** Ablaufverfolgung, SQL-Meldung, Dateipfad, Kopfzeilenwerte,
 * das Token (B-2.4). Die Hülle nimmt gar keine Stelle entgegen, an der so etwas
 * stehen könnte — die Texte sind Konstanten, keine Vorlagen mit Einsetzung.
 */

import { redactSecrets } from './access/token.ts';

export type AccessErrorCode =
  | 'unauthorized'
  | 'host_not_allowed'
  | 'origin_not_allowed'
  | 'fetch_context_not_allowed'
  | 'token_in_url'
  | 'unsupported_media_type'
  | 'payload_too_large'
  | 'not_found'
  | 'method_not_allowed'
  | 'internal_error';

export interface ErrorEnvelope {
  readonly error: {
    readonly code: AccessErrorCode;
    readonly message: string;
  };
}

interface ErrorDefinition {
  readonly status: 400 | 401 | 403 | 404 | 405 | 413 | 415 | 500;
  readonly message: string;
}

/**
 * Ein Katalog aus Konstanten.
 *
 * Der 401-Text lautet **immer gleich**, unabhängig davon, ob das Token fehlte,
 * falsch war oder die falsche Länge hatte. Kein Vergleichsergebnis, keine
 * Teilzeichenkette, kein „erwartet …" (B-2.4 Punkt 3).
 */
const CATALOG: Readonly<Record<AccessErrorCode, ErrorDefinition>> = Object.freeze({
  unauthorized: {
    status: 401,
    message: 'Zugriff nicht möglich. Bitte das Takt-Token prüfen.',
  },
  host_not_allowed: {
    status: 403,
    message:
      'Diese Anfrage war nicht an den lokalen Dienst gerichtet. Takt beantwortet nur Anfragen an 127.0.0.1.',
  },
  origin_not_allowed: {
    status: 403,
    message: 'Diese Herkunft ist für den lokalen Dienst nicht zugelassen.',
  },
  fetch_context_not_allowed: {
    status: 403,
    message: 'Dieser Aufrufweg ist für den lokalen Dienst nicht zugelassen.',
  },
  token_in_url: {
    status: 400,
    message:
      'Das Token gehört in die Kopfzeile, nicht in die Adresse. Diese Anfrage wurde nicht ausgeführt; bitte ein neues Token erzeugen.',
  },
  unsupported_media_type: {
    status: 415,
    message: 'Der lokale Dienst nimmt ausschließlich application/json entgegen.',
  },
  payload_too_large: {
    status: 413,
    message: 'Die Anfrage ist zu groß.',
  },
  not_found: {
    status: 404,
    message: 'Nicht vorhanden.',
  },
  method_not_allowed: {
    status: 405,
    message: 'Diese Methode ist für diese Ressource nicht vorgesehen.',
  },
  internal_error: {
    status: 500,
    message: 'Ein unerwarteter Fehler ist aufgetreten.',
  },
});

export function errorStatus(code: AccessErrorCode): ErrorDefinition['status'] {
  return CATALOG[code].status;
}

export function errorEnvelope(code: AccessErrorCode): ErrorEnvelope {
  // `redactSecrets` über einen konstanten Text ist eine Zusicherung, keine
  // Reparatur: Fällt jemandem künftig ein, hier einen Wert einzusetzen, ist die
  // Schwärzung schon da.
  return { error: { code, message: redactSecrets(CATALOG[code].message) } };
}
