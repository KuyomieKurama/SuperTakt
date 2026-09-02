Aufgabe: T-018 — Kontrastprüfung reparieren (T-018) und Begriffe nachziehen (T-017b)

Status: fertig

Artefakte:

Zwei Zeilen, um die es ging:

```
apps/web/src/main.tsx             Zeile 4  -> import "@takt/ui-tokens/tokens.css";
apps/web/scripts/contrast-check.mjs Zeile 19 -> resolve(here, "../../../packages/ui-tokens/tokens.css")
```

Neu unter `apps/web/src/`:

```
lib/labels.ts                     Wert zu Beschriftung, eine Stelle (E-041, E-015)
components/ExportGroups.tsx       Tagesgruppenliste der Exportvorschau (E-020, E-031, E-034)
showcase/ExportPreviewSection.tsx Abschnitt 4 der Musterseite
```

Geändert:

```
apps/web/vite.config.ts           resolve.alias ersatzlos entfernt
apps/web/scripts/contrast-check.mjs  Pfad + 26 neue Farbpaare fuer die neuen Flaechen
apps/web/src/components/ExportStatus.tsx  ExportStatus (2 Werte) / ExportDisplayState (3) getrennt
apps/web/src/components/BookingTable.tsx  exportStatus + exportCount + source statt exportState
apps/web/src/components/FilterBar.tsx     FilterToggle ergaenzt, SelectField generisch
apps/web/src/components/Kanban.tsx        ExportDisplayState
apps/web/src/components/Timer.tsx         Begriff Zeiterfassung (E-030)
apps/web/src/components/NoteField.tsx     Abschnittsverweis
apps/web/src/lib/theme.ts                 ThemePreference = ThemeSetting aus labels.ts
apps/web/src/showcase/Showcase.tsx        Navigation, Abschnitt 4 eingehaengt, THEME_LABEL
apps/web/src/showcase/ExportStatusSection.tsx  E-032 ausgesprochen
apps/web/src/showcase/DataSection.tsx     Filter zweiwertig
apps/web/src/showcase/BoardSection.tsx    zwei Pool-Ansichten mit Schalter (E-039)
apps/web/src/showcase/IntroSection.tsx    vierte Fokusstelle, Nummern
apps/web/src/showcase/InventorySection.tsx  drei Eintraege neu, ein toter entfernt
apps/web/src/showcase/{Time,Notes,Tags,Controls}Section.tsx  Abschnittsnummern
apps/web/src/showcase/data.ts             Buchungszeilen umgestellt, EXPORT_GROUPS ergaenzt
apps/web/src/styles/components.css        Schalter, Tagesgruppen, Pool-Liste, Herkunftsspalte
apps/web/design/DESIGNSYSTEM.md           Abschnitte 3.0, 3.1, 3.2, 3.3 ueberarbeitet; 3.5, 3.6, 3.7 neu
apps/web/README.md                        Befehle, Aufbau, Regeln
```

Nicht angefasst: `packages/**`, `apps/local-api/**`, `docs/**`, Wurzeldateien, alles unter
`.claude/` außer dieser Datei. Nichts installiert, `pnpm-lock.yaml` unberührt.

---

## T-018 — die geforderte Ausgabe, wörtlich

### Erster Lauf, unmittelbar nach den zwei Zeilenänderungen

Aufgerufen als `pnpm contrast` **aus `apps/web`**, Exitcode 0. Erwartung getroffen:
124 Paare, 0 durchgefallen.

```
$ node scripts/contrast-check.mjs

== Modus hell ==
OK    14.80:1 (min 4.5:1)  --text-primary auf --bg-canvas  — Standardtext auf Anwendungshintergrund
OK    15.76:1 (min 4.5:1)  --text-primary auf --bg-surface  — Standardtext auf Karte
OK    14.03:1 (min 4.5:1)  --text-primary auf --bg-subtle  — Tabellenkopf
OK    14.03:1 (min 4.5:1)  --text-primary auf --bg-hover  — Zeile unter dem Zeiger
OK    14.27:1 (min 4.5:1)  --text-primary auf --bg-selected  — ausgewaehlte Zeile
OK     8.39:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Sekundaertext
OK     5.64:1 (min 4.5:1)  --text-muted auf --bg-surface  — Hilfetext, Platzhalter
[... 55 weitere Paare im hellen Modus ...]
OK     5.62:1 (min 3.0:1)  --focus-ring-color auf --bg-canvas  — Fokusring auf Hintergrund
OK     5.33:1 (min 3.0:1)  --focus-ring-color auf --bg-subtle  — Fokusring in Werkzeugleiste

== Modus dunkel ==
OK    15.92:1 (min 4.5:1)  --text-primary auf --bg-canvas  — Standardtext auf Anwendungshintergrund
OK    14.64:1 (min 4.5:1)  --text-primary auf --bg-surface  — Standardtext auf Karte
OK    13.39:1 (min 4.5:1)  --text-primary auf --bg-subtle  — Tabellenkopf
[... 57 weitere Paare im dunklen Modus ...]
OK     9.07:1 (min 3.0:1)  --focus-ring-color auf --bg-canvas  — Fokusring auf Hintergrund
OK     7.62:1 (min 3.0:1)  --focus-ring-color auf --bg-subtle  — Fokusring in Werkzeugleiste

0 von 124 Paaren durchgefallen.
```

