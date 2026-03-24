#!/usr/bin/env bun
/**
 * Reflex Repo Analyzer - GitHub repository analysis
 * 
 * Clones and analyzes GitHub repositories
 */

import { parseArgs } from "node:util";
import { $ } from "bun";

const { values, positionals } = parseArgs({
  options: {
    json: { type: "boolean", default: false },
    verbose: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
  strict: false,
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Reflex Repo Analyzer

Usage:
  bun repo-analyzer.ts <github-url-or-shorthand>

Examples:
  bun repo-analyzer.ts https://github.com/username/repo
  bun repo-analyzer.ts username/repo
  bun repo-analyzer.ts --json username/repo
`);
  process.exit(0);
}

const input = positionals[0];

if (!input) {
  console.error("Error: No repository specified");
  console.log("\nUsage: bun repo-analyzer.ts <github-url-or-shorthand>");
  process.exit(1);
}

// Parse GitHub URL or shorthand
let owner: string, repo: string;

if (input.startsWith("http")) {
  const url = new URL(input);
  const parts = url.pathname.split("/").filter(Boolean);
  owner = parts[0];
  repo = parts[1]?.replace(".git", "") || "";
} else {
  const parts = input.split("/");
  owner = parts[0];
  repo = parts[1] || "";
}

if (!owner || !repo) {
  console.error("Invalid repository format. Use: username/repo or https://github.com/username/repo");
  process.exit(1);
}

console.log(`Analyzing: ${owner}/${repo}\n`);

// Clone to temp directory
const tmpDir = `/tmp/reflex-${Date.now()}`;
const repoUrl = `https://github.com/${owner}/${repo}.git`;

try {
  console.log("Cloning repository...");
  await $`git clone --depth 1 ${repoUrl} ${tmpDir}`.quiet();
  console.log("Clone complete.\n");
  
  // Run introspect on the cloned repo
  const { exitCode } = await $`bun introspect.ts --project ${tmpDir} ${values.json ? "--json" : ""}`.cwd(
    import.meta.dir
  ).nothrow();
  
  // Cleanup
  await $`rm -rf ${tmpDir}`.quiet();
  
  process.exit(exitCode);
} catch (error: any) {
  console.error("Error:", error.message || "Failed to clone repository");
  await $`rm -rf ${tmpDir}`.quiet().catch(() => {});
  process.exit(1);
}