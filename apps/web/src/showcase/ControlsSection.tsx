import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Icon } from "../components/Icon";
import { Menu, type MenuEntry } from "../components/Menu";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  InlineMessage,
  LoadingBlock,
  Skeleton,
  Spinner,
  Toolbar,
  type ButtonVariant,
} from "../components/Primitives";
import { Select, type SelectEntry } from "../components/Select";
import { TextField } from "../components/FormDialog";
import { Section, SubHeading } from "./Section";

const SAMPLE_OPTIONS = [
  { value: "alle", label: "Alle Exportstände" },
  { value: "offen", label: "Offen" },
  { value: "exportiert", label: "Exportiert" },
] as const;

/**
 * Gruppierte Optionen — seit T-059 die Stelle, an der `<optgroup>` stand.
 *
 * Die zweite Zeile eines Eintrags ist neu: Im nativen `<option>` gab es sie
 * nicht, und ohne sie musste jede Erklaerung in die Beschriftung selbst.
 */
const GROUPED_OPTIONS: readonly SelectEntry[] = [
  {
    kind: "group",
    label: "Buchung",
    options: [
      { value: "entry.callNumber", label: "Call-Nummer", hint: "Aus dem Todo der Buchung." },
      { value: "entry.note", label: "Leistung", hint: "Was abgerechnet wird (A-7.3)." },
    ],
  },
  {
    kind: "group",
    label: "Tagesgruppe",
    options: [
      { value: "group.quarters", label: "Gerundete Zeit", hint: "Viertelstunden nach E-008." },
      { value: "group.day", label: "Kalendertag", hint: "Tag des Timerstarts (E-025)." },
      { value: "group.sealed", label: "Vermerk", hint: "Nicht wählbar (A-7.2).", disabled: true },
    ],
  },
];

const VARIANTS: readonly ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];

const DEMO_MENU: readonly MenuEntry[] = [
  { id: "new", label: "Neues Todo", icon: "plus", shortcut: "Strg+N", onSelect: () => undefined },
  { id: "export", label: "Export starten", icon: "download", shortcut: "Strg+E", onSelect: () => undefined },
  { kind: "separator", id: "sep" },
  {
    id: "locked",
    label: "Buchung bearbeiten",
    icon: "pencil",
    disabled: true,
    disabledReason: "Gesperrt, weil bereits exportiert",
    onSelect: () => undefined,
  },
  { id: "delete", label: "Löschen", icon: "trash", tone: "danger", onSelect: () => undefined },
];

