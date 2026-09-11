import { useState } from "react";
import type { Id } from "../../api/types";
import { Button, Card, EmptyState, InlineMessage } from "../../shared/ui/Primitives";
import { TagInput } from "../tags/TagInput";
import { navigate } from "../../app/router";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useAsync, useMutation } from "../../app/useAsync";
import { plural } from "../../lib/format";
import { listDefaultTags, setDefaultTags } from "./api";
/* ==================================================================== */
/* Standard-Tags (S-10, I-12)                                           */
/* ==================================================================== */

export function DefaultTagSettings() {
  const structure = useStructure();
  const toasts = useToasts();
  const mutation = useMutation();
  const [selected, setSelected] = useState<readonly Id[] | null>(null);

  const current = useAsync(() => listDefaultTags(), []);
  const value = selected ?? (current.state.status === "ready" ? current.state.value.map((tag) => tag.tagId) : []);

  return (
    <Card
      title="Standard-Tags"
      description="Auch aus dem Add-in."
      actions={
        <Button
          variant="primary"
          disabled={selected === null}
          loading={mutation.busy}
          onClick={() => {
            void mutation.run(async () => {
              await setDefaultTags(value);
              setSelected(null);
              current.reload();
              toasts.success("Standard-Tags gespeichert.");
            });
          }}
        >
          Speichern
        </Button>
      }
    >
      {structure.allTags.length === 0 ? (
        <EmptyState
          compact
          icon="tag"
          title="Noch kein Tag"
          description="Legen Sie zuerst Tags an — erst dann lässt sich einer als Standard setzen."
          action={
            <Button iconStart="tag" onClick={() => navigate("tags")}>
              Zur Tag-Verwaltung
            </Button>
          }
        />
      ) : (
        <TagInput
          label="Standard-Tags"
          hideLabel
          value={value}
          onChange={setSelected}
          placeholder="Tag suchen …"
          hint={
            value.length === 0
              ? "Kein Standard-Tag gesetzt. Neue Todos entstehen ohne Tags — Regeln, die Tags verlangen, treffen sie damit zunächst nicht."
              : `${plural(value.length, "Tag wird", "Tags werden")} an jedes neue Todo gehängt.`
          }
        />
      )}

      {mutation.error === null ? null : (
        <InlineMessage tone="danger" title="Die Standard-Tags wurden nicht gespeichert">
          {mutation.error}
        </InlineMessage>
      )}
    </Card>
  );
}
