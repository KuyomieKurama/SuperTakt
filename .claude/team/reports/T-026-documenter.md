Aufgabe: T-026 — Dokumentation füllen: Benutzerhandbuch, Entwicklerhandbuch, Glossar-Nachtrag,
README

Status: fertig

---

Artefakte:

```
docs/benutzerhandbuch.md      NEU geschrieben (vorher Gerüst aus T-004/T-014/T-017a)
docs/entwicklerhandbuch.md    NEU geschrieben (vorher Gerüst aus T-004/T-014/T-017a)
docs/glossar.md               geändert: vierte Exportstatus-Anzeige „Nicht abgerechnet" (E-047,
                               E-050) ergänzt, Begriffe „Nicht abrechnen" und „Exportprotokoll"
                               neu, Tabellen „Code-Bezeichner" und „Wert zu Beschriftung"
                               nachgezogen (17 statt 16 Tabellen, `not_billed`, aktuelle
                               Beschriftungen aus `apps/web/src/lib/labels.ts`), drei veraltete
                               Zeilen korrigiert (Exportvorlage/booking.*, Add-in „noch nicht
                               gebaut", Suche/O-08)
README.md                     NEU
```

Nicht angefasst: `docs/spec.md`, `docs/architektur.md`, `docs/datenmodell.md`,
`docs/testplan.md`, `docs/bedrohungsmodell.md`, `apps/**`, `packages/**`, `.claude/team/*` außer
dieser Datei. Kein `git commit` (kein Repository im Arbeitsbereich).

---

Zusammenfassung:

Beide Handbücher sind aus den Gerüsten heraus vollständig geschrieben, aufgabenorientiert für das
Benutzerhandbuch, mit Paketgrenzen und einem eigenen Abschnitt „Lehren, die dieses Projekt teuer
bezahlt hat" für das Entwicklerhandbuch. Jede Aussage ist gegen Code, `decisions.md`, `risks.md`,
`docs/architektur.md`, `docs/datenmodell.md`, `docs/spec.md` oder einen Bericht geprüft; wo ich
unsicher war, habe ich den tatsächlichen Quelltext gelesen statt eine Vermutung zu übernehmen.
Vier konkrete UI-Zitate (Base64-Hinweis, Pool-Regel, Standard-Tag-Hinweis, Timer-Reaktivierung)
stammen wortgleich aus `apps/web/src`. Das Glossar trägt die vierte Exportstatus-Anzeige
„Nicht abgerechnet" (E-047, E-050) nach, die im bisherigen Stand fehlte, und korrigiert drei
inzwischen falsche Zeilen.

---

Annahmen:

1. **T-042 gegen den aktuellen Quelltext nachgeprüft, nicht blind übernommen.** Der Auftrag nennt
   die drei wichtigsten der acht in T-042 offen gelassenen Punkte, darunter „Erledigt aufgehoben
   ist kein durchgängiges Merkmal" und der spät sichtbare Windows-Benutzername. Ich habe beides im
   Quelltext nachgesehen, nicht nur den Bericht zitiert:
   - **„Erledigt aufgehoben" (C-23) ist inzwischen behoben.** `apps/web/src/lib/labels.ts` führt
     seit T-045 eine einzige `DONE_FLAG_LABEL`-Zuordnung, referenziert in `TodoListScreen.tsx` und
     `TodoDetailScreen.tsx` mit explizitem Verweis auf „Befund C-23"; der T-045-Bericht bestätigt
     „steht in allen fünf Listenansichten". Ich beschreibe das Benutzerhandbuch entsprechend als
     funktionierendes Merkmal, nicht als Lücke.
   - **Windows-Benutzername/Datenbankpfad (C-20) sind ebenfalls sichtbar**, über eine Karte
     „Dieser Arbeitsplatz" in `SettingsScreen.tsx` (`WorkstationFacts`). Diese Änderung taucht in
     keinem der gelesenen Berichte namentlich auf (auch nicht in T-045, das sonst alles auflistet,
     was es anfasst) — der Code ist trotzdem eindeutig vorhanden und ist die einzige Quelle, der
     ich hier vertraut habe.
   - **„Welche Buchungen waren in diesem Lauf" (C-26) ist dagegen weiterhin nur so weit
     beantwortet, wie das Protokoll geladen ist.** `apps/web/src/api/endpoints.ts` ruft
     `listExportAudit` ausschließlich mit `timeEntryId` auf; `exportRunId` ist zwar seit T-042 im
     Dienst verfügbar (`docs/architektur.md` 5.1), aber im Frontend nicht verdrahtet. Das steht so,
     wie beauftragt, im Benutzerhandbuch unter „Was Takt (noch) nicht tut".
   Falls diese Einschätzung falsch ist, weil an anderer Stelle etwas Gegenteiliges dokumentiert
   wurde, das mir nicht vorlag, bitte ich um Korrektur, bevor die Anwendung ausgeliefert wird.
2. **Die „sechs Doppelungen" wörtlich aus dem Code übernommen**, nicht selbst gezählt:
   `packages/domain/src/kernel.ts` (Kommentar zu `calendarDayBounds`) und `docs/datenmodell.md`
   8.4a nennen namentlich Rundung, Plausibilisierung, Zustandsform, Kalendertag in der
   Oberfläche, Quellenliste und Kalendertag in SQL. Ich habe diese Liste im Entwicklerhandbuch
   genau so übernommen und mit den jeweiligen Berichten (T-024, T-028, T-041) belegt.
