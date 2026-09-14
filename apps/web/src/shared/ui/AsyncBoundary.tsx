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
  /**
   * Umschlag für Skelett und Fehlerfläche (T-326).
   *
   * Ohne Angabe stehen beide dort, wo der Aufrufer die Grenze gesetzt hat — der
   * Regelfall: Der Laufbereich der Ansicht liegt außen, Skelett und
   * Fehlerfläche liegen darin (T-322 R-5).
   *
   * Drei Ansichten setzen ihren Laufbereich erst **innerhalb** des
   * Erfolgsfalls, weil eine feste Leiste an den Daten hängt — die Auswahlleiste
   * der Buchungen, die Werkzeugzeile des Boards — oder weil der Bildschirmkopf
   * selbst aus den Daten entsteht (Todo-Detailansicht, T-322 4.3). Dort gäbe es
   * im Lade- und im Fehlerzustand gar keinen Laufbereich, und eine Ansicht ohne
   * Laufbereich geht gut, bis die Daten wachsen (T-323, Zusicherung A3).
   * Dieser Umschlag gibt ihnen einen.
   */
  readonly fallbackFrame?: (content: ReactNode) => ReactNode;
  readonly children: (value: T, refreshing: boolean) => ReactNode;
}

export function AsyncBoundary<T>({
  state,
  label,
  rows = 4,
  onRetry,
  fallbackFrame,
  children,
}: AsyncBoundaryProps<T>) {
  const framed = (content: ReactNode): ReactNode =>
    fallbackFrame === undefined ? content : fallbackFrame(content);

  if (state.status === "loading") {
    return <>{framed(<LoadingBlock label={label} rows={rows} />)}</>;
  }

  if (state.status === "error") {
    return (
      <>{framed(
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
      </InlineMessage>,
      )}</>
    );
  }

  return <>{children(state.value, state.refreshing)}</>;
}
