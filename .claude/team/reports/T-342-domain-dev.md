# T-342 — Die Lückenliste an der Anforderung, und die Stelle statt der Schreibweise

**Rolle:** domain-dev. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Gemessen, nicht gelesen:** node 22.23.2, pnpm 11.3.0, TypeScript 5.9.3.
**Geänderte Datei:** `apps/local-api/scripts/proof-release-safety.mjs` und dieser Bericht. Sonst
keine — kein `src/**`, kein `packages/**`, kein `tests/**`, kein `apps/web/**`, kein
`package.json`.

---

## 1 Läufe, jeder mit Zahl

| Lauf | Wo | Ergebnis |
|---|---|---|
| `proof:release-safety`, **Nullpunkt vorher** | Arbeitsbaum | **130 / 0** |
| `proof:release-safety`, **Nullpunkt vorher** | Meßkopie | **130 / 0** — derselbe Wert, die Kopie ist damit ein gültiger Meßort |
| `proof:release-safety`, **nachher** | Arbeitsbaum | **145 / 0** |
| `proof:release-safety`, **nachher** | Meßkopie | **145 / 0** |
| `pnpm typecheck` | Arbeitsbaum | **Exit 0**, acht Pakete plus Prüf- und E2E-Konfigurationen |
| `proof:codepoints` | Arbeitsbaum | 46 / 0 |
| `proof:layers` | Arbeitsbaum | 36 / 0 |
| `proof:route-policy` | Arbeitsbaum | 48 / 0 |
| `proof:callers` | Arbeitsbaum | 74 / 0 |
| `proof:locked` | Arbeitsbaum | 9 / 0 |
| `proof:foreign` | Arbeitsbaum | 21 / 0 |
| `proof:clamp` | Arbeitsbaum | 21 / 0 |
| `tsc -p apps/local-api/tsconfig.json --noEmit` | Meßkopie, je Gestalt einzeln | **Exit 0**, viermal |

**Nicht gefahren, heißt nicht gemessen:** `pnpm check` als Ganzes, `test:coverage`, `test:rust`,
`build`, `audit`, `verify:bundle` (bindet 17844), `proof:engines`, `test:e2e` samt
`test:e2e:version-check`, und die portgebundenen Nachweise (`proof:access`, `conflicts`, `tags`,
`export-api`, `addin-wiring`). `proof:surface` und `proof:shell-surface` habe ich **bewußt nicht**
gefahren: T-341 arbeitet gleichzeitig in `apps/web/**`, und ein roter Lauf gegen einen
Zwischenstand wäre eine Messung, die niemandem gehört.

**Ports.** Keiner gebunden. Kein fremder Prozeß beendet.

**Meßkopie abgeräumt.** Der vollständige Baum (771 MB, `scratchpad/tree`) ist mit `find … -delete`
entfernt; nachgeprüft. Im sitzungseigenen Kratzbereich stehen noch vier eigene Skripte von
zusammen 12 KB (`mutate.mjs`, `messen.sh`, `frei.mjs`, `neue-gegenproben.txt`). Die 620 MB, die
dort weiterhin liegen, gehören **anderen Aufträgen** (`tree0`, `repo`, `t331…`, `t335`, `t336`,
`t337`, `t338-visual-qa`, `t341-frontend` — das letzte läuft gerade) und sind nicht angefaßt.
Außerhalb des Arbeitsbaums liegt nichts Neues von mir.

**Ein Hinweis für den nächsten, der eine Meßkopie baut** (T-336 hat die halbe Vorschrift schon
aufgeschrieben, hier ist die zweite Hälfte): Die `node_modules` müssen **kopiert und nicht
verlinkt** werden, sonst löst der Arbeitsbereichsverweis auf den echten Baum auf. Und beim
Kopieren darf `dist/` **nicht** ausgeschlossen werden — die `exports`-Tabellen der Fremdpakete
zeigen dorthin, und `tsc` meldet sonst `Cannot find module 'hono'` und gibt trotzdem **Exit 0**
über die Pipe. Ein `tsc`, das in einer kaputten Kopie „Exit 0" sagt, ist die stillste Art, eine
Gegenprobe wertlos zu machen; ich bin einmal darauf hereingefallen und habe die vier Messungen
danach wiederholt.

