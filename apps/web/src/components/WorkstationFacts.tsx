import type { ForeignText } from "../api/types";
import { useId, useMemo, useState } from "react";
import { cx } from "../lib/cx";
import {
  adviseDatabaseLocation,
  type DatabaseLocationConcern,
  type DatabaseLocationImpact,
} from "../lib/databaseLocationAdvice";
import { Icon } from "./Icon";
import { Button, InlineMessage } from "./Primitives";
import { Foreign } from "./Foreign";

/**
 * Takt — die zwei Auskünfte des Dienstes über diesen Arbeitsplatz (C-20).
 *
 * `GET /settings` führt neben den Einstellungen zwei Werte, die **keine**
 * Einstellungen sind: den Namen, unter dem abgerechnet wird, und den Ort, an
 * dem der Bestand liegt. Beide lassen sich in Takt nicht ändern. Beide gehören
 * trotzdem auf den Bildschirm, und zwar aus demselben Grund: Eine Absicherung,
 * die niemand nachsehen kann, wirkt nur, solange nichts schiefgeht.
 *
 * ## Der Benutzername (E-042, B-8.1)
 *
 * Er steht in jeder Zeile jeder Exportdatei. E-042 hat dafür einen
 * abgesicherten Kanal gebaut — der Name kommt über die zweite `stdin`-Zeile
 * vom Betriebssystem, nicht aus der Umgebungsvariablen; sonst genügte
 * `set USERNAME=fremder && Takt.exe`, um fremde Arbeitszeit unter eigenem
 * Namen abzurechnen. Bis T-042 war der Name nur in `ExportRun.windowsUser` zu
 * sehen, also erst **nach** dem ersten Export. Der Moment, in dem man ihn
 * wissen will, liegt davor.
 *
 * ## Der Ablageort (R-13, E-018)
 *
 * Über Synchronisierungsordner ist viel entschieden worden: E-018 legt die
 * Vorgabe bewusst auf ein lokales Verzeichnis, T-036 warnt dreistufig beim
 * Exportordner. Für die Datei mit den Kundendaten selbst konnte bisher niemand
 * nachsehen, wo sie liegt.
 *
 * Die Ordnerwarnungen gelten hier sinngemäß — **ohne die Stufen**. Beim
 * Exportordner gibt es einen Knopf zu sperren und eine Rückfrage zu stellen;
 * hier gibt es weder das eine noch das andere, weil der Pfad nicht einstellbar
 * ist. Jeder Befund führt deshalb einen Handgriff außerhalb von Takt mit.
 *
 * ## Und die Einschränkung aus T-039, hier verschärft
 *
 * Zum Exportordner **belegt** der Dienst Merkmale beim Betriebssystem. Zu
 * dieser Datei tut er das nicht — es kommt nur der Pfad. Kein Befund heißt
 * deshalb „im Pfad steht nichts" und niemals „unbedenklich". Das steht so in
 * der Ansicht und nicht bloß in diesem Kommentar.
 */

/* ==================================================================== */
/* Der Name, unter dem abgerechnet wird                                 */
/* ==================================================================== */

export interface BillingUserFactProps {
  /** Wie der Dienst ihn meldet. Leer heißt: er meldet keinen. */
  readonly user: ForeignText;
  readonly className?: string;
}

