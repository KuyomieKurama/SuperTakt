Aufgabe: T-266 — Sicherheitsprüfung der Umstrukturierung (T-249 bis T-263)
Status: braucht Review — Urteil: **Umstrukturierung freigegeben**; `proof:layers` **Nacharbeit** (A-A-75)

Artefakte:
- `docs/bedrohungsmodell.md` — **Kapitel 35 neu** (35.0 bis 35.8, zwölf Befunde, zwei neue
  Auflagen **A-A-75** und **A-A-76**); dazu die Ortsberichtigung nach A-A-70 an **A-V-1′** in
  19.5 an Ort und Stelle, und der Nachzug von **47 veralteten Pfadangaben** in 22 Dateien auf
  44 Zeilen.
- `.claude/team/reports/T-266-security-checker.md` (diese Datei)

Kein Produktivcode angefaßt. Die zwei Angriffe aus 35.2 sind **am Baum** gefahren und
zurückgenommen; beide Dateien sind sha256-verglichen mit ihrer Fassung davor
(`apps/local-api/src/pool-movement.ts` → `6be5ce9d…`,
`apps/local-api/src/features/todos/todos.ts` → `cfb40cf7…`), und `proof:layers` steht danach
wieder auf 20/0.

Zusammenfassung:
**Keine Vertrauensgrenze hat sich bewegt, und das ist gemessen, nicht geglaubt.** Der gesamte
Rust-Anteil ist zeichengleich (`git status --short -- apps/desktop/src-tauri/` ist leer), damit
auch der Öffnen-Befehl und der Wurzelspeicher aus A-23; `src/access/**` ist zeichengleich, damit
die Prüfschicht; die zwei Dateien der Release-Adresse sind **sha256-gleich** umgezogen; der
Fremdimport ist anweisungsgleich geschnitten (713 → 715, Differenz nur Einfuhrzeilen und ein
`export`). Vier Läufe von Hand gefahren und grün: `proof:shell-surface` (7 Prüfungen, 54
Gegenproben, drei Aufruforte für `open` mit ihrer Prüfung), `proof:route-policy` (**44/0**, 73
Routen, Add-in-Fläche 4, sechs Seitenwege auf 401), `proof:release-safety` (**342 Dateien aus 8
Quellordnern** statt 129 ungelesener), `proof:codepoints` (**1012** versionierte Dateien statt
9 %). Nebenbei erledigt: **T-247-2** — `app.ts` verspricht die gefallene Anhangroute nicht mehr
im Präsens.

**`proof:layers` habe ich zweimal ausgehebelt.** Die Menge der Anwendungsfälle ist an zwei
Ordnerpräfixen aufgespannt (`src/features/`, `src/routes/`), also genau an der Struktur, vor der
der Lauf im eigenen Kopfabsatz warnt. **31 von 63** Quelldateien fallen aus beiden Mengen, drei
davon sind Anwendungsfallschicht — `context.ts`, `pool-movement.ts`, `tag-names.ts`, allesamt
bis T-257 unter `usecases/`. Ein vollständiger Hono-Router in `src/pool-movement.ts` läßt den
Lauf bei **20/0, Ausgangskode 0**. Die **E-101-Verengung trägt** — `Context<` ist nicht verloren,
`Response` ist begründet aufgegeben, `c.req` und `HTTPException` sind neu dazugekommen; nicht die
Marke ist das Problem, sondern die Menge, auf die sie angewandt wird.

**Ihr Papier zeigte auf leere Orte.** A-V-1′ nennt die zwei erlaubten Orte der Release-Adresse
als Zusage und nannte bis heute `apps/local-api/src/version/source.ts` und
`apps/web/src/lib/releasePage.ts` — beides gibt es nicht mehr. Der Abgleich des ganzen Papiers
gegen Platte **und** `git ls-files` fand 47 solcher Angaben. Alle nachgezogen, die Zusage nach
A-A-70 an ihrer eigenen Stelle berichtigt.

---

## Befunde

