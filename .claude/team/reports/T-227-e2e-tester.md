# T-227 — Der eine Riegel an neun Dialogen, und jetzt sieht ihn ein Lauf (O-KC), ein Zwilling von O-IW behoben (O-KB)

**Rolle:** e2e-tester **Zweig:** `versionspruefung-gegen-github`
**Dateihoheit:** `tests/e2e/**`, `tests/fixtures/**`, `docs/testplan.md`

---

## 1. O-KC — `tests/e2e/form-dialog-submit-guard.spec.ts` (neue Datei)

**Anlaß.** T-220 hat alle neun Formulardialoge mit `submitDisabled` (E-093) von `disabled` auf
`aria-disabled` umgestellt. Der Absendeknopf ist seither tabulierbar und klickbar; daß die
**Handlung** trotzdem nicht läuft, ist keine bauliche Eigenschaft eines `disabled`-Attributs mehr,
sondern **eine Zeile** im gemeinsamen `submit` von `FormDialog.tsx` (`if (submitDisabled) return;`,
nach dem Zählen des Versuchs). T-220 hat das selbst als dringlichsten Folgeauftrag benannt: „Der
Riegel ist ab heute die einzige Sicherung, und kein Lauf sieht ihn. […] Wer sie umstellt […], macht
acht Dialoge still, und alle heutigen Prüffälle blieben grün."

**Warum eine Datei und ein Ort genügen.** Der Riegel steht zentral für alle neun Aufrufstellen; ein
einziger, an einer realen Stelle gemessener Fall bewacht ihn für alle neun — dieselbe Überlegung,
die den strukturell verwandten, aber eigenständigen Torwächter in `ConfirmDialog.tsx#confirmOrExplain`
bereits trägt (TP-EXPST-15/O-GZ). Gewählt: `TagsScreen` „Neuen Tag anlegen" — das einfachste der
neun Formulare (ein Pflichtfeld, keine zweite Sperrbedingung, kein `busy`-Zwischenschritt) und
dieselbe Stelle, an der T-220 im Browser selbst gemessen hat.

**Drei Messungen, nicht zwei — die dritte ist die, die sonst fehlt.** Ein Fall, der nur zeigt, daß
die Meldung erscheint und die Handlung ausbleibt, mißt einen Knopf, der **niemals** auslöst — nicht
von einem funktionierenden Riegel unterscheidbar, beide bestünden die ersten zwei Messungen
identisch. Erst die dritte Messung („mit gefülltem Feld läuft dieselbe Handlung sofort, mit
demselben Knopf, ohne erneuten Dialogaufbau") macht daraus einen Nachweis. Zwei Fälle, je drei
Messungen:

1. **Klick.** Gesperrter Knopf → `{ force: true }` (Playwright hält `aria-disabled="true"` für
   nicht bedienbar, T-192/TP-EXPST-15, hier zum ersten Mal an einem `FormDialog`-Absendeknopf
   angewendet statt am `ConfirmDialog`) → Meldung „Name fehlt." am selben, vorher leeren
   `role="alert"`-Knoten → **die Handlung läuft nicht**, geprüft an zwei unabhängigen Stellen, nicht
   am Augenschein: kein `POST` an `/api/v1/tags` (`page.on('request', …)`, gefiltert) **und**
   unveränderter Bestand (`listTags()` vor/nach, ID-Mengen verglichen) — Dialog bleibt zusätzlich
   offen. Danach Feld gefüllt, `aria-disabled` fällt, derselbe Knopf ohne `force` geklickt: Anfrage
   läuft, Dialog schließt, das neue Tag steht im Bestand.
2. **Eingabetaste.** Fokus liegt beim Öffnen bereits auf dem einzigen Feld
   (`FIRST_FIELD_SELECTOR`) — kein Tabulatorschritt nötig, um „frisch geöffnet" zu treffen. Enter
   auf dem leeren Pflichtfeld: dieselben drei Messungen wie beim Klick, jetzt über die Taste.

**Die Enter-Hälfte von E-093 — festgehalten, nicht neu behauptet.** T-217 hat am **damaligen**
Bauzustand (hartes `disabled`) gemessen: Enter im frisch geöffneten Dialog war ein stummer Leerlauf
— kein Netzaufruf, leere Meldefläche, bitgleiches Bild. Dieser Bauzustand existiert im heutigen
Quelltext nicht mehr und ist ohne einen Rückbau von `FormDialog.tsx` (fremde Dateihoheit) nicht
nachstellbar; er steht im Dateikopf als zitierter historischer Befund, nicht als nachgestellter
Prüfschritt. Automatisiert gemessen wird die **heutige** Umkehrung, von T-220 im Browser gesehen und
hier erstmals automatisiert: Enter greift sofort in denselben Riegel wie ein Klick. Vor dieser Datei
war „Absenden über die Eingabetaste an einem `submitDisabled`-Dialog" in keinem Prüffall gegangen —
`field-live-region-announcement.spec.ts` prüft Enter nur am „Neues Todo"-Dialog (führt kein
`submitDisabled`), `export-audit-and-locks.spec.ts` (O-GZ) prüft den `ConfirmDialog` nur per Klick.

