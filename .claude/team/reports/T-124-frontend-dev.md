# T-124 — Auf die geteilte Fassung nachziehen, drei stumme Stellen sprechen lassen

Aufgabe: T-124 — Auf die geteilte Fassung nachziehen, drei stumme Stellen sprechen lassen
Status: fertig
Rolle: frontend-dev
Stand: Branch `status-als-regelterm`, Basis `c96a2b2`

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (E-036, E-042, E-054, E-058, **E-062**, **E-063**),
die Berichte T-122 (Abschnitte 2, 5, 10), T-119 (Abschnitte 2–4, offene Fragen 1–3), T-118 (offene
Fragen 2 und 3), T-110 (offene Frage 1), Board-Zeilen O-AF, O-AH, O-AJ, O-AK und F-15. Dazu die
Quellen, gegen die gearbeitet wurde: `packages/domain/src/enumeration.ts`,
`packages/domain/src/characters.ts`, `apps/outlook-addin/src/ui/Primitives.tsx` (Baustein
`Foreign`), `apps/outlook-addin/src/text/hidden.ts`, `apps/local-api/src/main.ts` und
`access/session-secret.ts` (die Gründe `user_missing`/`user_invalid`),
`apps/desktop/src-tauri/src/sidecar.rs` (`handshake_line`, `explain_exit`) und `lib.rs`.

---

## 1. O-AK / B-11 — die Aufzählung kommt aus der Domäne

Drei Abschriften, drei Importe. **Kein Wortlaut ändert sich**, und das ist geprüft und nicht
behauptet: Alle drei Fassungen waren zeichengleich mit `enumerateGerman`, die Ersetzung ist
Zeile für Zeile dieselbe Rechnung.

| Vorher | Jetzt | Aufrufer |
|---|---|---|
| `lib/format.ts:joinGerman` | **entfällt ersatzlos** | nur `lib/poolRule.ts` |
| `lib/errorText.ts:enumerateGerman` | `enumerateGerman` aus `@takt/domain`, **weitergereicht** | `errorMessageWithRules` |
| `screens/TodoFormDialog.tsx:quoteList` | `enumerateNames` aus `@takt/domain` | drei Meldungen zu neuen Tags |
| `„${name}“` von Hand in `errorText`/`poolRule` | `quoteName` (über `quotedName`, siehe Abschnitt 4) | `ruleList`, `emptyFolderNames` |

**Die Fassung aus T-110 steht unverändert.** `errorMessageWithRules` erzeugt weiterhin
„Betroffen sind die Regeln „Ost“, „Nord“ und „Abrechnung“." — gemessen mit
`apps/web/test/lib/errorText.test.ts` (dessen Fall genau diesen Satz zeichengenau prüft, 71/71
grün). `tests/e2e/tag-folder-rule-lock.spec.ts` hält denselben Wortlaut fest und bleibt gültig.

**Eine Weiterleitung ist geblieben, und sie ist benannt.** `lib/errorText.ts` führt
`export { enumerateGerman };`, weil `apps/web/test/lib/errorText.test.ts` die Form unter diesem
Namen **an dieser Datei** prüft. Der Testordner gehört dem unit-tester; ihn im selben Zug zu
brechen, um eine Ausfuhrzeile zu sparen, wäre der teurere Tausch. Die Aufrufstelle darunter ruft
ohnehin die Domänenfassung. Wer die sechs Prüfungen an `packages/domain/test/enumeration.test.ts`
nachzieht, kann die Zeile ersatzlos streichen — Vorschlag an den unit-tester, siehe „Nächster
Schritt".

`format.ts` behält an der Stelle einen Kommentar statt einer Weiterleitung: Ein zweiter Name für
dieselbe Funktion ist die nächste Gelegenheit, sie an einer Stelle zu ändern.

---

## 2. O-AJ — die Hülle sagt, warum der Start scheitert

### Was ein Benutzer heute sieht, und warum beides falsch ist

Seit T-122 gibt es **zwei** Wege, auf denen ein Windows-Benutzername den Start verhindert, und
**keiner** von beiden erklärt sich:

