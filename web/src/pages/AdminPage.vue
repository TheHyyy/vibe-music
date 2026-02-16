<script setup lang="ts">
import { ref } from "vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import { Send, MessageSquare, Calendar, Terminal } from "lucide-vue-next";

const date = ref("");
const out = ref("(empty)");
const chatInput = ref("");
const chatOut = ref("(empty)");
const thinkingEnabled = ref(true);
const useStream = ref(true);
const loadingPush = ref(false);
const loadingChat = ref(false);

async function call(push: boolean, target: "test" | "prod" = "test") {
  loadingPush.value = true;
  out.value = "请求中...";
  try {
    const body: any = { push, target };
    if (date.value.trim()) body.date = date.value.trim();

    // Debug: show what we are sending
    out.value = `正在发送请求: ${JSON.stringify(body, null, 2)}\n\n等待响应...`;

    const res = await fetch("/api/reports/daily/push-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);
    if (!json) {
      out.value = "解析响应失败";
      return;
    }

    if (!json.ok) {
      out.value = "错误：" + (json.error?.message || "error");
      return;
    }

    out.value = json.data.text;
  } catch (e) {
    out.value = "请求异常: " + (e as Error).message;
  } finally {
    loadingPush.value = false;
  }
}

async function chat() {
  const message = chatInput.value.trim();
  if (!message) {
    chatOut.value = "请输入内容";
    return;
  }

  loadingChat.value = true;
  chatOut.value = "请求中...";
  try {
    const res = await fetch("/api/debug/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        reasoningContentEnabled: thinkingEnabled.value,
        useStream: useStream.value,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!json) {
      chatOut.value = "解析响应失败";
      return;
    }

    if (!json.ok) {
      chatOut.value = "错误：" + (json.error?.message || "error");
      return;
    }

    chatOut.value = json.data.text || "(empty)";
  } catch (e) {
    chatOut.value = "请求异常: " + (e as Error).message;
  } finally {
    loadingChat.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-background text-foreground flex flex-col items-center p-8"
  >
    <div class="w-full max-w-3xl space-y-8">
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">Echo Music Admin</h1>
        <p class="text-slate-400 text-sm">
          不要对外公开此链接。用于手动生成/推送日报。
        </p>
      </div>

      <!-- Push Card -->
      <div
        class="glass rounded-2xl p-6 border border-white/10 bg-slate-900/50 space-y-4"
      >
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="text-xs font-medium text-slate-400 mb-1 block"
              >日期 (YYYY-MM-DD) <span class="text-emerald-400" v-if="date">当前: {{ date }}</span></label
            >
            <!-- 使用原生 input 确保绑定无误 -->
            <div class="relative">
              <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="date"
                type="text"
                class="flex h-10 w-full rounded-lg border border-white/10 bg-slate-950/50 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-all"
                placeholder="2026-02-09"
              />
            </div>
          </div>
          <Button
            variant="primary"
            :loading="loadingPush"
            @click="call(true, 'test')"
          >
            <Send class="w-4 h-4 mr-2" />
            推送测试群
          </Button>
          <Button
            class="bg-emerald-600 hover:bg-emerald-500 text-white border-none"
            :loading="loadingPush"
            @click="call(true, 'prod')"
          >
            <Send class="w-4 h-4 mr-2" />
            推送正式群
          </Button>
          <Button
            variant="secondary"
            :loading="loadingPush"
            @click="call(false)"
          >
            仅预览
          </Button>
        </div>
        <p class="text-xs text-slate-500">
          推送会调用：POST /api/reports/daily/push-all
        </p>
      </div>

      <!-- Output -->
      <div>
        <h2 class="text-xl font-semibold text-white mb-4">日报输出</h2>
        <pre
          class="bg-slate-950 rounded-xl p-4 border border-white/10 overflow-auto text-xs text-slate-300 min-h-[100px] whitespace-pre-wrap"
          >{{ out }}</pre
        >
      </div>

      <!-- AI Chat Card -->
      <div>
        <h2 class="text-xl font-semibold text-white mb-4">AI 调试聊天</h2>
        <div
          class="glass rounded-2xl p-6 border border-white/10 bg-slate-900/50 space-y-4"
        >
          <div class="flex flex-wrap items-end gap-4">
            <div class="flex-1 min-w-[280px]">
              <label class="text-xs font-medium text-slate-400 mb-1 block"
                >输入测试内容</label
              >
              <Input
                v-model="chatInput"
                :icon="MessageSquare"
                placeholder="比如：用一句话总结今天的点歌氛围"
                @enter="chat"
              />
            </div>
            <div class="flex items-center gap-4 pb-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="thinkingEnabled"
                  class="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                <span class="text-xs text-slate-400">Reasoning</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="useStream"
                  class="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                <span class="text-xs text-slate-400">Stream</span>
              </label>
            </div>
            <Button variant="primary" :loading="loadingChat" @click="chat">
              <Terminal class="w-4 h-4 mr-2" />
              发送
            </Button>
          </div>
          <p class="text-xs text-slate-500">调用：POST /api/debug/ai-chat</p>
        </div>
      </div>

      <!-- Chat Output -->
      <div>
        <h2 class="text-xl font-semibold text-white mb-4">AI 输出</h2>
        <pre
          class="bg-slate-950 rounded-xl p-4 border border-white/10 overflow-auto text-xs text-slate-300 min-h-[100px] whitespace-pre-wrap"
          >{{ chatOut }}</pre
        >
      </div>
    </div>
  </div>
</template>
