/**
 * Takt — Nachweis, dass kein rohes Steuer- oder Richtungszeichen im
 * versionierten Baum steht (T-112-H2, T-125-6, T-128, E-063).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:codepoints
 *
 * ===========================================================================
 * Warum dieser Lauf existiert
 * ===========================================================================
 *
 * Weil vier Agenten in vier Wellen über dasselbe Zeichen gestolpert sind, und
 * jeder von ihnen wusste, worum es geht:
 *
 *  - **T-112-H2** fand ein rohes `U+0000` in einer Testdatei.
 *  - **T-119** baute die alte Zeichenklasse im Nachweis nach und schrieb dabei
 *    Zeichen ab, statt sie abzufragen.
 *  - **T-125** schrieb die Prüfung, die das Zeichen finden sollte — und hatte
 *    es dabei zweimal selbst in der eigenen Arbeit.
 *  - **T-126** behob den Fund in `packages/storage/src/sqlite/paging.ts` und
 *    setzte das Zeichen dabei **dreimal** wieder ein: einmal in einen
 *    Suchbefehl, zweimal in den Bericht, der die Behebung beschreibt.
 *  - **T-127** hatte es achtzehnmal im ersten Entwurf des eigenen Berichts.
 *
 * Das ist kein Aufmerksamkeitsproblem. Ein unsichtbares Zeichen ist genau das:
 * unsichtbar. Man sieht es nicht beim Schreiben, nicht beim Lesen und nicht im
 * Review — und die Werkzeuge, die es sonst abfangen, greifen nur dort, wo Text
 * über die Befehlszeile läuft. Was zwei Behebungen nicht geschafft haben,
 * schafft nur eine **Messung**.
 *
 * Was ein solches Zeichen anrichtet, ist zweierlei:
 *
 *  1. **Für Git ist die Datei binär.** Ein `U+0000` in den ersten 8000 Bytes,
 *     und `git diff` schreibt „Bin 0 -> 2533 bytes". Die Datei liegt seither
 *     in keinem Review mehr vor — `paging.ts` war zwischen `d9555d0` und T-126
 *     genau in diesem Zustand.
 *  2. **Für den Leser dreht es die Zeile um.** Ein `U+202E` im Quelltext macht
 *     aus einer Zeile eine andere, als der Übersetzer sie liest. Das ist keine
 *     Theorie, sondern die Bauart, gegen die `characters.ts` geschrieben ist —
 *     nur diesmal gegen den Menschen im Review statt gegen den Benutzer.
 *
 * ===========================================================================
 * Woher die Klasse kommt (E-063 Punkt 4)
 * ===========================================================================
 *
 * Aus `@takt/domain`, nicht aus einer Liste in dieser Datei. Genau daran ist
 * T-119 gescheitert: Der Nachweis, der die Doppelung verhindern sollte, hielt
 * gegen eine **abgeschriebene** Liste und blieb grün, als die maßgebliche
 * wuchs. Wer zwei Stellen zusammenhalten will, fragt die maßgebliche ab.
 *
 * Die Klasse dieses Laufs ist nicht dieselbe wie die der Namen, und der
 * Unterschied wird gerechnet statt hingeschrieben:
 *
 * ```
 *   FORBIDDEN_NAME_CHARACTERS        (aus der Domäne gelesen)
 * − GERÜST                           (Tabulator und Zeilenumbruch)
 * + UNSICHTBARE_NACHBARN             (U+200B–U+200D, Bytefolgenmarke)
 * = die Klasse dieses Laufs
 * ```
 *
 * **Warum abgezogen wird.** Ein Tabulator und ein Zeilenumbruch sind das
 * Gerüst einer Textdatei. In einem *Namen* haben sie nichts zu suchen — dort
 * weist die Tür sie ab —, in einer *Datei* sind sie die Datei. Der Wagenrücklauf
 * ist ein Fall für sich, siehe unten.
 *
 * **Warum dazugezählt wird.** `U+200B` bis `U+200D` sind in einem Namen
 * ausdrücklich erlaubt: Das letzte davon hält zusammengesetzte Emoji zusammen,
 * und ein Wächter gegen Richtungszeichen ist keiner gegen Emoji. Im Quelltext
 * ist ein rohes ZWJ trotzdem ein unsichtbares Zeichen zwischen zwei Buchstaben,
 * und es gibt für jedes von ihnen eine Escape-Folge. Die Bytefolgenmarke
 * `U+FEFF` steht in keiner Fassung der Namensklasse und ist der klassische
 * unsichtbare Anfang einer Datei, über die dann jemand eine Stunde rätselt.
 *
 * Dass der Zusatz **kein** Abschreiben ist, wird gemessen: Abschnitt 1 verlangt,
 * dass er sich mit der Domänenklasse nicht überschneidet. Trüge die Domäne eines
 * Tages `U+200B` selbst ein, stünde die Zahl hier ein zweites Mal — und der Lauf
 * wird rot, statt es hinzunehmen.
 *
 * ===========================================================================
 * Der Wagenrücklauf
 * ===========================================================================
 *
 * `U+000D` steht **nicht** im Gerüst. Er ist erlaubt, wenn unmittelbar ein
 * Zeilenumbruch folgt — dann ist er die Hälfte einer Zeilenende-Folge, wie sie
 * ein Windows-Editor schreibt —, und beanstandet, wenn er allein steht. Ein
 * einzelner Wagenrücklauf mitten in einer Zeile ist genau der Fall, um den es
 * hier geht: Er setzt beim Anzeigen den Cursor an den Zeilenanfang zurück und
 * kann alles davor überschreiben.
 *
 * Der Baum trägt heute (T-128) **keinen einzigen** Wagenrücklauf, weder allein
 * noch als Paar. Die Regel ist also heute ohne Wirkung und für den Tag da, an
 * dem jemand auf Windows eine Datei anlegt.
 *
 * ===========================================================================
 * Welche Dateien legitim solche Zeichen tragen dürfen
 * ===========================================================================
 *
 * **Bilddateien und Symbole** — sie sind keine Texte, und ihre Bytes sind keine
 * Codepunkte. Sie stehen unter `BINAERE_ENDUNGEN`. Damit das kein Versteck
 * wird, prüft Abschnitt 3 jede übersprungene Datei nach: Sie **muss** binär
 * sein, also ein Nullbyte in den ersten 8000 tragen. Eine Textdatei mit der
 * Endung `.png` fällt auf, statt durchzurutschen.
 *
 * **Alles andere wird gelesen**, auch eine Endung, die es heute noch nicht gibt.
 * Die Richtung ist mit Absicht so herum: Ein unbekanntes Format wird geprüft und
 * fällt notfalls auf, statt still übersprungen zu werden. Wer ein neues
 * Binärformat einführt, trägt es ein — eine bewusste Zeile statt einer Lücke.
 *
 * **Testdaten und Prüfmuster** dürfen ein solches Zeichen brauchen: eine
 * Beispieldatei mit einem echten Familien-Emoji, ein Muster, das genau die
 * Bytefolgenmarke enthält. Dafür gibt es `AUSNAHMEN` — und zwar so, dass sie
 * kein Schlupfloch sind:
 *
 *  - Eine Ausnahme nennt **den Pfad, den Codepunkt, die Anzahl und den Grund**.
 *    Sie erlaubt nicht „in dieser Datei alles", sondern „in dieser Datei genau
 *    dreimal genau dieses Zeichen, und zwar deshalb".
 *  - Kommt ein Vorkommen dazu oder fällt eines weg, **stimmt die Zahl nicht
 *    mehr und der Lauf wird rot**. Eine Ausnahme ist damit eine Messung und
 *    keine Erlaubnis.
 *  - Eine Ausnahme, die nichts mehr trifft, wird **ebenfalls rot**. So kann die
 *    Liste nicht verrotten und keine Erlaubnis überdauern, deren Grund weg ist.
 *  - Kein Muster, kein Verzeichnis, kein Sternchen. Ein Pfad ist ein Pfad.
 *  - Und ausdrücklich **keine Marke im Quelltext** („guard-ignore"). Eine solche
 *    Marke wäre eine Erlaubnis, die derselbe Griff erteilt, mit dem man den
 *    Fehler macht — und bei einem unsichtbaren Zeichen merkt niemand, dass sie
 *    gesetzt wurde.
 *
 * Die Liste ist heute **leer**. Dass der Mechanismus trotzdem trägt, misst
 * Abschnitt 5 an einem erfundenen Beispiel im Arbeitsspeicher.
 *
 * ===========================================================================
 * Was dieser Lauf **nicht** prüft — die benannten blinden Flecken
 * ===========================================================================
 *
 * **a) Der Tabulator.** Er ist erlaubt, überall. Er ist sichtbar (er rückt ein),
 * er macht keine Datei binär und er dreht keine Zeile um; ein Makefile besteht
 * ohne ihn nicht. Der Baum trägt heute in keiner Textdatei einen einzigen —
 * gemessen, nicht angenommen. Wer ihn eines Tages doch ausschließen will, nimmt
 * ihn aus `GERÜST`, und diese Zeile ist die ganze Änderung.
 *
 * **b) Homoglyphen.** Ein kyrillisches „а" in einem Bezeichner sieht aus wie ein
 * lateinisches und ist keins. Das ist eine andere Klasse — sichtbare Zeichen mit
 * falscher Bedeutung — und braucht eine andere Prüfung als diese.
 *
 * **c) Was Git ausschließt.** Der Lauf fragt `git ls-files` **und**
 * `git ls-files --others --exclude-standard`, sieht also auch die Datei, die
 * gerade erst angelegt und noch nicht eingetragen wurde — das ist der Zustand,
 * in dem der Fehler entsteht. Was in `.gitignore` steht, bleibt draußen:
 * Abhängigkeiten, Bauergebnisse und Testberichte kommen in kein Review.
 *
 * **d) Bilddateien.** Siehe oben; sie werden nur daraufhin geprüft, dass sie
 * wirklich welche sind.
 *
 * ===========================================================================
 * Und der Prüfer prüft sich selbst
 * ===========================================================================
 *
 * Abschnitt 5 setzt jedes der Zeichen in einen erfundenen Text ein — im
 * Arbeitsspeicher, keine Datei wird angefasst — und verlangt, dass genau eine
 * Beanstandung herauskommt; dazu die Umkehrung (ein sauberer Text ergibt
 * nichts), das Gerüst (Tabulator und Zeilenumbruch ergeben nichts), der
 * Wagenrücklauf in beiden Lagen und die drei Regeln der Ausnahmeliste.
 *
 * **Jede Zeichenkette dieses Laufs wird gebaut, keine wird abgeschrieben.**
 * `String.fromCodePoint(...)` statt eines Zeichens zwischen Anführungszeichen —
 * aus dem Grund, an dem T-126 dreimal gescheitert ist: Ein abgeschriebenes
 * unsichtbares Zeichen sieht genauso aus wie keins. Diese Datei enthält deshalb
 * selbst keins und besteht ihren eigenen Lauf.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONTROL_WHITESPACE, FORBIDDEN_NAME_CHARACTERS } from '@takt/domain';

/*
 * Als Pfad und nicht als URL: Ein Dateiname, der ein `#` oder ein Leerzeichen
 * trägt, würde beim Auflösen gegen eine URL verstümmelt. `git ls-files` gibt
 * Pfade heraus, keine Adressen.
 */
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  FEHL  ${name}${detail === '' ? '' : ` — ${detail}`}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

