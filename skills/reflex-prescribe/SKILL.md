---
name: reflex-prescribe
description: Auto-generates improvement prescriptions from introspect scorecard. Maps weakest metric to one of 14 playbooks. Governor safety gate for high-risk changes.
---

# Reflex Prescribe

Your code's immune response.

Takes the introspection scorecard and generates a targeted improvement prescription. Maps the weakest metric to a proven playbook and outputs an executable seed spec.

## Usage

```bash
# From introspection output
bun reflex introspect --json > scorecard.json
bun reflex prescribe --scorecard scorecard.json

# List available playbooks
bun reflex prescribe --list-playbooks
```

## Output

```
╔════════════════════════════════════════════════════════╗
║  REFLEX PRESCRIPTION                                    ║
╠════════════════════════════════════════════════════════╣
║  Target: testCoverage (45% → 80%)                      ║
║  Playbook: C (Test Coverage Expansion)                  ║
║  Severity: WARNING                                      ║
║  Approval: Not required                                 ║
╠════════════════════════════════════════════════════════╣
║  SEED SPECIFICATION                                     ║
║  ───────────────────────────────────────────────────    ║
║  goal: "Increase test coverage to 80%"                  ║
║  target_files: ["src/**/*.ts"]                          ║
║  constraints:                                           ║
║    - No changes to production logic                     ║
║    - Use existing test patterns                         ║
║    - Focus on uncovered branches first                  ║
║  metric_command: "bun reflex introspect --metric"       ║
╚════════════════════════════════════════════════════════╝
```

## 14 Playbooks

| ID | Playbook | Metric | Auto-Approve |
|----|----------|--------|--------------|
| A | Type Coverage Expansion | typeSafety | Yes |
| B | Strict Mode Migration | typeSafety | ⚠️ No |
| C | Test Coverage Expansion | testCoverage | Yes |
| D | Critical Path Testing | testCoverage | ⚠️ No |
| E | Complexity Reduction | codeComplexity | Yes |
| F | Architecture Refactor | codeComplexity | ⚠️ No |
| G | Dependency Updates | dependencyHealth | Yes |
| H | Major Version Migration | dependencyHealth | ⚠️ No |
| I | Security Patch | securityVulns | Yes |
| J | Security Overhaul | securityVulns | ⚠️ No |
| K | Lint Rule Fixes | codeConsistency | Yes |
| L | Formatter Migration | codeConsistency | ⚠️ No |
| M | Build Optimization | buildPerformance | Yes |
| N | Bundle Size Reduction | buildPerformance | ⚠️ No |

⚠️ = Requires human approval (governor blocks autonomous execution)
