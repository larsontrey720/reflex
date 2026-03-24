/**
 * Reflex Notifier - Unified webhook notifications
 * 
 * Supports: Slack, Discord, Telegram, Custom webhooks
 */

export type Platform = "slack" | "discord" | "telegram" | "custom";

export interface NotificationPayload {
  title: string;
  score: number;
  scoreChange?: number;
  metrics: Array<{
    name: string;
    value: string | number;
    status: "ok" | "warn" | "fail";
    change?: string;
  }>;
  recommendations?: string[];
  url?: string;
  project?: string;
  branch?: string;
  pr?: number;
}

export interface WebhookConfig {
  platform: Platform;
  url: string;
  enabled: boolean;
  events?: ("pr" | "cycle" | "regression" | "fix")[];
  minimumScore?: number; // Only notify if below this
}

const EMOJI = {
  ok: "✅",
  warn: "⚠️",
  fail: "❌",
  up: "📈",
  down: "📉",
  reflex: "⚡",
};

/**
 * Send notification to configured webhook(s)
 */
export async function notify(
  payload: NotificationPayload,
  webhooks: WebhookConfig[]
): Promise<{ platform: Platform; success: boolean; error?: string }[]> {
  const results = await Promise.all(
    webhooks
      .filter((w) => w.enabled)
      .map(async (webhook) => {
        try {
          let body: string | object;
          let headers: Record<string, string> = { "Content-Type": "application/json" };

          switch (webhook.platform) {
            case "slack":
              body = formatSlack(payload);
              break;
            case "discord":
              body = formatDiscord(payload);
              break;
            case "telegram":
              body = formatTelegram(payload);
              // Telegram uses query params in URL or JSON body
              break;
            case "custom":
              body = formatCustom(payload);
              break;
          }

          const response = await fetch(webhook.url, {
            method: "POST",
            headers,
            body: typeof body === "string" ? body : JSON.stringify(body),
          });

          if (!response.ok) {
            const text = await response.text().catch(() => "");
            return {
              platform: webhook.platform,
              success: false,
              error: `${response.status}: ${text.slice(0, 100)}`,
            };
          }

          return { platform: webhook.platform, success: true };
        } catch (err) {
          return {
            platform: webhook.platform,
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      })
  );

  return results;
}

/**
 * Format for Slack Incoming Webhook
 * Uses Block Kit for rich formatting
 */
function formatSlack(payload: NotificationPayload): object {
  const scoreEmoji = payload.score >= 85 ? "🟢" : payload.score >= 70 ? "🟡" : "🔴";
  const changeStr = payload.scoreChange
    ? ` (${payload.scoreChange >= 0 ? "+" : ""}${payload.scoreChange})`
    : "";

  const blocks: object[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${EMOJI.reflex} ${payload.title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Score:*\n${scoreEmoji} ${payload.score}/100${changeStr}`,
        },
        {
          type: "mrkdwn",
          text: `*Project:*\n${payload.project || "N/A"}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Metrics:*",
      },
    },
    {
      type: "section",
      fields: payload.metrics.slice(0, 10).map((m) => ({
        type: "mrkdwn",
        text: `${EMOJI[m.status]} ${m.name}: ${m.value}${m.change ? ` (${m.change})` : ""}`,
      })),
    },
  ];

  if (payload.recommendations?.length) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Recommendations:*\n${payload.recommendations
          .slice(0, 3)
          .map((r) => `• ${r}`)
          .join("\n")}`,
      },
    });
  }

  if (payload.url) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Details",
          },
          url: payload.url,
        },
      ],
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `_Powered by <https://github.com/larsontrey720/reflex|Reflex>_`,
      },
    ],
  });

  return { blocks };
}

/**
 * Format for Discord Webhook
 * Uses Embeds for rich formatting
 */
function formatDiscord(payload: NotificationPayload): object {
  const color = payload.score >= 85 ? 3066993 : payload.score >= 70 ? 15844367 : 15158332; // Green, Yellow, Red
  const changeStr = payload.scoreChange
    ? ` (${payload.scoreChange >= 0 ? "📈" : "📉"} ${payload.scoreChange >= 0 ? "+" : ""}${payload.scoreChange})`
    : "";

  const fields = payload.metrics.slice(0, 10).map((m) => ({
    name: m.name,
    value: `${EMOJI[m.status]} ${m.value}${m.change ? ` (${m.change})` : ""}`,
    inline: true,
  }));

  const embed: Record<string, unknown> = {
    title: `${EMOJI.reflex} ${payload.title}`,
    description: `**Score: ${payload.score}/100**${changeStr}`,
    color,
    fields,
    footer: {
      text: "Powered by Reflex",
      icon_url: "https://github.com/larsontrey720/reflex/raw/main/reflex-diagram.png",
    },
    timestamp: new Date().toISOString(),
  };

  if (payload.recommendations?.length) {
    embed.fields.push({
      name: "Recommendations",
      value: payload.recommendations.slice(0, 3).map((r) => `• ${r}`).join("\n"),
      inline: false,
    });
  }

  if (payload.url) {
    embed.url = payload.url;
  }

  return {
    username: "Reflex",
    avatar_url: "https://github.com/larsontrey720/reflex/raw/main/reflex-diagram.png",
    embeds: [embed],
  };
}

