import { useVersionFacts } from "./useVersionFacts";
import { decideUpdateNotice, normalizeVersion } from "@takt/domain";
import { useCallback, useMemo, useState } from "react";
import {
  updateSettings,
} from "./api";
import { releasePageUrl } from "./releasePage";
import { openReleasePage } from "../../app/connection";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useMutation } from "../../app/useAsync";

/**
 * Verbindet den lokalen Versionsstand mit der installierten und der
 * übersprungenen Fassung. Die Vergleichsregel bleibt in der Domäne.
 * Der Dienst allein prüft GitHub; die Oberfläche liest seinen Cache.
 */
export type UpdateNoticeView =
  /** Nichts zu melden — aktuell, übersprungen, unbekannt oder fehlgeschlagen. */
  | { readonly kind: "silent" }
  | {
      readonly kind: "available";
      /** Installierte Fassung, von der Domäne normalisiert. */
      readonly installed: string;
      /** Verfügbare Fassung, von der Domäne geprüft und normalisiert. */
      readonly available: string;
      /** Die Release-Seite dieser Fassung, als lesbarer Text (A-18.6). */
      readonly url: string;
    };

/**
 * Wann der Hinweis entstanden ist (Befund T-144 U-01).
 *
 * `start` — beim ersten Ladevorgang, also bevor der Benutzer etwas getan hat.
 * Ein modaler Dialog unterbricht dann nichts.
 *
 * `session` — mitten in der Arbeit, beim regelmäßigen Nachsehen. Ein modaler
 * Dialog nähme dann den Fokus aus einem Feld, in das gerade jemand tippt.
 */
export type UpdateArrival = "start" | "session";

export interface UpdateNoticeApi {
  readonly installedVersion: string | null;
  readonly availableVersion: string | null;
  readonly view: UpdateNoticeView;
  /** Siehe {@link UpdateArrival}. Entscheidet über die **Fläche**, nicht über den Inhalt. */
  readonly arrival: UpdateArrival;
  /** „Überspringen" läuft gerade. Der Knopf zeigt es an und sperrt. */
  readonly busy: boolean;
  /**
   * Was schiefging, **nachdem** der Benutzer geantwortet hat. Steht im Dialog
   * und nicht als Toast: Der Dialog ist modal, und eine Meldung außerhalb von
   * `aria-modal` erreicht ihn nicht.
   */
  readonly problem: string | null;
  /** „Installieren" — öffnet die Release-Seite, sonst nichts (A-18.8). */
  readonly install: () => void;
  /** „Überspringen" — legt genau diese Fassung im Bestand ab (A-18.10). */
  readonly skip: () => void;
  /**
   * Der Dialog wird geschlossen, ohne zu antworten (Escape, Schließknopf).
   *
   * **Wird nirgends gespeichert.** Für diesen Lauf ist Ruhe, beim nächsten
   * Start meldet sich derselbe Hinweis wieder. Das ist der vorsichtige
   * Ausgang: „Überspringen" ist eine Entscheidung des Benutzers und soll
   * keine sein, die er versehentlich mit Escape trifft.
   */
  readonly postpone: () => void;
}

