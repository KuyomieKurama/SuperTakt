import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiClient, type AppendMailRequest } from '../../src/api/client.ts';

const input: AppendMailRequest = {
  todoId: 'existing-todo', requestId: 'same-request', callNumber: '24470', note: '', attachments: null,
  mail: { identity: 'short-message', subject: 'Kurze Mail', sender: 'test@example.invalid',
    receivedAt: null, internetMessageId: null, outlookLink: null, excerpt: null },
};
const token = 'test-secret';
const client = (fetch: typeof globalThis.fetch) => createApiClient({
  baseUrl: 'http://127.0.0.1:17843', token: () => token, fetch,
});
const abortedFetch: typeof globalThis.fetch = (_url, init) => new Promise((_resolve, reject) => {
  init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
});

afterEach(() => vi.useRealTimers());

describe('Outlook mail transfer failures', () => {
  it.each([200, 401])('distinguishes a failed transfer from a responding service (HTTP %s)', async status => {
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response('{}', { status }));
    const result = await client(fetch).appendMail(input);
    expect(result).toMatchObject({ ok: false, kind: 'failed', code: 'transfer_interrupted' });
    expect(result.ok ? '' : result.message).toContain('bereits gespeichert');
    expect(JSON.stringify(result)).not.toContain(token);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.map(([, init]) => init?.method)).toEqual(['POST', 'GET']);
    expect(fetch.mock.calls[1]?.[0]).toBe('http://127.0.0.1:17843/api/v1/health');
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({ credentials: 'omit', headers: { 'X-Takt-Token': token } });
  });

  it('reports an unreachable service when both transfer and health check fail', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await client(fetch).appendMail(input)).toMatchObject({ ok: false, kind: 'unreachable' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('limits the follow-up health check to five seconds without repeating the write', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockImplementationOnce(abortedFetch);
    const result = client(fetch).appendMail(input);
    await vi.advanceTimersByTimeAsync(5000);
    expect(await result).toMatchObject({ ok: false, kind: 'unreachable' });
    expect(fetch.mock.calls.map(([, init]) => init?.method)).toEqual(['POST', 'GET']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('identifies the send timeout and preserves the warning about a possibly completed write', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(abortedFetch);
    const result = client(fetch).appendMail(input);
    await vi.advanceTimersByTimeAsync(90000);
    expect(await result).toMatchObject({ ok: false, kind: 'failed', code: 'request_timeout',
      message: expect.stringContaining('bereits gespeichert') });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves a server rejection without a health check', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'payload_too_large', message: 'Die Anfrage ist zu groß.' },
    }), { status: 413 }));
    expect(await client(fetch).appendMail(input)).toMatchObject({ ok: false, code: 'payload_too_large' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
