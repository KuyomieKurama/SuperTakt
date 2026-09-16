import type { TodoPriority } from '@takt/domain';
import { type AppContext, type UseCaseResult, now } from '../../context.ts';

export function listPriorities(context: AppContext): Promise<readonly TodoPriority[]> {
  return context.transactions.inTransaction(unit => unit.priorities.list());
}

export function savePriority(
  context: AppContext,
  id: string | null,
  name: string,
  weight: number,
): Promise<UseCaseResult<TodoPriority>> {
  return context.transactions.inTransaction(unit =>
    unit.priorities.save(id, name, weight, now(context)),
  );
}

export function removePriority(context: AppContext, id: string): Promise<UseCaseResult<void>> {
  return context.transactions.inTransaction(unit => unit.priorities.remove(id));
}
