# T-211 — Ein Zustand mit einem Namen, ein Satz, den es nicht gab

**Rolle:** ux-designer **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `.claude/team/reports/T-200-spec-ux-reviewer.md` (vollständig, einschließlich
Abschnitt 9 / Z-56 bis Z-60), `T-207-frontend-dev.md`, `T-203-ux-designer.md`,
`docs/design/textbestand.md`, `CLAUDE.md`, und am Baum: `app/TimerContext.tsx`, `app/dayGroup.ts`,
`screens/BookingDialogs.tsx`, `screens/PoolRenameDialog.tsx`, `screens/BoardScreen.tsx`,
`components/ConfirmDialog.tsx`, `components/FormDialog.tsx`, `lib/fieldMessages.ts`, `lib/focus.ts`,
`tests/e2e/timer-stop-announcement.spec.ts`.

```
Aufgabe: T-211 — Z-57 Auflage 1 (L3: gleicher Wortlaut oder begründeter Unterschied),
         Z-57 Auflage 2 (L3 als Regelfall an fünf Flächen), Z-58 (Berichtigung an 12.4),
         T-207 Offene Frage 2 (der Wortlaut, den es nicht gibt), Z-60 (SP-22)
Status: braucht Review — Abschnitt 13 ist eine Vorlage und wird von spec-ux-reviewer
        genehmigt (E-078 Punkt 3). Abschnitt 12 ist damit vollständig baubar.
```

| Gegenstand | Ergebnis |
|---|---|
| **Z-57 Auflage 1** — L3 | **angeglichen.** Titel: „Buchung geändert — der Exportwert ließ sich nicht abfragen." Die Fassung „Exportwert unbekannt." ist zurückgezogen |
| die Regel dahinter | **S-13a — Anlaß und Lage.** Der Anlaß gehört der Fläche, die Lage dem Zustand. „aber" gehört zum Anlaß — **L2 bleibt damit unverändert wie freigegeben** |
| **Z-58** — Berichtigung | **nachgezogen**, und für L3 mitgedacht: dort bleiben **zwei** Klammern beim Stopp, nicht eine |
| **Z-57 Auflage 2** — Regelfall | **benannt, gebaut wird wie vorgelegt.** Dazu eine Bedingung (der Satz des Dienstes steht immer ungekürzt) und eine **Wiedervorlage mit Auslöser** |
| **T-207 OF 2** — der fehlende Satz | **verfaßt:** „Es gibt nichts zu speichern. Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den Dialog." Dazu Regel **S-15** und sieben verworfene Fassungen mit Begründung |
| **Z-60** — SP-22 | **erledigt, und nicht von mir.** Die Karte ist mit T-209 gefallen, frontend-dev hat das Datum im selben Auftrag nachgetragen. Ich habe es **am Baum gegengemessen**, nicht geglaubt |

---

## 1. Die Auflage zu L3 — entschieden: angleichen

**Der Titel lautet künftig „Buchung geändert — der Exportwert ließ sich nicht abfragen."**

Es ist derselbe Zustand, erkannt an derselben Bedingung (`previewProblem !== null`), aus demselben
Aufruf — und der **Rumpf war ohnehin schon derselbe Satz**. Ein gemeinsamer Rumpf unter zwei
verschiedenen Titeln ist die unangenehmste Hälfte von „ein Zustand, zwei Formulierungen".

**Die Richtung war die eigentliche Entscheidung, nicht das Ob.** Man könnte auch den Stopp auf die
kürzere Fassung umstellen; das wäre der kürzere Titel. Ich habe dagegen entschieden, und der dritte
Grund ist der, der zählt:

1. Der Bestand hat den Wortlaut zuerst (seit T-045, geprüft). Die neue Fläche ist der Zugang, nicht
   der Maßstab.
2. AK 7 schützt den Stopp ausdrücklich: *„er ist die Vorlage, nicht der Gegenstand."* Ihn
   mitzuändern wäre Z-58 eine Ebene weiter — die falsche Hälfte wandert.
3. **Es blockiert etwas, das gerade frei ist.** Eine Änderung am Stopp bräuchte eine eigene Vorlage
   und eine eigene Freigabe; Z-49 ist seit gestern abend **nicht** mehr blockierend. Ich nehme
   einen freigegebenen Auftrag nicht zurück in die Warteschlange, um vier Wörter zu sparen.

