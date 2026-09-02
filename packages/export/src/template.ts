/**
 * Takt — Prüfung einer Exportvorlage (E-005, E-017, A-7.2, A-8.7, R-06, R-18).
 *
 * Hier verläuft die Datenschutzgrenze aus A-7.2 zum zweiten Mal — das erste Mal
 * verläuft sie im Typ `ExportSourcePath` der Domäne, wo der interne Vermerk
 * schlicht nicht vorkommt. Diese Datei sorgt dafür, dass auch eine Vorlage, die
 * nicht durch den Editor kam, ihn nicht benennen kann: aus einer Datei, über
 * die HTTP-Schnittstelle, aus einem alten Bestand.
 *
 * Der Unterschied zwischen „nicht vorgesehen" und „nicht möglich" ist genau
 * dieser: Die Liste ist geschlossen, der Abgleich wörtlich, und was nicht
 * darauf steht, wird abgewiesen — nicht ausgelassen, nicht ersetzt, nicht
 * zurechtgebogen.
 */

import type { ExportSourcePath } from '@takt/domain/export';

import type {
  ExportConditionOperator,
  ExportFieldCondition,
  ExportFieldDefinition,
  ExportResult,
  ExportTemplateDefinition,
  ExportTemplateError,
  ExportTransformation,
} from './model.ts';
import { isExportSourcePath } from './sources.ts';

/** Fehlerschlüssel, die die Feldprüfung liefern kann. */
type FieldErrorCode = 'export_source_forbidden' | 'validation_error';

const failure = (
  code: FieldErrorCode,
  message: string,
  field: string,
): ExportResult<never, ExportTemplateError<FieldErrorCode>> => ({
  ok: false,
  error: { code, message, details: [{ field, message, code }] },
});

const TRANSFORMATION_PRESENCE: Readonly<Record<ExportTransformation, true>> = {
  raw: true,
  base64: true,
  quarter_hours_to_number: true,
};

const KNOWN_TRANSFORMATIONS: ReadonlySet<string> = new Set<string>(
  Object.keys(TRANSFORMATION_PRESENCE),
);

/** Alle wählbaren Transformationen, für die Auswahlliste im Editor (S-14). */
export const EXPORT_TRANSFORMATIONS: readonly ExportTransformation[] = Object.keys(
  TRANSFORMATION_PRESENCE,
) as readonly ExportTransformation[];

/**
 * Die Vergleiche einer Feldbedingung — an den Typ gebunden (A-8.7, T-033,
 * nachgezogen in T-046).
 *
 * Bis T-046 stand hier ein `Set<string>` mit zwei ausgeschriebenen Zeichen-
 * ketten. Das war die eine Liste, die nicht am Übersetzer hing: `Object.keys`
 * über einen `Record` erzwingt Vollständigkeit, ein `Set<string>` erzwingt
 * nichts. Käme ein dritter Vergleich zu `ExportConditionOperator` dazu, hätte
 * das Set ihn stillschweigend abgewiesen — eine Vorlage, die der Editor
 * anbietet und die Prüfung nicht kennt.
 *
 * Dieselbe Klammer wie bei `SOURCE_PRESENCE` in `sources.ts` und
 * `TRANSFORMATION_PRESENCE` eine Zeile weiter oben: Fehlt hier ein Schlüssel,
 * bricht `tsc` ab; steht hier einer zu viel, ebenso.
 */
const CONDITION_OPERATOR_PRESENCE: Readonly<Record<ExportConditionOperator, true>> = {
  is_set: true,
  is_not_set: true,
};

/**
 * Alle wählbaren Vergleiche, für die Auswahlliste im Editor (S-14).
 *
 * Neben `EXPORT_TRANSFORMATIONS` und `EXPORT_SOURCE_PATHS` — der Katalog des
 * Dienstes (`apps/local-api/src/usecases/export-catalog.ts`) beschriftet, der
 * Motor führt die Liste. Vorher gab der Motor sie nicht heraus, und der Katalog
 * musste seine eigene `Record`-Klammer bauen; zwei Listen, die nebeneinander
 * herlaufen, sind genau die Sorte Paar, das irgendwann auseinandergeht.
 */
