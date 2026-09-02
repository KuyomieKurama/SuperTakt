import { useCallback, useEffect, useId, useState } from "react";
import { chooseExportDirectory, isShellPresent } from "../app/connection";
import { cx } from "../lib/cx";
import type {
  ExportDirectoryAdvice,
  ExportDirectoryConcern,
} from "../lib/exportDirectoryAdvice";
import type { ExportDirectoryState, ExportDirectoryTrait } from "../api/types";
import { TextField } from "./FormDialog";
import { Icon } from "./Icon";
import { Button, InlineMessage, type MessageTone } from "./Primitives";

/**
 * Takt — die Wahl des Exportordners in S-09 (Befund S-04, B-5.1 bis B-5.3).
 *
 * ## Warum das kein Textfeld mehr ist
 *
 * Der Traversierungsschutz im Dienst hält, das ist gemessen. Es ging nie um
 * einen Angriff, sondern um etwas Alltäglicheres: Ein Freitextfeld mit dem
 * Platzhalter `C:\Takt\Export` lädt dazu ein, den Pfad zu tippen — und wer
 * tippt, geht an jeder Überlegung vorbei, die E-018 angestellt hat. Die Datei,
 * die dort landet, enthält Kundennotizen in einer Kodierung, die wie Schutz
 * aussieht und keiner ist (A-8.9, R-05).
 *
 * In der Hülle wählt deshalb der Systemdialog. Im reinen Browser — `pnpm dev`
 * ohne Tauri — gibt es ihn nicht; dann bleibt das Textfeld, aber mit denselben
 * Prüfungen daneben.
 *
 * ## Drei Stufen, und keine davon ist ein Verbot ohne Grund
 *
 *   `warn`     steht da und erklärt. Kein Dialog, keine Sperre.
 *   `confirm`  hält beim Speichern an und fragt (der Dialog liegt im Bildschirm,
 *              nicht hier — er gehört zum Speichern, nicht zum Feld).
 *   `reject`   sperrt den Speichern-Knopf. Nur Systemverzeichnisse und
 *              Laufwerkswurzeln kommen so weit.
 *
 * E-011 bleibt: Der Benutzer wählt seinen Ordner. Er soll nur wissen, worauf
 * er sich einlässt.
 */

/* ==================================================================== */
/* Befunde anzeigen                                                     */
/* ==================================================================== */

const CONCERN_TONE: Readonly<Record<ExportDirectoryConcern["verdict"], MessageTone>> = {
  reject: "danger",
  confirm: "warning",
  warn: "warning",
};

export interface ExportDirectoryConcernListProps {
  readonly concerns: readonly ExportDirectoryConcern[];
  readonly className?: string;
}

/**
 * Die Befunde zu einem Ordner, jeder mit seinem Beleg.
 *
 * Steht in S-09 unter dem Feld und in S-07 neben dem Exportordner: Eine Warnung,
 * die nur in den Einstellungen steht, sieht beim Exportieren niemand — und das
 * ist der Moment, in dem die Datei entsteht.
 */
export function ExportDirectoryConcernList({
  concerns,
  className,
}: ExportDirectoryConcernListProps) {
  if (concerns.length === 0) return null;

  return (
    <div className={cx("dirconcerns", className)}>
      {concerns.map((concern) => (
        <InlineMessage key={concern.kind} tone={CONCERN_TONE[concern.verdict]} title={concern.title}>
          <p>{concern.body}</p>
          <p className="dirconcerns__evidence">
            <span className="dirconcerns__evidence-label">Gefunden im Pfad</span>
            <span className="mono">{concern.evidence}</span>
          </p>
        </InlineMessage>
      ))}
    </div>
  );
}

/* ==================================================================== */
/* Was das Betriebssystem über den Ordner sagt (T-039)                  */
/* ==================================================================== */

interface TraitText {
  readonly title: string;
  readonly body: string;
  readonly tone: "info" | "warning";
}

/**
 * Die vier belegbaren Befunde.
 *
 * Sie stehen **neben** der Auslegung aus dem Pfad und nicht an ihrer Stelle.
 * Der Unterschied ist der Wortlaut: Die Pfadheuristik sagt „liegt in" und
 * nennt ihren Beleg im Pfad; diese Liste sagt „ist" und beruft sich auf die
 * Auskunft des Betriebssystems (`%OneDrive%`, `%SystemRoot%`, `statfs`).
 */
