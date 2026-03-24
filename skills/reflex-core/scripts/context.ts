#!/usr/bin/env bun
/**
 * Reflex Context Engine - Builds rich context for autonomous operation
 * 
 * This is the BRAIN that makes Reflex autonomous:
 * - Injects memory/learnings into every LLM call
 * - Tracks project state and progress
 * - Provides goals, constraints, and rules
 * - Enables self-aware operation
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

const REFLEX_DIR = process.env.REFLEX_DIR || join(homedir(), ".reflex");
const MEMORY_PATH = join(REFLEX_DIR, "memory.json");
const STATE_PATH = join(REFLEX_DIR, "state.json");
const PROJECT_CONTEXT_PATH = join(REFLEX_DIR, "project-context.json");

// ============== TYPES ==============

export interface Incident {
  id: string;
  timestamp: string;
  title: string;
  rootCause: string;
  fix: string;
  files: string[];
  patterns: string[];
  severity: "high" | "medium" | "low";
  resolvedBy: string;
  project?: string;
}

export interface Pattern {
  name: string;
  riskScore: number;
  occurrences: number;
  commonFix: string;
  projects: string[];
}

export interface Decision {
  id: string;
  timestamp: string;
  context: string;
  decision: string;
  rationale: string;
  alternatives: string[];
  outcome?: "success" | "failure" | "partial";
  project?: string;
}

export interface CycleRecord {
  id: string;
  timestamp: string;
  project: string;
  beforeScore: number;
  afterScore: number;
  playbook: string;
  files: string[];
  reverted: boolean;
  revertReason?: string;
}

export interface ProjectContext {
  name: string;
  path: string;
  lastAnalyzed: string;
  currentScore: number;
  weakestMetric: string;
  conventions: {
    style?: string;
    testFramework?: string;
    buildTool?: string;
    language?: string;
  };
  recentFiles: string[];
  ignoredPatterns: string[];
}

export interface ReflexState {
  version: string;
  lastRun: string;
  totalCycles: number;
  successfulCycles: number;
  revertedCycles: number;
  activeProjects: string[];
  model: string;
  provider: string;
}

export interface MemoryStore {
  incidents: Incident[];
  patterns: Pattern[];
  decisions: Decision[];
  cycles: CycleRecord[];
}

// ============== LOADERS ==============

export function loadMemory(): MemoryStore {
  if (!existsSync(MEMORY_PATH)) {
    return { incidents: [], patterns: [], decisions: [], cycles: [] };
  }
  try {
    return JSON.parse(readFileSync(MEMORY_PATH, "utf-8"));
  } catch {
    return { incidents: [], patterns: [], decisions: [], cycles: [] };
  }
}

export function saveMemory(memory: MemoryStore): void {
  const dir = dirname(MEMORY_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

export function loadState(): ReflexState {
  if (!existsSync(STATE_PATH)) {
    return {
      version: "1.0.0",
      lastRun: new Date().toISOString(),
      totalCycles: 0,
      successfulCycles: 0,
      revertedCycles: 0,
      activeProjects: [],
      model: "unknown",
      provider: "unknown",
    };
  }
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
  } catch {
    return {
      version: "1.0.0",
      lastRun: new Date().toISOString(),
      totalCycles: 0,
      successfulCycles: 0,
      revertedCycles: 0,
      activeProjects: [],
      model: "unknown",
      provider: "unknown",
    };
  }
}

export function saveState(state: ReflexState): void {
  const dir = dirname(STATE_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function loadProjectContext(projectPath: string): ProjectContext | null {
  const contextPath = join(REFLEX_DIR, "projects", Buffer.from(projectPath).toString("base64") + ".json");
  if (!existsSync(contextPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(contextPath, "utf-8"));
  } catch {
    return null;
  }
}

export function saveProjectContext(context: ProjectContext): void {
  const contextPath = join(REFLEX_DIR, "projects", Buffer.from(context.path).toString("base64") + ".json");
  const dir = dirname(contextPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(contextPath, JSON.stringify(context, null, 2));
}

// ============== CONTEXT BUILDER ==============

/**
 * Builds the full context string to inject into LLM prompts
 * This is what makes Reflex autonomous and self-aware
 */