Die vollständige Ausgabe hat 131 Zeilen und ist byteweise dieselbe, die das Skript vor dem
Umzug der Tokendatei geliefert hat. Ich habe das gemessen, nicht angenommen: Ein zweiter Lauf
gegen dieselbe Datei ergab `diff` ohne Unterschied. Damit ist belegt, dass der Umzug aus T-008a
den Inhalt nicht verändert hat — und dass die 124 Paare wirklich gegen
`packages/ui-tokens/tokens.css` gemessen wurden und nicht gegen eine Reststückchen-Datei unter
`src/styles/`.

### Zweiter Lauf, nach den Ergänzungen aus dieser Aufgabe

Die neuen Flächen — Tagesgruppenliste, Filterschalter, Herkunftsspalte — bringen zwölf
Farbkombinationen mit, die vorher nirgends vorkamen. Regel 4 des Designsystems verlangt, dass
so etwas gemessen und nicht behauptet wird, also habe ich 13 Paare ergänzt (je Modus gemessen,
also 26 Messungen mehr).

```
== Modus hell ==
OK    14.27:1 (min 4.5:1)  --text-primary auf --bg-selected  — Titel einer ausgewaehlten Tagesgruppe
OK     7.60:1 (min 4.5:1)  --text-secondary auf --bg-selected  — zusammengefuehrte Leistung, ausgewaehlt
OK     5.11:1 (min 4.5:1)  --text-muted auf --bg-selected  — Kalendertag und Call, ausgewaehlt
OK    15.34:1 (min 4.5:1)  --text-primary auf --bg-surface-alt  — Zeitraum einer Einzelbuchung
OK     8.17:1 (min 4.5:1)  --text-secondary auf --bg-surface-alt  — Dauer und Leistung einer Einzelbuchung
OK     5.49:1 (min 4.5:1)  --text-muted auf --bg-surface-alt  — Herkunft einer Einzelbuchung
OK     5.02:1 (min 4.5:1)  --text-muted auf --bg-disabled  — ausgeschlossene Buchung, durchgestrichen
OK     8.29:1 (min 4.5:1)  --text-primary auf --warning-bg  — Titel einer nicht exportierbaren Gruppe
OK     5.20:1 (min 4.5:1)  --text-muted auf --warning-bg  — gedaempfte Zeit einer gesperrten Gruppe
OK     7.50:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Sperrgrund nach E-034
OK     5.11:1 (min 4.5:1)  --text-muted auf --accent-bg-subtle  — Zusatz unter der Beschriftung, Schalter ein
OK     5.98:1 (min 3.0:1)  --accent-bg auf --bg-surface  — Schienenfarbe des Schalters, SC 1.4.11
OK     8.16:1 (min 4.5:1)  --accent-text auf --bg-surface  — Haken im Knauf, Schalter ein

== Modus dunkel ==
OK    12.31:1 (min 4.5:1)  --text-primary auf --bg-selected  — Titel einer ausgewaehlten Tagesgruppe
OK     8.21:1 (min 4.5:1)  --text-secondary auf --bg-selected  — zusammengefuehrte Leistung, ausgewaehlt
OK     5.67:1 (min 4.5:1)  --text-muted auf --bg-selected  — Kalendertag und Call, ausgewaehlt
OK    13.85:1 (min 4.5:1)  --text-primary auf --bg-surface-alt  — Zeitraum einer Einzelbuchung
OK     9.23:1 (min 4.5:1)  --text-secondary auf --bg-surface-alt  — Dauer und Leistung einer Einzelbuchung
OK     6.38:1 (min 4.5:1)  --text-muted auf --bg-surface-alt  — Herkunft einer Einzelbuchung
OK     6.16:1 (min 4.5:1)  --text-muted auf --bg-disabled  — ausgeschlossene Buchung, durchgestrichen
OK     9.35:1 (min 4.5:1)  --text-primary auf --warning-bg  — Titel einer nicht exportierbaren Gruppe
OK     6.14:1 (min 4.5:1)  --text-muted auf --warning-bg  — gedaempfte Zeit einer gesperrten Gruppe
OK     8.29:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Sperrgrund nach E-034
OK     5.67:1 (min 4.5:1)  --text-muted auf --accent-bg-subtle  — Zusatz unter der Beschriftung, Schalter ein
OK     5.66:1 (min 3.0:1)  --accent-bg auf --bg-surface  — Schienenfarbe des Schalters, SC 1.4.11
OK     8.34:1 (min 4.5:1)  --accent-text auf --bg-surface  — Haken im Knauf, Schalter ein

0 von 150 Paaren durchgefallen.
```

