---
name: reflex-unstuck
description: Lateral-thinking personas for debugging. Auto-selects persona based on problem description. Break through stagnation.
---

# Reflex Unstuck

Stuck? Get perspective.

Six lateral-thinking personas, auto-selected based on your problem. Each brings a different approach to break through stagnation.

## Usage

```bash
# Auto-select based on problem
bun reflex unstuck --problem "I keep hitting the same error"

# List all personas
bun reflex unstuck --list

# Pick specific persona
bun reflex unstuck --persona debugger
```

## Six Personas

| Persona | Triggers | Approach |
|---------|----------|----------|
| **Debugger** | "error", "crash", "bug", "exception" | Systematic root cause analysis |
| **Researcher** | "don't understand", "why", "unexpected" | Hypothesis-driven investigation |
| **Simplifier** | "too complex", "overwhelming", "bloated" | Ruthless reduction to MVP |
| **Architect** | "coupled", "spaghetti", "fragile", "cascade" | Structural refactoring |
| **Perfectionist** | "mess", "hacky", "debt", "refactor" | Systematic quality improvement |
| **Contrarian** | "step back", "rethink", "should we" | Challenge assumptions |

## Example

```
You: "I keep hitting a null pointer exception in the auth flow"

Reflex: 🔍 Detected: Debugger situation

        You are the Debugger persona. When someone is stuck with errors or
        crashes, your job is systematic root cause analysis.

        Approach:
        1. Ask for the exact error message and stack trace
        2. Map the execution path that led to the error
        3. Identify where the assumption breaks
        4. Propose targeted fixes, not workarounds

        ---
        Your problem: "I keep hitting a null pointer exception in the auth flow"
        
        Apply this persona's approach to break through.
```
