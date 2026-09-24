# Wave 18 — interaction flows (T-391)

Author: ux-designer. Companion paper: `docs/design/welle-18.md` (ui-designer, T-392) decides
hierarchy, spacing, lengths and every motion value. This paper decides **what happens**: entry,
states, feedback, focus, words, acceptance criteria. Status: proposal for T-400 (frontend-dev),
T-397 (domain-dev, where a flow needs the service), T-402 (e2e) and T-404 (spec-ux-reviewer).

Sources read: `docs/spec.md` §28 (A-28.1 to A-28.11), A-4.4, A-6.9, A-8.7, A-22, A-24, A-26,
§15, §16; `decisions.md` E-078, E-081, E-087, E-118, E-120, E-121; board rows O-FZ, O-Q and
"Welle 18"; triage notes for O-Q and O-FZ; the code at `92cfad0` plus working tree.

Out of scope here: A-28.4 (export value, no surface), A-28.5/A-28.10 (start-up texts, T-390 and
T-400 own them), A-28.9 (add-in), A-28.11 (build). O-KT/O-LC belongs to T-392.

---

## 0. Rules that apply to every flow below

### 0.1 Words

- UI copy is **German** and stays German until A-28.2 ships; every new string in this paper
  has a key (section 13) and is written into the bundle (`lib/labels.ts` or a feature-local
  label module), never inline in JSX (E-118 point 3).
- German copy follows E-080 (formal "Sie", or better no address at all) and E-078: a sentence
  stays only if it names a **consequence**, an **absence** or a **refusal**.
- Field error messages use the existing base form (T-177 P-2/P-3): the first word is the
  field's label, e.g. "Ende fehlt."
- User data (titles, tag names, notes) is rendered through `Foreign`, never translated.

### 0.2 Motion — frequency gate (skill `animate`)

| Surface | Frequency | Decision |
|---|---|---|
| Up/down reordering of rules, language radio, settings switches, tag search typing, filter changes | Keyboard-driven or tens of times per session | **No animation.** Instant state change. |
| Toasts, dialogs (24-h end question) | Occasional | Existing toast/dialog motion only, no new motion. |
| Warnings (A-28.8, C-21) | Appear at load | No entrance animation; they are state, not events. |

No flow in this paper introduces a new animation. Values belong to T-392 if it disagrees.

### 0.3 Focus and announcements

- A control that the user operated never loses focus to `<body>`. If it becomes unavailable
  (end of list, busy), focus moves to the nearest sensible sibling named in the flow.
- While a request is in flight, the operated control uses `aria-disabled="true"` (keeps focus)
  rather than `disabled` (drops focus). Repeated activation while busy does nothing.
- Toasts never take focus and are announced politely (existing `ToastContext`).
- Dialogs follow A-25.6: attached to the window, trap focus, **cancel is never consent**.

---

## 1. A-28.1 — Version check can be switched off

**User goal.** Decide whether SuperTakt may contact GitHub at all.
**Success criterion.** With the switch off, no request leaves the machine — not at start, not
by polling — and the setting survives restart and data backup.

### 1.1 Entry and placement

Settings → **Arbeitsplatz**, new card **"Versionsprüfung"** between "Arbeitsplatz" and
"Sicherheitsmeldungen". Reason: Arbeitsplatz already gathers facts about this machine and its
boundaries (billing name, data location, security notices); the version check is the one
outward connection of the product (E-064). The rail hint of "Arbeitsplatz" may name it
(ui-designer decides the ≤ 5-word hint, see 13).

### 1.2 Control

A single checkbox, same pattern as "Leistung beim Stoppen abfragen" (`SettingsScreen.tsx`):

- Label: **"Nach neuen Versionen suchen"**
- Hint (permanent, `aria-describedby`): **"Fragt die Veröffentlichungen von SuperTakt auf
  GitHub ab. Ausgeschaltet stellt SuperTakt keine Verbindung nach außen her."**
  The second sentence names an absence (E-078 point 1) and is the promise of A-28.1.
- Default: checked.

### 1.3 States

| State | Behaviour |
|---|---|
| Loading | The card renders inside the existing settings `AsyncBoundary`; no own skeleton. |
| On → off | Optimistic: checkbox off immediately; the update entry in the navigation footer (`Navigation.tsx:116`) and any open `UpdateNotice` disappear in the same render; UI polling of the check result (A-27.11) stops. No success toast (same as the other preference switches). |
| Off → on | Checkbox on. **No promise of an immediate check** in the UI; the service resumes on its own rhythm (A-27.11). Nothing is shown until a result exists. |
| Save fails | Revert to the previous value and show the existing failure toast "Die Einstellung wurde nicht gespeichert" with the service message (pattern of `PreferencesContext.change`). |
| Check fails while on | Silent, unchanged (A-18). |
| Skipped version | Kept untouched across off/on; switching on again does not resurrect a skipped version. |

### 1.4 Keyboard

Tab reaches the checkbox; Space toggles. Focus stays on the checkbox after save and after revert.

### 1.5 Acceptance criteria (frontend-dev)

- AK-1.1 The card and checkbox exist under Settings → Arbeitsplatz with the label and hint
  above; the hint is connected via `aria-describedby`.
- AK-1.2 Unchecking hides the update entry in the navigation footer and any update notice
  without reload; the version line shows "Version x.y.z" as today.
- AK-1.3 With the switch off, the web UI performs no version-check read (A-27.11 polling paused)
  — measured, not assumed; the "no outward connection" half is measured on the service (T-397).
- AK-1.4 A failed save reverts the checkbox and shows the failure toast; focus stays.
- AK-1.5 The value comes from `GET /settings` (Bestand), not from browser storage.

