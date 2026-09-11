import { request } from "../../api/client";
import type { Pool, PoolWrite } from "../../api/types";

/**
 * Takt — die Route, die **nur** dieses Merkmal angeht (A-3.4, E-054).
 *
 * Eine einzige: das Anlegen einer Regel. Das Formular in `PoolFormDialog.tsx`
 * ist die einzige Fläche, die `POST /pools` ruft — Board und Tag-Verwaltung
 * öffnen dafür dieses Formular, statt selbst anzulegen.
 *
 * **Die drei übrigen Pool-Routen stehen ausdrücklich nicht hier**, nach der
 * Regel aus `features/bookings/api.ts`: Was mehrere Flächen lesen, gehört
 * keiner.
 *
 *   `listPools` — `app/StructureContext.tsx` ruft sie an, und `app/` liegt
 *   **unter** den Merkmalen. Eine Einfuhr aus `features/structure/` an dieser
 *   Stelle drehte die Richtung um.
 *
 *   `updatePool` — `features/board` (drei Dateien), `features/tags` und beide
 *   Dialoge dieses Merkmals schreiben darüber.
 *
 *   `deletePool` — der einzige Aufrufer ist `features/tags/PoolAdministration`.
 *
 * Dieselbe Trennung gilt für die Typen: `Pool`, `PoolWrite`, `PoolPatch`,
 * `PoolRuleTerm` und `PoolResolution` bleiben in `api/types.ts`, weil
 * `updatePool` dort geblieben ist und `api/types.ts` aus `features/` nichts
 * einführen darf.
 */

/** `placement: "board"` legt eine Kanban-Spalte an. Eine eigene Route dafür gibt es nicht. */
export function createPool(body: PoolWrite): Promise<Pool> {
  return request<Pool>("/pools", { method: "POST", body });
}
