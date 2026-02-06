# Analysis Workflows

Deep codebase analysis procedures for NEMO Conductor.

## Quick Reference

| Workflow | Command | Duration | Output |
|----------|---------|----------|--------|
| Standard | `nemo analyze` | 2-5 min | Markdown report |
| Deep | `nemo analyze --deep` | 5-15 min | Detailed report |
| Uncensored | `nemo analyze --uncensored` | 10-30 min | Full analysis |
| Security | `nemo analyze --security-only` | 1-3 min | Security report |
| Loops | `nemo loop-check` | 30s-2 min | JSON report |

## Standard Analysis Workflow

### 1. Pre-Analysis Setup
```bash
# Check council status
node .skills/nemo-conductor/scripts/run-nemo.js --tier=efficient

# Verify keys are loaded
# Expected: 5/5 keys active
```

### 2. Run Analysis
```bash
# Basic analysis
node .skills/nemo-conductor/scripts/analyze-codebase.js \
  --target=./src \
  --output=./analysis-report.md
```

### 3. Review Output
Report sections:
- Executive Summary
- Architecture Overview
- Bug Analysis
- Security Scan
- Documentation Status

## Deep Analysis Workflow

### Phase 1: Architecture Understanding (MONK)
```bash
node .skills/nemo-conductor/scripts/analyze-codebase.js \
  --target=./src \
  --depth=deep \
  --output=./deep-analysis.md
```

What it does:
- Maps all imports/exports
- Identifies design patterns (singleton, factory, observer)
- Detects circular dependencies
- Analyzes module coupling

### Phase 2: Bug Detection (GHOST + ARCHITECT)
Patterns detected:
- Console.log in production
- TODO/FIXME comments
- Empty catch blocks
- Loose equality checks
- eval() usage
- Callback hell

### Phase 3: Security Scan (MONK + OBSERVER)
Vulnerabilities checked:
- XSS (innerHTML, document.write)
- Code injection (eval, new Function)
- Hardcoded credentials
- Insecure HTTP
- Prototype pollution

### Phase 4: Performance Analysis (ARCHITECT)
Checks:
- Synchronous file I/O in async contexts
- Memory leaks (event listeners)
- Unnecessary re-renders
- N+1 query patterns
- Blocking loops

### Phase 5: Documentation Review (OBSERVER)
Metrics:
- JSDoc coverage
- README completeness
- Inline comment quality
- API documentation

## Uncensored Analysis

**Warning:** Uncensored mode may identify sensitive patterns, security issues, and controversial code practices that standard analysis skips.

### Activation
```bash
node .skills/nemo-conductor/scripts/analyze-codebase.js \
  --target=./src \
  --uncensored \
  --output=./uncensored-report.md
```

### Additional Checks
- Hardcoded secrets (aggressive detection)
- Commented-out code blocks
- Dead code paths
- Questionable design decisions
- License violations
- GDPR/privacy concerns

## Loop Detection Workflow

### Basic Detection
```bash
node .skills/nemo-conductor/scripts/detect-loops.js \
  --target=./src
```

### With JSON Output
```bash
node .skills/nemo-conductor/scripts/detect-loops.js \
  --target=./src \
  --output=./loop-report.json
```

### Detection Patterns

#### Critical (Blocks execution)
- `while(true)` without break
- `for(;;)` without break
- Recursion without base case
- Unresolved Promises

#### High (Likely problems)
- Recursion with weak base case
- Blocking sync loops with async ops
- Promise.all with empty array

#### Medium (Potential issues)
- Synchronous loops with I/O
- Deep nesting (>5 levels)
- setTimeout with strings

#### Low (Best practice)
- Event listeners not removed
- Unused loop variables

## Council-Assisted Analysis

For maximum depth, use the full council:

```bash
# 1. Initialize with all keys
node .skills/nemo-conductor/scripts/init-memory.js

# 2. Start conductor in council mode
node .skills/nemo-conductor/scripts/run-nemo.js \
  --tier=performance \
  --mode=CLOUD_FIRST

# 3. Run analysis (council will coordinate)
nemo council analyze ./src --uncensored
```

Council coordination:
1. **GHOST** predicts what you're looking for
2. **ARCHITECT** plans the analysis approach
3. **MONK** performs deep reasoning on findings
4. **SHADOW** formats output with Chi aesthetic
5. **OBSERVER** validates and monitors progress

## CI/CD Integration

### GitHub Actions
```yaml
- name: NEMO Analysis
  run: |
    node .skills/nemo-conductor/scripts/analyze-codebase.js
    node .skills/nemo-conductor/scripts/detect-loops.js
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for infinite loops
node .skills/nemo-conductor/scripts/detect-loops.js --target=./src
if [ $? -ne 0 ]; then
  echo "Infinite loops detected!"
  exit 1
fi
```

## Report Interpretation

### Severity Levels

?? **Critical** - Fix immediately
- Security vulnerabilities
- Infinite loops
- Data loss risks

?? **High** - Fix before release
- Memory leaks
- Performance bottlenecks
- Unhandled errors

?? **Medium** - Fix in next sprint
- Code smells
- Missing tests
- Documentation gaps

?? **Low** - Nice to have
- Style inconsistencies
- Minor optimizations

### Action Items

Report includes:
1. File path and line number
2. Issue description
3. Severity level
4. Suggested fix
5. Code snippet

## Troubleshooting

### Analysis too slow
- Use `--tier=efficient`
- Exclude tests with default settings
- Target specific directories

### Out of memory
- Reduce worker count
- Clear pattern cache
- Use streaming analysis

### False positives
- Adjust pattern sensitivity
- Use `--depth=standard`
- Add ignore comments

### Missing findings
- Use `--depth=uncensored`
- Check file extensions
- Verify target path