---

## 2. A-28.2 — Language of the main UI

**User goal.** Use SuperTakt in English (or German).
**Success criterion.** After choosing, every text of the main UI including date and number
formats is in the chosen language, and stays so after restart and restore.

### 2.1 Entry and placement

Settings → **Darstellung**, first control of the card, above "Farbmodus": **"Sprache"**, a
`RadioRow` with two options.

| Option | Visible label | `lang` of the label |
|---|---|---|
| German (default) | **Deutsch** | `de` |
| English | **English** | `en` |

Endonyms: each option is written in its own language so that a user who cannot read the
current language still finds theirs. The label carries its `lang` so a screen reader pronounces
it correctly (WCAG 3.1.2).

Hint under the control (names an absence, E-078 point 1):
**"Das Outlook-Add-in und die Meldungen des lokalen Dienstes bleiben vorerst deutsch."**

The card description today reads "Theme, Farbmodus und Zeilendichte wirken sofort und bleiben
beim nächsten Start erhalten." It becomes **"Alles hier wirkt sofort und bleibt beim nächsten
Start erhalten."** (one sentence for four controls instead of enumerating; E-087 search: no test
pins the old wording, measured 2026-09-23).

### 2.2 Immediate effect — decided

The language switches **immediately**, without reload, like every other control in this card.
Rationale: the card promises "wirkt sofort"; a reload would be the only exception in the card
and would drop the user's position (focus, scroll). Consequences frontend-dev must handle:

1. `<html lang>` switches in the same render (WCAG 3.1.1).
2. Focus stays on the radio that was chosen (the element must not remount).
3. Toasts already on screen keep their language; they expire normally. No re-translation.
4. Text coming from the local service (error bodies, `errorMessage(cause)`) stays German
   (A-28.2) and is wrapped in an element with `lang="de"` when shown inside English UI.
5. Dates, times, numbers and durations are formatted through **one** locale switch in
   `lib/format.ts`; export files are not affected (JSON numbers, fixed keys `Call`, `Zeit`,
   `Notiz`, `WindowsUser`).
6. The shared calendar component (§ "Filter im Export") follows the language (month and weekday
   names, first day Monday in both).
7. Start-up screens before the service answers use the last known choice from the same start-up
   cache as the appearance (`cacheAppearance`); the Bestand value overrides it as soon as it is
   loaded. Without a cache: German.

### 2.3 Formats

| Item | Deutsch | English (en-GB, decided E-123 point 1; see F-2) |
|---|---|---|
| Date | 23.09.2026 | 23/09/2026 |
| Day label | Di, 23.09. | Tue 23 Sep |
| Time | 14:05 | 14:05 (24-hour) |
| Rounded value | 0,75 | 0.75 |
| Duration | 1:30 h | 1:30 h |

### 2.4 States

| State | Behaviour |
|---|---|
| Saving | Radio row `aria-disabled`, as the other controls while `saving`. |
| Save fails | Revert to previous language, failure toast in the previous language. |
| Restore of an older archive | Archive without the value → German (T-397 decides the archive version). |

### 2.5 Acceptance criteria

- AK-2.1 Radio row "Sprache" with "Deutsch"/"English" (each with its `lang`), default Deutsch,
  hint as above.
- AK-2.2 Choosing switches all main-UI text and `<html lang>` without reload; focus stays on the
  chosen radio; arrow keys move and select as in every `RadioRow`.
- AK-2.3 Dates/numbers follow 2.3 in every view (lists, toasts, dialogs, calendar).
- AK-2.4 Service messages inside English UI carry `lang="de"`.
- AK-2.5 Value lives in the Bestand; restart and restore keep it (T-397).
- AK-2.6 No user data, tag name, export key or theme name is translated.

---

## 3. A-28.3 — Order of pools

**User goal.** Put the rules/pools in the order that matters to the user.
**Success criterion.** The order set in Settings → Regeln is the order in every place that
lists pools, and survives restart and backup.

### 3.1 Entry

Settings → **Regeln**, card "Regeln" (`PoolAdministration.tsx`). This list already shows **all**
rules (pool, board, both), sorted by `position`. Each row gets the same reorder group as the
board setup dialog (`BoardSetupDialog.tsx:184-203`):

- Group, `role="group"`, name **"Reihenfolge von „X“"**.
- Two icon buttons, arrow up / arrow down, names **"„X“ nach oben"** / **"„X“ nach unten"**
  (vertical list; wording as in `StatusRow.tsx`). Placed before "Todos ansehen".

### 3.2 Semantics

One global order. "Nach oben" swaps the rule with its **neighbour in this list**. Because this
list is the complete list, no third rule changes its relative order to either of the two.
Board columns are the board-placed rules in the same order, so:

- both rules on the board → they also swap on the board;
- only one or neither on the board → the board order does not change.

### 3.3 States and feedback

| State | Behaviour |
|---|---|
| Idle | First row: "nach oben" disabled; last row: "nach unten" disabled. |
| Busy (one swap in flight) | All reorder buttons `aria-disabled`; further presses ignored. |
| Success | List re-renders in the new order; **focus follows the moved rule** and stays on the pressed button. If that button is now at the end of the list (disabled), focus moves to the other button of the same rule. Toast (tone success) **"Reihenfolge geändert."**, body **"„X“ steht jetzt weiter oben."** / **"… weiter unten."**; if both swapped rules are board columns, append **"Auf dem Board steht die Spalte jetzt weiter links."** / **"… weiter rechts."** At most one reorder toast is visible; a newer one replaces the older one. |
| Failure | Failure toast **"Die Reihenfolge ließ sich nicht ändern"** + service message; list reloads to the stored order; focus stays on the pressed button. |
| Empty list | Existing empty state, no reorder controls. |
| One rule | Both buttons disabled. |

