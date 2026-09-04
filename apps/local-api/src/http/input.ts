/**
 * Takt — Eingaben am Rand prüfen (ecc:api-design, B-1.7, B-4.3).
 *
 * Ein Typ am Rand ist eine **Behauptung**, keine Prüfung. Alles, was aus einer
 * Anfrage kommt, geht durch ein Schema, bevor ein Anwendungsfall es sieht —
 * auch dann, wenn der Aufrufer die eigene Oberfläche ist: Der Dienst kann nicht
 * wissen, wer ihn anspricht (B-2.9, RR-1).
 *
 * Die Grenzen sind dieselben wie in der OpenAPI-Beschreibung. Sie stehen hier
 * ein zweites Mal, weil die Beschreibung nichts erzwingt — sie beschreibt.
 */

import { z } from 'zod';

import type { TaktFieldError } from '@takt/domain';

/** Ein Zeitstempel in der einen Form, die das Schema annimmt. */
export const timestampSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, 'Erwartet wird YYYY-MM-DDTHH:MM:SSZ.');

/** Ein Kalendertag in Ortszeit. */
export const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Erwartet wird YYYY-MM-DD.');

/**
 * Eine Kennung.
 *
 * Bewusst nicht `z.uuid()`: Die mitgelieferten Zeilen aus Migration 0002 sind
 * UUIDv7-förmig, künftige Bestände könnten es anders halten, und eine zu enge
 * Prüfung hier wiese gültige Kennungen ab. Was zählt, ist die Länge und dass
 * nichts Unerwartetes durchgeht — die Zuordnung macht die Datenbank.
 */
export const idSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9._:-]+$/);

/**
 * Eine **kommagetrennte** Liste von Kennungen aus der Abfragezeichenkette
 * (R-3 S-2, T-089).
 *
 * Steht hier und nicht je Route, weil es dieselbe Eingabeform an jeder Stelle
 * ist und dieselbe Obergrenze tragen soll. Die Begründung für die Zahl steht
 * an der einzigen heutigen Aufrufstelle (`routes/todos.ts`, `idListSchema`);
 * kurz: Fünfzig Kennungen liegen über jedem Arbeitsablauf und weit unter der
 * Schwelle, an der die Abfrage teuer wird — gemessen 8,4 Sekunden bei 200 und
 * ein `500` aus `SQLITE_MAX_EXPR_DEPTH` bei 1 000.
 *
 * `z.preprocess` und nicht `.transform` hinter dem Schema: Die Zerlegung muss
 * **vor** der Prüfung geschehen, sonst prüfte `idSchema` die ganze Zeichenkette
 * samt Kommas und wiese jede Liste mit mehr als einem Eintrag ab. Fehlt der
 * Wert, bleibt er `undefined` und das Feld gilt als nicht gesetzt — eine
 * fehlende Angabe ist kein leerer Filter.
 */
export const commaSeparatedIds = z.preprocess(
  (value) => (typeof value === 'string' ? value.split(',') : value),
  z.array(idSchema).min(1).max(50),
);

