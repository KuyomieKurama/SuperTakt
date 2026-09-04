Aufgabe: T-079 — Das Regelformular nach dem Vorbild, das der Auftraggeber geschickt hat

Status: fertig

Artefakte:

Neu:

```
apps/web/src/lib/poolRule.ts              die Regel in lesbare Teile zerlegen: `describeRule`
                                          trennt einschränkende von neutralen Achsen,
                                          `countConditions` zählt sie. Beschreibt, entscheidet
                                          nicht — Zugehörigkeit bleibt bei `matchesPool` (307)
apps/web/src/components/RadioRow.tsx      Optionszeile für dreiwertige Achsen, wie im Vorbild.
                                          Native `<input type=radio>` im `<fieldset>`; der
                                          Neutralwert trägt dauerhaft „schränkt nicht ein" (133)
apps/web/src/components/RuleSummary.tsx   die Regel in Worten — eine Bauform für Spaltenkopf,
                                          Pool-Zeile und Formularvorschau (136)
apps/web/src/showcase/RuleSection.tsx     Musterseite „5b — Die Regel einer Spalte": die vier
                                          Regelformen nebeneinander, die Optionszeilen in Ruhe,
                                          gewählt und gesperrt, die Vorschau live (225)
.claude/team/reports/T-079-frontend-dev.md  dieser Bericht
```

Geändert:

```
apps/web/src/screens/PoolFormDialog.tsx   das Formular nach dem Vorbild: erforderliche Tags mit
                                          Modus, ausgeschlossene Tags, Ordnertiefe, Status,
                                          Erledigt, Exportstatus, Vorschau (236 → 604)
apps/web/src/lib/labels.ts                `PoolMatchMode`, `PoolCompletionFilter`,
                                          `PoolExportFilter` samt Beschriftungen und Hinweisen;
                                          `POOL_AXIS_NEUTRAL_HINT` (+78)
apps/web/src/api/types.ts                 `Pool` und `PoolWrite` tragen `excludedTags`,
                                          `statusIds`, `completion`, `exportState` (+70/−13)
apps/web/src/app/StructureContext.tsx     `useRuleLookup()` — Kennung zu Name für die drei
                                          Flächen, die die Regel anzeigen (+46)
apps/web/src/screens/BoardScreen.tsx      gemeinsame `RuleSummary` statt eigener Fassung;
                                          `BoardColumnEmpty` als eigener Baustein mit **zwei**
                                          Leerzuständen; Bedingungen werden gezählt statt
                                          Regelterme (+83/−69)
apps/web/src/screens/TagsScreen.tsx       S-11 zeigt dieselbe Zusammenfassung wie das Board
                                          (+15/−41)
apps/web/src/showcase/data.ts             Spaltenregeln als `RuleAxes` statt als Satz; sechste
                                          Spalte „Noch nicht eingerichtet" (+102/−22)
apps/web/src/showcase/BoardSection.tsx    Musterseite benutzt `RuleSummary` und
                                          `BoardColumnEmpty` (+24/−9)
apps/web/src/showcase/Showcase.tsx        Abschnitt und Leiteintrag (+3)
apps/web/src/styles/app.css               `.form-section`, `.radio-row*`; `.pool-row__rule` auf
                                          den Abstand zurückgebaut; tote `.pool-row__term`
                                          entfernt (+156/−22)
apps/web/src/styles/components.css        `.rule-summary*`; die drei toten `.kcolumn__rule-*`
                                          entfernt; `.radio-row`/`.form-section` in den
                                          senkrechten Rhythmus des Kartenrumpfs (+157/−31)
```

