/**
 * Links werden beim Anlegen normalisiert; die Hülle verlangt beim Öffnen dieselbe Normalform.
 * Bilder werden an ihrer Signatur erkannt und intern angezeigt. Anhänge sind keine Exportquellen.
 */

import type { CodePointRange } from './characters.ts';
import { hasForbiddenNameCharacter, isCodePointInRanges } from './characters.ts';
import type { Branded, TodoId, Timestamp } from './kernel.ts';

export type AttachmentId = Branded<'AttachmentId'>;

// Die Arten

/**
 * Die drei Arten aus A-19.9.
 *
 * Bezeichner englisch wie überall; auf dem Bildschirm heißen sie **Verweis**,
 * **Bild** und **Datei**.
 */
export type AttachmentKind = 'link' | 'image' | 'file';

/**
 * Vollständigkeit beim Übersetzen, nach dem Vorbild von `SOURCE_PRESENCE`
 * (`export.ts`): „Was keinen Zweig hat, hat keinen Wert."
 *
 * Eine vierte Art kostet damit einen Übersetzungsfehler je Stelle, die
 * entscheiden muß — und **keine** Migration mit Tabellenumbau: Die Speicherung
 * führt die Arten in einer eigenen kleinen Tabelle, siehe Migration 0015.
 */
export const ATTACHMENT_KIND_PRESENCE: Readonly<Record<AttachmentKind, true>> = Object.freeze({
  link: true,
  image: true,
  file: true,
});

export const ATTACHMENT_KINDS: readonly AttachmentKind[] = Object.freeze(
  Object.keys(ATTACHMENT_KIND_PRESENCE) as AttachmentKind[],
);

/** Ist das eine der Arten? **Wörtlich** verglichen, ohne jede Normalisierung. */
export function isAttachmentKind(value: string): value is AttachmentKind {
  return Object.prototype.hasOwnProperty.call(ATTACHMENT_KIND_PRESENCE, value);
}

/**
 * Vor Bereinigungen müssen bekannte und gespeicherte Anhangsarten exakt übereinstimmen. Sonst
 * könnten Kopien unbekannter Arten fälschlich gelöscht werden.
 */
export function isKnownAttachmentKindSet(kinds: readonly string[]): boolean {
  const seen = new Set(kinds);
  if (seen.size !== kinds.length) return false;
  if (seen.size !== ATTACHMENT_KINDS.length) return false;
  return ATTACHMENT_KINDS.every((kind) => seen.has(kind));
}

// Herkunft — die Eigenschaft am Anhang (A-A-84)

/**
 * Die gespeicherte Herkunft bestimmt den Hinweis vor dem Öffnen; bestehende Benutzeranhänge gelten
 * als `user`.
 */
export type AttachmentOrigin = 'user' | 'email';

/**
 * Die Herkünfte als Datensatz. Dieselbe Bauart wie
 * {@link ATTACHMENT_KIND_PRESENCE}: Ein neuer Wert im Typ ohne Eintrag hier
 * ist ein Typfehler und keine stille Lücke.
 */
export const ATTACHMENT_ORIGIN_PRESENCE: Readonly<Record<AttachmentOrigin, true>> = Object.freeze({
  user: true,
  email: true,
});

/** Die Herkünfte in fester Reihenfolge. */
export const ATTACHMENT_ORIGINS: readonly AttachmentOrigin[] = Object.freeze(
  Object.keys(ATTACHMENT_ORIGIN_PRESENCE) as AttachmentOrigin[],
);

/** Ist das eine bekannte Herkunft? **Wörtlich** verglichen, ohne Normalisierung. */
export function isAttachmentOrigin(value: string): value is AttachmentOrigin {
  return Object.prototype.hasOwnProperty.call(ATTACHMENT_ORIGIN_PRESENCE, value);
}

// Der Wert

/**
 * Links speichern die Normalform, Dateien den absoluten Pfad, Bilder nur den erzeugten Kopienamen.
 * Der ursprüngliche Bildpfad wird nicht gespeichert.
 */
