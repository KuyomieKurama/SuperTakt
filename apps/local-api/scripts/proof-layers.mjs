/**
 * Takt — Nachweis, daß die Schichtgrenze des Dienstes im Quelltext gehalten ist
 * (T-268, A-A-75, E-001, E-101, E-103, architektur.md 1.2).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:layers
 *
 * ===========================================================================
 * Warum es diesen Lauf gibt
 * ===========================================================================
 *
 * `architektur.md` 1.2 und der Kopf von `src/context.ts` geben seit T-021
 * dieselbe Zusage: **kein Anwendungsfall bindet `hono` ein, und keine Route
 * enthält eine Fachregel.** Sie war bis T-257 an einen Ordnernamen geknüpft
 * („kein Modul unter `src/usecases/`") und wurde von **niemandem** gemessen —
 * eine Zusage, deren Menge an der Struktur aufgespannt ist statt an der
 * Anforderung, ist grün aus Zufall (E-103).
 *
 * ===========================================================================
 * Warum er in T-268 umgebaut wurde — die eigene Falle, zweimal gestellt
 * ===========================================================================
 *
 * Die erste Fassung dieses Laufs (T-257) bildete die Menge der Anwendungsfälle
 * so:
 *
 *     ['src/features/', 'src/routes/'].some((ort) => name(p).startsWith(ort))
 *
 * Damit war sie an **zwei Ordnerpräfixen** aufgespannt — also an genau der
 * Struktur, vor der der Absatz darüber warnt. Der security-checker hat das in
 * T-266 gemessen und nicht behauptet (Bedrohungsmodell 35.2): Von 63
 * Quelldateien fielen **31** aus beiden Mengen, drei davon Anwendungsfallschicht
 * (`src/context.ts`, `src/pool-movement.ts`, `src/tag-names.ts` — bis T-257
 * unter `usecases/`). Ein vollständiger Hono-Router in `src/pool-movement.ts`
 * ließ den Lauf bei **20 bestanden, 0 fehlgeschlagen**.
 *
 * Der Wiederholungsfall ist kein Angriff, sondern eine gewöhnliche Bewegung:
 * Zieht der nächste Auftrag einen Anwendungsfall aus einem Merkmal heraus, weil
 * zwei Merkmale ihn brauchen — dieselbe Bewegung, die `pool-movement.ts` gerade
 * gemacht hat —, verläßt er damit den Wächter, der über ihn urteilt.
 *
 * ===========================================================================
 * Woran die Menge jetzt hängt, und warum ein Umzug sie nicht bewegt
 * ===========================================================================
 *
 * Die Zusage lautet nicht „Dateien unter diesen zwei Präfixen binden `hono`
 * nicht ein". Sie lautet: **die Fachlogik kennt kein HTTP.** Der Träger dieser
 * Zusage ist deshalb nicht der Ordner, in dem eine Datei liegt, sondern die
 * Frage, ob sie HTTP kennen **darf**. Und das ist eine kurze, aufzählbare
 * Menge — der eingehende Adapter des Dienstes:
 *
 *   Routendateien   die Tür selbst, nach Konvention erkannt (siehe `istRouteName`)
 *   `src/access/`   die Prüfschicht: Token, Drosselung, Herkunft, Pfadregel
 *   `src/http/`     die hono-Hilfen: Wächter, Eingabe, Fehlerhülle
 *   `src/taskpane/` der zweite Port 17844, eigener HTTPS-Server (E-046)
 *   neun Einstiegsdateien, ausgeschrieben in `EINSTIEGSDATEIEN`
 *
 * **Alles andere unter `src/` ist Anwendungsfall.** Die Menge wird also als
 * **Ergänzung** gebildet, nicht als Aufzählung. Der Unterschied ist der ganze
 * Punkt: Eine neue Datei — gleich wo sie liegt, gleich ob jemand sie eine Ebene
 * hoch oder runter schiebt — landet ohne Zutun **in** der gemessenen Menge.
 * Durch die Ritze zwischen zwei Präfixen fällt nichts mehr, weil es keine Ritze
 * mehr gibt: Wer eine Datei aus der Messung nehmen will, muß sie in eine der
 * Ausnahmen **eintragen**, und dieser Eintrag ist sichtbar.
 *
 * Die Ausnahmeliste trägt nach E-103 ihren eigenen Wächter, in beide
 * Richtungen (Abschnitt 5):
 *
 *   - **Jeder** Eintrag muß auf der Platte etwas treffen. Eine Ausnahme, die
 *     nichts mehr trifft, ist keine Vorsorge, sondern eine offene Tür, an die
 *     sich niemand erinnert.
 *   - Die Summe „Routen + Rand + Einstiege + Anwendungsfälle" muß die Zahl der
 *     gelesenen Dateien **genau** ergeben. Die vier Mengen werden dafür
 *     unabhängig voneinander gebildet; überschnitten sie sich, wäre die Summe
 *     zu groß und der Lauf rot.
 *
 * ===========================================================================
 * Die Reichweite der Marken — was gefangen wird und was nicht (A-A-55, E-101)
 * ===========================================================================
 *
 * T-266-2 hat den zweiten Weg gemessen: `await import('hono')` statt `import`,
 * und `ctx` statt `c`. Beide Marken der ersten Fassung gingen daneben. Sie sind
 * hier verbreitert, und die Grenze der Verbreiterung gehört ausgeschrieben,
 * sonst verspricht dieser Kopfabsatz mehr, als der Lauf hält.
 *
 * **Drei Marken, in dieser Reihenfolge der Tragfähigkeit:**
 *
 * 1. **Die Bindung an `hono`** (`HONO_BINDUNGEN`). Sie trägt am meisten, weil
 *    sie an der **Sache** hängt und nicht an einer Schreibweise: Ohne `hono` zu
 *    beziehen, kann ein Modul keine Anfrage entgegennehmen. Gefangen sind alle
 *    fünf Wege, ein Modul zu beziehen — statische Einfuhr, Wiederausfuhr,
 *    Nebenwirkungseinfuhr, **dynamische Einfuhr** und `require`, jeweils mit
 *    beliebigem Untermodul und in einfachen, doppelten oder schrägen
 *    Anführungszeichen. Bezeichnernamen spielen dabei keine Rolle.
 *
 * 2. **Der Weg über den eigenen Rand** (Abschnitt 1b). Hono kann einen
 *    Anwendungsfall auch **mittelbar** erreichen: über eine Wiederausfuhr aus
 *    `src/http/` oder aus einer Routendatei. Deshalb wird zusätzlich die
 *    **Abhängigkeitsrichtung** geprüft — kein Anwendungsfall führt aus
 *    `src/http/` oder aus einer Routendatei ein. Auch das hängt an keinem
 *    Bezeichner, sondern an der Kante zwischen zwei Schichten, und es ist die
 *    Marke, die den Umweg schließt, den Marke 1 offenließe.
 *
 * 3. **Die eingehenden Marken** (`EINGEHENDE_MARKEN`) — das Sicherheitsnetz.
 *    Sie hängen als einzige an Schreibweisen, und deshalb steht ihre Grenze
 *    hier: Gefangen sind `HTTPException` (hono ist die einzige Quelle dieses
 *    Namens) sowie ein Aufruf der hono-Antwortseite auf einem Zusammenhang, der
 *    `c` oder `ctx` heißt — die beiden Namen, die die hono-Doku und dieser
 *    Bestand verwenden.
 *
 * **Ausdrücklich nicht gefangen**, und das ist keine Nachlässigkeit, sondern
 * die ehrliche Grenze dieser dritten Marke:
 *
 *   - ein frei gewählter Name für den Zusammenhang (`const k = ctx; k.json(…)`);
 *   - `Response` als Marke. Sie ist in T-257 begründet gefallen und bleibt
 *     gefallen: `Response` ist global und nicht an hono gebunden; sie zu prüfen
 *     hieße, jede **ausgehende** Verbindung als eingehende zu zählen —
 *     `features/version/source.ts` liest so die Antwort von GitHub (E-001,
 *     A-18.2). `Context<` ist dagegen **nicht** verloren: Hono ist die einzige
 *     Quelle dieses Typs, wer ihn nennt, muß ihn einführen, und das fängt
 *     Marke 1 vollständig;
 *   - der Eingang an hono vorbei, also unmittelbar über `node:http`. Das ist
 *     eine andere Anforderung — `src/taskpane/server.ts` tut es rechtmäßig für
 *     Port 17844 —, und sie gehört `proof:route-policy`, nicht hierher.
 *
 * Zusammengefaßt trägt dieser Lauf gegen **Irrtum und Bequemlichkeit**: gegen
 * den Umzug, der eine Datei aus der Messung trägt, gegen den Anwendungsfall,
 * der sich schnell eine Antwort selbst schreibt, gegen die dynamische Einfuhr,
 * die die statische umgeht. Er trägt **nicht** gegen Absicht mit Schreibrecht —
 * wer diese Datei ändern kann, kann jeden Wächter abstellen. Das ist dieselbe
 * Grenze, die der security-checker in T-247 für seine eigenen Läufe gezogen
 * hat, und sie steht hier, damit niemand aus einem grünen Lauf mehr liest, als
 * darin steht.
 *
 * ===========================================================================
 * Was gemessen wird, und in beide Richtungen (E-103)
 * ===========================================================================
 *
 *   1  Kein Anwendungsfall bezieht `hono`, führt aus dem eingehenden Rand ein
 *      oder nennt eine Marke der eingehenden Seite.  — die Zusage selbst
 *   2  Jede Routendatei bezieht `hono` **wirklich**.  — die Gegenrichtung:
 *      eine Ausnahme, die nichts mehr trifft, ist keine Vorsorge, sondern eine
 *      offene Tür, an die sich niemand erinnert
 *   3  Keine Routendatei öffnet eine Transaktionsklammer oder bindet
 *      `@takt/storage` ein.  — dieselbe Grenze von der anderen Seite
 *   4  Jeder Merkmalsordner führt `routes.ts` **und** eine nach ihm benannte
 *      Datei.  — an Ordner und Dateinamen erkennen, wo etwas liegt
 *   5  Die Ausnahmeliste gegen die Wirklichkeit (E-103): jeder Eintrag trifft
 *      etwas, und die vier Mengen decken den Baum lückenlos und
 *      überschneidungsfrei
 *   6  Gegenproben: jede Prüfung wird rot, wenn man den Verstoß einsetzt —
 *      einschließlich der **zwei in T-266 gefahrenen Aushebelungen**, jede
 *      einzeln, und jede muß den Weg **nennen**, nicht bloß rot werden
 *
 * `src/routes/addin/**` steht mit in der Menge. Es liegt in fremder
 * Dateihoheit, und gerade deshalb: Eine Grenze, die nur für die eigenen Dateien
 * gilt, ist keine Grenze des Dienstes.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';

import { paketVerzeichnis, quellbaum, scheitern } from './source-resolve.mjs';

const WURZEL = join(paketVerzeichnis('@takt/local-api'), 'src');

/**
 * Der ganze Quellbaum des Dienstes, mit Untergrenze.
 *
 * Die Zahl ist keine Formalie: Ein leerer Baum ließe jede Aussage dieses Laufs
 * wahr werden („kein Anwendungsfall bindet `hono` ein" — es gibt ja keinen).
 * Sie steht bewußt unter dem heutigen Stand, damit sie beim nächsten Umzug
 * nicht aus Buchhaltungsgründen nachgezogen werden muß.
 */
