import { MAX_NAME_LENGTH } from "@takt/domain";
import { useEffect, useState } from "react";
import { errorMessage } from "../api/client";
import { updatePool } from "../api/endpoints";
import type { DraftText, Pool } from "../api/types";
import { FormDialog, TextField } from "../components/FormDialog";
import { InlineMessage } from "../components/Primitives";
import { useRefresh } from "../app/RefreshContext";
import { useStructure } from "../app/StructureContext";
import { useToasts } from "../app/ToastContext";
import { useMutation } from "../app/useAsync";
import { quotedName } from "../lib/foreign";
import { POOL_PLACEMENT_SHORT } from "../lib/labels";

/**
 * Takt — eine Regel umbenennen (O-A, A-3.3, A-5.4, I-13, E-054, E-055).
 *
 * ---------------------------------------------------------------------------
 * Der Befund, den dieser Dialog schließt
 * ---------------------------------------------------------------------------
 *
 * T-052 hat gemeldet: Eine Spalte des Boards ließ sich über die Oberfläche
 * nicht umbenennen. Der Befund stammt aus der Zeit, in der eine Spalte ein
 * **Statuswert** war — `StatusColumnsDialog` zeigte den Namen als reines
 * `<span>`. Seit E-054 ist eine Spalte dieselbe Entität wie ein Pool, also eine
 * **Regel**, und ihr Name ließ sich seitdem nur noch dadurch ändern, dass man
 * das vollständige Regelformular öffnete: acht Abschnitte, fünf Achsen, eine
 * Vorschau. Für die Änderung eines Wortes.
 *
 * Das ist keine Bedienmöglichkeit, sondern ein Umweg, und er hat zwei Kosten:
 *
 *  1. **Er ist nicht auffindbar.** Wer eine Spalte umbenennen will, sucht
 *     „Umbenennen" — nicht „Regel bearbeiten". Dieselbe Handlung heißt in der
 *     Statusverwaltung (S-09) und in der Tagverwaltung (S-08) seit jeher
 *     „Umbenennen"; nur an der Spalte hieß sie anders.
 *  2. **Er schreibt mehr, als er soll.** Das Regelformular schickt beim
 *     Speichern **alle** Achsen mit. Wer es nur öffnet, um ein Wort zu ändern,
 *     schreibt dabei die ganze Regel neu. Dieser Dialog schickt `{ name }` und
 *     sonst nichts — `PATCH /pools/{poolId}` ist eine Teiländerung, und was
 *     nicht im Rumpf steht, bleibt (OpenAPI `PoolUpdate`).
 *
 * ---------------------------------------------------------------------------
 * Ein Dialog für beide Flächen, weil es eine Sache ist
 * ---------------------------------------------------------------------------
 *
 * „Spalte" und „Pool" sind seit E-054 **zwei Anzeigeorte derselben Regel** und
 * nicht zwei Dinge — sinngemäß derselbe Fall wie R-08 bei „Notiz": Zwei Wörter
 * für eine Sache sind der Bedienfehler und nicht die Lösung. Der Name gehört
 * der Regel; er steht gleichzeitig im Spaltenkopf, in der Pool-Liste, im
 * Pool-Filter der Todo-Liste und in jeder Meldung, die eine Poolbewegung nennt.
 *
 * Deshalb steht hier **ein** Dialog, und er sagt im Beschreibungssatz, welche
 * Flächen der neue Name trifft — abgelesen an `placement` und benannt mit
 * {@link POOL_PLACEMENT_SHORT}, damit kein dritter Wortlaut entsteht.
 *
 * ---------------------------------------------------------------------------
 * Die Zustände, und warum jeder einzeln dasteht (Abschnitt 15)
 * ---------------------------------------------------------------------------
 *
 * | Zustand | Was der Benutzer sieht |
 * |---|---|
 * | **Leer** | Feld leer: „Speichern" gesperrt, der Grund steht am Feld und nicht erst nach dem Klick. |
 * | **Unverändert** | Derselbe Name wie vorher: gesperrt, mit Grund. Ein `PATCH`, der nichts ändert, wäre eine Meldung ohne Ereignis. |
 * | **Vergeben** | Der Name einer anderen Regel, groß und klein gleichgesetzt: gesperrt, Grund am Feld. |
 * | **Lädt** | „Speichern" trägt den Anzeiger und behält seine Farbe (Designsystem 5: „arbeitet gerade" sieht nicht aus wie „geht nicht"). |
 * | **Fehler** | Die Meldung des Dienstes steht im Dialog, das Feld behält den eingegebenen Text. |
 *
 * Zeigefläche und Tastatur bringen `:hover`, `:active` und `:focus-visible`
 * unverändert aus `FormDialog`, `TextField` und `Button` mit — dieselben
 * Zustände wie an jeder anderen Fläche, weil es dieselben Bausteine sind.
 *
 * **Die Vorabprüfung auf einen vergebenen Namen ist die Erklärung, nicht die
 * Grenze.** Die zieht der Dienst: `ux_pool_name` ist ein eindeutiger Index über
 * `pool (name COLLATE NOCASE)`, und `PATCH /pools/{poolId}` antwortet mit
 * `409 name_conflict`. Dieselbe Bauart wie in `StatusSettings` — und mit
 * demselben Vorbehalt: Solange die Regelliste **nicht** geladen ist, wird hier
 * nichts behauptet ({@link PoolRenameDialogProps.existingKnown}). Eine Sperre
 * aus einer Liste, die es gerade nicht gibt, wäre eine Behauptung über einen
 * Bestand ohne Beleg.
 *
 * **Der Rückweg liegt in der Meldung und nicht in einem Bestätigungsdialog.**
 * Ein Umbenennen ist vollständig umkehrbar; ein Dialog davor kostete jedes Mal
 * einen Klick für einen Schaden, den es nicht gibt. Das ist die Abwägung aus
 * T-091, die auch „Vom Board nehmen" trägt (E-059).
 */

