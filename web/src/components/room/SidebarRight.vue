<script setup lang="ts">
import { ref } from "vue";
import { Search, Heart } from "lucide-vue-next";
import SongSearch from "@/components/room/search/SongSearch.vue";
import Favorites from "@/components/room/favorites/Favorites.vue";
import RoomSettings from "@/components/room/settings/RoomSettings.vue";
import { useRoomSelector } from "@/stores/useRoomStore";

const role = useRoomSelector((s) => s.currentUser?.role);
const activeTab = ref<"search" | "favorites">("search");
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-hidden">
    <!-- Main Content Area with Tabs -->
    <div class="glass flex flex-col rounded-2xl flex-1 min-h-0 overflow-hidden">
      <!-- Tab Header -->
      <div class="border-b border-white/5 px-2 py-2 shrink-0">
        <div class="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
          <button
            class="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              activeTab === 'search'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            "
            @click="activeTab = 'search'"
          >
            <Search class="w-3.5 h-3.5" />
            点歌
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="
              activeTab === 'favorites'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            "
            @click="activeTab = 'favorites'"
          >
            <Heart class="w-3.5 h-3.5" />
            收藏
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 min-h-0 overflow-hidden flex flex-col relative">
        <SongSearch
          v-if="activeTab === 'search'"
          class="h-full"
          :stripped="true"
        />
        <Favorites v-else class="h-full" />
      </div>
    </div>

    <!-- Settings at bottom if Host -->
    <div v-if="role === 'HOST'" class="shrink-0">
      <RoomSettings />
    </div>
  </div>
</template>
