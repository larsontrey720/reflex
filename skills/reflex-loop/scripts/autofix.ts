#!/usr/bin/env bun
/**
 * Autofix Loop - Autonomous single-metric code optimization
 * 
 * Iteratively improves code until target metric reached or max attempts
 */

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execSync } from "node:child_process";
import { generateFix, isConfigured, getConfig, callLLMWithContext, buildSystemContext } from "../lib/llm-client.js";

const { values } = parseArgs({
  options: {
    program: { type: "string", short: "p" },
    project: { type: "string", short: "d" },
    target: { type: "string", short: "t" },
    metric: { type: "string", short: "m" },
    file: { type: "string", short: "f" },
    "max-attempts": { type: "string", default: "10" },
    "no-revert": { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Autofix Loop - Autonomous metric optimization

Usage:
  bun autofix.ts [options]

Options:
  -p, --program <file>    Program definition file (see template.program.md)
  -d, --project <dir>     Project directory
  -t, --target <score>    Target score (0-100)
  -m, --metric <name>     Metric to optimize
  -f, --file <path>       Target file to modify
  --max-attempts <n>      Max iterations (default: 10)
  --no-revert             Don't auto-revert on regression
  --json                  Output as JSON
  -h, --help              Show this help
`);
  process.exit(0);
}

// Parse program.md if provided
function parseProgram(file: string): any {
  const content = readFileSync(file, "utf-8");
  
  // Extract fields from markdown
  const getField = (name: string): string | null => {
    const match = content.match(new RegExp(`## ${name}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`));
    return match ? match[1].trim() : null;
  };
  
  const getFirstCodeBlock = (): string | null => {
    const match = content.match(/```bash\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };
  
  return {
    goal: getField("Goal"),
    metricCommand: getFirstCodeBlock(),
    target: getField("Target"),
    targetFiles: getField("Target Files")?.split("\n").map(l => l.replace(/^- /, "").trim()).filter(Boolean),
    constraints: getField("Constraints"),
  };
}

// Get metric score from command
function getScoreFromCommand(cmd: string, projectPath: string): number {
  try {
    const result = execSync(cmd, { 
      encoding: "utf-8", 
      cwd: projectPath,
      env: { ...process.env, PROJECT_DIR: projectPath },
      stdio: ["pipe", "pipe", "pipe"]
    });
    
    // Try to parse JSON output
    try {
      const json = JSON.parse(result);
      return json.score || json.value || json.percent || 0;
    } catch {
      // Try to find number in output
      const match = result.match(/(\d+(?:\.\d+)?)\s*%?/);
      return match ? parseFloat(match[1]) : 0;
    }
  } catch (e: any) {
    // Try to parse stderr for score
    const stderr = e.stderr || "";
    const match = stderr.match(/score[:\s]+(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : 0;
  }
}

// Main execution
async function main() {
  const projectPath = resolve(values.project as string || process.cwd());
  const maxAttempts = parseInt(values["max-attempts"] as string || "10");
  const noRevert = values["no-revert"];
  
  // Check LLM configuration
  if (!isConfigured()) {
    console.error("\n❌ LLM not configured. Run 'bun llm-client.ts --config'\n");
    process.exit(1);
  }
  
  const config = getConfig();
  
  // Get parameters from program or CLI
  let metric: string;
  let targetScore: number;
  let targetFile: string;
  let metricCommand: string;
  let constraints: string[] = [];
  
  if (values.program) {
    const program = parseProgram(values.program as string);
    metric = values.metric as string || program.goal?.toLowerCase().replace(/[^a-z]/g, "") || "score";
    targetScore = parseInt(values.target as string || program.target || "85");
    targetFile = values.file as string || program.targetFiles?.[0] || "";
    metricCommand = program.metricCommand || `echo 0`;
    constraints = program.constraints?.split("\n").map(l => l.replace(/^- /, "").trim()).filter(Boolean) || [];
  } else {
    metric = values.metric as string || "score";
    targetScore = parseInt(values.target as string || "85");
    targetFile = values.file as string || "";
    metricCommand = values.metric as string 
      ? `bun ${dirname(dirname(import.meta.path))}/codeboros-introspect/scripts/introspect.ts --project "${projectPath}" --metric ${values.metric} --json`
      : "echo 0";
  }
  
  if (!targetFile) {
    console.error("Target file required. Use --file or provide program.md");
    process.exit(1);
  }
  
  const filePath = resolve(projectPath, targetFile);
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  // Baseline score
  let baselineScore = getScoreFromCommand(metricCommand, projectPath);
  let currentScore = baselineScore;
  let attempts = 0;
  let bestScore = baselineScore;
  let bestContent = readFileSync(filePath, "utf-8");
  
  if (!values.json) {
    console.log(`\n🔄 Autofix Loop`);
    console.log(`   Metric: ${metric}`);
    console.log(`   Target: ${targetScore}%`);
    console.log(`   File: ${targetFile}`);
    console.log(`   Baseline: ${baselineScore}%`);
    console.log(`   Provider: ${config.provider}\n`);
  }
  
  // Iterative improvement loop
  while (attempts < maxAttempts && currentScore < targetScore) {
    attempts++;
    
    if (!values.json) {
      console.log(`Attempt ${attempts}/${maxAttempts} — Current: ${currentScore}%`);
    }
    
    const currentContent = readFileSync(filePath, "utf-8");
    
    // Generate fix
    let proposal;
    try {
      proposal = await generateFix(
        { metric, targetScore, constraints },
        targetFile,
        currentContent,
        metric,
        targetScore
      );
    } catch (error: any) {
      if (!values.json) console.log(`  ❌ LLM error: ${error.message}`);
      continue;
    }
    
    if (!values.json) {
      console.log(`  📝 ${proposal.description.slice(0, 60)}...`);
    }
    
    // Apply fix (simplified - just replace content for now)
    if (proposal.files?.[0]?.changes?.[0]?.newContent) {
      // Smart apply - try to integrate the new content
      const change = proposal.files[0].changes[0];
      let newContent = currentContent;
      
      if (change.type === "replace" && change.oldContent) {
        newContent = currentContent.replace(change.oldContent, change.newContent);
      } else if (change.type === "insert") {
        if (change.location?.after) {
          const idx = currentContent.indexOf(change.location.after);
          if (idx !== -1) {
            newContent = currentContent.slice(0, idx + change.location.after.length) 
              + "\n" + change.newContent 
              + currentContent.slice(idx + change.location.after.length);
          }
        } else {
          // Append at end
          newContent = currentContent + "\n" + change.newContent;
        }
      } else {
        // Direct content replacement
        newContent = change.newContent;
      }
      
      writeFileSync(filePath, newContent);
    }
    
    // Re-measure
    const newScore = getScoreFromCommand(metricCommand, projectPath);
    
    if (!values.json) {
      console.log(`  📊 Score: ${newScore}% (${newScore >= currentScore ? "↑" : "↓"}${Math.abs(newScore - currentScore)}%)`);
    }
    
    // Check for improvement
    if (newScore > currentScore) {
      currentScore = newScore;
      if (newScore > bestScore) {
        bestScore = newScore;
        bestContent = readFileSync(filePath, "utf-8");
      }
    } else if (!noRevert && newScore < currentScore) {
      // Revert on regression
      writeFileSync(filePath, currentContent);
      if (!values.json) console.log(`  ↩️  Reverted (regression)`);
    }
    
    // Check if target reached
    if (currentScore >= targetScore) {
      if (!values.json) console.log(`\n✅ Target reached!`);
      break;
    }
  }
  
  // Restore best result
  if (bestScore > baselineScore && currentScore < bestScore) {
    writeFileSync(filePath, bestContent);
    currentScore = bestScore;
  }
  
  const result = {
    success: currentScore >= targetScore,
    metric,
    baselineScore,
    finalScore: currentScore,
    bestScore,
    targetScore,
    attempts,
    delta: currentScore - baselineScore,
    provider: config.provider,
    model: config.model,
  };
  
  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n📊 Final: ${currentScore}% (Δ ${currentScore - baselineScore >= 0 ? "+" : ""}${currentScore - baselineScore}%)`);
    console.log(`   Attempts: ${attempts}\n`);
  }
  
  process.exit(currentScore >= targetScore ? 0 : 1);
}

main().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
