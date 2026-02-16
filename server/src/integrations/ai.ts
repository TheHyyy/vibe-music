import { aiChatOnce } from "./aiRaw.js";

export type AiDailyAnalysisInput = {
  date: string;
  roomId: string;
  rawTextReport: string;
};

function buildPrompt(input: AiDailyAnalysisInput) {
  return [
    "你是一个懂音乐也懂朋友局的 AI 音乐评论员。",
    "请根据下面的【日报数据】写一段有趣的点评和分析，作为日报的“AI 辣评”附在最后。",
    "要求：",
    "- 不需要重复罗列所有数据（因为原始数据会显示在你上面），而是侧重于“分析”和“点评”。",
    "- 重点分析今天的听歌氛围（是伤感、怀旧还是嗨歌？）、活跃用户（谁是麦霸？）、大家的口味倾向等。",
    "- 语气轻松幽默，可以适当调侃（但要友善），像朋友聊天一样。",
    "- 篇幅控制在 150 字以内，言简意赅。",
    "- 输出纯文本即可，不要使用 Markdown 标题。",
    "",
    `日期：${input.date}`,
    `房间：${input.roomId}`,
    "",
    "【日报数据】",
    input.rawTextReport,
  ].join("\n");
}

export async function analyzeDailyReportWithAi(input: AiDailyAnalysisInput) {
  const provider = (process.env.AI_PROVIDER || "").trim();

  // If not configured, fall back to raw report.
  const apiKey = (process.env.AI_API_KEY || "").trim();
  const baseUrl = (process.env.AI_BASE_URL || "").trim();
  const model = (process.env.AI_MODEL || "").trim();
  if (!provider || !apiKey || !baseUrl || !model) return input.rawTextReport;

  try {
    if (provider === "openai_compatible") {
      const prompt = buildPrompt(input);
      const text = await aiChatOnce({
        message: prompt,
        reasoningContentEnabled: false,
        debug: {
          timeoutMs: 60000, // 60s timeout
          maxTokens: 1200,
        },
      });
      // Append AI commentary to the raw report
      return text
        ? `${input.rawTextReport}\n\n----------------\n【总结】\n${text}`
        : input.rawTextReport;
    }

    // Unknown provider: safe fallback
    return input.rawTextReport;
  } catch (e) {
    console.error("[AI] analyze failed", e);
    // For debugging: append the error to the report so we can see it in the UI
    return `${input.rawTextReport}\n\n----------------\n【AI 分析失败】\n${(e as Error).message}`;
  }
}
