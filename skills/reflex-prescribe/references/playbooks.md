# Codeboros Playbooks

Complete playbook definitions for code quality remediation.

## Playbook Registry

### Type Safety Playbooks

#### Playbook A: Type Coverage Expansion
- **Metric**: `typeSafety`
- **Severity**: WARNING
- **Approval Required**: No
- **Trigger**: Type safety score 70-85%

**Description**: Add explicit types to untyped code paths. Focus on function return types, interface definitions, and generic constraints.

**Steps**:
1. Run type coverage analysis
2. Identify files with lowest coverage
3. Add return types to all functions
4. Type all function parameters
5. Add generic constraints where needed
6. Run TypeScript compiler
7. Verify no new errors

**Constraints**:
- No use of `any` type (use `unknown` if type truly unknown)
- Maintain backward compatibility
- No breaking changes to public API

**Target Files**: `src/**/*.ts`

**Verification**:
```bash
tsc --noEmit
# Type safety score should increase
```

---

#### Playbook B: Strict Mode Migration
- **Metric**: `typeSafety`
- **Severity**: CRITICAL
- **Approval Required**: No
- **Trigger**: Type safety score < 70%

**Description**: Enable all TypeScript strict mode flags and fix resulting errors. Most impactful for codebase quality.

**Steps**:
1. Enable `strict: true` in tsconfig
2. Enable `noImplicitAny: true`
3. Enable `strictNullChecks: true`
4. Enable `noUncheckedIndexedAccess: true`
5. Run compiler and fix all errors
6. Add null checks where needed
7. Update tests for new behavior

**Constraints**:
- No `@ts-ignore` or `@ts-expect-error`
- No `as any` casts
- All null/undefined paths must be handled

**Target Files**: `tsconfig.json`, `src/**/*.ts`

---

### Test Coverage Playbooks

#### Playbook C: Test Suite Growth
- **Metric**: `testCoverage`
- **Severity**: WARNING
- **Approval Required**: No
- **Trigger**: Test coverage 60-80%

**Description**: Add unit and integration tests to uncovered code paths.

**Steps**:
1. Run coverage report
2. Identify uncovered lines/branches
3. Write unit tests for pure functions
4. Write integration tests for side effects
5. Focus on edge cases
6. Run full test suite
7. Verify coverage increase

**Constraints**:
- No skipped tests (`it.skip`)
- Meaningful assertions required
- Test behavior, not implementation

**Target Files**: `src/**/*.test.ts`, `src/**/*.spec.ts`

---

#### Playbook D: Mutation Testing Setup
- **Metric**: `testCoverage`
- **Severity**: CRITICAL
- **Approval Required**: No
- **Trigger**: Test coverage > 80% but low quality

**Description**: Set up mutation testing to verify test quality, not just coverage.

**Steps**:
1. Install Stryker or similar framework
2. Configure mutant generators
3. Identify mutation targets
4. Run mutation analysis
5. Fix tests to kill survivors
6. Document ignored mutants
7. Add to CI pipeline

**Constraints**:
- Mutation score target ≥ 80%
- Document all ignored mutants
- CI integration required

---

### Code Complexity Playbooks

#### Playbook E: Complexity Reduction
- **Metric**: `codeComplexity`
- **Severity**: WARNING
- **Approval Required**: No
- **Trigger**: Average cyclomatic complexity 10-15

**Description**: Reduce complexity in identified hotspots by extracting functions and simplifying conditionals.

**Steps**:
1. Run complexity analysis
2. Identify functions with complexity > 15
3. Extract helper functions
4. Simplify nested conditionals
5. Use guard clauses
6. Reduce branch count
7. Verify tests pass

**Constraints**:
- No behavior changes
- Maintain test coverage
- Keep functions single-purpose

---

#### Playbook F: Architectural Refactor
- **Metric**: `codeComplexity`
- **Severity**: CRITICAL
- **Approval Required**: ⚠️ YES
- **Trigger**: High coupling, complexity > 15 average

**Description**: Structural refactoring of high-coupling areas. Requires human approval due to blast radius.

**Steps**:
1. Map current dependency graph
2. Identify coupling hotspots
3. Design module boundaries
4. Extract interfaces
5. Migrate dependencies
6. Update imports across codebase
7. Run full integration tests

**Constraints**:
- Preserve public API
- Add integration tests before refactor
- Document architectural decisions

**⚠️ Governor requires human approval**

---

### Dependency Health Playbooks

#### Playbook G: Dependency Update
- **Metric**: `dependencyHealth`
- **Severity**: WARNING
- **Approval Required**: No
- **Trigger**: Outdated dependencies > 20%

**Description**: Update outdated dependencies to latest compatible versions.

