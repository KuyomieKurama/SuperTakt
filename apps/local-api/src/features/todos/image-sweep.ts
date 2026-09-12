/**
 * Takt — verwaiste Bildkopien beim Start (A-A-18, A-A-36, A-A-98, T-315).
 *
 * ===========================================================================
 * **Diese Datei sagt nur noch, welcher Ordner gemeint ist**
 * ===========================================================================
 *
 * Der Ablauf — Reihenfolge, Eigentümerfrage, die beiden Gegenfragen, der
 * Widerspruchsriegel, die Klammer um alles — steht in
 * `features/todos/orphan-sweep.ts` und dort **ein einziges Mal**. Hier stehen
 * die vier Dinge, die diesen Ordner von dem der E-Mail-Dateien unterscheiden:
 * die Liste, der Wert zum Entfernen, die enge Zählung und die Sätze im
 * Protokoll.
 *
 * **Warum das keine Kosmetik ist.** Bis T-315 trug diese Datei eine eigene
 * Abschrift desselben Verfahrens, und die Abschrift war die **ältere und
 * ausgelieferte**. T-314 hat den Lauf für die E-Mail-Dateien berichtigt; diese
 * Datei blieb mit ihren Fehlern stehen, und drei der vier gemessenen Löschwege
 * lagen danach ausschließlich hier. Zwei Fassungen derselben Eigentümerfrage
 * sind genau die Doppelung, die den Fehler erzeugt hat.
 *
 * ===========================================================================
 * Der Zustand, gegen den dieser Lauf geschrieben ist
 * ===========================================================================
 *
 * Eine Bildkopie liegt als Datei im Anwendungsdatenverzeichnis, ihr Anhang als
 * Zeile in `todo_attachment`. Das Löschen nimmt beides mit — erst die Zeile,
 * dann die Datei. Zwei Wege lassen die Datei trotzdem liegen:
 *
 *  1. **Das Entfernen scheitert.** Unter Windows genügt ein geöffneter
 *     Betrachter (`EBUSY`). Seit T-159 sagt der Adapter das (`failed`) und
 *     schreibt eine Zeile ins Protokoll — geholt hat die Datei danach niemand.
 *  2. **Eine Migration geht zurück.** Der Rückweg von 0015 löscht die Tabelle;
 *     SQL kennt kein Dateisystem, und der Kommentar dort sagt es ausdrücklich.
 *
 * Danach liegt **Kundenmaterial ohne Eigentümer** im Anwendungsdatenverzeichnis
 * — genau der Zustand, den A-A-18 ausschließt. Die Gegenmaßnahme war bis T-168
 * ein Satz in einer Migration, der einen Menschen bittet, einen Ordner von Hand
 * zu leeren. Das ist keine Maßnahme, das ist eine Hoffnung.
 *
 * ===========================================================================
 * Die vier Löschwege, die T-314 hier gemessen hat — und was sie schließt
 * ===========================================================================
 *
 * Alle vier hatten dieselbe Ursache wie im anderen Ordner: Die Frage nach dem
 * Eigentümer war **enger** als die Menge der möglichen Eigentümer. Gefragt
 * wurde mit `kind = 'image' AND target IN (namen)` — zeichengleich und mit
 * bloßen Namen.
 *
 *  1. **Die Groß-/Kleinschreibung.** `A1B2….PNG` und `a1b2….png` sind dieselbe
 *     Datei und zwei Zeichenketten. Gemessen: zwei Bilder, eine Zeile passend,
 *     eine abweichend → **entfernt = 1**, die Datei fort, ihre Zeile da. Und
 *     asymmetrisch: Solange **alle** abwichen, hielt der Riegel; sobald **eine**
 *     paßte, fielen alle übrigen — denn er hing an `known.size === 0`.
 *  2. **Ein anderes `kind` auf der Zeile.** Die Abfrage filterte auf
 *     `kind = 'image'`. Was aus der Abfrage verschwindet, wird gelöscht.
 *     Gemessen: zwei Bilder, beide Zeilen `kind = 'file'` → **entfernt = 2**,
 *     beide Dateien fort, beide Zeilen stehen.
 *  3. **Migration 0023 zurück und vor** — trägt hier **nicht**: Dieser Lauf hing
 *     nie an `origin`.
 *  4. **Der volle Pfad, und das ist der erreichbarste** (T-314, neu). Gefragt
 *     wurde mit bloßen **Namen**; eine Zeile, die dieselbe Datei mit ihrem
 *     **vollen Pfad** nennt, war unsichtbar. So ein Pfad kommt durch die
 *     **gewöhnliche** Tür — absolut, vorhanden, Endung `.png`, also genau das,
 *     was `checkAttachmentPath` durchläßt. Gemessen: Bildkopie + eine
 *     `kind = 'file'`-Zeile mit dem vollen Pfad derselben Datei →
 *     **entfernt = 1, Dateien = 0, Zeilen = 1**. Kein Angriff, keine besonderen
 *     Rechte, kein Schreibzugriff an der Tür vorbei: **ein Bedienweg.**
 *
 * Geschlossen sind sie an **einer** Stelle. `attachmentTargetNamesFile` in
 * `@takt/domain` vergleicht den **Namen**, ASCII-gefaltet, ohne `origin`, ohne
 * `kind` und ohne Rücksicht auf den Pfad davor; ein Pfad, der auf den Namen
 * endet, nennt ihn ebenfalls. Damit ist jede der vier Zeilen ein Eigentümer,
 * und der Riegel darüber hängt nicht mehr an einer leeren Menge.
 *
 * ===========================================================================
 * Was diesen Ordner vom anderen unterscheidet
 * ===========================================================================
 *
 *  - **`target` trägt hier den bloßen Namen**, nicht den vollen Pfad. Deshalb
 *    ist der Wert zum Entfernen der Name ({@link OrphanedImageSweep.imageNameOf}),
 *    und deshalb antwortet die Gegenfrage nach dem Ordner
 *    (`attachmentNamesUnder`) im Regelfall **leer**: Eine gewöhnliche Bildzeile
 *    zeigt nicht in den Ordner, sie nennt nur einen Namen. Sie bleibt trotzdem
 *    gestellt — sie ist die Achse, auf der eine Zeile auffällt, die **doch**
 *    einen Pfad in diesen Ordner trägt, und das ist gerade der vierte Weg oben.
 *  - **Die enge Zählung** ist {@link OrphanedImageSweep.imageCount}
 *    (`kind = 'image'`) statt der Zählung über `origin = 'email'`.
 *  - **Die Endungen sind vier** (`png`, `jpg`, `gif`, `webp`), nicht beliebig.
 *
 * ===========================================================================
 * Die leere Antwort, und warum die Arten vorher gefragt werden (A-A-36)
 * ===========================================================================
 *
 * Die Menge der Arten ist nach Migration 0015 mit Absicht **Daten und keine
 * Schemaklausel**: Eine vierte Art soll ein `INSERT` sein und kein Umbau. Jede
 * Stelle, die über Arten **rechnet**, hat damit eine Annahme über eine Menge,
 * die wachsen darf.
 *
 * Seit T-315 rechnet die **Eigentümerfrage** nicht mehr über Arten — sie fragt
 * ohne `kind`. Übrig bleibt die enge Zählung, und ihre Annahme zeigt jetzt in
 * die **bremsende** Richtung: Bekäme ein Bild eine zweite Art, zählte sie zu
 * **wenig**, und der Widerspruchsriegel schlüge seltener an. Das ist der
 * billige Fehler; der teure war es bis T-315, als dieselbe Annahme in der
 * löschenden Frage stand.
 *
 * Der Riegel dagegen bleibt trotzdem stehen, und er ist billig: Der Lauf fragt
 * die Nachschlagetabelle — drei Zeilen — und räumt bei **jeder** Abweichung gar
 * nicht auf. Das ist genau die Regel, die dieser Ordner für sich in Anspruch
 * nimmt: Im Zweifel bleibt es liegen. Und es ist ein **Riegel und keine
 * Meinung**: Er sagt nicht, welche Art richtig ist, sondern nur, daß hier
 * gerechnet wird, wo nicht mehr gerechnet werden darf.
 */

