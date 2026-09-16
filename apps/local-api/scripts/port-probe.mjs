import { createConnection } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';

// Vor dem Start warten, damit die Bereitschaftsprüfung keinen vorherigen Dienst erwischt.
export async function waitForPortFree(port, timeoutMs = 5000) {
  const until = Date.now() + timeoutMs;
  do {
    if (await portFree(port)) return true;
    await sleep(150);
  } while (Date.now() < until);
  return false;
}

// Eine Verbindung bedeutet „belegt“; Fehler oder 500 ms ohne Verbindung bedeuten „frei“.
export function portFree(port) {
  return new Promise((done) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      done(false);
    });
    socket.once('error', () => done(true));
    setTimeout(() => {
      socket.destroy();
      done(true);
    }, 500).unref();
  });
}
