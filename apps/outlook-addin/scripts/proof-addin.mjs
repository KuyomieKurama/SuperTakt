/**
 * Takt — der ausführbare Nachweis des Outlook-Add-ins (T-019).
 *
 * ## Warum es diese Datei gibt
 *
 * Ein Office-Add-in lässt sich hier nicht in Outlook starten. Alles, was
 * *nicht* Outlook ist, lässt sich aber ausführen — und genau das passiert hier:
 * Erkennung der Call-Nummer einschließlich des harten Abbruchs, die
 * Duplikatregel, die Tokenbehandlung, der API-Zugang und die Add-in-Routen des
 * lokalen Dienstes laufen gegen Attrappen, nicht gegen einen Absatz im Bericht.
 * Eine Zusicherung, die niemand ausführt, ist eine Behauptung.
 *
 * **Eine Ausnahme, seit T-061:** Abschnitt 11c fährt gegen eine echte,
 * migrierte SQLite-Datenbank im Arbeitsspeicher. Die Frage „ergeben acht
 * gleichzeitige Anfragen ein Tag oder zwei?" hängt an der Reihung der
 * Transaktionen und an einem eindeutigen Index. Eine Attrappe bildet beides
 * nach — und könnte es auch anders nachbilden; ihre Antwort wäre dann eine
 * Aussage über die Attrappe. Der Abschnitt braucht keinen Port und keinen
 * Kindprozess, dieser Nachweis läuft weiterhin neben allen anderen.
 *
 * Aufruf: `pnpm --filter @takt/outlook-addin proof:addin`
 *
 * ## Was hier **nicht** nachgewiesen wird
 *
 * Alles, was Outlook selbst tut: dass `Office.onReady` auslöst, dass
 * `item.body.getAsync` den Text liefert, dass das Manifest von Outlook
 * angenommen wird, dass WebView2 einen Modul-Worker startet und ihn auf
 * `terminate()` beendet. Diese Punkte stehen im Bericht als ungeprüft und
 * gehören auf einen Windows-Rechner mit Outlook.
 */

import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// --- Prüflinge: das Add-in ------------------------------------------------
import { checkPattern } from '../src/callnumber/pattern.ts';
import { REJECTION_LABEL } from '../src/callnumber/labels.ts';
import { PATTERN_CATALOG, DEFAULT_PATTERN } from '../src/callnumber/catalog.ts';
import { createTimedEvaluator } from '../src/callnumber/evaluate.ts';
import { detectCallNumber } from '../src/callnumber/detect.ts';
import { runPattern } from '../src/callnumber/run.ts';
import { decideLookup, describeOffers } from '../src/duplicate/rule.ts';
import {
  REOPEN_HINT,
  bookingOutcome,
  reopenOutcome,
  reopenPreview,
} from '../src/duplicate/reopen.ts';
import { createSettingsStore, describeToken, looksLikeToken } from '../src/settings/store.ts';
import { createApiClient } from '../src/api/client.ts';
import { flattenTagTree, filterTags } from '../src/tags/tree.ts';
import {
  addPendingTagName,
  describeNewTag,
  removePendingTagName,
} from '../src/tags/new-name.ts';
import { prepareNote, suggestTitle } from '../src/office/mail.ts';

// --- Prüflinge: die Add-in-Routen des lokalen Dienstes ---------------------
// Bewusst über einen relativen Pfad und nicht über eine Paketabhängigkeit: Der
// Aufgabenbereich soll `@takt/local-api` nicht in seiner Abhängigkeitsliste
// führen. Ein Browserbündel, das den Dienst importieren kann, importiert ihn
// irgendwann.
import { mountAddinRoutes } from '../../local-api/src/routes/addin/index.ts';

/*
 * --- Prüflinge: die **echte** Speicherung und der **andere** Weg (T-061) ----
 *
 * Zwei Importe, die dieser Nachweis bis T-061 nicht brauchte, und beide stehen
 * hier aus demselben Grund: Die Frage „ergeben acht gleichzeitige Anfragen ein
 * Tag oder zwei?" lässt sich an einer Attrappe **nicht** beantworten. Sie hängt
 * an der Reihung der Transaktionen und an einem eindeutigen Index — beides
 * Eigenschaften, die eine Attrappe nachbildet und damit auch anders nachbilden
 * könnte. Abschnitt 11 fährt deshalb einen Teil seiner Prüfungen gegen eine
 * echte, migrierte SQLite-Datenbank im Arbeitsspeicher.
 *
 * Kein Port, kein Kindprozess: `openDatabase(':memory:')` und derselbe Router.
 * Damit läuft dieser Nachweis weiterhin neben allen anderen (die belegen
 * Port 17843).
 *
 * `createTodo` aus den Anwendungsfällen der Hauptanwendung ist der **Vergleich**:
 * Derselbe Tagname geht einmal über `POST /addin/todos` und einmal über den Weg
 * der Hauptanwendung, gegen dieselbe Datenbank. Bleibt am Ende ein Tag, sagen
 * beide Wege dasselbe. Das ist die Messung gegen den Befund C-03 — dieselbe
 * Handlung, zwei Ergebnisse.
 *
 * Bis T-064 war sie nötig, weil die Auflösung der Tagnamen zweimal im Baum
 * stand. Seit T-064 rufen beide Wege dieselbe Funktion auf
 * (`usecases/tag-names.ts`), und der Vergleich prüft trotzdem weiter — nur
 * etwas anderes: nicht mehr, ob zwei Fassungen übereinstimmen, sondern ob die
 * beiden **Aufrufer** es tun. Sie sind nicht gleich. Der eine Weg nimmt
 * `tagIds` und `tagNames` und ergänzt Standard-Tags, der andere kommt aus der
 * Oberfläche; nur das Stück dazwischen ist geteilt. Ein Aufrufer, der die
 * Namen vor dem Aufruf anders behandelt — ungeprüft, in anderer Reihenfolge,
 * außerhalb der Transaktion —, bekommt hier wieder zwei Tags. Genau das war
 * C-03.
 *
 * Beide Importe gehen über relative Pfade und nicht über Paketnamen: Der
 * Aufgabenbereich soll weder `@takt/local-api` noch `@takt/storage` in seiner
 * Abhängigkeitsliste führen. Ein Browserbündel, das den Dienst oder die
 * Datenbank importieren **kann**, importiert sie irgendwann.
 */
import { openDatabase } from '../../../packages/storage/src/sqlite/open.ts';
import { createTodo as createTodoOnMainPath } from '../../local-api/src/usecases/todos.ts';

// --- Prüfling: die eine Fassung der Plausibilisierung (E-045) -------------
// Bis T-028 standen hier zwei Importe — die Fassung des Add-ins und die des
// Dienstes — und ein Wächter, der beide gegen dieselbe Fälletabelle fuhr.
// Beide Fassungen sind entfernt; geprüft wird jetzt die Regel selbst, dort wo
// sie liegt. Über den Paketnamen und nicht über einen Pfad: Das Add-in führt
// `@takt/domain` seit T-028 in seiner Abhängigkeitsliste, und derselbe
// Bezeichner steht im Quelltext des Aufgabenbereichs.
import {
  POOL_RULE_AXIS_IDS,
  POOL_RULE_AXIS_OF_FIELD,
  checkCallNumber,
  matchesPool,
  mayLookUpDuplicates,
  poolMovementSentence,
  tagNameKey,
} from '@takt/domain';

// --- Prüflinge: der Vorlagen-Motor ----------------------------------------
import { fromBase64, toBase64 } from '../../../packages/export/src/base64.ts';
import {
  BUILTIN_EXPORT_TEMPLATE,
  EXPORT_CONDITION_OPERATORS,
  validateExportTemplateField,
} from '../../../packages/export/src/template.ts';
import { renderExportGroup } from '../../../packages/export/src/render.ts';

import {
  AXIS_POOL,
  AXIS_POOLS,
  AXIS_TODO,
  E057_POOLS,
  ID,
  MAIL_MIT_NUMMER,
  MAIL_OHNE_NUMMER,
  PLACEMENT_POOLS,
  buildAxisTodos,
  buildTagTree,
  createFakeStore,
  createMemoryStorage,
} from './fixtures.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(here, '..', 'src');

let passed = 0;
let failed = 0;
let section = '';

const heading = (name) => {
  section = name;
  process.stdout.write(`\n${name}\n${'─'.repeat(name.length)}\n`);
};

const check = (name, fn) => {
  try {
    const result = fn();
    if (result instanceof Promise) {
      throw new Error('check() ist synchron — für asynchrone Prüfungen checkAsync benutzen.');
    }
    passed += 1;
    process.stdout.write(`  ok    ${name}\n`);
  } catch (error) {
    failed += 1;
    process.stdout.write(`  FEHL  ${name}\n        ${String(error?.message ?? error)}\n`);
  }
};

const checkAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`  ok    ${name}\n`);
  } catch (error) {
    failed += 1;
    process.stdout.write(`  FEHL  ${name}\n        ${String(error?.message ?? error)}\n`);
  }
};

/** Alle Quelldateien des Add-ins, für die statischen Prüfungen. */
const sourceFiles = () => {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx|css|html)$/.test(entry)) found.push(full);
    }
  };
  walk(srcRoot);
  found.push(path.join(here, '..', 'index.html'));
  return found;
};

// ===========================================================================
heading('0  Quelltexthygiene — was im Add-in nicht vorkommen darf');
// ===========================================================================

const files = sourceFiles();

check(`${String(files.length)} Quelldateien gefunden`, () => {
  assert.ok(files.length > 15, 'zu wenige Dateien — der Scan greift ins Leere');
});

