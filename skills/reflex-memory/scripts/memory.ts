#!/usr/bin/env bun
/**
 * Reflex Memory - Production memory and learning loop
 */

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

const MEMORY_PATH = process.env.REFLEX_MEMORY_PATH || join(homedir(), ".reflex", "memory.json");

interface Incident {
  id: string;
  timestamp: string;
  title: string;
  rootCause: string;
  fix: string;
  files: string[];
  patterns: string[];
  severity: "high" | "medium" | "low";
  resolvedBy: string;
}

interface Pattern {
  name: string;
  riskScore: number;
  occurrences: number;
  commonFix: string;
}

interface Decision {
  id: string;
  timestamp: string;
  context: string;
  decision: string;
  rationale: string;
  alternatives: string[];
}

interface MemoryStore {
  incidents: Incident[];
  patterns: Pattern[];
  decisions: Decision[];
}

function loadMemory(): MemoryStore {
  if (!existsSync(MEMORY_PATH)) {
    return { incidents: [], patterns: [], decisions: [] };
  }
  try {
    return JSON.parse(readFileSync(MEMORY_PATH, "utf-8"));
  } catch {
    return { incidents: [], patterns: [], decisions: [] };
  }
}

function saveMemory(memory: MemoryStore): void {
  const dir = dirname(MEMORY_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

function addIncident(memory: MemoryStore, title: string, rootCause: string, fix: string, files: string[], severity: Incident["severity"]): void {
  const id = `inc-${Date.now()}`;
  
  // Detect patterns from title and rootCause
  const patterns: string[] = [];
  if (title.toLowerCase().includes("timeout") || rootCause.toLowerCase().includes("timeout")) {
    patterns.push("async-timeout");
  }
  if (title.toLowerCase().includes("config") || rootCause.toLowerCase().includes("config")) {
    patterns.push("config-migration");
  }
  if (title.toLowerCase().includes("auth") || rootCause.toLowerCase().includes("auth")) {
    patterns.push("auth-failure");
  }
  if (title.toLowerCase().includes("null") || rootCause.toLowerCase().includes("null")) {
    patterns.push("null-reference");
  }
  
  memory.incidents.push({
    id,
    timestamp: new Date().toISOString(),
    title,
    rootCause,
    fix,
    files,
    patterns,
    severity,
    resolvedBy: "manual-entry",
  });
  
  // Update pattern occurrences
  for (const patternName of patterns) {
    const existing = memory.patterns.find(p => p.name === patternName);
    if (existing) {
      existing.occurrences++;
      existing.riskScore = Math.min(1, existing.occurrences * 0.15 + 0.3);
    } else {
      memory.patterns.push({
        name: patternName,
        riskScore: 0.35,
        occurrences: 1,
        commonFix: fix,
      });
    }
  }
}

function searchMemory(memory: MemoryStore, query: string): { incidents: Incident[]; patterns: Pattern[] } {
  const lowerQuery = query.toLowerCase();
  
  const incidents = memory.incidents.filter(i => 
    i.title.toLowerCase().includes(lowerQuery) ||
    i.rootCause.toLowerCase().includes(lowerQuery) ||
    i.fix.toLowerCase().includes(lowerQuery) ||
    i.files.some(f => f.toLowerCase().includes(lowerQuery))
  );
  
  const patterns = memory.patterns.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.commonFix.toLowerCase().includes(lowerQuery)
  );
  
  return { incidents, patterns };
}

function getInsights(memory: MemoryStore, changedFiles: string[]): { patterns: Pattern[]; incidents: Incident[] } {
  const relevantPatterns: Pattern[] = [];
  const relevantIncidents: Incident[] = [];
  
  for (const pattern of memory.patterns) {
    if (pattern.riskScore > 0.5) {
      relevantPatterns.push(pattern);
    }
  }
  
  for (const incident of memory.incidents) {
    if (incident.files.some(f => changedFiles.some(cf => cf.includes(f) || f.includes(cf)))) {
      relevantIncidents.push(incident);
    }
  }
  
  return { patterns: relevantPatterns, incidents: relevantIncidents };
}

function formatStatus(memory: MemoryStore): string {
  const lines: string[] = [];
  
  lines.push("═ REFLEX MEMORY STATUS ═");
  lines.push("");
  lines.push(`Storage: ${MEMORY_PATH}`);
  lines.push("");
  lines.push(`Incidents: ${memory.incidents.length}`);
  lines.push(`Patterns: ${memory.patterns.length}`);
  lines.push(`Decisions: ${memory.decisions.length}`);
  lines.push("");
  
  if (memory.patterns.length > 0) {
    lines.push("Top Risk Patterns:");
    const sorted = [...memory.patterns].sort((a, b) => b.riskScore - a.riskScore);
    for (const p of sorted.slice(0, 5)) {
      const riskIcon = p.riskScore > 0.6 ? "⚠️" : p.riskScore > 0.4 ? "⚡" : "✓";
      lines.push(`  ${riskIcon} ${p.name} (${Math.round(p.riskScore * 100)}% risk, ${p.occurrences}x)`);
    }
  }
  
  lines.push("");
  lines.push("═════════════════════════");
  
  return lines.join("\n");
}

function formatSearchResults(results: { incidents: Incident[]; patterns: Pattern[] }, query: string): string {
  const lines: string[] = [];
  
  lines.push(`═ MEMORY SEARCH: "${query}" ═`);
  lines.push("");
  
  if (results.incidents.length > 0) {
    lines.push(`Found ${results.incidents.length} incidents:`);
    for (const inc of results.incidents.slice(0, 5)) {
      lines.push(`  • [${inc.severity.toUpperCase()}] ${inc.title}`);
      lines.push(`    Root cause: ${inc.rootCause}`);
      lines.push(`    Fix: ${inc.fix}`);
      lines.push(`    Date: ${inc.timestamp.split("T")[0]}`);
      lines.push("");
    }
  }
  
  if (results.patterns.length > 0) {
    lines.push(`Found ${results.patterns.length} patterns:`);
    for (const p of results.patterns) {
      lines.push(`  • ${p.name} (${Math.round(p.riskScore * 100)}% risk)`);
      lines.push(`    Common fix: ${p.commonFix}`);
      lines.push("");
    }
  }
  
  if (results.incidents.length === 0 && results.patterns.length === 0) {
    lines.push("No results found.");
  }
  
  lines.push("═════════════════════════");
  
  return lines.join("\n");
}

function formatInsights(insights: { patterns: Pattern[]; incidents: Incident[] }): string {
  const lines: string[] = [];
  
  lines.push("═ REFLEX MEMORY INSIGHTS ═");
  lines.push("");
  lines.push("Analyzing current changes against production memory...");
  lines.push("");
  lines.push("┌─ MATCHED PATTERNS ──────────────────────────────────┐");
  lines.push("│                                                       │");
  
  if (insights.patterns.length > 0) {
    for (const p of insights.patterns.slice(0, 3)) {
      const risk = Math.round(p.riskScore * 100);
      const icon = risk > 60 ? "⚠️" : "⚡";
      lines.push(`│  ${icon} ${p.name} (${risk}% risk)`.padEnd(52) + "│");
      lines.push(`│    → Occurred ${p.occurrences} times`.padEnd(52) + "│");
      lines.push(`│    → Common fix: ${p.commonFix.slice(0, 30)}`.padEnd(52) + "│");
      lines.push("│                                                       │");
    }
  } else {
    lines.push("│  No risk patterns detected".padEnd(52) + "│");
    lines.push("│                                                       │");
  }
  
  lines.push("└───────────────────────────────────────────────────────┘");
  lines.push("");
  
  if (insights.patterns.length > 0) {
    lines.push("RECOMMENDATIONS:");
    for (const p of insights.patterns.slice(0, 2)) {
      lines.push(`  • ${p.commonFix}`);
    }
  }
  
  lines.push("");
  lines.push(`CONFIDENCE: Based on ${insights.incidents.length} resolved incidents in memory`);
  lines.push("═══════════════════════════════════════════════════════");
  
  return lines.join("\n");
}

// CLI
const { values } = parseArgs({
  options: {
    status: { type: "boolean", default: false },
    search: { type: "string", short: "s" },
    add: { type: "string" },
    insights: { type: "boolean", default: false },
    export: { type: "string" },
    import: { type: "string" },
    files: { type: "string" },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Memory - Production memory and learning loop

Remembers patterns from past fixes. Compounds knowledge over time.

Usage:
  reflex memory [options]

Options:
  --status              Show memory status
  -s, --search <query>  Search past incidents
  --add <text>          Add a resolved incident
  --insights            Get insights for current changes
  --export <file>       Export memory to file
  --import <file>       Import memory from file
  --files <paths>       Files to analyze (comma-separated)
  -h, --help            Show this help

Examples:
  reflex memory --status
  reflex memory --search "checkout failed"
  reflex memory --add "Fixed auth timeout by adding retry logic" --files auth.ts
  reflex memory --insights --files src/checkout/service.ts
`);
  process.exit(0);
}

const memory = loadMemory();

if (values.status) {
  console.log(formatStatus(memory));
  process.exit(0);
}

if (values.search) {
  const results = searchMemory(memory, values.search as string);
  console.log(formatSearchResults(results, values.search as string));
  process.exit(0);
}

if (values.add) {
  const files = (values.files as string)?.split(",").map(f => f.trim()) || [];
  addIncident(memory, values.add as string, "Manual entry", values.add as string, files, "medium");
  saveMemory(memory);
  console.log(`\n✓ Incident added to memory: ${values.add}\n`);
  process.exit(0);
}

if (values.insights) {
  const files = (values.files as string)?.split(",").map(f => f.trim()) || [];
  const insights = getInsights(memory, files);
  console.log(formatInsights(insights));
  process.exit(0);
}

if (values.export) {
  writeFileSync(values.export as string, JSON.stringify(memory, null, 2));
  console.log(`\n✓ Memory exported to: ${values.export}\n`);
  process.exit(0);
}

if (values.import) {
  if (!existsSync(values.import as string)) {
    console.error(`File not found: ${values.import}`);
    process.exit(1);
  }
  const imported = JSON.parse(readFileSync(values.import as string, "utf-8"));
  saveMemory(imported);
  console.log(`\n✓ Memory imported from: ${values.import}\n`);
  process.exit(0);
}

// Default: show status
console.log(formatStatus(memory));