No undo: the action is its own inverse and immediately repeatable.

### 3.4 Where the order must apply

Measured in the tree on 2026-09-23 (`pools.map`/`rules.map` in `apps/web/src`):
`PoolAdministration` (Regeln list), `BoardSetupDialog` (available rules), `BoardEmptyState`,
`TodoListFilters` (pool select), board columns. frontend-dev re-measures and lists every place in
the report (O-LB rule); any place that sorts pools by name is a finding.

### 3.5 Acceptance criteria

- AK-3.1 Each row of the Regeln list has the reorder group with names as above.
- AK-3.2 A swap changes exactly the relative order of the two rules; board order changes only
  if both are board-placed, and the toast says so.
- AK-3.3 Focus follows the moved rule; never lands on `<body>`.
- AK-3.4 Double press while busy sends one request.
- AK-3.5 Every enumeration of pools follows `position` (list in report).
- AK-3.6 Order survives restart and backup round-trip (T-397 archive version).

---

## 4. A-28.6 — 24-hour limit

**User goal.** Never book an impossible block of time by accident; still be able to book the
real end of a timer that was left running.
**Success criterion.** No booking longer than 24 h is created by stop, manual booking or edit;
a long-running timer is never shortened silently; cancelling never books.

### 4.1 Where a booking can end up longer than 24 h

| Path | Today | Wave 18 |
|---|---|---|
| Stop with Leistung prompt (A-22 on) | Dialog "Timer stoppen" | 4.2 — dialog gains "Ende" |
| Direct stop (A-22 off) | Stops without dialog | 4.2 — the end question opens anyway |
| Switch to another timer, prompt on | Dialog "Es läuft bereits ein Timer" | 4.3 — dialog gains "Ende" |
| Switch, prompt off | Stops and starts without dialog | 4.3 — dialog opens (end only) |
| Manual booking / edit | Dialog "Zeit von Hand erfassen" / "Buchung bearbeiten" | 4.4 — refused with field error |
| Orphaned timer (E-036) | "Bis zum letzten Lebenszeichen buchen" | same end field as 4.2 inside that option, default `min(heartbeat, start + 24 h)` (F-4, E-124 point 3) |
| Idle return (A-24) | Assignment dialog | every "Gearbeitet" section and the active part get the same field error; sum rule A-24.5 stays (F-5, E-124 point 3) |
| Foreign import / own archive | — | 4.5 |

The trigger for 4.2/4.3 is **elapsed > 86 400 s** (exactly 24 h is allowed: "höchstens").
The client computes it from the running entry; the service is the authority. If the service
refuses a plain stop with the 24-h error code from T-388 (clock drift), the UI treats it as the
same trigger and opens the end question — never a dead-end error.

### 4.2 Stop after more than 24 hours — state machine

```
running(>24h) --stop--> askEnd
askEnd --cancel ("Weiterlaufen lassen")--> running(>24h)        [nothing booked, no toast]
askEnd --submit, invalid--> askEnd(field error, focus on "Ende")
askEnd --submit, valid--> saving
saving --service ok--> stopped + stop toast (A-28.7 form)
saving --service refuses--> askEnd(dialog error, input kept)
```

Dialog (same `FormDialog` "Timer stoppen"; with A-22 off it contains only the end part):

- Description unchanged: "Läuft seit 26:14:03 auf „X“."
- New section **before** the Leistung field:
  - Lead: **"Eine Buchung dauert höchstens 24 Stunden. Wann endete die Arbeit?"**
  - Field **"Ende"** — same control as "Ende" in "Zeit von Hand erfassen", prefilled with
    start + 24 h, editable, required.
  - Hint under the field (via `aria-describedby`): **"Anfang: Mo, 22.09., 08:00. Die Zeit nach
    dem Ende wird nicht gebucht."** — names the consequence (E-078).
  - Read-out under the hint, recomputed on change, not a live region:
    **"Gebucht werden: 24:00 h"**.
- Buttons unchanged: primary "Stoppen und buchen", secondary "Weiterlaufen lassen".
- Initial focus: the "Ende" field (it is the question). Enter submits; Esc = cancel.

When the dialog closes and when it does not (T-391b, read against the built `FormDialog` and
`DialogSurface`, not run):

| State | Esc | "Weiterlaufen lassen" | × | Click on the scrim |
|---|---|---|---|---|
| `askEnd`, `askEnd(field error)`, `askEnd(dialog error)` | closes = cancel | closes = cancel | closes = cancel | nothing |
| `saving` | nothing | disabled | disabled | nothing |

- All three ways out are one transition (`onDismiss` → cancel); none of them books anything.
- In `saving` all three are locked together (`closeOnEscape={!busy}`, `disabled={busy}` on
  both buttons). A way out that the other two block would close the dialog in the middle of a
  write (T-153 O-CZ). The lock ends with the service answer: success closes, refusal returns
  to `askEnd(dialog error)` with the input kept.
- Esc belongs to the topmost layer only. With an open picker inside the dialog, the first Esc
  closes the picker, the second one the dialog. This is carried by the Zag layer stack
  (`onEscapeKeyDown` fires for the topmost layer); the former `stopClosingKeys` brake in
  `Select.tsx` and `Menu.tsx` is gone since T-390 (O-CH, E-126 point 5). Do not add a new
  `stopPropagation` brake for this.
- The scrim never closes the dialog: a stray click must not discard a typed end.
- After closing, focus returns to the trigger remembered at opening (`finalFocusEl`), also
  when the dialog was opened from a row menu.