/**
 * Zeichen, die in einem **Namen** nichts zu suchen haben (R-3a H-2).
 *
 * ---------------------------------------------------------------------------
 * Warum das jetzt zählt und vorher weniger
 * ---------------------------------------------------------------------------
 *
 * Diese Namen reisen weiter als je zuvor: in den Bewegungssatz an **beiden**
 * Flächen, in den Aufgabenbereich des Add-ins und in die Löschdialoge der
 * Hauptanwendung (`details`, Regelnamen). Seit T-107 steht der Regelname dort
 * zusätzlich als **eigenes Feld** (`details[].name`, W-11) und nicht nur
 * eingebettet in einen Satz — also an einer Stelle, an der eine Oberfläche ihn
 * ohne umgebenden Text setzt. Es ist kein Grenzübertritt - nur wer das
 * Sitzungsgeheimnis hat, legt Pools an -, aber es ist eine Anzeige, die etwas
 * anderes zeigt, als im Bestand steht, und diese Prüfung ist die einzige
 * Stelle, an der das aufgehalten wird.
 *
 * ---------------------------------------------------------------------------
 * Die beiden Klassen, und warum es genau diese sind
 * ---------------------------------------------------------------------------
 *
 *  - **C0 und C1** (`U+0000` bis `U+001F`, `U+007F` bis `U+009F`).
 *    Steuerzeichen sind das, womit man eine Protokollzeile oder eine
 *    Exportzelle von innen aufbricht. Aus demselben Grund prüft
 *    `access/session-secret.ts` den Windows-Benutzernamen — dort allerdings
 *    **enger** (`U+0000`–`U+001F` und `U+007F`, ohne C1 und ohne die
 *    Richtungszeichen). Das ist eine andere Prüfung an einer anderen Grenze:
 *    Der Name kommt über `stdin` von der Hülle, nicht aus einer Anfrage. Wer
 *    beide gleichziehen will, tut es dort und nicht hier.
 *  - **Bidirektionale Formatierungszeichen**, und zwar alle drei Bauarten:
 *    die **Einbettungen und Überschreibungen** (`U+202A` bis `U+202E`), die
 *    **Isolate** (`U+2066` bis `U+2069`) und die **Marken** (`U+200E` LRM,
 *    `U+200F` RLM, `U+061C` ALM). Sie stehen in keinem geschriebenen Namen und
 *    drehen den Rest der Zeile optisch um. React maskiert HTML; ein `U+202E`
 *    macht es **nicht** unschädlich, weil es kein Markup ist, sondern Text mit
 *    Wirkung auf die Darstellung. Ein Pool, dessen Name eines dieser Zeichen
 *    trägt, liest sich in der Aufzählung eines Löschdialogs als etwas
 *    anderes, als er heißt.
 *
 *    Die Marken sind mit T-117 dazugekommen (T-115). Sie wirken schwächer als
 *    die übrigen — eine Marke kehrt keinen Text um, sie setzt die Richtung des
 *    Textes daneben —, aber die Begründung eine Zeile höher gilt für sie
 *    wörtlich: Sie stehen in keinem geschriebenen Namen, und sie verändern, wie
 *    der Rest der Zeile aussieht. Eine halb erfasste Klasse ist die schlechteste
 *    Fassung: Sie liest sich wie eine Regel und ist eine Auswahl.
 *
 *    **Nicht** erfasst und ausdrücklich erlaubt bleiben die Zeichen ohne
 *    Richtungswirkung in derselben Nachbarschaft: `U+200B` bis `U+200D`. Das
 *    letzte davon (ZWJ) hält zusammengesetzte Emoji zusammen — `U+200D`
 *    abzuweisen hieße, einem Titel mit einem Familien-Emoji die Annahme zu
 *    verweigern, und dieser Wächter ist gegen Richtungszeichen gerichtet und
 *    nicht gegen Emoji.
 *
 * ---------------------------------------------------------------------------
 * Warum abweisen und nicht entfernen
 * ---------------------------------------------------------------------------
 *
 * Ein stilles Entfernen änderte den Namen, den der Benutzer eingegeben hat,
 * und er erführe es nicht - er sähe seinen Namen ohne die Zeichen und hielte
 * die Eingabe für angekommen. Eine Abweisung sagt, was los ist, an dem Feld,
 * in dem es passiert ist (`toFieldErrors` setzt den Pfad).
 *
 * **Der Wert steht nicht in der Meldung.** Er stammt möglicherweise aus einer
 * fremden E-Mail (B-4.3 Punkt 5) - und ein Text, der ein solches Zeichen
 * wörtlich wiedergibt, richtet in der Fehlermeldung genau den Schaden an, den
 * er verhindern soll.
 *
 * Leerzeichen und Tabulator sind zwei verschiedene Fälle: `U+0020` darf in
 * einem Namen stehen und ist nicht erfasst, `U+0009` gehört zu C0 und wird
 * abgewiesen. `.trim()` läuft davor und nimmt ihn am Rand ohnehin weg;
 * abgewiesen wird er in der Mitte.
 *
 * ---------------------------------------------------------------------------
 * Was das für den Altbestand heißt
 * ---------------------------------------------------------------------------
 *
 * Die Prüfung sitzt am **Eingang** und nicht am Bestand. Ein Name, der vor
 * dieser Prüfung angelegt wurde, bleibt lesbar und löschbar — aber ein `PATCH`,
 * der ihn **unverändert** zurückschickt, wird mit 422 abgewiesen, und der
 * Benutzer sieht seinen eigenen, ungeänderten Namen als unzulässige Eingabe.
 * Jede Erweiterung dieser Zeichenklasse vergrößert diesen Altbestand; die
 * Marken tun es mit T-117.
 *
 * Das wird **genannt und nicht still migriert** (T-101 Annahme 6, R3). Eine
 * Migration, die vorhandene Namen umschreibt, wäre dieselbe stille Änderung der
 * Benutzereingabe, die diese Prüfung an ihrem eigenen Eingang ablehnt — nur
 * ohne jemanden, dem man es sagen könnte. Bekannt ist kein solcher Bestand
 * (`tests/fixtures/**` trägt keinen), und der Weg heraus ist derselbe wie für
 * jeden anderen unerwünschten Namen: ihn ändern.
 *
 * Die Zeichen stehen unten als **Escape-Folgen** und nicht als rohe Zeichen
 * (T-112-H2): Ein rohes Richtungszeichen in dieser Quelldatei drehte
 * ausgerechnet die Zeile um, die es abweist.
 */
// eslint-disable-next-line no-control-regex -- genau darum geht es hier
const FORBIDDEN_IN_NAMES =
  /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u;

/**
 * „Ein Name ohne Steuer- und Richtungszeichen" - die Prüfung, die
 * {@link titleSchema} und {@link nameSchema} teilen.
 *
 * Eine Funktion und kein zweimal geschriebenes `.refine(...)`: Zwei Abschriften
 * derselben Regel sind zwei Gelegenheiten, sie verschieden zu ändern, und der
 * Titel eines Todos ist so sichtbar wie der Name eines Pools.
 */
