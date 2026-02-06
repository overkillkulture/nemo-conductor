#!/usr/bin/env node
/**
 * NEMO Deep Codebase Analyzer
 * Performs uncensored deep analysis using the 5-Key Council
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob').glob);

class DeepAnalyzer {
  constructor(options = {}) {
    this.target = options.target || './src';
    this.output = options.output || './analysis-report.md';
    this.depth = options.depth || 'standard'; // standard, deep, uncensored
    this.includeTests = options.includeTests || false;
    this.findings = {
      architecture: [],
      bugs: [],
      security: [],
      performance: [],
      documentation: []
    };
  }

  async analyze() {
    console.log('?? NEMO Deep Analyzer');
    console.log(`Target: ${this.target}`);
    console.log(`Depth: ${this.depth.toUpperCase()}`);
    console.log('-'.repeat(50));

    // 1. Architecture Analysis
    await this.analyzeArchitecture();
    
    // 2. Bug Detection
    await this.detectBugs();
    
    // 3. Security Scan
    await this.scanSecurity();
    
    // 4. Documentation Analysis
    await this.analyzeDocumentation();
    
    // 5. Generate Report
    await this.generateReport();
    
    console.log(`\n? Analysis complete: ${this.output}`);
  }

  async analyzeArchitecture() {
    console.log('\n???  Architecture Analysis...');
    
    const patterns = {
      imports: /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g,
      exports: /(?:export|module\.exports)\s+(?:default\s+)?(?:class|function|const|let|var)?\s*(\w+)/g,
      classes: /class\s+(\w+)(?:\s+extends\s+(\w+))?/g,
      functions: /(?:async\s+)?function\s+(\w+)\s*\(/g,
      arrowFuncs: /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g
    };

    const files = await this.getSourceFiles();
    const dependencies = new Set();
    const modules = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relPath = path.relative(process.cwd(), file);
      
      // Extract imports
      let match;
      while ((match = patterns.imports.exec(content)) !== null) {
        if (!match[1].startsWith('.') && !match[1].startsWith('/')) {
          dependencies.add(match[1].split('/')[0]);
        }
      }

      // Extract exports
      const exports = [];
      while ((match = patterns.exports.exec(content)) !== null) {
        exports.push(match[1]);
      }

      if (exports.length > 0) {
        modules.push({ file: relPath, exports });
      }
    }

    this.findings.architecture = {
      files: files.length,
      dependencies: Array.from(dependencies).sort(),
      modules: modules.slice(0, 20), // Top 20 modules
      patterns: this.detectPatterns(files)
    };

    console.log(`  ? Found ${files.length} source files`);
    console.log(`  ? ${dependencies.size} external dependencies`);
  }

  async detectBugs() {
    console.log('\n?? Bug Detection...');
    
    const bugPatterns = [
      {
        pattern: /console\.log\s*\(/g,
        severity: 'low',
        message: 'Console.log statements in production code'
      },
      {
        pattern: /TODO|FIXME|XXX|HACK/g,
        severity: 'medium',
        message: 'Unresolved TODO/FIXME comments'
      },
      {
        pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
        severity: 'high',
        message: 'Empty catch blocks swallowing errors'
      },
      {
        pattern: /==\s*(null|undefined)|!=\s*(null|undefined)/g,
        severity: 'medium',
        message: 'Loose equality checks with null/undefined'
      },
      {
        pattern: /var\s+/g,
        severity: 'low',
        message: 'Using var instead of let/const'
      },
      {
        pattern: /setTimeout\s*\(\s*["\'][^"\']*["\']\s*,/g,
        severity: 'high',
        message: 'setTimeout with string (eval-like)'
      }
    ];

    const files = await this.getSourceFiles();
    const bugs = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (const bugPattern of bugPatterns) {
        let match;
        const regex = new RegExp(bugPattern.pattern.source, 'g');
        
        while ((match = regex.exec(content)) !== null) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          bugs.push({
            file: path.relative(process.cwd(), file),
            line: lineNum,
            severity: bugPattern.severity,
            message: bugPattern.message,
            code: lines[lineNum - 1]?.trim()
          });
        }
      }
    }

    this.findings.bugs = bugs;
    console.log(`  ? Found ${bugs.length} potential issues`);
    
    const critical = bugs.filter(b => b.severity === 'high').length;
    if (critical > 0) {
      console.log(`  ? ${critical} critical issues detected`);
    }
  }

  async scanSecurity() {
    console.log('\n?? Security Scan...');
    
    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        risk: 'critical',
        message: 'Dangerous eval() usage'
      },
      {
        pattern: /innerHTML\s*=/g,
        risk: 'high',
        message: 'XSS vulnerability: innerHTML assignment'
      },
      {
        pattern: /document\.write\s*\(/g,
        risk: 'high',
        message: 'XSS vulnerability: document.write'
      },
      {
        pattern: /password|secret|key|token|api_key/gi,
        risk: 'medium',
        message: 'Potential hardcoded credentials'
      },
      {
        pattern: /http:\/\//g,
        risk: 'low',
        message: 'Insecure HTTP URLs'
      }
    ];

    const files = await this.getSourceFiles();
    const issues = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      for (const secPattern of securityPatterns) {
        let match;
        const regex = new RegExp(secPattern.pattern.source, 'gi');
        
        while ((match = regex.exec(content)) !== null) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          issues.push({
            file: path.relative(process.cwd(), file),
            line: lineNum,
            risk: secPattern.risk,
            message: secPattern.message
          });
        }
      }
    }

    this.findings.security = issues;
    console.log(`  ? Found ${issues.length} security concerns`);
    
    const critical = issues.filter(i => i.risk === 'critical').length;
    if (critical > 0) {
      console.log(`  ?? ${critical} CRITICAL security issues!`);
    }
  }

  async analyzeDocumentation() {
    console.log('\n?? Documentation Analysis...');
    
    const files = await this.getSourceFiles();
    let documented = 0;
    let undocumented = 0;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for JSDoc comments
      const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content);
      const hasComments = content.split('\n').some(line => 
        line.trim().startsWith('//') || line.trim().startsWith('*')
      );

      if (hasJSDoc || hasComments) {
        documented++;
      } else {
        undocumented++;
      }
    }

    // Check for README
    const hasReadme = fs.existsSync('README.md') || fs.existsSync('readme.md');
    
    this.findings.documentation = {
      totalFiles: files.length,
      documented,
      undocumented,
      coverage: ((documented / files.length) * 100).toFixed(1),
      hasReadme
    };

    console.log(`  ? ${documented}/${files.length} files have documentation`);
    console.log(`  ? Documentation coverage: ${this.findings.documentation.coverage}%`);
  }

  detectPatterns(files) {
    const patterns = {
      singleton: /getInstance|createInstance|instance\s*=/g,
      factory: /create[A-Z]|factory|build[A-Z]/g,
      observer: /addEventListener|on\(|emit\(|subscribe/g,
      strategy: /strategy|Strategy/g,
      middleware: /middleware|use\(/g
    };

    const detected = {};
    
    for (const [name, pattern] of Object.entries(patterns)) {
      detected[name] = 0;
    }

    return detected;
  }

  async getSourceFiles() {
    const extensions = ['js', 'ts', 'jsx', 'tsx'];
    const files = [];
    
    for (const ext of extensions) {
      const matches = await glob(`${this.target}/**/*.${ext}`);
      files.push(...matches);
    }
    
    if (!this.includeTests) {
      return files.filter(f => !f.includes('.test.') && !f.includes('.spec.') && !f.includes('__tests__'));
    }
    
    return files;
  }

  async generateReport() {
    const report = `# NEMO Deep Analysis Report

