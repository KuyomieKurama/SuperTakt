/**
 * Takt — **der Lauf, der löscht** (A-A-18, A-A-36, A-A-83, A-A-98, E-111).
 *
 * ===========================================================================
 * **Die Richtung dieses Laufs, und sie steht vor allem anderen**
 * ===========================================================================
 *
 * Dieser Lauf entfernt **ohne Zutun des Benutzers** Dateien, die Kundenmaterial
 * enthalten. Es gibt keinen Papierkorb, keine Rückfrage, keine zweite Kopie und
 * keine Spur außer einer Zahl im Protokoll. Deshalb gilt hier eine Regel, die
 * nicht verhandelbar ist und die jeder Änderung an dieser Datei vorausgeht:
 *
 * > **Im Zweifel wird nichts entfernt.** Ein Ordner, der eine Datei zuviel
 * > behält, ist ein Schönheitsfehler. Ein gelöschtes Bild aus einem
 * > Kundenvorgang oder eine gelöschte Rechnung aus der E-Mail eines Kunden ist
 * > keiner.
 *
 * Jede Frage in dieser Datei ist entsprechend gestellt: Die Frage nach dem
 * **Eigentümer** ist die weiteste, die einen finden kann; die Fragen, die den
 * Lauf **bremsen**, dürfen ruhig zu oft anschlagen. Wer eine Bedingung enger
 * macht, macht sie löschender — das ist der Fehler, den T-313 dreimal und T-314
 * ein viertes Mal gemessen hat, und er sah jedesmal aus wie Sorgfalt.
 *
 * ===========================================================================
 * Warum **ein** Verfahren und zwei Läufe (T-315)
 * ===========================================================================
 *
 * Es gibt zwei Ordner mit zwei Bedingungen: die Bildkopien (A-A-18) und die
 * Dateien aus E-Mail-Übernahmen (A-A-83). Sie bleiben **zwei Läufe** — ein
 * gemeinsamer Lauf über beide Ordner müßte die Dateien des jeweils anderen
 * übergehen und hätte damit eine Gelegenheit mehr, Kundenmaterial mit
 * Eigentümer zu löschen.
 *
 * Das **Verfahren** dagegen steht hier ein einziges Mal, und der Grund ist
 * gemessen und nicht ästhetisch: Bis T-315 gab es zwei Abschriften desselben
 * Verfahrens. T-314 hat die eine berichtigt, die andere blieb stehen — und die
 * stehengebliebene war die **ältere, ausgelieferte**. Drei der vier gemessenen
 * Löschwege lagen danach ausschließlich in der Abschrift. Zwei Fassungen
 * derselben Eigentümerfrage sind genau die Doppelung, die diesen Fehler
 * erzeugt hat; deshalb liegt die Regel selbst in `@takt/domain`
 * (`attachmentTargetNamesFile`), die Abfragen in **einem** Port und der Ablauf
 * in dieser Datei.
 *
 * Was die beiden Läufe unterscheidet, steht in ihren eigenen Dateien und in
 * nichts als Werten: der Ordner, die Liste, der Wert zum Entfernen, die enge
 * Zählung und die Sätze im Protokoll.
 *
 * ===========================================================================
 * Die Sicherungen — und jede einzelne genügt zum Verschonen
 * ===========================================================================
 *
 *  - {@link OrphanSweepPorts.attachmentKinds} steht **vor allem anderen**:
 *    Führt der Bestand genau die Arten, die dieses Erzeugnis kennt? Wenn nicht,
 *    räumt dieser Lauf gar nicht auf (A-A-36).
 *  - {@link OrphanSweepPorts.list} nennt **nur Namen, die der Adapter erzeugt
 *    haben könnte**, und nur Dateien. Alles andere im Ordner ist für diesen
 *    Lauf unsichtbar — ein Unterordner, eine halbe Kopie aus einem Abbruch,
 *    eine Datei, die jemand dort abgelegt hat.
 *  - {@link OrphanSweepPorts.attachmentsNamingFiles} wird **gefragt**, und nur
 *    eine Antwort ohne diesen Namen macht die Datei zur Waise. Die Frage ist
 *    die weiteste, die einen Eigentümer finden kann: kein `origin`, kein
 *    `kind`, keine Rücksicht auf den Pfad vor dem Namen und keine auf die
 *    Groß-/Kleinschreibung. Bleibt die Antwort aus, wirft der Lauf und faßt
 *    nichts an.
 *  - {@link OrphanSweepPorts.attachmentNamesUnder} und
 *    {@link OrphanSweepPorts.claimedCount} sind die beiden **Gegenfragen**.
 *    Siehe unten.
 *
 * **Die Reihenfolge ist Teil des Nachweises:** erst das Verzeichnis lesen, dann
 * den Bestand fragen. Eine Datei, die zwischen beiden Schritten ihre Zeile
 * bekommt, ist in der Antwort enthalten und überlebt. Umgekehrt — erst fragen,
 * dann lesen — fiele genau die frische Kopie dem Aufräumen zum Opfer, deren
 * Zeile eine Sekunde später geschrieben wird.
 *
 * **Wer diese Reihenfolge-Zusage wirklich trägt** (A-A-36, Bedrohungsmodell
 * 23.3.1): Der Satz gilt für **diesen Prozeß**. Ein zweiter Prozeß auf derselben
 * Bestandsdatei läge genau in dem Fenster zwischen Datei und Zeile. Daß es ihn
 * im Erzeugnis nicht gibt, hängt an einer Zeile in einer anderen Sprache in
 * einem anderen Verzeichnis: `tauri_plugin_single_instance` in
 * `apps/desktop/src-tauri/src/lib.rs`, registriert als **erstes** Plugin und
 * damit vor dem `setup`, in dem der Sidecar überhaupt entsteht. **Der Anschlag
 * auf den Port trägt sie nicht** — das `EADDRINUSE` in `main.ts` greift erst
 * beim Lauschen, also nach diesem Lauf. Im Entwicklungsbetrieb (der Dienst von
 * Hand gestartet, ohne Hülle) gibt es die Einzigkeit gar nicht; die Folge wäre
 * eine verlorene Kopie und kein Datenabfluß, und sie gehört trotzdem hierher
 * und nicht in eine Fußnote.
 *
 * **Geprüft wird, was benutzt wird.** Gefragt wird mit den **Namen** aus dem
 * Verzeichnis; entfernt wird über den Wert, den
 * {@link OrphanSweepPorts.handleOf} daraus bildet, und der Adapter mißt dessen
 * Form noch einmal selbst. Der Name, über den entschieden wurde, und die Datei,
 * die entfernt wird, sind dieselbe.
 *
 * ===========================================================================
 * Die beiden Gegenfragen — und warum es **zwei** sein müssen
 * ===========================================================================
 *
 * Eine leere Antwort auf „wem gehört das hier" heißt „niemandem" — und sie
 * heißt dasselbe, wenn die Frage selbst nicht mehr trifft. Dagegen steht ein
 * Widerspruchsriegel. In beiden Läufen war er einmal **eine** Zahl, und sie
 * wurde mit **derselben** Bedingung gezählt wie die Abfrage, der sie
 * widersprechen sollte. Das war der Denkfehler, und er ist zweimal teuer bezahlt
 * worden:
 *
 * > **Ein Riegel, der dieselbe Frage stellt wie die Abfrage, kann nur
 * > bestätigen, was die Abfrage schon behauptet hat.** Er muß die Menge von der
 * > **anderen Seite** bestimmen.
 *
 * Deshalb zwei Gegenfragen auf zwei **verschiedenen** Achsen, und beide werden
 * **immer** gestellt, sobald überhaupt etwas fallen würde — nicht erst, wenn die
 * Eigentümermenge leer ist. An genau dieser Bedingung (`known.size === 0`) hing
 * der alte Riegel, und genau deshalb entwaffnete **eine einzige** passende Zeile
 * ihn für alle anderen Dateien (T-313-1):
 *
 *  - **Am Anfang des Pfades:** {@link OrphanSweepPorts.attachmentNamesUnder}
 *    sagt, welche Namen der Bestand in **diesem Ordner** erwartet. Nennt er eine
 *    Datei, die dort nicht liegt, und liegt zugleich eine Datei da, die keine
 *    Zeile nennt, dann trifft die Zuordnung nicht mehr.
 *  - **Ohne den Pfad:** {@link OrphanSweepPorts.claimedCount} zählt eng
 *    (`kind = 'image'` bzw. `origin = 'email' AND kind = 'file'`) und hängt als
 *    einzige gar nicht am `target`. Sie trägt den Fall, in dem `target` seine
 *    **Gestalt** gewechselt hat: Dann findet weder der Name am Ende noch der
 *    Ordner am Anfang etwas wieder, und diese Zahl sagt als einzige weiter „der
 *    Bestand führt solche Anhänge".
 *
 * **Verglichen wird sie mit der Zahl der zugeordneten Dateien und nicht mit
 * Null** (T-315). `claimed > owned` heißt: Der Bestand führt mehr solche
 * Anhänge, als der Ordner Eigentümer findet — also fehlt mindestens einer
 * Zeile ihre Datei, **oder** die Zuordnung trifft nicht mehr. Der Vergleich
 * gegen Null (`owned === 0`) war die schwächere Fassung und ließ genau den
 * gemischten Fall durch: eine zugeordnete Datei, neun verlorene.
 *
 * **Keine der beiden ist der Riegel allein**, und keine hängt daran, daß die
 * Eigentümermenge leer ist. Genau das war die Auflage (A-A-98).
 *
 * ===========================================================================
 * Riegel 2 — „null Waisen" muß von „null gelesenen Dateien" unterscheidbar sein
 * ===========================================================================
 *
 * Ein Lauf, der nur meldet, wie viele Dateien er entfernt hat, sagt bei einer
 * kaputten Verzeichnisabfrage dasselbe wie bei einem sauberen Bestand: null.
 * Das ist die Bauart der dreizehn Wächter, die dieser Bestand deswegen
 * nachschärfen mußte — eine Abwesenheit, die auch dann gemeldet wird, wenn
 * niemand hingesehen hat. Deshalb ist der Rückgabewert kein `number`, sondern
 * {@link OrphanSweepReport}: Er trägt **wie viele Dateien gelesen** wurden, wie
 * viele davon einen Eigentümer haben, wie viele entfernt wurden und — falls er
 * nicht geurteilt hat — **warum nicht**.
 *
 * ===========================================================================
 * Was er ausdrücklich nicht tut
 * ===========================================================================
 *
 *  - **Er hält den Start nicht auf.** Eine Klammer um alle Schritte, eine
 *    `warn`-Zeile, kein Wurf nach außen. Sein Rückgabewert trifft keine
 *    Entscheidung im Aufrufer.
 *  - **Er ist still, wenn nichts liegt.** Gemeldet wird eine Zahl, und nur,
 *    wenn wirklich etwas entfernt oder verweigert wurde. Ein Lauf, der bei jedem
 *    Start meldet, daß er nichts zu tun hatte, wird nach dem dritten Mal nicht
 *    mehr gelesen.
 *  - **Er nennt keinen Namen.** Weder einen erzeugten noch einen Anzeigenamen
 *    noch einen Absender noch einen Pfad. Was hier stünde, käme aus dem Bestand,
 *    und das Protokoll ist kein Ort für Werte daraus (B-2.4). Zahlen genügen.
 */

