/**
 * Takt — die Fachregeln der Anhangsübernahme aus einer E-Mail
 * (A-19.22 bis A-19.33, E-108, E-109, A-A-78, A-A-81, A-A-83, A-A-84, A-A-97).
 *
 * ===========================================================================
 * Warum diese Datei in der Domäne liegt und was sie ausdrücklich **nicht** tut
 * ===========================================================================
 *
 * Sie kennt weder HTTP noch SQL noch ein Dateisystem. Sie beantwortet drei
 * Fragen, und jede ist eine Entscheidung und keine Ausführung:
 *
 *  1. **Welche Endung bekommt die Datei auf der Platte?** (A-A-78)
 *  2. **Kommt diese Datei überhaupt herein?** (A-19.30, A-A-81)
 *  3. **Was ist der Anzeigename, den ein Mensch zu sehen bekommt?** (A-19.23a,
 *     A-19.23b, A-A-93)
 *
 * Sie schreibt keine Datei, sie baut keine `.eml` und sie zerlegt keine
 * (A-A-88, A-A-96). Der Rumpf einer Nachricht ist für diesen Bestand ein
 * Bytefeld und kein Format.
 *
 * ===========================================================================
 * Der Befund, aus dem diese Datei ihre Form bekommt (T-297, 39.4.1)
 * ===========================================================================
 *
 * Der security-checker hat die Vorlage nicht gelesen, sondern **gefahren**:
 * 25 Angriffsnamen gegen den `sanitizeFileName` der Outlook-Bridge, echte
 * Dateien, Windows 11 — **25 hinein, 25 auf der Platte, null Ablehnungen**.
 * `NUL`, `COM1`, `CON.txt` und `prn.pdf` landeten als Datei, die Windows
 * anschließend **nicht sieht**.
 *
 * Die Antwort darauf ist **kein zweiter Namensfilter**. Ein Filter, der 25
 * Fälle abweist, ist ein Filter, der beim 26. durchläßt. Statt dessen gilt
 * A-A-78: **Der fremde Name wird nie ein Pfadbestandteil.** Er lebt als
 * Anzeigename im Bestand; den Namen auf der Platte erzeugt SuperTakt. Damit
 * sind Pfadausbruch, Gerätename, Richtungszeichen, Kollision und Kappung
 * **nicht abgewehrt, sondern unmöglich** — und das ist der Unterschied, auf
 * den es hier ankommt.
 *
 * Übernommen wird aus dem fremden Namen **genau eine** Angabe: die Endung. Sie
 * entscheidet, womit die Datei geöffnet wird (A-19.23a), und sie ist deshalb
 * die eine Stelle, an der fremder Text den Pfad noch berührt. Wie eng das
 * gefaßt ist, steht bei {@link emailFileExtension}.
 *
 * ===========================================================================
 * „Geprüfter Name ≠ aufgelöster Name" — die Falle, die dieser Bestand dreimal
 * hatte
 * ===========================================================================
 *
 * T-156-1, T-164-1 und jetzt T-297: Wo ein Pfad geprüft und ein anderer
 * benutzt wird, ist die Prüfung wertlos. Deshalb misst {@link emailFileExtension}
 * über {@link fileExtensionOf}, also am **aufgelösten** Namen (nachgestellte
 * Punkte und Leerzeichen abgeschnitten, wie Windows es tut) — und deshalb
 * prüft der Aufrufer die Endung, die er **erzeugt** hat, und nicht die, die
 * ihm angesagt wurde.
 */

import { INDIRECT_EXTENSIONS, fileExtensionOf } from './attachment.ts';

// ---------------------------------------------------------------------------
// Fehlgründe — eine geschlossene Menge, keine freien Zeichenketten (A-19.29)
// ---------------------------------------------------------------------------

