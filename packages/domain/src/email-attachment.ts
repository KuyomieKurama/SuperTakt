/**
 * Fremde Dateinamen bleiben Anzeigetext und werden niemals Pfadbestandteile.
 * Nur die geprüfte Endung wird übernommen; geprüft wird auch die Endung des erzeugten Dateinamens.
 */

import { INDIRECT_EXTENSIONS, fileExtensionOf } from './attachment.ts';

// Fehlgründe — eine geschlossene Menge, keine freien Zeichenketten (A-19.29)

/**
 * Gemeinsame, geschlossene Fehlergründe statt fremder Office- oder Betriebssystemmeldungen.
 * Einzelgröße, Gesamtgröße und Anzahl getrennt melden, da daraus unterschiedliche Abhilfen folgen.
 */
export type EmailAttachmentFailureReason =
  /**
   * Über der Grenze **je Datei** (A-19.30, A-19.30a, A-19.30b).
   *
   * Nur diese eine Grenze, und deshalb darf der Satz dazu die Zahl je Datei
   * nennen. Die Summe hat ihren eigenen Grund, siehe {@link
   * MAX_EMAIL_ATTACHMENT_TOTAL_BYTES}.
   */
  | 'too_large'
  /**
   * Diese Datei paßt nicht mehr in die **Summe** einer Übernahme (A-19.30a).
   *
   * Sie ist für sich genommen klein genug. Was sie stoppt, ist, was vor ihr
   * kam — und das ist eine andere Auskunft und eine andere Handlung: nicht
   * „diese Datei ist zu groß", sondern „diese E-Mail trägt zu viel".
   */
  | 'total_too_large'
  /** Über der **Anzahl**grenze je E-Mail (A-19.30a). Zu viel, nicht zu groß. */
  | 'too_many'
  /** Outlook hat die Datei nicht herausgegeben (Office-Fehler beim Abruf). */
  | 'not_released'
  /** Der Abruf hat den Deckel je Anhang gerissen. */
  | 'timeout'
  /** SuperTakt hat die Datei nicht angenommen — Form oder Ablage. */
  | 'rejected'
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
  total_too_large: true,
  too_many: true,
  not_released: true,
  timeout: true,
  rejected: true,
  not_a_web_address: true,
  rebuild_rejected: true,
  outlook_too_old: true,
});

/** Die neun Fehlgründe in fester Reihenfolge. */
export const EMAIL_ATTACHMENT_FAILURE_REASONS: readonly EmailAttachmentFailureReason[] =
  Object.freeze(Object.keys(EMAIL_ATTACHMENT_FAILURE_PRESENCE) as EmailAttachmentFailureReason[]);

/** Ist diese Zeichenkette einer der neun Gründe? */
export function isEmailAttachmentFailureReason(
  value: string,
): value is EmailAttachmentFailureReason {
  return Object.hasOwn(EMAIL_ATTACHMENT_FAILURE_PRESENCE, value);
}

// Grenzen — drei, und alle drei gelten **vor** dem ersten Byte auf der Platte
//
// **Gedeckt seit dem 2026-09-12 durch A-19.30a**, und vorher nicht: E-108
// Punkt 3 nannte nur die Grenze je Datei; Summe und Anzahl entstanden beim
// Bauen (T-299 Annahme 3) und standen bis zum Befund T-308 F-5 in keiner
// Anforderung. Sie bleiben — eine Nachricht mit zweihundert kleinen Anhängen
// ist derselbe Angriff wie eine mit einer sehr großen Datei —, aber sie stehen
// jetzt in der Spezifikation und nicht in einer Annahme.
//
// **A-19.30b gehört dazu und ist die schärfere Hälfte:** Jede der drei nennt
// beim Melden **ihren eigenen** Wert. Deshalb hat jede ihre eigene Kennung in
// {@link EmailAttachmentFailureReason}; die Zuordnung trifft
// {@link admitEmailAttachment} und niemand sonst.

/**
 * Dekodierte Bytes zählen, nicht die von Office angekündigte Größe. Die HTTP-Rumpfgrenze muss den
 * Base64-Aufschlag berücksichtigen.
 */
export const MAX_EMAIL_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/**
 * Die dekodierte Summengrenze muss zur HTTP-Rumpfgrenze einschließlich Base64-Aufschlag passen;
 * Überschreitungen als `total_too_large` melden.
 */
export const MAX_EMAIL_ATTACHMENT_TOTAL_BYTES = 48 * 1024 * 1024;

/**
 * Die Anzahl zusätzlich zu den Bytegrenzen begrenzen; überzählige Dateien namentlich als
 * `too_many` melden.
 */
export const MAX_EMAIL_ATTACHMENT_COUNT = 25;

export const MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH = 16;

/** Überlange Namen sichtbar in der Mitte kürzen, damit Anfang und Dateiendung erhalten bleiben. */
export const MAX_EMAIL_DISPLAY_NAME_CHARACTERS = 255;

// Die Endung — die eine Angabe, die aus fremdem Text in den Pfad geht

/**
 * Nur die geprüfte ASCII-Endung des aufgelösten Namens übernehmen. null bedeutet zulässigerweise
 * „ohne Endung“; die Zulässigkeit entscheidet `nameEmailFile`.
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
 * Umleitungsendungen bereits bei der Übernahme ablehnen, da die Hülle sie später nicht öffnen
 * darf. Maßgeblich ist die tatsächlich erzeugte Endung.
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

// Die Grenzen, angewandt

/** Das Urteil über eine einzelne Datei an den drei Grenzen aus A-A-81. */
export type EmailAttachmentAdmission =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: EmailAttachmentFailureReason };

/**
 * Vor dem Schreiben prüfen. Die Anzahlgrenze hat Vorrang vor den Größengrenzen; jede Ursache
 * behält ihren eigenen Fehlergrund.
 */
export function admitEmailAttachment(input: {
  readonly bytes: number;
  readonly bytesBefore: number;
  readonly countBefore: number;
}): EmailAttachmentAdmission {
  if (!Number.isInteger(input.bytes) || input.bytes <= 0) return { ok: false, reason: 'rejected' };
  if (input.countBefore >= MAX_EMAIL_ATTACHMENT_COUNT) return { ok: false, reason: 'too_many' };
  if (input.bytes > MAX_EMAIL_ATTACHMENT_BYTES) return { ok: false, reason: 'too_large' };
  if (input.bytesBefore + input.bytes > MAX_EMAIL_ATTACHMENT_TOTAL_BYTES) {
    return { ok: false, reason: 'total_too_large' };
  }
  return { ok: true };
}

// Base64 — die Länge messen, bevor etwas dekodiert wird

/** Standardalphabet, gepolstert, ohne Leerraum. */
const BASE64_SHAPE = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Die Größe aus streng geprüftem Base64 berechnen, bevor ein Puffer entsteht. Anschließend auch
 * die tatsächlich dekodierten Bytes prüfen.
 * Keine nachsichtige Dekodierung hinter einer strengeren Längenrechnung zulassen.
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

// Der Anzeigename — fremder Text, und er bleibt lesbar

/** Die sichtbare Marke einer Kürzung. Ein Zeichen, und es ist keines der verbotenen. */
const TRUNCATION_MARK = '…';

/** Nur sichtbar in der Mitte kürzen; Anfang und Dateiendung müssen erhalten bleiben. */
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
