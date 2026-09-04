/**
 * Takt — die **eine** Verbindung nach außen (A-18.2, A-18.3, A-18.11, A-18.12,
 * E-001, E-064, E-066 Punkt 2, R-19, VG-10).
 *
 * ===========================================================================
 * Was diese Datei ist
 * ===========================================================================
 *
 * Bis heute galt der stärkste einzelne Satz dieses Entwurfs: Takt kennt keine
 * Adresse außerhalb von `127.0.0.1`. Er gilt weiter, mit **einer** benannten
 * Ausnahme, und diese Datei ist ihr Ort. Wer eine zweite Adresse einbaut, hebt
 * E-001 auf und braucht dafür eine Entscheidung, nicht eine Zeile Code.
 *
 * Sie **fragt und liest**, sonst nichts. Kein Herunterladen, kein Installieren,
 * kein Schreiben, kein Rumpf, keine Kennung. Aus der Antwort verlässt genau
 * **eine geprüfte Fassungsbezeichnung** diesen Ort (A-V-14); alles andere wird
 * verworfen, auch wenn es praktisch wäre.
 *
 * ===========================================================================
 * Die vier Zahlen und die drei Kopfzeilen — jede mit ihrem Grund
 * ===========================================================================
 *
 * Sie stehen in `docs/bedrohungsmodell.md` 18.5 und 18.6, gemessen auf Node
 * 22.23.2. Hier steht, was sie im Quelltext bedeuten.
 *
 * **`redirect: 'error'` (A-V-3).** Mit der Vorgabe `'follow'` folgt Node bis zu
 * zwanzig Weiterleitungen, ohne etwas zu melden — und damit ist die Adresse
 * „weder einstellbar noch aus einer Antwort übernehmbar" (A-18.3) über den
 * einen Weg verlegt, den man beim Lesen der Anforderung übersieht. Mit
 * `'manual'` läge die `location` lesbar vor, und die Zusage hinge daran, dass
 * niemand sie liest. Nur `'error'` ist eine Zusage: `fetch` wirft, die
 * `location` wird nie gelesen und nie angesteuert.
 *
 * **Eine Gesamtfrist von 5 000 ms (A-V-5).** Über `AbortSignal.timeout`, und
 * sie deckt Verbindung, Kopfzeilen **und** das Lesen des Rumpfes — eine
 * Antwort, die anfängt und nie endet, ist sonst ein Zeitgeber und eine
 * Verbindung auf Dauer. Die eingehende Frist des Dienstes liegt bei 15 000 ms;
 * die ausgehende muss deutlich darunter liegen, weil sie im Hintergrund läuft
 * und niemanden warten lässt.
 *
 * **65 536 Bytes des entpackten Stroms, beim Lesen gezählt (A-V-6).** Nicht aus
 * `content-length`: Eine Antwort mit `content-encoding: gzip` und
 * `content-length: 50989` ergab nach dem Auspacken **52 428 800 Bytes** im
 * Speicher — Faktor 1 028 (18.2, gemessen). Wer die Obergrenze aus
 * `content-length` liest, hat keine Obergrenze. Deshalb steht hier ein
 * Lesestrom und **kein** `response.json()`, `response.text()` oder
 * `response.arrayBuffer()`: Jedes von ihnen liest den Rumpf vollständig, bevor
 * irgendeine Grenze greifen kann.
 *
 * **Ein Feld (A-V-7).** Gelesen wird `tag_name`. `body` (die
 * Fassungsbeschreibung), `name`, `html_url`, `assets`, `author` und
 * `upload_url` werden **nicht** gelesen, nicht protokolliert, nicht
 * gespeichert und nicht weitergereicht. `html_url` ist dabei der gefährlichste
 * von allen: Eine Adresse aus einer Antwort an einen Öffnen-Befehl zu reichen
 * wäre dieselbe Bauart wie eine offene Weiterleitung — nur mit dem Browser des
 * Benutzers als Ziel (B-18.2).
 *
 * **Drei Kopfzeilen, und keine vierte (A-V-13).** `accept` und
 * `x-github-api-version` sind der Vertrag mit der Quelle. `user-agent: Takt`
 * ist die Kennung, die GitHub verlangt — **ohne Fassungsnummer**: Der Vergleich
 * der Fassungen findet auf diesem Rechner statt, die Adresse nennt den Bestand
 * ohnehin, und die installierte Fassung wäre genau die Angabe aus R-19 Punkt 3.
 * Was Node ohne Zutun mitschickt, trägt weder Benutzer noch Rechnernamen noch
 * Sprache (`accept-language` ist wörtlich `*`, gemessen in 18.6).
 *
 * **Und was hier nicht steht:** kein `dispatcher`, kein `Agent`, kein
 * `ProxyAgent`, keine eigene Zertifikatsprüfung (A-V-4). Was gegen einen
 * Angreifer im Netzweg schützt, ist nicht eine Auflage dieses Abschnitts,
 * sondern TLS — und das trägt nur, solange niemand daran dreht.
 */

