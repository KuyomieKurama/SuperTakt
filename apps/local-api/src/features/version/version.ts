/**
 * Takt — die Versionsprüfung läuft **nach der Uhr**, nicht auf Zuruf
 * (E-069, A-V-10, A-V-11, A-V-12, A-18.2, A-18.11).
 *
 * ===========================================================================
 * Warum der naheliegende Entwurf ausgeschlossen ist
 * ===========================================================================
 *
 * Er wäre: Die Oberfläche fragt eine Route, die Route fragt GitHub. Zwei Zeilen
 * weniger — und ein Weg, auf dem ein **fremder** Prozess Takt zum Senden bringt.
 *
 * Der Dienst ist für jeden Prozess auf diesem Rechner erreichbar (R-02, VG-1).
 * Ein Prozess mit dem Sitzungsgeheimnis — und ein Prozess im Benutzerkonto kommt
 * an eine Datei, die die Hülle gelesen hat — könnte die Route in einer Schleife
 * aufrufen. Drei Folgen, alle unerwünscht: Takt wird zum Anfragegenerator; das
 * Lebenszeichen aus R-19 Punkt 3 wird von einem Dritten getaktet statt von
 * Takt; und die 60 Anfragen je Stunde und Quelladresse, die GitHub nicht
 * angemeldeten Aufrufern zugesteht, sind in Sekunden verbraucht.
 *
 * Deshalb: **Der Dienst prüft von sich aus.** Das Ergebnis liegt hier im
 * Arbeitsspeicher. Die Route gibt genau dieses Ergebnis heraus und löst **nie**
 * eine Anfrage aus — auch nicht, wenn noch keines vorliegt; dann lautet die
 * Antwort „noch nichts geprüft", und das ist eine gültige Antwort und kein
 * Fehler.
 *
 * ===========================================================================
 * Der Takt, und was ein Fehlschlag daran ändert
 * ===========================================================================
 *
 * Eine Anfrage je Start, danach höchstens eine je 24 Stunden, mit einem harten
 * Boden von 60 Minuten zwischen zwei ausgehenden Anfragen (A-V-11).
 *
 * Nach einem Fehlschlag wird auf den **Boden** neu geplant, nicht auf den
 * Takt — und vor allem: es wird überhaupt neu geplant. Bis T-273 blieb der
 * Zeitgeber stehen, weil „kein wiederholtes Nachfragen im selben Lauf" als
 * *Programmlauf* gelesen wurde; damit beendete ein einziger Fehlschlag die
 * Versionsprüfung für die gesamte Laufzeit der Anwendung. A-18.11 ist
 * geschärft: „Lauf" ist der einzelne **Prüflauf**. Kein sofortiger zweiter
 * Versuch — das verbietet die Anforderung weiterhin —, aber der gewöhnliche
 * Takt bleibt unberührt.
 *
 * Ein Wiederholungsversuch gegen eine erschöpfte Anfragebegrenzung (T-136-5)
 * bleibt damit ausgeschlossen: Der Boden von einer Stunde ist ein Sechzigstel
 * dessen, was GitHub nicht angemeldeten Aufrufern je Stunde zugesteht, und die
 * Obergrenze bei ununterbrochenem Fehlschlag liegt bei 24 Anfragen je Tag.
 *
 * ===========================================================================
 * Zwei Ergänzungen aus T-279, und beide betreffen den Boden, nicht den Takt
 * ===========================================================================
 *
 * **1. Der Bezugspunkt des Bodens überlebt den Prozeß** — sofern der
 * Zusammenbau einen {@link VersionCheckStorePort} mitgibt (Migration 0022,
 * `app_setting.last_version_check_at`). Vorher lag er ausschließlich hier im
 * Arbeitsspeicher: Ein neu gestarteter Dienst kannte keinen letzten Zeitpunkt,
 * also griff kein Boden, also ging nach dem Startabstand eine Anfrage hinaus.
 * Gemessen (T-276) sind das rund **344 Anfragen je Stunde** für den, der den
 * Sidecar in einer Schleife startet — das 5,7fache des GitHub-Kontingents.
 *
 * Der tragende Grund ist trotzdem nicht dieser Weg: Wer ihn geht, setzt die
 * Zeitmarke auch mit `sqlite3` zurück (VG-3). **Der Bestandswert ist die Abwehr
 * gegen den Unfall, nicht gegen den Angriff**, und er ist vor allem die
 * Gleichbehandlung mit `skipped_version` (A-18.10) und den offenen
 * Inaktivitätsphasen (A-24.7): drei Werte derselben Fläche, drei gleiche
 * Lebensdauern.
 *
 * **2. Auf den Boden kommt ein Streuwert** — 0 bis 25 % obendrauf, also bei 60
 * Minuten höchstens 15 (A-V-11, T-275-8). Er bricht die Gleichschaltung
 * mehrerer Installationen hinter einer Quelladresse, die nach einem gemeinsamen
 * `403` sonst für immer im selben Takt weiterklopfen. Er streut **nur nach
 * oben**: Ein Streuwert, der auch verkürzte, hübe die Zusage aus A-V-11′
 * Punkt 4 auf. Die Obergrenze bleibt deshalb bei **24 je Kalendertag**; der
 * Erwartungswert sinkt auf rund **21,3**.
 *
 * ===========================================================================
 * Warum die erste Anfrage nicht in derselben Millisekunde steht
 * ===========================================================================
 *
 * `START_DELAY_MS` schiebt sie um wenige Sekunden hinter das Hochfahren. Zwei
 * Gründe, und der zweite ist der wichtigere:
 *
 *  1. Der Start ist der volle Augenblick: Migration, Rechteprüfung, Aufräumen
 *    liegengebliebener Exportdateien, Aufgabenbereich. Eine ausgehende
 *    Verbindung dazwischen konkurriert um dieselbe Ereignisschleife.
 *  2. Ein Dienst, der gleich wieder endet — ein Prüflauf, eine Messung, ein
 *    abgebrochener Start —, sendet damit **gar nichts**. Jede Anfrage ist ein
 *    Lebenszeichen (R-19 Punkt 3), und ein Lauf, der keine Sitzung war, soll
 *    keines abgeben. Der Zeitgeber ist `unref()`t; endet der Prozess vorher,
 *    verfällt er, statt gefahren zu werden.
 *
 * „Beim Start" (A-18.2) bleibt damit gewahrt: Es ist dieselbe Startfolge, nur
 * nicht ihr erster Handgriff.
 *
 * ===========================================================================
 * Anhalten
 * ===========================================================================
 *
 * Zeitgeber `unref()`t, laufender Aufruf an einem `AbortController`, den
 * `stop()` auslöst (A-V-12). Sonst hielte ein Netzaufruf, der auf eine Antwort
 * wartet, die Ereignisschleife über die Abschaltfrist hinaus — genau der Weg zu
 * einem verwaisten Sidecar (17.2, B-1.6 Punkt 3).
 */

