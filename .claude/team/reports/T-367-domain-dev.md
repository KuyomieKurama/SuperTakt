# T-367 — A-A-124: der veraltete Prüfzeitpunkt, drei Stellen in `version.ts`

Aufgabe: T-367 — A-A-124, den Vorschlag aus T-364 Abschnitt 5 im Bestand bauen
Status: fertig (braucht Review)
Stand: 2026-09-14. Zweig `feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus
Arbeitskopie. Vorlagen: `.claude/team/reports/T-364-domain-dev.md` (Abschnitt 5 und 1.2),
`T-360-domain-dev.md` Abschnitt 1, `.claude/team/risks.md` R-30.

| Datei | Art der Änderung |
|---|---|
| `apps/local-api/src/features/version/version.ts` | **die drei Stellen** (a/b/c) plus fünf Prosastellen, die davon unwahr werden (+99 Zeilen netto) |
| `packages/storage/src/sqlite/repo-version-check.ts` | Prosa: zwei gemessen falsch gewordene Sätze nachgezogen |
| `packages/storage/src/ports.ts` | Prosa: ein Halbsatz — der Vorschlag ist **gebaut**, und zwar ohne eine Zeile an diesem Port |
| `docs/architektur.md` | A-A-124: der Absatz, der „auflösen ließe er sich nur am Port" sagte |
| `docs/datenmodell.md` | `last_version_check_at`: wie wahr der Wert **jetzt** ist |

`apps/local-api/test/**`, `packages/*/test/**`, `tests/**`, `apps/web/**`, `scripts/**`,
`features/timer/**`, `features/data-transfer/**` sind **nicht** angefaßt. Kein Prüffall
geschrieben, keiner geändert. Ports 17843/17844/5173 nicht gebunden; alle Meßaufbauten liegen im
Kratzverzeichnis.

---

## 0 Läufe, mit Zahl

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` (8 Pakete + Prüf- und E2E-Programme) | **Exit 0** |
| `proof:release-safety` | **158 bestanden, 0 fehlgeschlagen** (Vorgabe gehalten) |
| `proof:codepoints` | 46/0 |
| `pnpm run boundaries` | grün, 528 Dateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `vitest run apps/local-api/test/version` | **2 Dateien, 52 Prüffälle grün** — fahren ja, ändern nein |
| `vitest run packages/storage` | 29 Dateien, **468 grün** |
| `vitest run apps/local-api` (ganz) | 358 grün, **7 rot** — alle sieben in `usecases/timer-recovery-booking.test.ts` und `usecases/data-transfer-timer-recovery.test.ts`, also im Timer- und Datensicherungsteil der **parallelen** Welle; keine der beiden Dateien führt eine Einfuhr aus `features/version` (nachgesehen). Nicht meine, nicht angefaßt. |

Nicht gefahren: `pnpm check` im ganzen, `test:coverage`, `proof:all`, `test:rust`, `build`,
`audit`, `test:e2e`. Im Arbeitsbaum liegen die Zwischenstände mehrerer Agenten; ein Gesamttor
hätte deren Stand gemessen und nicht meinen.

---

## 1 Was gebaut ist — die drei Stellen

**(a) `reportStoreFailure`** trägt die Zusage „genau eine Zeile" (A-A-123) jetzt in einem eigenen
Wert (`storeFailureLogged`) und damit für **beide** Gründe zusammen — eine Aussage über das
Modul statt über eine Funktion:

```ts
  function reportStoreFailure(reason: VersionCheckStoreFailure): void {
    if (storeFailureLogged) return;
    storeFailureLogged = true;
    const described = describeVersionCheckStoreFailure(reason);
    options.logger.lifecycle('info', described.sentence, described.key);
  }
```

Sie **mußte** umziehen: Bis T-360 hing die Zusage an einer fernen Zahl (Boden von einer Stunde
gegen eine Frist von fünf Sekunden), seit T-360 an der Ablage des Speichers. Legt der Wurf nicht
mehr ab, gäbe es für ihn keine Ablage mehr, an der eine Zusage hängen könnte. Ein Riegel an einem
Nebeneffekt ist keiner.

**(b) `forgetStore`** meldet über sie, statt selbst zu protokollieren, und ist ab jetzt die
Antwort auf **`timeout` allein**. Signatur und `if (store === null) return;` unverändert:

```ts
    if (store === null) return;
    store = null;
    reportStoreFailure(reason);
```

**(c) Der Wurf legt nicht mehr ab** — in `remember`, im angestoßenen Rumpf:

```ts
      if (threw) reportStoreFailure('threw');
```

**Die einfache Fassung, wie beauftragt.** Ich habe beim Bauen keinen Grund gefunden, das anders
zu sehen: Die Drei-Würfe-Variante bräuchte einen Zähler, der die Zahl drei an nichts hängt —
genau die Bauart „Zusage an einer fernen Zahl", die dieser Fall schon einmal gekostet hat.

Codezeilen im ganzen: **7 neu, 2 entfernt, 1 geändert, 1 Zeichenkette geändert.** Der Rest der
99 Zeilen ist Kommentar.

---

## 2 Eigene Messung — beide Richtungen, am Bestand

Nicht T-364s Zahlen übernommen. Vier Aufbauten, alle im Kratzverzeichnis, das Modul aus dem
Bestand über seinen Pfad geladen.

### 2.1 Der Fall selbst — echter Adapter, echte Datei, echte Sperre

Aufbau wie T-364 1.2: `openDatabase` auf eine Datei, alle Migrationen, echter
`createVersionCheckStatePort`, Verdrahtung `write: (at) => recordCheck(toTimestamp(at))`, ein
geglückter Wert vorab. Takt 10 ms, Uhr je Anfrage eine Stunde weiter. Ein **zweiter Schreiber**
hält kurz `BEGIN EXCLUSIVE` und gibt wieder frei — der vorübergehende Fall, nicht der kaputte
Bestand.

| | **vorher** (`forgetStore('threw')`, Meßkopie) | **nachher** (Bestand) |
|---|---|---|
| ausgehende Anfragen | 42 | 42 |
| Spalte vor der Sperre | `2026-09-15T09:00:00Z` | `2026-09-15T09:00:00Z` |
| Spalte während der Sperre | unverändert | unverändert |
| **Spalte nach der Sperre** | **`2026-09-15T09:00:00Z` — eingefroren** | **`2026-09-17T21:00:00Z`** |
| **Alter am Ende des Laufs** | **60 Stunden** | **0 Stunden** |
| Protokollzeilen | 1 | 1 |

Die Gegenprobe ist eine Kopie des heutigen Moduls mit **genau der einen** zurückgedrehten Zeile.
60 h → 0 h, bei gleicher Zahl ausgehender Anfragen und gleicher Zahl Protokollzeilen.

### 2.2 Der Prüfer allein — drei Lagen

Attrappen für Quelle und Speicher, Takt 10 ms, Fenster 400 ms, Uhr je Anfrage eine Stunde weiter.

| Lage | Anfragen | Schreibversuche | gemerkt | Protokollzeilen |
|---|---|---|---|---|
| wirft **einmal**, nimmt danach an | 40 | 40 | **39** | **1** (`…_unwritable`) |
| wirft **immer** | 40 | 40 | 0 | **1** |
| antwortet **nie** (`storeDeadlineMs` 20 ms) | 40 | **2** | 0 | **1** (`…_write_timeout`) |
| erst **Wurf**, dann **Schweigen** | 40 | 3 | 0 | **1**, und zwar der erste Grund |

Zeile 1 ist der gebaute Punkt: Ein einziger Fehlschlag kostet nicht mehr den Rest des Laufs.
Zeile 3 ist der Beweis, daß der `timeout`-Weg unberührt geblieben ist. Zeile 4 ist A-A-123 für
das **Modul**: zwei Gründe, eine Zeile.

### 2.3 Der Preis, selbst nachgemessen

Speicher, der 50 ms **synchron blockiert und danach wirft**; Takt 10 ms, Fenster 600 ms.

| | Anfragen im Fenster | Schreibversuche | Protokollzeilen |
|---|---|---|---|
| vorher (Wurf legt ab) | **55** | 1 | 1 |
| nachher (Wurf meldet) | **10** | 10 | 1 |

T-364s Zahlen bestätigt, unabhängig gemessen. Im Erzeugnis sind das höchstens **5 s je Stunde**
(`busy_timeout = 5000` in `packages/storage/src/sqlite/database.ts:85`), und nur solange die
Datei fremd gesperrt ist — eine Lage, in der jede andere Anfrage des Dienstes in dieselben 5 s
läuft. Der Preis steht im Quelltext neben `forgetStore`, nicht nur hier.

### 2.4 Stille nach A-18.12 — gehalten

In jeder gemessenen Lage: Zustand geht den gewöhnlichen Weg (`unknown` → `known`), keine Fläche,
kein Hinweis, keine Fehlerfläche, kein zweiter Versuch im selben Lauf. Einziger Ausgang bleibt
**eine** `info`-Zeile mit einem Schlüssel aus dem geschlossenen Vorrat. Der Takt ist unberührt:
in allen Gegenüberstellungen dieselbe Zahl ausgehender Anfragen wie vorher (42 bzw. 40) — außer
im künstlichen Blockadefall aus 2.3, und dort ist die Ursache die Blockade, nicht die Prüfung.

---

## 3 Die Sätze, die mitgegangen sind (E-081 Punkt 4)

Der Auftrag nannte drei. Es waren **fünf** in `version.ts` und drei außerhalb.

**In `version.ts`:**

1. **`describeVersionCheckStoreFailure`, Zweig `unwritable`.** Neu:
   `'Der Zeitpunkt der letzten Versionsprüfung ließ sich nicht merken. SuperTakt läuft unverändert weiter und versucht es beim nächsten Mal erneut.'`
   Der Schlüssel `version_check_state_unwritable` bleibt.
2. **Der Kommentarblock über `forgetStore`.** Der Satz „Auflösen ließe es sich nur am Port …"
   ist gestrichen und durch die Messung ersetzt, die ihn widerlegt (drei von vier Fehlerlagen
   werfen auch beim Löschen; 158/0 → 157/1). Dazu die neue Aufteilung der beiden Gründe und der
   Preis aus 2.3.
3. **Die Prosa am `timeout`-Zweig** bleibt stehen und ist auf den einen Weg eingegrenzt, für den
   sie geschrieben ist.
4. **Nicht im Auftrag genannt, aber gemessen falsch geworden:** die Erklärung an `let store`
   („er hat **einmal versagt** und ist danach abgelegt worden") und der Satz in der Prosa zur
   Frist in `remember` („Nach ihrem Ablauf gilt **derselbe Weg wie beim Wurf**"). Beide sind
   nachgezogen.
5. Die Typdoku zu `VersionCheckStoreFailure` sagt jetzt, daß die beiden Werte **in der Folge**
   nicht mehr gleich sind.

**Außerhalb `version.ts` — drei gemessen falsch gewordene Stellen in Dateien, die mir nach
`CLAUDE.md` gehören.** Der Auftrag sagte „faß sie nur an, wenn der Auftrag es verlangt". Ich habe
sie trotzdem angefaßt, weil sie **durch meine Änderung** unwahr werden und E-081 Punkt 4
verlangt, daß Streichung und Ausgleich in einem Auftrag laufen. Alle drei sind **reiner
Kommentar bzw. Prosa**, keine Anweisung, keine Signatur:

- `packages/storage/src/sqlite/repo-version-check.ts`: „Wirft `recordCheck` ein einziges Mal,
  legt der Prüfer den Speicher ab und merkt sich bis zum Programmende keinen Zeitpunkt mehr" und
  „Von den zwei Wegen … ist hier allein der **Wurf** erreichbar". Beides war ab meiner Änderung
  falsch; jetzt steht dort, was ein Wurf aus dieser Datei heute kostet (ein Schreibvorgang und
  ein Protokolleintrag).
- `packages/storage/src/ports.ts`: ein angehängter Halbsatz — der Vorschlag ist **gebaut**, und
  zwar ohne eine Zeile an diesem Port. Die zwei Fragen sind zwei geblieben.
- `docs/architektur.md` und `docs/datenmodell.md`: dieselbe Sache, jeweils mit meinen Zahlen.

**E-087, selbst neu gemessen** (der Auftrag verlangte es ausdrücklich, weil der Baum sich seit
T-364 geändert hat). Gesucht über den **Wortlaut**, zweifach: `git grep` **und** ein roher Lauf
über `apps/*/src`, `apps/local-api/test`, `apps/local-api/scripts`, `packages/*/src`,
`packages/*/test`, `tests/`, `docs/`, Bauergebnisse (`apps/desktop/src-tauri/taskpane/`)
ausgeschlossen. Ergebnis, in beiden Läufen gleich:

| Fundstelle | Art |
|---|---|
| `version.ts:1121` (vorher) | der Satz selbst — **genau eine** |
| `version.ts:1113` (vorher) | die Erklärung darüber, die ihn zitiert |
| `apps/local-api/test/version/checker.test.ts:595, 703, 713` | **nur der Schlüssel** `version_check_state_unwritable`, nie der Satz |

Kein Prüffall, kein Nachweislauf und keine E2E-Datei nagelt den Wortlaut fest. Der
Nachweislauf `proof:release-safety` nennt weder `lifecycle` noch einen der beiden
Protokollschlüssel (gemessen: `grep` findet sie im ganzen Programm nicht, außer in einem
Prosasatz über den `write_timeout`-Schlüssel). Die 52 Prüffälle sind ohne eine Änderung grün
geblieben.

---

## 4 Was die Nachweisläufe dazu sagen

`proof:release-safety` steht auf **158/0**, wie vorgegeben. Das ist kein Zufall und war
vorhersehbar: Die Änderung berührt **weder Port noch Adapter noch Verdrahtung noch eine
`await`-Achse**. Geprüft habe ich außerdem die drei Zusagen, an denen eine Änderung in diesem
Modul am ehesten anschlägt:

- **`MODUL_LAUFZEITNAMEN`** (A-A-105f): kein neuer Laufzeitname. `reportStoreFailure` ist ein
  örtlicher Funktionsname, keine Tür in die Laufzeit. Kein Ritual nötig.
- **6g-1, der Weg vom Zeitgeberrückruf zur Anfrage** (A-A-105e): unverändert eingliedrig
  (`<Zeitgeberrückruf> → run`), kein neues `await` auf einem Glied.
- **6g-1, die Schleifenregel** (A-A-125): `reportStoreFailure` liegt im synchron erreichbaren
  Abschluß und enthält **keine** Schleife. Das Modul hat weiterhin genau eine, und die steht in
  `stop()`, außerhalb dieser Menge.

---

## 5 Zweite Achse von R-30 — gemeldet, nicht gebaut

Wie beauftragt **nicht** in diesem Auftrag gebaut, aber selbst nachgemessen statt übernommen.

**Stelle:** `packages/storage/src/sqlite/repo-version-check.ts:130` —
`conn.prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1').run(at);`