**Der Preis steht im Papier und nicht in einer Fußnote:** Der Titel wächst von vier auf acht
Wörter und überschreitet damit die sechs aus S-13. S-13a löst das nicht durch eine Ausnahme,
sondern durch eine Unterscheidung: Die Lage-Hälfte ist **zitiert**, nicht formuliert, und wird
deshalb nicht gekürzt. Der Anlaß bleibt bei zwei Wörtern.

**Die Regel, damit die nächste Fläche nicht wieder entscheidet (S-13a).** Titelform
`〈Anlaß〉 — 〈Lage〉.` Anlaß gehört der Fläche, Lage dem Zustand; gibt es die Lage schon, weicht die
neue Fläche ihr; eine Verknüpfung („aber") gehört zum Anlaß. **Der letzte Punkt ist der, der Z-57s
Freigabe von L2 unangetastet läßt:** „… — aber noch nicht abrechenbar." und „Buchung geändert —
noch nicht abrechenbar." sind **nicht** zwei Wortlaute. Die Lage heißt in beiden „noch nicht
abrechenbar"; das „aber" setzt sie gegen einen Anlaß, den der Nachtragsweg nicht hat.

## 2. Z-58 — und die Berichtigung trägt weiter, als sie gestellt war

Der Prüfer hat recht: „zeichengleich der Rumpf des Stoppdialogs" war zu weit. Nachgezogen in 12.4
und in AK 7 — **und für L3 mitgedacht**, wo es einen Satz mehr betrifft:

| Fläche | bleibt davor | wandert zeichengleich | bleibt dahinter |
|---|---|---|---|
| Stopp L2 | „Gebucht: 1 h 20 min." | das **Satzpaar** | — |
| Stopp L3 | „Gebucht: 1 h 20 min." | der **eine Lagesatz** | „Die erfasste Zeit steht fest; der gerundete Wert steht in der Export-Ansicht." |

Daraus die allgemeine Fassung, die beide Ebenen zusammenbindet: **Zeichengleich wandert die Lage.
Bei ihrer Fläche bleibt, was den Anlaß nennt und was auf einen Ort verweist.**

Für den Verweissatz brauchte ich zwei Begründungen, nicht eine — er hat zwei Hälften: *„Die
erfasste Zeit steht fest"* ist am Nachtragsweg **D** zum Titel („Buchung geändert."), und *„der
gerundete Wert steht in der Export-Ansicht"* ist ein **Rückweg in Worten**, über den 12.4 bereits
entschieden hat (kein Rückweg am Toast) — an zwei der fünf Aufrufstellen obendrein **S**.

## 3. Z-57 Auflage 2 — der Regelfall, und was ich dagegen tun kann, ohne eine Bauart zu erfinden

Am Baum bestätigt: Der `catch` in `dayGroup.ts` liefert `blockedReason: null` **mit**
`previewProblem` — ohne Vorlage oder Exportordner ist also **L3**, nicht L4. In einem frisch
eingerichteten Takt ist L3 damit die Antwort auf jede Buchungsänderung, an fünf Flächen statt an
einer.

**Gebaut wird trotzdem wie vorgelegt** (die Fassung sagt Wahres; die saubere Trennung müßte der
Dienst liefern; Gleichlauf schlägt eine zweite Sonderregel). Zwei Dinge nehme ich mit:

- **Eine Bedingung, die den Regelfall erträglich macht, ohne neue Mechanik:** *Der Satz des
  Dienstes steht in L3 immer, wörtlich und ungekürzt.* Im Regelfall ist genau er die einzige
  brauchbare Auskunft — er nennt den fehlenden Exportordner und damit die nächste Handlung. **Eine
  Warnung, die ihren Grund mitbringt, wird langsamer zur Tapete als eine, die ihn verschweigt.**
- **Was niemand beim Bauen einfügen darf:** kein „Nicht mehr anzeigen", keine Zählung, keine
  Unterdrückung nach der ersten Meldung je Sitzung. Das steht ausdrücklich da, weil es die
  naheliegende und falsche Antwort auf „zu oft" ist.

