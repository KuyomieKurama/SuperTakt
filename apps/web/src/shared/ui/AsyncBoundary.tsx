import type { ReactNode } from "react";
import type { AsyncState } from "../../app/useAsync";
import { Button, InlineMessage, LoadingBlock } from "./Primitives";

/**
 * Takt — Ladezustand und Fehlerzustand einer Ansicht an einer Stelle.
 *
 * Sie stehen hier einmal, damit sie in zwölf Ansichten gleich aussehen und
 * gleich funktionieren — vor allem im Fehlerfall: Eine Fehlermeldung ohne
 * Wiederholungsknopf ist eine Sackgasse (Abschnitt 15).
 */

export interface AsyncBoundaryProps<T> {
  readonly state: AsyncState<T>;
  /** Was gerade geladen wird — wird angesagt, nicht nur gezeigt. */
  readonly label: string;
  readonly rows?: number;
  readonly onRetry: () => void;
  readonly children: (value: T, refreshing: boolean) => ReactNode;
}

export function AsyncBoundary<T>({
  state,
  label,
  rows = 4,
  onRetry,
  children,
}: AsyncBoundaryProps<T>) {
  if (state.status === "loading") {
    return <LoadingBlock label={label} rows={rows} />;
  }

  if (state.status === "error") {
    return (
      <InlineMessage
        tone="danger"
        title="Das ließ sich nicht laden"
        action={
          <Button size="sm" variant="secondary" iconStart="rotate-ccw" onClick={onRetry}>
            Erneut versuchen
          </Button>
        }
      >
        {state.message}
        {state.code === null ? null : <span className="message__code"> ({state.code})</span>}
      </InlineMessage>
    );
  }

  return <>{children(state.value, state.refreshing)}</>;
}
