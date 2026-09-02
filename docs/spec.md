# Takt — Produktspezifikation

Quelle: Der ursprüngliche Framer-Gestaltungsauftrag des Auftraggebers, hier in eine prüfbare
Anforderungsliste überführt. Der Wortlaut der Anforderungen ist inhaltlich unverändert; ergänzt
wurden nur Nummerierung, Gliederung und die Abgrenzungen, die für Umsetzung und Test nötig sind.

Ergänzungen und Entscheidungen, die nicht aus dem Originaltext stammen, sind als **Nachtrag**
gekennzeichnet. Alles andere ist Vorgabe.

Status: verbindlich. Änderungen laufen über `.claude/team/decisions.md`.

---

## 1. Grundidee

Takt verbindet Todo- und Ticketverwaltung, ein Kanban-Board, Zeiterfassung, flexible
Tagverwaltung, hierarchische Ordner für Tags, persönliche Todo-Notizen, Notizen je Zeitbuchung,
den Export erfasster Zeiten an ein externes Abrechnungstool, konfigurierbare Standard-Tags und
eine Outlook-Anbindung zum schnellen Anlegen von Todos.

Trotz des Funktionsumfangs bleibt die Anwendung intuitiv und übersichtlich. Das Design ist
modern, hochwertig, reduziert und professionell und fühlt sich nach einem modernen
SaaS-Produkt an, nicht nach einer klassischen To-do-App.

**Nachtrag — Betriebsform.** Takt läuft vollständig lokal. Es gibt keine Cloudanbindung und
keinen Datenbankserver. Gespeichert wird in einer eingebetteten SQLite-Datei im
Anwendungsdatenverzeichnis des Benutzers.

---

## 2. Todos und Tickets

| ID | Anforderung |
|---|---|
| A-2.1 | Benutzer können beliebig viele Todos beziehungsweise Tickets anlegen. |
| A-2.2 | Ein Todo hat mindestens: Titel, Status, mehrere Tags, persönliche Notiz, erfasste Arbeitszeit, optional weitere Metadaten. |
| A-2.3 | Ein Todo kann mit beliebig vielen Tags versehen werden. |
| A-2.4 | Ein Todo kann als „Erledigt" markiert werden. |
| A-2.5 | Wird die Zeiterfassung eines bereits erledigten Todos erneut gestartet, hebt die Anwendung den Erledigt-Status automatisch auf. Das Todo wird wieder aktiv und landet erneut in dem zuvor definierten Todo-Pool. |

**Nachtrag — A-2.6.** Ein Todo trägt zusätzlich das Feld `callNumber`. Es nimmt die Nummer auf,
die das Outlook-Add-in per konfigurierbarem regulärem Ausdruck aus der E-Mail erkennt, und ist
die Standardquelle für das Exportfeld `Call` (siehe Abschnitt 8). Das Feld darf leer bleiben;
eine Buchung ohne Call-Nummer ist exportierbar, sofern die gewählte Exportvorlage das zulässt.

---

## 3. Todo-Pools

| ID | Anforderung |
|---|---|
| A-3.1 | Todos lassen sich Pools zuordnen. |
| A-3.2 | Ein Pool kann über ein bestimmtes Tag definiert werden. |
| A-3.3 | Die Oberfläche erlaubt es, Pools flexibel zu konfigurieren und Todos danach zu organisieren und zu filtern. |

**Nachtrag — A-3.4.** Pool-Zugehörigkeit ist abgeleitet, nicht gespeichert: Ein Todo gehört zu
einem Pool, weil seine Tags der Pool-Regel entsprechen. Das ist die Voraussetzung dafür, dass
A-2.5 funktioniert — nach dem Aufheben von „Erledigt" landet das Todo automatisch wieder in
seinem Pool, ohne dass eine Zuordnung zwischengespeichert werden muss.

---

## 4. Tags und Ordner

| ID | Anforderung |
|---|---|
| A-4.1 | Benutzer können unbegrenzt viele Tags anlegen. |
| A-4.2 | Für Tags lassen sich Ordner anlegen; Tags werden darin organisiert. |
| A-4.3 | Die Ordnerstruktur darf beliebig tief verschachtelt werden (Ordner → Unterordner → Unterordner → Unterordner → Tag). |
| A-4.4 | Navigation und Verwaltung dieser Struktur bleiben trotzdem übersichtlich. |
| A-4.5 | Tags dienen unter anderem für: Projekte, Kunden, Aufgabenarten, Abteilungen, Prioritäten, Todo-Pools und weitere individuelle Kategorien. |

