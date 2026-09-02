/**
 * Takt — Auslieferung des Aufgabenbereichs über HTTPS (E-046).
 *
 * ===========================================================================
 * Was dieser Port ist und was er ausdrücklich nicht ist
 * ===========================================================================
 *
 * Er liefert **statische Dateien**, sonst nichts. Kein JSON, kein Zugriff auf
 * die Datenbank, keine Route, die etwas ändert. Die API bleibt auf 17843 mit
 * ihrer Prüfschicht aus T-011; dieser Port hat keine und braucht keine: Was er
 * ausliefert, ist das Bündel des Add-ins, und das steht ohnehin auf jedem
 * Rechner, auf dem das Add-in installiert ist.
 *
 * Er bindet auf **127.0.0.1**, wie der Dienst (B-1.1). Ein Aufgabenbereich, der
 * im Netz erreichbar wäre, hätte denselben Fehler wie ein Dienst, der es wäre.
 *
 * ---------------------------------------------------------------------------
 * Warum der Dienst das übernimmt und nicht die Hülle
 * ---------------------------------------------------------------------------
 *
 * E-046: Der Dienst läuft ohnehin, kennt das Anwendungsdatenverzeichnis mit
 * seinen engen Rechten und hat die Prüfschicht schon. Ein zweiter Prozess nur
 * für statische Dateien wäre eine weitere Lebenszyklusfrage und eine weitere
 * Stelle, an der etwas verwaisen kann. Die Hülle scheidet aus, weil der
 * Aufgabenbereich auch dann erreichbar sein muss, wenn Takt als Fenster
 * geschlossen, der Dienst aber noch da ist.
 *
 * ---------------------------------------------------------------------------
 * Pfadauflösung: eine Wurzel, und keinen Schritt darüber hinaus
 * ---------------------------------------------------------------------------
 *
 * Jeder angefragte Pfad wird aufgelöst und gegen die Wurzel verglichen. `..`,
 * kodierte Trenner und absolute Pfade führen nirgends hinaus. Das ist dieselbe
 * Maßnahme wie beim Exportordner (R-11) — nur dass hier gelesen statt
 * geschrieben wird, und die Wurzel ein Bündel und kein Kundendatenordner ist.
 */

import { createServer } from 'node:https';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BIND_ADDRESS } from '../config.ts';
import { taskpaneCertPath, taskpaneKeyPath } from '../access/paths.ts';
import { loadOrCreateCertificate } from './certificate.ts';
import type { Logger } from '../logger.ts';

export interface TaskpaneOptions {
  readonly appDataDir: string;
  readonly port: number;
  readonly logger: Logger;
  /** Wurzel der auszuliefernden Dateien. Ohne Angabe wird sie gesucht. */
  readonly root?: string;
}

export interface TaskpaneServer {
  readonly port: number;
  readonly root: string;
  close(): void;
}

/**
 * Nur diese Endungen werden ausgeliefert.
 *
 * Eine Positivliste und keine Sperrliste: Was hier nicht steht, geht nicht
 * hinaus. Eine versehentlich im Bündelordner liegende `.pem`, `.db` oder
 * `.env` wäre sonst über HTTPS abrufbar.
 */
const CONTENT_TYPES: Readonly<Record<string, string>> = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
});

/**
 * Orte, an denen das Bündel des Aufgabenbereichs liegen kann.
 *
 * Im Auslieferungsbau liegt es neben der Binärdatei, im Entwicklungsbetrieb im
 * `dist` des Add-in-Pakets. Gesucht wird in dieser Reihenfolge, und der erste
 * vorhandene gewinnt — geraten wird nichts: Findet sich keiner, startet der
 * Port gar nicht.
 *
 * ---------------------------------------------------------------------------
 * Warum der zweite Ort nur manchmal überhaupt entsteht (T-053)
 * ---------------------------------------------------------------------------
 *
 * Er wird aus `import.meta.url` abgeleitet, also aus der Frage „wo liegt der
 * Quelltext, der gerade läuft". Diese Frage hat im gebündelten Sidecar keine
 * Antwort: esbuild übersetzt nach CommonJS und ersetzt `import.meta` durch ein
 * leeres Objekt. `new URL('.', undefined)` warf dort `TypeError: Invalid URL` —
 * eine Ausnahme aus der reinen Wegsuche, die den ganzen Dienststart mitnahm.
 *
 * Der erste Ort ist von diesem Wissen unabhängig: `process.execPath` gibt es in
 * beiden Betriebsarten, und in der Auslieferung zeigt er auf genau die
 * Binärdatei, neben der das Bündel liegt. Der zweite ist der
 * Entwicklungskomfort — und Komfort darf nicht den Start kosten.
 */
function candidateRoots(): readonly string[] {
  const roots = [
    // Neben der gebündelten Binärdatei (Auslieferung). Gilt immer.
    resolve(process.execPath, '..', 'taskpane'),
  ];

  const here = sourceDirectory();
  if (here !== null) {
    // Im Arbeitsbereich (Entwicklung).
    roots.push(resolve(here, '..', '..', '..', 'outlook-addin', 'dist'));
  }

  return roots;
}