export function BillingUserFact({ user, className }: BillingUserFactProps) {
  const name = user.trim();
  const labelId = useId();

  /*
   * Eine benannte Gruppe und keine lose Folge aus Beschriftung und Wert: Sonst
   * liest eine Vorlesehilfe im Sprungmodus einen Namen ohne die Beschriftung
   * davor — und ein Benutzername ohne die Zeile „Abgerechnet wird unter" ist
   * genau die Auskunft nicht, um die es hier geht.
   */
  return (
    <div
      className={cx("workstation__fact", className)}
      role="group"
      aria-labelledby={labelId}
    >
      <span className="overline" id={labelId}>
        Abgerechnet wird unter
      </span>

      {name.length === 0 ? (
        <InlineMessage tone="warning" title="Der Dienst nennt keinen Benutzernamen">
          <p>
            Ohne Namen lässt sich hier nicht nachsehen, wem die Abrechnung Ihre Arbeitszeit
            zuordnet. Im Export steht trotzdem einer — welcher, zeigt nach dem ersten Lauf das
            Exportprotokoll.
          </p>
          <p>
            Beenden Sie Takt und starten Sie die Anwendung über ihre Verknüpfung neu. Der Name
            kommt beim Start von der Anwendungshülle; fehlt er, ist der Dienst nicht auf dem
            üblichen Weg gestartet worden.
          </p>
        </InlineMessage>
      ) : (
        <>
          {/*
            Der Windows-Benutzername steht hier als **Wert** und nicht in einem
            Satz — und er geht unveraendert in jede Exportzeile (A-8.5, E-010).
            Seit T-122 weist der lokale Dienst einen Namen mit Steuer- oder
            Richtungszeichen beim Start ab; ein solcher Name kann diese Fassung
            der Anwendung also gar nicht erreichen. `Foreign` steht trotzdem
            hier: Die Anzeige eines Abrechnungswerts soll nicht davon abhaengen,
            dass eine andere Schicht ihre Pruefung behaelt (E-063).
          */}
          <p className="workstation__value mono" data-testid="billing-user">
            <Foreign value={name} />
          </p>
          <p className="workstation__body">
            Dieser Name steht in <strong>jeder Zeile jeder Exportdatei</strong>. Er sagt der
            Abrechnung, wessen Arbeitszeit sie vor sich hat.
          </p>
          <p className="workstation__source">
            <Icon name="shield" size={14} />
            <span>
              Takt bekommt ihn beim Start vom Betriebssystem, nicht aus einer Umgebungsvariablen:{" "}
              <span className="mono">set USERNAME=…</span> ändert ihn nicht, und über keine Route
              lässt er sich setzen. Deshalb steht er hier: nachzusehen ist er damit{" "}
              <strong>vor</strong> dem ersten Export und nicht erst danach im Exportprotokoll.
            </span>
          </p>
        </>
      )}
    </div>
  );
}

/* ==================================================================== */
/* Befunde zum Ablageort                                                */
/* ==================================================================== */

const IMPACT_LABEL: Readonly<Record<DatabaseLocationImpact, string>> = {
  confidentiality: "Die Kundendaten verlassen diesen Rechner",
  durability: "Der Bestand kann verlorengehen oder beschädigt werden",
};

interface DatabaseLocationConcernListProps {
  readonly concerns: readonly DatabaseLocationConcern[];
  readonly className?: string;
}

/**
 * Was am Ablageort auffällt — je Befund der Grund, der Beleg und der Handgriff.
 *
 * Alle Befunde tragen denselben Ton. Es gibt hier keine Stufen: Der Pfad ist
 * nicht einstellbar, also gibt es nichts, was ein lauterer Kasten verhindern
 * könnte. Unterschieden wird stattdessen, **worauf** ein Befund zielt —
 * Vertraulichkeit, Bestand oder beides.
 */
function DatabaseLocationConcernList({
  concerns,
  className,
}: DatabaseLocationConcernListProps) {
  if (concerns.length === 0) return null;

  return (
    <div className={cx("dbconcerns", className)}>
      {concerns.map((concern) => (
        <InlineMessage key={concern.kind} tone="warning" title={concern.title}>
          <p>{concern.body}</p>
          <p className="dbconcerns__remedy">
            <Icon name="arrow-up-right" size={14} />
            <span>{concern.remedy}</span>
          </p>
          <p className="dbconcerns__meta">
            <span className="dbconcerns__evidence-label">Gefunden im Pfad</span>
            <span className="mono">{concern.evidence}</span>
            <span className="dbconcerns__impacts">
              {concern.impacts.map((impact) => IMPACT_LABEL[impact]).join(" · ")}
            </span>
          </p>
        </InlineMessage>
      ))}
    </div>
  );
}

/* ==================================================================== */
/* Der Ablageort des Bestandes                                          */
/* ==================================================================== */

/** Welcher Pfad zuletzt kopiert wurde, und ob es geklappt hat. */
interface CopyFeedback {
  readonly path: string;
  readonly ok: boolean;
}

