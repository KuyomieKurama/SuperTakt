Aufgabe: T-028 — Die doppelte Plausibilisierung auflösen und den Motor auf `.ts`-Endungen stellen

Status: fertig

---

Artefakte:

Entfernt:

```
apps/outlook-addin/src/callnumber/plausibility.ts    die Bedienungs-Fassung
apps/local-api/src/routes/addin/call-number.ts       die Vertrauensgrenzen-Fassung
```

Neu:

```
apps/outlook-addin/src/callnumber/labels.ts   nur noch die deutschen Ablehnungstexte
```

Geändert unter `apps/outlook-addin/`:

```
package.json                     @takt/domain als Arbeitsbereichsverweis
src/callnumber/detect.ts         checkCallNumber aus @takt/domain
src/callnumber/pattern.ts        Verweis auf die Domäne statt auf plausibility.ts
src/duplicate/rule.ts            checkCallNumber aus @takt/domain, Riegel 2 neu begründet
src/ui/SettingsView.tsx          Regel aus der Domäne, Text aus labels.ts
src/ui/TaskPane.tsx              Text aus labels.ts
scripts/proof-addin.mjs          Abschnitt 2 neu: eine Fassung statt zweier
scripts/ts-extension-resolve.mjs Kommentar: packages/export braucht ihn nicht mehr
README.md                        der Abschnitt über die Zweitschrift ist ersetzt
```

Geändert unter `apps/local-api/src/routes/addin/`:

```
service.ts   checkCallNumber aus @takt/domain; isPlausibleCallNumber entfernt
index.ts     normalizeCallNumber aus @takt/domain statt der lokalen Kopie
```

Geändert unter `packages/export/src/` — fünf Dateien, reine Endungsänderung
(`index.ts`, `plan.ts`, `render.ts`, `sources.ts`, `template.ts`); dazu ein
Absatz im Kopf von `index.ts`, der die Schreibweise begründet. `base64.ts`,
`merge-notes.ts` und `model.ts` hatten keinen relativen Import und blieben
unberührt.

Nicht angefasst: `packages/domain/**`, `packages/storage/**`, `packages/*/test/**`,
`apps/web/**`, `apps/desktop/**`, `apps/local-api/**` außer den Add-in-Routen, die
Wurzeldateien, `docs/**`. **`pnpm-lock.yaml` ist byteweise unverändert** — der
Eintrag `@takt/domain` stand für `apps/outlook-addin` bereits in der Datei;
`pnpm install --offline --ignore-scripts` hat nur den Symlink gelegt und
„Already up to date" gemeldet. Kein `git commit`.

---

Zusammenfassung:

Die Regel, ob eine erkannte Call-Nummer plausibel ist, steht jetzt genau einmal im
Projekt: in `packages/domain/src/call-number.ts`. Add-in und Dienst rufen sie auf,
statt sie zu führen — zwei Importe, wie von T-021 angekündigt. Der Wächter, der die
beiden Fassungen über 5000 erzeugte Werte gegeneinander fuhr, ist entfallen; er
hatte nichts mehr zu vergleichen. `packages/export` schreibt seine internen Importe
auf `.ts`, womit der Vorlagen-Motor selbst keinen Auflösungshaken mehr braucht.

Die **zwei Rollen** bleiben und das ist der Punkt: Der Dienst prüft weiterhin
selbst und verlässt sich nicht darauf, dass der Aufrufer das Add-in ist (B-2.9,
RR-1). Nur ist der zweite Aufruf jetzt derselbe Quelltext. Zwei Aufrufe derselben
Regel sind eine Vertrauensgrenze; zwei Fassungen derselben Regel waren ein Risiko.

`proof:addin` steht wieder bei **73 bestanden, 0 fehlgeschlagen**, und zwar bei
derselben Zahl aus demselben Grund und nicht durch Streichen: Aus den drei
Prüfungen des Abschnitts 2 sind drei geworden.

