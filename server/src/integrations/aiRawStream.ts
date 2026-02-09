function envNumber(name: string, fallback: number) {
  const raw = (process.env[name] || "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

type ChatCompletionChunk = {
  choices?: Array<{
    delta?: {
      role?: string;
      content?: string;
      reasoning_content?: string;
    };
    finish_reason?: string | null;
    index?: number;
  }>;
  error?: { message?: string };
};

export async function aiChatOnceStream(input: {
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
    console.log("[AIChatStream] ->", url, { model, effectiveModel, temperature, max_tokens: maxTokens, reasoning_content_enabled: input.reasoningContentEnabled ?? true });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${apiKey}`,
        "api-key": apiKey,
        ...(isAzureOpenAi ? { "X-Model-Provider-Id": "azure_openai" } : {}),
      },
      body: JSON.stringify({
        model: effectiveModel,
        stream: true,
        ...(omitTemperature ? {} : { temperature }),
        ...(isGpt5 ? {} : { max_tokens: maxTokens }),
        mify_extra: { reasoning_content_enabled: input.reasoningContentEnabled ?? true },
        messages: [{ role: "user", content: input.message }],
      }),
      signal: ac.signal,
    });

    if (!res.ok) {
      const textBody = await res.text().catch(() => "");
      throw new Error(`AI request failed: ${res.status} ${textBody}`);
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/event-stream")) {
      const textBody = await res.text().catch(() => "");
      throw new Error(`AI stream: expected text/event-stream but got ${contentType || "(missing)"}. body=${textBody.slice(0, 500)}`);
    }

    if (!res.body) throw new Error("AI stream: empty body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let buf = "";
    let content = "";
    let reasoning = "";

    const tryConsumeLine = (lineRaw: string) => {
      const line = lineRaw.trimEnd();
      if (!line.startsWith("data:")) return;

      const dataStr = line.slice("data:".length).trim();
      if (!dataStr) return;
      if (dataStr === "[DONE]") {
        buf = "";
        return;
      }

      let chunk: ChatCompletionChunk;
      try {
        chunk = (JSON.parse(dataStr) || {}) as ChatCompletionChunk;
      } catch {
        return;
      }

      if (chunk.error?.message) throw new Error(`AI error: ${chunk.error.message}`);

      const delta = chunk.choices?.[0]?.delta;
      if (!delta) return;

      if (typeof delta.content === "string") content += delta.content;
      if (typeof delta.reasoning_content === "string") reasoning += delta.reasoning_content;
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });

      // Some gateways may not send double-newline-separated SSE events reliably.
      // We accept both: event blocks (\n\n) and plain line-based `data:` chunks.
      while (true) {
        const idxBlock = buf.indexOf("\n\n");
        const idxLine = buf.indexOf("\n");

        if (idxBlock === -1 && idxLine === -1) break;

        if (idxBlock !== -1 && (idxLine === -1 || idxBlock < idxLine)) {
          const rawEvent = buf.slice(0, idxBlock);
          buf = buf.slice(idxBlock + 2);

          const lines = rawEvent.split("\n").filter(Boolean);
          for (const l of lines) tryConsumeLine(l);
          continue;
        }

        // line-based
        const line = buf.slice(0, idxLine);
        buf = buf.slice(idxLine + 1);
        if (line) tryConsumeLine(line);
      }
    }

    const out = String(content).trim() || String(reasoning).trim();
    if (!out) {
      throw new Error(
        `AI empty response (model=${model}). stream had no delta.content/reasoning_content. lens={content:${content.length},reasoning:${reasoning.length}}`
      );
    }
    return out;
  } finally {
    clearTimeout(t);
  }
}
