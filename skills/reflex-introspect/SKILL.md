---
name: reflex-introspect
description: Self-diagnostic code quality scorecard across 7 system metrics. Measures type safety, test coverage, complexity, security, dependencies, and more. Outputs composite health score 0-100.
---

# Reflex Introspect

Your code's pulse check.

Runs comprehensive health diagnostics across 7 metrics and outputs a composite scorecard. Identifies the weakest area needing attention.

## Usage

```bash
# Full introspection
bun reflex introspect --project ./my-app

# Specific metric
bun reflex introspect --metric typeSafety --project ./my-app

# JSON output for scripting
bun reflex introspect --json > scorecard.json
```

## 7 Health Metrics

| Metric | What It Measures | Target |
|--------|------------------|--------|
| Type Safety | TypeScript strict compliance | 90% |
| Test Coverage | Line/branch coverage | 80% |
| Code Complexity | Cyclomatic complexity | ≤15 |
| Security Vulnerabilities | Known CVEs in deps | 0 |
| Dependency Health | Outdated/vulnerable packages | 100% |
| Code Consistency | Lint violations, formatting | 95% |
| Build Performance | Build time, bundle size | Stable |

## Output

```
╔════════════════════════════════════════════════════════╗
║  REFLEX INTROSPECTION SCORECARD                         ║
╠════════════════════════════════════════════════════════╣
║  ✅ typeSafety         92% → score:100%                 ║
║  ⚠️  testCoverage      45% → score: 56%                 ║
║  ✅ codeComplexity     12  → score:100%                 ║
║  ✅ securityVulns       0  → score:100%                 ║
║  ⚠️  dependencyHealth  67% → score: 74%                 ║
║  ✅ codeConsistency    98% → score:100%                 ║
║  ✅ buildPerformance   2.1s → score:100%                ║
╠════════════════════════════════════════════════════════╣
║  COMPOSITE HEALTH: 76/100                               ║
║  Weakest: testCoverage                                  ║
╚════════════════════════════════════════════════════════╝
```
