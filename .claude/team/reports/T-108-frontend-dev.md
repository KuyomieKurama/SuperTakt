Aufgabe: T-108 — Bewegungssatz bei der Buchung von Hand, Reviewer-Hinweise in der Oberfläche

Status: fertig

Artefakte:

```
apps/web/src/api/types.ts               O-V: CreateTimeEntryResult extends TimeEntry mit
                                        poolMovement: PoolMovement | null (nicht optional,
                                        kein ?? null); Begründung, warum der PATCH keines hat
apps/web/src/api/endpoints.ts           createTimeEntry liefert den neuen Typ; updateTimeEntry
                                        trägt die Begründung, dass die nackte TimeEntry hier
                                        die vollständige Antwort ist
apps/web/src/screens/BookingDialogs.tsx O-V: Toast „Zeit gebucht auf „X“." mit
                                        withMovement(„Gebucht: …", bookingSentence(...));
                                        „Buchung geändert." unverändert ohne Bewegung
apps/web/src/app/ToastContext.tsx       W-10: MAX_TOASTS = 4 und evict(), das Meldungen mit
                                        Aktion überspringt; Regel 3 im Dateikopf
apps/web/src/components/Timer.tsx       W-9: ReactivationNotice samt Props entfernt, Notiz an
                                        seiner Stelle; Importe von @takt/domain und Icon weg
apps/web/src/styles/components.css      W-9: .reactivation* entfernt (54 Zeilen), Notiz
apps/web/scripts/contrast-check.mjs     W-9: --text-muted auf --timer-running-bg von der
                                        entfallenen Fußnote auf die Flächen umgeschrieben, die
                                        es tragen, und in die Gruppe „Timer" gezogen
                                        W-13: „Regel ueber Tags" im Gruppenkommentar
apps/web/src/showcase/TimeSection.tsx   W-9: Abschnitt 6 zeigt Meldung (echter ToastProvider)
                                        und Etikett; die vier Sätze aus poolMovementSentence
apps/web/src/showcase/BoardSection.tsx  W-9: Hinweisfläche weg, Meldung mit Rückweg an der
                                        Karte; toggleTimer rechnet außerhalb des
                                        Aktualisierers (StrictMode), movementOf als Funktion
apps/web/src/showcase/Showcase.tsx      ToastProvider um die Musterseite
apps/web/src/showcase/InventorySection.tsx  „Wiederaufnahme-Hinweis" -> „Meldung mit Rückweg"
                                        (ToastContext.tsx); „Meldung" -> „Meldung in der
                                        Ansicht", damit die beiden unterscheidbar sind
apps/web/src/lib/labels.ts              W-14: poolPlacementMessage (Titel und Zeile aus einem
                                        Aufruf), POOL_PLACEMENT_TITLE, RESTORED_TITLE;
                                        W-9: reactivationTitle
apps/web/src/screens/BoardScreen.tsx    W-14: setPlacement ohne `spoken`, dritter Parameter
                                        heißt jetzt `restoring`; vier Aufrufstellen
apps/web/src/screens/TagsScreen.tsx     W-14: dieselbe Fassung wie das Board;
                                        W-13: „eine Regel über Tags und Ordner" im Kopf
apps/web/src/app/TimerContext.tsx       Titel der Wiederaufnahme aus lib/labels.ts
apps/web/src/components/Kanban.tsx      W-13: „eine Spalte ist eine Regel ueber Tags, die
                                        darueber nichts sagt" richtiggestellt (fünf Achsen)
apps/web/design/DESIGNSYSTEM.md         Abschnitt 3.4 (zwei Flächen statt Hinweisfläche, „Die
                                        Spalte ändert sich nicht" gestrichen), Abschnitt 8
                                        (W-13 „keine Poolregel"), Inventar (drei Zeilen)
```

Nicht angefasst: `apps/web/test/**`, `packages/**`, `apps/local-api/**`, `tests/**`, `docs/**`,
`openapi/**`, `package.json`, `tsconfig*.json`. `apps/desktop/**` war nicht betroffen. Die
Messproben liegen im Kratzverzeichnis, nicht im Bestand; die beiden Prüfskripte, die dafür
kurzzeitig im Wurzelverzeichnis lagen, sind gelöscht (`git status` sauber bis auf fremde
Dateien).

