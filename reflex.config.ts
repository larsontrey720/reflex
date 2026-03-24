/**
 * Codeboros - Self-Enhancing Code Quality System
 * Configuration and portable path settings
 */

export const CONFIG = {
  // Workspace paths
  workspace: process.env.CODEBOROS_WORKSPACE || process.env.HOME || "/home/workspace",
  
  // Skills directory
  skillsDir: process.env.CODEBOROS_SKILLS_DIR || "/home/workspace/Skills",
  
  // Seeds/prescriptions directory
  seedsDir: process.env.CODEBOROS_SEEDS_DIR || "/home/workspace/Seeds/codeboros",
  
  // Code health database (SQLite)
  healthDb: process.env.CODEBOROS_HEALTH_DB || "/home/.zo/memory/code-health.db",
  
  // Episodes database
  episodesDb: process.env.CODEBOROS_EPISODES_DB || "/home/.zo/memory/episodes.db",
  
  // Playbooks path
  playbooksPath: "/home/workspace/Skills/codeboros-prescribe/references/playbooks.md",
  
  // Metric thresholds path
  thresholdsPath: "/home/workspace/Skills/codeboros-introspect/references/metric-thresholds.md",
  
  // Governor safety settings
  governor: {
    maxFilesPerCycle: 3,
    maxWeightChange: 0.10,
    regressionThreshold: 0.02,
    requiresApproval: ["F", "H", "L", "M", "N"], // Playbook IDs requiring human approval
  },
  
  // Metric weights (sum = 1.0)
  metricWeights: {
    typeSafety: 0.16,
    testCoverage: 0.18,
    codeComplexity: 0.14,
    dependencyHealth: 0.12,
    errorHandling: 0.14,
    codeConsistency: 0.12,
    buildPerformance: 0.14,
  },
};

export type MetricName = keyof typeof CONFIG.metricWeights;

export interface MetricScore {
  name: MetricName;
  value: number;
  target: number;
  weight: number;
  status: "pass" | "warning" | "critical";
  score: number;
}

export interface Scorecard {
  timestamp: string;
  metrics: MetricScore[];
  composite: number;
  weakest: MetricName;
  trend: "improving" | "stable" | "declining";
}

export interface Playbook {
  id: string;
  name: string;
  metric: MetricName;
  severity: "WARNING" | "CRITICAL";
  requiresApproval: boolean;
  description: string;
  steps: string[];
  targetFiles?: string[];
  constraints?: string[];
}

export interface Prescription {
  id: string;
  timestamp: string;
  playbook: Playbook;
  scorecard: Scorecard;
  seed: SeedSpec;
  approved: boolean;
  executed: boolean;
  result?: "success" | "failed" | "reverted";
}

export interface SeedSpec {
  name: string;
  goal: string;
  constraints: string[];
  acceptanceCriteria: string[];
  targetFiles: string[];
  priority: "low" | "medium" | "high" | "critical";
}