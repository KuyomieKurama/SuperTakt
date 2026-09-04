import { Card } from "../components/Primitives";
import { Section } from "./Section";

interface InventoryEntry {
  readonly name: string;
  readonly file: string;
  readonly purpose: string;
  readonly states: string;
  readonly screens: string;
  readonly built: boolean;
}

const INVENTORY: readonly InventoryEntry[] = [
  {
    name: "Knopf",
    file: "Primitives.tsx",
    purpose: "Aktion auslösen. Genau eine Primäraktion je Ansicht.",
    states: "normal · Zeiger · gedrückt · fokussiert · deaktiviert · ladend",
    screens: "alle",
    built: true,
  },
  {
    name: "Symbolknopf",
    file: "Primitives.tsx",
    purpose: "Aktion ohne Text, immer mit zugänglichem Namen.",
    states: "normal · Zeiger · gedrückt · fokussiert · deaktiviert",
    screens: "S-02 · S-04 · S-06 · S-08",
    built: true,
  },
  {
    name: "Karte / Panel",
    file: "Primitives.tsx",
    purpose: "Inhaltsblock mit Kopf, Körper und optionaler Fußzeile.",
    states: "normal · bündig ohne Innenabstand",
    screens: "alle",
    built: true,
  },
  {
    name: "Tabelle",
    file: "BookingTable.tsx",
    purpose: "Dichte Liste der Zeitbuchungen mit Auswahl, Sortierung und Zeilenmenü.",
    states: "normal · Zebrastreifen · Zeiger · ausgewählt · aktiv · exportiert getönt · gesperrt",
    screens: "S-06 · S-07 · S-03",
    built: true,
  },
  {
    name: "Status-Etikett Export",
    file: "ExportStatus.tsx",
    purpose:
      "Exportstand einer Buchung, überall eindeutig. Der Status hat zwei Werte, die Darstellung vier (E-032, E-050).",
    states:
      "offen · exportiert · erneut offen · nicht abgerechnet; je Größe klein und Standard, dazu nur Symbol",
    screens: "S-01 · S-03 · S-04 · S-05 · S-06 · S-07 · S-12",
    built: true,
  },
  {
    name: "Zustandspunkt Export",
    file: "ExportStatus.tsx",
    purpose: "Exportstand dort, wo für ein Etikett kein Platz ist.",
    states: "Ring · gefüllte Scheibe · Raute · waagerechter Balken",
    screens: "S-02 · S-04 · S-06",
    built: true,
  },
  {
    name: "Exportstand-Zusammenfassung",
    file: "Kanban.tsx",
    purpose: "Zählt die Buchungen eines Todos je Exportstand.",
    states: "mit Werten · leer",
    screens: "S-02 · S-03 · S-04",
    built: true,
  },
  {
    name: "Tag-Chip",
    file: "Tag.tsx",
    purpose: "Tag darstellen, entfernen oder als Filter umschalten.",
    states: "normal · mit Pfad · Standard-Tag · ausgewählt · entfernbar · deaktiviert · Zeiger · fokussiert",
    screens: "S-02 · S-03 · S-04 · S-08 · S-10 · S-11 · S-12",
    built: true,
  },
  {
    name: "Pfadanzeige",
    file: "Tag.tsx",
    purpose: "Vollständiger Ordnerpfad, ab fünf Ebenen in der Mitte gekürzt.",
    states: "kurz · gekürzt",
    screens: "S-08 · S-11 · S-12",
    built: true,
  },
  {
    name: "Baumansicht",
    file: "TagTree.tsx",
    purpose:
      "Beliebig tiefe Ordnerhierarchie navigieren und verwalten. Das Dreieck klappt auf und zu, der Name wählt aus — auch bei einem Ordner mit Inhalt.",
    states:
      "zu · offen · ausgewählt · fokussiert · Zeiger · Dreieck unter dem Zeiger · ab Ebene 6 mit Ebenenmarke",
    screens: "S-08 · S-11 · S-12",
    built: true,
  },
  {
    name: "Tagesgruppenliste der Exportvorschau",
    file: "ExportGroups.tsx",
    purpose:
      "Gliedert die Exportauswahl nach Todo und Kalendertag, klappt auf die einzelnen Buchungen auf und zeigt die Wirkung eines Ausschlusses auf die gerundete Zeit (E-020, E-031).",
    states: "zu · aufgeklappt · ausgewählt · Buchung ausgeschlossen · nicht exportierbar (E-034)",
    screens: "S-07",
    built: true,
  },
  {
    name: "Filterschalter",
    file: "FilterBar.tsx",
    purpose:
      "Zweistelliger Schalter in der Filterleiste, zuerst für „Erledigte Todos anzeigen“ (E-039).",
    states: "aus · ein · Zeiger · fokussiert · deaktiviert; mit und ohne Zusatz",
    screens: "S-02 · S-03 · S-06 · S-07",
    built: true,
  },
  {
    name: "Wert zu Beschriftung",
    file: "lib/labels.ts",
    purpose:
      "Keine Darstellung, sondern die eine Stelle, an der aus einem englischen Datenwert ein deutscher Oberflächentext wird (E-015, E-041).",
    states: "—",
    screens: "alle",
    built: true,
  },
  {
    name: "Filterleiste",
    file: "FilterBar.tsx",
    purpose: "Filter setzen und sichtbar halten, Treffer zählen.",
    states: "ohne Filter · mit Filterchips · Chip entfernen · alles zurücksetzen",
    screens: "S-02 · S-06 · S-07",
    built: true,
  },
  {
    name: "Suchfeld",
    file: "FilterBar.tsx",
    purpose: "Globale Suche und Suche innerhalb einer Ansicht.",
    states: "leer · gefüllt · Zeiger · fokussiert · suchend · deaktiviert",
    screens: "global · S-02 · S-06 · S-08",
    built: true,
  },
  {
    name: "Auswahlliste",
    file: "FilterBar.tsx",
    purpose: "Eine Option aus wenigen wählen. Baut auf dem nativen Element auf.",
    states: "normal · Zeiger · fokussiert · deaktiviert",
    screens: "S-06 · S-07 · S-09 · S-14",
    built: true,
  },
  {
    name: "Menü",
    file: "Menu.tsx",
    purpose: "Aktionsliste an einem Auslöser.",
    states: "zu · offen · Eintrag aktiv · Eintrag gesperrt mit Grund · destruktiv",
    screens: "S-02 · S-04 · S-06 · S-08",
    built: true,
  },
  {
    name: "Kontextmenü",
    file: "Menu.tsx",
    purpose: "Dieselbe Aktionsliste an der Zeigerposition; auch über Umschalt+F10.",
    states: "wie Menü",
    screens: "S-02 · S-04 · S-06 · S-08",
    built: true,
  },
  {
    name: "Exportordner-Feld",
    file: "ExportDirectoryField.tsx",
    purpose:
      "Den Exportordner im Systemdialog wählen statt tippen; im Browser bleibt das Textfeld als Rückfallweg (Befund S-04, B-5.1 Punkt 1).",
    states:
      "Anzeigeplatte mit Hülle · Textfeld ohne Hülle · Dialog offen · abgebrochen · Dialog nicht verfügbar · noch nicht übernommen · Ordnerzustand des Dienstes",
    screens: "S-09",
    built: true,
  },
  {
    name: "Ordnerbefund",
    file: "ExportDirectoryField.tsx",
    purpose:
      "Was an einem Pfad auffällt, mit Grund und Beleg. Erklärt, statt zu verbieten — abgewiesen wird nur, wohin nichts gehört, was Takt schreibt.",
    states: "abgewiesen · Rückfrage · Hinweis · nichts aufgefallen",
    screens: "S-07 · S-09",
    built: true,
  },
  {
    name: "Ordnermerkmale",
    file: "ExportDirectoryField.tsx",
    purpose:
      "Was das Betriebssystem über den Exportordner belegt (T-039) — und wo diese Prüfung endet. Eine leere Liste heißt „nichts belegt“, nie „unbedenklich“: ein zugeordnetes Netzlaufwerk sieht der Dienst nicht.",
    states:
      "UNC · Netzdateisystem · Synchronisierungsordner · Systemverzeichnis · nichts belegt · Ordner antwortet nicht",
    screens: "S-07 · S-09",
    built: true,
  },
  {
    name: "Benutzername des Arbeitsplatzes",
    file: "WorkstationFacts.tsx",
    purpose:
      "Unter welchem Namen abgerechnet wird (E-010, E-042). Er steht in jeder Exportzeile und kommt über einen abgesicherten Kanal vom Betriebssystem — eine Absicherung, die niemand nachsehen kann, wirkt nur, solange nichts schiefgeht.",
    states: "gemeldet · kein Name gemeldet",
    screens: "S-07 · S-09",
    built: true,
  },
  {
    name: "Ablageort des Bestandes",
    file: "WorkstationFacts.tsx",
    purpose:
      "Wo die Datei mit allen Todos, Buchungen und Vermerken liegt (R-13, E-018), samt Pfad zum Kopieren und Sicherungshinweis. Nicht einstellbar — deshalb Auskunft und keine Stufen.",
    states:
      "Pfad ohne Befund · Synchronisierungsordner · Netzfreigabe · Roaming-Profil · Temp-Ordner · Bestand im Arbeitsspeicher · kopiert · Kopieren fehlgeschlagen",
    screens: "S-09",
    built: true,
  },
  {
    name: "Statuszeile",
    file: "StatusSettings.tsx",
    purpose:
      "Ein Statuswert in der Verwaltung (A-5.4): Stelle, Name, Zahl der Todos, Standardwahl als Optionsgruppe, Verschieben, Umbenennen, Löschen. Der Grund einer Sperre steht in der Zeile, bevor jemand sie auslöst — nicht danach.",
    states:
      "frei · Standard für neue Todos · gesperrt, weil Todos darin stehen · gesperrt, weil Standard · gesperrt, weil letzter Status · zwei Gründe zugleich · Zählung läuft · Anzahl unbekannt · unter dem Zeiger",
    screens: "S-09",
    built: true,
  },
  {
    name: "Base64-Hinweis",
    file: "ExportDirectoryField.tsx",
    purpose:
      "Der stehende Satz, dass die Exportdatei lesbare Kundennotizen enthält (B-6.1 Punkt 1). In der Ansicht, nicht in einem Hilfetext.",
    states: "einer — er ist immer gleich und immer da",
    screens: "S-07 · S-09",
    built: true,
  },
  {
    name: "Exportzeile, zweispaltig",
    file: "ExportRowPanes.tsx",
    purpose:
      "Was in der Datei steht, gegen das, was es bedeutet — mit dem Base64-Satz und dem Verweis auf den Klartext (A-8.4, A-8.9, Befund C-02). Ein Baustein für beide Orte: die Vorlage prüfen und die Datei schreiben.",
    states:
      "Zeile vorhanden · Feld ohne Bedingung fehlt in der Zeile · Feld mit Base64 · Herkunft aus der Auswahlliste des Dienstes",
    screens: "S-07 · S-14",
    built: true,
  },
  {
    name: "Protokollzeile",
    file: "ExportAudit.tsx",
    purpose:
      "Ein Wechsel des Exportstatus als Beleg: wann, welche Buchung, welcher Vorgang, welcher Lauf, welche Begründung, wer (R-10, E-012, E-047).",
    states:
      "exportiert · zurückgesetzt · nicht abgerechnet; mit Begründung · ohne Begründung · ohne Lauf · Buchung nicht mehr auffindbar · Lauf nicht lesbar",
    screens: "S-07 (Protokoll) · S-03 · S-06 (im Verlaufsdialog)",
    built: true,
  },
  {
    name: "Vorgangs-Etikett",
    file: "ExportAudit.tsx",
    purpose:
      "Dieselben vier Erscheinungsbilder wie der Exportstatus, aber mit der Beschriftung des Vorgangs — im Protokoll steht, was geschah, nicht wo die Buchung heute steht.",
    states: "exportiert · zurückgesetzt · nicht abgerechnet; je Größe klein und Standard",
    screens: "S-07 (Protokoll) · S-03 · S-06",
    built: true,
  },
  {
    name: "Auskunftsdialog",
    file: "InfoDialog.tsx",
    purpose:
      "Modaler Dialog, der nichts fragt und nichts schreibt. Ein Bestätigungsknopf verspräche eine Handlung, die es nicht gibt.",
    states: "offen · geschlossen; mit zusätzlichem Weg hinaus · breit",
    screens: "S-03 · S-06",
    built: true,
  },
  {
    name: "Bestätigungsdialog",
    file: "ConfirmDialog.tsx",
    purpose: "Folgenreiche Aktion erklären und bestätigen lassen.",
    states: "normal · destruktiv · mit ausdrücklicher Bestätigung · arbeitend",
    screens: "S-03 · S-04 · S-06 · S-07 · S-08 · S-09",
    built: true,
  },
  {
    name: "Timer-Anzeige",
    file: "Timer.tsx",
    purpose: "Laufende und erfasste Zeit zeigen, starten und stoppen.",
    states: "angehalten · laufend · deaktiviert; je Größe klein, mittel, groß",
    screens: "global · S-01 · S-03 · S-04 · S-05",
    built: true,
  },
  {
    /*
      Bis T-108 stand hier „Wiederaufnahme-Hinweis" (`Timer.tsx`). Den Fall
      A-2.5/I-05 tragen in der Anwendung die Meldung und das
      Erledigt-Kennzeichen; die eigene Hinweisflaeche hat keine Ansicht je
      eingesetzt und ist mit W-9 entfallen. An ihre Stelle tritt hier der
      Baustein, der die Meldung wirklich zeigt — er fehlte in dieser
      Aufstellung, obwohl ihn jede Ansicht benutzt.
    */
    name: "Meldung mit Rückweg",
    file: "app/ToastContext.tsx",
    purpose:
      "Rückmeldung nach jeder Handlung (Abschnitt 16). Mit „Rückgängig“ bleibt sie stehen, bis jemand sie benutzt oder schließt — und sie wird auch nicht von jüngeren Meldungen verdrängt (SC 2.2.1).",
    states: "info · erfolg · warnung · fehler; mit Rückweg · ohne · gestapelt",
    screens: "global",
    built: true,
  },
  {
    name: "Erledigt-Kennzeichen",
    file: "DoneFlag.tsx",
    purpose:
      "Das Etikett an einer Zeile: erledigt, oder von einem Timerstart wieder geöffnet (A-2.5). Offen schweigt.",
    states: "erledigt · Erledigt aufgehoben · offen (kein Etikett)",
    screens: "S-01 · S-02 · S-03 · S-05",
    built: true,
  },
  {
    name: "Kanban-Spalte",
    file: "Kanban.tsx",
    purpose:
      "Eine Regel als Spalte (E-054), mit ihrer Regelzeile, dem Zähler und dem Spaltenmenü. Kein Ablageziel mehr: Welche Karte hier steht, entscheidet die Regel — über Tags, Status, „Erledigt“ und den Exportstatus (E-055).",
    states: "normal · leer, weil keine Karte die Regel trifft · leere Regel · mit erledigten Todos · mehr Karten vorhanden als geladen",
    screens: "S-04",
    built: true,
  },
  {
    name: "Kanban-Karte",
    file: "Kanban.tsx",
    purpose: "Todo im Board, mit Tags, Exportständen, Zeit und Timer-Knopf.",
    states: "normal · Zeiger · in Bewegung · Timer läuft · erledigt · Erledigt aufgehoben · fokussiert",
    screens: "S-04",
    built: true,
  },
  {
    name: "Vermerk- und Leistungsfeld",
    file: "NoteField.tsx",
    purpose: "Zwei Feldarten: Leistung geht in den Export, Vermerk bleibt in Takt (E-016).",
    states: "normal · Zeiger · fokussiert · fehlerhaft · gesperrt · deaktiviert · mit Zähler",
    screens: "S-03 · S-05 · S-06 · S-12",
    built: true,
  },
  {
    name: "Leerzustand",
    file: "Primitives.tsx",
    purpose: "Erklären, warum nichts da ist, und den nächsten Schritt anbieten.",
    states: "normal · kompakt · mit Aktion",
    screens: "alle Listen",
    built: true,
  },
  {
    name: "Ladezustand",
    file: "Primitives.tsx",
    purpose: "Platzhalter und Anzeiger, ohne dass der Inhalt springt.",
    states: "Anzeiger · Platzhalterfläche · Zeilenblock",
    screens: "alle Listen",
    built: true,
  },
  {
    /*
      „In der Ansicht" seit T-108: Der Nachbar oben heisst „Meldung mit
      Rückweg" und meint den Toast. Zwei Eintraege, die beide „Meldung"
      heissen, unterscheidet niemand — dieser hier steht **im** Inhalt, an der
      Stelle, auf die er sich bezieht, und bleibt beim Blaettern stehen.
    */
    name: "Meldung in der Ansicht",
    file: "Primitives.tsx",
    purpose: "Hinweis, Erfolg, Warnung, Fehler an Ort und Stelle — Fehler immer mit einem Weg hinaus.",
    states: "info · erfolg · warnung · fehler; schließbar",
    screens: "alle",
    built: true,
  },
  {
    name: "Werkzeugleiste",
    file: "Primitives.tsx",
    purpose: "Aktionsgruppe über einer Liste.",
    states: "normal",
    screens: "S-02 · S-04 · S-06 · S-08",
    built: true,
  },
  {
    name: "Kennzahlkachel",
    file: "— noch nicht gebaut",
    purpose: "Zahl mit Verlauf auf dem Dashboard, zum Beispiel „heute erfasst“.",
    states: "normal · ladend · leer",
    screens: "S-01",
    built: false,
  },
  {
    name: "Vorlagen-Editor",
    file: "— noch nicht gebaut",
    purpose: "Felder einer Exportvorlage ordnen, Quelle und Transformation wählen, Vorschau zeigen.",
    states: "normal · Feld in Bewegung · Vorschau leer · Vorschau fehlerhaft",
    screens: "S-14",
    built: false,
  },
  {
    name: "Seitennavigation",
    file: "— noch nicht gebaut",
    purpose: "Globale Navigation, immer sichtbar, mit aktivem Eintrag.",
    states: "normal · aktiv · eingeklappt",
    screens: "global",
    built: false,
  },
];

export function InventorySection() {
  const built = INVENTORY.filter((entry) => entry.built).length;

  return (
    <Section
      id="inventar"
      title="11 — Komponenteninventar"
      lead={`Welche Bausteine die 14 Ansichten brauchen, wofür sie da sind, welche Zustände sie kennen und wo sie vorkommen. ${built} von ${INVENTORY.length} sind auf dieser Seite tatsächlich gebaut; der Rest ist entworfen und folgt in Welle 2.`}
      refs={["Abschnitt 11", "Abschnitt 15", "Abschnitt 16"]}
    >
      <Card flush>
        <table className="statematrix inventory">
          <thead>
            <tr>
              <th scope="col">Baustein</th>
              <th scope="col">Zweck</th>
              <th scope="col">Zustände</th>
              <th scope="col">Vorkommen</th>
              <th scope="col">Stand</th>
            </tr>
          </thead>
          <tbody>
            {INVENTORY.map((entry) => (
              <tr key={entry.name}>
                <td>
                  {entry.name}
                  <br />
                  <code className="muted">{entry.file}</code>
                </td>
                <td>{entry.purpose}</td>
                <td>{entry.states}</td>
                <td>{entry.screens}</td>
                <td>{entry.built ? "gebaut" : "entworfen"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}
