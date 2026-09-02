import type { ReactNode } from "react";

export interface SectionProps {
  readonly id: string;
  readonly title: string;
  readonly lead?: string;
  /** Anforderungs-IDs aus docs/spec.md, gegen die dieser Abschnitt gebaut ist. */
  readonly refs?: readonly string[];
  readonly children: ReactNode;
}

export function Section({ id, title, lead, refs, children }: SectionProps) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <header className="section__head">
        <h2 id={`${id}-title`}>{title}</h2>
        {lead !== undefined ? <p className="section__lead">{lead}</p> : null}
        {refs !== undefined && refs.length > 0 ? (
          <p className="section__ref">Deckung: {refs.join(" · ")}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export interface SubHeadingProps {
  readonly children: ReactNode;
}

export function SubHeading({ children }: SubHeadingProps) {
  return <h3 className="overline">{children}</h3>;
}