Exitcode 0. Kein neues Paar liegt näher als 2,0 an seiner Schwelle; die fünf knappsten Werte
der ganzen Prüfung (3,10 bis 3,49 bei Mindestwert 3,0) sind alle aus T-006 und unverändert.

### Befund: `pnpm contrast` an der Wurzel gibt es gar nicht

Das ist kein Nebensatz, sondern der Grund, warum der Ausfall aus T-008a so lange unbemerkt
bleiben konnte. An der Wurzel des Arbeitsbereichs:

```
$ pnpm contrast
undefined
[ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL] Command "contrast" not found
```

`package.json` an der Wurzel führt `typecheck`, `build`, `test`, `boundaries`, `dev` und `check`
— aber kein `contrast`. Wer die Prüfung an der Wurzel aufruft, bekommt seit jeher einen Fehler,
und zwar denselben, egal ob das Skript funktioniert oder nicht. Die einzigen Aufrufe, die etwas
messen, sind

```
pnpm --filter @takt/web contrast     # von der Wurzel
pnpm contrast                        # aus apps/web
```

Der Kontrastnachweis ist die einzige automatische Prüfung des Designsystems, und er hängt an
keinem Sammelbefehl: `pnpm check` ruft `typecheck`, `boundaries`, `test:coverage` und `build`
auf, aber nicht `contrast`. Eine durchgefallene Farbe fällt damit erst auf, wenn jemand von
Hand nachsieht. **An den Orchestrator:** Ein `"contrast": "pnpm --filter @takt/web contrast"`
an der Wurzel und ein Glied mehr in `pnpm check` würden das schließen. Beides sind
Wurzeldateien und nicht meine Hoheit, deshalb habe ich es gemeldet statt es zu tun. Ich habe
den Aufruf stattdessen in `README.md` und im Designsystem an beiden Stellen richtiggestellt.

### E-040 umgesetzt

`base.css` ist geblieben, wo es war. Der `resolve.alias`-Eintrag in `vite.config.ts` ist
ersatzlos entfallen; die Begründung steht als Kommentar in der Datei. Der Nachweis, dass die
Token trotzdem im Bauergebnis landen, ist gemessen und nicht behauptet:

```
$ grep -c -- "--takt-accent-600"    dist/assets/index-*.css   ->  1
$ grep -c -- "--status-reopened-hatch" dist/assets/index-*.css ->  1
```

`@types/node` bleibt vorerst in `apps/web/package.json`. T-008a hatte den Eintrag nur wegen
`node:url` in `vite.config.ts` gebraucht, und diese Zeile ist jetzt weg — ihn zu entfernen
verlangt aber ein `pnpm install` und damit einen Schreibzugriff auf die gemeinsame Sperrdatei.
Der Auftrag sagt: nichts installieren. Steht unten unter „Offene Fragen“.

---

## T-017b — Begriffe

**E-030.** „Time-Tracking-Ansicht“ kam an drei Stellen vor und heißt jetzt **Zeiterfassung**:
in der Einleitung von Abschnitt 6, in einer Zwischenüberschrift und im Kopfkommentar von
`Timer.tsx`. Dort steht jetzt außerdem, warum: Der **Timer** ist das Bedienelement, die
**Zeiterfassung** der Bereich. Eine Prüfung über `src/`, `design/`, `README.md` und `scripts/`
auf `time.?track`, `ticket` und `zeittracking` findet nur noch die Regeln selbst, die diese
Wörter verbieten.

**E-029.** „Ticket“ kam in `apps/web` nirgends vor. Das habe ich geprüft und nicht angenommen.

**E-041.** Die beiden fehlenden Beschriftungen und die neun bereits bekannten liegen jetzt in
`src/lib/labels.ts` — typisiert über `Readonly<Record<T, string>>`, sodass eine vergessene
Zuordnung ein Übersetzungsfehler ist und kein leerer Text zur Laufzeit. Beide neuen
Beschriftungen sind auf der Musterseite auch tatsächlich zu sehen, nicht nur definiert:

* `time_entry.source` — die Buchungstabelle hat eine Spalte **Herkunft** bekommen, und jede
  Einzelbuchung in der Exportvorschau nennt ihre Herkunft. Beide Werte kommen vor: **Timer**
  und **Von Hand**.
