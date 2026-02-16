type OpenAiCompatibleChatCompletionResponse = {
  choices?: Array<{
    message?: { role?: string; content?: string; reasoning_content?: string };
  }>;
  error?: { message?: string };
};

function envNumber(name: string, fallback: number) {
  const raw = (process.env[name] || "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export async function aiChatOnce(input: {
  message: string;
  debug?: { maxTokens?: number; timeoutMs?: number };
  reasoningContentEnabled?: boolean;
}) {
  const provider = (process.env.AI_PROVIDER || "").trim();
  if (provider !== "openai_compatible") throw new Error(`Unsupported AI_PROVIDER: ${provider || ""}`);

  const baseUrl = (process.env.AI_BASE_URL || "").trim().replace(/\/+$/, "");
  const model = (process.env.AI_MODEL || "").trim();
  const apiKey = (process.env.AI_API_KEY || "").trim();

  if (!baseUrl) throw new Error("Missing env: AI_BASE_URL");
  if (!model) throw new Error("Missing env: AI_MODEL");
  if (!apiKey) throw new Error("Missing env: AI_API_KEY");

  const modelLower = model.toLowerCase();
  const isAzureOpenAi = modelLower.startsWith("azure_openai/");
  const effectiveModel = isAzureOpenAi ? model.split("/")[1] || model : model;

  const omitTemperature = effectiveModel.toLowerCase().includes("gpt-5");
  const temperature = 1;
  const maxTokens = input.debug?.maxTokens ?? envNumber("AI_MAX_TOKENS", 512);
  const isGpt5 = effectiveModel.toLowerCase().includes("gpt-5");
  const timeoutMs = input.debug?.timeoutMs ?? envNumber("AI_TIMEOUT_MS", 180000);

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
        ...(isAzureOpenAi ? { "X-Model-Provider-Id": "azure_openai" } : {}),
      },
      body: JSON.stringify({
        model: effectiveModel,
        ...(omitTemperature ? {} : { temperature }),
        ...(isGpt5 ? {} : { max_tokens: maxTokens }),
        mify_extra: { reasoning_content_enabled: input.reasoningContentEnabled ?? true },
        messages: [{ role: "user", content: input.message }],
      }),
      signal: ac.signal,
    });

    const textBody = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`AI request failed: ${res.status} ${textBody}`);
    }

    const data = (JSON.parse(textBody) || {}) as OpenAiCompatibleChatCompletionResponse;
    if (data.error?.message) throw new Error(`AI error: ${data.error.message}`);

    const msg = data.choices?.[0]?.message;
    const content = String(msg?.content || "").trim();
    const reasoning = String(msg?.reasoning_content || "").trim();

    const out = content || reasoning;
    if (!out) {
      throw new Error(`AI empty response (model=${model}). raw=${textBody.slice(0, 500)}`);
    }
    return out;
  } finally {
    clearTimeout(t);
  }
}