/**
 * Warum eine einzelne Datei nicht übernommen wurde.
 *
 * **Acht Werte, und sie sind nicht hier erfunden worden**: Sie stammen aus
 * `docs/design/addin-anhangsuebernahme-fluss.md` Abschnitt 6.2, wo der
 * ux-designer sie samt Satzteil festgelegt hat. Diese Datei führt die
 * Kennungen, nicht die Sätze — der Satz gehört der Fläche, die ihn zeigt.
 *
 * **Warum eine geschlossene Menge und kein Freitext.** A-19.29 verlangt einen
 * Grund je nicht übernommenem Anhang. Der naheliegende Weg wäre, die Meldung
 * des Betriebssystems oder von Office durchzureichen — und genau das ist
 * verboten (AB-3): Eine Fehlermeldung aus fremder Hand ist fremder Text an
 * einer Stelle, an der ein Mensch eine Auskunft von SuperTakt erwartet. Sie
 * verriete außerdem Innenleben (B-2.4).
 *
 * Die Aufteilung nach Zuständigkeit, weil sie beim Lesen der Naht zählt:
 *
 *  - **Der Aufgabenbereich** kann `not_released`, `timeout`, `connection`,
 *    `rebuild_rejected` und `outlook_too_old` feststellen; sie entstehen,
 *    bevor ein Byte den Dienst erreicht. Er meldet sie **mit**, damit sie im
 *    selben Ergebnis stehen wie die übrigen (A-19.31: was fehlt, steht dabei).
 *  - **Der Dienst** stellt `too_large`, `rejected` und `not_a_web_address`
 *    fest — er ist die Stelle, die zählt, benennt und ablegt.
 *
 * Beide Seiten benutzen **dieselben** acht Kennungen. Zwei Vorräte für
 * dieselbe Sache wären zwei Wahrheiten, von denen eine altert.
 *
 * ===========================================================================
 * Diese Liste ist die **einzige** (T-301, nach T-300)
 * ===========================================================================
 *
 * In derselben Welle ist im Aufgabenbereich eine zweite entstanden
 * (`SkipReason`, zehn Werte). Sie deckte sich an drei Stellen nicht mit dieser,
 * und der Orchestrator hat entschieden: **`packages/domain` ist die Quelle**,
 * der Aufgabenbereich bildet auf sie ab und führt keine eigene. Zwei Namen für
 * dieselbe Sache sind kein Feinschliff — der Grund wandert über die Leitung und
 * steht am Ende in einem Satz, den ein Mensch liest.
 *
 * Zwei Änderungen aus dieser Zusammenführung, und beide sind Aussagen über den
 * Bestand und nicht über Geschmack:
 *
 *  - **`rebuild_rejected` kommt hinzu.** Der Nachbau der Nachricht (A-19.22a)
 *    kann **abgelehnt** werden: A-A-96 verlangt, daß jede Kopfzeile kodiert
 *    entsteht und jedes `CR`/`LF` im Wert ein Ablehnungsgrund ist. Wo das
 *    greift, entsteht keine Datei — und das ist seit E-109 der **einzige** Fall,
 *    in dem die E-Mail selbst fehlt.
 *  - **`mailbox_closed` fällt.** Er stand für „das Postfach gibt die Nachricht
 *    nicht heraus". Seit E-109 kommt die Nachricht über `getAsFileAsync`, und
 *    gibt Outlook sie nicht her, **fehlt sie nicht** — sie wird nachgebaut
 *    (A-19.22a). Der Zustand ist damit unerreichbar, und ein Grund, der nicht
 *    eintreten kann, ist ein Satz, der das Gegenteil des Bestands behauptet.
 *
 * `too_many` und `total_too_large` aus der zweiten Liste sind **nicht**
 * übernommen. Sie sind eine Feinheit der Anzeige und keine Aussage über den
 * Bestand: Die 26. Datei ist `rejected` (zu viel, nicht zu groß), und eine
 * gerissene Summe läßt dem Benutzer dieselbe Handlung wie eine zu große
 * Einzeldatei. Wer den Satz feiner haben will, unterscheidet ihn an der Fläche;
 * die Meldung trägt ohnehin den Namen der Datei.
 */
