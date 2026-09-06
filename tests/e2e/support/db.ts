/**
 * Takt — direkter Zugriff auf die SQLite-Datei des Testlaufs (O-AH, T-130).
 *
 * Für Fälle, in denen die Tür der Anwendung selbst der Prüfgegenstand ist und
 * deshalb nicht der Weg sein darf, über den die Testdaten entstehen:
 *
 *  - `titleSchema` (`apps/local-api/src/http/input.ts`) weist einen Titel mit
 *    einem bidirektionalen Formatierungszeichen mit 422 ab (T-122, dieselbe
 *    Zeichenklasse wie überall sonst, `@takt/domain`). Der Auftrag (T-124,
 *    Abschnitt 4/„Nächster Schritt") nennt ausdrücklich den Weg über die
 *    Datenbank als Alternative zur Tür.
 *  - `DELETE /todos/:id/attachments/:attachmentId` nimmt die Bildkopie beim
 *    Entfernen einer Anhangszeile immer mit — richtig für den Regelfall, aber
 *    damit ungeeignet, um die Waise herzustellen, die `usecases/image-sweep.ts`
 *    beim nächsten Start entfernen soll (O-FI, T-187). Nur eine Zeile direkt
 *    aus dem Bestand zu nehmen, ohne die Datei anzufassen, stellt genau den
 *    Zustand her, den ein gescheitertes Entfernen (T-159) oder eine
 *    zurückgehende Migration ebenfalls hinterlassen würden.
 *
 * `node:sqlite`, dieselbe Bauart wie `packages/storage/src/sqlite/database.ts`
 * (E-035) — eine zweite, kurzlebige Verbindung auf dieselbe Datei, während der
 * echte Dienst aus `services.ts` sie offen hält. Das ist unter WAL
 * unproblematisch (`PRAGMA journal_mode = WAL` steht dauerhaft im Dateikopf,
 * sobald der Dienst sie einmal gesetzt hat); `busy_timeout` fängt die seltene
 * Überschneidung ab.
 *
 * Der Pfad ist aus `resolveAppDataDir`/`databaseFilePath`
 * (`apps/local-api/src/access/paths.ts`) von Hand nachgebildet: Diese Datei
 * läuft unter `XDG_DATA_HOME = E2E_DATA_DIR` (`services.ts#startLocalApi`),
 * und auf dieser Plattform (nicht `win32`) ergibt das `join(XDG_DATA_HOME,
 * 'takt', 'takt.db')` — eine Konstante hier ist billiger als eine Abhängigkeit
 * dieser Datei auf `apps/local-api/**`, die sie sonst nicht bräuchte.
 */

import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

import { E2E_DATA_DIR } from "./session";

const DB_PATH = join(E2E_DATA_DIR, "takt", "takt.db");

/**
 * Überschreibt den Titel eines vorhandenen Todos unmittelbar in der
 * Datenbank, an `titleSchema` vorbei.
 *
 * Nur diese eine Spalte, keine Migration, keine offene Transaktion — die
 * Verbindung wird nach der einzigen Anweisung sofort wieder geschlossen.
 * `todo.title` kennt nur eine Bedingung (`CHECK (length(trim(title)) > 0)`,
 * `0001_initial.up.sql`), die ein Titel mit einem unsichtbaren Zeichen
 * unverändert erfüllt — anders als `titleSchema` an der Tür ist das keine
 * Zeichenklassenprüfung.
 */
export function overwriteTodoTitleDirectly(todoId: string, title: string): void {
  const db = new DatabaseSync(DB_PATH);
  try {
    db.exec("PRAGMA busy_timeout = 5000;");
    const result = db.prepare("UPDATE todo SET title = ? WHERE id = ?").run(title, todoId);
    if (Number(result.changes) !== 1) {
      throw new Error(
        `Konnte den Titel nicht setzen: Todo „${todoId}" wurde nicht gefunden (changes=${String(result.changes)}).`,
      );
    }
  } finally {
    db.close();
  }
}

/**
 * Entfernt eine Anhangszeile **an der Tür vorbei**, ohne die zugehörige Datei
 * anzufassen — die Simulation der beiden Wege, auf denen `image-sweep.ts`
 * zufolge eine Bildkopie ihren Eigentümer verliert: ein gescheitertes
 * Entfernen (T-159, z. B. `EBUSY` unter Windows) oder eine zurückgehende
 * Migration. Beide enden im selben Bestandszustand — eine Zeile weniger, eine
 * Datei unverändert —, und genau den stellt diese Funktion her, ohne eine
 * echte Fehlerbedingung oder einen echten Migrationsrückweg zu benötigen.
 *
 * Der normale Weg (`DELETE /todos/:id/attachments/:attachmentId`) würde die
 * Datei mitnehmen und könnte den Aufräumlauf deshalb nie prüfen — dieser Weg
 * hier lässt absichtlich genau die Waise zurück, die A-A-18 entfernen soll.
 */
