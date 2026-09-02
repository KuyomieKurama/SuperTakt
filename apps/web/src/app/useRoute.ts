import { useEffect, useState } from "react";
import { parseRoute, type Route } from "./router";

/** Hält die aktuelle Route und hört auf Änderungen des Ankers. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = (): void => {
      setRoute(parseRoute(window.location.hash));
      // Beim Wechsel nach oben: Sonst steht der Benutzer in einer neuen
      // Ansicht mitten im Text, ohne dass er gescrollt hat.
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}
