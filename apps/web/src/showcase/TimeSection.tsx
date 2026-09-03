import type { PoolMovement } from "@takt/domain";
import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button, Card, InlineMessage } from "../components/Primitives";
import { ReactivationNotice, TimerDisplay } from "../components/Timer";
import { Section, SubHeading } from "./Section";

/**
 * Die vier Bewegungen des Anlasses „Wiederoeffnen" (E-058, Wortlauttabelle).
 *
 * Erfundene Namen, wie ueberall auf dieser Seite. Der **Satz** dazu steht hier
 * nicht: Er entsteht in `poolMovementSentence` und wird von
 * `ReactivationNotice` geholt. Eine Musterseite, die den erwarteten Wortlaut
 * abschreibt, prueft nur sich selbst — hier steht deshalb die Eingabe, und
 * lesen laesst sich, was die Domaene daraus macht.
 *
 * `null` ist kein Fall dieser Tabelle: Beim Wiederoeffnen rechnet der Dienst
 * die Bewegung immer. `null` hiesse „nicht gerechnet", und dann bliebe die
 * Flaeche leer — zu sehen im Abschnitt darueber, sobald man den Knopf drueckt.
 */
const REOPEN_BOTH: PoolMovement = {
  appears: ["Intern"],
  enters: ["Intern"],
  leaves: ["Erledigt diese Woche"],
};

const REOPEN_CASES: readonly {
  readonly title: string;
  readonly movement: PoolMovement;
}[] = [
  { title: "Es erscheint und verschwindet zugleich", movement: REOPEN_BOTH },
  {
    title: "Es erscheint nur",
    movement: { appears: ["Intern", "Ost"], enters: ["Intern", "Ost"], leaves: [] },
  },
  {
    title: "Es verschwindet nur",
    movement: { appears: [], enters: [], leaves: ["Erledigt diese Woche"] },
  },
  {
    title: "Es passt derzeit nirgends hin",
    movement: { appears: [], enters: [], leaves: [] },
  },
];