3. **„Drei Fälle, in denen eine Prüfung grün war, ohne etwas zu prüfen"**: Ich habe drei konkrete,
   im Bestand belegte Fälle gewählt (Regex-Wächter T-028, Protokoll-Trigger T-047, OpenAPI-
   Vergleicher T-041/`docs/architektur.md` Abschnitt 5), nicht die von E-048 gemeldete
   Abdeckungstabelle. Letztere war eine falsch angezeigte, aber korrekt gemessene Prüfung, kein
   Fall von „grün, ohne zu prüfen" — das habe ich bewusst nicht als vierten Fall angeführt, um die
   Kategorie nicht zu verwässern.
4. **Board.md nicht angefasst, obwohl es veraltet ist.** `.claude/team/board.md` führt T-021 bis
   T-026 weiterhin unter „Offen" und kennt keine der Aufgaben T-027 bis T-047. Meine Grundlage für
   „alle Aufgaben sind fertig" ist der Auftrag selbst (der die Endzahlen nennt) zusammen mit den
   tatsächlichen Berichten und dem Quelltext, nicht das Board. Ich habe das Board nicht
   korrigiert, weil es nicht in meiner Dateihoheit liegt — siehe Offene Frage unten.
5. **Exakte Testzahlen bewusst sparsam verwendet.** Ich nenne im Entwicklerhandbuch die 155
   ursprünglich rot geschriebenen Testfälle (T-010) und die 70 davon in `packages/domain`
   (T-009, „ohne eine Testzeile anzufassen"), beides einzeln belegt. Die Gesamtzahl 556 aus dem
   Auftrag übernehme ich nicht wörtlich in die Handbücher, weil sie an keiner Stelle einen
   dauerhaften Ankerpunkt hätte und mit dem nächsten Test bereits wieder falsch wäre; `pnpm test`
   im README verweist stattdessen auf den Befehl, der die aktuelle Zahl jederzeit liefert.
6. **Humanizer-Regeln gegen die Hausschrift des Projekts abgewogen.** Die bestehende Dokumentation
   (`decisions.md`, `architektur.md`, `datenmodell.md`, auch meine eigenen Gerüste aus T-004/
   T-014) benutzt Gedankenstriche als festen Bestandteil des Stils. Nach der Regel des Skills, dass
   eine vorliegende Schreibprobe Vorrang vor der pauschalen Dash-Regel hat, habe ich diesen Stil in
   ähnlicher Häufigkeit fortgeführt, alle übrigen Muster (Floskeln, Werbesprache, forcierte
   Dreiergruppen, Chatbot-Reste, betitelte Aufzählungen) aber wie vorgeschrieben vermieden.

---

Risiken:

- **Board und Realität laufen auseinander.** `.claude/team/board.md` ist der einzige Ort, an dem
  jemand ohne die Berichte zu lesen den Projektstand nachschlägt, und er zeigt einen Stand von vor
  rund zwanzig Aufgaben. Das ist kein Dokumentationsfehler in meinem Bereich, aber es ist ein
  Risiko für den nächsten Leser, der dem Board vertraut.
- **Eine ungemeldete Änderung im Quelltext** (`WorkstationFacts` in `SettingsScreen.tsx`, siehe
  Annahme 1) widerspricht dem sonst durchgehaltenen Verfahren „jede Änderung hat einen Bericht".
  Ich habe mich hier für den Code als Wahrheit entschieden, weil ich sonst etwas Falsches über die
  ausgelieferte Anwendung behauptet hätte. Wenn diese Datei tatsächlich nicht zum freigegebenen
  Stand gehören sollte, ist das Benutzerhandbuch an dieser einen Stelle zu korrigieren.
- **Sicherheitsteil des Entwicklerhandbuchs beruht auf `T-023` und Folgeberichten, nicht auf einer
  erneuten vollständigen Sicherheitsprüfung.** Die vier blockierenden Befunde aus T-023 (S-01 bis
  S-04) sind nach meiner Lesung der Folgeberichte (T-034, T-036, T-039, `docs/architektur.md` 6.7,
  `docs/datenmodell.md` 2.5) einzeln behoben, aber es gibt keinen zusammenfassenden „T-023b"-
  Bericht, der das für alle vier gemeinsam bestätigt. Ich habe entsprechend vorsichtig formuliert
  und nirgends behauptet, eine erneute vollständige Sicherheitsprüfung habe stattgefunden.

---

Offene Fragen:

1. **An den Orchestrator: `board.md` aktualisieren?** Es liegt nicht in meiner Hoheit, aber der
   Zustand (T-021 ff. als „Offen" geführt, T-027 bis T-047 gar nicht erwähnt) ist für jeden
   irreführend, der nach mir das Projekt liest.
2. **An den Orchestrator, zur Bestätigung:** Ist `apps/web/src/screens/SettingsScreen.tsx` mit dem
   Abschnitt „Dieser Arbeitsplatz" tatsächlich Teil des freigegebenen, ausgelieferten Standes? Ich
   habe ihn als vorhanden dokumentiert, weil er im Quelltext steht, kann aber keinen Bericht
   benennen, der ihn eingeführt hat.

---

Nächster Schritt:

Keiner von meiner Seite vorgesehen — T-026 war die letzte Aufgabe des Boards. Falls die beiden
offenen Fragen oben zu einer Korrektur führen, betrifft das je eine einzelne Stelle in
`docs/benutzerhandbuch.md` und `.claude/team/board.md`, keine strukturelle Änderung.