**Nachtrag — A-4.6.** Zyklen in der Ordnerhierarchie sind unzulässig. Ein Ordner darf weder sich
selbst noch einen seiner Vorfahren als übergeordneten Ordner haben. Die Anwendung verhindert
das beim Verschieben.

---

## 5. Kanban-Board

| ID | Anforderung |
|---|---|
| A-5.1 | Die Anwendung enthält ein Kanban-Board. |
| A-5.2 | Todos lassen sich per Drag & Drop zwischen Status-Spalten verschieben. |
| A-5.3 | Beispielspalten: Backlog, In Progress, Waiting, Done. |
| A-5.4 | Die Statusstruktur ist konfigurierbar. |
| A-5.5 | Ein Todo lässt sich direkt aus dem Board öffnen und bearbeiten. |
| A-5.6 | Der Time-Tracker lässt sich direkt aus einem Todo beziehungsweise aus einer Kanban-Karte starten und stoppen. |

---

## 6. Zeiterfassung

| ID | Anforderung |
|---|---|
| A-6.1 | Für jedes Todo lässt sich Arbeitszeit erfassen. |
| A-6.2 | Ein Benutzer kann einen Timer starten und stoppen. |
| A-6.3 | Ein Todo kann mehrere einzelne Zeitbuchungen besitzen. |
| A-6.4 | Jede Zeitbuchung enthält mindestens: Startzeit, Endzeit, Dauer, Exportstatus, Notiz. |
| A-6.5 | Eine Zeitbuchung ist eindeutig als „noch nicht exportiert" oder „bereits exportiert" gekennzeichnet. |
| A-6.6 | Es ist jederzeit erkennbar, welche Arbeitszeiten bereits an das Abrechnungstool übertragen wurden und welche noch offen sind. |
| A-6.7 | Die Oberfläche unterscheidet diese beiden Zustände visuell klar. |

**Nachtrag — A-6.8.** Es läuft höchstens ein Timer gleichzeitig. Wird ein Timer gestartet,
während ein anderer läuft, stoppt die Anwendung den laufenden und fragt vorher nach.

**Nachtrag — A-6.9.** Der Exportstatus einer Buchung ist zweiwertig, nie leer und nie
mehrdeutig. Eine bereits exportierte Buchung ist nicht mehr bearbeitbar, solange ihr
Exportstatus nicht ausdrücklich zurückgesetzt wird.

---

## 7. Notizen

| ID | Anforderung |
|---|---|
| A-7.1 | Jedes Todo besitzt eine persönliche Notiz. |
| A-7.2 | Diese Notiz ist ausschließlich innerhalb der Anwendung sichtbar und wird nicht automatisch an das Abrechnungstool übertragen. |
| A-7.3 | Jede einzelne Zeitbuchung besitzt ein eigenes Notizfeld für das, was im entsprechenden Zeitraum erledigt wurde. Beispiel: „Fehleranalyse im Backend durchgeführt und API-Response angepasst." |
| A-7.4 | Die Notiz der Zeitbuchung wird beim Export an das Abrechnungstool übertragen. |

Die Trennung aus A-7.2 und A-7.4 ist eine Datenschutzgrenze und wird ausdrücklich getestet:
Die Todo-Notiz darf in keinem Exportergebnis auftauchen.

---

## 8. Export an das Abrechnungstool

| ID | Anforderung |
|---|---|
| A-8.1 | Die Anwendung exportiert erfasste, noch nicht exportierte Zeitbuchungen als JSON. |
| A-8.2 | Das Standardformat enthält die Werte `Call`, `Zeit`, `Notiz` und `WindowsUser`. |
| A-8.3 | `Zeit` wird in Schritten von 0,25 exportiert: 1,00 = 60 Minuten, 0,75 = 45 Minuten, 0,50 = 30 Minuten, 0,25 = 15 Minuten. |
| A-8.4 | `Notiz` wird vor dem Export als Base64 kodiert. Die Eingabe ist UTF-8. |
| A-8.5 | Der Windows-Benutzername wird mitübertragen. |
| A-8.6 | Die Oberfläche stellt deutlich dar, welche Zeitbuchungen bereits exportiert wurden und welche noch exportiert werden müssen. |

Beispielstruktur:

```json
{
  "Call": "...",
  "Zeit": 1.25,
  "Notiz": "...",
  "WindowsUser": "..."
}
```

