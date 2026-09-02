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
  CARD_STAYS,
  REOPEN_HINT,
  poolSentence,
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
import { checkCallNumber, mayLookUpDuplicates, tagNameKey } from '@takt/domain';

// --- Prüflinge: der Vorlagen-Motor ----------------------------------------
import { fromBase64, toBase64 } from '../../../packages/export/src/base64.ts';
import {
  BUILTIN_EXPORT_TEMPLATE,
  EXPORT_CONDITION_OPERATORS,
  validateExportTemplateField,
} from '../../../packages/export/src/template.ts';
import { renderExportGroup } from '../../../packages/export/src/render.ts';

import {
  ID,
  MAIL_MIT_NUMMER,
  MAIL_OHNE_NUMMER,
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
      poolNames: ['Wartung Nord'],
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
      poolNames: [],
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
      poolNames: ['Wartung Nord'],
    },
  ]);
  assert.equal(offers[0].isDone, true);
  assert.match(offers[0].summary, /Erledigt/);
  assert.deepEqual(
    offers[0].poolNames,
    ['Wartung Nord'],
    'ohne die Pools kann das Angebot nicht sagen, wo das Todo nach dem Buchen steht',
  );
});

// ---------------------------------------------------------------------------
// C-03 (T-025) — die Aufhebung ist automatisch und wird angesagt
// ---------------------------------------------------------------------------

check('C-03: die Trefferliste kündigt die Aufhebung an, statt sie zur Wahl zu stellen', () => {
  assert.match(REOPEN_HINT, /automatisch/, 'der Hinweis sagt nicht, dass es von selbst geschieht');
  assert.equal(/sofern|wenn du|ausdrücklich|Kästchen/.test(REOPEN_HINT), false, `bedingt formuliert: ${REOPEN_HINT}`);
});

check('I-05: die Ankündigung vor dem Buchen nennt alle drei Wirkungen und die Pools einzeln', () => {
  const notice = reopenPreview(15, ['Wartung Nord', 'Offene Störungen']);

  assert.equal(notice.effects.length, 3, 'es sind nicht drei Wirkungen');
  assert.match(notice.effects[0], /15 Minuten/, 'die Buchung selbst fehlt');
  assert.match(notice.effects[1], /automatisch aufgehoben/, 'die Aufhebung fehlt');
  assert.match(notice.effects[2], /Wartung Nord/, 'der erste Pool fehlt');
  assert.match(notice.effects[2], /Offene Störungen/, 'der zweite Pool fehlt');
  assert.equal(/\b2 Pools\b/.test(notice.effects[2]), false, 'die Pools sind gezählt statt genannt');
  assert.equal(notice.aside, CARD_STAYS);
  assert.match(notice.aside, /Die Karte bleibt, wo sie ist/);
});

check('I-05: die Rückmeldung danach sagt dasselbe wie die Ankündigung davor', () => {
  const before = reopenPreview(30, ['Wartung Nord']);
  const after = reopenOutcome('Turnuswartung Frühjahr', 30, ['Wartung Nord']);

  assert.equal(after.effects.length, before.effects.length);
  assert.match(after.title, /wieder offen/);
  assert.match(after.title, /Turnuswartung Frühjahr/);
  assert.match(after.effects[1], /aufgehoben/);
  assert.match(after.effects[2], /Wartung Nord/);
  assert.equal(after.aside, before.aside, 'vorher und nachher sagen Verschiedenes über die Spalte');

  // Ein einzelner Pool heißt „dem Pool", zwei heißen „den Pools". Eine falsche
  // Zahl im Satz ist die Art Detail, an der ein Benutzer zu zweifeln beginnt.
  assert.match(before.effects[2], /in dem Pool/);
  assert.match(reopenPreview(30, ['A', 'B']).effects[2], /in den Pools/);
});

check('Ein Todo ohne passende Poolregel bekommt die unangenehme Wahrheit, nicht Schweigen', () => {
  assert.match(poolSentence([], 'future'), /in keinem Pool/);
  assert.match(poolSentence([], 'past'), /in keinem Pool/);
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
  assert.deepEqual(match.poolNames, ['Wartung Nord'], 'die Pools fehlen im Angebot');

  const offer = describeOffers(found.value.matches)[0];
  assert.equal(offer.isDone, true);
  assert.deepEqual(reopenPreview(15, offer.poolNames).effects.length, 3);
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
  assert.equal(state.todos.get(ID.todoTurnus).completedAt, null);

  // E-023: Die Spalte ist die andere Achse. Sie bleibt.
  assert.equal(state.todos.get(ID.todoTurnus).statusId, ID.statusBacklog, 'die Spalte wurde verschoben (E-023)');

  // I-05: Der Dienst nennt die Pools, in denen das Todo jetzt wieder steht.
  assert.deepEqual(booked.value.poolNames, ['Wartung Nord']);
  assert.match(
    reopenOutcome('Turnuswartung Frühjahr', 15, booked.value.poolNames).effects[2],
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
process.stdout.write(
  `\n${'═'.repeat(58)}\n${String(passed)} bestanden, ${String(failed)} fehlgeschlagen.\n`,
);
process.exit(failed === 0 ? 0 : 1);