export interface DatabaseLocationFactProps {
  /** Wie der Dienst ihn meldet. `null` heißt: Bestand im Arbeitsspeicher. */
  readonly path: string | null;
  readonly className?: string;
}

export function DatabaseLocationFact({ path, className }: DatabaseLocationFactProps) {
  /*
   * Der kopierte Pfad und nicht bloß „kopiert": Ändert sich der Pfad, gehört
   * die Rückmeldung nicht mehr dazu. Ein `useEffect`, der einen Merker beim
   * Wechsel zurücksetzt, wäre derselbe Zustand — nur einen Bildaufbau später.
   */
  const [feedback, setFeedback] = useState<CopyFeedback | null>(null);
  const current = feedback !== null && feedback.path === path ? feedback : null;
  const labelId = useId();
  const valueId = `${labelId}-value`;

  const advice = useMemo(() => adviseDatabaseLocation(path ?? ""), [path]);

  return (
    <div
      className={cx("workstation__fact", className)}
      role="group"
      aria-labelledby={labelId}
    >
      <span className="overline" id={labelId}>
        Der Bestand liegt in
      </span>

      {path === null ? (
        <InlineMessage tone="info" title="Diese Fassung führt keine Datei">
          Der Bestand steht im Arbeitsspeicher: Alles, was Sie eintragen, ist beim Beenden weg. So
          läuft der Prüfbetrieb und die Musterseite des Designsystems. Im installierten Takt steht
          an dieser Stelle ein Pfad.
        </InlineMessage>
      ) : (
        <>
          <p className="workstation__value mono" id={valueId} data-testid="database-path" title={path}>
            {path}
          </p>
          <div className="workstation__row">
            <Button
              size="sm"
              variant="ghost"
              iconStart="copy"
              /* Damit der Knopf ansagt, **welchen** Pfad er kopiert. */
              aria-describedby={valueId}
              onClick={() => {
                void navigator.clipboard
                  .writeText(path)
                  .then(() => setFeedback({ path, ok: true }))
                  .catch(() => setFeedback({ path, ok: false }));
              }}
            >
              Pfad kopieren
            </Button>
            {/* Immer im Baum, damit die Vorlesehilfe eine Änderung bemerkt
                statt eines neu erscheinenden Elements. */}
            <span className="workstation__copyhint" role="status">
              {current === null
                ? ""
                : current.ok
                  ? "Kopiert."
                  : "Das Kopieren hat nicht geklappt — markieren Sie den Pfad von Hand."}
            </span>
          </div>
          <p className="workstation__body">
            In dieser einen Datei stehen alle Todos, Buchungen und Vermerke — im Klartext. Takt kann
            den Ort nicht verlegen: Er folgt dem Anwendungsdatenverzeichnis dieses Benutzers und ist
            über keine Einstellung verstellbar.
          </p>
          <p className="workstation__source">
            <Icon name="download" size={14} />
            <span>
              Zum Sichern: Takt beenden und den <strong>ganzen Ordner</strong> kopieren. Neben{" "}
              <span className="mono">takt.db</span> führt SQLite die Nachbardateien{" "}
              <span className="mono">-wal</span> und <span className="mono">-shm</span>; die Datei
              allein kann unvollständig sein.
            </span>
          </p>

          <DatabaseLocationConcernList concerns={advice.concerns} />

          <p className="workstation__limit">
            <Icon name="info" size={14} />
            <span>
              {advice.concerns.length === 0
                ? "Am Pfad ist nichts aufgefallen — das ist keine Entwarnung, sondern eine Nichtaussage: "
                : "Beurteilt wurde nur, was im Pfad steht. "}
              Zum <strong>Exportordner</strong> fragt der Dienst das Betriebssystem und belegt
              Merkmale; zu <strong>dieser Datei</strong> tut er das nicht. Ein zugeordnetes
              Netzlaufwerk wie <span className="mono">Z:\</span> und ein Ordner, den ein
              Synchronisierungsclient nach einer Umbenennung weiter überwacht, stehen in keinem
              Pfad.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
