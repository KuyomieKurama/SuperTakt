/**
 * Takt — Anhänge am Todo (A-19.8 bis A-19.15, A-19.17, E-071, E-072,
 * A-A-13 bis A-A-18).
 *
 * ===========================================================================
 * Drei Arten, und sie unterscheiden sich nicht im Etikett
 * ===========================================================================
 *
 * | Art | Was Takt hält | Was „öffnen" heißt |
 * |---|---|---|
 * | Verweis | eine **Adresse** in Normalform | der Browser (A-A-2, A-A-3) |
 * | Datei | einen **Pfad** | die Standardanwendung des Systems (A-A-4 bis A-A-6) |
 * | Bild | eine **Kopie** im Anwendungsdatenverzeichnis | nichts (E-072 Punkt 2) |
 *
 * Verweis und Datei speichern eine Zeichenkette, kein Byte (E-071 Punkt 1).
 * Ein Bild wird kopiert (E-071 Punkt 2), und diese Datei sagt, **woran** eine
 * Datei als Bild erkannt wird — an ihrer Kopfsignatur und nicht an ihrer
 * Endung (A-A-16).
 *
 * ===========================================================================
 * Der eigentliche Angriff ist die Normalisierung, nicht das Schema
 * ===========================================================================
 *
 * Bedrohungsmodell 20.2, gemessen: Der Zerleger einer Adresse **normalisiert**.
 * Er entfernt führenden Leerraum, Tabulator und Zeilenumbruch an jeder Stelle,
 * er wandelt Homoglyphen nach Punycode, er läßt eine Nullbreite im Wirtsnamen
 * verschwinden, und er macht aus `http:/\example.org/` ein
 * `http://example.org/`.
 *
 * Wer die **Rohfassung** anzeigt und die **Normalform** öffnet, hat einen
 * Verweis gebaut, der etwas anderes tut, als er sagt. Der Benutzer liest
 * `ht<TAB>tps://exam<ZWSP>ple.org` und Takt öffnet `https://example.org/`.
 *
 * Die Antwort ist A-A-3, und sie hat zwei Hälften:
 *
 *  1. **Normalisiert wird einmal**, beim Anlegen, und gespeichert wird die
 *     Normalform — {@link normalizeAttachmentLink}, und zwar **hier** und
 *     nirgends sonst (A-A-13, dieselbe Begründung wie beim führenden `v` der
 *     Fassung, E-066 Punkt 3).
 *  2. **Der Öffnen-Befehl der Hülle verlangt einen Festpunkt** — er
 *     normalisiert nicht, er weist ab. Diese Hälfte liegt in Rust
 *     (`apps/desktop/src-tauri`), weil zwischen Speichern und Öffnen der
 *     Bestand liegt (E-072 Punkt 2, VG-1 und VG-3).
 *
 * Gemessen mit Node (WHATWG `URL`) gegen die Tabelle aus Bedrohungsmodell 20.2,
 * die mit Rust `url 2.5.8` entstanden ist: **alle 23 Zeilen stimmen überein**,
 * einschließlich `xn--exmple-4nf.org`, `%E2%80%AE` und der drei Zeilen, die
 * sich gar nicht zerlegen lassen. Beide setzen den WHATWG-URL-Standard um;
 * das ist der Grund, und deshalb ist es kein Zufall, auf den man sich verläßt,
 * sondern eine Eigenschaft, gegen die man prüft.
 *
 * ===========================================================================
 * Was hier **nicht** steht
 * ===========================================================================
 *
 *  - **Kein Export.** Weder eine Frist noch ein Anhang wird je eine Feldquelle
 *    (A-19.17, A-A-20). `ExportSourcePath` in `export.ts` bleibt bei zwölf
 *    Werten; `ExportCandidate` und `ExportGroup` tragen kein Anhangsfeld. Der
 *    Schutz ist derselbe wie beim internen Vermerk und aus demselben Grund
 *    ein **Typ** und keine Filterliste (R-06).
 *  - **Kein Öffnen.** Diese Datei prüft Formen. Sie ruft nichts auf, sie
 *    startet nichts, und sie kennt weder `open` noch eine Hülle.
 *  - **Keine Endungs-Verbotsliste für ausführbare Dateien.** Die wäre unter
 *    Windows über `PATHEXT` benutzerbestimmt, sie ist nicht abzählbar, und sie
 *    lehrt das Umbenennen (Bedrohungsmodell 20.1). Abgewiesen werden fünf
 *    **Umleitungen** — siehe {@link INDIRECT_EXTENSIONS} —, und die aus einem
 *    anderen Grund.
 *
 * Rein: gleiche Eingabe, gleiche Ausgabe, kein Zugriff auf Uhr, Datei, Netz
 * oder Datenbank. Diese Datei benutzt `URL` aus der Laufzeit — dieselbe
 * Rechtfertigung wie `Intl` in `kernel.ts`: ein Standard der Plattform, keine
 * Fremdbibliothek (B-18.7).
 */

import type { CodePointRange } from './characters.ts';
import { hasForbiddenNameCharacter } from './characters.ts';
import type { Branded, TodoId, Timestamp } from './kernel.ts';

export type AttachmentId = Branded<'AttachmentId'>;

