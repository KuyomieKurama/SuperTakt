/**
 * Takt — feste Betriebswerte des Add-ins.
 *
 * Was hier steht, ist im Code festgelegt. Was der Benutzer bestimmt — der
 * reguläre Ausdruck (A-10.8), das Token (E-009), die Grundadresse — steht
 * nicht hier, sondern in `src/settings/store.ts`.
 *
 * ## Die Herkunft des Add-ins
 *
 * Ein Office-Add-in wird über HTTPS ausgeliefert; Microsoft verlangt das. Da
 * Takt vollständig lokal läuft (E-001), liefert der Rechner selbst aus. Die
 * Herkunft ist deshalb `https://localhost:17844` — die Portnummer unmittelbar
 * neben dem lokalen Dienst (17843, B-1.5), damit beide als ein Paar erkennbar
 * sind und nicht mit einem üblichen Entwicklungsport kollidieren.
 *
 * **Diese Herkunft muss in `apps/local-api/src/config.ts` unter
 * `ALLOWED_ORIGINS` eingetragen sein**, sonst weist der Dienst jede Anfrage des
 * Add-ins mit 403 ab (B-1.4). Der Eintrag fehlt dort bis heute mit Absicht: Er
 * war die offene Frage 3 aus T-011, und ein geratener Eintrag wäre eine Lücke
 * gewesen. Hiermit ist die Frage beantwortet; der Eintrag ist ein Einzeiler in
 * einer Datei, die domain-dev gehört.
 *
 * ## Gemischte Inhalte
 *
 * Die Seite ist `https`, der Dienst ist `http://127.0.0.1:17843`. Das ist
 * **kein** gemischter Inhalt im Sinne der Browserregel: `127.0.0.1` und
 * `localhost` gelten als grundsätzlich vertrauenswürdige Herkünfte und werden
 * nicht blockiert. Der Dienst auf TLS umzustellen hieße, ein Zertifikat für
 * `127.0.0.1` auszurollen — mehr Angriffsfläche für keinen Gewinn.
 */

/** Herkunft, unter der der Aufgabenbereich ausgeliefert wird. */
export const ADDIN_ORIGIN = 'https://localhost:17844';

/**
 * Erwartete Gestalt eines Takt-Tokens: `takt_` und 43 Zeichen base64url.
 *
 * Nur zur Bedienhilfe in S-13 — siehe `looksLikeToken`. Die Entscheidung über
 * Gültigkeit trifft ausschließlich der Dienst.
 */
export const TOKEN_LENGTH = 48;
