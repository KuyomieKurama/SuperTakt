import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button, Card, InlineMessage } from "../components/Primitives";
import { ReactivationNotice, TimerDisplay } from "../components/Timer";
import { Section, SubHeading } from "./Section";

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
                  poolNames={["Intern", "Nicht abgerechnet"]}
                  onUndo={() => setReactivated(false)}
                  onDismiss={() => setReactivated(false)}
                />
              ) : null}
              <p className="section__lead">
                Der Satz nennt alle Wirkungen: „Erledigt“ ist weg, und das Todo erscheint wieder in
                seinen Pools (A-3.4) — Pool-Ansichten blenden erledigte Todos aus, deshalb war es
                dort verschwunden. Was der Satz ausdrücklich <em>nicht</em> behauptet: dass die
                Karte die Spalte gewechselt habe. Das tut sie nicht; Statusspalte und
                Erledigt-Kennzeichen sind unabhängig. Derselbe Satz erscheint an jedem Startpunkt —
                Dashboard, Todo-Liste, Detailansicht, Board, Zeiterfassung und Outlook-Add-in — und
                geht zusätzlich in einen <code>aria-live</code>-Bereich. Auf dem Board in
                Abschnitt 5 ist der ganze Vorgang bedienbar.
              </p>
              <InlineMessage tone="info" title="Wenn keine Poolregel greift">
                Passt zu den Tags des Todos keine Poolregel, nennt die Meldung keinen Pool, sondern
                sagt das ausdrücklich. Eine Meldung, die einen Pool erfindet, wäre schlimmer als
                keine.
              </InlineMessage>
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
