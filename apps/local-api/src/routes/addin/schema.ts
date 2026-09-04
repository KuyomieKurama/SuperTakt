/**
 * Takt — Eingabeprüfung der Add-in-Routen (T-019).
 *
 * Jede Zeichenkette, die hier hereinkommt, hat mindestens eine fremde Quelle
 * berührt: den Betreff, den Text oder einen Anhangnamen einer E-Mail, die
 * jemand geschickt hat (Akteur A-06). Ein Typ am Rand ist eine Behauptung,
 * keine Prüfung — deshalb `unknown` hinein und ein geprüfter Wert heraus.
 *
 * Die Obergrenzen sind dieselben wie in
 * `apps/local-api/openapi/takt-local-api.yaml`; wo dort `maxLength` steht,
 * steht hier `.max(...)`.
 */

import { z } from 'zod';

/*
 * Die beiden **geprüften Namensformen der Hauptanwendung** (T-114, Befund
 * T-112-1 aus der Sicherheitsprüfung).
 *
 * Bis T-114 stand hier für Titel und Tagname je eine eigene Abschrift
 * (`z.string().trim().min(1).max(…)`), und ein Kommentar sagte zu, sie sei
 * zeichengleich der aus `routes/todos.ts`. Seit T-101 stimmte das nicht mehr:
 * Dort kam die Prüfung auf Steuer- und Richtungszeichen hinzu, hier nicht.
 * Zwei Abschriften derselben Regel sind zwei Gelegenheiten, sie verschieden zu
 * ändern — und genau das ist geschehen.
 *
 * Deshalb jetzt **dieselben Werte** und keine zweite Fassung. Der Bezug über
 * die Modulgrenze ist derselbe wie der auf `http/problem.ts` in `index.ts`:
 * Er holt eine Regel, die es genau einmal geben soll, und keinen Text.
 */
import { nameSchema, titleSchema } from '../../http/input.ts';

/** UUID Fassung 7, wie `Id` in der OpenAPI-Beschreibung. */
const id = z.string().uuid();

/** `YYYY-MM-DDTHH:MM:SSZ`, wie `Timestamp` in der Domäne. */
const timestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

/**
 * Der interne Vermerk aus der E-Mail (A-7.1, B-12.3 Punkt 3).
 *
 * 4000 Zeichen, nicht 65536 wie bei der Hauptanwendung. Der Vorschlag stammt
 * aus B-12.3: Was aus einer E-Mail übernommen wird, soll der Kontext sein und
 * nicht ein ganzer Zitatverlauf. Wer mehr braucht, schreibt es in der
 * Hauptanwendung dazu.
 */
export const ADDIN_NOTE_MAX_LENGTH = 4000;

/**
 * Transportdeckel für die Call-Nummer — **nicht** die Fachregel (T-041, T-046).
 *
 * Die Fachregel ist `checkCallNumber` aus `@takt/domain` (E-045, B-4.3): 3 bis
 * 64 Zeichen aus einem geschlossenen Vorrat. Sie wird in `index.ts` angewandt,
 * und zwar seit T-046 auch beim **Anlegen** und nicht nur bei der
 * Duplikatsuche.
 *
 * Der Deckel liegt bewusst **über** der Fachregel und nicht auf ihr. Wer 70
 * Zeichen einträgt, soll den Satz der Domäne lesen („höchstens 64 Zeichen") und
 * nicht eine englische Schemameldung; nur unbegrenzte Eingabe wird hier
 * abgefangen, bevor sie überhaupt in die Prüfung läuft.
 *
 * Bis T-046 war dieser Deckel die einzige Grenze. Damit ging ein Todo mit einer
 * 70-stelligen Call-Nummer durch, das die Duplikatsuche nie wieder fand — und
 * beim nächsten Mal wurde dieselbe Nummer erneut angelegt. Zwei Todos, ein
 * Kundenvorgang, zwei Zeilen in der Abrechnungsdatei (R-15).
 */
export const ADDIN_CALL_NUMBER_MAX_LENGTH = 128;

/**
 * Wie viele **Namen** eine Anfrage höchstens benennen darf (T-058, T-061).
 *
 * Dieselbe Zahl wie in `routes/todos.ts`, und aus demselben Grund: Kennungen
 * kommen aus einer Auswahl, Namen aus einem Eingabefeld. Fünfzig neue Tags in
 * einer Anfrage sind kein Arbeitsablauf, sondern ein Skript. Zwei verschiedene
 * Zahlen an den beiden Wegen wären die Art Unterschied, die niemand bemerkt,
 * bis eine Anfrage über den einen Weg durchgeht und über den anderen nicht.
 */
export const ADDIN_TAG_NAMES_MAX = 50;