// ---------------------------------------------------------------------------
// Die Klasse
// ---------------------------------------------------------------------------

/**
 * Das Gerüst einer Textdatei: Tabulator und Zeilenumbruch.
 *
 * Zwei Zahlen und keine Abschrift einer Domänenliste — es ist die Definition
 * von „Textdatei" und keine Regel von Takt. Abschnitt 1 verlangt trotzdem, dass
 * beide in `CONTROL_WHITESPACE` stehen: Wäre der Zeilenumbruch dort eines Tages
 * kein Steuer-Leerraum mehr, hieße das, dass sich unter dieser Zeile etwas
 * verschoben hat.
 */
const GERUEST = [0x0009, 0x000a];

/** Der Wagenrücklauf. Erlaubt nur unmittelbar vor einem Zeilenumbruch. */
const WAGENRUECKLAUF = 0x000d;
const ZEILENUMBRUCH = 0x000a;

/**
 * Was in einer **Datei** unsichtbar ist, in einem **Namen** aber erlaubt.
 *
 * Kein Auszug aus der Domänenklasse, sondern der Unterschied zu ihr. Abschnitt 1
 * misst, dass es wirklich einer ist.
 */
const UNSICHTBARE_NACHBARN = [
  { from: 0x200b, to: 0x200d },
  { from: 0xfeff, to: 0xfeff },
];

