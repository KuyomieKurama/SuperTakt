import type { TodoStatus } from "../../api/types";
import { Icon } from "../../shared/ui/Icon";
import { Button, IconButton } from "../../shared/ui/Primitives";
import { navigate } from "../../app/router";
import { plural } from "../../lib/format";
import { quotedName } from "../../lib/foreign";
import { Foreign } from "../../shared/ui/Foreign";
import type { MoveHandleKey } from "./StatusSettings";
/* ==================================================================== */
/* Eine Zeile der Verwaltung                                            */
/* ==================================================================== */

export interface StatusRowProps {
  readonly status: TodoStatus;
  readonly index: number;
  readonly last: boolean;
  /**
   * Wie viele Todos diesen Status tragen — oder warum die Zahl fehlt.
   * `"loading"` heißt „wird gerade gezählt", `"unknown"` „ließ sich nicht
   * zählen". Beide sperren das Löschen **nicht**: Dann entscheidet der Dienst.
   */
  readonly count: number | "loading" | "unknown";
  readonly busy: boolean;
  readonly isOnlyStatus: boolean;
  readonly registerHandle: (key: MoveHandleKey, node: HTMLButtonElement | null) => void;
  readonly onMove: (direction: -1 | 1) => void;
  readonly onRename: () => void;
  readonly onMakeDefault: () => void;
  readonly onRemove: () => void;
}

/**
 * Eine Zeile: Stelle, Name, Zahl der Todos, Standardwahl — und vier Wege.
 *
 * Der Grund einer Sperre steht **sichtbar in der Zeile** und nicht in einem
 * Titel-Attribut: Ein gesperrter Knopf ist nicht anspringbar, sein Titel also
 * für die Tastatur unerreichbar. Der Knopf verweist über `aria-describedby` auf
 * denselben Text, damit Vorlesewerkzeuge ihn beim Überfliegen der Zeile
 * mitnehmen.
 */
