/**
 * Takt — was das Add-in aus einer E-Mail übernimmt (A-10.5, B-12.3).
 *
 * Ein reiner Wert ohne jede Office-Abhängigkeit. Alles im Aufgabenbereich außer
 * `host.ts` arbeitet ausschließlich damit — deshalb ist der ganze Ablauf vom
 * Titelvorschlag über die Erkennung der Call-Nummer bis zum Duplikatangebot
 * ohne laufendes Outlook prüfbar.
 */

import { MAX_TITLE_CHARACTERS } from '@takt/domain';

import { cutToCharacterBoundary } from '../text/cut.ts';
import { dropHidden } from '../text/hidden.ts';

/**
 * Obergrenze für übernommenen Text (B-12.3 Punkt 3).
 *
 * **Diese Zahl steht noch zweimal im Baum**, und zwar hier und als
 * `ADDIN_NOTE_MAX_LENGTH` in `apps/local-api/src/routes/addin/schema.ts`. Es ist
 * dieselbe Wahrheit in derselben Bauart wie {@link MAX_TITLE_CHARACTERS} vor
 * T-134: Was `prepareNote` vorbereitet, muss die Tür annehmen — sonst bekommt
 * der Benutzer ein 422 für einen Text, den nicht er geschrieben hat, sondern
 * der Knopf „Inhalt der E-Mail übernehmen".
 *
 * Auflösen lässt sie sich nur dort, wo beide Seiten lesen können, also in
 * `@takt/domain` (`packages/domain/src/text-length.ts`, das sie ausdrücklich als
 * offene Frage führt). Das ist nicht die Hoheit des Add-ins; T-134 meldet es,
 * statt es halb zu tun — eine halb umgestellte Zahl sieht aus wie erledigt.
 * Bis dahin misst `scripts/proof-addin.mjs` Abschnitt 16 beide Seiten
 * gegeneinander: ein Vergleich, der den Schaden bewacht und nicht die Ursache
 * (E-063 Punkt 5), aber besser als der Kommentar, der es bis T-134 nur hoffte.
 */
export const MAX_TAKEOVER_CHARACTERS = 4000;

/**
 * Was am Ende eines gekürzten Vermerks steht (T-134).
 *
 * Ein Name statt einer Zeichenkette mitten im Ausdruck, weil der Hinweis seit
 * T-134 in die **Rechnung** eingeht: Seine Länge bestimmt mit, wo geschnitten
 * wird, damit er unter den Deckel passt und nicht daneben (siehe
 * {@link prepareNote}). Stünde er weiterhin nur als Text am Ende, ließe er sich
 * ändern, ohne dass die Rechnung davon erführe — und der Vermerk wäre wieder
 * länger, als die Tür annimmt.
 */
const TRUNCATION_HINT = '\n…(gekürzt)';

/*
 * Obergrenze für den Titelvorschlag — **die** Zahl des Dienstes und nicht eine
 * gleich große daneben (T-114, T-128, T-134).
 *
 * Hier stand bis T-114 eine 512 mitten im Ausdruck, während `POST /addin/todos`
 * seit derselben Aufgabe 500 nimmt, wie `POST /todos` und `PATCH /todos/{id}`
 * auch. Ein Vorschlag, der länger ist als das, was angenommen wird, ist ein
 * vorbereitetes 422: Der Benutzer drückt „Anlegen" und bekommt eine Abweisung
 * für einen Text, den er nicht geschrieben hat.
 *
 * T-114 hat die beiden Zahlen gleichgemacht und den Nachweispfad sie
 * gegeneinander halten lassen. Das war die halbe Antwort, und T-128 hat gesagt,
 * warum: Ein Vergleich „hier 500, dort 500" wird erst rot, wenn die Doppelung
 * schon falsch ist — er misst sie nicht, er verträgt sie (E-063 Punkt 5).
 * Seither liegt die Zahl in `packages/domain/src/text-length.ts`, `titleSchema`
 * liest sie dort, und seit T-134 tut es diese Datei auch.
 *
 * Der Aufgabenbereich ist ein Browserbündel und darf `@takt/local-api` nicht
 * einbinden — `@takt/domain` aber schon, genau wie bei der Zeichenklasse in
 * `../text/hidden.ts`. Die Ausfuhr unter demselben Namen bleibt, damit die
 * Aufrufstellen und der Nachweispfad den Deckel weiterhin dort finden, wo sie
 * ihn suchen: an der Datei, die ihn benutzt.
 *
 * Was hier steht, ist deshalb **keine Zahl mehr**, sondern ein Name. Dass er aus
 * der Domäne kommt, misst `scripts/proof-addin.mjs` Abschnitt 16 als Frage nach
 * der Herkunft und nicht als Zahlenvergleich: Der Aufgabenbereich darf die Zahl
 * nirgends selbst führen — auch nicht als richtige.
 */
