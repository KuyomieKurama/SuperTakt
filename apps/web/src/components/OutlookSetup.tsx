import { useRef, useState } from "react";
import type { OutlookCertificateFacts } from "@takt/desktop/shell";
import { readOutlookCertificate, confirmOutlookCertificate } from "../app/connection";
import { useAsync, useMutation } from "../app/useAsync";
import { formatDateTime } from "../lib/format";
import { ConfirmDialog } from "./ConfirmDialog";
import { Button, Card, InlineMessage } from "./Primitives";

const HTTPS_LABEL: Readonly<Record<OutlookCertificateFacts["https"], string>> = {
  ready: "Die Add-in-Seite ist mit gültiger HTTPS-Verbindung erreichbar.",
  unreachable: "Der lokale Add-in-Server ist nicht erreichbar. Prüfen Sie, ob SuperTakt vollständig gestartet ist.",
  tls_failed: "Die HTTPS-Prüfung ist fehlgeschlagen. Prüfen Sie das Zertifikatsvertrauen und starten Sie Outlook nach einer Änderung neu.",
  certificate_mismatch: "Der Add-in-Server verwendet ein anderes Zertifikat. Bitte SuperTakt neu starten und erneut prüfen.",
  page_missing: "HTTPS funktioniert, aber die Add-in-Seite fehlt. Bitte die SuperTakt-Installation prüfen.",
  certificate_invalid: "Das Zertifikat ist nicht gültig oder entspricht nicht dem lokalen SuperTakt-Serverzertifikat.",
};

export function OutlookSetup() {
  const status = useAsync(readOutlookCertificate, []);
  const mutation = useMutation();
  const inFlight = useRef(false);
  const [confirmed, setConfirmed] = useState<OutlookCertificateFacts | null>(null);

  const trust = () => {
    if (confirmed === null || inFlight.current) return;
    inFlight.current = true;
    void mutation.run(async () => {
      const result = await confirmOutlookCertificate(confirmed.fingerprint);
      status.replace(result);
      setConfirmed(null);
    }).finally(() => { inFlight.current = false; });
  };

  const value = status.state.status === "ready" ? status.state.value : undefined;
  const facts = value?.supported === true ? value : null;
  return (
    <>
      <Card title="Outlook lokal einrichten" description="Zertifikat prüfen, Vertrauen bestätigen und anschließend das Add-in verbinden.">
        <p role="status">{status.state.status === "loading" ? "Lokales Zertifikat und HTTPS-Zugang werden geprüft …" : ""}</p>
        {status.state.status === "error" ? <InlineMessage tone="danger" title="Die Einrichtung konnte nicht geprüft werden">{status.state.message}</InlineMessage> : null}
        {value === null ? <p>Öffnen Sie diese Einstellungen in der SuperTakt-Desktop-App. Im Browser kann SuperTakt den Windows-Zertifikatsspeicher nicht prüfen.</p> : null}
        {value?.supported === false ? <p>Die geführte Zertifikatseinrichtung ist für Windows verfügbar. Auf diesem Betriebssystem muss das lokale Zertifikat in den Systemeinstellungen freigegeben werden.</p> : null}
        {facts === null ? null : (
          <>
            <dl className="facts">
              <dt>Lokale Adresse</dt><dd>{"https://localhost:17844/index.html"}</dd>
              <dt>Ausgestellt für</dt><dd>{facts.subject}</dd>
              <dt>Aussteller</dt><dd>{facts.issuer}</dd>
              <dt>Gültig ab</dt><dd>{formatDateTime(facts.validFrom)}</dd>
              <dt>Gültig bis</dt><dd>{formatDateTime(facts.validUntil)}</dd>
              <dt>SHA-256-Fingerabdruck</dt><dd className="outlook-setup__fingerprint mono">{facts.fingerprint.match(/.{2}/g)?.join(":")}</dd>
              <dt>Vertrauen im Windows-Benutzerkonto</dt><dd>{facts.installed ? "Hinterlegt" : "Nicht hinterlegt"}</dd>
            </dl>
            <InlineMessage tone={facts.https === "ready" ? "success" : "warning"} title={facts.https === "ready" ? "HTTPS-Zugang geprüft" : "HTTPS-Zugang noch nicht bereit"}>
              {HTTPS_LABEL[facts.https]}
            </InlineMessage>
            {!facts.installed && facts.validNow && facts.validProfile && facts.https !== "ready" ? (
              <Button disabled={mutation.busy} onClick={() => { mutation.clearError(); setConfirmed(facts); }}>Zertifikat prüfen und vertrauen …</Button>
            ) : null}
            <p className="field__hint">Nach erfolgreicher HTTPS-Prüfung importieren Sie manifest.xml in Outlook und tragen das unten erzeugte Zugangstoken in den Add-in-Einstellungen ein. Das Zertifikat bestätigt die lokale Verbindung; die Anmeldung beim Add-in erfolgt weiterhin mit dem Token.</p>
          </>
        )}
        <Button variant="secondary" disabled={mutation.busy || status.state.status === "loading" || (status.state.status === "ready" && status.state.refreshing)} onClick={status.reload}>Erneut prüfen</Button>
      </Card>
      <ConfirmDialog
        open={confirmed !== null}
        title="Diesem lokalen Zertifikat vertrauen?"
        description={<span>Bestätigen Sie den SHA-256-Fingerabdruck des oben gezeigten Zertifikats: <span className="outlook-setup__fingerprint mono">{confirmed?.fingerprint.match(/.{2}/g)?.join(":")}</span></span>}
        consequence="Dieses Zertifikat wird im Zertifikatsspeicher Ihres Windows-Benutzerkontos als vertrauenswürdig hinterlegt. Es gilt für localhost und 127.0.0.1. SuperTakt prüft danach die HTTPS-Verbindung erneut."
        acknowledgeLabel="Ich habe die Zertifikatsdaten geprüft und möchte diesem Zertifikat vertrauen."
        confirmLabel="Zertifikat vertrauen"
        busy={mutation.busy}
        refusal={mutation.error ?? undefined}
        onConfirm={trust}
        onCancel={() => setConfirmed(null)}
      />
    </>
  );
}