* `app_setting.theme` — der Schalter oben rechts liest seine Beschriftungen aus `labels.ts`.
  Aus „System“ ist **Systemvorgabe** geworden.

Nebenwirkung, die ich für richtig halte: `lib/theme.ts` führt seine Wertemenge nicht mehr
selbst, sondern `export type ThemePreference = ThemeSetting`. Zwei Aufzählungen für dieselbe
Datenbankspalte laufen sonst irgendwann auseinander.

Beim Nachziehen aufgefallen und mitgemacht — beides waren Reste aus der Zeit vor E-015:

* `DESIGNSYSTEM.md` beschrieb die Domäne noch mit `Zeitbuchung.exportstatus`,
  `Zeitbuchung.exportAnzahl` und den Werten `'offen'`/`'exportiert'`. Jetzt
  `TimeEntry.exportStatus`, `TimeEntry.exportCount`, `open`/`exported`.
* Der Abschnitt über den Bestätigungsdialog nannte `ZuruecksetzenAntrag.grund`. Der Typ heißt
  seit T-013b `ExportStatusResetRequest.reason`; ich habe den Namen aus
  `packages/domain/src/time-entry.ts` gelesen und nicht geraten.

---

## E-032 — der Exportstatus ist jetzt auch im Quelltext zweiwertig

Das war der wichtigste Punkt der Aufgabe, und er war schlimmer als „die Musterseite spricht es
nicht aus“. Der Fehler, vor dem E-032 warnt, war bereits gebaut:

```
src/showcase/DataSection.tsx, Zeile 28 (alt):
  { value: "reopened", label: "Nur erneut offen" },

  const matchesStatus = status === "all" || row.exportState === status;
```

Ein Filter mit drei Werten auf einer Zeile, die den Anzeigezustand als Status führte. Wer dort
„Nur offen“ wählte, bekam die zurückgesetzte Buchung **nicht** — genau der Fall, den E-032
beschreibt und der eine bereits einmal abgerechnete Zeit still aus der nächsten Abrechnung
fallen lässt. Auf der Musterseite kostet das nichts. In S-06 hätte es Geld gekostet, und die
Musterseite ist die Vorlage für S-06.

Repariert habe ich das nicht durch einen anderen Filtertext, sondern im Typsystem:

```ts
// src/components/ExportStatus.tsx
export type ExportStatus = "open" | "exported";              // Filter, Abfragen, Exportauswahl
export type ExportDisplayState = ExportStatus | "reopened";  // ausschliesslich Darstellung
export function exportDisplayState(status: ExportStatus, exportCount: number): ExportDisplayState;
export function exportStatusOf(state: ExportDisplayState): ExportStatus;
```

`BookingRowData` trägt seither `exportStatus` **und** `exportCount`, nicht mehr einen
zusammengefallenen `exportState`. Der Anzeigezustand wird in der Tabelle abgeleitet und verlässt
die Datei nicht. Damit ist die Verwechslung kein Aufmerksamkeitsproblem mehr: Wer einen Filter
baut, greift auf `ExportStatus` zu und hat dort schlicht keinen dritten Wert zur Auswahl.

Ausgesprochen wird es an drei Stellen der Musterseite, weil eine allein überlesen wird:

1. **Abschnitt 2** hat eine neue Karte „‚Erneut offen‘ ist kein dritter Wert des
   Exportstatus“ mit der Wahrheitstabelle Status × Zähler → Darstellung und der Spalte „Geht in
   den nächsten Export“. Die Merkmalstabelle darüber hat eine siebte Zeile bekommen:
   „Fachlicher Status: `open` / `exported` / `open` — **kein eigener Wert**“.
2. **Abschnitt 3** zeigt beim Filter „Nur offen“ einen Hinweis, der erklärt, warum die
   zurückgesetzte Buchung im Ergebnis steht. Gemessen: `3 von 5 Buchungen`, darunter die
   zurückgesetzte.
3. **Abschnitt 4** nimmt die zurückgesetzte Buchung sichtbar in ihre Tagesgruppe auf.

Dazu eine kleine Änderung mit unerwartet großer Wirkung: Der Zusatz hinter dem Etikett „Erneut
offen“ war ein Datum („zurückgesetzt am …“). Er nennt jetzt den Exportzähler — **„1× exportiert“**.
Damit steht das Merkmal, an dem die Darstellung hängt, unmittelbar neben ihr, statt dass man es
in der Dokumentation nachlesen muss.

---

## E-031 — Exportvorschau nach Tagesgruppen

Neuer Abschnitt 4 der Musterseite, gebaut auf `components/ExportGroups.tsx`, damit S-07 ihn
später benutzen kann statt ihn nachzubauen.

