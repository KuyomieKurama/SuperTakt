Aufgabe: T-091 — Reparatur nach Review (R-1, R-2) in der Oberfläche

Status: fertig

Artefakte:

```
apps/web/src/components/RulePickers.tsx   NEU — FolderPicker und StatusPicker mit drei
                                          Zuständen (lädt, Fehler mit Rückweg, bereit) und
                                          Suche über den Ordnerpfad
apps/web/src/screens/PoolFormDialog.tsx   Zustandsquellen statt fertiger Listen; vier
                                          eindeutige Feldnamen; Warnbänder vor die Vorschau;
                                          Live-Region unter der Vorschau; Toast aus
                                          `saved.resolved`; Hinweis auf E-047-Ausbuchungen
apps/web/src/app/StructureContext.tsx     `pools.slice(0, 12)` aufgehoben, mit Begründung
apps/web/src/lib/labels.ts                sechs Aufzählungen aus `@takt/domain` importiert und
                                          re-exportiert; `POOL_STATUS_LABEL`;
                                          `POOL_EXPORT_NOT_BILLED_HINT`; `RULE_IS_A_RULE`,
                                          `RULE_NOT_A_PLACE`, `RULE_WHAT_MOVES_A_CARD`;
                                          Modus heißt nicht mehr „Alle davon"
apps/web/src/lib/poolRule.ts              neu `ruleSpoken` — die Regel in einem Satz
apps/web/src/components/RadioRow.tsx      Hilfssatz aus dem `<label>` heraus
apps/web/src/components/RuleSummary.tsx   „Achsen" → „Bedingungen"
apps/web/src/screens/BoardScreen.tsx      Erledigt-Toast ohne Spaltenbehauptung; „Vom Board
                                          nehmen" mit Rückgängig statt Bestätigungsdialog;
                                          Spaltendialog mit Lade- und Fehlerzustand;
                                          Filterschalter nennt die Ausnahme; Wortwahl
apps/web/src/screens/TagsScreen.tsx       derselbe Rückweg wie auf dem Board; Wortwahl
apps/web/src/screens/{StatusSettings,TodoFormDialog,TodoDetailScreen,SettingsScreen}.tsx
                                          Wortwahl: „Regel über Tags" und „ohne Tag passt keine
                                          Poolregel"
apps/web/src/app/Navigation.tsx           Wortwahl
apps/web/src/components/Kanban.tsx        Wortwahl in den Bauteilkommentaren
apps/web/src/api/types.ts                 Wortwahl in den Typkommentaren
apps/web/src/showcase/{RuleSection,BoardSection,InventorySection,data}.tsx|ts
                                          sechs neue Zustandsbeispiele, S-10-Tabelle berichtigt
apps/web/src/styles/app.css               `.tag-picker--busy`, `.tag-picker__waiting`,
                                          `.picker-search`
apps/web/scripts/contrast-check.mjs       neue Gruppe „Regelformular", vier Paare
apps/web/package.json                     Begründung der Domänen-Abhängigkeit richtiggestellt
```

