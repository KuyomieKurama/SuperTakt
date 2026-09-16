/** Ordner müssen vor der Regelauswertung aufgelöst sein. Die SQL-Mitgliederabfrage muss dieselben Regeln anwenden. */

import type { PoolId, StatusId, TagFolderId, TagId, Timestamp } from './kernel.ts';

// Pools (A-3.1 bis A-3.4)

/**
 * Ordnerterme werden vor der Auswertung zu Tagmengen aufgelöst; der Status ist eine eigene
 * Regelachse.
 */
export type PoolTagTerm =
  | { readonly kind: 'tag'; readonly tagId: TagId }
  | { readonly kind: 'folder'; readonly folderId: TagFolderId };

/**
 * Der Name aus der Zeit, als eine Regel **nur** aus solchen Termen bestand.
 *
 * Derselbe Typ, nicht ein zweiter daneben. Er bleibt stehen, weil an ihm
 * Aufrufer in fremder Hoheit hängen (`apps/web`, die Prüfpfade); wer neu
 * schreibt, nimmt {@link PoolTagTerm}, weil der Name sagt, was der Term
 * bezeichnet.
 */
export type PoolRuleTerm = PoolTagTerm;

/**
 * Gilt nur für erforderliche Tags. Ausschlüsse bedeuten immer „keines“, Statusbedingungen „einer
 * davon“.
 */
export type PoolMatchMode = 'any' | 'all';

/**
 * Eine ausdrückliche Erledigt-Bedingung entscheidet über Zugehörigkeit und geht dem
 * Sichtbarkeitsfilter `includeCompleted` vor.
 */
export type PoolCompletionFilter = 'any' | 'done' | 'open';

/**
 * `open` und `exported` prüfen das Vorhandensein entsprechender Buchungen; ein Todo kann beide
 * Bedingungen erfüllen.
 */
export type PoolExportFilter = 'any' | 'open' | 'exported';

export type PoolPlacement = 'pool' | 'board' | 'both';

export type PoolSurface = 'pool' | 'board';

/**
 * Die Achsen werden mit UND verknüpft. Eine vollständig neutrale Regel trifft nichts.
 * Mitgliedschaften werden bei jeder Abfrage berechnet und nicht gespeichert.
 */
