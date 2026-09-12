/**
 * Takt — die Routen und die eigenen Typen des Merkmals „Todos", je eine
 * Funktion.
 *
 * Der Pfad steht genau einmal. Keine Ansicht setzt eine Adresse zusammen.
 *
 * **Gegen die Umsetzung geschrieben.** Wo `openapi/takt-local-api.yaml` und
 * `apps/local-api/src/routes/**` auseinandergehen, gilt die Umsetzung.
 *
 * **Jeder Feldname hier ist der Name des Dienstes.** Ein Rumpf ist ein
 * Objektliteral: Ein falscher Schlüssel fällt keinem Typecheck auf, sondern
 * erst dem Benutzer, dem die Route mit 422 antwortet. Wer hier ein Feld
 * ergänzt, gleicht es gegen `apps/local-api/src/routes/**` ab, nicht gegen das
 * Gedächtnis.
 *
 * **Warum `request` hier stehen darf** (E-102, F-22): Die Zusage „in der
 * Oberfläche entsteht kein Aufruf an den Dienst außerhalb der dafür
 * vorgesehenen Stellen" ist seit T-250-2 nicht mehr an der Ordnerstruktur
 * aufgespannt, sondern an der Anforderung — `api/client.ts`, wo `request`
 * entsteht, und jede `features/<merkmal>/api.ts`, die auf der Platte liegt.
 *
 * **Welche Typen hier stehen und welche nicht.** Hier steht, was ausschließlich
 * dieses Merkmal braucht: die Gestalt seiner Antworten und seiner Rümpfe.
 * `Todo` selbst steht weiterhin in `api/types.ts` — es wird von der Suche, vom
 * Board, vom Export, vom Timer und von der Zeiterfassung gelesen, und was
 * mehrere Merkmale teilen, bleibt in `api/`.
 *
 * **Keine Fachlogik in dieser Datei.** Jede Zahl, die in eine Abrechnung geht —
 * Dauer, Viertelstunden, Tagesgruppe — kommt fertig gerechnet aus
 * `packages/domain` über den Dienst.
 */

