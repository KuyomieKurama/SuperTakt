/**
 * Takt — direkter Zugriff auf die SQLite-Datei des Testlaufs (O-AH, T-130).
 *
 * Nur für den einen Fall, in dem die Tür der Anwendung selbst der
 * Prüfgegenstand ist und deshalb nicht der Weg sein darf, über den die
 * Testdaten entstehen: `titleSchema` (`apps/local-api/src/http/input.ts`)
 * weist einen Titel mit einem bidirektionalen Formatierungszeichen mit 422 ab
 * (T-122, dieselbe Zeichenklasse wie überall sonst, `@takt/domain`). Der
 * Auftrag (T-124, Abschnitt 4/„Nächster Schritt") nennt ausdrücklich den Weg
 * über die Datenbank als Alternative zur Tür.
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
