/**
 * Takt — Nachrichten zwischen Aufgabenbereich und Auswertungs-Worker (B-4.1).
 *
 * Bewusst winzig und ohne Verhalten: Was über eine Worker-Grenze geht, wird
 * strukturell geklont. Ein Wert mit Methoden oder ein Ausdrucksobjekt käme
 * drüben nicht an.
 *
 * Der Ausdruck wandert als **Zeichenkette**, nicht als `RegExp`. Damit wird er
 * im Worker frisch übersetzt, und `lastIndex` kann keinen Zustand von einem
 * Aufruf in den nächsten tragen (B-4.4).
 */

export interface EvaluateRequest {
  /** Laufende Nummer. Ordnet eine Antwort ihrer Anfrage zu. */
  readonly id: number;
  /** Das Muster als Zeichenkette, ohne Kennzeichen. */
  readonly source: string;
  /** Der bereits gekürzte Text (B-4.1 Punkt 2). */
  readonly text: string;
}

export type EvaluateResponse =
  /**
   * Der Worker steht und hat sein Modul geladen.
   *
   * Diese Nachricht gibt es, damit die Zeitgrenze aus B-4.1 **die Auswertung**
   * misst und nicht den Start eines Workers. Auf einem ausgelasteten Rechner
   * kann das Laden eines Moduls allein hundert Millisekunden kosten; ohne die
   * Trennung meldete das Add-in dann „Erkennung abgebrochen" für ein völlig
   * harmloses Muster — ein Fehler, der genau dann auftritt, wenn der Benutzer
   * ohnehin auf etwas wartet, und der sich nie zuverlässig nachstellen ließe.
   *
   * Ohne Nummer: Sie gehört zu keiner Anfrage.
   */
  | { readonly kind: 'ready' }
  | { readonly id: number; readonly kind: 'match'; readonly group: string | null }
  | { readonly id: number; readonly kind: 'no_match' }
  /** `new RegExp` im Worker gescheitert — der Wert kam aus den Einstellungen. */
  | { readonly id: number; readonly kind: 'invalid'; readonly message: string };