const DATEIEN = quellbaum('@takt/local-api', 'src', { mindestens: 40, endungen: new Set(['.ts']) });

/** Wie eine Datei in der Ausgabe heißt: immer mit `/`, immer ab `src/`. */
const name = (pfad) => `src/${relative(WURZEL, pfad).split(sep).join('/')}`;

// ---------------------------------------------------------------------------
// Die Ausnahmen — der eingehende Adapter, der HTTP kennen **darf**
// ---------------------------------------------------------------------------

/**
 * Randordner: hier ist HTTP nicht der Verstoß, sondern die Aufgabe.
 *
 * `architektur.md` 1.2 nennt sie ausdrücklich. Jeder Eintrag wird in
 * Abschnitt 5 gegen die Platte gehalten — ein Ordner, den es nicht mehr gibt,
 * macht den Lauf rot, statt still eine Ausnahme offenzuhalten, die niemand mehr
 * begründen kann (E-101, E-103).
 */
const RANDORDNER = [
  'src/access/', // Prüfschicht: Token, Drosselung, Herkunft, Pfadregel
  'src/http/', // die hono-Hilfen: Wächter, Eingabe, Fehlerhülle
  'src/taskpane/', // der zweite Port 17844, eigener HTTPS-Server (E-046)
];

/**
 * Einstiegsdateien: der eingehende Adapter selbst und was ihn zusammensetzt.
 *
 * Ausgeschrieben statt über ein Muster gebildet („alles unmittelbar unter
 * `src/`"), und das ist der Unterschied zur alten Fassung: Ein Muster hätte
 * `context.ts`, `pool-movement.ts` und `tag-names.ts` wieder mit
 * herausgenommen, also genau die drei Dateien, deren Herausfallen T-266
 * gefunden hat. Wer hier etwas einträgt, nimmt eine Datei aus der Messung, und
 * dieser Eintrag ist zu lesen und zu begründen.
 */
