import { useState } from "react";
import { errorMessage, isServiceError } from "../../api/client";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Button, Card, InlineMessage } from "../../shared/ui/Primitives";
import { useToasts } from "../../app/ToastContext";
import { useAsync } from "../../app/useAsync";
import { formatDateTime } from "../../lib/format";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { getTokenStatus, rotateToken } from "./api";
import { settingsTexts } from "./texts";
/* Outlook-Add-in (S-13)                                                */

/**
 * Das Add-in-Token steht genau einmal auf dem Bildschirm.
 *
 * Es ist **nicht** Teil der Einstellungen (E-009): Es liegt in einer eigenen
 * Datei und hat eine eigene Route, die nur mit dem Sitzungsgeheimnis
 * erreichbar ist. Der Klartext existiert nach der Antwort nicht mehr — auch
 * nicht für diese Oberfläche. Er wird deshalb angezeigt, nicht gespeichert:
 * kein `localStorage`, kein zweiter Abruf, keine Adresszeile.
 *
 * Ein neues Token macht das alte **sofort** ungültig. Es gibt genau einen
 * gültigen Abdruck, keine Nachfrist. Der Bestätigungsdialog sagt das, bevor
 * geklickt wird — danach funktioniert das Add-in erst wieder, wenn das neue
 * Token dort eingetragen ist.
 */
export function AddinSettings() {
  const toasts = useToasts();
  const status = useAsync(() => getTokenStatus(), []);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");
  const text = settingsTexts();

  return (
    <Card title={text.addinTitle} description={text.addinLead}>
      <AsyncBoundary state={status.state} label={text.tokenLoading} rows={2} onRetry={status.reload}>
        {(value) => (
          <>
            {value.unreadable ? (
              <InlineMessage tone="danger" title={text.tokenUnreadable}>
                {text.tokenUnreadableBody}
              </InlineMessage>
            ) : null}

            <dl className="facts">
              <dt>{text.configured}</dt>
              <dd>{value.configured ? text.yes : text.notConfigured}</dd>
              <dt>{text.issued}</dt>
              <dd>{value.issuedAt === null ? "—" : formatDateTime(value.issuedAt)}</dd>
              <dt>{text.lastUsed}</dt>
              <dd>
                {value.lastUsedAt === null
                  ? text.neverUsed
                  : formatDateTime(value.lastUsedAt)}
              </dd>
              <dt>{text.number}</dt>
              <dd>{value.generation === 0 ? "—" : text.tokenNumber(value.generation)}</dd>
            </dl>

            {issued === null ? null : (
              <InlineMessage tone="warning" title={text.tokenOnceTitle}>
                <p>{text.tokenOnceBody}</p>
                <p className="token-value mono" data-testid="addin-token">
                  {issued}
                </p>
                <div className="token-actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(issued)
                        .then(() => setCopyState("done"))
                        .catch(() => setCopyState("failed"));
                    }}
                  >
                    {text.toClipboard}
                  </Button>
                  <span className="token-actions__hint" role="status">
                    {copyState === "done"
                      ? text.copied
                      : copyState === "failed"
                        ? text.copyFailed
                        : ""}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setIssued(null)}>
                    {text.hide}
                  </Button>
                </div>
              </InlineMessage>
            )}

            <div className="card__actions">
              <Button variant="secondary" iconStart="shield" onClick={() => setConfirmOpen(true)}>
                {value.configured ? text.newToken : text.createToken}
              </Button>
            </div>
          </>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title={text.newTokenTitle}
        description={text.newTokenLead}
        consequence={text.newTokenConsequence}
        confirmLabel={text.createToken}
        acknowledgeLabel={text.newTokenAcknowledge}
        busy={busy}
        onConfirm={() => {
          setBusy(true);
          void rotateToken()
            .then((result) => {
              setIssued(result.token);
              setCopyState("idle");
              setConfirmOpen(false);
              status.reload();
              toasts.show({
                tone: "warning",
                title: settingsTexts().tokenCreated,
                body: settingsTexts().tokenCreatedBody,
              });
            })
            .catch((cause: unknown) => toasts.failure(settingsTexts().tokenNotCreated, errorMessage(cause), isServiceError(cause)))
            .finally(() => setBusy(false));
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
