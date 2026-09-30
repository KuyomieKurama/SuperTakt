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
import { ServiceText } from "../../shared/ui/ServiceText";
import { InfoHint } from "../../shared/ui/InfoHint";
import { settingsTexts } from "./texts";
/* Daten — Sicherung, Wiederherstellung und Fremdimport                 */

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
    <InlineMessage tone={result.warnings.length === 0 ? "success" : "warning"} title={settingsTexts().importDone}>
      <p>{settingsTexts().importCounts(result.todos, result.projects, result.tags, result.timeEntries)}</p>
      {result.rejectedTimeEntries > 0 ? <p>{settingsTexts().importRejectedOver24h(result.rejectedTimeEntries)}</p> : null}
      {result.warnings.length === 0 ? null : (
        <ul>{result.warnings.map((warning, index) => <li key={index}><ServiceText text={warning} /></li>)}</ul>
      )}
    </InlineMessage>
  );
}

export function DataTransferSettings() {
  const structure = useStructure();
  const { bump } = useRefresh();
  const toasts = useToasts();
  const mutation = useMutation();
  const text = settingsTexts();
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
    toasts.success(settingsTexts().dataImported);
  };

  const exportArchive = (): void => {
    setFileError(null);
    void mutation.run(async () => {
      saveJsonFile(await exportDataArchive());
      toasts.success(settingsTexts().backupCreated);
    });
  };

  const readJson = async (file: File): Promise<unknown> => JSON.parse(await file.text()) as unknown;

  const chooseArchive = (files: FileList | null): void => {
    const file = files?.[0];
    if (file === undefined) return;
    setFileError(null);
    void readJson(file).then(setPendingArchive).catch(() => setFileError(settingsTexts().invalidJson));
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
      <Card title={text.backupTitle} actions={<InfoHint label={`${text.infoHint}: ${text.backupTitle}`}>{text.backupLead}</InfoHint>}>
        <p className="field__hint">{text.backupHint}</p>
        <div className="data-transfer__actions">
          <Button variant="primary" iconStart="download" loading={mutation.busy} onClick={exportArchive}>{text.downloadBackup}</Button>
          <Button iconStart="folder-open" disabled={mutation.busy} onClick={() => archiveInput.current?.click()}>{text.restoreBackup}</Button>
          <input ref={archiveInput} className="data-transfer__input" type="file" accept="application/json,.json" onChange={(event) => { chooseArchive(event.currentTarget.files); event.currentTarget.value = ""; }} />
        </div>
      </Card>

      <Card title={text.todoistTitle} actions={<InfoHint label={`${text.infoHint}: ${text.todoistTitle}`}>{text.addsToData}</InfoHint>}>
        <p className="field__hint">{text.todoistHint}</p>
        <Button iconStart="folder-open" disabled={mutation.busy} onClick={() => todoistInput.current?.click()}>{text.chooseTodoist}</Button>
        <input ref={todoistInput} className="data-transfer__input" type="file" accept="text/csv,.csv" multiple onChange={(event) => { chooseTodoist(event.currentTarget.files); event.currentTarget.value = ""; }} />
      </Card>

      <Card title={text.superProductivityTitle} actions={<InfoHint label={`${text.infoHint}: ${text.superProductivityTitle}`}>{text.addsToData}</InfoHint>}>
        <p className="field__hint">{text.superProductivityHint}</p>
        <p className="field__hint">{text.outlookBridgeHint}</p>
        <TextField
          label={text.callPattern}
          value={callPattern}
          onChange={changeCallPattern}
          maxLength={512}
          disabled={mutation.busy}
          hint={text.callPatternHint}
        />
        <label className="choice__option">
          <input type="checkbox" checked={excludeTransferred} disabled={mutation.busy} onChange={event => setExcludeTransferred(event.target.checked)} />
          <span>{text.excludeTransferred}</span>
        </label>
        <p className="field__hint">{text.excludeTransferredHint}</p>
        <Button iconStart="folder-open" disabled={mutation.busy} onClick={() => superProductivityInput.current?.click()}>{text.chooseSuperProductivity}</Button>
        <input ref={superProductivityInput} className="data-transfer__input" type="file" accept="application/json,.json" onChange={(event) => { chooseSuperProductivity(event.currentTarget.files); event.currentTarget.value = ""; }} />
      </Card>

      {fileError === null && mutation.error === null ? null : (
        <InlineMessage tone="danger" title={text.fileFailed}>
          {fileError ?? <ServiceText text={mutation.error ?? ""} fromService={mutation.errorFromService} />}
        </InlineMessage>
      )}
      <ImportResult result={result} />

      <ConfirmDialog
        open={pendingArchive !== null}
        tone="danger"
        title={text.restoreTitle}
        description={text.restoreLead}
        consequence={text.restoreConsequence}
        acknowledgeLabel={text.restoreAcknowledge}
        confirmLabel={text.replaceData}
        busy={mutation.busy}
        onConfirm={restoreArchive}
        onCancel={() => setPendingArchive(null)}
      />
    </>
  );
}
