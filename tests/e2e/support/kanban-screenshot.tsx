import { createRoot } from 'react-dom/client';
import { KanbanCard, KanbanColumn, type KanbanCardData } from '../../../apps/web/src/features/board/Kanban';
import '../../../packages/ui-tokens/tokens.css';
import '../../../apps/web/src/styles/base.css';
import '../../../apps/web/src/styles/components.css';
import '../../../apps/web/src/styles/app.css';

document.documentElement.dataset.theme = 'dark';

const today = '2026-09-30';
const emptySummary = { open: 0, exported: 0, reopened: 0, not_billed: 0 };
const exportSummary = { open: 1, exported: 1, reopened: 0, not_billed: 0 };
const tags = [{ label: 'Kunde', path: ['Arbeit'] }];

function card(input: Partial<KanbanCardData> & Pick<KanbanCardData, 'id' | 'title'>): KanbanCardData {
  return {
    id: input.id,
    title: input.title,
    callNumber: input.callNumber ?? null,
    tags: input.tags ?? tags,
    tagCount: input.tagCount ?? tags.length,
    trackedDisplay: input.trackedDisplay ?? '0:00 h',
    exportSummary: input.exportSummary ?? emptySummary,
    timerRunning: input.timerRunning ?? false,
    statusName: input.statusName ?? 'In Arbeit',
    done: input.done ?? false,
    dueDate: input.dueDate ?? null,
    ...input,
  };
}

const cards = {
  open: card({ id: 'open', title: 'Offen ohne Zeit und Export' }),
  booked: card({ id: 'booked', title: 'Erfasste Zeit mit Exportstreifen', callNumber: 'CALL-11002', trackedSeconds: 5400, trackedDisplay: '1:30 h', exportSummary }),
  overdue: card({ id: 'overdue', title: 'Überfällige Rückfrage', callNumber: 'CALL-11003', dueDate: '2026-09-25', priority: { name: 'Dringend', weight: 100 } }),
  done: card({ id: 'done', title: 'Erledigte Abstimmung', callNumber: 'CALL-11004', done: true, trackedSeconds: 1800, trackedDisplay: '0:30 h' }),
  reactivated: card({ id: 'reactivated', title: 'Durch Timer aufgehoben', callNumber: 'CALL-11005', reactivated: true }),
  noEvidence: card({ id: 'no-evidence', title: 'Ohne Nachweis', callNumber: 'CALL-11006', noEvidence: true, trackedSeconds: 2700, trackedDisplay: '0:45 h', exportSummary }),
  noExport: card({ id: 'no-export', title: 'Nicht exportierbar', callNumber: 'CALL-11007', noExport: true, trackedSeconds: 1200, trackedDisplay: '0:20 h' }),
  multi: card({ id: 'multi', title: 'Mehrfachzuordnung', callNumber: 'CALL-11008', appearance: { otherColumns: ['Abschluss'] } }),
};

function FixtureCard({ data }: { readonly data: KanbanCardData }) {
  return <KanbanCard card={data} entries={[]} onOpen={() => {}} onToggleTimer={() => {}} onHighlight={() => {}} today={today} />;
}

function Fixture() {
  return (
    <main className="app__main" style={{ minHeight: '100vh' }}>
      <div className="screen" style={{ padding: '24px 32px' }}>
        <header className="screen__head">
          <div>
            <p className="eyebrow">Kanban</p>
            <h1>Aufgaben im Überblick</h1>
          </div>
          <p>Screenshot-Fixierung: Kartenzustände für REQ-011</p>
        </header>
        <section className="kanban" aria-label="Kanban-Screenshot-Fixierung" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <KanbanColumn title="Bearbeitung" count={4} entries={[]} rule="Offene Aufgaben">
            <FixtureCard data={cards.open} />
            <FixtureCard data={cards.booked} />
            <FixtureCard data={cards.overdue} />
            <FixtureCard data={cards.multi} />
          </KanbanColumn>
          <KanbanColumn title="Abschluss" count={4} doneCount={1} entries={[]} rule="Abschluss und Ausnahmen">
            <FixtureCard data={cards.done} />
            <FixtureCard data={cards.reactivated} />
            <FixtureCard data={cards.noEvidence} />
            <FixtureCard data={cards.noExport} />
          </KanbanColumn>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Fixture />);
