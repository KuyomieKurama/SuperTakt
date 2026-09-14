# T-287 — E-106 nachgezogen, und der Bestandswert erstmals bewertet

Aufgabe: T-287 — E-106 hebt T-279 teilweise auf; `app_setting.last_version_check_at` war im
Bedrohungsmodell nie bewertet
Status: **fertig** — Urteil **freigegeben**, mit zwei Nacharbeiten, die die Freigabe nicht aufhalten

## Artefakte

| Datei | Was |
|---|---|
| `docs/bedrohungsmodell.md` 36.4 (A-V-11′) | Obergrenze berichtigt: **je Kalendertag und Prozeßlauf**, Tagesgrenze `24 + Zahl der Starts`, Grenzfall rund 8 250; Punkt (4) ergänzt um „**und nicht darüber hinaus**". Marke, Datum, alter Wortlaut nach A-A-70 |
| `docs/bedrohungsmodell.md` 19.1 (Urteil zu A-V-11) | dieselbe Zahl berichtigt, mit der eigenen Nachmessung |
| `docs/bedrohungsmodell.md` **Abschnitt 37** (neu) | Prüfung T-287: sechs eigene Messungen, die erste Bewertung der Spalte, die Neubewertung von R-19, das Urteil zu Migration 0022, R-23/R-24, sieben Befunde, drei neue Auflagen **A-V-26**, **A-V-27**, **A-A-77** |

Kein Produktivcode, keine Prüfdatei, keine Migration, keine fremde Datei geändert. Zwei
Meßdateien wurden eingesetzt und **im selben Befehl wieder entfernt** (`git status` danach
unverändert): eine Quelldatei unter `apps/local-api/src/features/version/` und eine
Beistelldatei im Migrationsverzeichnis.

## Zusammenfassung

Die zwei Zahlenstellen sind nachgezogen. Wichtiger ist der Befund, den der Auftrag richtig
vermutet hat: **Die Spalte aus T-279 war nie bewertet.** Sie ist jetzt bewertet — sie ist in der
Praxis der **Startzeitpunkt der letzten Sitzung auf die Sekunde**, sie sagt als einziger Wert
dieses Bestands etwas über **Benutzung ohne Buchung**, und sie ist der einzige Wert, den der
Benutzer durch keine Handlung wieder loswird. Gegenüber einem lokalen Prozeß ist das nichts
Neues, gegenüber dem Empfänger einer Datensicherung neu und klein. **Gering, sie bleibt,
eingehegt durch A-V-26.** An R-19 ändert der Tausch 24 → 8 250 nichts, und zwar aus einem Grund,
den ich in T-275 nicht genannt hatte: Die Versionsprüfung ist **kein Verstärker** — 10 474 ms je
Anfrage sind der langsamste Weg zu `api.github.com`, den ein lokaler Prozeß wählen kann. Der
Wächter `rueckweg` aus T-285 ist richtig gedacht und hat eine **gemessene Lücke**.

## Messungen (Windows 11, Node 22.23.2, pnpm 11.3.0)

1. **`pnpm proof:release-safety`: 35 bestanden / 0** — die Zahl aus T-285 bestätigt, nicht
   übernommen. Beide `rueckweg`-Gegenproben greifen.
2. **Verhalten des Prüfers**, `node --experimental-strip-types` gegen `version.ts`, eigene
   Attrappen, im Ablagebereich der Sitzung:
   - Dauerfehlschlag, Boden 300 ms, 1 500 ms Fenster: **5** Anfragen, Abstände **314/314/309/316 ms**
   - zwei nacheinander gebaute Prüfer, Boden **60 min**: **je 1** Anfrage → *ein Programmstart
     fragt immer einmal*, E-106 Punkt 1 gemessen
   - ein Lauf, Boden 60 min, 1 500 ms Fenster: **1** Anfrage → der Boden hält **innerhalb** des Laufs
3. **Die Lücke des Wächters:** ein roher `SELECT last_version_check_at …` als Datei in
   `apps/local-api/src/features/version/` → `proof:release-safety` bleibt **grün (35/0)**.