const EINSTIEGSDATEIEN = [
  'src/app.ts', // der hono-Aufbau des Dienstes
  'src/composition.ts', // Verdrahtung: Ports auf Adapter
  'src/config.ts', // Ports, Grenzen, Pfade
  'src/errors.ts', // Fehlerabbildung an die Hülle
  'src/index.ts', // öffentliche Fläche des Pakets
  'src/logger.ts', // Protokoll, mit Schwärzung
  'src/main.ts', // Prozeßeinstieg, `@hono/node-server`
  'src/runtime.ts', // Laufzeitzustand des Prozesses
  'src/startup.ts', // Hochlauf: Migration, Token, Zertifikat
];

/**
 * Eine Routendatei — nach ihrem **Ort**, nicht nach ihrem Inhalt.
 *
 * Das ist Absicht: Die Menge wird aus der Konvention gebildet und danach gegen
 * den Inhalt gehalten. Würde sie aus dem Inhalt gebildet („alles, was `hono`
 * einbindet"), wäre Abschnitt 1 tautologisch grün — dieselbe Falle wie in
 * T-247-7, wo beide Seiten aus derselben Quelle kamen und `0 === 0` grün war.
 *
 * Drei Formen, und die dritte ist keine Ausnahme, sondern ein Vorgriff:
 *
 *   `src/features/<merkmal>/routes.ts`  die Form seit T-257 — alle acht
 *   `src/routes/<merkmal>.ts`           die Form davor; seit Welle 3 leer.
 *                                       Die Zeile bleibt, weil sie den
 *                                       Rückfall benennt, nicht den Bestand
 *   `src/routes/addin/index.ts`         die eine Tür des Add-ins
 *
 * `src/routes/addin/` ist der Ordner, in dem Tür, Schemata, Ports und
 * Anwendungsfälle schon vor T-257 beieinander lagen — nur `index.ts` ist dort
 * die Tür. `service.ts` daneben ist ein Anwendungsfall und öffnet
 * Transaktionsklammern; das ist richtig und darf Abschnitt 3 nicht rot machen.
 */
const istRouteName = (n) => {
  if (n.startsWith('src/features/')) return n.endsWith('/routes.ts');
  if (!n.startsWith('src/routes/')) return false;
  return n.split('/').length === 3 || n === 'src/routes/addin/index.ts';
};

const istRandName = (n) => RANDORDNER.some((ort) => n.startsWith(ort));
const istEinstiegName = (n) => EINSTIEGSDATEIEN.includes(n);

/**
 * Die Einordnung einer Datei — **eine** Stelle, vier Antworten, keine Ritze.
 *
 * Der Rückfall am Ende ist der Kern des Umbaus aus T-268: Was nicht
 * ausdrücklich Rand ist, ist Anwendungsfall. Eine neue oder verschobene Datei
 * landet damit ohne Zutun **in** der Messung.
 */
