# T-123 — Das Add-in liest die Zeichenklasse, statt sie zu führen

Auftrag: die drei Punkte aus T-119 (Regression), T-122 (Vertrag der geteilten Fassung) und
T-117 R1 (unvollständige Beschreibungen).
Stand vor der Arbeit: Branch `status-als-regelterm`, Commit `c96a2b2`.
Datum: 2026-09-04. Verantwortlich: integration-dev.

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (E-045, E-053, E-063), die eigenen Berichte
T-114 und T-119, dazu T-122 Abschnitt 1 („Der Vertrag für integration-dev").

---

## 1. Punkt 1 — `hidden.ts` liest, statt zu führen

`apps/outlook-addin/src/text/hidden.ts` ist eine **reine Wiederausfuhr**. Die Datei enthält keine
Zeichen, keine Bereiche und keinen Ausdruck mehr, sondern vier Namen:

```ts
export {
  HIDDEN_MARKER,
  dropHiddenCharacters as dropHidden,
  hasHiddenCharacter as hasHidden,
  visibleText,
} from '@takt/domain';
```

Die Zuordnung ist die aus T-122, eins zu eins. `HIDDEN_SOURCE`, `HIDDEN_ALL`, `HIDDEN_ANY` und
die örtliche `CONTROL_WHITESPACE` sind ersatzlos weg.

**Die Namen bleiben die des Add-ins**, und das ist eine Entscheidung mit einem harten Grund:
`apps/outlook-addin/test/text/hidden.test.ts` gehört dem unit-tester und liegt seit T-121 im
Typprüfpfad (`tsconfig.test.json`). Die Datei unter ihren heutigen Namen zu lassen hält
`pnpm typecheck:test` und `pnpm test` grün, ohne fremde Hoheit zu berühren — genau der Weg, den
T-122 offene Frage 5 vorschlägt.

**Die Anzeige markiert weiter und streicht nicht** (E-063 Punkt 2). Sie tut es jetzt mit der
Funktion der Domäne; `visibleText` setzt `U+FFFD` an die Stelle jedes Zeichens der Klasse und ein
Leerzeichen an die Stelle des C0-Leerraums, die Länge bleibt erhalten. Gemessen, nicht angenommen:
`proof:addin` prüft die Länge des Trickbetreffs, die Unverletztheit rechtsläufiger Schrift und die
Marke selbst; die 837 Tests laufen unverändert durch.

### Was mitgezogen ist

| Datei | Was |
|---|---|
| `src/office/mail.ts` | Der Kopfkommentar behauptete „eine Fassung im Add-in". Das ist seit heute falsch; er nennt jetzt den einen Ort und die Bauart des Nachweises. |
| `src/ui/Primitives.tsx` | Der Verweis auf die Begründung zeigt zusätzlich auf die Quelle. |

### `cut.ts` — geprüft, führt nichts doppelt

`cutToCharacterBoundary` kennt genau eine Zahlengrenze: `U+D800` bis `U+DBFF`, die **hohen
Ersatzstellen**. Das ist keine Regel von Takt, sondern die Definition von UTF-16; die Domäne
kennt sie nicht und soll sie nicht kennen (sie hat keine Schnittfunktion, und `for…of` läuft dort
ohnehin über Codepunkte). Es gibt also nichts mitzuziehen — die Datei bleibt, wie sie ist. Der
**Deckel** `MAX_TITLE_CHARACTERS = 500` in `mail.ts` ist die letzte Zahl, die zweimal im Baum
steht; sie ist gemessen und nicht abgeschrieben (Abschnitt 16 hält sie gegen das Schema des
Dienstes), und ein Vorschlag dazu steht unter „Offene Fragen".

---

## 2. Punkt 2 — die beiden Nachweisabschnitte

### Was weg ist

| Weg | Warum |
|---|---|
| `ABGEWIESENE_ZEICHEN` — 20 abgeschriebene Codepunkte (Abschnitt 16) | **Die Liste, die T-117 verschlafen hat.** Sie entsteht jetzt bei jedem Lauf aus `FORBIDDEN_NAME_CHARACTERS`: 77 Zeichen, ausgerollte Bereiche, nichts zu pflegen. |
| BMP-Vergleich „Add-in-Klasse gegen Türklasse" (17) | Eine Quelle. Der Vergleich kann nur noch grün sein — und das ist die schlimmste Sorte grün: eine, die aussieht wie eine Messung. |
| BMP-Vergleich „`dropHidden`/`visibleText` gegen die Türklasse" (17) | Dasselbe. Beide Funktionen **sind** die der Domäne. |
| „Gegenprobe: die Fassung vor T-119" (17) | Sie baute die alte Klasse im Nachweis **nach**. Damit stand die Abschrift wieder da, nur eine Datei weiter — und hätte bei der nächsten Erweiterung gepflegt werden müssen. |
| Ein zweiter Kommentarschneider (`ohneKommentare`) | Stand neben `sourceWithoutComments` aus Abschnitt 0. In einer Datei, deren Thema die doppelte Fassung ist. |
| `istLeerraum` als `0x0009 … 0x000d` | Die letzte kleine Abschrift; liest jetzt `CONTROL_WHITESPACE` aus der Domäne. Der security-checker hat sie in 17.9 benannt. |

### Was neu ist — die Frage „dieselbe Quelle?" statt „dasselbe Ergebnis?"

**1. Gleichheit der Objekte.** `assert.equal(dropHidden, dropHiddenCharacters)` und dreimal
dasselbe. `equal` und nicht `deepEqual`: Zwei Funktionen, die sich gleich verhalten, sind zwei
Funktionen und können sich beim nächsten Mal verschieden verhalten — genau das ist zwischen T-117
und T-119 geschehen. Zwei Namen für **ein** Objekt können das nicht.

**2. Kein zweiter Träger im Quelltext.** Eine statische Suche über alle `.ts`/`.tsx` des
Aufgabenbereichs (ohne Kommentare) nach Escape-Folgen aus dem Wertebereich der Klasse, dazu die
Zusicherung, dass `hidden.ts` `@takt/domain` liest. Die erste Zeile bemerkt eine Umleitung, die
zweite eine daneben angelegte Kopie; einzeln ist keine von beiden die Aussage „eine Quelle".

**3. Die Beschreibung zählt nicht mit** (siehe Punkt 3).

### Was ich vom Zeichenvergleich behalten habe, und warum

| Behalten | Warum es keine Tautologie ist |
|---|---|
| **Der BMP-Scan gegen die Tür** — jetzt für **beide** Türen und **beide** Felder, je gegen `FORBIDDEN_NAME_CHARACTERS` statt gegeneinander | Er misst nicht die Klasse, sondern die **Bindung**: ob `zod` sie an `title` und `tagNames` tatsächlich anwendet. Die kann jemand lösen, ohne die Klasse anzufassen — Gegenprobe B unten tut genau das und macht ihn rot. Gegen die Quelle statt gegeneinander, weil zwei Türen gemeinsam falsch liegen können; dass sie einander gleichen, **folgt** jetzt und wird nicht gemessen. |
| **`suggestTitle` über jedes Zeichen der Klasse** | Gemessen wird nicht die Klasse, sondern was `suggestTitle` um sie herum tut: Vorsilben abschneiden, Leerraum zusammenziehen, auf 500 kürzen, trimmen. Jeder Schritt kann einen Vorschlag erzeugen, den die Tür abweist — die Sackgasse aus T-114. |
| **`ANGENOMMENE_ZEICHEN`, weiter von Hand** (9 Zeichen) | Keine Abschrift der Klasse, sondern eine **Anforderung an sie**: Diese Zeichen müssen eintragbar bleiben. Aus der Domäne erzeugt wäre die Liste wertlos — sie wüchse mit, wenn die Klasse in die falsche Richtung wächst, und genau dann soll sie rot werden. Neu dabei: keiner ihrer Codepunkte darf in der Klasse stehen. |
| **Ein Zeichen statt 77 für E-063 Punkt 2** — der Trickbetreff, die Marke, der Leerraum, rechtsläufige Schrift | Das ist die lesbare Aussage der Regel, nicht ihr Umfang. Der Umfang gehört seit T-122 der Domäne. |
| **Die Klasse ist nicht leer und nicht alles** | Der Wächter vor allem übrigen: eine leere Klasse machte jede Schleife grün, eine zu breite eine Tür, die niemanden mehr hereinlässt. `U+200D` (ZWJ) und „ä" dürfen nicht darin stehen. |
| **Neu: welche Behandlung an welchem Ort** | Die einzige Frage zu E-063, die dem Add-in noch gehört. **Dass** beide Behandlungen die ganze Klasse erfassen, ist Sache der Domäne; **welche** wo steht, ist eine Entscheidung und ließe sich vertauschen, ohne dass in der Domäne eine Zeile rot würde. Eine Anzeige, die fallen lässt, verschweigt; ein Vorschlag, der markiert, setzt ein `U+FFFD` in ein Eingabefeld. |

### Die Zählung

`proof:addin` 164 → **165**. Abschnitt 16 wächst von 14 auf 17 (drei Türmessungen und der
Wächter statt zweier Listenvergleiche, dazu die Beschreibung), Abschnitt 17 schrumpft von 16 auf
14 (fünf entfernt, drei hinzugekommen).

---

## 3. Punkt 3 — T-117 R1, die Beschreibungen

Zeilennummern nachgemessen: `apps/local-api/src/routes/addin/schema.ts:88-93` stimmte,
`:2905`/`:2988` in der OpenAPI lagen nach Welle K bei `:2932` und `:3014`. Der Add-in-Abschnitt
der OpenAPI hatte die drei Marken bereits (in T-119 von Hand nachgetragen) — der Kommentar in
`schema.ts` nicht.

**Nachgetragen habe ich sie trotzdem nicht.** Der Auftrag verlangt eine Beschreibung, die nicht
wieder hinterherhinkt, und eine Aufzählung hinkt: Sie ist eine Abschrift, die nur nicht rot werden
kann. Beide Stellen **zeigen** jetzt, statt zu zählen:

- `schema.ts` nennt `FORBIDDEN_NAME_CHARACTERS` in `packages/domain/src/characters.ts` und
  schreibt den Befund dazu, warum hier nichts mehr aufgezählt steht. Der Absatz über `checkName`
  zählte ebenfalls Codepunkte auf; er sagt jetzt, was den Unterschied ausmacht (zwei Mengen für
  zwei Fragen), ohne beide zu zeichnen.
- Der Add-in-Abschnitt der OpenAPI nennt an `title` und `tagNames` denselben Ort und verweist auf
  die Antwort `422` (`UnprocessableEntity`), in der die Aufzählung **einmal** steht — und dort
  wird sie seit T-122 gegen die Klasse gemessen (`proof:openapi` Abschnitt 16). Der Hauptabschnitt
  ist unberührt (E-053); beide Hunks liegen unter `/addin/todos`.

**Und gemessen wird das Gegenteil des Üblichen:** dass im Add-in-Abschnitt **kein** Zeichen der
Klasse genannt ist. Der Nachweis liest die YAML-Datei mit dem Leser aus T-039, sammelt alle
`/addin`-Pfade und hält jeden Codepunkt der Domäne dagegen. Eine Beschreibung, die nichts
aufzählt, kann nicht hinterherhinken. Dazu die Gegenprobe zur Gegenprobe: Beide Felder müssen den
einen Ort nennen, und die Route muss die Antwort führen, in der die Zeichen stehen — ein Verweis
ins Leere wäre schlechter als die Aufzählung.

Der Wächter liegt in `proof:addin` und nicht in `proof:openapi`, weil der Abschnitt dem Add-in
gehört (E-053) — dieselbe Aufteilung wie bei den Routen. Damit ist auch der zweite der beiden
Wege aus dem Bedrohungsmodell (T-125-2) gegangen, und zwar der, den es selbst vorschlägt.

---

## 4. Gemessen, nicht angenommen

Jeder Befehl einzeln, Ausgabe in eine Datei umgeleitet, Endstatus unmittelbar danach gelesen —
keine Pipe (zsh `pipestatus`). Alle Läufe **nach** der letzten Änderung.

| Befehl | Endstatus | Ergebnis | Marke |
|---|---|---|---|
| `pnpm typecheck` | **0** | alle Pakete, Testkonfigurationen, `tests/e2e` | — |
| `pnpm typecheck:test` | **0** | sieben Konfigurationen, einschließlich `apps/outlook-addin` | — |
| `pnpm test` | **0** | 56 Dateien, **837/837** | 837 — unverändert |
| `pnpm proof:addin` | **0** | **165** Prüfungen | 164 → +1 |
| `pnpm proof:all` | **0** | 13 Ketten, **880** Prüfungen | 879 → +1 |
| `pnpm boundaries` | **0** | „Notiz-Trennung: alle Schichten unverletzt" | — |
| `pnpm --filter @takt/outlook-addin build` | **0** | 238,68 kB (gzip 75,89) | 238,27 kB → +0,41 kB |

Die 0,41 kB sind der Preis der geteilten Fassung: Codepunktschleifen sind etwas größer als zwei
reguläre Ausdrücke. Dafür ist die zweite Fassung weg — das ist der Tausch, und er ist es wert.

**Ports 17843/17844 vor und nach jedem Lauf nachgesehen, durchgehend frei.** Kein `git commit`,
kein `stash`, kein `checkout`, kein fremder Prozess beendet.

### Drei Gegenproben, damit „grün" etwas heißt

Jede in meiner eigenen Hoheit, jede Datei vorher gesichert und danach über `sha256sum -c`
**bytegleich** wiederhergestellt.

**A — die Fassung vor T-123 wieder eingesetzt** (`hidden.ts` mit eigener Klasse, zeichengleich):

```
163 ok, 2 FEHL
  FEHL  das Add-in liest die Zeichenklasse — dieselben Objekte, keine zweite Fassung
        + [Function: dropHidden]  - [Function: dropHiddenCharacters]
  FEHL  keine Quelldatei des Add-ins führt eine eigene Fassung der Klasse
        eigene Fassung der Klasse in: text/hidden.ts
```

**Das ist die Messung, um die es in dieser Aufgabe geht.** Die Kopie verhält sich zeichengleich —
und **jede** der 163 verhaltensprüfenden Zeilen bleibt grün. Nur die beiden neuen sehen sie. Genau
so hat T-117 fünf Wellen überlebt: Ein Nachweis, der Ergebnisse vergleicht, kann eine zweite
Fassung nicht sehen, solange sie noch stimmt. Er wird erst rot, wenn sie schon falsch ist.

**B — die Bindung an der Add-in-Tür gelöst** (`title: z.string().trim().min(1).max(500)` statt
`titleSchema`): drei rote Zeilen, darunter der BMP-Scan („die Tür und die Domäne sagen nicht
dasselbe"). Die Zeile über den Titelvorschlag blieb dabei grün — richtig, sie misst etwas anderes.

**C — eine Aufzählung in den Add-in-Abschnitt der OpenAPI zurückgeschrieben** (`U+202A bis
U+202E` an `title`): rot, mit `['U+202A', 'U+202E']` als Fund.

### Hygiene

Eigene Messung über alle sieben berührten Dateien: **kein** rohes Steuer-, Richtungs- oder
unsichtbares Zeichen (T-112-H2). Zweimal hat mich der Werkzeughaken beim Bau der Gegenprobe A
gestoppt, weil rohe Zeichen in meiner Kommandozeile standen; sie ist danach vollständig aus
Escape-Folgen gebaut. Keine echte Call-Nummer, kein Kundenname, keine Zugangsdaten — die
Prüfdaten sind „Störung Lüftung", „Rechnung…gnp.exe" und `TCK-000042`.

---

## 5. Artefakte

| Datei | Was |
|---|---|
| `apps/outlook-addin/src/text/hidden.ts` | reine Wiederausfuhr aus `@takt/domain`; die eigene Klasse ist weg, die Begründung zeigt auf die Quelle |
| `apps/outlook-addin/src/office/mail.ts` | Kopfkommentar berichtigt: eine Quelle, gemessen als Gleichheit der Objekte |
| `apps/outlook-addin/src/ui/Primitives.tsx` | Verweis auf die Quelle der Begründung |
| `apps/outlook-addin/scripts/proof-addin.mjs` | Abschnitt 16 neu gefasst (Klasse aus der Domäne, BMP-Scan je Tür, Beschreibungswächter), Abschnitt 17 auf die Frage „dieselbe Quelle?" umgestellt; `istLeerraum` liest `CONTROL_WHITESPACE`; ein doppelter Kommentarschneider entfernt |
| `apps/local-api/src/routes/addin/schema.ts` | die Zeichenklasse wird nicht mehr aufgezählt, sondern verortet (T-117 R1) |
| `apps/local-api/openapi/takt-local-api.yaml` (**nur** Add-in-Abschnitt, E-053) | `title` und `tagNames` unter `POST /addin/todos` zeigen auf den einen Ort und auf `UnprocessableEntity`, statt die Klasse zu wiederholen |
| `.claude/team/reports/T-123-integration-dev.md` | dieser Bericht |

**Keine fremde Datei angefasst.** `packages/domain/**` ist gelesen und unverändert;
`apps/outlook-addin/test/**`, `apps/web/**`, `apps/desktop/**`, `docs/bedrohungsmodell.md`,
`apps/local-api/src/**` außer `routes/addin/` und der Hauptabschnitt der OpenAPI sind unberührt.
Der Arbeitsbaum trägt daneben Änderungen von frontend-dev und security-checker aus derselben
Welle; sie sind nicht meine.

---

## 6. Annahmen

1. **Die Add-in-Namen bleiben** (`dropHidden`, `hasHidden`, `visibleText`, `HIDDEN_MARKER`).
   Sie direkt durch die Domänennamen zu ersetzen hieße, `hidden.ts` zu löschen — und damit die
   Testdatei des unit-testers zu brechen, die seit T-121 im Typprüfpfad liegt und mir nicht
   gehört. Die Umbenennung ist der einzige Inhalt der Datei, und der Nachweis misst, dass sie
   nichts weiter tut.
2. **Ich habe die beiden Beschreibungen entzählt statt sie zu ergänzen.** Der Auftrag lässt
   beides zu („so, dass die Beschreibung nicht wieder hinterherhinkt"). Eine gemessene Aufzählung
   wäre der andere Weg; sie steht bereits einmal im Baum (`UnprocessableEntity`), und ein zweites
   Mal dieselbe Prosa zu messen hätte den Wächter verdoppelt statt die Abschrift beseitigt.
3. **Der Beschreibungswächter liegt in `proof:addin`.** `proof:openapi` gehört domain-dev; der
   Add-in-Abschnitt der Beschreibung gehört mir (E-053). Ich habe den Leser aus T-039 eingeführt
   und nicht nachgebaut.
4. **`istLeerraum` habe ich ungefragt mitgenommen.** Es stand nicht im Auftrag, ist aber dieselbe
   Bauart in derselben Datei und vom security-checker in 17.9 benannt. Zwei Zeilen.
5. **Ein Zeichen statt 77 in Abschnitt 17.** Wo eine Regel illustriert wird und nicht ihr Umfang
   gemessen, steht jetzt ein einzelnes Zeichen. Der Umfang gehört der Domäne; ihn hier ein zweites
   Mal auszumessen wäre dieselbe Doppelung in Grün.

---

## 7. Risiken

**R1 — Der Nachweis prüft jetzt eine Bauart, nicht nur ein Verhalten.** Die statische Suche nach
Escape-Folgen findet die Form, in der die Klasse je im Baum stand. Sie fände **keine** zweite
Fassung, die roh geschriebene Zeichen benutzt oder ihre Codepunkte ausrechnet. Dagegen steht die
Gleichheit der Objekte (eine solche Fassung müsste benutzt werden, um zu schaden) und die
Quelltexthygiene aus Abschnitt 0. Vollständig ist keine der beiden allein; das ist gesagt und
nicht behauptet.

**R2 — Sicherheit, unverändert und benannt:** Das **Vermerkfeld** zeigt den übernommenen
E-Mail-Text weiterhin, wie er ist (`textarea`, E-063 Punkt 1). Der Text geht nach `todo.note` —
intern, nie in den Export (A-7.2) — und wird in der Hauptanwendung angezeigt. Das ist dieselbe
offene Frage wie in T-119 und gehört frontend-dev.

**R3 — Altbestand, unverändert:** Vor T-114 angelegte Titel können die Zeichen tragen. Sie werden
angezeigt (mit Marke, isoliert) und beim nächsten `PATCH` mit 422 abgewiesen. Die Begründung steht
seit T-122 an der Klasse.

**R4 — Das Bündel wächst um 0,41 kB.** Kein Risiko im engeren Sinn, aber die messbare Folge:
Der Aufgabenbereich trägt jetzt `characters.ts` mit. Die Datei importiert nichts und zieht nichts
nach; gemessen, nicht angenommen.

**R5 — Ein Verweis kann veralten, wo eine Aufzählung falsch würde.** Meine Beschreibungen zeigen
auf `packages/domain/src/characters.ts` und auf `UnprocessableEntity`. Zieht jemand die Klasse um
oder benennt die Antwort um, zeigt der Verweis ins Leere. Beide Enden sind gewacht — der Pfad in
`proof:addin`, die Antwort über den `$ref` derselben Zeile —, aber es ist eine andere
Fehlerquelle als vorher, und sie gehört genannt.

---

## 8. Offene Fragen

1. **`MAX_TITLE_CHARACTERS = 500` ist die letzte doppelte Wahrheit im Add-in.** Sie steht in
   `office/mail.ts` und in `titleSchema`; der Aufgabenbereich darf `@takt/local-api` nicht
   importieren. Sie ist **gemessen** (Abschnitt 16 hält beide gegeneinander) und damit nicht der
   T-117-Fall — aber die saubere Antwort wäre dieselbe wie bei der Klasse: eine Zahl in
   `packages/domain`, aus der `titleSchema` und das Add-in lesen. Das ist domain-dev und ein
   Auftrag, keine Handbewegung von mir.
2. **E-063 bekommt einen zweiten Nachsatz.** T-122 hat einen vorgeschlagen (Punkt 4 gilt für
   Prosa weiter). Meine Gegenprobe A liefert die Begründung dafür in einer Zahl: 163 grüne
   Verhaltensprüfungen bemerken eine zeichengleiche zweite Fassung **nicht**. Vorschlag für den
   Wortlaut: „Wer zwei Stellen zusammenhalten will, misst die Herkunft und nicht das Ergebnis —
   ein Ergebnisvergleich wird erst rot, wenn die Doppelung schon falsch ist." `decisions.md`
   gehört dem Orchestrator.
3. **Das Bedrohungsmodell nennt eine Abschnittsnummer, die sich verschoben hat.**
   `docs/bedrohungsmodell.md` 17.9 sagt „die Tür durch den BMP-Scan in `proof:addin` 17"; der
   Scan liegt seit heute in Abschnitt **16**. Die Datei gehört dem security-checker, der parallel
   darin arbeitet — deshalb nur der Hinweis. Die drei Befunde T-125-1, -2 und -3 sind mit diesem
   Diff eingelöst, und zwar so, wie sie es vorschlagen.
4. **`apps/outlook-addin/test/text/hidden.test.ts` misst jetzt die Domäne unter Add-in-Namen.**
   Sie bleibt gültig und grün. Der unit-tester ersetzt sie laut Planung in der nächsten Welle;
   aus meiner Sicht ist der Ersatz keine Pflicht, sondern eine Aufräumarbeit — die Randmessung ist
   doppelt, aber nicht falsch.

---

## 9. Nächster Schritt

1. **Zur Freigabe** an Code-Reviewer und security-checker. Für den security-checker ist Gegenprobe
   A der Punkt: Sie beziffert, warum ein Ergebnisvergleich als Wächter über eine Doppelung nicht
   taugt, und schließt seine Befunde T-125-1 bis -3.
2. **Danach Frage 1** (`MAX_TITLE_CHARACTERS` in die Domäne) als kleine Aufgabe an domain-dev,
   mit demselben Muster wie T-122.
3. **Unabhängig davon** bleibt die Anzeige der Notiz in `apps/web/**` offen (R2) — der letzte
   Punkt aus T-119, der noch niemandem zugeteilt ist.

---

## 10. Kurzfassung

```
Aufgabe: T-123 — Das Add-in liest die Zeichenklasse, statt sie zu führen
Status: fertig

Artefakte:
  apps/outlook-addin/src/text/hidden.ts          (reine Wiederausfuhr aus @takt/domain)
  apps/outlook-addin/src/office/mail.ts          (Kopfkommentar berichtigt)
  apps/outlook-addin/src/ui/Primitives.tsx       (Verweis auf die Quelle)
  apps/outlook-addin/scripts/proof-addin.mjs     (Abschnitte 16 und 17 neu gefasst)
  apps/local-api/src/routes/addin/schema.ts      (Klasse verortet statt aufgezählt)
  apps/local-api/openapi/takt-local-api.yaml     (nur Add-in-Abschnitt, E-053)
  .claude/team/reports/T-123-integration-dev.md

Zusammenfassung: `hidden.ts` führt die Zeichenklasse nicht mehr, sondern reicht
`dropHiddenCharacters`, `hasHiddenCharacter`, `visibleText` und `HIDDEN_MARKER` aus
`packages/domain/src/characters.ts` durch; die Anzeige markiert weiter und streicht nicht.
`cut.ts` bleibt unberührt — seine einzige Grenze ist die Definition von UTF-16 und keine Regel
von Takt. Die beiden Nachweisabschnitte fragen nicht mehr, ob zwei Fassungen dasselbe Ergebnis
liefern, sondern ob es zwei Fassungen gibt: Gleichheit der Objekte, kein zweiter Träger im
Quelltext, keine zweite Aufzählung in der Beschreibung. Vom Zeichenvergleich behalten habe ich
den BMP-Scan gegen jede der beiden Türen — er misst die zod-Bindung und nicht die Klasse — sowie
den Titelvorschlag über die ganze Klasse, weil dort die Schritte um sie herum gemessen werden.
Die Beschreibungen aus T-117 R1 zählen die Klasse nicht mehr auf, sondern verweisen auf den einen
Ort; dass sie es nicht tun, wird gemessen.

Annahmen:
  1. Die Add-in-Namen bleiben, damit die Testdatei des unit-testers (seit T-121 im Typprüfpfad)
     gültig bleibt — der Weg aus T-122 offene Frage 5.
  2. Die Beschreibungen wurden entzählt statt ergänzt. Eine Aufzählung ist eine Abschrift, die
     nur nicht rot werden kann; sie steht bereits einmal im Baum und wird dort gemessen.
  3. Der Wächter über den Add-in-Abschnitt der OpenAPI liegt in `proof:addin`, weil der Abschnitt
     dem Add-in gehört (E-053).
  4. `istLeerraum` liest jetzt ebenfalls die Domäne — ungefragt, zwei Zeilen, vom
     security-checker benannt.
  5. Wo eine Regel illustriert wird, steht ein Zeichen statt 77. Der Umfang gehört der Domäne.

Risiken:
  - Die statische Suche findet die Bauart, in der die Klasse je im Baum stand — nicht jede
    denkbare zweite Fassung. Dagegen steht die Gleichheit der Objekte.
  - Sicherheit, offen und unverändert: Das Vermerkfeld zeigt E-Mail-Text roh (E-063 Punkt 1); die
    Anzeige der Notiz in `apps/web/**` ist dieselbe Frage eine Fläche weiter (frontend-dev).
  - Altbestand unverändert: vor T-114 angelegte Titel werden angezeigt und beim PATCH abgewiesen.
  - Das Add-in-Bündel wächst um 0,41 kB auf 238,68 kB.
  - Ein Verweis kann ins Leere zeigen, wo eine Aufzählung falsch würde — beide Enden sind
    gewacht, aber es ist eine andere Fehlerquelle.

Offene Fragen:
  1. `MAX_TITLE_CHARACTERS = 500` ist die letzte doppelte Wahrheit im Add-in — gemessen, aber
     doppelt. Eine Zahl in `packages/domain` wäre die saubere Antwort (domain-dev).
  2. E-063 verträgt einen Nachsatz: Gegenprobe A zeigt, dass 163 Verhaltensprüfungen eine
     zeichengleiche zweite Fassung nicht bemerken. Wortlautvorschlag im Bericht.
  3. `docs/bedrohungsmodell.md` 17.9 nennt „proof:addin 17" für den BMP-Scan; er liegt jetzt in
     16. Datei gehört dem security-checker, deshalb nur der Hinweis. T-125-1 bis -3 sind eingelöst.
  4. Die Testdatei des unit-testers misst jetzt die Domäne unter Add-in-Namen — gültig und grün,
     der Ersatz ist Aufräumarbeit und keine Pflicht.

Nächster Schritt:
  Freigabe durch Code-Reviewer und security-checker; für Letzteren ist Gegenprobe A der Punkt.
  Danach `MAX_TITLE_CHARACTERS` in die Domäne (domain-dev) und die Anzeige der Notiz in
  `apps/web/**` (frontend-dev, seit T-119 offen).
```
