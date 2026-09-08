/**
 * Takt — die Route der Versionsprüfung (A-18.2, A-18.6, A-V-10, A-V-14,
 * A-V-19, E-069).
 *
 * **Sie liest ab, sie fragt nicht.** Sie gibt das zuletzt vom Dienst
 * ermittelte Ergebnis heraus und löst niemals eine ausgehende Anfrage aus. Der
 * Grund steht ausgeschrieben in `version/checker.ts`: Läge der Netzaufruf in
 * einem eingehenden Anfragebehandler, könnte jeder lokale Prozess mit dem
 * Sitzungsgeheimnis das Lebenszeichen takten und die Anfragebegrenzung von
 * GitHub in Sekunden verbrauchen.
 *
 * **Liegt noch nichts vor, ist das eine gültige Antwort** und kein Fehler
 * (E-069). „Noch nichts geprüft", „nicht erreichbar", „unerwartete Antwort"
 * und „keine Veröffentlichung" sehen von außen gleich aus — genau das verlangt
 * A-18.11: kein Hinweis, keine Fehlerfläche. Der Grund steht im Protokoll.
 *
 * ---------------------------------------------------------------------------
 * Was **nicht** herauskommt
 * ---------------------------------------------------------------------------
 *
 * Kein Verweis, keine Fassungsbeschreibung, kein Name, kein Zeitpunkt, kein
 * freier Text aus der Antwort (A-V-14). Aus der Antwort von GitHub verlässt
 * genau **eine geprüfte Fassungsbezeichnung** den Dienst — geprüft heißt: durch
 * `checkVersion` in `packages/domain`, ohne führendes `v`, aus einem
 * Zeichenvorrat ohne `/`, `?`, `#`, `:` und Leerzeichen. Das ist die
 * Voraussetzung dafür, dass die Hülle daraus eine Adresse bauen darf (A-V-16)
 * — und der Grund, warum `html_url` hier nicht steht, obwohl es in der Antwort
 * stünde.
 *
 * **Die installierte Fassung steht ebenfalls nicht darin.** Der Dienst kennt
 * sie nicht: Sie kommt aus den eingeprägten Angaben des Erzeugnisses und liegt
 * damit in der Hülle (A-V-15, E-067 Punkt 1). Der Vergleich fällt deshalb in
 * der Oberfläche — mit der Ordnung aus `packages/domain`, nicht mit einer
 * zweiten Meinung (E-069).
 *
 * ---------------------------------------------------------------------------
 * Und warum sie an derselben Anwendung hängt wie alles andere
 * ---------------------------------------------------------------------------
 *
 * A-V-19: Sie ist keine Route auf einem eigenen Server und keine auf einem
 * eigenen Port. Nur so erfasst `proof:route-policy` Abschnitt 4 sie von selbst
 * — der Lauf fragt den zusammengebauten Dienst nach **seiner eigenen**
 * Routenliste und fährt jede Route außerhalb von `/addin` mit dem Add-in-Token
 * an. Sie steht **nicht** in `SHARED_PATHS` und **nicht** unter `/addin`;
 * `requiredCredentialForPath` verlangt damit ohne Zutun das
 * Sitzungsgeheimnis. Das Add-in braucht sie nicht — es legt Todos an und bucht
 * Zeiten, es aktualisiert Takt nicht —, und jede Angabe, die sein dauerhaftes
 * Token erreicht, ist eine Angabe, die ein entwendetes Token erreicht (R-09).
 */

import { Hono } from 'hono';

import type { VersionCheckState } from '../version/checker.ts';
import { data } from '../http/problem.ts';
import type { TaktEnv } from '../http/guards.ts';

/**
 * Was die Oberfläche sieht.
 *
 * Zwei Felder, beide immer vorhanden, keins mehrdeutig: `state` sagt, ob
 * überhaupt etwas bekannt ist, `latestVersion` trägt die Fassung oder `null`.
 * Ein `null` ohne `state` ließe offen, ob nichts geprüft wurde oder nichts
 * vorliegt; ein `state` ohne `null` zwänge die Oberfläche zu einer leeren
 * Zeichenkette. Beides zusammen ist die eine Form, aus der die Oberfläche ohne
 * Deutung ablesen kann.
 */
export interface VersionCheckView {
  readonly state: VersionCheckState['state'];
  readonly latestVersion: string | null;
}

export function toVersionCheckView(state: VersionCheckState): VersionCheckView {
  return state.state === 'known'
    ? { state: 'known', latestVersion: state.latestVersion }
    : { state: 'unknown', latestVersion: null };
}

export function createVersionRoutes(current: () => VersionCheckState): Hono<TaktEnv> {
  const routes = new Hono<TaktEnv>();

  routes.get('/', (c) => data(c, toVersionCheckView(current())));

  return routes;
}
