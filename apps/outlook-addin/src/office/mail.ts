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

/**
 * Zeichen, die aus einem übernommenen Betreff **fallen** (T-114, Befund
 * T-112-1).
 *
 * ---------------------------------------------------------------------------
 * Warum das Add-in sie entfernt, obwohl der Dienst sie abweist
 * ---------------------------------------------------------------------------
 *
 * Seit T-114 weist `POST /addin/todos` Steuerzeichen (C0, C1) und die
 * bidirektionalen Formatierungszeichen ab — dieselbe Prüfung wie an der
 * Hauptanwendung, und das ist die maßgebliche. Diese Zeile hier ersetzt sie
 * nicht; sie sorgt dafür, dass der Benutzer nie in sie hineinläuft.
 *
 * Der Unterschied liegt in der Herkunft des Textes. `http/input.ts` begründet
 * ausführlich, warum ein Name **abgewiesen** und nicht bereinigt wird: Ein
 * stilles Entfernen änderte, was der Benutzer eingegeben hat, und er erführe
 * es nicht. Der Titelvorschlag ist aber nichts, was der Benutzer eingegeben
 * hat — er ist ein **Vorschlag aus fremder Quelle**, den er vor dem Absenden
 * in einem Eingabefeld sieht und ändern kann. Ihn zu bereinigen ändert keine
 * Eingabe; ihn stehen zu lassen führte in eine Sackgasse: Eine E-Mail mit
 * einem unsichtbaren Zeichen im Betreff ergäbe ein 422 auf einem Feld, an dem
 * nichts Falsches zu sehen ist, und der einzige Ausweg wäre, den ganzen Titel
 * neu zu tippen.
 *
 * Was ein Benutzer selbst tippt oder einfügt, geht unverändert an den Dienst
 * und wird dort abgewiesen — mit der Meldung an dem Feld, in dem es passiert
 * ist. Diese Zeile fasst es nicht an.
 *
 * ---------------------------------------------------------------------------
 * Warum `U+0009` bis `U+000D` **nicht** in dieser Menge stehen
 * ---------------------------------------------------------------------------
 *
 * Sie sind Leerraum. Der Dienst weist sie ab, weil sie zu C0 gehören; hier
 * werden sie eine Zeile weiter unten von `\s+` zu einem Leerzeichen — aus
 * „Störung\tLüftung" wird „Störung Lüftung" und nicht „StörungLüftung". Sie
 * ersatzlos zu streichen klebte zwei Wörter zusammen.
 *
 * Der Nachweispfad prüft nicht, ob diese Menge der des Dienstes gleicht,
 * sondern das, worauf es ankommt: dass **jedes** vom Dienst abgewiesene
 * Zeichen einen Vorschlag ergibt, den der Dienst annimmt.
 */
// eslint-disable-next-line no-control-regex -- genau darum geht es hier
const DROPPED_FROM_SUBJECT = /[\u0000-\u0008\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu;

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
 * Seit T-114 fallen außerdem die Zeichen aus {@link DROPPED_FROM_SUBJECT}
 * heraus, und der Vorschlag endet bei {@link MAX_TITLE_CHARACTERS} statt bei
 * 512. Beides aus demselben Grund: Was hier herauskommt, steht als Vorschlag im
 * Titelfeld — und ein Vorschlag, den der Dienst abweist, ist eine Sackgasse mit
 * einer Fehlermeldung an einem Feld, an dem nichts Falsches zu sehen ist.
 *
 * Die Reihenfolge ist nicht beliebig. Erst fallen die unsichtbaren Zeichen,
 * dann wird Leerraum zusammengezogen: Ein `U+0000` zwischen zwei Leerzeichen
 * ließe sonst zwei Leerzeichen zurück.
 */
export const suggestTitle = (subject: string): string => {
  const withoutPrefixes = subject.replace(/^(?:(?:AW|WG|RE|FW|FWD|ANTW)\s*:\s*)+/i, '');
  const visible = withoutPrefixes.replace(DROPPED_FROM_SUBJECT, '');
  const collapsed = visible.replace(/\s+/g, ' ').trim();
  return collapsed.length > MAX_TITLE_CHARACTERS ? collapsed.slice(0, MAX_TITLE_CHARACTERS) : collapsed;
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
