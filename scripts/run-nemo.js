#!/usr/bin/env node
/**
 * NEMO Conductor - Main Runner
 * Orchestrates the 5-Key Council for deep codebase analysis
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Council Configuration
const COUNCIL_KEYS = [
  'GHOST_API_KEY',
  'ARCHITECT_API_KEY', 
  'MONK_API_KEY',
  'SHADOW_API_KEY',
  'OBSERVER_API_KEY'
];

const COUNCIL_NAMES = {
  GHOST_API_KEY: 'THE GHOST',
  ARCHITECT_API_KEY: 'THE ARCHITECT',
  MONK_API_KEY: 'THE MONK',
  SHADOW_API_KEY: 'THE SHADOW',
  OBSERVER_API_KEY: 'THE OBSERVER'
};

// Tier Configuration
const TIERS = {
  efficient: { ram: '4-8GB', workers: 2, cache: 'minimal' },
  performance: { ram: '8-16GB', workers: 4, cache: 'balanced' },
  ascension: { ram: '32GB+', workers: 8, cache: 'unlimited' }
};

class NEMOConductor {
  constructor(options = {}) {
    this.tier = options.tier || 'efficient';
    this.mode = options.mode || 'HYBRID_SYNC';
    this.keysPath = options.keys || './council-keys.json';
    this.council = new Map();
    this.status = 'idle';
  }

  async initialize() {
    console.log('?? NEMO Conductor v3.1');
    console.log(`Mode: ${this.mode} | Tier: ${this.tier.toUpperCase()}`);
    console.log('-'.repeat(50));
    
    // Load API keys
    await this.loadKeys();
    
    // Initialize council
    await this.initCouncil();
    
    // Run tier check
    this.tierCheck();
    
    return this;
  }

  async loadKeys() {
    try {
      if (fs.existsSync(this.keysPath)) {
        const keys = JSON.parse(fs.readFileSync(this.keysPath, 'utf8'));
        COUNCIL_KEYS.forEach(key => {
          if (keys[key]) {
            process.env[key] = keys[key];
          }
        });
        console.log('? Council keys loaded');
      } else {
        console.log('? No council-keys.json found, using environment variables');
      }
    } catch (err) {
      console.error('? Failed to load keys:', err.message);
    }
  }

  async initCouncil() {
    console.log('\n???  Initializing 5-Key Council:\n');
    
    COUNCIL_KEYS.forEach((key, idx) => {
      const name = COUNCIL_NAMES[key];
      const status = process.env[key] ? '?? Ready' : '?? Missing';
      console.log(`  ${idx + 1}. ${name.padEnd(12)} ${status}`);
      
      this.council.set(key, {
        name,
        active: !!process.env[key],
        key: key
      });
    });
    
    const activeCount = Array.from(this.council.values()).filter(k => k.active).length;
    console.log(`\n? ${activeCount}/5 keys active`);
  }

  tierCheck() {
    const config = TIERS[this.tier];
    console.log(`\n? Tier Configuration:`);
    console.log(`  RAM Target: ${config.ram}`);
    console.log(`  Workers: ${config.workers}`);
    console.log(`  Cache: ${config.cache}`);
    
    // Check available memory (Windows/Linux/Mac)
    const os = require('os');
    const freeMem = os.freemem() / 1024 / 1024 / 1024;
    const totalMem = os.totalmem() / 1024 / 1024 / 1024;
    console.log(`  System: ${freeMem.toFixed(2)}GB free / ${totalMem.toFixed(2)}GB total`);
  }

  async runCommand(command, args = []) {
    console.log(`\n?? Executing: ${command} ${args.join(' ')}`);
    
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        env: process.env
      });
      
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command exited with code ${code}`));
      });
    });
  }

  statusReport() {
    console.log('\n?? Council Status Report');
    console.log('-'.repeat(50));
    this.council.forEach((member, key) => {
      console.log(`${member.name}: ${member.active ? 'ACTIVE' : 'INACTIVE'}`);
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    tier: 'efficient',
    mode: 'HYBRID_SYNC',
    keys: './council-keys.json'
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--tier=')) {
      options.tier = arg.split('=')[1];
    } else if (arg.startsWith('--mode=')) {
      options.mode = arg.split('=')[1];
    } else if (arg.startsWith('--keys=')) {
      options.keys = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
NEMO Conductor v3.1

Usage: node run-nemo.js [options]

Options:
  --tier=efficient|performance|ascension    Memory tier (default: efficient)
  --mode=HYBRID_SYNC|LOCAL|CLOUD            Operation mode (default: HYBRID_SYNC)
  --keys=./council-keys.json                Path to API keys file
  --help, -h                                Show this help

Examples:
  node run-nemo.js --tier=efficient
  node run-nemo.js --tier=performance --keys=./my-keys.json
      `);
      process.exit(0);
    }
  }

  const conductor = new NEMOConductor(options);
  await conductor.initialize();
  conductor.statusReport();
  
  console.log('\n? NEMO Conductor ready\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { NEMOConductor, COUNCIL_KEYS, TIERS };
