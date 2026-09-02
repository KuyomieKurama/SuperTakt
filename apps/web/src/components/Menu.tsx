import { useCallback, useEffect, useMemo, type KeyboardEvent, type ReactNode } from "react";
import { Menu as Ark, useMenu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { cx } from "../lib/cx";
import { Icon, type IconName } from "./Icon";

/**
 * Auswahlliste und Kontextmenü — Abschnitt 15, seit T-059 auf Ark UI (E-052).
 *
 * ## Was sich geändert hat und was ausdrücklich nicht
 *
 * Die **Schnittstelle** ist dieselbe geblieben: `MenuEntry`, `Menu`,
 * `ContextMenu` und `ContextMenuState` heißen und bedeuten, was sie vorher
 * bedeuteten. Kein Aufrufer musste angefasst werden.
 *
 * Ausgetauscht ist der **Unterbau**. Vorher stand hier eine eigene Liste mit
 * eigener Tastaturbedienung, eigenem Fokusversprechen und einem
 * `pointerdown`-Wächter auf dem Dokument. Das war richtig gebaut, aber es war
 * die dritte Fassung derselben Sache im Projekt — und die Teile, die man
 * dabei übersieht, sind immer dieselben: Anschreiben mit der Tastatur,
 * Umklappen des Menüs am Bildschirmrand, geschachtelte Ebenen, die Frage,
 * welche Ebene ein Escape trifft.
 *
 * Die Tastaturbedienung ist damit nicht weniger, sondern mehr:
 *   Pfeil ab / auf   Eintrag wechseln
 *   Pos1 / Ende      erster / letzter Eintrag
 *   Buchstaben       springt zum Eintrag, der so anfängt (neu)
 *   Eingabe / Leer   Eintrag auslösen
 *   Escape           schließen, Fokus kehrt zum Auslöser zurück
 *   Tabulator        schließen
 * Gesperrte Einträge werden übersprungen, bleiben aber lesbar — und ihr Grund
 * steht als zweite Zeile darunter, nicht nur im Titel.
 *
 * ## Das Kontextmenü hat weiterhin einen Tastaturweg
 *
 * Es öffnet über die Kontextmenü-Taste und über Umschalt+F10; ein Menü, das
 * nur auf den rechten Mausklick hört, wäre mit der Tastatur nicht erreichbar.
 * Diesen Weg legen die Aufrufer (`BookingTable`), und er bleibt unverändert:
 * Sie melden einen Punkt, und das Menü klappt dort auf.
 */

export interface MenuAction {
  readonly kind?: "action";
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly tone?: "default" | "danger";
  readonly disabled?: boolean;
  /** Grund für die Sperre. Wird als Hilfetext angezeigt. */
  readonly disabledReason?: string;
  /** Tastenkürzel, rechtsbündig dargestellt. */
  readonly shortcut?: string;
  readonly onSelect: () => void;
}

export interface MenuSeparator {
  readonly kind: "separator";
  readonly id: string;
}

export type MenuEntry = MenuAction | MenuSeparator;

function isAction(entry: MenuEntry): entry is MenuAction {
  return entry.kind !== "separator";
}

/**
 * Escape gehört dem offenen Menü, nicht dem Dialog dahinter.
 *
 * Der Inhalt hängt im Portal am Dokumentkörper, steht im React-Baum aber
 * weiterhin unter seinem Auslöser — und damit unter einem Dialog, falls einer
 * da ist. Ohne diese Bremse schlösse ein Escape beides auf einmal.
 */
function stopClosingKeys(event: KeyboardEvent<HTMLElement>): void {
  if (event.key === "Escape" || event.key === "Tab") event.stopPropagation();
}

function MenuItems({ entries }: { readonly entries: readonly MenuEntry[] }) {
  return (
    <>
      {entries.map((entry) => {
        if (!isAction(entry)) {
          return <Ark.Separator key={entry.id} className="menu__separator" />;
        }
        const disabled = entry.disabled === true;
        return (
          <Ark.Item
            key={entry.id}
            value={entry.id}
            disabled={disabled}
            valueText={entry.label}
            className={cx("menu__item", entry.tone === "danger" && "menu__item--danger")}
            {...(disabled && entry.disabledReason !== undefined
              ? { title: entry.disabledReason }
              : {})}
          >
            <span className="menu__item-icon">
              {entry.icon !== undefined ? <Icon name={entry.icon} size={15} /> : null}
            </span>
            <span className="menu__item-label">
              {entry.label}
              {disabled && entry.disabledReason !== undefined ? (
                <span className="menu__item-reason">{entry.disabledReason}</span>
              ) : null}
            </span>
            {entry.shortcut !== undefined ? (
              <kbd className="menu__item-shortcut">{entry.shortcut}</kbd>
            ) : null}
          </Ark.Item>
        );
      })}
    </>
  );
}

/** Ruft die Aktion auf, deren Kennung das Menü gemeldet hat. */
function useSelectHandler(
  entries: readonly MenuEntry[],
): (details: { readonly value: string }) => void {
  const actions = useMemo(() => {
    const map = new Map<string, () => void>();
    for (const entry of entries) {
      if (isAction(entry) && entry.disabled !== true) map.set(entry.id, entry.onSelect);
    }
    return map;
  }, [entries]);

  return useCallback((details: { readonly value: string }) => {
    actions.get(details.value)?.();
  }, [actions]);
}

/* ==================================================================== */
/* Auswahlliste an einem Ausloeser                                      */
/* ==================================================================== */

export interface MenuProps {
  /** Inhalt des Ausloesers. */
  readonly trigger: ReactNode;
  readonly entries: readonly MenuEntry[];
  /** Zugaenglicher Name des Ausloesers, wenn er nur ein Symbol zeigt. */
  readonly triggerLabel?: string;
  readonly align?: "start" | "end";
  readonly triggerClassName?: string;
  readonly disabled?: boolean;
}

export function Menu({
  trigger,
  entries,
  triggerLabel,
  align = "start",
  triggerClassName,
  disabled = false,
}: MenuProps) {
  const onSelect = useSelectHandler(entries);

  return (
    <Ark.Root
      onSelect={onSelect}
      positioning={{
        placement: align === "end" ? "bottom-end" : "bottom-start",
        gutter: 4,
      }}
    >
      <Ark.Trigger
        className={cx("menu__trigger", triggerClassName)}
        disabled={disabled}
        {...(triggerLabel === undefined ? {} : { "aria-label": triggerLabel })}
      >
        {trigger}
      </Ark.Trigger>
      <Portal>
        <Ark.Positioner className="popover-layer">
          <Ark.Content className="menu" onKeyDown={stopClosingKeys}>
            <MenuItems entries={entries} />
          </Ark.Content>
        </Ark.Positioner>
      </Portal>
    </Ark.Root>
  );
}

/* ==================================================================== */
/* Kontextmenue an der Zeigerposition                                   */
/* ==================================================================== */

export interface ContextMenuState {
  readonly x: number;
  readonly y: number;
  readonly entries: readonly MenuEntry[];
  readonly label: string;
}

export interface ContextMenuProps {
  readonly state: ContextMenuState | null;
  readonly onClose: () => void;
}

/**
 * Kontextmenü an einem gemeldeten Punkt.
 *
 * Der Punkt kommt vom Aufrufer und nicht von einem eigenen Auslöser: Eine
 * Tabellenzeile ist der Auslöser, und sie meldet je nach Weg die Zeigerstelle
 * (rechter Mausklick) oder ihre eigene linke untere Ecke (Kontextmenü-Taste,
 * Umschalt+F10). Wie der Punkt hineinkommt, steht bei `reposition` weiter
 * unten — es ist nicht der Weg, den der Name `anchorPoint` nahelegt.
 */
export function ContextMenu({ state, onClose }: ContextMenuProps) {
  const entries = state?.entries ?? [];
  const onSelect = useSelectHandler(entries);

  const menu = useMenu({
    open: state !== null,
    onOpenChange: (details) => {
      if (!details.open) onClose();
    },
    onSelect,
    "aria-label": state?.label ?? "Kontextmenü",
    positioning: { placement: "bottom-start", gutter: 0 },
  });

  const { api } = menu;
  const x = state?.x ?? 0;
  const y = state?.y ?? 0;

  /*
   * Der Punkt geht über `reposition` hinein und nicht als Eigenschaft.
   *
   * `anchorPoint` sieht wie eine Eigenschaft der Wurzel aus, ist aber keine,
   * die gelesen wird: Die Zustandsmaschine füllt sie ausschließlich aus dem
   * Ereignis ihres eigenen Kontextmenü-Auslösers. Ohne Auslöser — und den gibt
   * es hier nicht, die Tabellenzeile ist einer — bliebe sie leer, die
   * Ausrichtung liefe gegen ein nicht vorhandenes Element, und das Menü stünde
   * unverrückt in der linken oberen Ecke. Genau das war zu sehen.
   *
   * `reposition` nimmt dieselben Angaben entgegen und hat Vorrang vor dem, was
   * die Maschine selbst gesetzt hätte. Eine Fläche ohne Ausdehnung an der
   * gemeldeten Stelle ist der Anker — dieselbe Rechnung, die ein
   * Kontextmenü-Auslöser aufmachen würde.
   */
  useEffect(() => {
    if (state === null) return;
    api.reposition({ getAnchorRect: () => ({ x, y, width: 0, height: 0 }) });
  }, [api, state, x, y]);

  return (
    <Ark.RootProvider value={menu}>
      <Portal>
        <Ark.Positioner className="popover-layer">
          <Ark.Content className="menu menu--context" onKeyDown={stopClosingKeys}>
            <MenuItems entries={entries} />
          </Ark.Content>
        </Ark.Positioner>
      </Portal>
    </Ark.RootProvider>
  );
}