// ---------------------------------------------------------------------------
// Die Arten
// ---------------------------------------------------------------------------

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
 * Führt der Bestand **genau** die Arten, die dieses Erzeugnis kennt? (A-A-36.)
 *
 * ---------------------------------------------------------------------------
 * Die Frage ist nicht „ist jede Art bekannt", sondern „ist die Menge dieselbe"
 * ---------------------------------------------------------------------------
 *
 * Migration 0015 hat die Arten mit Absicht zu **Daten** gemacht und nicht zu
 * einer Schemaklausel: Eine vierte Art soll ein `INSERT` sein und kein Umbau.
 * Der Preis dieser Freiheit ist, daß eine Datenbank Arten führen kann, von
 * denen dieses Erzeugnis nichts weiß — und jede Stelle, die über Arten
 * **rechnet**, statt sie nur anzuzeigen, rechnet dann falsch.
 *
 * Der Anlaß ist gemessen (Bedrohungsmodell 23.3.3): Der Aufräumlauf für
 * verwaiste Bildkopien fragt den Bestand mit `kind = 'image'` und liest eine
 * **leere** Antwort als Beweis, daß eine Datei keinen Eigentümer hat. Eine
 * vierte Art, die ebenfalls eine Kopie im Bildverzeichnis hält, wäre in dieser
 * Antwort nicht enthalten — und der nächste Start entfernte Kundenmaterial,
 * das einen Eigentümer hat.
 *
 * Deshalb **Gleichheit** und nicht Teilmenge, und zwar in beide Richtungen:
 *
 *  - **Zu viel** im Bestand heißt, dieses Erzeugnis kennt eine Art nicht und
 *    darf über sie nicht rechnen.
 *  - **Zu wenig** heißt, der Bestand ist älter als dieses Erzeugnis oder eine
 *    Zeile fehlt. Auch das ist ein Zustand, in dem niemand etwas löschen soll.
 *
 * Doppelte Einträge kann es nicht geben — `kind` ist der Primärschlüssel der
 * Nachschlagetabelle. Die Zählung darüber steht trotzdem hier, weil diese
 * Funktion eine Liste bekommt und keine Tabelle.
 *
 * **Rein.** Sie fragt keinen Bestand; sie bekommt, was er geantwortet hat.
 */
export function isKnownAttachmentKindSet(kinds: readonly string[]): boolean {
  const seen = new Set(kinds);
  if (seen.size !== kinds.length) return false;
  if (seen.size !== ATTACHMENT_KINDS.length) return false;
  return ATTACHMENT_KINDS.every((kind) => seen.has(kind));
}

// ---------------------------------------------------------------------------
// Der Wert
// ---------------------------------------------------------------------------

/**
 * Ein Anhang, so wie ihn jede Antwort und jede Anzeige sieht.
 *
 * `target` ist die eine Zeichenkette, die die Art bestimmt:
 *
 *  - `link` — die **Normalform** der Adresse (A-A-3). Was hier steht, ist
 *    genau das, was angezeigt und was geöffnet wird.
 *  - `file` — der absolute Pfad, unverändert wie eingegeben.
 *  - `image` — der **erzeugte** Name der Kopie im Bildverzeichnis (A-A-17),
 *    nie der Name der Quelldatei. Der Pfad der Quelle wird **nicht**
 *    gespeichert: Er verrät, wo der Benutzer seine Dateien hält, und niemand
 *    braucht ihn nach dem Kopieren.
 *
 * Ein Feld und nicht drei: Eine vierte Art bekäme sonst eine vierte Spalte,
 * und drei von vier Spalten wären in jeder Zeile leer.
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
}

/** Was zum Anlegen eines Anhangs nötig ist. Geprüft, bevor es hierher kommt. */
export interface AttachmentCreate {
  readonly todoId: TodoId;
  readonly kind: AttachmentKind;
  readonly title: string | null;
  readonly target: string;
  readonly now: Timestamp;
}

// ---------------------------------------------------------------------------
// Grenzwerte — an einer Stelle, bei den übrigen aus T-128
// ---------------------------------------------------------------------------

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
 * Obergrenze **eines Bildes**, in Bytes (A-A-15, E-073 Punkt 3).
 *
 * ---------------------------------------------------------------------------
 * Woher die Zahl kommt und warum sie acht und nicht fünf Mebibyte ist
 * ---------------------------------------------------------------------------
 *
 * E-073 Punkt 3 schlug 5 MiB vor und begründete sie mit dem Arbeitsspeicher im
 * Webview: Ein Bild geht als `data:`-Adresse hinüber und wird dabei um rund ein
 * Drittel größer; fünf Anhänge an einem Todo wären dann etwa 33 MiB.
 *
 * Das Bedrohungsmodell hat daraus in A-A-15 **8 388 608 Bytes** gemacht, und
 * diese Datei nimmt die Zahl aus dem Bedrohungsmodell. Der Grund für den
 * höheren Wert ist der Fall, den die Rechnung nicht abbildet: Ein Foto aus
 * einer heutigen Handykamera liegt regelmäßig zwischen fünf und acht Mebibyte,
 * ist nicht bösartig und wäre bei fünf abgewiesen worden — mit einer Meldung,
 * die der Benutzer für eine Fehlfunktion hält. Die Rechnung aus E-073 bleibt
 * richtig; sie sagt, was der Preis ist, und acht ist der Preis, den A-A-15
 * bezahlt.
 *
 * **Gezählt beim Lesen, nicht aus `stat`** (A-A-15, dieselbe Begründung wie
 * A-V-6 für `content-length`): Eine angekündigte Größe ist keine Grenze. Die
 * Umsetzung steht im Adapter; diese Konstante ist die eine Zahl, die er liest.
 */
export const MAX_ATTACHMENT_IMAGE_BYTES = 8_388_608;

/**
 * Obergrenze der Bezeichnung, in Zeichen.
 *
 * Dieselbe Zahl wie `MAX_NAME_LENGTH` in `tag-name.ts` und aus demselben
 * Grund — ein Titel ist eine Zeile. Sie steht hier trotzdem eigenständig und
 * nicht als Verweis: Ein Anhangstitel ist kein Tagname, und wer den einen
 * ändert, soll nicht den anderen mitändern. Die Zahl ist dieselbe, die Sache
 * ist es nicht.
 */
export const MAX_ATTACHMENT_TITLE_CHARACTERS = 200;

// ---------------------------------------------------------------------------
// Verweis — Normalisierung an genau einer Stelle (A-A-13)
// ---------------------------------------------------------------------------

