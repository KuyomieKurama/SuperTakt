/**
 * Takt — Dateizugriff für den Export (E-011, R-11, A-8.1, A-8.9, B-6.*).
 *
 * ---------------------------------------------------------------------------
 * Der Ordner ist Benutzereingabe, und er wird jedes Mal neu geprüft
 * ---------------------------------------------------------------------------
 *
 * Nicht nur beim Einstellen. Zwischen zwei Exportläufen kann ein Netzlaufwerk
 * verschwinden, ein Ordner schreibgeschützt werden oder durch eine Datei
 * gleichen Namens ersetzt sein. Ein Export, der das erst beim Schreiben
 * bemerkt, hat die Transaktion schon offen.
 *
 * ---------------------------------------------------------------------------
 * Warum erst eine Nachbardatei und dann umbenannt wird
 * ---------------------------------------------------------------------------
 *
 * Ein Umbenennen innerhalb desselben Dateisystems ist unteilbar. Wer die
 * Zieldatei direkt schriebe, hinterließe bei einem Absturz mitten im Schreiben
 * eine halbe Exportdatei — mit gültigem Namen, im richtigen Ordner, und ohne
 * Kennzeichen, dass sie unvollständig ist. Sie ginge an die Abrechnung.
 *
 * Die Nachbardatei heißt `.takt-<zufall>.tmp` und liegt im **selben** Ordner:
 * Ein Umbenennen über eine Dateisystemgrenze hinweg wäre ein Kopiervorgang und
 * damit nicht mehr unteilbar.
 *
 * ---------------------------------------------------------------------------
 * Der Zielpfad wird aufgelöst und verglichen
 * ---------------------------------------------------------------------------
 *
 * Der Dateiname wird vom Dienst gebildet und enthält keine Eingabe des
 * Aufrufers. Trotzdem wird geprüft: `resolve(ordner, name)` muss innerhalb des
 * aufgelösten Ordners liegen. Das ist die Maßnahme gegen R-11 — und sie steht
 * hier, weil sie sonst bei der nächsten Vorlage vergessen würde, die einen
 * Dateinamen konfigurierbar macht.
 *
 * ---------------------------------------------------------------------------
 * Die Prüfung wartet höchstens drei Sekunden
 * ---------------------------------------------------------------------------
 *
 * Ein `stat` auf eine tote Netzfreigabe kehrt nicht sofort zurück. Es kehrt
 * zurück, wenn das Betriebssystem aufgibt — unter Windows nach etwa fünfzehn
 * Sekunden. So lange hielt `PATCH /settings` die Antwort auf, und ein Benutzer,
 * der einen Ordner einstellt, hält eine Anwendung nach fünfzehn Sekunden ohne
 * Rückmeldung für abgestürzt. Er wartet nicht, er klickt.
 *
 * Deshalb ein Zeitbudget von drei Sekunden. Was danach kommt, ist `unreachable`
 * und nicht `missing`: Nicht geantwortet zu haben ist kein Beleg dafür, nicht
 * da zu sein.
 *
 * Zwei Dinge, die dabei **nicht** geschehen, gehören dazugesagt:
 *
 *  1. Der Systemaufruf wird nicht abgebrochen. Node kann `stat` nicht
 *     zurücknehmen; das Budget beendet nur das Warten. Der Aufruf läuft in
 *     einem Arbeiter des Threadpools weiter, bis das Betriebssystem ihn
 *     beendet. Der Pool hat vier Arbeiter — wer viermal hintereinander auf
 *     dieselbe tote Freigabe prüft, bevor der erste Aufruf zurückkehrt, hält
 *     sie alle. Das ist hinnehmbar, weil der einzige Auslöser eine Handlung des
 *     Benutzers an derselben Einstellung ist, und es ist der Grund, warum das
 *     Budget nicht auf 300 Millisekunden steht.
 *  2. Das Schreiben selbst bekommt kein Budget. Ein halb geschriebener Export
 *     ist schlimmer als ein langsamer; dort ist die Nachbardatei die Sicherung
 *     und nicht die Uhr.
 */

