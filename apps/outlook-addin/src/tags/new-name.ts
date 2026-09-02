/**
 * Takt — ein Tag, das es noch nicht gibt, aus dem Aufgabenbereich heraus
 * (A-4.1, A-9.5, T-061).
 *
 * ---------------------------------------------------------------------------
 * Was diese Datei entscheidet — und was ausdrücklich nicht
 * ---------------------------------------------------------------------------
 *
 * Sie entscheidet **nichts** darüber, wann zwei Tagnamen derselbe sind. Das
 * sagt `packages/domain/src/tag-name.ts`, und zwar für die Migration, für den
 * lokalen Dienst und für den Aufgabenbereich mit **einer** Aufzählung. Hier
 * wird `tagNameKey` aufgerufen und sonst nichts — kein `toLowerCase()`, kein
 * `trim()`, kein eigener Vergleich.
 *
 * Warum das hier so scharf steht: Ein zweiter Vergleich im Add-in wäre nicht
 * sofort falsch, sondern **fast** richtig. Er träfe „Backend“ gegen „backend“
 * und danebenliegen würde er erst bei „Straße“ gegen „Strasse“ oder bei einem
 * geschützten Leerzeichen — also genau in den Fällen, in denen der Benutzer
 * einen Doppelgänger anlegte und beide Tags für dasselbe hielte. Die Regel ist
 * aus diesem Grund aufgezählt und nicht `toLowerCase()`; sie ein zweites Mal
 * hinzuschreiben nähme ihr genau den Zweck.
 *
 * ---------------------------------------------------------------------------
 * Wer legt das Tag an
 * ---------------------------------------------------------------------------
 *
 * Nicht das Add-in. Es sammelt **Namen** und schickt sie als `tagNames` mit dem
 * Todo; der Dienst sucht, findet oder legt an — in derselben Transaktion, in
 * der das Todo entsteht. Es gibt hier keinen Aufruf „Tag anlegen“, und das ist
 * die Bedingung dafür, dass kein Tag ohne sein Todo zurückbleibt und dass zwei
 * gleichzeitige Anfragen nicht zwei Tags ergeben.
 *
 * Die Auskunft dieser Datei ist deshalb ein **Vorschlag an den Benutzer** und
 * keine Vorwegnahme: Sie sagt „diesen Namen gibt es in dem Baum, den wir
 * geladen haben, noch nicht“. Ob er ihn in der Sekunde des Anlegens immer noch
 * nicht gibt, entscheidet der Dienst — und wenn doch, bekommt der Benutzer das
 * vorhandene Tag und kein zweites.
 */

import { checkTagName, tagNameKey } from '@takt/domain';

import type { FlatTag } from './tree.ts';

/**
 * Was mit dem Text im Suchfeld anzufangen ist.
 *
 * Fünf Fälle statt eines Wahrheitswerts. Ein `canCreate: boolean` würde die
 * drei interessanten Fälle — zu lang, gibt es schon, steht schon in der Liste —
 * in dasselbe „nein“ werfen, und der Aufgabenbereich könnte nicht sagen, warum
 * er nichts anbietet. Genau dieser Unterschied ist bei der Call-Nummer schon
 * einmal die Gegenmaßnahme gewesen (B-4.3 Punkt 4).
 */
export type NewTagOffer =
  /** Es steht nichts (Verwertbares) im Feld. */
  | { readonly kind: 'idle' }
  /** Der Name ist unzulässig — zu lang. Der Satz kommt aus der Domäne. */
  | { readonly kind: 'invalid'; readonly message: string }
  /**
   * Den Namen gibt es schon, womöglich in anderer Schreibweise.
   *
   * Der Aufgabenbereich zeigt darauf statt auf „anlegen“: Wer „backend“ tippt
   * und „Backend“ meint, soll das vorhandene Tag wählen. Ihm hier ein
   * „anlegen“ anzubieten wäre ein Angebot, das der Dienst gar nicht ausführen
   * würde — er fände das vorhandene Tag und hinge das Todo daran.
   */
  | { readonly kind: 'exists'; readonly tag: FlatTag }
  /** Der Name steht bereits in der Liste der neuen Namen. */
  | { readonly kind: 'pending'; readonly name: string }
  /** Neu, zulässig, noch nicht vorgemerkt. `name` ist die Anzeigeform. */
  | { readonly kind: 'offer'; readonly name: string };

/**
 * Prüft den Text im Suchfeld gegen den geladenen Baum und die schon
 * vorgemerkten Namen.
 *
 * `existing` ist der abgeflachte Baum aus `GET /addin/context` — der Bestand,
 * wie ihn der Dienst beim Öffnen dieser E-Mail gemeldet hat. Eine eigene Kopie
 * hält das Add-in nicht (A-10.4).
 */
export function describeNewTag(
  raw: string,
  existing: readonly FlatTag[],
  pending: readonly string[],
): NewTagOffer {
  // Ein leeres Feld ist keine Eingabe und keine Ablehnung. `checkTagName`
  // meldete dafür „darf nicht leer sein“ — ein Satz, der unter einem Feld, in
  // das noch niemand getippt hat, wie ein Vorwurf aussieht.
  if (raw.trim() === '') return { kind: 'idle' };

  const checked = checkTagName(raw);
  if (!checked.ok) return { kind: 'invalid', message: checked.error.message };

  const { name, key } = checked.value;

  const found = existing.find((tag) => tagNameKey(tag.name) === key);
  if (found !== undefined) return { kind: 'exists', tag: found };

  const already = pending.find((entry) => tagNameKey(entry) === key);
  if (already !== undefined) return { kind: 'pending', name: already };

  return { kind: 'offer', name };
}

/**
 * Nimmt einen Namen in die Liste auf, ohne einen Doppelgänger entstehen zu
 * lassen.
 *
 * Dieselbe Entdoppelung wie `checkTagNames` im Dienst, mit demselben Schlüssel
 * und derselben Vorfahrtsregel: Die zuerst genannte Schreibweise gewinnt, die
 * Reihenfolge bleibt. Sie steht hier trotzdem, weil der Benutzer den zweiten
 * „backend“-Chip sonst **sehen** würde — bis der Dienst ihn stillschweigend
 * zusammenfasste und die Erfolgsmeldung ein Tag weniger nennte als die Liste
 * Chips hatte.
 */
export function addPendingTagName(
  pending: readonly string[],
  name: string,
): readonly string[] {
  const key = tagNameKey(name);
  if (pending.some((entry) => tagNameKey(entry) === key)) return pending;
  return [...pending, name];
}

/** Entfernt einen vorgemerkten Namen — über seinen Schlüssel, nicht über `===`. */
export function removePendingTagName(
  pending: readonly string[],
  name: string,
): readonly string[] {
  const key = tagNameKey(name);
  return pending.filter((entry) => tagNameKey(entry) !== key);
}