import { checkVersion } from '@takt/domain';

/**
 * **Die** Adresse (A-V-1, A-18.3).
 *
 * Fest im Erzeugnis, nicht einstellbar: nicht aus einer Umgebungsvariablen,
 * nicht aus einer Einstellung, nicht aus der Datenbank, nicht aus einem
 * Argument der Befehlszeile und nicht zusammengesetzt aus einem gelesenen Wert.
 * `proof:release-safety` misst, dass sie im ganzen Baum **genau einmal**
 * vorkommt.
 *
 * `api.github.com/…/releases/latest` und nicht `github.com/…/releases/latest`
 * (E-066 Punkt 2): Die HTML-Seite antwortet mit `302` auf die Seite des
 * Etiketts und wäre unter `redirect: 'error'` nie benutzbar. Die
 * maschinenlesbare Quelle antwortet unmittelbar, liefert `tag_name`, schließt
 * Entwürfe und Vorabfassungen von sich aus aus — was A-18.2 („veröffentlichte
 * Fassung") genau trifft — und macht „es gibt keine Veröffentlichung" zu einem
 * klaren 404 und damit zu einem stillen Fall.
 */
const RELEASE_ENDPOINT = 'https://api.github.com/repos/KuyomieKurama/SuperTakt/releases/latest';

/**
 * **Das** Feld, das aus der Antwort gelesen wird (A-V-7).
 *
 * Als Konstante und nicht zweimal als Zeichenkette ausgeschrieben: Der Name
 * steht damit im ganzen Baum **einmal**, und `proof:release-safety` kann daran
 * genau messen, daß es bei einem Feld bleibt. Zwei Schreibweisen desselben
 * Namens wären zwei Zugriffe, von denen nur einer gezählt würde.
 */
const TAG_FIELD = 'tag_name';

/** Gesamtfrist über Verbindung, Kopfzeilen und Rumpf (A-V-5). */
export const VERSION_CHECK_TIMEOUT_MS = 5_000;

/**
 * Obergrenze des **entpackten** Stroms (A-V-6).
 *
 * Die echte Antwort dieses Bestands liegt bei rund 15 KiB; 64 KiB geben das
 * Vierfache. Die Zahl gilt für gelesene Bytes, nicht für angekündigte.
 */
export const VERSION_CHECK_MAX_BYTES = 65_536;

/**
 * Warum eine Prüfung ohne Ergebnis geblieben ist (A-V-20).
 *
 * Ein **geschlossener** Vorrat technischer Schlüssel. Genau diese Werte gehen
 * ins Protokoll — nie ein Ausschnitt der Antwort, nie die Meldung des Wurfs,
 * nie eine Adresse aus einer `location`-Kopfzeile. Der Grund ist derselbe wie
 * bei den Startabbrüchen aus T-132: Ein abgewiesener Wert in einer Meldung
 * dreht die Protokollzeile um, die vom Angriff berichtet (B-2.4).
 *
 *   `unreachable`  Keine Verbindung, Namensauflösung gescheitert, TLS
 *                  abgelehnt, Verbindung abgebrochen.
 *   `timeout`      Die Gesamtfrist ist abgelaufen — auch beim Rumpf.
 *   `redirect`     Die Antwort war eine Weiterleitung. Ihr Ziel wurde weder
 *                  gelesen noch angesteuert.
 *   `status`       Ein Statuscode, mit dem sich nichts anfangen lässt — etwa
 *                  `403`, wenn die Anfragebegrenzung von GitHub erschöpft ist
 *                  (T-136-5: 60 Anfragen je Stunde und **Quelladresse**, in
 *                  einem Haus geteilt).
 *   `no_release`   `404` — es gibt keine Veröffentlichung. Ein klarer Fall und
 *                  kein Fehler.
 *   `too_large`    Die Obergrenze wurde beim Lesen erreicht. Der bis dahin
 *                  gelesene Teil wird verworfen und **nicht** geparst.
 *   `malformed`    Kein JSON, ein leerer Rumpf, kein Objekt, kein `tag_name`,
 *                  oder eine Fassungsangabe, die keine ist.
 *   `aborted`      Der Dienst hält an. Kein Fehlschlag, sondern ein Ende.
 */
