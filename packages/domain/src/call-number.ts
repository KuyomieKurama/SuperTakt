/**
 * Takt — Plausibilisierung der Call-Nummer (E-045, B-4.3, B-4.4, R-15, A-10.9).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Regel hier steht und nirgends sonst
 * ---------------------------------------------------------------------------
 *
 * Sie entscheidet mit, ob das Duplikatangebot aus A-10.9 auf den **richtigen
 * Kundenvorgang** zeigt. Trifft sie falsch, wird Arbeitszeit auf ein fremdes
 * Todo gebucht und landet auf einer fremden Rechnung (R-15, W-10). Damit ist
 * sie eine Regel, die über Geld entscheidet — und für die gilt dieselbe
 * Begründung wie für die Rundung in rounding.ts: Sie existiert **einmal**, in
 * der Domäne, und wird von allen Seiten aufgerufen, statt nachgebaut zu werden.
 *
 * Bis T-021 gab es sie zweimal, mit einem Wächter dagegen: im Add-in als
 * Bedienhilfe, im Dienst als Vertrauensgrenze. Das war für die Dauer von T-019
 * richtig — das Add-in konnte nicht auf eine Funktion warten, die es noch nicht
 * gab. E-045 löst es auf. Der Wächter, der die beiden Fassungen zusammenhielt,
 * entfällt mit ihnen.
 *
 * Die zwei Rollen bleiben trotzdem bestehen, sie teilen sich nur denselben
 * Quelltext:
 *
 *  - Im Add-in ist der Aufruf **Bedienung**: Er entscheidet, ob dem Benutzer
 *    „erkannt" oder „nicht erkannt" angezeigt wird. Ein Fehler dort ist
 *    ärgerlich.
 *  - Im Dienst ist er **Vertrauensgrenze**: Er entscheidet, ob überhaupt
 *    gesucht wird. Der Dienst darf sich nicht darauf verlassen, dass der
 *    Aufrufer die Regel schon eingehalten hat — ein Aufrufer ist ein beliebiger
 *    lokaler Prozess mit einem Token (B-2.9, RR-1), nicht notwendig das Add-in.
 *
 * ---------------------------------------------------------------------------
 * Rein und ohne laufenden Dienst prüfbar
 * ---------------------------------------------------------------------------
 *
 * Keine Uhr, kein Dateisystem, kein Netz, keine Datenbank. Gleiche Eingabe,
 * gleiche Ausgabe — auch beim zehnten Aufruf hintereinander. Der Ausdruck für
 * den Zeichenvorrat trägt deshalb ausdrücklich **kein** `g`: Ein globaler
 * Ausdruck behielte `lastIndex` zwischen zwei Aufrufen und träfe bei jeder
 * zweiten Prüfung nicht (B-4.4).
 */

/** Kürzeste zulässige Länge nach Beschneiden (B-4.3 Punkt 3). */
export const CALL_NUMBER_MIN_LENGTH = 3;

/** Längste zulässige Länge nach Beschneiden (B-4.3 Punkt 3). */
export const CALL_NUMBER_MAX_LENGTH = 64;

/**
 * Zulässiger Zeichenvorrat (B-4.3 Punkt 3).
 *
 * Ohne Leerzeichen, ohne Steuerzeichen, ohne Zeilenumbruch, ohne
 * Anführungszeichen. Der Vorrat ist zugleich die Ausgangsprüfung aus B-4.4:
 * Was hier durchkommt, kann in einer Tabellenkalkulation keine Formel starten
 * und in JSON nichts aufbrechen.
 *
 * Anker auf beiden Seiten, damit ein Treffer die **ganze** Zeichenkette meint
 * und nicht ein Stück davon.
 */
const ALLOWED_SHAPE = /^[A-Za-z0-9._/-]+$/;

/**
 * Führende Zeichen, mit denen eine Tabellenkalkulation eine Formel beginnt
 * (B-4.4).
 *
 * `-` steht im erlaubten Vorrat, weil `TCK-000042` eine übliche Schreibweise
 * ist. Es darf nur nicht **am Anfang** stehen: `-2+3` wäre in Excel eine
 * Rechnung, `TCK-000042` nicht.
 *
 * Von den vier Zeichen erreicht heute nur `-` diese Prüfung — `=`, `+` und `@`
 * fallen schon am Zeichenvorrat durch. Sie stehen trotzdem in der Menge, und
 * zwar absichtlich: Die Regel „keine Formel am Anfang" soll auch dann noch
 * gelten, wenn jemand den Vorrat später erweitert. Eine Prüfung, die nur wirkt,
 * solange eine andere Prüfung sie überflüssig macht, verschwindet beim ersten
 * Umbau.
 */
