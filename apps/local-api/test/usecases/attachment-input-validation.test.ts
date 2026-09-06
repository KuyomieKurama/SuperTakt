/**
 * Takt — T-160 (unit-tester), O-CK: die "Tür"-Hälfte von TP-ANH-15 bis
 * TP-ANH-20 (`docs/testplan.md` Abschnitt 25.3, Zusammenfassungstabelle;
 * `T-154-spec-ux-reviewer.md` V-01, Abschnitt 1.2).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Datei fehlte
 * ---------------------------------------------------------------------------
 *
 * `apps/local-api/src/usecases/attachments.ts` hatte keinen einzigen Prüffall
 * unter `apps/local-api/test/**`. Die Fachregeln selbst — `checkAttachmentPath`,
 * `normalizeAttachmentLink`, `isUncPath` — sind in
 * `packages/domain/test/attachment.test.ts` bereits gründlich geprüft; was dort
 * fehlt, ist die **Verdrahtung**: Ruft `addAttachment` diese Regeln tatsächlich
 * auf und übersetzt ihr Ergebnis in den richtigen `TaktError` — bevor
 * überhaupt eine Transaktion beginnt?
 *
 * Der Testplan verlangt für TP-ANH-15 bis -18 ausdrücklich **zwei** Ebenen:
 * "einmal an der Eingabetür … und einmal erneut im Öffnen-Befehl selbst"
 * (25.3). Die zweite Ebene (Rust, `check_link`/`check_file`) steht seit T-160
 * in `attachment.rs`. Diese Datei ist die erste: die Tür.
 *
 * ---------------------------------------------------------------------------
 * Warum ein derart schmaler `AppContext` genügt
 * ---------------------------------------------------------------------------
 *
 * `addAttachment` liest `now(context)` (also `context.clock.now()`) **vor**
 * der Verzweigung nach Art — und lehnt eine unzulässige Adresse oder einen
 * unzulässigen Pfad ab, **bevor** `context.transactions` je berührt wird
 * (Kopfkommentar der Funktion: "Rein, und deshalb vor jeder Transaktion").
 * Für die Ablehnungsfälle unten reicht deshalb eine Attrappe, die nur die Uhr
 * trägt — jeder Zugriff auf `transactions`, `attachmentBlobs` & Co. wäre ein
 * Fehler in der Produktivfunktion und ließe den Fall mit einer echten
 * Ausnahme (statt einem `TaktError`-Wert) durchfallen.
 */
import { describe, expect, it } from 'vitest';
import type { Timestamp, TodoId } from '@takt/domain';

import { addAttachment, type AddAttachmentInput } from '../../src/usecases/attachments.ts';
import type { AppContext } from '../../src/usecases/context.ts';

const todoId = (value: string) => value as unknown as TodoId;
const timestamp = (value: string) => value as unknown as Timestamp;

const TODO_ID = todoId('todo-1');
const NOW = timestamp('2026-09-05T09:00:00Z');

/**
 * Nur die Uhr — mehr darf `addAttachment` für einen abgelehnten Anhang nicht
 * anfassen (siehe Dateikopf). Ein Zugriff auf ein anderes Feld wirft eine
 * `TypeError`, und genau das lässt den betroffenen Fall auffliegen, statt
 * ihn stillschweigend als „ok" durchzulassen.
 */
const nurDieUhr = { clock: { now: () => NOW } } as unknown as AppContext;

async function reject(input: AddAttachmentInput) {
  const result = await addAttachment(nurDieUhr, TODO_ID, input);
  expect(result.ok, `sollte abgelehnt werden: ${JSON.stringify(input)}`).toBe(false);
  if (result.ok) throw new Error('unreachable');
  return result.error;
}

