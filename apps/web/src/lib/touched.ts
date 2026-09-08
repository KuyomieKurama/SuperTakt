/**
 * Takt — wann ein Pflichtfeld beim Verlassen als „berührt“ gilt (Regel P-8).
 *
 * ---------------------------------------------------------------------------
 * Der gemessene Fall, und er ist kein Randfall
 * ---------------------------------------------------------------------------
 *
 * `FormDialog.tsx` legt den Fokus beim Öffnen in das **erste Feld**. Setzte
 * `onBlur` dort `touched` bedingungslos, dann genügte im frisch geöffneten
 * Dialog „Neuen Tag anlegen“ **ein Tabulator**, um „Name fehlt.“ zu erzeugen —
 * bevor der Benutzer ein Zeichen getippt hat. Genau so stand es bis T-186 an
 * sechs Stellen (Befund O-FY).
 *
 * SC 3.3.1 verlangt, daß eine Meldung einen Fehler benennt. Ein Feld, das
 * niemand angefaßt hat, hat keinen. Der Tadel vor dem ersten Zeichen ist nicht
 * der Buchstabe von P-6 („nie beim ersten Zeichen“), aber eindeutig sein Sinn.
 *
 * ---------------------------------------------------------------------------
 * Die Regel, wörtlich (T-184 Z-20, verbindlich)
 * ---------------------------------------------------------------------------
 *
 * > **P-8.** Eine Pflichtmeldung erscheint erst, wenn der Benutzer **an diesem
 * > Feld etwas getan hat**. „Berührt“ heißt: eine Eingabe, nicht ein
 * > Durchqueren. Ein Feld, das seit dem Öffnen unverändert ist, wird beim
 * > bloßen Weitertabben nicht getadelt.
 * >
 * > Umsetzung: der `onBlur`-Zweig setzt `touched` nur, wenn der Wert sich seit
 * > dem Öffnen geändert hat oder nicht leer ist. Ein Absendeversuch setzt
 * > `touched` weiterhin **immer**.
 *
 * Der zweite Satz der Umsetzung steht bewußt **nicht** hier: Ein Absendeversuch
 * ist keine Frage, sondern eine Feststellung, und er setzt `touched` an der
 * Aufrufstelle ohne Bedingung (`TodoFormDialog.tsx`, `BookingDialogs.tsx`).
 *
 * ---------------------------------------------------------------------------
 * Die Schärfung: **ein `onChange` ist eine Eingabe** (Nachtrag T-186)
 * ---------------------------------------------------------------------------
 *
 * Die erste Fassung dieser Datei verglich den Wert mit dem beim Öffnen. Dabei
 * fiel ein Fall durch, und er ist keiner, den ein Benutzer versteht: Wer tippt
 * und **ohne zwischenzeitliches Verlassen** wieder löscht, steht wieder auf dem
 * Anfangswert und galt als unberührt. Er hat das Feld angefaßt; ihn als
 * unberührt zu führen ist die Sorte Genauigkeit, die niemandem nützt.
 *
 * Gefragt wird deshalb nicht mehr, ob der **Wert** sich geändert hat, sondern ob
 * der **Benutzer** etwas getan hat. Das Merkmal dafür ist ein `onChange` am
 * Feld, und es wird dort geführt, wo das `onChange` entsteht — in
 * `FormDialog.tsx#TextField` und im Begründungsfeld von `ConfirmDialog.tsx`,
 * nicht an neun Aufrufstellen.
 *
 * Der Vergleich mit dem Anfangswert ist damit **entfallen**, und das ist kein
 * Verlust: Ein gesteuertes Feld ändert seinen Wert nur über sein `onChange`.
 * Was übrigbleibt, ist die zweite Hälfte von P-8 — „oder nicht leer ist“ —, und
 * sie trägt seither **allein einen einzigen Fall**: ein vorbelegtes Feld, in das
 * niemand getippt hat. Genau darum geht der nächste Abschnitt.
 *
 * ---------------------------------------------------------------------------
 * Die Berichtigung: „nicht leer“ heißt **beschnitten** nicht leer (T-207)
 * ---------------------------------------------------------------------------
 *
 * Die zweite Hälfte fragt `value.trim().length > 0` und nicht `value.length > 0`.
 *
 * **Das ändert am Tag der Änderung an keiner der neun Auslösestellen etwas, und
 * das ist nachgesehen und nicht angenommen.** Die beiden Fassungen gehen genau
 * dann auseinander, wenn ein Feld **aus lauter Leerraum** besteht und niemand
 * hineingetippt hat. Vorbelegt wird an den neun Stellen mit `""`, mit einem
 * Namen aus dem Bestand oder mit `Kopie von …` — und ein Name aus dem Bestand
 * kann kein Leerraum sein, weil die Tür des Dienstes ihn beschneidet und leer
 * abweist (`nameSchema` in `apps/local-api/src/http/input.ts`). Wer selbst ein
 * Leerzeichen tippt, hat `edited` gesetzt und wird von der ersten Hälfte
 * getragen.
 *
 * Und weil es heute nichts ändert, ist es die Sorte Zeile, die beim nächsten
 * Lesen gern wieder herausfällt („tut ja nichts“). Deshalb steht der Grund hier
 * und nicht in der Nachricht eines Commits:
 *
 * > **Eine Regel darf für ihr Schweigen nicht auf eine ferne Aufrufstelle
 * > angewiesen sein.**
 *
 * Mit `value.length > 0` gilt ein vorbelegtes, unberührtes Feld als **berührt**.
 * Stumm bleibt es allein deshalb, weil **jede** Aufrufstelle zusätzlich einen
 * beschnitten leeren Wert verlangt (`nameTouched && name.trim().length === 0`).
 * Das ist heute an allen neun Stellen so — und es ist eine Zusicherung über
 * Code, der woanders steht. Die zehnte Stelle, die noch niemand geschrieben hat,
 * ist der ganze Punkt: Diese Klasse geht nie beim ersten Schreiben daneben. In
 * denselben Wellen ist sie viermal danebengegangen (zwei Fassungen einer
 * Beschriftung, zwei einer Pfadprüfung, zwei einer Textmenge, zwei Wächter mit
 * derselben Zusage).
 *
 * Mit `trim()` gilt statt dessen ohne Nebenbedingung: **Ein unberührtes,
 * leerwirkendes Feld erzeugt keine Meldung, gleichgültig wie der Aufrufer seine
 * Bedingung schreibt.**
 *
 * „Ändert nichts“ heißt dabei „ändert an den heutigen Werten nichts“ und nicht
 * „kann nichts ändern“. Stünde eines Tages doch ein Feld aus lauter Leerraum da
 * — ein Bestand, der an der Tür vorbei geschrieben wurde —, dann schwiege die
 * berichtigte Regel, während die alte den Benutzer für eine Eingabe tadelte, die
 * er nie gemacht hat. Das Schweigen ist hier das Richtige; **daß der
 * Absendeknopf daneben gesperrt ist und dafür keinen Satz hat, ist eine andere
 * Frage** — sie gehört zu den Dialogen, die sperren statt beim Absenden zu
 * prüfen, und wird dort entschieden, nicht hier.
 *
 * **Der frühere Einwand gegen `trim()` ist entfallen, nicht abgewogen worden.**
 * Er lautete: Wer ein Leerzeichen tippt, hat eine Eingabe gemacht, und ein
 * `trim()` verschöbe die Grenze von „hat etwas getan“ auf „hat etwas Brauchbares
 * getan“. Der Satz galt der Fassung **ohne** `edited`, die den Wert mit dem
 * Öffnungswert verglich. Seit der Schärfung oben trägt diesen Fall die **erste**
 * Hälfte: Wer ein Leerzeichen tippt, löst ein `onChange` aus, `edited` ist wahr,
 * und der Ausdruck ist schon vor dem `trim()` fertig. Der Einwand ist deshalb
 * hier **ersetzt** und nicht ergänzt — zwei einander widersprechende
 * Begründungen nebeneinander sind schlechter als eine falsche: Beim nächsten
 * Lesen weiß niemand, welche gilt.
 *
 * Und die Alternative, damit sie nicht als Einfall wiederkommt: Man könnte die
 * zweite Hälfte ganz streichen (`return edited`). Dagegen spricht, daß sie die
 * Tür für den Fall ist, den es geben wird — eine Meldung an einem vorbelegten
 * Feld über einen **nicht** leeren Wert, etwa einen schon vergebenen Namen. Sie
 * zu streichen hieße außerdem, den Wortlaut von P-8 zu ändern — und der steht
 * oben als Zitat, weil er nicht dieser Datei gehört.
 *
 * ---------------------------------------------------------------------------
 * Warum die Regel hier steht und nicht sechsmal in einem `onBlur`
 * ---------------------------------------------------------------------------
 *
 * Sechs Abschriften eines Ausdrucks sind sechs Gelegenheiten, ihn beim siebten
 * Dialog anders zu schreiben — und die Abweichung wäre still: Beide Fassungen
 * verhalten sich in jedem Test gleich, solange jemand tippt. Sie fällt erst
 * dem Benutzer auf, der nur durchtabbt.
 *
 * Als Funktion ohne JSX ist die Regel außerdem **meßbar**, ohne einen Dialog zu
 * zeichnen — dieselbe Bauart wie `field.ts` im Aufgabenbereich des Add-ins.
 *
 * ---------------------------------------------------------------------------
 * Was diese Regel nicht leistet
 * ---------------------------------------------------------------------------
 *
 * Sie sieht keine **programmatische** Änderung des Wertes: Wer aus dem
 * Dateiwähler einen Pfad einsetzt, hat kein `onChange` ausgelöst. Der eine Fall
 * dieser Art im Bestand (`Attachments.tsx`) setzt `touched` an Ort und Stelle
 * selbst und tut es aus einem anderen Grund — dort ist die Auswahl die Eingabe.
 */

