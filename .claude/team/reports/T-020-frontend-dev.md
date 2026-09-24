Aufgabe: T-020 — Die drei Hüllenzustände sichtbar machen

Status: fertig

---

Artefakte:

Neu:

```
apps/web/src/components/ShellStatus.tsx      Zustandsform, startupProblems(), drei Bausteine
apps/web/src/lib/focus.ts                    Fokusauswahl und Tabulatorschleife, geteilt
apps/web/src/showcase/ShellStateSection.tsx  Abschnitt 10 der Musterseite
```

Geändert:

```
apps/web/src/styles/components.css      neuer Block "Huellenzustaende beim Start", 227 Zeilen
apps/web/scripts/contrast-check.mjs     16 neue Paare in drei Gruppen (75 → 91 Paare je Modus)
apps/web/src/components/ConfirmDialog.tsx  benutzt lib/focus.ts statt eigener Kopie
apps/web/src/showcase/Showcase.tsx      Abschnitt eingehängt, Navigation ergänzt
apps/web/src/showcase/InventorySection.tsx  Nummer 10 → 11
apps/web/design/DESIGNSYSTEM.md         neuer Abschnitt 9, Inventar, neue Regel 9
apps/web/README.md                      fünfte Substanzstelle
apps/desktop/src/shell.ts               drei Stellen dokumentiert, darunter eine benannte Lücke
```

