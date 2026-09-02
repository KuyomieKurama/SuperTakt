/**
 * Takt — das Startgeheimnis der Hülle (B-1.6, B-2.9 Punkt 3).
 *
 * ## Wogegen es wirkt
 *
 * Gegen **A-03, einen lokalen Prozess, der das gebündelte Sidecar-Binärprogramm
 * selbst startet**. Es liegt im Installationsverzeichnis und ist ausführbar.
 * Ohne diese Hürde startet der Angreifer es mit eigenen Argumenten, zeigt es
 * auf die echte Datenbank und kennt das Token, weil er es selbst gesetzt hat.
 * Der gesamte Zugriffsschutz wäre umgangen.
 *
 * ## Warum über `stdin` und nicht über die Befehlszeile
 *
 * Befehlszeilen sind für jeden Prozess im System sichtbar (`ps`,
 * Task-Manager, WMI). Ein Geheimnis dort ist kein Geheimnis. Eine
 * Umgebungsvariable ist etwas besser, aber unter Linux über
 * `/proc/<pid>/environ` und unter Windows über den Prozessspeicher ebenfalls
 * lesbar. `stdin` einer Röhre zwischen Eltern- und Kindprozess ist der einzige
 * Weg, der keinen dritten Prozess mitlesen lässt.
 *
 * ## Zweite Wirkung: die Trennung der beiden Wege
 *
 * Das Startgeheimnis ist zugleich der Nachweis, mit dem sich die **Oberfläche**
 * ausweist. Sie benutzt das Add-in-Token nicht. Damit hängt das dauerhafte
 * Token allein an der Add-in-Strecke, und sein Verlust kostet weniger — das ist
 * der einzige Vorschlag aus B-2.9, der die Angriffsfläche des Tokens
 * strukturell verkleinert statt sie nur zu bewachen.
 *
 * ## Dritte Wirkung: der Sidecar überlebt die Hülle nicht
 *
 * Schließt die Hülle ihre Seite der Röhre, endet `stdin`. Der Dienst beendet
 * sich dann von selbst, statt als verwaister Prozess mit Datenbankzugriff und
 * ohne sichtbares Fenster weiterzulaufen (B-1.6 Punkt 3).
 *
 * ## Zweite Zeile: der Windows-Benutzername (E-042)
 *
 * Über denselben Kanal kommt eine zweite Zeile mit dem Benutzernamen, den die
 * Hülle vom Betriebssystem gelesen hat (E-010). Er geht in den Export (A-8.5)
 * und ist damit eine Abrechnungsgröße.
 *
 * Nicht über die Umgebungsvariable `USERNAME` — das ist genau B-8.1: Wer Takt
 * mit `set USERNAME=fremder && Takt.exe` startet, bekäme fremde Arbeitszeit
 * unter seinem Namen in die Abrechnung. Die Befehlszeile scheidet aus
 * demselben Grund aus wie beim Startgeheimnis: Sie steht jedem lokalen Prozess
 * in der Prozessliste offen. Die Röhre zwischen Eltern- und Kindprozess ist
 * der einzige Weg, den kein dritter Prozess beschreiben oder mitlesen kann.
 *
 * Beide Werte werden in **einem** Lesevorgang aufgenommen. Zwei nacheinander
 * geschaltete Leser wären hier ein Fehler: Schickt die Hülle beide Zeilen in
 * einem Schreibvorgang — der Normalfall bei einer Röhre —, liegt die zweite
 * Zeile bereits im selben Datenblock, und der erste Leser würde sie
 * verschlucken.
 */

import type { Readable } from 'node:stream';

export type StartupHandshake =
  | { readonly ok: true; readonly secret: string; readonly windowsUser: string }
  | {
      readonly ok: false;
      readonly reason: 'missing' | 'timeout' | 'too_short' | 'user_missing';
    };

/** Kürzer als das nimmt der Dienst nicht an. */
const MIN_SECRET_LENGTH = 32;

/**
 * Längengrenze des Benutzernamens. Windows lässt 20 Zeichen für ein
 * SAM-Konto zu, ein UPN darf länger sein; 256 ist reichlich und begrenzt
 * zugleich, was ein Aufrufer überhaupt einschleusen kann.
 */