1. **Steuerzeichen (C0/C1).** `handshake_line` in `sidecar.rs` fängt sie vor dem Start ab
   (`c.is_control()`), der Satz landet in `startup.problems`. Der Sidecar startet gar nicht →
   `serviceExit` ist **leer**. Der Benutzer bekommt das Band „Takt ist nicht vollständig
   gestartet" über einer Anwendung, die bedienbar aussieht und deren jeder Klick ins Leere läuft.
   Darunter steht als Handlungsanweisung „Beenden Sie Takt und starten Sie es neu" — ein Rat, der
   in genau diesem Fall **nie** hilft, weil sich der Name durch einen Neustart nicht ändert.
2. **Richtungszeichen** (`U+061C`, `U+200E/F`, `U+202A`–`U+202E`, `U+2066`–`U+2069`).
   `char::is_control()` in Rust ist Unicode-Kategorie `Cc` und kennt sie **nicht**; der Name geht
   durch die Röhre, der Dienst weist ihn mit `user_invalid` ab und endet mit 78. `explain_exit(78)`
   sagt dann „weil ihm beim Start etwas fehlte, das er zum Speichern braucht" — und es fehlt
   nichts.

### Gebaut ist die Auskunft, und sie sperrt

`app/connection.ts` stellt beim Verbinden **eine** zusätzliche Frage an die Hülle und legt die
**Antwort** ab, nicht den Wert:

```
readUserNameFinding(): "ok" | "forbidden_characters" | "unknown"
```

- Die Klasse kommt aus `hasForbiddenNameCharacter` (`packages/domain/src/characters.ts`) —
  **dieselbe Funktion**, die der Dienst an seiner Tür und am Handschlag ruft. Die Oberfläche
  rechnet nichts nach und entscheidet nichts; sie erklärt einen Fehlschlag, der bereits
  stattgefunden hat. Eine zweite Fassung könnte anderer Meinung sein als die Tür, und genau
  diese Bauart hat in T-119 fünf Wellen lang eine Regression getragen (E-063 Punkt 4).
- Der Name lebt in einer örtlichen Bindung und geht mit ihr (B-8.2 Punkt 1). Er steht in **keiner**
  Meldung: Er trägt genau die Zeichen, um die es geht (B-4.3 Punkt 5).
- `"unknown"` bei fehlender Hülle oder gescheiterter Abfrage — ausdrücklich **nicht** `"ok"`.
  Eine unbeantwortete Frage ist keine Unbedenklichkeit.
- **Einmal geholt und nie wieder.** Der Anmeldename ändert sich während eines Laufs nicht.

`components/ShellStatus.tsx` bekommt daraus die Eigenschaft `userName` (Vorgabe `"unknown"`) und
zeigt bei `"forbidden_characters"` die neue Sperrmeldung `UserNameBlockedPanel` — **vor** der
Sperrmeldung zum Dienstausfall, weil sie deren Ursache ist und nicht ein zweiter Zustand daneben,
und **auch dann, wenn `serviceExit` leer ist** (Fall 1 oben). Regel 1 im Dateikopf bleibt
gewahrt: Die Datei nimmt einen Befund entgegen, keinen Namen.

### Der Text, und was F-15 daran ändert

Überschrift: **„Takt kann unter diesem Windows-Benutzernamen nicht arbeiten"**. Dann, der Reihe
nach: wofür der Name gebraucht wird (er geht unverändert in jede Exportdatei) — was an ihm nicht
geht (unsichtbare Zeichen, die eine Zeile umstellen) — warum Takt deshalb **gar nicht** startet,
statt eine Abrechnung zu schreiben, die etwas anderes anzeigt, als in ihr steht.

**Zwei Wege statt eines Verweises** (F-15):

1. „Melden Sie sich an diesem Rechner unter einem anderen Windows-Konto an und starten Sie Takt
   dort. Das ist der Weg, der ohne fremde Hilfe funktioniert."
2. „Oder lassen Sie den Anmeldenamen dieses Kontos ändern. Das geht nur mit Administratorrechten
   — bei einem Firmenkonto über die Systembetreuung."

Dazu der Satz, der die eigentliche Angst beantwortet, mit dem **Pfad aus `shellState().directory`**:
„Ihre bisher erfassten Daten sind davon nicht betroffen. Sie liegen in `…\AppData\Local\Takt`.
Sichern Sie diesen Ordner, bevor Sie das Konto wechseln: Unter einem anderen Konto legt Takt
einen eigenen an." Der Weitergabesatz („Für die Systembetreuung") nennt den Grund `user_invalid`
und die Zeichenklasse — er steht **daneben** und nicht an Stelle der zwei Wege.