const einordnen = (n) => {
  if (istRouteName(n)) return 'route';
  if (istRandName(n)) return 'rand';
  if (istEinstiegName(n)) return 'einstieg';
  return 'anwendungsfall';
};

const routen = DATEIEN.filter((p) => istRouteName(name(p)));
const rand = DATEIEN.filter((p) => istRandName(name(p)));
const einstiege = DATEIEN.filter((p) => istEinstiegName(name(p)));
const anwendungsfaelle = DATEIEN.filter((p) => einordnen(name(p)) === 'anwendungsfall');

let passed = 0;
let failed = 0;
const failures = [];

function check(titel, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${titel}`);
  } else {
    failed += 1;
    failures.push(titel);
    console.log(`  FEHL  ${titel}${detail === '' ? '' : ` — ${detail}`}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

// ---------------------------------------------------------------------------
// Die Marken (Reichweite im Kopfabsatz, A-A-55)
// ---------------------------------------------------------------------------

/** `hono`, `hono/http-exception`, `@hono/node-server` — mit beliebigem Untermodul. */
const HONO_MODUL = String.raw`@?hono(?:\/[^'"\`]*)?`;

/**
 * Die fünf Wege, ein Modul zu beziehen. Jeder trägt seinen **Namen** mit, damit
 * ein roter Lauf den Weg nennt und nicht bloß die Datei.
 */
const HONO_BINDUNGEN = [
  {
    weg: "statische Einfuhr `from 'hono…'`",
    marke: new RegExp(String.raw`from\s*['"\`]${HONO_MODUL}['"\`]`),
  },
  {
    weg: "Wiederausfuhr `export … from 'hono…'`",
    marke: new RegExp(String.raw`export\s[^;]*\sfrom\s*['"\`]${HONO_MODUL}['"\`]`),
  },
  {
    weg: "Nebenwirkungseinfuhr `import 'hono…'`",
    marke: new RegExp(String.raw`import\s*['"\`]${HONO_MODUL}['"\`]`),
  },
  {
    weg: "dynamische Einfuhr `import('hono…')`",
    marke: new RegExp(String.raw`import\s*\(\s*['"\`]${HONO_MODUL}['"\`]`),
  },
  {
    weg: "`require('hono…')`",
    marke: new RegExp(String.raw`require\s*\(\s*['"\`]${HONO_MODUL}['"\`]`),
  },
];

/** Marken der **eingehenden** Seite. Ihre Grenze steht im Kopfabsatz. */
const EINGEHENDE_MARKEN = [
  { weg: '`HTTPException`', marke: /\bHTTPException\b/ },
  {
    weg: 'Aufruf der hono-Antwortseite auf `c` oder `ctx`',
    marke: /\b(?:c|ctx)\.(?:json|req|text|html|redirect|newResponse|notFound)\b/,
  },
];

/** Bezieht dieser Text `hono` — auf irgendeinem der fünf Wege? */
const bindetHono = (text) => HONO_BINDUNGEN.some(({ marke }) => marke.test(text));

/** Bindet dieser Text ein bestimmtes Modul ein? (Für `@takt/storage` in Abschnitt 3.) */
const bindetEin = (text, modul) => new RegExp(`from '${modul}(/[^']*)?'`).test(text);

/**
 * Alle **örtlichen** Einfuhrziele einer Datei, aufgelöst auf `src/…`-Namen.
 *
 * Fremde Pakete fallen heraus (sie beginnen nicht mit `.`); sie sind Sache von
 * Marke 1. Was bleibt, ist die Kante zwischen zwei Schichten dieses Dienstes.
 */
const EINFUHRZIEL = /(?:from|import|require)\s*\(?\s*['"`](\.[^'"`]*)['"`]/g;

function oertlicheZiele(vonName, text) {
  const ziele = [];
  for (const treffer of text.matchAll(EINFUHRZIEL)) {
    ziele.push(posix.normalize(posix.join(posix.dirname(vonName), treffer[1])));
  }
  return ziele;
}

/**
 * Der mittelbare Weg, **gemessen statt vermutet** (T-268, zweiter Anlauf).
 *
 * Die erste Fassung dieser Marke fragte: „führt ein Anwendungsfall aus
 * `src/http/` oder aus einer Routendatei ein?" Sie wurde beim ersten Lauf rot,
 * und der Befund war ein **Fehlalarm** — und zwar aus genau dem Grund, gegen
 * den dieser ganze Auftrag geschrieben ist: Sie war wieder an einem
 * **Ordnerpräfix** aufgespannt, eine Ebene tiefer als vorher.
 *
 * `src/routes/addin/schema.ts` führt aus `src/http/input.ts` ein. Das sieht wie
 * ein Schichtbruch aus und ist keiner: `input.ts` ist ein Bündel
 * zod-Schemata — `idSchema`, `titleSchema`, `attachmentUrlSchema` — und
 * **bezieht `hono` nicht**. Es liegt unter `src/http/`, weil es dort einmal
 * hingelegt wurde, nicht weil es HTTP kennt. Ein Wächter, der es trotzdem rot
 * macht, zwingt beim nächsten Mal zu einer Ausnahmeliste, und die Ausnahme
 * wäre dann größer als die Regel.
 *
 * Die Zusage lautet nicht „ein Anwendungsfall führt nicht aus diesem Ordner
 * ein". Sie lautet: **hono erreicht keinen Anwendungsfall.** Also wird genau
 * das gerechnet — die Menge der örtlichen Module, von denen aus `hono`
 * erreichbar ist, als **Hülle über den Einfuhrkanten** des Baums. Sie kommt aus
 * dem Inhalt der Dateien und nicht aus ihren Orten; ein Umzug bewegt sie nicht,
 * und eine Umbenennung von `src/http/` in `src/eingang/` auch nicht.
 */
const oertlichAufloesen = (ziel) => {
  if (inhalt.has(ziel)) return ziel;
  const alsTs = ziel.replace(/\.js$/, '.ts');
  if (inhalt.has(alsTs)) return alsTs;
  if (inhalt.has(`${ziel}.ts`)) return `${ziel}.ts`;
  if (inhalt.has(`${ziel}/index.ts`)) return `${ziel}/index.ts`;
  return null;
};

/**
 * Der Prüfsatz aus Abschnitt 1, als **eine** Funktion — damit die Gegenproben
 * in Abschnitt 6 dieselbe Logik fahren wie der Ernstfall und nicht eine
 * nachgebaute. Genau diese Trennung war der Fehler in T-247-7.
 *
 * Liefert je Verstoß `{ datei, weg }`.
 */
/**
 * Die Hülle: von welchen Modulen dieses Baums aus ist `hono` erreichbar?
 *
 * Wird bei **jedem** Aufruf neu gerechnet und nie zwischengespeichert — die
 * Gegenproben in Abschnitt 6 setzen einen Verstoß in eine gedachte Fassung des
 * Baums ein, und die Hülle muß sich dann mitbewegen. Ein Zwischenspeicher wäre
 * hier genau der Fehler, den T-247-7 gemacht hat: zwei Seiten aus einer Quelle.
 *
 * Liefert für jedes erreichende Modul den **Weg** dorthin, damit ein roter Lauf
 * die Kette nennen kann und nicht bloß einen Namen.
 */
function honoHuelle(inhaltVon) {
  const weg = new Map();
  for (const n of alleNamen) {
    const treffer = HONO_BINDUNGEN.find(({ marke }) => marke.test(inhaltVon(n)));
    if (treffer !== undefined) weg.set(n, [n]);
  }
  let gewachsen = true;
  while (gewachsen) {
    gewachsen = false;
    for (const n of alleNamen) {
      if (weg.has(n)) continue;
      for (const ziel of oertlicheZiele(n, inhaltVon(n))) {
        const aufgeloest = oertlichAufloesen(ziel);
        if (aufgeloest !== null && weg.has(aufgeloest)) {
          weg.set(n, [n, ...weg.get(aufgeloest)]);
          gewachsen = true;
          break;
        }
      }
    }
  }
  return weg;
}

/**
 * Der Prüfsatz aus Abschnitt 1, als **eine** Funktion — damit die Gegenproben
 * in Abschnitt 6 dieselbe Logik fahren wie der Ernstfall und nicht eine
 * nachgebaute. Genau diese Trennung war der Fehler in T-247-7.
 *
 * Liefert je Verstoß `{ datei, weg }`.
 */
function httpVerstoesse(menge, inhaltVon) {
  const gefunden = [];
  const huelle = honoHuelle(inhaltVon);
  for (const n of menge) {
    const text = inhaltVon(n);
    for (const { weg, marke } of HONO_BINDUNGEN) {
      if (marke.test(text)) gefunden.push({ datei: n, weg });
    }
    for (const ziel of oertlicheZiele(n, text)) {
      const aufgeloest = oertlichAufloesen(ziel);
      if (aufgeloest === null || !huelle.has(aufgeloest)) continue;
      gefunden.push({
        datei: n,
        weg: `hono erreicht die Datei über \`${[n, ...huelle.get(aufgeloest)].join('` → `')}\``,
      });
    }
    for (const { weg, marke } of EINGEHENDE_MARKEN) {
      if (marke.test(text)) gefunden.push({ datei: n, weg });
    }
  }
  return gefunden;
}

