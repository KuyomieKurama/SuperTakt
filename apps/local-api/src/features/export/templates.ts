/**
 * Takt — Exportvorlagen (A-8.7, E-005).
 *
 * Die Feldliste wird **vor** dem Schreiben geprüft, und zwar von
 * `validateExportTemplateDefinition` im Motor (`packages/export`) — nicht hier.
 * Das ist die Stelle, an der `todo.note` als Quelle abgewiesen wird
 * (A-7.2, E-017, R-06): Die Auswahlliste ist abschließend, und was nicht
 * daraufsteht, kommt nicht in die Datenbank.
 */

import type { ExportTemplateEnvelope, ExportTemplateId } from '@takt/domain';
import { err } from '@takt/domain';

import { type AppContext, type UseCaseResult, now } from '../../context.ts';
import { checkTemplateDefinition } from './export.ts';

export function listTemplates(context: AppContext): Promise<readonly ExportTemplateEnvelope[]> {
  return context.transactions.inTransaction((unit) => unit.templates.list());
}

export async function createTemplate(
  context: AppContext,
  name: string,
  definition: unknown,
): Promise<UseCaseResult<ExportTemplateEnvelope>> {
  const checked = checkTemplateDefinition(definition);
  if (!checked.ok) return err(checked.error);

  const timestamp = now(context);
  return context.transactions.inTransaction((unit) =>
    unit.templates.create(name, definition, timestamp),
  );
}

export async function updateTemplate(
  context: AppContext,
  id: ExportTemplateId,
  name: string | undefined,
  definition: unknown,
): Promise<UseCaseResult<ExportTemplateEnvelope>> {
  if (definition !== undefined) {
    const checked = checkTemplateDefinition(definition);
    if (!checked.ok) return err(checked.error);
  }

  const timestamp = now(context);
  return context.transactions.inTransaction((unit) =>
    unit.templates.update(id, name, definition, timestamp),
  );
}

export function removeTemplate(
  context: AppContext,
  id: ExportTemplateId,
): Promise<UseCaseResult<void>> {
  return context.transactions.inTransaction((unit) => unit.templates.remove(id));
}
