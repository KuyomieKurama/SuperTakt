/**
 * Takt — die Bytes eines Bildanhangs (E-071 Punkt 2 und 3, A-A-15 bis A-A-18).
 *
 * ===========================================================================
 * Warum diese Datei hier liegt und nicht in `packages/storage`
 * ===========================================================================
 *
 * Aus demselben Grund wie `export-directory.ts` eine Datei weiter: Sie ist eine
 * Auskunft über den **Rechner**. Der Ordner, in den sie schreibt, ist das
 * Anwendungsdatenverzeichnis des angemeldeten Benutzers, und wo das liegt,
 * beantwortet `paths.ts` — dieselbe Nachbarschaft wie `token-store.ts` (welche
 * Rechte hat diese Datei) und `session-secret.ts`.
 *
 * Der **Port** steht in `packages/storage/src/ports.ts`, weil ein
 * Anwendungsfall ihn benennt. Der Adapter steht hier, weil er das
 * Betriebssystem fragt.
 *
 * ===========================================================================
 * Vier Zusagen, und jede hat einen gemessenen Grund
 * ===========================================================================
 *
 * **1. Gezählt wird beim Lesen, nicht aus `stat`** (A-A-15). Eine angekündigte
 * Größe ist keine Grenze — dieselbe Begründung wie bei `content-length` in
 * A-V-6, und dort war es ein Befund. Die Datei wird in Blöcken gelesen, und
 * sobald die Summe {@link MAX_ATTACHMENT_IMAGE_BYTES} überschreitet, bricht
 * der Lauf ab: **nichts kopiert, nichts kodiert, nichts weiter gelesen.**
 *
 * **2. Entschieden wird an der Kopfsignatur**, nicht an der Endung (A-A-16).
 * Eine als `.png` benannte `.exe` ist der Regelfall und nicht die Ausnahme.
 * Die Positivliste steht in `packages/domain/src/attachment.ts` — hier steht
 * nur, wann sie gefragt wird.
 *
 * **3. Der Name der Kopie wird erzeugt** (A-A-17). Nie der Name der Quelle:
 * Der ist fremder Text, er landete als Pfadbestandteil im Dateisystem, und er
 * verriete im Zweifel etwas über den Kunden. Erzeugt wird er aus derselben
 * Quelle wie jede Kennung dieses Bestands.
 *
 * **4. Verzeichnis `0700`, Datei `0600`, ausdrücklich gesetzt** (E-018,
 * A-A-17). Nicht der `umask` überlassen — dieselbe Regel wie für `takt.db` und
 * die Tokendatei, und aus demselben Grund: `umask` ist eine Voreinstellung des
 * Prozesses und keine Zusage.
 *
 * ===========================================================================
 * Was hier **nicht** geschieht
 * ===========================================================================
 *
 *  - **Nichts wird geöffnet.** Diese Datei liest und schreibt Bytes. Sie ruft
 *    keine Shell, keinen Betrachter und kein `open` (A-19.18, E-072 Punkt 2).
 *  - **Kein Pfad aus einer Anfrage wird zum Zielpfad.** Das Ziel ist immer
 *    `<appdata>/attachments/<erzeugter Name>`; der einzige Wert aus der
 *    Anfrage ist der **Quell**pfad, und der wird gelesen, nie geschrieben.
 *  - **Es wird nicht geworfen.** Jeder Fehlschlag ist ein Wert aus dem
 *    geschlossenen Vorrat `ImageBlobFailure`. Ein unlesbares Bild ergibt eine
 *    Anzeige nach A-19.15 und keine Fehlerfläche.
 *  - **Kein Fehlschlag ist still** (T-159). Nicht geworfen heißt nicht
 *    verschwiegen: Wo dieser Adapter etwas nicht schafft, sagt er es dem
 *    Aufrufer als Wert **und** dem Protokoll als Zeile. Der Unterschied ist
 *    kein Feinschliff — bis T-159 verschwand jeder Fehlschlag von `rm` hier
 *    spurlos, und eine Bildkopie ohne Eigentümer ist Kundenmaterial.
 *
 * ===========================================================================
 * Warum dieser Adapter ein Protokoll bekommt und die anderen in `access/` nicht
 * ===========================================================================
 *
 * Weil er der einzige ist, der etwas **hinterlassen** kann. `token-store.ts`
 * und `session-secret.ts` melden ihren Fehlschlag als Rückgabewert an eine
 * Stelle, die ihn ohnehin anzeigt; ein mißlungenes `rm` dagegen hat keinen
 * Empfänger, dem es etwas bedeutet — der Benutzer bekommt zu Recht „entfernt"
 * zu sehen, weil der **Anhang** entfernt ist. Der einzige Ort, an dem die
 * liegengebliebene Datei noch auftauchen kann, ist das Protokoll.
 *
 * Was dort **nicht** steht: der Quellpfad, die Meldung des Betriebssystems,
 * der `errno`. Was dort steht: der **erzeugte** Name — der nach A-A-17 keinen
 * Bezug zur Quelldatei hat und genau deshalb gefahrlos genannt werden kann.
 * Er ist die einzige Angabe, mit der jemand die Datei wiederfindet.
 */