**Ergebnis: bestanden**, 2/2, beide neu (siehe Nachweis, Abschnitt 3).

---

## 2. O-KB — der O-IW-Zwilling in `export-audit-and-locks.spec.ts:318` behoben

**Anlaß.** T-224 hat beim Bau von O-IW denselben Befund ein zweites Mal gefunden:
`export-audit-and-locks.spec.ts:318` band eine Meßentscheidung an den im Wortlaut zitierten Titel
des „Neues Todo"-Dialogs statt an eine Befundkennung, obwohl diese Datei den Titel selbst nirgends
prüft. T-224 hat das ausdrücklich außerhalb des eigenen Auftrags belassen. Hier nachgezogen: der
Verweis ist auf die Befundkennung O-DA und die tatsächlich prüfende Datei
(`field-live-region-announcement.spec.ts`) umgestellt — dieselbe Berichtigung, dieselbe Begründung
wie bei O-IW in T-205. Reiner Kommentartext, kein Prüffall und kein Ausgang geändert; O-GZ bleibt
unverändert grün (siehe Lauf, Fall 35).

---

## 3. Testplan geprüft und nachgezogen (`docs/testplan.md`)

- **Abschnitt 28 (TP-EXPST-15, T-192).** Geprüft, ob der Playwright-Falle-Hinweis noch richtig
  steht, jetzt wo neun weitere Dialoge dieselbe Falle tragen: Der Absatz bleibt **wörtlich richtig**
  — er behauptet nie Exklusivität für den `ConfirmDialog`. Ergänzt um einen Verweis auf
  `form-dialog-submit-guard.spec.ts`, damit sichtbar ist, daß dieselbe Falle inzwischen an einem
  zweiten, eigenständigen Baustein gilt und dort einen eigenen Prüffall hat.
