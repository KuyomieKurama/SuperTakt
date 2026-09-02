/**
 * Takt — welcher Nachweis für welchen Pfad genügt (B-2.10, T-034).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Datei existiert
 * ---------------------------------------------------------------------------
 *
 * Bis T-034 stand die Anforderung an **drei** Routen ausgeschrieben
 * (`GET /token`, `POST /token`, `GET /security/notices`) und an allen übrigen
 * sechzig nicht. Die Vorgabe lautete damit „offen, drei Ausnahmen". Der
 * security-checker hat in T-023 gemessen, wohin das führt: Ein Add-in-Token —
 * das **dauerhafte** Geheimnis, das der Benutzer von Hand in Outlook einträgt
 * und das im `localStorage` liegt (E-009, E-019, R-09) — las den internen
 * Vermerk im Klartext, überschrieb ihn, setzte den Exportordner und löste einen
 * Exportlauf dorthin aus.
 *
 * Der Fehler war nicht, dass jemand eine Route vergessen hätte. Der Fehler war
 * die **Richtung**: Eine Positivliste, in der man etwas vergessen kann,
 * vergisst irgendwann etwas. Das ist wörtlich dasselbe Argument, mit dem
 * B-1.1 Punkt 1 die Kette als **eine** Middleware vor **allen** Routen begründet
 * statt als Prüfung je Route.
 *
 * Also andersherum: **Alles verlangt `session`.** Abgesenkt wird an genau zwei
 * ausgeschriebenen Stellen — dem Teilbaum `/api/v1/addin` und der einen
 * benannten Ausnahme in {@link SHARED_PATHS}. Eine künftig hinzugefügte
 * Fachroute ist damit von selbst geschlossen: Sie steht nirgends in einer
 * Liste, sie muss nirgends eingetragen werden, und wer sie öffnen will, muss
 * diese Datei anfassen.
 *
 * ---------------------------------------------------------------------------
 * Die Entscheidung fällt auf **derselben** Zeichenkette wie das Routing
 * ---------------------------------------------------------------------------
 *
 * `Hono.dispatch` berechnet den Pfad **einmal** (`getPath`) und übergibt
 * dieselbe Zeichenkette an `router.match(...)` **und** an `HonoRequest`, wo sie
 * als `c.req.path` erscheint. Der Aufrufer dieser Funktion reicht genau diesen
 * Wert herein.
 *
 * Das ist die tragende Eigenschaft und kein Zufall: Solange Vergleich und
 * Routing auf derselben Zeichenkette arbeiten, kann keine Anfrage die Prüfung
 * für `/addin` bestehen und danach bei einer Fachroute landen. Eine eigene
 * Normalisierung wäre genau die zweite Meinung, aus der solche Lücken
 * entstehen — deshalb steht hier keine.
 *
 * Zwei Fälle, die daraus folgen und beide **zu** sind:
 *
 * - `/api/v1/addin/../todos` — der Adaptor-Server erkennt Punktsegmente und
 *   schickt die Adresse durch den URL-Parser; Router und Prüfung sehen
 *   `/api/v1/todos`, also `session`. Für den Fall, dass ein Transport das
 *   einmal **nicht** täte, senkt {@link requiredCredentialForPath} die
 *   Anforderung bei einem Punktsegment gar nicht erst — siehe unten.
 * - `/api/v1/addin%2f../todos` — `%2f` ist kein Trennzeichen, der Pfad bleibt
 *   wörtlich stehen. Das Präfix `/api/v1/addin/` passt nicht (es steht
 *   `addin%2f` da), also `session` — und der Router findet ohnehin nichts.
 *
 * Rein und ohne laufenden Dienst prüfbar: eine Zeichenkette herein, eine
 * Anforderung heraus.
 */

import { API_BASE_PATH } from '../config.ts';
import type { RequiredCredential } from './verifier.ts';

/**
 * Der **einzige** Teilbaum, den ein Add-in-Token erreicht (T-019, B-2.9 Punkt 3).
 *
 * Vier Routen: Baum und Vorbelegungen lesen, nach einer Call-Nummer suchen, ein
 * Todo anlegen, eine Zeit buchen. Kein Löschen, kein Export, kein Zugriff auf
 * den Vermerk, keine Einstellungen.
 */
export const ADDIN_PATH_PREFIX = `${API_BASE_PATH}/addin` as const;

