import { useStructure } from "../../app/StructureContext";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { ScreenBody } from "../../shared/ui/ScreenBody";
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

      {/*
        Ein Laufbereich, Name „Tags" (T-322 4.10). **Nicht zwei**, obwohl es zwei
        Flächen sind: Baum und Regeln stehen nicht nebeneinander, sondern
        untereinander (`.tags-layout` ist eine Spalte, der Zweispalter
        `.tags-split` liegt *innerhalb* der ersten Karte). Zwei Laufbereiche
        wären hier zwei übereinanderliegende Bildlaufflächen — genau das, was
        R-2 ausschließt. Sie nebeneinander zu stellen wäre ein neues Layout.
      */}
      <ScreenBody label="Tags">
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
      </ScreenBody>
    </section>
  );
}