const TRAIT_TEXT: Readonly<Record<ExportDirectoryTrait, TraitText>> = {
  unc: {
    title: "Der Ordner ist eine Netzfreigabe",
    body: "Der Pfad ist in UNC-Schreibweise geschrieben. Der Export schreibt dann über das Netz: Ist die Freigabe weg, schlägt der Lauf fehl — vollständig, ohne halbe Datei (A-8.8).",
    tone: "info",
  },
  network: {
    title: "Der Ordner liegt auf einem Netzdateisystem",
    body: "Belegt über die Art des Dateisystems, nicht über den Namen. Dasselbe gilt wie bei einer Freigabe: Ohne Verbindung kein Lauf.",
    tone: "info",
  },
  sync_folder: {
    title: "Der Ordner gehört einem Synchronisierungsdienst",
    body: "Sein Client meldet ihn selbst so — auch wenn der Ordner umbenannt wurde. Die Exportdatei enthält lesbare Kundennotizen (A-8.9); hier verlässt sie diesen Rechner, sobald sie geschrieben ist.",
    tone: "warning",
  },
  system_dir: {
    title: "Der Ordner ist ein Systemverzeichnis",
    body: "So benennt das Betriebssystem ihn selbst, unabhängig davon, auf welchem Laufwerk Windows liegt. Dorthin gehört nichts, was Takt schreibt.",
    tone: "warning",
  },
};

export interface ExportDirectoryTraitListProps {
  /** Was der Dienst belegen konnte. Leer heißt „nichts belegt". */
  readonly traits: readonly ExportDirectoryTrait[];
  /**
   * Der geprüfte Zustand. Nach `unreachable` fehlt `network` zwangsläufig,
   * und das gehört gesagt statt verschwiegen.
   */
  readonly state: ExportDirectoryState | null;
  readonly className?: string;
}

/**
 * Was am eingestellten Ordner **belegt** ist — und was ausdrücklich nicht.
 *
 * ## Warum die leere Liste einen eigenen Satz bekommt
 *
 * Ein zugeordnetes Netzlaufwerk (`Z:`) sieht der Dienst nicht: Es steht weder
 * im Pfad noch in einer Auskunft, die er bekommt; dafür bräuchte es
 * `GetDriveTypeW`. Eine leere Merkmalsliste bedeutet deshalb „nichts
 * gefunden" und nicht „unbedenklich" — und ausgerechnet der Fall, den sie
 * nicht sieht, ist der, vor dem gewarnt werden soll.
 *
 * Deshalb steht hier kein „alles in Ordnung". Es steht da, was geprüft wurde
 * und was dabei offen blieb. Ein beruhigender Satz an dieser Stelle wäre eine
 * Behauptung ohne Prüfung, und das ist schlimmer als gar keine Aussage.
 */
export function ExportDirectoryTraitList({
  traits,
  state,
  className,
}: ExportDirectoryTraitListProps) {
  if (state === null || state === "not_set") return null;

  return (
    <div className={cx("dirtraits", className)}>
      {traits.map((trait) => {
        const text = TRAIT_TEXT[trait];
        return (
          <InlineMessage key={trait} tone={text.tone} title={text.title}>
            <p>{text.body}</p>
            <p className="dirtraits__source">Belegt vom Betriebssystem, nicht aus dem Pfad gelesen.</p>
          </InlineMessage>
        );
      })}

      <p className="dirtraits__limit">
        <Icon name="info" size={14} />
        <span>
          {traits.length === 0
            ? "Am eingestellten Ordner ist nichts belegt worden. Das ist keine Entwarnung, sondern eine Nichtaussage: "
            : "Geprüft wurde außerdem: "}
          Ein <strong>zugeordnetes Netzlaufwerk</strong> wie <span className="mono">Z:\</span>{" "}
          erkennt Takt nicht — die Auskunft dazu bekommt der Dienst vom Betriebssystem nicht.
          {state === "unreachable"
            ? " Und weil dieser Ordner gerade nicht antwortet, konnte auch das Dateisystem nicht befragt werden; ob er im Netz liegt, ist damit offen."
            : ""}
        </span>
      </p>
    </div>
  );
}

/* ==================================================================== */
/* Der stehende Satz zu Base64 (B-6.1 Punkt 1)                          */
/* ==================================================================== */

/**
 * Der Satz, den S-07 in der Ansicht führen muss — nicht in einem Hilfetext.
 *
 * Er steht an genau zwei Stellen: dort, wo der Ordner gewählt wird, und dort,
 * wo die Datei entsteht. Beide Male derselbe Wortlaut, damit er wiedererkannt
 * und nicht zweimal gelesen wird.
 */
export function Base64Notice({ className }: { readonly className?: string }) {
  return (
    <p className={cx("base64note", className)}>
      <Icon name="lock" size={14} />
      <span>
        Die Exportdatei enthält <strong>lesbare Kundennotizen</strong>. Base64 ist eine Kodierung,
        keine Verschlüsselung — wer die Datei öffnen kann, kann sie lesen.
      </span>
    </p>
  );
}