export const EXPORT_CONDITION_OPERATORS: readonly ExportConditionOperator[] = Object.keys(
  CONDITION_OPERATOR_PRESENCE,
) as readonly ExportConditionOperator[];

const KNOWN_OPERATORS: ReadonlySet<string> = new Set<string>(EXPORT_CONDITION_OPERATORS);

/**
 * Der Zeichenvorrat für einen Feldnamen (B-3.2, T-034).
 *
 * Bis T-034 wurde nur „nicht leer" geprüft. Der security-checker hat in T-023
 * gemessen, was das kostet — nicht theoretisch, sondern an der erzeugten Datei:
 *
 * ```
 * Feld "__proto__", Quelle mit Wert null    -> {"Call":null,"Zeit":0.25}
 *                                              das Feld fehlt in der Ausgabe
 * Feld "__proto__", Quelle mit Zeichenkette -> {}   alles verschluckt
 * ```
 *
 * Ein Feld, das der Benutzer im Editor sieht und das in der Abrechnungsdatei
 * **still** nicht vorkommt, ist genau die Sorte Fehler, die erst beim Kunden
 * auffällt. B-3.2 verlangt die Abweisung deshalb **beim Speichern** — an der
 * Stelle, an der jemand hinschaut.
 *
 * `{1,64}` deckt beides ab: nicht leer und nicht unbegrenzt. Der Empfänger ist
 * ein fremdes Abrechnungstool, und ein 200 Zeichen langer JSON-Schlüssel ist
 * dort keine Konfiguration, sondern ein Fund.
 *
 * **Was dieses Muster nicht leistet:** Es schließt `__proto__`, `constructor`
 * und `prototype` **nicht** aus. Alle drei bestehen ausschließlich aus Zeichen
 * des erlaubten Vorrats und sind kürzer als 64 Zeichen; sie passen. Dafür ist
 * ausschließlich {@link RESERVED_FIELD_NAMES} da — siehe dort.
 */
const FIELD_NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Namen, die nie ein Feldname sein dürfen (B-3.2, T-034).
 *
 * ---------------------------------------------------------------------------
 * Diese Liste ist die **einzige** Schicht gegen diese drei Namen, nicht die
 * zweite. Sie ist nicht redundant und darf nicht gestrichen werden.
 * ---------------------------------------------------------------------------
 *
 * Bis T-046 stand hier, die drei seien „bereits durch `FIELD_NAME_PATTERN`
 * ausgeschlossen". Das war falsch. Nachgemessen an genau dem Muster, das eine
 * Zeile weiter oben steht:
 *
 * ```
 * FIELD_NAME_PATTERN.test('__proto__')    -> true
 * FIELD_NAME_PATTERN.test('constructor')  -> true
 * FIELD_NAME_PATTERN.test('prototype')    -> true
 * ```
 *
 * Alle drei bestehen aus Buchstaben und Unterstrichen, also aus dem erlaubten
 * Zeichenvorrat, und keiner ist länger als 64 Zeichen. Der falsche Satz war
 * gefährlicher als gar keiner: Wer ihn las, hielt die Liste für einen doppelten
 * Boden und hätte sie beim nächsten Aufräumen entfernt — und damit die einzige
 * Prüfung, die `__proto__` als Feldnamen abweist.
 *
 * Der Zeichenvorrat leistet etwas anderes, und das leistet er allein: Er hält
 * Leerzeichen, Punkte, Anführungszeichen, Steuerzeichen und HTML aus dem
 * JSON-Schlüssel heraus und begrenzt die Länge. Die drei Prototypennamen fängt
 * er nicht.
 *
 * Deshalb steht `RESERVED_FIELD_NAMES` in der Prüfung unten **vor** dem
 * Musterabgleich, und deshalb bleibt sie stehen, wenn jemand den Vorrat je
 * erweitert — etwa um Umlaute, weil ein Abrechnungstool „Rückmeldung" als
 * Schlüssel will. Wer erweitert, muss an dieser Liste vorbei und kommt nicht
 * an ihr vorbei.
 *
 * **Die zweite Schicht steht woanders.** `render.ts` baut die Exportzeile über
 * `Object.create(null)`; eine Zuweisung an `__proto__` verschluckt dort nichts
 * mehr. Die beiden Schichten liegen an verschiedenen Stellen und tun
 * Verschiedenes: Diese hier verhindert die **Eingabe** und ist die einzige, die
 * dem Benutzer sagen kann, warum sein Feld nicht geht; jene verhindert die
 * **Wirkung** und greift auch für eine Vorlage, die nie durch diese Prüfung
 * kam — aus einem `INSERT`, aus einem Bestand von vor T-034.
 */
