/**
 * Takt — was das Add-in aus einer E-Mail übernimmt (A-10.5, B-12.3).
 *
 * Ein reiner Wert ohne jede Office-Abhängigkeit. Alles im Aufgabenbereich außer
 * `host.ts` arbeitet ausschließlich damit — deshalb ist der ganze Ablauf vom
 * Titelvorschlag über die Erkennung der Call-Nummer bis zum Duplikatangebot
 * ohne laufendes Outlook prüfbar.
 */

/** Obergrenze für übernommenen Text (B-12.3 Punkt 3). */
export const MAX_TAKEOVER_CHARACTERS = 4000;

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
 */
export const suggestTitle = (subject: string): string => {
  const withoutPrefixes = subject.replace(/^(?:(?:AW|WG|RE|FW|FWD|ANTW)\s*:\s*)+/i, '');
  const collapsed = withoutPrefixes.replace(/\s+/g, ' ').trim();
  return collapsed.length > 512 ? collapsed.slice(0, 512) : collapsed;
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
 */
export const prepareNote = (mail: MailFacts): string => {
  const head =
    mail.senderName.length > 0
      ? `Aus E-Mail von ${mail.senderName}${mail.senderAddress.length > 0 ? ` <${mail.senderAddress}>` : ''}`
      : 'Aus E-Mail';

  const body = mail.body.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const combined = `${head}\nBetreff: ${mail.subject}\n\n${body}`;

  if (combined.length <= MAX_TAKEOVER_CHARACTERS) return combined;

  const cut = combined.slice(0, MAX_TAKEOVER_CHARACTERS);
  const lastBreak = cut.lastIndexOf('\n');
  const trimmed = lastBreak > MAX_TAKEOVER_CHARACTERS / 2 ? cut.slice(0, lastBreak) : cut;
  return `${trimmed}\n…(gekürzt)`;
};
