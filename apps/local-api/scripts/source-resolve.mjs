/**
 * Auflösung statt fester Pfade — die Schicht des lokalen Dienstes (T-249-1,
 * seit T-249-5 auf der gemeinsamen Fassung).
 *
 * Warum es diese Datei gibt
 * -------------------------
 * Die Nachweisläufe lesen Quelldateien. Bis T-249-1 standen deren Orte als
 * feste Zeichenketten in den Läufen — `../../web/src/api/endpoints.ts`,
 * `packages/storage/migrations`, `../../../` für die Wurzel des Baums. Solange
 * niemand etwas verschiebt, stimmt das. Der Umbau nach Merkmalen verschiebt
 * aber genau diese Dateien, und ein fester Pfad kennt danach zwei Ausgänge:
 *
 *   - der laute: `readFileSync` wirft, der Lauf bricht ab. Ärgerlich, aber
 *     ehrlich.
 *   - der **stumme**: die Datei wird übersprungen, die Menge, über die geurteilt
 *     wird, ist leer, und „nichts gefunden" liest sich wie „nichts zu
 *     beanstanden". Genau das ist am 2026-09-10 zweimal passiert
 *     (`proof:foreign` urteilte über 129 Dateien, ohne eine gesehen zu haben;
 *     `proof:addin` 18f maß die Tür, die zu war).
 *
 * Der stumme Ausgang ist der gefährliche, denn er läßt den Lauf **grün**.
 *
 * Was hier steht und was nicht mehr (T-249-5)
 * -------------------------------------------
 * Die Bausteine der Auflösung stehen seit T-249-4 **einmal** im Bestand, in
 * `scripts/source-anchors.mjs` in der Wurzel: die Wurzel des Arbeitsbereichs,
 * der Leser der Muster aus `pnpm-workspace.yaml`, die Paketauflösung über den
 * Namen, der rekursive Baumgang, die Suche nach genau einer Datei über ein
 * Merkmal. Bis T-249-5 stand dasselbe hier ein zweites und in
 * `packages/domain/scripts/check-export-boundary.mjs` ein drittes Mal — drei
 * Abschriften einer Regel ohne Wächter, der sie zusammenhält. Beide Abschriften
 * sind gefallen.
 *
 * Was **bleibt**, ist die Schicht dieses Dienstes, und sie bleibt aus drei
 * benannten Gründen:
 *
 *   1. **`scheitern` und die Umhüllung darum.** Die gemeinsame Fassung *wirft*
 *      `MissingSourceError`, statt den Prozeß zu beenden — ein Baustein, der
 *      `process.exit` ruft, läßt sich nicht gegenprüfen, weil eine Prüfung, die
 *      den Abbruch messen will, mit ihm stürbe. Die Entscheidung, wie ein
 *      Fehlschlag **aussieht**, gehört dem Lauf: hier eine Zeile `FEHL`, der
 *      Grund darunter, Rückgabewert 1. `resolveOrFail` setzt das eine ins
 *      andere um.
 *   2. **`UEBERGANGEN`.** Welche Ordner ein Lauf betritt, ist seine
 *      Entscheidung und nicht die des Bausteins: `proof:surface` will
 *      Stilblätter **einschließlich** Unterordnern, dieser Lauf will
 *      Produktivdateien **ohne** Prüffälle. Eine gemeinsame Liste wäre für
 *      einen von beiden falsch, und zwar still. Sie geht deshalb als
 *      `enter`-Funktion in den Aufruf.
 *   3. **`paketQuelle`.** Die Bauart „erst den Hinweis versuchen, dann den Baum
 *      durchsuchen und den Umweg melden" schreibt auf `stdout`, und ein
 *      Baustein, der schreibt, ist in einem Nachweis schwer zu messen.
 *
 * Dazu die drei fachnahen Helfer, die nur `local-api` braucht:
 * `dienstEinstieg`, `migrationsVerzeichnis`, `quellbaum`. Eine gemeinsame
 * Datei, die alles aufnimmt, was irgendwo gebraucht wird, wäre der Sammelordner,
 * den der Auftraggeber ausgeschlossen hat.
 *
 * Und die Regel, die keine Pfadfrage ist und trotzdem hierher gehört: **jeder
 * Lauf, der über eine Menge urteilt, braucht eine Untergrenze auf die Zahl der
 * gesehenen Dinge.** `quellbaum()` verlangt sie als Argument und läßt sich nicht
 * ohne aufrufen.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MissingSourceError,
  displayPath,
  locateSingleSource,
  locateWorkspacePackage,
  readTreeSync,
  workspaceRoot,
} from '../../../scripts/source-anchors.mjs';

/**
 * Bricht den Lauf rot ab und sagt, was fehlt.
 *
 * Der Schlußsatz steht bewußt in jeder Ausgabe: Er ist die Regel, gegen die
 * dieser Abbruch geschrieben ist, und er soll auch dann lesbar sein, wenn nur
 * die letzten Zeilen eines Laufs in einem Protokoll landen.
 */