Nicht angefasst: `apps/desktop/src-tauri/**` (kein Anlass — siehe Annahme 2 und offene Frage 1),
`packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `apps/web/test/**`, die
Wurzeldateien, `docs/**`, `.claude/team/**` außer diesem Bericht. Nichts installiert. Kein
`git commit`.

---

Zusammenfassung:

Die drei Zustände, die `shellState()` seit T-008b bereithält, haben jetzt eine Darstellung, und
sie ist nach Dringlichkeit gestuft: `serviceExit` sperrt die Anwendung mit einem Dialog, der
keinen Ausgang außer „Takt beenden" hat, `problems` steht als Fehlerband über der Ansicht, und
`directory.syncWarning` bleibt als ruhiger Dauerhinweis stehen. Keiner der drei lässt sich
wegklicken, weil keiner durch Wegklicken aufhört zu gelten. Auf der Musterseite ist jeder
Zustand einzeln und in Kombination einschaltbar — Abschnitt 10, mit Zustandsmatrix.

Beim Bauen ist ein Befund aufgefallen, der ohne die Anzeige nicht sichtbar war: **Die
Ordnerwarnung steht in der Hülle zweimal.** `lib.rs` legt `directory.sync_warning` zusätzlich in
`problems` ab. Unbesehen übernommen stünde sie zweimal auf dem Bildschirm, einmal davon unter der
Überschrift „Takt ist nicht vollständig gestartet" — die für sie zu laut ist, denn Takt läuft, der
Ordner liegt nur falsch. `startupProblems()` filtert die Dopplung heraus; die Musterseite belegt
es (Schalter „Datenordner" allein erzeugt kein Fehlerband).

Der zweite Befund wiegt schwerer und ist eine Lücke, keine Doppelung: **Die Hülle meldet den
Ausfall des Dienstes nicht.** `sidecar.rs` schreibt den Grund über `note_exit()` in den Zustand
und sendet kein Ereignis an den Webview. Die Sperrmeldung ist damit so aktuell wie der letzte
Abruf von `shellState()`. Das ist heute folgenlos, weil es noch keine verdrahtete
Anwendungshülle gibt — es wird folgenreich in dem Moment, in dem es sie gibt. Ich habe die Stelle
in `shell.ts` benannt und die Rust-Seite nicht angefasst (offene Frage 1).

`pnpm contrast` läuft mit 182 Paaren fehlerfrei durch, `pnpm typecheck` und der Bau von
`apps/web` ebenfalls. Die Kette `pnpm build` an der Wurzel bricht ab — in `apps/outlook-addin`,
das der integration-dev in dieser Welle gerade anlegt und das noch nicht typprüft. Beleg unten.

---

Annahmen:

1. **Genau ein Zustand sperrt die Anwendung, und es ist der Ausfall des Dienstes.** Ohne den
   lokalen Dienst schreibt Takt nichts mehr auf die Platte; das ist der einzige Zustand des
   Produkts, in dem Weiterarbeiten Datenverlust bedeutet. Für `problems` wäre eine Sperre falsch:
   Derselbe Kanal trägt „die Zugriffsrechte konnten nicht gesetzt werden" — damit lässt sich
   arbeiten — und „der Dienst wurde nicht gestartet" — damit nicht. Die Hülle unterscheidet die
   beiden Fälle nicht, und ich habe die Unterscheidung nicht erfunden, sondern die Form gewählt,
   die in beiden Fällen richtig ist: ein Band, das dauerhaft steht und die Sätze der Hülle
   ungekürzt zeigt.

2. **Kein Eingriff in `src-tauri/**`.** Beide Befunde oben ließen sich dort beheben — die
   Doppelung mit einer gelöschten Zeile, die fehlende Meldung mit einem `emit`. Ich habe es
   gelassen: Die Anzeige verlangt es nicht zwingend (die Doppelung fange ich ab, und eine
   Anwendungshülle, die auf ein Ereignis hören könnte, gibt es noch nicht), und der Rust-Anteil
   ist geprüft und mit 17 Tests belegt. Beides steht unten als offene Frage mit der genauen
   Stelle.

3. **Die Sätze der Hülle gehen unverändert auf den Bildschirm.** Sie sind die einzige Auskunft,
   die der Benutzer weitergeben kann. Zwei von ihnen sprechen Fachsprache — „WAL-Dateien" im
   Ordnerhinweis, „Port 17843" im Sperrdialog. Ich habe sie nicht ersetzt, sondern unmittelbar
   darunter in eigenen Worten erklärt, was sie bedeuten. Eine Oberfläche, die eine
   Diagnosemeldung durch ihre eigene Paraphrase ersetzt, nimmt der Systembetreuung den einen
   Satz, mit dem sie etwas anfangen kann. Der Wortlaut gehört dorthin, wo er entsteht
   (offene Frage 2).

4. **Die Zustandsform steht in `apps/web` ein zweites Mal.** `apps/web` hängt nicht von
   `@takt/desktop` ab, und ich durfte in dieser Welle nichts installieren. Die Schnittstellen in
   `ShellStatus.tsx` sind deshalb ein **Ausschnitt** von `ShellState` — jedes Feld mit demselben
   Namen und Typ, sodass `ShellState` ohne Umweg zuweisbar ist und ein entfallenes Feld an der
   Aufrufstelle bricht. Sobald die Abhängigkeit erlaubt ist, fällt der Ausschnitt ersatzlos weg
   (offene Frage 3).

5. **`onQuit` ist Pflicht, nicht Kür.** Ein modaler Dialog ohne bedienbaren Ausgang ist eine
   Tastaturfalle (SC 2.1.2). Der Typ erzwingt deshalb, dass der Aufrufer den Weg hinaus mitgibt;
   ein optionaler Rückruf hätte genau den Fall zugelassen, den die Prüfung fangen soll.

6. **Der neue Abschnitt steht als Nummer 10 vor dem Komponenteninventar**, das damit 11 wird.
   Die Alternative — hinten anhängen — hätte einen Sachabschnitt hinter das abschließende
   Inventar gestellt. Vorne einzufügen hätte zehn Nummern und vier Querverweise verschoben; die
   Querverweise reichen bis „Abschnitt 7" und bleiben so unberührt.

---

Der Nachweis, im Einzelnen

**Die drei Zustände, gemessen an der gebauten Fassung** (`vite preview`, Chromium 1234, Abschnitt
10 der Musterseite):

```
Leerzustand sichtbar: true
Baender im Leerzustand: 0
Nur Datenordner -> Startmeldungen sichtbar: 0      ← die Dopplung ist gefiltert
Fokus nach Oeffnen: BUTTON:Takt beenden
Dialog nach Escape noch da: 1                      ← Escape schliesst nicht
Fokus nach 4x Tab noch im Dialog: true             ← Tabulatorschleife haelt
Dialog nach Beenden weg: true                      ← der eine Ausgang wirkt
Rollen: [{"role":"alert","live":"assertive"},{"role":"status","live":"polite"}]
```

Die Zeile „Nur Datenordner → 0" ist der Beleg für `startupProblems()`: Die Hülle liefert die
Ordnerwarnung in beiden Feldern, und trotzdem entsteht kein Fehlerband.

**Tastaturweg durch den Abschnitt**, wörtlich, ab dem ersten Schalter:

```
BUTTON.filter-toggle — Der Datenordner liegt in einem Synchronisierun
BUTTON.filter-toggle — Der lokale Dienst hat sich beendetsperrt die A
SELECT.select__input — Der Port ist belegt (Code 74)Unerwartet beende
BODY.                — (Dokumentende)
A.skip-link          — Zum Inhalt springen
```

Der Fokusring am Knopf „Takt beenden" ist geprüft, nicht behauptet: `:focus-visible` meldet
`true`, nachdem der Knopf über den Tabulator erreicht wurde, und der Ring liegt außerhalb des
Elements.

**Ein Fund aus dieser Prüfung, den ich nicht unterschlage.** Die Auswahl „Grund des Ausfalls"
war zunächst nur sichtbar, solange die Sperrmeldung stand — und war damit unerreichbar, weil die
Sperrmeldung den Rest der Seite abdeckt. Der Playwright-Lauf ist daran hängengeblieben. Die
Auswahl steht jetzt dauerhaft; der Grund steht als Kommentar daneben.

**Die drei neuen Flächen in beiden Farbmodi und in beiden Dichten** sind als Bilder abgenommen:
Fehlerband und Warnband nebeneinander (hell und dunkel), der Sperrdialog mit und ohne
Beendigungscode (hell und dunkel), der Fokusring, die kompakte Dichte. Ohne Beendigungscode
rutschte der Knopf zunächst nach links, weil die Fußzeile mit `space-between` arbeitete; jetzt
schiebt die Fußnote und nicht die Fußzeile.

**`pnpm contrast`** — wörtlich, 16 neue Paare in drei Gruppen, vollständige Ausgabe am Ende
dieses Berichts:

```
0 von 182 Paaren durchgefallen.
```

Vorher waren es 150 Paare. Das knappste neue Paar ist `--border-control` auf
`--danger-bg-subtle` mit 3,13:1 im hellen Modus gegen die geforderten 3,0 — die Grenze des
Sekundärknopfes auf der getönten Fehlerfläche (SC 1.4.11). Es geht durch, aber es ist die Stelle,
an der eine spätere Farbänderung zuerst kippt.

**`pnpm typecheck`** — die Kette bricht in `apps/outlook-addin` ab, das der integration-dev in
dieser Welle anlegt und das noch nicht typprüft. Die Datei ist im Arbeitsbereich nicht einmal
eingecheckt:

```
$ git status --porcelain apps/outlook-addin
?? apps/outlook-addin/

$ pnpm --filter @takt/outlook-addin typecheck
src/api/client.ts(176,54): error TS2769: No overload matches this call.
  ... 'body' is incompatible: Type 'string | undefined' is not assignable to type 'BodyInit | null'
src/api/client.ts(200,7): error TS2322: ... 'details' are incompatible
```

Alles Übrige läuft durch, einzeln belegt:

```
npx tsc -p tsconfig.json --noEmit          ROOT ok
pnpm --filter @takt/web typecheck          Exitcode 0
pnpm --filter @takt/desktop typecheck      Exitcode 0
pnpm --filter @takt/domain typecheck       Exitcode 0
pnpm --filter @takt/storage typecheck      Exitcode 0
pnpm --filter @takt/local-api typecheck    Exitcode 0
pnpm --filter @takt/export typecheck       Exitcode 0
pnpm boundaries                            Exitcode 0, Notiz-Trennung unverletzt
```

**`pnpm build`** — derselbe Grund, dieselbe Stelle. `pnpm -r` bricht die parallelen Bauten ab,
sobald einer scheitert; der Bau von `apps/web` kam deshalb im Sammellauf nicht zu Ende. Einzeln:

```
$ pnpm --filter @takt/web build
$ tsc -p tsconfig.json --noEmit && vite build
✓ 64 modules transformed.
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-BRDQzQSU.css   64.16 kB │ gzip:  10.69 kB
dist/assets/index-zrpto7tQ.js   327.45 kB │ gzip: 100.13 kB │ map: 1,300.06 kB
✓ built in 808ms
EXIT=0
```

**Was ich nicht gebaut habe und warum:** Es gibt noch keine Anwendungshülle, in die `ShellStatus`
eingehängt werden könnte — `apps/web` ist bis heute die Musterseite und sonst nichts. Der
Baustein ist deshalb dort abnehmbar und nirgends verdrahtet. Die Verdrahtung ist drei Zeilen und
gehört in die Aufgabe, die die Navigation aus Abschnitt 14 baut.

---

Risiken:

1. **Die Sperrmeldung erscheint nur, wenn jemand `shellState()` erneut abruft.** Die Hülle sendet
   beim Ende des Dienstes kein Ereignis (`sidecar.rs`, `CommandEvent::Terminated` →
   `note_exit()`). Ohne Ereignis oder regelmäßigen Abruf sieht der Benutzer die Sperre erst, wenn
   ihn ohnehin schon etwas anderes gestört hat — und genau die Minuten davor sind die, in denen
   er seine Zeit verliert. Die Stelle ist in `shell.ts` benannt. **Das ist das Wichtigste an
   diesem Bericht.**

2. **Die Zustandsform steht zweimal** (Annahme 4). Wer `ShellState` in `apps/desktop/src/shell.ts`
   um ein Feld erweitert, merkt in `apps/web` nichts davon. Der umgekehrte Fall — ein Feld fällt
   weg oder wechselt den Typ — bricht an der Aufrufstelle, sobald es eine gibt. Heute gibt es
   keine, also fängt der Übersetzer heute nichts.

3. **Der Filter gegen die Dopplung hängt an Zeichenkettengleichheit.** Er trägt, weil `lib.rs`
   dieselbe Zeichenkette klont. Setzte jemand dort ein Präfix davor, stünde die Warnung wieder
   zweimal. Sauber wäre, sie in `lib.rs` gar nicht erst zu duplizieren (offene Frage 1).

4. **`aria-modal` ist eine Zusage, keine Durchsetzung.** Der Inhalt hinter der Abdunklung ist
   nicht `inert`; ein Bildschirmleser, der `aria-modal` ignoriert, kann dorthin wandern. Das ist
   dieselbe Grenze, die der Bestätigungsdialog seit T-006 hat, und keine neue. Der saubere Weg
   wäre das native `dialog`-Element mit `showModal()` — das wäre ein Umbau beider Dialoge und
   gehört in eine eigene Aufgabe.

5. **Zwei Sätze der Hülle sprechen Fachsprache** (Annahme 3). „WAL-Dateien" und „Port 17843"
   stehen wörtlich auf dem Bildschirm. Die Erklärung darunter fängt es ab, aber der erste Satz,
   den der Benutzer liest, ist einer, den er nicht versteht.

6. **Die Startmeldung nimmt Höhe weg und geht nicht mehr fort.** Bei zwei Meldungen sind es rund
   330 Pixel über der Ansicht. Das ist gewollt — der Zustand hört nicht auf zu gelten — aber auf
   einem kleinen Bildschirm bleibt darunter wenig übrig. Wer die Anwendungshülle baut, sollte den
   Fall mit drei Meldungen einmal ansehen, bevor er ihn beim Auftraggeber sieht.

---

Offene Fragen:

1. **An den Orchestrator: Soll die Rust-Seite zwei kleine Änderungen bekommen?** Beide sind je
   zwei Zeilen, beide betreffen `src-tauri/**`, das ich nicht angefasst habe.

   a) **`sidecar.rs` meldet das Ende des Dienstes.** Ein `handle.emit("takt://dienst-beendet",
      &reason)` neben dem vorhandenen `note_exit(reason)`, dazu ein vierter Eintrag in
      `SHELL_EVENTS`. Ohne das ist die Sperrmeldung so aktuell wie der letzte Abruf (Risiko 1).
      Die Alternative — ein Abruf im Sekundentakt aus der Oberfläche — kostet dauerhaft für einen
      Fall, der fast nie eintritt.

   b) **`lib.rs` legt `sync_warning` nicht mehr zusätzlich in `problems`.** Eine gelöschte Zeile.
      Die Warnung hat jetzt einen eigenen Ort; die Doppelablage war die Absicherung dagegen, dass
      sie nirgends erscheint, und diese Absicherung ist erfüllt. Solange sie steht, hängt die
      Sauberkeit der Anzeige an meinem Filter (Risiko 3).

2. **An den Orchestrator, weiterzureichen an den, der `src-tauri` hält: Wortlaut zweier
   Meldungen.** „Kopierte WAL-Dateien beschädigen die Datenbank" und „Der Port 17843 ist belegt"
   sind für die Systembetreuung genau richtig und für den Anwender zwei Fremdwörter. Ein Vorschlag,
   der beides behält: den Fachbegriff in einen Nebensatz stellen — „Die Datenbank kann dabei
   beschädigt werden, weil ihre Begleitdateien einzeln kopiert werden." Die Entscheidung ist eine
   Textentscheidung und keine Umsetzungsfrage; ich habe sie nicht getroffen, weil die Datei nicht
   meine ist.

3. **An den Orchestrator: Darf `apps/web` von `@takt/desktop` abhängen?** Dann fällt der
   Ausschnitt in `ShellStatus.tsx` ersatzlos weg und der Übersetzer prüft die Zuordnung. Dagegen
   spricht, dass `@takt/desktop` `@tauri-apps/api` zieht und die Musterseite auch ohne
   Tauri-Laufzeit läuft — das trägt nur, solange nur Typen importiert werden
   (`import type { ShellState }`), was `verbatimModuleSyntax` erzwingbar macht. Braucht einen
   `pnpm install`, den ich in dieser Welle nicht durchführen durfte.

4. **An den Auftraggeber, über den Orchestrator: Was steht in „Wenden Sie sich an Ihre
   Systembetreuung"?** Beide Bänder und der Sperrdialog verweisen darauf. In einem Betrieb mit
   Systembetreuung ist das richtig; arbeitet der Auftraggeber allein, ist es eine Sackgasse. Eine
   Telefonnummer, eine Adresse oder ein Satz „wenden Sie sich an den Hersteller" wäre die
   Alternative — das ist eine Angabe, die ich nicht erfinden kann.

---

Nächster Schritt:

1. **Der Orchestrator entscheidet offene Frage 1a**, und zwar bevor die Anwendungshülle gebaut
   wird. Danach ist es ein Ereignis, auf das die Oberfläche von Anfang an hört; davor ist es eine
   Nachrüstung an einer laufenden Anzeige.

2. **Wer die Navigation aus Abschnitt 14 baut, hängt `ShellStatus` ganz oben ein** — vor
   Navigation und Inhalt, damit ein Bildschirmleser die Meldung in der Lesereihenfolge zuerst
   trifft:

   ```tsx
   const [shell, setShell] = useState<ShellState | null>(null);
   useEffect(() => { void shellState().then(setShell); }, []);
   ...
   {shell !== null ? <ShellStatus state={shell} onQuit={() => void quit()} /> : null}
   ```

   `ShellState` ist dem Ausschnitt ohne Umweg zuweisbar. `onQuit` ruft `quit()` direkt: Im
   Sperrfall gibt es keinen laufenden Timer mehr, den E-036 klären müsste — der Dienst, der ihn
   geführt hätte, ist weg. Der Grund steht an `quit()` im Quelltext.

3. **Der e2e-tester bekommt drei Fälle**, die heute nur die Musterseite zeigt: Escape schließt die
   Sperrmeldung nicht; der Tabulator verlässt sie nicht; „Datenordner allein" erzeugt kein
   Fehlerband. Der dritte ist der, der still bricht, wenn jemand `startupProblems()` umgeht.

4. **Der security-checker hat eine Fläche weniger zu prüfen, als er denken könnte:** Der
   Benutzername kommt in diesen Bausteinen nicht vor. `ShellStatus.tsx` ruft `osUser()` nicht auf
   und nimmt keinen Namen entgegen; die Prüfung der Hülle
   (`steuerzeichen_im_namen_werden_abgewiesen`) bleibt damit auch auf dem Bildschirm gültig. Was
   er prüfen sollte: dass keine spätere Ansicht den Namen in eine Fehlermeldung schreibt.

---

## Anhang — `pnpm contrast`, wörtlich (Stand T-020, 182 Paare)

Der Stand nach dem Nachtrag T-020b sind 194 Paare; die sechs neuen sind dort einzeln aufgeführt.

```
$ pnpm --filter @takt/web contrast
$ node scripts/contrast-check.mjs

== Modus hell ==
OK    14.80:1 (min 4.5:1)  --text-primary auf --bg-canvas  — Standardtext auf Anwendungshintergrund
OK    15.76:1 (min 4.5:1)  --text-primary auf --bg-surface  — Standardtext auf Karte
OK    14.03:1 (min 4.5:1)  --text-primary auf --bg-subtle  — Tabellenkopf
OK    14.03:1 (min 4.5:1)  --text-primary auf --bg-hover  — Zeile unter dem Zeiger
OK    14.27:1 (min 4.5:1)  --text-primary auf --bg-selected  — ausgewaehlte Zeile
OK     8.39:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Sekundaertext
OK     5.64:1 (min 4.5:1)  --text-muted auf --bg-surface  — Hilfetext, Platzhalter
OK     5.30:1 (min 4.5:1)  --text-muted auf --bg-canvas  — Hilfetext auf Hintergrund
OK     5.02:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Spaltenueberschrift
OK     3.10:1 (min 3.0:1)  --text-disabled auf --bg-disabled  — deaktiviert, ausgenommen nach SC 1.4.3
OK     8.16:1 (min 4.5:1)  --text-link auf --bg-surface  — Verweis
OK     7.88:1 (min 4.5:1)  --text-secondary auf --bg-canvas  — Einleitungstext auf Hintergrund
OK     7.66:1 (min 4.5:1)  --accent-text auf --bg-canvas  — hervorgehobener Navigationseintrag
OK    14.27:1 (min 4.5:1)  --text-primary auf --accent-bg-subtle  — Text im Entscheidungskasten
OK     5.98:1 (min 4.5:1)  --text-on-accent auf --accent-bg  — Primaerknopf
OK     8.16:1 (min 4.5:1)  --text-on-accent auf --accent-bg-hover  — Primaerknopf unter dem Zeiger
OK    10.55:1 (min 4.5:1)  --text-on-accent auf --accent-bg-active  — Primaerknopf gedrueckt
OK     8.16:1 (min 4.5:1)  --accent-text auf --bg-surface  — Textknopf, aktiver Navigationseintrag
OK     7.39:1 (min 4.5:1)  --accent-text auf --accent-bg-subtle  — Textknopf auf Akzentflaeche
OK     6.75:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — destruktiver Knopf
OK     6.07:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Fehlertext im Hinweis
OK     6.75:1 (min 4.5:1)  --danger-text auf --bg-surface  — Fehlertext am Feld
OK     7.50:1 (min 4.5:1)  --status-open-fg auf --status-open-bg  — Etikett Offen
OK     3.95:1 (min 3.0:1)  --status-open-border auf --bg-surface  — Kontur Offen, SC 1.4.11
OK     5.80:1 (min 3.0:1)  --status-open-marker auf --bg-surface  — Zeilenmarker Offen
OK     6.50:1 (min 4.5:1)  --status-exported-fg auf --status-exported-bg  — Etikett Exportiert
OK     6.50:1 (min 3.0:1)  --status-exported-bg auf --bg-surface  — Flaeche Exportiert gegen Karte
OK     5.89:1 (min 3.0:1)  --status-exported-marker auf --status-exported-tint  — Marker auf getoenter Zeile
OK    14.27:1 (min 4.5:1)  --text-primary auf --status-exported-tint  — Zeilentext auf getoenter Zeile
OK     8.10:1 (min 4.5:1)  --status-reopened-fg auf --status-reopened-bg  — Etikett Erneut offen
OK     3.62:1 (min 3.0:1)  --status-reopened-border auf --bg-surface  — Kontur Erneut offen
OK     6.75:1 (min 3.0:1)  --status-reopened-marker auf --bg-surface  — Zeilenmarker Erneut offen
OK     9.28:1 (min 4.5:1)  --timer-running-fg auf --timer-running-bg  — laufender Timer
OK     5.34:1 (min 3.0:1)  --timer-running-pulse auf --timer-running-bg  — Pulspunkt
OK     5.02:1 (min 4.5:1)  --timer-idle-fg auf --timer-idle-bg  — Timer angehalten
OK     7.39:1 (min 4.5:1)  --info-fg auf --info-bg  — Information
OK     5.89:1 (min 4.5:1)  --success-fg auf --success-bg  — Erfolg
OK     7.50:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Warnung
OK     9.56:1 (min 4.5:1)  --note-billing-header-fg auf --note-billing-header-bg  — Kopfband Leistung
OK     5.98:1 (min 3.0:1)  --note-billing-rail auf --bg-surface  — Randschiene Leistung, heller Streifen
OK    10.55:1 (min 3.0:1)  --note-billing-rail-stripe auf --bg-surface  — Randschiene Leistung, dunkler Streifen
OK     7.47:1 (min 4.5:1)  --note-internal-header-fg auf --note-internal-header-bg  — Kopfband Vermerk
OK     3.49:1 (min 3.0:1)  --note-internal-rail auf --bg-surface  — Randschiene Vermerk
OK    14.80:1 (min 4.5:1)  --text-primary auf --note-internal-bg  — Text im Vermerkfeld
OK     5.98:1 (min 4.5:1)  --text-on-accent auf --accent-bg  — Marke vor der Beschriftung Leistung
OK     5.30:1 (min 3.0:1)  --border-strong auf --note-internal-bg  — Kontur der Marke vor Vermerk
OK     5.30:1 (min 4.5:1)  --text-muted auf --note-internal-bg  — Symbol in der Marke vor Vermerk
OK     5.89:1 (min 4.5:1)  --success-fg auf --success-bg  — Kennzeichen Erledigt
OK     6.50:1 (min 3.0:1)  --success-fg auf --bg-surface  — Kontur Kennzeichen Erledigt
OK     5.64:1 (min 4.5:1)  --text-muted auf --bg-surface  — Kennzeichen Offen
OK     6.81:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Kennzeichen Erledigt aufgehoben
OK     4.58:1 (min 3.0:1)  --border-strong auf --bg-inset  — gestrichelte Kontur Erledigt aufgehoben
OK     5.79:1 (min 4.5:1)  --success-fg auf --bg-subtle  — Zaehler erledigter Todos im Spaltenkopf
OK     5.02:1 (min 4.5:1)  --text-muted auf --timer-running-bg  — Fussnote im Wiederaufnahme-Hinweis
OK    14.27:1 (min 4.5:1)  --text-primary auf --bg-selected  — Titel einer ausgewaehlten Tagesgruppe
OK     7.60:1 (min 4.5:1)  --text-secondary auf --bg-selected  — zusammengefuehrte Leistung, ausgewaehlt
OK     5.11:1 (min 4.5:1)  --text-muted auf --bg-selected  — Kalendertag und Call, ausgewaehlt
OK    15.34:1 (min 4.5:1)  --text-primary auf --bg-surface-alt  — Zeitraum einer Einzelbuchung
OK     8.17:1 (min 4.5:1)  --text-secondary auf --bg-surface-alt  — Dauer und Leistung einer Einzelbuchung
OK     5.49:1 (min 4.5:1)  --text-muted auf --bg-surface-alt  — Herkunft einer Einzelbuchung
OK     5.02:1 (min 4.5:1)  --text-muted auf --bg-disabled  — ausgeschlossene Buchung, durchgestrichen
OK    14.54:1 (min 4.5:1)  --text-primary auf --warning-bg  — Titel einer nicht exportierbaren Gruppe
OK     5.20:1 (min 4.5:1)  --text-muted auf --warning-bg  — gedaempfte Zeit einer gesperrten Gruppe
OK     7.50:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Sperrgrund nach E-034
OK     5.11:1 (min 4.5:1)  --text-muted auf --accent-bg-subtle  — Zusatz unter der Beschriftung, Schalter ein
OK     5.98:1 (min 3.0:1)  --accent-bg auf --bg-surface  — Schienenfarbe des Schalters, SC 1.4.11
OK     8.16:1 (min 4.5:1)  --accent-text auf --bg-surface  — Haken im Knauf, Schalter ein
OK    14.17:1 (min 4.5:1)  --text-primary auf --danger-bg-subtle  — Ueberschrift und Meldungsliste der Startmeldung
OK     7.55:1 (min 4.5:1)  --text-secondary auf --danger-bg-subtle  — Erklaerung und Handlungsanweisung
OK     6.07:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Zwischenueberschrift Was Sie tun koennen
OK     6.75:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — Symbol der Startmeldung
OK     6.07:1 (min 3.0:1)  --danger-bg auf --danger-bg-subtle  — Randschiene der Startmeldung, SC 1.4.11
OK     3.13:1 (min 3.0:1)  --border-control auf --danger-bg-subtle  — Knopf Takt beenden in der Startmeldung, SC 1.4.11
OK     8.39:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Erklaerung und Schritte im Sperrdialog
OK     6.07:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Grund aus der Huelle im Sperrdialog
OK    12.79:1 (min 4.5:1)  --text-primary auf --bg-inset  — Schrittnummer im Sperrdialog
OK     5.02:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Beendigungscode in der Fusszeile
OK     6.75:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — Knopf Takt beenden im Sperrdialog
OK    14.54:1 (min 4.5:1)  --text-primary auf --warning-bg  — Ueberschrift des Datenordner-Hinweises
OK     7.74:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Befund der Huelle und Erklaerung
OK     7.50:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Zwischenueberschriften des Hinweises
OK     7.50:1 (min 4.5:1)  --warning-bg auf --warning-fg  — Symbol des Hinweises, gefuellte Flaeche
OK     5.20:1 (min 4.5:1)  --text-muted auf --warning-bg  — Fussnote Takt arbeitet weiter
----   1.23:1 (min —)  --border-subtle auf --bg-surface  — Trennlinie, rein dekorativ
----   1.46:1 (min —)  --border-default auf --bg-surface  — Kartenumriss, rein dekorativ
OK     3.49:1 (min 3.0:1)  --border-control auf --bg-surface  — Grenze eines Bedienelements, SC 1.4.11
OK     3.10:1 (min 3.0:1)  --border-control auf --bg-subtle  — Bedienelement in der Werkzeugleiste
OK     5.64:1 (min 3.0:1)  --border-strong auf --bg-surface  — Bedienelement unter dem Zeiger
OK     5.98:1 (min 3.0:1)  --focus-ring-color auf --bg-surface  — Fokusring auf Karte
OK     5.62:1 (min 3.0:1)  --focus-ring-color auf --bg-canvas  — Fokusring auf Hintergrund
OK     5.33:1 (min 3.0:1)  --focus-ring-color auf --bg-subtle  — Fokusring in Werkzeugleiste

== Modus dunkel ==
OK    15.92:1 (min 4.5:1)  --text-primary auf --bg-canvas  — Standardtext auf Anwendungshintergrund
OK    14.64:1 (min 4.5:1)  --text-primary auf --bg-surface  — Standardtext auf Karte
OK    13.39:1 (min 4.5:1)  --text-primary auf --bg-subtle  — Tabellenkopf
OK    12.24:1 (min 4.5:1)  --text-primary auf --bg-hover  — Zeile unter dem Zeiger
OK    12.31:1 (min 4.5:1)  --text-primary auf --bg-selected  — ausgewaehlte Zeile
OK     9.76:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Sekundaertext
OK     6.74:1 (min 4.5:1)  --text-muted auf --bg-surface  — Hilfetext, Platzhalter
OK     7.33:1 (min 4.5:1)  --text-muted auf --bg-canvas  — Hilfetext auf Hintergrund
OK     6.16:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Spaltenueberschrift
OK     3.70:1 (min 3.0:1)  --text-disabled auf --bg-disabled  — deaktiviert, ausgenommen nach SC 1.4.3
OK     8.34:1 (min 4.5:1)  --text-link auf --bg-surface  — Verweis
OK    10.61:1 (min 4.5:1)  --text-secondary auf --bg-canvas  — Einleitungstext auf Hintergrund
OK     9.07:1 (min 4.5:1)  --accent-text auf --bg-canvas  — hervorgehobener Navigationseintrag
OK    12.31:1 (min 4.5:1)  --text-primary auf --accent-bg-subtle  — Text im Entscheidungskasten
OK     6.26:1 (min 4.5:1)  --text-on-accent auf --accent-bg  — Primaerknopf
OK     9.23:1 (min 4.5:1)  --text-on-accent auf --accent-bg-hover  — Primaerknopf unter dem Zeiger
OK    12.44:1 (min 4.5:1)  --text-on-accent auf --accent-bg-active  — Primaerknopf gedrueckt
OK     8.34:1 (min 4.5:1)  --accent-text auf --bg-surface  — Textknopf, aktiver Navigationseintrag
OK     7.01:1 (min 4.5:1)  --accent-text auf --accent-bg-subtle  — Textknopf auf Akzentflaeche
OK     7.98:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — destruktiver Knopf
OK     6.78:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Fehlertext im Hinweis
OK     7.21:1 (min 4.5:1)  --danger-text auf --bg-surface  — Fehlertext am Feld
OK     8.29:1 (min 4.5:1)  --status-open-fg auf --status-open-bg  — Etikett Offen
OK     4.89:1 (min 3.0:1)  --status-open-border auf --bg-surface  — Kontur Offen, SC 1.4.11
OK     6.62:1 (min 3.0:1)  --status-open-marker auf --bg-surface  — Zeilenmarker Offen
OK     9.35:1 (min 4.5:1)  --status-exported-fg auf --status-exported-bg  — Etikett Exportiert
OK     8.44:1 (min 3.0:1)  --status-exported-bg auf --bg-surface  — Flaeche Exportiert gegen Karte
OK     7.50:1 (min 3.0:1)  --status-exported-marker auf --status-exported-tint  — Marker auf getoenter Zeile
OK    13.01:1 (min 4.5:1)  --text-primary auf --status-exported-tint  — Zeilentext auf getoenter Zeile
OK     7.10:1 (min 4.5:1)  --status-reopened-fg auf --status-reopened-bg  — Etikett Erneut offen
OK     3.52:1 (min 3.0:1)  --status-reopened-border auf --bg-surface  — Kontur Erneut offen
OK     4.74:1 (min 3.0:1)  --status-reopened-marker auf --bg-surface  — Zeilenmarker Erneut offen
OK     9.88:1 (min 4.5:1)  --timer-running-fg auf --timer-running-bg  — laufender Timer
OK     6.66:1 (min 3.0:1)  --timer-running-pulse auf --timer-running-bg  — Pulspunkt
OK     6.16:1 (min 4.5:1)  --timer-idle-fg auf --timer-idle-bg  — Timer angehalten
OK     7.01:1 (min 4.5:1)  --info-fg auf --info-bg  — Information
OK     7.50:1 (min 4.5:1)  --success-fg auf --success-bg  — Erfolg
OK     8.29:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Warnung
OK     9.45:1 (min 4.5:1)  --note-billing-header-fg auf --note-billing-header-bg  — Kopfband Leistung
OK     5.66:1 (min 3.0:1)  --note-billing-rail auf --bg-surface  — Randschiene Leistung, heller Streifen
OK    11.24:1 (min 3.0:1)  --note-billing-rail-stripe auf --bg-surface  — Randschiene Leistung, dunkler Streifen
OK     8.92:1 (min 4.5:1)  --note-internal-header-fg auf --note-internal-header-bg  — Kopfband Vermerk
OK     4.31:1 (min 3.0:1)  --note-internal-rail auf --bg-surface  — Randschiene Vermerk
OK    15.11:1 (min 4.5:1)  --text-primary auf --note-internal-bg  — Text im Vermerkfeld
OK     6.26:1 (min 4.5:1)  --text-on-accent auf --accent-bg  — Marke vor der Beschriftung Leistung
OK     6.06:1 (min 3.0:1)  --border-strong auf --note-internal-bg  — Kontur der Marke vor Vermerk
OK     6.96:1 (min 4.5:1)  --text-muted auf --note-internal-bg  — Symbol in der Marke vor Vermerk
OK     7.50:1 (min 4.5:1)  --success-fg auf --success-bg  — Kennzeichen Erledigt
OK     8.44:1 (min 3.0:1)  --success-fg auf --bg-surface  — Kontur Kennzeichen Erledigt
OK     6.74:1 (min 4.5:1)  --text-muted auf --bg-surface  — Kennzeichen Offen
OK    10.25:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Kennzeichen Erledigt aufgehoben
OK     6.17:1 (min 3.0:1)  --border-strong auf --bg-inset  — gestrichelte Kontur Erledigt aufgehoben
OK     7.72:1 (min 4.5:1)  --success-fg auf --bg-subtle  — Zaehler erledigter Todos im Spaltenkopf
OK     6.39:1 (min 4.5:1)  --text-muted auf --timer-running-bg  — Fussnote im Wiederaufnahme-Hinweis
OK    12.31:1 (min 4.5:1)  --text-primary auf --bg-selected  — Titel einer ausgewaehlten Tagesgruppe
OK     8.21:1 (min 4.5:1)  --text-secondary auf --bg-selected  — zusammengefuehrte Leistung, ausgewaehlt
OK     5.67:1 (min 4.5:1)  --text-muted auf --bg-selected  — Kalendertag und Call, ausgewaehlt
OK    13.85:1 (min 4.5:1)  --text-primary auf --bg-surface-alt  — Zeitraum einer Einzelbuchung
OK     9.23:1 (min 4.5:1)  --text-secondary auf --bg-surface-alt  — Dauer und Leistung einer Einzelbuchung
OK     6.38:1 (min 4.5:1)  --text-muted auf --bg-surface-alt  — Herkunft einer Einzelbuchung
OK     6.16:1 (min 4.5:1)  --text-muted auf --bg-disabled  — ausgeschlossene Buchung, durchgestrichen
OK    13.34:1 (min 4.5:1)  --text-primary auf --warning-bg  — Titel einer nicht exportierbaren Gruppe
OK     6.14:1 (min 4.5:1)  --text-muted auf --warning-bg  — gedaempfte Zeit einer gesperrten Gruppe
OK     8.29:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Sperrgrund nach E-034
OK     5.67:1 (min 4.5:1)  --text-muted auf --accent-bg-subtle  — Zusatz unter der Beschriftung, Schalter ein
OK     5.66:1 (min 3.0:1)  --accent-bg auf --bg-surface  — Schienenfarbe des Schalters, SC 1.4.11
OK     8.34:1 (min 4.5:1)  --accent-text auf --bg-surface  — Haken im Knauf, Schalter ein
OK    13.78:1 (min 4.5:1)  --text-primary auf --danger-bg-subtle  — Ueberschrift und Meldungsliste der Startmeldung
OK     9.19:1 (min 4.5:1)  --text-secondary auf --danger-bg-subtle  — Erklaerung und Handlungsanweisung
OK     6.78:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Zwischenueberschrift Was Sie tun koennen
OK     7.98:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — Symbol der Startmeldung
OK     6.78:1 (min 3.0:1)  --danger-bg auf --danger-bg-subtle  — Randschiene der Startmeldung, SC 1.4.11
OK     3.58:1 (min 3.0:1)  --border-control auf --danger-bg-subtle  — Knopf Takt beenden in der Startmeldung, SC 1.4.11
OK     9.76:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Erklaerung und Schritte im Sperrdialog
OK     6.78:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Grund aus der Huelle im Sperrdialog
OK    15.38:1 (min 4.5:1)  --text-primary auf --bg-inset  — Schrittnummer im Sperrdialog
OK     6.16:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Beendigungscode in der Fusszeile
OK     7.98:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — Knopf Takt beenden im Sperrdialog
OK    13.34:1 (min 4.5:1)  --text-primary auf --warning-bg  — Ueberschrift des Datenordner-Hinweises
OK     8.89:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Befund der Huelle und Erklaerung
OK     8.29:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Zwischenueberschriften des Hinweises
OK     8.29:1 (min 4.5:1)  --warning-bg auf --warning-fg  — Symbol des Hinweises, gefuellte Flaeche
OK     6.14:1 (min 4.5:1)  --text-muted auf --warning-bg  — Fussnote Takt arbeitet weiter
----   1.22:1 (min —)  --border-subtle auf --bg-surface  — Trennlinie, rein dekorativ
----   1.57:1 (min —)  --border-default auf --bg-surface  — Kartenumriss, rein dekorativ
OK     3.80:1 (min 3.0:1)  --border-control auf --bg-surface  — Grenze eines Bedienelements, SC 1.4.11
OK     3.47:1 (min 3.0:1)  --border-control auf --bg-subtle  — Bedienelement in der Werkzeugleiste
OK     5.88:1 (min 3.0:1)  --border-strong auf --bg-surface  — Bedienelement unter dem Zeiger
OK     8.34:1 (min 3.0:1)  --focus-ring-color auf --bg-surface  — Fokusring auf Karte
OK     9.07:1 (min 3.0:1)  --focus-ring-color auf --bg-canvas  — Fokusring auf Hintergrund
OK     7.62:1 (min 3.0:1)  --focus-ring-color auf --bg-subtle  — Fokusring in Werkzeugleiste

0 von 182 Paaren durchgefallen.
```

---

# Nachtrag — T-020b: die zwei Rust-Änderungen, der Wortlaut und die Abhängigkeit

Status: fertig

Auf Weisung des Orchestrators nach Abschluss von T-020. Meine offenen Fragen 1, 2 und 3 sind
damit beantwortet und umgesetzt; Frage 4 liegt beim Auftraggeber, der Satz bleibt bis dahin
stehen.

## Artefakte

Geändert, mit ausdrücklich erteilter Ausnahme von der Dateihoheit:

```
src-tauri/src/sidecar.rs    SERVICE_EXITED_EVENT, emit, ExitReason.detail,
                            explain_exit gibt jetzt ein Paar zurück, vier neue Tests
src-tauri/src/appdata.rs    SyncFinding, DirectoryReport.sync_detail, drei neue
                            Wortlaute, zwei neue Tests
src-tauri/src/lib.rs        die doppelte Ablage der Ordnerwarnung ist entfernt
```

Übrige Änderungen:

```
apps/desktop/src/shell.ts                    vierter SHELL_EVENTS-Eintrag, zwei neue
                                             Felder, die benannte Lücke ist geschlossen
apps/web/package.json                        @takt/desktop als Abhängigkeit
pnpm-lock.yaml                               Folge des Installs (siehe Anmerkung unten)
apps/web/src/components/ShellStatus.tsx      Typimport statt Nachbau, zwei Zusatzzeilen,
                                             zwei Textkorrekturen
apps/web/src/styles/components.css           .shellnote__handover, .servicestop__handover
apps/web/scripts/contrast-check.mjs          sechs neue Paare (182 → 194)
apps/web/src/showcase/ShellStateSection.tsx  getrennte Demodaten, zwei Hinweise neu
apps/web/design/DESIGNSYSTEM.md              Abschnitt 9 nachgezogen, T-020b-Block
apps/web/README.md                           ein Satz
```

**Anmerkung zu `pnpm-lock.yaml`:** Die Datei gehört dem Orchestrator. Ein `pnpm install` schreibt
sie zwangsläufig; die Änderung ist ein einziger Eintrag (`'@takt/desktop': link:../desktop` unter
`apps/web`). Ich melde sie, statt sie stillschweigend mitlaufen zu lassen.

## 1a — Die Hülle meldet den Ausfall

`sidecar.rs` sendet im `Terminated`-Zweig `takt://dienst-beendet` mit `ExitReason` als Nutzlast.
Die Reihenfolge ist zugesichert und im Quelltext begründet: **erst** `note_exit()`, **dann**
`emit`. Ein Empfänger, der auf das Ereignis hin sofort `takt_shell_state` abruft, muss den Grund
dort schon vorfinden — sonst meldete die Hülle einen Ausfall und beschriebe im selben Atemzug
eine Anwendung, der nichts fehlt.

**Der Name steht auf zwei Seiten, und das prüft jetzt jemand.** `SERVICE_EXITED_EVENT` in Rust
und `SHELL_EVENTS.serviceExited` in TypeScript müssen dieselbe Zeichenkette führen, und keine
der beiden Seiten merkt es, wenn die andere sich ändert. Der neue Test
`ereignisname_steht_auch_in_shell_ts` liest `apps/desktop/src/shell.ts` über `include_str!` zur
Übersetzungszeit ein und sucht die Zeichenkette darin. Verschiebt jemand die Datei, bricht der
Bau; benennt jemand das Ereignis um, fällt der Test.

**Der Laufzeitnachweis, und er hat beim ersten Versuch etwas anderes bewiesen.** Ich habe die
gebaute Anwendung gestartet, den Sidecar mit `kill -9` beendet und gemessen, was die Hülle
daraufhin tut:

```
### Huelle=987xxx  Sidecar=987yyy (Kind der Huelle)
[dienst] {"ts":"2026-09-01T02:55:35.831Z","level":"info","message":"Takt lauscht auf 127.0.0.1:17843."}
[dienst] beendet: Der lokale Dienst von Takt hat sich unerwartet beendet.
```

Der `Terminated`-Zweig läuft, der neue Wortlaut steht darin, `note_exit` und `emit` laufen
durch. **Was dieser Lauf nicht zeigt, ist die Ankunft im Webview** — dafür bräuchte es einen
Empfänger, und den gibt es noch nicht, weil `ShellStatus` nirgends verdrahtet ist. Das ist die
Grenze des Nachweises und ich schreibe sie hin, statt sie zu überspringen.

Der erste Versuch hat einen Fehler in meinem Prüfskript gefunden, keinen im Erzeugnis: Das
Muster `pgrep -f "takt-local-api-x86_64"` traf den **postject**-Aufruf des Bauschritts, weil
dessen Befehlszeile denselben Pfad enthält. Der `kill -9` hat damit die Binärdatei mitten im
Schreiben zerlegt, und der Bau brach ab. Das Skript sucht den Sidecar jetzt über seinen
Elternprozess. Der Fehlschlag ist eine brauchbare Warnung an jeden, der Takt-Prozesse per
Namensmuster abräumt.

## 1b — Die doppelte Ablage ist weg, der Filter bleibt

`lib.rs` legt `sync_warning` nicht mehr zusätzlich in `problems`. An der Stelle steht jetzt der
Grund, damit sie niemand aus alter Gewohnheit wieder einfügt.

`startupProblems()` in der Oberfläche bleibt unverändert, wie angewiesen. Die Musterseite
belegt weiterhin, dass „nur Datenordner" kein Fehlerband erzeugt — sie belegt jetzt nur nicht
mehr dasselbe: Vorher war es der Filter, jetzt ist es die Quelle. Der Filter deckt ab, dass die
Doppelung zurückkehrt.

## 2 — Zwei Sätze für zwei Leser

Der Wortlaut ist nicht umgeschrieben, sondern **geteilt**. Ein einziger Satz für Anwender und
Systembetreuung wird entweder zu vage oder zu fachlich; er war zu fachlich. Also zwei Felder:

```
directory.sync_warning  →  sync_detail
service_exit.message    →  detail
```

Der Klartext sagt, was ist. Der Zusatz ist das, was man weitergibt, und steht in der Oberfläche
unter der Beschriftung **„Für die Systembetreuung"** — gedämpft, mit eigener Fläche, unterhalb
des Klartextes. Vorher, jetzt:

```
vorher   C:\Users\...\OneDrive\...\Takt sieht nach einem Synchronisierungsordner aus.
         Kopierte WAL-Dateien beschädigen die Datenbank, und die Kundendaten
         verlassen den Rechner.

jetzt    Der Datenordner von Takt liegt in einem Ordner, der laufend an einen
         anderen Ort kopiert wird: C:\Users\...\OneDrive\...\Takt
         ── Für die Systembetreuung ──────────────────────────────────────────
         Der Pfad trägt den Namen eines Synchronisierungsdienstes. Die Datenbank
         besteht aus mehreren Dateien, die zusammengehören; werden sie einzeln
         und zeitversetzt kopiert, wird die Datenbank beschädigt — und die
         kopierten Daten liegen danach außerhalb dieses Rechners.
```

```
vorher   Der Port 17843 ist belegt. Takt weicht bewusst nicht auf einen anderen
         Port aus, weil sich sonst ein fremder Programm als Takt ausgeben
         könnte. Läuft Takt bereits?

jetzt    Takt konnte den lokalen Dienst nicht starten, weil ein anderes Programm
         den Zugang belegt, über den Takt mit sich selbst spricht. Am häufigsten
         ist das Takt selbst: Läuft es vielleicht schon in einem anderen Fenster?
         ── Für die Systembetreuung ──────────────────────────────────────────
         Der Port 17843 auf 127.0.0.1 ist belegt. Takt weicht bewusst nicht auf
         einen anderen Port aus, weil sich sonst ein fremdes Programm als Takt
         ausgeben könnte.
```

Zwei Nebenbefunde aus dem Umschreiben:

- Der alte Satz enthielt **„ein fremder Programm"**. Ein Grammatikfehler in einem Satz, den der
  Kunde zu sehen bekommt; er ist mitkorrigiert.
- Der Beendigungscode stand bei unbekannten Codes im Satz (`… (Code {other}).`). Er steht jetzt
  nirgends mehr im Text — er ist ein eigenes Feld und erscheint als Fußnote. Der Test
  `ein_unbekannter_code_erscheint_nicht_im_satz` hält das fest.

**Zwei Tests halten die Trennung, nicht der gute Wille.**
`die_warnung_spricht_klartext_und_der_zusatz_traegt_die_fachsprache` prüft für jeden Befund, dass
„WAL", „SQLite", „UNC" und „DRIVE_REMOTE" **nicht** im Klartextsatz stehen und der Ordner **schon**;
`der_klartext_traegt_keine_technischen_bezeichner` prüft dasselbe für alle fünf Beendigungsfälle
gegen „17843", „127.0.0.1", „stdin", „Port" und „Code". Beide fallen, sobald ein Fachbegriff
zurück nach vorn wandert.

**Eine Abweichung von der Weisung, und der Grund dafür.** Der Auftrag verlangt „was passiert ist,
was es bedeutet, was zu tun ist". Das „was zu tun ist" steht in den Meldungen für Code 78 und
den unbekannten Fall **nicht** — dort stand zunächst „Beenden Sie Takt und starten Sie es neu.",
und im Dialog erschien dieser Satz dann zweimal im Abstand von fünf Zentimetern: einmal als
Grund, einmal als Schritt 2 der Handlungsliste. Ich habe die generische Anweisung der Oberfläche
gelassen, die sie ohnehin einmal zeigt, und den Meldungen nur das Besondere gelassen — bei
Code 74 die Frage, ob Takt schon läuft. Die Anweisung erreicht den Benutzer, genau einmal. Der
Grund steht als Kommentar an `explain_exit`.

## 3 — `apps/web` bezieht die Zustandsform aus `@takt/desktop`

`pnpm install` lief in 1,6 Sekunden durch, keine Sperrdatei, kein Ärger mit dem parallel
laufenden Add-in. Die drei nachgebauten Schnittstellen sind durch drei Typaliase ersetzt:

```ts
import type { DirectoryReport, ServiceExit, ShellState } from "@takt/desktop/shell";

export type ShellDirectoryReport = DirectoryReport;
export type ShellServiceExit = ServiceExit;
export type ShellStateSnapshot = ShellState;
```

**Der Nachbau hat sich sofort gerächt, und zwar messbar.** Die zwei neuen Felder aus Punkt 2
hätte er stillschweigend verfehlt; mit dem Import brach der Übersetzer an der Demodatei der
Musterseite ab, bis beide Felder gesetzt waren. Genau dafür war der Wechsel gedacht.

**Die Musterseite läuft weiterhin ohne Tauri.** Reiner Typimport, `verbatimModuleSyntax` löscht
ihn restlos. Gemessen statt behauptet:

```
$ grep -c "tauri" apps/web/dist/assets/index-*.js
0
```

Der Bau transformiert unverändert 64 Module.

## Zwei Textstellen, die erst beim Ansehen aufgefallen sind

Beides Fehler in meinem eigenen Text aus T-020, sichtbar erst mit dem neuen Wortlaut daneben:

1. Der Sperrdialog sagte „Der lokale Dienst von Takt **läuft nicht mehr**", während der Grund
   direkt darunter „Takt konnte den lokalen Dienst **nicht starten**" lautete. Bei Code 74 hat er
   nie gelaufen. Jetzt: „ist nicht erreichbar" — richtig für beide Fälle.
2. Die Überschrift des Ordnerhinweises wiederholte den ersten Satz der Hülle fast wörtlich
   („Der Datenordner von Takt wird möglicherweise mitkopiert" über „Der Datenordner von Takt
   liegt in einem Ordner, der …"). Jetzt: „Die Daten von Takt liegen an einer ungeeigneten
   Stelle."

## Nachweise

```
cargo test                                 22 bestanden (vorher 17), 0 fehlgeschlagen
cargo clippy --all-targets -- -D warnings  Exitcode 0
cargo fmt --check                          Exitcode 0
pnpm --filter @takt/desktop sidecar:verify 12 bestanden, 0 fehlgeschlagen
pnpm typecheck   (Wurzel, alle Pakete)     Exitcode 0
pnpm build       (Wurzel, alle Pakete)     Exitcode 0
pnpm contrast                              Exitcode 0, 0 von 194 Paaren durchgefallen
pnpm boundaries                            Exitcode 0
```

Die fünf neuen Rust-Tests: `die_warnung_spricht_klartext_und_der_zusatz_traegt_die_fachsprache`,
`ohne_befund_gibt_es_weder_warnung_noch_zusatz`, `der_klartext_traegt_keine_technischen_bezeichner`,
`ein_unbekannter_code_erscheint_nicht_im_satz`, `ereignisname_steht_auch_in_shell_ts`.

**`pnpm typecheck` und `pnpm build` an der Wurzel sind jetzt grün.** In T-020 brachen beide in
`apps/outlook-addin` ab; der integration-dev hat das inzwischen behoben. Die Zahlen oben sind
frisch gemessen, nicht übernommen.

Die sechs neuen Kontrastpaare, wörtlich (heller Modus; der dunkle liegt durchweg höher):

```
OK     5.64:1 (min 4.5:1)  --text-muted auf --bg-surface  — Zusatz im Datenordner-Hinweis
OK     8.39:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Beschriftung Fuer die Systembetreuung
OK     5.02:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Zusatz im Sperrdialog
OK     7.47:1 (min 4.5:1)  --text-secondary auf --bg-subtle  — Beschriftung im Sperrdialog
OK     3.49:1 (min 3.0:1)  --border-control auf --bg-surface  — Randschiene des Zusatzes, SC 1.4.11
----   1.08:1 (min —)  --bg-surface auf --warning-bg  — Zusatzflaeche gegen Warnband, rein abgrenzend
```

Das letzte Paar hatte ich zunächst mit Mindestwert 1,0 eingetragen — ein Paar, das nichts prüfen
kann und die Prüfliste nur länger macht. Es ist jetzt ausgenommen, mit der Begründung im
Quelltext: Der Block ist an seiner Beschriftung erkennbar, nicht an seiner Kante; SC 1.4.11 ist
darauf nicht anwendbar.

## Was sich an den Risiken aus T-020 ändert

**Erledigt:** Risiko 1 (Sperrmeldung nur bei erneutem Abruf) — die Hülle meldet jetzt.
Risiko 2 (Zustandsform steht zweimal) — sie steht einmal, der Übersetzer prüft sie.
Risiko 5 (zwei Sätze sprechen Fachsprache) — getrennt, mit zwei Tests abgesichert.

**Kleiner geworden:** Risiko 3. Die Doppelung ist an der Quelle weg; der Filter bleibt als
zweite Reihe und hängt weiterhin an Zeichenkettengleichheit — was jetzt aber nur noch für einen
Rückfall gilt und nicht mehr für den Normalbetrieb.

**Unverändert:** Risiko 4 (`aria-modal` ist eine Zusage, keine Durchsetzung; gemeinsam mit
`ConfirmDialog`, gehört in eine eigene Aufgabe) und Risiko 6 (die Startmeldung nimmt Höhe weg).

**Neu, klein:** Der Ereignisname steht in Rust und TypeScript. Der Test hält beide zusammen —
aber nur, solange jemand die Datei nicht verschiebt; dann bricht der Bau mit einem
`include_str!`-Fehler, der die Ursache nicht sofort verrät. Der Pfad steht im Testkommentar.

## Offene Fragen

1. **Weiterhin offen, beim Auftraggeber:** Was steht hinter „Wenden Sie sich an Ihre
   Systembetreuung"? Der Satz bleibt wie angewiesen stehen. Er steht jetzt an vier Stellen —
   zusätzlich als Beschriftung des technischen Zusatzes, und dort trägt er mehr Gewicht als
   vorher: Er verspricht einen Adressaten für einen Text, der eigens für ihn geschrieben ist.

2. **An den, der die Anwendungshülle verdrahtet, kein Blocker:** Auf
   `SHELL_EVENTS.serviceExited` hören und die Nutzlast **nicht** verwerfen. Sie enthält bereits
   den vollständigen `ServiceExit`; ein `shellState()`-Abruf als Reaktion ist erlaubt (die
   Reihenfolge ist zugesichert), aber nicht nötig.
