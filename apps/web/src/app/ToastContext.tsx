import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "../components/Icon";
import { Button, IconButton } from "../components/Primitives";
import { cx } from "../lib/cx";

/**
 * Takt — Rückmeldung nach einer Handlung.
 *
 * Abschnitt 16 verlangt für **jede** Interaktion eine sichtbare Rückmeldung.
 * Sie steht hier an einer Stelle, damit sie überall gleich aussieht und
 * überall angesagt wird.
 *
 * Zwei Regeln:
 *
 * 1. **Eine Meldung mit Rückweg verschwindet nicht von selbst.** „Rückgängig“
 *    ist nutzlos, wenn es weg ist, bevor man es gelesen hat (SC 2.2.1). Ohne
 *    Rückweg schließt die Meldung nach acht Sekunden.
 * 2. **Angesagt wird höflich, nicht laut.** `aria-live="polite"` unterbricht
 *    den Vorleser nicht mitten im Satz. Fehler sind die Ausnahme; sie stehen
 *    in `role="alert"`.
 */

export type ToastTone = "success" | "info" | "warning" | "danger";

export interface ToastAction {
  readonly label: string;
  readonly onSelect: () => void;
}

export interface ToastInput {
  readonly tone: ToastTone;
  readonly title: string;
  /** Zweite Zeile. Sagt, was jetzt anders ist. */
  readonly body?: string;
  readonly action?: ToastAction;
}

interface Toast extends ToastInput {
  readonly id: number;
}

const TONE_ICON: Readonly<Record<ToastTone, IconName>> = {
  success: "check-circle",
  info: "info",
  warning: "alert-triangle",
  danger: "alert-circle",
};

export interface ToastApi {
  readonly show: (toast: ToastInput) => void;
  /** Kurzform für den häufigsten Fall. */
  readonly success: (title: string, body?: string) => void;
  readonly failure: (title: string, body?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToasts(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) {
    throw new Error("useToasts steht nur innerhalb von ToastProvider zur Verfügung.");
  }
  return api;
}

const AUTO_DISMISS_MS = 8000;

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((input: ToastInput) => {
    const id = nextId.current++;
    setToasts((previous) => [...previous.slice(-3), { ...input, id }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, body) => show(body === undefined ? { tone: "success", title } : { tone: "success", title, body }),
      failure: (title, body) => show(body === undefined ? { tone: "danger", title } : { tone: "danger", title, body }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/*
        Genau **eine** Vorlesestelle. Eine zusaetzliche versteckte Kopie haette
        jede Meldung zweimal angesagt — einmal versteckt, einmal sichtbar.
        Die Knoepfe darin bleiben bedienbar; eine Live-Region schliesst
        Bedienelemente nicht aus.
      */}
      <div className="toast-layer" aria-live="polite">
        <ul className="toast-stack">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
          ))}
        </ul>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { readonly toast: Toast; readonly onDismiss: () => void }) {
  const hasAction = toast.action !== undefined;

  useEffect(() => {
    if (hasAction) return;
    const handle = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(handle);
  }, [hasAction, onDismiss]);

  return (
    <li
      className={cx("toast", `toast--${toast.tone}`)}
      role={toast.tone === "danger" ? "alert" : undefined}
    >
      <span className="toast__icon">
        <Icon name={TONE_ICON[toast.tone]} size={16} />
      </span>
      <div className="grow">
        <p className="toast__title">{toast.title}</p>
        {toast.body === undefined ? null : <p className="toast__body">{toast.body}</p>}
        {toast.action === undefined ? null : (
          <div className="toast__action">
            <Button
              size="sm"
              variant="secondary"
              iconStart="rotate-ccw"
              onClick={() => {
                toast.action?.onSelect();
                onDismiss();
              }}
            >
              {toast.action.label}
            </Button>
          </div>
        )}
      </div>
      <IconButton label="Meldung schließen" icon="x" size="sm" onClick={onDismiss} />
    </li>
  );
}
