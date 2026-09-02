/**
 * Takt — Quellbild für die Anwendungssymbole.
 *
 * Erzeugt `icons/quelle.png` (1024×1024) aus den Design-Token, damit das Symbol
 * dieselbe Akzentfarbe trägt wie die Oberfläche (`--accent-bg`, `#2159da`) und
 * nicht irgendein Blau. Aus dieser Datei macht `pnpm exec tauri icon` die
 * Plattformformate (`.ico`, `.icns`, alle PNG-Größen).
 *
 * Das Zeichen ist ein Taktstrich: eine senkrechte Linie mit zwei waagerechten
 * Marken — dieselbe Idee wie der Name. Ein aufwendigeres Symbol wäre eine
 * Gestaltungsfrage und keine Aufgabe der Hülle; wenn der Auftraggeber eines
 * hat, ersetzt er `icons/quelle.png` und ruft `tauri icon` erneut auf.
 *
 * Warum von Hand und nicht mit einer Bibliothek: Ein PNG ist vier Abschnitte
 * und eine zlib-Kompression. Dafür eine Abhängigkeit in die Lieferkette zu
 * holen, die niemand sonst braucht, wäre der schlechtere Handel.
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(resolve(here, '..'), 'icons', 'quelle.png');

const SIZE = 1024;
/** `--accent-bg` aus packages/ui-tokens/tokens.css. */
const ACCENT = [0x21, 0x59, 0xda];
/** `--text-on-accent`. */
const ON_ACCENT = [0xff, 0xff, 0xff];

const pixels = Buffer.alloc(SIZE * (SIZE * 4 + 1));

/** Abgerundetes Quadrat, wie es die Plattformen ohnehin erwarten. */
const radius = SIZE * 0.22;

function insideRoundedSquare(x, y) {
  const inset = SIZE * 0.06;
  const left = inset;
  const right = SIZE - inset;
  const top = inset;
  const bottom = SIZE - inset;
  if (x < left || x > right || y < top || y > bottom) {
    return false;
  }
  const cx = Math.min(Math.max(x, left + radius), right - radius);
  const cy = Math.min(Math.max(y, top + radius), bottom - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2 || (x >= left + radius && x <= right - radius) || (y >= top + radius && y <= bottom - radius);
}

/** Der Taktstrich: ein senkrechter Balken, zwei waagerechte Marken. */
function insideGlyph(x, y) {
  const stemWidth = SIZE * 0.1;
  const stemX = SIZE * 0.5 - stemWidth / 2;
  if (x >= stemX && x <= stemX + stemWidth && y >= SIZE * 0.26 && y <= SIZE * 0.74) {
    return true;
  }
  const markWidth = SIZE * 0.3;
  const markHeight = SIZE * 0.085;
  const marks = [SIZE * 0.26, SIZE * 0.655];
  for (const markY of marks) {
    if (
      x >= SIZE * 0.5 - markWidth / 2 &&
      x <= SIZE * 0.5 + markWidth / 2 &&
      y >= markY &&
      y <= markY + markHeight
    ) {
      return true;
    }
  }
  return false;
}

for (let y = 0; y < SIZE; y += 1) {
  const rowStart = y * (SIZE * 4 + 1);
  pixels[rowStart] = 0; // Filtertyp „keiner"
  for (let x = 0; x < SIZE; x += 1) {
    const at = rowStart + 1 + x * 4;
    if (!insideRoundedSquare(x + 0.5, y + 0.5)) {
      pixels[at + 3] = 0;
      continue;
    }
    const color = insideGlyph(x + 0.5, y + 0.5) ? ON_ACCENT : ACCENT;
    pixels[at] = color[0];
    pixels[at + 1] = color[1];
    pixels[at + 2] = color[2];
    pixels[at + 3] = 255;
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // Bittiefe
ihdr[9] = 6; // Farbtyp RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(pixels, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, png);
process.stdout.write(`${outFile} (${SIZE}×${SIZE}, ${Math.round(png.length / 1024)} KiB)\n`);