import { request } from "../../api/client";
import type { Pagination } from "../../api/endpoints";
import type {
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

/* ==================================================================== */
/* Die eigenen Typen des Merkmals                                       */
/* ==================================================================== */

/**
 * Die Antwort von `PUT` und `DELETE /todos/{id}/done` (E-060).
 *
 * ## Warum das Todo hier ein Feld mehr trägt
 *
 * Seit E-055 entscheidet „Erledigt" über Spalten: Eine Regel darf nach dem
 * Kennzeichen fragen, und dann wechselt die Karte mit genau dieser Handlung
 * ihren Platz. Bis E-060 antworteten beide Routen mit dem Todo und sonst
 * nichts — der Toast danach schwieg über die Spalten, während derselbe Übergang
 * über einen Timerstart angesagt wurde (O-U). Wer an einer Stelle Auskunft gibt
 * und an der anderen schweigt, sagt die halbe Wahrheit.
 *
 * ## Zwei Anlässe, zwei Sätze
 *
 * `DELETE` (Aufheben) ist der Anlaß `'reopen'` — das Todo war erledigt und
 * kehrt zurück, „wieder" stimmt. `PUT` (Setzen) nimmt `'booking'`, die neutrale
 * Form: Der Satz dazu trägt kein Wort von Buchung und nennt nur, was dazukommt
 * und was wegfällt (E-060 Punkt 2). Umbenannt wird der Anlaß nicht; er steht in
 * fünf Hoheiten.
 *
 * `null` heißt „keine Fläche bewegt sich", nicht „nichts geschehen": Das
 * Kennzeichen ist in jedem Fall umgelegt, es trifft nur keine Regel darauf zu.
 * Die Aufrufstelle läßt den Satz dann **ganz** weg.
 */
export interface TodoDoneResult extends Todo {
  readonly poolMovement: PoolMovement | null;
}

/** `GET /todos/{id}` — das Todo samt seiner berechneten Summen, ohne Vermerk. */
export interface TodoDetail {
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
  /**
   * Tagnamen statt Kennungen — für Tags, die es noch nicht gibt (T-058).
   *
   * Der Dienst löst sie **in derselben Transaktion** auf, in der das Todo
   * entsteht: Ein Name, den es schon gibt, wird verwendet; einer, den es nicht
   * gibt, entsteht auf der Wurzelebene. Deshalb legt die Oberfläche neue Tags
   * nicht selbst an — wer den Dialog abbricht, hinterlässt sonst ein Tag ohne
   * Todo.
   */
  readonly tagNames?: readonly DraftText[];
  readonly note?: DraftText;
  /**
   * Die Frist beim Anlegen (A-19.3). `null` und ein fehlendes Feld sind
   * dasselbe: keine Frist.
   *
   * Geprüft wird die Form an der **Tür des Dienstes** (Auflage A-A-19):
   * `YYYY-MM-DD`, ein **existierender** Tag — `2026-02-30` passt auf die Form
   * und ist keiner —, Jahr zwischen 1970 und 2999. Das Eingabefeld benutzt
   * `type="date"` und kann von sich aus nichts anderes liefern; das ist
   * Bedienkomfort und keine Kontrolle.
   */
  readonly dueDate?: CalendarDay | null;
}

export interface TodoUpdate {
  readonly title?: DraftText;
  readonly callNumber?: DraftText | null;
  readonly statusId?: Id;
  readonly tagIds?: readonly Id[];
  /**
   * Frist setzen, ändern und **entfernen** (A-19.3). Drei Fälle, und sie sind
   * hier alle drei erreichbar: Das Feld fehlt → unverändert. `null` → entfernen.
   * Ein Tag → setzen. Ohne die Unterscheidung gäbe es keinen Weg, eine gesetzte
   * Frist wieder loszuwerden.
   */
  readonly dueDate?: CalendarDay | null;
}

/**
 * Wonach die Todo-Liste geordnet wird (A-19.20, E-074 Punkt 1).
 *
 * `recent` ist die bisherige Ordnung des Dienstes und bleibt die Voreinstellung
 * — eine Liste, die sich beim ersten Öffnen anders sortiert als gestern, ist
 * eine Umstellung und keine Ergänzung (A-19.16).
 *
 * **Ein Todo ohne Frist steht in beiden Richtungen am Ende** (E-074 Punkt 2).
 * Es hat keinen Wert, keinen frühesten und keinen spätesten; ein leeres Feld
 * als „01.01.1970" zu sortieren ist die Sorte Bequemlichkeit, die niemandem
 * auffällt, bis sie in einer Abrechnung steht. Die Regel gilt im Dienst und
 * nicht hier — die Oberfläche schickt nur den Namen.
 */
export type DueSortDirection = "asc" | "desc";

/**
 * Nach der Frist filtern (A-19.20).
 *
 * Die drei Werte sind die drei Zustände aus A-19.5, dazu `none` für „ohne
 * Frist". Gerechnet wird auch hier im Dienst: Er kennt den Tagesbegriff aus
 * E-025, und ein zweiter im Filter wäre der zweite Tagesbegriff, den E-070
 * Punkt 2 ausschließt.
 */
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
  /**
   * Nach dem Zustand der Frist filtern (A-19.20). Mehrere sind zugelassen; der
   * Dienst nimmt sie als kommagetrennte Liste unter `dueState` entgegen.
   */
  readonly dueStates?: readonly DueState[];
  /** `sortByDueDate` am Dienst. Fehlt es, bleibt die bisherige Ordnung. */
  readonly sortByDueDate?: DueSortDirection;
}

/* ==================================================================== */
/* Anhänge (A-19.8 bis A-19.15, E-071, E-072)                           */
/* ==================================================================== */

/**
 * Die drei Arten, und sie unterscheiden sich nicht nur im Etikett, sondern
 * darin, **was Takt eigentlich hält** (E-071).
 *
 *  - `link` — eine Adresse. Takt speichert eine Zeichenkette, kein Byte, und
 *    öffnet sie im Browser des Benutzers.
 *  - `file` — ein Pfad. Ebenfalls eine Zeichenkette; verschwindet die Datei,
 *    sagt der Anhang das (A-19.15), statt sie wiederherstellen zu wollen.
 *  - `image` — eine **Kopie** im Anwendungsdatenverzeichnis, unter denselben
 *    Rechten wie der Bestand (E-018). Sie **öffnet nichts nach draußen**
 *    (E-072 Punkt 2): Sie wird angezeigt, und das ist der ganze Umfang.
 */
export type AttachmentKind = "link" | "image" | "file";

