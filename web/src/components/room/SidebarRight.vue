<script setup lang="ts">
import SongSearch from "@/components/room/search/SongSearch.vue";
import RoomSettings from "@/components/room/settings/RoomSettings.vue";
import { useRoomSelector } from "@/stores/useRoomStore";

const role = useRoomSelector((s) => s.currentUser?.role);
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <!-- Search is always visible and important -->
    <SongSearch class="flex-1 min-h-0" />

    <!-- Settings at bottom if Host -->
    <div v-if="role === 'HOST'" class="shrink-0">
      <RoomSettings />
    </div>
  </div>
</template>
