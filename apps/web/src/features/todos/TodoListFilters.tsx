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
import { todoTexts } from "./texts";

/** The words of the deadline filter, for the select and the active filter chip. */
export function deadlineFilterLabel(state: DueState): string {
  return todoTexts().deadlineFilter[state];
}

/** The words of the ordering, for the select and the active filter chip. */
export function todoSortLabel(sort: DueSortDirection | ""): string {
  const labels = todoTexts().sortLabel;
  return sort === "" ? labels.recent : labels[sort];
}

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
  const text = todoTexts();
  return (
    <FilterBar
      className="todo-list__filters"
      label={text.filterTodos}
      resultLabel={props.resultLabel}
      activeFilters={props.activeFilters}
      onResetAll={props.onResetAll}
      controls={
        <div className="todo-list__filter-grid">
          <SearchField label={text.searchTodos} value={props.search} onChange={props.onSearchChange}
            placeholder={text.searchPlaceholder} busy={props.busy} />
          <Select label={text.status} value={props.statusId} onChange={props.onStatusChange}
            options={[{ value: "", label: text.anyStatus }, ...props.statuses.map(item => ({ value: item.id, label: item.name }))]} />
          <Select label={text.pool} value={props.poolId} onChange={props.onPoolChange}
            options={[{ value: "", label: text.allPools }, ...props.pools.map(item => ({ value: item.id, label: item.name }))]} />
          <TagInput label={text.tags} size="lg" value={props.tagIds} onChange={props.onTagsChange} placeholder={text.filterByTag} />
          <Select<DueState | ""> label={text.deadline} value={props.deadlineFilter} onChange={props.onDeadlineChange}
            options={[
              { value: "", label: text.anyDeadline },
              { value: "overdue", label: deadlineFilterLabel("overdue") },
              { value: "due_today", label: deadlineFilterLabel("due_today") },
              { value: "due_later", label: deadlineFilterLabel("due_later") },
              { value: "no_due_date", label: deadlineFilterLabel("no_due_date") },
            ]} />
        </div>
      }
      secondaryControls={
        <div className="todo-list__ordering">
          <Select<DueSortDirection | ""> label={text.ordering} value={props.sort} onChange={props.onSortChange}
            options={[
              { value: "", label: todoSortLabel("") },
              { value: "asc", label: todoSortLabel("asc") },
              { value: "desc", label: todoSortLabel("desc") },
            ]} />
          <FilterToggle label={text.showDone} pressed={props.showDone} onChange={props.onShowDoneChange} />
          {/*
            **SP-03** (Sperrliste, `docs/design/textbestand.md` Abschnitt 5;
            E-074 Punkt 2, A-19.20). Der Satz steht hier **zeichengleich** und
            wird nicht gekuerzt: Ohne ihn haelt der Benutzer die Sortierung
            fuer kaputt, sobald ein Todo ohne Frist in beiden Richtungen unten
            liegt. Traeger ist diese sichtbare Zeile — die Klasse haelt
            `tests/e2e/todo-filter-layout.spec.ts` fest.
          */}
          <p className="todo-list__sort-hint">
            {text.sortHint}
          </p>
        </div>
      }
    />
  );
}
