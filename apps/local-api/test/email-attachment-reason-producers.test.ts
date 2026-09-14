/**
 * Takt — T-312 (unit-tester), die "Gelegenheit" aus der Aufgabe zu T-312:
 * "Er soll rot werden, wenn jemand irgendeinen Grund zurückholt, der keinen
 * Erzeuger hat. Eine Liste mit acht [neun] Namen zu prüfen ist weniger wert,
 * als die Regel dahinter zu prüfen."
 *
 * ===========================================================================
 * Warum diese Datei hier liegt und nicht bei der Domäne
 * ===========================================================================
 *
 * `packages/domain/test/email-attachment.test.ts` prüft die geschlossene
 * Menge selbst (neun Gründe, `connection`/`mailbox_closed` unerreichbar) —
 * aber OHNE den Quelltext von `apps/outlook-addin`, `apps/local-api` und
 * `apps/web` zu lesen: Die Domäne bekommt ausdrücklich **keine**
 * Umgebungstypen (`packages/domain/tsconfig.json`: `"types": []"`), und
 * `node:fs` ist dort nicht einmal benennbar (E-001 hängt am Übersetzer, nicht
 * an Disziplin). Diese Messung braucht `node:fs`, also liegt sie hier — der
 * lokale Dienst darf `node:*` sehen (`apps/local-api/tsconfig.json`).
 *
 * ===========================================================================
 * Was hier gemessen wird, und warum das mehr ist als die Namensliste
 * ===========================================================================
 *
 * Für jeden Wert aus {@link EMAIL_ATTACHMENT_FAILURE_REASONS} (`packages/domain`)
 * wird der ganze Bestand unter `apps/outlook-addin/src`, `apps/local-api/src`,
 * `packages/domain/src` und `apps/web/src` danach durchsucht, ob irgendeine
 * Stelle ihn tatsächlich als `reason: '<wert>'` **erzeugt** — nicht nur als
 * Schlüssel einer Aufzählung nennt ({@link EMAIL_ATTACHMENT_FAILURE_PRESENCE}
 * selbst fiele sonst als sein eigener Erzeuger durch, und genau das soll
 * dieser Prüffall nicht zulassen).
 *
 * Die Regel, die geprüft wird, ist zweiseitig:
 *
 *  1. **Jeder erreichbare Grund hat mindestens einen Erzeuger.** Käme morgen
 *     ein zehnter Grund in die Domäne, ohne daß ihn irgendwo eine Stelle
 *     zurückgibt, wird dieser Fall hier rot — nicht weil eine Liste von neun
 *     auf zehn wüchse (die steht nirgends hartkodiert in diesem Block), sondern
 *     weil ein Grund ohne Erzeuger dasselbe Problem ist wie `connection` vor
 *     T-309: eine Aussage über einen Zustand, der nicht eintreten kann.
 *  2. **Ein gestrichener Grund hat KEINEN Erzeuger mehr.** `connection` und
 *     `mailbox_closed` werden namentlich gegengeprüft: Käme irgendwo im
 *     Bestand künftig wieder ein `reason: 'connection'` zustande — etwa weil
 *     jemand den alten Zustand versehentlich zurückholt —, wird DIESER Fall
 *     hier rot, unabhängig davon, ob die Domäne den Wert (wieder) kennt.
 *
 * Vor T-309 war `connection` in der Domäne erreichbar, aber `admitProducer`
 * hätte für ihn **keine** Stelle gefunden — genau der Zustand, den T-309 als
 * Befund gemeldet hat ("gemessen, nicht gelesen"). Dieser Prüffall macht die
 * Messung dauerhaft, statt sie nur einmalig im Bericht stehen zu lassen.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  EMAIL_ATTACHMENT_FAILURE_PRESENCE,
  EMAIL_ATTACHMENT_FAILURE_REASONS,
} from '@takt/domain';

/**
 * Die Verzeichnisse, über die auch T-309 gemessen hat (Bericht Abschnitt 3).
 * Relativ zum Wurzelverzeichnis des Bestands, nicht zu dieser Datei —
 * `apps/local-api/test/…` liegt zwei Ebenen darunter.
 */
