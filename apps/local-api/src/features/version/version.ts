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
 * Ein Programmstart prüft immer einmal; der Boden gilt innerhalb des Laufs
 * ===========================================================================
 *
 * **1. Die erste Prüfung eines Prozeßlaufs hält nichts auf** (T-285). A-V-11
 * sagt: „zwischen zwei ausgehenden Anfragen liegt mindestens `minIntervalMs`"
 * — eine Aussage über den **Betrieb**, nicht über Prozeßgrenzen. Beim ersten
 * Prüflauf eines Starts gibt es in diesem Prozeß keine vorige Anfrage, also
 * hält kein Boden, also geht nach dem Startabstand eine Anfrage hinaus. Jede
 * **weitere** Planung desselben Laufs hält den Boden wie eh und je, samt
 * Streuwert.
 *
 * T-279 hatte das anders gebaut: Der Bezugspunkt wurde beim ersten Prüflauf aus
 * dem Bestand geholt, und damit reichte der Boden über den Neustart hinweg. Den
 * Preis dafür hat ein Prüffall gefunden (TP-VER-11) und der Benutzer bezahlt:
 * **Ein Neustart bewirkte bis zu eine Stunde lang gar nichts.** Verschärfend,
 * weil der Bezugspunkt **vor** der Anfrage geschrieben wird — richtig so, sonst
 * umginge ein Absturz ihn —, setzte ihn auch ein *fehlgeschlagener* Versuch:
 * Start ohne Netz um 9:00, Neustart um 9:10, keine Prüfung bis 10:00. Der
 * Neustart ist die einzige Selbsthilfe, die dieses Erzeugnis gegen „die
 * Versionsprüfung greift nicht" anbietet — E-069 kennt keinen Knopf „jetzt
 * prüfen" —, und sie war damit stillgelegt.
 *
 * **Was der gespeicherte Wert seither ist, und was nicht** (Migration 0022,
 * `app_setting.last_version_check_at`): Er wird weiter geschrieben, vor jeder
 * ausgehenden Anfrage, und er nimmt am Round-Trip der Datensicherung teil
 * (A-20.4). Er ist eine **Tatsache** — „wann wurde zuletzt gefragt" — und
 * **keine Sperre über Prozeßgrenzen**. Gelesen wird er von keinem Betriebspfad
 * mehr; wer ihn wieder liest, um eine Anfrage zu verhindern, baut T-279 nach
 * und nimmt dem Benutzer denselben Hebel ein zweites Mal.
 *
 * **2. Auf den Boden kommt ein Streuwert** — 0 bis 25 % obendrauf, also bei 60
 * Minuten höchstens 15 (A-V-11, T-275-8). Er bricht die Gleichschaltung
 * mehrerer Installationen hinter einer Quelladresse, die nach einem gemeinsamen
 * `403` sonst für immer im selben Takt weiterklopfen. Er streut **nur nach
 * oben**: Ein Streuwert, der auch verkürzte, hübe die Zusage aus A-V-11′
 * Punkt 4 auf.
 *
 * ===========================================================================
 * Die Zahlen, damit sie der nächste Leser nicht schätzt (T-285, neu gerechnet)
 * ===========================================================================
 *
 * **Innerhalb eines Laufs** bleibt alles, wie es war: 1 Anfrage je 24 Stunden
 * im Erfolgsfall, höchstens **24 je Kalendertag** bei ununterbrochenem
 * Fehlschlag, Erwartungswert mit Streuwert rund **21,3**.
 *
 * **Über Prozeßgrenzen hinweg gilt diese Obergrenze nicht.** Jeder
 * Programmstart bringt genau eine Anfrage mit; die Obergrenze eines
 * Kalendertages ist damit `24 + Anzahl der Starts an diesem Tag`. Für einen
 * Benutzer, der die Anwendung morgens startet und abends beendet, sind das
 * 25 — für den Grenzfall der Startschleife die aus T-276 gemessenen rund
 * **344 je Stunde** (kürzester vollständiger Zyklus 10 474 ms), also rund
 * **8 250 je Kalendertag** und das 5,7fache dessen, was GitHub nicht
 * angemeldeten Aufrufern je Stunde zugesteht.
 *
 * Dieser Grenzfall ist mit der Entscheidung zu T-285 **in Kauf genommen**, und
 * zwar mit Begründung: Wer den Sidecar in einer Schleife startet, setzt eine
 * Zeitmarke im Bestand ohnehin mit `sqlite3` zurück (VG-3). Der Bestandswert
 * war die Abwehr gegen den Unfall, nicht gegen den Angriff — und ihr Preis war
 * die einzige Selbsthilfe des Benutzers.
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
 *
 * ===========================================================================
 * Auf dem Weg zur Anfrage wird auf nichts gewartet (A-A-106, T-349)
 * ===========================================================================
 *
 * Bis T-349 stand `await remember(…)` vor `await source.latest(…)`. Ein Wurf
 * war behandelt, ein **Nie-Eintreffen** nicht: Ein Speicher, dessen Zusage nie
 * einlöst, ließ `inFlight` auf wahr stehen, stellte keinen Zeitgeber und
 * beendete die Versionsprüfung für die Laufzeit des Prozesses — **ohne eine
 * Zeile im Protokoll**. Das ist stiller als jeder Fehlschlag und war damit der
 * bequemste Ausschalter dieses Erzeugnisses (T-332 K-1, Bedrohungsmodell 42.4,
 * R-30).
 *
 * Seither gilt: **Im Rumpf, in dem die Anfrage steht, gibt es genau ein
 * `await` — die Anfrage selbst.** Sie trägt ihre eigene Gesamtfrist (A-V-5) und
 * den `AbortController` aus `stop()`. Alles andere auf diesem Weg ist synchron;
 * das Schreiben in den Bestand wird angestoßen und nicht abgewartet.
 *
 * Das ist die ganze Zusage, und sie ist mit Absicht **eine über den Weg** und
 * nicht eine über den Speicher. Ein Wächter kann die Menge derer eng ziehen,
 * die ein Versprechen geben dürfen; solange der Weg auf eines wartet, ist jeder
 * von ihnen ein Ausschalter. `proof:release-safety` mißt sie mit 6g-1 in beide
 * Richtungen: jedes weitere `await` in diesem Rumpf ist ein Befund, und
 * verschwindet das `await` an der Anfrage selbst, ist auch das einer — dann
 * mißt der Leser nichts mehr.
 *
 * **Und seit T-360 gilt der Satz für den Weg statt für diesen einen Rumpf**
 * (Befund T-356). „In dem Rumpf, in dem die Anfrage steht" war eine Zusage über
 * eine Stelle: Wer die Anfrage in eine örtliche Hilfsfunktion schiebt,
 * verschiebt den gemessenen Rumpf mit und stellt sein hängendes `await` in
 * `run()` — `tsc` Exit 0, der Lauf grün, **0 statt 40** ausgehende Anfragen.
 * Gemessen wird deshalb der ganze Weg vom `setTimeout`-Rückruf bis hierher, und
 * dazu die **Schleife**: Ein Riegel, der synchron nicht zurückkehrt, hält alles
 * an, ohne je zu warten (A-A-125). Was das **nicht** schließt, steht als
 * benannte Lücke im Nachweis — ein fremder Aufruf, der synchron nicht
 * zurückkehrt, hat keine Schleife, sondern einen Namen.
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
 * **Für die Laufzeit des Prozesses — und nicht darüber hinaus** (T-285). Die
 * erste Anfrage eines Starts hält er nicht auf: In diesem Prozeß gibt es dann
 * keine vorige Anfrage, und A-V-11 spricht vom Abstand **zwischen zwei**
 * ausgehenden Anfragen. Zwischen T-279 und T-285 reichte er über den Neustart
 * hinweg und machte damit jeden Neustart bis zu eine Stunde lang wirkungslos.
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
 * Die Frist, nach der ein Schreiben in den Bestand als „kommt nicht mehr" gilt
 * (A-A-106, T-349).
 *
 * **Sie hält nichts auf.** Der Weg zur ausgehenden Anfrage wartet seit T-349
 * auf kein Schreiben mehr (Begründung bei `remember` in
 * {@link createVersionChecker}). Diese Frist entscheidet allein darüber, wann
 * aus dem Schweigen eines Speichers **eine Zeile im Protokoll** wird — und daß
 * der Speicher danach abgelegt ist, statt bei jeder Prüfung ein neues
 * Versprechen offenzulassen.
 *
 * Dieselbe Zahl wie die Gesamtfrist der ausgehenden Anfrage (A-V-5,
 * `VERSION_CHECK_TIMEOUT_MS`), und aus demselben Grund: Was länger braucht als
 * der ganze Gang über das Netz, ist kein langsamer Schreibzugriff mehr. Der
 * gebaute Adapter schreibt synchron im Aufruf; im Betrieb läuft diese Frist
 * nie ab.
 */
