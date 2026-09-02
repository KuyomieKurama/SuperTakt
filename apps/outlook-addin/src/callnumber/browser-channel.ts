/**
 * Takt — der Auswertungskanal im Browser (B-4.1).
 *
 * Die einzige Datei des Add-ins, die `new Worker(...)` aufruft. Sie ist bewusst
 * so klein, dass sie nichts enthält, was ohne Browser prüfbar wäre — alles
 * Entscheidbare steht in `evaluate.ts` und wird im Nachweispfad gegen einen
 * Node-Worker gefahren.
 *
 * `new URL('./worker.ts', import.meta.url)` ist die von Vite unterstützte
 * Schreibweise: Der Worker wird als eigenes Bündel erzeugt und relativ geladen,
 * passend zu `base: './'` aus `vite.config.ts`.
 */

import type { EvaluationChannel } from './evaluate.ts';
import type { EvaluateRequest, EvaluateResponse } from './protocol.ts';

export const supportsWorker = (): boolean => typeof Worker !== 'undefined';

export const spawnBrowserChannel = (): EvaluationChannel => {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

  return {
    post(request: EvaluateRequest) {
      worker.postMessage(request);
    },
    onMessage(handler: (response: EvaluateResponse) => void) {
      worker.addEventListener('message', (event: MessageEvent<EvaluateResponse>) => {
        handler(event.data);
      });
    },
    onError(handler: (message: string) => void) {
      worker.addEventListener('error', (event: ErrorEvent) => {
        handler(event.message);
      });
    },
    terminate() {
      worker.terminate();
    },
  };
};
