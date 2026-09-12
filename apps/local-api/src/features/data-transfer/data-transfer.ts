/**
 * Takt — die vollständige Datensicherung (A-20.1 bis A-20.6, A-24.7).
 *
 * ===========================================================================
 * Was hier liegt und was nebenan
 * ===========================================================================
 *
 * Hier: das **eigene** Archiv. Es ist verlustfrei und **ersetzt** beim Einlesen
 * den Bestand. Nebenan in `foreign.ts`: die Fremdimporte, die ihn **ergänzen**
 * (A-20.7). Das ist der Schnitt, und er war schon vor dem Umbau ausgeschrieben —
 * an der Formatkennung, an der Schemafassung und daran, daß nur diese Datei
 * `replaceAll` ruft.
 *
 * **Die Fassungsprüfung steht bei den Daten, über die sie urteilt.**
 * `parseArchive` liest 1 bis {@link DATA_ARCHIVE_VERSION} und weist alles andere
 * ab — nicht geraten, nicht gerettet. Ein ungültiges Archiv verändert nichts,
 * und das hängt daran, daß die Prüfung **vor** der Transaktion vollständig
 * durchläuft. Sie von `importDataArchive` zu trennen hieße, eine Zusage von
 * ihrem Gegenstand zu trennen.
 *
 * ===========================================================================
 * Was in dieser Datei steht, ist der lesbarste Bestand des ganzen Erzeugnisses
 * ===========================================================================
 *
 * Eine Sicherung nach A-20 enthält **mehr** lesbare Kundendaten als jeder
 * Abrechnungsexport: interne Vermerke, Fristen, Anhänge samt Bildkopien. Base64
 * ist auch hier keine Verschlüsselung. Wer an dieser Datei etwas ergänzt,
 * ergänzt es an der Fläche mit der größten Datenmenge.
 */

import {
  IMAGE_SIGNATURE_BYTES,
  MAX_ATTACHMENT_IMAGE_BYTES,
  MAX_EMAIL_ATTACHMENT_BYTES,
  decodedBase64ByteLength,
  imageMediaTypeOf,
  taktError,
  type Timestamp,
} from '@takt/domain';
import { DATA_ARCHIVE_TABLES } from '@takt/storage';
import type { ArchiveRow, ArchiveScalar, DataArchiveTables } from '@takt/storage';

import { DATA_ARCHIVE_MAX_BODY_BYTES } from '../../config.ts';
import type { AppContext, UseCaseResult } from '../../context.ts';

export const DATA_ARCHIVE_FORMAT = 'de.supertakt.data-archive' as const;

/**
 * Die Schemafassung des eigenen Archivs.
 *
 * ===========================================================================
 * Fassung 6 (T-301, A-19.34, A-A-90) — die übernommenen Dateien reisen mit
 * ===========================================================================
 *
 * Neu gegenüber 5 ist **ein** Feld: `data.files`, eine Liste aus Name und
 * Base64 für jede aus einer E-Mail übernommene Datei (A-19.23). Sonst nichts.
 *
 * **Warum das eine Fassung kostet und `origin` daneben keine.** Die vier
 * Spalten aus Migration 0023 kamen ohne Fassungssprung hinein, weil „Feld
 * fehlt" und `user`/`0` **dieselbe Aussage** sind: In einer Fassung ohne diese
 * Spalten konnte ein E-Mail-Anhang gar nicht entstehen. Hier liegt es anders.
 * Ein Archiv der Fassung 5 kann sehr wohl Zeilen mit `origin = 'email'`
 * tragen — nur eben ohne die Bytes dahinter. „Feld fehlt" heißt dort **nicht**
 * „es gab nichts", sondern „es gab etwas und es ist nicht hier". Genau diesen
 * Unterschied trägt eine Fassungsnummer, und genau deshalb bekommt er eine.
 *
 * **Die alte Richtung ist die interessante.** Fassungen 1 bis 5 bleiben
 * lesbar; was jede von ihnen nach dieser Änderung erlebt, steht bei
 * {@link parseArchive}. Umgekehrt weist eine ältere Anwendung ein Archiv der
 * Fassung 6 **ab** — sie liest 1 bis 5 —, und das ist die richtige Richtung:
 * Sie könnte mit den Dateien nichts anfangen und würde Anhänge einspielen,
 * deren Bytes sie wegwirft.
 */
export const DATA_ARCHIVE_VERSION = 6 as const;

/** Die Fassungen, die eingelesen werden. Alles andere wird abgewiesen, nicht geraten. */
const READABLE_VERSIONS = Object.freeze([1, 2, 3, 4, 5, 6]);

/** Die Fassungen **ohne** `data.files` — sie kennen die Bytes der Anhänge nicht. */
const VERSIONS_WITHOUT_FILES = Object.freeze([1, 2, 3, 4, 5]);

export interface ArchivedImage {
  readonly name: string;
  readonly mediaType: string;
  readonly base64: string;
}

