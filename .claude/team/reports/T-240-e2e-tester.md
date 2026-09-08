# T-240 — Der Zustand ohne Prüffall (O-KQ), eine Zusicherung über der leeren Menge (O-KR), ein dritter O-IW-Fundort

**Rolle:** e2e-tester **Zweig:** `versionspruefung-gegen-github`
**Dateihoheit:** `tests/e2e/**`, `tests/fixtures/**`, `docs/testplan.md`

---

## 1. O-KQ — `TP-ANH-22`: der dritte Zustand von `AttachmentOpenDialog` bekommt seinen ersten Prüffall

**Anlaß.** Der dritte Dialogzustand (`blocked`, V-07: „Diese Datei wird nicht geöffnet", kein
Öffnen-Knopf) hatte keinen einzigen Prüffall — gemessen über den Wortlaut und über den ganzen
Arbeitsbaum, nach beiden Wegen aus `CLAUDE.md` (`git grep` und ein roher Lauf über die
Quellverzeichnisse): „Diese Datei wird nicht geöffnet", `foreseenRefusal` und
`foreseeableRefusalOf` kommen in `tests/**`/`apps/*/test/**` null mal vor.

**Die Falle im Auftrag.** `checkAttachmentPath` (`packages/domain/src/attachment.ts:826-837`) weist
eine Umleitungsendung (`.lnk`, `.url`, `.pif`, `.scf`, `.desktop`) und einen Dateinamen mit
Doppelpunkt (A-A-28) inzwischen **an der Tür** ab. Über `createAttachment` — Oberfläche wie Add-in —
läßt sich eine solche Zeile also nicht mehr anlegen; der dritte Dialogzustand trifft nur noch einen
**Altbestandswert**. Gelöst ohne Produktivänderung: `overwriteAttachmentTargetDirectly` (neue
Funktion, `tests/e2e/support/db.ts`) legt eine Zeile ganz regulär über die Tür an
(`createAttachment` mit einem heute zulässigen Pfad) und überschreibt danach **nur** die Spalte
`target` an der Tür vorbei — dieselbe Bauart wie die bereits vorhandenen
`overwriteTodoTitleDirectly` (für `titleSchema`) und `deleteAttachmentRowDirectly` (für den
Aufräumlauf). Das ist kein Umgehen der Prüfung: Es ist der einzige Weg, den Bestandszustand
herzustellen, für den dieser Dialogzweig überhaupt gebaut wurde — eine Zeile, die vor der
Verschärfung entstand oder an der Tür vorbei geschrieben wurde (VG-1, VG-3, wie im Kopf von
`checkAttachmentPath` selbst benannt). Der Kopf der neuen Funktion trägt diese Begründung, damit sie
am Ort steht, an dem sie gebraucht wird.

**Der neue Fall** (`tests/e2e/attachment-open-commands.spec.ts`, `TP-ANH-22`-Block):

1. Ein Anhang entsteht über die Tür mit einem Platzhalterpfad, dessen `target` anschließend per
   `overwriteAttachmentTargetDirectly` auf einen Pfad mit `.lnk`-Endung gesetzt wird.
2. „Datei öffnen" klicken → Dialog „Diese Datei wird nicht geöffnet" erscheint, nennt den vollen
   Pfad und das Wort „Verknüpfung".
3. Kein „Öffnen"-Knopf, kein „Ausführen"-Knopf (`toHaveCount(0)`, jeweils auf den Dialog
   gescoped) — nur „Schließen".
4. **Die tragende Zusicherung, wie vom Prüfer verlangt:** `window.__taktOpenAttachmentFileCalls__`
   bleibt **0** — vor und nach dem Klick auf „Schließen". Nicht die Überschrift zählt, sondern daß
   der Öffnen-Befehl der Hülle kein einziges Mal gelaufen ist.
