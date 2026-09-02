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

export const titleSchema = z.string().trim().min(1).max(500);
export const nameSchema = z.string().trim().min(1).max(200);
/** Leistung und Vermerk. 1 MB Rumpfgrenze steht davor (B-1.7). */
export const textSchema = z.string().max(20_000);
export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Erwartet wird eine Farbe der Form #rrggbb.')
  .nullable();

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