import type { Logger } from '../../logger.ts';
import { VERSION_CHECK_JITTER_RATIO, versionCheckDelayWithJitter } from '@takt/domain';
import {
  VERSION_CHECK_MAX_BYTES,
  createGithubReleaseSource,
  type ReleaseLookupFailure,
  type ReleaseSourcePort,
} from './source.ts';

/** Abstand zwischen zwei Anfragen im Regelfall (A-V-11). */
export const VERSION_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1_000;

/**
 * Harter Boden zwischen zwei ausgehenden Anfragen (A-V-11), gemessen an der
 * Uhr, die gerade gilt.
 *
 * Seit T-273 ist er zugleich der Abstand, auf den ein **Fehlschlag** neu plant.
 * Das Wort „Lauf" in A-18.11 meint den einzelnen Prüflauf; der Boden gilt
 * darüber hinaus für die ganze Laufzeit des Prozesses und ist die Zusage, daß
 * aus „der nächste Versuch kommt" kein Klopfen wird.
 *
 * Er schützt gegen einen Zeitgeber, der aus irgendeinem Grund öfter feuert —
 * eine zurückgestellte Systemuhr, ein Ruhezustand, ein künftiger zweiter
 * Auslöser, an den heute niemand denkt. Der Takt oben ist die Absicht, dieser
 * Wert ist die Zusage.
 */
export const VERSION_CHECK_MIN_INTERVAL_MS = 60 * 60 * 1_000;

/** Abstand der ersten Anfrage zum Start (Begründung im Kopf dieser Datei). */
export const VERSION_CHECK_START_DELAY_MS = 10_000;

/**
 * Die längste Frist, die Node einem `setTimeout` glaubt.
 *
 * Alles darüber wird **auf 1 ms gekürzt** und mit einer
 * `TimeoutOverflowWarning` quittiert — gemessen: `setTimeout(3.15e10)` feuert
 * nach 2 ms. Die Zahl steht hier als Begründung für den Deckel in
 * {@link createVersionChecker}, nicht als Wert, den jemand einstellt.
 */
const NODE_MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Was der Dienst über die zuletzt veröffentlichte Fassung weiß.
 *
 * Zwei Zustände, nie leer, nie mehrdeutig. `unknown` ist ausdrücklich **kein**
 * Fehlerzustand: „noch nichts geprüft", „nicht erreichbar", „unerwartete
 * Antwort" und „keine Veröffentlichung" sehen von außen gleich aus, und genau
 * das verlangt A-18.11 — kein Hinweis, keine Fehlerfläche. Der Grund steht im
 * Protokoll und geht **nicht** über die Leitung.
 *
 * Was hier **nicht** steht (A-V-14): die installierte Fassung (sie liegt in der
 * Hülle, E-069), ein Verweis, eine Fassungsbeschreibung, ein Name, ein
 * Zeitpunkt. Aus der Antwort von GitHub verlässt genau eine geprüfte
 * Fassungsbezeichnung den Dienst.
 */
