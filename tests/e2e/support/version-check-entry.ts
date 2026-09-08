/**
 * Takt — eigener Einstiegspunkt des lokalen Dienstes für jeden End-zu-Ende-Lauf,
 * der ohne echtes GitHub auskommen soll (T-142, seither erweitert von T-166,
 * T-187).
 *
 * ===========================================================================
 * O-FI/O-FJ (T-187) — jetzt derselbe `main()` wie `proof-access-entry.ts`
 * ===========================================================================
 *
 * Bis hierhin baute diese Datei einen **zweiten, eigenen** Dienststart nach:
 * eigener Handschlag, eigener Zusammenbau, eigene Migration, eigene
 * `http`-Brücke auf `app.fetch`, eigener Zehn-Sekunden-Takt. O-FI (T-179 B-2)
 * hat gefunden, wofür das der Preis war: `apps/local-api/src/main.ts` räumt
 * beim Start liegengebliebene Bildkopien ohne Eigentümer auf
 * (`sweepOrphanedImages`, A-A-18) — dieser Nachbau tat das **nicht**, und
 * `tests/e2e/attachment-persistence-live.spec.ts` (Neustart mit Bildanhang,
 * über genau diesen Einstiegspunkt) war damit der einzige Fall, der den
 * Aufräumlauf hätte sehen können, und sah ihn nie. Ein Nachbau, der von der
 * echten Anwendung abweicht, ohne dass ein Fall es misst — exakt die Klasse
 * Fehler, vor der `apps/local-api/scripts/proof-access-entry.ts` seit T-146
 * warnt („ein zweiter Weg, der vom echten abweichen kann").
 *
 * **Die Behebung:** Kein zweiter Weg mehr. Diese Datei ruft jetzt **denselben**
 * `main()` aus `apps/local-api/src/main.ts`, mit derselben Naht, die dort für
 * `proof:access` schon existiert (`MainOptions.releaseSource`, T-146,
 * Befund T-145-1) — genau die Antwort auf die Naht-Frage aus O-FJ: Ja, dieser
 * Einstiegspunkt fährt `main({ releaseSource })`, wie `proof-access-entry.ts`
 * es vormacht, und baut nichts mehr selbst nach. Migration, Rechteprüfung,
 * das Aufräumen liegengebliebener Exportdateien, der Aufgabenbereich des
 * Add-ins auf Port 17844, der Aufräumlauf für Bildkopien — all das läuft jetzt
 * mit, weil es derselbe Start ist und nicht mehr eine Abschrift davon, die
 * jeden dieser Schritte einzeln nachbauen müsste, um ihn zu tragen.
 *
 * Der **äußere Vertrag bleibt unverändert**: derselbe Aufruf
 * (`node tests/e2e/support/version-check-entry.ts`), dieselben
 * Umgebungsvariablen (`XDG_DATA_HOME`, `TAKT_E2E_GITHUB_STUB_URL`), derselbe
 * Handschlag über `stdin`, derselbe Port. `services.ts#spawnLocalApi` und
 * `version-check-services.ts#startVersionCheckService` — die einzigen beiden
 * Aufrufer — brauchten deshalb **keine** Änderung.
 *
 * Was seit T-166 als Warnung hier stand — „zwei Rollen in einer Datei"
 * (O-EB) — ist damit gegenstandslos: Es gibt keinen eigenen Nachbau mehr, an
 * dem ein Eingriff nur für eine der beiden Rollen gemessen werden könnte. Die
 * einzige Rolle dieser Datei ist jetzt, `main()` dieselbe Abholfunktion
 * unterzuschieben, die es vorher auch schon war.
 *
 * ===========================================================================
 * Warum diese Datei trotzdem noch existiert und nicht `proof-access-entry.ts`
 * direkt wiederverwendet wird
 * ===========================================================================
 *
 * `proof-access-entry.ts`s Abholfunktion antwortet **nie** (`unreachable`,
 * A-18.11) — richtig für einen Nachweis, der die Vertrauensgrenze misst und
 * dabei keine zweite Verbindung öffnen soll. `TP-VER-10` bis `TP-VER-13`
 * (`docs/testplan.md` Abschnitt 24) brauchen das Gegenteil: eine Attrappe, die
 * **antwortet**, mit einer Fassung, einem Namen, einer Adresse — steuerbar je
 * Testfall (`github-releases-stub.ts`). Diese Datei bleibt deshalb der Ort,
 * an dem genau diese steuerbare Abholfunktion entsteht (`wrappedFetch` unten,
 * unverändert aus der vorigen Fassung) und an `main()` übergeben wird.
 *
 * Diese Datei wird **nie gebaut und nie ausgeliefert** — sie liegt unter
 * `tests/e2e/support/**`, nicht unter `apps/**`, und `proof:release-safety`
 * (T-138) durchsucht ausdrücklich nur `apps/desktop/**` und `apps/local-api/**`.
 */

import { main } from '../../../apps/local-api/src/main.ts';
import { createGithubReleaseSource } from '../../../apps/local-api/src/version/source.ts';

/**
 * Der Ursprung, den `version/source.ts` fest einsetzt. Ausschließlich zum
 * Umschreiben der von dort kommenden Adresse auf die lokale Attrappe — die
 * Adresse selbst bleibt in `version/source.ts` die einzige Festlegung
 * (E-066 Punkt 1); hier wird nichts aus einer Antwort oder einem Argument
 * übernommen, sondern eine im Testeinstieg fest verdrahtete Zeichenkette
 * gegen eine zweite, ebenso fest verdrahtete Zeichenkette getauscht.
 */
const GITHUB_ORIGIN = 'https://api.github.com';

const stubUrl = process.env['TAKT_E2E_GITHUB_STUB_URL'];
if (stubUrl === undefined || stubUrl.trim() === '') {
  throw new Error(
    'TAKT_E2E_GITHUB_STUB_URL ist nicht gesetzt. version-check-entry.ts läuft ausschließlich für den ' +
      'E2E-Testlauf (Hauptreihe und TP-VER-10 bis TP-VER-13), gestartet von services.ts bzw. ' +
      'version-check-services.ts.',
  );
}

// Genau die Naht aus E-066 Punkt 1: `createGithubReleaseSource({ fetch })`
// ersetzt nur die Abholfunktion. Alles danach (Frist, `redirect: 'error'`,
// Lesestrom mit Obergrenze, Feldzugriff, Formprüfung) läuft unverändert im
// echten `version/source.ts`.
const wrappedFetch: typeof fetch = (input, init) => {
  const original = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (!original.startsWith(GITHUB_ORIGIN)) {
    // Käme das je vor, wäre es ein Fund und keine Testkonfiguration — die
    // Adresse in `version/source.ts` ist die einzige, die dieser Dienst je
    // aufruft (A-V-1).
    return Promise.reject(new Error(`Unerwartete Zieladresse außerhalb von ${GITHUB_ORIGIN}: ${original}`));
  }
  const redirected = stubUrl + original.slice(GITHUB_ORIGIN.length);
  return fetch(redirected, init);
};

await main({ releaseSource: createGithubReleaseSource({ fetch: wrappedFetch }) });
