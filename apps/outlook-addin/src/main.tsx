/**
 * Takt — Einstiegspunkt des Aufgabenbereichs.
 *
 * Die Design-Token kommen aus `@takt/ui-tokens` — derselben Datei, aus der die
 * Hauptanwendung liest (A-10.6, E-024). Zwei Kopien von 600 Zeilen Farbwerten
 * laufen auseinander, und ein Add-in, das „fast" wie die Anwendung aussieht,
 * sieht falsch aus.
 *
 * `office.js` wird in `index.html` geladen, nicht hier: Es ist kein Modul und
 * muss vor allem anderen stehen. Es ist die **einzige** Ressource, die dieses
 * Add-in von außen bezieht — Microsoft verlangt das und aktualisiert die Datei
 * laufend, weshalb eine Integritätsprüfung nicht haltbar ist (B-10.6). Sonst
 * lädt der Aufgabenbereich nichts von außen: keine Schriftart, kein
 * Symbolpaket, keine Messbibliothek.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@takt/ui-tokens/tokens.css';
import './styles/addin.css';

import { App } from './ui/App.tsx';

const container = document.getElementById('root');

if (container === null) {
  throw new Error('Der Aufgabenbereich hat keinen Wurzelknoten.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
