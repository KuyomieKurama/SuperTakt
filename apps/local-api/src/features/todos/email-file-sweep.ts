/**
 * Takt — verwaiste Dateien aus E-Mail-Übernahmen beim Start (A-A-83, A-A-18,
 * A-A-98, E-111, T-315).
 *
 * ===========================================================================
 * **Diese Datei sagt nur noch, welcher Ordner gemeint ist**
 * ===========================================================================
 *
 * Der Ablauf — Reihenfolge, Eigentümerfrage, die beiden Gegenfragen, der
 * Widerspruchsriegel, die Klammer um alles — steht seit T-315 in
 * `features/todos/orphan-sweep.ts` und dort **ein einziges Mal**. Hier stehen
 * die Dinge, die diesen Ordner vom Bildverzeichnis unterscheiden: die Liste,
 * der Pfad zum Entfernen, die enge Zählung und die Sätze im Protokoll.
 *
 * **Am Verhalten dieses Laufs ändert das eines** (und es ist eine Verschärfung
 * in die bremsende Richtung): Die zweite Achse wird jetzt gegen die Zahl der
 * zugeordneten Dateien gehalten (`claimed > owned`) statt gegen Null. Alles
 * andere — die drei Gegenproben aus Bedrohungsmodell 40.1, die Gegenprobe nach
 * oben, die Reihenfolge der Aufrufe, jede Protokollzeile — ist unverändert.
 *
 * ===========================================================================
 * Der Zustand, gegen den dieser Lauf geschrieben ist — und nur dieser
 * ===========================================================================
 *
 * Eine übernommene Datei liegt als Bytes im Verzeichnis `email-attachments`,
 * ihr Anhang als Zeile in `todo_attachment` (`kind = 'file'`,
 * `origin = 'email'`). Zwischen beiden liegt ein Fenster: Erst wird die Datei
 * geschrieben, dann entsteht die Zeile. `attachEmailToNewTodo` klammert dieses
 * Fenster seit T-309 vollständig ab — jeder Fehlschlag und jeder **Wurf**
 * räumen die Dateien dieses Laufs wieder fort.
 *
 * **Diese Klammer reicht so weit wie der Prozeß, und das ist ihre Grenze.**
 * Wird der Dienst zwischen dem Schreiben einer Datei und dem `COMMIT` hart
 * beendet — abgeschossen, Stromausfall, ein `taskkill` auf das Sidecar —,
 * läuft kein `catch` mehr. Dann liegt Kundenmaterial aus einer fremden E-Mail
 * im Anwendungsdatenverzeichnis, auf das **keine Zeile zeigt**: Keine
 * Anhangsliste nennt es, keine Datensicherung erwähnt es (die liest den
 * Bestand, nicht den Ordner), und niemand fände es je wieder. Genau dagegen
 * steht dieser Lauf — und gegen nichts sonst.
 *
 * ===========================================================================
 * Was T-313 gemessen hat, und was daraus folgt (A-A-98)
 * ===========================================================================
 *
 * Die erste Fassung dieses Laufs hat drei Wege offen gelassen, auf denen er
 * Dateien entfernte, **deren Zeile stehenblieb**. Alle drei hatten dieselbe
 * Ursache: Die Frage nach dem Eigentümer war **enger** als die Menge der
 * möglichen Eigentümer.
 *
 *  1. **Die Schreibweise des Pfades.** Gefragt wurde mit einem zeichengleichen
 *     `IN` über `target`. `C:\…\<hex>.eml` und `c:/…/<hex>.eml` sind dieselbe
 *     Datei und zwei Zeichenketten. Gemessen: `{read:2, owned:1, removed:1}` —
 *     die zweite Datei fort, ihre Zeile da. Und asymmetrisch: Solange **alle**
 *     abwichen, hielt der Riegel; sobald **eine** paßte, fielen alle übrigen.
 *  2. **`origin='user'` auf einer Zeile in diesem Ordner.** Die Abfrage fragte
 *     mit `origin = 'email' AND kind = 'file'`. Verliert eine Zeile ihr
 *     `origin`, verschwindet sie aus der Abfrage — und was aus der Abfrage
 *     verschwindet, wird gelöscht. Gemessen: `{read:2, owned:0, removed:2}`.
 *  3. **Migration 0023 zurück und wieder vor.** Der Rückweg läßt `origin`
 *     fallen, die Hinrichtung legt sie mit `DEFAULT 'user'` wieder an. Danach
 *     ist Fall 2 für **alle** Dateien auf einmal wahr.
 *
 * Der Quelltext an der alten Abfrage hatte die Richtung ausdrücklich
 * **verkehrt herum** aufgeschrieben — die weitere Bedingung habe „eine fremde
 * gelöscht". Das Gegenteil stimmt: Eine weitere Bedingung findet **mehr**
 * Eigentümer und löscht **weniger**. Ein falsches Rot ist hier billig, ein
 * falsches Grün kostet Kundendaten. Der Satz steht jetzt in
 * `attachmentTargetNamesFile` in `@takt/domain`, und die Regel steht dort ein
 * einziges Mal — für **beide** Ordner.
 *
 * ===========================================================================
 * Was diesen Ordner vom Bildverzeichnis unterscheidet
 * ===========================================================================
 *
 *  - **`target` trägt hier den vollen Pfad** (A-19.26: eine übernommene Datei
 *    ist ein gewöhnlicher Dateianhang und wird über den Öffnen-Befehl der Hülle
 *    geöffnet, der einen absoluten Pfad verlangt). Deshalb ist der Wert zum
 *    Entfernen der Pfad, und deshalb trägt die Gegenfrage nach dem **Anfang**
 *    des Pfades hier ihr volles Gewicht.
 *  - **Die enge Zählung** ist {@link OrphanedEmailFileSweep.emailFileCount}
 *    (`origin = 'email' AND kind = 'file'`).
 *  - **Die Endung ist beliebig** (höchstens eine, `[a-z0-9]{1,16}`) — eine
 *    fremde E-Mail führt jede Art von Anhang mit.
 *
 * **Er faßt das Bildverzeichnis nicht an**, und `sweepOrphanedImages` faßt
 * dieses nicht an. Zwei Ordner, zwei Bedingungen, zwei Läufe — ein gemeinsamer
 * Lauf **über beide Ordner** müßte die Dateien des jeweils anderen übergehen und
 * hätte damit eine Gelegenheit mehr, Kundenmaterial mit Eigentümer zu löschen.
 * Ein gemeinsames **Verfahren** ist etwas anderes und seit T-315 genau richtig:
 * Die Abschrift war der Fehler, nicht die Trennung der Ordner.
 */