/* ==================================================================== */
/* Das Feld                                                             */
/* ==================================================================== */

/** Der geprüfte Zustand des Ordners beim Dienst, in einem Satz (R-11). */
const DIRECTORY_STATE_TEXT: Readonly<Record<Exclude<ExportDirectoryState, "ok">, string>> = {
  not_set: "Noch nicht gewählt. Ohne Exportordner ist kein Export möglich.",
  missing: "Dieser Ordner ist nicht erreichbar. Takt legt ihn nicht von sich aus an.",
  not_writable: "Dieser Ordner ist da, aber Takt darf nicht hineinschreiben.",
  not_a_directory: "Dieser Pfad zeigt auf eine Datei, nicht auf einen Ordner.",
  // T-039: nicht als abwesend belegt, sondern ohne Antwort. Der Satz nennt
  // deshalb den anderen Handgriff.
  unreachable:
    "Dieser Ordner hat nicht innerhalb von drei Sekunden geantwortet. Das ist kein Beleg dafür, dass es ihn nicht gibt — bei einem Netzlaufwerk fehlt meist nur die Verbindung.",
};

export interface ExportDirectoryFieldProps {
  /** Der Pfad, wie er im Formular steht. Leer heißt: noch keiner. */
  readonly value: string;
  readonly onChange: (next: string) => void;
  /**
   * Das Urteil der Oberfläche über genau diesen Pfad. Kommt von außen, damit
   * der Bildschirm dasselbe Urteil für die Speichersperre benutzt und nicht
   * ein zweites, das auseinanderlaufen kann.
   */
  readonly advice: ExportDirectoryAdvice;
  /**
   * Das Urteil des **Dienstes** über den zuletzt gespeicherten Pfad (R-11).
   * `null`, solange die Einstellungen laden.
   */
  readonly serviceState: ExportDirectoryState | null;
  /**
   * Was der Dienst am gespeicherten Ordner **belegen** konnte (T-039).
   * Leer heißt „nichts belegt" und nie „unbedenklich".
   */
  readonly serviceTraits: readonly ExportDirectoryTrait[];
  /** Steht der angezeigte Pfad noch nicht in den gespeicherten Einstellungen? */
  readonly unsaved: boolean;
  readonly disabled?: boolean;
}