const withoutControlCharacters = <T extends z.ZodType<string>>(schema: T) =>
  schema.refine((value) => !FORBIDDEN_IN_NAMES.test(value), {
    message: 'Steuerzeichen und Richtungszeichen sind in einem Namen nicht erlaubt.',
  });

export const titleSchema = withoutControlCharacters(z.string().trim().min(1).max(500));
export const nameSchema = withoutControlCharacters(z.string().trim().min(1).max(200));
/** Leistung und Vermerk. 1 MB Rumpfgrenze steht davor (B-1.7). */
export const textSchema = z.string().max(20_000);
export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Erwartet wird eine Farbe der Form #rrggbb.')
  .nullable();

/**
 * Eine **Teiländerung** aus einem geprüften Rumpf (T-089).
 *
 * ---------------------------------------------------------------------------
 * Wozu
 * ---------------------------------------------------------------------------
 *
 * `exactOptionalPropertyTypes` unterscheidet „das Feld fehlt" von „das Feld ist
 * `undefined`" — und diese Unterscheidung ist in Takt gewollt (siehe
 * `tsconfig.base.json`: eine offene Leistung ist etwas anderes als eine leere).
 * Zod liefert für `.optional()` aber das zweite: `{ name: string | undefined }`,
 * mit dem Schlüssel. Ein Rumpf, der so weitergereicht wird, passt deshalb auf
 * kein `Partial<…>` dieses Bestands.
 *
 * Die naheliegende Antwort war bisher `parsed.data as never` — eine Zusicherung,
 * die nicht die Optionalität glättet, sondern **jede** Prüfung abschaltet
 * (`never` ist an alles zuweisbar). Die zweitnaheliegende ist eine Zeile je
 * Feld (`...(x === undefined ? {} : { x })`), und die ist die Falle aus R-1:
 * Ein neues Feld, das dort vergessen wird, verschwindet **still**.
 *
 * Diese Funktion tut das eine, was nötig ist: Sie lässt Schlüssel mit dem Wert
 * `undefined` weg. Der Rest geht durch, wie er dasteht — auch ein Feld, das es
 * gestern noch nicht gab.
 *
 * ---------------------------------------------------------------------------
 * Die eine Zusicherung darin, und warum sie hier vertretbar ist
 * ---------------------------------------------------------------------------
 *
 * Der Rückgabetyp lässt sich nicht ohne `as` erzeugen: Für `tsc` ist der Aufbau
 * eines Objekts in einer Schleife eine Zuweisung an `Record<string, unknown>`.
 * Die Zusicherung steht deshalb **hier**, an einer Stelle, deren ganzer Inhalt
 * fünf Zeilen sind, statt an jedem Aufrufer. Sie behauptet genau das, was die
 * Schleife tut, und nicht mehr: dieselben Schlüssel, dieselben Werte, ohne die
 * `undefined`.
 *
 * `null` bleibt erhalten. Es ist ein Wert und heißt „setze auf leer" — wer es
 * mit „nicht genannt" verwechselt, macht aus einer Löschung ein Weglassen.
 */
export function patchOf<T extends object>(value: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const patch: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) patch[key] = entry;
  }
  return patch as { [K in keyof T]?: Exclude<T[K], undefined> };
}

export const paginationSchema = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

/**
 * Übersetzt einen zod-Fehlschlag in `details` des Fehlerformats.
 *
 * Der **Wert** kommt darin nicht vor. Er stammt möglicherweise aus einer
 * fremden E-Mail, und eine Fehlermeldung ist der falsche Ort, um fremden Text
 * weiterzureichen (B-4.3 Punkt 5).
 */
export function toFieldErrors(error: z.ZodError): readonly TaktFieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length === 0 ? '(rumpf)' : issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Liest den Rumpf als JSON, ohne bei kaputtem JSON zu werfen.
 *
 * Ein Wurf landete sonst im allgemeinen Fehlerbehandler und ergäbe 500 — ein
 * Serverfehler für eine fehlerhafte Eingabe. `undefined` läuft in die
 * Schemaprüfung und kommt als 422 mit Feldangaben zurück.
 */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Fortsetzungsmarke und Seitengröße aus der Abfragezeichenkette. */
export function readPagination(query: Record<string, string | undefined>): {
  cursor?: string;
  limit?: number;
} {
  const parsed = paginationSchema.safeParse({
    ...(query['cursor'] === undefined ? {} : { cursor: query['cursor'] }),
    ...(query['limit'] === undefined ? {} : { limit: query['limit'] }),
  });
  if (!parsed.success) return {};
  return {
    ...(parsed.data.cursor === undefined ? {} : { cursor: parsed.data.cursor }),
    ...(parsed.data.limit === undefined ? {} : { limit: parsed.data.limit }),
  };
}

/** `?flag=true` — alles andere ist `false`. Kein „1", kein „ja", kein Raten. */
export function readFlag(value: string | undefined): boolean {
  return value === 'true';
}
