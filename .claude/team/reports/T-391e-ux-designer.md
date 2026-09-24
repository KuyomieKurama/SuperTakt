Aufgabe: T-391e — Leitbegriff „Todo" in den Abschnitten vom 15.09.2026 des Textbestands
Status: fertig
Artefakte: docs/design/textbestand-aufgabenbereich.md (Zeilen 1100, 1106, 1108)
Zusammenfassung: Drei Wortstellen auf den Leitbegriff „Todo" gebracht (E-029/E-133): „erledigte Aufgaben" → „erledigte Todos", „an der ausgewählten Aufgabe" → „am ausgewählten Todo", „Stattdessen neue Aufgabe erstellen" → „Stattdessen neues Todo anlegen". Sonst nichts an den Abschnitten geändert.
Prüfung: Grep nach „Aufgabe" in der Datei vorher und nachher gelesen; die drei beauftragten Stellen sind ersetzt. Keine Tests ausgeführt (reine Dokumentänderung). E-087-Suche nach dem Wortlaut in tests/** nicht ausgeführt, da kein Oberflächentext geändert wurde, nur das Designpapier.
Annahmen: Der Zeilenumbruch mit führendem Leerzeichen vor „gespeichert." (Z. 1107) bleibt unverändert, weil nur die Wörter getauscht werden sollten.
Risiken: keine.
Offene Fragen: Zeile 1099 enthält weiterhin „Wählen Sie eine Aufgabe zum Ergänzen oder legen Sie bewusst eine neue Aufgabe an." — nicht Teil des Auftrags, widerspricht aber demselben Leitbegriff. Soll das nachgezogen werden (z. B. „ein Todo … ein neues Todo")?
Nächster Schritt: Entscheidung zu Zeile 1099; danach nichts weiter. Nicht committet.