/**
 * Der Hinweis zum Zustand „unverändert" — **einmal**, für zwei Leser.
 *
 * Er stand bis T-220 als Zeichenkette in der Ternärkette von `fieldHint`. Seit
 * die Absage auf einen Absendeversuch denselben Satz weiterführt, hat er zwei
 * Leser, und zwei Abschriften desselben Satzes laufen beim nächsten
 * Sprachdurchgang auseinander — die eine wird geändert, die andere übersehen
 * (T-221 Z-74).
 */
const UNCHANGED_HINT = "Der Name ist unverändert. Ändern Sie ihn — oder schließen Sie den Dialog.";

export interface PoolRenameDialogProps {
  readonly open: boolean;
  /** Die Regel, die umbenannt wird. `null` heißt: Es steht kein Dialog. */
  readonly pool: Pool | null;
  /**
   * Alle Regeln beider Flächen, für die Vorabprüfung auf einen vergebenen
   * Namen. Leer ist zulässig; ob das „keine weitere Regel" oder „noch nicht
   * bekannt" heißt, sagt {@link existingKnown}.
   */
  readonly existing: readonly Pool[];
  /**
   * Steht der Bestand fest? `false`, solange die Struktur lädt oder ihr Abruf
   * fehlgeschlagen ist — dann wird kein Name als vergeben gemeldet.
   */
  readonly existingKnown: boolean;
  readonly onClose: () => void;
  /** Wird nach dem gelungenen `PATCH` mit der Antwort des Dienstes gerufen. */
  readonly onRenamed?: (pool: Pool) => void;
}

