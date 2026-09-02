import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../lib/cx";
import { Icon, type IconName } from "./Icon";

/* ==================================================================== */
/* Knopf                                                                */
/* ==================================================================== */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ControlSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  readonly variant?: ButtonVariant;
  readonly size?: ControlSize;
  readonly iconStart?: IconName;
  readonly iconEnd?: IconName;
  /** Zeigt einen Ladeanzeiger und sperrt den Knopf, ohne die Breite zu aendern. */
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  iconStart,
  iconEnd,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const iconSize = size === "sm" ? 14 : 16;
  return (
    <button
      type={type}
      className={cx(
        "btn",
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth && "btn--full",
        loading && "btn--loading",
        (variant === "primary" || variant === "danger") && "on-solid",
        className,
      )}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={iconSize} className="btn__spinner" /> : null}
      {iconStart !== undefined && !loading ? <Icon name={iconStart} size={iconSize} /> : null}
      <span className="btn__label">{children}</span>
      {iconEnd !== undefined ? <Icon name={iconEnd} size={iconSize} /> : null}
    </button>
  );
}

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  /** Pflicht. Wird zum zugaenglichen Namen des Knopfes. */
  readonly label: string;
  readonly icon: IconName;
  readonly size?: ControlSize;
  readonly variant?: ButtonVariant;
  readonly className?: string;
  /**
   * Zugriff auf das Element, ausschliesslich zum Setzen des Fokus.
   *
   * Gebraucht dort, wo ein Knopf durch seine eigene Wirkung gesperrt wird und
   * der Fokus sonst auf den Dokumentkoerper faellt — etwa beim Verschieben
   * eines Status an das Ende seiner Liste (SC 2.4.3, `StatusSettings`). Seit
   * React 19 ist `ref` eine gewoehnliche Eigenschaft; sie geht mit `rest` an
   * das `<button>`.
   */
  readonly ref?: Ref<HTMLButtonElement>;
}

/**
 * Knopf, der nur ein Symbol zeigt. Die Klickflaeche ist immer mindestens
 * 28x28 Pixel gross und erfuellt damit WCAG 2.2 SC 2.5.8 (24x24).
 */
export function IconButton({
  label,
  icon,
  size = "md",
  variant = "ghost",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "icon-btn",
        `btn--${variant}`,
        `icon-btn--${size}`,
        (variant === "primary" || variant === "danger") && "on-solid",
        className,
      )}
      aria-label={label}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 14 : 16} />
    </button>
  );
}

/* ==================================================================== */
/* Karte und Panel                                                      */
/* ==================================================================== */

