param(
    [string]$HubRoot,
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$tools = @(
    'get_catalog',
    'list_instructions',
    'get_instruction',
    'search_instructions',
    'list_prompts',
    'get_prompt',
    'search_prompts',
    'list_agents',
    'get_agent',
    'search_agents',
    'list_skills',
    'get_skill',
    'search_skills'
)

if ([string]::IsNullOrWhiteSpace($HubRoot)) {
    $HubRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}
else {
    $HubRoot = (Resolve-Path $HubRoot).Path
}

$mcpServerRoot = Join-Path $HubRoot 'mcp-server'
$serverEntry = Join-Path $mcpServerRoot 'dist\index.js'

if (-not $SkipBuild) {
    Write-Host "Building MCP server in $mcpServerRoot"
    Push-Location $mcpServerRoot
    try {
        npm ci
        npm run build
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path $serverEntry)) {
    throw "MCP server entry was not found at $serverEntry. Run build first or omit -SkipBuild."
}

function Read-JsonObject {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return @{}
    }

    $raw = Get-Content -LiteralPath $Path -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @{}
    }

    try {
        $parsed = $raw | ConvertFrom-Json -AsHashtable
        if ($null -eq $parsed) {
            return @{}
        }

        return $parsed
    }
    catch {
        # VS Code user mcp.json may contain JSONC comments/trailing commas.
        $json = Convert-JsoncToJson -Jsonc $raw
        $parsed = $json | ConvertFrom-Json -AsHashtable
        if ($null -eq $parsed) {
            return @{}
        }

        return $parsed
    }
}

function Write-JsonObject {
    param(
        [string]$Path,
        [hashtable]$Object
    )

    $parent = Split-Path -Parent $Path
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $json = $Object | ConvertTo-Json -Depth 20
    Set-Content -LiteralPath $Path -Value ($json + "`n") -NoNewline -Encoding UTF8
}

function Convert-JsoncToJson {
    param([string]$Jsonc)

    $builder = New-Object System.Text.StringBuilder
    $inString = $false
    $inLineComment = $false
    $inBlockComment = $false
    $escape = $false

    for ($i = 0; $i -lt $Jsonc.Length; $i++) {
        $c = $Jsonc[$i]
        $next = if ($i + 1 -lt $Jsonc.Length) { $Jsonc[$i + 1] } else { [char]0 }

        if ($inLineComment) {
            if ($c -eq "`n") {
                $inLineComment = $false
                [void]$builder.Append($c)
            }
            continue
        }

        if ($inBlockComment) {
            if ($c -eq '*' -and $next -eq '/') {
                $inBlockComment = $false
                $i++
            }
            continue
        }

        if (-not $inString -and $c -eq '/' -and $next -eq '/') {
            $inLineComment = $true
            $i++
            continue
        }

        if (-not $inString -and $c -eq '/' -and $next -eq '*') {
            $inBlockComment = $true
            $i++
            continue
        }

        [void]$builder.Append($c)

        if ($inString) {
            if ($escape) {
                $escape = $false
            }
            elseif ($c -eq '\\') {
                $escape = $true
            }
            elseif ($c -eq '"') {
                $inString = $false
            }
        }
        elseif ($c -eq '"') {
            $inString = $true
        }
    }

    # Remove trailing commas before '}' or ']'.
    return ([regex]::Replace($builder.ToString(), ',(?=\s*[}\]])', ''))
}

function Ensure-HashtableKey {
    param(
        [hashtable]$Object,
        [string]$Key
    )

    if (-not $Object.ContainsKey($Key) -or -not ($Object[$Key] -is [hashtable])) {
        $Object[$Key] = @{}
    }
}

$serverConfig = @{
    type    = 'local'
    command = 'node'
    args    = @($serverEntry)
    env     = @{
        GH_COPILOT_CONTENT_ROOT = $HubRoot
    }
    tools   = $tools
}

$copilotConfigPath = Join-Path $HOME '.copilot\mcp-config.json'
$copilotConfig = Read-JsonObject -Path $copilotConfigPath
Ensure-HashtableKey -Object $copilotConfig -Key 'mcpServers'
$copilotConfig['mcpServers']['frasermolyneux-copilot'] = $serverConfig
Write-JsonObject -Path $copilotConfigPath -Object $copilotConfig
Write-Host "Updated $copilotConfigPath"

if (-not $env:APPDATA) {
    throw 'APPDATA is not set. Cannot locate VS Code user mcp.json on this machine.'
}

$vsCodeConfigPath = Join-Path $env:APPDATA 'Code\User\mcp.json'
$vsCodeConfig = Read-JsonObject -Path $vsCodeConfigPath
Ensure-HashtableKey -Object $vsCodeConfig -Key 'servers'
$vsCodeConfig['servers']['frasermolyneux-copilot'] = @{
    type    = 'stdio'
    command = 'node'
    args    = @($serverEntry)
    env     = @{
        GH_COPILOT_CONTENT_ROOT = $HubRoot
    }
    tools   = $tools
}
Write-JsonObject -Path $vsCodeConfigPath -Object $vsCodeConfig
Write-Host "Updated $vsCodeConfigPath"

Write-Host 'Local MCP wire-up complete. Open a new Copilot App/CLI/VS Code session to pick up changes.'
