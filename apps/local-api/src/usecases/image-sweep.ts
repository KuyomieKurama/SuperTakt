/**
 * Takt — verwaiste Bildkopien beim Start (A-A-18).
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
 * Drei Bedingungen, und die erste ist die einzige, die zählt
 * ===========================================================================
 *
 * **1. Entfernt wird nur, was nachweislich zu keinem Bestand gehört.** Im
 * Zweifel bleibt es liegen. Der Nachweis besteht aus fünf Riegeln, und jeder
 * einzelne genügt, um eine Datei zu verschonen:
 *
 *  - `attachmentKinds` wird **vor allem anderen** gefragt: Führt der Bestand
 *    genau die Arten, die dieses Erzeugnis kennt? Wenn nicht, räumt dieser Lauf
 *    **gar nicht** auf. Warum das ein eigener Riegel ist und nicht Vorsicht,
 *    steht weiter unten unter „Die leere Antwort".
 *  - `listImages` nennt **nur Namen, die der Adapter erzeugt haben könnte**
 *    (32 Hexziffern, vier Endungen) und nur Dateien. Alles andere im Ordner
 *    ist für diesen Lauf unsichtbar.
 *  - `knownImageTargets` wird **gefragt**, und nur eine Antwort ohne den Namen
 *    macht ihn zum Waisen. Bleibt die Antwort aus, wird nichts entfernt.
 *  - `imageCount` widerlegt eine **leere** Antwort: Führt der Bestand
 *    Bildanhänge und gehört ihm trotzdem keine der gefundenen Dateien, ist das
 *    ein Widerspruch und kein Aufräumfall. Siehe „Die leere Antwort".
 *  - `removeImage` misst die Form **noch einmal** und verlässt sich nicht auf
 *    den Aufrufer.
 *
 * **Die Reihenfolge ist Teil des Nachweises:** erst das Verzeichnis lesen,
 * dann den Bestand fragen. Eine Kopie, die zwischen beiden Schritten entsteht,
 * ist in der Antwort enthalten und überlebt. Umgekehrt — erst fragen, dann
 * lesen — fiele genau die frische Kopie dem Aufräumen zum Opfer, deren Zeile
 * eine Sekunde später geschrieben wird.
 *
 * **2. Still, wenn nichts liegt.** Der Regelfall schreibt keine Zeile: kein
 * Verzeichnis, keine Datei, keine Waise. Gemeldet wird eine **Zahl**, und nur
 * wenn wirklich etwas entfernt wurde. Ein Lauf, der bei jedem Start meldet,
 * dass er nichts zu tun hatte, wird nach dem dritten Mal nicht mehr gelesen.
 *
 * **3. Er hält den Start nicht auf.** Ein Verzeichniseintrag und eine Abfrage
 * über den Teilindex aus Migration 0015; bei einer leeren Einrichtung ist es
 * ein fehlgeschlagenes `readdir` und sonst nichts. Er läuft trotzdem
 * **vollständig, bevor der Dienst zuhört** — und das ist Absicht: Solange
 * keine Route erreichbar ist, kann zwischen dem Lesen des Verzeichnisses und
 * der Antwort des Bestands kein Anhang entstehen. Ein Lauf im Hintergrund
 * neben laufenden Anfragen wäre schneller und hätte genau ein Rennen mehr, als
 * Bedingung 1 verträgt.
 *
 * ===========================================================================
 * Wer diese Reihenfolge-Zusage wirklich trägt (A-A-36, erste Hälfte)
 * ===========================================================================
 *
 * Der Satz oben — „solange keine Route erreichbar ist, kann kein Anhang
 * entstehen" — gilt für **diesen Prozeß**. Ein **zweiter** Prozeß auf derselben
 * Bestandsdatei wäre ein Schreiber, den dieser Lauf nicht sieht: Er läge genau
 * in dem Zeitfenster zwischen Kopie und Zeile, und die frische Kopie fiele.
 *
 * Daß es diesen zweiten Prozeß im Erzeugnis nicht gibt, hängt an **einer Zeile
 * in einer anderen Sprache in einem anderen Verzeichnis**:
 * `tauri_plugin_single_instance` in `apps/desktop/src-tauri/src/lib.rs`,
 * registriert als **erstes** Plugin und damit vor dem `setup`, in dem der
 * Sidecar überhaupt entsteht.
 *
 * **Der Anschlag auf den Port trägt sie nicht.** Das `EADDRINUSE` in `main.ts`
 * greift erst beim Lauschen, also **nach** diesem Lauf; wer ihn für den Träger
 * hält, hält einen Riegel für gesetzt, der zu dieser Zeit noch offen ist.
 *
 * Der Satz steht hier, weil eine Zusage, deren Träger in einem fremden
 * Erzeugnis liegt, sonst mit dem ersten Umbau fällt, den niemand mit ihr in
 * Verbindung bringt (Bedrohungsmodell 23.3.1, A-A-36).
 *
 * Im **Entwicklungsbetrieb** — `apps/local-api` von Hand gestartet, ohne Hülle
 * — gibt es die Einzigkeit gar nicht. Das Fenster ist schmal, und die Folge
 * wäre eine verlorene Bildkopie und kein Datenabfluß; es gehört trotzdem in
 * diesen Satz und nicht in eine Fußnote.
 *
 * ===========================================================================
 * Die leere Antwort, und warum die Arten vorher gefragt werden (A-A-36)
 * ===========================================================================
 *
 * `knownImageTargets` filtert hart auf `kind = 'image'` — nötig, weil
 * `ix_todo_attachment_image` ein **Teilindex** über genau diese Bedingung ist.
 * Zugleich ist die Menge der Arten nach Migration 0015 mit Absicht **Daten und
 * keine Schemaklausel**: Eine vierte Art soll ein `INSERT` sein und kein Umbau.
 *
 * Damit steht in dieser Abfrage eine Annahme über eine Menge, die wachsen darf.
 * Bekäme ein Bild je eine zweite Art — ein Bildschirmabzug, eine eingebettete
 * Zeichnung —, zählte die Abfrage deren Zeilen nicht mit, ihre Antwort wäre
 * **leer statt unvollständig**, und der nächste Start entfernte Kundenmaterial,
 * **das einen Eigentümer hat**. Kein Angriff und kein fremder Prozeß; ein
 * Datenverlust durch eine Migration, die an einer ganz anderen Stelle
 * geschrieben wird (Bedrohungsmodell 23.3.3).
 *
 * Der Riegel dagegen ist billig: Der Lauf fragt die Nachschlagetabelle — drei
 * Zeilen — und räumt bei **jeder** Abweichung gar nicht auf. Das ist genau die
 * Regel, die diese Datei für sich in Anspruch nimmt: Im Zweifel bleibt es
 * liegen. Und es ist ein **Riegel und keine Meinung**: Er sagt nicht, welche
 * Art richtig ist, sondern nur, daß hier gerechnet wird, wo nicht mehr
 * gerechnet werden darf.
 *
 * ---------------------------------------------------------------------------
 * Zwei Prüfer, ein Befund, zwei Riegel — und sie fangen Verschiedenes
 * ---------------------------------------------------------------------------
 *
 * Die Artenprüfung fängt einen Bestand, der **andere Arten** führt. Sie fängt
 * **nicht** den zweiten Weg zur selben leeren Antwort (T-179 B-1): eine
 * künftige Änderung an `target` oder an `kind`, die **keine** neue Art
 * einführt — ein Präfix, eine Normalisierung, eine Umbenennung des Wertes
 * `'image'`. Danach fände `knownImageTargets` gar nichts mehr, jede gefundene
 * Datei gälte als Waise, und der nächste Start löschte den **ganzen**
 * Bildbestand. Die einzige Spur wäre eine `info`-Zeile mit einer Zahl.
 *
 * Dagegen steht {@link OrphanedImageSweep.imageCount}: Führt der Bestand
 * Bildanhänge (`total > 0`) und gehört ihm zugleich **keine einzige** der
 * gefundenen Dateien (`known.size === 0`), dann widersprechen sich zwei
 * Antworten desselben Bestands. Ein Widerspruch ist kein Aufräumfall; es wird
 * nichts entfernt, und die Zeile sagt es.
 *
 * **Der Preis, ausgeschrieben:** Ein Benutzer, der **alle** seine Bilddateien
 * von Hand aus dem Verzeichnis gelöscht hat und daneben verwaiste Kopien
 * liegen hat, wird ab jetzt nicht mehr aufgeräumt — sein Bestand sieht von
 * außen genau wie der Schadensfall aus. Der Tausch ist bewußt und geht in die
 * Richtung, die A-A-18 vorgibt: Liegengebliebenes ist ärgerlich, gelöschtes
 * Kundenmaterial mit Eigentümer ist unwiederbringlich.
 *
 * **Warum beide Riegel und nicht der billigere allein:** Die Widerspruchsprüfung
 * schweigt, solange auch nur **eine** Datei zugeordnet werden kann — eine
 * vierte Bildart mit einer einzigen zugeordneten Datei käme durch. Die
 * Artenprüfung schweigt, sobald die Arten stimmen. Zwei Prüfer haben
 * unabhängig denselben Zustand gefunden und zwei verschiedene Wege dorthin
 * beschrieben; deshalb stehen hier zwei Riegel und nicht einer.
 *
 * **Was er nicht anfasst:** den Startabbruch. Er ist kein Grund, nicht zu
 * starten — er läuft nach der Migration, meldet höchstens eine Zahl und gibt
 * keinen Wert zurück, den irgendjemand zum Abbrechen benutzen könnte.
 */

