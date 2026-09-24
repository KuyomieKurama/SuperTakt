# Wave 18 — UI specification (T-392)

Scope: O-KT + O-LC (the calm third state in the open-file dialog, A-19.15), the language switch
(A-28.2), and the visual form of the T-391 surfaces: A-28.1 switch, A-28.3 pool order, A-28.6
dialog, A-28.8 warning. Consumer: frontend-dev in T-400.

This paper **extends** the existing system. It adds no token to `packages/ui-tokens/tokens.css`, no
new component, no new motion, and no new visual direction. Every value below is an existing token
or an existing class.

**Dependency on T-391.** `docs/design/welle-18-fluss.md` (ux-designer, running in parallel) did not
exist when this paper was written. Where flow, wording, or placement belongs to T-391, this paper
states an **assumption** (marked **[A-n]**) and gives the visual form only. If T-391 decides
otherwise, T-391's flow wins and the visual rules here still apply to the chosen place. German
sentences quoted below are placeholders for the shape, not approved copy (E-078 point 4: ux-designer
writes the words).

Sources read: `docs/spec.md` A-19.15, A-21.4, A-25.4, section 28; `decisions.md` E-078, E-118,
E-120, E-121; `docs/design/supertakt-layout.md`, `theme-palettes.md`, `todo-tabelle.md`,
`fensterfeste-flaechen.md` 7.1–7.5; `packages/ui-tokens/tokens.css`; `styles/components.css`
2480–2625; `styles/theme-base.css`; board rows O-KT, O-LC, T-391, T-400.

---

## 0. Motion gate for the whole wave

Nothing in this wave animates. Checked per surface against the frequency gate (skills
`emil-design-eng` and `animate`, step 1 and 2):

| Surface | Frequency / trigger | Decision | Reason |
|---|---|---|---|
| Open-file dialog, third state | occasional | **no new motion** — keeps the existing `takt-rise` of `.dialog` and `takt-fade` of `.scrim` | The state is a different content of the same dialog, not a new surface. |
| Language switch | rare, but a **content replacement** of the whole UI | **no transition, instant** | There is no spatial relation between old and new text; a crossfade would show two languages overlapping. Purpose test fails. |
| Version check checkbox | rare | **no motion** | Checkbox state change is its own feedback. |
| Pool up/down | occasional, **keyboard-operable and repeated in bursts** | **no motion** — rows swap instantly | Keyboard-initiated actions never animate (gate rule). The same button serves mouse and keyboard, so one rule: none. Board columns (`BoardSetupDialog`) do not animate either; parity. |
| Stop > 24 h dialog | rare | existing `FormDialog` entrance only | Standard dialog. |
| Permission warning | appears on load of a settings area | **no motion** | Present-on-arrival content, not a change the user caused. |

Existing tokens note (not changed here): `--ease-out` in `tokens.css:302` is
`cubic-bezier(0.16, 1, 0.3, 1)`, not the `cubic-bezier(0.23, 1, 0.32, 1)` named in the ui-designer
rules. Both are strong ease-out curves; changing the token touches every transition in the product
and is not in this wave's scope. Reported, not acted on.

---

## 1. O-KT + O-LC — the calm third state of the open-file dialog

### 1.1 Finding

`apps/web/src/features/todos/AttachmentOpenDialog.tsx` has three states:

| State | Title | Head icon | Body line |
|---|---|---|---|
| opens | "Diese Datei wird geöffnet" | `info`, neutral (`.dialog__icon`) | plain `<p>` |
| executes | "Diese Datei wird ausgeführt" | `alert-triangle`, `.dialog__icon--danger` | `.dialog__consequence` (red) |
| **blocked** (`foreseenRefusal`, V-07) | "Diese Datei wird nicht geöffnet" | **`alert-triangle`, `.dialog__icon--danger`** (`:359-360`) | **`.dialog__consequence` (red) with `alert-triangle`** (`:380-384`) |

