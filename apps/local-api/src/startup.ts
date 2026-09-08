/**
 * Takt — der Startpfad in Worte gefasst (T-132, B-2.4).
 *
 * ===========================================================================
 * Warum es diese Datei gibt
 * ===========================================================================
 *
 * Am 2026-09-04 um 18:57 startete Takt nicht. Im Protokoll stand genau eine
 * Zeile:
 *
 *     Der Datenbestand konnte nicht auf den Stand dieser Fassung gebracht
 *     werden. Takt startet nicht.
 *
 * Sie nennt die **Folge** und nicht die Ursache, und das war kein Zufall:
 * `main.ts` fing den Wurf mit `catch {` ohne Bindung ab. Der Fehlerwert wurde
 * nie angesehen. Ein zweiter Anlauf lief durch, und damit war der Grund für
 * immer weg.
 *
 * Die Begründung dafür stand als Kommentar daneben: „Der Grund steht nicht in
 * der Meldung: Er kann einen Dateipfad enthalten (B-2.4)." Der Satz ist
 * richtig und die Schlussfolgerung war falsch. B-2.4 verbietet den **Pfad** in
 * einer Meldung, nicht den **Grund**. Ein Grund lässt sich so bauen, dass er
 * gar keinen Pfad tragen kann — und genau das ist der Inhalt dieser Datei.
 *
 * ===========================================================================
 * Zwei Leser, zwei Felder
 * ===========================================================================
 *
 * Jede Auskunft hier besteht aus zwei Teilen:
 *
 *  - `sentence` — der deutsche Satz für den Menschen vor dem Bildschirm. Er
 *    sagt, was los ist und was zu tun ist, und nennt weder Fassungsnummer noch
 *    Fehlerschlüssel: Beides hilft ihm nicht.
 *  - `key` — der technische Grund für den, der die Protokollzeile später
 *    auswertet. Dieselbe Rolle wie `outcome` bei einer Anfrage: ein Schlüssel
 *    aus einem geschlossenen Vorrat, ergänzt um Zahlen.
 *
 * ===========================================================================
 * Wieso hier kein Pfad hindurchkommt
 * ===========================================================================
 *
 * Drei Riegel hintereinander, und keiner davon ist Sorgfalt:
 *
 *  1. Der **Grund ist ein Wert** mit benannten Feldern
 *     (`MigrationFailureReason` in `@takt/storage`), keine Meldung. Seine
 *     Felder sind Zahlen und ein Fehlerschlüssel, den `errorCodeOf` auf
 *     Großbuchstaben, Ziffern und Unterstrich begrenzt.
 *  2. Die **Sätze sind Konstanten**. In keinen wird etwas eingesetzt.
 *  3. Der **Schlüssel wird aus Bausteinen gebaut** — Wortmarke, Zahl,
 *     kleingeschriebener Fehlerschlüssel — und der Protokollierer weist
 *     alles ab, was nicht in seinen Zeichenvorrat passt (`logger.ts`).
 *
 * Die Meldung des zugrunde liegenden Wurfs wird an **keiner** Stelle
 * ausgegeben. Sie bleibt im Wurf, wo sie im Debugger lesbar ist.
 */

import {
  errorCodeOf,
  isBusyResultCode,
  migrationFailureReason,
  sqliteResultCodeOf,
  type MigrationFailureReason,
  type MigrationRunnerPort,
} from '@takt/storage';

import type { Logger } from './logger.ts';

/** Ein Grund, zweimal gesagt: einmal für den Menschen, einmal fürs Protokoll. */
export interface StartupDiagnosis {
  /** Deutscher Anzeigetext. Konstante, ohne eingesetzte Werte. */
  readonly sentence: string;
  /** Technischer Grund, kleingeschrieben, aus Wortmarken und Zahlen. */
  readonly key: string;
}

// ---------------------------------------------------------------------------
// Die Bausteine des Schlüssels
// ---------------------------------------------------------------------------

/**
 * Ein Paar `name=wert` — oder nichts.
 *
 * `null` und `undefined` fallen weg, statt als `name=null` zu erscheinen: Ein
 * Feld, das nichts weiß, sagt besser nichts, als etwas zu behaupten. Eine Zahl
 * muss eine nicht negative ganze Zahl sein; alles andere fällt ebenfalls weg,
 * weil ein Minuszeichen oder ein Punkt den Zeichenvorrat verließe.
 */
function pair(name: string, value: string | number | null): string {
  if (value === null) return '';
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? ` ${name}=${value}` : '';
  }
  return ` ${name}=${value.toLowerCase()}`;
}

/** Fügt Wortmarke und Paare zusammen; leere Paare verschwinden rückstandsfrei. */
const key = (mark: string, ...parts: readonly string[]): string => `${mark}${parts.join('')}`;

// ---------------------------------------------------------------------------
// Die Sätze
// ---------------------------------------------------------------------------

