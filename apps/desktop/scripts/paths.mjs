/**
 * Takt — „liegt diese Datei in diesem Ordner?" mit `node:path` statt mit `/`
 * (T-098).
 *
 * ===========================================================================
 * Der Befund, wegen dessen es diese Datei gibt
 * ===========================================================================
 *
 * `build-sidecar.mjs` zählte, wie viele Dateien der Arbeitsbereichspakete im
 * Bündel stecken, und tat das so:
 *
 *     input.startsWith(`${folder}/`)
 *
 * Unter Linux und macOS geht das auf. Unter Windows trifft es **nie**: `folder`
 * kommt aus `join(...)` und trägt Rückstriche (`D:\a\SuperTakt\apps\local-api`),
 * die Vergleichszeichenkette daran also `…local-api/`, während der Eingabepfad
 * `D:\…\apps\local-api\src\entry.ts` lautet. Der Lauf im Auslieferungsablauf
 * meldete deshalb für alle drei Pakete null Dateien und brach mit
 * „Der lokale Dienst selbst ist nicht im Bündel" ab — obwohl das Bündel in
 * Ordnung war. Ein Zähler, der die Trennzeichen des Betriebssystems rät, misst
 * nicht das Erzeugnis, sondern die Plattform.
 *
 * ---------------------------------------------------------------------------
 * Warum `relative` und nicht `folder + sep`
 * ---------------------------------------------------------------------------
 *
 * `${folder}${sep}` wäre die kleinere Änderung und bliebe zerbrechlich: Sie
 * vergleicht Zeichen für Zeichen, und Windows tut das nicht. Der
 * Laufwerksbuchstabe ist der Fall, den man sich nicht ausdenkt — `resolve`
 * vereinheitlicht ihn **nicht**. Gemessen mit Node 22 auf dieser Maschine:
 *
 *     path.win32.resolve('d:\\a\\B\\x.ts')            → 'd:\\a\\B\\x.ts'
 *     path.win32.relative('D:\\a\\x', 'd:\\a\\x\\y')  → 'y'
 *
 * `path.win32.relative` vergleicht ohne Rücksicht auf Groß- und Kleinschreibung
 * — so, wie das Dateisystem darunter es auch tut — und verträgt einen
 * abschließenden Trenner. Damit hängt die Antwort am Pfadmodul und nicht an
 * einer selbst gebauten Zeichenkette.
 *
 * ---------------------------------------------------------------------------
 * Warum das Pfadmodul ein Parameter ist
 * ---------------------------------------------------------------------------
 *
 * Damit dieselbe Funktion unter Linux gegen `path.win32` **und** `path.posix`
 * gehalten werden kann. Ein Windows-Fehler, der nur auf einem Windows-Rechner
 * auffällt, ist genau der Fehler, den dieses Projekt gerade bezahlt hat: Er
 * wurde erst im Auslieferungsablauf sichtbar, zehn Minuten nach dem Etikett.
 */

import nodePath from 'node:path';

/**
 * Liegt `file` unterhalb von `folder`?
 *
 * Beide Angaben müssen absolut sein — der Aufrufer macht sie das vorher mit
 * `resolve`, weil nur er weiß, worauf ein relativer Pfad sich bezieht.
 *
 * Der Ordner selbst gilt **nicht** als „innerhalb": `relative` liefert dafür
 * die leere Zeichenkette, und ein Ordner ist keine Datei in sich.
 *
 * @param {string} folder Der Ordner, absolut.
 * @param {string} file Die Datei, absolut.
 * @param {typeof nodePath} [path] Das Pfadmodul. Vorgabe ist das der Plattform;
 *   `path.win32` und `path.posix` machen die Antwort ohne Windows-Rechner
 *   nachprüfbar.
 * @returns {boolean}
 */
export function isInside(folder, file, path = nodePath) {
  const step = path.relative(folder, file);

  // Leer heißt: dieselbe Stelle. Absolut heißt: es gibt gar keinen Weg dorthin
  // — unter Windows der Fall zweier Laufwerke (`D:\…` gegen `C:\…`).
  if (step === '' || path.isAbsolute(step)) {
    return false;
  }

  // Ein Weg, der aufwärts beginnt, führt aus dem Ordner heraus. `..` allein
  // steht für den Elternordner, `..<Trenner>` für alles darunter — und genau
  // das trennt `apps/local-api` von `apps/local-api-alt`.
  return step !== '..' && !step.startsWith(`..${path.sep}`);
}
