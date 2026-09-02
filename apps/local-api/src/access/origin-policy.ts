/**
 * Takt — Herkunftsprüfung (B-1.2, B-1.3, B-1.4).
 *
 * ## Wogegen diese Datei wirkt — und wogegen ausdrücklich nicht
 *
 * Sie wirkt gegen **A-02, eine beliebige Webseite im Browser des Benutzers**.
 * Ein Browser zwingt eine Seite zu wahrheitsgemäßen `Origin`-, `Host`- und
 * `Sec-Fetch-*`-Kopfzeilen; sie sind aus Seitenskripten nicht setzbar. Gegen
 * diesen Akteur ist die Prüfung sehr wirksam.
 *
 * Sie wirkt **nicht** gegen **A-03, einen beliebigen lokalen Prozess**. Drei
 * Zeilen Skript setzen `Host: 127.0.0.1:17843` und
 * `Origin: tauri://localhost` von Hand. Wer das Token hat, ist damit von
 * der echten Oberfläche nicht mehr unterscheidbar (B-2.9).
 *
 * **Daraus folgt die Aufteilung im Kopf behalten:** Herkunftsprüfung und Token
 * sind zwei Maßnahmen gegen zwei verschiedene Angreifer, nicht zwei Schichten
 * gegen denselben. Keine ersetzt die andere. Wer die eine für eine Reserve der
 * anderen hält, baut beim nächsten Umbau die falsche weg.
 *
 * Alles hier ist rein: Zeichenketten hinein, Entscheidung heraus.
 */

export type OriginRejection = 'host_not_allowed' | 'origin_not_allowed' | 'fetch_context_not_allowed';

export interface OriginFacts {
  /** Wert der `Host`-Kopfzeile, `null` wenn sie fehlt. */
  readonly host: string | null;
  /** Wert der `Origin`-Kopfzeile, `null` wenn sie fehlt. */
  readonly origin: string | null;
  /** `Sec-Fetch-Site`, von Browsern gesetzt und aus Skripten nicht änderbar. */
  readonly secFetchSite: string | null;
  /** `Sec-Fetch-Mode`. `navigate` heißt: jemand ruft die API als Seite auf. */
  readonly secFetchMode: string | null;
}

export type OriginDecision =
  | {
      readonly allowed: true;
      /**
       * Herkunft, die in `Access-Control-Allow-Origin` zurückgegeben wird.
       * `null` heißt: kein CORS-Kopf, weil die Anfrage keine Herkunft hatte
       * (nativer Aufrufer, Tauri-Hülle, `curl`).
       */
      readonly corsOrigin: string | null;
    }
  | { readonly allowed: false; readonly reason: OriginRejection };

/**
 * Prüft die `Host`-Kopfzeile gegen die Positivliste (B-1.3).
 *
 * **Wogegen:** DNS-Rebinding. `evil.example` löst zunächst auf den Server des
 * Angreifers auf, nach kurzer Lebensdauer auf `127.0.0.1`. Der Browser hält die
 * Herkunft weiterhin für `evil.example`, der Zugriff gilt als gleichherkünftig,
 * und CORS greift nicht mehr — die Antworten wären lesbar. Eine reine
 * Herkunftsprüfung hilft dann nicht, weil `Origin` der Angreiferdomäne
 * entspricht oder gar nicht gesendet wird.
 *
 * Der Browser trägt aber den vom Angreifer gewählten **Namen** in `Host` ein.
 * Genau daran scheitert der Angriff hier.
 *
 * Die Prüfung steht **vor** dem Nachweis, damit ein Angreifer über sie nicht
 * einmal einen Zeitunterschied am Token beobachten kann (B-1.3 Punkt 2).
 * Ein fehlender `Host` (HTTP/1.0-Stil) wird ebenfalls abgewiesen.
 */
export function checkHost(host: string | null, allowed: readonly string[]): boolean {
  if (host === null) {
    return false;
  }
  // Zeichengleichheit auf dem vollständigen Wert. Kein `startsWith`, kein
  // `includes`, kein Abschneiden am Doppelpunkt: `127.0.0.1:17843.evil.example`
  // bestünde sonst.
  const normalized = host.trim().toLowerCase();
  return allowed.includes(normalized);
}