/**
 * Die **eine** Route außerhalb von `/addin`, die ein Add-in-Token erreicht.
 *
 * `GET /health` ist „Verbindung prüfen" in S-13 — der Knopf, mit dem der
 * Benutzer nachsieht, ob das gerade von Hand eingetragene Token stimmt
 * (`apps/outlook-addin/src/api/client.ts`, dort ausdrücklich so benannt). Ohne
 * sie könnte das Add-in seine Einrichtung nur noch prüfen, indem es einen
 * fachlichen Aufruf absetzt und dessen Fehlschlag deutet.
 *
 * Warum sie vertretbar ist, und zwar in dieser Reihenfolge:
 *
 * 1. Sie **gibt nichts heraus**: `{"data":{"status":"ok"}}`, kein Pfad, kein
 *    Benutzername, keine Bestandsgröße.
 * 2. Sie **ändert nichts**.
 * 3. Sie liegt weiterhin **hinter** dem Nachweis: Ohne Token 401. Ein Angreifer
 *    ohne Token erfährt nach wie vor nicht, dass Takt läuft.
 *
 * **Sie ist trotzdem eine Ausnahme, und Ausnahmen wachsen.** Deshalb steht hier
 * eine Menge exakter Pfade und kein zweites Präfix: Ein Präfix lädt dazu ein,
 * „noch eben" etwas darunter zu hängen. Wer diese Menge erweitern will, muss
 * begründen, warum die neue Route die drei Punkte oben erfüllt.
 *
 * Die saubere Form wäre eine eigene Route `GET /addin/health` und ein Add-in,
 * das sie benutzt. Das ginge nicht ohne Änderungen an `routes/addin/**` und an
 * `apps/outlook-addin/**` — beides in fremder Hoheit; als offene Frage im
 * Bericht zu T-034 vermerkt.
 */
export const SHARED_PATHS: ReadonlySet<string> = new Set([`${API_BASE_PATH}/health`]);

/**
 * Welche Sorte Nachweis ein Pfad verlangt.
 *
 * @param path der Pfad, den Hono zum Routen benutzt (`c.req.path`) — **nicht**
 *   die rohe Adresse und nicht ein selbst zusammengesetzter Wert.
 * @returns `'any'` innerhalb von {@link ADDIN_PATH_PREFIX} und für die Pfade in
 *   {@link SHARED_PATHS}, sonst `'session'`. Ein unbekannter Pfad fällt in den
 *   `session`-Zweig: Ein Add-in-Token bekommt dort 401 statt 404 und erfährt
 *   damit nicht einmal, welche Routen es für jemand anderen gibt.
 */
export function requiredCredentialForPath(path: string): RequiredCredential {
  // Ein Pfad mit einem Punktsegment wird **nicht** abgesenkt. Nicht, weil er
  // hier je ankäme — der Adaptor-Server löst ihn vorher auf —, sondern weil
  // eine Absenkung eine Zusage ist und diese Zeichenkette zwei Lesarten hat.
  // Es wird hier ausdrücklich **nicht** normalisiert: Eine zweite Meinung über
  // die Gestalt des Pfades wäre genau die Abweichung zwischen Prüfung und
  // Routing, aus der solche Lücken entstehen. Abgelehnt wird die Ausnahme,
  // nicht der Pfad — was er ist, entscheidet weiterhin allein der Router.
  if (hasDotSegment(path)) return 'session';

  // Die eine benannte Ausnahme, wörtlich verglichen (Begründung oben).
  if (SHARED_PATHS.has(path)) return 'any';

  // Genau der Teilbaum, nichts daneben: `/…/addin` selbst und alles unter
  // `/…/addin/`. Ein Präfixvergleich ohne das Trennzeichen ließe
  // `/api/v1/addintern` durch — dieselbe Falle, die B-5.1 Punkt 3 für Pfade im
  // Dateisystem beschreibt.
  return path === ADDIN_PATH_PREFIX || path.startsWith(`${ADDIN_PATH_PREFIX}/`)
    ? 'any'
    : 'session';
}

/**
 * Die Schreibweisen, die der URL-Standard als „single-dot" und „double-dot
 * path segment" führt — einschließlich der prozentkodierten Formen.
 */
const DOT_SEGMENTS: ReadonlySet<string> = new Set(['.', '%2e', '..', '.%2e', '%2e.', '%2e%2e']);

function hasDotSegment(path: string): boolean {
  for (const segment of path.split('/')) {
    if (DOT_SEGMENTS.has(segment.toLowerCase())) return true;
  }
  return false;
}
