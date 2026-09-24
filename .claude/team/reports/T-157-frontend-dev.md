# T-157 — Nacharbeit aus dem Qualitätstor: der nachgestellte Punkt, die Beschriftung, der Fokus

**Aufgabe:** T-157
**Rolle:** frontend-dev
**Status:** braucht Review
**Datum:** 2026-09-05

---

## Befundtafel

| Befund | Ergebnis | Womit gemessen |
|---|---|---|
| **O-CU** Rust: nachgestellter Punkt/Leerzeichen hebt A-A-5 auf | **behoben** | `cargo test --lib` (31 grün, keine Regression) + eigene Rust-Probe mit 18 Fällen: 18/18 richtig, die alte Fassung fällt bei 9 davon |
| **O-CU** Oberfläche: `extensionOf` hält `…exe.` für endungslos | **behoben** | Eigene Probe über `runsWhenOpened`/`extensionOf` mit 14 Fällen, 14/14 richtig |
| **O-CR** zwei Fassungen von `attachmentLabel` | **behoben, Auflösung zugunsten der Domäne** | `pnpm typecheck`, `pnpm run boundaries`, Messung der Domänenantworten für 9 Fälle (Tabelle unten) |
| **O-CA** Endungsliste ist keine Grenze | **behoben (Kommentar verschärft)** | Lesen; der Absatz nennt die Folge ausdrücklich beim Namen |
| **O-CS / O-CX** `recoverFocus` zu früh gefallen | **anders behoben** — zurück, aber in `DialogSurface` und mit zwei Anlässen statt einem | Quelltextbeleg aus `@zag-js/focus-trap`; **nicht** im Browser gemessen (kein Playwright in dieser Welle) |
| **O-CS** Kopf von `DialogSurface`: `preventScroll`/`pointerBlocking` ungenannt | **behoben** | Quelltext `@zag-js/dialog` (`props()`), `base.css:49-53`, `app.css:90` gegengelesen |
| **O-CY** Fokus kehrt nicht zum Zeilenmenü zurück | **anders behoben** — der Auslöser bekommt den Fokus **vor** der Aktion | Quelltextanalyse der Reihenfolge in `@zag-js/menu` und `@zag-js/focus-trap`; **nicht** im Browser gemessen |
| **O-CZ** Schließkreuz ohne `disabled={busy}` | **behoben** | `pnpm typecheck`, `pnpm --filter @takt/web build` |
| **O-CZ** `.sidenav` bleibt bei schmaler Breite `sticky` | **behoben** | Kaskadenregel: gleiche Spezifität, Reihenfolge entscheidet; Ausnahme steht jetzt hinter der Grundregel |
| **O-CM** falscher A-7.1-Satz in `GlobalSearch.tsx` | **behoben (gestrichen)** | Gegengelesen gegen E-038, E-075 Punkt 2, A-7.2 |
| **O-CO** Dashboard friert `today` ein | **behoben** | Ableitung am Code bestätigt: `useMemo(…, [])`; jetzt `useToday()` |
| **O-CO** Todo-Liste zeichnet gefilterte Frist nicht neu | **behoben** | Ableitung am Code bestätigt: `dueStates` geht an den Dienst, `today` fehlte in der Liste |

