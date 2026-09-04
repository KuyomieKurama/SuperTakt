import { useState } from "react";
import { Card, EmptyState, Button } from "../components/Primitives";
import { TagChip, TagPath } from "../components/Tag";
import { TagCombobox } from "../components/TagInput";
import { TagTree, type TagTreeNode } from "../components/TagTree";
import type { TagInfo } from "../app/StructureContext";
import { TAG_TREE } from "./data";
import { Section, SubHeading } from "./Section";

/**
 * Beispieltags fuer die Tag-Eingabe.
 *
 * Zwei davon heissen „Nord" und liegen in verschiedenen Ordnern — genau der
 * Fall aus A-4.4, an dem sich zeigt, ob die Vorschlagsliste den Ordnerpfad
 * mitfuehrt. Ohne ihn waeren die beiden in der Liste nicht auseinanderzuhalten.
 */
const DEMO_TAGS: readonly TagInfo[] = [
  ["t-support", "Support", []],
  ["t-intern", "Intern", []],
  ["t-backend", "Backend", []],
  ["t-hoch", "Hoch", ["Priorität"]],
  ["t-niedrig", "Niedrig", ["Priorität"]],
  ["t-nord", "Nord", ["Kunden"]],
  ["t-nord-standort", "Nord", ["Standorte"]],
  ["t-wartung", "Wartung", ["Kunden", "Nord", "Verträge"]],
].map(([id, name, path]) => ({
  tag: {
    id: String(id),
    folderId: null,
    name: String(name),
    color: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  path: path as readonly string[],
}));

const DEMO_DEFAULT_TAGS: ReadonlySet<string> = new Set(["t-intern"]);

const FILTER_TAGS = [
  { id: "support", label: "Support" },
  { id: "intern", label: "Intern" },
  { id: "hoch", label: "Hoch", path: ["Priorität"] },
  { id: "nord", label: "Musterkunde Nord", path: ["Kunden", "Nord"] },
] as const;

export function TagsSection() {
  const [selectedNode, setSelectedNode] = useState<TagTreeNode | null>(null);
  const [activeTags, setActiveTags] = useState<ReadonlySet<string>>(new Set(["intern"]));
  const [pickedTags, setPickedTags] = useState<readonly string[]>(["t-support", "t-nord"]);
  const [newTagNames, setNewTagNames] = useState<readonly string[]>(["Rufbereitschaft"]);
  const [filterTags, setFilterTags] = useState<readonly string[]>([]);

  const toggleTag = (id: string): void => {
    setActiveTags((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Section
      id="tags"
      title="8 — Tags und Ordner"
      lead="Die Ordnerstruktur darf beliebig tief sein. Damit sie trotzdem lesbar bleibt, rückt der Baum nur bis Ebene fünf ein; danach führt er die Ebene als kleines Präfix im Knoten mit. Ordner zeigen die Zahl der enthaltenen Tags, Tags die Zahl der Todos."
      refs={["S-08", "A-4.1", "A-4.2", "A-4.3", "A-4.4", "A-9.1", "I-06", "I-07", "I-08"]}
    >
      <div className="grid grid--2">
        <Card
          title="Ordnerbaum"
          description="Auswählen und Aufklappen sind zwei Dinge: Das Dreieck klappt auf und zu, der Name wählt aus — auch bei einem Ordner mit Inhalt. Tastatur: Pfeiltasten bewegen, Pfeil rechts klappt auf, Pfeil links zu, Eingabetaste wählt aus, Pos1 und Ende springen, Stern klappt alles auf. Der Baum hat genau einen Tabulator-Halt."
          flush
        >
          <div style={{ padding: "var(--space-2)" }}>
            <TagTree
              nodes={TAG_TREE}
              label="Tag-Ordner"
              selectedId={selectedNode?.id ?? null}
              onSelect={setSelectedNode}
              initiallyExpanded={["f-kunden", "f-kunden-nord", "f-prioritaet"]}
            />
          </div>
        </Card>

        <div className="stack" style={{ gap: "var(--space-4)" }}>
          <Card title="Ausgewählter Knoten">
            {selectedNode === null ? (
              <EmptyState
                compact
                icon="tag"
                title="Nichts ausgewählt"
                description="Wählen Sie links einen Tag oder einen Ordner. Ein Ordner mit Inhalt lässt sich genauso auswählen wie ein leerer — sonst wäre er über den Baum nicht zu benennen, zu verschieben oder zu löschen (A-4.2, A-4.4)."
              />
            ) : (
              <div className="stack" style={{ gap: "var(--space-3)" }}>
                <TagPath
                  segments={["Kunden", "Nord", "Verträge", "Laufzeit 2026", "Wartung", "Stufe 2", selectedNode.label]}
                />
                <div className="demo-row">
                  <TagChip label={selectedNode.label} tone="accent" />
                  <span className="muted" style={{ fontSize: "var(--text-sm)" }}>
                    {selectedNode.usageCount ?? 0} Todos verwenden diesen Tag
                  </span>
                </div>
                <div className="demo-row">
                  <Button variant="secondary" size="sm" iconStart="folder">
                    In anderen Ordner verschieben
                  </Button>
                  <Button variant="ghost" size="sm" iconStart="pencil">
                    Umbenennen
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card
            title="Tag-Chip"
            description="Der Chip zeigt bei Bedarf den Ordnerpfad als gedämpftes Präfix. Ohne ihn wäre „Nord“ aus zwei verschiedenen Ordnern nicht auseinanderzuhalten."
          >
            <SubHeading>Zustände</SubHeading>
            <div className="demo-row" style={{ marginBottom: "var(--space-4)" }}>
              <TagChip label="Support" />
              <TagChip label="Nord" path={["Kunden"]} />
              <TagChip label="Hoch" tone="warning" />
              <TagChip label="Nicht abgerechnet" tone="danger" />
              <TagChip label="Intern" isDefault />
              <TagChip label="Archiviert" disabled />
            </div>

            <SubHeading>Entfernbar am Todo</SubHeading>
            <div className="demo-row" style={{ marginBottom: "var(--space-4)" }}>
              <TagChip label="Support" onRemove={() => undefined} />
              <TagChip label="Musterwerk AG" path={["Kunden", "Süd"]} onRemove={() => undefined} />
            </div>

            <SubHeading>Als Filter, umschaltbar</SubHeading>
            <div className="demo-row">
              {FILTER_TAGS.map((tag) => (
                <TagChip
                  key={tag.id}
                  label={tag.label}
                  {...("path" in tag ? { path: tag.path } : {})}
                  selected={activeTags.has(tag.id)}
                  onToggle={() => toggleTag(tag.id)}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card
        title="Tag-Eingabe — eine für alle Stellen"
        description="Todo-Dialog, Standard-Tags, Regelformular und Todo-Filter benutzen denselben Baustein. Vorher waren es vier verschiedene Arten, ein Tag zu wählen — eine davon auf vierzig Tags gekappt, eine gar nicht vorhanden."
      >
        <SubHeading>Mit Auto-Vervollständigung und Anlegen</SubHeading>
        <p className="demo-note">
          Tippen Sie <code>no</code>: Beide „Nord“ erscheinen, unterschieden durch ihren
          Ordnerpfad. Tippen Sie einen Namen, den es nicht gibt — etwa <code>Eskalation</code> —,
          steht darunter <strong>abgetrennt</strong> das Angebot, ihn anzulegen: mit Pluszeichen
          statt Punkt, eigener Überschrift und einem Satz, der sagt, wo das Tag entsteht. Ein
          Vorschlag, der aussieht wie ein vorhandenes Tag und in Wahrheit ein neues anlegt, wäre
          die schlechteste Variante.
        </p>
        <p className="demo-note">
          Verglichen wird über <code>tagNameKey</code> aus <code>packages/domain</code> — dieselbe
          Regel, nach der der Dienst entscheidet, ob ein Name schon vergeben ist:{" "}
          <code>Backend</code> trifft <code>backend</code>, <code>Straße</code> trifft aber nicht{" "}
          <code>Strasse</code>. Mit einer eigenen Regel stünde hier „kein Treffer“ für ein Tag,
          das es gibt.
        </p>
        <div className="stack" style={{ gap: "var(--space-4)", maxWidth: "30rem" }}>
          <TagCombobox
            label="Tags"
            tags={DEMO_TAGS}
            defaultTagIds={DEMO_DEFAULT_TAGS}
            value={pickedTags}
            onChange={setPickedTags}
            allowCreate
            newNames={newTagNames}
            onNewNamesChange={setNewTagNames}
            hint="Das gestrichelte Chip mit dem Wort „neu“ gibt es noch nicht — es entsteht erst beim Speichern."
          />

          <TagCombobox
            label="Nur wählen, nicht anlegen"
            tags={DEMO_TAGS}
            value={filterTags}
            onChange={setFilterTags}
            placeholder="Nach Tag filtern …"
            hint="So steht sie in der Filterleiste und im Regelformular. Findet sich nichts, verweist die Liste auf die Tag-Verwaltung, statt still leer zu bleiben."
          />

          <TagCombobox
            label="Noch kein Tag angelegt"
            tags={[]}
            value={[]}
            onChange={() => undefined}
            hint="Leerzustand: Die Liste sagt, dass es nichts gibt, statt eine leere Fläche zu zeigen."
          />

          <TagCombobox
            label="Wird geladen"
            tags={[]}
            value={[]}
            onChange={() => undefined}
            loading
            hint="Das Feld bleibt stehen und ist gesperrt. Verschwände es, spränge das Formular beim Eintreffen der Daten."
          />

          <TagCombobox
            label="Gesperrt"
            tags={DEMO_TAGS}
            value={["t-support"]}
            onChange={() => undefined}
            disabled
            hint="Auch die Entfernen-Knöpfe der Chips sind gesperrt — ein halb bedienbares Feld wäre schlimmer als ein gesperrtes."
          />
        </div>
      </Card>
    </Section>
  );
}
