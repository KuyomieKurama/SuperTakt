import { useId, useMemo, type KeyboardEvent } from "react";
import { Portal } from "@ark-ui/react/portal";
import { Select as Ark, createListCollection } from "@ark-ui/react/select";
import { cx } from "../lib/cx";
import { Icon } from "./Icon";
import type { ControlSize } from "./Primitives";

/**
 * Takt — Auswahlfeld (E-052, T-059).
 *
 * ## Warum das native `<select>` gehen musste
 *
 * Bis T-057 stand hier ein `<select>`. Das war die richtige Wahl, solange es
 * nur um Tastatur und Vorlesehilfe ging — beides bringt der Browser mit. Was
 * er **nicht** mitbringt, ist eine gestaltbare aufgeklappte Liste: Die zeichnet
 * das Betriebssystem, in seiner Schrift, in seinen Farben, in seinen
 * Zeilenhöhen. Auf dem Bildschirmfoto des Auftraggebers stand deshalb mitten
 * in einer sorgfältig gesetzten Oberfläche eine Liste in Systemschrift.
 *
 * Die Antwort ist **nicht** eine gestylte Komponentenbibliothek — das
 * Designsystem ist abgenommen (E-024) und 358 Farbpaare sind gemessen. Die
 * Antwort ist eine **ungestylte** Verhaltensprimitive: Ark UI liefert die
 * Zustandsmaschine, die Fokusführung, die Tastaturbedienung, das Anschreiben
 * (Typeahead) und die ARIA-Verkabelung; das Aussehen kommt weiterhin Zeile für
 * Zeile aus den Token dieses Projekts.
 *
 * ## Was sich für Aufrufer geändert hat
 *
 * Die Optionen kommen jetzt als **Daten** und nicht mehr als `<option>`-Kinder.
 * Das ist keine Geschmacksfrage: Die Liste wird in ein Portal am
 * Dokumentkörper gezeichnet, und ein `<option>` hat dort keine Bedeutung mehr.
 * Gruppen bleiben möglich (`kind: "group"`) und ersetzen `<optgroup>`.
 *
 * `SelectField` und `Select` sind zu **einem** Baustein zusammengefallen. Es
 * gab keinen Unterschied zwischen beiden außer der Beschriftung, und eine
 * Beschriftung ist bei einem Auswahlfeld keine Zutat, sondern Pflicht: Ohne
 * sie hat der Auslöser keinen zugänglichen Namen (SC 4.1.2). Wo kein
 * sichtbares Etikett hingehört, gibt es `hideLabel`.
 *
 * ## Zustände (Abschnitt 15)
 *
 * Ruhe, Zeiger darüber, Fokus, aufgeklappt, gewählt, gesperrt, fehlerhaft und
 * leer — jeder davon hat hier eine Entsprechung, keiner hängt allein an der
 * Farbe. Der aufgeklappte Zustand trägt zusätzlich `data-state="open"`, der
 * gewählte Eintrag zusätzlich einen Haken.
 */

export interface SelectOption<TValue extends string = string> {
  readonly kind?: "option";
  readonly value: TValue;
  readonly label: string;
  /** Zweite Zeile im aufgeklappten Eintrag. Erklärt, wozu die Wahl führt. */
  readonly hint?: string;
  readonly disabled?: boolean;
}

export interface SelectOptionGroup<TValue extends string = string> {
  readonly kind: "group";
  readonly label: string;
  readonly options: readonly SelectOption<TValue>[];
}

/** Ein Eintrag der Liste: eine Option oder eine benannte Gruppe davon. */
export type SelectEntry<TValue extends string = string> =
  | SelectOption<TValue>
  | SelectOptionGroup<TValue>;

function isGroup<TValue extends string>(
  entry: SelectEntry<TValue>,
): entry is SelectOptionGroup<TValue> {
  return entry.kind === "group";
}

export interface SelectProps<TValue extends string = string> {
  readonly label: string;
  readonly value: TValue;
  readonly onChange: (next: TValue) => void;
  readonly options: readonly SelectEntry<TValue>[];
  /** Versteckt die Beschriftung optisch. Für Hilfsmittel bleibt sie stehen. */
  readonly hideLabel?: boolean;
  readonly size?: ControlSize;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  /** Ein Satz unter dem Feld. Bleibt stehen, anders als ein Platzhalter. */
  readonly hint?: string;
  /** Text, solange nichts gewählt ist. */
  readonly placeholder?: string;
  readonly name?: string;
  readonly className?: string;
}