export { MAX_TITLE_CHARACTERS };

/*
 * Die Zeichen, die aus einem übernommenen Betreff **fallen**, standen bis T-119
 * hier als eigener Ausdruck (`DROPPED_FROM_SUBJECT`, T-114) und bis T-122 als
 * zweite Fassung in `../text/hidden.ts`.
 *
 * Sie stehen jetzt in `packages/domain/src/characters.ts` — einmal im ganzen
 * Baum —, und zwar aus dem Grund, an dem diese Zeile zweimal beinahe
 * gescheitert wäre: **Sie ist auseinandergelaufen.** T-117 hat die Klasse an
 * der Tür des Dienstes um `U+061C`, `U+200E` und `U+200F` erweitert, der
 * Ausdruck hier bekam es nicht mit — und ein Betreff mit einer dieser drei
 * Richtungsmarken ergab wieder genau die Sackgasse, die T-114 geschlossen
 * hatte: ein 422 auf einem Feld, an dem nichts Falsches zu sehen ist. Der
 * Nachweispfad hat es nicht bemerkt, weil er die Klasse mit einer **Liste
 * abgeschriebener Zeichen** geprüft hat statt mit der Quelle selbst.
 *
 * Seit T-123 gibt es hier nichts mehr abzugleichen: `../text/hidden.ts` reicht
 * die Funktionen der Domäne durch, {@link dropHidden} *ist*
 * `dropHiddenCharacters`. Eine Erweiterung der Klasse erreicht diese Zeile,
 * ohne daß jemand daran denken muß, und der Nachweispfad mißt die
 * Durchreichung als Gleichheit der Objekte statt als Gleichheit zweier
 * Ergebnisse (Abschnitt 17, E-063 Punkt 4).
 *
 * Warum überhaupt entfernt wird, obwohl der Dienst abweist, steht in
 * `../text/hidden.ts` und an der Quelle: Der Titelvorschlag ist keine Eingabe
 * des Benutzers, sondern ein Vorschlag aus fremder Quelle. Was der Benutzer
 * selbst tippt oder einfügt, geht unverändert an den Dienst und wird dort
 * abgewiesen.
 */

export interface MailFacts {
  readonly subject: string;
  /** Nur-Text-Fassung. HTML wird nicht übernommen (B-12.1). */
  readonly body: string;
  readonly senderName: string;
  readonly senderAddress: string;
  readonly receivedAt: string | null;
}

export const EMPTY_MAIL: MailFacts = Object.freeze({
  subject: '',
  body: '',
  senderName: '',
  senderAddress: '',
  receivedAt: null,
});

/**
 * Titelvorschlag aus dem Betreff.
 *
 * Antwort- und Weiterleitungsvorsilben fallen weg — sie sagen etwas über den
 * Verlauf der E-Mail und nichts über die Aufgabe. Mehrfach verschachtelte
 * Vorsilben (`AW: WG: AW:`) werden dabei alle entfernt.
 *
 * Der Ausdruck ist **fest verdrahtet und kurz**; er ist keine Benutzereingabe
 * und fällt damit nicht unter B-4.1. Er hat keine verschachtelten Quantoren:
 * Die äußere Wiederholung steht über einer Alternative fester Wörter.
 *
 * Seit T-114 fallen außerdem die unsichtbaren Zeichen heraus ({@link dropHidden}),
 * und der Vorschlag endet bei {@link MAX_TITLE_CHARACTERS} statt bei 512. Beides
 * aus demselben Grund: Was hier herauskommt, steht als Vorschlag im Titelfeld —
 * und ein Vorschlag, den der Dienst abweist, ist eine Sackgasse mit einer
 * Fehlermeldung an einem Feld, an dem nichts Falsches zu sehen ist.
 *
 * Die Reihenfolge ist nicht beliebig. Erst fallen die unsichtbaren Zeichen,
 * dann wird Leerraum zusammengezogen: Ein `U+0000` zwischen zwei Leerzeichen
 * ließe sonst zwei Leerzeichen zurück.
 *
 * **Der Schnitt am Ende trifft seit T-119 eine Zeichengrenze** und nicht mehr
 * eine UTF-16-Einheit. Bis dahin konnte er ein Emoji halbieren und eine
 * einzelne Ersatzstelle hinterlassen — keinen Buchstaben, sondern eine Hälfte
 * davon, die auf dem Weg durch UTF-8 zu `U+FFFD` wird. Warum trotzdem in
 * UTF-16-Einheiten gezählt wird, steht in `../text/cut.ts`: Die Tür zählt so.
 */
