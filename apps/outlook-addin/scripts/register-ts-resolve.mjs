/**
 * Takt — Anmeldung des Auflösungshakens.
 *
 * Muss über `node --import` laufen: Statische Importe werden aufgelöst, bevor
 * der Rumpf eines Moduls ausgeführt wird. Ein `register()` im Nachweis selbst
 * käme zu spät.
 */

import { register } from 'node:module';

register('./ts-extension-resolve.mjs', import.meta.url);
