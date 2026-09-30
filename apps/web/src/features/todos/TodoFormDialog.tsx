import { DateField } from "../../shared/ui/DateField";
import { listPriorities } from "../settings/api";
import {
  CALL_NUMBER_MAX_LENGTH,
  CALL_NUMBER_MIN_LENGTH,
  checkCallNumber,
  isCalendarDay,
  MAX_DUE_YEAR,
  MAX_TITLE_CHARACTERS,
  MIN_DUE_YEAR,
  type CallNumberRejection,
} from "@takt/domain";
import { useEffect, useId, useState } from "react";
import {
  createTodo,
  updateTodo,
} from "./api";
import { createTag } from "../tags/api";
import type { Id, Tag, Todo } from "../../api/types";
import { FormDialog, TextField } from "../../shared/ui/FormDialog";
import { NoteField } from "../../shared/ui/NoteField";
import { Select } from "../../shared/ui/Select";
import { TagInput } from "../tags/TagInput";
import { useAsync, useMutation } from "../../app/useAsync";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useRefresh } from "../../app/RefreshContext";
import { quotedName } from "../../lib/foreign";
import { formatList } from "../../lib/format";
import { todoTexts } from "./texts";
import { ServiceText } from "../../shared/ui/ServiceText";

/** Names in quotes, enumerated in the UI language ("„A“ und „B“" / "“A” and “B”"). */
function quotedList(names: readonly string[]): string {
  return formatList(names.map((name) => quotedName(name)));
}

/** The UI sentence for a call number the domain rejects (E-121 point 9). */
function callNumberMessage(reason: CallNumberRejection): string {
  const rejection = todoTexts().callNumberRejection;
  if (reason === "too_short") return rejection.too_short(CALL_NUMBER_MIN_LENGTH);
  if (reason === "too_long") return rejection.too_long(CALL_NUMBER_MAX_LENGTH);
  return rejection[reason];
}

/**
 * Takt — Todo anlegen und ändern (I-01, I-02).
 *
 * Ein Dialog für beide Fälle, weil beide dieselben Felder haben. Der
 * Unterschied steht in der Überschrift und im Knopf, nicht im Formular.
 *
 * **Der Vermerk erscheint nur beim Anlegen.** Danach gehört er in die
 * Detailansicht, wo er Platz hat und automatisch gespeichert wird — und wo er
 * neben der Leistung steht, damit der Unterschied sichtbar bleibt (E-016).
 *
 * **Standard-Tags werden nicht angeboten.** Sie ergänzt der Dienst (A-9.5),
 * damit sie auf jedem Weg greifen, auch aus dem Add-in. Sie hier zusätzlich
 * vorzuwählen hieße, dieselbe Regel zweimal zu führen; der Hinweistext sagt
 * stattdessen, dass sie hinzukommen.
 */

export interface TodoFormDialogProps {
  readonly open: boolean;
  /** Vorhandenes Todo — dann wird geändert, sonst angelegt. */
  readonly todo?: Todo;
  /** Vorbelegter Status beim Anlegen. */
  readonly presetStatusId?: Id;
  /**
   * Vorbelegte Tags beim Anlegen — etwa die Regel-Tags einer Kanban-Spalte
   * (E-054). Sie sind ein Vorschlag und keine Zusage: Ob das Todo am Ende in
   * der Spalte steht, entscheidet die Regelauswertung im Dienst, sobald das
   * Board neu berechnet wird.
   */
  readonly presetTagIds?: readonly Id[];
  readonly onClose: () => void;
  readonly onSaved?: (todo: Todo) => void;
}

