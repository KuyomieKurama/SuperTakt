import { useStructure } from "../../app/StructureContext";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { ScreenHeader } from "../../shared/ui/ScreenHeader";
import { PoolAdministration } from "./PoolAdministration";
import { TagAdministration } from "./TagAdministration";

/**
 * Takt — S-08 (Tags und Ordner) und S-11 (Pools).
 *
 * Die Ansicht selbst ist nur der Rahmen: Kopfzeile, Ladehülle und der
 * Zweispalter. Was in den beiden Spalten steht, steht daneben —
 * `TagAdministration.tsx` und `PoolAdministration.tsx`.
 */
export function TagsScreen() {
  const structure = useStructure();

  return (
    <section className="screen">
      <ScreenHeader
        title="Tags"
        lead="Tags, Ordner und die Regeln darüber. Dieselbe Regel kann ein Pool sein, eine Spalte des Kanban-Boards oder beides."
        /*
          Diese Ansicht liest allein aus der Struktur; ihr Nachladen ist
          `structure.reload()` (W-12).
        */
        refreshing={structure.state.status === "ready" && structure.state.refreshing}
      />

      <AsyncBoundary
        state={structure.state}
        label="Tags werden geladen"
        rows={5}
        onRetry={structure.reload}
      >
        {(value) => (
          <div className="tags-layout">
            <TagAdministration tree={value.tagTree} />
            <PoolAdministration rules={value.rules} />
          </div>
        )}
      </AsyncBoundary>
    </section>
  );
}