const zeigen = (verstoesse) => verstoesse.map(({ datei, weg }) => `${datei}: ${weg}`).join('; ');

const alsNamen = (pfade) => pfade.map(name);

const inhalt = new Map(DATEIEN.map((pfad) => [name(pfad), readFileSync(pfad, 'utf8')]));
const inhaltVon = (n) => inhalt.get(n) ?? '';

if (anwendungsfaelle.length < 5 || routen.length < 5) {
  scheitern(
    'Die Mengen dieses Laufs bilden',
    `${anwendungsfaelle.length} Anwendungsfall/-fälle und ${routen.length} Routendatei(en) gefunden.`,
    'Eine leere oder fast leere Menge ließe jede Aussage dieses Laufs wahr werden.',
  );
}

const alleNamen = alsNamen(DATEIEN);
const anwendungsfallNamen = alsNamen(anwendungsfaelle);

/**
 * Die Anwendungsfälle **außerhalb** der zwei Ordnerpräfixe, an denen die alte
 * Fassung ihre Menge aufspannte. Sie sind der gemessene Zugewinn aus T-268 —
 * und die Zielscheibe der ersten Gegenprobe in Abschnitt 6.
 */
const ausserhalbDerAltenMenge = anwendungsfallNamen.filter(
  (n) => !n.startsWith('src/features/') && !n.startsWith('src/routes/'),
);

