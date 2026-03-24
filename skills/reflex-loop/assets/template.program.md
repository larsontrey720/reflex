# {Program Name}

## Goal
{Describe the optimization goal in one sentence}

## Metric Command
```bash
bun Skills/codeboros-introspect/scripts/introspect.ts --metric {metricName} --json
```

## Target
{target_value}

## Target Files
- src/**/*.ts
- {additional patterns}

## Constraints
- {constraint 1}
- {constraint 2}
- No breaking changes to public API

## Max Iterations
{max_iterations}

## Success Criteria
- {criterion 1}
- {criterion 2}
- All tests passing

---

## Notes for Autofix Loop

The autofix loop will:
1. Measure current metric value
2. Identify improvement opportunity
3. Apply fix (or preview in dry-run)
4. Run verification (tests, lint, build)
5. Measure new metric value
6. Repeat until target reached or max iterations

### Available Metrics
- `typeSafety` - TypeScript strict compliance
- `testCoverage` - Line/branch coverage
- `codeComplexity` - Cyclomatic complexity
- `dependencyHealth` - CVE count, outdated deps
- `errorHandling` - Error handling coverage
- `codeConsistency` - Lint violations
- `buildPerformance` - Build time, bundle size