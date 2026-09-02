import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Showcase } from "./showcase/Showcase";
import "@takt/ui-tokens/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/app.css";
import "./styles/showcase.css";

/**
 * Takt — Einstiegspunkt der Musterseite (T-057).
 *
 * ## Warum eine eigene Datei und nicht ein Reiter der Anwendung
 *
 * Der Auftraggeber wollte den Punkt „Designsystem“ aus der Navigation heraus
 * haben und schrieb dazu: „Der Zugriff soll ausschliesslich ueber die API
 * moeglich sein.“ Das ist so nicht umsetzbar — die Musterseite ist Oberflaeche
 * und kein Datenbestand, den ein Dienst ausliefern koennte. Der lokale Dienst
 * kennt Todos, Zeiten und Einstellungen; eine React-Seite gehoert zu keinem
 * dieser Begriffe.
 *
 * Die Absicht dahinter ist trotzdem erfuellbar, und sie lautet: **im Produkt
 * unsichtbar, fuer Entwicklung und Abnahme erreichbar.** Genau das leistet ein
 * zweiter Einstiegspunkt:
 *
 *  - Aus der Anwendung fuehrt kein Weg mehr hierher. Weder die Navigation noch
 *    der Router noch irgendeine Adresse der Anwendung kennen die Seite.
 *  - Im Entwicklungsbetrieb liegt sie unter `/designsystem.html`.
 *  - Im ausgelieferten Buendel entsteht sie nicht: `vite.config.ts` nimmt sie
 *    nur bei `TAKT_DESIGNSYSTEM=1` in die Eingaben auf. Ohne diese Variable
 *    gibt es die Datei im `dist` nicht, also auch nicht in der Tauri-Huelle.
 *
 * ## Warum sie nicht geloescht wurde
 *
 * Sie ist die Abnahmegrundlage fuer die gemessenen Kontrastpaare und die
 * einzige Stelle, an der alle Zustaende — leer, ladend, Fehler, aktiv,
 * ueberfahren — nebeneinander stehen. Wer eine Farbe oder einen Baustein
 * aendert, sieht hier in einem Blick, was er sonst ueber vierzehn Ansichten
 * verteilt suchen muesste.
 *
 * ## Warum `app.css` mitgeladen wird
 *
 * Die Musterseite zeigt auch Bausteine, deren Aussehen in `app.css` steht
 * (Kanban, Exportvorschau, Tagbaum). `showcase.css` kommt danach und traegt
 * nur noch das Geruest der Seite selbst. Seit T-057 kollidieren die beiden
 * Dateien nicht mehr: Die Huelle der Musterseite heisst `.showcase`, die der
 * Anwendung `.app`.
 */

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Wurzelelement #root nicht gefunden.");
}

createRoot(container).render(
  <StrictMode>
    <Showcase />
  </StrictMode>,
);
