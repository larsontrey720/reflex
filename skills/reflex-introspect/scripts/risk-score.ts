#!/usr/bin/env bun
/**
 * Reflex Risk Score - Calculate risk level for changes
 * 
 * Features from CodeRabbit:
 * - Risk flagging for PRs
 * - Change impact analysis
 * - Deployment risk assessment
 */

import { parseArgs } from "node:util";

interface RiskFactor {
  name: string;
  weight: number;
  score: number;
  reason: string;
}

function calculateRiskScore(options: {
  linesChanged?: number;
  filesChanged?: number;
  hasDatabase?: boolean;
  hasAuth?: boolean;
  hasPayment?: boolean;
  hasTests?: boolean;
  testCoverage?: number;
  breakingChanges?: boolean;
  newDependencies?: number;
}): { score: number; level: string; factors: RiskFactor[] } {
  const factors: RiskFactor[] = [];
  
  // File count risk
  if (options.filesChanged !== undefined) {
    const fileRisk = Math.min(100, options.filesChanged * 5);
    factors.push({
      name: "Files Changed",
      weight: 0.15,
      score: fileRisk,
      reason: options.filesChanged > 10 ? "Many files affected" : "Contained file scope",
    });
  }
  
  // Line count risk
  if (options.linesChanged !== undefined) {
    const lineRisk = Math.min(100, options.linesChanged / 50);
    factors.push({
      name: "Lines Changed",
      weight: 0.1,
      score: lineRisk,
      reason: options.linesChanged > 500 ? "Large change volume" : "Manageable change size",
    });
  }
  
  // Critical areas
  if (options.hasDatabase) {
    factors.push({
      name: "Database Changes",
      weight: 0.2,
      score: 80,
      reason: "Schema changes are high-impact",
    });
  }
  
  if (options.hasAuth) {
    factors.push({
      name: "Auth Changes",
      weight: 0.25,
      score: 90,
      reason: "Authentication is security-critical",
    });
  }
  
  if (options.hasPayment) {
    factors.push({
      name: "Payment Changes",
      weight: 0.25,
      score: 95,
      reason: "Payment flows are business-critical",
    });
  }
  
  // Test coverage
  if (options.hasTests === false) {
    factors.push({
      name: "Missing Tests",
      weight: 0.15,
      score: 70,
      reason: "No tests for changes",
    });
  } else if (options.testCoverage !== undefined) {
    const coverageRisk = 100 - options.testCoverage;
    factors.push({
      name: "Test Coverage",
      weight: 0.1,
      score: coverageRisk,
      reason: options.testCoverage < 80 ? "Low test coverage" : "Good test coverage",
    });
  }
  
  // Breaking changes
  if (options.breakingChanges) {
    factors.push({
      name: "Breaking Changes",
      weight: 0.3,
      score: 100,
      reason: "API breaking changes detected",
    });
  }
  
  // New dependencies
  if (options.newDependencies !== undefined && options.newDependencies > 0) {
    factors.push({
      name: "New Dependencies",
      weight: 0.1,
      score: Math.min(60, options.newDependencies * 15),
      reason: `${options.newDependencies} new dependencies added`,
    });
  }
  
  // Calculate weighted score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);
  const score = Math.round(weightedScore / totalWeight);
  
  // Determine level
  const level = score >= 80 ? "🔴 HIGH" : score >= 50 ? "🟡 MEDIUM" : score >= 25 ? "🟢 LOW" : "✅ MINIMAL";
  
  return { score, level, factors };
}

function generateReport(risk: { score: number; level: string; factors: RiskFactor[] }, prNumber?: number): string {
  const lines: string[] = [];
  
  lines.push("═".repeat(60));
  lines.push(`  ⚠️  RISK ASSESSMENT${prNumber ? ` FOR PR #${prNumber}` : ""}`);
  lines.push("═".repeat(60));
  
  lines.push(`\n  Risk Level: ${risk.level}`);
  lines.push(`  Risk Score: ${risk.score}/100`);
  
  lines.push("\n  Risk Factors:");
  lines.push("  ┌────────────────────┬───────┬─────────────────────────┐");
  lines.push("  │ Factor             │ Score │ Reason                  │");
  lines.push("  ├────────────────────┼───────┼─────────────────────────┤");
  
  for (const factor of risk.factors) {
    const name = factor.name.padEnd(18);
    const score = `${factor.score}`.padEnd(5);
    const reason = factor.reason.substring(0, 23).padEnd(23);
    lines.push(`  │ ${name} │ ${score} │ ${reason} │`);
  }
  
  lines.push("  └────────────────────┴───────┴─────────────────────────┘");
  
  lines.push("\n  Recommendations:");
  
  if (risk.score >= 80) {
    lines.push("  🔴 HIGH RISK - Consider:");
    lines.push("     • Break into smaller PRs");
    lines.push("     • Add comprehensive tests");
    lines.push("     • Request senior review");
    lines.push("     • Deploy during low-traffic period");
  } else if (risk.score >= 50) {
    lines.push("  🟡 MEDIUM RISK - Consider:");
    lines.push("     • Add more tests");
    lines.push("     • Document changes");
    lines.push("     • Staged rollout");
  } else if (risk.score >= 25) {
    lines.push("  🟢 LOW RISK - Standard review process");
  } else {
    lines.push("  ✅ MINIMAL RISK - Safe to merge");
  }
  
  lines.push("\n" + "═".repeat(60));
  
  return lines.join("\n");
}

// Main
const { values } = parseArgs({
  options: {
    pr: { type: "string" },
    files: { type: "string" },
    lines: { type: "string" },
    database: { type: "boolean", default: false },
    auth: { type: "boolean", default: false },
    payment: { type: "boolean", default: false },
    tests: { type: "string" },
    coverage: { type: "string" },
    breaking: { type: "boolean", default: false },
    deps: { type: "string" },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Risk Score - Calculate change risk

Usage:
  reflex risk [options]

Options:
  --pr <number>         PR number
  --files <number>      Number of files changed
  --lines <number>      Number of lines changed
  --database            Involves database changes
  --auth                Involves auth changes
  --payment             Involves payment changes
  --tests <yes/no>      Has tests
  --coverage <percent>  Test coverage percentage
  --breaking            Has breaking changes
  --deps <number>       New dependencies added
  --json                JSON output
  -h, --help            Show this help

Examples:
  reflex risk --files 15 --lines 300 --database
  reflex risk --pr 42
`);
  process.exit(0);
}

const risk = calculateRiskScore({
  filesChanged: values.files ? parseInt(values.files as string) : undefined,
  linesChanged: values.lines ? parseInt(values.lines as string) : undefined,
  hasDatabase: values.database,
  hasAuth: values.auth,
  hasPayment: values.payment,
  hasTests: values.tests === "yes",
  testCoverage: values.coverage ? parseInt(values.coverage as string) : undefined,
  breakingChanges: values.breaking,
  newDependencies: values.deps ? parseInt(values.deps as string) : undefined,
});

if (values.json) {
  console.log(JSON.stringify(risk, null, 2));
} else {
  const prNumber = values.pr ? parseInt(values.pr as string) : undefined;
  console.log(generateReport(risk, prNumber));
}

// Exit with warning for high risk
if (risk.score >= 80) {
  process.exit(2);
} else if (risk.score >= 50) {
  process.exit(1);
}