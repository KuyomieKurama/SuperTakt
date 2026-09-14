/**
 * Takt — Zusammenbau des Aufgabenbereichs.
 *
 * Alles, was von außen kommt, wird hier **einmal** erzeugt und weitergereicht:
 * die Ablage der Einstellungen, der Zugang zum Dienst, der Auswerter für die
 * Call-Nummer. Kein Baustein weiter unten greift selbst auf `localStorage`,
 * `Worker` oder `Office` zu — deshalb lässt sich jeder von ihnen ohne Outlook
 * und ohne laufenden Dienst prüfen.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { createBrowserApiClient, type ApiClient } from '../api/client.ts';
import { createTimedEvaluator, type Evaluator } from '../callnumber/evaluate.ts';
import { spawnBrowserChannel, supportsWorker } from '../callnumber/browser-channel.ts';
import { detectCallNumber, type Detection } from '../callnumber/detect.ts';
import { onItemChanged, readHost, type HostState } from '../office/host.ts';
import { createSettingsStore, type AddinSettings } from '../settings/store.ts';
import { Button, Callout, Section, Skeleton } from './Primitives.tsx';
import { SettingsView } from './SettingsView.tsx';
import { TaskPane } from './TaskPane.tsx';

const unavailableEvaluator: Evaluator = () =>
  Promise.resolve({
    kind: 'unavailable',
    message: 'In dieser Umgebung steht kein eigener Auswertungsfaden zur Verfügung.',
  });

export function App() {
  const store = useMemo(() => createSettingsStore(window.localStorage), []);
  const [settings, setSettings] = useState<AddinSettings>(() => store.read());
  const [host, setHost] = useState<HostState | null>(null);
  const [hostAttempt, setHostAttempt] = useState(0);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const evaluate = useMemo<Evaluator>(
    () =>
      supportsWorker()
        ? createTimedEvaluator({ spawn: spawnBrowserChannel })
        : unavailableEvaluator,
    [],
  );

  const api = useMemo(
    () =>
      createBrowserApiClient({
        baseUrl: settings.baseUrl,
        token: () => store.readToken(),
      }),
    [settings.baseUrl, store],
  );

  const refresh = useCallback(() => {
    setSettings(store.read());
  }, [store]);

  const noteConnected = useCallback(() => {
    store.noteConnected(new Date().toISOString());
  }, [store]);

  const retryHost = useCallback(() => {
    setDetection(null);
    setHost(null);
    setHostAttempt((current) => current + 1);
  }, []);

  /**
   * Outlook hat eine andere Nachricht geöffnet (A-19.31, Entwurf 6.6, D-06).
   *
   * Der Aufgabenbereich lässt sich anheften (`SupportsPinning` im Manifest);
   * dann bleibt er beim Wechsel der Nachricht stehen und zeigte bis hierher
   * **die alte**. Neu gelesen wird deshalb, ohne den Bereich auszuhängen:
   * `retryHost` setzt den Wirt auf `null` und nähme dem Formular seinen Platz
   * — und mit ihm dem Satz, der sagt, warum eine laufende Übernahme gerade
   * abgebrochen wurde.
   */
  useEffect(
    () =>
      onItemChanged(() => {
        setDetection(null);
        void readHost().then((state) => {
          setHost(state);
        });
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void readHost().then((state) => {
      if (!cancelled) setHost(state);
    });
    return () => {
      cancelled = true;
    };
  }, [hostAttempt]);

  useEffect(() => {
    if (host === null || host.kind !== 'ready') return undefined;
    let cancelled = false;

    void detectCallNumber(
      settings.callNumberPattern,
      { subject: host.mail.subject, body: host.mail.body },
      evaluate,
    ).then((result) => {
      if (!cancelled) setDetection(result);
    });

    return () => {
      cancelled = true;
    };
  }, [host, settings.callNumberPattern, evaluate]);

  return (
    <div className="shell">
      <header className="shell__bar">
        <span className="shell__brand">
          SuperTakt
          <span className="shell__brand-sub">Todo aus E-Mail</span>
        </span>
        <button
          type="button"
          className="icon-btn btn--ghost"
          aria-label={showSettings ? 'Einstellungen schließen' : 'Einstellungen öffnen'}
          aria-pressed={showSettings}
          onClick={() => {
            setShowSettings((current) => !current);
          }}
        >
          <span aria-hidden="true">⚙</span>
        </button>
      </header>

      <main className="shell__body">
        {showSettings ? (
          <SettingsView
            settings={settings}
            store={store}
            api={api}
            evaluate={evaluate}
            onChanged={refresh}
            onClose={() => {
              setShowSettings(false);
            }}
          />
        ) : (
          <Body
            host={host}
            detection={detection}
            settings={settings}
            api={api}
            onOpenSettings={() => {
              setShowSettings(true);
            }}
            onConnected={noteConnected}
            onRetryHost={retryHost}
          />
        )}
      </main>
    </div>
  );
}

function Body({
  host,
  detection,
  settings,
  api,
  onOpenSettings,
  onConnected,
  onRetryHost,
}: {
  readonly host: HostState | null;
  readonly detection: Detection | null;
  readonly settings: AddinSettings;
  readonly api: ApiClient;
  readonly onOpenSettings: () => void;
  readonly onConnected: () => void;
  readonly onRetryHost: () => void;
}) {
  if (host === null) {
    return (
      <Section title="Wird geladen">
        <Skeleton lines={4} />
      </Section>
    );
  }

  if (host.kind === 'office_js_unavailable') {
    return (
      <Section title="Office.js nicht verfügbar">
        <Callout
          tone="warning"
          title="Die Outlook-Schnittstelle konnte nicht geladen werden."
          action={<Button onClick={onRetryHost}>Erneut prüfen</Button>}
        >
          Die Seite ist geladen, aber Office.js fehlt. Prüfen Sie die Netzwerk- oder
          Proxy-Einstellungen und versuchen Sie es erneut.
        </Callout>
      </Section>
    );
  }

  if (host.kind === 'office_not_ready') {
    return (
      <Section title="Outlook noch nicht bereit">
        <Callout
          tone="warning"
          title="Outlook hat den Aufgabenbereich noch nicht initialisiert."
          action={<Button onClick={onRetryHost}>Erneut prüfen</Button>}
        >
          Office.js ist geladen, aber Outlook hat innerhalb von 15 Sekunden nicht geantwortet.
          Versuchen Sie es erneut.
        </Callout>
      </Section>
    );
  }

  if (host.kind === 'no_item') {
    return (
      <Section title="Keine E-Mail geöffnet">
        <Callout tone="info" title="Öffnen Sie eine E-Mail, um daraus ein Todo anzulegen.">
          Der Aufgabenbereich übernimmt Betreff, Absender und den Text der geöffneten E-Mail.
        </Callout>
      </Section>
    );
  }

  return (
    <TaskPane
      mail={host.mail}
      detection={detection}
      api={api}
      hasToken={settings.hasToken}
      attachments={host.attachments}
      onOpenSettings={onOpenSettings}
      onConnected={onConnected}
    />
  );
}
