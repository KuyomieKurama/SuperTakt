import type { ForeignText, Id, Timestamp } from './types';

export interface IdleSession {
  readonly id: Id;
  readonly todoId: Id;
  readonly todoTitle: ForeignText;
  readonly note: ForeignText;
  readonly startedAt: Timestamp;
  readonly returnedAt: Timestamp | null;
}
export interface IdleAllocation { readonly todoId: Id | null; readonly seconds: number; readonly note: ForeignText }
export interface IdleResolution { readonly recordedSeconds: number; readonly breakSeconds: number; readonly resumed: boolean; readonly alreadyResolved: boolean }

export { getIdleSession, beginIdleSession, returnFromIdle, resolveIdleSession } from './endpoints';