export type VersionCheckState =
  | { readonly state: 'unknown' }
  | { readonly state: 'known'; readonly latestVersion: string };

export interface VersionChecker {
  /** Das zuletzt ermittelte Ergebnis. Löst **nie** eine Anfrage aus (A-V-10). */
  current(): VersionCheckState;
  /** Startet den Takt. Ohne diesen Aufruf geht keine einzige Anfrage hinaus. */
  start(): void;
  /** Bricht einen laufenden Aufruf ab und räumt den Zeitgeber weg (A-V-12). */
  stop(): void;
}

/**
 * Wo der Bezugspunkt des harten Bodens liegt, wenn er den Prozeß überleben soll
 * (A-V-11, Migration 0022, T-279).
 *
 * ===========================================================================
 * Warum der Port hier steht und nicht `@takt/storage` heißt
 * ===========================================================================
 *
 * Die Versionsprüfung kennt kein SQL und keine Tabelle. Sie kennt zwei Fragen:
 * „wann war die letzte Anfrage" und „merke dir diese hier". Was daraus wird —
 * eine Spalte in `app_setting`, eine Datei, gar nichts —, entscheidet der
 * Zusammenbau (`composition.ts`), und er ist die einzige Stelle, die beide
 * Seiten kennt.
 *
 * `Date` und nicht `Timestamp`: Der Prüfer hat eine Uhr (`options.now`) und
 * keine Meinung über die Schreibweise eines Zeitstempels. Die Umrechnung in die
 * eine Form, die das Schema annimmt, macht der Adapter.
 *
 * ===========================================================================
 * Was er ausdrücklich nicht ist
 * ===========================================================================
 *
 * **Keine Fläche und keine Auskunft.** Der Wert geht durch keine Route, in
 * keine Antwort und in keine Oberfläche. A-18.11 verbietet „kein Hinweis, keine
 * Fehlerfläche"; ein „zuletzt geprüft" wäre beides.
 *
 * **Keine Abwehr gegen einen feindlichen lokalen Prozeß.** Wer den Sidecar in
 * einer Schleife startet, kommt mit `sqlite3` auch an die gemerkte Zeitmarke
 * (VG-3). Der Port schützt gegen den **Unfall** — den Entwicklerrechner, den
 * zwanzigfachen Doppelklick, eine künftige Neustartautomatik —, und der ist
 * real genug.
 */
export interface VersionCheckStorePort {
  /** Der gemerkte Zeitpunkt als ISO-8601-Zeichenkette, oder `null` für „noch nie". */
  read(): Promise<string | null>;
  /** Merkt den Zeitpunkt einer ausgehenden Anfrage. Wird **vor** der Anfrage gerufen. */
  write(at: Date): Promise<void>;
}

export interface VersionCheckerOptions {
  readonly logger: Logger;
  /** Die Uhr als Port, damit der Boden ohne Zeitmanipulation prüfbar ist. */
  readonly now: () => Date;
  /**
   * Woher die Fassung kommt. Ohne Angabe: die feste Adresse (A-V-1).
   *
   * Der Prüflauf setzt hier seine eigene Abholfunktion ein — die Naht aus
   * E-066 Punkt 1. Sie liegt **im Prozess** und ist von außen nicht
   * erreichbar.
   */
  readonly source?: ReleaseSourcePort;
  readonly startDelayMs?: number;
  readonly intervalMs?: number;
  readonly minIntervalMs?: number;
  /**
   * Wo der Bezugspunkt des Bodens den Prozeß überlebt — **optional**.
   *
   * Ohne Angabe bleibt er im Arbeitsspeicher, und das ist genau das Verhalten
   * bis T-279. Optional ist hier keine Bequemlichkeit, sondern eine Bedingung
   * des Zusammenbaus: `compose()` läuft auch **ohne** Datenbank
   * (`databaseLocation` fehlt — so laufen `proof:openapi` und
   * `proof:route-policy`). Es gibt dann keinen Bestand, an dem etwas hängen
   * könnte, und einen zu erfinden wäre schlimmer als keiner.
   */
  readonly store?: VersionCheckStorePort;
  /**
   * Woher der Streuwert auf den Boden kommt (A-V-11, T-275-8). Ohne Angabe
   * `Math.random`.
   *
   * ===========================================================================
   * Warum `Math.random` hier genügt — und warum der Satz nötig ist
   * ===========================================================================
   *
   * An drei anderen Stellen dieses Bestands steht das Gegenteil, und zwar zu
   * Recht: `access/token.ts` („Ausdrücklich nicht: `Math.random`"),
   * `sqlite/ids.ts` und `taskpane/certificate.ts`, wo bis T-066 tatsächlich
   * `Math.random()` stand und ein Fehler war. Wer diese Zeile liest, ohne den
   * Unterschied zu kennen, hält sie für denselben Fehler ein viertes Mal.
   *
   * Der Unterschied ist nicht die Qualität der Quelle, sondern die Frage, was
   * ein Ratender gewinnt. Ein geratenes Token ist Zugriff; eine geratene
   * Seriennummer ist ein zweites Zertifikat. **Ein geratener Aufschlag von
   * höchstens 15 Minuten ist gar nichts:** Er ist kein Geheimnis, er schützt
   * keinen Zugang, und wer ihn vorhersagt, weiß, wann eine Anfrage an GitHub
   * hinausgeht, die ohnehin jede Stunde hinausgeht. Die Aufgabe des Werts ist
   * ausschließlich, mehrere Installationen **auseinanderlaufen** zu lassen, und
   * dafür genügt jede Quelle, die je Prozeß verschieden anfängt — was
   * `Math.random` in Node tut, weil es beim Start aus dem Betriebssystem
   * gesetzt wird.
   *
   * Der Port ist trotzdem da, und nicht wegen der Qualität: Er ist die Naht,
   * an der ein Prüffall die Ränder (0 und 1) ansteuert, statt sie
   * auszuwürfeln.
   */
  readonly random?: () => number;
}

