import { useRef, useState } from "react";
import type { OutlookCertificateFacts, OutlookCertificateResult } from "@takt/desktop/shell";
import { readOutlookCertificate, confirmOutlookCertificate } from "../../app/connection";
import { useAsync, useMutation } from "../../app/useAsync";
import { formatDateTime } from "../../lib/format";
import { foreignText, foreignTextFrom } from "../../lib/foreign";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Button, Card, InlineMessage } from "../../shared/ui/Primitives";
import { settingsTexts } from "./texts";
import { ServiceText } from "../../shared/ui/ServiceText";


/**
 * Tauri gibt ein `Result<_, String>` auf der JavaScript-Seite als verworfenen
 * Promise mit genau diesem String zurück. `useAsync`/`useMutation` behandeln
 * absichtlich nur echte `Error`-Objekte als Anzeigetext; sonst könnten
 * technische Schlüssel beliebiger Aufrufe ungeprüft in der Oberfläche landen.
 *
 * Die beiden Outlook-Befehle sind die enge Ausnahme: Ihre Rust-Seite liefert
 * ausschließlich feste deutsche Benutzermeldungen. Weil der verworfene Wert an
 * der Tauri-Grenze trotzdem `unknown` ist, läuft er über dieselbe erklärte
 * Übergangsstelle für fremden Text wie andere untypisierte Werte und wird vor
 * der Anzeige sichtbar gemacht.
 */
function outlookShellError(cause: unknown): never {
  const message = foreignTextFrom(cause);
  if (message !== null) {
    throw new Error(foreignText(message));
  }
  throw cause;
}

async function inspectOutlookCertificate(): Promise<OutlookCertificateResult | null> {
  try {
    return await readOutlookCertificate();
  } catch (cause) {
    outlookShellError(cause);
  }
}

async function trustOutlookCertificate(fingerprint: string): Promise<OutlookCertificateResult> {
  try {
    return await confirmOutlookCertificate(fingerprint);
  } catch (cause) {
    outlookShellError(cause);
  }
}

export function OutlookSetup() {
  const status = useAsync(inspectOutlookCertificate, []);
  const mutation = useMutation();
  const inFlight = useRef(false);
  const [confirmed, setConfirmed] = useState<OutlookCertificateFacts | null>(null);

  const trust = () => {
    if (confirmed === null || inFlight.current) return;
    inFlight.current = true;
    void mutation.run(async () => {
      const result = await trustOutlookCertificate(confirmed.fingerprint);
      status.replace(result);
      setConfirmed(null);
    }).finally(() => { inFlight.current = false; });
  };

  const value = status.state.status === "ready" ? status.state.value : undefined;
  const facts = value?.supported === true ? value : null;
  const text = settingsTexts();
  return (
    <>
      <Card title={text.outlookTitle} description={text.outlookLead}>
        <p role="status">{status.state.status === "loading" ? text.outlookChecking : ""}</p>
        {status.state.status === "error" ? <InlineMessage tone="danger" title={text.outlookCheckFailed}>{status.state.message}</InlineMessage> : null}
        {value === null ? <p>{text.outlookBrowserOnly}</p> : null}
        {value?.supported === false ? <p>{text.outlookUnsupported}</p> : null}
        {facts === null ? null : (
          <>
            <dl className="facts">
              <dt>{text.localAddress}</dt><dd>{"https://localhost:17844/index.html"}</dd>
              <dt>{text.issuedFor}</dt><dd>{facts.subject}</dd>
              <dt>{text.issuer}</dt><dd>{facts.issuer}</dd>
              <dt>{text.validFrom}</dt><dd>{formatDateTime(facts.validFrom)}</dd>
              <dt>{text.validUntil}</dt><dd>{formatDateTime(facts.validUntil)}</dd>
              <dt>{text.fingerprint}</dt><dd className="outlook-setup__fingerprint mono">{facts.fingerprint.match(/.{2}/g)?.join(":")}</dd>
              <dt>{facts.trustScope === "linux_nss" ? text.trustLinux : facts.trustScope === "macos_user" ? text.trustMac : text.trustWindows}</dt><dd>{facts.installed ? text.stored : text.notStored}</dd>
            </dl>
            {facts.trustStores?.length ? <ul>{facts.trustStores.map((store, index) => <li key={index}>
              {store.kind === "chromium" ? text.storeChromium : store.kind === "firefox" ? text.storeFirefox : text.storeMac}: {store.installed ? text.trustStored : text.trustNotStored}
            </li>)}</ul> : null}
            {facts.toolsAvailable === false ? <InlineMessage tone="warning" title={text.toolsMissing}>{text.toolsMissingBody}</InlineMessage> : null}
            {facts.installFailed ? <InlineMessage tone="warning" title={text.trustIncomplete}>{text.trustIncompleteBody}</InlineMessage> : null}
            {facts.trustScope === "linux_nss" ? <p>{text.linuxImportHint}</p> : null}
            <InlineMessage tone={facts.https === "ready" && facts.installed ? "success" : "warning"} title={facts.https === "ready" ? text.httpsChecked : text.httpsNotReady}>
              {text.httpsState[facts.https]}
            </InlineMessage>
            {!facts.installed && facts.validNow && facts.validProfile ? (
              <Button disabled={mutation.busy || facts.toolsAvailable === false} onClick={() => { mutation.clearError(); setConfirmed(facts); }}>{text.checkAndTrust}</Button>
            ) : null}
            <p className="field__hint">{text.manifestHint}</p>
          </>
        )}
        <Button variant="secondary" disabled={mutation.busy || status.state.status === "loading" || (status.state.status === "ready" && status.state.refreshing)} onClick={status.reload}>{text.checkAgain}</Button>
      </Card>
      <ConfirmDialog
        open={confirmed !== null}
        title={text.trustTitle}
        description={<span>{text.trustLead}<span className="outlook-setup__fingerprint mono">{confirmed?.fingerprint.match(/.{2}/g)?.join(":")}</span></span>}
        consequence={confirmed?.trustScope === "linux_nss" ? text.trustLinuxConsequence : confirmed?.trustScope === "macos_user" ? text.trustMacConsequence : text.trustWindowsConsequence}
        acknowledgeLabel={text.trustAcknowledge}
        confirmLabel={text.trustConfirm}
        busy={mutation.busy}
        {...(mutation.error === null
          ? {}
          : { refusal: <ServiceText text={mutation.error} fromService={mutation.errorFromService} /> })}
        onConfirm={trust}
        onCancel={() => setConfirmed(null)}
      />
    </>
  );
}