export function scheitern(titel, ...zeilen) {
  process.stdout.write(`  FEHL  ${titel}\n`);
  for (const zeile of zeilen) process.stdout.write(`        ${zeile}\n`);
  process.stdout.write(
    '        Eine Quelldatei, die der Nachweis nicht findet, ist ein Fehlschlag der\n' +
      '        Messung — nie ein bestandener Prüfsatz.\n',
  );
  process.exit(1);
}

/**
 * Ein Wurf der gemeinsamen Bausteine wird zur `FEHL`-Zeile dieses Laufs.
 *
 * Die Auflösung läuft in den meisten Nachweisen **vor** dem ersten Prüfsatz, auf
 * der obersten Ebene des Moduls. Ein geworfener Fehler käme dort als Stapelspur
 * heraus und sähe aus wie ein Absturz des Werkzeugs. Ein Fehlschlag der Messung
 * soll aussehen wie ein Fehlschlag der Messung.
 *
 * Die Meldungen der gemeinsamen Fassung sind auf genau diese Ausgabe hin
 * gesetzt: erste Zeile ohne Einzug, Folgezeilen mit acht Leerzeichen. Sie geht
 * deshalb als **eine** Zeile an `scheitern`.
 *
 * Ein Fehler, der **kein** `MissingSourceError` ist, fliegt weiter — er ist
 * dann kein Fehlschlag der Auflösung, und ihn hier zu schlucken hieße, eine
 * fremde Ursache als gemessenen Befund auszugeben.
 *
 * @template T
 * @param {string} title Was aufgelöst werden sollte, als Überschrift.
 * @param {() => T} work
 * @returns {T}
 */
function resolveOrFail(title, work) {
  try {
    return work();
  } catch (fehler) {
    if (!(fehler instanceof MissingSourceError)) throw fehler;
    scheitern(title, fehler.message);
  }
}

// ---------------------------------------------------------------------------
// Wurzel und Pakete — aufgesetzt auf die gemeinsame Fassung
// ---------------------------------------------------------------------------

/**
 * Die Wurzel des Arbeitsbereichs, **erlaufen** statt gezählt.
 *
 * Bisher stand dafür `new URL('../../../', import.meta.url)` in den Läufen —
 * drei Ebenen, weil dieses Verzeichnis heute `apps/local-api/scripts` heißt.
 * Zieht ein Nachweis eine Ebene tiefer oder höher, zeigt die Zählung stillweg
 * auf ein anderes Verzeichnis, und `git ls-files` dort liefert entweder nichts
 * oder zu viel. `pnpm-workspace.yaml` ist die Marke, die nicht mitzählt.
 */
export function arbeitsbereichWurzel() {
  return resolveOrFail('Wurzel des Arbeitsbereichs auflösen', () => workspaceRoot());
}

/**
 * Das Verzeichnis eines Pakets, gefunden über seinen **Namen**.
 *
 * Das ist die eigentliche Umkehr gegenüber dem festen Pfad: Nicht „das
 * Verzeichnis `apps/web`", sondern „das Paket `@takt/web`, wo immer es liegt".
 * Die erlaubten Orte kommen aus den Mustern in `pnpm-workspace.yaml`, nicht aus
 * einer abgeschriebenen Liste — und ein Paketname, der zweimal vorkommt, ist
 * dort ein Abbruch statt einer stillen Überschreibung.
 */
export function paketVerzeichnis(name) {
  return resolveOrFail(`Paket ${name} auflösen`, () =>
    locateWorkspacePackage(arbeitsbereichWurzel(), name),
  );
}

// ---------------------------------------------------------------------------
// Quelldateien über ein Merkmal
// ---------------------------------------------------------------------------