Die Musterseite hat dafür einen vierten Schalter bekommen; der Zustand ist damit abnehmbar.

---

## 3. O-AF — „Takt beenden" scheitert nicht mehr stumm

`App.tsx:250` war `onQuit={() => void quitApplication()}`, und `quitApplication` kehrte ohne
Hülle **wortlos** zurück. Beides sah an der Schaltfläche gleich aus: Es geschah nichts. Der Knopf
ist nach E-036 der einzige Ausgang aus der Sperrmeldung.

**Warum ein `catch` allein nicht reicht — und das ist der Kern dieser Stelle.** Der Erfolgsfall
dieses Knopfes ist der Tod des eigenen Prozesses: `takt_quit` ruft `app.exit(0)`, und die Zusage
aus `invoke` kommt danach nie mehr an. Ein Fehlschlag ist deshalb nicht „die Zusage wird
abgewiesen", sondern „es geschieht nichts" — und auf nichts kann man nicht warten. `useQuitAttempt`
macht aus dem Ausbleiben ein Ereignis:

| Auslöser | Was der Benutzer sieht |
|---|---|
| Klick | Knopf lädt, Beschriftung „Takt wird beendet …", gesperrt |
| Zusage abgewiesen | sofort die Auskunft, mit dem Satz der Hülle |
| **5 s ohne Ende** (`QUIT_GRACE_MS`) | dieselbe Auskunft, ohne erfundene Ursache |

Die Auskunft steht **im Feld selbst** (T-118, offene Frage 2: Der Meldungsstapel liegt seit T-110
hinter der Abdunklung, und genau dort wird dieser Knopf gedrückt), in einer **dauerhaft
vorhandenen, anfangs leeren** `role="status"`-Region — dieselbe Regel wie an `refusal` im
Bestätigungsdialog (B-5): Eine Live-Region, die erst mit ihrem Inhalt in den Baum kommt, sagen
viele Vorlesehilfen nicht an. Gemessen: leere Region 0 px hoch.

Der Text nennt zwei Wege, die **jeder** Benutzer gehen kann — Fenster schließen (Kreuz, `Alt+F4`),
sonst Task-Manager (`Strg+Umschalt+Esc`) — und den Satz, der davor die Angst nimmt: „Beides ist
gefahrlos. Was gespeichert ist, bleibt gespeichert, und der lokale Dienst hält von selbst an,
sobald das Fenster von Takt weg ist." Das ist keine Beruhigung, sondern B-1.6 Punkt 3:
`watchParentLink` hängt am Ende der `stdin`-Röhre.

Der Knopf steht an **drei** Flächen (Startmeldung, Sperrmeldung, neue Meldung zum Benutzernamen)
und ist deshalb **ein** Baustein `QuitButton` — dieselbe Begründung wie bei `app/undoDone.ts`
(T-118). Der modale Rahmen ist zu `BlockingDialog` geworden, damit `useId`, `focusFirstWithin` und
`keepTabInside` nicht zweimal dastehen.

---

## 4. O-AH — fremder Text in `apps/web` (E-063 eine Fläche weiter)

### Geteilt oder nachgebaut — und warum

**Geteilt ist die Regel, nachgebaut sind drei Zeilen JSX.**
`apps/web/src/components/Foreign.tsx` ruft `visibleText` aus `@takt/domain`. Seit T-123 ist
`apps/outlook-addin/src/text/hidden.ts` eine reine Wiederausfuhr derselben Funktion — beide
`Foreign`-Bausteine rufen also **dieselbe Zeichenklasse an derselben Stelle**. Das ist der Teil,
der auseinanderlaufen konnte (T-119, E-063 Punkt 4), und er kann es jetzt nicht mehr.

Der Baustein selbst ist **nicht** geteilt: Ein gemeinsamer React-Baustein bräuchte ein Paket, das
React führt. `@takt/ui-tokens` ist heute reines CSS; seine Abhängigkeitsliste zu ändern hieße,
`package.json` anzufassen, und die gehört dem Orchestrator. Der Tausch ist bewusst und steht im
Dateikopf: Eine geteilte Zeichenklasse mit zwei winzigen Hüllen darum ist besser als zwei
Zeichenklassen — die Hülle kann nicht falsch werden, ohne dass der Übersetzer es merkt, die
Klasse konnte es. Wenn der Orchestrator ein `@takt/ui`-Paket will, ist der Umzug eine Datei.