import { ATTACHMENT_KINDS, type AttachmentKind } from '@takt/domain';
import type { ImageRemoval } from '@takt/storage';

import type { Logger } from '../../logger.ts';

import { sweepOrphanedBlobs, type OrphanSweepReport, type OrphanSweepVoice } from './orphan-sweep.ts';

/**
 * Was der Lauf über **diesen** Ordner wissen muß.
 *
 * Die Namen tragen den Ordner im Namen und nicht ein allgemeines `list` —
 * dieselbe Absicht wie im anderen Lauf: An der Verdrahtung in `main.ts` soll
 * abzulesen sein, worüber geurteilt wird. Was die Felder bedeuten und in
 * welcher Reihenfolge sie gefragt werden, steht in `orphan-sweep.ts`.
 */
export interface OrphanedImageSweep {
  /** Welche Arten führt der Bestand? (A-A-36.) **Pflicht**, nicht freiwillig. */
  attachmentKinds(): Promise<readonly string[]>;
  /** Der Ordner der Bildkopien — `null` heißt: keiner, also kein Urteil. */
  folder(): string | null;
  /** Die Kopien, die im Bildverzeichnis liegen (nur erzeugte Namen). */
  listImages(): Promise<readonly string[]>;
  /**
   * Der Name, unter dem eine Kopie entfernt wird — `null`, wenn dieser Ordner
   * den Namen nicht tragen kann.
   *
   * Für Bildkopien ist der Entfernungswert der **Name** und nicht der Pfad:
   * `target` trägt ihn so, und {@link removeImage} nimmt ihn so.
   */
  imageNameOf(name: string): string | null;
  /**
   * Welche dieser liegenden Dateien nennt der Bestand? (A-A-98.)
   *
   * **Dieselbe Frage wie im anderen Ordner**, und das ist der Punkt: die
   * weiteste, die einen Eigentümer finden kann — ohne `kind`, ohne `origin`,
   * ohne Rücksicht auf den Pfad davor und auf die Groß-/Kleinschreibung.
   */
  attachmentsNamingFiles(names: readonly string[]): Promise<ReadonlySet<string>>;
  /** Welche Namen erwartet der Bestand in **diesem** Ordner? (Erste Gegenfrage.) */
  attachmentNamesUnder(directory: string): Promise<ReadonlySet<string>>;
  /**
   * Wie viele Bildanhänge führt der Bestand insgesamt? (T-179 B-1.)
   *
   * Die zweite Gegenfrage, eng (`kind = 'image'`) und als einzige gar nicht am
   * `target`. **Pflicht**, aus demselben Grund wie {@link attachmentKinds}.
   */
  imageCount(): Promise<number>;
  /** Entfernt eine Kopie. Mißt die Form des Namens selbst noch einmal. */
  removeImage(name: string): Promise<ImageRemoval>;
}