**Die Wiedervorlage hat einen Auslöser statt eines „später":** Sobald „Export nicht eingerichtet"
gegen „Abfrage fehlgeschlagen" getrennt ist (T-200 Offene Frage 5), zerfällt L3 in zwei Lagen und
**beide** Titel werden ohnehin neu geschrieben. Dann ist „lang oder kurz" für Stopp und
Nachtragsweg **zusammen** zu entscheiden.

## 4. Der Satz, den es nicht gab (Abschnitt 13)

> **Es gibt nichts zu speichern. Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den
> Dialog.**

**Satz 1 ist neu; Satz 2 und 3 sind der heutige Hinweis aus `PoolRenameDialog`, zeichengleich.**
Gebaut wird **ein** Baustein: die Absage ist `"Es gibt nichts zu speichern. "` **plus** der
vorhandene Hinweis. Damit entsteht keine zweite Fassung, die später auseinanderläuft — dieselbe
Disziplin, die Z-58 für den Stopprumpf verlangt.

**Warum überhaupt ein zusätzlicher Satz und nicht der Hinweis allein:** Der Grund steht schon da;
was fehlt, ist die **Antwort auf den Druck**. Eine unveränderte Zeichenkette wird nicht erneut
angesagt, und ein nativ `disabled` Knopf steht gar nicht erst im Tabulatorlauf (Messung aus 5.1 /
SP-19; `ConfirmDialog` nennt seit T-186 genau diesen Grund für seinen eigenen Umbau). Wer drückt
und denselben Satz wie vorher liest, weiß nicht, ob der Druck angekommen ist — **der stille
Zustandswechsel in seiner mildesten Form.**