export function StatusRow({
  status,
  index,
  last,
  count,
  busy,
  isOnlyStatus,
  registerHandle,
  onMove,
  onRename,
  onMakeDefault,
  onRemove,
}: StatusRowProps) {
  const reasonId = `status-block-${status.id}`;

  /*
   * Warum sich dieser Status nicht löschen lässt — **alle** Gründe, nicht der
   * erste.
   *
   * Der Standard-Status mit Todos hat zwei davon, und wer nur einen liest,
   * räumt ihn aus und steht vor der nächsten Wand. Die Reihenfolge ist die, in
   * der sie sich beheben lassen: erst die Rolle abgeben, dann die Todos
   * umstellen.
   */
  const blockers: readonly string[] = [
    isOnlyStatus
      ? "Das ist der letzte Status. Es muss mindestens einen geben, sonst bekäme ein neues Todo keinen."
      : null,
    status.isDefault
      ? "Das ist der Standard für neue Todos. Bestimmen Sie zuerst einen anderen zum Standard — sonst wäre nicht mehr festgelegt, was ein neues Todo bekommt."
      : null,
    count === 1
      ? "Hier steht noch ein Todo. SuperTakt hängt es nicht von sich aus um; stellen Sie es zuerst auf einen anderen Status."
      : typeof count === "number" && count > 1
        ? `Hier stehen noch ${plural(count, "Todo", "Todos")}. SuperTakt hängt sie nicht von sich aus um; stellen Sie sie zuerst auf einen anderen Status.`
        : null,
  ].filter((reason): reason is string => reason !== null);

  const blocked = blockers.length > 0;

  return (
    <li className="status-admin__row">
      <span className="status-admin__position" aria-hidden="true">
        {index + 1}
      </span>

      <div className="status-admin__body">
        <p className="status-admin__name">
          <Foreign value={status.name} />
        </p>
        <p className="status-admin__meta">
          {count === "loading"
            ? "Todos werden gezählt …"
            : count === "unknown"
              ? "Anzahl unbekannt"
              : plural(count, "Todo", "Todos")}
          {status.isDefault ? " · Standard für neue Todos" : ""}
        </p>
        {/*
          Ruhig und nicht laut, obwohl es eine Sperre erklaert.

          Ein Status mit Todos ist der **Normalfall**, kein Zwischenfall — in
          einem eingerichteten Takt traegt fast jede Zeile hier einen Grund.
          Als getoentes Warnband gelesen waere der Bereich eine Wand aus Gelb,
          und die eine Meldung, die wirklich eine ist (der abgewiesene
          Loeschversuch im Bestaetigungsdialog), ginge darin unter. Sichtbar
          bleibt der Satz trotzdem: gemessener Text auf eigener Flaeche, mit
          Schloss davor.

          Der Ausweg steht **hier** und nicht in der Knopfreihe: Dort gehoerte
          er zu jeder Zeile, auch zu den freien, und fuehrte dann auf eine
          leere Liste. Nebenbei bleibt die Knopfreihe in jeder Zeile dieselbe.
        */}
        {!blocked ? null : (
          <div className="status-admin__blocked" id={reasonId}>
            <span className="status-admin__blocked-icon">
              <Icon name="lock" size={12} />
            </span>
            <div className="grow">
              {blockers.length === 1 ? (
                <p>{blockers[0]}</p>
              ) : (
                <ul className="status-admin__blocked-list">
                  {blockers.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
              {typeof count === "number" && count > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  iconStart="filter"
                  className="status-admin__blocked-action"
                  onClick={() => navigate("todos", undefined, { spalte: status.id })}
                >
                  {count === 1 ? "Dieses Todo anzeigen" : `Diese ${plural(count, "Todo", "Todos")} anzeigen`}
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/*
        Genau einer ist der Standard — deshalb eine Optionsgruppe und keine
        Reihe einzelner Schalter. Ein Auswahlknopf lässt sich nicht abwählen,
        nur weitergeben; das ist dieselbe Zusage, die `ux_todo_status_default`
        in der Datenbank gibt. Die Gruppenbeschriftung steht am `<ul>` darüber
        (`aria-label`), die Einzelbeschriftung nennt den Namen mit.

        Der Knopf wird waehrend der Anfrage **nicht** gesperrt, anders als die
        Pfeile daneben. Eine Optionsgruppe wird mit den Pfeiltasten bedient;
        ein Knopf, der im Augenblick seiner Betaetigung gesperrt wird, nimmt
        den Fokus mit in den Dokumentkoerper (SC 2.4.3). Ein zweiter Druck
        waehrend der Anfrage laeuft stattdessen ins Leere — `busy` faengt ihn
        im Handler ab. Dass etwas geschieht, sagt die Sperre der uebrigen
        Bedienelemente und danach die Meldung.
      */}
      <label className="status-admin__default">
        <input
          type="radio"
          name="takt-default-status"
          value={status.id}
          checked={status.isDefault}
          onChange={() => {
            if (busy || status.isDefault) return;
            onMakeDefault();
          }}
        />
        <span className="status-admin__default-text">
          Standard
          <span className="visually-hidden"> für neue Todos — {quotedName(status.name)}</span>
        </span>
      </label>

      <div className="status-admin__order">
        <IconButton
          ref={(node) => {
            registerHandle(`${status.id}:up`, node);
          }}
          icon="arrow-up"
          size="sm"
          label={`${quotedName(status.name)} nach oben`}
          disabled={busy || index === 0}
          onClick={() => onMove(-1)}
        />
        <IconButton
          ref={(node) => {
            registerHandle(`${status.id}:down`, node);
          }}
          icon="arrow-down"
          size="sm"
          label={`${quotedName(status.name)} nach unten`}
          disabled={busy || last}
          onClick={() => onMove(1)}
        />
      </div>

      <Button size="sm" variant="ghost" iconStart="pencil" disabled={busy} onClick={onRename}>
        Umbenennen
      </Button>

      {/*
        Der Name des Knopfes sagt die Sperre selbst, wie bei der mitgelieferten
        Exportvorlage (`TemplatesScreen`). Ein gesperrter Knopf ist nicht
        anspringbar; wer die Bedienelemente einer Seite mit einem Vorlesewerkzeug
        auflistet, liest so wenigstens **dass** es nicht geht. **Warum**, sagt
        der Satz in der Zeile, auf den `aria-describedby` zeigt.

        Kein `variant="danger"`: Vier bis sechs gefuellte rote Flaechen
        untereinander sind die lauteste Stelle einer Einstellungsseite, an der
        nichts Lautes passiert. Die Warnfarbe traegt der Bestaetigungsdialog,
        und dort traegt sie etwas.
      */}
      <IconButton
        icon="trash"
        size="sm"
        label={blocked ? `${quotedName(status.name)} löschen — derzeit nicht möglich` : `${quotedName(status.name)} löschen`}
        disabled={busy || blocked}
        {...(blocked ? { "aria-describedby": reasonId } : {})}
        onClick={onRemove}
      />
    </li>
  );
}
