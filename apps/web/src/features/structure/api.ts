import type {
  Id,
  PoolPatch,
  PoolSurfaceQuery,
  Pool,
  PoolWrite,
} from "../../api/types";
import { request } from "../../api/client";

/** `placement: "board"` legt eine Kanban-Spalte an. Eine eigene Route dafür gibt es nicht. */
export function createPool(body: PoolWrite): Promise<Pool> {
  return request<Pool>("/pools", { method: "POST", body });
}

/** Der Dienst filtert nach Fläche; `all` dient der Verwaltung. */
export function listPools(surface: PoolSurfaceQuery = "pool"): Promise<readonly Pool[]> {
  return request<readonly Pool[]>("/pools", { query: { placement: surface } });
}

/** Eine Änderung der Platzierung lässt die übrigen Pooldaten unverändert. */
export function updatePool(id: Id, body: PoolPatch): Promise<Pool> {
  return request<Pool>(`/pools/${encodeURIComponent(id)}`, { method: "PATCH", body });
}

export function deletePool(id: Id): Promise<void> {
  return request<void>(`/pools/${encodeURIComponent(id)}`, { method: "DELETE" });
}