/**
 * Format for Telegram Bot API
 * Uses MarkdownV2 or HTML formatting
 */
function formatTelegram(payload: NotificationPayload): object {
  const scoreEmoji = payload.score >= 85 ? "🟢" : payload.score >= 70 ? "🟡" : "🔴";
  const changeStr = payload.scoreChange
    ? ` _\\(${payload.scoreChange >= 0 ? "📈\\+" : "📉"}${payload.scoreChange}\\)_`
    : "";

  // Build message with MarkdownV2 (escaped special chars)
  let message = `⚡ *${escapeMd(payload.title)}*\n\n`;
  message += `${scoreEmoji} *Score: ${payload.score}/100*${changeStr}\n\n`;

  // Metrics table
  message += `📊 *Metrics:*\n`;
  for (const m of payload.metrics.slice(0, 10)) {
    const emoji = EMOJI[m.status];
    const change = m.change ? ` _\\(${escapeMd(m.change)}\\)_` : "";
    message += `${emoji} ${escapeMd(m.name)}: ${escapeMd(String(m.value))}${change}\n`;
  }

  // Recommendations
  if (payload.recommendations?.length) {
    message += `\n📝 *Recommendations:*\n`;
    for (const r of payload.recommendations.slice(0, 3)) {
      message += `• ${escapeMd(r)}\n`;
    }
  }

  // Link
  if (payload.url) {
    message += `\n[View Details](${payload.url})`;
  }

  message += `\n\n_Powered by [Reflex](https://github.com/larsontrey720/reflex)_`;

  return {
    text: message,
    parse_mode: "MarkdownV2",
    link_preview_options: { is_disabled: true },
  };
}

/**
 * Format for generic/custom webhooks
 * Plain JSON payload
 */
function formatCustom(payload: NotificationPayload): object {
  return {
    timestamp: new Date().toISOString(),
    source: "reflex",
    version: "1.0.0",
    data: {
      title: payload.title,
      score: payload.score,
      scoreChange: payload.scoreChange,
      project: payload.project,
      branch: payload.branch,
      pr: payload.pr,
      url: payload.url,
      metrics: payload.metrics,
      recommendations: payload.recommendations,
    },
  };
}

/**
 * Escape special characters for Telegram MarkdownV2
 */
function escapeMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

/**
 * Parse webhook URLs from environment or config
 */
export function parseWebhooks(env: Record<string, string>): WebhookConfig[] {
  const webhooks: WebhookConfig[] = [];

  // Slack
  if (env.REFLEX_SLACK_WEBHOOK) {
    webhooks.push({
      platform: "slack",
      url: env.REFLEX_SLACK_WEBHOOK,
      enabled: true,
    });
  }

  // Discord
  if (env.REFLEX_DISCORD_WEBHOOK) {
    webhooks.push({
      platform: "discord",
      url: env.REFLEX_DISCORD_WEBHOOK,
      enabled: true,
    });
  }

  // Telegram (can be bot token or webhook URL)
  if (env.REFLEX_TELEGRAM_BOT_TOKEN && env.REFLEX_TELEGRAM_CHAT_ID) {
    webhooks.push({
      platform: "telegram",
      url: `https://api.telegram.org/bot${env.REFLEX_TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${env.REFLEX_TELEGRAM_CHAT_ID}`,
      enabled: true,
    });
  } else if (env.REFLEX_TELEGRAM_WEBHOOK) {
    webhooks.push({
      platform: "telegram",
      url: env.REFLEX_TELEGRAM_WEBHOOK,
      enabled: true,
    });
  }

  // Custom
  if (env.REFLEX_CUSTOM_WEBHOOK) {
    webhooks.push({
      platform: "custom",
      url: env.REFLEX_CUSTOM_WEBHOOK,
      enabled: true,
    });
  }

  return webhooks;
}