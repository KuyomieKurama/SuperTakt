/**
 * A message written by the local service. It stays German in an English UI
 * (A-28.2, E-123 point 5), so it carries `lang="de"` and screen readers switch
 * voice (WCAG 3.1.2). Messages the UI writes itself pass `fromService={false}`
 * and stay in the UI language.
 */
export function ServiceText({
  text,
  fromService = true,
}: {
  readonly text: string;
  readonly fromService?: boolean;
}) {
  return <span lang={fromService ? "de" : undefined}>{text}</span>;
}
