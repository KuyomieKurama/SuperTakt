# Lokales Outlook-Zertifikat über die App einrichten

## Bedienung

1. SuperTakt starten und **Einstellungen → Outlook-Add-in → Outlook lokal einrichten** öffnen.
2. Zertifikatsdaten und Fingerabdruck prüfen.
3. **Zertifikat prüfen und vertrauen …** wählen und den Bestätigungsdialog bestätigen.
4. Die App prüft die gespeicherten Vertrauenseinträge und die lokale HTTPS-Seite erneut.
5. Unter Linux den Browser vollständig neu starten und anschließend das Add-in öffnen.

Die Datei wird direkt aus dem SuperTakt-Anwendungsdatenverzeichnis gelesen.
Ein manueller Export oder Import der CRT-Datei ist für diesen Weg nicht nötig.
Nach Änderungen am nativen App-Code muss eine laufende Entwicklungsfassung neu
gebaut beziehungsweise `pnpm desktop` neu gestartet werden.

## Plattformen und Reichweite

- **Windows:** CurrentUser/Root, bestehender PowerShell-/Windows-Dialog.
- **Linux:** NSS-Speicher im Benutzerkonto, ohne sudo. Der bestehende gemeinsame
  Speicher `~/.pki/nssdb` wird bevorzugt, sonst `~/.local/share/pki/nssdb`.
  Vorhandene Firefox-Profile unter `.mozilla/firefox`, `.config/mozilla/firefox`
  und dem üblichen Firefox-Flatpak-Profilpfad werden ebenfalls angezeigt und
  berücksichtigt. Ungewöhnliche externe Profilpfade und andere abgeschottete
  Browser können eine eigene Einrichtung benötigen. Es wird ausschließlich dem
  konkreten Serverzertifikat vertraut (`P,,`), keine systemweite CA installiert.
- **macOS:** SSL-Vertrauen für localhost im Benutzerschlüsselbund über `security`.
  Eine erforderliche Sicherheitsabfrage bleibt erhalten.

Unter Linux werden `openssl` und `certutil` benötigt. Die Debian-Paketabhängigkeiten
enthalten deshalb `openssl` und `libnss3-tools`; die CI installiert diese Werkzeuge
auch für die nativen Tests. Bei fehlenden Werkzeugen erklärt die App den Grund.
Für Arch Linux stammt `certutil` aus dem Paket `nss`. AppImages benötigen die
Werkzeuge auf dem Wirtsystem.

Ein teilweise fehlgeschlagener Import bleibt sichtbar. Bereits bestätigte Einträge
werden beim erneuten Versuch erkannt und nicht doppelt angelegt. Eine erreichbare
HTTPS-Seite allein versteckt den Importbutton nicht, solange Vertrauen fehlt.

## Vertrauensgrenze (A-23.2–5)

Der IPC-Auftrag enthält weiterhin nur den SHA-256-Fingerabdruck. Dateipfad,
Zieladresse und ausführbare Werkzeuge bestimmt die native Hülle. Importiert werden
nur die im selben Aufruf geprüften öffentlichen Zertifikatsbytes. NSS liest diese
Bytes direkt von stdin; der private Schlüssel wird nicht geöffnet.

Der native Unix-Adapter prüft das X.509-Zertifikat mit `x509-parser`, inklusive
Eigenunterschrift, Gültigkeit, CA:false, ausschließlich localhost/127.0.0.1 und
Server-Authentifizierung. Werkzeugaufrufe verwenden Argumentlisten statt Shellcode,
begrenzte Ausgaben und Fristen. Gleichzeitige native Einrichtungsaufrufe werden
serialisiert. Der macOS-Import und die TLS-Prüfung verwenden temporäre öffentliche
Zertifikatskopien, die anschließend entfernt werden.

Unter Linux sind zwei Ergebnisse getrennt: NSS-Einträge werden aus den Browserdatenbanken
nachgelesen; OpenSSL prüft die Loopback-HTTPS-Verbindung gegen das bestätigte Zertifikat,
mit Hostnamen-, Gültigkeits- und Peer-Fingerabdruckprüfung. Das behauptet kein Vertrauen
im systemweiten Linux-Zertifikatsspeicher oder in einem nicht erkannten Browserprofil.

## Nachweise

- `pnpm test:rust`: 75 bestanden, 1 ignoriert. Sechs neue Linux-Fälle prüfen echte
  temporäre NSS-Datenbanken, einen echten lokalen HTTPS-Server, Idempotenz,
  Ablehnung ungeeigneter Zertifikate, Fingerabdruckwechsel, Teilergebnisse und Zeitgrenzen.
- `pnpm exec vitest run apps/desktop/test/outlookCertificate.test.ts`: 16 bestanden.
- `pnpm exec playwright test -c tests/e2e/playwright.outlook-certificate.config.ts`:
  3 bestanden. Echte UI und IPC-Parser, simulierte native Plattformantworten.
  Der Testserver verwendet Port 5191 und benötigt keine laufende API.
- `pnpm typecheck`, `pnpm proof:shell-surface`, `pnpm proof:foreign` sowie der
  Web-Build erfolgreich.

Der native Linux-Pfad wurde auf Arch Linux getestet; Windows- und macOS-Dialoge
wurden im Browser mit simulierten Plattformantworten geprüft. Der neue native
macOS-Import wurde hier nicht auf einem Mac ausgeführt. Die persönlichen
Browser-Zertifikatsspeicher werden von den Tests nicht verändert.