export type EmailAttachmentFailureReason =
  /** Über der Grenze je Datei oder über der Summe einer Übernahme (A-19.30). */
  | 'too_large'
  /** Outlook hat die Datei nicht herausgegeben (Office-Fehler beim Abruf). */
  | 'not_released'
  /** Der Abruf hat den Deckel je Anhang gerissen. */
  | 'timeout'
  /** SuperTakt hat die Datei nicht angenommen — Form, Anzahl, Ablage. */
  | 'rejected'
  /** Die Übertragung zum Dienst ist abgerissen. */
  | 'connection'
  /** Ein Cloud-Anhang, dessen Ablageort keine `http`/`https`-Adresse ist. */
  | 'not_a_web_address'
  /**
   * Der **Nachbau** der Nachricht wurde abgelehnt (A-19.22a, A-A-96).
   *
   * Seit E-109 der einzige Fall, in dem die E-Mail selbst fehlt: Gibt Outlook
   * sie nicht als Datei heraus, wird sie nachgebaut — und der Nachbau weigert
   * sich, wo eine Kopfzeile nicht kodiert entstehen kann. Kein Fehlschlag eines
   * Abrufs, sondern eine Weigerung, etwas zu erzeugen, das falsch wäre.
   */
  | 'rebuild_rejected'
  /** Dieses Outlook gibt Anhänge nicht heraus (A-19.31). */
  | 'outlook_too_old';

/**
 * Die Fehlgründe als Datensatz — dieselbe Bauart wie
 * {@link ATTACHMENT_ORIGIN_PRESENCE} und aus demselben Grund.
 */
export const EMAIL_ATTACHMENT_FAILURE_PRESENCE: Readonly<
  Record<EmailAttachmentFailureReason, true>
> = Object.freeze({
  too_large: true,
  not_released: true,
  timeout: true,
  rejected: true,
  connection: true,
  not_a_web_address: true,
  rebuild_rejected: true,
  outlook_too_old: true,
});

/** Die acht Fehlgründe in fester Reihenfolge. */
export const EMAIL_ATTACHMENT_FAILURE_REASONS: readonly EmailAttachmentFailureReason[] =
  Object.freeze(Object.keys(EMAIL_ATTACHMENT_FAILURE_PRESENCE) as EmailAttachmentFailureReason[]);

/** Ist diese Zeichenkette einer der acht Gründe? */
export function isEmailAttachmentFailureReason(
  value: string,
): value is EmailAttachmentFailureReason {
  return Object.hasOwn(EMAIL_ATTACHMENT_FAILURE_PRESENCE, value);
}

// ---------------------------------------------------------------------------
// Grenzen — drei, und alle drei gelten **vor** dem ersten Byte auf der Platte
// ---------------------------------------------------------------------------

/**
 * Die Größengrenze **je Datei** (A-19.30, E-108 Punkt 3): 25 MB.
 *
 * Die Zahl stammt aus E-108 Punkt 3 und damit aus der Vorlage; sie ist
 * ausdrücklich vom Auftraggeber gesetzt. Sie ist die **dritte** benannte
 * Ausnahme von B-1.7 neben der Datensicherung, und sie steht an genau dieser
 * einen Stelle.
 *
 * **Gezählt wird beim Dekodieren, nicht an einer Ankündigung** (A-A-81,
 * A-A-15 wörtlich). `detail.size` aus Office.js ist eine Behauptung des
 * Absenders und keine Grenze; in A-V-6 war genau das ein Befund. Die Naht
 * nimmt deshalb **keine** Größenangabe entgegen — was nicht da ist, kann nicht
 * geglaubt werden.
 *
 * Der Wert gilt für die **dekodierten** Bytes. Base64 bläht um ein Drittel
 * auf; die Rumpfgrenze der Route rechnet das mit ein, siehe
 * {@link MAX_EMAIL_ATTACHMENT_TOTAL_BYTES}.
 */
