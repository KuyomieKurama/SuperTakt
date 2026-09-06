import { createContext, useContext } from "react";

/**
 * Der wievielte Absendeversuch — für die Felder **innerhalb** eines Formulars.
 *
 * ## Warum es diesen Zähler gibt (E-093, T-220)
 *
 * Bis T-220 trug der Absendeknopf eines {@link FormDialog} bei gesperrtem
 * Formular ein echtes `disabled`. Damit war er der **gesperrte Standardknopf**
 * des Formulars — und eine gesperrte Standardschaltfläche nimmt der
 * stillschweigenden Absendung über die Eingabetaste ihre Wirkung. Wer im frisch
 * geöffneten Dialog „Neuen Tag anlegen" Enter drückte, löste nichts aus und
 * hörte nichts.
 *
 * Das ist **gemessen**, nicht gerechnet (visual-qa, T-217, Chromium, gegen die
 * laufende Anwendung): kein Netzaufruf an den Dienst, leerer Text in jedem
 * `role="alert"` des Dialogs, bitgleiche Dialogansicht vor und nach der Taste.
 * Die Gegenprobe mit einem ausgefüllten Feld löste dieselbe Taste sofort aus —
 * die Sperre war die alleinige Ursache.
 *
 * Seit T-220 ist der Knopf `aria-disabled` statt `disabled`: sichtbar gesperrt,
 * aber tabulierbar und anklickbar (dieselbe Bauart wie im
 * `ConfirmDialog` seit T-186). Der Riegel gegen die **Handlung** liegt zentral
 * im `submit` des Formulars; die Eingabetaste erreicht ihn jetzt.
 *
 * ## Warum ein Zähler und nicht ein Rückruf je Dialog
 *
 * Damit ein Absendeversuch etwas **zeigt**, muss das leere Pflichtfeld sich für
 * ungültig erklären — sonst findet `revealFirstInvalidWithin` nichts und der
 * Versuch bliebe stumm. Die Berührung („touched") liegt aber im Zustand der
 * aufrufenden Ansicht, nicht im Feld.
 *
 * Der naheliegende Weg wäre ein `onBlockedSubmit` je Dialog gewesen: acht
 * Aufrufstellen, und genau die Abhängigkeit von einer fernen Stelle, die T-207
 * an {@link touchedOnBlur} gerade beseitigt hat. Ein Zähler im Zusammenhang,
 * den `TextField` selbst liest, kostet **null** Änderungen je Dialog — und er
 * ist wörtlich der zweite Umsetzungssatz von Regel P-8:
 *
 * > Ein Absendeversuch setzt `touched` weiterhin **immer**.
 *
 * ## Warum eine Zahl und kein `boolean`
 *
 * Aus demselben Grund wie bei `submitAttempt` in `FormDialog`: Ein zweiter
 * Versuch ohne jede Änderung dazwischen soll wieder wirken. Ein Schalter, der
 * schon `true` ist, ändert sich nicht mehr und löst keinen Effekt aus.
 *
 * `0` heißt: kein Versuch. Der Wert wird beim Schließen des Dialogs
 * zurückgesetzt — ein geschlossener Dialog hat keinen Versuch hinter sich.
 */
export const SubmitAttemptContext = createContext(0);

/**
 * Der Zählerstand für ein Feld innerhalb eines Formulars.
 *
 * Außerhalb eines {@link FormDialog} ist der Wert `0` und bleibt es. Ein Feld,
 * das nicht in einem Formular steht, hat keinen Absendeversuch — und der Wert
 * `0` sagt genau das, statt eine Sonderbehandlung zu verlangen.
 */
export function useSubmitAttempt(): number {
  return useContext(SubmitAttemptContext);
}
