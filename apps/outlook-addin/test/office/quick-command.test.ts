import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickAddToInbox } from '../../src/quick-command.ts';
import { readHost } from '../../src/office/host.ts';
import { collectAttachments } from '../../src/attachments/collect.ts';
import { createBrowserApiClient, type ApiClient, type CreateTodoRequest } from '../../src/api/client.ts';
import { detectCallNumber } from '../../src/callnumber/detect.ts';
import type { HostState } from '../../src/office/host.ts';
import type { AddinContextDto } from '../../src/api/types.ts';

vi.mock('../../src/office/host.ts', () => ({ readHost: vi.fn() }));
vi.mock('../../src/attachments/collect.ts', () => ({ collectAttachments: vi.fn() }));
vi.mock('../../src/api/client.ts', () => ({ createBrowserApiClient: vi.fn() }));
vi.mock('../../src/callnumber/detect.ts', () => ({ detectCallNumber: vi.fn() }));
const context: AddinContextDto = { tagTree: { rootTags: [], rootFolders: [] }, pools: [], statuses: [], defaultStatusId: 'status', defaultTagIds: [], emailAttachments: { accepted: true }, mailAssignment: { accepted: true } };
const host: HostState = { kind: 'ready', mail: { subject: 'AW: CALL24470', senderName: 'Absender', senderAddress: 'mail@example.test', body: 'Nicht als Auszug speichern', receivedAt: null, internetMessageId: '<test@example.test>' },
  attachments: { facts: [], capabilities: { canReadMessageFile: true, canReadAttachments: true }, ports: { messageAsFile: null, attachmentContent: null, rebuildFields: () => ({ subject: '', from: null, to: [], cc: [], sentAt: null, body: '' }) } } };

describe('real quick command orchestration with Office mocks', () => {
  let notify: ReturnType<typeof vi.fn>;
  let api: ApiClient;
  beforeEach(() => {
    notify = vi.fn((_key, _details, callback) => callback({ status: 'succeeded' }));
    vi.stubGlobal('Office', { context: { mailbox: { item: { notificationMessages: { replaceAsync: notify } } } } });
    vi.stubGlobal('window', { localStorage: { getItem: () => null } });
    vi.mocked(readHost).mockResolvedValue(host);
    vi.mocked(detectCallNumber).mockResolvedValue({ kind: 'match', origin: 'subject', value: '24470' });
    vi.mocked(collectAttachments).mockResolvedValue({ cancelled: false, payload: [], missing: [] });
    api = { loadContext: vi.fn().mockResolvedValue({ ok: true, value: context }), createTodo: vi.fn().mockResolvedValue({ ok: true, value: { outcome: 'created', todo: { id: 'task' }, createdTags: [], addedDefaultTagIds: [], attachments: null } }) } as unknown as ApiClient;
    vi.mocked(createBrowserApiClient).mockReturnValue(api);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
  it('waits for attachments and storage, sends no excerpt, then notifies and completes exactly once', async () => {
    let finishCollection!: (value: Awaited<ReturnType<typeof collectAttachments>>) => void;
    vi.mocked(collectAttachments).mockImplementation(() => new Promise(resolve => { finishCollection = resolve; }));
    let finishStorage!: (value: Awaited<ReturnType<ApiClient['createTodo']>>) => void;
    vi.mocked(api.createTodo).mockImplementation(() => new Promise(resolve => { finishStorage = resolve; }));
    const completed = vi.fn();
    const run = quickAddToInbox({ completed });
    await vi.waitFor(() => expect(collectAttachments).toHaveBeenCalled());
    expect(completed).not.toHaveBeenCalled();
    expect(api.createTodo).not.toHaveBeenCalled();
    finishCollection({ cancelled: false, payload: [], missing: [] });
    await vi.waitFor(() => expect(api.createTodo).toHaveBeenCalled());
    const request = vi.mocked(api.createTodo).mock.calls[0]![0] as CreateTodoRequest;
    expect(request).toMatchObject({ title: 'AW: CALL24470', dueDate: null, mode: 'auto', note: '', mail: { excerpt: null } });
    expect(completed).not.toHaveBeenCalled();
    finishStorage({ ok: false, kind: 'failed', code: null, message: 'Testfehler' });
    await run;
    expect(notify).toHaveBeenCalledWith('supertakt-result', expect.objectContaining({ message: 'Testfehler' }), expect.any(Function));
    expect(completed).toHaveBeenCalledTimes(1);
  });
  it('also completes exactly once after an unexpected error', async () => {
    vi.mocked(readHost).mockRejectedValue(new Error('Lesefehler'));
    const completed = vi.fn();
    await quickAddToInbox({ completed });
    expect(completed).toHaveBeenCalledTimes(1);
  });
  it('does not save after collection cancellation or item change', async () => {
    vi.mocked(collectAttachments).mockImplementation(async () => {
      vi.stubGlobal('Office', { context: { mailbox: { item: undefined } } });
      return { cancelled: true, payload: [], missing: [] };
    });
    const completed = vi.fn();
    await quickAddToInbox({ completed });
    expect(api.createTodo).not.toHaveBeenCalled();
    expect(completed).toHaveBeenCalledTimes(1);
  });
  it('uses saved valid status and nested tags and reports unavailable attachment support', async () => {
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => key === 'takt.addin.defaults' ? JSON.stringify({ statusId: 'status', tagIds: ['nested'], includeExcerpt: true, theme: 'dark' }) : null } });
    vi.mocked(api.loadContext).mockResolvedValue({ ok: true, value: { ...context,
      emailAttachments: { accepted: false }, statuses: [{ id: 'status', name: 'Inbox', position: 0, isDefault: true }],
      tagTree: { rootTags: [], rootFolders: [{ folder: { id: 'folder', parentId: null, name: 'Folder' }, subfolders: [], tags: [{ id: 'nested', folderId: 'folder', name: 'Nested', color: null }] }] } } });
    await quickAddToInbox({ completed: vi.fn() });
    expect(api.createTodo).toHaveBeenCalledWith(expect.objectContaining({ statusId: 'status', tagIds: ['nested'], mail: expect.objectContaining({ excerpt: null }) }));
    expect(notify).toHaveBeenCalledWith('supertakt-result', expect.objectContaining({ message: expect.stringContaining('Teilweise übernommen') }), expect.any(Function));
  });
  it('refuses writing when the item changes after successful collection', async () => {
    vi.mocked(collectAttachments).mockImplementation(async () => {
      vi.stubGlobal('Office', { context: { mailbox: { item: {} } } });
      return { cancelled: false, payload: [], missing: [] };
    });
    const completed = vi.fn();
    await quickAddToInbox({ completed });
    expect(api.createTodo).not.toHaveBeenCalled();
    expect(completed).toHaveBeenCalledTimes(1);
  });
  it('uses the confirmed duplicate result', async () => {
    vi.mocked(api.createTodo).mockResolvedValue({ ok: true, value: { outcome: 'already_present', todo: {} as never, createdTags: [], addedDefaultTagIds: [], attachments: null } });
    await quickAddToInbox({ completed: vi.fn() });
    expect(notify).toHaveBeenCalledWith('supertakt-result', expect.objectContaining({ message: 'Bereits vorhanden.' }), expect.any(Function));
  });
});