import { attachmentTargetFileName, isKnownAttachmentKindSet } from '@takt/domain';
import type { BlobRemoval } from '@takt/storage';

import { type Logger, errorKindValue } from '../../logger.ts';

/**
 * Was der Lauf braucht — und sonst nichts.
 *
 * Einzelne Funktionen statt zweier Ports: Damit ist er ohne Datenbank, ohne
 * Dateisystem und ohne laufenden Dienst prüfbar, und die Reihenfolge aus dem
 * Kopf dieser Datei ist am Aufruf abzulesen.
 */
export interface OrphanSweepPorts {
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
  /**
   * Der Ordner, über den dieser Lauf urteilt.
   *
   * `null` heißt: Es gibt keinen. Dann urteilt er nicht — die Gegenfrage nach
   * dem Anfang des Pfades wäre ohne ihn nicht stellbar, und ein Lauf mit einer
   * Gegenfrage weniger ist ein Lauf, der mehr löscht.
   */
  folder(): string | null;
  /** Die Dateien, die in diesem Ordner liegen (nur erzeugte Namen). */
  list(): Promise<readonly string[]>;
  /**
   * Aus einem gefundenen Namen der Wert, unter dem diese Datei entfernt wird.
   *
   * Für eine Bildkopie ist das der **Name**, für eine übernommene E-Mail-Datei
   * der **volle Pfad** — so, wie der jeweilige Adapter ihn beim Entfernen
   * erwartet und wie er in `todo_attachment.target` steht.
   *
   * `null` heißt: Dieser Name kommt für diesen Ordner nicht in Frage. Er wird
   * dann **übergangen** und nicht etwa als Waise behandelt — im Zweifel liegen
   * lassen.
   */
  handleOf(name: string): string | null;
  /**
   * Welche dieser liegenden Dateien nennt der Bestand? (A-A-98.)
   *
   * Die weiteste Bedingung, die einen Eigentümer finden kann. Zurück kommt eine
   * Teilmenge der übergebenen Namen.
   */
  attachmentsNamingFiles(names: readonly string[]): Promise<ReadonlySet<string>>;
  /**
   * Welche Namen erwartet der Bestand in **diesem** Ordner? (A-A-98.)
   *
   * Die erste der beiden Gegenfragen — gestellt am **Anfang** des Pfades und
   * damit auf einer anderen Achse als die Abfrage. Zurück kommen gefaltete
   * Namen ({@link attachmentTargetFileName}).
   */
  attachmentNamesUnder(directory: string): Promise<ReadonlySet<string>>;
  /**
   * Wie viele Anhänge dieser Art führt der Bestand insgesamt?
   *
   * Die zweite Gegenfrage, und die einzige, die gar nicht am `target` hängt.
   * **Pflicht**, aus demselben Grund wie {@link attachmentKinds}.
   */
  claimedCount(): Promise<number>;
  /** Entfernt eine Datei. Mißt die Form des Wertes selbst noch einmal. */
  remove(handle: string): Promise<BlobRemoval>;
}