| vorher | nachher |
|---|---|
| Die Fälletabelle trifft im Add-in zu | Die Fälletabelle trifft auf die Fassung der Domäne zu |
| Dieselbe Fälletabelle trifft im Dienst zu | Über 5000 erzeugte Werte: das Urteil ist stabil und die Torfunktion stimmt überein |
| Add-in und Dienst laufen über 5000 erzeugte Werte nicht auseinander | E-045: es gibt keine zweite Fassung der Regel mehr |

Die 5000 Werte sind **dieselben**: gleicher Startwert (20260901), gleiches Alphabet,
gleicher Generator. Sie prüfen nur eine andere Frage, weil es die alte nicht mehr
gibt. Statt zweier Fassungen gegeneinander prüfen sie jetzt gegen die eine Fassung:
dass das Urteil beim zweiten Aufruf dasselbe ist (der `g`-Flag-Fehler aus B-4.4,
der genau bei einem Zusammenlegen einreisen könnte), dass `mayLookUpDuplicates`
nichts anderes sagt als `checkCallNumber(...).ok`, dass ein angenommener Wert
beschnitten ist und beschnitten bleibt, und dass es zu jedem Ablehnungsgrund einen
deutschen Anzeigetext gibt.

---

Die beiden Fehler, auf die zu achten war

Beide sind grün und ich habe sie einzeln nachgesehen, nicht nur die Endsumme:

* **Das Vorratsmuster, das `000042` statt `TCK-000042` geschrieben hätte.** Abschnitt 4,
  „Der Auslieferungswert fasst die vollständige Kennung in Gruppe 1" und „runPattern
  liefert Gruppe 1, nicht den Gesamttreffer". Unberührt — der Umzug betrifft die
  Plausibilisierung, nicht den Zuschnitt der Erfassungsgruppe.
* **Die Zeitgrenze, die den Workerstart mitmaß.** Abschnitt 4, „Die Zeitgrenze läuft erst
  ab der Bereitschaft des Workers", zusammen mit „Ein bösartiges Muster wird nach der
  Zeitgrenze beendet" und „Ein gutartiges Muster über 20 000 Zeichen bleibt weit unter
  der Grenze". Ebenfalls unberührt.

Der Grund, warum keiner von beiden aufreißen konnte: `detect.ts` ruft die Regel nach
dem Auswerter auf, nicht in ihm, und die Fassung der Domäne ist zeichengleich zu den
beiden entfernten. Die Fälletabelle steht trotzdem unverändert im Nachweispfad.

---

Der neue Wächter ist mutationsgeprüft

Der Wächter aus E-045 ist entfallen. An seine Stelle tritt die Frage, die er
eigentlich stellte: Ist die Regel wieder abgeschrieben worden? Der Scan sucht in
den 27 Add-in-Quelldateien **und** in `apps/local-api/src/routes/addin/*.ts` nach
zwei Kennzeichen (`A-Za-z0-9._` und `FORMULA_STARTERS`), nicht nach einem
Dateinamen — wer die Regel nachbaut, schreibt eines von beidem hin.

Nachgewiesen, dass er beißt, statt nur dazustehen: Ich habe je einmal eine
Zweitfassung eingesetzt und den Nachweispfad laufen lassen.

| Mutation | Ergebnis |
|---|---|
| `FORMULA_STARTERS` in `apps/outlook-addin/src/callnumber/labels.ts` | **72 bestanden, 1 fehlgeschlagen** |
| Zeichenvorrat in `apps/local-api/src/routes/addin/schema.ts` | **72 bestanden, 1 fehlgeschlagen** |