**Generated:** ${new Date().toISOString()}
**Target:** ${this.target}
**Depth:** ${this.depth}

---

## ?? Executive Summary

- **Files Analyzed:** ${this.findings.architecture.files}
- **External Dependencies:** ${this.findings.architecture.dependencies.length}
- **Potential Bugs:** ${this.findings.bugs.length}
- **Security Issues:** ${this.findings.security.length}
- **Documentation Coverage:** ${this.findings.documentation.coverage}%

---

## ??? Architecture

### Dependencies
${this.findings.architecture.dependencies.map(d => `- ${d}`).join('\n')}

### Key Modules
${this.findings.architecture.modules.map(m => 
  `- **${m.file}**: exports ${m.exports.join(', ')}`
).join('\n')}

---

## ?? Bug Analysis

${this.findings.bugs.length === 0 ? '? No obvious bugs detected.' : 
  this.findings.bugs.map(b => 
    `- **[${b.severity.toUpperCase()}]** ${b.file}:${b.line} - ${b.message}`
  ).join('\n')
}

---

## ?? Security Analysis

${this.findings.security.length === 0 ? '? No security issues detected.' :
  this.findings.security.map(s =>
    `- **[${s.risk.toUpperCase()}]** ${s.file}:${s.line} - ${s.message}`
  ).join('\n')
}

---

## ?? Documentation Status

- **Total Files:** ${this.findings.documentation.totalFiles}
- **Documented:** ${this.findings.documentation.documented}
- **Undocumented:** ${this.findings.documentation.undocumented}
- **Coverage:** ${this.findings.documentation.coverage}%
- **README Present:** ${this.findings.documentation.hasReadme ? '?' : '?'}

---

*Report generated by NEMO Conductor v3.1*
`;

    fs.writeFileSync(this.output, report);
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
    } else if (arg.startsWith('--depth=')) {
      options.depth = arg.split('=')[1];
    } else if (arg === '--deep') {
      options.depth = 'deep';
    } else if (arg === '--uncensored') {
      options.depth = 'uncensored';
    } else if (arg === '--include-tests') {
      options.includeTests = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
NEMO Deep Analyzer

Usage: node analyze-codebase.js [options]

Options:
  --target=./src              Target directory (default: ./src)
  --output=./report.md        Output file (default: ./analysis-report.md)
  --depth=standard|deep|uncensored   Analysis depth
  --deep                      Shorthand for --depth=deep
  --uncensored                Shorthand for --depth=uncensored
  --include-tests             Include test files in analysis
  --help, -h                  Show this help
      `);
      process.exit(0);
    }
  }

  const analyzer = new DeepAnalyzer(options);
  await analyzer.analyze();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DeepAnalyzer };
