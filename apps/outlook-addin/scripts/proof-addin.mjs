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
import { NO_CALL_NUMBER_FOUND, REJECTION_LABEL } from '../src/callnumber/labels.ts';
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
import {
  MAX_TAKEOVER_CHARACTERS,
  MAX_TITLE_CHARACTERS,
  prepareNote,
  suggestTitle,
} from '../src/office/mail.ts';
import { HIDDEN_MARKER, dropHidden, hasHidden, visibleText } from '../src/text/hidden.ts';
import { cutToCharacterBoundary } from '../src/text/cut.ts';
import { dueDateForRequest, readDueDate } from '../src/duedate/entry.ts';
import {
  fieldErrorId,
  fieldHintId,
  fieldParts,
  withDescription,
} from '../src/ui/field.ts';
import { createTodoGate } from '../src/ui/create-gate.ts';

// --- Prüflinge: die Add-in-Routen des lokalen Dienstes ---------------------
// Bewusst über einen relativen Pfad und nicht über eine Paketabhängigkeit: Der
// Aufgabenbereich soll `@takt/local-api` nicht in seiner Abhängigkeitsliste
// führen. Ein Browserbündel, das den Dienst importieren kann, importiert ihn
// irgendwann.
import { mountAddinRoutes } from '../../local-api/src/routes/addin/index.ts';

/*
 * Und der Leser der Schnittstellenbeschreibung, für den **Add-in-Abschnitt**
 * (E-053, T-123).
 *
 * Der Abschnitt gehört dem Add-in, also wird er hier gemessen und nicht in
 * `proof:openapi` — dieselbe Aufteilung wie bei den Routen selbst. Der Leser
 * ist der aus T-039: ein kleiner, strenger YAML-Leser ohne neue Abhängigkeit.
 */
import { parseYaml } from '../../local-api/scripts/openapi-reader.mjs';

/*
 * --- Prüflinge: die **beiden Türen** (T-114) -------------------------------
 *
 * Zwei Schemata, die dieser Nachweis bis T-114 nicht brauchte, und sie stehen
 * hier aus genau dem Grund, den der security-checker in T-112 aufgeschrieben
 * hat: „sonst läuft es beim nächsten Mal wieder auseinander."
 *
 * Zwischen T-101 und T-114 waren sie auseinander. Die Hauptanwendung wies
 * Steuer- und Richtungszeichen ab, das Add-in nicht — und ein Kommentar in
 * `routes/addin/schema.ts` sicherte die Gleichheit weiterhin zu. Eine
 * Zusicherung, die niemand ausführt, ist eine Behauptung; sie war es fünf
 * Wellen lang, ohne dass ein Lauf rot wurde.
 *
 * Geprüft wird deshalb nicht, ob beide Dateien dieselbe Zeile enthalten —
 * das wäre wieder eine Aussage über den Wortlaut —, sondern was jede Tür
 * **annimmt und abweist**. Das bliebe auch dann richtig, wenn eine der beiden
 * Seiten ihre Prüfung umbaut.
 *
 * **Seit T-123 gegen die Quelle und nicht mehr gegeneinander** (E-063 Punkt 4).
 * Zwei Türen gegeneinander zu halten sagt, daß sie gleich sind, aber nicht,
 * daß sie richtig sind — und wenn beide dieselbe Abschrift tragen, sagt es gar
 * nichts. Abschnitt 16 hält deshalb **jede** Tür einzeln gegen
 * `FORBIDDEN_NAME_CHARACTERS` aus `@takt/domain`; daß sie einander gleichen,
 * folgt daraus, statt gemessen zu werden.
 */
import { REQUEST_SCHEMAS as MAIN_REQUEST_SCHEMAS } from '../../local-api/src/routes/todos.ts';
import {
  ADDIN_NOTE_MAX_LENGTH,
  ADDIN_TAG_IDS_MAX,
  ADDIN_BOOKING_NOTE_MAX_LENGTH,
  ADDIN_TAG_NAMES_MAX,
  REQUEST_SCHEMAS as ADDIN_REQUEST_SCHEMAS,
  bookSchema as addinBookSchema,
  createTodoSchema as addinCreateTodoSchema,
} from '../../local-api/src/routes/addin/schema.ts';
import { REQUEST_SCHEMAS as MAIN_TIME_SCHEMAS } from '../../local-api/src/routes/time.ts';

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
  CONTROL_WHITESPACE,
  DUE_DATE_MESSAGE,
  DUE_DATE_SHAPE,
  FORBIDDEN_NAME_CHARACTERS,
  HIDDEN_MARKER as DOMAENE_MARKE,
  MAX_DUE_YEAR,
  MAX_TAG_NAME_LENGTH,
  MAX_TITLE_CHARACTERS as DOMAENE_MAX_TITEL,
  MIN_DUE_YEAR,
  POOL_RULE_AXIS_IDS,
  POOL_RULE_AXIS_OF_FIELD,
  checkCallNumber,
  dropHiddenCharacters,
  hasHiddenCharacter,
  isCalendarDay,
  matchesPool,
  mayLookUpDuplicates,
  poolMovementSentence,
  tagNameKey,
  visibleText as domaeneVisibleText,
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
  // Seit E-080 siezt Takt. „wenn du" allein finge die bedingte Formulierung
  // nicht mehr, in die sie beim nächsten Umschreiben rutschen könnte.
  assert.equal(
    /sofern|wenn (?:du|Sie)|ausdrücklich|Kästchen/.test(REOPEN_HINT),
    false,
    `bedingt formuliert: ${REOPEN_HINT}`,
  );
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
heading('16  Beide Türen lesen die Zeichenklasse der Domäne (T-114, T-122, T-123)');
// ===========================================================================

/*
 * Der Befund, gegen den dieser Abschnitt steht — und der zweite, an dem er
 * selbst beteiligt war.
 *
 * `apps/local-api/src/http/input.ts` weist seit T-101 Steuerzeichen (C0, C1)
 * und die bidirektionalen Formatierungszeichen an Titeln und Namen ab. Die
 * Add-in-Tür hatte ihre eigene Abschrift des Schemas und bekam die Prüfung
 * nicht mit — ausgerechnet die Tür, deren Titel mit dem **Betreff einer
 * E-Mail** vorbelegt ist und deren Kopfkommentar sagt, dass hier jede
 * Zeichenkette eine fremde Quelle berührt hat. Das war T-114.
 *
 * **Dieser Abschnitt hat den nächsten Fall derselben Art durchgelassen.** Bis
 * T-123 stand hier eine Liste von zwanzig **abgeschriebenen** Codepunkten. Als
 * T-117 die Klasse um `U+061C`, `U+200E` und `U+200F` erweiterte, wuchs die
 * Liste nicht mit, der Lauf blieb grün, und der Titelvorschlag des Add-ins ließ
 * die drei Marken stehen (gefunden in T-119). Eine Abschrift im Nachweis ist
 * dieselbe Fehlerquelle wie eine Abschrift im Quelltext, nur schlechter: Sie
 * gibt zusätzlich das Gefühl, gemessen zu haben.
 *
 * Seit T-122 liegt die Klasse an genau einer Stelle
 * (`packages/domain/src/characters.ts`), und seit T-123 liest dieser Abschnitt
 * sie dort. Es gibt hier **keine Liste mehr, die jemand pflegen müsste** — die
 * Zeichen unten entstehen bei jedem Lauf aus den Bereichen der Domäne.
 *
 * Die Zeichen bleiben dabei **Zahlen** und werden nie roh in diese Datei
 * geschrieben. Das ist kein Geschmack: Ein rohes `U+0000` in einer Quelldatei
 * macht sie für Git zu einer Binärdatei — `git diff` zeigt dann
 * „Bin 0 -> … bytes", und ausgerechnet der Nachweis einer Zeichenwache wäre der
 * eine Teil, den ein Reviewer nicht lesen kann. `String.fromCodePoint` prüft
 * dasselbe und lässt die Datei Text bleiben.
 */

/** `U+XXXX` — für Meldungen und für die Aufzählung in Fehlertexten. */
const alsName = (punkt) => `U+${punkt.toString(16).toUpperCase().padStart(4, '0')}`;

/**
 * Jeder einzelne Codepunkt der Klasse — **erzeugt**, nicht abgeschrieben.
 *
 * `FORBIDDEN_NAME_CHARACTERS` führt Bereiche; hier werden sie ausgerollt, weil
 * jede Prüfung darunter ein Zeichen braucht und keinen Bereich. Wächst die
 * Klasse, wächst diese Liste im selben Lauf mit.
 */
const KLASSE = [];
for (const bereich of FORBIDDEN_NAME_CHARACTERS) {
  for (let punkt = bereich.from; punkt <= bereich.to; punkt += 1) KLASSE.push(punkt);
}

/**
 * Abgewiesen, aber **Leerraum** und deshalb kein Ausfall: Ein Tabulator trennt
 * zwei Wörter, ein `U+0000` nicht.
 *
 * Auch diese Grenze wird gelesen und nicht abgeschrieben. Sie stand bis T-123
 * als `0x0009` bis `0x000d` hier — eine kleine Abschrift, aber eine, die
 * dieselbe Aufgabe hat wie die große: Sie sagt, welche Zeichen zu einem
 * Leerzeichen werden statt zur Marke. Zwei Stellen, die das verschieden sagen,
 * ergäben eine Anzeige und einen Vorschlag, die sich uneinig sind.
 */
const istLeerraum = (punkt) =>
  CONTROL_WHITESPACE.some((bereich) => punkt >= bereich.from && punkt <= bereich.to);

/**
 * Was beide Türen **annehmen** müssen.
 *
 * Ohne diese Hälfte belegte der Abschnitt nur, dass irgendetwas abgewiesen
 * wird — eine Tür, die alles abweist, bestünde jede Prüfung darüber. Umlaute,
 * Eszett, Gedankenstrich, deutsche Anführungszeichen und ein Emoji stehen in
 * echten Betreffzeilen; das geschützte und das schmale Leerzeichen stehen
 * dicht neben der abgewiesenen Menge und gehören trotzdem nicht dazu.
 *
 * **Diese Liste bleibt von Hand geschrieben, und das ist kein Rückfall in die
 * Abschrift** (T-123). Sie ist nicht die Klasse noch einmal, sondern eine
 * Anforderung **an** sie: Diese Zeichen müssen eintragbar bleiben. Aus der
 * Domäne erzeugt wäre sie wertlos — sie würde mitwachsen, wenn die Klasse in
 * die falsche Richtung wächst, und genau dann soll sie rot werden.
 */
const ANGENOMMENE_ZEICHEN = [
  [0x0020, 'Leerzeichen'],
  [0x00e4, 'ä'],
  [0x00df, 'ß'],
  [0x00e9, 'é'],
  [0x2014, 'Gedankenstrich'],
  [0x201e, 'öffnendes deutsches Anführungszeichen'],
  [0x00a0, 'geschütztes Leerzeichen'],
  [0x202f, 'schmales geschütztes Leerzeichen — liegt zwischen den Bidi-Zeichen'],
  [0x1f6e0, 'Emoji (außerhalb der BMP, zwei UTF-16-Einheiten)'],
];

const hauptTuer = MAIN_REQUEST_SCHEMAS.createTodo;
const addinTuer = addinCreateTodoSchema;

/** Nimmt diese Tür diesen Rumpf an? */
const nimmtAn = (tuer, rumpf) => tuer.safeParse(rumpf).success;

/** Welche Felder hat diese Tür beanstandet? */
const beanstandet = (tuer, rumpf) => {
  const geprueft = tuer.safeParse(rumpf);
  return geprueft.success ? [] : geprueft.error.issues.map((issue) => issue.path.join('.'));
};

const alsTitel = (zeichen) => ({ title: `Wartung${zeichen}Nord` });
const alsTagname = (zeichen) => ({ title: 'Wartung Nord', tagNames: [`Kunde${zeichen}Ost`] });

/*
 * Ein Durchlauf durch die **ganze BMP**, für beide Türen und beide Felder.
 *
 * Gefragt wird jede Tür einzeln und keine gegen die andere. Der Unterschied ist
 * der ganze Punkt von T-123: Zwei Türen, die einander gleichen, können
 * gemeinsam falsch liegen — sie taten es zwischen T-117 und T-119 gegenüber dem
 * Add-in. Gegen die **Quelle** gemessen kann jede Tür nur einzeln falsch
 * liegen, und dass sie einander gleichen, folgt daraus.
 *
 * Die Ersatzstellen (`U+D800` bis `U+DFFF`) bleiben ausgespart: Einzeln stehen
 * sie für kein Zeichen; die Frage nach ihnen ist die des Schnitts (Abschnitt
 * 17) und nicht die der Zeichenklasse.
 *
 * Ein Durchlauf und nicht vier: Die vier Messungen brauchen dasselbe Zeichen.
 */
const gemessen = {
  'Add-in-Tür, Titel': [],
  'Add-in-Tür, Tagname': [],
  'Haupttür, Titel': [],
  'Haupttür, Tagname': [],
};
for (let punkt = 0; punkt <= 0xffff; punkt += 1) {
  if (punkt >= 0xd800 && punkt <= 0xdfff) continue;
  const zeichen = String.fromCodePoint(punkt);
  if (!nimmtAn(addinTuer, alsTitel(zeichen))) gemessen['Add-in-Tür, Titel'].push(punkt);
  if (!nimmtAn(addinTuer, alsTagname(zeichen))) gemessen['Add-in-Tür, Tagname'].push(punkt);
  if (!nimmtAn(hauptTuer, alsTitel(zeichen))) gemessen['Haupttür, Titel'].push(punkt);
  if (!nimmtAn(hauptTuer, alsTagname(zeichen))) gemessen['Haupttür, Tagname'].push(punkt);
}

/** Was die Domäne für diesen Durchlauf sagt: die Klasse, auf die BMP beschnitten. */
const KLASSE_BMP = KLASSE.filter((punkt) => punkt <= 0xffff);

check(`die Klasse der Domäne trägt ${String(KLASSE.length)} Zeichen — und nicht alles`, () => {
  /*
   * Der Wächter vor allem Folgenden. Wäre `FORBIDDEN_NAME_CHARACTERS` leer,
   * prüfte jede Schleife darunter die leere Menge und wäre grün, ohne etwas zu
   * sagen; enthielte sie zu viel, wäre eine Tür grün, die niemanden mehr
   * hereinlässt. Beide Enden stehen deshalb hier.
   */
  assert.ok(KLASSE.length > 50, `nur ${String(KLASSE.length)} Zeichen — die Klasse greift ins Leere`);
  assert.ok(KLASSE.length < 200, `${String(KLASSE.length)} Zeichen — die Klasse ist zu breit geworden`);

  // Und zwei Zeichen, die ausdrücklich **nicht** dazugehören dürfen: der
  // Verbinder hält zusammengesetzte Emoji zusammen, der Umlaut steht in jedem
  // zweiten deutschen Betreff. Diese Zeile ist eine Anforderung an die Klasse
  // und keine Abschrift von ihr — sie wird rot, wenn die Klasse zu weit wächst.
  assert.equal(KLASSE.includes(0x200d), false, 'ZWJ steht in der Klasse — Emoji zerfallen');
  assert.equal(KLASSE.includes(0x00e4), false, '„ä" steht in der Klasse');
});

check('die Add-in-Tür weist im Titel genau die Zeichen der Domäne ab — die ganze BMP gefragt', () => {
  assert.deepEqual(
    gemessen['Add-in-Tür, Titel'].map(alsName),
    KLASSE_BMP.map(alsName),
    'die Tür und die Domäne sagen nicht dasselbe',
  );
});

check('dieselbe Messung an einem Tagnamen der Add-in-Tür', () => {
  assert.deepEqual(gemessen['Add-in-Tür, Tagname'].map(alsName), KLASSE_BMP.map(alsName));
});

check('und die Haupttür sagt es an beiden Feldern ebenso — damit gleichen sich beide Türen', () => {
  /*
   * Die Haupttür steht hier, obwohl sie nicht dem Add-in gehört: Sie ist die
   * zweite Hälfte der Sackgasse. Ein Todo, das über `POST /addin/todos`
   * hineingeht und über `PATCH /todos/{todoId}` nicht mehr zu speichern ist,
   * ist derselbe Befund C-03 wie 2024 die Länge 512.
   */
  assert.deepEqual(gemessen['Haupttür, Titel'].map(alsName), KLASSE_BMP.map(alsName));
  assert.deepEqual(gemessen['Haupttür, Tagname'].map(alsName), KLASSE_BMP.map(alsName));
});

check('der Add-in-Abschnitt der Schnittstellenbeschreibung führt die Klasse nicht mit', () => {
  /*
   * T-117 R1, und dieselbe Lehre eine Ebene weiter.
   *
   * Eine **Beschreibung** kann eine Regel nicht importieren; sie kann sie nur
   * nachzeichnen oder auf sie zeigen. Nachgezeichnet hat sie hier zwei Wellen
   * lang falsch: `POST /addin/todos` zählte die Zeichen auf, T-117 erweiterte
   * die Klasse, die Aufzählung blieb stehen. Seit T-123 zeigt sie nur noch —
   * auf `packages/domain/src/characters.ts` und auf die Antwort `422`, in der
   * die Aufzählung **einmal** steht und gegen die Klasse gemessen wird
   * (`proof:openapi` Abschnitt 16).
   *
   * Gemessen wird deshalb das Gegenteil des Üblichen: dass hier **kein**
   * Zeichen der Klasse genannt ist. Eine Beschreibung, die nichts aufzählt,
   * kann nicht hinterherhinken.
   */
  const spec = parseYaml(readFileSync(path.join(here, '..', '..', 'local-api', 'openapi', 'takt-local-api.yaml'), 'utf8'));
  const addinPfade = Object.keys(spec.paths ?? {}).filter((pfad) => pfad.startsWith('/addin'));
  assert.ok(addinPfade.length >= 4, `nur ${String(addinPfade.length)} Add-in-Pfade — der Leser greift ins Leere`);

  const abschnitt = JSON.stringify(addinPfade.map((pfad) => spec.paths[pfad])).toUpperCase();
  const aufgezaehlt = KLASSE.filter((punkt) => abschnitt.includes(alsName(punkt)));
  assert.deepEqual(
    aufgezaehlt.map(alsName),
    [],
    'der Add-in-Abschnitt zählt die Klasse ein zweites Mal auf — sie wird dort veralten',
  );

  // Und die Gegenprobe: Ein Verweis, der auf nichts zeigt, wäre schlechter als
  // die Aufzählung. Beide Felder nennen den einen Ort, und die Route führt die
  // Antwort, in der die Zeichen stehen.
  const rumpf = spec.paths['/addin/todos']?.post;
  const felder = rumpf?.requestBody?.content?.['application/json']?.schema?.properties ?? {};
  for (const feld of ['title', 'tagNames']) {
    assert.match(
      String(felder[feld]?.description ?? ''),
      /packages\/domain\/src\/characters\.ts/,
      `${feld} nennt den Ort der Zeichenklasse nicht`,
    );
  }
  assert.equal(
    rumpf?.responses?.['422']?.$ref,
    '#/components/responses/UnprocessableEntity',
    'die Route verweist nicht auf die Antwort, in der die Zeichen aufgezählt sind',
  );
});

check('die Beanstandung nennt das Feld, in dem sie entstanden ist', () => {
  const rlo = String.fromCodePoint(0x202e);
  assert.deepEqual(beanstandet(addinTuer, alsTitel(rlo)), ['title']);
  // `path.join('.')` ergibt bei einem Listeneintrag `tagNames.0`. Der
  // Aufgabenbereich übersetzt das seit T-114 in „Neue Tags, Eintrag 1".
  assert.deepEqual(beanstandet(addinTuer, alsTagname(rlo)), ['tagNames.0']);
});

