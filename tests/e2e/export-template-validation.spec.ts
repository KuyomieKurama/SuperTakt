/**
 * Feldnamen in Exportvorlagen: unzulässige oder doppelte ergeben 422
 * (T-046, T-048).
 *
 * `validateExportTemplateDefinition`/`validateExportTemplateField`
 * (`packages/export/src/template.ts`) weisen seit T-034/T-046 sowohl
 * gefährliche Feldnamen (`__proto__`, `constructor`, `prototype` —
 * `RESERVED_FIELD_NAMES`, unabhängig vom Zeichenmuster, TP-SEC-07) als auch
 * doppelte Feldnamen innerhalb derselben Vorlage ab, jeweils mit `422` und
 * dem Fehlerschlüssel `validation_error` bzw. `export_template_invalid`.
 * Geprüft wird hier über `POST /export/templates`, denselben Weg, den auch
 * der Vorlageneditor (S-14) beim Speichern nimmt.
 *
 * **Nachtrag T-052 — was "denselben Weg" hier tatsächlich heißt.** Alle drei
 * Fälle oben rufen `fetch` direkt auf `apps/local-api` auf; das prüft den
 * Dienst, nicht die Oberfläche — dieselbe Bauart, die in `tags-folders.spec.ts`
 * einen echten Fehler durchgelassen hat (siehe dort, Dateikopf). Für den
 * reservierten Feldnamen ist das hier folgenlos, aber aus einem Grund, den
 * man nachweisen muss statt zu vermuten: `apps/web/src/lib
 * /exportTemplateModel.ts#toDefinitionBody` baut den Rumpf mit denselben drei
 * Schlüsseln (`name`, `source`, `transformation`), und
 * `apps/web/src/api/endpoints.ts#createExportTemplate` sendet `{ name,
 * definition }` — beides mit dem Quelltext abgeglichen, nicht angenommen.
 * Für **doppelte** Namen gibt es zusätzlich eine rein clientseitige Prüfung
 * (`duplicateFieldNames`, `TemplatesScreen.tsx`), die ihre eigene Meldung vor
 * die Antwort des Dienstes stellt (`.tfield__error`-Zweig für `duplicate`) —
 * ein Testfall, der versucht, das über die Oberfläche zu erzwingen, prüfte
 * deshalb vor allem den Client, nicht den Dienst, und bliebe eine Zeile unter
 * den drei Fällen unten. Für den **reservierten** Namen (`__proto__`) gibt es
 * dagegen **keine** clientseitige Sperre — `saveBlocked` prüft nur auf einen
 * leeren Namen, nicht auf `RESERVED_FIELD_NAMES`. Ein Klick auf „Speichern“
 * geht deshalb tatsächlich zum Dienst durch, und die Zeilenzuordnung der
 * Antwort (`fieldIndexOfMessage`/`messageWithoutFieldPrefix`,
 * `TemplateFields.tsx`) bekommt hier ihren einzigen echten Ende-zu-Ende-Test:
 * Ein Bruch in dieser Verdrahtung — die Vorlage speichert trotzdem, oder die
 * Meldung landet an der falschen Zeile, oder gar nicht — wäre in den drei
 * API-Fällen oben unsichtbar geblieben.
 */
import { test, expect } from '@playwright/test';

import { API_BASE_URL, SESSION_SECRET, TOKEN_HEADER, WEB_BASE_URL } from './support/session';
import { gotoTemplates } from './support/nav';

async function attemptCreateTemplate(
  definition: unknown,
): Promise<{ readonly status: number; readonly body: { readonly error?: { readonly code?: string; readonly message?: string } } }> {
  const response = await fetch(`${API_BASE_URL}/export/templates`, {
    method: 'POST',
    headers: {
      Origin: WEB_BASE_URL,
      [TOKEN_HEADER]: SESSION_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: `E2E-TPL-${Date.now()}-${Math.random()}`, definition }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  };
  return { status: response.status, body };
}

test.describe('Exportvorlagen — unzulässige und doppelte Feldnamen (422)', () => {
  test('ein reservierter Feldname wird mit 422 abgewiesen, unabhängig vom Zeichenmuster', async () => {
    // `__proto__` besteht ausschließlich aus zulässigen Zeichen
    // (`FIELD_NAME_PATTERN` lässt es durch) — nur `RESERVED_FIELD_NAMES`
    // hält es auf (T-046-Befund am vorher irreführenden Kommentar).
    const result = await attemptCreateTemplate({
      version: 1,
      fields: [{ name: '__proto__', source: 'todo.callNumber', transformation: 'raw' }],
    });
    expect(result.status).toBe(422);
    expect(result.body.error?.code).toBe('validation_error');
  });

  test('zwei Felder mit demselben Namen in derselben Vorlage werden mit 422 abgewiesen', async () => {
    const result = await attemptCreateTemplate({
      version: 1,
      fields: [
        { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
        { name: 'Call', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
      ],
    });
    expect(result.status).toBe(422);
    expect(result.body.error?.code).toBe('export_template_invalid');
    expect(result.body.error?.message ?? '').toContain('mehrfach');
  });

  test('eine gültige, abweichende Vorlage mit eindeutigen, zulässigen Namen wird angenommen', async () => {
    const result = await attemptCreateTemplate({
      version: 1,
      fields: [
        { name: 'Ticket', source: 'todo.callNumber', transformation: 'raw' },
        { name: 'Stunden', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
      ],
    });
    expect(result.status).toBe(201);
  });
});

test.describe('Reservierter Feldname über den echten Vorlageneditor (S-14, T-052)', () => {
  test('„__proto__“ als Schlüssel: Speichern geht zum Dienst durch, die 422-Antwort landet an der betroffenen Zeile', async ({
    page,
  }) => {
    const run = Date.now();
    await gotoTemplates(page, 'neu');
    await page.getByLabel('Name der Vorlage').fill(`E2E-TPL-RESERVED-${run}`);
    await page.getByRole('button', { name: 'Erstes Feld hinzufügen' }).click();

    await page.getByLabel('Schlüssel').fill('__proto__');

    // Anders als bei doppelten Namen (`duplicateFieldNames`) gibt es für
    // reservierte Namen keine clientseitige Sperre — der Knopf bleibt
    // bedienbar, siehe Dateikopf. `saveBlocked` prüft nur auf einen leeren
    // Namen; "__proto__" ist nicht leer.
    const saveButton = page.getByRole('button', { name: 'Speichern' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Die Ablehnung kommt über den echten Netzwerkweg vom Dienst zurück
    // (`RESERVED_FIELD_NAMES`, `packages/export/src/template.ts`) und wird
    // von `fieldIndexOfMessage`/`messageWithoutFieldPrefix` an die richtige
    // Feldzeile gehängt — nicht als Sammelmeldung über der Liste.
    const rowError = page.locator('.tfield__error');
    await expect(rowError).toContainText('__proto__');
    await expect(rowError).toContainText('ist nicht zulässig');
    await expect(page.locator('.message--danger', { hasText: 'Die Vorlage wurde nicht gespeichert' })).toHaveCount(
      0,
    );

    // Keine neue Vorlage ist entstanden — die Adresse bleibt auf "neu", kein
    // Erfolgs-Toast ist erschienen.
    await expect(page).toHaveURL(/#\/export\/vorlagen\/neu/);
    await expect(page.getByText('Vorlage angelegt.')).toHaveCount(0);
  });
});