Vollständig, mit Pfad, Anforderung, Auswirkung und Gegenmittel, in `docs/bedrohungsmodell.md`
Abschnitt **35.6**. Hier die Kurzfassung.

| Nr. | Stufe | Kurz | Zuständig |
|---|---|---|---|
| T-266-1 | **soll** | `proof:layers` ist eine Ebene höher blind — gemessen 20/0 mit einem Hono-Router in `src/pool-movement.ts`. Gegenmittel **A-A-75** | domain-dev |
| T-266-2 | Hinweis | Innerhalb der gemessenen Menge gehen beide Marken an `await import('hono')` und an `ctx` statt `c` vorbei. Teil von A-A-75 | domain-dev |
| T-266-3 | Berichtigung | A-V-1′ und 46 weitere Ortsangaben zeigten ins Leere — **berichtigt**. Gegenmittel **A-A-76** | — |
| T-266-4 | Feststellung | Keine Vertrauensgrenze hat sich bewegt (35.1) | — |
| T-266-5 | Hinweis | `ROUTE_SOURCE_MARKERS` zählt acht Dateien auf, wo neun Routendateien liegen — Fehlschlagrichtung gutartig | domain-dev |
| T-266-6 | Feststellung | `ADDIN_FLAECHE`, `REQUEST_SCHEMAS`, `EXPECTED_MIDDLEWARE_ORDER` stehen bereits vollständig nach E-103 | — |
| T-266-7 | Hinweis | `addinSurface.length === 4` ist eine Zahl, keine Menge; Deckung allein bei `proof:addin` 18f | domain-dev |
| T-266-8 | Feststellung | **R-23 und R-24 sind weiterhin nicht bewertet** und gelten nicht als geprüft | Orchestrator |
| T-266-9 | Hinweis | Semgrep und 42Crunch weiterhin ohne Werkzeug | Orchestrator |
| T-266-10 | Hinweis | Zeilennummern im Papier laufen weg — 3 von 7 Stichproben treffen nicht mehr. Keine Auflage | — |
| T-266-11 | Hinweis | Die sechste Gegenprobe in `proof:layers` Abschnitt 5 prüft `Array#includes`, nicht ihren Prüfsatz | domain-dev |
| T-266-12 | Feststellung | **T-247-2 erledigt** — `app.ts:253-262` nennt den Wegfall statt der Fläche | — |

### T-266-1 — `proof:layers` spannt seine Menge an der Struktur auf (soll)

**Pfad:** `apps/local-api/scripts/proof-layers.mjs`, Mengenbildung `anwendungsfaelle`.
**Anforderung:** `architektur.md` 1.2, E-099 Punkt 3, E-102, E-103, E-001.

```js
const anwendungsfaelle = DATEIEN.filter(
  (p) => !istRoute(p) &&
    ['src/features/', 'src/routes/'].some((ort) => name(p).startsWith(ort)),
);
```

Die erste Zeile des Laufs sagt es selbst: *„Gemessen: 63 Quelldatei(en), davon 9 Routendatei(en)
und 23 Anwendungsfall/-fälle."* — 63 − 9 − 23 = **31 ungemessen**. 28 davon zu Recht (`access/`,
`http/`, `taskpane/`, die Einstiegsdateien). **Drei nicht:** `src/context.ts`,
`src/pool-movement.ts`, `src/tag-names.ts` sind Anwendungsfallschicht und lagen bis T-257 unter
`usecases/`; `context.ts` trägt die Zusage sogar im eigenen Kopfabsatz.

**Gemessen** (an `src/pool-movement.ts` angehängt, danach zurückgenommen):

```ts
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
export const leak = new Hono().get('/x', (c) => c.json({ ok: true }));
```