- **Abschnitt 29 (O-GZ-Nachbar).** Der Absatz „Zur Bauart mit gesperrtem Absendeknopf" beschrieb den
  Stand **vor** T-220 korrekt: keine Rückführung, offene Produktfrage. Beides ist durch T-220
  überholt (die Rückführung aus O-IE läuft seit T-220 auch an den neun `submitDisabled`-Dialogen
  mit; E-093 hat sich für „gesperrt **und** Rückführung zugleich" entschieden). Berichtigt mit einer
  angehängten Nachtragsnotiz, der historische Text bleibt unverändert stehen (dieselbe Vorgehensweise
  wie bei O-HU/O-HW in Abschnitt 29).
- **Neuer Abschnitt 31** faßt O-KC, O-KB und beide Testplan-Berichtigungen zusammen.

---

## 4. Nachweis: `pnpm test:e2e` vollständig, mit Zahlen

Vorbereitung: Ein verwaister `vite --port 5173`-Prozeß (≈2 Stunden alt, keine laufende Aufgabe
zugeordnet, lief unter derselben Kennung wie frühere manuelle Messungen von frontend-dev) belegte den
Port vor dem Lauf; beendet, danach war der Port frei — „der Port gehört in dieser Welle dir" trug.

```
$ pnpm test:e2e

playwright.config.ts:                    103 Fälle, 103 grün, 0 rot   (2,4 min)
playwright.version-check.config.ts:        5 Fälle,   5 grün, 0 rot   (48,7 s)
playwright.attachment-persistence.config.ts: 2 Fälle,  2 grün, 0 rot  (2,8 s)

Gesamt: 110 Fälle, 110 grün, 0 rot. Exit-Code 0.
```

**Eigene Fälle in diesem Lauf:** die zwei neuen in `form-dialog-submit-guard.spec.ts` (Fälle 54/55
der Hauptreihe) — beide grün, keine Wiederholung nötig (kein `(flaky)`-Vermerk). Der Kommentarumbau
in `export-audit-and-locks.spec.ts` (O-KB) ändert keinen Ausgang; Fall 35 (O-GZ) bleibt unverändert
grün.

**TP-FOCUS-07 — der Fall, den ich selbst absichtlich vor seiner Behebung gebaut habe (T-224): jetzt
grün, und das ist die Bestätigung.** Fall 52 der Hauptreihe (`focus-return-after-dialog.spec.ts:400`)
bestand in diesem Lauf. Grund, geprüft am Diff: `apps/web/src/components/ExportGroups.tsx` trägt seit
T-226 (`.claude/team/reports/T-226-frontend-dev.md`, im Arbeitsbaum als Änderung sichtbar) nur noch
**einen** Baustein (`Button`, Ausprägung `secondary`/`ghost` je nach `entry.note`, Beschriftung
„Leistung nachtragen"/„Leistung bearbeiten" plus verborgenem Zeilenbezug) statt des vorherigen
Wechsels zwischen `Button` und `IconButton`. Damit überlebt der Auslöseknoten seine eigene
Auffrischung nach `bump()`, und die zweite Messung von TP-FOCUS-07 (derselbe Knoten hält den Fokus
auch nach der Auffrischung) besteht jetzt — genau die Eigenschaft, die der Fall seit T-224 mißt,
nicht sein Wortlaut. Kein eigener Fund dieser Aufgabe, sondern Bestätigung fremder Arbeit durch einen
eigenen, vorbereiteten Prüffall.

**Fremde Fehlschläge:** keine. Alle 110 Fälle grün, kein Retry, kein Fremdbefund aus der
gleichzeitig laufenden Arbeit von frontend-dev in `apps/web/src` beobachtet.

Zusätzlich: `pnpm exec tsc -p tests/e2e/tsconfig.json --noEmit` → **0 Fehler**.

`pnpm typecheck` (0) und `pnpm test` (1464/1464) waren laut Koordinator bereits vor diesem Lauf
geprüft und wurden hier nicht erneut gefahren (außerhalb der eigenen Dateihoheit, `apps/web/src`
läuft parallel unter frontend-dev).

---

## 5. Sanity-Check der neun Pflichtabläufe (keine Lücke gefunden, kein Bau in dieser Aufgabe)

Kurz gegen den bestehenden Bestand von `tests/e2e/*.spec.ts` geprüft, ob jeder der neun
Pflichtabläufe der Rollenbeschreibung einen Testfall trägt: erledigtes Todo wiederbeleben
(`todo-revival.spec.ts`), Export von Anfang bis Ende mit Statusprüfung (`export-end-to-end.spec.ts`),
Notiz-Trennung (`note-separation.spec.ts`), Exportstatus in mehreren Ansichten
(`export-mixed-status-and-billing.spec.ts`), Tag-Ordner vier Ebenen tief (`tags-folders.spec.ts`),
Standard-Tags auf UI-Erstellung (`tag-input.spec.ts`, TAGINPUT-04) und auf Add-in-Erstellung sowie
Add-in mit vorhandenem Call (beide über `apps/outlook-addin/scripts/proof-addin.mjs`, außerhalb von
`tests/e2e/**`, da Office.js dort ohne echten Host läuft), Kanban Drag & Drop (`kanban.spec.ts`),
abweichende Exportvorlage (`export-template-validation.spec.ts`, `note-separation.spec.ts`). Alle
neun sind aus früheren Wellen vorhanden; kein Neubau in dieser Aufgabe, da der Auftrag ausdrücklich
auf O-KC, O-KB und den vollen Lauf zielte.

---

## Kurzfassung

```
Aufgabe: T-227 — O-KC (der eine Riegel in FormDialog.tsx#submit, drei Messungen, Klick und Enter),
         O-KB (Zwilling von O-IW behoben)
Status: fertig
```

**Artefakte:**
- `tests/e2e/form-dialog-submit-guard.spec.ts` (neu) — zwei Fälle, O-KC
- `tests/e2e/export-audit-and-locks.spec.ts` — Kommentar berichtigt, O-KB (kein Ausgang geändert)
- `docs/testplan.md` — Abschnitt 28 ergänzt, Abschnitt 29 berichtigt, neuer Abschnitt 31

**Zusammenfassung:** Der seit T-220 einzige Riegel gegen die Handlung an neun Formulardialogen
(`FormDialog.tsx#submit`, `if (submitDisabled) return;`) hatte keinen Prüffall; `form-dialog-
submit-guard.spec.ts` mißt ihn jetzt an einer realen Stelle („Neuen Tag anlegen") mit je drei
Messungen für Klick und Eingabetaste — Meldung erscheint, Handlung bleibt aus (Netzverkehr und
Bestand, nicht Augenschein), und mit gefülltem Feld läuft sie sofort, ohne die dritte Messung wäre
ein dauerhaft schweigender Knopf nicht von einem funktionierenden Riegel zu unterscheiden. Der von
T-224 in eine andere Datei verschleppte Zwilling des O-IW-Befunds (ein Wortlaut-Zitat statt einer
Befundkennung) ist in `export-audit-and-locks.spec.ts` derselben Berichtigung unterzogen. Der volle
Lauf steht bei 110 Fällen, 110 grün, 0 rot — darunter TP-FOCUS-07, der eigens vor seiner Behebung
gebaute, absichtlich rote Fall aus T-224, jetzt grün als Bestätigung von T-226s Umbau von
`ExportGroups.tsx` auf einen einzigen überlebenden Baustein. Der Testplan ist an zwei Stellen um
Berichtigungen ergänzt (T-192-Hinweis, O-GZ-Nachbar-Absatz), ohne den historischen Text zu
verfälschen.

**Annahmen:**
1. Ein Prüffall an einer realen Stelle genügt für den zentralen Riegel — der Code ist für alle neun
   Dialoge identisch (`FormDialog.tsx#submit`), ein zweiter, dritter … Fall an einem der übrigen
   acht Dialoge würde denselben Codepfad ein zweites Mal messen, nicht einen zusätzlichen.
2. Die neun Pflichtabläufe der Rollenbeschreibung wurden nur gegengeprüft (Abschnitt 5), nicht neu
   gebaut — der Auftragstext benannte explizit O-KC, O-KB und den vollen Lauf als Gegenstand dieser
   Welle.
3. `page.on('request', …)` gefiltert auf `POST` und `.../api/v1/tags` ist die schärfere der beiden
   verlangten Prüfarten (Netzverkehr); der Bestandsabgleich über `listTags()` läuft zusätzlich, nicht
   ersatzweise.

**Risiken:** Keine sicherheitsrelevanten. Der neue Prüffall hängt an der URL-Form
`http://127.0.0.1:17843/api/v1/tags` (`API_BASE_URL`, `support/session.ts`) — ändert sich diese
Grundadresse, würde der Netzverkehrs-Filter keine Treffer mehr sehen und Messung 3 (Netzaufruf nach
dem Füllen) fehlschlagen, nicht still grün bleiben.

**Offene Fragen:** Keine an den Orchestrator.

**Nächster Schritt:** Aus e2e-Sicht keiner mehr offen für diese Welle. Der von T-224 vorgeschlagene
`proof:dual-widget-swap`-Wächter (Testplan Abschnitt 30, R-6) bleibt ein Vorschlag für frontend-dev
(`apps/web/scripts/**`), unverändert nicht Gegenstand dieser Aufgabe.
