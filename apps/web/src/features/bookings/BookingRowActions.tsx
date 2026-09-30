import { useCallback, useState } from "react";
import { navigate } from "../../app/router";
import type { ForeignText, TimeEntry } from "../../api/types";
import { exportDisplayState } from "../../shared/ui/ExportStatus";
import type { MenuEntry } from "../../shared/ui/Menu";
import {
  BookingFormDialog,
  BookingHistoryDialog,
  NotBilledDialog,
  ResetExportDialog,
} from "./BookingDialogs";
import { bookingTexts } from "./texts";

// Cycle bookings <-> export: both screens expose the same booking actions and dialogs.
export function useBookingRowActions(todoTitleFor: (entry: TimeEntry) => ForeignText) {
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [resetEntry, setResetEntry] = useState<TimeEntry | null>(null);
  const [notBilledEntry, setNotBilledEntry] = useState<TimeEntry | null>(null);
  const [historyEntry, setHistoryEntry] = useState<TimeEntry | null>(null);

  const menuEntries = useCallback((entry: TimeEntry): readonly MenuEntry[] => {
    const locked = entry.exportStatus === "exported";
    const notBilled = exportDisplayState(entry.exportStatus, entry.exportCount) === "not_billed";
    const text = bookingTexts();
    const lockReason = notBilled ? text.lockedNotBilled : text.lockedExported;
    return [
      {
        id: "todo",
        label: text.openTodo,
        icon: "arrow-up-right",
        onSelect: () => navigate("todo", entry.todoId),
      },
      {
        id: "edit",
        label: text.edit,
        icon: "pencil",
        disabled: locked,
        ...(locked ? { disabledReason: lockReason } : {}),
        onSelect: () => setEditing(entry),
      },
      {
        id: "history",
        label: text.historyTitle,
        icon: "clock",
        onSelect: () => setHistoryEntry(entry),
      },
      {
        id: "reset",
        label: text.resetExportStatus,
        icon: "rotate-ccw",
        disabled: !locked,
        ...(!locked ? { disabledReason: text.alreadyOpen } : {}),
        onSelect: () => setResetEntry(entry),
      },
      ...(entry.todoNoExport
        ? []
        : ([
          {
            id: "not-billed",
            label: text.notBilled,
            icon: "slash-circle",
            disabled: locked,
            ...(locked
              ? { disabledReason: notBilled ? text.alreadyNotBilled : text.alreadyExported }
              : {}),
            onSelect: () => setNotBilledEntry(entry),
          },
        ] satisfies MenuEntry[])),
    ];
  }, []);

  const dialogs = <>
    {editing === null ? null : (
      <BookingFormDialog
        open
        entry={editing}
        todoId={editing.todoId}
        todoTitle={todoTitleFor(editing)}
        onClose={() => setEditing(null)}
      />
    )}
    <ResetExportDialog
      open={resetEntry !== null}
      entry={resetEntry}
      todoTitle={resetEntry === null ? bookingTexts().thisTodo : todoTitleFor(resetEntry)}
      onClose={() => setResetEntry(null)}
    />
    <BookingHistoryDialog
      open={historyEntry !== null}
      entry={historyEntry}
      todoTitle={historyEntry === null ? bookingTexts().thisTodo : todoTitleFor(historyEntry)}
      onClose={() => setHistoryEntry(null)}
    />
    <NotBilledDialog
      open={notBilledEntry !== null}
      entry={notBilledEntry}
      todoTitle={notBilledEntry === null ? bookingTexts().thisTodo : todoTitleFor(notBilledEntry)}
      onClose={() => setNotBilledEntry(null)}
    />
  </>;

  return { menuEntries, openEditor: setEditing, dialogs };
}