export const VERSION_CHECK_STORE_DEADLINE_MS = 5_000;

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
 * Wohin der Zeitpunkt der letzten Anfrage geht (Migration 0022,
 * `app_setting.last_version_check_at`, A-20.4, T-279, T-285).
 *
 * ===========================================================================
 * Was der Wert ist — und was er seit T-285 ausdrücklich nicht mehr ist
 * ===========================================================================
 *
 * Er ist eine **Tatsache**: „wann hat dieses Erzeugnis zuletzt gefragt". Er
 * wird vor jeder ausgehenden Anfrage geschrieben und nimmt am Round-Trip der
 * Datensicherung teil (A-20.4, `repo-data-archive.ts`).
 *
 * Er ist **keine Sperre über Prozeßgrenzen**. Bis T-285 wurde er beim ersten
 * Prüflauf gelesen und hielt den Boden über einen Neustart hinweg; genau das
 * hat dem Benutzer seine einzige Selbsthilfe genommen, wenn die Prüfung nicht
 * greift (Begründung im Kopf dieser Datei). Deshalb hat dieser Port **kein
 * `read`**: Der Prüfer schreibt, er liest nicht. Wer hier ein Lesen wieder
 * anhängt, baut T-279 nach.
 *
 * ===========================================================================
 * Warum der Port hier steht und nicht `@takt/storage` heißt
 * ===========================================================================
 *
 * Die Versionsprüfung kennt kein SQL und keine Tabelle. Sie kennt einen Satz:
 * „merke dir diesen Zeitpunkt". Was daraus wird — eine Spalte in
 * `app_setting`, eine Datei, gar nichts —, entscheidet der Zusammenbau
 * (`composition.ts`), und er ist die einzige Stelle, die beide Seiten kennt.
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
 * Fehlerfläche"; ein „zuletzt geprüft" wäre beides. Die vollständige
 * Datensicherung ist keine Auskunft in diesem Sinn — sie ist der Bestand
 * selbst (A-20.4).
 *
 * **Keine Abwehr gegen einen feindlichen lokalen Prozeß.** Wer den Sidecar in
 * einer Schleife startet, kommt mit `sqlite3` an dieselbe Datei (VG-3). Das war
 * vor T-285 so und ist danach so — und es ist der Grund, warum dieser Wert als
 * Sperre wenig und als Tatsache viel taugt.
 */
