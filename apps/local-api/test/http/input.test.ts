/**
 * Takt — T-105, H-2: `titleSchema`/`nameSchema` weisen Steuer- und
 * Richtungszeichen ab (`apps/local-api/src/http/input.ts`, Auftrag aus
 * `reports/T-101-domain-dev.md` "Nächster Schritt" 2 / R-3a H-2).
 *
 * ---------------------------------------------------------------------------
 * Umgebaut in T-131 — eine Gleichheitsprüfung statt einer dritten Randtabelle
 * ---------------------------------------------------------------------------
 *
 * Bis hierher stand die VOLLSTÄNDIGE Randtabelle der Zeichenklasse von Hand
 * in dieser Datei — eine von drei unabhängig geschriebenen Abschriften
 * derselben Grenzen (dieselbe Tabelle auch in
 * `apps/outlook-addin/test/text/hidden.test.ts` und seit T-127 an der Quelle
 * selbst, `packages/domain/test/characters.test.ts`). Das ist dasselbe
 * Muster, das die T-117/T-119-Regression im Produktivcode möglich gemacht
 * hat, nur eine Ebene tiefer, in den Tests: Erweitert die Domäne die Klasse,
 * weiß diese Datei nichts davon, bis jemand die Abschrift von Hand
 * nachträgt — und bis dahin bleibt sie grün, weil sie den neuen Codepunkt
 * schlicht nie fragt (E-063 Punkt 5).
 *
 * Die Randtabelle — WELCHE Codepunkte verboten sind — gehört jetzt an EINE
 * Stelle: `packages/domain/test/characters.test.ts`. Was hier bleibt, ist
 * eine andere Frage: nicht "ist die Klasse richtig", sondern "wendet DIESE
 * Tür GENAU die Klasse der Domäne an, und keine eigene, angewachsene oder
 * veraltete Fassung" — die zod-Bindung (`withoutControlCharacters` in
 * `http/input.ts`). Das ist ein Verhalten und keine Abschrift: Die
 * Codepunkte, gegen die unten geprüft wird, stehen nicht von Hand hier,
 * sondern werden aus `FORBIDDEN_NAME_CHARACTERS`/`CONTROL_WHITESPACE`
 * (`@takt/domain`) zur LAUFZEIT abgeleitet — jeder Bereich, seine beiden
 * Grenzen und ihre unmittelbaren Nachbarn. Käme in der Domäne morgen ein
 * vierter Bereich dazu (wie die drei Marken mit T-117), stünde er automatisch
 * in der Liste unten, ohne dass diese Datei angefasst werden müsste — und
 * `titleSchema` würde sofort daran gemessen, nicht erst, wenn jemand die
 * Abschrift nachträgt.
 *
 * Umlaute, Emoji und Leerzeichen INNERHALB des Namens sind ausdrücklich NICHT
 * Teil der Klasse (Kopfkommentar der Quelldatei: "Leerzeichen und Tabulator
 * sind zwei verschiedene Fälle"). Keine echten Call-Nummern, Kundennamen oder
 * Zugangsdaten — alle Namen unten sind erfunden.
 */
import { CONTROL_WHITESPACE, FORBIDDEN_NAME_CHARACTERS, isForbiddenNameCharacter } from '@takt/domain';
import { describe, expect, it } from 'vitest';
import { nameSchema, titleSchema } from '../../src/http/input.ts';

const CONTROL_MESSAGE = 'Steuerzeichen und Richtungszeichen sind in einem Namen nicht erlaubt.';

/**
 * Randwerte, aus der Domäne ABGELEITET statt von Hand abgeschrieben (T-131):
 * für jeden Bereich aus {@link FORBIDDEN_NAME_CHARACTERS} und aus
 * {@link CONTROL_WHITESPACE} beide Grenzen und ihre beiden unmittelbaren
 * Nachbarn. Das ist keine zweite Randtabelle — es ist dieselbe Tabelle,
 * gelesen statt getippt.
 */
function boundaryCodePoints(): readonly number[] {
  const codePoints = new Set<number>();
  const note = (range: { readonly from: number; readonly to: number }) => {
    codePoints.add(range.from);
    codePoints.add(range.to);
    if (range.from > 0) codePoints.add(range.from - 1);
    if (range.to < 0x10ffff) codePoints.add(range.to + 1);
  };
  for (const range of FORBIDDEN_NAME_CHARACTERS) note(range);
  for (const range of CONTROL_WHITESPACE) note(range);
  return [...codePoints].sort((a, b) => a - b);
}

