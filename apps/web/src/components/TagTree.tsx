import type { ForeignText } from "../api/types";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { cx } from "../lib/cx";
import { Icon } from "./Icon";
import { Foreign } from "./Foreign";

/**
 * Baumansicht der Tag-Ordner — A-4.2 bis A-4.4, S-08, I-07, I-08.
 *
 * Die Hierarchie darf beliebig tief sein. Damit sie trotzdem uebersichtlich
 * bleibt, arbeitet die Ansicht mit vier Mitteln:
 *   1. Einrueckungslinien, die die Zugehoerigkeit einer Ebene sichtbar halten
 *   2. Ordner zeigen die Zahl der enthaltenen Tags, auch aus Unterordnern
 *   3. ab Ebene 6 wird nicht weiter eingerueckt, sondern die Ebene als kleine
 *      Marke im Knoten mitgefuehrt, damit die Spalte nicht wegrutscht
 *
 * Tastatur nach dem Muster "Tree View" der WAI-ARIA Authoring Practices:
 * ein einziger Tabulator-Halt, darin Pfeiltasten, Pos1/Ende, * und Eingabe.
 * Die flache Liste traegt `aria-level`, `aria-posinset` und `aria-setsize`,
 * damit Hilfsmittel die Verschachtelung trotzdem ansagen koennen.
 *
 * ## Auswaehlen und Aufklappen sind zwei Dinge (Befund aus T-012)
 *
 * Bis T-035 taten Klick, Eingabetaste und Leertaste auf einem Knoten **mit
 * Kindern** nur eines: auf- und zuklappen. Auswaehlen liess sich so ein Knoten
 * gar nicht — und weil Umbenennen, Verschieben und Loeschen an der Auswahl
 * haengen, war jeder nicht leere Ordner ueber den Baum nicht zu bearbeiten
 * (A-4.2, A-4.4). Jede einzelne Funktion arbeitete; die Kette brach trotzdem.
 *
 * Deshalb gilt jetzt durchgehend:
 *
 *   Klick auf das Dreieck        klappt auf und zu
 *   Klick auf Namen oder Zeile   waehlt aus
 *   Pfeil rechts / links         klappt auf und zu (bzw. springt ins Kind /
 *                                zum Elternknoten)
 *   Eingabetaste, Leertaste      waehlen aus
 *
 * Das Dreieck traegt seinen eigenen Klickbereich von 24x24 Pixeln (SC 2.5.8)
 * und haelt den Klick bei sich (`stopPropagation`), damit ein Aufklappen nicht
 * nebenbei die Auswahl umsetzt. Es bleibt `aria-hidden`: Fuer Hilfsmittel
 * traegt der Knoten selbst `aria-expanded`, und bedient wird das ueber die
 * Pfeiltasten. Ein Knoten **ohne** Kinder bekommt gar keinen Umschalter — sonst
 * waeren 24 Pixel jeder Zeile eine tote Flaeche.
 *
 * ## Ziehen und Ablegen (T-056)
 *
 * Wer eine Struktur umbaut, denkt in Bewegungen und nicht in Dialogen. Ein
 * Eintrag laesst sich deshalb auf einen Ordner ziehen; die Ablage auf den
 * Streifen unter dem Baum hebt ihn auf die Wurzelebene.
 *
 * Drei Regeln haengen daran:
 *
 *   1. **Zyklen kommen gar nicht erst zustande** (A-4.6). Ein Ordner darf
 *      weder auf sich selbst noch auf einen seiner Nachfahren. Der Dienst
 *      weist das mit `tag_folder_cycle` ab — aber eine Ablegestelle, die nur
 *      dazu da ist, hinterher eine Fehlermeldung auszuloesen, ist keine
 *      Ablegestelle. Sie wird deshalb nicht angeboten: `dragover` verweigert
 *      dort die Annahme, der Zeiger zeigt das Verbotszeichen, und der Zeile
 *      wird nichts angeheftet.
 *   2. **Der Weg ueber den Dialog bleibt** (SC 2.5.7). Ziehen ist die
 *      schnelle Art, nicht die einzige. Auswaehlen und „Verschieben" tun
 *      dasselbe mit einem einzelnen Zeigerdruck und mit der Tastatur.
 *   3. **Ein Tag ist nie eine Ablegestelle.** In einem Tag liegt nichts.
 *
 * Ein zugeklappter Ordner, ueber dem der Zeiger einen Moment verweilt, klappt
 * von selbst auf. Ohne das waere ein tiefer Baum beim Ziehen nicht erreichbar:
 * Man kaeme nur an die Ordner heran, die gerade offen sind.
 */

