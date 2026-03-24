#!/usr/bin/env bun
/**
 * Reflex Pre-commit - Quality gate before commit
 * 
 * Features from CodeRabbit CLI:
 * - Quick checks before commit
 * - Block commits that fail quality threshold
 * - Auto-fix what's safe to fix
 */

import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

function getChangedLines(): number {
  try {
    const output = execSync('git diff --cached --stat', { encoding: 'utf-8' });
    const match = output.match(/(\d+) insertion/);
    return match ? parseInt(match[1]) : 0;
  } catch {
    return 0;
  }
}

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  autoFixable: boolean;
}

async function runChecks(files: string[]): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  // Check 1: TypeScript/JavaScript files
  const tsFiles = files.filter(f => /\.(ts|tsx|js|jsx)$/.test(f));
  
  if (tsFiles.length > 0) {
    // TypeScript check
    try {
      execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
      results.push({ name: "TypeScript", passed: true, message: "No type errors", autoFixable: false });
    } catch (error: any) {
      const output = error.stdout || error.stderr || "";
      results.push({ 
        name: "TypeScript", 
        passed: false, 
        message: output.includes("error") ? "Type errors found" : "TypeScript check failed",
        autoFixable: false,
      });
    }
    
    // ESLint check
    try {
      execSync('npx eslint --max-warnings 0 ' + tsFiles.join(' '), { encoding: 'utf-8', stdio: 'pipe' });
      results.push({ name: "ESLint", passed: true, message: "No lint issues", autoFixable: false });
    } catch (error: any) {
      results.push({ 
        name: "ESLint", 
        passed: false, 
        message: "Lint errors found",
        autoFixable: true,
      });
    }
  }
  
  // Check 2: Test files
  const testFiles = files.filter(f => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f));
  if (testFiles.length > 0) {
    try {
      execSync('npx vitest run --passWithNoTests', { encoding: 'utf-8', stdio: 'pipe' });
      results.push({ name: "Tests", passed: true, message: "Tests passed", autoFixable: false });
    } catch {
      results.push({ name: "Tests", passed: false, message: "Tests failed", autoFixable: false });
    }
  }
  
  // Check 3: No console.log
  if (tsFiles.length > 0) {
    let hasConsole = false;
    for (const file of tsFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf-8');
        if (content.includes('console.log')) {
          hasConsole = true;
          break;
        }
      }
    }
    results.push({ 
      name: "No console.log", 
      passed: !hasConsole, 
      message: hasConsole ? "Remove console.log statements" : "No console.log found",
      autoFixable: false,
    });
  }
  
  // Check 4: No TODO/FIXME
  if (tsFiles.length > 0) {
    let hasTodos = false;
    for (const file of tsFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf-8');
        if (/\/\/\s*TODO|\/\/\s*FIXME/.test(content)) {
          hasTodos = true;
          break;
        }
      }
    }
    results.push({ 
      name: "No TODOs", 
      passed: !hasTodos, 
      message: hasTodos ? "Resolve TODO/FIXME comments" : "No TODOs found",
      autoFixable: false,
    });
  }
  
  // Check 5: Package.json changes
  if (files.includes('package.json')) {
    results.push({ 
      name: "Package.json", 
      passed: true, 
      message: "Review dependency changes manually",
      autoFixable: false,
    });
  }
  
  // Default pass if no checks ran
  if (results.length === 0) {
    results.push({ name: "No checks", passed: true, message: "No applicable checks", autoFixable: false });
  }
  
  return results;
}

function generateReport(results: CheckResult[], files: string[]): string {
  const lines: string[] = [];
  
  lines.push("═".repeat(60));
  lines.push("  🔍 REFLEX PRE-COMMIT CHECK");
  lines.push("═".repeat(60));
  
  lines.push(`\n  Staged files: ${files.length}`);
  lines.push(`  Changed lines: ${getChangedLines()}`);
  
  lines.push("\n  Checks:");
  
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);
  
  for (const result of passed) {
    lines.push(`  ✅ ${result.name}: ${result.message}`);
  }
  
  for (const result of failed) {
    const fixFlag = result.autoFixable ? " (auto-fixable)" : "";
    lines.push(`  ❌ ${result.name}: ${result.message}${fixFlag}`);
  }
  
  lines.push("\n" + "─".repeat(60));
  
  if (failed.length === 0) {
    lines.push("  ✅ All checks passed! Safe to commit.");
  } else {
    lines.push(`  ❌ ${failed.length} check(s) failed.`);
    
    const autoFixable = failed.filter(r => r.autoFixable);
    if (autoFixable.length > 0) {
      lines.push("\n  Auto-fix with: reflex pre-commit --fix");
    }
  }
  
  lines.push("═".repeat(60));
  
  return lines.join("\n");
}

function installHook(): void {
  const hookPath = join(process.cwd(), '.git', 'hooks', 'pre-commit');
  const hookContent = `#!/bin/sh
# Reflex pre-commit hook
bun reflex pre-commit
if [ $? -ne 0 ]; then
  echo "Reflex pre-commit checks failed. Fix issues before committing."
  exit 1
fi
`;
  
  writeFileSync(hookPath, hookContent, { mode: 0o755 });
  console.log(`\n✅ Pre-commit hook installed at: ${hookPath}\n`);
}

// Main
const { values } = parseArgs({
  options: {
    install: { type: "boolean", default: false },
    fix: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Pre-commit - Quality gate before commit

Usage:
  reflex pre-commit [options]

Options:
  --install    Install as git pre-commit hook
  --fix        Auto-fix what's safe to fix
  --force      Bypass failed checks (use with caution)
  -h, --help   Show this help

Examples:
  reflex pre-commit              # Run checks
  reflex pre-commit --install    # Install git hook
  reflex pre-commit --fix        # Fix and re-check
`);
  process.exit(0);
}

if (values.install) {
  installHook();
  process.exit(0);
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  console.log("\n  No staged files to check.\n");
  process.exit(0);
}

const results = await runChecks(stagedFiles);

// Auto-fix if requested
if (values.fix) {
  const toFix = results.filter(r => !r.passed && r.autoFixable);
  
  for (const fix of toFix) {
    if (fix.name === "ESLint") {
      console.log(`\n  Auto-fixing ESLint issues...`);
      try {
        execSync('npx eslint --fix ' + stagedFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f)).join(' '), { stdio: 'inherit' });
        console.log("  ✅ Fixed ESLint issues\n");
      } catch {
        console.log("  ⚠️  Some issues couldn't be auto-fixed\n");
      }
    }
  }
  
  // Re-run checks after fix
  const newResults = await runChecks(stagedFiles);
  console.log(generateReport(newResults, stagedFiles));
  
  if (newResults.every(r => r.passed) || values.force) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

console.log(generateReport(results, stagedFiles));

if (results.every(r => r.passed) || values.force) {
  process.exit(0);
} else {
  process.exit(1);
}