export interface VersionCheckStorePort {
  /**
   * Merkt den Zeitpunkt einer ausgehenden Anfrage. Wird **vor** der Anfrage
   * gerufen — und seit T-349 **nicht abgewartet** (A-A-106).
   *
   * Was das für einen Adapter heißt: Er darf langsam sein, er darf werfen, und
   * er darf seine Zusage nie einlösen. Keines davon hält die Versionsprüfung
   * auf; das Nie-Einlösen kostet nach {@link VERSION_CHECK_STORE_DEADLINE_MS}
   * den Speicher und **eine** Zeile im Protokoll. Was er **nicht** darf, ist
   * synchron blockieren — dagegen hilft keine Frist, und das ist keine Lücke
   * dieses Ports, sondern die Eigenschaft einer Ereignisschleife.
   */
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
   * Wohin der Zeitpunkt der letzten Anfrage geschrieben wird — **optional**.
   *
   * Ohne Angabe wird er nirgends gemerkt, und **am Verhalten ändert das
   * nichts** (T-285): Der Boden hängt an `lastRequestAt` im Arbeitsspeicher,
   * nicht am Bestand. Optional ist hier deshalb keine Bequemlichkeit, sondern
   * eine Bedingung des Zusammenbaus: `compose()` läuft auch **ohne** Datenbank
   * (`databaseLocation` fehlt — so laufen `proof:openapi` und
   * `proof:route-policy`). Es gibt dann keinen Bestand, an dem etwas hängen
   * könnte, und einen zu erfinden wäre schlimmer als keiner.
   */
  readonly store?: VersionCheckStorePort;
  /**
   * Wie lange ein angestoßenes Schreiben schweigen darf, bevor es als
   * ausgefallen gilt — ohne Angabe {@link VERSION_CHECK_STORE_DEADLINE_MS}.
   *
   * Die Naht ist **für die Messung** da und nicht für den Betrieb: Ein Prüffall
   * setzt hier Millisekunden statt Sekunden und mißt damit ohne Wartezeit, daß
   * ein Speicher, der nie antwortet, genau eine Zeile kostet und sonst nichts
   * (A-A-106). Die Verdrahtung setzt sie nicht; `proof:release-safety` (6b)
   * nagelt die Schlüssel des Aufrufobjekts fest, und dieser gehört nicht dazu.
   */
  readonly storeDeadlineMs?: number;
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
  const storeDeadlineMs = options.storeDeadlineMs ?? VERSION_CHECK_STORE_DEADLINE_MS;

  let state: VersionCheckState = { state: 'unknown' };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let stopped = false;
  let started = false;
  /*
   * Der Bezugspunkt des Bodens, und er liegt **im Arbeitsspeicher** (T-285).
   *
   * `null` heißt „in diesem Prozeß ist noch keine Anfrage hinausgegangen" — und
   * genau das macht die erste Prüfung eines Starts frei: `elapsed` wird dann
   * `Infinity`, kein Boden greift, eine Anfrage geht hinaus. Ein Programmstart
   * prüft immer einmal.
   *
   * Der gleichnamige Wert im Bestand (`app_setting.last_version_check_at`) wird
   * geschrieben und **nicht** hierher zurückgelesen. Er ist eine Tatsache, keine
   * Sperre.
   */
  let lastRequestAt: number | null = null;
  const control = new AbortController();

  /*
   * Wohin der Zeitpunkt geht (T-279, T-285). `null` heißt „nirgendwohin" —
   * entweder wurde kein Speicher mitgegeben (kein Bestand im Zusammenbau), oder
   * er hat auf eine Schreibung **nie geantwortet** und ist danach abgelegt
   * worden. Ein Speicher, der **wirft**, wird seit T-367 nicht mehr abgelegt;
   * die Begründung steht bei `forgetStore` (A-A-124).
   *
   * **Ein Fehlschlag der Speicherung darf die Versionsprüfung nicht beenden**,
   * und seit T-285 kostet er auch am Verhalten nichts mehr: Der Boden mißt
   * `lastRequestAt` im Arbeitsspeicher und bleibt richtig, auch wenn die Tabelle
   * nichts annimmt. Verloren geht dann die Tatsache, nicht die Zusage.
   */
  let store: VersionCheckStorePort | null = options.store ?? null;

  /*
   * Die Fristen der angestoßenen Schreibzugriffe, solange sie schweben
   * (T-360).
   *
   * Es ist eine **Menge** und kein einzelner Wert, weil `remember` je Anfrage
   * eine eigene Frist stellt und zwei Anfragen sich im Betrieb zwar nicht
   * überholen (zwischen ihnen liegt der Boden von einer Stunde, die Frist sind
   * fünf Sekunden), das Modul diese Zahl aber nicht kennt. Eine Zusage, die an
   * einer fernen Zahl hängt, ist keine.
   *
   * Wozu sie dient, steht an zwei Stellen: bei der Frist in {@link remember}
   * (`stop()` räumt ab, was schwebt) und bei `stop()` selbst.
   */
  const schwebendeFristen = new Set<ReturnType<typeof setTimeout>>();

