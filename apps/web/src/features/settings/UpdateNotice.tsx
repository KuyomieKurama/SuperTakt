import { useEffect, useState } from "react";

import { Icon } from "../../shared/ui/Icon";
import { Button, IconButton } from "../../shared/ui/Primitives";
import { UpdateDialog } from "./UpdateDialog";
import type { UpdateNoticeApi } from "./useUpdateNotice";

/**
 * A-27.12: Automatische Hinweise sind nicht modal. Der Benutzer öffnet
 * die Details ausdrücklich. „start“ bleibt für bestehende Vorschauen erhalten.
 */
export function UpdateNotice({ api }: { readonly api: UpdateNoticeApi }) {
  const { view, arrival, busy, problem, install, skip, postpone } = api;

  /** Hat der Benutzer die Leiste aufgeklappt? Nur dann kommt der Dialog. */
  const [opened, setOpened] = useState(false);
  /** Hat er die Leiste weggeklickt? Dann ist für diesen Lauf Ruhe. */
  const [dismissed, setDismissed] = useState(false);

  /*
    Eine höhere Fassung als die eben weggeklickte ist ein neuer Hinweis und
    keine Wiederholung. Der Schalter fällt deshalb zurück, sobald sich die
    gemeldete Fassung ändert.
  */
  const available = view.kind === "available" ? view.available : null;
  useEffect(() => {
    setDismissed(false);
    setOpened(false);
  }, [available]);

  if (view.kind !== "available") return null;

  if (arrival === "session" && !opened) {
    if (dismissed) return null;
    return (
      <div className="updatebar" role="status">
        <span className="updatebar__icon" aria-hidden>
          <Icon name="arrow-up-right" size={16} />
        </span>
        <p className="updatebar__text">
          {/*
            Beide Fassungen stehen schon hier. Wer nur wissen wollte, ob etwas
            Neues da ist, muss dafür keinen Dialog öffnen — A-18.6 verlangt,
            dass Takt die Fassung **anzeigt**.
          */}
          Eine neuere Fassung von SuperTakt ist verfügbar: <strong>{view.available}</strong>. Installiert
          ist {view.installed}.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setOpened(true)}>
          Ansehen
        </Button>
        <IconButton
          label="Hinweis auf die neue Fassung schließen"
          icon="x"
          size="sm"
          onClick={() => setDismissed(true)}
        />
      </div>
    );
  }

  return (
    <UpdateDialog
      open
      installed={view.installed}
      available={view.available}
      url={view.url}
      problem={problem}
      busy={busy}
      onInstall={install}
      onSkip={skip}
      onPostpone={() => {
        postpone();
        setOpened(false);
      }}
    />
  );
}