/**
 * Die Sätze, mit denen **dieser** Lauf spricht.
 *
 * Sie stehen als Werte hier und nicht als Zweige im Verfahren: Ein `if` über
 * „welcher Ordner ist gemeint" im Ablauf wäre der Anfang von zwei Abläufen in
 * einem, und die Doppelung ist genau der Fehler, gegen den diese Datei
 * geschrieben ist.
 */
export interface OrphanSweepVoice {
  /** Der Stamm der Protokollschlüssel, z. B. `attachment_image_sweep`. */
  readonly sweepKey: string;
  /** Der Schlüssel der Erfolgsmeldung, z. B. `attachment_image_orphans_removed`. */
  readonly removedKey: string;
  /** Der Bestand führt andere Anhangsarten als diese Fassung. */
  readonly unknownKinds: string;
  /** Der Ordner läßt sich nicht bestimmen. */
  readonly noFolder: string;
  /** Bestand und Ordner sagen Verschiedenes. */
  readonly contradiction: string;
  /** Ein Schritt hat geworfen. */
  readonly unavailable: string;
  /** Wie viele Dateien entfernt wurden — der einzige Satz mit einer Zahl darin. */
  readonly removed: (count: number) => string;
}

/**
 * Warum der Lauf **nicht** geurteilt hat — oder `null`, wenn er es tat.
 *
 * Ein geschlossener Vorrat und keine Zeichenkette: Wer diesen Wert mißt, soll
 * einen Zweig wählen können und keinen Text vergleichen müssen.
 */
