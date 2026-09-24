Aufgabe: T-064 — Das Angebot eingelöst: die zweite Fassung von `resolveTagNames` ist weg

Status: fertig

---

Artefakte:

Neu: keine.

Geändert unter `apps/local-api/src/routes/addin/`:

```
service.ts   `AbortAddinTodoCreate` samt Kopf (Zeilen 268–291, 24 Zeilen) und
             `resolveTagNames` samt Kopf (396–489, 94 Zeilen) gelöscht, dazu die zwei
             Leerzeilen, die sonst doppelt gestanden hätten — 120 Zeilen. Dafür **eine**
             Importzeile auf
             `../../usecases/tag-names.ts`. `TagNameCandidate` aus dem Typimport
             entfernt (unbenutzt, `noUnusedLocals`). Zwei Fundstellen von
             `AbortAddinTodoCreate` heißen jetzt `AbortTodoCreate`: der `instanceof`-Zweig
             im `catch` und eine Erwähnung im Kommentarkopf von `createTodo`.
             Der Kommentarkopf von `createTodo` sagt jetzt, was gilt, statt was galt
             (+4 Zeilen). Netto: 624 → 509 Zeilen.
```

Geändert unter `apps/outlook-addin/`:

```
scripts/proof-addin.mjs   Nur der Dateikopf: Die Begründung für den C-03-Vergleich stand
                          auf „weil die Auflösung der Tagnamen heute zweimal im Baum
                          steht". Das ist seit heute falsch. Sie steht jetzt auf dem,
                          was der Vergleich ab jetzt misst — nicht mehr zwei Fassungen
                          gegeneinander, sondern die zwei **Aufrufer**. Keine Prüfung
                          angefasst, keine hinzugefügt, keine entfernt.
```

Nicht angefasst: `ports.ts` (`AddinUnit` ist Zeichen für Zeichen unverändert), die
Add-in-Abschnitte von `takt-local-api.yaml` (die Änderung ist innen und ändert weder Route
noch Schema noch Ausgang), `packages/export/**`, `apps/outlook-addin/src/**`.

**Keine Abweichungen.** Alles Geänderte liegt in meiner Dateihoheit.

---

Zusammenfassung:

120 Zeilen gelöscht statt der angebotenen 60. Nachgezählt: die Funktion 48 Zeilen, ihr
Kommentarkopf 46, die Abbruchklasse 13 Zeilen mit 11 Zeilen Kopf, dazu zwei Leerzeilen. Die
Köpfe waren zusammen 57 Zeilen — knapp die Hälfte — und der teurere Teil: Ein Abschnitt von 17
Zeilen erklärte, **warum** die Regel zweimal im Baum steht und wie ihre Gleichheit gefahren
wird. Diese Erklärung ist jetzt nicht mehr nötig, sondern gegenstandslos — und das ist der
eigentliche Gewinn. Gelöschte Zeilen kosten nichts; ein Absatz, der eine Doppelung begründet,
muss bei jeder Änderung mitgedacht werden.

`AddinUnit` musste dafür nicht angefasst werden. Der Zuschnitt `TagNameUnit` — `Pick<TagPort,
'findByKey' | 'create'>` statt `Pick<UnitOfWork, 'tags'>` — nimmt die Arbeitseinheit des Add-ins
so an, wie sie ist. Mein eigener Vorschlag aus T-061 hätte das nicht getan; der domain-dev hat
das mit `tsc` gemessen statt es anzunehmen, und er hat recht.

`proof:addin` steht unverändert auf **100 bestanden, 0 fehlgeschlagen**. Die drei Prüfungen,
an denen diese Aufgabe hängt, sind namentlich grün: acht gleichzeitige Anfragen mit acht
Schreibweisen ergeben ein Tag; ohne die Reihung greift der Index; derselbe Name über beide Wege
ergibt dasselbe Tag (C-03). `pnpm check` endet mit 0.

---

## 1 — Was gelöscht wurde und was an seine Stelle trat

Eine Zeile ersetzt 120:

```ts
import { AbortTodoCreate, resolveTagNames } from '../../usecases/tag-names.ts';
```

Der Aufrufer bleibt Zeichen für Zeichen derselbe:

```ts
const resolved = await resolveTagNames(unit, names.value, now);
```

`unit` ist eine `AddinUnit`. Sie erfüllt `TagNameUnit` strukturell, weil ihr `tags`-Feld schon
seit T-061 genau `findByKey` und `create` führt und nicht mehr. Kein Cast, keine Hilfsvariable,
keine Verbreiterung der Fläche. Genau das war der Punkt, an dem mein Vorschlag falsch lag und
der gelieferte Zuschnitt richtig ist.

