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
 * Damit die folgenden Abschnitte das `chmod` messen und nicht die `umask`,
 * setzt dieser Prüfpfad seine eigene `umask` ausdrücklich **weit** (`0o000`) —
 * und der Kindprozess in Abschnitt 4 erbt sie. Abschnitt 4 misst deshalb das
 * Ergebnis beider Maßnahmen im echten Startpfad und nicht eine von beiden
 * einzeln.
 *
 * ===========================================================================
 * Berichtigung und Vorbedingung (T-231, A-A-65)
 * ===========================================================================
 *
 * Hier stand „getrennt gemessen ist das `chmod` in Abschnitt **1 und 2**". Der
 * Satz war zu weit, und security-checker hat es in T-230 gemessen
 * (Bedrohungsmodell 30.4): Mit ausgeschaltetem `secureDatabaseFiles` und einer
 * **engen** `umask` (`0o077`) blieben Abschnitt 1 dreimal grün, Abschnitt 3
 * grün und sogar Abschnitt 4 grün — rot wurde allein Abschnitt 2.
 *
 * Der Grund: Abschnitt 1, 3 und 4 messen den **Zustand** einer frisch
 * entstandenen Datei, und den setzt bei enger `umask` schon das Betriebssystem.
 * Abschnitt 2 misst die **Wirkung** — vorher `0644`, nachher `0600`, in zwei
 * Zeilen desselben Laufs — und ist damit gegen jede `umask` immun. Getrennt
 * gemessen ist das `chmod` also in **Abschnitt 2**.
 *
 * Die weite `umask` wurde gesetzt und nirgends gemessen. Sie ist die
 * Vorbedingung von Abschnitt 1, 3 und 4; deshalb steht sie jetzt als erste
 * Zeile dieses Laufs, **vor** Abschnitt 1, und nicht als Zusage im Kopf.
 */