/**
 * Prüft Herkunft und Abrufkontext (B-1.2 Punkt 4, B-1.4).
 *
 * Regeln, in dieser Reihenfolge:
 *
 * 1. `Sec-Fetch-Mode: navigate` wird abgewiesen. Ein Mensch, der die API in die
 *    Adresszeile tippt, bekommt nichts; eine Seite, die den Dienst in einen
 *    Rahmen oder ein Bild zieht, ebenfalls nicht.
 * 2. Ist eine `Origin`-Kopfzeile vorhanden, muss sie **buchstäblich** auf der
 *    Liste stehen. Eine vorhandene, aber nicht gelistete Herkunft wird
 *    **abgewiesen**, nicht nur ohne CORS-Kopfzeilen beantwortet — sonst tritt
 *    die Wirkung einer zustandsändernden Anfrage ein, obwohl der Browser die
 *    Antwort verwirft (B-1.4 Punkt 4).
 * 3. Fehlt `Origin`, aber `Sec-Fetch-Site` sagt `cross-site` oder
 *    `same-site`, wird abgewiesen. Das ist der Fall, den eine fremde Seite mit
 *    einer einfachen Anfrage ohne Vorabanfrage erzeugt.
 * 4. Fehlt beides, wird zugelassen. Das ist der native Aufrufer — die
 *    Tauri-Hülle, ein Werkzeug, ein Skript. Für ihn trägt allein das Token,
 *    und das ist ehrlich so gemeint: siehe Kopf dieser Datei.
 */
export function checkOrigin(facts: OriginFacts, allowedOrigins: readonly string[]): OriginDecision {
  const mode = facts.secFetchMode?.trim().toLowerCase() ?? null;
  if (mode === 'navigate' || mode === 'websocket') {
    return { allowed: false, reason: 'fetch_context_not_allowed' };
  }

  const site = facts.secFetchSite?.trim().toLowerCase() ?? null;

  if (facts.origin !== null) {
    const origin = facts.origin.trim();
    // Zeichengleichheit der vollständigen Herkunft. `null` als Zeichenkette
    // (Herkunft aus einem `sandbox`-Rahmen oder nach einer Umleitung) steht
    // nicht auf der Liste und fällt hier durch.
    if (!allowedOrigins.includes(origin)) {
      return { allowed: false, reason: 'origin_not_allowed' };
    }
    return { allowed: true, corsOrigin: origin };
  }

  if (site !== null && site !== 'none' && site !== 'same-origin') {
    return { allowed: false, reason: 'fetch_context_not_allowed' };
  }

  return { allowed: true, corsOrigin: null };
}

/**
 * Zustandsändernde Anfragen nehmen ausschließlich `application/json` an
 * (B-1.2 Punkt 2).
 *
 * **Wogegen:** die CSRF-Klasse. Ohne Vorabanfrage gelingt einer fremden Seite
 * nur eine „einfache" Anfrage — `GET`, `HEAD` oder `POST` mit `text/plain`,
 * `application/x-www-form-urlencoded` oder `multipart/form-data`. Die Antwort
 * kann sie nicht lesen, aber die **Wirkung** träte ein. Wer ausschließlich JSON
 * annimmt, erzwingt eine Vorabanfrage, die der Angreifer nicht besteht.
 *
 * Zusammen mit der eigenen Kopfzeile aus `TOKEN_HEADER` — die ebenfalls eine
 * Vorabanfrage erzwingt — und dem vollständigen Verzicht auf Cookies verliert
 * CSRF hier seine Grundlage. Es gibt keine Berechtigung, die ein Browser von
 * sich aus mitschickt.
 */
export function checkContentType(
  method: string,
  contentType: string | null,
  hasBody: boolean,
): boolean {
  const upper = method.toUpperCase();
  if (upper === 'GET' || upper === 'HEAD' || upper === 'OPTIONS') {
    return true;
  }
  if (!hasBody && contentType === null) {
    // Ein `POST` ohne Rumpf und ohne Angabe ist zulässig — etwa das Erzeugen
    // eines neuen Tokens. Es kommt trotzdem nur mit gültiger Kopfzeile durch.
    return true;
  }
  if (contentType === null) {
    return false;
  }
  const media = contentType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  return media === 'application/json';
}

/**
 * Sucht ein Takt-Geheimnis in der Adresse (B-2.4 Punkt 1).
 *
 * **Wogegen:** Eine Adresse steht im Browserverlauf, im Zugriffsprotokoll eines
 * jeden Zwischenstücks und in der `Referer`-Kopfzeile fremder Ziele. Ein Token
 * dort ist ein verlorenes Token.
 *
 * Gefunden wird nach **Gestalt**, nicht nach Parametername: `?token=`,
 * `?access_token=`, `/takt_…/` im Pfad — alles trifft dieselbe Regel. Der
 * gefundene Wert wird nicht zurückgegeben und nirgends festgehalten.
 */
export function urlCarriesSecret(rawUrl: string, secretPattern: RegExp): boolean {
  // Ohne `g`-Kennzeichen. Ein Ausdruck mit `g` behält `lastIndex` zwischen
  // Aufrufen; derselbe Ausdruck träfe dann bei jeder zweiten Prüfung nicht —
  // ein sporadischer Fehler, den niemand reproduziert (B-4.4).
  const probe = new RegExp(secretPattern.source);
  let decoded = rawUrl;
  try {
    decoded = decodeURIComponent(rawUrl);
  } catch {
    // Eine kaputte Prozentkodierung ist kein Grund, die Prüfung zu überspringen.
    decoded = rawUrl;
  }
  return probe.test(rawUrl) || probe.test(decoded);
}