Beide Dateien sind danach byteweise wiederhergestellt (`diff` gegen die Sicherung,
kein Rest von „Mutationsprobe" im Baum).

Der erste Anlauf des Wächters hat die zweite Mutation **nicht** gefunden: Ich hatte
den Zeichenvorrat vollständig gesucht (`A-Za-z0-9._/-`), und die Mutation schrieb
den Schrägstrich maskiert (`\/`). Gesucht wird deshalb nur noch der Anfang bis
`A-Za-z0-9._`. Ohne die Mutationsprobe wäre der Wächter grün gewesen und blind.

---

Was die Endungsumstellung gemessen bringt

`packages/export` lädt mit blankem `node`, ohne Vorbereitung:

```
node -e "await import('.../packages/export/src/base64.ts')"       geladen
node -e "await import('.../packages/export/src/merge-notes.ts')"  geladen
node -e "await import('.../packages/export/src/model.ts')"        geladen
node -e "await import('.../packages/export/src/sources.ts')"      ERR_MODULE_NOT_FOUND
                            .../packages/domain/src/kernel.js
```

Die drei Module ohne Laufzeitimport der Domäne laufen durch. Die übrigen scheitern
weiterhin — aber an `packages/domain/src/export.ts`, das seinerseits `./kernel.js`
schreibt, und **nicht mehr an einer eigenen Endung**. Der Motor ist damit fertig
umgestellt; der Haken bleibt allein wegen der Domäne stehen. Siehe offene Frage 1.

---

Annahmen:

1. **`REJECTION_LABEL` bleibt im Add-in, in einer eigenen Datei.** Die deutschen
   Ablehnungstexte gehören nicht in die Domäne — sie sind Oberfläche. Sie standen
   aber bisher in derselben Datei wie die Regel, und weil die Regel dort lag, musste
   sie dort gepflegt werden; genau daraus entstand die Zweitschrift. `labels.ts`
   trennt beides: Ein Anzeigetext darf sich ändern, ohne dass jemand über eine
   Abrechnung nachdenkt, die Regel darf das nicht. Der Datensatz ist über
   `Record<CallNumberRejection, string>` vollständig — kommt in der Domäne ein Grund
   hinzu, schlägt hier die Übersetzung fehl und nicht erst die Oberfläche mit
   `undefined`.

2. **Das Add-in bindet `@takt/domain` über den Wurzeleinstieg ein.** E-045 nennt ihn
   wörtlich, und einen engeren gibt es nicht (`.` und `./export`; `./export` führt
   `checkCallNumber` nicht). Gemessen, dass das Browserbündel dadurch nicht die ganze
   Domäne mitnimmt: `Zyklus`, `Zeitraum`, `quarter`, `Rundung` kommen im gebauten
   Bündel **nullmal** vor, der Zeichenvorrat einmal und `formula_start` zweimal.
   Vite schüttelt den Rest ab (`sideEffects: false`).

3. **`isPlausibleCallNumber` in `service.ts` ist entfallen statt umgebogen.** Es war
   ein dritter Name für `checkCallNumber(x).ok` — also für `mayLookUpDuplicates` —
   und hatte im ganzen Baum keinen Aufrufer. Ein Alias, der eine Regel unter zwei
   Namen führt, ist die Vorstufe zu zwei Fassungen.

4. **`normalizeCallNumber` in `routes/addin/index.ts` kommt jetzt ebenfalls aus der
   Domäne.** Es war eine vierte Kopie einer Domänenregel, samt wörtlich derselben
   Begründung im Kommentar. Die Datei gehört zu meiner Hoheit, die Signatur der
   Domäne (`string | null | undefined`) ist eine Obermenge der lokalen. Die Prüfung
   „Eine leere Call-Nummer wird zu null und nicht zu ''" (Abschnitt 9) ist unverändert
   grün.

5. **Die Fälletabelle in Abschnitt 2 ist unverändert geblieben.** Ich habe sie nicht
   an die Domäne angepasst, sondern die Domäne gegen sie gefahren. Eine Tabelle, die
   man beim Umzug „mitnimmt", prüft am Ende nur noch sich selbst.

---

Risiken:

1. **Das Add-in hängt jetzt an `@takt/domain`.** Das ist von E-045 gedeckt und
   nachweislich harmlos für die Bündelgröße (Annahme 2), aber es ist eine neue Kante
   im Abhängigkeitsgraphen: Wer künftig in der Domäne etwas ergänzt, das eine
   Node-Umgebung braucht, bricht das Add-in-Bündel. Die Domäne hat `types: []` und
   keine Laufzeitabhängigkeit — solange das so bleibt, trägt die Kante.

2. **Der Auflösungshaken in `apps/local-api/src/index.ts` bleibt stehen**, und sein
   Kommentar ist inzwischen falsch: Er behauptet „`packages/domain` und
   `packages/storage` sind bereits umgestellt". `packages/domain/src` schreibt
   weiterhin `.js` (`export * from './kernel.js'` und zwölf weitere Stellen); der
   Ladeversuch oben zeigt es. Die Datei gehört nicht zu meiner Hoheit. Offene Frage 1.

3. **Die Rolle „Vertrauensgrenze" ist jetzt eine Vereinbarung und keine zweite
   Zeile Quelltext mehr.** Das ist richtig so — aber wer künftig im Dienst den Aufruf
   von `checkCallNumber` entfernt, weil „das Add-in prüft ja schon", öffnet R-15 und
   bricht dabei keinen Wächter. Die Prüfungen „R-15 im Dienst: eine leere Nummer wird
   gar nicht gesucht" und „…auch eine unplausible Nummer wird nicht gesucht"
   (Abschnitt 9) fahren gegen den echten Router und würden es merken.

4. **Der neue Wächter kennt nur zwei Kennzeichen.** Wer die Regel mit anderem
   Zeichenvorrat nachbaut, kommt durch. Gegen eine absichtlich getarnte Zweitfassung
   schützt er nicht; gegen die wahrscheinliche — Datei kopieren, Namen behalten —
   schon, und das ist der Fall, der in T-019 tatsächlich eingetreten ist.

---

Offene Fragen:

1. **An den domain-dev, über den Orchestrator: `.js` auf `.ts` in
   `packages/domain/src`.** Danach entfällt der Auflösungshaken in
   `apps/local-api/src/index.ts` (T-021 Annahme 6) **und** der in
   `apps/outlook-addin/scripts/ts-extension-resolve.mjs`. Mein Teil ist erledigt und
   gemessen: Der Motor braucht ihn nicht mehr, die Domäne schon. Der Kommentar in
   `apps/local-api/src/index.ts` sagt derzeit das Gegenteil und sollte in demselben
   Zug richtiggestellt werden. Betroffen sind 21 Importzeilen in sieben Dateien,
   reine Endungsänderung; `pnpm boundaries` prüft dort keine Endungen — die
   Positivliste in `check-export-boundary.mjs` (`allowedExportSurfaceImports`) führt
   allerdings `'./kernel.js'` und `'./rounding.js'` **wörtlich** und muss
   mitgezogen werden, sonst schlägt der Wächter der Notiz-Trennung fehl.

2. **An den Orchestrator, zur Kenntnis: E-045 ist damit vollständig umgesetzt.**
   Eine Fassung in `packages/domain`, zwei Aufrufer, kein Wächter mehr, kein
   Übergangspfad mit zwei zulässigen Fassungen.

---

Nächster Schritt:

1. **Die Endungen der Domäne** (offene Frage 1). Danach fällt in zwei Paketen je ein
   Haken weg, und der Dienst startet aus dem Quelltext ohne Vorbereitung.
2. **Der security-checker kann die Add-in-Fläche prüfen.** Sie hat sich mit T-028
   verkleinert: eine Datei weniger im Dienst, eine weniger im Add-in, und die Regel,
   an der R-15 hängt, steht an einer Stelle mit 100 Prozent Testabdeckung aus T-009
   statt an dreien ohne.
3. **T-B05 bleibt offen** und ist nicht durch mich schließbar: Outlook, WebView2,
   Manifestannahme, `Office.onReady`. Alles andere am Add-in läuft ohne Windows.