import type { BlobRemoval } from '@takt/storage';

import type { Logger } from '../../logger.ts';

import {
  sweepOrphanedBlobs,
  type OrphanSweepRefusal,
  type OrphanSweepReport,
  type OrphanSweepVoice,
} from './orphan-sweep.ts';

/**
 * Was der Lauf über **diesen** Ordner wissen muß.
 *
 * Die Namen tragen den Ordner im Namen und nicht ein allgemeines `list`: An der
 * Verdrahtung in `main.ts` soll abzulesen sein, worüber geurteilt wird. Was die
 * Felder bedeuten und in welcher Reihenfolge sie gefragt werden, steht in
 * `orphan-sweep.ts`.
 */
export interface OrphanedEmailFileSweep {
  /**
   * Welche Arten führt der Bestand? (A-A-36.)
   *
   * **Pflicht und nicht freiwillig** — ein freiwilliges Feld zwänge den Lauf,
   * sich bei seinem Fehlen zu entscheiden, und beide Antworten sind falsch.
   */
  attachmentKinds(): Promise<readonly string[]>;
  /**
   * Der Ordner, über den dieser Lauf urteilt.
   *
   * `null` heißt: Es gibt keinen. Dann urteilt er nicht — die Gegenfrage nach
   * dem Anfang des Pfades wäre ohne ihn nicht stellbar, und ein Lauf mit einer
   * Gegenfrage weniger ist ein Lauf, der mehr löscht.
   */
  folder(): string | null;
  /** Die Dateien im E-Mail-Verzeichnis (nur erzeugte Namen). */
  listEmailFiles(): Promise<readonly string[]>;
  /**
   * Aus einem erzeugten Namen der Pfad, in der Form, in der dieser Rechner ihn
   * führt.
   *
   * `null` heißt: Dieser Name kommt für diesen Ordner nicht in Frage. Er wird
   * dann **übergangen** und nicht etwa als Waise behandelt — im Zweifel liegen
   * lassen.
   */
  pathOf(name: string): string | null;
  /**
   * Welche dieser liegenden Dateien nennt der Bestand? (A-A-98.)
   *
   * Die weiteste Bedingung, die einen Eigentümer finden kann, und **dieselbe**,
   * die der Bildlauf stellt. Zurück kommt eine Teilmenge der übergebenen Namen.
   */
  attachmentsNamingFiles(names: readonly string[]): Promise<ReadonlySet<string>>;
  /**
   * Welche Namen erwartet der Bestand in **diesem** Ordner? (A-A-98.)
   *
   * Die erste der beiden Gegenfragen — gestellt am **Anfang** des Pfades und
   * damit auf einer anderen Achse als die Abfrage.
   */
  attachmentNamesUnder(directory: string): Promise<ReadonlySet<string>>;
  /**
   * Wie viele übernommene Dateien führt der Bestand insgesamt?
   *
   * Die zweite Gegenfrage, und die einzige, die gar nicht am `target` hängt.
   * **Pflicht**, aus demselben Grund wie {@link attachmentKinds}.
   */
  emailFileCount(): Promise<number>;
  /** Entfernt eine Datei. Mißt die Form des Pfades selbst noch einmal. */
  removeEmailFile(target: string): Promise<BlobRemoval>;
}

