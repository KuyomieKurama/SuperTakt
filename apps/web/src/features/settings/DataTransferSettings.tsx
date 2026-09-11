import { DEFAULT_IMPORT_CALL_PATTERN } from "@takt/domain";
import { useRef, useState } from "react";
import { TextField } from "../../shared/ui/FormDialog";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Button, Card, InlineMessage } from "../../shared/ui/Primitives";
import { useRefresh } from "../../app/RefreshContext";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useMutation } from "../../app/useAsync";
import {
  exportDataArchive,
  importDataArchive,
  importSuperProductivity,
  importTodoistFiles,
  type DataImportSummary,
} from "./api";
/* ==================================================================== */
/* Daten — Sicherung, Wiederherstellung und Fremdimport                 */
/* ==================================================================== */

function saveJsonFile(value: unknown): void {
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  const blob = new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `takt-datensicherung-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ImportResult({ result }: { readonly result: DataImportSummary | null }) {
  if (result === null) return null;
  return (
    <InlineMessage tone={result.warnings.length === 0 ? "success" : "warning"} title="Import abgeschlossen">
      {result.todos} Aufgaben, {result.projects} Projekte, {result.tags} Tags und {result.timeEntries} Zeitbuchungen wurden übernommen.
      {result.warnings.length === 0 ? null : (
        <ul>{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
      )}
    </InlineMessage>
  );
}

export function DataTransferSettings() {
  const structure = useStructure();
  const { bump } = useRefresh();
  const toasts = useToasts();
  const mutation = useMutation();
  const archiveInput = useRef<HTMLInputElement>(null);
  const todoistInput = useRef<HTMLInputElement>(null);
  const superProductivityInput = useRef<HTMLInputElement>(null);
  const [excludeTransferred, setExcludeTransferred] = useState(true);
  const [callPattern, setCallPattern] = useState(() => {
    try { return localStorage.getItem('supertakt.import.callPattern') ?? DEFAULT_IMPORT_CALL_PATTERN; }
    catch { return DEFAULT_IMPORT_CALL_PATTERN; }
  });
  const changeCallPattern = (value: string): void => {
    setCallPattern(value);
    try { localStorage.setItem('supertakt.import.callPattern', value); } catch { /* Remains editable for this import. */ }
  };
  const [pendingArchive, setPendingArchive] = useState<unknown | null>(null);
  const [result, setResult] = useState<DataImportSummary | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const refreshAfterImport = (summary: DataImportSummary): void => {
    setResult(summary);
    structure.reload();
    bump();
    toasts.success("Daten importiert.");
  };

  const exportArchive = (): void => {
    setFileError(null);
    void mutation.run(async () => {
      saveJsonFile(await exportDataArchive());
      toasts.success("Datensicherung erstellt.");
    });
  };

  const readJson = async (file: File): Promise<unknown> => JSON.parse(await file.text()) as unknown;

  const chooseArchive = (files: FileList | null): void => {
    const file = files?.[0];
    if (file === undefined) return;
    setFileError(null);
    void readJson(file).then(setPendingArchive).catch(() => setFileError("Die gewählte Datei enthält kein gültiges JSON."));
  };

  const restoreArchive = (): void => {
    if (pendingArchive === null) return;
    void mutation.run(async () => {
      const summary = await importDataArchive(pendingArchive);
      setPendingArchive(null);
      refreshAfterImport(summary);
    });
  };

  const chooseTodoist = (files: FileList | null): void => {
    if (files === null || files.length === 0) return;
    setFileError(null);
    void mutation.run(async () => {
      const selected = await Promise.all([...files].map(async (file) => ({ name: file.name, content: await file.text() })));
      refreshAfterImport(await importTodoistFiles(selected));
    });
  };

  const chooseSuperProductivity = (files: FileList | null): void => {
    const file = files?.[0];
    if (file === undefined) return;
    setFileError(null);
    void mutation.run(async () => refreshAfterImport(await importSuperProductivity(await readJson(file), excludeTransferred, callPattern)));
  };

  return (
    <>
      <Card title="SuperTakt-Datensicherung" description="Vollständiges, versioniertes JSON-Archiv.">
        <p className="field__hint">Enthält Aufgaben, Vermerke, Tags, Strukturen, Zeitbuchungen, Exporteinstellungen, Protokolle und Bildanhänge. Eine Wiederherstellung ersetzt den aktuellen Bestand.</p>
        <div className="data-transfer__actions">
          <Button variant="primary" iconStart="download" loading={mutation.busy} onClick={exportArchive}>Sicherung herunterladen</Button>
          <Button iconStart="folder-open" disabled={mutation.busy} onClick={() => archiveInput.current?.click()}>Sicherung wiederherstellen</Button>
          <input ref={archiveInput} className="data-transfer__input" type="file" accept="application/json,.json" onChange={(event) => { chooseArchive(event.currentTarget.files); event.currentTarget.value = ""; }} />
        </div>
      </Card>

      <Card title="Aus Todoist importieren" description="Ergänzt den vorhandenen Bestand.">
        <p className="field__hint">Entpacken Sie das Todoist-Backup und wählen Sie eine oder mehrere CSV-Dateien. Projekte werden Pools, Bereiche und Prioritäten werden Tags; Unteraufgaben bleiben im Vermerk nachvollziehbar.</p>
        <Button iconStart="folder-open" disabled={mutation.busy} onClick={() => todoistInput.current?.click()}>Todoist-CSV auswählen</Button>
        <input ref={todoistInput} className="data-transfer__input" type="file" accept="text/csv,.csv" multiple onChange={(event) => { chooseTodoist(event.currentTarget.files); event.currentTarget.value = ""; }} />
      </Card>

      <Card title="Aus Super Productivity importieren" description="Ergänzt den vorhandenen Bestand.">
        <p className="field__hint">Wählen Sie eine JSON-Datensicherung aus Super Productivity. Projekte, Bereiche, Tags, Fristen, Vermerke, Erledigt-Zustand und erfasste Zeiten werden übernommen.</p>
        <p className="field__hint">Leistungsnachweise aus OutlookBridge werden dem passenden Buchungstag zugeordnet. Ursprüngliche Notizen bleiben als Vermerk erhalten.</p>
        <TextField
          label="Call-Nummer aus Titel erkennen (Regex)"
          value={callPattern}
          onChange={changeCallPattern}
          maxLength={512}
          disabled={mutation.busy}
          hint="Die erste Klammergruppe liefert die Call-Nummer, ohne Gruppe der gesamte Treffer. Groß-/Kleinschreibung wird ignoriert. Leer lassen zum Ausschalten."
        />
        <label className="choice__option">
          <input type="checkbox" checked={excludeTransferred} disabled={mutation.busy} onChange={event => setExcludeTransferred(event.target.checked)} />
          <span>Bereits übertragene Zeiten vom erneuten Export ausnehmen</span>
        </label>
        <p className="field__hint">OutlookBridge-Markierungen „Eingetragen“ werden mit Herkunftsvermerk als ausgebucht übernommen. Ausgeschaltet werden alle Zeiten wieder offen importiert.</p>
        <Button iconStart="folder-open" disabled={mutation.busy} onClick={() => superProductivityInput.current?.click()}>Super-Productivity-JSON auswählen</Button>
        <input ref={superProductivityInput} className="data-transfer__input" type="file" accept="application/json,.json" onChange={(event) => { chooseSuperProductivity(event.currentTarget.files); event.currentTarget.value = ""; }} />
      </Card>

      {fileError === null && mutation.error === null ? null : (
        <InlineMessage tone="danger" title="Die Datei konnte nicht verarbeitet werden">{fileError ?? mutation.error}</InlineMessage>
      )}
      <ImportResult result={result} />

      <ConfirmDialog
        open={pendingArchive !== null}
        tone="danger"
        title="SuperTakt-Datensicherung wiederherstellen?"
        description="Der aktuelle Bestand wird vollständig durch den Inhalt der gewählten Sicherung ersetzt."
        consequence="Aufgaben und Zeitbuchungen, die nur im aktuellen Bestand vorkommen, sind danach nicht mehr vorhanden."
        acknowledgeLabel="Ich habe den aktuellen Bestand bei Bedarf gesichert."
        confirmLabel="Bestand ersetzen"
        busy={mutation.busy}
        onConfirm={restoreArchive}
        onCancel={() => setPendingArchive(null)}
      />
    </>
  );
}