export interface TagTreeNode {
  readonly id: string;
  readonly label: ForeignText;
  readonly kind: "folder" | "tag";
  /** Anzahl der Tags im Teilbaum. Nur fuer Ordner sinnvoll. */
  readonly tagCount?: number;
  /** Anzahl der Todos, die diesen Tag tragen. Nur fuer Tags sinnvoll. */
  readonly usageCount?: number;
  readonly children?: readonly TagTreeNode[];
}

interface FlatNode {
  readonly node: TagTreeNode;
  readonly level: number;
  readonly parentId: string | null;
  readonly hasChildren: boolean;
  /** Position unter den Geschwistern, 1-basiert. */
  readonly posInSet: number;
  readonly setSize: number;
}

/** Grenze, ab der nicht weiter eingerueckt wird. */
const MAX_INDENT_LEVEL = 5;

function flatten(
  nodes: readonly TagTreeNode[],
  expanded: ReadonlySet<string>,
  level: number,
  parentId: string | null,
  out: FlatNode[],
): void {
  nodes.forEach((node, index) => {
    const children = node.children ?? [];
    out.push({
      node,
      level,
      parentId,
      hasChildren: children.length > 0,
      posInSet: index + 1,
      setSize: nodes.length,
    });
    if (children.length > 0 && expanded.has(node.id)) {
      flatten(children, expanded, level + 1, node.id, out);
    }
  });
}

function collectFolderIds(nodes: readonly TagTreeNode[], out: string[]): void {
  for (const node of nodes) {
    if (node.children !== undefined && node.children.length > 0) {
      out.push(node.id);
      collectFolderIds(node.children, out);
    }
  }
}

/**
 * Elternzuordnung **des ganzen Baums**, nicht nur der sichtbaren Zeilen.
 *
 * Die Zyklusfrage stellt sich unabhaengig davon, was gerade aufgeklappt ist:
 * Ein zugeklappter Unterordner bleibt ein Nachfahre. Waere die Karte nur ueber
 * die flache Liste gebaut, waere jede eingeklappte Ebene eine erlaubte
 * Ablegestelle — und genau der Zyklus, den A-4.6 verbietet.
 */
function collectParents(
  nodes: readonly TagTreeNode[],
  parentId: string | null,
  out: Map<string, string | null>,
): void {
  for (const node of nodes) {
    out.set(node.id, parentId);
    collectParents(node.children ?? [], node.id, out);
  }
}

/** Wie lange der Zeiger auf einem zugeklappten Ordner steht, bis er aufgeht. */
const HOVER_EXPAND_DELAY_MS = 700;

/** Eigener Typ in der Zwischenablage, damit fremde Ziehvorgaenge abprallen. */
const TREE_DRAG_MIME = "application/x-takt-tag-node";

export interface TagTreeProps {
  readonly nodes: readonly TagTreeNode[];
  readonly label: string;
  readonly selectedId: string | null;
  readonly onSelect: (node: TagTreeNode) => void;
  /** Anfangs aufgeklappte Ordner. */
  readonly initiallyExpanded?: readonly string[];
  /**
   * Verschiebt `node` unter `targetFolderId`; `null` heisst Wurzelebene.
   * Ohne diese Zusage laesst sich im Baum nichts ziehen — dann bleibt allein
   * der Weg ueber „Verschieben", und das ist eine gueltige Betriebsart.
   */
  readonly onMove?: (node: TagTreeNode, targetFolderId: string | null) => void;
  /** Sperrt das Ziehen, solange ein Verschieben laeuft. */
  readonly moveBusy?: boolean;
  readonly className?: string;
}

