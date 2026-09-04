import { decideUpdateNotice, normalizeVersion } from "@takt/domain";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getVersionCheck, updateSettings } from "../api/endpoints";
import type { ForeignText } from "../api/types";
import { foreignTextFrom } from "../lib/foreign";
import { releasePageUrl } from "../lib/releasePage";
import { openReleasePage, readInstalledVersion } from "./connection";
import { useStructure } from "./StructureContext";
import { useToasts } from "./ToastContext";
import { useAsync, useMutation } from "./useAsync";

/**
 * Takt — ob sich der Hinweis auf eine neue Fassung meldet, und was seine zwei
 * Antworten tun (Spezifikation Abschnitt 18, E-064, E-069).
 *
 * ===========================================================================
 * Drei Quellen, eine Regel, und die Regel steht nicht hier
 * ===========================================================================
 *
 *   installiert     aus der **Hülle**, aus den eingeprägten Angaben des
 *                   Erzeugnisses (A-18.1, Auflage A-V-15)
 *   veröffentlicht  aus dem **Dienst**, der GitHub nach der Uhr gefragt hat
 *                   (E-069) — ungeprüft, fremder Text
 *   übersprungen    aus dem **Bestand**, als Einstellung (A-18.10, R-20)
 *
 * Zusammengeführt werden sie von `decideUpdateNotice` in `@takt/domain`. Die
 * Regel „neuer **und** nicht übersprungen" steht dort und nicht hier, und
 * ebenso die Ordnung der Fassungen: `0.10.0` steht über `0.9.0`, was ein
 * Zeichenkettenvergleich umdreht. Diese Datei entscheidet nichts über
 * Fassungen — sie holt drei Werte und zeigt an, was die Domäne sagt.
 *
 * ===========================================================================
 * Was hier **nicht** geschieht
 * ===========================================================================
 *
 * **Es wird nichts geladen und nichts installiert** (A-18.9). „Installieren"
 * öffnet die Release-Seite, mehr nicht; alles Weitere entscheidet der Benutzer
 * außerhalb von Takt.
 *
 * **Kein Fehlschlag wird zu einer Fläche** (A-18.11). Nicht erreichbar,
 * unerwartete Antwort, fehlende Fassungsangabe, keine Hülle, Route gibt es
 * nicht: Jeder dieser Fälle endet in `kind: "silent"` und sieht damit genau so
 * aus wie „alles aktuell". Deshalb fängt der Ladevorgang unten seine Fehler
 * selbst ab, statt sie an `useAsync` weiterzugeben — ein Fehlerzustand, den
 * niemand zeigen darf, wäre ein Zustand, den irgendwann jemand zeigt.
 *
 * **Und der Abruf taktet nichts.** `GET /version-check` liest ab, was der
 * Dienst zuletzt ermittelt hat, und stellt selbst keine Anfrage ins Netz
 * (Auflage A-V-10, E-069). Nur deshalb darf hier überhaupt in einem Abstand
 * nachgesehen werden.
 */

/**
 * Wie oft die Oberfläche beim Dienst nachsieht.
 *
 * Sechs Stunden, und die Zahl ist bewusst grob: Der Dienst fragt GitHub
 * höchstens einmal in 24 Stunden, ein häufigeres Nachsehen erführe also
 * dasselbe. Der Abstand ist trotzdem nötig — ein Takt, das über Tage läuft,
 * erführe von einer neuen Fassung sonst erst beim nächsten Start (A-18.2,
 * „beim Start **und danach regelmäßig**").
 */
const RECHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Was der Dienst und die Hülle zusammen ergeben haben. */
interface VersionFacts {
  /** Die installierte Fassung, roh aus der Hülle. `null` ohne Hülle. */
  readonly installed: string | null;
  /**
   * Die zuletzt gemeldete Fassung — fremder Text aus der Antwort von GitHub,
   * über die Grenze aus E-063 hereingekommen und **nicht** geprüft. Ob daraus
   * eine Fassung wird, entscheidet die Domäne.
   */
  readonly latest: ForeignText | null;
}

/** Was die Oberfläche zeigt. Zwei Zustände, und der erste ist der Normalfall. */
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

export interface UpdateNoticeApi {
  readonly view: UpdateNoticeView;
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

  const { state, reload } = useAsync<VersionFacts>(async () => {
    const [installed, latest] = await Promise.all([
      readInstalledVersion(),
      // Der stille Fehlschlag aus A-18.11, an genau einer Stelle: Gibt es die
      // Route nicht, antwortet sie unerwartet oder kommt gar keine Antwort,
      // ist das Ergebnis dasselbe wie „noch nichts geprüft".
      getVersionCheck().then(
        (view) => foreignTextFrom(view.latestVersion),
        () => null,
      ),
    ]);
    return { installed, latest };
  }, []);

  useEffect(() => {
    const handle = window.setInterval(reload, RECHECK_INTERVAL_MS);
    return () => window.clearInterval(handle);
  }, [reload]);

  const facts = state.status === "ready" ? state.value : null;
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
    if (!notice.show) return { kind: "silent" };
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
  }, [notice, postponed, facts]);

  const install = useCallback(() => {
    if (view.kind !== "available") return;
    const version = view.available;
    setOpenProblem(null);
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
            body: "Herunterladen und Installieren geschehen dort — Takt tut von sich aus nichts davon.",
          });
          return;
        case "rejected":
          setOpenProblem(
            "Die gemeldete Fassungsbezeichnung hat die Prüfung der Anwendung nicht bestanden. Takt öffnet dafür keine Seite. Die Release-Seite lässt sich über den angezeigten Verweis von Hand aufrufen.",
          );
          return;
        case "failed":
          setOpenProblem(
            "Die Release-Seite ließ sich nicht öffnen. Möglicherweise ist auf diesem Rechner kein Browser eingerichtet; der angezeigte Verweis führt von Hand zum selben Ziel.",
          );
          return;
        case "unavailable":
          setOpenProblem(result.reason);
      }
    });
  }, [view, toasts]);

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
    view,
    busy: skipping.busy,
    problem: openProblem ?? skipping.error,
    install,
    skip,
    postpone,
  };
}
