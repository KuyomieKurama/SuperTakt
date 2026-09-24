import { readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { basename } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

/** The product port (B-1.5). Proof runs use it unless TAKT_PROOF_PORT says otherwise. */
const PRODUCT_API_PORT = 17843;

/**
 * API port of a proof run, taken from `TAKT_PROOF_PORT` (E-083 point 4, E-121 point 8).
 *
 * Only proof runs read this variable; the shipped entry `src/index.ts` calls `main()`
 * without a port. A malformed value is refused instead of silently falling back to 17843,
 * because a fallback would put the run back onto the port it was moved away from.
 * The task pane port of the same run is this port plus one (17843/17844 by default);
 * proof:taskpane binds this port plus 101, hence the upper bound 65434.
 */
export function proofPort() {
  const raw = process.env.TAKT_PROOF_PORT;
  if (raw === undefined || raw === '') return PRODUCT_API_PORT;
  const port = /^\d{4,5}$/.test(raw) ? Number(raw) : Number.NaN;
  if (!(port >= 1024 && port <= 65434)) {
    throw new Error(
      `TAKT_PROOF_PORT=${JSON.stringify(raw)} is not a port between 1024 and 65434. ` +
        'The run refuses instead of falling back to 17843.',
    );
  }
  return port;
}

/*
 * A product port named directly: the two literals or the constants from `src/config.ts`.
 * Comments count too, so a stale "listens on <port>" in a comment is reported as well.
 */
const HARDCODED_PORT = new RegExp(
  `\\b(?:${PRODUCT_API_PORT}|${PRODUCT_API_PORT + 1})\\b|\\b(?:DEFAULT_PORT|TASKPANE_PORT)\\b`,
);

/** Lines of `source` that name a product port instead of asking proofPort(), as "line: text". */
export function findHardcodedPorts(source) {
  const hits = [];
  source.split('\n').forEach((text, index) => {
    if (HARDCODED_PORT.test(text)) hits.push(`${index + 1}: ${text.trim()}`);
  });
  return hits;
}

/**
 * Checks that the given proof files take their port only from proofPort() (T-397a, E-121 point 8).
 *
 * Two anchors come first, so a blind scanner refuses instead of reporting green (E-121 point 10):
 * the product ports here must equal `src/config.ts`, and a sample with each forbidden form must hit.
 * Blind spot, named: a port spelled differently (`0x45f3`, `17_843`, arithmetic) is not found.
 */
export async function checkNoHardcodedPort(check, filePaths) {
  const config = await import('../src/config.ts');
  check(
    'Anker: die Produktports in port-probe.mjs sind die aus src/config.ts',
    config.DEFAULT_PORT === PRODUCT_API_PORT && config.TASKPANE_PORT === PRODUCT_API_PORT + 1,
    `config ${config.DEFAULT_PORT}/${config.TASKPANE_PORT}, port-probe ${PRODUCT_API_PORT}/${PRODUCT_API_PORT + 1}`,
  );

  const sample = [
    `const port = ${PRODUCT_API_PORT};`,
    `const pane = ${PRODUCT_API_PORT + 1};`,
    "import { DEFAULT_PORT } from '../src/config.ts';",
    'listen(TASKPANE_PORT);',
    'const port = proofPort();',
    `const other = ${PRODUCT_API_PORT}0;`,
  ].join('\n');
  const sampleHits = findHardcodedPorts(sample);
  check(
    'Gegenprobe: der Scanner findet genau die vier verbotenen Formen im Muster',
    sampleHits.length === 4 && sampleHits.every((hit) => /^[1-4]: /.test(hit)),
    sampleHits.join(' | '),
  );

  for (const filePath of filePaths) {
    const hits = findHardcodedPorts(readFileSync(filePath, 'utf8'));
    check(
      `${basename(filePath)} nennt keinen Produktport als Zahl oder Konstante`,
      hits.length === 0,
      hits.join(' | '),
    );
  }
}

// Wait before starting, so the readiness probe does not catch a previous service.
export async function waitForPortFree(port, timeoutMs = 5000) {
  const until = Date.now() + timeoutMs;
  do {
    if (await portFree(port)) return true;
    await sleep(150);
  } while (Date.now() < until);
  return false;
}

// A connection means "taken"; an error or 500 ms without a connection means "free".
export function portFree(port, host = '127.0.0.1') {
  return new Promise((done) => {
    const socket = createConnection({ host, port });
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