5. Gegenprobe (E-094 Punkt 3): ein zweiter, unveränderter Dateianhang am selben Todo zeigt, daß
   derselbe „Öffnen"-Knopf und derselbe „wird geöffnet"-Dialog tatsächlich erscheinen, wenn keine
   Umleitung im Weg steht — die `toHaveCount(0)`-Zusicherungen oben sind damit keine Zusicherungen
   über eine grundsätzlich leere Menge.

**Rot vor Grün, gemessen (Auflage des Prüfers: die Zusicherung geht auf die Wirkung).** Mit
unversehrtem Produktivcode und `toBe(1)` statt `toBe(0)` an der tragenden Zeile:
`Expected: 1, Received: 0` — **1 failed, Code 1.** Zurückgesetzt auf `toBe(0)`: **1 passed, Code 0.**
Das belegt, daß die Zusicherung den echten Wert aus der Seite liest und nicht trivial besteht — ein
Fall, der nur die Überschrift läse, hätte diesen Unterschied nicht zeigen können.

## 2. O-KR — die Zusicherung über der leeren Menge in `attachment-open-commands.spec.ts:70` (E-094 Punkt 3)

**Anlaß.** `await expect(page.getByRole('alertdialog', { name: /Diese Datei wird/ })).toHaveCount(0)`
war richtig in der Sache, aber ohne jeden Beleg, daß der Ausdruck bei Gelegenheit **etwas** träfe.
Diese Datei prüft den vollen Wortlaut der beiden Dialogtitel sonst nirgends selbst an dieser Stelle
— eine künftige Titeländerung hätte den Fall stillschweigend wirkungslos gemacht, statt ihn rot
werden zu lassen.

**Gemessen (rot vor der Reparatur, mit unverändertem Ausgangscode).** Derselbe Fall, unverändert,
der Ausdruck ersetzt durch `/Diese Verknüpfung wird garantiert nie im Baum/` (trifft an keiner
heutigen Stelle im Baum): **„1 passed", Code 0.** Genau die Bauform aus E-094 Punkt 3 — „0 gefunden"
war `ok`.

**Reparatur.** Der Fall legt jetzt einen zweiten Dateianhang am selben Todo an und öffnet ihn
zuerst: Der Öffnen-Dialog erscheint (`toHaveCount(1)`), wird abgebrochen (`toHaveCount(0)`) — erst
danach folgt der eigentliche Fall (Verweis ohne Rückfrage) mit derselben Zusicherung wie zuvor,
jetzt belegt. Beide Stellen benutzen dieselbe neue Konstante `FILE_OPEN_DIALOG_NAME` statt zweier
gleichlautender Literale, die auseinanderlaufen könnten.

**Gemessen (rot nach der Reparatur, derselbe Fehlerinjektionsversuch).** `FILE_OPEN_DIALOG_NAME`
auf denselben nie treffenden Ausdruck gesetzt: Die neue Gegenprobe schlägt jetzt fehl —
`Locator: getByRole('alertdialog', { name: /Diese Verknüpfung wird garantiert nie im Baum/ });
Expected: 1; Received: 0`, **„1 failed", Code 1.** Zurückgesetzt: wieder grün, Code 0. Der
Fehlschlag, den eine künftige Titeländerung auslösen würde, ist damit heute schon rot statt still
grün.

## 3. Ein dritter Fundort desselben O-IW-Musters: `timer-stop-announcement.spec.ts`

**Anlaß.** Neben der bereits an ihrem eigenen Fundort behobenen Stelle (Testplan Abschnitt 30) und
ihrem Zwilling in `export-audit-and-locks.spec.ts` (Abschnitt 31, O-KB) zitierte dieselbe Datei ein
zweites Mal einen Wortlaut aus fremder Hoheit, ohne ihn selbst zu prüfen: „Warnung „aber noch nicht
abrechenbar"" — der Titel, den `reportStopped` (`TimerContext.tsx`) für eine noch nicht abrechenbare
Tagesgruppe zeigt. Gemessen: Der tatsächliche Wortlaut ist `` `${on} — aber noch nicht
abrechenbar.` `` (mit einer Todo-Bewegung vor dem Gedankenstrich, die das Zitat wegließ), und dieser
Zweig hat in `tests/e2e/**` **keinen einzigen** Prüffall — nicht in dieser Datei, nicht sonstwo.
Dasselbe Kommentar-Muster wie O-IW/O-KB: eine Begründung, die bei der nächsten Titeländerung still
falsch würde, statt mit einem Prüffall rot zu werden.