export const suggestTitle = (subject: string): string => {
  const withoutPrefixes = subject.replace(/^(?:(?:AW|WG|RE|FW|FWD|ANTW)\s*:\s*)+/i, '');
  const visible = dropHidden(withoutPrefixes);
  const collapsed = visible.replace(/\s+/g, ' ').trim();
  return cutToCharacterBoundary(collapsed, MAX_TITLE_CHARACTERS);
};

/**
 * Bereitet den E-Mail-Text als **internen Vermerk** auf (A-7.1, B-12.3).
 *
 * Der Text landet ausdrücklich nicht in der Leistung: Was aus der E-Mail eines
 * Dritten stammt, ist Kontext für die eigene Arbeit und nichts, was ungefragt
 * an das Abrechnungstool geht. Diese Aufteilung ist in S-12 auch beschriftet.
 *
 * Gekürzt wird auf {@link MAX_TAKEOVER_CHARACTERS} Zeichen, und an einer
 * Zeilengrenze, damit kein Satz mitten im Wort abbricht. Leerzeilenfolgen
 * fallen zusammen — ein Zitatverlauf besteht zur Hälfte daraus.
 *
 * Findet sich keine Zeilengrenze in der zweiten Hälfte, bleibt der harte
 * Schnitt — und der trifft seit T-119 eine Zeichengrenze. Es ist derselbe
 * Befund wie bei {@link suggestTitle}, an derselben Art Zeile: Ein Text aus
 * Emoji ergab hier einen Vermerk mit einer einzelnen Ersatzstelle am Ende,
 * gemessen an der Grenze. Der Vermerk geht in die Datenbank; was dort ankommt,
 * war dann nicht, was im Feld stand.
 *
 * Der **Inhalt** wird dagegen bewusst nicht angetastet: Anders als der Titel
 * ist der Vermerk ein Freitextfeld, das der Dienst so annimmt, wie es kommt
 * (T-114 Punkt 4). Er trägt den Text der E-Mail, und ein Text, aus dem
 * unbemerkt Zeichen fehlen, wäre ein schlechterer Vermerk als einer mit ihnen.
 * Was das für die **Anzeige** dieses Feldes bedeutet, steht im Bericht zu
 * T-119: Ein Eingabefeld ist der eine Ort, an dem der Aufgabenbereich fremden
 * Text unverändert zeigt.
 */
export const prepareNote = (mail: MailFacts): string => {
  const head =
    mail.senderName.length > 0
      ? `Aus E-Mail von ${mail.senderName}${mail.senderAddress.length > 0 ? ` <${mail.senderAddress}>` : ''}`
      : 'Aus E-Mail';

  const body = mail.body.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const combined = `${head}\nBetreff: ${mail.subject}\n\n${body}`;

  if (combined.length <= MAX_TAKEOVER_CHARACTERS) return combined;

  /*
   * **Der Hinweis muss unter den Deckel passen, nicht neben ihn** (T-134).
   *
   * Bis T-134 wurde auf {@link MAX_TAKEOVER_CHARACTERS} geschnitten und der
   * Hinweis **danach** angehängt. Der Vermerk war damit 4011 Zeichen lang, die
   * Tür nimmt 4000 — und zwar in jedem Fall, in dem die zweite Hälfte des
   * Textes keinen Zeilenumbruch trägt: eine lange Mail ohne Absätze, ein
   * Zitatverlauf aus einer Zeile, ein Textkörper aus Emoji.
   *
   * Die Folge war genau die Sackgasse, gegen die {@link suggestTitle} und die
   * ganze Zahlenarbeit dieser Datei geschrieben sind, nur eine Zeile tiefer:
   * Der Benutzer drückt „Inhalt der E-Mail übernehmen", dann „Anlegen" — und
   * bekommt ein 422 auf ein Feld, dessen Inhalt er nicht geschrieben hat, mit
   * keiner anderen Auflösung als „elf Zeichen von Hand löschen".
   *
   * Gemessen und behoben, nicht nur bemerkt: Der Schnitt bekommt sein Budget
   * abzüglich des Hinweises, und `proof-addin.mjs` Abschnitt 16 hält das
   * Ergebnis gegen die **Tür** statt gegen eine Zahl.
   */
  const budget = MAX_TAKEOVER_CHARACTERS - TRUNCATION_HINT.length;
  const cut = cutToCharacterBoundary(combined, budget);
  const lastBreak = cut.lastIndexOf('\n');
  const trimmed = lastBreak > budget / 2 ? cut.slice(0, lastBreak) : cut;
  return `${trimmed}${TRUNCATION_HINT}`;
};