export interface Attachment {
  readonly id: AttachmentId;
  readonly todoId: TodoId;
  readonly kind: AttachmentKind;
  /** Frei gewählte Bezeichnung (A-19.10). `null` heißt „nicht gesetzt". */
  readonly title: string | null;
  readonly target: string;
  /** Reihenfolge des Hinzufügens. Stabil über alle Ladevorgänge (A-19.8). */
  readonly position: number;
  readonly createdAt: Timestamp;
  /**
   * Woher dieser Anhang stammt (A-A-84). `AttachmentOrigin` steht in
   * `email-attachment.ts`; hier steht `string`-frei der Wert selbst.
   *
   * **Eine Eigenschaft und keine Ableitung.** Nicht aus dem Pfad gelesen,
   * nicht aus dem Ordner geraten — sonst hinge die Rückfrage vor einem
   * Programmstart (A-A-85) an einer Vermutung.
   */
  readonly origin: AttachmentOrigin;
  /**
   * Fremdtext, der auch später in der Rückfrage vor dem Öffnen erscheinen muss; null bei fehlendem
   * Absender oder Benutzeranhängen.
   */
  readonly originSender: string | null;
  /**
   * Fremder Anzeigename, getrennt vom Benutzertitel. Die Dateiendung muss vollständig sichtbar
   * bleiben; auf der Platte steht ein erzeugter Name.
   */
  readonly displayName: string | null;
  /**
   * Kennzeichnet dauerhaft eine aus Office-Feldern nachgebaute E-Mail, damit sie nicht als
   * ursprüngliche Nachricht mit Originalkopfzeilen gilt.
   */
  readonly rebuilt: boolean;
}

/**
 * Was zum Anlegen eines Anhangs nötig ist. Geprüft, bevor es hierher kommt.
 *
 * Die vier Felder aus A-A-84 und A-A-97 sind **freiwillig**, und das ist
 * Absicht: Der gewöhnliche Weg — der Benutzer trägt einen Verweis, einen Pfad
 * oder ein Bild ein — nennt sie nicht, und der Adapter setzt `origin: 'user'`,
 * `rebuilt: false` und zweimal `null`. Wer sie nennt, tut es sichtbar.
 */
export interface AttachmentCreate {
  readonly todoId: TodoId;
  readonly kind: AttachmentKind;
  readonly title: string | null;
  readonly target: string;
  readonly now: Timestamp;
  /** Siehe {@link Attachment.origin}. Fehlt: `'user'`. */
  readonly origin?: AttachmentOrigin;
  /** Siehe {@link Attachment.originSender}. Fehlt: `null`. */
  readonly originSender?: string | null;
  /** Siehe {@link Attachment.displayName}. Fehlt: `null`. */
  readonly displayName?: string | null;
  /** Siehe {@link Attachment.rebuilt}. Fehlt: `false`. */
  readonly rebuilt?: boolean;
}

// Grenzwerte — an einer Stelle, bei den übrigen aus T-128

/**
 * Obergrenze der Adresse in **Bytes** (A-A-2).
 *
 * 2 048 ist die Zahl, an der sich die Browser praktisch treffen; alles darüber
 * ist keine Adresse mehr, die jemand eingibt, sondern eine Ablage. Gezählt
 * werden Bytes und keine Zeichen: Die Grenze soll dieselbe sein wie die, die
 * die Hülle mißt, und dort ist eine Zeichenkette ein Bytefeld.
 */
export const MAX_ATTACHMENT_LINK_BYTES = 2_048;

/**
 * Obergrenze des Dateipfads in Bytes (A-A-4).
 *
 * 4 096 ist `PATH_MAX` auf den verbreiteten Unix-Systemen und liegt weit über
 * den 260 beziehungsweise 32 767 Zeichen, die Windows kennt. Sie ist kein
 * Schutz — sie ist der Deckel, der verhindert, daß jemand einen Roman in das
 * Feld schreibt.
 */
export const MAX_ATTACHMENT_PATH_BYTES = 4_096;

/**
 * Beim Lesen begrenzen, nicht anhand der angekündigten Dateigröße. Die Daten-URI vergrößert den
 * Speicherbedarf zusätzlich.
 */
export const MAX_ATTACHMENT_IMAGE_BYTES = 8_388_608;

/** Eigenständige Grenze: Anhangstitel und Tagnamen können sich unabhängig ändern. */
export const MAX_ATTACHMENT_TITLE_CHARACTERS = 200;

// Verweis — Normalisierung an genau einer Stelle (A-A-13)

/**
 * Nullbreiten in URLs vor dem Zerlegen abweisen, da der URL-Parser sie still entfernen kann. Die
 * Namensprüfung erlaubt sie teilweise für Emoji.
 */
