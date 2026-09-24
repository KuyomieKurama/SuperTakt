Aufgabe: T-247 — Dokumentation nachziehen (letzter Schritt des Qualitätstors)
Status: fertig
Artefakte:
- docs/benutzerhandbuch.md
- docs/glossar.md

Zusammenfassung: Die Dokumentation ist an die Entscheidung zu F-21 (E-100, gegen das Anhängen)
angepasst. Im Benutzerhandbuch beschreibt der Abschnitt „Das Outlook-Add-in nutzen" jetzt nur noch
das Anlegen eines Todos, nicht mehr das Buchen auf ein vorhandenes. Der Abschnitt „Die Call-Nummer
und bereits bestehende Todos" ist neu geschrieben: Warnung mit Trefferliste (Titel, bei erledigten
Todos die Wortmarke „Erledigt"), ausdrücklich ohne Bedienelement, der Hinweistext bei fehlendem
Treffer, und dass „Neues Todo" darunter unverändert verfügbar bleibt. Die abweichende
Knopfbeschriftung „Neue Aufgabe anlegen" im Aufgabenbereich gegenüber „Todo anlegen" im
Outlook-Menüband ist benannt, nicht verschwiegen oder geglättet. Der Satz zur Abwesenheit von
Anhängen aus dem Add-in ist um einen Satz ergänzt, der die strukturelle Abwesenheit (keine Route,
keine Schaltfläche) ausdrücklich macht. Im Glossar sind die beiden vom code-reviewer gemeldeten
Zeilen (Call-Nummer, Outlook-Add-in) korrigiert: Sie behaupten nicht mehr, das Add-in biete ein
Buchungsangebot auf ein gefundenes Todo an.

Wortlaut abgeglichen gegen den Quelltext (nicht erfunden): `apps/outlook-addin/src/ui/
DuplicateOffer.tsx` für die genauen Meldungstexte „Zu Call … gibt es bereits ein Todo.“ /
„Zu dieser Call-Nummer gibt es bereits … Todos.“ / „Zu Call … gibt es noch kein Todo.“ und die
Wortmarke „Erledigt“; `apps/outlook-addin/src/ui/TaskPane.tsx` für den Knopftext „Neue Aufgabe
anlegen“; `apps/outlook-addin/manifest.xml:130` für „Todo anlegen“ im Menüband; `docs/spec.md`
A-10.9 für den Wortlaut der Anforderung.

Geprüft und unverändert gelassen, weil bereits zutreffend: die Einleitung des Handbuchs, der
Abschnitt „Anhänge an ein Todo hängen“ im Kern, der Abschnitt „Was Takt (noch) nicht tut“, README.md,
docs/datenarchiv.md. Der `humanizer`-Skill stand in dieser Sitzung nicht als aufrufbarer Skill zur
Verfügung (nicht in der Skill-Liste); ich habe die neu geschriebenen Absätze deshalb selbst nach den
im Skill-Auftrag genannten Kriterien geprüft (keine Floskeln, keine Werbesprache, Stil konsistent
zum bestehenden Dokument) und zwei Stellen dabei gestrafft.

Annahmen: Die genauen Meldungstexte und Knopfbeschriftungen habe ich am Quelltext abgelesen, nicht
aus dem Auftrag übernommen, weil der Auftrag sie nur umschrieben, nicht wörtlich zitiert hat — damit
das Handbuch mit dem tatsächlich angezeigten Text übereinstimmt.

Risiken: Keine neuen. Die weiterhin offene Y-12 (Frist verfällt beim Wechsel in die Einstellungen)
und die noch nicht geprüften Flächen R-23/R-24 betreffen keine meiner Dateien.

Offene Fragen: Keine.

Nächster Schritt: `docs/design/textbestand-aufgabenbereich.md` (Y-09) und `docs/testplan.md`
(Zeilen 1396, 1402, 1538) sind an den ux-designer beziehungsweise e2e-tester zu geben — nicht Teil
dieses Auftrags und nicht von mir angefasst.