/**
 * Eine aus einer E-Mail übernommene Datei **samt Bytes** (A-19.34, Fassung 6).
 *
 * Zwei Felder, und das fehlende dritte ist Inhalt: **kein `mediaType`.**
 * {@link ArchivedImage} führt einen, weil dort die Kopfsignatur gemessen und
 * gegen die Endung gehalten wird — eine als `.png` benannte `.exe` ist dort
 * der Regelfall. Hier gibt es nichts zu messen: Was für eine Datei das ist,
 * entscheidet in diesem Bestand niemand (A-A-88). Der Rumpf einer übernommenen
 * Datei ist ein Bytefeld und kein Format.
 *
 * `name` ist der **erzeugte** Name (`<32 Hexziffern>[.<endung>]`) und nicht der
 * Pfad. Der Pfad im Archiv wäre der des Quellrechners und dort, wo die
 * Sicherung ankommt, sicher falsch — das Einspielen setzt ihn deshalb neu
 * (A-19.34: „auf einem anderen Rechner eingespielt").
 */
export interface ArchivedFile {
  readonly name: string;
  readonly base64: string;
}

export interface TaktDataArchive {
  readonly format: typeof DATA_ARCHIVE_FORMAT;
  readonly schemaVersion: typeof DATA_ARCHIVE_VERSION;
  readonly createdAt: Timestamp;
  readonly generator: 'Takt';
  readonly data: {
    readonly tables: DataArchiveTables;
    readonly images: readonly ArchivedImage[];
    /** Neu in Fassung 6. Bei einem eingelesenen Archiv der Fassungen 1 bis 5 leer. */
    readonly files: readonly ArchivedFile[];
  };
  readonly warnings: readonly string[];
}

export interface ImportSummary {
  readonly source: 'takt' | 'todoist' | 'super-productivity';
  readonly todos: number;
  readonly projects: number;
  readonly sections: number;
  readonly tags: number;
  readonly timeEntries: number;
  readonly images: number;
  /** Wie viele aus E-Mails übernommene Dateien zurückgeschrieben wurden (A-19.34). */
  readonly files: number;
  readonly warnings: readonly string[];
}

/**
 * Ein Objekt, das keine Liste ist — sonst `null`.
 *
 * Ausgeführt, weil `foreign.ts` und `super-productivity-time.ts` dieselbe Prüfung
 * brauchen und sie bis T-257 **dreimal** im Bestand stand. Sie gehört hierher,
 * weil hier die Datei liegt, die einen fremden JSON-Rumpf als erstes anfaßt.
 */
export const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const ARCHIVED_IMAGE_NAME = /^[0-9a-f]{32}\.(?:png|jpg|gif|webp)$/;
/**
 * Die Form eines Dateinamens im Archiv — zeichengleich zu
 * `GENERATED_FILE_NAME_SHAPE` im Ablageadapter (A-A-78).
 *
 * Sie steht hier ein zweites Mal, und das ist kein Versehen: Der Name kommt aus
 * einer **fremden Datei**, und diese Prüfung läuft, **bevor** ein Byte den
 * Adapter erreicht — dieselbe Bauart wie {@link ARCHIVED_IMAGE_NAME} daneben.
 * Der Adapter prüft trotzdem noch einmal; eine Zusage, die vom Aufrufer
 * abhängt, ist eine Erwartung.
 */
const ARCHIVED_FILE_NAME = /^[0-9a-f]{32}(?:\.[a-z0-9]{1,16})?$/;

/**
 * Wie viele übernommene Dateien ein Archiv höchstens nennt.
 *
 * Dieselbe Zahl wie bei den Bildkopien, und sie ist **nicht** die wirksame
 * Grenze: Die Rumpfgrenze der Route ({@link DATA_ARCHIVE_MAX_BODY_BYTES})
 * greift lange vorher. Sie steht hier als Boden gegen eine Liste, die jemand
 * aus leeren Namen baut, und damit die Schleife darunter eine bekannte Länge
 * hat.
 */
const MAX_ARCHIVED_FILES = 10_000;
const IMAGE_EXTENSION: Readonly<Record<string, string>> = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
});

function validBase64(value: string): boolean {
  if (value.length === 0) return true;
  if (value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    return false;
  }
  return Buffer.from(value, 'base64').toString('base64') === value;
}

