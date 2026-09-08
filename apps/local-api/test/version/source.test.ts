/**
 * Takt — T-140, `createGithubReleaseSource` — die eine Verbindung nach außen
 * (A-18.2, A-18.3, A-18.11, A-18.12, A-V-1 bis A-V-14, E-064, E-066).
 *
 * Testfälle: `docs/testplan.md` Abschnitt 24, `TP-VER-01` bis `TP-VER-06`,
 * `TP-VER-25`, `TP-VER-26`, ergänzt um die Netzfälle aus dem Bericht zu T-138
 * (`.claude/team/reports/T-138-domain-dev.md`, Abschnitt „Auflage für Auflage")
 * als dauerhafte Prüffälle statt einmaliger Handmessung.
 *
 * ---------------------------------------------------------------------------
 * Warum eine echte HTTP-Gegenstelle und kein gestubbtes `fetch`
 * ---------------------------------------------------------------------------
 *
 * `createGithubReleaseSource({ fetch })` ersetzt bewusst nur die
 * **Abholfunktion**, nicht die Auswertung (E-066 Punkt 1: „die Naht ist die
 * Abholfunktion, nicht die Zeichenkette"). Frist, `redirect: 'error'`, der
 * Lesestrom mit seiner Obergrenze und die Auswertung der Antwort laufen bei
 * jedem Fall unten **echt** — gegen `apps/local-api/test/version/support/
 * http-stub.ts`, einen echten `http.createServer()`. Ein gestubbtes `fetch`
 * würde genau die Zeilen ungeprüft lassen, um die es in A-V-3 bis A-V-8 geht.
 */
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';

import { createGithubReleaseSource, VERSION_CHECK_MAX_BYTES, VERSION_CHECK_TIMEOUT_MS } from '../../src/version/source.ts';
import { fixedResponse, neverResponds, startStub, type HttpStub } from './support/http-stub.ts';

const RELEASE_PATH = '/repos/beispiel-organisation/takt-testfixture/releases/latest';

let stub: HttpStub | undefined;
let evil: HttpStub | undefined;

afterEach(async () => {
  await stub?.close();
  await evil?.close();
  stub = undefined;
  evil = undefined;
});

/** Lenkt die Abholfunktion auf die Attrappe statt auf die feste Adresse. */
function sourceAgainst(target: HttpStub): ReturnType<typeof createGithubReleaseSource> {
  const call: typeof fetch = (_input, init) => fetch(`${target.url}${RELEASE_PATH}`, init);
  return createGithubReleaseSource({ fetch: call });
}

describe('TP-VER-01 — GitHub nicht erreichbar', () => {
  it('Verbindung abgelehnt: "unreachable", kein Wurf', async () => {
    // Port 1 hört auf 127.0.0.1 nicht — die Verbindung wird sofort abgelehnt,
    // ohne dass irgendein Server gestartet wird.
    const call: typeof fetch = (_input, init) => fetch('http://127.0.0.1:1/nichts', init);
    const source = createGithubReleaseSource({ fetch: call });
    const result = await source.latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'unreachable' });
  });

  it(
    'Zeitüberschreitung: eine Antwort, die anfängt und nie endet, ergibt "timeout" nach der Gesamtfrist (A-V-5)',
    async () => {
      stub = await startStub(neverResponds());
      const source = sourceAgainst(stub);
      const started = Date.now();
      const result = await source.latest(new AbortController().signal);
      const elapsed = Date.now() - started;
      expect(result).toEqual({ ok: false, reason: 'timeout' });
      // Die Frist deckt auch das Lesen des Rumpfes ab, nicht nur die Verbindung.
      expect(elapsed).toBeGreaterThanOrEqual(VERSION_CHECK_TIMEOUT_MS);
      expect(elapsed).toBeLessThan(VERSION_CHECK_TIMEOUT_MS + 2_000);
    },
    VERSION_CHECK_TIMEOUT_MS + 3_000,
  );
});

describe('TP-VER-02 bis TP-VER-04 — eine Antwort, mit der sich nichts anfangen lässt', () => {
  it('TP-VER-02: 200 OK mit HTML statt JSON ist "malformed"', async () => {
    stub = await startStub(fixedResponse(200, '<html>Service Unavailable</html>'));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'malformed' });
  });

  it('TP-VER-03: 200 OK mit leerem Rumpf (0 Bytes) ist "malformed"', async () => {
    stub = await startStub(fixedResponse(200, ''));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'malformed' });
  });

  it('TP-VER-04: 200 OK, gültiges JSON, aber ohne jedes Fassungsfeld ist "malformed"', async () => {
    stub = await startStub(fixedResponse(200, JSON.stringify({ id: 1 })));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'malformed' });
  });
});

