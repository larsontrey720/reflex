#!/usr/bin/env bun
/**
 * Reflex LLM Client - Multi-provider abstraction
 * 
 * Supports:
 * - OpenAI-compatible APIs (OpenAI, Together, Groq, Cerebras, etc.)
 * - Anthropic Claude API
 * - Ollama local endpoints
 * - Zo Computer's /zo/ask API (default when running in Zo)
 */

import { parseArgs } from "node:util";

// Detect default provider based on environment
function detectDefaultProvider(): "openai" | "anthropic" | "ollama" | "zo" {
  // If Zo token is present, use Zo by default
  if (process.env.ZO_CLIENT_IDENTITY_TOKEN) {
    return "zo";
  }
  if (process.env.REFLEX_LLM_PROVIDER) {
    return process.env.REFLEX_LLM_PROVIDER as "openai" | "anthropic" | "ollama" | "zo";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  if (process.env.OLLAMA_HOST || process.env.REFLEX_LLM_ENDPOINT?.includes("localhost")) {
    return "ollama";
  }
  return "openai";
}

// Configuration from environment
export function getConfig() {
  const provider = process.env.REFLEX_LLM_PROVIDER || detectDefaultProvider();

  const configs = {
    openai: {
      endpoint: process.env.REFLEX_LLM_ENDPOINT || process.env.OPENAI_API_BASE || "https://api.openai.com/v1",
      apiKey: process.env.REFLEX_LLM_API_KEY || process.env.OPENAI_API_KEY || "",
      model: process.env.REFLEX_LLM_MODEL || "gpt-4o",
    },
    anthropic: {
      endpoint: process.env.REFLEX_LLM_ENDPOINT || "https://api.anthropic.com/v1",
      apiKey: process.env.REFLEX_LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "",
      model: process.env.REFLEX_LLM_MODEL || "claude-sonnet-4-20250514",
    },
    ollama: {
      endpoint: process.env.REFLEX_LLM_ENDPOINT || process.env.OLLAMA_HOST || "http://localhost:11434",
      apiKey: "",
      model: process.env.REFLEX_LLM_MODEL || "qwen2.5:3b",
    },
    zo: {
      endpoint: process.env.REFLEX_LLM_ENDPOINT || "https://api.zo.computer/zo/ask",
      apiKey: process.env.ZO_CLIENT_IDENTITY_TOKEN || "",
      model: process.env.REFLEX_LLM_MODEL || "byok:8d5a353d-a103-4997-b8b5-5e306976a3d8",
    },
  };

  const config = configs[provider as keyof typeof configs] || configs.openai;
  
  return {
    provider,
    ...config,
    maxTokens: parseInt(process.env.REFLEX_LLM_MAX_TOKENS || "4096", 10),
    temperature: parseFloat(process.env.REFLEX_LLM_TEMPERATURE || "0.2"),
  };
}

// Check if LLM is configured
export function isConfigured(): boolean {
  const config = getConfig();
  
  // Zo and Ollama don't require API key
  if (config.provider === "zo" || config.provider === "ollama") {
    return !!config.apiKey;
  }
  
  return !!config.apiKey;
}

// Call LLM with prompt
export async function callLLM(prompt: string): Promise<string> {
  const config = getConfig();

  if (!isConfigured()) {
    throw new Error(`LLM not configured. Set REFLEX_LLM_PROVIDER and REFLEX_LLM_API_KEY, or run inside Zo Computer.`);
  }

  // Zo API format
  if (config.provider === "zo") {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "authorization": config.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        input: prompt,
        model_name: config.model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Zo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.output || data.content || "";
  }

  // Ollama API format
  if (config.provider === "ollama") {
    const response = await fetch(`${config.endpoint}/api/generate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || "";
  }

  // OpenAI-compatible API format
  const response = await fetch(`${config.endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${config.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Test connection
export async function testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
  const config = getConfig();

  try {
    const response = await callLLM("Reply with exactly: REFLEX_LLM_OK");
    
    if (response.includes("REFLEX_LLM_OK")) {
      return { success: true, message: "OK", model: config.model };
    }
    
    return { success: true, message: response.slice(0, 50), model: config.model };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

// Generate a fix for a code issue
export async function generateFix(
  issue: { file: string; line: number; message: string; code?: string },
  context?: { surroundingCode?: string }
): Promise<{ fix: string; explanation: string }> {
  const prompt = `You are a code fixer. Fix the following issue:

File: ${issue.file}
Line: ${issue.line}
Issue: ${issue.message}
${issue.code ? `Code: ${issue.code}` : ""}
${context?.surroundingCode ? `Context: ${context.surroundingCode}` : ""}

Respond in this exact format:
FIX: <the corrected code>
EXPLANATION: <brief explanation of the fix>`;

  const response = await callLLM(prompt);
  
  const fixMatch = response.match(/FIX:\s*([\s\S]*?)(?=EXPLANATION:|$)/i);
  const explanationMatch = response.match(/EXPLANATION:\s*([\s\S]*?)$/i);
  
  return {
    fix: fixMatch?.[1]?.trim() || response,
    explanation: explanationMatch?.[1]?.trim() || "No explanation provided",
  };
}

// CLI interface
if (import.meta.main) {
  const { values } = parseArgs({
    options: {
      config: { type: "boolean", default: false },
      test: { type: "boolean", default: false },
      prompt: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: false,
  });

  if (values.help) {
    console.log(`
Reflex LLM Client - Multi-provider LLM abstraction

Usage:
  bun llm-client.ts [options]

Options:
  --config              Show current configuration
  --test                Test LLM connection
  --prompt <text>       Send prompt to LLM
  -h, --help            Show this help

Environment:
  REFLEX_LLM_PROVIDER    Provider: openai, anthropic, ollama, zo
  REFLEX_LLM_API_KEY     API key for external providers
  REFLEX_LLM_MODEL       Model name override
  REFLEX_LLM_ENDPOINT    Custom endpoint URL
  REFLEX_LLM_MAX_TOKENS  Max tokens (default: 4096)
  REFLEX_LLM_TEMPERATURE Temperature (default: 0.2)

When running in Zo Computer:
  Automatically uses Zo's API with ZO_CLIENT_IDENTITY_TOKEN.
  No configuration needed.
`);
    process.exit(0);
  }

  if (values.config) {
    const config = getConfig();
    console.log("\n📦 Reflex LLM Configuration:\n");
    console.log(`Provider:    ${config.provider}`);
    console.log(`Model:       ${config.model}`);
    console.log(`Endpoint:    ${config.endpoint}`);
    console.log(`Configured:  ${isConfigured() ? "✅ Yes" : "❌ No API key"}`);
    console.log(`Max Tokens:  ${config.maxTokens}`);
    console.log(`Temperature: ${config.temperature}`);
    console.log();
    process.exit(0);
  }

  if (values.test) {
    console.log("\n🧪 Testing LLM connection...\n");
    const result = await testConnection();
    
    if (result.success) {
      console.log(`✅ ${getConfig().provider} responded: ${result.message}`);
      if (result.model) {
        console.log(`   Model: ${result.model}`);
      }
    } else {
      console.log(`❌ Connection failed: ${result.message}`);
      process.exit(1);
    }
    process.exit(0);
  }

  if (values.prompt) {
    const response = await callLLM(values.prompt as string);
    console.log(response);
    process.exit(0);
  }

  console.log("Run with --config, --test, or --prompt");
}
