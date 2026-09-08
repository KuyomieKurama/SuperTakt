/**
 * Takt — der Einstiegspunkt, den **`proof:access`** startet (T-146, Befund
 * T-145-1).
 *
 * ===========================================================================
 * Warum es diese Datei gibt
 * ===========================================================================
 *
 * `proof:access` mißt die Vertrauensgrenze des lokalen Dienstes: Bindeadresse,
 * Handschlag, Token, Herkunft, Inhaltstyp, Fristen, Rechte. Dafür startet es
 * den **echten** Dienst als Kindprozeß — bis T-146 `apps/local-api/src/index.ts`.
 *
 * Und damit startete es auch die Versionsprüfung. `ss -tnp` während des Laufs:
 * `ESTAB … 140.82.121.6:443`, also `api.github.com` (Befund T-145-1). Der
 * Nachweis, der die Vertrauensgrenze mißt, überschritt sie selbst — bei jedem
 * `pnpm check`, also auch im Auslieferungstor. Drei Folgen: ein Lebenszeichen
 * (R-19 Punkt 3), Mitverbrauch der 60 Anfragen je Stunde und Quelladresse
 * (T-136-5), und eine Zusage in `main.ts`, die nicht stimmte.
 *
 * ===========================================================================
 * Warum ein Parameter und keine Umgebungsvariable
 * ===========================================================================
 *
 * Entscheidung des Orchestrators zu dieser Aufgabe: **ein ausdrücklicher
 * Parameter am Zusammenbau.** Eine Umgebungsvariable wäre von außerhalb des
 * Prozesses setzbar und damit genau das, was A-18.3 verbietet („nicht aus
 * einer Umgebungsvariablen, nicht aus einem Argument der Befehlszeile"). Wer
 * Takt mit gesetzter Variable startete, hätte die Adresse verlegt, gegen die
 * geprüft wird.
 *
 * Ein Parameter ist es nicht: Er liegt im Prozeß, wie jeder andere Port dieses
 * Zusammenbaus. `apps/local-api/src/index.ts` — der Einstiegspunkt, den die
 * Hülle startet und den `sidecar` bündelt — ruft `main()` **ohne Argument**.
 *
 * ===========================================================================
 * Warum diese Datei `main()` ruft und ihn nicht nachbaut
 * ===========================================================================
 *
 * `tests/e2e/support/version-check-entry.ts` (T-142) baut einen zweiten Start
 * nach, und das war dort richtig: Der E2E-Lauf braucht **weniger** als der
 * echte Start (kein Aufgabenbereich, keine Rechteprüfung), weil er etwas
 * anderes mißt.
 *
 * Hier ist es umgekehrt. `proof:access` mißt **genau diesen Start** — die
 * Migration, die Rechteprüfung, das Aufräumen liegengebliebener Exportdateien,
 * den Aufgabenbereich auf 17844, die Beendigungscodes. Ein nachgebauter Start
 * wäre ein zweiter Weg, der vom echten abweichen kann, ohne daß ein Fall es
 * mißt — und dann prüfte der Nachweis eine Anwendung, die niemand ausliefert.
 *
 * Deshalb: **derselbe `main()`**, ein Argument mehr. Der einzige Unterschied
 * zwischen dem gemessenen und dem ausgelieferten Lauf ist die Abholfunktion,
 * und sie steht drei Zeilen weiter unten.
 *
 * ===========================================================================
 * Diese Datei wird nie gebündelt und nie ausgeliefert
 * ===========================================================================
 *
 * Sie liegt unter `scripts/` und nicht unter `src/`. Der Sidecar wird aus
 * `src/index.ts` gebündelt; `proof:release-safety` liest `SOURCE_ROOTS` und
 * damit `apps/local-api/src` — diese Datei ist in keinem von beidem.
 */

import { main } from '../src/main.ts';
import type { ReleaseLookup, ReleaseSourcePort } from '../src/version/source.ts';

/**
 * Die Abholfunktion des Nachweislaufs: **sie geht nirgendwohin.**
 *
 * Kein `fetch`, kein Netz, keine Attrappe auf einem Port — nichts, was eine
 * Verbindung öffnen könnte. Sie antwortet, als wäre die Anfrage
 * fehlgeschlagen, und das ist für diesen Nachweis der richtige Ausgang:
 *
 *  - Der Dienst verhält sich danach wie bei jedem stillen Fehlschlag
 *    (A-18.11): kein Hinweis, keine Fehlerfläche, **kein zweiter Versuch im
 *    selben Lauf**. `GET /version-check` antwortet `state: 'unknown'`, und
 *    genau das prüft `proof:access` in seinem Abschnitt zur Versionsprüfung.
 *  - Es gibt keinen zweiten Prozeß, kein zweites Zertifikat und keinen
 *    zweiten Port, der belegt sein könnte.
 *
 * `'unreachable'` und nicht `'aborted'`: `aborted` heißt „der Dienst hält an"
 * und würde im Protokoll gar nicht erscheinen (siehe `checker.ts`). Der
 * Nachweis soll die Zeile sehen, die ein Fehlschlag schreibt — sie ist der
 * Beleg dafür, daß der Prüfer überhaupt gelaufen ist.
 */
const offlineReleaseSource: ReleaseSourcePort = {
  latest: (): Promise<ReleaseLookup> =>
    Promise.resolve({ ok: false, reason: 'unreachable' } as const),
};

await main({ releaseSource: offlineReleaseSource });
