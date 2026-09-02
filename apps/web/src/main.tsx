import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "@takt/ui-tokens/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/app.css";

/**
 * Takt — Einstiegspunkt der Anwendung.
 *
 * `showcase.css` steht seit T-057 nicht mehr in dieser Liste. Es ist das
 * Geruest der Musterseite, und die Musterseite ist kein Teil der Anwendung
 * mehr; sie hat ihren eigenen Einstiegspunkt (`src/designsystem.tsx`). Solange
 * beide Dateien zusammen geladen wurden, gab es die Klasse `.app` zweimal —
 * einmal als Raster der Musterseite, einmal als Huelle der Anwendung — und wer
 * an der einen arbeitete, verstellte die andere.
 */

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Wurzelelement #root nicht gefunden.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