/**
 * Zwei unsichtbare Zeichen, die **zusätzlich** zu
 * `FORBIDDEN_NAME_CHARACTERS` in einer Adresse nichts zu suchen haben
 * (A-A-14).
 *
 * `U+200B` (Nullbreite) und `U+FEFF` (Nullbreite ohne Umbruch) stehen
 * ausdrücklich **nicht** in der Namensklasse: Dort halten `U+200B`–`U+200D`
 * zusammengesetzte Emoji zusammen, und ein Titel darf sie tragen
 * (`characters.ts`). In einer **Adresse** ist das anders, und der Unterschied
 * ist gemessen (Bedrohungsmodell 20.2): Der Zerleger entfernt sie
 * stillschweigend aus dem Wirtsnamen. `https://exam<ZWSP>ple.org/` wird zu
 * `https://example.org/` — Anzeige und Ziel fallen auseinander, und genau das
 * schließt A-A-3 aus.
 *
 * Sie werden **abgewiesen** und nicht entfernt: Eine Adresse ist Eingabe des
 * Benutzers, und eine stillschweigend geänderte Eingabe ist die zweite Hälfte
 * desselben Fehlers (E-063 Punkt 3).
 */
export const INVISIBLE_IN_ADDRESS: readonly CodePointRange[] = Object.freeze([
  Object.freeze({ from: 0x200b, to: 0x200b }),
  Object.freeze({ from: 0xfeff, to: 0xfeff }),
]);

/**
 * Warum eine Adresse abgewiesen wurde.
 *
 * Ein **geschlossener** Vorrat technischer Schlüssel, derselbe Aufbau wie
 * `ReleaseLookupFailure` und aus demselben Grund (A-A-8): Der abgewiesene Wert
 * steht **nicht** in der Meldung. Er kann aus einer fremden Quelle stammen und
 * trägt womöglich genau das Zeichen, gegen das er abgewiesen wurde.
 *
 * Die Schlüssel sind wortgleich die aus A-A-8, damit Dienst und Hülle über
 * denselben Fall dasselbe sagen.
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
 * Die erlaubten Schemata. Positivliste, geprüft am **zerlegten** Schema
 * (A-A-2).
 *
 * Wer diese Menge erweitert, sollte wissen, was daran hängt: `http` und
 * `https` sind im WHATWG-Standard **besondere** Schemata („special schemes"),
 * und für die erzwingt der Zerleger einen Wirt. Ein nicht-besonderes Schema
 * tut das nicht — `new URL('takt:///pfad').hostname` ist gemessen `''`. Erst
 * dann trägt die Wirtsprüfung in {@link normalizeAttachmentLink}, und erst
 * dann kann sie überhaupt etwas abweisen. Sie ist der Preis dieser
 * Erweiterung und steht deshalb schon heute da.
 */
const ALLOWED_SCHEMES: ReadonlySet<string> = new Set(['http:', 'https:']);

/** Liegt der Codepunkt in einem der Bereiche? Dieselben vier Zeilen wie in `characters.ts`. */
function inRanges(codePoint: number, ranges: readonly CodePointRange[]): boolean {
  for (const range of ranges) {
    if (codePoint >= range.from && codePoint <= range.to) return true;
  }
  return false;
}

function hasInvisibleAddressCharacter(value: string): boolean {
  for (const character of value) {
    // `for...of` liefert nie eine leere Zeichenkette; `codePointAt(0)` ist auf
    // ihr immer belegt. Der Zweig steht für den Übersetzer, nicht für die
    // Laufzeit — derselbe Satz wie in `packages/export/src/base64.ts`. Der
    // Ersatzwert liegt in keinem der Bereiche und ist damit die harmlose
    // Richtung.
    const code = character.codePointAt(0) ?? -1;
    if (inRanges(code, INVISIBLE_IN_ADDRESS)) return true;
  }
  return false;
}

/**
 * Länge in **UTF-8-Bytes**, von Hand gezählt.
 *
 * ---------------------------------------------------------------------------
 * Warum nicht `new TextEncoder().encode(value).length`
 * ---------------------------------------------------------------------------
 *
 * Weil die Domäne `types: []` und `lib: ["ES2023"]` führt (siehe
 * `packages/domain/tsconfig.json`) und `TextEncoder` weder das eine noch das
 * andere ist — er ist WHATWG. Das ist kein Formfehler des Übersetzers, sondern
 * genau die Absicht dieser Schalter: Was hier nicht benennbar ist, kann hier
 * nicht benutzt werden, und `fs` oder `process` sollen es nicht sein.
 *
 * Die Zählung selbst ist vier Zeilen und braucht keine Zeichentabelle: Die
 * Breite eines Zeichens in UTF-8 hängt allein an seinem Codepunkt. Sie
 * **erzeugt keine Zwischenzeichenkette** — das ist der zweite Gewinn
 * gegenüber `encode`, das für jede Prüfung ein Bytefeld anlegt, das niemand
 * liest.
 *
 * `for...of` läuft über Codepunkte und nicht über UTF-16-Einheiten; ein
 * Ersatzpaar wird damit einmal gezählt und nicht zweimal.
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
 * Was von einer zerlegten Adresse gebraucht wird — und nichts darüber hinaus.
 *
 * Neun Felder aus dem WHATWG-URL-Standard, alle Zeichenketten. `href` ist die
 * **Serialisierung**, also die Normalform, um die es in A-A-3 geht.
 *
 * Fünf davon prüfen ({@link normalizeAttachmentLink}), vier beschriften
 * ({@link attachmentLabel}): `host` — mit Port, denn der gehört zum Wirt —,
 * `pathname`, `search` und `hash`. Sie stehen hier, damit die Beschriftung
 * die Normalform **zerlegt** statt sie mit Zeichenkettenarbeit auseinanderzu-
 * nehmen; eine zweite Zerlegeregel neben der der Laufzeit wäre genau die
 * zweite Wahrheit, die dieser ganze Abschnitt vermeidet.
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
 * Der Zerleger der Laufzeit, an **einer** Stelle typisiert.
 *
 * ---------------------------------------------------------------------------
 * Die eine Zusicherung dieser Datei, und warum sie hier vertretbar ist
 * ---------------------------------------------------------------------------
 *
 * `URL` ist wie `TextEncoder` nicht in `lib: ["ES2023"]` — und anders als bei
 * der Bytezählung ist Selbermachen hier die **schlechtere** Wahl: Die Tabelle
 * aus Bedrohungsmodell 20.2 zeigt, wie viele Regeln man dabei nachbauen müßte,
 * und jede davon wäre eine Gelegenheit, eine falsch nachzubauen (T-145-12,
 * derselbe Schluß, den das Bedrohungsmodell für die Hülle zieht).
 *
 * Also wird der Zerleger der Laufzeit benutzt, und die Zusicherung darüber
 * steht **einmal**, an einer Stelle, deren ganzer Inhalt eine Zeile ist —
 * dieselbe Bauart wie `patchOf` im Dienst. Sie behauptet genau das, was jede
 * Laufzeit dieses Vorhabens mitbringt (Node ≥ 22, jeder Webview) und nicht
 * mehr: neun Felder, alle Zeichenketten.
 *
 * Gäbe es `URL` nicht, wirft `new` — und der Wurf landet in der Klammer von
 * {@link normalizeAttachmentLink}, die daraus `link_unparsable` macht. Keine
 * Adresse käme dann durch, und das ist die richtige Richtung: zu viel
 * abweisen, nie zu wenig.
 *
 * Es bleibt eine Fremdheit in einem Paket, das sonst nichts von der Plattform
 * weiß — dieselbe wie `Intl` in `kernel.ts`, und mit derselben Begründung: Ein
 * Standard der Plattform ist keine Fremdbibliothek (B-18.7), und eine eigene
 * Fassung wäre die zweite Wahrheit neben der der Laufzeit.
 */