export function ControlsSection() {
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<"none" | "default" | "danger">("none");
  const [sample, setSample] = useState<"alle" | "offen" | "exportiert">("alle");
  const [grouped, setGrouped] = useState("entry.callNumber");
  const [text, setText] = useState("Nord AG — Rollout Standort 3");

  return (
    <Section
      id="bausteine"
      title="9 — Bedienelemente und Zustände"
      lead="Jeder Baustein wird in allen Zuständen gezeigt: normal, unter dem Zeiger, gedrückt, fokussiert, deaktiviert, ladend und fehlerhaft. Der Fokusring ist überall sichtbar und liegt außerhalb des Elements, damit ihn nichts verdeckt."
      refs={["Abschnitt 15", "Abschnitt 16"]}
    >
      <Card
        title="Knöpfe"
        description="Vier Ausprägungen, drei Größen. Pro Ansicht gibt es genau eine Primäraktion. Mit dem Tabulator durchgehen, um den Fokusring zu prüfen."
      >
        {VARIANTS.map((variant) => (
          <div className="demo-row" key={variant} style={{ marginBottom: "var(--space-3)" }}>
            <span className="demo-label">{variant}</span>
            <Button variant={variant} size="sm">
              Klein
            </Button>
            <Button variant={variant}>Standard</Button>
            <Button variant={variant} size="lg" iconStart="plus">
              Groß mit Symbol
            </Button>
            <Button variant={variant} loading>
              Lädt
            </Button>
            <Button variant={variant} disabled>
              Deaktiviert
            </Button>
          </div>
        ))}

        <SubHeading>Symbolknöpfe — Klickfläche mindestens 28 mal 28 Pixel</SubHeading>
        <div className="demo-row">
          <IconButton label="Bearbeiten" icon="pencil" />
          <IconButton label="Löschen" icon="trash" variant="danger" />
          <IconButton label="Timer starten" icon="play" variant="secondary" />
          <IconButton label="Nicht verfügbar" icon="lock" disabled />
        </div>
      </Card>

      <Card
        title="Formularfelder"
        description="Eingabefeld und Auswahlfeld teilen sich Höhe, Radius, Innenabstand und Schriftgröße. Sie sollen nebeneinanderstehen können, ohne dass man sieht, dass es zwei Bausteine sind."
      >
        <SubHeading>Drei Höhen — dieselben wie beim Knopf: 28, 32, 36 Pixel</SubHeading>
        <div className="demo-row" style={{ alignItems: "flex-end" }}>
          <Select label="Klein" size="sm" value={sample} onChange={setSample} options={SAMPLE_OPTIONS} />
          <Select label="Standard" value={sample} onChange={setSample} options={SAMPLE_OPTIONS} />
          <Select label="Groß" size="lg" value={sample} onChange={setSample} options={SAMPLE_OPTIONS} />
          <Button size="lg" iconStart="filter">
            Filtern
          </Button>
        </div>

        <SubHeading>
          Die aufgeklappte Liste gehört jetzt Takt und nicht mehr dem Betriebssystem
        </SubHeading>
        <p className="demo-note">
          Bis T-057 war das ein natives <code>&lt;select&gt;</code>. Ein Browser lässt seine
          aufgeklappte Liste nicht gestalten — sie erschien in der Schrift des Betriebssystems,
          mitten in einer gesetzten Oberfläche. Seit T-059 liefert Ark UI das Verhalten
          (Tastatur, Anschreiben, Vorlesehilfe, Umklappen am Bildschirmrand), und das Aussehen
          kommt aus denselben Token wie alles andere (E-052). Klappen Sie eine der Listen auf und
          vergleichen Sie mit der Zeile darüber.
        </p>
        <p className="demo-note">
          Der Pfeil liegt weiterhin in derselben Rasterzelle wie das Feld und wird darin ans
          hintere Ende gerückt — er kann nicht davonlaufen, wenn das Feld gedehnt wird. Aufgeklappt
          dreht er sich: ein zweites Merkmal neben der Rahmenfarbe, das ohne Farbwahrnehmung
          auskommt.
        </p>
        <div className="stack" style={{ gap: "var(--space-3)", maxWidth: "26rem" }}>
          <Select
            label="Über die volle Breite"
            value={sample}
            onChange={setSample}
            options={SAMPLE_OPTIONS}
            hint="Der Hinweis bleibt stehen — anders als ein Platzhalter."
          />
          <Select
            label="Mit Gruppen, Zusatzzeile und einem gesperrten Eintrag"
            value={grouped}
            onChange={setGrouped}
            options={GROUPED_OPTIONS}
            hint="Gruppen ersetzen das frühere <optgroup>; die zweite Zeile gab es dort nicht."
          />
          <Select
            label="Fehlerhaft"
            value={sample}
            onChange={setSample}
            options={SAMPLE_OPTIONS}
            invalid
            hint="Die Kontur trägt Zustand und wird deshalb gegen 3:1 gemessen (SC 1.4.11)."
          />
          <Select
            label="Gesperrt"
            value={sample}
            onChange={setSample}
            options={SAMPLE_OPTIONS}
            disabled
          />
          <Select
            label="Leere Liste"
            value=""
            onChange={() => undefined}
            options={[]}
            placeholder="Nichts zur Auswahl"
            hint="Auch der Leerzustand sagt etwas, statt eine leere Fläche zu zeigen."
          />
        </div>

        <SubHeading>Eingabefeld in allen Zuständen aus Abschnitt 15</SubHeading>
        <div className="grid grid--2">
          <TextField label="Normal" value={text} onChange={setText} />
          <TextField
            label="Mit Hilfetext"
            value={text}
            onChange={setText}
            hint="Steht dauerhaft unter dem Feld."
          />
          <TextField
            label="Fehlerhaft"
            value=""
            onChange={() => undefined}
            required
            error="Ein Titel ist Pflicht. Ohne ihn lässt sich das Todo später nicht wiederfinden."
          />
          <TextField label="Gesperrt" value="Nicht änderbar" onChange={() => undefined} disabled />
        </div>
      </Card>

      <div className="grid grid--2">
        <Card
          title="Auswahlliste und Kontextmenü"
          description="Beide nutzen dieselbe Liste: Pfeiltasten, Pos1 und Ende, Eingabe, Escape. Gesperrte Einträge nennen den Grund, statt zu verschwinden."
        >
          <Toolbar label="Beispielaktionen">
            <Menu
              trigger={
                <>
                  Aktionen
                  <Icon name="chevron-down" size={14} />
                </>
              }
              entries={DEMO_MENU}
              triggerClassName="btn btn--secondary btn--sm"
            />
            <Menu
              trigger={<Icon name="more-horizontal" size={16} />}
              triggerLabel="Weitere Aktionen"
              entries={DEMO_MENU}
              align="end"
            />
            <span className="muted" style={{ fontSize: "var(--text-xs)" }}>
              Ein Kontextmenü an der Zeigerposition zeigt Abschnitt 3 in der Tabelle.
            </span>
          </Toolbar>
        </Card>

        <Card
          title="Bestätigungsdialoge"
          description="Der Dialog sagt, was passiert, nicht ob man sicher ist. Beim folgenreichsten Fall kommt eine ausdrückliche Bestätigung dazu."
        >
          <div className="demo-row">
            <Button variant="secondary" onClick={() => setDialog("default")}>
              Normaler Dialog
            </Button>
            <Button variant="danger" onClick={() => setDialog("danger")}>
              Folgenreicher Dialog
            </Button>
          </div>
        </Card>
      </div>

      <Card
        title="Ladezustände"
        description="Ab etwa 300 Millisekunden bekommt jede Aktion eine Rückmeldung. Platzhalterflächen belegen genau den Platz des späteren Inhalts, damit nichts springt."
      >
        <div className="demo-row" style={{ marginBottom: "var(--space-4)" }}>
          <span className="demo-label">Anzeiger</span>
          <Spinner size={16} label="Lädt" />
          <Button variant="primary" loading={loading} onClick={() => setLoading((value) => !value)}>
            Export starten
          </Button>
          <span className="muted" style={{ fontSize: "var(--text-xs)" }}>
            Knopf umschalten, um den Ladezustand zu sehen.
          </span>
        </div>
        <div className="demo-row" style={{ marginBottom: "var(--space-4)" }}>
          <span className="demo-label">Platzhalter</span>
          <div className="stack" style={{ gap: "var(--space-2)", flex: "1 1 18rem" }}>
            <Skeleton width="60%" height="1.25rem" />
            <Skeleton width="90%" />
            <Skeleton width="40%" />
          </div>
        </div>
        <LoadingBlock label="Liste wird geladen" rows={2} />
      </Card>

      <div className="grid grid--2">
        <Card title="Meldungen" description="Fehler werden Hilfsmitteln sofort angesagt, alles andere höflich.">
          <div className="stack" style={{ gap: "var(--space-3)" }}>
            <InlineMessage tone="info" title="Standardvorlage aktiv">
              Der Export nutzt die mitgelieferte Vorlage mit Call, Zeit, Notiz (dort steht die
              Leistung der Buchung) und WindowsUser.
            </InlineMessage>
            <InlineMessage tone="success" title="Export abgeschlossen">
              12 Buchungen übertragen und als exportiert markiert.
            </InlineMessage>
            <InlineMessage tone="warning" title="Base64 ist keine Verschlüsselung">
              Die Exportdatei enthält die Leistungstexte im Klartextäquivalent. Legen Sie sie
              entsprechend ab.
            </InlineMessage>
            <InlineMessage
              tone="danger"
              title="Exportordner nicht beschreibbar"
              action={
                <>
                  <Button variant="secondary" size="sm">
                    Anderen Ordner wählen
                  </Button>
                  <Button variant="ghost" size="sm">
                    Erneut versuchen
                  </Button>
                </>
              }
            >
              Auf den eingestellten Ordner kann nicht geschrieben werden. Es wurde nichts
              exportiert und keine Buchung verändert.
            </InlineMessage>
          </div>
        </Card>

        <Card
          title="Leerzustände"
          description="Ein leerer Bereich sagt, warum er leer ist und was als Nächstes zu tun ist — nie nur „Keine Daten“."
        >
          <div className="stack" style={{ gap: "var(--space-4)" }}>
            <EmptyState
              icon="inbox"
              title="Noch kein Todo angelegt"
              description="Legen Sie Ihr erstes Todo an, oder erzeugen Sie eines direkt aus einer E-Mail im Outlook-Add-in."
              action={
                <Button variant="primary" iconStart="plus">
                  Todo anlegen
                </Button>
              }
              compact
            />
            <EmptyState
              icon="download"
              title="Nichts zu exportieren"
              description="Alle erfassten Zeiten sind bereits an das Abrechnungstool übertragen."
              compact
            />
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={dialog === "default"}
        title="Spalte entfernen?"
        description="Die Spalte „Wartet“ wird aus dem Board entfernt."
        consequence="Die vier Todos in dieser Spalte wandern nach „Backlog“. Es geht nichts verloren."
        confirmLabel="Entfernen"
        onCancel={() => setDialog("none")}
        onConfirm={() => setDialog("none")}
      />

      <ConfirmDialog
        open={dialog === "danger"}
        tone="danger"
        title="Todo endgültig löschen?"
        description="Das Todo und alle 7 zugehörigen Zeitbuchungen werden gelöscht."
        consequence="Zwei dieser Buchungen wurden bereits exportiert. Die Abrechnung beim Kunden bleibt bestehen, der Nachweis in Takt aber nicht."
        acknowledgeLabel="Ich habe verstanden, dass der Nachweis der bereits abgerechneten Zeiten verloren geht."
        confirmLabel="Endgültig löschen"
        onCancel={() => setDialog("none")}
        onConfirm={() => setDialog("none")}
      />
    </Section>
  );
}
