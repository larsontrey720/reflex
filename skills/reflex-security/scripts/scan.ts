#!/usr/bin/env bun
/**
 * Reflex Security Scanner - Vulnerability detection
 * 
 * Features from BugBunny.ai:
 * - Automated security scanning
 * - Vulnerability detection (SQLi, XSS, RCE, etc.)
 * - CVSS scoring
 * - Security report generation
 */

import { parseArgs } from "node:util";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

// Vulnerability patterns
const VULNERABILITY_PATTERNS = {
  sqli: {
    patterns: [
      /query\s*\(\s*[`'"]*\s*\+\s*\w+/gi,
      /execute\s*\(\s*[`'"]*\s*\+\s*\w+/gi,
      /\$\{[^}]*\}.*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
      /query\s*\(\s*[`'"][^`'"]*[`'"]\s*\+/gi,
    ],
    severity: "critical",
    cvssBase: 9.8,
    description: "SQL Injection vulnerability detected",
  },
  xss: {
    patterns: [
      /innerHTML\s*=\s*[^;]*\+/gi,
      /document\.write\s*\([^)]*\+/gi,
      /\.html\s*\(\s*[^)]*\+/gi,
      /dangerouslySetInnerHTML/gi,
    ],
    severity: "high",
    cvssBase: 6.1,
    description: "Cross-Site Scripting (XSS) vulnerability detected",
  },
  rce: {
    patterns: [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /child_process.*exec/gi,
      /spawn\s*\(\s*[^,]*\+/gi,
    ],
    severity: "critical",
    cvssBase: 10.0,
    description: "Remote Code Execution vulnerability detected",
  },
  secrets: {
    patterns: [
      /(?:password|passwd|pwd)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
      /(?:api[_-]?key|apikey)\s*[=:]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
      /(?:secret|token)\s*[=:]\s*['"][a-zA-Z0-9]{16,}['"]/gi,
      /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
    ],
    severity: "critical",
    cvssBase: 9.1,
    description: "Hardcoded secret/credential detected",
  },
  ssrf: {
    patterns: [
      /fetch\s*\(\s*[`'"]*\s*\+/gi,
      /axios\.(?:get|post|put|delete)\s*\(\s*[`'"]*\s*\+/gi,
      /request\s*\(\s*\{[^}]*url\s*:\s*[^,}]*\+/gi,
    ],
    severity: "high",
    cvssBase: 7.5,
    description: "Server-Side Request Forgery (SSRF) vulnerability detected",
  },
  auth: {
    patterns: [
      /bcrypt\.compare\s*\([^,)]*,\s*['"][^'"]+['"]/gi,
      /===\s*['"][^'"]+['"]\s*\|\|/gi,
      /(?:if|while)\s*\([^)]*(?:password|token|secret)[^)]*===/gi,
    ],
    severity: "high",
    cvssBase: 8.1,
    description: "Authentication bypass vulnerability detected",
  },
  pathTraversal: {
    patterns: [
      /readFile\s*\(\s*[^,]*\+/gi,
      /fs\.read[A-Za-z]+\s*\(\s*[^,]*\+/gi,
      /path\.join\s*\([^)]*\.\.\//gi,
    ],
    severity: "high",
    cvssBase: 7.5,
    description: "Path traversal vulnerability detected",
  },
  xxe: {
    patterns: [
      /xmlparse|xmllib|lxml/gi,
      /DOCTYPE\s+.*\s+SYSTEM/gi,
      /ENTITY\s+\w+\s+SYSTEM/gi,
    ],
    severity: "critical",
    cvssBase: 9.8,
    description: "XML External Entity (XXE) vulnerability detected",
  },
};

interface Vulnerability {
  type: string;
  file: string;
  line: number;
  severity: string;
  cvss: number;
  description: string;
  match: string;
  remediation: string;
}

const REMEDIATIONS: Record<string, string> = {
  sqli: "Use parameterized queries or prepared statements. Never concatenate user input into SQL strings.",
  xss: "Sanitize and escape all user input before rendering. Use textContent instead of innerHTML.",
  rce: "Avoid eval() and dynamic code execution. Use allowlists for any dynamic operations.",
  secrets: "Use environment variables or secret management systems. Never hardcode credentials.",
  ssrf: "Validate and sanitize all URLs before making requests. Use allowlists for permitted domains.",
  auth: "Use constant-time comparison for secrets. Implement proper session management.",
  pathTraversal: "Validate and sanitize file paths. Use path.resolve() and check against allowed directories.",
  xxe: "Disable external entity processing in XML parsers. Use JSON instead of XML where possible.",
};

async function scanFile(filePath: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  const ext = extname(filePath);
  
  // Only scan relevant files
  if (!['.ts', '.tsx', '.js', '.jsx', '.py', '.php', '.rb', '.go', '.java'].includes(ext)) {
    return vulnerabilities;
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const [vulnType, config] of Object.entries(VULNERABILITY_PATTERNS)) {
      for (const pattern of config.patterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(content)) !== null) {
          // Find line number
          const beforeMatch = content.substring(0, match.index);
          const lineNumber = beforeMatch.split('\n').length;
          
          vulnerabilities.push({
            type: vulnType,
            file: filePath,
            line: lineNumber,
            severity: config.severity,
            cvss: config.cvssBase,
            description: config.description,
            match: match[0].substring(0, 50),
            remediation: REMEDIATIONS[vulnType] || "Review and fix this security issue.",
          });
        }
      }
    }
  } catch (error) {
    // Skip files that can't be read
  }

  return vulnerabilities;
}

async function scanDirectory(dir: string, maxFiles: number = 1000): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  let fileCount = 0;

  async function walk(currentDir: string) {
    if (fileCount >= maxFiles) return;
    
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (fileCount >= maxFiles) break;
        
        const fullPath = join(currentDir, entry.name);
        
        // Skip common non-source directories
        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'dist', 'build', 'vendor', '__pycache__'].includes(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          fileCount++;
          const fileVulns = await scanFile(fullPath);
          vulnerabilities.push(...fileVulns);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  await walk(dir);
  return vulnerabilities;
}

function generateReport(vulnerabilities: Vulnerability[], projectPath: string): string {
  const lines: string[] = [];
  
  lines.push("═".repeat(60));
  lines.push("  REFLEX SECURITY SCAN REPORT");
  lines.push("═".repeat(60));
  lines.push(`  Project: ${projectPath}`);
  lines.push(`  Scanned: ${new Date().toISOString()}`);
  lines.push(`  Total Findings: ${vulnerabilities.length}`);
  lines.push("");

  // Group by severity
  const bySeverity = vulnerabilities.reduce((acc, v) => {
    acc[v.severity] = acc[v.severity] || [];
    acc[v.severity].push(v);
    return acc;
  }, {} as Record<string, Vulnerability[]>);

  const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
  
  for (const severity of severityOrder) {
    const vulns = bySeverity[severity];
    if (!vulns || vulns.length === 0) continue;

    const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
    lines.push(`\n${icon} ${severity.toUpperCase()} (${vulns.length})`);
    lines.push("-".repeat(40));

    for (const v of vulns.slice(0, 10)) {
      lines.push(`  [${v.type.toUpperCase()}] ${v.file}:${v.line}`);
      lines.push(`  CVSS: ${v.cvss} | ${v.description}`);
      lines.push(`  Match: "${v.match}..."`);
      lines.push(`  Fix: ${v.remediation.substring(0, 60)}...`);
      lines.push("");
    }

    if (vulns.length > 10) {
      lines.push(`  ... and ${vulns.length - 10} more ${severity} findings`);
    }
  }

  // Summary
  lines.push("\n" + "═".repeat(60));
  lines.push("  SUMMARY");
  lines.push("═".repeat(60));

  const critical = bySeverity['critical']?.length || 0;
  const high = bySeverity['high']?.length || 0;
  const total = vulnerabilities.length;

  if (critical > 0) {
    lines.push(`  🔴 CRITICAL: ${critical} vulnerabilities require immediate attention`);
  }
  if (high > 0) {
    lines.push(`  🟠 HIGH: ${high} vulnerabilities should be fixed soon`);
  }

  if (total === 0) {
    lines.push("  ✅ No vulnerabilities detected");
  } else {
    const avgCvss = vulnerabilities.reduce((sum, v) => sum + v.cvss, 0) / total;
    lines.push(`  Average CVSS: ${avgCvss.toFixed(1)}`);
    lines.push(`  Security Score: ${Math.max(0, 100 - total * 2)}`);
  }

  lines.push("═".repeat(60));

  return lines.join("\n");
}

// Main
const { values } = parseArgs({
  options: {
    project: { type: "string", short: "p", default: "." },
    output: { type: "string", short: "o" },
    json: { type: "boolean", default: false },
    quiet: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Security Scanner - Vulnerability detection

Usage:
  bun scan.ts [options]

Options:
  -p, --project <path>   Project directory (default: current)
  -o, --output <file>    Save report to file
  --json                 JSON output
  --quiet                Only show summary
  -h, --help             Show this help

Examples:
  reflex security --project ./my-app
  reflex security --json > security-report.json
`);
  process.exit(0);
}

const projectPath = values.project as string;

if (!values.quiet) {
  console.log(`\n🔍 Scanning project: ${projectPath}\n`);
}

const vulnerabilities = await scanDirectory(projectPath);

if (values.json) {
  const output = JSON.stringify({
    timestamp: new Date().toISOString(),
    project: projectPath,
    total: vulnerabilities.length,
    vulnerabilities: vulnerabilities,
    summary: {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      securityScore: Math.max(0, 100 - vulnerabilities.length * 2),
    },
  }, null, 2);
  
  if (values.output) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(values.output as string, output);
    console.log(`Report saved to: ${values.output}`);
  } else {
    console.log(output);
  }
} else {
  const report = generateReport(vulnerabilities, projectPath);
  console.log(report);
  
  if (values.output) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(values.output as string, report);
    console.log(`\nReport saved to: ${values.output}`);
  }
}

// Exit with error code if critical vulnerabilities found
const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
if (criticalCount > 0) {
  process.exit(1);
}