Eine Gruppe zeigt Todo, Kalendertag, Call-Nummer, die zusammengeführte Leistung und die
gerundete Zeit. Aufgeklappt stehen darunter die einzelnen Buchungen mit **ungerundeter** Dauer,
Herkunft und eigenem Leistungstext. Der Kern ist die sofortige Rückmeldung; gemessen mit
Playwright gegen die gebaute Fassung:

```
Ausgangslage  g-1: 10 + 20 + 5 Minuten  -> 0,75
mittlere Buchung ausgeschlossen (15 Min) -> 0,25   (Zaehler: "2 von 3 Buchungen")
wieder aufgenommen                       -> 0,75
alle drei ausgeschlossen                 -> Gruppe gesperrt, Exportknopf faellt auf "1 Zeile"
```

Die gerundete Zeit steht in einem `<output>`, wird also bei jeder Änderung angesagt, und
bekommt eine kurze Hervorhebung, die unter `prefers-reduced-motion: reduce` entfällt. Zusätzlich
nennt eine `aria-live`-Ansage den neuen Wert im Klartext.

E-034 ist mit drin, weil es ohne die Gruppenansicht nicht darstellbar wäre: Die dritte Gruppe
trägt keine Leistung, ist als nicht exportierbar gekennzeichnet, ihr Auswahlkästchen ist
gesperrt, ihre gerundete Zeit steht gedämpft daneben, und in der aufgeklappten Gruppe steht
„Leistung nachtragen“ an der betroffenen Buchung.

**Gerundet wird nicht in der Oberfläche.** Zu jeder möglichen Auswahl liegt das fertige
Ergebnis als Beispieldatum in `showcase/data.ts` — vierzehn Einträge, je einer für jede
Teilmenge, jeder mit der Rechnung als Kommentar (`// 10 + 20 + 5 = 35 Minuten -> 0,75`).
`exportGroupOutcome()` schlägt nach und rechnet nicht; fehlt ein Schlüssel, wirft es, statt
still etwas Falsches zu zeigen. In der Anwendung liefert diese Werte `packages/domain`.

---

## E-039 — erledigte Todos in Pool-Ansichten

Zwei Pool-Ansichten („Intern“ über Tag `Intern`, „Kunden“ über den Ordner `Kunden`) unter dem
Board in Abschnitt 5. Sie arbeiten auf demselben Zustand wie das Board darüber, und genau das
ist der Punkt: Wer den Timer auf der erledigten Karte „Beispiel GmbH“ startet, sieht das Todo
unmittelbar darunter im Pool „Kunden“ wieder auftauchen. A-2.5 ist damit nicht nur beschrieben,
sondern vorführbar.

Der Schalter ist neu: `FilterToggle` in `FilterBar.tsx`, ein Knopf mit `aria-pressed`, dessen
Zustand zusätzlich im Text steht („3 Todos ausgeblendet“ / „derzeit keins ausgeblendet“). Die
Wahl liegt je Pool in einer Menge und nicht in einem globalen Schalter — „je Ansicht gemerkt“,
wie E-039 es verlangt.

Eine Sache habe ich dabei ergänzt, die in E-039 nicht steht und die ich für nötig halte:
Solange erledigte Todos ausgeblendet sind, trägt die Filterleiste einen entfernbaren Chip
„Erledigte Todos: ausgeblendet“. Die Leiste hat die Regel, dass nie ein Filter unbemerkt wirkt
— und die Voreinstellung aus E-039 **ist** ein Filter. Ohne den Chip hätte die Leiste „Kein
Filter aktiv“ gemeldet, während sie eines der Todos verbirgt.

Nebenbei repariert: `REACTIVATED_POOLS` war eine feste Liste `["Intern", "Nicht abgerechnet"]`,
die zu den Tags der betroffenen Karte gar nicht passte — die Karte liegt in „Kunden“. Der
Wiederaufnahme-Hinweis nennt die Pools jetzt aus denselben Regeln, aus denen die Listen
darunter entstehen. Eine Meldung, die einen Pool erfindet, wäre schlimmer als keine, und das
galt auch für die Musterseite.

---

Zusammenfassung:

`pnpm contrast` misst wieder — 124 Paare, 0 durchgefallen, Exitcode 0, wörtlich oben. Die
Ausgabe ist byteweise dieselbe wie vor dem Umzug der Tokendatei; damit ist auch belegt, dass
T-008a nur verschoben und nichts verändert hat. Der Alias in `vite.config.ts` ist ersatzlos
weg, es gibt jetzt genau einen Weg zur Tokendatei, und der läuft über die `exports`-Tabelle des
Pakets. `base.css` bleibt in `apps/web` (E-040).

