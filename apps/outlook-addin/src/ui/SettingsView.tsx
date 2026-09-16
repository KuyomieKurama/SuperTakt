import { DEFAULT_TARGET } from '../settings/store.ts';
import { detectCallNumber } from '../callnumber/detect.ts';
import type { AddinContextDto } from '../api/types.ts';
import { TagPicker } from './TagPicker.tsx';
/**
 * Takt — S-13, die Einstellungen des Add-ins (A-10.3, A-10.8, E-009, E-019, R-09, B-2.3).
 *
 * Zwei Dinge werden hier eingestellt, und beide sind heikel:
 *
 *  - **Das Token.** Es ist verdeckt, es steht vor der ausdrücklichen Handlung
 *    an keiner Stelle im DOM — auch nicht in einem versteckten Element oder
 *    einem `data-`-Attribut (B-2.3, TP-ADDIN-08). Angezeigt wird nur die
 *    Beschreibung („hinterlegt, endet auf …abcd"). Wer den Wert sehen will,
 *    schaltet ihn ein; er wird nach kurzer Zeit wieder verdeckt.
 *  - **Der reguläre Ausdruck** (A-10.8). Er steht **hier**, nicht im Code, und
 *    wird beim Speichern geprüft (B-4.1, B-4.2, B-4.3). Ein ungültiger Ausdruck
 *    ist Benutzereingabe: Er wird abgelehnt, der zuletzt gültige bleibt in
 *    Kraft, und das Add-in bleibt bedienbar.
 *
 * Der Testbereich unten ist kein Beiwerk. Ohne ihn schreibt man einen Ausdruck
 * und erfährt erst bei der nächsten E-Mail, ob er trifft.
 */

import { useEffect, useRef, useState } from 'react';

import { PATTERN_CATALOG, DEFAULT_PATTERN } from '../callnumber/catalog.ts';
import { checkPattern } from '../callnumber/pattern.ts';
import type { Evaluator } from '../callnumber/evaluate.ts';
import { DEFAULT_BASE_URL, describeToken, isAcceptableBaseUrl, looksLikeToken } from '../settings/store.ts';
import type { AddinSettings, SettingsStore } from '../settings/store.ts';
import type { ApiClient } from '../api/client.ts';
import { Button, Callout, Field, Foreign, Section } from './Primitives.tsx';

export interface SettingsViewProps {
  readonly settings: AddinSettings;
  readonly store: SettingsStore;
  readonly api: ApiClient;
  readonly evaluate: Evaluator;
  readonly onChanged: () => void;
  readonly onClose: () => void;
}

type Probe =
  | { readonly kind: 'idle' }
  | { readonly kind: 'running' }
  | { readonly kind: 'ok' }
  | { readonly kind: 'failed'; readonly message: string };

type SampleResult =
  | { readonly kind: 'idle' }
  | { readonly kind: 'match'; readonly value: string }
  | { readonly kind: 'implausible'; readonly raw: string; readonly message: string }
  | { readonly kind: 'none' }
  | { readonly kind: 'problem'; readonly message: string };

/** Wie lange das Token im Klartext sichtbar bleibt (B-2.3). */
const REVEAL_MS = 15_000;

