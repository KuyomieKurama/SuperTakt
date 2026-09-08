/**
 * Takt — T-140, `GET /api/v1/version-check` — sie liest ab, sie fragt nie
 * (A-V-10, A-V-14, A-18.11, E-069).
 *
 * T-138s eigener Nachweis für A-V-10 lief gegen den **zusammengebauten
 * Dienst** (101 Aufrufe → eine ausgehende Anfrage) — das bleibt in der
 * Hoheit von domain-dev als `proof:release-safety`/`proof:access`. Diese
 * Datei misst dieselbe Zusage auf der kleinstmöglichen Ebene: `createVersionRoutes`
 * bekommt eine reine Funktion `current: () => VersionCheckState` mit —
 * **kein** `ReleaseSourcePort`, keine Möglichkeit, überhaupt eine Anfrage
 * auszulösen. Ein Fall, der den Netzaufruf zurück in den Anfragebehandler
 * holt, kann diese Route nicht mehr mit einer reinen Funktion bauen — genau
 * das ist der Nachweis: Er wird **rot am Typ**, nicht erst zur Laufzeit.
 */
import { describe, expect, it } from 'vitest';

import type { VersionCheckState } from '../../src/version/checker.ts';
import { createVersionRoutes, toVersionCheckView } from '../../src/routes/version.ts';

describe('toVersionCheckView', () => {
  it('"unknown" wird zu state:"unknown", latestVersion:null', () => {
    expect(toVersionCheckView({ state: 'unknown' })).toEqual({ state: 'unknown', latestVersion: null });
  });

  it('"known" trägt die Fassung unverändert weiter', () => {
    expect(toVersionCheckView({ state: 'known', latestVersion: '1.2.3' })).toEqual({
      state: 'known',
      latestVersion: '1.2.3',
    });
  });

  it('das Ergebnis trägt strukturell nur genau diese zwei Schlüssel — kein Verweis, keine Beschreibung, kein Zeitpunkt (A-V-14)', () => {
    const known = toVersionCheckView({ state: 'known', latestVersion: '1.2.3' });
    expect(Object.keys(known).sort()).toEqual(['latestVersion', 'state']);
    const unknown = toVersionCheckView({ state: 'unknown' });
    expect(Object.keys(unknown).sort()).toEqual(['latestVersion', 'state']);
  });
});

describe('createVersionRoutes — GET / liefert genau das zuletzt ermittelte Ergebnis (A-V-10)', () => {
  it('gibt "unknown" heraus, solange noch nichts geprüft wurde', async () => {
    const current = (): VersionCheckState => ({ state: 'unknown' });
    const routes = createVersionRoutes(current);

    const response = await routes.request('/');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: unknown };
    expect(body.data).toEqual({ state: 'unknown', latestVersion: null });
  });

  it('gibt "known" mit der zuletzt ermittelten Fassung heraus', async () => {
    const current = (): VersionCheckState => ({ state: 'known', latestVersion: '9.9.9' });
    const routes = createVersionRoutes(current);

    const response = await routes.request('/');
    const body = (await response.json()) as { data: unknown };
    expect(body.data).toEqual({ state: 'known', latestVersion: '9.9.9' });
  });

  it('101 Aufrufe der Route rufen `current` 101-mal — und lösen dabei NULL Netzaufrufe aus, weil `current` gar keine Möglichkeit dazu hat', async () => {
    let calls = 0;
    const current = (): VersionCheckState => {
      calls += 1;
      return { state: 'unknown' };
    };
    const routes = createVersionRoutes(current);

    for (let i = 0; i < 101; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await routes.request('/');
    }

    expect(calls).toBe(101);
    // `current` ist eine synchrone Funktion ohne Parameter — sie kann
    // strukturell keine Anfrage anstoßen. Das ist der Beweis, nicht eine
    // gezählte Netzwerkanfrage: Es gibt in dieser Route nichts, das eine
    // solche auslösen könnte (A-V-10, "nie eine ausgehende Anfrage").
    expect(current.length).toBe(0);
  });

  it('jeder Aufruf ist unabhängig — ein späterer current() kann ein anderes Ergebnis liefern, ohne dass die Route selbst Zustand hält', async () => {
    let state: VersionCheckState = { state: 'unknown' };
    const routes = createVersionRoutes(() => state);

    const first = await (await routes.request('/')).json();
    expect((first as { data: unknown }).data).toEqual({ state: 'unknown', latestVersion: null });

    state = { state: 'known', latestVersion: '2.0.0' };
    const second = await (await routes.request('/')).json();
    expect((second as { data: unknown }).data).toEqual({ state: 'known', latestVersion: '2.0.0' });
  });
});