check('B-2.8/E-019: kein Zugriff auf Office.context.roamingSettings', () => {
  const offenders = files.filter((file) => {
    const text = readFileSync(file, 'utf8');
    // Der Name darf in Kommentaren stehen — die Begründung, warum er nicht
    // benutzt wird, gehört in den Quelltext. Verboten ist der **Zugriff**.
    return /roamingSettings\s*(\.|\[)/.test(text);
  });
  assert.deepEqual(offenders, [], `Zugriff gefunden in: ${offenders.join(', ')}`);
});

check('B-12.1: kein innerHTML, kein dangerouslySetInnerHTML, kein eval, kein new Function', () => {
  const pattern = /dangerouslySetInnerHTML|\.innerHTML|\beval\s*\(|new\s+Function\s*\(/;
  const offenders = files.filter((file) => pattern.test(readFileSync(file, 'utf8')));
  assert.deepEqual(offenders, [], `gefunden in: ${offenders.join(', ')}`);
});

check('B-4.1: run.ts wird ausschließlich aus einem Worker importiert', () => {
  const importers = files.filter((file) => /from\s+'\.\/run\.ts'|from\s+'.*\/run\.ts'/.test(readFileSync(file, 'utf8')));
  const names = importers.map((file) => path.basename(file));
  assert.deepEqual(names, ['worker.ts'], `unerwartete Importeure: ${names.join(', ')}`);
});

check('B-2.4: kein console-Aufruf im Add-in-Quelltext', () => {
  const offenders = files.filter((file) => /\bconsole\.(log|info|warn|error|debug)\s*\(/.test(readFileSync(file, 'utf8')));
  assert.deepEqual(offenders, [], `gefunden in: ${offenders.join(', ')}`);
});

check('A-10.6/E-024: kein roher Farbwert in addin.css', () => {
  const css = readFileSync(path.join(srcRoot, 'styles', 'addin.css'), 'utf8');
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rawColors = withoutComments.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g) ?? [];
  assert.deepEqual(rawColors, [], `rohe Farbwerte: ${rawColors.join(', ')}`);
});

check('C-03/A-2.5: kein Schalter für das Aufheben von „Erledigt" im Add-in', () => {
  // Der Befund aus T-025 in einer Zeile: Ein Kästchen mit der Voreinstellung
  // „aus" hat die Aufhebung freiwillig gemacht, die A-2.5 automatisch nennt.
  // Der Nachweis ist statisch, weil er auch die Wiedereinführung treffen soll
  // und nicht nur den einen Aufruf.
  // Der Name darf im Kommentar stehen — die Begründung, warum es ihn nicht
  // mehr gibt, gehört in den Quelltext. Verboten ist die **Verwendung**.
  const withoutBlockComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
  const offenders = files.filter((file) =>
    /reopenIfDone|setReopen/.test(withoutBlockComments(readFileSync(file, 'utf8'))),
  );
  assert.deepEqual(offenders, [], `Schalter wieder da in: ${offenders.join(', ')}`);

  const pane = readFileSync(path.join(srcRoot, 'ui', 'TaskPane.tsx'), 'utf8');
  const bookingCheckbox = /type="checkbox"/.test(pane);
  assert.equal(bookingCheckbox, false, 'im Aufgabenbereich steht wieder ein Kästchen');
});

/**
 * Quelltext ohne seine Kommentare — für die statischen Prüfungen darunter.
 *
 * Dieselbe Hausregel wie beim Schalter aus C-03 ein paar Zeilen weiter oben:
 * Der Name **darf** im Kommentar stehen, denn die Begründung, warum es etwas
 * nicht mehr gibt, gehört in den Quelltext. Verboten ist die **Verwendung**.
 * Ohne diese Trennung könnte man einen gestrichenen Satz nicht mehr erklären,
 * ohne den eigenen Nachweispfad rot zu machen.
 *
 * Zeilenkommentare nur in TypeScript: In CSS ist `//` kein Kommentar.
 */
const sourceWithoutComments = (file) => {
  const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return /\.tsx?$/.test(file) ? text.replace(/\/\/.*$/gm, '') : text;
};

check('E-058: das Add-in hält keine zweite Fassung des Bewegungssatzes', () => {
  /*
   * Der Befund, der zu E-058 geführt hat, in einer statischen Zeile.
   *
   * Bis T-092 stand der Satz zweimal im Baum — einmal in
   * `apps/outlook-addin/src/duplicate/reopen.ts`, einmal zeichengleich in
   * `apps/web/src/lib/labels.ts` —, und beide Fassungen sind auseinandergelaufen:
   * Die eine kannte `leaves` nicht, die andere nannte eine reine Board-Spalte
   * „Pool". Zwei Abschriften desselben Textes sind zwei Gelegenheiten,
   * Verschiedenes zu behaupten.
   *
   * Geprüft wird deshalb nicht, ob der Wortlaut stimmt — das misst die Domäne —,
   * sondern ob es im Add-in überhaupt eine **zweite Stelle** gibt, die ihn
   * formuliert. Die Satzanfänge stehen als Muster da, weil sie sich zwischen
   * beiden Wortlauten (vor und nach T-093) nicht geändert haben; wer den Satz
   * hier nachbaut, schreibt einen von ihnen hin.
   */
  const satzanfaenge =
    /Es erscheint dann|Es steht jetzt|Es ist zurück in|Es verschwindet dann|Auf dieses Todo passt/;
  const offenders = files.filter((file) => satzanfaenge.test(sourceWithoutComments(file)));
  assert.deepEqual(
    offenders,
    [],
    `der Bewegungssatz wird im Add-in nachgebaut statt gerufen (E-058): ${offenders.join(', ')}`,
  );

  // Und die Gegenprobe zur Gegenprobe: Der Aufgabenbereich **ruft** die
  // Funktion. Ohne sie wäre die Zeile darüber auch dann grün, wenn der Satz
  // gar nicht mehr vorkäme.
  const rufer = files.filter((file) => /poolMovementSentence\s*\(/.test(sourceWithoutComments(file)));
  assert.ok(
    rufer.length >= 2,
    `nur ${String(rufer.length)} Datei(en) rufen poolMovementSentence — der Satz erscheint nirgends mehr`,
  );
});

check('E-058 Absatz 2: „Die Karte bleibt, wo sie ist" ist ersatzlos gestrichen', () => {
  // Der Satz war seit E-055 falsch: Ein Timerstart lässt das
  // Erledigt-Kennzeichen fallen, und die erste Buchung setzt „hat offene
  // Buchungen" — beides ändert die Spalte. Der Nachweis ist statisch, weil er
  // die Wiedereinführung treffen soll und nicht nur den einen Aufruf. Die
  // CSS-Klasse zählt mit: Eine Klasse ohne Element ist die Einladung, den Satz
  // wieder darunterzuschreiben.
  const pattern = /CARD_STAYS|Die Karte bleibt, wo sie ist|effects__aside/;
  const offenders = files.filter((file) => pattern.test(sourceWithoutComments(file)));
  assert.deepEqual(offenders, [], `gefunden in: ${offenders.join(', ')}`);
});

check('E-058 Absatz 1: der Add-in-Dienst wertet keine Poolregel mehr selbst aus', () => {
  /*
   * Die andere Hälfte derselben Entscheidung, eine Schicht tiefer.
   *
   * `routes/addin/service.ts` hielt bis T-092 mit `poolNamer` eine **zweite**
   * Fassung der Rechnung, die die Hauptanwendung ebenfalls anstellt — samt
   * eigenem Zustandstyp, eigenem Bewegungstyp und eigener Regelwache. Genau
   * daran hing der Befund aus R-1 und R-2: Zwei Rechnungen für dieselbe
   * Handlung, und die zweite kannte `leaves` nicht.
   *
   * Seit E-058 Absatz 1 gibt es **eine** Rechnung
   * (`usecases/pool-movement.ts`), und der Add-in-Dienst ruft sie. Wer hier
   * wieder `matchesPool` importiert, baut die zweite Fassung neu — und diese
   * Zeile wird rot, bevor die beiden Antworten auseinanderlaufen können.
   *
   * Der Name darf im Kommentar stehen; verboten ist der **Aufruf**.
   */
  const service = sourceWithoutComments(
    path.join(here, '..', '..', 'local-api', 'src', 'routes', 'addin', 'service.ts'),
  );

  assert.equal(
    /\bmatchesPool\s*\(/.test(service),
    false,
    'der Add-in-Dienst wertet wieder selbst eine Poolregel aus (E-058 Absatz 1)',
  );
  assert.match(
    service,
    /poolMovementNamer/,
    'der Add-in-Dienst fragt den Anwendungsfall nicht mehr — woher kommt die Bewegung?',
  );
});

check('Keine echte Call-Nummer und kein echter Kundenname in den Prüfdaten', () => {
  const fixtures = readFileSync(path.join(here, 'fixtures.mjs'), 'utf8');
  assert.ok(fixtures.includes('erfunden'), 'die Prüfdaten sagen selbst nicht, dass sie erfunden sind');
  // Die reservierten Beispieldomänen aus RFC 2606 — keine erreichbare Adresse.
  const addresses = fixtures.match(/[\w.+-]+@[\w.-]+/g) ?? [];
  for (const address of addresses) {
    assert.match(address, /@example\.(org|com|net)$/, `Adresse außerhalb der Beispieldomänen: ${address}`);
  }
});

// ===========================================================================
heading('1  Der konfigurierbare Ausdruck (A-10.8, B-4.1, B-4.2, B-4.3)');
// ===========================================================================

check('TP-ADDIN-03: fünf ungültige Ausdrücke werden abgelehnt, ohne zu werfen', () => {
  for (const bad of ['TCK-(\\d{6', '[', '(', '\\', '']) {
    const result = checkPattern(bad);
    assert.equal(result.ok, false, `angenommen: ${JSON.stringify(bad)}`);
    assert.ok(result.message.length > 0, 'ohne Meldung abgelehnt');
  }
});

check('B-4.3 Punkt 1: ein Muster ohne Erfassungsgruppe wird abgelehnt', () => {
  const result = checkPattern('TCK-\\d{6}');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no_capture_group');
});

check('B-4.3 Punkt 2: Muster, die auf "" zutreffen, werden abgelehnt', () => {
  for (const wide of ['(.*)', '(\\s*)', '(a?)', '(^)']) {
    const result = checkPattern(wide);
    assert.equal(result.ok, false, `angenommen: ${wide}`);
    assert.equal(result.reason, 'matches_empty', `falscher Grund für ${wide}: ${result.reason}`);
  }
});

check('B-4.3: `.*` und `^` scheitern schon an der fehlenden Erfassungsgruppe', () => {
  assert.equal(checkPattern('.*').reason, 'no_capture_group');
  assert.equal(checkPattern('^').reason, 'no_capture_group');
});

check('B-4.1 Punkt 3: verschachtelte Quantoren werden abgelehnt', () => {
  for (const evil of ['((\\d+)+)[A-Z]', '((a|a)*)$', '((a*)*)b', '(([a-z]{2,}){3,})x']) {
    const result = checkPattern(evil);
    assert.equal(result.ok, false, `angenommen: ${evil}`);
    assert.equal(result.reason, 'catastrophic_shape', `falscher Grund für ${evil}: ${result.reason}`);
  }
});

check('B-4.1 Punkt 5: Rückverweis und Rückschau werden abgelehnt', () => {
  assert.equal(checkPattern('(TCK)-\\1').reason, 'backreference_or_lookbehind');
  assert.equal(checkPattern('(?<=Nr\\.\\s)(\\d{6})').reason, 'backreference_or_lookbehind');
});

check('Vorausschau bleibt zugelassen — sie trägt das Problem nicht', () => {
  assert.equal(checkPattern('TCK-(\\d{6})(?=\\D|$)').ok, true);
});

check('B-4.1 Punkt 4: jedes Muster aus dem angebotenen Vorrat besteht die Prüfung', () => {
  for (const entry of PATTERN_CATALOG) {
    const result = checkPattern(entry.source);
    assert.equal(result.ok, true, `${entry.id} abgelehnt: ${result.message ?? ''}`);
    assert.ok(result.groupCount >= 1, `${entry.id} ohne Erfassungsgruppe`);
  }
  assert.equal(checkPattern(DEFAULT_PATTERN).ok, true, 'der Auslieferungswert selbst fällt durch');
});

check('Ein zu langes Muster wird abgelehnt', () => {
  assert.equal(checkPattern(`(${'a'.repeat(300)})`).reason, 'too_long');
});

// ===========================================================================
heading('2  Plausibilisierung (B-4.3 Punkt 3, B-4.4) — eine Fassung, zwei Aufrufer (E-045)');
// ===========================================================================

const PLAUSIBILITY_CASES = [
  ['TCK-000042', true, null],
  ['C123456', true, null],
  ['2026/0815', true, null],
  ['a.b_c', true, null],
  ['a.b c', false, 'forbidden_characters'],
  ['a;b', false, 'forbidden_characters'],
  ['ab', false, 'too_short'],
  ['', false, 'empty'],
  ['   ', false, 'empty'],
  [null, false, 'empty'],
  [undefined, false, 'empty'],
  [42, false, 'empty'],
  ['x'.repeat(65), false, 'too_long'],
  ['Sehr geehrte Damen und Herren', false, 'forbidden_characters'],
  ['TCK 000042', false, 'forbidden_characters'],
  ['TCK\n000042', false, 'forbidden_characters'],
  ['=SUM(A1)', false, 'forbidden_characters'],
  ['=2+3', false, 'forbidden_characters'],
  // Nur `-` erreicht die Formelprüfung; `=`, `+` und `@` fallen schon am
  // Zeichenvorrat durch. Beide Regeln werden trotzdem geprüft — die Begründung
  // steht in `packages/domain/src/call-number.ts` an der Menge der
  // Formelanfänge.
  ['-2-3', false, 'formula_start'],
  ['-000042', false, 'formula_start'],
  ['+491234', false, 'forbidden_characters'],
  ['@example', false, 'forbidden_characters'],
  ['TCK-000042 ', true, null],
];

check('Die Fälletabelle trifft auf die Fassung der Domäne zu', () => {
  for (const [value, ok, reason] of PLAUSIBILITY_CASES) {
    const result = checkCallNumber(value);
    assert.equal(result.ok, ok, `${JSON.stringify(value)}: erwartet ok=${String(ok)}`);
    if (!ok) assert.equal(result.reason, reason, `${JSON.stringify(value)}`);
  }
});

check('Über 5000 erzeugte Werte: das Urteil ist stabil und die Torfunktion stimmt überein', () => {
  const alphabet = 'AZaz09._/-+= @\t\nä€';
  let seed = 20260901;
  const nextRandom = () => {
    // Kleiner, wiederholbarer Zufall — ein Nachweis, der bei jedem Lauf etwas
    // anderes prüft, ist kein Nachweis. Derselbe Startwert und dasselbe
    // Alphabet wie vor T-028: Es sind Zeichen für Zeichen dieselben 5000
    // Werte, die vorher die beiden Fassungen gegeneinander gefahren haben.
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  for (let round = 0; round < 5000; round += 1) {
    const length = Math.floor(nextRandom() * 12);
    let value = '';
    for (let index = 0; index < length; index += 1) {
      value += alphabet.charAt(Math.floor(nextRandom() * alphabet.length));
    }

    const first = checkCallNumber(value);
    const second = checkCallNumber(value);

    // Ohne `g` im Ausdruck: derselbe Wert muss beim zweiten Aufruf dasselbe
    // Urteil bekommen. Ein globaler Ausdruck behielte `lastIndex` und träfe
    // bei jeder zweiten Prüfung nicht (B-4.4). Das war der eine Fehler, den
    // ein Zusammenlegen zweier Fassungen einschleppen könnte.
    assert.equal(first.ok, second.ok, `nicht wiederholbar bei ${JSON.stringify(value)}`);
    assert.equal(
      first.ok ? first.value : first.reason,
      second.ok ? second.value : second.reason,
      `nicht wiederholbar bei ${JSON.stringify(value)}`,
    );

    // B-4.3 Punkt 4: die Torfunktion der Duplikatsuche ist genau dieses Urteil
    // und keine zweite Meinung darüber.
    assert.equal(mayLookUpDuplicates(value), first.ok, `Tor weicht ab bei ${JSON.stringify(value)}`);

    // Was durchkommt, ist beschnitten und bleibt es. Sonst stünde in der
    // Datenbank ein anderer Wert als der geprüfte (R-15).
    if (first.ok) {
      assert.equal(first.value, first.value.trim(), `nicht beschnitten: ${JSON.stringify(value)}`);
      assert.equal(checkCallNumber(first.value).ok, true, `nicht stabil: ${JSON.stringify(value)}`);
    } else {
      assert.equal(typeof REJECTION_LABEL[first.reason], 'string', `kein Anzeigetext für ${first.reason}`);
    }
  }
});

check('E-045: es gibt keine zweite Fassung der Regel mehr', () => {
  // Der Wächter, der bis T-028 zwei Fassungen gegeneinander fuhr, ist entfallen
  // — er hatte nichts mehr zu vergleichen. An seine Stelle tritt die Frage, die
  // er eigentlich stellte: Ist die Regel wieder abgeschrieben worden?
  //
  // Gesucht wird nach ihren Kennzeichen, nicht nach einem Dateinamen: dem
  // Zeichenvorrat aus B-4.3 Punkt 3 und der Formelprüfung aus B-4.4. Wer die
  // Regel nachbaut, schreibt eines von beidem hin.
  const addinRoutes = path.join(here, '..', '..', 'local-api', 'src', 'routes', 'addin');
  const routeFiles = readdirSync(addinRoutes)
    .filter((entry) => entry.endsWith('.ts'))
    .map((entry) => path.join(addinRoutes, entry));

  // Als Zeichenketten und nicht als Ausdrücke: Der Zeichenvorrat enthält
  // selbst einen Schrägstrich, und ein Muster, das sich beim Hinschreiben
  // selbst beendet, ist die schlechteste Art, eine Regel zu suchen.
  //
  // Der Zeichenvorrat wird nur bis `A-Za-z0-9._` gesucht und nicht vollständig:
  // Wer ihn abschreibt, darf den Schrägstrich maskieren (`\\/`) oder die
  // letzten beiden Zeichen umstellen, ohne dass sich die Regel ändert. Der
  // Anfang ist der Teil, der eine abgeschriebene Fassung verrät.
  const fingerprints = ['A-Za-z0-9._', 'FORMULA_STARTERS'];
  const offenders = [...files, ...routeFiles].filter((file) => {
    const text = readFileSync(file, 'utf8');
    return fingerprints.some((needle) => text.includes(needle));
  });
  assert.deepEqual(offenders, [], `die Regel steht wieder zweimal: ${offenders.join(', ')}`);

  // Gegenprobe: In der Domäne stehen beide Kennzeichen — der Scan sucht also
  // nach etwas, das es gibt, und nicht nach einer Zeichenkette ins Leere.
  const domainSource = readFileSync(
    path.join(here, '..', '..', '..', 'packages', 'domain', 'src', 'call-number.ts'),
    'utf8',
  );
  for (const needle of fingerprints) {
    assert.ok(domainSource.includes(needle), `die Domäne trägt ${needle} nicht`);
  }
});

// ===========================================================================
heading('3  Erkennung aus einer E-Mail (TP-ADDIN-01, TP-ADDIN-10)');
// ===========================================================================

/** Der Auswerter des Nachweispfads: derselbe Ablauf, ein Node-Worker als Kanal. */
const nodeEvaluator = (timeoutMs = 100) =>
  createTimedEvaluator({
    timeoutMs,
    spawn: () => {
      const worker = new Worker(new URL('./regex-worker.mjs', import.meta.url));
      return {
        post: (request) => {
          worker.postMessage(request);
        },
        onMessage: (handler) => {
          worker.on('message', handler);
        },
        onError: (handler) => {
          worker.on('error', (error) => {
            handler(String(error?.message ?? error));
          });
        },
        terminate: () => {
          void worker.terminate();
        },
      };
    },
  });

const evaluator = nodeEvaluator();

await checkAsync('TP-ADDIN-01: TCK-000042 wird über das konfigurierte Muster erkannt', async () => {
  const detection = await detectCallNumber(DEFAULT_PATTERN, MAIL_MIT_NUMMER, evaluator);
  assert.equal(detection.kind, 'match');
  assert.equal(detection.value, 'TCK-000042');
  assert.equal(detection.origin, 'subject', 'der Betreff wird zuerst geprüft');
});

await checkAsync('Ein Treffer nur im Text wird gefunden und als solcher ausgewiesen', async () => {
  const detection = await detectCallNumber(
    DEFAULT_PATTERN,
    { subject: 'Ohne Nummer im Betreff', body: 'Bitte auf TCK-000815 buchen.' },
    evaluator,
  );
  assert.equal(detection.kind, 'match');
  assert.equal(detection.value, 'TCK-000815');
  assert.equal(detection.origin, 'body');
});

await checkAsync('Ohne Nummer: kein Treffer, kein Fehler', async () => {
  const detection = await detectCallNumber(DEFAULT_PATTERN, MAIL_OHNE_NUMMER, evaluator);
  assert.equal(detection.kind, 'no_match');
});

await checkAsync('TP-ADDIN-10: das Muster `.*` erzeugt keinen Treffer, sondern eine Meldung', async () => {
  for (const mail of [MAIL_MIT_NUMMER, MAIL_OHNE_NUMMER]) {
    const detection = await detectCallNumber('.*', mail, evaluator);
    assert.equal(detection.kind, 'pattern_invalid', 'ein `.*` darf nie zu einem Treffer führen');
  }
});

await checkAsync('Ein weites Muster mit Erfassungsgruppe scheitert an der Plausibilisierung', async () => {
  // `(.+)` besteht die Leerprüfung, trifft aber die ganze erste Zeile — und die
  // enthält Leerzeichen. B-4.3 Punkt 3 fängt es.
  const detection = await detectCallNumber('(.+)', MAIL_OHNE_NUMMER, evaluator);
  assert.equal(detection.kind, 'implausible');
  assert.equal(detection.reason, 'forbidden_characters');
});

await checkAsync('B-4.2 Punkt 2: ein ungültiges Muster wird bei der Verwendung abgefangen', async () => {
  const detection = await detectCallNumber('TCK-(\\d{6', MAIL_MIT_NUMMER, evaluator);
  assert.equal(detection.kind, 'pattern_invalid');
  assert.match(detection.message, /nicht gültig/);
});

await checkAsync('B-4.4: derselbe Auswerter liefert bei zehn Aufrufen zehnmal dasselbe', async () => {
  for (let round = 0; round < 10; round += 1) {
    const detection = await detectCallNumber(DEFAULT_PATTERN, MAIL_MIT_NUMMER, evaluator);
    assert.equal(detection.kind, 'match', `Lauf ${String(round)}`);
    assert.equal(detection.value, 'TCK-000042', `Lauf ${String(round)}`);
  }
});

// ===========================================================================
heading('4  Harter Abbruch bei katastrophalem Backtracking (B-4.1 Punkt 1)');
// ===========================================================================

await checkAsync('Ein bösartiges Muster wird nach der Zeitgrenze beendet, statt einzufrieren', async () => {
  // `(a+)+$` auf einer langen Folge von `a` mit abschließendem `!` ist der
  // Lehrbuchfall. `checkPattern` lehnt ihn ab — hier wird die **zweite**
  // Verteidigungslinie geprüft: Der Ausdruck geht am Wächter vorbei
  // unmittelbar in den Auswerter.
  const evil = '(a+)+$';
  const input = `${'a'.repeat(40)}!`;

  assert.equal(checkPattern(evil).ok, false, 'der Wächter hätte ihn abgelehnt — gut so');

  const started = Date.now();
  const outcome = await nodeEvaluator(100)(evil, input);
  const elapsed = Date.now() - started;

  assert.equal(outcome.kind, 'timeout', `erwartet Abbruch, bekommen: ${outcome.kind}`);
  // Sehr großzügige Obergrenze, und das mit Bedacht: Die nachzuweisende
  // Eigenschaft ist „kehrt überhaupt zurück", nicht „ist schnell". Eine enge
  // Schranke machte den Nachweis auf einem ausgelasteten Rechner sporadisch
  // rot, und ein Nachweis, der manchmal fehlschlägt, wird irgendwann
  // ausgeschaltet statt gelesen.
  assert.ok(elapsed < 30_000, `zu spät zurückgekehrt: ${String(elapsed)} ms`);
});

await checkAsync('Ein gutartiges Muster über 20 000 Zeichen bleibt weit unter der Grenze', async () => {
  const long = `${'Guten Tag. '.repeat(1800)}TCK-000042`;
  const started = Date.now();
  const outcome = await nodeEvaluator(100)(DEFAULT_PATTERN, long);
  const elapsed = Date.now() - started;
  assert.equal(outcome.kind, 'match', 'ein harmloses Muster darf nie in die Zeitgrenze laufen');
  assert.equal(outcome.group, 'TCK-000042');
  assert.ok(elapsed < 30_000, `unerwartet langsam: ${String(elapsed)} ms`);
});

check('B-4.1 Punkt 2: der Auswerter kürzt auf 20 000 Zeichen', () => {
  // Nachgewiesen an der Schnittstelle: `runPattern` bekommt bereits den
  // gekürzten Text, weil `createTimedEvaluator` vor dem Senden schneidet.
  const seen = [];
  const evaluate = createTimedEvaluator({
    spawn: () => {
      let handler = () => {};
      return {
        post: (request) => {
          seen.push(request.text.length);
        },
        onMessage: (fn) => {
          handler = fn;
          // Bereitschaft sofort melden, wie es ein Worker täte.
          handler({ kind: 'ready' });
        },
        onError: () => {},
        terminate: () => {},
      };
    },
    timeoutMs: 1,
  });
  void evaluate('(x)', 'y'.repeat(50_000));
  assert.deepEqual(seen, [20_000]);
});

await checkAsync('Die Zeitgrenze läuft erst ab der Bereitschaft des Workers', async () => {
  // Ohne diese Trennung liefe die Frist über den Start eines Workers, und ein
  // ausgelasteter Rechner meldete „Erkennung abgebrochen" für ein harmloses
  // Muster. Der Nachweis hat genau das einmal getan — deshalb steht die
  // Prüfung hier.
  const fristen = [];
  const evaluate = createTimedEvaluator({
    spawn: () => ({
      post: () => {},
      onMessage: (fn) => {
        setTimeout(() => {
          fn({ kind: 'ready' });
        }, 0);
      },
      onError: () => {},
      terminate: () => {},
    }),
    timeoutMs: 100,
    startupTimeoutMs: 5000,
    schedule: (callback, ms) => {
      fristen.push(ms);
      const handle = setTimeout(callback, ms);
      return {
        cancel: () => {
          clearTimeout(handle);
        },
      };
    },
  });

  const outcome = await evaluate('(x)', 'irgendetwas');
  assert.equal(outcome.kind, 'timeout');
  assert.deepEqual(fristen, [5000, 100], 'erst die Startfrist, dann die Auswertungsfrist');
});

check('runPattern liefert Gruppe 1, nicht den Gesamttreffer (B-4.3 Punkt 1)', () => {
  const result = runPattern({ id: 1, source: 'TCK-(\\d{6})', text: 'Vorgang TCK-000042 bitte' });
  assert.equal(result.kind, 'match');
  assert.equal(result.group, '000042', 'es wurde der Gesamttreffer genommen');
});

check('Der Auslieferungswert fasst die vollständige Kennung in Gruppe 1', () => {
  // Der naheliegende Fehler: `TCK-(\\d{6})` liefert `000042`, und in der
  // Rechnung stünde eine Nummer ohne ihr Kürzel. Der Vorrat klammert deshalb
  // die ganze Kennung.
  const result = runPattern({ id: 1, source: DEFAULT_PATTERN, text: 'Vorgang TCK-000042 bitte' });
  assert.equal(result.group, 'TCK-000042');
});

// ===========================================================================
heading('5  Duplikatregel (A-10.9, R-15, TP-ADDIN-11)');
// ===========================================================================

check('TP-ADDIN-11: eine leere Call-Nummer führt nie zu einer Abfrage', () => {
  for (const empty of ['', '   ', null, undefined]) {
    const decision = decideLookup(empty);
    assert.equal(decision.kind, 'skip', `abgefragt worden wäre: ${JSON.stringify(empty)}`);
    assert.equal(decision.reason, 'empty');
  }
});

check('Eine unplausible Call-Nummer führt nie zu einer Abfrage', () => {
  for (const bad of ['ab', 'Sehr geehrte Damen', '=2+3', 'x'.repeat(65)]) {
    assert.equal(decideLookup(bad).kind, 'skip', `abgefragt worden wäre: ${bad}`);
  }
});

check('Eine plausible Nummer wird beschnitten weitergegeben', () => {
  const decision = decideLookup('  TCK-000042  ');
  assert.equal(decision.kind, 'lookup');
  assert.equal(decision.callNumber, 'TCK-000042');
});

check('R-15: das Angebot trägt Titel und Call-Nummer, nicht nur eine Kennung', () => {
  const offers = describeOffers([
    {
      id: ID.todoStoerung,
      title: 'Lüftung Notbetrieb',
      callNumber: 'TCK-000042',
      statusId: ID.statusBacklog,
      tagIds: [ID.tagMusterbetrieb],
      completedAt: null,
      openSeconds: 2700,
      exportedSeconds: 3600,
      poolMovement: { appears: ['Wartung Nord'], enters: [], leaves: [] },
    },
  ]);
  assert.equal(offers.length, 1);
  assert.equal(offers[0].title, 'Lüftung Notbetrieb');
  assert.equal(offers[0].callNumber, 'TCK-000042');
  assert.match(offers[0].summary, /0:45 h offen/);
  assert.match(offers[0].summary, /1:00 h bereits exportiert/, 'die abgerechnete Zeit fehlt im Angebot');
});

check('Ein Treffer ohne plausible Call-Nummer wird gar nicht erst angeboten', () => {
  const offers = describeOffers([
    {
      id: ID.todoTurnus,
      title: 'Ohne Nummer',
      callNumber: null,
      statusId: ID.statusBacklog,
      tagIds: [],
      completedAt: null,
      openSeconds: 0,
      exportedSeconds: 0,
      poolMovement: { appears: [], enters: [], leaves: [] },
    },
  ]);
  assert.deepEqual(offers, []);
});

check('Ein erledigtes Todo wird im Angebot als solches ausgewiesen (A-2.4)', () => {
  const offers = describeOffers([
    {
      id: ID.todoTurnus,
      title: 'Abgeschlossene Wartung',
      callNumber: 'TCK-000815',
      statusId: ID.statusDone,
      tagIds: [ID.tagTurnuswartung],
      completedAt: '2026-02-01T10:00:00Z',
      openSeconds: 0,
      exportedSeconds: 0,
      poolMovement: { appears: ['Wartung Nord'], enters: [], leaves: [] },
    },
  ]);
  assert.equal(offers[0].isDone, true);
  assert.match(offers[0].summary, /Erledigt/);
  assert.deepEqual(
    offers[0].poolMovement.appears,
    ['Wartung Nord'],
    'ohne die Bewegung kann das Angebot nicht sagen, wo das Todo nach dem Buchen steht',
  );
});

// ---------------------------------------------------------------------------
// C-03 (T-025) — die Aufhebung ist automatisch und wird angesagt
// ---------------------------------------------------------------------------

check('C-03: die Trefferliste kündigt die Aufhebung an, statt sie zur Wahl zu stellen', () => {
  assert.match(REOPEN_HINT, /automatisch/, 'der Hinweis sagt nicht, dass es von selbst geschieht');
  assert.equal(/sofern|wenn du|ausdrücklich|Kästchen/.test(REOPEN_HINT), false, `bedingt formuliert: ${REOPEN_HINT}`);
});

/*
 * ---------------------------------------------------------------------------
 * Wie hier seit T-092 gegen den Satz geprüft wird (E-058)
 * ---------------------------------------------------------------------------
 *
 * Nicht mehr gegen eine **Abschrift** des Wortlauts, sondern gegen die
 * **Funktion**: `poolMovementSentence` aus `@takt/domain` ist die eine Quelle,
 * und die Erwartung entsteht aus demselben Aufruf mit denselben Argumenten.
 *
 * Das klingt nach einer Prüfung, die sich selbst bestätigt, und ist das
 * Gegenteil. Gemessen wird nicht, welchen Satz die Domäne formuliert — das
 * messen die Einheitentests dort, zeichengenau gegen den Wortlaut aus E-058
 * Punkt 4. Gemessen wird, ob der Aufgabenbereich **denselben** Satz zeigt: mit
 * demselben Anlass (`'reopen'` gegen `'booking'` — sie zählen verschiedene
 * Listen auf), derselben Zeitform und derselben Bewegung. Eine Abschrift im
 * Add-in, ein vertauschter Anlass, eine verlorene Liste unterwegs — jeder
 * dieser drei Fehler macht die Zeile rot, und keiner von ihnen wird grün, nur
 * weil die Domäne ihren Wortlaut ändert.
 *
 * Der Wortlaut selbst wird hier deshalb **nicht** buchstabiert. Er hat sich mit
 * T-093 geändert (kein Gattungswort mehr vor dem Namen), und eine Abschrift
 * hätte genau das zu einer roten Zeile im Add-in gemacht — für eine Änderung,
 * die in einer Entscheidung steht und in keiner Datei dieses Teilbaums.
 *
 * Was hier trotzdem buchstabiert wird, sind die Eigenschaften, die **unabhängig
 * vom Wortlaut** gelten müssen: dass Namen einzeln genannt und nicht gezählt
 * werden, dass der Buchungssatz keine Rückkehr behauptet, dass es ein Satz
 * bleibt und nicht zwei, und dass ohne Bewegung gar keiner entsteht.
 */

check('I-05: die Ankündigung vor dem Buchen nennt alle drei Wirkungen und die Pools einzeln', () => {
  const bewegung = { appears: ['Wartung Nord', 'Offene Störungen'], enters: [], leaves: [] };
  const notice = reopenPreview(15, bewegung);

  assert.equal(notice.effects.length, 3, 'es sind nicht drei Wirkungen');
  assert.match(notice.effects[0], /15 Minuten/, 'die Buchung selbst fehlt');
  assert.match(notice.effects[1], /automatisch aufgehoben/, 'die Aufhebung fehlt');

  // Die dritte Wirkung ist **die Funktion** und keine Abschrift daneben.
  assert.equal(
    notice.effects[2],
    poolMovementSentence(bewegung, 'future', 'reopen'),
    'der Aufgabenbereich formuliert den Satz selbst, statt die Domäne zu fragen (E-058)',
  );

  assert.match(notice.effects[2], /Wartung Nord/, 'der erste Pool fehlt');
  assert.match(notice.effects[2], /Offene Störungen/, 'der zweite Pool fehlt');
  assert.equal(/\b2 Pools\b/.test(notice.effects[2]), false, 'die Pools sind gezählt statt genannt');

  /*
   * E-058 Absatz 2: `CARD_STAYS` ist **ersatzlos** gestrichen. Kein viertes
   * Feld, keine vierte Zeile — und vor allem kein neuer Satz an derselben
   * Stelle, der dasselbe behauptet. Der Nachweis ist statisch, weil er auch die
   * Wiedereinführung treffen soll und nicht nur diesen einen Aufruf.
   */
  assert.equal(
    Object.hasOwn(notice, 'aside'),
    false,
    'die abgesetzte Zeile ist zurück — E-058 Absatz 2 streicht sie ersatzlos',
  );
  for (const effect of notice.effects) {
    assert.equal(
      /Karte bleibt|ändert sich dadurch nicht/.test(effect),
      false,
      `der gestrichene Satz steht wieder da: ${effect}`,
    );
  }
});

check('I-05: die Rückmeldung danach sagt dasselbe wie die Ankündigung davor', () => {
  const bewegung = { appears: ['Wartung Nord'], enters: [], leaves: [] };
  const before = reopenPreview(30, bewegung);
  const after = reopenOutcome('Turnuswartung Frühjahr', 30, bewegung);

  assert.equal(after.effects.length, before.effects.length);
  assert.match(after.title, /wieder offen/);
  assert.match(after.title, /Turnuswartung Frühjahr/);
  assert.match(after.effects[1], /aufgehoben/);
  assert.match(after.effects[2], /Wartung Nord/);

  // Dieselbe Bewegung, derselbe Anlass, die andere Zeitform — beide Male aus
  // der Funktion. Ein vertauschter Anlass fiele hier auf: `'booking'` zählt
  // `enters` auf und gäbe für diese Bewegung `null`.
  assert.equal(before.effects[2], poolMovementSentence(bewegung, 'future', 'reopen'));
  assert.equal(after.effects[2], poolMovementSentence(bewegung, 'past', 'reopen'));

  /*
   * Die Aufzählung: ein Name allein, zwei mit „und" dazwischen. Das ist die
   * Eigenschaft, die den Wortlautwechsel aus T-093 überlebt — dort ist der
   * Einschub „dem Pool"/„den Pools" weggefallen, die Aufzählung nicht.
   */
  assert.match(before.effects[2], /„Wartung Nord“/);
  assert.match(
    reopenPreview(30, { appears: ['Ost', 'West'], enters: [], leaves: [] }).effects[2],
    /„Ost“ und „West“/,
  );
});

check('Ein Todo ohne passende Regel bekommt die unangenehme Wahrheit, nicht Schweigen', () => {
  const nichts = { appears: [], enters: [], leaves: [] };

  // Der Wiederöffnen-Satz hat **immer** etwas zu sagen, auch wenn beide Listen
  // leer sind. Das ist die Zusage der Überladung, und der Aufgabenbereich zeigt
  // sie als dritte Wirkung.
  for (const tense of ['future', 'past']) {
    const satz = poolMovementSentence(nichts, tense, 'reopen');
    assert.equal(typeof satz, 'string');
    assert.ok(satz.length > 0, 'ein Satz mit null Zeichen ist kein Satz');
    assert.match(satz, /keine Regel/, 'der Grund fehlt');
  }

  assert.equal(reopenPreview(15, nichts).effects[2], poolMovementSentence(nichts, 'future', 'reopen'));
  assert.equal(
    reopenOutcome('Ohne Regel', 15, nichts).effects[2],
    poolMovementSentence(nichts, 'past', 'reopen'),
  );
});

// ---------------------------------------------------------------------------
// T-084 — derselbe Anlass, ein anderer Satz: die Buchung ohne Aufhebung
// ---------------------------------------------------------------------------

/*
 * E-056 verlangt einen Satz, wenn eine Buchung Pools betrifft. Bis T-084 gab
 * es ihn nur dort, wo „Erledigt" aufgehoben wird — mit der Begründung, nur
 * dort könne etwas **verschwinden**. Für das Verschwinden stimmt das; für das
 * **Erscheinen** nicht. Die erste Buchung auf einem Todo ohne Buchung setzt
 * „hat offene Buchungen" von falsch auf wahr, und jede Spalte mit
 * `exportState: 'open'` nimmt es damit auf.
 *
 * Zwei Prüfungen, und die zweite ist die wichtigere: Der Satz darf nicht immer
 * dastehen. Er entsteht aus der **Bewegung**, nicht aus dem Zustand.
 */

check('T-084: die erste Buchung auf einem offenen Todo bekommt einen eigenen Satz — ohne „wieder"', () => {
  const bewegung = {
    appears: ['Wartung Nord', 'Offen abzurechnen'],
    enters: ['Offen abzurechnen'],
    leaves: [],
  };

  const vorher = poolMovementSentence(bewegung, 'future', 'booking');
  const nachher = poolMovementSentence(bewegung, 'past', 'booking');

  // Kein „wieder" und kein „zurück": Aufgehoben wird hier nichts, und ein Wort,
  // das eine Vorgeschichte behauptet, ist an dieser Stelle eine Unwahrheit.
  for (const satz of [vorher, nachher]) {
    assert.equal(typeof satz, 'string', 'die Bewegung ist da, der Satz fehlt');
    assert.equal(/wieder|zurück/.test(satz), false, `der Satz behauptet eine Rückkehr: ${satz}`);
    assert.equal(satz.indexOf('.'), satz.length - 1, `mehr als ein Satz: ${satz}`);
    assert.match(satz, /„Offen abzurechnen“/, 'die eine Änderung wird nicht beim Namen genannt');
  }

  /*
   * Der Kern: Der Anlass entscheidet, **welche** Liste aufgezählt wird.
   * `'booking'` nennt `enters`, `'reopen'` nennt `appears`. „Wartung Nord" ist
   * der Pool, in dem das Todo ohnehin schon stand — er gehört in den einen Satz
   * und nicht in den anderen. Ein vertauschter Anlass fiele genau hier auf.
   */
  assert.equal(/Wartung Nord/.test(vorher), false, 'der Satz zählt auf, was sich nicht geändert hat');
  assert.match(poolMovementSentence(bewegung, 'future', 'reopen'), /Wartung Nord/);

  // Die Aufzählung: zwei Namen mit „und" dazwischen, einzeln genannt und nicht
  // gezählt. Dieselbe Aufzählung wie im Wiederöffnen-Satz, weil sie aus
  // derselben Stelle kommt.
  assert.match(
    poolMovementSentence({ appears: [], enters: ['Ost', 'West'], leaves: [] }, 'future', 'booking'),
    /„Ost“ und „West“/,
  );
});

check('T-084: ohne Bewegung kein Satz — und die Bestätigung ist Zeichen für Zeichen die von vorher', () => {
  // Das Todo steht in einem Pool und bleibt dort. `appears` ist besetzt, die
  // Bewegung ist leer — genau der Fall, in dem ein Satz eine Ankündigung ohne
  // Ereignis wäre.
  const ohneBewegung = { appears: ['Wartung Nord'], enters: [], leaves: [] };

  assert.equal(poolMovementSentence(ohneBewegung, 'future', 'booking'), null);
  assert.equal(poolMovementSentence(ohneBewegung, 'past', 'booking'), null);

  const notice = bookingOutcome(15, ohneBewegung);
  assert.equal(notice.pools, null, 'ein Satz ohne Ereignis');
  assert.equal(notice.booked, '15 Minuten sind gebucht. Gerundet wird beim Export, auf die Tagessumme.');

  // `null` und kein leerer String: Ein Satz mit null Zeichen bekommt in der
  // Oberfläche trotzdem eine Zeile. Die Aufrufstelle muss den Fall behandeln.
  assert.equal(notice.pools === '', false, 'aus `null` ist ein leerer Satz geworden');

  // Kein Halbsatz, kein Komma zu viel, keine leere Aufzählung — die Auflage aus
  // E-056, eine Stufe früher angewandt.
  assert.equal(/Pool/.test(notice.booked), false, `ein Halbsatz ist übrig geblieben: ${notice.booked}`);
});

// ===========================================================================
heading('6  Tokenablage (E-009, E-019, R-09, R-12, B-2.3)');
// ===========================================================================

check('Das Token landet im localStorage und in keiner anderen Ablage', () => {
  const storage = createMemoryStorage();
  const store = createSettingsStore(storage);
  store.writeToken('takt_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  assert.equal(storage.map.get('takt.addin.token'), 'takt_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  assert.deepEqual([...storage.map.keys()], ['takt.addin.token']);
});

check('B-2.3: `read()` gibt nur die Tatsache heraus, nie den Wert', () => {
  const store = createSettingsStore(createMemoryStorage());
  store.writeToken('takt_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
  const settings = store.read();
  assert.equal(settings.hasToken, true);
  assert.equal(
    JSON.stringify(settings).includes('takt_'),
    false,
    'der Klartext steckt im Zustand der Oberfläche',
  );
});

check('describeToken verrät höchstens die letzten vier Zeichen', () => {
  const token = 'takt_CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCwxyz';
  const described = describeToken(token);
  assert.equal(described, 'hinterlegt, endet auf …wxyz');
  assert.equal(described.includes('takt_'), false);
  assert.equal(describeToken(null), 'nicht hinterlegt');
});

check('Ein leeres Token wird entfernt, nicht als leerer Wert gespeichert', () => {
  const storage = createMemoryStorage();
  const store = createSettingsStore(storage);
  store.writeToken('takt_DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD');
  store.writeToken('   ');
  assert.equal(store.readToken(), null);
  assert.equal(store.read().hasToken, false);
});

check('looksLikeToken ist eine Formprüfung und keine Gültigkeitsaussage', () => {
  assert.equal(looksLikeToken(`takt_${'a'.repeat(43)}`), true);
  assert.equal(looksLikeToken('takt_zu-kurz'), false);
  assert.equal(looksLikeToken('irgendwas'), false);
});

check('Die Grundadresse muss auf die Loopback-Adresse zeigen', () => {
  const storage = createMemoryStorage();
  const store = createSettingsStore(storage);
  storage.setItem('takt.addin.baseUrl', 'https://beispiel.example.org');
  assert.equal(store.read().baseUrl, 'http://127.0.0.1:17843', 'eine fremde Adresse wurde übernommen');
});

check('A-10.8: das Muster steht in den Einstellungen, nicht im Code', () => {
  const storage = createMemoryStorage();
  const store = createSettingsStore(storage);
  assert.equal(store.read().callNumberPattern, DEFAULT_PATTERN);
  store.writePattern('\\bSVC-(\\d{4})\\b');
  assert.equal(store.read().callNumberPattern, '\\bSVC-(\\d{4})\\b');
  assert.equal(storage.map.get('takt.addin.callNumberPattern'), '\\bSVC-(\\d{4})\\b');
});

// ===========================================================================
heading('7  Tag-Baum über vier Ebenen (A-4.3, A-4.4, A-10.4, A-10.5)');
// ===========================================================================

const { deps, seedTodo, state } = createFakeStore();

// Derselbe Grundpfad wie im Betrieb — er kommt aus dem Dienst, nicht aus
// diesem Nachweis.
const routerApp = mountAddinRoutes(deps);

/** Der Zugang des Add-ins, aber ohne Netz: `fetch` zeigt auf den Router. */
let lastRequest = null;
const client = createApiClient({
  baseUrl: 'http://127.0.0.1:17843',
  token: () => 'takt_EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
  fetch: (url, init) => {
    lastRequest = { url: String(url), init };
    return routerApp.request(String(url), init);
  },
});

await checkAsync('TP-ADDIN-05: der vollständige Baum kommt in einem Aufruf', async () => {
  const result = await client.loadContext();
  assert.equal(result.ok, true, result.ok ? '' : result.message);
  const flat = flattenTagTree(result.value.tagTree);
  const deep = flat.find((tag) => tag.name === 'Turnuswartung');
  assert.ok(deep, 'das Tag der vierten Ebene fehlt');
  assert.deepEqual(deep.folderPath, ['Kunden', 'Nord', 'Betrieb', 'Wartung']);
  assert.equal(deep.depth, 4);
});

await checkAsync('A-9.5: die Standard-Tags kommen als solche gekennzeichnet mit', async () => {
  const result = await client.loadContext();
  assert.deepEqual(result.value.defaultTagIds, [ID.tagIntern, ID.tagTodo, ID.tagNichtAbgerechnet]);
  assert.equal(result.value.defaultStatusId, ID.statusBacklog);
});

check('A-4.4: die Suche trifft über den Pfad, nicht nur über den Namen', () => {
  const flat = flattenTagTree(buildTagTree());
  assert.equal(filterTags(flat, 'Turnus').length, 1, 'Suche über den Namen');
  assert.equal(
    filterTags(flat, 'Nord Wartung').length,
    2,
    'über den Pfad müssten beide Tags des Wartungsordners kommen',
  );
  assert.equal(filterTags(flat, 'wartung TURNUS').length, 1, 'Groß- und Kleinschreibung');
  assert.equal(filterTags(flat, '').length, flat.length, 'leere Suche filtert nicht');
  assert.equal(filterTags(flat, 'gibtesnicht').length, 0);
});

check('A-4.3: der abgeflachte Baum trägt jedes Tag genau einmal', () => {
  const flat = flattenTagTree(buildTagTree());
  const ids = flat.map((tag) => tag.id);
  assert.equal(new Set(ids).size, ids.length, 'ein Tag kommt doppelt vor');
  assert.equal(flat.length, 6, `erwartet 6 Tags, gefunden ${String(flat.length)}`);
  assert.equal(Math.max(...flat.map((tag) => tag.depth)), 4, 'die vierte Ebene fehlt');
});

// ===========================================================================
heading('8  Der Zugang zum Dienst (E-009, B-2.4)');
// ===========================================================================

check('Das Token steht in der Kopfzeile X-Takt-Token', () => {
  assert.ok(lastRequest, 'es wurde noch keine Anfrage gestellt');
  assert.equal(
    lastRequest.init.headers['X-Takt-Token'],
    'takt_EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
  );
});

check('B-2.4: das Token steht in keiner Adresse', () => {
  assert.equal(lastRequest.url.includes('takt_'), false);
});

await checkAsync('Ohne Token wird gar nicht erst angefragt', async () => {
  let called = false;
  const tokenless = createApiClient({
    baseUrl: 'http://127.0.0.1:17843',
    token: () => null,
    fetch: () => {
      called = true;
      return Promise.resolve(new Response('{}'));
    },
  });
  const result = await tokenless.loadContext();
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'unauthorized');
  assert.equal(called, false, 'es wurde ohne Token angefragt');
});

await checkAsync('TP-ADDIN-06: 401 wird einheitlich behandelt, ohne den Wert zu nennen', async () => {
  const rejecting = createApiClient({
    baseUrl: 'http://127.0.0.1:17843',
    token: () => 'takt_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    fetch: () =>
      Promise.resolve(
        new Response(
          JSON.stringify({ error: { code: 'unauthorized', message: 'Zugriff nicht möglich.' } }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
  });
  const result = await rejecting.loadContext();
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'unauthorized');
  assert.equal(result.message.includes('takt_'), false);
});

await checkAsync('403 wird als Herkunftsproblem erkannt und benannt', async () => {
  const rejecting = createApiClient({
    baseUrl: 'http://127.0.0.1:17843',
    token: () => 'takt_GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    fetch: () =>
      Promise.resolve(
        new Response(
          JSON.stringify({ error: { code: 'origin_not_allowed', message: 'Diese Herkunft ist nicht zugelassen.' } }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
  });
  const result = await rejecting.loadContext();
  assert.equal(result.kind, 'origin_rejected');
  assert.equal(result.code, 'origin_not_allowed');
});

await checkAsync('Ein Netzfehler wird zu „nicht erreichbar", nicht zu einem Absturz', async () => {
  const dead = createApiClient({
    baseUrl: 'http://127.0.0.1:17843',
    token: () => 'takt_HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    fetch: () => Promise.reject(new Error('ECONNREFUSED')),
  });
  const result = await dead.loadContext();
  assert.equal(result.kind, 'unreachable');
  assert.match(result.message, /nicht erreichbar/);
});

// ===========================================================================
heading('9  Die Add-in-Routen des lokalen Dienstes');
// ===========================================================================

seedTodo({
  id: ID.todoStoerung,
  title: 'Lüftung Notbetrieb',
  callNumber: 'TCK-000042',
  statusId: ID.statusInArbeit,
  boardRank: 'm',
  completedAt: null,
  tagIds: [ID.tagMusterbetrieb, ID.tagStoerung],
  createdAt: '2026-02-20T08:00:00Z',
  updatedAt: '2026-02-20T08:00:00Z',
});
seedTodo({
  id: ID.todoTurnus,
  title: 'Turnuswartung Frühjahr',
  callNumber: 'TCK-000815',
  statusId: ID.statusBacklog,
  boardRank: 'n',
  completedAt: '2026-02-25T16:00:00Z',
  tagIds: [ID.tagTurnuswartung],
  createdAt: '2026-02-21T08:00:00Z',
  updatedAt: '2026-02-25T16:00:00Z',
});

await checkAsync('TP-ADDIN-02: der vorhandene Call wird gefunden und mit Titel angeboten', async () => {
  const result = await client.findMatches('TCK-000042');
  assert.equal(result.ok, true);
  assert.equal(result.value.searched, true);
  assert.equal(result.value.matches.length, 1);
  assert.equal(result.value.matches[0].title, 'Lüftung Notbetrieb');
});

await checkAsync('TP-ADDIN-04: nur das exakt passende Todo wird angeboten', async () => {
  const result = await client.findMatches('TCK-000815');
  assert.equal(result.value.matches.length, 1);
  assert.equal(result.value.matches[0].id, ID.todoTurnus);
});

await checkAsync('Eine unbekannte Nummer liefert eine leere, aber durchgeführte Suche', async () => {
  const result = await client.findMatches('TCK-999999');
  assert.equal(result.value.searched, true);
  assert.deepEqual(result.value.matches, []);
});

await checkAsync('R-15 im Dienst: eine leere Nummer wird gar nicht gesucht', async () => {
  const response = await routerApp.request('http://127.0.0.1:17843/api/v1/addin/todo-matches');
  const body = await response.json();
  assert.equal(response.status, 200, 'ein Normalfall darf kein 4xx sein');
  assert.equal(body.data.searched, false);
  assert.equal(body.data.reason, 'empty');
  assert.deepEqual(body.data.matches, []);
});

await checkAsync('R-15 im Dienst: auch eine unplausible Nummer wird nicht gesucht', async () => {
  const response = await routerApp.request(
    `http://127.0.0.1:17843/api/v1/addin/todo-matches?callNumber=${encodeURIComponent('Sehr geehrte Damen')}`,
  );
  const body = await response.json();
  assert.equal(body.data.searched, false);
  assert.equal(body.data.reason, 'forbidden_characters');
});

await checkAsync('A-9.5: die Standard-Tags werden im Dienst ergänzt, nicht vom Add-in geschickt', async () => {
  const result = await client.createTodo({
    title: suggestTitle(MAIL_MIT_NUMMER.subject),
    callNumber: 'TCK-000042',
    statusId: null,
    tagIds: [ID.tagStoerung],
    note: prepareNote(MAIL_MIT_NUMMER),
  });

  assert.equal(result.ok, true, result.ok ? '' : result.message);
  assert.deepEqual(result.value.todo.tagIds, [
    ID.tagIntern,
    ID.tagTodo,
    ID.tagNichtAbgerechnet,
    ID.tagStoerung,
  ]);
  assert.deepEqual(result.value.addedDefaultTagIds, [
    ID.tagIntern,
    ID.tagTodo,
    ID.tagNichtAbgerechnet,
  ]);
  assert.equal(result.value.todo.statusId, ID.statusBacklog, 'die Standardspalte wurde nicht gesetzt');
  assert.equal(result.value.todo.title, 'Störung Lüftung — Vorgang TCK-000042', 'AW: nicht entfernt');
});

await checkAsync('B-12.3: der übernommene E-Mail-Text landet im internen Vermerk', async () => {
  const created = [...state.todos.values()].find((todo) => todo.title.startsWith('Störung Lüftung'));
  const note = state.notes.get(created.id);
  assert.ok(note.text.includes('A. Beispiel'), 'der Vermerk trägt den Kontext der E-Mail');
  assert.equal(
    state.timeEntries.some((entry) => entry.note.includes('A. Beispiel')),
    false,
    'E-Mail-Text ist in eine Buchungsnotiz geraten',
  );
});

await checkAsync('TP-ADDIN-02: nach dem Buchen entsteht kein zweites Todo mit derselben Nummer', async () => {
  const before = [...state.todos.values()].filter((todo) => todo.callNumber === 'TCK-000042').length;

  const result = await client.book({
    todoId: ID.todoStoerung,
    startedAt: '2026-03-02T08:30:00Z',
    endedAt: '2026-03-02T09:00:00Z',
    note: 'Rückruf und Ferndiagnose',
  });

  assert.equal(result.ok, true, result.ok ? '' : result.message);
  assert.equal(result.value.timeEntry.durationSeconds, 1800);
  assert.equal(result.value.todoWasDone, false);
  assert.equal(result.value.doneCleared, false, 'an einem offenen Todo gibt es nichts aufzuheben');

  const after = [...state.todos.values()].filter((todo) => todo.callNumber === 'TCK-000042').length;
  assert.equal(after, before, 'es ist ein Duplikat entstanden');
});

await checkAsync('A-2.5/C-03: die Duplikatsuche zeigt „erledigt" und die Pools VOR der Buchung', async () => {
  // Der Kern der Nacharbeit: Was nach der Buchung geschieht, steht schon in
  // der Antwort, aus der der Benutzer sein Todo auswählt.
  const found = await client.findMatches('TCK-000815');
  const match = found.value.matches[0];

  assert.notEqual(match.completedAt, null, 'das erledigte Todo ist nicht als solches erkennbar');

  /*
   * E-061 Punkt 3: **eine** Form, und die drei Namenslisten sind weg.
   *
   * Der Schlüsselvergleich und nicht bloß „`poolMovement` ist da": Ein Treffer,
   * der beides trüge, sähe an jeder Prüfung grün aus und ließe zwei Formen
   * nebeneinander weiterleben — genau der Zustand, den E-061 aufhebt. Und
   * `undefined` ist die ehrliche Antwort für einen Aufrufer, der noch
   * `poolNames` liest: Er bekommt nichts, nicht die halbe Wahrheit.
   */
  assert.deepEqual(
    Object.keys(match).sort(),
    [
      'callNumber',
      'completedAt',
      'exportedSeconds',
      'id',
      'openSeconds',
      'poolMovement',
      'statusId',
      'tagIds',
      'title',
    ],
    'die Gestalt des Treffers weicht von der Beschreibung ab (AddinTodoMatch)',
  );

  // Für ein erledigtes Todo steht immer eine Bewegung da: Die Buchung hebt das
  // Kennzeichen auf, also sind die beiden Zustände verschieden (E-061 Punkt 3).
  assert.notEqual(match.poolMovement, null, 'die Bewegung fehlt im Angebot');
  assert.deepEqual(match.poolMovement.appears, ['Wartung Nord'], 'die Pools fehlen im Angebot');

  const offer = describeOffers(found.value.matches)[0];
  assert.equal(offer.isDone, true);
  assert.deepEqual(reopenPreview(15, offer.poolMovement).effects.length, 3);
});

await checkAsync('A-2.5: eine Buchung auf ein erledigtes Todo hebt „Erledigt" automatisch auf', async () => {
  assert.notEqual(state.todos.get(ID.todoTurnus).completedAt, null, 'die Ausgangslage stimmt nicht');

  const booked = await client.book({
    todoId: ID.todoTurnus,
    startedAt: '2026-03-02T10:00:00Z',
    endedAt: '2026-03-02T10:15:00Z',
    note: 'Nacharbeit',
  });

  assert.equal(booked.ok, true, booked.ok ? '' : booked.message);
  assert.equal(booked.value.todoWasDone, true);
  assert.equal(booked.value.doneCleared, true, 'das Kennzeichen ist stehen geblieben');

  // Dieselbe Wache wie am Treffer: eine Form, keine Reste (E-061 Punkt 3).
  assert.deepEqual(
    Object.keys(booked.value).sort(),
    ['doneCleared', 'poolMovement', 'timeEntry', 'todoWasDone'],
    'die Gestalt der Buchungsantwort weicht von der Beschreibung ab',
  );
  assert.equal(state.todos.get(ID.todoTurnus).completedAt, null);

  // E-023: Die Spalte ist die andere Achse. Sie bleibt.
  assert.equal(state.todos.get(ID.todoTurnus).statusId, ID.statusBacklog, 'die Spalte wurde verschoben (E-023)');

  // I-05: Der Dienst nennt die Pools, in denen das Todo jetzt wieder steht.
  assert.notEqual(booked.value.poolMovement, null, 'die Bewegung fehlt in der Bestätigung');
  assert.deepEqual(booked.value.poolMovement.appears, ['Wartung Nord']);
  assert.match(
    reopenOutcome('Turnuswartung Frühjahr', 15, booked.value.poolMovement).effects[2],
    /Wartung Nord/,
  );
});

await checkAsync('C-03: es gibt keinen Weg mehr, die Aufhebung zu unterdrücken', async () => {
  // Ein Aufrufer aus der Zeit vor T-038 schickt das alte Feld weiter mit. Es
  // darf ihm nicht gelingen, damit die Aufhebung abzuwählen — und die Buchung
  // darf daran auch nicht scheitern.
  seedTodo({
    id: '01931f4e-0000-7000-8000-0000000050e3',
    title: 'Nochmals erledigt',
    callNumber: 'TCK-000816',
    statusId: ID.statusInArbeit,
    boardRank: 'o',
    completedAt: '2026-02-27T16:00:00Z',
    tagIds: [ID.tagStoerung],
    createdAt: '2026-02-27T08:00:00Z',
    updatedAt: '2026-02-27T16:00:00Z',
  });

  const response = await routerApp.request(
    'http://127.0.0.1:17843/api/v1/addin/todos/01931f4e-0000-7000-8000-0000000050e3/time-entries',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startedAt: '2026-03-02T13:00:00Z',
        endedAt: '2026-03-02T13:15:00Z',
        note: 'Nachtrag',
        reopenIfDone: false,
      }),
    },
  );

  assert.equal(response.status, 201, 'das alte Feld lässt die Buchung scheitern');
  const body = await response.json();
  assert.equal(body.data.doneCleared, true, '`reopenIfDone: false` hat die Aufhebung verhindert');
  assert.equal(body.data.todoWasDone, body.data.doneCleared, 'die beiden Werte fallen wieder auseinander');
  assert.equal(state.todos.get('01931f4e-0000-7000-8000-0000000050e3').completedAt, null);
});

await checkAsync('Ein unbekanntes Todo liefert 404 und keine Buchung', async () => {
  const result = await client.book({
    todoId: '01931f4e-0000-7000-8000-0000000059ff',
    startedAt: '2026-03-02T12:00:00Z',
    endedAt: '2026-03-02T12:15:00Z',
    note: '',
  });
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'not_found');
});

await checkAsync('Ein leerer Titel wird mit 422 und Feldangabe abgewiesen', async () => {
  const result = await client.createTodo({
    title: '   ',
    callNumber: null,
    statusId: null,
    tagIds: [],
    note: '',
  });
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'invalid_input');
  assert.ok(result.details?.some((detail) => detail.field === 'title'));
});

await checkAsync('Eine leere Call-Nummer wird zu null und nicht zu ""', async () => {
  const result = await client.createTodo({
    title: 'Ohne Vorgang',
    callNumber: '   ',
    statusId: null,
    tagIds: [],
    note: '',
  });
  assert.equal(result.value.todo.callNumber, null);

  const lookup = await routerApp.request(
    'http://127.0.0.1:17843/api/v1/addin/todo-matches?callNumber=',
  );
  assert.equal((await lookup.json()).data.searched, false);
});

// ---------------------------------------------------------------------------
// T-041 / T-046 — was angelegt wird, muss auffindbar bleiben
// ---------------------------------------------------------------------------
//
// Der Befund: `POST /addin/todos` nahm Call-Nummern bis 128 Zeichen an,
// `checkCallNumber` sucht aber ab 65 nicht mehr. Dazwischen lag ein Todo, das
// entstand und das die Duplikatsuche nie wieder fand — beim nächsten Mal legte
// derselbe Benutzer ein zweites zum selben Kundenvorgang an, und die Zeit stand
// auf zwei Vorgängen (R-15).
//
// Alle Nummern hier sind erfunden.

await checkAsync('T-041/R-15: eine Nummer, die die Duplikatsuche nie fände, wird beim Anlegen abgewiesen', async () => {
  const zuLang = `TCK-${'0'.repeat(70)}`;
  assert.ok(zuLang.length > 64 && zuLang.length <= 128, 'die Prüfnummer liegt nicht im Zwischenraum');

  const vorher = state.todos.size;
  const result = await client.createTodo({
    title: 'Vorgang mit überlanger Nummer',
    callNumber: zuLang,
    statusId: null,
    tagIds: [],
    note: '',
  });

  assert.equal(result.ok, false, 'die Nummer wurde angenommen');
  assert.equal(result.kind, 'invalid_input');
  const detail = result.details?.find((entry) => entry.field === 'callNumber');
  assert.ok(detail, 'die Ablehnung sagt nicht, welches Feld gemeint ist');
  assert.equal(detail.code, 'too_long', 'der Grund kommt nicht aus der Domäne');
  assert.equal(state.todos.size, vorher, 'es ist trotzdem ein Todo entstanden');
});

await checkAsync('T-041: der Grund der Ablehnung ist der Grund der Domäne, nicht ein Schemacode', async () => {
  for (const [nummer, grund] of [
    ['Sehr geehrte Damen', 'forbidden_characters'],
    ['AB', 'too_short'],
    ['-000042', 'formula_start'],
  ]) {
    const result = await client.createTodo({
      title: 'Vorgang',
      callNumber: nummer,
      statusId: null,
      tagIds: [],
      note: '',
    });
    assert.equal(result.ok, false, `angenommen: ${JSON.stringify(nummer)}`);
    const detail = result.details?.find((entry) => entry.field === 'callNumber');
    assert.equal(detail?.code, grund, `falscher Grund für ${JSON.stringify(nummer)}`);
  }
});

await checkAsync('T-041: was angelegt werden darf, findet die Duplikatsuche auch wieder', async () => {
  // Die Eigenschaft, um die es geht — nicht die Länge, sondern die Deckung der
  // beiden Wege. Angenommen und unauffindbar darf es nicht mehr geben.
  const nummern = [
    'TCK-000777',
    'ABC',
    'TCK.000_042/1-A',
    `TCK-${'0'.repeat(70)}`,
    'Sehr geehrte Damen',
    'AB',
  ];

  for (const nummer of nummern) {
    const created = await client.createTodo({
      title: `Deckungsprobe ${nummer.slice(0, 12)}`,
      callNumber: nummer,
      statusId: null,
      tagIds: [],
      note: '',
    });

    const lookup = await routerApp.request(
      `http://127.0.0.1:17843/api/v1/addin/todo-matches?callNumber=${encodeURIComponent(nummer)}`,
    );
    const { data } = await lookup.json();

    assert.equal(
      created.ok,
      data.searched,
      `angelegt=${String(created.ok)}, gesucht=${String(data.searched)} für ${JSON.stringify(nummer)}`,
    );

    if (created.ok) {
      assert.ok(
        data.matches.some((match) => match.id === created.value.todo.id),
        `angelegt, aber nicht im Angebot: ${JSON.stringify(nummer)}`,
      );
    }
  }
});

// ===========================================================================
heading('10  Base64 und Vorlagen-Motor (A-8.2 bis A-8.5, A-8.7)');
// ===========================================================================

check('Base64 Hin- und Rückweg mit Umlauten, Eszett und Emoji', () => {
  const cases = [
    'Rückruf erledigt, Prüfung offen',
    'Größe geändert — Änderung übernommen',
    'Straße 5, Büro Süd',
    'Notiz mit Emoji ✅ und ➜ Pfeil',
    'gemischt: äöüÄÖÜß €50 · 100 % ✔',
    '',
  ];
  for (const text of cases) {
    const encoded = toBase64(text);
    assert.equal(fromBase64(encoded), text, `Rückweg falsch für ${JSON.stringify(text)}`);
    assert.match(encoded, /^[A-Za-z0-9+/]*={0,2}$/, 'kein gültiges Base64');
  }
});

check('Base64 über eine lange Notiz jenseits der Blockgrenzen', () => {
  const long = 'Erfundener Fülltext mit Umlauten äöü und Straße. '.repeat(300);
  assert.ok(long.length > 10_000, 'der Prüftext ist zu kurz');
  assert.equal(fromBase64(toBase64(long)), long);
});

const exportGroup = {
  todoId: ID.todoStoerung,
  day: '2026-03-02',
  todoTitle: 'Lüftung Notbetrieb',
  todoCallNumber: 'TCK-000042',
  todoTagNames: ['Musterbetrieb Nord', 'Störung'],
  previouslyExported: false,
  entries: [
    {
      timeEntryId: 'te-0001',
      todoId: ID.todoStoerung,
      startedAt: '2026-03-02T08:30:00Z',
      endedAt: '2026-03-02T08:46:00Z',
      durationSeconds: 16 * 60,
      bookingNote: 'Rückruf erledigt',
      todoTitle: 'Lüftung Notbetrieb',
      todoCallNumber: 'TCK-000042',
      todoTagNames: [],
      previouslyExported: false,
    },
  ],
};

const exportContext = {
  windowsUser: 't.beispiel',
  exportedAt: '2026-03-02T18:00:00Z',
  roundingMode: 'up',
};

check('Die Standardvorlage bildet Call, Zeit, Notiz (Base64) und WindowsUser ab', () => {
  const result = renderExportGroup(exportGroup, BUILTIN_EXPORT_TEMPLATE.fields, exportContext);
  assert.equal(result.kind, 'row');
  assert.deepEqual(Object.keys(result.row), ['Call', 'Zeit', 'Notiz', 'WindowsUser']);
  assert.equal(result.row.Call, 'TCK-000042');
  assert.equal(result.row.Zeit, 0.5, '16 Minuten müssen aufwärts auf 0,50 gehen (E-008)');
  assert.equal(fromBase64(result.row.Notiz), 'Rückruf erledigt');
  assert.equal(result.row.WindowsUser, 't.beispiel');
});

check('Eine abweichende Vorlage erzeugt andere Felder in anderer Reihenfolge', () => {
  const eigene = [
    { name: 'Ticket', source: 'todo.callNumber', transformation: 'raw' },
    { name: 'Tag', source: 'group.day', transformation: 'raw' },
    { name: 'Dauer', source: 'group.durationSeconds', transformation: 'raw' },
    { name: 'Kunde', source: 'todo.tags', transformation: 'base64' },
  ];
  for (const field of eigene) {
    assert.equal(validateExportTemplateField(field).ok, true, `abgelehnt: ${field.name}`);
  }

  const result = renderExportGroup(exportGroup, eigene, exportContext);
  assert.equal(result.kind, 'row');
  assert.deepEqual(Object.keys(result.row), ['Ticket', 'Tag', 'Dauer', 'Kunde']);
  assert.equal(result.row.Ticket, 'TCK-000042');
  assert.equal(result.row.Dauer, 960);
  assert.equal(fromBase64(result.row.Kunde), 'Musterbetrieb Nord, Störung');
  assert.equal('Notiz' in result.row, false);
  assert.equal('WindowsUser' in result.row, false);
});

check('A-7.2/R-06: der interne Vermerk ist als Feldquelle nicht wählbar', () => {
  for (const forbidden of ['todo.note', 'todo.notiz', 'todo.vermerk', 'group.note']) {
    const result = validateExportTemplateField({ name: 'X', source: forbidden, transformation: 'raw' });
    assert.equal(result.ok, false, `angenommen: ${forbidden}`);
    assert.equal(result.error.code, 'export_source_forbidden');
  }
});

check('E-017: eine Quelle mit abweichender Schreibweise wird abgewiesen', () => {
  for (const variant of [' todo.callNumber ', 'Todo.CallNumber', 'todo.callnumber']) {
    assert.equal(
      validateExportTemplateField({ name: 'Call', source: variant, transformation: 'raw' }).ok,
      false,
      `angenommen: ${JSON.stringify(variant)}`,
    );
  }
  assert.equal(
    validateExportTemplateField({ name: 'Call', source: 'todo.callNumber', transformation: 'raw' }).ok,
    true,
    'die wörtlich gelistete Quelle wird abgewiesen — Gegenprobe',
  );
});

check('T-046: der Zeichenvorrat schließt __proto__ nicht aus — die Sperrliste ist die einzige Schicht', () => {
  // Der Kommentar in `template.ts` behauptete bis T-046, `FIELD_NAME_PATTERN`
  // schließe die drei Prototypennamen bereits aus. Er tat es nicht. Gemessen
  // wird das ohne eine zweite Fassung des Musters: Zu jedem gesperrten Namen
  // steht ein Name daneben, der denselben Zeichenvorrat und dieselbe Länge
  // benutzt. Kommt der eine durch und der andere nicht, kann der Unterschied
  // nicht vom Zeichenvorrat kommen.
  const paare = [
    ['__proto__', '__proto_x'],
    ['constructor', 'constructoR'],
    ['prototype', 'prototypeX'],
  ];

  for (const [gesperrt, gleichgeformt] of paare) {
    assert.equal(gesperrt.length <= 64, true, `${gesperrt} ist länger als der Vorrat erlaubt`);
    assert.match(gleichgeformt, /^[A-Za-z0-9_-]{1,64}$/, 'die Gegenprobe verlässt den Vorrat');

    assert.equal(
      validateExportTemplateField({ name: gesperrt, source: 'todo.callNumber', transformation: 'raw' }).ok,
      false,
      `angenommen: ${gesperrt}`,
    );
    assert.equal(
      validateExportTemplateField({ name: gleichgeformt, source: 'todo.callNumber', transformation: 'raw' }).ok,
      true,
      `abgewiesen, obwohl im Vorrat: ${gleichgeformt} — dann läge es doch am Muster`,
    );
  }
});

check('T-046: der Renderer verschluckt einen solchen Namen auch dann nicht, wenn die Prüfung umgangen wurde', () => {
  // Der Zustand, den ein `INSERT` in `export_template` oder ein Bestand von vor
  // T-034 herstellt: eine Vorlage, die nie durch `validateExportTemplateField`
  // kam. `renderExportGroup` ist die Stelle, an der Vorschau und Lauf
  // zusammenlaufen — sie muss ohne die Prüfung auskommen.
  const ungeprueft = [
    { name: '__proto__', source: 'todo.callNumber', transformation: 'raw' },
    { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
  ];
  const result = renderExportGroup(exportGroup, ungeprueft, exportContext);

  assert.equal(result.kind, 'row');
  assert.deepEqual(Object.keys(result.row), ['__proto__', 'Call'], 'ein Feld ist verschluckt worden');
  assert.equal(result.row.Call, 'TCK-000042', 'die ganze Zeile ist mitgegangen');
  assert.equal(JSON.parse(JSON.stringify(result.row)).Call, 'TCK-000042');
});

check('T-046: die Vergleiche einer Bedingung hängen am Typ und nicht an einer zweiten Liste', () => {
  // `EXPORT_CONDITION_OPERATORS` entsteht aus `Record<ExportConditionOperator,
  // true>` — die Prüfliste und die Auswahlliste des Editors sind damit
  // dieselbe Menge und können nicht auseinanderlaufen (T-033).
  assert.deepEqual([...EXPORT_CONDITION_OPERATORS], ['is_set', 'is_not_set']);

  for (const op of EXPORT_CONDITION_OPERATORS) {
    assert.equal(
      validateExportTemplateField({
        name: 'Kunde',
        source: 'todo.tags',
        transformation: 'raw',
        condition: { source: 'todo.callNumber', op },
      }).ok,
      true,
      `abgewiesen: ${op}`,
    );
  }

  const unbekannt = validateExportTemplateField({
    name: 'Kunde',
    source: 'todo.tags',
    transformation: 'raw',
    condition: { source: 'todo.callNumber', op: 'is_empty' },
  });
  assert.equal(unbekannt.ok, false);
  assert.equal(unbekannt.error.details[0].field, 'condition.op');
  for (const op of EXPORT_CONDITION_OPERATORS) {
    assert.ok(unbekannt.error.message.includes(op), `die Meldung nennt ${op} nicht`);
  }
});

// ===========================================================================
heading('11  Ein Tag, das es noch nicht gibt (A-4.1, A-9.5, T-058, T-061)');
// ===========================================================================

/*
 * Drei Ebenen, in dieser Reihenfolge:
 *
 *  11a  Der Aufgabenbereich entscheidet **nicht**, wann zwei Namen derselbe
 *       sind — er fragt die Domäne. Rein, ohne Dienst.
 *  11b  Die Route gegen die Attrappe: was aus einem Namen wird, was aus zwei
 *       Schreibweisen in einer Anfrage wird, und was bei einem mehrdeutigen
 *       Namen **nicht** entsteht.
 *  11c  Der Wettlauf gegen eine **echte** Datenbank. Acht gleichzeitige
 *       Anfragen, acht Schreibweisen, ein Tag. Dazu die Gegenprobe, dass diese
 *       Messung rot werden kann, und der Vergleich mit dem Weg der
 *       Hauptanwendung.
 */

const FAKE_BASE = 'http://127.0.0.1:17843/api/v1/addin';

/** Ein Anlegeversuch über die Route, ohne Prüfschicht — wie in Abschnitt 9. */
const postTodo = (app, body) =>
  app.request(`${FAKE_BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// ---------------------------------------------------------------------------
// 11a — die Regel wird benutzt, nicht nachgebaut
// ---------------------------------------------------------------------------

const bestand = flattenTagTree(buildTagTree());

check('T-061: „störung" trifft das vorhandene „Störung" — die Faltung reicht über A–Z hinaus', () => {
  for (const geschrieben of ['störung', 'STÖRUNG', ' Störung ', 'stÖrung', 'Störung']) {
    const offer = describeNewTag(geschrieben, bestand, []);
    assert.equal(offer.kind, 'exists', `„${geschrieben}" wurde als neu angeboten`);
    assert.equal(offer.tag.name, 'Störung');
  }
});

check('T-061: „Stoerung" ist ein anderes Tag — es wird nicht umgeschrieben', () => {
  // Die Kehrseite derselben Entscheidung: keine Umschrift, kein „ß" zu „ss".
  // Wer das anders will, ändert die Domäne und die Migration, nicht diese Datei.
  const offer = describeNewTag('Stoerung', bestand, []);
  assert.equal(offer.kind, 'offer');
  assert.equal(offer.name, 'Stoerung');
});

check('T-061: ein neuer Name wird angeboten, ein leeres Feld nicht und ein zu langer abgewiesen', () => {
  assert.equal(describeNewTag('Rückruf', bestand, []).kind, 'offer');

  // Ein leerer Bestand ist seit T-061 kein Sonderfall mehr, sondern der erste
  // Schritt: Wer Takt frisch eingerichtet hat, legt sein erstes Tag aus Outlook
  // heraus an. Bis dahin stand an dieser Stelle „In Takt sind noch keine Tags
  // angelegt" — richtig, und eine Sackgasse.
  assert.equal(describeNewTag('Erstes Tag', [], []).kind, 'offer');

  assert.equal(describeNewTag('   ', bestand, []).kind, 'idle', 'ein leeres Feld ist kein Vorwurf');

  const zuLang = describeNewTag('x'.repeat(201), bestand, []);
  assert.equal(zuLang.kind, 'invalid');
  assert.match(zuLang.message, /200/, 'der Satz kommt aus der Domäne und nennt die Grenze');
});

check('T-061: zwei Schreibweisen in der Vormerkliste sind ein Eintrag — die erste gewinnt', () => {
  const eins = addPendingTagName([], 'Backend');
  const zwei = addPendingTagName(eins, ' backend ');
  assert.deepEqual(zwei, ['Backend'], 'die zweite Schreibweise hat einen zweiten Chip erzeugt');

  assert.equal(describeNewTag('BACKEND', bestand, zwei).kind, 'pending');
  assert.deepEqual(removePendingTagName(zwei, 'bAcKeNd'), [], 'entfernt wird über den Schlüssel');
});

// ---------------------------------------------------------------------------
// 11b — die Route, gegen die Attrappe
// ---------------------------------------------------------------------------

const tagStore = createFakeStore();
const tagApp = mountAddinRoutes(tagStore.deps);

await checkAsync('T-061: ein getippter Name legt ein Tag an — und die Standard-Tags kommen trotzdem (A-9.5)', async () => {
  const response = await postTodo(tagApp, {
    title: 'Rückruf zusagen',
    tagIds: [],
    tagNames: ['Rückruf'],
    note: '',
  });
  const body = await response.json();

  assert.equal(response.status, 201, JSON.stringify(body));
  assert.equal(body.data.createdTags.length, 1);
  assert.equal(body.data.createdTags[0].name, 'Rückruf');
  assert.equal(body.data.createdTags[0].folderId, null, 'ein neues Tag liegt auf Wurzelebene (A-4.2)');

  const neu = body.data.createdTags[0].id;
  assert.ok(body.data.todo.tagIds.includes(neu), 'das Todo hängt nicht an seinem neuen Tag');
  for (const standard of [ID.tagIntern, ID.tagTodo, ID.tagNichtAbgerechnet]) {
    assert.ok(body.data.todo.tagIds.includes(standard), 'ein Standard-Tag fehlt (A-9.5)');
  }
  assert.equal(body.data.addedDefaultTagIds.length, 3);
});

await checkAsync('T-061: dieselbe Nummer noch einmal, anders geschrieben — kein zweites Tag', async () => {
  const vorher = tagStore.state.tags.size;

  const response = await postTodo(tagApp, {
    title: 'Rückruf erledigt',
    tagIds: [],
    tagNames: ['  RÜCKRUF  '],
    note: '',
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(body.data.createdTags, [], 'es wurde ein zweites Tag gemeldet');
  assert.equal(tagStore.state.tags.size, vorher, 'es ist ein Tag hinzugekommen');

  const treffer = [...tagStore.state.tags.values()].filter(
    (tag) => tagNameKey(tag.name) === tagNameKey('rückruf'),
  );
  assert.equal(treffer.length, 1);
  assert.ok(body.data.todo.tagIds.includes(treffer[0].id), 'das zweite Todo hängt nicht am selben Tag');
});

await checkAsync('T-061: drei Schreibweisen in **einer** Anfrage ergeben ein Tag', async () => {
  const response = await postTodo(tagApp, {
    title: 'Auswertung vorbereiten',
    tagIds: [],
    tagNames: ['Auswertung', 'auswertung', '  AUSWERTUNG  '],
    note: '',
  });
  const body = await response.json();

  // Ohne die Entdoppelung in `checkTagNames` liefe die zweite Anlage in
  // `ux_tag_name_key` — und der Benutzer bekäme für eine Eingabe, die er für
  // richtig hält, „Name bereits vergeben".
  assert.equal(response.status, 201, JSON.stringify(body));
  assert.equal(body.data.createdTags.length, 1);
  assert.equal(body.data.createdTags[0].name, 'Auswertung', 'die zuerst genannte Schreibweise gewinnt');
});

await checkAsync('T-061: das neue Tag ist danach ein gewöhnliches Tag — es steht im Baum', async () => {
  const response = await tagApp.request(`${FAKE_BASE}/context`);
  const body = await response.json();
  const flach = flattenTagTree(body.data.tagTree);

  const gefunden = flach.find((tag) => tag.name === 'Rückruf');
  assert.ok(gefunden, 'das angelegte Tag fehlt im Baum — es wäre nicht wieder auswählbar');
  assert.deepEqual(gefunden.folderPath, [], 'es liegt auf Wurzelebene');

  // Und der Aufgabenbereich bietet es folgerichtig nicht mehr als „neu" an.
  assert.equal(describeNewTag('rückruf', flach, []).kind, 'exists');
});

await checkAsync('T-061: ein mehrdeutiger Name wird gefragt, nicht geraten (A-4.2)', async () => {
  // Zwei Tags mit demselben Schlüssel in **verschiedenen** Ordnern. Der Zustand
  // ist zulässig — `ux_tag_name_key` ist je Ordner eindeutig — und am Adapter
  // vorbei hergestellt, weil ihn keine Route herstellen kann.
  tagStore.state.tags.set('01931f4e-0000-7000-8000-00000000fa01', {
    id: '01931f4e-0000-7000-8000-00000000fa01',
    folderId: ID.folderArt,
    name: 'turnuswartung',
    color: null,
  });

  const vorherTags = tagStore.state.tags.size;
  const vorherTodos = tagStore.state.todos.size;

  const response = await postTodo(tagApp, {
    title: 'Wartung planen',
    tagIds: [],
    // Der erste Name **würde** ein Tag anlegen. Er darf es nicht behalten,
    // wenn der zweite die Anfrage zu Fall bringt (T-047).
    tagNames: ['Ersatzteil', 'Turnuswartung'],
    note: '',
  });
  const body = await response.json();

  assert.equal(response.status, 422, JSON.stringify(body));
  assert.equal(body.error.code, 'validation_error');
  assert.equal(body.error.details[0].code, 'tag_name_ambiguous');
  assert.equal(body.error.details[0].field, 'tagNames');
  assert.equal(tagStore.state.todos.size, vorherTodos, 'ein Todo ist entstanden');
  assert.equal(tagStore.state.tags.size, vorherTags, '„Ersatzteil" ist stehen geblieben');
});

await checkAsync('T-061: mehr als fünfzig Namen sind ein Skript und kein Arbeitsablauf', async () => {
  const response = await postTodo(tagApp, {
    title: 'Zu viele',
    tagIds: [],
    tagNames: Array.from({ length: 51 }, (_unused, index) => `Name ${String(index)}`),
    note: '',
  });
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.error.details[0].field, 'tagNames');
});

// ---------------------------------------------------------------------------
// 11c — der Wettlauf, gegen eine echte Datenbank gemessen
// ---------------------------------------------------------------------------

const JETZT = '2026-03-02T09:00:00Z';

/**
 * Acht Schreibweisen desselben Namens.
 *
 * Sie sind so gewählt, dass jede der vier Regeln aus `tag-name.ts` mindestens
 * einmal greift: Zusammensetzung (die letzte ist zerlegt geschrieben),
 * Leerraum vorn, hinten und als Tabulator, ASCII-Faltung und die Faltung des
 * lateinischen Ergänzungsblocks (Ü, U+00DC).
 */
const SCHREIBWEISEN = [
  'rückruf',
  'Rückruf',
  'RÜCKRUF',
  ' rückruf',
  'rückruf ',
  '  Rückruf  ',
  'rÜcKrUf',
  'rückruf',
];

/** Eine echte, migrierte Datenbank im Arbeitsspeicher. Kein Port, kein Kindprozess. */
const withRealDatabase = async (work) => {
  const db = openDatabase({ location: ':memory:', now: () => JETZT });
  await db.migrations.migrateToLatest();
  try {
    const deps = {
      inTransaction: (unitWork) => db.transactions.inTransaction(unitWork),
      now: () => JETZT,
    };
    await work({
      db,
      app: mountAddinRoutes(deps),
      // Der Zusammenhang, den die Anwendungsfälle der Hauptanwendung brauchen —
      // dieselbe Klammer und dieselbe Uhr wie das Add-in.
      context: { transactions: db.transactions, clock: { now: () => JETZT } },
      tagsWithKey: (name) =>
        db.transactions.inTransaction((unit) => unit.tags.findByKey(tagNameKey(name))),
    });
  } finally {
    db.close();
  }
};

await checkAsync('T-061: acht gleichzeitige Anfragen aus dem Add-in ergeben **ein** Tag', async () => {
  await withRealDatabase(async ({ app, tagsWithKey }) => {
    // Alle acht zugleich unterwegs, nichts dazwischen abgewartet. Ein Prüffall,
    // der sie nacheinander schickte, wäre grün und sagte nichts.
    const antworten = await Promise.all(
      SCHREIBWEISEN.map((schreibweise, index) =>
        postTodo(app, {
          title: `Aus Outlook ${String(index)}`,
          tagIds: [],
          tagNames: [schreibweise],
          note: '',
        }).then(async (response) => ({ status: response.status, body: await response.json() })),
      ),
    );

    for (const antwort of antworten) {
      assert.equal(antwort.status, 201, JSON.stringify(antwort.body));
    }

    const treffer = await tagsWithKey('rückruf');
    assert.equal(treffer.length, 1, `es sind ${String(treffer.length)} Tags entstanden`);

    const gemeldet = antworten.filter((antwort) => antwort.body.data.createdTags.length === 1);
    assert.equal(gemeldet.length, 1, 'mehr als eine Antwort meldet die Neuanlage');
    assert.equal(gemeldet[0].body.data.createdTags[0].id, treffer[0].id);

    for (const antwort of antworten) {
      assert.ok(
        antwort.body.data.todo.tagIds.includes(treffer[0].id),
        'ein Todo hängt nicht an dem einen Tag',
      );
    }
  });
});

await checkAsync('T-061: ohne die Reihung greift der Index — und ohne beides wären es acht Tags', async () => {
  /*
   * Die Gegenprobe. Ohne sie sähe die Messung darüber genauso aus wie eine, die
   * nichts prüft: Acht Anfragen, die nacheinander laufen, ergäben immer ein Tag.
   *
   * Beide Ebenen aus T-058 werden einzeln weggenommen (siehe `fixtures.mjs`):
   */
  const ohneReihung = createFakeStore({ serializeTransactions: false });
  const ohneAlles = createFakeStore({ serializeTransactions: false, enforceUniqueTagName: false });

  const fahren = async (store) => {
    const app = mountAddinRoutes(store.deps);
    const antworten = await Promise.all(
      SCHREIBWEISEN.map((schreibweise, index) =>
        postTodo(app, {
          title: `Gegenprobe ${String(index)}`,
          tagIds: [],
          tagNames: [schreibweise],
          note: '',
        }).then(async (response) => ({ status: response.status, body: await response.json() })),
      ),
    );
    const tags = [...store.state.tags.values()].filter(
      (tag) => tagNameKey(tag.name) === tagNameKey('rückruf'),
    );
    return { antworten, tags };
  };

  // Ebene 2 allein: Der eindeutige Index verhindert das zweite Tag — aber sieben
  // Anfragen scheitern dabei mit 409, statt das vorhandene Tag zu benutzen.
  const nurIndex = await fahren(ohneReihung);
  assert.equal(nurIndex.tags.length, 1, 'der Index hat ein zweites Tag durchgelassen');
  assert.equal(
    nurIndex.antworten.filter((antwort) => antwort.status === 409).length,
    7,
    'ohne Reihung müssten sieben Anfragen am Index scheitern',
  );

  // Keine der beiden Ebenen: acht Tags. Damit ist gezeigt, dass die Messung
  // darüber rot werden **kann** und nicht bloß grün ist.
  const gar = await fahren(ohneAlles);
  assert.equal(gar.tags.length, 8, 'ohne beide Ebenen müssten acht Tags entstehen');
});

await checkAsync('C-03: derselbe Name über beide Wege ergibt dasselbe Tag', async () => {
  await withRealDatabase(async ({ app, context, tagsWithKey }) => {
    // Der Weg des Add-ins zuerst, die Hauptanwendung danach.
    const ausOutlook = await postTodo(app, {
      title: 'Beschwerde aufnehmen',
      tagIds: [],
      tagNames: ['Beschwerde'],
      note: '',
    });
    const outlookBody = await ausOutlook.json();
    assert.equal(ausOutlook.status, 201, JSON.stringify(outlookBody));
    assert.equal(outlookBody.data.createdTags.length, 1);

    const ausAnwendung = await createTodoOnMainPath(context, {
      title: 'Beschwerde nachfassen',
      callNumber: null,
      statusId: null,
      tagIds: [],
      tagNames: ['BESCHWERDE'],
      note: '',
    });
    assert.equal(ausAnwendung.ok, true, JSON.stringify(ausAnwendung));
    assert.deepEqual(ausAnwendung.value.createdTags, [], 'die Hauptanwendung hat ein zweites Tag angelegt');

    // Und die Gegenrichtung, damit nicht bloß die Reihenfolge gemessen ist.
    const zuerstAnwendung = await createTodoOnMainPath(context, {
      title: 'Nachbestellung prüfen',
      callNumber: null,
      statusId: null,
      tagIds: [],
      tagNames: ['Nachbestellung'],
      note: '',
    });
    assert.equal(zuerstAnwendung.ok, true);
    assert.equal(zuerstAnwendung.value.createdTags.length, 1);

    const dannOutlook = await postTodo(app, {
      title: 'Nachbestellung melden',
      tagIds: [],
      tagNames: ['  nachbestellung  '],
      note: '',
    });
    const dannBody = await dannOutlook.json();
    assert.equal(dannOutlook.status, 201, JSON.stringify(dannBody));
    assert.deepEqual(dannBody.data.createdTags, [], 'das Add-in hat ein zweites Tag angelegt');

    for (const name of ['beschwerde', 'nachbestellung']) {
      const treffer = await tagsWithKey(name);
      assert.equal(treffer.length, 1, `„${name}" gibt es ${String(treffer.length)}-mal`);
    }

    // Und beide Todos hängen wirklich an demselben Tag, nicht nur „es gibt eines".
    const beschwerde = (await tagsWithKey('beschwerde'))[0];
    assert.ok(outlookBody.data.todo.tagIds.includes(beschwerde.id));
    assert.ok(ausAnwendung.value.todo.tagIds.includes(beschwerde.id));
  });
});

await checkAsync('T-047: scheitert die Anfrage, bleibt kein Tag zurück — an der echten Datenbank', async () => {
  await withRealDatabase(async ({ db, app, tagsWithKey }) => {
    // Denselben Namen zweimal, in zwei Ordnern. `ux_tag_name_key` ist je Ordner
    // eindeutig, der Zustand ist also zulässig und über die Hauptanwendung
    // herstellbar.
    await db.transactions.inTransaction(async (unit) => {
      const ordner = await unit.folders.create(null, 'Vertrieb', JETZT);
      assert.equal(ordner.ok, true);
      const oben = await unit.tags.create(null, 'Abnahme', null, JETZT);
      assert.equal(oben.ok, true);
      const drin = await unit.tags.create(ordner.value.id, 'abnahme', null, JETZT);
      assert.equal(drin.ok, true, 'zwei gleiche Namen in zwei Ordnern müssen zulässig sein');
    });

    const response = await postTodo(app, {
      title: 'Abnahme terminieren',
      tagIds: [],
      tagNames: ['Ersatzteil', 'Abnahme'],
      note: '',
    });
    const body = await response.json();

    assert.equal(response.status, 422, JSON.stringify(body));
    assert.equal(body.error.details[0].code, 'tag_name_ambiguous');

    // Der Kern: „Ersatzteil" wäre vor dem Abbruch angelegt worden. Die
    // Transaktion hat es mitgenommen.
    assert.deepEqual(await tagsWithKey('Ersatzteil'), [], 'ein Tag ohne sein Todo ist zurückgeblieben');

    const todos = await db.transactions.inTransaction((unit) =>
      unit.todos.search({}, { limit: 50, offset: 0 }),
    );
    assert.equal(todos.items.length, 0, 'ein Todo ist trotz Abbruch entstanden');
  });
});

// ===========================================================================
heading('12  Die Pools eines Todos: fünf Regelachsen und beide Richtungen (T-076, T-078, E-056)');
// ===========================================================================

/*
 * Der Befund, den dieser Abschnitt misst
 * --------------------------------------
 *
 * Seit T-076 ist eine Regel eine Struktur mit fünf benannten Feldern. Die
 * Rechnung des Add-in-Dienstes — bis T-092 `poolNamer` in
 * `routes/addin/service.ts`, seitdem `poolMovementNamer` in
 * `usecases/pool-movement.ts` — gab `matchesPool` bis T-078 nur die
 * **erforderlichen Tags** mit, und `matchesPool` überspringt jede Achse, die
 * es nicht genannt bekommt. Eine Regel „Wartung, außer Störungen" wurde damit
 * zu „Wartung", und das Add-in nannte einen Pool, in dem das Todo nicht steht.
 * Der Fehler ging nie in die andere Richtung: zu viele Pools, nie zu wenige.
 *
 * Warum das schlimmer ist, als es klingt: Das Add-in nennt die Pools **vor**
 * dem Buchen (T-038, I-05), damit der Benutzer sieht, wo sein erledigtes Todo
 * danach auftaucht. Eine falsche Auskunft an dieser Stelle kostet nicht Zeit,
 * sondern Vertrauen — wer einmal vergeblich in „Wartung ohne Störungen" gesucht
 * hat, liest die Anzeige beim nächsten Mal nicht mehr.
 *
 * Gemessen wird gegen die **echten** Routen, mit acht Regeln, die alle
 * dieselben erforderlichen Tags tragen (siehe `AXIS_POOLS`). Ein Ergebnis, das
 * nur die Tags auswertet, müsste deshalb für jedes Todo alle sieben
 * eingerichteten Regeln nennen. Jeder Unterschied unten stammt nachweisbar aus
 * einer der neuen Achsen.
 *
 * Der zweite Teil des Abschnitts misst E-056: dass der Aufgabenbereich auch
 * ausspricht, **woraus** das Todo durch die Buchung verschwindet — in
 * demselben Satz, und nur dann, wenn eine Regel es betrifft.
 */

const axisStore = createFakeStore({ pools: AXIS_POOLS });
const axisApp = mountAddinRoutes(axisStore.deps);
const axisClient = createApiClient({
  baseUrl: 'http://127.0.0.1:17843',
  token: () => 'takt_EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
  fetch: (url, init) => axisApp.request(String(url), init),
});

for (const todo of buildAxisTodos()) axisStore.seedTodo(todo);

/*
 * Eine bereits **exportierte** Buchung am Turnus-Todo. Sie entsteht nicht über
 * `timeEntries.create` — eine neue Buchung ist immer offen (E-032) —, sondern
 * wird gesetzt, weil sie den Zustand herstellt, den die Achse `exported`
 * abfragt: ein Vorgang, an dem schon einmal abgerechnet wurde.
 */
axisStore.state.timeEntries.push({
  id: 'te-axis-exportiert',
  todoId: AXIS_TODO.turnus,
  startedAt: '2026-02-24T09:00:00Z',
  endedAt: '2026-02-24T10:00:00Z',
  durationSeconds: 3600,
  note: 'Turnus, erster Teil',
  exportStatus: 'exported',
  exportCount: 1,
  source: 'manual',
  createdAt: '2026-02-24T10:00:00Z',
  updatedAt: '2026-02-26T08:00:00Z',
});

/*
 * Und eine **offene** dazu. Erst damit ist das Turnus-Todo der Fall, für den
 * E-056 entschieden wurde: erledigt und noch nicht abgerechnet — es steht in
 * der Abrechnungsliste, und die Buchung nimmt es dort heraus.
 */
axisStore.state.timeEntries.push({
  id: 'te-axis-offen',
  todoId: AXIS_TODO.turnus,
  startedAt: '2026-02-25T14:00:00Z',
  endedAt: '2026-02-25T15:00:00Z',
  durationSeconds: 3600,
  note: 'Turnus, zweiter Teil',
  exportStatus: 'open',
  exportCount: 0,
  source: 'manual',
  createdAt: '2026-02-25T15:00:00Z',
  updatedAt: '2026-02-25T15:00:00Z',
});

/** Die Tags des Ordners „Wartung", aus demselben Baum, den der Dienst auflöst. */
const WARTUNG_TAGS = flattenTagTree(buildTagTree())
  .filter((tag) => tag.folderPath.includes('Wartung'))
  .map((tag) => tag.id);

/**
 * Die Bewegung eines Todos, über die Route und nicht über den Dienst.
 *
 * Alle drei Listen in einem Wert, genau so, wie sie seit T-104 auch in der
 * Antwort stehen (E-061 Punkt 3). Getrennt abzufragen hieße, den
 * Aufgabenbereich nachzubilden, statt ihn zu messen — und seit der Dienst den
 * Wert zusammengesetzt liefert, gäbe es hier auch nichts mehr
 * zusammenzusetzen.
 *
 * `null` ist eine gültige Antwort und keine Panne: Ein offenes Todo mit einer
 * offenen Buchung bewegt sich durch eine weitere nicht mehr. Die Prüfungen
 * unten unterscheiden die beiden Fälle ausdrücklich.
 */
const movementOf = async (callNumber) => {
  const result = await axisClient.findMatches(callNumber);
  assert.equal(result.ok, true, result.ok ? '' : result.message);
  assert.equal(result.value.matches.length, 1, `${callNumber} trifft nicht genau ein Todo`);
  return result.value.matches[0].poolMovement;
};

/**
 * Dieselbe Frage mit der Zusage, dass es etwas zu berichten gibt.
 *
 * Ohne sie liefe eine Prüfung, die `null` bekommt, in „lesen von null" statt in
 * einen Satz, der sagt, welcher Fall gemessen werden sollte.
 */
const requireMovement = async (callNumber) => {
  const movement = await movementOf(callNumber);
  assert.notEqual(
    movement,
    null,
    `${callNumber} bewegt sich durch eine Buchung nicht — dann misst diese Prüfung den falschen Fall`,
  );
  return movement;
};

/** Nur die genannten Pools — für die Prüfungen, die von T-078 stammen. */
const poolsOf = async (callNumber) => (await requireMovement(callNumber)).appears;

/*
 * Die Wache gegen die **sechste** Achse, zweite Hälfte (R-1, T-090, T-092)
 * -----------------------------------------------------------------------
 *
 * Die erste Hälfte trägt der Übersetzer. Bis T-092 stand dafür eine eigene
 * Wache im Add-in-Dienst (`NamedPoolRule`); seit E-058 rechnet der Dienst nicht
 * mehr selbst, und die Wache steht dort, wo gerechnet wird: `ResolvedPoolRule`
 * in `usecases/pool-movement.ts` trägt `MatchesPoolRule` als Ganzes, und das
 * Objektliteral darunter wird rot, sobald der Typ ein Feld dazubekommt.
 * Nachgestellt: Nimmt man dort `exportState` heraus, meldet `tsc` genau diese
 * Zuweisung.
 *
 * Was der Übersetzer nicht sieht, ist der Schritt davor — ob eine neue **Achse**
 * überhaupt ein Feld auf der Regelseite bekommen hat. Ohne Feld kann
 * `matchesPool` sie nicht auswerten, und niemand wird rot: `PoolRuleAxes` und
 * `MatchesPoolRule` sind zwei Typen, und `POOL_RULE_AXIS_OF_FIELD` schaut nur
 * in die eine Richtung (Feld → Achse). Diese Prüfung schaut in die andere.
 */
check('T-090: jede Achse der Domäne hat ein Feld auf der aufgelösten Regelseite', () => {
  const belegt = new Set(Object.values(POOL_RULE_AXIS_OF_FIELD));

  for (const axis of POOL_RULE_AXIS_IDS) {
    assert.ok(
      belegt.has(axis),
      `die Achse „${axis}" hat kein Feld in MatchesPoolRule — matchesPool kann sie nicht auswerten`,
    );
  }

  // Die Gegenprobe zur Gegenprobe: Es gibt überhaupt Achsen. Eine leere
  // Aufzählung liefe fehlerfrei durch und prüfte nichts.
  assert.ok(POOL_RULE_AXIS_IDS.length >= 5, 'die Achsenliste der Domäne ist geschrumpft');
});

check('Die Ausgangslage: alle sieben eingerichteten Regeln fordern dieselben Tags', () => {
  // Ohne diese Prüfung wäre jede Aussage unten mehrdeutig: Ein fehlender Pool
  // könnte auch daran liegen, dass seine Tagliste nicht passt.
  const eingerichtet = AXIS_POOLS.filter((pool) => pool.rule.length > 0);
  assert.equal(eingerichtet.length, 7);
  for (const pool of eingerichtet) {
    assert.deepEqual(pool.rule, [{ kind: 'folder', folderId: ID.folderWartung }], pool.name);
    assert.equal(pool.matchMode, 'any', pool.name);
    assert.equal(pool.includeSubfolders, true, pool.name);
  }

  // Und beide Todos erfüllen diese eine Tagliste — sonst prüfte der Abschnitt
  // nur, dass eine unpassende Regel nicht trifft.
  assert.deepEqual(WARTUNG_TAGS, [ID.tagTurnuswartung, ID.tagStoerung]);
  for (const todo of buildAxisTodos()) {
    assert.ok(
      todo.tagIds.some((tagId) => WARTUNG_TAGS.includes(tagId)),
      `${todo.title} hängt an keinem Tag des Ordners „Wartung"`,
    );
  }
});

await checkAsync('Ausgeschlossenes Tag: genannt für das Todo ohne, nicht für das mit (T-076)', async () => {
  const mitStoerung = await poolsOf('TCK-000517');
  const ohneStoerung = await poolsOf('TCK-000518');

  assert.equal(
    mitStoerung.includes('Wartung ohne Störungen'),
    false,
    'der Pool wird genannt, obwohl das Todo das ausgeschlossene Tag trägt',
  );

  // Die Gegenprobe. Ohne sie wäre „wird nicht genannt" auch dann grün, wenn
  // die Regel überhaupt niemanden träfe.
  assert.ok(
    ohneStoerung.includes('Wartung ohne Störungen'),
    'der Pool wird für kein Todo genannt — die Regel trifft nichts statt weniger',
  );
});

await checkAsync('Status: genannt nur für das Todo im Backlog (T-076)', async () => {
  const inArbeit = await poolsOf('TCK-000517');
  const backlog = await poolsOf('TCK-000518');

  assert.equal(inArbeit.includes('Wartung im Backlog'), false, 'der Status wird nicht ausgewertet');
  assert.ok(backlog.includes('Wartung im Backlog'), 'die Gegenprobe fehlt — die Regel trifft nichts');
});

await checkAsync('Exportstatus: „bereits abgerechnet" nur, wo es eine exportierte Buchung gibt', async () => {
  const ohneExport = await poolsOf('TCK-000517');
  const mitExport = await poolsOf('TCK-000518');

  assert.equal(ohneExport.includes('Wartung, bereits abgerechnet'), false);
  assert.ok(mitExport.includes('Wartung, bereits abgerechnet'));

  // Die andere Hälfte derselben Achse: Wer bucht, hat danach etwas Offenes.
  // Das gilt für beide Todos und ist keine Vermutung — eine neue Buchung ist
  // abgeschlossen und offen (E-032).
  assert.ok(ohneExport.includes('Wartung, noch nicht abgerechnet'));
  assert.ok(mitExport.includes('Wartung, noch nicht abgerechnet'));
});

await checkAsync('Erledigt: der Pool „Erledigte Wartung" wird nicht genannt — er wäre die Vergangenheit', async () => {
  const erledigtesTodo = await poolsOf('TCK-000518');

  assert.equal(
    erledigtesTodo.includes('Erledigte Wartung'),
    false,
    'genannt wird ein Pool, aus dem das Todo durch genau diese Buchung verschwindet',
  );

  /*
   * Die Gegenprobe, und zugleich die Stelle, an der Zugehörigkeit und
   * Sichtbarkeit auseinandergehen (T-076, Befund 2):
   *
   * **Jetzt** gehört das Todo in diesen Pool — dieselbe Funktion der Domäne
   * sagt es, mit demselben Bestand. Genannt wird es trotzdem nicht, und das
   * ist richtig: Der Satz, den der Aufgabenbereich daraus baut, steht im
   * Futur („Es erscheint dann wieder in …"), und die Buchung, über die er
   * redet, hebt „Erledigt" auf (A-2.5). Wer hier den Zustand von **jetzt**
   * einsetzt, nennt einen Pool, in dem das Todo eine Sekunde später nicht
   * mehr steht — derselbe Fehler wie bei den Tags, nur um einen Augenblick
   * verschoben.
   */
  assert.equal(
    matchesPool({
      todoTagIds: [ID.tagTurnuswartung],
      ruleTagIds: WARTUNG_TAGS,
      matchMode: 'any',
      excludedTagIds: [],
      todoStatusId: ID.statusBacklog,
      ruleStatusIds: [],
      completedAt: '2026-02-25T16:00:00Z',
      completion: 'done',
      exportState: 'any',
      // Pflichtfeld seit T-082 (E-057). `false` ist hier keine Bequemlichkeit,
      // sondern der Bestand: Der Ordner „Wartung" trägt zwei Tags, es gibt
      // keinen genannten Ordner ohne Treffer. Der Übersetzer kennt diese
      // Datei nicht — sie ist `.mjs` —, deshalb steht das Feld hier von Hand.
      unresolvedRequired: false,
    }),
    true,
    'die Regel „Erledigte Wartung" trifft das Todo nicht einmal jetzt — die Gegenprobe misst nichts',
  );
});

await checkAsync('A-3.4: eine Regel ohne Bedingungen wird für niemanden genannt', async () => {
  for (const callNumber of ['TCK-000517', 'TCK-000518']) {
    assert.equal(
      (await poolsOf(callNumber)).includes('Noch nicht eingerichtet'),
      false,
      'ein frisch angelegter Pool nimmt alles auf, was ihm begegnet',
    );
  }
});

await checkAsync('Die vollständige Auskunft, in der Reihenfolge der Pools', async () => {
  // Der eigentliche Nachweis: nicht „ein Pool fehlt", sondern **welche** sechs
  // von sieben Regeln zutreffen und welche nicht. Vor T-078 hätten hier beide
  // Zeilen alle sechs eingerichteten Namen getragen.
  assert.deepEqual(await poolsOf('TCK-000517'), [
    'Wartung Nord',
    'Wartung, noch nicht abgerechnet',
  ]);

  assert.deepEqual(await poolsOf('TCK-000518'), [
    'Wartung Nord',
    'Wartung ohne Störungen',
    'Wartung im Backlog',
    'Wartung, noch nicht abgerechnet',
    'Wartung, bereits abgerechnet',
  ]);
});

/*
 * ---------------------------------------------------------------------------
 * E-056 — der Aufgabenbereich nennt auch, woraus das Todo verschwindet
 * ---------------------------------------------------------------------------
 *
 * Der entschiedene Fall: eine Spalte `completion: 'done'` **mit**
 * `exportState: 'open'` ist eine **Abrechnungsliste** — erledigt, noch nicht
 * abgerechnet. Wer per Add-in auf eine Karte darin bucht, sieht sie aus genau
 * der Liste verschwinden, in der er sie sucht. Ohne einen Satz darüber wird die
 * Bewegung als Datenverlust gelesen.
 *
 * Die Auflagen aus E-056 sind messbar und werden einzeln gemessen: **ein**
 * Satz, in derselben Aussage wie das Erscheinen, und **kein Halbsatz**, wenn
 * keine Regel betroffen ist.
 */

await checkAsync('E-056: die Abrechnungsliste steht in `poolMovement.leaves`, nicht in `appears`', async () => {
  const turnus = await requireMovement('TCK-000518');

  assert.deepEqual(
    turnus.leaves,
    ['Erledigte Wartung', 'Erledigt, noch nicht abgerechnet'],
    'das Verschwinden aus den Erledigt-Regeln wird verschwiegen',
  );

  // Kein Pool in beiden Hälften. Ein Name, der zugleich erscheint und
  // verschwindet, wäre kein Satz, den jemand lesen möchte.
  for (const name of turnus.leaves) {
    assert.equal(turnus.appears.includes(name), false, `„${name}" steht in beiden Listen`);
  }

  // Die Gegenprobe zur Gegenprobe: Das Todo steht dort **jetzt** wirklich
  // drin. Ohne offene Buchung wäre die Abrechnungsliste nur zufällig leer.
  assert.equal(
    matchesPool({
      todoTagIds: [ID.tagTurnuswartung],
      ruleTagIds: WARTUNG_TAGS,
      matchMode: 'any',
      excludedTagIds: [],
      todoStatusId: ID.statusBacklog,
      ruleStatusIds: [],
      completedAt: '2026-02-25T16:00:00Z',
      completion: 'done',
      hasOpenEntries: true,
      exportState: 'open',
      // Wie oben: Pflichtfeld seit T-082, und `false` ist der Bestand — die
      // Regel nennt keinen Ordner ohne Tags (E-057).
      unresolvedRequired: false,
    }),
    true,
    'die Abrechnungsliste trifft das Todo nicht einmal jetzt',
  );
});

await checkAsync('E-056: wen keine solche Regel betrifft, dem bleibt kein Halbsatz', async () => {
  const stoerung = await requireMovement('TCK-000517');

  // Das Todo ist nicht erledigt — durch eine Buchung verliert es keinen Pool.
  assert.deepEqual(stoerung.leaves, []);

  const satz = reopenPreview(15, stoerung).effects[2];
  assert.equal(/verschwind/.test(satz), false, `ein Halbsatz ist übrig geblieben: ${satz}`);
  assert.equal(/und aus/.test(satz), false, `ein Halbsatz ist übrig geblieben: ${satz}`);

  // Aus der Funktion und nicht aus einer Abschrift (E-058). Gemessen wird, dass
  // der Aufgabenbereich denselben Satz zeigt — der Wortlaut selbst wird in der
  // Domäne gemessen.
  assert.equal(satz, poolMovementSentence(stoerung, 'future', 'reopen'));

  // Beide Namen, einzeln aufgezählt und nicht gezählt.
  assert.match(satz, /„Wartung Nord“ und „Wartung, noch nicht abgerechnet“/);
  assert.equal(satz.indexOf('.'), satz.length - 1, `mehr als ein Satz: ${satz}`);
});

await checkAsync('E-056: ein Satz, dieselbe Aussage — kein zweiter Absatz und keine zweite Liste', async () => {
  const turnus = await requireMovement('TCK-000518');
  const notice = reopenPreview(15, turnus);

  // Die Zahl der Wirkungen ist unverändert drei. Eine vierte Zeile wäre die
  // zweite Aussage, die E-056 ausschließt.
  assert.equal(notice.effects.length, 3, 'aus dem Verschwinden ist eine eigene Wirkung geworden');
  assert.equal(
    Object.hasOwn(notice, 'aside'),
    false,
    'die abgesetzte Zeile ist zurück — E-058 Absatz 2 streicht sie ersatzlos',
  );

  const satz = notice.effects[2];
  assert.equal(satz, poolMovementSentence(turnus, 'future', 'reopen'));
  assert.match(satz, /^Es erscheint dann wieder in /, 'die erste Hälfte fehlt');
  assert.match(satz, / und verschwindet aus /, 'die zweite Hälfte steht nicht im selben Satz');
  assert.match(satz, /„Erledigt, noch nicht abgerechnet“/, 'die Abrechnungsliste wird nicht beim Namen genannt');

  // Ein Satz: Der Punkt steht am Ende und sonst nirgends.
  assert.equal(satz.indexOf('.'), satz.length - 1, `mehr als ein Satz: ${satz}`);

  // Und derselbe Satz im Perfekt, mit denselben beiden Hälften.
  const danach = reopenOutcome('Turnus abschließen', 15, turnus).effects[2];
  assert.equal(danach, poolMovementSentence(turnus, 'past', 'reopen'));
  assert.match(danach, /^Es ist zurück in /);
  assert.match(danach, / und aus .* verschwunden/);
  assert.equal(danach.indexOf('.'), danach.length - 1, `mehr als ein Satz: ${danach}`);
});

await checkAsync('I-05: die Auskunft nach der Buchung ist dieselbe wie davor — in beiden Hälften', async () => {
  const davor = await requireMovement('TCK-000518');

  const booked = await axisClient.book({
    todoId: AXIS_TODO.turnus,
    startedAt: '2026-03-02T11:00:00Z',
    endedAt: '2026-03-02T11:15:00Z',
    note: 'Turnus abgeschlossen',
  });

  assert.equal(booked.ok, true, booked.ok ? '' : booked.message);
  assert.equal(booked.value.doneCleared, true, 'die Ausgangslage stimmt nicht — das Todo war erledigt');
  assert.equal(axisStore.state.todos.get(AXIS_TODO.turnus).completedAt, null);

  // Die Zusage aus T-038, jetzt über fünf Achsen statt über eine — und seit
  // E-056 über beide Hälften der Aussage: Der Satz vorher und der Satz nachher
  // reden über dieselbe Bewegung.
  assert.notEqual(booked.value.poolMovement, null, 'die Bestätigung sagt nichts über die Bewegung');
  assert.deepEqual(
    booked.value.poolMovement.appears,
    davor.appears,
    'vorher und nachher nennen verschiedene Pools',
  );
  assert.deepEqual(
    booked.value.poolMovement.leaves,
    davor.leaves,
    'die Ankündigung und die Bestätigung nennen Verschiedenes als verschwunden',
  );
  /*
   * Die dritte Liste steht seit T-092 mit hier, und zwar aus einem neuen Grund.
   *
   * Bis dahin bildete **eine** Funktion (`bookingStates`) das Zustandspaar für
   * beide Aufrufer. Seit E-058 rechnet ein Anwendungsfall die Bewegung, und
   * seit E-061 bildet er auch das Zustandspaar: `bookingMovementStates` aus
   * `usecases/pool-movement.ts`, gerufen aus **einer** Stelle im Add-in-Dienst
   * für beide Wege. Das ist eine Zusage im Quelltext; hier wird sie gemessen.
   * Nähme eine der beiden Stellen etwas anderes an, sagten Ankündigung und
   * Bestätigung Verschiedenes über dieselbe Handlung — der Befund C-03 aus
   * T-025, eine Ebene tiefer.
   */
  assert.deepEqual(
    booked.value.poolMovement.enters,
    davor.enters,
    'die Ankündigung und die Bestätigung nennen Verschiedenes als hinzugekommen',
  );

  /*
   * Und dieselbe Suche noch einmal, nachdem das Kennzeichen gefallen ist.
   *
   * Die Antwort ist jetzt `null`, und das ist keine Abweichung, sondern
   * dieselbe Rechnung auf einem anderen Bestand: Das Todo ist nicht mehr
   * erledigt und hat eine offene Buchung — eine **weitere** Buchung ändert
   * keine der fünf Achsen, nimmt es also aus keiner Erledigt-Regel mehr heraus
   * und hebt es in keine Exportregel mehr hinein. Stünde hier noch eine
   * Bewegung, hätte der Aufgabenbereich eine angekündigt, die schon geschehen
   * ist.
   *
   * Bis T-104 kam an dieser Stelle `appears` unverändert und `leaves` leer
   * zurück; seit E-061 Punkt 3 sagt `null` dasselbe kürzer — und ohne dass dafür
   * eine einzige Regel über ihre Ordnerbäume aufgelöst würde.
   */
  const danach = await movementOf('TCK-000518');
  assert.equal(danach, null, 'eine bereits geschehene Bewegung wird ein zweites Mal angekündigt');
  assert.equal(
    bookingOutcome(15, danach).pools,
    null,
    'die Bestätigung trägt einen Satz über eine Bewegung, die nicht stattfand',
  );
});

await checkAsync('Der Satz, den der Benutzer liest, nennt die richtigen Pools und den falschen nicht', async () => {
  const found = await axisClient.findMatches('TCK-000517');
  const offer = describeOffers(found.value.matches)[0];
  const satz = reopenPreview(15, offer.poolMovement).effects[2];

  assert.match(satz, /Wartung Nord/);
  assert.match(satz, /noch nicht abgerechnet/);
  assert.equal(/ohne Störungen/.test(satz), false, 'der Satz nennt einen Pool mit ausgeschlossenem Tag');
  assert.equal(/im Backlog/.test(satz), false, 'der Satz nennt einen Pool mit fremdem Status');
  assert.equal(/Noch nicht eingerichtet/.test(satz), false, 'der Satz nennt eine leere Regel');
});

/*
 * ---------------------------------------------------------------------------
 * T-084 — die Bewegung eines Todos, das gar nicht erledigt ist
 * ---------------------------------------------------------------------------
 *
 * Der Befund, der zu T-084 geführt hat: Der Dienst bildet seit E-056 ein
 * Zustandspaar, und `after.hasOpenEntries` steht fest auf wahr (seit T-092 in
 * `BOOKING_EFFECT`, `routes/addin/service.ts`). Für ein Todo
 * **ohne** Buchung ist das eine Änderung — eine Spalte `exportState: 'open'`
 * nimmt es damit auf. Der Dienst wusste das bereits; gefehlt hat die Anzeige.
 *
 * Gemessen wird am Todo „Notbetrieb prüfen" (`TCK-000517`): offen, ohne jede
 * Buchung, und Mitglied einer Regel über den Exportstatus. Drei Prüfungen —
 * vorher, die Buchung, und dieselbe Frage noch einmal danach. Die dritte ist
 * die Gegenprobe: Ist die Bewegung geschehen, gibt es nichts mehr zu sagen.
 */

await checkAsync('T-084: die erste Buchung hebt ein offenes Todo in die Spalte „noch nicht abgerechnet"', async () => {
  // Die Ausgangslage. Ohne sie misst diese Prüfung nichts: Ein Todo, das schon
  // eine offene Buchung hat, bewegt sich nicht mehr.
  assert.equal(
    axisStore.state.timeEntries.some((entry) => entry.todoId === AXIS_TODO.stoerung),
    false,
    'das Todo hat schon eine Buchung — die erste ist längst geschehen',
  );
  assert.equal(
    axisStore.state.todos.get(AXIS_TODO.stoerung).completedAt,
    null,
    'das Todo ist erledigt — dann greift der andere Satz und diese Prüfung misst den falschen Fall',
  );

  const stoerung = await requireMovement('TCK-000517');

  // Der Zustand danach ist unverändert der aus T-078 — und er allein hätte den
  // Fall nie sichtbar gemacht: „Wartung Nord" trifft vorher wie nachher zu.
  assert.deepEqual(stoerung.appears, ['Wartung Nord', 'Wartung, noch nicht abgerechnet']);

  // Die **Bewegung** ist die neue Auskunft: genau eine Spalte, und es ist die
  // über den Exportstatus.
  assert.deepEqual(stoerung.enters, ['Wartung, noch nicht abgerechnet']);
  assert.deepEqual(stoerung.leaves, [], 'ein offenes Todo verliert durch eine Buchung keinen Pool');

  const satz = poolMovementSentence(stoerung, 'future', 'booking');
  assert.match(satz, /„Wartung, noch nicht abgerechnet“/, 'die eine Änderung fehlt im Satz');
  assert.equal(/„Wartung Nord“/.test(satz), false, 'der Satz zählt auf, was sich nicht geändert hat');
  assert.equal(satz.indexOf('.'), satz.length - 1, `mehr als ein Satz: ${satz}`);

  // Derselbe Satz über den Weg, den der Aufgabenbereich geht: Treffer →
  // Angebot → Bewegung. Eine Zusammensetzung, die unterwegs ein Feld verliert,
  // fällt hier auf und nicht erst in Outlook.
  const found = await axisClient.findMatches('TCK-000517');
  const offer = describeOffers(found.value.matches)[0];
  assert.equal(
    poolMovementSentence(offer.poolMovement, 'future', 'booking'),
    satz,
    'über das Angebot kommt ein anderer Satz heraus als über den Treffer',
  );

  /*
   * Die Gegenprobe gegen die Domäne, mit derselben Regel und beiden Zuständen.
   * Ohne sie wäre „genau eine Spalte kommt dazu" auch dann grün, wenn der
   * Dienst schlicht jede Spalte mit `exportState: 'open'` aufzählte.
   */
  const regel = {
    todoTagIds: [ID.tagMusterbetrieb, ID.tagStoerung],
    ruleTagIds: WARTUNG_TAGS,
    matchMode: 'any',
    excludedTagIds: [],
    todoStatusId: ID.statusInArbeit,
    ruleStatusIds: [],
    completedAt: null,
    completion: 'any',
    hasExportedEntries: false,
    exportState: 'open',
    // Pflichtfeld seit T-082 (E-057), und `false` ist der Bestand: Beide
    // Ordnerterme dieses Poolsatzes lösen auf Tags auf.
    unresolvedRequired: false,
  };
  assert.equal(
    matchesPool({ ...regel, hasOpenEntries: false }),
    false,
    'die Regel trifft schon vor der Buchung — dann ist das Erscheinen keines',
  );
  assert.equal(matchesPool({ ...regel, hasOpenEntries: true }), true);
});

await checkAsync('T-084: die Bestätigung nach der Buchung nennt dieselbe Spalte, im Perfekt', async () => {
  const davor = await requireMovement('TCK-000517');

  const booked = await axisClient.book({
    todoId: AXIS_TODO.stoerung,
    startedAt: '2026-03-02T13:00:00Z',
    endedAt: '2026-03-02T13:15:00Z',
    note: 'Notbetrieb geprüft',
  });

  assert.equal(booked.ok, true, booked.ok ? '' : booked.message);

  // Hier war nichts aufzuheben. Der Aufgabenbereich zeigt deshalb **nicht**
  // die drei Wirkungen, sondern die Bestätigung mit dem einen Satz darunter.
  assert.equal(booked.value.doneCleared, false, 'die Ausgangslage stimmt nicht — das Todo war offen');
  assert.equal(booked.value.todoWasDone, false);

  // Ankündigung und Bestätigung reden über dieselbe Bewegung — die Zusage aus
  // I-05, jetzt auch für die dritte Liste.
  assert.notEqual(booked.value.poolMovement, null, 'die Bestätigung sagt nichts über die Bewegung');
  assert.deepEqual(
    booked.value.poolMovement.enters,
    davor.enters,
    'vorher und nachher nennen verschiedene Pools',
  );

  const bewegung = booked.value.poolMovement;
  const notice = bookingOutcome(15, bewegung);
  assert.equal(notice.booked, '15 Minuten sind gebucht. Gerundet wird beim Export, auf die Tagessumme.');

  // Der Satz kommt aus der Funktion, mit Anlass `'booking'` und im Perfekt —
  // dieselbe Bewegung wie in der Ankündigung, nur die Zeitform ist anders.
  assert.equal(notice.pools, poolMovementSentence(bewegung, 'past', 'booking'));
  assert.match(notice.pools, /„Wartung, noch nicht abgerechnet“/);
  assert.equal(/wieder|zurück/.test(notice.pools), false, `der Satz behauptet eine Rückkehr: ${notice.pools}`);
});

await checkAsync('T-084: dasselbe Todo mit bestehender Buchung — kein Satz, kein Halbsatz', async () => {
  // Die Gegenprobe. Dasselbe Todo, dieselbe Frage, ein Zustand später: Es hat
  // jetzt eine offene Buchung, und die zweite Buchung bewegt es nirgendwohin.
  assert.equal(
    axisStore.state.timeEntries.some((entry) => entry.todoId === AXIS_TODO.stoerung),
    true,
    'die Buchung aus der Prüfung davor fehlt — die Gegenprobe misst denselben Fall wie zuvor',
  );

  const danach = await movementOf('TCK-000517');

  /*
   * Die Bewegung ist weg — und genau daran hängt der Satz.
   *
   * Seit T-104 sagt der Dienst das als `null` und nicht als drei leere Listen
   * (E-061 Punkt 3). Beide Auskünfte führen zur selben Anzeige, aber nur diese
   * kostet keine Ordnerauflösung — und sie ist die schärfere: „hier war keine
   * Bewegung möglich" statt „nachgesehen und nichts gefunden". Der Zustand
   * danach (`appears`) fehlt damit an dieser Stelle, und das ist Absicht: Der
   * Aufgabenbereich zählt ihn für eine Buchung ohne Wirkung ohnehin nicht auf
   * (Anlass `'booking'`), und was er nicht zeigt, muss er nicht bekommen.
   */
  assert.equal(danach, null, 'eine bereits geschehene Bewegung wird ein zweites Mal angekündigt');

  /*
   * Beide Wege zu „keine Zeile", einzeln gemessen: der `null` des Dienstes und
   * der `null` der Domäne. Der zweite ist der Fall, in dem gerechnet **wurde**
   * — er tritt an dieser Route seit T-104 nicht mehr auf, bleibt aber die
   * Zusage, gegen die der Aufgabenbereich gebaut ist.
   */
  assert.equal(
    poolMovementSentence({ appears: ['Wartung Nord'], enters: [], leaves: [] }, 'future', 'booking'),
    null,
    'über der Schaltfläche steht eine Ankündigung ohne Ereignis',
  );

  const notice = bookingOutcome(15, danach);
  assert.equal(notice.pools, null, 'die Bestätigung trägt einen Satz über eine Bewegung, die nicht stattfand');

  // Zeichen für Zeichen der Text von vor T-084.
  assert.equal(notice.booked, '15 Minuten sind gebucht. Gerundet wird beim Export, auf die Tagessumme.');
});

// ===========================================================================
heading('13  Der leere Ordner: eine Einschränkung ohne Treffer (E-057, T-086)');
// ===========================================================================

/*
 * Der Befund, den dieser Abschnitt misst
 * --------------------------------------
 *
 * Dieselbe Falle wie in Abschnitt 12, eine Achse weiter. `matchesPool`
 * überspringt jede Achse, die es nicht genannt bekommt — und eine Tagmenge,
 * die leer aus dem Auflösen kommt, sieht aus wie „über Tags sagt die Regel
 * nichts". Ein Ordner **ohne Tags** verschwand damit spurlos aus der Regel:
 * „Tags aus Archiv **und** Status In Arbeit" wurde zu „Status In Arbeit", und
 * der Aufgabenbereich nannte einen Pool, in dem die Hauptanwendung dasselbe
 * Todo nicht führt. Wieder die schlechtere Richtung: zu viele Pools, nie zu
 * wenige.
 *
 * E-057 entscheidet: Der Benutzer hat die Einschränkung ausgesprochen, also
 * bleibt sie — als eine, die niemand erfüllt. Seit T-082 ist
 * `unresolvedRequired` deshalb ein **Pflichtfeld** von `matchesPool`, und seit
 * T-086 holt die Rechnung die Auskunft dort, wo sie steht: bei
 * `PoolPort.resolveAxes`, das zu jeder Achse auch die Ordner nennt, aus denen
 * kein Tag geworden ist. Seit T-092 steht sie in `usecases/pool-movement.ts` —
 * dieselbe Frage, ein Aufrufer weniger.
 *
 * Gemessen wird gegen die **echten** Routen, mit einem eigenen Poolsatz
 * (`E057_POOLS`) und demselben erfundenen Bestand wie oben. Jede betroffene
 * Regel hat ihre Gegenprobe: eine zweite Regel, die sich nur im leeren Ordner
 * unterscheidet.
 */

const leerStore = createFakeStore({ pools: E057_POOLS });
const leerApp = mountAddinRoutes(leerStore.deps);
const leerClient = createApiClient({
  baseUrl: 'http://127.0.0.1:17843',
  token: () => 'takt_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
  fetch: (url, init) => leerApp.request(String(url), init),
});

for (const todo of buildAxisTodos()) leerStore.seedTodo(todo);

const leerPoolsOf = async (callNumber) => {
  const result = await leerClient.findMatches(callNumber);
  assert.equal(result.ok, true, result.ok ? '' : result.message);
  assert.equal(result.value.matches.length, 1, `${callNumber} trifft nicht genau ein Todo`);
  const movement = result.value.matches[0].poolMovement;
  assert.notEqual(movement, null, `${callNumber} bewegt sich nicht — dann misst diese Prüfung nichts`);
  return movement.appears;
};

await checkAsync('Die Ausgangslage: „Archiv" gibt es, und es liegt kein Tag darin', async () => {
  // Ohne diese Prüfung wäre jede Aussage unten mehrdeutig: Ein Pool könnte
  // auch deshalb fehlen, weil der genannte Ordner gar nicht existiert — das
  // wäre ein anderer Fall (eine Regel über einen gelöschten Ordner) und nicht
  // der, für den E-057 entschieden wurde.
  const context = await leerClient.loadContext();
  assert.equal(context.ok, true, context.ok ? '' : context.message);

  const archiv = context.value.tagTree.rootFolders.find((node) => node.folder.name === 'Archiv');
  assert.ok(archiv, 'der Ordner „Archiv" fehlt im Baum, den das Add-in bekommt');
  assert.equal(archiv.tags.length, 0, 'in „Archiv" liegt ein Tag — dann misst der Abschnitt nichts');
  assert.equal(archiv.subfolders.length, 0, '„Archiv" hat einen Unterordner, der Tags tragen könnte');

  // Und der Ordner, gegen den verglichen wird, trägt welche.
  assert.deepEqual(WARTUNG_TAGS, [ID.tagTurnuswartung, ID.tagStoerung]);
});

await checkAsync('E-057: „Archiv und In Arbeit" wird nicht genannt — die Gegenprobe ohne Ordner schon', async () => {
  const inArbeit = await leerPoolsOf('TCK-000517');

  assert.equal(
    inArbeit.includes('Archiv, in Arbeit'),
    false,
    'der leere Ordner verschwindet aus der Regel — genannt wird ein Pool, den das Board nicht führt',
  );

  // Die Gegenprobe: **dieselbe** Statusachse, nur ohne den Ordner. Sie nennt
  // das Todo. Damit steht fest, dass oben der leere Ordner die Regel leerlaufen
  // lässt und nicht der Status.
  assert.ok(
    inArbeit.includes('In Arbeit'),
    'auch die Regel ohne Ordner nennt niemanden — dann misst die Prüfung darüber nichts',
  );
});

await checkAsync('E-057 termweise: der leere Ordner **neben** einem gefüllten zählt mit', async () => {
  // Der Fall, den eine achsenweise Zählung nicht sieht: „Wartung **oder**
  // Archiv" löst auf zwei Tags auf — die Summe sieht gesund aus, und der leere
  // Ordner daneben wäre unsichtbar, bis jemand ein Tag hineinlegt und sich die
  // Spalte ohne ersichtlichen Grund ändert.
  for (const callNumber of ['TCK-000517', 'TCK-000518']) {
    assert.equal(
      (await leerPoolsOf(callNumber)).includes('Wartung oder Archiv'),
      false,
      `${callNumber}: der leere Ordner geht in der Summe der Achse unter`,
    );
  }

  // Die Gegenprobe: derselbe Ordner „Wartung" allein nennt beide Todos.
  assert.ok((await leerPoolsOf('TCK-000517')).includes('Wartung Nord'));
  assert.ok((await leerPoolsOf('TCK-000518')).includes('Wartung Nord'));
});

await checkAsync('E-057: derselbe leere Ordner im **Ausschluss** schließt nichts aus', async () => {
  // Die Grenze der Entscheidung, und die Stelle, an der eine zu grobe Behebung
  // auffällt: „Keiner davon" über nichts engt nicht ein, sondern lässt in Ruhe.
  // Die Regel muss deshalb genau dieselben Todos nennen wie „Wartung Nord".
  for (const callNumber of ['TCK-000517', 'TCK-000518']) {
    const genannt = await leerPoolsOf(callNumber);
    assert.equal(
      genannt.includes('Wartung, außer Archiv'),
      genannt.includes('Wartung Nord'),
      `${callNumber}: der leere Ordner im Ausschluss verändert die Treffermenge`,
    );
    assert.ok(genannt.includes('Wartung, außer Archiv'), `${callNumber}: der Ausschluss schließt aus`);
  }
});

await checkAsync('Die vollständige Auskunft, in der Reihenfolge der Pools', async () => {
  // Nicht „ein Pool fehlt", sondern **welche** drei von fünf Regeln zutreffen.
  // Ohne E-057 stünden in beiden Zeilen zwei Namen mehr.
  assert.deepEqual(await leerPoolsOf('TCK-000517'), [
    'Wartung Nord',
    'In Arbeit',
    'Wartung, außer Archiv',
  ]);

  assert.deepEqual(await leerPoolsOf('TCK-000518'), ['Wartung Nord', 'Wartung, außer Archiv']);
});

check('T-082: das Pflichtfeld ist der Unterschied, und zwar in beide Richtungen', () => {
  /*
   * Die Gegenprobe gegen die Domäne, mit der Regel „Archiv und In Arbeit" in
   * ihrer aufgelösten Gestalt: `ruleTagIds` ist leer, weil im Ordner kein Tag
   * liegt. Genau daran hängt alles — mit `false` kommt Wort für Wort die
   * Antwort von vor E-057 heraus.
   *
   * Sie steht hier, weil der Übersetzer diese Datei nicht liest: Sie ist
   * `.mjs`. Für den Dienst ist `unresolvedRequired` seit T-082 Pflicht, hier
   * ist es Sorgfalt — und diese Prüfung ist die Wache dafür.
   */
  const aufgeloest = {
    todoTagIds: [ID.tagMusterbetrieb, ID.tagStoerung],
    ruleTagIds: [],
    matchMode: 'any',
    excludedTagIds: [],
    todoStatusId: ID.statusInArbeit,
    ruleStatusIds: [ID.statusInArbeit],
    completedAt: null,
    completion: 'any',
    hasOpenEntries: false,
    hasExportedEntries: false,
    exportState: 'any',
  };

  assert.equal(
    matchesPool({ ...aufgeloest, unresolvedRequired: false }),
    true,
    'die Antwort von vor E-057 ist nicht mehr herstellbar — dann misst die Zeile darunter nichts',
  );
  assert.equal(
    matchesPool({ ...aufgeloest, unresolvedRequired: true }),
    false,
    'das Pflichtfeld wirkt nicht: eine erforderliche Bedingung ohne Treffer lässt die Regel trotzdem treffen',
  );
});

// ===========================================================================
heading('14  Der Anzeigeort ist keine Antwort: reine Board-Spalten (E-054, E-056, T-090)');
// ===========================================================================

/*
 * Der Befund, den dieser Abschnitt misst
 * --------------------------------------
 *
 * `PoolPort.list` fragt seit E-054 nach einer **Fläche** und setzt ohne
 * Argument `'pool'` ein — geliefert werden dann nur Regeln mit `placement`
 * `pool` oder `both`. Die Vorgabe ist für ihre Aufrufer richtig; die Rechnung
 * über die Bewegung war bis T-090 eine von ihnen und ist es seit E-056 nicht
 * mehr. Sie beantwortet nicht „in welchen Pools steht das Todo", sondern was
 * diese Buchung ändert, und diese Frage kennt keine Fläche. Seit T-092 steht
 * sie als `poolMovementNamer` in `usecases/pool-movement.ts` und fragt dort
 * `list('all')`.
 *
 * Was daraus wurde: Eine Spalte „erledigt und noch nicht abgerechnet" mit
 * Anzeigeort **„Nur auf dem Board"** — die naheliegende Wahl, denn sie ist eine
 * Board-Spalte, und `board` ist die Vorgabe beim Anlegen über das Board —
 * wurde im Aufgabenbereich nie genannt. Weder beim Erscheinen noch beim
 * Verschwinden. Wer dieselbe Regel versehentlich als „Pool und Board"
 * einrichtete, bekam die Auskunft. Dieselbe Regel, dieselbe Wirkung, zwei
 * Verhalten — unterschieden durch eine Einstellung, die mit der Frage nichts
 * zu tun hat. E-056 begründet sich wörtlich mit genau diesem Fall und war für
 * ihn nicht umgesetzt (R-1 Befund 3, R-2 B-4).
 *
 * Gemessen wird gegen die **echten** Routen, mit `PLACEMENT_POOLS`: dreimal
 * dieselbe Regel, einmal je Anzeigeort. Die erste Prüfung gilt der Attrappe
 * selbst — sie hat das Flächenargument bis T-090 verschluckt und damit den
 * Befund unsichtbar gemacht.
 */

const flaechenStore = createFakeStore({ pools: PLACEMENT_POOLS });
const flaechenApp = mountAddinRoutes(flaechenStore.deps);
const flaechenClient = createApiClient({
  baseUrl: 'http://127.0.0.1:17843',
  token: () => 'takt_GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  fetch: (url, init) => flaechenApp.request(String(url), init),
});

for (const todo of buildAxisTodos()) flaechenStore.seedTodo(todo);

/*
 * Eine **offene** Buchung am Turnus-Todo. Erst damit ist es der Fall aus E-056:
 * erledigt und noch nicht abgerechnet — es steht in der Abrechnungsliste, und
 * die nächste Buchung nimmt es dort heraus.
 */
flaechenStore.state.timeEntries.push({
  id: 'te-flaeche-offen',
  todoId: AXIS_TODO.turnus,
  startedAt: '2026-02-25T14:00:00Z',
  endedAt: '2026-02-25T15:00:00Z',
  durationSeconds: 3600,
  note: 'Turnus, erster Teil',
  exportStatus: 'open',
  exportCount: 0,
  source: 'manual',
  createdAt: '2026-02-25T15:00:00Z',
  updatedAt: '2026-02-25T15:00:00Z',
});

const flaechenBewegung = async (callNumber) => {
  const result = await flaechenClient.findMatches(callNumber);
  assert.equal(result.ok, true, result.ok ? '' : result.message);
  assert.equal(result.value.matches.length, 1, `${callNumber} trifft nicht genau ein Todo`);
  const movement = result.value.matches[0].poolMovement;
  assert.notEqual(movement, null, `${callNumber} bewegt sich nicht — dann misst dieser Abschnitt nichts`);
  return movement;
};

await checkAsync('Die Ausgangslage: die Attrappe unterscheidet die Flächen', async () => {
  /*
   * Ohne diese Prüfung misst der ganze Abschnitt nichts. Die Attrappe schrieb
   * bis T-090 `list: async () => pools` und gab jede Regel heraus, gleich
   * wonach gefragt wurde — eine Attrappe, die großzügiger ist als der Betrieb,
   * macht den Fehler unsichtbar, den sie zeigen soll.
   *
   * `GET /addin/context` ist der Aufrufer, der weiterhin **ohne** Argument
   * fragt (`loadContext`), weil er die Pool-Liste als Fläche meint. Er darf die
   * reine Board-Spalte deshalb nicht sehen — und sieht die Regel mit `both`
   * sehr wohl.
   */
  const context = await flaechenClient.loadContext();
  assert.equal(context.ok, true, context.ok ? '' : context.message);

  assert.deepEqual(
    context.value.pools.map((pool) => pool.name),
    ['Wartung Nord', 'Erledigte Wartung (Pool und Board)'],
    'die Attrappe wertet das Flächenargument nicht aus — dann misst dieser Abschnitt nichts',
  );
});

await checkAsync('B-4: die reine Board-Spalte steht in `leaves` (E-056)', async () => {
  const turnus = await flaechenBewegung('TCK-000518');

  /*
   * Die Zeile, die vor T-090 rot gewesen wäre: Mit `unit.pools.list()` fehlt
   * „Erledigt, noch nicht abgerechnet" — die Spalte, für die E-056 geschrieben
   * wurde. Übrig bliebe allein die Regel mit `both`, und genau daran ist der
   * Befund zu erkennen: Es lag nie an der Regel.
   */
  assert.deepEqual(turnus.leaves, [
    'Erledigt, noch nicht abgerechnet',
    'Erledigte Wartung (Pool und Board)',
  ]);

  // Die Gegenprobe daneben: Die Regel ohne Erledigt-Achse bleibt, und sie
  // bleibt auch die einzige. Ein Pool steht nie in beiden Listen.
  assert.deepEqual(turnus.appears, ['Wartung Nord']);
  for (const name of turnus.leaves) {
    assert.equal(turnus.appears.includes(name), false, `„${name}" steht in beiden Listen`);
  }
});

await checkAsync('Der Satz nennt die Board-Spalte beim Namen — und nennt sie nicht „Pool"', async () => {
  const turnus = await flaechenBewegung('TCK-000518');
  const satz = reopenPreview(15, turnus).effects[2];

  assert.equal(satz, poolMovementSentence(turnus, 'future', 'reopen'));
  assert.match(satz, /„Erledigt, noch nicht abgerechnet“/, 'die Abrechnungsliste fehlt im Satz');
  assert.match(satz, / und verschwindet aus /, 'das Verschwinden steht nicht im selben Satz');

  // Ein Satz, wie E-056 es verlangt — auch mit einer Spalte darin.
  assert.equal(satz.indexOf('.'), satz.length - 1, `mehr als ein Satz: ${satz}`);

  /*
   * E-058 Punkt 4, an genau dem Fall gemessen, für den er entschieden wurde.
   *
   * „Erledigt, noch nicht abgerechnet" ist eine **reine Board-Spalte**
   * (`placement: 'board'`). Bis T-092 setzte der Satz unbedingt „dem Pool" /
   * „den Pools" davor: der Name stimmte, das Gattungswort nicht — und wer ihn
   * las, suchte in der Pool-Liste, in der die Spalte nicht steht. Seit T-093
   * nennt der Satz nur noch den Namen in Anführungszeichen.
   *
   * Geprüft wird deshalb die **Abwesenheit** des Gattungswortes vor dem Namen
   * und nicht ein bestimmter Wortlaut. „in keinem Pool und in keiner Spalte" —
   * der Satz ohne jeden Treffer — bleibt davon unberührt: Dort steht kein Name
   * dahinter, und dieser Satz hat einen.
   */
  assert.equal(
    /(dem Pool|den Pools|der Spalte|den Spalten)\s+„/.test(satz),
    false,
    `der Satz stellt ein Gattungswort vor den Namen (E-058 Punkt 4): ${satz}`,
  );
});

await checkAsync('I-05 über die Flächen: die Bestätigung sagt dasselbe wie die Ankündigung', async () => {
  const davor = await flaechenBewegung('TCK-000518');

  const booked = await flaechenClient.book({
    todoId: AXIS_TODO.turnus,
    startedAt: '2026-03-02T11:00:00Z',
    endedAt: '2026-03-02T11:15:00Z',
    note: 'Turnus abgeschlossen',
  });

  assert.equal(booked.ok, true, booked.ok ? '' : booked.message);
  assert.equal(booked.value.doneCleared, true, 'die Ausgangslage stimmt nicht — das Todo war erledigt');

  assert.notEqual(booked.value.poolMovement, null, 'die Bestätigung sagt nichts über die Bewegung');
  assert.deepEqual(booked.value.poolMovement.leaves, davor.leaves);
  assert.deepEqual(booked.value.poolMovement.appears, davor.appears);
});

// ===========================================================================
heading('15  Scheitert das Wiederöffnen, fällt die Buchung mit (R-1 Befund 2)');
// ===========================================================================

/*
 * Der Befund, den dieser Abschnitt misst
 * --------------------------------------
 *
 * `bookOnTodo` schreibt erst die Buchung und hebt danach „Erledigt" auf.
 * Scheitert das Aufheben, gab die Funktion bis T-090 `{ kind: 'rejected' }`
 * **zurück** — und die Transaktionsklammer nimmt nur bei einem **Wurf**
 * zurück. Eine gewöhnliche Rückgabe führt zu `COMMIT`.
 *
 * Das Ergebnis war der teuerste Zustand dieses Bestands: Die Zeit steht
 * festgeschrieben in der Datenbank, das Todo gilt weiter als erledigt, und der
 * Aufgabenbereich meldet „abgewiesen". Wer das liest, bucht noch einmal — und
 * derselbe Zeitraum geht zweimal in die Abrechnung.
 *
 * Gemessen wird an der Attrappe, weil nur sie den Fehlschlag herstellen kann
 * (`clearDoneFailure`). Sie nimmt bei einem Wurf denselben Abzug zurück wie
 * SQLite mit `ROLLBACK` — dieselbe Bauart, aus der schon „kein Tag ohne sein
 * Todo" (T-047) gemessen wird. Drei Prüfungen: der Fehlschlag, der Bestand
 * danach, und die Gegenprobe ohne den Fehlschlag.
 */

const FEHLSCHLAG = Object.freeze({
  code: 'storage_error',
  message: 'Die Datenbank hat den Schreibvorgang abgelehnt.',
});

const abbruchStore = createFakeStore({ clearDoneFailure: FEHLSCHLAG });
const abbruchApp = mountAddinRoutes(abbruchStore.deps);
const abbruchClient = createApiClient({
  baseUrl: 'http://127.0.0.1:17843',
  token: () => 'takt_HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
  fetch: (url, init) => abbruchApp.request(String(url), init),
});

for (const todo of buildAxisTodos()) abbruchStore.seedTodo(todo);

const BUCHUNG = Object.freeze({
  todoId: AXIS_TODO.turnus,
  startedAt: '2026-03-02T11:00:00Z',
  endedAt: '2026-03-02T11:15:00Z',
  note: 'Turnus abgeschlossen',
});

check('Die Ausgangslage: das Todo ist erledigt, und es gibt keine Buchung darauf', () => {
  // Ohne sie wäre unten jede Aussage mehrdeutig: Ein Bestand ohne neue Buchung
  // beweist nichts, wenn schon vorher keine da war und das Todo offen ist.
  assert.notEqual(abbruchStore.state.todos.get(AXIS_TODO.turnus).completedAt, null);
  assert.equal(
    abbruchStore.state.timeEntries.some((entry) => entry.todoId === AXIS_TODO.turnus),
    false,
  );
});

await checkAsync('Scheitert `clearDone`, entsteht keine Buchung — und das Todo bleibt erledigt', async () => {
  const booked = await abbruchClient.book(BUCHUNG);

  assert.equal(booked.ok, false, 'der Fehlschlag ist gar nicht eingetreten');
  assert.equal(booked.code, FEHLSCHLAG.code, 'der Grund kommt nicht durch');

  /*
   * Der Kern des Befundes. Vor T-090 stand hier **eine** Buchung: Die Klammer
   * hatte festgeschrieben, weil eine Rückgabe kein Wurf ist.
   */
  assert.deepEqual(
    abbruchStore.state.timeEntries.filter((entry) => entry.todoId === AXIS_TODO.turnus),
    [],
    'die Zeit ist gebucht, obwohl die Antwort „abgewiesen" lautet — dieselbe Zeit geht zweimal in die Abrechnung',
  );

  // Und der zweite Teil desselben Zustands: Das Kennzeichen steht noch. Ein
  // halber Vorgang ist auch dann falsch, wenn er in die andere Richtung
  // stehenbleibt.
  assert.notEqual(
    abbruchStore.state.todos.get(AXIS_TODO.turnus).completedAt,
    null,
    'das Kennzeichen ist gefallen, obwohl das Aufheben gescheitert ist',
  );
});

await checkAsync('Die Gegenprobe: ohne den Fehlschlag bucht derselbe Aufruf', async () => {
  /*
   * Ohne sie stünde nur fest, dass irgendetwas den Aufruf abweist — nicht,
   * dass es der Fehlschlag beim Wiederöffnen war. Derselbe Bestand, derselbe
   * Aufruf, ein Schalter Unterschied.
   */
  const heilStore = createFakeStore();
  const heilApp = mountAddinRoutes(heilStore.deps);
  const heilClient = createApiClient({
    baseUrl: 'http://127.0.0.1:17843',
    token: () => 'takt_HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    fetch: (url, init) => heilApp.request(String(url), init),
  });

  for (const todo of buildAxisTodos()) heilStore.seedTodo(todo);

  const booked = await heilClient.book(BUCHUNG);

  assert.equal(booked.ok, true, booked.ok ? '' : booked.message);
  assert.equal(booked.value.doneCleared, true);
  assert.equal(
    heilStore.state.timeEntries.filter((entry) => entry.todoId === AXIS_TODO.turnus).length,
    1,
  );
  assert.equal(heilStore.state.todos.get(AXIS_TODO.turnus).completedAt, null);
});

// ===========================================================================
process.stdout.write(
  `\n${'═'.repeat(58)}\n${String(passed)} bestanden, ${String(failed)} fehlgeschlagen.\n`,
);
process.exit(failed === 0 ? 0 : 1);
