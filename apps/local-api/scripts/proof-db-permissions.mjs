/**
 * Takt — Nachweis, dass der Datenbestand mit `0600` liegt
 * (T-034, B-7.2, Prüfung 26 aus Abschnitt 7 des Bedrohungsmodells).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:db-permissions
 *
 * ===========================================================================
 * Was T-023 gemessen hat
 * ===========================================================================
 *
 * ```
 * drwx------  700  <appdata>/takt/       Verzeichnis korrekt
 * -rw-------  600  taskpane-key.pem      korrekt
 * -rw-------  600  taskpane-cert.pem     korrekt
 * -rw-r--r--  644  takt.db               zu weit
 * -rw-r--r--  644  takt.db-wal           zu weit
 * -rw-r--r--  644  takt.db-shm           zu weit
 * -rw-------  600  takt-export-….json    korrekt
 * ```
 *
 * Die Ungleichbehandlung ist der Befund: Token und Zertifikat werden sorgfältig
 * gesetzt, ausgerechnet die Datei mit den Kundendaten und den internen
 * Vermerken (A-7.2) nicht. Auf POSIX hält das Verzeichnis mit `0700` die Grenze
 * — aber **der Modus wandert mit der Datei**, und diese Datei wird kopiert,
 * gesichert und verschoben (RR-2).
 *
 * ===========================================================================
 * Zwei Maßnahmen, zwei Abschnitte
 * ===========================================================================
 *
 * - `secureDatabaseFiles` holt eine Datei ein, die aus einer früheren Fassung
 *   mit `0644` daliegt (Abschnitte 1 und 2).
 * - Die `umask` des Sidecars sorgt dafür, dass `-wal` und `-shm` gar nicht erst
 *   zu weit **entstehen** — SQLite legt sie im Betrieb wiederholt neu an, ein
 *   einmaliges `chmod` reicht dafür nicht (Abschnitt 4).
 *
 * Damit Abschnitt 1 und 2 wirklich das `chmod` messen und nicht die `umask`,
 * setzt dieser Prüfpfad seine eigene `umask` ausdrücklich **weit** (`0o000`) —
 * und der Kindprozess in Abschnitt 4 erbt sie. Abschnitt 4 misst deshalb das
 * Ergebnis beider Maßnahmen im echten Startpfad und nicht eine von beiden
 * einzeln; getrennt gemessen ist das `chmod` in Abschnitt 1 und 2.
 */