  /*
   * Ob die **eine** Zeile über einen versagenden Speicher schon geschrieben
   * ist (A-A-123, T-367).
   *
   * Bis T-360 hing diese Zusage an einer fernen Zahl (dem Boden von einer
   * Stunde gegen eine Frist von fünf Sekunden), bis T-367 an einem
   * Nebeneffekt (der Ablage des Speichers). Jetzt steht sie in einem eigenen
   * Wert, gilt für **beide** Gründe zusammen und damit für das Modul statt
   * für eine Funktion. Sie mußte umziehen, weil der Wurf seit T-367 nicht
   * mehr ablegt — eine Zusage, die an einem Nebeneffekt hängt, den es nicht
   * mehr gibt, ist keine.
   */
  let storeFailureLogged = false;

  /**
   * Merkt den Zeitpunkt einer ausgehenden Anfrage — im Arbeitsspeicher
   * **sofort**, im Bestand **nebenher** (A-A-106, T-349).
   *
   * Zwei Werte, zwei Aufgaben: Der im Arbeitsspeicher trägt den Boden für den
   * Rest dieses Laufs, der im Bestand ist die Tatsache für die Datensicherung
   * (A-20.4). Zurückgelesen wird der zweite nie — siehe
   * {@link VersionCheckStorePort}.
   *
   * ===========================================================================
   * Warum diese Funktion nichts zurückgibt, worauf jemand warten könnte
   * ===========================================================================
   *
   * Bis T-349 war sie `async` und stand als `await remember(…)` **vor** der
   * Anfrage. Ein **Wurf** aus `store.write` war behandelt; ein
   * **Nie-Eintreffen** nicht. Ein Speicher, dessen Zusage nie einlöst, hielt
   * `run()` an dieser Zeile an: `inFlight` stand auf wahr, kein Zeitgeber war
   * gestellt, und die Versionsprüfung war für die Laufzeit des Prozesses tot —
   * **ohne eine Zeile im Protokoll**, also stiller als jeder Fehlschlag
   * (T-332 K-1, Bedrohungsmodell 42.4).
   *
   * Der Fehler lag nicht an `store.write`, sondern an der Bauart: **Wer auf dem
   * Weg zur Anfrage auf ein fremdes Versprechen wartet, macht jeden, der dieses
   * Versprechen gibt, zum Ausschalter der Versionsprüfung.** Ein Wächter kann
   * dagegen die Menge der Versprechenden eng ziehen; aufheben kann er den Weg
   * nicht. Deshalb ist der Weg jetzt **synchron**: `lastRequestAt` steht sofort,
   * das Schreiben wird angestoßen und nicht abgewartet, und `run()` kommt an die
   * Anfrage, gleich was der Speicher tut.
   *
   * Der einzige verbliebene `await` auf diesem Weg ist die Anfrage selbst, und
   * sie trägt ihre eigene Gesamtfrist (A-V-5, `AbortSignal.timeout` in
   * `source.ts`) sowie den `AbortController` aus `stop()`.
   *
   * ===========================================================================
   * Was von T-279 bleibt — und was ehrlicherweise nicht
   * ===========================================================================
   *
   * Angestoßen wird weiterhin **vor** der Anfrage und nicht danach, und der
   * gebaute Adapter führt sein `UPDATE` im Aufruf aus
   * (`packages/storage/src/sqlite/repo-version-check.ts`): Der Zeitpunkt steht
   * im Bestand, bevor die Anfrage hinausgeht. **Zugesichert ist seit T-349 aber
   * nur der Anstoß, nicht der Abschluß.** Ein Adapter, der sein Schreiben
   * künftig in eine Warteschlange legte, schriebe womöglich erst danach.
   *
   * Der Preis ist benannt und klein: Der Wert ist seit T-285 **kein
   * Betriebspfad** mehr, sondern eine Tatsache für die Datensicherung (A-20.4).
   * Was ein Absturz zwischen Anstoß und Schreiben kostet, ist eine fehlende
   * Angabe in einer Sicherung — nicht ein fehlender Boden. Gegen den Boden hilft
   * ohnehin `lastRequestAt`, und der steht in der ersten Zeile.
   *
   * ===========================================================================
   * Die Frist, und warum sie trotzdem da ist
   * ===========================================================================
   *
   * Sie hält nichts mehr auf. Sie verwandelt **Schweigen in eine Zeile**: Ein
   * Speicher, der nie antwortet, wäre sonst von einem, der geschrieben hat, in
   * nichts zu unterscheiden — und genau diese Ununterscheidbarkeit war der Kern
   * von T-332 K-1. Nach ihrem Ablauf — und seit T-367 **nur** nach ihrem
   * Ablauf — wird der Speicher abgelegt: `store = null`, **eine** Zeile im
   * Protokoll, der Takt unberührt.
   *
   * Der **Wurf** geht seit T-367 einen anderen Weg: Er meldet, legt aber nicht
   * ab, und der nächste Takt versucht es erneut. Warum die beiden Gründe
   * ungleich behandelt werden, steht bei `forgetStore` (A-A-124).
   *
   * **Wirft nie.** Der Aufrufer steht zwischen `inFlight = true` und dem
   * `try`/`finally`, das es zurücksetzt; ein Wurf von hier ließe den Prüfer für
   * die Laufzeit des Prozesses als „gerade beschäftigt" stehen.
   */
  function remember(at: Date): void {
    lastRequestAt = at.getTime();
    const target = store;
    if (target === null) return;

    let settled = false;
    /*
     * Die Frist hält **nichts** auf. Sie ist `unref()`t, damit ein Erzeugnis,
     * das fertig ist, nicht auf sie wartet, und sie wird abgeräumt, sobald das
     * Schreiben ausgeht — im Betrieb ist das dieselbe Ereignisschleifenrunde.
     *
     * **Sie wird außerdem geführt, nicht nur gestellt** (T-360, Befund T-356 zu
     * dieser Zeile). `unref()` heißt „hält die Ereignisschleife nicht am
     * Leben", nicht „feuert nicht": Solange der Dienst noch lauscht, kommt sie
     * an — auch **nach** `stop()`. Gemessen war das eine `info`-Zeile nach dem
     * Abschalten, also eine Wirkung auf eine Senke, die beim Herunterfahren
     * geschlossen sein kann. A-V-12 sagt „räumt den Zeitgeber weg", und das
     * gilt für jeden dieses Prüfers, nicht nur für den Takt. Deshalb steht die
     * Frist in {@link schwebendeFristen}, bis sie ausgeht, und `stop()` räumt
     * ab, was dann noch darin steht.
     */
    const deadline = setTimeout(() => {
      schwebendeFristen.delete(deadline);
      if (settled) return;
      settled = true;
      forgetStore('timeout');
    }, storeDeadlineMs);
    deadline.unref();
    schwebendeFristen.add(deadline);

    /*
     * Der Anstoß, und er wird ausdrücklich **nicht** zurückgegeben: Es gibt
     * nichts, worauf ein Aufrufer warten könnte, und damit keinen Weg, auf dem
     * ein fremdes Versprechen den Weg zur Anfrage anhielte (A-A-106).
     *
     * Der Rumpf wirft nie nach außen — der `catch` fängt auch einen Wurf, der
     * beim **Aufruf** von `write` entsteht und nicht erst in seiner Zusage.
     * Eine unbehandelte Ablehnung gäbe es damit auch dann nicht, wenn die Zusage
     * erst nach Ablauf der Frist eintrifft.
     */
    void (async () => {
      let threw = false;
      try {
        await target.write(at);
      } catch {
        threw = true;
      }
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      schwebendeFristen.delete(deadline);
      /*
       * **Melden, nicht ablegen** (T-367, A-A-124). Ein Wurf ist beschränkt:
       * Er kommt sofort, hält die Anfrage nicht auf und sagt nichts über den
       * nächsten Versuch. Ihn abzulegen kostete die Tatsache für die
       * Datensicherung, ohne etwas zu gewinnen — Begründung und Messung bei
       * `forgetStore`.
       */
      if (threw) reportStoreFailure('threw');
    })();
  }