```text
  ok    keiner der 23 Anwendungsfälle bindet `hono` ein
  ok    keiner nennt `c.json(`, `c.req` oder `HTTPException`
20 bestanden, 0 fehlgeschlagen.        Ausgangskode 0
```

**Auswirkung.** Der Wiederholungsfall ist kein Angriff, sondern eine gewöhnliche Bewegung: Zieht
der nächste Auftrag einen Anwendungsfall aus einem Merkmal heraus, weil zwei Merkmale ihn
brauchen — dieselbe Bewegung, die `pool-movement.ts` gerade gemacht hat —, verläßt er damit den
Wächter, der über ihn urteilt. Der Lauf, der eigens gegen das Verschwinden dieser Grenze gebaut
wurde, sieht sie in dem Augenblick nicht mehr.

**Gegenmittel: A-A-75** (ausgeschrieben in 35.7). Kurz: Die Menge als **Ergänzung** bilden —
alles unter `src/` außer Routendateien, außer den ausgeschriebenen Randordnern und
Einstiegsdateien —, die Ausnahmeliste nach E-103 mit eigenem Wächter, und die Summe
„Routen + Anwendungsfälle + Ausnahmen" muß die Zahl der gelesenen Dateien **genau** ergeben.
Dazu die Marken schärfen (`import('hono')`, kein Bezeichnername). Beide Gegenproben liegen
gebaut in 35.2.2 und 35.2.3.

### T-266-3 — die Zusage nannte einen Ort, den es nicht gibt (Berichtigung)

**Pfad:** `docs/bedrohungsmodell.md` A-V-1′ (19.5) und A-V-1 (19.4). **Anforderung:** A-V-18,
A-A-70, E-103.

`proof-release-safety.mjs:302` führt die zwei erlaubten Orte weiterhin **fest**, und das ist
richtig: Eine Auflösung über ein Merkmal machte „genau zwei" tautologisch. Das rote Fenster nach
dem Umzug ist der Zweck. **Nur hatte dieses Papier kein Gegenstück dazu** — es nannte
`apps/local-api/src/version/source.ts` und `apps/web/src/lib/releasePage.ts` weiter, obwohl
beide Dateien mit T-257 umgezogen sind (je zeichengleich, sha256-verglichen).

Der Abgleich des ganzen Papiers gegen Platte **und** `git ls-files`, in voller und verkürzter
Schreibweise, fand **47** solcher Angaben in **22** Dateien auf **44** Zeilen. Alle nachgezogen;
die vollständige Umzugstafel steht in 35.3. Die Restliste enthält danach ausschließlich
Wegwerfskripte einer Messung, Pfade in fremden Kisten und erfundene Beispiele.

**Gegenmittel: A-A-76.** Ein Pfad ist ein Ort, keine Messung — er wird nachgezogen und der
Nachzug aufgeschrieben. Eine **Auflage**, die einen Ort als Teil ihrer Zusage nennt, wird nach
A-A-70 an ihrer Stelle berichtigt. Und der Abgleich bekommt einen Lauf, mit ausgeschriebenen
Ausnahmen und Gegenprobe in beide Richtungen.

### T-266-5 — die eine halbe Liste in `proof:openapi` (Hinweis)

**Pfad:** `apps/local-api/scripts/proof-openapi.mjs:1106`, `ROUTE_SOURCE_MARKERS`.

Richtung 2 ist gedeckt (`paketQuelle` bricht hart ab, Untergrenze 20 000 Zeichen). Richtung 1
fehlt: acht aufgezählte Dateien, neun Routendateien im Baum —
`features/version/routes.ts` und `features/data-transfer/routes.ts` fehlen.

**Nachgemessen, und das ist der Grund für die niedrige Stufe:** Keine der beiden liest heute
einen Fragezeichenparameter (`c.req.query` kommt dort nicht vor). Käme einer dazu, würde der Lauf
**rot** („Parameter ungelesen") statt still grün. Der Fehlschlag zeigt in die sichere Richtung.

Die anderen genannten Listen sind in Ordnung: `ADDIN_FLAECHE` mißt `ueberzaehlig`, `fehlend` und
`doppelt` getrennt und ist in 34.11 von außen gegengeprüft; `REQUEST_SCHEMAS` prüft beide
Richtungen ausgeschrieben; `EXPECTED_MIDDLEWARE_ORDER` leitet seine Zahl aus der Liste ab.

### T-266-8 — R-23 und R-24, zum vierten Mal offen (Feststellung)

Weder der Wurzelspeicher aus A-23 noch der Fremdimport aus A-20.7 ist in dieser Prüfung bewertet
worden, und beides gilt **ausdrücklich nicht als geprüft**. Was T-266 dazu sagen kann, ist eine
Aussage über den Umbau und nicht über die Fläche: Beide sind nicht angefaßt worden. Die
Zertifikatsfläche des Dienstes liegt weiterhin in `src/taskpane/` — sie ist **nicht** nach
`features/settings/` gezogen, anders als der Auftragstext annahm.

---

Annahmen:
- Ein **Pfad** in `docs/bedrohungsmodell.md` ist ein Ort und keine gemessene Aussage. Zieht eine
  Datei zeichengleich um, ziehe ich den Ort still nach und schreibe den Nachzug vollzählig auf
  (35.3). Nur wo eine **Auflage** den Ort als Teil ihrer Zusage nennt — A-V-1′ —, steht die
  Berichtigung nach A-A-70 an ihrer eigenen Stelle mit altem Wortlaut. Diese Trennung habe ich
  entschieden, nicht vorgefunden; sie steht als Punkt (1) und (2) von A-A-76.
- Die Stufe **soll** für T-266-1 statt **muß**: Heute steht in keiner der drei ungemessenen
  Dateien ein Verstoß, und die Grenze ist eine Architekturgrenze, keine Zugriffsgrenze. Läge
  dort eine Zugriffsentscheidung, wäre es ein **muß**.
- Zeilennummern in diesem Papier ziehe ich **nicht** nach (T-266-10). Sie waren nie die Messung,
  und ihre Pflege kostete mehr, als sie wert ist.

Risiken:
- **`proof:layers` gilt heute als Nachweis der Schichtgrenze und ist es zu 32/63.** Bis A-A-75
  eingelöst ist, darf niemand aus einem grünen `proof:layers` schließen, daß kein Anwendungsfall
  HTTP kennt. Das gehört in den Kommentar des Laufs, nicht nur in dieses Papier.
- **R-23 (Wurzelspeicher) und R-24 (Fremdimport) sind weiterhin unbewertet** — die zwei
  schwersten Flächen dieses Bestands, seit vier Prüfungen vertagt.
- Semgrep und 42Crunch fehlen weiter. Der SAST-Teil der Definition of Done ist seit T-136 nicht
  einlösbar; alles hier ist Handlesen und gefahrene Läufe.
- Der Baum trägt 438 nicht eingecheckte Änderungen. Alles hier Gemessene gilt für **diesen**
  Arbeitsbaum, nicht für einen Commit.

Offene Fragen an den Orchestrator:
1. **A-A-75 als eigener Auftrag an domain-dev** — zusammen mit T-266-2 und T-266-11, das ist
   eine Datei und eine halbe Stunde. Soll er in dieselbe Welle wie die E-103-Nacharbeit an
   `proof:openapi` (T-266-5)?
2. **A-A-76 braucht einen Lauf**, und der gehört nicht in `apps/local-api/scripts/`. Eigener
   kleiner Nachweis in `scripts/` oder an `proof:docs` angehängt? Das ist eine Hoheitsfrage, und
   ich entscheide sie nicht.
3. **R-23 und R-24.** Ich benenne sie zum vierten Mal. Wenn sie nicht als eigener Auftrag
   angesetzt werden, sollten sie aus der Risikoliste in die offenen Fragen wandern — ein Risiko,
   das vier Prüfungen lang nur wiederholt wird, ist keine Vormerkung mehr, sondern eine
   Entscheidung, die niemand trifft.

Nächster Schritt: **Die Umstrukturierung freigeben und die Berichte T-249 bis T-263 auf „fertig"
setzen.** Parallel dazu einen Auftrag an domain-dev für A-A-75 (mit T-266-2, T-266-5, T-266-7,
T-266-11 als Beifang) und einen an den Orchestrator für A-A-76. **Und dann R-23 vor allem
anderen** — die Hülle schreibt auf Bestätigung in einen Wurzelspeicher, und das steht in keinem
Kapitel dieses Papiers.
