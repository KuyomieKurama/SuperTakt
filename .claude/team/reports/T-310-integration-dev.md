# T-310 — Nacharbeit aus T-307 und T-308

Aufgabe: T-310 — vier Befunde aus den Freigabeprüfungen, dazu A-19.30b und die Ansage
Rolle: integration-dev · Stand: 2026-09-12

## Artefakte

**Neu**

- `apps/outlook-addin/src/attachments/reconcile.ts` — der Abgleich von Nutzlast und
  Abweisungsliste, als reiner Wert und ohne React
- `.claude/team/reports/T-304-integration-dev.md` — nachgereicht (Punkt 0 des Auftrags)

**Geändert**

- `apps/outlook-addin/src/ui/TaskPane.tsx` — Zahl aus `stored`, Erklärabsatz zu
  `rebuild_rejected`, zwei Fassungen des Nachtragswegs, Live-Bereiche und Fokusziele
- `apps/outlook-addin/src/ui/Attachments.tsx` — Statuszeile und Fehlschlagansage als Werte
  (`progressStatusLine`, `spokenSkips`), keine Live-Bereiche mehr im Baustein
- `apps/outlook-addin/src/ui/Primitives.tsx` — `Section.headingRef` (Fokusziel mit
  `tabindex="-1"`), `Button.ref`
- `apps/outlook-addin/src/office/host.ts` — `readBody` liefert `string | null`
- `apps/outlook-addin/src/attachments/eml.ts` — `RebuildFields.body: string | null`, der
  Nachbau lehnt ohne Nachrichtentext ab
- `apps/outlook-addin/src/attachments/model.ts` — `displaySkipReason`, `SkipReason` =
  `WireSkipReason`, `DISPLAY_ONLY_SKIP_REASONS` leer
- `apps/outlook-addin/src/attachments/reasons.ts` — `connection` gestrichen
- `apps/outlook-addin/src/api/types.ts` — `attachments?: CreatedAttachmentsDto | null`
- `apps/outlook-addin/src/styles/addin.css` — sichtbarer Ring an der angesprungenen Überschrift
- `apps/outlook-addin/scripts/proof-addin.mjs` — sechs neue Prüfungen, zwei angepaßte

## Die fünf Punkte, einzeln

### 1. Die Zahl stimmt jetzt — und sie kommt aus zwei Quellen

Der Abgleich läuft nicht mehr über den Anzeigenamen als `Set`, sondern in
`reconcileAttachments` als **Multimenge über den vom Dienst gekürzten Namen**, in der
Reihenfolge, in der der Dienst arbeitet (Nachricht, Dateien, Verweise). Jede Abweisung
verbraucht **genau einen** Eintrag. Damit sind beide Fälle des Befunds geschlossen: der Name
über 255 Zeichen (gekürzt wird mit `shortenEmailDisplayName` aus `@takt/domain`, also mit
derselben Funktion, die der Dienst benutzt — nicht mit einer zweiten hier) und zwei Anhänge
mit demselben Namen.

Getrennt davon: **Die Zahl im Satz ist `stored` aus der Antwort**, nicht die Länge der eigenen
Liste. Und wo beide auseinanderlaufen — ein Eintrag der Abweisungsliste ließ sich keiner
Nutzlast zuordnen —, gewinnt die Zahl des Dienstes, und die Namensliste entfällt
(`showsAttachedList`). Lieber eine Zahl ohne Namen als eine Zahl, unter der der Benutzer
etwas anderes abzählt.

**Was ich nicht schließen konnte, und warum:** Der saubere Weg wäre der **Index** aus
`attachments.items` in `CreatedAttachmentsDto.rejected` (T-307 Befund 2). Er entsteht in
`apps/local-api/src/features/todos/email-attachments.ts` — fremde Hoheit, und der Auftrag
verbietet sie mir ausdrücklich. Der Rest davon ist unten als offene Frage 1 benannt.

### 2. Der Kommentar sagt nicht mehr, was der Nachbar bricht

`DoneAttachments` **hat** jetzt `stored`, der Kommentar beschreibt genau dieses Feld, und
`attachedCore` rechnet daraus. Die Gesamtzahl ist `stored + missing.length`.

