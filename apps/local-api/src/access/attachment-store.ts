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
  MAX_EMAIL_ATTACHMENT_BYTES,
  imageMediaTypeOf,
} from '@takt/domain';
import type {
  AttachmentBlobPort,
  BlobRemoval,
  EmailFileReadFailure,
  ImageBlobFailure,
  ImageRemoval,
} from '@takt/storage';

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
 * Wo die übernommenen E-Mail-Dateien liegen (A-19.23, A-A-79) — ein **eigener**
 * Ordner neben den Bildkopien.
 *
 * ---------------------------------------------------------------------------
 * Warum nicht derselbe Ordner
 * ---------------------------------------------------------------------------
 *
 * Die beiden Bestände haben unterschiedliche Zusagen, und beide Zusagen hängen
 * daran, daß ein Aufräumlauf **alles** im Ordner beurteilen kann:
 *
 *  - `attachments/` enthält ausschließlich Bildkopien mit vier bekannten
 *    Endungen. `listImages` nennt nur Namen dieser Form; was sonst darin läge,
 *    wäre für das Aufräumen unsichtbar und bliebe ewig liegen.
 *  - `email-attachments/` enthält Dateien mit **beliebiger** Endung, und ihre
 *    Zugehörigkeit steht an einer anderen Spalte (`origin = 'email'`).
 *
 * Lägen beide zusammen, müßte jede der beiden Abfragen die Dateien der anderen
 * richtig übergehen — und ein Fehler dabei löscht Kundenmaterial, das einen
 * Eigentümer hat. Das ist genau der Zustand, den das Bedrohungsmodell in 23.3.3
 * für die **leere Antwort** beschreibt. Zwei Ordner sind die billigere Antwort
 * darauf: Jede Frage hat ihren eigenen Ort, und keine muß die andere kennen.
 *
 * Der Ordner heißt technisch und nicht sichtbar; wie `identifier` und
 * `generator` behält er seinen Namen (A-21).
 */