console.log(
  `Gemessen: ${DATEIEN.length} Quelldatei(en) — ${routen.length} Routendatei(en), ` +
    `${rand.length} Randdatei(en), ${einstiege.length} Einstiegsdatei(en), ` +
    `${anwendungsfaelle.length} Anwendungsfall/-fälle.`,
);
console.log(
  `Davon fielen ${ausserhalbDerAltenMenge.length} Anwendungsfall/-fälle aus der Menge, die ` +
    `dieser Lauf vor T-268 gemessen hat: ${ausserhalbDerAltenMenge.join(', ') || '—'}`,
);

// ---------------------------------------------------------------------------
section('1  Kein Anwendungsfall kennt HTTP');
// ---------------------------------------------------------------------------
{
  const mitHono = anwendungsfallNamen.flatMap((n) =>
    HONO_BINDUNGEN.filter(({ marke }) => marke.test(inhaltVon(n))).map(({ weg }) => ({ datei: n, weg })),
  );
  check(
    `keiner der ${anwendungsfaelle.length} Anwendungsfälle bezieht \`hono\` — auf keinem der ${HONO_BINDUNGEN.length} Wege`,
    mitHono.length === 0,
    zeigen(mitHono),
  );

  /*
   * Der mittelbare Weg. Die Hülle wird aus dem **Inhalt** des Baums gerechnet,
   * nicht aus Ordnernamen — Begründung an `oertlichAufloesen`. Der rote Text
   * nennt die ganze Kette, damit man nicht raten muß, worüber hono ankommt.
   */
  const huelle = honoHuelle(inhaltVon);
  const ueberDenRand = anwendungsfallNamen.flatMap((n) =>
    oertlicheZiele(n, inhaltVon(n))
      .map(oertlichAufloesen)
      .filter((ziel) => ziel !== null && huelle.has(ziel))
      .map((ziel) => ({ datei: n, weg: `über \`${[n, ...huelle.get(ziel)].join('` → `')}\`` })),
  );
  check(
    `keiner der ${anwendungsfaelle.length} erreicht \`hono\` über eine Kette örtlicher Einfuhren ` +
      `(${huelle.size} von ${DATEIEN.length} Modulen erreichen es)`,
    ueberDenRand.length === 0,
    zeigen(ueberDenRand),
  );

  /*
   * Ein Einfuhrziel, das sich nicht auflösen läßt, ist ein Loch in der Hülle:
   * Über ein Modul, das dieser Lauf nicht findet, kann er auch nichts sagen.
   * Deshalb wird es rot und nicht still übergangen.
   */
  const unaufloesbar = anwendungsfallNamen.flatMap((n) =>
    oertlicheZiele(n, inhaltVon(n))
      .filter((ziel) => oertlichAufloesen(ziel) === null)
      .map((ziel) => ({ datei: n, weg: `Einfuhrziel \`${ziel}\` nicht auflösbar` })),
  );
  check(
    'jedes örtliche Einfuhrziel eines Anwendungsfalls ist auflösbar',
    unaufloesbar.length === 0,
    zeigen(unaufloesbar),
  );

  const mitAntwort = anwendungsfallNamen.flatMap((n) =>
    EINGEHENDE_MARKEN.filter(({ marke }) => marke.test(inhaltVon(n))).map(({ weg }) => ({ datei: n, weg })),
  );
  check(
    'keiner nennt `HTTPException` oder ruft die Antwortseite auf `c`/`ctx`',
    mitAntwort.length === 0,
    zeigen(mitAntwort),
  );
}

// ---------------------------------------------------------------------------
section('2  Gegenrichtung: die Ausnahme trifft noch etwas (E-103 Punkt 2)');
// ---------------------------------------------------------------------------
{
  const ohneHono = alsNamen(routen).filter((n) => !bindetHono(inhaltVon(n)));
  check(
    `jede der ${routen.length} Routendateien bezieht \`hono\` wirklich`,
    ohneHono.length === 0,
    ohneHono.join(', '),
  );
}

// ---------------------------------------------------------------------------
section('3  Keine Route öffnet eine Transaktionsklammer');
// ---------------------------------------------------------------------------
{
  const mitKlammer = alsNamen(routen).filter((n) => inhaltVon(n).includes('inTransaction('));
  check('keine Routendatei ruft `inTransaction(`', mitKlammer.length === 0, mitKlammer.join(', '));

  const mitSpeicherung = alsNamen(routen).filter((n) => bindetEin(inhaltVon(n), '@takt/storage'));
  check('keine Routendatei bindet `@takt/storage` ein', mitSpeicherung.length === 0, mitSpeicherung.join(', '));
}

// ---------------------------------------------------------------------------
section('4  Jeder Merkmalsordner ist an seinen Dateinamen zu erkennen');
// ---------------------------------------------------------------------------

/**
 * Der Prüfsatz als Funktion — damit die Gegenprobe in Abschnitt 6 **ihn** mißt
 * und nicht `Array#includes` (T-266-11).
 */
const merkmalIstVollstaendig = (merkmal, dateien) =>
  dateien.includes('routes.ts') && dateien.includes(`${merkmal}.ts`);

const merkmale = readdirSync(join(WURZEL, 'features'), { withFileTypes: true })
  .filter((eintrag) => eintrag.isDirectory())
  .map((eintrag) => eintrag.name)
  .sort();

{
  check('es gibt überhaupt Merkmalsordner', merkmale.length > 0, String(merkmale.length));

  for (const merkmal of merkmale) {
    const dateien = readdirSync(join(WURZEL, 'features', merkmal));
    check(
      `features/${merkmal}: \`routes.ts\` und \`${merkmal}.ts\` liegen beide da`,
      merkmalIstVollstaendig(merkmal, dateien),
      dateien.join(', '),
    );
  }
}