  /**
   * Schreibt die **eine** Zeile über einen versagenden Speicher — genau eine
   * über die ganze Laufzeit, für **beide** Gründe zusammen (A-A-123).
   *
   * `info` und nicht `warn` — der Betrieb ist ungestört, und `proof:access`
   * Abschnitt 0e mißt, daß im Normalfall keine Warnung erscheint.
   *
   * ===========================================================================
   * Warum die Zusage hier steht und nicht in {@link forgetStore} (A-A-123)
   * ===========================================================================
   *
   * Bis T-360 stand sie als Begründung „danach gibt es keinen Speicher mehr,
   * der ein zweites Mal versagen könnte" am Rand. Sie gilt für jede Frist, die
   * **nach** der Ablage gestellt wird, und für keine, die **davor** schon
   * schwebte: Jede abgelaufene Frist schrieb ihre eigene Zeile. Im Erzeugnis
   * blieb es trotzdem bei einer, weil zwischen zwei Anfragen der Boden von
   * einer Stunde liegt und die Frist fünf Sekunden sind — die Zusage hing also
   * an einer fernen Zahl und nicht an einer Funktion. Gemessen bei Takt 5 ms
   * und Frist 120 ms: **110** Zeilen `version_check_state_write_timeout`
   * (T-356), bei Takt 10 ms und Frist 20 ms zwei (T-357).
   *
   * T-360 hat daraus eine Aussage über das Modul gemacht, indem
   * {@link forgetStore} sich selbst prüfte. Seit T-367 trägt sie nicht mehr die
   * **Ablage**, sondern die **Meldung**: Der Wurf legt den Speicher nicht mehr
   * ab (Begründung bei {@link forgetStore}), also gäbe es für ihn keine Ablage,
   * an der eine Zusage hängen könnte. Ein Riegel an einem Nebeneffekt ist
   * keiner — dieselbe Lehre wie bei der fernen Zahl darüber.
   *
   * **Beide Gründe teilen sich die eine Zeile.** Wirft der Speicher erst und
   * schweigt danach, steht im Protokoll der erste der beiden Gründe und kein
   * zweiter. Das ist gewollt: A-18.12 verlangt Stille, und zwei Zeilen über
   * denselben Speicher sagen nicht mehr als eine.
   */
  function reportStoreFailure(reason: VersionCheckStoreFailure): void {
    if (storeFailureLogged) return;
    storeFailureLogged = true;
    const described = describeVersionCheckStoreFailure(reason);
    options.logger.lifecycle('info', described.sentence, described.key);
  }