Zusammenfassung:

Alle fünf Punkte sind umgesetzt und gemessen. Für O-V steht der Vertrag als eigener Typ neben
`TodoDoneResult` — flach, `poolMovement: PoolMovement | null` als Pflichtfeld —, und der Toast
nach der Buchung von Hand hat jetzt denselben Rahmen wie der nach dem Stopp: Das Todo steht im
Titel, der Rumpf beginnt mit „Gebucht: …" und endet mit dem Satz aus `@takt/domain`. W-9 ist
ersatzlos vollzogen: `ReactivationNotice`, seine CSS-Hülle und beide Musterstellen sind weg, und
die Musterseite zeigt statt einer erfundenen Fläche den echten `ToastProvider` samt Etikett
„Erledigt aufgehoben". W-10 überspringt beim Verdrängen jede Meldung mit Rückweg; fünf
Erwartungen dazu sind im Browser gegen den echten Baustein gemessen, nicht behauptet. W-13 und
W-14 sind Sprachkorrekturen: „Regel über Tags" ist an drei Stellen richtiggestellt, und Titel und
Zeile der Anzeigeort-Meldung kommen aus **einer** Funktion, damit das Paar nicht wieder
auseinanderläuft.

## 1. O-V — die Buchung von Hand (Nachtrag zu E-061)

Der Typ ist die Zusage, nicht die Vermutung:

```ts
export interface CreateTimeEntryResult extends TimeEntry {
  readonly poolMovement: PoolMovement | null;
}
```

Kein `?`, kein `?? null` an der Aufrufstelle. Beides hätte den Tag verschwiegen, an dem der
Dienst das Feld nicht mehr liefert. Der `PATCH` bleibt bei der nackten `TimeEntry`, und das steht
an beiden Stellen als Begründung da, damit es niemand für eine Lücke hält.

**Gemessen über eine Attrappe** (der Dienst hat das Feld während dieser Welle noch nicht; die
Probe ruft dieselben zwei Funktionen in derselben Reihenfolge wie `BookingFormDialog.submit`):

```
Titel: Zeit gebucht auf „Beispiel GmbH — Schnittstelle“.
Rumpf: Gebucht: 0:45 h. Es steht jetzt in „Abrechnung“.          (erste Buchung)
Rumpf: Gebucht: 1:00 h. Es steht jetzt in „Abrechnung“ und ist aus „Ohne Buchung“ verschwunden.
Rumpf: Gebucht: 0:15 h.                                           (gerechnet, nichts bewegt)
Rumpf: Gebucht: 45 s.                                             (poolMovement: null)
```

Die letzten beiden Zeilen sind der Punkt, an dem die Oberfläche nichts erfindet: Beide Wege zu
„kein Satz" — der Dienst hat nicht gerechnet, oder er hat gerechnet und nichts gefunden — führen
zu einer Meldung ohne Bewegungszeile, nicht zu einer Zeile mit null Zeichen.

## 2. W-10 — fünf Erwartungen, im Browser gemessen

`evict()` wirft beim Verdrängen die älteste Meldung **ohne** Aktion hinaus und lässt jede mit
Aktion stehen. Bleiben nur noch solche übrig, wächst der Stapel über die Obergrenze hinaus; das
ist die gewollte Seite des Tauschs und steht als Absatz im Kommentar.

Gemessen an einer Attrappe, die den echten `ToastProvider` einbindet (Chromium, gebündelt mit
esbuild):

```
1) nur ohne Aktion, 6 gezeigt      -> 4 Meldungen        (Obergrenze hält)
2) eine mit Aktion, dann 6 ohne    -> 4 Meldungen, die mit Aktion ist darunter
3) fünf mit Aktion                 -> 5 Meldungen, 5 Rückwege (keine verdrängt)
4) nach „Schließen"                -> 4 Meldungen
5) ohne Aktion nach 8,5 s          -> 0; mit Aktion nach 8,5 s -> 1
```

Zeile 5 ist die zusätzliche Erwartung aus dem Auftrag: Die eigene Frist und „Schließen" bleiben
der Meldung mit Aktion erhalten — genommen ist ihr allein das Verdrängen durch eine fremde
Meldung. Eine Frist hat sie heute nicht (Regel 1 im Kopf der Datei, seit T-020); verlängert wurde
durch diese Änderung nichts, die Frist steht in `ToastItem` und wurde nicht angefasst.