const FORMULA_STARTERS: ReadonlySet<string> = new Set(['=', '+', '-', '@']);

/** Warum ein Wert nicht als Call-Nummer taugt. Englisch, wie jeder Schlüssel. */
export type CallNumberRejection =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'forbidden_characters'
  | 'formula_start';

/**
 * Ergebnis der Prüfung.
 *
 * Im Erfolgsfall trägt es den **beschnittenen** Wert. Das ist kein Beiwerk:
 * Der Aufrufer soll genau den Wert weiterverwenden, über den geurteilt wurde,
 * und nicht die Rohfassung mit ihren Leerzeichen. Sonst stünde in der
 * Datenbank ein anderer Wert als der geprüfte, und die Duplikatsuche fände
 * `" TCK-1"` nicht neben `"TCK-1"`.
 */
export type CallNumberCheck =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly reason: CallNumberRejection };

/**
 * Ist dieser Wert eine plausible Call-Nummer?
 *
 * Nimmt `unknown` entgegen, weil der Wert aus einer Abfragezeichenkette, aus
 * JSON oder aus einer fremden E-Mail stammt. Ein Typ am Rand ist eine
 * Behauptung, keine Prüfung.
 *
 * Beschnitten wird **vor** allen Längen- und Zeichenprüfungen. Ein Wert, der
 * nur aus Leerzeichen besteht, ist damit `empty` und nicht
 * `forbidden_characters` — der Unterschied zählt, weil `empty` der Fall aus
 * B-4.3 Punkt 4 ist und in der Oberfläche einen anderen Satz verdient.
 */
export const checkCallNumber = (value: unknown): CallNumberCheck => {
  if (typeof value !== 'string') {
    return { ok: false, reason: 'empty' };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  if (trimmed.length < CALL_NUMBER_MIN_LENGTH) {
    return { ok: false, reason: 'too_short' };
  }
  if (trimmed.length > CALL_NUMBER_MAX_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }
  if (!ALLOWED_SHAPE.test(trimmed)) {
    return { ok: false, reason: 'forbidden_characters' };
  }
  if (FORMULA_STARTERS.has(trimmed.charAt(0))) {
    return { ok: false, reason: 'formula_start' };
  }

  return { ok: true, value: trimmed };
};

/**
 * Darf mit diesem Wert überhaupt nach einem Duplikat gesucht werden?
 *
 * **Das ist die eine Regel aus B-4.3 Punkt 4**, die den Hauptschaden aus R-15
 * entschärft: Eine leere oder unplausible Call-Nummer ist **nie** ein
 * Übereinstimmungskriterium. Sie liefert kein „kein Treffer", sondern gar keine
 * Suche — der Unterschied ist wichtig, weil „kein Treffer" später jemand als
 * „dann leg halt an" verkürzen könnte, während „nicht gesucht" eine Aussage
 * über die Eingabe ist.
 */
export const mayLookUpDuplicates = (value: unknown): boolean => checkCallNumber(value).ok;

/**
 * Die Form, in der eine Call-Nummer gespeichert wird: der beschnittene Wert
 * oder `null`.
 *
 * A-2.6 lässt das Feld ausdrücklich leer. `""` und `null` wären in der
 * Datenbank zwei verschiedene Werte, und der Teilindex `ix_todo_call_number`,
 * an dem die Duplikatsuche hängt, führte leere Zeichenketten als vollwertige
 * Werte. Dann fänden sich zwei Todos „mit derselben Call-Nummer", die beide
 * keine haben — genau der Fall aus R-15.
 *
 * Ein Wert, der nicht leer, aber unplausibel ist, wird hier **nicht**
 * verworfen: Ob eine unplausible Nummer angenommen oder abgewiesen wird, ist
 * eine Entscheidung des Anwendungsfalls. Diese Funktion beantwortet nur die
 * Frage „leer oder nicht".
 */
export const normalizeCallNumber = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};
