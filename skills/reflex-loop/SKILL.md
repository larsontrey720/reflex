---
name: reflex-loop
description: Autonomous single-metric code optimization loop. Iteratively improves code until target metric reached or max attempts. Uses LLM to generate targeted fixes.
---

# Reflex Loop

Iterate until better.

Single-metric optimization engine. Given a target metric and threshold, it repeatedly generates and applies fixes until the goal is reached or attempts exhausted.

## Usage

```bash
# Loop on specific metric
bun reflex loop --metric testCoverage --target 80 --project ./my-app

# With constraints
bun reflex loop --metric typeSafety --target 95 \
  --constraint "no type: any" \
  --constraint "preserve runtime behavior"
```

## How It Works

1. **Measure** — Run metric, capture current value
2. **Plan** — LLM generates targeted fix for specific files
3. **Apply** — Write the fix to target files
4. **Verify** — Re-run metric, check improvement
5. **Loop** — If not at target, iterate

Each iteration is logged. If a fix causes regression, it's reverted and the loop continues with a different approach.

## Configuration

```bash
# LLM Provider (required for fix generation)
export REFLEX_LLM_PROVIDER=openai
export REFLEX_LLM_API_KEY=sk-...

# Or use Zo native (auto-detected)
# No config needed when running in Zo Computer
```
