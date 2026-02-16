<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";
import { ThumbsUp, ThumbsDown, Disc3 } from "lucide-vue-next";
import type { QueueItem } from "@/types/api";
import { vote as voteApi } from "@/api/rooms";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";
import Button from "@/components/ui/Button.vue";

const props = defineProps<{ item: QueueItem }>();

const actions = useRoomActions();
const roomId = useRoomSelector((s) => s.room?.id);
const actionLoading = useRoomSelector((s) => s.actionLoading);

function key(type: "UP" | "DOWN") {
  return `vote:${props.item.id}:${type}`;
}

const upLoading = computed(() => !!actionLoading.value[key("UP")]);
const downLoading = computed(() => !!actionLoading.value[key("DOWN")]);

async function vote(type: "UP" | "DOWN") {
  if (!roomId.value) return;
  const k = key(type);
  actions.setActionLoading(k, true);
  try {
    const res = await voteApi(roomId.value, props.item.id, { type });
    if (!res.ok) throw new Error((res as any).error.message);
    ElMessage.success("已提交");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    actions.setActionLoading(k, false);
  }
}
</script>

<template>
  <div
    class="group relative flex items-center gap-3 rounded-lg border border-white/5 bg-slate-900/50 p-2 transition-all hover:bg-slate-900/80"
    data-testid="queue-item"
  >
    <!-- Cover -->
    <div
      class="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-800"
    >
      <img
        v-if="item.song.coverUrl"
        :src="item.song.coverUrl"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-slate-600"
      >
        <Disc3 class="h-6 w-6" />
      </div>
    </div>

    <!-- Info -->
    <div class="min-w-0 flex-1">
      <div
        class="truncate text-sm font-medium text-slate-200 group-hover:text-white"
      >
        {{ item.song.title }}
      </div>
      <div class="truncate text-xs text-slate-500">
        {{ item.song.artist }}
        <span class="opacity-50">· @{{ item.requestedBy.displayName }}</span>
      </div>
    </div>

    <!-- Vote Score -->
    <div class="flex flex-col items-end gap-1">
      <div
        class="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-xs font-bold"
        :class="item.voteScore >= 0 ? 'text-emerald-400' : 'text-red-400'"
      >
        {{ item.voteScore > 0 ? "+" : "" }}{{ item.voteScore }}
      </div>
    </div>

    <!-- Hover Actions (Overlay) -->
    <div
      class="absolute inset-0 flex items-center justify-end gap-1 rounded-lg bg-slate-950/80 px-2 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm"
    >
      <Button
        size="icon"
        variant="ghost"
        class="h-8 w-8 text-emerald-400 hover:bg-emerald-500/20"
        :loading="upLoading"
        @click="vote('UP')"
      >
        <ThumbsUp class="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        class="h-8 w-8 text-red-400 hover:bg-red-500/20"
        :loading="downLoading"
        @click="vote('DOWN')"
      >
        <ThumbsDown class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
