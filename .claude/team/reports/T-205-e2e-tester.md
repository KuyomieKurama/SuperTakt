# T-205 — e2e-tester: die Rückführung bekommt ihren Prüffall, zwei Zitate berichtigt

**Rolle:** e2e-tester **Zweig:** `versionspruefung-gegen-github`
**Dateihoheit:** `tests/e2e/**`, `tests/fixtures/**`, `docs/testplan.md`

Über den Wortlaut gesucht (`git grep`, versionierte Dateien), nicht über den rohen Arbeitsbaum
(E-087, Zusatz aus `CLAUDE.md`) — dort liegen Bauergebnisse mit veralteten Kopien.

---

## 1. O-IE — Prüffall für die Rückführung zum ungültigen Feld (T-202, Befund O-FR 4.3)

**Neu:** zweiter Testfall in `tests/e2e/field-live-region-announcement.spec.ts`
(`test.describe('Rückführung zum ungültigen Feld nach gescrolltem Absendeversuch (O-IE,
Behebung aus T-202)', …)`).

### Die Falle zuerst ausgeschlossen

Der bestehende erste Testfall dieser Datei klickt „Anlegen" über einen Playwright-Locator direkt
an. Gemessen (Scratch-Lauf, verworfen): Der Absendeknopf steht im `.dialog__footer`, außerhalb des
rollenden Rumpfes (`.dialog__body--form`, `max-height: 60vh`) — ein Klick dorthin braucht keinen
Bildlauf, `scrollTop` bleibt vor und nach dem Klick bei `0`. Zwei Messungen einfach an diesen Fall
angehängt wären deshalb **unabhängig von der Behebung** immer grün gewesen — ein Nachweis über
nichts. Deshalb erreicht der neue Fall den Absendeknopf über die echte Tabulatortaste (Bauart wie
`toast-tab-order-scroll.spec.ts`), wodurch der Fokus durch den mehrzeiligen Vermerk nahe dem
unteren Rand läuft und der Browser den Rumpf tatsächlich scrollt.

### Gemessen (echter Chromium, `pnpm exec playwright test`)

```
vor dem Absenden (Fokus auf "Anlegen"):
  scrollTop=107 (von 107 möglichen)
  Titelblock: y=42.8, Höhe 55.8 → unterer Rand 98.6, oberhalb des sichtbaren Rumpfes (y=149.8)

nach dem Absenden über die Eingabetaste:
  scrollTop=0
  document.activeElement = Titelfeld, aria-invalid="true"
```

Der Testfall führt beide Vorbedingungsprüfungen (scrollTop>0, Titelblock unterer Rand ≤ Rumpf-
Oberkante) selbst als `expect(...)` — nicht nur als Kommentar —, damit ein künftiger Umbau, der die
Vorbedingung stillschweigend aufhöbe, den Fall ebenfalls rot macht statt ihn heimlich trivial zu
machen.

### Wäre der Fall vor T-202 rot gewesen? Ja — geprüft, nicht behauptet

T-202s Änderungen an `apps/web/src/lib/focus.ts` und `apps/web/src/components/FormDialog.tsx`
sind zum Zeitpunkt dieser Aufgabe unversioniert (`git status` zeigt sie als `M`, letzter Commit
ist `d5440b2`, vor T-202). `git show HEAD:apps/web/src/components/FormDialog.tsx` zeigt den Stand
davor: `revealFirstInvalidWithin` existiert dort nicht, und die einzige `scrollIntoView`/`focus`-
Stelle jener Fassung gilt dem **Server**-Fehler (`errorRef`, aus `mutation.error`) und dem ersten
Feld beim **Öffnen** des Dialogs — keine von beiden greift beim hier geprüften, rein clientseitig
abgewiesenen leeren Pflichtfeld (`TodoFormDialog.tsx` bricht vor jedem Netzwerkaufruf ab,
`mutation.error` bleibt `null`). Ohne die Behebung bliebe der Fokus auf dem Absendeknopf und
`scrollTop` bei `107` — beide neuen Messungen schlügen fehl. Ein tatsächlicher Umbau der beiden
Dateien auf den alten Stand im selben Lauf wurde **nicht** vorgenommen (Dateihoheit frontend-dev,
nicht e2e-tester; ein `git stash` darauf wurde vom Berechtigungssystem zu Recht verweigert). Die
Antwort stützt sich stattdessen auf `git show` (reines Lesen) plus den Vergleich mit den im
T-202-Bericht selbst gemessenen Zahlen (`scrollTop=67`→`0`, Fokus „Anlegen"→Titelfeld auf der
Musterseite) — dieselbe Größenordnung, andere Stelle (echter `TodoFormDialog` statt Musterseite).

### Nachbarfund O-GZ (nicht behoben, nur gemeldet)

