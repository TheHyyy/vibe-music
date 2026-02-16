export async function sendFeishuWebhookText(input: {
  webhookUrl: string;
  text: string;
}) {
  const res = await fetch(input.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg_type: "text", content: { text: input.text } }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Feishu webhook failed: ${res.status} ${body}`);
  }

  const data = (await res.json().catch(() => null)) as any;
  // Feishu webhook success: { StatusCode: 0, StatusMessage: 'success' }
  if (data && typeof data.StatusCode === "number" && data.StatusCode !== 0) {
    throw new Error(`Feishu webhook error: ${data.StatusCode} ${data.StatusMessage || ""}`);
  }
}