Gesamtlauf: `pnpm typecheck` · `pnpm test` (1359 in 69 Dateien) · `pnpm run test:rust` (31) ·
`pnpm --filter @takt/web build` · `pnpm run contrast` (474 Paare) · `pnpm run proof:foreign` ·
`pnpm run proof:codepoints` · `pnpm run proof:shell-surface` · `pnpm run proof:all` ·
`pnpm run boundaries` — **alles grün**.

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/desktop/src-tauri/src/attachment.rs` | `effective_file_name` neu, `has_indirect_extension` prüft den aufgelösten Namen; Kopfabschnitt „A-A-5′" |
| `apps/web/src/lib/attachmentLabel.ts` | `attachmentLabel` ruft die Domäne; `withoutScheme` gestrichen; `extensionOf` schneidet nachgestellte `.`/Leerzeichen ab und zählt den führenden Punkt; Kopf um O-CA und A-A-5′ erweitert |
| `apps/web/src/components/DialogSurface.tsx` | Rückholung des Fokus (focusout + eigener `MutationObserver`); Kopfabschnitte zu `preventScroll`/`pointerBlocking` und zur Rückholung |
| `apps/web/src/components/FormDialog.tsx` | `disabled={busy}` am Schließkreuz; Kopfkommentar berichtigt (`recoverFocus` ist umgezogen, nicht entfallen) |
| `apps/web/src/components/Menu.tsx` | Auslöser bekommt den Fokus vor der Aktion (`beforeAction` in `useSelectHandler`, `ref` an `Ark.Trigger`) |
| `apps/web/src/app/GlobalSearch.tsx` | Falscher A-7.1-Satz gestrichen, Stand statt Regel beschrieben |
| `apps/web/src/screens/DashboardScreen.tsx` | `useToday()` statt eingefrorenem `useMemo`; `todayCalendarDay`- und `useMemo`-Import entfallen |
| `apps/web/src/screens/TodoListScreen.tsx` | `today` in der Abhängigkeitsliste der Listenabfrage |
| `apps/web/src/styles/showcase.css` | Medienabfrage für `.sidenav` hinter die Grundregel |

Nichts außerhalb von `apps/web/**` und `apps/desktop/**`. `packages/domain/**`, `apps/local-api/**`,
`apps/outlook-addin/**`, `apps/*/test/**`, `tests/e2e/**` und die `#[cfg(test)]`-Blöcke sind
unberührt.

---

## 1 — O-CU, Rust: die Endung wird gegen den **aufgelösten** Namen geprüft

`has_indirect_extension` benutzt `Path::extension()` nicht mehr. Zwei Abweichungen, beide Absicht
und beide im Kommentar begründet:

1. **Nachgestellte `.` und Leerzeichen fallen weg, bevor verglichen wird.** Das ist der gemessene
   Fund: Windows wirft sie weg, bevor es die Datei auflöst, `is_file()` nimmt dieselbe Abkürzung,
   und `ShellExecuteW` folgt danach der Verknüpfung.
2. **Ein führender Punkt zählt als Trenner.** `Path::extension()` hält `.lnk` für eine versteckte
   Datei ohne Endung — eine Unix-Sitte. Der Windows-Explorer hält es für eine Verknüpfung.
   Deshalb `rsplit_once('.')`.

Beides gilt **auf jeder Plattform**, nicht unter `cfg(windows)`. Derselbe Grund wie bei `is_unc`:
Ein Zweig, den der Läufer nicht betritt, ist kein Nachweis (A-A-10). Der Preis ist eine Datei
namens `rechnung.lnk.` unter Linux, die Takt nicht öffnet; eine `.lnk` tut dort ohnehin nichts.

### Gemessen (eigene Probe, `rustc`, altes und neues Verhalten nebeneinander)

18 Fälle, 18 richtig. Die alte Fassung war bei **9** davon blind. Auszug:

```
/home/a/rechnung.lnk.        neu=true  alt=false
/home/a/rechnung.lnk         neu=true  alt=false   (nachgestelltes Leerzeichen)
/home/a/rechnung.lnk. . .    neu=true  alt=false
/home/a/rechnung.LNK.        neu=true  alt=false
/home/a/.lnk                 neu=true  alt=false
/home/a/rechnung.lnk.txt     neu=false alt=false
/home/a/programm.exe.        neu=false alt=false   (kein Umleiter — geht durch die Rückfrage)
```

### Übergabe an unit-tester — die Fälle für `#[cfg(test)]` in `attachment.rs`

Ich habe sie **nicht** geschrieben; die benannte Ausnahme in `CLAUDE.md` gehört unit-tester. Die
Liste ist der Nachweis, den T-156-2 (A-A-25) verlangt.

**`has_indirect_extension` über `check_file` — erwartet `Err(Rejection::PathIndirectExtension)`:**

| Eingabe (absoluter Pfad auf eine vorhandene Datei) | Erwartung |
|---|---|
| `…/rechnung.lnk` | abgewiesen — der Grundfall, damit die Reihe nicht nur die Randfälle misst |
| `…/rechnung.lnk.` | **abgewiesen** — T-156-1, der eigentliche Fund |
| `…/rechnung.lnk ` (nachgestelltes Leerzeichen) | **abgewiesen** |
| `…/rechnung.lnk. . ` (gemischt, mehrfach) | **abgewiesen** |
| `…/rechnung.LNK.` | **abgewiesen** — Groß-/Kleinschreibung ist gleichgültig |
| `…/verweis.url `, `…/start.pif.`, `…/ordner.scf.`, `…/app.desktop.` | **abgewiesen** — alle fünf Umleiter, jeder einmal mit nachgestelltem Zeichen |
| `…/.lnk` (Name ist nur die Endung) | **abgewiesen** — `Path::extension()` sagt hier `None` |

**Erwartet **kein** `PathIndirectExtension` (die Endung ist eine andere oder keine):**

| Eingabe | Erwartung |
|---|---|
| `…/bericht.txt` | geht durch |
| `…/bericht.txt.` | geht durch — ein nachgestellter Punkt allein ist kein Grund |
| `…/rechnung.lnk.txt` | geht durch — die letzte Endung zählt, und die ist `txt` |
| `…/rechnung.` | geht durch — nach dem Abschneiden bleibt keine Endung |
| `…/.gitignore` | geht durch — `gitignore` steht auf keiner Liste |
| `…/programm.exe.` | geht durch — `.exe` ist **kein** Umleiter (A-A-5, ausdrücklich); es geht durch die Rückfrage, und die sagt seit dieser Welle „wird ausgeführt" |

**Zwei Fälle, die die Reihenfolge der Prüfungen messen** (sie darf nicht kippen):

| Eingabe | Erwartung |
|---|---|
| `\\server\freigabe\rechnung.lnk.` | `PathUnc` — **nicht** `PathIndirectExtension`; UNC steht vor der Endung |
| `rechnung.lnk.` (relativ) | `PathNotAbsolute` — die Absolutheit steht vor der Endung |

**Unter `#[cfg(windows)]` zusätzlich** (A-A-10): dieselben drei Zeilen `x.lnk`, `x.lnk.`, `x.lnk `
gegen eine **wirklich angelegte** Datei `x.lnk`, damit gemessen ist, dass `is_file()` für alle drei
bejaht — das ist die Hälfte des Angriffs, die auf Linux nicht existiert.

---

## 2 — O-CU, Oberfläche: die Rückfrage sagt jetzt die Wahrheit über die Wirkung

`extensionOf` schneidet nachgestellte `.` und Leerzeichen ab, bevor es die Endung bestimmt, und
zählt den führenden Punkt mit — dieselbe Rechnung wie `effective_file_name` in `attachment.rs`,
mit demselben Absatz als Begründung.

**Der angezeigte Dateiname bleibt roh.** `fileNameOf` zeigt weiter den gespeicherten Wert,
ungekürzt. Die Rückfrage soll zeigen, was im Bestand steht, und sagen, was es tut — nicht den Wert
schönen.

Gemessen (eigene Probe über `runsWhenOpened`), 14 Fälle, 14 richtig:

```
C:/temp/rechnung.exe.     name="rechnung.exe."     ext="exe"        wird ausgeführt
C:/temp/rechnung.exe␠     name="rechnung.exe "     ext="exe"        wird ausgeführt
C:/temp/skript.bat.       name="skript.bat."       ext="bat"        wird ausgeführt
/home/a/.exe              name=".exe"              ext="exe"        wird ausgeführt
/home/a/bericht.txt.      name="bericht.txt."      ext="txt"        wird geöffnet
/home/a/.gitignore        name=".gitignore"        ext="gitignore"  wird geöffnet
/home/a/rechnung.exe.txt  name="rechnung.exe.txt"  ext="txt"        wird geöffnet
```

---

## 3 — O-CR: die Oberfläche ruft die Domäne

Nach der Entscheidung des Orchestrators. `apps/web/src/lib/attachmentLabel.ts` führt keine eigene
Fassung mehr; `attachmentLabel(attachment)` ist eine Hülle über
`attachmentLabel(kind, title, target)` aus `@takt/domain` — die Bauart aus `lib/deadline.ts`.
`withoutScheme` ist gestrichen, sie hatte keinen zweiten Aufrufer.

**Was sich sichtbar ändert** (gemessen, nicht gelesen — Aufruf der Domänenfunktion mit neun
Eingaben):

| Fall | vorher (Oberfläche) | jetzt (Domäne) |
|---|---|---|
| Verweis ohne Titel | `beispiel.example/ordner/erste-seite` | **`beispiel.example`** |
| Verweis mit leerem Ziel | `Ohne Bezeichnung` | **`Verweis`** |
| Datei mit leerem Ziel | `Ohne Bezeichnung` | **`Datei`** |
| Bild mit leerem Ziel | `Ohne Bezeichnung` | **`Bild`** |
| Verweis mit Titel, Datei, Bild sonst | unverändert | unverändert |

Ein Titel aus lauter Leerzeichen gilt in beiden Fassungen als fehlend.

**Die Prüfreihen bleiben grün**, und zwar ohne Zutun: `attachment-crud.spec.ts:109/139/183` und
`attachment-persistence-live.spec.ts:77` messen mit `toContainText`/`allInnerTexts` über die
**ganze Zeile**, und dort steht der volle Wert weiterhin in der zweiten, kleineren Zeile
(`.attachment__value`). Ich habe die Dateien gelesen, nicht angefasst.

Die Endungsliste (`runsWhenOpened`) ist **nicht** mitgewandert: Sie ist die Wortwahl der
Rückfrage und keine Beschriftung. Der Kopfkommentar sagt jetzt ausdrücklich, was passiert, wenn
jemand sie für die Grenze hält — er baut die harte Abweisung in `attachment.rs` aus (O-CA). Der
Satz steht mit der Auflage, beim Umzug mitzuwandern.

---

## 4 — O-CS / O-CX: die Rückholung ist zurück, an **zwei** Anlässen

Der Befund ist im Quelltext belegt. `@zag-js/focus-trap`, `setupMutationObserver`:

```js
removedNodes.some((node) => node === this.state.mostRecentlyFocusedNode)
```

Verglichen wird **per Identität mit dem entfernten Knoten**. Verschwindet der fokussierte Knopf als
**Nachfahre** eines größeren Stücks — der Anlaßfall aus T-072 (`<li>` im Dialog „Spalten des
Boards") und der aus T-153 (`PoolFormDialog`, React baut die ganze Chipliste neu) —, greift sie
nicht. Meine Entwarnung aus T-152 war an dieser Stelle falsch.

Die Rückholung steht jetzt in `DialogSurface` und damit für **jeden** Dialog, mit zwei Anlässen:

1. **`focusout` an der Abdunklung** mit `relatedTarget === null` — der Weg aus T-072. Er greift
   auch, wenn nichts entfernt wurde (ein Knopf sperrt sich durch seine eigene Wirkung).
2. **Ein eigener `MutationObserver`** auf dem Kasten (`childList`, `subtree`), der **keine Knoten
   vergleicht**, sondern nach jeder Änderung fragt, wo der Fokus gelandet ist. Das ist die Antwort
   auf den Nachfahrenfall und der ganze Unterschied zur Falle.

Zurückgeholt wird **nur**, wenn der Fokus ins Nichts gefallen ist (`null` oder `<body>`) — nicht,
wenn er bloß außerhalb des Kastens steht. Die aufgeklappte Liste jedes Auswahlfelds hängt im Portal
am Dokumentkörper und ist damit außerhalb; wer dort zugriffe, risse dem Benutzer die Auswahl unter
den Fingern weg. Weitere Bremsen: `document.hasFocus()` (wer zur Nachbaranwendung wechselt, wird
nicht zurückgerissen) und ein einziger Zeitgeber statt eines je Anlass.

Das Ziel der Rückholung ist **dieselbe Wahl wie beim Öffnen** (`initialFocus`), nicht das erste
tabulierbare Element. Bei `FormDialog` ist das das erste Formularfeld — genau die Erwartung, die
T-153 formuliert hat; die alte Fassung wäre auf dem Schließkreuz gelandet.

Was mit `modal={false}` sonst noch zurückbleibt, steht jetzt im Kopf: `preventScroll` und
`pointerBlocking`. Beides ist folgenlos — das Fenster hat gar keinen Bildlauf (`base.css:49-53`
bindet `html`, `body`, `#root` auf volle Höhe, `.app` steht in `app.css:90` auf
`overflow: hidden`), und `.scrim` fängt die Zeigerereignisse als eigene, deckende Fläche selbst ab.
Der Absatz nennt beides, damit es beim nächsten Umbau nicht überrascht.

---

## 5 — O-CY: der Auslöser bekommt den Fokus, **bevor** die Aktion läuft

Ursache, aus dem Quelltext beider Bibliotheken:

- Die Fokusfalle merkt sich beim Scharfstellen `nodeFocusedBeforeActivation = getActiveElement(doc)`
  und gibt den Fokus beim Schließen dorthin zurück. Ohne `Dialog.Trigger` und ohne `finalFocusEl`
  ist genau dieser Knoten das Ziel (`setReturnFocus` in `@zag-js/dialog` fällt am Ende auf ihn
  zurück).
- Auf dem Weg über ein Menü ist der fokussierte Knoten der **Eintrag** im Portal. Er verschwindet
  mit dem Menü, und ein `focus()` auf einen verschwundenen Knoten tut nichts — Fokus auf `<body>`.
- Das Menü holt seinen Auslöser zwar selbst zurück, aber **nach** der Aktion: In `@zag-js/menu`
  läuft `invokeOnSelect` vor `focusTrigger`, und `focusTrigger` verzögert zusätzlich über
  `queueMicrotask`. Die richtige Reihenfolge hängt damit an der Taktung zweier Zeitgeber (Microtask
  gegen `requestAnimationFrame`) und an der Frage, wann React seine passiven Effekte spült.

Die Behebung nimmt die Taktung aus der Rechnung: `Menu` hält einen `ref` auf `Ark.Trigger` und
fokussiert ihn, **bevor** die Aktion läuft. Danach ist der Weg über das Menü derselbe wie der über
einen gewöhnlichen Knopf — und der funktioniert nachweislich („Neues Todo" auf dem Dashboard,
T-153 Screenshot 20). Für Aktionen ohne Dialog ist es folgenlos: Das Menü hätte denselben Fokus
einen Wimpernschlag später gesetzt. Ein Verlassen der Menü-Ebene ist es nicht — die Abweisungsebene
führt den eigenen Auslöser ausdrücklich als Ausnahme (`exclude: [getTriggerEl(scope), …]`).

Das `ContextMenu` bekommt die Änderung **nicht**: Es hat keinen Auslöser (es hängt an einem Punkt),
und `focusTrigger` steigt dort ohnehin bei `anchorPoint` aus.

---

## 6 — O-CZ, O-CM, O-CO

- **Schließkreuz:** `disabled={busy}`, mit dem Satz daneben, warum Escape und „Abbrechen" es schon
  taten und dieses Loch keins bleiben durfte.
- **`.sidenav`:** Die Ausnahme steht jetzt **hinter** der Grundregel in einer eigenen Medienabfrage.
  Gleiche Spezifität, Reihenfolge entscheidet — eine Medienabfrage gewinnt davon nichts. Der
  Kommentar sagt das, damit die nächste Sortierung sie nicht zurückschiebt.
- **`GlobalSearch.tsx`:** Der Satz ist gestrichen, nicht umschifft. An seiner Stelle steht, was
  wirklich gilt: A-7.2 verbietet den **Export**, nicht das Wiederfinden; E-038 und E-075 Punkt 2
  verlangen die Suche; heute sucht `repo-todos.ts` in `title` und `call_number`, und **das ist der
  Stand, nicht die Regel**. Die Erweiterung ist ausdrücklich als eigene Aufgabe benannt, samt der
  Bedingung aus E-075 Punkt 2 (C-22 wird erneut vorgelegt). **Die Suche selbst habe ich nicht
  gebaut.**
- **O-CO:** Die Ableitung von spec-ux-reviewer stimmt, ich habe sie am Code nachgeprüft.
  - `DashboardScreen.tsx` benutzte `useMemo(() => todayCalendarDay(), [])` — an T-147 **vorbei**.
    Der Tag steht dort in zwei Fragen an den Dienst („heute erfasst" über `fromDay`/`toDay` und
    mittelbar „wie viel ist überfällig"). Jetzt `useToday()`; damit hängt die Abfrage am
    Mitternachtszeitgeber und am `visibilitychange` aus T-147.
  - `TodoListScreen.tsx` hatte `today` **nicht** in der Abhängigkeitsliste der Listenabfrage,
    obwohl der Fristfilter als `dueStates` an den Dienst geht und dort gegen dessen heutigen Tag
    gerechnet wird. Die Marken an den Zeilen wechselten um Mitternacht (sie hängen an `useToday`),
    die gefilterte Liste darum herum nicht — die beiden widersprachen sich. `today` steht jetzt in
    der Liste, mit dem Kommentar, warum eine Abhängigkeit dort steht, die im Rumpf nicht vorkommt.

---

## Annahmen

1. **Die Rückholung gehört in `DialogSurface`, nicht in `FormDialog`.** T-072 hatte sie je Dialog;
   seit T-152 gibt es eine gemeinsame Fläche, und der Fund von T-153 saß in einem anderen Dialog
   als der von T-072. Eine Kopie je Dialog wäre dieselbe Klasse, die E-076 Stufe 1 abgeräumt hat.
2. **Zurückgeholt wird nur aus `null`/`<body>`, nicht aus „außerhalb des Kastens".** Die strengere
   Regel wäre für Portale falsch. Die alte Fassung aus T-072 war an dieser Stelle großzügiger; das
   war vor den Ark-Portalen vertretbar und ist es heute nicht mehr.
3. **Das Ziel der Rückholung ist `initialFocus`, nicht `focusFirstWithin`.** Abweichung von der
   Fassung aus T-072, aber wörtlich die Erwartung aus T-153 („dieselbe Wahl wie beim Öffnen").
4. **O-CY wird im `Menu` gelöst, nicht im Dialog.** Die Alternative wäre ein `finalFocusEl` je
   Aufrufstelle gewesen — eine Zusage, an die jeder neue Aufrufer denken müsste.
5. **`TimeScreen.tsx:66` habe ich absichtlich nicht angefasst** (siehe offene Frage 3).
6. **Der führende Punkt zählt jetzt als Endung**, in Rust wie in TypeScript. Das geht über den
   gemeldeten Fund hinaus; es ist dieselbe Blindheit von der anderen Seite und ohne Kosten
   (`.gitignore` bekommt die Endung `gitignore` und steht auf keiner Liste).

---

## Risiken

1. **Sicherheit, verbleibend: `check_file` deckt nicht jede Windows-Namensauflösung.** Behoben ist
   der gemeldete Fall. Zwei Nachbarn bleiben, und ich habe sie **nicht** angefasst, weil sie eine
   Bewertung brauchen und keinen Zufallsgriff:
   - **Alternative Datenströme:** `C:\…\rechnung.txt:evil.lnk`. Unter Windows ist der Doppelpunkt
     ein Stromtrenner, unter Linux ein gewöhnliches Zeichen. Die Endungsprüfung sieht `lnk` und
     würde hier zufällig richtig abweisen — bei `…\evil.lnk:harmlos.txt` sähe sie `txt`.
   - **Kurznamen (8.3):** `C:\…\RECHNU~1.LNK` löst auf denselben Umleiter auf; die Endung stimmt
     hier zwar, aber die Klasse „der Name ist nicht die Datei" ist dieselbe.
   Für security-checker, nicht für mich.
2. **O-CS/O-CX und O-CY sind nicht im Browser gemessen.** Der Auftrag schließt Playwright und den
   Entwicklungsserver aus. Beide Behebungen stützen sich auf den Quelltext der Bibliotheken und auf
   die von T-153 beschriebene Beobachtung. **Sie brauchen die Sichtprüfung**, und zwar genau an den
   beiden nachgestellten Stellen (`PoolFormDialog`, letzten Tag entfernen; Zeilenmenü „Bearbeiten",
   Dialog mit Escape schließen) plus dem Anlaßfall aus T-072 („Als Spalte aufnehmen").
3. **Der `focusout`-Anlass holt den Fokus auch dann zurück, wenn jemand auf eine leere Stelle im
   Dialog klickt.** Das ist wörtlich das Verhalten von T-072 bis T-152 und war nie beanstandet —
   es ist trotzdem eine Rückkehr und keine Neuerung, und visual-qa soll es sehen.
4. **O-CR ändert eine sichtbare Beschriftung.** Ein Verweis ohne Titel zeigt jetzt den Wirtsnamen
   statt Wirt und Pfad. Die volle Adresse steht weiterhin in der zweiten Zeile derselben Zeile, die
   Prüfreihen bleiben grün — aber es ist weniger Auskunft an der Stelle, an die man zuerst schaut.
   Siehe offene Frage 1.
5. **`MutationObserver` je offenem Dialog.** Ein Beobachter, `childList` und `subtree`, nur während
   der Dialog steht, abgemeldet in der Aufräumfunktion. Kein Zeitgeber im Leerlauf.
6. **Das Dashboard stellt jetzt um Mitternacht eine neue Abfrage.** Gewollt (die Kacheln behaupten
   „heute"), aber es ist ein Lauf, den es vorher nicht gab. Derselbe Satz gilt für die Todo-Liste.

---

## Offene Fragen

1. **An spec-ux-reviewer (aus O-CR):** Ist `beispiel.example` die richtige Beschriftung für einen
   Verweis ohne Titel, oder soll dort `beispiel.example/ordner/erste-seite` stehen? Ich halte die
   längere für die nützlichere — sie unterscheidet zwei Anhänge auf demselben Wirt, und genau das
   ist der Regelfall bei Ticketadressen. **Wenn ja, wird sie in `packages/domain` geändert, nicht
   hier** (Auftrag von T-157 wörtlich). Dann bräuchte domain-dev eine Aufgabe. Bis dahin gilt die
   Domäne.
2. **An den Orchestrator (aus O-CU):** Soll die Rückfrage sagen, **dass** der Name anders aufgelöst
   wird? Heute steht bei `rechnung.exe.` der rohe Name auf dem Bildschirm und darunter „Eine Datei
   mit der Endung „exe" …". Das ist richtig, aber es erklärt sich nicht. Ein Satz wie „Der Name
   endet auf einen Punkt; Windows lässt ihn beim Öffnen weg und startet `rechnung.exe`." wäre
   ehrlicher. Ich habe ihn **nicht** geschrieben: neuer deutscher Text vor einem Programmstart ist
   spec-ux-Fläche, und der Auftrag verlangt ihn nicht.
3. **An spec-ux-reviewer (aus O-CO):** `TimeScreen.tsx:66` trägt dasselbe eingefrorene
   `useMemo(() => todayCalendarDay(), [])`. Es steht **nicht** im Befund, und ich habe es deshalb
   gelassen — dort setzt der Tag vermutlich einen Filtervorschlag („letzte 7 Tage"), und ein Filter,
   der sich um Mitternacht unter dem Blick des Benutzers verschiebt, wäre eine Verschlechterung.
   Bitte einmal ansehen und entscheiden: derselbe Fund oder ausdrücklich nicht?
4. **An unit-tester:** Die Fallliste oben ist als Vorschlag gemeint, nicht als Vorgabe. Wenn
   `#[cfg(windows)]`-Fälle in der Reihe nicht laufen können, ist der Fall `…/.lnk` der billigste
   Ersatz — er misst dieselbe Abweichung von `Path::extension()` auf jedem Läufer.

---

## Nächster Schritt

**visual-qa** in der nächsten Welle, mit drei benannten Messpunkten statt einer allgemeinen
Durchsicht:

1. `PoolFormDialog`, letzten Tag über den Chip-Knopf entfernen → `document.activeElement` muss das
   **erste Feld** des Dialogs sein, nicht `<body>` (Gegenprobe zu Abzug 23b).
2. Todo-Liste, Zeilenmenü „Bearbeiten" → Dialog mit Escape schließen → Fokus muss auf dem
   **Menü-Auslöser** stehen (Gegenprobe zu O-CY). Dazu dieselbe Messung über „Löschen", damit der
   Bestätigungsdialog mitgemessen ist.
3. Board, Dialog „Spalten des Boards", „Als Spalte aufnehmen" → Fokus bleibt im Dialog
   (Anlaßfall T-072, seit T-152 unbeobachtet).
4. Nebenbei: `FormDialog` im Zustand „Wird gespeichert" — das Schließkreuz muss jetzt gesperrt
   sein, mit Maus **und** mit Tabulator+Eingabe.
5. Musterseite bei 380 px — die Seitenleiste darf den Inhalt nicht mehr überlagern.

Parallel dazu **unit-tester** mit der Fallliste aus Abschnitt 1 (A-A-25, T-156-2), und
**security-checker** mit den beiden verbliebenen Windows-Namensfragen aus Risiko 1.
