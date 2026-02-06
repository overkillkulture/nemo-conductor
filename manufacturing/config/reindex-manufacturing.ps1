# NEMO Manufacturing Config Re-Indexer for Windows
# Re-indexes all manufacturing configurations and validates against schema

param(
    [string]$ConfigPath = ".\templates",
    [string]$BackupPath = "$env:USERPROFILE\.nemo\manufacturing\backup",
    [switch]$ValidateOnly,
    [switch]$CreateBackup
)

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-ColorOutput($Message, $Color = "White") {
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Initialize-ReindexEnvironment {
    Write-ColorOutput "🔮 NEMO Manufacturing Config Re-Indexer v3.1" "Info"
    Write-ColorOutput "============================================" "Info"
    
    # Create backup directory if needed
    if ($CreateBackup -and -not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
        Write-ColorOutput "✓ Created backup directory: $BackupPath" "Success"
    }
    
    # Check if config path exists
    if (-not (Test-Path $ConfigPath)) {
        Write-ColorOutput "✗ Config path not found: $ConfigPath" "Error"
        exit 1
    }
    
    Write-ColorOutput "✓ Environment initialized" "Success"
}

function Get-ManufacturingConfigs {
    param([string]$Path)
    
    Write-ColorOutput "`n📁 Scanning for manufacturing configs..." "Info"
    
    $configs = Get-ChildItem -Path $Path -Filter "*.json" -Recurse | Where-Object {
        $content = Get-Content $_.FullName -Raw
        $content -match '"_schema"\s*:\s*"nemo-manufacturing'
    }
    
    Write-ColorOutput "✓ Found $($configs.Count) manufacturing config(s)" "Success"
    return $configs
}

function Backup-Config {
    param([System.IO.FileInfo]$Config)
    
    if (-not $CreateBackup) { return }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupName = "$($Config.BaseName)_$timestamp$($Config.Extension)"
    $backupFile = Join-Path $BackupPath $backupName
    
    Copy-Item $Config.FullName $backupFile -Force
    Write-ColorOutput "  💾 Backed up to: $backupName" "Success"
}

function Test-ConfigSchema {
    param([System.IO.FileInfo]$Config)
    
    Write-ColorOutput "`n🔍 Validating: $($Config.Name)" "Info"
    
    try {
        $json = Get-Content $Config.FullName -Raw | ConvertFrom-Json
        $errors = @()
        $warnings = @()
        
        # Check required fields
        $requiredFields = @(
            "_schema",
            "_platform",
            "manufacturing.facility.id",
            "manufacturing.production_lines",
            "manufacturing.inventory.warehouses"
        )
        
        foreach ($field in $requiredFields) {
            $parts = $field -split '\.'
            $current = $json
            $valid = $true
            
            foreach ($part in $parts) {
                if ($current.$part -eq $null) {
                    $valid = $false
                    break
                }
                $current = $current.$part
            }
            
            if (-not $valid) {
                $errors += "Missing required field: $field"
            }
        }
        
        # Validate production lines
        if ($json.manufacturing.production_lines) {
            $lineIds = @{}
            foreach ($line in $json.manufacturing.production_lines) {
                if ($lineIds.ContainsKey($line.id)) {
                    $errors += "Duplicate production line ID: $($line.id)"
                } else {
                    $lineIds[$line.id] = $true
                }
                
                # Validate equipment
                if ($line.equipment) {
                    foreach ($equip in $line.equipment) {
                        if (-not $equip.id) {
                            $warnings += "Equipment missing ID in line $($line.id)"
                        }
                        if (-not $equip.status) {
                            $warnings += "Equipment $($equip.id) missing status"
                        }
                    }
                }
            }
        }
        
        # Check Windows-specific fields
        if ($json._platform -eq "windows") {
            if (-not $json.manufacturing.windows_integration) {
                $warnings += "Windows integration section missing"
            }
        }
        
        # Output results
        if ($errors.Count -eq 0) {
            Write-ColorOutput "  ✓ Schema validation passed" "Success"
        } else {
            Write-ColorOutput "  ✗ Schema validation failed:" "Error"
            $errors | ForEach-Object { Write-ColorOutput "    - $_" "Error" }
        }
        
        if ($warnings.Count -gt 0) {
            Write-ColorOutput "  ⚠ Warnings:" "Warning"
            $warnings | ForEach-Object { Write-ColorOutput "    - $_" "Warning" }
        }
        
        return $errors.Count -eq 0
        
    } catch {
        Write-ColorOutput "  ✗ JSON parse error: $_" "Error"
        return $false
    }
}

function Update-ReindexMetadata {
    param([System.IO.FileInfo]$Config)
    
    $json = Get-Content $Config.FullName -Raw | ConvertFrom-Json
    
    # Initialize metadata if missing
    if (-not $json.reindex_metadata) {
        $json | Add-Member -NotePropertyName "reindex_metadata" -NotePropertyValue @{
            last_reindex = $null
            reindex_count = 0
            version_history = @()
        }
    }
    
    # Update metadata
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    $json.reindex_metadata.last_reindex = $timestamp
    $json.reindex_metadata.reindex_count++
    
    $versionEntry = @{
        version = $json.reindex_metadata.reindex_count
        timestamp = $timestamp
        changes = @("Re-indexed by NEMO v3.1")
    }
    
    $json.reindex_metadata.version_history += $versionEntry
    
    # Save updated config
    $json | ConvertTo-Json -Depth 10 | Set-Content $Config.FullName -Encoding UTF8
    
    Write-ColorOutput "  📝 Updated reindex metadata" "Success"
}

function Repair-ConfigIssues {
    param([System.IO.FileInfo]$Config)
    
    Write-ColorOutput "`n🔧 Attempting to repair: $($Config.Name)" "Info"
    
    $json = Get-Content $Config.FullName -Raw | ConvertFrom-Json
    $repaired = $false
    
    # Add missing Windows integration section
    if (-not $json.manufacturing.windows_integration) {
        $json.manufacturing | Add-Member -NotePropertyName "windows_integration" -NotePropertyValue @{
            domain = "MANUFACTURING.CORP"
            active_directory_enabled = $true
            sccm_deployed = $false
            wsus_configured = $false
            iot_core_devices = @()
            power_shell_scripts = @()
        }
        $repaired = $true
        Write-ColorOutput "  ✓ Added Windows integration section" "Success"
    }
    
    # Ensure all production lines have equipment array
    foreach ($line in $json.manufacturing.production_lines) {
        if (-not $line.equipment) {
            $line | Add-Member -NotePropertyName "equipment" -NotePropertyValue @() -Force
            $repaired = $true
        }
    }
    
    if ($repaired) {
        $json | ConvertTo-Json -Depth 10 | Set-Content $Config.FullName -Encoding UTF8
        Write-ColorOutput "  ✓ Config repaired and saved" "Success"
    } else {
        Write-ColorOutput "  ℹ No repairs needed" "Info"
    }
}

function Export-ReindexReport {
    param(
        [array]$Results,
        [string]$OutputPath = ".\reindex-report.json"
    )
    
    $report = @{
        generated = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        total_configs = $Results.Count
        valid = ($Results | Where-Object { $_.Valid }).Count
        invalid = ($Results | Where-Object { -not $_.Valid }).Count
        repaired = ($Results | Where-Object { $_.Repaired }).Count
        configs = $Results
    }
    
    $report | ConvertTo-Json -Depth 5 | Set-Content $OutputPath -Encoding UTF8
    Write-ColorOutput "`n📊 Report exported to: $OutputPath" "Success"
}

# ============ MAIN EXECUTION ============

Initialize-ReindexEnvironment

$configs = Get-ManufacturingConfigs -Path $ConfigPath
$results = @()

foreach ($config in $configs) {
    $result = @{
        File = $config.Name
        Path = $config.FullName
        Valid = $false
        Repaired = $false
        Errors = @()
    }
    
    # Create backup
    Backup-Config -Config $config
    
    # Validate
    $result.Valid = Test-ConfigSchema -Config $config
    
    if (-not $result.Valid -and -not $ValidateOnly) {
        # Attempt repair
        Repair-ConfigIssues -Config $config
        
        # Re-validate
        $result.Valid = Test-ConfigSchema -Config $config
        $result.Repaired = $result.Valid
    }
    
    if ($result.Valid -and -not $ValidateOnly) {
        # Update metadata
        Update-ReindexMetadata -Config $config
    }
    
    $results += $result
}

# Summary
Write-ColorOutput "`n============================================" "Info"
Write-ColorOutput "RE-INDEX COMPLETE" "Info"
Write-ColorOutput "============================================" "Info"
Write-ColorOutput "Total configs: $($results.Count)" "Info"
Write-ColorOutput "Valid: $($results | Where-Object { $_.Valid }).Count" "Success"
Write-ColorOutput "Invalid: $($results | Where-Object { -not $_.Valid }).Count" "Error"
Write-ColorOutput "Repaired: $($results | Where-Object { $_.Repaired }).Count" "Warning"

# Export report
Export-ReindexReport -Results $results

Write-ColorOutput "`n✨ NEMO Manufacturing Re-Indexer finished" "Success"