export function deleteAttachmentRowDirectly(attachmentId: string): void {
  const db = new DatabaseSync(DB_PATH);
  try {
    db.exec("PRAGMA busy_timeout = 5000;");
    const result = db.prepare("DELETE FROM todo_attachment WHERE id = ?").run(attachmentId);
    if (Number(result.changes) !== 1) {
      throw new Error(
        `Konnte den Anhang nicht entfernen: „${attachmentId}" wurde nicht gefunden (changes=${String(result.changes)}).`,
      );
    }
  } finally {
    db.close();
  }
}

/**
 * Überschreibt das Ziel (`target`) einer vorhandenen Anhangszeile unmittelbar
 * in der Datenbank, an `checkAttachmentPath` vorbei (O-KQ, T-240).
 *
 * ---------------------------------------------------------------------------
 * Wozu — der dritte Zustand der Öffnen-Rückfrage hat einen Altbestandswert
 * zur Voraussetzung, den die Tür heute nicht mehr durchlässt
 * ---------------------------------------------------------------------------
 *
 * `checkAttachmentPath` (`packages/domain/src/attachment.ts:826-837`) weist
 * eine Umleitungsendung (`.lnk`, `.url`, `.pif`, `.scf`, `.desktop`) und einen
 * Dateinamen mit Doppelpunkt (A-A-28) inzwischen **an der Tür** ab — ein
 * `POST /todos/:id/attachments` mit einem solchen Pfad kommt nie im Bestand
 * an. Der dritte Zustand von `AttachmentOpenDialog` (`blocked`, kein
 * Öffnen-Knopf, V-07) trifft deshalb nur noch eine Zeile, die **vor** dieser
 * Verschärfung entstand, oder eine, die — wie der Kopf von
 * `checkAttachmentPath` selbst festhält (VG-1, VG-3) — an der Tür vorbei über
 * eine zweite Anwendung mit dem Sitzungsgeheimnis oder ein `UPDATE` auf die
 * Bestandsdatei geschrieben wurde. Über die Oberfläche und über
 * {@link api.ts, createAttachment} lässt sich dieser Bestandszustand nicht
 * mehr erzeugen.
 *
 * Diese Funktion stellt **genau das** her, ohne eine echte alte Fassung von
 * Takt zu installieren: eine gültige Zeile entsteht ganz regulär über die Tür
 * (`createAttachment`, prüft und speichert einen zulässigen Pfad), und
 * anschließend wird **nur** die Spalte `target` an der Tür vorbei auf einen
 * Wert gesetzt, den dieselbe Tür heute ablehnen würde. Das ist kein Umgehen
 * der Prüfung, die dieser Auftrag verlangt — es ist die einzige Art, den
 * Bestandszustand zu erzeugen, **für den** der dritte Dialogzustand überhaupt
 * gebaut wurde: Er ist der Umgang mit dem, was schon im Bestand liegt, nicht
 * mit dem, was gerade neu hineinkommt (dieselbe Rolle wie
 * {@link overwriteTodoTitleDirectly} für `titleSchema` und
 * {@link deleteAttachmentRowDirectly} für den Aufräumlauf — je eine Prüfung,
 * die nur an der Tür greift, und ein Prüffall, der den Bestand dahinter
 * trifft).
 *
 * Dieselbe eine Spalte, dieselbe kurzlebige Verbindung wie
 * {@link overwriteTodoTitleDirectly} — kein zweiter Zugriffspfad, keine
 * Migration.
 */
export function overwriteAttachmentTargetDirectly(attachmentId: string, target: string): void {
  const db = new DatabaseSync(DB_PATH);
  try {
    db.exec("PRAGMA busy_timeout = 5000;");
    const result = db.prepare("UPDATE todo_attachment SET target = ? WHERE id = ?").run(target, attachmentId);
    if (Number(result.changes) !== 1) {
      throw new Error(
        `Konnte das Ziel nicht setzen: Anhang „${attachmentId}" wurde nicht gefunden (changes=${String(result.changes)}).`,
      );
    }
  } finally {
    db.close();
  }
}
