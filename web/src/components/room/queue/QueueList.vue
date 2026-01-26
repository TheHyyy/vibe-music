<script setup lang="ts">
import { nextTick, onBeforeUpdate, ref, watch } from "vue";
import { ListMusic } from "lucide-vue-next";
import QueueItem from "@/components/room/queue/QueueItem.vue";
import { useRoomSelector } from "@/stores/useRoomStore";

const queue = useRoomSelector((s) => s.queue);

const listRef = ref<HTMLDivElement | null>(null);
const before = ref<{ scrollTop: number; scrollHeight: number } | null>(null);

onBeforeUpdate(() => {
  const el = listRef.value;
  if (!el) return;
  if (el.scrollTop <= 8) {
    before.value = null;
    return;
  }
  before.value = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight };
});

watch(
  () => queue.value,
  async () => {
    const el = listRef.value;
    const snap = before.value;
    if (!el || !snap) return;
    await nextTick();
    const diff = el.scrollHeight - snap.scrollHeight;
    el.scrollTop = snap.scrollTop + diff;
  },
  { deep: true },
);
</script>

<template>
  <div class="glass flex flex-1 flex-col overflow-hidden rounded-2xl">
    <div class="border-b border-white/5 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ListMusic class="h-4 w-4 text-slate-400" />
          <h3 class="font-semibold text-white">播放队列</h3>
        </div>
        <div class="text-[10px] text-slate-400">
          {{ queue.length }} 首待播
        </div>
      </div>
    </div>
    
    <div ref="listRef" class="flex-1 overflow-y-auto p-2 scrollbar-thin" data-testid="queue-list">
      <div v-if="queue.length === 0" class="flex h-40 flex-col items-center justify-center text-slate-500">
        <div class="text-sm">暂无歌曲</div>
        <div class="text-xs opacity-50">快去点一首吧</div>
      </div>
      
      <TransitionGroup 
        name="list" 
        tag="div" 
        class="space-y-2"
      >
        <QueueItem v-for="item in queue" :key="item.id" :item="item" />
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