/**
 * Die Herkunft eines Anhangs (A-A-84).
 *
 *  - `user` — der Benutzer hat ihn selbst eingetragen. Er kennt die Quelle.
 *  - `email` — er kam über das Outlook-Add-in aus einer E-Mail mit (A-19.23).
 *    Name und Inhalt bestimmt der Absender.
 *
 * Ein dritter Wert ist heute keiner: Der Dienst bildet Unbekanntes auf `user`
 * ab, weil `email` eine Herkunft **behauptete**, die niemand nachweisen kann —
 * und die Rückfrage vor dem Öffnen läse sie vor.
 */
export type AttachmentOrigin = "user" | "email";

/**
 * Ein Anhang, wie der Dienst ihn liefert (A-19.8).
 *
 * **`title` und `value` sind fremder Text**, und das ist keine Förmlichkeit.
 * Beide kommen aus einer Benutzereingabe, ein Pfad zusätzlich aus dem
 * Dateisystem, und beide stehen an einer Zeile, deren Klick ein Programm
 * startet. Ohne die Behandlung aus E-063 zeigt eine Datei namens
 * `rechnung\u{202e}cod.exe` sich als `rechnungexe.doc` — in der Liste **und**
 * in der Rückfrage davor (Auflage A-A-6 Punkt 2).
 */
export interface Attachment {
  readonly id: Id;
  readonly todoId: Id;
  readonly kind: AttachmentKind;
  /** Die Beschriftung, wenn der Benutzer eine gesetzt hat (A-19.10). */
  readonly title: ForeignText | null;
  /**
   * Adresse oder Pfad. Bei einem **Bild** der erzeugte Name der Kopie — er
   * steht in keiner Anzeige (Auflage A-A-17: der Name wird erzeugt und nicht
   * aus der Quelle übernommen).
   *
   * Bei einem Verweis ist dieser Wert bereits die **Normalform**: Normalisiert
   * wird einmal, beim Anlegen, in `packages/domain` (Auflage A-A-13). Der
   * Öffnen-Befehl der Hülle verlangt genau das und weist alles andere ab — sonst
   * läse der Benutzer eine Adresse und Takt öffnete eine andere (A-A-3).
   */
  readonly target: ForeignText;
  /** Reihenfolge am Todo, vom Dienst vergeben. */
  readonly position: number;
  readonly createdAt: Timestamp;
  /**
   * Woher dieser Anhang stammt (A-A-84) — **gespeichert**, nicht aus dem Pfad
   * geraten.
   *
   * Der Unterschied, den dieses Feld trägt, ist der aus R-21: Ein Anhang, den
   * der Benutzer selbst eingetragen hat, hat eine Herkunft, die er kennt. Ein
   * Anhang aus einer E-Mail liegt Tage später zwischen seinen eigenen, und ein
   * Fremder hat ihn geschickt. Die Rückfrage vor dem Öffnen sagt das (A-A-85),
   * und die Zeile sagt es auch (A-A-87).
   */
  readonly origin: AttachmentOrigin;
  /**
   * Der Absender der E-Mail, aus der dieser Anhang stammt — **fremder Text**
   * (A-A-85). `null` heißt „gibt es nicht", nicht „unbekannt".
   */
  readonly originSender: ForeignText | null;
  /**
   * Der Name aus fremder Hand (A-19.23a) — der Dateiname, wie er in der E-Mail
   * stand. `null` bei jedem Anhang, den der Benutzer selbst eingetragen hat.
   *
   * **Er ist nicht `title` und nicht `target`**, und die Trennung ist der Punkt:
   * `title` gehört dem Benutzer, `target` ist der von SuperTakt **erzeugte**
   * Pfad (`<32 Hexziffern>[.<endung>]`, A-A-78), und dieses Feld ist der
   * einzige Wert am Anhang, den ein Absender frei bestimmt hat.
   *
   * Der Typ ist deshalb `UncappedText` und nicht `ForeignText`: An seinem Ende
   * steht die Endung, und an der Endung hängt, was beim Bestätigen startet
   * (A-19.23b, A-A-93).
   */
  readonly displayName: UncappedText | null;
  /**
   * Diese Datei ist ein **Nachbau** der E-Mail und nicht die ursprüngliche
   * Nachricht (A-19.22a, A-19.22b, A-A-97).
   *
   * Die Kennzeichnung hängt an der **Datei** und nicht am Augenblick des
   * Anlegens: Sie steht an der Anhangszeile und in der Rückfrage vor dem
   * Öffnen, und sie übersteht die Datensicherung. Ein Hinweis, der nur beim
   * Anlegen im Aufgabenbereich erschien, wäre drei Wochen später nirgends — und
   * der Benutzer sitzt dann hier.
   */
  readonly rebuilt: boolean;
}