Der T-202-Bericht zählt neun Formulardialoge, die ihren Absendeknopf sperren (`submitDisabled`)
statt beim Absenden zu prüfen — dort greift die Rückführung nicht, weil kein Absendeversuch
stattfindet. Der neue Testfall berührt keinen dieser neun (bleibt beim „Neues Todo"-Dialog). Kein
eigener Fund dieser Aufgabe, nur zur Kenntnis, wie im Auftrag verlangt.

---

## 2. O-HU, O-HW — zwei Zitate in `docs/testplan.md` berichtigt

Gesucht über `git grep` (E-087-Zusatz), gegen den tatsächlichen Stand der Produktdateien geprüft
(ebenfalls `git grep`/`sed`, nicht der rohe Arbeitsbaum).

### O-HU — `ExportAudit`, zweimal alter Wortlaut, einmal mit gefallener Kennung (T-197)

- **Zeile ~1854 (TP-EXPST-11):** zitierte „… Das Feld ist freiwillig (E-047) …". `git grep` gegen
  `apps/web/src/components/ExportAudit.tsx:170` zeigt den heutigen Satz ohne Kennung und mit
  anderer Fortsetzung: „… freiwillig — protokolliert ist trotzdem, dass hier jemand Zeit ohne
  Abrechnung abgehakt hat, und wann." Berichtigt auf den vollständigen, heutigen Satz, mit einem
  Halbsatz, der T-197 als Quelle nennt.
- **Abschnitt 27 (O-GJ-Eintrag zu `export-mixed-status-and-billing.spec.ts:128`):** beschrieb die
  Streichung der Kennung als frontend-devs **künftigen** Zug („Sie soll aus dem Wortlaut
  verschwinden") und nannte „den heutigen Satz (mit `(E-047)`)" — beides war zum Zeitpunkt der
  Aufgabe (T-187) richtig, ist es seit T-197 nicht mehr. Tempus auf Vergangenheit korrigiert und
  ein Nachtrag ergänzt, der die eingetretene Streichung und den weiterhin tragenden
  Teilzeichenkettenvergleich festhält.

Beleg, dass beide Fundstellen zusammengehören: `.claude/team/reports/T-197-frontend-dev.md` nennt
sie selbst so („docs/testplan.md zitiert den alten Wortlaut zweimal, einmal noch mit Kennung …
Das gehört e2e-tester").

### O-HW — `IMPERATIV_AUSNAHME` im Präsens, obwohl seit T-199 gelöscht

Abschnitt 28 (O-GE-Eintrag zu `outlook-addin-build.spec.ts:65`) beschreibt in einem
vorausschauenden Absatz, was geschehen **wird**, wenn `App.tsx` gesiezt wird: der
Teilzeichenkettenvergleich bleibt grün, `IMPERATIV_AUSNAHME` erkennt keinen Treffer mehr und wird
durch den eigenen Selbstauflösungs-Prüffall aus T-190 rot. `git grep` gegen
`apps/outlook-addin/scripts/proof-addin.mjs` bestätigt: Genau das ist eingetreten, T-199 hat die
Ausnahme bereits gelöscht (`IMPERATIV_VORHER`/`IMPERATIV_NACHHER` als Beispiel, keine Ausnahme
mehr) und `App.tsx` steht seit T-199 gesiezt. Ein Nachtrag hält das fest, die ursprüngliche
Beschreibung bleibt als korrekter Stand von T-192 unangetastet stehen. Beleg:
`.claude/team/reports/T-199-integration-dev.md` Zeile 160 nennt dieselbe Stelle ausdrücklich als
„Hoheit e2e-tester".

Beide Berichtigungen ändern keinen Prüffall und keinen Ausgang — reiner Fließtext. Ein neuer
Abschnitt „## 29. Nachtrag aus T-205" am Dateiende fasst beide Korrekturen und den neuen Testfall
zusammen (gleiche Konvention wie die 28 Abschnitte davor).

---

## 3. Nachweis: `pnpm test:e2e` vollständig

```
$ playwright test -c tests/e2e/playwright.config.ts
  100 passed (2.4m)

$ playwright test -c tests/e2e/playwright.version-check.config.ts
  5 passed (48.7s)

$ playwright test -c tests/e2e/playwright.attachment-persistence.config.ts
  2 passed (2.8s)
```

**107/107 grün, 0 rot.** Vorher (laut Auftrag) 106/106 — die Differenz ist genau der eine neue
Testfall aus Abschnitt 1. Kein Fehlschlag, keine Übersprungenen (`grep -c "✗\|failed\|Error"` im
Log: 0 Treffer außer den unschädlichen Node-`ExperimentalWarning`-Zeilen zu SQLite).

Zusätzlich `pnpm exec tsc -p tests/e2e/tsconfig.json --noEmit`: 0 Fehler.

`pnpm test` und `proof:all` wurden in dieser Aufgabe **nicht** erneut gefahren — außerhalb meiner
Dateihoheit betroffen (`apps/web/src/lib/touched.ts` bei frontend-dev, Prüfdateien bei
unit-tester), und die Lage laut Auftrag war bereits grün (1456/1456, 19 Pfade).

---

## Kurzfassung

```
Aufgabe: T-205 — O-IE (Prüffall für die Rückführung zum ungültigen Feld, T-202), O-HU/O-HW
         (zwei veraltete Zitate in docs/testplan.md berichtigt)
Status: fertig
```

**Artefakte:**
- `tests/e2e/field-live-region-announcement.spec.ts` — neuer zweiter Testfall (O-IE)
- `docs/testplan.md` — TP-EXPST-11-Zitat berichtigt, Abschnitt 27 (O-GJ) und Abschnitt 28 (O-GE)
  je um einen Nachtrag ergänzt, neuer Abschnitt „29. Nachtrag aus T-205"

**Zusammenfassung:** Der neue Testfall erreicht den Absendeknopf des „Neues Todo"-Dialogs über die
echte Tabulatortaste statt per direktem Klick, weil nur so der Rumpf tatsächlich scrollt (Klick
allein hält `scrollTop` bei `0`, ein daran angehängter Fall wäre unabhängig von der Behebung immer
grün gewesen); gemessen wird `scrollTop=107` mit dem Titelblock außerhalb des Sichtbereichs vor
dem Absenden und `scrollTop=0` mit Fokus auf dem `aria-invalid`-Titelfeld danach. Per `git show
HEAD:…FormDialog.tsx` bestätigt: Der Fall wäre vor T-202 tatsächlich rot gewesen, weil die
Vorgängerfassung keine Fokus-/Bildlauf-Reaktion auf einen clientseitig abgewiesenen leeren
Pflichtwert kennt. Zusätzlich sind zwei veraltete Zitate in `docs/testplan.md` berichtigt — die
Kennung `(E-047)`, die T-197 aus `ExportAudit.tsx` entfernt hat, und `IMPERATIV_AUSNAHME`, die
T-199 aus `proof-addin.mjs` gelöscht hat — beide waren von den jeweiligen Aufgaben selbst als
e2e-testers Zug benannt worden. `pnpm test:e2e` läuft vollständig mit 107/107 grün (vorher 106/106,
Differenz der eine neue Fall).

**Annahmen:**
1. Zwei feste Werte (`scrollTop=107`, Titelblock-Koordinaten) sind an das heutige Feldset des
   „Neues Todo"-Dialogs gebunden, nicht an eine Konstante im Code — ein künftig hinzukommendes
   Formularfeld ändert die genaue Zahl, nicht die Prüfrichtung (`toBeGreaterThan(0)` bzw. die
   Kantenbeziehung, nicht die exakten 107px).
2. Die Tabulatorschleife läuft bis zum erreichten Namen „Anlegen" (Obergrenze 30 Versuche), nicht
   über eine feste Anzahl Tastendrücke — robuster gegenüber künftigen Feldern als eine harte Zahl.
3. Die „wäre-rot"-Frage wurde über `git show` (reines Lesen der Vorgängerfassung) beantwortet,
   nicht über einen tatsächlichen Rücksprung des laufenden Codes — ein `git stash` auf
   `focus.ts`/`FormDialog.tsx` wurde vom Berechtigungssystem verweigert (fremde Dateihoheit), was
   ich für richtig halte.
4. Bei den beiden Testplan-Korrekturen habe ich die ursprünglichen, zum jeweiligen Zeitpunkt
   korrekten Formulierungen stehen lassen und mit einem „Nachtrag" ergänzt, statt sie zu
   überschreiben — dieselbe Konvention wie in den bestehenden 28 Abschnitten dieser Datei
   („berichtigt" statt stillschweigend ersetzt).

**Risiken:** Keine sicherheitsrelevanten. Der neue Testfall hängt an der Baumform des Formulars
(gleiche Einschränkung wie `fieldBlockWithin` selbst, siehe Kopfkommentar von `focus.ts`) — ein
Dialogrumpf-Umbau, der die Tabulatorreihenfolge grundlegend ändert, könnte die Obergrenze von 30
Tabulatorschritten treffen; das würde den Fall sichtbar rot machen (`expect(reachedSubmitButton
).toBe(true)`), nicht still grün bleiben.

**Offene Fragen:** Keine an den Orchestrator. Der O-GZ-Nachbarfund (neun Dialoge mit gesperrtem statt
prüfendem Absendeknopf) bleibt bei spec-ux-reviewer, wie im Auftrag benannt — dieser Aufgabe hat
keinen der neun berührt.

**Nächster Schritt:** Sobald spec-ux-reviewer über die Bauart mit gesperrtem Absendeknopf (O-GZ)
entschieden hat, ggf. weitere Prüffälle für die betroffenen neun Dialoge, falls die Entscheidung
zugunsten einer prüfenden statt sperrenden Bauart fällt.