export function SettingsView({
  settings,
  store,
  api,
  evaluate,
  onChanged,
  onClose,
}: SettingsViewProps) {
  const defaults = settings.defaults ?? DEFAULT_TARGET;
  const [context, setContext] = useState<AddinContextDto | null>(null);
  useEffect(() => {
    let live = true;
    void api.loadContext().then(result => { if (live && result.ok) setContext(result.value); });
    return () => { live = false; };
  }, [api]);
  const [tokenInput, setTokenInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [pattern, setPattern] = useState(settings.callNumberPattern);
  const [patternError, setPatternError] = useState<string | undefined>(undefined);
  const [patternSaved, setPatternSaved] = useState(false);
  const [sample, setSample] = useState(PATTERN_CATALOG[0]?.sample ?? '');
  const [sampleResult, setSampleResult] = useState<SampleResult>({ kind: 'idle' });
  const [probe, setProbe] = useState<Probe>({ kind: 'idle' });

  /**
   * Der Klartext verschwindet nach kurzer Zeit von selbst (B-2.3).
   *
   * Ein Aufgabenbereich bleibt offen, während jemand telefoniert oder den
   * Bildschirm teilt. Ein einmal eingeblendetes Geheimnis, das dort stehen
   * bleibt, ist ein eingeblendetes Geheimnis auf einem geteilten Bildschirm.
   */
  useEffect(() => {
    if (!revealed) return undefined;
    const handle = setTimeout(() => {
      setRevealed(false);
    }, REVEAL_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [revealed]);

  const saveToken = (): void => {
    store.writeToken(tokenInput);
    setTokenInput('');
    setRevealed(false);
    setProbe({ kind: 'idle' });
    onChanged();
  };

  const patternSaveGeneration = useRef(0);
  const savePattern = async (candidate: string): Promise<void> => {
    const generation = ++patternSaveGeneration.current;
    const checked = checkPattern(candidate);
    if (candidate.trim() !== '' && !checked.ok) {
      // Der zuletzt gültige Ausdruck bleibt in Kraft. Ein Speichern, das den
      // alten Wert überschreibt und dann scheitert, wäre die Sackgasse aus
      // B-4.2: kein Add-in mehr und kein Weg zurück.
      setPatternError(checked.message);
      setPatternSaved(false);
      return;
    }
    if (candidate.trim() !== '') {
      const outcome = await evaluate(candidate, '');
      if (generation !== patternSaveGeneration.current) return;
      if (outcome.kind !== 'no_match') {
        setPatternError('message' in outcome ? outcome.message : 'Das Muster konnte nicht sicher geprüft werden.');
        setPatternSaved(false);
        return;
      }
    }
    setPatternError(undefined);
    store.writePattern(candidate.trim());
    setPattern(candidate.trim());
    setPatternSaved(true);
    onChanged();
  };

  const runSample = async (): Promise<void> => {
    const outcome = await detectCallNumber(pattern, { subject: sample, body: '' }, evaluate);
    setSampleResult(outcome.kind === 'match' ? { kind: 'match', value: outcome.value }
      : outcome.kind === 'no_match' ? { kind: 'none' }
      : { kind: 'problem', message: 'message' in outcome ? outcome.message : 'Das Muster konnte nicht sicher ausgewertet werden.' });
  };

  const testConnection = async (): Promise<void> => {
    setProbe({ kind: 'running' });
    const result = await api.checkConnection();
    if (result.ok) {
      const at = new Date().toISOString();
      store.noteConnected(at);
      onChanged();
      setProbe({ kind: 'ok' });
      return;
    }
    setProbe({ kind: 'failed', message: result.message });
  };

  return (
    <div className="pane">
      <Section title="Standardvorgaben">
        <Field label="Darstellung" htmlFor="theme">{(aria) => <select {...aria} className="input" value={defaults.theme} onChange={event => { store.writeDefaults({ ...defaults, theme: event.target.value as 'auto' | 'light' | 'dark' }); onChanged(); }}>
          <option value="auto">Automatisch</option><option value="light">Hell</option><option value="dark">Dunkel</option>
        </select>}</Field>
        <label className="mail-option"><input type="checkbox" checked={defaults.includeExcerpt} onChange={event => { store.writeDefaults({ ...defaults, includeExcerpt: event.target.checked }); onChanged(); }} />E-Mail-Auszug in der Seitenleiste vorauswählen</label>
        {context ? <>
          <Field label="Standard-Status" htmlFor="default-status">{(aria) => <select {...aria} className="input" value={defaults.statusId ?? ''} onChange={event => { store.writeDefaults({ ...defaults, statusId: event.target.value || null }); onChanged(); }}>
            <option value="">SuperTakt-Standard</option>{context.statuses.map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
          </select>}</Field>
          <Field label="Standard-Tags" htmlFor="default-tags">{(aria) => <TagPicker allowNew={false} aria={aria} tree={context.tagTree} selected={defaults.tagIds} defaultTagIds={context.defaultTagIds} onChange={tagIds => { store.writeDefaults({ ...defaults, tagIds }); onChanged(); }} newNames={[]} onNewNamesChange={() => undefined} />}</Field>
        </> : <p>Die Zielvorgaben sind verfügbar, sobald SuperTakt verbunden ist.</p>}
      </Section>
      <Section
        title="Verbindung zu SuperTakt"
        description="SuperTakt läuft auf diesem Rechner. Das Add-in spricht ausschließlich mit dem lokalen Dienst."
        actions={
          <Button variant="ghost" onClick={onClose}>
            Zurück
          </Button>
        }
      >
        <Field
          label="Adresse des lokalen Dienstes"
          htmlFor="baseurl"
          hint="Vorgabe ist 127.0.0.1:17843. Der Port ist kein Geheimnis."
          error={isAcceptableBaseUrl(baseUrl) ? undefined : 'Nur 127.0.0.1 oder localhost sind zulässig.'}
        >
          {(aria) => (
            <input
              {...aria}
              className="input mono"
              value={baseUrl}
              spellCheck={false}
              onChange={(event) => {
                setBaseUrl(event.target.value);
              }}
              onBlur={() => {
                if (isAcceptableBaseUrl(baseUrl)) {
                  store.writeBaseUrl(baseUrl);
                  onChanged();
                }
              }}
            />
          )}
        </Field>

        {/*
          T-182, E-078 Punkt 1: Der Hinweis lautete „Das Token erzeugen Sie in
          Takt unter Einstellungen. Es wird dort genau einmal angezeigt." Der
          zweite Satz steht auf **demselben Bildschirm** noch einmal, im
          Bereich „Woher das Token kommt" als Schritt 2 („Ein Token erzeugen.
          Es wird genau einmal angezeigt.") — beide gleichzeitig sichtbar.
          Gefallen ist die Kopie am Feld; der Schritt bleibt dort, wo die
          Handlung geschieht, die er beschreibt.

          Und ohne Anrede (E-080 Punkt 4): „entsteht" sagt dasselbe wie
          „erzeugen Sie" und ist kürzer.
        */}
        <Field
          label="Zugangstoken"
          htmlFor="token"
          hint="Das Token entsteht in SuperTakt unter Einstellungen."
        >
          {(aria) => (
            <div className="tokenrow">
              <input
                {...aria}
                className="input mono"
                // Vor der ausdrücklichen Handlung steht der Wert nirgends im
                // Klartext — auch nicht in einem Attribut (B-2.3).
                type={revealed ? 'text' : 'password'}
                value={tokenInput}
                placeholder={describeToken(store.readToken())}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  setTokenInput(event.target.value);
                }}
              />
              <Button
                variant="ghost"
                onClick={() => {
                  setRevealed((current) => !current);
                }}
                aria-pressed={revealed}
              >
                {revealed ? 'Verdecken' : 'Anzeigen'}
              </Button>
            </div>
          )}
        </Field>

        {tokenInput.length > 0 && !looksLikeToken(tokenInput) ? (
          <Callout tone="warning" title="Das sieht nicht nach einem vollständigen Token aus">
            Ein SuperTakt-Token beginnt mit <span className="mono">takt_</span> und ist 48 Zeichen lang.
            Speichern lässt es sich trotzdem — ob es gilt, entscheidet allein SuperTakt.
          </Callout>
        ) : null}

        <div className="pane-actions pane-actions--row">
          <Button variant="primary" disabled={tokenInput.trim().length === 0} onClick={saveToken}>
            Token übernehmen
          </Button>
          <Button
            variant="secondary"
            loading={probe.kind === 'running'}
            onClick={() => {
              void testConnection();
            }}
          >
            Verbindung prüfen
          </Button>
          {settings.hasToken ? (
            <Button
              variant="ghost"
              onClick={() => {
                store.clearToken();
                onChanged();
              }}
            >
              Token entfernen
            </Button>
          ) : null}
        </div>

        {probe.kind === 'ok' ? (
          <Callout tone="success" title="Verbindung steht">
            SuperTakt hat geantwortet und das Token angenommen.
          </Callout>
        ) : null}
        {probe.kind === 'failed' ? (
          <Callout tone="danger" title={probe.message}>
            Der Grund steht in Worten, nicht als Wert. SuperTakt nennt bewusst nicht, ob das Token
            fehlte, falsch war oder inzwischen ersetzt wurde.
          </Callout>
        ) : null}

        <p className="pane-note">
          Zuletzt verbunden:{' '}
          {settings.lastConnectedAt === null
            ? 'noch nie'
            : new Date(settings.lastConnectedAt).toLocaleString('de-DE')}
          . Das Token liegt ausschließlich auf diesem Rechner in diesem Browserprofil — nicht im
          Postfach, damit es nicht über Exchange synchronisiert wird.
        </p>
      </Section>

      <Section
        title="Erkennung der Call-Nummer"
        description="Der Ausdruck steht in dieser Einstellung, nicht im Programm. Übernommen wird immer der Inhalt der ersten Klammer."
      >
        <Field label="Erprobte Muster" htmlFor="catalog" hint="Deckt den Normalfall ab. Alle Beispiele sind erfunden.">
          {(aria) => (
            <select
              {...aria}
              className="input"
              value={PATTERN_CATALOG.find((entry) => entry.source === pattern)?.id ?? ''}
              onChange={(event) => {
                const entry = PATTERN_CATALOG.find((candidate) => candidate.id === event.target.value);
                if (entry === undefined) return;
                setPattern(entry.source);
                setSample(entry.sample);
                setPatternError(undefined);
                setPatternSaved(false);
              }}
            >
              <option value="">— eigenes Muster —</option>
              {PATTERN_CATALOG.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Regulärer Ausdruck (für Fortgeschrittene)"
          htmlFor="pattern"
          hint="Genau eine Klammer um die Nummer. Rückverweise und Rückschau sind nicht zugelassen."
          error={patternError}
        >
          {(aria) => (
            <input
              {...aria}
              className="input mono"
              value={pattern}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => {
                setPattern(event.target.value);
                setPatternError(undefined);
                setPatternSaved(false);
              }}
            />
          )}
        </Field>

        <div className="pane-actions pane-actions--row">
          <Button
            variant="primary"
            onClick={() => {
              void savePattern(pattern);
            }}
          >
            Ausdruck speichern
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setPattern(DEFAULT_PATTERN);
              void savePattern(DEFAULT_PATTERN);
            }}
          >
            Auslieferungswert
          </Button>
        </div>

        {patternSaved ? (
          <Callout tone="success" title="Gespeichert">
            Der Ausdruck gilt ab der nächsten geöffneten E-Mail.
          </Callout>
        ) : null}

        <Field label="Beispieltext zum Ausprobieren" htmlFor="sample">
          {(aria) => (
            <textarea
              {...aria}
              className="input textarea"
              rows={3}
              value={sample}
              onChange={(event) => {
                setSample(event.target.value);
                setSampleResult({ kind: 'idle' });
              }}
            />
          )}
        </Field>

        <Button
          variant="secondary"
          onClick={() => {
            void runSample();
          }}
        >
          Ausdruck auf den Beispieltext anwenden
        </Button>

        <SampleOutcome result={sampleResult} />
      </Section>

      <Section title="Woher das Token kommt">
        <ol className="steps">
          <li>SuperTakt öffnen, Einstellungen aufrufen.</li>
          <li>Ein Token erzeugen. Es wird genau einmal angezeigt.</li>
          <li>Es hier oben eintragen und „Verbindung prüfen" drücken.</li>
        </ol>
        <p className="pane-note">
          Ein neu erzeugtes Token macht das alte sofort ungültig. Bis das neue hier steht,
          funktioniert das Add-in nicht — das ist gewollt und kein Fehler.
        </p>
      </Section>
    </div>
  );
}

/**
 * Was der Ausdruck aus dem Beispieltext geholt hat.
 *
 * Beide Werte sind Ausschnitte aus dem Textfeld darüber (T-119). Das ist im
 * Regelfall der eigene Beispieltext — aber genau dieses Feld füllt man, indem
 * man eine echte E-Mail hineinkopiert, und dann steht hier fremder Text mitten
 * in einem deutschen Satz.
 */
function SampleOutcome({ result }: { readonly result: SampleResult }) {
  switch (result.kind) {
    case 'idle':
      return null;
    case 'match':
      return (
        <Callout tone="success" title="Erkannt">
          Übernommen würde: <Foreign className="mono" value={result.value} />
        </Callout>
      );
    case 'implausible':
      return (
        <Callout tone="warning" title="Getroffen, aber nicht übernommen">
          Der Ausdruck liefert <Foreign className="mono" value={result.raw} />. {result.message}
        </Callout>
      );
    case 'none':
      return (
        <Callout tone="info" title="Kein Treffer">
          In diesem Beispieltext findet der Ausdruck nichts.
        </Callout>
      );
    case 'problem':
      return (
        <Callout tone="danger" title="Der Ausdruck lässt sich so nicht verwenden">
          {result.message}
        </Callout>
      );
    default:
      return null;
  }
}

export { DEFAULT_BASE_URL };