import { createHash, randomBytes } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { access, mkdir, open, rename, rm, stat } from 'node:fs/promises';
import { isAbsolute, resolve, sep } from 'node:path';

import type { ExportDirectoryCheck, Result, TaktError } from '@takt/domain';
import { err, ok, taktError } from '@takt/domain';

import type { FilePort } from '../ports.ts';

/**
 * Wie lange auf das Dateisystem gewartet wird, bevor „nicht erreichbar" gilt.
 *
 * Drei Sekunden sind kein gemessener Wert, sondern eine Abwägung: lang genug
 * für eine träge, aber lebende Freigabe im Firmennetz, kurz genug, dass niemand
 * die Anwendung für hängend hält.
 */
export const DIRECTORY_CHECK_BUDGET_MS = 3_000;

/** Ergebnis eines Wartens mit Budget — ohne die Ablehnung zu verlieren. */
export type TimeBudgetResult<T> =
  | { readonly kind: 'value'; readonly value: T }
  | { readonly kind: 'error' }
  | { readonly kind: 'timeout' };

/**
 * Wartet höchstens `budget` Millisekunden auf `work`.
 *
 * Die Zusage wird **vorher** in ein Ergebnis überführt (`then` mit beiden
 * Zweigen). Ohne das käme eine Ablehnung, die nach Ablauf des Budgets eintrifft,
 * als unbehandelte Ablehnung an und beendete den Prozess.
 *
 * Ausgeführt, weil auch die Einordnung eines Ordners
 * (`apps/local-api/src/access/export-directory.ts`) an dieselbe Wand laufen
 * kann und dieselbe Antwort braucht. Zwei Fassungen dieser Klammer wären zwei
 * Zeitbudgets, die auseinanderlaufen können.
 */