/**
 * Was der Benutzer liest.
 *
 * Ausgeschriebene Konstanten und keine Vorlagen mit Platzhaltern. Das ist der
 * zweite der drei Riegel aus dem Kopf dieser Datei: In einen Satz, in den
 * nichts eingesetzt wird, kann auch nichts eingesetzt werden.
 *
 * Alle sagen dasselbe in derselben Reihenfolge: was ist, was Takt deshalb tut,
 * was der Benutzer tun kann. Der letzte Teil fehlt nur dort, wo es nichts zu
 * tun gibt.
 */
const SENTENCES = Object.freeze({
  checksum_mismatch:
    'Der vorhandene Datenbestand passt nicht zu dieser Fassung von Takt: Eine bereits ausgeführte ' +
    'Änderung am Bestand sieht heute anders aus als damals. Takt startet nicht und ändert nichts. ' +
    'Bitte die Fassung von Takt verwenden, mit der zuletzt gearbeitet wurde.',
  database_too_new:
    'Der Datenbestand stammt aus einer neueren Fassung von Takt. Diese Fassung startet nicht, ' +
    'damit sie den Bestand nicht beschädigt. Bitte die neuere Fassung verwenden.',
  database_busy:
    'Der Datenbestand ist gerade von einem anderen Vorgang belegt. Takt startet nicht. ' +
    'Läuft Takt vielleicht schon in einem anderen Fenster?',
  state_unreadable:
    'Der Datenbestand ließ sich nicht lesen. Takt startet nicht und hat nichts geändert. ' +
    'Bitte den Datenträger prüfen und Takt erneut starten.',
  backup_failed:
    'Vor der Änderung am Datenbestand ließ sich keine Sicherungskopie anlegen. Takt startet nicht ' +
    'und hat nichts geändert. Bitte den freien Speicherplatz und die Schreibrechte des ' +
    'Anwendungsdatenverzeichnisses prüfen.',
  migration_failed:
    'Der Datenbestand konnte nicht auf den Stand dieser Fassung gebracht werden. Die begonnene ' +
    'Änderung wurde vollständig zurückgenommen, und eine Sicherungskopie von vorher liegt daneben. ' +
    'Takt startet nicht.',
  no_way_back:
    'Der Datenbestand ließ sich nicht auf eine frühere Fassung zurücknehmen: Zu einer bereits ' +
    'ausgeführten Änderung fehlt der Rückweg. Es wurde nichts geändert.',
  embedded_drift:
    'Die mitgelieferten Änderungen am Datenbestand stimmen nicht mit dem Quelltext überein. ' +
    'Takt startet nicht. Das ist ein Fehler im Bauablauf und keiner des Bestands.',
  store_unopenable:
    'Der Datenbestand ließ sich nicht öffnen. Takt startet nicht. Bitte prüfen, ob das ' +
    'Anwendungsdatenverzeichnis erreichbar und beschreibbar ist.',
  /**
   * Der Wortlaut, mit dem T-132 anfing.
   *
   * Er bleibt für den Fall, für den er richtig ist: Es ist etwas schiefgegangen,
   * und niemand kann sagen was. Der Unterschied zu vorher steht nicht im Satz,
   * sondern daneben — `key` trägt jetzt Fehlerschlüssel und Ergebniskennzeichen
   * von SQLite, und genau die hätten die Frage vom 2026-09-04 beantwortet.
   */
  unknown: 'Der Datenbestand konnte nicht auf den Stand dieser Fassung gebracht werden. Takt startet nicht.',
});

// ---------------------------------------------------------------------------
// Die Einordnung
// ---------------------------------------------------------------------------

/**
 * Ein Wurf ohne angehängten Grund, so weit einordbar, wie es ohne seine
 * Meldung geht.
 *
 * Das ist der Fall „sonstiger Wurf" aus T-132. Er bekommt trotzdem zwei
 * Angaben mit: den Fehlerschlüssel der Laufzeit und das Ergebniskennzeichen
 * von SQLite. Beide sind Zahlen beziehungsweise Schlüssel aus geschlossenen
 * Vorräten und beantworten in der Praxis die halbe Frage — 5 ist belegt, 11
 * ist beschädigt, 26 ist keine Datenbank, 10 ist ein Ein-/Ausgabefehler.
 */
function reasonOf(error: unknown): MigrationFailureReason {
  const known = migrationFailureReason(error);
  if (known !== null) return known;

  const sqlite = sqliteResultCodeOf(error);
  if (isBusyResultCode(sqlite)) return { kind: 'database_busy', sqlite };
  return { kind: 'unknown', code: errorCodeOf(error), sqlite };
}

/**
 * Der Fehlschlag beim **Migrieren**, in zwei Sätzen.
 *
 * Nimmt den rohen Wurf entgegen und nicht den Grund: Damit gibt es genau eine
 * Stelle, die weiß, wie man aus einem Wurf einen Grund macht, und der Aufrufer
 * in `main.ts` bleibt eine Zeile.
 */
