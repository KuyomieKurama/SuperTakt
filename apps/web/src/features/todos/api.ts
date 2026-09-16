import type { MailEntry } from '@takt/domain';
import { request } from "../../api/client";
import type {
  Pagination,
  CalendarDay,
  DraftText,
  EncodedBytes,
  ForeignText,
  Id,
  Page,
  PoolMovement,
  Tag,
  TechnicalKey,
  Timestamp,
  Todo,
  UncappedText,
} from "../../api/types";

/* Die eigenen Typen des Merkmals                                       */

/** Erledigen kann Pools ändern; Wiederöffnen meldet `reopen`. Ohne Flächenwechsel ist `poolMovement` null. */
export interface TodoDoneResult extends Todo {
  readonly poolMovement: PoolMovement | null;
}

/** `GET /todos/{id}` — das Todo samt seiner berechneten Summen, ohne Vermerk. */
export interface TodoDetail {
  readonly mails?: readonly MailEntry[];
  readonly todo: Todo;
  readonly totalSeconds: number;
  /** Noch nicht exportierte Sekunden. */
  readonly openSeconds: number;
}

/** Der interne Vermerk (A-7.1, E-016). Eigene Ressource, eigener Aufruf. */
export interface TodoNote {
  readonly todoId: Id;
  readonly text: ForeignText;
  readonly updatedAt: Timestamp;
}

export interface TodoCreate {
  readonly title: DraftText;
  readonly callNumber?: DraftText | null;
  readonly statusId?: Id | null;
  readonly tagIds?: readonly Id[];
  /** Tags werden zusammen mit dem Todo angelegt oder wiederverwendet, damit ein Abbruch keine verwaisten Tags hinterlässt. */
  readonly tagNames?: readonly DraftText[];
  readonly note?: DraftText;
  /** Kein Datum bei null oder fehlendem Wert. Der Dienst prüft YYYY-MM-DD mit einem Jahr zwischen 1970 und 2999. */
  readonly dueTime?: string | null;
  readonly estimateMinutes?: number | null;
  readonly noExport?: boolean;
  readonly priorityId?: string | null;
  readonly dueDate?: CalendarDay | null;
}

export interface TodoUpdate {
  readonly title?: DraftText;
  readonly callNumber?: DraftText | null;
  readonly statusId?: Id;
  readonly tagIds?: readonly Id[];
  /** Fehlend lässt das Datum unverändert, null entfernt es, ein Tageswert setzt es. */
  readonly dueTime?: string | null;
  readonly estimateMinutes?: number | null;
  readonly noExport?: boolean;
  readonly priorityId?: string | null;
  readonly dueDate?: CalendarDay | null;
}

/** Ohne Fälligkeit immer zuletzt, unabhängig von der Sortierrichtung. */
export type DueSortDirection = "asc" | "desc";

/** Der Dienst berechnet die Fälligkeit in derselben Zeitzone wie der Export. */
export type DueState = "overdue" | "due_today" | "due_later" | "no_due_date";

export interface TodoFilter {
  readonly search?: DraftText;
  readonly callNumber?: DraftText;
  readonly statusIds?: readonly Id[];
  readonly tagIds?: readonly Id[];
  readonly poolIds?: readonly Id[];
  /** Erledigte ausblenden (E-039). */
  readonly onlyOpen?: boolean;
  readonly onlyWithOpenEntries?: boolean;
  /** Mehrere Werte werden durch Kommas getrennt übertragen. */
  readonly dueStates?: readonly DueState[];
  /** `sortByDueDate` am Dienst. Fehlt es, bleibt die bisherige Ordnung. */
  readonly sortByDueDate?: DueSortDirection;
}

/* Anhänge (A-19.8 bis A-19.15, E-071, E-072)                           */

/** Bilder sind verwaltete Kopien; Links und Dateipfade werden erst nach gesonderter Freigabe geöffnet. */
export type AttachmentKind = "link" | "image" | "file";

/** Unbekannte Herkunft gilt als `user`, damit keine E-Mail-Herkunft vorgetäuscht wird. */
export type AttachmentOrigin = "user" | "email";

/** Titel und Ziel sind Fremdtext; bei der Anzeige auch bidirektionale Steuerzeichen berücksichtigen. */
export interface Attachment {
  readonly id: Id;
  readonly todoId: Id;
  readonly kind: AttachmentKind;
  /** Die Beschriftung, wenn der Benutzer eine gesetzt hat (A-19.10). */
  readonly title: ForeignText | null;
  /** Bei Bildern ein erzeugter Dateiname, bei Links die normalisierte URL, die unverändert an die Shell geht. */
  readonly target: ForeignText;
  /** Reihenfolge am Todo, vom Dienst vergeben. */
  readonly position: number;
  readonly createdAt: Timestamp;
  /** Gespeicherte Herkunft; sie wird nicht aus dem Pfad abgeleitet. */
  readonly origin: AttachmentOrigin;
  /** Optionaler Absender als Fremdtext. */
  readonly originSender: ForeignText | null;
  /** Ursprünglicher Dateiname aus der Mail; bei der Anzeige muss die Erweiterung sichtbar bleiben. */
  readonly displayName: UncappedText | null;
  /** Die Wiederherstellung wird dauerhaft gespeichert und beim Öffnen angezeigt. */
  readonly rebuilt: boolean;
}

/** Bilder werden als Quellpfad übergeben und vom Dienst unter erzeugtem Namen kopiert; ihre Bytes überschreiten das HTTP-Limit. */
export type AttachmentCreate =
  | { readonly kind: "link"; readonly url: DraftText; readonly title?: DraftText | null }
  | { readonly kind: "file"; readonly path: DraftText; readonly title?: DraftText | null }
  | { readonly kind: "image"; readonly sourcePath: DraftText; readonly title?: DraftText | null };

