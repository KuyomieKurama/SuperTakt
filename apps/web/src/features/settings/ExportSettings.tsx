import { useEffect, useMemo, useState } from "react";
import { listExportTemplates, updateSettings } from "../../api/endpoints";
import type { RoundingMode } from "../../api/types";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Select } from "../../shared/ui/Select";
import { Button, Card, InlineMessage } from "../../shared/ui/Primitives";
import { ExportDirectoryField } from "../export/ExportDirectoryField";
import { adviseExportDirectory } from "../export/exportDirectoryAdvice";
import { useRefresh } from "../../app/RefreshContext";
import { navigate } from "../../app/router";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useAsync, useMutation } from "../../app/useAsync";
import { ROUNDING_MODE_LABEL } from "../../lib/labels";
import { foreignText } from "../../lib/foreign";
/* ==================================================================== */
/* Export — Ordner, Vorlage, Rundung                                    */
/* ==================================================================== */

/**
 * Der Bereich „Export" von S-09.
 *
 * **Der Exportordner wird gewählt, nicht getippt** (Befund S-04). Das Feld
 * liegt in `features/export/ExportDirectoryField.tsx` und wählt über den
 * Systemdialog. Die Beurteilung des Pfades steht in
 * `features/export/exportDirectoryAdvice.ts` und ist **die Erklärung, nicht die
 * Grenze** — die zieht der Dienst, und er zieht sie noch einmal, wenn hier
 * alles gut aussieht.
 *
 * Vorgeschichte: `docs/decisions/settings.md`.
 */