## 3. W-9 — was die Musterseite jetzt zeigt

Gemessen an der gebauten Musterseite (`build:designsystem`, Chromium, keine Konsolenfehler):

```
Abschnitt 6, Knopf „Timer auf erledigtem Todo starten“
  Toast-Titel : Timer gestartet. „Betriebshandbuch Kapitel 3“ ist wieder offen.
  Toast-Rumpf : Es ist zurück in „Intern“ und aus „Erledigt diese Woche“ verschwunden.
  Toast-Aktion: Rückgängig
  Etikett     : Erledigt aufgehoben     (nach „Rückgängig“: Erledigt)

Abschnitt 5, Timerstart auf einer erledigten Karte
  Toast-Titel : Timer gestartet. „Beispiel GmbH — Schnittstelle neu aufsetzen“ ist wieder offen.
  Toast-Rumpf : Es ist zurück in „Wartet auf Rückmeldung“.
  Karte       : Erledigt aufgehoben

Vier Bewegungen, vier Sätze (aus poolMovementSentence, nicht abgeschrieben)
  Es ist zurück in „Intern“ und aus „Erledigt diese Woche“ verschwunden.
  Es ist zurück in „Intern“ und „Ost“.
  Es ist aus „Erledigt diese Woche“ verschwunden und erscheint sonst nirgends.
  Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool und in keiner Spalte.

`.reactivation` auf der ganzen Seite: 0
```

Der Titel steht seit dieser Aufgabe als `reactivationTitle` in `lib/labels.ts`. Ohne diesen
Schritt hätte die Musterseite den Wortlaut abgeschrieben und damit nur sich selbst geprüft —
genau der Fehler, den ihr eigener Kommentar für den Bewegungssatz vermeidet. In `TimerContext`
sind die Zeichen unverändert; der End-zu-End-Fall dazu bleibt grün.

**Zwei Nebenbefunde, mitgenommen, weil sie durch die Änderung entstanden wären.**

1. `BoardSection.toggleTimer` rief `setAnnouncement` und die Auswahl der Karte **innerhalb** von
   `setCards`. Eine Meldung an dieser Stelle wäre im Doppellauf des `StrictMode` zweimal
   erschienen. Der Aktualisierer bildet jetzt nur noch die neue Liste.
2. Der Zustand `reactivatedCardId` war nach dem Entfernen der Hinweisfläche nur noch
   beschreibbar; die Meldung hält ihren Bezug selbst. Er ist weg, `undoReactivation` nimmt die
   Kartenkennung als Argument.

## 4. W-13 und W-14

