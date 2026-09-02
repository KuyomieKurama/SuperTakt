/**
 * Takt — feste Werte für den End-zu-Ende-Testlauf (T-012).
 *
 * Der Dienst bindet ausschließlich auf 127.0.0.1:17843 (B-1.5, config.ts) und
 * lässt als Herkunft für die Oberfläche nur `http://127.0.0.1:5173` zu
 * (config.ts, `ALLOWED_ORIGINS`). Beide Werte sind hier keine Erfindung dieses
 * Testlaufs, sondern aus dem Quelltext des Dienstes übernommen — ein anderer
 * Port wäre kein Testfall, sondern ein Fehlstart.
 *
 * Das Sitzungsgeheimnis ist frei erfunden, mindestens 32 Zeichen lang
 * (`MIN_SECRET_LENGTH`, session-secret.ts) und wird nie an den Dienst
 * geloggt. `WINDOWS_USER` ist eine erfundene Testkennung
 * (`docs/testplan.md`, Testdaten-Konventionen) — nie ein echter Benutzername.
 */

import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const API_BASE_URL = 'http://127.0.0.1:17843/api/v1';
export const WEB_BASE_URL = 'http://127.0.0.1:5173';
export const TOKEN_HEADER = 'X-Takt-Token';

/** Erfundenes Sitzungsgeheimnis, nur für diesen Testlauf. Kein Produktivwert. */
export const SESSION_SECRET = 'takt-e2e-erfundenes-sitzungsgeheimnis-2026-08';

/** Erfundene Testkennung (docs/testplan.md, Testdaten-Konventionen). */
export const WINDOWS_USER = 't.beispiel';

/** Arbeitsverzeichnisse dieses Testlaufs — fest, nicht zufällig, für Wiederholbarkeit. */
export const E2E_DATA_DIR = join(tmpdir(), 'takt-e2e-data');
export const E2E_EXPORT_DIR = join(tmpdir(), 'takt-e2e-export');
