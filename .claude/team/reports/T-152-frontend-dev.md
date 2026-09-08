# T-152 — Ark UI Stufe 1: die Dialoge bekommen eine Zustandsmaschine

**Aufgabe:** T-152 — Ark UI Stufe 1: `FormDialog`, `ConfirmDialog`, `InfoDialog`, `UpdateDialog`
auf `Dialog` von Ark UI; dazu O-BF (Formulardialog auf der Musterseite).
**Status:** fertig — Sichtprüfung im Browser steht bei `visual-qa` aus.

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/web/src/components/DialogSurface.tsx` | **neu.** Die gemeinsame Fläche: `Dialog.Root` von Ark UI, unsere `.scrim`, `Dialog.Content` als `.dialog`. |
| `apps/web/src/components/FormDialog.tsx` | geändert. Eigene Fokus- und Tastenbehandlung entfernt, `Dialog.Title` / `Dialog.Description` / `Dialog.CloseTrigger`. `TextField` unverändert. |
| `apps/web/src/components/ConfirmDialog.tsx` | geändert. `role="alertdialog"` jetzt aus der Zustandsmaschine, Rumpf als `Dialog.Description`. |
| `apps/web/src/components/InfoDialog.tsx` | geändert. |
| `apps/web/src/components/UpdateDialog.tsx` | geändert. Fokus auf den Kasten selbst als `initialFocus`; der Sonderfall „alle Knöpfe gesperrt" bleibt von Hand. |
| `apps/web/src/showcase/ControlsSection.tsx` | O-BF: Karte „Formulardialog" mit vier Zuständen und einem Auswahlfeld im Rumpf. |
| `apps/web/src/showcase/InventorySection.tsx` | O-BF: Der Formulardialog fehlte im Komponenteninventar vollständig; Eintrag ergänzt. |

Nicht angefasst: `AttachmentOpenDialog`, `ShellStatus`, `lib/focus.ts`, `Select.tsx`, `TagInput.tsx`,
`Menu.tsx`, `package.json`, alles außerhalb von `apps/web/**`.

---

## Zusammenfassung

Die vier Dialoge führen `role`, `aria-modal`, Fokuseinsprung, Fokusrückgabe, Tabulatorschleife und
Escape nicht mehr selbst; das liefert jetzt `Dialog` von Ark UI in der Fassung, die seit T-059 im
Baum liegt (`@ark-ui/react@5.39.0`, E-052). Aussehen und Ansprache kommen unverändert aus diesem
Bestand: `.scrim` und `.dialog` bleiben unsere Elemente mit unseren Klassen, Rolle und zugänglicher
Name jedes Dialogs sind zeichengleich geblieben (gemessen, siehe Tabelle 1). Zwei der drei
Notbehelfe sind ersatzlos gefallen — die Abfrage auf `event.defaultPrevented` und `recoverFocus` —,
der dritte (`keepTabInside` in den Dialogen) ist durch die Fokusfalle ersetzt; `lib/focus.ts` selbst
bleibt, weil `ShellStatus` und `AttachmentOpenDialog` es weiter benutzen. Die Musterseite zeigt
seitdem einen Formulardialog mit seinen Zuständen (O-BF), und das Komponenteninventar nennt ihn.

Die **eine** bewusste Abweichung von der Voreinstellung von Ark UI ist `modal={false}` bei
gleichzeitig ausdrücklichem `trapFocus` und `aria-modal="true"`. Sie ist gemessen und unten
begründet; ohne sie hätte die Umstellung zwei Ketten rot gemacht und einen echten Fehler eingebaut.

---

## Tabelle 1 — der Vertrag der Oberfläche, vorher und nachher

Gemessen, nicht behauptet: Ich habe die vier Dialoge über einen SSR-Bau von `react-dom/server` als
Zeichenkette ausgegeben und mit der Fassung vor der Umstellung verglichen (Wegwerf-Einstiegspunkt,
danach gelöscht; Playwright lief nicht, e2e-tester fährt in dieser Welle).

| Dialog | Rolle vorher → nachher | Zugänglicher Name vorher → nachher | Klassen vorher → nachher |
|---|---|---|---|
| `FormDialog` | `dialog` → `dialog` | `aria-labelledby` → `h2.dialog__title` → **gleich** | `.scrim` › `.dialog .dialog--form [.dialog--wide] [.dialog--danger]` › `.dialog__head .dialog__head--form` › `.grow` › `.dialog__title`, `.dialog__lead` · `.dialog__body .dialog__body--form` · `.dialog__footer` → **alle gleich, an denselben Elementen** |
| `ConfirmDialog` | `alertdialog` → `alertdialog` | `aria-labelledby` → `h2.dialog__title` → **gleich** | `.scrim` › `.dialog [.dialog--danger]` › `.dialog__head` › `.dialog__icon [.dialog__icon--danger]`, `.dialog__title` · `.dialog__body` (= `aria-describedby`) › `.dialog__consequence`, `.dialog__reason`, `.dialog__acknowledge` · `.dialog__footer` → **alle gleich** |
| `InfoDialog` | `dialog` → `dialog` | `aria-labelledby` → `h2.dialog__title` → **gleich** | `.scrim` › `.dialog .dialog--form [.dialog--wide]` › `.dialog__head .dialog__head--form`, `.dialog__title`, `.dialog__lead`, `.dialog__body .dialog__body--form`, `.dialog__footer` → **alle gleich** |
| `UpdateDialog` | `dialog` → `dialog` | `aria-labelledby` → `h2.dialog__title` („Eine neuere Fassung von Takt ist verfügbar") → **gleich** | `.scrim` › `.dialog .dialog--form` › `.dialog__head .dialog__head--form`, `.dialog__title`, `.dialog__lead`, `.dialog__body .dialog__body--form`, `.facts`, `.dialog__consequence`, `.dialog__hint`, `.dialog__footer` → **alle gleich** |

Zusätzlich geprüft:

- **`tests/e2e/support/actions.ts:21`** — `getByRole('alertdialog', { name: 'Export ausführen?' })`
  trifft weiter: Rolle kommt aus `role="alertdialog"` am selben `.dialog`, der Name aus demselben
  `<h2>`.
- **`tests/e2e/support/actions.ts:23`** — `.dialog__acknowledge input[type="checkbox"]` steht
  unverändert im Rumpf (im SSR-Abzug nachgesehen).
- **`aria-modal="true"`** steht an demselben Element wie vorher.
- **`tabindex="-1"`** am Kasten: vorher von Hand nur im `FormDialog` und `UpdateDialog`, jetzt
  überall aus der Zustandsmaschine. Das ist additiv und für `getByRole` folgenlos.

**Neu am Kasten, additiv:** `data-scope="dialog"`, `data-part="content|title|description|close-trigger"`,
`dir="ltr"`, `id="dialog:<lfd>:content|title|description|close"`, `data-state="open"` und ein
Inline-Stil `pointer-events: auto`. Keine dieser Marken wird von `contrast-check.mjs`,
`proof-foreign.mjs` oder einem `getByRole` gelesen; es gibt in `components.css` keine Regel auf
`[data-state]` für `.dialog`.

**Weg:** unsere eigenen `useId`-Kennungen für Titel und Beschreibung (die Zustandsmaschine vergibt
sie und verkabelt `aria-labelledby` / `aria-describedby` selbst, und zwar nur, wenn das Element
wirklich gezeichnet ist).

### Ketten, die grün geblieben sind

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` (alle Pakete, Tests, e2e) | grün |
| `pnpm test` | 69 Dateien, 1359 Fälle, grün |
| `pnpm --filter @takt/web build` | grün |
| `pnpm --filter @takt/web build:designsystem` | grün |
| `pnpm run contrast` | 0 von 474 Paaren durchgefallen |
| `pnpm run proof:foreign` | 14 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:shell-surface` | 6 Prüfungen, 20 Gegenproben |
| `pnpm run proof:codepoints` | 45 bestanden |

Playwright habe ich **nicht** gestartet (Auflage der Aufgabe).

---

## Tabelle 2 — die Notbehelfe, einzeln

| Notbehelf | Wo er stand | Gefallen? | Womit gemessen |
|---|---|---|---|
| `if (event.defaultPrevented) return;` vor der Escape-Behandlung | alle vier Dialoge | **ja, ersatzlos** | `@zag-js/dismissable@1.43.3`, `dismissable-layer.mjs`: `onEscapeKeyDown` beginnt mit `if (!layerStack.isTopMost(node)) return;`. Eine aufgeklappte Ark-Liste ist die obere Ebene — der Dialog **bekommt** das Escape gar nicht erst, statt es zu bekommen und wegzuwerfen. Zusätzlich hört die Ebene auf `document` in der **Erfassungsphase** (`escape-keydown.mjs`), ein `stopPropagation` in der Blasenphase konnte sie ohnehin nie erreichen. |
| `recoverFocus` (Fokus zurückholen, wenn das fokussierte Element verschwindet, T-072) | `FormDialog` | **ja, ersatzlos** | `@zag-js/focus-trap@1.43.3`, `focus-trap.mjs`, `setupMutationObserver`: beobachtet `childList` unter den Behältern; steht der `mostRecentlyFocusedNode` in `mutation.removedNodes`, ruft die Falle `tryFocus(this.getInitialFocusNode())`. **Ein Unterschied bleibt und ist beabsichtigt:** Der Fokus landet danach im ersten Formularfeld statt auf dem Schließkreuz — das ist dieselbe Wahl, die der Dialog beim Öffnen trifft. Der ursprüngliche Fundort („Spalten des Boards") trägt den Fall seit T-102 nicht mehr, weil dort jeder Knopf den Dialog schließt; heute reicht ihn `PoolFormDialog` (letztes Tag aus der Regel nehmen) und `kanban.spec.ts:160`. |
| `keepTabInside(dialogRef, event)` | alle vier Dialoge | **ja** — in den Dialogen | Ersetzt durch den Effekt `trapFocus` der Zustandsmaschine (`dialog.machine.mjs`), der `handleTabKey` auf `document` in der Erfassungsphase hängt. **`lib/focus.ts` selbst bleibt stehen**: `ShellStatus.tsx` und `AttachmentOpenDialog.tsx` sind weiterhin Aufrufer (nachgesehen mit `grep`), und E-076 Punkt 5 sagt: streichen erst ohne Aufrufer. |
| `focusableWithin`-Sonderfall im `UpdateDialog` (Tab, während der Kasten selbst den Fokus trägt) | `UpdateDialog` | **ja, ersatzlos** | `focus-trap.mjs`, `findNextNavNode`: behandelt `containerGroup?.container === target` ausdrücklich und springt in beide Richtungen an den passenden Rand der Gruppe. Genau der Fall, den der frühere Kommentar beschrieb. |
| Fokus zurück auf den Kasten, während „Überspringen" läuft | `UpdateDialog` | **nein — bleibt, mit neuer Begründung im Kommentar** | Die Fokusfalle beobachtet **entfernte** Knoten und Änderungen an `aria-controls`/`aria-expanded`. Ein Knopf, der `disabled` bekommt, verschwindet nicht aus dem Baum und löst nichts aus; der Browser gibt den Fokus an den Dokumentkörper ab, ohne ein `focusin` zu senden. Der Effekt bleibt deshalb stehen, und der Kommentar sagt jetzt, **warum die Falle ihn nicht trägt**. Nachgelagerte Sicherung durch Ark: Ein Tabulator aus dem Nichts landet über `fallbackFocus` wieder am Kasten. |
| `stopClosingKeys` in `Select.tsx` und `Menu.tsx` | fremde Baustelle in dieser Stufe | **nicht angefasst** | Nach dieser Umstellung ohne Wirkung: Beide Tasten werden von Ark in der Erfassungsphase auf `document` behandelt, ein `stopPropagation` in der Blasenphase erreicht sie nicht mehr, und die Dialoge haben keine eigenen Blasen-Behandlungen mehr. Streichen gehört in Stufe 2 — solange `AttachmentOpenDialog` und `ShellStatus` eigene `onKeyDown` führen, ist es dort kein reiner Rückbau. Siehe offene Frage 3. |

---

## Die eine Abweichung: `modal={false}` mit `trapFocus` und `aria-modal="true"`

`modal` heißt in der Zustandsmaschine nicht „ist ein modaler Dialog", sondern schaltet vier Dinge
zugleich (`dialog.machine.mjs`, `props()`): Fokusfalle, Sperre des Seitenbildlaufs, Sperre der
Zeigerereignisse am Dokumentkörper — und `hideContentBelow`. Das letzte ist der Grund für die
Abweichung.

`hideContentBelow` ruft beim Öffnen **einmalig** `hideOthers([contentEl])` und setzt damit
`aria-hidden="true"` auf jedes Geschwisterelement, den Dokumentkörper hinauf
(`@zag-js/aria-hidden`, `walk-tree-outside.mjs` — ein Durchlauf, kein Beobachter). Zwei gemessene
Folgen:

1. **Die aufgeklappte Liste eines Auswahlfelds im Dialog verschwände aus dem Zugänglichkeitsbaum.**
   `Select`, `TagInput` und `Menu` zeichnen ihre Liste über `<Portal>` an den Dokumentkörper, und
   dieses Element steht dort schon, wenn der Dialog öffnet (kein `lazyMount`). `walkTreeOutside`
   lässt nur stehen, was `findControlledElements` findet — und das verlangt
   `aria-expanded="true"` am Auslöser (`@zag-js/dom-query`, `controller.mjs`). Beim Öffnen des
   Dialogs ist die Liste zu. Sie bekäme also `aria-hidden="true"` und behielte es. Für eine
   Vorlesehilfe wären die Optionen von `Tags`, `Status`, `Feld der Vorlage` **nicht mehr da**. Das
   ist kein Testproblem, sondern ein Fehler.
2. **Jede Fläche hinter dem Dialog verlöre ihre Rolle**, solange er steht — genau das, was E-076
   Punkt 3 verbietet. `page.getByRole(...)` in `tests/e2e` schließt `aria-hidden="true"` aus.

Deshalb steht in `DialogSurface`: `modal={false}`, dazu ausdrücklich `trapFocus`,
`closeOnInteractOutside={false}` und `aria-modal="true"` am Kasten. Was dabei **nicht** verloren
geht: die Ebenenverwaltung (`trackDismissableElement` läuft unabhängig von `modal`), die
Fokusfalle, die Fokusrückgabe, die Ebenen-Ordnung von Escape. Was zurückgelegt wird: nur das
Aushängen des übrigen Baums, das Takt vorher auch nicht hatte.

`aria-modal="true"` ist dabei keine Notlüge: Der Dialog ist modal — der Fokus ist gefangen, die
Abdunklung liegt über der Anwendung, Klicks landen auf `.scrim`. Dieselbe Zusicherung stand vor
T-152 an demselben Element.

**Kein `Dialog.Positioner` und kein `Dialog.Backdrop`.** Beide zeichnen eigene Elemente mit eigenen
Inline-Stilen; der Positionierer setzt ohne `modal` unbedingt `pointer-events: none`, und damit
fielen Klicks auf die Abdunklung **durch** auf die Anwendung dahinter. `.scrim` bleibt deshalb
unser `<div>`, und `page.locator('.scrim')` zählt beim Schließen wieder null — was
`timer-switch-scrim-toast.spec.ts` misst.

---

## Eingebundene Ark-Unterpfade

Genau einer: **`@ark-ui/react/dialog`** (`Dialog.Root`, `Dialog.Content`, `Dialog.Title`,
`Dialog.Description`, `Dialog.CloseTrigger`).

**An `package.json` war nichts nötig und nichts geändert.** `@ark-ui/react ^5.39.0` liegt seit
T-059 in `apps/web/package.json`; die `exports`-Tabelle des Pakets löst `./dialog` über den
Platzhalter `./*` auf, wie sie es für `./select`, `./menu` und `./portal` schon tut. Kein neues
Paket, keine neue Fassung, keine Lieferkettenfrage.

Benutzte Eigenschaften der Fassung 5.39.0 (an den Typdeklarationen im Baum nachgeschlagen, nicht
aus dem Gedächtnis): `open`, `onOpenChange`, `role`, `modal`, `trapFocus`,
`closeOnInteractOutside`, `closeOnEscape`, `initialFocusEl`. Nicht benutzt: `finalFocusEl`
(nicht nötig — ohne `Dialog.Trigger` gibt die Falle den Fokus von selbst an das Element zurück, das
ihn vor dem Öffnen hatte), `lazyMount`/`unmountOnExit` (der Zweig auf `open` nimmt Abdunklung und
Kasten zusammen weg), `Dialog.Backdrop`, `Dialog.Positioner`, `Dialog.Trigger`.

---

## Zustände (Abschnitt 15), gemessen an den Aufrufstellen

| Zustand | Wo er im Dialog vorkommt | unverändert? |
|---|---|---|
| Leer | `FormDialog` mit `EmptyState` im Rumpf („Noch keine Spalte"), `Select` ohne Optionen | ja |
| Ladend | `busy` sperrt Absendung und Abbruch, `LoadingBlock` im Rumpf; Escape ist während `busy` aus | ja (`closeOnEscape={!busy}` bildet die frühere Abfrage ab) |
| Zeiger / Fokus / Aktiv | Klassen der Knöpfe und Felder unverändert; der Fokusring kommt aus `base.css` | ja |
| Fehler | `error` im `FormDialog` (holt sich selbst ins Sichtfeld), `refusal` im `ConfirmDialog` über `role="status"` | ja — beide Wege stehen unverändert, einschließlich der Trennung Vorwarnung / Absage aus B-5 |
| Bestätigung | `ConfirmDialog` mit `acknowledgeLabel` und `reasonLabel`; Wortlaut und Bedingung (`blocked`) unverändert | ja |

Die Frage vor dem Zurücksetzen eines Exportstatus (E-012, R-10) ist **wörtlich** dieselbe geblieben;
es wurde keine Zeile Fachlogik verschoben und kein Dienst, keine Domäne, kein Datenmodell und keine
OpenAPI angefasst.

---

## O-BF — der Formulardialog auf der Musterseite

Die Musterseite zeigte bis heute keinen einzigen Formulardialog, obwohl er die meistbenutzte modale
Fläche des Produkts ist (Todo anlegen, Timer stoppen, Spalte anlegen, Vorlage bearbeiten). Auch das
Komponenteninventar in Abschnitt 11 nannte ihn nicht — `InfoDialog` und `ConfirmDialog` standen
darin, `FormDialog` fehlte ganz.

Neu in Abschnitt 9 („Bedienelemente und Zustände"): eine Karte **Formulardialog** mit vier Knöpfen,
die denselben Dialog in vier Lagen öffnen — bedienbar, Absendung gesperrt (Pflichtfeld leer, mit
Feldfehler), arbeitend, nach einer Absage des Dienstes. Im Rumpf steht neben dem Textfeld ein
**Auswahlfeld mit Gruppen**, weil dessen aufgeklappte Liste im Portal hängt und der einzige Weg
ist, die Ebenenfrage vorzuführen: Escape gehört der Liste, solange sie offen ist. Unter der Karte
steht, was mit der Tastatur zu prüfen ist. Neu in Abschnitt 11: der Inventareintrag mit Datei,
Zweck, Zuständen und Ansichten.

---

## Was `visual-qa` ansehen muss

Nichts davon habe ich im Browser gesehen — ich habe die Zeichenkette gemessen, nicht das Bild.

**Musterseite** (`pnpm --filter @takt/web dev`, dann `/designsystem.html`, Abschnitt 9):

1. Karte „Formulardialog", alle vier Knöpfe. Je Aufruf prüfen: Der Fokus steht beim Öffnen im Feld
   **Titel**, nicht auf dem Schließkreuz. Tabulator und Umschalt+Tabulator bleiben im Dialog.
   Escape schließt — außer bei „Wird gespeichert".
2. Im selben Dialog das Auswahlfeld „Feld der Vorlage" aufklappen und Escape drücken: Es darf **nur
   die Liste** schließen, der Dialog muss stehen bleiben. Danach Escape noch einmal: jetzt schließt
   der Dialog. (Das ist der Fall, für den der Notbehelf `defaultPrevented` gefallen ist.)
3. Karte „Bestätigungsdialoge", beide Knöpfe: `alertdialog`, Fokus auf dem ersten bedienbaren
   Element, Kontrollkästchen sperrt den rechten Knopf.
4. Beide Farbmodi und beide Dichten, dazu ein schmales Fenster (der Dialog ist `min(30rem, 100%)`
   in einer Fläche mit `padding: var(--space-6)`).

**Anwendung:**

5. **Fokusrückgabe:** „Neues Todo" öffnen, mit Escape schließen — der Fokus muss zurück auf den
   Knopf „Neues Todo". Dasselbe über das Zeilenmenü („Bearbeiten"): zurück auf den Menü-Auslöser.
6. **Der gefallene `recoverFocus`:** Eine Pool-Regel mit mindestens einem Tag bearbeiten, mit der
   Tastatur auf „Tag X entfernen" gehen und Eingabe drücken. Der Knopf verschwindet. Der Fokus
   darf **nicht** auf `body` fallen; erwartet ist das erste Feld des Dialogs. Danach muss Escape
   noch schließen.
7. **Dialogwechsel:** Board › „Spalten verwalten" › „Neue Spalte anlegen". Der erste Dialog
   schließt, der zweite öffnet. Zu prüfen ist, ob dabei ein sichtbares Fokusflackern entsteht
   (siehe Risiko 2).
8. **Fassungshinweis:** `UpdateDialog` — Fokus liegt beim Öffnen auf dem Kasten, nicht auf einem
   der beiden Knöpfe (A-18.7). Umschalt+Tabulator als **erster** Tastendruck darf nicht aus dem
   Dialog führen. Während „Überspringen" läuft, sind alle drei Knöpfe gesperrt und der Fokus muss
   auf dem Kasten stehen.
9. **Klick auf die Abdunklung schließt nicht** — bei allen vier Dialogen. Das war vorher so und
   soll so bleiben.

---

## Annahmen

1. **`modal={false}` statt der Voreinstellung**, mit `trapFocus`, `closeOnInteractOutside={false}`
   und `aria-modal="true"` von Hand. Begründung oben; ich habe das entschieden, weil die
   Voreinstellung das Abnahmekriterium aus E-076 Punkt 3 gebrochen und die Optionslisten in
   Dialogen für Vorlesehilfen unerreichbar gemacht hätte. Das ist der eine Punkt, der eine
   Entscheidung des Orchestrators verdient (offene Frage 1).
2. **Eine gemeinsame Datei statt vier Kopien.** `DialogSurface` ist kein neuer Baustein für
   Aufrufer — er ist nicht exportiert an Ansichten, sondern nur an die vier Dialoge. Die
   Alternative wären viermal dieselben sechs Eigenschaften gewesen, also genau die Bauart, die
   `Menu.tsx` im Kopf als „die dritte Fassung derselben Sache" beschreibt.
3. **Das Schließkreuz ist `Dialog.CloseTrigger`,** die Fußzeilenknöpfe nicht. Grund: Für
   `role="alertdialog"` sucht die Zustandsmaschine ohne weitere Angabe das Schließkreuz als erstes
   Fokusziel. Wäre „Abbrechen" im `ConfirmDialog` ein `CloseTrigger`, spränge der Fokus dorthin
   statt auf das erste Element des Rumpfs — eine Verhaltensänderung ohne Anlass.
4. **Der Zweig auf `open`** statt `lazyMount`/`unmountOnExit`: Nur so verschwindet die Abdunklung
   zeichengleich mit dem Kasten, und nur so zählt `page.locator('.scrim')` beim Schließen null.
5. **`FormDialog` behält seine eigene Feldauswahl** für den Fokuseinsprung — wörtlich derselbe
   Selektor wie vorher. Ohne sie stünde der Fokus auf dem Schließkreuz.
6. Der Sonderfall „alle Knöpfe gesperrt" im `UpdateDialog` bleibt von Hand; dafür bekommt
   `DialogSurface` eine einzige zusätzliche Eigenschaft (`contentRef`), die ausschließlich diesem
   Zweck dient und im Typ so beschrieben ist.

---

## Risiken

1. **Die Fokusrückgabe ist jetzt eine Aufgabe später.** Vorher lief `openerRef.current?.focus()`
   synchron in der Aufräumfunktion des Effekts; die Fokusfalle gibt den Fokus in einem
   `setTimeout(…, 0)` zurück. Für Playwright folgenlos (jede Zusicherung wiederholt), für einen
   Menschen unsichtbar. Wenn ein e2e-Fall den Fokus **ohne** `expect` liest, könnte er
   danebengreifen — mir ist keiner aufgefallen.
2. **Ein Fokusprall beim Dialogwechsel.** Schließt ein Dialog und öffnet im selben Zug ein zweiter
   (Board › „Spalten verwalten" › „Neue Spalte anlegen"), setzt die Falle des ersten den Fokus
   verspätet auf ihren Auslöser, und die Falle des zweiten holt ihn über ihren `focusin`-Wächter
   sofort zurück. Das Ergebnis ist richtig, der Weg dorthin hat einen Zwischenschritt. Punkt 7 der
   Sichtprüfung.
3. **Ein Bildlauf hinter dem Dialog bleibt möglich**, weil `preventScroll` an `modal` hängt. Das
   ist der Stand vor T-152; ich habe ihn bewusst nicht verändert, weil die Sperre den
   Bildlaufbalken ausgleicht und damit das Layout um wenige Pixel verschiebt — eine sichtbare
   Änderung ohne Auftrag.
4. **Sicherheit:** keine neue Abhängigkeit, keine neue Adresse, keine Änderung an CSP, Hülle,
   Dienst oder Exportformat. `proof:shell-surface` und `proof:codepoints` sind grün. Der einzige
   sicherheitsnahe Punkt ist eine Zusicherung, die wir schon vorher gegeben haben: `aria-modal`
   steht von Hand statt aus der Bibliothek. Wer künftig `modal` umstellt, muss die beiden Folgen
   oben mitlesen — sie stehen deshalb im Kopf von `DialogSurface` und nicht nur hier.
5. **`AttachmentOpenDialog` und `ShellStatus` sind jetzt die letzten beiden Flächen mit eigener
   Tastenbehandlung.** Zwei Bauarten nebeneinander sind ein Zustand auf Zeit, kein Ziel. Stufe 2
   sollte den Anhangdialog nachziehen, sobald T-150 durch ist.

---

## Offene Fragen an den Orchestrator

1. **Soll `modal={false}` als Zusatz zu E-076 festgehalten werden?** Es ist die einzige Abweichung
   von der Voreinstellung der Bibliothek und wird jeder späteren Stufe wieder begegnen. Mein
   Vorschlag: ein Absatz in E-076, der beides festhält — die Regel (`aria-modal` und Fokusfalle ja,
   `hideContentBelow` nein) **und** die Bedingung, unter der sie fiele (siehe Frage 2).
2. **Stufe 2 oder später: Soll `hideContentBelow` doch eingeschaltet werden?** Es ginge, aber nur
   zusammen mit `lazyMount` **und** `unmountOnExit` an `Select`, `TagInput` und `Menu` — dann
   stünde deren Portal beim Öffnen des Dialogs noch nicht im Baum und bekäme kein `aria-hidden`.
   Das ist eine eigene Aufgabe mit eigener Messung (die Musterseite hat einen Fall dazu, seit T-059:
   `tag-input.spec.ts` TAGINPUT-05 liest die geschlossene Liste über `aria-controls`, und die gäbe
   es mit `lazyMount` nicht mehr). Ich habe es **nicht** angefasst.
3. **`stopClosingKeys` in `Select.tsx` und `Menu.tsx`** hat nach dieser Umstellung keine Wirkung
   mehr. Streichen? Ich habe es stehen lassen, weil `AttachmentOpenDialog` und `ShellStatus` noch
   eigene `onKeyDown`-Behandlungen führen und ich das ohne einen Browserlauf nicht messen kann.
   Vorschlag: zusammen mit Stufe 2 (Anhangdialog) in einem Zug.
4. **Braucht `DialogSurface` einen Eintrag im Komponenteninventar der Musterseite?** Ich habe ihn
   nicht aufgenommen: Er ist kein Baustein, den eine Ansicht benutzt, sondern der Unterbau der
   vier, die dort stehen. Wenn das Inventar Unterbauten führen soll, trage ich ihn nach.

---

## Nächster Schritt

`visual-qa` mit der Liste unter „Was visual-qa ansehen muss" starten, insbesondere den Punkten 2
(Escape in der aufgeklappten Liste) und 6 (der gefallene `recoverFocus`) — das sind die beiden
Stellen, an denen ich Quelltext gelesen und nicht die Oberfläche gesehen habe. Parallel kann
`e2e-tester` seine Läufe fahren; ich erwarte keine roten Fälle, aber `tag-input.spec.ts`,
`kanban.spec.ts` und `timer-switch-scrim-toast.spec.ts` sind die drei, die am dichtesten an dieser
Umstellung liegen. Erst danach Stufe 2 (`AttachmentOpenDialog`, Kontrollkästchen, Auswahlgruppe,
Schalter).
