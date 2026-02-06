<script setup lang="ts">
import { ElMessage } from "element-plus";
import { Disc3, Plus, History, Heart } from "lucide-vue-next";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";
import { requestSong } from "@/api/rooms";
import type { Song } from "@/types/api";
import Button from "@/components/ui/Button.vue";
import { useFavorites } from "@/composables/useFavorites";

const actions = useRoomActions();
const roomId = useRoomSelector((s) => s.room?.id);
const history = useRoomSelector((s) => s.history);
const actionLoading = useRoomSelector((s) => s.actionLoading);
const { isFavorite, toggleFavorite } = useFavorites();

const addLoadingKey = (id: string) => `queue:add:${id}`;
const isAdding = (id: string) => !!actionLoading.value[addLoadingKey(id)];

async function addSong(song: Song) {
  if (!roomId.value) return;
  const key = addLoadingKey(song.id);
  if (actionLoading.value[key]) return;

  actions.setActionLoading(key, true);

  // 乐观更新：立即在 UI 上显示
  const tempId = actions.addOptimisticQueueItem(song);

  try {
    const res = await requestSong(roomId.value, { song });
    if (!res.ok) throw new Error((res as any).error.message);
    ElMessage.success("已重新加入队列");
  } catch (e) {
    ElMessage.error((e as Error).message);
    // 失败回滚
    if (tempId) actions.removeQueueItem(tempId);
  } finally {
    actions.setActionLoading(key, false);
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div v-if="history.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-500">
      <History class="w-12 h-12 mb-2 opacity-20" />
      <p class="text-sm">暂无播放历史</p>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
      <div
        v-for="item in history"
        :key="item.id"
        class="group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-white/5 hover:bg-white/5"
      >
        <!-- Cover Art -->
        <div class="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-800">
          <img
            v-if="item.song.coverUrl"
            :src="item.song.coverUrl"
            class="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all"
            loading="lazy"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-slate-600">
            <Disc3 class="h-5 w-5" />
          </div>
          <div class="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
            <button
              class="text-white hover:scale-110 transition-transform"
              @click="addSong(item.song)"
              title="重新点歌"
            >
              <Plus class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="min-w-0 flex-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <div class="truncate text-sm font-medium text-slate-200">
            {{ item.song.title }}
          </div>
          <div class="flex items-center gap-2 truncate text-xs text-slate-500">
            <span class="truncate">{{ item.song.artist }}</span>
            <span class="text-slate-600">•</span>
            <span class="truncate">点歌: {{ item.requestedBy.displayName }}</span>
          </div>
        </div>

        <!-- Action -->
        <div class="flex items-center gap-1">
          <button
            class="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            :class="{
              'text-rose-500 hover:text-rose-400 opacity-100': isFavorite(item.song.id),
            }"
            @click.stop="toggleFavorite(item.song)"
            title="收藏"
          >
            <Heart class="h-4 w-4" :class="{ 'fill-current': isFavorite(item.song.id) }" />
          </button>
          <Button
            size="icon"
            variant="ghost"
            class="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
            :loading="isAdding(item.song.id)"
            @click="addSong(item.song)"
            title="重新点歌"
          >
            <Plus class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
