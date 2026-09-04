import { useCallback, useEffect, useRef } from "react";
import { useRefresh } from "./RefreshContext";
import { useStructure } from "./StructureContext";

/**
 * Takt — wann die Oberfläche ihre Daten noch einmal holt (T-097, Fund 1 aus
 * T-096).
 *
 * ---------------------------------------------------------------------------
 * Das Loch, das hier geschlossen wird
 * ---------------------------------------------------------------------------
 *
 * Takt lädt Daten, wenn eine Ansicht entsteht, und danach, wenn **die
 * Oberfläche selbst** etwas geschrieben hat (`RefreshContext.bump`). Beides
 * setzt voraus, daß jede Änderung durch dieses Fenster geht. Das ist nicht der
 * Fall:
 *
 *  - Der Aufgabenbereich des Add-ins bucht über dieselbe lokale API auf
 *    dasselbe Todo (A-11.*).
 *  - Der Dienst ist ein Dienst; ein zweites Fenster derselben Anwendung sieht
 *    denselben Bestand.
 *  - Ein Timer kann anderswo entstehen oder enden.
 *
 * In allen drei Fällen zeigte die Ansicht bis T-097 den Stand von vorhin, bis
 * jemand neu lud oder eine **andere** Route wählte. Die Struktur — Status,
 * Tags, Ordner, Regeln, Einstellungen — war noch dauerhafter: Sie wird seit je
 * genau einmal geladen (`StructureProvider`, Abhängigkeiten `[]`) und nur auf
 * ausdrückliches `reload()` hin erneuert.
 *
 * ---------------------------------------------------------------------------
 * Zwei Anlässe, und keiner davon ist eine Uhr
 * ---------------------------------------------------------------------------
 *
 * 1. **Dieselbe Adresse noch einmal angesteuert** (`revisit` aus `useRoute`).
 *    Das ist der Klick auf den Navigationseintrag, auf dem man schon steht,
 *    und es ist das zweite `page.goto()` desselben Ankers, an dem T-096
 *    hängengeblieben ist. Die Erwartung dahinter ist alltäglich: „Ich sehe
 *    diese Liste noch einmal an" heißt „zeig sie mir, wie sie jetzt ist".
 *
 * 2. **Das Fenster wird wieder sichtbar** (`visibilitychange`). Genau dann
 *    kommt jemand aus Outlook zurück, wo er soeben über den Aufgabenbereich
 *    gebucht hat. Ohne dieses Signal bliebe der Fall aus dem Add-in
 *    unbeantwortet, denn dabei wird gar nicht navigiert.
 *
 * Ausdrücklich **nicht**: ein Zeitgeber, der im Hintergrund nachfragt. Ein
 * Nachladen, das niemand ausgelöst hat, verschiebt Listen unter der Hand — und
 * die Anwendung liest sich an einem Ort, an dem der Benutzer gerade arbeitet.
 * Ebenfalls nicht: `focus`. Es feuert bei jedem Zurückspringen ins Fenster,
 * auch aus einem Dialog derselben Anwendung heraus, und wäre damit näher an
 * „jede Tastenbewegung" als an „ich war weg".
 *
 * ---------------------------------------------------------------------------
 * Warum beide Quellen erneuert werden
 * ---------------------------------------------------------------------------
 *
 * `bump()` allein erneuert die Ansichten (jede hängt `version` in die
 * Abhängigkeiten ihres `useAsync`), aber nicht die Struktur — und eine
 * Kanban-Spalte ist seit E-054 eine **Regel** aus eben dieser Struktur. Ein
 * Board, dessen Karten frisch sind und dessen Spalten von gestern stammen,
 * wäre die halbe Reparatur. `reload()` behält dabei den vorhandenen Inhalt
 * stehen (`useAsync`, `refreshing`); es blinkt nichts.
 */
export function useDataFreshness(revisit: number): void {
  const { bump } = useRefresh();
  const { reload } = useStructure();

  /*
    Beide Funktionen sind über ihre Lebenszeit dieselben (`useCallback` ohne
    Abhängigkeiten in `RefreshContext` bzw. in `useAsync`). Deshalb ist auch
    diese hier dieselbe, und die Effekte darunter hängen ihre Zuhörer genau
    einmal ein statt bei jedem Zeichnen neu.
  */
  const refreshAll = useCallback(() => {
    reload();
    bump();
  }, [bump, reload]);

  /*
    Der erste Durchlauf lädt **nicht** nach: Die Ansicht ist eben erst
    entstanden und hat ihre Daten gerade geholt. Gemerkt wird deshalb der
    Anfangswert, nicht 0 — sonst führte schon der Aufbau eine zweite Runde
    Anfragen aus.
  */
  const seen = useRef(revisit);

  useEffect(() => {
    if (seen.current === revisit) return;
    seen.current = revisit;
    refreshAll();
  }, [refreshAll, revisit]);

  useEffect(() => {
    const onVisibilityChange = (): void => {
      if (document.visibilityState !== "visible") return;
      refreshAll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshAll]);
}
