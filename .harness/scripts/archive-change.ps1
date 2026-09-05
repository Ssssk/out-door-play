param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]
    [string]$Name
)

$ErrorActionPreference = 'Stop'
$harnessRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $harnessRoot "changes\$Name"
$archiveRoot = Join-Path $harnessRoot 'changes\archive'

if (-not (Test-Path -LiteralPath $source)) { throw "Change 不存在: $source" }
$statusFile = Join-Path $source 'status.yaml'
if (-not (Test-Path -LiteralPath $statusFile)) { throw "缺少 status.yaml" }
$status = Get-Content -Raw -LiteralPath $statusFile
if ($status -notmatch '(?m)^state:\s*["'']?completed["'']?\s*$') {
    throw '只有 state=completed 的 Change 才能归档。'
}

Push-Location (Split-Path -Parent $harnessRoot)
try {
    & node '.harness/scripts/validate-harness.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Harness 校验失败，拒绝归档。' }
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $archiveRoot)) {
    New-Item -ItemType Directory -Path $archiveRoot | Out-Null
}
$destination = Join-Path $archiveRoot "$(Get-Date -Format 'yyyy-MM-dd')-$Name"
if (Test-Path -LiteralPath $destination) { throw "归档目标已存在: $destination" }

Move-Item -LiteralPath $source -Destination $destination
$archivedStatus = Join-Path $destination 'status.yaml'
$content = (Get-Content -Raw -LiteralPath $archivedStatus) -replace '(?m)^state:\s*["'']?completed["'']?\s*$', 'state: "archived"'
Set-Content -LiteralPath $archivedStatus -Value $content -Encoding utf8NoBOM
Write-Output "已归档到: $destination"