/** Der Ordner dieser Quelldatei, oder `null` im Bündel. Siehe oben. */
function sourceDirectory(): string | null {
  // Der Typ sagt `string`, die Laufzeit im CommonJS-Bündel sagt `undefined`.
  // Deshalb die Prüfung und nicht nur ein `try`.
  const base: string | undefined = import.meta.url;
  if (typeof base !== 'string' || base === '') return null;
  try {
    return fileURLToPath(new URL('.', base));
  } catch {
    return null;
  }
}

async function findRoot(preferred?: string): Promise<string | null> {
  const candidates = preferred === undefined ? candidateRoots() : [preferred, ...candidateRoots()];
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) return candidate;
    } catch {
      /* nächster Kandidat */
    }
  }
  return null;
}

/**
 * Startet den Aufgabenbereich-Port.
 *
 * Liefert `null`, wenn kein Bündel gefunden wurde oder der Port belegt ist.
 * **Das ist kein Abbruchgrund für den Dienst**: Ohne Aufgabenbereich ist das
 * Add-in nicht benutzbar, die Anwendung selbst schon. Ein Abbruch wäre die
 * falsche Antwort auf ein fehlendes Bündel.
 */
export async function startTaskpaneServer(
  options: TaskpaneOptions,
): Promise<TaskpaneServer | null> {
  const root = await findRoot(options.root);
  if (root === null) {
    options.logger.lifecycle(
      'info',
      'Der Aufgabenbereich des Add-ins wird nicht ausgeliefert: Es liegt kein Bündel vor.',
    );
    return null;
  }

  const certificate = await loadOrCreateCertificate(
    taskpaneKeyPath(options.appDataDir),
    taskpaneCertPath(options.appDataDir),
  );

  if (certificate.source !== 'loaded') {
    options.logger.lifecycle(
      'info',
      certificate.source === 'created'
        ? 'Ein Zertifikat für den Aufgabenbereich wurde erzeugt. Outlook fragt beim ersten Öffnen einmalig nach.'
        : 'Das Zertifikat für den Aufgabenbereich lief ab und wurde erneuert. Outlook fragt einmalig erneut nach.',
    );
  }

  const server = createServer({ key: certificate.keyPem, cert: certificate.certPem });

  server.on('request', (request, response) => {
    void serve(root, request.url ?? '/', response);
  });

  return await new Promise<TaskpaneServer | null>((done) => {
    server.on('error', () => {
      // Belegter Port oder fehlende Berechtigung. Der Dienst läuft weiter.
      options.logger.lifecycle(
        'warn',
        `Der Aufgabenbereich konnte auf Port ${options.port} nicht bereitgestellt werden.`,
      );
      done(null);
    });

    server.listen({ host: BIND_ADDRESS, port: options.port, exclusive: true }, () => {
      options.logger.lifecycle(
        'info',
        `Der Aufgabenbereich des Add-ins liegt unter https://localhost:${options.port}.`,
      );
      done({
        port: options.port,
        root,
        close: () => {
          server.close();
        },
      });
    });
  });
}

/** Eine Anfrage beantworten. Lesend, aus einer Wurzel, mit fester Liste von Typen. */
async function serve(
  root: string,
  url: string,
  response: import('node:http').ServerResponse,
): Promise<void> {
  const headers: Record<string, string> = {
    // Dieselben Kopfzeilen wie auf der API, soweit sie hier Sinn ergeben.
    // `frame-ancestors` steht bewusst **nicht** auf `none`: Der
    // Aufgabenbereich wird von Outlook eingebettet, das ist sein Zweck. Die
    // erlaubten Einbetter stehen in der CSP der `index.html` des Add-ins.
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
  };

  const requested = decodePath(url);
  if (requested === null) {
    response.writeHead(400, headers).end();
    return;
  }

  const target = resolve(root, `.${normalize(requested)}`);

  // Die eine Prüfung, die zählt: nichts außerhalb der Wurzel.
  if (target !== root && !target.startsWith(root + sep)) {
    response.writeHead(403, headers).end();
    return;
  }

  const file = await resolveFile(target);
  if (file === null) {
    // Ein Aufgabenbereich ist eine einzelne Seite. Unbekannte Pfade auf
    // `index.html` zu leiten wäre bequem — und würde jeden Tippfehler in einer
    // Skriptadresse als HTML ausliefern, das der Browser dann nicht ausführen
    // kann und dessen Fehlermeldung niemand versteht. Deshalb: 404.
    response.writeHead(404, headers).end();
    return;
  }

  const type = CONTENT_TYPES[extname(file).toLowerCase()];
  if (type === undefined) {
    response.writeHead(403, headers).end();
    return;
  }

  response.writeHead(200, { ...headers, 'Content-Type': type });
  createReadStream(file).pipe(response);
}

function decodePath(url: string): string | null {
  try {
    const path = decodeURIComponent(url.split('?')[0] ?? '/');
    // Ein kodierter Trenner nach dem Dekodieren ist ein Versuch, an der
    // Auflösung vorbeizukommen. Er wird abgewiesen und nicht repariert.
    return path.includes('\0') ? null : path;
  } catch {
    return null;
  }
}

async function resolveFile(target: string): Promise<string | null> {
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      const index = join(target, 'index.html');
      const indexInfo = await stat(index);
      return indexInfo.isFile() ? index : null;
    }
    return info.isFile() ? target : null;
  } catch {
    return null;
  }
}