Nicht angefaßt: `packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `tests/**`,
`docs/**`, `apps/desktop/**`, der Wurzel-`package.json`.

---

## Zusammenfassung

Die beiden blockierenden Befunde sind behoben. Das Regelformular behauptet nicht mehr „Es gibt
noch keinen Ordner", während es lädt oder gescheitert ist: Ordner- und Statusauswahl sind nach
`components/RulePickers.tsx` gezogen, nehmen ihre Daten als Zustand entgegen und haben dieselben
drei Ausgänge wie das `TagInput` daneben — lädt, Fehler mit Wiederholungsknopf, bereit. Die stille
Kürzung `pools.slice(0, 12)` ist aufgehoben statt beschönigt; „und drei weitere" wäre an dieser
Stelle selbst gelogen gewesen, weil vor der Abfrage gekürzt wurde.

Aus den „sollte"-Punkten sind umgesetzt: die Domänentypen in `labels.ts` (R-1), die veraltete
Begründung in `apps/web/package.json` (R-1), die vereinheitlichte Wortwahl an allen elf Stellen
(S-2), der doppelt vorgelesene Hilfssatz (S-6), die Live-Region an der Regelvorschau (S-8), der
Hinweis auf die E-047-Ausbuchungen an der Exportachse (S-1), dazu S-3, S-5, S-7, S-9, S-10, H-1,
H-2, H-3 und die halbe Antwort auf A-4.4. Die Musterseite zeigt sechs neue Zustände nebeneinander.

Gemessen: `pnpm --filter @takt/web typecheck` grün, `pnpm run typecheck` **vollständig** grün
(alle acht Pakete einschließlich `typecheck:test`), `pnpm run contrast` 0 von 432 durchgefallen,
`pnpm --filter @takt/web build` und `build:designsystem` grün, `pnpm run boundaries` grün,
`pnpm run test:e2e` 34 von 34 grün. Die Musterseite in hell und dunkel im Browser nachgesehen,
ohne Konsolenfehler.

---

## 1. B-5 — drei Zustände statt eines (blockierend)

`FolderPicker` und `StatusPicker` standen bis jetzt als lokale Funktionen im Dialog und bekamen
fertige Listen. `ready` ist aber `null`, solange der `StructureContext` lädt **und** wenn er
fehlgeschlagen ist; beide Listen sind dann leer, und das Formular schrieb hin, es gebe keine
Ordner und keine Status. Der Benutzer hat beides. Er legt daraufhin eine Regel ohne beides an.

Beide sind jetzt eigene Bausteine in `components/RulePickers.tsx` und nehmen einen
`PickerSource<T>` entgegen:

| Zustand | Was dasteht |
|---|---|
| `loading` | Der Kasten bleibt stehen, ist `aria-busy`, trägt einen Spinner und den Satz „Ordner werden geladen …" |
| `error` | `InlineMessage tone="danger"` mit der Meldung des Dienstes und „Erneut versuchen" auf `structure.reload` |
| `ready`, leer | erst hier steht „Es gibt noch keinen Ordner." — und jetzt stimmt der Satz |
| `ready`, gefüllt | die Chips, ab acht Ordnern mit Suchfeld darüber |

Drei Dinge, die dabei bewußt so sind:

- **Der Rahmen bleibt in jedem Zustand stehen.** Ein Feld, das während des Ladens verschwindet
  und danach wiederkommt, läßt das Formular springen; wer gerade tippt, verliert die Stelle. Das
  ist dieselbe Begründung wie im Kopf von `TagInput`.
- **Die Fehlermeldung trägt den Satz des Dienstes**, keinen hier erfundenen. Was schiefging, weiß
  der Aufrufer; ein eigener Text wäre die zweite Fassung derselben Auskunft.
- **Der Spinner bleibt ohne `label`.** Der Satz steht sichtbar daneben, die Zeile selbst ist
  `role="status"`. Ein zweiter versteckter Text darüber ließe eine Vorlesehilfe „Ordner werden
  geladen" zweimal sagen.

Denselben Fehler hatte der **Spaltendialog** auf dem Board (in der Zustandstabelle von R-2 als ✗
geführt, nicht als Befund): `columns` ist leer, solange das Board lädt, und der Dialog sagte „Noch
keine Spalte". Er bekommt jetzt `boardState` und `onRetry` und unterscheidet dieselben drei Fälle.
Ebenso `BoardEmptyState`: „Sie haben noch keine Regel" steht nur noch, wenn die Regelliste
tatsächlich geladen ist (`poolsKnown`) — sonst wird der Satz weggelassen statt geraten.

## 2. B-3b — die Kürzung ist aufgehoben, nicht beschriftet (blockierend)

**Geprüft, ob `poolsContaining` weitere Nutzer hat:** nein, genau einer —
`app/TimerContext.tsx:281`. Die Aufzählung im Toast ist damit die einzige Fläche, an der die
Kürzung überhaupt sichtbar wurde.

Ich habe **aufgehoben** statt benannt, und der Grund ist nicht Bequemlichkeit: Gekürzt wurde
**vor** der Abfrage. Die Oberfläche weiß deshalb gar nicht, ob die übersprungenen Pools das Todo
enthalten. „… und drei weitere" wäre eine Behauptung über eine Menge, die niemand geprüft hat;
ehrlich wäre nur „drei weitere, vielleicht" gewesen, und das ist keine Auskunft, sondern eine
Ausrede.

Was das kostet: ein Abruf je Pool, alle nebenläufig, gegen einen Dienst auf `127.0.0.1` und eine
eingebettete SQLite-Datei. Die Zahl der Pools ist eine Konfiguration des Benutzers, keine
Datenmenge. Der Vorgang läuft ausschließlich beim Timerstart auf einem **erledigten** Todo. Und er
läuft nicht mehr lange: Nach E-058 liefert `POST /timer/start` die Bewegung als `poolMovement`
mit, und dieser Weg entfällt vollständig. Die Signatur habe ich unangetastet gelassen, damit
`TimerContext.tsx:270-295` in dieser Aufgabe nicht angefaßt werden mußte.

## 3. R-1 — die Domäne führt den Wertebereich, `labels.ts` nur die Beschriftung

Sechs Aufzählungen kommen jetzt aus `@takt/domain` und werden re-exportiert:
`TimeEntrySource`, `RoundingMode`, `ExportAuditEvent`, `PoolPlacement`, `PoolCompletionFilter`,
`PoolExportFilter`. `api/types.ts` bezieht sie unverändert aus `lib/labels.ts` und mußte nicht
angefaßt werden.

Die Wirkung ist die, die R-1 beschreibt: Bekommt `PoolCompletionFilter` in der Domäne einen
vierten Wert, wird jetzt `POOL_COMPLETION_LABEL` rot, weil `Record<PoolCompletionFilter, string>`
unvollständig ist — und ebenso `COMPLETION_TEXT` in `lib/poolRule.ts` (`Record<Exclude<…>>`).
Vorher blieb die enge Fassung in `apps/web` zuweisbar, nichts wurde rot, und die Tabelle lieferte
zur Laufzeit `undefined`, wo ihr Typ `string` verspricht.

**Denselben Blick auf jede andere Aufzählung in `labels.ts`** — das Ergebnis steht als Absatz im
Kopf der Datei:

| Typ | Woher | Warum |
|---|---|---|
| `TimeEntrySource`, `RoundingMode`, `ExportAuditEvent`, `PoolPlacement`, `PoolCompletionFilter`, `PoolExportFilter` | `@takt/domain` | die Domäne führt sie als benannten Typ |
| `DoneFlagState` | bleibt hier | **Anzeige**zustand ohne Entsprechung im Datenmodell — `reopened` steht in keiner Spalte |
| `ThemeSetting` | bleibt hier | die Domäne schreibt denselben Wertebereich **inline** an `AppSettings.theme` (`settings.ts:37`) und gibt ihm keinen Namen |
| `PoolMatchMode` | bleibt hier | ebenso inline an `Pool.matchMode` (`tag.ts:283`) |

Die beiden letzten sind damit weiterhin zweite Fassungen, aber nicht aus Nachlässigkeit: Es gibt
dort nichts zu importieren. Der Kommentar an beiden sagt das und nennt die Zeile in der Domäne.
Siehe offene Frage 1.

`apps/web/package.json:6` sagt jetzt, daß `@takt/domain` aus drei Gründen dasteht — `tagNameKey`,
die Regelfragen aus T-083 und seit T-091 der Wertebereich der Aufzählungen.

## 4. S-2 — „Regel über Tags" an elf Stellen

Drei Fassungen in `lib/labels.ts`, damit die zwölfte Stelle nicht wieder eine eigene wird:

```
RULE_IS_A_RULE          Eine Spalte ist eine Regel — über Tags, Status, „Erledigt“ und den
                        Exportstatus.
RULE_NOT_A_PLACE        Eine Spalte ist eine Regel, kein Ablageort.
RULE_WHAT_MOVES_A_CARD  Welche Karte wo steht, entscheidet die Regel — nicht die Maus. Eine
                        Karte wandert, wenn sich am Todo etwas ändert, das die Regel abfragt.
```

Ersetzt an: `BoardScreen` (Kopfzeile, Leerzustand, zwei Absätze der Umstellungskarte,
Spaltendialog), `Navigation`, `TodoFormDialog`, `TagsScreen` (Kartentitel, Beschreibung,
Leerzustand), `StatusSettings` (Kopfkommentar und der sichtbare Hinweis), `Kanban.tsx`
(Bauteilkommentare), `api/types.ts` (Typkommentare), `showcase/BoardSection`,
`showcase/InventorySection`, `showcase/data.ts`.

Dabei sind mir vier weitere Stellen derselben Art aufgefallen, die R-2 nicht aufführt und die
seit E-055 ebenso falsch sind — „ohne Tag paßt keine Poolregel": `TodoDetailScreen` (Kartentext
und der Fall ohne Tags), `TagsScreen` (Leerzustand des Tag-Baums), `SettingsScreen` (Hinweis ohne
Standard-Tag). Eine Regel über Status oder Exportstatus trifft ein Todo ohne jedes Tag sehr wohl.
Alle vier sagen jetzt „Regeln, die Tags verlangen, treffen es nicht" statt „keine Regel trifft
es".

**Bewußt nicht angefaßt:** `showcase/TimeSection.tsx:122-123`. Der Text bildet den Timer-Toast ab,
und der bleibt bis Welle B unverändert stehen. Eine Musterseite, die etwas anderes zeigt als die
Anwendung, ist schlechter als eine, die den bekannten Fehler mitzeigt.

## 5. Die übrigen umgesetzten Punkte

**S-6, `RadioRow`.** Die versteckten Hilfssätze stehen jetzt als Geschwister der Optionsliste
statt im `<label>`. Nachgemessen an der laufenden Musterseite über `ariaSnapshot()`:

```
- radio "Mindestens eines davon" [checked]      vorher: Name plus 28 Wörter Hilfssatz
- radio "Alle schränkt nicht ein" [checked]
- radio "Erledigt"
- radio "Unerledigt"
```

Jedes `aria-describedby` zeigt weiterhin auf einen vorhandenen Knoten; geprüft, keines läuft ins
Leere. **Für den e2e-tester wichtig:** Der Zugriff `getByRole('radio', { name: /^Erledigt\b/ })`
aus `tests/e2e/support/actions.ts` trifft weiterhin genau einen Knopf — der Name ist jetzt „Erledigt"
statt „Erledigt Nur erledigte Todos. …". Der Kommentar darüber (Zeilen 125-131) beschreibt die
alte Bauform und ist veraltet; die Datei gehört mir nicht.

**S-8, Live-Region.** `ruleSpoken(description, reach)` in `lib/poolRule.ts` macht aus der Regel
**einen** Satz; er steht unter der Vorschau in einer `role="status" aria-live="polite"`-Region.
Vorgelesen wird der Satz und nicht der Kasten: Eine Chipwolke als Live-Region sagt bei jedem
Tastendruck alles noch einmal, und dann schaltet der Benutzer die Vorlesehilfe ab statt der
Region. Aus demselben Grund wartet der Satz 500 ms — wer mit den Pfeiltasten durch eine
Optionszeile geht, berührt drei Werte auf dem Weg zum vierten, und angesagt gehört nur der vierte.
Die **sichtbare** Vorschau wartet nicht. Der Grund einer nicht erfüllbaren Regel steht am Ende des
Satzes: Wer nach dem dritten Wort weghört, hat trotzdem gehört, was die Regel trifft.

Dazu die Reihenfolge aus Abschnitt 9 von R-2: Die **Warnbänder stehen jetzt vor der Vorschau**.
Vorher kamen sie danach, also hinter der Stelle, auf die sie sich beziehen.

**S-1, Exportachse.** `POOL_EXPORT_NOT_BILLED_HINT` steht am Wert „Exportiert": „Ausgebuchte
Buchungen („Nicht abgerechnet", E-047) zählen mit: Sie tragen denselben Exportstatus, obwohl sie
nie in einer Datei waren." Eine vierte Option wäre falsch (E-032, zweiwertig). **Die Domäne ist
nicht betroffen** — ich habe nachgesehen: `pool.export_state` fragt genau den Statuswert ab, und
E-047 setzt ihn bewußt auf `exported`. Das ist so gewollt; falsch war allein die Beschriftung.

**S-7, vier Bedienelemente, vier Namen.** „Erforderliche Tags" / „Erforderliche Ordner" /
„Ausgeschlossene Tags" / „Ausgeschlossene Ordner". Beide Ordnerauswahlen tragen jetzt
`role="group"` mit `aria-labelledby` wie der `StatusPicker`. Nachgemessen im Aria-Baum. Die
Abschnittsüberschriften bleiben — sie sind die Gliederung für Sehende.

**S-9, Toast nach dem Speichern.** Er wird aus `saved.resolved` gefärbt: Trifft die gespeicherte
Regel wegen eines leeren Ordners nichts, ist der Toast eine Warnung und nennt den Ordner beim
Namen. Beschrieben wird der **gespeicherte** Stand über `axesOf(saved)`, nicht der Entwurf — der
Dienst hat die Ordner aufgelöst, die Oberfläche nicht.

**S-3, Erledigt-Toast auf dem Board.** Die drei Sätze behaupteten, die Spalte ändere sich nicht.
Seit E-055 kann eine Spalte nach „Erledigt" fragen; dann ändert sie sich mit genau dieser
Handlung. Gesagt wird jetzt nur, was ohne Kenntnis der eingerichteten Regeln wahr ist: „Tags und
Status ändern sich dadurch nicht." Wohin die Karte wandert, sagt nach E-058 die Domäne.

**S-5, zwei Schutzniveaus für dieselbe Handlung.** Ich bin der Empfehlung gefolgt und habe die
**schwächere, ehrlichere** Fassung auf beide Flächen gelegt: kein Bestätigungsdialog mehr auf dem
Board, dafür auf **beiden** Flächen ein Toast mit „Rückgängig". Der Dialog erklärte vor allem, daß
nichts verlorengeht — das sagt ein Toast mit Rückweg überzeugender, weil man es ausprobieren kann.
Der Satz aus dem Dialog („Die Regel bleibt vollständig erhalten; gelöscht wird nichts, und an den
Todos ändert sich nichts.") ist in den Toast gewandert, also nicht verloren. Der vorherige
Anzeigeort wird **vor** dem Aufruf gelesen; nach `structure.reload()` stünde dort schon der neue
Wert, und „Rückgängig" führte auf sich selbst zurück.

**S-10, Musterseite.** Die Zeile „Spalte" der Tabelle nennt jetzt die fünf Bedingungen, und der
Absatz darunter ist zweigeteilt: Steht die Erledigt-Bedingung neutral, entscheidet das Kennzeichen
die Sichtbarkeit; sagt sie etwas, entscheidet sie die Zugehörigkeit.

**H-1** Der Filterschalter „Erledigte einblenden" nennt die Ausnahme. **H-2** Vier neue
Kontrastpaare in der Gruppe „Regelformular", darunter das ungemessene: Optionsknopf
(`--accent-bg`) auf der gewählten Optionszeile (`--accent-bg-subtle`). Alle grün, Gesamtlauf 0 von
432. **H-3** `POOL_STATUS_LABEL.any` als eigene Konstante; der Hilfssatz der Statusachse holt sein
Wort nicht mehr aus der Erledigt-Achse.

**Sprache 2 („Alle" doppelt belegt).** Der strengste Modus hieß „Alle davon" — drei Zeilen unter
einem Neutralwert, der ebenfalls „Alle" heißt und das Gegenteil bedeutet. Er heißt jetzt „Jedes
der genannten", in der Zusammenfassung „Jedes von". Damit ist „Alle" nur noch der Neutralwert.
**Sprache 5 („Achse").** Beide Oberflächenstellen sagen jetzt „Bedingungen"; „Achse" bleibt in
Code, Berichten und Datenmodell.

## 6. A-4.4 — die halbe Antwort, und was die ganze kostet

`FolderPicker` bekommt ab acht Ordnern ein Suchfeld, das über den **ganzen Pfad** filtert („kunden
ost" findet „Kunden / Ost"). Zwei Regeln halten es ehrlich: Ein **gewählter** Ordner wird immer
gezeigt, auch wenn die Suche ihn nicht trifft — sonst sähe der Benutzer eine Regel ohne die
Bedingung, die er gerade gesetzt hat. Und mehr als sechzig Chips werden nicht gezeichnet; darunter
steht dann, wie viele fehlen. Das Feld steht zwischen Beschriftung und Chips, nicht darüber: Sonst
erreichte der Tabulator zuerst ein Feld ohne sichtbare Beschriftung.

Das ist die Hälfte von A-4.4. Die andere Hälfte — eine Kombobox mit Baumpfad in der Bauform von
`TagInput`, mit Tastaturbedienung über Ark UI und Chips für das Gewählte — schätze ich auf **eine
halbe bis eine Aufgabe** (rund 200 Zeilen neuer Baustein, dazu Kontrastpaare, Musterseite und ein
e2e-Fall). Sie lohnt sich erst zusammen mit der Frage aus T-083 (offene Frage 3), ob der Dienst je
Ordner eine Tagzahl liefern kann — dann könnte die Auswahl leere Ordner schon beim Auswählen
kenntlich machen, statt sie erst an der fertigen Regel zu melden.

## 7. Musterseite

Sechs neue Zustände nebeneinander, in hell und dunkel im Browser nachgesehen:

| Abschnitt | Was dazugekommen ist |
|---|---|
| 5b, Regel | Ordnerauswahl: lädt · Fehler mit Rückweg · bereit und leer · bereit mit Suche |
| 5b, Regel | Statusauswahl: lädt · bereit |
| 5b, Regel | der **vorgelesene** Satz sichtbar neben der Vorschau |
| 5, Board | das Board beim Laden und beim Scheitern — beides fehlte |

Der vorgelesene Satz steht dort sichtbar, weil eine Ansage, die man nur hören kann, nicht
abgenommen, sondern geglaubt wird — und weil man erst nebeneinander sieht, daß beide dasselbe
sagen. Die Ordnerliste der Musterseite ist auf zwölf erfundene Ordner erweitert, damit die Schwelle
für das Suchfeld überhaupt erreicht wird; keine Kundendaten, keine Call-Nummern.

## 8. Prüfläufe

| Lauf | Ergebnis |
|---|---|
| `pnpm --filter @takt/web typecheck` | grün |
| `pnpm run typecheck` (vollständig, acht Pakete + `typecheck:test`) | **grün**, Exit 0 |
| `pnpm run contrast` | 0 von 432 durchgefallen |
| `pnpm --filter @takt/web build` | grün, 365 Module |
| `pnpm --filter @takt/web build:designsystem` | grün |
| `pnpm run boundaries` | grün, Notiz-Trennung unverletzt |
| `pnpm run test:e2e` | 34 von 34 grün (zweimal gelaufen, `-- kanban` und `-- pool`; das Argument filtert nicht durch, es lief jeweils die ganze Mappe) |
| Musterseite hell und dunkel | keine Konsolenfehler, Aria-Baum geprüft |

Port 17843 war vor jedem Lauf frei; es wurde kein fremder Prozeß beendet. Die Musterseite lief auf
einem eigenen Port 5199 und ist danach gestoppt.

Der vollständige `typecheck` war zum Zeitpunkt meiner Messung grün — T-089 und T-090 haben ihre
Stände offenbar bereits abgelegt (`packages/domain/src/pool-movement.ts` und
`apps/local-api/src/usecases/pool-movement.ts` liegen im Arbeitsbaum).

---

Annahmen:

1. **B-3b wird aufgehoben, nicht beschriftet.** Begründung oben in Abschnitt 2: Die Zahl der
   ungeprüften Pools ist keine Auskunft über die Zugehörigkeit.
2. **S-5 in der schwächeren Fassung.** Der Bestätigungsdialog auf dem Board ist weg, beide Flächen
   haben „Rückgängig". Das ist die vom Reviewer empfohlene Variante und zurücknehmbar — sie kostet
   eine `ConfirmDialog`-Einbindung, keine Modelländerung. Kein e2e-Fall hing daran (geprüft).
3. **Die Modusbeschriftung heißt jetzt „Jedes der genannten".** Der Datenwert `all` ist unberührt.
4. **`POOL_EXPORT_LABEL.open` bleibt „Offen".** Siehe Risiko 2.
5. **Vier Stellen außerhalb der R-2-Liste mitkorrigiert** („ohne Tag paßt keine Poolregel"). Sie
   sind derselbe Befund wie S-2, nur an anderen Bildschirmen.
6. **Der Spaltendialog und `BoardEmptyState` bekommen dieselbe Behandlung wie B-5**, obwohl sie in
   R-2 nur als ✗ in der Zustandstabelle stehen. Es ist derselbe Fehler; ihn im selben Zug stehen
   zu lassen hieße, ihn in der nächsten Runde noch einmal zu melden.

Risiken:

1. **Der Poolsatz im Toast ist weiterhin falsch.** `CARD_STAYS`, „Auf seine Tags paßt derzeit keine
   Poolregel" und die Aufzählung in `TimerContext.tsx:270-295` stehen unverändert — Welle B nach
   E-058, wie beauftragt. Die Domänenfunktion liegt inzwischen im Arbeitsbaum
   (`packages/domain/src/pool-movement.ts`); die Umstellung ist damit startbar.
2. **„Offen" bleibt doppelt belegt** (Sprache 3 aus R-2). Ich habe die beiden vorgeschlagenen
   Ersatzwörter geprüft und beide verworfen: „Nicht exportiert" wäre **falsch** — die Achse
   bedeutet „hat mindestens eine offene Buchung", nicht „hat keine exportierte" —, und „Mit
   offener Buchung" wäre zeichengleich mit `EXPORT_TEXT.open` in `lib/poolRule.ts` und damit eine
   zweite Fassung derselben Zeichenkette. Das braucht eine Wortentscheidung, keine Umsetzung.
   Siehe offene Frage 2.
3. **Ein Abruf je Pool** statt zwölf (Abschnitt 2). Bei sehr vielen Regeln dauert der Toast
   entsprechend länger, bis er die Pools nennt; er erscheint aber sofort, weil die Auskunft
   nachgereicht wird. Der Weg entfällt in Welle B.
4. **Der Kommentar in `tests/e2e/support/actions.ts:125-131`** beschreibt die alte
   `RadioRow`-Bauform. Die Zugriffe funktionieren weiter (gemessen), nur der Kommentar ist
   veraltet. Fremde Hoheit.
5. **`apps/desktop/release/…` steckt weiterhin in der Historie** (`48c982a`, `.git` 182 MB). Die
   `.gitignore` ist seit `d2a7083` richtig und nichts davon ist mehr verfolgt — das Umschreiben
   der Historie vor dem Zusammenführen bleibt offen und ist keine Dateiänderung, sondern eine
   Entscheidung des Orchestrators.
6. **Sicherheit:** keine neue Angriffsfläche. Es kommt kein Feld dazu, das Kunden- oder
   Call-Daten trägt. Die Fehlermeldung der Ordnerauswahl gibt die Meldung des Dienstes wieder und
   erfindet keinen Pfad; die Musterdaten sind erfunden. Kein Export ist berührt, keine Todo-Notiz
   wird angezeigt (`boundaries` grün).

Offene Fragen:

1. **An den domain-dev, über den Orchestrator:** Bekommen `AppSettings.theme` und `Pool.matchMode`
   in der Domäne einen benannten Typ (`ThemeSetting`, `PoolMatchMode`)? Beide sind heute
   Inline-Vereinigungen an ihrem Feld, und `apps/web` führt deshalb die einzigen beiden
   verbliebenen Zweitfassungen. Zwei Zeilen in `settings.ts` und `tag.ts`, dann fallen sie weg.
2. **Wortentscheidung:** Wie soll der Wert `open` der Exportachse im Regelformular heißen? „Offen"
   kollidiert mit dem Erledigt-Kennzeichen auf der Karte, „Nicht exportiert" wäre sachlich falsch
   (Risiko 2). Mein Vorschlag: **„Noch nicht abgerechnet"** — es sagt, wozu man die Spalte anlegt,
   und kollidiert mit nichts. Ich habe es nicht gesetzt, weil es nach E-047/E-050 an das Wort
   „abgerechnet" rührt, und das ist im Projekt belegt.
3. **Soll der Bestätigungsdialog für „Vom Board nehmen" wirklich fallen?** Umgesetzt wie von R-2
   empfohlen (Annahme 2). Wenn der spec-ux-reviewer inzwischen anders sieht, ist der Rückweg eine
   `ConfirmDialog`-Einbindung auf beiden Flächen statt auf einer.

Nächster Schritt:

Welle B starten: `TimerContext` auf `poolMovement` aus `POST /timer/start` und
`poolMovementSentence` aus `packages/domain` umstellen, `CARD_STAYS` und die
`poolsContaining`-Aufzählung ersatzlos entfernen, im selben Zug den Board-Toast aus S-3 an
dieselbe Quelle hängen und `showcase/TimeSection.tsx:122-123` nachziehen. Das ist **eine** Aufgabe
über zwei Hoheiten (frontend-dev und integration-dev), wie R-2 im Urteil verlangt — zwei parallele
erzeugen genau die zweite Fassung, gegen die `proof:addin` gebaut ist. Danach den unit-tester auf
`ruleSpoken` und auf die drei Zustände von `RulePickers` ansetzen.
