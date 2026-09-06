import { createContext, useContext } from "react";

/**
 * Eine Absage wird einmal angesagt, nicht zweimal.
 *
 * Seit T-162 steht die Meldeflaeche eines Feldes **dauerhaft** im Baum und
 * traegt `role="alert"`: Bekommt sie Inhalt, ist das eine Aenderung an einer
 * bekannten Region, und die Vorlesehilfe sagt sie an. Das ist der Weg fuer den
 * gewoehnlichen Fall — der Benutzer verlaesst ein Feld, die Meldung erscheint,
 * sein Fokus steht laengst woanders.
 *
 * Seit T-202 gibt es einen zweiten Weg. Schlaegt ein Absendeversuch fehl, holt
 * {@link FormDialog} das **erste** ungueltige Feld in den Fokus. Dabei liest
 * eine Vorlesehilfe Beschriftung, `aria-invalid` und die Beschreibung aus
 * `aria-describedby` — und die Beschreibung ist genau der Satz, der zugleich in
 * der Meldeflaeche steht. Ohne Vorkehrung faellt derselbe Satz zweimal: einmal
 * als Ansage der Region, einmal als Beschreibung des Feldes.
 *
 * Deshalb dieser Schalter. Waehrend eines Absendeversuchs traegt jede
 * Meldeflaeche **innerhalb desselben Formulars** `aria-live="off"`; die Rolle
 * bleibt unangetastet, weil eine Rolle, die kommt und geht, genau der Fehler
 * waere, den T-162 behoben hat. Der Satz kommt in diesem Augenblick vom Fokus,
 * und nur von ihm.
 *
 * **Die Grenze der Aussage (T-B09):** In dieser Umgebung laeuft kein
 * Vorleseprogramm. Gemessen ist, was im Baum steht — die Rolle, das Attribut,
 * die Beschreibung am fokussierten Feld. Was ein Hoerender hoert, ist daraus
 * abgeleitet.
 */
export const FieldMessageQuietContext = createContext(false);

/**
 * Der Wert fuer `aria-live` an der Meldeflaeche eines Feldes.
 *
 * `undefined` heisst: die Rolle `alert` gilt unveraendert. `"off"` schaltet sie
 * fuer die Dauer eines Absendeversuchs stumm — nicht laenger, denn der Schalter
 * faellt zurueck, sobald der Benutzer wieder tippt.
 */
export function useFieldMessageLive(): "off" | undefined {
  return useContext(FieldMessageQuietContext) ? "off" : undefined;
}
