import { cx } from "../lib/cx";
import { DONE_FLAG_LABEL, type DoneFlagState } from "../lib/labels";
import { Icon } from "./Icon";

/**
 * Takt — das Erledigt-Kennzeichen an einer Zeile (A-2.5, I-05, E-023).
 *
 * ## Warum es diesen Baustein gibt
 *
 * Der dritte Anzeigezustand „Erledigt aufgehoben" stand bis T-045 dreimal
 * getippt im Baum — auf der Kanban-Karte, im Dashboard und in der
 * Zeiterfassung — und in der Todo-Liste (S-02) und der Detailansicht (S-03)
 * gar nicht. Das sind ausgerechnet die beiden Ansichten, in denen nach E-027
 * und A-6.1 am haeufigsten ein Timer gestartet wird: Man startet ihn dort und
 * sieht das Ergebnis woanders (Befund C-23).
 *
 * Ein Baustein, eine Beschriftungstabelle (`DONE_FLAG_LABEL`), fuenf
 * Ansichten. Die Kanban-Karte behaelt ihre eigene Huelle, weil eine Karte
 * andere Masse hat als eine Zeile — die **Woerter** kommen auch dort aus
 * `lib/labels.ts`.
 *
 * ## Warum „offen" schweigt
 *
 * In einer Liste ist „offen" der Normalfall und braucht kein Etikett; ein
 * Etikett an jeder Zeile waere Rauschen und machte die beiden Ausnahmen
 * unauffaelliger. Auf der Kanban-Karte ist es umgekehrt — dort steht das
 * Kennzeichen auch als „Offen", weil man es sonst aus dem Spaltennamen raten
 * muesste, und genau dieses Raten soll die Trennung von Kennzeichen und
 * Spalte verhindern (E-023). Das ist der Grund, aus dem die Karte ihre eigene
 * Huelle behaelt: Sie hat eine andere Regel, nicht nur andere Masse.
 *
 * ## Farbe
 *
 * „Erledigt aufgehoben" traegt Symbol und gestrichelten Rand statt einer
 * eigenen Statusfarbe. Bernstein, Gruen und Rose sind an den Exportstatus
 * vergeben, Violett an den laufenden Timer; ein fuenfter Farbcode kaeme sich
 * in derselben Zeile mit ihnen ins Gehege.
 */
export interface DoneFlagProps {
  readonly state: DoneFlagState;
  readonly className?: string;
}

const FLAG_ICON = {
  done: "check",
  reopened: "rotate-ccw",
} as const;

export function DoneFlag({ state, className }: DoneFlagProps) {
  if (state === "open") return null;
  return (
    <span className={cx("doneflag", `doneflag--${state}`, className)}>
      <Icon name={FLAG_ICON[state]} size={12} />
      {DONE_FLAG_LABEL[state]}
    </span>
  );
}
