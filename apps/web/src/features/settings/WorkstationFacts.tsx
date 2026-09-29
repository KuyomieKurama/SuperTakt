import type { ForeignText } from "../../api/types";
import { useId, useMemo, useState } from "react";
import { cx } from "../../lib/cx";
import {
  adviseDatabaseLocation,
  type DatabaseLocationConcern,
} from "./databaseLocationAdvice";
import { Icon } from "../../shared/ui/Icon";
import { Button, InlineMessage } from "../../shared/ui/Primitives";
import { Foreign } from "../../shared/ui/Foreign";
import { useLanguage } from "../../lib/language";
import { settingsTexts } from "./texts";

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
 * For the export folder the service proves traits with the operating system.
 * For this file it only measures the access rights (A-28.8); everything else
 * comes from the path. No finding therefore means "nothing in the path", never
 * "harmless" — and the view says so, not only this comment.
 */

/* Der Name, unter dem abgerechnet wird                                 */

export interface BillingUserFactProps {
  /** Wie der Dienst ihn meldet. Leer heißt: er meldet keinen. */
  readonly user: ForeignText;
  readonly className?: string;
}

export function BillingUserFact({ user, className }: BillingUserFactProps) {
  const name = user.trim();
  const labelId = useId();
  const text = settingsTexts();

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
        {text.billedAs}
      </span>

      {name.length === 0 ? (
        <InlineMessage tone="warning" title={text.noUserName}>
          <p>{text.noUserNameBody}</p>
          <p>{text.noUserNameRemedy}</p>
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
            {text.userNameBefore}
            <strong>{text.userNameStrong}</strong>
            {text.userNameAfter}
          </p>
          <p className="workstation__source">
            <Icon name="shield" size={14} />
            <span>
              {text.userNameSourceBefore}
              <span className="mono">set USERNAME=…</span>
              {text.userNameSourceMiddle}
              <strong>{text.userNameSourceStrong}</strong>
              {text.userNameSourceAfter}
            </span>
          </p>
        </>
      )}
    </div>
  );
}

/* Befunde zum Ablageort                                                */


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
  const text = settingsTexts();

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
            <span className="dbconcerns__evidence-label">{text.foundInPath}</span>
            <span className="mono">{concern.evidence}</span>
            <span className="dbconcerns__impacts">
              {concern.impacts.map((impact) => text.impact[impact]).join(" · ")}
            </span>
          </p>
        </InlineMessage>
      ))}
    </div>
  );
}

/* Der Ablageort des Bestandes                                          */

/** Welcher Pfad zuletzt kopiert wurde, und ob es geklappt hat. */
interface CopyFeedback {
  readonly path: string;
  readonly ok: boolean;
}

export interface DatabaseLocationFactProps {
  /** Wie der Dienst ihn meldet. `null` heißt: Bestand im Arbeitsspeicher. */
  readonly path: string | null;
  /**
   * How many data files are more open than `0600` (A-28.8). `null` or `0` shows nothing:
   * "not measurable" is not a finding.
   */
  readonly filesTooPermissive?: number | null;
  readonly className?: string;
}

export function DatabaseLocationFact({ path, filesTooPermissive = null, className }: DatabaseLocationFactProps) {
  /*
   * Der kopierte Pfad und nicht bloß „kopiert": Ändert sich der Pfad, gehört
   * die Rückmeldung nicht mehr dazu. Ein `useEffect`, der einen Merker beim
   * Wechsel zurücksetzt, wäre derselbe Zustand — nur einen Bildaufbau später.
   */
  const [feedback, setFeedback] = useState<CopyFeedback | null>(null);
  const current = feedback !== null && feedback.path === path ? feedback : null;
  const labelId = useId();
  const valueId = `${labelId}-value`;

  const language = useLanguage();
  // `language`: the advice carries sentences of the UI language.
  const advice = useMemo(() => adviseDatabaseLocation(path ?? ""), [path, language]);
  const text = settingsTexts();

  return (
    <div
      className={cx("workstation__fact", className)}
      role="group"
      aria-labelledby={labelId}
    >
      <span className="overline" id={labelId}>
        {text.dataLiesIn}
      </span>

      {path === null ? (
        <InlineMessage tone="info" title={text.noFile}>
          {text.noFileBody}
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
              {text.copyPath}
            </Button>
            {/* Immer im Baum, damit die Vorlesehilfe eine Änderung bemerkt
                statt eines neu erscheinenden Elements. */}
            <span className="workstation__copyhint" role="status">
              {current === null
                ? ""
                : current.ok
                  ? text.copied
                  : text.copyPathFailed}
            </span>
          </div>
          <p className="workstation__body">
            {text.oneFileBody}
          </p>
          <p className="workstation__source">
            <Icon name="download" size={14} />
            <span>
              {text.backupBefore}
              <strong>{text.backupStrong}</strong>
              {text.backupMiddle}
              <span className="mono">takt.db</span>
              {text.backupSidecars}
              <span className="mono">-wal</span>
              {text.and}
              <span className="mono">-shm</span>
              {text.backupAfter}
            </span>
          </p>

          {/*
            First: measured on the file, while the concerns below are inferred from the
            path (welle-18.md 6). No path and no file names in the text (B-2.4 point 4).
          */}
          {filesTooPermissive !== null && filesTooPermissive > 0 ? (
            <div className="dbconcerns">
              <InlineMessage tone="warning" title={text.permissionsTitle}>
                <p>{text.permissionsBody}</p>
                <p className="dbconcerns__remedy">
                  <Icon name="arrow-up-right" size={14} />
                  <span>{text.permissionsRemedy}</span>
                </p>
              </InlineMessage>
            </div>
          ) : null}

          <DatabaseLocationConcernList concerns={advice.concerns} />

          <p className="workstation__limit">
            <Icon name="info" size={14} />
            <span>
              {advice.concerns.length === 0 ? text.pathNothing : text.pathOnlyJudged}
              {text.limitBefore}
              <strong>{text.limitExportStrong}</strong>
              {text.limitMiddle}
              <strong>{text.limitFileStrong}</strong>
              {text.limitDrive}
              <span className="mono">Z:\</span>
              {text.limitAfter}
            </span>
          </p>
        </>
      )}
    </div>
  );
}