  /**
   * Legt den Speicher ab — seit T-367 die Antwort auf **`timeout` allein**.
   *
   * ===========================================================================
   * Warum nur der stumme Speicher abgelegt wird (A-A-124)
   * ===========================================================================
   *
   * Die beiden Gründe sind nicht gleich schwer, und bis T-364 wurden sie
   * gleich behandelt:
   *
   *  - Ein Speicher, der **wirft**, ist beschränkt und harmlos. Der Wurf kommt
   *    sofort, hält die ausgehende Anfrage nicht auf (A-A-106 bleibt
   *    unberührt) und sagt nichts über den nächsten Versuch. Ihn abzulegen
   *    kostete die Tatsache für die Datensicherung, ohne irgend etwas zu
   *    gewinnen.
   *  - Ein Speicher, der **nie antwortet**, ist unbeschränkt. Bei ihm ist die
   *    Ablage die einzige Handhabe gegen ein Versprechen ohne Ende; ohne sie
   *    bliebe je Anfrage eines offen. Deshalb bleibt dieser Weg, wie er war.
   *
   * ===========================================================================
   * Was der Benutzer im Bestand hat — und warum das an dieser Zeile hing
   * ===========================================================================
   *
   * Solange auch der Wurf ablegte, wurde von da an kein Zeitpunkt mehr gemerkt,
   * und `app_setting.last_version_check_at` trug den **letzten geglückten** Wert
   * weiter — nicht nichts. Eine Datensicherung nach A-20 sagte danach
   * „zuletzt geprüft am …" und nannte einen beliebig alten Zeitpunkt, der
   * dabei gültig aussieht. **Ein veralteter Zeitpunkt ist schlimmer als
   * keiner**, weil ein fehlender „ich weiß es nicht" sagt.
   *
   * Gemessen (T-364, echter Prüfer, echter Adapter, echte Datei, Sperre geht
   * auf und wieder zu): **ein** fehlgeschlagener von 63 Schreibversuchen
   * genügte, danach 51 ausgehende Anfragen ohne einen weiteren Eintrag, und der
   * Wert war am Ende **52 Stunden** alt. In dieser Fassung heilt dieselbe Lage
   * nach dem nächsten Intervall: **1 Stunde** statt 52.
   *
   * **Am Port ist das nicht aufzulösen**, und das ist gemessen und nicht
   * geschlossen (T-364, gegen den Vorschlag aus T-360). Ein „vergiß den Wert"
   * führte über denselben Kanal, der eben versagt hat: In drei von vier
   * gemessenen Fehlerlagen des gebauten Adapters wirft auch das
   * `UPDATE … = NULL` (nur lesende Verbindung, geschlossene Verbindung,
   * gesperrte Datei); die vierte verlangt eine Systemuhr außerhalb der Jahre
   * 0001 bis 9999. Der Wert blieb dabei genauso 52 Stunden alt, und
   * `proof:release-safety` fiel von 158/0 auf 157/1. Ein Bestand kann über
   * einen versagenden Kanal nicht sagen, daß er nichts weiß; deshalb behält
   * `null` in dieser Spalte genau **eine** Bedeutung: „noch nie gefragt".
   *
   * Bleibt die Datei dauerhaft unbeschreibbar, steht dort weiter der alte Wert.
   * Dagegen hilft keine Bauform — auch ein `null` müßte geschrieben werden.
   *
   * ===========================================================================
   * Was diese Fassung kostet, und es gehört hierher
   * ===========================================================================
   *
   * Ein Speicher, der synchron blockiert **und** wirft — die fremd gesperrte
   * Datei —, blockiert danach **je Intervall** statt einmal. Gemessen mit 50 ms
   * Blockade, Takt 10 ms, Fenster 600 ms: 10 ausgehende Anfragen statt 55. Im
   * Erzeugnis sind das höchstens 5 s je Stunde (`busy_timeout` in
   * `database.ts`), und nur solange die Datei fremd gesperrt ist — eine Lage,
   * in der ohnehin jede andere Anfrage des Dienstes in dieselben 5 s läuft.
   *
   * Daß dieser Adapter überhaupt synchron blockieren kann, ist die **zweite
   * Achse von R-30** (A-A-125) und ein eigener Meßgegenstand: `recordCheck`
   * hält unter fremder Schreibsperre die Ereignisschleife gemessene 5 004 ms
   * an, und zwar auf dem Weg **vor** der ausgehenden Anfrage.
   *
   * **Der Takt bleibt unberührt** (A-18.11): Hier wird kein Zeitgeber gestellt,
   * keiner abgeräumt und kein Zustand angefaßt. Verloren geht die Tatsache für
   * die Datensicherung, nicht die Versionsprüfung.
   */
  function forgetStore(reason: VersionCheckStoreFailure): void {
    /*
     * Wer schon abgelegt ist, wird nicht ein zweites Mal abgelegt. Die Zusage
     * „genau eine Zeile" steht seit T-367 nicht mehr an dieser Zeile, sondern
     * in {@link reportStoreFailure} — dort gilt sie für beide Gründe.
     */
    if (store === null) return;
    store = null;
    reportStoreFailure(reason);
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
     * **Die erste Prüfung eines Prozeßlaufs geht immer hinaus** (T-285).
     *
     * Sie braucht dafür keine Fallunterscheidung: `lastRequestAt` ist beim
     * ersten Durchgang `null`, `elapsed` damit `Infinity`, und kein Boden greift.
     * Das ist der ganze Mechanismus — und deshalb steht hier auch kein Lesen aus
     * dem Bestand mehr. Zwischen T-279 und T-285 stand es genau an dieser Stelle
     * und hat jeden Neustart bis zu eine Stunde lang wirkungslos gemacht
     * (TP-VER-11).
     *
     * Der harte Boden darunter ist kein zweites Mal derselbe Takt: Er greift auch
     * dann, wenn der Zeitgeber aus einem Grund früher feuert, den hier niemand
     * vorhergesehen hat. Für jede Planung **nach** der ersten Anfrage gilt er
     * unverändert.
     */
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
      remember(options.now());
      scheduleFloor(minIntervalMs);
      return;
    }

