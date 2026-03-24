# LLM Configuration Guide

Reflex supports multiple LLM providers through a unified interface.

## Quick Setup

### Option 1: Zo Computer (Native)

When running inside Zo Computer, the system automatically uses the native `/zo/ask` API. No configuration needed.

### Option 2: BYO-Model (Any Environment)

Set environment variables for your provider:

## Provider Examples

### OpenAI

```bash
# GPT-5.4 (Latest flagship - March 2026)
export REFLEX_LLM_PROVIDER=openai
export REFLEX_LLM_API_KEY=sk-xxx
export REFLEX_LLM_MODEL=gpt-5.4

# GPT-5.4 Pro (Enhanced reasoning)
export REFLEX_LLM_MODEL=gpt-5.4-pro

# GPT-5.4 Thinking (Extended reasoning chain)
export REFLEX_LLM_MODEL=gpt-5.4-thinking

# GPT-5.4 mini (Fast, efficient)
export REFLEX_LLM_MODEL=gpt-5.4-mini

# GPT-5.4 nano (Ultra-fast, lightweight)
export REFLEX_LLM_MODEL=gpt-5.4-nano

# GPT-5.3-Codex (Specialized coding model)
export REFLEX_LLM_MODEL=gpt-5.3-codex
```

### Anthropic

```bash
# Claude Opus 4.6 (Flagship - February 2026)
export REFLEX_LLM_PROVIDER=anthropic
export REFLEX_LLM_API_KEY=sk-ant-xxx
export REFLEX_LLM_MODEL=claude-opus-4-6

# Claude Sonnet 4.6 (Balanced performance)
export REFLEX_LLM_MODEL=claude-sonnet-4-6

# Claude Code (Optimized for coding tasks)
export REFLEX_LLM_MODEL=claude-code
```

### Ollama (Local)

```bash
# Qwen 3.5 Series (March 2026)
export REFLEX_LLM_PROVIDER=ollama
export REFLEX_LLM_MODEL=qwen3.5:9b      # Small, runs on laptop
export REFLEX_LLM_MODEL=qwen3.5:27b     # Medium
export REFLEX_LLM_MODEL=qwen3.5:35b     # Medium-large
export REFLEX_LLM_MODEL=qwen3.5:122b    # Large

# Other local options
export REFLEX_LLM_MODEL=llama3.3:70b
export REFLEX_LLM_MODEL=deepseek-r1:32b
```

### Custom Endpoint (OpenAI-Compatible)

```bash
export REFLEX_LLM_PROVIDER=custom
export REFLEX_LLM_ENDPOINT=https://my-api.com/v1
export REFLEX_LLM_API_KEY=xxx
export REFLEX_LLM_MODEL=my-model-name
```

## Model Selection Guide

| Use Case | Recommended Model |
|----------|-------------------|
| Complex refactoring | Claude Opus 4.6, GPT-5.4 Pro |
| Fast fixes at scale | GPT-5.4 nano, Qwen 3.5 9B |
| Local/air-gapped | Qwen 3.5 27B (Ollama) |
| Budget-conscious | GPT-5.4 mini, Qwen 3.5 9B |
| Maximum quality | Claude Opus 4.6 |

## Configuration Priority

1. Zo native (`/zo/ask`) — auto-detected if `ZO_CLIENT_IDENTITY_TOKEN` exists
2. Environment variables (`REFLEX_LLM_*`)
3. `.env` file in project root

## Testing Connection

```bash
# Verify your LLM is configured
reflex config --check

# Test a simple query
reflex config --test
```