const PlatformUrl = (globalThis as unknown as { URL: new (input: string) => ParsedUrl }).URL;

/**
 * **Die** Normalisierung einer Anhangsadresse (A-A-13).
 *
 * Sie steht hier und nirgends sonst — nicht im Dienst, nicht in der
 * Oberfläche, nicht in der Hülle. Die Hülle **prüft** dieselbe Eigenschaft
 * (Festpunkt), sie stellt sie nicht her; das ist der Unterschied, den A-A-3
 * verlangt, und er ist der Grund, warum eine zweite Normalisierung im Baum ein
 * Fund wäre und keine Dopplung.
 *
 * Die Reihenfolge der Prüfungen ist Inhalt und kein Zufall:
 *
 *  1. **Länge** — bevor irgendetwas Teures geschieht.
 *  2. **Steuer- und Richtungszeichen**, ausdrücklich **vor** dem Zerlegen
 *     (A-A-2). Der Zerleger entfernt Tabulator und Zeilenumbruch an jeder
 *     Stelle; wer danach prüft, prüft eine Zeichenkette, die es nie gab.
 *  3. **Die beiden Nullbreiten**, aus demselben Grund (A-A-14).
 *  4. **Zerlegen.** Was hier scheitert, ist keine Adresse — der UNC-Pfad
 *     `\\server\freigabe` fällt hier, und deshalb braucht der Typ *Verweis*
 *     keine eigene UNC-Regel (T-145-10).
 *  5. **Schema**, auf dem zerlegten Wert und nicht auf einem Präfix der
 *     Rohfassung. `http:/\example.org/` ist ein `http`-Ziel; ein
 *     Präfixvergleich hielte es für keines und wäre damit **strenger** und
 *     zugleich gefährlicher — er verführte dazu, die Rohfassung zu speichern.
 *  6. **Wirt vorhanden.**
 *  7. **Keine Zugangsdaten.** `https://evil.example@gutartig.example/` bleibt
 *     in der Normalform erhalten und liest sich wie ein anderer Wirt, als es
 *     ansteuert. Deshalb abweisen und nicht normalisieren.
 *
 * Zurück kommt `url.href` — die Serialisierung des WHATWG-Standards. Sie ist
 * gemessen idempotent: `norm(norm(x)) === norm(x)` für jede Zeile aus
 * Bedrohungsmodell 20.2.
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

  /*
   * Der Wirt. Diese Zeile ist ein **Boden**, kein Filter — und die Begründung,
   * die bis T-159 hier stand, war falsch.
   *
   * Falsch war: „fängt `https:///pfad`". Gemessen (Node 22.23.2, WHATWG-URL)
   * ist `new URL('https:///pfad').hostname === 'pfad'`; der Zerleger befördert
   * das erste Pfadstück zum Wirt, und die Normalform lautet danach
   * `https://pfad/`. Diese Zeile sieht davon nichts — der Wirt ist nicht leer.
   * Das ist auch kein Verlust: Gespeichert und geöffnet wird die Normalform
   * (A-A-3), Anzeige und Ziel sagen also dasselbe. Ein leerer Wirt ist für
   * `http`/`https` überhaupt nicht erreichbar, weil beide **besondere**
   * Schemata sind: `new URL('https://')` wirft, und der Wurf ist schon oben
   * als `link_unparsable` abgefangen.
   *
   * Richtig ist: Unter der heutigen {@link ALLOWED_SCHEMES} kann diese Zeile
   * nichts abweisen, und kein Prüffall erreicht sie. Sie steht für den Tag, an
   * dem die Positivliste ein **nicht**-besonderes Schema aufnimmt — dort ist
   * ein leerer Wirt zulässig (`new URL('takt:///pfad').hostname === ''`), und
   * dann trägt allein diese Zeile. Wer sie streicht, weil kein Prüffall sie
   * erreicht, streicht die Wache für eine Erweiterung, die sich nicht selbst
   * ansagt.
   *
   * Zweiter Träger derselben Zusage: {@link attachmentLabel} verläßt sich
   * darauf, daß ein `ok`-Ergebnis einen nicht leeren Wirt hat.
   */
  if (url.hostname === '') return { ok: false, reason: 'link_host_missing' };

  if (url.username !== '' || url.password !== '') return { ok: false, reason: 'link_userinfo' };

  // Die Normalform kann durch das Zerlegen gewachsen sein (Prozentkodierung,
  // Punycode). Die Grenze gilt für das, was **gespeichert** wird.
  if (byteLength(url.href) > MAX_ATTACHMENT_LINK_BYTES) return { ok: false, reason: 'link_too_long' };

  return { ok: true, url: url.href };
}

