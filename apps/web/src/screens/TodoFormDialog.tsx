import { useEffect, useState } from "react";
import { createTag, createTodo, updateTodo } from "../api/endpoints";
import type { Id, Tag, Todo } from "../api/types";
import { FormDialog, TextField } from "../components/FormDialog";
import { NoteField } from "../components/NoteField";
import { Select } from "../components/Select";
import { TagInput } from "../components/TagInput";
import { useMutation } from "../app/useAsync";
import { useStructure } from "../app/StructureContext";
import { useToasts } from "../app/ToastContext";
import { useRefresh } from "../app/RefreshContext";

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

/** „A“, „A und B“, „A, B und C“ — eine Aufzählung, die man vorlesen kann. */
function quoteList(names: readonly string[]): string {
  const quoted = names.map((name) => `„${name}“`);
  if (quoted.length <= 1) return quoted.join("");
  return `${quoted.slice(0, -1).join(", ")} und ${quoted[quoted.length - 1] ?? ""}`;
}

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
  const { bump } = useRefresh();
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
  const [titleTouched, setTitleTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(todo?.title ?? "");
    setCallNumber(todo?.callNumber ?? "");
    setStatusId(todo?.statusId ?? defaultStatusId);
    setTagIds(todo?.tagIds ?? presetTagIds ?? []);
    setNewTagNames([]);
    setNote("");
    setTitleTouched(false);
  }, [open, todo, defaultStatusId, presetTagIds]);

  const trimmedTitle = title.trim();
  const titleError =
    titleTouched && trimmedTitle.length === 0 ? "Ohne Titel lässt sich ein Todo nicht wiederfinden." : undefined;

  const submit = (): void => {
    setTitleTouched(true);
    if (trimmedTitle.length === 0) return;

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

        toasts.success("Todo angelegt.", [
          `„${created.todo.title}“ ist gespeichert.`,
          fresh.length === 0
            ? null
            : `Neu angelegt ${fresh.length === 1 ? "wurde das Tag" : "wurden die Tags"} ${quoteList(fresh)}.`,
          added.length === 0
            ? null
            : `Als Standard-Tag ${added.length === 1 ? "kam" : "kamen"} ${quoteList(added)} hinzu.`,
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
      });
      if (freshTags.length > 0) structure.reload();
      bump();
      toasts.success(
        "Todo geändert.",
        freshTags.length === 0
          ? `„${saved.title}“ ist gespeichert.`
          : `„${saved.title}“ ist gespeichert. Neu angelegt ${freshTags.length === 1 ? "wurde das Tag" : "wurden die Tags"} ${quoteList(freshTags.map((tag) => tag.name))}.`,
      );
      onSaved?.(saved);
      onClose();
    });
  };

  return (
    <FormDialog
      open={open}
      title={todo === undefined ? "Neues Todo" : "Todo bearbeiten"}
      description={
        todo === undefined
          ? "Titel genügt. Alles andere lässt sich später ergänzen."
          : "Änderungen gelten sofort. Die erfassten Zeiten bleiben unberührt."
      }
      submitLabel={todo === undefined ? "Anlegen" : "Speichern"}
      busy={mutation.busy}
      error={mutation.error}
      onSubmit={submit}
      onCancel={onClose}
    >
      <TextField
        label="Titel"
        value={title}
        onChange={setTitle}
        required
        maxLength={512}
        {...(titleError === undefined ? {} : { error: titleError })}
        placeholder="Wofür wird Zeit erfasst?"
      />

      <TextField
        label="Call-Nummer"
        value={callNumber}
        onChange={setCallNumber}
        maxLength={64}
        hint="Aus dem Ticketsystem. Darf leer bleiben; das Add-in trägt sie beim Buchen aus einer E-Mail ein."
      />

      <Select
        label="Status"
        value={statusId}
        onChange={(next) => setStatusId(next)}
        options={statuses.map((status) => ({ value: status.id, label: status.name }))}
        hint="Der Status ist keine Kanban-Spalte — eine Spalte ist eine Regel, und der Status ist eine von fünf Bedingungen, die sie abfragen kann. Welche Statuswerte es gibt, legen Sie in den Einstellungen unter „Status“ fest."
      />

      <TagInput
        label="Tags"
        value={tagIds}
        onChange={setTagIds}
        allowCreate
        newNames={newTagNames}
        onNewNamesChange={setNewTagNames}
        hint={
          todo === undefined
            ? "Tippen Sie einen Namen: Vorhandene Tags werden vorgeschlagen, ein unbekannter lässt sich als neues Tag anlegen. Die Standard-Tags aus den Einstellungen kommen beim Anlegen von selbst hinzu — sie stehen hier nicht zur Wahl, damit dieselbe Regel nicht zweimal gilt."
            : "Tippen Sie einen Namen: Vorhandene Tags werden vorgeschlagen, ein unbekannter lässt sich als neues Tag anlegen."
        }
      />

      {todo === undefined ? (
        <NoteField
          scope="internal"
          value={note}
          onChange={setNote}
          rows={2}
          maxLength={65536}
          placeholder="Notiz für Sie selbst — Zugangsdaten, Ansprechpartner, Zwischenstand."
        />
      ) : null}
    </FormDialog>
  );
}
