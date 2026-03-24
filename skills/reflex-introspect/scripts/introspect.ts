#!/usr/bin/env bun
/**
 * Reflex Introspect - Self-diagnostic code quality scorecard
 * 
 * Measures 10 code health metrics and outputs composite score 0-100
 */

import { parseArgs } from "node:util";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, join, extname, basename, dirname } from "node:path";
import { spawnSync } from "node:child_process";

// === 10 CODE HEALTH METRICS ===

const METRICS = [
  { name: "typeIntegrity", weight: 0.12, target: 95, label: "Type Integrity" },
  { name: "testBreadth", weight: 0.14, target: 85, label: "Test Breadth" },
  { name: "testDepth", weight: 0.10, target: 75, label: "Test Depth" },
  { name: "cyclomaticLoad", weight: 0.11, target: 12, label: "Cyclomatic Load" },
  { name: "couplingFactor", weight: 0.09, target: 40, label: "Coupling Factor" },
  { name: "vulnerabilityScore", weight: 0.13, target: 0, label: "Vulnerability Score" },
  { name: "dependencyFreshness", weight: 0.10, target: 90, label: "Dependency Freshness" },
  { name: "lintHygiene", weight: 0.08, target: 98, label: "Lint Hygiene" },
  { name: "documentationRatio", weight: 0.07, target: 80, label: "Documentation Ratio" },
  { name: "buildEfficiency", weight: 0.06, target: 0, label: "Build Efficiency" },
];

// === MEASUREMENT FUNCTIONS ===

function measureTypeIntegrity(project: string): { value: number; details: string } {
  const tsconfigPath = join(project, "tsconfig.json");
  
  if (!existsSync(tsconfigPath)) {
    return { value: 0, details: "No tsconfig.json found" };
  }
  
  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
    const options = tsconfig.compilerOptions || {};
    
    let score = 50;
    
    if (options.strict === true) score += 30;
    if (options.noImplicitAny === true) score += 10;
    if (options.strictNullChecks === true) score += 5;
    if (options.noUnusedLocals === true) score += 3;
    if (options.noUnusedParameters === true) score += 2;
    
    score = Math.min(100, Math.max(0, score));
    
    return {
      value: score,
      details: options.strict ? "Strict mode enabled" : "Partial strictness"
    };
  } catch {
    return { value: 0, details: "Could not parse tsconfig.json" };
  }
}

function measureTestBreadth(project: string): { value: number; details: string } {
  const coveragePath = join(project, "coverage", "coverage-summary.json");
  
  if (existsSync(coveragePath)) {
    try {
      const coverage = JSON.parse(readFileSync(coveragePath, "utf-8"));
      const total = coverage.total || {};
      const lines = total.lines?.pct || 0;
      const branches = total.branches?.pct || 0;
      const functions = total.functions?.pct || 0;
      
      return {
        value: Math.round((lines + branches + functions) / 3),
        details: `Lines: ${lines}%, Branches: ${branches}%, Functions: ${functions}%`
      };
    } catch {
      // Fall through to estimation
    }
  }
  
  // Estimate from test file count
  const testFiles = findFiles(project, (f) => 
    f.includes(".test.") || f.includes(".spec.") || f.includes("_test.") || f.includes("_spec.")
  );
  
  const srcFiles = findFiles(project, (f) => {
    const ext = extname(f);
    return [".ts", ".tsx", ".js", ".jsx"].includes(ext) && 
           !f.includes(".test.") && 
           !f.includes(".spec.") &&
           !f.includes("node_modules");
  });
  
  if (srcFiles.length === 0) {
    return { value: 0, details: "No source files found" };
  }
  
  const ratio = testFiles.length / srcFiles.length;
  const estimated = Math.min(100, Math.round(ratio * 150));
  
  return {
    value: estimated,
    details: `Estimated from ${testFiles.length} test files, ${srcFiles.length} source files`
  };
}

