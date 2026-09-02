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

import { MAX_TAG_NAME_LENGTH } from '@takt/domain';

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
  title: z.string().trim().min(1).max(512),
  callNumber: z.string().max(ADDIN_CALL_NUMBER_MAX_LENGTH).nullable().default(null),
  statusId: id.nullable().default(null),
  tagIds: z.array(id).max(200).default([]),
  /**
   * Tags über ihren **Namen** statt über eine Kennung (T-058, T-061).
   *
   * Der Wortlaut des Schemas ist zeichengleich der aus `routes/todos.ts`
   * (`nameSchema` = `z.string().trim().min(1).max(200)`), damit die
   * Hauptanwendung und das Add-in dieselbe Eingabe annehmen und dieselbe
   * abweisen. `MAX_TAG_NAME_LENGTH` kommt aus der Domäne und nicht als Zahl in
   * diese Datei: Dort steht sie neben der Regel, die sie prüft.
   *
   * **Das Schema ist der Transportdeckel, nicht die Fachregel.** Wann ein Name
   * zulässig ist und wann zwei Namen derselbe sind, sagt `checkTagNames` in
   * `@takt/domain`; es läuft in `service.ts`, nachdem dieses Schema gegriffen
   * hat. Der Unterschied ist derselbe wie bei `callNumber` weiter oben und aus
   * demselben Grund ausgeschrieben.
   */
  tagNames: z.array(z.string().trim().min(1).max(MAX_TAG_NAME_LENGTH)).max(ADDIN_TAG_NAMES_MAX).default([]),
  note: z.string().max(ADDIN_NOTE_MAX_LENGTH).default(''),
});

export const bookSchema = z.object({
  startedAt: timestamp,
  endedAt: timestamp,
  /**
   * Die Leistung. Sie geht in die Abrechnung (A-7.4) und ist deshalb hier —
   * anders als der Vermerk — nicht das Feld, in das E-Mail-Text vorbelegt wird.
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
 * Was wirklich geschehen ist, sagt die Antwort (`doneCleared`, `poolNames`)
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
