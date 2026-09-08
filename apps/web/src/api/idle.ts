import { request } from './client';
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
export const getIdleSession = () => request<IdleSession | null>('/timer/idle');
export const beginIdleSession = (input: { entryId: Id; startedAt: Timestamp; returnedAt?: Timestamp }) => request<IdleSession | null>('/timer/idle/begin', { method: 'POST', body: input });
export const returnFromIdle = (id: Id, returnedAt?: Timestamp) => request<IdleSession | null>('/timer/idle/return', { method: 'POST', body: { id, ...(returnedAt === undefined ? {} : { returnedAt }) } });
export const resolveIdleSession = (id: Id, allocations: readonly IdleAllocation[], resume: boolean) => request<IdleResolution>('/timer/idle/resolve', { method: 'POST', body: { id, allocations, resume } });