**Zahl:** Hält ein zweiter Schreiber `BEGIN EXCLUSIVE` auf derselben Datei, steht dieser Aufruf
**5 004 ms** und wirft dann `database is locked`. Während dieser Zeit kam ein parallel laufender
`setInterval` mit 10 ms Takt **null** Mal dran — bei ~500 erwarteten Schlägen. Die
Ereignisschleife steht, nicht nur diese Zusage. Der Weg liegt **vor** der ausgehenden Anfrage.

Der Port des Prüfers sagt ausdrücklich, ein Adapter dürfe nicht synchron blockieren; der gebaute
tut es unter einer Sperre. Das ist A-A-125 an einer konkreten Stelle des Bestands und gehört in
einen eigenen Meßgegenstand — und für den security-checker ins Bedrohungsmodell, das mir nicht
gehört.

---

## 6 Annahmen

1. **`forgetStore` behält seinen Parameter**, obwohl er heute nur noch mit `'timeout'` gerufen
   wird. So steht es im Vorschlag aus T-364 Abschnitt 5 („bleibt im übrigen, wie es ist"), und
   ein Parameter, der die Meldung trägt, ist ehrlicher als eine Funktion, die den Grund selbst
   erfindet. Wer ihn streicht, streicht die Symmetrie zwischen den beiden Gründen.
2. **Bei zwei Gründen nacheinander steht der erste im Protokoll**, nicht der schwerere. Zwei
   Zeilen über denselben Speicher sagen nicht mehr als eine, und A-18.12 verlangt Stille. Steht
   im Quelltext bei `reportStoreFailure`.
3. **Die fünf Prosastellen in `version.ts` und die drei außerhalb gehören in diesen Auftrag**
   (E-081 Punkt 4). Der Auftrag nannte drei; ich habe beim Bauen fünf weitere gefunden, die durch
   dieselbe Zeile unwahr werden. Alle sind Kommentar, keine Anweisung.
4. **`null` behält genau eine Bedeutung** („noch nie gefragt"). Unverändert gegenüber T-364.

## 7 Risiken, einschließlich Sicherheitshinweisen

- **Der Preis ist real und steht daneben** (2.3): Ein Speicher, der synchron blockiert **und**
  wirft, blockiert danach je Intervall statt einmal. Im Erzeugnis höchstens 5 s je Stunde. Wer
  diese Zahl senken will, senkt `busy_timeout` oder behebt die zweite Achse — nicht diese Zeile.
- **Der dauerhaft unbeschreibbare Bestand bleibt ungelöst.** Bleibt die Datei dauerhaft gesperrt
  oder nur lesbar, steht in `last_version_check_at` weiter der alte Wert, und die Datensicherung
  trägt ihn mit. Dagegen hilft keine Bauform — auch ein `NULL` müßte geschrieben werden. Das
  steht so im Quelltext. A-A-124 ist damit **verkleinert, nicht geschlossen**; vollständig zu
  wäre sie nur, wenn die Spalte fiele (T-364 Abschnitt 3, Entscheidung des Auftraggebers).
- **Ein eingespieltes Archiv trägt weiterhin den Zeitpunkt eines fremden Rechners.** Er heilt
  jetzt zuverlässiger, weil ein einzelner Wurf den Speicher nicht mehr für die Laufzeit
  abräumt — aber erst beim nächsten Schreiben.
- **A-18.12 gehalten, in jeder gemessenen Lage** (2.4). Nichts erreicht die Oberfläche, nichts
  wird übertragen, die Adresse ist unberührt, es wird nichts heruntergeladen. Die Änderung
  berührt weder Quelle noch Netz noch Zustand.
- **Zweite Achse R-30 / A-A-125 offen** (Abschnitt 5), mit eigener Zahl belegt.
- **Sieben rote Prüffälle im Timer- und Datensicherungsteil** (Abschnitt 0) — nicht von mir, aber
  jemand muß sie sehen, bevor die Welle schließt.

## 8 Offene Fragen an den Orchestrator

1. **Der unit-tester ist jetzt dran** (T-364 Abschnitt 6, vier Vorgaben). Drei davon habe ich als
   Messung bereits gefahren und die Zahlen stehen in 2.2 — sie sind **keine** Prüffälle und
   liegen im Kratzverzeichnis. Der vierte (`recordCheck` wirft bei nur lesender Verbindung)
   gehört nach `packages/storage/test`.
2. **Darf ich `docs/bedrohungsmodell.md` Abschnitt 45 nachziehen lassen?** Die Zeile zu A-A-124
   („ein abgelegter Speicher bleibt für die Laufzeit abgelegt … 2 von 40 Schreibversuchen") ist
   ab jetzt überholt. Die Datei gehört dem security-checker; der Wortlaut, den ich vorschlage,
   steht in 2.1 und 2.3 dieses Berichts.
3. **`risks.md` R-30** braucht denselben Fortschritt: „drei Zeilen stehen als gemessener
   Vorschlag bereit; A-A-124 bleibt offen, bis sie gebaut sind" — sie sind gebaut. Die Datei
   gehört dem Orchestrator.
4. **Soll die Spalte langfristig fallen?** Unverändert offen aus T-364. Sie ist der einzige Weg,
   der A-A-124 vollständig schließt, und braucht Entscheidung, Migration und Archivfassung.

## 9 Nächster Schritt

Code-Reviewer und Security-Checker über `version.ts` — und zwar gegen die **neue** Aufteilung
der beiden Gründe ansetzen, nicht gegen die Zeile: Die interessante Frage ist, ob es eine Lage
gibt, in der ein **werfender** Speicher unbeschränkt wird und die Ablage doch gebraucht hätte.
Danach, in **getrennter** Welle, der unit-tester mit T-364 Abschnitt 6 (T-315/T-316-Lehre).