Der `catch`-Zweig fängt jetzt die exportierte Klasse:

```ts
if (error instanceof AbortTodoCreate) return err(error.failure);
```

Das ist mehr als eine Umbenennung. Vorher fing dieser Zweig **nur** Abbrüche aus der eigenen
Fassung; ein Abbruch aus der Fassung der Hauptanwendung wäre hier als 500 durchgeschlagen. Der
Fall war unerreichbar, solange beide Fassungen getrennt liefen — er wäre erreichbar geworden,
sobald jemand aus dieser Datei etwas aus `usecases/` aufruft. Diese Falle ist mit der zweiten
Fassung entfallen.

---

## 2 — Der Übersetzerfehler, den der Hinweis verhindert hat

`TagNameCandidate` war nur noch in der Signatur der gelöschten Funktion in Gebrauch. Nach dem
Löschen der Zeilen 396–490 war der Typimport unbenutzt, und `noUnusedLocals` steht auf `true`.
Das hätte einen roten Übersetzer gegeben. `TaktError` (im `Result`-Rückgabetyp von `createTodo`),
`Tag` (in `AddinCreateTodoResult.createdTags`), `Timestamp` und `checkTagNames` sind geblieben —
nachgezählt: `TaktError` 2 Fundstellen, `Tag` 7, `Timestamp` 4, `checkTagNames` 3.

Der Hinweis hat mir einen Durchlauf gespart. Er hätte ihn nicht sparen müssen — `pnpm check`
hätte es gesagt —, aber er hat die Löschung von einer Vermutung zu einem Handgriff gemacht.

---

## 3 — Der Kommentarkopf von `createTodo` sagt jetzt, was gilt

Vorher stand dort, die Auflösung sei „Wort für Wort dieselbe Bauart wie `createTodo` in
`usecases/todos.ts`". Das war die vorsichtigste Formulierung, die damals stimmte: eine
Behauptung über zwei Texte, die jemand einhalten musste. Sie ist jetzt eine Aussage über eine
Funktion.

Der Kopf nennt dabei ausdrücklich, **warum** die zweite Fassung entstand — „nicht aus
Nachlässigkeit, sondern weil die erste nicht exportiert war". Das steht dort nicht als
Rechtfertigung, sondern weil die nächste Person, die vor einer Dateihoheitsgrenze und einer
nicht exportierten Funktion steht, denselben Weg gehen wird, wenn niemand aufgeschrieben hat,
dass er teuer war.

Ein Aufzählungspunkt musste ebenfalls nachziehen. Er endete auf „…deshalb trägt er auch für den
Add-in-Weg, **sobald dieser Weg dieselben Bausteine benutzt**". Der Nebensatz war eine Bedingung
mit einem offenen Ende. Er ist weg; der Schutz trägt jetzt einfach.

---

## 4 — Warum der C-03-Vergleich bleibt, obwohl es nur noch eine Fassung gibt

Der naheliegende nächste Handgriff wäre, in `proof-addin.mjs` auch den Vergleich zu löschen: Er
fährt `createTodo` der Hauptanwendung gegen `POST /addin/todos` und verlangt am Ende ein Tag.
Wenn beide dieselbe Funktion aufrufen, scheint er nichts mehr zu prüfen.

Er prüft weiter, nur etwas anderes. Geteilt ist das Stück **in der Mitte**. Die beiden Aufrufer
sind es nicht:

- Der Add-in-Weg nimmt `tagIds` **und** `tagNames`, prüft die Namen mit `checkTagNames` vor der
  Transaktion, ergänzt Standard-Tags mit `applyDefaultTags` und setzt die Reihenfolge
  „ausdrücklich gewählte, dann benannte".
- Der Weg der Hauptanwendung kommt aus der Oberfläche und tut das an seiner eigenen Stelle.

Ein Aufrufer, der die Namen **vor** dem Aufruf anders behandelt — ungeprüft, in anderer
Reihenfolge, oder außerhalb der Transaktion —, bekommt wieder zwei Tags, obwohl die Auflösung
selbst nur einmal existiert. Genau das war C-03: nicht zwei Regeln, sondern zwei Wege zu einer.
Der Dateikopf des Nachweises sagt das jetzt, statt sich auf die Doppelung zu berufen, die es
nicht mehr gibt.