/**
 * Ist dieser gespeicherte Wert bereits ein **Festpunkt** der Normalform
 * (A-A-3)?
 *
 * Das ist die Frage, die der Öffnen-Befehl der Hülle stellt — hier steht sie
 * für den Dienst, der denselben Bestand liest und dieselbe Antwort braucht,
 * bevor er einen Wert herausgibt.
 *
 * `normalizeAttachmentLink(x).url === x` und nicht `URL(x).href === x`: Der
 * Festpunkt schließt die vollständige Prüfung ein, nicht nur die
 * Serialisierung. Ein `file:///etc/passwd` ist ein Festpunkt der
 * Serialisierung und trotzdem keine zulässige Adresse.
 */
export function isNormalizedAttachmentLink(value: string): boolean {
  const checked = normalizeAttachmentLink(value);
  return checked.ok && checked.url === value;
}

// ---------------------------------------------------------------------------
// Datei — die Form des Pfads (A-A-4, A-A-5)
// ---------------------------------------------------------------------------

/**
 * Fünf Endungen, die **hart** abgewiesen werden (A-A-5).
 *
 * Sie stehen hier **nicht**, weil sie ausführbar sind — `.exe`, `.bat` und
 * `.ps1` sind es auch und werden nicht abgewiesen. Sie stehen hier, weil sie
 * **Umleitungen** sind: Bei ihnen zeigt der Pfad, den die Rückfrage nennt,
 * nicht auf das, was startet. Eine `rechnung.lnk` kann jedes Ziel und jedes
 * Symbol tragen.
 *
 * Für sie ist die Rückfrage aus E-072 Punkt 3 nicht bloß schwach, sie ist
 * **aktiv irreführend**: Sie sagt die Wahrheit über die Datei und lügt über
 * die Wirkung. Genau diese Begründung — und keine andere — trägt diese fünf
 * Einträge. Alles darüber hinaus wäre eine Liste, die beruhigt und das
 * Umbenennen lehrt (Bedrohungsmodell 20.1).
 *
 * Verglichen wird ohne Rücksicht auf Groß- und Kleinschreibung, auf dem
 * **letzten** Punktsegment des Dateinamens.
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
 * Ist das ein UNC-Pfad?
 *
 * **Beide** Schreibweisen: `\\server\freigabe` und `//server/freigabe`.
 * Windows löst beide auf, und beide sind dort ein **Anmeldeversuch gegen einen
 * fremden Rechner** — was dabei über die Leitung geht, ist der NTLM-Handschlag
 * des angemeldeten Benutzers (R-22, Bedrohungsmodell 20.1).
 *
 * Diese Prüfung ist **nicht** aus „ist der Pfad absolut" ableitbar: Unter
 * Windows ist `\\server\freigabe\datei.exe` absolut. Genau deshalb steht sie
 * einzeln da und nicht als Nebensatz.
 *
 * Erfaßt sind zusätzlich die verlängerten Windows-Präfixe, mit denen sich
 * dieselbe Auflösung erreichen läßt: `\\?\UNC\server\...`, `\\?\...`,
 * `\\.\...`. Die vollständige Prüfung gegen `std::path::Prefix` liegt in der
 * Hülle (A-A-4); hier steht die Fassung, die eine Zeichenkette prüfen kann —
 * die Tür soll einen offensichtlich falschen Wert erst gar nicht speichern.
 */
export function isUncPath(value: string): boolean {
  const head = value.slice(0, 2);
  return head === '\\\\' || head === '//' || head === '\\/' || head === '/\\';
}

/**
 * Ist der Pfad absolut?
 *
 * Zwei Formen, weil zwei Systeme gemeint sind: `/…` unter Unix und
 * `C:\…`/`C:/…` unter Windows. Ein relativer Pfad würde gegen das
 * Arbeitsverzeichnis der Hülle aufgelöst — einen Ort, den niemand bewußt
 * gewählt hat.
 *
 * Diese Prüfung ist **keine Grenze**, sondern Hygiene (Bedrohungsmodell 20.1);
 * die Grenze ist die UNC-Prüfung darüber und die Rückfrage in der Oberfläche.
 */
export function isAbsoluteAttachmentPath(value: string): boolean {
  if (value.startsWith('/') || value.startsWith('\\')) return true;
  return /^[A-Za-z]:[\\/]/.test(value);
}

/**
 * Der letzte Namensbestandteil eines Pfades — alles hinter dem letzten `/`
 * oder `\`. Er steht hier **einmal**, weil zwei Prüfungen ihn brauchen:
 * {@link hasPathStreamSeparator} und {@link fileExtensionOf}. Zwei Fassungen
 * derselben Zerlegung wären zwei Antworten auf die Frage, welche Datei
 * eigentlich gemeint ist.
 *
 * **Beide Trenner, auf jeder Plattform**, und das ist Absicht: Hier wird über
 * eine Zeichenkette geurteilt, die aus einem Windows-Bestand stammen kann,
 * während der Dienst auf Linux läuft. `node:path` wüßte an dieser Stelle zu
 * wenig — es kennt den Trenner der **laufenden** Plattform und nicht den des
 * Pfades —, und die Domäne dürfte es ohnehin nicht rufen.
 */
function lastNameSegment(path: string): string {
  const lastSeparator = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return path.slice(lastSeparator + 1);
}

/**
 * Der Dateiname, **wie Windows ihn beim Öffnen auflöst** (A-A-5′).
 *
 * Windows schneidet nachgestellte Punkte und Leerzeichen vom letzten
 * Namensbestandteil ab, **bevor** es die Datei auflöst: `rechnung.lnk.` und
 * `rechnung.lnk ` öffnen beide `rechnung.lnk`. Wer den gespeicherten Namen
 * prüft, prüft eine Zeichenkette, die nie eine Datei war — T-156-1 hat die
 * Verbotsliste der Hülle mit genau **einem** Zeichen ausgehebelt.
 *
 * Abgeschnitten wird nur am **Ende** und nur diese beiden Zeichen. Zeichengleich
 * mit `effective_file_name` in `apps/desktop/src-tauri/src/attachment.rs` und
 * mit `effectiveFileNameOf` in `apps/web/src/lib/attachmentLabel.ts`.
 *
 * **Auf jeder Plattform**, nicht unter einer Betriebssystemabfrage: Ein Zweig,
 * der nur auf einem System etwas tut, ist auf dem Läufer der Reihe unmeßbar
 * (A-A-10). Der Preis ist eine Datei namens `rechnung.lnk.` unter Linux, die
 * Takt nicht annimmt; eine `.lnk` tut dort ohnehin nichts.
 */