W-13: `Kanban.tsx` begründete das Erledigt-Kennzeichen auf **jeder** Karte damit, dass eine
Spalte „eine Regel ueber Tags" sei, „die darueber nichts sagt". Seit E-055 sagt eine Regel sehr
wohl etwas über „Erledigt" — die Begründung ist jetzt die richtige und die stärkere: Nur eine der
fünf Achsen fragt danach, und ob **diese** Spalte es tut, sieht man der Karte nicht an.
`DESIGNSYSTEM.md:623` („keine Poolregel") und der Gruppenkommentar in `contrast-check.mjs` sind
nachgezogen. Dazu eine vierte Stelle derselben Sorte, die nicht in der Liste stand und mir
gehört: `TagsScreen.tsx:50` („Er speichert eine Regel über Tags und Ordner").

W-14: Titel und Zeile kommen aus `poolPlacementMessage(name, placement, restoring)`. Ein Aufruf,
ein Paar — zwei Konstanten nebeneinander wären beim nächsten Mal wieder auseinandergelaufen, so
ist W-14 entstanden. Gemessen:

```
„Vom Board nehmen“   Spalte vom Board genommen.        „Ost“ — Pool. Die Regel bleibt …
  Rückweg            Anzeigeort wiederhergestellt.     „Ost“ — Pool und Board. Die Regel bleibt …
„Als Spalte aufnehmen“  Regel als Spalte aufgenommen.  „Ost“ — Pool und Board. Die Regel bleibt …
  Rückweg            Anzeigeort wiederhergestellt.     „Ost“ — Pool. Die Regel bleibt …
```

Der dritte Parameter heißt jetzt `restoring` statt `undoable`: Er bedeutete schon vorher „dies
ist der Rückweg" und hieß nach der Nebenwirkung. `POOL_PLACEMENT_LABEL` steht weiter im
Regelformular, wo die drei Werte zur Wahl stehen; im Toast steht die Kurzform, wie auf dem Board.

Nachweise:

```
pnpm typecheck                        exit 0
pnpm --filter @takt/web build         exit 0
pnpm --filter @takt/web contrast      exit 0   (0 von 432 Paaren durchgefallen)
pnpm boundaries                       exit 0
pnpm verify:bundle                    exit 0   (20 bestanden, 0 fehlgeschlagen)
npx vitest run apps/web/test          exit 0   (3 Dateien, 45 Fälle)
pnpm test                             exit 1   — eine fremde Datei, siehe Risiken
TAKT_DESIGNSYSTEM=1 … build           exit 0   (Musterseite, im Browser gemessen)
```

`pnpm --filter @takt/web lint` gibt es nicht; `apps/web/package.json` führt kein Lint-Skript.
Kein Live-Lauf gegen den Dienst: Die Ports 17843/17844 gehören laufenden Nachweisen, und für O-V
fehlt dem Dienst das Feld ohnehin noch.

Annahmen:

1. **Der Rumpf des Toasts nach der Buchung von Hand beginnt mit „Gebucht: …".** Der Auftrag
   verlangt den Bewegungssatz und den Todo-Namen „in derselben Form wie der Stopp-Toast". Der
   alte Rumpf („Die Buchung liegt auf „X“.") ist mit dem Namen im Titel überflüssig geworden; ein
   Toast nur mit Titel wäre die Alternative gewesen. Die Dauer kommt aus `durationSeconds` der
   Antwort und geht durch `formatDuration` — dieselbe Zahl und derselbe Formatierer wie beim
   Stopp, keine Rechnung in der Oberfläche. Wer den Rumpf lieber leer hätte, streicht eine Zeile.
2. **`CreateTimeEntryResult extends TimeEntry`, flach.** Nach dem Vorbild von `TodoDoneResult`
   aus T-101/E-060 und nicht als `{ entry, poolMovement }`. Ungemessen — der Dienst liefert das
   Feld noch nicht.
3. **Der Stapel darf über vier hinauswachsen**, wenn ausschließlich Meldungen mit Rückweg
   darinstehen. Die Alternative wäre gewesen, im Notfall doch eine mit Aktion zu verdrängen —
   also genau W-10, nur seltener. Begründet im Kommentar.
4. **`board` und `both` tragen denselben Titel** („Regel als Spalte aufgenommen."). Der Titel
   spricht über das Board; **wo genau**, sagt die Zeile darunter. Ein dritter Titel für einen
   Übergang, den keine der beiden Bedienstellen anbietet, wäre ein Wortlaut ohne Bedienstelle.
5. **Die Musterseite bekommt den echten `ToastProvider`**, statt den Toast nachzubauen. Damit ist
   die abgenommene Referenz an dieser Stelle wieder das Produkt und keine Zeichnung davon.
6. **`reactivationTitle` liegt in `lib/labels.ts`.** Der Auftrag nennt die Datei für das Paar aus
   W-14; der Wiederaufnahme-Titel hat dieselbe Not (zwei Stellen, ein Wortlaut) und steht
   daneben.
7. **Das Farbpaar `--text-muted` auf `--timer-running-bg` bleibt gemessen.** Es trug die Fußnote
   der entfallenen Hinweisfläche, aber auch `.pick-row--running .pick-row__call` und
   `.timerbar__icon`; gelöscht hätte ich einen Nachweis, den andere Flächen brauchen. Umgehängt
   statt gestrichen.

Risiken:

1. **Ein bestehender Test ist rot, und er ist nicht meiner:**
   `packages/storage/test/mappers.test.ts:362` erwartet `poolReference` **ohne** Feld `name`,
   `packages/storage/src/sqlite/mappers.ts` liefert es seit dieser Welle mit (W-11, domain-dev).
   Nicht angefasst, wie beauftragt. `pnpm test`: 757 von 758 grün, diese eine Zeile rot. Die
   Oberfläche ist davon nicht betroffen — `errorText.ts` liest weiter `message`.
2. **Der Vertrag aus O-V ist gebaut, aber nicht zusammengefahren.** Liefert `POST /time-entries`
   das Feld am Ende nicht, ist `created.poolMovement` zur Laufzeit `undefined`, und
   `bookingSentence` gäbe dann `poolMovementSentence(undefined, …)` weiter — der zusammengesetzte
   Lauf gehört laut Auftrag dem Orchestrator. Ein `?? null` hätte das verdeckt und war
   ausdrücklich untersagt.
3. **Sicherheit:** keine neue Fläche, kein neuer Aufruf, keine neuen Daten. Der Bewegungssatz
   nennt Regelnamen, die der Benutzer selbst vergeben hat, und steht in einer Meldung, die die
   Anwendung ohnehin zeigt. Keine Kundendaten, keine Call-Nummern, keine erfundenen Testdaten im
   Bestand.
4. **Ein Fall bleibt ungemessen:** die Meldung nach `POST /time-entries` in der laufenden
   Anwendung. Gemessen ist die Zusammensetzung (dieselben Funktionen, dieselbe Reihenfolge), nicht
   der Weg durch Dialog, Dienst und Ansicht.
5. **Die Musterseite hat jetzt einen `ToastProvider`.** Sie ist damit zustandsbehafteter als
   vorher; eine Meldung mit Rückweg bleibt beim Blättern stehen, bis sie geschlossen wird. Das ist
   das Verhalten des Produkts und beabsichtigt.

Offene Fragen:

1. **Soll `POST /time-entries` auch die Tagesgruppe melden?** Der Stopp-Toast sagt „An diesem Tag
   sind für dieses Todo X offen — das ergibt beim Export 0,25." (`loadDayGroupInsight`). Die
   Buchung von Hand sagt das nicht; sie ist häufig eine Korrektur, und der zweite Aufruf kostet
   einen Umlauf. Wenn der gerundete Wert auch hier gezeigt werden soll, ist das eine eigene, kleine
   Aufgabe.
2. **Braucht der Toast-Stapel eine Bildschirmgrenze?** Fünf Meldungen mit Rückweg passen bequem;
   fünfzehn nicht. Möglich wäre eine Rollfläche über den Stapel. Ich habe darauf verzichtet, weil
   der Fall eine ausdrückliche Handlung je Meldung voraussetzt und eine Rollfläche, die den
   jüngsten Eintrag nicht von selbst zeigt, schlechter ist als keine.
3. **Der Wortlaut „Gebucht: …" im Toast der Buchung von Hand** (Annahme 1) hat der
   spec-ux-reviewer noch nicht gesehen.

Nächster Schritt:

1. **Orchestrator:** den zusammengesetzten Lauf für O-V — Dienst mit dem neuen Feld gegen diese
   Oberfläche. Erst danach ist der Vertrag gemessen und nicht nur getippt.
2. **unit-tester:** `poolPlacementMessage` und `reactivationTitle` in `apps/web/src/lib/labels.ts`
   sind rein und ungeprüft — sechs Fälle für das Paar (drei Anzeigeorte mal Rückweg ja/nein), einer
   für den Titel. Muster liegt in `apps/web/test/lib/errorText.test.ts` vor. Dazu die Regel aus
   `ToastContext.evict`, falls ein Rahmen für React-Bausteine eingerichtet wird; die fünf
   Erwartungen stehen oben mit gemessenem Ergebnis und sind direkt übernehmbar.
3. **e2e-tester:** ein Fall für die Buchung von Hand mit Bewegung, sobald der Dienst das Feld
   liefert — Titel `Zeit gebucht auf „<Todo>“.`, Rumpf `Gebucht: …` plus dem Satz aus
   `poolMovementSentence(movement, 'past', 'booking')`, gezogen statt getippt. Und ein Fall für
   W-10: eine Meldung mit „Rückgängig", danach vier ohne — die erste steht noch da.
4. **documenter:** die drei Stellen in `docs/`, an denen „Regel über Tags" steht (W-13), stehen
   bereits auf dem Board; `openapi/` und `packages/` gehören domain-dev.