export function ExportSettings() {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();
  const mutation = useMutation();

  const structureValue = structure.state.status === "ready" ? structure.state.value : null;
  const settings = structureValue?.settings ?? null;
  const directoryState = structureValue?.exportDirectoryState ?? null;
  /* T-039 — was am Ordner belegt ist. Leer heißt „nichts belegt". */
  const directoryTraits = structureValue?.exportDirectoryTraits ?? [];

  const [directory, setDirectory] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [rounding, setRounding] = useState<RoundingMode>("up");
  /**
   * Der Pfad, für den der Benutzer die Rückfrage bereits beantwortet hat.
   *
   * Der ganze Pfad und kein Merker: Wer nach der Bestätigung einen **anderen**
   * Netzordner wählt, wird wieder gefragt. Eine einmal gesetzte Zustimmung,
   * die für jeden künftigen Ordner gilt, wäre keine Rückfrage mehr.
   */
  const [acknowledgedDirectory, setAcknowledgedDirectory] = useState<string | null>(null);
  const [confirmDirectoryOpen, setConfirmDirectoryOpen] = useState(false);

  useEffect(() => {
    if (settings === null) return;
    setDirectory(settings.exportDirectory ?? "");
    setTemplateId(settings.activeExportTemplateId ?? "");
    setRounding(settings.roundingMode);
    // Ein gespeicherter Ordner ist ein bestätigter Ordner: Er kam entweder
    // durch diese Rückfrage oder er stand schon vor T-036 da. Sonst fragte
    // Takt nach jedem Neuladen erneut nach demselben Pfad.
    setAcknowledgedDirectory(settings.exportDirectory);
  }, [settings]);

  const templates = useAsync(() => listExportTemplates(), []);

  const trimmedDirectory = directory.trim();
  const advice = useMemo(() => adviseExportDirectory(directory), [directory]);
  const directoryUnsaved = trimmedDirectory !== (settings?.exportDirectory ?? "");

  /*
   * Der Dienst prüft den Pfad ohnehin noch einmal (`checkExportDirectory`).
   * Diese Sperre ist nicht seine Vertretung, sondern die Antwort auf die
   * Frage, warum der Knopf nicht geht — ein Speichern, das der Dienst mit
   * einer Fehlermeldung beantwortet, erklärt nichts.
   */
  const blocked = advice.verdict === "reject";
  const needsConfirmation = advice.verdict === "confirm" && trimmedDirectory !== acknowledgedDirectory;

  const persist = (): void => {
    void mutation.run(async () => {
      await updateSettings({
        exportDirectory: trimmedDirectory.length === 0 ? null : trimmedDirectory,
        activeExportTemplateId: templateId.length === 0 ? null : templateId,
        roundingMode: rounding,
      });
      setAcknowledgedDirectory(trimmedDirectory.length === 0 ? null : trimmedDirectory);
      structure.reload();
      bump();
      toasts.success("Einstellungen gespeichert.");
    });
  };

  const save = (): void => {
    if (blocked) return;
    if (needsConfirmation) {
      setConfirmDirectoryOpen(true);
      return;
    }
    persist();
  };

  /* Der schwerste Befund trägt den Text der Rückfrage. */
  const leadingConcern = advice.concerns[0] ?? null;

  return (
    <Card
      title="Export"
      description="Vor jedem Lauf erneut geprüft."
      actions={
        <Button
          variant="primary"
          loading={mutation.busy}
          disabled={blocked}
          onClick={save}
        >
          Speichern
        </Button>
      }
    >
      <ExportDirectoryField
        value={directory}
        onChange={setDirectory}
        advice={advice}
        serviceState={directoryState}
        serviceTraits={directoryTraits}
        unsaved={directoryUnsaved}
        disabled={mutation.busy}
      />

      {/*
        Die Meldefläche steht **immer** im Baum, auch leer (B-5, T-162, T-186;
        Befund O-GQ). Bis T-191 entstand dieses `role="status"` zusammen mit
        seinem Satz — und eine Region, die eine Vorlesehilfe in dem Augenblick
        noch nicht kennt, meldet ihre erste Änderung nicht. Der Satz erscheint
        aber genau dann, während die Karte schon steht: wenn der eingetragene
        Ordner abgelehnt wird. Er blieb damit stumm.

        Hier reicht der Absatz selbst als Region — anders als in `TextField`
        braucht er keinen Behälter, weil kein `aria-describedby` auf ihn zeigt.
        Leer hat er die Höhe null, und seine Ränder fallen mit denen des
        nächsten Feldes zusammen; am Bild ändert sich dadurch nichts.
      */}
      <p className="field__error" role="status">
        {blocked
          ? "Solange dieser Ordner eingetragen ist, lässt sich nichts speichern. Wählen Sie einen anderen — die übrigen Einstellungen auf dieser Karte gehen dabei nicht verloren."
          : null}
      </p>

      <Select
        label="Aktive Exportvorlage"
        value={templateId}
        onChange={setTemplateId}
        options={[
          { value: "", label: "Mitgelieferte Standardvorlage" },
          ...(templates.state.status === "ready"
            ? templates.state.value.map((template) => ({
                value: template.id,
                label: template.isBuiltin
                    ? `${foreignText(template.name)} (mitgeliefert)`
                    : foreignText(template.name),
              }))
            : []),
        ]}
      />

      {/*
        Der Vorlageneditor liegt beim Export und nicht hier (T-005,
        Abschnitt 7): Er braucht die Vorschau auf tatsaechlich offenen
        Buchungen, und das sind die Daten von S-07. Ein Verweis steht
        trotzdem hier, damit auch findet, wer in den Einstellungen sucht.
      */}
      <p className="field__hint">
        Welche Felder eine Vorlage enthaelt, legen Sie im Vorlageneditor fest.{" "}
        <Button
          size="sm"
          variant="ghost"
          iconStart="pencil"
          onClick={() => navigate("templates", templateId.length === 0 ? undefined : templateId)}
        >
          Vorlagen bearbeiten
        </Button>
      </p>

      <Select
        label="Rundung vor dem Export"
        value={rounding}
        onChange={(next) => setRounding(next as RoundingMode)}
        options={[
          { value: "up", label: `${ROUNDING_MODE_LABEL.up} — immer auf die nächste Viertelstunde` },
          { value: "nearest", label: `${ROUNDING_MODE_LABEL.nearest} — zur nächstgelegenen` },
        ]}
      />

      <InlineMessage tone="info" title="Gerundet wird die Tagesgruppe, nicht die einzelne Buchung">
        Alle noch offenen Buchungen desselben Todos an einem Kalendertag werden addiert, erst dann
        wird die Summe gerundet — mindestens 0,25. Zehn, zwanzig und fünf Minuten ergeben 0,75 und
        nicht dreimal 0,25.
      </InlineMessage>

      {mutation.error === null ? null : (
        <InlineMessage tone="danger" title="Die Einstellungen wurden nicht gespeichert">
          {mutation.error}
        </InlineMessage>
      )}

      {/*
        B-5.2 Punkt 2, wörtlich: „Nicht verbieten … aber niemals stillschweigend
        zulassen." Die Rückfrage sperrt nichts — sie sagt, was der Ordner
        bedeutet, und lässt den Benutzer entscheiden (E-011).
      */}
      <ConfirmDialog
        open={confirmDirectoryOpen && leadingConcern !== null}
        tone="danger"
        title={leadingConcern?.title ?? "Diesen Ordner einstellen?"}
        description={leadingConcern?.body ?? ""}
        consequence="Die Exportdatei enthält lesbare Kundennotizen. Base64 ist eine Kodierung, keine Verschlüsselung — wer die Datei öffnen kann, kann sie lesen."
        confirmLabel="Ordner trotzdem einstellen"
        cancelLabel="Anderen Ordner wählen"
        acknowledgeLabel="Ich weiß, dass die Kundennotizen dorthin gelangen, und will es so."
        busy={mutation.busy}
        onConfirm={() => {
          setAcknowledgedDirectory(trimmedDirectory);
          setConfirmDirectoryOpen(false);
          persist();
        }}
        onCancel={() => setConfirmDirectoryOpen(false)}
      />
    </Card>
  );
}