/**
 * Welche Art hält eine **Datei im Bildverzeichnis**? (A-A-36.)
 *
 * Diese Tafel wird nirgends gelesen, und das ist ihr ganzer Zweck: Sie ist der
 * **Übersetzungsfehler**, den eine vierte Art an genau dieser Stelle auslöst —
 * nach dem Vorbild von `ATTACHMENT_KIND_PRESENCE` und `SOURCE_PRESENCE`, „was
 * keinen Zweig hat, hat keinen Wert".
 *
 * **Seit T-315 fragt sie nach der Bremse und nicht mehr nach der Löschung.** Wer
 * `AttachmentKind` erweitert, muß hier eine Zeile schreiben; wer `true`
 * schreibt, hat gerade gesagt, daß {@link OrphanedImageSweep.imageCount} diese
 * Art mitzählen muß, weil der Widerspruchsriegel sonst zu **klein** zählt. Die
 * Eigentümerfrage darüber ist von Arten unabhängig geworden und bleibt es.
 */
const KIND_OWNS_IMAGE_FILE: Readonly<Record<AttachmentKind, boolean>> = Object.freeze({
  link: false,
  image: true,
  file: false,
});

/**
 * Die Arten, deren Zeilen eine Datei im Bildverzeichnis halten — heute genau
 * eine, und genau die, über die {@link OrphanedImageSweep.imageCount} zählt.
 *
 * Sie steht hier abgeleitet und nicht ausgeschrieben, nach dem Vorbild von
 * `EXPORT_SOURCE_PATHS`: Die Tafel darüber ist die Behauptung, diese Liste ist
 * ihre Auswertung. Wer eine vierte Art mit `true` einträgt, ändert damit diese
 * Liste — und wer sie gegen die Bedingung von `imageCount` hält, sieht sofort,
 * daß die enge Zählung dann zu klein wäre.
 */
