<script setup lang="ts">
import { ref, inject, watch, onUnmounted } from "vue";
import type { WebSocketClient } from "@/hooks/useWebSocket";
import { nanoid } from "nanoid";

const socketClient = inject<WebSocketClient>("socketClient");

interface BarrageItem {
  id: string;
  emoji: string;
  x: number; // 0-100%
  duration: number; // seconds
}

const items = ref<BarrageItem[]>([]);

function addBarrage(emoji: string) {
  const id = nanoid();
  const item: BarrageItem = {
    id,
    emoji,
    x: Math.random() * 60 + 20, // 20% - 80% width
    duration: Math.random() * 2 + 2, // 2-4s
  };
  items.value.push(item);
  
  // Auto remove after animation
  setTimeout(() => {
    items.value = items.value.filter(i => i.id !== id);
  }, item.duration * 1000);
}

// Watch socket for reaction events
watch(
  () => socketClient?.socket.value,
  (socket) => {
    if (socket) {
      socket.on("room:reaction", (payload: { emoji: string }) => {
        addBarrage(payload.emoji);
      });
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (socketClient?.socket.value) {
    socketClient.socket.value.off("room:reaction");
  }
});
</script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden z-50">
    <div
      v-for="item in items"
      :key="item.id"
      class="absolute bottom-0 text-4xl animate-float-up opacity-0"
      :style="{
        left: `${item.x}%`,
        animationDuration: `${item.duration}s`
      }"
    >
      {{ item.emoji }}
    </div>
  </div>
</template>

<style>
@keyframes float-up {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translateY(-20px) scale(1.2);
  }
  100% {
    transform: translateY(-400px) scale(1);
    opacity: 0;
  }
}

.animate-float-up {
  animation-name: float-up;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
}
</style>