export function buildSystemContext(projectPath?: string): string {
  const memory = loadMemory();
  const state = loadState();
  const projectContext = projectPath ? loadProjectContext(projectPath) : null;
  
  const sections: string[] = [];
  
  // === REFLEX IDENTITY ===
  sections.push(`# REFLEX - Self-Enhancing Code Quality System

You are Reflex, an autonomous code quality agent. Your purpose is to diagnose code health issues, prescribe fixes, and execute them safely. You operate autonomously but follow strict safety rules.

## Your Capabilities
- Analyze code quality across 10 metrics
- Generate remediation plans from 17 playbooks
- Execute fixes autonomously via LLM
- Learn from past incidents and decisions
- Remember project-specific context
- Revert harmful changes automatically

## Your Limitations
- You MUST NOT modify database schemas or migrations
- You MUST NOT make breaking API changes without approval
- You MUST NOT exceed 5 files modified per cycle
- You MUST revert any change that drops a metric by >2%
- You MUST get human approval for critical playbooks (marked ⚠️)`);

  // === STATE AWARENESS ===
  sections.push(`
## Current State
- Version: ${state.version}
- Last run: ${state.lastRun}
- Total cycles: ${state.totalCycles}
- Success rate: ${state.totalCycles > 0 ? Math.round((state.successfulCycles / state.totalCycles) * 100) : 0}%
- Active projects: ${state.activeProjects.length}
- Model: ${state.model} (${state.provider})`);

  // === PROJECT CONTEXT ===
  if (projectContext) {
    sections.push(`
## Project: ${projectContext.name}
- Path: ${projectContext.path}
- Current score: ${projectContext.currentScore}/100
- Weakest metric: ${projectContext.weakestMetric}
- Last analyzed: ${projectContext.lastAnalyzed}
- Language: ${projectContext.conventions.language || "Unknown"}
- Build tool: ${projectContext.conventions.buildTool || "Unknown"}
- Test framework: ${projectContext.conventions.testFramework || "Unknown"}
- Recent files: ${projectContext.recentFiles.slice(0, 5).join(", ")}
- Ignored patterns: ${projectContext.ignoredPatterns.join(", ")}`);
  }

  // === LEARNINGS FROM MEMORY ===
  if (memory.incidents.length > 0) {
    const recentIncidents = memory.incidents
      .slice(-5)
      .map(i => `- ${i.title}: Fixed by ${i.fix} (${i.severity} severity)`)
      .join("\n");
    
    sections.push(`
## Recent Incidents (Learn from These)
${recentIncidents}`);
  }

  // === DETECTED PATTERNS ===
  if (memory.patterns.length > 0) {
    const topPatterns = memory.patterns
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5)
      .map(p => `- ${p.name}: ${p.occurrences} occurrences, risk ${p.riskScore}/10, fix: ${p.commonFix}`)
      .join("\n");
    
    sections.push(`
## Known Risk Patterns
${topPatterns}`);
  }

  // === PAST DECISIONS ===
  if (memory.decisions.length > 0) {
    const recentDecisions = memory.decisions
      .slice(-3)
      .map(d => `- ${d.decision}: ${d.rationale} (${d.outcome || "pending outcome"})`)
      .join("\n");
    
    sections.push(`
## Past Decisions
${recentDecisions}`);
  }

  // === CYCLE HISTORY ===
  if (memory.cycles.length > 0) {
    const recentCycles = memory.cycles
      .slice(-3)
      .map(c => `- ${c.playbook}: ${c.beforeScore} → ${c.afterScore} (${c.reverted ? "REVERTED: " + c.revertReason : "success"})`)
      .join("\n");
    
    sections.push(`
## Recent Cycles
${recentCycles}`);
  }

  // === GOVERNOR RULES ===
  sections.push(`
## Governor Safety Rules (ALWAYS ENFORCE)
1. **Approval gate** — Critical playbooks require human approval
2. **Blast radius** — Max 5 files modified per cycle
3. **Regression detection** — Any metric dropping >2% triggers revert
4. **Schema protection** — Never modify database schemas
5. **Audit trail** — Log every action to memory
6. **Weight bounds** — Routing weights change max ±10% per cycle

## What You Should Do Autonomously
- Run introspection to identify weakest metric
- Generate prescriptions for non-critical playbooks
- Execute fixes for: A, C, D, E, G, I, J, M, O, P, Q (auto-approved)
- Learn from every cycle outcome
- Update project context after each run

## What Requires Human Approval (⚠️)
- Playbook B: Any Type Elimination (can break runtime)
- Playbook F: Critical Path Coverage (affects production)
- Playbook H: Error Path Verification (complexity risk)
- Playbook K: Interface Extraction (breaking change risk)
- Playbook L: Module Boundary Enforcement (architectural)
- Playbook N: Vulnerable Dependency Swap (runtime risk)
- L: Executor Health Check (system-level)
- M: Skill Error Pattern Fix (tool modification)
- N: Tool Call Optimization (behavior change)`);

  return sections.join("\n");
}

