#!/usr/bin/env node
/**
 * NEMO Infinite Loop Detector
 * Detects infinite loops, recursion without base cases, and blocking patterns
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class LoopDetector {
  constructor(options = {}) {
    this.target = options.target || './src';
    this.output = options.output;
    this.findings = [];
  }

  async detect() {
    console.log('?? NEMO Loop Detector');
    console.log(`Target: ${this.target}`);
    console.log('-'.repeat(50));

    const files = await this.getSourceFiles();
    console.log(`Scanning ${files.length} files...\n`);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relPath = path.relative(process.cwd(), file);

      // Run all detection patterns
      this.detectInfiniteWhile(content, relPath);
      this.detectInfiniteFor(content, relPath);
      this.detectRecursionWithoutBaseCase(content, relPath);
      this.detectBlockingPatterns(content, relPath);
      this.detectPromiseDeadlocks(content, relPath);
      this.detectEventEmitterLeaks(content, relPath);
    }

    this.report();
    
    if (this.output) {
      this.saveReport();
    }

    return this.findings;
  }

  detectInfiniteWhile(content, file) {
    // Pattern: while(true), while(1), while(!false), etc.
    const patterns = [
      { regex: /while\s*\(\s*true\s*\)/g, type: 'infinite-while', desc: 'while(true) infinite loop' },
      { regex: /while\s*\(\s*1\s*\)/g, type: 'infinite-while', desc: 'while(1) infinite loop' },
      { regex: /while\s*\(\s*!!true\s*\)/g, type: 'infinite-while', desc: 'Obfuscated infinite while' }
    ];

    for (const { regex, type, desc } of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNum = this.getLineNumber(content, match.index);
        const line = content.split('\n')[lineNum - 1].trim();
        
        // Check if there's a break condition inside (basic check)
        const blockEnd = this.findBlockEnd(content, match.index);
        const blockContent = content.substring(match.index, blockEnd);
        const hasBreak = /break\s*;/.test(blockContent);
        const hasReturn = /return\s+/.test(blockContent);
        
        if (!hasBreak && !hasReturn) {
          this.findings.push({
            file,
            line: lineNum,
            type,
            severity: 'critical',
            description: desc,
            code: line,
            suggestion: 'Add break condition or use setInterval/setTimeout for async loops'
          });
        }
      }
    }
  }

  detectInfiniteFor(content, file) {
    // Pattern: for(;;), for(;true;), etc.
    const patterns = [
      { regex: /for\s*\(\s*;\s*;\s*\)/g, type: 'infinite-for', desc: 'for(;;) infinite loop' },
      { regex: /for\s*\(\s*;\s*true\s*;\s*\)/g, type: 'infinite-for', desc: 'for(;true;) infinite loop' }
    ];

    for (const { regex, type, desc } of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNum = this.getLineNumber(content, match.index);
        const line = content.split('\n')[lineNum - 1].trim();
        
        const blockEnd = this.findBlockEnd(content, match.index);
        const blockContent = content.substring(match.index, blockEnd);
        const hasBreak = /break\s*;/.test(blockContent);
        const hasReturn = /return\s+/.test(blockContent);
        
        if (!hasBreak && !hasReturn) {
          this.findings.push({
            file,
            line: lineNum,
            type,
            severity: 'critical',
            description: desc,
            code: line,
            suggestion: 'Add loop termination condition or break statement'
          });
        }
      }
    }
  }

  detectRecursionWithoutBaseCase(content, file) {
    // Find function declarations
    const funcRegex = /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
    let match;
    
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1];
      const funcStart = match.index;
      const funcEnd = this.findBlockEnd(content, funcStart);
      const funcBody = content.substring(funcStart, funcEnd);
      
      // Check if function calls itself
      const selfCallRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      const hasSelfCall = selfCallRegex.test(funcBody);
      
      if (hasSelfCall) {
        // Check for base case (return without recursive call, or if/else with termination)
        const hasBaseCase = /return\s+(?!\s*\w+\s*\()/.test(funcBody) ||
                           /if\s*\([^)]+\)\s*\{[^}]*return[^}]*\}/.test(funcBody);
        
        if (!hasBaseCase) {
          const lineNum = this.getLineNumber(content, funcStart);
          this.findings.push({
            file,
            line: lineNum,
            type: 'unbounded-recursion',
            severity: 'high',
            description: `Function '${funcName}' may have unbounded recursion`,
            code: `function ${funcName}(...)`,
            suggestion: 'Add a base case to prevent stack overflow'
          });
        }
      }
    }
  }

  detectBlockingPatterns(content, file) {
    // Patterns that block the event loop
    const patterns = [
      { 
        regex: /while\s*\([^)]+\)\s*\{[^}]*\}/g, 
        type: 'blocking-loop',
        desc: 'Potentially blocking synchronous loop',
        checkAsync: true
      },
      {
        regex: /for\s*\([^)]+\)\s*\{[^}]*\}/g,
        type: 'blocking-loop',
        desc: 'Potentially blocking synchronous for loop',
        checkAsync: true
      }
    ];

    for (const { regex, type, desc, checkAsync } of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNum = this.getLineNumber(content, match.index);
        const block = match[0];
        
        // Check if loop contains async operations without await
        if (checkAsync && /(fetch|readFile|query|request)\s*\(/.test(block) && !/await\s+/.test(block)) {
          this.findings.push({
            file,
            line: lineNum,
            type,
            severity: 'medium',
            description: desc + ' with async operations',
            code: block.split('\n')[0].trim(),
            suggestion: 'Use await or convert to async iterator'
          });
        }
      }
    }
  }

  detectPromiseDeadlocks(content, file) {
    // Detect potential Promise deadlock patterns
    const patterns = [
      {
        regex: /Promise\.all\s*\(\s*\[\s*\]\s*\)/g,
        type: 'empty-promise-all',
        desc: 'Promise.all with empty array (may indicate logic error)'
      },
      {
        regex: /await\s+new\s+Promise\s*\(\s*\(\s*\)\s*=>/g,
        type: 'unresolved-promise',
        desc: 'Promise never resolves (no resolve/reject callback)'
      }
    ];

    for (const { regex, type, desc } of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNum = this.getLineNumber(content, match.index);
        this.findings.push({
          file,
          line: lineNum,
          type,
          severity: 'high',
          description: desc,
          code: content.split('\n')[lineNum - 1].trim()
        });
      }
    }
  }

  detectEventEmitterLeaks(content, file) {
    // Detect potential memory leaks from event listeners
    const addListenerRegex = /\.on\s*\(\s*['"]([^'"]+)['"]\s*,/g;
    const removeListenerRegex = /\.off\s*\(\s*['"]([^'"]+)['"]\s*,|\.removeListener\s*\(\s*['"]([^'"]+)['"]\s*,/g;
    
    const added = new Set();
    const removed = new Set();
    
    let match;
    while ((match = addListenerRegex.exec(content)) !== null) {
      added.add(match[1]);
    }
    
    while ((match = removeListenerRegex.exec(content)) !== null) {
      removed.add(match[1] || match[2]);
    }
    
    // Check for listeners that are added but never removed
    for (const event of added) {
      if (!removed.has(event)) {
        const lineMatch = content.match(new RegExp(`\\.on\\s*\\(\\s*['\"]${event}['\"]`));
        if (lineMatch) {
          const lineNum = this.getLineNumber(content, lineMatch.index);
          this.findings.push({
            file,
            line: lineNum,
            type: 'event-leak',
            severity: 'low',
            description: `Event listener '${event}' added but never removed`,
            suggestion: 'Call .off() or .removeListener() when done'
          });
        }
      }
    }
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  findBlockEnd(content, startIndex) {
    let depth = 0;
    let inString = false;
    let stringChar = null;
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      const prevChar = content[i - 1];
      
      // Handle strings
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = null;
      }
      
      // Handle braces (only when not in string)
      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') {
          depth--;
          if (depth === 0) return i + 1;
        }
      }
    }
    
    return content.length;
  }

  async getSourceFiles() {
    const extensions = ['js', 'ts', 'jsx', 'tsx'];
    const files = [];
    
    for (const ext of extensions) {
      const matches = glob.sync(`${this.target}/**/*.${ext}`);
      files.push(...matches);
    }
    
    return files.filter(f => !f.includes('node_modules'));
  }

  report() {
    console.log('\n?? Loop Detection Report');
    console.log('-'.repeat(50));
    
    if (this.findings.length === 0) {
      console.log('? No infinite loop patterns detected!');
      return;
    }

    // Group by severity
    const critical = this.findings.filter(f => f.severity === 'critical');
    const high = this.findings.filter(f => f.severity === 'high');
    const medium = this.findings.filter(f => f.severity === 'medium');
    const low = this.findings.filter(f => f.severity === 'low');

    console.log(`\n?? Critical: ${critical.length}`);
    critical.forEach(f => this.printFinding(f));

    console.log(`\n?? High: ${high.length}`);
    high.forEach(f => this.printFinding(f));

    console.log(`\n?? Medium: ${medium.length}`);
    medium.forEach(f => this.printFinding(f));

    console.log(`\n?? Low: ${low.length}`);
    low.forEach(f => this.printFinding(f));

    console.log(`\n??  Total issues: ${this.findings.length}`);
  }

  printFinding(f) {
    console.log(`\n  ${f.file}:${f.line}`);
    console.log(`  Type: ${f.type}`);
    console.log(`  ${f.description}`);
    if (f.code) console.log(`  Code: ${f.code.substring(0, 60)}...`);
    if (f.suggestion) console.log(`  ?? ${f.suggestion}`);
  }

  saveReport() {
    const report = {
      generated: new Date().toISOString(),
      target: this.target,
      findings: this.findings,
      summary: {
        total: this.findings.length,
        critical: this.findings.filter(f => f.severity === 'critical').length,
        high: this.findings.filter(f => f.severity === 'high').length,
        medium: this.findings.filter(f => f.severity === 'medium').length,
        low: this.findings.filter(f => f.severity === 'low').length
      }
    };

    fs.writeFileSync(this.output, JSON.stringify(report, null, 2));
    console.log(`\n? Report saved to ${this.output}`);
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--target=')) {
      options.target = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
NEMO Loop Detector

Usage: node detect-loops.js [options]

Options:
  --target=./src              Target directory (default: ./src)
  --output=./loops.json       Save report to JSON file
  --help, -h                  Show this help

Detects:
  - while(true) and for(;;) infinite loops
  - Recursion without base cases
  - Blocking synchronous loops
  - Promise deadlocks
  - Event listener memory leaks
      `);
      process.exit(0);
    }
  }

  const detector = new LoopDetector(options);
  await detector.detect();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LoopDetector };