Nicht angefasst: `packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `tests/e2e/**`,
`apps/web/test/**`, `docs/**`. `apps/desktop/src/**` kennt die Regel nicht (nachgesehen: kein
Treffer auf `Pool`, `matchMode` oder `rule`). Kein `git commit` — die Änderungen liegen im
Arbeitsbaum auf `status-als-regelterm`, neben denen aus T-076.

Bedienskripte, Aufsetzdaten und 15 Bildschirmaufnahmen liegen im Wegwerfordner der Sitzung,
außerhalb des Projekts.

---

Zusammenfassung:

Das Regelformular hat jetzt die Gestalt des Vorbilds: **je Bedingung ein benanntes Feld**, kein
Und/Oder-Schalter. Die vier Punkte, die die Aufgabe ausdrücklich verlangt hat, sind alle an einer
sichtbaren Stelle gelandet und keiner in einem Kommentar: Die Modus-Vorgabe bleibt „mindestens
eines davon", und wer sie an einer **vorhandenen** Regel umstellt, liest vor dem Speichern, dass
sie danach anders trifft. Die Regel ohne Bedingung ist anlegbar geworden und sagt an drei Stellen,
warum sie leer bleibt. „Alle" trägt in jeder Optionszeile den Zusatz „schränkt nicht ein", und die
Vorschau zählt die neutralen Achsen ausdrücklich auf, statt sie wegzulassen. Und „Exportiert"
heißt dort, wo es gewählt wird, ausgeschrieben „mindestens eine exportierte Buchung — nicht
vollständig abgerechnet".

`pnpm typecheck`, `pnpm contrast` (**416 Paare, 0 durchgefallen** — unverändert, ich habe nur
gemessene Paare verwendet) und `pnpm build` sind grün; `pnpm proof:callers` (18/18) und
`pnpm proof:openapi` (64/64) ebenfalls, `pnpm boundaries` ohne Befund. Im Browser nachgesehen,
hell und dunkel, gegen den echten Dienst mit vier Spalten: nur über Status, gemischt, mit
ausgeschlossenem Tag, ohne jede Bedingung. Keine Konsolenmeldung, kein Seitenfehler.

---

## 1. Was das Vorbild entschieden hat und was Takt dazugetan hat

Das Bildschirmfoto zeigt eine Liste benannter Bedingungen. Genau das steht jetzt im Dialog, in
derselben Reihenfolge:

| Vorbild | Takt | Bedienelement |
|---|---|---|
| Titel | Name | Textfeld |
| Erforderliche Tags | Erforderliche Tags | Tag-Eingabe + Ordner-Chips |
| — | Wie viele davon müssen zutreffen? | Optionszeile `any`/`all` |
| Ausgeschlossene Tags | Ausgeschlossene Tags | Tag-Eingabe + Ordner-Chips |
| Aufgabenstatus erledigt | Erledigt | Optionszeile Alle / Erledigt / Unerledigt |
| Planungsstatus | Status | Chips, mehrere möglich, leer = Alle |
| Rückstandsaufgaben | — | (gibt es bei Takt nicht) |
| Projekt | Anzeigeort | Auswahlfeld — Takt-eigen (E-054) |
| — | **Exportstatus** | Optionszeile Alle / Offen / Exportiert |

Die Zeile, die das Vorbild nicht hat, ist die wichtigste: **Exportstatus**. Sie beantwortet als
Spalte „was habe ich noch nicht abgerechnet", und sie ist die einzige Achse, deren Etikett sich
die Zusammenfassung von woanders borgt — `ExportStatusBadge`, dasselbe Etikett wie an jeder
Buchung, in jeder Zeile und in jeder Vorschau. Der Exportstatus ist die Unterscheidung, um die
sich Takt dreht; ihn im Regelformular anders zu zeichnen hieße, ihn zweimal zu erklären.

Die Zeile, die das Vorbild nicht braucht und Takt schon: **der Modus für die erforderlichen
Tags**. Warum sie da ist, steht in Abschnitt 2.

**Der Anzeigeort bleibt oben und nicht unten.** Im Vorbild steht „Projekt" weit hinten; bei Takt
entscheidet der Anzeigeort, ob die Regel überhaupt auf dem Board erscheint, und das gehört vor die
Bedingungen — sonst richtet jemand eine Spalte ein, die keine ist.

## 2. Punkt 1 — der Modus, der nichts still umdeutet

Die Vorgabe ist `any` und bleibt `any`. Der domain-dev hat in T-076 nachgesehen statt geraten, und
das Ergebnis steht an vier Stellen gleich (Migration 0001, Routenschema, Beschreibung, dieses
Formular). Ich habe die vierte nicht angefasst: `useState<PoolMatchMode>("any")`, und der
Rücksetz-Effekt liest `pool?.matchMode ?? "any"`.

Was dazugekommen ist, ist die **Warnung beim Umstellen einer vorhandenen Regel**:

> **Diese Regel trifft danach andere Todos**
> Bisher genügte eines der genannten Tags. Mit „Alle davon" muss ein Todo ab dem Speichern jeden
> davon tragen — die Regel trifft dann weniger.

Und in der Gegenrichtung dieselbe Aussage mit „mehr". Sie erscheint **nicht**, wenn der Unterschied
keiner ist: bei null oder einem Tag treffen „mindestens eines von einem" und „alle von einem"
dasselbe. Eine Warnung ohne Folge macht die nächste echte unglaubwürdig. Ein einzelner
**Ordner**-Term zählt dagegen als Unterschied, weil er zu beliebig vielen Tags aufgelöst wird.

Gemessen im Browser: an der Spalte „Support ohne Archiv" (ein Tag) erscheint sie nicht, an
„Gemischt" (ein Tag und ein Ordner) erscheint sie sofort beim Umschalten.

## 3. Punkt 2 — die leere Regel gehört in den Leerzustand, und **ich habe eine Sperre entfernt**

Das ist die eine Verhaltensänderung dieser Aufgabe, und sie ist bewusst:

**Bis T-079** war der Speicherknopf gesperrt, solange keine Bedingung gewählt war
(`submitDisabled={… || rule.length === 0}`). **Seit T-079** ist er es nicht mehr; gesperrt bleibt
er nur ohne Namen, weil der Dienst ohne Namen nichts anlegt.

Der Grund ist der Satz aus der Aufgabe: „Eine Regel ohne Bedingungen ist der Zustand direkt nach
dem Anlegen." Wenn das stimmt — und es stimmt —, dann ist „keine Bedingung" kein Fehler des
Benutzers, sondern ein Schritt auf dem Weg. Eine gesperrte Schaltfläche erklärt an keiner Stelle
etwas; sie hindert nur. **Drei** Flächen erklären es jetzt stattdessen:

1. **Im Formular**, unter der Vorschau, eine Warnmeldung: „Diese Spalte bleibt leer — es ist noch
   keine Bedingung gewählt. Eine Regel ohne Bedingung trifft **nichts** — nicht alles. Anlegen
   lässt sie sich trotzdem: Sie bleibt leer, bis Sie eine Bedingung ergänzen, und füllt sich dann
   von selbst." Die Erfolgsmeldung nach dem Anlegen ist in diesem Fall ein **Warnton**, kein
   Erfolgston, und wiederholt den Grund.
2. **Unter dem Spaltenkopf**: „⚠ Ohne Bedingung — diese Spalte bleibt leer."
3. **In der Spalte selbst**, als eigener Leerzustand (siehe unten).

`BoardColumnEmpty` unterscheidet jetzt zwei Fälle, die vorher beide „Keine Karte trifft diese
Regel" hießen:

| | Symbol | Überschrift | Erklärung | Handlung |
|---|---|---|---|---|
| Bedingungen stehen | Posteingang | Keine Karte trifft diese Regel | „Die Bedingungen stehen — im Augenblick erfüllt sie kein Todo." | Regel bearbeiten (sekundär) |
| keine Bedingung | Warndreieck | Diese Spalte hat noch keine Bedingung | „Sie bleibt leer, bis eine dazukommt … Nennen Sie einen Tag, einen Ordner, einen Status, „Erledigt" oder den Exportstatus, dann füllt sie sich von selbst." | **Bedingung ergänzen** (primär) |

Der Unterschied ist nicht Wortklauberei: Der erste Zustand kann sich morgen von selbst auflösen,
der zweite nie. Beide „keine Todos" zu nennen verschwiege genau den Zustand, den ausschließlich
der Benutzer beheben kann.

Der Baustein ist aus `BoardScreen.tsx` **exportiert**, weil dieselben zwei Zustände auf der
Musterseite nebeneinanderstehen müssen — zwei getrennt gepflegte Fassungen desselben Textes liefen
binnen einer Aufgabe auseinander.

## 4. Punkt 3 — „Alle" heißt „schränkt nicht ein"

Drei Maßnahmen, keine davon ein Hilfetext, den man erst durch Auswählen sieht:

1. **Der Zusatz steht an der Option, dauerhaft.** `( ) Alle  schränkt nicht ein` — in kleinerer,
   gedämpfter Schrift unmittelbar hinter der Beschriftung, sichtbar, bevor jemand irgendetwas
   wählt. `RadioRowOption.neutral` markiert die Option, `neutralNote` liefert den Text.
2. **Die Zusammenfassung nennt neutrale Achsen nicht.** Das ist die Leseregel dieser Fläche: Was
   dasteht, engt ein; was fehlt, lässt alles durch. `describeRule` liefert deshalb zwei Listen —
   `axes` (einschränkend) und `neutral` — und die Ansicht zeichnet auf Board und Pool-Liste nur
   die erste.
3. **Im Formular wird die zweite Liste ausgesprochen**, weil dort gewählt wird:
   „ⓘ Ohne Einschränkung: Status, Erledigt. Diese Achsen lassen alles durch, was die übrigen übrig
   lassen — sie treffen nichts von sich aus."

Der letzte Halbsatz ist der wichtige. Er sagt in einer Zeile, warum eine Regel aus lauter
Neutralwerten nichts trifft, ohne den Benutzer Aussagenlogik lesen zu lassen.

## 5. Punkt 4 — `exported` heißt „mindestens eine", und das steht, wo gewählt wird

Am Optionsknopf „Exportiert", als Hinweis unter der Zeile und als `aria-describedby` an genau
diesem Knopf:

> Todos mit mindestens einer exportierten Buchung. Nicht „vollständig abgerechnet": Ein Todo mit
> einer offenen und einer exportierten Buchung erfüllt beide Bedingungen und steht in beiden
> Spalten.

Daneben „Offen": „Todos mit mindestens einer abgeschlossenen, offenen Buchung — die Antwort auf
‚was habe ich noch nicht abgerechnet'." Beide Sätze stehen zusätzlich in `lib/labels.ts` am Typ und
in `lib/poolRule.ts` an der Textkonstante; die Zusammenfassung schreibt deshalb „Mit offener
Buchung" und nirgends „abgerechnet".

Der Satz hängt an **jedem** Optionsknopf und nicht nur am gewählten: Wer mit den Pfeiltasten durch
die Gruppe geht, soll hören, wozu die nächste Wahl führt, statt sie erst treffen zu müssen. Sichtbar
steht der Satz der gewählten Option unter der Zeile, mit `aria-hidden` — zweimal vorgelesen klänge
er wie zwei Aussagen.

## 6. Die Erledigt-Achse gegen „Erledigte einblenden"

Zwei Regeln über dasselbe Kennzeichen, eine in der Regel, eine in der Ansicht. Der domain-dev hat
das mit „Zugehörigkeit vor Sichtbarkeit" aufgelöst; die Oberfläche muss es aussprechen, sonst
sucht jemand den Schalter, der nicht wirkt:

- `Alle`: „Erledigt entscheidet nicht über die Zugehörigkeit. Ob erledigte Karten zu sehen sind,
  sagt dann wie bisher der Schalter ‚Erledigte einblenden'."
- `Erledigt`: „… Diese Regel hat das letzte Wort — die Karten erscheinen auch dann, wenn erledigte
  sonst ausgeblendet sind. Hebt ein Timerstart das Kennzeichen auf, verlässt die Karte diese Spalte
  und steht wieder in ihrem Pool."
- `Unerledigt`: „… Hebt ein Timerstart das Kennzeichen auf, kehrt das Todo ohne Zutun hierher
  zurück."

Die beiden letzten Sätze sind die Stelle, an der A-2.5/I-05 in diesem Formular auftaucht: Der
Benutzer, der eine Spalte „Erledigt" baut, soll vorher wissen, dass ein Timerstart Karten daraus
entfernt — und der, der „Unerledigt" baut, dass sie dadurch hineinkommen.

## 7. Wie sich die fünf Achsen unterscheiden — ohne Farbe

Die Zusammenfassung steht an drei Flächen und muss auch in Graustufen tragen (SC 1.4.1). Jede Achse
hat **Symbol und Wort**, keine hängt an einer Farbe:

| Achse | Symbol | Wort | zusätzlich |
|---|---|---|---|
| erforderliche Tags | Etikett | „Mindestens eines von" / „Alle von" | — |
| ausgeschlossene Tags | durchgestrichener Kreis | „Ohne" | senkrechte Randschiene links |
| Status | Quadrat | „Status" / „Status — einer von" | — |
| Erledigt | Haken | „Nur erledigte" / „Nur unerledigte" | — |
| Exportstatus | Pfeil nach unten | das gewohnte Exportetikett | Ring/Scheibe, bernstein/grün |

Eine Achse je Zeile statt einer langen Umbruchzeile. Der Grund ist die Kanban-Spalte: Sie ist rund
17 rem breit, fünf Achsen nebeneinander brächen ohnehin um — nur an unvorhersehbaren Stellen, sodass
„Ohne" mal hinter den erforderlichen Tags stünde und mal davor.

## 8. Was ich im Browser gesehen habe

Aufgesetzt gegen den **echten** Dienst (`apps/local-api/src/index.ts`, eigener Bestand unter
`XDG_DATA_HOME` im Wegwerfordner, `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN` wie im
End-zu-Ende-Aufbau), vier Board-Spalten und ein Pool, hell und dunkel, 1500 × 1000.

**Die vier Spalten, wie sie im Kopf stehen:**

1. **„Nur über den Status"** — `▪ STATUS — EINER VON [In Progress] [Waiting]`. Keine Tagzeile, weil
   es keine gibt. Sechs Karten. Genau der Fall, den E-054 möglich gemacht hat: eine Spalte über den
   Status, ohne dass der Status wieder die Spalte wäre.
2. **„Gemischt"** — vier Zeilen: `MINDESTENS EINES VON [Kunden mit Unterordnern] [Support]`,
   `STATUS [In Progress]`, `ERLEDIGT [Nur unerledigte]`. Zwei Karten, beide mit dem Hinweis „Steht
   auch in 2 Spalten".
3. **„Support ohne Archiv"** — `MINDESTENS EINES VON [Support]`, darunter mit Randschiene
   `⊘ OHNE [Ablage / Archiv]`, darunter `EXPORTSTATUS (○ Offen mindestens eine Buchung)` im
   gewohnten bernsteinfarbenen Etikett. Vier Karten; „Archivierte Altanfrage aus 2024" steht in
   Spalte 1, aber **nicht** hier — der Ausschluss wirkt, und man sieht in der Zusammenfassung,
   warum.
4. **„Noch nicht eingerichtet"** — im Kopf „⚠ Ohne Bedingung — diese Spalte bleibt leer.", im Rumpf
   der neue Leerzustand mit Warndreieck, Überschrift „Diese Spalte hat noch keine Bedingung" und
   dem primären Knopf „Bedingung ergänzen". Zähler 0.

**Im Formular:** die Optionszeilen sitzen wie im Vorbild, `( ) Alle schränkt nicht ein` ist ohne
Klick lesbar, die Vorschau am Fuß zeigt die drei einschränkenden Achsen und nennt darunter die zwei
neutralen. Das Umstellen des Modus an „Gemischt" bringt sofort die gelbe Warnung. Der leere Dialog
zeigt Vorschau und Warnmeldung, und „Anlegen" ist bedienbar.

**Dunkel:** dieselben Aufnahmen; Randschiene, Etikett und Warnmeldung tragen, der Fokusring ist auf
`--bg-surface` und `--accent-bg-subtle` sichtbar.

**Zwei Dinge, die ich dabei gefunden und behoben habe:**

- Die leere Zusammenfassung erbte `flex-direction: column` von `.rule-summary`; das Warndreieck
  stand mittig **über** dem Satz statt davor. Sichtbar im Spaltenkopf und in der Formularvorschau,
  behoben mit einer ausdrücklichen Zeile und einem Kommentar, der sagt warum.
- `Unterordner einschließen` stand am Ende des Abschnitts „Ausgeschlossene Tags" und sah dadurch
  aus, als gälte es nur für sie. Es ist **eine** Einstellung für **beide** Listen und hat jetzt
  einen eigenen Abschnitt „Ordnertiefe".

## 9. Tastatur und Hilfsmittel — gemessen, nicht behauptet

Ein Prüflauf durch den geöffneten Dialog, im Wegwerfordner:

```
OHNE ZUGÄNGLICHEN NAMEN: keiner
VERWAISTE BESCHREIBUNGEN: keine        (jedes aria-describedby zeigt auf ein Element)
FOKUS BLEIBT IM DIALOG: true           (40 Tabulatorschritte)
STATUSCHIP GEDRÜCKT: true              (Eingabetaste, aria-pressed wechselt)
FOKUSRING AN DER OPTIONSZEILE: 2px solid
DIALOG GESCHLOSSEN: true               (Escape)
SEITENFEHLER: keine
```

Der Tabulatorlauf in Leserichtung: Name → Anzeigeort → Tag entfernen → Tag-Eingabe → **eine**
Haltestelle für die Modus-Gruppe → drei Ordner → ausgeschlossene Tag-Eingabe → drei Ordner →
Unterordner-Haken → sechs Statuschips → Erledigt-Gruppe → Exportstatus-Gruppe → Abbrechen →
Speichern.

Eine Optionsgruppe ist **eine** Haltestelle, gewechselt wird mit den Pfeiltasten — geprüft:
Pfeil rechts wechselt von „Mindestens eines davon" auf „Alle davon". Das ist der Grund, warum hier
native Optionsknöpfe stehen und keine nachgebauten: Nachgebaute Optionsknöpfe sind die
zuverlässigste Art, eine Tastaturbedienung zu verlieren.

Der Fokusring sitzt an der **Hülle** der Option und nicht am 13 Pixel breiten Knopf — an einer
36 Pixel hohen Fläche wäre er sonst kein Hinweis.

## 10. Was ich nicht selbst gerechnet habe

Keine Zeit, keine Rundung, keine Base64-Kodierung, keine Zugehörigkeit. `lib/poolRule.ts`
**beschreibt** eine Regel und entscheidet nichts: Welches Todo in welche Spalte gehört, beantwortet
`matchesPool` in `packages/domain` und in SQL der Dienst; welche Tags in einem Ordner liegen, löst
`PoolPort.resolveRule` auf.

Die eine Ausnahme ist benannt und steht als offene Frage in Abschnitt 12: `countConditions` fragt
die fünf Felder ab, ob sie alle neutral stehen. Das ist keine Zugehörigkeitsrechnung, aber es ist
**dieselbe Bedingung**, die `matchesPool` in `tag.ts` als Erstes prüft — und sie steht damit an zwei
Orten.

## 11. Übergaben, die damit eingelöst sind

`apps/local-api/scripts/proof-callers.mjs` führt in `NEVER_SENT` seit T-076 zwei Zeilen:

```js
createPool: ['excludedTags', 'statusIds', 'completion', 'exportState'],
updatePool: ['excludedTags', 'statusIds', 'completion', 'exportState'],
```

Die Oberfläche sendet alle vier Felder jetzt (`PoolWrite` in `api/types.ts`, ausgeschriebener Rumpf
im Dialog). Der Lauf bleibt dadurch grün — 18 von 18 —, aber die beiden Zeilen gelten nicht mehr.
Der Kommentar darüber sagt selbst: „ein Zusatz, der nicht mehr gilt, macht die Liste zum Rauschen."
**Löschen darf sie nur, wer `apps/local-api/**` besitzt** — für mich war die Datei gesperrt. Bitte
an integration-dev oder domain-dev weitergeben; danach ist die Übergabe aus T-076 auch im
Prüfpfad abgeschlossen.

## 12. Offene Fragen

**1. `isEmptyPoolRule` gehört in die Domäne, nicht in die Oberfläche.**
`countConditions` in `apps/web/src/lib/poolRule.ts` bildet die Bedingung nach, mit der
`matchesPool` (`packages/domain/src/tag.ts`, Zeile 544) eine leere Regel abweist: erforderliche
Tags, ausgeschlossene Tags und Status zusammen leer, `completion` und `exportState` neutral. Ich
brauche die Antwort für einen Zustand, den es sonst nirgends gäbe — die frisch angelegte Spalte,
die leer bleibt —, und sie kommt heute über keine Route. Die Oberfläche kann sie nicht vom Dienst
erfragen, also steht sie zweimal da.

Wunsch an domain-dev: eine ausgeführte Funktion, etwa

```ts
export const poolRuleIsEmpty = (rule: {
  ruleTagIds: readonly TagId[];
  excludedTagIds?: readonly TagId[];
  ruleStatusIds?: readonly StatusId[];
  completion?: PoolCompletionFilter;
  exportState?: PoolExportFilter;
}): boolean
```

die `matchesPool` selbst benutzt. `apps/web` hängt bereits an `@takt/domain` (wegen `tagNameKey`);
ich ersetze meine Zählung dann Zeile für Zeile. Bis dahin steht die Herleitung im Kopf der Datei,
mit dem Verweis auf die Stelle, die sie nachbildet.

**2. Ein leerer Ordner sieht aus wie eine Regel ohne Treffer, nicht wie ein leerer Ordner.**
Ein Ordnerterm zählt in der Oberfläche als Bedingung. Löst der Dienst ihn zur leeren Tagmenge auf —
weil in dem Ordner kein Tag liegt —, trifft die Regel nichts, und die Spalte sagt „Keine Karte
trifft diese Regel". Richtig wäre „dieser Ordner enthält kein Tag". Dafür müsste die Auflösung über
die Leitung kommen (etwa eine Zahl `resolvedTagCount` am `Pool` in `GET /pools` und `GET /board`).
Ich habe nichts geraten; die Ungenauigkeit steht benannt im Kopf von `lib/poolRule.ts`. Sie ist
älter als T-079 — vor T-076 war sie genauso da, nur unbenannt.

**3. Die Reihenfolge der Spalten lässt sich weiterhin nicht in der Oberfläche ändern.**
`position` ist am Dienst schreibbar und im Formular nicht sichtbar; der Dialog „Spalten des Boards"
sagt das ausdrücklich. Mit fünf Achsen wird eine Spalte teurer einzurichten und ihre Stelle damit
wichtiger. Kein Fehler dieser Aufgabe, aber der nächste sinnvolle Schritt an dieser Fläche — ich
habe ihn nicht ungefragt mitgemacht, weil er ein eigenes Bedienelement und eine eigene
Fehlerbehandlung braucht (`409 conflict`, „Diese Reihenfolge der Regeln ist nicht eindeutig" —
beim Aufsetzen selbst darüber gestolpert).

**4. `tests/e2e/kanban.spec.ts` ist seit E-054 veraltet, nicht seit T-079.**
Die Datei erwartet einen Dialog „Statusspalten" mit einem Feld „Neue Spalte" und Knöpfen
„Spalte anlegen"/„nach rechts". Den gibt es seit T-072 nicht mehr; er heißt „Spalten des Boards"
und legt Regeln an. Meine Änderungen berühren die Datei nicht zusätzlich — ich melde es nur, weil
mir beim Nachsehen auffiel, dass dort **noch keiner** der neuen Zustände geprüft wird. Vorschlag für
e2e-tester: eine Spalte nur über den Status, eine mit ausgeschlossenem Tag, und eine ohne Bedingung
mit der Behauptung, dass ihr Leerzustand „Diese Spalte hat noch keine Bedingung" heißt und nicht
„Keine Karte trifft diese Regel".

## 13. Prüfstand

```
pnpm typecheck        grün, alle acht Projekte
pnpm contrast         416 Paare, 0 durchgefallen  (unverändert — nur gemessene Paare verwendet)
pnpm build            grün, apps/web 126,23 kB CSS / 658,62 kB JS
pnpm boundaries       ohne Befund, 297 Dateien außerhalb der Domäne geprüft
pnpm proof:callers    18 bestanden, 0 fehlgeschlagen
pnpm proof:openapi    64 bestanden, 0 fehlgeschlagen
```

`pnpm check` habe ich nicht als Ganzes gefahren: Er hängt laut Aufgabenstellung an der
Zweigabdeckung in `packages/storage`, und die gehört dem unit-tester. Meine sechs Läufe oben decken
alles ab, was `apps/web` betrifft.

**Keine neuen Kontrastpaare.** Das ist Absicht und keine Lücke: Jede Farbe, die in `RadioRow`,
`RuleSummary` und `.form-section` steht, ist eine, die dieses Projekt an derselben Fläche schon
misst — `--text-muted`/`--text-secondary`/`--text-primary` auf `--bg-surface`, `--bg-subtle` und
`--bg-inset`, `--border-control`/`--border-strong`/`--border-accent` als Bedienelementgrenzen,
`--accent-bg-subtle` als gewählte Fläche. Ich habe bewusst keine eigene Farbe für „ausgeschlossen"
eingeführt: Rot hieße Fehler, und ein Ausschluss ist keiner. Die Unterscheidung trägt über Symbol,
Wort und Randschiene.