check(`beide Türen nehmen dieselben ${String(ANGENOMMENE_ZEICHEN.length)} harmlosen Zeichen an`, () => {
  const abweichungen = [];
  for (const [punkt, was] of ANGENOMMENE_ZEICHEN) {
    const zeichen = String.fromCodePoint(punkt);
    // Erst an die Quelle: Ein harmloses Zeichen, das in der Klasse steht, ist
    // ein Fehler der Klasse und nicht der Tür — und die Türen wären dabei
    // einträchtig grün.
    if (KLASSE.includes(punkt)) abweichungen.push(`${was}: steht in der Klasse der Domäne`);
    for (const [feld, bauen] of [['Titel', alsTitel], ['Tagname', alsTagname]]) {
      const haupt = nimmtAn(hauptTuer, bauen(zeichen));
      const addin = nimmtAn(addinTuer, bauen(zeichen));
      if (haupt !== addin || !haupt) {
        abweichungen.push(`${feld} ${was}: Haupttür ${haupt ? 'nimmt an' : 'weist ab'}, Add-in-Tür ${addin ? 'nimmt an' : 'weist ab'}`);
      }
    }
  }
  assert.deepEqual(abweichungen, [], abweichungen.join('; '));
});

check('die Titellänge hat eine Herkunft: der Aufgabenbereich führt keine eigene', () => {
  /*
   * ---------------------------------------------------------------------------
   * Warum hier keine Zahlen mehr verglichen werden (T-128, T-134, E-063 Punkt 5)
   * ---------------------------------------------------------------------------
   *
   * Bis T-134 stand an dieser Stelle ein Vergleich: Das Add-in trug seine eigene
   * `MAX_TITLE_CHARACTERS = 500`, der Dienst seine, und dieser Abschnitt hielt
   * beide gegeneinander. Der Vergleich war ehrlich gemeint und trotzdem die
   * schwächste Sorte Prüfung, die es hier geben kann: **Er wird erst rot, wenn
   * die Doppelung schon falsch ist.** Führen beide Seiten dieselbe falsche Zahl,
   * bleibt er grün — er misst die Doppelung nicht, er verträgt sie. Genau so hat
   * die Zeichenklasse fünf Wellen überlebt (T-117 bis T-123).
   *
   * Gefragt ist deshalb nicht mehr „steht hier und dort dasselbe?", sondern
   * **„kommt der Wert an dieser Stelle aus `@takt/domain`?"**.
   *
   * ---------------------------------------------------------------------------
   * Warum das bei einer Zahl anders gemessen werden muss als bei einer Funktion
   * ---------------------------------------------------------------------------
   *
   * Für die Zeichenklasse genügt `assert.equal(dropHidden, dropHiddenCharacters)`
   * (Abschnitt 17): Zwei Funktionen sind genau dann dieselbe Sache, wenn sie
   * dasselbe Objekt sind. Eine **Zahl** hat keine Kennung. `500 === 500` ist
   * wahr, gleichgültig, wo die beiden Fünfhundert herkommen — die Frage nach der
   * Herkunft lässt sich zur Laufzeit an einem Zahlenwert überhaupt nicht
   * stellen.
   *
   * Sie lässt sich am **Quelltext** stellen, und zwar in drei Teilen, die
   * einzeln nichts und zusammen alles sagen:
   *
   *  1. Kein Quelltext des Aufgabenbereichs **trägt** die Zahl. Das Muster dafür
   *     wird aus der Domäne **erzeugt** und nicht hingeschrieben — änderte die
   *     Domäne ihren Wert, suchte dieser Lauf im selben Durchgang nach dem
   *     neuen. Ein Wächter, der seine eigene Zahl abschriebe, wäre wieder genau
   *     das Muster, gegen das er steht.
   *  2. Die eine Datei, die den Namen ausführt, holt ihn aus `@takt/domain`.
   *  3. Der Wert, den der Aufgabenbereich tatsächlich herausgibt, ist der der
   *     Domäne. Ohne diesen dritten Teil bestünde die Prüfung auch dann, wenn
   *     jemand `MAX_NAME_LENGTH as MAX_TITLE_CHARACTERS` ausführte — ein Import
   *     aus der richtigen Datei mit der falschen Bedeutung.
   *
   * Teil 1 allein bemerkt eine daneben angelegte Kopie, Teil 2 allein eine
   * Umleitung, Teil 3 allein eine Verwechslung. Erst zusammen sind sie die
   * Aussage „eine Quelle" — dieselbe Bauart wie das Paar in Abschnitt 17, nur
   * für einen Wert ohne Kennung.
   */

  // Teil 1 — erzeugt, nicht abgeschrieben.
  const zahl = new RegExp(`(?<![\\d_])${String(DOMAENE_MAX_TITEL)}(?![\\d_])`);
  const traeger = files
    .filter((datei) => /\.tsx?$/.test(datei))
    .filter((datei) => zahl.test(sourceWithoutComments(datei)))
    .map((datei) => path.relative(srcRoot, datei));
  assert.deepEqual(
    traeger,
    [],
    `der Aufgabenbereich führt die Zahl ${String(DOMAENE_MAX_TITEL)} selbst, in: ${traeger.join(', ')} — ` +
      'kommt sie aus der Domäne, gehört der Name hin; bedeutet sie etwas anderes, gehört ihr ein eigener Name',
  );

  // Teil 2 — die Datei, die den Namen ausführt, liest ihn.
  const deckel = sourceWithoutComments(path.join(srcRoot, 'office', 'mail.ts'));
  assert.match(deckel, /from '@takt\/domain'/, 'mail.ts liest die Domäne nicht');
  assert.match(
    deckel,
    /\bMAX_TITLE_CHARACTERS\b[\s\S]*?from '@takt\/domain'|from '@takt\/domain'[\s\S]*?\bMAX_TITLE_CHARACTERS\b/,
    'mail.ts holt MAX_TITLE_CHARACTERS nicht aus @takt/domain',
  );
  assert.equal(
    /(?:const|let|var)\s+MAX_TITLE_CHARACTERS\b/.test(deckel),
    false,
    'mail.ts erklärt MAX_TITLE_CHARACTERS wieder selbst',
  );

  // Teil 3 — und es ist auch der richtige Name aus der Domäne.
  assert.equal(
    MAX_TITLE_CHARACTERS,
    DOMAENE_MAX_TITEL,
    'der Aufgabenbereich führt einen anderen Wert aus der Domäne unter diesem Namen',
  );
});

check('beide Türen wenden den Deckel wirklich an — die Bindung, nicht die Zahl', () => {
  /*
   * Was vom alten Zahlenvergleich bleibt und **nicht** tautologisch ist: Dass
   * die Zahl aus einer Quelle kommt, sagt nichts darüber, ob `zod` sie an
   * diesem Feld tatsächlich anwendet. Die Bindung kann jemand lösen, ohne die
   * Zahl anzufassen — genauso wie bei der Zeichenklasse eine Zeile weiter oben.
   *
   * Gemessen wird deshalb **jede Tür einzeln gegen die Domäne** und keine gegen
   * die andere (T-123): Zwei Türen, die einander gleichen, können gemeinsam
   * falsch liegen. Dass sie einander gleichen, folgt jetzt, statt gemessen zu
   * werden.
   *
   * Der Befund dahinter stand länger im Baum als der der Zeichenklasse: Die
   * Add-in-Tür nahm 512 Zeichen an, die Hauptanwendung 500. Ein so angelegtes
   * Todo ließ sich über `PATCH /todos/{todoId}` nie wieder speichern — der
   * Änderungsdialog schickt den Titel mit.
   */
  const gerade = 'a'.repeat(DOMAENE_MAX_TITEL);
  const einsZuViel = 'a'.repeat(DOMAENE_MAX_TITEL + 1);

  for (const [wo, tuer] of [['die Add-in-Tür', addinTuer], ['die Haupttür', hauptTuer]]) {
    assert.equal(nimmtAn(tuer, { title: gerade }), true, `${wo} nimmt den Deckel der Domäne nicht an`);
    assert.equal(nimmtAn(tuer, { title: einsZuViel }), false, `${wo} nimmt mehr an als die Domäne sagt`);
  }
});

check(`der Tagname bleibt an ${String(MAX_TAG_NAME_LENGTH)} Zeichen aus der Domäne gebunden`, () => {
  /*
   * Bis T-114 stand `MAX_TAG_NAME_LENGTH` als Zahl in `routes/addin/schema.ts`
   * und band die Route damit sichtbar an die Domäne. Seit die Route
   * `nameSchema` benutzt, kommt die Zahl aus dem Dienst — und die Bindung
   * steht hier statt in einem Kommentar. Laufen beide auseinander, wird dieser
   * Lauf rot; vorher wäre gar nichts geschehen.
   */
  const gerade = 'a'.repeat(MAX_TAG_NAME_LENGTH);
  const einsZuViel = 'a'.repeat(MAX_TAG_NAME_LENGTH + 1);

  for (const [wo, tuer] of [['Haupttür', hauptTuer], ['Add-in-Tür', addinTuer]]) {
    assert.equal(nimmtAn(tuer, { title: 'Wartung Nord', tagNames: [gerade] }), true, `${wo} nimmt ${String(MAX_TAG_NAME_LENGTH)} Zeichen nicht an`);
    assert.equal(nimmtAn(tuer, { title: 'Wartung Nord', tagNames: [einsZuViel] }), false, `${wo} nimmt mehr als ${String(MAX_TAG_NAME_LENGTH)} Zeichen an`);
  }
});