describe('addAttachment — die Türprüfung für Verweise (TP-ANH-15 bis -17, R-22)', () => {
  it('TP-ANH-15: javascript: wird abgelehnt, mit der Meldung "nur http/https"', async () => {
    const error = await reject({ kind: 'link', title: null, url: 'javascript:alert(1)' });
    expect(error.code).toBe('validation_error');
    expect(error.message).toBe('Als Verweis sind ausschließlich http- und https-Adressen zulässig.');
    // Der abgewiesene Wert steht in keiner Meldung (A-A-8/B-2.4).
    expect(error.message).not.toContain('javascript');
  });

  it('TP-ANH-16: file:/// wird abgelehnt — kein Schema außer http/https', async () => {
    const error = await reject({ kind: 'link', title: null, url: 'file:///etc/passwd' });
    expect(error.code).toBe('validation_error');
    expect(error.message).toBe('Als Verweis sind ausschließlich http- und https-Adressen zulässig.');
  });

  it('TP-ANH-17: ein UNC-Pfad als "Adresse" wird abgelehnt und NICHT stillschweigend durchgereicht', async () => {
    const error = await reject({ kind: 'link', title: null, url: '\\\\server\\freigabe' });
    expect(error.code).toBe('validation_error');
    // Dieselbe benannte Meldung wie bei jedem anderen abgelehnten Schema —
    // der UNC-Pfad bekommt keine eigene, gesondert lesbare Fehlermeldung,
    // aber er wird eindeutig als Verweisfehler erkannt und nicht als "ok"
    // durchgereicht.
    expect(error.message).toBe('Als Verweis sind ausschließlich http- und https-Adressen zulässig.');
  });

  it('ein gültiger http-Verweis wird NICHT an der Tür abgelehnt (Gegenprobe)', async () => {
    // Gegenprobe zu den drei Fällen oben: Ohne sie könnten alle drei Tests
    // grün sein, weil addAttachment grundsätzlich jeden Verweis ablehnt.
    //
    // "nurDieUhr" trägt keine Transaktion — ein gültiger Wert läuft deshalb
    // bis zu `context.transactions.inTransaction(...)` in `insert()` und
    // scheitert DORT an der fehlenden Attrappe (TypeError, keine Ablehnung
    // durch die Formprüfung). Das unterscheidet "an der Adresse abgelehnt"
    // (die drei Fälle oben, saubere `err(...)`-Werte) von "kommt weiter bis
    // zur Transaktion" (dieser Fall, ein Wurf) — nur Ersteres ist ein
    // `TaktError`, Letzteres ein Programmierfehler in der Attrappe.
    await expect(
      addAttachment(nurDieUhr, TODO_ID, { kind: 'link', title: null, url: 'https://example.org/' }),
    ).rejects.toThrow();
  });
});

describe('addAttachment — die Türprüfung für Dateipfade (TP-ANH-18 bis -20, R-21)', () => {
  it('TP-ANH-18: ein UNC-Pfad als Datei wird abgelehnt, mit einer eigenen, benannten Meldung', async () => {
    const error = await reject({
      kind: 'file',
      title: null,
      path: '\\\\server\\freigabe\\datei.txt',
    });
    expect(error.code).toBe('validation_error');
    // path_unc bekommt PATH_MESSAGE, nicht INDIRECT_MESSAGE — beide sind
    // "benannt" (E-072 Punkt 2 fordert das ausdrücklich), aber es sind zwei
    // verschiedene Sätze, und dieser Fall darf nicht in den falschen fallen.
    expect(error.message).toBe(
      'Als Datei ist ein vorhandener absoluter Pfad zulässig. Netzwerkpfade sind es nicht.',
    );
  });

  it('TP-ANH-20: eine .lnk-Endung wird BEIM ANLEGEN abgelehnt — mit der Umleitungs-Meldung', async () => {
    const error = await reject({
      kind: 'file',
      title: null,
      path: '/home/nutzer/verknuepfung.lnk',
    });
    expect(error.code).toBe('validation_error');
    expect(error.message).toContain('Verknüpfungen');
    expect(error.message).toContain('.lnk');
    // Und ausdrücklich NICHT die allgemeine Pfad-Meldung — sonst könnte man
    // an der Antwort nicht unterscheiden, ob ein Pfad wegen UNC oder wegen
    // einer Umleitungsendung abgewiesen wurde (T-154 Abschnitt 1.2).
    expect(error.message).not.toBe(
      'Als Datei ist ein vorhandener absoluter Pfad zulässig. Netzwerkpfade sind es nicht.',
    );
  });

  it('TP-ANH-19: eine .bat-Endung wird an der Tür NICHT abgelehnt — es gibt keine Verbotsliste für ausführbare Dateien (A-A-5)', async () => {
    // Anders als bei .lnk kommt .bat durch checkAttachmentPath durch; die
    // Absicherung ist die Rückfrage der Oberfläche vor dem Öffnen, nicht die
    // Tür. Ein absoluter, nicht existierender Pfad genügt hier, weil
    // checkAttachmentPath keine Existenzprüfung vornimmt (dokumentiert in
    // packages/domain/src/attachment.ts).
    //
    // Dieselbe Gegenprobe wie beim Verweis oben: "nurDieUhr" trägt keine
    // Transaktion, also zeigt ein Wurf (statt eines sauberen `err(...)`),
    // dass die Formprüfung .bat NICHT abgelehnt hat, sondern bis zur
    // Transaktion durchgelassen wurde.
    await expect(
      addAttachment(nurDieUhr, TODO_ID, { kind: 'file', title: null, path: '/home/nutzer/starte.bat' }),
    ).rejects.toThrow();
  });
});
