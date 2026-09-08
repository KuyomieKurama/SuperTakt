# A-23: fixed local certificate operation. Input is data on stdin, never code.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)

function Fingerprint($certificate) {
    $hash = [System.Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($hash.ComputeHash($certificate.RawData))).Replace('-', '') }
    finally { $hash.Dispose() }
}

function IsLocalServerCertificate($certificate) {
    # Exact SAN of SuperTakt: localhost and 127.0.0.1, no additional names.
    $san = @($certificate.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.17' })
    $basic = @($certificate.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.19' })
    $eku = @($certificate.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.37' })
    if ($san.Count -ne 1 -or $basic.Count -ne 1 -or $eku.Count -ne 1) { return $false }
    if ([BitConverter]::ToString($san[0].RawData).Replace('-', '') -ne '301182096C6F63616C686F737487047F000001') { return $false }
    $constraints = New-Object System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension
    $constraints.CopyFrom($basic[0])
    if ($constraints.CertificateAuthority) { return $false }
    $usage = New-Object System.Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension
    $usage.CopyFrom($eku[0])
    if ($usage.EnhancedKeyUsages.Count -ne 1 -or $usage.EnhancedKeyUsages[0].Value -ne '1.3.6.1.5.5.7.3.1') { return $false }
    return [Convert]::ToBase64String($certificate.SubjectName.RawData) -eq [Convert]::ToBase64String($certificate.IssuerName.RawData)
}

function CheckHttps($fingerprint) {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tls = $null
    try {
        if (-not $tcp.ConnectAsync('127.0.0.1', 17844).Wait(3000)) { return 'unreachable' }
        # No validation callback: Schannel checks the Windows trust store,
        # certificate lifetime and the localhost hostname normally.
        $tls = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false)
        $tls.ReadTimeout = 3000
        $tls.WriteTimeout = 3000
        if (-not $tls.AuthenticateAsClientAsync('localhost').Wait(5000)) { return 'tls_failed' }
        $peer = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($tls.RemoteCertificate)
        try { if ((Fingerprint $peer) -ne $fingerprint) { return 'certificate_mismatch' } }
        finally { $peer.Dispose() }
        $request = [Text.Encoding]::ASCII.GetBytes("GET /index.html HTTP/1.1`r`nHost: localhost:17844`r`nConnection: close`r`n`r`n")
        $tls.Write($request, 0, $request.Length)
        $tls.Flush()
        $reader = New-Object System.IO.StreamReader($tls)
        try {
            if ($reader.ReadLine() -match '^HTTP/1\.[01] 200(?: |$)') { return 'ready' }
            return 'page_missing'
        } finally { $reader.Dispose() }
    } catch {
        if (-not $tcp.Connected) { return 'unreachable' }
        return 'tls_failed'
    } finally {
        if ($null -ne $tls) { $tls.Dispose() }
        $tcp.Dispose()
    }
}

$certificate = $null
try {
    $inputData = [Console]::In.ReadToEnd() | ConvertFrom-Json
    if ($inputData.action -notin @('inspect', 'trust')) { throw 'operation_invalid' }
    if (-not [IO.File]::Exists($inputData.path)) { throw 'certificate_missing' }
    $bytes = [IO.File]::ReadAllBytes($inputData.path)
    if ($bytes.Length -gt 32768) { throw 'certificate_invalid' }
    $certificate = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 -ArgumentList @(,$bytes)
    $fingerprint = Fingerprint $certificate
    $validProfile = IsLocalServerCertificate $certificate
    $now = [DateTime]::UtcNow
    $validNow = $certificate.NotBefore.ToUniversalTime() -le $now -and $certificate.NotAfter.ToUniversalTime() -gt $now
    if ($inputData.action -eq 'trust') {
        if (-not $validProfile -or -not $validNow) { throw 'certificate_invalid' }
        if ($inputData.fingerprint -cnotmatch '^[A-F0-9]{64}$' -or $inputData.fingerprint -cne $fingerprint) { throw 'certificate_changed' }
        # Add the already-read certificate, never reopen the file after confirmation.
        # This touches only CurrentUser\Root and never elevates or changes policy.
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store('Root', 'CurrentUser')
        try {
            $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
            $store.Add($certificate)
        } catch { throw 'trust_failed' }
        finally { $store.Close() }
    }
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store('Root', 'CurrentUser')
    try {
        $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadOnly)
        $installed = @($store.Certificates | Where-Object { (Fingerprint $_) -eq $fingerprint }).Count -gt 0
    } finally { $store.Close() }
    $https = if ($validProfile -and $validNow) { CheckHttps $fingerprint } else { 'certificate_invalid' }
    [ordered]@{
        supported = $true
        fingerprint = $fingerprint
        subject = $certificate.Subject
        issuer = $certificate.Issuer
        validFrom = $certificate.NotBefore.ToUniversalTime().ToString('o')
        validUntil = $certificate.NotAfter.ToUniversalTime().ToString('o')
        validProfile = [bool]$validProfile
        validNow = [bool]$validNow
        installed = [bool]$installed
        https = $https
    } | ConvertTo-Json -Compress
} catch {
    # Never print file contents, keys, or exception details.
    $code = $_.Exception.Message
    if ($code -notin @('certificate_missing', 'certificate_invalid', 'certificate_changed', 'trust_failed', 'operation_invalid')) { $code = 'inspection_failed' }
    @{ error = $code } | ConvertTo-Json -Compress
} finally {
    if ($null -ne $certificate) { $certificate.Dispose() }
}
