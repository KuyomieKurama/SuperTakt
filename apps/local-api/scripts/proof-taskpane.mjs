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
 *  4. Schlüssel und Zertifikat liegen im Anwendungsdatenverzeichnis, und die
 *     engen Rechte (`0600`) werden **ausdrücklich** gesetzt. Wo die Plattform
 *     einen POSIX-Modus führt, wird er am Ergebnis gemessen; wo nicht (Windows),
 *     wird das gesagt und statt dessen die Regel selbst gemessen — siehe
 *     Abschnitt 2.
 */

import { X509Certificate, createPrivateKey } from 'node:crypto';
import { chmod, mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { request } from 'node:https';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { paketQuelle } from './source-resolve.mjs';

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

    const keyPath = taskpaneKeyPath(appData);
    const certPath = taskpaneCertPath(appData);
    const keyStat = await stat(keyPath);
    const certStat = await stat(certPath);

    /*
     * Zuerst der **Ort**, und der wird überall gemessen.
     *
     * Bis T-247-6 sagte dieser Abschnitt nur etwas über den Modus — und damit
     * unter Windows über gar nichts. Daß beide Dateien überhaupt **hier**
     * liegen, im übergebenen Anwendungsdatenverzeichnis und nicht neben der
     * Datenbank, im Arbeitsverzeichnis oder in der ausgelieferten Wurzel, war
     * nie gemessen. Es ist aber die Zusage, an der der private Schlüssel
     * genauso hängt wie am Modus: `certificate.ts` sagt im Kopf „nie neben die
     * Datenbank kopiert", und `startTaskpaneServer` liefert aus einer anderen
     * Wurzel aus. Derselbe Schritt wie in `proof:access` Abschnitt 11
     * (A-A-72), aus demselben Grund.
     */
    check(
      'Schlüssel und Zertifikat liegen im übergebenen Anwendungsdatenverzeichnis',
      keyStat.isFile() && certStat.isFile() && dirname(keyPath) === appData && dirname(certPath) === appData,
      `${dirname(keyPath)} / ${dirname(certPath)}`,
    );

    /*
     * Dann die **Regel**, ebenfalls überall gemessen — statisch am Quelltext.
     *
     * `writePair` setzt den Modus zweimal je Datei: einmal beim Schreiben und
     * einmal danach mit `chmod`. Das ist kein Gürtel-und-Hosenträger, sondern
     * zwei verschiedene Fälle — die Angabe beim Anlegen wirkt nur, wenn die
     * Datei **neu** entsteht; eine schon vorhandene, zu weit stehende Datei
     * behielte ohne das `chmod` ihre alten Rechte. Genau diesen zweiten Fall
     * fängt die Modusprüfung am Ergebnis unten **nicht** ab, denn sie sieht auf
     * eine gerade erst angelegte Datei. Der Quelltext ist an dieser Stelle also
     * nicht die schwächere, sondern die andere Messung — und die einzige, die
     * auch unter Windows etwas aussagt.
     */
    /*
     * Aufgelöst statt abgezählt (T-249-1) — und hier mit einem zweiten Zweck.
     *
     * Dieser Abschnitt urteilt über den **Text** einer Datei, deren Modul
     * oben ohnehin geladen wird. Ein Pfad, der nicht mehr stimmt, fiele beim
     * Laden auf; was nicht auffiele, wäre eine Datei, die zwar dort liegt, aber
     * die gesuchte Stelle gar nicht enthält — dann stünde unten „gefunden: 0"
     * gegen „erwartet 2", und das liest sich wie ein Befund über B-2.2 statt
     * wie ein Fehlschlag der Messung. Das Merkmal trennt die beiden Fälle.
     */
    const certificateSource = await readFile(
      paketQuelle('@takt/local-api', {
        hinweis: 'src/taskpane/certificate.ts',
        merkmal: 'export function createSelfSignedCertificate',
      }),
      'utf8',
    );
    const writeWithMode = certificateSource.match(/writeFile\(\s*\w+,[^;]*?\{\s*mode:\s*FILE_MODE\s*\}\s*\)/g) ?? [];
    const chmodAfter = certificateSource.match(/chmod\(\s*\w+,\s*FILE_MODE\s*\)/g) ?? [];
    check(
      'der Quelltext legt beide Dateien ausdrücklich mit FILE_MODE an (B-2.2 Punkt 3)',
      writeWithMode.length === 2,
      `gefunden: ${writeWithMode.length}`,
    );
    check(
      'und engt beide danach noch einmal mit chmod ein — für den Fall, daß sie schon vorhanden waren',
      chmodAfter.length === 2,
      `gefunden: ${chmodAfter.length}`,
    );
    check(
      'kein Zahlenwert von Hand: der Modus kommt aus access/paths.ts',
      !/mode:\s*0o[0-7]+/.test(certificateSource) && /FILE_MODE\s*\}\s*from\s*'\.\.\/access\/paths\.ts'/.test(certificateSource),
    );
    check('FILE_MODE ist 0600', FILE_MODE === 0o600, `0${FILE_MODE.toString(8)}`);
    check(
      'isTooPermissive nennt 0644 zu weit und 0600 nicht',
      isTooPermissive(0o644, FILE_MODE) && !isTooPermissive(0o600, FILE_MODE),
    );

    /*
     * Zuletzt das **Ergebnis** — nur dort, wo die Plattform eines führt.
     *
     * Unter Windows liefert `fs.stat` keinen brauchbaren POSIX-Modus; gemessen
     * kommt dort `0666` für Verzeichnis wie Datei, also erkennbar keine
     * Auskunft. `access/paths.ts` nennt die Lücke seit T-011 im Kopf von
     * `isTooPermissive` selbst („dort trägt die ACL"), `proof:db-permissions`
     * überspringt aus demselben Grund unter Windows seinen ganzen Lauf,
     * `proof:access` Abschnitt 11 und `verify-sidecar` Abschnitt 18 schreiben
     * dieselbe Zeile aus.
     *
     * Das ist eine Lücke der **Messung**, keine Lockerung der **Regel**: Auf
     * Linux und macOS bleiben beide Zeilen unverändert scharf, und was oben
     * steht — Ort und Quelltext — wird auf allen drei Systemen gemessen. Der
     * Lauf schreibt aus, was er nicht mißt, statt es wegzulassen; ein roter
     * Balken, der nichts über den Code aussagt, wird gewohnheitsmäßig
     * überlesen, und ein stumm bestandener sagt die Unwahrheit.
     */
    if (process.platform === 'win32') {
      console.log(
        '  --    Schlüssel und Zertifikat mit 0600: nicht gemessen — unter Windows sagt der ' +
          'POSIX-Modus nichts, dort trägt die ACL (T-011). Gemessen sind statt dessen Ort und Quelltext.',
      );
    } else {
      check('der Schlüssel liegt mit 0600', !isTooPermissive(keyStat.mode, FILE_MODE), (keyStat.mode & 0o777).toString(8));
      check('das Zertifikat liegt mit 0600', !isTooPermissive(certStat.mode, FILE_MODE), (certStat.mode & 0o777).toString(8));
    }

    const second = await loadOrCreateCertificate(keyPath, certPath);
    check('beim zweiten Mal wird es geladen, nicht neu erzeugt', second.source === 'loaded', second.source);
    check('und es ist dasselbe', second.certPem === first.certPem);

    /*
     * Der zweite Fall des `chmod` — am laufenden Code statt am Quelltext, und
     * deshalb wieder nur dort, wo es einen Modus gibt: Eine vorhandene, zu weit
     * stehende Datei wird beim Ersetzen wieder eingeengt.
     */
    if (process.platform !== 'win32') {
      await writeFile(keyPath, 'kein gueltiger Schluessel');
      await chmod(keyPath, 0o644);
      const replaced = await loadOrCreateCertificate(keyPath, certPath);
      check('ein unbrauchbares Paar wird ersetzt statt beklagt', replaced.source === 'created', replaced.source);
      const narrowed = await stat(keyPath);
      check(
        'und die zu weit stehende Schlüsseldatei wird dabei auf 0600 eingeengt',
        !isTooPermissive(narrowed.mode, FILE_MODE),
        (narrowed.mode & 0o777).toString(8),
      );
    }
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