/** Bilddaten werden authentifiziert geladen und als Daten-URI angezeigt; das Token gehört nicht in die URL. */
export interface AttachmentImage {
  /** `image/png`, `image/jpeg`, `image/gif`, `image/webp` (Auflage A-A-16). */
  readonly mediaType: TechnicalKey;
  readonly base64: EncodedBytes;
}

/** Die Antwort enthält die tatsächlich gesetzten Standard-Tags für die Rückmeldung. */
export interface TodoCreated {
  readonly todo: Todo;
  readonly addedDefaultTagIds: readonly Id[];
  /** Ältere Dienste können die neu angelegten Tags in der Antwort weglassen. */
  readonly createdTags?: readonly Tag[];
}

/* Todos                                                                */

export function listTodos(filter: TodoFilter, page: Pagination = {}): Promise<Page<Todo>> {
  return request<Page<Todo>>("/todos", {
    query: {
      ...(filter.search === undefined ? {} : { search: filter.search }),
      ...(filter.callNumber === undefined ? {} : { callNumber: filter.callNumber }),
      ...(filter.statusIds === undefined ? {} : { statusId: filter.statusIds }),
      ...(filter.tagIds === undefined ? {} : { tagId: filter.tagIds }),
      ...(filter.poolIds === undefined ? {} : { poolId: filter.poolIds }),
      ...(filter.onlyOpen === true ? { onlyOpen: "true" } : {}),
      ...(filter.onlyWithOpenEntries === true ? { onlyWithOpenEntries: "true" } : {}),
      // Frist: filtern und ordnen (A-19.20, E-074). Beides ist **Anzeige** und
      // keine Achse — die Frist geht weiterhin nicht in Pools, nicht in
      // Spalten und nicht in den Export (E-070 Punkt 4, A-19.17). Gerechnet
      // wird im Dienst: Er kennt den Tagesbegriff aus E-025, und ein zweiter
      // hier wäre der zweite Tagesbegriff im selben Programm.
      // `dueState` ist eine **kommagetrennte Liste** von Zuständen; der Dienst
      // zerlegt sie selbst (`dueStateListSchema`). Der Name ist seiner, nicht
      // unserer — dieselbe Regel wie bei `search` und `onlyOpen`.
      ...(filter.dueStates === undefined || filter.dueStates.length === 0
        ? {}
        : { dueState: filter.dueStates.join(",") }),
      ...(filter.sortByDueDate === undefined ? {} : { sortByDueDate: filter.sortByDueDate }),
      ...(page.cursor === undefined ? {} : { cursor: page.cursor }),
      ...(page.limit === undefined ? {} : { limit: page.limit }),
    },
  });
}

export function getTodo(id: Id): Promise<TodoDetail> {
  return request<TodoDetail>(`/todos/${encodeURIComponent(id)}`);
}

export function createTodo(body: TodoCreate): Promise<TodoCreated> {
  return request<TodoCreated>("/todos", { method: "POST", body });
}

export function updateTodo(id: Id, body: TodoUpdate): Promise<Todo> {
  return request<Todo>(`/todos/${encodeURIComponent(id)}`, { method: "PATCH", body });
}

export function deleteTodo(id: Id): Promise<void> {
  return request<void>(`/todos/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* Anhänge (A-19.8 bis A-19.15)                                         */

/** Das Auflisten öffnet keine Anhänge und liest keine Bilddaten. */
export function listAttachments(todoId: Id): Promise<{ items: readonly Attachment[] }> {
  return request<{ items: readonly Attachment[] }>(
    `/todos/${encodeURIComponent(todoId)}/attachments`,
  );
}

/** `POST /todos/{id}/attachments` (A-19.10, A-19.11). */
export function createAttachment(todoId: Id, body: AttachmentCreate): Promise<Attachment> {
  return request<Attachment>(`/todos/${encodeURIComponent(todoId)}/attachments`, {
    method: "POST",
    body,
  });
}

/** Der Dienst entfernt gegebenenfalls auch die verwaltete Bildkopie. */
export function deleteAttachment(todoId: Id, attachmentId: Id): Promise<void> {
  return request<void>(
    `/todos/${encodeURIComponent(todoId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: "DELETE" },
  );
}

export function getAttachmentImage(todoId: Id, attachmentId: Id): Promise<AttachmentImage> {
  return request<AttachmentImage>(
    `/todos/${encodeURIComponent(todoId)}/attachments/${encodeURIComponent(attachmentId)}/image`,
  );
}

export function getTodoNote(id: Id): Promise<TodoNote> {
  return request<TodoNote>(`/todos/${encodeURIComponent(id)}/note`);
}

export function putTodoNote(id: Id, text: string): Promise<TodoNote> {
  return request<TodoNote>(`/todos/${encodeURIComponent(id)}/note`, {
    method: "PUT",
    body: { text },
  });
}

/** Der Dienst berechnet mögliche Poolbewegungen mit dem neutralen Anlass `booking`. */
export function markTodoDone(id: Id): Promise<TodoDoneResult> {
  return request<TodoDoneResult>(`/todos/${encodeURIComponent(id)}/done`, {
    method: "PUT",
    body: {},
  });
}

export function clearTodoDone(id: Id): Promise<TodoDoneResult> {
  return request<TodoDoneResult>(`/todos/${encodeURIComponent(id)}/done`, { method: "DELETE" });
}
