# T-184 — Vier Wortlautfragen, ein überholtes Versprechen, meine eigene Wiedervorlage

**Rolle:** spec-ux-reviewer **Datum:** 2026-09-05, Nachtrag 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `docs/spec.md`, `docs/design/textbestand.md` (T-163 mit Nachtrag T-180),
`.claude/team/reports/T-175-frontend-dev.md`, `.claude/team/reports/T-177-spec-ux-reviewer.md`
(P-1 bis P-7, Z-01 bis Z-16), `.claude/team/reports/T-178-domain-dev.md`, und der laufende Baum
nach T-181.

**Stand des Baumes, den ich beurteilt habe:** T-181 hat ST-01 bis ST-05, ST-03, ST-04, ST-07,
ST-09 und UM-03 bereits gebaut; frontend-dev arbeitet in dieser Welle weiter in `apps/web`.
Zeilennummern aus T-163 und T-177 stimmen deshalb an mehreren Stellen nicht mehr. Wo ich eine
Zeile nenne, ist sie **heute** gemessen, und wo sie sich verschoben hat, nenne ich beide.

> **Abschnitt 8 ist ein Nachtrag vom 2026-09-06** auf zwei Rückfragen des Orchestrators. Er
> **berichtigt zwei Urteile dieses Berichts** (Z-28b und die Nachmessung zu ST-03) und stellt
> eine dritte Frage neu. Wer nur die Abschnitte 1 bis 7 liest, liest an zwei Stellen einen
> überholten Stand.

---

## Kurzfassung

```
Aufgabe: T-184 — O-FQ, O-FN, O-EY, O-EZ, O-FG; Nachtrag: ST-07 am Baum, die Zusage aus
         Abschnitt 1 des Textbestands, die Aussage des Gleichlauflaufs
Status: braucht Review (Freigaben erteilt, drei blockierende Befunde daneben)
```

**Blockierend: Z-19b, Z-23b, Z-31.** Alle drei sind Nacharbeit an einer Stelle, an der eine
Streichung oder eine Bauart ihren Ausgleich mitnähme, ohne daß es jemand sähe. **Z-28b ist mit
dem Nachtrag gegenstandslos geworden und durch Z-31 ersetzt.**

---

## 0. Urteil in einer Tabelle

| Gegenstand | Urteil |
|---|---|
| **O-FQ 1** Titelsatz auf P-2/P-4 | **ja, wechselt** — Z-17, dazu eine Berichtigung an meiner eigenen Regel P-1 |
| **O-FQ 2** `PoolRenameDialog` unter P-6? | **nein** — Z-18. Er ist kein Fehlertext, und er ist die **bessere** Erfüllung von P-7 |
| **O-FQ 3** `NoteField.required` | **weder toter Zweig noch Lücke: ohne Deckung** — Z-19a. Dazu **Z-19b, blockierend**: die Meldefläche desselben Bausteins ist nach der falschen Bauart gebaut |
| **O-FQ 4** Auslösung beim Verlassen | **so nicht** — Z-20, zwei neue Regeln **P-8** und **P-9** |
| **O-FN** `PATH_MESSAGE` | **Nacharbeit, klein** — Z-21. Ein Wort fällt, und ein zweites eine Ebene tiefer |
| **O-EY** „Arbeitsplatz" | **e2e, nicht Einheit** — Z-22, mit der Bedingung, die den Prüffall überhaupt wirksam macht |
| **O-EZ ST-06** `TodoListScreen` | **freigegeben mit Auflagen** — Z-23a; **Z-23b blockierend** |
| **O-EZ ST-06** `TodoFormDialog` | **freigegeben mit Auflage** — Z-24 |
| **O-EZ ST-08** `PoolFormDialog` Beschreibung | **freigegeben mit Auflage** — Z-25 |
| **O-EZ ST-08** `PoolFormDialog` Ordnertiefe | **abgelehnt** — Z-26 |
| **O-EZ UM-05** | **kein Gegenstand, geschlossen** — Z-27 |
| **O-EZ UM-07** | **freigegeben in der Sache** — Z-28a; ~~Z-28b~~ ersetzt durch **Z-31, blockierend** |
| **O-EZ UM-08, SP-09-Kürzung** | **nicht beurteilt** (Abschnitt 4.7, mit Gründen) — bleibt so |
| **O-EZ ST-03** `labels.ts` | ~~erledigt~~ **berichtigt in 8.2: nicht vollständig.** Es gibt eine **sechste** Kennung, und sie ist die einzige mit Prüffall |
| **O-FG** fünf Textträger | Z-29, Z-30 und drei kurze Urteile — Abschnitt 5 |
| **Nachtrag: ST-07 am Baum** | **(c), er bleibt** — aber UM-07 ist nicht erledigt, und der Kommentar behauptet es. **Z-31** |
| **Nachtrag: die Zusage aus Abschnitt 1** | **trägt nicht mehr** — **Z-32**, und sie ist die dritte Stelle derselben Klasse in diesem Bericht |
| **Nachtrag: Aussage des Gleichlauflaufs** | **Gleichheit, nicht Ordnung** — **Z-33** |

---

## 1. O-FQ — die vier Fragen aus T-175

### 1.1 Z-17 — der Titelsatz wechselt auf P-2/P-4, und meine eigene Regel bekommt eine Berichtigung

**Heute:** `apps/web/src/screens/TodoFormDialog.tsx:91-92`

```
"Ohne Titel lässt sich ein Todo nicht wiederfinden."
```

festgehalten in `tests/e2e/field-live-region-announcement.spec.ts:96`.

**Der Grund, den T-175 nicht haben konnte.** T-175 Risiko 1 schreibt: „Im `TodoFormDialog` kann
das heute nicht eintreten (nur ein Pflichtfeld)." Das war richtig, bevor T-175 selbst die
`badInput`-Meldung baute — **und ist seither falsch.** `FormDialog.tsx:238-242` setzt für das
Fristfeld „Frist: Tag, Monat und Jahr gehören dazu."; das Fristfeld ist **nicht** `required`, die
Meldung hängt also nicht an der Pflicht. Gemessen am Quelltext ist damit dieser Fall erreichbar:

1. In „Frist" `12` tippen, Feld verlassen → `TextField` setzt die `badInput`-Meldung.
2. Titel leer lassen, „Anlegen" drücken → `submit()` setzt `titleTouched`.
3. Zwei `role="alert"`-Flächen im selben Dialog tragen gleichzeitig Text. Die eine sagt
   „Frist: …", die andere sagt „Ohne Titel …".

**Wer hört und nicht sieht, hat für die zweite keinen Bezug.** Genau dafür ist P-2 da. Die
Ausnahme ist damit nicht mehr eine Ausnahme ohne Schaden, sondern eine mit.

