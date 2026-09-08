import { useEffect, useState } from "react";

import { Icon } from "../components/Icon";
import { Button, IconButton } from "../components/Primitives";
import { UpdateDialog } from "../components/UpdateDialog";
import { useUpdateNotice } from "./useUpdateNotice";

/**
 * Takt — die Fläche der Versionsprüfung, an einer Stelle (Abschnitt 18).
 *
 * Die Verdrahtung zwischen {@link useUpdateNotice} und {@link UpdateDialog},
 * und der Grund für die erste Bedingung darunter: **Ist nichts zu melden,
 * entsteht kein Element.** Kein leerer Behälter, kein verstecktes `div`, kein
 * Abzeichen in der Kopfleiste, das darauf wartet, gefüllt zu werden.
 *
 * Das ist der Fall, in dem am leichtesten unbemerkt eine Fläche auftaucht
 * (A-18.5, TP-VER-08): „alles aktuell", „noch nichts geprüft", „GitHub nicht
 * erreichbar", „unbrauchbare Antwort" und „keine Hülle" sehen von außen gleich
 * aus — und sie sehen aus wie nichts.
 *
 * ===========================================================================
 * Zwei Flächen, und welche kommt, entscheidet der **Zeitpunkt** (T-144 U-01)
 * ===========================================================================
 *
 * **Beim Start** (`arrival === "start"`): der modale Dialog, unverändert. Der
 * Benutzer hat noch nichts getan; ein Dialog unterbricht nichts, und die
 * Entscheidung steht am richtigen Ort.
 *
 * **Mitten in der Sitzung** (`arrival === "session"`): eine ruhige,
 * **nicht-modale** Leiste. Sie nimmt keinen Fokus, sie legt sich über nichts,
 * sie lässt sich wegklicken — und aus ihr heraus öffnet der Benutzer den Dialog
 * **selbst**. Dann ist der Fokuswechsel angefordert und keine Nebenwirkung
 * (SC 3.2.5).
 *
 * **Warum nicht einfach den Dialog ohne Fokusübernahme zeigen.** Das war der
 * naheliegende Vorschlag und ist die schlechtere Lösung: Ein `aria-modal="true"`
 * unter einer Abdunklung verbirgt den Rest der Anwendung vor Hilfsmitteln.
 * Bliebe der Fokus draußen, tippte der Benutzer weiter in ein Feld, das für
 * seine Vorlesehilfe nicht mehr existiert — ein zweiter Fehler statt einer
 * Behebung.
 *
 * **Warum nicht bis zum nächsten Start warten.** Auch das wäre möglich (T-144
 * schlägt es vor), aber A-18.2 verlangt die Prüfung „beim Start **und danach
 * regelmäßig**". Ein Takt, das über Tage läuft, erführe sonst nichts, und die
 * regelmäßige Prüfung wäre eine Prüfung ohne Wirkung.
 */
export function UpdateNotice() {
  const { view, arrival, busy, problem, install, skip, postpone } = useUpdateNotice();

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
          Eine neuere Fassung von Takt ist verfügbar: <strong>{view.available}</strong>. Installiert
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
