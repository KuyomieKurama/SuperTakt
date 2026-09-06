import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Menu as Ark, useMenu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { cx } from "../lib/cx";
import { Icon, type IconName } from "./Icon";
import { foreignText } from "../lib/foreign";
import { Foreign } from "./Foreign";

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
            valueText={foreignText(entry.label)}
            className={cx("menu__item", entry.tone === "danger" && "menu__item--danger")}
            {...(disabled && entry.disabledReason !== undefined
              ? { title: entry.disabledReason }
              : {})}
          >
            <span className="menu__item-icon">
              {entry.icon !== undefined ? <Icon name={entry.icon} size={15} /> : null}
            </span>
            <span className="menu__item-label">
              {/*
                Die Beschriftung eines Eintrags ist meist unsere eigene
                („Bearbeiten"), manchmal aber ein Name aus dem Bestand
                („Status: Ost"). `Foreign` laesst unseren Text unveraendert und
                faengt den fremden — deshalb steht es hier am Baustein und
                nicht an jeder zweiten Aufrufstelle (E-063, T-124).
              */}
              <Foreign value={entry.label} />
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

/**
 * Ruft die Aktion auf, deren Kennung das Menü gemeldet hat.
 *
 * `beforeAction` bekommt der Auslöser-Fall mit; siehe {@link Menu}. Das
 * Kontextmenü hat keinen Auslöser und reicht deshalb nichts herein.
 */