export type OrphanSweepRefusal =
  /** Der Bestand führt andere Anhangsarten als diese Fassung. */
  | 'unknown_kinds'
  /** Es gibt keinen Ordner, über den zu urteilen wäre. */
  | 'no_folder'
  /** Bestand und Ordner sagen Verschiedenes. Der genaue Fall steht im Protokoll. */
  | 'contradiction'
  /** Ein Schritt hat geworfen. Was nicht entfernt wurde, bleibt liegen. */
  | 'unavailable';

/**
 * Was der Lauf getan hat — und **woran** er es getan hat.
 *
 * Der Grund für die Form steht im Kopf dieser Datei unter Riegel 2: Eine Null
 * ohne die Zahl daneben, auf die sie sich bezieht, ist keine Messung.
 */
export interface OrphanSweepReport {
  /** Wie viele Dateien im Verzeichnis überhaupt angesehen wurden. */
  readonly read: number;
  /** Wie viele davon der Bestand einem Anhang zuordnet. */
  readonly owned: number;
  /** Wie viele wirklich entfernt wurden (`failed` zählt nicht mit). */
  readonly removed: number;
  /** `null` heißt: Der Lauf hat geurteilt. Sonst siehe {@link OrphanSweepRefusal}. */
  readonly refused: OrphanSweepRefusal | null;
}