import { spawn } from 'node:child_process';
import { chmodSync, statSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

import { nameEmailFile } from '@takt/domain';
import { CONNECTION_PRAGMAS, DATABASE_FILE_MODE, openConnection, openDatabase } from '@takt/storage';

import { createAttachmentBlobPort } from '../src/access/attachment-store.ts';

import { appDataDirIn, isolatedAppDataEnv } from './proof-appdata.mjs';
import { dienstEinstieg } from './source-resolve.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
/* Aufgelöst statt abgezählt — Begründung in source-resolve.mjs (T-249-1). */
const ENTRY = dienstEinstieg();

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

// ---------------------------------------------------------------------------
section('0  Die Vorbedingung dieses Laufs: die eigene umask ist weit');
// ---------------------------------------------------------------------------
//
// `process.umask()` ohne Wert liest, ohne zu setzen. Steht hier etwas anderes
// als `0o000`, sind die Zeilen in Abschnitt 1, 3 und 4 keine Aussage über das
// `chmod` des Produkts mehr, sondern über das Betriebssystem — und dann soll
// dieser Lauf rot sein und nicht grün (A-A-65).
{
  const gesetzt = process.umask();
  check(
    'die umask dieses Laufs ist weit (0000)',
    gesetzt === 0o000,
    `gemessen: 0${gesetzt.toString(8).padStart(3, '0')} — Abschnitt 1, 3 und 4 messen dann die umask und nicht das chmod`,
  );
}

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
    const appDir = appDataDirIn(dataHome);
    const path = join(appDir, 'takt.db');

    // Der Kindprozess erbt `0o000` und muss seine `umask` selbst setzen. Er
    // wird den Port 17843 möglicherweise nicht bekommen — die Anwendung oder
    // ein anderer Prüfpfad kann laufen. Das macht nichts: Verzeichnis,
    // Datenbank und Migration entstehen im Start **vor** dem Binden.
    const child = spawn(process.execPath, [ENTRY], {
      stdio: ['pipe', 'ignore', 'pipe'],
      env: isolatedAppDataEnv(dataHome),
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

  // ---------------------------------------------------------------------------
  section('5  Der Ordner der übernommenen E-Mail-Dateien (A-19.23, A-A-78, A-A-79)');
  // ---------------------------------------------------------------------------
  //
  // Dieselbe Zusage wie für die Bildkopien in A-A-27, für einen zweiten Ordner:
  // Verzeichnis `0700`, Datei `0600`, **ausdrücklich gesetzt** und nicht der
  // `umask` überlassen — die steht in diesem Lauf absichtlich auf `0o000`.
  //
  // Der zweite Teil dieses Abschnitts ist kein Rechteproblem, und er steht
  // trotzdem hier: **Der Name auf der Platte ist erzeugt** (A-A-78). Die
  // Angriffsnamen stammen aus der Tafel des security-checkers (T-297,
  // Bedrohungsmodell 39.4.1), in der die Vorlage 25 Namen hereinließ und 25
  // Dateien schrieb. Gemessen wird hier nicht, ob ein Filter sie abweist,
  // sondern daß **keiner von ihnen im Pfad vorkommt** — die Fehlerklasse ist
  // nicht abgewehrt, sondern unmöglich.
  {
    const dataHome = await scratch('takt-proof-perm-mail-');
    const appDir = appDataDirIn(dataHome);
    const port = createAttachmentBlobPort(appDir, { lifecycle: () => undefined });
    const mailDir = join(appDir, 'email-attachments');

    const stored = await port.storeEmailFile(Buffer.from('Beispielinhalt'), 'pdf');
    check('eine übernommene E-Mail-Datei wird abgelegt', stored.ok === true, JSON.stringify(stored));

    if (stored.ok) {
      check('der Ordner liegt mit 0700', mode(mailDir) === 0o700, octal(mode(mailDir)));
      check(
        'die Datei liegt mit 0600 — trotz weiter umask',
        mode(stored.path) === 0o600,
        octal(mode(stored.path)),
      );
      check(
        'der Name ist erzeugt: 32 Hexziffern und die übernommene Endung',
        /^[0-9a-f]{32}\.pdf$/.test(stored.name),
        stored.name,
      );
    }

    // Die Tafel aus 39.4.1. **Keine rohen Richtungszeichen in dieser Datei**
    // (proof:codepoints) — sie stehen als Bezeichner und werden zur Laufzeit
    // gebildet. Dieselbe Regel, die das Bedrohungsmodell für sich selbst
    // aufgestellt hat: Wer einen Angriff über ein unsichtbares Zeichen
    // beschreibt, schreibt den Bezeichner und nicht das Zeichen.
    const ANGRIFFSNAMEN = [
      '..\\..\\..\\Startup\\x.bat',
      '../../../x.sh',
      '..',
      'C:\\Windows\\System32\\calc.exe',
      '\\\\wirt\\freigabe\\x.txt',
      '//wirt/freigabe/x.txt',
      'NUL',
      'CON.txt',
      'prn.pdf',
      'COM1',
      'CONOUT$',
      'CONIN$',
      'LPT9.txt',
      'rechnung.lnk.',
      'rechnung.lnk ',
      'rechnung.pdf.exe',
      `Rechnung.pdf${' '.repeat(20)}.exe`,
      `rechnung${String.fromCodePoint(0x202e)}xcod.exe`,
      `rechnung${String.fromCodePoint(0x2067)}fdp.exe`,
      'rechnung.txt:evil.lnk',
      'rechnung.lnk::$DATA',
      `rechnung.pdf${String.fromCodePoint(0)}.exe`,
      `${'A'.repeat(400)}.exe`,
      '   ',
      '???',
    ];
    check(
      'die Fallliste ist die des Bedrohungsmodells 39.4.1 und schrumpft nicht (E-107)',
      ANGRIFFSNAMEN.length === 25,
      String(ANGRIFFSNAMEN.length),
    );

    const imPfad = [];
    const falscheForm = [];
    for (const roh of ANGRIFFSNAMEN) {
      const benennung = nameEmailFile(roh);
      if (!benennung.ok) continue;
      const abgelegt = await port.storeEmailFile(Buffer.from('x'), benennung.extension);
      if (!abgelegt.ok) continue;
      if (!/^[0-9a-f]{32}(\.[a-z0-9]{1,16})?$/.test(abgelegt.name)) falscheForm.push(roh);
      // Verglichen wird der **ganze Pfad** und nicht nur der Name: Ein
      // Verzeichniswechsel stünde dort und nicht hier.
      if (roh.trim() !== '' && abgelegt.path.includes(roh.trim())) imPfad.push(roh);
    }
    check('kein roher Name kommt im erzeugten Pfad vor', imPfad.length === 0, imPfad.join(' | '));
    check(
      'jeder erzeugte Name hat die Form `<32 Hexziffern>[.<endung>]`',
      falscheForm.length === 0,
      falscheForm.join(' | '),
    );

    // Gegenprobe zur Rechteprüfung: **jede** Datei in diesem Ordner ist eng,
    // nicht nur die erste. Dieselbe Bauart wie in Abschnitt 4.
    const inhalt = await readdir(mailDir);
    const zuWeit = inhalt
      .map((name) => [name, mode(join(mailDir, name))])
      .filter(([, m]) => m !== null && (m & 0o077) !== 0);
    check(
      `keine der ${inhalt.length} übernommenen Dateien ist für andere lesbar`,
      zuWeit.length === 0,
      zuWeit.map(([name, m]) => `${name} ${octal(m)}`).join(', '),
    );

    // A-A-83 und „geprüft wird, was benutzt wird": Ein `target`, das nicht in
    // diesen Ordner zeigt, wird **nicht angefaßt**. Ohne diese Zeile wäre der
    // Löschpfad ein Werkzeug, mit dem ein geschriebener Bestandswert beliebige
    // Dateien entfernt (VG-3).
    const urteil = await port.removeEmailFile(join(appDir, 'takt.db'));
    check('ein Ziel außerhalb des Ordners wird abgewiesen', urteil === 'unknown_name', urteil);
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