describe('TP-VER-05 — Fassungsfeld vorhanden, aber unsinnig (A-V-8)', () => {
  it.each([
    ['banana', 'banana'],
    ['leere Zeichenkette', ''],
    ['null', null],
    ['Zahl statt Zeichenkette', 42],
    ['zu viele Komponenten', '1.2.3.4.5.6.7'],
    ['Objekt', {}],
    ['Feld', ['1.2.3']],
  ])('tag_name = %s ist "malformed"', async (_label, tagName) => {
    stub = await startStub(fixedResponse(200, JSON.stringify({ tag_name: tagName })));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'malformed' });
  });

  it('60 000 Zeichen in tag_name ist "malformed" und hängt sich nicht auf', async () => {
    stub = await startStub(fixedResponse(200, JSON.stringify({ tag_name: 'a'.repeat(60_000) })));
    const started = Date.now();
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'malformed' });
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('ein __proto__-Feld liefert kein eigenes tag_name — die Antwort kommt aus der Prototypenkette nicht durch', async () => {
    stub = await startStub(fixedResponse(200, JSON.stringify({ __proto__: { tag_name: '9.9.9' } })));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'malformed' });
  });

  it('die Antwort selbst ist ein Feld (Array) statt eines Gegenstands', async () => {
    stub = await startStub(fixedResponse(200, JSON.stringify([{ tag_name: '1.2.3' }])));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'malformed' });
  });
});

describe('TP-VER-06 — keine Veröffentlichung vorhanden', () => {
  it('404 auf die Einzelabfrage ist "no_release", kein Fehlschlag', async () => {
    stub = await startStub(fixedResponse(404, JSON.stringify({ message: 'Not Found' })));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'no_release' });
  });
});

describe('ein unerwarteter Statuscode wird als "status" mit Zahl eingeordnet (T-136-5)', () => {
  it('403 (erschöpfte Anfragebegrenzung) trägt den Statuscode', async () => {
    stub = await startStub(fixedResponse(403, JSON.stringify({ message: 'rate limited' })));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'status', statusCode: 403 });
  });

  it('500 trägt ebenfalls seinen Statuscode', async () => {
    stub = await startStub(fixedResponse(500, 'Internal Server Error'));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'status', statusCode: 500 });
  });
});

describe('TP-VER-25 — eine Weiterleitung auf einen fremden Wirt wird nicht verfolgt (A-V-3, A-18.3, R-19)', () => {
  it('redirect: "error" — die Umleitung wird nicht angesteuert, am Ziel kommt NICHTS an', async () => {
    evil = await startStub(fixedResponse(200, JSON.stringify({ tag_name: 'sollte-nie-ankommen' })));
    stub = await startStub((_req, res) => {
      res.writeHead(302, { location: `${evil?.url}/payload` });
      res.end();
    });

    const result = await sourceAgainst(stub).latest(new AbortController().signal);

    expect(result).toEqual({ ok: false, reason: 'redirect' });
    expect(evil.requests).toHaveLength(0);
  });

  it('auch eine 301 mit relativer Adresse wird nicht verfolgt', async () => {
    stub = await startStub((_req, res) => {
      res.writeHead(301, { location: '/anderswo' });
      res.end();
    });
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'redirect' });
  });
});

describe('A-V-6 — Obergrenze des entpackten Stroms: eine gzip-Bombe wird abgebrochen, nie geparst', () => {
  it('ein Rumpf, der weit über 65 536 entpackte Bytes hinausgeht, ergibt "too_large" ohne die gesamte Größe zu lesen', async () => {
    const huge = Buffer.alloc(2 * VERSION_CHECK_MAX_BYTES, 0);
    const compressed = gzipSync(huge);
    // Die Kompression muss tatsächlich etwas bringen, sonst prüfte dieser Fall
    // nichts über das Entpacken.
    expect(compressed.length).toBeLessThan(VERSION_CHECK_MAX_BYTES);

    stub = await startStub((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json', 'content-encoding': 'gzip' });
      res.end(compressed);
    });

    const started = Date.now();
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'too_large' });
    // Abbruch beim Lesen, nicht erst nach dem vollständigen Entpacken von
    // 2 × 64 KiB — sonst wäre die Obergrenze nur eine Behauptung.
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it('eine Antwort GENAU an der Obergrenze bleibt gültig — die Grenze ist "größer als", nicht "größer oder gleich"', async () => {
    // Baut ein JSON, dessen entpackte Größe exakt VERSION_CHECK_MAX_BYTES
    // trägt, mit einer gültigen Fassung darin.
    const prefix = '{"tag_name":"1.2.3","padding":"';
    const suffix = '"}';
    const padLength = VERSION_CHECK_MAX_BYTES - prefix.length - suffix.length;
    const body = `${prefix}${'a'.repeat(padLength)}${suffix}`;
    expect(Buffer.byteLength(body, 'utf-8')).toBe(VERSION_CHECK_MAX_BYTES);

    stub = await startStub(fixedResponse(200, body));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: true, version: '1.2.3' });
  });
});