**Berichtigung.** Der Kommentar benennt die Abweichung jetzt über ihre Bedingung
(`insight.blockedReason !== null` in `reportStopped`) statt über ihren heutigen Wortlaut im Zitat,
mit ausdrücklichem Verweis auf O-IW/O-KB. Reiner Kommentartext, kein Prüffall und kein Ausgang
geändert — gemessen 6/6 unverändert grün.

## 4. Nachweis

**Gezielte Läufe während der Arbeit** (Belege oben, je mit Zahl und Ausgangscode):
- `attachment-open-commands.spec.ts` (5 Fälle inkl. `TP-ANH-22`): grün, wiederholt gemessen.
- `timer-stop-announcement.spec.ts` (6 Fälle): grün, unverändert gegenüber vor der Berichtigung.
- Zwei absichtliche Fehlerinjektionen (O-KR, O-KQ) mit rotem Ausgangscode 1 vor der jeweiligen
  Rücknahme, siehe Abschnitte 1/2.

**Vollständiger Lauf, `pnpm test:e2e`** (drei Playwright-Konfigurationen nacheinander):
- `playwright.config.ts`: **104 passed**
- `playwright.version-check.config.ts`: **5 passed**
- `playwright.attachment-persistence.config.ts`: **2 passed**
- **Gesamt: 111 passed, 0 failed — Code 0** (110 aus dem letzten bekannten Stand plus der eine neue
  Fall `TP-ANH-22`).

`pnpm run proof:all` wurde **nicht** gefahren (E-083 Punkt 3, Auftrag). `pnpm run typecheck:e2e`
mehrfach zwischenzeitlich mit Code 0.

## 5. Sanity-Check der neun Pflichtabläufe

Alle neun liefen im vollständigen `pnpm test:e2e`-Lauf mit: erledigtes Todo wiederbeleben
(`todo-revival.spec.ts`), Export von Anfang bis Ende mit Statusprüfung
(`export-end-to-end.spec.ts`), Notiz-Trennung (`note-separation.spec.ts`), Exportstatus in mehreren
Ansichten (`export-mixed-status-and-billing.spec.ts`), Tag-Ordner vier Ebenen tief
(`tags-folders.spec.ts`), Standard-Tags auf UI-Erstellung (`tag-input.spec.ts`) und auf
Add-in-Erstellung sowie Add-in mit vorhandenem Call (außerhalb von `tests/e2e/**`, über
`apps/outlook-addin/scripts/proof-addin.mjs`, da Office.js dort ohne echten Host läuft), Kanban
Drag & Drop (`kanban.spec.ts`), abweichende Exportvorlage (`export-template-validation.spec.ts`,
`note-separation.spec.ts`). Kein Neubau in dieser Aufgabe — der Auftrag zielte ausdrücklich auf
O-KQ, O-KR und O-IW.

---

## Kurzfassung

```
Aufgabe: T-240 — O-KQ (TP-ANH-22, der dritte Öffnen-Dialogzustand ohne Öffnen-Knopf, mit
         Wirkungs-Zusicherung), O-KR (Zusicherung über der leeren Menge repariert),
         O-IW (dritter Fundort, Kommentar berichtigt)
Status: fertig
```

**Artefakte:**
- `tests/e2e/support/db.ts` — neue Funktion `overwriteAttachmentTargetDirectly` (O-KQ)
- `tests/e2e/attachment-open-commands.spec.ts` — neuer `TP-ANH-22`-Block (O-KQ), TP-ANH-05 um eine
  Gegenprobe erweitert und gemeinsame Konstante `FILE_OPEN_DIALOG_NAME` eingeführt (O-KR)