/**
 * Was beim Hinzufügen mitgeht (A-19.10) — eine **unterschiedene Vereinigung**
 * und kein Objekt mit drei freiwilligen Feldern.
 *
 * A-19.10 sagt es schon: „Beim Hinzufügen bestimmt die gewählte Art das
 * Eingabefeld." Drei Felder nebeneinander hießen, dass ein Aufrufer zwei davon
 * füllen könnte — und dann entschiede die Reihenfolge im Code, welches gilt.
 * Der Dienst nimmt genau diese Gestalt entgegen; `tsc` bricht hier ab, bevor
 * eine Anfrage überhaupt entsteht.
 *
 * Beim **Bild** geht der Pfad der **Quelle** mit und nicht ihre Bytes: Der
 * Rumpf einer Anfrage ist auf ein Megabyte begrenzt (B-1.7), ein Bild darf
 * acht Mebibyte groß sein. Der Dienst liest die Datei selbst und legt eine
 * Kopie an (E-071 Punkt 2); gespeichert wird der erzeugte Name der Kopie und
 * nie der Name der Quelle (Auflage A-A-17).
 */
export type AttachmentCreate =
  | { readonly kind: "link"; readonly url: DraftText; readonly title?: DraftText | null }
  | { readonly kind: "file"; readonly path: DraftText; readonly title?: DraftText | null }
  | { readonly kind: "image"; readonly sourcePath: DraftText; readonly title?: DraftText | null };

/**
 * Das Vorschaubild eines Bildanhangs (A-19.13, E-071 Punkt 3).
 *
 * **Warum nicht `<img src="http://127.0.0.1:17843/…">`.** Weil ein `<img src>`
 * **kein** `X-Takt-Token` trägt — der Browser setzt bei einem Bildabruf keine
 * eigenen Kopfzeilen. Der Weg über die CSP bräuchte deshalb entweder eine
 * unauthentifizierte Byte-Route auf einem Port, den jeder lokale Prozess
 * erreicht (VG-1), oder ein Geheimnis in der Adresse, das danach im Verlauf und
 * in jeder Fehlermeldung stünde (B-2.4, T-145-9).
 *
 * Stattdessen: Der Dienst liefert die Bytes über die schon erlaubte Verbindung,
 * **fertig kodiert**, und die Oberfläche setzt daraus eine `data:`-Adresse
 * zusammen. `img-src 'self' data:` bleibt unverändert; die Positivliste wird
 * dafür nicht geöffnet (Auflage A-A-12).
 */
export interface AttachmentImage {
  /** `image/png`, `image/jpeg`, `image/gif`, `image/webp` (Auflage A-A-16). */
  readonly mediaType: TechnicalKey;
  readonly base64: EncodedBytes;
}

/**
 * `POST /todos` liefert **nicht** das Todo allein.
 *
 * `addedDefaultTagIds` nennt die Tags, die der Dienst nach A-9.5 ergänzt hat.
 * Sie gehören in die Rückmeldung: Der Benutzer hat sie nicht gewählt, und ein
 * Tag, der ungefragt erscheint, gehört ausgesprochen.
 */
export interface TodoCreated {
  readonly todo: Todo;
  readonly addedDefaultTagIds: readonly Id[];
  /**
   * Welche Tags durch `tagNames` neu entstanden sind (T-058).
   *
   * Vollständige Tags und nicht nur Kennungen, damit die Oberfläche den neuen
   * Namen sofort nennen kann, ohne den Baum erneut zu holen. Ältere
   * Dienststände liefern das Feld nicht — dann ist es `undefined`, und die
   * Ansicht sagt einfach nichts darüber.
   */
  readonly createdTags?: readonly Tag[];
}

/* ==================================================================== */
/* Todos                                                                */
/* ==================================================================== */

/**
 * `GET /todos`.
 *
 * Die Namen sind die, auf die der Dienst hört: `search`, `onlyOpen`. Die
 * Beschreibung nannte einmal `q` und `nurOffene`; seit T-039 nennt sie
 * dieselben Namen wie die Route. Der Vermerk bleibt stehen, damit niemand die
 * alte Fassung als die richtige liest.
 */
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

/**
 * Antwort ist `{ todo, addedDefaultTagIds }` — nicht das Todo allein. Die
 * ergänzten Standard-Tags (A-9.5) gehören in die Rückmeldung.
 */