function isScalar(value: unknown): value is ArchiveScalar {
  return value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

/**
 * Liest und prüft ein Archiv — vollständig, **vor** jeder Transaktion.
 *
 * ===========================================================================
 * Was ein Archiv der Fassungen 1 bis 6 nach A-19.34 erlebt — je Fassung ein Satz
 * ===========================================================================
 *
 *  - **Fassung 1** wird gelesen; sie kennt weder Darstellung noch Leistungsfrage
 *    noch Inaktivität noch Anhänge aus E-Mails, bekommt für all das die
 *    Vorgaben und trägt daher **keine** Zeile, der eine Datei fehlen könnte.
 *  - **Fassung 2** dasselbe, nur mit bereits vorhandener Darstellung.
 *  - **Fassung 3** dasselbe, nur mit bereits vorhandener Leistungsfrage.
 *  - **Fassung 4** dasselbe, nur mit bereits vorhandener Inaktivitätserkennung;
 *    `timer_idle` kommt hier zum ersten Mal aus dem Archiv statt aus der Vorgabe.
 *  - **Fassung 5** ist die einzige, bei der etwas fehlen **kann**: Sie kann
 *    Zeilen mit `origin = 'email'` tragen — die vier Spalten kamen ohne
 *    Fassungssprung hinein —, aber nie die Bytes dazu. Ihre Anhänge entstehen
 *    wieder, ihre Dateien nur, wenn sie ohnehin auf diesem Rechner liegen; was
 *    fehlt, **sagt das Einspielen mit einer Zahl** (A-19.15, nicht still).
 *  - **Fassung 6** trägt die Bytes und ist die einzige, bei der A-19.34
 *    vollständig aufgeht.
 *
 * Alles andere — 0, 7, `"6"`, fehlend — wird **abgewiesen und nicht geraten**.
 */
function parseArchive(value: unknown): UseCaseResult<TaktDataArchive> {
  const root = record(value);
  const version = root?.['schemaVersion'];
  if (
    root === null ||
    root['format'] !== DATA_ARCHIVE_FORMAT ||
    typeof version !== 'number' ||
    !READABLE_VERSIONS.includes(version) ||
    root['generator'] !== 'Takt'
  ) {
    return { ok: false, error: taktError('validation_error', 'Die Datei ist kein unterstütztes SuperTakt-Datenarchiv der Fassung 1 bis 6.') };
  }
  const data = record(root['data']);
  const rawTables = record(data?.['tables']);
  const rawImages = data?.['images'];
  if (data === null || rawTables === null || !Array.isArray(rawImages)) {
    return { ok: false, error: taktError('validation_error', 'Das SuperTakt-Datenarchiv ist unvollständig.') };
  }

  /*
   * `data.files` ist neu in Fassung 6 (A-19.34).
   *
   * Eine Fassung vor 6 darf die Liste **nicht** führen. Sie stillschweigend zu
   * übergehen wäre der bequemere Weg und der falsche: Ein Archiv, das seine
   * Fassung mit 5 angibt und Dateien mitbringt, behauptet zwei Dinge, von denen
   * eines nicht stimmt — und ein Einspielweg, der sich in einem solchen Fall
   * für eine Auslegung entscheidet, rät. Eine **leere** Liste ist zulässig; sie
   * behauptet nichts.
   */
  const rawFiles = data['files'];
  const declaresFiles = rawFiles !== undefined && !(Array.isArray(rawFiles) && rawFiles.length === 0);
  if (VERSIONS_WITHOUT_FILES.includes(version) && declaresFiles) {
    return { ok: false, error: taktError('validation_error', `Ein SuperTakt-Datenarchiv der Fassung ${version} kann keine übernommenen Dateien enthalten.`) };
  }
  if (version === DATA_ARCHIVE_VERSION && !Array.isArray(rawFiles)) {
    return { ok: false, error: taktError('validation_error', 'Das SuperTakt-Datenarchiv ist unvollständig.') };
  }

  const tables = {} as Record<(typeof DATA_ARCHIVE_TABLES)[number], readonly ArchiveRow[]>;
  for (const table of DATA_ARCHIVE_TABLES) {
    const rows = table === 'timer_idle' && version <= 3 ? [] : rawTables[table];
    if (!Array.isArray(rows) || rows.length > 250_000) {
      return { ok: false, error: taktError('validation_error', `Die Tabelle „${table}“ fehlt oder ist zu groß.`) };
    }
    const checked: ArchiveRow[] = [];
    for (const valueRow of rows) {
      const item = record(valueRow);
      if (item === null || !Object.values(item).every(isScalar)) {
        return { ok: false, error: taktError('validation_error', `Die Tabelle „${table}“ enthält eine ungültige Zeile.`) };
      }
      // Defaults are added only for fields missing from the declared version.
      let upgraded = item;
      if (table === 'todo_attachment') {
        /*
         * Die vier Spalten aus Migration 0023 (A-A-84, A-A-97) — **ohne**
         * Fassungsvergleich, und zwar aus demselben Grund wie bei
         * `last_version_check_at` weiter unten: Es gibt nichts zu raten.
         *
         * Ein Archiv, das diese Felder nicht führt, stammt aus einer Fassung,
         * in der ein Anhang aus einer E-Mail gar nicht entstehen **konnte**.
         * Sein Fehlen und der Wert `user` sind dieselbe Aussage, nicht zwei.
         * Dasselbe für `rebuilt`: Wo es keinen Nachbau gab, ist `0` keine
         * Annahme, sondern die Tatsache.
         *
         * Genau hier verläuft die Grenze zu `idle_keep_timer_running` daneben,
         * das sehr wohl an der Fassungsnummer hängt: Dort ist „Feld fehlt"
         * nicht dasselbe wie „Feld ist 0", und wer den Unterschied nicht kennt,
         * rät. Deshalb wird eine **unbekannte** Fassung weiterhin abgewiesen
         * und nicht geraten.
         *
         * `hasOwn` und keine Zuweisung: Ein vorhandener Wert wird nicht
         * überschrieben — auch nicht in einem Archiv, das ihn wider Erwarten
         * trägt.
         */
        if (!Object.hasOwn(upgraded, 'origin')) upgraded = { ...upgraded, origin: 'user' };
        if (!Object.hasOwn(upgraded, 'origin_sender')) upgraded = { ...upgraded, origin_sender: null };
        if (!Object.hasOwn(upgraded, 'display_name')) upgraded = { ...upgraded, display_name: null };
        if (!Object.hasOwn(upgraded, 'rebuilt')) upgraded = { ...upgraded, rebuilt: 0 };
      }
      if (table === 'app_setting') {
        /*
         * `last_version_check_at` (Migration 0022, T-279) — die **einzige**
         * Ergänzung dieser Liste, die an keine Fassungsnummer geknüpft ist.
         *
         * Jede andere Zeile hier fragt nach der erklärten Fassung, weil sie es
         * muß: Bei `idle_keep_timer_running` ist „Feld fehlt" nicht dasselbe
         * wie „Feld ist 0", und wer den Unterschied nicht kennt, rät. Genau
         * dafür ist die Fassungsnummer da, und genau deshalb wird eine
         * unbekannte abgewiesen und nicht geraten.
         *
         * Bei dieser Spalte fallen die beiden Fälle zusammen: Sie ist
         * NULL-fähig, und **NULL heißt „noch nie gefragt"** — dieselbe Aussage
         * wie „das Archiv weiß nichts davon". Es gibt hier nichts zu raten, und
         * deshalb braucht die Ergänzung keine neue `schemaVersion`. Ein Archiv
         * der Fassung 5 ohne dieses Feld und eines mit `null` darin sind
         * derselbe Bestand.
         *
         * Deshalb `hasOwn` statt eines Fassungsvergleichs: Ein vorhandener Wert
         * wird **nicht** überschrieben — auch nicht in einem alten Archiv, das
         * ihn wider Erwarten trägt.
         *
         * Die Folge ist bewußt die konservative Richtung: Fehlt der Wert, gilt
         * „noch nie gefragt", und der nächste Start fragt einmal. Er kann
         * niemals dazu führen, daß **öfter** gefragt wird, als der Boden
         * zuläßt.
         */
        if (!Object.hasOwn(upgraded, 'last_version_check_at')) {
          upgraded = { ...upgraded, last_version_check_at: null };
        }
        /*
         * **`< 5` und nicht `!== 5`.** Bis T-301 stand hier ein Vergleich auf
         * Ungleichheit, und er war so lange richtig, wie 5 die höchste Fassung
         * war. Mit der 6 hätte er die Spalte in einem Archiv **überschrieben**,
         * das sie ordentlich führt — der Benutzer bekäme nach dem Einspielen
         * eine Einstellung zurück, die er nie gesetzt hat.
         *
         * Das ist die teuerste Sorte Fehler beim Heben einer Fassungsnummer,
         * und sie liegt immer in der **alten** Richtung. Jeder Vergleich in
         * dieser Schleife steht deshalb als `<` oder `<=`, nie als `!==`.
         */
        if (version < 5) upgraded = { ...upgraded, idle_keep_timer_running: 1 };
        if (version <= 3) {
          upgraded = { ...upgraded, idle_detection_enabled: 1, idle_threshold_minutes: 5 };
        }
        if (version <= 1) {
          upgraded = { ...upgraded, design_theme: 'classic', density: 'comfortable' };
        }
        if (version <= 2) {
          upgraded = { ...upgraded, prompt_on_timer_stop: 1 };
        }
      }
      checked.push(upgraded as ArchiveRow);
    }
    tables[table] = checked;
  }

  const images: ArchivedImage[] = [];
  if (rawImages.length > 10_000) {
    return { ok: false, error: taktError('validation_error', 'Das SuperTakt-Datenarchiv enthält zu viele Bildanhänge.') };
  }
  for (const rawImage of rawImages) {
    const image = record(rawImage);
    if (
      image === null || typeof image['name'] !== 'string' ||
      typeof image['mediaType'] !== 'string' || typeof image['base64'] !== 'string' ||
      !validBase64(image['base64'])
    ) {
      return { ok: false, error: taktError('validation_error', 'Das Datenarchiv enthält einen ungültigen Bildanhang.') };
    }
    const bytes = Buffer.from(image['base64'], 'base64');
    const detected = imageMediaTypeOf(bytes.subarray(0, IMAGE_SIGNATURE_BYTES));
    const extension = IMAGE_EXTENSION[image['mediaType']];
    if (
      bytes.byteLength === 0 || bytes.byteLength > MAX_ATTACHMENT_IMAGE_BYTES ||
      detected !== image['mediaType'] || extension === undefined ||
      !ARCHIVED_IMAGE_NAME.test(image['name']) || !image['name'].endsWith(`.${extension}`)
    ) {
      return { ok: false, error: taktError('validation_error', 'Das Datenarchiv enthält einen ungültigen Bildanhang.') };
    }
    images.push({ name: image['name'], mediaType: image['mediaType'], base64: image['base64'] });
  }

  /*
   * Die übernommenen Dateien (A-19.34, Fassung 6).
   *
   * Drei Unterschiede zur Schleife darüber, und jeder hat einen Grund:
   *
   *  1. **Keine Kopfsignatur, kein `mediaType`.** Was für eine Datei das ist,
   *     entscheidet in diesem Bestand niemand (A-A-88). Eine Positivliste wäre
   *     hier keine Sicherheit, sondern eine Behauptung über fremde Bytes.
   *  2. **Die Länge wird gerechnet, bevor dekodiert wird** (A-A-81,
   *     `decodedBase64ByteLength`). Eine Zeichenkette aus 200 MB Base64 wird
   *     nicht erst zu 150 MB Puffer, um danach abgewiesen zu werden.
   *  3. **Namen müssen eindeutig sein.** Zwei Einträge desselben Namens sind
   *     zwei Aussagen über dieselbe Datei; welche gilt, wäre eine Frage der
   *     Reihenfolge — und die entscheidet hier nichts.
   */
  const files: ArchivedFile[] = [];
  const fileNames = new Set<string>();
  if (Array.isArray(rawFiles)) {
    if (rawFiles.length > MAX_ARCHIVED_FILES) {
      return { ok: false, error: taktError('validation_error', 'Das SuperTakt-Datenarchiv enthält zu viele übernommene Dateien.') };
    }
    for (const rawFile of rawFiles) {
      const file = record(rawFile);
      if (file === null || typeof file['name'] !== 'string' || typeof file['base64'] !== 'string') {
        return { ok: false, error: taktError('validation_error', 'Das Datenarchiv enthält eine ungültige übernommene Datei.') };
      }
      const declared = decodedBase64ByteLength(file['base64']);
      if (
        declared === null || declared === 0 || declared > MAX_EMAIL_ATTACHMENT_BYTES ||
        !ARCHIVED_FILE_NAME.test(file['name']) || fileNames.has(file['name']) ||
        !validBase64(file['base64'])
      ) {
        return { ok: false, error: taktError('validation_error', 'Das Datenarchiv enthält eine ungültige übernommene Datei.') };
      }
      fileNames.add(file['name']);
      files.push({ name: file['name'], base64: file['base64'] });
    }
  }

  return {
    ok: true,
    value: {
      format: DATA_ARCHIVE_FORMAT,
      schemaVersion: DATA_ARCHIVE_VERSION,
      createdAt: typeof root['createdAt'] === 'string' ? root['createdAt'] as Timestamp : '1970-01-01T00:00:00Z' as Timestamp,
      generator: 'Takt',
      data: { tables, images, files },
      warnings: Array.isArray(root['warnings']) ? root['warnings'].filter((item): item is string => typeof item === 'string') : [],
    },
  };
}

/**
 * Der letzte Namensbestandteil eines `target` — ohne `node:path`, weil der Pfad
 * aus einem **fremden** Archiv stammt und von einem anderen Betriebssystem sein
 * kann als dieses (`basename` unter POSIX zerlegt `C:\\…\\x.pdf` nicht).
 *
 * Der so gewonnene Name ist eine **Behauptung** und wird nirgends benutzt, ohne
 * durch {@link ARCHIVED_FILE_NAME} und danach durch den Ablageadapter zu gehen.
 */
function lastSegmentOf(target: string): string {
  return target.slice(Math.max(target.lastIndexOf('/'), target.lastIndexOf('\\')) + 1);
}

/** Ist diese Zeile eine aus einer E-Mail übernommene **Datei**? (A-19.23) */
function isEmailFileRow(row: ArchiveRow): boolean {
  return row['kind'] === 'file' && row['origin'] === 'email' && typeof row['target'] === 'string';
}

/**
 * Die vollständige Sicherung (A-20.1 bis A-20.6, A-19.34).
 *
 * ===========================================================================
 * Die Bytes reisen mit — und was das kostet, steht in der Sicherung selbst
 * ===========================================================================
 *
 * Bis T-301 nahm diese Funktion die **Zeile** eines E-Mail-Anhangs mit und die
 * **Datei** nicht; sie sagte es als Warnung. Der Auftraggeber hat A-A-90 gegen
 * diesen Weg entschieden, und der Grund war eine Messung: Ein Bildanhang reiste
 * längst samt Bytes. Dieselbe Handlung des Benutzers — „sichern" — hatte für
 * ein Bild und für eine Rechnung zwei verschiedene Ergebnisse.
 *
 * Geblieben ist die Lautstärke, nur mit anderem Inhalt: Diese Sicherung kann
 * **größer werden, als das Einspielen annimmt**, und wo das eintritt, sagt sie
 * es mit beiden Zahlen. Ein Archiv, das sich nicht mehr einspielen läßt, bricht
 * A-20.4 — und der schlechteste Zeitpunkt, das zu erfahren, ist der Tag, an dem
 * man es braucht.
 */
export async function exportDataArchive(context: AppContext): Promise<TaktDataArchive> {
  return context.transactions.inTransaction(async (unit) => {
    const tables = await unit.dataArchive.readAll();
    const images: ArchivedImage[] = [];
    const files: ArchivedFile[] = [];
    const warnings: string[] = [];
    /*
     * Die Länge der eingebetteten Base64-Ketten, mitgezählt.
     *
     * Sie ist eine **untere Schranke** für die Größe des Rumpfs beim
     * Einspielen: Base64 braucht in JSON keine Maskierung, jedes Zeichen ist
     * genau ein Byte. Was dazukommt — Tabellen, Namen, Rahmen — macht den Rumpf
     * nur größer, nie kleiner. Deshalb kann die Warnung unten nicht falsch
     * alarmieren; sie kann höchstens schweigen, wo es knapp wird, und dann
     * spricht die Tür des Einspielens mit einem sauberen 413.
     */
    let embeddedBytes = 0;
    /** Welche Datei ist schon im Archiv? Zwei Zeilen können auf dieselbe zeigen. */
    const seenFiles = new Set<string>();
    let missingFiles = 0;

    for (const row of tables.todo_attachment) {
      if (isEmailFileRow(row)) {
        /*
         * **A-19.34.** Gelesen wird über den Blob-Port, und der prüft den
         * `target` an derselben Form zurück, in der er ihn erzeugt hat. Ohne
         * diese Prüfung wäre die Datensicherung ein Lesewerkzeug für jede
         * Datei, die der Benutzer lesen darf — ein `target`, das jemand auf
         * `takt.db` gesetzt hat, käme base64-kodiert wieder heraus (VG-1, VG-3).
         */
        const target = row['target'] as string;
        if (seenFiles.has(target)) continue;
        seenFiles.add(target);
        const result = await context.attachmentBlobs.readEmailFile(target);
        if (!result.ok) {
          /*
           * Gezählt, nicht aufgezählt: Der Anzeigename ist fremder Text und der
           * Pfad eine Ortsangabe. Beides in einer Warnung zu wiederholen bringt
           * dem Leser nichts, was die Zahl nicht sagt — und der Grund (`weg`,
           * `zu groß`) gehört ins Protokoll, nicht in eine Datei, die der
           * Benutzer herumreicht.
           */
          missingFiles += 1;
          continue;
        }
        const base64 = Buffer.from(result.data).toString('base64');
        embeddedBytes += base64.length;
        files.push({ name: result.name, base64 });
        continue;
      }
      if (row['kind'] !== 'image' || typeof row['target'] !== 'string') continue;
      const result = await context.attachmentBlobs.readImage(row['target']);
      if (!result.ok) {
        warnings.push(`Die Bildkopie ${row['target']} konnte nicht in die Sicherung aufgenommen werden (${result.reason}).`);
        continue;
      }
      const base64 = Buffer.from(result.data).toString('base64');
      embeddedBytes += base64.length;
      images.push({ name: row['target'], mediaType: result.mediaType, base64 });
    }

    if (missingFiles > 0) {
      warnings.push(
        `${missingFiles} aus E-Mails übernommene Datei${missingFiles === 1 ? '' : 'en'} ` +
          `ließ${missingFiles === 1 ? '' : 'en'} sich nicht lesen und fehl${missingFiles === 1 ? 't' : 'en'} ` +
          'in dieser Sicherung. Die zugehörigen Anhänge bleiben erhalten; die Dateien dahinter sind ' +
          'nach dem Einspielen nicht vorhanden.',
      );
    }
    const oversize = archiveOversizeWarning(embeddedBytes);
    if (oversize !== null) warnings.push(oversize);

    return {
      format: DATA_ARCHIVE_FORMAT,
      schemaVersion: DATA_ARCHIVE_VERSION,
      createdAt: context.clock.now(),
      generator: 'Takt',
      data: { tables, images, files },
      warnings,
    };
  });
}

/** Eine Byteangabe, wie ein Mensch sie liest. Eine Stelle, deutsches Komma. */
function megabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Der Satz, den eine Sicherung über sich selbst sagt, wenn sie größer ist, als
 * das Einspielen annimmt (A-20.4) — oder `null`, wenn sie es nicht ist.
 *
 * ---------------------------------------------------------------------------
 * Warum das eine eigene Funktion ist und keine Zeile in der Schleife
 * ---------------------------------------------------------------------------
 *
 * Weil die Schwelle sonst nur mit einem Prüffall zu erreichen wäre, der
 * **wirklich** 256 MiB baut. Eine Zusage, deren Prüfung eine Viertelstunde
 * kostet, wird nicht geprüft. So ist sie eine reine Funktion über eine Zahl,
 * und der teure Teil — daß `embeddedBytes` wirklich mitzählt — ist am
 * gemessenen Verhältnis von Nutzlast zu Archivgröße abzulesen.
 *
 * ---------------------------------------------------------------------------
 * Warum „mindestens"
 * ---------------------------------------------------------------------------
 *
 * Gezählt wird die Länge der eingebetteten Base64-Ketten. Sie ist eine **untere
 * Schranke** für den Rumpf: Base64 braucht in JSON keine Maskierung, jedes
 * Zeichen ist genau ein Byte, und Tabellen, Namen und Rahmen kommen obendrauf.
 * Damit kann dieser Satz nicht falsch alarmieren — er kann nur schweigen, wo es
 * knapp wird, und dann spricht die Tür des Einspielens mit einem 413.
 */
export function archiveOversizeWarning(embeddedBytes: number): string | null {
  if (embeddedBytes <= DATA_ARCHIVE_MAX_BODY_BYTES) return null;
  return (
    `Diese Sicherung ist mindestens ${megabytes(embeddedBytes)} groß und damit größer als die ` +
    `${megabytes(DATA_ARCHIVE_MAX_BODY_BYTES)}, die das Einspielen annimmt. Sie läßt sich in dieser ` +
    'Form nicht wieder einlesen. Bewahren Sie sie auf, entfernen Sie nicht mehr benötigte Anhänge ' +
    'und erzeugen Sie danach eine neue.'
  );
}

/**
 * Spielt ein Archiv ein — es **ersetzt** den Bestand (A-20.5).
 *
 * ===========================================================================
 * Der Pfad einer übernommenen Datei gehört dem Rechner, nicht dem Archiv
 * ===========================================================================
 *
 * `todo_attachment.target` trägt für eine E-Mail-Datei den **vollen Pfad**
 * (A-19.26: sie ist ein gewöhnlicher Dateianhang und wird über den
 * Öffnen-Befehl der Hülle geöffnet). Im Archiv ist das der Pfad des
 * **Quellrechners** — `C:\\Users\\anna\\…` —, und dort, wo die Sicherung
 * ankommt, ist er falsch.
 *
 * Deshalb wird er beim Einspielen **neu gesetzt**, aus dem Namen im Archiv und
 * dem hiesigen Ordner. Das ist der eigentliche Inhalt von A-19.34: Ohne diesen
 * Schritt lägen die Bytes richtig auf der Platte und jeder Anhang zeigte
 * trotzdem auf einen Rechner, den es hier nicht gibt.
 *
 * **Auch dann, wenn die Bytes fehlen** (Archive der Fassungen 1 bis 5). Den
 * fremden Pfad stehen zu lassen hieße, dem Benutzer in der Rückfrage vor dem
 * Öffnen die Ortsangabe eines anderen Rechners vorzulesen (A-A-6). Der hiesige
 * Pfad mit fehlender Datei ist der ehrlichere Zustand — und genau der, den
 * A-19.15 an Ort und Stelle anzeigt.
 */
export async function importDataArchive(
  context: AppContext,
  raw: unknown,
): Promise<UseCaseResult<ImportSummary>> {
  const parsed = parseArchive(raw);
  if (!parsed.ok) return parsed;

  const warnings = [...parsed.value.warnings];

  /*
   * Die Pfade umschreiben — **vor** `replaceAll`, und ohne das Dateisystem zu
   * fragen.
   *
   * `emailFilePathOf` rechnet nur; ob die Datei da ist, entscheidet sich zwei
   * Schritte weiter unten. Die Reihenfolge ist Inhalt: Nach `replaceAll` wäre
   * jedes Umschreiben ein zweiter Schreibvorgang auf denselben Zeilen, und ein
   * Abbruch dazwischen hinterließe einen Bestand, dessen Anhänge auf einen
   * fremden Rechner zeigen.
   */
  const referenced = new Set<string>();
  let foreignPaths = 0;
  const tables: DataArchiveTables = {
    ...parsed.value.data.tables,
    todo_attachment: parsed.value.data.tables.todo_attachment.map((row) => {
      if (!isEmailFileRow(row)) return row;
      const name = lastSegmentOf(row['target'] as string);
      const here = ARCHIVED_FILE_NAME.test(name) ? context.attachmentBlobs.emailFilePathOf(name) : null;
      if (here === null) {
        // Kein Anwendungsdatenverzeichnis oder ein Name, den dieser Bestand nie
        // erzeugt hätte. Die Zeile bleibt, wie sie ist — sie zu verändern wäre
        // eine Behauptung über eine Datei, die niemand zuordnen kann.
        foreignPaths += 1;
        return row;
      }
      referenced.add(name);
      return { ...row, target: here };
    }),
  };

  await context.transactions.inTransaction(async (unit) => unit.dataArchive.replaceAll(tables));

  let restoredImages = 0;
  for (const image of parsed.value.data.images) {
    const bytes = Buffer.from(image.base64, 'base64');
    const restored = await context.attachmentBlobs.restoreImage(image.name, bytes);
    if (restored.ok) restoredImages += 1;
    else warnings.push(`Die Bildkopie ${image.name} konnte nicht wiederhergestellt werden (${restored.reason}).`);
  }

  /*
   * Die Dateien zurückschreiben — **nur die, die eine Zeile nennt** (A-A-83).
   *
   * Ein Archiv, das Dateien mitbringt, zu denen kein Anhang gehört, legte sonst
   * Bytes im Anwendungsdatenverzeichnis ab, für die es von der ersten Sekunde
   * an keinen Eigentümer gibt. Das Aufräumen beim Start würde sie später
   * wegräumen — aber „später wieder weg" ist keine Antwort auf „sie wurden
   * geschrieben".
   */
  let restoredFiles = 0;
  let unclaimedFiles = 0;
  let unwritableFiles = 0;
  for (const file of parsed.value.data.files) {
    if (!referenced.has(file.name)) {
      unclaimedFiles += 1;
      continue;
    }
    const bytes = Buffer.from(file.base64, 'base64');
    const restored = await context.attachmentBlobs.restoreEmailFile(file.name, bytes);
    if (restored.ok) restoredFiles += 1;
    // Kein Fehlschlag ist still (T-159) — aber gezählt und nicht aufgezählt:
    // Der erzeugte Name sagt dem Leser nichts, was die Zahl nicht sagt.
    else unwritableFiles += 1;
  }
  if (unwritableFiles > 0) {
    warnings.push(
      `${unwritableFiles} aus E-Mails übernommene Datei${unwritableFiles === 1 ? '' : 'en'} ` +
        `${unwritableFiles === 1 ? 'ließ' : 'ließen'} sich nicht zurückschreiben. Die zugehörigen ` +
        'Anhänge sind vorhanden, die Dateien dahinter nicht.',
    );
  }
  if (unclaimedFiles > 0) {
    warnings.push(
      `${unclaimedFiles} Datei${unclaimedFiles === 1 ? '' : 'en'} aus der Sicherung ` +
        `gehör${unclaimedFiles === 1 ? 't' : 'en'} zu keinem Anhang und wurde${unclaimedFiles === 1 ? '' : 'n'} ` +
        'nicht übernommen.',
    );
  }
  if (foreignPaths > 0) {
    warnings.push(
      `${foreignPaths} ${foreignPaths === 1 ? 'Anhang' : 'Anhänge'} aus E-Mails ` +
        `${foreignPaths === 1 ? 'behält' : 'behalten'} den Dateipfad des Rechners, auf dem die ` +
        `Sicherung entstanden ist, und ${foreignPaths === 1 ? 'lässt' : 'lassen'} sich hier nicht öffnen.`,
    );
  }

  /*
   * **Was fehlt, wird gesagt** (A-19.15, A-20.4).
   *
   * Gefragt wird das Dateisystem und nicht das Archiv, und das ist der
   * Unterschied zwischen einer Auskunft und einer Vermutung: Ein Archiv der
   * Fassung 5, das auf **demselben** Rechner eingespielt wird, verliert gar
   * nichts — seine Dateien liegen noch da, wo sie lagen. Dasselbe Archiv auf
   * einem anderen Rechner verliert alles. Eine Warnung, die an der
   * Fassungsnummer hinge, würde im ersten Fall Alarm schlagen, wo nichts ist,
   * und beide Fälle gleich behandeln, wo sie es nicht sind.
   *
   * Ein Verzeichnisaufruf für die Antwort, unabhängig von der Zahl der Anhänge.
   */
  if (referenced.size > 0) {
    const onDisk = new Set(await context.attachmentBlobs.listEmailFiles());
    let absent = 0;
    for (const name of referenced) if (!onDisk.has(name)) absent += 1;
    if (absent > 0) {
      warnings.push(
        `${absent} der ${referenced.size} aus E-Mails übernommenen Dateien ` +
          `${absent === 1 ? 'fehlt' : 'fehlen'} in dieser Sicherung und ` +
          `${absent === 1 ? 'liegt' : 'liegen'} auch nicht auf diesem Rechner. Die Anhänge sind ` +
          'vorhanden, die Dateien dahinter nicht. Sicherungen ab Fassung 6 enthalten sie.',
      );
    }
  }
  return {
    ok: true,
    value: {
      source: 'takt',
      todos: tables.todo.length,
      projects: tables.pool.length,
      sections: tables.tag_folder.length,
      tags: tables.tag.length,
      timeEntries: tables.time_entry.length,
      images: restoredImages,
      files: restoredFiles,
      warnings,
    },
  };
}


