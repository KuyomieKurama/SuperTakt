/**
 * Takt — T-140, eine kleine Attrappe für die GitHub-Antwort.
 *
 * Vergleichbare Bauart wie `tests/e2e/support/shell-shim.ts`, nur auf
 * Netzwerkebene: ein `http.createServer()`, konfigurierbar über eine
 * mitgegebene Anfragebehandlung. Kein Framework, kein `nock`, keine neue
 * Abhängigkeit — dieselbe Zurückhaltung wie in `apps/local-api/src/version/
 * source.ts` selbst (B-18.7).
 *
 * `docs/testplan.md` Abschnitt 24 verlangt für die Netzfälle ausdrücklich eine
 * **echte** Gegenstelle: Frist, `redirect: 'error'`, Lesestrom und Auswertung
 * sollen echt laufen, nicht nachgestellt sein. Eine Attrappe mit gestubbtem
 * `fetch` würde genau das verfehlen — Node selbst müsste dann immer noch
 * entscheiden, was `redirect: 'error'` bedeutet und wie eine gzip-Antwort
 * entpackt wird, und niemand testete es.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

export interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
}

export interface HttpStub {
  /** `http://127.0.0.1:<port>` — ohne Pfad. */
  readonly url: string;
  /** Jede eingegangene Anfrage, in der Reihenfolge des Eintreffens. */
  readonly requests: RecordedRequest[];
  close(): Promise<void>;
}

export type StubHandler = (req: IncomingMessage, res: ServerResponse) => void;

/** Startet eine Attrappe auf einem freien Port von `127.0.0.1`. */
export async function startStub(handler: StubHandler): Promise<HttpStub> {
  const requests: RecordedRequest[] = [];
  const server: Server = createServer((req, res) => {
    requests.push({ method: req.method ?? '', url: req.url ?? '', headers: { ...req.headers } });
    handler(req, res);
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Unerwartete Serveradresse in der Prüfattrappe.');
  }
  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

/** Eine Attrappe, die niemals antwortet — bis der Aufrufer selbst aufgibt. */
export function neverResponds(): StubHandler {
  return (_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.write('{"a":'); // hält die Verbindung offen, ohne je zu enden
  };
}

/** Eine Attrappe mit fester Antwort. */
export function fixedResponse(
  status: number,
  body: string,
  headers: Record<string, string> = {},
): StubHandler {
  return (_req, res) => {
    res.writeHead(status, { 'content-type': 'application/json', ...headers });
    res.end(body);
  };
}