**Sieben Fassungen sind verworfen, jede mit Begründung** (im Papier als Tabelle): „Name fehlt."
(falsch — gefüllt), „Ungültiger Name." (falsch — es ist der gespeicherte), „Sie haben nichts
geändert." (Tadel für keinen Fehler), „Bitte …" (steht nirgends in Takt), „Keine Änderung erkannt."
(„erkannt" verspricht eine Messung, die schiefgehen kann), „Speichern nicht möglich." (falsche
Richtung — möglich wäre es), und der Hinweis allein.

Daraus die Vorlage für den nächsten Fall — Umbenennen gibt es an Tags, Ordnern, Status, Vorlagen
und Regeln —, als **Regel S-15**: *„Es gibt nichts zu 〈Wort des Absendeknopfes〉. " + der vorhandene
Hinweis zu dieser Sperre.*

**Ausdrücklich nicht entschieden:** ob umgebaut wird. Das ist T-207 Offene Frage 1. Ich habe dazu
**einen** Punkt beigetragen, weil er in meine Fläche fällt: frontend-dev sieht für **Sorte A**
keinen Gewinn — das trifft für die **Auskunft** zu, für die **Erreichbarkeit** nicht. Der Gewinn
bei Sorte A ist nicht der Satz, sondern der Knopf; der Satz ist das, was ihn danach nicht stumm
läßt. Für **Sorte C** teile ich seinen Vorschlag (dauerhafter Hinweis statt Umbau).

## 5. SP-22 — die Pflichtangabe ist da, und ich habe sie nachgemessen statt sie zu glauben

Der Auftrag sagte: *„sieh nach, ob es angekommen ist, statt es anzunehmen."* Das war die richtige
Anweisung, und sie hat sich zweimal ausgezahlt.

**Erste Messung** (früh in dieser Aufgabe): Die Karte stand noch in `BoardScreen.tsx`. Ich hatte
den Nachtrag bereits mit „der Fall steht weiterhin aus" geschrieben.

**Zweite Messung** (nach einer Schreibkollision an meiner eigenen Datei, siehe Risiko 1): Die Karte
ist **gefallen** — `BoardScreen.tsx` und `app.css` führen den Fall im Kommentar, und
`board-setup__actions` ist mit ihr gegangen (Auflage 1 aus Z-54). frontend-dev hat das Datum
(2026-09-06, T-209) in SP-22 nachgetragen, in demselben Auftrag, wie E-081 Punkt 4 es verlangt.

**Meine eigene Nachtragszeile war damit eine Welle lang falsch** und ist berichtigt. Das ist genau
der Fall, den E-087 beschreibt — eine Papierzahl, die eine Stunde später nicht mehr stimmt —, nur
diesmal an mir selbst. Der Eintrag trägt jetzt zusätzlich meine Gegenmessung und den Hinweis, daß
nach Pflichtangabe 3 die **Aussage** gesperrt ist und der Zitatanfang nur Fundhilfe.

---

## Nachweis der Messungen (E-087)

Gemessen am **2026-09-06** mit ripgrep über den Arbeitsbaum. **Kein `git grep`** — dieser Durchgang
hatte keine Schale. Das ist die eine Hälfte des seit heute vorgeschriebenen Werkzeugs; die andere
fehlt und ist im Papier so benannt. Für diesen Fall trägt sie: alle betroffenen Dateien liegen im
Arbeitsbaum, und ripgrep sieht die unversionierten Quellen mit — genau die Hälfte, an der `git
grep` in T-207 blind war.

| Wortlaut | Produkt | `tests/**`, `apps/*/test/**` |
|---|---|---|
| „der Exportwert ließ sich nicht abfragen" | 1× `TimerContext.tsx` | **keine Zusicherung** |
| „aber noch nicht abrechenbar" | 1× `TimerContext.tsx` | keine Zusicherung — **aber ein Zitat im Kommentar** von `tests/e2e/timer-stop-announcement.spec.ts`. Es würde bei einer Änderung still veralten und nicht rot |
| „Was diese Tagesgruppe beim Export ergibt, …" | 1× `TimerContext.tsx` | keine |
| „Exportwert unbekannt" | nirgends | keine |
| „Der Name ist unverändert. …" | 1× `PoolRenameDialog.tsx` | keine |
| „Buchung geändert." / „Die Tagesgruppe dieses Todos ändert sich mit." | 1× / **2×** (`BookingDialogs.tsx`, `TodoDetailScreen.tsx`) | keine — bestätigt den Stand aus 12.8 |

Die zweite Zeile ist der Sachbeleg für meine Richtungsentscheidung: Eine Änderung am Stopp wäre
nicht nur ungenehmigt, sie wäre auch **stumm** falsch geworden.

---

## Annahmen

1. **Die Angleichungsrichtung ist meine Entscheidung, nicht die des Prüfers.** Er hat beides
   zugelassen (angleichen oder begründen) und ausdrücklich nicht vorgeschrieben. Daß der **Stopp**
   der Maßstab ist und nicht der kürzere Titel, ist mein Urteil und mit drei Gründen belegt.
2. **S-13a und S-15 sind neue Regeln in diesem Papier.** Sie beschreiben, was der Bestand ohnehin
   tut (drei Titel am Stopp, die Bauart von `ConfirmDialog.refusal`), aber sie stehen zum ersten
   Mal als Regel da. Wer sie für zu weit hält, muß sie ablehnen, bevor gebaut wird.
3. **Der Wortlaut aus Abschnitt 13 ist verfaßt, nicht genehmigt.** Nach E-078 Punkt 3 fehlt die
   Genehmigung durch spec-ux-reviewer.
4. **Ich habe keine Vorlesehilfe.** Alle Aussagen über Ansagen stützen sich auf die Bauart und auf
   die Messungen aus T-172 und T-186, nicht auf gehörte Sprache. Das ist dieselbe Grenze, die 5.1
   für SP-19 zieht.
5. Die fünf Aufrufstellen des `BookingFormDialog` übernehme ich aus 12.2 (Stand T-203) und habe sie
   in dieser Aufgabe **nicht** nachgezählt.

## Risiken

1. **Eine Schreibkollision an `docs/design/textbestand.md`, und sie ging gut aus.** Mitten in
   meiner Arbeit meldete das Werkzeug die Datei als von außen geändert; es war frontend-dev, der
   nach der Regel aus E-081 Punkt 4 (Streichung und Sperreintrag in **einem** Auftrag) das Datum in
   SP-22 nachgetragen hat. Sachlich richtig und von Z-60 so verlangt — **formal ein zweiter
   Schreiber in einer Datei meiner Hoheit.** Diesmal hat es keinen Verlust gegeben, weil unsere
   Änderungen an verschiedenen Zeilen lagen und ich vor jedem weiteren Schreiben nachgesehen habe.
   Die Regel und die Verzeichnishoheit widersprechen sich hier; das ist eine Frage an den
   Orchestrator (unten), keine, die ich mir selbst beantworte.
2. **Der angeglichene L3-Titel ist lang, und der Regelfall macht ihn häufig.** Acht Wörter, in
   einem frisch eingerichteten Takt nach jeder Buchungsänderung an fünf Flächen. Ich halte den
   Gleichlauf für das kleinere Übel, aber ich behaupte nicht, daß es keines ist. Die Wiedervorlage
   ist der Ort, an dem es fällt.
3. **S-13a kann als Freibrief für lange Titel gelesen werden.** Sie sagt „die Lage trägt keine
   Längengrenze, weil sie zitiert ist" — wer den ersten Wortlaut einer neuen Lage schreibt, hat
   keine Grenze über sich. Der Schutz ist, daß die **erste** Fassung nach S-13 entsteht und erst
   danach zitiert wird. Das steht im Papier, aber es ist eine Regel mit einer weichen Stelle.
4. **Abschnitt 13 kann als Argument für den Umbau gelesen werden, und das ist er nicht.** Ich habe
   den Satz verfaßt, damit die Entscheidung nicht an ihm hängt. Wird der Abschnitt als „ux-designer
   ist dafür" gelesen, ist die Reihenfolge verdreht.
5. **Sicherheit:** nichts berührt. Kein Export, kein Anhang, keine Adresse, keine Versionsprüfung.
   Der L3-Rumpf reicht den Satz des Dienstes wörtlich durch — das ist bestehende Bauart (S-10) und
   läuft wie bisher über die Behandlung fremden Textes; dieser Nachtrag ändert daran nichts und
   verlangt insbesondere **keine** Kürzung, die eine Prüfung umginge.

## Offene Fragen

1. **An spec-ux-reviewer:** Genehmigung des Wortlauts aus 13.3 und der Regel **S-15** (E-078
   Punkt 3). Dazu: Trägt **S-13a** in Ihrem Sinn, insbesondere die Einordnung des „aber" als
   Verknüpfung des Anlasses — davon hängt ab, ob L2 unverändert bleibt.
2. **An spec-ux-reviewer:** Ist die Begründung dafür ausreichend, daß der Verweissatz aus dem
   L3-Rumpf des Stopps **nicht** mitwandert, obwohl der Lagesatz es tut? Das ist die eine Stelle,
   an der die Angleichung eine Naht hat.
3. **An den Orchestrator:** `E-081 Punkt 4` (Streichung und Sperrlisteneintrag in **einem**
   Auftrag) und die Verzeichnishoheit über `docs/design/**` widersprechen sich, sobald der
   Sperreintrag in meinem Papier steht. Diese Welle hat es gutgehen lassen. Soll die Regel lauten:
   der bauende Agent **meldet** den Nachtrag und ux-designer schreibt ihn in der nächsten Welle —
   oder bleibt das Schreiben beim bauenden Agenten und die Hoheit bekommt eine benannte Ausnahme,
   wie sie `release.rs` schon hat?
4. **An den Orchestrator:** Die Wiedervorlage aus 12.9 hängt an T-200 Offener Frage 5 (Trennung
   „nicht eingerichtet" gegen „fehlgeschlagen", domain-dev/local-api). Solange die nicht auf dem
   Board steht, hat meine Wiedervorlage einen Auslöser, den niemand auslöst.

## Nächster Schritt

1. **Abschnitt 12 ist baubar** — mit den drei Nachträgen (L3-Titel, AK 3, AK 7 und 7a) und
   weiterhin zusammen mit Z-59 (Fokus) in **einem** Auftrag.
2. **Abschnitt 13 an spec-ux-reviewer**, zusammen mit T-207 Offener Frage 1. Erst sein Urteil, dann
   die Entscheidung über den Umbau, dann bauen — nicht in umgekehrter Reihenfolge.
3. **Der Kommentarzitat-Befund an unit-tester oder e2e-tester** (`timer-stop-announcement.spec.ts`
   zitiert „aber noch nicht abrechenbar" in einem Kommentar): eine Zeile, kein Auftrag. Er wird bei
   der nächsten Titeländerung still falsch.
4. Frage 3 oben braucht eine Antwort, bevor die nächste Streichung mit Sperreintrag läuft — und die
   nächste ist **UM-06/ST-08**, in 5.2 bereits vorgemerkt.
