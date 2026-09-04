import { UpdateDialog } from "../components/UpdateDialog";
import { useUpdateNotice } from "./useUpdateNotice";

/**
 * Takt — die Fläche der Versionsprüfung, an einer Stelle (Abschnitt 18).
 *
 * Zwei Zeilen Verdrahtung zwischen {@link useUpdateNotice} und
 * {@link UpdateDialog}, und der Grund dafür steht in der Bedingung darunter:
 * **Ist nichts zu melden, entsteht kein Element.** Kein leerer Behälter, kein
 * verstecktes `div`, kein Abzeichen in der Kopfleiste, das darauf wartet,
 * gefüllt zu werden.
 *
 * Das ist der Fall, in dem am leichtesten unbemerkt eine Fläche auftaucht
 * (A-18.5, TP-VER-08): „alles aktuell", „noch nichts geprüft", „GitHub nicht
 * erreichbar", „unbrauchbare Antwort" und „keine Hülle" sehen von außen gleich
 * aus — und sie sehen aus wie nichts.
 */
export function UpdateNotice() {
  const { view, busy, problem, install, skip, postpone } = useUpdateNotice();

  if (view.kind !== "available") return null;

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
      onPostpone={postpone}
    />
  );
}
