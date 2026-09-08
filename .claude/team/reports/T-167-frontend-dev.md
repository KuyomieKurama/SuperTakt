# T-167 — Der Doppelpunkt, zwei Namen untereinander und ein Pflichtfeld, das endlich spricht

**Rolle:** frontend-dev **Datum:** 2026-09-05 **Zweig:** `versionspruefung-gegen-github`

---

## Kurzfassung

```
Aufgabe: T-167 — O-DP (A-A-28), O-DT, O-DV/X-05 mit V-07, O-DZ, E-080
Status: fertig
```

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/desktop/src-tauri/src/attachment.rs` | **O-DP:** `Rejection::PathStreamSeparator` mit Schlüssel `path_stream_separator`, neue Funktion `has_stream_separator`, Aufruf in `check_file` nach `is_absolute` und vor `has_indirect_extension`, auf jeder Plattform. **O-DT:** die Zahl 28 im Dateikopf berichtigt. Dazu zwei Absätze Begründung im Kopfkommentar. **Nur der Produktivteil**; der `#[cfg(test)]`-Block ist unangetastet. |
| `apps/web/src/lib/attachmentLabel.ts` | Neu exportiert `effectiveFileNameOf` (X-05 Auflage 1) und `foreseeableRefusalOf` (V-07); neue private `hasStreamSeparator`; `extensionOf` ruft beide und liefert für einen Namen mit Doppelpunkt ausdrücklich nichts (A-A-28 Punkt 5). `INDIRECT_EXTENSIONS` kommt aus `@takt/domain`, nicht aus einer zweiten Liste. |
| `apps/web/src/components/AttachmentOpenDialog.tsx` | **X-05:** drittes Beschriftungspaar „Name beim Öffnen" samt einem Satz, **nur bei Abweichung**. **V-07:** dritter Zustand — steht die Absage schon fest, trägt der Dialog die Überschrift „Diese Datei wird nicht geöffnet", den Grund an Stelle des Wirkungssatzes und **keinen Öffnen-Knopf**, sondern „Schließen". |
| `apps/web/src/components/Attachments.tsx` | Neuer Satz zu `path_stream_separator` in `REFUSAL_TEXT`; `foreseenRefusalText` sagt die Absage aus derselben Zuordnung voraus und reicht sie an den Dialog. **O-DZ:** `touched` entsteht jetzt beim Verlassen des Feldes, bei allen drei Arten; `!picking` verhindert die Meldung, während der Systemdialog offen steht. |
| `apps/web/src/components/FormDialog.tsx` | `TextField` nimmt ein optionales `onBlur`. Additiv, kein bestehendes Attribut geändert. |
| `apps/web/src/components/NoteField.tsx` | **E-080:** „Nur für dich." → „Nur für Sie." Gleiche Länge, gleicher Satzbau. |
| `apps/web/src/showcase/DeadlineSection.tsx` | Zwei neue Vorführzustände in Abschnitt 13: „Name beim Öffnen weicht ab" und „Umleitung — Takt öffnet sie gar nicht". |
| `apps/web/src/styles/app.css` | `.openfile__name--diverging`, `.openfile__name--resolved`, `.openfile__note`. Kein bestehender Selektor umbenannt. |

---

## 1. O-DP — der Nachweis, rot vor grün

Gemessen wie T-164: ein **mechanischer, mit `diff` als zeichengleich bestätigter Schnitt** aus
`attachment.rs` (die Zeilen von `use std::path::…` bis zum Ende von `check_file`, ohne die
`ShellExt`-Zeile) in einer Wegwerf-Kiste unter `/tmp`, gebaut gegen `url 2.5.8` aus dem lokalen
Zwischenspeicher (`cargo build --offline`), gefahren gegen **wirklich angelegte Dateien** auf
ext4, wo der Doppelpunkt ein gewöhnliches Namenszeichen ist.

**Vorher** (der Schnitt aus dem ausgelieferten Stand, `diff` sagt zeichengleich):