export const MAX_EMAIL_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/**
 * Die Summengrenze über **eine** Übernahme: 48 MB dekodiert.
 *
 * Sie ist keine frei gewählte Zahl, sondern die Umrechnung der Rumpfgrenze
 * dieser einen Route. Das Bedrohungsmodell setzt diese auf 64 MB (39.4.5:
 * „Wer sie auf 64 MB setzt, hat die 130 MB nicht"), und 64 MB Base64 tragen
 * genau `64 · 3/4 = 48` MB Nutzlast.
 *
 * **Warum die beiden Zahlen aneinander hängen müssen.** Stünde hier eine
 * Summengrenze, die größer ist als das, was der Rumpf tragen kann, dann wäre
 * die wirksame Grenze die Rumpfgrenze — und der Benutzer bekäme statt einer
 * benannten Meldung nach A-19.29 einen abgewiesenen Rumpf ohne Namen. Zwei
 * Grenzen über dieselbe Sache, von denen die eine die andere verdeckt, sind
 * die Bauart, aus der stille Ausfälle entstehen.
 *
 * Die Rumpfgrenze selbst steht im Dienst (`config.ts`), weil sie eine Angabe
 * über HTTP ist. Der Zusammenhang steht dort noch einmal, und beide Zahlen
 * werden gegeneinander gemessen.
 */
export const MAX_EMAIL_ATTACHMENT_TOTAL_BYTES = 48 * 1024 * 1024;

/**
 * Die Anzahl der Dateien je Übernahme: 25.
 *
 * Die dritte Grenze aus A-A-81, und die billigste: Eine E-Mail mit 4 000
 * Anhängen à 2 KB reißt weder die Grenze je Datei noch die Summe, erzeugt aber
 * 4 000 Dateien im Anwendungsdatenverzeichnis und 4 000 Zeilen an einem Todo.
 *
 * 25 ist großzügig gegenüber dem, was ein Postfach überhaupt zustellt, und
 * eng genug, daß die Liste im Ergebnis noch eine Liste ist. Was darüber
 * hinausgeht, wird **namentlich gemeldet** (A-19.29) und nicht stillschweigend
 * abgeschnitten.
 */
export const MAX_EMAIL_ATTACHMENT_COUNT = 25;

/**
 * Die längste Endung, die aus einem fremden Namen übernommen wird: 16 Zeichen
 * (A-A-78 wörtlich).
 *
 * Alles darüber ist keine Endung mehr, sondern ein Namensteil hinter einem
 * Punkt. Die längsten Endungen, die auf einem Windows-Rechner etwas bedeuten,
 * haben fünf (`xhtml`, `pptx`); 16 ist Luft nach oben und trotzdem eine
 * Grenze.
 */
export const MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH = 16;

/**
 * Die Länge des Anzeigenamens im Bestand: 255 Zeichen.
 *
 * Warum überhaupt eine Grenze: Der Anzeigename ist fremder Text, und fremder
 * Text ohne Deckel ist ein Roman in einer Spalte. 255 ist die Zahl, an der
 * jedes hier in Frage kommende Dateisystem seinen Namen beendet — wer sie
 * reißt, hat keinen Dateinamen geschickt.
 *
 * Was **nicht** geschieht, wenn sie gerissen wird: abweisen. Die Datei kommt
 * herein, der Name wird **in der Mitte** gekürzt und die Kürzung ist sichtbar
 * ({@link shortenEmailDisplayName}). Am Ende zu kürzen ist verboten (A-19.23b,
 * A-A-93, R-27) — es nähme der Anzeige die Endung, ohne ein einziges Zeichen
 * zu verändern, und genau das ist der einzige bekannte Weg, die Rückfrage vor
 * dem Öffnen zum Lügen zu bringen.
 */
export const MAX_EMAIL_DISPLAY_NAME_CHARACTERS = 255;

// ---------------------------------------------------------------------------
// Die Endung — die eine Angabe, die aus fremdem Text in den Pfad geht
// ---------------------------------------------------------------------------