/**
 * Was beim Suchen nicht betreten wird.
 *
 * `test`, `tests` und `__tests__` stehen mit darin, und das ist keine
 * Bequemlichkeit: Die Läufe suchen **Produktivdateien**. Ein Prüffall, der die
 * gesuchte Zeile zitiert, wäre sonst ein zweiter Treffer, die Auflösung würde
 * mehrdeutig und der Lauf rot — mit einem Grund, der nichts mit dem Bestand zu
 * tun hat. Bauergebnisse (`dist`, `target`, `build`) fallen aus demselben Grund
 * heraus, nur andersherum: Sie tragen **veraltete Abschriften** derselben
 * Zeilen, und eine davon aufzulösen hieße, eine Kopie zu messen statt der
 * Quelle (dieselbe Falle wie in E-087).
 *
 * Seit T-249-5 steht die Liste nicht mehr in einem eigenen Baumgang, sondern
 * geht als `enter` in die gemeinsame Fassung. Der Ort der Entscheidung ist
 * damit derselbe geblieben: dieser Lauf.
 */
const UEBERGANGEN = new Set([
  'node_modules',
  'dist',
  'target',
  'coverage',
  '.git',
  'build',
  'test',
  'tests',
  '__tests__',
]);

/** @type {(name: string) => boolean} */
const enterSourceDirectory = (name) => !UEBERGANGEN.has(name);

const QUELLENDUNGEN = new Set(['.ts', '.tsx', '.mts', '.js', '.mjs']);

/** Nimmt eine Datei nach ihrer Endung an — die Auswahl gehört dem Aufrufer. */
const acceptExtension = (endungen) => (name) => {
  const punkt = name.lastIndexOf('.');
  return punkt !== -1 && endungen.has(name.slice(punkt));
};

/**
 * Eine Quelldatei eines Pakets, gefunden über ein Merkmal statt über ihren Ort.
 *
 * `hinweis` ist der heutige Ort — er wird zuerst versucht, weil er im
 * Regelfall stimmt und der Lauf dann keinen Baum begehen muß. Er ist aber nur
 * eine Abkürzung: Trägt die Datei dort das Merkmal nicht (oder liegt sie nicht
 * mehr dort), wird das Paket durchsucht. Genau **ein** Treffer ist eine
 * Auflösung; null ist ein Fehlschlag, und mehr als einer ebenso — ein
 * mehrdeutiges Merkmal wäre eine Auflösung, die sich selbst nicht traut.
 *
 * `merkmal` ist eine Zeichenfolge oder mehrere; alle müssen vorkommen. Sinnvoll
 * ist das, was die Datei ausmacht — eine ausgeführte Ausfuhr, nicht ein Wort
 * aus einem Kommentar.
 */
export function paketQuelle(paketName, { hinweis, merkmal, endungen = QUELLENDUNGEN }) {
  const gefunden = quelleSuchen(paketName, { hinweis, merkmal, endungen });
  if (gefunden.pfad === null) {
    scheitern(`Quelldatei in ${paketName} auflösen`, gefunden.grund);
  }
  return gefunden.pfad;
}

/**
 * Dieselbe Suche, aber die Abwesenheit ist ein zulässiges Ergebnis (T-250-2).
 *
 * **Die Ausnahme, nicht die Regel.** Sie ist für die eine Lage gedacht, in der
 * eine Datei planmäßig **verschwindet**: `apps/web/src/api/endpoints.ts` löst
 * sich über acht Wellen in die `api.ts` der Merkmalsordner auf (F-22). Ein Lauf, der sie
 * bis zur letzten Welle mitliest und danach an ihrem Fehlen stirbt, wäre rot,
 * weil eine erwartete Datei fehlt — und genau das soll er nicht sein.
 *
 * Der Preis ist der stumme Ausgang, vor dem der Kopfabsatz dieser Datei warnt.
 * Er ist hier **eingehegt**, und nur unter diesen zwei Bedingungen darf jemand
 * diese Funktion benutzen:
 *
 *   1. Das Ausbleiben wird **gesagt** — die Zeile unten schreibt es hin, so
 *      wie der Umweg im Regelfall hingeschrieben wird.
 *   2. Der Aufrufer hat eine **Untergrenze** auf die Menge, in die das Ergebnis
 *      einfließt. `null` darf nie dazu führen, daß über die leere Menge
 *      geurteilt wird; dann wäre der stumme Ausgang zurück.
 *
 * @returns {string | null}
 */
