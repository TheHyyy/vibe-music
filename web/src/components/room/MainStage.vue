<script setup lang="ts">
import { ref } from "vue";
import { ListMusic, History } from "lucide-vue-next";
import NowPlaying from "@/components/room/nowPlaying/NowPlaying.vue";
import QueueList from "@/components/room/queue/QueueList.vue";
import RoomHistory from "@/components/room/history/RoomHistory.vue";
import { useRoomSelector } from "@/stores/useRoomStore";

const activeTab = ref<"queue" | "history">("queue");
const queue = useRoomSelector((s) => s.queue);
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-hidden">
    <NowPlaying class="shrink-0" />

    <div class="glass flex flex-col rounded-2xl flex-1 min-h-0 overflow-hidden">
      <!-- Tab Header -->
      <div class="border-b border-white/5 px-2 py-2 shrink-0">
        <div class="flex items-center gap-1 bg-black/20 p-1 rounded-lg w-fit">
          <button
            class="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              activeTab === 'queue'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            "
            @click="activeTab = 'queue'"
          >
            <ListMusic class="w-3.5 h-3.5" />
            待播放
            <span v-if="queue.length > 0" class="ml-0.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{{ queue.length }}</span>
          </button>
          <button
            class="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              activeTab === 'history'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            "
            @click="activeTab = 'history'"
          >
            <History class="w-3.5 h-3.5" />
            已播放
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 min-h-0 overflow-hidden flex flex-col relative">
        <QueueList v-if="activeTab === 'queue'" class="h-full" />
        <RoomHistory v-else class="h-full" />
      </div>
    </div>
  </div>
</template>