export const KINDS_HOLDING_IMAGE_FILES: readonly AttachmentKind[] = Object.freeze(
  ATTACHMENT_KINDS.filter((kind) => KIND_OWNS_IMAGE_FILE[kind]),
);

/** Die Sätze dieses Ordners. Der Ablauf dazu steht in `orphan-sweep.ts`. */
const IMAGE_SWEEP_VOICE: OrphanSweepVoice = Object.freeze({
  sweepKey: 'attachment_image_sweep',
  removedKey: 'attachment_image_orphans_removed',
  unknownKinds:
    'Der Bestand führt andere Anhangsarten als diese Fassung von SuperTakt. Liegengebliebene Bildkopien werden deshalb nicht aufgeräumt.',
  noFolder:
    'Das Bildverzeichnis der Anhänge läßt sich nicht bestimmen. Es wird nichts aufgeräumt.',
  contradiction:
    'Der Bestand und das Bildverzeichnis sagen Verschiedenes. Es wird deshalb nichts aufgeräumt.',
  unavailable:
    'Das Aufräumen liegengebliebener Bildkopien brach ab. Was nicht entfernt wurde, bleibt liegen.',
  removed: (count: number) => `${String(count)} Bildkopie(n) ohne zugehörigen Anhang entfernt.`,
});

/**
 * Entfernt Bildkopien ohne Eigentümer und meldet, **woran** gemessen wurde.
 *
 * Der Rückgabewert ist seit T-315 kein `number` mehr: „null entfernt" und „null
 * angesehen" müssen unterscheidbar sein, sonst meldet ein kaputter Lauf
 * dasselbe wie ein sauberer Bestand. Die Begründung steht in `orphan-sweep.ts`
 * unter Riegel 2. Der Aufrufer in `main.ts` trifft daran keine Entscheidung.
 */
export async function sweepOrphanedImages(
  ports: OrphanedImageSweep,
  logger: Logger,
): Promise<OrphanSweepReport> {
  return sweepOrphanedBlobs(
    {
      attachmentKinds: () => ports.attachmentKinds(),
      folder: () => ports.folder(),
      list: () => ports.listImages(),
      handleOf: (name) => ports.imageNameOf(name),
      attachmentsNamingFiles: (names) => ports.attachmentsNamingFiles(names),
      attachmentNamesUnder: (directory) => ports.attachmentNamesUnder(directory),
      claimedCount: () => ports.imageCount(),
      remove: (handle) => ports.removeImage(handle),
    },
    IMAGE_SWEEP_VOICE,
    logger,
  );
}
