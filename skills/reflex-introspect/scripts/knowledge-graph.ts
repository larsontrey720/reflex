#!/usr/bin/env bun
/**
 * Reflex Knowledge Graph - Map codebase relationships
 * 
 * Features from Bito/Greptile:
 * - Code Q&A: "How does X work?"
 * - Dependency mapping
 * - Module relationships
 */

import { parseArgs } from "node:util";
import { readdir, readFile } from "node:fs/promises";
import { join, extname, basename, dirname, relative } from "node:path";

interface CodeNode {
  id: string;
  type: "module" | "function" | "class" | "interface";
  name: string;
  file: string;
  line?: number;
  exports?: string[];
  imports?: string[];
  calls?: string[];
}

interface CodeEdge {
  from: string;
  to: string;
  type: "imports" | "calls" | "implements" | "extends";
}

interface CodeGraph {
  nodes: CodeNode[];
  edges: CodeEdge[];
}

// Parse TypeScript/JavaScript for imports/exports
async function parseFile(filePath: string): Promise<Partial<CodeNode>> {
  const ext = extname(filePath);
  
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return {};
  }
  
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const imports: string[] = [];
    const exports: string[] = [];
    const calls: string[] = [];
    
    // Extract imports
    const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)?\s*(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Extract function calls (simplified)
    const callRegex = /(\w+)\s*\(/g;
    while ((match = callRegex.exec(content)) !== null) {
      if (!['if', 'for', 'while', 'switch', 'catch', 'return', 'console', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean'].includes(match[1])) {
        calls.push(match[1]);
      }
    }
    
    return {
      name: basename(filePath, ext),
      file: filePath,
      imports: [...new Set(imports)],
      exports: [...new Set(exports)],
      calls: [...new Set(calls)],
    };
  } catch {
    return {};
  }
}

async function buildGraph(dir: string, maxFiles: number = 500): Promise<CodeGraph> {
  const nodes: CodeNode[] = [];
  const edges: CodeEdge[] = [];
  const nodeMap = new Map<string, CodeNode>();
  
  let fileCount = 0;
  
  async function walk(currentDir: string) {
    if (fileCount >= maxFiles) return;
    
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (fileCount >= maxFiles) break;
        
        const fullPath = join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'dist', 'build', 'vendor', '__pycache__'].includes(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = extname(entry.name);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            fileCount++;
            const parsed = await parseFile(fullPath);
            
            if (parsed.name) {
              const node: CodeNode = {
                id: relative(dir, fullPath),
                type: "module",
                name: parsed.name,
                file: fullPath,
                exports: parsed.exports || [],
                imports: parsed.imports || [],
                calls: parsed.calls || [],
              };
              
              nodes.push(node);
              nodeMap.set(node.id, node);
            }
          }
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }
  
  await walk(dir);
  
  // Build edges from imports
  for (const node of nodes) {
    for (const imp of node.imports || []) {
      // Find matching node
      const targetId = nodes.find(n => 
        n.file.includes(imp) || 
        n.name === imp ||
        imp.includes(n.name)
      )?.id;
      
      if (targetId) {
        edges.push({
          from: node.id,
          to: targetId,
          type: "imports",
        });
      }
    }
  }
  
  return { nodes, edges };
}

function answerQuestion(graph: CodeGraph, question: string): string {
  const lowerQ = question.toLowerCase();
  
  // Find relevant nodes
  const keywords = lowerQ
    .replace(/how does |work|what is |where is /gi, '')
    .split(/\s+/)
    .filter(k => k.length > 2);
  
  const relevantNodes = graph.nodes.filter(n => {
    const searchText = `${n.name} ${n.exports?.join(' ')} ${n.file}`.toLowerCase();
    return keywords.some(k => searchText.includes(k));
  });
  
  if (relevantNodes.length === 0) {
    return `No modules found matching: ${keywords.join(', ')}`;
  }
  
  const lines: string[] = [];
  lines.push(`Found ${relevantNodes.length} relevant modules:\n`);
  
  for (const node of relevantNodes.slice(0, 5)) {
    lines.push(`📦 ${node.name}`);
    lines.push(`   File: ${node.file}`);
    
    if (node.exports?.length) {
      lines.push(`   Exports: ${node.exports.slice(0, 5).join(', ')}`);
    }
    
    // Find incoming connections
    const incoming = graph.edges.filter(e => e.to === node.id);
    if (incoming.length > 0) {
      lines.push(`   Used by: ${incoming.length} modules`);
    }
    
    // Find outgoing connections
    const outgoing = graph.edges.filter(e => e.from === node.id);
    if (outgoing.length > 0) {
      lines.push(`   Depends on: ${outgoing.length} modules`);
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

function visualizeGraph(graph: CodeGraph, format: string = "text"): string {
  if (format === "mermaid") {
    const lines: string[] = ["graph TD"];
    
    for (const node of graph.nodes.slice(0, 20)) {
      const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`  ${safeId}[${node.name}]`);
    }
    
    for (const edge of graph.edges.slice(0, 30)) {
      const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
      const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`  ${fromId} --> ${toId}`);
    }
    
    return lines.join('\n');
  }
  
  // Text format
  const lines: string[] = [];
  lines.push(`Codebase Graph: ${graph.nodes.length} modules, ${graph.edges.length} connections\n`);
  
  // Most connected modules
  const connectionCount = new Map<string, number>();
  for (const edge of graph.edges) {
    connectionCount.set(edge.from, (connectionCount.get(edge.from) || 0) + 1);
    connectionCount.set(edge.to, (connectionCount.get(edge.to) || 0) + 1);
  }
  
  const sorted = [...connectionCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  
  lines.push("Most Connected Modules:");
  for (const [id, count] of sorted) {
    const node = graph.nodes.find(n => n.id === id);
    lines.push(`  ${node?.name || id}: ${count} connections`);
  }
  
  return lines.join('\n');
}

// Main
const { values, positionals } = parseArgs({
  options: {
    project: { type: "string", short: "p", default: "." },
    question: { type: "string", short: "q" },
    format: { type: "string", default: "text" },
    output: { type: "string", short: "o" },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Reflex Knowledge Graph - Map codebase relationships

Usage:
  reflex graph [options]
  reflex graph --question "how does auth work?"

Options:
  -p, --project <path>   Project directory (default: current)
  -q, --question <text>  Ask a question about the codebase
  --format <format>      Output format: text, mermaid (default: text)
  -o, --output <file>    Save to file
  --json                 JSON output
  -h, --help             Show this help

Examples:
  reflex graph --question "how does payment processing work?"
  reflex graph --format mermaid > graph.md
`);
  process.exit(0);
}

const projectPath = values.project as string;

console.log(`\n🗺️  Building knowledge graph for: ${projectPath}\n`);

const graph = await buildGraph(projectPath);

const question = values.question || positionals.slice(2).join(' ');

if (question) {
  const answer = answerQuestion(graph, question);
  console.log(answer);
} else if (values.json) {
  console.log(JSON.stringify(graph, null, 2));
} else {
  console.log(visualizeGraph(graph, values.format as string));
}

if (values.output) {
  const { writeFile } = await import('node:fs/promises');
  const content = values.json ? JSON.stringify(graph, null, 2) : visualizeGraph(graph, values.format as string);
  await writeFile(values.output as string, content);
  console.log(`\nGraph saved to: ${values.output}`);
}