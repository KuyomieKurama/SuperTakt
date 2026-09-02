/**
 * Fuegt Klassennamen zusammen und laesst falsche Werte weg.
 * Bewusst ohne Abhaengigkeit, damit die Oberflaeche keine Fremdbibliothek
 * fuer eine Zeile Logik zieht.
 */
export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter((part): part is string => typeof part === "string" && part.length > 0).join(" ");
}