export async function within<T>(work: Promise<T>, budget: number): Promise<TimeBudgetResult<T>> {
  const settled: Promise<TimeBudgetResult<T>> = work.then(
    (value) => ({ kind: 'value', value }) as const,
    () => ({ kind: 'error' }) as const,
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  const expiry = new Promise<TimeBudgetResult<T>>((resolveExpiry) => {
    timer = setTimeout(() => resolveExpiry({ kind: 'timeout' }), budget);
    // Ein noch laufender Zeitgeber soll den Prozess nicht am Beenden hindern.
    timer.unref?.();
  });

  try {
    return await Promise.race([settled, expiry]);
  } finally {
    clearTimeout(timer);
  }
}

export function createFilePort(): FilePort {
  return {
    async checkExportDirectory(path): Promise<ExportDirectoryCheck> {
      if (path === null || path.trim() === '') {
        return { ok: false, reason: 'not_set' };
      }

      const resolved = resolve(path);
      const started = Date.now();

      const info = await within(stat(resolved), DIRECTORY_CHECK_BUDGET_MS);
      if (info.kind === 'timeout') {
        return { ok: false, reason: 'unreachable', waitedMs: Date.now() - started };
      }
      if (info.kind === 'error') {
        return { ok: false, reason: 'missing' };
      }

      if (!info.value.isDirectory()) {
        return { ok: false, reason: 'not_a_directory' };
      }

      const writable = await within(access(resolved, fsConstants.W_OK), DIRECTORY_CHECK_BUDGET_MS);
      if (writable.kind === 'timeout') {
        return { ok: false, reason: 'unreachable', waitedMs: Date.now() - started };
      }
      if (writable.kind === 'error') {
        return { ok: false, reason: 'not_writable' };
      }

      return { ok: true, resolvedPath: resolved };
    },

    async writeFile(
      directory,
      fileName,
      content,
    ): Promise<Result<{ path: string; sha256: string; bytes: number }, TaktError>> {
      const resolvedDirectory = resolve(directory);
      const target = resolve(resolvedDirectory, fileName);

      // Der Vergleich läuft über den **aufgelösten** Pfad. `..` im Namen führt
      // damit nirgends hinaus, und ein absoluter Name überschreibt den Ordner
      // nicht. Das Trennzeichen am Ende verhindert, dass `/daten/exporte-alt`
      // als „innerhalb von /daten/exporte" durchginge.
      if (isAbsolute(fileName) || !target.startsWith(resolvedDirectory + sep)) {
        return err(
          taktError(
            'export_path_outside_directory',
            'Die Exportdatei würde außerhalb des gewählten Ordners liegen. Es wurde nichts geschrieben.',
          ),
        );
      }

      const temporary = resolve(resolvedDirectory, `.takt-${randomBytes(9).toString('hex')}.tmp`);
      const bytes = Buffer.from(content, 'utf8');
      const sha256 = createHash('sha256').update(bytes).digest('hex');

      let handle;
      try {
        // `wx`: schlägt fehl, wenn die Nachbardatei schon existiert. Bei einem
        // Zufallsnamen aus 72 Bit ist das kein realistischer Fall — aber der
        // Fehlschlag ist besser als ein stilles Überschreiben.
        handle = await open(temporary, 'wx', 0o600);
        await handle.writeFile(bytes);
        // Ohne `fsync` liegt der Inhalt im Zwischenspeicher des
        // Betriebssystems. Ein Stromausfall unmittelbar nach dem
        // Festschreiben der Transaktion hinterließe dann markierte Buchungen
        // ohne Datei — genau der Fall, den die Reihenfolge ausschließen soll.
        await handle.sync();
      } catch {
        await rm(temporary, { force: true }).catch(() => undefined);
        return err(
          taktError(
            'export_directory_not_writable',
            'In den gewählten Ordner konnte nicht geschrieben werden.',
          ),
        );
      } finally {
        await handle?.close().catch(() => undefined);
      }

      try {
        await rename(temporary, target);
      } catch {
        await rm(temporary, { force: true }).catch(() => undefined);
        return err(
          taktError(
            'export_directory_not_writable',
            'Die Exportdatei konnte nicht an ihren Platz gebracht werden.',
          ),
        );
      }

      return ok({ path: target, sha256, bytes: bytes.byteLength });
    },
  };
}

/**
 * Entfernt eine geschriebene Datei wieder.
 *
 * Gebraucht an genau einer Stelle: Wenn das Festschreiben nach dem Schreiben
 * der Datei scheitert. Die Datei muss dann fort, sonst läge im Ordner eine
 * Abrechnung, die es nach der Datenbank nie gegeben hat.
 */
export async function removeFile(path: string): Promise<void> {
  await rm(path, { force: true }).catch(() => undefined);
}

/**
 * Räumt liegengebliebene Nachbardateien auf.
 *
 * Bricht der Dienst zwischen Schreiben und Umbenennen ab, bleibt eine
 * `.takt-*.tmp` liegen. Sie enthält Kundendaten (A-8.9, R-05) und gehört beim
 * nächsten Start entfernt — sie ist kein Beleg für irgendetwas, denn die
 * zugehörige Transaktion ist zurückgenommen.
 */
export async function sweepTemporaryFiles(directory: string): Promise<number> {
  const { readdir } = await import('node:fs/promises');
  let removed = 0;
  try {
    for (const name of await readdir(directory)) {
      if (name.startsWith('.takt-') && name.endsWith('.tmp')) {
        await rm(resolve(directory, name), { force: true }).catch(() => undefined);
        removed += 1;
      }
    }
  } catch {
    /* Ordner nicht lesbar — dann gibt es hier nichts aufzuräumen. */
  }
  return removed;
}

/** Legt das Anwendungsdatenverzeichnis mit engen Rechten an (E-018, B-2.2 Punkt 3). */
export async function ensureDirectory(path: string, mode = 0o700): Promise<void> {
  await mkdir(path, { recursive: true, mode });
}