import { createHash, randomUUID } from 'node:crypto';
import { chmod, mkdir, open, readdir, rename, rm } from 'node:fs/promises';
import { isAbsolute, join, resolve, sep } from 'node:path';

import {
  IMAGE_SIGNATURE_BYTES,
  MAX_ATTACHMENT_IMAGE_BYTES,
  imageMediaTypeOf,
} from '@takt/domain';
import type { AttachmentBlobPort, ImageBlobFailure, ImageRemoval } from '@takt/storage';

import type { Logger } from '../logger.ts';
import { DIR_MODE, FILE_MODE } from './paths.ts';

/**
 * Wo die Kopien liegen — **neben** dem Bestand, nicht darin.
 *
 * Ein eigener Ordner und keine BLOB-Spalte: Ein Bild in `takt.db` wanderte in
 * jede Sicherung, bliese die WAL bei jedem Schreibvorgang auf und machte aus
 * der Datenbankdatei eine, deren Größe niemand mehr erklären kann (Begründung
 * ausgeschrieben in Migration 0015).
 *
 * Die Folge gehört benannt und steht im Bedrohungsmodell 20.9 Punkt 3: Die
 * Bilder **wachsen** dort, und sie werden von jedem Sicherungs- und
 * Synchronisierungsagenten mitgenommen (VG-3, dieselbe Sache wie B-11.4).
 * Dagegen tragen die Rechte und der erzeugte Name; mehr ist ohne
 * Verschlüsselung nicht zu haben.
 */
export function attachmentDirectory(appDataDir: string): string {
  return join(appDataDir, 'attachments');
}

/**
 * Die Form eines erzeugten Namens: `<32 Hexziffern>.<endung>`.
 *
 * ---------------------------------------------------------------------------
 * Warum der Name **beim Lesen** noch einmal geprüft wird
 * ---------------------------------------------------------------------------
 *
 * Weil zwischen Erzeugen und Lesen der Bestand liegt. Das ist wörtlich die
 * Begründung aus E-072 Punkt 2 für den Öffnen-Befehl, und sie gilt hier
 * genauso: Der Name kommt aus `todo_attachment.target`, und in diese Tabelle
 * kann geschrieben werden, ohne durch diesen Adapter zu gehen — über eine
 * Route (VG-1), über `sqlite3` (VG-3), über eine künftige Migration.
 *
 * Ein Name wie `../../takt.db` ergäbe sonst aus einer Leseanfrage für ein
 * Vorschaubild eine Leseanfrage für den ganzen Bestand. Diese Form läßt weder
 * einen Punkt noch einen Schrägstrich noch einen Rückstrich zu; sie ist
 * damit die Grenze und nicht die Auflösung, die danach noch einmal prüft.
 *
 * Beides steht trotzdem da (Form **und** Vergleich der aufgelösten Pfade),
 * aus demselben Grund wie in `file-port.ts`: Die Form ist die Regel, der
 * Vergleich ist der Boden darunter.
 */