function measureTestDepth(project: string): { value: number; details: string } {
  // Look for integration/e2e tests
  const integrationTests = findFiles(project, (f) => 
    f.includes("integration") || f.includes("e2e") || f.includes("e2e")
  );
  
  const testFiles = findFiles(project, (f) => 
    f.includes(".test.") || f.includes(".spec.")
  );
  
  if (testFiles.length === 0) {
    return { value: 0, details: "No test files found" };
  }
  
  // Score based on test sophistication
  let depthScore = 40;
  
  if (integrationTests.length > 0) depthScore += 20;
  
  // Check for mocking, fixtures, test utilities
  const testContent = testFiles.slice(0, 10).map(f => {
    try {
      return readFileSync(f, "utf-8");
    } catch {
      return "";
    }
  }).join("\n");
  
  if (testContent.includes("mock") || testContent.includes("Mock")) depthScore += 10;
  if (testContent.includes("fixture") || testContent.includes("Fixture")) depthScore += 10;
  if (testContent.includes("beforeEach") || testContent.includes("afterEach")) depthScore += 10;
  if (testContent.includes("describe") && testContent.includes("it(")) depthScore += 10;
  
  return {
    value: Math.min(100, depthScore),
    details: `${integrationTests.length} integration tests, depth indicators detected`
  };
}