export const INVISIBLE_IN_ADDRESS: readonly CodePointRange[] = Object.freeze([
  Object.freeze({ from: 0x200b, to: 0x200b }),
  Object.freeze({ from: 0xfeff, to: 0xfeff }),
]);

/**
 * Geschlossene Fehlergründe ohne den abgewiesenen Fremdwert, damit dessen Steuerzeichen nicht in
 * Meldungen gelangen.
 */
export type LinkRejection =
  /** Läßt sich gar nicht zerlegen — `\\server\freigabe`, `//server/x`, ein NUL mitten im Schema. */
  | 'link_unparsable'
  /** Ein anderes Schema als `http` oder `https`. */
  | 'link_scheme_rejected'
  /**
   * Kein Wirt.
   *
   * Unter der heutigen Positivliste **unerreichbar**, und das ist keine
   * Nachlässigkeit, sondern der gemessene Stand: Siehe die Begründung an der
   * Prüfzeile in {@link normalizeAttachmentLink}.
   */
  | 'link_host_missing'
  /** Benutzername oder Kennwort im Wirtsteil — die klassische Verwechslung. */
  | 'link_userinfo'
  /** Länger als {@link MAX_ATTACHMENT_LINK_BYTES}. */
  | 'link_too_long'
  /** Ein Steuer- oder Richtungszeichen **vor** dem Zerlegen. */
  | 'link_control_character'
  /** `U+200B` oder `U+FEFF` — siehe {@link INVISIBLE_IN_ADDRESS}. */
  | 'link_invisible_character';

export type LinkCheck =
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly reason: LinkRejection };

/**
 * Bei Erweiterungen beachten: Nur besondere WHATWG-Schemata erzwingen bereits beim Zerlegen einen
 * Host.
 */
const ALLOWED_SCHEMES: ReadonlySet<string> = new Set(['http:', 'https:']);

function hasInvisibleAddressCharacter(value: string): boolean {
  for (const character of value) {
    // `for...of` liefert nie eine leere Zeichenkette; `codePointAt(0)` ist auf
    // ihr immer belegt. Der Zweig steht für den Übersetzer, nicht für die
    // Laufzeit — derselbe Satz wie in `packages/export/src/base64.ts`. Der
    // Ersatzwert liegt in keinem der Bereiche und ist damit die harmlose
    // Richtung.
    const code = character.codePointAt(0) ?? -1;
    if (isCodePointInRanges(code, INVISIBLE_IN_ADDRESS)) return true;
  }
  return false;
}

/**
 * Die Domäne bindet keine DOM-Typen ein. Codepunkte direkt zählen, ohne ein temporäres Bytefeld
 * anzulegen.
 */
function byteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    // Wie in `hasInvisibleAddressCharacter`: Der Zweig steht für den
    // Übersetzer, nicht für die Laufzeit. Ein Unterschied gehört trotzdem
    // genannt, weil hier eine **Grenze** gezählt wird: Der Ersatzwert `0`
    // zählt ein Byte, ist also die nachgiebige Richtung. Unerreichbar und
    // damit folgenlos — wer ihn dennoch ändert, nimmt `4` (die größte Breite)
    // und nie einen kleineren Wert.
    const code = character.codePointAt(0) ?? 0;
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

/**
 * Die Beschriftung verwendet dieselbe Zerlegung wie die Prüfung; `href` liefert die gespeicherte
 * Normalform.
 */
interface ParsedUrl {
  readonly protocol: string;
  readonly hostname: string;
  readonly host: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly username: string;
  readonly password: string;
  readonly href: string;
}

/**
 * Der WHATWG-URL-Parser gehört zur Laufzeit, aber nicht zu den ES2023-Typen. Fehlt er, wird die
 * Adresse als nicht zerlegbar abgewiesen.
 */
const PlatformUrl = (globalThis as unknown as { URL: new (input: string) => ParsedUrl }).URL;

/**
 * Länge und unsichtbare Zeichen vor dem Zerlegen prüfen: Der Parser kann Steuerzeichen entfernen.
 * Schema und Zugangsdaten am zerlegten Wert prüfen; ausschließlich die Normalform speichern.
 */