export function TodoFormDialog({
  open,
  todo,
  presetStatusId,
  presetTagIds,
  onClose,
  onSaved,
}: TodoFormDialogProps) {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump, version } = useRefresh();
  const priorities = useAsync(listPriorities, [open], [version]);
  const [priorityId, setPriorityId] = useState("");
  const mutation = useMutation();

  const statuses = structure.state.status === "ready" ? structure.state.value.statuses : [];
  const defaultStatusId =
    presetStatusId ?? statuses.find((status) => status.isDefault)?.id ?? statuses[0]?.id ?? "";

  const [title, setTitle] = useState("");
  const [callNumber, setCallNumber] = useState("");
  const [statusId, setStatusId] = useState<Id>(defaultStatusId);
  const [tagIds, setTagIds] = useState<readonly Id[]>([]);
  const [newTagNames, setNewTagNames] = useState<readonly string[]>([]);
  const [note, setNote] = useState("");
  /**
   * Die Frist (A-19.3). Leer heißt: keine — ein Todo ohne Frist bleibt in jeder
   * Hinsicht ein gültiges Todo (A-19.1).
   */
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const noExportHintId = useId();
  const [noExport, setNoExport] = useState(false);
  const noEvidenceHintId = useId();
  const [noEvidence, setNoEvidence] = useState(false);
  const [estimateMinutes, setEstimateMinutes] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(todo?.title ?? "");
    setCallNumber(todo?.callNumber ?? "");
    setStatusId(todo?.statusId ?? defaultStatusId);
    setTagIds(todo?.tagIds ?? presetTagIds ?? []);
    setNewTagNames([]);
    setNote("");
    setDueDate(todo?.dueDate ?? "");
    setDueTime(todo?.dueTime ?? "");
    setEstimateMinutes(todo?.estimateMinutes?.toString() ?? "");
    setNoExport(todo?.noExport ?? false);
    setNoEvidence(todo?.noEvidence ?? false);
    setPriorityId(todo?.priorityId ?? "");
    setTitleTouched(false);
    setAttempted(false);
  }, [open, todo, defaultStatusId, presetTagIds]);

  const text = todoTexts();
  const trimmedTitle = title.trim();
  const titleError = titleTouched && trimmedTitle.length === 0 ? text.titleMissing : undefined;
  /*
   * The same rules the service applies (E-045, A-19.1), checked before sending
   * so the UI can say them in its own language (E-121 point 9). The domain
   * returns the code; the sentence comes from the text bundle.
   */
  const callCheck = callNumber.trim().length === 0 ? null : checkCallNumber(callNumber.trim());
  const callNumberError =
    attempted && callCheck !== null && !callCheck.ok ? callNumberMessage(callCheck.reason) : undefined;
  const dueDateError =
    attempted && dueDate.length > 0 && !isCalendarDay(dueDate)
      ? text.dueDateInvalid(MIN_DUE_YEAR, MAX_DUE_YEAR)
      : undefined;

  const submit = (): void => {
    setTitleTouched(true);
    setAttempted(true);
    if (trimmedTitle.length === 0) return;
    if (callCheck !== null && !callCheck.ok) return;
    if (dueDate.length > 0 && !isCalendarDay(dueDate)) return;

    void mutation.run(async () => {
      if (todo === undefined) {
        const created = await createTodo({
          title: trimmedTitle,
          callNumber: callNumber.trim().length === 0 ? null : callNumber.trim(),
          statusId: statusId.length === 0 ? null : statusId,
          tagIds,
          // Neue Tags gehen als **Namen** mit und werden vom Dienst in
          // derselben Transaktion angelegt (T-058). Sie hier vorab über
          // `POST /tags` anzulegen hieße, bei einem Fehlschlag des Todos ein
          // Tag zurückzulassen, das niemand bestellt hat.
          tagNames: newTagNames,
          note,
          // Leeres Feld heißt „keine Frist" und nicht „leerer Tag" (A-19.1).
          dueDate: dueDate.length === 0 ? null : dueDate,
          dueTime: dueDate ? dueTime || "00:00" : null,
          estimateMinutes: estimateMinutes ? Number(estimateMinutes) : null,
          noExport,
          noEvidence,
          priorityId: priorityId || null,
        });
        structure.reload();
        bump();

        // A-9.5: Der Dienst hat Standard-Tags ergänzt. Der Benutzer hat sie
        // nicht gewählt — also wird gesagt, welche dazugekommen sind, statt
        // sie ihn beim nächsten Öffnen selbst entdecken zu lassen.
        const added = created.addedDefaultTagIds
          .map((id) => structure.tagInfo(id)?.tag.name)
          .filter((label): label is string => label !== undefined);
        const fresh = (created.createdTags ?? []).map((tag) => tag.name);

        const words = todoTexts();
        toasts.success(words.todoCreated, [
          words.isSaved(quotedName(created.todo.title)),
          fresh.length === 0 ? null : words.tagsCreated(fresh.length, quotedList(fresh)),
          added.length === 0 ? null : words.defaultTagsAdded(added.length, quotedList(added)),
        ]
          .filter((part): part is string => part !== null)
          .join(" "));
        onSaved?.(created.todo);
        onClose();
        return;
      }

      /*
       * Beim **Ändern** gibt es kein `tagNames`: `PATCH /todos/{id}` nimmt
       * Kennungen entgegen. Neue Tags entstehen deshalb unmittelbar davor über
       * `POST /tags` — und das steht hier ausdrücklich als eigener Schritt, weil
       * es einen Unterschied macht: Schlägt das Speichern danach fehl, sind die
       * Tags angelegt. Das ist vertretbar (der Benutzer hat sie ausdrücklich
       * verlangt, und sie stehen danach unter Tags), aber es ist nichts, was
       * man verschweigt — die Fehlermeldung nennt sie.
       */
      const freshTags: Tag[] = [];
      for (const name of newTagNames) {
        freshTags.push(await createTag({ name, folderId: null, color: null }));
      }

      const saved = await updateTodo(todo.id, {
        title: trimmedTitle,
        callNumber: callNumber.trim().length === 0 ? null : callNumber.trim(),
        statusId,
        tagIds: [...tagIds, ...freshTags.map((tag) => tag.id)],
        // Ein geleertes Feld **entfernt** die Frist (A-19.3, drittes Verb).
        dueDate: dueDate.length === 0 ? null : dueDate,
          dueTime: dueDate ? dueTime || "00:00" : null,
          estimateMinutes: estimateMinutes ? Number(estimateMinutes) : null,
          noExport,
          noEvidence,
          priorityId: priorityId || null,
      });
      if (freshTags.length > 0) structure.reload();
      bump();
      const words = todoTexts();
      toasts.success(
        words.todoChanged,
        freshTags.length === 0
          ? words.isSaved(quotedName(saved.title))
          : `${words.isSaved(quotedName(saved.title))} ${words.tagsCreated(freshTags.length, quotedList(freshTags.map((tag) => tag.name)))}`,
      );
      onSaved?.(saved);
      onClose();
    });
  };

  return (
    <FormDialog
      open={open}
      title={todo === undefined ? text.newTodo : text.editTodo}
      {...(todo === undefined ? {} : { description: text.editTodoLead })}
      submitLabel={todo === undefined ? text.create : text.save}
      busy={mutation.busy}
      error={mutation.error}
      errorFromService={mutation.errorFromService}
      onSubmit={submit}
      onCancel={onClose}
    >
      <TextField
        label={text.title}
        value={title}
        onChange={setTitle}
        required
        maxLength={MAX_TITLE_CHARACTERS}
        {...(titleError === undefined ? {} : { error: titleError })}
        placeholder={text.titlePlaceholder}
      />

      <TextField
        label={text.callNumber}
        value={callNumber}
        onChange={setCallNumber}
        maxLength={64}
        hint={text.callNumberHint}
        {...(callNumberError === undefined ? {} : { error: callNumberError })}
      />

      {/*
        Die **Frist** (A-19.2, A-19.3). Sie heißt in der Oberfläche ausschließlich
        so — nicht „Fälligkeitsdatum", nicht „fällig am", nicht „Deadline".

        A-10.14: Keep the calendar day independent of optional local clock time.
        Neither input performs timezone conversion.

        Das Feld liefert von sich aus `YYYY-MM-DD` und nichts anderes. Das ist
        Bedienkomfort und **keine** Kontrolle: Geprüft wird die Form an der Tür
        des Dienstes — existierender Tag, Jahr zwischen 1970 und 2999
        (Auflage A-A-19).
      */}
      <DateField
        wide
        label={text.deadline}
        value={dueDate}
        onChange={value => {
          setDueDate(value);
          if (!value) setDueTime("");
        }}
        time={{ value: dueTime, onChange: setDueTime }}
        hint={`${text.deadlineHintCore} ${text.deadlineHintDefaultTime}`}
      />
      {/* Always in the tree so a screen reader notices the message (B-5, O-GQ). */}
      <div className="field__live" role="alert">
        {dueDateError === undefined ? null : <p className="field__error">{dueDateError}</p>}
      </div>
      <label className="todo-export-option">
        <span className="todo-export-option__text">
          <span className="todo-export-option__title" id={`${noExportHintId}-label`}>{text.noExport}</span>
          <span className="todo-export-option__hint" id={noExportHintId}>{text.noExportHint}</span>
        </span>
        <input className="todo-export-option__switch" type="checkbox" role="switch" checked={noExport}
          onChange={event => setNoExport(event.target.checked)} aria-labelledby={`${noExportHintId}-label`} aria-describedby={noExportHintId} />
      </label>
      <label className="todo-export-option">
        <span className="todo-export-option__text">
          <span className="todo-export-option__title" id={`${noEvidenceHintId}-label`}>{text.noEvidence}</span>
          <span className="todo-export-option__hint" id={noEvidenceHintId}>{text.noEvidenceHint}</span>
        </span>
        <input className="todo-export-option__switch" type="checkbox" role="switch" checked={noEvidence}
          onChange={event => setNoEvidence(event.target.checked)} aria-labelledby={`${noEvidenceHintId}-label`} aria-describedby={noEvidenceHintId} />
      </label>
      <Select label={text.priority} value={priorityId} onChange={setPriorityId}
        options={[{ value: "", label: text.noPriority }, ...(priorities.state.status === "ready" ? priorities.state.value.map(priority => ({ value: priority.id, label: `${priority.name} · ${priority.weight}` })) : [])]} />
      <p role="alert">{priorities.state.status === "error" ? <ServiceText text={priorities.state.message} fromService={priorities.state.fromService} /> : null}</p>
      <TextField label={text.estimateInMinutes} type="number" value={estimateMinutes} onChange={setEstimateMinutes} />


      {/*
        Ein **Wegweiser**, kein Vortrag (T-181, ST-05 mit Auflage Z-02 aus
        T-177). Der Unterschied zwischen Status und Kanban-Spalte stand hier
        bei **jedem** Oeffnen des Dialogs — an der Stelle, an der niemand
        diese Frage hat. Er steht jetzt an den zwei Stellen, an denen sie
        gestellt wird: am Board und in dessen Einrichtungsdialog.

        Kein `›` und kein anderes Pfadzeichen: Ein Sonderzeichen, das nur an
        einer Stelle vorkommt, ist eine eigene kleine Sprache. Das Produkt
        schreibt den Weg aus, und zwar so, wie es ihn an vier Stellen schon
        schreibt („in den Einstellungen unter „Status““).

        Es bleibt ein `hint` und wird kein Verweis: Ein anklickbarer Verweis
        fuehrte aus einem Dialog mit ungesicherten Eingaben heraus.
      */}
      <Select
        label={text.status}
        value={statusId}
        onChange={(next) => setStatusId(next)}
        options={statuses.map((status) => ({ value: status.id, label: status.name }))}
      />

      <TagInput
        label={text.tags}
        value={tagIds}
        onChange={setTagIds}
        allowCreate
        newNames={newTagNames}
        onNewNamesChange={setNewTagNames}
        hint={
          todo === undefined
            ? text.tagsHintNew
            : text.tagsHintEdit
        }
      />

      {todo === undefined ? (
        <NoteField
          scope="internal"
          value={note}
          onChange={setNote}
          rows={2}
          maxLength={65536}
          /*
            Kein eigener Platzhalter mehr (T-181, ST-09). Dieselbe Ueberschrift
            stand woertlich auch in der Detailansicht; T-163 hat nur diese
            zweite Stelle gezaehlt, die Bauart ist dieselbe. Das Feld nimmt den
            Vorgabewert aus `NoteField`.
          */
        />
      ) : null}
    </FormDialog>
  );
}
