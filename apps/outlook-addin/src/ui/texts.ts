/**
 * Bundled task pane texts (E-118). German today; the language switch for the
 * add-in follows later (F-23, E-120), so new sentences are added here as keys
 * instead of being written into JSX.
 */
export const TEXTS = Object.freeze({
  // Add-in only: the deadline is never read from the mail (E-074 point 4).
  deadlineHintAddinPrefix: 'SuperTakt liest die Frist nicht aus der E-Mail — Sie tragen sie selbst ein.',
  // Shared core, character-identical with the main application (O-GF, T-393);
  // `proof:addin` section 19d compares both bundles.
  deadlineHintCore:
    'Ein Kalendertag, die Uhrzeit ist optional. Überfällig ist die Frist erst ab dem Folgetag. ' +
    'Leer lassen heißt: keine Frist. Sie ändert nichts an Pools, Spalten, Buchungen oder Export.',
  // The time sits in the deadline's field group (A-19.2: one word for the thing, T-391c point 3).
  deadlineTimeLabel: 'Uhrzeit der Frist (optional)',

  // Outcome of a failed or cancelled submit (A-10.16). Creating keeps SP-A-32 word for word.
  failureNothingCreated: 'Es ist kein Todo entstanden.',
  failureNothingAppended: 'Die E-Mail wurde nicht angehängt.',
  // The request may have reached SuperTakt; the persistent request id prevents duplicates (A-10.13).
  failureCreateUnknown:
    'Ob das Todo entstanden ist, lässt sich hier nicht feststellen. Ein erneuter Versuch legt es nicht doppelt an.',
  failureAppendUnknown:
    'Ob die E-Mail angehängt wurde, lässt sich hier nicht feststellen. Ein erneuter Versuch hängt sie nicht doppelt an.',
  // The unknown-outcome sentence above already promises a safe retry, so this one only keeps the inputs (T-414 Y-2).
  failureInputsKept: 'Die Eingaben bleiben stehen.',
  failureInputsKeptRetry: 'Die Eingaben bleiben stehen. Ein neuer Versuch ist möglich.',
  failureUnexpected: 'Die Übernahme ist fehlgeschlagen.',
  cancelledCreate: 'Abgebrochen. Es ist kein Todo entstanden. Die Eingaben bleiben stehen.',
  cancelledAppend: 'Abgebrochen. Die E-Mail wurde nicht angehängt. Die Eingaben bleiben stehen.',

  // Main button and its section (E-029: the leading term is „Todo").
  createSectionTitle: 'Neues Todo',
  appendSectionTitle: 'E-Mail anhängen',
  createButton: 'Neues Todo anlegen',
  appendButton: 'E-Mail an Todo anhängen',
  appendKeepsTodo: 'Felder und vorhandene Notizen des Todos bleiben erhalten. Eigene Ergänzungen stehen bei dieser E-Mail.',
  poolsNote: 'Status und Tags bestimmen, in welchen regelbasierten Pools das Todo erscheint.',
  appendedSpoken: 'E-Mail zum Todo ergänzt.',

  // Duplicate offer (A-10.11, A-10.16).
  offerOneLegend: 'Passendes Todo',
  offerManyLegend: 'Mehrere passende Todos – bitte auswählen',
  // Split around the call number, which is rendered through <Foreign> (T-414 Y-3).
  offerNoneBefore: 'Zu Call ',
  offerNoneAfter: ' gibt es noch kein Todo.',
  offerFoundOneBefore: 'Zu dieser Call-Nummer (',
  offerFoundOneAfter: ') gibt es ein passendes Todo.',
  offerFoundMany: 'Zu dieser Call-Nummer gibt es mehrere passende Todos.',
  offerAppendNote:
    'Die E-Mail wird als Anhang am ausgewählten Todo gespeichert. Das Ergänzen erfasst keine Zeit und lässt erledigte Todos erledigt.',
  offerOptionPrefix: 'Zum Todo ergänzen:',
  offerOptionCall: 'Call',
  offerOptionDone: 'Erledigt',
  offerCreateInstead: 'Stattdessen neues Todo anlegen',
});
