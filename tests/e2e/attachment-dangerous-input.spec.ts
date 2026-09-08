/**
 * TP-ANH-15 bis TP-ANH-18, TP-ANH-20 (docs/testplan.md, Abschnitt 25.3) —
 * T-150, R-21, R-22.
 *
 * Die Formprüfung an der Tür (`POST /todos/{id}/attachments`) — nicht die
 * Rückfrage und nicht der Öffnen-Befehl der Hülle: Dieser lässt sich unter
 * Linux ohne echten Tauri-Prozess nicht messen (T-B08, siehe Kopf von
 * Abschnitt 25.3 im Testplan) und braucht einen Rust-Einheitentest neben dem
 * Befehl (`#[cfg(test)]` in `attachment.rs`, Hoheit unit-tester — die 28
 * Zeichenketten aus Bedrohungsmodell 20.2 sind laut T-147-Bericht bereits
 * gegen `check_link`/`check_file` gemessen).
 *
 * Erwartet ist in jedem Fall **nicht** "es passiert nichts Schlimmes",
 * sondern eine **benannte Abweisung**: 422, mit einem Grund im Text, den ein
 * Mensch lesen kann.
 *
 * **TP-ANH-20 — Abweichung vom Plan aus T-142, gemessen statt vermutet.** Der
 * Plan nahm an, eine `.lnk`-Datei erreiche die Rückfrage vor dem Öffnen und
 * müsse dort abgefangen werden. Gebaut ist es strenger: `checkAttachmentPath`
 * (`packages/domain/src/attachment.ts`) weist die fünf Umleitungsendungen
 * (`.lnk`, `.url`, `.pif`, `.scf`, `.desktop`) bereits **beim Anlegen** ab —
 * ein Anhang mit einer solchen Endung kommt nie in den Bestand und erreicht
 * die Rückfrage aus TP-ANH-06/-19 nie (`Attachments.tsx`, Kopfkommentar:
 * "Die fünf Umleitungen … werden hart abgewiesen und erreichen diese
 * Rückfrage nie"). Dieser Fall prüft deshalb die tatsächliche, frühere
 * Abweisung an der Tür statt einer Rückfrage, die es für diesen Fall nicht
 * gibt.
 */
import { test, expect } from '@playwright/test';

import { attemptCreateAttachment, createTodo, deleteTodo } from './support/api';

test.describe('TP-ANH-15 bis TP-ANH-17 — ein Verweis, der keiner ist (R-22, E-072 Punkt 2)', () => {
  let todoId: string;

  test.beforeAll(async () => {
    const todo = await createTodo({ title: `E2E-ANH-GEFAHR-LINK-${Date.now()}` });
    todoId = todo.id;
  });

  test.afterAll(async () => {
    await deleteTodo(todoId);
  });

  test('TP-ANH-15 — javascript: wird mit 422 und benanntem Grund abgewiesen', async () => {
    const result = await attemptCreateAttachment(todoId, { kind: 'link', url: 'javascript:alert(1)' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.body.error?.code).toBe('validation_error');
      expect(result.body.error?.message ?? '').toContain('http');
      // Der abgewiesene Wert steht nicht in der Meldung (A-A-8-Grundsatz,
      // hier auf die Tür des Dienstes angewandt).
      expect(result.body.error?.message ?? '').not.toContain('javascript:alert');
    }
  });

  test('TP-ANH-16 — file:// wird mit derselben Meldung abgewiesen', async () => {
    const result = await attemptCreateAttachment(todoId, { kind: 'link', url: 'file:///etc/passwd' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.body.error?.message ?? '').toContain('http');
      expect(result.body.error?.message ?? '').not.toContain('/etc/passwd');
    }
  });

  test('TP-ANH-17 — ein UNC-Pfad als "Adresse" wird abgewiesen, nicht stillschweigend', async () => {
    const result = await attemptCreateAttachment(todoId, { kind: 'link', url: '\\\\server\\freigabe' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      // Dieselbe Meldung wie TP-ANH-15/-16 — sie nennt die Regel ("nur http
      // und https") statt eines unbenannten "ungültige Adresse". Das ist der
      // Unterschied, den A-19.11/R-22 verlangen: eine Regel, keine Störung.
      expect(result.body.error?.message ?? '').toContain('http');
      expect(result.body.error?.message ?? '').not.toContain('\\\\server');
    }
  });
});

test.describe('TP-ANH-18 — ein UNC-Pfad als Datei (R-21, E-072 Punkt 2)', () => {
  test('wird mit 422 abgewiesen, mit dem Hinweis auf einen Netzwerkpfad', async () => {
    const todo = await createTodo({ title: `E2E-ANH-GEFAHR-UNC-${Date.now()}` });
    const result = await attemptCreateAttachment(todo.id, {
      kind: 'file',
      path: '\\\\server\\freigabe\\datei.txt',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.body.error?.message ?? '').toContain('Netzwerkpfad');
      expect(result.body.error?.message ?? '').not.toContain('\\\\server');
    }
    await deleteTodo(todo.id);
  });

  test('dieselbe Abweisung für die zweite UNC-Schreibweise (//server/…)', async () => {
    const todo = await createTodo({ title: `E2E-ANH-GEFAHR-UNC2-${Date.now()}` });
    const result = await attemptCreateAttachment(todo.id, { kind: 'file', path: '//server/freigabe/datei.txt' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.body.error?.message ?? '').toContain('Netzwerkpfad');
    }
    await deleteTodo(todo.id);
  });
});

test.describe('TP-ANH-20 — eine Verknüpfung (.lnk) wird bereits beim Anlegen abgewiesen (angepasst, siehe Kopfkommentar)', () => {
  test('.lnk erreicht nie die Rückfrage — sie wird an der Tür mit 422 abgewiesen', async () => {
    const todo = await createTodo({ title: `E2E-ANH-GEFAHR-LNK-${Date.now()}` });
    const result = await attemptCreateAttachment(todo.id, {
      kind: 'file',
      path: '/home/beispiel/dokumente/verknuepfung.lnk',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.body.error?.message ?? '').toContain('Verknüpfung');
      // "Sie zeigen auf etwas anderes, als ihr Name sagt" — eine Regel, kein
      // unbenanntes "ungültig".
      expect(result.body.error?.message ?? '').toContain('anderes');
    }
    await deleteTodo(todo.id);
  });

  // Gegenprobe zum Fund oben: Die anderen vier Umleitungsendungen verhalten
  // sich gleich — keine Ausnahme für eine von ihnen (dieselbe Endungsliste,
  // `INDIRECT_EXTENSIONS`).
  for (const extension of ['url', 'pif', 'scf', 'desktop']) {
    test(`Gegenprobe — dieselbe Abweisung für .${extension}`, async () => {
      const todo = await createTodo({ title: `E2E-ANH-GEFAHR-${extension.toUpperCase()}-${Date.now()}` });
      const result = await attemptCreateAttachment(todo.id, {
        kind: 'file',
        path: `/home/beispiel/dokumente/datei.${extension}`,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(422);
        expect(result.body.error?.message ?? '').toContain('Verknüpfung');
      }
      await deleteTodo(todo.id);
    });
  }
});