const codePointLabel = (codePoint: number): string =>
  `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;

const boundaryCases = boundaryCodePoints().map((codePoint) => ({
  codePoint,
  label: codePointLabel(codePoint),
  forbidden: isForbiddenNameCharacter(codePoint),
}));

describe('titleSchema / nameSchema — gültige Namen mit Umlauten, Emoji und Leerzeichen innen', () => {
  it('Umlaute, scharfes ß und ein Emoji mitten im Text sind erlaubt', () => {
    const value = 'Café Müller — Rückruf nötig 😀 Support';
    const result = titleSchema.safeParse(value);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(value);
  });

  it('mehrere Leerzeichen INNERHALB des Namens sind erlaubt (U+0020 ist nicht erfasst)', () => {
    const value = 'Ein   Name   mit   vielen   Leerzeichen';
    const result = titleSchema.safeParse(value);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(value);
  });

  it('führende und nachgestellte Leerzeichen werden getrimmt (kein Fehler, nur eine Umformung)', () => {
    const result = nameSchema.safeParse('  Ost  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('Ost');
  });
});

describe('titleSchema / nameSchema wenden GENAU die Zeichenklasse der Domäne an — die zod-Bindung, nicht die Klasse selbst (E-063 Punkt 5, T-131)', () => {
  it.each(boundaryCases)(
    '$label: titleSchema entscheidet wie isForbiddenNameCharacter aus @takt/domain (forbidden: $forbidden)',
    ({ codePoint, forbidden }) => {
      const value = `Vor${String.fromCodePoint(codePoint)}Nach`;
      const result = titleSchema.safeParse(value);
      expect(result.success).toBe(!forbidden);
    },
  );

  it.each(boundaryCases)(
    '$label: nameSchema entscheidet wie isForbiddenNameCharacter aus @takt/domain (forbidden: $forbidden)',
    ({ codePoint, forbidden }) => {
      const value = `Vor${String.fromCodePoint(codePoint)}Nach`;
      const result = nameSchema.safeParse(value);
      expect(result.success).toBe(!forbidden);
    },
  );

  it('ein Familien-Emoji (drei ZWJ), über mehrere Codepunkte hinweg, bleibt als Titel erlaubt — der Wächter richtet sich gegen Richtungszeichen, nicht gegen Emoji', () => {
    // Ein realistischer Anwendungsfall statt eines Einzelzeichens: Die Tabelle
    // oben bestätigt für U+200D (ZWJ) "erlaubt", aber erst diese ECHTE,
    // mehrteilige Zeichenfolge zeigt, dass ein zusammengesetztes Emoji als
    // Ganzes durchgeht und nicht in seine Bestandteile zerfällt oder
    // abgewiesen wird.
    const familyEmoji = '\u{1f468}\u200d\u{1f469}\u200d\u{1f467}\u200d\u{1f466}';
    const result = titleSchema.safeParse(`Familientermin ${familyEmoji}`);
    expect(result.success).toBe(true);
  });

  it('die abgeleitete Liste ist weder leer noch deckt sie jeden Codepunkt ab — sonst wäre jeder Vergleich oben sinnlos grün', () => {
    // Wächter gegen eine Klasse, die durch einen Programmierfehler leer würde
    // (jeder Vergleich oben bliebe grün, weil nie ein Zeichen abgewiesen
    // wird) oder alles erfasste (jeder Vergleich bliebe grün, weil jedes
    // Zeichen abgewiesen wird).
    expect(boundaryCases.some((entry) => entry.forbidden)).toBe(true);
    expect(boundaryCases.some((entry) => !entry.forbidden)).toBe(true);
  });
});

describe('titleSchema / nameSchema — die Fehlermeldung ist fest und nennt den abgewiesenen Wert NICHT (B-4.3 Punkt 5)', () => {
  it('die Meldung ist wortgleich, unabhängig davon, welches verbotene Zeichen den Fehler auslöst', () => {
    const withBell = titleSchema.safeParse('Vor\u0007Nach');
    const withRlo = titleSchema.safeParse('Vor\u202eNach');
    expect(withBell.success).toBe(false);
    expect(withRlo.success).toBe(false);
    if (withBell.success || withRlo.success) return;
    expect(withBell.error.issues[0]?.message).toBe(CONTROL_MESSAGE);
    expect(withRlo.error.issues[0]?.message).toBe(CONTROL_MESSAGE);
  });

  it('der abgewiesene Wert selbst steht in KEINER Meldung — weder das Steuerzeichen noch der umliegende Text', () => {
    const value = 'Vertraulicher Titel\u0007mit Steuerzeichen';
    const result = titleSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (result.success) return;
    const allMessages = result.error.issues.map((issue) => issue.message).join(' | ');
    expect(allMessages).not.toContain('Vertraulicher Titel');
    expect(allMessages).not.toContain('\u0007');
  });
});
