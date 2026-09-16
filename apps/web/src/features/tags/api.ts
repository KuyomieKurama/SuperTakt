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

/** Der Dienst weist zyklische Verschachtelungen mit `tag_folder_cycle` ab. */
export function moveTagFolder(id: Id, newParentId: Id | null): Promise<TagFolder> {
  return request<TagFolder>(`/tag-folders/${encodeURIComponent(id)}/move`, {
    method: "POST",
    body: { newParentId },
  });
}