**Steps**:
1. Run `npm outdated`
2. Update minor/patch versions
3. Run full test suite
4. Check for deprecation warnings
5. Update lockfile
6. Document changes

**Constraints**:
- Minor versions only (no major bumps)
- No breaking changes
- Full test suite must pass

---

#### Playbook H: Security Patch
- **Metric**: `dependencyHealth`
- **Severity**: CRITICAL
- **Approval Required**: ⚠️ YES
- **Trigger**: CVEs detected in dependencies

**Description**: Patch security vulnerabilities in production dependencies.

**Steps**:
1. Run `npm audit`
2. Apply `npm audit fix`
3. Review breaking changes
4. Update code if needed
5. Run full test suite
6. Verify `npm audit` returns 0
7. Update lockfile

**Constraints**:
- No feature regressions
- Document all changes
- Security review required for major bumps

**⚠️ Governor requires human approval**

---

### Error Handling Playbooks

#### Playbook I: Error Handler Addition
- **Metric**: `errorHandling`
- **Severity**: WARNING
- **Approval Required**: No
- **Trigger**: Error handling score 70-85%

**Description**: Add try-catch blocks to unhandled exception paths.

**Steps**:
1. Identify unhandled async functions
2. Add try-catch around risky operations
3. Implement error logging
4. Add recovery logic where possible
5. Update error types
6. Test failure scenarios

**Constraints**:
- No silent catches (always log)
- Preserve error context
- Implement recovery where possible

---

#### Playbook J: Error Boundary Implementation
- **Metric**: `errorHandling`
- **Severity**: CRITICAL
- **Approval Required**: No
- **Trigger**: Error handling score < 70%

**Description**: Implement comprehensive error boundaries across all layers.

**Steps**:
1. Define error boundary interfaces
2. Implement API layer boundary
3. Implement service layer boundary
4. Implement UI layer boundary
5. Add error monitoring
6. Test all failure modes
7. Document error handling strategy

**Constraints**:
- Graceful degradation required
- User notification for critical errors
- All errors must be logged

---

### Code Consistency Playbooks

#### Playbook K: Lint Rule Fix
- **Metric**: `codeConsistency`
- **Severity**: WARNING
- **Approval Required**: No
- **Trigger**: Lint violations 1-50

**Description**: Fix all ESLint warnings and errors.

**Steps**:
1. Run `npx eslint .`
2. Apply `--fix` for auto-fixable issues
3. Manually fix remaining issues
4. Run full test suite
5. Verify zero warnings

**Constraints**:
- No `eslint-disable` comments
- No `eslint-disable-next-line`
- All fixes must maintain functionality

---

#### Playbook L: Codebase Standardization
- **Metric**: `codeConsistency`
- **Severity**: CRITICAL
- **Approval Required**: ⚠️ YES
- **Trigger**: Inconsistent code style across codebase

**Description**: Standardize code style and add enforcement mechanisms.

**Steps**:
1. Define style guide with team
2. Configure Prettier
3. Configure ESLint rules
4. Run formatter on all files
5. Set up pre-commit hooks
6. Add CI checks
7. Document style guide

**Constraints**:
- Team agreement required
- Pre-commit enforcement
- CI integration required

**⚠️ Governor requires human approval**

---

### Build Performance Playbooks

#### Playbook M: Build Optimization
- **Metric**: `buildPerformance`
- **Severity**: WARNING
- **Approval Required**: No
- **Trigger**: Build time increased > 30%

**Description**: Optimize build performance through caching and parallelization.

**Steps**:
1. Profile build with timing
2. Enable build caching
3. Parallelize independent tasks
4. Optimize TypeScript compilation
5. Reduce bundle analysis overhead
6. Test build time improvement

**Constraints**:
- Same output required
- No feature removal
- CI caching setup

---

#### Playbook N: Bundle Size Reduction
- **Metric**: `buildPerformance`
- **Severity**: CRITICAL
- **Approval Required**: ⚠️ YES
- **Trigger**: Bundle size > target by 20%+

**Description**: Reduce bundle size through code splitting and tree shaking.

**Steps**:
1. Analyze bundle with webpack-bundle-analyzer
2. Identify large dependencies
3. Implement code splitting
4. Enable tree shaking
5. Remove dead code
6. Lazy load non-critical features
7. Verify no runtime errors

**Constraints**:
- No feature removal
- Test all lazy-loaded paths
- Document bundle structure

**⚠️ Governor requires human approval**

---

## Governor Safety Rules

1. **Approval Gate**: Playbooks marked ⚠️ require human approval
2. **Blast Radius Limit**: Max 3 files modified per cycle
3. **Schema Protection**: Never touch database migrations
4. **Weight Bounds**: Can only change weights ±10% per cycle
5. **Regression Detection**: Any metric dropping >2% triggers revert
6. **Audit Trail**: Every cycle stored with full metadata