import { useState } from "react";
import type { Id } from "../../api/types";
import { Button, Card, EmptyState, InlineMessage } from "../../shared/ui/Primitives";
import { TagInput } from "../tags/TagInput";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useAsync, useMutation } from "../../app/useAsync";
import { plural } from "../../lib/format";
import { listDefaultTags, setDefaultTags } from "./api";
import { ServiceText } from "../../shared/ui/ServiceText";
import { settingsTexts } from "./texts";
/* Standard-Tags (S-10, I-12)                                           */

export function DefaultTagSettings() {
  const structure = useStructure();
  const toasts = useToasts();
  const mutation = useMutation();
  const [selected, setSelected] = useState<readonly Id[] | null>(null);

  const current = useAsync(() => listDefaultTags(), []);
  const value = selected ?? (current.state.status === "ready" ? current.state.value.map((tag) => tag.tagId) : []);

  const text = settingsTexts();

  return (
    <Card
      title={text.defaultTags}
      description={text.defaultTagsLead}
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
              toasts.success(settingsTexts().defaultTagsSaved);
            });
          }}
        >
          {text.save}
        </Button>
      }
    >
      {structure.allTags.length === 0 ? (
        <EmptyState
          compact
          icon="tag"
          title={text.noTagYet}
          description={text.noTagYetBody}

        />
      ) : (
        <TagInput
          label={text.defaultTags}
          hideLabel
          value={value}
          onChange={setSelected}
          placeholder={text.searchTag}
          hint={
            value.length === 0
              ? text.noDefaultTag
              : text.attachedToEveryTodo(plural(value.length, text.tagIs, text.tagsAre))
          }
        />
      )}

      {mutation.error === null ? null : (
        <InlineMessage tone="danger" title={text.defaultTagsNotSaved}>
          <ServiceText text={mutation.error} fromService={mutation.errorFromService} />
        </InlineMessage>
      )}
    </Card>
  );
}