Validation (on blur and on submit, message in the field's alert region):

| Case | Message |
|---|---|
| empty / unreadable | **"Ende fehlt."** |
| end ≤ start | **"Ende liegt vor dem Anfang."** |
| end > start + 24 h | **"Ende liegt mehr als 24 Stunden nach dem Anfang."** |
| end > now | **"Ende liegt in der Zukunft."** |

On a failed submit, focus goes to "Ende". The timer keeps counting in the background while the
dialog is open; the default end does not move.

### 4.3 Switching while the running timer is older than 24 h

The switch dialog "Es läuft bereits ein Timer" gains the same end section for the **running**
timer (label "Ende für „A“"). With A-22 off, this dialog opens anyway, containing only the end
part. Cancel ("Abbrechen"): the old timer keeps running, the new one does **not** start, nothing
is booked. Success: stop toast for A, then start feedback for B (existing two-toast order,
T-097). Closing rules as in the table in 4.2: Esc, "Abbrechen" and × cancel; all three are
locked while saving.

### 4.4 Manual booking and edit

`BookingFormDialog` (create and edit) adds one client check, shown on the **"Ende"** field
after a submit attempt: **"Ende liegt mehr als 24 Stunden nach dem Anfang."** Also add the
missing **"Ende liegt vor dem Anfang."** (today the service refuses with a dialog-level error).
The service remains authoritative: its refusal appears as the dialog error; inputs are kept.
Nothing is shortened automatically; no "book 24 h instead" shortcut (it would be the silent
shortening A-28.6 forbids).

### 4.5 Import and restore (result surfaces in Settings → Daten)

- Foreign import result lists the count: **"N Buchungen über 24 Stunden abgewiesen."**
  (only if N > 0).
- Own archive restore lists a warning: **"N Buchungen dauern länger als 24 Stunden. Sie wurden
  unverändert übernommen."** (only if N > 0). No action attached.

### 4.6 Acceptance criteria

- AK-4.1 Every stop path in 4.1 with elapsed > 24 h asks for the end; none stops silently.
- AK-4.2 Default end = start + 24 h; editable; validation and messages as in 4.2.
- AK-4.3 Cancel books nothing, starts nothing, shows nothing, and the timer bar still runs.
- AK-4.4 A service refusal keeps the dialog open with inputs intact.
- AK-4.5 Manual create and edit refuse > 24 h with the field message; the service refusal also
  surfaces (no silent close).
- AK-4.6 Success feedback is the stop toast of A-28.7 (day group of the **start** day, E-025).
- AK-4.7 Import/restore counts appear only when non-zero.

---

## 5. A-28.7 — Feedback after a manual booking

**User goal.** Know what the manual booking means for billing.
**Success criterion.** The toast after "Buchen" says the same as after a timer stop: booked
duration, open time of the day group and its rounded export value — or why it has none.

### 5.1 Flow

After `createTimeEntry` succeeds: load the day-group insight for
`(todoId, calendarDayOf(startedAt))` and show `stopMessage(insight, title, duration,
movementSentence)` — the **same function** (`features/timer/stopMessage.ts`), all five bodies,
movement sentence appended once. No second wording.

| Insight | Toast |
|---|---|
| preview answered, value known | success, "Zeit gebucht auf „X“." / "Gebucht: 0:45 h. An diesem Tag sind für dieses Todo 1:10 h offen — das ergibt beim Export 1,25." (+ movement sentence) |
| group has no Leistung | warning, "… — aber noch nicht abrechenbar." |
| preview failed | warning, "… — der Exportwert ließ sich nicht abfragen." |
| no insight | success, "Gebucht: 0:45 h." |

The dialog closes on booking success **before** the insight is loaded; the toast follows (same
order as the stop, T-118). If the insight request fails, the "preview failed" body is shown —
booked stays booked.

Edit ("Buchung ändern") keeps its current toast; A-28.7 names only the manual booking.

### 5.2 Acceptance criteria

- AK-5.1 The manual-booking toast is produced by `stopMessage`; no parallel wording remains.
- AK-5.2 Day group = calendar day of the booking's start.
- AK-5.3 E-087: `tests/e2e/manual-booking-movement.spec.ts:149,211,277` pin the body
  "Gebucht: <Dauer>." exactly; the body grows. T-402 adjusts these three assertions in the same
  wave (streichung und Ausgleich in einem Auftrag, E-081 point 4).

---

## 6. A-28.8 — Warning about file permissions

**User goal.** Learn that the file holding customer data is readable by other users, and how to
fix it.
**Success criterion.** A finding is visible in Settings with cause and remedy; without a finding
nothing is shown.

### 6.1 Source and placement

Source: the existing start-up measurement (`main.ts:252-266`) that records the notice
`file_permissions_wide`. Placement: Settings → Arbeitsplatz, inside the fact **"Der Bestand
liegt in"** (`WorkstationFacts.tsx`), directly under the path — the place where the remedy acts.
The generic row in "Sicherheitsmeldungen" (`NOTICE_LABEL.file_permissions_wide`) is removed
from that list so the same finding is not shown twice (E-078).

### 6.2 Content

`InlineMessage` tone warning:

- Title: **"Die Dateien des Bestands sind für andere Benutzer lesbar"**
- Body: **"SuperTakt konnte die Rechte beim Start nicht enger setzen. Der Bestand enthält
  Kundendaten und interne Vermerke."**
- Remedy (arrow line, as in the location concerns): **"Rechte der Dateien im Ordner oben auf
  den eigenen Benutzer beschränken, dann SuperTakt neu starten. Die Warnung verschwindet nach
  dem Neustart."** — the second sentence prevents the dead end "I fixed it, the warning
  stays".

### 6.3 States

| State | Behaviour |
|---|---|
| Finding | Warning shown. |
| No finding | Nothing (A-28.8). |
| Not measurable (Windows ACL, failed `stat`) | Nothing — it is not a finding (`main.ts:276-280`). |
| Notices failed to load | The fact block shows no warning and no claim; the Sicherheitsmeldungen card shows its existing error with retry. |

### 6.4 Acceptance criteria

- AK-6.1 Warning appears at the data location iff the service reports the finding.
- AK-6.2 The finding no longer appears as a row in "Sicherheitsmeldungen".
- AK-6.3 No path, no file names in the warning text (B-2.4 point 4); the path is already above.
- AK-6.4 No rail marker is built (F-6 answered no, E-124 point 4). The warning lives only on
  Settings → Arbeitsplatz.

---

## 7. O-FZ — The pre-warning about reactivation: one version

The pre-warning "a timer start on a done todo reopens it" (A-2.5, I-05) currently stands four
times (measured 2026-09-23):

| # | Place | Wording |
|---|---|---|
| 1 | `TimeScreen.tsx:211` card "Todo wählen", description | "Startet der Timer auf einem erledigten Todo, ist es danach wieder offen." |
| 2 | `TimeScreen.tsx:239-241` hidden-done notice, 2nd sentence | "Startet der Timer auf einem davon, ist es wieder offen und erscheint hier erneut." |
| 3 | `TimeScreen.tsx:264` empty state "Kein offenes Todo" | "Alle Todos sind erledigt. Blenden Sie sie ein: Ein Timerstart hebt das Kennzeichen auf und holt das Todo in seine Pools zurück." |
| 4 | `TodoListScreen.tsx:634-635` `HiddenDoneNotice`, 2nd sentence | same as #2 |

### 7.1 Decision — decided together, not one after the other

**Keep #1, word for word. Shorten #2, #3 and #4.**

- #1 is bound to the action (E-078 point 6, "Handlungsbindung"): the Time screen is the only
  screen whose purpose is starting timers, and it offers "Erledigte einblenden" right there.
  It is visible in every state of the card.
- #2 and #4 sit on notices that exist **only while done todos are hidden** — where no timer can
  be started on them. They explain a future event on stock (E-078 point 1); when the event
  happens, the reactivation toast (`reactivationTitle`, SP-16), the "Erledigt aufgehoben" flag
  and the undo tell it. This is exactly ST-06 in `textbestand.md:1251`, never built.
- #3's reason for the action button is already said by #1 above it.

| # | New wording |
|---|---|
| 2 | "{n} erledigte Todos sind ausgeblendet." + "Einblenden" |
| 3 | title "Kein offenes Todo", description **"Alle Todos sind erledigt."**, action "Erledigte einblenden" |
| 4 | "{n} erledigte Todos sind ausgeblendet." + "Einblenden" |

Post-hoc feedback is unchanged and remains the proof: toast with undo, flag "Erledigt
aufgehoben".

E-087: searched the three removed wordings in `tests/**`, `apps/*/test/**`, `packages/*/test/**`
on 2026-09-23 — no hits. frontend-dev repeats the search (git grep **and** working tree) in T-400.
E-078 point 3: the sentences stem from B-19/E-039/C-04; T-404 (spec-ux-reviewer) confirms the
reduction.

### 7.2 Acceptance criteria

- AK-7.1 The pre-warning exists exactly once in `apps/web/src` (outside the showcase).
- AK-7.2 Both hidden notices read "{n} erledigte(s) Todo(s) ist/sind ausgeblendet." with
  "Einblenden".
- AK-7.3 Mandatory flow "Timer auf erledigtem Todo" unchanged: toast, flag, undo, pool return.

### 7.3 Related finding (not O-FZ, same card)

`TimeScreen.tsx:191-194` says "Beim Stoppen fragt SuperTakt nach der Leistung." also when A-22
is switched off — a false statement. Bind it to the state: show only when
`promptOnTimerStop` is on (Zustandsbindung). No new text.

---

## 8. O-Q C-14 — Booking filter by tag, pool and "has Leistung"

**User goal.** Narrow the bookings on the Export page to a customer (tag), a pool, or to
bookings missing their Leistung, to review or complete them before exporting.
**Success criterion.** The table, the export selection and the preview show exactly the
filtered set; the active filters are visible as chips; the view is reachable via link.

### 8.1 Placement

Export page filter bar (`ExportScreen.tsx:827-838`), after "Todo einschränken". The filters
limit preview and export selection like every filter there (§ "Filter im Export"); hidden
bookings are not exported.

| Control | Type | Values | Chip |
|---|---|---|---|
| **Tag** | picker with folder paths (same tree/search as the tag field, A-10.16 pattern), single tag | any tag | "Tag: Kunden › Müller" |
| **Pool** | select, order = A-28.3 | "Alle Pools", each pool | "Pool: X" |
| **Leistung** | select | "Alle", "Vorhanden", "Fehlt" | "Leistung: fehlt" |

Semantics: a booking matches **Tag** if its todo carries the tag (not its folder); **Pool** if
its todo belongs to the pool **now** (pools are rules evaluated at query time, A-3.4);
**Leistung** looks at the booking's note (A-7.3) — never at the todo note (A-7.2). NoExport
todos stay excluded (A-26.2).

URL keys (S-06 direct links): `tag`, `pool`, `leistung=fehlt|vorhanden`.

### 8.2 States

| State | Behaviour |
|---|---|
| Loading | Existing "wird geladen …" count and table skeleton. |
| No match | Existing empty state "Keine Buchung passt zu diesen Filtern" + "Filter zurücksetzen". |
| Link names a deleted tag/pool | Chip "Tag: nicht mehr vorhanden" (removable); result empty. Never dropped silently. |
| Filter change with selected bookings | Selection is reduced to the visible set (existing rule); summary line updates. |

### 8.3 Acceptance criteria

- AK-8.1 Three controls with chips and URL keys as above; "Filter zurücksetzen" clears them.
- AK-8.2 The filters apply before paging and to export selection and preview (service-side
  filter `tagId`, `poolId`, `hasNote`, built in T-397; F-7, E-124 point 5).
- AK-8.3 "Leistung: Fehlt" plus "Bearbeiten" lets the user complete the Leistung (A-22.2) and
  the row leaves the result after saving.
- AK-8.4 The todo note is never searched or shown.

---

## 9. O-Q C-16 — Actions in "Buchungen von heute" (`TodayRow`)

**User goal.** Correct or complete a booking made today right where it is shown.
**Success criterion.** From each row the same actions are reachable as in the booking
overview, with the same locks.

### 9.1 Row content

A row must name its todo, otherwise neither the row nor its menu has a target. Add the todo
title (link to the todo, `Foreign`) as the row's primary text; period, duration, Leistung and
source follow. Data: the titles already loaded for the Time screen or a title map as in
`BookingsScreen`.

### 9.2 Actions

Row menu, same component and **same entries built by the same function** as the booking
table (`BookingsScreen.tsx:237-311`, to be moved into `features/bookings/` so both call it):
"Todo öffnen", "Bearbeiten", "Verlauf dieser Buchung", "Exportstatus zurücksetzen",
"Nicht abrechnen" — with the same `disabledReason` texts. Trigger name: **"Aktionen für die
Buchung „X“"**. Keyboard: Tab to trigger; Enter/Space opens; ContextMenu or Shift+F10 on the row
opens it as in the table.

### 9.3 States

| State | Behaviour |
|---|---|
| After edit | Existing toast "Buchung geändert."; list refreshes; focus back to the row's trigger. |
| Row leaves today (start moved to another day) | Focus goes to the next row's trigger, else previous, else the card heading "Buchungen von heute". |
| Locked (exported / not billed) | Entries disabled with reason (A-6.9). |
| NoExport todo | Status marker must not read "offen" for billing; read from the read-only `TimeEntry.todoNoExport` (F-8, E-124 point 6). |

### 9.4 Acceptance criteria

- AK-9.1 Each row shows the todo title and has the menu with the five entries and locks.
- AK-9.2 One menu builder serves both surfaces (no copy).
- AK-9.3 Focus rules of 9.3 hold.

---

## 10. O-Q C-21 — Warning when the active template yields an empty field

**User goal.** Notice before exporting that some rows will carry an empty value for a field the
template always writes (e.g. "Call" for a todo without call number).
**Success criterion.** The Export page says how many export rows are affected and which field,
before the run; nothing is blocked.

Interpretation (confirmed, F-9, E-124 point 7): a "Pflichtfeld" is a template field **without condition** — it is
written into every row. Empty = empty string or missing value after transformation in the
preview. The Leistung case is already handled (group blocked, E-034) and is not repeated here.

### 10.1 Placement and wording

Export summary line (`ExportScreen.tsx:774-814`), as a further warn item next to
"Gruppen bleiben stehen":
**"{n} Exportzeile(n) mit leerem Feld: Call"** (several fields: "Call, Kunde"). The legend gets
one line: **"Leeres Feld: Die Quelle liefert für diese Zeile nichts, etwa ein Todo ohne
Call-Nummer. Die Zeile wird trotzdem exportiert."** In the preview, the empty value is marked
in its row (ui-designer). The template editor preview uses the same count.

### 10.2 Acceptance criteria

- AK-10.1 Count and field names come from the preview of the **stored** active template.
- AK-10.2 No warning when no row is affected; the export button stays enabled.
- AK-10.3 Conditional fields are never counted (their key is absent, not empty).

---

## 11. O-Q A-4.4 — Search in the tag and folder tree (S-08)

**User goal.** Find a tag or folder in a deep tree without expanding everything.
**Success criterion.** Typing part of a name shows the matching tags and folders with their
folder path; clearing restores the tree as it was.

### 11.1 Placement and behaviour

Settings → Tags, card "Tags und Ordner": a search field **"Tags und Ordner durchsuchen"**
(placeholder "Name …") above the tree, in the card's fixed part.

- Match: case-insensitive substring on tag and folder names.
- Result: the tree filtered to matches **plus their ancestor folders** (same rule as the add-in,
  A-10.16: hits keep their hierarchy). Ancestors are expanded while searching. A matching
  folder is shown collapsed and can be expanded to its full content.
- Count, polite live region, after typing pauses: **"{n} Treffer"**.
- Clearing (× button or Esc in the field) restores the expansion state from before the search.
- Selection and the detail panel stay as they are; if the selected entry is filtered out the
  detail panel still shows it.
- Drag and drop and "Verschieben" keep working on visible entries.

### 11.2 States

| State | Behaviour |
|---|---|
| Empty tree | Existing empty state; no search field. |
| No match | **"Kein Tag und kein Ordner passt zu „x“."** + button **"Suche leeren"**. |
| Structure reload while searching | Search text kept, result recomputed. |

### 11.3 Keyboard

Tab order: search field → tree. Arrow Down in the field moves focus to the first tree item.
Esc in the field clears it (second Esc does nothing more). Tree keys unchanged.

### 11.4 Acceptance criteria

- AK-11.1 Field, filter, ancestors and count as above; no animation on filtering.
- AK-11.2 Clearing restores the previous expansion.
- AK-11.3 The tree keeps `role="tree"` semantics; levels are announced correctly for filtered
  rows.

---

## 12. Mandatory flows touched by this wave

| Flow | Effect |
|---|---|
| Timer on done todo | Pre-warning reduced to one place (7); post-hoc feedback unchanged. |
| Kanban drag & drop | Not applicable (A-5.2 lifted, E-120). Column order follows A-28.3. |
| Export incl. status change | Filters (8) and empty-field warning (10) narrow/inform before the run; transaction unchanged. |
| Deep tag folders | Tree search (11); tag filter shows the folder path (8). |
| Default tags | Unaffected. |
| Export templates | Empty-field count (10) in editor preview and Export page. |
| Outlook add-in, existing call | Unaffected; add-in stays German (A-28.2). |
| NoExport (A-26) | Must stay excluded from filters (8); Time screen finding F-8. |
| Priorities (A-27) | Unaffected; priority names are user data, not translated. |

---

## 13. Text catalogue (keys for the language bundle)

German is binding. English is a **draft** for T-400; ui-designer checks lengths (T-392).

| Key | Deutsch | English (draft) |
|---|---|---|
| `settings.versionCheck.title` | Versionsprüfung | Version check |
| `settings.versionCheck.label` | Nach neuen Versionen suchen | Check for new versions |
| `settings.versionCheck.hint` | Fragt die Veröffentlichungen von SuperTakt auf GitHub ab. Ausgeschaltet stellt SuperTakt keine Verbindung nach außen her. | Queries SuperTakt's releases on GitHub. When off, SuperTakt makes no outside connection. |
| `settings.display.description` | Alles hier wirkt sofort und bleibt beim nächsten Start erhalten. | Everything here applies immediately and is kept on the next start. |
| `settings.language.label` | Sprache | Language |
| `settings.language.hint` | Das Outlook-Add-in und die Meldungen des lokalen Dienstes bleiben vorerst deutsch. | The Outlook add-in and messages from the local service stay in German for now. |
| `rules.order.group` | Reihenfolge von {name} | Order of {name} |
| `rules.order.up` / `.down` | {name} nach oben / nach unten | Move {name} up / down |
| `rules.order.toast.title` | Reihenfolge geändert. | Order changed. |
| `rules.order.toast.up` / `.down` | {name} steht jetzt weiter oben. / weiter unten. | {name} is now higher. / lower. |
| `rules.order.toast.boardLeft` / `.boardRight` | Auf dem Board steht die Spalte jetzt weiter links. / weiter rechts. | On the board the column is now further left. / right. |
| `rules.order.failure` | Die Reihenfolge ließ sich nicht ändern | The order could not be changed |
| `timer.longStop.lead` | Eine Buchung dauert höchstens 24 Stunden. Wann endete die Arbeit? | A booking lasts at most 24 hours. When did the work end? |
| `timer.longStop.endLabel` | Ende / Ende für {name} | End / End for {name} |
| `timer.longStop.hint` | Anfang: {start}. Die Zeit nach dem Ende wird nicht gebucht. | Start: {start}. Time after the end is not booked. |
| `timer.longStop.readout` | Gebucht werden: {duration} | To be booked: {duration} |
| `booking.end.missing` | Ende fehlt. | End is missing. |
| `booking.end.beforeStart` | Ende liegt vor dem Anfang. | End is before the start. |
| `booking.end.over24h` | Ende liegt mehr als 24 Stunden nach dem Anfang. | End is more than 24 hours after the start. |
| `booking.end.future` | Ende liegt in der Zukunft. | End is in the future. |
| `import.rejectedOver24h` | {n} Buchungen über 24 Stunden abgewiesen. | {n} bookings over 24 hours rejected. |
| `archive.keptOver24h` | {n} Buchungen dauern länger als 24 Stunden. Sie wurden unverändert übernommen. | {n} bookings last longer than 24 hours. They were kept unchanged. |
| `workstation.permissions.title` | Die Dateien des Bestands sind für andere Benutzer lesbar | The data files are readable by other users |
| `workstation.permissions.body` | SuperTakt konnte die Rechte beim Start nicht enger setzen. Der Bestand enthält Kundendaten und interne Vermerke. | SuperTakt could not restrict the permissions at start. The data contains customer data and internal notes. |
| `workstation.permissions.remedy` | Rechte der Dateien im Ordner oben auf den eigenen Benutzer beschränken, dann SuperTakt neu starten. Die Warnung verschwindet nach dem Neustart. | Restrict the files in the folder above to your own user, then restart SuperTakt. The warning disappears after the restart. |
| `todos.hiddenDone` | {n} erledigtes Todo ist / erledigte Todos sind ausgeblendet. | {n} done todo is / done todos are hidden. |
| `time.pick.allDone` | Alle Todos sind erledigt. | All todos are done. |
| `bookings.filter.tag` / `.pool` / `.note` | Tag / Pool / Leistung | Tag / Pool / Work done |
| `bookings.filter.note.present` / `.missing` | Vorhanden / Fehlt | Present / Missing |
| `bookings.filter.gone` | nicht mehr vorhanden | no longer exists |
| `today.rowMenu` | Aktionen für die Buchung {name} | Actions for booking {name} |
| `export.emptyField.summary` | {n} Exportzeile(n) mit leerem Feld: {fields} | {n} export row(s) with an empty field: {fields} |
| `export.emptyField.legend` | Leeres Feld: Die Quelle liefert für diese Zeile nichts, etwa ein Todo ohne Call-Nummer. Die Zeile wird trotzdem exportiert. | Empty field: the source yields nothing for this row, e.g. a todo without call number. The row is exported anyway. |
| `tags.search.label` | Tags und Ordner durchsuchen | Search tags and folders |
| `tags.search.count` | {n} Treffer | {n} matches |
| `tags.search.none` | Kein Tag und kein Ordner passt zu {query}. | No tag or folder matches {query}. |
| `tags.search.clear` | Suche leeren | Clear search |

---

## 14. Open questions (for the orchestrator) — all answered

All ten questions are answered by the orchestrator in E-123 and E-124 (2026-09-23). The answers
are binding for T-397, T-400 and the text catalogue in section 13. The original questions stay
below for traceability.

| Question | Answer | Source | Consequence for this paper |
|---|---|---|---|
| F-1 | The pool movement sentence stays German from the domain in the **add-in**. The main UI builds it itself from the **structure** (pool names, direction) via text keys. | E-124 point 1, E-121 point 9 | Main UI: the movement sentence in 5.1 becomes a keyed text with parameters from the structure (key name and parameter set are fixed by the implementing order); no German domain sentence in an English toast. Add-in keeps the domain sentence. |
| F-2 | **en-GB**: day before month, 24-hour clock. Display only, no data consequence; submitted to the client in the closing report. | E-123 point 1 | Table 2.3 is decided, no longer a proposal. Sorting of user data does not follow the language (E-123 point 2). |
| F-3 | Yes — the board setup dialog also replaces its previous toast. | E-124 point 2 | Rule 3.3 applies to both reorder surfaces. |
| F-4 | Yes — the 24-hour limit applies to **every** booking that is created, including "Bis zum letzten Lebenszeichen buchen". Same end field as 4.2, default `min(heartbeat, start + 24 h)`. | E-124 point 3 (clarifies A-28.6) | Row in 4.1 filled; the orphaned-timer option gets the end field and the field error from 4.2. |
| F-5 | Yes — every "Gearbeitet" section after an idle return (and the active part before the absence) gets the same field error. The sum rule A-24.5 stays. | E-124 point 3 | Row in 4.1 filled. Note E-127: phases begun before A-28.6 are not checked on return (named, time-limited gap). |
| F-6 | No rail marker. | E-124 point 4 (E-078, less text) | AK-6.4 rewritten; the warning lives only on Settings → Arbeitsplatz. |
| F-7 | Service filters `tagId`, `poolId`, `hasNote` on `GET /time-entries`, applied before paging and in the export selection. | E-124 point 5 | Built in T-397; AK-8.2 names it. |
| F-8 | NoExport does not count as "offen". `TimeEntry` gets a read-only `todoNoExport` (T-397); the Time screen evaluates it (T-400). | E-124 point 6, A-26.2, A-6.6 | 9.3 names the field; no todo lookup in the UI. |
| F-9 | The interpretation of C-21 in section 10 stands. Separately: `TimeScreen.tsx:191-194` mentions the Leistung prompt only when it is switched on (A-22). | E-124 point 7 | Section 10 stays valid. |
| F-10 | The rail hint "Arbeitsplatz" stays unchanged. | E-124 point 4 | No text change on the navigation item; no E-087 search needed. |

Related, not asked here: messages of the local service stay German and carry `lang="de"` in the
English UI (E-123 point 5); the language choice never reaches the export file (E-123 point 4).

### 14.1 Original questions (answered, kept for traceability)

- **F-1 Language switch and domain sentences.** The pool movement sentence
  (`poolMovementSentence`, `@takt/domain`) is German and measured character-exact against the
  add-in. E-121 point 9 moves three other domain sentences to UI keys. Does the movement sentence
  follow (key + parameters) or stay German inside English toasts (then with `lang="de"`)?
- **F-2 English formats.** en-GB (23/09/2026, 24-hour) proposed; en-US would be 09/23/2026 and
  12-hour. Decision by the client.
- **F-3 Board setup dialog feedback.** Should the board dialog's reorder toast also use the
  "one toast replaces the previous" rule (3.3)? Proposed yes, for parity.
- **F-4 Orphaned timer > 24 h.** "Bis zum letzten Lebenszeichen buchen" can exceed 24 h after a
  multi-day crash. Proposal: same end field as 4.2 inside that option, default
  min(heartbeat, start + 24 h). Needs confirmation that A-28.6 "Stoppt der Timer" covers it.
- **F-5 Idle return > 24 h.** A "Gearbeitet" section in the A-24 dialog can exceed 24 h; the
  active part before the absence as well. Proposal: the section gets the same field error; the
  sum rule (A-24.5) stays. Needs a decision; A-24.5 and A-28.6 otherwise collide.
- **F-6 Rail marker for A-28.8.** A warning only on Settings → Arbeitsplatz is easy to miss. A
  marker at the rail entry ("Arbeitsplatz — Warnung") would be a new surface (E-078 point 6).
  Build or not?
- **F-7 Service filters for C-14.** Tag, pool and Leistung filters must act before paging and on
  export selection, so `GET /time-entries` needs `tagId`, `poolId`, `hasNote`. T-397 does not
  list C-14. Add to T-397 or to a later wave?
- **F-8 NoExport on the Time screen.** `TimeScreen.tsx:161-164` counts NoExport bookings into
  "Noch offen", and `TodayRow` shows them as "offen" (A-26.2, A-6.6). `TimeEntry` does not carry
  the flag. Needs either the flag on the entry (domain-dev) or a todo lookup (frontend-dev).
- **F-9 Meaning of C-21.** The T-025 report is no longer in Git. Interpretation used: an
  unconditional template field that is empty in a row. If C-21 meant something else, section 10
  is void.
- **F-10 Rail hint "Arbeitsplatz".** Adding "Versionsprüfung" to the ≤ 5-word hint is a text
  change on a navigation item (E-087 search needed); ui-designer decides whether it fits.
