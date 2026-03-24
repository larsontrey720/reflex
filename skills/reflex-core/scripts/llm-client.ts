#!/usr/bin/env bun
/**
 * Reflex LLM Client v2 - Context-aware LLM calls
 * 
 * INJECTS MEMORY + CONTEXT INTO EVERY CALL
 * This is what makes Reflex autonomous and self-aware
 */

import { parseArgs } from "node:util";

// Import context builder
import { 
  buildSystemContext, 
  buildPrompt, 
  loadMemory, 
  loadState,
  MemoryStore,
  ReflexState
} from "./context.ts";

// Detect default provider
function detectDefaultProvider(): "openai" | "anthropic" | "ollama" | "zo" {
  if (process.env.ZO_CLIENT_IDENTITY_TOKEN) return "zo";
  if (process.env.REFLEX_LLM_PROVIDER) {
    return process.env.REFLEX_LLM_PROVIDER as "openai" | "anthropic" | "ollama" | "zo";
  }
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OLLAMA_HOST || process.env.REFLEX_LLM_ENDPOINT?.includes("localhost")) {
    return "ollama";
  }
  return "openai";
}

// Configuration
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

export function isConfigured(): boolean {
  const config = getConfig();
  if (config.provider === "zo" || config.provider === "ollama") {
    return !!config.apiKey;
  }
  return !!config.apiKey;
}

/**
 * Call LLM with FULL CONTEXT INJECTION
 * This is the key function that makes Reflex autonomous
 */
export async function callLLMWithContext(
  task: string, 
  projectPath?: string,
  options?: { 
    includeMemory?: boolean;
    includeState?: boolean;
    includeGovernor?: boolean;
    customContext?: string;
  }
): Promise<string> {
  const config = getConfig();
  
  if (!isConfigured()) {
    throw new Error(`LLM not configured. Set REFLEX_LLM_PROVIDER and REFLEX_LLM_API_KEY.`);
  }
  
  // Build context-aware prompt
  const prompt = buildPrompt(task, projectPath);
  
  // Add custom context if provided
  const fullPrompt = options?.customContext 
    ? `${prompt}\n\n## Additional Context\n${options.customContext}`
    : prompt;
  
  // Zo API format
  if (config.provider === "zo") {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "authorization": config.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        input: fullPrompt,
        model_name: config.model,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Zo API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.output || data.content || "";
  }
  
  // Ollama API format
  if (config.provider === "ollama") {
    const response = await fetch(`${config.endpoint}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
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
      messages: [{ role: "user", content: fullPrompt }],
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

/**
 * Simple LLM call without full context (for quick tasks)
 */
export async function callLLM(prompt: string): Promise<string> {
  return callLLMWithContext(prompt, undefined, { includeMemory: false, includeState: false });
}

/**
 * Test connection
 */
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

/**
 * Show current context (for debugging)
 */
export function showContext(projectPath?: string): string {
  return buildSystemContext(projectPath);
}

/**
 * Generate a fix proposal for a specific metric improvement
 */
export async function generateFix(
  context: { metric: string; targetScore: number; constraints?: string[] },
  targetFile: string,
  currentContent: string,
  metric: string,
  targetScore: number
): Promise<{
  description: string;
  files: Array<{
    path: string;
    changes: Array<{
      type: "replace" | "insert";
      oldContent?: string;
      newContent: string;
      location?: { after?: string };
    }>;
  }>;
}> {
  const prompt = `Analyze this code and generate a fix to improve the ${metric} metric from current to ${targetScore}%.

Target file: ${targetFile}

Current content:
\`\`\`
${currentContent.slice(0, 4000)}
\`\`\`

Constraints:
${context.constraints?.map(c => `- ${c}`).join("\n") || "- No specific constraints"}

Output a JSON object with:
{
  "description": "Brief description of the fix",
  "files": [{
    "path": "${targetFile}",
    "changes": [{
      "type": "replace",
      "oldContent": "exact code to replace",
      "newContent": "new code"
    }]
  }]
}

If the fix is an insertion, use:
{
  "type": "insert",
  "location": { "after": "exact code to insert after" },
  "newContent": "code to insert"
}

Only output valid JSON. No explanation.`;

  const response = await callLLMWithContext(prompt);
  
  // Parse JSON from response
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON in response");
  } catch (e) {
    // Return a simple proposal
    return {
      description: `Improve ${metric} (parsing failed)`,
      files: [{
        path: targetFile,
        changes: [{
          type: "replace",
          oldContent: currentContent,
          newContent: response,
        }],
      }],
    };
  }
}

// CLI interface
if (import.meta.main) {
  const { values } = parseArgs({
    options: {
      config: { type: "boolean", default: false },
      test: { type: "boolean", default: false },
      prompt: { type: "string" },
      context: { type: "boolean", default: false },
      project: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: false,
  });
  
  if (values.help) {
    console.log(`
Reflex LLM Client v2 - Context-aware LLM calls

Usage:
  bun llm-client.ts [options]

Options:
  --config              Show current configuration
  --test                Test LLM connection
  --prompt <text>       Send prompt with full context
  --context             Show the context that would be injected
  --project <path>      Project path for context
  -h, --help            Show this help

The key feature: EVERY LLM call gets injected with:
- Reflex identity and capabilities
- Current state (cycles, success rate)
- Project context (if provided)
- Recent incidents and learnings
- Known risk patterns
- Past decisions
- Governor safety rules
- What to do autonomously vs needs approval
`);
    process.exit(0);
  }
  
  if (values.config) {
    const config = getConfig();
    console.log("\\n📦 Reflex LLM Configuration:\\n");
    console.log(`Provider:    ${config.provider}`);
    console.log(`Model:       ${config.model}`);
    console.log(`Endpoint:    ${config.endpoint}`);
    console.log(`Configured:  ${isConfigured() ? "✅ Yes" : "❌ No API key"}`);
    console.log(`Max Tokens:  ${config.maxTokens}`);
    console.log(`Temperature: ${config.temperature}`);
    console.log();
    process.exit(0);
  }
  
  if (values.context) {
    console.log("\\n🧠 Context That Gets Injected:\\n");
    console.log(showContext(values.project as string));
    process.exit(0);
  }
  
  if (values.test) {
    console.log("\\n🧪 Testing LLM connection...\\n");
    const result = await testConnection();
    
    if (result.success) {
      console.log(`✅ ${getConfig().provider} responded: ${result.message}`);
      if (result.model) console.log(`   Model: ${result.model}`);
    } else {
      console.log(`❌ Connection failed: ${result.message}`);
      process.exit(1);
    }
    process.exit(0);
  }
  
  if (values.prompt) {
    const response = await callLLMWithContext(
      values.prompt as string, 
      values.project as string | undefined
    );
    console.log(response);
    process.exit(0);
  }
  
  console.log("Run with --config, --test, --prompt, or --context");
}