const REPO_ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..', '..');
const PRODUCER_SEARCH_ROOTS = [
  'apps/outlook-addin/src',
  'apps/local-api/src',
  'packages/domain/src',
  'apps/web/src',
];

/** Alle `.ts`/`.tsx`-Dateien unter `root`, `node_modules` und Punktordner übergangen. */
function collectSourceFiles(root: string): string[] {
  const files: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) continue;
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      // Ein Verzeichnis, das es (noch) nicht gibt, trägt einfach nichts bei.
      continue;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(full);
      }
    }
  }
  return files;
}

/**
 * Jeder Wert, der irgendwo unter {@link PRODUCER_SEARCH_ROOTS} als
 * `reason: '<wert>'` zurückgegeben wird — die Bauart, in der jede gemessene
 * Stelle (`collect.ts`, `plan.ts`, `email-attachments.ts`,
 * `admitEmailAttachment`, …) einen Grund tatsächlich erzeugt. Eine bloße
 * Nennung als Schlüssel (`too_large: true` in
 * {@link EMAIL_ATTACHMENT_FAILURE_PRESENCE}) zählt bewußt NICHT mit: Das wäre
 * die Liste, die sich selbst bestätigt.
 */
function collectProducedReasons(): ReadonlySet<string> {
  const found = new Set<string>();
  const pattern = /reason:\s*'([a-z0-9_]+)'/g;
  for (const relativeRoot of PRODUCER_SEARCH_ROOTS) {
    for (const file of collectSourceFiles(join(REPO_ROOT, ...relativeRoot.split('/')))) {
      const content = readFileSync(file, 'utf-8');
      for (const match of content.matchAll(pattern)) {
        const value = match[1];
        if (value !== undefined) found.add(value);
      }
    }
  }
  return found;
}

describe('EmailAttachmentFailureReason — geschlossene Menge MIT Erzeuger, nicht nur eine Liste (T-301, T-309, T-312)', () => {
  const producedReasons = collectProducedReasons();

  it('die Messung selbst findet etwas — sonst wäre jede weitere Zusicherung eine leere Messung', () => {
    // Gegenprobe zur Gegenprobe: Fände dieser Lauf nichts, wären die
    // folgenden `toBe(true)`-Zusicherungen aus Zufall grün, nicht aus Befund.
    expect(producedReasons.size).toBeGreaterThan(0);
  });

  it.each(EMAIL_ATTACHMENT_FAILURE_REASONS)(
    '"%s" ist in der Domäne erreichbar UND hat einen ECHTEN Erzeuger im Bestand',
    (reason) => {
      expect(Object.hasOwn(EMAIL_ATTACHMENT_FAILURE_PRESENCE, reason)).toBe(true);
      // Die eigentliche Regel: Ein Grund, der nicht eintreten kann, ist ein
      // Satz, der das Gegenteil des Bestands behauptet — unabhängig davon,
      // wie viele Gründe die Domäne gerade führt.
      expect(producedReasons.has(reason)).toBe(true);
    },
  );

  it.each(['connection', 'mailbox_closed'])(
    '"%s" ist NIRGENDS im Bestand ein Erzeuger — auch dann nicht, wenn die Domäne ihn nicht mehr kennt (E-109, T-301, T-309)',
    (removed) => {
      expect(Object.hasOwn(EMAIL_ATTACHMENT_FAILURE_PRESENCE, removed)).toBe(false);
      expect(EMAIL_ATTACHMENT_FAILURE_REASONS).not.toContain(removed);
      // Die schärfere Hälfte: Würde irgendwo im Bestand künftig wieder ein
      // `reason: 'connection'` oder `reason: 'mailbox_closed'` entstehen,
      // wird DIESER Fall hier rot — unabhängig von der Domäne.
      expect(producedReasons.has(removed)).toBe(false);
    },
  );
});