export type ReleaseLookupFailure =
  | 'unreachable'
  | 'timeout'
  | 'redirect'
  | 'status'
  | 'no_release'
  | 'too_large'
  | 'malformed'
  | 'aborted';

/**
 * Das Ergebnis einer Abfrage.
 *
 * Im Erfolgsfall **eine geprüfte Fassungsbezeichnung ohne führendes `v`** und
 * sonst nichts (A-V-14). Kein Verweis, keine Beschreibung, kein Zeitpunkt, kein
 * Name — was hier nicht steht, kann auch nicht versehentlich in die Oberfläche
 * oder in eine Adresse geraten.
 *
 * `statusCode` steht ausschließlich am Fehlschlag `status` und ist eine Zahl
 * zwischen 100 und 599. Sie ist kein Ausschnitt der Antwort, sondern ihre
 * Einordnung, und sie unterscheidet im Protokoll die erschöpfte
 * Anfragebegrenzung (`403`) von einer Störung bei GitHub (`5xx`).
 */
export type ReleaseLookup =
  | { readonly ok: true; readonly version: string }
  | { readonly ok: false; readonly reason: ReleaseLookupFailure; readonly statusCode?: number };

/**
 * Woher die zuletzt veröffentlichte Fassung kommt.
 *
 * **Ein Port, und das ist die prüfbare Naht** (E-066 Punkt 1). „Einstellbar"
 * heißt: von außerhalb des Prozesses veränderbar — keine Route, keine
 * Einstellung, keine Umgebungsvariable, kein Argument, keine Datei daneben,
 * keine Antwort, keine Weiterleitung. Dass der **Zusammenbau im selben
 * Prozess** eine andere Abholfunktion einsetzen kann, ist dagegen die Bauform
 * dieses Bestands: `compose()` nimmt Ports, der Adapter ist austauschbar, und
 * der Prüflauf baut sich seinen eigenen Zusammenbau.
 *
 * Die Bedingung, ohne die das nicht gilt, ist `proof:release-safety`: Es misst,
 * dass im ausgelieferten Zusammenbau **kein** Weg zu einer anderen Adresse
 * führt. Ohne diesen Nachweis wäre die Naht ein Schalter, den nur noch niemand
 * gefunden hat.
 */
export interface ReleaseSourcePort {
  /**
   * Fragt einmal. Wirft nicht — jeder Ausgang ist ein benannter Wert.
   *
   * @param signal wird vom Anhalten des Dienstes ausgelöst (A-V-12). Die
   *   Gesamtfrist kommt aus dieser Datei und nicht vom Aufrufer: Sie ist eine
   *   Eigenschaft der Verbindung, nicht des Anlasses.
   */
  latest(signal: AbortSignal): Promise<ReleaseLookup>;
}

/**
 * Die **Naht**, und zwar an der Stelle, an der E-066 Punkt 1 sie zieht:
 * „die Naht ist die Abholfunktion, nicht die Zeichenkette."
 *
 * Ohne Angabe das globale `fetch`. Ein Prüflauf setzt hier seine eigene
 * Funktion ein und lenkt sie auf einen lokalen Prüfserver — und zwar **mit
 * denselben Optionen**: `redirect: 'error'`, dieselbe Frist, derselbe
 * Lesestrom. Damit sind Weiterleitung, Zeitüberschreitung, Obergrenze und
 * Auswertung an echtem Verhalten prüfbar (TP-VER-01 bis -07, -25, -26), ohne
 * daß die **Adresse** von außen verlegbar wäre. Die Adresse bleibt eine
 * Festlegung im Erzeugnis mit genau einem Ort, und `proof:release-safety`
 * mißt das.
 *
 * Der Parameter ist von außerhalb des Prozesses nicht erreichbar: keine Route,
 * keine Einstellung, keine Umgebungsvariable, kein Argument.
 */