/**
 * Escape und Tabulator gehören der geöffneten Liste, nicht dem Dialog dahinter.
 *
 * Die Liste hängt im Portal am Dokumentkörper, aber im React-Baum steht sie
 * weiterhin unter dem Feld — und damit unter dem Dialog. Ohne diese Bremse
 * schlösse ein Escape in der offenen Liste **beides**: Zag hat die Taste da
 * schon in der Erfassungsphase behandelt, und der Dialog bekäme sie danach
 * ein zweites Mal.
 */
function stopClosingKeys(event: KeyboardEvent<HTMLElement>): void {
  if (event.key === "Escape" || event.key === "Tab") event.stopPropagation();
}

export function Select<TValue extends string = string>({
  label,
  value,
  onChange,
  options,
  hideLabel = false,
  size = "md",
  disabled = false,
  invalid = false,
  hint,
  placeholder = "Bitte wählen",
  name,
  className,
}: SelectProps<TValue>) {
  const id = useId();
  const hintId = `${id}-hint`;

  // Die flache Liste ist die Wahrheit für Tastatur, Anschreiben und die
  // Auflösung Wert → Beschriftung. Die Gruppen sind nur Darstellung.
  const { collection, entries } = useMemo(() => {
    const flat: SelectOption<TValue>[] = [];
    for (const entry of options) {
      if (isGroup(entry)) flat.push(...entry.options);
      else flat.push(entry);
    }
    return {
      entries: options,
      collection: createListCollection<SelectOption<TValue>>({
        items: flat,
        itemToValue: (item) => item.value,
        itemToString: (item) => item.label,
        isItemDisabled: (item) => item.disabled === true,
      }),
    };
  }, [options]);

  const iconSize = size === "sm" ? 12 : 14;

  const renderOption = (option: SelectOption<TValue>) => (
    <Ark.Item key={option.value} item={option} className="select__option">
      <span className="select__option-text">
        <Ark.ItemText className="select__option-label">{option.label}</Ark.ItemText>
        {option.hint === undefined ? null : (
          <span className="select__option-hint">{option.hint}</span>
        )}
      </span>
      <Ark.ItemIndicator className="select__option-check">
        <Icon name="check" size={14} />
      </Ark.ItemIndicator>
    </Ark.Item>
  );

  return (
    <Ark.Root
      collection={collection}
      value={[value]}
      onValueChange={(details) => {
        const next = details.value[0];
        // Die Zusicherung steht genau einmal und ist gedeckt: Jeder Wert der
        // Sammlung stammt aus `options` und trägt dort bereits `TValue`.
        if (next !== undefined) onChange(next as TValue);
      }}
      disabled={disabled}
      invalid={invalid}
      positioning={{ sameWidth: true, gutter: 4, placement: "bottom-start" }}
      className={cx("field", className)}
      {...(name === undefined ? {} : { name })}
    >
      <Ark.Label className={cx("field__label", hideLabel && "visually-hidden")}>
        {label}
      </Ark.Label>

      <Ark.Control className={cx("select", `select--${size}`)}>
        {/*
          Keine eigene `id` auf dem Ausloeser (T-059).

          Die Zustandsmaschine sucht ihn ueber **ihre** Kennung, um die Liste
          daran auszurichten. Wird sie ueberschrieben, findet sie nichts, und
          die Liste bleibt an der Stelle stehen, an der sie startet: oben links
          ausserhalb des Sichtfelds. Der zugaengliche Name kommt ohnehin von
          `Ark.Label`, nicht von einem `htmlFor` von aussen.
        */}
        <Ark.Trigger
          className={cx("select__trigger", invalid && "select__trigger--invalid")}
          {...(hint === undefined ? {} : { "aria-describedby": hintId })}
        >
          <Ark.ValueText className="select__value" placeholder={placeholder} />
          <span className="select__chevron" aria-hidden>
            <Icon name="chevron-down" size={iconSize} />
          </span>
        </Ark.Trigger>
      </Ark.Control>

      <Portal>
        <Ark.Positioner className="popover-layer">
          <Ark.Content className="select__content" onKeyDown={stopClosingKeys}>
            {entries.length === 0 ? (
              <p className="select__empty">Nichts zur Auswahl.</p>
            ) : (
              entries.map((entry, index) =>
                isGroup(entry) ? (
                  <Ark.ItemGroup key={`${entry.label}-${String(index)}`} className="select__group">
                    <Ark.ItemGroupLabel className="select__group-label">
                      {entry.label}
                    </Ark.ItemGroupLabel>
                    {entry.options.map(renderOption)}
                  </Ark.ItemGroup>
                ) : (
                  renderOption(entry)
                ),
              )
            )}
          </Ark.Content>
        </Ark.Positioner>
      </Portal>

      {hint === undefined ? null : (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
    </Ark.Root>
  );
}
