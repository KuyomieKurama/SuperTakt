/**
 * SuperTakt — was aus dieser E-Mail **werden soll**, bevor der Benutzer klickt
 * (A-19.23 bis A-19.30, Entwurf 2 und 4).
 *
 * ---------------------------------------------------------------------------
 * Die Leitlinie dieses Moduls
 * ---------------------------------------------------------------------------
 *
 * > Was ohne Kosten vorher feststeht, steht vorher da.
 *
 * Zahl, Name, Größe und Art jedes Anhangs, ob er eingebettet ist und ob er ein
 * Cloud-Verweis ist — all das gibt Office.js **synchron** her, ohne eine
 * einzige Netzanfrage. Es gibt deshalb keinen Grund, den Benutzer erst dreißig
 * Sekunden warten zu lassen und ihm danach zu sagen, was schon vor dem Klick
 * feststand (Entwurf 4.3).
 *
 * Was **nicht** vorher feststeht, behauptet dieser Plan auch nicht: die Größe
 * der E-Mail als Datei, ob eine einzelne Datei wirklich lesbar ist, und ob
 * der Nachbau gelingt. Das steht im Ergebnis.
 */

import { normalizeAttachmentLink } from '@takt/domain';

import { visibleText } from '../text/hidden.ts';
import type {
  AttachmentFact,
  MailCapabilities,
  SkipReason,
  TakeoverLimits,
} from './model.ts';
import { UNNAMED_DISPLAY_NAME } from './model.ts';

/**
 * Ein Eintrag der Vorschau — und zugleich der Arbeitsauftrag des Sammellaufs.
 *
 * Die Reihenfolge der Liste ist die Reihenfolge der Übernahme: die E-Mail
 * zuerst, dann die Dateianhänge in der Reihenfolge von Outlook.
 */
export type PlannedEntry =
  | {
      readonly kind: 'message';
      readonly displayName: string;
      /**
       * Was die Vorschau **erwartet** — nicht, was herauskommt.
       *
       * Ohne Mailbox 1.14 steht heute schon fest, dass es ein Nachbau wird.
       * Mit 1.14 kann der Abruf trotzdem fehlschlagen und in den Nachbau
       * fallen; dann sagt es das Ergebnis. Eine Vorschau, die irrt, ist etwas
       * anderes als eine, die lügt.
       */
      readonly expectRebuild: boolean;
    }
  | {
      readonly kind: 'file';
      readonly id: string;
      readonly displayName: string;
      readonly bytes: number;
    }
  | {
      readonly kind: 'link';
      readonly displayName: string;
      /** Die Normalform aus `normalizeAttachmentLink` (A-A-13). */
      readonly url: string;
    }
  | {
      readonly kind: 'skipped';
      readonly displayName: string;
      readonly reason: SkipReason;
      readonly bytes: number | null;
    };

export interface TakeoverPlan {
  readonly entries: readonly PlannedEntry[];
  /** Wie viele Anhänge daraus am Todo entstehen sollen. Die Zahl aus A-19.33. */
  readonly expected: number;
  /** Wie viele Dateien schon vor dem Klick feststehend ausfallen. */
  readonly skipped: number;
}

/** Der Anzeigename aus fremder Hand, sichtbar gemacht und nie am Ende gekürzt. */
const displayNameOf = (fact: AttachmentFact): string => {
  const visible = visibleText(fact.name).trim();
  return visible.length === 0 ? UNNAMED_DISPLAY_NAME : visible;
};

/**
 * Ein angehängtes Element (`item`) ist eine E-Mail oder ein Termin und bringt
 * laut Schnittstellenbeschreibung **keine Endung** im Namen mit.
 *
 * Die Endung entscheidet, womit die Datei geöffnet wird (A-19.23a), und sie
 * muss sichtbar sein (A-19.23b). Sie hier zu ergänzen ist kein Eingriff in
 * fremden Text: Sie stammt nicht aus der E-Mail, sondern aus der Art des
 * Anhangs, die Outlook selbst nennt.
 */
const withItemExtension = (name: string): string =>
  /\.(eml|ics)$/i.test(name) ? name : `${name}.eml`;

/**
 * Der Plan.
 *
 * Vier Regeln, die hier und nirgends sonst stehen:
 *
 *  1. **Eingebettete Bilder zählen nicht** (A-19.24). Kein Eintrag, keine
 *     Fußnote, keine Zahl — ein Signaturbild ist kein Anhang, und eine Zeile
 *     darüber wäre eine Erklärung für ein Nichtereignis.
 *  2. **Ein Cloud-Anhang wird ein Verweis** (A-19.25) — aber erst, nachdem
 *     `normalizeAttachmentLink` sein **zerlegtes** Schema gegen die
 *     Positivliste gehalten hat. Nicht „beginnt mit http": Eine Adresse aus
 *     fremder Hand, die an den Öffnen-Befehl der Hülle gerät, ist R-22, und
 *     ein Präfixvergleich hielte `http:/\böse` für keine Webadresse und
 *     verführte dazu, die Rohfassung zu speichern.
 *  3. **Grenzen gelten je Datei, über die Summe und über die Zahl** (A-A-81).
 *     Die Ankündigung entscheidet hier nur über das Überspringen **vor** dem
 *     Abruf; gezählt wird beim Lesen, und das geschieht im Sammellauf.
 *  4. **Die E-Mail steht immer im Plan** (A-19.27). Ohne Mailbox 1.14 als
 *     Nachbau, und das steht dabei.
 */
export const planTakeover = (
  facts: readonly AttachmentFact[],
  limits: TakeoverLimits,
  capabilities: MailCapabilities,
): TakeoverPlan => {
  const entries: PlannedEntry[] = [
    {
      kind: 'message',
      displayName: 'Die E-Mail selbst',
      expectRebuild: !capabilities.canReadMessageFile,
    },
  ];

  const relevant = facts.filter((fact) => !fact.isInline);
  let taken = 0;
  let announced = 0;

  for (const fact of relevant) {
    const isItem = fact.attachmentType === 'item';
    const displayName = isItem ? withItemExtension(displayNameOf(fact)) : displayNameOf(fact);

    if (fact.attachmentType === 'cloud') {
      const checked = normalizeAttachmentLink(fact.id);
      entries.push(
        checked.ok
          ? { kind: 'link', displayName, url: checked.url }
          : { kind: 'skipped', displayName, reason: 'not_a_web_address', bytes: null },
      );
      continue;
    }

    if (!capabilities.canReadAttachments) {
      entries.push({ kind: 'skipped', displayName, reason: 'outlook_too_old', bytes: fact.size });
      continue;
    }
    if (fact.size > limits.maxBytesPerFile) {
      entries.push({ kind: 'skipped', displayName, reason: 'too_large', bytes: fact.size });
      continue;
    }
    if (taken >= limits.maxCount) {
      entries.push({ kind: 'skipped', displayName, reason: 'too_many', bytes: fact.size });
      continue;
    }
    if (announced + fact.size > limits.maxBytesTotal) {
      entries.push({ kind: 'skipped', displayName, reason: 'total_too_large', bytes: fact.size });
      continue;
    }

    taken += 1;
    announced += fact.size;
    entries.push({ kind: 'file', id: fact.id, displayName, bytes: fact.size });
  }

  const skipped = entries.filter((entry) => entry.kind === 'skipped').length;
  return { entries, expected: entries.length - skipped, skipped };
};
