/**
 * Takt — so viel DER, wie ein einziges Zertifikat braucht (E-046).
 *
 * ===========================================================================
 * Warum diese Datei überhaupt existiert
 * ===========================================================================
 *
 * Ein Office-Add-in lädt seinen Aufgabenbereich **ausschließlich über HTTPS**.
 * Takt liefert ihn lokal aus (E-001), also braucht es ein Zertifikat für
 * `localhost`, und das muss beim ersten Start entstehen — beim Kunden, ohne
 * Netz, ohne Werkzeugkette.
 *
 * `node:crypto` kann Schlüsselpaare erzeugen und signieren, aber **kein**
 * X.509-Zertifikat schreiben. Die üblichen Wege scheiden aus:
 *
 *  - `openssl` aufrufen: Auf einem Windows-Arbeitsplatz ist es nicht
 *    verlässlich vorhanden, und ein Fremdprozess im Startpfad des Dienstes ist
 *    eine Angriffsfläche, die es sonst nicht gäbe.
 *  - `node-forge`, `selfsigned`, `office-addin-dev-certs`: je ein weiteres
 *    Paket in der Lieferkette einer Anwendung, die Kundendaten hält
 *    (pnpm-workspace.yaml). Für ein paar hundert Zeilen Struktur ist das ein
 *    schlechter Tausch.
 *
 * Also wird die Struktur ausgeschrieben. Sie ist klein, sie ändert sich nie,
 * und sie ist gegen `crypto.X509Certificate` **nachprüfbar** — der Prüfpfad
 * liest das erzeugte Zertifikat mit Node wieder ein und vergleicht Namen,
 * Laufzeit und alternative Namen.
 *
 * Kodiert wird nur, was gebraucht wird: DER, definite length, keine
 * Auswertung. Diese Datei liest **nichts** — sie schreibt. Ein DER-Leser wäre
 * die gefährliche Hälfte, und die gibt es hier nicht.
 */

/** DER-Kennungen, so weit sie vorkommen. */
const TAG = {
  boolean: 0x01,
  integer: 0x02,
  bitString: 0x03,
  octetString: 0x04,
  null: 0x05,
  oid: 0x06,
  utf8String: 0x0c,
  sequence: 0x30,
  set: 0x31,
  printableString: 0x13,
  utcTime: 0x17,
} as const;

/**
 * Länge in DER: kurze Form bis 127, sonst lange Form mit Längenpräfix.
 *
 * Der Fall über 127 tritt bei jedem Zertifikat ein (allein der öffentliche
 * Schlüssel ist größer), also ist die lange Form kein Sonderfall, sondern der
 * Normalfall.
 */
function length(size: number): Buffer {
  if (size < 0x80) return Buffer.from([size]);

  const bytes: number[] = [];
  let rest = size;
  while (rest > 0) {
    bytes.unshift(rest & 0xff);
    rest = Math.floor(rest / 256);
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function tagged(tag: number, content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), length(content.byteLength), content]);
}

export function sequence(...parts: readonly Buffer[]): Buffer {
  return tagged(TAG.sequence, Buffer.concat([...parts]));
}

export function set(...parts: readonly Buffer[]): Buffer {
  return tagged(TAG.set, Buffer.concat([...parts]));
}

/**
 * INTEGER. Ist das oberste Bit gesetzt, kommt ein führendes `0x00` davor —
 * sonst läse ein Empfänger die Zahl als negativ. Bei einer zufälligen
 * Seriennummer trifft das jedes zweite Mal zu.
 */
export function integer(value: Buffer | number): Buffer {
  if (typeof value === 'number') {
    return tagged(TAG.integer, Buffer.from([value]));
  }
  const trimmed = trimLeadingZeros(value);
  const first = trimmed[0] ?? 0;
  return tagged(TAG.integer, (first & 0x80) === 0 ? trimmed : Buffer.concat([Buffer.from([0]), trimmed]));
}

function trimLeadingZeros(value: Buffer): Buffer {
  let index = 0;
  while (index < value.byteLength - 1 && value[index] === 0) index += 1;
  return value.subarray(index);
}

export function nullValue(): Buffer {
  return Buffer.from([TAG.null, 0x00]);
}

export function boolean(value: boolean): Buffer {
  // DER kennt für `true` genau eine Darstellung: 0xFF. `0x01` wäre BER und
  // würde von strengen Lesern abgelehnt.
  return tagged(TAG.boolean, Buffer.from([value ? 0xff : 0x00]));
}

export function utf8String(value: string): Buffer {
  return tagged(TAG.utf8String, Buffer.from(value, 'utf8'));
}

export function printableString(value: string): Buffer {
  return tagged(TAG.printableString, Buffer.from(value, 'ascii'));
}

export function octetString(content: Buffer): Buffer {
  return tagged(TAG.octetString, content);
}

/** BIT STRING mit null ungenutzten Bits am Ende — der einzige Fall hier. */
export function bitString(content: Buffer, unusedBits = 0): Buffer {
  return tagged(TAG.bitString, Buffer.concat([Buffer.from([unusedBits]), content]));
}

/**
 * OBJECT IDENTIFIER aus der Punktschreibweise.
 *
 * Die ersten beiden Bestandteile werden zu einem Byte zusammengefasst
 * (`40*a + b`), alle weiteren als base-128 mit gesetztem Fortsetzungsbit.
 */
export function oid(dotted: string): Buffer {
  const parts = dotted.split('.').map((part) => Number.parseInt(part, 10));
  const first = parts[0] ?? 0;
  const second = parts[1] ?? 0;

  const bytes: number[] = [first * 40 + second];
  for (const part of parts.slice(2)) {
    const chunk: number[] = [part & 0x7f];
    let rest = part >>> 7;
    while (rest > 0) {
      chunk.unshift((rest & 0x7f) | 0x80);
      rest >>>= 7;
    }
    bytes.push(...chunk);
  }

  return tagged(TAG.oid, Buffer.from(bytes));
}

/**
 * UTCTime `YYMMDDHHMMSSZ`.
 *
 * Gültig bis 2049; danach verlangt X.509 GeneralizedTime. Das Zertifikat läuft
 * nach gut zwei Jahren ab und wird dann neu erzeugt — die Grenze ist also
 * keine, die dieses Programm je erreicht. Sie steht trotzdem hier, damit
 * jemand, der die Laufzeit heraufsetzt, weiß, wo es bricht.
 */
export function utcTime(date: Date): Buffer {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const text =
    pad(date.getUTCFullYear() % 100) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z';
  return tagged(TAG.utcTime, Buffer.from(text, 'ascii'));
}

/** `[n] EXPLICIT` — der Inhalt bleibt vollständig, mit eigener Kennung. */
export function explicit(number: number, content: Buffer): Buffer {
  return tagged(0xa0 | number, content);
}

/** `[n] IMPLICIT` für einen primitiven Inhalt, etwa einen Namen im SAN. */
export function implicitPrimitive(number: number, content: Buffer): Buffer {
  return tagged(0x80 | number, content);
}

/** Roher DER-Block, der schon fertig vorliegt (etwa ein SPKI aus `node:crypto`). */
export function raw(content: Buffer): Buffer {
  return content;
}

/** DER in PEM. Zeilen zu 64 Zeichen, wie es jeder Leser erwartet. */
export function toPem(der: Buffer, label: string): string {
  const body = der.toString('base64').replace(/(.{64})/g, '$1\n');
  return `-----BEGIN ${label}-----\n${body}${body.endsWith('\n') ? '' : '\n'}-----END ${label}-----\n`;
}