    if (elapsed < minIntervalMs) {
      scheduleFloor(minIntervalMs - elapsed);
      return;
    }

    inFlight = true;
    /*
     * **Gemerkt wird vor der Anfrage, nicht danach** (T-279) — und seit T-349
     * ohne `await` (A-A-106).
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
     *
     * **Diese Zeile trägt kein `await`, und das ist die Zusage aus A-A-106.**
     * Der Boden hängt an `lastRequestAt`, und der steht nach der ersten
     * Anweisung von {@link remember}. Alles Weitere — der Schreibzugriff, seine
     * Frist, sein Fehlschlag — läuft nebenher und kann diesen Weg nicht mehr
     * anhalten. Wer hier wieder ein `await` einsetzt, baut T-332 K-1 nach; der
     * Nachweis `proof:release-safety` (6g-1) wird davon rot — und seit T-360
     * ebenso, wer die Anfrage eine Funktion tiefer schiebt und das `await` hier
     * stehen läßt (Befund T-356).
     */
    remember(options.now());
    try {
      /*
       * **Das einzige Warten dieses Moduls — und es bekommt keinen Riegel**
       * (T-360, Entscheidung zur benannten Restklasse aus T-349).
       *
       * Die Lage ist gemessen: Eine Quelle, deren `latest` nie antwortet,
       * ergibt **1** Anfrage, Zustand `unknown`, **0** Protokollzeilen — auch
       * dann, wenn sie auf das Signal hört, denn `control` löst nur `stop()`
       * aus (T-356, T-357). Das ist derselbe Ausschalter wie T-332 K-1, eine
       * Naht weiter rechts.
       *
       * Der naheliegende Riegel wäre derselbe wie beim Speicher: eine eigene
       * Frist, nach deren Ablauf `run()` weitermacht. Er ist **nicht** gebaut,
       * und zwar aus drei Gründen, die hier zusammen stehen, weil sie einzeln
       * nicht tragen:
       *
       *  1. **Die Quelle bringt ihre Frist selbst mit**, und das ist gemessen
       *     statt zugesagt: `AbortSignal.timeout(5 000)` in `source.ts` (A-V-5)
       *     trägt **auch den Rumpf** — gegen einen tropfenden Wirt bricht die
       *     Abfrage nach 5 002 ms mit `timeout` ab (T-357). Die Marke
       *     `AbortSignal.timeout` steht in `REQUIRED_IN_SOURCE` von
       *     `proof:release-safety`; verschwindet sie, wird der Lauf rot.
       *  2. **Ein Riegel hieße überlappende ausgehende Anfragen.** Wir können
       *     ein fremdes Versprechen nicht beenden, nur stehenlassen: Wer nach
       *     der Frist weitermacht, hat die erste Anfrage noch unterwegs, wenn
       *     die zweite hinausgeht. Genau die eine, selbstgetaktete Anfrage ist
       *     aber der Grund, warum dieses Modul überhaupt so gebaut ist (siehe
       *     den Kopf dieser Datei: das Lebenszeichen aus R-19 und die 60
       *     Anfragen je Stunde).
       *  3. **Er kostete die Zusage, die heute mißt.** Ein Riegel steht als
       *     `Promise.race([…])`, und damit stünde die Anfrage nicht mehr
       *     unmittelbar unter dem einen `await` — der Wächter 6g-1 mißt genau
       *     das (gemessen: `Promise.all` daneben ist rot). Eine gemessene
       *     Zusage gegen eine ungemessene zu tauschen ist kein Gewinn.
       *
       * **Was bleibt, ist benannt:** Wer diesen Port einsetzt, bringt eine
       * eigene Gesamtfrist mit; der Prüfer hat keine. Das steht als Bedingung
       * an `ReleaseSourcePort` in `source.ts` und ist die Stelle, an der ein
       * künftiger zweiter Adapter geprüft wird.
       */
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
       * 24 Stunden **innerhalb eines Laufs** gegen 1 im Erfolgsfall. GitHub
       * gesteht nicht angemeldeten Aufrufern 60 je Stunde und Quelladresse zu;
       * eine je Stunde ist ein Sechzigstel davon. Jeder weitere Programmstart
       * bringt seit T-285 eine weitere Anfrage mit — die Tagesgrenze ist deshalb
       * `24 + Anzahl der Starts`, ausgerechnet im Kopf dieser Datei.
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
      if (stopped || started) return;
      started = true;
      schedule(startDelayMs);
    },

