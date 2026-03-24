# LLM Configuration Guide

Codeboros supports multiple LLM providers through a unified interface.

## Quick Setup

### Option 1: Zo Computer (Native)

When running inside Zo Computer, the system automatically uses Zo's internal API:

```bash
# No configuration needed - uses your current model
export CODEBOROS_LLM_PROVIDER=zo
```

The `ZO_CLIENT_IDENTITY_TOKEN` is automatically available in Zo's environment.

### Option 2: OpenAI / OpenAI-Compatible

```bash
export CODEBOROS_LLM_PROVIDER=openai
export CODEBOROS_LLM_API_KEY=sk-...
export CODEBOROS_LLM_MODEL=gpt-4o

# Or use a custom endpoint (Together, Groq, Cerebras, etc.)
export CODEBOROS_LLM_ENDPOINT=https://api.together.xyz/v1
export CODEBOROS_LLM_MODEL=meta-llama/Llama-3-70b-chat-hf
```

### Option 3: Anthropic Claude

```bash
export CODEBOROS_LLM_PROVIDER=anthropic
export CODEBOROS_LLM_API_KEY=sk-ant-...
export CODEBOROS_LLM_MODEL=claude-sonnet-4-20250514
```

### Option 4: Ollama (Local)

```bash
export CODEBOROS_LLM_PROVIDER=ollama
export CODEBOROS_LLM_MODEL=qwen2.5:7b

# Optional: custom endpoint
export OLLAMA_HOST=http://localhost:11434
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `CODEBOROS_LLM_PROVIDER` | `openai` | Provider: `openai`, `anthropic`, `ollama`, `zo` |
| `CODEBOROS_LLM_API_KEY` | - | API key for external providers |
| `CODEBOROS_LLM_MODEL` | `gpt-4o` | Model identifier |
| `CODEBOROS_LLM_ENDPOINT` | OpenAI API | Custom OpenAI-compatible endpoint |
| `CODEBOROS_LLM_MAX_TOKENS` | `4096` | Max generation tokens |
| `CODEBOROS_LLM_TEMPERATURE` | `0.2` | Generation temperature (low for code) |

### Zo-Specific

| Variable | Description |
|----------|-------------|
| `ZO_CLIENT_IDENTITY_TOKEN` | Auto-set in Zo environment |
| `CODEBOROS_ZO_MODEL` | Model for Zo API (default: your current model) |

## Testing Configuration

```bash
# Check current config
bun Skills/codeboros-evolve/lib/llm-client.ts --config

# Test connection
bun Skills/codeboros-evolve/lib/llm-client.ts --test

# Send a prompt
bun Skills/codeboros-evolve/lib/llm-client.ts --prompt "Write a TypeScript hello world"
```

## Provider Comparison

| Provider | Speed | Cost | Code Quality | Privacy |
|----------|-------|------|--------------|---------|
| **GPT-4o** | Fast | $$ | Excellent | Cloud |
| **Claude Sonnet** | Fast | $$ | Excellent | Cloud |
| **Together/Groq** | Very fast | $ | Good | Cloud |
| **Ollama (local)** | Depends on hardware | Free | Good | Local |
| **Zo API** | Medium | Included | Good | Cloud |

## Recommended Models by Task

| Task | Recommended Model | Why |
|------|-------------------|-----|
| **Type safety fixes** | Claude Sonnet | Best at understanding TypeScript nuances |
| **Test generation** | GPT-4o | Fast, good at boilerplate |
| **Complexity reduction** | Claude Sonnet | Better at refactoring logic |
| **Dependency updates** | GPT-4o | Good at API migrations |
| **Quick iterations** | Ollama qwen2.5:7b | Free, runs locally |

## Cost Estimation

Assuming 1000 fix attempts per month, ~500 tokens each:

| Provider | Monthly Cost |
|----------|--------------|
| GPT-4o | ~$5 |
| Claude Sonnet | ~$4 |
| Together (Llama-3-70B) | ~$1 |
| Groq (Llama-3-70B) | Free tier |
| Ollama | Free |
| Zo API | Included |
