#!/usr/bin/env bun
/**
 * Reflex Security Scanner - Vulnerability detection
 * 
 * Detects: SQLi, XSS, RCE, secrets, SSRF, path traversal, XXE
 */

import { parseArgs } from "node:util";
import { $ } from "bun";

const VULN_PATTERNS = [
  {
    id: "SQLI",
    name: "SQL Injection",
    cvss: 9.8,
    severity: "critical",
    patterns: [
      /query\s*\(\s*["'`].*\$\{/,
      /execute\s*\(\s*["'`].*\$\{/,
      /\.raw\s*\(\s*["'`].*\$\{/,
      /sql.*\+.*\+/i,
    ],
  },
  {
    id: "XSS",
    name: "Cross-Site Scripting",
    cvss: 6.1,
    severity: "high",
    patterns: [
      /innerHTML\s*=\s*.*\$\{/,
      /document\.write\s*\(\s*.*\$\{/,
      /\.html\s*\(\s*.*\$\{/,
    ],
  },
  {
    id: "RCE",
    name: "Remote Code Execution",
    cvss: 10.0,
    severity: "critical",
    patterns: [
      /eval\s*\(\s*.*\$\{/,
      /exec\s*\(\s*.*\$\{/,
      /spawn\s*\(\s*.*\$\{/,
      /Function\s*\(\s*.*\$\{/,
    ],
  },
  {
    id: "SECRETS",
    name: "Hardcoded Secrets",
    cvss: 9.1,
    severity: "high",
    patterns: [
      /api[_-]?key\s*=\s*["'][^"']+["']/i,
      /secret\s*=\s*["'][^"']+["']/i,
      /password\s*=\s*["'][^"']+["']/i,
      /token\s*=\s*["'][^"']+["']/i,
    ],
  },
  {
    id: "SSRF",
    name: "Server-Side Request Forgery",
    cvss: 7.5,
    severity: "high",
    patterns: [
      /fetch\s*\(\s*.*\$\{.*\)/,
      /axios\.get\s*\(\s*.*\$\{/,
      /request\s*\(\s*.*\$\{.*url/,
    ],
  },
  {
    id: "PATHTRAVERSAL",
    name: "Path Traversal",
    cvss: 7.5,
    severity: "high",
    patterns: [
      /readFile\s*\(\s*.*\$\{/,
      /readFileSync\s*\(\s*.*\$\{/,
      /fs\.read\s*\(\s*.*\$\{/,
    ],
  },
  {
    id: "XXE",
    name: "XML External Entity",
    cvss: 9.8,
    severity: "critical",
    patterns: [
      /parseXml\s*\(\s*.*\$\{/,
      /DOMParser.*parseFromString/,
      /libxmljs.*parse/,
    ],
  },
];

async function scanDirectory(dir: string): Promise<any[]> {
  const findings: any[] = [];
  
  const glob = new Bun.Glob("**/*.{ts,tsx,js,jsx}");
  
  for await (const file of glob.scan(dir)) {
    if (file.includes("node_modules") || file.includes(".git")) continue;
    
    const content = await Bun.file(`${dir}/${file}`).text();
    const lines = content.split("\n");
    
    for (const vuln of VULN_PATTERNS) {
      for (const pattern of vuln.patterns) {
        lines.forEach((line, i) => {
          if (pattern.test(line)) {
            findings.push({
              file: `${dir}/${file}`,
              line: i + 1,
              id: vuln.id,
              name: vuln.name,
              cvss: vuln.cvss,
              severity: vuln.severity,
              code: line.trim().slice(0, 80),
            });
          }
        });
      }
    }
  }
  
  return findings;
}

const { values } = parseArgs({
  options: {
    project: { type: "string", default: "." },
    json: { type: "boolean", default: false },
    verbose: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Security Scanner

Usage:
  bun scan.ts [options]

Options:
  --project <path>   Project directory (default: current)
  --json             JSON output
  --verbose          Show all findings
  --help             Show this help
`);
  process.exit(0);
}

const project = values.project as string;
console.log(`Scanning project: ${project}\n`);

const findings = await scanDirectory(project);

if (values.json) {
  console.log(JSON.stringify({ project, findings, total: findings.length }, null, 2));
  process.exit(0);
}

// Group by severity
const critical = findings.filter(f => f.severity === "critical");
const high = findings.filter(f => f.severity === "high");
const medium = findings.filter(f => f.severity === "medium");

console.log("═ REFLEX SECURITY SCAN REPORT ═");
console.log(`Project: ${project}`);
console.log(`Total Findings: ${findings.length}\n`);

if (critical.length > 0) {
  console.log(`🔴 CRITICAL (${critical.length})`);
  critical.forEach(f => {
    console.log(`  [${f.id}] ${f.file}:${f.line}`);
    console.log(`  CVSS: ${f.cvss} | ${f.name}`);
    console.log(`  Code: ${f.code}\n`);
  });
}

if (high.length > 0) {
  console.log(`🟠 HIGH (${high.length})`);
  high.slice(0, 5).forEach(f => {
    console.log(`  [${f.id}] ${f.file}:${f.line}`);
    console.log(`  CVSS: ${f.cvss} | ${f.name}\n`);
  });
}

if (findings.length === 0) {
  console.log("✅ No vulnerabilities found");
}

const securityScore = Math.max(0, 100 - (critical.length * 20) - (high.length * 10));
console.log(`\nSecurity Score: ${securityScore}/100`);