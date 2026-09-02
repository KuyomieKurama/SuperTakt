/**
 * Takt — globaler Aufbau für die Bauergebnis-Prüfung von `apps/outlook-addin` (T-055).
 *
 * Baut `apps/outlook-addin` einmal (`vite build`) und liefert genau dieses
 * Ergebnis über den echten, unveränderten `startTaskpaneServer()` aus
 * `apps/local-api/src/taskpane/server.ts` aus (T-053) — über echtes TLS, auf
 * Port 17944 statt des produktiven 17844 (Begründung in
 * `build-check-session.ts`), mit einem selbst erzeugten Zertifikat in einem
 * Wegwerfverzeichnis.
 *
 * Der lokale Dienst selbst (Port 17843) läuft in dieser Prüfung **nicht mit**:
 * Die beiden hier gewählten Fälle (TP-BUILD-03, TP-BUILD-04) brauchen ihn
 * nicht — beide bleiben vor jedem Netzwerkaufruf zum Dienst stehen (kein
 * Office-Wirt, reine Mustererkennung im Testbereich). Ein zusätzlich
 * gestarteter Dienst wäre hier unbenutzte Vorsorge, keine Voraussetzung.
 */

import { execFile, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { promisify } from 'node:util';

import type { FullConfig } from '@playwright/test';

import {
  OUTLOOK_ADDIN_DIST_DIR,
  OUTLOOK_TASKPANE_APP_DATA_DIR,
  OUTLOOK_TASKPANE_PORT,
  REPO_ROOT,
} from './build-check-session';

const execFileAsync = promisify(execFile);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buildOutlookAddin(): Promise<void> {
  try {
    await execFileAsync('pnpm', ['--filter', '@takt/outlook-addin', 'build'], {
      cwd: REPO_ROOT,
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    const detail = error as { stdout?: string; stderr?: string; message?: string };
    throw new Error(
      `Der Bau von apps/outlook-addin ist fehlgeschlagen — genau das wäre der Fund, den diese Aufgabe sucht.\n` +
        `${detail.stdout ?? ''}\n${detail.stderr ?? detail.message ?? String(error)}`,
    );
  }
}

async function startTaskpane(): Promise<ChildProcessWithoutNullStreams> {
  await rm(OUTLOOK_TASKPANE_APP_DATA_DIR, { recursive: true, force: true });

  const child = spawn('node', ['tests/e2e/support/run-outlook-taskpane.mjs'], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      TAKT_TASKPANE_ROOT: OUTLOOK_ADDIN_DIST_DIR,
      TAKT_TASKPANE_APPDATA: OUTLOOK_TASKPANE_APP_DATA_DIR,
      TAKT_TASKPANE_PORT: String(OUTLOOK_TASKPANE_PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString('utf8')));
  child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString('utf8')));

  const outcome = await new Promise<'bereit' | 'fehler' | 'exited'>((resolve) => {
    const onData = () => {
      if (stdout.includes('BEREIT ')) resolve('bereit');
      else if (stdout.includes('FEHLER')) resolve('fehler');
    };
    child.stdout.on('data', onData);
    child.once('exit', () => resolve('exited'));
    // Obergrenze: Zertifikatserzeugung (RSA-2048) plus Serverstart. Grosszügig,
    // weil dieselbe Maschine mehrere Team-Agenten gleichzeitig fährt.
    setTimeout(() => resolve('exited'), 20_000);
  });

  if (outcome !== 'bereit') {
    child.kill('SIGTERM');
    throw new Error(
      `Der Aufgabenbereich-Port kam nicht hoch (${outcome}).\nstdout:\n${stdout}\nstderr:\n${stderr}`,
    );
  }

  return child;
}

export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  await buildOutlookAddin();
  const taskpane = await startTaskpane();

  // Kurze Gnadenfrist: `server.listen`s Rückruf ist gelaufen (das meldet
  // `BEREIT`), TLS-Handschläge auf demselben Port unmittelbar danach waren im
  // Nachbau örtlich manchmal einen Wimpernschlag zu früh.
  await sleep(200);

  return async () => {
    taskpane.kill('SIGTERM');
    await sleep(300);
  };
}