export const createTodoSchema = z.object({
  /**
   * Der Titel — **dasselbe Schema wie `POST /todos`** (T-114, Befund T-112-1).
   *
   * ---------------------------------------------------------------------------
   * Was hier fehlte
   * ---------------------------------------------------------------------------
   *
   * Bis T-114 stand hier `z.string().trim().min(1).max(512)`. Das sagt nichts
   * über C0 und C1 (`U+0000` bis `U+001F`, `U+007F` bis `U+009F`) und nichts
   * über die bidirektionalen Formatierungszeichen (`U+202A` bis `U+202E`,
   * `U+2066` bis `U+2069`).
   *
   * **Die Fachregel schließt die Lücke nicht.** `checkName` in `@takt/domain`
   * normalisiert nach NFC und zieht Leerraum zusammen; seine Menge
   * `WHITESPACE` enthält `U+0009` bis `U+000D`, `U+00A0`, `U+2000` bis
   * `U+200A`, `U+2028`/`U+2029`, `U+202F`, `U+205F`, `U+3000` und `U+FEFF` —
   * **nicht** `U+0000` bis `U+0008`, **nicht** `U+000E` bis `U+001F`,
   * **nicht** C1 und **nicht** die Richtungszeichen. Wer sich auf sie verlässt,
   * verlässt sich auf eine Prüfung, die einen anderen Zweck hat.
   *
   * ---------------------------------------------------------------------------
   * Warum es ausgerechnet an dieser Tür zählt
   * ---------------------------------------------------------------------------
   *
   * An der Hauptfläche gilt „nur wer das Sitzungsgeheimnis hat, tippt einen
   * Titel". Hier gilt der Satz nicht: Der Titel ist im Aufgabenbereich mit dem
   * **Betreff der E-Mail** vorbelegt (`TaskPane.tsx`, `suggestTitle`) und
   * stammt damit von Akteur A-06. Eine Handlung des Benutzers genügt, und der
   * Weg endet nicht in der Anzeige — `todo.title` ist eine zulässige
   * Feldquelle einer Exportvorlage (`packages/export/src/sources.ts`).
   *
   * ---------------------------------------------------------------------------
   * Der Deckel sinkt dabei von 512 auf 500, und das ist kein Beiwerk
   * ---------------------------------------------------------------------------
   *
   * `titleSchema` trägt 500, `POST /todos` und `PATCH /todos/{todoId}` tragen
   * dieselbe Zahl. Ein hier mit 512 Zeichen angelegtes Todo war in der
   * Hauptanwendung **nicht mehr speicherbar**: Der Änderungsdialog schickt den
   * Titel mit, und `titleSchema.optional()` weist ihn ab. Der Benutzer sah
   * seinen eigenen, unveränderten Titel als unzulässige Eingabe — dieselbe
   * Sackgasse aus derselben Ursache wie oben, nur über die Länge statt über
   * ein Zeichen. Zwölf Zeichen kosten das nicht wert; ein Betreff, der sie
   * braucht, ist kein Titel mehr.
   *
   * Das Add-in kürzt seinen Vorschlag auf denselben Wert (`suggestTitle`),
   * und der Nachweispfad hält beide Zahlen gegeneinander.
   */
  title: titleSchema,
  callNumber: z.string().max(ADDIN_CALL_NUMBER_MAX_LENGTH).nullable().default(null),
  statusId: id.nullable().default(null),
  tagIds: z.array(id).max(200).default([]),
  /**
   * Tags über ihren **Namen** statt über eine Kennung (T-058, T-061).
   *
   * ---------------------------------------------------------------------------
   * Es ist **dasselbe** Schema, nicht ein zeichengleiches (T-114)
   * ---------------------------------------------------------------------------
   *
   * Hier stand bis T-114 `z.string().trim().min(1).max(MAX_TAG_NAME_LENGTH)`
   * und darüber der Satz, dieser Wortlaut sei zeichengleich dem `nameSchema`
   * aus `routes/todos.ts`, „damit die Hauptanwendung und das Add-in dieselbe
   * Eingabe annehmen und dieselbe abweisen".
   *
   * **Seit T-101 war dieser Satz falsch.** `nameSchema` weist seither Steuer-
   * und Richtungszeichen ab, diese Abschrift nicht — und der Kommentar sagte
   * dem nächsten Leser ausdrücklich, er brauche nicht nachzusehen. Genau das
   * ist der teure Teil einer Zusicherung, die nicht mehr stimmt.
   *
   * Der Wortlaut kann jetzt nicht mehr auseinanderlaufen, weil es keinen
   * zweiten gibt. Was `nameSchema` heute und morgen abweist, weist diese Route
   * mit ab.
   *
   * `MAX_TAG_NAME_LENGTH` aus der Domäne steht damit nicht mehr in dieser
   * Datei; die Zahl kommt aus `nameSchema` wie an der Hauptfläche auch. Dass
   * beide Zahlen dieselbe sind, prüft der Nachweispfad
   * (`apps/outlook-addin/scripts/proof-addin.mjs`, Abschnitt 16) — eine
   * Ungleichheit soll rot werden und nicht in einem Kommentar behauptet
   * bleiben.
   *
   * **Das Schema ist der Transportdeckel, nicht die Fachregel.** Wann ein Name
   * zulässig ist und wann zwei Namen derselbe sind, sagt `checkTagNames` in
   * `@takt/domain`; es läuft in `service.ts`, nachdem dieses Schema gegriffen
   * hat. Der Unterschied ist derselbe wie bei `callNumber` weiter oben und aus
   * demselben Grund ausgeschrieben — und die Aufgabenteilung ist der Grund,
   * warum die Zeichenprüfung **hier** stehen muss: `checkTagNames` prüft die
   * Gleichheit von Namen, nicht ihre Unbedenklichkeit in einer Anzeige.
   */
  tagNames: z.array(nameSchema).max(ADDIN_TAG_NAMES_MAX).default([]),
  /**
   * Der interne Vermerk — **bewusst ohne die Zeichenprüfung von oben**
   * (T-114 Punkt 4).
   *
   * Das ist keine vergessene Zeile, sondern dieselbe Grenze, die
   * `http/input.ts` zwischen `nameSchema` und `textSchema` zieht, und sie
   * verläuft entlang des Zwecks:
   *
   *  - Ein **Name** wird in fremde Sätze eingesetzt — in eine Aufzählung, in
   *    eine Überschrift, in eine Zeile neben anderen Namen. Dort entscheidet
   *    ein einzelnes Richtungszeichen darüber, was der Leser sieht.
   *  - Ein **Vermerk** wird als eigener Absatz gezeigt. Er ist Text des
   *    Benutzers beziehungsweise übernommener Text einer E-Mail, und ein Feld,
   *    aus dem Zeichen entfernt oder wegen derer die Eingabe abgewiesen würde,
   *    änderte oder verhinderte genau das, wofür es da ist.
   *
   * Der Vermerk verlässt den Dienst außerdem **nicht** über den Export: Er ist
   * die interne Notiz (A-7.2) und in `packages/export/src/sources.ts` keine
   * zulässige Feldquelle. Der Titel ist eine — das ist der Unterschied, der
   * die Prüfung dort nötig macht und hier nicht.
   */
  note: z.string().max(ADDIN_NOTE_MAX_LENGTH).default(''),
});

