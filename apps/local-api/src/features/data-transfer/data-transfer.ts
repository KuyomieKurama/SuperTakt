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
  imageMediaTypeOf,
  taktError,
  type Timestamp,
} from '@takt/domain';
import { DATA_ARCHIVE_TABLES } from '@takt/storage';
import type { ArchiveRow, ArchiveScalar, DataArchiveTables } from '@takt/storage';

import type { AppContext, UseCaseResult } from '../../context.ts';

export const DATA_ARCHIVE_FORMAT = 'de.supertakt.data-archive' as const;
export const DATA_ARCHIVE_VERSION = 5 as const;

export interface ArchivedImage {
  readonly name: string;
  readonly mediaType: string;
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

function parseArchive(value: unknown): UseCaseResult<TaktDataArchive> {
  const root = record(value);
  if (
    root === null ||
    root['format'] !== DATA_ARCHIVE_FORMAT ||
    (root['schemaVersion'] !== 1 && root['schemaVersion'] !== 2 && root['schemaVersion'] !== 3 && root['schemaVersion'] !== 4 && root['schemaVersion'] !== DATA_ARCHIVE_VERSION) ||
    root['generator'] !== 'Takt'
  ) {
    return { ok: false, error: taktError('validation_error', 'Die Datei ist kein unterstütztes SuperTakt-Datenarchiv der Fassung 1, 2, 3, 4 oder 5.') };
  }
  const data = record(root['data']);
  const rawTables = record(data?.['tables']);
  const rawImages = data?.['images'];
  if (data === null || rawTables === null || !Array.isArray(rawImages)) {
    return { ok: false, error: taktError('validation_error', 'Das SuperTakt-Datenarchiv ist unvollständig.') };
  }

  const tables = {} as Record<(typeof DATA_ARCHIVE_TABLES)[number], readonly ArchiveRow[]>;
  for (const table of DATA_ARCHIVE_TABLES) {
    const rows = table === 'timer_idle' && (root['schemaVersion'] === 1 || root['schemaVersion'] === 2 || root['schemaVersion'] === 3) ? [] : rawTables[table];
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
        if (root['schemaVersion'] !== 5) upgraded = { ...upgraded, idle_keep_timer_running: 1 };
        if ((root['schemaVersion'] === 1 || root['schemaVersion'] === 2 || root['schemaVersion'] === 3)) {
          upgraded = { ...upgraded, idle_detection_enabled: 1, idle_threshold_minutes: 5 };
        }
        if (root['schemaVersion'] === 1) {
          upgraded = { ...upgraded, design_theme: 'classic', density: 'comfortable' };
        }
        if (root['schemaVersion'] === 1 || root['schemaVersion'] === 2) {
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

  return {
    ok: true,
    value: {
      format: DATA_ARCHIVE_FORMAT,
      schemaVersion: DATA_ARCHIVE_VERSION,
      createdAt: typeof root['createdAt'] === 'string' ? root['createdAt'] as Timestamp : '1970-01-01T00:00:00Z' as Timestamp,
      generator: 'Takt',
      data: { tables, images },
      warnings: Array.isArray(root['warnings']) ? root['warnings'].filter((item): item is string => typeof item === 'string') : [],
    },
  };
}

export async function exportDataArchive(context: AppContext): Promise<TaktDataArchive> {
  return context.transactions.inTransaction(async (unit) => {
    const tables = await unit.dataArchive.readAll();
    const images: ArchivedImage[] = [];
    const warnings: string[] = [];
    for (const row of tables.todo_attachment) {
      if (row['kind'] !== 'image' || typeof row['target'] !== 'string') continue;
      const result = await context.attachmentBlobs.readImage(row['target']);
      if (!result.ok) {
        warnings.push(`Die Bildkopie ${row['target']} konnte nicht in die Sicherung aufgenommen werden (${result.reason}).`);
        continue;
      }
      images.push({
        name: row['target'],
        mediaType: result.mediaType,
        base64: Buffer.from(result.data).toString('base64'),
      });
    }
    return {
      format: DATA_ARCHIVE_FORMAT,
      schemaVersion: DATA_ARCHIVE_VERSION,
      createdAt: context.clock.now(),
      generator: 'Takt',
      data: { tables, images },
      warnings,
    };
  });
}

export async function importDataArchive(
  context: AppContext,
  raw: unknown,
): Promise<UseCaseResult<ImportSummary>> {
  const parsed = parseArchive(raw);
  if (!parsed.ok) return parsed;

  await context.transactions.inTransaction(async (unit) => unit.dataArchive.replaceAll(parsed.value.data.tables));
  const warnings = [...parsed.value.warnings];
  let restoredImages = 0;
  for (const image of parsed.value.data.images) {
    const bytes = Buffer.from(image.base64, 'base64');
    const restored = await context.attachmentBlobs.restoreImage(image.name, bytes);
    if (restored.ok) restoredImages += 1;
    else warnings.push(`Die Bildkopie ${image.name} konnte nicht wiederhergestellt werden (${restored.reason}).`);
  }

  const tables = parsed.value.data.tables;
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
      warnings,
    },
  };
}