- `tests/e2e/timer-stop-announcement.spec.ts` — ein Kommentar berichtigt (O-IW-Zwilling), kein
  Prüffall geändert
- `docs/testplan.md` — neuer Abschnitt 32 mit allen drei Befunden und den gemessenen Rot/Grün-Läufen

**Zusammenfassung:** Der dritte Öffnen-Dialogzustand (V-07, „wird nicht geöffnet", kein
Öffnen-Knopf) hat jetzt seinen ersten Prüffall (`TP-ANH-22`), hergestellt über einen Altbestandswert,
den die Tür heute abweist, ohne Produktivänderung — der Kopf von `overwriteAttachmentTargetDirectly`
begründet, warum das kein Umgehen der Prüfung ist. Die tragende Zusicherung ist der Zähler
`__taktOpenAttachmentFileCalls__`, nicht die Überschrift, und ihre Nichtvakuität ist mit einer
absichtlichen Fehlerinjektion (`toBe(1)`, rot, `Expected: 1, Received: 0`) belegt. Die
`toHaveCount(0)`-Zusicherung in TP-ANH-05 (O-KR) ist um eine Gegenprobe ergänzt und gemessen sowohl
vor der Reparatur (blieb grün trotz absichtlich falschem Ausdruck) als auch danach (wird jetzt rot).
Ein dritter Fundort desselben O-IW-Musters ist in `timer-stop-announcement.spec.ts` berichtigt. Der
volle Lauf steht bei 111 von 111 grün (110 zuvor plus der eine neue Fall), Code 0.

**Annahmen:**
1. Die Umleitungsendung `.lnk` genügt für `TP-ANH-22` als Vertreter beider von `checkAttachmentPath`
   an der Tür abgewiesenen Klassen (Umleitung, Doppelpunkt im Namen) — beide führen zu demselben
   `blocked`-Zweig über dieselbe Funktion `foreseeableRefusalOf`; ein zweiter Fall für den
   Doppelpunkt würde denselben Codepfad ein zweites Mal messen, nicht einen zusätzlichen.
2. `FILE_OPEN_DIALOG_NAME` als gemeinsame Konstante ist auf `TP-ANH-05` begrenzt geblieben — die
   anderen Fälle in derselben Datei (`TP-ANH-06`, `TP-ANH-19`, `TP-ANH-22`) suchen exakte,
   unterschiedliche Titel und haben kein Duplikationsrisiko dieser Art.
3. Der O-IW-Fund in `timer-stop-announcement.spec.ts` wurde als derselbe Fehlerklasse behandelt wie
   die beiden bereits bekannten Fundorte (Testplan Abschnitt 30/31), nicht als eigener Befund mit
   eigener Kennung — die Bauart (Zitat aus fremder Hoheit, hier ungeprüft) ist identisch.

**Risiken:** Keine sicherheitsrelevanten. `overwriteAttachmentTargetDirectly` schreibt unmittelbar
in `todo_attachment.target` an `checkAttachmentPath` vorbei — dieselbe, bereits akzeptierte
Risikoklasse wie `overwriteTodoTitleDirectly`/`deleteAttachmentRowDirectly`, ausschließlich in
Testfixtures verwendet, nie in Produktivcode erreichbar.

**Offene Fragen:** Keine an den Orchestrator.

**Nächster Schritt:** Aus e2e-Sicht keiner mehr offen für diese Welle. Ob ein zweiter `TP-ANH-2x`-
Fall für die Doppelpunkt-Klasse (statt der Umleitungsendung) einen eigenen Wert hätte, ist eine
Frage an einen künftigen Auftrag, nicht an diesen — beide Klassen laufen heute durch dieselbe
Funktion (`foreseeableRefusalOf`) und denselben Dialogzweig.
