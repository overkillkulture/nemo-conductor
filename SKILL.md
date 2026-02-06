---
name: nemo-conductor
description: Manages the NEMO v3.1 conductor orchestration system, handles council AI API keys, performs deep codebase analysis (architecture, bugs, security, documentation), detects infinite loops, and manages memory initialization. Use when working with NEMO conductor, orchestrating AI agents, or performing comprehensive codebase analysis on cross-platform systems.
---

# NEMO Conductor Orchestrator

Manages the NEMO conductor system with 5-Key Council, deep codebase analysis, and cross-platform support.

## Quick Start

### Initialize Memory
```bash
/init nemo-conductor
```

### Run NEMO Conductor
```bash
node .skills/nemo-conductor/scripts/run-nemo.js --tier=efficient
```

### Deep Codebase Analysis
```bash
node .skills/nemo-conductor/scripts/analyze-codebase.js --deep --target=./src
```

## NEMO v3.1 Council Architecture

### 5-Key Council
| Key | Name | Function | API Key Env |
|-----|------|----------|-------------|
| 1 | THE GHOST | Autocomplete predictor | GHOST_API_KEY |
| 2 | THE ARCHITECT | Toolbox/Git automation | ARCHITECT_API_KEY |
| 3 | THE MONK | Deep reasoning, loop protection | MONK_API_KEY |
| 4 | THE SHADOW | UI styling (Chi aesthetic) | SHADOW_API_KEY |
| 5 | THE OBSERVER | Browser sync, monitoring | OBSERVER_API_KEY |

### Modes
- **HYBRID_SYNC**: Cloud + Local CLI bridging
- **TIER_EFFICIENT**: 4-8GB RAM
- **TIER_PERFORMANCE**: 8-16GB RAM  
- **TIER_ASCENSION**: 32GB+ RAM

## Workflows

### Deep Codebase Analysis
1. Architecture analysis (see [references/analysis-workflows.md](references/analysis-workflows.md))
2. Bug/security scan
3. Documentation generation
4. Uncensored pattern detection

### Loop Detection
Use `scripts/detect-loops.js` to find:
- Infinite recursion without base cases
- While(true) patterns
- Blocking event loop patterns
- Async/await deadlock potentials

### Memory Initialization
Creates memory blocks:
- `persona`: NEMO identity
- `research_plan`: Active tasks
- `nemo_predictor`: CLI acceleration patterns
- `lib/nemo-patterns.js`: Pattern cache engine
- `config/memory-tiers.json`: Tier config

## Cross-Platform

### Termux/Android
```bash
pkg install nodejs
node scripts/run-nemo.js --tier=efficient
```

### Raspberry Pi
```bash
node scripts/run-nemo.js --tier=efficient --arch=arm64
```

### Python Shell
```python
import subprocess
subprocess.run(['node', 'scripts/run-nemo.js'])
```

## Configuration

Create `council-keys.json`:
```json
{
  "GHOST_API_KEY": "...",
  "ARCHITECT_API_KEY": "...",
  "MONK_API_KEY": "...",
  "SHADOW_API_KEY": "...",
  "OBSERVER_API_KEY": "..."
}
```

## References
- [NEMO Architecture](references/nemo-architecture.md)
- [Council API Setup](references/council-api-setup.md)
- [Analysis Workflows](references/analysis-workflows.md)