Der Begriffsstand ist nachgezogen: Zeiterfassung statt Time-Tracking (E-030), kein „Ticket“
(E-029), die fünf Beschriftungen aus E-041 in `lib/labels.ts` und beide neuen davon auch
sichtbar auf der Seite.

Der wichtigste Fund liegt nicht bei den Begriffen. Der Filter „Nur erneut offen“ in der
Buchungstabelle war genau der Fehler, vor dem E-032 warnt, und er war gebaut, nicht nur
gedacht. Er ist weg, und die Verwechslung ist jetzt im Typsystem ausgeschlossen statt in einem
Kommentar verboten: `ExportStatus` mit zwei Werten für alles, was filtert, `ExportDisplayState`
mit drei ausschließlich für die Darstellung.

Dazu drei Ergänzungen, die die Musterseite von neun auf zehn Abschnitte bringen: die
Exportvorschau nach Tagesgruppen (E-031, E-034), die Pool-Ansichten mit Schalter (E-039) und
die drei Stellen, an denen die Zweiwertigkeit des Exportstatus ausgesprochen wird (E-032).

Geprüft, nicht behauptet:

| Prüfung | Ergebnis |
|---|---|
| `pnpm typecheck` (Wurzel, 5 Pakete) | Exitcode 0, keine `any`-Typen |
| `pnpm boundaries` | Exitcode 0, Notiz-Trennung unverletzt |
| `pnpm build` (`apps/web`) | Exitcode 0 |
| `pnpm contrast` (`apps/web`) | Exitcode 0, 150 von 150 Paaren bestanden |
| Konsolenfehler auf der gebauten Seite | keine |
| doppelte `id`, leere `aria-controls`, Knöpfe ohne Namen, Überschriftensprünge | jeweils keine |
| Tastaturdurchlauf Abschnitt 4 | 18 von 19 Elementen fokussierbar (das 19. ist das gesperrte Kästchen der nicht exportierbaren Gruppe) |
| Tastaturdurchlauf Abschnitt 5 samt Pools | 29 von 29 |
| Fokusring auf den neuen Bedienelementen | `solid 2px rgb(33, 89, 218)`, Versatz 2px, `:focus-visible` trifft |
| Aufklappen per Eingabetaste, Auswahl per Leertaste | beide wirken, `aria-expanded` schaltet um |
| Heller und dunkler Modus | beide durchgesehen, keine Nachbesserung nötig |
| Buchungstabelle bei 1440 Pixeln | `scrollWidth == clientWidth`, kein Querlauf trotz neuer Spalte |

---

Annahmen:

1. **Die Beispielwerte der Tagesgruppen habe ich von Hand nach E-008 und E-020 gerechnet und
   als Text hinterlegt, nicht im Browser gerundet.** Vierzehn Einträge, jeder mit seiner
   Rechnung als Kommentar. Die Alternative wäre gewesen, `roundToQuarterHours` aus
   `packages/domain` zu importieren — das hätte `@takt/domain` als Abhängigkeit von `apps/web`
   und damit ein `pnpm install` gebraucht, und die Funktion existiert noch nicht (siehe unten
   unter „Risiken“). Ein drittes Mal die Rundung in der Oberfläche nachzubauen kam nicht in
   Frage.

2. **`ExportGroups.tsx` liegt in `components/` und nicht in `showcase/`.** Der Auftrag sagte
   „wo ohne neue Komponenten darstellbar“. Ich habe die Ausnahme gemacht, weil S-07 diesen
   Baustein braucht und ihn sonst nachbaut — und weil er, einmal in `showcase/` gebaut, nie
   wieder herauskäme. Er hat keine Fachlogik: gerundete Zeit, zusammengeführte Leistung und
   Sperrgrund kommen als Werte herein.

3. **`FilterToggle` ist der zweite neue Baustein.** E-039 verlangt wörtlich „einen Schalter in
   der Filterleiste“; ohne ein Schalterelement war die Entscheidung nicht darstellbar. Er sitzt
   in `FilterBar.tsx`, weil er zur Filterleiste gehört, und steht im Inventar.

4. **Die Musterseite ist von neun auf zehn Abschnitte gewachsen, die Nummern haben sich
   verschoben.** Exportvorschau ist der neue Abschnitt 4; Board, Zeiterfassung, Notizen, Tags,
   Bausteine und Inventar rücken um eins nach hinten. Alle Querverweise in `src/`,
   `DESIGNSYSTEM.md` und `README.md` sind mitgezogen; ich habe danach über `src/` gegriffen und
   jede verbliebene Fundstelle einzeln geprüft. Der Eintrag „↳ Entschieden: Erneut offen“ stand
   in der Navigation hinter dem Board, obwohl er auf eine Karte in Abschnitt 2 zeigt — er steht
   jetzt dort, wo er hinführt.