export interface GithubReleaseSourceOptions {
  readonly fetch?: typeof fetch;
}

/**
 * Die Abholfunktion, die im ausgelieferten Erzeugnis hängt.
 *
 * `fetch` ist global und kommt aus der Laufzeit (Node ≥ 22.5, im
 * Auslieferungsablauf auf 22.23.2 festgenagelt). **Keine neue Abhängigkeit**
 * (B-18.7): kein `node-fetch`, kein `axios`, kein `got`, kein `undici` als
 * unmittelbare Abhängigkeit — und keine Bibliothek für die Ordnung der
 * Fassungen; die liegt als Fachlogik in `packages/domain`, wo sie ohne Netz
 * und ohne Paket prüfbar ist.
 */
export function createGithubReleaseSource(options: GithubReleaseSourceOptions = {}): ReleaseSourcePort {
  const call = options.fetch ?? fetch;

  return {
    async latest(signal: AbortSignal): Promise<ReleaseLookup> {
      // Eine Frist für alles. `AbortSignal.any` verbindet sie mit dem Anhalten
      // des Dienstes: Was zuerst kommt, bricht ab, und der Grund bleibt
      // unterscheidbar, weil beide Signale mit verschiedenen Gründen abbrechen.
      const deadline = AbortSignal.timeout(VERSION_CHECK_TIMEOUT_MS);
      const combined = AbortSignal.any([signal, deadline]);

      let response: Response;
      try {
        response = await call(RELEASE_ENDPOINT, {
          method: 'GET',
          // Kein Rumpf, kein Abfrageparameter, kein `authorization`, kein
          // `cookie`, keine Kennung der Installation (A-V-2, A-V-13).
          headers: {
            accept: 'application/vnd.github+json',
            'x-github-api-version': '2022-11-28',
            'user-agent': 'Takt',
          },
          redirect: 'error',
          signal: combined,
        });
      } catch (error) {
        return { ok: false, reason: classifyNetworkError(error, signal) };
      }

      // Der Statuscode zuerst. Ein Rumpf, den man ohnehin verwirft, wird nicht
      // gelesen — und `404` ist der stille Fall aus A-18.11 und keine Störung.
      if (response.status === 404) {
        await discard(response);
        return { ok: false, reason: 'no_release' };
      }
      if (!response.ok) {
        await discard(response);
        return { ok: false, reason: 'status', statusCode: response.status };
      }

      const read = await readBounded(response, signal);
      if (!read.ok) return read;

      return { ok: true, version: read.version };
    },
  };
}

/**
 * Liest den Rumpf **strombasiert** und zählt dabei die entpackten Bytes
 * (A-V-6).
 *
 * Hier steht bewusst kein `response.json()`. Es ist die einfachste falsche
 * Lösung: Es liest den Rumpf vollständig, bevor irgendeine Grenze greifen kann,
 * und eine Prüfung von `content-length` hilft dagegen nicht.
 */