export function useUpdateNotice(): UpdateNoticeApi {
  const { state: structure, reload: reloadStructure } = useStructure();
  const toasts = useToasts();
  const skipping = useMutation();

  /** Für diesen Lauf zurückgestellt — siehe {@link UpdateNoticeApi.postpone}. */
  const [postponed, setPostponed] = useState<string | null>(null);
  const [openProblem, setOpenProblem] = useState<string | null>(null);

  const facts = useVersionFacts();
  const availableUpdate = decideUpdateNotice({ installed: facts?.installed ?? null, latest: facts?.latest ?? null, skipped: null });
  const availableVersion = availableUpdate.show ? availableUpdate.version : null;
  const skipped = structure.status === "ready" ? structure.value.settings.skippedVersion : null;

  const notice = useMemo(
    () =>
      decideUpdateNotice({
        installed: facts?.installed ?? null,
        latest: facts?.latest ?? null,
        skipped,
      }),
    [facts, skipped],
  );

  const view = useMemo<UpdateNoticeView>(() => {
    if (structure.status !== "ready" || !notice.show) return { kind: "silent" };
    if (notice.version === postponed) return { kind: "silent" };
    /*
      Die installierte Fassung wird **von der Domäne** normalisiert, bevor sie
      angezeigt wird — und nicht roh aus der Hülle übernommen. Meldet sich der
      Hinweis, hat sie die Formprüfung ohnehin bestanden (sonst wäre `show`
      falsch); der Weg über `normalizeVersion` hält fest, dass die angezeigte
      Zeichenkette dieselbe Prüfung durchlaufen hat wie die verglichene, und
      nicht eine zweite, ähnliche.
    */
    const installed = normalizeVersion(facts?.installed);
    if (installed === null) return { kind: "silent" };
    return {
      kind: "available",
      installed,
      available: notice.version,
      url: releasePageUrl(notice.version),
    };
  }, [notice, postponed, facts, structure.status]);

  const install = useCallback(() => {
    if (availableVersion === null) return;
    const version = availableVersion;
    setOpenProblem(null);
    const reportProblem = (message: string) => {
      setOpenProblem(message);
      if (view.kind !== "available") toasts.failure("Update konnte nicht geöffnet werden", message);
    };
    void openReleasePage(version).then((result) => {
      switch (result.outcome) {
        case "opened":
          // Der Dialog hat seine Frage gestellt und eine Antwort bekommen. Er
          // geht zu, **ohne** die Fassung zu überspringen: Wer die Seite
          // ansieht und sich später doch anders entscheidet, soll den Hinweis
          // beim nächsten Start wiederfinden.
          setPostponed(version);
          toasts.show({
            tone: "info",
            title: "Die Release-Seite ist im Browser geöffnet.",
            body: "Herunterladen und Installieren geschehen dort — SuperTakt tut von sich aus nichts davon.",
          });
          return;
        case "rejected":
          reportProblem(
            "Die gemeldete Fassungsbezeichnung hat die Prüfung der Anwendung nicht bestanden. SuperTakt öffnet dafür keine Seite.",
          );
          return;
        case "failed":
          reportProblem(
            "Die Release-Seite ließ sich nicht öffnen. Möglicherweise ist auf diesem Rechner kein Browser eingerichtet; der angezeigte Verweis führt von Hand zum selben Ziel.",
          );
          return;
        case "unavailable":
          reportProblem(result.reason);
      }
    });
  }, [availableVersion, view, toasts]);

  const skip = useCallback(() => {
    if (view.kind !== "available") return;
    const version = view.available;
    setOpenProblem(null);
    void (async () => {
      const done = await skipping.run(async () => {
        await updateSettings({ skippedVersion: version });
      });
      if (!done) return;
      setPostponed(version);
      // Die Einstellungen neu holen: Ab jetzt ist „übersprungen" der Grund,
      // aus dem nichts erscheint, und nicht dieser Lauf.
      reloadStructure();
      toasts.show({
        tone: "success",
        title: `Fassung ${version} wird nicht mehr gemeldet.`,
        body: "Eine spätere, höhere Fassung meldet sich wieder.",
      });
    })();
  }, [view, skipping, reloadStructure, toasts]);

  const postpone = useCallback(() => {
    if (view.kind !== "available") return;
    setOpenProblem(null);
    skipping.clearError();
    setPostponed(view.available);
  }, [view, skipping]);

  return {
    installedVersion: normalizeVersion(facts?.installed),
    availableVersion,
    view,
    arrival: "session",
    busy: skipping.busy,
    problem: openProblem ?? skipping.error,
    install,
    skip,
    postpone,
  };
}