/**
 * Baut den Prüfer. **Er tut nichts, bis `start()` gerufen wird.**
 *
 * Das ist die Eigenschaft, an der die Nachweispfade und die Einheitentests
 * hängen: `compose()` baut den Dienst, und dabei geht keine Verbindung nach
 * außen. Wer eine Anfrage will, muss sie ausdrücklich anstoßen — und das tut
 * genau eine Stelle, nämlich `main.ts`.
 */
export function createVersionChecker(options: VersionCheckerOptions): VersionChecker {
  const source = options.source ?? createGithubReleaseSource();
  const startDelayMs = options.startDelayMs ?? VERSION_CHECK_START_DELAY_MS;
  const intervalMs = options.intervalMs ?? VERSION_CHECK_INTERVAL_MS;
  const minIntervalMs = options.minIntervalMs ?? VERSION_CHECK_MIN_INTERVAL_MS;
  const random = options.random ?? Math.random;

  let state: VersionCheckState = { state: 'unknown' };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let stopped = false;
  let lastRequestAt: number | null = null;
  const control = new AbortController();

  /*
   * Der Bestandswert (T-279). `null` heißt „es gibt keinen" — entweder wurde
   * keiner mitgegeben (kein Bestand im Zusammenbau), oder er hat einmal
   * versagt und ist danach abgelegt worden.
   *
   * **Ein Fehlschlag der Speicherung darf die Versionsprüfung nicht beenden.**
   * Sie tut dann, was sie bis T-279 immer getan hat: Sie merkt sich den
   * Zeitpunkt im Arbeitsspeicher. Das ist ein schlechterer Boden, aber ein
   * Boden.
   */
  let store: VersionCheckStorePort | null = options.store ?? null;
  let restored = false;

  function forgetStore(sentence: string, key: string): void {
    store = null;
    // Genau **eine** Zeile über die ganze Laufzeit: Danach gibt es keinen
    // Speicher mehr, der ein zweites Mal versagen könnte. `info` und nicht
    // `warn` — der Betrieb ist ungestört, und `proof:access` Abschnitt 0e mißt,
    // daß im Normalfall keine Warnung erscheint.
    options.logger.lifecycle('info', sentence, key);
  }

  /**
   * Holt den Bezugspunkt **einmal** aus dem Bestand — beim ersten Prüflauf.
   *
   * Nicht beim Bauen: `compose()` öffnet die Datenbank, bevor `main.ts` die
   * Migrationen fährt. Ein Lesen im Zusammenbau liefe gegen ein Schema ohne die
   * Spalte aus 0022.
   *
   * Ein unbrauchbarer gespeicherter Wert heißt „noch nie gefragt" und führt zu
   * keinem Wurf — dieselbe Regel wie bei der übersprungenen Fassung (T-136-4).
   * Die konservative Richtung ist hier ausdrücklich die andere als dort: Ein
   * unlesbarer Wert öffnet den Boden für **eine** Anfrage, statt ihn für immer
   * zu schließen.
   */
  async function restore(): Promise<void> {
    if (restored || store === null) return;
    restored = true;
    try {
      const stored = await store.read();
      if (stored === null) return;
      const parsed = Date.parse(stored);
      if (Number.isFinite(parsed) && lastRequestAt === null) lastRequestAt = parsed;
    } catch {
      forgetStore(
        'Der Zeitpunkt der letzten Versionsprüfung ließ sich nicht lesen. SuperTakt läuft unverändert weiter.',
        'version_check_state_unreadable',
      );
    }
  }

  /**
   * Merkt den Zeitpunkt einer ausgehenden Anfrage — im Arbeitsspeicher **und**
   * im Bestand.
   *
   * **Wirft nie.** Der Aufrufer steht zwischen `inFlight = true` und dem
   * `try`/`finally`, das es zurücksetzt; ein Wurf von hier ließe den Prüfer für
   * die Laufzeit des Prozesses als „gerade beschäftigt" stehen.
   */
  async function remember(at: Date): Promise<void> {
    lastRequestAt = at.getTime();
    if (store === null) return;
    try {
      await store.write(at);
    } catch {
      forgetStore(
        'Der Zeitpunkt der letzten Versionsprüfung ließ sich nicht merken. SuperTakt läuft unverändert weiter.',
        'version_check_state_unwritable',
      );
    }
  }

  /** Eine Ziehung in `[0, 1)`. Eine kaputte Quelle ergibt 0 und damit den blanken Boden. */
  function drawUnit(): number {
    try {
      return random();
    } catch {
      return 0;
    }
  }

  /**
   * Plant auf den **Boden plus Streuwert** (A-V-11, T-275-8, T-279).
   *
   * Jede Planung, die am Boden hängt, geht hier durch: der Fehlschlagzweig, die
   * Auffangklammer, der zu frühe Zeitgeberschlag und der Rücksprung der Uhr.
   * Die Planung auf den **Takt** nach einem Erfolg geht ausdrücklich **nicht**
   * hier durch — sie läuft einmal am Tag, kommt nie in Phase mit anderen
   * Installationen und braucht den Aufschlag nicht.
   *
   * Die Regel selbst steht in `packages/domain/src/version.ts`. Hier steht nur,
   * wann sie gilt; dort steht, was sie zusagt, und dort ist sie ohne Zeitgeber
   * und ohne laufenden Dienst meßbar.
   */
  function scheduleFloor(remainingMs: number): void {
    schedule(versionCheckDelayWithJitter(remainingMs, minIntervalMs, drawUnit()));
  }

  /**
   * Stellt den Zeitgeber — **gedeckelt** und nie kürzer als ein Herzschlag
   * (T-143 S-3).
   *
   * ===========================================================================
   * Was ohne den Deckel geschah, und warum es ausgerechnet hier geschah
   * ===========================================================================
   *
   * `run()` rechnet `elapsed = jetzt − lastRequestAt` und plant bei zu kurzem
   * Abstand auf `minIntervalMs − elapsed`. Springt die **Wanduhr zurück** —
   * leere CMOS-Batterie, wiederhergestellter Schnappschuß einer virtuellen
   * Maschine, ein von Hand verstelltes Datum —, wird `elapsed` negativ, und
   * die Frist wächst um denselben Betrag.
   *
   * Bei einem Rücksprung über rund 25 Tage überschreitet sie `2^31−1`
   * Millisekunden. Node **kürzt dann auf 1 ms** und schreibt eine
   * `TimeoutOverflowWarning` — gemessen: `setTimeout(3.15e10)` feuert nach
   * **2 ms**. `run()` rechnet dasselbe noch einmal aus, plant wieder auf 1 ms,
   * und der Sidecar läuft mit rund tausend Durchgängen je Sekunde, jeder mit
   * einer Warnung auf `stderr` — also auf dem Kanal, auf dem das Protokoll
   * liegt.
   *
   * Ausgehende Anfragen gingen dabei **keine** hinaus; der Boden aus A-V-11
   * hielt. Aber das war Glück und keine Bauart: Der Kommentar an
   * {@link VERSION_CHECK_MIN_INTERVAL_MS} nennt „eine zurückgestellte
   * Systemuhr" ausdrücklich als den Fall, gegen den der Boden geschrieben ist,
   * und genau dort verhielt er sich falsch.
   *
   * ===========================================================================
   * Zwei Grenzen, und beide sind hier und nicht bei den Aufrufern
   * ===========================================================================
   *
   * **Nach oben die längste Frist, die dieser Prüfer selbst kennt** — also der
   * Takt oder der Boden, je nachdem, welcher größer ist. Beide sind
   * einstellbar, und ein Prüffall setzt den Boden durchaus **über** den Takt
   * („die Uhr steht"); der Deckel darf ihm das nicht wegnehmen, sonst
   * verhinderte er genau die Wirkung, die er messen soll.
   *
   * Jede Zahl über dieser Grenze ist ein Rechenfehler oder eine verstellte
   * Uhr, und {@link NODE_MAX_TIMEOUT_MS} ist damit unerreichbar, solange
   * niemand einen Takt von 24 Tagen einstellt.
   *
   * **Nach unten nur die Null.** Ein Boden auf eine Sekunde wäre die
   * naheliegende zweite Grenze und die falsche: Er machte aus jedem
   * eingestellten Startabstand unter einer Sekunde einen von einer Sekunde und
   * bräche damit jede Messung, die kurze Fristen setzt — eine Grenze, die den
   * Prüffall verstellt, statt den Fehler zu verhindern. Der Fehler selbst
   * entsteht nicht unten, sondern **oben**, und die Ursache dafür — ein
   * negatives `elapsed` — ist in `run()` beseitigt, wo sie entsteht.
   *
   * Der Deckel steht **hier**, an der einen Stelle, durch die jede Planung
   * geht. An den vier Aufrufern stünde er viermal, und der fünfte hätte ihn
   * nicht.
   */
  function schedule(delayMs: number): void {
    if (stopped) return;
    if (timer !== null) clearTimeout(timer);
    /*
     * Der zweite Deckel ist nicht Zierrat: Ein Takt von 30 Tagen ist
     * einstellbar und überschritte `2^31−1` von selbst — ohne verstellte Uhr,
     * ohne Rechenfehler, und mit demselben Ausgang (Kürzung auf 1 ms).
     */
    /*
     * Der Streuwert gehört **in** den Deckel und nicht darunter (T-279).
     *
     * Ohne den zweiten Summanden nähme der Deckel dem Aufschlag genau dort die
     * Wirkung, wo der Boden über dem Takt steht — der Fall „die Uhr steht" aus
     * dem Prüffall. Er schnitte auf `max(Takt, Boden)` zurück; die Frist bliebe
     * gültig und der Streuwert wäre still verschwunden. Ein Deckel, der eine
     * Zusage lautlos aufhebt, ist schlimmer als keiner.
     *
     * Der Wert ist die größte Frist, die {@link scheduleFloor} überhaupt
     * erzeugen kann: Der Grundwert liegt nie über dem Boden, der Aufschlag nie
     * über `VERSION_CHECK_JITTER_RATIO × Boden`.
     */
    const ceiling = Math.min(
      Math.max(intervalMs, minIntervalMs) + Math.max(minIntervalMs, 0) * VERSION_CHECK_JITTER_RATIO,
      NODE_MAX_TIMEOUT_MS,
    );
    const bounded = Math.min(Math.max(delayMs, 0), ceiling);
    // `unref()`: Eine anstehende Prüfung hält die Ereignisschleife nicht am
    // Leben. Ist der Dienst fertig, endet er, ohne auf sie zu warten.
    timer = setTimeout(() => {
      timer = null;
      void run();
    }, bounded);
    timer.unref();
  }

  async function run(): Promise<void> {
    if (stopped || inFlight) return;

    /*
     * Der Bezugspunkt aus dem Bestand, genau einmal je Prozeßlauf (T-279).
     *
     * Er steht **vor** der Rechnung darunter, weil er sonst nichts bewirkte:
     * Der allererste Prüflauf nach einem Neustart ist genau der, bei dem
     * `lastRequestAt` noch `null` ist — und genau der ging bis T-279 ohne Boden
     * hinaus.
     *
     * Das `await` ist die einzige Unterbrechung vor dem Boden; ein `stop()`
     * kann hineinfallen, deshalb die zweite Abfrage.
     */
    await restore();
    if (stopped) return;

    // Der harte Boden. Er ist kein zweites Mal derselbe Takt: Er greift auch
    // dann, wenn der Zeitgeber aus einem Grund früher feuert, den hier niemand
    // vorhergesehen hat.
    const elapsed = lastRequestAt === null ? Infinity : options.now().getTime() - lastRequestAt;

    /*
     * **Die Uhr ist zurückgesprungen** (T-143 S-3).
     *
     * `elapsed < 0` heißt nicht „die letzte Anfrage liegt in der Zukunft",
     * sondern „die Wanduhr sagt jetzt etwas anderes als vorhin". Der gemerkte
     * Zeitpunkt ist damit **wertlos**: Er bezieht sich auf eine Uhr, die es
     * nicht mehr gibt.
     *
     * Ihn stehenzulassen und `minIntervalMs − elapsed` zu warten hieße, den
     * Rücksprung abzuwarten — bei einem Sprung auf 2015 also zehn Jahre, was
     * nach dem Deckel in {@link schedule} zwar keine Endlosschleife mehr wäre,
     * aber eine Versionsprüfung, die in diesem Lauf nichts mehr täte, ohne daß
     * es jemand erführe.
     *
     * Also wird der Bezugspunkt **neu genommen** und der volle Boden gewartet.
     * Der Boden aus A-V-11 bleibt damit gewahrt: Zwischen zwei ausgehenden
     * Anfragen liegt weiterhin mindestens `minIntervalMs` **nach der Uhr, die
     * gerade gilt**. Mehr ist gegen eine verstellte Uhr nicht zu haben — eine
     * monotone Quelle wäre die richtige Antwort und ist hier keine: `now()`
     * ist der Port, an dem der Boden prüfbar ist, und `performance.now()`
     * überlebt keinen Neustart.
     *
     * Der Rücksprung steht im Protokoll, weil er sonst als Fehlen einer
     * Prüfung auffiele und nicht als das, was er ist. Der Schlüssel gehört zu
     * demselben geschlossenen Vorrat wie jeder andere; ein Wert aus der Uhr
     * steht nicht darin.
     */
    if (elapsed < 0) {
      options.logger.lifecycle(
        'info',
        'Die Systemuhr ist zurückgestellt worden. Die Versionsprüfung nimmt ihren Bezugspunkt neu.',
        'version_check_clock_moved_backwards',
      );
      await remember(options.now());
      scheduleFloor(minIntervalMs);
      return;
    }

    if (elapsed < minIntervalMs) {
      scheduleFloor(minIntervalMs - elapsed);
      return;
    }

    inFlight = true;
    /*
     * **Gemerkt wird vor der Anfrage, nicht danach** (T-279).
     *
     * Danach wäre der naheliegende Ort und der falsche: Ein Absturz **während**
     * der Anfrage — und die kann bis zur Frist dauern — ließe den Bestand ohne
     * Zeitmarke zurück, und der nächste Start ginge ohne Boden hinaus. Das ist
     * dieselbe Lücke eine Ebene tiefer und schwerer zu sehen als die, die
     * Migration 0022 schließt.
     *
     * Der Preis ist benannt: Eine Anfrage, die gar nicht erst zustande kommt,
     * verbraucht trotzdem einen Boden. Das ist die richtige Richtung — sie
     * ging hinaus, oder sie hätte hinausgehen sollen; beides ist ein Versuch.
     */
    await remember(options.now());
    try {
      const lookup = await source.latest(control.signal);
      if (stopped) return;

      if (lookup.ok) {
        state = { state: 'known', latestVersion: lookup.version };
        schedule(intervalMs);
        return;
      }

      /*
       * **Ein Fehlschlag ist still — und er ist nicht das Ende** (A-18.11 in
       * der geschärften Fassung, T-273).
       *
       * Still bleibt alles: kein Hinweis, keine Fehlerfläche, kein Zeitstempel
       * „zuletzt geprüft", keine Schaltfläche „Jetzt prüfen". Der Zustand
       * bleibt `unknown`, der Grund steht allein im Protokoll.
       *
       * Was sich geändert hat, ist der Zeitgeber. Er blieb bis T-273 **stehen**,
       * weil „kein wiederholtes Nachfragen im selben Lauf" als *Programmlauf*
       * gelesen wurde. Damit beendete ein einziger Fehlschlag die
       * Versionsprüfung für die gesamte Laufzeit — und der häufigste Fall ist
       * banal: Die Anwendung startet schneller als das Netz (WLAN noch nicht
       * verbunden, VPN noch nicht oben, DNS noch nicht da). Bei einer
       * Anwendung, die tagelang offen bleibt, heißt „nicht in diesem Lauf"
       * dann faktisch **nie**; T-143 hat genau das als Hinweis notiert.
       *
       * „Lauf" ist der einzelne **Prüflauf**. Also: kein zweiter Versuch in
       * diesem Prüflauf — aber der gewöhnliche Takt läuft weiter, und zwar auf
       * dem **Boden**, nicht auf dem Takt. `minIntervalMs` statt `intervalMs`
       * ist Absicht: Ein Netz, das beim Start noch nicht da war, ist in einer
       * Stunde vermutlich da, und 24 Stunden zu warten hieße, den gemeldeten
       * Fall nur langsamer zu wiederholen. Der Boden aus A-V-11 bleibt dabei
       * unangetastet — er ist derselbe Wert, und `run()` mißt ihn beim nächsten
       * Durchgang ohnehin ein zweites Mal an der Uhr, die dann gilt.
       *
       * Die Obergrenze, die daraus folgt, ist gerechnet und nicht geschätzt:
       * bei ununterbrochenem Fehlschlag höchstens **24** ausgehende Anfragen je
       * 24 Stunden gegen 1 im Erfolgsfall. GitHub gesteht nicht angemeldeten
       * Aufrufern 60 je Stunde und Quelladresse zu; eine je Stunde ist ein
       * Sechzigstel davon.
       */
      if (lookup.reason !== 'aborted') {
        report(options.logger, lookup.reason, lookup.statusCode);
      }
      scheduleFloor(minIntervalMs);
    } catch {
      /*
       * Der Port sagt zu, nicht zu werfen. Diese Klammer ist der Boden
       * darunter: Ein Wurf aus einer künftigen Abholfunktion soll die
       * Versionsprüfung beenden und nicht den Dienst. Es wird ausdrücklich
       * **nichts** aus dem Wurf gelesen — kein `message`, kein Stapel; die
       * Zeile im Protokoll trägt denselben geschlossenen Schlüsselvorrat wie
       * jeder andere Fehlschlag.
       *
       * Auch hier wird neu geplant. Ein Wurf ist ein Fehlschlag wie jeder
       * andere, und A-18.11 unterscheidet sie nicht: Er beendet den **Prüflauf**
       * und nicht die Prüfung. `schedule()` prüft `stopped` selbst.
       */
      if (!stopped) report(options.logger, 'unreachable');
      scheduleFloor(minIntervalMs);
    } finally {
      inFlight = false;
    }
  }

  return {
    current: () => state,

    start(): void {
      if (stopped) return;
      schedule(startDelayMs);
    },

    stop(): void {
      stopped = true;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      // Bricht einen laufenden `fetch` samt Lesen des Rumpfes ab. Ohne ihn
      // hielte eine Antwort, auf die noch gewartet wird, das Anhalten auf.
      control.abort();
    },
  };
}

