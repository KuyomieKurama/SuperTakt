Aufgabe: T-004 — Doku-Gerüst und Begriffsglossar
Status: fertig

Artefakte:
- `docs/glossar.md` (neu)
- `docs/benutzerhandbuch.md` (neu, nur Überschriften und Klammerzeilen)
- `docs/entwicklerhandbuch.md` (neu, nur Überschriften und Klammerzeilen)
- `.claude/team/reports/T-004-documenter.md` (dieser Bericht)

Zusammenfassung: Das Glossar deckt die 18 verlangten Mindestbegriffe ab, jeweils mit deutschem
Begriff, Code-Bezeichner (sofern belegt), einer Bedeutungszeile und Anforderungs-ID. Der
wichtigste Punkt, die Verwechslungsgefahr zwischen Todo-Notiz und Buchungsnotiz aus R-08, ist an
den Anfang gestellt: Die beiden Felder heißen ab sofort Vermerk (bleibt in der Anwendung) und
Leistungsbeschreibung (geht in den Export), mit Begründung, warum die Namen sich nicht mehr
verwechseln lassen. Zwei echte Doppelbenennungen aus der Spezifikation, Todo/Ticket und
Timer/Time-Tracker/Time-Tracking/Zeiterfassung, sind als Befund im Glossar vermerkt statt als
Glossareintrag mit zwei Zeilen. Benutzer- und Entwicklerhandbuch enthalten nur
Überschriftengerüste mit Klammerzeilen zur jeweiligen Anforderungsquelle, ohne Fließtext, weil
noch keine Aufgabe im Board auf „Fertig" steht.

Annahmen:
- Für Begriffe, zu denen es noch keinen Code gibt (packages/domain existiert noch nicht), habe
  ich den Code-Bezeichner als „Vorschlag" markiert statt die Zeile leer zu lassen. Diese
  Vorschläge sind ausdrücklich nicht verbindlich und müssen mit T-001 abgeglichen werden.
- Ich habe „Todo" statt „Ticket" als Leitbegriff im Glossar geführt, weil „Todo" durchgehend in
  `CLAUDE.md` und `decisions.md` vorkommt. Das Vorkommen von „Ticket" in der Spezifikation ist
  als Befund vermerkt, nicht als eigener Eintrag.
- Ich habe „Timer" als Bedienelement zum Starten und Stoppen geführt (A-6.1, A-6.2) und die
  Varianten Time-Tracker, Time-Tracking und Zeiterfassung als Befund vermerkt, statt selbst zu
  entscheiden, welcher Name für den übergeordneten Bereich gilt.
- Die Umbenennung Vermerk/Leistungsbeschreibung habe ich, wie in der Aufgabe verlangt, als
  verbindlich für Oberfläche, Dokumentation und Review markiert.

Risiken:
- R-08 ist mit der Umbenennung im Glossar benannt, aber nicht behoben: Erst wenn frontend-dev
  (T-006) und später die Todo- und Zeitbuchungs-Screens die Felder tatsächlich Vermerk und
  Leistungsbeschreibung nennen, greift der Schutz vor Verwechslung.
- Solange T-001 die vorgeschlagenen Code-Bezeichner nicht bestätigt, können Glossar und
  tatsächlicher Code auseinanderlaufen. Das Glossar markiert das offen, löst es aber nicht.
- Sicherheitshinweis: Die Abschnitte zu Base64 (R-05, A-8.9) und zum Add-in-Token (R-09, E-009)
  stehen im Benutzerhandbuch-Gerüst als eigene Überschriften vor, sind aber noch ohne Text. Bis
  zur Ausformulierung ist der Warnhinweis für Benutzer nicht sichtbar.

Offene Fragen:
- Ist „Ticket" (Abschnitt 1, A-2.1) ein reines Synonym zu „Todo", oder trägt der Begriff eine
  eigene Bedeutung, die im Glossar sonst verloren geht?
- Meint „Timer" nur das Start-/Stopp-Element, während „Zeiterfassung"/„Time-Tracking" den
  übergeordneten Funktionsbereich bezeichnen, oder sind das mehrere Namen für dieselbe Sache?
- Ist „Erledigt" (A-2.4) dasselbe wie die Kanban-Beispielspalte „Done" (A-5.3), oder ein davon
  unabhängiges Feld? Die Spezifikation klärt das Verhältnis nicht ausdrücklich.
- A-8.7 mischt in seinen Beispielpfaden deutsche (`buchung`, `buchung.notiz`, `buchung.dauer`)
  und englische (`todo.callNumber`, `todo.tags`, `system.windowsUser`) Namen. Das widerspricht
  auf den ersten Blick der Regel aus `CLAUDE.md`, Bezeichner im Code englisch zu halten. Sind
  die Beispielpfade wörtlich gemeint, oder nur eine Notation für die Struktur?

Nächster Schritt: domain-dev sollte bei T-001 die im Glossar als „Vorschlag" markierten
Code-Bezeichner prüfen, bestätigen oder ändern. Vor T-006 (Designsystem) und T-005
(Screen-/Zustandsmatrix) sollten die vier offenen Fragen entschieden werden, insbesondere die
Umbenennung Vermerk/Leistungsbeschreibung, damit die Oberfläche von Anfang an die verbindlichen
Begriffe zeigt statt sie nachträglich umbenennen zu müssen.