---

## 2 Was gebaut ist

### 2.1 Die Lückenliste ist an der Anforderung aufgespannt — nicht drei Namen nachgetragen

Die alte Liste bei `checkNoStoreReadback` zählte auf, was dem Schreiber an den **gebauten
Gestalten** vorbeikam. Drei Ausschalter vom 2026-09-13 standen deshalb nicht darin. Die neue
Liste fragt zuerst, **wo die Anforderung Stellen hat** — „die Entscheidung, ob eine Anfrage
hinausgeht **und ob ihre Antwort ankommt**, hängt an keinem Wert von außerhalb des Prozesses" —
und ordnet den ganzen Weg in vier Arten von Stellen:

- **(I) gelesen** — Adapterrumpf (6g-2), Portliteralrumpf (6h), Auskunftsausdruck (6j), die
  freien Laufzeitnamen der Entscheidungsmodule (6i) und ihre Einfuhren (Gestalt 5);
- **(II) gezählt oder eingegrenzt** — Schlüssel, Start, Türen, Warteliste, Einfuhrlisten,
  Datenbankmarken, Spaltenname, Portgestalt, Leser durch den Port;
- **(III) nur durchlaufen** — *hier* sitzt die Klasse, und hier saßen alle drei Ausschalter.
  Was heute noch dazugehört, ist einzeln benannt: der Rumpf von `current()`, der Weg von
  `versionState` bis zum Bildschirm, ein Name, den ein Modul selbst verdeckt, die Rümpfe der
  übrigen Werte im Aufrufobjekt, der Prüfer, der umhüllt statt gerufen wird, das Verhalten;
- **(IV) außerhalb des gelesenen Baums** — unverändert.

Das ist dieselbe Arbeit wie in T-335 an 6a, eine Ebene höher: nicht „welche Umgehung kenne ich
noch", sondern „welche Art von Stelle hat dieser Weg".

### 2.2 Drei neue Sätze, und keiner von ihnen ist ein Name

| | Was gemessen wird | Warum es keine Namensliste ist |
|---|---|---|
| **6h** (A-A-111) | Der **Rumpf des Portliterals** zwischen Prüfer und Adapter: er wartet nicht, ist ein einziger Ausdruck, und seine Anweisungen sind zeichengleich (`PORTLITERAL_ANWEISUNGEN`) | Die Menge **aller** Anweisungen steht darin, nicht die Menge der verbotenen — dieselbe Bauart wie `ADAPTER_ANWEISUNGEN`. Drei unabhängige Zeilen: eine bestätigte Fortschreibung der einen macht die andere nicht mit |
| **6i** | Die **freien Namen** der beiden Entscheidungsmodule: was sie benutzen, ohne es einzuführen oder selbst zu erklären (`MODUL_LAUFZEITNAMEN`, 10 und 11 Namen) | `process.env` zu verbieten wäre der nächste Name gewesen. Gemessen wird die **Tür**: Ein Modul kommt auf genau zwei Wegen an etwas heran, das es nicht selbst erklärt hat — über eine Einfuhr oder über einen freien Namen. Die Einfuhren nagelt Gestalt 5 seit T-290. **Zusammen ist das geschlossen** |
| **6j** (A-A-110) | Der **Ausdruck der Auskunft**: der Prüferbezeichner ist aus `const X = createVersionChecker(…)` hergeleitet, die an ihm gerufenen Mitglieder sind festgenagelt, jeder Aufruf steht unbedingt, und der äußerste Ausdruck um ihn ist zeichengleich (`AUSKUNFT_ANWEISUNGEN`) | Zwei unabhängige Zeilen: die Bedingung fängt die Regel, der fremde Aufruf **um** den Prüfer herum fängt der Vergleich |

