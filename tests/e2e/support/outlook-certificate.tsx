import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { OutlookSetup } from '../../../apps/web/src/features/settings/OutlookSetup';
import '../../../apps/web/src/styles/app.css';

createRoot(document.getElementById('root')!).render(createElement(OutlookSetup));