/**
 * Die Endung, die der erzeugte Dateiname bekommt — oder `null` für „keine".
 *
 * A-A-78, Zeile für Zeile:
 *
 *  1. Gemessen am **aufgelösten** Namen ({@link fileExtensionOf} schneidet
 *     nachgestellte Punkte und Leerzeichen ab und nimmt nur das letzte
 *     Pfadsegment — `..\\..\\Startup\\x.bat` ergibt `bat`, nicht mehr).
 *  2. **Kleingeschrieben.** `CON.TXT` und `con.txt` sollen nicht zwei Dinge
 *     sein.
 *  3. **Nur `[a-z0-9]`.** Ein Punkt, ein Doppelpunkt, ein Leerzeichen, ein
 *     Richtungszeichen, ein Nullbyte, ein `$` — alles ergibt **keine** Endung
 *     statt einer umgeschriebenen. `rechnung.lnk::$DATA` liefert
 *     `lnk::$data`, und das ist hier `null` und nicht `lnk`.
 *  4. **Höchstens {@link MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH} Zeichen.**
 *
 * **Keine Endung ist ein zulässiges Ergebnis und kein Fehlschlag.** Die Datei
 * heißt dann `<32 Hexziffern>` ohne Punkt; Windows startet nichts, und der
 * Benutzer bekommt beim Öffnen die Frage, womit. Das ist der ehrlichere
 * Ausgang als eine erratene Endung.
 *
 * **Was diese Funktion ausdrücklich nicht tut:** urteilen. Ob eine Endung
 * angenommen wird, entscheidet {@link nameEmailFile} eine Ebene darüber — hier
 * steht nur, **welche** Endung es wäre.
 */
export function emailFileExtension(displayName: string): string | null {
  const raw = fileExtensionOf(displayName);
  if (raw === '') return null;
  if (raw.length > MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH) return null;
  for (const character of raw) {
    const code = character.codePointAt(0) ?? 0;
    const digit = code >= 0x30 && code <= 0x39;
    const letter = code >= 0x61 && code <= 0x7a;
    if (!digit && !letter) return null;
  }
  return raw;
}

/**
 * Wie die Datei auf der Platte heißen darf — oder warum gar nicht.
 *
 * `ok: true` trägt die Endung, die der Aufrufer an seinen **erzeugten** Namen
 * hängt. `null` heißt „ohne Endung".
 *
 * ---------------------------------------------------------------------------
 * Warum eine Umleitungsendung hier **abgewiesen** und nicht entschärft wird
 * ---------------------------------------------------------------------------
 *
 * `.lnk`, `.url`, `.pif`, `.scf` und `.desktop` weist der Öffnen-Befehl der
 * Hülle bei **jedem** Aufruf ab ({@link INDIRECT_EXTENSIONS}, A-A-5) — nicht
 * weil sie die gefährlichsten sind, sondern weil die Rückfrage über sie nicht
 * die Wahrheit sagen kann: Was hinter einer Verknüpfung steckt, steht nicht in
 * ihrem Namen.
 *
 * Nähmen wir sie trotzdem an, entstünde genau der Zustand, den das
 * Bedrohungsmodell in 39.4.2 als **Ehrlichkeitsproblem** benennt: Der Dienst
 * legt die Datei ab, meldet nach A-19.29 „übernommen", trägt sie in
 * `todo_attachment` ein — und der Öffnen-Befehl findet sie nie an. Der
 * Benutzer sähe einen Anhang, der von Anfang an tot war, und A-19.29 hätte ihm
 * das Gegenteil gesagt.
 *
 * Deshalb: abweisen, mit Namen und Grund (`rejected`), im selben Ergebnis wie
 * jede andere übersprungene Datei. Der Benutzer erfährt es **sofort** statt
 * drei Wochen später an einer Schaltfläche, die nichts tut. Das ist die
 * Auslegung von „sämtliche Dateianhänge" (A-19.23), die A-19.29 und A-19.30
 * bereits vorsehen: Übersprungen wird benannt, nicht verschwiegen.
 *
 * **Geprüft wird, was benutzt wird.** Die Endung in diesem Urteil ist
 * zeichengleich die, die der Aufrufer an den erzeugten Namen hängt — nicht die
 * aus dem fremden Namen. Wer hier den Rohnamen prüfte und den erzeugten
 * benutzte, baute T-156-1 zum vierten Mal.
 */
export type EmailFileNaming =
  | { readonly ok: true; readonly extension: string | null }
  | { readonly ok: false; readonly reason: EmailAttachmentFailureReason };