---

Annahmen:

1. **Die Umbenennung `AbortAddinTodoCreate` → `AbortTodoCreate` ist keine Verhaltensänderung,
   sondern die Beseitigung einer.** Der `catch`-Zweig fängt jetzt eine Klasse mehr, nämlich die
   der Hauptanwendung. Da diese Datei bis heute nichts aus `usecases/` aufrief, war der
   Unterschied nicht messbar; ab jetzt ist er richtig statt zufällig richtig.
2. **Die Add-in-Abschnitte der Schnittstellenbeschreibung bleiben unberührt.** Die Änderung ist
   innen: gleiche Route, gleiches Schema, gleiche Ausgänge, gleicher Fehlerschlüssel
   (`tag_name_ambiguous`), gleicher Satz, gleiches `field: tagNames`. `proof:openapi` bestätigt
   das mit 46/0. E-053 gibt mir die Abschnitte, sie verpflichtet mich nicht, sie anzufassen.
3. **`proof:addin` bleibt bei 100 und bekommt keine 101.** Siehe „Offene Fragen" — ich habe
   einen Wächter im Sinn, aber die Definition of Done dieser Aufgabe nennt 100/0, und eine
   selbst hinzugefügte Prüfung wäre die schlechteste Art, eine Zahl zu verändern, auf die
   jemand anders sich beruft.
4. **Keine Testdaten angefasst.** Diese Aufgabe hat nichts hinzugefügt, was Daten enthalten
   könnte. Es sind keine echten Call-Nummern, Kundennamen oder Zugangsdaten im Spiel.

---

Risiken:

1. **Der Vorteil ist ausgezahlt, aber nicht abgesichert.** Es gibt heute keinen Wächter, der
   verhindert, dass die Auflösung der Tagnamen ein drittes Mal in `routes/addin/` auftaucht.
   Der bestehende Wächter (E-045, `proof:addin` Abschnitt 4) sucht nach Kennzeichen der
   **Call-Nummer-Regel** (`A-Za-z0-9._`, `FORMULA_STARTERS`) in denselben Dateien — die
   Tagnamen-Auflösung hat er nie gemeint. Ausmaß: gering, solange `resolveTagNames` exportiert
   bleibt; der Anreiz zum Abschreiben ist mit dem Export entfallen. Vorschlag in „Offene
   Fragen", nicht einseitig umgesetzt — dort steht auch, welches Kennzeichen dafür taugt und
   welches nicht, gemessen statt vermutet.
2. **`usecases/tag-names.ts` gehört nicht mir.** Ich importiere jetzt aus fremder Hoheit. Ändert
   sich dort die Signatur, wird meine Datei rot, und ich kann sie nicht selbst reparieren, ohne
   eine Abweichung zu melden. Ausmaß: gering und gewollt — das ist der Preis für eine Fassung,
   und der Typecheck macht den Bruch sofort sichtbar statt still. Das ist genau die
   Eigenschaft, die der Doppelung gefehlt hat.
3. **Der Kommentarkopf nennt Aufgabennummern (T-062, T-064).** Wer die Datei in einem Jahr
   liest, hat die Berichte vielleicht nicht. Ausmaß: gering — der Kopf erklärt den Sachverhalt
   auch ohne sie; die Nummern sind Fußnote, nicht Träger.

---

Offene Fragen:

1. **An den unit-tester oder den nächsten, der `proof:addin` anfasst: soll ein Wächter gegen
   das Wiederauftauchen der Auflösung dazu?** Er wäre drei Zeilen lang, dieselbe Bauart wie der
   bestehende E-045-Wächter, nur für die andere Regel: die Dateien unter `routes/addin/` gegen
   ein Kennzeichen der Auflösung halten. Ich habe ihn **nicht** eingebaut, weil er `proof:addin`
   auf 101 hebt und die Definition of Done dieser Aufgabe auf 100/0 lautet. Sagt jemand „ja",
   ist es ein Handgriff.

   **Welches Kennzeichen — nachgemessen, nicht geraten.** Mein erster Einfall war der
   Fehlerschlüssel `tag_name_ambiguous`. Der taugt **nicht**: Die Zeichenkette steht auch in
   `routes/addin/index.ts` (Zeile 258, im Kommentarkopf, der die Ausgänge der Route aufzählt),
   in `TaskPane.tsx`, in `proof-tags.mjs` und zweimal in der Schnittstellenbeschreibung. Ein
   Wächter darauf wäre am Tag seiner Einführung rot gewesen — und zwar zu Recht rot über eine
   Beschreibung, nicht über eine zweite Fassung.

   Gemessen taugt der **Satz** der Fehlermeldung: „Dieser Tagname kommt in mehreren Ordnern
   vor." steht im ganzen Baum genau einmal, in `usecases/tag-names.ts`. Er ist das, was eine
   abgeschriebene Fassung mitschleppt; die Beschreibungen nennen den Code, nicht den Satz.

   Der ehrliche Gegeneinwand bleibt: Ein Wächter, der auf einen Wortlaut zeigt, wird still
   grün, wenn jemand den Satz umformuliert. Die robustere Fassung wäre eine Behauptung über die
   Importe — „`routes/addin/service.ts` importiert `resolveTagNames`" —, die aber nur eine
   Datei schützt und nicht den Ordner.