// ---------------------------------------------------------------------------
section('5  Die Ausnahmeliste gegen die Wirklichkeit (E-103, A-A-75)');
// ---------------------------------------------------------------------------

/** Welche Einträge der Ausnahmelisten treffen heute **nichts**? */
function toteAusnahmen(randordner, einstiegsdateien, namen) {
  return [
    ...randordner.filter((ort) => !namen.some((n) => n.startsWith(ort))).map((ort) => `Randordner \`${ort}\``),
    ...einstiegsdateien.filter((datei) => !namen.includes(datei)).map((datei) => `Einstiegsdatei \`${datei}\``),
  ];
}

{
  const tot = toteAusnahmen(RANDORDNER, EINSTIEGSDATEIEN, alleNamen);
  check(
    `alle ${RANDORDNER.length + EINSTIEGSDATEIEN.length} Ausnahmeeinträge treffen etwas auf der Platte`,
    tot.length === 0,
    tot.join(', '),
  );

  /*
   * Die Summenprobe. Sie ist **nicht** tautologisch: Die vier Mengen werden
   * oben unabhängig voneinander gebildet — `routen`, `rand` und `einstiege`
   * jede aus ihrem eigenen Prädikat, `anwendungsfaelle` als Ergänzung über
   * `einordnen`. Überschnitten sich zwei davon (etwa weil jemand `src/app.ts`
   * zusätzlich unter die Randordner schriebe), wäre die Summe **größer** als
   * die Zahl der gelesenen Dateien und der Lauf rot. Das ist die Probe darauf,
   * daß keine Datei doppelt zählt und keine durch eine Ritze fällt.
   */
  const summe = routen.length + rand.length + einstiege.length + anwendungsfaelle.length;
  check(
    `Routen + Rand + Einstiege + Anwendungsfälle ergeben genau die ${DATEIEN.length} gelesenen Dateien`,
    summe === DATEIEN.length,
    `${routen.length} + ${rand.length} + ${einstiege.length} + ${anwendungsfaelle.length} = ${summe}`,
  );

  const doppelt = EINSTIEGSDATEIEN.filter((datei) => istRandName(datei) || istRouteName(datei));
  check('keine Einstiegsdatei ist zugleich Rand oder Route', doppelt.length === 0, doppelt.join(', '));
}

