/** `office.js` muss als einziges externes Skript vor dem Einstiegspunkt in `index.html` geladen werden. */

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
