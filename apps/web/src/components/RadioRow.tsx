import { useId } from "react";
import { cx } from "../lib/cx";

/**
 * Takt — eine Auswahl aus wenigen Werten, nebeneinander (T-079, E-055).
 *
 * ## Warum keine Auswahlliste
 *
 * Das Vorbild des Auftraggebers — die Board-Konfiguration von Super
 * Productivity — setzt für dreiwertige Achsen Optionsknöpfe in einer Zeile:
 *
 * ```
 * Aufgabenstatus erledigt   ( ) Alle  ( ) Erledigt  (•) Unerledigt
 * ```
 *
 * Das ist hier die richtige Bauform und nicht bloß eine Nachahmung. Ein
 * aufklappbares Feld verbirgt die Alternativen, bis jemand es öffnet; eine
 * Achse mit drei Werten, deren mittlerer die Vorgabe ist, wird dadurch zu einer
 * Frage, die man erst stellen muss. Hier stehen alle drei Werte da, und der
 * gewählte ist ohne einen Klick erkennbar.
 *
 * Ab etwa fünf Werten kippt das Verhältnis; dann ist {@link Select} richtig.
 *
 * ## Der Neutralwert steht dabei, nicht daneben
 *
 * „Alle" ist die häufigste Fehllesart eines solchen Formulars: Es heißt
 * **nicht** „trifft alles", sondern „diese Achse schränkt nicht ein". Eine
 * Option darf deshalb `neutral` tragen; dann steht der Zusatz unmittelbar an
 * ihrer Beschriftung — dauerhaft, nicht erst nach der Wahl.
 *
 * ## Zustände (Abschnitt 15)
 *
 * Ruhe, Zeiger darüber, Fokus, gewählt, gesperrt. Der gewählte Zustand hängt an
 * drei Merkmalen und keines davon ist allein die Farbe: gefüllter Optionsknopf,
 * kräftigere Kontur, fettere Schrift (SC 1.4.1).
 *
 * ## Tastatur
 *
 * Native `<input type="radio">` in einem `<fieldset>`: Pfeiltasten wechseln,
 * der Tabulator springt in die Gruppe und aus ihr heraus, die Beschriftung ist
 * anklickbar. Nichts davon ist hier nachgebaut — nachgebaute Optionsknöpfe sind
 * die zuverlässigste Art, eine Tastaturbedienung zu verlieren.
 */

export interface RadioRowOption<TValue extends string> {
  readonly value: TValue;
  readonly label: string;
  /**
   * Ein Satz, der sagt, wozu diese Wahl führt. Für Hilfsmittel hängt er als
   * Beschreibung am Optionsknopf; sichtbar steht der Satz der **gewählten**
   * Option unter der Zeile.
   */
  readonly hint?: string;
  /** Dieser Wert schränkt nicht ein. Der Zusatz steht dann an der Beschriftung. */
  readonly neutral?: boolean;
}

export interface RadioRowProps<TValue extends string> {
  readonly label: string;
  readonly value: TValue;
  readonly onChange: (next: TValue) => void;
  readonly options: readonly RadioRowOption<TValue>[];
  /** Zusatz an einer neutralen Option, etwa „schränkt nicht ein". */
  readonly neutralNote?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function RadioRow<TValue extends string>({
  label,
  value,
  onChange,
  options,
  neutralNote,
  disabled = false,
  className,
}: RadioRowProps<TValue>) {
  const id = useId();
  const selected = options.find((option) => option.value === value);

  return (
    <fieldset className={cx("radio-row", className)} disabled={disabled}>
      <legend className="field__label">{label}</legend>
      <div className="radio-row__options">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cx("radio-row__option", checked && "radio-row__option--on")}
            >
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                {...(option.hint === undefined ? {} : { "aria-describedby": `${optionId}-hint` })}
              />
              <span className="radio-row__label">{option.label}</span>
              {option.neutral === true && neutralNote !== undefined ? (
                <span className="radio-row__neutral">{neutralNote}</span>
              ) : null}
              {option.hint === undefined ? null : (
                /*
                 * Der Satz haengt hier als Beschreibung **jedes** Knopfes, auch
                 * des ungewaehlten: Wer mit den Pfeiltasten durch die Gruppe
                 * geht, soll hoeren, wozu die naechste Wahl fuehrt, statt sie
                 * erst treffen zu muessen.
                 */
                <span className="visually-hidden" id={`${optionId}-hint`}>
                  {option.hint}
                </span>
              )}
            </label>
          );
        })}
      </div>
      {selected?.hint === undefined ? null : (
        /*
         * Sichtbar, aber fuer Hilfsmittel ausgeblendet: Derselbe Satz steht
         * schon als `aria-describedby` am gewaehlten Knopf. Zweimal vorgelesen
         * klaenge er wie zwei Aussagen.
         */
        <p className="field__hint" aria-hidden>
          {selected.hint}
        </p>
      )}
    </fieldset>
  );
}