function effectiveNameSegment(path: string): string {
  const name = lastNameSegment(path);
  let end = name.length;
  while (end > 0) {
    const character = name[end - 1];
    if (character !== '.' && character !== ' ') break;
    end -= 1;
  }
  return name.slice(0, end);
}

/**
 * Trägt der letzte Namensbestandteil einen Doppelpunkt? (A-A-28.)
 *
 * ---------------------------------------------------------------------------
 * Diese Prüfung ist der **zweite** Riegel und nicht der einzige. Wer sie für
 * die Grenze hält, baut die Grenze aus.
 * ---------------------------------------------------------------------------
 *
 * Die tragende Kontrolle ist und bleibt `check_file` in
 * `apps/desktop/src-tauri/src/attachment.rs`; sie läuft **bei jedem Aufruf**
 * unmittelbar vor dem Öffnen. Zwischen dieser Tür und jenem Öffnen liegt der
 * **Bestand**, und in den Bestand kommt man an jeder Tür vorbei: über die
 * Routen des Dienstes mit dem Sitzungsgeheimnis (VG-1) und über ein `UPDATE`
 * mit `sqlite3` auf die Bestandsdatei (VG-3). Ein Wert, der so hineingeschrieben
 * wurde, hat diese Zeilen nie gesehen.
 *
 * Umgekehrt gilt dasselbe: Diese Prüfung ist **nicht** entbehrlich, weil es die
 * andere gibt. Sie hält den Wert aus dem Bestand heraus, solange er über die
 * Tür kommt, und sie sagt dem Benutzer im Augenblick der Eingabe, warum — die
 * Hülle könnte das erst nach dem Klick, an einem Anhang, den er schon angelegt
 * hat. **Keine der beiden ist die Verdopplung der anderen.** Wer eine davon
 * streicht, weil sie doppelt aussieht, streicht entweder die Kontrolle oder die
 * Auskunft.
 *
 * ---------------------------------------------------------------------------
 * Warum überhaupt
 * ---------------------------------------------------------------------------
 *
 * Unter NTFS ist der Doppelpunkt der Trenner eines alternativen Datenstroms:
 * `datei::$DATA` löst auf den unbenannten Datenstrom von `datei` auf,
 * `datei:strom` auf einen benannten. Damit reden die Existenzprüfung und die
 * Endungsprüfung über **verschiedene Dateien** — T-164 hat gemessen, daß
 * `…/rechnung.lnk::$DATA` und `…/rechnung.lnk:harmlos.txt` durch
 * {@link INDIRECT_EXTENSIONS} fallen, weil deren letztes Punktsegment
 * `lnk::$data` heißt und nicht `lnk`. Ein Name mit Doppelpunkt hat keine
 * beurteilbare Endung; die Frage danach ist keine sinnvolle Frage mehr.
 *
 * ---------------------------------------------------------------------------
 * Gefragt wird nur der **letzte** Bestandteil
 * ---------------------------------------------------------------------------
 *
 * Sonst fiele der Laufwerksbuchstabe mit: `C:\Users\…` trägt einen Doppelpunkt,
 * ist aber ein Präfix und kein Name. Aus demselben Grund steht diese Prüfung in
 * {@link checkAttachmentPath} **hinter** der Absolutheitsprüfung — ein
 * unvollständiger Windows-Pfad wie `C:datei.pdf` bekommt `path_not_absolute`
 * und nicht diesen Grund, der ihn in die Irre führte.
 *
 * ---------------------------------------------------------------------------
 * Dieselbe Frage stellt `has_stream_separator` in der Hülle
 * ---------------------------------------------------------------------------
 *
 * Wortgleich: „enthält der letzte Namensbestandteil ein `:`". Der einzige
 * Unterschied liegt in der Zerlegung — dort `Path::file_name()`, also der
 * Trenner der laufenden Plattform, hier {@link lastNameSegment} mit **beiden**
 * Trennern. Die Richtung ist gutartig: Wo die Zerlegungen auseinandergehen,
 * urteilt die Hülle **strenger** oder hat den Pfad schon vorher mit
 * `path_not_absolute` abgewiesen. Ein Wert, den diese Tür annimmt und die Hülle
 * öffnet, ist damit nie einer, den die Hülle wegen des Doppelpunkts abgelehnt
 * hätte.
 */
export function hasPathStreamSeparator(value: string): boolean {
  return lastNameSegment(value).includes(':');
}

/**
 * Das letzte Punktsegment des **aufgelösten** Dateinamens, kleingeschrieben.
 * Leer, wenn es keines gibt.
 *
 * ---------------------------------------------------------------------------
 * Zwei Dinge, die anders sind als bei einer gewöhnlichen Endungsfunktion
 * ---------------------------------------------------------------------------
 *
 *  1. **Gemessen wird an {@link effectiveNameSegment}**, also am Namen, den
 *     Windows auflöst — nicht am gespeicherten. `rechnung.lnk.` und
 *     `rechnung.lnk ` liefern beide `lnk` (A-A-5′, T-156-1).
 *  2. **Ein führender Punkt zählt mit.** `.lnk` hat die Endung `lnk` und ist
 *     **keine** endungslose versteckte Datei: Für den Windows-Explorer ist es
 *     eine Verknüpfung, und die Hülle weist sie ab. Der Preis ist, daß
 *     `.gitignore` die Endung `gitignore` bekommt — sie steht auf keiner Liste
 *     und ändert nichts.
 *
 * Punkt 2 war bis T-178 anders (`dot <= 0` statt `dot === -1`), und das war
 * eine **gemessene Abweichung** von der Hülle: `/home/nutzer/.lnk` kam an der
 * Tür durch und fiel erst am Öffnen-Befehl (T-179 B-1). Zeichengleich mit
 * `has_indirect_extension` in `apps/desktop/src-tauri/src/attachment.rs`
 * (`rsplit_once('.')` nimmt den führenden Punkt ebenfalls als Trenner) und mit
 * `extensionOf` in `apps/web/src/lib/attachmentLabel.ts`.
 *
 * **Über einen Namen mit Doppelpunkt trifft diese Funktion keine Aussage** —
 * `rechnung.lnk::$DATA` liefert `lnk::$data`, und das steht auf keiner Liste
 * (A-A-28, gemessen in T-164). Genau deshalb fragt {@link checkAttachmentPath}
 * **vor** dieser Funktion nach dem Doppelpunkt und nicht danach. Wer die
 * Reihenfolge dort umdreht, hebt A-A-5 wieder auf. Dieselbe Auslassung hat
 * `has_indirect_extension` in der Hülle, und aus demselben Grund: Beide sind
 * durch die Doppelpunktprüfung gedeckt, statt sie nachzubauen.
 */
