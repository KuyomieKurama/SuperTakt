import { foreignText } from "../lib/foreign";
import { useCallback, useMemo, useState } from "react";
import { ExportAuditList } from "../components/ExportAudit";
import {
  ExportGroupList,
  type ExportGroupViewModel,
} from "../components/ExportGroups";
import { Button, Card, EmptyState, InlineMessage } from "../components/Primitives";
import { AUDIT_EVENT_DESCRIPTION, auditEventLabel } from "../app/exportAudit";
import { ROUNDING_MODE_LABEL } from "../lib/labels";
import { AUDIT_ROWS, EXPORT_GROUPS, exportGroupOutcome } from "./data";
import { Section, SubHeading } from "./Section";

/**
 * Abschnitt 4 der Musterseite — die Exportvorschau aus S-07.
 *
 * Sie zeigt die eine Stelle, an der aus erfasster Zeit ein Rechnungsbetrag
 * wird. Deshalb ist sie nach Tagesgruppen gegliedert (E-031) und nicht nach
 * Buchungen: Die Auswahl hat dieselbe Gliederung wie die Datei.
 */

/** Was aus einer Gruppe wird, wenn keine ihrer Buchungen enthalten ist. */
function includedIds(
  groupId: string,
  excluded: ReadonlySet<string>,
): readonly string[] {
  const group = EXPORT_GROUPS.find((candidate) => candidate.id === groupId);
  if (group === undefined) return [];
  return group.entries.filter((entry) => !excluded.has(entry.id)).map((entry) => entry.id);
}

