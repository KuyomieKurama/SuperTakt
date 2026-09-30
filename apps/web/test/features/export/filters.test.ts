import { afterEach, expect, it, vi } from 'vitest';
import { setConnection } from '../../../src/api/client';
import { toCallGroups } from '../../../src/features/export/ExportGroups';
import { collectOpenEntries, toExportedLayout } from '../../../src/features/export/exportGroupLayout';

afterEach(() => vi.unstubAllGlobals());
it('keeps date and previous-export filters on every page and only requests open entries', async () => {
  setConnection({ baseUrl: 'http://127.0.0.1:1/api/v1', headerName: 'X-Test', secret: 'fixture' });
  const urls: URL[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    urls.push(new URL(input));
    return new Response(JSON.stringify({ data: { items: [], total: 0, nextCursor: urls.length === 1 ? 'next-page' : null } }), { status: 200 });
  }));
  await collectOpenEntries({ fromDay: '2026-09-10', toDay: '2026-09-16', onlyPreviouslyExported: true });
  expect(urls).toHaveLength(2);
  for (const url of urls) {
    expect(url.searchParams.get('exportStatus')).toBe('open');
    expect(url.searchParams.get('fromDay')).toBe('2026-09-10');
    expect(url.searchParams.get('toDay')).toBe('2026-09-16');
    expect(url.searchParams.get('onlyPreviouslyExported')).toBe('true');
    expect(url.searchParams.has('includeNoExport')).toBe(false);
  }
  expect(urls[1]?.searchParams.get('cursor')).toBe('next-page');
});

it('groups exported entries by todo and local calendar day in ascending order', () => {
  const entries = [
    { id: 'late', todoId: 'todo-a', startedAt: '2026-09-11T08:00:00.000Z' },
    { id: 'first', todoId: 'todo-a', startedAt: '2026-09-10T08:00:00.000Z' },
    { id: 'same-day', todoId: 'todo-a', startedAt: '2026-09-10T09:00:00.000Z' },
    { id: 'no-call-todo', todoId: 'todo-b', startedAt: '2026-09-10T10:00:00.000Z' },
  ] as never[];

  expect(toExportedLayout(entries)).toEqual([
    { key: 'exported:todo-a|2026-09-10', todoId: 'todo-a', day: '2026-09-10', entryIds: ['first', 'same-day'], exportStatus: 'exported' },
    { key: 'exported:todo-b|2026-09-10', todoId: 'todo-b', day: '2026-09-10', entryIds: ['no-call-todo'], exportStatus: 'exported' },
    { key: 'exported:todo-a|2026-09-11', todoId: 'todo-a', day: '2026-09-11', entryIds: ['late'], exportStatus: 'exported' },
  ]);
});

it('groups call headings by call or todo and adds the finished day quarters', () => {
  const model = (id: string, todoId: string, callNumber: string | null, quarterCount: number) => ({
    group: { id, todoId, todoTitle: id, callNumber, day: id, exportStatus: 'open' as const, durationSeconds: 0, entries: [] },
    excludedEntryIds: new Set<string>(),
    quarters: String(quarterCount / 4),
    quarterCount,
    mergedNote: '',
    blockedReason: null,
  });

  expect(toCallGroups([
    model('day-1', 'todo-a', 'CALL-1', 2),
    model('day-2', 'todo-b', 'CALL-1', 3),
    model('day-3', 'todo-c', null, 4),
  ])).toMatchObject([
    { id: 'call:CALL-1', dayCount: 2, quarterCount: 5 },
    { id: 'todo:todo-c', dayCount: 1, quarterCount: 4 },
  ]);
});