The blocked state now only reaches legacy data: `checkAttachmentPath` rejects both classes at the
door (`packages/domain/src/attachment.ts:826-837`). Under Linux the most likely hit is a harmless
file with a colon in its name. It gets the same red triangle as a `.exe`. The title is a
**statement** (A-19.15: "sagt das an Ort und Stelle. Er verschwindet nicht und er wirft nicht."),
the form is an **alarm**. Red next to red also blunts the one red that matters: "this starts a
program".

The post-click refusal (`:537-543`, `refusal` prop, filled from `refusalText` in
`features/todos/Attachments.tsx:151-165`) has the same problem for one of its outcomes: `rejected`
with a known reason (`path_missing`, `path_unc`, `path_indirect_extension` …) is an observation or
a rule (the comment at `Attachments.tsx:105-108` says so), not a failure. `failed` ("Das Öffnen
ist fehlgeschlagen") and `unavailable` are real failures of the user's action.

### 1.2 Decision: three tones for `.dialog__consequence`, named by meaning

The component already has three looks. Until now they were named after the one sentence that used
them. They become three **tones** with a meaning each. The old modifier names stay as aliases in a
selector list, so no class disappears (the `proof-clamp` measurement and any test selector keep
working).

| Tone | Meaning | Class | Rail | Background | Text | Line icon |
|---|---|---|---|---|---|---|
| **danger** (base, unchanged) | Something irreversible happens, or the user's action failed | `.dialog__consequence` | `--danger-bg` | `--danger-bg-subtle` | `--danger-text` | `alert-triangle` |
| **warning** | Needs the user's attention; nothing has failed | `.dialog__consequence--warning` = existing `--rebuilt` | `--warning-border` | `--warning-bg` | `--warning-fg` | `alert-triangle` |
| **statement** | A fact. Nothing to fear, nothing to fix here | `.dialog__consequence--statement` = existing `--origin` | `--border-strong` | `--bg-inset` | `--text-secondary` | subject icon, default `info` |

CSS change (in `styles/components.css`, replacing the two rules at `:2579-2589`, comment kept and
reworded):

```css
.dialog__consequence--statement,
.dialog__consequence--origin {
  border-inline-start-color: var(--border-strong);
  background-color: var(--bg-inset);
  color: var(--text-secondary);
}

.dialog__consequence--warning,
.dialog__consequence--rebuilt {
  border-inline-start-color: var(--warning-border);
  background-color: var(--warning-bg);
  color: var(--warning-fg);
}
```

And one head-icon modifier with the same neutral pair, so head and line agree:

```css
.dialog__icon--statement {
  background-color: var(--bg-inset);
  color: var(--text-secondary);
}
```

No new token. Contrast: `--text-secondary` on `--bg-inset` is the pair `--origin` already uses
(light `#454e5d` on `#e3e8ef`, ≈ 6.8 : 1; dark `#b9c4d4` on `#0e1626`). In the themes, `--bg-inset`
is `--preset-canvas` and `--text-secondary` is mixed from `--preset-ink` (`theme-base.css:11,17`);
the pair is the same one `--origin` already relies on in all nineteen themes. The rail
`--border-strong` on `--bg-inset` is ≈ 4.6 : 1 in the light default (non-text ≥ 3 : 1, SC 1.4.11).
**Handover:** if `pnpm contrast` does not already list `--text-secondary`/`--bg-inset` and
`--border-strong`/`--bg-inset` per theme and mode, add both pairs.

### 1.3 The blocked state, specified

```
┌──────────────────────────────────────────────┐
│ [⊘]  Diese Datei wird nicht geöffnet          │   head: .dialog__icon.dialog__icon--statement,
│                                              │         icon "slash-circle", 18
│ ┃ ⓘ  Der Dateiname trägt einen Doppelpunkt.  │   line: .dialog__consequence
│ ┃    Unter Windows benennt er …              │         .dialog__consequence--statement,
│                                              │         icon "info", 14
│ ┌ openfile box (unchanged) ───────────────┐  │
│ │ Dateiname / Vollständiger Pfad / Endung │  │
│ └─────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│                                  [Schließen] │   footer unchanged: one secondary button
└──────────────────────────────────────────────┘
```

| Element | Before | After |
|---|---|---|
| `.dialog` frame | no `--danger` (correct) | unchanged |
| head icon (`:359-360`) | `alert-triangle` + `--danger` | `slash-circle` + `.dialog__icon--statement` |
| title | "Diese Datei wird nicht geöffnet" | unchanged (already a statement) |
| line (`:380-384`) | base `.dialog__consequence`, `alert-triangle` | `.dialog__consequence--statement`, `info` |
| extension verdict | `executes` is false when blocked, so no red | unchanged |
| footer | "Schließen", secondary | unchanged |
| role | `alertdialog` | unchanged: the dialog still interrupts a user action and has no default button (A-A-6 property 4) |

The two other states do not change. The "executes" state keeps its red frame, red head icon, red
line and `danger` button. After this change it is the **only** red in the dialog, which is the
point.

`slash-circle` is also the icon of "nicht abgerechnet" (`shared/ui/ExportStatus.tsx:166`) and of
excluded rule axes (`RuleSummary.tsx:121`). In both it means "not", and so it does here; there is no
export status inside this dialog to confuse it with.

### 1.4 The post-click refusal, specified

The `refusal` line (`:537-543`) takes its tone from the **outcome**, not from the sentence:

| Outcome (`AttachmentOpen.outcome`) | Tone | Line icon |
|---|---|---|
| `rejected` with a key in `REFUSAL_TEXT` (a rule or an observation) | statement | `info` |
| `rejected` without a known key (fallback sentence) | statement | `info` |
| `failed` (the operating system could not open it) | danger (base) | `alert-triangle` |
| `unavailable` (no shell) | danger (base) | `alert-triangle` |

Handover: replace the `refusal?: string | null` prop by
`refusal?: { readonly text: string; readonly tone: "statement" | "danger" } | null`, set in
`refusalText` next to the sentence. The live region `<div role="status">` stays always present.
Do not change the sentence texts (E-087); only the form changes.

### 1.5 O-LC — the coupling, written down so it travels

> **Rule for every task that touches `.dialog__consequence`:** the rail of the danger tone is
> `border-inline-start: 3px solid var(--danger-bg)` (`components.css:2563`). `--danger-bg` is also
> the fill of every `danger` button (`variant="danger"`), including "Ausführen" in this same dialog.
> In the light default both render `#ac2a22`, the same pixel colour as `--danger-text`, but they are
> **different tokens**.
>
> - Changing the rail colour: add a modifier on `.dialog__consequence`. **Never** change
>   `--danger-bg` for the rail's sake. That would also recolour every filled danger button.
> - Changing `--danger-bg`: re-measure both uses: `--text-on-solid` on `--danger-bg` (button text,
>   4.5 : 1) and `--danger-bg` against `--danger-bg-subtle` (rail, 3 : 1), in light and dark mode
>   (`tokens.css:128-133`, `:405-410`, `:507-512`). The themes do not override the danger tokens
>   (`theme-base.css` derives only surface, ink, border and accent), so both modes of the default
>   palette cover all nineteen themes.
> - The statement and warning tones do **not** read `--danger-bg`. Moving a sentence from danger to
>   statement removes it from this coupling.

Other users of the base tone that this wave does **not** change, and why:

- `ConfirmDialog.tsx:207,232`: destructive confirmations, correct.
- `FormDialog.tsx:435`: submit errors, correct.
- `ShellStatus.tsx:466,630`: startup failures, correct. The A-28.5 wording change does not change
  the tone.
- `UpdateDialog.tsx:110`: a failure to open the release page, correct.

---

## 2. Language switch (A-28.2)

### 2.1 Placement and control

Settings → Darstellung, **first field** in the existing card, above "Farbmodus". **[A-1]** The
language decides how you read everything else on the card.

| Property | Value |
|---|---|
| Component | existing `RadioRow` (`shared/ui/RadioRow.tsx`), same as "Farbmodus". Two options, both visible, no dropdown. |
| Group label | in the current UI language: "Sprache" / "Language" |
| Option labels | **each in its own language, always:** "Deutsch" and "English", each with `lang="de"` / `lang="en"` on the label (SC 3.1.2). This way someone who switched by mistake can still find the way back. |
| Icons | none. A flag is a country, not a language. |
| Apply | immediately on change, like theme and density. No confirm, no reload, no toast. |
| Failure | existing Darstellung behaviour: the value snaps back and the failure is reported (`supertakt-layout.md`, "fehlgeschlagene Änderungen werden zurückgesetzt und sichtbar gemeldet"). |
| Focus | stays on the selected radio. Its label does not change (it is in its own language), so the focus target keeps its name. |
| Document | `document.documentElement.lang` follows the setting (`"de"` / `"en"`); `index.html:2` stays `lang="de"` as the default before preferences load (SC 3.1.1). |
| Card description, rail hint | both gain "Sprache" / "Language" (texts belong to T-391; E-087 search before changing). The rail hint must stay one line, see 2.4. |

### 2.2 Formats

All formatting stays in `apps/web/src/lib/format.ts` (the file already says it is the only place).
`LOCALE` becomes the current UI language instead of a constant.

| What | German (`de-DE`, today) | English | Note |
|---|---|---|---|
| Date | `12.09.2026` | **`12/09/2026`** (`en-GB`) **[A-2]** | Day-month order like German, 10 characters, table columns keep their width. See open question Q-1. |
| Date with weekday | `Sa., 12.09.2026` | `Sat 12/09/2026` | from `Intl`, not hand-built |
| Time | `14:05` | `14:05` (24-hour) | 24-hour in both. The timer and the stopwatch are 24-hour; mixing `2:05 PM` with `26:14:03` would be two clocks. |
| Time range | `09:12–10:19 Uhr` | `09:12–10:19` | "Uhr" is German only; the suffix goes into the label table, not the format. |
| Duration | `1:07 h`, `40 s` | `1:07 h`, `40 s` | unchanged, international units |
| Rounded export value (display only) | `0,75` | `0.75` | **Display only.** See 2.3. |
| Count | `1.234` | `1,234` | `Intl.NumberFormat` |
| File size | `12,4 kB` | `12.4 kB` | |
| Plural | "1 Buchung / 7 Buchungen" | "1 booking / 7 bookings" | `plural()` takes both forms from the label table, per language |
| Quotation marks | „Name“ (`quotedName`) | “Name” | `quotedName` and every `„…“` in labels follow the language |
| Enumeration | "A, B und C" | "A, B and C" | today `enumerateGerman` in the domain; moves to the UI with E-121 point 9 |
| Week start in calendars | Monday | Monday | `DateField` `startOfWeek={1}` in both; `locale` follows the language |
| Sorting of user data | `localeCompare(…, "de")` | **unchanged, `"de"`** **[A-3]** | A list the user arranged mentally should not reorder because the UI language changed. See Q-2. |

### 2.3 What the language must never touch

- **The export file.** `Zeit`, `Call`, `Notiz`, `WindowsUser` and the number format inside the file
  come from the export template and the domain (`packages/export`, `rounding.ts`), never from
  `lib/format.ts`. Where the UI shows the **literal file content** (template preview, raw row), it
  shows the file's format in both languages. Only the UI's own display of the value follows the
  language. frontend-dev checks every caller of `formatQuarters` for which of the two it is.
- **Foreign text** (titles, notes, tag names, sender): no `lang` attribute, no translation.
- **Messages from the local service** stay German (A-28.2). In an English UI they appear inside
  English chrome. Every element that renders a service message as text (`errorMessage(cause)` in
  toasts, `InlineMessage` bodies, dialog `error`) wraps it in `<span lang="de">` so screen readers
  switch voice (SC 3.1.2). The Outlook add-in is out of scope.
- **Technical identifiers** (`X-Takt-Token`, file names, paths) unchanged.

### 2.4 Length reserves: English must not break the layout

The common assumption "English is shorter" holds for sentences, not for short labels. German short
nouns become longer English phrases: "Frist" → "Due date", "Zeit" → "Time", "Leistung" →
"Work done", "Vermerk" → "Internal note". The rules:

| Rule | Where it bites | Requirement |
|---|---|---|
| R-L1: **Single-line, `nowrap` labels** carry the longer of both languages | buttons (`components.css:34`), badges (`:434`), table headers (`:768`), deadline word (`app.css:2345`), status default text (`app.css:4944`) | The English label is written to fit the German label's width; if it cannot, it may be at most **+30 %** longer, or **+4 characters** for labels of 8 characters or fewer. More than that means rewording, not widening. |
| R-L2: **Fixed-width columns** hold their longest label in either language | `.table__state` 10.5 rem, `.table__call` 9.5 rem, `.table__note` 12 rem (`todo-tabelle.md` §4) | The longest status badge plus icon, and the header, fit without ellipsis. Measured in both languages. |
| R-L3: **Rows that carry several buttons wrap**; they never truncate the name | `.rule-row`, `.pool-row` (already `flex-wrap: wrap`) | unchanged; verify in English |
| R-L4: **The screen header** keeps its measured behaviour | Kanban: action group 785.3 px, **20.7 px** slack at 1280 (`fensterfeste-flaechen.md` 7.4) | The English action group must not exceed the German one. If it does, the header wraps at 1280. That is the designed fallback and allowed, but it breaks the "identical at 1280" promise, so it must be seen and reported, not discovered. |
| R-L5: **Settings rail hints stay one line** at the rail's minimum width (13 rem) | `.settings-rail__hint` | Rail hints are at most **36 characters** in both languages. The `max-height: 44rem` threshold in 7.5 is computed from a one-line hint; a second line moves it. |
| R-L6: **Dialog footers wrap** | `.dialog__footer` (`components.css:2615`) has no `flex-wrap`; only `.update-dialog` adds it (`app.css:5373`) | Add `flex-wrap: wrap` to `.dialog__footer` itself, keeping `justify-content: flex-end`. At 30 rem, two English labels plus a third button must not overflow. |
| R-L7: **No text in images, no text-width magic numbers** | — | No new `ch`-based widths tied to one language. |

`text-transform: uppercase` (table headers) is language-neutral for DE/EN; no change.

### 2.5 Measurement at the supported size (A-25.4)

frontend-dev and visual-qa measure in **English** what `fensterfeste-flaechen.md` §9 measures in
German, at **960 × 640** and **1280 × 820**:

- every screen: no horizontal overflow of `.app__main` (A2a), the fixed part within its height
  budget (A2);
- Kanban header at 1280: wrapped or not (R-L4);
- settings rail height with and without hint (R-L5);
- the three dialogs of this wave (sections 1, 5) at 640 height.

Themes and modes: the language changes no colour, so contrast is not re-measured per language. It
can change **width**, and no theme changes font family or size (themes set only `--preset-*`
colours, `theme-base.css`). So one theme per mode is enough for the width measurement: **Klassisch
light and Klassisch dark, both densities.** If a theme ever sets a font, this sentence expires.

### 2.6 Known limit: native date-time inputs

The booking form uses `TextField type="datetime-local"` (`BookingDialogs.tsx:179-194`). WebView2 and
WebKitGTK render native date inputs in the **operating system's** locale, not the app's. An English
UI on a German Windows shows `TT.MM.JJJJ --:--` inside those fields. That cannot be fixed with
styling. Two options for T-400, in order of preference:

1. Use the app's own `DateField` + `TimeField` (A-27.8 already asks for an own time component) with
   `locale` from the setting.
2. Keep the native field and accept the mismatch as a documented limit.

This is Q-3; frontend-dev does not pick option 2 silently.

---

## 3. A-28.1 — the version check switch

**[A-4] Placement:** Settings → Arbeitsplatz, a new card **after** "Arbeitsplatz" and **before**
"Sicherheitsmeldungen". Arbeitsplatz is where the app tells you what it does on this computer, and
the version check is the only connection it makes to the outside (E-001, A-18). It does not fit
Darstellung or Daten.

| Property | Value |
|---|---|
| Card | existing `Card`, title "Versionsprüfung" / "Update check" **[A-5]**, short description |
| Control | a **checkbox** in `label.choice__option`, the same form as "Leistung beim Stoppen abfragen" (`SettingsScreen.tsx:302-311`). **Not** a toggle switch: the product has no switch component, and every boolean setting is a checkbox today. A second form for the same kind of control would be a new direction. |
| Label | states the action, e.g. "Nach neuen Fassungen suchen" (wording: T-391) |
| Hint | `p.field__hint` linked with `aria-describedby`. It says the consequence and the absence (E-078 point 1): where it asks, and that nothing goes out when it is off. |
| Default | checked (A-28.1) |
| Save | immediately, `disabled` while saving, like the timer settings |
| Off state | no warning, no colour, no extra line. Turning it off is a legitimate choice, not a risk the UI should argue with. |
| Relation to `nav__version` and the update banner | flow belongs to T-391 (what happens to an already known update when the check is switched off). Visually: nothing new. |

---

## 4. A-28.3 — pool order with up/down

Same controls as the board columns (`BoardSetupDialog.tsx:184-203`), same class, same size.

```
┌ .pool-row ───────────────────────────────────────────────────────────────┐
│ Kunden A  [Pool]                         [↑][↓]  Todos ansehen  Als Spalte │
│ Tags: Kunde A · Status: offen                    aufnehmen  Umbenennen …   │
└──────────────────────────────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Group | `div.board-order` with `role="group"` and `aria-label` "Reihenfolge von „Name“" (same builder as the board, `quotedName`) |
| Buttons | two `IconButton` `size="sm"`, icons `arrow-up` / `arrow-down` |
| Accessible names | "„Name“ nach oben verschieben" / "„Name“ nach unten verschieben". **Not** "links/rechts": that is right for board columns, but the pool list is vertical. |
| Position in the row | directly after the `.grow` block, **before** "Todos ansehen", as on the board. When the row wraps, the order group stays next to the name. |
| Disabled | first row: up. Last row: down. All while a move is in flight. Same as the board. |
| Focus after a move | stays on the pressed button of the **moved** row (React keeps the node when keyed by `pool.id`). If that button becomes disabled (row reached an end), focus moves to the **other** button of the same row. Never to `body` (SC 2.4.3). |
| Announcement | a polite live region under the list states the new position: "„Name“ steht jetzt an Position 3 von 7." (wording: T-391). One region for the list, always present, empty by default. |
| Hint | the board shows "Mit den Pfeilen ändern Sie die Reihenfolge … Die Position wird mit der Pool-Liste geteilt." (`BoardSetupDialog.tsx:260-265`). The pool list gets the mirror sentence under the list when there are at least two rules; wording T-391. **[A-6]** It depends on T-397 whether pool order and column order are the same order. |
| Motion | none (section 0). |
| Dragging | none. Up/down buttons satisfy SC 2.5.7 without a drag alternative. A-28.3 asks for "dieselben Hoch/Runter-Bedienelemente", not dragging. |

---

## 5. A-28.6 — a booking lasts at most 24 hours

### 5.1 Timer stop after more than 24 hours

The existing "Timer stoppen" `FormDialog` (`TimerContext.tsx:584-613`) gets one extra state. No new
dialog.

```
┌ Timer stoppen ───────────────────────────────┐
│ Läuft seit 26:14:03 auf „Angebot Müller“.     │  description (unchanged)
│                                              │
│ ┃ ⚠  Eine Buchung dauert höchstens 24 Stunden.│  .dialog__consequence
│ ┃    Wann haben Sie aufgehört?               │  .dialog__consequence--warning
│                                              │
│ Ende                                         │  same field as "Ende" in the booking form
│ [ 13.09.2026, 08:00                       ]  │  prefilled: start + 24 h
│ Anfang: 12.09.2026, 08:00                    │  .field__hint, so the limit is readable
│                                              │
│ Leistung                                     │  NoteField (unchanged, if shown)
│ [                                         ]  │
│ hint (unchanged)                             │
├──────────────────────────────────────────────┤
│              [Weiterlaufen lassen] [Stoppen …]│
└──────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Tone | **warning**, not danger. Nothing failed and nothing irreversible happens; the user must supply a value. |
| Field | the same component as "Ende" in `BookingFormDialog`, whatever T-400 settles in 2.6. Prefilled with start + 24 h (A-28.6). |
| Initial focus | the "Ende" field. It is the decision; the note is secondary here. |
| Validation | inline field error on "Ende" (existing `error` prop of the field): after the start, not later than start + 24 h, not in the future. Service rejection after submit uses the existing dialog error region (danger tone, correct: that is a failure). |
| Submit / cancel | labels unchanged unless T-391 decides otherwise. |
| Prompt setting off (A-22) | **[A-7]** The dialog still appears in this case, with the field and without the `NoteField`. Stopping silently would cut or extend time without asking, and A-28.6 forbids silent cutting. The flow belongs to T-391. |
| Height at 960 × 640 | ≈ 450 px with the note field, within the 592 px the scrim leaves. The body of `.dialog--form` scrolls if needed and the footer stays (`viewport-layout.css:57-75`). |

### 5.2 Manual booking and edit over 24 hours

`BookingFormDialog`: inline error on "Ende" with the same rule text as in 5.1. No new element. The
service rejection is the existing dialog error.

### 5.3 Import and archive results

Rejected bookings in a foreign import: a count in the existing import result, formatted by
`formatCount`. Longer bookings kept from an own archive: an `InlineMessage tone="warning"` in the
existing result area. The exact result layout belongs to T-391 and the data-transfer surface. No new
component.

---

## 6. A-28.8 — warning about too-open file permissions

**[A-8] Placement:** Settings → Arbeitsplatz, inside `DatabaseLocationFact`, in the existing
`.dbconcerns` list (`WorkstationFacts.tsx:146-172`). It is the same kind of statement ("something
about where your data lives is weaker than it should be") and needs the same anatomy.

| Property | Value |
|---|---|
| Component | `InlineMessage tone="warning"`, like every path concern |
| Anatomy | title, body (what is too open and what follows), remedy line with `arrow-up-right` (`.dbconcerns__remedy`), meta line (`.dbconcerns__meta`) with the affected file names in `.mono` |
| Order | **first** in the list. It is measured on the file; the path concerns are inferred from the path. |
| No finding | **nothing rendered** (A-28.8). No green all-clear line. |
| Browser / no file | nothing, as today when `path === null` |
| Colour | warning tokens only; both modes through the tokens |

**Sentence that becomes false. Same task, not a follow-up.** `WorkstationFacts.tsx:265-277` says
that for **this file** the service does not ask the operating system ("zu dieser Datei tut er das
nicht"). With A-28.8 it does, at least for permissions. That sentence must be corrected in T-400
together with the warning (CLAUDE.md: when a surface changes, the sentences about it change in the
same task). E-087 search first.

**Discoverability, open (Q-4).** The warning is only seen by someone who opens Arbeitsplatz. A small
`alert-triangle` (12 px, `--warning-fg`, with visually hidden text) after the rail label
"Arbeitsplatz" would make it findable without a banner. That is a flow decision for T-391. If
chosen, it uses the rail's existing icon slot pattern and no new colour.

---

## 7. States overview

| Surface | Empty / none | Loading | Hover | Active | Focus | Error | Confirmation |
|---|---|---|---|---|---|---|---|
| Open-file, blocked | — | — | button: existing | existing | dialog itself, then the one button | — (it is a statement) | one "Schließen" |
| Open-file, post-click | live region empty | button `loading` | existing | existing | dialog on busy (`:270-276`) | `failed`/`unavailable`: danger tone | `rejected`: statement tone |
| Language | — | radio `disabled` while saving | `RadioRow` existing | existing | stays on the radio | snap back + report | none (instant) |
| Version switch | — | checkbox `disabled` while saving | existing | existing | checkbox ring | snap back + report | none |
| Pool order | < 2 rules: no hint, buttons disabled | all order buttons disabled in flight | `IconButton` existing | existing | stays on moved row | toast via `toasts.failure`, order restored | live region sentence |
| Stop > 24 h | — | submit `loading` | existing | existing | "Ende" field | field error + dialog error | existing stop toast (A-28.7 adds day group and rounded value) |
| Permission warning | nothing | inside the card's existing load | — | — | — | — | — |

---

## 8. Handover to frontend-dev (T-400)

1. `components.css:2579-2589`: selector lists `--statement, --origin` and `--warning, --rebuilt`
   (1.2); add `.dialog__icon--statement`. Reword the comment above them to the three tones.
2. `AttachmentOpenDialog.tsx:359-360, 380-384`: blocked state as 1.3.
3. `AttachmentOpenDialog.tsx:537-543` and `Attachments.tsx:151-165`: `refusal` with tone (1.4).
   Texts unchanged.
4. O-LC rule (1.5) into the comment at `components.css:2557` in one or two lines, pointing to this
   paper.
5. `lib/format.ts`: `LOCALE` from the setting; formats as 2.2; `Uhr` and plural forms into the label
   table; `quotedName` per language; export-file values untouched (2.3).
6. `document.documentElement.lang` follows the setting; service messages wrapped in `lang="de"`.
7. Language `RadioRow` first in Darstellung, option labels in their own language with `lang`.
8. `.dialog__footer { flex-wrap: wrap; }` (R-L6).
9. English measurement set from 2.5, reported with numbers.
10. Version check checkbox card (3).
11. Pool order group (4), including focus rule and live region.
12. Stop > 24 h state in the existing stop dialog (5.1), same "Ende" field as the booking form.
13. Permission warning in `.dbconcerns`, first; correct the sentence at
    `WorkstationFacts.tsx:265-277` in the same change (6).
14. E-087: before any text changes (card description, rail hint, the sentence in item 13), search
    today's wording in `tests/**` and `apps/*/test/**`, both with `git grep` and in the source trees.

No step requires a new token, a new component file, or a new animation.

---

## 9. Assumptions

| ID | Assumption | Reverts if |
|---|---|---|
| A-1 | Language field is first in the Darstellung card | T-391 places it elsewhere |
| A-2 | English uses `en-GB` date order and 24-hour time | Q-1 answered otherwise |
| A-3 | Sorting of user data stays German collation | Q-2 answered otherwise |
| A-4 | Version switch lives in Arbeitsplatz, own card | T-391 places it elsewhere |
| A-5 | Card title "Versionsprüfung" | T-391 wording |
| A-6 | Pool list and board share one order, so the hint mirrors the board's | T-397 models them separately |
| A-7 | With the prompt off, the > 24 h stop still asks for the end | T-391 decides otherwise |
| A-8 | Permission warning sits in `.dbconcerns` | T-391 places it elsewhere |

## 10. Open questions

- **Q-1 (to the client via orchestrator):** English date format: `en-GB` (`12/09/2026`, 24 h), which
  this paper recommends, or `en-US` (`09/12/2026`, 12 h)? The same digits mean different days, so
  this is not a matter of taste.
- **Q-2:** Should sorting of tags and names follow the UI language, or stay fixed? Recommended: fixed.
- **Q-3:** Native `datetime-local` versus own fields under an English UI (2.6).
- **Q-4:** Rail marker for the permission warning (6), flow decision for T-391.