export function ExportDirectoryField({
  value,
  onChange,
  advice,
  serviceState,
  serviceTraits,
  unsaved,
  disabled = false,
}: ExportDirectoryFieldProps) {
  const labelId = useId();
  const pathId = `${labelId}-path`;
  const hintId = `${labelId}-hint`;

  /**
   * `null` heißt: noch nicht festgestellt. Drei Werte und kein `boolean`, damit
   * beim ersten Bild nicht das Textfeld aufblitzt, nur weil die Antwort noch
   * unterwegs ist.
   */
  const [shell, setShell] = useState<boolean | null>(null);
  const [picking, setPicking] = useState(false);
  /**
   * Was der Dialog zuletzt gesagt hat. Wird vorgelesen (`role="status"`) —
   * ohne das bleibt ein Abbruch für einen Screenreader ein Klick ohne Folge.
   */
  const [announcement, setAnnouncement] = useState("");
  /** Der Dialog steht nicht zur Verfügung, obwohl eine Hülle da ist. */
  const [pickerFailure, setPickerFailure] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void isShellPresent().then((present) => {
      if (live) setShell(present);
    });
    return () => {
      live = false;
    };
  }, []);

  const pick = useCallback(() => {
    setPicking(true);
    setAnnouncement("");
    void chooseExportDirectory(value.trim().length === 0 ? null : value.trim())
      .then((choice) => {
        if (choice.outcome === "chosen") {
          setPickerFailure(null);
          onChange(choice.path);
          setAnnouncement(`Ordner gewählt: ${choice.path}. Zum Übernehmen speichern.`);
          return;
        }
        if (choice.outcome === "cancelled") {
          setPickerFailure(null);
          setAnnouncement("Auswahl abgebrochen. Der bisher eingestellte Ordner bleibt.");
          return;
        }
        // Der Grund geht **nur** in die Meldung darunter. Beide zu setzen
        // hiesse, denselben Satz zweimal auf den Bildschirm und zweimal in die
        // Ansage zu stellen — `InlineMessage` ist selbst ein Meldebereich.
        setPickerFailure(choice.reason);
      })
      .finally(() => setPicking(false));
  }, [onChange, value]);

  /*
   * Das Textfeld ist der Rückfallweg, nicht die Regel: ohne Hülle, oder wenn
   * der Dialog in dieser Fassung nicht zu öffnen war. Solange die Antwort auf
   * die Hüllenfrage aussteht, wird keines von beiden gezeigt — ein Feld, das
   * nach einem Lidschlag verschwindet, ist schlimmer als eines, das erst
   * erscheint.
   */
  const useTextField = pickerFailure !== null || shell === false;
  const serviceProblem =
    serviceState === null || serviceState === "ok" || unsaved
      ? null
      : DIRECTORY_STATE_TEXT[serviceState];

  return (
    <div className="dirfield">
      {useTextField ? (
        <TextField
          label="Exportordner"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder="z. B. C:\Takt\Export"
          hint="Vollständiger Pfad. Die geschriebene Datei liegt immer innerhalb dieses Ordners — Takt schreibt niemals daneben."
          {...(serviceProblem === null ? {} : { error: serviceProblem })}
        />
      ) : (
        <div className="field">
          <span className="field__label" id={labelId}>
            Exportordner
          </span>
          {/* Eine Gruppe und kein `<output>`: Ein `output` ist von sich aus
              ein Meldebereich und liest jede Aenderung vor — der gewaehlte
              Pfad stuende dann zweimal in der Ansage, einmal hier und einmal
              in `dirfield__announce`, das den Satz drumherum hat. */}
          <div className="dirfield__row" role="group" aria-labelledby={labelId}>
            <span
              className={cx("dirfield__path", "mono", value.length === 0 && "dirfield__path--empty")}
              id={pathId}
              {...(value.length === 0 ? {} : { title: value })}
            >
              {value.length === 0 ? "Noch nicht gewählt" : value}
            </span>
            <Button
              variant="secondary"
              iconStart="folder-open"
              loading={picking}
              disabled={disabled || shell === null}
              aria-describedby={`${pathId} ${hintId}`}
              onClick={pick}
            >
              {value.length === 0 ? "Ordner wählen …" : "Anderen Ordner wählen …"}
            </Button>
          </div>
          <p className="field__hint" id={hintId}>
            Der Ordner wird im Dialog des Betriebssystems gewählt und nicht getippt. Die
            geschriebene Datei liegt immer innerhalb dieses Ordners — Takt schreibt niemals
            daneben.
          </p>
          {serviceProblem === null ? null : (
            <p className="field__error">{serviceProblem}</p>
          )}
        </div>
      )}

      {/* Die Rückmeldung des Dialogs. Immer im Baum, damit die Vorlesehilfe
          eine Änderung bemerkt statt eines neu erscheinenden Elements. */}
      <p className="dirfield__announce" role="status" aria-live="polite">
        {announcement}
      </p>

      {pickerFailure === null ? null : (
        <InlineMessage tone="info" title="Der Ordnerauswahldialog steht hier nicht zur Verfügung">
          {pickerFailure} Tragen Sie den vollständigen Pfad von Hand ein — Takt prüft ihn genauso.
        </InlineMessage>
      )}

      {shell === false ? (
        <InlineMessage tone="info" title="Takt läuft gerade ohne seine Anwendungshülle">
          Im Browser allein gibt es keinen Ordnerauswahldialog des Betriebssystems. In der
          installierten Anwendung wird der Ordner ausgewählt statt eingetippt.
        </InlineMessage>
      ) : null}

      {unsaved && value.trim().length > 0 && advice.verdict !== "reject" ? (
        <p className="dirfield__pending">
          <Icon name="info" size={14} />
          <span>Noch nicht übernommen — mit „Speichern“ wird dieser Ordner eingestellt.</span>
        </p>
      ) : null}

      <ExportDirectoryConcernList concerns={advice.concerns} />

      {/*
        Die Merkmale beziehen sich auf den **gespeicherten** Ordner. Solange
        ein anderer Pfad im Feld steht, würden sie über etwas reden, das dort
        nicht mehr zu sehen ist.
      */}
      {unsaved ? null : (
        <ExportDirectoryTraitList traits={serviceTraits} state={serviceState} />
      )}

      {serviceState === "ok" && !unsaved ? (
        <p className="field__hint">
          {/*
            Der Satz sagt genau das, was geprüft ist: vorhanden und
            beschreibbar. Er sagt ausdrücklich **nicht** „der Ordner ist in
            Ordnung" — was am Ordner sonst noch dranhängt, steht darüber, und
            was Takt nicht sehen kann, steht dort ebenfalls (T-039).
          */}
          <Icon name="check-circle" size={12} /> Der Ordner ist vorhanden und beschreibbar —
          soeben geprüft. Vor jedem Exportlauf wird er erneut geprüft.
        </p>
      ) : null}

      <Base64Notice />
    </div>
  );
}
