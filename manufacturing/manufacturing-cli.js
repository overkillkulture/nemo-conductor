#!/usr/bin/env node
/**
 * NEMO Manufacturing CLI for Windows
 * Entry point for manufacturing config management
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const COMMANDS = {
    'reindex': 'Re-index all manufacturing configs',
    'recover': 'Recover deleted configs',
    'validate': 'Validate config schema',
    'template': 'Generate new config from template',
    'gui': 'Launch manufacturing GUI panel'
};

function printBanner() {
    console.log('');
    console.log('🔮 NEMO Manufacturing Config Manager v3.1');
    console.log('==========================================');
    console.log('Windows-Optimized | Supabase-Integrated');
    console.log('');
}

function printUsage() {
    console.log('Usage: node manufacturing-cli.js <command> [options]');
    console.log('');
    console.log('Commands:');
    Object.entries(COMMANDS).forEach(([cmd, desc]) => {
        console.log(`  ${cmd.padEnd(10)} ${desc}`);
    });
    console.log('');
    console.log('Options:');
    console.log('  --config-path <path>   Path to config directory');
    console.log('  --validate-only        Only validate, no changes');
    console.log('  --create-backup        Create backups before changes');
    console.log('  --deep-scan            Deep scan for deleted files');
    console.log('');
}

function runReindex(args) {
    const configPath = args.find(a => a.startsWith('--config-path'))?.split('=')[1] || '.\\templates';
    const validateOnly = args.includes('--validate-only');
    const createBackup = args.includes('--create-backup');
    
    console.log('📁 Running config re-indexer...');
    
    const scriptPath = path.join(__dirname, 'config', 'reindex-manufacturing.ps1');
    const flags = [];
    if (validateOnly) flags.push('-ValidateOnly');
    if (createBackup) flags.push('-CreateBackup');
    
    try {
        execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -ConfigPath "${configPath}" ${flags.join(' ')}`, {
            stdio: 'inherit',
            cwd: __dirname
        });
    } catch (err) {
        console.error('Reindex failed:', err.message);
        process.exit(1);
    }
}

function runRecover(args) {
    const deepScan = args.includes('--deep-scan');
    const autoRecover = args.includes('--auto-recover');
    
    console.log('🔍 Running deleted config recovery...');
    
    const scriptPath = path.join(__dirname, 'config', 'recover-deleted.ps1');
    const flags = [];
    if (deepScan) flags.push('-DeepScan');
    if (autoRecover) flags.push('-AutoRecover');
    
    try {
        execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" ${flags.join(' ')}`, {
            stdio: 'inherit',
            cwd: __dirname
        });
    } catch (err) {
        console.error('Recovery failed:', err.message);
        process.exit(1);
    }
}

function generateTemplate(args) {
    const name = args.find(a => !a.startsWith('--')) || 'new-facility';
    const outputPath = path.join(__dirname, 'templates', `${name}.json`);
    
    const template = {
        _schema: "nemo-manufacturing-config-v3.1",
        _platform: "windows",
        manufacturing: {
            facility: {
                id: `FAC-${Date.now().toString().slice(-4)}`,
                name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                location: "TBD",
                timezone: "UTC"
            },
            production_lines: [],
            inventory: {
                warehouses: []
            },
            workforce: {
                total_employees: 0
            },
            kpis: {
                oee: { target: 0.85, current: 0 }
            },
            windows_integration: {
                domain: "MANUFACTURING.CORP",
                active_directory_enabled: true,
                sccm_deployed: false,
                wsus_configured: false,
                iot_core_devices: [],
                power_shell_scripts: []
            }
        },
        reindex_metadata: {
            last_reindex: new Date().toISOString(),
            reindex_count: 1,
            version_history: [{
                version: 1,
                timestamp: new Date().toISOString(),
                changes: ["Initial template generation"]
            }]
        }
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
    console.log(`✅ Template created: ${outputPath}`);
}

// Main
printBanner();

const command = process.argv[2];
const args = process.argv.slice(3);

if (!command || command === 'help') {
    printUsage();
    process.exit(0);
}

switch (command) {
    case 'reindex':
        runReindex(args);
        break;
    case 'recover':
        runRecover(args);
        break;
    case 'template':
        generateTemplate(args);
        break;
    case 'validate':
        args.push('--validate-only');
        runReindex(args);
        break;
    case 'gui':
        console.log('🖥️  Opening manufacturing panel in browser...');
        console.log('   Navigate to: http://localhost:7777');
        console.log('   Select "Manufacturing" from the sidebar');
        break;
    default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
}

console.log('');
console.log('✨ Done!');