/**
 * Der Satz für den Menschen und der Schlüssel für den, der die Zeile später
 * auswertet — dieselbe Bauart wie die Startabbrüche aus T-132.
 *
 * Rein und ohne laufenden Dienst prüfbar: ein Schlüssel herein, ein Satz und
 * ein Grund heraus. In keiner der beiden Hälften steht ein Pfad, ein
 * Geheimnis, eine Adresse oder eine fremde Zeichenkette; alle Texte sind
 * Konstanten, und der Grund ist ein Schlüssel aus einem geschlossenen Vorrat,
 * höchstens ergänzt um eine Zahl (A-V-20).
 */
export function describeVersionCheckFailure(
  reason: ReleaseLookupFailure,
  statusCode?: number,
): { readonly sentence: string; readonly key: string } {
  switch (reason) {
    case 'timeout':
      return {
        sentence:
          'Die Versionsprüfung hat innerhalb der Frist keine Antwort bekommen. SuperTakt läuft unverändert weiter.',
        key: 'version_check_timeout',
      };
    case 'redirect':
      return {
        sentence:
          'Die Versionsprüfung wurde auf eine andere Adresse verwiesen. SuperTakt folgt dem nicht und läuft unverändert weiter.',
        key: 'version_check_redirect',
      };
    case 'status':
      return {
        sentence:
          'Die Versionsprüfung hat eine unerwartete Antwort bekommen. SuperTakt läuft unverändert weiter.',
        key: isHttpStatus(statusCode)
          ? `version_check_status code=${String(statusCode)}`
          : 'version_check_status',
      };
    case 'no_release':
      return {
        sentence: 'Es liegt keine veröffentlichte Fassung vor. SuperTakt läuft unverändert weiter.',
        key: 'version_check_no_release',
      };
    case 'too_large':
      return {
        /*
         * Der Satz nennt seit T-146 die **Folge** und nicht nur den Vorgang
         * (Befund T-145-3): Wer „wurde verworfen. Takt läuft unverändert
         * weiter" liest, hält das für eine Kleinigkeit. Tatsächlich ist die
         * Versionsprüfung dieses Erzeugnisses damit **dauerhaft** ohne
         * Ergebnis — jeder Lauf liest dieselbe zu große Antwort, und
         * „unbekannt" sieht von außen genauso aus wie „alles aktuell".
         *
         * Der Wert steht nicht darin, die Grenze schon: Sie ist eine
         * Konstante dieses Erzeugnisses und kein Ausschnitt einer fremden
         * Antwort (B-2.4).
         */
        sentence:
          `Die Antwort der Versionsprüfung war größer als ${String(VERSION_CHECK_MAX_BYTES)} Bytes und wurde verworfen. ` +
          'Die Versionsprüfung liefert damit dauerhaft kein Ergebnis; SuperTakt läuft unverändert weiter.',
        key: 'version_check_too_large',
      };
    case 'malformed':
      return {
        sentence:
          'Die Antwort der Versionsprüfung war nicht auswertbar. SuperTakt läuft unverändert weiter.',
        key: 'version_check_malformed',
      };
    case 'aborted':
      return {
        sentence: 'Die Versionsprüfung wurde beim Anhalten des Dienstes abgebrochen.',
        key: 'version_check_aborted',
      };
    case 'unreachable':
    default:
      return {
        sentence: 'Die Versionsprüfung konnte GitHub nicht erreichen. SuperTakt läuft unverändert weiter.',
        key: 'version_check_unreachable',
      };
  }
}

/**
 * Ein Statuscode und nichts sonst.
 *
 * Ganzzahlig und zwischen 100 und 599 — was das nicht erfüllt, kommt nicht in
 * die Protokollzeile. Damit kann aus diesem Feld weder ein Text noch eine
 * Länge werden, die jemand nicht erwartet hat.
 */
function isHttpStatus(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 599;
}

function report(logger: Logger, reason: ReleaseLookupFailure, statusCode?: number): void {
  const described = describeVersionCheckFailure(reason, statusCode);
  // `info` und nicht `warn`: Ein folgenloser Fehlschlag ist keine Störung des
  // Betriebs, und `proof:access` Abschnitt 0e misst, dass im Normalfall keine
  // Warnung erscheint.
  logger.lifecycle('info', described.sentence, described.key);
}
