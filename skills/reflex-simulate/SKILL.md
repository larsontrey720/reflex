---
name: reflex-simulate
description: Simulate how code changes behave before merge. Predicts breakages, edge cases, and production issues using codebase analysis and historical patterns.
version: "1.0.0"
---

# Reflex Simulate

Pre-merge simulation engine. Predicts what breaks before you ship.

## What It Does

Before merge, Reflex Simulate:
1. Analyzes your diff against codebase patterns
2. Cross-references with historical incidents
3. Simulates production behavior scenarios
4. Flags specific breakages: "this change will break checkout for legacy users"

## Usage

```bash
# Simulate current uncommitted changes
reflex simulate

# Simulate a PR before merge
reflex simulate --pr 42

# Simulate a branch against main
reflex simulate --branch feature/auth --against main

# JSON output for CI gates
reflex simulate --json
```

## Output

```
═ REFLEX SIMULATION RESULTS ═

Analyzing: 3 files changed, +127/-45 lines

┌─ SCENARIO RUNS ─────────────────────────────┐
│                                              │
│  ✓ Happy path: User login                   │
│    → Passes                                  │
│                                              │
│  ✓ Happy path: Password reset               │
│    → Passes                                  │
│                                              │
│  ⚠ Edge case: SSO re-auth after timeout     │
│    → BLOCKED: Session not cleared properly  │
│    → Line 47: auth.ts                       │
│                                              │
│  ⚠ Edge case: Legacy config users           │
│    → RISK: Config schema mismatch           │
│    → Affects: 12% of user base              │
│                                              │
│  ✓ Admin permission escalation              │
│    → Passes                                  │
│                                              │
└──────────────────────────────────────────────┘

RISK SCORE: 34/100 (MEDIUM)

2 issues found:
  1. [HIGH] SSO re-auth may leave stale sessions
     → Fix: Add session.clear() before reauth
     → Confidence: 87%
  
  2. [MEDIUM] Legacy config users may see errors
     → Fix: Add config migration step
     → Confidence: 62%

RECOMMENDATION: Fix HIGH issue before merge.
               MEDIUM can be addressed post-merge.

════════════════════════════════════════════════
```

## How It Works

1. **Pattern Extraction** — Learns from your codebase how features behave
2. **Historical Analysis** — Checks past incidents for similar changes
3. **Scenario Generation** — Creates test scenarios based on diff
4. **Simulation** — Runs scenarios against the proposed change
5. **Risk Scoring** — Calculates probability of breakage

## CI/CD Integration

```yaml
# .github/workflows/reflex-simulate.yml
name: Reflex Simulation Gate

on: pull_request

jobs:
  simulate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bunx reflex simulate --pr ${{ github.event.pull_request.number }} --json > results.json
      - name: Check simulation results
        run: |
          RISK=$(cat results.json | jq -r '.riskScore')
          if [ "$RISK" -gt 50 ]; then
            echo "Simulation risk too high: $RISK"
            exit 1
          fi
```

## Configuration

```yaml
# .reflex.yml
simulation:
  # Minimum scenarios to run
  minScenarios: 5
  
  # Fail CI if risk score above threshold
  maxRiskScore: 50
  
  # Scenarios to always include
  requiredScenarios:
    - authentication
    - authorization
    - data-persistence
  
  # Ignore certain patterns
  ignorePatterns:
    - "*.test.ts"
    - "*.spec.ts"
```