const GENERATED_NAME_SHAPE = /^[0-9a-f]{32}\.(?:png|jpg|gif|webp)$/;

/** Endung je Bildart. Erzeugt, nicht aus der Quelle übernommen (A-A-17). */
const EXTENSION_BY_MEDIA_TYPE: Readonly<Record<string, string>> = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
});

/** Blockgröße beim Lesen. 64 KiB ist die Größe, bei der Node ohnehin liest. */
const READ_CHUNK_BYTES = 64 * 1024;

type CopyResult =
  | { readonly ok: true; readonly name: string; readonly mediaType: string; readonly bytes: number }
  | { readonly ok: false; readonly reason: ImageBlobFailure };

type ReadResult =
  | { readonly ok: true; readonly mediaType: string; readonly data: Uint8Array }
  | { readonly ok: false; readonly reason: ImageBlobFailure };

/**
 * Der Adapter.
 *
 * `appDataDir` kommt aus dem Zusammenbau und nie aus einer Anfrage — dieselbe
 * Regel wie beim Pfad der Datenbank (B-1.6 Punkt 1). `null` heißt „kein Ort":
 * Dann gibt es keine Bildanhänge. Das ist der Zustand im Prüfpfad des
 * Zugriffsverfahrens und bei einem Bestand im Arbeitsspeicher — und es ist
 * eine Antwort und kein Wurf.
 *
 * Die Antwort in diesem Fall ist `write_failed` („Das Bild konnte nicht
 * abgelegt werden.") und seit T-159 **nicht** mehr `unreadable` („Diese Datei
 * lässt sich nicht lesen."). Der Unterschied ist der ganze Punkt: Die Datei
 * des Benutzers ist tadellos; es ist Takt, das keinen Ort für sie hat. Eine
 * Meldung, die auf die falsche Ursache zeigt, kostet mehr Zeit als keine.
 *
 * `logger` ist der einzige Empfänger für Fehlschläge, die kein Aufrufer
 * auswerten kann — siehe den Dateikopf.
 */