/** Siehe {@link EmailFileNaming}. */
export function nameEmailFile(displayName: string): EmailFileNaming {
  if (displayName.trim() === '') return { ok: false, reason: 'rejected' };
  const extension = emailFileExtension(displayName);
  if (extension !== null && INDIRECT_EXTENSIONS.includes(extension)) {
    return { ok: false, reason: 'rejected' };
  }
  return { ok: true, extension };
}

// ---------------------------------------------------------------------------
// Die Grenzen, angewandt
// ---------------------------------------------------------------------------

/** Das Urteil über eine einzelne Datei an den drei Grenzen aus A-A-81. */
export type EmailAttachmentAdmission =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: EmailAttachmentFailureReason };

/**
 * Kommt diese Datei herein? (A-19.30, A-A-81.)
 *
 * Rein, und deshalb hier: Die Entscheidung hängt an drei Zahlen und an keinem
 * Dateisystem. Der Aufrufer führt die Summe und die Anzahl über den Lauf mit
 * und fragt je Datei — **bevor** er schreibt.
 *
 * Die Zuordnung der Gründe ist nicht beliebig:
 *
 *  - **Größe je Datei und Summe ergeben `too_large`.** Der Satz dazu nennt die
 *    Grenze, und der Benutzer kann etwas damit anfangen (die Datei einzeln
 *    speichern und von Hand anhängen).
 *  - **Anzahl und leerer Rumpf ergeben `rejected`.** Beides ist keine
 *    Größenaussage: Eine leere Datei ist keine zu große, und die 26. Datei ist
 *    nicht zu groß, sondern zu viel. `too_large` dafür zu nehmen wäre ein
 *    Satz, der auf die falsche Ursache zeigt — derselbe Fehler, den T-159 bei
 *    `unreadable` gegen `write_failed` berichtigt hat.
 */
