import type { ExportTemplate, Id } from "../../api/types";
import { href } from "../../app/router";
import { Icon } from "../../shared/ui/Icon";
import { IconButton } from "../../shared/ui/Primitives";
import { cx } from "../../lib/cx";
import { formatDateTime } from "../../lib/format";
import { quotedName } from "../../lib/foreign";
import { Foreign } from "../../shared/ui/Foreign";
import { exportTexts } from "./texts";

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
  const text = exportTexts();

  return (
    <nav className="tpl-list" aria-label={text.templatesNav}>
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
                      <span className="tpl-badge tpl-badge--builtin">{text.builtInBadge}</span>
                    ) : null}
                    {template.id === activeTemplateId ? (
                      <span className="tpl-badge tpl-badge--active">{text.activeBadge}</span>
                    ) : null}
                  </span>
                  <span className="tpl-item__meta">
                    {text.lastChanged(formatDateTime(template.updatedAt))}
                  </span>
                </a>
                <div className="tpl-item__tools">
                  <IconButton
                    label={text.copyTemplate(quotedName(template.name))}
                    icon="copy"
                    size="sm"
                    onClick={() => onCopy(template)}
                  />
                  <IconButton
                    label={
                      template.isBuiltin
                        ? text.builtinNotDeletable
                        : text.deleteTemplate(quotedName(template.name))
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
          {text.onlyBuiltin}
        </p>
      ) : null}
    </nav>
  );
}
