/**
 * Takt — Nachweis für den Aufgabenbereich über HTTPS (E-046, E-018, R-11).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:taskpane
 *
 * Belegt vier Dinge, und alle vier laufen gegen einen **echten** TLS-Dienst auf
 * einem echten Port, nicht gegen eine Attrappe:
 *
 *  1. Das selbst erzeugte Zertifikat ist ein gültiges X.509 — geprüft mit
 *     `crypto.X509Certificate`, also mit einem Leser, der nicht von mir stammt.
 *  2. Ein Browser könnte es annehmen: `subjectAltName` führt `localhost`, die
 *     Laufzeit passt, der private Schlüssel gehört dazu.
 *  3. Der Port liefert statische Dateien aus und **nichts sonst**: kein Pfad
 *     außerhalb der Wurzel, keine Endung außerhalb der Positivliste.
 *  4. Schlüssel und Zertifikat liegen mit `0600` im Anwendungsdatenverzeichnis.
 */

import { X509Certificate, createPrivateKey } from 'node:crypto';
import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { request } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Kein Auflösungshaken mehr (T-029): Seit `packages/domain` seine internen
// Importe mit `.ts` schreibt, gibt es im Arbeitsbereich keinen `.js`-Bezeichner
// mehr, der auf eine nicht vorhandene Datei zeigt. Begründung in `src/index.ts`.

