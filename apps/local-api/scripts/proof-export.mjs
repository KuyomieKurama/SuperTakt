/**
 * Takt — Nachweis des transaktionalen Exportlaufs (A-8.8, E-020, E-034, R-10).
 *
 * Dies ist **kein** Testlauf im Sinne von T-010 — die Testhoheit liegt beim
 * unit-tester. Es ist der Prüfpfad, mit dem der Erbauer belegt, dass die
 * Zusicherung aus A-8.8 tatsächlich hält: „nachgewiesen, nicht behauptet".
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:export
 *
 * Der Lauf fährt den **echten** Anwendungsfall gegen eine echte, vollständig
 * migrierte SQLite-Datei in einem Wegwerfordner und einen echten Exportordner
 * auf der Platte. Keine Attrappe der Speicherung, keine Attrappe des
 * Dateisystems — die Zusicherung ist eine über Transaktionen und Dateien, und
 * gegen Attrappen wäre sie nichts wert.
 *
 * Der Kern sind die Abschnitte 4 und 5: Ein **Abbruch mitten im Vorgang** wird
 * ausgelöst — einmal nach dem Schreiben der Datei und vor dem Markieren, einmal
 * nach dem Markieren und vor dem Festschreiben. Danach wird gezählt, ob eine
 * Buchung in einem Zwischenzustand hängt.
 *
 * Ausgabe: eine Zeile je Prüfung, am Ende eine Zusammenfassung. Exitcode 1,
 * sobald eine Prüfung fehlschlägt.
 */

import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Kein Auflösungshaken mehr (T-029): Seit `packages/domain` seine internen
// Importe mit `.ts` schreibt, gibt es im Arbeitsbereich keinen `.js`-Bezeichner
// mehr, der auf eine nicht vorhandene Datei zeigt. Begründung in `src/index.ts`.

const { openDatabase, createClockPort, createFilePort, createSystemPort, uuidv7, DIRECTORY_CHECK_BUDGET_MS } =
  await import('@takt/storage');
const { createDirectoryInsightPort } = await import('../src/access/export-directory.ts');
const { runExport, previewExport } = await import('../src/usecases/export.ts');
const { createTodo } = await import('../src/usecases/todos.ts');
const { setExportStatus } = await import('../src/usecases/structure.ts');

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

// ---------------------------------------------------------------------------
// Aufbau
// ---------------------------------------------------------------------------

const workDir = await mkdtemp(join(tmpdir(), 'takt-proof-export-'));
const exportDir = join(workDir, 'exporte');
await (await import('node:fs/promises')).mkdir(exportDir, { recursive: true });

const clock = createClockPort();

/** Baut einen frischen Bestand mit drei Buchungen an einem Tag. */
async function freshContext(faults) {
  const database = openDatabase({
    location: join(workDir, `takt-${Math.random().toString(36).slice(2)}.db`),
    now: () => clock.now(),
    timeZone: 'Europe/Berlin',
  });
  await database.migrations.migrateToLatest();

  const context = {
    transactions: database.transactions,
    clock,
    files: createFilePort(),
    // E-010, E-042: Der Name kommt von außen und wird nur durchgereicht.
    system: createSystemPort('t.beispiel'),
    ...(faults === undefined ? {} : { exportFaults: faults }),
  };

  await context.transactions.inTransaction((unit) =>
    unit.settings.update({ exportDirectory: exportDir, now: clock.now() }),
  );

  const created = await createTodo(context, {
    title: 'Call 4711',
    callNumber: 'TCK-000042',
    statusId: null,
    tagIds: [],
    note: 'Interner Vermerk — darf nie in den Export',
  });
  if (!created.ok) throw new Error('Todo konnte nicht angelegt werden.');
  const todoId = created.value.todo.id;

  // 10 + 20 + 5 Minuten am selben Tag. Erst summieren, dann runden: 0,75
  // statt dreimal aufgerundet 1,00 (E-008, E-020).
  const entries = [];
  await context.transactions.inTransaction(async (unit) => {
    for (const [start, end, note] of [
      ['2026-01-15T08:00:00Z', '2026-01-15T08:10:00Z', 'Rückruf entgegengenommen'],
      ['2026-01-15T09:00:00Z', '2026-01-15T09:20:00Z', 'Analyse gemacht; Fix eingespielt'],
      ['2026-01-15T10:00:00Z', '2026-01-15T10:05:00Z', 'Ticket geschlossen.'],
    ]) {
      const result = await unit.timeEntries.create(
        { todoId, startedAt: start, endedAt: end, note },
        clock.now(),
      );
      if (!result.ok) throw new Error(`Buchung abgelehnt: ${result.error.code}`);
      entries.push(result.value.id);
    }
  });

  return { database, context, todoId, entries };
}

/** Zustand aller Buchungen, so wie ihn ein Zwischenzustand verraten würde. */
async function stateOf(context) {
  return context.transactions.inTransaction(async (unit) => {
    const page = await unit.timeEntries.search({}, { limit: 100 });
    const audit = await unit.export.audit({}, { limit: 100 });
    const runs = await unit.export.listRuns({ limit: 100 });
    return {
      entries: page.items.map((entry) => ({
        id: entry.id,
        status: entry.exportStatus,
        count: entry.exportCount,
      })),
      auditCount: audit.total,
      runCount: runs.total,
      openCandidates: await unit.exportRead.openCount(),
    };
  });
}

async function exportFiles() {
  return (await readdir(exportDir)).filter((name) => name.endsWith('.json'));
}