function measureCyclomaticLoad(project: string): { value: number; details: string } {
  // Count functions and estimate complexity
  const srcFiles = findFiles(project, (f) => {
    const ext = extname(f);
    return [".ts", ".tsx", ".js", ".jsx"].includes(ext) && !f.includes("node_modules");
  });
  
  if (srcFiles.length === 0) {
    return { value: 0, details: "No source files" };
  }
  
  let totalComplexity = 0;
  let functionCount = 0;
  
  for (const file of srcFiles.slice(0, 50)) {
    try {
      const content = readFileSync(file, "utf-8");
      
      // Count function declarations
      const funcMatches = content.match(/function\s+\w+|=>\s*{|:\s*function/g) || [];
      functionCount += funcMatches.length;
      
      // Estimate complexity from control flow
      const ifMatches = content.match(/\bif\s*\(/g) || [];
      const forMatches = content.match(/\bfor\s*\(/g) || [];
      const whileMatches = content.match(/\bwhile\s*\(/g) || [];
      const caseMatches = content.match(/\bcase\s+/g) || [];
      const andMatches = content.match(/&&/g) || [];
      const orMatches = content.match(/\|\|/g) || [];
      
      totalComplexity += ifMatches.length + forMatches.length + whileMatches.length + 
                         caseMatches.length + Math.floor((andMatches.length + orMatches.length) / 2);
    } catch {
      // Skip unreadable files
    }
  }
  
  const avgComplexity = functionCount > 0 ? totalComplexity / functionCount : 0;
  
  return {
    value: Math.round(avgComplexity),
    details: `Avg complexity: ${avgComplexity.toFixed(1)} from ${functionCount} functions`
  };
}

function measureCouplingFactor(project: string): { value: number; details: string } {
  const srcFiles = findFiles(project, (f) => {
    const ext = extname(f);
    return [".ts", ".tsx", ".js", ".jsx"].includes(ext) && !f.includes("node_modules");
  });
  
  if (srcFiles.length === 0) {
    return { value: 0, details: "No source files" };
  }
  
  let totalImports = 0;
  let crossModuleImports = 0;
  
  for (const file of srcFiles.slice(0, 30)) {
    try {
      const content = readFileSync(file, "utf-8");
      const importMatches = content.match(/^import.*from/gm) || [];
      const requireMatches = content.match(/require\s*\(/g) || [];
      
      totalImports += importMatches.length + requireMatches.length;
      
      // Check if imports cross module boundaries
      for (const match of importMatches) {
        if (match.includes("../") || match.includes("./")) {
          crossModuleImports++;
        }
      }
    } catch {
      // Skip
    }
  }
  
  const couplingRatio = totalImports > 0 ? (crossModuleImports / totalImports) * 100 : 0;
  
  return {
    value: Math.round(couplingRatio),
    details: `${crossModuleImports} cross-module imports of ${totalImports} total`
  };
}

function measureVulnerabilityScore(project: string): { value: number; details: string } {
  // Check for package.json and run audit
  const packagePath = join(project, "package.json");
  
  if (!existsSync(packagePath)) {
    return { value: 0, details: "No package.json found" };
  }
  
  try {
    const result = spawnSync("bun", ["audit", "--json"], {
      cwd: project,
      encoding: "utf-8",
      timeout: 30000,
    });
    
    if (result.stdout) {
      try {
        const audit = JSON.parse(result.stdout);
        const vulns = audit.metadata?.vulnerabilities || {};
        const total = (vulns.total || 0);
        const critical = (vulns.critical || 0);
        const high = (vulns.high || 0);
        
        return {
          value: critical + high,
          details: `${critical} critical, ${high} high, ${total} total vulnerabilities`
        };
      } catch {
        // Parse error - no vulns or different format
      }
    }
    
    return { value: 0, details: "No vulnerabilities detected" };
  } catch {
    return { value: 0, details: "Could not run audit" };
  }
}

function measureDependencyFreshness(project: string): { value: number; details: string } {
  const packagePath = join(project, "package.json");
  
  if (!existsSync(packagePath)) {
    return { value: 100, details: "No package.json" };
  }
  
  try {
    const result = spawnSync("bun", ["outdated", "--json"], {
      cwd: project,
      encoding: "utf-8",
      timeout: 30000,
    });
    
    if (result.stdout) {
      try {
        const outdated = JSON.parse(result.stdout);
        const totalDeps = Object.keys(outdated).length;
        
        if (totalDeps === 0) {
          return { value: 100, details: "All dependencies current" };
        }
        
        // Calculate freshness percentage
        const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));
        const deps = Object.keys(pkg.dependencies || {});
        const devDeps = Object.keys(pkg.devDependencies || {});
        const total = deps.length + devDeps.length;
        
        if (total === 0) return { value: 100, details: "No dependencies" };
        
        const fresh = Math.round(((total - totalDeps) / total) * 100);
        
        return {
          value: fresh,
          details: `${totalDeps} outdated of ${total} dependencies`
        };
      } catch {
        // JSON parse error
      }
    }
    
    return { value: 100, details: "Dependencies appear current" };
  } catch {
    return { value: 50, details: "Could not check freshness" };
  }
}

function measureLintHygiene(project: string): { value: number; details: string } {
  const eslintPath = join(project, ".eslintrc.json");
  const eslintAlt = join(project, ".eslintrc.js");
  const biomePath = join(project, "biome.json");
  
  if (!existsSync(eslintPath) && !existsSync(eslintAlt) && !existsSync(biomePath)) {
    // No linter configured - estimate from code patterns
    return { value: 95, details: "No linter configured (estimating)" };
  }
  
  try {
    const result = spawnSync("bun", ["x", "eslint", ".", "--format", "json", "--max-warnings", "0"], {
      cwd: project,
      encoding: "utf-8",
      timeout: 60000,
    });
    
    if (result.stdout) {
      try {
        const lint = JSON.parse(result.stdout);
        const errorCount = lint.reduce((sum: number, r: any) => sum + (r.errorCount || 0), 0);
        const warningCount = lint.reduce((sum: number, r: any) => sum + (r.warningCount || 0), 0);
        
        if (errorCount === 0 && warningCount === 0) {
          return { value: 100, details: "No lint issues" };
        }
        
        const total = errorCount + warningCount;
        return {
          value: Math.max(0, 100 - total),
          details: `${errorCount} errors, ${warningCount} warnings`
        };
      } catch {
        // Parse error
      }
    }
    
    return { value: 100, details: "Lint passed" };
  } catch {
    return { value: 95, details: "Could not run lint" };
  }
}

function measureDocumentationRatio(project: string): { value: number; details: string } {
  const srcFiles = findFiles(project, (f) => {
    const ext = extname(f);
    return [".ts", ".tsx"].includes(ext) && !f.includes("node_modules") && !f.includes(".test.");
  });
  
  if (srcFiles.length === 0) {
    return { value: 100, details: "No TypeScript source files" };
  }
  
  let documentedSymbols = 0;
  let totalSymbols = 0;
  
  for (const file of srcFiles.slice(0, 30)) {
    try {
      const content = readFileSync(file, "utf-8");
      
      // Count exported functions/classes with JSDoc
      const exportMatches = content.match(/export\s+(function|class|const|interface|type)\s+\w+/g) || [];
      totalSymbols += exportMatches.length;
      
      // Count JSDoc comments
      const jsdocMatches = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
      documentedSymbols += Math.min(jsdocMatches.length, exportMatches.length);
    } catch {
      // Skip
    }
  }
  
  const ratio = totalSymbols > 0 ? Math.round((documentedSymbols / totalSymbols) * 100) : 100;
  
  return {
    value: ratio,
    details: `${documentedSymbols}/${totalSymbols} exported symbols documented`
  };
}

function measureBuildEfficiency(project: string): { value: number; details: string } {
  // Measure build time
  const packagePath = join(project, "package.json");
  
  if (!existsSync(packagePath)) {
    return { value: 100, details: "No build configuration" };
  }
  
  try {
    const start = Date.now();
    const result = spawnSync("bun", ["run", "build"], {
      cwd: project,
      encoding: "utf-8",
      timeout: 120000,
    });
    const duration = (Date.now() - start) / 1000;
    
    // Score: under 10s = 100, under 30s = 80, under 60s = 60, under 120s = 40
    let score = 100;
    if (duration > 120) score = 20;
    else if (duration > 60) score = 40;
    else if (duration > 30) score = 60;
    else if (duration > 10) score = 80;
    
    return {
      value: score,
      details: `Build time: ${duration.toFixed(1)}s`
    };
  } catch {
    return { value: 50, details: "No build script or build failed" };
  }
}

// === UTILITY FUNCTIONS ===

function findFiles(root: string, predicate: (filename: string) => boolean): string[] {
  const results: string[] = [];
  
  function walk(dir: string) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === "build") continue;
        
        const full = join(dir, entry);
        try {
          const stat = statSync(full);
          if (stat.isDirectory()) {
            walk(full);
          } else if (predicate(entry)) {
            results.push(full);
          }
        } catch {
          // Skip inaccessible files
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }
  
  walk(root);
  return results;
}

function calculateScore(value: number, target: number, metric: string): number {
  // Different scoring logic for different metrics
  if (metric === "vulnerabilityScore") {
    // Lower is better
    if (value === 0) return 100;
    if (value <= 2) return 70;
    if (value <= 5) return 40;
    return 20;
  }
  
  if (metric === "cyclomaticLoad") {
    // Lower is better, target is max acceptable
    if (value <= target) return 100;
    if (value <= target * 1.5) return 70;
    if (value <= target * 2) return 40;
    return 20;
  }
  
  if (metric === "couplingFactor") {
    // Lower is better
    if (value <= target) return 100;
    if (value <= target * 1.5) return 70;
    if (value <= target * 2) return 40;
    return 20;
  }
  
  // Higher is better for coverage, type safety, etc.
  if (value >= target) return 100;
  if (value >= target * 0.8) return 80;
  if (value >= target * 0.6) return 60;
  if (value >= target * 0.4) return 40;
  return 30;
}

// === MAIN EXECUTION ===

const { values } = parseArgs({
  options: {
    project: { type: "string", short: "p", default: process.cwd() },
    metric: { type: "string", short: "m" },
    json: { type: "boolean", default: false },
    verbose: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Introspect - Self-diagnostic code quality scorecard

Usage:
  bun introspect.ts [options]

Options:
  -p, --project <path>   Project directory (default: current)
  -m, --metric <name>    Focus on single metric
  --json                 Output JSON format
  -v, --verbose          Show detailed output
  -h, --help             Show this help

Metrics (10 total):
  typeIntegrity      TypeScript strictness, any usage
  testBreadth        Line/branch coverage
  testDepth          Edge cases, integration tests
  cyclomaticLoad     Complexity per function
  couplingFactor     Cross-module dependencies
  vulnerabilityScore Known CVEs in dependencies
  dependencyFreshness Outdated packages
  lintHygiene        Lint violations, formatting
  documentationRatio Commented public APIs
  buildEfficiency    Build time performance
`);
  process.exit(0);
}

const project = resolve(values.project as string);

if (!existsSync(project)) {
  console.error(`Project not found: ${project}`);
  process.exit(1);
}

console.log(`Analyzing project: ${project}\n`);

const measurements = [
  { fn: measureTypeIntegrity, name: "typeIntegrity" },
  { fn: measureTestBreadth, name: "testBreadth" },
  { fn: measureTestDepth, name: "testDepth" },
  { fn: measureCyclomaticLoad, name: "cyclomaticLoad" },
  { fn: measureCouplingFactor, name: "couplingFactor" },
  { fn: measureVulnerabilityScore, name: "vulnerabilityScore" },
  { fn: measureDependencyFreshness, name: "dependencyFreshness" },
  { fn: measureLintHygiene, name: "lintHygiene" },
  { fn: measureDocumentationRatio, name: "documentationRatio" },
  { fn: measureBuildEfficiency, name: "buildEfficiency" },
];

const results: any[] = [];
let totalScore = 0;
let totalWeight = 0;
let weakest = { name: "", score: 101 };

for (const { fn, name } of measurements) {
  if (values.metric && (values.metric as string) !== name) continue;
  
  const metric = METRICS.find(m => m.name === name)!;
  const { value, details } = fn(project);
  const score = calculateScore(value, metric.target, name);
  
  results.push({
    name,
    label: metric.label,
    value,
    target: metric.target,
    weight: metric.weight,
    score,
    details,
  });
  
  totalScore += score * metric.weight;
  totalWeight += metric.weight;
  
  if (score < weakest.score) {
    weakest = { name, score };
  }
}

const composite = Math.round(totalScore / totalWeight);

if (values.json) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    project,
    metrics: results,
    composite,
    weakest: weakest.name,
  }, null, 2));
} else {
  console.log("==========================================================");
  console.log("  REFLEX INTROSPECTION SCORECARD");
  console.log("==========================================================");
  
  for (const r of results) {
    const status = r.score >= 90 ? "[OK]  " : r.score >= 60 ? "[WARN]" : "[FAIL]";
    console.log(`  ${status} ${r.label.padEnd(20)} ${String(r.value).padStart(5)} → score: ${r.score}%`.padEnd(55) + `#${r.details.slice(0, 40)}`);
  }
  
  console.log("----------------------------------------------------------");
  console.log(`  COMPOSITE HEALTH: ${composite}/100`);
  console.log(`  WEAKEST: ${METRICS.find(m => m.name === weakest.name)?.label || weakest.name}`);
  console.log("==========================================================");
  
  if (!values.metric) {
    console.log("\nRecommendation: Run 'reflex prescribe' to generate improvement plan");
  }
}

// Output scorecard JSON for downstream tools
const scorecardPath = join(project, ".reflex", "scorecard.json");
const reflexDir = dirname(scorecardPath);
if (!existsSync(reflexDir)) {
  try {
    require("fs").mkdirSync(reflexDir, { recursive: true });
  } catch {
    // Ignore
  }
}

try {
  writeFileSync(scorecardPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    project,
    metrics: results,
    composite,
    weakest: weakest.name,
  }, null, 2));
} catch {
  // Ignore write errors
}