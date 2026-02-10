export function renderAdminPage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Echo Music Admin</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial; background:#0b1220; color:#e5e7eb; margin:0; }
    .wrap { max-width: 760px; margin: 0 auto; padding: 24px; }
    .card { border: 1px solid #1f2937; background: rgba(17,24,39,.6); border-radius: 14px; padding: 16px; }
    .row { display:flex; gap: 12px; flex-wrap: wrap; }
    input { background:#0f172a; border:1px solid #334155; color:#e5e7eb; padding:10px 12px; border-radius:10px; min-width: 220px; }
    button { background:#2563eb; border:0; color:white; padding:10px 12px; border-radius:10px; cursor:pointer; }
    button.secondary { background:#334155; }
    pre { white-space: pre-wrap; background:#0f172a; border:1px solid #334155; padding:12px; border-radius:12px; overflow:auto; }
    .muted { color:#94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Echo Music 隐藏管理页</h1>
    <p class="muted">不要对外公开此链接。用于手动生成/推送日报。</p>

    <div class="card">
      <div class="row" style="align-items:center;">
        <label>
          <div class="muted">日期（YYYY-MM-DD，可空=今天）</div>
          <input id="date" placeholder="2026-02-06" />
        </label>
        <button id="btnPush">推送测试群</button>
        <button id="btnPushProd" style="background:#059669;">推送正式群</button>
        <button class="secondary" id="btnPreview">仅预览（不推送）</button>
      </div>
      <p class="muted">推送会调用：POST /api/reports/daily/push-all</p>
    </div>

    <h2 style="margin-top:18px;">日报输出</h2>
    <pre id="out">(empty)</pre>

    <h2 style="margin-top:18px;">AI 调试聊天</h2>
    <div class="card">
      <div class="row" style="align-items:center;">
        <label style="flex:1; min-width: 280px;">
          <div class="muted">输入一句话测试模型（不会写入日报日志）</div>
          <input id="chatInput" placeholder="比如：用一句话总结今天的点歌氛围" style="width:100%;" />
        </label>
        <label style="display:flex; align-items:center; gap:8px;">
          <input id="thinkingEnabled" type="checkbox" checked />
          <span class="muted">reasoning_content_enabled</span>
        </label>
        <label style="display:flex; align-items:center; gap:8px;">
          <input id="useStream" type="checkbox" checked />
          <span class="muted">stream</span>
        </label>
        <button id="btnChat">发送</button>
      </div>
      <p class="muted">调用：POST /api/debug/ai-chat</p>
    </div>

    <h2 style="margin-top:18px;">AI 输出</h2>
    <pre id="chatOut">(empty)</pre>
  </div>

<script>
  const out = document.getElementById('out');
  const chatOut = document.getElementById('chatOut');
  const dateEl = document.getElementById('date');
  const chatInput = document.getElementById('chatInput');
  const thinkingEnabled = document.getElementById('thinkingEnabled');
  const useStream = document.getElementById('useStream');

  async function call(push, target = 'test') {
    out.textContent = '请求中...';
    const date = (dateEl.value || '').trim();
    const body = { push, target };
    if (date) body.date = date;

    const res = await fetch('/api/reports/daily/push-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);
    if (!json) {
      out.textContent = '解析响应失败';
      return;
    }

    if (!json.ok) {
      out.textContent = '错误：' + (json.error?.message || 'error');
      return;
    }

    out.textContent = json.data.text;
  }

  async function chat() {
    chatOut.textContent = '请求中...';
    const message = (chatInput.value || '').trim();
    if (!message) {
      chatOut.textContent = '请输入内容';
      return;
    }

    const res = await fetch('/api/debug/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        reasoningContentEnabled: !!thinkingEnabled.checked,
        useStream: !!useStream.checked,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!json) {
      chatOut.textContent = '解析响应失败';
      return;
    }

    if (!json.ok) {
      chatOut.textContent = '错误：' + (json.error?.message || 'error');
      return;
    }

    chatOut.textContent = json.data.text || '(empty)';
  }

  document.getElementById('btnPush').addEventListener('click', () => call(true, 'test'));
  document.getElementById('btnPushProd').addEventListener('click', () => call(true, 'prod'));
  document.getElementById('btnPreview').addEventListener('click', () => call(false));
  document.getElementById('btnChat').addEventListener('click', () => chat());
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') chat();
  });
</script>
</body>
</html>`;
}