    stop(): void {
      stopped = true;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      /*
       * **Jeder** Zeitgeber dieses Prüfers, nicht nur der Takt (A-V-12, T-360).
       *
       * Die Fristen der angestoßenen Schreibzugriffe sind `unref()`t, und das
       * hat T-349 als „feuert nicht mehr" gelesen. Gemessen (T-356) kam nach
       * `stop()` noch genau **eine** `info`-Zeile an: Solange der Dienst
       * lauscht, lebt die Ereignisschleife, und eine Frist, die niemand
       * abräumt, läuft ab. Fachlich war es folgenlos — kein Zeitgeber, kein
       * Zustand, kein Takt hängen daran —, aber es ist eine Wirkung nach dem
       * Abschalten, und die Senke des Protokolls kann beim Herunterfahren
       * geschlossen sein.
       */
      for (const frist of schwebendeFristen) clearTimeout(frist);
      schwebendeFristen.clear();
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
 * Warum der Zeitpunkt der letzten Anfrage nicht im Bestand steht (A-A-106).
 *
 * Zwei Werte, und beide sind **folgenlos für den Betrieb**: `threw` — der
 * Speicher hat abgelehnt; `timeout` — er hat innerhalb von
 * {@link VERSION_CHECK_STORE_DEADLINE_MS} gar nichts gesagt. Bis T-349 gab es
 * nur den ersten, und der zweite war der Fall, der die Versionsprüfung still
 * anhielt (T-332 K-1).
 *
 * **In der Folge sind sie seit T-367 nicht mehr gleich** (A-A-124): Nur
 * `timeout` legt den Speicher für die Laufzeit ab; ein `threw` wird gemeldet,
 * und der nächste Takt versucht es erneut. Die Begründung steht bei
 * `forgetStore` in {@link createVersionChecker}, die Messung in
 * `.claude/team/reports/T-364-domain-dev.md`.
 */
export type VersionCheckStoreFailure = 'threw' | 'timeout';

/**
 * Derselbe Bau wie {@link describeVersionCheckFailure}: ein Schlüssel herein,
 * ein Satz und ein Grund heraus, rein und ohne laufenden Dienst prüfbar.
 *
 * In beiden Hälften steht kein Pfad, kein Geheimnis, keine Adresse und keine
 * fremde Zeichenkette; die Sätze sind Konstanten, die Gründe stehen in
 * demselben geschlossenen Vorrat wie jeder andere (A-V-20). **Der Benutzer
 * sieht keinen von beiden** — sie stehen im Protokoll, nicht auf einer Fläche
 * (A-18.12).
 */
export function describeVersionCheckStoreFailure(reason: VersionCheckStoreFailure): {
  readonly sentence: string;
  readonly key: string;
} {
  if (reason === 'timeout') {
    return {
      /*
       * Der Satz nennt die **Folge** und nicht nur den Vorgang — dieselbe
       * Lehre wie bei `too_large` (Befund T-145-3): Ab hier merkt sich dieses
       * Erzeugnis den Zeitpunkt gar nicht mehr, und in einer Datensicherung
       * steht danach der **letzte geglückte** und nicht keiner. Die
       * Versionsprüfung selbst läuft unverändert weiter, und genau das ist der
       * Unterschied zum Stand vor T-349.
       *
       * **Seit T-367 gilt dieser Satz für genau den einen Weg, für den er
       * geschrieben ist**: den Speicher, der nie antwortet. Der Wurf legt nicht
       * mehr ab, und sein Satz sagt deshalb etwas anderes (A-A-124).
       */
      sentence:
        'Der Zeitpunkt der letzten Versionsprüfung wurde innerhalb der Frist nicht gespeichert und wird ab jetzt nicht mehr gemerkt. SuperTakt läuft unverändert weiter.',
      key: 'version_check_state_write_timeout',
    };
  }
  return {
    /*
     * Der zweite Grund hat seit T-367 eine **andere** Folge als der erste
     * (A-A-124), und der Satz sagt sie.
     *
     * Die Geschichte dieser Zeile in zwei Schritten: Bis T-360 sagte sie
     * „ließ sich nicht merken" und beschrieb damit **einen** Schreibversuch,
     * während der Speicher auch auf diesem Weg für die ganze Laufzeit abgelegt
     * wurde — der Satz sagte weniger, als geschah. T-360 hat deshalb „und wird
     * ab jetzt nicht mehr gemerkt" angehängt. T-367 hat die **Sache** geheilt
     * statt den Satz: Ein Wurf legt nicht mehr ab, der nächste Takt versucht es
     * erneut, und der angehängte Halbsatz wäre jetzt seinerseits unwahr.
     *
     * Ein Protokollsatz, der mehr sagt, als geschieht, ist derselbe Fehler wie
     * einer, der weniger sagt — nur in die andere Richtung. Deshalb steht hier
     * jetzt die **wiederholte** Folge und nicht die endgültige.
     */
    sentence:
      'Der Zeitpunkt der letzten Versionsprüfung ließ sich nicht merken. SuperTakt läuft unverändert weiter und versucht es beim nächsten Mal erneut.',
    key: 'version_check_state_unwritable',
  };
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
