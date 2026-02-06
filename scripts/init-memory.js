#!/usr/bin/env node
/**
 * NEMO Memory Initialization (/init command)
 * Initializes all memory blocks for NEMO Conductor operation
 */

const fs = require('fs');
const path = require('path');

const MEMORY_BLOCKS = {
  persona: {
    label: 'persona',
    description: 'NEMO Conductor identity - orchestrates the 5-Key Council for deep codebase analysis and autonomous operations',
    value: `You are NEMO Conductor, an orchestration system managing the 5-Key Council:
- THE GHOST: Predictive intent (O(1) patterns)
- THE ARCHITECT: System design, toolbox management
- THE MONK: Deep reasoning, loop protection  
- THE SHADOW: Chi aesthetic, UI styling
- THE OBSERVER: Browser sync, monitoring

You operate in HYBRID_SYNC mode, bridging cloud reasoning with local CLI execution.
Your purpose is to coordinate deep, uncensored codebase analysis while preventing infinite loops and optimizing for the detected memory tier.`
  },
  
  research_plan: {
    label: 'research_plan',
    description: 'Active NEMO tasks and analysis queue',
    value: `## Active Tasks
- Initialize 5-Key Council
- Detect memory tier and optimize
- Load pattern cache from lib/nemo-patterns.js

## Pending Analysis
- [ ] Deep codebase architecture analysis
- [ ] Bug and security scan
- [ ] Documentation coverage assessment
- [ ] Infinite loop detection

## Completed
- [x] Memory initialization`
  },
  
  nemo_predictor: {
    label: 'nemo_predictor',
    description: 'CLI acceleration patterns - O(1) prediction cache',
    value: `## Common Commands (O(1) access)
- nemo init -> Initialize council memory
- nemo analyze -> Deep codebase analysis
- nemo council -> Enter council mode
- nemo loop-check -> Detect infinite loops
- nemo status -> Council health check

## File Patterns
- ./src/**/*.js,ts,jsx,tsx -> Source files
- ./council-keys.json -> API configuration
- ./lib/nemo-*.js -> NEMO libraries

## Predictive Shortcuts
- First run: auto-detect tier
- Subsequent runs: use cached tier
- Missing keys: prompt for council-keys.json`
  },
  
  engineering_principles: {
    label: 'engineering_principles',
    description: 'Robustness rules and error handling patterns',
    value: `## NEMO Engineering Principles

### Error Handling
- Always check for missing API keys before council operations
- Graceful degradation: council members can operate independently
- Log all errors with context for debugging

### Memory Management
- Detect system RAM on startup
- Select appropriate tier (efficient/performance/ascension)
- Cache patterns to disk, not just memory

### Loop Protection
- Run loop detector before any code generation
- Set execution timeouts on all operations
- Monitor event loop health

### Security
- Never log API keys
- Validate all inputs before execution
- Sandboxed execution for generated code

### Cross-Platform
- Support Windows (PowerShell/CMD), Linux, macOS
- Termux/Android compatibility
- Python shell integration via subprocess`
  },
  
  lib_nemo_patterns: {
    label: 'lib/nemo-patterns.js',
    description: 'Pattern cache engine with tiered strategies',
    value: `// Pattern Cache Engine - O(1) lookup
const patterns = new Map();
const strategies = {
  efficient: { maxSize: 100, ttl: 300000 },    // 5min
  performance: { maxSize: 1000, ttl: 600000 }, // 10min
  ascension: { maxSize: Infinity, ttl: Infinity }
};

module.exports = {
  get: (key) => patterns.get(key),
  set: (key, value) => {
    const strategy = strategies[process.env.NEMO_TIER || 'efficient'];
    if (patterns.size >= strategy.maxSize) {
      const oldest = patterns.keys().next().value;
      patterns.delete(oldest);
    }
    patterns.set(key, value);
  },
  clear: () => patterns.clear(),
  size: () => patterns.size
};`
  },
  
  lib_nemo_memory: {
    label: 'lib/nemo-memory.js',
    description: 'Hardware profiler with event system',
    value: `// Hardware Memory Profiler
const os = require('os');

class MemoryProfiler {
  constructor() {
    this.tier = null;
    this.events = new Map();
  }
  
  detectTier() {
    const totalGB = os.totalmem() / 1024 / 1024 / 1024;
    const freeGB = os.freemem() / 1024 / 1024 / 1024;
    
    if (totalGB >= 32) this.tier = 'ascension';
    else if (totalGB >= 8) this.tier = 'performance';
    else this.tier = 'efficient';
    
    process.env.NEMO_TIER = this.tier;
    return { tier: this.tier, totalGB, freeGB };
  }
  
  on(event, handler) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(handler);
  }
  
  emit(event, data) {
    const handlers = this.events.get(event) || [];
    handlers.forEach(h => h(data));
  }
}

module.exports = { MemoryProfiler };`
  },
  
  config_memory_tiers: {
    label: 'config/memory-tiers.json',
    description: '5-tier memory classification matrix',
    value: JSON.stringify({
      tiers: {
        efficient: {
          ramGB: { min: 4, max: 8 },
          workers: 2,
          cacheStrategy: 'minimal',
          models: ['gemini-2.0-flash-exp'],
          features: ['basic_analysis', 'single_key_priority']
        },
        performance: {
          ramGB: { min: 8, max: 16 },
          workers: 4,
          cacheStrategy: 'balanced',
          models: ['gemini-2.0-flash-exp', 'kimi-k2.5'],
          features: ['deep_analysis', 'multi_key_parallel', 'pattern_caching']
        },
        ascension: {
          ramGB: { min: 32 },
          workers: 8,
          cacheStrategy: 'unlimited',
          models: ['gemini-2.0-flash-exp', 'kimi-k2.5', 'o3-mini', 'deepseek-r1'],
          features: ['uncensored_analysis', 'full_council', 'predictive_prefetch', 'browser_sync']
        }
      },
      council: {
        keys: ['GHOST', 'ARCHITECT', 'MONK', 'SHADOW', 'OBSERVER'],
        fallback_priority: ['MONK', 'ARCHITECT', 'GHOST', 'OBSERVER', 'SHADOW'],
        mode: 'HYBRID_SYNC'
      }
    }, null, 2)
  }
};