### Die drei Behandlungen, angewandt

| Lage | Mittel | Stellen |
|---|---|---|
| Ein Element ist möglich | `<Foreign value={…} />` — `<bdi>` + `visibleText` | **45** in 26 Dateien |
| Nur eine Zeichenkette (Satz, `aria-label`, `title`) | `quotedName(…)` = `quoteName ∘ visibleText` | **103** |
| dasselbe, ohne Anführungszeichen | `foreignText(…)` = `visibleText` unter sprechendem Namen | **27** |
| **Vorschlag**, der in ein Eingabefeld läuft | `dropHiddenCharacters` | **3** (`TemplatesScreen`: „Kopie von …", Feld verdoppeln) |
| **Eingabefeld** | nichts | `NoteField`, `TextField`, `TagInput`-Textfeld |

`styles/base.css` trägt jetzt `bdi { unicode-bidi: isolate }` mit dem Vermerk, was die Regel
**nicht** kann.

Die Ordnung ist bewusst: **Erst sichtbar machen, dann klammern.** `quotedName` setzt die
Anführungszeichen um den bereits bereinigten Namen; umgekehrt stünde die Marke möglicherweise
außerhalb der Klammer, die sie einschließen soll.

### Wo der Baustein am Baustein sitzt und nicht an der Aufrufstelle

An sieben Stellen habe ich die Behandlung in den **Anzeigebaustein** gelegt statt an dessen
Aufrufer, weil sie dort einmal steht statt zwanzigmal: `TagChip` und `TagPath` (Name, Pfad,
`title`, `aria-label`), `TagTree`, `Menu` (Beschriftung und `valueText`), `Select`
(`itemToString`, Optionen, Gruppen), `Kanban` (Kartentitel, Spaltenname, alle daraus gebauten
Beschriftungen), `BookingTable`, `ExportGroups`, `FilterBar`, `RuleSummary`, `RulePickers`,
`Timer`, `WorkstationFacts`. Der Preis steht dabei: An der Aufrufstelle ist nicht mehr zu sehen,
dass behandelt wird. Der Gewinn wiegt schwerer — `TagChip` allein hat über zwanzig Aufrufer.

`screens/parts.tsx` `ScreenHeader.title` nimmt jetzt einen `ReactNode` statt einer Zeichenkette,
damit die Detailansicht den Todo-Titel durch `<Foreign>` schicken kann. Jede bisherige
Aufrufstelle bleibt gültig — dieselbe Bewegung wie `Callout.title` im Add-in (T-119 Annahme 5).

### Gesehen und bewusst **nicht** behandelt

| Stelle | Warum nicht |
|---|---|
| `NoteField` (Vermerk), `TextField` (Titel, Namen), Textfeld in `TagInput` | E-063 Punkt 1. Der Inhalt eines Eingabefeldes ist der Stand der Bearbeitung; ihn zu ändern hieße, die Eingabe zu ändern — und er ginge beim Speichern verändert in die Datenbank. **Das ist die größte offene Fläche und sie ist gewollt offen.** |
| Call-Nummern (`todo.callNumber`, `row.callNumber`) | `checkCallNumber` lässt nur `A-Z a-z 0-9 . _ / -` durch (E-045) — ein geschlossener Vorrat ohne jedes Richtungszeichen. An der einen Stelle, an der die Nummer mitten in einen Satz geht (`TodoDetailScreen`), steht die Begründung im Quelltext und nicht nur hier. |
| `rejectedNoteSources` in `TemplatesScreen` | Technische Feldschlüssel aus unserem eigenen Dienst, kein fremder Text (dieselbe Bewertung wie T-119, Abschnitt 4). |
| Eigene Beschriftungen: `POOL_STATUS_LABEL`, `EXPORT_STATE[…].label`, Spaltenköpfe, Reiter, `toast.action.label`, Achsenbeschriftungen in `RuleSummary` | Unser Text. `visibleText` wäre darauf die Identität; ein Aufruf darauf behauptete eine Herkunft, die es nicht gibt. |
| Sätze aus `poolMovementSentence` (`@takt/domain`) | Sie tragen Poolnamen, aber eingebaut in einen fertigen Satz aus fremder Hoheit. Einen fertigen Satz zu bereinigen wäre die Behandlung des Ergebnisses statt der Ursache — dieselbe Bewertung wie T-119. **Steht als offene Frage 2.** |
| Datenbank- und Exportpfade (`WorkstationFacts`, `ExportDirectoryField`) | Sie kommen vom Betriebssystem beziehungsweise aus dem Ordnerauswahldialog. Sie sind zu prüfen, aber nach anderen Regeln (`lib/pathInspection.ts`); die Zeichenklasse für **Namen** ist dafür der falsche Maßstab. |

---

## 5. Nachweis

Jeder Befehl einzeln, Ausgabe in eine Datei umgeleitet, Endstatus unmittelbar danach gelesen —
keine Pipe. Alle Läufe **nach** der letzten Änderung.

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm typecheck` | **0** | 8 Pakete, 7 Test-Konfigurationen, `tests/e2e` |
| `npx vitest run apps/web/test` | **0** | 5 Dateien, **71/71** |
| `pnpm --filter @takt/web build` | **0** | 128,53 kB CSS, 680,07 kB JS |
| `pnpm --filter @takt/web build:designsystem` | **0** | Musterseite mit dem neuen Zustand |
| `pnpm --filter @takt/web contrast` | **0** | **0 von 432** Paaren durchgefallen |

**Kontrast, berührt und geprüft.** `.quitfail` benutzt `--danger-text`, `--text-primary`,
`--text-secondary` und `--text-muted` auf `--danger-bg-subtle`; alle vier Paare stehen bereits im
Nachweis und tragen. Die **Randschiene** ist kein Schmuck: In der Startmeldung liegt der Kasten
auf seiner eigenen Farbe, ohne sie wäre allein der helle Rand das Merkmal (SC 1.4.11). Sie ist
`--danger-bg` auf `--danger-bg-subtle` — im Nachweis mit mindestens 3:1 geführt.

### Im Browser gemessen (E-062), Musterseite aus `build:designsystem`, Chromium

Wegwerfskripte und der Dateiserver auf Port 8123 sind danach entfernt beziehungsweise beendet;
im Arbeitsbaum liegt davon nichts.

```
1  bdi { unicode-bidi } im ausgelieferten Bündel: "isolate"
2a "Rechnung<U+202E>gnp.exe" roh:            Zeichen in Leserichtung? false
2b derselbe Titel durch `Foreign`:           Zeichen in Leserichtung? true
4  Sperrmeldung Benutzername (echter Baustein, Musterseite):
     Titel        "Takt kann unter diesem Windows-Benutzernamen nicht arbeiten"
     aria-labelledby trifft die Überschrift, aria-describedby gesetzt
     Fokus nach dem Öffnen: BUTTON "Takt beenden"
     zwei Handlungsschritte, ein Knopf, eine role="status"-Region, leer 0 px hoch
5  Konsolenfehler: keine
```

Punkt 2 ist der Befund selbst: Der Range-Test läuft über **jedes** Zeichen und prüft, ob seine
x-Position mit dem logischen Index wächst. Roh tut sie das nicht — der Titel steht auf dem
Bildschirm anders da, als er gespeichert ist. Durch `Foreign` tut sie es.

**Was ich gemessen habe und was dabei *nicht* herauskam, gehört dazu:** Ich habe zusätzlich
versucht, den Nutzen der **Isolierung** allein zu messen (deutscher Satz um einen rechtsläufigen
Namen). In beiden von mir gebauten Konstellationen ergab `<bdi>` **keinen** messbaren Unterschied
zur rohen Anzeige. Ich behaupte den Nutzen der Isolierung deshalb nicht aus eigener Messung; sie
steht, weil E-063 Punkt 1 sie entscheidet, weil T-119 sie im Aufgabenbereich gemessen hat und weil
sie nichts kostet. Der messbare, entscheidende Teil ist `visibleText` — und das ist genau die
Berichtigung, die T-119 selbst geschrieben hat.

**Was ich *nicht* im Browser gemessen habe:** die Fünfsekundenfrist von „Takt beenden". Sie
braucht ein Ereignis und eine Zeit und gehört damit nach E-062 dem e2e-tester; auf der Musterseite
ist sie nicht auslösbar, weil der Knopf dort die Zustände zurückschaltet. Vorschlag unten.

---

## 6. Artefakte

| Datei | Was |
|---|---|
| `apps/web/src/components/Foreign.tsx` | **neu.** `<bdi>` + `visibleText` aus `@takt/domain` |
| `apps/web/src/lib/foreign.ts` | **neu.** `quotedName` (`quoteName ∘ visibleText`) und `foreignText` für die Fälle ohne Element |
| `apps/web/src/components/ShellStatus.tsx` | `QuitButton`/`useQuitAttempt`/`QuitFailureNotice` (O-AF), `UserNameBlockedPanel`/`-Overlay` und `UserNameFinding` (O-AJ), `BlockingDialog` als geteilter Rahmen |
| `apps/web/src/app/connection.ts` | `readUserNameFinding`, `userName` im Zustand `ready`, `quitApplication` wirft statt zu schweigen |
| `apps/web/src/app/App.tsx` | Befund holen, halten, durchreichen; `onQuit={quitApplication}` statt `void` |
| `apps/web/src/lib/format.ts`, `lib/errorText.ts`, `lib/poolRule.ts`, `screens/TodoFormDialog.tsx` | O-AK: die drei Abschriften auf `@takt/domain` |
| `apps/web/src/styles/base.css` | `bdi { unicode-bidi: isolate }` |
| `apps/web/src/styles/components.css` | `.quitfail*` — Kasten, Schritte, Randschiene |
| `apps/web/src/showcase/ShellStateSection.tsx` | vierter Schalter für O-AJ; der Beenden-Knopf der Musterseite räumt alle Zustände ab |
| 40 weitere Dateien unter `apps/web/src/{app,components,lib,screens}` | O-AH: `<Foreign>`, `quotedName`, `foreignText`, `dropHiddenCharacters` an den Anzeigestellen |
| `.claude/team/reports/T-124-frontend-dev.md` | dieser Bericht |

**Nicht angefasst:** `apps/web/test/**`, `tests/e2e/**`, `packages/domain/**`, `packages/storage/**`,
`packages/export/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `docs/bedrohungsmodell.md`,
jede gemeinsame Datei (auch `apps/desktop/package.json`). **`apps/desktop` ist unverändert** —
Begründung in Abschnitt 7, Annahme 3. Kein `git commit`, kein `stash`, kein `checkout`, kein
fremder Prozess beendet; Ports 17843/17844 nicht belegt, mein eigener Dateiserver auf 8123 ist
beendet.

---

## 7. Annahmen

1. **Der Befund wird in `apps/web` erhoben, nicht in `apps/desktop`.** Die bessere Fassung wäre
   `apps/desktop/src/shell.ts`: Der Name verließe die Hülle dann nie. Sie braucht `@takt/domain`
   in `apps/desktop/package.json`, und `package.json` gehört dem Orchestrator. `apps/web` führt
   `@takt/domain` bereits; der Name lebt dort für die Dauer eines Funktionsaufrufs. Siehe offene
   Frage 1.
2. **Die Meldung zum Benutzernamen sperrt und warnt nicht.** Ein Name aus der Klasse bedeutet,
   dass der Dienst **nicht laufen kann** — die Hülle liest den Namen einmal beim Start und
   schickt genau ihn. Es gibt keinen Zustand, in dem der Befund zutrifft und Takt trotzdem
   arbeitet. Eine Anwendung, die dann bedienbar aussieht, verliert jede Eingabe.
3. **`apps/desktop` ist unverändert geblieben, obwohl es meine Hoheit ist.** Zwei Dinge dort sind
   ungenau, und beide sind Befunde und keine Blockade (siehe Risiko R1): `handshake_line` prüft
   mit `c.is_control()` (Kategorie `Cc`) und kennt die Richtungszeichen nicht, und
   `explain_exit(78)` beschreibt `user_invalid` falsch. Beides zu beheben hieße, die Zeichenklasse
   ein **drittes** Mal in den Baum zu schreiben, diesmal in Rust — genau die Bauart, gegen die
   T-122 und E-063 Punkt 4 geschrieben sind. Der Weg gäbe es (ein `#[cfg(test)]`-Vergleich per
   `include_str!` gegen `characters.ts`, wie `ereignisname_steht_auch_in_shell_ts` es vormacht),
   aber ob die Klasse nach Rust darf, ist eine Entscheidung und keine Handbewegung. **Die
   Auskunft an den Benutzer hängt nicht daran:** Sie deckt beide Wege bereits ab, weil sie den
   Namen selbst befragt und nicht den Beendigungscode.
4. **Fünf Sekunden Frist.** `app.exit(0)` braucht Millisekunden. Kürzer hieße, jemandem die
   Notfallanleitung zu zeigen, während sich das Fenster schließt; länger hieße, ihn vor einem
   Knopf sitzen zu lassen, der nichts tut.
5. **`quitApplication` wirft jetzt auch ohne Hülle.** Der Knopf steht nur da, wenn die Hülle
   einen Zustand gemeldet hat; wer ihn drückt und keine Hülle vorfindet, hat einen Widerspruch
   vor sich und soll ihn lesen können.
6. **Behandlung am Baustein statt an der Aufrufstelle** (Abschnitt 4). Der Preis ist benannt.
7. **Der Umfang von O-AH ist größer als „die Notiz".** Der Auftrag verlangt die Durchsicht; ich
   habe die Stellen genannt **und** behandelt, weil ein Baustein, den nur eine Fläche benutzt,
   beim nächsten Mal wieder vergessen wird (dieselbe Begründung wie T-119 Annahme 4).

---

## 8. Risiken

**R1 — `apps/desktop` bleibt für Richtungszeichen ungenau** (Annahme 3). Der Sidecar startet in
diesem Fall, weist ab und endet mit 78; die Hülle protokolliert dazu einen Satz, der den Fall
falsch beschreibt. Für den Benutzer ist das seit dieser Aufgabe folgenlos — die Oberfläche sagt
das Richtige —, für jemanden, der ins Protokoll sieht, nicht. Konkret:
`sidecar.rs:handshake_line` und `explain_exit(78)`.

**R2 — Die Erklärung hängt daran, dass die Oberfläche fragen kann.** Antwortet `takt_os_user`
nicht, steht der Befund auf `"unknown"` und der Benutzer sieht wieder die alte, allgemeine
Sperrmeldung. Das ist der bewusste Rückfall (kein `"ok"` raten), aber es ist ein Rückfall.

**R3 — Eine Behandlung an einem Baustein ist an der Aufrufstelle unsichtbar.** Wer einen neuen
Anzeigebaustein baut, hat keinen Übersetzerfehler, der ihn erinnert. Ein statischer Nachweis wie
`proof-addin.mjs` Abschnitt 17 („kein roher fremder Wert im JSX") gibt es für `apps/web` **nicht**.
Das ist die ehrlichste Lücke dieser Aufgabe; Vorschlag unten.

**R4 — Altbestand.** Namen und Titel von vor T-101/T-117 können die Zeichen tragen. Sie werden
jetzt **angezeigt** wie sie sind — mit Marke, isoliert — und bei einem `PATCH` mit 422 abgewiesen.
Unverändert der genannte Nebeneffekt aus T-101 Annahme 6 und T-119.

**R5 — Sicherheit, behoben:** Ein `U+202E` in einem Todo-Titel, in einem Vermerk, in einer
Leistung, in einem Tag-, Ordner-, Pool-, Status- oder Vorlagennamen kann die Anzeige der
Hauptanwendung nicht mehr umdrehen — gemessen (Abschnitt 5, Punkt 2). Die Stelle, an der es am
meisten wog, ist dieselbe wie im Add-in: eine Beschriftung, die den Titel **mitten im Satz**
trägt („Timer für „…" starten", „Aktionen für die Buchung …").

**R6 — Sicherheit, offen und benannt:** Das **Vermerkfeld** und die **Eingabefelder** zeigen
fremden Text unverändert. Das ist E-063 Punkt 1 und gewollt. Ein Vermerk aus dem Add-in trägt den
Betreff wörtlich; wer ihn im Textfeld liest, liest ihn ungeschützt. Der Text geht nie in einen
Export (A-7.2). Eine Behandlung dort hieße, die Eingabe des Benutzers zu ändern.

**R7 — Der Diff ist groß.** 49 Dateien unter `apps/web`, davon 40 rein mechanisch. Für normale
Namen ist jede dieser Änderungen die Identität (`visibleText` verändert nichts, `quoteName` setzt
dieselben Anführungszeichen), und `pnpm --filter @takt/web build` sowie die 71 Einheitentests
tragen — aber der Code-Reviewer muss viel lesen. Die Stichprobe, die am meisten lohnt:
`lib/foreign.ts`, `components/Foreign.tsx`, `components/Tag.tsx`, `components/Select.tsx`.

---

## 9. Offene Fragen

1. **Gehört die Frage nach dem Benutzernamen in die Hülle?** (Annahme 1.) Dann bekäme
   `apps/desktop` `@takt/domain` in seine Abhängigkeitsliste und gäbe nur noch den Befund heraus
   — der Name verließe die Hülle nie. Ich halte das für die bessere Fassung und habe sie nicht
   gebaut, weil `package.json` dem Orchestrator gehört.
2. **Die Sätze aus `poolMovementSentence` tragen Poolnamen ungeschützt** (Abschnitt 4). Aus einer
   E-Mail führt kein Weg dorthin, und die Namen passieren `nameSchema` — aber der Altbestand
   nicht (R4). Die saubere Stelle wäre `packages/domain`: `poolMovementSentence` könnte
   `enumerateNames` gegen eine Fassung tauschen, die `visibleText` mitnimmt. Das ist domain-dev,
   und es ändert vierzehn zeichengenau geprüfte Sätze — deshalb nur der Hinweis.
3. **Braucht `apps/web` einen statischen Nachweis wie das Add-in?** (R3.) `proof-addin.mjs`
   Abschnitt 17 prüft „kein roher fremder Wert im JSX" und „jede Fläche benutzt den Baustein".
   Für `apps/web` gäbe es das nicht; ein Nachweispfad unter `apps/web/scripts/` wäre meine
   Hoheit, aber `proof:*` in der Wurzel-`package.json` einzutragen nicht.
4. **Soll `lib/errorText.ts` die Weiterleitung behalten?** (Abschnitt 1.) Sie steht nur wegen
   eines Tests. Zieht der unit-tester die sechs Prüfungen an die Domäne, fällt sie weg.
5. **`explain_exit(78)` beschreibt seit T-122 drei Fälle mit einem Satz** (R1). Wenn Rust die
   Klasse **nicht** bekommen soll, wäre die kleinste Verbesserung, den Zusatz zu 78 um den dritten
   Fall zu ergänzen („… oder der Windows-Benutzername ist nicht abrechenbar"). Das ist meine
   Hoheit und eine Zeile — ich habe es nicht getan, weil es die Entscheidung aus Frage 1/Annahme 3
   vorwegnähme.

---

## 10. Nächster Schritt

1. **e2e-tester**, drei Fälle, alle drei brauchen ein Ereignis oder eine Zeit (E-062):
   - **O-AF:** „Takt beenden" in der Sperrmeldung drücken, während die Hülle den Befehl nicht
     ausführt; nach `page.clock.fastForward('00:06')` muss `.quitfail` stehen, die Überschrift
     „Takt ließ sich so nicht beenden" tragen und **zwei** Schritte nennen — und der Text darf
     das Wort „Systembetreuung" nicht enthalten (F-15).
   - **O-AJ:** Sidecar mit einem Benutzernamen starten, der `U+200F` trägt; die Oberfläche muss
     `[role="alertdialog"]` mit der Überschrift „Takt kann unter diesem Windows-Benutzernamen
     nicht arbeiten" zeigen, Tab darf den Dialog nicht verlassen, und **kein** Element im Dialog
     darf den Namen enthalten.
   - **O-AH:** Ein Todo mit `Rechnung<U+202E>gnp.exe` anlegen (über die Datenbank oder das
     Add-in, nicht über die Tür — die weist es ab); in der Todo-Liste muss der Titel als
     `Rechnung<U+FFFD>gnp.exe` in einem `bdi` stehen, und der Rangetest aus Abschnitt 5 Punkt 2
     ist die Vorlage dafür.
2. **unit-tester:** `packages/domain/test/enumeration.test.ts` (falls noch nicht vorhanden) statt
   des `enumerateGerman`-Blocks in `apps/web/test/lib/errorText.test.ts`; danach fällt die
   Weiterleitung aus Abschnitt 1 weg. Dazu reine Fälle für `lib/foreign.ts` — `quotedName` setzt
   die Anführungszeichen **außen** um den bereinigten Namen, das ist eine Reihenfolge und lohnt
   eine Prüfung.
3. **Orchestrator:** die Fragen 1, 3 und 5 entscheiden. Frage 5 ist eine Zeile und macht das
   Protokoll ehrlich, auch wenn Rust die Klasse nie bekommt.
