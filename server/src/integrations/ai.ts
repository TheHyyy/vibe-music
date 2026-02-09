export type AiDailyAnalysisInput = {
  date: string;
  roomId: string;
  rawTextReport: string;
};

type OpenAiCompatibleChatCompletionResponse = {
  choices?: Array<{ message?: { role?: string; content?: string } }>;
  error?: { message?: string };
};

function envNumber(name: string, fallback: number) {
  const raw = (process.env[name] || "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function withTimeout<T>(p: Promise<T>, ms: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return {
    promise: (async () => {
      try {
        // @ts-expect-error - passthrough signal
        return await p(ac.signal);
      } finally {
        clearTimeout(t);
      }
    })(),
    signal: ac.signal,
  };
}

function buildPrompt(input: AiDailyAnalysisInput) {
  return [
    "你是一个懂音乐也懂朋友局的人情味日报编辑。",
    "请根据下面的【可追溯原始日报】生成一段更有温度的总结，并保留关键榜单信息。",
    "要求：",
    "- 用中文，语气轻松友好，不要过度夸张",
    "- 给出 3~6 条要点（bullet）",
    "- 给出一句收尾（邀请大家明天继续点歌）",
    "- 不要编造原始日报里没有的数据",
    "- 输出纯文本即可",
    "",
    `日期：${input.date}`,
    `房间：${input.roomId}`,
    "",
    "【可追溯原始日报】",
    input.rawTextReport,
  ].join("\n");
}

async function callOpenAiCompatible(input: AiDailyAnalysisInput) {
  const baseUrl = (process.env.AI_BASE_URL || "").trim().replace(/\/+$/, "");
  const model = (process.env.AI_MODEL || "").trim();
  const apiKey = (process.env.AI_API_KEY || "").trim();

  if (!baseUrl) throw new Error("Missing env: AI_BASE_URL");
  if (!model) throw new Error("Missing env: AI_MODEL");
  if (!apiKey) throw new Error("Missing env: AI_API_KEY");

  const temperature = envNumber("AI_TEMPERATURE", 0.4);
  const maxTokens = envNumber("AI_MAX_TOKENS", 1200);

  const prompt = buildPrompt(input);

  const url = `${baseUrl}/chat/completions`;
  const timeoutMs = envNumber("AI_TIMEOUT_MS", 15000);

  const { promise, signal } = withTimeout(
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ((s: AbortSignal) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: "你是一个严谨但有温度的日报编辑。" },
            { role: "user", content: prompt },
          ],
        }),
        signal: s,
      })) as any,
    timeoutMs,
  );

  const res = await promise;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI request failed: ${res.status} ${body}`);
  }

  const data = (await res.json().catch(() => null)) as OpenAiCompatibleChatCompletionResponse | null;
  if (!data) throw new Error("AI response parse failed");
  if (data.error?.message) throw new Error(`AI error: ${data.error.message}`);

  const content = data.choices?.[0]?.message?.content;
  return String(content || "").trim();
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
      const text = await callOpenAiCompatible(input);
      return text ? `【AI】\n${text}` : input.rawTextReport;
    }

    // Unknown provider: safe fallback
    return input.rawTextReport;
  } catch (e) {
    console.error("[AI] analyze failed", e);
    // Never block pushing; degrade gracefully
    return input.rawTextReport;
  }
}