export function optionaleQuelle(paketName, { hinweis, merkmal, endungen = QUELLENDUNGEN }) {
  const gefunden = quelleSuchen(paketName, { hinweis, merkmal, endungen });
  if (gefunden.pfad === null) {
    process.stdout.write(
      `        Hinweis: ${paketName}/${hinweis} ist nicht (mehr) auflösbar — ${gefunden.grund}\n`,
    );
  }
  return gefunden.pfad;
}

/**
 * Der gemeinsame Kern beider Auflösungen: erst der Hinweis, dann der Baum.
 *
 * Er entscheidet **nicht**, wie ein Fehlschlag aussieht — das ist die
 * Entscheidung des Aufrufers und der Grund, warum `scheitern` hier nicht steht
 * (siehe Punkt 1 des Kopfabsatzes).
 *
 * @returns {{ pfad: string | null, grund: string }}
 */
function quelleSuchen(paketName, { hinweis, merkmal, endungen }) {
  const merkmale = Array.isArray(merkmal) ? merkmal : [merkmal];
  if (
    merkmale.length === 0 ||
    merkmale.some((eintrag) => typeof eintrag !== 'string' || eintrag === '')
  ) {
    scheitern(
      `Quelldatei in ${paketName} auflösen`,
      `Der Aufruf nennt kein brauchbares Merkmal (Hinweis: ${hinweis}).`,
      'Ohne Merkmal wäre die Auflösung ein fester Pfad mit mehr Zeilen.',
    );
  }
  const wurzel = paketVerzeichnis(paketName);
  const traegt = (text) => merkmale.every((eintrag) => text.includes(eintrag));

  const abkuerzung = join(wurzel, hinweis);
  try {
    if (traegt(readFileSync(abkuerzung, 'utf8'))) return { pfad: abkuerzung, grund: '' };
  } catch {
    /* Der Hinweis ist eine Abkürzung und kein Versprechen. */
  }

  let treffer;
  try {
    treffer = locateSingleSource({
      root: wurzel,
      accept: acceptExtension(endungen),
      carries: traegt,
      enter: enterSourceDirectory,
      description:
        `die Quelldatei mit dem Merkmal ${merkmale.map((eintrag) => JSON.stringify(eintrag)).join(' + ')} ` +
        `(Hinweis ${hinweis} trägt es nicht)`,
    });
  } catch (fehler) {
    if (!(fehler instanceof MissingSourceError)) throw fehler;
    return { pfad: null, grund: String(fehler.message ?? fehler) };
  }
  process.stdout.write(
    `        Hinweis: ${paketName}/${hinweis} trägt das Merkmal nicht; aufgelöst nach ` +
      `${displayPath(wurzel, treffer.path)}\n`,
  );
  return { pfad: treffer.path, grund: '' };
}

/**
 * Der Einstiegspunkt des lokalen Dienstes, wie ihn die Nachweisläufe starten.
 *
 * Fünf Läufe starteten ihn bis T-249-1 über `join(HERE, '..', 'src',
 * 'index.ts')` — fünf Abschriften desselben Pfades. Der Umbau nach Merkmalen
 * legt Routen und Anwendungsfälle je Merkmal zusammen; ob `index.ts` dabei
 * liegen bleibt, entscheidet nicht dieser Lauf. Das Merkmal ist der Aufruf, um
 * den es geht: die Datei, die `main()` ausführt.
 *
 * Ein fehlgeschlagener Start wäre hier übrigens **laut** gewesen — der
 * Kindprozeß stirbt, die Anfragen laufen ins Leere. Es geht also nicht um einen
 * stummen Ausgang, sondern um die eine Stelle statt fünf: Nach dem Umzug wäre
 * sonst an fünf Dateien dasselbe nachzuziehen, und die vergessene sechste ist
 * die, die man sucht.
 */
export function dienstEinstieg() {
  return paketQuelle('@takt/local-api', {
    hinweis: 'src/index.ts',
    merkmal: ['await main()', "from './main.ts'"],
  });
}