**Berichtigung an P-1, und sie ist meine.** Mein eigenes P-4-Muster aus T-177
(„Titel fehlt — ohne ihn lässt sich das Todo nicht wiederfinden.") ist dort mit **58 Zeichen**
angegeben. Nachgezählt sind es **62** — mein Muster verletzt meine eigene Grenze. Statt den Satz
dem Zahlenwert anzupassen, berichtige ich die Regel, denn der Fehler liegt in ihr:

> **P-1 (berichtigt).** Ein Satz, mit Punkt, kein Ausrufezeichen, kein „Bitte", kein „Sie
> müssen". **Die Grundform nach P-3 bleibt bei 60 Zeichen.** Ein Satz mit dem zweiten Halbsatz
> aus P-4 darf **80** — dieselbe Grenze wie ein dauerhaft sichtbarer Feldhinweis (S-05), und
> P-4 begrenzt ihn ohnehin auf **einmal je Formular**.

**Vorgegebener Wortlaut** (62 Zeichen, der Rumpf zeichengleich zu heute):

```
Titel fehlt — ohne ihn lässt sich ein Todo nicht wiederfinden.
```

Nur der Kopf kommt hinzu. Das ist Absicht: Die Änderung am Prüffall ist damit eine **Voranstellung**
und keine Neufassung, und wer den Unterschied im Diff sucht, findet ihn in einer Zeile.

**Auflage, und sie ist der eigentliche Punkt (an e2e-tester).**
`tests/e2e/field-live-region-announcement.spec.ts:96` benutzt `toContainText`. Wird dort nur der
**Rumpf** nachgezogen, ist die Zeile weiterhin grün — und genau das Stück, um dessentwillen der
Satz geändert wird (das erste Wort ist die Feldbeschriftung, P-2), bleibt **ungemessen**. Der
Prüffall mißt deshalb künftig die **ganze** Zeichenkette einschließlich `Titel fehlt`.

**Zweiter Hinweis an e2e-tester, ohne Auflage:** Der Kopfkommentar derselben Datei (Zeilen 36-59)
beschreibt den Zustand **vor** `noValidate` und begründet ausführlich, warum das Feld mit lauter
Leerzeichen gefüllt wird. Seit T-175 trägt `FormDialog.tsx:159` `noValidate`; der Umweg ist nicht
mehr nötig, und der als „Befund, nicht behoben" festgehaltene Absatz (Zeilen 54-59) beschreibt
einen behobenen Zustand. Ein Kommentar, der einen behobenen Zustand beschreibt, wird beim nächsten
Lesen für offen gehalten — dieselbe Klasse wie Z-09.

### 1.2 Z-18 — `PoolRenameDialog` fällt **nicht** unter P-6

**Gemessen** (`apps/web/src/screens/PoolRenameDialog.tsx:150-161`): Der Text ist kein `error`,
sondern ein `hint`, und er hat **drei** Zweige, keinen dauerhaften:

| Zustand | Text |
|---|---|
| Name doppelt | *(dann steht statt dessen `fieldError`)* |
| Name leer | „Ohne Namen geht es nicht: Er ist das, woran diese Regel auf dem Board und in den Pools erkennbar ist." |
| Name unverändert | „Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den Dialog." |
| sonst | „Der neue Name erscheint sofort überall, wo diese Regel genannt wird." |

Er ist damit **Träger T1** (zustandsgebunden) und nicht „dauerhaft", wie T-175 ihn nennt. Beim
Öffnen steht `name = pool.name`, der leere Zweig erscheint also **erst, nachdem der Benutzer das
Feld selbst geleert hat**.

**Urteil: nein.** P-6 regelt den Zeitpunkt einer **Meldung** — eines Satzes in der
`role="alert"`-Fläche, der eine Eingabe absagt. Ein Hinweis ist eine andere Textsorte (S-05) mit
einer anderen Aufgabe: Er sagt eine **Regel**, kein Urteil über eine Eingabe.

**Und er ist die bessere Erfüllung von P-7, nicht deren Ausnahme.** P-7 verlangt „nie gleichzeitig
gesperrt und stumm". Der Knopf ist hier von der ersten Sekunde an gesperrt (`blocked`, `:148`),
und von der ersten Sekunde an steht daneben, warum — ohne jemanden zu tadeln, der noch nichts
getan hat. Eine Meldung könnte das nicht leisten: Sie dürfte nach P-6 gar nicht so früh stehen.

**Auflagen:**

1. **Er bleibt ein `hint` und wird nicht in einen `error` überführt.** Ein `error` im selben
   Ausdruck erschiene, sobald das Feld leer ist — also **beim ersten Rücklöschzeichen**, und das
   ist genau der Tadel beim ersten Zeichen, den P-6 und SC 3.3.1 verbieten.
2. **Er steht im Textdurchgang unter keiner der drei Streichfragen.** D nein (er steht einmal),
   S nein (kein Bedienelement zeigt „warum gesperrt"), V nein (er ist bereits T1). Dieselbe
   Begründung wie Z-08 für `status-admin__blocked`.
3. **Ohne Auflage, an ux-designer:** „**Ändern Sie ihn** — oder schließen Sie den Dialog." trägt
   als einzige der vier Fassungen eine Anrede im Befehl. E-080 Punkt 4 zieht die anredefreie
   Fassung vor. Das ist eine Wortlautfrage und gehört in den Textdurchgang, nicht in diese Auflage.

### 1.3 Z-19 — `NoteField`: zwei Befunde, und der zweite ist der größere

#### Z-19a — `required` ist weder toter Zweig noch Lücke, sondern **ohne Deckung**

**Gemessen:** `NoteField.tsx:78, 94, 135-140, 151-152` führt `required` bis an das `<textarea>`
und an den sichtbaren Stern. **Kein einziger Aufrufer im Produkt setzt sie**; der einzige Setzer
ist `showcase/NotesSection.tsx:133`. Ebenso `error`: kein Produktaufrufer, nur
`NotesSection.tsx:135`.

Die Frage lautete „toter Zweig oder Lücke?". Beides trifft nicht. Die Eigenschaft hat **keine
Anforderungs-ID**, und für die eine Feldart, an der die Musterseite sie vorführt, steht sie im
**Widerspruch** zu einer Entscheidung:

- `scope="billing"` ist „Leistung". **E-034 und SP-08** sagen wörtlich: „Die Leistung darf leer
  bleiben. Dann ist die Buchung erfasst, aber die Tagesgruppe dieses Todos geht ohne Text nicht in
  den Export." Eine Pflicht an diesem Feld nähme genau die Wahl weg, die E-034 gegeben hat.
- `scope="internal"` ist „Vermerk". A-7.1 verlangt, daß jedes Todo eine Notiz **besitzt**, nicht
  daß sie ausgefüllt ist. Ein Pflicht-Vermerk hat in der Spezifikation keine Grundlage.

`CLAUDE.md` ist an dieser Stelle unzweideutig: „Keine Umsetzung ohne Deckung durch eine
Anforderungs-ID."

**Auflage:** `required` an `NoteField` wird **nicht gesetzt**, in keinem Produktaufruf, ohne
Vorlage bei mir **und** bei security-checker (die Billing-Seite berührt E-034/SP-08). Der saubere
Abschluß ist, sie ersatzlos zu entfernen und die Vorführung auf der Musterseite mit ihr — das ist
frontend-devs Entscheidung, nicht meine. `error` bleibt: Ein Notizfeld wird eine Absage des
Dienstes tragen müssen, und dafür braucht es die Fläche.

#### Z-19b — **blockierend.** Die Meldefläche desselben Bausteins ist nach der falschen Bauart gebaut

```
apps/web/src/components/NoteField.tsx:171-176
  {error !== undefined ? (
    <p className="note__error" id={errorId} role="alert"> … </p>
  ) : null}
```

Das ist **genau** der Defekt O-DA, den T-162 in `TextField` behoben hat, den T-118 in
`ConfirmDialog` behoben hat, den T-175 in `ConfirmDialog` ein zweites Mal ausdrücklich richtig
gebaut hat (`ConfirmDialog.tsx:230`, die Fläche steht **immer** im Baum) und den `UpdateDialog`
(`:155`) und `AttachmentOpenDialog` (`:248`) ebenfalls tragen. Die Begründung steht dreimal im
Bestand, wörtlich: Ein `role="alert"`, das erst zusammen mit seinem Inhalt entsteht, wird von
vielen Vorlesehilfen übergangen.

**`NoteField` ist der eine Baustein, den T-162 nicht erreicht hat.** Er steht in sechs
Produktaufrufen (Timer-Stopp, Timer-Wechsel, Buchung von Hand, Todo anlegen, Todo-Detail,
Buchungsdialoge) — also an jeder Fläche, an der der Leistungstext entsteht, der in die Abrechnung
geht.

**Und die Musterseite führt den Defekt als Muster vor.** `NotesSection.tsx:129-136` zeigt den
Fehlerzustand des Bausteins. Nach T-163 Geltungsbereich ist die Musterseite
**Prüfdokumentation** — sie ist der Ort, an dem ein künftiger Bauer nachsieht, wie ein Notizfeld
mit Fehler auszusehen hat. Heute zeigt sie ihm die Bauart, gegen die T-162 angetreten ist, an
einem Feld, das nach E-034 gar nicht pflichtig sein darf.

**Warum blockierend und nicht ein Hinweis:** Solange die Fläche so gebaut ist, ist jede künftige
Meldung an einem Notizfeld eine stumme Tür — dieselbe Klasse wie Z-16, und Z-16 war blockierend.
Der Befund hält den Textdurchgang **nicht** auf; er hält den Abschluß von E-084 auf, dessen Punkt 2
genau diese Frage stellt.

**Vorschlag:** dieselben vier Zeilen wie in `ConfirmDialog.tsx:230-236` — ein `div` mit
`role="alert"`, das immer steht, mit dem `<p>` darin als Inhalt. Kein neuer Text, keine neue
Klasse, kein neuer zugänglicher Name.

### 1.4 Z-20 — die Auslösung. P-1 bis P-7 schweigen dazu, hier ist die Antwort

**Der gemessene Fall, und er ist kein Randfall.** `FormDialog.tsx:147` setzt
`initialFocus={firstFieldWithin}` — beim Öffnen liegt der Fokus im **ersten Feld**. In
`TagsScreen` ist das erste Feld das Namensfeld, und es ist leer. `TagsScreen.tsx:390` setzt
`onBlur={() => setNameTouched(true)}` **ohne Bedingung**.

Damit gilt heute: *Dialog „Neuen Tag anlegen" öffnen, einmal Tabulator drücken* → rote Meldung
„Name fehlt.", **bevor der Benutzer ein Zeichen getippt hat**. Dasselbe an
`TagsScreen.tsx:420`/`:453`, `PoolFormDialog.tsx:533`, `StatusSettings.tsx`,
`TemplatesScreen.tsx`, und in `ConfirmDialog.tsx:201` beim Sprung auf das Bestätigungshäkchen.

P-6 sagt „nie beim ersten Zeichen". Der heutige Auslöser tadelt **vor** dem ersten Zeichen. Das
ist nicht der Buchstabe von P-6, aber es ist eindeutig sein Sinn — und die Lücke ist meine, nicht
die von frontend-dev.

> **P-8 (neu, verbindlich).** Eine Pflichtmeldung erscheint erst, wenn der Benutzer **an diesem
> Feld etwas getan hat**. „Berührt" heißt: eine Eingabe, nicht ein Durchqueren. Ein Feld, das seit
> dem Öffnen unverändert ist, wird beim bloßen Weitertabben nicht getadelt.
>
> Umsetzung: der `onBlur`-Zweig setzt `touched` nur, wenn der Wert sich seit dem Öffnen geändert
> hat oder nicht leer ist. Ein Absendeversuch setzt `touched` weiterhin **immer** (so tut es
> `TodoFormDialog.tsx:95` heute schon und `BookingDialogs.tsx:123` ebenso).

> **P-9 (neu, verbindlich).** **Der Auslöser folgt dem Knopf.** Läßt sich der Absendeknopf
> drücken, kommt die Meldung beim **Absendeversuch** (`BookingDialogs.tsx:100`, `:123` — die
> richtige Bauart für diesen Fall). Ist er von Anfang an gesperrt, kommt sie beim **Verlassen nach
> einer Eingabe** (P-8), **und** der Grund für die Sperre steht von der ersten Sekunde an als
> zustandsgebundener **Hinweis** daneben — nicht als Meldung. Das Vorbild ist
> `PoolRenameDialog.tsx:154-161` (Z-18), nicht die sechs neuen Meldungen.

**Was das für die sechs neuen Meldungen heißt, und was ausdrücklich nicht.** P-8 ist eine
Bedingung an einem Ausdruck je Stelle, keine Neubauorder: Bauart, Fläche, Rolle, Klasse und
Wortlaut bleiben zeichengleich (E-076 Punkt 3 unberührt). **P-9 ist eine Regel für neues und für
künftig geändertes Arbeiten** — wie Z-06 für UM-01. Die zehn Dialoge mit `submitDisabled`
nachträglich um einen Hinweis zu ergänzen ist eine eigene Aufgabe mit eigener Vorlage bei
ui-designer; ich verlange sie hier nicht.

**Und die Beobachtung, die dazugehört:** Der Bestand trägt seit T-175 **zwei** Auslöser für
dieselbe Meldungsklasse — `attempted` in `BookingDialogs`, `blur` überall sonst. Beide sind für
sich richtig begründet, und beide sind aus derselben Ursache entstanden: das eine Formular hat
keinen `submitDisabled`, die anderen haben ihn. P-9 schreibt das auf, statt es weiter dem Zufall
der Aufrufstelle zu überlassen.

---

## 2. Z-21 — O-FN: `PATH_MESSAGE` verspricht eine Prüfung, die diese Tür nicht macht

**Heute** (`apps/local-api/src/usecases/attachments.ts:144-145`):

```
Als Datei ist ein vorhandener absoluter Pfad zulässig. Netzwerkpfade sind es nicht.
```

**Was die Tür wirklich prüft** (`checkAttachmentPath`, T-178 Punkt 4): absolut, kein UNC, kein
Datenstrom-Doppelpunkt, keine indirekte Endung. **Die Existenz nicht** — und zwar mit Absicht:
`CLAUDE.md` sagt es für die Anhänge ausdrücklich, „Eine Prüfung allein im Eingabefeld trägt nicht
— zwischen Eingabe und Öffnen liegt der Bestand." Geprüft wird die Existenz von der Hülle, **bei
jedem Öffnen neu**.

**Der Schaden hat zwei Seiten, und die zweite ist die schlimmere.**

1. Wer einen absoluten Pfad einträgt, der (noch) nicht existiert, liest als Grund seiner Absage
   eine Bedingung, an der er gar nicht gescheitert ist. Er sucht den Fehler an der falschen Stelle.
2. Wer einen Pfad einträgt, den die Tür **annimmt**, liest daraus die Zusage, die Datei sei
   vorhanden. Niemand hat das geprüft.

**Was dort stehen soll — ein Wort fällt:**

```
Als Datei ist ein absoluter Pfad zulässig. Netzwerkpfade sind es nicht.
```

**Es geht nichts verloren, und der Beleg steht in derselben Anwendung.** Die Existenzbedingung
wird an dem Punkt getragen, an dem sie gilt: `Attachments.tsx:129`
`path_missing: "Diese Datei ist an diesem Pfad nicht mehr vorhanden."` Der Kopfkommentar dieser
Tabelle (`Attachments.tsx:102-105`) zieht selbst die Linie, um die es hier geht: *„Zwei Sorten
Satz, und der Unterschied ist Absicht: „Diese Datei ist an diesem Pfad nicht mehr vorhanden" ist
eine **Beobachtung**, „Takt öffnet nur `http` und `https`" ist eine **Regel**."* — „vorhanden" in
`PATH_MESSAGE` ist eine Beobachtung, die sich in eine Regel geschlichen hat.

**Ein zweiter Befund, eine Ebene tiefer, aus derselben Wurzel.** `path_missing` sagt „nicht
**mehr** vorhanden". Weil die Tür die Existenz nie geprüft hat, kann ein Pfad im Bestand stehen,
den es **nie** gab (Tippfehler, abgeschriebener Pfad eines anderen Rechners). Für den ist „nicht
mehr" falsch: Er behauptet eine Vorgeschichte, die es nicht gab, und schickt den Benutzer los, ein
Verschwinden zu suchen. **Vorschlag:** „Diese Datei ist an diesem Pfad nicht vorhanden." Ein Wort
fällt auch hier.

**Drei Dateien, ein Auftrag** — das ist die Auflage:

| Datei | Was | Hoheit |
|---|---|---|
| `apps/local-api/src/usecases/attachments.ts:144-145` | „vorhanden" fällt | domain-dev |
| `apps/local-api/test/usecases/attachment-input-validation.test.ts:117` | hält den Satz **zeichengleich** | unit-tester |
| `apps/web/src/components/Attachments.tsx:129` | „mehr" fällt | frontend-dev |

Wird das geteilt, geht ein Prüffall in einer Welle rot, die ihn nicht bestellt hat.

**Kein Sicherheitsthema.** Die Prüfung selbst ändert sich nicht, weder in der Tür noch in der
Hülle. Es fällt ein Wort aus einem Satz.

---

## 3. Z-22 — O-EY: welcher Prüffall „Arbeitsplatz" hält, und wo er hingehört

**Der Stand, gemessen am 2026-09-05:** Z-12 ist **unumgesetzt**. `SettingsScreen.tsx:558` trägt
weiterhin `title="Dieser Arbeitsplatz"`; `SettingsScreen.tsx:155` trägt `label: "Arbeitsplatz"`;
`showcase/WorkstationSection.tsx:135` trägt `"Dieser Arbeitsplatz (S-09)"`;
`docs/benutzerhandbuch.md:558` trägt „Bereich „Dieser Arbeitsplatz"".

**Und Z-12 ist seit T-181 dringender als bei seiner Abfassung.** ST-04 ist gebaut: `AREA_LEAD` ist
fort, und der Quelltext hält den neuen Zustand selbst fest (`SettingsScreen.tsx:186-187`): *„Der
Bereich ist danach dreifach benannt: Schiene mit `aria-current`, Kartentitel und Adresse."* Der
Kartentitel **ist** jetzt die Bereichsüberschrift — und er widerspricht der Schiene.

### e2e, nicht Einheit — und der Grund ist gemessen

`apps/web/test/**` enthält heute **sieben** Dateien, alle unter `lib/` und `app/`, alle über reine
Funktionen. Es gibt dort **keine** Rendering-Umgebung (kein jsdom, kein Testing-Library-Aufbau).
Ein zugänglicher Name entsteht erst beim Zeichnen; für eine einzige Zeichenkette eine
Rendering-Kette einzuführen ist unverhältnismäßig, und die e2e-Reihe hält bereits **286**
`getByRole`-Zugriffe. **Also e2e.**

### Wo genau, und was er messen muß

**Ort:** eine eigene, kleine Datei `tests/e2e/settings-workstation-area.spec.ts`. Es gibt heute
keinen Prüffall für den Bereich „Arbeitsplatz"; `gotoSettings(page, 'arbeitsplatz')` liegt in
`tests/e2e/support/nav.ts:64-66` bereits fertig und wird von keiner Reihe benutzt.

**Was er misst — und die zwei Bedingungen, ohne die er nichts hält:**

```
Bedingung 1  getByRole('heading', { name: 'Arbeitsplatz', exact: true })
             `exact: true` ist der ganze Prüffall. Ohne ihn trifft der Name
             auch „Dieser Arbeitsplatz" — Playwrights Vorgabe ist die
             Teilzeichenkette. Ein Prüffall ohne `exact` wäre bei der
             stillen Rücknahme grün.

Bedingung 2  eine Verneinung daneben: kein Element mit dem zugänglichen
             Namen „Dieser Arbeitsplatz" auf dieser Seite (`toHaveCount(0)`).
             Sie ist es, die die Rücknahme fängt — Bedingung 1 allein bliebe
             grün, wenn jemand eine **zweite** Karte danebenstellte.
```

**Was der Prüffall ausdrücklich nicht tun soll.** Die Schiene mit `exact: true` messen. Der
zugängliche Name des `<a>` in `SettingsScreen.tsx:199-214` ist die Verkettung von Beschriftung
**und** Zusatz — „Arbeitsplatz Abrechnungsname, Ablageort, Meldungen". Unter 60 rem blendet
`.settings-rail__hint` aus, und dann ist es „Arbeitsplatz". **Der zugängliche Name dieses
Verweises hängt an der Fensterbreite.** Wer ihn mit `exact` mißt, baut einen Prüffall, der bei
einer Änderung der Ansichtsgröße kippt, ohne daß jemand Text angefaßt hat. SC 2.5.3 ist in beiden
Breiten erfüllt (die sichtbare Beschriftung steht am Anfang); es ist keine Abweichung, aber es ist
eine Falle, und sie gehört benannt, bevor jemand hineintritt.

**Die Umsetzung ist nicht meine** (e2e-tester, zusammen mit frontend-dev für `:558` und der
Musterseite, und documenter für das Handbuch). **Die Anforderung ist meine**, und sie ist damit
gestellt.

---

## 4. O-EZ — meine Wiedervorlage, einzeln

Die sieben aus T-163 Abschnitt 9, die T-177 Abschnitt 1.4 offengelassen hat. **Vier habe ich
beurteilt, einen habe ich als erledigt nachgemessen, zwei habe ich nicht beurteilt.** Die zwei
stehen in 4.7 mit Grund.

> **Berichtigung vom 2026-09-06:** Der als erledigt nachgemessene Eintrag (ST-03) ist **nicht**
> vollständig. Siehe 8.2.

### 4.1 Z-23 — ST-06, Zeile `TodoListScreen.tsx:653-654`

**Der Pflichtfluß „Timer auf erledigtem Todo" (A-2.5, I-05) ist berührt, und deshalb habe ich
zuerst gezählt, wie oft die Vorwarnung im Produkt steht.** Nicht einmal — **sechsmal**, in fünf
Fassungen:

| Ort | Fassung |
|---|---|
| `TodoListScreen.tsx:653-654` | „… ausgeblendet. Startet der Timer auf einem davon, ist es wieder offen und erscheint hier erneut." |
| `TimeScreen.tsx:196-197` | **zeichengleich derselbe Satz** |
| `TimeScreen.tsx:167` | `Card description` „Startet der Timer auf einem erledigten Todo, ist es danach wieder offen." |
| `TimeScreen.tsx:220` | „Alle Todos sind erledigt. Blenden Sie sie ein: Ein Timerstart hebt das Kennzeichen auf und holt das Todo in seine Pools zurück." |
| `DashboardScreen.tsx:294` | „… erledigte mit ihrem Kennzeichen. Ein Timerstart hebt es auf." |
| `TodoDetailScreen.tsx:399` | „Erledigt am … Das Todo ist aus seinen Pools ausgeblendet; ein Timerstart hebt das auf." |

**Die Begründung von T-163 ist falsch, das Ergebnis trotzdem richtig.** T-163 nennt als Ausgleich
`reactivationTitle` (SP-16). Das ist ein **Toast nach der Tat**; die gestrichene Zeile ist eine
**Vorwarnung**. Eine Vorwarnung verhindert eine Überraschung, ein Toast erklärt sie — das sind
zwei verschiedene Dinge, und ST-06 zählt sie als eines. Nach meinem eigenen Raster ist der Satz
zudem **F** (er nennt die Folge einer Handlung), und **F schlägt V**: Er fällt nicht wegen „auf
Vorrat".

**Er fällt wegen D**, und der Ausgleich ist gemessen: Die Vorwarnung bleibt an **fünf** Stellen
stehen, darunter an der, an der der Timer wirklich gestartet wird
(`TimeScreen.tsx:167`, `Card` „Todo wählen" — dauerhaft, nicht nur bei ausgeblendeten Todos). Der
Dateikopf von `TimeScreen` (`:44-57`) hält für genau diesen Satz fest, warum er dorthin gehört:
*„Ein Versprechen, das der Screen nicht einlösen konnte, ist schlimmer als kein Satz."*

**Z-23a — freigegeben mit drei Auflagen:**

1. **`TimeScreen.tsx:167` fällt unter keinen Textdurchgang.** Er ist nach dieser Freigabe der
   Träger der Vorwarnung am Ort der Handlung. Wer ihn kürzen will, legt ihn erneut vor.
2. **`TodoDetailScreen.tsx:399` und `:401` (SP-16) bleiben unangetastet.**
3. **Der erste Halbsatz bleibt zeichengleich.** Gestrichen wird nur „Startet der Timer auf einem
   davon, ist es wieder offen und erscheint hier erneut."; „N erledigte Todos sind ausgeblendet."
   und der Knopf „Einblenden" bleiben, wie sie sind.

**Z-23b — blockierend, und es ist die Falle aus E-081 Punkt 4 in Reinform.**
`TimeScreen.tsx:191-203` ist eine **wörtliche Kopie** desselben Absatzes — dieselben zwei Sätze,
dieselbe Klasse `hidden-notice`, dasselbe Symbol, derselbe Knopf —, aber als eigenes JSX und nicht
über die Komponente `HiddenDoneNotice` (`TodoListScreen.tsx:641-661`). Zwei identische Absätze,
und jeder von beiden ist mit derselben Begründung streichbar, weil es den anderen gibt. Fällt
zuerst der eine (ST-06) und in der nächsten Welle der andere (als „Kopie"), ist die Aussage fort,
und **beide Wellen sehen für sich richtig aus**.

**Auflage:** Im selben Auftrag wird `TimeScreen.tsx:191-203` entweder durch die Komponente
`HiddenDoneNotice` ersetzt (dann ändert sich beides an einer Stelle und die Frage kann nicht mehr
zweimal gestellt werden), **oder** die Zeile wird im Quelltext ausdrücklich als der bleibende
Träger benannt, mit einem Kommentar, der auf diese Auflage zeigt. Ohne eines von beiden ist die
Freigabe nicht erteilt.

### 4.2 Z-24 — ST-06, Zeilen `TodoFormDialog.tsx:260-264` (in T-163 als `:247/248`)

**Der Pflichtfluß „Standard-Tags auf jedem Erstellungsweg" ist berührt.**

**Der Bedienungsteil fällt zu Recht — er steht dreifach im Bedienelement selbst**, und zwar in dem
Augenblick, in dem er gilt:

| Ort | Fassung | Zustand |
|---|---|---|
| `TagInput.tsx:422` | „Tippen Sie einen Namen — Takt bietet Ihnen dann an, ihn anzulegen." | Liste offen und leer |
| `TagInput.tsx:405` | „„X" als neues Tag anlegen" | sobald ein unbekannter Name getippt ist |
| `TagInput.tsx:408-409` | „Dieses Tag gibt es noch nicht. Es entsteht auf der Wurzelebene, sobald …" | dieselbe Option |

Der Satz „Vorhandene Tags werden vorgeschlagen" beschreibt außerdem etwas, das man **sieht**,
sobald man tippt. Reines **S**.

**Der A-Teil bleibt, und er ist die Deckung des Pflichtflusses.** „Die Standard-Tags … kommen beim
Anlegen von selbst hinzu" ist eine **Abwesenheit**: Der Benutzer sieht sie in dieser Liste nicht
und schlösse daraus, sie gälten hier nicht. T-163s Ersatz („Standard-Tags kommen beim Anlegen von
selbst dazu.", 48 Zeichen) trägt sie vollständig.

**Z-24 — freigegeben mit zwei Auflagen:**

1. **Die Toastzeile ist Teil dieser Freigabe.** `TodoFormDialog.tsx:130-133` nennt nach dem
   Anlegen die **Namen** der ergänzten Standard-Tags („Als Standard-Tag kam … hinzu.", A-9.5).
   Vorwarnung im Hinweis plus Nennung im Toast sind zusammen der Nachweis für den Pflichtfluß.
   Fällt der Toastteil, ist Z-24 zurückgenommen.
2. **Der Bearbeiten-Zweig (`:263`) fällt ganz** — dort gibt es keinen A-Teil, und die drei Träger
   in `TagInput` gelten unverändert. Das ist die einzige Stelle dieser Freigabe, an der ein Feld
   **ohne** `hint` zurückbleibt; das ist richtig und keine Lücke.

### 4.3 Z-25 — ST-08, `PoolFormDialog.tsx:450` (in T-163 als `:437`)

**Heute:** „Eine Regel nennt Bedingungen. Jede engt weiter ein: Erforderliche Tags müssen da sein,
ausgeschlossene dürfen es nicht, und Status, Erledigt und Exportstatus grenzen weiter ab. Was auf
„Alle" steht, schränkt nicht ein."

**Der Mittelteil ist D, und die zweite Fassung steht eine Bildschirmzeile darunter** — nicht in
einer anderen Ansicht:

```
:554  FormSection „Erforderliche Tags"  lead „Was ein Todo tragen muss, damit es dazugehört. …"
:603  FormSection „Ausgeschlossene Tags" lead „Was ein Todo nicht tragen darf. …"
:653  FormSection „Weitere Bedingungen"  lead „Drei Bedingungen, die keine Tags brauchen. …"
```

Dieselbe Aussage, dieselbe Richtung, im selben Blickfeld. **Freigegeben.**

**Auflage, und sie ist blockierend für den Bau, nicht für die Freigabe.** Der Schlußsatz
**„Was auf „Alle" steht, schränkt nicht ein."** bleibt zeichengleich. Er ist seit T-181 nicht mehr
nur ein A-Satz dieses Dialogs, sondern **der Ausgleich für ST-05**: T-163 nennt ihn beim Streichen
des Kastens `PoolFormDialog.tsx:790-795` ausdrücklich als eine der zwei Stellen, an denen die
Aussage weiterlebt, und T-181 hat den Kasten gestrichen. Wer ihn beim Kürzen der Beschreibung
mitnimmt — er sieht wie ein angehängter Rest aus —, nimmt den Ausgleich einer bereits vollzogenen
Streichung mit. Dieselbe Klasse wie Z-01, und derselbe Grund, aus dem ich das hier aufschreibe:
Wo kein Prüffall hängt, merkt niemand die Rücknahme.

**Zu den zwei kleinen Zeilen derselben Liste, gemessen:**

- `:593` `FolderPicker hint="Ein Ordner steht für alles, was in ihm liegt."` — **D** zum zweiten
  Satz des `lead` drei Zeilen darüber (`:554`, „Ein genannter Ordner steht für die Tags, die in
  ihm liegen."). **Fällt**, mit Z-25 zusammen.
- `:616` `FolderPicker hint="Ein ausgeschlossener Ordner schließt jedes Tag darin aus."` — **A**
  (was ein Ausschluß über einen Ordner tut, sieht man nicht). **Bleibt**, wie T-163 selbst sagt.

### 4.4 Z-26 — ST-08, `PoolFormDialog.tsx:634` („Ordnertiefe") — **abgelehnt**

T-163 stellt die Frage: „**prüfen**, ob die Beschriftung des Kontrollkästchens darunter trägt.
Wenn ja: `lead` entfällt."

**Geprüft. Sie trägt nicht, und die Begründung steht im Quelltext selbst.** Der `lead` lautet
„Eine Einstellung für **beide** Listen — erforderliche wie ausgeschlossene Ordner." Weder die
Beschriftung („Unterordner einschließen", `:643`) noch der Hinweis darunter (`:645-646`) sagt
etwas über **beide** Listen. Und `PoolFormDialog.tsx:624-631` hält wörtlich fest, warum:

> *„Ein eigener Abschnitt fuer ein einziges Ankreuzfeld — weil `includeSubfolders` **eine**
> Einstellung fuer **beide** Taglisten ist. Am Ende der ausgeschlossenen Tags gelesen …, sieht es
> aus, als gaelte es nur fuer sie; der Satz „gilt fuer beide Listen" daneben ist dann eine
> Berichtigung und keine Erklaerung."*

Der Satz ist **A**: Er spricht die Abwesenheit einer **zweiten** Einstellung aus. Nach dem Raster
fällt er nicht.

**Und er hängt am Pflichtklickpfad „vier Ebenen tiefer Ordnerbaum".** `includeSubfolders`
(„beliebig tief", `:645`) ist das, was eine Regel über einen vierstufigen Baum überhaupt
brauchbar macht. Wer nicht weiß, daß der Haken für die Ausschlußliste **mit** gilt, baut eine
Regel, die anders trifft, als er meint — an derselben Stelle, an der die Todos ihre Pools
bekommen.

### 4.5 Z-27 — UM-05 — **kein Gegenstand, geschlossen wie UM-01**

UM-05 will den zweiten Satz aus `ExportScreen.tsx:684-685` zustandsgebunden machen: „Ein Entwurf,
der im Vorlageneditor noch nicht gespeichert ist, wirkt hier nicht mit." Die Einschränkung des
Eintrags lautet: „Ob der Exportbildschirm überhaupt weiß, dass ein Entwurf offen ist, ist eine
Frage an frontend-dev."

**Die Antwort ist schärfer als die Frage: Es gibt den Zustand nicht.**

1. `TemplatesScreen.tsx:147` — `const [draft, setDraft] = useState<Draft | null>(null)`. Der
   Entwurf lebt im Zustand **dieser Komponente**, nicht im Bestand, nicht im Browserspeicher.
2. Die Ansicht hängt an der Route. Ein Wechsel auf `#/export` baut `TemplatesScreen` ab, und der
   Entwurf geht mit — `TemplatesScreen.tsx:936-939` schreibt genau das auf: *„wechselt die Adresse
   erst und wird danach zurückgestellt, ist der Editor in der Zwischenzeit abgebaut worden und der
   Entwurf weg."*
3. `useLeaveGuard` (`:945-972`) fängt den Klick **vor** dem Wechsel ab und fragt. Beide Antworten
   führen zum selben Ergebnis für den Exportbildschirm: entweder der Benutzer bleibt (dann sieht
   er den Exportbildschirm nicht), oder er verwirft (dann gibt es keinen Entwurf mehr).

**Der Zustand, den der Satz beschreibt, kann mit dem Bildschirm, auf dem der Satz steht, nicht
zugleich bestehen.** Eine Zustandsbindung an ein Merkmal, das es nicht gibt, ist keine.

**UM-05 wird als „nichts zu tun" geschlossen** — kein Fehlschlag, sondern das Ergebnis der
Messung, genau wie UM-01 (Z-06).

**Was ich ausdrücklich nicht entscheide.** Ob der zweite Satz deshalb **fällt** — er steht auf
Vorrat für einen unerreichbaren Zustand, und das ist wörtlich die Klasse, für die T-180 mit UM-08
den Präzedenzfall gebaut hat — ist ein **neuer** Eintrag. Ihn hier zu beschließen hieße, ihn zu
verfassen und zugleich freizugeben. Er gehört ux-designer, mit dem Verweis auf UM-08 und auf
diese Messung.

**Eine Einschränkung, die dazugehört:** In zwei Browserfenstern (Entwicklungs- und Prüfbetrieb)
ist der Fall konstruierbar. In der ausgelieferten Anwendung gibt es einen Webview, also nicht.

### 4.6 Z-28 — UM-07 — freigegeben in der Sache, mit einer blockierenden Auflage

> **Berichtigung vom 2026-09-06:** Z-28a steht unverändert. **Z-28b ist gegenstandslos** — der
> Lauf, den er aufhalten wollte, ist gelaufen. An seine Stelle tritt **Z-31** (Abschnitt 8.1).

**Der Eintrag greift in genau einem Zweig**, gemessen an `TodoListScreen.tsx:299-319`:

| Zweig | Rumpf am 2026-09-05 | Sätze |
|---|---|---|
| erledigt → offen | `withMovement(unchanged, movement)` | 2 — schon regelkonform |
| offen → erledigt, `showDone` | dasselbe | 2 |
| offen → erledigt, **nicht** `showDone` | „Es verschwindet damit aus dieser Liste, solange erledigte ausgeblendet sind. Der Status bleibt unverändert." + Bewegungssatz | **3** |

**Z-28a — freigegeben in der Sache, mit einer Auflage, die den Eintrag ändert.** UM-07 will, daß
bei einem Bewegungssatz „unsere eigene Auskunft auf den einen schrumpft, der **A** ist". Das
opfert den anderen — „Es verschwindet damit aus dieser Liste …" —, und der ist **F**: Er erklärt,
warum die Zeile, auf die der Benutzer gerade geklickt hat, verschwunden ist. Der Bewegungssatz
kann das nicht ersetzen; er nennt **Pools und Spalten**, nicht die Ansichtseinstellung dieser
Liste. Nach meinem Raster fällt weder A noch F.

> **Auflage:** Die Zwei-Satz-Grenze aus S-13 wird eingehalten, **ohne** daß eine der beiden
> Aussagen fällt. Beide gehören in **einen** Satz, der Bewegungssatz ist der zweite. Den Wortlaut
> setzt ux-designer (E-078 Punkt 4); die Bedingung ist meine: **kein Faktum geht verloren, und der
> Rumpf hat nie mehr als zwei Sätze — auch nicht, wenn ein Bewegungssatz dabei ist.**

**~~Z-28b~~ — überholt.** Der Befund lautete: ST-07 Zeile `TodoListScreen.tsx:314` und UM-07 sind
dieselbe Zeile, ST-07 braucht keine Vorlage, also muß die Zeile **vor** dem ST-07-Lauf
herausgenommen werden. Der Lauf hat in derselben Welle stattgefunden. Was daraus geworden ist,
steht in **8.1**.

### 4.7 Was ich **nicht** beurteilt habe, und warum

**UM-08 — die Karte „Was sich geändert hat" (`BoardScreen.tsx:975-1008`).**
Nicht beurteilt. T-180 hat den Eintrag sorgfältig vorbereitet und in seiner
Umsetzungsreihenfolge selbst festgelegt: *„spec-ux-reviewer **und** documenter — der
Handbuchabsatz steht **zuerst**"*, und die Reihenfolge ist mit E-081 Punkt 4 bindend. Der Absatz
in `docs/benutzerhandbuch.md` steht noch nicht. Eine Freigabe, die ich heute erteile, wäre eine
Freigabe für eine Streichung, deren Ausgleich noch niemand geschrieben hat — genau das, was ich
in Z-23b und Z-31 anderen untersage. **Vorzulegen, sobald documenter geliefert hat.** Ich habe
den Eintrag gelesen und sehe keinen Einwand, der ihn umwerfen würde; das ist keine Freigabe.

**SP-09-Kürzung (`NoteField.tsx:50`, `:58`).**
Nicht beurteilt, und zwar aus zwei Gründen, die beide heute entstanden sind. Erstens verlangt die
Umsetzungsreihenfolge dafür ausdrücklich **spec-ux-reviewer und security-checker**; security-checker
läuft in dieser Welle parallel, und eine Freigabe an ihm vorbei wäre nur die halbe. Zweitens: Ich
habe soeben in Z-19 festgestellt, daß derselbe Baustein eine Meldefläche nach der falschen Bauart
trägt und eine ungedeckte `required`-Eigenschaft führt. Über die Kürzung eines Satzes in einer
Datei zu entscheiden, deren Bauart gerade in Nacharbeit geht, hieße gegen einen bewegten Baum zu
urteilen. **Vorzulegen nach Z-19b.**

**ST-03 Zeile `labels.ts:438`.** Am 2026-09-05 als erledigt nachgemessen. **Am 2026-09-06
berichtigt: der Eintrag ist nicht vollständig ausgeführt.** Siehe 8.2.

---

## 5. O-FG — die fünf aufgenommenen, nicht beurteilten Textträger

### 5.1 Z-29 — `app/connection.ts`: **A/B, bleibt** — aber fünf Fassungen, und keine erreichbar

**Sechs Sätze, gemessen** (`:142`, `:245`, `:293`, `:327`, `:345`, `:397`). Alle sechs sind **A**
(sie sagen, was **nicht** geht) oder **B** (sie begründen eine Absage). Sie bleiben.

**Zwei Befunde daneben, und beide sind neu.**

**(a) Fünf Fassungen einer Auskunft, in zwei Dateien, ohne Messung.** Derselbe Satz steht auch in
`apps/desktop/src/shell.ts` — dreimal zeichengleich (`:379`, `:483`, `:530`) und einmal als
**fünfte** Fassung (`:239`, „Diese Funktion braucht die Takt-Anwendung. Im Browser allein steht
sie nicht zur Verfügung."). `connection.ts:338-345` weiß das und schreibt es auf: *„Wortgleich zu
dem in `@takt/desktop/shell` … Zwei Lagen, eine Auskunft."* Das ist eine **Zusage**, keine
Messung — und sie gilt nur für einen der vier Sätze. Der Bestand hat für genau diese Klasse das
Mittel schon: `RELEASE_TAG_PREFIX` steht ebenfalls zweimal und wird von `proof:shell-surface`
Prüfung 4 zeichengleich gehalten (`releasePage.ts:18-26` begründet das ausführlich).

**(b) In der ausgelieferten Fassung erreicht keiner der sechs Sätze einen Benutzer.** Gemessen:
`App.tsx:223-247` ersetzt bei `kind: "no_shell"` die **ganze** Arbeitsfläche durch `NoShellNotice`
(SP-20). Läuft die Hülle, ist `isShellAvailable()` wahr und keiner der sechs Zweige feuert. Der
einzige Zustand, in dem sie sprechen, ist `developmentFallback()` (`:112-119`) — und der hängt an
`import.meta.env.DEV`, das im Auslieferungsbündel durch `false` ersetzt wird.

**Auflage, und sie ist die einzige, die ich hier stelle:** **Keiner dieser sechs Sätze darf je als
Träger einer Aussage gezählt werden.** Wer in einem künftigen Textdurchgang einen sichtbaren Satz
mit der Begründung streicht, „die Aussage steht ja in `connection.ts`", streicht sie in einen
Zweig hinein, den in der ausgelieferten Anwendung niemand erreicht. Das gehört als Zeile in den
Kopfkommentar der Datei — dort, wo der nächste Leser sie findet.

### 5.2 Z-30 — `app/useUpdateNotice.ts`: **B, bleibt** — ein Satz ist zu streichen, und eine Messung fehlt

**Die Sätze, gemessen:** `:245-246` (Toast nach „Installieren", **A** zu A-18.9 — Geschwister von
SP-12, bleibt unverändert), `:251` (`rejected`), `:256` (`failed`), `:280-281` (Toast nach
„Überspringen", **A** zu A-18.10 — bleibt).

**Der Befund liegt in `:249-252`, dem `rejected`-Zweig:**

```
"Die gemeldete Fassungsbezeichnung hat die Prüfung der Anwendung nicht bestanden.
 Takt öffnet dafür keine Seite.
 Die Release-Seite lässt sich über den angezeigten Verweis von Hand aufrufen."
```

**Der dritte Satz gehört gestrichen, und zwar aus dem Grund, den die ersten zwei nennen.** Der
angezeigte Verweis ist `releasePageUrl(notice.version)` (`:227`) — **dieselbe** Fassungsbezeichnung,
die die Hülle soeben abgewiesen hat, eingesetzt in dieselbe feste Adresse. Der Satz schickt den
Benutzer von Hand auf die Adresse, deren Öffnen die letzte Kontrolle gerade verweigert hat, und
diese Adresse führt auf eine Seite, die es nicht gibt. `CLAUDE.md` nennt die Formprüfung der Hülle
„die einzige Kontrolle zwischen einer fremden Zeichenkette und `xdg-open`" (B-18.2, E-064
Punkt 4). Ein Satz, der um sie herumführt, hebt sie für den einzigen Fall auf, in dem sie greift.

**Und nun die Messung, die fehlt — sie ist der eigentliche Fund.** Der `rejected`-Zweig ist heute
**unerreichbar**:

```
packages/domain/src/version.ts:91
  VERSION_SHAPE = /^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$/

apps/desktop/src-tauri/src/release.rs:70-71
  is_release_version: ^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$
```

Zeichengleich. Was `decideUpdateNotice` durchläßt, läßt `takt_open_release` ebenfalls durch.
`view.available` kommt aus der Domäne — also kann die Hülle es nicht abweisen, **solange die zwei
Formen übereinstimmen**.

**Nichts mißt, daß sie übereinstimmen.** Drei Stellen prüfen die Form; **zwei** davon werden
zeichengleich gegeneinander gehalten:

| Stelle | gemessen gegen `VERSION_SHAPE`? |
|---|---|
| `packages/domain/src/version.ts:91` | — (die Quelle) |
| `apps/desktop/scripts/build-app.mjs` | **ja** — `proof-shell-surface.mjs:844-869`, Prüfung 3b |
| `apps/desktop/src-tauri/src/release.rs:70-135` | **nein** |

Und ausgerechnet die dritte ist die, deren Abweichung diesen Satz überhaupt sichtbar macht. Der
Bestand kennt das Muster schon: **E-085 / O-FL** verlangt für die Anhänge genau eine solche
Gleichlaufmessung zwischen Hülle und Domäne (`proof:attachment-parity`), mit Gegenprobe in beide
Richtungen. Hier ist dieselbe Klasse, eine Fläche weiter.

**Zwei Vorschläge, getrennt:**

1. **An frontend-dev (Wortlaut, klein):** Der dritte Satz aus `:251` fällt. Die ersten zwei
   bleiben — sie sind **B** und die einzige Auskunft in diesem Zustand. Der angezeigte Verweis
   selbst bleibt ebenfalls stehen: A-18.6 verlangt ihn, und er ist Text, kein Knopf
   (`UpdateDialog.tsx:145-146`, `<dd className="mono">`).
2. **An den Orchestrator:** eine Gleichlaufmessung zwischen `release.rs` und `VERSION_SHAPE`, nach
   dem Vorbild von Prüfung 3b und mit der Gegenprobe aus E-085. **Welche Aussage sie treffen soll,
   steht in 8.3.**

### 5.3 Die drei übrigen, kurz und mit Urteil

**`lib/exportTemplateModel.ts` — B, gehört auf die Sperrliste.** Sechs Sätze (`:449`, `:457`,
`:464`, `:475`, `:486`, `:509`), jeder nennt **eine** Abweichung der gewählten Vorlage gegen die
Standardvorlage, jeder mit Feldnamen. Sie sind die einzige Stelle, an der ein Benutzer erfährt,
daß seine Vorlage eine Datei erzeugt, die das Abrechnungstool anders liest als erwartet (A-8.2,
E-049). Sie stehen **zustandsgebunden** (nur bei Abweichung) und tragen den Pflichtklickpfad
„Vorlageneditor mit Vorschau auf offene Buchungen". **Vorschlag an ux-designer: als eigener
Sperrlisteneintrag aufnehmen, mit Bezug A-8.2 und E-049.** Kein Kürzungsspielraum.

**`lib/attachmentLabel.ts` — kein Gegenstand des Textdurchgangs.** `:302-304` und `:314-316`
tragen je drei Wörter („Verweis"/„Bild"/„Datei", „Adresse"/„Bild"/„Dateipfad"). Sie sind
**S-04/S-17** und bereits so kurz, wie sie sein können — und sie sind **vertraglich**: Sie landen
im zugänglichen Namen der Entfernen-Knöpfe, und Z-10 hat diesen Namen gerade zum Träger der
Unterscheidbarkeit gemacht (SC 2.4.6, X-04). Eine Kürzung hier ist keine Textfrage, sondern eine
Änderung an einem Prüfvertrag. **Vom Textdurchgang ausgenommen.**

**`lib/poolRule.ts` — nicht beurteilt, aber die Sperre ist erloschen, und das hat niemand
bemerkt.** T-163 Abschnitt 1.2 hält fest: „**nicht anfassen, solange ST-05 offen ist**". ST-05 ist
mit T-181 gebaut. Die Sperre war als **Bedingung** formuliert und ist damit **von selbst
abgelaufen** — ohne daß jemand ein Urteil gefällt hätte, und ohne daß es irgendwo als Übergang
vermerkt wäre. Die Datei trägt die Kompensation für ST-05 (die Regelzusammenfassung unter jedem
Spaltenkopf, T-171 3.5, Grundlage meiner Freigabe in T-177 Abschnitt 1.0) und steht jetzt
ungeschützt und unbeurteilt da. **Vorschlag: eine Sperre, die an einer Bedingung hängt, wird beim
Eintritt der Bedingung nicht frei, sondern fällig.** `lib/poolRule.ts` gehört als eigener
Sperrlisteneintrag aufgenommen — Bezug E-054, A-5.4 und meine Freigabe Z-03 —, nicht als
freigewordene Fläche.

---

## 6. Befunde in Kurzform

```
Z-17  Todo anlegen / Titelfeld       Abweichung: Der Satz beginnt nicht mit der Feldbeschriftung
      SC 4.1.3, E-084, P-2, P-4      (P-2). Seit der badInput-Meldung aus T-175 können zwei
                                     Meldungen gleichzeitig im Dialog stehen (Frist + Titel) —
                                     T-175 Risiko 1 ist überholt.
                                     Vorschlag: „Titel fehlt — ohne ihn lässt sich ein Todo nicht
                                     wiederfinden." (62 Zeichen). P-1 berichtigt: 60 für die
                                     Grundform, 80 für die Form nach P-4. Auflage: der Prüffall
                                     field-live-region-announcement.spec.ts:96 misst die GANZE
                                     Zeichenkette, sonst bleibt P-2 ungemessen.

Z-18  Regel umbenennen               Abweichung: keine. Der Hinweis ist kein Fehlertext und nicht
      P-6, P-7, SC 3.3.1             dauerhaft — drei Zweige, PoolRenameDialog.tsx:154-161.
                                     Vorschlag: P-6 gilt nicht. Er bleibt ein `hint`; ihn in einen
                                     `error` zu überführen erzeugte den Tadel beim ersten Zeichen.
                                     Er ist das Vorbild für P-9, nicht dessen Ausnahme.

Z-19a NoteField, sechs Flächen       Abweichung: `required` hat keine Anforderungs-ID und
      A-7.1, E-034, SP-08            widerspricht für scope="billing" E-034/SP-08 („Die Leistung
                                     darf leer bleiben"). Kein Produktaufrufer setzt sie.
                                     Vorschlag: nicht setzen ohne Vorlage bei mir und
                                     security-checker; sauberer Abschluss ist ersatzlos entfernen.

Z-19b NoteField, sechs Flächen       Abweichung: BLOCKIEREND. NoteField.tsx:171-176 baut sein
      SC 4.1.3, O-DA, E-084 Punkt 2  role="alert" zusammen mit dem Inhalt — der Defekt, den T-162
                                     in TextField und T-118/T-175 in ConfirmDialog behoben haben.
                                     Die Musterseite (NotesSection.tsx:129-136) führt ihn als
                                     Muster vor.
                                     Vorschlag: Bauart von ConfirmDialog.tsx:230-236 übernehmen —
                                     Fläche immer im Baum, auch leer. Kein neuer Text.

Z-20  zehn Dialoge, sechs Meldungen  Abweichung: `onBlur` setzt `touched` bedingungslos; das erste
      SC 3.3.1, P-6, E-084           Feld ist beim Öffnen fokussiert (FormDialog.tsx:147). Ein
                                     Tabulator im frisch geöffneten Dialog tadelt, bevor der
                                     Benutzer ein Zeichen getippt hat.
                                     Vorschlag: P-8 (Auslöser ist Berührung, nicht Durchqueren)
                                     und P-9 (der Auslöser folgt dem Knopf; ein von Anfang an
                                     gesperrter Knopf trägt seinen Grund als Hinweis, nicht als
                                     Meldung). P-8 ist eine Bedingung je Stelle, kein Neubau;
                                     P-9 gilt für neue und künftig geänderte Formulare.

Z-21  Anhang anlegen (Datei)         Abweichung: PATH_MESSAGE verspricht „ein vorhandener
      A-19.10, A-19.16, E-072, R-22  absoluter Pfad"; checkAttachmentPath prüft die Existenz nicht
                                     — sie liegt in der Hülle und wird bei jedem Öffnen neu
                                     gemessen. Eine Beobachtung, die in eine Regel geraten ist
                                     (Attachments.tsx:102-105 zieht die Linie selbst).
                                     Vorschlag: „Als Datei ist ein absoluter Pfad zulässig.
                                     Netzwerkpfade sind es nicht." Die Existenzbedingung trägt
                                     path_missing (Attachments.tsx:129), am Ort ihrer Geltung.
                                     Dazu eine Ebene tiefer: „nicht MEHR vorhanden" behauptet eine
                                     Vorgeschichte, die es bei einem nie existierenden Pfad nicht
                                     gab — „mehr" fällt. Drei Dateien, ein Auftrag.

Z-22  Einstellungen > Arbeitsplatz   Abweichung: Z-12 ist unumgesetzt und seit T-181 dringender —
      S-09, E-076 Punkt 3, ST-04     ST-04 hat AREA_LEAD gestrichen, der Kartentitel IST jetzt die
                                     Bereichsüberschrift und widerspricht der Schiene. Kein
                                     Prüffall hält den Namen.
                                     Vorschlag: e2e (apps/web/test hat keine Rendering-Umgebung),
                                     neue Datei tests/e2e/settings-workstation-area.spec.ts über
                                     gotoSettings(page,'arbeitsplatz'). Zwei Bedingungen:
                                     getByRole('heading',{name:'Arbeitsplatz',exact:true}) — ohne
                                     `exact` trifft der Name auch „Dieser Arbeitsplatz" —, dazu
                                     eine Verneinung („Dieser Arbeitsplatz" toHaveCount(0)). Die
                                     Schiene NICHT mit `exact` messen: ihr zugänglicher Name
                                     enthält den Zusatz und wechselt mit der Fensterbreite.

Z-23a Todo-Liste                     Abweichung: ST-06 nennt reactivationTitle als Ausgleich; das
      A-2.5, I-05, E-039, B-19       ist ein Toast NACH der Tat, der Satz ist eine Vorwarnung. Der
                                     Satz ist F, nicht V — er fällt nicht wegen „auf Vorrat".
                                     Vorschlag: er fällt wegen D. Gemessen: die Vorwarnung steht
                                     sechsmal, fünf bleiben, darunter TimeScreen.tsx:167 am Ort
                                     der Handlung. Auflagen: :167 nicht anfassen, SP-16 unberührt,
                                     erster Halbsatz zeichengleich.

Z-23b Todo-Liste / Zeiterfassung     Abweichung: BLOCKIEREND. TimeScreen.tsx:191-203 ist eine
      E-081 Punkt 4, A-2.5           wörtliche Kopie desselben Absatzes, als eigenes JSX statt
                                     über HiddenDoneNotice. Jeder von beiden ist streichbar, weil
                                     es den anderen gibt — zwei Wellen, die einzeln richtig
                                     aussehen, und die Aussage ist fort.
                                     Vorschlag: im selben Auftrag durch HiddenDoneNotice ersetzen
                                     oder ausdrücklich als bleibenden Träger im Quelltext benennen.

Z-24  Todo anlegen / Tags            Abweichung: keine — Zustimmung. Der Bedienungsteil steht
      A-9.5, Pflichtfluss            dreifach im Bedienelement selbst (TagInput.tsx:405, :408,
      „Standard-Tags"                :422), jeweils im Augenblick seiner Geltung.
                                     Vorschlag: freigegeben. Auflagen: der A-Teil bleibt, und die
                                     Toastzeile TodoFormDialog.tsx:130-133 („Als Standard-Tag kam
                                     … hinzu.") ist Teil der Freigabe. Der Bearbeiten-Zweig fällt
                                     ganz.

Z-25  Regel anlegen                  Abweichung: keine — Zustimmung. Der aufzählende Mittelteil
      A-3.1, A-3.4, S-7 (R-2)        ist D zu den FormSection-leads :554, :603, :653, eine
                                     Bildschirmzeile darunter.
                                     Vorschlag: freigegeben. Auflage: der Schlusssatz „Was auf
                                     „Alle" steht, schränkt nicht ein." bleibt zeichengleich — er
                                     ist seit T-181 der Ausgleich für ST-05 und sieht wie ein Rest
                                     aus. Mit ihm fällt :593 (D zum lead), :616 bleibt (A).

Z-26  Regel anlegen / Ordnertiefe    Abweichung: ST-08 fragt, ob die Beschriftung des
      A-3.4, SC 1.3.1, Pflichtpfad   Kontrollkästchens trägt. Sie tut es nicht: weder Label noch
      „vier Ebenen"                  Hinweis sagt etwas über BEIDE Listen, und PoolFormDialog.tsx:
                                     624-631 begründet den lead selbst.
                                     Vorschlag: ABGELEHNT. Der Satz ist A (Abwesenheit einer
                                     zweiten Einstellung) und hängt am vierstufigen Ordnerbaum.

Z-27  Export / Vorlagenwahl          Abweichung: UM-05 will zustandsbinden; den Zustand gibt es
      A-8.6, E-020, E-049            nicht. Der Entwurf lebt in useState von TemplatesScreen
                                     (:147) und ist beim Verlassen weg (:936-939, useLeaveGuard).
                                     Vorschlag: geschlossen als „nichts zu tun", wie UM-01. Ob der
                                     Satz nach dem Präzedenzfall UM-08 fällt, ist ein NEUER
                                     Eintrag und gehört ux-designer — nicht mir, sonst verfasse
                                     und genehmige ich denselben Vorschlag.

Z-28a Todo-Liste / Meldung           Abweichung: UM-07 opfert den F-Satz („Es verschwindet damit
      A-2.5, S-13, E-060 Punkt 4     aus dieser Liste …") zugunsten des A-Satzes. Der
                                     Bewegungssatz ersetzt ihn nicht — er nennt Pools und
                                     Spalten, nicht die Ansichtseinstellung.
                                     Vorschlag: freigegeben in der Sache. Auflage: zwei Sätze
                                     Höchstgrenze OHNE Verlust einer der beiden Aussagen; beide in
                                     einen Satz, der Bewegungssatz ist der zweite. Wortlaut bei
                                     ux-designer.

Z-28b ÜBERHOLT — siehe Z-31.         Der ST-07-Lauf hat stattgefunden; es gibt nichts mehr
                                     herauszunehmen.

Z-29  ohne Anwendungshülle           Abweichung: sechs Sätze, A/B, bleiben — aber fünf Fassungen
      E-001, E-036, SP-20, E-065     derselben Auskunft in zwei Dateien (connection.ts und
                                     desktop/src/shell.ts:239, :379, :483, :530), zusammengehalten
                                     von einem Kommentar statt von einer Messung. Und in der
                                     ausgelieferten Fassung erreicht keiner einen Benutzer:
                                     App.tsx:223 ersetzt bei no_shell die ganze Fläche, der
                                     Entwicklungszweig fällt mit import.meta.env.DEV weg.
                                     Vorschlag: keiner dieser Sätze wird je als Träger einer
                                     Aussage gezählt. Als Zeile in den Kopfkommentar.

Z-30  Versionshinweis / Installieren Abweichung: useUpdateNotice.ts:251 rät, „den angezeigten
      A-18.6, A-18.8, B-18.2, E-064  Verweis von Hand aufzurufen" — dieselbe Bezeichnung, die die
      Punkt 4, E-085                 Hülle soeben abgewiesen hat, in derselben festen Adresse. Der
                                     Zweig ist heute unerreichbar (VERSION_SHAPE zeichengleich mit
                                     is_release_version), und NICHTS misst das: von drei
                                     Formprüfungen hält proof:shell-surface nur build-app.mjs
                                     gegen die Domäne, release.rs nicht.
                                     Vorschlag: der dritte Satz fällt, die ersten zwei bleiben (B).
                                     Dazu die Gleichlaufmessung — Aussage in Z-33.

Z-31  Todo-Liste / Meldung           Abweichung: BLOCKIEREND. TodoListScreen.tsx:314-319 trägt
      S-13, E-081 Punkt 4, UM-07     nach T-181 den Kommentar „Zwei Saetze statt drei … unsere
                                     eigene Auskunft schrumpft auf einen." Der Code tut das nicht:
                                     withMovement HÄNGT AN (movement.ts:101-103), der Rumpf hat
                                     mit Bewegungssatz weiterhin drei Sätze — vor wie nach ST-07.
                                     Ein Kommentar, der UM-07 beschreibt, über Code, der ST-07
                                     umsetzt: der nächste Prüfer schließt den Eintrag ungelesen.
                                     Vorschlag: der Kommentar wird berichtigt, bevor oder während
                                     UM-07 läuft. Z-28a bleibt der offene Rest.

Z-32  Textbestand, Abschnitt 1/6.1   Abweichung: Die Zusage „keiner der Streichvorschläge ist
      E-078, E-076 Punkt 3           durch einen Textvergleich festgenagelt" trägt nicht mehr —
                                     zwei Gegenbeispiele gemessen (undoDone.test.ts:136/:155 und
                                     export-mixed-status-and-billing.spec.ts:128). Sie ist eine
                                     einmal gemessene Zusage in einem alternden Papier.
                                     Vorschlag: die Zusage wird nicht ausgebessert, sondern
                                     ersetzt: Vor jedem Streichauftrag wird der AKTUELLE Wortlaut
                                     in tests/** und apps/*/test/** gesucht, und das Ergebnis
                                     steht im Auftrag. Ein `rg` je Eintrag.

Z-33  Versionsprüfung, Gleichlauf    Abweichung: keine — Antwort auf die Frage des Orchestrators.
      A-18.2, A-18.11, E-085, T-143  Bei den Anhängen ist eine Richtung Fehler und die andere
      S-2                            Hinweis, weil nur eine schadet. Hier schaden BEIDE.
                                     Vorschlag: der Lauf misst GLEICHHEIT und meldet jede
                                     Abweichung in beide Richtungen als Fehler. Begründung und
                                     Bauform in 8.3.
```

---

## 7. Die Pflichtklickpfade, soweit die heutigen Urteile sie berühren

| Pfad | Stand |
|---|---|
| **Timer auf erledigtem Todo** | Berührt von Z-23, Z-28a und Z-31. Die Vorwarnung steht nach Z-23 an **fünf** Stellen, darunter am Ort der Handlung (`TimeScreen.tsx:167`); `reactivationTitle` (SP-16) und `TodoDetailScreen.tsx:399/401` sind unangetastet. Der Toastrumpf nach „Erledigt" ist von T-181 gekürzt, aber nicht auf zwei Sätze gebracht — Z-31 |
| **Exportstatus an jeder Stelle sichtbar** | Unberührt in der Sache. **Neu berührt durch Z-32:** `ExportAudit.tsx:170` — die Zeile im Verlauf einer ausgebuchten Zeitbuchung trägt eine interne Kennung und ist die sechste, die S-19 nicht gezählt hat |
| **Todo-Notiz nie im Export, Buchungsnotiz sichtbar** | Berührt von Z-19. Die **Trennung** ist unangetastet — Z-19a nimmt eine Pflicht weg, die es nicht geben darf, Z-19b baut eine Meldefläche um. Kein Wort von SP-09 ist Gegenstand; die SP-09-Kürzung habe ich ausdrücklich **nicht** beurteilt (4.7) |
| **Vier Ebenen tiefer Ordnerbaum, Selbstverschiebung** | Berührt von Z-26, und das ist der Grund der Ablehnung: „Eine Einstellung für **beide** Listen" trägt den Haken „beliebig tief". Die Absage `TagsScreen.tsx:408` (Selbstverschiebung) ist unberührt |
| **Standard-Tags auf jedem Erstellungsweg** | Berührt von Z-24. Vorwarnung im Hinweis (gekürzt, A-Teil bleibt) plus Nennung im Toast (A-9.5) sind zusammen Bedingung der Freigabe |
| **Vorlageneditor mit Vorschau auf offene Buchungen** | Berührt von Z-27 und 5.3. `ExportScreen.tsx:684` bleibt vollständig stehen; `lib/exportTemplateModel.ts` gehört auf die Sperrliste statt in einen Kürzungsdurchgang |

---

# 8. Nachtrag vom 2026-09-06 — zwei Rückfragen des Orchestrators

## 8.1 Z-31 — ST-07 am Baum: **(c), er bleibt** — aber der Kommentar retiriert UM-07

**Gemessen, nicht aus dem Bericht geschlossen.** `apps/web/src/screens/TodoListScreen.tsx:311-321`:

```
body: withMovement(
  showDone
    ? unchanged
    : /*
        Zwei Saetze statt drei (T-181, ST-07 und Regel S-13):
        Kommt der Bewegungssatz aus der Domaene dazu, ist er der
        zweite, und unsere eigene Auskunft schrumpft auf einen.
      */
      `Aus dieser Liste ausgeblendet. ${unchanged}`,
  movement,
),
```

**Die Antwort auf die Frage lautet (c): der Fall ist eingetreten und kann so bleiben.** ST-07s
neue Fassung verliert kein Faktum — sie sagt weiterhin beides, „aus dieser Liste ausgeblendet"
und „der Status bleibt unverändert" —, sie ist 46 Zeichen kürzer, und sie ist mit meiner Auflage
Z-28a vereinbar. **Es gibt nichts zurückzunehmen.** Eine Rücknahme brächte 46 Zeichen zurück und
sonst nichts.

**Aber der Kommentar daneben ist falsch, und er ist gefährlicher als der Text, den er erklärt.**

`withMovement` hängt an (`apps/web/src/lib/movement.ts:101-103`):

```
export function withMovement(body: string, sentence: string | null): string {
  return sentence === null ? body : `${body} ${sentence}`;
}
```

Damit ergibt der Zweig `showDone === false` **mit** Bewegungssatz:

```
„Aus dieser Liste ausgeblendet.  Der Status bleibt unverändert.  <Bewegungssatz>"
```

— **drei Sätze.** Vor ST-07 waren es ebenfalls drei. **Die Satzzahl hat sich in keinem Zweig
geändert**, in keinem einzigen: zwei eigene Sätze vorher, zwei eigene Sätze nachher, plus
Bewegungssatz wie zuvor. Die Zusicherung „Zwei Saetze statt drei" trifft auf keinen Zustand des
Programms zu, und der Halbsatz „unsere eigene Auskunft schrumpft auf einen" beschreibt eine
Verzweigung, die es im Code nicht gibt: `unchanged` steht in beiden Fassungen.

**Das ist genau die Klasse, die dieser Bericht schon dreimal gefunden hat** — eine Zusicherung an
der Stelle, an der eine Messung stehen müßte (Z-29, Z-30, Z-32) —, aber diesmal mit einer eigenen
Wirkung: **Der Kommentar retiriert einen offenen Eintrag.** Er nennt „Regel S-13" beim Namen und
behauptet ihre Erfüllung. Der nächste Prüfer, der UM-07 vorgelegt bekommt, liest diese Zeilen und
schließt den Eintrag als erledigt, ohne `withMovement` aufzuschlagen. Ich hätte es beinahe getan:
Mein Z-28b ging davon aus, ST-07 sei noch nicht gelaufen, und wäre der Kommentar mir zuerst
begegnet, hätte er meine eigene Prüfung abgekürzt.

**Z-31 — blockierend, und es ersetzt Z-28b:**

1. **Der Kommentar in `TodoListScreen.tsx:314-318` wird berichtigt**, bevor oder zusammen mit
   UM-07. Er darf nennen, was ST-07 getan hat (der erste Satz ist kürzer), und er darf **nicht**
   behaupten, die Satzzahl sei gefallen oder S-13 sei erfüllt.
2. **UM-07 bleibt offen**, und Z-28a ist unverändert sein Maß: Bei einem Bewegungssatz gehören
   beide eigenen Aussagen in **einen** Satz, damit der Rumpf zwei hat. ST-07 hat den Weg dahin
   verkürzt, nicht zurückgelegt.
3. **Eine Regel, die über diesen Fall hinausgeht.** Ein Quelltextkommentar, der die Erfüllung
   einer Regel behauptet, nennt entweder die Stelle, an der sie gemessen wird, oder er behauptet
   sie nicht. „Regel S-13" in einem Kommentar ohne Prüffall ist dieselbe Zusicherung wie
   „Wortgleich an beiden Stellen" in `connection.ts` — nur daß sie hier einen Prüfer abkürzt statt
   einen Leser.

**Zu den zwei roten Prüffällen aus demselben Lauf.** `apps/web/test/app/undoDone.test.ts:136` und
`:155` halten den **alten** `UNDONE_BODY` zeichengleich; `app/undoDone.ts:45` trägt seit T-181 nur
noch „Tags und Status ändern sich dadurch nicht." Die zwei Fälle sind jetzt rot. **Der Code hat
recht und der Prüffall wird nachgezogen** — die Streichung ist von ST-07 gedeckt und sachlich
richtig (der Titel lautet „„X" ist wieder offen.", der Rumpf wiederholte ihn, Regel S-13).

**Eine Auflage an unit-tester, damit die Nacharbeit den Fall nicht entwertet:** `:155` ist nicht
der Zwilling von `:136`. Sein Gegenstand ist die **Zuordnung des Anlasses** — die Gegenprobe in
`:150` (`reopenSentence !== bookingSentence`) ist der Kern, und der angehängte Satz ist das, was
gemessen wird. Wer beide Erwartungen mit derselben Suchen-und-Ersetzen-Bewegung nachzieht, riskiert,
die Gegenprobe mit anzufassen. Die zwei Zeichenketten werden geändert, `:146-151` bleibt zeichengleich.

## 8.2 Z-32 — die Zusage aus Abschnitt 1 trägt nicht mehr, und ST-03 ist nicht vollständig

**Die Zusage, um die es geht** (`docs/design/textbestand.md:48-52`, wiederholt in 6.1):

> „Von den Sätzen, die in Abschnitt 7 zum Streichen vorgeschlagen sind, ist **keiner** in
> `tests/e2e` oder `apps/web/test` durch einen Textvergleich festgenagelt."

**Ich habe nachgemessen.** Gesucht über `**/test/**` und `tests/` nach kennzeichnenden Stücken der
ST-04-, ST-05-, ST-06-, ST-07-, ST-08- und ST-09-Kandidaten (zwölf Fragmente) und nach den drei
Kennungen aus ST-03. Das Ergebnis, und es ist besser und schlechter zugleich, als ich erwartet hatte:

**Besser:** Von zwölf Fragmenten hat **eines** einen Treffer — genau das, das frontend-dev
gemeldet hat (`apps/web/test/app/undoDone.test.ts:136`, `:155`). Die anderen elf kommen in keinem
Prüffall vor. Die Zusage ist also **nicht flächendeckend falsch**; sie ist an einer Stelle falsch,
und die hat der richtige Mensch gefunden.

**Schlechter:** Sie ist an einer **zweiten** Stelle falsch, und diese zweite ist die aufschlußreiche.

```
tests/e2e/export-mixed-status-and-billing.spec.ts:127-129
  await expect(history.locator('.auditrow--not_billed .auditrow__reason--absent')).toContainText(
    'Ohne Begründung ausgebucht. Das Feld ist freiwillig (E-047)',
  );

apps/web/src/components/ExportAudit.tsx:170-171
  Ohne Begründung ausgebucht. Das Feld ist freiwillig (E-047) — protokolliert ist
  trotzdem, dass hier jemand Zeit ohne Abrechnung abgehakt hat, und wann.
```

Das ist ein **Textvergleich gegen sichtbaren Oberflächentext**, und der Text trägt eine interne
Kennung. **S-19 zählt fünf Kennungen im Oberflächentext** (`textbestand.md:585-592`:
`TagsScreen.tsx:79`, `TagsScreen.tsx:612`, `TodoDetailScreen.tsx:580`, `ExportAuditScreen.tsx:174`,
`labels.ts:438`). **Es sind sechs.** Die sechste steht in `ExportAudit.tsx:170`, sie ist nicht in
ST-03 aufgeführt, und T-181 hat ST-03 folglich vollständig ausgeführt, ohne sie zu berühren.

**Damit korrigiere ich meine eigene Nachmessung von gestern** (4.7): Ich hatte über
`apps/web/src` nach `(E-047)`, `(E-054)`, `(E-055)` gesucht und keinen Treffer gefunden — weil
mein Suchmuster die Klammern verlangte und ich die Trefferliste auf `labels.ts` hin gelesen habe.
`ExportAudit.tsx:170` trägt `(E-047)` und stand in derselben Liste. **Ich habe sie überlesen.**
ST-03 ist damit **nicht erledigt**, sondern zu fünf Sechsteln ausgeführt.

**Was ich davon halte — und das ist wichtiger als die zwei Fundstellen.**

Die Zusage ist keine falsche Behauptung, sondern eine **richtige Messung, die veraltet ist**. Sie
wurde in T-163 einmal gefahren, gegen einen Baum, der seither ST-01 bis ST-05, ST-07, ST-09,
ST-10, UM-03, die acht neuen Pflichtfeldmeldungen aus T-175 und X-04 aufgenommen hat. T-180 mußte
aus demselben Grund bereits eine Zahl desselben Papiers berichtigen (222 → 286 `getByRole`).
**Ein Papier kann eine Messung festhalten; es kann sie nicht wiederholen.** Und die Zusage steht
an der ungünstigsten denkbaren Stelle: Sie ist die Grundlage, auf der Streichungen als „ohne
Prüffallwirkung" eingestuft werden — also genau dort, wo ein Irrtum niemandem auffällt, bis ein
Lauf rot wird.

**Für meine Urteile ziehe ich zwei Folgen:**

1. **Ich stütze mich nicht mehr auf sie.** Für Z-23, Z-24, Z-25 und Z-28a habe ich die Wortlaute
   heute selbst gesucht; keiner kommt in einem Prüffall vor. Das ist meine Messung von heute, nicht
   die von T-163. **Sie ist ausdrücklich nicht erschöpfend:** Ich habe zwölf kennzeichnende
   Fragmente gesucht, nicht alle rund 240 Sätze.
2. **Die Zusage wird nicht ausgebessert, sondern ersetzt.** Eine korrigierte Fassung veraltet
   genauso. Was trägt, ist ein Schritt im Auftrag statt eines Satzes im Papier:

> **Z-32, Auflage an jeden künftigen Streichauftrag:** Bevor ein Wortlaut fällt oder sich ändert,
> wird er in seiner **heutigen** Fassung in `tests/**` und `apps/*/test/**` gesucht, und das
> Ergebnis steht im Auftrag — nicht im Papier, das ihn vorgeschlagen hat. Ein `rg` je Eintrag.
> Findet sich ein Treffer, gehört unit-tester oder e2e-tester in denselben Auftrag, so wie es
> Z-17 und Z-21 bereits verlangen.

**Und die dritte Folge, die nicht mich betrifft:** ST-03 bekommt einen sechsten Eintrag
(`ExportAudit.tsx:170`, „(E-047)" fällt, der Satz bleibt), und dieser eine Eintrag geht — anders
als die fünf davor — **zusammen mit e2e-tester**, weil `export-mixed-status-and-billing.spec.ts:128`
ihn hält. Das ist genau der Fall, für den Z-32 gemacht ist, und er ist der erste, der ihn braucht.

**Ohne Auflage, aber es gehört gesagt:** frontend-dev hat den Prüffall **nicht angepaßt, sondern
gemeldet**. Das ist die richtige Reihenfolge, und sie ist der Grund, warum dieser Abschnitt
existiert statt eines stillen grünen Laufs. Der Fehler liegt nicht darin, daß er es finden mußte,
sondern darin, daß niemand es ihm mitgeben konnte.

## 8.3 Z-33 — welche Aussage der Gleichlauflauf treffen soll: **Gleichheit**

**Der Satz, um den gebeten wurde:**

> **Der Lauf mißt Gleichheit, nicht Ordnung: `is_release_version` in
> `apps/desktop/src-tauri/src/release.rs` und `VERSION_SHAPE` in `packages/domain/src/version.ts`
> nehmen und verwerfen dieselbe Menge, und jede Abweichung ist in beide Richtungen ein Fehler.**

**Warum hier nicht die Regel der Anhänge gilt.** Bei den Anhängen ist die Asymmetrie in der Sache
begründet: Nur **eine** Richtung schadet. Ist die Hülle strenger, wird eine harmlose Datei beim
Öffnen abgewiesen — ärgerlich, sicher. Ist die Domäne strenger, könnte die Hülle etwas öffnen, das
die Domäne nie hätte annehmen dürfen. Eine Richtung ist Fehler, die andere Hinweis, weil die
Folgen verschieden schwer sind.

**Bei der Fassungsprüfung sind beide Richtungen Fehler, und die harmlos aussehende ist die
schlimmere:**

| Richtung | Was geschieht | Warum es zählt |
|---|---|---|
| **Hülle strenger** (Domäne nimmt, Hülle weist ab) | Der Hinweis erscheint, der Benutzer drückt „Installieren", die Hülle weist ab → der `rejected`-Text (Z-30). Ihm wird gesagt, es gebe eine neue Fassung, und dann wird er nirgendwohin geschickt — der angezeigte Verweis führt auf eine GitHub-Seite, die es nicht gibt | **laut**, aber falsch. A-18.6 verspricht einen Verweis, der zur Release-Seite führt |
| **Domäne strenger** (Hülle nähme, Domäne weist ab) | `decideUpdateNotice` liefert `show: false`. Nach **A-18.11** ist das von „alles aktuell" **nicht zu unterscheiden**: kein Hinweis, keine Fehlerfläche, nur eine Protokollzeile | **still**. Eine wirklich veröffentlichte Fassung wird nie gemeldet, und niemand erfährt es je |

Die zweite Richtung ist genau der Fehler, den **T-143 S-2** schon einmal gefunden hat — dort in
`build-app.mjs`, mit demselben Ergebnis („die Versionsprüfung dieses Erzeugnisses meldete sich
**nie**, still, ohne Protokollzeile, nicht von „alles aktuell" zu unterscheiden"). Prüfung 3b
existiert wegen dieses Fehlers. Ihn an der dritten Stelle als „Hinweis" durchgehen zu lassen,
hieße die Lehre auf zwei Drittel der Fläche anzuwenden.

**Deshalb Gleichheit.** Es gibt hier keine Richtung, in der eine Abweichung nur unbequem wäre.

**Drei Punkte zur Bauform, weil sie sich von Prüfung 3b unterscheidet:**

1. **Kein Zeichenvergleich.** `release.rs:70-135` ist kein regulärer Ausdruck, sondern eine
   handgeschriebene Bytesprüfung mit benannten Schranken (`MAX_VERSION_LEN` 94, `MAX_NUMBER_LEN` 9,
   `MAX_PRERELEASE_LEN` 64). Prüfung 3bs Methode — den Ausdruck aus der Domäne herausschneiden und
   zeichengleich suchen — trägt hier nicht. Gemessen wird deshalb **Verhalten über eine
   Falltafel**, wie bei `proof:attachment-parity` (E-085).
2. **Eine Liste, zwei Seiten.** Die Falltafel gehört **dem Lauf** und wird durch **beide** Seiten
   gefahren; zwei gepflegte Listen zu vergleichen wäre dieselbe Bauart, die T-176-6 als „zufällig
   gleich sortiert" beschrieben hat. Material liegt bereit: die Ausbruchsliste aus B-18.2
   (`release.rs:244-247`) und die Fälle in `packages/domain/test`.
3. **Die Gegenprobe in beide Richtungen ist die Hälfte, die sonst fehlt.** Eine Mutation je Seite
   — eine Schranke verschieben, ein Zeichen aus dem Vorrat nehmen — muß den Lauf rot machen, und
   zwar **jede** von beiden. Ohne das ist er der nächste Wächter, der zusichert statt zu messen;
   E-085 nennt es für die Anhänge ausdrücklich, und es ist derselbe Satz, den ich in Z-13 zu
   `proof:addin` geschrieben habe.
4. **Die Zahl 94 gehört mit hinein.** `VERSION_MAX_LENGTH = 94` (Domäne) und `MAX_VERSION_LEN = 94`
   (Hülle) sind dieselbe Schranke, zweimal geschrieben. Sie ist Teil der Gleichheit, nicht ihr
   Beiwerk.

**Was der Lauf nicht messen soll:** ob `build-app.mjs` mitgeht. Das tut Prüfung 3b bereits, mit
der für sie richtigen Methode. Zwei Läufe, drei Stellen, jede Stelle in genau einem Lauf.

---

## Annahmen

1. **Ich berichtige meine eigene Regel P-1**, statt den Wortlaut ihr anzupassen (Z-17). Begründung:
   Der Fehler lag in der Zahl, nicht im Satz — mein eigenes P-4-Muster hat sie von Anfang an
   verletzt, und eine Regel, die ihr Muster nicht einhält, wird beim nächsten Griff still gebeugt.
2. **P-8 und P-9 sind neu und von mir gesetzt** (Z-20), obwohl niemand nach neuen Regeln gefragt
   hat. Die Frage lautete „ist das die richtige Auslösung"; sie mit „nein" zu beantworten und
   nicht zu sagen, was gilt, wäre keine Antwort.
3. **P-8 gilt für die sechs gebauten Meldungen, P-9 nicht.** P-8 ist eine Bedingung an einem
   Ausdruck, P-9 wäre ein Umbau an zehn Dialogen ohne Vorlage bei ui-designer. Dieselbe Trennung
   wie bei Z-06.
4. **Ich habe UM-08 und die SP-09-Kürzung nicht beurteilt**, obwohl ich beide gelesen habe. Für
   UM-08 fehlt der Handbuchabsatz, den T-180 selbst als Vorbedingung gesetzt hat; für SP-09 fehlt
   security-checker, und der Baustein geht durch Z-19b gerade in Nacharbeit. Der Orchestrator hat
   die Zurückstellung bestätigt.
5. **Zeilenangaben stammen aus dem Baum vom 2026-09-05 nach T-181**, der Nachtrag in Abschnitt 8
   aus dem vom 2026-09-06. Zwischen beiden hat sich `TodoListScreen.tsx:314` bewegt; das ist der
   Grund, aus dem der Nachtrag am Baum gemessen und nicht aus meinem eigenen Abschnitt 4.6
   geschlossen ist.
6. **`connection.ts` und `shell.ts` habe ich als eine Fläche beurteilt**, obwohl `shell.ts` unter
   `apps/desktop` liegt. Die Sätze sind wortgleich und die Frage nach ihrem Gleichlauf ist ohne
   beide Seiten nicht zu stellen.
7. **Meine Nachmessung in 8.2 ist nicht erschöpfend.** Zwölf kennzeichnende Fragmente und drei
   Kennungen, nicht alle rund 240 Sätze. Das ist der Grund, aus dem Z-32 ein Schritt im Auftrag ist
   und keine neue Zusage in einem Papier.

## Risiken

1. **Z-23b und Z-31 sind beide vom Typ „zwei Wellen, jede für sich richtig".** Das ist der Typ,
   den E-081 Punkt 4 benannt hat, und er ist in dieser Welle **zweimal** aufgetreten. Das ist kein
   Zufall, sondern die Bauform der Streichliste: Sie führt Einträge einzeln, und die Doppelungen
   liegen zwischen ihnen.
2. **Z-19b ist ein Defekt, den fünf Prüfläufe nicht sehen.** `role="alert"`-Bauart ist weder
   Kontrast noch Rolle noch zugänglicher Name; `contrast-check`, `proof:foreign`,
   `proof:codepoints` und die Typprüfung gehen daran vorbei, und die einzige e2e-Reihe, die die
   Bauart misst, misst `TextField`. Er ist in T-162 behoben worden und in einem Baustein
   stehengeblieben — die Behebung war nicht gemessen, sondern aufgezählt.
3. **Z-30/Z-33 nennt einen Zweig, der unerreichbar ist, und genau das ist das Risiko.** Solange er
   unerreichbar ist, prüft ihn niemand; wird er erreichbar, ist er der einzige Ort, an dem die
   Abweichung sichtbar wird, und er rät dem Benutzer, an der letzten Kontrolle vorbeizugehen.
4. **`lib/poolRule.ts` steht seit T-181 ungeschützt** (5.3). Die Sperre war an eine Bedingung
   gebunden, die Bedingung ist eingetreten, und niemand hat es vermerkt.
5. **Z-22 ändert nichts an dem Risiko, das Z-12 schon hatte** (T-177 Risiko 3): Wo kein Prüffall
   hängt, merkt niemand die Rücknahme. Der vorgeschlagene Prüffall hebt es auf — solange er mit
   `exact: true` gebaut wird.
6. **Die Klasse „Zusicherung statt Messung" ist in diesem Bericht viermal aufgetreten**: Z-29
   (Wortgleichheit über zwei Dateien, von einem Kommentar behauptet), Z-30/Z-33 (zwei Formen, von
   nichts gehalten), Z-31 (Regelerfüllung, von einem Kommentar behauptet), Z-32 (Prüffall-Freiheit,
   von einem alternden Papier behauptet). Viermal in einer Aufgabe ist kein Zufall mehr. Der
   Bestand hat das Mittel — `proof-shell-surface` Prüfung 3b und 4 tun genau das —, es wird nur
   nicht angewandt, wenn der Träger ein Kommentar oder ein Designpapier ist statt Code.

## Offene Fragen

1. **An den Orchestrator, erledigt:** ST-07 ist gelaufen. Antwort in 8.1: **(c)**, kein Rückbau,
   aber Z-31 tritt an die Stelle von Z-28b, und UM-07 bleibt offen.
2. **An den Orchestrator, beantwortet:** Aussage des Gleichlauflaufs — **Gleichheit**, Begründung
   und Bauform in 8.3.
3. **An ux-designer:** vier neue Einträge, die ich ausdrücklich nicht selbst verfasse: der zweite
   Satz aus `ExportScreen.tsx:685` (UM-08-Klasse, Z-27), `lib/exportTemplateModel.ts` und
   `lib/poolRule.ts` als Sperrlisteneinträge (5.3), und **ST-03 als sechster Eintrag**
   (`ExportAudit.tsx:170`, Z-32).
4. **An den Orchestrator:** Z-32 als Regel — gehört sie in `CLAUDE.md` zum Abschnitt über den
   Textdurchgang, oder als Nachtrag in `docs/design/textbestand.md`? Das Papier ändert ux-designer,
   `CLAUDE.md` änderst du; ich schlage sie nur vor.
5. **An mich selbst, Wiedervorlage:** UM-08 (nach dem Handbuchabsatz) und die SP-09-Kürzung (nach
   Z-19b und mit security-checker).

## Nächster Schritt

1. **frontend-dev, ein Auftrag:** Z-19b (Meldefläche in `NoteField` nach der Bauart von
   `ConfirmDialog`), Z-19a (`required` entfernen, Musterseite nachziehen), Z-20/P-8 (Bedingung an
   den sieben `onBlur`-Stellen).
2. **unit-tester, sofort:** die zwei roten Fälle in `apps/web/test/app/undoDone.test.ts:136`
   und `:155` auf den neuen `UNDONE_BODY` ziehen — **und `:146-151` zeichengleich lassen**, das ist
   die Gegenprobe zur Anlaß-Zuordnung und nicht Beiwerk (8.1).
3. **frontend-dev, klein:** Z-31 — den Kommentar in `TodoListScreen.tsx:314-318` berichtigen. Er
   behauptet die Erfüllung von S-13, die es nicht gibt, und schließt damit UM-07 für den nächsten
   Leser.
4. **frontend-dev, e2e-tester, ein Auftrag:** Z-17 — der neue Titelsatz **und** der Prüffall über
   die ganze Zeichenkette.
5. **domain-dev, unit-tester, frontend-dev, ein Auftrag:** Z-21 — zwei Wörter in drei Dateien.
6. **e2e-tester:** Z-22, mit `exact: true` und der Verneinung.
7. **frontend-dev, e2e-tester, ein Auftrag:** ST-03 sechster Eintrag — `ExportAudit.tsx:170` und
   `tests/e2e/export-mixed-status-and-billing.spec.ts:128` zusammen (Z-32).
8. **frontend-dev, ein Auftrag:** Z-23 (mit Z-23b), Z-24, Z-25, Z-26 (nichts zu tun), Z-28a (mit
   Z-31). Streichung und Ausgleich zusammen; geteilt erlischt die Freigabe.
9. **frontend-dev, klein:** Z-30 erster Teil (der dritte Satz fällt), Z-29 (eine Zeile in den
   Kopfkommentar).
10. **Neue Aufgabe nach E-085:** die Gleichlaufmessung `release.rs` gegen `VERSION_SHAPE`, Aussage
    **Gleichheit**, Falltafel im Lauf, Gegenprobe in beide Richtungen (Z-33).
11. **documenter, zuletzt:** `docs/benutzerhandbuch.md:558` (Bereich „Arbeitsplatz") und der
    UM-08-Absatz zum Board, der vor der Streichung stehen muss.
