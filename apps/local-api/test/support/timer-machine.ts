import type { Timestamp } from '@takt/domain';
import { openDatabase, type OpenedDatabase } from '@takt/storage';
import type { AppContext } from '../../src/context.ts';

export interface TimerMachine {
  readonly database: OpenedDatabase;
  readonly context: AppContext;
  setClock(value: Timestamp): void;
}

/** Unbenutzte Ports müssen einen neuen Zugriff sichtbar machen. */
function unexpected(port: string): never {
  throw new Error(`Unerwarteter Portaufruf im Timer-Test: ${port}`);
}

/**
 * Eigener SQLite-Bestand mit beweglicher Uhr für Timer-Wiederherstellung.
 * Startzeit, Todos, Lebenszeichen und Recovery-Aufnahme bleiben im Test.
 * Der Aufrufer schließt database; Dateizugriffe sind hier nicht vorgesehen.
 */
export async function createTimerMachine(initial: Timestamp): Promise<TimerMachine> {
  let current = initial;
  const database = openDatabase({ location: ':memory:', now: () => current });
  try {
    await database.migrations.migrateToLatest();
  } catch (error) {
    database.close();
    throw error;
  }
  const context: AppContext = {
    transactions: database.transactions,
    clock: {
      now: () => current,
      monotonicSeconds: () => unexpected('clock.monotonicSeconds'),
    },
    system: {
      windowsUser: () => 'Prüfrechner',
      databasePath: () => unexpected('system.databasePath'),
      databaseFilesTooPermissive: () => unexpected('system.databaseFilesTooPermissive'),
    },
    files: {
      checkExportDirectory: () => unexpected('files.checkExportDirectory'),
      writeFile: () => unexpected('files.writeFile'),
    },
    directories: { describeLocation: () => unexpected('directories.describeLocation') },
    attachmentBlobs: {
      copyImage: () => unexpected('attachmentBlobs.copyImage'),
      readImage: () => unexpected('attachmentBlobs.readImage'),
      restoreImage: () => unexpected('attachmentBlobs.restoreImage'),
      removeImage: () => unexpected('attachmentBlobs.removeImage'),
      listImages: () => unexpected('attachmentBlobs.listImages'),
      imageNameOf: () => unexpected('attachmentBlobs.imageNameOf'),
      imageFolder: () => unexpected('attachmentBlobs.imageFolder'),
      storeEmailFile: () => unexpected('attachmentBlobs.storeEmailFile'),
      removeEmailFile: () => unexpected('attachmentBlobs.removeEmailFile'),
      listEmailFiles: () => unexpected('attachmentBlobs.listEmailFiles'),
      readEmailFile: () => unexpected('attachmentBlobs.readEmailFile'),
      restoreEmailFile: () => unexpected('attachmentBlobs.restoreEmailFile'),
      emailFilePathOf: () => unexpected('attachmentBlobs.emailFilePathOf'),
      emailFileFolder: () => unexpected('attachmentBlobs.emailFileFolder'),
    },
  };
  return { database, context, setClock(value) { current = value; } };
}