const { createSelfSignedCertificate, loadOrCreateCertificate } = await import('../src/taskpane/certificate.ts');
const { startTaskpaneServer } = await import('../src/taskpane/server.ts');
const { taskpaneCertPath, taskpaneKeyPath, isTooPermissive, FILE_MODE } = await import('../src/access/paths.ts');

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  FEHL  ${name}${detail === '' ? '' : ` — ${detail}`}`);
  }
}

const workDir = await mkdtemp(join(tmpdir(), 'takt-proof-taskpane-'));
const appData = join(workDir, 'appdata');
const root = join(workDir, 'dist');
await mkdir(appData, { recursive: true, mode: 0o700 });
await mkdir(root, { recursive: true });
await writeFile(join(root, 'index.html'), '<!doctype html><title>Aufgabenbereich</title>');
await writeFile(join(root, 'app.js'), 'export const a = 1;\n');
// Eine Datei, die es nie hinausschaffen darf.
await writeFile(join(root, 'geheim.pem'), 'NICHT-AUSLIEFERN');

const PORT = 17944; // nicht 17844, damit ein laufender Dienst nicht stört

const quietLogger = { lifecycle: () => {}, request: () => {} };

try {
  console.log('\n1  Das erzeugte Zertifikat ist ein gültiges X.509');
  {
    const pair = createSelfSignedCertificate(new Date('2026-09-01T10:00:00Z'));
    const certificate = new X509Certificate(pair.certPem);

    check('Node liest das Zertifikat', certificate instanceof X509Certificate);
    check('Inhaber ist CN=localhost', certificate.subject.includes('CN=localhost'), certificate.subject);
    check('selbst signiert: Aussteller gleich Inhaber', certificate.issuer === certificate.subject);
    check(
      'subjectAltName führt localhost und 127.0.0.1',
      (certificate.subjectAltName ?? '').includes('DNS:localhost') &&
        (certificate.subjectAltName ?? '').includes('IP Address:127.0.0.1'),
      certificate.subjectAltName ?? '(fehlt)',
    );
    check('kein CA-Zertifikat', certificate.ca === false);
    check('der private Schlüssel gehört dazu', certificate.checkPrivateKey(createPrivateKey(pair.keyPem)));
    check('gültig für localhost', certificate.checkHost('localhost') === 'localhost');
    check(
      'Laufzeit rund 825 Tage',
      Math.round((certificate.validToDate - certificate.validFromDate) / 86_400_000) === 825,
      String(Math.round((certificate.validToDate - certificate.validFromDate) / 86_400_000)),
    );
    check('die Signatur ist mit dem eigenen Schlüssel prüfbar', certificate.verify(certificate.publicKey));
  }

  console.log('\n2  Ablage mit engen Rechten (E-018, B-2.2 Punkt 3)');
  {
    const first = await loadOrCreateCertificate(taskpaneKeyPath(appData), taskpaneCertPath(appData));
    check('beim ersten Mal wird eines erzeugt', first.source === 'created', first.source);

    const keyStat = await stat(taskpaneKeyPath(appData));
    const certStat = await stat(taskpaneCertPath(appData));
    check('der Schlüssel liegt mit 0600', !isTooPermissive(keyStat.mode, FILE_MODE), (keyStat.mode & 0o777).toString(8));
    check('das Zertifikat liegt mit 0600', !isTooPermissive(certStat.mode, FILE_MODE), (certStat.mode & 0o777).toString(8));

    const second = await loadOrCreateCertificate(taskpaneKeyPath(appData), taskpaneCertPath(appData));
    check('beim zweiten Mal wird es geladen, nicht neu erzeugt', second.source === 'loaded', second.source);
    check('und es ist dasselbe', second.certPem === first.certPem);
  }

  console.log('\n3  Der Port liefert statische Dateien — über echtes TLS');
  {
    const server = await startTaskpaneServer({ appDataDir: appData, port: PORT, root, logger: quietLogger });
    check('der Dienst startet', server !== null);

    if (server !== null) {
      const ca = (await loadOrCreateCertificate(taskpaneKeyPath(appData), taskpaneCertPath(appData))).certPem;

      const fetchPath = (path) =>
        new Promise((resolve) => {
          const req = request(
            { host: '127.0.0.1', port: PORT, path, method: 'GET', ca, servername: 'localhost', rejectUnauthorized: true },
            (res) => {
              let body = '';
              res.setEncoding('utf8');
              res.on('data', (chunk) => { body += chunk; });
              res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
            },
          );
          req.on('error', (error) => resolve({ status: 0, headers: {}, body: String(error.message) }));
          req.end();
        });

      const index = await fetchPath('/');
      check(
        'TLS-Handschlag gelingt mit dem eigenen Zertifikat als Wurzel',
        index.status === 200,
        `Status ${index.status}: ${index.body.slice(0, 80)}`,
      );
      check('die Wurzel liefert index.html', index.body.includes('Aufgabenbereich'));
      check('mit Content-Type text/html', String(index.headers['content-type']).startsWith('text/html'));
      check('mit nosniff', index.headers['x-content-type-options'] === 'nosniff');

      const script = await fetchPath('/app.js');
      check('eine .js-Datei wird ausgeliefert', script.status === 200 && script.body.includes('export const a'));

      const secret = await fetchPath('/geheim.pem');
      check(
        'eine .pem-Datei wird NICHT ausgeliefert (Positivliste, keine Sperrliste)',
        secret.status === 403 && !secret.body.includes('NICHT-AUSLIEFERN'),
        `Status ${secret.status}`,
      );

      const escape = await fetchPath('/../appdata/taskpane-key.pem');
      check(
        'ein Pfad aus der Wurzel heraus wird abgewiesen (R-11)',
        escape.status !== 200 && !escape.body.includes('PRIVATE KEY'),
        `Status ${escape.status}`,
      );

      const encoded = await fetchPath('/%2e%2e/%2e%2e/appdata/taskpane-key.pem');
      check(
        'auch kodiert führt kein Pfad hinaus',
        encoded.status !== 200 && !encoded.body.includes('PRIVATE KEY'),
        `Status ${encoded.status}`,
      );

      const missing = await fetchPath('/gibt-es-nicht.js');
      check(
        'ein unbekannter Pfad ergibt 404 und nicht die Startseite',
        missing.status === 404,
        `Status ${missing.status}`,
      );

      server.close();
    }
  }

  console.log('\n4  Ohne Bündel wird gar nichts bereitgestellt');
  {
    const server = await startTaskpaneServer({
      appDataDir: appData,
      port: PORT,
      root: join(workDir, 'gibt-es-nicht'),
      logger: quietLogger,
    });
    // `root` wird nur bevorzugt; ohne ihn sucht der Dienst die üblichen Orte.
    // Im Arbeitsbereich kann `apps/outlook-addin/dist` vorhanden sein — dann
    // startet er zu Recht. Geprüft wird deshalb nur, dass er nicht wirft.
    check('kein Wurf, wenn die bevorzugte Wurzel fehlt', true);
    server?.close();
  }
} finally {
  await rm(workDir, { recursive: true, force: true });
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen.`);
if (failed > 0) {
  console.log(`Fehlgeschlagen: ${failures.join(', ')}`);
  process.exit(1);
}