/** Erfundene Kennungen in UUID-Form — beide Türen nehmen dieselbe Form an. */
const kennungen = (anzahl) =>
  Array.from(
    { length: anzahl },
    (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  );

/** Erfundene Tagnamen, jeder für sich zulässig und von den anderen verschieden. */
const namen = (anzahl) => Array.from({ length: anzahl }, (_, index) => `Ost ${String(index)}`);

check('die Listengrenzen sagen an beiden Türen dasselbe (O-AR)', () => {
  /*
   * O-AR, der Add-in-Anteil — und die ehrliche Auskunft dazu, was diese Zeilen
   * können und was nicht.
   *
   * `tagIds` und `tagNames` tragen ihre Obergrenze an **zwei** Türen:
   * `routes/addin/schema.ts` (hier gemessen, T-134 hat ihr einen Namen gegeben)
   * und `routes/todos.ts`, gleich zweimal. Es ist dieselbe Wahrheit — „wie viele
   * Tags darf ein Todo in einer Anfrage bekommen" — und sie steht heute an drei
   * Stellen unabhängig geschrieben. Der Kommentar an `ADDIN_TAG_NAMES_MAX` sagte
   * das bis T-134 zu, ohne dass es jemand erzwang: E-063 Punkt 5 in seiner
   * mildesten Form.
   *
   * **Das hier ist ein Zahlenvergleich, und ein Zahlenvergleich ist die
   * schwächere Prüfung** — genau die, die zwei Zeilen weiter oben für den
   * Titeldeckel abgelöst wurde. Er bleibt hier trotzdem stehen, weil die
   * stärkere Frage noch nicht gestellt werden **kann**: Solange es keine
   * gemeinsame Quelle gibt, gibt es keine Herkunft zu prüfen. Die zweite Tür
   * liegt außerhalb der Hoheit dieser Aufgabe (E-053); T-134 meldet sie, statt
   * die Zahl halb umzustellen — eine halb umgestellte Zahl sieht aus wie
   * erledigt.
   *
   * Bis dahin gilt: Laufen die Türen auseinander, wird dieser Lauf rot. Vorher
   * wäre gar nichts geschehen.
   */
  const titel = { title: 'Wartung Nord' };

  for (const [was, grenze, bauen] of [
    ['tagIds', ADDIN_TAG_IDS_MAX, (anzahl) => ({ ...titel, tagIds: kennungen(anzahl) })],
    ['tagNames', ADDIN_TAG_NAMES_MAX, (anzahl) => ({ ...titel, tagNames: namen(anzahl) })],
  ]) {
    for (const [wo, tuer] of [['Add-in-Tür', addinTuer], ['Haupttür', hauptTuer]]) {
      assert.equal(
        nimmtAn(tuer, bauen(grenze)),
        true,
        `${wo}: ${was} nimmt ${String(grenze)} Einträge nicht an`,
      );
      assert.equal(
        nimmtAn(tuer, bauen(grenze + 1)),
        false,
        `${wo}: ${was} nimmt mehr als ${String(grenze)} Einträge an`,
      );
    }
  }
});

check('der übernommene Vermerk passt durch die Tür, die ihn annehmen soll (B-12.3, T-134)', () => {
  /*
   * **Der Fund dieser Aufgabe, und er war keine Aufräumarbeit.**
   *
   * `prepareNote` schnitt bis T-134 auf `MAX_TAKEOVER_CHARACTERS` und hängte den
   * Hinweis „(gekürzt)" **danach** an. Der Vermerk war damit elf Zeichen länger
   * als der Deckel, den `ADDIN_NOTE_MAX_LENGTH` an derselben Tür durchsetzt —
   * und zwar in jedem Fall, in dem die zweite Hälfte des Textes keinen
   * Zeilenumbruch trägt: eine lange Mail ohne Absätze, ein Zitatverlauf aus
   * einer Zeile, ein Textkörper aus Emoji.
   *
   * Der Benutzer drückt „Inhalt der E-Mail übernehmen", dann „Anlegen" — und
   * bekommt ein 422 auf ein Feld, dessen Inhalt er nicht geschrieben hat.
   * Dieselbe Sackgasse wie T-114 beim Titel, nur elf Zeichen weiter.
   *
   * **Warum ihn niemand gefunden hat:** Der Nachweis prüfte den Vermerk gegen
   * eine **Rechnung** (`Deckel + Länge des Hinweises`, Abschnitt 17) statt gegen
   * die **Tür**. Eine Erwartung, die den Fehler nachrechnet, bestätigt ihn.
   * Diese Zeile fragt deshalb das Schema, das den Vermerk wirklich annimmt.
   */
  const emoji = String.fromCodePoint(0x1f6e0);

  for (const [was, body] of [
    ['ein Textkörper aus Emoji', emoji.repeat(3000)],
    ['ein langer Fließtext ohne Absatz', 'a'.repeat(9000)],
    ['ein Zitatverlauf mit Absätzen', 'Zeile mit etwas Text\n'.repeat(400)],
  ]) {
    const vermerk = prepareNote({
      subject: 'Störung Lüftung',
      body,
      senderName: 'A. Beispiel',
      senderAddress: 'a.beispiel@example.org',
      receivedAt: null,
    });

    assert.ok(
      vermerk.length <= ADDIN_NOTE_MAX_LENGTH,
      `${was}: der Vermerk ist ${String(vermerk.length)} Zeichen lang, die Tür nimmt ${String(ADDIN_NOTE_MAX_LENGTH)}`,
    );
    assert.equal(
      nimmtAn(addinTuer, { title: 'Wartung Nord', note: vermerk }),
      true,
      `${was}: die Tür weist den übernommenen Vermerk ab`,
    );
  }

  // Die Gegenprobe zur Behebung: Die alte Rechnung — voll ausschneiden, Hinweis
  // danach anhängen — ergibt einen Vermerk, den die Tür abweist. Ohne sie stünde
  // nur fest, dass es heute passt, und nicht, dass es je ein Problem war.
  const alt = `${'a'.repeat(ADDIN_NOTE_MAX_LENGTH)}\n…(gekürzt)`;
  assert.equal(
    nimmtAn(addinTuer, { title: 'Wartung Nord', note: alt }),
    false,
    'die alte Rechnung ginge durch — dann misst diese Prüfung nichts',
  );
});

check('die Leistung: was die Add-in-Tür annimmt, nimmt die Haupttür auch an (O-AR)', () => {
  /*
   * Die zweite der beiden `4000` in `routes/addin/schema.ts` — und sie ist
   * **nicht** dieselbe Wahrheit wie die erste. Der Vermerk begrenzt übernommenen
   * E-Mail-Text (B-12.3 Punkt 3, geht nie in den Export); die Leistung ist eine
   * Eingabe des Benutzers und geht in die Abrechnungsdatei (A-7.4). Gleiche
   * Zahl, andere Bedeutung — die Begründung steht an der Konstante, nicht hier.
   *
   * Was hier zu messen ist, ist die **eine Richtung, in der eine Abweichung
   * weh tut**: Eine Buchung, die über den Aufgabenbereich entsteht, muss in der
   * Hauptanwendung bearbeitbar bleiben. Das ist der Befund C-03 in seiner
   * allgemeinen Form — dieselbe Handlung, zwei Ergebnisse —, und er hängt nicht
   * daran, dass beide Deckel gleich sind, sondern daran, dass der engere im
   * Add-in liegt.
   *
   * Diese Zeile bleibt deshalb auch dann grün, wenn der Orchestrator die offene
   * Frage andersherum entscheidet und beide Türen gleichzieht. Sie wird rot,
   * wenn das Add-in eines Tages **mehr** annimmt als die Hauptanwendung — genau
   * der Zustand, der zwischen T-101 und T-114 zwei Wellen lang bestand.
   */
  const gerade = 'a'.repeat(ADDIN_BOOKING_NOTE_MAX_LENGTH);
  const einsZuViel = 'a'.repeat(ADDIN_BOOKING_NOTE_MAX_LENGTH + 1);
  const buchung = { startedAt: '2026-09-04T08:00:00Z', endedAt: '2026-09-04T08:30:00Z' };

  // Die Bindung an der Add-in-Tür: Der Deckel wirkt wirklich.
  assert.equal(nimmtAn(addinBookSchema, { ...buchung, note: gerade }), true, 'die Add-in-Tür nimmt ihren Deckel nicht an');
  assert.equal(nimmtAn(addinBookSchema, { ...buchung, note: einsZuViel }), false, 'die Add-in-Tür nimmt mehr als ihren Deckel');

  // Und die Richtung, auf die es ankommt: Die Haupttür nimmt alles an, was hier
  // durchgeht. Derselbe Text, dieselbe Spalte, zwei Wege.
  assert.equal(
    nimmtAn(MAIN_TIME_SCHEMAS.createTimeEntry, {
      todoId: ID.todoStoerung,
      ...buchung,
      note: gerade,
    }),
    true,
    'eine über den Aufgabenbereich gebuchte Leistung ist in der Hauptanwendung nicht mehr speicherbar (C-03)',
  );
});

check('T-114 Punkt 4: Vermerk und Leistung tragen die Wache bewusst nicht', () => {
  /*
   * Kein Versehen, sondern dieselbe Grenze, die `http/input.ts` zwischen
   * `nameSchema` und `textSchema` zieht: Ein **Name** wird in fremde Sätze
   * eingesetzt, ein **Vermerk** als eigener Absatz gezeigt. Ein Freitextfeld,
   * das an einem Steuerzeichen scheitert, weist Text des Benutzers ab; der
   * Vermerk geht außerdem nicht in den Export (A-7.2).
   *
   * Diese Zeile steht hier, damit die Entscheidung sichtbar ist und nicht
   * ungeprüft. Wer sie ändern will, ändert sie hier mit — und trägt sie in
   * `decisions.md` ein, statt sie im Vorbeigehen zu verschieben.
   */
  const nul = String.fromCodePoint(0x0000);
  assert.equal(nimmtAn(addinTuer, { title: 'Wartung Nord', note: `Zeile${nul}zwei` }), true);
  assert.equal(nimmtAn(hauptTuer, { title: 'Wartung Nord', note: `Zeile${nul}zwei` }), true);
});

check('kein Titelvorschlag läuft in die Abweisung — für jedes Zeichen der Klasse', () => {
  /*
   * Der Grund, aus dem die Abweisung allein an dieser Tür nicht genügt, und die
   * Prüfung, die T-123 als einzige aus der Zeichenschleife des alten Abschnitts
   * 17 übernimmt.
   *
   * Der Titel ist im Aufgabenbereich mit dem Betreff vorbelegt. Trüge der
   * Betreff ein unsichtbares Zeichen, bekäme der Benutzer ein 422 auf ein
   * Feld, an dem nichts Falsches zu sehen ist — und der einzige Ausweg wäre,
   * den ganzen Titel neu zu tippen. `suggestTitle` nimmt die Zeichen deshalb
   * schon aus dem Vorschlag heraus; was der Benutzer danach selbst einfügt,
   * geht unverändert an den Dienst und wird dort abgewiesen.
   *
   * **Tautologisch ist das nicht**, obwohl beide Seiten seit T-123 dieselbe
   * Klasse lesen. Gemessen wird nicht die Klasse, sondern was `suggestTitle`
   * um sie herum tut: Vorsilben abschneiden, Leerraum zusammenziehen, auf 500
   * kürzen, trimmen. Jeder dieser Schritte kann einen Vorschlag erzeugen, den
   * die Tür abweist — genau hier fiele es auf.
   */
  const stehengeblieben = [];
  for (const punkt of KLASSE) {
    const zeichen = String.fromCodePoint(punkt);
    const vorschlag = suggestTitle(`AW: Störung${zeichen}Lüftung`);

    if (!nimmtAn(addinTuer, { title: vorschlag })) {
      stehengeblieben.push(`${alsName(punkt)}: die Add-in-Tür weist den Vorschlag ab`);
      continue;
    }
    if (!nimmtAn(hauptTuer, { title: vorschlag })) {
      stehengeblieben.push(`${alsName(punkt)}: die Haupttür weist den Vorschlag ab`);
      continue;
    }
    if (vorschlag.includes(zeichen)) stehengeblieben.push(`${alsName(punkt)}: steht noch im Vorschlag`);
    if (!vorschlag.startsWith('Störung')) stehengeblieben.push(`${alsName(punkt)}: „AW:" blieb stehen`);
    if (!vorschlag.endsWith('Lüftung')) stehengeblieben.push(`${alsName(punkt)}: der Text danach fehlt`);
    if (istLeerraum(punkt) && vorschlag !== 'Störung Lüftung') {
      stehengeblieben.push(`${alsName(punkt)}: Leerraum wurde nicht zu einem Leerzeichen`);
    }
  }
  assert.deepEqual(stehengeblieben, [], stehengeblieben.join('; '));
});

check('Leerraum bleibt Leerraum, unsichtbare Zeichen verschwinden ersatzlos', () => {
  // Die Unterscheidung, wegen der `U+0009` bis `U+000D` nicht in derselben
  // Menge stehen wie das Übrige: Ein Tabulator trennt zwei Wörter, ein NUL
  // nicht. Beide ersatzlos zu streichen klebte „Störung" und „Lüftung"
  // zusammen.
  assert.equal(suggestTitle(`Störung${String.fromCodePoint(0x0009)}Lüftung`), 'Störung Lüftung');
  assert.equal(suggestTitle(`Störung${String.fromCodePoint(0x000a)}Lüftung`), 'Störung Lüftung');
  assert.equal(suggestTitle(`Störung${String.fromCodePoint(0x0000)}Lüftung`), 'StörungLüftung');
  assert.equal(suggestTitle(`Störung${String.fromCodePoint(0x202e)}Lüftung`), 'StörungLüftung');
  // Kein doppeltes Leerzeichen, wo ein unsichtbares Zeichen zwischen zweien
  // stand: Erst fallen die Zeichen, dann wird Leerraum zusammengezogen.
  assert.equal(suggestTitle(`Störung ${String.fromCodePoint(0x0000)} Lüftung`), 'Störung Lüftung');
});

check('ein Betreff aus lauter unsichtbaren Zeichen ergibt einen sichtbar leeren Vorschlag', () => {
  // Kein Rest, der wie ein Titel aussieht und keiner ist. Das leere Feld ist
  // die ehrliche Anzeige: Der Benutzer sieht, dass er etwas eintragen muss,
  // statt „Anlegen" zu drücken und eine Abweisung zu bekommen.
  const nurUnsichtbar = KLASSE.map((punkt) => String.fromCodePoint(punkt)).join('');
  assert.equal(suggestTitle(nurUnsichtbar), '');
  assert.equal(nimmtAn(addinTuer, { title: '' }), false, 'ein leerer Titel darf nicht durchgehen');
});

check('ein überlanger Betreff wird auf den Deckel gekürzt, den der Dienst annimmt', () => {
  const vorschlag = suggestTitle('a'.repeat(MAX_TITLE_CHARACTERS * 3));
  assert.equal(vorschlag.length, MAX_TITLE_CHARACTERS);
  assert.equal(nimmtAn(addinTuer, { title: vorschlag }), true);
  assert.equal(nimmtAn(hauptTuer, { title: vorschlag }), true, 'der Vorschlag passt nicht durch die Haupttür');
});

const zeichenStore = createFakeStore();
const zeichenApp = mountAddinRoutes(zeichenStore.deps);
const zeichenClient = createApiClient({
  baseUrl: 'http://127.0.0.1:17843',
  token: () => 'takt_ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
  fetch: (url, init) => zeichenApp.request(String(url), init),
});

await checkAsync('an der laufenden Route: 422 mit deutschem Satz, und nichts ist angelegt', async () => {
  const rlo = String.fromCodePoint(0x202e);
  const vorher = zeichenStore.state.todos.size;

  const ergebnis = await zeichenClient.createTodo({
    title: `Wartung${rlo}Nord`,
    callNumber: null,
    statusId: null,
    tagIds: [],
    tagNames: [],
    note: '',
  });

  assert.equal(ergebnis.ok, false, 'die Route hat den Titel angenommen');
  assert.equal(ergebnis.kind, 'invalid_input');
  assert.equal(ergebnis.code, 'validation_error');
  assert.equal(ergebnis.details?.[0]?.field, 'title');

  const satz = ergebnis.details?.[0]?.message ?? '';
  assert.match(satz, /Steuerzeichen/, `die Meldung ist nicht der deutsche Satz: „${satz}"`);
  assert.equal(satz.includes(rlo), false, 'die Meldung gibt das Zeichen wörtlich wieder');

  assert.equal(zeichenStore.state.todos.size, vorher, 'es ist trotz Abweisung ein Todo entstanden');
});

await checkAsync('an der laufenden Route: derselbe Titel ohne das Zeichen geht durch', async () => {
  // Die Gegenprobe. Ohne sie stünde nur fest, dass die Route irgendetwas
  // abweist — nicht, dass es das Zeichen war.
  const ergebnis = await zeichenClient.createTodo({
    title: 'WartungNord',
    callNumber: null,
    statusId: null,
    tagIds: [],
    tagNames: [],
    note: '',
  });

  assert.equal(ergebnis.ok, true, ergebnis.ok ? '' : ergebnis.message);
  assert.equal(ergebnis.value.todo.title, 'WartungNord');
});

await checkAsync('T-114 Punkt 4: die Call-Nummer braucht keine zweite Wache', async () => {
  /*
   * Sie hat schon eine, und eine engere: `checkCallNumber` lässt nur
   * `A-Z a-z 0-9 . _ / -` durch (E-045, B-4.3). Ein geschlossener Vorrat
   * schließt jedes Steuer- und Richtungszeichen mit ein, ohne es zu nennen.
   * Geprüft wird das trotzdem, weil „ist schon abgedeckt" der Satz ist, mit
   * dem T-112-1 fünf Wellen überlebt hat.
   */
  const rlo = String.fromCodePoint(0x202e);

  const gesucht = await zeichenClient.findMatches(`TCK-0000${rlo}42`);
  assert.equal(gesucht.ok, true, 'ein Normalfall darf kein 4xx sein');
  assert.equal(gesucht.value.searched, false);
  assert.equal(gesucht.value.reason, 'forbidden_characters');

  const angelegt = await zeichenClient.createTodo({
    title: 'Wartung Nord',
    callNumber: `TCK-0000${rlo}42`,
    statusId: null,
    tagIds: [],
    tagNames: [],
    note: '',
  });
  assert.equal(angelegt.ok, false, 'die Route hat eine Call-Nummer mit Richtungszeichen angelegt');
  assert.equal(angelegt.details?.[0]?.field, 'callNumber');
  assert.equal(angelegt.details?.[0]?.code, 'forbidden_characters');
});

// ===========================================================================
heading('17  Fremder Text in der Anzeige und der Schnitt auf ganze Zeichen (T-119, T-123)');
// ===========================================================================

/*
 * Zwei Befunde aus dem Bericht zu T-114, beide dort bewusst nicht behoben —
 * und seit T-123 eine dritte Frage, die die ersten beiden zusammenhält.
 *
 * ---------------------------------------------------------------------------
 * 1. Der rohe Betreff im Aufgabenbereich
 * ---------------------------------------------------------------------------
 *
 * `TaskPane.tsx` zeigte Betreff und Absender roh an. Ein `U+202E` im Betreff
 * dreht die Anzeige dieses Blocks um, ohne je durch eine Tür zu gehen — die
 * Wache aus T-114 sitzt am Anlegen, nicht an der Anzeige.
 *
 * Das Gegenmittel, das T-114 vorgeschlagen hat, war `unicode-bidi: isolate`.
 * **Es genügt allein nicht**, und das ist hier die Berichtigung: Eine
 * Isolierung trennt den Block von seiner Umgebung; innerhalb des Blocks wirkt
 * ein RLO weiter, denn der Bidi-Algorithmus verarbeitet die Zeichen im Inhalt.
 * Es gehören zwei Dinge dazu, und dieser Abschnitt prüft beide:
 *
 *   - `<bdi>` und `unicode-bidi: isolate`  — schützt die Umgebung
 *   - `visibleText` aus `src/text/hidden.ts` — nimmt dem Inhalt die Zeichen
 *
 * Nachweisbar ist hier nur das Zweite als Verhalten; für das Erste steht eine
 * statische Prüfung, weil ein Aufgabenbereich in `.tsx` von Node nicht
 * gerendert werden kann (die Typentfernung kennt kein JSX). Das ist gesagt und
 * nicht verschwiegen.
 *
 * ---------------------------------------------------------------------------
 * 2. Der Schnitt auf UTF-16-Einheiten
 * ---------------------------------------------------------------------------
 *
 * `suggestTitle` schnitt bei 500 mit `slice` und konnte ein Emoji halbieren.
 * Die stehengebliebene Hälfte ist kein wohlgeformter Text: Auf dem Weg durch
 * UTF-8 — in die Datenbank und in den Export — wird sie zu `U+FFFD`.
 *
 * ---------------------------------------------------------------------------
 * 3. Und was T-123 hier geändert hat: eine Quelle statt zweier Ergebnisse
 * ---------------------------------------------------------------------------
 *
 * Bis T-123 hielt dieser Abschnitt die Zeichenklasse des Add-ins gegen die der
 * Tür — Zeichen für Zeichen über die ganze BMP. Das war richtig, **solange es
 * zwei Fassungen gab**. Seit T-122 gibt es eine (`packages/domain/src/
 * characters.ts`), und seit T-123 liest das Add-in sie dort. Zwei Ergebnisse
 * zu vergleichen, die aus derselben Funktion stammen, ist keine Messung mehr,
 * sondern eine Schleife, die immer grün ist — und die schlimmste Art grün:
 * eine, die aussieht wie eine Prüfung (E-063 Punkt 4).
 *
 * An ihre Stelle tritt die Frage, die noch offen ist: **Liest das Add-in die
 * Quelle wirklich?** Sie wird zweimal gestellt, weil sie zwei Hälften hat —
 * einmal an den Objekten (unten: `dropHidden` *ist* `dropHiddenCharacters`) und
 * einmal am Quelltext (keine Datei führt eine zweite Fassung). Die erste Hälfte
 * bemerkt eine Umleitung, die zweite eine daneben angelegte Kopie.
 *
 * **Was von der Zeichenschleife bleibt, steht in Abschnitt 16** und misst dort
 * etwas anderes: dass `zod` die Klasse an `title` und `tagNames` tatsächlich
 * anwendet. Das ist keine Aussage über die Klasse, sondern über die Bindung —
 * und die kann jemand lösen, ohne die Klasse anzufassen.
 */

check('das Add-in liest die Zeichenklasse — dieselben Objekte, keine zweite Fassung', () => {
  /*
   * Der Kern von T-123, und der Grund, warum hier `equal` und nicht
   * `deepEqual` steht: Zwei Funktionen, die sich gleich verhalten, sind zwei
   * Funktionen. Sie können sich beim nächsten Mal verschieden verhalten — genau
   * das ist zwischen T-117 und T-119 geschehen. Zwei Namen für **ein** Objekt
   * können das nicht.
   *
   * `src/text/hidden.ts` darf deshalb nichts anderes tun als weiterreichen.
   * Diese Zeile wird rot, sobald jemand dort eine eigene Zeile schreibt — auch
   * eine, die zufällig dasselbe tut.
   */
  assert.equal(dropHidden, dropHiddenCharacters, 'dropHidden ist eine eigene Funktion');
  assert.equal(hasHidden, hasHiddenCharacter, 'hasHidden ist eine eigene Funktion');
  assert.equal(visibleText, domaeneVisibleText, 'visibleText ist eine eigene Funktion');
  assert.equal(HIDDEN_MARKER, DOMAENE_MARKE, 'die Marke ist eine zweite Marke');
});

check('keine Quelldatei des Add-ins führt eine eigene Fassung der Klasse', () => {
  /*
   * Die zweite Hälfte derselben Frage. Die Zeile darüber prüft, dass das, was
   * benutzt wird, aus der Domäne kommt; diese hier prüft, dass **daneben**
   * nichts liegt. Beides zusammen ist die Aussage „eine Quelle" — einzeln ist
   * keine von beiden sie.
   *
   * Gesucht wird die Bauform, in der die Klasse im Baum je stand: Escape-Folgen
   * aus ihrem Wertebereich in einer Zeichenkette oder einem Ausdruck.
   * Kommentare sind ausgenommen — dort stehen die Codepunkte absichtlich, und
   * eine Prüfung, die ihre eigene Begründung findet, zwingt zum Schweigen an
   * genau der Stelle, an der etwas erklärt gehört.
   */
  const bauform = /\\u(?:0{2}[01][0-9a-f]|007f|009f|061c|200[ef]|202[a-e]|206[6-9])/i;
  const gefunden = files
    .filter((datei) => /\.tsx?$/.test(datei))
    .filter((datei) => bauform.test(sourceWithoutComments(datei)))
    .map((datei) => path.relative(srcRoot, datei));
  assert.deepEqual(gefunden, [], `eigene Fassung der Klasse in: ${gefunden.join(', ')}`);

  // Und die eine Datei, die die Namen trägt, muss sie aus der Domäne holen.
  const durchreiche = readFileSync(path.join(srcRoot, 'text', 'hidden.ts'), 'utf8');
  assert.match(durchreiche, /from '@takt\/domain'/, 'hidden.ts liest die Domäne nicht');
});

check('der Trick, um den es geht: „Rechnung<RLO>gnp.exe" ist als solcher zu sehen', () => {
  const rlo = String.fromCodePoint(0x202e);
  const betreff = `Rechnung${rlo}gnp.exe`;

  // Roh trägt der Betreff das Zeichen — sonst prüfte die Zeile darunter nichts.
  assert.equal(hasHidden(betreff), true, 'der Prüftext trägt gar kein Richtungszeichen');
  assert.equal(hasHidden(visibleText(betreff)), false);
  assert.equal(visibleText(betreff), `Rechnung${HIDDEN_MARKER}gnp.exe`);

  // Und die Länge bleibt: Eine Marke steht **an der Stelle** des Zeichens und
  // nicht anstelle des ganzen Textes. Das ist E-063 Punkt 2 als Zahl.
  assert.equal(visibleText(betreff).length, betreff.length);

  // Der Leerraum aus C0 ist dabei der eine Fall, der **keine** Marke bekommt:
  // Er trennt Wörter, und ein Betreff, der eine zweite Zeile aufmachte, ist
  // etwas anderes als einer, der etwas verbirgt.
  assert.equal(visibleText(`Störung${String.fromCodePoint(0x0009)}Lüftung`), 'Störung Lüftung');
});

check('die Marke ist eine Marke: sichtbar, stabil, nicht selbst betroffen', () => {
  assert.equal(hasHidden(HIDDEN_MARKER), false, 'die Marke müsste sich selbst markieren');
  const einmal = visibleText(`a${String.fromCodePoint(0x202e)}b`);
  assert.equal(visibleText(einmal), einmal, 'zweimal angewandt kommt etwas anderes heraus');
});

check('harmloser Text bleibt harmloser Text — auch rechtsläufiger', () => {
  /*
   * Die zweite Hälfte, ohne die der Abschnitt nur belegte, dass irgendetwas
   * verschwindet. Besonders wichtig ist die letzte Zeile: Arabische und
   * hebräische Schrift ist **kein** Angriff. Sie zu entfernen oder zu markieren
   * wäre eine Anzeige, die einen Teil ihrer Benutzer nicht mehr lesen kann; sie
   * ordnet die Umgebung um, und dagegen steht die Isolierung, nicht diese
   * Funktion.
   */
  for (const text of [
    'Störung Lüftung — Halle 3',
    'Übergabe „Nord" · 15 %',
    `Wartung ${String.fromCodePoint(0x1f6e0)} fällig`,
    `12${String.fromCodePoint(0x00a0)}°C`,
    'مرحبا بالعالم',
    'שלום עולם',
  ]) {
    assert.equal(visibleText(text), text, `verändert: ${text}`);
  }
});

check('der Vorschlag lässt fallen, die Anzeige markiert — und keiner tut das andere', () => {
  /*
   * Was von „eine Klasse, drei Behandlungen" im Add-in überhaupt noch zu
   * messen ist (E-063).
   *
   * **Dass** beide Behandlungen die ganze Klasse erfassen, ist seit T-123 eine
   * Eigenschaft der Domäne und wird dort gemessen. Hier steht die Frage, die
   * dem Add-in gehört: **welche** Behandlung an welchem Ort. Sie ist nicht
   * ableitbar, sie ist eine Entscheidung — und sie ließe sich vertauschen, ohne
   * dass irgendeine Zeile in der Domäne rot würde:
   *
   *  - Eine **Anzeige**, die fallen lässt, verschweigt, dass etwas da war.
   *  - Ein **Vorschlag**, der markiert, setzt ein `U+FFFD` in ein Eingabefeld.
   *    Der Benutzer müsste ein Zeichen löschen, das er nicht geschrieben hat,
   *    bevor er anlegen kann — die Sackgasse aus T-114 in neuer Form.
   */
  const rlo = String.fromCodePoint(0x202e);

  // Der Unterschied als Verhalten, an einem Zeichen statt an der ganzen Klasse.
  assert.equal(dropHidden(`a${rlo}b`), 'ab', 'der Vorschlag markiert statt fallen zu lassen');
  assert.equal(visibleText(`a${rlo}b`), `a${HIDDEN_MARKER}b`, 'die Anzeige streicht statt zu markieren');

  // Und als Wahl der Aufrufstelle: Der Titelvorschlag darf nicht markieren, der
  // Anzeigebaustein nicht streichen.
  const vorschlag = sourceWithoutComments(path.join(srcRoot, 'office', 'mail.ts'));
  assert.match(vorschlag, /dropHidden\(/, 'der Titelvorschlag lässt die Zeichen nicht fallen');
  assert.equal(vorschlag.includes('visibleText'), false, 'der Titelvorschlag markiert in ein Eingabefeld hinein');

  const anzeige = sourceWithoutComments(path.join(srcRoot, 'ui', 'Primitives.tsx'));
  assert.match(anzeige, /visibleText\(/, 'der Anzeigebaustein markiert nicht');
  assert.equal(anzeige.includes('dropHidden'), false, 'der Anzeigebaustein streicht in einer Anzeige');
});

// ---------------------------------------------------------------------------
// Was sich in Node nicht rendern lässt: die statischen Prüfungen
// ---------------------------------------------------------------------------

/*
 * Die Flächen des Aufgabenbereichs, **ohne Kommentare**. Ohne diesen Schritt
 * fände die Prüfung ihre eigenen Begründungen: In den Kommentaren stehen die
 * Zeilen, um die es geht, absichtlich ausgeschrieben.
 *
 * Bis T-123 stand dafür ein zweiter Kommentarschneider neben
 * `sourceWithoutComments` aus Abschnitt 0 — in einer Datei, deren Thema die
 * doppelte Fassung ist. Er ist weg.
 */
const paneDateien = ['TaskPane.tsx', 'DuplicateOffer.tsx', 'TagPicker.tsx', 'SettingsView.tsx'].map(
  (name) => ({ name, text: sourceWithoutComments(path.join(srcRoot, 'ui', name)) }),
);

check('kein fremder Wert steht mehr roh im JSX', () => {
  /*
   * Diese Liste ist **kein** Vollständigkeitsbeweis — sie ist die Aufzählung
   * aus dem Bericht zu T-119, in ausführbarer Form. Sie hält die Stellen zu,
   * die es gab; eine neue Anzeigestelle unter neuem Namen fängt sie nicht. Das
   * ist gesagt und nicht behauptet.
   */
  const fremdeWerte = [
    'mail.subject',
    'mail.senderName',
    'mail.senderAddress',
    'offer.title',
    'booking.title',
    'done.title',
    'offer.tag.name',
    'offer.name',
    'tag.name',
    'tag.folderLabel',
    'result.raw',
    'result.value',
  ];

  /*
   * Gesucht wird die **Inhaltsstelle** und nicht jedes Vorkommen: `{x}` als
   * Kind eines Elements setzt den Text in die Anzeige, `attribut={x}` reicht
   * ihn an einen Baustein weiter — und `value={mail.subject}` ist ab jetzt
   * genau die richtige Zeile. Der Rückblick auf `=` trennt beides.
   */
  const alsInhalt = (wert) => new RegExp(`(?<!=)\\{${wert.replace(/\./g, '\\.')}\\}`);

  /*
   * Und die zweite Form, in der genau der Befund aus T-119 dastand:
   * `{mail.subject.length > 0 ? mail.subject : <em>ohne Betreff</em>}`. Der
   * Wert steht hier nicht in einer eigenen Klammer, sondern als Zweig einer
   * Bedingung — ohne diese Zeile bliebe die Fundstelle, um die es in dieser
   * Aufgabe geht, von der Prüfung unberührt.
   */
  const alsZweig = (wert) => new RegExp(`\\?\\s*${wert.replace(/\./g, '\\.')}\\s*:`);

  const gefunden = [];
  for (const { name, text } of paneDateien) {
    for (const wert of fremdeWerte) {
      if (alsInhalt(wert).test(text)) gefunden.push(`${name}: {${wert}}`);
      if (alsZweig(wert).test(text)) gefunden.push(`${name}: ? ${wert} :`);
    }
    // Eine Überschrift ist ebenfalls Anzeige, auch wenn sie als Attribut
    // dasteht. Seit T-119 nimmt `Callout` dort einen Knoten entgegen.
    if (text.includes('title={done.title}')) gefunden.push(`${name}: title={done.title}`);
  }
  assert.deepEqual(gefunden, [], gefunden.join('; '));
});

check('jede Fläche, die fremden Text zeigt, benutzt den Baustein dafür', () => {
  const ohne = paneDateien.filter(({ text }) => !text.includes('Foreign')).map(({ name }) => name);
  assert.deepEqual(ohne, [], `ohne <Foreign>: ${ohne.join(', ')}`);

  const bausteine = readFileSync(path.join(srcRoot, 'ui', 'Primitives.tsx'), 'utf8');
  assert.match(bausteine, /<bdi/, 'der Baustein rendert kein <bdi>');
  assert.match(bausteine, /visibleText/, 'der Baustein bereinigt den Inhalt nicht');
});

check('die Isolierung steht in der Gestaltung und nicht nur im Bericht', () => {
  const css = readFileSync(path.join(srcRoot, 'styles', 'addin.css'), 'utf8');
  const ohneKommentar = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(
    ohneKommentar,
    /bdi\s*\{[^}]*unicode-bidi:\s*isolate/,
    'keine Regel `bdi { unicode-bidi: isolate }` in addin.css',
  );
});

// ---------------------------------------------------------------------------
// Der Schnitt auf ganze Zeichen
// ---------------------------------------------------------------------------

/** Ein Werkzeug-Emoji: zwei UTF-16-Einheiten, außerhalb der BMP. */
const EMOJI = String.fromCodePoint(0x1f6e0);

/** Steht am Ende eine einzelne hohe Ersatzstelle? */
const halbesZeichen = (text) => {
  const letzte = text.charCodeAt(text.length - 1);
  return letzte >= 0xd800 && letzte <= 0xdbff;
};

/** Übersteht der Text den Weg durch UTF-8 unverändert? */
const wohlgeformt = (text) => Buffer.from(text, 'utf8').toString('utf8') === text;

check('ein Betreff aus lauter Emoji wird an einer Zeichengrenze gekürzt', () => {
  const vorschlag = suggestTitle(`a${EMOJI.repeat(400)}`);

  assert.equal(halbesZeichen(vorschlag), false, 'am Ende steht eine halbe Ersatzstelle');
  assert.equal(wohlgeformt(vorschlag), true, 'der Vorschlag übersteht UTF-8 nicht');
  assert.ok(
    vorschlag.length === MAX_TITLE_CHARACTERS || vorschlag.length === MAX_TITLE_CHARACTERS - 1,
    `Länge ${String(vorschlag.length)} — der Schnitt kostet höchstens eine Einheit`,
  );
  assert.equal(nimmtAn(addinTuer, { title: vorschlag }), true, 'die Add-in-Tür nimmt ihn nicht an');
  assert.equal(nimmtAn(hauptTuer, { title: vorschlag }), true, 'die Haupttür nimmt ihn nicht an');
});

check('derselbe Titel kommt aus Base64 zurück, wie er hineinging (A-8.4)', () => {
  /*
   * Die Folge, an der sich die halbe Ersatzstelle als Datenfehler zeigt und
   * nicht als Schönheitsfehler: Der Export kodiert nach UTF-8 und dann nach
   * Base64. Für eine einzelne Ersatzstelle gibt es keine UTF-8-Folge.
   */
  const vorschlag = suggestTitle(`a${EMOJI.repeat(400)}`);
  assert.equal(fromBase64(toBase64(vorschlag)), vorschlag);
});

check('Gegenprobe: der Schnitt vor T-119 hinterließ eine halbe Ersatzstelle', () => {
  // Die alte Zeile, wörtlich: `collapsed.slice(0, MAX_TITLE_CHARACTERS)`.
  const alt = `a${EMOJI.repeat(400)}`.slice(0, MAX_TITLE_CHARACTERS);

  assert.equal(halbesZeichen(alt), true, 'der nachgebaute alte Schnitt zerteilt gar nichts');
  assert.equal(wohlgeformt(alt), false);
  assert.notEqual(fromBase64(toBase64(alt)), alt, 'der alte Wert überstand den Weg durch Base64');
  // Und die Tür hätte ihn angenommen: `z.string().max(500)` zählt Einheiten und
  // sieht eine halbe Ersatzstelle nicht an. Die Prüfung gehört also hierher und
  // nicht an die Tür.
  assert.equal(nimmtAn(addinTuer, { title: alt }), true);
});

check('der Vermerk wird ebenso an einer Zeichengrenze gekürzt', () => {
  /*
   * Derselbe Befund eine Funktion weiter. `prepareNote` schneidet bei 4000,
   * wenn in der zweiten Hälfte keine Zeilengrenze liegt — ein Textkörper aus
   * Emoji ist genau dieser Fall. Der Vermerk geht in die Datenbank; was dort
   * ankäme, wäre dann nicht, was im Feld stand.
   */
  const vermerk = prepareNote({
    subject: 'Störung',
    body: EMOJI.repeat(3000),
    senderName: 'A. Beispiel',
    senderAddress: 'a.beispiel@beispiel.invalid',
    receivedAt: null,
  });

  assert.equal(wohlgeformt(vermerk), true, 'der Vermerk übersteht UTF-8 nicht');
  assert.equal(fromBase64(toBase64(vermerk)), vermerk);

  /*
   * **Hier stand bis T-134 die Erwartung, die den Fehler nachrechnete:**
   * `MAX_TAKEOVER_CHARACTERS + '\n…(gekürzt)'.length`. Sie war grün, und der
   * Vermerk war trotzdem elf Zeichen zu lang für die Tür, die ihn annehmen soll
   * — weil die Erwartung dieselbe Rechnung anstellte wie der Fehler. Eine
   * Prüfung, die den Prüfling nachbaut, bestätigt ihn.
   *
   * Der Deckel steht jetzt allein da, und die Frage nach der Tür stellt
   * Abschnitt 16 („der übernommene Vermerk passt durch die Tür").
   */
  assert.ok(
    vermerk.length <= MAX_TAKEOVER_CHARACTERS,
    `Länge ${String(vermerk.length)} — mehr als der Deckel`,
  );
});

check('cutToCharacterBoundary kostet höchstens eine Einheit und nur, wenn es muss', () => {
  // Unter dem Deckel wird nichts angefasst — auch kein Emoji am Ende.
  assert.equal(cutToCharacterBoundary(`ab${EMOJI}`, 10), `ab${EMOJI}`);
  // Genau auf der Grenze: das Paar bleibt ganz.
  assert.equal(cutToCharacterBoundary(`ab${EMOJI}cd`, 4), `ab${EMOJI}`);
  // Mitten im Paar: die Hälfte fällt, der Rest bleibt.
  assert.equal(cutToCharacterBoundary(`ab${EMOJI}cd`, 3), 'ab');
  // Zwischen zwei ganzen Zeichen: nichts fällt zusätzlich.
  assert.equal(cutToCharacterBoundary('abcd', 3), 'abc');
  // Ein leerer Deckel ist kein Sonderfall mit eigener Antwort.
  assert.equal(cutToCharacterBoundary(`${EMOJI}`, 0), '');
});

// ===========================================================================
heading('18  Die Frist wird eingetragen — und ein Anhang entsteht nicht (A-19.19, A-19.21)');
// ===========================================================================

/*
 * Zwei Aussagen in einem Abschnitt, weil sie **eine** Entscheidung sind
 * (E-074 Punkt 3): Das Add-in bekommt die Frist und ausdrücklich nichts
 * daneben. Der Unterschied ist Art und nicht Vorsicht — eine Frist ist ein
 * Tag, den die Anwendung anzeigt; ein Anhang ist eine Adresse, die sie auf
 * Klick öffnet (R-21, R-22).
 *
 * Vier Ebenen, in dieser Reihenfolge:
 *
 *  18a  Der Aufgabenbereich entscheidet **nicht**, was ein Tag ist — er fragt
 *       die Domäne. Rein, ohne Dienst.
 *  18b  Beide Türen, jede einzeln gegen die Domäne gemessen (T-123).
 *  18c  Die Route gegen eine **echte** Datenbank: Was kommt in der Spalte an?
 *  18d  A-19.19 an der Wirkung: null Zeilen in `todo_attachment` — mit der
 *       Gegenprobe, dass diese Messung rot werden kann.
 *  18e  A-19.2: Die Frist heißt im Aufgabenbereich „Frist" — und die drei
 *       verbotenen Wörter stehen in keinem sichtbaren Text (V-09).
 */

// ---------------------------------------------------------------------------
// 18a — die Regel wird gerufen, nicht nachgebaut
// ---------------------------------------------------------------------------

/**
 * Tage, die es gibt — und Zeichenketten, die keine sind.
 *
 * Die zweite Liste ist von Hand geschrieben und bleibt es, aus demselben Grund
 * wie {@link ANGENOMMENE_ZEICHEN} in Abschnitt 16: Sie ist keine zweite Fassung
 * der Regel, sondern eine **Anforderung** an sie. Aus der Domäne erzeugt wäre
 * sie wertlos — sie zöge mit, wenn die Regel in die falsche Richtung wächst.
 *
 * Die beiden Jahresgrenzen sind dagegen **gerechnet** und nicht hingeschrieben:
 * Verschiebt die Domäne ihre Bandbreite, sucht dieser Lauf im selben Durchgang
 * an der neuen Grenze und nicht an der alten.
 */
const ECHTE_TAGE = ['2026-09-30', '2026-02-28', '2024-02-29', '1970-01-01', '2999-12-31'];

const KEINE_TAGE = [
  ['2026-02-30', 'besteht die Form und ist kein Tag'],
  ['2024-02-30', 'auch im Schaltjahr nicht'],
  ['2026-13-01', 'dreizehnter Monat'],
  ['2026-00-10', 'nullter Monat'],
  ['2026-9-3', 'ohne führende Null'],
  ['2026-09-30T00:00:00Z', 'ein Zeitstempel ist keine Frist'],
  ['2026-09-30 12:00', 'eine Uhrzeit gehört nicht dazu'],
  ['30.09.2026', 'die deutsche Schreibweise ist keine Eingabeform'],
  ['bis Freitag', 'freier Text — und genau der, den ein Muster aus einer E-Mail läse'],
  [' 2026-09-30', 'Leerraum vorn — die Tür trimmt nicht, also trimmt das Add-in auch nicht'],
  ['2026-09-30 ', 'Leerraum hinten'],
  [`${String(MIN_DUE_YEAR - 1)}-12-31`, 'ein Tag vor der Bandbreite'],
  [`${String(MAX_DUE_YEAR + 1)}-01-01`, 'ein Tag hinter der Bandbreite'],
];

check('A-19.1: ein leeres Feld heißt „keine Frist" und ist kein Fehler', () => {
  const gelesen = readDueDate('');
  assert.equal(gelesen.kind, 'none');
  assert.equal(dueDateForRequest(gelesen), null, 'ohne Frist geht kein Wert an den Dienst');
});

check(`A-19.21: ${String(ECHTE_TAGE.length)} echte Tage gehen unverändert an den Dienst`, () => {
  for (const tag of ECHTE_TAGE) {
    const gelesen = readDueDate(tag);
    assert.equal(gelesen.kind, 'day', `„${tag}" wurde abgewiesen`);
    assert.equal(dueDateForRequest(gelesen), tag, `„${tag}" wurde unterwegs verändert`);
  }
});

check(`E-074 Punkt 4: ${String(KEINE_TAGE.length)} Eingaben, die keine Frist sind`, () => {
  for (const [wert, warum] of KEINE_TAGE) {
    const gelesen = readDueDate(wert);
    assert.equal(gelesen.kind, 'invalid', `„${wert}" wurde angenommen — ${warum}`);
  }
});

check('der Satz kommt aus der Domäne und gibt den abgewiesenen Wert nicht wieder', () => {
  /*
   * Zwei Dinge auf einmal, und beide zählen an dieser Tür.
   *
   * **Der Satz ist derselbe Wert**, nicht ein gleichlautender: `assert.equal`
   * auf eine Zeichenkette ist hier ausnahmsweise dieselbe Aussage wie die
   * Objektgleichheit in Abschnitt 17, weil es die eine Konstante der Domäne
   * ist und der Aufgabenbereich sie durchreicht. Formulierte er selbst, stünde
   * hier ein anderer Text — und er dürfte sich nie wieder ändern, ohne dass es
   * jemand merkt.
   *
   * **Der Wert steht nicht darin.** Ein abgewiesener Wert kann aus einer
   * fremden E-Mail abgeschrieben sein, und eine Meldung, die ihn wörtlich
   * wiedergibt, setzt ein Richtungszeichen in einen deutschen Satz (T-119).
   * Dieselbe Regel wie bei der Call-Nummer (B-4.3 Punkt 5).
   */
  const boese = `2026-02-30${String.fromCodePoint(0x202e)}`;
  const gelesen = readDueDate(boese);
  assert.equal(gelesen.kind, 'invalid');
  assert.equal(gelesen.message, DUE_DATE_MESSAGE, 'der Aufgabenbereich formuliert selbst');
  assert.equal(gelesen.message.includes('2026-02-30'), false, 'die Meldung gibt den Wert wieder');
  assert.equal(hasHiddenCharacter(gelesen.message), false, 'ein unsichtbares Zeichen ist durchgereicht');
});

check('die Antwort des Aufgabenbereichs ist die der Domäne — für jeden geprüften Wert', () => {
  /*
   * Die Eigenschaft statt einer Fälletabelle: Für **jeden** Wert oben gilt
   * `readDueDate(v).kind === 'day'` genau dann, wenn `isCalendarDay(v)`.
   *
   * Ohne diese Zeile prüften die drei Zeilen darüber nur, dass zwei Listen zu
   * zwei Ausgängen führen — sie sagten nichts darüber, ob dieselbe Regel
   * entscheidet. Mit ihr ist eine zweite Fassung im Add-in nur so lange grün,
   * wie sie deckungsgleich ist; sie ist es beim ersten Zusatz in der Domäne
   * nicht mehr.
   */
  const abweichungen = [];
  for (const wert of [...ECHTE_TAGE, ...KEINE_TAGE.map(([w]) => w)]) {
    const addin = readDueDate(wert).kind === 'day';
    const domaene = isCalendarDay(wert);
    if (addin !== domaene) {
      abweichungen.push(`„${wert}": Add-in ${addin ? 'nimmt an' : 'weist ab'}, Domäne ${domaene ? 'nimmt an' : 'weist ab'}`);
    }
  }
  assert.deepEqual(abweichungen, [], abweichungen.join('; '));
});

check('der Aufgabenbereich führt keine eigene Form der Frist', () => {
  /*
   * Dieselbe dreiteilige Bauart wie bei der Titellänge in Abschnitt 16, und aus
   * demselben Grund: Ein Vergleich zweier Fassungen wird erst rot, wenn die
   * Doppelung schon falsch ist. Gefragt ist die **Herkunft**.
   *
   *  1. Kein Quelltext des Aufgabenbereichs trägt die Form. Das Muster dafür
   *     wird aus `DUE_DATE_SHAPE` erzeugt und nicht hingeschrieben.
   *  2. Die eine Datei, die die Frist liest, holt die Regel aus `@takt/domain`
   *     und erklärt sie nicht selbst.
   *  3. Und sie ruft sie auch — ein Import ohne Aufruf wäre eine Fassade.
   */
  const form = DUE_DATE_SHAPE.source;
  assert.ok(form.length > 10, 'die Form der Domäne ist zu kurz — der Wächter griffe ins Leere');

  const traeger = files
    .filter((datei) => /\.tsx?$/.test(datei))
    .filter((datei) => sourceWithoutComments(datei).includes(form))
    .map((datei) => path.relative(srcRoot, datei));
  assert.deepEqual(
    traeger,
    [],
    `der Aufgabenbereich schreibt die Form der Frist selbst hin, in: ${traeger.join(', ')}`,
  );

  const feld = sourceWithoutComments(path.join(srcRoot, 'duedate', 'entry.ts'));
  assert.match(feld, /from '@takt\/domain'/, 'duedate/entry.ts liest die Domäne nicht');
  assert.match(feld, /\bisCalendarDay\s*\(/, 'duedate/entry.ts ruft isCalendarDay nicht auf');
  assert.equal(
    /(?:const|let|var|function)\s+isCalendarDay\b/.test(feld),
    false,
    'duedate/entry.ts erklärt isCalendarDay wieder selbst',
  );
});

check('E-074 Punkt 4: nichts im Aufgabenbereich liest die Frist aus der E-Mail', () => {
  /*
   * Die Aussage, die dem Feld seinen Sinn gibt, statisch gemessen.
   *
   * Der Titel wird aus dem Betreff vorgeschlagen, die Call-Nummer aus dem Text
   * erkannt, der Vermerk auf Knopfdruck übernommen. Die Frist ist das einzige
   * Feld, für das es **keinen** solchen Weg gibt — und das ist eine
   * Entscheidung (E-074 Punkt 4) und keine offene Baustelle.
   *
   * Gemessen wird deshalb nicht das Vorhandensein des Feldes, sondern die
   * **Abwesenheit** einer Verbindung zwischen ihm und `MailFacts`: Keine Datei
   * des Add-ins setzt die Frist aus einem `mail.`-Wert oder aus einer
   * Erkennung. Wer eines Tages `setDueDate(detection…)` schreibt, wird hier
   * rot, bevor der Kalender eines Empfängers dem Absender gehört.
   */
  const verdaechtig =
    /setDueDate\s*\(\s*(?:mail|detection|suggest|prepare|parse|guess|extract|body|subject)/i;
  const offenders = files.filter((datei) => verdaechtig.test(sourceWithoutComments(datei)));
  assert.deepEqual(
    offenders,
    [],
    `die Frist wird aus der E-Mail gesetzt: ${offenders.join(', ')}`,
  );

  // Und die Gegenprobe zur Gegenprobe: Es gibt das Feld überhaupt. Ohne diese
  // Zeile wäre die Prüfung darüber auch dann grün, wenn niemand eine Frist
  // eintragen könnte.
  const pane = sourceWithoutComments(path.join(srcRoot, 'ui', 'TaskPane.tsx'));
  assert.match(pane, /\breadDueDate\s*\(/, 'der Aufgabenbereich liest gar kein Fristfeld');
  assert.match(pane, /label="Frist"/, 'das Feld heißt in der Oberfläche nicht „Frist" (A-19.2)');
});

// ---------------------------------------------------------------------------
// 18b — beide Türen, jede einzeln gegen die Domäne (T-123)
// ---------------------------------------------------------------------------

const mitFrist = (wert) => ({ title: 'Wartung Nord', dueDate: wert });

check('beide Türen nehmen dieselben Tage an und weisen dieselben ab', () => {
  const abweichungen = [];
  for (const wert of [...ECHTE_TAGE, ...KEINE_TAGE.map(([w]) => w)]) {
    const soll = isCalendarDay(wert);
    const haupt = nimmtAn(hauptTuer, mitFrist(wert));
    const addin = nimmtAn(addinTuer, mitFrist(wert));
    // Jede Tür gegen die **Quelle**, nicht gegeneinander: Zwei Türen, die
    // einander gleichen, können gemeinsam falsch liegen (T-123).
    if (haupt !== soll) abweichungen.push(`Haupttür bei „${wert}": ${haupt ? 'nimmt an' : 'weist ab'}`);
    if (addin !== soll) abweichungen.push(`Add-in-Tür bei „${wert}": ${addin ? 'nimmt an' : 'weist ab'}`);
  }
  assert.deepEqual(abweichungen, [], abweichungen.join('; '));
});

check('die Beanstandung nennt das Feld — `dueDate` und nicht „body"', () => {
  assert.deepEqual(beanstandet(addinTuer, mitFrist('2026-02-30')), ['dueDate']);
});

check('an der Add-in-Tür sind „fehlt" und `null` dasselbe: ohne Frist', () => {
  /*
   * Der dritte Fall aus `TodoUpdate` — `null` heißt **entfernen** (A-19.3) —
   * kommt an dieser Tür nicht vor, weil sie nichts ändert. `.default(null)`
   * schreibt das einmal hin, statt es an der Aufrufstelle mit `?? null`
   * nachzuholen.
   */
  assert.equal(addinTuer.parse({ title: 'Ohne Frist' }).dueDate, null);
  assert.equal(addinTuer.parse({ title: 'Ohne Frist', dueDate: null }).dueDate, null);
  assert.equal(addinTuer.parse({ title: 'Mit Frist', dueDate: '2026-09-30' }).dueDate, '2026-09-30');
});

check('die Add-in-Tür hat kein Anhangsfeld (A-19.19) — strukturell, nicht per Voreinstellung', () => {
  /*
   * A-A-21/A-A-22 an der Form der Tür.
   *
   * Zod wirft unbekannte Schlüssel still weg; ein mitgeschicktes `attachments`
   * ist damit ohne Wirkung. Das ist die richtige Reihenfolge (siehe die
   * Begründung zu `reopenIfDone` in `schema.ts`) — aber es ist **nicht** die
   * Messung. Gemessen wird hier, dass die Tür gar kein solches Feld führt und
   * kein Aufrufer auf die Idee kommen kann, eines zu füllen. Die Wirkung misst
   * 18d.
   */
  const felder = Object.keys(addinTuer.shape);
  const anhang = felder.filter((name) => /attach|anhang|file|image|url/i.test(name));
  assert.deepEqual(anhang, [], `die Add-in-Tür führt ein Anhangsfeld: ${anhang.join(', ')}`);
  assert.ok(felder.includes('dueDate'), 'die Frist fehlt an der Tür — dann misst 18c nichts');
});

check('der Add-in-Abschnitt der Beschreibung führt die Frist und keinen Anhang', () => {
  const spec = parseYaml(
    readFileSync(path.join(here, '..', '..', 'local-api', 'openapi', 'takt-local-api.yaml'), 'utf8'),
  );
  const rumpf = spec.paths['/addin/todos']?.post;
  const felder = rumpf?.requestBody?.content?.['application/json']?.schema?.properties ?? {};

  assert.ok(Object.keys(felder).includes('dueDate'), 'die Beschreibung kennt die Frist nicht');
  assert.match(
    String(felder['dueDate']?.description ?? ''),
    /A-19\.21/,
    'die Frist steht ohne ihre Anforderungs-ID da',
  );

  const anhangsfelder = Object.keys(felder).filter((name) => /attach|anhang/i.test(name));
  assert.deepEqual(anhangsfelder, [], `beschriebenes Anhangsfeld: ${anhangsfelder.join(', ')}`);

  // Und keine der vier Add-in-Routen ist eine Anhangsroute (A-A-21).
  const addinPfade = Object.keys(spec.paths ?? {}).filter((pfad) => pfad.startsWith('/addin'));
  assert.ok(addinPfade.length >= 4, `nur ${String(addinPfade.length)} Add-in-Pfade — der Leser greift ins Leere`);
  assert.deepEqual(
    addinPfade.filter((pfad) => /attachment/i.test(pfad)),
    [],
    'unter /addin hängt eine Anhangsroute',
  );
});

check('O-BB: jede beschriebene Add-in-Route mit Rumpf hat ein Schema an der Tür', () => {
  /*
   * ---------------------------------------------------------------------------
   * Warum diese Zeile hier steht und nicht in `proof:openapi`
   * ---------------------------------------------------------------------------
   *
   * `proof:openapi` hält jedes Rumpfschema des Dienstes gegen die Beschreibung
   * und wird rot, wenn eines fehlt. Die **Zuordnung** dorthin führten die vier
   * Türen der Hauptfläche je als `REQUEST_SCHEMAS` neben ihren Routen; die
   * Add-in-Tür war bis T-149 die Ausnahme und stand als zwei einzelne Importe
   * im Skript selbst.
   *
   * Der Unterschied ist keine Ordnungsfrage. Eine neue Add-in-Route mit Rumpf
   * entstünde in `routes/addin/`, und der Eintrag, der sie messbar macht, läge
   * in `apps/local-api/scripts/` — in fremder Hoheit (E-053), in einer Datei,
   * die ihr Verfasser nicht anfaßt. Genau dort fällt so etwas heraus.
   *
   * `REQUEST_SCHEMAS` steht deshalb seit T-149 in `routes/addin/schema.ts`,
   * und **diese** Zeile ist die Wache dazu: Sie liest die Aufstellung an der
   * Tür und hält sie gegen den Add-in-Abschnitt der Beschreibung — in beiden
   * Richtungen. Sie hängt an keiner fremden Datei und wird auch dann rot, wenn
   * `proof:openapi` seine beiden Einzelimporte behielte.
   */
  const spec = parseYaml(
    readFileSync(path.join(here, '..', '..', 'local-api', 'openapi', 'takt-local-api.yaml'), 'utf8'),
  );

  const METHODEN = ['get', 'put', 'post', 'delete', 'patch'];
  const mitRumpf = [];
  for (const [pfad, eintrag] of Object.entries(spec.paths ?? {})) {
    if (!pfad.startsWith('/addin')) continue;
    for (const methode of METHODEN) {
      const vorgang = eintrag[methode];
      if (vorgang?.requestBody !== undefined) mitRumpf.push(vorgang.operationId);
    }
  }

  assert.ok(mitRumpf.length >= 2, `nur ${String(mitRumpf.length)} Add-in-Rümpfe — der Leser greift ins Leere`);

  assert.deepEqual(
    [...mitRumpf].sort(),
    Object.keys(ADDIN_REQUEST_SCHEMAS).sort(),
    'Beschreibung und Tür führen verschiedene Vorgänge mit Rumpf',
  );

  // Und die Einträge sind Schemata und keine Platzhalter — sonst stünde die
  // Zuordnung da und prüfte nichts.
  for (const [id, schema] of Object.entries(ADDIN_REQUEST_SCHEMAS)) {
    assert.equal(typeof schema?.safeParse, 'function', `${id} ist kein zod-Schema`);
  }

  // Die beiden Objekte sind **dieselben**, die die Route benutzt — nicht
  // gleichaussehende daneben. Ein zweites Schema unter demselben Schlüssel
  // wäre die Doppelung, die diese Aufstellung gerade abschafft.
  assert.equal(ADDIN_REQUEST_SCHEMAS.createAddinTodo, addinCreateTodoSchema);
  assert.equal(ADDIN_REQUEST_SCHEMAS.createAddinTimeEntry, addinBookSchema);
});

// ---------------------------------------------------------------------------
// 18c — die Route gegen eine echte Datenbank: was steht in der Spalte?
// ---------------------------------------------------------------------------

/** Was in `todo.due_date` steht — gelesen an der Datenbank, nicht an der Antwort. */
const dueDateInDerSpalte = (db, todoId) =>
  db.connection.prepare('SELECT due_date FROM todo WHERE id = ?').get(todoId)?.['due_date'] ?? null;

await checkAsync('A-19.21: die eingetragene Frist steht danach in der Spalte', async () => {
  await withRealDatabase(async ({ app, db }) => {
    const antwort = await postTodo(app, {
      title: 'Aus Outlook, mit Frist',
      tagIds: [],
      tagNames: [],
      note: '',
      dueDate: '2026-09-30',
    });
    const body = await antwort.json();
    assert.equal(antwort.status, 201, JSON.stringify(body));

    // Zwei Messungen, und die zweite ist die, die zählt: Die Antwort kann eine
    // Frist behaupten, die nie geschrieben wurde.
    assert.equal(body.data.todo.dueDate, '2026-09-30', 'die Antwort trägt die Frist nicht');
    assert.equal(
      dueDateInDerSpalte(db, body.data.todo.id),
      '2026-09-30',
      'die Frist steht nicht im Bestand',
    );
  });
});

await checkAsync('A-19.1: ohne Frist bleibt die Spalte leer — und das ist kein Fehler', async () => {
  await withRealDatabase(async ({ app, db }) => {
    // Ohne das Feld überhaupt: der Weg eines Aufrufers, der die Frist nicht
    // kennt. `.default(null)` fängt ihn, ohne dass er etwas hinschreiben muss.
    const ohne = await postTodo(app, { title: 'Ohne Frist', tagIds: [], tagNames: [], note: '' });
    const ohneBody = await ohne.json();
    assert.equal(ohne.status, 201, JSON.stringify(ohneBody));
    assert.equal(ohneBody.data.todo.dueDate, null);
    assert.equal(dueDateInDerSpalte(db, ohneBody.data.todo.id), null);

    // Und mit ausdrücklichem `null` — an dieser Tür dasselbe.
    const mitNull = await postTodo(app, {
      title: 'Ohne Frist, ausdrücklich',
      tagIds: [],
      tagNames: [],
      note: '',
      dueDate: null,
    });
    const nullBody = await mitNull.json();
    assert.equal(mitNull.status, 201, JSON.stringify(nullBody));
    assert.equal(dueDateInDerSpalte(db, nullBody.data.todo.id), null);
  });
});

await checkAsync('A-A-19: eine unmögliche Frist ergibt 422 — und kein halbes Todo', async () => {
  await withRealDatabase(async ({ app, db }) => {
    const zaehleTodos = () =>
      Number(db.connection.prepare('SELECT COUNT(*) AS n FROM todo').get()['n']);
    const vorher = zaehleTodos();

    for (const [wert] of KEINE_TAGE) {
      const antwort = await postTodo(app, {
        title: 'Aus Outlook',
        tagIds: [],
        tagNames: [],
        note: '',
        dueDate: wert,
      });
      const body = await antwort.json();
      assert.equal(antwort.status, 422, `„${wert}" ergab ${String(antwort.status)}`);
      assert.equal(body.error.code, 'validation_error');
      assert.deepEqual(
        body.error.details.map((eintrag) => eintrag.field),
        ['dueDate'],
        `„${wert}" wurde einem anderen Feld angelastet`,
      );

      // Der abgewiesene Wert steht nicht in der Antwort — er kann aus einer
      // fremden E-Mail abgeschrieben sein (B-4.3 Punkt 5).
      assert.equal(
        JSON.stringify(body).includes(wert),
        false,
        `die Antwort gibt „${wert}" wieder`,
      );
    }

    assert.equal(zaehleTodos(), vorher, 'ein abgewiesener Anlegeversuch hat trotzdem geschrieben');
  });
});

// ---------------------------------------------------------------------------
// 18d — A-19.19 an der Wirkung, nicht am Statuscode
// ---------------------------------------------------------------------------

/**
 * Ein **voll ausgefüllter** Anhang in drei Schreibweisen.
 *
 * Drei und nicht eine, weil niemand weiß, welchen Namen ein künftiger Aufrufer
 * (oder ein Angreifer mit dem Add-in-Token) probierte. Die Werte sind so
 * gewählt, dass ein Durchkommen sofort sichtbar wäre: eine ausführbare Datei,
 * eine Adresse, ein Bild. Erfunden, wie alle Prüfdaten hier — `beispiel.invalid`
 * und `example.org` sind reservierte Namen ohne erreichbaren Wirt.
 */
const ANHANGSVERSUCHE = {
  attachments: [
    { kind: 'file', path: '/tmp/nicht-oeffnen.bat', title: 'Rechnung' },
    { kind: 'image', name: 'bild.png', bytes: 'iVBORw0KGgo=' },
  ],
  attachment: { kind: 'link', url: 'https://example.org/nicht-oeffnen', title: 'Verweis' },
  attachmentUrl: 'https://example.org/auch-nicht',
  attachmentPath: 'C:\\Windows\\System32\\calc.exe',
};

await checkAsync('A-19.19/A-A-22: ein voll ausgefüllter Anhang ergibt 201 und **null** Zeilen', async () => {
  await withRealDatabase(async ({ app, db }) => {
    const zaehleAnhaenge = () =>
      Number(db.connection.prepare('SELECT COUNT(*) AS n FROM todo_attachment').get()['n']);

    assert.equal(zaehleAnhaenge(), 0, 'der Bestand war nicht leer — die Messung sagte dann nichts');

    const antwort = await postTodo(app, {
      title: 'Aus Outlook, mit Frist und Anhangsversuch',
      tagIds: [],
      tagNames: [],
      note: '',
      // Die Frist geht durch (A-19.21) …
      dueDate: '2026-09-30',
      // … der Anhang nicht (A-19.19). Beides in **einer** Anfrage, weil genau
      // das der Fall ist, den E-074 Punkt 3 trennt.
      ...ANHANGSVERSUCHE,
    });
    const body = await antwort.json();

    // Gemessen wird die **Wirkung** und nicht der Statuscode: Ein 422 wäre
    // hier die falsche Antwort — die Anfrage ist fachlich vollständig, und ein
    // unbekannter Schlüssel darf ein Todo nicht scheitern lassen (dieselbe
    // Überlegung wie bei `reopenIfDone`).
    assert.equal(antwort.status, 201, JSON.stringify(body));
    assert.equal(body.data.todo.dueDate, '2026-09-30', 'die Frist ist mit dem Anhang untergegangen');
    assert.equal(zaehleAnhaenge(), 0, 'über die Add-in-Tür ist ein Anhang entstanden');

    // Und keiner der Werte ist irgendwo gelandet, wo er auf Klick geöffnet
    // würde: nicht als Call-Nummer, nicht im Titel, nicht im Vermerk.
    const gespeichert = db.connection
      .prepare('SELECT title, call_number FROM todo WHERE id = ?')
      .get(body.data.todo.id);
    const vermerk = db.connection
      .prepare('SELECT body FROM todo_note WHERE todo_id = ?')
      .get(body.data.todo.id);
    const alles = JSON.stringify([gespeichert, vermerk ?? null]);
    for (const spur of ['nicht-oeffnen', 'calc.exe', 'example.org']) {
      assert.equal(alles.includes(spur), false, `„${spur}" ist in ein anderes Feld gewandert`);
    }
  });
});

await checkAsync('die Gegenprobe: diese Messung kann rot werden', async () => {
  /*
   * Ohne sie wäre die Zeile darüber die schlimmste Sorte grün — eine, die auch
   * dann bestünde, wenn `todo_attachment` gar nicht existierte oder die
   * Abfrage die falsche Tabelle läse. Das ist derselbe Befund, den T-146 im
   * Rechteport aufgeräumt hat: Entwarnung ohne Messung.
   *
   * Geschrieben wird deshalb **von Hand**, an der Add-in-Tür vorbei, mit
   * denselben Mitteln, die der Anwendungsfall der Hauptanwendung benutzt. Zählt
   * die Abfrage danach eins, zählt sie die richtige Tabelle.
   */
  await withRealDatabase(async ({ app, db }) => {
    const antwort = await postTodo(app, {
      title: 'Träger der Gegenprobe',
      tagIds: [],
      tagNames: [],
      note: '',
    });
    const body = await antwort.json();
    assert.equal(antwort.status, 201, JSON.stringify(body));

    const zaehle = () => Number(db.connection.prepare('SELECT COUNT(*) AS n FROM todo_attachment').get()['n']);
    assert.equal(zaehle(), 0);

    db.connection
      .prepare(
        'INSERT INTO todo_attachment (id, todo_id, kind, title, target, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        '01931f4e-0000-7000-8000-00000000ffff',
        body.data.todo.id,
        'link',
        'Von Hand, nicht über das Add-in',
        'https://example.org/gegenprobe',
        0,
        JETZT,
      );

    assert.equal(zaehle(), 1, 'die Zählung sieht auch einen Anhang nicht, den es gibt');
  });
});

// ---------------------------------------------------------------------------
// 18e — A-19.2: die Frist heißt „Frist", und die drei Wörter stehen nirgends
// ---------------------------------------------------------------------------

/*
 * Der Befund (V-09 aus T-154):
 *
 * Für `apps/web/dist` ist die Abwesenheit von „Fälligkeitsdatum", „fällig am"
 * und „Deadline" als Build-Nachweis gemessen (`web-build-smoke.spec.ts`). Für
 * den Aufgabenbereich gab es nichts Vergleichbares — obwohl A-19.2 „die
 * Oberfläche" sagt und der Aufgabenbereich eine ist. Der Zustand war richtig
 * und nicht gemessen.
 *
 * **Warum hier der Quelltext ohne Kommentare gemessen wird und nicht `dist`.**
 * Diese Reihe baut das Add-in nicht, und `pnpm check` ruft `proof:all` **vor**
 * `build`. Ein Abschnitt, der `dist` liest, hätte damit drei Ausgänge, und
 * zwei davon sind schlechter als der gewählte:
 *
 *  - `dist` fehlt und der Abschnitt überspringt still — ein grüner Lauf, der
 *    nichts gesehen hat (dieselbe Klasse wie O-BU und O-CI).
 *  - `dist` liegt von gestern und der Abschnitt misst den Stand von gestern.
 *  - `dist` wird hier gebaut — dann hängt eine Textprüfung an einem
 *    vollständigen Vite-Lauf.
 *
 * Der Quelltext **ohne Kommentare** ist genau die Menge, die das Bauen übrig
 * lässt: Kommentare fallen weg, Zeichenketten und JSX-Text bleiben. Er ist
 * damit dieselbe Aussage, nur früher — und er ist die schärfere, weil sie den
 * Kommentar mit dem Gegenbeispiel (`TaskPane.tsx`) bewusst ausnimmt, statt an
 * der Quellzuordnung des Bündels zu scheitern (`index-*.js.map` führt jeden
 * Kommentar wörtlich mit).
 *
 * Das **Manifest** liegt daneben: Sein `DisplayName` steht in Outlook auf dem
 * Bildschirm, ohne je durch ein Bündel zu laufen.
 */

/** Die drei Wörter, die A-19.2 verbietet. */
const VERBOTENE_FRISTWOERTER = Object.freeze(['Fälligkeitsdatum', 'fällig am', 'Deadline']);

/**
 * Was der Benutzer am Ende lesen kann: Quelltext ohne Kommentare, plus das
 * Manifest ohne seine XML-Kommentare.
 */
const sichtbareTexte = () => {
  const eintraege = files.map((datei) => ({
    datei: path.relative(path.join(here, '..'), datei),
    text: sourceWithoutComments(datei),
  }));

  const manifest = path.join(here, '..', 'manifest.xml');
  eintraege.push({
    datei: 'manifest.xml',
    text: readFileSync(manifest, 'utf8').replace(/<!--[\s\S]*?-->/g, ''),
  });

  return eintraege;
};

/**
 * Die Anrede „du" in allen Formen, die in deutschen Oberflächentexten
 * vorkommen (E-080).
 *
 * Zwei Ausdrücke, weil `test` mit `g` einen Zustand mitführt und beim zweiten
 * Aufruf an der falschen Stelle weitersucht — ein Wächter, der jedes zweite
 * Mal grün ist, wäre schlimmer als keiner.
 *
 * **Der Bindestrich im Nachblick, seit T-199 (E-086, aus T-197):** Ein Wort vor
 * einem Bindestrich ist ein **Bestimmungswort** und keine Anrede — „Prüf- und
 * Entwicklungsbetrieb", „Lade-", „Leer-". Drüben in `apps/web` hat diese
 * Ergänzung eine geduldete Ausnahme fällig gemacht und gelöscht; hier kostet
 * sie **null Treffer**: über den ganzen Add-in-Quelltext, Kommentare
 * eingeschlossen, findet der Imperativwächter vorher wie nachher **neun**
 * Stellen, und keine einzige steht vor einem Bindestrich.
 *
 * **Und sie ist keine Höflichkeit, sondern eine Zusage.** `proof:surface`
 * liest diese Datei seit T-197 und hält beide Ausdrücke zeichenweise
 * gegeneinander (E-086: wo eine Regel an zwei Stellen steht, wird sie
 * gegeneinander gemessen). Wer hier ein Zeichen ändert, ohne es drüben zu tun,
 * macht `proof:surface` rot — und die Meldung nennt beide Wortlaute.
 */
const ANREDE_DU_QUELLE = String.raw`(?<![\wäöüß])(?:du|dir|dich|dein(?:e|em|en|er|es)?)(?![\wäöüß-])`;
const ANREDE_DU = new RegExp(ANREDE_DU_QUELLE, 'i');
const ANREDE_DU_GLOBAL = new RegExp(ANREDE_DU_QUELLE, 'gi');

/**
 * Die zweite Hälfte derselben Anrede: der **Imperativ ohne Fürwort** (O-GD,
 * T-190).
 *
 * ---------------------------------------------------------------------------
 * Der Befund
 * ---------------------------------------------------------------------------
 *
 * {@link ANREDE_DU} prüft auf `du`, `dir`, `dich`, `dein`. Ein deutscher
 * Imperativ im Du kommt ohne all das aus: „Trage ein Muster ein", „Öffne eine
 * E-Mail", „Gib das Token ein". Der Wächter meldete dazu **Ruhe**, und zwar
 * über zwei Wellen: T-182 hat die siebte duzende Stelle von Hand gefunden und
 * dabei aufgeschrieben, daß der Wächter sie nicht sehen konnte
 * (`src/callnumber/pattern.ts`). Das ist derselbe Fehlerbau wie ein
 * Umlautfilter, der nur die Kleinbuchstaben kennt: Wer die halbe Form prüft,
 * bekommt die ganze Zusage nicht.
 *
 * ---------------------------------------------------------------------------
 * Wie gemessen wird — und warum als Liste
 * ---------------------------------------------------------------------------
 *
 * Ein Imperativ ist im Deutschen der Verbstamm, wahlweise mit `-e`. Eine
 * allgemeine Regel dafür gibt es nicht, ohne jedes zweite Hauptwort
 * mitzunehmen — deshalb steht hier eine **Liste der Verben, die eine
 * Oberfläche benutzt**, und keine Grammatik. Sie ist nicht vollständig und
 * behauptet es nicht; sie ist die Menge, die T-190 am Baum gemessen hat.
 * Fehlt eines, gehört es hierher und nicht in eine Ausnahme.
 *
 * **Ohne Rücksicht auf Groß- und Kleinschreibung**, wie {@link ANREDE_DU}: Im
 * zweiten Halbsatz steht der Imperativ klein („Öffne Takt und trage das Token
 * ein"). Am Baum gemessen kostet das keinen einzigen Fehltreffer.
 *
 * **Was mit Absicht fehlt**, weil es zugleich ein Hauptwort ist und in diesem
 * Add-in als solches vorkommt oder vorkommen kann: `Suche` („Kein Tag passt zu
 * dieser Suche"), `Stelle`, `Start`, `Send`, `Versuche`, `Wende`, `Acht`,
 * `Tipp`, `Ruf`, `Buch`, `Wart`. Wo der Imperativ dazu eindeutig ist, steht er
 * ausgeschrieben in {@link IMPERATIV_WOERTLICH} — `Starte`, `Sende`, `Buche`,
 * `Warte`, `Tippe`, `Rufe`.
 */
const IMPERATIV_STAMM = [
  'Öffn', 'Trag', 'Leg', 'Prüf', 'Wähl', 'Speicher', 'Klick', 'Drück', 'Schließ',
  'Setz', 'Änder', 'Lösch', 'Erstell', 'Wechsl', 'Hinterleg', 'Beacht', 'Kontrollier',
  'Lad', 'Zeig', 'Wiederhol', 'Entfern', 'Kopier', 'Markier', 'Bestätig', 'Aktivier',
  'Deaktivier', 'Ergänz', 'Beend', 'Hol', 'Schreib', 'Mach', 'Zieh', 'Füg', 'Meld',
];

/** Unregelmäßige Formen und die, bei denen nur die lange Fassung eindeutig ist. */
const IMPERATIV_WOERTLICH = [
  'Gib', 'Nimm', 'Übernimm', 'Sieh', 'Lies', 'Geh', 'Tu',
  'Starte', 'Sende', 'Buche', 'Warte', 'Tippe', 'Rufe',
];

const ANREDE_IMPERATIV_QUELLE = String.raw`(?<![\wäöüß])(?:(?:${IMPERATIV_STAMM.join('|')})e?|${IMPERATIV_WOERTLICH.join('|')})(?![\wäöüß-])`;
const ANREDE_IMPERATIV = new RegExp(ANREDE_IMPERATIV_QUELLE, 'i');
const ANREDE_IMPERATIV_GLOBAL = new RegExp(ANREDE_IMPERATIV_QUELLE, 'gi');

/**
 * Die Fassung, die dieser Wächter bis T-199 dulden musste (O-GE, O-HM).
 *
 * Sie steht **nicht mehr im Bestand**. Der Satz in `src/ui/App.tsx` war in
 * `tests/e2e/outlook-addin-build.spec.ts` wörtlich festgenagelt; T-192 hat den
 * Prüffall dort auf den anredefreien Teil des Satzes gelöst, T-199 den Satz
 * umgestellt und die Ausnahme `IMPERATIV_AUSNAHME` gelöscht — in dieser
 * Reihenfolge, und jeder ausgelassene Schritt macht den Lauf rot.
 *
 * Was bleibt, ist die Gegenprobe: Der Wächter muss die eigene Vergangenheit
 * wiederfinden. Deshalb steht der alte Wortlaut hier als **Beispiel** und
 * nicht mehr als Ausnahme — er wird nirgends mehr aus einer Messung
 * herausgerechnet.
 */
const IMPERATIV_VORHER = 'Öffne eine E-Mail, um daraus ein Todo anzulegen.';

/** Die Fassung, die seit T-199 an derselben Stelle steht (O-HM). */
const IMPERATIV_NACHHER = 'Öffnen Sie eine E-Mail, um daraus ein Todo anzulegen.';

/** Findet ein Wort ohne Rücksicht auf Groß- und Kleinschreibung. */
const findeWort = (text, wort) => text.toLowerCase().includes(wort.toLowerCase());

check('A-19.2: „Fälligkeitsdatum", „fällig am" und „Deadline" stehen in keinem sichtbaren Text', () => {
  const texte = sichtbareTexte();
  assert.ok(texte.length > 15, `nur ${String(texte.length)} Texte gefunden — der Scan greift ins Leere`);

  const treffer = [];
  for (const { datei, text } of texte) {
    for (const wort of VERBOTENE_FRISTWOERTER) {
      if (findeWort(text, wort)) treffer.push(`${datei}: „${wort}"`);
    }
  }

  assert.deepEqual(treffer, [], 'A-19.2 verbietet diese Wörter auf dem Bildschirm');
});

check('A-19.2, Gegenprobe: „Frist" steht im Aufgabenbereich — sonst misst die Abwesenheit nichts', () => {
  /*
   * Ohne diese Hälfte wäre der Abschnitt am grünsten, wenn es das Feld gar
   * nicht gäbe. Gemessen wird deshalb dieselbe Menge mit demselben Sucher:
   * Was die Abwesenheit prüft, muss das Vorhandene finden können.
   */
  const texte = sichtbareTexte();
  const mitFrist = texte.filter(({ text }) => findeWort(text, 'Frist'));
  assert.ok(mitFrist.length > 0, 'in keinem sichtbaren Text kommt „Frist" vor — der Sucher findet nichts');

  const pane = texte.find(({ datei }) => datei.endsWith(path.join('ui', 'TaskPane.tsx')));
  assert.notEqual(pane, undefined, 'der Aufgabenbereich ist nicht unter den gemessenen Texten');
  assert.match(pane.text, /label="Frist"/, 'das Feld heißt nicht mehr „Frist" — oder es steht nicht mehr da');
});

// ===========================================================================
heading('19  Jedes Feld verweist auf seinen Hinweis und auf seine Meldung (V-03/V-04, T-158)');
// ===========================================================================

/*
 * Der Befund, den dieser Abschnitt festnagelt (V-03 aus T-154):
 *
 * `Field` erzeugte die Kennungen `…-hint` und `…-error`, und **kein einziges**
 * Eingabefeld des Aufgabenbereichs verwies darauf. Im ganzen Add-in gab es
 * genau ein `aria-describedby`, und das gehörte der Trefferzahl im
 * Tag-Auswähler. Für einen sehenden Benutzer stand der Hinweis da; für einen
 * Benutzer mit Vorlesehilfe stand er nicht da. Dazu verschwand er vollständig,
 * sobald eine Meldung danebentrat — also genau dann, wenn er gebraucht wird.
 *
 * Am Fristfeld ist das kein Randfall: Die Frist ist das einzige Feld dieses
 * Bereichs, das weder vorbelegt noch aus der E-Mail erkannt wird
 * (E-074 Punkt 4). Der Riegel gegen eine Frist aus fremdem Text ist eine
 * **Abwesenheit**, und die einzige Stelle, an der sie ausgesprochen wird, ist
 * dieser Hinweis.
 *
 *  19a  Die Regel selbst, über alle vier Fälle — ohne JSX, damit sie messbar
 *       ist und nicht nur behauptet.
 *  19b  Der Baustein tut, was die Regel sagt: Er ruft sie, er baut die
 *       Kennungen nicht daneben noch einmal, und seine Meldefläche steht
 *       immer im Baum (SC 4.1.3, dieselbe Bauart wie B-5/T-118).
 *  19c  **Jede** Aufrufstelle reicht die Attribute bis an ihr Bedienelement
 *       durch. Ein Feld, das sie liegen lässt, ist der Zustand von vorher.
 *  19d  Der Wortlaut am Fristfeld (V-04): die tragende Aussage zuerst, der
 *       Fülltext der Hauptanwendung gestrichen.
 *
 * Die Nachlese aus T-169 hängt daran, weil sie dieselben Flächen betrifft:
 *
 *  19e  V-08: Die eingetragene Frist verfällt beim Wechsel auf ein vorhandenes
 *       Todo — und das steht jetzt da.
 *  19f  V-11: Sperre und Grund des Hauptknopfes kommen aus **einer** Rechnung.
 *  19g  X-02: Kein `Field` ohne Bedienelement.
 *  19h  E-080 und E-078: eine Anrede, und ein Satz an einer Stelle.
 */

// ---------------------------------------------------------------------------
// 19a — die Regel, über alle vier Fälle
// ---------------------------------------------------------------------------

check('ohne Hinweis und ohne Meldung: keine Beschreibung, keine Beanstandung', () => {
  const teile = fieldParts('due', undefined, undefined);
  assert.equal(teile.aria.id, 'due', 'die Kennung des Bedienelements kommt nicht vom Feld');
  assert.equal(teile.aria['aria-describedby'], undefined);
  assert.equal(teile.aria['aria-invalid'], undefined);
  assert.equal(teile.showHint, false);
  assert.equal(teile.showError, false);
  assert.equal(teile.className, 'field');
});

check('nur ein Hinweis: das Bedienelement verweist darauf (SC 1.3.1)', () => {
  const teile = fieldParts('due', 'Ein Tag, keine Uhrzeit.', undefined);
  assert.equal(teile.aria['aria-describedby'], 'due-hint');
  assert.equal(teile.aria['aria-describedby'], fieldHintId('due'));
  assert.equal(teile.aria['aria-invalid'], undefined, 'ein Feld ohne Meldung ist nicht beanstandet');
  assert.equal(teile.showHint, true);
});

check('nur eine Meldung: Verweis und `aria-invalid` (SC 3.3.1)', () => {
  const teile = fieldParts('due', undefined, 'Diesen Tag gibt es nicht.');
  assert.equal(teile.aria['aria-describedby'], fieldErrorId('due'));
  assert.equal(teile.aria['aria-invalid'], true);
  assert.equal(teile.className, 'field field--invalid');
});

check('V-03: beides zugleich — die Meldung tritt neben die Erklärung, nicht an ihre Stelle', () => {
  /*
   * Der Kern des Befunds. Bis T-158 galt in `Field`
   * `hint !== undefined && error === undefined` — der Satz, der sagt, **was
   * das Feld ist**, fiel weg, sobald der Satz dastand, der sagt, was falsch
   * ist. Am Fristfeld fiel damit die Erklärung der Abwesenheit weg, und zwar
   * in dem Augenblick, in dem der Benutzer am Feld hängt.
   */
  const teile = fieldParts('due', 'Takt sucht in der E-Mail nicht nach einer Frist.', 'Diesen Tag gibt es nicht.');
  assert.equal(teile.showHint, true, 'der Hinweis fällt weg, sobald eine Meldung danebensteht');
  assert.equal(teile.showError, true);
  assert.equal(
    teile.aria['aria-describedby'],
    'due-hint due-error',
    'Hinweis und Meldung stehen nicht beide im Verweis, oder nicht in der Reihenfolge der Anzeige',
  );
  assert.equal(teile.aria['aria-invalid'], true);
});

check('ein leerer Text ist kein Text', () => {
  const teile = fieldParts('due', '', '');
  assert.equal(teile.aria['aria-describedby'], undefined, 'ein Verweis auf einen leeren Absatz');
  assert.equal(teile.aria['aria-invalid'], undefined, 'beanstandet ohne Grund');
  assert.equal(teile.showError, false);
});

check('die Kennungen hängen am Feld und nicht an einer zweiten Zählung', () => {
  for (const name of ['due', 'call', 'title', 'tags', 'note', 'minutes', 'service', 'baseurl', 'token']) {
    const teile = fieldParts(name, 'h', 'e');
    assert.equal(teile.hintId, `${name}-hint`);
    assert.equal(teile.errorId, `${name}-error`);
    assert.equal(teile.aria.id, name);
    assert.equal(teile.aria['aria-describedby'], `${name}-hint ${name}-error`);
  }
});

check('eine eigene Beschreibung tritt hinzu und verdrängt nichts (Tag-Auswähler)', () => {
  const mitBeidem = withDescription(fieldParts('tags', 'h', 'e').aria, 'tags-count');
  assert.equal(mitBeidem['aria-describedby'], 'tags-hint tags-error tags-count');
  assert.equal(mitBeidem.id, 'tags', 'die Kennung geht beim Anhängen verloren');

  const ohne = withDescription(fieldParts('tags', undefined, undefined).aria, 'tags-count');
  assert.equal(ohne['aria-describedby'], 'tags-count');
});

// ---------------------------------------------------------------------------
// 19b — der Baustein tut, was die Regel sagt
// ---------------------------------------------------------------------------

const primitives = sourceWithoutComments(path.join(srcRoot, 'ui', 'Primitives.tsx'));

check('`Field` ruft die Regel, statt sie ein zweites Mal hinzuschreiben', () => {
  assert.match(primitives, /\bfieldParts\s*\(/, '`Field` ruft `fieldParts` nicht auf');
  assert.equal(
    /`\$\{htmlFor\}-(?:hint|error)`/.test(primitives),
    false,
    '`Primitives.tsx` baut die Kennungen daneben noch einmal — dann können sie auseinanderlaufen',
  );
});

check('V-03: der Hinweis hängt nicht mehr am Fehlen einer Meldung', () => {
  /*
   * Die alte Zeile wörtlich. Sie ist der Befund, und sie darf nicht
   * zurückkommen — auch nicht in umgekehrter Schreibweise.
   */
  const alteBedingung = /hint\s*!==\s*undefined\s*&&\s*error\s*===\s*undefined/;
  assert.equal(alteBedingung.test(primitives), false, 'der Hinweis wird bei einer Meldung wieder ausgeblendet');
  assert.equal(
    /error\s*===\s*undefined\s*&&\s*hint\s*!==\s*undefined/.test(primitives),
    false,
    'dieselbe Bedingung, nur andersherum geschrieben',
  );
});

check('SC 4.1.3: die Meldefläche steht immer im Baum, auch leer', () => {
  /*
   * Dieselbe Bauart und derselbe Grund wie im Bestätigungsdialog der
   * Hauptanwendung (B-5 aus T-116, gebaut in T-118): Eine Live-Region, die
   * erst zusammen mit ihrem Inhalt entsteht, wird von vielen Vorlesehilfen
   * nicht angesagt — sie melden Änderungen an einer Region, die sie kennen.
   *
   * Gemessen wird deshalb, dass `role="alert"` **außerhalb** der Bedingung
   * steht: an der dauerhaften Hülle und nicht am Absatz, der kommt und geht.
   */
  assert.match(
    primitives,
    /<div className="field__live" role="alert">/,
    'die Meldefläche trägt ihre Rolle nicht, oder sie heißt anders',
  );
  assert.equal(
    /<p className="field__error"[^>]*role=/.test(primitives),
    false,
    'die Rolle sitzt am Absatz, der kommt und geht — dann kennt die Vorlesehilfe die Region nicht',
  );

  // Und die Gegenprobe: Die Hülle liegt hinter keiner Bedingung. Zwischen ihr
  // und der schließenden Klammer der Feldhülle steht nichts, was sie
  // wegnehmen könnte.
  const huelle = primitives.slice(primitives.indexOf('<div className="field__live"'));
  assert.equal(
    /field__live"[^>]*>\s*\{\s*(?:error|parts\.showError)[^}]*\?\s*null/.test(huelle),
    false,
    'die Meldefläche selbst hängt an einer Bedingung',
  );
});

check('die leere Meldefläche nimmt keinen Platz — und wird nicht ausgeblendet', () => {
  /*
   * `display: none` nähme sie aus dem Baum und damit die ganze Wirkung. Die
   * Stilvorlage darf sie deshalb nur um den Abstand erleichtern.
   */
  const css = readFileSync(path.join(srcRoot, 'styles', 'addin.css'), 'utf8');
  const regel = /\.field__live:empty\s*\{([^}]*)\}/.exec(css);
  assert.ok(regel !== null, 'die leere Meldefläche trägt den Abstand des Feldes und schiebt jedes Feld auseinander');
  assert.equal(
    /display\s*:\s*none/.test(regel[1]),
    false,
    'die leere Meldefläche wird ausgeblendet — dann kennt die Vorlesehilfe sie nicht',
  );
  assert.equal(
    /visibility\s*:\s*hidden/.test(regel[1]),
    false,
    'dieselbe Wirkung über einen anderen Schalter',
  );
});

// ---------------------------------------------------------------------------
// 19c — jede Aufrufstelle reicht die Attribute bis an ihr Bedienelement durch
// ---------------------------------------------------------------------------

/** Jeder `<Field …>…</Field>`-Block der Oberfläche, mit seiner Datei. */
const fieldBlocks = () => {
  const found = [];
  for (const datei of files.filter((eintrag) => eintrag.endsWith('.tsx'))) {
    const text = sourceWithoutComments(datei);
    let from = 0;
    for (;;) {
      const start = text.indexOf('<Field', from);
      if (start === -1) break;
      const end = text.indexOf('</Field>', start);
      assert.notEqual(end, -1, `unabgeschlossenes <Field> in ${path.relative(srcRoot, datei)}`);
      const block = text.slice(start, end);
      const label = /label="([^"]*)"/.exec(block)?.[1] ?? '(ohne Beschriftung)';
      found.push({ datei: path.relative(srcRoot, datei), label, block });
      from = end + 1;
    }
  }
  return found;
};

const felder = fieldBlocks();

check(`V-03: alle ${String(felder.length)} Felder des Add-ins reichen ihre Attribute weiter`, () => {
  /*
   * Der Prüfer hat ausdrücklich verlangt, das **einmal** in `Field` zu
   * beheben und nicht am Fristfeld. Das ist geschehen — aber ein Baustein,
   * der die Attribute anbietet, und eine Aufrufstelle, die sie liegen lässt,
   * ergeben zusammen wieder den Zustand von vorher. Diese Zeile misst deshalb
   * jedes Feld einzeln.
   *
   * Zugelassen sind zwei Wege, und beide sind derselbe: `{...aria}` an einem
   * `input`, `textarea` oder `select`, oder `aria={aria}` an einen Baustein,
   * der sein Bedienelement selbst zeichnet (der Tag-Auswähler).
   */
  assert.ok(felder.length >= 12, `nur ${String(felder.length)} Felder gefunden — der Wächter greift ins Leere`);

  const ohne = felder.filter(({ block }) => {
    if (!/\{\s*\(\s*aria\s*\)\s*=>/.test(block)) return true;
    return !(/\{\s*\.\.\.aria\s*\}/.test(block) || /\baria=\{aria\}/.test(block) || /withDescription\s*\(\s*aria\b/.test(block));
  });

  assert.deepEqual(
    ohne.map(({ datei, label }) => `${datei}: ${label}`),
    [],
    'diese Felder erzeugen Kennungen, auf die nichts verweist',
  );
});

check('kein Bedienelement führt seine Kennung daneben noch einmal', () => {
  /*
   * Eine von Hand geschriebene `id` neben `{...aria}` wäre die zweite Quelle
   * derselben Zeichenkette — und die Stelle, an der `label for` und `input id`
   * wieder auseinanderlaufen. Genau das war der Zustand des Tag-Feldes:
   * `htmlFor="tags"` verwies auf eine Kennung, die es nirgends gab.
   */
  const daneben = felder.filter(({ block }) => /<(?:input|textarea|select)\b[^>]*\sid="/.test(block));
  assert.deepEqual(
    daneben.map(({ datei, label }) => `${datei}: ${label}`),
    [],
    'ein Bedienelement trägt eine eigene Kennung neben der des Feldes',
  );
});

check('der Tag-Auswähler erzeugt seine Kennung nicht mehr selbst', () => {
  const picker = sourceWithoutComments(path.join(srcRoot, 'ui', 'TagPicker.tsx'));
  assert.equal(
    /\buseId\s*\(/.test(picker),
    false,
    'der Auswähler zählt wieder eine eigene Kennung — dann beschriftet „Tags" nichts',
  );
  assert.match(picker, /withDescription\s*\(\s*aria\s*,/, 'die eigene Zeile tritt nicht zur Beschreibung des Feldes hinzu');
});

// ---------------------------------------------------------------------------
// 19d — der Wortlaut am Fristfeld (V-04)
// ---------------------------------------------------------------------------

const paneQuelle = sourceWithoutComments(path.join(srcRoot, 'ui', 'TaskPane.tsx'));
const fristHinweis = /label="Frist"[\s\S]{0,300}?hint="([^"]*)"/.exec(paneQuelle)?.[1] ?? '';

check('V-04: der Hinweis am Fristfeld nennt die Abwesenheit — und zwar zuerst', () => {
  /*
   * Vier Aussagen standen dort, und die einzige, die auf dieser Fläche etwas
   * erklärt, stand an dritter Stelle. Sie steht jetzt an erster.
   *
   * Gemessen wird die **Stellung**, nicht der Wortlaut: Wer den Satz
   * umschreibt, darf das — wer die Aussage über die E-Mail hinter die
   * Bedienhinweise schiebt, nicht.
   */
  assert.ok(fristHinweis.length > 0, 'das Fristfeld hat gar keinen Hinweis mehr');
  const ueberDieMail = fristHinweis.indexOf('E-Mail');
  assert.notEqual(ueberDieMail, -1, 'der Hinweis sagt nicht, dass die Frist nicht aus der E-Mail kommt');

  const bedienhinweis = fristHinweis.indexOf('Ein Tag');
  assert.notEqual(bedienhinweis, -1, 'der Hinweis sagt nicht mehr, dass die Frist ein Tag und keine Uhrzeit ist');
  assert.ok(
    ueberDieMail < bedienhinweis,
    `die tragende Aussage steht wieder hinten: „${fristHinweis}"`,
  );
});

check('V-04: der Fülltext der Hauptanwendung steht nicht mehr im Aufgabenbereich', () => {
  /*
   * „ändert nichts an Pools, Spalten, Buchungen oder Export" beantwortet in
   * der Hauptanwendung eine reale Sorge — dort gibt es Pools, Spalten und
   * eine Exportansicht. Im Aufgabenbereich gibt es keine davon; der Satz
   * schob dort nur die tragende Aussage in die Mitte.
   *
   * Der Satz bleibt gültig (A-19.7) und bleibt dort stehen, wo er gilt.
   */
  for (const wort of ['Pools', 'Spalten', 'Export']) {
    assert.equal(
      fristHinweis.includes(wort),
      false,
      `„${wort}" steht wieder im Hinweis des Aufgabenbereichs: „${fristHinweis}"`,
    );
  }
});

check('A-19.1: „leer lassen" bleibt gesagt — ohne Frist ist ein Todo gültig', () => {
  assert.match(
    fristHinweis,
    /leer lassen/i,
    `der Hinweis sagt nicht mehr, dass ein leeres Feld erlaubt ist: „${fristHinweis}"`,
  );
});

// ---------------------------------------------------------------------------
// 19e — V-08: die eingetragene Frist verfällt, und das wird gesagt
// ---------------------------------------------------------------------------

/*
 * Der Befund (V-08 aus T-154):
 *
 * Wer eine Frist einträgt und danach über ein Angebot auf „Auf vorhandenes
 * Todo buchen" wechselt, verliert die Anlegen-Fläche und mit ihr das
 * Fristfeld. Sachlich richtig — A-19.21 nennt das **Anlegen**, und das bebuchte
 * Todo behält seine eigene Frist —, aber es ist eine bewusste Eingabe, die
 * ohne ein Wort verfiel.
 *
 * Gemessen wird dreierlei: dass der Satz dasteht, dass er **an der Eingabe
 * hängt** (und nicht dauerhaft), und dass sich daraus **kein Übertragen**
 * eingeschlichen hat. Der dritte Punkt ist der eigentliche Riegel: Der
 * Vorschlag lautete ausdrücklich „kein neues Feld, kein Übertragen — nur die
 * Auskunft".
 */

const buchungsFlaeche = paneQuelle.slice(paneQuelle.indexOf('Auf vorhandenes Todo buchen'));

check('V-08: die Buchungsfläche sagt, dass die eingetragene Frist nur für ein neues Todo gilt', () => {
  assert.ok(buchungsFlaeche.length > 0, 'die Buchungsfläche ist nicht auffindbar — dann misst dieser Abschnitt nichts');
  assert.match(
    buchungsFlaeche,
    /Die eingetragene Frist gilt nur für ein neues Todo\./,
    'der Wechsel auf ein vorhandenes Todo verwirft die Frist weiterhin stillschweigend',
  );
  assert.match(
    buchungsFlaeche,
    /behält seine eigene/,
    'der Satz sagt nicht, dass das bebuchte Todo seine eigene Frist behält',
  );
});

check('V-08: der Satz hängt an der Eingabe und steht nicht auf Vorrat', () => {
  /*
   * E-078 Punkt 6, Zustandsbindung: Wer keine Frist eingetragen hat, liest
   * nichts über Fristen. Gemessen an der Bedingung unmittelbar davor.
   */
  const stelle = buchungsFlaeche.indexOf('Die eingetragene Frist gilt nur');
  const davor = buchungsFlaeche.slice(Math.max(0, stelle - 200), stelle);
  assert.match(
    davor,
    /dueEntry\.kind !== 'none'\s*\?/,
    'der Satz steht unbedingt da — dann liest ihn auch, wer keine Frist eingetragen hat',
  );
});

check('V-08: die Frist wird nicht heimlich mitgebucht', () => {
  /*
   * Die naheliegende „Verbesserung" wäre, die eingetragene Frist auf das
   * fremde Todo zu schreiben. Das wäre eine Änderung an einem Todo, das der
   * Benutzer nicht bearbeitet — und sie stünde in keiner Anforderung.
   */
  const rumpf = /await api\.book\(\{([\s\S]*?)\}\);/.exec(paneQuelle)?.[1] ?? '';
  assert.ok(rumpf.length > 0, 'der Buchungsaufruf ist nicht auffindbar');
  assert.equal(/due/i.test(rumpf), false, `die Buchung führt eine Frist mit: ${rumpf.trim()}`);
});

// ---------------------------------------------------------------------------
// 19f — V-11: der gesperrte Knopf nennt seinen Grund, aus einer Rechnung
// ---------------------------------------------------------------------------

/*
 * Der Befund (V-11 aus T-154):
 *
 * Der Hauptknopf hatte vier Sperrgründe und nannte keinen. Zwei davon tragen
 * eine Meldung an ihrem Feld, zwei hatten gar keine.
 *
 * Der Kern der Behebung ist nicht der Satz, sondern dass **Sperre und Grund
 * dieselbe Rechnung** sind: `blocked` ist genau dann wahr, wenn `reason`
 * dasteht. Zwei Ausdrücke nebeneinander wären die Bauart, aus der ein
 * gesperrter Knopf ohne Grund entsteht — also der Zustand von vorher, nur mit
 * mehr Zeilen.
 */

const gateFall = (abweichung) =>
  createTodoGate({
    title: 'Rechnung prüfen',
    connection: 'ready',
    callNumberProblem: null,
    dueDateInvalid: false,
    ...abweichung,
  });

check('V-11: nichts offen — kein Riegel und kein Satz', () => {
  const gate = gateFall({});
  assert.equal(gate.blocked, false, 'der Knopf ist gesperrt, obwohl alles beisammen ist');
  assert.equal(gate.reason, null, 'ein Grund steht da, obwohl nichts fehlt');
});

check('V-11: jeder der fünf Zustände nennt seinen Grund', () => {
  const faelle = [
    [{ callNumberProblem: 'irgendetwas stimmt nicht' }, /Call-Nummer/],
    [{ title: '   ' }, /Titel/],
    [{ dueDateInvalid: true }, /Frist/],
    [{ connection: 'loading' }, /Tags/],
    [{ connection: 'failed' }, /Verbindung/],
  ];

  for (const [abweichung, erwartet] of faelle) {
    const gate = gateFall(abweichung);
    assert.equal(gate.blocked, true, `nicht gesperrt: ${JSON.stringify(abweichung)}`);
    assert.notEqual(gate.reason, null, `gesperrt ohne Grund: ${JSON.stringify(abweichung)}`);
    assert.match(gate.reason, erwartet, `der Grund benennt die falsche Stelle: „${gate.reason}"`);
  }
});

check('V-11: Sperre und Grund sind dieselbe Rechnung — über alle 24 Möglichkeiten', () => {
  /*
   * Die eigentliche Zusicherung. Ein Knopf, der gesperrt ist und keinen Grund
   * nennt, ist der Befund; ein Grund ohne Sperre wäre seine Umkehrung und
   * genauso falsch (ein Satz unter einem Knopf, der geht).
   */
  let gezaehlt = 0;
  for (const connection of ['loading', 'ready', 'failed']) {
    for (const title of ['Rechnung prüfen', '']) {
      for (const callNumberProblem of [null, 'unbrauchbar']) {
        for (const dueDateInvalid of [false, true]) {
          const gate = createTodoGate({ title, connection, callNumberProblem, dueDateInvalid });
          gezaehlt += 1;
          assert.equal(
            gate.blocked,
            gate.reason !== null,
            `Sperre und Grund fallen auseinander: ${JSON.stringify({ connection, title, callNumberProblem, dueDateInvalid })}`,
          );
        }
      }
    }
  }
  assert.equal(gezaehlt, 24, 'die Schleife hat nicht alle Möglichkeiten durchlaufen');
});

check('V-11: genannt wird der erste Grund in der Lesereihenfolge der Fläche', () => {
  assert.match(
    gateFall({ callNumberProblem: 'unbrauchbar', title: '', dueDateInvalid: true, connection: 'failed' }).reason,
    /Call-Nummer/,
    'bei vier offenen Gründen steht nicht der oberste da',
  );
  assert.match(
    gateFall({ title: '', dueDateInvalid: true, connection: 'failed' }).reason,
    /Titel/,
    'nach der Call-Nummer kommt der Titel',
  );
  assert.match(gateFall({ dueDateInvalid: true, connection: 'failed' }).reason, /Frist/, 'nach dem Titel kommt die Frist');
});

check('V-11: die Sätze sind kurz und ohne Anrede (E-078, E-080)', () => {
  const saetze = [
    gateFall({ callNumberProblem: 'x' }).reason,
    gateFall({ title: '' }).reason,
    gateFall({ dueDateInvalid: true }).reason,
    gateFall({ connection: 'loading' }).reason,
    gateFall({ connection: 'failed' }).reason,
  ];

  for (const satz of saetze) {
    assert.ok(satz.length <= 60, `zu lang für einen Satz unter einem Knopf (${String(satz.length)}): „${satz}"`);
    assert.match(satz, /\.$/, `kein ganzer Satz: „${satz}"`);
    assert.equal(ANREDE_DU.test(satz), false, `duzt: „${satz}"`);
  }
});

check('V-11: der Aufgabenbereich benutzt die Rechnung und rechnet nicht daneben', () => {
  assert.match(paneQuelle, /disabled=\{gate\.blocked\}/, 'der Knopf hängt nicht an der Rechnung');
  assert.match(
    paneQuelle,
    /gate\.reason !== null \? <p className="pane-note">\{gate\.reason\}<\/p> : null/,
    'der Grund wird nicht angezeigt — dann ist der Knopf wieder stumm',
  );
  assert.equal(
    /title\.trim\(\)\.length === 0 \|\|/.test(paneQuelle),
    false,
    'der alte vierteilige Sperrausdruck steht wieder daneben — zwei Rechnungen für eine Frage',
  );
});

// ---------------------------------------------------------------------------
// 19g — X-02: ein Feld ohne Feld ist kein Feld
// ---------------------------------------------------------------------------

/*
 * Der Befund (X-02 aus T-165):
 *
 * In den Zuständen „lädt" und „nicht verbunden" zeichnete `Field` die
 * Beschriftung „Tags" mit `htmlFor="tags"` und den Hinweis mit `id="tags-hint"`
 * — und es gab kein Bedienelement, das `id="tags"` getragen hätte. Kein
 * Verstoß gegen ein Erfolgskriterium, aber genau die Bauart, aus der V-03
 * entstanden ist.
 */

const tagFeld = felder.find(({ datei, label }) => datei.endsWith('TaskPane.tsx') && label === 'Tags');

check('X-02: das Tag-Feld steht nur da, wo es ein Bedienelement gibt', () => {
  assert.notEqual(tagFeld, undefined, 'kein Feld „Tags" gefunden — dann misst dieser Abschnitt nichts');
  assert.match(tagFeld.block, /<TagPicker/, 'das Tag-Feld zeichnet seinen Auswähler nicht mehr');

  for (const fremd of ['Skeleton', 'pane-loading', '<Callout']) {
    assert.equal(
      tagFeld.block.includes(fremd),
      false,
      `„${fremd}" steht wieder im Feld — dann beschriftet „Tags" in diesem Zustand nichts`,
    );
  }
});

check('X-02: die beiden anderen Zustände tragen eine Überschrift und ihren Inhalt', () => {
  /*
   * Die Gegenprobe zur Streichung: Der Ladezustand und die Meldung sind nicht
   * verschwunden, sie stehen nur nicht mehr in einem Feld. Ohne diese Hälfte
   * wäre der Abschnitt am grünsten, wenn beide Flächen ganz fehlten.
   */
  assert.match(paneQuelle, /<p className="field__heading">Tags<\/p>/, 'die Überschrift „Tags" fehlt');
  assert.match(paneQuelle, /pane-loading">Tags werden geladen/, 'das Ladebild der Tagauswahl ist verschwunden');
  assert.match(
    paneQuelle,
    /Ohne Verbindung lassen sich keine Tags wählen\./,
    'die Meldung bei fehlender Verbindung ist verschwunden',
  );

  const stil = readFileSync(path.join(srcRoot, 'styles', 'addin.css'), 'utf8');
  assert.match(stil, /\.field__heading\b/, 'die Überschrift hat keine Gestalt — sie fiele aus der Feldspalte');
});

// ---------------------------------------------------------------------------
// 19h — E-080: eine Anrede. E-078: ein Satz an einer Stelle
// ---------------------------------------------------------------------------

check('E-080: der Aufgabenbereich duzt niemanden mehr', () => {
  /*
   * `apps/web` siezt an über zwanzig Stellen, das Add-in duzte an sechs, und
   * die Grenze verlief entlang zweier Dateihoheiten statt entlang einer
   * Überlegung (X-01 aus T-165). E-080 hat sie aufgehoben.
   *
   * Gemessen wird über denselben Textbegriff wie in 18e — Quelltext ohne
   * Kommentare, dazu das Manifest. In einem Kommentar darf „du" stehen, etwa
   * als zitierte Fassung, die gerade **nicht** genommen wurde.
   *
   * Findet dieser Wächter einen technischen Bezeichner (`dir`, `du`), ist der
   * umzubenennen und nicht die Prüfung zu lockern: In einem Add-in mit
   * deutschen Oberflächentexten ist ein englischer Kurzname, der wie eine
   * Anrede aussieht, ohnehin die schlechtere Wahl.
   */
  const treffer = [];
  for (const { datei, text } of sichtbareTexte()) {
    const fund = text.match(ANREDE_DU_GLOBAL);
    if (fund !== null) treffer.push(`${datei}: ${[...new Set(fund)].join(', ')}`);
  }
  assert.deepEqual(treffer, [], 'E-080 Punkt 1: Takt siezt, überall');
});

check('E-080, Gegenprobe: der Wächter erkennt eine Anrede überhaupt', () => {
  assert.equal(ANREDE_DU.test('Das Token findest du in Takt.'), true, 'der Wächter sieht ein „du" nicht');
  assert.equal(ANREDE_DU.test('Trage es dir dort ein.'), true, 'der Wächter sieht ein „dir" nicht');
  assert.equal(ANREDE_DU.test('Der Durchlauf endet.'), false, 'der Wächter meldet „Durchlauf"');
  assert.equal(ANREDE_DU.test('const dueDate = readDueDate(raw);'), false, 'der Wächter meldet „dueDate"');
});

check('E-080 Punkt 1: auch der Imperativ ohne Fürwort ist eine Anrede (O-GD)', () => {
  /*
   * Die andere Hälfte der Zusage von einer Zeile weiter oben. Ohne sie sagt
   * der Wächter „Takt siezt, überall" und meint „Takt schreibt nirgends
   * ‚du'" — zwei verschiedene Aussagen, und die zweite ist die schwächere.
   *
   * **Seit T-199 ohne Ausnahme.** Bis dahin wurde ein geduldeter Satz vor dem
   * Messen herausgerechnet; er ist umgestellt, die Ausnahme gelöscht. Was hier
   * gemessen wird, ist der ganze Bestand.
   */
  const treffer = [];
  for (const { datei, text } of sichtbareTexte()) {
    const fund = text.match(ANREDE_IMPERATIV_GLOBAL);
    if (fund !== null) treffer.push(`${datei}: ${[...new Set(fund)].join(', ')}`);
  }
  assert.deepEqual(treffer, [], 'E-080 Punkt 1: Takt siezt, auch ohne Fürwort');
});

check('E-080, Gegenprobe: der Wächter erkennt den Imperativ und nicht das Hauptwort', () => {
  /*
   * Die Sätze mit einem Imperativ sind keine erfundenen: Der erste stand bis
   * T-182 in `callnumber/pattern.ts`, der zweite bis T-199 in `ui/App.tsx`.
   * Ein Wächter, der die eigene Vergangenheit nicht wiederfindet, ist keiner.
   */
  for (const satz of [
    'Trage ein Muster ein oder wähle eines aus der Liste.',
    IMPERATIV_VORHER,
    'Gib das Token ein.',
    'Klick auf „Verbindung prüfen".',
    'Öffne Takt und trage das Token dort ein.',
    'Speichere die Einstellung.',
  ]) {
    assert.equal(ANREDE_IMPERATIV.test(satz), true, `der Wächter sieht den Imperativ nicht: „${satz}"`);
  }

  /*
   * Und die teurere Hälfte: Ein Wächter, der jedes Hauptwort meldet, wird beim
   * ersten Fehltreffer gelockert, und dann mißt er wieder nichts. Diese Sätze
   * stehen so oder so ähnlich im Add-in.
   */
  for (const satz of [
    'Kein Tag passt zu dieser Suche.',
    'Der Satz steht an dieser Stelle.',
    'Die Tags werden geladen.',
    'Der Start der Anwendung ist gescheitert.',
    'Zwei Versuche sind offen.',
    'Die Buchung ist offen.',
    'Ein Tipp steht daneben.',
    'const dueDate = readDueDate(raw);',
  ]) {
    assert.equal(ANREDE_IMPERATIV.test(satz), false, `der Wächter meldet ein Hauptwort: „${satz}"`);
  }
});

check('O-HM: die letzte Duz-Stelle ist umgestellt — und der Satz steht noch da', () => {
  /*
   * Der Nachfolger des selbstauflösenden Prüffalls von T-190. Er misst jetzt
   * das Ergebnis statt die Ausnahme, und zwar in beide Richtungen:
   *
   * 1. Die alte Fassung kommt im ganzen Bestand nicht mehr vor. Ohne diese
   *    Hälfte wäre die Umstellung zurücknehmbar, ohne dass ein Lauf es merkt —
   *    der Wächter darüber führt keine Ausnahme mehr, aber er nennt beim
   *    Rückfall nur ein Verb und nicht die Geschichte dazu.
   * 2. Die neue Fassung steht genau einmal da. Ohne diese Hälfte wäre der
   *    Abschnitt am grünsten, wenn die Fläche ganz fehlte — dieselbe Bauart wie
   *    die Gegenprobe zu A-19.2 weiter oben.
   *
   * Der gemessene Teil deckt sich mit dem Teilstring, an dem
   * `tests/e2e/outlook-addin-build.spec.ts` seit T-192 hängt (Hoheit
   * e2e-tester): Wer den Satz künftig anfasst — etwa für ST-A-01, das die
   * Überschrift dieser Hinweisfläche ganz streichen will —, macht **beide**
   * Läufe rot und nicht nur einen.
   */
  const texte = sichtbareTexte();

  assert.deepEqual(
    texte.filter(({ text }) => text.includes(IMPERATIV_VORHER)).map(({ datei }) => datei),
    [],
    'die Du-Fassung ist zurück — E-080 gilt auch für den Imperativ ohne Fürwort',
  );

  assert.deepEqual(
    texte.filter(({ text }) => text.includes(IMPERATIV_NACHHER)).map(({ datei }) => datei),
    [path.join('src', 'ui', 'App.tsx')],
    'der Satz steht nicht mehr genau einmal im Bestand',
  );

  assert.equal(
    ANREDE_IMPERATIV.test(IMPERATIV_NACHHER),
    false,
    'die neue Fassung ist selbst ein Imperativ — dann hat die Umstellung nichts geändert',
  );
  assert.equal(ANREDE_DU.test(IMPERATIV_NACHHER), false, 'die neue Fassung duzt');
});

check('E-078: „Keine Call-Nummer im Text gefunden" steht an genau einer Stelle', () => {
  /*
   * Der Satz stand wörtlich gleich in `callnumber/labels.ts` und in
   * `TaskPane.tsx#describeDetection`. Zwei Fassungen einer Aussage laufen
   * auseinander, sobald jemand eine davon anfasst — und der Textdurchgang aus
   * E-078 ist genau so ein Jemand.
   */
  const mitSatz = sichtbareTexte().filter(({ text }) => text.includes(NO_CALL_NUMBER_FOUND));
  assert.deepEqual(
    mitSatz.map(({ datei }) => datei),
    [path.join('src', 'callnumber', 'labels.ts')],
    'der Satz steht wieder mehr als einmal wörtlich im Bestand',
  );
  assert.equal(
    REJECTION_LABEL.empty,
    NO_CALL_NUMBER_FOUND,
    'die Ablehnungstafel führt eine zweite Fassung desselben Satzes',
  );
  assert.match(paneQuelle, /help: NO_CALL_NUMBER_FOUND/, 'der Aufgabenbereich schreibt den Satz wieder selbst hin');
});

check('E-080 Punkt 4: der eine Satz kommt ohne Anrede aus', () => {
  assert.equal(ANREDE_DU.test(NO_CALL_NUMBER_FOUND), false, `duzt: „${NO_CALL_NUMBER_FOUND}"`);
  assert.equal(
    /\bSie\b|\bIhre?[nmrs]?\b/.test(NO_CALL_NUMBER_FOUND),
    false,
    `die kürzere Fassung ohne Anrede war möglich: „${NO_CALL_NUMBER_FOUND}"`,
  );
});

// ===========================================================================
heading('20  Die Sperrliste: was allein eine Grenze trägt (O-HO, T-196)');
// ===========================================================================

/*
 * Der Befund (O-HO, aus T-196 Frage 1).
 *
 * `docs/design/textbestand-aufgabenbereich.md` führt in Abschnitt 5.1 eine
 * **Sperrliste**: Sätze, die ein Textdurchgang nicht kürzen darf, weil sie als
 * einzige eine fachliche Grenze aussprechen. Bis T-199 stand diese Liste
 * ausschließlich in Prosa — in einem Papier und in Kommentaren neben den
 * Sätzen selbst. Kein Lauf hielt sie.
 *
 * Zwei Einträge sind dabei besonders dünn geworden, und zwar durch Kürzungen,
 * die für sich richtig waren:
 *
 *  - **SP-A-01.** ST-A-08 hat „Interner Vermerk des Todos." gestrichen
 *    (T-196). Was bleibt, ist „Er geht nicht in die Abrechnung." — nach dieser
 *    Streichung der **einzige ganze Satz** des Aufgabenbereichs, der A-7.2 und
 *    R-08 ausspricht. Die Klammerzusätze der beiden Beschriftungen nennen den
 *    **Ort** („bleibt in Takt", „geht in die Abrechnung"); den Weg, den der
 *    Vermerk **nicht** nimmt, nennt nur dieser Satz. Sein Zwilling am Feld
 *    „Leistung" ist SP-A-05 und steht aus demselben Grund mit hier: Er ist die
 *    einzige Stelle, die Text aus einer fremden E-Mail von der Rechnung
 *    fernhält.
 *  - **SP-A-12.** ST-A-06 hat den Zustand aus der Chip-Erklärung genommen
 *    („Dieses Tag gibt es in Takt noch nicht.") und dabei ausdrücklich darauf
 *    gebaut, daß die **Folge** im Tag-Auswähler weiter ausgesprochen wird.
 *    Auflage 1 aus Z-44 (T-195): Fällt SP-A-12, ist die Kürzung zurückgenommen.
 *
 * Diese Welle hat viermal erlebt, was mit einer Zusage geschieht, die niemand
 * mißt. Deshalb steht sie hier — **zeichengleich**, denn eine Umschreibung ist
 * genau der Weg, auf dem so ein Satz verschwindet, und **mit Gegenprobe**, denn
 * ein Sucher, der nichts findet, ist der grünste von allen.
 *
 * Was hier **nicht** gemessen wird: die ganze Sperrliste. SP-A-02 bis SP-A-26
 * hängen an Flächen, die andere Abschnitte dieses Laufs bereits zeichengleich
 * halten, oder sie tragen ihre Aussage nicht allein. Gemessen wird, was
 * **allein** trägt.
 */

/** Quelltext einer Add-in-Datei ohne Kommentare, über ihren Pfad unter `src/`. */
const uiQuelle = (...teile) => sourceWithoutComments(path.join(srcRoot, ...teile));

const TASKPANE = path.join('ui', 'TaskPane.tsx');
const TAGPICKER = path.join('ui', 'TagPicker.tsx');

/**
 * Die gesperrten Texte, die allein tragen.
 *
 * `verletzung` ist die Fassung, in die der Satz beim nächsten Textdurchgang
 * abrutschen würde — plausibel und nicht erfunden: Jede stammt aus derselben
 * Sorte Kürzung, die T-196 an den Nachbarsätzen tatsächlich ausgeführt hat.
 * Sie ist die Gegenprobe und nicht Schmuck.
 */
const GESPERRTE_TEXTE = Object.freeze([
  Object.freeze({
    sperre: 'SP-A-01',
    datei: TASKPANE,
    text: 'Er geht nicht in die Abrechnung.',
    verletzung: 'Er bleibt intern.',
    grund: 'A-7.2, R-08, E-016 — nach ST-A-08 der einzige ganze Satz, der die Grenze ausspricht',
  }),
  Object.freeze({
    sperre: 'SP-A-01',
    datei: TASKPANE,
    text: 'label="Vermerk (bleibt in Takt)"',
    verletzung: 'label="Vermerk"',
    grund: 'A-7.2 — der Klammerzusatz nennt den Ort, an dem der Text bleibt',
  }),
  Object.freeze({
    sperre: 'SP-A-01',
    datei: TASKPANE,
    text: 'label="Leistung (geht in die Abrechnung)"',
    verletzung: 'label="Leistung"',
    grund: 'A-7.3, A-7.4 — der Klammerzusatz nennt den Weg, den dieser Text nimmt',
  }),
  Object.freeze({
    sperre: 'SP-A-05',
    datei: TASKPANE,
    text: 'Text aus der E-Mail gehört in den Vermerk, nicht hierher.',
    verletzung: 'Kurz und sachlich.',
    grund: 'B-12.3, R-08 — die einzige Stelle, die fremden Text von der Rechnung fernhält',
  }),
  Object.freeze({
    sperre: 'SP-A-12',
    datei: TAGPICKER,
    text: '— entsteht beim Anlegen des Todos',
    verletzung: '',
    grund: 'T-061 — ein Tag wirkt über dieses Todo hinaus; ST-A-06 hängt daran',
  }),
]);

/**
 * Der Sucher, den beide Hälften benutzen: welcher gesperrte Text fehlt in den
 * übergebenen Quellen?
 *
 * `quellen` ist eine Abbildung Datei → Quelltext und wird herumgereicht statt
 * gelesen, damit die Gegenprobe eine **eingesetzte Verletzung** durchschicken
 * kann, ohne eine Datei anzufassen.
 */
const fehlendeSperrtexte = (quellen) =>
  GESPERRTE_TEXTE.filter(({ datei, text }) => !(quellen.get(datei) ?? '').includes(text)).map(
    ({ sperre, text }) => `${sperre}: „${text}"`,
  );

const sperrQuellen = () =>
  new Map([
    [TASKPANE, uiQuelle('ui', 'TaskPane.tsx')],
    [TAGPICKER, uiQuelle('ui', 'TagPicker.tsx')],
  ]);

check('O-HO: die gesperrten Sätze stehen zeichengleich im Aufgabenbereich', () => {
  const quellen = sperrQuellen();

  assert.ok(
    (quellen.get(TASKPANE) ?? '').length > 5000 && (quellen.get(TAGPICKER) ?? '').length > 1000,
    'die Quellen sind leer — dann mißt dieser Abschnitt nichts',
  );

  assert.deepEqual(
    fehlendeSperrtexte(quellen),
    [],
    'ein gesperrter Satz ist gekürzt oder umgeschrieben — die Sperrliste steht in ' +
      'docs/design/textbestand-aufgabenbereich.md Abschnitt 5.1',
  );

  // Und jeder genau **einmal**: Eine zweite Fassung desselben Satzes ist der
  // Befund aus E-078 und läuft von der ersten auseinander, sobald jemand eine
  // davon anfasst.
  for (const { sperre, datei, text } of GESPERRTE_TEXTE) {
    const anzahl = (quellen.get(datei) ?? '').split(text).length - 1;
    assert.equal(anzahl, 1, `${sperre}: „${text}" steht ${String(anzahl)}-mal in ${datei}`);
  }
});

check('O-HO, Gegenprobe: jede eingesetzte Verletzung wird gefunden — einzeln', () => {
  /*
   * Die teurere Hälfte. Für jeden Eintrag wird **eine** Verletzung in eine
   * Kopie der Quelle gesetzt; gefunden werden muß genau dieser Eintrag und
   * kein zweiter. Ein Sucher, der bei jeder Änderung alles meldet, wird beim
   * ersten Fehlalarm gelockert — und mißt dann nichts mehr.
   */
  for (const eintrag of GESPERRTE_TEXTE) {
    const quellen = sperrQuellen();
    const verletzt = (quellen.get(eintrag.datei) ?? '').replace(eintrag.text, eintrag.verletzung);
    quellen.set(eintrag.datei, verletzt);

    assert.deepEqual(
      fehlendeSperrtexte(quellen),
      [`${eintrag.sperre}: „${eintrag.text}"`],
      `die eingesetzte Verletzung „${eintrag.verletzung}" bleibt unbemerkt (${eintrag.grund})`,
    );
  }
});

/**
 * Die gekürzte Chip-Erklärung aus ST-A-06 (T-196), zeichengleich.
 *
 * Gemessen wird die Erklärung **an ihrem Ton**, nicht irgendwo in der Datei:
 * Der Zustand („neu") steht sichtbar am Chip, die Folge steht im `title` — und
 * genau diese Aufteilung ist es, die ohne SP-A-12 nicht mehr aufgeht.
 */
const CHIP_GEKUERZT = /'new-tag':\s*\{\s*label:\s*'neu',\s*title:\s*'Entsteht zusammen mit dem Todo\.',/;

const SP_A_12 = '— entsteht beim Anlegen des Todos';

/**
 * Auflage 1 aus Z-44 als **Rechnung** und nicht als zwei Behauptungen: Die
 * Kürzung im Chip ist nur gedeckt, solange der Auswähler die Folge ausspricht.
 * Wird die Kürzung zurückgenommen, darf der Satz drüben fallen — deshalb eine
 * Folgerung und kein „beides muß dastehen".
 */
const kuerzungIstGedeckt = (chipQuelle, pickerQuelle) =>
  !CHIP_GEKUERZT.test(chipQuelle) || pickerQuelle.includes(SP_A_12);

check('O-HO: ST-A-06 hängt an SP-A-12 — und die Abhängigkeit ist gerechnet', () => {
  const picker = uiQuelle('ui', 'TagPicker.tsx');

  assert.equal(
    CHIP_GEKUERZT.test(primitives),
    true,
    'die gekürzte Chip-Erklärung steht nicht mehr zeichengleich da — dann ist ST-A-06 angefasst ' +
      'und die Auflage aus Z-44 neu zu bewerten',
  );
  assert.equal(
    picker.includes(SP_A_12),
    true,
    'die Folge steht nicht mehr im Tag-Auswähler — dann ist ST-A-06 zurückgenommen und der ' +
      'Zustand gehört wieder in die Chip-Erklärung (Auflage 1 aus Z-44)',
  );
  assert.equal(kuerzungIstGedeckt(primitives, picker), true, 'die Kürzung steht ohne ihren Träger');
});

check('O-HO, Gegenprobe: die Kürzung ohne Träger wird rot, die Rücknahme nicht', () => {
  const picker = uiQuelle('ui', 'TagPicker.tsx');
  const pickerOhne = picker.replace(SP_A_12, '');
  const chipMitZustand = primitives.replace(
    CHIP_GEKUERZT,
    "'new-tag': {\n      label: 'neu',\n      title: 'Dieses Tag gibt es in Takt noch nicht.',",
  );

  assert.notEqual(pickerOhne, picker, 'die Verletzung ließ sich nicht einsetzen — der Sucher greift daneben');
  assert.equal(CHIP_GEKUERZT.test(chipMitZustand), false, 'die Rücknahme ließ sich nicht einsetzen');

  assert.equal(
    kuerzungIstGedeckt(primitives, pickerOhne),
    false,
    'die gekürzte Erklärung bliebe grün, obwohl ihr Träger weg ist',
  );
  assert.equal(
    kuerzungIstGedeckt(chipMitZustand, pickerOhne),
    true,
    'die Rechnung verlangt beides statt einer Folgerung — dann wäre ST-A-06 unwiderruflich',
  );
});

// ===========================================================================
process.stdout.write(
  `\n${'═'.repeat(58)}\n${String(passed)} bestanden, ${String(failed)} fehlgeschlagen.\n`,
);
process.exit(failed === 0 ? 0 : 1);
