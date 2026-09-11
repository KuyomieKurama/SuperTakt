import type { ExportTemplate, Id } from "../../api/types";
import { href } from "../../app/router";
import { Icon } from "../../shared/ui/Icon";
import { IconButton } from "../../shared/ui/Primitives";
import { cx } from "../../lib/cx";
import { formatDateTime } from "../../lib/format";
import { quotedName } from "../../lib/foreign";
import { Foreign } from "../../shared/ui/Foreign";

/** Takt — die Vorlagenliste des Editors (S-14). */

interface TemplateListProps {
  readonly templates: readonly ExportTemplate[];
  readonly selectedId: string | null;
  readonly activeTemplateId: Id | null;
  readonly onCopy: (template: ExportTemplate) => void;
  readonly onDelete: (template: ExportTemplate) => void;
}

export function TemplateList({
  templates,
  selectedId,
  activeTemplateId,
  onCopy,
  onDelete,
}: TemplateListProps) {
  const others = templates.filter((template) => !template.isBuiltin);

  return (
    <nav className="tpl-list" aria-label="Exportvorlagen">
      <ul className="tpl-list__items">
        {templates.map((template) => {
          const current = template.id === selectedId;
          return (
            <li key={template.id}>
              <div className={cx("tpl-item", current && "tpl-item--current")}>
                <a
                  className="tpl-item__link"
                  href={href("templates", template.id)}
                  aria-current={current ? "page" : undefined}
                >
                  <span className="tpl-item__name">
                    {template.isBuiltin ? (
                      <span className="tpl-item__lock" aria-hidden>
                        <Icon name="lock" size={13} />
                      </span>
                    ) : null}
                    <Foreign value={template.name} />
                  </span>
                  <span className="tpl-item__badges">
                    {template.isBuiltin ? (
                      <span className="tpl-badge tpl-badge--builtin">mitgeliefert</span>
                    ) : null}
                    {template.id === activeTemplateId ? (
                      <span className="tpl-badge tpl-badge--active">aktiv</span>
                    ) : null}
                  </span>
                  <span className="tpl-item__meta">
                    Zuletzt geändert {formatDateTime(template.updatedAt)}
                  </span>
                </a>
                <div className="tpl-item__tools">
                  <IconButton
                    label={`Vorlage ${quotedName(template.name)} kopieren`}
                    icon="copy"
                    size="sm"
                    onClick={() => onCopy(template)}
                  />
                  <IconButton
                    label={
                      template.isBuiltin
                        ? "Die Standardvorlage lässt sich nicht löschen"
                        : `Vorlage ${quotedName(template.name)} löschen`
                    }
                    icon="trash"
                    size="sm"
                    disabled={template.isBuiltin}
                    onClick={() => onDelete(template)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {others.length === 0 ? (
        <p className="tpl-list__empty">
          Es gibt bisher nur die Standardvorlage. Sie lässt sich nicht ändern, aber kopieren — und
          die Kopie können Sie beliebig umbauen.
        </p>
      ) : null}
    </nav>
  );
}