export function admitEmailAttachment(input: {
  readonly bytes: number;
  readonly bytesBefore: number;
  readonly countBefore: number;
}): EmailAttachmentAdmission {
  if (!Number.isInteger(input.bytes) || input.bytes <= 0) return { ok: false, reason: 'rejected' };
  if (input.countBefore >= MAX_EMAIL_ATTACHMENT_COUNT) return { ok: false, reason: 'rejected' };
  if (input.bytes > MAX_EMAIL_ATTACHMENT_BYTES) return { ok: false, reason: 'too_large' };
  if (input.bytesBefore + input.bytes > MAX_EMAIL_ATTACHMENT_TOTAL_BYTES) {
    return { ok: false, reason: 'too_large' };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Base64 — die Länge messen, bevor etwas dekodiert wird
// ---------------------------------------------------------------------------

/** Standardalphabet, gepolstert, ohne Leerraum. */
const BASE64_SHAPE = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Wie viele Bytes stecken in dieser Base64-Zeichenkette? `null`, wenn es keine
 * ist.
 *
 * ---------------------------------------------------------------------------
 * Warum gerechnet und nicht dekodiert
 * ---------------------------------------------------------------------------
 *
 * A-A-81 verlangt, daß die Grenze greift, **bevor** das erste Byte auf der
 * Platte liegt. Sie soll aber auch greifen, bevor 40 MB Base64 zu 30 MB
 * Puffer werden: Die Länge einer Base64-Zeichenkette bestimmt die Größe des
 * Ergebnisses **exakt**, ohne daß ein Byte dekodiert wird.
 *
 * **Das ist keine Ankündigung im Sinne von A-A-15.** Eine Ankündigung ist eine
 * Zahl, die jemand daneben schreibt (`detail.size`); hier wird die Nutzlast
 * selbst gemessen. Der Aufrufer prüft trotzdem **danach** noch einmal am
 * dekodierten Puffer — nicht weil diese Rechnung falsch sein könnte, sondern
 * weil dann die Zahl gemessen ist, die wirklich geschrieben wird. Zwei
 * Messungen derselben Sache kosten hier nichts und schließen die Lücke
 * zwischen Rechnung und Wirklichkeit.
 *
 * ---------------------------------------------------------------------------
 * Warum die Form eng ist
 * ---------------------------------------------------------------------------
 *
 * Kein Leerraum, keine Zeilenumbrüche, kein URL-sicheres Alphabet, keine
 * fehlende Polsterung. `Buffer.from(x, 'base64')` ist **nachsichtig**: Es
 * überspringt, was es nicht kennt, und liefert für zwei verschiedene
 * Zeichenketten dasselbe Ergebnis. Eine nachsichtige Dekodierung hinter einer
 * genauen Längenrechnung ist der Zustand, in dem gemessene und geschriebene
 * Größe auseinanderlaufen — dieselbe Klasse wie „geprüfter Name ≠ aufgelöster
 * Name", nur mit Zahlen.
 */
export function decodedBase64ByteLength(value: string): number | null {
  if (value.length === 0) return 0;
  if (value.length % 4 !== 0) return null;
  if (!BASE64_SHAPE.test(value)) return null;
  let padding = 0;
  if (value.endsWith('==')) padding = 2;
  else if (value.endsWith('=')) padding = 1;
  return (value.length / 4) * 3 - padding;
}

// ---------------------------------------------------------------------------
// Der Anzeigename — fremder Text, und er bleibt lesbar
// ---------------------------------------------------------------------------

/** Die sichtbare Marke einer Kürzung. Ein Zeichen, und es ist keines der verbotenen. */
const TRUNCATION_MARK = '…';

/**
 * Der Anzeigename, wie er in den Bestand geht (A-19.23a, A-19.23b, A-A-93).
 *
 * Kürzer als {@link MAX_EMAIL_DISPLAY_NAME_CHARACTERS}: unverändert. Länger:
 * **in der Mitte** gekürzt, mit sichtbarer Marke, und das **Ende bleibt
 * vollständig stehen** — die Endung ist die eine Stelle des Namens, an der
 * etwas über die Gefährlichkeit der Datei steht.
 *
 * ---------------------------------------------------------------------------
 * Warum hier überhaupt gekürzt wird, obwohl Kürzen sonst der Fehler ist
 * ---------------------------------------------------------------------------
 *
 * R-27 und A-A-93 verbieten die Kürzung **in der Anzeige** — dort ist sie ein
 * Angriff auf die Rückfrage, weil sie ohne ein verändertes Zeichen die Endung
 * verschwinden läßt. Hier geht es um etwas anderes: Irgendwo muß ein Deckel
 * gegen einen Namen aus 10 000 Zeichen stehen, und die einzige Wahl ist, **wo**
 * er steht und **wie** er aussieht.
 *
 * Er steht hier, weil das die eine Stelle ist, an der der fremde Name in den
 * Bestand geht — und er kürzt in der Mitte, weil die Anzeige danach nichts
 * mehr richtigstellen kann. Die Vorlage hat `slice(-150)` genommen und damit
 * den **Anfang** weggeworfen: die Endung überlebt, der Teil, den ein Mensch
 * liest, nicht (39.4.1). Beides zu behalten ist billiger als die Wahl.
 *
 * Die Marke ist sichtbar und steht **im** Namen: Wer `Rechnung…2026.pdf` liest,
 * sieht, daß etwas fehlt. Eine unsichtbare Kürzung wäre dieselbe Lüge wie ein
 * CSS-Deckel, nur dauerhaft.
 */
export function shortenEmailDisplayName(displayName: string): string {
  const characters = [...displayName];
  if (characters.length <= MAX_EMAIL_DISPLAY_NAME_CHARACTERS) return displayName;

  // Die Marke zählt mit: Das Ergebnis hält die Grenze, nicht die Grenze plus
  // eins. Vorn bleibt mehr stehen als hinten — der Anfang ist der Teil, an dem
  // ein Mensch die Datei wiedererkennt; hinten genügt, was die Endung trägt.
  const budget = MAX_EMAIL_DISPLAY_NAME_CHARACTERS - 1;
  const tail = Math.min(64, Math.floor(budget / 3));
  const head = budget - tail;
  return `${characters.slice(0, head).join('')}${TRUNCATION_MARK}${characters.slice(-tail).join('')}`;
}
