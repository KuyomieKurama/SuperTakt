import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

export interface TableShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Frame for the empty, loading and error state in place of a table. Shared by
 * the booking and todo tables (docs/design/todo-tabelle.md 10.4).
 */
export function TableShell({ children, className }: TableShellProps) {
  return <div className={cx("table-shell", className)}>{children}</div>;
}
