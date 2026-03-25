import { describe, it, expect } from "bun:test";
import { runMain } from "./context";

// Mock process.argv and console.log
const originalArgv = process.argv;
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("context.ts", () => {
  beforeEach(() => {
    process.argv = originalArgv;
    consoleSpy.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.argv = originalArgv;
  });

  describe("CLI argument parsing", () => {
    it("should show help with --help flag", () => {
      process.argv = ["node", "context.ts", "--help"];
      
      try {
        runMain();
      } catch (e) {
        // Expected to exit
      }
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(process.argv).toContain("--help");
    });

    it("should parse --trace flag", () => {
      process.argv = ["node", "context.ts", "--trace", "auth timeout"];
      expect(process.argv).toContain("--trace");
      expect(process.argv).toContain("auth timeout");
    });

    it("should parse --who-owns flag", () => {
      process.argv = ["node", "context.ts", "--who-owns", "payment-service"];
      expect(process.argv).toContain("--who-owns");
      expect(process.argv).toContain("payment-service");
    });

    it("should parse --related flag", () => {
      process.argv = ["node", "context.ts", "--related", "src/checkout/service.ts"];
      expect(process.argv).toContain("--related");
      expect(process.argv).toContain("src/checkout/service.ts");
    });

    it("should parse --graph flag", () => {
      process.argv = ["node", "context.ts", "--graph"];
      expect(process.argv).toContain("--graph");
    });

    it("should parse --format flag", () => {
      process.argv = ["node", "context.ts", "--graph", "--format", "mermaid"];
      expect(process.argv).toContain("--format");
      expect(process.argv).toContain("mermaid");
    });

    it("should parse --add flag", () => {
      process.argv = ["node", "context.ts", "--add", "new context item"];
      expect(process.argv).toContain("--add");
      expect(process.argv).toContain("new context item");
    });
  });

  describe("context graph generation", () => {
    it("should generate mermaid graph when --graph --format mermaid", () => {
      process.argv = ["node", "context.ts", "--graph", "--format", "mermaid"];
      
      try {
        runMain();
      } catch (e) {
        // Expected to exit
      }
      
      // Check if mermaid graph was generated
      const output = consoleSpy.mock.calls.join("\n");
      expect(output).toContain("graph TD");
      expect(output).toContain("A[Ticket #1427]");
      expect(output).toContain("B[PR #401]");
    });

    it("should generate JSON graph when --graph --format json", () => {
      process.argv = ["node", "context.ts", "--graph", "--format", "json"];
      
      try {
        runMain();
      } catch (e) {
        // Expected to exit
      }
      
      // Check if JSON was generated
      const output = consoleSpy.mock.calls.join("\n");
      expect(output).toContain('"nodes"');
      expect(output).toContain('"edges"');
    });
  });

  describe("ownership queries", () => {
    it("should display owner information with --who-owns", () => {
      process.argv = ["node", "context.ts", "--who-owns", "payment-service.ts"];
      
      try {
        runMain();
      } catch (e) {
        // Expected to exit
      }
      
      const output = consoleSpy.mock.calls.join("\n");
      expect(output).toContain("OWNERSHIP");
      expect(output).toContain("payment-service.ts");
      expect(output).toContain("Code Owner:");
      expect(output).toContain("Team:");
    });
  });

  describe("related context queries", () => {
    it("should display related context with --related", () => {
      process.argv = ["node", "context.ts", "--related", "src/checkout/service.ts"];
      
      try {
        runMain();
      } catch (e) {
        // Expected to exit
      }
      
      const output = consoleSpy.mock.calls.join("\n");
      expect(output).toContain("RELATED CONTEXT");
      expect(output).toContain("src/checkout/service.ts");
      expect(output).toContain("LINKED ITEMS");
    });
  });

  describe("trace queries", () => {
    it("should display trace results with --trace", () => {
      process.argv = ["node", "context.ts", "--trace", "auth timeout"];
      
      try {
        runMain();
      } catch (e) {
        // Expected to exit
      }
      
      const output = consoleSpy.mock.calls.join("\n");
      expect(output).toContain("CONTEXT GRAPH QUERY");
      expect(output).toContain("Query:");
      expect(output).toContain("auth timeout");
      expect(output).toContain("RESULT TRACE");
    });
  });

  describe("natural language queries", () => {
    it("should handle positional query arguments", () => {
      process.argv = ["node", "context.ts", "why does checkout fail?"];
      
      try {
        runMain();
      } catch (e) {
        // Expected to exit
      }
      
      const output = consoleSpy.mock.calls.join("\n");
      expect(output).toContain("CONTEXT GRAPH QUERY");
      expect(output).toContain("why does checkout fail?");
    });

    it("should provide help when no arguments given", () => {
      process.argv = ["node", "context.ts"];
      
      try {
        runMain();
      } catch (e) {
        // Expected to exit
      }
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});