/**
 * Warum der Lauf **nicht** geurteilt hat — oder `null`, wenn er es tat.
 *
 * Derselbe geschlossene Vorrat für beide Ordner ({@link OrphanSweepRefusal});
 * der Name bleibt, weil er an den Prüffällen dieses Laufs hängt.
 */
export type EmailFileSweepRefusal = OrphanSweepRefusal;

/**
 * Was der Lauf getan hat — und **woran** er es getan hat
 * ({@link OrphanSweepReport}).
 */
export type EmailFileSweepReport = OrphanSweepReport;

/** Die Sätze dieses Ordners. Der Ablauf dazu steht in `orphan-sweep.ts`. */
const EMAIL_FILE_SWEEP_VOICE: OrphanSweepVoice = Object.freeze({
  sweepKey: 'attachment_email_sweep',
  removedKey: 'attachment_email_orphans_removed',
  unknownKinds:
    'Der Bestand führt andere Anhangsarten als diese Fassung von SuperTakt. Übernommene E-Mail-Dateien ohne Eigentümer werden deshalb nicht aufgeräumt.',
  noFolder:
    'Der Ordner der übernommenen E-Mail-Dateien läßt sich nicht bestimmen. Es wird nichts aufgeräumt.',
  contradiction:
    'Der Bestand und der Ordner der übernommenen E-Mail-Dateien sagen Verschiedenes. Es wird deshalb nichts aufgeräumt.',
  unavailable:
    'Das Aufräumen liegengebliebener E-Mail-Dateien brach ab. Was nicht entfernt wurde, bleibt liegen.',
  removed: (count: number) =>
    `${String(count)} übernommene E-Mail-Datei(en) ohne zugehörigen Anhang entfernt.`,
});

/** Entfernt übernommene E-Mail-Dateien ohne Eigentümer und meldet, woran gemessen wurde. */
export async function sweepOrphanedEmailFiles(
  ports: OrphanedEmailFileSweep,
  logger: Logger,
): Promise<EmailFileSweepReport> {
  return sweepOrphanedBlobs(
    {
      attachmentKinds: () => ports.attachmentKinds(),
      folder: () => ports.folder(),
      list: () => ports.listEmailFiles(),
      handleOf: (name) => ports.pathOf(name),
      attachmentsNamingFiles: (names) => ports.attachmentsNamingFiles(names),
      attachmentNamesUnder: (directory) => ports.attachmentNamesUnder(directory),
      claimedCount: () => ports.emailFileCount(),
      remove: (handle) => ports.removeEmailFile(handle),
    },
    EMAIL_FILE_SWEEP_VOICE,
    logger,
  );
}
