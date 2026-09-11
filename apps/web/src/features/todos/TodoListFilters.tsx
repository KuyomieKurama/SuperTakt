import type {
  ForeignText,
  Id,
} from "../../api/types";
import type {
  DueSortDirection,
  DueState,
} from "./api";
import { FilterBar, FilterToggle, SearchField, type ActiveFilter } from "../../shared/ui/FilterBar";
import { Select } from "../../shared/ui/Select";
import { TagInput } from "../tags/TagInput";

export const DEADLINE_FILTER_LABEL: Readonly<Record<DueState, string>> = {
  overdue: "Überfällig",
  due_today: "Heute fällig",
  due_later: "Später fällig",
  no_due_date: "Ohne Frist",
};

export const TODO_SORT_LABEL: Readonly<Record<DueSortDirection | "", string>> = {
  "": "Zuletzt bearbeitet",
  asc: "Frist, früheste zuerst",
  desc: "Frist, späteste zuerst",
};

type NamedOption = { readonly id: Id; readonly name: ForeignText };

interface TodoListFiltersProps {
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly statusId: Id | "";
  readonly onStatusChange: (value: Id | "") => void;
  readonly statuses: readonly NamedOption[];
  readonly poolId: Id | "";
  readonly onPoolChange: (value: Id | "") => void;
  readonly pools: readonly NamedOption[];
  readonly tagIds: readonly Id[];
  readonly onTagsChange: (value: readonly Id[]) => void;
  readonly deadlineFilter: DueState | "";
  readonly onDeadlineChange: (value: DueState | "") => void;
  readonly sort: DueSortDirection | "";
  readonly onSortChange: (value: DueSortDirection | "") => void;
  readonly showDone: boolean;
  readonly onShowDoneChange: (value: boolean) => void;
  readonly busy: boolean;
  readonly resultLabel: string;
  readonly activeFilters: readonly ActiveFilter[];
  readonly onResetAll: () => void;
}

/** Gemeinsame Filterbausteine; Daten und Filterzustand bleiben in der Ansicht. */
export function TodoListFilters(props: TodoListFiltersProps) {
  return (
    <FilterBar
      className="todo-list__filters"
      label="Todos filtern"
      resultLabel={props.resultLabel}
      activeFilters={props.activeFilters}
      onResetAll={props.onResetAll}
      controls={
        <div className="todo-list__filter-grid">
          <SearchField label="Todos durchsuchen" value={props.search} onChange={props.onSearchChange}
            placeholder="Titel oder Call-Nummer …" busy={props.busy} />
          <Select label="Status" value={props.statusId} onChange={props.onStatusChange}
            options={[{ value: "", label: "Jeder Status" }, ...props.statuses.map(item => ({ value: item.id, label: item.name }))]} />
          <Select label="Pool" value={props.poolId} onChange={props.onPoolChange}
            options={[{ value: "", label: "Alle Pools" }, ...props.pools.map(item => ({ value: item.id, label: item.name }))]} />
          <TagInput label="Tags" size="lg" value={props.tagIds} onChange={props.onTagsChange} placeholder="Nach Tag filtern …" />
          <Select<DueState | ""> label="Frist" value={props.deadlineFilter} onChange={props.onDeadlineChange}
            options={[
              { value: "", label: "Jede Frist" },
              { value: "overdue", label: DEADLINE_FILTER_LABEL.overdue },
              { value: "due_today", label: DEADLINE_FILTER_LABEL.due_today },
              { value: "due_later", label: DEADLINE_FILTER_LABEL.due_later },
              { value: "no_due_date", label: DEADLINE_FILTER_LABEL.no_due_date },
            ]} />
        </div>
      }
      secondaryControls={
        <div className="todo-list__ordering">
          <Select<DueSortDirection | ""> label="Ordnung" value={props.sort} onChange={props.onSortChange}
            options={[
              { value: "", label: TODO_SORT_LABEL[""] },
              { value: "asc", label: TODO_SORT_LABEL.asc },
              { value: "desc", label: TODO_SORT_LABEL.desc },
            ]} />
          <FilterToggle label="Erledigte einblenden" pressed={props.showDone} onChange={props.onShowDoneChange} />
          {/*
            **SP-03** (Sperrliste, `docs/design/textbestand.md` Abschnitt 5;
            E-074 Punkt 2, A-19.20). Der Satz steht hier **zeichengleich** und
            wird nicht gekuerzt: Ohne ihn haelt der Benutzer die Sortierung
            fuer kaputt, sobald ein Todo ohne Frist in beiden Richtungen unten
            liegt. Traeger ist diese sichtbare Zeile — die Klasse haelt
            `tests/e2e/todo-filter-layout.spec.ts` fest.
          */}
          <p className="todo-list__sort-hint">
            Ein Todo ohne Frist steht in beiden Richtungen am Ende. Es hat keinen Wert, keinen
            frühesten und keinen spätesten.
          </p>
        </div>
      }
    />
  );
}