export function PoolRenameDialog({
  open,
  pool,
  existing,
  existingKnown,
  onClose,
  onRenamed,
}: PoolRenameDialogProps) {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();
  const mutation = useMutation();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(pool?.name ?? "");
  }, [open, pool]);

  /*
   * Nach den Haken und nicht davor: Die Reihenfolge der Haken muss über jeden
   * Durchlauf dieselbe sein. Ohne Regel gibt es nichts umzubenennen — und ein
   * Dialog, der seinen Gegenstand nicht kennt, hätte weder Titel noch Feld.
   */
  if (pool === null) return null;

  const trimmed = name.trim();
  const unchanged = trimmed === pool.name;
  /*
   * Groß und klein gelten als derselbe Name, weil der eindeutige Index es so
   * hält (`COLLATE NOCASE`). Die Regel steht sich dabei nicht selbst im Weg —
   * das sagt die OpenAPI-Beschreibung von `PATCH /pools/{poolId}` ausdrücklich,
   * und `entry.id !== pool.id` bildet es ab.
   */
  const key = trimmed.toLocaleLowerCase("de-DE");
  const taken =
    existingKnown &&
    existing.some(
      (entry) => entry.id !== pool.id && entry.name.toLocaleLowerCase("de-DE") === key,
    );

  const blocked = trimmed.length === 0 || unchanged || taken;

  const fieldError = taken
    ? "Diesen Namen trägt bereits eine andere Regel. Zwei Regeln mit demselben Namen wären im Spaltenkopf und in der Pool-Auswahl nicht auseinanderzuhalten."
    : undefined;

  const fieldHint =
    fieldError !== undefined
      ? undefined
      : trimmed.length === 0
        ? "Ohne Namen geht es nicht: Er ist das, woran diese Regel auf dem Board und in den Pools erkennbar ist."
        : unchanged
          ? UNCHANGED_HINT
          : "Der neue Name erscheint sofort überall, wo diese Regel genannt wird.";

  /**
   * Die Antwort auf einen Druck, den kein Feld beantwortet (T-211 Abschnitt
   * 13.3, freigegeben in T-221 Z-71; E-093 Punkt 5).
   *
   * Seit T-220 ist „Speichern" hier **weich** gesperrt: anklickbar, tabulierbar,
   * und die Eingabetaste kommt durch. Von den drei Sperrgründen dieses Dialogs
   * beantworten zwei den Versuch aus sich heraus:
   *
   *  - **vergeben** — {@link fieldError} steht, das Feld erklärt sich für
   *    ungültig, und der Versuch führt dorthin zurück;
   *  - **leer** — {@link fieldHint} sagt von der ersten Sekunde an, warum es
   *    ohne Namen nicht geht. Das ist P-9s zweite Hälfte, zustandsgebunden.
   *
   * Der dritte, **unverändert**, hatte bis hier einen Hinweis und keine Antwort:
   * Wer drückt und denselben Satz wie vorher liest, weiß nicht, ob der Druck
   * angekommen ist — der stille Zustandswechsel in seiner mildesten Form.
   *
   * **Ein Baustein, kein zweiter Satz.** Die Absage setzt ihren ersten Satz vor
   * {@link UNCHANGED_HINT} und schreibt ihn nicht ab; deshalb ist der Hinweis
   * seit dieser Änderung eine benannte Konstante und keine Zeichenkette in einer
   * Ternärkette (T-221 Z-74). Zwei Fassungen desselben Satzes liefen sonst beim
   * nächsten Sprachdurchgang auseinander.
   *
   * **Nicht durch den Fehlerkanal.** `TextField.error` setzte `aria-invalid` und
   * die Fehlerfarbe — an einem Wert, der gültig und der gespeicherte ist. Der
   * Satz geht deshalb an {@link FormDialogProps.submitRefusal} und von dort in
   * eine Statusfläche ohne `aria-invalid` (E-093 Punkt 5, T-221 Z-73).
   */
  const submitRefusal = unchanged ? `Es gibt nichts zu speichern. ${UNCHANGED_HINT}` : undefined;

  /**
   * Der `PATCH` samt Meldung und Rückweg.
   *
   * `previous` steht als Parameter da und wird nicht hinterher aus dem neu
   * geladenen Bestand geholt: Nach `structure.reload()` liegt dort bereits der
   * neue Name, und „Rückgängig" führte auf sich selbst zurück — derselbe
   * Fehler, den `setPlacement` in `BoardScreen` ausdrücklich vermeidet.
   */
  const rename = async (
    target: Pool,
    /*
     * `DraftText` und nicht `ForeignText`: Der Wert geht als **neuer Name** in
     * die Datenbank, und `PoolWrite.name` führt ihn genauso. Auf dem Rückweg
     * ist es der alte, fremde Name — und dass die Herkunft hier absichtlich
     * endet, steht damit im Typ und nicht in einem Kommentar (E-063 Punkt 1,
     * T-129 Abschnitt 4).
     */
    next: DraftText,
    restoring = false,
  ): Promise<void> => {
    const saved = await updatePool(target.id, { name: next });
    structure.reload();
    /*
      Der Name steht im Spaltenkopf, im Kartenetikett „Steht auch in …", im
      Pool-Filter der Todo-Liste und in jeder Bewegungsmeldung. Ohne dieses
      Signal zeigten sie den alten Namen, bis jemand neu lädt — und der
      Benutzer glaubte, das Umbenennen habe nicht gewirkt.
    */
    bump();
    toasts.show({
      tone: "success",
      title: restoring ? "Name wiederhergestellt." : "Regel umbenannt.",
      body: `Aus ${quotedName(target.name)} wurde ${quotedName(saved.name)}. Die Regel selbst ist unverändert; an den Todos ändert sich nichts.`,
      ...(restoring
        ? {}
        : {
            action: {
              label: "Rückgängig",
              onSelect: () => {
                /*
                  Der Rückweg läuft **außerhalb** von `mutation.run`, weil der
                  Dialog zu diesem Zeitpunkt zu ist: Sein Fehlerfeld gibt es
                  nicht mehr. Ein Fehlschlag gehört deshalb in eine Meldung —
                  und er darf nicht stumm bleiben, sonst wäre der Rückweg
                  genau der Ausgang, dessen Scheitern niemand sieht (O-AF).
                */
                void rename(saved, target.name, true).catch((cause: unknown) => {
                  toasts.failure(
                    "Der alte Name ließ sich nicht wiederherstellen",
                    errorMessage(cause),
                  );
                });
              },
            },
          }),
    });
    onRenamed?.(saved);
    onClose();
  };

  return (
    <FormDialog
      open={open}
      title={`${quotedName(pool.name)} umbenennen`}
      description={describeSurfaces(pool)}
      submitLabel="Speichern"
      submitDisabled={blocked}
      {...(submitRefusal === undefined ? {} : { submitRefusal })}
      busy={mutation.busy}
      error={mutation.error}
      onSubmit={() => {
        if (blocked) return;
        void mutation.run(() => rename(pool, trimmed));
      }}
      onCancel={onClose}
    >
      <TextField
        label="Name"
        value={name}
        onChange={setName}
        required
        /*
         * Die Zahl kommt aus `@takt/domain` und nicht aus dieser Datei (E-063
         * Punkt 4, T-128). `nameSchema` im lokalen Dienst liest dieselbe
         * Konstante. Ein hier abgeschriebener Wert wäre entweder strenger als
         * die Tür — dann ließe sich ein bereits getragener Name nicht mehr
         * vollständig eintippen — oder großzügiger, und dann wäre er ein
         * vorbereitetes 422.
         */
        maxLength={MAX_NAME_LENGTH}
        placeholder={pool.placement === "pool" ? "z. B. Kunden Nord" : "z. B. Wartet auf Rückmeldung"}
        {...(fieldError === undefined ? {} : { error: fieldError })}
        {...(fieldHint === undefined ? {} : { hint: fieldHint })}
      />

      <InlineMessage tone="info" title="Es ändert sich nur der Name">
        Die Regel bleibt, wie sie ist: dieselben erforderlichen und ausgeschlossenen Tags,
        derselbe Status, dasselbe „Erledigt“ und derselbe Exportstatus. Welche Karten hier
        stehen, ändert sich dadurch nicht.
      </InlineMessage>

      {/*
        Der Ladezustand der **Vorabprüfung**, ausgesprochen statt verschwiegen.
        Ohne die Regelliste lässt sich nicht sagen, ob ein Name vergeben ist —
        und zu schweigen hieße, Freiheit zu behaupten, für die es keinen Beleg
        gibt. Gespeichert werden kann trotzdem: Die Grenze zieht ohnehin der
        Dienst, und sein `409` steht danach im Fehlerbereich dieses Dialogs.
      */}
      {existingKnown ? null : (
        <InlineMessage tone="warning" title="Die vorhandenen Namen sind gerade nicht bekannt">
          Ob es diesen Namen schon gibt, lässt sich hier im Moment nicht sagen — die Liste der
          Regeln ist nicht geladen. Speichern geht trotzdem; ist der Name vergeben, weist der
          lokale Dienst ihn ab und der Grund steht danach hier.
        </InlineMessage>
      )}
    </FormDialog>
  );
}

/**
 * Welche Flächen der neue Name trifft, in einem Satz.
 *
 * Abgelesen an `placement` und nicht an der Ansicht, aus der der Dialog
 * geöffnet wurde: Eine Regel mit `both` steht auf beiden Flächen, gleich wo man
 * sie umbenennt — und wer das erst hinterher bemerkt, hält es für einen Fehler.
 */
function describeSurfaces(pool: Pool): string {
  switch (pool.placement) {
    case "board":
      return `Anzeigeort: ${POOL_PLACEMENT_SHORT.board}. Der Name steht im Kopf der Spalte; in den Pools erscheint diese Regel nicht.`;
    case "both":
      return `Anzeigeort: ${POOL_PLACEMENT_SHORT.both}. Der neue Name gilt für die Board-Spalte und für den Pool zugleich — es ist ein Name.`;
    default:
      return `Anzeigeort: ${POOL_PLACEMENT_SHORT.pool}. Der Name steht in der Pool-Liste und im Pool-Filter der Todo-Liste; auf dem Board erscheint diese Regel nicht.`;
  }
}