**Nachtrag — A-8.7, konfigurierbare Exportvorlagen.** Die Struktur aus A-8.2 ist die mitgelieferte
Standardvorlage, nicht die einzig mögliche. Der Benutzer kann in der Anwendung festlegen, welche
Felder exportiert werden. Eine Exportvorlage ist eine geordnete Liste von Feldern:

```
Feld = {
  name            frei wählbarer Schlüssel im JSON, z. B. "Call"
  quelle          Pfad auf die Daten, z. B. todo.callNumber | buchung.notiz
                  | buchung.dauer | system.windowsUser | todo.tags
  transformation  roh | base64 | runde_auf_viertelstunde | datum(format) | konstante
  bedingung       optional; Feld wird nur ausgegeben, wenn erfüllt
}
```

Die Standardvorlage bildet A-8.2 bis A-8.5 exakt ab und ist nicht löschbar, aber kopierbar. Der
Vorlageneditor zeigt eine Live-Vorschau auf tatsächlich offenen Buchungen.

**Nachtrag — A-8.8.** Der Export läuft als Transaktion: Entweder wird die Datei geschrieben und
alle enthaltenen Buchungen werden als exportiert markiert, oder es passiert nichts. Ein Abbruch
mitten im Vorgang darf keine Buchung in einem Zwischenzustand hinterlassen.

**Nachtrag — A-8.9.** Base64 ist eine Kodierung, keine Verschlüsselung. Die Exportdatei enthält
Kundendaten im Klartextäquivalent und wird entsprechend behandelt.

---

## 9. Standard-Tags

| ID | Anforderung |
|---|---|
| A-9.1 | Eine Einstellung legt fest, welche Tags bei einem neu erstellten Todo automatisch gesetzt werden. |
| A-9.2 | Beispiel: „Intern", „Todo", „Nicht abgerechnet". |
| A-9.3 | Beim Erstellen eines neuen Todos werden diese Tags automatisch hinzugefügt. |
| A-9.4 | Die Standard-Tags sind jederzeit in den Einstellungen anpassbar. |

**Nachtrag — A-9.5.** Standard-Tags greifen bei jedem Weg, auf dem ein Todo entsteht, also auch
beim Anlegen aus dem Outlook-Add-in heraus.

---

## 10. Outlook-Add-in

| ID | Anforderung |
|---|---|
| A-10.1 | Zusätzlich zur Haupt-Anwendung gibt es ein Outlook-Add-in. |
| A-10.2 | Ziel ist das Anlegen eines neuen Todos direkt aus Outlook. |
| A-10.3 | Das Add-in kommuniziert über eine API mit der Todo-Anwendung. |
| A-10.4 | Beim Öffnen beziehungsweise Anlegen eines Todos ruft das Add-in die vorhandene Tag- und Ordnerstruktur über die API ab. |
| A-10.5 | Der Benutzer kann aus Outlook heraus: ein neues Todo anlegen, Tags auswählen, verschachtelte Tag-Ordner durchsuchen, relevante Informationen aus der E-Mail übernehmen und weitere Todo-Einstellungen vornehmen. |
| A-10.6 | Das Add-in fügt sich optisch und funktional in Outlook ein und passt gleichzeitig zum Design der Hauptanwendung. |
| A-10.7 | Die Referenzbilder dienen nur als Anregung; das Design wird daraus eigenständig und konsistent zur Hauptanwendung entwickelt. |

**Nachtrag — A-10.8.** Das Add-in erkennt die Call-Nummer über einen regulären Ausdruck, der in
den Add-in-Einstellungen konfigurierbar ist und nicht im Code steht.

**Nachtrag — A-10.9.** Existiert bereits ein Todo mit derselben Call-Nummer, bietet das Add-in
an, auf dieses vorhandene Todo zu buchen, statt ein Duplikat anzulegen. Die Entscheidung trifft
der Benutzer; das Add-in legt nicht stillschweigend an oder zusammen.

**Nachtrag — A-10.10.** Die Referenzbilder aus dem Originalauftrag liegen nicht vor. Bis sie
nachgereicht werden, gestaltet sich das Add-in allein aus dem Designsystem der Hauptanwendung.

---

## 11. Pflicht-Screens

Das UI-Konzept umfasst mindestens diese Ansichten:

| ID | Screen |
|---|---|
| S-01 | Dashboard / Startseite |
| S-02 | Todo-Liste |
| S-03 | Todo-Detailansicht |
| S-04 | Kanban-Board |
| S-05 | Time-Tracking-Ansicht |
| S-06 | Übersicht aller Zeitbuchungen |
| S-07 | Export-Ansicht |
| S-08 | Tag- und Ordnerverwaltung |
| S-09 | Einstellungen |
| S-10 | Verwaltung der Standard-Tags |
| S-11 | Todo-Pool-Konfiguration |
| S-12 | Outlook-Add-in |
| S-13 | Einstellungen des Outlook-Add-ins |

