param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^CHG-[A-Z0-9-]+$')]
    [string]$Id
)

$ErrorActionPreference = 'Stop'
$harnessRoot = Split-Path -Parent $PSScriptRoot
$template = Join-Path $harnessRoot 'templates\change'
$destination = Join-Path $harnessRoot "changes\$Name"

if (-not (Test-Path -LiteralPath $template)) {
    throw "Change 模板不存在: $template"
}
if (Test-Path -LiteralPath $destination) {
    throw "Change 已存在: $destination"
}

Copy-Item -Recurse -LiteralPath $template -Destination $destination
$createdAt = Get-Date -Format 'yyyy-MM-dd'

Get-ChildItem -Recurse -File -LiteralPath $destination | ForEach-Object {
    $content = Get-Content -Raw -LiteralPath $_.FullName
    $content = $content.Replace('{{CHANGE_ID}}', $Id)
    $content = $content.Replace('{{CHANGE_NAME}}', $Name)
    $content = $content.Replace('{{CREATED_AT}}', $createdAt)
    Set-Content -LiteralPath $_.FullName -Value $content -Encoding utf8NoBOM
}

Write-Output "已创建 Change: $destination"
Write-Output "下一步: 完成 00-request.md，并保持 state=draft 或 clarifying。"