/**
 * Builds a context-aware prompt for a specific task
 */
export function buildPrompt(task: string, projectPath?: string): string {
  const systemContext = buildSystemContext(projectPath);
  
  return `${systemContext}

---

## Current Task
${task}

---

## Instructions
1. Consider the project context and past learnings above
2. Follow all governor rules
3. If the task involves a critical playbook, ask for approval first
4. After completion, report what was done and the outcome
5. If you encounter issues, explain them clearly

Proceed with the task.`;
}

/**
 * Records an incident to memory
 */
export function recordIncident(
  title: string,
  rootCause: string,
  fix: string,
  files: string[],
  severity: Incident["severity"],
  project?: string
): void {
  const memory = loadMemory();
  
  const patterns: string[] = [];
  const lowerTitle = title.toLowerCase();
  const lowerCause = rootCause.toLowerCase();
  
  // Auto-detect patterns
  if (lowerTitle.includes("timeout") || lowerCause.includes("timeout")) patterns.push("async-timeout");
  if (lowerTitle.includes("config") || lowerCause.includes("config")) patterns.push("config-migration");
  if (lowerTitle.includes("auth") || lowerCause.includes("auth")) patterns.push("auth-failure");
  if (lowerTitle.includes("null") || lowerCause.includes("null")) patterns.push("null-reference");
  if (lowerTitle.includes("type") || lowerCause.includes("type")) patterns.push("type-error");
  if (lowerTitle.includes("test") || lowerCause.includes("test")) patterns.push("test-failure");
  if (lowerTitle.includes("dep") || lowerCause.includes("dep")) patterns.push("dependency-issue");
  
  memory.incidents.push({
    id: `inc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    title,
    rootCause,
    fix,
    files,
    patterns,
    severity,
    resolvedBy: "reflex",
    project,
  });
  
  // Update pattern occurrences
  for (const patternName of patterns) {
    const existing = memory.patterns.find(p => p.name === patternName);
    if (existing) {
      existing.occurrences++;
      existing.riskScore = Math.min(10, existing.riskScore + 0.5);
      if (project && !existing.projects.includes(project)) {
        existing.projects.push(project);
      }
    } else {
      memory.patterns.push({
        name: patternName,
        riskScore: severity === "high" ? 8 : severity === "medium" ? 5 : 3,
        occurrences: 1,
        commonFix: fix,
        projects: project ? [project] : [],
      });
    }
  }
  
  saveMemory(memory);
}

/**
 * Records a decision to memory
 */
export function recordDecision(
  context: string,
  decision: string,
  rationale: string,
  alternatives: string[],
  project?: string
): void {
  const memory = loadMemory();
  
  memory.decisions.push({
    id: `dec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    context,
    decision,
    rationale,
    alternatives,
    project,
  });
  
  saveMemory(memory);
}

/**
 * Records a cycle outcome
 */
export function recordCycle(
  project: string,
  beforeScore: number,
  afterScore: number,
  playbook: string,
  files: string[],
  reverted: boolean,
  revertReason?: string
): void {
  const memory = loadMemory();
  const state = loadState();
  
  memory.cycles.push({
    id: `cycle-${Date.now()}`,
    timestamp: new Date().toISOString(),
    project,
    beforeScore,
    afterScore,
    playbook,
    files,
    reverted,
    revertReason,
  });
  
  state.totalCycles++;
  if (!reverted && afterScore >= beforeScore) {
    state.successfulCycles++;
  }
  if (reverted) {
    state.revertedCycles++;
  }
  state.lastRun = new Date().toISOString();
  if (!state.activeProjects.includes(project)) {
    state.activeProjects.push(project);
  }
  
  saveMemory(memory);
  saveState(state);
}

/**
 * Updates project context after analysis
 */
export function updateProjectContext(
  projectPath: string,
  scorecard: { compositeScore: number; weakestMetric: string; metrics: any[] }
): void {
  const existing = loadProjectContext(projectPath);
  
  const context: ProjectContext = {
    name: projectPath.split("/").pop() || projectPath,
    path: projectPath,
    lastAnalyzed: new Date().toISOString(),
    currentScore: scorecard.compositeScore,
    weakestMetric: scorecard.weakestMetric,
    conventions: existing?.conventions || {},
    recentFiles: existing?.recentFiles || [],
    ignoredPatterns: existing?.ignoredPatterns || ["node_modules", "dist", ".git"],
  };
  
  saveProjectContext(context);
}