export function createAttachmentBlobPort(
  appDataDir: string | null,
  logger: Logger,
): AttachmentBlobPort {
  const directory = appDataDir === null ? null : attachmentDirectory(appDataDir);

  /**
   * Der Pfad einer Kopie — oder `null`, wenn der Name keiner ist, den dieser
   * Port erzeugt hätte.
   *
   * Zwei Prüfungen, und die zweite ist der Boden unter der ersten: die Form
   * (siehe {@link GENERATED_NAME_SHAPE}) und danach der Vergleich des
   * aufgelösten Pfads mit dem aufgelösten Verzeichnis — genau die Maßnahme aus
   * `file-port.ts` gegen R-11, hier für die Leserichtung.
   */
  const pathOf = (name: string): string | null => {
    if (directory === null) return null;
    if (!GENERATED_NAME_SHAPE.test(name)) return null;
    const full = resolve(directory, name);
    const root = resolve(directory);
    if (full !== join(root, name) || !full.startsWith(root + sep)) return null;
    return full;
  };

  const ensureDirectory = async (): Promise<string | null> => {
    if (directory === null) return null;
    try {
      await mkdir(directory, { recursive: true, mode: DIR_MODE });
      // `mkdir` setzt den Modus nur bei einer **neu** angelegten Ebene und
      // filtert ihn zusätzlich durch die `umask`. Ein Verzeichnis, das aus
      // einer früheren Fassung mit `0755` daliegt, wird hier eingeholt —
      // dieselbe Bauart wie `secureDatabaseFiles` für `-wal` und `-shm`.
      if (process.platform !== 'win32') await chmod(directory, DIR_MODE);
      return directory;
    } catch {
      /*
       * Takt kann sein **eigenes** Bildverzeichnis nicht anlegen: volle
       * Platte, entzogene Rechte, ein Anwendungsdatenverzeichnis, das jemand
       * durch eine Datei gleichen Namens ersetzt hat. Mit der Datei, die der
       * Benutzer ausgewählt hat, hat das nichts zu tun — und bis T-159 stand
       * an dieser Stelle trotzdem „Diese Datei lässt sich nicht lesen."
       *
       * Der Aufrufer bekommt deshalb `write_failed`, und der Grund kommt
       * hierher: Ohne diese Zeile wäre der Zustand von außen von einem
       * unlesbaren Bild nicht zu unterscheiden. Kein Pfad im Protokoll — wo
       * das Verzeichnis liegt, ist keine Auskunft für das Protokoll (B-2.4).
       */
      logger.lifecycle(
        'error',
        'Das Bildverzeichnis der Anhänge ließ sich nicht anlegen. Bildanhänge sind bis auf Weiteres nicht möglich.',
        'attachment_image_directory_unavailable',
      );
      return null;
    }
  };

  return {
    async copyImage(sourcePath: string): Promise<CopyResult> {
      /*
       * Der Quellpfad kommt aus dem Dateiauswahldialog der Hülle (A-A-11).
       * Trotzdem geprüft: Zwischen Auswahl und Aufruf liegt eine Route, und
       * eine Route erreicht jeder lokale Prozeß (VG-1). Ein relativer Pfad
       * würde gegen das Arbeitsverzeichnis des Sidecars aufgelöst — einen Ort,
       * den niemand bewußt gewählt hat.
       */
      if (!isAbsolute(sourcePath)) return { ok: false, reason: 'unreadable' };

      /*
       * `write_failed` und nicht `unreadable` (T-159): Beide Fälle, die hier
       * `null` ergeben — „kein Ort eingerichtet" und „das Verzeichnis ließ
       * sich nicht anlegen" —, sind Aussagen über **Takt**, nicht über die
       * Datei des Benutzers. Der Satz dazu lautet „Das Bild konnte nicht
       * abgelegt werden.", und er ist wahr. Der zweite Fall steht außerdem im
       * Protokoll; der erste ist eine Einstellung und kein Fehlschlag.
       */
      const target = await ensureDirectory();
      if (target === null) return { ok: false, reason: 'write_failed' };

      let handle;
      try {
        handle = await open(sourcePath, 'r');
      } catch {
        return { ok: false, reason: 'unreadable' };
      }

      const blocks: Buffer[] = [];
      let total = 0;
      try {
        for (;;) {
          const block = Buffer.allocUnsafe(READ_CHUNK_BYTES);
          const { bytesRead } = await handle.read(block, 0, READ_CHUNK_BYTES, null);
          if (bytesRead === 0) break;
          total += bytesRead;
          /*
           * **Hier** wird gezählt (A-A-15): an den gelesenen Bytes und nicht an
           * einer Ansage. Der Abbruch geschieht, bevor der nächste Block
           * gelesen wird — was bis hier im Speicher liegt, wird verworfen und
           * nichts davon geschrieben oder kodiert.
           */
          if (total > MAX_ATTACHMENT_IMAGE_BYTES) {
            return { ok: false, reason: 'too_large' };
          }
          blocks.push(block.subarray(0, bytesRead));
        }
      } catch {
        return { ok: false, reason: 'unreadable' };
      } finally {
        await handle.close().catch(() => undefined);
      }

      if (total === 0) return { ok: false, reason: 'empty' };

      const data = Buffer.concat(blocks, total);
      const mediaType = imageMediaTypeOf(data.subarray(0, IMAGE_SIGNATURE_BYTES));
      if (mediaType === null) return { ok: false, reason: 'not_an_image' };

      const extension = EXTENSION_BY_MEDIA_TYPE[mediaType];
      if (extension === undefined) return { ok: false, reason: 'not_an_image' };

      /*
       * Der erzeugte Name (A-A-17). `randomUUID` ohne Bindestriche gibt genau
       * 32 Hexziffern — dieselbe Quelle, aus der die Kennungen dieses Bestands
       * kommen, und ohne jeden Bezug zur Quelldatei.
       */
      const name = `${randomUUID().replaceAll('-', '')}.${extension}`;
      const full = pathOf(name);
      if (full === null) return { ok: false, reason: 'write_failed' };

      /*
       * Erst eine Nachbardatei, dann umbenennen — dieselbe Bauart wie beim
       * Export (`file-port.ts`) und aus demselben Grund: Ein Abbruch mitten im
       * Schreiben hinterließe sonst ein halbes Bild unter einem gültigen Namen,
       * und der Anhang zeigte es an, als wäre es vollständig.
       */
      const temporary = `${full}.tmp`;
      try {
        const out = await open(temporary, 'w', FILE_MODE);
        try {
          await out.write(data);
        } finally {
          await out.close();
        }
        // Ausdrücklich gesetzt und nicht der `umask` überlassen (E-018).
        if (process.platform !== 'win32') await chmod(temporary, FILE_MODE);
        await rename(temporary, full);
      } catch {
        await rm(temporary, { force: true }).catch(() => undefined);
        return { ok: false, reason: 'write_failed' };
      }

      return { ok: true, name, mediaType, bytes: total };
    },

    async readImage(name: string): Promise<ReadResult> {
      const full = pathOf(name);
      if (full === null) return { ok: false, reason: 'bad_name' };

      let handle;
      try {
        handle = await open(full, 'r');
      } catch {
        // Die Kopie ist weg — gelöscht, verschoben, ein Bestand ohne seinen
        // Bildordner. Das ist A-19.15 („sagt das an Ort und Stelle") und kein
        // Fehler des Dienstes.
        return { ok: false, reason: 'unreadable' };
      }

      const blocks: Buffer[] = [];
      let total = 0;
      try {
        for (;;) {
          const block = Buffer.allocUnsafe(READ_CHUNK_BYTES);
          const { bytesRead } = await handle.read(block, 0, READ_CHUNK_BYTES, null);
          if (bytesRead === 0) break;
          total += bytesRead;
          // Auch beim Lesen gezählt: Die Datei liegt im
          // Anwendungsdatenverzeichnis, aber jeder Prozeß im Benutzerkonto
          // kann sie ersetzen (VG-3). Eine Kopie, die über Nacht auf 2 GiB
          // gewachsen ist, wird nicht in den Arbeitsspeicher gelesen.
          if (total > MAX_ATTACHMENT_IMAGE_BYTES) return { ok: false, reason: 'too_large' };
          blocks.push(block.subarray(0, bytesRead));
        }
      } catch {
        return { ok: false, reason: 'unreadable' };
      } finally {
        await handle.close().catch(() => undefined);
      }

      if (total === 0) return { ok: false, reason: 'empty' };

      const data = Buffer.concat(blocks, total);
      /*
       * Die Kopfsignatur wird **erneut** gemessen, und die Endung des Namens
       * wird dabei nicht gefragt.
       *
       * Der Name steht im Bestand, die Bytes liegen im Dateisystem, und beides
       * kann getauscht worden sein (VG-1, VG-3). Was der Dienst als Bildart
       * herausgibt, entscheidet deshalb der **Inhalt** — die Endung ist eine
       * Ansage, die Signatur eine Messung. Aus demselben Grund steht hier kein
       * Vergleich der beiden: Er hätte nur einen Ausgang, der etwas ändert,
       * und das wäre „dem Namen glauben".
       */
      const mediaType = imageMediaTypeOf(data.subarray(0, IMAGE_SIGNATURE_BYTES));
      if (mediaType === null) return { ok: false, reason: 'not_an_image' };

      return { ok: true, mediaType, data };
    },

    async removeImage(name: string): Promise<ImageRemoval> {
      const full = pathOf(name);
      if (full === null) return 'unknown_name';

      try {
        // `force: true`: Eine Kopie, die es nicht gibt, ist kein Fehlschlag.
        // Das Ziel ist „sie liegt danach nicht mehr da", und das ist erreicht.
        // Was `force` **nicht** schluckt, ist ein gehaltenes Handle (`EBUSY`,
        // unter Windows der Regelfall bei geöffnetem Betrachter), ein
        // schreibgeschütztes Verzeichnis oder ein Ein-/Ausgabefehler.
        await rm(full, { force: true });
        return 'removed';
      } catch {
        /*
         * Bis T-159 stand hier `.catch(() => undefined)` und die Methode gab
         * `void` zurück: Die Kopie blieb liegen, der Aufrufer meldete Erfolg,
         * und **niemand** erfuhr davon. Eine Bildkopie ohne Eigentümer ist
         * Kundenmaterial im Anwendungsdatenverzeichnis — genau der Zustand,
         * den A-A-18 ausschließt.
         *
         * Der Name darf in die Zeile — aber **nicht** deshalb, weil Takt ihn
         * erzeugt hat. Diese Begründung stand hier bis T-168 und trägt nicht:
         * `removeImage` bekommt den Namen aus `todo_attachment.target`, und in
         * diese Spalte kann geschrieben werden, ohne durch diesen Adapter zu
         * gehen (VG-1, VG-3) — genau der Grund, aus dem derselbe Adapter beim
         * **Lesen** noch einmal prüft (T-164, Befund T-164-4).
         *
         * Tragend ist der Riegel ein paar Zeilen weiter oben: `pathOf` misst
         * den Namen gegen {@link GENERATED_NAME_SHAPE}, und diese Methode ist
         * längst mit `unknown_name` zurückgekehrt, wenn die Form nicht stimmt.
         * **Die Zeile ist für jeden Namen unerreichbar, der nicht aus 32
         * Hexziffern und einer der vier Endungen besteht** — auch dann, wenn
         * jemand einen Kundennamen in die Spalte schreibt. Das ist eine
         * Formzusage am Aufrufort und kein Vertrauen in den Erzeuger.
         *
         * Ohne den Namen wäre die Zeile ein Achselzucken — mit ihm findet man
         * die Datei. Der `errno` bleibt draußen; er brächte nichts, was der
         * Schlüssel nicht sagt.
         */
        logger.lifecycle(
          'warn',
          `Eine Bildkopie ließ sich nicht entfernen und liegt weiter im Anwendungsdatenverzeichnis: ${name}`,
          'attachment_image_remove_failed',
        );
        return 'failed';
      }
    },

    async listImages(): Promise<readonly string[]> {
      if (directory === null) return [];

      let entries;
      try {
        entries = await readdir(directory, { withFileTypes: true });
      } catch {
        /*
         * Kein Verzeichnis, keine Rechte, kein Datenträger: Die Antwort ist
         * eine **leere Liste** und keine Meldung. Der Regelfall ist die
         * frische Einrichtung — dort gibt es das Verzeichnis noch nicht, und
         * wo nichts liegt, ist auch nichts verwaist.
         *
         * Auch der seltenere Fall (es liegt etwas, und es ließ sich nicht
         * lesen) endet hier richtig: Das Aufräumen findet nichts und fasst
         * damit nichts an. Ein Fehlschlag beim **Entfernen** hat weiter seine
         * eigene Zeile — das ist der Fall, in dem etwas liegen bleibt, von dem
         * jemand weiß.
         */
        return [];
      }

      /*
       * **Nur Namen, die dieser Port erzeugt haben könnte**, und nur Dateien.
       *
       * Die Form ist dieselbe wie in `pathOf`, und sie ist hier keine
       * Höflichkeit gegenüber dem Aufrufer, sondern die Grenze des Aufräumens:
       * Was diese Liste nicht nennt, wird nie entfernt. Ein Unterordner, eine
       * halbe Kopie aus einem Abbruch, eine Datei, die jemand dort abgelegt
       * hat — alles bleibt liegen. Im Zweifel liegen lassen ist die richtige
       * Antwort; Kundenmaterial zu löschen, das man nicht zuordnen kann, ist
       * es nicht.
       */
      const names: string[] = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!GENERATED_NAME_SHAPE.test(entry.name)) continue;
        names.push(entry.name);
      }
      return names;
    },
  };
}

/**
 * Der Abdruck einer Kopie — für Prüfpfade, die belegen wollen, daß **dieselbe**
 * Datei zurückkommt, die hineingegangen ist.
 *
 * Steht hier und nicht im Port: Er ist kein Teil der Zusage, sondern ein
 * Werkzeug für den Nachweis. Der Dienst ruft ihn nirgends.
 */
export function imageDigest(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}