import type { AttachmentKind } from '@takt/domain';
import { isKnownAttachmentKindSet } from '@takt/domain';
import type { ImageRemoval } from '@takt/storage';

import type { Logger } from '../logger.ts';

/**
 * Was der Lauf braucht — und sonst nichts.
 *
 * Vier Funktionen statt zweier Ports: Damit ist er ohne Datenbank, ohne
 * Dateisystem und ohne laufenden Dienst prüfbar, und die Reihenfolge aus dem
 * Kopf dieser Datei ist am Aufruf abzulesen.
 */
export interface OrphanedImageSweep {
  /**
   * Welche Arten führt der Bestand? (A-A-36.)
   *
   * **Pflicht und nicht freiwillig.** Ein freiwilliges Feld wäre hier die
   * schlechteste aller Fassungen: Der Lauf müßte sich bei seinem Fehlen
   * entscheiden, und beide Antworten sind falsch — „dann räume ich" hebt den
   * Riegel auf, „dann räume ich nie" macht ihn unbemerkt wirkungslos. Als
   * Pflichtfeld kostet er einen Übersetzungsfehler je Aufrufstelle, und genau
   * das ist gewollt (dieselbe Begründung wie bei `unresolvedRequired`, T-082).
   */
  attachmentKinds(): Promise<readonly string[]>;
  /** Die Kopien, die im Bildverzeichnis liegen (nur erzeugte Namen). */
  listImages(): Promise<readonly string[]>;
  /** Welche dieser Namen gehören noch zu einem Anhang? */
  knownImageTargets(names: readonly string[]): Promise<ReadonlySet<string>>;
  /**
   * Wie viele Bildanhänge führt der Bestand insgesamt? (T-179 B-1.)
   *
   * Gefragt wird **nur**, wenn die Antwort auf {@link knownImageTargets} leer
   * ist — sonst ist die Abfrage bereits belegt, und eine zweite Zahl daneben
   * beantwortete nichts. Auch dieses Feld ist **Pflicht**, aus demselben Grund
   * wie {@link attachmentKinds}.
   */
  imageCount(): Promise<number>;
  /** Entfernt eine Kopie. Misst die Form des Namens selbst noch einmal. */
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
 * Der Riegel darunter ist ein Laufzeitriegel; er fängt eine Datenbank, die
 * dieser Fassung **voraus** ist. Er fängt nicht den Fall, in dem jemand eine
 * vierte Art ordentlich einführt — Migration, Domäne, Anzeige — und dabei
 * übersieht, daß `knownImageTargets` mit `kind = 'image'` fragt. Für **diesen**
 * Fall steht die Tafel hier: Wer `AttachmentKind` erweitert, muß hier eine
 * Zeile schreiben, und wer `true` schreibt, hat gerade gesagt, daß der Bestand
 * für diese Art ebenfalls befragt werden muß.
 */
const KIND_OWNS_IMAGE_FILE: Readonly<Record<AttachmentKind, boolean>> = Object.freeze({
  link: false,
  image: true,
  file: false,
});

/**
 * Entfernt Bildkopien ohne Eigentümer und meldet, **wie viele**.
 *
 * Der Rückgabewert ist die Anzahl der wirklich entfernten Dateien. Er ist für
 * den Prüfpfad da; der Aufrufer in `main.ts` trifft daran keine Entscheidung.
 */
export async function sweepOrphanedImages(
  ports: OrphanedImageSweep,
  logger: Logger,
): Promise<number> {
  let removed = 0;

  try {
    /*
     * **Vor allem anderen: Redet dieser Lauf über denselben Bestand?** (A-A-36.)
     *
     * Er steht vor `listImages`, obwohl er teurer ist als ein `readdir`, das
     * meistens nichts findet. Der Grund ist nicht die Zeit, sondern die
     * Aussage: Ein Lauf, der erst das Verzeichnis liest und dann feststellt,
     * daß er nicht urteilen darf, hat bereits eine halbe Entscheidung
     * getroffen. Hier bricht er ab, bevor er etwas gesehen hat.
     *
     * Die Regel selbst liegt in `@takt/domain` — Mengengleichheit in beide
     * Richtungen, und die Begründung dafür steht dort.
     */
    const kinds = await ports.attachmentKinds();
    if (!isKnownAttachmentKindSet(kinds)) {
      /*
       * Die Zeile nennt den Grund und **keine** Art beim Namen. Was hier
       * stünde, käme aus dem Bestand, und das Protokoll ist kein Ort für Werte
       * daraus (B-2.4, dieselbe Regel wie bei den Pfaden). Die Anzahl genügt,
       * um die Zeile von einem Fehlschlag zu unterscheiden.
       */
      logger.lifecycle(
        'warn',
        'Der Bestand führt andere Anhangsarten als diese Fassung von Takt. Liegengebliebene Bildkopien werden deshalb nicht aufgeräumt.',
        `attachment_image_sweep_unknown_kinds kinds=${String(kinds.length)} expected=${String(
          Object.keys(KIND_OWNS_IMAGE_FILE).length,
        )}`,
      );
      return 0;
    }

    /*
     * **Erst das Verzeichnis, dann der Bestand.** Siehe den Kopf dieser Datei:
     * In dieser Reihenfolge überlebt eine Kopie, die zwischen beiden Schritten
     * entsteht. Sie ist kein Stil, sie ist der halbe Nachweis.
     */
    const found = await ports.listImages();
    if (found.length === 0) return 0;

    const known = await ports.knownImageTargets(found);

    if (known.size === 0) {
      /*
       * **Die leere Antwort wird widerlegt, bevor sie gilt** (T-179 B-1).
       *
       * Gefragt wird erst hier und nicht oben: Solange auch nur ein Name
       * zugeordnet werden konnte, hat die Abfrage sich selbst belegt, und eine
       * Zahl daneben kostete eine Abfrage ohne Aussage.
       */
      const total = await ports.imageCount();
      if (total > 0) {
        /*
         * Zahlen und keine Namen. Was hier stünde, wäre ein erzeugter
         * Dateiname aus dem Bestand — das Protokoll ist kein Ort für Werte
         * daraus (B-2.4).
         */
        logger.lifecycle(
          'warn',
          'Der Bestand führt Bildanhänge, ordnet aber keiner der liegenden Bildkopien einen zu. Sie werden deshalb nicht aufgeräumt.',
          `attachment_image_sweep_contradiction files=${String(found.length)} attachments=${String(total)}`,
        );
        return 0;
      }
    }

    for (const name of found) {
      if (known.has(name)) continue;
      // `failed` zählt nicht mit: Die Datei liegt weiter da, und der Adapter
      // hat dafür seine eigene Zeile geschrieben. Gezählt wird, was fort ist.
      if ((await ports.removeImage(name)) === 'removed') removed += 1;
    }
  } catch {
    /*
     * Keiner der fünf Schritte **soll** werfen — der Adapter beantwortet ein
     * unlesbares Verzeichnis mit einer leeren Liste und einen gescheiterten
     * Löschversuch mit `failed`. Die Klammer steht trotzdem, und sie ist keine
     * Vorsicht, sondern eine Zusage an den Aufrufer: **Dieser Lauf kann den
     * Start nicht verhindern.** Ohne sie hinge das an der Sorgfalt der nächsten
     * Portfassung, und ein Wurf von hier landete im Auffangnetz des gebündelten
     * Sidecars, das `error.message` nach `stderr` schreibt — ausgerechnet dort
     * kann ein Pfad stehen (B-2.4, dieselbe Falle wie in T-132).
     *
     * Verschluckt wird deshalb nichts: Die Zeile sagt, dass abgebrochen wurde,
     * und die Zahl darunter sagt, wie weit es gekommen war.
     */
    logger.lifecycle(
      'warn',
      'Das Aufräumen liegengebliebener Bildkopien brach ab. Was nicht entfernt wurde, bleibt liegen.',
      'attachment_image_sweep_unavailable',
    );
  }

  if (removed > 0) {
    logger.lifecycle(
      'info',
      `${removed} Bildkopie(n) ohne zugehörigen Anhang entfernt.`,
      `attachment_image_orphans_removed files=${removed}`,
    );
  }
  return removed;
}