const MAX_USER_LENGTH = 256;

/** Gesamtgrenze über beide Zeilen. Verhindert unbegrenztes Puffern. */
const MAX_HANDSHAKE_BYTES = 8192;

/**
 * Der Benutzername geht in die Abrechnung, also wird er geprüft und nicht
 * geglaubt. Steuerzeichen sind das, womit man eine Protokollzeile oder eine
 * Exportzelle von innen aufbricht.
 */
function isPlausibleUserName(value: string): boolean {
  if (value.length === 0 || value.length > MAX_USER_LENGTH) return false;
  // eslint-disable-next-line no-control-regex -- genau darum geht es hier
  return !/[\u0000-\u001f\u007f]/.test(value);
}

/**
 * Liest die beiden Startzeilen von `stdin`: Startgeheimnis, dann
 * Windows-Benutzername (B-1.6, E-042).
 *
 * Der gelesene Geheimniswert wird **nicht** protokolliert, nicht in eine
 * Fehlermeldung gesetzt und nicht zurückgegeben, wenn er zu kurz ist. Der
 * Benutzername ist kein Geheimnis, wird aber ebenso wenig in eine Fehlermeldung
 * gesetzt — eine Meldung, die fremde Eingabe wörtlich wiedergibt, ist der
 * bequemste Weg, ein Protokoll zu fälschen.
 */
export function readStartupHandshake(input: Readable, timeoutMs: number): Promise<StartupHandshake> {
  return new Promise<StartupHandshake>((resolve) => {
    let buffer = '';
    let settled = false;
    // Merkt, ob die erste Zeile schon angenommen war. Läuft danach die
    // Zeitgrenze ab, ist die Diagnose „zweite Zeile fehlt" und nicht „von Hand
    // gestartet" — der Unterschied entscheidet, wo der Benutzer sucht.
    let secretSeen = false;

    const finish = (result: StartupHandshake): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      input.off('data', onData);
      input.off('end', onEnd);
      input.off('error', onEnd);
      resolve(result);
    };

    const timer = setTimeout(
      () => finish({ ok: false, reason: secretSeen ? 'user_missing' : 'timeout' }),
      timeoutMs,
    );
    // Der Zeitgeber darf den Prozess nicht am Beenden hindern.
    timer.unref?.();

    const onData = (chunk: Buffer | string): void => {
      buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');

      const first = buffer.indexOf('\n');
      if (first === -1) {
        if (buffer.length > MAX_HANDSHAKE_BYTES) {
          finish({ ok: false, reason: 'too_short' });
        }
        return;
      }

      const secret = buffer.slice(0, first).trim();
      if (secret.length < MIN_SECRET_LENGTH) {
        finish({ ok: false, reason: 'too_short' });
        return;
      }

      secretSeen = true;

      const second = buffer.indexOf('\n', first + 1);
      if (second === -1) {
        if (buffer.length > MAX_HANDSHAKE_BYTES) {
          finish({ ok: false, reason: 'user_missing' });
        }
        // Auf die zweite Zeile wird gewartet. Bleibt sie aus, greift der
        // Zeitgeber — der Dienst startet nicht ohne Benutzernamen, weil er
        // sonst später eine Abrechnung ohne Urheber schriebe.
        return;
      }

      const windowsUser = buffer.slice(first + 1, second).trim();
      if (!isPlausibleUserName(windowsUser)) {
        finish({ ok: false, reason: 'user_missing' });
        return;
      }

      finish({ ok: true, secret, windowsUser });
    };

    const onEnd = (): void =>
      finish({ ok: false, reason: secretSeen ? 'user_missing' : 'missing' });

    input.setEncoding('utf8');
    input.on('data', onData);
    input.once('end', onEnd);
    input.once('error', onEnd);
  });
}

/**
 * Beobachtet die Elternverbindung. Endet sie, ist die Hülle weg.
 *
 * Ohne das läuft ein verwaister Sidecar weiter, nachdem der Benutzer Takt
 * geschlossen hat — mit Datenbankzugriff und ohne Fenster (B-1.6 Punkt 3).
 */
export function watchParentLink(input: Readable, onLost: () => void): void {
  input.resume();
  input.once('end', onLost);
  input.once('close', onLost);
  input.once('error', onLost);
}