export function createTodo(body: TodoCreate): Promise<TodoCreated> {
  return request<TodoCreated>("/todos", { method: "POST", body });
}

export function updateTodo(id: Id, body: TodoUpdate): Promise<Todo> {
  return request<Todo>(`/todos/${encodeURIComponent(id)}`, { method: "PATCH", body });
}

export function deleteTodo(id: Id): Promise<void> {
  return request<void>(`/todos/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ==================================================================== */
/* Anhänge (A-19.8 bis A-19.15)                                         */
/* ==================================================================== */

/**
 * `GET /todos/{id}/attachments`.
 *
 * **Eigene Routen außerhalb von `/addin`**, und das ist die Grenze aus A-19.19
 * (Auflage A-A-21). Sie trägt ohne einen einzigen neuen Wächter:
 * `requiredCredentialForPath` schließt alles außerhalb von `/addin` und
 * `SHARED_PATHS` von selbst, und `proof:route-policy` fährt jede Route der
 * zusammengebauten Anwendung mit dem Add-in-Token an — die neuen werden
 * mitgemessen, ohne dass jemand daran denken muss.
 *
 * **Das Laden einer Liste öffnet nichts** (A-19.18, Auflage A-A-24). Diese
 * Funktion holt Beschreibungen; Bytes holt {@link getAttachmentImage}, und
 * geöffnet wird ausschließlich auf Klick über die Hülle.
 */
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

/**
 * `DELETE /todos/{id}/attachments/{attachmentId}` (A-19.11).
 *
 * Bei einem **Bild** geht die Kopie im Anwendungsdatenverzeichnis mit
 * (Auflage A-A-18). Eine verwaiste Kopie ist Kundenmaterial ohne Eigentümer;
 * das zu besorgen ist Sache des Dienstes und nicht der Oberfläche.
 */
export function deleteAttachment(todoId: Id, attachmentId: Id): Promise<void> {
  return request<void>(
    `/todos/${encodeURIComponent(todoId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: "DELETE" },
  );
}

/**
 * `GET /todos/{id}/attachments/{attachmentId}/image` — die Bytes des
 * Vorschaubildes, **fertig kodiert** (A-19.13, E-071 Punkt 3).
 *
 * Die Kodierung liegt in der Domäne (A-8.4) und nicht hier; die Oberfläche
 * setzt aus `mediaType` und `base64` eine `data:`-Adresse zusammen und rechnet
 * dabei nichts. Der Umweg über diese Route statt über ein
 * `<img src="http://127.0.0.1:17843/…">` hat einen Grund, und er steht bei
 * {@link AttachmentImage}: Ein `<img src>` trägt kein `X-Takt-Token`.
 */
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

/**
 * A-2.4 — erledigt setzen. Der **Status** bleibt unverändert (E-023).
 *
 * Unverändert bleibt der Status, nicht die Spalte: Seit E-055 darf eine Regel
 * nach „Erledigt" fragen, und dann wechselt die Karte mit genau dieser
 * Handlung. Die Bewegung dazu steht seit E-060 **in der Antwort**
 * ({@link TodoDoneResult}): `poolMovement`, gerechnet vom selben Anwendungsfall
 * wie an den Timer-Routen, mit dem Anlaß `'booking'` — der neutralen Form, die
 * kein Wort von Buchung trägt.
 *
 * Die Oberfläche rechnet nichts nach, sie liest.
 *
 * Vorgeschichte: `docs/decisions/todos.md`.
 */
export function markTodoDone(id: Id): Promise<TodoDoneResult> {
  return request<TodoDoneResult>(`/todos/${encodeURIComponent(id)}/done`, {
    method: "PUT",
    body: {},
  });
}

/**
 * A-2.5 — „Erledigt“ von Hand aufheben.
 *
 * Anlaß `'reopen'`: Das Todo war erledigt und kehrt in seine Pools zurück —
 * derselbe Satz, den der Timerstart nach A-2.5 zeigt, und aus derselben
 * Funktion (E-060 Punkt 2).
 *
 * **Diese Handlung verschiebt sehr wohl Karten.** Eine Spalte, die nach
 * „Erledigt" fragt, verliert oder gewinnt das Todo mit ihr (E-055). Siehe
 * {@link markTodoDone}.
 *
 * Vorgeschichte: `docs/decisions/todos.md`.
 */
export function clearTodoDone(id: Id): Promise<TodoDoneResult> {
  return request<TodoDoneResult>(`/todos/${encodeURIComponent(id)}/done`, { method: "DELETE" });
}