/**
 * Entfernt Dateien ohne Eigentümer aus **einem** Ordner und meldet, woran
 * gemessen wurde.
 *
 * Aufgerufen wird sie nicht unmittelbar, sondern über `sweepOrphanedImages`
 * und `sweepOrphanedEmailFiles` — dort steht, welcher Ordner gemeint ist und
 * warum es ihn gibt.
 */
export async function sweepOrphanedBlobs(
  ports: OrphanSweepPorts,
  voice: OrphanSweepVoice,
  logger: Logger,
): Promise<OrphanSweepReport> {
  let read = 0;
  let owned = 0;
  let removed = 0;

  try {
    /*
     * **Vor allem anderen: Redet dieser Lauf über denselben Bestand?**
     * (A-A-36.) Er steht vor {@link OrphanSweepPorts.list}, obwohl ein
     * `readdir` billiger ist. Der Grund ist nicht die Zeit, sondern die
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
        voice.unknownKinds,
        `${voice.sweepKey}_unknown_kinds kinds=${String(kinds.length)}`,
      );
      return { read: 0, owned: 0, removed: 0, refused: 'unknown_kinds' };
    }

    // **Erst das Verzeichnis, dann der Bestand.** Siehe den Kopf dieser Datei:
    // In dieser Reihenfolge überlebt eine Datei, die zwischen beiden Schritten
    // ihre Zeile bekommt. Das ist kein Stil, das ist der halbe Nachweis.
    const found = await ports.list();
    read = found.length;
    if (read === 0) return { read: 0, owned: 0, removed: 0, refused: null };

    /*
     * Name → Entfernungswert, **bevor** gefragt wird. Ein Name ohne Wert fällt
     * hier heraus und kommt in keiner Richtung wieder vor: Er wird weder
     * gefragt noch entfernt. Im Zweifel liegen lassen.
     *
     * Der Schlüssel ist der **gefaltete** Name — dieselbe Faltung, in der die
     * Gegenfrage nach dem Ordner antwortet. Zwei Faltungen wären zwei Antworten
     * auf dieselbe Frage.
     */
    const candidates = new Map<string, { readonly name: string; readonly handle: string }>();
    for (const name of found) {
      const handle = ports.handleOf(name);
      if (handle !== null) candidates.set(attachmentTargetFileName(name), { name, handle });
    }
    if (candidates.size === 0) return { read, owned: 0, removed: 0, refused: null };

    const owners = await ports.attachmentsNamingFiles(
      [...candidates.values()].map((entry) => entry.name),
    );
    owned = owners.size;

    const orphans = [...candidates.values()].filter((entry) => !owners.has(entry.name));
    if (orphans.length === 0) return { read, owned, removed: 0, refused: null };

    /*
     * =====================================================================
     * Die beiden Gegenfragen — **immer** gestellt, sobald überhaupt etwas
     * fallen würde
     * =====================================================================
     *
     * Nicht erst bei leerer Eigentümermenge. Genau daran hing der alte Riegel
     * in beiden Läufen, und genau deshalb entwaffnete eine einzige passende
     * Zeile ihn für alle anderen (T-313-1): `known.size === 1` hieß, daß er nie
     * gefragt wurde.
     */
    const directory = ports.folder();
    if (directory === null) {
      logger.lifecycle(
        'warn',
        voice.noFolder,
        `${voice.sweepKey}_no_folder files=${String(candidates.size)}`,
      );
      return { read, owned, removed: 0, refused: 'no_folder' };
    }

    const expected = await ports.attachmentNamesUnder(directory);
    const claimed = await ports.claimedCount();

    /*
     * **Erste Achse — der Anfang des Pfades.** Der Bestand nennt einen Namen in
     * diesem Ordner, und dort liegt nichts dieses Namens. Zusammen mit einer
     * Datei, die niemandem gehört, heißt das: Die Zuordnung zwischen Zeile und
     * Datei trifft nicht mehr. Gezählt werden nur Namen, die dieser Ordner
     * überhaupt tragen könnte ({@link OrphanSweepPorts.handleOf}) — ein selbst
     * eingetragener `notes.txt` in diesem Ordner ist für beide Seiten unsichtbar
     * und darf den Lauf nicht auf Dauer blockieren.
     */
    let missing = 0;
    for (const name of expected) {
      if (ports.handleOf(name) !== null && !candidates.has(name)) missing += 1;
    }

    /*
     * **Zweite Achse — ganz ohne Pfad.** Der Bestand führt mehr solche Anhänge,
     * als der Ordner Eigentümer findet. Das ist der Fall, in dem `target` seine
     * Gestalt gewechselt hat, und zugleich der, in dem einer Zeile schlicht ihre
     * Datei fehlt — beide Male trifft die Zuordnung nicht mehr.
     *
     * **Der Vergleich geht gegen `owned` und nicht gegen Null** (T-315). Gegen
     * Null gehalten schwieg dieser Riegel, sobald **eine einzige** Datei noch
     * zugeordnet werden konnte — und genau dieser gemischte Fall war der
     * teuerste: neun Dateien mit Eigentümer fallen, weil die zehnte paßt.
     */
    const unmatched = claimed > owned;

    if (missing > 0 || unmatched) {
      // Zahlen und keine Namen, keine Pfade (B-2.4).
      logger.lifecycle(
        'warn',
        voice.contradiction,
        `${voice.sweepKey}_contradiction files=${String(candidates.size)} ` +
          `owned=${String(owned)} orphans=${String(orphans.length)} ` +
          `expected=${String(expected.size)} missing=${String(missing)} ` +
          `attachments=${String(claimed)}`,
      );
      return { read, owned, removed: 0, refused: 'contradiction' };
    }

    for (const entry of orphans) {
      // `failed` zählt nicht mit: Die Datei liegt weiter da, und der Adapter
      // hat dafür seine eigene Zeile geschrieben. Gezählt wird, was fort ist.
      if ((await ports.remove(entry.handle)) === 'removed') removed += 1;
    }
  } catch (error) {
    /*
     * Keiner der Schritte **soll** werfen — der Adapter beantwortet ein
     * unlesbares Verzeichnis mit einer leeren Liste und einen gescheiterten
     * Löschversuch mit `failed`. Die Klammer steht trotzdem, und sie ist keine
     * Vorsicht, sondern eine Zusage an den Aufrufer: **Dieser Lauf kann den
     * Start nicht verhindern.** Ohne sie hinge das an der Sorgfalt der nächsten
     * Portfassung, und ein Wurf von hier landete im Auffangnetz des gebündelten
     * Sidecars, das `error.message` nach `stderr` schreibt — ausgerechnet dort
     * kann ein Pfad stehen (B-2.4, dieselbe Falle wie in T-132).
     *
     * Die Schritte, die wirklich werfen, sind die Abfragen in ihrer unmöglichen
     * Lage — und sie werfen ausdrücklich, damit hier abgebrochen statt gelöscht
     * wird. Verschluckt wird nichts: Die Zeile sagt, daß abgebrochen wurde, und
     * die Zahlen darunter sagen, wie weit es gekommen war.
     *
     * **Seit T-320 steht auch die Art des Wurfs dabei** (T-318). Bis dahin war
     * es ein `catch` ohne Bindung, und der Grund ging restlos verloren — dabei
     * tragen die beiden Stellen, die wirklich werfen (`imageCount`,
     * `emailFileCount`), einen genauen Satz. B-2.4 verbietet den **Wert** aus
     * dem Bestand, nicht die Art des Fehlers.
     *
     * Was dasteht, ist ein Klassenname, gefaltet und beschnitten
     * ({@link errorKindValue}) — kein Pfad, keine Meldung, kein `errno`. Der
     * rohe `error.constructor.name` ginge hier **nicht**: Er beginnt mit einem
     * Großbuchstaben, `REASON_SHAPE` weist ihn ab, und die ganze Zeile würde zu
     * `unclassified` — samt der beiden Zahlen daneben.
     */
    logger.lifecycle(
      'warn',
      voice.unavailable,
      `${voice.sweepKey}_unavailable files=${String(read)} removed=${String(removed)} ` +
        `reason=${errorKindValue(error)}`,
    );
    return { read, owned, removed, refused: 'unavailable' };
  }

  if (removed > 0) {
    logger.lifecycle('info', voice.removed(removed), `${voice.removedKey} files=${String(removed)}`);
  }
  return { read, owned, removed, refused: null };
}