export function ExportPreviewSection() {
  const [selectedGroupIds, setSelectedGroupIds] = useState<ReadonlySet<string>>(
    () => new Set(["g-1", "g-2"]),
  );
  const [expandedGroupIds, setExpandedGroupIds] = useState<ReadonlySet<string>>(
    () => new Set(["g-1"]),
  );
  const [excludedEntryIds, setExcludedEntryIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [announcement, setAnnouncement] = useState("");
  const [lastRun, setLastRun] = useState<string | null>(null);

  const models = useMemo<readonly ExportGroupViewModel[]>(
    () =>
      EXPORT_GROUPS.map((group) => {
        const included = group.entries
          .filter((entry) => !excludedEntryIds.has(entry.id))
          .map((entry) => entry.id);
        const outcome = exportGroupOutcome(group.id, included);
        return {
          group,
          excludedEntryIds,
          quarters: outcome.quarters,
          mergedNote: outcome.mergedNote,
          blockedReason: outcome.blockedReason,
        };
      }),
    [excludedEntryIds],
  );

  const exportable = models.filter(
    (model) => model.blockedReason === null && selectedGroupIds.has(model.group.id),
  );
  const blocked = models.filter((model) => model.blockedReason !== null);

  const onToggleGroup = useCallback((groupId: string) => {
    setSelectedGroupIds((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const onToggleExpanded = useCallback((groupId: string) => {
    setExpandedGroupIds((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  /**
   * Eine Buchung aus ihrer Tagesgruppe nehmen oder zurueckholen. Die gerundete
   * Zeit der Gruppe aendert sich dadurch sofort — genau das soll man hier
   * sehen (E-031). Die Ansage nennt den neuen Wert, damit die Wirkung auch
   * ohne Blick auf die Zahl ankommt.
   */
  const onToggleEntry = useCallback(
    (groupId: string, entryId: string) => {
      // Bewusst ohne Aktualisierungsfunktion: Der neue Zustand wird gebraucht,
      // um die Ansage zu bilden. Ein Seiteneffekt in einer Aktualisierungs-
      // funktion waere unrein und liefe im Strict Mode doppelt.
      const next = new Set(excludedEntryIds);
      const removing = !next.has(entryId);
      if (removing) next.add(entryId);
      else next.delete(entryId);

      const outcome = exportGroupOutcome(groupId, includedIds(groupId, next));
      const group = EXPORT_GROUPS.find((candidate) => candidate.id === groupId);
      setExcludedEntryIds(next);
      setAnnouncement(
        `${removing ? "Buchung ausgeschlossen" : "Buchung wieder aufgenommen"}. ` +
          `${foreignText(group?.todoTitle ?? "")} am ${group?.day ?? ""}: gerundete Exportzeit jetzt ${outcome.quarters} Stunden.`,
      );
    },
    [excludedEntryIds],
  );

  return (
    <Section
      id="export"
      title="4 — Exportvorschau nach Tagesgruppen"
      lead="Hier wird aus erfasster Zeit ein Rechnungsbetrag. Eine Exportzeile ist ein Todo an einem Kalendertag — nicht eine Buchung. Deshalb wählt man hier Gruppen aus, und deshalb lässt sich jede Gruppe aufklappen: Oben steht die Gliederung der Datei, darunter die erfasste Wirklichkeit."
      refs={["S-07", "A-8.1", "A-8.6", "E-008", "E-020", "E-025", "E-031", "E-034"]}
    >
      <InlineMessage tone="info" title="Was Sie hier ausprobieren sollten">
        Die erste Gruppe ist bereits aufgeklappt und enthält drei Buchungen mit 10, 20 und
        5 Minuten — zusammen 35 Minuten, gerundet <strong>0,75</strong>. Nehmen Sie die mittlere
        Buchung heraus: Es bleiben 15 Minuten, und die Gruppe fällt sofort auf{" "}
        <strong>0,25</strong>. Das ist die ganze Rundungsregel in einer Bewegung, und sie steht
        an der einzigen Stelle, an der sie jemanden Geld kostet.
      </InlineMessage>

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>

      <Card
        title="Offene Tagesgruppen"
        description="Gerundet wird auf die Summe je Todo und Kalendertag, nicht je Buchung (E-020). Maßgeblich ist der Tag, an dem der Timer gestartet wurde (E-025) — eine Buchung von 23:40 bis 00:20 zählt vollständig zum Starttag."
        actions={
          <span className="muted" style={{ fontSize: "var(--text-xs)" }}>
            Rundung: {ROUNDING_MODE_LABEL.up}, Minimum 0,25
          </span>
        }
        flush
      >
        {models.length === 0 ? (
          <EmptyState
            icon="download"
            title="Nichts zu exportieren"
            description="Alle erfassten Zeiten sind bereits an das Abrechnungstool übertragen."
          />
        ) : (
          <ExportGroupList
            models={models}
            selectedGroupIds={selectedGroupIds}
            expandedGroupIds={expandedGroupIds}
            onToggleGroup={onToggleGroup}
            onToggleExpanded={onToggleExpanded}
            onToggleEntry={onToggleEntry}
            onEditEntry={(_groupId, entryId) =>
              setAnnouncement(`Leistung der Buchung ${entryId} bearbeiten.`)
            }
          />
        )}
      </Card>

      {blocked.length > 0 ? (
        <InlineMessage
          tone="warning"
          title={`${blocked.length} ${blocked.length === 1 ? "Gruppe wird" : "Gruppen werden"} übersprungen`}
        >
          Eine Tagesgruppe ohne Leistung nimmt das Abrechnungstool nicht an. Sie hält den Export
          aber nicht auf: Die übrigen Gruppen laufen durch, die betroffene bleibt offen und
          erscheint beim nächsten Mal wieder (E-034). Die fehlende Leistung lässt sich hier
          direkt nachtragen — aufklappen und „Leistung nachtragen“.
        </InlineMessage>
      ) : null}

      {lastRun !== null ? (
        <InlineMessage tone="success" title="Export abgeschlossen" onDismiss={() => setLastRun(null)}>
          {lastRun}
        </InlineMessage>
      ) : null}

      <Card
        title="Auswahl exportieren"
        description="Der Export läuft als Transaktion: Entweder werden Datei und Exportstatus aller enthaltenen Buchungen zusammen geschrieben, oder es passiert nichts (A-8.8)."
        actions={
          <Button
            variant="primary"
            iconStart="download"
            disabled={exportable.length === 0}
            onClick={() =>
              setLastRun(
                `${exportable.length} ${exportable.length === 1 ? "Zeile" : "Zeilen"} geschrieben. ` +
                  (blocked.length === 0
                    ? "Alle ausgewählten Gruppen sind durchgelaufen."
                    : `${blocked.length} ${blocked.length === 1 ? "Gruppe bleibt" : "Gruppen bleiben"} offen und erscheinen beim nächsten Export wieder.`),
              )
            }
          >
            {exportable.length} {exportable.length === 1 ? "Zeile" : "Zeilen"} exportieren
          </Button>
        }
      >
        <p className="section__lead">
          <strong>Eine zurückgesetzte Buchung gehört selbstverständlich dazu.</strong> In der
          zweiten Gruppe steht eine Buchung mit dem Etikett „Erneut offen“ — aufklappen und
          nachsehen. Ihr Exportstatus ist <em>offen</em>, nicht „erneut offen“: Das Etikett hängt
          an einem eigenen Merkmal, nämlich daran, wie oft die Buchung schon in einem Exportlauf
          war (E-032). Sie zählt deshalb ganz normal in die Summe ihrer Tagesgruppe. Ein Filter,
          der „Erneut offen“ als eigenen Wert führen würde, hielte sie aus dem Export heraus — und
          genau das darf nicht passieren.
        </p>
      </Card>

      <SubHeading>Und danach: das Protokoll</SubHeading>

      <Card
        id="exportprotokoll"
        title="Exportprotokoll (R-10)"
        description="Jeder Wechsel eines Exportstatus, anhängend und unveränderlich. Es gibt keine Route, die eine dieser Zeilen ändert oder löscht."
      >
        <p className="section__lead">
          <strong>Warum es diese Ansicht überhaupt gibt.</strong> Zurücksetzen muss möglich sein
          (E-012) — verboten werden kann es nicht, ohne die Anwendung unbrauchbar zu machen.
          Die Maßnahme gegen R-10 ist deshalb keine Sperre, sondern Nachvollziehbarkeit: Die drei
          Zeilen unten gehören zu zwei Buchungen, und die oberen beiden zeigen genau den Fall, um
          den es geht — dieselbe Zeit wurde zurückgesetzt und danach ein zweites Mal exportiert.
          Wer das sieht, sieht die Doppelabrechnung.
        </p>

        <dl className="auditlegend">
          {(["exported", "reset", "not_billed"] as const).map((value) => (
            <div className="auditlegend__item" key={value}>
              <dt className="auditlegend__term">{auditEventLabel(value)}</dt>
              <dd className="auditlegend__text">{AUDIT_EVENT_DESCRIPTION[value]}</dd>
            </div>
          ))}
        </dl>

        <p className="section__lead">
          Das Etikett benutzt dieselben vier Erscheinungsbilder wie der Exportstatus — Haken,
          Pfeil zurück, durchgestrichener Kreis —, trägt aber die Beschriftung des{" "}
          <em>Vorgangs</em> und für Hilfsmittel das Wort „Vorgang“ davor. Im Protokoll steht, was
          geschah, nicht wo die Buchung heute steht. Die Randschiene wiederholt die Aussage an der
          Kante der Zeile: eine zweite Spur, die auch in Graustufen trägt.
        </p>

        <ExportAuditList
          models={AUDIT_ROWS}
          onOpenTodo={() => setAnnouncement("Todo dieser Protokollzeile öffnen.")}
        />
      </Card>
    </Section>
  );
}