async function readBounded(
  response: Response,
  shutdown: AbortSignal,
): Promise<{ ok: true; version: string } | { ok: false; reason: ReleaseLookupFailure }> {
  const body = response.body;
  if (body === null) return { ok: false, reason: 'malformed' };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    for (;;) {
      const step = await reader.read();
      if (step.done) break;
      size += step.value.byteLength;
      if (size > VERSION_CHECK_MAX_BYTES) {
        // Abbrechen und **verwerfen**. Ein halbes JSON ist keine Antwort, und
        // es wird gar nicht erst geparst.
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: 'too_large' };
      }
      chunks.push(step.value);
    }
  } catch (error) {
    return { ok: false, reason: classifyNetworkError(error, shutdown) };
  }

  if (size === 0) return { ok: false, reason: 'malformed' };

  // `fatal: false`: Ein ungültiges Byte wird zu U+FFFD und lässt `JSON.parse`
  // scheitern — ein Wurf beim Dekodieren wäre derselbe Ausgang auf einem
  // umständlicheren Weg.
  const text = new TextDecoder('utf-8').decode(concat(chunks, size));

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Gemessen (18.2): Tief verschachteltes JSON wirft `SyntaxError`. Der Wurf
    // ist kein Schutz, sondern eine Pflicht — er muss gefangen werden, sonst
    // ist die unerwartete Antwort aus A-18.11 ein Absturz statt eines stillen
    // Fehlschlags.
    return { ok: false, reason: 'malformed' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: 'malformed' };
  }

  /*
   * **Der eine Feldzugriff im ganzen Dienst** (A-V-7).
   *
   * `Object.hasOwn` und danach der Zugriff: Ein `tag_name` aus der
   * Prototypenkette — etwa über `__proto__` in der Antwort — ist kein Feld
   * dieser Antwort. Die Fassung selbst wird anschließend von der Domäne
   * geprüft; `checkVersion` nimmt `unknown` entgegen, weil hier eine fremde
   * JSON-Antwort steht und ein Typ am Rand eine Behauptung wäre.
   */
  const raw: unknown = Object.hasOwn(parsed, TAG_FIELD)
    ? (parsed as Record<string, unknown>)[TAG_FIELD]
    : undefined;

  const version = checkVersion(raw);
  if (!version.ok) return { ok: false, reason: 'malformed' };

  return { ok: true, version: version.version.value };
}

/**
 * Verwirft einen Rumpf, den niemand liest.
 *
 * Ohne diesen Schritt bliebe die Verbindung bis zum Einsammeln durch die
 * Laufzeit offen. `catch`, weil ein Abbruch beim Verwerfen nichts ändert: Der
 * Ausgang steht bereits fest.
 */
async function discard(response: Response): Promise<void> {
  await response.body?.cancel().catch(() => undefined);
}

function concat(chunks: readonly Uint8Array[], size: number): Uint8Array {
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return all;
}

/**
 * Ordnet einen Wurf in den geschlossenen Vorrat ein — **ohne** seine Meldung zu
 * lesen und ohne sie weiterzureichen (A-V-20).
 *
 * Unterschieden wird an dem, was die Laufzeit selbst benennt:
 *
 *  - Das Anhalten des Dienstes hat sein eigenes Signal; danach wird gefragt,
 *    bevor irgendetwas anderes gedeutet wird.
 *  - `TimeoutError` ist der Name, mit dem `AbortSignal.timeout` abbricht.
 *  - Eine Weiterleitung wirft einen `TypeError` mit einem `cause`. Geprüft wird
 *    dessen `name`/`message` auf das Wort, mit dem die Laufzeit sie benennt —
 *    ein Vergleich gegen einen **festen** Text, aus dem nichts in eine Meldung
 *    übernommen wird.
 *
 * Alles Übrige ist `unreachable`. Das ist die richtige Vergröberung: Ob die
 * Namensauflösung, das Zertifikat oder die Leitung scheiterte, ändert nichts an
 * dem, was Takt tut — nämlich nichts (A-18.11).
 */
function classifyNetworkError(error: unknown, shutdown: AbortSignal): ReleaseLookupFailure {
  if (shutdown.aborted) return 'aborted';
  if (isNamed(error, 'TimeoutError')) return 'timeout';
  if (isNamed(error, 'AbortError')) return 'aborted';
  if (mentionsRedirect(error)) return 'redirect';
  return 'unreachable';
}

function isNamed(error: unknown, name: string): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === name;
}

/**
 * Hat die Laufzeit diesen Wurf als Weiterleitung benannt?
 *
 * `fetch` wirft bei `redirect: 'error'` einen `TypeError` mit
 * `cause: Error: unexpected redirect` (18.4, gemessen). Gelesen wird
 * ausschließlich, **ob** dieses Wort vorkommt; der Text selbst geht nirgendwo
 * hin. Trifft die Prüfung eines Tages nicht mehr, ist der Ausgang
 * `unreachable` — ebenfalls still, ebenfalls ohne zweiten Versuch, nur mit
 * einem gröberen Schlüssel im Protokoll.
 */
function mentionsRedirect(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const cause = (error as { cause?: unknown }).cause;
  const message = typeof cause === 'object' && cause !== null ? (cause as { message?: unknown }).message : undefined;
  return typeof message === 'string' && message.includes('redirect');
}
