/**
 * Takt — die Routen des Merkmals „Tags und Ordner", je eine Funktion.
 *
 * Der Pfad steht genau einmal. Keine Ansicht setzt eine Adresse zusammen.
 *
 * **Jeder Feldname hier ist der Name des Dienstes.** Ein Rumpf ist ein
 * Objektliteral: Ein falscher Schlüssel fällt keinem Typecheck auf, sondern
 * erst dem Benutzer, dem die Route mit 422 antwortet. T-050 hat einen solchen
 * Namen genau hier gefunden — `neuerParentId`. Wer hier ein Feld ergänzt,
 * gleicht es gegen `apps/local-api/src/routes/**` ab, nicht gegen das
 * Gedächtnis.
 *
 * **Warum `request` hier stehen darf** (E-102, F-22): Die Zusage „in der
 * Oberfläche entsteht kein Aufruf an den Dienst außerhalb der dafür
 * vorgesehenen Stellen" ist seit T-250-2 nicht mehr an der Ordnerstruktur
 * aufgespannt, sondern an der Anforderung — `api/client.ts`, wo `request`
 * entsteht, und jede `features/<merkmal>/api.ts`, die auf der Platte liegt.
 * `proof:callers` sucht diese Menge auf der Platte und vergleicht sie mit dem,
 * was der Sammler gesehen hat; der Name allein erlaubt nichts.
 *
 * **Die Typen bleiben in `api/types.ts`.** `Tag`, `TagFolder`, `TagFolderNode`
 * und `TagTree` sind nicht feature-eigen: Der Tag-Baum liegt im
 * `StructureContext` und wird von acht Ansichten gelesen (`app/StructureContext.tsx`,
 * `lib/folderPaths.ts`). Was mehrere Merkmale teilen, bleibt in `api/`.
 */

import { request } from "../../api/client";
import type { Id, Tag, TagFolder, TagTree } from "../../api/types";

/** Ein Aufruf liefert den ganzen Baum, beliebig tief (A-4.3). */
export function getTagTree(): Promise<TagTree> {
  return request<TagTree>("/tag-tree");
}

/** Liefert eine Liste, keine Seite — der Ordnerinhalt ist immer vollständig. */
export function listTags(folderId: Id | null): Promise<readonly Tag[]> {
  return request<readonly Tag[]>("/tags", {
    query: folderId === null ? {} : { folderId },
  });
}

export function createTag(body: {
  name: string;
  folderId: Id | null;
  color: string | null;
}): Promise<Tag> {
  return request<Tag>("/tags", { method: "POST", body });
}

export function updateTag(
  id: Id,
  body: { name?: string; folderId?: Id | null; color?: string | null },
): Promise<Tag> {
  return request<Tag>(`/tags/${encodeURIComponent(id)}`, { method: "PATCH", body });
}

export function deleteTag(id: Id): Promise<void> {
  return request<void>(`/tags/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createTagFolder(body: { name: string; parentId: Id | null }): Promise<TagFolder> {
  return request<TagFolder>("/tag-folders", { method: "POST", body });
}

export function renameTagFolder(id: Id, name: string): Promise<TagFolder> {
  return request<TagFolder>(`/tag-folders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { name },
  });
}

export function deleteTagFolder(id: Id): Promise<void> {
  return request<void>(`/tag-folders/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * I-08 — Ordner verschachteln. Eigene Route, weil hier die Zyklusprüfung
 * hängt: `tag_folder_cycle`.
 *
 * Der Schlüssel heißt `newParentId`. Er hieß hier bis T-050 `neuerParentId` —
 * ein Name, den weder das Routenschema noch die Beschreibung kennen; die Route
 * wies jeden Aufruf mit 422 ab, und S-08 konnte keinen Ordner verschieben.
 */
export function moveTagFolder(id: Id, newParentId: Id | null): Promise<TagFolder> {
  return request<TagFolder>(`/tag-folders/${encodeURIComponent(id)}/move`, {
    method: "POST",
    body: { newParentId },
  });
}
