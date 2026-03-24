#!/usr/bin/env bun
/**
 * Reflex Prescribe - Self-prescription engine
 * 
 * Maps weakest metric to playbook from 17 options, generates fix specification
 */

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";

// === 17 PLAYBOOKS ===

const PLAYBOOKS: Record<string, any> = {
  // Type Integrity (3)
  A: {
    id: "A",
    name: "Strict Mode Enablement",
    metric: "typeIntegrity",
    severity: "AUTO",
    autoApprove: true,
    description: "Enable TypeScript strict mode and related compiler options",
    steps: [
      "Update tsconfig.json with strict: true",
      "Enable noImplicitAny, strictNullChecks",
      "Run type check and fix errors",
      "Verify no type errors remain"
    ],
    target: "tsconfig.json",
    constraints: ["Preserve existing paths", "Keep skipLibCheck if present"]
  },
  B: {
    id: "B",
    name: "Any Type Elimination",
    metric: "typeIntegrity",
    severity: "CRITICAL",
    autoApprove: false,
    description: "Replace 'any' types with proper TypeScript types",
    steps: [
      "Scan codebase for explicit 'any' usage",
      "Infer or define proper types",
      "Replace with typed alternatives",
      "Add type guards where needed"
    ],
    target: "src/**/*.ts",
    constraints: ["Max 10 files per cycle", "Preserve runtime behavior"]
  },
  C: {
    id: "C",
    name: "Generic Constraint Addition",
    metric: "typeIntegrity",
    severity: "AUTO",
    autoApprove: true,
    description: "Add generic constraints to improve type safety",
    steps: [
      "Identify functions with implicit 'any' generics",
      "Add extends constraints",
      "Update call sites if needed"
    ],
    target: "src/**/*.ts",
    constraints: ["Preserve backward compatibility"]
  },
  // Test Breadth (3)
  D: {
    id: "D",
    name: "Coverage Gap Filling",
    metric: "testBreadth",
    severity: "AUTO",
    autoApprove: true,
    description: "Add tests for uncovered lines and branches",
    steps: [
      "Analyze coverage report for gaps",
      "Generate test cases for uncovered paths",
      "Run coverage verification"
    ],
    target: "tests/**/*.test.ts",
    constraints: ["Focus on critical modules first", "Max 20 new tests per cycle"]
  },
  E: {
    id: "E",
    name: "Missing Branch Tests",
    metric: "testBreadth",
    severity: "AUTO",
    autoApprove: true,
    description: "Add tests for uncovered conditional branches",
    steps: [
      "Identify branches with partial coverage",
      "Add test cases for each branch",
      "Verify all branches covered"
    ],
    target: "tests/**/*.test.ts",
    constraints: ["Maintain test readability"]
  },
  F: {
    id: "F",
    name: "Critical Path Coverage",
    metric: "testBreadth",
    severity: "CRITICAL",
    autoApprove: false,
    description: "Ensure all critical business logic paths are tested",
    steps: [
      "Identify critical business logic functions",
      "Map all execution paths",
      "Add comprehensive test coverage",
      "Verify with mutation testing"
    ],
    target: "src/core/**/*.ts",
    constraints: ["Requires domain knowledge", "Max 5 critical functions per cycle"]
  },
  // Test Depth (2)
  G: {
    id: "G",
    name: "Edge Case Injection",
    metric: "testDepth",
    severity: "AUTO",
    autoApprove: true,
    description: "Add edge case tests for boundary conditions",
    steps: [
      "Identify functions with numeric/string inputs",
      "Add tests for boundary values",
      "Add tests for null/undefined/empty cases"
    ],
    target: "tests/**/*.test.ts",
    constraints: ["Focus on validation-heavy code"]
  },
  H: {
    id: "H",
    name: "Error Path Verification",
    metric: "testDepth",
    severity: "CRITICAL",
    autoApprove: false,
    description: "Add tests for error handling paths",
    steps: [
      "Identify all error throwing/returning functions",
      "Add tests that trigger each error path",
      "Verify error messages and types"
    ],
    target: "tests/**/*.test.ts",
    constraints: ["Document expected error types"]
  },
  // Cyclomatic Load (2)
  I: {
    id: "I",
    name: "Function Decomposition",
    metric: "cyclomaticLoad",
    severity: "AUTO",
    autoApprove: true,
    description: "Break down complex functions into smaller units",
    steps: [
      "Identify functions with complexity > 12",
      "Extract logical blocks into helper functions",
      "Update tests to cover new functions"
    ],
    target: "src/**/*.ts",
    constraints: ["Preserve public API", "Max 3 functions per cycle"]
  },
  J: {
    id: "J",
    name: "Guard Clause Extraction",
    metric: "cyclomaticLoad",
    severity: "AUTO",
    autoApprove: true,
    description: "Simplify control flow with early returns",
    steps: [
      "Identify nested if-else chains",
      "Convert to guard clauses",
      "Verify behavior unchanged"
    ],
    target: "src/**/*.ts",
    constraints: ["Improve readability"]
  },
  // Coupling Factor (2)
  K: {
    id: "K",
    name: "Interface Extraction",
    metric: "couplingFactor",
    severity: "CRITICAL",
    autoApprove: false,
    description: "Define interfaces to decouple modules",
    steps: [
      "Identify tight coupling between modules",
      "Define interface contracts",
      "Implement on both sides",
      "Update imports to use interfaces"
    ],
    target: "src/**/*.ts",
    constraints: ["Start with most coupled pair", "Max 2 interfaces per cycle"]
  },
  L: {
    id: "L",
    name: "Module Boundary Enforcement",
    metric: "couplingFactor",
    severity: "CRITICAL",
    autoApprove: false,
    description: "Enforce clean module boundaries with barrel exports",
    steps: [
      "Identify direct cross-module imports",
      "Create barrel exports (index.ts)",
      "Update imports to use barrel",
      "Add import lint rules"
    ],
    target: "src/**/index.ts",
    constraints: ["Preserve tree-shaking"]
  },
  // Vulnerability Score (2)
  M: {
    id: "M",
    name: "CVE Patch Application",
    metric: "vulnerabilityScore",
    severity: "AUTO",
    autoApprove: true,
    description: "Update packages with known vulnerabilities",
    steps: [
      "Run bun audit to identify vulnerable packages",
      "Update to patched versions",
      "Verify no breaking changes",
      "Run test suite"
    ],
    target: "package.json",
    constraints: ["Prefer patch versions", "Run full test suite after"]
  },
  N: {
    id: "N",
    name: "Vulnerable Dependency Swap",
    metric: "vulnerabilityScore",
    severity: "CRITICAL",
    autoApprove: false,
    description: "Replace vulnerable packages with alternatives",
    steps: [
      "Identify packages with unpatched vulnerabilities",
      "Research maintained alternatives",
      "Implement replacement",
      "Migrate existing code"
    ],
    target: "package.json, src/**/*.ts",
    constraints: ["Requires API compatibility research", "Max 1 swap per cycle"]
  },
  // Dependency Freshness (1)
  O: {
    id: "O",
    name: "Batch Update Execution",
    metric: "dependencyFreshness",
    severity: "AUTO",
    autoApprove: true,
    description: "Update outdated dependencies",
    steps: [
      "List outdated packages",
      "Update in batches by category",
      "Run tests after each batch",
      "Generate lockfile"
    ],
    target: "package.json",
    constraints: ["Group by update type (patch/minor)", "Skip major version bumps"]
  },
  // Lint Hygiene (1)
  P: {
    id: "P",
    name: "Auto-Fix Application",
    metric: "lintHygiene",
    severity: "AUTO",
    autoApprove: true,
    description: "Apply automatic lint fixes",
    steps: [
      "Run linter with --fix flag",
      "Review applied changes",
      "Address remaining manual fixes"
    ],
    target: "src/**/*.ts",
    constraints: ["Review changes before commit"]
  },
  // Documentation Ratio (1)
  Q: {
    id: "Q",
    name: "API Doc Generation",
    metric: "documentationRatio",
    severity: "AUTO",
    autoApprove: true,
    description: "Add JSDoc comments to public APIs",
    steps: [
      "Identify exported functions without docs",
      "Generate JSDoc from signatures",
      "Add usage examples",
      "Link related functions"
    ],
    target: "src/**/*.ts",
    constraints: ["Focus on public API first", "Max 20 functions per cycle"]
  },
};

