/**
 * Takt — E2E-Nachbildung der GitHub-Releases-Antwort (T-142, `docs/testplan.md`
 * Abschnitt 24, „Die zweite Lücke").
 *
 * Vergleichbare Bauart wie `support/shell-shim.ts`, nur auf Netzwerkebene statt
 * auf `__TAURI_INTERNALS__`-Ebene: ein echter `http.createServer()`, dessen
 * Antwort sich **während des laufenden Testfalls** umstellen lässt — `setJson`
 * ändert nur, was der **nächste** eingehende Aufruf bekommt, der Server selbst
 * bleibt derselbe Prozess über den gesamten Lauf einer Testdatei. Das ist die
 * Bedingung für `TP-VER-11`/`-12`: Der lokale Dienst (aus
 * `version-check-entry.ts`) wird zwischen den Stufen **neu gestartet**, die
 * Attrappe nicht — sonst prüfte ein Neustart der Attrappe zusätzlich etwas, das
 * niemand verlangt hat.
 *
 * `apps/local-api/test/version/support/http-stub.ts` (T-140) ist die Vorlage
 * dieser Bauart; eine eigene Kopie hier, weil `apps/local-api/test/**` der
 * Hoheit des unit-testers gehört und diese Datei — anders als dort — über
 * `setJson`/`setRedirect`/`setUnreachable` **während des Testlaufs**
 * umkonfigurierbar sein muss, nicht nur einmal beim Aufbau.
 *
 * Kein Framework, kein `nock`, keine neue Abhängigkeit — dieselbe
 * Zurückhaltung wie in `apps/local-api/src/version/source.ts` selbst (B-18.7).
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

export interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
}

export type StubHandler = (req: IncomingMessage, res: ServerResponse) => void;

export interface GithubReleasesStub {
  /** `http://127.0.0.1:<port>` — ohne Pfad. Ziel für den umgeleiteten `fetch` in `version-check-entry.ts`. */
  readonly url: string;
  /** Jede eingegangene Anfrage, in der Reihenfolge des Eintreffens — für `TP-VER-26`-artige Gegenproben. */
  readonly requests: RecordedRequest[];
  /** Ersetzt die Antwort für **jeden künftigen** Aufruf, bis zur nächsten Umstellung. */
  setHandler(handler: StubHandler): void;
  /** Bequemlichkeit für den Regelfall: `200 OK` mit `{"tag_name": "<tag>"}`. */
  setRelease(tag: string): void;
  /** `404 Not Found` — „es gibt keine Veröffentlichung" (A-18.11). */
  setNoRelease(): void;
  close(): Promise<void>;
}

function jsonHandler(status: number, body: unknown): StubHandler {
  return (_req, res) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };
}

/** Startet die Attrappe auf einem freien Port von `127.0.0.1`. */
export async function startGithubReleasesStub(): Promise<GithubReleasesStub> {
  const requests: RecordedRequest[] = [];
  let current: StubHandler = jsonHandler(404, { message: 'Not Found' });

  const server: Server = createServer((req, res) => {
    requests.push({ method: req.method ?? '', url: req.url ?? '', headers: { ...req.headers } });
    current(req, res);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Unerwartete Serveradresse der GitHub-Releases-Attrappe.');
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    setHandler(handler: StubHandler): void {
      current = handler;
    },
    setRelease(tag: string): void {
      current = jsonHandler(200, { tag_name: tag });
    },
    setNoRelease(): void {
      current = jsonHandler(404, { message: 'Not Found' });
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
