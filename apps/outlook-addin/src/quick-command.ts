import { createBrowserApiClient } from './api/client.ts';
import { createSettingsStore, DEFAULT_TARGET } from './settings/store.ts';
import { readHost } from './office/host.ts';
import { saveMail } from './office/save-mail.ts';
import { suggestTitle } from './office/mail.ts';
import { detectCallNumber } from './callnumber/detect.ts';
import { createTimedEvaluator } from './callnumber/evaluate.ts';
import { spawnBrowserChannel } from './callnumber/browser-channel.ts';
import { planTakeover } from './attachments/plan.ts';
import { collectAttachments } from './attachments/collect.ts';
import { TAKEOVER_LIMITS } from './attachments/model.ts';
import { validDefaults } from './settings/target.ts';

export async function quickAddToInbox(event: Office.AddinCommands.Event): Promise<void> {
  let message = 'Fehler: Die E-Mail konnte nicht übernommen werden.';
  let item: Office.MessageRead | undefined;
  try {
    const host = await readHost();
    item = Office.context.mailbox?.item;
    if (host.kind !== 'ready') throw new Error('Bitte eine E-Mail öffnen.');
    const store = createSettingsStore(window.localStorage);
    const settings = store.read();
    const api = createBrowserApiClient({ baseUrl: settings.baseUrl, token: () => store.readToken() });
    const context = await api.loadContext();
    if (!context.ok) throw new Error(context.message);
    if (context.value.mailAssignment?.accepted !== true) throw new Error('Bitte SuperTakt aktualisieren: Der lokale Dienst unterstützt den Mailverlauf noch nicht.');
    const defaults = validDefaults(settings.defaults ?? DEFAULT_TARGET, context.value);
    const detection = await detectCallNumber(settings.callNumberPattern, host.mail, createTimedEvaluator({ spawn: spawnBrowserChannel }));
    if (detection.kind === 'timeout' || detection.kind === 'unavailable' || detection.kind === 'implausible') throw new Error('Call-Nummer nicht sicher erkannt. Bitte in der Seitenleiste prüfen.');
    const collectionController = new AbortController();
    const collectionTimer = setTimeout(() => collectionController.abort(), 60000);
    let collected;
    try { collected = host.attachments === null || context.value.emailAttachments?.accepted !== true ? null
      : await collectAttachments(planTakeover(host.attachments.facts, TAKEOVER_LIMITS, host.attachments.capabilities), TAKEOVER_LIMITS, host.attachments.ports,
        { signal: collectionController.signal, timeoutMs: 15000, onProgress: () => undefined });
    } finally { clearTimeout(collectionTimer); }
    if (collected?.cancelled) throw new Error('Anhangsübernahme abgebrochen. Es wurde nichts gespeichert.');
    if (Office.context.mailbox?.item !== item) throw new Error('Die E-Mail hat gewechselt. Bitte erneut ausführen.');
    const result = await saveMail(api, host.mail, {
      requestId: crypto.randomUUID(), title: suggestTitle(host.mail.subject),
      callNumber: detection.kind === 'match' ? detection.value : null,
      statusId: defaults.statusId, tagIds: defaults.tagIds, tagNames: [], note: '', dueDate: null,
      attachments: collected ? { sender: host.mail.senderAddress, items: collected.payload } : null,
    }, 'auto', false);
    if (!result.ok) throw new Error(result.message);
    const partial = collected === null || (collected?.missing.length ?? 0) > 0 || (result.value.attachments?.rejected.length ?? 0) > 0;
    message = result.value.outcome === 'already_present' ? (partial ? 'Bereits vorhanden. Einzelne Anhänge fehlen weiterhin.' : 'Bereits vorhanden.')
      : partial ? 'Teilweise übernommen. Die Aufgabe ist gespeichert; einzelne Anhänge fehlen.'
        : result.value.outcome === 'appended' ? 'E-Mail zur Aufgabe ergänzt.' : 'Neue Aufgabe angelegt.';
    if (detection.kind === 'pattern_invalid' || (detection.kind === 'match' && detection.warning)) message += ' Call-Muster ungültig; Basiserkennung verwendet.';
  } catch (error) {
    message = error instanceof Error ? error.message : message;
  } finally {
    try {
      const notifications = item?.notificationMessages;
      if (notifications) await new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 3000);
        notifications.replaceAsync('supertakt-result', { type: 'informationalMessage', message: message.slice(0, 150), icon: 'icon16', persistent: true }, () => { clearTimeout(timer); resolve(); });
      });
    } finally { event.completed(); }
  }
}
