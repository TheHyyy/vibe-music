type OpenAiCompatibleChatCompletionResponse = {
  choices?: Array<{ message?: { role?: string; content?: string } }>;
  error?: { message?: string };
};

function envNumber(name: string, fallback: number) {
  const raw = (process.env[name] || "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export async function aiChatOnce(input: { message: string }) {
  const provider = (process.env.AI_PROVIDER || "").trim();
  if (provider !== "openai_compatible") throw new Error(`Unsupported AI_PROVIDER: ${provider || ""}`);

  const baseUrl = (process.env.AI_BASE_URL || "").trim().replace(/\/+$/, "");
  const model = (process.env.AI_MODEL || "").trim();
  const apiKey = (process.env.AI_API_KEY || "").trim();

  if (!baseUrl) throw new Error("Missing env: AI_BASE_URL");
  if (!model) throw new Error("Missing env: AI_MODEL");
  if (!apiKey) throw new Error("Missing env: AI_API_KEY");

  const temperature = envNumber("AI_TEMPERATURE", 0.4);
  const maxTokens = envNumber("AI_MAX_TOKENS", 512);
  const timeoutMs = envNumber("AI_TIMEOUT_MS", 180000);

  const url = `${baseUrl}/chat/completions`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    console.log("[AIChat] ->", url, { model, temperature, max_tokens: maxTokens });
    const res = await fetch(url, {
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
          { role: "system", content: "你是一个友好的助手。" },
          { role: "user", content: input.message },
        ],
      }),
      signal: ac.signal,
    });

    const textBody = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`AI request failed: ${res.status} ${textBody}`);
    }

    const data = (JSON.parse(textBody) || {}) as OpenAiCompatibleChatCompletionResponse;
    if (data.error?.message) throw new Error(`AI error: ${data.error.message}`);

    const content = data.choices?.[0]?.message?.content;
    return String(content || "").trim();
  } finally {
    clearTimeout(t);
  }
}