const METRIC_TO_PLAYBOOKS: Record<string, string[]> = {
  typeIntegrity: ["A", "B", "C"],
  testBreadth: ["D", "E", "F"],
  testDepth: ["G", "H"],
  cyclomaticLoad: ["I", "J"],
  couplingFactor: ["K", "L"],
  vulnerabilityScore: ["M", "N"],
  dependencyFreshness: ["O"],
  lintHygiene: ["P"],
  documentationRatio: ["Q"],
};

// === HELPER FUNCTIONS ===

function getPlaybook(metric: string, severity: string): any {
  const candidates = METRIC_TO_PLAYBOOKS[metric] || [];
  
  for (const id of candidates) {
    const playbook = PLAYBOOKS[id];
    if (playbook.severity === severity) {
      return playbook;
    }
  }
  
  // Fallback to first playbook for metric
  if (candidates.length > 0) {
    return PLAYBOOKS[candidates[0]];
  }
  
  return null;
}

function determineSeverity(score: number): string {
  if (score < 30) return "CRITICAL";
  if (score < 50) return "WARNING";
  return "AUTO";
}

// === MAIN EXECUTION ===

const { values } = parseArgs({
  options: {
    scorecard: { type: "string", short: "s" },
    metric: { type: "string", short: "m" },
    severity: { type: "string" },
    output: { type: "string", short: "o" },
    list: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Prescribe - Self-prescription engine

Usage:
  bun prescribe.ts [options]

Options:
  -s, --scorecard <path>  Path to introspect scorecard JSON
  -m, --metric <name>     Target specific metric
  --severity <level>      Force AUTO, WARNING, or CRITICAL
  -o, --output <path>     Output directory for prescription
  --list                  List all available playbooks
  --json                  Output JSON format
  -h, --help              Show this help
`);
  process.exit(0);
}

if (values.list) {
  console.log("\nAvailable Playbooks (17 total):\n");
  console.log("ID | Name                         | Metric            | Severity  | Auto-Approve");
  console.log("---|------------------------------|-------------------|-----------|--------------");
  
  for (const [id, p] of Object.entries(PLAYBOOKS)) {
    const playbook = p as any;
    console.log(`${id.toString().padEnd(3)}| ${(playbook.name as string).slice(0, 28).padEnd(29)}| ${(playbook.metric as string).padEnd(18)}| ${(playbook.severity as string).padEnd(10)}| ${playbook.autoApprove ? "Yes" : "No"}`);
  }
  
  console.log("\nNo in Auto-Approve = Requires human approval (governor blocks execution)");
  process.exit(0);
}

// Determine target metric
let targetMetric = values.metric as string | undefined;
let targetSeverity = values.severity as string | undefined;
let scorecardData: any = null;

if (values.scorecard) {
  const scorecardPath = resolve(values.scorecard as string);
  
  if (!existsSync(scorecardPath)) {
    console.error(`Scorecard not found: ${scorecardPath}`);
    process.exit(1);
  }
  
  try {
    scorecardData = JSON.parse(readFileSync(scorecardPath, "utf-8"));
    
    if (!targetMetric) {
      targetMetric = scorecardData.weakest;
    }
    
    // Get metric score to determine severity
    const metricData = scorecardData.metrics?.find((m: any) => m.name === targetMetric);
    if (metricData && !targetSeverity) {
      targetSeverity = determineSeverity(metricData.score);
    }
  } catch (e) {
    console.error("Failed to parse scorecard:", e);
    process.exit(1);
  }
}

if (!targetMetric) {
  console.error("No metric specified. Use --metric or provide --scorecard");
  process.exit(1);
}

if (!targetSeverity) {
  targetSeverity = "AUTO";
}

// Get playbook
const playbook = getPlaybook(targetMetric, targetSeverity);

if (!playbook) {
  console.error(`No playbook found for metric: ${targetMetric}`);
  process.exit(1);
}

// Generate prescription
const timestamp = Date.now();
const prescriptionId = `rx-${timestamp}-${targetMetric}`;

const prescription = {
  id: prescriptionId,
  timestamp: new Date().toISOString(),
  metric: targetMetric,
  severity: targetSeverity,
  playbook: {
    id: playbook.id,
    name: playbook.name,
    steps: playbook.steps,
    target: playbook.target,
    constraints: playbook.constraints,
  },
  autoApprove: playbook.autoApprove,
  previousScore: scorecardData?.metrics?.find((m: any) => m.name === targetMetric)?.score || null,
  targetScore: 85, // Target for this metric
  status: "PENDING",
  governor: {
    blastRadiusLimit: 5,
    regressionThreshold: 0.02,
    requiresApproval: !playbook.autoApprove,
  },
};

// Output
if (values.json) {
  console.log(JSON.stringify(prescription, null, 2));
} else {
  console.log("==========================================================");
  console.log("  REFLEX PRESCRIPTION");
  console.log("==========================================================");
  console.log(`  ID:           ${prescriptionId}`);
  console.log(`  Metric:       ${targetMetric}`);
  console.log(`  Severity:     ${targetSeverity}`);
  console.log(`  Playbook:     ${playbook.id} - ${playbook.name}`);
  console.log(`  Auto-Approve: ${playbook.autoApprove ? "Yes" : "No"}`);
  console.log("----------------------------------------------------------");
  console.log("  Steps:");
  playbook.steps.forEach((step: string, i: number) => {
    console.log(`    ${i + 1}. ${step}`);
  });
  console.log("----------------------------------------------------------");
  console.log(`  Target Files: ${playbook.target}`);
  console.log(`  Constraints:  ${playbook.constraints.join(", ")}`);
  console.log("==========================================================");
  
  if (!playbook.autoApprove) {
    console.log("\nGovernor: This prescription requires human approval before execution.");
  }
  
  console.log("\nRun 'reflex evolve' to execute this prescription.");
}

// Save prescription
const outputDir = values.output 
  ? resolve(values.output as string) 
  : join(process.env.REFLEX_SEEDS_DIR || process.env.HOME || "/tmp", "Seeds", "reflex");

try {
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${prescriptionId}.json`);
  writeFileSync(outputPath, JSON.stringify(prescription, null, 2));
  console.log(`\nPrescription saved to: ${outputPath}`);
} catch (e) {
  console.error("Failed to save prescription:", e);
}