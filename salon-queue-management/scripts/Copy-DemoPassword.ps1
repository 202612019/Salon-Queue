param([Parameter(Mandatory = $true)][string]$Email)
$ErrorActionPreference = 'Stop'
$salonqVaultPath = Join-Path $PSScriptRoot '../.artifacts/demo-accounts.dpapi.json'
if (-not (Test-Path -LiteralPath $salonqVaultPath)) { throw 'Local encrypted demo password vault is missing.' }
$salonqAccounts = Get-Content -LiteralPath $salonqVaultPath -Raw | ConvertFrom-Json
$salonqAccount = @($salonqAccounts | Where-Object { $_.email -eq $Email })
if ($salonqAccount.Count -ne 1) { throw 'Choose exactly one provisioned fictional demo email.' }
# Windows DPAPI decrypts only under the Windows user/machine that created the vault.
if ($PSVersionTable.PSEdition -eq 'Core') {
    [void][Reflection.Assembly]::Load('System.Security.Cryptography.ProtectedData')
} else {
    [void][Reflection.Assembly]::LoadWithPartialName('System.Security')
}
$salonqProtectedBytes = [Convert]::FromBase64String($salonqAccount[0].password_dpapi)
$salonqClearBytes = [Security.Cryptography.ProtectedData]::Unprotect($salonqProtectedBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
$salonqClipboardValue = [Text.Encoding]::UTF8.GetString($salonqClearBytes)
[Array]::Clear($salonqClearBytes, 0, $salonqClearBytes.Length)
Set-Clipboard -Value $salonqClipboardValue
Write-Host 'Demo password copied locally. Paste it within 30 seconds; leave this window open for clipboard cleanup.'
Start-Sleep -Seconds 30
if ((Get-Clipboard -Raw) -ceq $salonqClipboardValue) { Set-Clipboard -Value '' }
$salonqClipboardValue = $null