// ---------------------------------------------------------------------------
section('6  Gegenproben — jede eingesetzte Verletzung muß auffallen');
// ---------------------------------------------------------------------------
{
  /**
   * Eine Fassung des Baums mit **einer** veränderten Datei. Die Gegenprobe
   * fährt danach `httpVerstoesse` — dieselbe Funktion wie Abschnitt 1, nicht
   * eine nachgebaute.
   */
  const mitAnhang = (ziel, anhang) => (n) => (n === ziel ? `${inhaltVon(n)}\n${anhang}` : inhaltVon(n));

  const nennt = (verstoesse, datei, wortlaut) =>
    verstoesse.some((v) => v.datei === datei && v.weg.includes(wortlaut));

  /*
   * ---------------------------------------------------------------------
   * Aushebelung 1 aus T-266 (Bedrohungsmodell 35.2.2), zeichengleich.
   *
   * Sie hat den Lauf vor T-268 bei 20/0 gelassen, weil `src/pool-movement.ts`
   * unter keinem der zwei gemessenen Ordnerpräfixe lag. Das Ziel wird hier
   * **nicht** namentlich hinterlegt, sondern aus der Menge gezogen: die erste
   * Datei außerhalb der alten Präfixe. Ein Name an dieser Stelle wäre wieder
   * eine Zusage an einen Ort — genau der Fehler, den diese Gegenprobe mißt.
   * ---------------------------------------------------------------------
   */
  const zielAussen = ausserhalbDerAltenMenge[0] ?? anwendungsfallNamen[0];
  const weg1 = httpVerstoesse(
    anwendungsfallNamen,
    mitAnhang(
      zielAussen,
      [
        "import { Hono } from 'hono';",
        "import { HTTPException } from 'hono/http-exception';",
        "export const leck = new Hono().get('/x', (c) => c.json({ ok: true }));",
      ].join('\n'),
    ),
  );
  check(
    `Gegenprobe T-266 Weg 1: ein Hono-Router in \`${zielAussen}\` fällt auf`,
    weg1.length > 0,
    'die Menge wäre wieder an der Struktur aufgespannt',
  );
  check(
    'Gegenprobe T-266 Weg 1: der Lauf nennt Datei und Weg, nicht bloß eine Zahl',
    nennt(weg1, zielAussen, 'statische Einfuhr') && nennt(weg1, zielAussen, 'HTTPException'),
    zeigen(weg1),
  );

  /*
   * ---------------------------------------------------------------------
   * Aushebelung 2 aus T-266 (Bedrohungsmodell 35.2.3), zeichengleich.
   *
   * Sie lag **innerhalb** der gemessenen Menge und ging trotzdem an beiden
   * Marken vorbei: `bindetEin` fragte nach `from 'hono…'` — eine dynamische
   * Einfuhr trägt kein `from` —, und die zweite Marke fragte nach `c.json(`,
   * während der Zusammenhang hier `ctx` heißt. Beides ist jetzt gefaßt; die
   * Grenze der Fassung steht im Kopfabsatz.
   * ---------------------------------------------------------------------
   */
  const zielInnen = anwendungsfallNamen.find((n) => n.startsWith('src/features/')) ?? anwendungsfallNamen[0];
  const weg2 = httpVerstoesse(
    anwendungsfallNamen,
    mitAnhang(
      zielInnen,
      [
        "const { Hono } = await import('hono');",
        "export const leck2 = new Hono().get('/y', (ctx) => ctx.json({ ok: true }));",
      ].join('\n'),
    ),
  );
  check(
    `Gegenprobe T-266 Weg 2: eine dynamische Einfuhr in \`${zielInnen}\` fällt auf`,
    weg2.length > 0,
    'die Marke hinge wieder allein an einer Schreibweise',
  );
  check(
    'Gegenprobe T-266 Weg 2: der Lauf nennt die dynamische Einfuhr **und** das `ctx`',
    nennt(weg2, zielInnen, 'dynamische Einfuhr') && nennt(weg2, zielInnen, '`c` oder `ctx`'),
    zeigen(weg2),
  );

  /* Der mittelbare Weg: hono über eine Einfuhr aus dem eigenen Rand. */
  const weg3 = httpVerstoesse(anwendungsfallNamen, mitAnhang(zielInnen, "import { data } from '../../http/problem.ts';"));
  check(
    'Gegenprobe: eine Einfuhr aus `src/http/` in einem Anwendungsfall fällt auf',
    nennt(weg3, zielInnen, 'src/http/problem.ts'),
    zeigen(weg3),
  );

  /* Der unveränderte Baum bleibt still — sonst mißt keine der Gegenproben etwas. */
  check(
    'Gegenprobe: der unveränderte Baum bleibt still',
    httpVerstoesse(anwendungsfallNamen, inhaltVon).length === 0,
  );

  /*
   * Die Ausnahmeliste, in beide Richtungen — mit der echten Funktion.
   */
  check(
    'Gegenprobe: ein Randordner, den es nicht gibt, wird als tote Ausnahme gefunden',
    toteAusnahmen([...RANDORDNER, 'src/gibt-es-nicht/'], EINSTIEGSDATEIEN, alleNamen).length === 1,
  );
  check(
    'Gegenprobe: eine Einstiegsdatei, die es nicht gibt, wird als tote Ausnahme gefunden',
    toteAusnahmen(RANDORDNER, [...EINSTIEGSDATEIEN, 'src/gibt-es-nicht.ts'], alleNamen).length === 1,
  );

  /*
   * Die Kernaussage des Umbaus, als Gegenprobe: **Eine neue Datei landet in der
   * Messung, gleich wo sie liegt.** Drei erfundene Orte, keiner davon in einem
   * heutigen Ordner — jeder muß als Anwendungsfall eingeordnet werden.
   */
  for (const erfunden of ['src/neuer-anwendungsfall.ts', 'src/domain-nah/regel.ts', 'src/x/y/z/tief.ts']) {
    check(
      `Gegenprobe: \`${erfunden}\` fiele in die gemessene Menge`,
      einordnen(erfunden) === 'anwendungsfall',
      einordnen(erfunden),
    );
  }

  /* Abschnitt 2 und 3, an einer echten Routendatei. */
  const beispielRoute = alsNamen(routen)[0];
  check(
    'Gegenprobe: eine Routendatei ohne `hono` wird gefunden',
    !bindetHono(inhaltVon(beispielRoute).split("from 'hono").join("from 'nicht-hono")),
  );
  check(
    'Gegenprobe: `inTransaction(` in einer Routendatei wird gefunden',
    `${inhaltVon(beispielRoute)}\ncontext.transactions.inTransaction(x);`.includes('inTransaction('),
  );
  check(
    'Gegenprobe: `@takt/storage` in einer Routendatei wird gefunden',
    bindetEin(`${inhaltVon(beispielRoute)}\nimport type { UnitOfWork } from '@takt/storage';`, '@takt/storage'),
  );

  /*
   * T-266-11: Die alte Gegenprobe an dieser Stelle lautete
   *   !['routes.ts', 'anderes.ts'].includes('board.ts')
   * und maß damit `Array#includes`, nicht den Prüfsatz aus Abschnitt 4. Jetzt
   * fährt sie `merkmalIstVollstaendig` — dieselbe Funktion wie oben — an einem
   * echten Merkmalsnamen, in beide Richtungen.
   */
  const beispielMerkmal = merkmale[0];
  check(
    `Gegenprobe: ein fehlender \`${beispielMerkmal}.ts\` wird vom Prüfsatz aus Abschnitt 4 gefunden`,
    !merkmalIstVollstaendig(beispielMerkmal, ['routes.ts', 'anderes.ts']),
  );
  check(
    'Gegenprobe: eine fehlende `routes.ts` wird vom selben Prüfsatz gefunden',
    !merkmalIstVollstaendig(beispielMerkmal, [`${beispielMerkmal}.ts`]),
  );
  check(
    'Gegenprobe: der vollständige Ordner wird vom selben Prüfsatz nicht beanstandet',
    merkmalIstVollstaendig(beispielMerkmal, ['routes.ts', `${beispielMerkmal}.ts`]),
  );
}

console.log(`\n${'═'.repeat(58)}`);
console.log(`${passed} bestanden, ${failed} fehlgeschlagen.`);
if (failed > 0) {
  console.log(`Fehlgeschlagen: ${failures.join(', ')}`);
  process.exit(1);
}