function useSelectHandler(
  entries: readonly MenuEntry[],
  beforeAction?: () => void,
): (details: { readonly value: string }) => void {
  const actions = useMemo(() => {
    const map = new Map<string, () => void>();
    for (const entry of entries) {
      if (isAction(entry) && entry.disabled !== true) map.set(entry.id, entry.onSelect);
    }
    return map;
  }, [entries]);

  return useCallback((details: { readonly value: string }) => {
    const action = actions.get(details.value);
    if (action === undefined) return;
    beforeAction?.();
    action();
  }, [actions, beforeAction]);
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
  const triggerRef = useRef<HTMLButtonElement>(null);

  /**
   * Der Auslöser bekommt den Fokus, **bevor** die Aktion läuft (T-153 O-CY,
   * berichtigt in T-162 O-CY-2).
   *
   * **Der gemessene Fall.** „Bearbeiten" im Zeilenmenü der Todo-Liste öffnet
   * einen Dialog. Schließt man ihn mit Escape, fiel der Fokus auf `<body>`
   * statt zurück auf den Menü-Auslöser. Über den Knopf „Neues Todo" auf dem
   * Dashboard stimmte es — der Unterschied ist nicht der Dialog, sondern der
   * Weg dorthin.
   *
   * **Warum.** Die Fokusfalle des Dialogs merkt sich beim Scharfstellen, was
   * gerade den Fokus trägt, und gibt ihn beim Schließen dorthin zurück
   * (`nodeFocusedBeforeActivation` in `@zag-js/focus-trap`). Auf dem Weg über
   * ein Menü ist das der Menükasten im Portal: Er verschwindet mit dem Menü,
   * und ein Fokus auf einen verschwundenen Knoten ist gar keiner.
   *
   * **Was diese Zeile leistet — und was nicht.** Sie macht den Auslöser zu
   * dem, was im Augenblick des Öffnens tatsächlich den Fokus trägt; genau
   * daran hält sich `DialogSurface` fest (`finalFocusEl`, siehe dort). Sie
   * allein trägt aber **nicht**: T-157 hat sie eingebaut und als Behebung
   * gemeldet, T-161 hat sie im Browser widerlegt. Der Grund steht im Quelltext
   * von `@zag-js/menu`: Jede Pfeiltaste und jede Zeigerbewegung im Menü merkt
   * einen `requestAnimationFrame` vor (`focusMenu`), und der zieht den Fokus
   * auf den Menükasten zurück, sobald er außerhalb steht
   * (`enabled: !contains(contentEl, activeElement)`). Liegen Pfeiltaste und
   * Eingabe im selben Bild — bei der Tastatur der Regelfall —, überholt dieses
   * Bild die Behebung. Gemessen: `focusout .menu → .menu__trigger`, 32 ms
   * später `focusout .menu__trigger → .menu`, dann `→ null`.
   *
   * Deshalb liegt die Rückgabe nicht mehr hier, sondern beim Dialog, der sich
   * seinen Auslöser festhält, statt den Stand von später zu lesen.
   *
   * Ein Verlassen der Fokusfalle des Menüs ist das nicht — die
   * Abweisungsebene von Ark UI führt den eigenen Auslöser ausdrücklich als
   * Ausnahme (`exclude: [getTriggerEl(scope), …]`).
   */
  const focusTriggerFirst = useCallback(() => {
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const onSelect = useSelectHandler(entries, focusTriggerFirst);

  /**
   * Fällt der Fokus beim Schließen des Menüs ins Nichts, holt der Auslöser ihn
   * zurück (T-162, Befund O-CY-3).
   *
   * **Der gemessene Fall.** „Status: In Progress" im Zeilenmenü — eine Aktion
   * **ohne** Dialog, die Zeile bleibt stehen. Der Auslöser hat danach kurz den
   * Fokus, verliert ihn aber an denselben vorgemerkten `focusMenu` wie oben,
   * und der Menükasten verschwindet gleich darauf: `document.activeElement`
   * ist 100 ms später `<body>`. Wer mit der Tastatur arbeitet, steht dann am
   * Dokumentanfang statt in seiner Zeile.
   *
   * Der Anlaß ist das Ereignis und kein Zeitgeber: `focusout` am Menükasten
   * mit `relatedTarget === null` heißt „der Fokus ging **nirgendwohin**".
   * Ging er an ein anderes Element — der nächste Tabulatorhalt, ein
   * angeklickter Knopf außerhalb, das erste Feld eines gerade geöffneten
   * Dialogs —, gehört er dorthin, und hier passiert nichts. Dieselbe Regel und
   * dieselbe Bauart wie die Rückholung in `DialogSurface`.
   *
   * Die Prüfung steht in einem `setTimeout`, weil `document.activeElement`
   * während `focusout` noch das alte Element ist. Zurückgeholt wird nur aus
   * `null` oder `<body>`, nur wenn das Fenster den Fokus überhaupt hat
   * (`document.hasFocus()`) und nur, wenn es den Auslöser noch gibt — nach
   * „Löschen" oder „Als erledigt markieren" ist seine Zeile fort, und ein
   * `focus()` auf einen ausgebauten Knoten wäre keiner.
   */
  const recoveryTimer = useRef<number | null>(null);

  const recoverTriggerFocus = useCallback(() => {
    if (recoveryTimer.current !== null) window.clearTimeout(recoveryTimer.current);
    recoveryTimer.current = window.setTimeout(() => {
      recoveryTimer.current = null;
      if (!document.hasFocus()) return;
      const active = document.activeElement;
      if (active !== null && active !== document.body) return;
      const element = triggerRef.current;
      if (element === null || !element.isConnected) return;
      element.focus({ preventScroll: true });
    }, 0);
  }, []);

  useEffect(
    () => () => {
      if (recoveryTimer.current !== null) window.clearTimeout(recoveryTimer.current);
    },
    [],
  );

  /**
   * Hängt den Zuhörer an den Menükasten — **nicht** über `onBlur`, und ohne
   * Abräumer. Beides ist gemessen und beides hat einen Grund.
   *
   * Das `focusout`, auf das es ankommt, entsteht dadurch, dass React den
   * Menükasten **ausbaut**. In diesem Augenblick hat React seine eigene
   * Zuordnung zwischen Knoten und Baustein bereits gelöst, und die
   * synthetische Fassung des Ereignisses kommt nicht mehr an. Gemessen: Ein
   * Zuhörer am Dokument sieht `focusout .menu → null`; mit `onBlur` am selben
   * Kasten bleibt die Rückholung aus und der Fokus liegt weiter auf `<body>`.
   *
   * Und ein Abräumer über den Rückgabewert (React 19) räumt zu früh ab: React
   * löst die Halter, **bevor** es den Knoten aus dem Baum nimmt. Mit Abräumer
   * ist der Zuhörer weg, wenn das Ereignis kommt — gemessen, der Fokus landet
   * wieder auf `<body>`. Ohne Abräumer ist nichts offen: Der Zuhörer hängt an
   * einem Knoten, den React wegwirft, und geht mit ihm.
   */
  const watchContentFocus = useCallback(
    (node: HTMLDivElement | null) => {
      if (node === null) return;
      node.addEventListener("focusout", (event: FocusEvent) => {
        if (event.relatedTarget === null) recoverTriggerFocus();
      });
    },
    [recoverTriggerFocus],
  );

  return (
    <Ark.Root
      onSelect={onSelect}
      positioning={{
        placement: align === "end" ? "bottom-end" : "bottom-start",
        gutter: 4,
      }}
    >
      <Ark.Trigger
        ref={triggerRef}
        className={cx("menu__trigger", triggerClassName)}
        disabled={disabled}
        {...(triggerLabel === undefined ? {} : { "aria-label": triggerLabel })}
      >
        {trigger}
      </Ark.Trigger>
      <Portal>
        <Ark.Positioner className="popover-layer">
          <Ark.Content
            className="menu"
            onKeyDown={stopClosingKeys}
            ref={watchContentFocus}
          >
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