/**
 * Das Verzeichnis der Migrationen — über die **Ausfuhrtabelle** von
 * `@takt/storage`, nicht über einen Pfad (T-249-1).
 *
 * Das ist die stärkste der drei Auflösungen und deshalb hier eigens
 * ausgeschrieben: `packages/storage/package.json` führt `"./migrations/*"` als
 * Einstiegspunkt. Node löst ihn auf, also weiß der Modulgraph selbst, wo die
 * Dateien liegen — kein Abzählen von Ebenen, kein Erraten eines
 * Verzeichnisnamens, und ein Umzug des Pakets **oder** des Ordners trägt sich
 * von selbst nach, solange die Tabelle stimmt. Bis T-249-1 stand dafür
 * `join(HERE, '..', '..', '..', 'packages', 'storage', 'migrations')`.
 *
 * Die Untergrenze ist verpflichtend, und sie ist hier besonders wichtig: Läufe
 * lesen diese Zahl als „so viele Migrationen kennt diese Fassung" und stellen
 * sie einer Datenbankfassung gegenüber. Ein leeres Verzeichnis ergäbe die
 * Aussage „diese Fassung kennt null Migrationen" — grün, sinnlos und falsch.
 */
export function migrationsVerzeichnis({ mindestens }) {
  if (!Number.isInteger(mindestens) || mindestens < 1) {
    scheitern(
      'Migrationen auflösen',
      `Untergrenze "${String(mindestens)}" ist keine ganze Zahl über null.`,
    );
  }
  let verzeichnis;
  try {
    verzeichnis = fileURLToPath(
      new URL('.', import.meta.resolve('@takt/storage/migrations/index')),
    );
  } catch (fehler) {
    scheitern(
      'Migrationen auflösen',
      'Der Einstiegspunkt "@takt/storage/migrations/*" ließ sich nicht auflösen.',
      String(fehler?.message ?? fehler),
    );
  }
  let namen = [];
  try {
    namen = readdirSync(verzeichnis);
  } catch (fehler) {
    scheitern('Migrationen auflösen', `${verzeichnis} ist nicht lesbar.`, String(fehler?.message ?? fehler));
  }
  const vorwaerts = namen.filter((name) => name.endsWith('.up.sql'));
  if (vorwaerts.length < mindestens) {
    scheitern(
      'Migrationen auflösen',
      `${vorwaerts.length} Vorwärtsmigration(en) in ${verzeichnis}, verlangt sind mindestens ${mindestens}.`,
      'Eine leere Migrationsmenge ließe jede Aussage über sie wahr werden.',
    );
  }
  return verzeichnis;
}

/**
 * Ein Quellbaum eines Pakets — mit **verpflichtender** Untergrenze.
 *
 * `mindestens` ist kein Beiwerk und hat keinen Vorgabewert. Ohne die Zahl ist
 * „nichts gefunden" von „nichts gesehen" nicht zu unterscheiden, und ein Lauf,
 * der über eine leere Menge urteilt, urteilt über nichts und bleibt grün dabei.
 * Fehlt das Verzeichnis oder liegen weniger Dateien darin als verlangt, endet
 * der Lauf hier — nicht in einem Prüfsatz weiter unten, der dann nichts mehr zu
 * prüfen hätte. Das fehlende Verzeichnis fängt seit T-249-5 `requireDirectory`
 * der gemeinsamen Fassung; die Untergrenze bleibt hier, weil die Zahl eine
 * Aussage **dieses** Laufs ist.
 */
export function quellbaum(paketName, unterordner, { mindestens, endungen = QUELLENDUNGEN }) {
  if (!Number.isInteger(mindestens) || mindestens < 1) {
    scheitern(
      `Quellbaum ${paketName}/${unterordner} lesen`,
      `Untergrenze "${String(mindestens)}" ist keine ganze Zahl über null.`,
      'Ein Lauf über eine Menge ohne Untergrenze kann nicht zwischen „nichts gefunden"',
      'und „nichts gesehen" unterscheiden.',
    );
  }
  const voll = join(paketVerzeichnis(paketName), unterordner);
  const dateien = resolveOrFail(`Quellbaum ${paketName}/${unterordner} lesen`, () =>
    readTreeSync(
      voll,
      acceptExtension(endungen),
      `den Quellbaum ${paketName}/${unterordner}`,
      enterSourceDirectory,
    ),
  ).map((eintrag) => eintrag.path);
  if (dateien.length < mindestens) {
    scheitern(
      `Quellbaum ${paketName}/${unterordner} lesen`,
      `${dateien.length} Datei(en) gefunden, verlangt sind mindestens ${mindestens}.`,
      `Endungen: ${[...endungen].join(' ')}`,
    );
  }
  return dateien;
}
