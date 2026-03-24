# Metric Thresholds

Target values and calibration guide for Codeboros introspection metrics.

## Current Thresholds

| Metric | Target | Warning | Critical | Weight |
|--------|--------|---------|----------|--------|
| **Type Safety** | ≥ 90% | 75-90% | < 75% | 0.16 |
| **Test Coverage** | ≥ 80% | 60-80% | < 60% | 0.18 |
| **Code Complexity** | ≤ 10 avg | 10-15 | > 15 | 0.14 |
| **Dependency Health** | 100% | 80-100% | < 80% | 0.12 |
| **Error Handling** | ≥ 85% | 70-85% | < 70% | 0.14 |
| **Code Consistency** | 100% | 80-100% | < 80% | 0.12 |
| **Build Performance** | Stable | +15% | +30%+ | 0.14 |

## Score Calculation

```
score = 
  if value meets target: 100
  else if value in warning range: 70
  else: 30

composite = Σ(metric_score × weight)
```

## Metric Definitions

### Type Safety
- **Source**: TypeScript strict mode compliance, type coverage percentage
- **Measurement**: Count typed vs untyped positions, run `tsc --noEmit`
- **Lower is Better**: No (higher = better)

**Calculation**:
```
typeSafety = (typed_positions / total_positions) × 100
```

**Targets**:
- All functions have return types
- All parameters have types
- No `any` usage
- Strict mode enabled

---

### Test Coverage
- **Source**: Line/branch coverage from test runner, mutation testing score
- **Measurement**: Istanbul/nyc coverage report
- **Lower is Better**: No

**Calculation**:
```
testCoverage = (covered_lines / total_lines) × 100
```

**Targets**:
- Line coverage ≥ 80%
- Branch coverage ≥ 70%
- All critical paths tested

---

### Code Complexity
- **Source**: Cyclomatic complexity, cognitive complexity
- **Measurement**: ESLint complexity rules, custom analysis
- **Lower is Better**: Yes

**Calculation**:
```
codeComplexity = average_cyclomatic_complexity
```

**Targets**:
- Average complexity ≤ 10
- No function > 20 complexity
- Cognitive complexity ≤ 15

---

### Dependency Health
- **Source**: CVE count from npm audit, outdated package ratio
- **Measurement**: npm audit, npm outdated
- **Lower is Better**: No

**Calculation**:
```
dependencyHealth = 100 - (cve_count × 30) - (outdated_ratio × 20)
```

**Targets**:
- 0 CVEs in production dependencies
- < 20% packages outdated
- No deprecated packages

---

### Error Handling
- **Source**: Try-catch coverage, uncaught exception rate
- **Measurement**: Static analysis of error patterns
- **Lower is Better**: No

**Calculation**:
```
errorHandling = (handled_exceptions / total_risky_operations) × 100
```

**Targets**:
- All async operations have try-catch
- All external calls have error handling
- Error types defined for each error class

---

### Code Consistency
- **Source**: Lint violations, formatting issues
- **Measurement**: ESLint, Prettier check
- **Lower is Better**: No

**Calculation**:
```
codeConsistency = 100 - (lint_errors × 5) - (lint_warnings × 2)
```

**Targets**:
- 0 ESLint errors
- 0 ESLint warnings
- All files formatted consistently

---

### Build Performance
- **Source**: Build time trend, bundle size trend
- **Measurement**: Build timing, bundle analysis
- **Lower is Better**: No (time: yes, but score inverted)

**Calculation**:
```
buildPerformance = 
  if build_time_trending_down: 100
  else if stable: 80
  else: 100 - (increase_percentage × 2)
```

**Targets**:
- Build time stable or improving
- Bundle size within budget
- No memory issues during build

---

## Calibration Guide

### When to Tighten Thresholds
- Composite score > 90 for 2+ consecutive weeks
- No critical playbooks triggered in 30 days
- User requests higher quality bar

### When to Loosen Thresholds
- Composite score < 50 for 3+ consecutive runs
- Same playbook triggering repeatedly without improvement
- Project in early development phase

### Adding New Thresholds
1. Define metric name and measurement method
2. Set target based on industry benchmarks
3. Set warning/critical ranges (±15% from target)
4. Assign weight (must sum to 1.0 across all metrics)
5. Update `introspect.ts` with collector function
6. Add corresponding playbooks

---

## Historical Adjustment Rules

The system auto-calibrates based on history:

```typescript
// If composite > 90 for 2 weeks, tighten by 5%
if (avgComposite > 90 && weeksSinceAdjustment >= 2) {
  targets = targets.map(t => t * 1.05);
}

// If composite < 50 for 3 runs, loosen by 10%
if (avgComposite < 50 && runsSinceAdjustment >= 3) {
  targets = targets.map(t => t * 0.9);
}
```

---

## Override Commands

```bash
# Manually set threshold
bun introspect.ts --set-threshold typeSafety=95

# View current thresholds
bun introspect.ts --show-thresholds

# Reset to defaults
bun introspect.ts --reset-thresholds
```