export function TimeSection() {
  const [running, setRunning] = useState(false);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [reactivated, setReactivated] = useState(false);

  return (
    <Section
      id="zeit"
      title="6 — Zeiterfassung"
      lead="Prominent, aber nicht störend: Die Anzeige wächst mit dem Ort. In der Kanban-Karte ist sie ein Knopf, in der Kopfleiste eine Zeile, in der Zeiterfassung die Hauptsache. Der laufende Timer hat eine eigene Farbe, die für keinen Exportstatus steht."
      refs={["S-05", "A-6.1", "A-6.2", "A-6.8", "A-2.5", "A-3.4", "A-13.4", "I-04", "I-05"]}
    >
      <div className="grid grid--2">
        <Card title="Größen und Zustände">
          <SubHeading>Groß — Zeiterfassung und Dashboard</SubHeading>
          <div className="stack" style={{ gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <TimerDisplay
              state={running ? "running" : "idle"}
              display={running ? "00:42:17" : "00:00:00"}
              size="lg"
              todoTitle="Musterkunde Nord — Rechnungslauf prüfen"
              detail={running ? "seit 09:12 Uhr" : "kein Timer aktiv"}
              onStart={() => setRunning(true)}
              onStop={() => setRunning(false)}
            />
          </div>

          <SubHeading>Mittel — Zeiterfassung und Detailansicht</SubHeading>
          <div className="stack" style={{ gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <TimerDisplay
              state="running"
              display="01:07:44"
              todoTitle="Beispiel GmbH — Schnittstelle"
              detail="seit 08:30 Uhr"
            />
            <TimerDisplay state="idle" display="00:00:00" detail="Kein Timer aktiv" />
            <TimerDisplay
              state="idle"
              display="00:00:00"
              detail="Todo ist archiviert — Erfassung gesperrt"
              disabled
            />
          </div>

          <SubHeading>Klein — Kanban-Karte und Tabellenzeile</SubHeading>
          <div className="stack" style={{ gap: "var(--space-2)" }}>
            <TimerDisplay state="running" display="00:12:03" size="sm" />
            <TimerDisplay state="idle" display="00:00:00" size="sm" />
          </div>

          {/*
            Die Kopfleiste nimmt seit T-056 dieselbe kleine Größe, aber mit
            beschriftetem Knopf: Dort steht der Timer für sich, und ein
            nacktes Quadrat mitten in der Zeile sagt nicht, was es tut.
            `trailing` hält den Verweis auf das Todo zwischen Zeit und Knopf,
            damit die Aktion am Ende der Zeile steht.
          */}
          <SubHeading>Klein mit beschriftetem Knopf — die Kopfleiste</SubHeading>
          <div className="timerbar timerbar--running" style={{ maxWidth: "30rem" }}>
            <TimerDisplay
              state="running"
              size="sm"
              actionStyle="labelled"
              display="00:12:03"
              detail="seit 08:30 Uhr"
              actionTitle="Beispiel GmbH — Schnittstelle"
              trailing={
                <span className="timerbar__todo truncate">Beispiel GmbH — Schnittstelle</span>
              }
              onStop={() => undefined}
            />
          </div>
        </Card>

        <div className="stack" style={{ gap: "var(--space-4)" }}>
          <Card
            title="Nur ein Timer gleichzeitig"
            description="A-6.8: Wird ein Timer gestartet, während ein anderer läuft, stoppt Takt den laufenden — aber erst, nachdem der Benutzer zugestimmt hat."
          >
            <Button variant="secondary" onClick={() => setSwitchDialogOpen(true)}>
              Timer auf anderem Todo starten
            </Button>
          </Card>

          <Card
            title="Erledigtes Todo wieder aktiv"
            description="A-2.5 und I-05: Der Start des Timers auf einem erledigten Todo hebt „Erledigt“ automatisch auf. Die Anwendung fragt hier nicht, sondern sagt hinterher genau, was passiert ist — und bietet den Rückweg an."
          >
            <div className="stack" style={{ gap: "var(--space-3)" }}>
              <Button
                variant="primary"
                iconStart="play"
                onClick={() => setReactivated(true)}
                disabled={reactivated}
              >
                Timer auf erledigtem Todo starten
              </Button>
              {reactivated ? (
                <ReactivationNotice
                  todoTitle="Betriebshandbuch Kapitel 3"
                  movement={REOPEN_BOTH}
                  onUndo={() => setReactivated(false)}
                  onDismiss={() => setReactivated(false)}
                />
              ) : null}
              <p className="section__lead">
                Der Hinweis nennt zwei Dinge: <strong>was</strong> geschehen ist — „Erledigt“ ist
                aufgehoben, der Timer läuft — und <strong>wo</strong> es sichtbar wird. Den zweiten
                Satz bildet nicht diese Ansicht, sondern <code>poolMovementSentence</code> aus{" "}
                <code>@takt/domain</code>, aus den drei Namenslisten, die{" "}
                <code>POST /timer/start</code> als <code>poolMovement</code> mitschickt (E-058).
                Dieselbe Funktion ruft der Aufgabenbereich des Outlook-Add-ins auf; zwei Fassungen
                desselben Satzes gibt es nicht mehr. Der Hinweis erscheint an jedem Startpunkt —
                Dashboard, Todo-Liste, Detailansicht, Board, Zeiterfassung — und geht über{" "}
                <code>role="status"</code> in einen <code>aria-live</code>-Bereich. Auf dem Board in
                Abschnitt 5 ist der ganze Vorgang bedienbar.
              </p>
              <InlineMessage tone="warning" title="Der Kartensatz ist ersatzlos entfallen">
                Bis T-094 endete dieser Hinweis mit „Die Karte bleibt, wo sie ist — die Spalte
                ändert sich dadurch nicht.“ Das war falsch: Seit E-055 darf eine Regel nach
                „Erledigt“ und nach dem Exportstatus fragen, und ein Timerstart ändert beides. An
                seine Stelle tritt keine zweite Beruhigung, sondern die Auskunft des Dienstes —
                und wo es nichts zu berichten gibt, bleibt die Fläche leer.
              </InlineMessage>

              <SubHeading>Vier Bewegungen, vier Sätze</SubHeading>
              <p className="section__lead">
                Der Wortlaut ist in E-058 festgelegt und steht hier nebeneinander, weil man ihn nur
                nebeneinander prüfen kann. Kein Gattungswort vor dem Namen: Ob „Ost“ ein Pool ist,
                eine Board-Spalte oder beides, steht in den drei Listen nicht — und ein Satz, der
                „der Pool „Ost““ sagt, wo eine reine Spalte gemeint ist, schickt den Leser in die
                falsche Ansicht.
              </p>
              <div className="stack" style={{ gap: "var(--space-3)" }}>
                {REOPEN_CASES.map((example) => (
                  <div key={example.title} className="stack" style={{ gap: "var(--space-1)" }}>
                    <p className="section__lead">
                      <strong>{example.title}</strong>
                    </p>
                    <ReactivationNotice
                      todoTitle="Betriebshandbuch Kapitel 3"
                      movement={example.movement}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={switchDialogOpen}
        title="Laufenden Timer stoppen?"
        description={
          <>
            Auf <strong>Musterkunde Nord — Rechnungslauf prüfen</strong> läuft seit 09:12 Uhr ein
            Timer.
          </>
        }
        consequence="Takt stoppt diesen Timer, legt die erfasste Zeit als offene Buchung ab und startet dann den neuen Timer."
        confirmLabel="Stoppen und wechseln"
        onCancel={() => setSwitchDialogOpen(false)}
        onConfirm={() => {
          setSwitchDialogOpen(false);
          setRunning(false);
        }}
      />
    </Section>
  );
}