4. **Wo der Spaltenname steht** (mit derselben `stripComments` wie der Wächter): im **Code** vier
   Dateien (`repo-version-check.ts`, `repo-data-archive.ts`, `migrations.embedded.ts`,
   `data-transfer.ts`), nur im Kommentar vier weitere. Dazu: `GET`/`PATCH /settings` führt die
   Spalte nicht (`repo-settings.ts:147`), und die Liste der Exportquellen
   (`packages/export/src/sources.ts`, zwölf Einträge, abgeschlossen) kennt keinen Pfad in die
   Einstellungen — **eine Exportvorlage kann den Wert nicht erreichen**.
5. **Beistelldatei an der Migration:** `0022_….hinweis.md` danebengelegt, `pnpm proof:migrations`
   grün („44 Datei(en)"), Prüfsumme von 0022 unberührt. Der Läufer und der Erzeuger filtern beide
   auf `NNNN_name.(up|down).sql`.

6. **`pnpm typecheck`** über alle acht Pakete und die drei Prüfbäume: **grün** — zu Beginn dieser
   Prüfung war er allein wegen `apps/local-api/test/version/checker.test.ts` rot; T-286 ist
   zwischendurch gelandet.

**Nicht gemessen:** `pnpm check` im ganzen (`contrast`, `verify:bundle`, `test:coverage`,
`test:rust`, `build`, `audit`). Semgrep und 42Crunch stehen zum **sechsten** Mal nicht zur
Verfügung.

## Befunde

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| T-287-1 | Berichtigung | Die zwei Zahlenzeilen (36.4, 19.1) | security-checker, erledigt |
| **T-287-2** | **sollte** | **`rueckweg` mißt den Bezeichner, nicht den Zugriff** — roher `SELECT last_version_check_at` läßt den Lauf grün. Gegenmittel: den **Spaltennamen** als zweiten bewachten Namen, erlaubt in genau vier Dateien, mit der Meßdatei als dritter Gegenprobe (A-V-27) | domain-dev |
| T-287-3 | Hinweis | `docs/datenmodell.md`: „Er erscheint in keiner Route … in keiner Antwort" — die Datensicherung ist eine Route und antwortet mit dem Wert. Gegenmittel: „außer der Datensicherung (A-20.4)" | domain-dev |
| T-287-4 | Hinweis | Migration 0022 trägt den alten Zweck **und einen falschen Zeiger** („`run()` … liest"). `datenmodell.md` genügt als gültige Auskunft; die Beistelldatei ist gemessen und kostenlos | domain-dev |
| T-287-5 | Hinweis | R-19 gehören zwei Sätze angefügt (Wortlaut in 37.7) | Orchestrator |
| T-287-6 | Hinweis, **fünfte Meldung** | R-23 und R-24 weiterhin nie bewertet. Bestellung steht jetzt in 37.6. Empfehlung: **R-23 vorziehen** | Auftraggeber, Orchestrator |
| T-287-7 | Hinweis | Semgrep/42Crunch zum sechsten Mal nicht verfügbar | Auftraggeber, Orchestrator |

## Antworten auf die vier Fragen des Auftrags

**1. Nachgezogen.** A-V-11′ Punkte 1 und 4 trafen wörtlich zu; berichtigt sind die Obergrenze in
36.4 und das Urteil in 19.1, ergänzt ist „und nicht darüber hinaus". Es ist der **zweite** Nachzug
an A-V-11 binnen einer Woche — die Auflage nennt eine Zahl, wo sie eine Eigenschaft meint; die
Eigenschaft steht jetzt vorn, die 24 als ihre Folge.

**2. Die Spalte, bewertet.** Sie sagt: „zu diesem Zeitpunkt wurde SuperTakt zuletzt gestartet",
auf die Sekunde, in UTC. Sie sagt es auch dann, wenn nichts gebucht wurde — das kann sonst kein
Wert dieses Bestands. Sie entsteht ohne Zutun des Benutzers und verschwindet durch kein Zutun des
Benutzers; ein „zurücksetzen" gibt es nicht. Gegenüber VG-3 nichts Neues; gegenüber dem Empfänger
einer Datensicherung neu, aber klein neben den internen Vermerken und Kundennotizen derselben
Datei; gegenüber dem Netz nie (gemessen). **Gering; A-V-26 hält sie dort.**

**3. R-19: keine andere Bewertung, aber zwei neue Sätze.** Begründung neu und nicht wiederholt:
Die Frequenz zählt, wenn sie einen **Verstärker** ergäbe. Sie ergibt keinen — wer den Sidecar in
einer Schleife startet, ruft `api.github.com` unmittelbar schneller auf. Wo die Frequenz doch
wirkt, trifft sie die **Nachbarn**: 344/h sind das 5,7fache des GitHub-Kontingents einer
Quelladresse, und ein erschöpftes Kontingent klärt sich unter der geschärften A-18.11 nicht mehr
von selbst — die Aktualisierungsmeldung fällt dann für alle hinter dieser Adresse still aus. Dazu
der ehrliche Preis: **Jeder Programmstart ist jetzt von außen sichtbar**; der Inhalt hält A-18.12,
der **Zeitpunkt** ist selbst eine Angabe über die Nutzung. Mein Satz aus T-275 gilt weiter, aber
nur unter einer Bedingung: solange die Anfrage nichts trägt, das mit der Frequenz wächst.

**4. Migration 0022: `docs/datenmodell.md` genügt.** Drei Gründe in 37.5, der tragende: Zwischen
dem veralteten Text und dem Schaden steht ein Wächter — wer die Migration für gültig hält und den
Rückweg nachbaut, wird rot. **Dieser Grund trägt allerdings nur halb, solange T-287-2 offen ist.**
Statt einer Auflage: die Regel **A-A-77** (ein Migrationstext ist ein Zeitzeuge) und die gemessene
Beistelldatei.

## Annahmen

1. Die Berichtigungen stehen **an Ort und Stelle** mit Marke, Datum und altem Wortlaut (A-A-70),
   statt A-V-11 ein drittes Mal neu zu fassen. Eine dritte Fassung derselben Auflage binnen einer
   Woche schadet mehr, als sie klärt.
2. Der Kopf des Papiers („Stand: T-156") ist **nicht** angefaßt — er ist seit Abschnitt 21 nicht
   fortgeschrieben worden, und ein einzelner Nachzug jetzt würde die Reihe nur ungleich machen.
   Wenn er gepflegt werden soll, ist das ein eigener Auftrag.
3. Die Meßdateien aus Messung 3 und 5 lagen für die Dauer eines Befehls in fremder Hoheit und sind
   im selben Befehl entfernt worden. Anders ist ein Wächter nicht prüfbar.

## Risiken

1. **T-287-2 ist der einzige Befund mit Sicherheitsgewicht.** Der Wächter ist heute die einzige
   Sicherung zwischen einem präparierten Archiv und einer still abgeschalteten Versionsprüfung.
2. **R-23 und R-24 bleiben unbewertet**, beide „hoch". Fünfte Meldung.
3. Semgrep und 42Crunch fehlen weiterhin; die Lieferkette ist unbelegt.

## Offene Fragen an den Orchestrator

- Nimmst du T-287-2 in dieselbe Welle wie T-286? Es ist eine Erweiterung an einem Skript, das
  domain-dev gerade erst angefaßt hat, und die Gegenprobe existiert bereits als Meßdatei.
- R-19: Die zwei Sätze stehen im Wortlaut in 37.7 bereit; `risks.md` gehört dir.
- R-23 vorziehen? Die Frage, die mich daran am meisten interessiert, ist neu und billig zu klären:
  **Bleibt das Zertifikat nach einer Deinstallation im Wurzelspeicher stehen?**

## Nächster Schritt

Eine Welle mit drei Aufträgen, die sich nicht berühren: **domain-dev** erweitert `rueckweg` um den
Spaltennamen (T-287-2) und zieht die zwei Sätze in `datenmodell.md` nach (T-287-3, T-287-4),
**unit-tester** beendet T-286, **du** ergänzt R-19. Danach `pnpm check` einmal vollständig.
