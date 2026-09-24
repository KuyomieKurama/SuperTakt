import { installTextEditing } from "./lib/textEditing";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { startupLanguage } from "./features/settings/startupAppearance";
import { setLanguage } from "./lib/language";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/app.css";
import "./styles/viewport-layout.css";

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

performance.mark("supertakt:javascript-ready");

const removeTextEditing = installTextEditing();
if (import.meta.hot) import.meta.hot.dispose(removeTextEditing);

// Start-up screens already use the last chosen language; the Bestand overrides it once loaded.
setLanguage(startupLanguage());

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Root element #root not found.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