const RESERVED_FIELD_NAMES: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype',
]);

/**
 * Sieht die abgelehnte Quelle nach dem internen Vermerk aus?
 *
 * Ausschließlich für die **Meldung**. Der Fehlerschlüssel ist in beiden Fällen
 * `export_source_forbidden`; abgewiesen wird jede Quelle, die nicht wörtlich
 * gelistet ist, unabhängig von ihrem Namen. Dieser Test entscheidet also
 * nichts — er sorgt nur dafür, dass jemand, der `todo.notiz` versucht, erfährt,
 * dass das eine Grenze ist und kein Tippfehler.
 */
const looksLikeTodoNote = (source: string): boolean =>
  /note|notiz|vermerk/i.test(source);

/**
 * Kürzt eine abgelehnte Eingabe für die Fehlermeldung.
 *
 * Die Quelle kommt aus JSON und kann beliebig lang sein. Sie unverkürzt
 * zurückzuspiegeln hieße, eine fremde Zeichenkette unbegrenzt in Protokoll und
 * Oberfläche zu tragen. Achtzig Zeichen genügen, um einen Tippfehler zu
 * erkennen.
 */
const forDisplay = (value: string): string =>
  value.length <= 80 ? value : `${value.slice(0, 80)}…`;

/**
 * Prüft ein einzelnes Vorlagenfeld.
 *
 * Nimmt `unknown` entgegen, weil die Eingabe aus JSON kommt: aus
 * `export_template.definition`, aus einem Formular, aus einem Aufruf gegen den
 * lokalen Dienst. Ein Typ am Rand ist eine Behauptung, keine Prüfung.
 *
 * @returns die geprüfte, eingeengte Felddefinition — oder den Grund der
 *   Ablehnung. Kein Wurf: fachliche Fehlschläge sind Werte.
 */