**Nachtrag — S-14.** Editor für Exportvorlagen. Folgt aus A-8.7 und hat im Originalauftrag noch
keine Entsprechung, weil dort die Exportstruktur fest war.

---

## 12. Dashboard

Das Dashboard gibt schnellen Überblick über die wichtigsten Informationen, zum Beispiel:
aktuell laufender Timer, heute erfasste Arbeitszeit, noch nicht exportierte Zeiten, erledigte
Todos, offene Todos, aktuelle Projekte beziehungsweise Tags, zuletzt bearbeitete Todos.

Wichtige Aktionen sind möglichst direkt vom Dashboard aus ausführbar.

---

## 13. UX-Anforderungen

| ID | Anforderung |
|---|---|
| A-13.1 | Schnell erfassbar. |
| A-13.2 | Wenig visuelle Unordnung. |
| A-13.3 | Komplexe Tag-Hierarchien verständlich dargestellt. |
| A-13.4 | Zeiterfassung prominent, aber nicht störend integriert. |
| A-13.5 | Exportstatus eindeutig visualisiert. |
| A-13.6 | Drag & Drop unterstützt. |
| A-13.7 | Globale Suche und Filter. |
| A-13.8 | Responsiv aufgebaut. |
| A-13.9 | Auf Desktop-Nutzung optimiert. |

Moderne SaaS-Designprinzipien, klare Typografie, konsistente Abstände, verständliche Icons,
hochwertiges UI-System.

---

## 14. Navigation

Logische globale Navigation, beispielsweise: Dashboard, Todos, Kanban, Time Tracking, Export,
Tags, Einstellungen. Die Navigation ist jederzeit sichtbar und leicht verständlich.

---

## 15. Designrichtung

Wirkung wie ein professionelles, modernes B2B-SaaS-Produkt. Ziele: modern, minimalistisch,
hochwertig, funktional, übersichtlich, professionell, informationsreich ohne Überladung.

Karten, Panels, Tabellen, Status-Badges, Filter, Dropdowns und Kontextmenüs dort einsetzen, wo
sie sinnvoll sind. Der Funktionsumfang darf nicht zu einer überladenen Oberfläche führen.

Verlangt sind ausdrücklich auch: sinnvolle Empty States, Loading States, Hover States, aktive
Zustände, Fehlermeldungen und Bestätigungsdialoge.

---

## 16. Interaktionen und Zustände

Für jede dieser Interaktionen sind passende UI-Zustände und Rückmeldungen zu zeigen:

| ID | Interaktion |
|---|---|
| I-01 | Todo erstellen |
| I-02 | Todo bearbeiten |
| I-03 | Todo als erledigt markieren |
| I-04 | Time-Tracker starten und stoppen |
| I-05 | Erledigtes Todo durch erneutes Starten des Timers wieder aktiv setzen |
| I-06 | Tags hinzufügen und entfernen |
| I-07 | Tags in Ordner verschieben |
| I-08 | Ordner verschachteln |
| I-09 | Zeitbuchungen als exportiert markieren |
| I-10 | Zeitbuchungen filtern |
| I-11 | Daten exportieren |
| I-12 | Standard-Tags konfigurieren |
| I-13 | Todo-Pools konfigurieren |
| I-14 | Todos per Drag & Drop verschieben |

**Nachtrag — I-15.** Exportvorlage anlegen, bearbeiten und in der Vorschau prüfen.

---

## 17. Ziel

Ein durchgängiges, realistisches Produktdesign mit konsistentem Designsystem und klarer
Informationsarchitektur. Die Anwendung soll sich wie ein tatsächlich entwickeltes
professionelles Produkt anfühlen, nicht wie eine Demo. Priorität hat eine exzellente
Desktop-Erfahrung, weil die Anwendung primär für produktives Arbeiten am PC gedacht ist.

---

## Anhang A — Was nicht vorliegt

- Der klickbare Framer-Prototyp (`docs/prototype/takt-ui-konzept.html`). Bis er nachgereicht
  wird, ist diese Spezifikation zusammen mit dem Designsystem aus Aufgabe T-006 die verbindliche
  Referenz.
- Die zwei Referenzbilder für das Outlook-Add-in aus Abschnitt 10.
