<script setup lang="ts">
import NowPlaying from "@/components/room/nowPlaying/NowPlaying.vue";
import QueueList from "@/components/room/queue/QueueList.vue";
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-hidden">
    <NowPlaying class="shrink-0" />
    <QueueList class="flex-1" />
  </div>
</template>
