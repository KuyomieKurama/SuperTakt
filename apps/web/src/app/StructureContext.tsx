import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import {
  getTagTree,
  listPoolTodos,
  listPools,
  listTodoStatuses,
  getSettings,
} from "../api/endpoints";
import type {
  AppSettings,
  DefaultTag,
  ExportDirectoryState,
  ExportDirectoryTrait,
  Id,
  Pool,
  Tag,
  TagTree,
  TodoStatus,
} from "../api/types";
import { useAsync, type AsyncState } from "./useAsync";

/**
 * Takt — der Aufbau, den fast jede Ansicht braucht.
 *
 * Statusspalten, Tag-Baum, Pools und Einstellungen ändern sich selten und
 * werden von acht Ansichten gelesen. Sie einmal zu laden und weiterzureichen
 * ist der Unterschied zwischen einer Anwendung und einer Sammlung von Seiten,
 * die sich gegenseitig nicht kennen.
 *
 * **Abgeleitet wird hier nur, was Darstellung ist:** der Pfad eines Tags im
 * Ordnerbaum, die Zuordnung Kennung zu Name. Regeln — welches Todo in welchem
 * Pool liegt (A-3.4), was erledigt bedeutet (A-2.4), wie gerundet wird (E-008)
 * — stehen in `packages/domain` und werden hier nicht nachgebaut.
 */

export interface TagInfo {
  readonly tag: Tag;
  /** Ordnerpfad ohne den Tag selbst, zum Beispiel `["Kunden", "Nord"]`. */
  readonly path: readonly string[];
}

export interface Structure {
  readonly statuses: readonly TodoStatus[];
  readonly tagTree: TagTree;
  readonly pools: readonly Pool[];
  readonly settings: AppSettings;
  /** Der **jetzt** geprüfte Zustand des Exportordners (R-11). */
  readonly exportDirectoryState: ExportDirectoryState;
  /**
   * Was am Exportordner belegt ist (T-039). Leer heißt „nichts belegt" und
   * nirgends „unbedenklich" — ein zugeordnetes Netzlaufwerk sieht der Dienst
   * nicht.
   */
  readonly exportDirectoryTraits: readonly ExportDirectoryTrait[];
  readonly defaultTags: readonly DefaultTag[];
  /**
   * Der Name, unter dem abgerechnet wird (E-010, E-042, C-20).
   *
   * Er hängt hier mit drin, weil ihn zwei Ansichten brauchen: S-09 zeigt ihn
   * als Auskunft, S-07 nennt ihn vor dem Lauf. Ein zweiter Abruf von
   * `/settings` für dieselbe Zeichenkette wäre eine zweite Wahrheit über
   * denselben Namen.
   */
  readonly windowsUser: string;
  /** Wo der Bestand liegt (E-018, R-13). `null` im Arbeitsspeicher. */
  readonly databasePath: string | null;
}

export interface StructureApi {
  readonly state: AsyncState<Structure>;
  readonly reload: () => void;
  /** Tag samt Ordnerpfad. `undefined`, wenn die Kennung unbekannt ist. */
  readonly tagInfo: (id: Id) => TagInfo | undefined;
  readonly statusName: (id: Id) => string;
  readonly allTags: readonly TagInfo[];
  /**
   * In welchen Pools liegt dieses Todo (A-3.4)?
   *
   * Die Frage beantwortet der **Dienst**, nicht die Oberfläche: je Pool ein
   * Aufruf von `/pools/{id}/todos`. Die Regelauswertung liegt in
   * `packages/domain`; sie hier nachzubauen hieße, zwei Wahrheiten über
   * dieselbe Zugehörigkeit zu führen — und die eine davon fiele erst auf,
   * wenn ein Todo nach A-2.5 im falschen Pool auftaucht.
   */
  readonly poolsContaining: (todoId: Id) => Promise<readonly string[]>;
}

const StructureContext = createContext<StructureApi | null>(null);

export function useStructure(): StructureApi {
  const api = useContext(StructureContext);
  if (api === null) {
    throw new Error("useStructure steht nur innerhalb von StructureProvider zur Verfügung.");
  }
  return api;
}

/** Läuft den Baum ab und legt jeden Tag mit seinem Ordnerpfad ab. */
function collectTags(tree: TagTree): readonly TagInfo[] {
  const out: TagInfo[] = [];
  for (const tag of tree.rootTags) out.push({ tag, path: [] });

  const walk = (nodes: TagTree["rootFolders"], prefix: readonly string[]): void => {
    for (const node of nodes) {
      const path = [...prefix, node.folder.name];
      for (const tag of node.tags) out.push({ tag, path });
      walk(node.subfolders, path);
    }
  };
  walk(tree.rootFolders, []);
  return out;
}

export function StructureProvider({ children }: { readonly children: ReactNode }) {
  const { state, reload } = useAsync<Structure>(async () => {
    const [statuses, tagTree, pools, view] = await Promise.all([
      listTodoStatuses(),
      getTagTree(),
      listPools(),
      getSettings(),
    ]);
    return {
      statuses,
      tagTree,
      pools,
      settings: view.settings,
      exportDirectoryState: view.exportDirectoryState,
      // Ältere Dienststände liefern das Feld nicht; dann ist die Liste leer,
      // und die Oberfläche sagt ohnehin nur „nichts belegt".
      exportDirectoryTraits: view.exportDirectoryTraits ?? [],
      defaultTags: view.defaultTags,
      // Beide Felder liefert `GET /settings` seit T-041/T-042. Der Rückfall
      // ist trotzdem hier und nicht in der Ansicht: Ein älterer Dienststand
      // soll die Oberfläche nicht mit `undefined` in einer Zeichenkette
      // überraschen. Was daraus folgt, sagt die Ansicht dann selbst — „der
      // Dienst nennt keinen Namen" ist ein eigener Zustand und keine Lücke.
      windowsUser: view.windowsUser ?? "",
      databasePath: view.databasePath ?? null,
    };
  }, []);

  const value = state.status === "ready" ? state.value : null;

  const allTags = useMemo<readonly TagInfo[]>(
    () => (value === null ? [] : collectTags(value.tagTree)),
    [value],
  );

  const tagIndex = useMemo(() => {
    const map = new Map<Id, TagInfo>();
    for (const info of allTags) map.set(info.tag.id, info);
    return map;
  }, [allTags]);

  const statusIndex = useMemo(() => {
    const map = new Map<Id, string>();
    for (const status of value?.statuses ?? []) map.set(status.id, status.name);
    return map;
  }, [value]);

  const tagInfo = useCallback((id: Id) => tagIndex.get(id), [tagIndex]);

  const statusName = useCallback(
    (id: Id) => statusIndex.get(id) ?? "Unbekannte Spalte",
    [statusIndex],
  );

  const pools = value?.pools ?? null;

  const poolsContaining = useCallback(
    async (todoId: Id): Promise<readonly string[]> => {
      if (pools === null || pools.length === 0) return [];
      const results = await Promise.all(
        pools.slice(0, 12).map(async (pool) => {
          try {
            const page = await listPoolTodos(pool.id, { includeCompleted: false }, { limit: 200 });
            return page.items.some((todo) => todo.id === todoId) ? pool.name : null;
          } catch {
            return null;
          }
        }),
      );
      return results.filter((name): name is string => name !== null);
    },
    [pools],
  );

  const api = useMemo<StructureApi>(
    () => ({ state, reload, tagInfo, statusName, allTags, poolsContaining }),
    [state, reload, tagInfo, statusName, allTags, poolsContaining],
  );

  return <StructureContext.Provider value={api}>{children}</StructureContext.Provider>;
}
