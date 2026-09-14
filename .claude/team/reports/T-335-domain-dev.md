# T-335 — Die Lückenliste an der Anforderung aufspannen, nicht an `version.ts`

**Rolle:** domain-dev. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Geänderte Datei:** genau eine — `apps/local-api/scripts/proof-release-safety.mjs`
(3 950 → 5 083 Zeilen).

---

## 1 Läufe, jeder mit Zahl

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **Exit 0**, alle acht Pakete plus Prüf- und E2E-Konfigurationen |
| `pnpm boundaries` | grün, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm proof:release-safety` (echter Baum, neu) | **130 bestanden, 0 fehlgeschlagen** |
| `pnpm proof:layers` | 36/0 |
| `pnpm proof:route-policy` | 48/0 |
| `pnpm proof:callers` | 74/0 |
| `pnpm proof:shell-surface` | 7 Prüfungen und 54 Gegenproben bestanden |
| `pnpm check` als Ganzes, `test:coverage`, `test:rust`, `build`, `verify:bundle`, `contrast`, `audit`, `proof:engines` | **nicht gemessen** — nicht „grün" |
| `pnpm test:e2e` und die portgebundenen Nachweise (`proof:access`, `conflicts`, `tags`, `export-api`, `addin-wiring`) | **nicht gemessen** — auf `127.0.0.1:17843/17844` läuft die Anwendung des Benutzers, und T-330 arbeitet parallel |

node 22.23.2, pnpm 11.3.0, TypeScript 5.9.3. Meßkopien lagen unter dem Kratzverzeichnis dieser
Sitzung und sind **abgeräumt** (2,9 GB freigegeben; es liegen noch 144 KB Skripte darin, die mit
der Sitzung verschwinden). Der Bestand des Benutzers wurde nicht angefaßt, kein Prozeß beendet.

---

## 2 Der Kern: die Menge ist neu gezogen, nicht um drei Namen ergänzt

Gestalt 6 hieß bis heute **„die Verdrahtung"** und war damit an `version.ts` aufgespannt — an der
Datei, die der Schreiber kannte. Sie heißt jetzt **„die Entscheidungsfläche"** und ist an der
Frage aufgespannt, die T-331 und T-332 gestellt haben: **wer kann über die ausgehende Anfrage
entscheiden?**

Die Antwort hat sieben Sätze statt vier. Die drei neuen sind keine drei Namen, sondern dieselbe
Frage an drei Stellen, an denen sie vorher nicht gestellt war:

| | Was gemessen wird | Woher die Menge kommt |
|---|---|---|
| **6a** (erweitert) | Wer eines der **Entscheidungsmodule** einführt, und mit welchen Namen | `DECISION_MODULES` — jetzt **zwei**: `version.ts` (wer den Prüfer baut) und `source.ts` (wer den Port baut oder ersetzt, hinter dem die Anfrage steht) |
| **6b** (verengt) | Schlüssel und Wertform des Aufrufobjekts; `source` nur noch `PropertyAccessExpression` | **A-A-107** |
| **6e** (neu) | Wie viele **Türen** es gibt: je Naht genau ein Mitglied vom Typ `ReleaseSourcePort` | aus der Deklaration gelesen (`feldnamenMitTyp`), nicht in den Lauf geschrieben |
| **6f** (neu) | Was durch die Tür kommt: an `compose(`/`main(` trägt der Türname `<Bezeichner>.<Türname>` und nichts anderes; und er kommt mindestens einmal vor | `DECISION_SEAMS`, und jede Naht wird über ihre **deklarierende Datei** aufgelöst, nicht über ihren Namen |
| **6g** (neu) | Worauf der Prüfer **vor** der Anfrage wartet (heute genau `remember`, beide Richtungen); und der Adapter dahinter: aus der Verdrahtung **hergeleitet**, wartet selbst nicht, Anweisungen zeichengleich | `CHECKER_AWAITED_BEFORE_REQUEST`, `ADAPTER_ANWEISUNGEN` |

Dazu eine **Lücke, die beim Bauen aufgefallen ist** und derselben Klasse angehört (Abschnitt 4).

---

## 3 Beidseitig gemessen, je Gestalt einzeln

Jede Gestalt wurde als **echte Dateien in einer vollständigen Kopie des Baums** eingesetzt (nicht
über die Gegenprobenmechanik), und beide Wächter liefen gegen denselben Baum.

| Baum | HEAD-Wächter (76 Sätze) | T-327-Wächter (106 Sätze) | T-335-Wächter (130 Sätze) |
|---|---|---|---|
| **Nullpunkt** (unverändert) | 76/0 grün | 106/0 grün | **130/0 grün** |
| **Z-1** (T-331, `source`-Port) | 76/0 grün | **106/0 grün** | **129/1 rot** |
| **K-1** (T-332, Warten in `recordCheck`) | 76/0 grün | **106/0 grün** | **129/1 rot** |
| **K-2** (T-332, `source: releaseSource`) | 76/0 grün | **106/0 grün** | **129/1 rot** |

`tsc -p apps/local-api/tsconfig.json --noEmit` **Exit 0** für alle drei Gestalten, `tsc -p
packages/storage/tsconfig.json --noEmit` Exit 0 für K-1 — unabhängig nachgefahren, nicht
übernommen.

**Und jede fällt über mehr als einen Zweig** — das war die Auflage aus M-4/M-5 und ist hier
eingehalten:

- **Z-1**, drei Befunde aus zwei unabhängigen Zweigen:
  `features/settings/quelle.ts: führt das Quellmodul ein und steht nicht unter den 2
  festgenagelten Verbrauchern` (6a) · `main.ts: führt createGithubReleaseSource aus dem
  Quellmodul ein` (6a) · `main.ts: die Tür releaseSource an compose( trägt CallExpression statt
  <Bezeichner>.releaseSource` (6f).
- **K-1**, zwei Befunde aus **zwei unabhängigen** Zweigen:
  `repo-version-check.ts: recordCheck wartet (await)` (6g, Regel) ·
  `repo-version-check.ts: die Anweisungen von recordCheck sind nicht mehr zeichengleich` (6g,
  Zeichenvergleich). Die Unabhängigkeit ist gemessen: M6 und M7 unten schalten je einen ab, und
  der andere bleibt rot.
- **K-2**, zwei Befunde aus zwei Zweigen:
  `features/settings/release-window.ts: führt das Quellmodul ein …` (6a) ·
  `composition.ts: der Schlüssel source trägt Identifier statt ein Feld der Aufrufoptionen` (6b,
  A-A-107).

### Die andere Richtung: acht Mutationen am Leser selbst

Nicht „ich habe es eingebaut, also wirkt es": Jede neue Zeile einzeln abgeschaltet macht genau
die Gegenproben rot, die zu ihr gehören, und keine fremde.

| Mutation | Lauf |
|---|---|
| M1 — 6a ohne das Quellmodul | **126/4** |
| M2 — 6e/6f abgeschaltet | **124/6** |
| M3 — 6g-1 (Warteliste) abgeschaltet | **126/4** |
| M4 — 6g-2 (Adapter) abgeschaltet | **122/8** |
| M5 — A-A-107 zurückgenommen | **129/1** |
| M6 — der `await`-Zweig am Adapter abgeschaltet | **129/1** |
| M7 — der Zeichenvergleich am Adapter abgeschaltet | **129/1** |
| M8 — Auflösung zurück auf „nur relative Quellen" (Stand vor T-335) | **128/2** |

M5 ist der Grund, warum A-A-107 nicht bloß im Quelltext steht: Ohne die eigene Gegenprobe ließe
sich `Identifier` wieder danebenschreiben, und kein Prüfsatz merkte es.

---

## 4 Ein vierter Ausschalter, gefunden beim Bauen — und er ist derselbe Fehler

Beim Verdrahten von 6f fiel auf, daß `aufgeloesteQuelle` **nur relative** Importquellen auflöst.
Der Kommentar daneben begründete das so:

> „Nur relative Quellen können ein Modul **innerhalb** einer Anwendung erreichen; ein Paketname
> kann es nicht (`@takt/local-api` hat keine `exports`-Tabelle auf dieses Modul, und
> `apps/desktop/sidecar/entry.ts` zeigt ausdrücklich auf `src/main.ts`)."

**Der Satz ist falsch, und sein eigener Beleg ist das Gegenbeispiel.**
`apps/local-api/package.json` hat **gar keine** `exports`-Tabelle — und ohne `exports` ist in Node
jeder Unterpfad eines Pakets einführbar. `entry.ts` tut genau das, im **ausgelieferten** Sidecar:
`import { main } from '@takt/local-api/src/main.ts';` (gemessen, Zeile 27).

Damit war 6a über einen Weg zu umgehen, den niemand verstecken mußte:

```ts
import { createVersionChecker } from '@takt/local-api/src/features/version/version.ts';
```

löste sich zu nichts auf, und der Leser sah die Datei nicht. Seit T-335 bilden beide
Schreibweisen auf denselben projektrelativen Pfad ab; zwei Gegenproben nageln es fest (die eine
über das Prüfmodul, die andere über die Naht im Sidecar), und M8 zeigt, daß sie ohne die Behebung
rot sind. Das ist derselbe Fall wie die drei gemeldeten — **eine Menge, die an der Schreibweise
aufgespannt war, die der Schreiber im Kopf hatte** — und damit der siebte dieser Klasse in diesem
Bestand.

---

## 5 Zählvorschrift

Nach der Regel bei `COUNTER_PROOFS`: ein Eintrag je unterscheidbarem Befundsatz.

- `erwartet`-Einträge: **72 → 96** (+24, alle an Gestalt 6).
- Prüfsätze: **106 → 130** (+24, **keine** neue Zeile in Abschnitt 0).
- Aufteilung der 24: 6 an 6a (beide Entscheidungsmodule, davon 2 über den Paketnamen),
  1 an A-A-107, 5 an 6e/6f, 12 an 6g.
- `rueckweg` hat damit 74 Gegenproben, zusammen 96.
- Der Nullpunkt ist **nachgefahren, nicht übernommen**: derselbe Baum, alter Leser, 106/0;
  HEAD-Leser 76/0.

Vier Einträge teilen ihren Satz mit einem anderen (die zwei über den Paketnamen, die zwei über
die Tür). Die Vorschrift verlangt dafür einen Grund — „eine plausible schwächere Umsetzung würde
sie trennen". Hier ist der Grund der stärkste, den es gibt: **die schwächere Umsetzung ist die,
die bis heute dastand.**

---

## 6 Die Frage, die größer ist als der Auftrag

> Läßt sich die Klasse „wer kann über die ausgehende Anfrage entscheiden" über den Quelltext
> vollständig schließen, oder ist jede weitere Gestalt nur der nächste Name?

**Nein, sie läßt sich nicht schließen.** Ich komme zu demselben Schluß wie T-332, und zwar aus
einem Grund, der beim Bauen sichtbar wurde und nicht aus Vorsicht.

Der Beweis liegt an **einer** Stelle dieses Umbaus, und sie steht ausdrücklich im Quelltext:
6g-2 nagelt die Anweisungen des Adapters **zeichengleich** fest. Das ist keine Bequemlichkeit,
sondern die Kapitulation einer Regel. K-1 wartet mit `await` — eine Regel fängt das. Dieselbe
Wirkung ohne `await`:

```ts
async recordCheck(at: Timestamp): Promise<void> { return new Promise<void>(() => undefined); }
```

Kein `await`, kein `setTimeout`, keine Datenbankmarke, kein Import, kein fremder Name. Jede Liste
verbotener Schreibweisen wäre der nächste Name. Deshalb steht dort die Menge **aller** Anweisungen
und nicht die Menge der verbotenen — und ein Zeichenvergleich ist keine Regel, sondern ein
Bestätigungszwang. Er trägt genau so weit, wie jemand hinsieht, wenn er rot wird.

Drei Sätze, die daraus folgen:

1. **Ein Leser von Quelltext kann zusagen, daß eine benannte Menge von Schreibweisen die
   Entscheidung nicht erreicht. Er kann nicht zusagen, daß gar keine sie erreicht.** Dazwischen
   liegt jedesmal eine Gestalt, die noch niemand gebaut hat. Die sieben Fälle dieses Bestands
   sind kein Versagen der Schreiber, sondern die Eigenschaft des Werkzeugs.
2. **Was die Klasse wirklich schließt, mißt Anfragen und nicht Zeichen.** Der Prüffall lautet:
   ein Prüfer, dessen Speicher **nie antwortet** — und die Anfrage geht trotzdem hinaus. Er ist
   heute nicht baubar, weil `version.ts:385` unbefristet wartet; er wird mit **A-A-106** baubar.
   Deshalb ist A-A-106 nicht die Nacharbeit zu diesem Wächter, sondern das Einzige, was ihn
   überflüssig machen kann.
3. **Der Nutzen des Wächters liegt woanders, als sein Name verspricht.** Er verhindert keinen
   entschlossenen Angreifer mit Schreibrecht am Bestand — wer das hat, hat ohnehin gewonnen
   (VG-3). Er verhindert, daß so ein Ausschalter **unbemerkt** entsteht: durch einen Umbau, eine
   Bequemlichkeit, einen Pull Request, den niemand von dieser Seite liest. Für diesen Zweck ist
   „106/0 grün, während drei Ausschalter durchkommen" die gefährlichste aller Zahlen, und genau
   die ist weg.

Die Zusage, die dieser Lauf ab heute tragen darf, lautet deshalb **nicht** „der Bestand kann die
Versionsprüfung nicht abschalten", sondern:

> Er mißt, **wer** den Prüfer und seinen Port baut, **womit** beide gebaut werden, **wodurch** ein
> Port in den Zusammenbau kommt, **daß** gestartet wird und **worauf** vor der Anfrage gewartet
> wird — einschließlich der Anweisungen des einen Adapters, auf den gewartet wird. Was er nicht
> mißt, steht bei `checkNoStoreReadback` aufgezählt, und die Aufzählung ist an der Anforderung
> aufgespannt und nicht an den Dateien, die wir kennen.

---

## 7 Was ich **nicht** angefaßt habe

- **A-A-106** (`version.ts:385`, `:592`/`:594`) — auftragsgemäß nicht. Der Wächter mißt diese
  Stelle jetzt (6g-1 nagelt fest, daß vor der Anfrage genau auf `remember` gewartet wird,
  **beide Richtungen**). Wer A-A-106 baut, muß `CHECKER_AWAITED_BEFORE_REQUEST` leeren oder
  ändern und dabei bestätigen, was er tut. Der Leser wird also nicht still überholt.
- **`risks.md`** — nicht geschrieben. Vorschlag unten.
- **`apps/local-api/src/**`, `packages/**`, `tests/**`, `apps/web/**`** — keine Zeile.
  `git status` zeigt aus meiner Hand genau eine geänderte Datei.

---

## 8 Kurzfassung

```
Aufgabe: T-335 — Die Lückenliste an der Anforderung aufspannen
Status: fertig
Artefakte: apps/local-api/scripts/proof-release-safety.mjs (einzige geänderte Datei),
  .claude/team/reports/T-335-domain-dev.md
Zusammenfassung: Gestalt 6 heißt nicht mehr „die Verdrahtung", sondern „die
  Entscheidungsfläche", und ihre Menge ist an der Anforderung „wer kann über die ausgehende
  Anfrage entscheiden" neu gezogen statt an `version.ts`: 6a läuft jetzt über **beide**
  Entscheidungsmodule (`version.ts` und `source.ts`), 6e/6f messen die Tür, durch die ein Port
  in `compose(`/`main(` hereinkommt (Türname aus der Deklaration, Wertform nur
  `<Bezeichner>.<Türname>`, Naht über ihre deklarierende Datei aufgelöst), 6g die Warteliste vor
  der Anfrage und den daraus hergeleiteten Adapter (wartet nicht, Anweisungen zeichengleich).
  Alle drei gemeldeten Gestalten sind danach rot und **beidseitig** gemessen — mit dem alten
  Leser 106/0 beziehungsweise 76/0 grün, mit dem neuen je 129/1 —, und jede fällt über zwei oder
  drei unabhängige Zweige. Dazu acht Mutationen am Leser selbst, die zeigen, daß jede neue Zeile
  ihre eigenen Gegenproben trägt und keine fremden. A-A-107 ist gebaut und mit einer eigenen
  Gegenprobe festgenagelt; `:486` nennt jetzt, daß `ts.getScriptKindFromFileName` **intern** ist
  und gegen TypeScript 5.9.3 gemessen wurde. Der Lauf steht bei 130/0, `erwartet` bei 96.
Annahmen: (1) Die Menge wird an der Anforderung aufgespannt, nicht um drei Namen ergänzt — ich
  habe Gestalt 6 umbenannt und von vier auf sieben Sätze erweitert, statt drei Einträge
  nachzutragen. (2) Für den Adapter hinter `store.write` steht ein **Zeichenvergleich** im Lauf,
  weil dort keine Regel trägt; der Preis ist, daß eine Änderung an
  `packages/storage/src/sqlite/repo-version-check.ts` diesen Lauf rot macht. Das ist gewollt und
  im Quelltext begründet. (3) Die Nähte `compose`/`main` werden über ihre **deklarierende Datei**
  aufgelöst, nicht über den Namen — sonst wäre eine gleichnamige Hilfsfunktion der Oberfläche ein
  roter Prüfsatz ohne Anlaß, und T-334 arbeitet parallel dort. (4) Beim Bauen habe ich eine
  vierte Lücke derselben Klasse gefunden und mitgeschlossen (Abschnitt 4); ohne sie wäre 6a über
  den Paketnamen umgehbar geblieben.
Risiken: Der Zeichenvergleich an `recordCheck` ist eine neue Kopplung zwischen diesem Lauf und
  `packages/storage`. Wer dort etwas ändert, bekommt einen roten Nachweis mit einer Meldung, die
  den gemessenen Text mitliefert — das Nachziehen ist eine Zeile, aber es ist eine bewußte Zeile,
  und genau darin liegt der Wert. Sicherheitsseitig: Der Lauf ist ein **Leser** und keine
  Behebung; der eigentliche Hebel hinter R-30 bleibt A-A-106. Die Klasse ist nicht geschlossen,
  sondern enger — die Begründung steht in Abschnitt 6 und ist der ehrliche Teil dieses Berichts.
Offene Fragen: (1) **Eine an den Orchestrator gerichtete Warnung:** Mitten in diesem Auftrag kam
  eine Nachricht „Nachtrag zu T-334" über `viewport-fit.spec.ts`, zehn A2-Verstöße und
  `flex-shrink` in `apps/web/src/styles/**`. Sie gehört **frontend-dev (T-334)** und nicht mir;
  ich habe sie nicht ausgeführt, weil `apps/web/**` nicht meine Hoheit ist und dort parallel
  gearbeitet wird. Bitte an den richtigen Agenten weiterreichen — der Befund verfällt sonst.
  (2) R-30: Wortlaut unten. (3) A-A-106 gehört in die **nächste** Welle, und wer sie baut, ändert
  dabei `CHECKER_AWAITED_BEFORE_REQUEST` — Leser und Bauender in aufeinanderfolgende Wellen.
  (4) `apps/local-api/package.json` hat keine `exports`-Tabelle; daß jeder Unterpfad einführbar
  ist, ist damit eine Eigenschaft des Vorhabens und nicht des Wächters. Ob das so bleiben soll,
  ist eine Entscheidung (Orchestrator), keine Zeile Code.
Nächster Schritt: (a) Freigaberunde nur über diese eine Datei — Code-Reviewer und
  Security-Checker, und beide mit einem **eigenen** Ausschalter, nicht mit meinem. (b) A-A-106 als
  eigener Auftrag an domain-dev in der nächsten Welle, mit dem Prüffall aus Abschnitt 6: ein
  Speicher, dessen `write` nie eintrifft, und die Anfrage geht trotzdem hinaus. (c) R-30 erst
  danach schließen.
```

---

## 9 Vorschlag für R-30 (schließt der Orchestrator)

Ich schlage vor, den Wortlaut aus T-332 Abschnitt 5 zu **übernehmen und an zwei Stellen zu
schärfen**:

> **Geschlossen am 2026-09-13 (T-332/T-335).** A-A-105 ist gebaut (T-327) und mit einem eigenen
> Ausschalter gegengeprüft. Die drei Gestalten, die am 2026-09-13 noch durchkamen — der
> `source`-Port (T-331 Z-1), das Warten im Speicheradapter (T-332 K-1) und der erlaubte Schlüssel
> mit erlaubter Wertform (T-332 K-2) —, sind in T-335 **beidseitig gemessen rot**: alter Leser
> 106/0 grün, neuer Leser je 129/1, jede über zwei oder drei unabhängige Zweige. Gestalt 6 ist
> dabei an der **Anforderung** aufgespannt worden statt an `version.ts` (E-099 Punkt 3); dabei
> fiel ein vierter Weg derselben Klasse auf — ein Import über den Paketnamen — und ist
> mitgeschlossen. A-A-107 ist gebaut. **Die Klasse ist damit nicht geschlossen, sondern verengt,
> und sie ist über den Quelltext auch nicht schließbar** (Begründung: T-335 Abschnitt 6). Der
> Rest steht als **R-31** mit dem Gegenmittel **A-A-106** — und A-A-106 ist der einzige Weg, auf
> dem diese Klasse je am Verhalten statt an Zeichen gemessen werden kann.

Für **R-31** schlage ich vor, T-332s Vorschlag zu übernehmen, aber A-A-107 daraus zu streichen
(gebaut) und den Satz aus Abschnitt 6 Punkt 2 als Abnahmekriterium aufzunehmen.