Für 6j mußte ein eigener `verzweigungUeber` daneben stehen: `bedingungUeber` (6c) zählt
zusätzlich die Funktionsebenen und meldet ab der zweiten — für `start()` richtig, für eine
Auskunft falsch, denn die **ist** ein Abschluß im Rumpf von `compose`. Der Unterschied steht im
Quelltext, damit niemand den einen Leser für den anderen hält.

### 2.3 Der eigene Beleg ist berichtigt — im Kopf des Laufs, mit der alten Fassung daneben

Neuer Abschnitt im Dateikopf: **„Die Lücke liegt nicht in der Schreibweise, sondern in der
Stelle."** Er nennt zuerst die **alte** Fassung aus T-335 samt Irrtum (der Satz stimmt, der Beleg
`return new Promise<void>(() => undefined)` steht seit T-335 in der zeichengleich festgenagelten
Deklaration und ist heute **rot**, T-336 hat es mit 129/1 nachgemessen), dann die heutige (T-337
K-7, vier Zeilen weiter links, 130/0 grün und 0 statt 1 Anfrage), und daraus die Regel:

> Ein Literal, das als Literal geprüft, aber nicht **gelesen** wird, ist eine Stelle, an der jede
> Schreibweise durchkommt. Wer einen Weg festnagelt, nagelt jede Stelle auf ihm fest — oder er
> schreibt die ungelesene Stelle in die Lückenliste, damit der nächste sie findet.

Stillschweigend ersetzt wäre der Irrtum genau die Bauart, gegen die Abschnitt 0 geschrieben ist.

### 2.4 Zwei Befunde aus T-336 mit erledigt

- **`:96` (mittel)** — Punkt 5 des Kopfes stand noch im Stand von T-327. Er ist auf den heutigen
  Satz gehoben, und der Preis steht jetzt **im Kopf** als eigener Punkt **d)**: Dieser Lauf wird
  rot, wenn sich `packages/storage/src/sqlite/repo-version-check.ts` ändert — und seit heute auch,
  wenn sich das Portliteral oder die Auskunft in `composition.ts` ändert. Drei Zeichenvergleiche,
  zwei Pakete, jeder mit seinem Bestätigungsort.
- **`:2980` (niedrig)** — die Meldung des Adaptervergleichs nennt jetzt den Ort, an dem bestätigt
  wird (`ADAPTER_ANWEISUNGEN`). Die beiden neuen Vergleiche tun es von Anfang an.

---

## 3 Die Messung, beidseitig und je Gestalt einzeln

### 3.1 Am Bestand — vier Gestalten, jede einzeln in die Meßkopie gesetzt

| Gestalt | Was sie tut | `tsc` | **vorher** | **nachher** | Welcher Satz |
|---|---|---|---|---|---|
| **A = T-337 K-7** | `store.write` wartet im Rumpf des Literals, Adapter zeichengleich | Exit 0 | **130 / 0 grün** | **144 / 1 rot** | 6h, **drei** Sätze: wartet · kein einziger Ausdruck · nicht zeichengleich |
| **B = T-336 Z-2** | `process.env`-Riegel als erste Anweisung von `latest()` | Exit 0 | **130 / 0 grün** | **144 / 1 rot** | 6i: „das Quellmodul nimmt `process` aus der Laufzeit" |
| **C = T-336 Z-3** | derselbe Riegel zwischen `remember` und `source.latest` | Exit 0 | **130 / 0 grün** | **144 / 1 rot** | 6i: „das Prüfmodul nimmt `process` aus der Laufzeit" |
| **D = T-337 K-4** | Leser von `app_setting` in `features/settings`, Zweig an `versionState` | Exit 0 | **130 / 0 grün** | **144 / 1 rot** | 6j, **zwei** Sätze: steht in einer Bedingung · nicht zeichengleich |

Kein fremder Prüfsatz fällt dabei mit — bei allen vier ist der einzige rote Prüfsatz „kein
Rückweg …", und die Befundzeilen darunter gehören alle zu 6h, 6i oder 6j.

### 3.2 Am Leser — drei Zeilen einzeln abgeschaltet

