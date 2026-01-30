<script setup lang="ts">
import { ref, onUnmounted, nextTick, inject, watch } from "vue";
import { Send, MessageSquare } from "lucide-vue-next";
import { animalAvatarUrl } from "@/lib/utils";
import type { WebSocketClient } from "@/hooks/useWebSocket";
import { useRoomSelector } from "@/stores/useRoomStore";

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  timestamp: number;
  type?: "USER" | "SYSTEM";
}

const socketClient = inject<WebSocketClient>("socketClient");
const currentUser = useRoomSelector((s) => s.currentUser);
const messages = ref<ChatMessage[]>([]);
const inputValue = ref("");
const messagesEndRef = ref<HTMLElement | null>(null);

function scrollToBottom() {
  nextTick(() => {
    if (messagesEndRef.value) {
      messagesEndRef.value.scrollIntoView({ behavior: "smooth" });
    }
  });
}

function onMessage(msg: ChatMessage) {
  messages.value.push(msg);
  if (msg.userId === currentUser.value?.id) {
    scrollToBottom();
  }
}

function sendMessage() {
  const content = inputValue.value.trim();
  if (!content || !socketClient) return;

  socketClient.emit("chat:message", { content });
  inputValue.value = "";
}

function sendReaction() {
  if (!socketClient) return;
  // 随机emoji
  const emojis = [
    "🐑",
    "🎇",
    "👍",
    "❤️",
    "😂",
    "😍",
    "😭",
    "😡",
    "🐒",
    "🍚",
    "🐷",
  ];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  socketClient.emit("room:reaction", { emoji });
}

// Watch for socket connection to bind listeners
watch(
  () => socketClient?.socket.value,
  (socket) => {
    if (socket) {
      socket.on("chat:message", onMessage);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (socketClient?.socket.value) {
    socketClient.socket.value.off("chat:message", onMessage);
  }
});
</script>

<template>
  <div class="glass flex flex-col overflow-hidden rounded-2xl">
    <!-- Header -->
    <div
      class="border-b border-white/5 px-4 py-3 shrink-0 flex justify-between items-center"
    >
      <div class="flex items-center gap-2">
        <MessageSquare class="h-4 w-4 text-slate-400" />
        <h3 class="font-semibold text-white">实时聊天</h3>
      </div>
      <button
        @click="sendReaction"
        class="text-rose-500 hover:scale-110 active:scale-95 transition-transform"
        title="点赞"
      >
        💗
        <!-- <Heart class="h-5 w-5 fill-current" /> -->
      </button>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
      <div
        v-if="messages.length === 0"
        class="text-center text-sm text-slate-400 py-4"
      >
        暂无消息
      </div>

      <div v-for="msg in messages" :key="msg.id">
        <!-- System Message -->
        <div v-if="msg.type === 'SYSTEM'" class="flex justify-center my-2">
          <span
            class="px-3 py-1 text-xs text-slate-400 bg-white/5 rounded-full"
            >{{ msg.content }}</span
          >
        </div>

        <!-- User Message -->
        <div v-else class="flex gap-3">
          <img
            :src="animalAvatarUrl(msg.userId)"
            class="h-8 w-8 rounded-full bg-white/5 shrink-0"
            alt="Avatar"
          />
          <div class="flex flex-col gap-1 min-w-0">
            <div class="flex items-baseline gap-2">
              <span
                class="text-xs font-medium text-slate-300 truncate max-w-[120px]"
                >{{ msg.displayName }}</span
              >
              <span class="text-[10px] text-slate-500">{{
                new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}</span>
            </div>
            <div class="text-sm text-white break-words leading-relaxed">
              {{ msg.content }}
            </div>
          </div>
        </div>
      </div>
      <div ref="messagesEndRef"></div>
    </div>

    <!-- Input -->
    <div class="p-3 border-t border-white/5 shrink-0">
      <div class="relative">
        <input
          v-model="inputValue"
          type="text"
          placeholder="说点什么..."
          class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          @keydown.enter="sendMessage"
        />
        <button
          @click="sendMessage"
          :disabled="!inputValue.trim()"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
        >
          <Send class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
