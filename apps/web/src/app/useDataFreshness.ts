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
 * `bump()` allein erneuert die Ansichten (jede führt `version` in der
 * **Auffrischliste** ihres `useAsync`), aber nicht die Struktur — und eine
 * Kanban-Spalte ist seit E-054 eine **Regel** aus eben dieser Struktur. Ein
 * Board, dessen Karten frisch sind und dessen Spalten von gestern stammen,
 * wäre die halbe Reparatur.
 *
 * **Und es blinkt tatsächlich nichts** (Befund 7 aus R-1a, behoben in T-102).
 * Dieser Satz stand hier schon vorher, und er stimmte zur Hälfte: `reload()`
 * behält den vorhandenen Inhalt stehen, `bump()` bis T-102 nicht. `version`
 * lag in der gewöhnlichen Abhängigkeitsliste von `useAsync`, und der Weg
 * dorthin verwirft den Wert. Jedes Zurückwechseln ins Takt-Fenster warf damit
 * die gerade angesehene Liste auf ihre Platzhalterflächen zurück. Seit T-102
 * hat `useAsync` eine zweite Liste für genau diesen Fall: derselbe Inhalt
 * bleibt stehen, `refreshing` wird wahr, und die Ansicht zeigt „Wird
 * aktualisiert …".
 *
 * ---------------------------------------------------------------------------
 * Ein Mindestabstand, und warum er eine Sekunde ist (H-6 aus R-3a)
 * ---------------------------------------------------------------------------
 *
 * Jeder Fensterwechsel löst `reload()` **und** `bump()` aus, also einen Schwung
 * Anfragen gegen einen einfädigen Sidecar. Zwanzig Wechsel in zwanzig Sekunden
 * sind zwanzig Schwünge. Eine Schleife ist das nicht — dahinter steht immer
 * eine Handlung eines Menschen und keine Uhr —, aber ein Alt-Tab hin und
 * zurück ist zwei Handlungen in weniger als einer Sekunde, und die zweite kann
 * nichts Neues zutage fördern.
 *
 * Der Abstand gilt deshalb genau dort, wo er hingehört: am **Fensterwechsel**.
 * Er ist eine Sekunde, und die Zahl ist keine Vorsicht, sondern eine Aussage:
 * Wer in derselben Sekunde zweimal ins Fenster kommt, hat dazwischen nichts
 * gebucht — weder im Aufgabenbereich des Add-ins noch in einem zweiten
 * Fenster. Länger wäre falsch: Wer aus Outlook zurückkommt, ist nach zwei
 * Sekunden zurück, und eine Anwendung, die dann den Stand von vorhin zeigt,
 * hat genau das Loch wieder, das T-097 geschlossen hat.
 *
 * Ausdrücklich **nicht** gebremst wird das erneute Ansteuern (`revisit`): Das
 * ist ein Klick auf einen Navigationseintrag, also die ausdrückliche Bitte
 * „zeig mir das noch einmal". Eine Bitte, die zweimal gestellt und einmal
 * beantwortet wird, ist eine Anwendung, die nicht reagiert.
 */

/** Kleinster Abstand zwischen zwei Auffrischungen durch einen Fensterwechsel. */
const VISIBILITY_MIN_GAP_MS = 1_000;
export function useDataFreshness(revisit: number): void {
  const { bump } = useRefresh();
  const { reload } = useStructure();

  /*
    Beide Funktionen sind über ihre Lebenszeit dieselben (`useCallback` ohne
    Abhängigkeiten in `RefreshContext` bzw. in `useAsync`). Deshalb ist auch
    diese hier dieselbe, und die Effekte darunter hängen ihre Zuhörer genau
    einmal ein statt bei jedem Zeichnen neu.
  */
  const lastRefreshAt = useRef(0);

  const refreshAll = useCallback(() => {
    lastRefreshAt.current = Date.now();
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
      // Der Abstand aus H-6. Gemessen wird gegen **jede** Auffrischung dieses
      // Hakens, nicht nur gegen die letzte durch einen Fensterwechsel: Wer
      // eben erst neu geladen hat, braucht es beim Zurückkommen nicht noch
      // einmal.
      if (Date.now() - lastRefreshAt.current < VISIBILITY_MIN_GAP_MS) return;
      refreshAll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshAll]);
}