export const bookSchema = z.object({
  startedAt: timestamp,
  endedAt: timestamp,
  /**
   * Die Leistung. Sie geht in die Abrechnung (A-7.4) und ist deshalb hier —
   * anders als der Vermerk — nicht das Feld, in das E-Mail-Text vorbelegt wird.
   *
   * Auch sie trägt die Zeichenprüfung der Namen **nicht**, und aus demselben
   * Grund wie der Vermerk: Sie ist Freitext des Benutzers, kein Name. Sie
   * stammt zudem als einziges Feld dieser Tür ausschließlich aus dem
   * Eingabefeld des Aufgabenbereichs und nicht aus der E-Mail (T-114 Punkt 4).
   */
  note: z.string().max(4000).default(''),
});

/*
 * Hier stand bis T-038 `reopenIfDone: z.boolean().default(false)`.
 *
 * Seit T-038 hebt eine Buchung „Erledigt" automatisch auf (A-2.5); es gibt
 * nichts mehr zu wählen. Das Feld ist deshalb **ersatzlos** weg und steht
 * bewusst nicht als „wird ignoriert" im Schema: Ein Feld, das man schicken
 * darf und das nichts tut, ist eine Zusage, die niemand einlöst.
 *
 * Ein Aufrufer, der es weiterhin mitschickt, bekommt **kein** 422. Zod wirft
 * unbekannte Schlüssel still weg, und das ist hier die richtige Reihenfolge:
 * Ein `reopenIfDone: false` von einem älteren Aufrufer soll die Aufhebung
 * nicht verhindern — es kann sie nicht verhindern —, und ein 422 an dieser
 * Stelle würde eine Buchung scheitern lassen, die fachlich vollständig ist.
 * Was wirklich geschehen ist, sagt die Antwort (`doneCleared`, `poolMovement`)
 * und nicht die Anfrage.
 */

export type CreateTodoBody = z.infer<typeof createTodoSchema>;
export type BookBody = z.infer<typeof bookSchema>;

export interface FieldIssue {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Übersetzt Zod-Befunde in die `details` der Fehlerhülle.
 *
 * Der Text der Bibliothek ist englisch; die Meldung, die der Benutzer liest,
 * kommt aus der Oberfläche. Was hier hinausgeht, ist der technische Schlüssel
 * und der Feldname (`code`, `field`) — die einzigen beiden Größen, gegen die
 * ein Aufrufer verzweigen darf.
 */
export const toFieldIssues = (error: z.ZodError): readonly FieldIssue[] =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
    code: issue.code,
  }));
