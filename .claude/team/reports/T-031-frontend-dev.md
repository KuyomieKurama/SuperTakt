Aufgabe: T-031 — S-14, der Editor für Exportvorlagen
Status: fertig

Hinweis: Der Agent konnte diese Datei nicht selbst schreiben (Schreibsperre auf Berichten während
seines Laufs). Der Orchestrator hat sie aus dem Rückgabewert abgelegt, gekürzt um die vollständige
Kontrastausgabe.

Artefakte: `apps/web/src/lib/exportTemplateModel.ts` (553), `screens/TemplatesScreen.tsx` (869),
`screens/TemplateFields.tsx` (631), `screens/TemplatePreview.tsx` (521). Geändert: Router,
Navigation, `ExportScreen`, `SettingsScreen`, `BookingsScreen`, `TodoDetailScreen`,
`BookingDialogs`, `api/types.ts`, `api/endpoints.ts`, `lib/labels.ts`, `lib/format.ts`,
`components/Icon.tsx`, `styles/app.css` (+914 Zeilen, kein Farbwert), `contrast-check.mjs`.
Keine neue Abhängigkeit, `pnpm-lock.yaml` unverändert, keine `any`.

Zusammenfassung: S-14 liegt unter `#/export/vorlagen` als zweiter Bereich des Exports — drei
Spalten: Vorlagenliste, Feldliste, Ergebnis. Die Quelle kommt aus einer geschlossenen Auswahlliste
(E-017), gegliedert nach Todo, Tagesgruppe und System. Der Vermerk steht nicht darauf, auch nicht
gesperrt; die Typzusicherung `NoteSourceIsAbsent` bricht den Übersetzer, sobald jemand ihn
aufnimmt. Die Vorschau geht durch den Dienst und sonst nirgendwohin (R-17), nach Tagesgruppen
gegliedert, aufklappbar zu JSON, Feldherkunft und den einzelnen Buchungssegmenten (E-028).
Gesperrte Gruppen tragen Grund und „Leistung nachtragen" (E-034).

Zwei Nachträge eingearbeitet: Die Nachbildung von E-025 ist aus der gesamten Oberfläche
verschwunden — S-07 und S-14 beziehen ihre Tagesgruppen aus `preview.groups`; aus N+1 Aufrufen
sind zwei geworden. Und „Nicht abrechnen" (E-047) ist an `POST /time-entries/{id}/not-billed`
angebunden.

Die Standardvorlage ist an vier Merkmalen zugleich erkennbar: Schloss, Etikett „mitgeliefert",
kein Speichern-Knopf, gesperrte Felder. Die vier Feldnamen im Erklärkasten sind nicht getippt,
sondern aus der gelieferten Vorlage gelesen. Jede andere Vorlage trägt eine Abgleichkarte, die in
Worten sagt, worin sie abweicht — Maßstab ist die vom Dienst gelieferte Vorlage mit `isBuiltin`.

Gemessen: 152 Prüfungen, alle bestanden (47 Schnittstelle, 76 Browser, 29 reine Funktionen), keine
Konsolenmeldung. Eine Buchung abwählen lässt die Gruppe von 0,50 auf 0,25 fallen; alle abwählen
lässt die Gruppe stehen und nennt den Grund. `not-billed`: 200, Status `exported`, **Zähler bleibt
0**, zweiter Aufruf 409. `pnpm typecheck` und `pnpm build` grün, Kontrastprüfung **0 von 250
Paaren durchgefallen**, zehn davon neu.

Annahmen: Die Vorschau zeigt den gespeicherten Stand und sagt das ausdrücklich, weil
`POST /export/preview` nur eine Kennung annimmt. Der Base64-Wert wird nicht dekodiert — der
Klartext steht darunter als die vom Dienst geladenen Einzeltexte. Kein erfundener Beispieldatensatz
bei leerer Vorschau, sondern ein ehrlicher Leerzustand. Höchstens sechs Tagesgruppen in der
Vorschau, S-07 zeigt alle. Der Verlassensschutz fängt den Klick ab, nicht den Adresswechsel.

Risiken: Die Auswahlliste steht zweimal (behoben durch E-049). Der Speicherfehler wird über die
Zeichenkette `Feld N: ` einer Zeile zugeordnet. Eine nicht abgerechnete Buchung trägt heute das
Etikett „Exportiert" (behoben durch E-050). Der Verlassensschutz erreicht keine Sprünge, die die
Anwendung selbst auslöst. Kein automatischer Test dieser Fläche — die 152 Prüfungen waren
Wegwerfskripte.

Nebenbefund: Die Sperre einer Tagesgruppe hängt am konfigurierten Feld, nicht an der Buchung — eine
Vorlage ohne `group.bookingNotes` erzeugt für dieselbe Gruppe eine Zeile.