Zwei kleine Dinge fielen dabei mit:

- Bei **null** übernommenen Anhängen stand ein **Doppelpunkt** vor einer Liste, die dann nicht
  gerendert wurde (T-308 F-3, zweiter Randfall). Der Satz endet jetzt mit Punkt, wo keine Liste
  folgt, und mit Doppelpunkt, wo eine folgt — an einer Stelle entschieden.
- „1 von 3 Anhängen **hängt** daran" statt „hängen" (Entwurf 6.4 Fall 1). Der Code sagte immer
  „hängen".

### 3. Der Nachbau verspricht keinen Text mehr, den er nicht hat

`readBody` liefert `string | null`; `null` heißt „nicht zu bekommen" und ist etwas anderes als
`''` („diese E-Mail hat keinen Text"). `RebuildFields.body` trägt den Unterschied weiter, und
`buildRebuiltEml` **lehnt bei `null` ab** — das ist `rebuild_rejected`, den es seit T-301 genau
dafür gibt. Für das Formular bleibt der Fall harmlos (`body ?? ''`): Dort behauptet ein leerer
Text nichts.

Ich habe den zweiten Weg — den Vorspann umschreiben — verworfen. Ein Vorspann, der sagt „der
Nachrichtentext konnte nicht gelesen werden", wäre ehrlich, aber die Datei ginge weiterhin als
übernommen durch und läge Wochen später als Beleg in einer Akte. A-19.29 hat für den Fall einen
Satz; A-19.31 verlangt, daß er gesagt wird.

### 4. Die fehlenden Sätze, und A-19.30b

Aus `docs/design/addin-anhangsuebernahme-fluss.md` (zweite Fassung) übernommen, zeichengleich
gegen das Papier gemessen:

- der Erklärabsatz aus 6.4 Fall 2,
- **SP-A-35** („Das liegt an dieser Nachricht, nicht an Ihren Eingaben, und ein zweiter Versuch
  ändert daran nichts."),
- der Nachtragsweg in **zwei** Fassungen: „die **Nachricht** in Outlook speichern", wenn
  ausschließlich die E-Mail fehlt, sonst „die **Datei**".

Die Überschrift „Todo angelegt — die E-Mail fehlt" **stand bereits im Baum** (`doneTitle`,
TaskPane.tsx). T-308 F-3 nennt sie als fehlend; das ist an dieser einen Stelle nicht mehr der
Stand. Alles andere aus F-3 hat gefehlt.

**A-19.30b:** Die Auswahl des Anzeigegrundes läuft über
`Record<WireSkipReason, SkipReason>` — ein vollständiger Record ohne Vorgabewert, der jede
Kennung der Leitung zu einer ausgeschriebenen Zeile zwingt. Er hat während dieser Aufgabe
**genau das getan, wofür er gebaut ist**: Domain-dev hat die Kennungen mitten im Lauf
eingespielt, `pnpm typecheck` wurde rot, und ich habe `total_too_large` und `too_many`
angeschlossen und `connection` gestrichen. Damit ist auch T-308 F-1 und F-7 auf meiner Seite zu.
`displaySkipReason` nimmt eine **Zeichenkette** entgegen und nicht die Vereinigung — was aus der
Antwort kommt, ist ungeprüftes JSON; eine unbekannte Kennung fällt auf `rejected`, und das ist
keine Vermutung über die Ursache, sondern die eine Aussage, die in diesem Fall sicher stimmt.

Folge davon: `SkipReason` ist jetzt dieselbe Menge wie `WireSkipReason`,
`DISPLAY_ONLY_SKIP_REASONS` ist **leer**. Die Konstante bleibt als Meßpunkt stehen.

### 5. Die Ansage

Beide Live-Bereiche stehen jetzt auf der **obersten Ebene** von `TaskPane` und über allen
Zuständen — das ist Y-04: Ein Live-Bereich, der zusammen mit seinem Inhalt entsteht, wird von
vielen Vorlesehilfen nicht angesagt. Dafür mußte der Baustein aufhören, Zustände durch
vorzeitiges `return` zu verlassen; Formular, Fortschritt, Ergebnis und „kein Token" sind jetzt
Werte, und die Auswahl steht in **einer** Rückgabe.

Gesprochen wird genau dreierlei (Entwurf 10.2, D-08): der **Beginn**, **jeder** Fehlschlag
sofort, das **Ergebnis** — „Todo angelegt. 2 von 3 Anhängen hängen daran." Dazu der Nachbau als
benannte Ausnahme (AK-26): „… Die E-Mail ist ein Nachbau." Der Zusatz entfällt, wo der Kern das
Wort schon trägt; gemessen am erzeugten Satz und nicht an der Bedingung, unter der er entsteht.
Die Liste selbst ist **kein** Live-Bereich.

Fokus (Entwurf 10.1): Z0 → Z1 auf die Überschrift „Anhänge werden übernommen", → Z3/Z4 auf die
Ergebnisüberschrift, Z5/Z6 zurück auf „Neue Aufgabe anlegen", Z3/Z4 → Z0 auf das Feld
Call-Nummer. Die Überschrift bekommt `tabindex="-1"` **nur dort, wo sie ein Ziel ist**, und
einen sichtbaren Ring über `:focus` (nicht `:focus-visible` — der Fokus kommt aus dem Programm,
und ein Teil der Browser zeigt dafür sonst nichts).

Der Rücksprung ins Formular läuft **nur auf eine Handlung hin**: `done` wird auch beim Wechsel
der geöffneten Nachricht auf `null` gesetzt, und dort hat der Benutzer nichts gedrückt (3.2.1,
3.2.2).

## Ehrlich benannt: was an Punkt 5 gemessen ist und was abgeleitet

**In dieser Umgebung steht kein Vorleseprogramm zur Verfügung.** Gemessen sind: wo die
Live-Bereiche im Baum stehen (`proof:addin`, neue Prüfung), daß es genau zwei sind, daß keiner
mehr in `Attachments.tsx` entsteht, daß die vier Fokusziele angesprungen werden und daß die
Überschrift überhaupt anspringbar ist. **Abgeleitet** ist alles darüber hinaus: daß eine
bestimmte Vorlesehilfe diese Sätze in dieser Reihenfolge vorliest. Die Ableitung trägt für die
**Bauart** — ein Bereich, der vorher da ist, statt mit seinem Inhalt zu entstehen —, nicht für
das Verhalten einer bestimmten Hilfe.

## Messung — `pnpm check` vollständig gefahren, und er ist **rot**

**Nicht durch diese Aufgabe.** Stufe für Stufe:

| Stufe | Ergebnis |
|---|---|
| `typecheck` | **grün** — alle Projekte, `src`, `test`, e2e |
| `boundaries`, `contrast` | **grün** |
| `proof:all` (19 Läufe) | **grün**, darunter `proof:addin` mit **301 bestanden, 0 fehlgeschlagen** |
| `verify:bundle` | **grün** |
| `test:coverage` | **rot: 6 von 1796** |
| `test:rust` | **grün** (68 bestanden, 1 übersprungen) — einzeln nachgefahren |
| `build` | **grün** — einzeln nachgefahren |
| `audit` | **grün** — einzeln nachgefahren |

Die sechs Fehlschläge stehen in **zwei Dateien fremder Hoheit** und messen alle denselben
Sachverhalt: die Gründeliste vor T-309.

```
packages/domain/test/email-attachment.test.ts
  × genau acht Gründe, keiner mehr und keiner weniger     expected 9 to be 8
  × "connection" ist erreichbar                           expected false to be true
  × eine beliebige unbekannte Zeichenkette ist keiner …    expected true to be false
  × ein Byte über der Summengrenze … : too_large           expected 'total_too_large' to be 'too_large'
  × die 26. Datei … ist rejected, nicht too_large          expected 'too_many' to be 'rejected'
apps/local-api/test/usecases/email-attachments.test.ts
  × der 26. Anhang wird "rejected"                         reason: 'too_many' statt 'rejected'
```

Jede dieser Zusicherungen ist die **alte** Wahrheit: acht Gründe, `connection` erreichbar, die
Summe als `too_large`, die 26. Datei als `rejected`. Sie sind mit **T-309** gefallen — domain-dev
hat `EMAIL_ATTACHMENT_FAILURE_REASONS` und `admitEmailAttachment` während dieses Laufs geändert
(die beiden Dateien stehen in `git status` als geändert, die beiden Prüfdateien **nicht**). Keine
der sechs liegt in meiner Hoheit, keine berührt `apps/outlook-addin/**`,
`apps/local-api/src/routes/addin/**` oder `packages/export/**`, und `tests/**` sowie
`apps/*/test/**` darf ich nicht anfassen.

**Das ist derselbe Vorgang, den mein `Record` auf meiner Seite abgefangen hat** — dort wurde
`pnpm typecheck` rot, und ich habe die neuen Kennungen angeschlossen. Die Prüffälle haben keinen
solchen Wächter; sie fallen erst im Lauf. Ein Auftrag an unit-tester schließt das.

**Was ich zusätzlich gemessen habe, um das zu belegen:** Der Lauf vor meinen Änderungen ist in
dieser Sitzung nicht mehr herstellbar (zwei Agenten schreiben gleichzeitig). Der Beleg ist
deshalb der **Inhalt** der Zusicherungen: Sie nennen Werte, die es in `packages/domain/src` seit
T-309 nicht mehr gibt, und die sechs Meldungen nennen genau die neuen.

*Nebenbefund zur Umgebung:* Zwei frühere Anläufe von `pnpm check` brachen an
`proof:access` bzw. `proof:addin-wiring` mit „Auf 127.0.0.1:17843 lauscht bereits etwas" ab,
während kein Prozess lauschte (nur `TIME_WAIT`-Einträge). Der dritte Anlauf lief durch. Auf
diesem Rechner laufen zwei Agenten; die Läufe teilen sich einen festen Port. Das ist kein Befund
am Erzeugnis, gehört aber gesagt, weil es einen roten Lauf erzeugt, der keiner ist.

Neue Prüfungen in `proof-addin.mjs`:

1. ein Anzeigename über 255 Zeichen fällt beim Abgleich nicht durch (mit Gegenprobe, daß der
   Dienst ihn wirklich kürzt),
2. drei gleichnamige Anhänge, eine Abweisung — es fällt genau einer,
3. schweigt der Dienst über die Anhänge, gilt keiner als angekommen,
4. die E-Mail heißt auch in der Fehlliste „die E-Mail", und `isMessage` trägt die Überschrift,
5. ein unbekannter Grund aus der Antwort wird nicht geraten,
6. ohne Nachrichtentext entsteht keine Datei, die einen behauptet — **beide Richtungen**:
   `null` wird abgelehnt, `''` nicht,
7. ein abgelehnter Nachbau wird als `rebuild_rejected` gemeldet,
8. Y-04: kein `role="status"` mehr in `Attachments.tsx`, genau zwei in `TaskPane.tsx`, beide vor
   der Zustandsauswahl, vier Fokusziele, `tabIndex: -1` vorhanden.

Angepaßt: die Gründeliste (neun statt zehn, `connection` gestrichen) samt **Gegenprobe in der
anderen Richtung** — `connection` und `mailbox_closed` dürfen keinen Satz mehr bekommen; und die
Messung zu A-19.30b: `too_large`, `total_too_large` und `too_many` stehen in der Aufzählung der
Domäne, und der Satz zur Summengrenze nennt die Summe und **nicht** die Grenze je Datei.

## Annahmen, die ich ohne Rückfrage getroffen habe

1. **Bei zwei Einträgen verschiedener Art mit demselben gekürzten Namen** (eine Datei und ein
   Cloud-Verweis etwa) ist nicht bestimmbar, welcher durchgefallen ist. Die **Zahl** stimmt
   weiterhin; der Zusatz hinter dem Namen („(als Verweis)") kann den falschen der beiden
   treffen. Das steht im Dateikopf von `reconcile.ts` und ist die Restlücke, die nur der Index
   schließt.
2. **Der Nachtragsweg sagt „die Nachricht" nur, wenn ausschließlich die E-Mail fehlt.** Fehlt
   beides, steht „die Datei" — zwei Sätze untereinander, die sich in einem Wort unterscheiden,
   sind schwerer zu lesen als einer.
3. **Sagt der Dienst über die Anhänge gar nichts, obwohl welche mitfuhren**, gilt jeder als
   abgewiesen (`rejected`) statt als angekommen. Der Fall ist heute nicht erreichbar (die
   Vorschau hängt an `emailAttachments.accepted`); ihn als Erfolg zu lesen wäre der stille
   Ausfall.
4. **„1 von 3 Anhängen hängt daran"** — Einzahl, wie im Entwurf. Kein Prüffall und kein
   Sperrlisteneintrag hing am alten Wortlaut; gesucht über den Wortlaut in `tests/**`,
   `apps/*/src`, `packages/*/src` (E-087).
5. **`connection` ist gestrichen**, auch in `reasons.ts`. Er hatte keinen erzeugenden Fall
   (T-308 F-7), und die Domäne führt ihn seit T-309 nicht mehr — der Übersetzer wäre sonst rot.

## Risiken

1. **Der Abgleich hängt an `shortenEmailDisplayName`.** Ändert jemand die Kürzung in der Domäne,
   ändert sich der Abgleich mit. Das ist beabsichtigt (eine Funktion, nicht zwei) und trotzdem
   eine Kopplung: Der Aufgabenbereich rechnet eine Umformung nach, die der Dienst vornimmt. Der
   Index (offene Frage 1) hätte diese Kopplung nicht.
2. **Das Formular wird in jedem Zustand als Wert gebaut**, auch wenn „kein Token" dasteht. Das
   sind React-Elementobjekte ohne Seiteneffekt und ohne Hook — aber es ist Arbeit, die vorher
   nicht anfiel. Bei einem Aufgabenbereich dieser Größe nicht messbar.
3. **Die Rumpfgrenze der Add-in-Route steht vor `authGuard`** (unverändert aus T-301/T-304, auch
   T-307 nennt es). Gehört dem security-checker.

## Offene Fragen an den Orchestrator

1. **Der Index statt des Namens** (T-307 Befund 2, Restlücke aus Annahme 1). Er braucht ein Feld
   in `EmailAttachmentFailure` und damit einen Auftrag an domain-dev in
   `apps/local-api/src/features/todos/email-attachments.ts`. Mein Abgleich wird dadurch
   **kürzer**, nicht länger.
2. **T-307 Befund 1** — der Wurf aus der Anhangstransaktion, der Dateien ohne Eigentümer
   liegenläßt — liegt in derselben fremden Datei und ist von den offenen Befunden der schwerste.
3. **T-308 F-5, zweite Hälfte:** Vorschau und Tür zählen die Anzahlgrenze verschieden (die
   Vorschau zählt nur Dateien, die Tür Nachricht, Dateien und Verweise). Die Grenze selbst ist
   mit A-19.30a gedeckt, die **Zählweise** nicht. Der Fix liegt in `plan.ts` — meine Hoheit —,
   aber er ändert eine Zahl, die der Benutzer vor dem Klick liest, und stand nicht im Auftrag.
   Ich habe ihn deshalb **nicht** gemacht. Auftrag genügt.
4. **SP-A-35** gehört nach T-308 F-8 auf die Sperrliste, sobald F-05 des Entwurfs beantwortet
   ist. Der Satz steht jetzt im Baum; die Bedingung ist damit erfüllt.
5. **Die sechs roten Prüffälle** (siehe Messung) brauchen einen Auftrag an unit-tester, und zwar
   **vor** der Freigabe dieser Welle: `pnpm check` ist sonst rot und niemand weiß auf einen Blick,
   ob aus einem neuen Grund.

## Status

**braucht Review.** Die fünf Punkte des Auftrags sind umgesetzt und gemessen; `pnpm check` ist
aus sechs Gründen rot, die alle in fremder Hoheit liegen und alle denselben Ursprung haben.

## Nächster Schritt

Zwei Dinge parallel: unit-tester zieht die sechs Prüffälle auf die Gründeliste nach T-309 nach
(offene Frage 5), und der security-checker sieht sich die geänderte Fläche an — er hat jetzt
beide Berichte. Danach offene Frage 3 als kleiner Auftrag an mich (eine Zählweise in `plan.ts`)
und die Befunde 1 und 2 an domain-dev.