class MemoryInitializer {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './.nemo/memory';
    this.format = options.format || 'json'; // json, md, or letta
  }

  async initialize() {
    console.log('?? NEMO Memory Initialization');
    console.log('-'.repeat(50));
    
    // Create directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Initialize each memory block
    for (const [key, block] of Object.entries(MEMORY_BLOCKS)) {
      await this.createBlock(block);
    }

    // Create council-keys template
    this.createKeysTemplate();
    
    console.log('\n? Memory initialization complete!');
    console.log(`\nNext steps:`);
    console.log(`  1. Configure API keys in council-keys.json`);
    console.log(`  2. Run: node scripts/run-nemo.js`);
    console.log(`  3. Start analysis: node scripts/analyze-codebase.js`);
  }

  async createBlock(block) {
    const filename = `${block.label.replace(/\//g, '_')}.${this.format}`;
    const filepath = path.join(this.outputDir, filename);
    
    let content;
    switch (this.format) {
      case 'json':
        content = JSON.stringify(block, null, 2);
        break;
      case 'md':
        content = `# ${block.label}\n\n**Description:** ${block.description}\n\n---\n\n${block.value}`;
        break;
      case 'letta':
        content = this.toLettaFormat(block);
        break;
      default:
        content = block.value;
    }

    fs.writeFileSync(filepath, content);
    console.log(`  ? Created ${block.label}`);
  }

  toLettaFormat(block) {
    return `---
label: ${block.label}
description: ${block.description}
---

${block.value}`;
  }

  createKeysTemplate() {
    const keysPath = path.join(process.cwd(), 'council-keys.json');
    
    if (fs.existsSync(keysPath)) {
      console.log('  ? council-keys.json already exists');
      return;
    }

    const template = {
      GHOST_API_KEY: 'your_ghost_api_key_here',
      ARCHITECT_API_KEY: 'your_architect_api_key_here',
      MONK_API_KEY: 'your_monk_api_key_here',
      SHADOW_API_KEY: 'your_shadow_api_key_here',
      OBSERVER_API_KEY: 'your_observer_api_key_here',
      PRIMARY_MODEL: 'gemini-2.0-flash-exp',
      FALLBACK_MODEL: 'kimi-k2.5',
      _comment: 'Replace with your actual API keys from OpenRouter, OpenAI, or other providers'
    };

    fs.writeFileSync(keysPath, JSON.stringify(template, null, 2));
    console.log('  ? Created council-keys.json template');
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--output=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
NEMO Memory Initialization

Usage: node init-memory.js [options]

Options:
  --output=./.nemo/memory     Output directory for memory files
  --format=json|md|letta      Output format (default: json)
  --help, -h                  Show this help

This creates:
  - persona memory block
  - research_plan memory block
  - nemo_predictor memory block
  - engineering_principles memory block
  - lib/nemo-patterns.js cache
  - lib/nemo-memory.js profiler
  - config/memory-tiers.json config
  - council-keys.json template
      `);
      process.exit(0);
    }
  }

  const initializer = new MemoryInitializer(options);
  await initializer.initialize();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MemoryInitializer, MEMORY_BLOCKS };
