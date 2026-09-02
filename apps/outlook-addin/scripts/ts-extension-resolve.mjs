/**
 * Takt — Auflösungshaken für den Nachweispfad.
 *
 * `packages/domain` schreibt seine internen Importe mit `.js`-Endung, weil es
 * für einen Bündler gebaut ist (`moduleResolution: bundler`). Node löst diese
 * Endung wörtlich auf und findet die Datei nicht — es gibt keine `.js`, es
 * gibt eine `.ts`.
 *
 * `packages/export` stand bis T-028 ebenfalls hier; seit E-045 lädt der
 * Vorlagen-Motor ohne diesen Haken. Nachgemessen: `base64.ts`, `merge-notes.ts`
 * und `model.ts` laufen mit blankem `node` durch. Alles Übrige des Motors
 * scheitert weiterhin — aber an `packages/domain/src/export.ts`, das seinerseits
 * `./kernel.js` schreibt, und nicht mehr an einer eigenen Endung. Der Haken
 * verschwindet, sobald die Domäne nachzieht.
 *
 * Dieser Haken bildet `./x.js` auf `./x.ts` ab, **nachdem** die gewöhnliche
 * Auflösung fehlgeschlagen ist. Er greift ausschließlich bei relativen
 * Angaben; Paketnamen bleiben unberührt. Damit tut er genau das, was ein
 * Bündler an derselben Stelle täte, und nichts weiter.
 *
 * Er gehört zum Nachweis, nicht zum Erzeugnis: Im Betrieb bündelt Vite den
 * Aufgabenbereich und esbuild den Sidecar; beide lösen die Endung von sich aus
 * auf.
 */

export async function resolve(specifier, context, nextResolve) {
  if (/^\.{1,2}\//.test(specifier) && specifier.endsWith('.js')) {
    try {
      return await nextResolve(specifier, context);
    } catch (error) {
      if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
      return nextResolve(`${specifier.slice(0, -3)}.ts`, context);
    }
  }
  return nextResolve(specifier, context);
}