/**
 * Nur für die Ausgabe. Keine Quelle: Die Klasse entsteht oben, nicht hier, und
 * ein Codepunkt ohne Eintrag bekommt einen allgemeinen Namen statt zu fehlen.
 */
const NAMEN = new Map([
  [0x0000, 'NUL — macht die Datei für Git zur Binärdatei'],
  [0x0007, 'BEL'],
  [0x0008, 'BS'],
  [0x000b, 'VT'],
  [0x000c, 'FF'],
  [0x000d, 'CR — allein stehend'],
  [0x001b, 'ESC — Beginn einer Terminalfolge'],
  [0x007f, 'DEL'],
  [0x061c, 'ALM — arabische Richtungsmarke'],
  [0x200b, 'ZWSP — Leerraum ohne Breite'],
  [0x200c, 'ZWNJ'],
  [0x200d, 'ZWJ — hält zusammengesetzte Emoji zusammen'],
  [0x200e, 'LRM — Richtungsmarke'],
  [0x200f, 'RLM — Richtungsmarke'],
  [0x202a, 'LRE'],
  [0x202b, 'RLE'],
  [0x202c, 'PDF'],
  [0x202d, 'LRO'],
  [0x202e, 'RLO — dreht die Anzeige der Zeile um'],
  [0x2066, 'LRI'],
  [0x2067, 'RLI'],
  [0x2068, 'FSI'],
  [0x2069, 'PDI'],
  [0xfeff, 'BOM — Bytefolgenmarke'],
]);

function inRanges(codePoint, ranges) {
  for (const range of ranges) {
    if (codePoint >= range.from && codePoint <= range.to) return true;
  }
  return false;
}

