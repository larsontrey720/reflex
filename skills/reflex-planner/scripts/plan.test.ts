import { describe, it, expect } from "bun:test";
import { generatePlan } from "./plan";

describe("plan.ts", () => {
  describe("generatePlan", () => {
    describe("authentication feature", () => {
      const idea = "add user authentication";
      const plan = generatePlan(idea);

      it("should generate 3 phases for auth feature", () => {
        expect(plan.phases.length).toBe(3);
      });

      it("should include Research & Design phase", () => {
        expect(plan.phases[0].name).toBe("Research & Design");
        expect(plan.phases[0].tasks.length).toBe(4);
        expect(plan.phases[0].risks).toBeDefined();
      });

      it("should include Implementation phase", () => {
        expect(plan.phases[1].name).toBe("Implementation");
        expect(plan.phases[1].tasks.length).toBe(4);
        expect(plan.phases[1].dependencies).toBeDefined();
      });

      it("should include Security & Testing phase", () => {
        expect(plan.phases[2].name).toBe("Security & Testing");
        expect(plan.phases[2].tasks.length).toBe(4);
      });

      it("should have correct estimated time and complexity", () => {
        expect(plan.estimatedTime).toBe("2-3 weeks");
        expect(plan.complexity).toBe("Medium");
      });

      it("should include auth-related risks", () => {
        const authPlan = generatePlan(idea);
        const hasAuthRisk = authPlan.phases[0].risks?.some(risk => 
          risk.includes("OAuth") || risk.includes("Password")
        );
        expect(hasAuthRisk).toBe(true);
      });
    });

    describe("payment feature", () => {
      const idea = "implement payment processing";
      const plan = generatePlan(idea);

      it("should generate 3 phases for payment feature", () => {
        expect(plan.phases.length).toBe(3);
      });

      it("should include Requirements & Setup phase", () => {
        expect(plan.phases[0].name).toBe("Requirements & Setup");
        expect(plan.phases[0].tasks.length).toBe(4);
      });

      it("should include Integration phase", () => {
        expect(plan.phases[1].name).toBe("Integration");
        expect(plan.phases[1].tasks.length).toBe(4);
      });

      it("should include Testing & Launch phase", () => {
        expect(plan.phases[2].name).toBe("Testing & Launch");
        expect(plan.phases[2].tasks.length).toBe(4);
      });

      it("should have correct estimated time and complexity for payment", () => {
        expect(plan.estimatedTime).toBe("1-2 weeks");
        expect(plan.complexity).toBe("Medium-High");
      });

      it("should include PCI compliance risk", () => {
        const paymentPlan = generatePlan(idea);
        const hasPCICompliance = paymentPlan.phases[0].risks?.some(risk => 
          risk.includes("PCI")
        );
        expect(hasPCICompliance).toBe(true);
      });
    });

    describe("generic feature", () => {
      const idea = "add new feature";
      const plan = generatePlan(idea);

      it("should generate 3 phases for generic feature", () => {
        expect(plan.phases.length).toBe(3);
      });

      it("should include Planning phase", () => {
        expect(plan.phases[0].name).toBe("Planning");
        expect(plan.phases[0].tasks.length).toBe(4);
      });

      it("should include Implementation phase", () => {
        expect(plan.phases[1].name).toBe("Implementation");
        expect(plan.phases[1].tasks.length).toBe(4);
        expect(plan.phases[1].dependencies).toBeDefined();
      });

      it("should include Testing & Deployment phase", () => {
        expect(plan.phases[2].name).toBe("Testing & Deployment");
        expect(plan.phases[2].tasks.length).toBe(4);
      });

      it("should have correct estimated time and complexity for generic feature", () => {
        expect(plan.estimatedTime).toBe("1-2 weeks");
        expect(plan.complexity).toBe("Medium");
      });
    });

    describe("case insensitivity", () => {
      it("should handle uppercase features", () => {
        const idea = "ADD USER AUTHENTICATION";
        const plan = generatePlan(idea);
        expect(plan.phases.length).toBe(3);
      });

      it("should handle mixed case features", () => {
        const idea = "Implement Payment Processing";
        const plan = generatePlan(idea);
        expect(plan.phases.length).toBe(3);
        expect(plan.complexity).toBe("Medium-High");
      });

      it("should handle lowercase features", () => {
        const idea = "add new feature";
        const plan = generatePlan(idea);
        expect(plan.phases.length).toBe(3);
        expect(plan.complexity).toBe("Medium");
      });
    });

    describe("CLI integration", () => {
      it("should export generatePlan function", () => {
        expect(typeof generatePlan).toBe("function");
      });

      it("should return plan object with required properties", () => {
        const plan = generatePlan("test feature");
        
        expect(plan).toHaveProperty("phases");
        expect(plan).toHaveProperty("estimatedTime");
        expect(plan).toHaveProperty("complexity");
        expect(Array.isArray(plan.phases)).toBe(true);
      });

      it("should handle empty string input", () => {
        const plan = generatePlan("");
        expect(plan.phases.length).toBe(3);
        expect(plan.estimatedTime).toBe("1-2 weeks");
        expect(plan.complexity).toBe("Medium");
      });

      it("should handle very long feature descriptions", () => {
        const idea = "a".repeat(1000);
        const plan = generatePlan(idea);
        expect(plan.phases.length).toBe(3);
      });
    });
  });
});