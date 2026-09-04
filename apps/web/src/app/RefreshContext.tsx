import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Takt — ein Signal, dass sich Daten geändert haben.
 *
 * Wird der Timer in der Kopfleiste gestoppt, ändert sich die Buchungsliste,
 * das Dashboard und die Exportvorschau. Ohne ein gemeinsames Signal zeigten
 * sie den Stand von vorhin, bis jemand neu lädt — und der Benutzer glaubte,
 * seine Buchung sei verlorengegangen.
 *
 * Absichtlich klein: eine Zahl, die hochgezählt wird. Ansichten führen sie in
 * der **Auffrischliste** ihres `useAsync` — der dritten Angabe — und laden
 * dadurch nach, **ohne** den vorhandenen Inhalt zu verwerfen. Bis T-102 stand
 * sie in der gewöhnlichen Abhängigkeitsliste, und jedes Signal warf die Ansicht
 * auf ihre Platzhalterflächen zurück (Befund 7 aus R-1a). Der Unterschied
 * zwischen beiden Listen steht in `useAsync` ausgeschrieben.
 *
 * Keine Zwischenspeicherung, keine Ungültigkeitsregeln — bei einem lokalen
 * Dienst auf der Loopback-Adresse kostet ein erneuter Aufruf nichts.
 */
interface RefreshApi {
  readonly version: number;
  readonly bump: () => void;
}

const RefreshContext = createContext<RefreshApi | null>(null);

export function useRefresh(): RefreshApi {
  const api = useContext(RefreshContext);
  if (api === null) {
    throw new Error("useRefresh steht nur innerhalb von RefreshProvider zur Verfügung.");
  }
  return api;
}

export function RefreshProvider({ children }: { readonly children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((previous) => previous + 1), []);
  const api = useMemo<RefreshApi>(() => ({ version, bump }), [version, bump]);
  return <RefreshContext.Provider value={api}>{children}</RefreshContext.Provider>;
}
