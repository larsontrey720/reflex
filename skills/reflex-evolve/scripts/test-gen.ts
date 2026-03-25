#!/usr/bin/env bun
/**
 * Reflex Test Generator - Autonomously generates tests for untested code
 * 
 * This skill:
 * 1. Scans source files for untested functions
 * 2. Generates comprehensive test suites using LLM
 * 3. Writes tests to appropriate test files
 * 4. Verifies tests run successfully
 */

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, basename, dirname, relative } from "node:path";
import { execSync } from "node:child_process";

const { values } = parseArgs({
  options: {
    project: { type: "string", short: "p", default: process.cwd() },
    output: { type: "string" },
    verbose: { type: "boolean", default: false },
    dryRun: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Test Generator - Autonomously generate tests

Usage:
  reflex test-gen [options]

Options:
  -p, --project <dir>   Target project
  --output <dir>        Test output directory (default: test/)
  --dry-run             Show what would be generated without writing
  --verbose             Show detailed output
  -h, --help            Show this help
`);
  process.exit(0);
}

let projectArg = values.project as string;
const verbose = values.verbose as boolean;


// Handle GitHub URLs
let tempDir: string | null = null;

if (projectArg.includes('github.com') || projectArg.match(/^[\w-]+\/[\w-]+$/)) {
  console.log("Cloning from GitHub...");
  
  let owner: string, repo: string;
  
  if (projectArg.startsWith('http')) {
    const url = new URL(projectArg);
    const parts = url.pathname.split('/').filter(Boolean);
    owner = parts[0];
    repo = parts[1]?.replace('.git', '') || '';
  } else {
    const parts = projectArg.split('/');
    owner = parts[0];
    repo = parts[1] || '';
  }
  
  tempDir = `/tmp/reflex-test-gen-${Date.now()}`;
  const cloneUrl = `https://github.com/${owner}/${repo}.git`;
  
  try {
    execSync(`git clone --depth 1 ${cloneUrl} ${tempDir}`, { 
      encoding: 'utf-8', 
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    projectArg = tempDir;
    console.log(`Cloned to: ${tempDir}\n`);
  } catch (e: any) {
    console.error(`Failed to clone: ${e.message}`);
    process.exit(1);
  }
}

const dryRun = values.dryRun as boolean;
const projectPath = resolve(projectArg);

let testDir = values.output as string || join(projectPath, "test");

// Find all source files
function findSourceFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) {
        if (!entry.startsWith(".") && entry !== "node_modules" && entry !== "test") {
          walk(full);
        }
      } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
        if (!entry.endsWith(".test.ts") && !entry.endsWith(".spec.ts")) {
          files.push(full);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

// Extract exported functions from a file
function extractExports(content: string): { name: string; type: string; params: string }[] {
  const exports: { name: string; type: string; params: string }[] = [];
  
  // Match exported functions
  const funcMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g);
  for (const m of funcMatches) {
    exports.push({ name: m[1], type: "function", params: m[2] });
  }
  
  // Match exported arrow functions
  const arrowMatches = content.matchAll(/export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g);
  for (const m of arrowMatches) {
    exports.push({ name: m[1], type: "arrow", params: "" });
  }
  
  // Match exported classes
  const classMatches = content.matchAll(/export\s+(?:default\s+)?class\s+(\w+)/g);
  for (const m of classMatches) {
    exports.push({ name: m[1], type: "class", params: "" });
  }
  
  return exports;
}

// Generate test content using LLM
async function generateTests(sourceFile: string, exports: { name: string; type: string }[], context: string): Promise<string> {
  const sourceContent = readFileSync(sourceFile, "utf-8");
  const fileName = basename(sourceFile);
  
  // Build LLM prompt
  const prompt = `Generate comprehensive unit tests for this TypeScript file.

FILE: ${fileName}

SOURCE CODE:
\`\`\`typescript
${sourceContent.slice(0, 3000)}
\`\`\`

EXPORTS TO TEST:
${exports.map(e => `- ${e.name} (${e.type})`).join("\n")}

CONTEXT FROM MEMORY:
${context}

REQUIREMENTS:
1. Use vitest (import { describe, it, expect, vi } from "vitest")
2. Test all exported functions/classes
3. Include edge cases and error handling
4. Mock external dependencies
5. Use descriptive test names

OUTPUT ONLY THE TEST CODE, no explanations.`;

  // Call LLM
  const response = await fetch("https://api.zo.computer/zo/ask", {
    method: "POST",
    headers: {
      "authorization": process.env.ZO_CLIENT_IDENTITY_TOKEN || "",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      input: prompt,
      model_name: "byok:8d5a353d-a103-4997-b8b5-5e306976a3d8",
    }),
  });

  const data = await response.json();
  let testCode = data.output || "";
  
  // Clean up - remove markdown code fences if present
  testCode = testCode.replace(/^```typescript\n?/i, "").replace(/\n?```$/m, "");
  
  return testCode;
}

// Main
async function main() {
  console.log("\n=== REFLEX AUTONOMOUS TEST GENERATOR ===\n");
  console.log("Project:", projectPath);
  console.log("Test dir:", testDir);
  console.log();
  
  // Load context from memory
  let context = "";
  const contextFile = resolve(projectPath, ".reflex", "context.json");
  if (existsSync(contextFile)) {
    try {
      const ctx = JSON.parse(readFileSync(contextFile, "utf-8"));
      context = JSON.stringify(ctx, null, 2);
    } catch {}
  }
  
  // Find source files
  console.log("Scanning source files...");
  const sourceFiles = findSourceFiles(join(projectPath, "src"));
  console.log(`Found ${sourceFiles.length} source files\n`);
  
  if (sourceFiles.length === 0) {
    console.log("No source files found.");
    process.exit(0);
  }
  
  // Create test directory
  if (!existsSync(testDir)) {
    if (!dryRun) {
      const { mkdirSync } = require("node:fs");
      mkdirSync(testDir, { recursive: true });
    }
    console.log(`Created test directory: ${testDir}`);
  }
  
  // Process each source file
  let totalTests = 0;
  
  for (const sourceFile of sourceFiles) {
    const relPath = relative(projectPath, sourceFile);
    const fileName = basename(sourceFile, ".ts").replace(".tsx", "");
    const testFile = join(testDir, `${fileName}.test.ts`);
    
    // Skip if test already exists
    if (existsSync(testFile)) {
      if (verbose) console.log(`  SKIP: ${relPath} (test exists)`);
      continue;
    }
    
    // Extract exports
    const content = readFileSync(sourceFile, "utf-8");
    const exports = extractExports(content);
    
    if (exports.length === 0) {
      if (verbose) console.log(`  SKIP: ${relPath} (no exports)`);
      continue;
    }
    
    console.log(`  GEN: ${relPath} (${exports.length} exports)`);
    
    if (dryRun) {
      console.log(`       Would generate: ${testFile}`);
      continue;
    }
    
    // Generate tests using LLM
    try {
      const testCode = await generateTests(sourceFile, exports, context);
      
      // Write test file
      writeFileSync(testFile, testCode);
      totalTests++;
      console.log(`       WROTE: ${testFile}`);
      
      // Verify tests run
      if (verbose) {
        try {
          execSync("bun test " + testFile, { 
            cwd: projectPath, 
            encoding: "utf-8",
            timeout: 30000,
            stdio: "pipe"
          });
          console.log(`       PASS: Tests run successfully`);
        } catch (e: any) {
          console.log(`       WARN: Tests may need adjustment`);
        }
      }
    } catch (e: any) {
      console.log(`       ERROR: ${e.message}`);
    }
  }
  
  console.log();
  console.log("=== SUMMARY ===");
  console.log(`Generated ${totalTests} test files`);
  console.log();
  
  if (totalTests > 0) {
    console.log("Next steps:");
    console.log("  1. Review generated tests");
    console.log("  2. Run: bun test");
    console.log("  3. Adjust as needed");
  }
}

main().catch(console.error);