export function emailFileDirectory(appDataDir: string): string {
  return join(appDataDir, 'email-attachments');
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

/**
 * Die Form eines erzeugten Namens für eine E-Mail-Datei:
 * `<32 Hexziffern>` mit **höchstens einer** Endung aus `[a-z0-9]`, höchstens
 * 16 Zeichen — oder ganz ohne Endung.
 *
 * ---------------------------------------------------------------------------
 * Dieselbe Rolle wie {@link GENERATED_NAME_SHAPE}, und derselbe Grund
 * ---------------------------------------------------------------------------
 *
 * Die Menge der Endungen ist hier **offen** und darf es sein: Eine übernommene
 * Datei behält ihr Format (A-19.23), und welches das ist, entscheidet der
 * Absender. Was **nicht** offen ist, ist die Form: genau ein Punkt, danach
 * ausschließlich Kleinbuchstaben und Ziffern.
 *
 * Was diese eine Zeile damit ausschließt, ist die vollständige Tafel aus
 * T-297 (Bedrohungsmodell 39.4.1):
 *
 *  - **Pfadausbruch** — kein `/`, kein `\`, kein `..`, kein Doppelpunkt.
 *  - **Gerätenamen** — `NUL`, `COM1`, `CON.txt`, `prn.pdf`, `CONOUT$` beginnen
 *    sämtlich nicht mit 32 Hexziffern. Das ist der Fall, der bei der Vorlage
 *    als Datei anlegte, was Windows anschließend **nicht sieht** (39.4.2).
 *  - **Nachgestellte Punkte und Leerzeichen** — der aufgelöste Name ist der
 *    gespeicherte, es gibt nichts abzuschneiden (A-A-5′).
 *  - **Richtungs- und Formatzeichen** — nicht in `[a-f0-9a-z]`.
 *  - **Doppelendung** — genau ein Punkt.
 *  - **Kappung** — 32 + 1 + 16 Zeichen sind auf jedem Dateisystem ein Name.
 *  - **Kollision** — 128 Bit aus `randomUUID`.
 *
 * Und sie tut es, indem sie **beschreibt, was wir erzeugen**, statt
 * aufzuzählen, was ein Angreifer schicken könnte. Das ist der Unterschied
 * zwischen A-A-78 und A-A-80, und es ist der Grund, warum hier keine Liste
 * reservierter Windows-Namen steht.
 */
const GENERATED_FILE_NAME_SHAPE = /^[0-9a-f]{32}(?:\.[a-z0-9]{1,16})?$/;

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

  // -------------------------------------------------------------------------
  // Die E-Mail-Dateien (A-19.23, A-A-78, A-A-79, A-A-83)
  // -------------------------------------------------------------------------

  const emailDirectory = appDataDir === null ? null : emailFileDirectory(appDataDir);

  /**
   * Der Pfad einer E-Mail-Datei — oder `null`, wenn der Name keiner ist, den
   * dieser Port erzeugt hätte.
   *
   * Zeichengleich zu {@link pathOf} und aus demselben Grund; die einzige
   * Abweichung ist die Form (siehe {@link GENERATED_FILE_NAME_SHAPE}).
   */
  const emailPathOf = (name: string): string | null => {
    if (emailDirectory === null) return null;
    if (!GENERATED_FILE_NAME_SHAPE.test(name)) return null;
    const full = resolve(emailDirectory, name);
    const root = resolve(emailDirectory);
    if (full !== join(root, name) || !full.startsWith(root + sep)) return null;
    return full;
  };

  /**
   * Der Pfad, den `todo_attachment.target` führt — zurückgeprüft.
   *
   * ---------------------------------------------------------------------------
   * **Geprüft wird, was benutzt wird.** Die Falle, die dieser Bestand dreimal
   * hatte (T-156-1, T-164-1, T-297)
   * ---------------------------------------------------------------------------
   *
   * Der Wert kommt aus dem Bestand, und in den Bestand kann geschrieben werden,
   * ohne durch diesen Port zu gehen: über eine Route (VG-1), über `sqlite3` auf
   * die Bestandsdatei (VG-3), über eine künftige Migration. Ein `target`, das
   * jemand auf `..\\takt.db` oder auf ein Dokument des Benutzers gesetzt hat,
   * darf hier **nie** zu einem `rm` werden.
   *
   * Deshalb wird der Pfad nicht benutzt, wie er dasteht, sondern **neu
   * gebildet**: Der letzte Namensbestandteil geht durch dieselbe Form, durch
   * die er beim Schreiben ging, und der daraus gebildete Pfad muß zeichengleich
   * der übergebene sein. Ist er es nicht, wird nichts angefaßt.
   *
   * Das ist der Unterschied zwischen „den Pfad prüfen" und „den geprüften Pfad
   * benutzen", und er ist der ganze Inhalt dieser Funktion.
   */
  const emailPathFromTarget = (target: string): string | null => {
    if (emailDirectory === null) return null;
    const lastSeparator = Math.max(target.lastIndexOf('/'), target.lastIndexOf('\\'));
    const name = target.slice(lastSeparator + 1);
    const full = emailPathOf(name);
    if (full === null) return null;
    // Zeichengleich: Der neu gebildete Pfad **ist** der übergebene. Ein
    // `target`, das auf denselben Namen in einem anderen Ordner zeigt, fällt
    // hier — nicht an einer Prüfung des fremden Werts, sondern daran, daß der
    // eigene ein anderer ist.
    return resolve(target) === full ? full : null;
  };

  const ensureEmailDirectory = async (): Promise<string | null> => {
    if (emailDirectory === null) return null;
    try {
      await mkdir(emailDirectory, { recursive: true, mode: DIR_MODE });
      // Dieselbe Nachbesserung wie beim Bildverzeichnis: `mkdir` setzt den
      // Modus nur bei einer neu angelegten Ebene und filtert ihn durch die
      // `umask`. `0700` ist eine Zusage (E-018) und keine Voreinstellung.
      if (process.platform !== 'win32') await chmod(emailDirectory, DIR_MODE);
      return emailDirectory;
    } catch {
      logger.lifecycle(
        'error',
        'Das Verzeichnis der übernommenen E-Mail-Dateien ließ sich nicht anlegen. Anhänge aus E-Mails sind bis auf Weiteres nicht möglich.',
        'attachment_email_directory_unavailable',
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
          await out.writeFile(data);
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

    async restoreImage(name: string, data: Uint8Array) {
      if (data.byteLength === 0) return { ok: false, reason: 'empty' };
      if (data.byteLength > MAX_ATTACHMENT_IMAGE_BYTES) return { ok: false, reason: 'too_large' };

      const mediaType = imageMediaTypeOf(data.subarray(0, IMAGE_SIGNATURE_BYTES));
      if (mediaType === null) return { ok: false, reason: 'not_an_image' };
      const extension = EXTENSION_BY_MEDIA_TYPE[mediaType];
      if (extension === undefined || !name.endsWith(`.${extension}`)) {
        return { ok: false, reason: 'bad_name' };
      }

      const directoryReady = await ensureDirectory();
      const full = pathOf(name);
      if (directoryReady === null || full === null) return { ok: false, reason: 'write_failed' };

      const temporary = `${full}.tmp`;
      try {
        const out = await open(temporary, 'w', FILE_MODE);
        try {
          await out.write(data);
        } finally {
          await out.close();
        }
        if (process.platform !== 'win32') await chmod(temporary, FILE_MODE);
        await rename(temporary, full);
      } catch {
        await rm(temporary, { force: true }).catch(() => undefined);
        return { ok: false, reason: 'write_failed' };
      }
      return { ok: true, mediaType, bytes: data.byteLength };
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

    // -----------------------------------------------------------------------
    // A-19.23 — die Datei aus einer fremden E-Mail
    // -----------------------------------------------------------------------

    async storeEmailFile(data: Uint8Array, extension: string | null) {
      /*
       * **Der Boden unter der Grenze des Aufrufers** (A-A-81).
       *
       * Der Anwendungsfall zählt bereits, und er zählt an derselben Zahl:
       * `data.byteLength`. Diese beiden Zeilen sind trotzdem keine Doppelung,
       * sondern die Zusage dieses Ports gegenüber **jedem** Aufrufer — auch
       * einem, der morgen dazukommt. Eine Grenze, die nur der heutige Aufrufer
       * hält, ist keine Grenze des Ports.
       */
      if (data.byteLength === 0) return { ok: false as const, reason: 'empty' as const };
      if (data.byteLength > MAX_EMAIL_ATTACHMENT_BYTES) {
        return { ok: false as const, reason: 'too_large' as const };
      }

      /*
       * Die Endung kommt aus `nameEmailFile` der Domäne und ist dort auf
       * `[a-z0-9]`, höchstens 16 Zeichen, beschränkt. Hier wird sie **noch
       * einmal** gemessen, und zwar an derselben Form, die den erzeugten Namen
       * beschreibt — nicht aus Mißtrauen gegen die Domäne, sondern weil dieser
       * Port seine eigene Zusage hält: Was er schreibt, entspricht
       * {@link GENERATED_FILE_NAME_SHAPE}. Eine Zusage, die von einem Aufrufer
       * abhängt, ist eine Erwartung.
       */
      const suffix = extension === null ? '' : `.${extension}`;
      const name = `${randomUUID().replaceAll('-', '')}${suffix}`;
      if (!GENERATED_FILE_NAME_SHAPE.test(name)) {
        return { ok: false as const, reason: 'bad_extension' as const };
      }

      const ready = await ensureEmailDirectory();
      const full = emailPathOf(name);
      if (ready === null || full === null) {
        return { ok: false as const, reason: 'write_failed' as const };
      }

      /*
       * **`wx` und kein `existsSync`-dann-`writeFile`** (A-A-79).
       *
       * Die Vorlage prüft die Zieladresse mit `existsSync` frei und schreibt
       * danach: ein TOCTOU-Paar, und auf POSIX zugleich ein Symlink-Folgen —
       * ein **baumelnder** Symlink an dieser Stelle läßt `existsSync` falsch
       * sagen und `writeFile` durch ihn hindurch schreiben, mit fremdem Inhalt
       * an einen fremden Ort. `wx` legt an **oder scheitert**; einem Symlink
       * folgt es nicht.
       *
       * Ein vorhandener Eintrag ist deshalb ein Fehlschlag nach A-19.29 und
       * kein Ausweichen auf „(2)". Bei 128 Bit aus `randomUUID` ist er so
       * wahrscheinlich wie eine doppelte Kennung im ganzen Bestand.
       *
       * **Kein `.tmp` und kein `rename`** wie bei der Bildkopie: Dort ist der
       * Zwischenschritt nötig, weil ein Abbruch mitten im Schreiben ein halbes
       * Bild unter einem gültigen Namen hinterließe, das die Anzeige für
       * vollständig hält. Hier hinterließe er eine halbe Datei unter einem
       * Namen, den **keine Zeile nennt** — der Zeilenschreiber kommt erst
       * danach, und scheitert er, räumt der Aufrufer ohnehin auf (A-A-83).
       * Ein `.tmp` daneben wäre eine zweite Datei mit demselben Problem.
       */
      try {
        const out = await open(full, 'wx', FILE_MODE);
        try {
          await out.writeFile(data);
        } finally {
          await out.close();
        }
        // Ausdrücklich gesetzt und nicht der `umask` überlassen (E-018).
        if (process.platform !== 'win32') await chmod(full, FILE_MODE);
      } catch {
        // Ein Schreibvorgang, der mitten im Lauf abbrach, hat eine angelegte
        // Datei hinterlassen. Sie gehört zu keiner Zeile und geht mit.
        await rm(full, { force: true }).catch(() => undefined);
        return { ok: false as const, reason: 'write_failed' as const };
      }

      return { ok: true as const, name, path: full, bytes: data.byteLength };
    },

    async removeEmailFile(target: string): Promise<BlobRemoval> {
      const full = emailPathFromTarget(target);
      if (full === null) return 'unknown_name';

      try {
        // `force: true`: Eine Datei, die es nicht gibt, ist kein Fehlschlag —
        // dieselbe Begründung wie bei `removeImage`.
        await rm(full, { force: true });
        return 'removed';
      } catch {
        /*
         * Dieselbe Zeile wie bei der Bildkopie und aus demselben Grund: Eine
         * Datei ohne Eigentümer ist Kundenmaterial, und das Protokoll ist der
         * einzige Ort, an dem man sie wiederfindet.
         *
         * Genannt wird der **erzeugte** Name — und er darf genannt werden,
         * nicht weil dieser Port ihn erzeugt hat, sondern weil diese Zeile für
         * jeden anderen unerreichbar ist: `emailPathFromTarget` ist längst mit
         * `unknown_name` zurückgekehrt, wenn die Form nicht stimmt. Nie der
         * Anzeigename, nie der Absender, nie der Betreff (A-A-83).
         */
        logger.lifecycle(
          'warn',
          `Eine übernommene E-Mail-Datei ließ sich nicht entfernen und liegt weiter im Anwendungsdatenverzeichnis: ${full.slice(Math.max(full.lastIndexOf('/'), full.lastIndexOf('\\')) + 1)}`,
          'attachment_email_remove_failed',
        );
        return 'failed';
      }
    },

    async listEmailFiles(): Promise<readonly string[]> {
      if (emailDirectory === null) return [];

      let entries;
      try {
        entries = await readdir(emailDirectory, { withFileTypes: true });
      } catch {
        // Kein Verzeichnis, keine Rechte: eine **leere Liste** und keine
        // Meldung. Der Regelfall ist die frische Einrichtung, und wo nichts
        // liegt, ist auch nichts verwaist.
        return [];
      }

      // Nur Namen, die dieser Port erzeugt haben könnte, und nur Dateien. Was
      // diese Liste nicht nennt, wird nie entfernt — im Zweifel liegen lassen.
      const names: string[] = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!GENERATED_FILE_NAME_SHAPE.test(entry.name)) continue;
        names.push(entry.name);
      }
      return names;
    },

    // -----------------------------------------------------------------------
    // A-19.34 — die Bytes reisen mit der Datensicherung
    // -----------------------------------------------------------------------

    async readEmailFile(
      target: string,
    ): Promise<
      | { ok: true; name: string; data: Uint8Array }
      | { ok: false; reason: EmailFileReadFailure }
    > {
      /*
       * **Geprüft wird, was benutzt wird** — dieselbe Funktion wie beim
       * Löschen, und derselbe Grund (T-156-1, T-164-1, T-297). Zwischen dem
       * Schreiben und diesem Lesen liegt der Bestand, und in den kann ohne
       * diesen Port geschrieben werden (VG-1, VG-3).
       *
       * Ohne diese Zeile wäre die Datensicherung ein Lesewerkzeug für jede
       * Datei, die der Benutzer lesen darf: Ein `target`, das jemand auf
       * `takt.db`, auf die Tokendatei oder auf ein Dokument gesetzt hat, käme
       * base64-kodiert in einem Archiv wieder heraus.
       */
      const full = emailPathFromTarget(target);
      if (full === null) return { ok: false, reason: 'unknown_name' };
      const name = full.slice(Math.max(full.lastIndexOf('/'), full.lastIndexOf('\\')) + 1);

      let handle;
      try {
        handle = await open(full, 'r');
      } catch {
        // Weg, verschoben, ein Bestand ohne seinen Ordner: A-19.15 und kein
        // Fehler des Dienstes. Der Aufrufer macht daraus eine Warnung im
        // Archiv, keine Fehlerfläche.
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
           * **Beim Lesen gezählt und nicht aus `stat`** (A-A-15). Die Grenze
           * galt beim Hereinnehmen; ob sie beim Herausgeben noch gilt, ist eine
           * zweite Frage: Die Datei liegt im Anwendungsdatenverzeichnis, und
           * jeder Prozeß im Benutzerkonto kann sie ersetzen (VG-3). Eine über
           * Nacht auf 2 GiB gewachsene Datei wird nicht in den Arbeitsspeicher
           * gelesen und erst recht nicht base64-kodiert.
           */
          if (total > MAX_EMAIL_ATTACHMENT_BYTES) return { ok: false, reason: 'too_large' };
          blocks.push(block.subarray(0, bytesRead));
        }
      } catch {
        return { ok: false, reason: 'unreadable' };
      } finally {
        await handle.close().catch(() => undefined);
      }

      if (total === 0) return { ok: false, reason: 'empty' };
      return { ok: true, name, data: Buffer.concat(blocks, total) };
    },

    async restoreEmailFile(name: string, data: Uint8Array) {
      if (data.byteLength === 0) return { ok: false as const, reason: 'empty' as const };
      if (data.byteLength > MAX_EMAIL_ATTACHMENT_BYTES) {
        return { ok: false as const, reason: 'too_large' as const };
      }

      /*
       * Der Name kommt aus dem Archiv und ist **fremder Text**. `emailPathOf`
       * ist die einzige Stelle, an der er zu einem Pfad wird, und es läßt nur
       * `<32 Hexziffern>[.<endung>]` durch — `..\\takt.db` scheitert hier und
       * nicht an einer Prüfung weiter vorn.
       */
      const ready = await ensureEmailDirectory();
      const full = emailPathOf(name);
      if (full === null) return { ok: false as const, reason: 'bad_extension' as const };
      if (ready === null) return { ok: false as const, reason: 'write_failed' as const };

      /*
       * **Nachbardatei und `rename`, nicht `wx`** — der eine Unterschied zu
       * `storeEmailFile`, und er ist Inhalt: Ein Archiv, das auf **diesem**
       * Rechner entstanden ist, nennt Namen, die hier schon liegen. `wx`
       * machte den Regelfall zum Fehlschlag. Der Umweg über `.tmp` hält
       * zugleich die Zusage, die `wx` dort hält: Ein Abbruch mitten im
       * Schreiben hinterläßt die **alte** Datei, nie eine halbe unter einem
       * Namen, den eine Zeile nennt.
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
        return { ok: false as const, reason: 'write_failed' as const };
      }
      return { ok: true as const, path: full, bytes: data.byteLength };
    },

    emailFilePathOf(name: string): string | null {
      return emailPathOf(name);
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