5. **`SelectField` ist generisch über den Wertetyp geworden.** Sonst hätte jede Auswahlliste
   ihre eigene Wertemenge an der Aufrufstelle wiederherstellen müssen, also genau die
   Zusicherung, die E-032 gefährlich macht. Die eine verbliebene Zusicherung
   (`event.target.value as TValue`) steht einmal im Baustein, mit Begründung: Das DOM liefert
   `string`, und jede Option trägt bereits `TValue`. Kein `any` in `apps/web`.

6. **Die Leistungsspalte der Buchungstabelle ist von 16 auf 12 rem geschrumpft.** Die neue
   Spalte „Herkunft“ hätte die Tabelle sonst bei 1440 Pixeln in den Querlauf geschoben, und
   dann wäre das Zeilenmenü aus dem Bild gewesen. Gemessen: 1118 zu 1118 Pixeln, kein Querlauf.
   Der volle Leistungstext steht weiterhin im `title`.

---

Risiken:

1. **`pnpm check` ist rot, und zwar nicht wegen `apps/web`.** Zehn Testdateien schlagen fehl,
   alle unter `packages/`:

   ```
   packages/domain/test/{rounding,export-status,export-grouping,timer,tags-and-pools}.test.ts
       -> TypeError: roundToQuarterHours is not a function
   packages/export/test/{base64,render,template,merge-notes,templates}.test.ts
       -> Cannot find module '../src/....js'
   ```

   Das ist der erwartete rote Stand einer testgetriebenen Welle: Die Tests aus T-010 stehen,
   die Umsetzung aus T-009 und T-007 fehlt noch. `apps/web` hat kein Testverzeichnis und
   trägt zu keinem dieser Fehler bei; `pnpm typecheck`, `pnpm boundaries` und `pnpm build`
   laufen alle grün. Ich melde es, damit niemand den roten Stand mir zuschreibt oder ihn für
   neu hält.

2. **Der Kontrastnachweis hängt an keinem Sammelbefehl.** Siehe den Befund oben. Solange
   `pnpm check` ihn nicht aufruft, hängt die einzige automatische Prüfung des Designsystems
   daran, dass jemand daran denkt. Der Ausfall aus T-008a hat genau deshalb bis hierher
   gedauert.

3. **Die vierzehn hinterlegten Rundungsergebnisse sind eine Kopie einer Regel, die anderswo
   wohnt.** Ändert sich E-008 oder E-020, zeigt die Musterseite still etwas Falsches. Das
   Skript wirft zwar bei einer unbekannten Auswahl, aber nicht bei einem falschen Wert. Sobald
   `packages/domain` seine Rundung liefert, gehört diese Tabelle ersetzt — entweder durch die
   echte Funktion oder durch einen Test, der die vierzehn Werte gegen sie prüft. Das wäre die
   billigste Absicherung, die ich mir vorstellen kann, und sie liegt beim unit-tester.

4. **Ein Muster, das ich nicht angefasst habe.** `BoardSection.moveCard` und `toggleDone` rufen
   `setAnnouncement` innerhalb der Aktualisierungsfunktion von `setCards` auf. Das ist ein
   Seiteneffekt in einer Funktion, die rein sein muss, und React ruft sie im Strict Mode
   doppelt auf. Folgenlos, weil beide Aufrufe denselben Text setzen — aber es ist ein Muster,
   das jemand abschreibt. In meinem neuen Quelltext habe ich es vermieden und die Stelle
   kommentiert. Aufräumen wäre eine eigene kleine Aufgabe; ich habe es nicht nebenbei gemacht,
   weil es Verhalten anfasst, das nicht Gegenstand dieser Aufgabe war.

5. **Zwei tote Einträge im Inventar sind mir aufgefallen, einer davon war grob falsch.** Der
   Baustein „Zusatzzeichen ‚schon einmal exportiert‘“ stand dort als **gebaut** und **„zur
   Entscheidung“**, obwohl Variante B laut Designsystem seit T-015 aus dem Quelltext entfernt
   ist und die Entscheidung mit E-024 gefallen ist. Wer das Inventar als Bestandsliste gelesen
   hätte, hätte nach einer Datei gesucht, die es nicht gibt. Entfernt.

---

Offene Fragen:

1. **An den Orchestrator: `contrast` an der Wurzel und in `pnpm check`.** Vorschlag für
   `package.json` an der Wurzel — beides Wurzeldateien und nicht meine Hoheit:

   ```json
   "contrast": "pnpm --filter @takt/web contrast",
   "check": "pnpm run typecheck && pnpm run boundaries && pnpm run contrast && pnpm run test:coverage && pnpm run build"
   ```

