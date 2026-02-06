# NEMO Manufacturing Deleted Config Recovery
# Scans for and recovers deleted manufacturing configurations

param(
    [string]$ScanPath = ".",
    [string]$RecoveryPath = "$env:USERPROFILE\.nemo\manufacturing\recovered",
    [switch]$DeepScan,
    [switch]$AutoRecover
)

$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-ColorOutput($Message, $Color = "White") {
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Find-DeletedConfigs {
    param([string]$Path)
    
    Write-ColorOutput "🔍 Scanning for deleted manufacturing configs..." "Info"
    
    $deletedPatterns = @(
        "*.deleted",
        "*.bak",
        "*.backup",
        "*~",
        "*.old",
        "*.previous",
        "*.recovered"
    )
    
    $found = @()
    
    foreach ($pattern in $deletedPatterns) {
        $files = Get-ChildItem -Path $Path -Filter $pattern -Recurse -ErrorAction SilentlyContinue
        $found += $files | Where-Object { 
            $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
            $content -match '"_schema"\s*:\s*"nemo-manufacturing' -or
            $content -match '"manufacturing"\s*:\s*\{'
        }
    }
    
    if ($DeepScan) {
        Write-ColorOutput "🔬 Deep scan enabled..." "Warning"
        $allJson = Get-ChildItem -Path $Path -Filter "*.json" -Recurse -ErrorAction SilentlyContinue
        foreach ($file in $allJson) {
            try {
                $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -match '"facility"' -and $content -match '"production_lines"') {
                    if ($found -notcontains $file) {
                        $found += $file
                    }
                }
            } catch {}
        }
    }
    
    Write-ColorOutput "✓ Found $($found.Count) potential config(s)" "Success"
    return $found
}

function Recover-Config {
    param(
        [System.IO.FileInfo]$Source,
        [string]$Destination
    )
    
    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }
    
    $destFile = Join-Path $Destination $Source.Name
    Copy-Item $Source.FullName $destFile -Force
    Write-ColorOutput "  ✓ Recovered: $(Split-Path $destFile -Leaf)" "Success"
    return $true
}

Write-ColorOutput "🔮 NEMO Manufacturing Config Recovery v3.1" "Info"
$deletedConfigs = Find-DeletedConfigs -Path $ScanPath

if ($deletedConfigs.Count -eq 0) {
    Write-ColorOutput "`n✅ No deleted configs found" "Success"
    exit 0
}

foreach ($config in $deletedConfigs) {
    Recover-Config -Source $config -Destination $RecoveryPath
}

Write-ColorOutput "`n✨ Recovery complete!" "Success"