export function normalizeAttachmentLink(raw: string): LinkCheck {
  if (byteLength(raw) > MAX_ATTACHMENT_LINK_BYTES) return { ok: false, reason: 'link_too_long' };
  if (hasForbiddenNameCharacter(raw)) return { ok: false, reason: 'link_control_character' };
  if (hasInvisibleAddressCharacter(raw)) return { ok: false, reason: 'link_invisible_character' };

  let url: ParsedUrl;
  try {
    url = new PlatformUrl(raw);
  } catch {
    return { ok: false, reason: 'link_unparsable' };
  }

  if (!ALLOWED_SCHEMES.has(url.protocol)) return { ok: false, reason: 'link_scheme_rejected' };

  /**
   * Auch bei einer späteren Schemaerweiterung muss jede angenommene Adresse einen Host haben; die
   * Beschriftung setzt das voraus.
   */
  if (url.hostname === '') return { ok: false, reason: 'link_host_missing' };

  if (url.username !== '' || url.password !== '') return { ok: false, reason: 'link_userinfo' };

  // Die Normalform kann durch das Zerlegen gewachsen sein (Prozentkodierung,
  // Punycode). Die Grenze gilt für das, was **gespeichert** wird.
  if (byteLength(url.href) > MAX_ATTACHMENT_LINK_BYTES) return { ok: false, reason: 'link_too_long' };

  return { ok: true, url: url.href };
}

/**
 * Ein Festpunkt muss die vollständige Zulässigkeitsprüfung bestehen; stabile Serialisierung allein
 * würde auch `file:` erlauben.
 */
export function isNormalizedAttachmentLink(value: string): boolean {
  const checked = normalizeAttachmentLink(value);
  return checked.ok && checked.url === value;
}

// Datei — die Form des Pfads (A-A-4, A-A-5)

/**
 * Umleitungsdateien abweisen, weil der angezeigte Pfad ihr tatsächliches Ziel verschweigt. Dies
 * ist keine Liste aller ausführbaren Endungen.
 */
export const INDIRECT_EXTENSIONS: readonly string[] = Object.freeze([
  'lnk',
  'url',
  'pif',
  'scf',
  'desktop',
]);

/** Warum ein Dateipfad abgewiesen wurde. Geschlossener Vorrat, wortgleich A-A-8. */
export type PathRejection =
  | 'path_empty'
  | 'path_not_absolute'
  | 'path_unc'
  | 'path_control_character'
  | 'path_too_long'
  | 'path_stream_separator'
  | 'path_indirect_extension';

export type PathCheck =
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly reason: PathRejection };

/**
 * UNC-Pfade können eine NTLM-Anmeldung an fremden Rechnern auslösen. Beide Trenner und verlängerte
 * Windows-Präfixe prüfen.
 */
export function isUncPath(value: string): boolean {
  const head = value.slice(0, 2);
  return head === '\\\\' || head === '//' || head === '\\/' || head === '/\\';
}

/**
 * Relative Pfade würden gegen das unbeabsichtigte Arbeitsverzeichnis der Hülle aufgelöst.
 * UNC-Prüfung und Öffnungsrückfrage bleiben zusätzlich nötig.
 */
export function isAbsoluteAttachmentPath(value: string): boolean {
  if (value.startsWith('/') || value.startsWith('\\')) return true;
  return /^[A-Za-z]:[\\/]/.test(value);
}

/** Beide Pfadtrenner auf jeder Plattform berücksichtigen, da der Bestand von Windows stammen kann. */
function lastNameSegment(path: string): string {
  const lastSeparator = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return path.slice(lastSeparator + 1);
}

/**
 * Windows entfernt abschließende Punkte und Leerzeichen vor dem Öffnen. Diese Regel muss auch beim
 * Prüfen auf anderen Plattformen gelten.
 */
function effectiveNameSegment(path: string): string {
  return trimResolvedTail(lastNameSegment(path));
}

/**
 * Ohne Pfadzerlegung, damit ein gesuchter Name mit eigenem Trenner wörtlich verglichen werden
 * kann.
 */
function trimResolvedTail(name: string): string {
  let end = name.length;
  while (end > 0) {
    const character = name[end - 1];
    if (character !== '.' && character !== ' ') break;
    end -= 1;
  }
  return name.slice(0, end);
}

/**
 * Nur den letzten Namensbestandteil prüfen, damit Laufwerkspräfixe erlaubt bleiben.
 * NTFS-Datenströme können sonst die Endungsprüfung umgehen.
 * Die Hülle muss unmittelbar vor dem Öffnen erneut prüfen, da direkte Bestandsänderungen diese
 * Eingabeprüfung umgehen.
 */
export function hasPathStreamSeparator(value: string): boolean {
  return lastNameSegment(value).includes(':');
}