import type { DraftText } from "../api/types";

/**
 * Gilt das Feld nach dem Verlassen als berührt?
 *
 * `DraftText` und nicht `string` (E-063 Punkt 1): Der Wert ist der Inhalt eines
 * Eingabefeldes. Beim Umbenennen kommt er ursprünglich aus dem Bestand, also
 * von außen — an dieser Stelle hört er auf, fremder Text zu sein, und wird zum
 * Entwurf des Benutzers. Der Ausstieg steht damit **im Typ** und nicht in einem
 * Kommentar; `proof:foreign` Abschnitt 4 hat die erste Fassung mit `string`
 * sofort rot gemacht, und zu Recht.
 *
 * @param value Der Wert, den das Feld in diesem Augenblick trägt.
 * @param edited Hat der Benutzer seit dem Öffnen in dieses Feld getippt? Also:
 *   ist mindestens ein `onChange` daran entstanden.
 * @returns `true`, wenn eine Meldung an diesem Feld jetzt zulässig ist.
 */
export function touchedOnBlur(value: DraftText, edited: boolean): boolean {
  /*
    Erste Hälfte: eine Eingabe. Sie trägt jeden Fall, in dem jemand getippt hat
    — auch ein einzelnes Leerzeichen, denn auch das ist ein `onChange`.

    Zweite Hälfte: „oder nicht leer ist“, und zwar **beschnitten** nicht leer.
    Sie trägt allein den Fall, den `edited` nicht sieht: ein vorbelegtes Feld,
    das der Benutzer unverändert verläßt. Ein Feld aus lauter Leerzeichen hat
    dieser Benutzer nicht angefaßt, also gilt es nicht als angefaßt — ohne daß
    die Aufrufstelle etwas dazutun muß. Der Grund für den `trim()` und was er
    ersetzt, steht im Kopf dieser Datei; er ist keine Feinheit, sondern die
    Stelle, an der die Regel aufhört, von neun anderen Dateien abzuhängen.
  */
  return edited || value.trim().length > 0;
}
