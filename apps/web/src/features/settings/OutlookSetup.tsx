import { useRef, useState } from "react";
import type { OutlookCertificateFacts, OutlookCertificateResult } from "@takt/desktop/shell";
import { readOutlookCertificate, confirmOutlookCertificate } from "../../app/connection";
import { useAsync, useMutation } from "../../app/useAsync";
import { formatDateTime } from "../../lib/format";
import { foreignText, foreignTextFrom } from "../../lib/foreign";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Button, Card, InlineMessage } from "../../shared/ui/Primitives";

const HTTPS_LABEL: Readonly<Record<OutlookCertificateFacts["https"], string>> = {
  ready: "Die Add-in-Seite ist über HTTPS erreichbar; das Serverzertifikat wurde geprüft.",
  unreachable: "Der lokale Add-in-Server ist nicht erreichbar. Prüfen Sie, ob SuperTakt vollständig gestartet ist.",
  tls_failed: "Die HTTPS-Prüfung ist fehlgeschlagen. Prüfen Sie das Zertifikatsvertrauen und starten Sie Outlook nach einer Änderung neu.",
  certificate_mismatch: "Der Add-in-Server verwendet ein anderes Zertifikat. Bitte SuperTakt neu starten und erneut prüfen.",
  page_missing: "HTTPS funktioniert, aber die Add-in-Seite fehlt. Bitte die SuperTakt-Installation prüfen.",
  certificate_invalid: "Das Zertifikat ist nicht gültig oder entspricht nicht dem lokalen SuperTakt-Serverzertifikat.",
};

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
  return (
    <>
      <Card title="Outlook lokal einrichten" description="Zertifikat prüfen, Vertrauen bestätigen und anschließend das Add-in verbinden.">
        <p role="status">{status.state.status === "loading" ? "Lokales Zertifikat und HTTPS-Zugang werden geprüft …" : ""}</p>
        {status.state.status === "error" ? <InlineMessage tone="danger" title="Die Einrichtung konnte nicht geprüft werden">{status.state.message}</InlineMessage> : null}
        {value === null ? <p>Öffnen Sie diese Einstellungen in der SuperTakt-Desktop-App. Im Browser kann SuperTakt die lokalen Zertifikatsspeicher nicht prüfen.</p> : null}
        {value?.supported === false ? <p>Für dieses Betriebssystem ist die Zertifikatseinrichtung noch nicht verfügbar. Unterstützt werden Windows, Linux und macOS.</p> : null}
        {facts === null ? null : (
          <>
            <dl className="facts">
              <dt>Lokale Adresse</dt><dd>{"https://localhost:17844/index.html"}</dd>
              <dt>Ausgestellt für</dt><dd>{facts.subject}</dd>
              <dt>Aussteller</dt><dd>{facts.issuer}</dd>
              <dt>Gültig ab</dt><dd>{formatDateTime(facts.validFrom)}</dd>
              <dt>Gültig bis</dt><dd>{formatDateTime(facts.validUntil)}</dd>
              <dt>SHA-256-Fingerabdruck</dt><dd className="outlook-setup__fingerprint mono">{facts.fingerprint.match(/.{2}/g)?.join(":")}</dd>
              <dt>{facts.trustScope === "linux_nss" ? "Vertrauen in den Browser-Zertifikatsspeichern" : facts.trustScope === "macos_user" ? "Vertrauen im Benutzerschlüsselbund" : "Vertrauen im Windows-Benutzerkonto"}</dt><dd>{facts.installed ? "Hinterlegt" : "Nicht hinterlegt"}</dd>
            </dl>
            {facts.trustStores?.length ? <ul>{facts.trustStores.map((store, index) => <li key={index}>
              {store.kind === "chromium" ? "Chromium / Chrome / Brave" : store.kind === "firefox" ? "Firefox-Profil" : "macOS-Benutzerschlüsselbund"}: {store.installed ? "Vertrauen hinterlegt" : "Vertrauen nicht hinterlegt"}
            </li>)}</ul> : null}
            {facts.toolsAvailable === false ? <InlineMessage tone="warning" title="Zertifikatswerkzeuge fehlen">Für die Einrichtung werden OpenSSL und unter Linux die NSS-Werkzeuge mit certutil benötigt. Installieren Sie die fehlenden Werkzeuge und wählen Sie „Erneut prüfen“.</InlineMessage> : null}
            {facts.installFailed ? <InlineMessage tone="warning" title="Vertrauen nicht vollständig hinterlegt">Mindestens ein Zertifikatsspeicher konnte nicht geändert werden. Schließen Sie den Browser vollständig und versuchen Sie es erneut. Erfolgreiche Einträge bleiben erhalten.</InlineMessage> : null}
            {facts.trustScope === "linux_nss" ? <p>Der Import gilt für den gemeinsamen Chromium-/Brave-Speicher und die hier erkannten Firefox-Profile dieses Benutzerkontos. Starten Sie den Browser nach dem Import vollständig neu. Separat abgeschottete Browser benötigen gegebenenfalls eine eigene Einrichtung.</p> : null}
            <InlineMessage tone={facts.https === "ready" && facts.installed ? "success" : "warning"} title={facts.https === "ready" ? "Lokaler HTTPS-Server geprüft" : "HTTPS-Zugang noch nicht bereit"}>
              {HTTPS_LABEL[facts.https]}
            </InlineMessage>
            {!facts.installed && facts.validNow && facts.validProfile ? (
              <Button disabled={mutation.busy || facts.toolsAvailable === false} onClick={() => { mutation.clearError(); setConfirmed(facts); }}>Zertifikat prüfen und vertrauen …</Button>
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
        consequence={confirmed?.trustScope === "linux_nss" ? "Dieses Zertifikat wird als vertrauenswürdiges Serverzertifikat in den oben genannten Browser-Zertifikatsspeichern Ihres Benutzerkontos hinterlegt. Es gilt für localhost und 127.0.0.1. Dafür sind keine Administratorrechte nötig. Anschließend prüft SuperTakt die Einträge und die HTTPS-Verbindung. Starten Sie den Browser danach neu." : confirmed?.trustScope === "macos_user" ? "Dieses Zertifikat wird für localhost im Benutzerschlüsselbund als vertrauenswürdig hinterlegt. Bestätigen Sie gegebenenfalls die macOS-Sicherheitsabfrage. Anschließend prüft SuperTakt Vertrauen und HTTPS-Verbindung." : "Dieses Zertifikat wird im Zertifikatsspeicher Ihres Windows-Benutzerkontos als vertrauenswürdig hinterlegt. Es gilt für localhost und 127.0.0.1. Bestätigen Sie auch die anschließend angezeigte Windows-Sicherheitsabfrage. Dafür haben Sie drei Minuten Zeit. SuperTakt prüft danach die HTTPS-Verbindung erneut."}
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