export interface Pool extends PoolRuleAxes {
  readonly id: PoolId;
  readonly name: string;
  /** Gilt ausschließlich für die erforderlichen Tags in `rule`. */
  readonly matchMode: PoolMatchMode;
  /**
   * Bei Termen der Art `folder` zählen auch die Tags in dessen Unterordnern,
   * beliebig tief. Gilt für **beide** Taglisten — eine getrennte Tiefe je
   * Liste wäre eine zweite Wahrheit über denselben Baum.
   */
  readonly includeSubfolders: boolean;
  /**
   * Wo diese Regel erscheint (E-054). Siehe {@link PoolPlacement}.
   *
   * Die Vorgabe ist `pool`. Migration 0009 setzt sie auf jede vorhandene
   * Zeile: Nach der Aktualisierung ist jede bestehende Regel weiterhin ein
   * Pool und keine davon eine Spalte. Das Board ist danach leer, bis jemand
   * eine Spalte einrichtet — sichtbar leer, nicht heimlich gefüllt.
   */
  readonly placement: PoolPlacement;
  /**
   * Reihenfolge. Sie gilt für **beide** Flächen: Die Pool-Liste zeigt die
   * Regeln mit `placement` `pool`/`both` nach Position, das Board die mit
   * `board`/`both` nach derselben Position. Eine zweite Positionsspalte je
   * Fläche wäre eine zweite Wahrheit über dieselbe Ordnung.
   */
  readonly position: number;
  /** Erforderliche Tags; eine leere Liste schränkt diese Achse nicht ein. */
  readonly rule: readonly PoolTagTerm[];
  /**
   * **Ausgeschlossene** Tags (T-076). Trägt das Todo eines davon, gehört es
   * nicht dazu — ganz gleich, was die übrigen Felder sagen.
   *
   * Das ist die Bedingung, die eine Liste gleichartiger Terme nicht ausdrücken
   * konnte: Sie hat keinen Platz für „nicht". Deshalb eine zweite Liste und
   * kein Term mit einem Vorzeichen.
   */
  readonly excludedTags: readonly PoolTagTerm[];
  /**
   * Status, von denen das Todo **einen** tragen muss (T-076). Leer heißt
   * „Alle" — die Achse schränkt dann nicht ein.
   *
   * Mehrere sind ausdrücklich zulässig: Eine Spalte soll mehrere Status
   * umfassen können (E-054). Ein „alle davon" gibt es hier nicht, siehe
   * `matchMode`.
   */
  readonly statusIds: readonly StatusId[];
  /** Die Erledigt-Achse (T-076). Siehe {@link PoolCompletionFilter}. */
  readonly completion: PoolCompletionFilter;
  /** Die Exportstatus-Achse (T-076). Siehe {@link PoolExportFilter}. */
  readonly exportState: PoolExportFilter;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * Neutrale Achsen schränken nicht ein; eine vollständig neutrale Regel trifft nichts.
 * Ein nicht aufgelöster erforderlicher Term verhindert jeden Treffer. Fehlende Angaben zur Karte
 * erfüllen keine entsprechende Bedingung.
 */
export type MatchesPool = (input: MatchesPoolRule & MatchesPoolCandidate) => boolean;

/** `POOL_RULE_AXIS_OF_FIELD` muss jedes neue Regelfeld einer Achse zuordnen. */
export interface MatchesPoolRule {
  /** Die **erforderlichen** Tags der Regel, aufgelöst. Leer: schränkt nicht ein. */
  readonly ruleTagIds: readonly TagId[];
  /** Wie `ruleTagIds` verknüpft ist. Gilt für keine andere Achse. */
  readonly matchMode: PoolMatchMode;
  /** Die **ausgeschlossenen** Tags der Regel, aufgelöst. Leer: schränkt nicht ein. */
  readonly excludedTagIds?: readonly TagId[] | undefined;
  /** Die Status der Regel. Leer oder weggelassen heißt „Alle". */
  readonly ruleStatusIds?: readonly StatusId[] | undefined;
  /** Die Erledigt-Achse der Regel. Weggelassen ist `any`. */
  readonly completion?: PoolCompletionFilter | undefined;
  /** Die Exportstatus-Achse der Regel. Weggelassen ist `any`. */
  readonly exportState?: PoolExportFilter | undefined;
  /**
   * Schon ein erforderlicher Ordner ohne Tags verhindert jeden Treffer, auch neben aufgelösten
   * Termen.
   * Die flache Tagmenge kann diesen Zustand nicht ausdrücken; deshalb muss der Aufrufer ihn
   * ausdrücklich angeben.
   */
  readonly unresolvedRequired: boolean;
}

/**
 * Die **Kartenseite** der Eingabe von {@link MatchesPool}.
 *
 * Alles außer den Tags ist freiwillig, und was fehlt, lässt eine Achse, die
 * danach fragt, **nicht** treffen. Die Begründung steht an {@link MatchesPool}.
 */
export interface MatchesPoolCandidate {
  readonly todoTagIds: readonly TagId[];
  /**
   * Der Status der Karte. Jedes Todo trägt genau einen (`todo.status_id` ist
   * NOT NULL); `null` oder weggelassen heißt „dieser Aufrufer kennt ihn nicht",
   * nicht „diese Karte hat keinen".
   */
  readonly todoStatusId?: StatusId | null | undefined;
  /** `null` bedeutet unerledigt (A-2.4). Weggelassen: dem Aufrufer unbekannt. */
  readonly completedAt?: Timestamp | null | undefined;
  /** Hat die Karte mindestens eine abgeschlossene, offene Buchung? */
  readonly hasOpenEntries?: boolean | undefined;
  /** Hat die Karte mindestens eine exportierte Buchung? */
  readonly hasExportedEntries?: boolean | undefined;
}

/**
 * Listen werden nur nach ihrer Länge beurteilt, sowohl vor als auch nach der Ordnerauflösung.
 * Alle Achsen sind Pflicht, damit Erweiterungen an jeder aufrufenden Stelle berücksichtigt werden.
 */
export interface PoolRuleAxes {
  /** Erforderliche Tags — Terme oder aufgelöste Tagkennungen. */
  readonly rule: readonly unknown[];
  /** Ausgeschlossene Tags — Terme oder aufgelöste Tagkennungen. */
  readonly excludedTags: readonly unknown[];
  /** Status: einer von diesen. Leer heißt „Alle". */
  readonly statusIds: readonly unknown[];
  readonly completion: PoolCompletionFilter;
  readonly exportState: PoolExportFilter;
}

/** Der Name einer Achse — zugleich der Feldname am `Pool` und in der Schnittstelle. */
export type PoolRuleAxisId = keyof PoolRuleAxes;

/**
 * Ein leerer erforderlicher Ordner verhindert Treffer. Ein leerer ausgeschlossener Ordner schränkt
 * dagegen nichts ein.
 */
export interface ResolvedPoolRuleAxes extends PoolRuleAxes {
  /**
   * Nennt die erforderliche Tagachse Terme, von denen keiner auf einen Tag
   * auflöst? Siehe {@link tagAxisIsUnresolved}.
   */
  readonly unresolvedRequired: boolean;
}

/** Die Oberfläche kennt Ordnerinhalte nicht und benötigt daher das Auflösungsergebnis vom Dienst. */
export interface PoolResolution {
  /** Wie viele Tags die **erforderliche** Liste ergibt, Unterordner eingerechnet. */
  readonly tagCount: number;
  /** Dasselbe für die **ausgeschlossene** Liste. */
  readonly excludedTagCount: number;
  /**
   * Hinreichend für „keine Treffer“, aber nicht notwendig: Auch eine nicht leere Regel kann
   * unaufgelöste erforderliche Terme enthalten.
   */
  readonly isEmpty: boolean;
  /**
   * Hat bei der Erklärung Vorrang vor `isEmpty`: Die Regel ist eingerichtet, aber ein
   * erforderlicher Ordner enthält keine Tags.
   */
  readonly unresolvedRequired: boolean;
  /**
   * Dasselbe für die **ausgeschlossene** Achse (E-057).
   *
   * Und hier **ohne** Folgen für die Treffermenge: „keiner davon" über nichts
   * schließt nichts aus, es läßt in Ruhe. Die Zahl steht trotzdem da, weil ein
   * Ausschluß, der nicht wirkt, eine Auskunft wert ist — sichtbar gemacht,
   * nicht zur Bedingung erhoben.
   */
  readonly unresolvedExcluded: boolean;
  /** Nur erforderliche Ordner ohne Tags; leere Ausschlussordner verhindern keine Treffer. */
  readonly emptyRuleFolderIds: readonly TagFolderId[];
  /**
   * Vom Dienst mit `poolRuleMatchesNothing` berechnet; die Oberfläche setzt diese Bedingung nicht
   * erneut zusammen.
   */
  readonly matchesNothing: boolean;
}

/**
 * Die Auflösung einer Regel zusammensetzen (T-080).
 *
 * Rein: Die aufgelösten Taglisten kommen herein, das Auflösen selbst ist
 * Aufgabe des Ports — dafür braucht es den Ordnerbaum.
 */
export type ResolvePool = (input: {
  /** Die gespeicherte Regel. Gelesen werden die drei Achsen, die nichts auflösen. */
  readonly axes: PoolRuleAxes;
  /** Die erforderlichen Tags, aufgelöst. */
  readonly ruleTagIds: readonly unknown[];
  /** Die ausgeschlossenen Tags, aufgelöst. */
  readonly excludedTagIds: readonly unknown[];
  /** Kennungen statt einer Anzahl, damit die Oberfläche die betroffenen Ordner nennen kann. */
  readonly emptyRuleFolderIds: readonly TagFolderId[];
  /**
   * Dasselbe für die **ausgeschlossenen** Ordnerterme — ohne Folgen für die
   * Treffermenge (E-057), aber die Auskunft, daß ein Ausschluß nicht wirkt.
   */
  readonly emptyExcludedFolderIds: readonly TagFolderId[];
}) => PoolResolution;

/** `includeCompleted` steuert die Anzeige; die Regelmitgliedschaft wird getrennt bestimmt. */
export type IsVisibleInPool = (input: {
  /** `null` bedeutet aktiv, ein Zeitstempel bedeutet erledigt (A-2.4). */
  readonly completedAt: Timestamp | null;
  readonly includeCompleted: boolean;
}) => boolean;

// Die Achsen einer Regel, einmal aufgezählt (T-080)
//
// Bis T-080 stand die Frage „nennt diese Regel überhaupt eine Bedingung?" an
// drei Stellen: in `matchesPool` unten, in der Übersetzung nach SQL
// (`packages/storage`, `buildConditions`) und in der Oberfläche, die sie für
// den Leerzustand einer frisch angelegten Spalte braucht und über keine Route
// erfragen konnte. Drei Fassungen derselben Bedingung, alle drei richtig, alle
// drei von Hand gepflegt.
//
// Hier steht sie einmal. Und sie steht so, dass eine **sechste** Achse nicht
// stillschweigend an ihr vorbeikommt: Die Tabelle darunter ist über
// `PoolRuleAxes` abgebildet und verlangt zu jedem Feld einen Eintrag.

/** `-?` erzwingt auch für später ergänzte optionale Achsen einen Eintrag. */
const POOL_RULE_AXIS_CONDITIONS: {
  readonly [K in PoolRuleAxisId]-?: (axes: PoolRuleAxes) => number;
} = {
  rule: (axes) => axes.rule.length,
  excludedTags: (axes) => axes.excludedTags.length,
  statusIds: (axes) => axes.statusIds.length,
  completion: (axes) => (axes.completion === 'any' ? 0 : 1),
  exportState: (axes) => (axes.exportState === 'any' ? 0 : 1),
};

/**
 * Die Achsen in Leserichtung: erforderlich, ausgeschlossen, Status, Erledigt,
 * Exportstatus. Dieselbe Folge wie im Formular und in der Zusammenfassung.
 *
 * Abgeleitet und nicht abgeschrieben: Wer eine Achse ergänzt, ergänzt sie in
 * der Tabelle darüber, und diese Liste weiß sofort davon.
 */
export const POOL_RULE_AXIS_IDS = Object.keys(
  POOL_RULE_AXIS_CONDITIONS,
) as readonly PoolRuleAxisId[];

/**
 * Ordnet jedes aufgelöste Regelfeld einer Achse zu. `matchMode` verknüpft eine Achse und ist
 * selbst keine.
 * `proof:openapi` prüft anhand dieser Zuordnung auch Routen und Schemas.
 */
export const POOL_RULE_AXIS_OF_FIELD: {
  readonly [K in Exclude<keyof MatchesPoolRule, 'matchMode'>]-?: PoolRuleAxisId;
} = {
  ruleTagIds: 'rule',
  excludedTagIds: 'excludedTags',
  ruleStatusIds: 'statusIds',
  completion: 'completion',
  exportState: 'exportState',
  // Keine sechste Achse, sondern eine Auskunft **über** die erste: Sie sagt
  // nicht, was die Regel verlangt, sondern was aus dem Verlangten geworden ist
  // (E-057). Eine eigene Achse daraus zu machen wäre falsch — sie zählt in
  // `countPoolRuleConditions` nicht mit, eine Regel wird durch einen leeren
  // Ordner nicht um eine Bedingung reicher.
  unresolvedRequired: 'rule',
};

/** Zählt genannte Bedingungen vor der Auflösung; ein leerer Ordner zählt ebenfalls. */
export const countPoolRuleConditions = (axes: PoolRuleAxes): number =>
  Object.values(POOL_RULE_AXIS_CONDITIONS).reduce((sum, count) => sum + count(axes), 0);

/** Eine Regel ohne Bedingung ist zulässig, trifft aber keine Todos. */
export const poolRuleIsEmpty = (axes: PoolRuleAxes): boolean =>
  countPoolRuleConditions(axes) === 0;

/**
 * Jeder leere erforderliche Term verhindert Treffer, auch bei `any`. Die Gesamtzahl aufgelöster
 * Tags reicht dafür nicht aus.
 */
export const tagAxisIsUnresolved = (axis: {
  /** Wie viele **Terme** die Achse nennt — Tags und Ordner, ungeachtet ihres Inhalts. */
  readonly named: number;
  /** Wie viele **Tags** daraus geworden sind. */
  readonly resolved: number;
  /** Wie viele **einzelne Terme** keinen Tag beigetragen haben (E-057). */
  readonly emptyTerms: number;
}): boolean => axis.emptyTerms > 0 || (axis.named > 0 && axis.resolved === 0);

/**
 * Leere Regeln und unaufgelöste erforderliche Terme treffen nichts, unabhängig vom
 * Verknüpfungsmodus. Leere Ausschlüsse verhindern keine Treffer.
 */
export const poolRuleMatchesNothing = (axes: ResolvedPoolRuleAxes): boolean =>
  poolRuleIsEmpty(axes) || axes.unresolvedRequired;

/**
 * Die Kennzahlen unterscheiden eine nicht eingerichtete Regel von einem erforderlichen Ordner ohne
 * Tags.
 */
export const resolvePool: ResolvePool = ({
  axes,
  ruleTagIds,
  excludedTagIds,
  emptyRuleFolderIds,
  emptyExcludedFolderIds,
}) => {
  // Dieselben fünf Achsen, nur die beiden Taglisten in ihrer aufgelösten
  // Gestalt — und die eine Auskunft, die dabei sonst verlorenginge (E-057).
  // Genau dieses Gebilde beurteilen auch `matchesPool` und die Abfrage in SQL.
  const resolved: ResolvedPoolRuleAxes = {
    rule: ruleTagIds,
    excludedTags: excludedTagIds,
    statusIds: axes.statusIds,
    completion: axes.completion,
    exportState: axes.exportState,
    unresolvedRequired: tagAxisIsUnresolved({
      named: axes.rule.length,
      resolved: ruleTagIds.length,
      emptyTerms: emptyRuleFolderIds.length,
    }),
  };

  return {
    tagCount: ruleTagIds.length,
    excludedTagCount: excludedTagIds.length,
    isEmpty: poolRuleIsEmpty(resolved),
    unresolvedRequired: resolved.unresolvedRequired,
    unresolvedExcluded: tagAxisIsUnresolved({
      named: axes.excludedTags.length,
      resolved: excludedTagIds.length,
      emptyTerms: emptyExcludedFolderIds.length,
    }),
    emptyRuleFolderIds,
    matchesNothing: poolRuleMatchesNothing(resolved),
  };
};

export const matchesPool: MatchesPool = ({
  todoTagIds,
  ruleTagIds,
  matchMode,
  excludedTagIds,
  todoStatusId,
  ruleStatusIds,
  completedAt,
  completion,
  hasOpenEntries,
  hasExportedEntries,
  exportState,
  unresolvedRequired,
}) => {
  /**
   * Das Pflichtfeld auch zur Laufzeit prüfen: JavaScript-Aufrufer können es trotz
   * TypeScript-Vertrag weglassen.
   * Ein fehlender Wert ist ein Aufruffehler und keine fachliche Antwort „keine Treffer“.
   */
  if (typeof unresolvedRequired !== 'boolean') {
    throw new TypeError(
      'matchesPool: Das Feld `unresolvedRequired` fehlt oder ist kein Wahrheitswert. ' +
        'Es ist seit E-057 Pflicht und sagt, ob die erforderliche Tagachse Terme nennt, ' +
        'die auf keinen Tag auflösen (der leere Ordner). Die Antwort liefert ' +
        '`PoolPort.resolveAxes` zusammen mit `tagAxisIsUnresolved`.',
    );
  }

  const excluded = excludedTagIds ?? [];
  const statuses = ruleStatusIds ?? [];
  const wantedCompletion = completion ?? 'any';
  const wantedExport = exportState ?? 'any';

  // Zwei Gründe, aus denen die Regel nichts trifft, bevor eine Karte überhaupt
  // angesehen wird: Sie nennt keine Bedingung (A-3.4), oder ihre erforderliche
  // Tagachse zeigt ins Leere (E-057).
  //
  // Beides stand bis T-080/T-082 hier ausgeschrieben — und noch einmal in der
  // Übersetzung nach SQL. Jetzt steht es in `poolRuleMatchesNothing`, und
  // dieser Aufruf ist zugleich die Stelle, die rot wird, wenn eine sechste
  // Achse dazukommt: Das Literal muß jede nennen.
  if (
    poolRuleMatchesNothing({
      rule: ruleTagIds,
      excludedTags: excluded,
      statusIds: statuses,
      completion: wantedCompletion,
      exportState: wantedExport,
      // Ohne Vorgabewert: Das Feld ist Pflicht, und die Begründung steht am
      // Feld in `MatchesPoolRule`. Ein `?? false` an dieser Stelle wäre die
      // Wache, die sich selbst abschaltet.
      unresolvedRequired,
    })
  ) {
    return false;
  }

  const onTodo = new Set<TagId>(todoTagIds);

  // Erforderliche Tags — die einzige Achse, deren Verknüpfung wählbar ist.
  if (ruleTagIds.length > 0) {
    const hit =
      matchMode === 'all'
        ? ruleTagIds.every((tagId) => onTodo.has(tagId))
        : ruleTagIds.some((tagId) => onTodo.has(tagId));
    if (!hit) return false;
  }

  // Ausgeschlossene Tags — immer „keines davon". Ein `matchMode` hier wäre
  // zweideutig: „nicht alle" und „keines" sind verschiedene Aussagen, und nur
  // die zweite ist die, die jemand meint, der ein Tag ausschließt.
  //
  // Ohne vorgeschaltete Längenprüfung: `some` auf einer leeren Liste ist
  // `false`, und das ist genau die Bedeutung des Neutralwerts.
  if (excluded.some((tagId) => onTodo.has(tagId))) return false;

  // Status — immer „einer von diesen".
  //
  // Der Vergleich erledigt den unbekannten Status nebenbei: `undefined` und
  // `null` stehen in keiner Statusliste, `some` liefert `false`, die Regel
  // trifft nicht. Eine eigene Prüfung darauf wäre dieselbe Aussage ein zweites
  // Mal — und die Stelle, an der die beiden eines Tages auseinanderliefen.
  if (statuses.length > 0 && !statuses.some((id) => id === todoStatusId)) return false;

  // Erledigt. `undefined` heißt „unbekannt" und zählt weder als erledigt noch
  // als unerledigt: Beide Richtungen lehnen dann ab, statt eine Hälfte zu
  // raten.
  const done = completedAt === undefined ? null : completedAt !== null;
  if (wantedCompletion === 'done' && done !== true) return false;
  if (wantedCompletion === 'open' && done !== false) return false;

  // Exportstatus. Die beiden Kennzeichen sind Vorhandenseinsaussagen über die
  // Buchungen des Todos, nicht sein Zustand — ein Todo kann beide tragen.
  if (wantedExport === 'open' && hasOpenEntries !== true) return false;
  if (wantedExport === 'exported' && hasExportedEntries !== true) return false;

  return true;
};

export const isVisibleInPool: IsVisibleInPool = ({ completedAt, includeCompleted }) =>
  completedAt === null || includeCompleted;
