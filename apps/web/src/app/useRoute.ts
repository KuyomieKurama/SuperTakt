import { useEffect, useState } from "react";
import { parseRoute, type Route } from "./router";

/**
 * Die angezeigte Adresse — und wie oft sie **erneut** angesteuert wurde
 * (T-097, Fund 1 aus T-096).
 *
 * ---------------------------------------------------------------------------
 * Wogegen der zweite Wert steht
 * ---------------------------------------------------------------------------
 *
 * Wer `#/kanban` ansteuert, während `#/kanban` bereits offen ist, bekam bis
 * T-097 nichts: keine neue Anfrage, keine neuen Daten, den Stand von vorhin.
 * Der Fall ist nicht künstlich — er trifft jede Änderung, die **am Zustand der
 * Oberfläche vorbei** geschieht: eine Buchung aus dem Aufgabenbereich des
 * Add-ins, ein zweites Fenster, ein Timer, der anderswo gestoppt wurde. Der
 * End-zu-End-Test T-096 ist darüber gestolpert und hat sich mit
 * `page.reload()` beholfen.
 *
 * ---------------------------------------------------------------------------
 * Warum `hashchange` allein das nicht kann — gemessen, nicht vermutet
 * ---------------------------------------------------------------------------
 *
 * `hashchange` feuert **nur, wenn sich der Anker ändert**. Bei gleichem Anker
 * feuert es nie; das ist keine Eigenheit eines Browsers, sondern die Bedeutung
 * des Ereignisses. Ein „bump bei jedem `hashchange`" hätte den Fall also gar
 * nicht erreicht.
 *
 * Gemessen wurde stattdessen, was in Chromium (Playwright 1.62) tatsächlich
 * geschieht — mit einer Seite, die beide Ereignisse und die Zahl der
 * Dokumentladevorgänge mitschreibt:
 *
 * | Handlung | Ereignisse | Dokument neu geladen |
 * |---|---|---|
 * | `page.goto()` auf **denselben** Anker | `popstate` | nein |
 * | `page.goto()` auf einen **anderen** Anker | `popstate`, dann `hashchange` | nein |
 * | Klick auf einen Verweis zum **eigenen** Anker | `popstate` | nein |
 * | `location.assign` auf denselben Anker | `popstate` | nein |
 * | `location.hash = <derselbe Wert>` | **nichts** | nein |
 * | `page.reload()` | — | ja |
 *
 * Daraus folgt der Zuschnitt hier: **`hashchange` bringt die neue Adresse,
 * `popstate` bringt das erneute Ansteuern derselben.** Beide Ereignisse
 * kommen bei einem echten Wechsel — `popstate` zuerst —, deshalb tut der
 * `popstate`-Behandler in diesem Fall nichts und überläßt das Feld dem
 * `hashchange`-Behandler; sonst zählte jeder Wechsel doppelt.
 *
 * Der letzten Zeile der Tabelle wegen navigiert `router.navigate` seit T-097
 * über `location.assign` statt über `location.hash =`: Nur so löst auch eine
 * Navigation aus dem Programm auf die **eigene** Adresse noch etwas aus.
 *
 * ---------------------------------------------------------------------------
 * Was hier ausdrücklich nicht steht
 * ---------------------------------------------------------------------------
 *
 * Kein Zeitgeber und keine Abfrage im Sekundentakt. Die Zahl ändert sich
 * ausschließlich durch eine Navigation; wer nichts tut, löst nichts aus. Was
 * mit der Zahl geschieht, entscheidet `useDataFreshness` — diese Datei kennt
 * weder Daten noch Dienst.
 */
export interface RouteVisit {
  readonly route: Route;
  /**
   * Zählt jedes erneute Ansteuern der **bereits angezeigten** Adresse.
   *
   * Beginnt bei 0 und steigt um eins. Ein echter Adreßwechsel läßt sie
   * unberührt — dort wechselt `route`, und wer davon abhängt, merkt es daran.
   */
  readonly revisit: number;
}

/** Hält die aktuelle Route und hört auf Änderungen des Ankers. */
export function useRoute(): RouteVisit {
  const [visit, setVisit] = useState<RouteVisit>(() => ({
    route: parseRoute(window.location.hash),
    revisit: 0,
  }));

  useEffect(() => {
    /*
      Der Anker, der gerade angezeigt wird. Er steht in einer Variablen dieses
      Effekts und nicht im Zustand: Beide Behandler brauchen ihn **sofort**,
      und ein Zustandswert wäre zum Zeitpunkt des zweiten Ereignisses noch der
      alte — `popstate` und `hashchange` kommen im selben Zug.
    */
    let shown = window.location.hash;

    const onHashChange = (): void => {
      shown = window.location.hash;
      setVisit((previous) => ({ route: parseRoute(shown), revisit: previous.revisit }));
      // Beim Wechsel nach oben: Sonst steht der Benutzer in einer neuen
      // Ansicht mitten im Text, ohne dass er gescrollt hat.
      window.scrollTo({ top: 0 });
    };

    const onPopState = (): void => {
      // Anderer Anker: Das ist ein Wechsel, und `hashchange` folgt in
      // derselben Runde. Hier nichts tun — sonst zählte der Wechsel doppelt.
      if (window.location.hash !== shown) return;
      // Gleicher Anker: dieselbe Ansicht ein zweites Mal angesteuert. Die
      // Adresse bleibt, das Objekt `route` bleibt, allein die Zahl steigt.
      setVisit((previous) => ({ route: previous.route, revisit: previous.revisit + 1 }));
    };

    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return visit;
}