export const validateExportTemplateField = (
  field: unknown,
): ExportResult<ExportFieldDefinition, ExportTemplateError<FieldErrorCode>> => {
  if (typeof field !== 'object' || field === null || Array.isArray(field)) {
    return failure('validation_error', 'Ein Vorlagenfeld muss ein Objekt sein.', 'field');
  }

  const candidate = field as Record<string, unknown>;

  const name = candidate['name'];
  if (typeof name !== 'string' || name.trim().length === 0) {
    return failure('validation_error', 'Das Feld braucht einen nicht leeren Namen.', 'name');
  }

  // Wörtlich geprüft, ohne Trimmen, ohne Normalisierung: Was gespeichert wird,
  // ist genau das, was später als JSON-Schlüssel in der Abrechnungsdatei steht.
  // Ein stillschweigend zurechtgebogener Name wäre wieder ein Unterschied
  // zwischen dem, was im Editor steht, und dem, was beim Kunden ankommt.
  //
  // Beide Bedingungen werden gebraucht, keine ist ein Nachklapp der anderen:
  // Das Muster lässt `__proto__` durch (siehe RESERVED_FIELD_NAMES), die Liste
  // kennt weder Länge noch Zeichenvorrat.
  if (RESERVED_FIELD_NAMES.has(name) || !FIELD_NAME_PATTERN.test(name)) {
    return failure(
      'validation_error',
      `Der Feldname „${forDisplay(name)}" ist nicht zulässig. Erlaubt sind 1 bis 64 Zeichen aus A–Z, a–z, 0–9, Bindestrich und Unterstrich.`,
      'name',
    );
  }

  const source = candidate['source'];
  if (typeof source !== 'string' || source.length === 0) {
    return failure('validation_error', 'Das Feld braucht eine Quelle aus der Auswahlliste.', 'source');
  }

  if (!isExportSourcePath(source)) {
    return failure(
      'export_source_forbidden',
      looksLikeTodoNote(source)
        ? 'Der interne Vermerk eines Todos ist als Feldquelle nicht wählbar. Die abrechenbare Leistung steht unter „group.bookingNotes".'
        : `Die Quelle „${forDisplay(source)}" steht nicht auf der Auswahlliste und ist deshalb nicht exportierbar.`,
      'source',
    );
  }

  const transformation = candidate['transformation'];
  if (typeof transformation !== 'string' || !KNOWN_TRANSFORMATIONS.has(transformation)) {
    return failure(
      'validation_error',
      'Die Transformation ist unbekannt. Wählbar sind: ' + EXPORT_TRANSFORMATIONS.join(', ') + '.',
      'transformation',
    );
  }

  const rawCondition = candidate['condition'];
  let condition: ExportFieldCondition | undefined;

  if (rawCondition !== undefined && rawCondition !== null) {
    if (typeof rawCondition !== 'object' || Array.isArray(rawCondition)) {
      return failure('validation_error', 'Die Bedingung muss ein Objekt sein.', 'condition');
    }

    const parts = rawCondition as Record<string, unknown>;
    const conditionSource = parts['source'];
    const operator = parts['op'];

    if (!isExportSourcePath(conditionSource)) {
      return failure(
        'export_source_forbidden',
        'Die Quelle der Bedingung steht nicht auf der Auswahlliste.',
        'condition.source',
      );
    }
    if (typeof operator !== 'string' || !KNOWN_OPERATORS.has(operator)) {
      return failure(
        'validation_error',
        'Der Vergleich der Bedingung ist unbekannt. Wählbar sind: ' +
          EXPORT_CONDITION_OPERATORS.join(', ') +
          '.',
        'condition.op',
      );
    }

    condition = { source: conditionSource, op: operator as ExportFieldCondition['op'] };
  }

  const validated: ExportFieldDefinition =
    condition === undefined
      ? { name, source: source as ExportSourcePath, transformation: transformation as ExportTransformation }
      : { name, source: source as ExportSourcePath, transformation: transformation as ExportTransformation, condition };

  return { ok: true, value: validated };
};

/**
 * Prüft eine ganze Vorlage, so wie sie in `export_template.definition` liegt.
 *
 * Bricht beim ersten fehlerhaften Feld ab und nennt dessen Nummer. Eine Vorlage
 * mit einer gesperrten Quelle ist als Ganzes unbrauchbar; sie teilweise zu
 * übernehmen hieße, ein Feld stillschweigend fallen zu lassen — und stumm
 * fehlende Felder sind genau die Art Fehler, die erst in der Abrechnung
 * auffällt.
 */
