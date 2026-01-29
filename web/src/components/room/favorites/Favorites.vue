<script setup lang="ts">
import { useFavorites } from "@/composables/useFavorites";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";
import { addQueueItem } from "@/api/rooms";
import { ElMessage } from "element-plus";
import { Play, Trash2, Heart } from "lucide-vue-next";
import type { Song } from "@/types/api";

const { favorites, removeFavorite } = useFavorites();
const roomId = useRoomSelector((s) => s.room?.id);
const actions = useRoomActions();
const queue = useRoomSelector((s) => s.queue);

function isQueued(songId: string) {
  return queue.value.some((item) => item.song.id === songId);
}

async function addToQueue(song: Song) {
  if (!roomId.value) return;
  if (isQueued(song.id)) {
    ElMessage.warning("队列中已存在该歌曲");
    return;
  }
  
  try {
    await addQueueItem(roomId.value, song);
    ElMessage.success("已点歌");
  } catch (e: any) {
    ElMessage.error(e.message || "点歌失败");
  }
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div v-if="favorites.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
      <Heart class="h-12 w-12 opacity-20" />
      <div class="text-sm">暂无收藏歌曲</div>
      <div class="text-xs opacity-50">在播放器或搜索结果中点击爱心收藏</div>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
      <div
        v-for="song in favorites"
        :key="song.id"
        class="group flex items-center gap-3 rounded-xl bg-white/5 p-2 hover:bg-white/10 transition-colors"
      >
        <img
          :src="song.coverUrl || 'https://via.placeholder.com/48'"
          class="h-10 w-10 rounded-md object-cover bg-black/20"
          alt="Cover"
        />
        <div class="flex-1 min-w-0">
          <div class="truncate text-sm font-medium text-white">
            {{ song.title }}
          </div>
          <div class="truncate text-xs text-slate-400">
            {{ song.artist || "未知歌手" }}
          </div>
        </div>
        
        <div class="flex items-center gap-1">
           <button
            class="rounded-lg p-2 text-slate-400 hover:bg-primary hover:text-white transition-colors"
            title="点歌"
            @click="addToQueue(song)"
          >
            <Play class="h-4 w-4 fill-current" />
          </button>
          <button
            class="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            title="移除收藏"
            @click="removeFavorite(song.id)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
