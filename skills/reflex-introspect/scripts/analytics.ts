#!/usr/bin/env bun
/**
 * Reflex Analytics - Track quality metrics over time
 * 
 * Features from CodeRabbit Dashboard:
 * - Weekly/monthly trends
 * - Metric changes over time
 * - Improvement recommendations
 */

import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

interface MetricEntry {
  timestamp: string;
  score: number;
  metrics: Record<string, { value: number; status: string }>;
}

const HISTORY_FILE = ".reflex-history.json";

async function loadHistory(projectPath: string): Promise<MetricEntry[]> {
  const historyPath = join(projectPath, HISTORY_FILE);
  
  if (!existsSync(historyPath)) {
    return [];
  }
  
  try {
    const content = await readFile(historyPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveHistory(projectPath: string, history: MetricEntry[]): Promise<void> {
  const historyPath = join(projectPath, HISTORY_FILE);
  await writeFile(historyPath, JSON.stringify(history, null, 2));
}

function analyzeTrends(history: MetricEntry[]): { trend: string; improving: string[]; declining: string[] } {
  if (history.length < 2) {
    return { trend: "insufficient data", improving: [], declining: [] };
  }
  
  const recent = history[history.length - 1];
  const previous = history[history.length - 2];
  
  const improving: string[] = [];
  const declining: string[] = [];
  
  for (const [metric, data] of Object.entries(recent.metrics)) {
    const prevData = previous.metrics[metric];
    if (prevData && data.value > prevData.value) {
      improving.push(`${metric} (+${(data.value - prevData.value).toFixed(1)})`);
    } else if (prevData && data.value < prevData.value) {
      declining.push(`${metric} (${(data.value - prevData.value).toFixed(1)})`);
    }
  }
  
  const scoreTrend = recent.score > previous.score ? "📈 improving" : 
                     recent.score < previous.score ? "📉 declining" : "➡️ stable";
  
  return { trend: scoreTrend, improving, declining };
}

function generateReport(history: MetricEntry[], period: string = "weekly"): string {
  const lines: string[] = [];
  
  lines.push("═".repeat(60));
  lines.push(`  📊 REFLEX ANALYTICS REPORT (${period.toUpperCase()})`);
  lines.push("═".repeat(60));
  
  if (history.length === 0) {
    lines.push("\n  No history data found. Run 'reflex introspect' first.");
    lines.push("═".repeat(60));
    return lines.join("\n");
  }
  
  const latest = history[history.length - 1];
  const trends = analyzeTrends(history);
  
  lines.push(`\n  Current Score: ${latest.score}/100`);
  lines.push(`  Trend: ${trends.trend}`);
  lines.push(`  Data Points: ${history.length}`);
  
  if (trends.improving.length > 0) {
    lines.push("\n  📈 Improving:");
    for (const m of trends.improving) {
      lines.push(`     ${m}`);
    }
  }
  
  if (trends.declining.length > 0) {
    lines.push("\n  📉 Needs Attention:");
    for (const m of trends.declining) {
      lines.push(`     ${m}`);
    }
  }
  
  // Score history
  lines.push("\n  Score History:");
  const historyToShow = history.slice(-10);
  for (const entry of historyToShow) {
    const date = new Date(entry.timestamp).toLocaleDateString();
    const bar = "█".repeat(Math.floor(entry.score / 5)) + "░".repeat(20 - Math.floor(entry.score / 5));
    lines.push(`     ${date} [${bar}] ${entry.score}`);
  }
  
  lines.push("\n" + "═".repeat(60));
  
  return lines.join("\n");
}

// Main
const { values } = parseArgs({
  options: {
    project: { type: "string", short: "p", default: "." },
    period: { type: "string", default: "weekly" },
    record: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Analytics - Track quality over time

Usage:
  reflex analytics [options]

Options:
  -p, --project <path>   Project directory (default: current)
  --period <period>      Report period: weekly, monthly (default: weekly)
  --record               Record current score to history
  --json                 JSON output
  -h, --help             Show this help

Examples:
  reflex analytics                    # View trends
  reflex analytics --record           # Save current score
  reflex analytics --period monthly   # Monthly report
`);
  process.exit(0);
}

const projectPath = values.project as string;
const history = await loadHistory(projectPath);

if (values.record) {
  // Run introspect and save to history
  console.log("Recording current score...");
  
  // Import and run introspect
  const { execSync } = await import('node:child_process');
  const result = execSync(`bun introspect.ts --project "${projectPath}" --json`, { 
    encoding: 'utf-8',
    cwd: join(process.cwd(), 'skills/reflex-introspect/scripts'),
    env: process.env,
  });
  
  const scorecard = JSON.parse(result);
  
  const entry: MetricEntry = {
    timestamp: new Date().toISOString(),
    score: scorecard.compositeScore,
    metrics: scorecard.metrics.reduce((acc: Record<string, { value: number; status: string }>, m: { name: string; value: number; status: string }) => {
      acc[m.name] = { value: m.value, status: m.status };
      return acc;
    }, {}),
  };
  
  history.push(entry);
  await saveHistory(projectPath, history);
  
  console.log(`Recorded score: ${entry.score}/100`);
} else {
  if (values.json) {
    console.log(JSON.stringify({ history, trends: analyzeTrends(history) }, null, 2));
  } else {
    console.log(generateReport(history, values.period as string));
  }
}