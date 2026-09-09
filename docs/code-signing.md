# Code-Signing für SuperTakt

Diese Datei beschreibt die einmalige Einrichtung für signierte SuperTakt-Releases.
Die Domain `supertakt.de` ist die öffentliche Projekt-/Produktdomain. Sie ersetzt
**kein** Code-Signing-Zertifikat.

## Grundsatz

- Windows: Authenticode-Signatur für Programmdateien und NSIS-Installer.
- macOS: Developer-ID-Signatur **und** Apple-Notarisierung.
- Linux: weiterhin SHA-256-Prüfsummen; optional kann später eine zusätzliche
  GPG-/AppImage-Signatur ergänzt werden.
- Signiermaterial wird nie eingecheckt. Es liegt ausschließlich in GitHub
  Actions Secrets bzw. beim externen Signierdienst.
- Die vorhandene Tauri-Kennung `de.takt.desktop` bleibt vorerst unverändert.
  Der Besitz von `supertakt.de` ist kein technischer Grund für einen Wechsel der
  Bundle-ID; ein solcher Wechsel ist eine eigene Migrationsentscheidung.

## Windows

`apps/desktop/scripts/sign-windows.mjs` unterstützt zwei Wege.

### Variante A — PFX/PKCS#12

Für ein exportierbares Authenticode-Code-Signing-Zertifikat werden benötigt:

| GitHub Secret / Variable | Bedeutung |
|---|---|
| `TAKT_WINDOWS_SIGNING_PROVIDER` | `pfx` |
| `WINDOWS_CERTIFICATE_BASE64` | `.pfx`/`.p12` als Base64 |
| `WINDOWS_CERTIFICATE_PASSWORD` | Kennwort der Zertifikatsdatei |
| `WINDOWS_TIMESTAMP_URL` | optional; Standard im Signierskript ist DigiCert RFC3161 |

Der Workflow muss `WINDOWS_CERTIFICATE_BASE64` auf dem Windows-Läufer in eine
Datei unter `$RUNNER_TEMP` dekodieren und deren Pfad als
`WINDOWS_CERTIFICATE_PATH` an den Build geben.

**Wichtig:** Bei modernen öffentlich vertrauenswürdigen Code-Signing-Zertifikaten
kann der private Schlüssel aufgrund aktueller CA/B-Anforderungen auf Hardware
oder in einem Cloud-HSM liegen. In diesem Fall ist die PFX-Variante nicht
geeignet; dann einen Cloud-/HSM-Anbieter oder Azure Artifact Signing verwenden.

### Variante B — Microsoft Azure Artifact Signing

Benötigt werden:

| GitHub Secret / Variable | Bedeutung |
|---|---|
| `TAKT_WINDOWS_SIGNING_PROVIDER` | `artifact-signing` |
| `AZURE_ARTIFACT_SIGNING_ENDPOINT` | Artifact-Signing-Endpunkt |
| `AZURE_ARTIFACT_SIGNING_ACCOUNT` | Accountname |
| `AZURE_ARTIFACT_SIGNING_PROFILE` | Zertifikatsprofil |
| `AZURE_TENANT_ID` | Microsoft-Entra-Tenant |
| `AZURE_CLIENT_ID` | App-/Service-Principal-ID |
| `AZURE_CLIENT_SECRET` | Client Secret |

Auf dem Windows-Läufer muss außerdem `artifact-signing-cli` installiert sein.
Der Tauri-Bündler ruft das Signierskript pro zu signierender Datei auf.

## macOS

Für Verteilung außerhalb des Mac App Store werden ein Apple-Developer-Konto,
ein **Developer ID Application**-Zertifikat und Notarisierungszugang benötigt.

Empfohlene GitHub-Secrets:

| GitHub Secret | Bedeutung |
|---|---|
| `APPLE_CERTIFICATE` | exportiertes Developer-ID-Zertifikat als Base64-P12 |
| `APPLE_CERTIFICATE_PASSWORD` | Kennwort des P12 |
| `APPLE_SIGNING_IDENTITY` | vollständiger Name der Developer-ID-Identität |
| `APPLE_API_ISSUER` | App Store Connect API Issuer ID |
| `APPLE_API_KEY` | App Store Connect API Key ID |
| `APPLE_API_KEY_P8` | Inhalt der `.p8`-Datei |

Der macOS-Läufer importiert das P12 in einen temporären Keychain. Die `.p8`-Datei
wird unter `$RUNNER_TEMP` geschrieben; ihr Pfad wird dem Tauri-Build als
`APPLE_API_KEY_PATH` übergeben. Tauri verwendet diese Variablen für Signierung
und Notarisierung.

Nach dem Build müssen mindestens diese Prüfungen grün sein:

```bash
codesign --verify --deep --strict --verbose=2 <SuperTakt.app>
spctl --assess --type execute --verbose=2 <SuperTakt.app>
```

Für die veröffentlichte DMG sollte zusätzlich die Notarisierung/stapling-Prüfung
im CI nachvollziehbar sein.

## Release-Regel

Ein echter Tag-Release (`vX.Y.Z`) soll **fail-closed** arbeiten:

1. Windows-Signierdaten fehlen → Windows-Build rot.
2. macOS-Signier-/Notarisierungsdaten fehlen → macOS-Build rot.
3. Signaturprüfung schlägt fehl → Build rot.
4. Nur wenn alle Plattform-Builds erfolgreich sind, darf `publish` laufen.

Ein manueller `workflow_dispatch`-Probelauf darf weiterhin ohne Signiermaterial
bauen, damit CI/Packaging unabhängig von Zertifikatskosten getestet werden kann.

## Release-Beschreibung

`.github/release-preamble.md` darf erst dann von „unsigniert“ auf „signiert“
geändert werden, wenn der Workflow die Signaturen **technisch verifiziert**.
Die Beschreibung ist keine Quelle der Wahrheit; der Build ist es.

## Vor dem Aktivieren

- Rechtlichen Publishernamen festlegen. Zertifikat/Apple-Konto müssen diesen
  Namen tragen; `SuperTakt` allein ist nur dann ausreichend, wenn es auch die
  verifizierte Herausgeberidentität ist.
- Windows-Anbieter auswählen (`pfx` oder `artifact-signing`).
- Apple Developer ID und App-Store-Connect-Key erstellen.
- GitHub-Secrets eintragen.
- Einen manuellen Probelauf durchführen.
- Erst danach die Release-Pipeline auf „Signatur zwingend“ umstellen.
