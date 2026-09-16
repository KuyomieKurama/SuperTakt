import type { AssignMail } from './mail-assignment.ts';


import type {
  DefaultTagPort,
  PoolPort,
  TagFolderPort,
  TagPort,
  TimeEntryPort,
  TodoPort,
  TodoStatusPort,
} from '@takt/storage';
import type { Timestamp } from '@takt/domain';

import type { EmailAttachmentIntake } from '../../features/todos/email-attachments.ts';

/**
 * Die Ports innerhalb **einer** Transaktion.
 *
 * Strukturell ein Ausschnitt von `UnitOfWork`. Ein echter `UnitOfWork` erfüllt
 * diesen Typ ohne Zutun.
 */
export interface AddinUnit {
  readonly todos: Pick<TodoPort, 'load' | 'findByCallNumber' | 'create' | 'clearDone'>;
  readonly folders: Pick<TagFolderPort, 'loadTree'>;
  /**
   * `findByKey` und `create` kamen mit T-061 dazu.
   *
   * **Warum überhaupt.** A-9.5 verlangt, dass die Standard-Tags auf jedem Weg
   * greifen, auf dem ein Todo entsteht. Für **neue** Tags gilt dasselbe
   * Argument: Die Hauptanwendung darf beim Anlegen eines Todos Tagnamen
   * mitschicken, die es noch nicht gibt. Könnte das Add-in das nicht, hätte
   * derselbe Vorgang wieder zwei Ergebnisse, je nachdem wo er geschieht.
   *
   * **Warum genau diese zwei und keine dritte.** `findByKey` fragt, `create`
   * schreibt; zusammen sind sie „finde das Tag oder lege es an“ und sonst
   * nichts. Ausdrücklich **nicht** dabei: `rename`, `move`, `remove`, `load`,
   * `listInFolder` oder `setOnTodo` für fremde Todos.
   */
  readonly tags: Pick<TagPort, 'findByKey' | 'create'>;
  /**
   * Die Auflösung der Pool-Regeln braucht die Buchungsroute, und die
   * Trefferbeschreibung des Duplikatfalls liest sie mit.
   */
  readonly pools: Pick<PoolPort, 'list' | 'resolveAxes'>;
  readonly statuses: Pick<TodoStatusPort, 'list' | 'defaultStatus'>;
  readonly defaultTags: Pick<DefaultTagPort, 'list'>;
  readonly timeEntries: Pick<TimeEntryPort, 'create' | 'sumSeconds'>;
}

/**
 * Was die Routen zum Arbeiten brauchen.
 *
 * `inTransaction` ist dieselbe Klammer wie `TransactionPort.inTransaction`.
 * Auch eine reine Leseanfrage läuft darin: Der Tag- und Ordnerbaum wird aus
 * mehreren Abfragen zusammengesetzt, und ein Baum aus zwei verschiedenen
 * Zuständen wäre in einer Oberfläche schwer zu erklären.
 *
 * Die Uhr ist ein Port und keine Wanduhr im Modul — sonst wäre keine dieser
 * Routen ohne laufenden Rechner reproduzierbar prüfbar.
 */
export interface AddinDeps {
  readonly assignMail?: AssignMail;
  inTransaction<T>(work: (unit: AddinUnit) => Promise<T>): Promise<T>;
  readonly now: () => Timestamp;

  readonly emailAttachments: EmailAttachmentIntake;
}