```text
rechnung.lnk:harmlos.txt      existiert=true  -> ANGENOMMEN
rechnung.lnk::$DATA           existiert=true  -> ANGENOMMEN
bericht.txt:evil.lnk          existiert=true  -> abgewiesen: path_indirect_extension
rechnung.lnk                  existiert=true  -> abgewiesen: path_indirect_extension
bericht.txt                   existiert=true  -> ANGENOMMEN
programm.exe                  existiert=true  -> ANGENOMMEN
fehlt-rechnung.lnk::$DATA     existiert=false -> abgewiesen: path_missing
fehlt-nichtda.txt             existiert=false -> abgewiesen: path_missing
relativ:datei.txt             existiert=false -> abgewiesen: path_not_absolute
C:\Temp\bericht.txt           existiert=false -> abgewiesen: path_not_absolute
```

**Nachher** (derselbe Schnitt aus dem geänderten Stand, sonst dieselbe Kiste, dieselben Fälle):

```text
rechnung.lnk:harmlos.txt      existiert=true  -> abgewiesen: path_stream_separator
rechnung.lnk::$DATA           existiert=true  -> abgewiesen: path_stream_separator
bericht.txt:evil.lnk          existiert=true  -> abgewiesen: path_stream_separator
rechnung.lnk                  existiert=true  -> abgewiesen: path_indirect_extension
bericht.txt                   existiert=true  -> ANGENOMMEN
programm.exe                  existiert=true  -> ANGENOMMEN
fehlt-rechnung.lnk::$DATA     existiert=false -> abgewiesen: path_stream_separator
fehlt-nichtda.txt             existiert=false -> abgewiesen: path_missing
relativ:datei.txt             existiert=false -> abgewiesen: path_not_absolute
C:\Temp\bericht.txt           existiert=false -> abgewiesen: path_not_absolute
```

Das ist Zeile für Zeile die Tafel aus 22.1.1: Die beiden Fälle, die vorher `Ok` waren, sind
abgewiesen; `bericht.txt:evil.lnk` wechselt vom Endungs- zum Doppelpunktgrund; der nicht
vorhandene Pfad fällt **vor** der Existenzprüfung; die Gegenprobe bleibt angenommen. Ein
Nachweis, der auch vorher grün gewesen wäre, ist damit ausgeschlossen — die ersten drei Zeilen
sind vorher nachweislich anders.

Die letzten beiden Zeilen sind der Grund für die **Reihenfolge**: Stünde die Prüfung vor
`is_absolute`, bekäme `C:\Temp\bericht.txt` unter Linux `path_stream_separator` statt
`path_not_absolute` — und der bestehende Prüffall
`ein_windows_laufwerkspfad_ist_unter_linux_nicht_absolut_und_damit_nicht_messbar_als_unc`
(fremde Hoheit) würde rot, zu Recht. Die Auflage nennt genau diesen Grund; er ist hier gemessen.

**Prüffälle habe ich keine angelegt** — die `#[cfg(test)]`-Blöcke unter
`apps/desktop/src-tauri/src/**` gehören unit-tester (O-DQ, zweite Welle). `cargo test --lib`
zählt unverändert **50 von 50** auf diesem Läufer.

**Was nicht gemessen ist**, unverändert gegenüber T-164: ob `Start-Process` beziehungsweise
`explorer.exe` eine `.lnk::$DATA` wirklich ausführen. Das ist auf einem Linux-Läufer nicht zu
beantworten und war auch nicht die Bedingung — geschlossen wird eine Kontrolle, deren
Voraussetzung nachweislich nicht galt.

---

## 2. O-DT — die Zahl

`attachment.rs:41` sagte „28 Zeichenketten". Es sind **22**. Der Satz nennt die Zahl jetzt
zusammen mit der Regel aus 22.2: Eine Zahl wird gezählt und nicht abgeschrieben, und im Prüfteil
steht sie ohnehin im Typ (`[(&str, Option<Rejection>); 22]`), wo sie rot wird, ohne dass jemand
ein Dokument gelesen haben muss.

---

## 3. O-DV / X-05 und V-07 — ein Griff, zwei Befunde

**X-05, wörtlich nach der Vorlage von spec-ux-reviewer.** Ein drittes Beschriftungspaar,
zwischen „Dateiname" und „Vollständiger Pfad", **nur bei Abweichung**:

```
DATEINAME
quartalsbericht.exe.

NAME BEIM ÖFFNEN
quartalsbericht.exe
Punkte und Leerzeichen am Ende lässt Windows beim Öffnen weg.

VOLLSTÄNDIGER PFAD
/home/musterfrau/Downloads/quartalsbericht.exe.
```

Die vier Auflagen dazu, jede einzeln:

1. **Die Bedingung wird nicht im Dialog gerechnet.** `effectiveFileNameOf` steht in
   `lib/attachmentLabel.ts` und wird von `extensionOf` mitgerufen — Wirkung und Auskunft über
   die Wirkung kommen aus derselben Rechnung. Der Dialog fragt nur
   `effectiveFileNameOf(path) !== fileNameOf(path)`.
2. **Der angezeigte `Dateiname` bleibt roh und ungekürzt**, der volle Pfad ebenfalls (A-A-6
   Punkt 1, R-21). Das Paar tritt daneben, nicht an seine Stelle.
3. **Beide neuen Teile gehen durch `foreignText`.** `proof:foreign` bleibt bei 14/0.
4. **Ein Kommentar sagt, was die Zeile nicht ist:** keine Kontrolle. Die Kontrolle ist
   `check_file`, bei jedem Aufruf.

**V-07 im selben Griff.** Steht die Absage schon vor dem Klick fest — eine der fünf Umleitungen
oder ein Doppelpunkt im Namen —, dann:

* Überschrift **„Diese Datei wird nicht geöffnet"** statt „…wird geöffnet".
* An Stelle des Wirkungssatzes („Takt übergibt diese Datei…", der hier schlicht falsch wäre)
  steht **derselbe Satz, der bisher erst nach dem Bestätigen kam** — Wort für Wort aus
  `REFUSAL_TEXT`, damit derselbe Grund nicht an zwei Stellen zwei Sätze bekommt.
* **Kein Öffnen-Knopf.** Ein gesperrter wäre schlechter als keiner; es bleibt „Schließen", weil
  nichts abzubrechen ist.

Die Liste der fünf Endungen wird **nicht abgeschrieben**, sondern als `INDIRECT_EXTENSIONS` aus
`@takt/domain` geholt. Das ist mehr, als V-07 verlangt hat (dort stand „ein Kommentar muss
sagen, dass sie nicht abgeschrieben werden darf") — ein Import ist billiger als ein Kommentar,
der eingehalten werden muss.

**Gemessen im Browser** (Musterseite, `designsystem.html`, `vite` auf Port 5199, Playwright
headless — nicht der E2E-Lauf, nicht Port 17843):

| Fall | Überschrift | Knöpfe | drittes Paar |
|---|---|---|---|
| `…/abnahmeprotokoll.pdf` | Diese Datei wird geöffnet | Abbrechen, Öffnen | **nein** |
| `…/quartalsbericht.exe.` | Diese Datei wird ausgeführt | Abbrechen, Ausführen | **ja** |
| `…/rechnung.lnk` | Diese Datei wird nicht geöffnet | **nur** Schließen | nein |

Keine Konsolenfehler. Fokus liegt beim Öffnen in allen drei Fällen auf dem Dialog
(`tabIndex={-1}`), nicht auf einem Knopf. Im gesperrten Zustand führt Tab auf „Schließen" und
bleibt dort (Fokusfalle hält bei einem einzigen Knopf), der Umriss ist sichtbar
(`solid 2px rgb(33, 89, 218)`), `Escape` schließt. Bei 380 px Breite bricht der Pfad um, das
neue Paar hält, nichts wird gekürzt.

---

## 4. O-DZ — das Pflichtfeld, dessen Fehlermeldung niemand sah

Der Befund stimmte und war schlimmer als „unerreichbar": Weil der Hinzufügen-Knopf bei leerem
Feld gesperrt ist, lief `submit` nie, also wurde `touched` nie wahr — der Benutzer sah einen
gesperrten Knopf **ohne Erklärung**, bei allen drei Arten, sofern er nicht zufällig den
Dateiwähler benutzt und wieder geleert hatte.

Behoben an der Stelle, die ein Pflichtfeld ohne Wähler überhaupt hat: `TextField` nimmt ein
optionales `onBlur`, und das Verlassen des Feldes setzt `touched`. Nicht das Tippen — eine
Meldung beim ersten Zeichen tadelt eine Eingabe, die noch niemand beendet hat (SC 3.3.1).
`!picking` kommt dazu, weil der Weg zum Wähler über das Verlassen des Feldes führt: Ohne diese
Bedingung stünde der Tadel da, während der Benutzer im Systemdialog gerade dabei ist, ihn zu
erledigen.

---

## 5. E-080

`NoteField.tsx`: „Nur für dich." → „Nur für Sie." Ein Wort, gleiche Länge. Eine Suche über
`apps/web/src` und `apps/desktop/src` nach `dich`, `dir`, `dein…` findet danach nur noch die
Variable `dir` in `exportDirectoryAdvice.ts` — kein Oberflächentext.

---

## Werkzeugstand

| Werkzeug | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** — Exit 0, keine `error TS` |
| `pnpm test` | **1369 von 1371.** Die zwei roten liegen in `packages/domain/test/attachment.test.ts` (`attachmentLabel` — Wirtsname und Dateiname) und gehören zur laufenden Arbeit von domain-dev in derselben Welle. `apps/web` einzeln: **103/103**, `apps/desktop` einzeln: **14/14** |
| `cargo test --lib` (Linux) | **50 von 50** — unverändert, kein Fall gebrochen |
| `cargo check` | keine Warnung, kein Fehler |
| `pnpm --filter @takt/web build` | grün |
| `pnpm --filter @takt/web build:designsystem` | grün |
| `pnpm run contrast` | **0 von 474 Paaren durchgefallen** |
| `pnpm run proof:foreign` | 14/0 |
| `pnpm run proof:codepoints` | 45/0 |
| `pnpm run proof:shell-surface` | **rot — und zwar auch ohne meine Änderung**, siehe Risiko 1 |
| `pnpm test:e2e` | **nicht gefahren** (läuft parallel bei e2e-tester, Port 17843 fest verdrahtet) |

Wörtlich, die roten Ausgaben:

```
 FAIL  packages/domain/test/attachment.test.ts > attachmentLabel — nie eine leere Zeile (A-19.12) > Verweis ohne Titel: der Wirtsname aus der Normalform
AssertionError: expected 'http://beispiel.example/Seite' to be 'beispiel.example'
 FAIL  packages/domain/test/attachment.test.ts > attachmentLabel — nie eine leere Zeile (A-19.12) > Datei ohne Titel: der Dateiname, nie der volle Pfad
AssertionError: expected 'bericht.pdf (/home/nutzer/)' to be 'bericht.pdf'
```

```
  FEHL  3 namentliche Aufruforte für `open`, jeder mit seiner Prüfung (T-136-1, A-A-9)
        attachment.rs nennt die fremde Adresse https://example.org/seite. Im Rust-Anteil steht
        außer https://github.com/KuyomieKurama/SuperTakt/releases/tag/v und dem lokalen Dienst keine.
        … (28 weitere Zeilen derselben Art)
FEHLER: 1 Prüfung(en) rot, 0 Gegenprobe(n) blind.
```

---

## Zusammenfassung

Der Doppelpunkt ist zu, und er ist gemessen zu: Ein zeichengleicher Schnitt aus `attachment.rs`
nimmt `…/rechnung.lnk::$DATA` und `…/rechnung.lnk:harmlos.txt` vor der Änderung an und weist sie
danach mit `path_stream_separator` ab, während `bericht.txt` und `programm.exe` unverändert
durchgehen und der Windows-Laufwerkspfad weiterhin `path_not_absolute` bekommt — die Reihenfolge
aus A-A-28 ist damit nicht behauptet, sondern belegt. Die Oberfläche hat dazu ihren deutschen
Satz bekommen, und `extensionOf` urteilt über einen Namen mit Doppelpunkt gar nicht mehr. Die
Rückfrage vor dem Öffnen stellt jetzt zwei Namen untereinander, sobald Windows anders auflöst als
angezeigt, und sie zeigt für eine Umleitung keinen Öffnen-Knopf mehr, sondern den Satz, der
bisher erst nach dem Klick kam — beides einmal gerechnet, in `lib/attachmentLabel.ts`, mit der
Endungsliste aus der Domäne statt einer zweiten Abschrift. Dazu die kleinen Dinge: die Zahl 22
statt 28 im Dateikopf, ein Pflichtfeld, dessen Fehlermeldung nach dem Verlassen des Feldes
endlich erscheint, und ein „dich", das ein „Sie" geworden ist.

---

## Annahmen

1. **Der gesperrte Zustand des Dialogs erfasst auch den Doppelpunkt, nicht nur die fünf
   Umleitungen.** V-07 nennt nur die Umleitungen; A-A-28 Punkt 5 verlangt aber ausdrücklich, dass
   der Dialog für einen Namen mit Doppelpunkt nicht „wird geöffnet" sagt. Ein zweiter Mechanismus
   dafür wäre eine zweite Wahrheit gewesen, also trägt `foreseeableRefusalOf` beide Gründe — in
   derselben Reihenfolge wie `check_file`.
2. **Der Wirkungssatz („Takt übergibt diese Datei an die Standardanwendung…") entfällt im
   gesperrten Zustand.** Er wäre dort falsch. Das ist kein Streichen im Sinn von E-078 Punkt 3:
   Der Satz bleibt in beiden anderen Zuständen wortgleich stehen, und die Umstellung ist genau
   das, was derselbe Prüfer in V-07 verlangt hat.
3. **„Schließen" und nicht „Abbrechen"** im gesperrten Zustand. Es gibt dort nichts abzubrechen;
   ein Dialog mit einem einzigen Knopf „Abbrechen" liest sich, als hätte man etwas verhindert,
   das sonst geschehen wäre.
4. **`effectiveFileNameOf` fällt auf den vollen Namen zurück**, wenn nach dem Abschneiden nichts
   übrig bleibt (ein Name aus lauter Punkten). A-19.12 wörtlich: nie eine leere Zeile. An der
   Endung ändert das nichts — der Fall liefert vorher wie nachher keine Endung von einer Liste.
5. **`onBlur` steht an beiden Wertfeldern**, auch am Pfadfeld mit Wähler. Dieselbe Regel an
   derselben Feldart; eine Ausnahme nur für den Verweis wäre schwerer zu behalten als die Regel.
6. **Der `#[cfg(test)]`-Block ist unangetastet.** Kein Fall ergänzt, keine Zeile berührt — auch
   nicht die, die T-160 gebaut hat und die durch den neuen Grund hätte erweitert werden können.

---

## Risiken

1. **`proof:shell-surface` ist rot, und zwar seit T-160, nicht seit T-167.** Nachgemessen: Ich
   habe den Stand **vor** meiner Änderung wiederhergestellt, den Wächter gefahren und danach
   meine Fassung zeichengleich zurückgelegt (`diff` bestätigt) — die Prüfung
   „3 namentliche Aufruforte für `open`" ist in **beiden** Fassungen `FEHL`, mit denselben
   Zeilen. Ursache: Der Wächter sucht `https?://` über die ganze Datei ohne Kommentare, und der
   `#[cfg(test)]`-Block aus T-160 trägt die 22 Beispieladressen der Tafel aus 20.2
   (`https://example.org/seite` und so weiter). Für die Oberfläche kennt derselbe Wächter eine
   Ausnahme (`.invalid`, `proof-shell-surface.mjs:811`), für den Rust-Anteil nicht.
   **Ich habe das nicht behoben**, obwohl die Datei in meiner Hoheit liegt: Eine
   Sicherheitsschranke zu lockern, damit Prüfdaten hindurchpassen, ist eine Entscheidung und
   keine Zeile Code. Zwei Wege stehen offen, beide fremd oder gemeinsam: die Beispieladressen im
   Prüfteil auf `.invalid` umstellen (unit-tester) oder die vorhandene `.invalid`-Ausnahme auch
   im Rust-Anteil gelten lassen (ich, nach Freigabe durch security-checker).
2. **Der Preis von A-A-28 unter Linux ist jetzt real, nicht theoretisch.** Ein Anhang namens
   `Besprechung 10:30.pdf` lässt sich aus Takt heraus nicht mehr öffnen. Er bleibt sichtbar, der
   Pfad steht da, der Satz nennt den Grund, und der Dateimanager öffnet ihn weiterhin. Unter
   Windows kostet die Regel nichts. Das ist in 22.1.1 abgewogen; ich melde es, damit es nicht
   später als Fehler wiederkommt.
3. **Die Domäne weist beim Anlegen weiterhin keinen Doppelpunkt ab.** `checkAttachmentPath`
   (`packages/domain/src/attachment.ts`) kennt `path_stream_separator` nicht. Das ist kein Loch —
   die Kontrolle sitzt bewusst im Öffnen-Befehl, weil zwischen Eingabe und Öffnen der Bestand
   liegt —, aber es ist eine **Unfreundlichkeit**: Ein Benutzer darf einen solchen Pfad anlegen
   und erfährt erst beim Klick, dass Takt ihn nicht öffnet. Siehe offene Frage 1.
4. **Der Dialog sagt jetzt an einer Stelle etwas über Windows.** „Punkte und Leerzeichen am Ende
   lässt Windows beim Öffnen weg." Auf einem Linux-Läufer ist der Satz sachlich falsch für den
   dortigen Öffnen-Weg — die Anwendung ist für Windows gebaut (`WindowsUser` im Export,
   Outlook-Add-in), und der Fall entsteht ohnehin nur, wenn ein Name auf Punkt oder Leerzeichen
   endet. Ich halte das für vertretbar; spec-ux-reviewer hat den Wortlaut so entschieden.

---

## Offene Fragen

1. **Soll `checkAttachmentPath` in `packages/domain` den Doppelpunkt schon beim Anlegen
   abweisen** (mit einem neuen `PathRejection`-Zweig `path_stream_separator`, so wie es
   `path_indirect_extension` heute tut)? Dafür spricht, dass die Absage dann am Feld steht statt
   am Klick — dieselbe Bauart wie bei den fünf Umleitungen. Dagegen spricht nichts außer der
   Frist. Die Datei gehört domain-dev; A-A-28 verlangt es nicht.
2. **Wer schließt Risiko 1?** Ich schlage vor: unit-tester stellt die Beispieladressen im
   `#[cfg(test)]`-Block auf `.invalid` um (das ist die Form, die der Wächter für die Oberfläche
   bereits kennt, und sie ist per RFC 2606 für genau diesen Zweck reserviert). Der Wächter bliebe
   dann unverändert streng — mir ist das lieber als eine zweite Ausnahme in einer Schranke.
3. **Trägt „Diese Datei wird nicht geöffnet" für spec-ux-reviewer?** Die Überschrift ist meine
   Wahl; V-07 nennt nur „keinen Öffnen-Knopf, sondern den Satz". Sie beginnt bewusst mit
   denselben drei Wörtern wie die beiden anderen Überschriften — der Unterschied steht am Ende
   des Satzes, wo er gelesen wird, und `getByRole('alertdialog', { name: /Diese Datei wird/ })`
   in `attachment-open-commands.spec.ts:70` trifft weiterhin alle drei.

---

## Nächster Schritt

`visual-qa` prüft die drei Zustände der Rückfrage auf der Musterseite, Abschnitt 13 („Frist und
Anhänge"): die drei alten Knöpfe und die zwei neuen — „Name beim Öffnen weicht ab" und
„Umleitung — Takt öffnet sie gar nicht". Zu prüfen ist vor allem, ob das dritte Paar bei den
drei anderen Fällen **wirklich nicht** erscheint; das ist die halbe Aussage von X-05.

Danach unit-tester für O-DQ: die vier Linux-Fälle aus der Tafel in 22.1.1 als `#[cfg(test)]`,
plus die Gegenprobe und, unter `#[cfg(windows)]`, die eine Zusicherung, dass
`Path::new("…x.lnk::$DATA").is_file()` wahr ist. Der Nachweis oben zeigt, dass drei davon vor der
Behebung rot waren — die Fälle messen also eine Behebung und wiederholen sie nicht.