export function TagTree({
  nodes,
  label,
  selectedId,
  onSelect,
  initiallyExpanded = [],
  onMove,
  moveBusy = false,
  className,
}: TagTreeProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(initiallyExpanded),
  );
  const [activeId, setActiveId] = useState<string | null>(nodes[0]?.id ?? null);
  const [dragging, setDragging] = useState<TagTreeNode | null>(null);
  /** `undefined` = keine Ablegestelle, `null` = Wurzelebene. */
  const [dropTarget, setDropTarget] = useState<string | null | undefined>(undefined);
  const listRef = useRef<HTMLUListElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const hoverFolder = useRef<string | null>(null);
  /*
   * Derselbe Wert wie `dragging`, nur sofort lesbar. `dragstart` und das
   * erste `dragover` koennen im selben Arbeitsschritt liegen; der Zustand aus
   * `useState` ist dann noch der alte, und die erste Ablegestelle wuerde
   * abgelehnt, obwohl sie zulaessig ist. Der Zustand traegt die Darstellung,
   * die Referenz die Entscheidung.
   */
  const draggingRef = useRef<TagTreeNode | null>(null);

  const rows = useMemo(() => {
    const out: FlatNode[] = [];
    flatten(nodes, expanded, 1, null, out);
    return out;
  }, [nodes, expanded]);

  const parents = useMemo(() => {
    const out = new Map<string, string | null>();
    collectParents(nodes, null, out);
    return out;
  }, [nodes]);

  const draggable = onMove !== undefined && !moveBusy;

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    hoverFolder.current = null;
  }, []);

  useEffect(() => clearHoverTimer, [clearHoverTimer]);

  /**
   * Darf `source` unter `targetFolderId` liegen? Beantwortet **vor** dem
   * Ablegen, nicht danach (A-4.6).
   */
  const canDrop = useCallback(
    (source: TagTreeNode, targetFolderId: string | null): boolean => {
      // Dort liegt er schon. Ein Verschieben an dieselbe Stelle ist keins.
      if ((parents.get(source.id) ?? null) === targetFolderId) return false;
      if (targetFolderId === null) return true;
      if (source.kind === "tag") return true;
      // Auf sich selbst oder in den eigenen Teilbaum: das waere der Zyklus.
      if (targetFolderId === source.id) return false;
      let cursor: string | null | undefined = targetFolderId;
      while (cursor !== null && cursor !== undefined) {
        if (cursor === source.id) return false;
        cursor = parents.get(cursor) ?? null;
      }
      return true;
    },
    [parents],
  );

  const endDrag = useCallback(() => {
    clearHoverTimer();
    draggingRef.current = null;
    setDragging(null);
    setDropTarget(undefined);
  }, [clearHoverTimer]);

  const focusRow = useCallback((id: string) => {
    setActiveId(id);
    window.requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>(`[data-node-id="${id}"]`)?.focus();
    });
  }, []);

  const toggle = useCallback((id: string, open: boolean) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const onRowDragOver = (event: DragEvent<HTMLElement>, row: FlatNode): void => {
    const source = draggingRef.current;
    if (source === null) return;
    const targetId = row.node.kind === "folder" ? row.node.id : null;
    // Ein Tag ist keine Ablegestelle: In einem Tag liegt nichts.
    if (row.node.kind !== "folder" || !canDrop(source, targetId)) {
      // Ohne `preventDefault` nimmt der Browser hier nichts an und zeigt das
      // Verbotszeichen. Genau so soll eine unzulaessige Stelle sich anfuehlen.
      if (dropTarget !== undefined) setDropTarget(undefined);
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTarget !== targetId) setDropTarget(targetId);

    // Zugeklappter Ordner unter dem Zeiger: nach kurzem Verweilen aufklappen,
    // sonst waere ein tiefer Baum beim Ziehen nicht erreichbar.
    if (row.hasChildren && !expanded.has(row.node.id) && hoverFolder.current !== row.node.id) {
      clearHoverTimer();
      hoverFolder.current = row.node.id;
      hoverTimer.current = window.setTimeout(() => {
        toggle(row.node.id, true);
        hoverTimer.current = null;
      }, HOVER_EXPAND_DELAY_MS);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, row: FlatNode): void => {
    const index = rows.findIndex((candidate) => candidate.node.id === row.node.id);
    const isOpen = expanded.has(row.node.id);

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const next = rows[Math.min(index + 1, rows.length - 1)];
        if (next !== undefined) focusRow(next.node.id);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const previous = rows[Math.max(index - 1, 0)];
        if (previous !== undefined) focusRow(previous.node.id);
        break;
      }
      case "ArrowRight":
        event.preventDefault();
        if (row.hasChildren && !isOpen) {
          toggle(row.node.id, true);
        } else if (row.hasChildren) {
          const child = rows[index + 1];
          if (child !== undefined) focusRow(child.node.id);
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (row.hasChildren && isOpen) {
          toggle(row.node.id, false);
        } else if (row.parentId !== null) {
          focusRow(row.parentId);
        }
        break;
      case "Home": {
        event.preventDefault();
        const first = rows[0];
        if (first !== undefined) focusRow(first.node.id);
        break;
      }
      case "End": {
        event.preventDefault();
        const last = rows[rows.length - 1];
        if (last !== undefined) focusRow(last.node.id);
        break;
      }
      case "*": {
        event.preventDefault();
        const ids: string[] = [];
        collectFolderIds(nodes, ids);
        setExpanded(new Set(ids));
        break;
      }
      /*
       * Auswaehlen, auch bei einem Ordner mit Inhalt. Auf- und Zuklappen
       * liegt auf Pfeil rechts und links — so trennt es die APG, und so
       * bleibt der einzige Weg zu den Aktionen eines Ordners offen.
       */
      case "Enter":
      case " ":
        event.preventDefault();
        onSelect(row.node);
        break;
      default:
        break;
    }
  };

  const rootDropAllowed = dragging !== null && canDrop(dragging, null);

  return (
    <div className={cx("tree-shell", className)}>
      <ul className="tree" role="tree" aria-label={label} ref={listRef}>
      {rows.map((row) => {
        const isOpen = expanded.has(row.node.id);
        const selected = selectedId === row.node.id;
        const indentLevel = Math.min(row.level, MAX_INDENT_LEVEL);
        const clipped = row.level > MAX_INDENT_LEVEL;
        const isDragged = dragging?.id === row.node.id;
        const isDropTarget = dropTarget !== undefined && dropTarget === row.node.id;
        return (
          <li
            key={row.node.id}
            role="treeitem"
            aria-level={row.level}
            aria-posinset={row.posInSet}
            aria-setsize={row.setSize}
            aria-expanded={row.hasChildren ? isOpen : undefined}
            aria-selected={selected}
            className={cx("tree__item", isDragged && "tree__item--dragging")}
            data-node-id={row.node.id}
            tabIndex={activeId === row.node.id ? 0 : -1}
            draggable={draggable}
            onFocus={() => setActiveId(row.node.id)}
            onKeyDown={(event) => onKeyDown(event, row)}
            onClick={() => {
              onSelect(row.node);
              focusRow(row.node.id);
            }}
            onDragStart={(event: DragEvent<HTMLElement>) => {
              if (!draggable) return;
              event.dataTransfer.setData(TREE_DRAG_MIME, row.node.id);
              event.dataTransfer.effectAllowed = "move";
              draggingRef.current = row.node;
              setDragging(row.node);
            }}
            onDragEnd={endDrag}
            onDragOver={(event: DragEvent<HTMLElement>) => onRowDragOver(event, row)}
            onDragLeave={() => {
              if (hoverFolder.current === row.node.id) clearHoverTimer();
            }}
            onDrop={(event: DragEvent<HTMLElement>) => {
              event.preventDefault();
              event.stopPropagation();
              const source = draggingRef.current;
              endDrag();
              if (source === null || onMove === undefined) return;
              if (row.node.kind !== "folder" || !canDrop(source, row.node.id)) return;
              onMove(source, row.node.id);
            }}
          >
            <div
              className={cx(
                "tree__row",
                selected && "tree__row--selected",
                row.node.kind === "tag" && "tree__row--tag",
                isDropTarget && "tree__row--drop",
              )}
              style={{ paddingInlineStart: `calc(${indentLevel - 1} * var(--space-5) + var(--space-2))` }}
            >
              {row.hasChildren ? (
                <span
                  className="tree__twisty tree__twisty--active"
                  aria-hidden
                  onClick={(event) => {
                    // Der Klick bleibt hier: Aufklappen ist keine Auswahl.
                    event.stopPropagation();
                    toggle(row.node.id, !isOpen);
                    focusRow(row.node.id);
                  }}
                >
                  <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={14} />
                </span>
              ) : (
                <span className="tree__twisty" aria-hidden />
              )}
              <span className="tree__icon" aria-hidden>
                <Icon
                  name={row.node.kind === "tag" ? "tag" : isOpen ? "folder-open" : "folder"}
                  size={15}
                />
              </span>
              <span className="tree__label truncate">
                {clipped ? (
                  <span className="tree__depth" title={`Ebene ${row.level}`}>
                    E{row.level}
                  </span>
                ) : null}
                <Foreign value={row.node.label} />
              </span>
              {row.node.kind === "folder" && row.node.tagCount !== undefined ? (
                <span className="tree__count">
                  <span aria-hidden>{row.node.tagCount}</span>
                  <span className="visually-hidden">{row.node.tagCount} Tags in diesem Ordner</span>
                </span>
              ) : null}
              {row.node.kind === "tag" && row.node.usageCount !== undefined ? (
                <span className="tree__count">
                  <span aria-hidden>{row.node.usageCount}</span>
                  <span className="visually-hidden">
                    {row.node.usageCount} Todos mit diesem Tag
                  </span>
                </span>
              ) : null}
              {/* Der Griff sagt, dass die Zeile beweglich ist. Sein Platz ist
                  immer belegt, damit beim Ueberfahren nichts springt. */}
              {draggable ? (
                <span className="tree__grip" aria-hidden>
                  <Icon name="drag" size={13} />
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
      </ul>

      {/*
        Die Wurzelebene hat keine Zeile, auf die man zielen koennte. Sie
        bekommt deshalb einen eigenen Streifen — sichtbar nur waehrend eines
        Ziehvorgangs, und nur dann, wenn die Ablage dort ueberhaupt etwas
        aendern wuerde.
      */}
      {rootDropAllowed ? (
        <div
          className={cx("tree__root-drop", dropTarget === null && "tree__root-drop--over")}
          onDragOver={(event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            clearHoverTimer();
            if (dropTarget !== null) setDropTarget(null);
          }}
          onDragLeave={() => setDropTarget(undefined)}
          onDrop={(event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            const source = draggingRef.current;
            endDrag();
            if (source === null || onMove === undefined) return;
            if (!canDrop(source, null)) return;
            onMove(source, null);
          }}
        >
          <Icon name="arrow-up" size={14} />
          Hierher ziehen: auf die Wurzelebene
        </div>
      ) : null}

      {draggable ? (
        <p className="tree__hint">
          Ziehen legt einen Eintrag in einen Ordner. Stellen, die einen Ordner in sich selbst
          brächten, nehmen ihn erst gar nicht an. Mit der Tastatur: auswählen, dann „Verschieben“.
        </p>
      ) : null}
    </div>
  );
}