2. **Bleibt der C-03-Vergleich in `proof-addin.mjs` gewollt?** Ich habe ihn behalten und seine
   Begründung nachgezogen (Abschnitt 4). Er ist der einzige Ort im Baum, an dem `usecases/`
   und die Add-in-Fläche gegen **dieselbe** Datenbank laufen; das halte ich für wertvoll
   unabhängig von der Doppelung. Wenn der domain-dev diesen Vergleich lieber in seinem eigenen
   Nachweis hätte, gebe ich ihn ab — er importiert `usecases/todos.ts` über einen relativen
   Pfad, und das ist die einzige Stelle, an der mein Nachweis das tut.

---

An den domain-dev (zur Kenntnis, nichts zu tun):

Der Zuschnitt hat gehalten, ohne dass eine einzige Zeile in `ports.ts` angefasst werden musste.
Die Begründung im Kopf von `tag-names.ts` — warum `Pick<TagPort, 'findByKey' | 'create'>` und
nicht `Pick<UnitOfWork, 'tags'>` — steht dort besser, als ich sie hätte schreiben können; sie
nennt den Grund, aus dem mein Vorschlag falsch war, ohne ihn zu einem Vorwurf zu machen.
E-053 ist angekommen: Die Add-in-Abschnitte der Schnittstellenbeschreibung waren in dieser
Aufgabe nicht zu ändern, und diesmal steht in diesem Bericht kein Abschnitt „Abweichungen".

---

Nächster Schritt:

Nichts hängt an dieser Aufgabe. Risiko 1 aus T-061 ist geschlossen. Offene Frage 1 oben ist ein
Angebot, kein Bedarf.

---

Befehle, die diese Aufgabe belegen:

```
pnpm check                                       exit 0
  typecheck                                      fehlerfrei (alle Pakete)
  boundaries                                     ok — 280 Quelldateien auf Tiefenzugriffe
  contrast                                       0 von 376 Paaren durchgefallen
  proof:openapi                                  46 / 0
  proof:callers                                  18 / 0
  proof:tags                                     42 / 0
  test:coverage                                  556 / 556, 34 Dateien
  build                                          alle Pakete, Add-in 58 Module,
                                                 236,21 kB (gzip 75,12 kB)

pnpm --filter @takt/outlook-addin proof:addin    100 / 0  (unverändert)
```

Namentlich grün in `proof:addin`, Abschnitt 11:

```
ok  T-061: acht gleichzeitige Anfragen aus dem Add-in ergeben **ein** Tag
ok  T-061: ohne die Reihung greift der Index — und ohne beides wären es acht Tags
ok  C-03: derselbe Name über beide Wege ergibt dasselbe Tag
ok  T-047: scheitert die Anfrage, bleibt kein Tag zurück — an der echten Datenbank
```

`pnpm check` lief **dreimal** mit Exitcode 0 und einmal mit 1, `proof:addin` dreimal mit 0.

Der eine rote Lauf ist erklärt und lag nicht an dieser Aufgabe: `proof:tags` belegt Port 17843
und brach mit „Auf 127.0.0.1:17843 lauscht bereits etwas" ab, weil eine fremde Takt-Instanz
(`node apps/local-api/src/index.ts`, PID 3814787, seit 04:25:48, von einem anderen Agenten
gestartet) den Port hielt. Ich habe sie **nicht** abgeschossen, sondern gewartet — nach 18
Sekunden war der Port frei, und derselbe Lauf endete mit 0 und `proof:tags` 42/0. `proof:addin`
ist davon nie betroffen: Er hält keinen Port, auch nicht für den Abschnitt mit der echten
Datenbank.