describe('A-V-7 — nur tag_name wird gelesen, jedes andere Feld bleibt unberührt', () => {
  it('eine realistische Antwort mit vielen Feldern liefert trotzdem nur die Fassung', async () => {
    stub = await startStub(
      fixedResponse(
        200,
        JSON.stringify({
          tag_name: 'v2.5.0',
          name: 'Version 2.5.0',
          body: 'Ausführliche Beschreibung, die niemals gelesen werden darf.',
          html_url: 'https://example.invalid/sollte-nie-gelesen-werden',
          assets: [{ browser_download_url: 'https://example.invalid/nie-heruntergeladen.exe' }],
          author: { login: 'wer-auch-immer' },
          upload_url: 'https://example.invalid/upload',
        }),
      ),
    );
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: true, version: '2.5.0' });
    // Das Ergebnis trägt strukturell NUR diese zwei Schlüssel (A-V-14).
    expect(Object.keys(result).sort()).toEqual(['ok', 'version']);
  });

  it('fehlt tag_name, wird NICHT auf ein zweites Feld ausgewichen — auch nicht auf ein plausibles wie "name"', async () => {
    // Ohne dieses Feld liefe die Gegenprobe "nur EIN Feldzugriff" ins Leere:
    // Ein Rückgriff auf `name`, wenn `tag_name` fehlt, wäre ein zweiter
    // Feldzugriff, den A-V-7 wörtlich ausschließt — und dieser Fall ist der
    // einzige, der ihn beim Fehlen von `tag_name` unterscheidbar macht.
    stub = await startStub(fixedResponse(200, JSON.stringify({ name: '1.2.3' })));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: false, reason: 'malformed' });
  });
});

describe('Erfolgsfall — eine gültige Fassung kommt geprüft und ohne v heraus', () => {
  it('tag_name mit führendem v wird ohne v zurückgegeben', async () => {
    stub = await startStub(fixedResponse(200, JSON.stringify({ tag_name: 'v3.1.4' })));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: true, version: '3.1.4' });
  });

  it('tag_name ohne v bleibt unverändert', async () => {
    stub = await startStub(fixedResponse(200, JSON.stringify({ tag_name: '3.1.4' })));
    const result = await sourceAgainst(stub).latest(new AbortController().signal);
    expect(result).toEqual({ ok: true, version: '3.1.4' });
  });
});

describe('A-V-2, A-V-13 — nur GET, kein Rumpf, genau drei gesetzte Kopfzeilen, keine Kennung', () => {
  it('Methode, Pfad und Kopfzeilen der ausgehenden Anfrage', async () => {
    stub = await startStub(fixedResponse(200, JSON.stringify({ tag_name: '1.0.0' })));
    await sourceAgainst(stub).latest(new AbortController().signal);

    expect(stub.requests).toHaveLength(1);
    const request = stub.requests[0];
    expect(request).toBeDefined();
    if (request === undefined) return;

    expect(request.method).toBe('GET');
    // Kein Abfrageparameter: der Pfad endet ohne "?".
    expect(request.url).not.toContain('?');
    expect(request.headers['accept']).toBe('application/vnd.github+json');
    expect(request.headers['x-github-api-version']).toBe('2022-11-28');
    expect(request.headers['user-agent']).toBe('Takt');
    // Keine Kennung der Installation, kein Geheimnis, kein Authorization/Cookie.
    expect(request.headers['authorization']).toBeUndefined();
    expect(request.headers['cookie']).toBeUndefined();
    expect(request.headers['x-takt-token']).toBeUndefined();
  });
});

describe('TP-VER-26 — die Anfrage überträgt nichts über Benutzer, Bestand oder Nutzung (A-18.12)', () => {
  it('kein Kopfzeilenwert und kein Pfadstück enthält eine erfundene, realistisch aussehende Kundenzeichenkette', async () => {
    stub = await startStub(fixedResponse(200, JSON.stringify({ tag_name: '1.0.0' })));
    await sourceAgainst(stub).latest(new AbortController().signal);

    const request = stub.requests[0];
    expect(request).toBeDefined();
    if (request === undefined) return;

    const asText = `${request.method} ${request.url} ${JSON.stringify(request.headers)}`;
    // Erfundene Werte, wie sie in einem Bestand vorkämen — Windows-Benutzername
    // nach der Konvention aus dem Kopf von docs/testplan.md, ein Todo-Titel,
    // eine Call-Nummer, ein Tag-Name. Keiner davon hat einen Weg in diese
    // Funktion — sie nimmt nur ein `AbortSignal` entgegen — und der Test
    // beweist es an der tatsächlich gesendeten Anfrage statt es zu behaupten.
    for (const marker of ['nutzer.beispiel', 'Rechnungsprüfung', 'TCK-4711', 'Kundenbetreuung']) {
      expect(asText).not.toContain(marker);
    }
    // Die Funktion nimmt keinerlei fachliche Eingabe entgegen — genau EIN
    // Parameter, das Abbruchsignal.
    const source = sourceAgainst(stub);
    expect(source.latest.length).toBe(1);
  });
});

describe('A-V-12 — ein laufender Aufruf lässt sich abbrechen', () => {
  it('ein vor der Antwort ausgelöstes Abbruchsignal beendet den Aufruf als "aborted"', async () => {
    stub = await startStub(neverResponds());
    const controller = new AbortController();
    const pending = sourceAgainst(stub).latest(controller.signal);
    setTimeout(() => controller.abort(), 50);
    const result = await pending;
    expect(result).toEqual({ ok: false, reason: 'aborted' });
  });
});