/** Gehört dieser Codepunkt zur Klasse dieses Laufs? */
function beanstandet(codePoint) {
  if (GERUEST.includes(codePoint)) return false;
  if (inRanges(codePoint, UNSICHTBARE_NACHBARN)) return true;
  return inRanges(codePoint, FORBIDDEN_NAME_CHARACTERS);
}

/** `U+0000` — die Schreibweise, in der ein Fund in der Ausgabe erscheint. */
function alsMarke(codePoint) {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * Ein Textstück für die Ausgabe, in dem jedes beanstandete Zeichen als Marke
 * steht.
 *
 * Dieselbe Begründung wie bei `FORBIDDEN_NAME_CHARACTER_MESSAGE` in der Domäne:
 * Ein Befund, der das gefundene Zeichen wörtlich wiedergibt, richtet in der
 * Ausgabe genau den Schaden an, den er meldet. Ein roter Lauf, der das eigene
 * Terminal umdreht, wäre eine Pointe zu viel.
 */
function lesbar(text) {
  let out = '';
  for (const character of text) {
    const code = character.codePointAt(0) ?? -1;
    out += beanstandet(code) || code === WAGENRUECKLAUF ? `<${alsMarke(code)}>` : character;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Der Leser
// ---------------------------------------------------------------------------

/**
 * Sucht die beanstandeten Zeichen in einem Text.
 *
 * Gezählt wird in Zeilen und Zeichen und nicht in Bytes: Die Angabe soll die
 * sein, die ein Editor anzeigt.
 */
function findeImText(text) {
  const funde = [];
  let zeile = 1;
  let spalte = 1;
  const zeichen = [...text];
  for (let i = 0; i < zeichen.length; i += 1) {
    const code = zeichen[i].codePointAt(0) ?? -1;
    if (code === ZEILENUMBRUCH) {
      zeile += 1;
      spalte = 1;
      continue;
    }
    if (code === WAGENRUECKLAUF) {
      // Erlaubt als erste Hälfte einer Zeilenende-Folge, beanstandet allein.
      const naechste = i + 1 < zeichen.length ? zeichen[i + 1].codePointAt(0) : undefined;
      if (naechste !== ZEILENUMBRUCH) {
        funde.push({ zeile, spalte, code });
      }
      spalte += 1;
      continue;
    }
    if (beanstandet(code)) funde.push({ zeile, spalte, code });
    spalte += 1;
  }
  return funde;
}

/** Die Zeile, in der ein Fund steht — lesbar gemacht und auf 80 Zeichen gekürzt. */
function ausschnitt(text, zeile) {
  const zeilen = text.split(String.fromCodePoint(ZEILENUMBRUCH));
  const roh = zeilen[zeile - 1] ?? '';
  const gezeigt = lesbar(roh);
  return gezeigt.length <= 80 ? gezeigt : `${gezeigt.slice(0, 80)}…`;
}

// ---------------------------------------------------------------------------
// Die Ausnahmen
// ---------------------------------------------------------------------------

/**
 * Dateien, die ein solches Zeichen **roh** tragen dürfen, mit Zahl und Grund.
 *
 * Form: `{ datei, codePoint, anzahl, grund }`. Der Pfad ist der, den
 * `git ls-files` ausgibt, vom Wurzelverzeichnis aus.
 *
 * Heute leer, und das ist die stärkste Aussage, die diese Liste treffen kann:
 * **Kein** versionierter Text in Takt braucht ein rohes Steuer- oder
 * Richtungszeichen. Wo eines gemeint ist, steht eine Escape-Folge — so hält es
 * `characters.ts` für die Klasse selbst, so hält es `paging.ts` seit T-126 für
 * den Trenner, und so halten es die Tests für ihre Randwerte.
 *
 * Eine Zeile hier ist keine Kleinigkeit. Sie braucht einen Grund, der erklärt,
 * warum eine Escape-Folge an dieser Stelle **nicht** geht — etwa eine
 * Beispieldatei, die als Ganzes byteweise verglichen wird. „Ist halt so" ist
 * keiner.
 */
const AUSNAHMEN = [];

/**
 * Der Schlüssel, unter dem eine Fundstelle und eine Ausnahme zueinanderfinden:
 * Datei und Codepunkt.
 *
 * `JSON.stringify` und kein Trennzeichen dazwischen — und das steht hier nicht
 * aus Ordnungsliebe. In der ersten Fassung dieser drei Zeilen stand als Trenner
 * ein **rohes** `U+0000`; es ist beim Schreiben hineingeraten, unmittelbar
 * nachdem der Trenner aus `packages/storage/src/sqlite/paging.ts` gelesen war,
 * und es war in keiner Ausgabe zu sehen. Gefunden hat es dieser Lauf selbst,
 * beim ersten Durchgang über den eigenen Baum — der siebte Vorfall derselben
 * Art in fünf Aufgaben, diesmal in der Datei, die ihn abstellen soll.
 *
 * Ein Feld, das JSON kodiert, braucht überhaupt keinen Trenner. Es gibt damit
 * auch keine Stelle mehr, an der einer stehen könnte.
 */
function schluesselVon(datei, codePoint) {
  return JSON.stringify([datei, codePoint]);
}

/**
 * Wendet die Ausnahmen auf die Funde an.
 *
 * Gibt zurück, was übrigbleibt, und dazu die Ausnahmen, die nicht aufgegangen
 * sind — beides ist ein Grund, rot zu werden.
 */
function wendeAusnahmenAn(funde, ausnahmen) {
  const gezaehlt = new Map();
  for (const fund of funde) {
    const schluessel = schluesselVon(fund.datei, fund.code);
    gezaehlt.set(schluessel, (gezaehlt.get(schluessel) ?? 0) + 1);
  }

  const gedeckt = new Set();
  const ungueltig = [];
  for (const ausnahme of ausnahmen) {
    const schluessel = schluesselVon(ausnahme.datei, ausnahme.codePoint);
    const tatsaechlich = gezaehlt.get(schluessel) ?? 0;
    if (tatsaechlich === ausnahme.anzahl && tatsaechlich > 0) {
      gedeckt.add(schluessel);
      continue;
    }
    ungueltig.push({ ausnahme, tatsaechlich });
  }

  const offen = funde.filter((fund) => !gedeckt.has(schluesselVon(fund.datei, fund.code)));
  return { offen, ungueltig };
}

// ---------------------------------------------------------------------------
// Die Dateien
// ---------------------------------------------------------------------------

/**
 * Endungen, deren Inhalt keine Codepunkte sind.
 *
 * Bewusst kurz und bewusst vollständig aufgezählt: Was hier nicht steht, wird
 * gelesen. Abschnitt 3 misst zweierlei — dass jede Endung im Baum vorkommt
 * (sonst ist der Eintrag ein Rest, den niemand mehr braucht) und dass jede so
 * übersprungene Datei wirklich binär ist (sonst wäre die Endung ein Versteck).
 */
const BINAERE_ENDUNGEN = ['png', 'ico', 'icns'];

function endungVon(pfad) {
  const name = pfad.slice(pfad.lastIndexOf('/') + 1);
  const punkt = name.lastIndexOf('.');
  return punkt <= 0 ? '' : name.slice(punkt + 1).toLowerCase();
}

function git(...argumente) {
  const ausgabe = execFileSync('git', argumente, { cwd: ROOT, maxBuffer: 1 << 28 });
  return ausgabe
    .toString('utf8')
    .split(String.fromCodePoint(0x0000))
    .filter((eintrag) => eintrag !== '');
}

/**
 * Die Dateien, um die es geht: die versionierten **und** die neuen.
 *
 * Der zweite Aufruf ist nicht Beiwerk, sondern der Unterschied zwischen einem
 * Wächter und einem Nachruf. Beim Bau dieses Laufs stand das rohe Zeichen
 * zuerst in einer **neu angelegten** Datei — `git ls-files` allein kannte sie
 * nicht und der Lauf blieb grün. Genau so entsteht der Fund, den er verhindern
 * soll: Eine Datei wird geschrieben, der Lauf sagt nichts, und eingecheckt wird
 * sie danach.
 *
 * `--others --exclude-standard` nimmt deshalb dazu, was noch nicht versioniert,
 * aber auch nicht ausgeschlossen ist. Was in `.gitignore` steht — Abhängigkeiten,
 * Berichte der Testläufe, Bauergebnisse —, bleibt draußen: Es kommt nie in ein
 * Review.
 */
function zuPruefendeDateien() {
  const versioniert = git('ls-files', '-z');
  const neu = git('ls-files', '-z', '--others', '--exclude-standard');
  return { versioniert, neu, alle: [...versioniert, ...neu] };
}

// ===========================================================================
section('1. Die Klasse kommt aus der Domäne, der Unterschied wird gerechnet');
// ===========================================================================

check(
  'die Domänenklasse ist da und nicht leer',
  Array.isArray(FORBIDDEN_NAME_CHARACTERS) && FORBIDDEN_NAME_CHARACTERS.length > 0,
  `${FORBIDDEN_NAME_CHARACTERS?.length ?? 0} Bereiche`,
);

check(
  'das Gerüst steht in CONTROL_WHITESPACE der Domäne',
  GERUEST.every((code) => inRanges(code, CONTROL_WHITESPACE)),
  GERUEST.filter((code) => !inRanges(code, CONTROL_WHITESPACE)).map(alsMarke).join(' '),
);

{
  const doppelt = [];
  for (const bereich of UNSICHTBARE_NACHBARN) {
    for (let code = bereich.from; code <= bereich.to; code += 1) {
      if (inRanges(code, FORBIDDEN_NAME_CHARACTERS)) doppelt.push(alsMarke(code));
    }
  }
  check(
    'der Zusatz überschneidet die Domänenklasse nicht — er ist keine Abschrift',
    doppelt.length === 0,
    doppelt.join(' '),
  );
}

/*
 * Keine Aufzählung der Klasse, sondern eine **Anforderung** an sie: Genau diese
 * drei Zeichen haben in Takt schon einmal Arbeit gemacht. Fielen sie eines Tages
 * heraus, wäre das ein Rückschritt, den niemand bemerken würde.
 */
for (const [code, anlass] of [
  [0x0000, 'T-112-H2 und T-125-6 — das Zeichen, das Dateien binär macht'],
  [0x202e, 'T-119 — das Zeichen, das die Zeile umdreht'],
  [0x061c, 'T-117 — die Marke, die eine Abschrift nicht mitbekam'],
  [0xfeff, 'die Bytefolgenmarke'],
  [0x200b, 'der Leerraum ohne Breite'],
]) {
  check(`${alsMarke(code)} wird beanstandet (${anlass})`, beanstandet(code));
}

for (const [code, grund] of [
  [0x0009, 'Tabulator — Einrückung'],
  [0x000a, 'Zeilenumbruch — die Datei besteht daraus'],
  [0x0020, 'Leerzeichen'],
  [0x00e4, '„ä" — ein Buchstabe'],
  [0x1f600, 'ein Emoji außerhalb der BMP'],
]) {
  check(`${alsMarke(code)} wird nicht beanstandet (${grund})`, !beanstandet(code));
}

check(
  'die Namenstabelle nennt nur Zeichen der Klasse',
  [...NAMEN.keys()].every((code) => beanstandet(code) || code === WAGENRUECKLAUF),
  [...NAMEN.keys()]
    .filter((code) => !beanstandet(code) && code !== WAGENRUECKLAUF)
    .map(alsMarke)
    .join(' '),
);

// ===========================================================================
section('2. Die versionierten und die neuen Dateien');
// ===========================================================================

let dateien = [];
let neueDateien = [];
try {
  const gefunden = zuPruefendeDateien();
  dateien = gefunden.alle;
  neueDateien = gefunden.neu;
  console.log(
    `        ${gefunden.versioniert.length} versioniert, ${gefunden.neu.length} neu und nicht ausgeschlossen`,
  );
} catch (fehler) {
  check('git ls-files läuft', false, String(fehler?.message ?? fehler));
}

check('git ls-files liefert Dateien', dateien.length > 0, `${dateien.length}`);

const funde = [];
const nichtLesbar = [];
const uebersprungen = [];
let gelesen = 0;

const fehlend = [];

for (const datei of dateien) {
  const endung = endungVon(datei);
  let rohBytes;
  try {
    rohBytes = readFileSync(join(ROOT, datei));
  } catch {
    // Eine Datei, die Git noch führt und die auf der Platte nicht mehr liegt
    // (gelöscht, aber nicht eingetragen). Kein Fund und kein Grund, den ganzen
    // Lauf abzubrechen — aber auch nichts, was stillschweigend verschwindet.
    fehlend.push(datei);
    continue;
  }
  if (BINAERE_ENDUNGEN.includes(endung)) {
    uebersprungen.push({ datei, endung, rohBytes });
    continue;
  }
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(rohBytes);
  } catch {
    nichtLesbar.push(datei);
    continue;
  }
  gelesen += 1;
  for (const fund of findeImText(text)) funde.push({ ...fund, datei, text });
}

check(
  'jede gelesene Datei ist gültiges UTF-8',
  nichtLesbar.length === 0,
  nichtLesbar.join(' | '),
);

console.log(
  `        ${gelesen} Textdateien gelesen, ${uebersprungen.length} Binärdateien übersprungen` +
    (fehlend.length === 0 ? '' : `, ${fehlend.length} nicht auf der Platte (${fehlend.join(' ')})`),
);

const { offen, ungueltig } = wendeAusnahmenAn(funde, AUSNAHMEN);

for (const fund of offen) {
  console.log(
    `        ${fund.datei}:${fund.zeile}:${fund.spalte}  ${alsMarke(fund.code)}` +
      `  ${NAMEN.get(fund.code) ?? 'Steuer- oder Richtungszeichen'}`,
  );
  console.log(`          ${ausschnitt(fund.text, fund.zeile)}`);
}

check(
  'kein rohes Steuer- oder Richtungszeichen im versionierten Baum',
  offen.length === 0,
  `${offen.length} Fundstelle(n)`,
);

// ===========================================================================
section('3. Die Binärdateien sind welche');
// ===========================================================================

check(
  'jede übersprungene Datei ist wirklich binär (Nullbyte in den ersten 8000)',
  uebersprungen.every((eintrag) => eintrag.rohBytes.subarray(0, 8000).includes(0)),
  uebersprungen
    .filter((eintrag) => !eintrag.rohBytes.subarray(0, 8000).includes(0))
    .map((eintrag) => eintrag.datei)
    .join(' | '),
);

{
  const vorhanden = new Set(uebersprungen.map((eintrag) => eintrag.endung));
  const ungenutzt = BINAERE_ENDUNGEN.filter((endung) => !vorhanden.has(endung));
  check(
    'jede eingetragene Endung kommt im Baum vor — kein Rest in der Liste',
    ungenutzt.length === 0,
    ungenutzt.join(' '),
  );
}

// ===========================================================================
section('4. Die Ausnahmeliste');
// ===========================================================================

check(
  'jede Ausnahme trifft genau so oft zu, wie sie behauptet',
  ungueltig.length === 0,
  ungueltig
    .map(
      (eintrag) =>
        `${eintrag.ausnahme.datei} ${alsMarke(eintrag.ausnahme.codePoint)}: ` +
        `${eintrag.tatsaechlich} statt ${eintrag.ausnahme.anzahl}`,
    )
    .join(' | '),
);

check(
  'jede Ausnahme nennt einen Grund',
  AUSNAHMEN.every((eintrag) => typeof eintrag.grund === 'string' && eintrag.grund.trim() !== ''),
);

console.log(
  `        ${AUSNAHMEN.length} Ausnahme(n) eingetragen` +
    (AUSNAHMEN.length === 0 ? ' — kein versionierter Text braucht ein rohes solches Zeichen' : ''),
);

// ===========================================================================
section('5. Und der Prüfer prüft sich selbst');
// ===========================================================================

/*
 * Jedes Zeichen wird **gebaut**. `String.fromCodePoint(...)` und nichts zwischen
 * Anführungszeichen — der Fehler, den dieser Lauf verhindert, entsteht sonst
 * beim Schreiben des Laufs. Das ist keine Vorsicht: T-126 ist genau daran
 * dreimal gescheitert, in der Aufgabe, die es beheben sollte.
 */
const Z = (code) => String.fromCodePoint(code);
const UMBRUCH = Z(ZEILENUMBRUCH);
const SAUBER = `const a = 1;${UMBRUCH}// Störung Lüftung, Ost — „Abrechnung"${UMBRUCH}`;

check('ein sauberer Text ergibt keine einzige Beanstandung', findeImText(SAUBER).length === 0);

for (const [code, was] of [
  [0x0000, 'ein rohes NUL'],
  [0x202e, 'ein rohes RLO'],
  [0x061c, 'eine rohe ALM'],
  [0xfeff, 'eine rohe Bytefolgenmarke'],
  [0x200b, 'ein roher Leerraum ohne Breite'],
  [0x200d, 'ein rohes ZWJ'],
  [0x007f, 'ein rohes DEL'],
  [0x001b, 'ein rohes ESC'],
  [0x000b, 'ein roher vertikaler Tabulator'],
]) {
  const verdorben = `const a = ${Z(code)}1;${UMBRUCH}`;
  const gefunden = findeImText(verdorben);
  check(
    `${was} wird gefunden`,
    gefunden.length === 1 && gefunden[0].code === code,
    gefunden.map((fund) => alsMarke(fund.code)).join(' '),
  );
}

check(
  'Tabulator und Zeilenumbruch werden nicht gefunden',
  findeImText(`\tconst a = 1;${UMBRUCH}\tconst b = 2;${UMBRUCH}`).length === 0,
);

check(
  'ein Wagenrücklauf vor dem Zeilenumbruch wird nicht gefunden',
  findeImText(`const a = 1;${Z(WAGENRUECKLAUF)}${UMBRUCH}`).length === 0,
);

{
  const gefunden = findeImText(`const a = 1;${Z(WAGENRUECKLAUF)}const b = 2;${UMBRUCH}`);
  check(
    'ein allein stehender Wagenrücklauf wird gefunden',
    gefunden.length === 1 && gefunden[0].code === WAGENRUECKLAUF,
    gefunden.map((fund) => alsMarke(fund.code)).join(' '),
  );
}

{
  // Die Escape-Folge, also die richtige Schreibweise, darf nichts auslösen —
  // sonst wäre die Empfehlung dieses Laufs seine eigene Beanstandung.
  const alsEscape = 'const SEPARATOR = ' + JSON.stringify(Z(0x0000)) + ';' + UMBRUCH;
  check(
    'dieselbe Sache als Escape-Folge geschrieben ergibt nichts',
    findeImText(alsEscape).length === 0,
    lesbar(alsEscape),
  );
}

{
  const gefunden = findeImText(`a${Z(0x202e)}b${UMBRUCH}c${Z(0x202e)}d${UMBRUCH}`);
  check(
    'Zeile und Spalte stimmen',
    gefunden.length === 2 &&
      gefunden[0].zeile === 1 &&
      gefunden[0].spalte === 2 &&
      gefunden[1].zeile === 2 &&
      gefunden[1].spalte === 2,
    gefunden.map((fund) => `${fund.zeile}:${fund.spalte}`).join(' '),
  );
}

check(
  'die Ausgabe eines Fundes trägt das Zeichen nicht weiter',
  findeImText(lesbar(`a${Z(0x202e)}b`)).length === 0,
  lesbar(`a${Z(0x202e)}b`),
);

// --- Die drei Regeln der Ausnahmeliste, an einem erfundenen Beispiel ---------

const PROBE = [
  { datei: 'tests/fixtures/erfunden.txt', zeile: 1, spalte: 3, code: 0x200d },
  { datei: 'tests/fixtures/erfunden.txt', zeile: 2, spalte: 5, code: 0x200d },
];

{
  const { offen: rest, ungueltig: schlecht } = wendeAusnahmenAn(PROBE, [
    { datei: 'tests/fixtures/erfunden.txt', codePoint: 0x200d, anzahl: 2, grund: 'Probe' },
  ]);
  check(
    'eine Ausnahme mit der richtigen Zahl deckt ihre Fundstellen',
    rest.length === 0 && schlecht.length === 0,
  );
}

{
  const { offen: rest, ungueltig: schlecht } = wendeAusnahmenAn(PROBE, [
    { datei: 'tests/fixtures/erfunden.txt', codePoint: 0x200d, anzahl: 1, grund: 'Probe' },
  ]);
  check(
    'ein Vorkommen mehr als eingetragen bleibt offen und macht die Ausnahme ungültig',
    rest.length === 2 && schlecht.length === 1 && schlecht[0].tatsaechlich === 2,
    `${rest.length} offen, ${schlecht.length} ungültig`,
  );
}

{
  const { ungueltig: schlecht } = wendeAusnahmenAn(PROBE, [
    { datei: 'tests/fixtures/erfunden.txt', codePoint: 0x200d, anzahl: 2, grund: 'Probe' },
    { datei: 'tests/fixtures/laengst-weg.txt', codePoint: 0x0000, anzahl: 1, grund: 'Probe' },
  ]);
  check(
    'eine Ausnahme, die nichts mehr trifft, wird rot',
    schlecht.length === 1 && schlecht[0].ausnahme.datei === 'tests/fixtures/laengst-weg.txt',
    schlecht.map((eintrag) => eintrag.ausnahme.datei).join(' '),
  );
}

{
  const { offen: rest } = wendeAusnahmenAn(PROBE, [
    { datei: 'tests/fixtures/erfunden.txt', codePoint: 0x0000, anzahl: 2, grund: 'Probe' },
  ]);
  check(
    'eine Ausnahme deckt nur ihren eigenen Codepunkt',
    rest.length === 2,
    `${rest.length} offen`,
  );
}

{
  const { offen: rest } = wendeAusnahmenAn(PROBE, [
    { datei: 'tests/fixtures/andere.txt', codePoint: 0x200d, anzahl: 2, grund: 'Probe' },
  ]);
  check('eine Ausnahme deckt nur ihre eigene Datei', rest.length === 2, `${rest.length} offen`);
}

// --- Und der Lauf über den echten Baum findet etwas, wenn etwas da ist -------

/*
 * Die vorigen Proben messen den Leser an erfundenem Text. Diese misst den
 * **Lauf**: dieselbe Liste von Dateien, dieselbe Schleife, nur mit einer
 * eingesetzten Fundstelle im Arbeitsspeicher. Ohne sie bliebe offen, ob der
 * Weg von `git ls-files` bis zur Beanstandung überhaupt zusammenhängt.
 */
{
  const opfer = dateien.find((datei) => datei.endsWith('packages/domain/src/characters.ts'));
  if (opfer === undefined) {
    check('die Probe am echten Baum lässt sich anwenden', false, 'Datei nicht gefunden');
  } else {
    const text = readFileSync(join(ROOT, opfer), 'utf8');
    const verdorben = text.replace('let out = ', `let out = ${Z(0x202e)}`);
    check('die Probe am echten Baum lässt sich anwenden', verdorben !== text);
    const gefunden = findeImText(verdorben);
    check(
      'ein in eine echte Datei eingesetztes RLO wird gefunden',
      gefunden.length === 1 && gefunden[0].code === 0x202e,
      gefunden.map((fund) => `${fund.zeile}:${fund.spalte} ${alsMarke(fund.code)}`).join(' '),
    );
    check('und die Datei selbst ist unverändert sauber', findeImText(text).length === 0);
  }
}

// ---------------------------------------------------------------------------
console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) {
  console.log('\nFehlgeschlagen:');
  for (const name of failures) console.log(`  - ${name}`);
  process.exitCode = 1;
}