export function fileExtensionOf(path: string): string {
  const name = effectiveNameSegment(path);
  const dot = name.lastIndexOf('.');
  if (dot === -1 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/**
 * Die Form eines Dateipfads an der Tür (A-A-4, A-A-5).
 *
 * Der Pfad wird **nicht** verändert — kein `trim`, keine Auflösung, keine
 * Umschreibung von Trennern. Was hier durchgeht, ist Zeichen für Zeichen das,
 * was gespeichert wird, und das ist dieselbe Regel wie beim Verweis: Geprüft
 * wird der Wert, der abgelegt wird.
 *
 * **Ob die Datei existiert, prüft diese Funktion nicht.** Das ist keine
 * Sicherheitsprüfung — zwischen `exists()` und `open()` liegt ein Wettlauf,
 * den niemand gewinnt (Bedrohungsmodell 20.1). Es ist die Voraussetzung für
 * A-19.15 („sagt das an Ort und Stelle"), und dafür fragt die Anzeige, nicht
 * die Tür.
 *
 * ---------------------------------------------------------------------------
 * Die Reihenfolge ist Inhalt, und sie ist die aus `check_file`
 * ---------------------------------------------------------------------------
 *
 * Schritt für Schritt dieselbe wie in `apps/desktop/src-tauri/src/attachment.rs`
 * — dieselben Fragen, dieselben Schlüssel, dieselbe Folge:
 *
 *  1. **Leer, Länge, Steuerzeichen.** Hygiene, und sie steht vorn, damit nichts
 *     Langes erst zerlegt wird.
 *  2. **Kein UNC** ({@link isUncPath}). **Vor** der Absolutheitsprüfung, weil
 *     ein UNC-Pfad unter Windows absolut ist und sie bestünde.
 *  3. **Absolut** ({@link isAbsoluteAttachmentPath}).
 *  4. **Kein Doppelpunkt im Namen** ({@link hasPathStreamSeparator}, A-A-28).
 *     **Nach** Schritt 3, damit `C:datei.pdf` den Grund bekommt, der ihm
 *     zusteht. **Vor** Schritt 5, weil ein Name mit Doppelpunkt keine
 *     beurteilbare Endung mehr hat.
 *  5. **Keine Umleitungsendung** ({@link INDIRECT_EXTENSIONS}, A-A-5).
 *
 * Der sechste Schritt der Hülle — **vorhanden** — fehlt hier, und zwar
 * absichtlich: Die Domäne kennt kein Dateisystem.
 *
 * Diese Tür ist der **zweite** Riegel; die tragende Kontrolle bleibt
 * `check_file`, weil zwischen Eingabe und Öffnen der Bestand liegt (VG-1,
 * VG-3). Die lange Fassung dieses Satzes steht bei
 * {@link hasPathStreamSeparator}, und sie gilt für jeden Schritt hier.
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

// ---------------------------------------------------------------------------
// Bild — erkannt an der Kopfsignatur (A-A-16)
// ---------------------------------------------------------------------------

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
 * Welche Bildart die **Kopfsignatur** ansagt — oder `null` (A-A-16).
 *
 * ---------------------------------------------------------------------------
 * Was hier ausdrücklich **nicht** zählt
 * ---------------------------------------------------------------------------
 *
 *  - **Die Endung.** Eine als `.png` benannte `.exe` ist der Regelfall und
 *    nicht die Ausnahme.
 *  - **Ein angegebener `content-type`.** Angegeben hat ihn der Aufrufer.
 *  - **`image/*` als Klasse.** Eine Klasse ist keine Positivliste.
 *
 * Was diese Funktion **nicht leistet**: Sie sagt nicht, daß die Datei
 * unbeschädigt ist. Eine gültige Signatur mit beschädigtem Rest kommt hier
 * durch und wird beim Anzeigen zu einem Bild, das nicht erscheint — das ist
 * dann A-19.15 („sagt das an Ort und Stelle") und kein Wurf.
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

// ---------------------------------------------------------------------------
// Beschriftung (A-19.12)
// ---------------------------------------------------------------------------

/**
 * Was an einem Anhang steht, wenn der Titel fehlt (A-19.12).
 *
 * „Nie eine leere Zeile" ist die eine Hälfte der Anforderung. Die andere hat
 * T-165 (Befund X-04) nachgereicht, und sie wiegt schwerer:
 *
 *   **Zwei verschiedene Anhänge tragen nie dieselbe Ersatzbeschriftung.**
 *
 * Der Grund steht nicht in A-19.12, sondern an den Knöpfen: Die Beschriftung
 * ist der zugängliche Name des Knopfes zum **Öffnen**, des Knopfes zum
 * **Entfernen** und der Rückfrage davor. Drei Ticketverweise ohne Titel auf
 * demselben Wirt — der Regelfall und nicht die Ausnahme — hießen bis T-168
 * dreimal `beispiel.example`. Wer die Liste mit einer Vorlesehilfe durchgeht,
 * hört dreimal dasselbe, und der zweite Knopf löscht. Das ist kein
 * Bedienkomfort, das ist ein Weg zum Datenverlust (SC 2.4.6).
 *
 * Warum diese Funktion in der **Domäne** liegt: Es gab sie zweimal — hier und
 * in `apps/web/src/lib/attachmentLabel.ts` —, und die beiden **antworteten
 * verschieden** (Befund O-CR). Nicht, weil der Aufgabenbereich des Add-ins
 * Anhänge zeigte: Er zeigt keine. A-19.19 und E-072 Punkt 1 schließen sie
 * strukturell aus, und das Wort `attachment` kommt in
 * `apps/outlook-addin/src/**` kein einziges Mal vor. Der Ort ist richtig, die
 * Begründung, die bis T-168 hier stand, war es nicht (T-165, Befund X-07).
 *
 * ---------------------------------------------------------------------------
 * Die Regel: der **ganze** Wert, gekürzt nur um das, was überall gleich lautet
 * ---------------------------------------------------------------------------
 *
 * | Art | ohne Titel | Beispiel |
 * |---|---|---|
 * | Verweis | Wirt (mit Port), Pfad, Abfrage, Fragment. `https://` fällt weg, `http://` bleibt stehen | `beispiel.example/tickets/4711` |
 * | Verweis, nur Wirt | ist der Pfad `/` und Abfrage und Fragment leer: der Wirt allein | `beispiel.example` |
 * | Datei | der Dateiname **zuerst**, danach der Ordner in Klammern | `rechnung.pdf (C:\Kunden\Meier\)` |
 * | Bild | der erzeugte Name der Kopie | `4a…c1.png` |
 *
 * **Warum beim Verweis der Pfad dazugehört.** Bis T-157 stand hier der Wirt
 * allein. Er erfüllt den Buchstaben von A-19.12 („etwas Lesbares aus der
 * Adresse") und verfehlt den Zweck: Ein Ticketsystem hat einen Wirt und
 * beliebig viele Tickets. Die zweite Zeile der Anhangkarte fängt das nicht
 * auf — sie trägt `truncate` wie die erste, und eine Vorlesehilfe liest den
 * **zugänglichen Namen**, nicht die Nachbarzeile.
 *
 * **Warum `http://` stehen bleibt.** Zwei Gründe, und beide sind gemessen.
 * Erstens ist die Kürzung sonst nicht umkehrbar: `http://a/b` und
 * `https://a/b` sind zwei verschiedene Anhänge und bekämen dieselbe
 * Beschriftung. Zweitens ist es die einzige Stelle vor dem Klick, an der eine
 * **Herabstufung** von `https` auf `http` zu sehen ist — bei einem Verweis
 * fragt Takt nicht zurück (A-A-7), die Liste ist die ganze Anzeige
 * (Bedrohungsmodell, Hinweis T-156-8). `https://` fällt weg, weil es an jedem
 * zweiten Anhang gleich lautet und nichts unterscheidet.
 *
 * **Warum beim Verweis der Port dazugehört.** `hostname` ließ ihn weg;
 * `beispiel.example:8443` und `beispiel.example` sind zwei Wirte.
 *
 * **Warum bei der Datei der Ordner dazugehört — und warum er hinter dem Namen
 * steht.** Zwei Kunden, zwei Ordner, in beiden eine `rechnung.pdf`: derselbe
 * Fall wie beim Wirt, nur unauffälliger. Der **Name** bleibt trotzdem vorn,
 * denn er ist das Unterscheidende, das beim Abschneiden der Zeile stehen
 * bleiben muss und das eine Vorlesehilfe zuerst ansagt. Der Ordner trägt
 * seinen Trenner am Ende: `C:\` ist die Wurzel, `C:` wäre etwas anderes, und
 * `a/` und `a\` sind zwei verschiedene Ordner.
 *
 * **Der volle Pfad in der Beschriftung ist keine neue Klasse Text.** Er steht
 * ohnehin in der zweiten Zeile und in der Rückfrage vor dem Öffnen (A-A-6),
 * und der Rückfallzweig dieser Funktion gibt seit jeher den vollen rohen Wert
 * zurück. Diese Funktion **maskiert nichts** — sie liefert fremden Text, und
 * die Anzeige führt ihn durch `visibleText` beziehungsweise `<Foreign>`
 * (E-063).
 *
 * ---------------------------------------------------------------------------
 * Wie weit die Zusage trägt
 * ---------------------------------------------------------------------------
 *
 * Sie gilt für die **Ersatz**beschriftung, also für Werte, die durch die Tür
 * gekommen sind: eine Adresse in Normalform (A-A-3), ein absoluter Pfad, ein
 * erzeugter Bildname (A-A-17). Für sie ist die Abbildung umkehrbar — aus der
 * Beschriftung lässt sich der Wert zurückrechnen, also können zwei Werte nicht
 * dieselbe Beschriftung ergeben:
 *
 *  - **Verweis:** ein Wirt enthält weder `/` noch `:` ohne Port, damit ist die
 *    Beschriftung mit `http://` genau die der `http`-Adressen; der Rest ist
 *    die Serialisierung selbst.
 *  - **Datei:** der Name enthält keinen Trenner, der Ordner endet auf einen —
 *    die Zerlegung ist damit eindeutig, und beide Teile stehen vollständig da.
 *  - **Bild:** der Name ist der Schlüssel der Kopie und je Datei einmalig.
 *
 * **Zwei Fälle sind ausdrücklich nicht eingeschlossen.** Erstens der Titel:
 * Nennt der Benutzer zwei Anhänge gleich, heißen sie gleich — das ist seine
 * Wahl, und Takt denkt sich daneben nichts aus. Zweitens die Rückfallzweige
 * für einen leeren oder nicht zerlegbaren Wert: Solche Werte entstehen nicht
 * an der Tür, sondern nur, wenn jemand an ihr vorbei in `todo_attachment`
 * schreibt (VG-1, VG-3). Dann ist die Beschriftung der rohe Wert, und das ist
 * die richtige Antwort — sie zeigt, was dasteht.
 *
 * Ein Titel aus lauter Leerzeichen zählt als **fehlend** — dieselbe Regel, die
 * `titleSchema` für den Todo-Titel durchsetzt (`length(trim(title)) > 0`).
 * Der Rückgabewert ist niemals leer: Der letzte Rückfall ist die Zeichenkette
 * selbst, und wenn auch die leer wäre, ein deutsches Wort.
 */
export function attachmentLabel(
  kind: AttachmentKind,
  title: string | null,
  target: string,
): string {
  const trimmed = title === null ? '' : title.trim();
  if (trimmed !== '') return trimmed;

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
