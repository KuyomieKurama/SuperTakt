import { useState } from "react";
import { errorMessage } from "../../api/client";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Button, Card, InlineMessage } from "../../shared/ui/Primitives";
import { useToasts } from "../../app/ToastContext";
import { useAsync } from "../../app/useAsync";
import { formatDateTime } from "../../lib/format";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { getTokenStatus, rotateToken } from "./api";
/* ==================================================================== */
/* Outlook-Add-in (S-13)                                                */
/* ==================================================================== */

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

  return (
    <Card
      title="Outlook-Add-in"
      description="Getrennt vom Zugang dieser Oberfläche."
    >
      <AsyncBoundary state={status.state} label="Tokenzustand wird geladen" rows={2} onRetry={status.reload}>
        {(value) => (
          <>
            {value.unreadable ? (
              <InlineMessage tone="danger" title="Die Tokendatei ist nicht lesbar">
                SuperTakt erzeugt von sich aus kein neues Token — das würde ein eingerichtetes Add-in
                ohne Vorwarnung aussperren. Erzeugen Sie eines von Hand, wenn Sie das Add-in
                neu einrichten wollen.
              </InlineMessage>
            ) : null}

            <dl className="facts">
              <dt>Eingerichtet</dt>
              <dd>{value.configured ? "Ja" : "Nein — das Add-in kann sich noch nicht ausweisen."}</dd>
              <dt>Ausgestellt</dt>
              <dd>{value.issuedAt === null ? "—" : formatDateTime(value.issuedAt)}</dd>
              <dt>Zuletzt benutzt</dt>
              <dd>
                {value.lastUsedAt === null
                  ? "Noch nie. Wenn das Add-in eingerichtet ist, spricht bisher niemand damit."
                  : formatDateTime(value.lastUsedAt)}
              </dd>
              <dt>Nummer</dt>
              <dd>{value.generation === 0 ? "—" : `${String(value.generation)}. Token`}</dd>
            </dl>

            {issued === null ? null : (
              <InlineMessage tone="warning" title="Dieses Token steht genau jetzt hier — und nie wieder">
                <p>
                  Tragen Sie es in den Add-in-Einstellungen in Outlook ein. Danach ist der Klartext
                  weg; er wird nirgends gespeichert, auch nicht von dieser Seite.
                </p>
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
                    In die Zwischenablage
                  </Button>
                  <span className="token-actions__hint" role="status">
                    {copyState === "done"
                      ? "Kopiert."
                      : copyState === "failed"
                        ? "Das Kopieren hat nicht geklappt — markieren Sie den Wert von Hand."
                        : ""}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setIssued(null)}>
                    Ausblenden
                  </Button>
                </div>
              </InlineMessage>
            )}

            <div className="card__actions">
              <Button variant="secondary" iconStart="shield" onClick={() => setConfirmOpen(true)}>
                {value.configured ? "Neues Token erzeugen" : "Token erzeugen"}
              </Button>
            </div>
          </>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title="Neues Add-in-Token erzeugen?"
        description="Es entsteht genau ein gültiger Abdruck. Das bisherige Token wird im selben Augenblick ungültig."
        consequence="Das Add-in funktioniert erst wieder, wenn Sie das neue Token dort eingetragen haben. Eine Nachfrist gibt es nicht."
        confirmLabel="Token erzeugen"
        acknowledgeLabel="Ich habe Outlook zur Hand und trage das neue Token gleich ein."
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
                title: "Neues Token erzeugt.",
                body: "Das alte ist ab sofort ungültig. Der Klartext steht nur jetzt auf dem Bildschirm.",
              });
            })
            .catch((cause: unknown) => toasts.failure("Das Token wurde nicht erzeugt", errorMessage(cause)))
            .finally(() => setBusy(false));
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