export function describeMigrationFailure(error: unknown): StartupDiagnosis {
  const reason = reasonOf(error);
  switch (reason.kind) {
    case 'checksum_mismatch':
      return {
        sentence: SENTENCES.checksum_mismatch,
        key: key('checksum_mismatch', pair('version', reason.version)),
      };
    case 'database_too_new':
      return {
        sentence: SENTENCES.database_too_new,
        key: key(
          'database_too_new',
          pair('database', reason.database),
          pair('known', reason.known),
        ),
      };
    case 'database_busy':
      return {
        sentence: SENTENCES.database_busy,
        key: key('database_busy', pair('sqlite', reason.sqlite)),
      };
    case 'state_unreadable':
      return {
        sentence: SENTENCES.state_unreadable,
        key: key('state_unreadable', pair('code', reason.code), pair('sqlite', reason.sqlite)),
      };
    case 'backup_failed':
      return {
        sentence: SENTENCES.backup_failed,
        key: key(
          'backup_failed',
          pair('from', reason.from),
          pair('code', reason.code),
          pair('sqlite', reason.sqlite),
        ),
      };
    case 'migration_failed':
      return {
        sentence: SENTENCES.migration_failed,
        key: key(
          'migration_failed',
          pair('version', reason.version),
          pair('direction', reason.direction),
          pair('code', reason.code),
          pair('sqlite', reason.sqlite),
        ),
      };
    case 'no_way_back':
      return {
        sentence: SENTENCES.no_way_back,
        key: key('no_way_back', pair('version', reason.version)),
      };
    case 'embedded_drift':
      return { sentence: SENTENCES.embedded_drift, key: 'embedded_drift' };
    case 'unknown':
      return {
        sentence: SENTENCES.unknown,
        key: key('unknown', pair('code', reason.code), pair('sqlite', reason.sqlite)),
      };
  }
}

/**
 * Der Fehlschlag beim **Öffnen** des Bestands, in zwei Sätzen.
 *
 * Bis T-132 lief dieser Fall an `main.ts` vorbei: `compose()` stand in keiner
 * Klammer. Ein Wurf von dort endete im Auffangnetz des gebündelten Sidecars,
 * das `error.message` nach `stderr` schreibt — und **diese** Meldung kann
 * einen Pfad tragen (`ENOENT: … open '/home/…'`). Der Fall, gegen den B-2.4
 * geschrieben ist, war also ausgerechnet der ungefangene.
 *
 * Zwei Gründe sind hier dieselben wie beim Migrieren und werden auch so
 * benannt: der belegte Bestand und die auseinandergelaufenen eingebetteten
 * Migrationen. Alles Übrige wird `store_unopenable` — ein eigener Schlüssel,
 * weil die Stelle den Unterschied macht: Hier ist noch nichts gelesen worden.
 */
export function describeStoreOpenFailure(error: unknown): StartupDiagnosis {
  const reason = reasonOf(error);
  if (reason.kind === 'database_busy' || reason.kind === 'embedded_drift') {
    return describeMigrationFailure(error);
  }
  const code = 'code' in reason ? reason.code : null;
  const sqlite = 'sqlite' in reason ? reason.sqlite : null;
  return {
    sentence: SENTENCES.store_unopenable,
    key: key('store_unopenable', pair('code', code), pair('sqlite', sqlite)),
  };
}

// ---------------------------------------------------------------------------
// Der Schritt selbst
// ---------------------------------------------------------------------------

/** Was der Migrationsschritt vom Läufer braucht — und sonst nichts. */
export type MigrationStep = Pick<MigrationRunnerPort, 'state' | 'migrateToLatest'>;

/**
 * Bringt den Bestand auf den Stand dieser Fassung und **sagt, wenn nicht**.
 *
 * Liefert `true`, wenn der Dienst weiterlaufen darf. Bei `false` hat der
 * Aufrufer bereits alles im Protokoll stehen, was sagbar ist, und muss nur noch
 * beenden — ein Dienst auf einem Schema, das er nicht kennt, schreibt in eine
 * Abrechnung.
 *
 * Der Schritt steht hier und nicht in `main.ts`, damit er **ohne laufenden
 * Dienst** prüfbar ist: Er nimmt zwei Schnittstellen entgegen und fasst nichts
 * an, was es nur zur Laufzeit gibt.
 */
export async function bringDatabaseUpToDate(
  migrations: MigrationStep,
  logger: Logger,
): Promise<boolean> {
  try {
    const state = await migrations.state();
    if (state.kind === 'pending') {
      logger.lifecycle(
        'info',
        `Der Bestand wird von Fassung ${state.from} auf ${state.to} gebracht.`,
        key('migration_pending', pair('from', state.from), pair('to', state.to)),
      );
    }

    const migrated = await migrations.migrateToLatest();
    if (migrated.from !== migrated.to) {
      logger.lifecycle(
        'info',
        migrated.backup === null
          ? `Bestand auf Fassung ${migrated.to} gebracht.`
          : `Bestand auf Fassung ${migrated.to} gebracht. Eine Sicherungskopie liegt daneben.`,
        key(
          'migration_done',
          pair('from', migrated.from),
          pair('to', migrated.to),
          pair('backup', migrated.backup === null ? 'no' : 'yes'),
        ),
      );
    }
    return true;
  } catch (error) {
    const diagnosis = describeMigrationFailure(error);
    logger.lifecycle('error', diagnosis.sentence, diagnosis.key);
    return false;
  }
}
