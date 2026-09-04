/**
 * Takt — was das Add-in aus einer E-Mail übernimmt (A-10.5, B-12.3).
 *
 * Ein reiner Wert ohne jede Office-Abhängigkeit. Alles im Aufgabenbereich außer
 * `host.ts` arbeitet ausschließlich damit — deshalb ist der ganze Ablauf vom
 * Titelvorschlag über die Erkennung der Call-Nummer bis zum Duplikatangebot
 * ohne laufendes Outlook prüfbar.
 */

import { cutToCharacterBoundary } from '../text/cut.ts';
import { dropHidden } from '../text/hidden.ts';

/** Obergrenze für übernommenen Text (B-12.3 Punkt 3). */
export const MAX_TAKEOVER_CHARACTERS = 4000;

/**
 * Obergrenze für den Titelvorschlag — dieselbe Zahl, die der Dienst annimmt
 * (T-114).
 *
 * Hier stand bis T-114 eine 512 mitten im Ausdruck, während `POST /addin/todos`
 * seit derselben Aufgabe 500 nimmt, wie `POST /todos` und `PATCH /todos/{id}`
 * auch. Ein Vorschlag, der länger ist als das, was angenommen wird, ist ein
 * vorbereitetes 422: Der Benutzer drückt „Anlegen" und bekommt eine Abweisung
 * für einen Text, den er nicht geschrieben hat.
 *
 * Der Aufgabenbereich ist ein Browserbündel und kann `titleSchema` nicht
 * importieren — die Zahl steht deshalb zweimal im Baum. Dass sie dieselbe
 * bleibt, prüft `scripts/proof-addin.mjs` Abschnitt 16 gegen das Schema des
 * Dienstes, statt es hier zuzusichern.
 */
export const MAX_TITLE_CHARACTERS = 500;

/*
 * Die Zeichen, die aus einem übernommenen Betreff **fallen**, standen bis T-119
 * hier als eigener Ausdruck (`DROPPED_FROM_SUBJECT`, T-114).
 *
 * Sie stehen jetzt in `../text/hidden.ts`, und zwar aus dem Grund, an dem diese
 * Zeile beinahe gescheitert wäre: **Sie ist auseinandergelaufen.** T-117 hat
 * die Klasse an der Tür des Dienstes um `U+061C`, `U+200E` und `U+200F`
 * erweitert, der Ausdruck hier bekam es nicht mit — und ein Betreff mit einer
 * dieser drei Richtungsmarken ergab wieder genau die Sackgasse, die T-114
 * geschlossen hatte: ein 422 auf einem Feld, an dem nichts Falsches zu sehen
 * ist. Der Nachweispfad hat es nicht bemerkt, weil er die Klasse mit einer
 * **Liste abgeschriebener Zeichen** geprüft hat statt mit der Tür selbst.
 *
 * Beides ist mit T-119 anders:
 *
 *  - Eine Fassung im Add-in (`text/hidden.ts`), die der Titelvorschlag und die
 *    Anzeige teilen.
 *  - Abschnitt 17 des Nachweispfads **fragt die Tür ab** — er geht die ganze
 *    BMP durch und hält jedes dort abgewiesene Zeichen gegen diese Fassung.
 *    Eine Erweiterung wie die aus T-117 wird damit rot und nicht übersehen.
 *
 * Warum überhaupt entfernt wird, obwohl der Dienst abweist, steht unverändert
 * in `text/hidden.ts`: Der Titelvorschlag ist keine Eingabe des Benutzers,
 * sondern ein Vorschlag aus fremder Quelle. Was der Benutzer selbst tippt oder
 * einfügt, geht unverändert an den Dienst und wird dort abgewiesen.
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
 * Gekürzt wird auf 4000 Zeichen, und an einer Zeilengrenze, damit kein Satz
 * mitten im Wort abbricht. Leerzeilenfolgen fallen zusammen — ein Zitatverlauf
 * besteht zur Hälfte daraus.
 *
 * Findet sich keine Zeilengrenze in der zweiten Hälfte, bleibt der harte
 * Schnitt — und der trifft seit T-119 eine Zeichengrenze. Es ist derselbe
 * Befund wie bei {@link suggestTitle}, an derselben Art Zeile: Ein Text aus
 * Emoji ergab hier einen Vermerk mit einer einzelnen Ersatzstelle am Ende,
 * gemessen an Stelle 4000. Der Vermerk geht in die Datenbank; was dort ankommt,
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

  const cut = cutToCharacterBoundary(combined, MAX_TAKEOVER_CHARACTERS);
  const lastBreak = cut.lastIndexOf('\n');
  const trimmed = lastBreak > MAX_TAKEOVER_CHARACTERS / 2 ? cut.slice(0, lastBreak) : cut;
  return `${trimmed}\n…(gekürzt)`;
};