export const validateExportTemplateDefinition = (
  definition: unknown,
): ExportResult<ExportTemplateDefinition, ExportTemplateError> => {
  if (typeof definition !== 'object' || definition === null || Array.isArray(definition)) {
    return {
      ok: false,
      error: { code: 'export_template_invalid', message: 'Die Vorlage muss ein Objekt sein.' },
    };
  }

  const envelope = definition as Record<string, unknown>;

  if (envelope['version'] !== 1) {
    return {
      ok: false,
      error: {
        code: 'export_template_invalid',
        message: 'Unbekannte Vorlagenfassung. Diese Anwendung liest Fassung 1.',
      },
    };
  }

  const rawFields = envelope['fields'];
  if (!Array.isArray(rawFields) || rawFields.length === 0) {
    return {
      ok: false,
      error: {
        code: 'export_template_invalid',
        message: 'Eine Vorlage braucht mindestens ein Feld.',
      },
    };
  }

  const fields: ExportFieldDefinition[] = [];

  /**
   * Doppelte Namen werden abgewiesen, nicht zusammengeführt (B-3.2, T-034).
   *
   * Gemessen in T-023: Zwei Felder namens `Call` — das erste die Call-Nummer,
   * das zweite die Zeit — ergaben die Zeile `{"Call":0.25}`. Die Call-Nummer
   * war **still** durch die Zeit ersetzt. Ein Objekt kennt jeden Schlüssel nur
   * einmal; das zweite Feld überschreibt das erste, und niemand erfährt es.
   *
   * Warum wörtlich verglichen wird und nicht ohne Rücksicht auf Groß- und
   * Kleinschreibung: JSON-Schlüssel sind unterscheidbar. `Call` und `call`
   * stehen beide in der Datei, es geht nichts verloren, und ein Abrechnungstool
   * darf beide erwarten. Abgewiesen wird der **stille Verlust**, nicht die
   * Ähnlichkeit.
   *
   * `Set` statt `Object`/`Record`: Ein Objekt als Nachschlagewerk hätte an
   * dieser Stelle genau das Prototypenproblem, das eine Zeile weiter oben
   * gerade abgewiesen wird.
   */
  const takenNames = new Set<string>();

  for (const [index, rawField] of rawFields.entries()) {
    const checked = validateExportTemplateField(rawField);
    if (!checked.ok) {
      return {
        ok: false,
        error: {
          code: checked.error.code,
          message: `Feld ${index + 1}: ${checked.error.message}`,
          details: checked.error.details ?? [],
        },
      };
    }

    if (takenNames.has(checked.value.name)) {
      return {
        ok: false,
        error: {
          code: 'export_template_invalid',
          message: `Feld ${index + 1}: Der Feldname „${forDisplay(checked.value.name)}" kommt in dieser Vorlage mehrfach vor. In der Exportdatei bliebe davon nur der letzte Wert übrig.`,
          details: [
            {
              field: 'name',
              message: 'Jeder Feldname darf in einer Vorlage nur einmal vorkommen.',
              code: 'duplicate',
            },
          ],
        },
      };
    }
    takenNames.add(checked.value.name);

    fields.push(checked.value);
  }

  return { ok: true, value: { version: 1, fields } };
};

/**
 * Die mitgelieferte Standardvorlage (A-8.2 bis A-8.5, A-8.7, E-005).
 *
 * Bildet die feste Struktur aus Abschnitt 8 der Spezifikation ab: `Call`,
 * `Zeit`, `Notiz` als Base64 und `WindowsUser`. Sie ist nicht löschbar
 * (Trigger auf `export_template`), aber kopierbar — eine Kopie ist eine ganz
 * gewöhnliche Vorlage.
 *
 * `Zeit` liest `group.quarters`, also die **gerundete Tagessumme** der Gruppe,
 * und wandelt sie mit `quarter_hours_to_number` in 0,25-Schritte. Nicht
 * `group.durationSeconds`: Das sind Sekunden, und eine Transformation, die
 * Sekunden für Viertelstunden hielte, machte aus 0,75 still 0,25.
 */
export const BUILTIN_EXPORT_TEMPLATE: ExportTemplateDefinition = {
  version: 1,
  fields: [
    { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
    { name: 'Zeit', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
    { name: 'Notiz', source: 'group.bookingNotes', transformation: 'base64' },
    { name: 'WindowsUser', source: 'system.windowsUser', transformation: 'raw' },
  ],
};