export interface CardProps {
  /** Ankerziel, damit die Karte direkt verlinkbar ist. */
  readonly id?: string;
  readonly title?: string;
  readonly description?: string;
  /** Aktionen rechts im Kartenkopf. */
  readonly actions?: ReactNode;
  readonly footer?: ReactNode;
  /** Ohne Innenabstand, zum Beispiel wenn eine Tabelle buendig sitzen soll. */
  readonly flush?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Card({
  id,
  title,
  description,
  actions,
  footer,
  flush = false,
  className,
  children,
}: CardProps) {
  const headingId = id === undefined ? undefined : `${id}-title`;
  return (
    <section
      className={cx("card", className)}
      {...(id === undefined ? {} : { id })}
      {...(headingId === undefined || title === undefined ? {} : { "aria-labelledby": headingId })}
    >
      {title !== undefined ? (
        <header className="card__header">
          <div className="grow">
            <h3 className="card__title" {...(headingId === undefined ? {} : { id: headingId })}>
              {title}
            </h3>
            {description !== undefined ? (
              <p className="card__description">{description}</p>
            ) : null}
          </div>
          {actions !== undefined ? <div className="card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx("card__body", flush && "card__body--flush")}>{children}</div>
      {footer !== undefined ? <footer className="card__footer">{footer}</footer> : null}
    </section>
  );
}

/* ==================================================================== */
/* Ladezustaende                                                        */
/* ==================================================================== */

export interface SpinnerProps {
  readonly size?: number;
  readonly className?: string;
  /** Fuer Hilfsmittel angesagter Text. Leer lassen, wenn daneben schon Text steht. */
  readonly label?: string;
}

export function Spinner({ size = 16, className, label }: SpinnerProps) {
  return (
    <span
      className={cx("spinner", className)}
      style={{ width: size, height: size }}
      role={label === undefined ? undefined : "status"}
      aria-hidden={label === undefined ? true : undefined}
    >
      {label !== undefined ? <span className="visually-hidden">{label}</span> : null}
    </span>
  );
}

export interface SkeletonProps {
  readonly width?: string;
  readonly height?: string;
  readonly radius?: string;
  readonly className?: string;
}

/**
 * Platzhalterflaeche waehrend des Ladens. Sie belegt exakt den Platz des
 * spaeteren Inhalts, damit beim Eintreffen der Daten nichts springt.
 */
export function Skeleton({ width = "100%", height = "1rem", radius, className }: SkeletonProps) {
  return (
    <span
      className={cx("skeleton", className)}
      style={{ width, height, ...(radius === undefined ? {} : { borderRadius: radius }) }}
      aria-hidden
    />
  );
}

export interface LoadingBlockProps {
  /** Text, den Hilfsmittel ansagen. */
  readonly label: string;
  readonly rows?: number;
  readonly className?: string;
}

/** Ladezustand fuer eine Liste oder Tabelle. */
export function LoadingBlock({ label, rows = 3, className }: LoadingBlockProps) {
  return (
    <div className={cx("loading-block", className)} role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div className="loading-block__row" key={index}>
          <Skeleton width="0.75rem" height="0.75rem" radius="999px" />
          <Skeleton width={`${52 + ((index * 13) % 28)}%`} />
          <Skeleton width="4.5rem" />
          <Skeleton width="6rem" radius="999px" />
        </div>
      ))}
    </div>
  );
}

/* ==================================================================== */
/* Leerzustand                                                          */
/* ==================================================================== */

export interface EmptyStateProps {
  readonly icon?: IconName;
  readonly title: string;
  readonly description?: string;
  /** Genau eine Hauptaktion. Mehr ueberfordert an dieser Stelle. */
  readonly action?: ReactNode;
  readonly compact?: boolean;
  readonly className?: string;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx("empty", compact && "empty--compact", className)}>
      <span className="empty__icon">
        <Icon name={icon} size={compact ? 20 : 24} />
      </span>
      <p className="empty__title">{title}</p>
      {description !== undefined ? <p className="empty__description">{description}</p> : null}
      {action !== undefined ? <div className="empty__action">{action}</div> : null}
    </div>
  );
}

/* ==================================================================== */
/* Hinweise und Fehler                                                  */
/* ==================================================================== */

export type MessageTone = "info" | "success" | "warning" | "danger";

const TONE_ICON: Readonly<Record<MessageTone, IconName>> = {
  info: "info",
  success: "check-circle",
  warning: "alert-triangle",
  danger: "alert-circle",
};

export interface InlineMessageProps {
  readonly tone: MessageTone;
  readonly title: string;
  readonly children?: ReactNode;
  /** Wiederherstellungsweg. Bei Fehlern Pflicht, nicht Kuer. */
  readonly action?: ReactNode;
  readonly onDismiss?: () => void;
  readonly className?: string;
}

/**
 * Meldung im Seitenfluss. Fehler werden mit `role="alert"` angesagt,
 * alles andere hoeflich ueber `aria-live="polite"`.
 */
export function InlineMessage({
  tone,
  title,
  children,
  action,
  onDismiss,
  className,
}: InlineMessageProps) {
  const assertive = tone === "danger";
  return (
    <div
      className={cx("message", `message--${tone}`, className)}
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
    >
      <span className="message__icon">
        <Icon name={TONE_ICON[tone]} size={16} />
      </span>
      <div className="grow">
        <p className="message__title">{title}</p>
        {children !== undefined ? <div className="message__body">{children}</div> : null}
        {action !== undefined ? <div className="message__action">{action}</div> : null}
      </div>
      {onDismiss !== undefined ? (
        <IconButton label="Meldung schliessen" icon="x" size="sm" onClick={onDismiss} />
      ) : null}
    </div>
  );
}

/* ==================================================================== */
/* Werkzeugleiste                                                       */
/* ==================================================================== */

export interface ToolbarProps {
  readonly label: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Toolbar({ label, className, children }: ToolbarProps) {
  return (
    <div className={cx("toolbar", className)} role="toolbar" aria-label={label}>
      {children}
    </div>
  );
}
