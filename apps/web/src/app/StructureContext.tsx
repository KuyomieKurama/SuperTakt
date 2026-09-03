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
import { flatFolders } from "../lib/folderPaths";
import type { RuleLookup } from "../lib/poolRule";
import { useAsync, type AsyncState } from "./useAsync";

/**
 * Takt — der Aufbau, den fast jede Ansicht braucht.
 *
 * Statuswerte, Tag-Baum, Pools und Einstellungen ändern sich selten und
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
  /**
   * Die Regeln der **Pool-Fläche** (E-054): `placement` `pool` oder `both`.
   *
   * Das ist die Liste für Pool-Filter und Pool-Navigation. Eine Regel, die der
   * Benutzer ausdrücklich nur auf das Board gestellt hat, steht hier nicht —
   * sie hier mitzuführen hieße, seine Entscheidung zu übergehen.
   */
  readonly pools: readonly Pool[];
  /**
   * **Alle** Regeln, unabhängig von der Fläche.
   *
   * Zwei Leser: die Verwaltung in S-11, die jede Regel zeigen und ihren
   * Anzeigeort ändern können muss, und das Auflösen einer Kennung zu einem
   * Namen — etwa wenn die Todo-Liste über `?pool=` nach einer Board-Spalte
   * filtert. Ohne sie stünde dort ein Filter, der wirkt, aber nicht angezeigt
   * wird.
   *
   * **Zwei Abrufe statt eines mit Filter.** Welche Regel auf welcher Fläche
   * steht, entscheidet der Dienst (`WHERE placement IN (?, 'both')`). Hier aus
   * `rules` die `pools` zu filtern hieße, dieses Prädikat ein zweites Mal zu
   * schreiben — und die zweite Fassung fiele erst auf, wenn eine Regel an der
   * falschen Stelle erscheint.
   */
  readonly rules: readonly Pool[];
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
  /** Name einer Regel, gleich auf welcher Fläche sie steht. */
  readonly ruleName: (id: Id) => string | undefined;
  readonly allTags: readonly TagInfo[];
  /**
   * In welchen Pools liegt dieses Todo (A-3.4)?
   *
   * Die Frage beantwortet der **Dienst**, nicht die Oberfläche: je Pool ein
   * Aufruf von `/pools/{id}/todos`. Die Regelauswertung liegt in
   * `packages/domain`; sie hier nachzubauen hieße, zwei Wahrheiten über
   * dieselbe Zugehörigkeit zu führen — und die eine davon fiele erst auf,
   * wenn ein Todo nach A-2.5 im falschen Pool auftaucht.
   *
   * **Die Antwort ist vollständig oder sie ist keine** (B-3b aus R-2, T-091).
   * Wer sie einsetzt, schreibt daraus eine Aufzählung — „Es ist zurück in den
   * Pools A, B und C" —, und eine Aufzählung behauptet Vollständigkeit. Siehe
   * die Umsetzung: Die stille Kürzung bei zwölf ist deshalb weg.
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
    const [statuses, tagTree, pools, rules, view] = await Promise.all([
      listTodoStatuses(),
      getTagTree(),
      listPools("pool"),
      listPools("all"),
      getSettings(),
    ]);
    return {
      statuses,
      tagTree,
      pools,
      rules,
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

  const ruleIndex = useMemo(() => {
    const map = new Map<Id, string>();
    for (const rule of value?.rules ?? []) map.set(rule.id, rule.name);
    return map;
  }, [value]);

  const ruleName = useCallback((id: Id) => ruleIndex.get(id), [ruleIndex]);

  const statusName = useCallback(
    (id: Id) => statusIndex.get(id) ?? "Unbekannter Status",
    [statusIndex],
  );

  const pools = value?.pools ?? null;

  /**
   * **Keine stille Kürzung mehr** (B-3b aus R-2, T-091).
   *
   * Bis T-091 stand hier `pools.slice(0, 12)`. Der einzige Aufrufer macht aus
   * der Antwort eine Aufzählung, und eine Aufzählung sagt „das sind sie" —
   * beim dreizehnten Pool sagte sie das fälschlich. Seit E-054 ist jede
   * Board-Spalte mit Anzeigeort „beide" zugleich ein Pool; zwölf sind damit
   * schnell erreicht.
   *
   * **Warum aufheben und nicht benennen.** „… und drei weitere" wäre hier
   * nicht sagbar, ohne selbst falsch zu sein: Gekürzt wurde **vor** der
   * Abfrage, also weiß niemand, ob die übersprungenen Pools das Todo überhaupt
   * enthalten. Der Satz hieße „drei weitere, vielleicht" — und das ist keine
   * Auskunft, sondern eine Ausrede.
   *
   * **Was das kostet.** Ein Abruf je Pool, alle nebenläufig, gegen einen
   * Dienst auf `127.0.0.1` und eine eingebettete SQLite-Datei. Die Zahl der
   * Pools legt der Benutzer selbst an; sie ist keine Datenmenge, sondern eine
   * Konfiguration. Der Vorgang läuft ausserdem nur beim Timerstart auf einem
   * **erledigten** Todo — nicht bei jedem Start.
   *
   * **Und er läuft nicht mehr lange.** Nach E-058 liefert `POST /timer/start`
   * die Bewegung als `poolMovement` mit, und dieser Weg entfällt vollständig
   * (Welle B). Bis dahin ist eine ehrliche Aufzählung mehr wert als eine
   * billige.
   */
  const poolsContaining = useCallback(
    async (todoId: Id): Promise<readonly string[]> => {
      if (pools === null || pools.length === 0) return [];
      const results = await Promise.all(
        pools.map(async (pool) => {
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
    () => ({ state, reload, tagInfo, statusName, ruleName, allTags, poolsContaining }),
    [state, reload, tagInfo, statusName, ruleName, allTags, poolsContaining],
  );

  return <StructureContext.Provider value={api}>{children}</StructureContext.Provider>;
}


/**
 * Woher eine Regelzusammenfassung ihre Namen holt (T-079).
 *
 * Drei Ansichten stellen dieselbe Frage — das Board unter jedem Spaltenkopf,
 * die Regelverwaltung in jeder Zeile und das Regelformular in seiner Vorschau:
 * Wie heißt das Tag, der Ordner, der Status hinter dieser Kennung? Vor T-079
 * beantworteten zwei davon sie getrennt, und die dritte gab es nicht.
 *
 * Der Nachschlag ist bewusst ein **Argument** von `describeRule` und kein
 * Zusammenhang, den die Beschreibung sich selbst holt: Damit bleibt
 * `lib/poolRule.ts` ohne laufenden Dienst prüfbar und auf der Musterseite des
 * Designsystems zeigbar, wo es keinen `StructureProvider` gibt. Dieser Haken
 * ist nur die Brücke dorthin.
 */
export function useRuleLookup(): RuleLookup {
  const { state, tagInfo } = useStructure();
  const value = state.status === "ready" ? state.value : null;

  const folderPaths = useMemo(() => {
    const map = new Map<Id, readonly string[]>();
    if (value !== null) for (const entry of flatFolders(value.tagTree)) map.set(entry.id, entry.path);
    return map;
  }, [value]);

  const statusNames = useMemo(() => {
    const map = new Map<Id, string>();
    for (const status of value?.statuses ?? []) map.set(status.id, status.name);
    return map;
  }, [value]);

  return useMemo<RuleLookup>(
    () => ({
      tag: (id) => {
        const info = tagInfo(id);
        return info === undefined ? undefined : { name: info.tag.name, path: info.path };
      },
      folder: (id) => folderPaths.get(id),
      status: (id) => statusNames.get(id),
    }),
    [tagInfo, folderPaths, statusNames],
  );
}
