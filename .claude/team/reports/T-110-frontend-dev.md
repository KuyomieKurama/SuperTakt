# T-110 — Regelnamen aus `details[].name`, Toast über dem Dialogknopf

Aufgabe: T-110 — Regelnamen aus `details[].name`, Toast über dem Dialogknopf
Status: fertig

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/web/src/api/types.ts` | `ApiFieldError.name?: string` (W-11) samt Begründung, warum das Feld freiwillig ist und was `undefined` heißt |
| `apps/web/src/api/client.ts` | `TaktApiError.details` ist jetzt `readonly ApiFieldError[]` statt einer zweiten, hier ausgeschriebenen Fassung derselben drei Felder |
| `apps/web/src/lib/errorText.ts` | `ruleList` (neu, nicht ausgeführt außerhalb der Datei), `ruleReferences` und `errorMessageWithRules` lesen `name`; Dateikopf auf den neuen Vertrag umgeschrieben |
| `apps/web/src/styles/app.css` | `body:has(.scrim) .toast-layer { z-index: calc(var(--z-scrim) - 1) }` und `body:has(.scrim) .toast { pointer-events: none }`, mit dem Messprotokoll als Begründung |
| `apps/web/design/DESIGNSYSTEM.md` | neuer Abschnitt 5.1 „Ebenen — und die eine Ausnahme davon“ (Messtabelle, verworfene Alternativen, Regel für die Weiterarbeit); Abschnitt 8 um die gemessene Höhe des Stapels ohne Bildschirmgrenze |

Nicht angefasst: `apps/web/test/**` (unit-tester), `packages/**`, `apps/local-api/**`, `tests/**`,
`docs/**`, `openapi/**`, `package.json`, `tsconfig*.json`. `apps/desktop/**` war nicht betroffen.
Kein `git commit`, kein `stash`, kein `checkout`, kein fremder Prozess beendet; die Ports
17843/17844 wurden nicht angefasst — alle Messungen laufen ohne Dienst gegen die Stilblätter.
Die Messskripte liegen im Kratzverzeichnis, nicht im Bestand.

---

## Zusammenfassung

`errorText.ts` baut den Satz aus W-11 jetzt aus `details[].name`: „Betroffen ist die Regel „Ost“."
beziehungsweise „Betroffen sind die Regeln „Ost“, „Nord“ und „Abrechnung“." — das Gattungswort
einmal vorn statt einmal je Name, und nichts aus `message` herausgeschnitten (T-097 Annahme 1).
Fehlt `name`, steht dort Zeichen für Zeichen der Wortlaut von T-097; das ist der beschriebene
Vertragsfall und im Dateikopf als solcher begründet. Der Toast-Befund aus TP-KANBAN-02 ist **kein
Zufall und keine fremde Parallelarbeit**: Bei 1280×720 verdeckt bereits **eine** Meldung den
Mittelpunkt des Knopfes „Anlegen“ im Regelformular, bei 1024×768 die zweite — gemessen mit
`document.elementFromPoint`, also mit derselben Prüfung, an der Playwright hängen bleibt. Solange
ein Dialog offen ist, tritt der Meldungsstapel deshalb hinter die Abdunklung; nach der Änderung
trifft der Klick in allen 42 gemessenen Fällen den Knopf. Die Frage nach einer Bildschirmgrenze
für den Stapel (T-108 Frage 2) ist beantwortet und **nicht** gebaut — sie wird von Punkt 2 nicht
verlangt —, aber die Messung darunter ist unangenehm genug, um sie als Risiko zu führen. Der
Nachtrag T-112-H3 ist bewertet und begründet nicht gebaut (Abschnitt 4): Der Satz hält gemessen
auch an der Obergrenze von zwanzig Regeln, und eine Liste bräche die Zusicherungen, die
unit-tester und e2e-tester in dieser Welle gerade abgelegt haben.

---

## 1. W-11 — der Regelname als eigenes Feld

**Der Satz.** Je Eintrag mit `code: 'pool_rule'` gilt: **erst `name`, sonst `message`.** Ein Name
kommt in deutsche Anführungszeichen (er bringt keine mit), eine Meldung unverändert (sie bringt
ihre eigenen mit). Das Gattungswort hängt am **Satz** und nicht am Eintrag:

```
alle Einträge mit name   ->  „… Betroffen ist die Regel „Ost“."
                             „… Betroffen sind die Regeln „Ost“, „Nord“ und „Abrechnung“."
kein oder nicht jeder    ->  „… Betroffen ist Regel „Ost“."
                             „… Betroffen sind Regel „Ost“, Regel „Nord“ und Regel „Abrechnung“."
```

Der zweite Zweig ist der Wortlaut von T-097, unverändert. Stünden beide Sorten in **einer**
Aufzählung, ergäbe „die Regeln" davor „die Regeln Regel „Ost“ und „Nord“"; deshalb entscheidet
`ruleList` einmal für den ganzen Satz statt je Eintrag (Annahme 2).

**Warum kein Schnitt in `message`.** Unverändert die Begründung aus T-097: Ein Ausdruck, der heute
„Regel " abschneidet, schneidet morgen die Hälfte des Namens ab, und niemand wird dabei rot. Das
Feld `name` existiert genau deshalb; es wird gelesen, nicht nachgebaut.

**Warum der Rückfall kein stiller ist.** `name` ist freiwillig, weil ein Befund über ein
Eingabefeld nichts zu benennen hat (`ApiFieldError.name?`). Ein `pool_rule`-Eintrag ohne Namen kommt
heute von keiner der drei Sperren — Tag, Ordner und Status teilen sich `poolReference` —, er käme
von einem älteren Dienst. Dann bleibt die Auskunft dieselbe wie vor T-110, und verschwiegen wird
nichts: Der Name steht in diesem Fall im Satz des Dienstes. Beides steht im Dateikopf von
`errorText.ts`.

**Der Typ.** `ApiFieldError` hat das Feld bekommen; `TaktApiError.details` trug bis hierher eine
**zweite**, dort ausgeschriebene Fassung derselben drei Felder. Sie war strukturell zuweisbar und
hätte das vierte Feld verschluckt, ohne dass etwas rot geworden wäre. Jetzt steht der Typ an einer
Stelle.

**Die Aufrufstellen reichen den Satz unverändert weiter** — geprüft, nicht angenommen:

| Stelle | Was sie tut |
|---|---|
| `TagsScreen.tsx:499` (Tag **und** Ordner, derselbe Dialog) | `setDeleteError(errorMessageWithRules(cause))`, von dort ohne Zutat in `consequence` |
| `StatusSettings.tsx:258` | dasselbe in `removeError`; `consequence` wählt nur zwischen drei Fassungen |
| `StatusSettings.tsx:259` | `ruleReferences(cause)` — allein für `length > 0`, kein Eintrag wird gezeigt |

Damit ändert sich an keiner Stelle etwas außer dem Satz selbst, und `ruleReferences` bleibt für den
einen Aufrufer das, was es war: die Frage „hat der Dienst Regeln genannt?".

---

## 2. TP-KANBAN-02 — der Toast über dem Dialogknopf

### Der Befund

`.toast-layer` liegt auf `--z-toast` (400), der Dialog auf `--z-dialog` (310), die Abdunklung auf
`--z-scrim` (300). Die Ebene selbst nimmt keine Zeigereingaben an, die **einzelne Meldung** dagegen
schon (`pointer-events: auto` — sie trägt „Rückgängig" und „Schließen"). Beide sitzen in derselben
Ecke: `.dialog__footer` ist rechtsbündig, der Stapel ebenso.

Gemessen ohne Dienst: die vier echten Stilblätter (`tokens.css`, `base.css`, `components.css`,
`app.css`) in eine Seite gelegt, deren Auszeichnung aus `FormDialog.tsx` und `ToastContext.tsx`
stammt, Chromium 1.62.1, Einblendbewegung (`takt-rise`) abgewartet, dann
`document.elementFromPoint` auf den Mittelpunkt des Knopfes — dieselbe Prüfung, an der Playwrights
Bedienbarkeitsprobe hängt.

| Fenster | Dialog | Meldungen | Knopf „Anlegen“ | Klickpunkt | `elementFromPoint` |
|---|---|---|---|---|---|
| 1280×720 | Regelformular (34 rem) | **1** | x 814..895, y 595..627 | (854, 611) | **`li.toast`** |
| 1280×720 | Regelformular | 2 / 4 / 6 / 8 | dieselbe Lage | (854, 611) | **`li.toast`** |
| 1280×720 | Buchung (`dialog--wide`, 52 rem) | 1 | x 958..1039 | (998, 611) | **`li.toast`** (auch „Abbrechen“) |
| 1024×768 | Regelformular | 1 | — | (726, 649) | der Knopf (knapp) |
| 1024×768 | Regelformular | **2** und mehr | — | (726, 649) | **`li.toast`** |
| 1920×1080 | beide | 1 bis 8 | — | — | der Knopf |
| 1280×720 | kurzer Bestätigungsdialog | 1 | — | — | der Knopf |

**Antwort auf die Frage der Aufgabe: ja, der Stapel kann einen Dialog überdecken, und zwar schon
mit einer einzigen Meldung.** Es ist kein Randfall: 1280×720 ist die Fenstergröße der
End-zu-End-Suite (`devices['Desktop Chrome']`). Dass TP-KANBAN-02 danach zweimal grün lief, hat
einen Grund und keinen Zufall: Eine Meldung ohne Rückweg geht nach acht Sekunden von selbst — die
Überdeckung hängt an der Uhr. Und die Sorge aus dem Auftrag stimmt: Seit T-108 der Stapel über vier
Meldungen hinauswachsen darf, wird die verdeckte Fläche größer statt kleiner (bei sechs Meldungen
691 px hoch).

### Die Lösung, und warum diese

```css
body:has(.scrim) .toast-layer { z-index: calc(var(--z-scrim) - 1); }
body:has(.scrim) .toast       { pointer-events: none; }
```

Solange ein Dialog offen ist, tritt der Meldungsstapel **hinter die Abdunklung**. Er verschwindet
nicht; er wird abgedunkelt wie die ganze Anwendung hinter dem Dialog und steht danach unverändert
da.

**Warum die Meldung weicht und nicht der Dialog.** Ein Dialog ist modal: `keepTabInside` hält den
Tabulator fest, alles andere wartet. Die Meldung war bis hierher die einzige Ausnahme — sichtbar
über dem Dialog, **mit der Maus bedienbar, mit der Tastatur nicht erreichbar**. Das ist SC 2.1.1,
und zwar seit es beide Bausteine gibt; die Überdeckung des Knopfes ist nur die Seite davon, über
die ein Test stolpert. Der Rückweg geht dabei nicht verloren: Eine Meldung mit Rückweg hat keine
Frist (Regel 1 in `ToastContext.tsx`), sie ist nach dem Schließen des Dialogs unverändert da. Eine
Meldung ohne Rückweg hat nichts zu bedienen. Die Ansage für Vorlesehilfen hängt an `aria-live` und
nicht an der Ebene.

**Verworfen, mit Grund** (steht ausgeschrieben in `app.css` und im Designsystem):

* *Stapel versetzen.* Der Dialog steht mittig und ist bis 52 rem breit, die Meldung ist 26 rem
  breit — bei 1024 px Fensterbreite überlappen die beiden waagerecht in jeder Ecke, in der ein
  Knopf, ein Ankreuzfeld (`dialog__acknowledge`) oder der Schließknopf des Kopfes stehen kann.
* *Zwischen Abdunklung und Dialog legen* (z zwischen 300 und 310). Nähme die Überdeckung, ließe
  aber eine hell leuchtende, vom Dialog angeschnittene Karte auf abgedunkelter Seite stehen — und
  die Maus könnte sie weiter bedienen, die Tastatur weiter nicht. SC 2.1.1 bliebe.
* *Eine Bahn am unteren Rand freihalten* (Innenabstand in `.scrim`). Verlangt die gemessene
  Stapelhöhe als Variable samt `ResizeObserver` und schöbe den Dialog bei zwei Meldungen aus dem
  Fenster: Das Formular ist bei 720 px Fensterhöhe 560 px hoch, frei sind 672 px, eine Meldung
  kostet 94 px.

**Nach der Änderung**: 42 von 42 gemessenen Fällen (drei Fenstergrößen × sieben Aufbauten × zwei
Knöpfe) liefern den Knopf selbst — sowohl gegen die Quelldateien als auch gegen das **gebaute**
Stilblatt (`dist/assets/index-*.css`, damit `:has()` und `calc()` nachweislich den Bauschritt
überstehen). Im Bild geprüft (helles und dunkles Farbschema, 1280×720): Der Dialog steht
vollständig vorn, die zwei Meldungen sind abgedunkelt, aber lesbar — dieselbe Behandlung wie die
Ansicht dahinter.

`:has()` steht bereits an fünf Stellen dieser Oberfläche. Fehlt es einem Wirt, gilt wieder der
heutige Zustand — kein neuer Schaden, nur die alte Überdeckung. `pointer-events: none` ist der
zweite Riegel: Selbst wenn ein künftiger Stapelkontext die Ebene wieder nach vorn holte, schluckt
sie keinen Klick mehr, der dem Dialog gilt.

Die Regel greift für alle vier Flächen mit `.scrim`: `ConfirmDialog`, `FormDialog`, `InfoDialog`
und die Sperrmeldung `ServiceStoppedOverlay` (`scrim--blocking`). Bei der letzten ist sie
besonders richtig — dort ist hinter der Abdunklung ohnehin nichts mehr bedienbar.

---

## 3. T-108 Frage 2 — braucht der Stapel eine Bildschirmgrenze?

**Ja, aber nicht wegen Punkt 2** — deshalb ist nichts gebaut, wie im Auftrag vorgesehen. Gemessen
bei 720 px Fensterhöhe, Meldungen mit Rückweg (Titel, Zeile, „Rückgängig“, Schließknopf):

| Meldungen | Stapelhöhe | oberer Rand | älteste Meldung |
|---|---|---|---|
| 4 | 458 px | y = 246 | ganz sichtbar |
| 5 | 574 px | y = 130 | ganz sichtbar |
| 6 | 691 px | y = 13 | ganz sichtbar, 13 px Luft |
| 7 | 807 px | y = −103 | ragt hinaus |
| 8 | 924 px | y = −219 | ganz draußen |
| 10 | 1156 px | y = −452 | zwei ganz draußen |

Ab der **siebten** Meldung verlässt die älteste den Bildschirm. Ein fest positionierter Stapel
lässt sich nicht hereinrollen; ihr „Rückgängig" ist damit weg — genau das, was W-10 verhindern
wollte, nur mit dem oberen Bildschirmrand statt mit der Verdrängung. Für die Tastatur ist es
zusätzlich SC 2.4.11: Der Fokus läge auf einem Knopf außerhalb des Fensters.

T-108 hielt das für unerreichbar („jede solche Meldung setzt eine ausdrückliche Handlung voraus").
Das stimmt, ist aber keine hohe Hürde: **Sieben Todos hintereinander abhaken genügt** — jedes
Abhaken zeigt eine Meldung mit „Rückgängig" (`TodoListScreen.tsx:206-222`), und keine davon geht
von selbst.

**Vorschlag, falls der Orchestrator es beauftragt** (klein, eine Datei plus vier CSS-Zeilen):

1. `.toast-layer` bekommt `max-block-size: calc(100dvh - 2 * var(--space-4))` und
   `overflow-y: auto`; die Ebene bleibt `pointer-events: none`, die Meldungen bleiben bedienbar.
2. `ToastProvider` setzt nach jeder neuen Meldung `scrollTop = scrollHeight`. Damit ist die
   jüngste immer sichtbar — der Einwand aus T-108 gegen eine Rollfläche („zeigt den jüngsten
   Eintrag nicht von selbst") entfällt, und keine ältere ist mehr unerreichbar, sie ist nur
   weiter oben.
3. Alternative ohne Zustand: `flex-direction: column-reverse` auf dem Stapel bei umgekehrter
   Reihenfolge im Baum. Spart den Effekt, dreht aber Vorlese- und Tabulatorreihenfolge um; das
   wäre eine eigene Entscheidung.

Nicht vorgeschlagen: eine harte Obergrenze auch für Meldungen mit Rückweg. Das wäre W-10 rückwärts.

---

## 4. T-112-H3 — die Namen stehen in einem Satz und nicht als eigene Knoten

Der security-checker hat T-110 während seiner Prüfung mitgenommen (T-112, Abschnitt 2.6). Drei
seiner vier Punkte sind erfüllt; offen bleibt der leichtere, mit Schwere **Hinweis** und
ausdrücklich „keine Bedingung für die Freigabe": Ein Regelname darf selbst Anführungszeichen,
Kommas und das Wort „und" tragen. Er kann den Satz also umdeuten — „Ost“, „Nord“ und
„Abrechnung“ könnten aus **einem** so benannten Pool stammen. Die Bauart, die das endgültig
beantwortet, ist nach 2.3 Punkt 2 die Anzeige: jeder Name ein eigener Knoten, eine Liste statt
eines zusammengefügten Satzes.

**Ich habe es nicht gebaut. Die Begründung, in der Reihenfolge ihres Gewichts:**

1. **Die Satzform ist Vertrag, und zwei fremde Hoheiten prüfen ihn seit dieser Welle
   zeichengenau.** R-2a hat in W-11 genau diesen Satz verlangt; T-111 hat dazu fünf
   Einheitentests abgelegt, die die Zeichenkette vergleichen, und
   `tests/e2e/tag-folder-rule-lock.spec.ts` prüft an vier Stellen
   `toContainText('Betroffen ist die Regel „Ost“.')`. Eine Liste ergibt als `textContent`
   „Betroffen sind diese Regeln:OstNord…" und macht alle vier rot — in Dateien, die mir nicht
   gehören, während ihr Eigentümer daran arbeitet. Das ist die Kollision, die `CLAUDE.md`
   verbietet.
2. **Die Not, die eine Liste sonst rechtfertigen würde, gibt es nicht.** Gemessen an den echten
   Stilblättern im Bestätigungsdialog (1280×720, Auszeichnung aus `ConfirmDialog.tsx`), mit dem
   Dienstsatz und dem Kürzungshinweis:

   | Regeln | Zeichen | Höhe des Hinweisblocks | Dialog |
   |---|---|---|---|
   | 1 | 116 | 43 px = 2 Zeilen | 248 px |
   | 3 | 143 | 64 px = 3 Zeilen | 270 px |
   | 10 | 229 | 86 px = 4 Zeilen | 291 px |
   | **20** (die Obergrenze aus H-3) | 421 | 150 px = 7 Zeilen | 355 px |

   Auch am Anschlag bleibt der Dialog 355 px hoch in einem 720 px hohen Fenster: kein Bildlauf,
   kein Abschneiden, sieben Zeilen in einem hervorgehobenen Block. Eine Liste wäre hier keine
   Rettung, sondern eine Geschmacksfrage — und für ein bis drei Regeln, den Regelfall, läse sie
   sich schlechter als der Satz.
3. **Der Fund wird lokal nicht geschlossen.** Dieselben Namen reihen sich in
   `poolMovementSentence` (`packages/domain/src/pool-movement.ts`, `listPools`) zu Sätzen, die an
   mehr Flächen erscheinen als dieser Dialog — jede Meldung nach Erledigt, Timerstart, Buchung,
   und im Aufgabenbereich des Add-ins. Baute ich hier eine Liste, hätte die Anwendung zwei
   Darstellungen für dieselbe Sache und die Klasse bliebe offen. Wer sie schließen will, schließt
   sie dort, wo Namen in fremde Sätze eingesetzt werden — das ist eine eigene Aufgabe über zwei
   Hoheiten.
4. **Der Angreifer ist der Getäuschte.** Regeln legt nur an, wer das Sitzungsgeheimnis hat; der
   Name kommt aus dem eigenen Bestand und nie aus einer Anfrage (T-107). Das sagt der Befund
   selbst.

**Was ich bauen würde, wenn der Orchestrator es beauftragt** — und zwar nicht die Liste, sondern
die kleinere Fassung, die denselben Zweck erfüllt und nichts bricht:

* Jeder Name wird ein eigener, sichtbar abgesetzter Knoten **innerhalb** des Satzes
  (`<strong>` in `--text-primary`), die Zeichenfolge bleibt unverändert. Ein Name, der
  `“, „` enthält, steht dann als **ein** hervorgehobener Zug da und gibt sich nicht mehr als drei
  Regeln aus; `toContainText` und die Einheitentests bleiben grün, weil `textContent` gleich
  bleibt.
* Preis: `deleteError`/`removeError` halten künftig den Fehlschlag statt der fertigen Zeichenkette
  (zwei Ansichten), und der Satz braucht **einen** Erzeuger für Zeichenkette und Knoten — sonst
  entsteht genau die Doppelung, aus der W-14 hervorgegangen ist. Schätzung: rund dreißig Zeilen in
  `errorText.ts`, `TagsScreen.tsx` und `StatusSettings.tsx`.

**Der zweite Nachtrag ist erfüllt und nachgemessen:** Es bleibt bei React-Textknoten.
`ruleList` bildet Zeichenketten, `errorMessageWithRules` gibt eine zurück, sie steht an zwei
Stellen als Kind eines Elements. Über `apps/web/src` und `apps/desktop/src` zusammen: **null**
Treffer für `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`,
`document.write`, `eval(` und `new Function` — selbst gemessen, nicht aus T-112 übernommen.

---

## Nachweise

Ausgaben in Dateien umgeleitet, nicht durch eine Pipe gemessen.

| Befehl | Endstatus |
|---|---|
| `pnpm typecheck` | 0 (alle acht Pakete, `typecheck:test`, `typecheck:e2e`) |
| `npx vitest run apps/web/test` | 0 — 4 Dateien, **63** Fälle, darunter die vier neuen des unit-testers zu `details[].name` |
| `pnpm --filter @takt/web build` | 0 |
| `pnpm --filter @takt/web build:designsystem` | 0 |
| `pnpm --filter @takt/web contrast` | 0 — 0 von 432 Paaren durchgefallen |
| `pnpm boundaries` | 0 — „Notiz-Trennung: alle Schichten unverletzt“ |
| `pnpm verify:bundle` | 0 — 20 bestanden, 0 fehlgeschlagen |
| Messprobe Toast/Dialog, Quelldateien | 42 Prüfpunkte, 0 verdeckt (vorher: 8 verdeckt) |
| Messprobe Toast/Dialog, gebautes Stilblatt | 42 Prüfpunkte, 0 verdeckt |
| Messprobe Satzlänge im Bestätigungsdialog | 1 bis 20 Regeln: 2 bis 7 Zeilen, Dialog 248 bis 355 px (Abschnitt 4) |
| `grep` nach gefährlichen Senken in `apps/web/src` und `apps/desktop/src` | 0 Treffer (`dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function`) |

Die drei Pflichtnachweise sind nach der Unterbrechung ein zweites Mal gefahren worden, gegen
denselben Arbeitsbaum: `pnpm typecheck` 0, `npx vitest run apps/web/test` 0 (4 Dateien, 63 Fälle),
`pnpm --filter @takt/web build` 0.

Kein `pnpm test` und kein `test:e2e`: Fremde Pakete sind in dieser Welle in Arbeit, und die Ports
17843/17844 gehören dem e2e-tester, sobald er sie braucht. Gebraucht habe ich sie nie — alle
Messungen dieser Aufgabe laufen ohne Dienst gegen die Stilblätter (`ss -ltnp` beim Abschluss:
beide Ports frei, kein fremder Prozess angefasst). Kein Lint-Skript in `apps/web/package.json`.

**Die neuen Einheitentests des unit-testers passen zeichengenau** (`apps/web/test/lib/errorText.test.ts`,
Abschnitt „T-110-Vertrag aus T-107, W-11“): ein Name, zwei Namen, drei Namen, einer ohne Namen,
ein fremder `code`. Sie waren vor dieser Änderung rot (so im Bericht T-111 angekündigt) und sind
jetzt grün, ohne dass ich die Datei angefasst habe. Ebenso passt der bereits nachgezogene Wortlaut
in `tests/e2e/tag-folder-rule-lock.spec.ts:174,238,302,346`.

---

## Annahmen

1. **Die Anführungszeichen um `name` setzt die Oberfläche.** `name` ist der bloße Name; ohne
   Anführungszeichen läse sich „Betroffen sind die Regeln Ost, Nord und Abrechnung." und ein Name
   mit Leerzeichen wäre nicht mehr abgegrenzt. Die Form ist dieselbe wie in `listPools`
   (`packages/domain/src/pool-movement.ts`), damit der Benutzer nicht zwei Schreibweisen für
   dieselbe Sache liest.
2. **Das Gattungswort entscheidet der Satz, nicht der Eintrag.** „die Regeln" nur, wenn **jeder**
   Eintrag einen Namen mitbringt; sonst der Satzbau von T-097. Ein gemischter Fall kommt vom
   heutigen Dienst nicht vor (alle drei Sperren teilen sich `poolReference`), aber er darf nicht
   „die Regeln Regel „Ost“ und „Nord“" ergeben.
3. **`ruleReferences` liefert weiterhin Anzeigetexte, jetzt den Namen in Anführungszeichen.** Der
   einzige Aufrufer fragt `length`; ein zweiter Rückgabewert eigens für ihn wäre eine Schnittstelle
   ohne Bedienstelle gewesen.
4. **Der Meldungsstapel tritt hinter die Abdunklung, statt daneben auszuweichen.** Ausgeschrieben
   oben unter 2 samt der drei verworfenen Wege. Die Folge ist ausdrücklich: Eine Meldung mit
   „Rückgängig" ist bedienbar, **sobald der Dialog zu ist**, und nicht währenddessen.
5. **Der Nachweis läuft gegen die Stilblätter und nicht gegen die laufende Anwendung.** Ein Lauf
   gegen den Dienst hätte die belegten Ports gebraucht. Gemessen ist damit die Ursache (Ebene,
   Lage, Zeigereingaben) und die Wirkung an derselben Prüfung, die Playwright anstellt — nicht der
   Weg durch Anmeldung, Ansicht und Dienst.
6. **Abschnitt 5.1 ist neu im Designsystem**, obwohl Abschnitt 5 bisher keine Unterabschnitte hatte.
   Die Ebenenleiter stand nur als Kommentar in `tokens.css`, also außerhalb meiner Hoheit und
   außerhalb der abgenommenen Referenz.

---

## Risiken

1. **Der Stapel hat keine Bildschirmgrenze**, und ab sieben Meldungen mit Rückweg fällt die älteste
   aus dem Fenster (Abschnitt 3, gemessen). Erreichbar durch sieben Todos hintereinander abhaken.
   Nicht gebaut, weil der Auftrag es an Punkt 2 knüpft und Punkt 2 es nicht verlangt — der
   Vorschlag steht oben und kostet eine Datei plus vier Zeilen CSS.
2. **Eine Meldung hinter der Abdunklung ist gedämpft.** Im dunklen Farbschema liegt
   `--bg-scrim` bei 68 % Deckung; Titel und Zeile bleiben lesbar (im Bild geprüft), erreichen aber
   dort keinen AA-Kontrast mehr. Das gilt für **alles** hinter der Abdunklung und ist der Zweck
   einer Abdunklung; die Kontrastprüfung misst Farbpaare und keine Überlagerungen, sie bleibt bei
   0 von 432 durchgefallen. Wer das anders sieht, muss die Abdunklung selbst infrage stellen, nicht
   diese Regel.
3. **`:has()` ist jetzt tragend und nicht mehr nur schmückend.** Auf einem Wirt ohne Unterstützung
   fällt die Oberfläche auf den heutigen Zustand zurück (Überdeckung möglich), nicht auf einen
   schlechteren. WebView2 und WebKitGTK der in Frage kommenden Stände können es; die Oberfläche
   nutzt es bereits an fünf Stellen. Eine Fassung ohne `:has()` müsste jeder Dialog eine Klasse am
   `body` führen lassen, samt Zähler für verschachtelte Dialoge — mehr Zustand für dasselbe
   Ergebnis.
4. **Sicherheit: der Regelname reist jetzt als eigenes, unumhülltes Feld in die Anzeige.** Er geht
   durch React und wird beim Setzen maskiert; `dangerouslySetInnerHTML` kommt in `apps/web` nicht
   vor (geprüft). Die Wache gegen Steuer- und Richtungszeichen sitzt beim Anlegen im Dienst
   (`http/input.ts`, R-3a H-2). Derselbe Name reist seit T-089 im Bewegungssatz an dieselbe Fläche
   — neue Klasse ist es keine, siehe Risiko 3 in T-107.
5. **Keine neuen Daten, keine neue Fläche, kein neuer Aufruf.** Keine Kundendaten, keine
   Call-Nummern, keine Testdaten im Bestand.
6. **T-112-H3 bleibt zur Hälfte offen, mit Absicht.** Die Namen stehen in einem zusammengefügten
   Satz; ein Name mit Anführungszeichen, Komma oder dem Wort „und" kann sich als mehrere Regeln
   ausgeben. Schwere: Hinweis, ausdrücklich keine Freigabebedingung. Bewertung, Messung und der
   Bauvorschlag stehen in Abschnitt 4; die Klasse gehört dorthin geschlossen, wo Namen allgemein
   in fremde Sätze eingesetzt werden, und nicht an dieser einen Stelle.
7. **Der zusammengesetzte Lauf fehlt weiterhin.** Dass der Dienst `name` tatsächlich liefert, ist
   aus T-107 übernommen und hier nicht gegen den laufenden Dienst gemessen; die Oberfläche verhält
   sich in beiden Fällen richtig, das ist der Punkt der Fassung.

---

## Offene Fragen

1. **Soll `listPools` aus `@takt/domain` ausgeführt werden?** Die Aufzählungsform („A, B und C",
   Name in Anführungszeichen) steht jetzt zum zweiten Mal in der Oberfläche, weil `listPools` in
   `packages/domain/src/pool-movement.ts` privat ist. Seit `details[].name` reihen beide Stellen
   dasselbe auf: bloße Namen. Eine ausgeführte Funktion wäre eine Form an einer Stelle — Hoheit
   domain-dev, drei Zeilen. Ich habe sie nicht angefordert, weil die Fassung auch so richtig ist.
2. **Bekommt der Stapel die Bildschirmgrenze aus Abschnitt 3?** Braucht eine Zuweisung; ich habe
   nicht gebaut, was der Auftrag an eine Bedingung geknüpft hat, die nicht eingetreten ist.
3. **Soll der Rest von T-112-H3 gebaut werden?** Abschnitt 4 wägt es ab und schlägt die kleinere
   Fassung vor (jeder Name ein eigener, hervorgehobener Knoten im Satz, Zeichenfolge unverändert,
   rund dreißig Zeilen über drei Dateien). Die Liste, die der security-checker skizziert, bräuchte
   zusätzlich eine Zuweisung an unit-tester und e2e-tester, weil sie deren frisch abgelegte
   Zusicherungen bricht — deshalb nicht von mir allein.
4. **Soll `tag_name_ambiguous` ebenfalls `name` tragen** (T-107 Offene Frage 3)? Für die
   Oberfläche macht es heute keinen Unterschied: `ruleReferences` nimmt nur `pool_rule`, und der
   Satz für einen mehrdeutigen Tagnamen ist ein anderer. Wenn er kommt, ändert sich hier nichts,
   solange er einen anderen `code` trägt.

---

## Nächster Schritt

1. **e2e-tester:** TP-KANBAN-02 einmal ohne Wiederholungen nachfahren (`--retries=0`) — der Fall
   sollte jetzt unabhängig davon grün sein, wie viele Meldungen offen stehen. Ein eigener Fall
   dafür wäre: eine Meldung erzeugen, sofort den Dialog „Spalte anlegen“ öffnen und „Anlegen“
   klicken, ohne die acht Sekunden abzuwarten. Vor dieser Änderung wäre er bei 1280×720
   zuverlässig rot gewesen.
2. **Orchestrator:** über Abschnitt 3 entscheiden (Bildschirmgrenze für den Stapel) und über
   Offene Frage 1 (`listPools` ausführen).
3. **security-checker:** Abschnitt 4 dieses Berichts ist die Antwort auf T-112-H3 — der offene
   Rest ist bewertet, gemessen und begründet nicht gebaut. Wenn die Liste aus 2.3 Punkt 2
   trotzdem gewollt ist, ist sie eine eigene Aufgabe über drei Hoheiten (frontend-dev,
   unit-tester, e2e-tester) und sollte die Sätze aus `poolMovementSentence` gleich mitnehmen.
4. **spec-ux-reviewer:** Abschnitt 5.1 des Designsystems ist die Stelle, an der die Ebenenleiter
   erstmals in der abgenommenen Referenz steht — und die Aussage „ein Dialog liegt über der
   Meldung" widerspricht dem Kommentar an `--z-toast` in `packages/ui-tokens/tokens.css`, den ich
   nicht anfassen darf. Er sollte nachgezogen werden.