async function clearExportDir() {
  for (const name of await readdir(exportDir)) {
    await rm(join(exportDir, name), { force: true });
  }
}

try {
  // -------------------------------------------------------------------------
  section('1  Der gute Fall — Datei geschrieben und alle Buchungen markiert');
  // -------------------------------------------------------------------------
  {
    const { database, context, entries } = await freshContext();

    const before = await stateOf(context);
    check('vorher: drei offene Buchungen', before.entries.length === 3 && before.entries.every((e) => e.status === 'open'));
    check('vorher: drei Kandidaten in v_export_candidate', before.openCandidates === 3);

    const preview = await previewExport(context, { kind: 'stored', templateId: null }, []);
    check('Vorschau gelingt', preview.ok, preview.ok ? '' : preview.error.code);
    check(
      'Vorschau: eine Zeile aus drei Buchungen (E-020)',
      preview.ok && preview.value.rows.length === 1 && preview.value.entryCount === 3,
    );
    check(
      'Vorschau: 35 Minuten ergeben 0,75 und nicht 1,00 (E-008, E-020)',
      preview.ok && preview.value.rows[0].Zeit === 0.75,
      preview.ok ? `Zeit=${preview.value.rows[0].Zeit}` : '',
    );

    const previewState = await stateOf(context);
    check('Vorschau schreibt nichts', previewState.runCount === 0 && previewState.auditCount === 0);

    const result = await runExport(context, { templateId: null, timeEntryIds: [] });
    check('Exportlauf gelingt', result.ok, result.ok ? '' : result.error.code);

    const after = await stateOf(context);
    const files = await exportFiles();

    check('genau eine Datei geschrieben', files.length === 1, `gefunden: ${files.length}`);
    check('alle drei Buchungen sind exportiert', after.entries.every((e) => e.status === 'exported'));
    check('export_count je Buchung auf 1', after.entries.every((e) => e.count === 1));
    check('je Buchung eine Protokollzeile (R-10)', after.auditCount === 3);
    check('ein Exportlauf verzeichnet', after.runCount === 1);
    check('keine offenen Kandidaten mehr', after.openCandidates === 0);

    const written = JSON.parse(await readFile(join(exportDir, files[0]), 'utf8'));
    check('Datei trägt genau eine Zeile', Array.isArray(written) && written.length === 1);
    check('Feld Zeit ist 0.75', written[0]?.Zeit === 0.75, JSON.stringify(written[0]?.Zeit));
    check(
      'Feld WindowsUser kommt vom System, nicht aus einer Eingabe (E-010, E-042)',
      written[0]?.WindowsUser === 't.beispiel',
    );
    check(
      'der interne Vermerk steht nirgends in der Datei (A-7.2, R-06)',
      !JSON.stringify(written).includes('Interner Vermerk') &&
        !Buffer.from(String(written[0]?.Notiz ?? ''), 'base64').toString('utf8').includes('Interner Vermerk'),
    );

    const noteBack = Buffer.from(String(written[0]?.Notiz ?? ''), 'base64').toString('utf8');
    check(
      'die Leistungstexte sind mit Semikolon verbunden (E-026)',
      noteBack === 'Rückruf entgegengenommen; Analyse gemacht; Fix eingespielt; Ticket geschlossen',
      noteBack,
    );

    database.close();
    await clearExportDir();
  }

  // -------------------------------------------------------------------------
  section('2  Nur offene Buchungen fließen in eine Tagesgruppe (R-10)');
  // -------------------------------------------------------------------------
  {
    const { database, context, entries } = await freshContext();

    // Eine der drei Buchungen exportieren, indem nur sie in den Lauf geht.
    const first = await runExport(context, { templateId: null, timeEntryIds: [entries[0]] });
    check('Teillauf über eine Buchung gelingt', first.ok, first.ok ? '' : first.error.code);

    const groups = await context.transactions.inTransaction((unit) => unit.exportRead.openGroups());
    check(
      'die exportierte Buchung ist nicht mehr in der Tagesgruppe',
      groups.length === 1 && groups[0].entries.length === 2,
      `Buchungen in der Gruppe: ${groups[0]?.entries.length}`,
    );
    check(
      'die Tagessumme enthält die exportierte Zeit nicht mehr',
      groups[0].entries.reduce((sum, e) => sum + e.durationSeconds, 0) === 1500,
    );

    // Zurücksetzen bringt sie zurück (E-012) — als `open`, nicht als dritter Wert (E-032).
    const reset = await setExportStatus(context, entries[0], 'open', 'Falsch abgerechnet');
    check('Zurücksetzen gelingt (E-012)', reset.ok, reset.ok ? '' : reset.error.code);
    check('der Status ist wieder genau "open" (E-032)', reset.ok && reset.value.exportStatus === 'open');
    check(
      'export_count bleibt stehen — die Buchung war schon einmal exportiert (R-10)',
      reset.ok && reset.value.exportCount === 1,
    );

    const back = await context.transactions.inTransaction((unit) => unit.exportRead.openGroups());
    check('die zurückgesetzte Buchung ist wieder in der Gruppe', back[0].entries.length === 3);
    check('und die Gruppe ist als "schon einmal exportiert" gekennzeichnet', back[0].previouslyExported === true);

    const notSettable = await setExportStatus(context, entries[1], 'exported', 'Von Hand');
    check(
      '"exported" von Hand zu setzen wird abgewiesen',
      !notSettable.ok && notSettable.error.code === 'export_status_not_settable',
      notSettable.ok ? 'ging durch' : notSettable.error.code,
    );

    database.close();
    await clearExportDir();
  }

  // -------------------------------------------------------------------------
  section('3  Kein Lauf ohne Zeilen — keine leere Datei');
  // -------------------------------------------------------------------------
  {
    const { database, context } = await freshContext();
    await runExport(context, { templateId: null, timeEntryIds: [] });
    await clearExportDir();

    const again = await runExport(context, { templateId: null, timeEntryIds: [] });
    check(
      'ein zweiter Lauf ohne offene Buchungen wird abgewiesen',
      !again.ok && again.error.code === 'export_nothing_to_do',
      again.ok ? 'ging durch' : again.error.code,
    );
    check('und schreibt keine Datei', (await exportFiles()).length === 0);

    database.close();
    await clearExportDir();
  }

  // -------------------------------------------------------------------------
  section('4  ABBRUCH nach der Datei, vor dem Markieren — der teure Fall');
  // -------------------------------------------------------------------------
  {
    const { database, context } = await freshContext({
      afterFileWritten: () => {
        throw new Error('Absichtlicher Abbruch mitten im Exportlauf.');
      },
    });

    let threw = false;
    try {
      await runExport(context, { templateId: null, timeEntryIds: [] });
    } catch {
      threw = true;
    }
    check('der Lauf bricht ab', threw);

    const after = await stateOf(context);
    check('KEINE Buchung ist markiert', after.entries.every((e) => e.status === 'open'), JSON.stringify(after.entries));
    check('KEIN export_count wurde erhöht', after.entries.every((e) => e.count === 0));
    check('KEINE Protokollzeile entstanden', after.auditCount === 0);
    check('KEIN Exportlauf verzeichnet', after.runCount === 0);
    check('alle drei Buchungen sind weiterhin Kandidaten', after.openCandidates === 3);

    const files = await readdir(exportDir);
    check(
      'KEINE Datei bleibt im Ordner zurück — auch keine .tmp',
      files.length === 0,
      `gefunden: ${JSON.stringify(files)}`,
    );

    // Und der Bestand ist danach unverändert benutzbar: derselbe Lauf ohne
    // Haken muss vollständig durchgehen.
    database.close();
  }

  // -------------------------------------------------------------------------
  section('5  ABBRUCH nach dem Markieren, vor dem Festschreiben');
  // -------------------------------------------------------------------------
  {
    const { database, context } = await freshContext({
      beforeCommit: () => {
        throw new Error('Absichtlicher Abbruch unmittelbar vor dem Festschreiben.');
      },
    });

    let threw = false;
    try {
      await runExport(context, { templateId: null, timeEntryIds: [] });
    } catch {
      threw = true;
    }
    check('der Lauf bricht ab', threw);

    const after = await stateOf(context);
    check('die Markierung ist zurückgenommen', after.entries.every((e) => e.status === 'open'), JSON.stringify(after.entries));
    check('export_count ist zurückgesetzt', after.entries.every((e) => e.count === 0));
    check('die bereits geschriebenen Protokollzeilen sind fort', after.auditCount === 0);
    check('der bereits geschriebene Exportlauf ist fort', after.runCount === 0);
    check('alle drei Buchungen sind weiterhin Kandidaten', after.openCandidates === 3);

    const files = await readdir(exportDir);
    check(
      'die bereits geschriebene Datei ist wieder entfernt',
      files.length === 0,
      `gefunden: ${JSON.stringify(files)}`,
    );

    database.close();
  }

  // -------------------------------------------------------------------------
  section('6  Nach einem Abbruch ist der Bestand vollständig benutzbar');
  // -------------------------------------------------------------------------
  {
    const faults = { afterFileWritten: () => { throw new Error('Abbruch'); } };
    const { database, context } = await freshContext(faults);

    try {
      await runExport(context, { templateId: null, timeEntryIds: [] });
    } catch {
      /* erwartet */
    }

    // Denselben Zusammenhang ohne Haken weiterbenutzen.
    delete faults.afterFileWritten;

    const retry = await runExport(context, { templateId: null, timeEntryIds: [] });
    check('der Wiederholungslauf gelingt', retry.ok, retry.ok ? '' : retry.error.code);

    const after = await stateOf(context);
    check('jetzt sind alle drei markiert', after.entries.every((e) => e.status === 'exported'));
    check('genau eine Datei liegt im Ordner', (await exportFiles()).length === 1);
    check('genau drei Protokollzeilen', after.auditCount === 3);
    check(
      'export_count ist 1 und nicht 2 — der abgebrochene Lauf hat nichts gezählt',
      after.entries.every((e) => e.count === 1),
    );

    database.close();
    await clearExportDir();
  }

  // -------------------------------------------------------------------------
  section('7  E-034 — eine Gruppe ohne Leistungstext hält den Lauf nicht auf');
  // -------------------------------------------------------------------------
  {
    const { database, context, todoId } = await freshContext();

    const stumm = await createTodo(context, {
      title: 'Ohne Leistung',
      callNumber: null,
      statusId: null,
      tagIds: [],
      note: '',
    });
    await context.transactions.inTransaction((unit) =>
      unit.timeEntries.create(
        { todoId: stumm.value.todo.id, startedAt: '2026-01-15T12:00:00Z', endedAt: '2026-01-15T12:30:00Z', note: '' },
        clock.now(),
      ),
    );

    const result = await runExport(context, { templateId: null, timeEntryIds: [] });
    check('der Lauf gelingt trotz einer nicht exportierbaren Gruppe', result.ok, result.ok ? '' : result.error.code);
    check('die stumme Gruppe ist als ausgelassen ausgewiesen', result.ok && result.value.skipped.length === 1);
    check(
      'und der Grund ist die leere Leistung',
      result.ok && result.value.skipped[0]?.reason === 'empty_note',
    );

    const open = await context.transactions.inTransaction((unit) => unit.exportRead.openCandidates());
    check(
      'ihre Buchung bleibt offen und erscheint beim nächsten Mal wieder',
      open.length === 1 && open[0].todoId === stumm.value.todo.id,
      `offen: ${open.length}`,
    );
    check('die übrigen drei Buchungen sind markiert', result.ok && result.value.run.entryCount === 3);
    void todoId;

    database.close();
    await clearExportDir();
  }

  // -------------------------------------------------------------------------
  section('8  Migration vorwärts und rückwärts');
  // -------------------------------------------------------------------------
  {
    const database = openDatabase({ location: join(workDir, 'migration.db'), now: () => clock.now() });

    const before = await database.migrations.state();
    check('ein leerer Bestand meldet ausstehende Migrationen', before.kind === 'pending', JSON.stringify(before));

    // Die erwartete Fassung wird **abgeleitet** und nicht ausgeschrieben
    // (T-029): Eine feste Zahl hier meldet bei jeder neuen Migration einen
    // Fehlschlag, der keiner ist, und lenkt von dem ab, was dieser Abschnitt
    // wirklich prüft — dass der Weg hin und zurück und wieder hin trägt.
    const höchste = before.kind === 'pending' ? before.to : 0;
    const anzahl = before.kind === 'pending' ? before.count : 0;

    const up = await database.migrations.migrateToLatest();
    check('vorwärts bis zur höchsten Fassung', up.to === höchste, JSON.stringify(up));
    check('der Zustand danach ist "current"', (await database.migrations.state()).kind === 'current');
    check(
      'alle mitgelieferten Migrationen sind verzeichnet',
      (await database.migrations.applied()).length === anzahl,
      `erwartet ${anzahl}`,
    );

    const down = await database.migrations.migrateDownTo(1);
    check('rückwärts bis Fassung 1', down.to === 1, JSON.stringify(down));
    check('nur noch eine Migration verzeichnet', (await database.migrations.applied()).length === 1);

    const again = await database.migrations.migrateToLatest();
    check('und wieder vorwärts', again.to === höchste, JSON.stringify(again));
    check(
      'die Standardvorlage ist danach wieder da (A-8.7)',
      (await database.transactions.inTransaction((unit) => unit.templates.builtin())).isBuiltin === true,
    );

    const down0 = await database.migrations.migrateDownTo(0);
    check('rückwärts bis auf null', down0.to === 0, JSON.stringify(down0));
    check('keine Migration mehr verzeichnet', (await database.migrations.applied()).length === 0);

    database.close();
  }

  // -------------------------------------------------------------------------
  section('9  Der Exportordner ist Benutzereingabe (E-011, R-11)');
  // -------------------------------------------------------------------------
  {
    const { database, context } = await freshContext();

    await context.transactions.inTransaction((unit) =>
      unit.settings.update({ exportDirectory: join(workDir, 'gibt-es-nicht'), now: clock.now() }),
    );

    const result = await runExport(context, { templateId: null, timeEntryIds: [] });
    check(
      'ein verschwundener Ordner wird vor der Transaktion bemerkt',
      !result.ok && result.error.code === 'export_directory_missing',
      result.ok ? 'ging durch' : result.error.code,
    );

    const after = await stateOf(context);
    check('und keine Buchung ist angefasst', after.entries.every((e) => e.status === 'open'));

    const files = await readFile(join(workDir, 'takt-nichts'), 'utf8').catch(() => null);
    check('es entsteht keine Datei außerhalb des Ordners', files === null);

    database.close();
  }

  // -------------------------------------------------------------------------
  section('10  Was am Ordner belegbar ist, und was nicht (T-039, B-5.2)');
  // -------------------------------------------------------------------------
  {
    const port = createFilePort();
    const insight = createDirectoryInsightPort();

    const asked = { mayAskFileSystem: true };

    const good = await insight.describeExportDirectory(workDir, asked);
    check(
      'an einem gewöhnlichen Arbeitsordner ist nichts belegt — die Liste ist leer',
      Array.isArray(good) && good.length === 0,
      JSON.stringify(good),
    );

    // Der Beleg für `system_dir` kommt aus der Umgebung und nicht aus einer
    // festen Liste. Unter POSIX steht `/etc` in dieser Liste; unter Windows
    // sagt `%SystemRoot%`, wo das System liegt — auch wenn das nicht `C:` ist.
    const systemPath = process.platform === 'win32' ? (process.env.SystemRoot ?? 'C:\\Windows') : '/etc';
    check(
      `ein Systemverzeichnis (${systemPath}) wird als solches belegt`,
      (await insight.describeExportDirectory(systemPath, asked)).includes('system_dir'),
      JSON.stringify(await insight.describeExportDirectory(systemPath, asked)),
    );

    // …und zwar unabhängig davon, wie die Prüfung ausgeht. Genau dafür sind es
    // zwei Methoden: `/etc` ist für einen gewöhnlichen Benutzer nicht
    // beschreibbar, ein Systemverzeichnis ist es trotzdem.
    const systemCheck = await port.checkExportDirectory(systemPath);
    check(
      'die Einordnung hängt nicht am Ausgang der Prüfung',
      systemCheck.ok === false ? systemCheck.reason === 'not_writable' : systemCheck.ok === true,
      JSON.stringify(systemCheck),
    );

    // Die Gegenprobe: Die Einordnung darf nicht raten. Ein Ordner, der
    // „OneDrive" **heißt**, ohne dass ein Client das behauptet, ist keiner —
    // sonst wäre der Beleg wieder die Heuristik, die er ergänzen soll.
    const lookalike = join(workDir, 'OneDrive');
    await mkdir(lookalike, { recursive: true });
    check(
      'ein Ordner, der nur „OneDrive" heißt, gilt nicht als Synchronisierungsordner',
      !(await insight.describeExportDirectory(lookalike, asked)).includes('sync_folder'),
      JSON.stringify(await insight.describeExportDirectory(lookalike, asked)),
    );

    check(
      'ohne Pfad gibt es nichts einzuordnen',
      (await insight.describeExportDirectory(null, asked)).length === 0,
    );

    // Die Gestalt der vorhandenen Ergebnisse bleibt unverändert. Das ist der
    // Grund, warum die Merkmale eine eigene Auskunft sind und nicht ein Feld
    // im Prüfergebnis: Kein bestehender Aufrufer und keine bestehende Prüfung
    // sieht durch T-039 etwas anderes als vorher.
    const missing = await port.checkExportDirectory(join(workDir, 'gibt-es-nicht-2'));
    check(
      'ein fehlender Ordner bleibt „missing", in genau der bisherigen Gestalt',
      missing.ok === false && missing.reason === 'missing' && Object.keys(missing).length === 2,
      JSON.stringify(missing),
    );

    const notSet = await port.checkExportDirectory('   ');
    check(
      'und Leerzeichen bleiben „not_set", ebenso unverändert',
      notSet.ok === false && notSet.reason === 'not_set' && Object.keys(notSet).length === 2,
      JSON.stringify(notSet),
    );

    check(
      'das Zeitbudget der Prüfung steht bei drei Sekunden, nicht bei fünfzehn',
      DIRECTORY_CHECK_BUDGET_MS === 3_000,
      String(DIRECTORY_CHECK_BUDGET_MS),
    );

    // Die Zeitgrenze selbst lässt sich ohne eine tote Netzfreigabe nicht
    // auslösen. Gemessen wird deshalb das, was auch ohne sie zählt: dass ein
    // erreichbarer Ordner **nicht** in die Grenze läuft. Ein Budget, das schon
    // im Normalfall greift, wäre der schlimmere Fehler.
    const started = Date.now();
    await port.checkExportDirectory(workDir);
    const elapsed = Date.now() - started;
    check(
      `ein erreichbarer Ordner antwortet weit innerhalb des Budgets (${elapsed} ms)`,
      elapsed < DIRECTORY_CHECK_BUDGET_MS / 2,
      `${elapsed} ms`,
    );
  }
  // -------------------------------------------------------------------------
  section('11  Zurücksetzen und Ausbuchen: beides oder keines (R-10, T-041)');
  // -------------------------------------------------------------------------
  /*
   * Der Befund, den `proof:openapi` in T-041 gefunden hat, und zwar über den
   * einzigen Weg, auf dem er sichtbar wird: „kein Aufruf des Durchlaufs endet
   * mit 5xx".
   *
   * `trg_time_entry_exported_needs_provenance` (Migration 0006) suchte die
   * jüngste Protokollzeile mit `ORDER BY occurred_at DESC, id DESC`. Beide
   * Teile tragen nicht: `occurred_at` hat Sekundenauflösung, und `id` ist eine
   * UUIDv7 aus Zufallsbytes — innerhalb einer Millisekunde ist ihre
   * Reihenfolge ein Münzwurf. In dreißig Durchläufen schlug „nicht abrechnen"
   * siebenmal fehl, **und** die bereits eingefügte Protokollzeile blieb
   * stehen: ein Protokoll, das „nicht abgerechnet" sagt, und eine Buchung, die
   * weiter offen ist und in den nächsten Export läuft.
   *
   * Behoben mit Migration 0007 (`rowid` statt `id`) und einem Sicherungspunkt
   * im Adapter. Dieser Abschnitt misst beides, und er misst es **oft**: Ein
   * einzelner Durchgang wäre in drei von vier Fällen auch vorher grün gewesen.
   */
  {
    const RUNDEN = 40;
    let fehlgeschlagen = 0;
    let verwaisteZeilen = 0;
    let falscherSchluessel = 0;

    for (let runde = 0; runde < RUNDEN; runde += 1) {
      const { database, context, entries } = await freshContext();
      const id = entries[0];

      // Drei Protokollzeilen derselben Buchung, alle im selben Zeitstempel:
      // ausbuchen, zurücksetzen, wieder ausbuchen.
      const jetzt = clock.now();
      const ausbuchen = () =>
        context.transactions.inTransaction((unit) =>
          unit.export.markNotBilled({ timeEntryId: id, actor: 't.beispiel', reason: 'K', now: jetzt }),
        );
      const zuruecksetzen = () =>
        context.transactions.inTransaction((unit) =>
          unit.export.resetStatus({ timeEntryId: id, actor: 't.beispiel', reason: 'R', now: jetzt }),
        );

      await ausbuchen();
      await zuruecksetzen();
      const zweites = await ausbuchen();

      const zustand = await context.transactions.inTransaction(async (unit) => {
        const protokoll = await unit.export.audit({ timeEntryId: id }, { limit: 100 });
        const buchung = await unit.timeEntries.load(id);
        return { zeilen: protokoll.items.length, status: buchung?.exportStatus ?? '?' };
      });

      if (!zweites.ok) {
        fehlgeschlagen += 1;
        if (zweites.error.code === 'storage_error') falscherSchluessel += 1;
      }
      // Die Zusage: entweder drei Zeilen und 'exported', oder zwei Zeilen und
      // 'open'. Alles dazwischen ist eine Protokollzeile ohne Wirkung.
      const stimmig =
        (zustand.zeilen === 3 && zustand.status === 'exported') ||
        (zustand.zeilen === 2 && zustand.status === 'open');
      if (!stimmig) verwaisteZeilen += 1;

      database.close();
    }

    check(
      `„nicht abrechnen" scheitert nicht mehr an der Reihenfolge zweier Zeilen derselben Sekunde (${RUNDEN} Runden)`,
      fehlgeschlagen === 0,
      `${fehlgeschlagen} von ${RUNDEN} fehlgeschlagen`,
    );
    check(
      'und in keiner Runde bleibt eine Protokollzeile ohne Statuswechsel zurück (R-10)',
      verwaisteZeilen === 0,
      `${verwaisteZeilen} von ${RUNDEN} mit verwaister Zeile`,
    );
    check(
      'ein Fehlschlag käme als fachlicher Schlüssel und nicht als storage_error',
      falscherSchluessel === 0,
      `${falscherSchluessel} von ${RUNDEN}`,
    );

    /*
     * Und die Ursache selbst, nicht nur ihre Wirkung: Der Trigger sortiert nach
     * `id`, also müssen Kennungen aufsteigen — auch die zwanzigtausend, die in
     * derselben Millisekunde entstehen. Bis T-041 taten sie das nicht (zwölf
     * Zufallsbits hinter der Version), und der Kopf von `ids.ts` versprach es
     * trotzdem. Diese Zeile ist die Probe auf das Versprechen.
     */
    const kennungen = [];
    for (let i = 0; i < 20_000; i += 1) kennungen.push(uuidv7());
    const absteigend = kennungen.filter((wert, i) => i > 0 && wert <= kennungen[i - 1]).length;
    check(
      'Kennungen steigen auch innerhalb einer Millisekunde (RFC 9562 6.2, 20.000 Stück)',
      absteigend === 0,
      `${absteigend} nicht aufsteigend`,
    );
    check(
      'und sie sind trotzdem alle verschieden',
      new Set(kennungen).size === kennungen.length,
    );

    // Und die Gegenprobe zum Sicherungspunkt: Wer eine bereits offene Buchung
    // zurücksetzt, bekommt einen Fehlschlag **und** keine Protokollzeile.
    const { database, context, entries } = await freshContext();
    const offen = entries[1];
    const abgelehnt = await context.transactions.inTransaction((unit) =>
      unit.export.resetStatus({
        timeEntryId: offen,
        actor: 't.beispiel',
        reason: 'R',
        now: clock.now(),
      }),
    );
    const zeilen = await context.transactions.inTransaction((unit) =>
      unit.export.audit({ timeEntryId: offen }, { limit: 10 }),
    );
    check(
      'eine bereits offene Buchung zurückzusetzen wird abgewiesen',
      abgelehnt.ok === false && abgelehnt.error.code === 'export_status_unchanged',
      JSON.stringify(abgelehnt),
    );
    check(
      'und hinterlässt keine Protokollzeile',
      zeilen.items.length === 0,
      `${zeilen.items.length} Zeilen`,
    );
    database.close();
  }
  // -------------------------------------------------------------------------
  section('12  Migration 0007 — die Reihenfolge des Protokolls kennt die Datenbank (R-10)');
  // -------------------------------------------------------------------------
  /*
   * Abschnitt 11 misst die **Wirkung**: „nicht abrechnen" schlägt nicht mehr
   * fehl. Er wäre aber auch grün, wenn allein der Zähler in `ids.ts` trüge und
   * Migration 0007 wieder verschwände — denn dann stiegen die Kennungen, und
   * `ORDER BY id DESC` läge zufällig richtig.
   *
   * Das ist genau die Abhängigkeit, die 0007 aufheben soll: Eine
   * Integritätsprüfung der Datenbank darf nicht am Kennungsgenerator der
   * Anwendung hängen. Wer `IdSource` austauscht, hebt sie sonst auf, ohne
   * davon zu erfahren.
   *
   * Dieser Abschnitt setzt den Generator deshalb ausdrücklich **außer Kraft**:
   * Er schreibt die Protokollzeilen mit der Hand und wählt die Kennungen so,
   * dass ihre Sortierung der Einfügereihenfolge widerspricht. Danach entscheidet
   * sich, welche der beiden Größen der Trigger wirklich liest.
   */
  {
    // Zwei Paare, weil beide Fälle im selben Bestand laufen und `export_audit.id`
    // eindeutig ist. Innerhalb eines Paares ist „klein" kleiner als „groß" —
    // mehr braucht der Vergleich nicht.
    const KLEIN = ['00000000-0000-7000-8000-000000000001', '00000000-0000-7000-8000-000000000002'];
    const GROSS = ['ffffffff-ffff-7fff-bfff-fffffffffffe', 'ffffffff-ffff-7fff-bfff-ffffffffffff'];
    const ZEIT = '2026-01-15T12:00:00Z';

    const { database, context, entries } = await freshContext();
    const conn = database.connection;

    const trigger =
      conn
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = 'trg_time_entry_exported_needs_provenance'",
        )
        .get()?.sql ?? '';
    check(
      'der Trigger ordnet nach rowid und nicht nach der Kennung',
      /rowid DESC/.test(trigger) && !/,\s*id DESC/.test(trigger),
      trigger.replace(/\s+/g, ' ').slice(0, 120),
    );

    /** Schreibt eine Protokollzeile mit vorgegebener Kennung, am Port vorbei. */
    const protokollzeile = (id, timeEntryId, event) =>
      conn
        .prepare(
          `INSERT INTO export_audit
             (id, time_entry_id, event, previous_status, new_status,
              export_run_id, export_run_group_id, actor, reason, occurred_at)
           VALUES (?, ?, ?, ?, ?, NULL, NULL, 't.beispiel', '', ?)`,
        )
        .run(
          id,
          timeEntryId,
          event,
          event === 'reset' ? 'exported' : 'open',
          event === 'reset' ? 'open' : 'exported',
          ZEIT,
        );

    /** Der Statuswechsel, den der Trigger bewacht: ohne mitzählenden Lauf. */
    const ausbuchenVersuchen = (timeEntryId) => {
      try {
        conn
          .prepare(
            "UPDATE time_entry SET export_status = 'exported', updated_at = ? WHERE id = ? AND export_status = 'open'",
          )
          .run(ZEIT, timeEntryId);
        return null;
      } catch (fehler) {
        return String(fehler?.message ?? fehler);
      }
    };

    // Fall A — zuletzt eingefügt ist 'not_billed', trägt aber die **kleinere**
    // Kennung. Nach Einfügereihenfolge ist der Wechsel belegt, nach Kennung
    // nicht. Der Trigger muss ihn zulassen.
    const a = entries[0];
    protokollzeile(GROSS[0], a, 'reset');
    protokollzeile(KLEIN[0], a, 'not_billed');
    const fehlerA = ausbuchenVersuchen(a);
    check(
      'die zuletzt eingefügte Zeile zählt, auch wenn ihre Kennung die kleinere ist',
      fehlerA === null,
      fehlerA ?? '',
    );

    // Fall B — die Gegenprobe, ohne die Fall A nichts belegte: Ein Trigger, der
    // gar nicht mehr prüft, wäre in A ebenfalls grün. Hier ist die zuletzt
    // eingefügte Zeile 'reset' und trägt die **größere** Kennung; nach
    // Einfügereihenfolge ist der Wechsel unbelegt, nach Kennung wäre er belegt.
    // Der Trigger muss ihn abweisen.
    const b = entries[1];
    protokollzeile(KLEIN[1], b, 'not_billed');
    protokollzeile(GROSS[1], b, 'reset');
    const fehlerB = ausbuchenVersuchen(b);
    check(
      'und eine ältere Ausbuchung mit größerer Kennung rechtfertigt keinen Wechsel',
      fehlerB !== null && fehlerB.includes('export_status_not_settable'),
      fehlerB ?? 'kein Abbruch',
    );

    const zustand = conn
      .prepare('SELECT id, export_status FROM time_entry WHERE id IN (?, ?)')
      .all(a, b);
    check(
      'Fall A steht danach auf "exported", Fall B unverändert auf "open"',
      zustand.find((row) => row.id === a)?.export_status === 'exported' &&
        zustand.find((row) => row.id === b)?.export_status === 'open',
      JSON.stringify(zustand),
    );

    database.close();
  }

  // -------------------------------------------------------------------------
  section('13  Sicherungspunkte — die halbe Änderung bleibt nicht stehen (T-047)');
  // -------------------------------------------------------------------------
  /*
   * Derselbe Bau wie der Wettlauf aus T-041, nur an anderen Tischen.
   *
   * Ein fachlicher Fehlschlag ist im Adapter ein **Wert** und kein Wurf; die
   * Transaktionsklammer nimmt aber nur bei einem Wurf zurück. Wer in einer
   * Methode zwei Anweisungen schreibt und den Fehlschlag der zweiten als Wert
   * meldet, hinterlässt die erste — festgeschrieben, in einer Klammer, die das
   * ausschließen sollte.
   *
   * T-047 hat sieben solche Stellen gefunden. Dieser Abschnitt misst die drei,
   * an denen der Schaden bleibt und sichtbar ist: ein Bestand ohne
   * Standardspalte, ein Todo ohne Tags, ein halber Exportlauf.
   */
  {
    // 13.1 — Kanban-Spalte: `isDefault` setzen und gleichzeitig auf einen
    // vergebenen Namen umbenennen. Die erste Anweisung räumt **alle**
    // Standardmarken ab, die zweite scheitert am eindeutigen Index. Ohne
    // Sicherungspunkt hätte der Bestand danach keine Standardspalte mehr, und
    // `defaultStatus()` würfe bei jedem neuen Todo.
    {
      const { database, context } = await freshContext();
      const vorher = await context.transactions.inTransaction((unit) => unit.statuses.list());
      const standard = vorher.find((spalte) => spalte.isDefault);
      const andere = vorher.find((spalte) => !spalte.isDefault);

      const abgelehnt = await context.transactions.inTransaction((unit) =>
        unit.statuses.update(andere.id, { name: standard.name, isDefault: true }, clock.now()),
      );
      const nachher = await context.transactions.inTransaction((unit) => unit.statuses.list());

      check(
        'eine Spalte auf einen vergebenen Namen umzubenennen wird abgewiesen',
        abgelehnt.ok === false && abgelehnt.error.code === 'name_conflict',
        JSON.stringify(abgelehnt),
      );
      check(
        'und der Bestand hat danach weiterhin genau eine Standardspalte',
        nachher.filter((spalte) => spalte.isDefault).length === 1,
        JSON.stringify(nachher.map((s) => [s.name, s.isDefault])),
      );
      check(
        'und zwar dieselbe wie vorher',
        nachher.find((spalte) => spalte.isDefault)?.id === standard.id,
      );
      database.close();
    }

    // 13.2 — Kanban-Spalte anlegen mit vergebenem Namen. Vorher rücken alle
    // Spalten ab der Zielposition eine weiter; das INSERT scheitert. Ohne
    // Sicherungspunkt bliebe das Brett verrutscht.
    {
      const { database, context } = await freshContext();
      const vorher = await context.transactions.inTransaction((unit) => unit.statuses.list());

      const abgelehnt = await context.transactions.inTransaction((unit) =>
        unit.statuses.create(vorher[0].name, 1, clock.now()),
      );
      const nachher = await context.transactions.inTransaction((unit) => unit.statuses.list());

      check(
        'eine Spalte mit vergebenem Namen anzulegen wird abgewiesen',
        abgelehnt.ok === false && abgelehnt.error.code === 'name_conflict',
        JSON.stringify(abgelehnt),
      );
      check(
        'und keine einzige Position ist dabei verrutscht',
        JSON.stringify(nachher.map((s) => [s.id, s.position])) ===
          JSON.stringify(vorher.map((s) => [s.id, s.position])),
        JSON.stringify(nachher.map((s) => [s.name, s.position])),
      );
      database.close();
    }

    // 13.3 — Todo verschieben und dabei ein Tag setzen, das es nicht gibt.
    // Erst wandert das Todo, dann werden die Tags ersetzt; das INSERT scheitert
    // an der Fremdschlüsselbedingung. Ohne Sicherungspunkt stünde das Todo in
    // der neuen Spalte und hätte **alle** Tags verloren — und mit ihnen seine
    // Pool-Zugehörigkeit, die aus ihnen abgeleitet wird (A-3.4).
    {
      const { database, context, todoId } = await freshContext();
      const ordner = await context.transactions.inTransaction((unit) =>
        unit.folders.create(null, 'Kunden', clock.now()),
      );
      const tag = await context.transactions.inTransaction((unit) =>
        unit.tags.create(ordner.value.id, 'Muster GmbH', null, clock.now()),
      );
      await context.transactions.inTransaction((unit) =>
        unit.todos.update(todoId, { tagIds: [tag.value.id], now: clock.now() }),
      );

      const vorher = await context.transactions.inTransaction((unit) => unit.todos.load(todoId));
      const spalten = await context.transactions.inTransaction((unit) => unit.statuses.list());
      const ziel = spalten.find((spalte) => spalte.id !== vorher.statusId);

      const abgelehnt = await context.transactions.inTransaction((unit) =>
        unit.todos.update(todoId, {
          statusId: ziel.id,
          tagIds: [tag.value.id, '01931000-0000-7000-8000-00000000dead'],
          now: clock.now(),
        }),
      );
      const nachher = await context.transactions.inTransaction((unit) => unit.todos.load(todoId));

      check(
        'ein Todo auf ein Tag zu setzen, das es nicht gibt, wird abgewiesen',
        abgelehnt.ok === false,
        JSON.stringify(abgelehnt),
      );
      check(
        'und das Todo steht danach unverändert in seiner alten Spalte',
        nachher.statusId === vorher.statusId,
        `${vorher.statusId} → ${nachher.statusId}`,
      );
      check(
        'und hat seine Tags noch',
        nachher.tagIds.length === 1 && nachher.tagIds[0] === tag.value.id,
        JSON.stringify(nachher.tagIds),
      );
      database.close();
    }

    // 13.4 — Der Exportlauf selbst. Zwei Tagesgruppen mit demselben Todo am
    // selben Tag verletzen `ux_export_run_group` — mitten in der Schleife, nach
    // dem ersten `INSERT INTO export_run` und nach dem ersten Markieren. Ohne
    // Sicherungspunkt bliebe ein Lauf ohne Datei stehen, mit halb markierten
    // Buchungen: genau der Zustand, den A-8.8 ausschließt.
    {
      const { database, context, todoId, entries } = await freshContext();
      const gruppe = (timeEntryId) => ({
        todoId,
        day: '2026-01-15',
        seconds: 600,
        quarters: 1,
        entries: [{ timeEntryId, durationSeconds: 600 }],
      });

      const abgelehnt = await context.transactions.inTransaction((unit) =>
        unit.export.recordRun({
          templateId: '01931000-0000-7000-8000-0000000000f1',
          templateSnapshot: { fields: [] },
          filePath: join(exportDir, 'niemals.json'),
          fileSha256: 'a'.repeat(64),
          bytes: 1,
          roundingMode: 'up',
          windowsUser: 't.beispiel',
          now: clock.now(),
          groups: [gruppe(entries[0]), gruppe(entries[1])],
        }),
      );

      const zustand = await stateOf(context);
      check(
        'ein Lauf mit derselben Tagesgruppe zweimal wird abgewiesen',
        abgelehnt.ok === false,
        JSON.stringify(abgelehnt),
      );
      check(
        'und hinterlässt keinen Exportlauf',
        zustand.runCount === 0,
        `${zustand.runCount} Läufe`,
      );
      check(
        'und keine markierte Buchung und keine Protokollzeile',
        zustand.entries.every((eintrag) => eintrag.status === 'open') && zustand.auditCount === 0,
        JSON.stringify(zustand),
      );
      database.close();
    }
  }

} finally {
  await rm(workDir, { recursive: true, force: true });
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen.`);
if (failed > 0) {
  console.log(`Fehlgeschlagen: ${failures.join(', ')}`);
  process.exit(1);
}