/**
 * Die Windows-Normalform und führende Punkte berücksichtigen: Auch `.lnk` und `x.lnk.` sind
 * Umleitungen.
 * Doppelpunkte müssen vor dieser Endungsprüfung ausgeschlossen sein.
 */
export function fileExtensionOf(path: string): string {
  const name = effectiveNameSegment(path);
  const dot = name.lastIndexOf('.');
  if (dot === -1 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/**
 * Nur ASCII falten, damit die Entscheidung mit SQLite-LIKE übereinstimmt und Unicode-Zeichen nicht
 * zusammenfallen.
 */
function asciiLower(value: string): string {
  return value.replace(/[A-Z]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 65 + 97),
  );
}

/** Windows-Namensauflösung und beide Pfadtrenner verwenden, unabhängig von der laufenden Plattform. */
export function attachmentTargetFileName(target: string): string {
  return asciiLower(effectiveNameSegment(target));
}

/**
 * Im Zweifel Eigentümerschaft annehmen: Eine unnötig behaltene Datei ist weniger schädlich als
 * gelöschtes Kundenmaterial.
 * Alle Anhangsarten und Herkünfte berücksichtigen; ein passendes Namensende genügt auch in einem
 * anderen Ordner.
 * Den gesuchten Namen sowohl unverändert als auch ohne abschließende Punkte und Leerzeichen
 * prüfen, aber nicht in Pfadbestandteile zerlegen.
 */
export function attachmentTargetNamesFile(target: string, fileName: string): boolean {
  if (fileName === '') return false;
  const folded = asciiLower(target);
  // Erst die Frage in der Gestalt, in der sie gestellt wurde. Sie ist die
  // ältere und für jeden erzeugten Namen die einzige, die überhaupt greift.
  if (folded.endsWith(asciiLower(fileName))) return true;

  // Dann dieselbe Frage an dem Namen, den Windows beim Öffnen auflöst — auf
  // **beiden** Seiten und nicht nur auf der des `target`.
  const name = asciiLower(trimResolvedTail(fileName));
  if (name === '') return false;
  return folded.endsWith(name) || attachmentTargetFileName(target) === name;
}

/**
 * Den Pfad unverändert prüfen. UNC vor Absolutheit prüfen, Datenstrom-Trenner nach Absolutheit und
 * vor der Endung.
 * Die Hülle prüft unmittelbar vor dem Öffnen erneut; diese Funktion kann weder Bestandsänderungen
 * noch die Dateiexistenz absichern.
 */
export function checkAttachmentPath(value: string): PathCheck {
  if (value.trim() === '') return { ok: false, reason: 'path_empty' };
  if (byteLength(value) > MAX_ATTACHMENT_PATH_BYTES) return { ok: false, reason: 'path_too_long' };
  if (hasForbiddenNameCharacter(value)) return { ok: false, reason: 'path_control_character' };
  if (isUncPath(value)) return { ok: false, reason: 'path_unc' };
  if (!isAbsoluteAttachmentPath(value)) return { ok: false, reason: 'path_not_absolute' };
  if (hasPathStreamSeparator(value)) return { ok: false, reason: 'path_stream_separator' };
  if (INDIRECT_EXTENSIONS.includes(fileExtensionOf(value))) {
    return { ok: false, reason: 'path_indirect_extension' };
  }
  return { ok: true, path: value };
}

// Bild — erkannt an der Kopfsignatur (A-A-16)

/**
 * Die Bildarten, die Takt annimmt.
 *
 * **Kein SVG**, und das ist keine Bequemlichkeit (Bedrohungsmodell 20.5
 * Punkt 3): SVG ist Text, es hat keine Kopfsignatur, und dieselbe Datei über
 * die Art *Datei* mit der Standardanwendung geöffnet landet im Browser — und
 * **dort** laufen die Skripte darin.
 */
export type ImageMediaType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

/**
 * Wie viele Bytes vom Anfang gebraucht werden, um zu entscheiden.
 *
 * WebP ist die längste Signatur: `RIFF` (4) + Größe (4) + `WEBP` (4).
 */
export const IMAGE_SIGNATURE_BYTES = 12;

/** Beginnt das Feld an dieser Stelle mit diesen Bytes? */
function startsWith(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  if (bytes.length < offset + expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (bytes[offset + index] !== expected[index]) return false;
  }
  return true;
}

/**
 * Nur die Kopfsignatur ist maßgeblich, weder Endung noch angegebener MIME-Typ. Eine gültige
 * Signatur garantiert keine unbeschädigte Bilddatei.
 */
export function imageMediaTypeOf(bytes: Uint8Array): ImageMediaType | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A — die vier ersten Bytes genügen (A-A-16).
  if (startsWith(bytes, 0, [0x89, 0x50, 0x4e, 0x47])) return 'image/png';
  // JPEG: FF D8 FF
  if (startsWith(bytes, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  // GIF: 47 49 46 38 („GIF8")
  if (startsWith(bytes, 0, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  // WebP: „RIFF" … „WEBP" — die vier Bytes dazwischen sind die Länge.
  if (
    startsWith(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return 'image/webp';
  }
  return null;
}

/** Warum eine Bilddatei nicht übernommen wurde. Geschlossener Vorrat. */
export type ImageRejection =
  | 'image_unreadable'
  | 'image_too_large'
  | 'image_not_an_image'
  | 'image_empty';

// Beschriftung (A-19.12)

/**
 * Ersatzbeschriftungen müssen gültige Ziele unterscheidbar halten: Bei Links Port, Pfad und
 * `http://`, bei Dateien den Ordner erhalten.
 * Die Rückgabe bleibt Fremdtext und muss bei der Anzeige bereinigt werden. Selbst gewählte Titel
 * dürfen mehrdeutig sein.
 */
export function attachmentLabel(
  kind: AttachmentKind,
  title: string | null,
  target: string,
  /**
   * Der Benutzertitel hat Vorrang vor dem fremden Anzeigenamen; dieser wiederum vor dem erzeugten
   * Dateinamen.
   */
  displayName: string | null = null,
): string {
  const trimmed = title === null ? '' : title.trim();
  if (trimmed !== '') return trimmed;

  const foreign = displayName === null ? '' : displayName.trim();
  if (foreign !== '') return foreign;

  switch (kind) {
    case 'link': {
      const parsed = normalizeAttachmentLink(target);
      if (parsed.ok) {
        // Kein zweites `try`: `normalizeAttachmentLink` hat eben erfolgreich
        // zerlegt, und `href` ist ein Festpunkt (A-A-3) — ein Wurf hier wäre
        // ein Zweig, den kein Prüffall je erreicht (T-127).
        //
        // Und keine zweite Wirtsprüfung: Ein `ok`-Ergebnis trägt einen nicht
        // leeren Wirt, weil `normalizeAttachmentLink` genau das zusichert
        // (dort die Zeile `url.hostname === ''`). Bis T-159 stand hier ein
        // `if (host !== '')`, das diese Zusage ein zweites Mal prüfte — ein
        // Kommentar in Codeform, den kein Prüffall erreichen kann. Er ist
        // jetzt ein Kommentar. Wer die Zusage drüben löst, löst sie hier mit;
        // die Gegenrichtung steht dort als Satz.
        const url = new PlatformUrl(parsed.url);
        // Nur der Wirt: wenn der Pfad `/` ist und weder Abfrage noch Fragment
        // dastehen. Sonst der ganze Rest, und `host` statt `hostname` — der
        // Port gehört zum Wirt, und ohne ihn wären zwei Wirte einer.
        const bare = url.pathname === '/' && url.search === '' && url.hash === '';
        const rest = bare ? url.host : `${url.host}${url.pathname}${url.search}${url.hash}`;
        // Weggelassen wird genau ein Schema, und zwar das, das nichts sagt.
        // Jedes andere — heute nur `http:` — bleibt sichtbar stehen.
        return url.protocol === 'https:' ? rest : `${url.protocol}//${rest}`;
      }
      return target === '' ? 'Verweis' : target;
    }
    case 'file': {
      const lastSeparator = Math.max(target.lastIndexOf('/'), target.lastIndexOf('\\'));
      const name = target.slice(lastSeparator + 1);
      // Kein Name: Der Wert endet auf einen Trenner oder ist leer. Dann steht
      // der Wert selbst da — nie eine leere Zeile.
      if (name === '') return target === '' ? 'Datei' : target;
      // Der Ordner **mit** seinem Trenner (siehe Kopf). Ohne Trenner im Wert
      // gibt es keinen Ordner, und dann steht der Name allein.
      const folder = target.slice(0, lastSeparator + 1);
      return folder === '' ? name : `${name} (${folder})`;
    }
    case 'image':
      return target === '' ? 'Bild' : target;
  }
}
