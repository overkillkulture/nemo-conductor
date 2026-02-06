# NEMO Architecture

NEMO (Neural Engine for Modular Operations) is a conductor-based orchestration system for AI agents.

## Core Concepts

### Conductor Pattern
NEMO acts as a conductor, coordinating multiple AI "musicians" (the 5-Key Council) to perform complex tasks harmoniously.

### 5-Key Council
Each key serves a specific function:

```
+-------------------------------------------------------------+
¦                     NEMO CONDUCTOR                          ¦
¦                     (Orchestrator)                          ¦
+-------------------------------------------------------------+
                       ¦
       +---------------+---------------+
       ¦               ¦               ¦
   +---?---+      +---?---+      +---?---+
   ¦ GHOST ¦      ¦ARCHITECT    ¦ MONK  ¦
   ¦(Predict)    ¦(Design) ¦      ¦(Reason)¦
   +-------+      +-------+      +-------+
       ¦               ¦               ¦
       +---------------+---------------+
                       ¦
              +-----------------+
              ¦                 ¦
          +---?---+        +---?-----+
          ¦SHADOW ¦        ¦OBSERVER ¦
          ¦(Style)¦        ¦(Monitor)¦
          +-------+        +---------+
```

## Operation Modes

### HYBRID_SYNC (Default)
- Cloud AI for reasoning
- Local execution for CLI operations
- Best for: Most use cases

### LOCAL_ONLY
- No cloud AI calls
- Uses cached patterns only
- Best for: Offline/air-gapped environments

### CLOUD_FIRST
- Maximum AI assistance
- All operations go through council
- Best for: Complex analysis tasks

## Memory Tiers

### TIER_EFFICIENT (4-8GB RAM)
- 2 workers
- Minimal caching
- Single model fallback
- Best for: Raspberry Pi, Termux, low-end systems

### TIER_PERFORMANCE (8-16GB RAM)
- 4 workers
- Balanced caching
- Parallel council queries
- Best for: Development workstations

### TIER_ASCENSION (32GB+ RAM)
- 8 workers
- Unlimited caching
- Full council with browser sync
- Best for: High-end servers, AI research

## Data Flow

```
User Request
    ¦
    ?
NEMO Conductor
    ¦
    +--? GHOST (predict intent)
    ¦
    +--? ARCHITECT (plan approach)
    ¦
    +--? MONK (deep analysis)
    ¦
    +--? SHADOW (style/enhance)
    ¦
    +--? OBSERVER (validate/monitor)
    ¦
    ?
Aggregated Response
    ¦
    ?
Local Execution
```

## File Structure

```
.skills/nemo-conductor/
+-- SKILL.md                    # Main skill documentation
+-- scripts/
¦   +-- run-nemo.js            # Main conductor entry
¦   +-- analyze-codebase.js    # Deep analysis engine
¦   +-- detect-loops.js        # Loop detection
¦   +-- init-memory.js         # /init command
+-- references/
    +-- nemo-architecture.md   # This file
    +-- council-api-setup.md   # API configuration
    +-- analysis-workflows.md  # Analysis procedures

~/.nemo/  (created by init)
+-- memory/
¦   +-- persona.json
¦   +-- research_plan.json
¦   +-- nemo_predictor.json
¦   +-- ...
+-- lib/
¦   +-- nemo-patterns.js
¦   +-- nemo-memory.js
+-- config/
    +-- memory-tiers.json
```

## Extension Points

### Adding a New Council Member
1. Add key to `COUNCIL_KEYS` in run-nemo.js
2. Add name to `COUNCIL_NAMES`
3. Create handler module
4. Register in council initialization

### Adding a New Analysis Type
1. Add method to `DeepAnalyzer` class
2. Register in `analyze()` pipeline
3. Update report generation
4. Document in analysis-workflows.md

### Adding a New Loop Pattern
1. Add detection method to `LoopDetector`
2. Register in `detect()` pipeline
3. Set appropriate severity
4. Add suggestion for fix

## Integration Patterns

### Letta Code Agent
```javascript
// Load skill
const skill = require('.skills/nemo-conductor');

// Initialize
await skill.initMemory();

// Run analysis
const results = await skill.analyze('./src');
```

### Python Shell
```python
import subprocess

# Run conductor
subprocess.run(['node', '.skills/nemo-conductor/scripts/run-nemo.js'])

# Analyze code
subprocess.run([
  'node', 
  '.skills/nemo-conductor/scripts/analyze-codebase.js',
  '--target=./src',
  '--deep'
])
```

### Termux/Android
```bash
# Install dependencies
pkg install nodejs

# Run conductor
node .skills/nemo-conductor/scripts/run-nemo.js --tier=efficient
```