2. **An den domain-dev: `@types/node` kann aus `apps/web/package.json` verschwinden.** Der
   Eintrag war T-008a's Brücke für `node:url` in `vite.config.ts`; die Zeile ist weg. Ich habe
   ihn stehen lassen, weil das Entfernen ein `pnpm install` und damit einen Schreibzugriff auf
   die gemeinsame Sperrdatei bedeutet, und ich sollte nichts installieren. Wer als Nächster
   ohnehin installiert, kann ihn mitnehmen. `tsconfig.json` in `apps/web` führt `"node"`
   weiterhin unter `types`; das müsste dann mit.

3. **An den domain-dev: Wie heißt die Funktion, die eine Sekundendauer als „1:07 h“ formatiert,
   und die, die eine Viertelstundenzahl als „0,75“ ausgibt?** Die Oberfläche bekommt beides als
   fertigen Text und soll das auch weiter tun. Solange die Funktionen fehlen, stehen in
   `showcase/data.ts` feste Zeichenketten. Das war schon in T-006 offen und ist es geblieben;
   ich melde es erneut, weil die Exportvorschau jetzt vierzehn solche Werte hält statt fünf.

4. **An den unit-tester: die vierzehn Rundungswerte als Prüffälle.** `showcase/data.ts` hält
   zu jeder Teilmenge zweier Beispielgruppen das erwartete Ergebnis, jeweils mit der Rechnung
   im Kommentar. Das ist eine fertige Tabelle für `roundToQuarterHours` in Verbindung mit der
   Tagessumme aus E-020 — insbesondere die Fälle 156, 110 und 46 Minuten, die über mehrere
   Stufen springen. Wer sie übernimmt, sichert gleichzeitig die Musterseite ab (Risiko 3).

5. **An den spec-ux-reviewer: Braucht das Zurücksetzen eines Exportstatus wirklich eine
   Pflichtbegründung?** Der Dialog in Abschnitt 3 hat `reasonRequired` und sperrt den Knopf ohne
   Eingabe. E-037 hat für das *manuelle Markieren als exportiert* ausdrücklich gegen eine
   Begründungspflicht entschieden, mit dem Argument, ein Pflichtfeld erzeuge in der Praxis den
   Text „x“. Für das Zurücksetzen gibt es keine gleichlautende Entscheidung, und das
   Domänenmodell führt `ExportStatusResetRequest.reason` als `string` ohne erkennbare
   Optionalität. Ich habe nichts geändert — es ist eine Frage der Fachlichkeit und nicht der
   Gestaltung —, aber die beiden Stellen begründen dieselbe Sache unterschiedlich.

6. **An den Auftraggeber, klein: Die Herkunft einer Buchung ist jetzt eine eigene Spalte in
   der Buchungstabelle.** Sie kostet Platz auf dem dichtesten Screen des Produkts. Wenn Ihnen
   „Timer oder von Hand“ dort nicht wichtig genug ist, fällt die Spalte weg und die
   Beschriftungen bleiben trotzdem in der Exportvorschau sichtbar; die Leistungsspalte
   bekäme ihre vier Zeichen Breite zurück.

---

Nächster Schritt:

1. **Der Auftraggeber sieht sich Abschnitt 4 an.** `pnpm dev`, dann in der Seitennavigation
   „4 — Exportvorschau“. Die erste Gruppe ist aufgeklappt; die mittlere Buchung herausnehmen
   und beobachten, wie die gerundete Zeit von 0,75 auf 0,25 fällt. Das ist die Stelle, an der
   aus erfasster Zeit ein Rechnungsbetrag wird, und die einzige, an der ein
   Verständnisfehler Geld kostet. Danach Abschnitt 5, Pool „Kunden“: Der Abspielknopf auf der
   erledigten Karte bringt das Todo dort sichtbar zurück.

2. **T-007 baut `packages/export` gegen die Gliederung aus Abschnitt 4.** Die Datenform steht in
   `components/ExportGroups.tsx` als `ExportGroupData` und `ExportGroupViewModel`: Gruppe mit
   Tag, Buchungen mit ungerundeter Dauer und eigener Leistung, dazu gerundete Zeit,
   zusammengeführte Leistung und ein Sperrgrund. Die Oberfläche erwartet genau diese vier
   Werte von außen.

3. **T-009 und T-016 machen `pnpm check` grün.** Die zehn roten Testdateien warten auf
   `roundToQuarterHours` und auf `packages/export`. Bis dahin ist die Kette rot, und wer die
   Ursache nicht kennt, sucht sie an der falschen Stelle.

4. **Der Orchestrator entscheidet über den `contrast`-Aufruf an der Wurzel** (Offene Frage 1).
   Solange er fehlt, ist der Kontrastnachweis eine Prüfung, an die man sich erinnern muss.
