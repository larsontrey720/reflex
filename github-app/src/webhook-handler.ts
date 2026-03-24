import type { Context } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Reflex GitHub Webhook Handler
 * 
 * Handles PR events and posts quality scorecard comments
 */

// Store processed deliveries to avoid duplicates
const processedDeliveries = new Map<string, number>();
const DELIVERY_TTL_MS = 60 * 60 * 1000; // 1 hour

function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature?.startsWith("sha256=")) return false;
  const expected = signature.slice(7);
  const computed = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(computed));
  } catch {
    return false;
  }
}

function formatScorecard(scorecard: any, previousScore?: number): string {
  const lines: string[] = [];
  const score = scorecard.compositeScore;
  const delta = previousScore ? score - previousScore : 0;
  const deltaStr = delta > 0 ? ` (+${delta})` : delta < 0 ? ` (${delta})` : "";
  const emoji = score >= 85 ? "✅" : score >= 70 ? "⚠️" : "🔴";

  lines.push(`## ⚡ Reflex Quality Check`);
  lines.push(``);
  lines.push(`**Score: ${score}/100**${deltaStr}`);
  lines.push(``);
  lines.push(`| Metric | Value | Status |`);
  lines.push(`|--------|-------|--------|`);

  for (const metric of scorecard.metrics) {
    const status = metric.score >= 85 ? "✓" : metric.score >= 70 ? "⚠" : "✗";
    lines.push(`| ${formatMetricName(metric.name)} | ${metric.value} | ${status} |`);
  }

  lines.push(``);
  lines.push(`---`);
  lines.push(`_Powered by [Reflex](https://github.com/larsontrey720/reflex) • [Install on your repo](https://github.com/apps/reflex-quality-bot)_`);

  return lines.join("\n");
}

function formatMetricName(name: string): string {
  const names: Record<string, string> = {
    typeIntegrity: "Type Integrity",
    testCoverage: "Test Coverage",
    codeComplexity: "Code Complexity",
    securityPosture: "Security Posture",
    dependencyHealth: "Dependency Health",
    codeConsistency: "Code Consistency",
    buildPerformance: "Build Performance",
    documentationHealth: "Documentation Health",
    errorHandling: "Error Handling",
    architecturalHealth: "Architectural Health",
  };
  return names[name] || name;
}

export default async (c: Context) => {
  // Skip if secret not configured
  const secret = process.env.REFLEX_GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("REFLEX_GITHUB_WEBHOOK_SECRET not configured");
    return c.json({ error: "Webhook not configured" }, 500);
  }

  // Verify signature
  const signature = c.req.header("x-hub-signature-256") || "";
  const payload = await c.req.text();

  if (!verifySignature(payload, signature, secret)) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  // Parse event
  const event = c.req.header("x-github-event");
  const deliveryId = c.req.header("x-github-delivery") || "";

  // Skip if already processed
  if (processedDeliveries.has(deliveryId)) {
    return c.json({ status: "already processed" });
  }
  processedDeliveries.set(deliveryId, Date.now());

  // Clean old deliveries
  for (const [id, ts] of processedDeliveries) {
    if (Date.now() - ts > DELIVERY_TTL_MS) processedDeliveries.delete(id);
  }

  const body = JSON.parse(payload);

  // Handle PR events
  if (event === "pull_request") {
    const action = body.action;
    const pr = body.pull_request;
    const repo = body.repository;

    // Only handle opened, synchronize (new commits), or reopened
    if (!["opened", "synchronize", "reopened"].includes(action)) {
      return c.json({ status: "ignored", reason: `action: ${action}` });
    }

    // Skip draft PRs
    if (pr.draft) {
      return c.json({ status: "ignored", reason: "draft PR" });
    }

    try {
      // Get installation token
      const accessToken = await getInstallationToken(body.installation.id);

      // Analyze PR
      const analysis = await analyzePullRequest({
        owner: repo.owner.login,
        repo: repo.name,
        prNumber: pr.number,
        headSha: pr.head.sha,
        baseRef: pr.base.ref,
        headRef: pr.head.ref,
        accessToken,
      });

      // Post comment
      await postPRComment({
        owner: repo.owner.login,
        repo: repo.name,
        prNumber: pr.number,
        comment: formatScorecard(analysis.scorecard, analysis.previousScore),
        accessToken,
      });

      return c.json({
        status: "success",
        score: analysis.scorecard.compositeScore,
        pr: pr.number,
      });
    } catch (error) {
      console.error("PR analysis failed:", error);
      return c.json({ error: "Analysis failed", details: String(error) }, 500);
    }
  }

  return c.json({ status: "ignored", event });
};

// Helper functions (would be in separate files in production)
async function getInstallationToken(installationId: number): Promise<string> {
  // This would use JWT auth with the GitHub App private key
  // For now, return a placeholder - in production this generates a temp token
  const appToken = process.env.REFLEX_GITHUB_APP_TOKEN;
  if (appToken) return appToken;

  // Simulate for demo
  throw new Error("GitHub App not fully configured - set REFLEX_GITHUB_APP_TOKEN");
}

async function analyzePullRequest(params: {
  owner: string;
  repo: string;
  prNumber: number;
  headSha: string;
  baseRef: string;
  headRef: string;
  accessToken: string;
}): Promise<{ scorecard: any; previousScore?: number }> {
  // In production: clone repo, checkout PR head, run reflex introspect
  // For demo, return simulated data

  return {
    scorecard: {
      compositeScore: 78,
      metrics: [
        { name: "typeIntegrity", value: "89%", score: 89 },
        { name: "testCoverage", value: "72%", score: 72 },
        { name: "codeComplexity", value: "12 avg", score: 85 },
        { name: "securityPosture", value: "0 issues", score: 100 },
        { name: "dependencyHealth", value: "100%", score: 100 },
        { name: "codeConsistency", value: "94%", score: 94 },
        { name: "buildPerformance", value: "1.2s", score: 90 },
        { name: "documentationHealth", value: "67%", score: 67 },
        { name: "errorHandling", value: "85%", score: 85 },
        { name: "architecturalHealth", value: "78%", score: 78 },
      ],
    },
    previousScore: 72,
  };
}

async function postPRComment(params: {
  owner: string;
  repo: string;
  prNumber: number;
  comment: string;
  accessToken: string;
}): Promise<void> {
  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/issues/${params.prNumber}/comments`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Reflex-Quality-Bot",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body: params.comment }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
}