| Abgeschaltet | Ergebnis | Rot geworden |
|---|---|---|
| 6h | **140 / 5** | genau die fünf Gegenproben zu 6h |
| 6i | **141 / 4** | genau die vier Gegenproben zu 6i |
| 6j | **140 / 5** | genau die fünf Gegenproben zu 6j |

5 + 4 + 5 = 14, und 14 ist die Zahl der neuen Einträge. Die Zuordnung geht auf; keine Gegenprobe
hängt an einer fremden Zeile.

### 3.3 Die Zählvorschrift, und die eine Ausnahme, die ich ausdrücklich mache

130 → **145**, `erwartet` 96 → **110**. Vierzehn neue Gegenproben (fünf an 6h, vier an 6i, fünf an
6j) **und eine Zeile in Abschnitt 0**.

Damit ändert sich eine Größe, die von T-327 bis T-335 fest war: „Gesamtzahl minus `erwartet`" war
**34** und ist jetzt **35**. Der Grund steht im Quelltext und hier: 6i hat einen Satz („ein
Entscheidungsmodul steht nicht unter den Modulen mit festgenagelten Laufzeitnamen"), der über eine
**eingesetzte Datei nicht erreichbar** ist — beide Listen stehen im Lauf und nicht im Baum. Eine
Gegenprobe dafür wäre keine. Die Zeile in Abschnitt 0 prüft statt dessen die Übereinstimmung der
beiden Listen in **beiden** Richtungen; ohne sie wäre ein drittes Entscheidungsmodul, das jemand
in `DECISION_MODULES` einträgt und in `MODUL_LAUFZEITNAMEN` vergißt, an seinem Rumpf ungemessen
und der Lauf grün.

Ich sage das ausdrücklich, weil T-336 die Trennung „Umbau ohne neue Zeile in Abschnitt 0" als
Qualitätsmerkmal gemessen hat. Sie ist hier gebrochen, einmal, mit Grund.

---

## 4 Die Frage aus dem Auftrag: kann dieser Lauf K-4 fangen?

**Die Stelle ja, die Klasse nein.** Beides ist gemessen, nicht gemeint.

**Was jetzt geht.** 6j mißt den Ausdruck, mit dem die Auskunft den Zusammenbau verläßt. K-4 in der
Gestalt, die T-337 gebaut hat — Leser in `features/settings`, Zweig an `versionState` in
`composition.ts` — ist damit rot: `tsc` Exit 0, **144/1**, an zwei unabhängigen Sätzen. Das ist
mehr als eine Schreibweise: Jede Bedingung, jeder zweite Zweig und jeder fremde Aufruf um
`versionCheck.current()` fällt, und die Untergrenze fällt auch dann, wenn die Auskunft ganz
verschwindet.

**Was nicht geht, und warum es kein Fleiß-, sondern ein Artproblem ist.** Für das Schutzziel von
A-18 zählt nicht die Stelle, sondern der **ganze Weg**: `current()` → `versionState` → Route →
Antwort → Abruf in der Oberfläche → Dialog. Dieser Lauf erreicht davon das erste Glied und ein
halbes. Drei Stellen liegen dahinter, und an jeder wirkt derselbe Ausschalter:

1. **Im Prüfmodul selbst.** Ein Zustand, der in `version.ts` nach der Anfrage verworfen oder auf
   `unknown` gesetzt wird, ist von **keinem** Satz erreichbar. 6i liest, welche Namen das Modul
   aus der Laufzeit nimmt, Gestalt 5, welche es einführt — was es mit seinen **eigenen** Werten
   tut, liest niemand. Und es muß auch niemand: Das wäre der Rumpf einer Fachdatei, und den gegen
   Zeichen zu halten hieße, jede Fortschreibung der Versionsprüfung zu einer Bestätigungsrunde zu
   machen.
2. **Hinter dem Zusammenbau.** Route, Antwortgestalt, Abruf und Dialog liegen in
   `apps/local-api/src/app.ts` und in `apps/web/**`. Kein Satz dieses Laufs stellt dort eine
   Frage; sein ganzer Baum dient bisher der Frage „geht eine Anfrage hinaus".
3. **Die Bestätigung selbst.** Ein Zeichenvergleich schützt gegen das Versehen und gegen das
   Verstecken, nicht gegen den, der den Vergleich im selben Commit mit fortschreibt. Das gilt für
   alle drei Vergleiche dieses Laufs und ist der Grund, warum sie die Bestätigungsstelle in der
   Meldung nennen: Was hier rot wird, soll im Review sichtbar sein, nicht nur im Lauf.

**Also: ein zweiter Lauf, und er mißt etwas anderes.** Nicht „geht die Anfrage hinaus", sondern
**„kommt die Antwort an"**. Aufgespannt an A-18.4/A-18.6 wären das vier Sätze: genau ein Leser von
`versionState` im Dienst; die Route reicht ihn unverändert durch; genau ein Abruf in der
Oberfläche; und die Sichtbarkeitsbedingung des Dialogs ist „neu **und** nicht übersprungen" und
nichts sonst. Das berührt `apps/local-api/src` **und** `apps/web/src` — zwei Hoheiten, also ein
eigener Auftrag und nicht ein Anhängsel an diesen.

**Und der vollständige Nachweis liegt ohnehin woanders, und er existiert schon.**
`tests/e2e/version-check-live.spec.ts` TP-VER-10 mißt den Dialog **auf dem Bildschirm** gegen
einen Prüfserver. K-4 macht diesen Prüffall rot — der Dialog erscheint nicht. Das ist die einzige
Messung, die die Klasse wirklich trifft, und sie ist am Verhalten und nicht an Zeichen.
**Gefahren habe ich sie nicht** (`test:e2e` bindet Ports und baut), also ist dieser Absatz eine
Herleitung und keine Zahl; er gehört als Prüfauftrag an e2e-tester, nicht als achte Gestalt an
mich. Eine ehrliche Antwort war hier mehr wert als eine achte Gestalt — und die ehrliche Antwort
ist, daß der Lauf die Stelle schließt und der Prüffall die Klasse.

---

## 5 Vorschläge für `risks.md` (einträgt und schließt der Orchestrator)

**R-30 — offen lassen, fortschreiben.**

> **Fortgeschrieben am 2026-09-13 (T-342).** Die Lückenliste von `proof:release-safety` ist an der
> **Anforderung** aufgespannt statt an den gebauten Gestalten und ordnet den Weg in vier Arten von
> Stellen — gelesen, eingegrenzt, nur durchlaufen, außerhalb des Baums. Die drei Ausschalter, die
> am 2026-09-13 mit `tsc` Exit 0 und **130/0** durchkamen, sind einzeln gegengemessen und einzeln
> rot: T-337 K-7 (Rumpf des `write`-Literals) **144/1** an drei Sätzen von 6h, T-336 Z-2
> (`process.env` im Quellmodul) **144/1** an 6i, T-336 Z-3 (dasselbe im Prüfmodul) **144/1** an 6i.
> 6i nagelt dabei nicht `process` fest, sondern die **Menge der freien Laufzeitnamen** beider
> Entscheidungsmodule; zusammen mit der seit T-290 festgenagelten Einfuhrliste ist die Menge der
> Türen in diese zwei Dateien damit **geschlossen**. Offen bleibt **A-A-106** — die ausgehende
> Anfrage wartet weiterhin auf ein fremdes Versprechen ohne Frist, und das ist der einzige Hebel,
> der diese Klasse je am **Verhalten** statt an Zeichen mißt. R-30 bleibt bis dahin offen.

**R-33 — nicht schließen, aber halbieren.**

> **Halb geschlossen am 2026-09-13 (T-342).** **A-A-110 ist gebaut**: 6j nagelt den Ausdruck fest,
> mit dem die Auskunft den Zusammenbau verläßt — der Prüferbezeichner ist hergeleitet, die
> gerufenen Mitglieder sind festgenagelt, jeder Aufruf steht unbedingt, und der äußerste Ausdruck
> um ihn ist zeichengleich. T-337 K-4, zeichengleich in eine Meßkopie gesetzt: `tsc` Exit 0,
> **144/1 rot** an zwei unabhängigen Sätzen; der heutige Bestand bleibt bei 145/0. **Offen bleibt
> die Klasse, nicht der Befund:** Derselbe Ausschalter wirkt auch im Rumpf von `current()`, in der
> Route, in der Antwortgestalt und in der Oberfläche, und dorthin reicht kein Satz dieses Laufs.
> Der vollständige Nachweis ist `tests/e2e/version-check-live.spec.ts` TP-VER-10 — er mißt den
> Dialog auf dem Bildschirm und wird von K-4 rot. **Gegenmittel: ein zweiter, kleiner Lauf über
> den Weg von `versionState` bis zum Dialog** (vier Sätze, berührt `apps/local-api/src` und
> `apps/web/src`, also eigene Welle), **und** die ausdrückliche Zuweisung von TP-VER-10 als
> Gegenprobe dieser Klasse.

**R-32 (der Wächter über die Abdunklungen, A-A-109)** ist frontend-dev und nicht meine Messung;
ich schlage dazu keinen Wortlaut vor.

---

## 6 Annahmen

1. **Die Nummernkollision im Auftrag habe ich am Bedrohungsmodell aufgelöst, nicht am
   Auftragstext.** Der Auftrag nennt „A-A-111 (die Auskunft statt der Anfrage, R-33)" als **nicht**
   meine Sache und „A-A-110" als zu bauen. Im Bedrohungsmodell 43.9 ist es umgekehrt herum
   beschriftet: **A-A-110** ist die Auskunft (K-4), **A-A-111** der Rumpf von `store.write` (K-7).
   Ich habe **beide** gebaut, weil Punkt 1 des Auftrags „alle drei Gestalten danach rot" verlangt
   und K-7 eine davon ist, und weil Punkt 2 A-A-110 ausdrücklich am Bedrohungsmodell festmacht.
   Nicht gebaut habe ich **A-A-106** — das ist der einzige der drei, der in `apps/local-api/src/**`
   liegt, und damit der einzige, auf den die Begründung des Auftrags („du baust gerade den Lauf,
   der sie mißt") wirklich paßt.
2. **6i verlangt eine Bestätigung bei jedem neuen Laufzeitnamen.** Wer in `version.ts` oder
   `source.ts` künftig `structuredClone`, `URL` oder `queueMicrotask` benutzt, macht diesen Lauf
   rot und trägt den Namen ein. Das ist der größte der drei neuen Preise, und ich halte ihn für
   richtig: Jeder dieser Namen ist eine Tür an allen Einfuhrlisten vorbei. Wer anders entscheidet,
   nimmt `MODUL_LAUFZEITNAMEN` heraus und hat die beiden `process.env`-Gestalten wieder offen.
3. **Die Gegenproben der Verdrahtung erzeugen seit heute mehr rote Zeilen als vorher.** Der
   Stumpf `verdrahtungsStumpf` trägt nicht überall ein sauberes Portliteral und keine Auskunft;
   an solchen Einträgen sprechen jetzt zusätzlich 6h oder 6j mit. Das bricht nichts — gezählt wird
   über `erwartet` und nicht über die roten Zeilen —, aber es steht hier, damit niemand die
   zusätzliche Zeile für einen Bestandsfehler hält.
4. **Der Zeichenvergleich am Portliteral koppelt diesen Lauf an vier Zeilen `composition.ts`.**
   Die Datei steht ohnehin zeichengleich gegen `SAUBERES_AUFRUFOBJEKT`; die Kopplung ist damit
   nicht neu, sondern vier Zeilen tiefer.

---

## 7 Risiken

- **A-A-106 bleibt offen** und ist unverändert der einzige Weg, diese Klasse am Verhalten zu
  messen. Solange `await remember(...)` vor `await source.latest(...)` steht und `store.write`
  ohne Frist abgewartet wird, ist jede Zusage dieses Laufs eine Zusage über **Zeichen**.
- **Die Klasse „die Meldung kommt nicht an" ist halb offen** (Abschnitt 4). Am heutigen Bestand
  ist nichts abgeschaltet; beide verbliebenen Wege verlangen fremden Code **und** ein präpariertes
  Archiv.
- **Drei Zeichenvergleiche statt einem.** Jeder von ihnen macht eine legitime Änderung rot. Das
  ist gewollt und an jeder Meldung mit dem Bestätigungsort versehen; es erhöht aber die Zahl der
  Läufe, die ein Entwickler als „muß ich bestätigen" und nicht als „habe ich kaputtgemacht" lesen
  muß. Der Absatz **d)** im Kopf ist der Ort, an dem das steht.
- **Sicherheitsseitig nichts Neues.** Keine neue Adresse, keine neue Route, kein neuer Datenweg;
  geändert ist ein Prüfskript, das nur liest. `proof:layers`, `proof:route-policy` und
  `proof:callers` sind unverändert grün.

---

## 8 Offene Fragen an den Orchestrator

1. **Die Nummern A-A-110 und A-A-111** sind im Auftragstext gegenüber `docs/bedrohungsmodell.md`
   43.9 vertauscht beschriftet. Ich bin dem Bedrohungsmodell gefolgt (Annahme 1). Bitte einmal
   festlegen, welche Fassung gilt, bevor der nächste Auftrag auf eine Nummer zeigt.
2. **`packages/storage/src/sqlite/repo-version-check.ts:78`** — der Satz aus T-336 („die
   Anweisungen dieses Mitglieds sind in `proof-release-safety.mjs` zeichengleich festgenagelt")
   fehlt weiterhin. Er gehört domain-dev, lag aber außerhalb der Dateihoheit dieses Auftrags
   (`scripts/**`, ausdrücklich nicht `packages/**`). **Ein Satz, eigene Welle.** Dazu gehört jetzt
   ein zweiter, gleichartiger: `apps/local-api/src/composition.ts` weiß ebenfalls nicht, daß vier
   seiner Zeilen zeichengleich festgenagelt sind.
3. **Die Differenz „Gesamtzahl minus `erwartet`"** ist von 34 auf 35 gestiegen (Abschnitt 3.3).
   Wenn diese Größe irgendwo als Prüfgröße geführt wird, ist sie dort nachzuziehen.
4. **`test:e2e:version-check` als benannte Gegenprobe der Klasse R-33.** TP-VER-10 mißt, was kein
   Zeichenleser messen kann. Ich schlage vor, das in `risks.md` und im Testplan ausdrücklich zu
   verknüpfen, statt es aus dem Namen zu erschließen. Das gehört e2e-tester.
5. **`~/.cache/t332*` (320 MB)** und die 620 MB fremder Meßkopien im Kratzbereich liegen weiter
   dort (T-337 Frage 3). Nicht meine Hoheit, nicht angefaßt.

---

## Kurzfassung

```
Aufgabe: T-342 — Die Lückenliste an der Anforderung, und die Stelle statt der Schreibweise
Status: fertig — braucht Review
Artefakte: apps/local-api/scripts/proof-release-safety.mjs (einzige geänderte Quelldatei),
  .claude/team/reports/T-342-domain-dev.md
Zusammenfassung: Die Lückenliste bei `checkNoStoreReadback` ist an der Anforderung aufgespannt
  statt an den gebauten Gestalten und ordnet den Weg in vier Arten von Stellen — gelesen,
  eingegrenzt, nur durchlaufen, außerhalb des Baums; die dritte Art ist die Klasse, und alle drei
  Ausschalter vom 2026-09-13 saßen darin. Drei neue Sätze schließen sie: 6h liest den Rumpf des
  Portliterals (A-A-111), 6i die freien Laufzeitnamen der beiden Entscheidungsmodule, 6j den
  Ausdruck der Auskunft (A-A-110). 6i ist dabei keine Namensliste, sondern die Tür: Ein Modul
  kommt auf genau zwei Wegen an etwas heran, das es nicht selbst erklärt hat — Einfuhr oder
  freier Name —, und beide sind jetzt festgenagelt. Beidseitig und je Gestalt einzeln gemessen,
  alle mit tsc Exit 0: K-7 vorher 130/0 grün, nachher 144/1 an drei Sätzen von 6h; Z-2 und Z-3
  vorher 130/0 grün, nachher je 144/1 an 6i; K-4 vorher 130/0 grün, nachher 144/1 an zwei Sätzen
  von 6j. Am Leser gegengemessen: 6h abgeschaltet 140/5, 6i 141/4, 6j 140/5 — 5+4+5=14, und 14
  ist die Zahl der neuen Gegenproben. Nullpunkt 130/0 vorher, 145/0 nachher, in Arbeitsbaum und
  Meßkopie. Im Kopf des Laufs steht jetzt der berichtigte Beleg: die alte Fassung samt Irrtum
  (T-335s eigenes Gegenbeispiel ist heute rot) neben der heutigen (T-337 K-7), und daraus die
  Regel — ein Literal, das als Literal geprüft, aber nicht gelesen wird, ist eine Stelle, an der
  jede Schreibweise durchkommt.
Annahmen: (1) Die Nummern A-A-110/A-A-111 sind im Auftrag gegenüber dem Bedrohungsmodell 43.9
  vertauscht beschriftet; ich bin dem Bedrohungsmodell gefolgt und habe beide gebaut, weil K-7
  ohnehin zu den drei Gestalten aus Punkt 1 gehört. A-A-106 habe ich nicht gebaut — es ist der
  einzige der drei, der in src/** liegt. (2) 6i verlangt eine Bestätigung bei jedem neuen
  Laufzeitnamen in den beiden Modulen; das ist der größte der drei neuen Preise und gewollt.
  (3) Eine Zeile in Abschnitt 0 ist dazugekommen — die Differenz „Gesamtzahl minus erwartet"
  steigt damit von 34 auf 35, und der Grund steht im Quelltext.
Risiken: A-A-106 bleibt offen und ist unverändert der einzige Hebel, der diese Klasse am
  Verhalten statt an Zeichen mißt. Die Klasse „die Meldung kommt nicht an" ist halb offen:
  derselbe Ausschalter wirkt auch im Rumpf von `current()`, in der Route und in der Oberfläche,
  und dorthin reicht kein Satz dieses Laufs. Drei Zeichenvergleiche statt einem erhöhen die Zahl
  der Läufe, die als „muß ich bestätigen" gelesen werden müssen; jede Meldung nennt deshalb ihren
  Bestätigungsort. Sicherheitsseitig nichts Neues — keine Adresse, keine Route, kein Datenweg.
Offene Fragen: (1) Welche Beschriftung von A-A-110/A-A-111 gilt? (2) Der Satz in
  packages/storage/src/sqlite/repo-version-check.ts:78 fehlt weiterhin und lag außerhalb meiner
  Dateihoheit — eigene Welle, und dazu gehört jetzt ein gleichartiger Satz in composition.ts.
  (3) Die Prüfgröße 34 → 35. (4) TP-VER-10 als benannte Gegenprobe der Klasse R-33 verknüpfen
  (e2e-tester). (5) ~/.cache/t332* und die fremden Meßkopien im Kratzbereich brauchen eine
  Freigabe.
Nächster Schritt: (a) A-A-106 als eigener Auftrag — Leser und Bauender in aufeinanderfolgenden
  Wellen, weil er `CHECKER_AWAITED_BEFORE_REQUEST` ändert. (b) Der zweite, kleine Lauf über den
  Weg von `versionState` bis zum Dialog, vier Sätze, eigene Welle (zwei Hoheiten). (c) Die zwei
  Sätze in repo-version-check.ts und composition.ts. (d) R-30 fortschreiben, R-33 halbieren —
  Wortlaute stehen in Abschnitt 5.
```