import { spawn } from 'node:child_process';
import { chmodSync, statSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

import { CONNECTION_PRAGMAS, DATABASE_FILE_MODE, openConnection, openDatabase } from '@takt/storage';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(HERE, '..', 'src', 'index.ts');

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

function section(title) {
  console.log(`\n${title}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Der POSIX-Modus als Oktalzahl, oder `null`, wenn es die Datei nicht gibt. */
function mode(path) {
  try {
    return statSync(path).mode & 0o777;
  } catch {
    return null;
  }
}

function octal(value) {
  return value === null ? 'nicht vorhanden' : `0${value.toString(8)}`;
}

if (process.platform === 'win32') {
  console.log('Übersprungen: Unter Windows sagt der POSIX-Modus nichts, dort trägt die ACL (T-011).');
  process.exit(0);
}

// Weit gesetzt, damit die folgenden Abschnitte das ausdrückliche `chmod` messen
// und nicht versehentlich die `umask` dieses Prüfprozesses.
const vorherigeUmask = process.umask(0o000);

const dirs = [];
async function scratch(prefix) {
  const path = await mkdtemp(join(tmpdir(), prefix));
  dirs.push(path);
  return path;
}

try {
  // ---------------------------------------------------------------------------
  section('1  Ein frisch angelegter Bestand liegt mit 0600 — trotz weiter umask');
  // ---------------------------------------------------------------------------
  {
    const dir = await scratch('takt-proof-perm-neu-');
    const path = join(dir, 'takt.db');
    const database = openDatabase({ location: path, now: () => new Date().toISOString() });
    await database.migrations.migrateToLatest();
    // Eine echte Schreibtransaktion, damit `-wal` und `-shm` tatsächlich da sind.
    await database.transactions.inTransaction(async (unit) => unit.settings.load());

    for (const suffix of ['', '-wal', '-shm']) {
      const found = mode(`${path}${suffix}`);
      check(
        `takt.db${suffix} liegt mit 0600 (war: 0644)`,
        found === DATABASE_FILE_MODE,
        octal(found),
      );
    }

    check(
      'PRAGMA trusted_schema ist aus (B-7.4 Punkt 4)',
      Number(database.connection.prepare('PRAGMA trusted_schema').get()?.['trusted_schema']) === 0,
      JSON.stringify(database.connection.prepare('PRAGMA trusted_schema').get()),
    );
    check(
      'und steht in der Liste, die bei jedem Öffnen gesetzt wird',
      CONNECTION_PRAGMAS.some((pragma) => pragma.includes('trusted_schema')),
      CONNECTION_PRAGMAS.join(' '),
    );

    database.close();
  }

  // ---------------------------------------------------------------------------
  section('2  Ein Bestand aus einer früheren Fassung wird beim Öffnen eingeholt');
  // ---------------------------------------------------------------------------
  {
    const dir = await scratch('takt-proof-perm-alt-');
    const path = join(dir, 'takt.db');

    // Der Zustand, den T-023 vorgefunden hat: die Datei ist schon da und liegt
    // zu weit. Ein `chmod` beim Anlegen hilft ihr nicht mehr.
    const first = openDatabase({ location: path, now: () => new Date().toISOString() });
    await first.migrations.migrateToLatest();
    first.close();
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        chmodSync(`${path}${suffix}`, 0o644);
      } catch {
        /* -wal und -shm sind nach dem Schließen weg */
      }
    }
    check('Ausgangslage hergestellt: takt.db liegt mit 0644', mode(path) === 0o644, octal(mode(path)));

    const second = openConnection(path);
    check(
      'nach dem Öffnen liegt sie mit 0600',
      mode(path) === DATABASE_FILE_MODE,
      octal(mode(path)),
    );
    second.close();
  }

  // ---------------------------------------------------------------------------
  section('3  Die Sicherungskopie des Migrationsläufers erbt den engen Modus');
  // ---------------------------------------------------------------------------
  {
    const dir = await scratch('takt-proof-perm-backup-');
    const path = join(dir, 'takt.db');
    const database = openDatabase({ location: path, now: () => new Date().toISOString() });

    // Vorwärts, zurück, wieder vorwärts: Die Sicherung entsteht nur beim
    // Migrieren von einer Fassung > 0 (eine leere Datei zu sichern hätte
    // keinen Wert). Nebenbei ist das der Nachweis, dass die Migrationen in
    // beide Richtungen laufen.
    const up = await database.migrations.migrateToLatest();
    check(`Migration vorwärts auf Fassung ${up.to}`, up.to > 0, JSON.stringify(up));
    const down = await database.migrations.migrateDownTo(1);
    check('Migration rückwärts auf Fassung 1', down.to === 1, JSON.stringify(down));
    const again = await database.migrations.migrateToLatest();
    check(
      'Migration wieder vorwärts, mit Sicherungskopie',
      again.backup !== null,
      JSON.stringify(again),
    );
    if (again.backup !== null) {
      check(
        'die Sicherungskopie liegt mit 0600 (sie ist eine vollständige zweite Kundendatenbank)',
        mode(again.backup) === DATABASE_FILE_MODE,
        octal(mode(again.backup)),
      );
    }
    database.close();
  }

  // ---------------------------------------------------------------------------
  section('4  Der echte Startpfad des Dienstes, mit absichtlich weiter umask');
  // ---------------------------------------------------------------------------
  {
    const dataHome = await scratch('takt-proof-perm-start-');
    const appDir = join(dataHome, 'takt');
    const path = join(appDir, 'takt.db');

    // Der Kindprozess erbt `0o000` und muss seine `umask` selbst setzen. Er
    // wird den Port 17843 möglicherweise nicht bekommen — die Anwendung oder
    // ein anderer Prüfpfad kann laufen. Das macht nichts: Verzeichnis,
    // Datenbank und Migration entstehen im Start **vor** dem Binden.
    const child = spawn(process.execPath, [ENTRY], {
      stdio: ['pipe', 'ignore', 'pipe'],
      env: { ...process.env, XDG_DATA_HOME: dataHome },
    });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.stdin.write(`takt_${randomBytes(32).toString('base64url')}\nt.beispiel\n`);

    let appeared = false;
    for (let attempt = 0; attempt < 150; attempt += 1) {
      if (mode(`${path}-wal`) !== null) {
        appeared = true;
        break;
      }
      await sleep(100);
    }
    check('der Dienst legt seinen Bestand an', appeared, stderr.slice(-300));

    if (appeared) {
      check('das Verzeichnis liegt mit 0700', mode(appDir) === 0o700, octal(mode(appDir)));
      for (const suffix of ['', '-wal', '-shm']) {
        const found = mode(`${path}${suffix}`);
        check(
          `takt.db${suffix} entsteht im echten Startpfad mit 0600`,
          found === DATABASE_FILE_MODE,
          octal(found),
        );
      }

      // Nicht nur die drei erwarteten: **jede** Datei, die dieser Start
      // angelegt hat. Kommt später eine hinzu, an die heute niemand denkt,
      // wird sie hier von selbst mitgemessen — das ist der Teil, den die
      // `umask` trägt und ein aufgezähltes `chmod` nicht tragen könnte.
      const inhalt = await readdir(appDir);
      const zuWeit = inhalt
        .map((name) => [name, mode(join(appDir, name))])
        .filter(([, m]) => m !== null && (m & 0o077) !== 0);
      check(
        `keine der ${inhalt.length} Dateien im Anwendungsdatenverzeichnis ist für andere lesbar`,
        zuWeit.length === 0,
        zuWeit.map(([name, m]) => `${name} ${octal(m)}`).join(', '),
      );
    }

    child.kill('SIGTERM');
    await sleep(300);
  }
} finally {
  process.umask(vorherigeUmask);
  for (const dir of dirs) {
    await rm(dir, { recursive: true, force: true });
  }
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) {
  console.log(`Fehlgeschlagen: ${failures.join(', ')}`);
  process.exit(1);
}
