import { useState } from "react";

import type { Id } from "../../api/types";
import { putTodoNote, type TodoNote } from "./api";
import { useToasts } from "../../app/ToastContext";
import { useMutation } from "../../app/useAsync";
import { formatDateTime } from "../../lib/format";
import { Button, Card, InlineMessage } from "../../shared/ui/Primitives";
import { NoteField } from "../../shared/ui/NoteField";

/**
 * Takt — der interne Vermerk eines Todos (A-7.1, E-016).
 *
 * **Er bleibt in SuperTakt.** Der Vermerk geht in keinen Abrechnungsexport;
 * was in die Abrechnung geht, ist die Leistung an der Buchung. Diese Trennung
 * ist der Grund, aus dem der Vermerk eine eigene Ressource und einen eigenen
 * Aufruf hat, und sie steht im Geltungsbereich des Feldes (`scope="internal"`).
 *
 * Der Entwurf steht hier und nicht im Screen: Er wird nur hier gelesen, nur
 * hier geschrieben und nur hier zurückgesetzt. Der gespeicherte Stand kommt
 * von außen herein und geht über `onSaved` zurück — die Ansicht hält
 * weiterhin genau eine Fassung der Antwort, und es gibt keinen zweiten Ort,
 * an dem „was steht gerade im Feld" beantwortet würde.
 */
export interface TodoNoteCardProps {
  readonly todoId: Id;
  /** Der gespeicherte Stand, wie ihn der Dienst zuletzt geliefert hat. */
  readonly note: TodoNote;
  /** Nach dem Speichern: der neue Stand, damit die Ansicht ihn übernimmt. */
  readonly onSaved: (note: TodoNote) => void;
}

export function TodoNoteCard({ todoId, note, onSaved }: TodoNoteCardProps) {
  const toasts = useToasts();
  const noteMutation = useMutation();
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  const noteText = noteDraft ?? note.text;
  const noteDirty = noteDraft !== null && noteDraft !== note.text;

  return (
    <Card title="Vermerk">
      <NoteField
        scope="internal"
        hideLabel
        value={noteText}
        onChange={setNoteDraft}
        rows={12}
        maxLength={65536}
        /*
          Kein eigener Platzhalter mehr (T-181, ST-09): Das Feld
          nimmt den Vorgabewert aus `NoteField`. Zwei Fassungen
          fuer dasselbe Feld an zwei Flaechen waren zwei Anreden
          und zwei Wortlaute fuer eine Sache.
        */
      />
      <div className="note-actions">
        <Button
          variant="primary"
          size="sm"
          disabled={!noteDirty}
          loading={noteMutation.busy}
          onClick={() => {
            void noteMutation.run(async () => {
              const saved = await putTodoNote(todoId, noteText);
              setNoteDraft(null);
              onSaved(saved);
              toasts.success("Vermerk gespeichert.", "Er bleibt in SuperTakt.");
            });
          }}
        >
          Vermerk speichern
        </Button>
        {noteDirty ? (
          <span className="note-actions__hint">Nicht gespeicherte Änderung</span>
        ) : (
          <span className="note-actions__hint muted">
            Zuletzt geändert am {formatDateTime(note.updatedAt)}
          </span>
        )}
      </div>
      {noteMutation.error === null ? null : (
        <InlineMessage tone="danger" title="Der Vermerk wurde nicht gespeichert">
          {noteMutation.error}
        </InlineMessage>
      )}
    </Card>
  );
}
